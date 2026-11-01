// Book 09's SD-WAN Design on Cisco Catalyst SD-WAN — a narrated research deck (about 15 minutes) presenting the
// implementation guide docs/books/guides/cisco-sdwan-implementation.md: the ED 26-03 gate and the KEV floor, the
// hosted-or-on-premises decision, the 12-hub fabric, policy and segmentation, hardening, certificates, FIPS and
// Common Criteria, TIC 3.0, SSE and Microsoft 365, evidence, the phased build, risks, vendor asks and the example.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Cisco_SDWAN.pptx
// Code model: ../research-ttm-servicenow-sailpoint/build.js: narration.js keyed by slide title, Detail block in
// the notes, the same table, panel, flow, fact-box and callout helpers.
// Every fact comes from the guide and its footnotes (CISA, Cisco, FedRAMP Marketplace, NIST CMVP, NIAP, DISA and
// Microsoft Learn sources opened October 24, 2026). Its labels are kept: (design guidance), (inference), "not an
// endorsement by any agency", and the program-design windows. Agency-neutral.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Book 09's SD-WAN Design on Cisco Catalyst SD-WAN", title: "Implementation guide",
  footer: "SD-WAN on Cisco Catalyst SD-WAN  ·  Implementation guide  ·  Research — under review" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "Research_Cisco_SDWAN.pptx";

// ------------------------------------------------------------------ helpers (as in research-ttm-servicenow-sailpoint)
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
  if (process.env.FIT) console.log(`  image ${base}: ${w.toFixed(2)} x ${h.toFixed(2)}, bottom ${(y + h).toFixed(2)} in`);
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

// The kit's full-width callout, with a fit check, at a chosen size.
const callout = (s, name, y, h, iconName, color, label, text, pt = 16) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * pt / 72) / 10.45) * pt / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! slide ${pres.slides.length} ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (h - need > 0.45) console.warn(`  ! slide ${pres.slides.length} ${name} callout has ${(h - need).toFixed(2)} in of slack`);
  if (process.env.FIT) console.log(`  callout ${name}: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  box(s, name, 0.6, y, 12.15, h, "FFFFFF", color);
  const d = Math.min(0.8, h - 0.2);
  icon(s, iconName, 0.85, y + (h - d) / 2, d, color);
  txt(s, `${name} text`, [{ text: label, options: { bold: true, color } }, { text }],
    { x: 1.9, y: y + 0.05, w: 10.65, h: h - 0.1, fontSize: pt, valign: "middle" });
  warn(`slide ${pres.slides.length} ${name} callout`, y + h);
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

// A tinted panel with a small caps label, a heading and bullets (or numbered steps). Returns its bottom edge.
// Pass h = null to size the panel to its content.
const panelNeed = (y, w, label, heading, items, pt) => {
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.35 : 0) + ((label || heading) ? 0.08 : 0);
  return { top, need: top + items.reduce((a, t) => a + lines(t, w - 0.7, pt) * pt / 72 * 1.2 + 0.05, 0) + 0.1 };
};
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13, numbered = false) => {
  const { top, need } = panelNeed(y, w, label, heading, items, pt);
  if (h == null) h = need - y;
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15.5, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const list = numbered
    ? items.map((t, k) => ({ text: t, options: { bullet: { type: "number" }, breakLine: k < items.length - 1, fontSize: pt } }))
    : bullets(items, pt);
  txt(s, `${name} list`, list, { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h - need > 0.6) console.warn(`  ! slide ${pres.slides.length} ${name} panel has ${(y + h - need).toFixed(2)} in of slack`);
  warn(`slide ${pres.slides.length} ${name} panel`, y + h);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  return y + h;
};
// The tallest need of a row of panels, so a row can share one height sized to its content.
const rowH = (y, w, specs) => Math.max(...specs.map(([label, heading, items, pt]) => panelNeed(y, w, label, heading, items, pt).need)) - y;

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
  return y + h;
};

// The "program design" marker on slides that carry the program's positions, labels or windows.
const design = (s, text, x = 0.6, y = 1.42, w = 12.15) =>
  txt(s, "Design label", text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color: HEX.amber, valign: "middle" });

const SUB = "Implementation guide  ·  Research — under review";
const PAGE = "Research, Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN";
const S0 = "Orientation";
const S1 = "Gate 0";
const S2 = "Build";
const S3 = "Harden";
const S4 = "Integrate";
const S5 = "Evidence and plan";
const S6 = "Close";
const W3 = (12.15 - 0.3) / 3;   // three panels across
const W2 = (12.15 - 0.15) / 2;  // two panels across

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Book 09's SD-WAN Design on Cisco Catalyst SD-WAN", SUB);
  T(s, "Session map", [
    { text: "THE PROGRAM'S PLATFORM, FOR NETWORK ENGINEERS  ·  ABOUT 15 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Gate 0: ED 26-03 and the KEV floor  ·  Hosted or on-premises  ·  The 12-hub fabric", options: { color: HEX.ink, breakLine: true } },
    { text: "Harden, certificates, FIPS  ·  TIC 3.0, SSE, Microsoft 365  ·  Evidence and the build", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.25, fontSize: 14, paraSpaceAfter: 2 });
  sources(s, "Sources: CISA, Cisco, FedRAMP Marketplace, NIST, NIAP, DISA and Microsoft Learn, opened Oct 24, 2026. An example, not an endorsement by any agency.", 6.08);
  notes(s,
`A narrated walk through the research implementation guide "Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN." Book 09 — Network & Transport sets the design: a governor (SD-WAN plus security services) at every branch before any new egress turns on, four branch egress patterns of which one is never allowed, lean and bulk path classes, a 12-hub field-office fabric with 24 consolidated distribution points, and decision records that become boundary-change evidence. Chapter 11 uses Cisco Catalyst edges as its costable example. The program builds on Cisco Catalyst SD-WAN as its existing platform, following its standing rule to consolidate on the incumbent rather than add a vendor (the SD-WAN platform deep dive). This guide shows how to build Book 09's design on it, and covers the part a build plan usually skips: the same product was the subject of a 2026 emergency directive, so the first gate in the build is proving the control plane is patched, hunted and hardened. An example, not an endorsement: the guide names one product to make Book 09's vendor-neutral design concrete; it isn't an endorsement by any agency, and Book 09's design doesn't depend on this vendor. Every product, directive and certification fact was checked against primary sources on October 24, 2026. Statements marked (design guidance) are the program's recommendations; statements marked (inference) are conclusions the sources support but don't state. Status: in review.`,
  `${PAGE} (opening; An example, not an endorsement); SD-WAN and SASE Platforms Against Book 09's Requirements (recommendation).`);
}

// ================================================================== 2 Why a directive
{
  const s = content(S0, "Why this guide starts with a directive");
  tag(s, "Why");
  img(s, "b09-network/ch05-governor-attack-surface",
    "A dashed red cluster labeled control and management plane with estate-wide authority holds three slate cards: a manager that configures and provisions every edge, a validator that authenticates and onboards edges, and a controller that distributes routes and policy. Dashed red arrows run from the manager and controller to an amber card for internet-facing edges, one per office, replacing a few hardened egress points. That leads to a green card of controls owed to the governor: MFA for privileged access and logging of privileged functions, hardened configuration and component inventory, flaw remediation on BOD 26-04 windows, end-of-support replacement under BOD 26-02, and management-plane logs held off-box. A red card notes ED 26-03 in 2026, an actively exploited authentication bypass in a widely used SD-WAN manager and controller.",
    0.6, 1.5, 5.3, 4.45);
  const x = 6.15, w = 6.6;
  const b1 = panel(s, "Design", x, 1.5, w, null, HEX.navy, HEX.navyTint, "BOOK 09 SETS THE DESIGN", "Vendor-neutral, made concrete here", [
    "A governor (SD-WAN plus security services) at every branch before any new egress turns on",
    "Four branch egress patterns, one never allowed; lean and bulk path classes",
    "A 12-hub field-office fabric; decision records as boundary-change evidence",
  ], 13);
  const b2 = panel(s, "Complication", x, b1 + 0.15, w, null, HEX.red, HEX.redTint, "THE PART A BUILD PLAN USUALLY SKIPS", "This product was under a 2026 emergency directive", [
    "CISA's KEV catalog now lists nine Catalyst SD-WAN vulnerabilities",
    "Every 2026 advisory lists Cisco's hosted FedRAMP environment as affected",
    "So the first gate: prove the control plane is patched, hunted and hardened",
  ], 13);
  warn("why panels", b2);
  sources(s, "Sources: research page (opening; What the research found); CISA KEV catalog v2026.10.23; Cisco advisory cisco-sa-sdwan-rpa2-v69WY2SW; Book 09, Ch 05 (figure).");
  notes(s,
`Book 09 sets the design: a governor (SD-WAN plus security services) at every branch before any new egress turns on; four branch egress patterns, of which one is never allowed; lean and bulk path classes; a 12-hub field-office fabric with 24 consolidated distribution points; and decision records that become boundary-change evidence. Chapter 05's figure shows the governor's own exposure: an estate-wide control and management plane (a manager that configures and provisions every edge, a validator that authenticates and onboards edges, a controller that distributes routes and policy), internet-facing edges, one per office, replacing a few hardened egress points, and the controls owed to the governor. The part a build plan usually skips: Catalyst SD-WAN was the subject of a 2026 emergency directive, ED 26-03. The directive's scope has grown since Book 09 recorded it: CISA's KEV catalog now lists nine Catalyst SD-WAN vulnerabilities; Cisco has added the Validator to the advisory for the original authentication bypass; and every 2026 advisory lists Cisco's hosted FedRAMP environment among the affected deployment types. So the first gate in the build is proving the control plane is patched, hunted and hardened. Book 09 Chapter 13's step zero: bring the governor under vulnerability management, privileged-access control and off-box logging before it carries production traffic.`,
  `${PAGE} (opening; What the research found; Gate 0).`);
}

// ================================================================== 3 ED 26-03
{
  const s = content(S1, "ED 26-03: what it required, and when");
  tag(s, "What");
  const b = table(s, "ED actions", 1.5, [0.5, 8.0, 3.65], ["#", "Action, in the identified order", "Original deadline"], [
    ["1", "Identify every in-scope system; send the inventory to CISA on its template", "11:59 PM ET, Feb 26, 2026"],
    ["2", "Collect: logs stored centrally, off the SD-WAN; admin-tech dump, /home, external syslogs; disk and memory snapshot (cloud-hosted: ask Cisco, plus AWS network logs); all SD-WAN syslog to CISA through CLAW", "Feb 26, 2026; CLAW by Mar 23, 2026"],
    ["3", "Update to Cisco's fixed releases", "5:00 PM ET, Feb 27, 2026"],
    ["4", "Hunt with the supplemental guidance; on root compromise, report and rebuild Manager, Controller and Validator from patched images", "—"],
    ["5", "Harden with the supplemental guidance", "Report by Mar 12, 2026"],
    ["6", "Report: summary, detailed inventory, hardening actions, log delivery", "Feb 26, Mar 5, Mar 12 and Mar 23, 2026"],
  ], { fontSize: 12 });
  const c = callout(s, "Position", b + 0.18, 0.9, "FaClipboardCheck", HEX.amber, "Program position (design guidance): ",
    "the deadlines are past and the page isn't marked closed. A new deployment runs the same sequence anyway; whether it must report is a question for CISA (vendor ask 12).", 14);
  warn("ed", c);
  sources(s, "Sources: CISA, ED 26-03, Feb 25, 2026; V1 updated Mar 11, 2026 (scope, required actions in order, deadlines, reports, cloud-hosted artifacts, CLAW). Oct 24, 2026.");
  notes(s,
`CISA issued ED 26-03, Mitigate Vulnerabilities in Cisco SD-WAN Systems, on February 25, 2026. Version 1, updated March 11, 2026, supersedes the original required actions and adds a log-delivery action and a fourth report. Scope: Catalyst SD-WAN Manager "regardless of configuration" and Catalyst SD-WAN Controller, on federal information systems managed on agency networks or hosted by third parties on an agency's behalf. The actions "MUST be taken in the identified order." 1, Identify every in-scope system and send the inventory to CISA on its template, by 11:59 PM ET, February 26, 2026. 2, Collect: store logs outside the SD-WAN, centrally; take an admin-tech dump (parts of /opt and /var), a copy of /home, and external syslogs. On-premises, add a virtual disk and memory snapshot and firewall, switch and router logs. Cloud-hosted, ask Cisco for the snapshot and the AWS network logs. And send all Cisco SD-WAN syslog, past, current and future, plus other applicable cloud logs, to CISA through CLAW: February 26, 2026; CLAW by March 23, 2026. 3, Update to Cisco's fixed releases by 5:00 PM ET, February 27, 2026. 4, Hunt using the supplemental guidance; if a root account is compromised, report it to CISA and rebuild Manager, Controller and Validator from patched images, then migrate the edges. 5, Harden using the supplemental guidance; report by March 12, 2026. 6, Report: a summary, a detailed inventory with actions and results, hardening actions, and log delivery, on February 26, March 5, March 12 and March 23, 2026. The directive page still calls CLAW by its older name, "Cloud Logging Aggregation Warehouse"; Chapter 03 explains the rename. The deadlines are past. The page isn't marked closed, and whether a fabric deployed after March 2026 must report under it is a question for CISA (vendor ask 12). The program's position is that a new deployment performs the same sequence anyway, because it's the best published definition of a clean control plane (design guidance).`,
  `${PAGE} (Gate 0: What the directive requires).`);
}

// ================================================================== 4 KEV
{
  const s = content(S1, "Nine exploited flaws: a standing posture");
  tag(s, "Why");
  const b = table(s, "KEV", 1.5, [3.45, 6.65, 2.05], ["CVE", "What it is", "In KEV"], [
    ["CVE-2026-20127", "Authentication bypass to administrative privileges; Controller, Manager and Validator", "Feb 25, 2026"],
    ["CVE-2022-20775", "CLI path traversal to root; attempted exploitation seen February 2026", "Feb 25, 2026"],
    ["CVE-2026-20122, -20128, -20133", "Manager file overwrite, recoverable credential file, information disclosure", "Apr 20, 2026"],
    ["CVE-2026-20182", "Second authentication bypass; Controller, Manager and Validator", "May 14, 2026"],
    ["CVE-2026-20245", "Privilege escalation to root; configuration pushed to edges in some cases", "Jun 9, 2026"],
    ["CVE-2026-20262", "Manager arbitrary file write", "Jun 15, 2026"],
    [{ text: "CVE-2026-76504", options: { bold: true, color: HEX.red } }, "Manager API authentication bypass through URI encoding; sets today's Manager floor", { text: "Sep 30, 2026 (due Oct 3)", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 12 });
  const c = callout(s, "Cadence", b + 0.18, 0.9, "FaArrowsRotate", HEX.navy, "Since July 2026: ",
    "Cisco publishes advisories on the first and third Wednesday, with seven days' notice, out of cycle for active exploitation, with \"umbrella\" CVEs. That is the intake for BOD 26-04 windows.", 14);
  warn("kev", c);
  sources(s, "Sources: CISA KEV catalog, JSON feed v2026.10.23; Cisco advisories rpa, sd-wan-priv, authbp, rpa2, privesc, arbfw, webauth; Cisco risk-based disclosure page. Oct 24, 2026.");
  notes(s,
`CISA's KEV catalog (version 2026.10.23) now lists nine Catalyst SD-WAN vulnerabilities. Six carry Emergency Directive 26-03's mitigation instructions, and three more were added in June and September 2026 under BOD 26-04. CVE-2026-20127: authentication bypass to administrative privileges, affecting Controller, Manager and Validator; in KEV February 25, 2026 (cisco-sa-sdwan-rpa-EHchtZk; Cisco added the Validator in version 2.0, June 16, 2026). CVE-2022-20775: CLI path traversal to root; Cisco saw attempted exploitation in February 2026; in KEV February 25, 2026. CVE-2026-20122, CVE-2026-20128 and CVE-2026-20133: Manager arbitrary file overwrite, recoverable credential file, information disclosure, exploited from March and April 2026; in KEV April 20, 2026. CVE-2026-20182: second authentication bypass, affecting Controller, Manager and Validator; in KEV May 14, 2026. CVE-2026-20245: privilege escalation to root from netadmin, or by chaining the two bypasses; Cisco saw configuration pushed to edges; in KEV June 9, 2026. CVE-2026-20262: Manager arbitrary file write; in KEV June 15, 2026. CVE-2026-76504: Manager API authentication bypass through URI encoding; added September 30, 2026, with a three-day due date (October 3); it sets today's floor for SD-WAN Manager. Every 2026 advisory lists Cisco's hosted FedRAMP environment among the affected deployment types. Cadence: since July 2026, Cisco publishes hardening releases and advisories on the first and third Wednesday of each month, with seven days' advance notice; it still releases out of cycle for active exploitation, and groups bugs that share a weakness under "umbrella" CVEs. That cadence is the intake for BOD 26-04's change windows (Chapter 05).`,
  `${PAGE} (What the research found; The nine KEV entries and their fixes; The gate, as a checklist).`);
}

// ================================================================== 5 Floor
{
  const s = content(S1, "The fixed-release floor, train by train");
  tag(s, "What");
  design(s, "(INFERENCE) READ FROM CISCO'S ADVISORY TABLES TOGETHER  ·  RE-READ THE ADVISORIES AT BUILD TIME");
  const b = table(s, "Floor", 1.78, [2.0, 4.0, 6.15], ["Train", "SD-WAN Manager at or above", "Controller and Validator at or above"], [
    ["20.9", "20.9.10.1", "20.9.9.2"],
    ["20.12", "20.12.8.2", "20.12.7.2"],
    ["20.15", "20.15.6.1", "20.15.5.3 (or 20.15.4.5 on the 20.15.4 branch)"],
    ["20.18", "20.18.4.1", "20.18.3.1"],
    ["26.1", "26.1.2.1", "26.1.1.2"],
    ["26.2", "26.2.1", "Not listed in three advisories; confirm with Cisco (vendor ask 4)"],
  ], { fontSize: 12.5 });
  const items = [
    ["NO FIX OF THEIR OWN", "Trains 20.10, 20.11, 20.13, 20.14, 20.16", ["Cisco's tables say migrate", "Check each hop against Cisco's upgrade and compatibility matrices"], HEX.amber, HEX.amberTint],
    ["THE EDGES, ON IOS XE (DESIGN GUIDANCE)", "Their own KEV entries: web UI and SNMP", ["HTTP server off on every edge; SNMPv3 only, behind an access list", "Track IOS XE advisories as a separate feed"], HEX.navy, HEX.navyTint],
    ["UNTIL THE UPGRADE", "Live Protect shields", ["Cisco calls them \"temporary partial protection\""], HEX.red, HEX.redTint],
  ];
  const y = b + 0.18;
  const h = rowH(y, W3, items.map((i) => [i[0], i[1], i[2], 12.5]));
  items.forEach((it, k) => panel(s, `Floor note ${k + 1}`, 0.6 + k * (W3 + 0.15), y, W3, h, it[3], it[4], it[0], it[1], it[2], 12.5));
  sources(s, "Sources: Cisco advisories rpa (v2.0), authbp (v1.3), rpa2 (v2.0), privesc (v1.10), arbfw (v1.1), webauth (v1.1); CISA KEV catalog (IOS XE entries). Oct 24, 2026.");
  notes(s,
`Reading Cisco's fixed-release tables together gives today's floor for control components (inference; re-read the advisories at build time). Train 20.9: SD-WAN Manager at or above 20.9.10.1; Controller and Validator at or above 20.9.9.2. Train 20.12: Manager 20.12.8.2; Controller and Validator 20.12.7.2. Train 20.15: Manager 20.15.6.1; Controller and Validator 20.15.5.3, or 20.15.4.5 on the 20.15.4 branch. Train 20.18: Manager 20.18.4.1; Controller and Validator 20.18.3.1. Train 26.1: Manager 26.1.2.1; Controller and Validator 26.1.1.2. Train 26.2: Manager 26.2.1; the Controller and Validator aren't listed in three advisories, so confirm with Cisco (vendor ask 4: is 26.2 fixed against CVE-2026-20182, CVE-2026-20245 and CVE-2026-20262?). Trains 20.10, 20.11, 20.13, 20.14 and 20.16 have no fix of their own; Cisco's tables say migrate. The edges have their own catalog entries on IOS XE: the web UI pair CVE-2023-20198 and CVE-2023-20273, and the SNMP flaw CVE-2025-20352. Keep the HTTP server off on every edge, run SNMPv3 only behind an access list, and track IOS XE advisories as a separate feed (design guidance). Cisco's Live Protect shields can cover the gap until an upgrade, but Cisco calls them "temporary partial protection."`,
  `${PAGE} (The nine KEV entries and their fixes; The gate, as a checklist).`);
}

// ================================================================== 6 Hunt and harden
{
  const s = content(S1, "Hunt and harden: CISA's companion guidance");
  tag(s, "How");
  const specs = [
    ["WHAT CISA FOUND", "Assume it may predate you", [
      "CVE-2026-20127 was exploited as a zero-day",
      "The rogue device \"appears as a new, temporary, and legitimate SD-WAN component\"",
      "Lateral movement; logs and history cleared",
      "Activity \"likely began in 2023\": hunt back that far",
    ], 12.5, HEX.red, HEX.redTint],
    ["THE SIX-PART HUNT", "A to F", [
      "A. Software downgrades, unexpected reboots",
      "B. Application reversion within 15 minutes",
      "C. Rogue peering; validate every peered edge",
      "D. SSH abuse via vmanage-admin's keys",
      "E. Root sign-ins and new accounts",
      "F. Cleared logs and shell histories",
    ], 12.5, HEX.navy, HEX.navyTint],
    ["HARDENING HIGHLIGHTS", "CISA and Cisco", [
      "Client, server and CLI timeouts of 5 minutes",
      "Pairwise IPsec keys; DTLS; SNMPv3 only",
      "Enterprise-CA certificate on the Manager",
      "SIEM alerts on peering from unknown IPs; root sign-in = compromise",
      "Allow-list known addresses; VPN 512 isolated",
    ], 12.5, HEX.teal, HEX.tealTint],
  ];
  const h = rowH(1.5, W3, specs);
  specs.forEach((p, k) => panel(s, `Hunt ${k + 1}`, 0.6 + k * (W3 + 0.15), 1.5, W3, h, p[4], p[5], p[0], p[1], p[2], p[3]));
  const c = callout(s, "Gate", 1.5 + h + 0.18, 0.9, "FaListCheck", HEX.amber, "The gate (design guidance): ",
    "no production traffic until inventory, the floor, the hunt, off-box logs and CLAW, hardening, and CISA's answer on reporting are closed and evidenced. Re-run on every KEV addition.", 14);
  warn("hunt", c);
  sources(s, "Sources: CISA, Supplemental Direction ED 26-03: Hunt and Hardening Guidance for Cisco SD-WAN Systems; Cisco Catalyst SD-WAN Hardening Guide, rev. 1.1, Feb 9, 2026.");
  notes(s,
`The supplemental hunt and hardening guidance gives the background: CVE-2026-20127 was exploited as a zero-day; the attacker's rogue device "appears as a new, temporary, and legitimate SD-WAN component"; partners observed lateral movement and the clearing of logs and history; activity "likely began in 2023," so hunts should reach back that far. Its hunt checklist has six parts: A, software downgrades and unexpected reboots; B, application reversion within 15 minutes of a downgrade; C, rogue peering, by peer type, by peer-system-IP outliers, by a remote color of (null) or {28 0}, and by validating every peered edge in the Manager UI; D, SSH abuse through vmanage-admin's authorized keys; E, root sign-ins and new accounts; F, cleared logs and shell histories. It draws on the joint Cisco SD-WAN Threat Hunt Guide that CISA wrote with the Australian Signals Directorate's ACSC and other partners. Hardening highlights (CISA's supplemental guidance and Cisco's Hardening Guide, revision 1.1, February 9, 2026): client, server and CLI inactivity timeouts of 5 minutes (Cisco's defaults are 30); DTLS for Manager connections, SNMPv3 only, pairwise IPsec keys rather than Controller-distributed keys; replace the Manager's self-signed web certificate with one from the enterprise root CA; SIEM alerts on Manager or Controller peering from an unknown public IP and on "Authentication succeeded for" matched to authorized users, with any root sign-in treated as compromise; a firewall admitting only known edge, Controller, Validator and Manager addresses, with static addresses on every edge; VPN 512 on an isolated management VLAN. The gate, as a checklist (design guidance): the fabric carries no production traffic until every line is closed and evidenced. 1, inventory every control component and edge, with release, serial and site. 2, run every control component at or above the floor; the example script's gate CSV must show no fail or confirm rows. 3, run the six-part hunt and keep the artifacts; on a rebuild, start from patched images, with new administrator accounts and unique credentials. 4, store logs off-box in the SIEM and confirm SD-WAN syslog is reaching CLAW. 5, close the hardening checklist. 6, record CISA's answer on reporting. Re-run lines 1 and 2 on every KEV addition and on each Cisco publication day.`,
  `${PAGE} (What the directive requires; The gate, as a checklist; Hardening).`);
}

// ================================================================== 7 Hosted or on-premises
{
  const s = content(S2, "Hosted or on-premises, and why the gate stays");
  tag(s, "Who");
  const specs = [
    ["FEDRAMP MARKETPLACE", "Catalyst SD-WAN for Government", [
      "SDWAN-G, FR2012534927: FedRAMP Certified, Class C (Moderate), agency path",
      "Certified Mar 14, 2024; five agency authorizations",
      "Boundary in AWS GovCloud (US); a Cisco federal operations team runs it",
      "Customers use the SD-WAN Portal; no access to the AWS boundary",
    ], 12, HEX.navy, HEX.navyTint, false],
    ["RECOMMENDATION (DESIGN GUIDANCE)", "Build on SDWAN-G by default", [
      "CISA's hardening guidance points to FedRAMP cloud",
      "Cisco patches the control plane",
      "The boundary disposition becomes an inherited, certified service",
      "It removes the 14-VM build",
    ], 12, HEX.teal, HEX.tealTint, true],
    ["CHOOSE ON-PREMISES WHEN", "Any of these holds", [
      "High impact, or isolated from the internet: SDWAN-G is Moderate",
      "The authorizing official requires custody of forensic images",
      "Cisco can't commit to KEV due dates for the government environment",
    ], 12, HEX.amber, HEX.amberTint, false],
  ];
  const h = rowH(1.5, W3, specs);
  specs.forEach((p, k) => panel(s, `Model ${k + 1}`, 0.6 + k * (W3 + 0.15), 1.5, W3, h, p[4], p[5], p[0], p[1], p[2], p[3], p[6]));
  const c = callout(s, "Gate stays", 1.5 + h + 0.18, 1.15, "FaTriangleExclamation", HEX.red, "Hosting doesn't remove the gate: ",
    "every 2026 advisory lists the FedRAMP environment; the directive says ask Cisco for forensic images and AWS logs; CLAW participation is required. Edges, logs, Portal allow-lists, roles and SSO stay the agency's.", 14);
  warn("hosted", c);
  sources(s, "Sources: FedRAMP Marketplace products.json (FR2012534927); Cisco SD-WAN for Government guide; CISA ED 26-03 and Supplemental Direction; Cisco advisory rpa2. Oct 24, 2026.");
  notes(s,
`The decision to make first: hosted or on-premises. Cisco offers on-premises control components, Cisco-hosted fabrics, and Cisco SD-WAN for Government, its FedRAMP environment. The FedRAMP Marketplace lists "Cisco Catalyst SD-WAN for Government (SDWAN-G)," package FR2012534927: FedRAMP Certified, Class C (Moderate), agency path, certified March 14, 2024, with five agency authorizations; next ongoing certification report February 22, 2027; secure-configuration guidance, Cisco's Catalyst SD-WAN Hardening Guide. Cisco's government guide adds: the boundary is in AWS GovCloud (US); a Cisco federal operations team maintains and monitors it; customers manage their overlay through the SD-WAN Portal, allow trusted IP addresses there, and have no access to the AWS boundary; FedRAMP compliance requires Manager 20.12.1.1 and IOS XE 17.9.1a or later. Recommendation (design guidance): build on SDWAN-G unless an on-premises trigger applies. Four reasons. 1, CISA's guidance points there: the directive's own hardening guidance says federal organizations should move to FedRAMP-compliant cloud infrastructure ("Host Infrastructure in GovCloud"). 2, Cisco patches the control plane: nine known-exploited vulnerabilities in eight months, several with three-day due dates, is a patch tempo few agency network teams can hold on their own controllers. For CVE-2026-76504, Cisco fixed its Cisco-managed cloud release with no user action needed; whether the government environment had the same treatment isn't stated (vendor ask 1). 3, it answers Chapter 05's boundary question: the controller's boundary disposition becomes an inherited, certified service rather than a new component in the agency's package. 4, it removes the 14-VM build; Chapter 11's on-premises control-plane line is replaced by a subscription the cost model doesn't yet price (vendor ask 3). Hosting doesn't remove the gate: every 2026 advisory lists the FedRAMP environment as affected; the directive tells agencies with cloud-hosted fabrics to ask Cisco for forensic images and AWS network logs; and CISA requires agencies with cloud-hosted SD-WAN to participate in CLAW, including the AWS logs. The edges, the logs, the Portal allow-lists, administrator roles and single sign-on stay the agency's. Choose on-premises (design guidance) when the system is High impact or must run isolated from the internet (SDWAN-G is certified at Moderate), when the authorizing official requires agency custody of forensic images, or when Cisco can't commit to KEV due dates for the government environment.`,
  `${PAGE} (The decision to make first: hosted or on-premises).`);
}

// ================================================================== 8 12-hub fabric
{
  const s = content(S2, "The 12-hub fabric on Catalyst SD-WAN");
  tag(s, "What");
  img(s, "b09-network/ch11-hub-content-tier",
    "Top: a cluster of two data centers, the headquarters data center and the disaster recovery facility, each with two standard source distribution points holding the full content library, an SD-WAN control plane instance and internet breakout. Both feed a box for ten regional hubs, the primary data center as the pull source and the secondary as a dashed secondary source. The regional hubs hold two pull distribution points each, twenty in all, carrying targeted content, plus SD-WAN aggregation, regional breakout, security service edge enforcement and, later, Connected Cache on its own host. Beside the hubs a capacity note reads: 24 distribution points times 4,000 clients equals 96,000; about 70,000 endpoints, an assumption, is 73 percent utilization. The hubs connect over the SD-WAN overlay to a field office box for about 1,500 sites with a dedicated internet access circuit sized to seats, a 5G secondary path for continuity only, and no local distribution point. The field office leads to two green boxes: content stays local through peer cache, BranchCache and Delivery Optimization peers, one WAN copy per site rather than per client; and cloud-sourced content such as Windows and Microsoft 365 Apps updates, Defender definitions and Intune Win32 apps is delivered over the branch circuit.",
    0.6, 1.5, 4.75, 4.3);
  const x = 5.6, w = 7.15;
  const b = table(s, "Components", 1.5, [1.55, 5.6], ["Part", "What it does on Catalyst SD-WAN"], [
    ["Manager", "Configuration, policy authoring, monitoring, the REST API"],
    ["Validator", "First-line authentication of edges; NAT traversal"],
    ["Controller", "Routes and centralized policy to every edge over OMP"],
    ["Edges", "One per office; a C8500L high-availability pair at each hub; hub-and-spoke to a regional and a secondary hub (design guidance)"],
  ], { fontSize: 12, x });
  const b2 = panel(s, "Sizing", x, b + 0.15, w, null, HEX.teal, HEX.tealTint, "ON-PREMISES SIZING, RELEASE 20.18, 1,500–2,000 DEVICES", "Seven VMs per data center, 14 in all", [
    "Manager: three-node Medium cluster, 32 vCPU, 64 GB, 1 TB per node",
    "Two Controllers (8 vCPU, 16 GB); two Validators (4 vCPU, 8 GB)",
    "Ceiling 2,000 devices; about 1,524 edges uses 76% (inference)",
  ], 12.5);
  warn("fabric", b2);
  sources(s, "Sources: Cisco 20.18 Recommended Computing Resources; FedRAMP Marketplace (FR2012534927 description); Cisco advisory rpa (renaming); Book 09, Ch 11 (figure).");
  notes(s,
`Catalyst SD-WAN has four parts, and Cisco's FedRAMP listing describes them in the same words Book 09 uses for the governor. Manager (formerly vManage): the management plane, configuration, policy authoring, monitoring and the REST API; hosted, or a three-node cluster per data center. Validator (formerly vBond): orchestration, first-line authentication of edges and NAT traversal; hosted, or two per data center. Controller (formerly vSmart): the control plane, routes and centralized policy to every edge over OMP; hosted, or two per data center. Branch and hub edges: WAN edges on IOS XE in controller mode (Catalyst 8200L, 8200, 8300 and 8500L in Chapter 11's BOM), the data plane with overlay tunnels, application-aware routing and local enforcement; always agency equipment. Cisco renamed the components from release 20.12.1 and IOS XE 17.12.1a. Chapter 11's estate on Catalyst (design guidance): 1,500 offices in tiers S, M and L get one edge per office, with HSECK9 licenses wherever encrypted throughput exceeds 250 Mbps; 12 hubs (2 data centers and 10 regional hubs) get a high-availability pair of C8500L edges each, hub-and-spoke from each office to its regional hub and to a secondary hub; the control plane is hosted (SDWAN-G), or a Manager cluster, two Controllers and two Validators at each data center. On-premises sizing for 1,500 to 2,000 devices on release 20.18: a Manager cluster ("Three Node Medium") of 3 nodes at 32 vCPU, 64 GB RAM and 1 TB storage, up to 2,000 devices per cluster; 2 Controllers at 8 vCPU and 16 GB RAM, covering 1,000 to 2,500 devices; 2 Validators at 4 vCPU and 8 GB RAM, covering 1,000 to 4,000 devices. That's seven virtual machines per site, or 14 across two sites, the figure in Chapter 11's bill of materials. Cisco's disaster-recovery design runs an active Manager cluster in one data center and a standby cluster in a second. The cluster's ceiling is 2,000 devices; Chapter 11's fleet of about 1,524 edges uses 76% of it (inference). Beyond 2,000 devices, Cisco's sizing says to deploy multiple overlays; about 476 more edges, whether new offices or cloud gateways, would need a second overlay (inference). Topology: hub-and-spoke is the base design; Cisco's Multi-Region Fabric is an option (regional hubs become border routers into a core region, with core-region Controllers that "must be dedicated/exclusive"), but its FAQ dates from June 2024 and recommends 20.9/17.9, so read it as dated; adopt it only if the pilot shows a need (design guidance).`,
  `${PAGE} (Orientation; On-premises sizing; Policy: Topology).`);
}

// ================================================================== 9 Path classes
{
  const s = content(S2, "Path classes and lane discipline");
  tag(s, "How");
  design(s, "(DESIGN GUIDANCE) THE CATALYST CONSTRUCT FOR EACH BOOK 09 CLASS");
  const b = table(s, "Classes", 1.78, [3.0, 9.15], ["Book 09 class", "Catalyst construct"], [
    ["Lean: consensus, clock sync, voice, sign-in, interactive", "A custom SLA class with thresholds from the pilot's measured baseline, not the defaults; preferred color the DIA circuit, backup the 5G path; FEC and packet duplication on dual-circuit sites"],
    ["Bulk: backups, patch and content waves, re-sync", "The Bulk SLA class on the DIA color only, with a data policy that excludes the 5G color; QoS so bulk can't queue ahead of the lean class"],
    ["Path parity (TIC 3.0)", "Every color that can reach the internet lands on the same SSE policy, so no path has less rigor"],
  ], { fontSize: 12.5 });
  const y = b + 0.18;
  const specs = [
    ["APPLICATION-AWARE ROUTING (CISCO)", "What the platform gives you", [
      "SLA thresholds: loss 1–100%, latency and jitter 1–1,000 ms",
      "Six user-defined classes on most edges; 7 on the 8300, 15 on the 8500",
      "BFD probes: 1-second hellos, 10-minute poll, multiplier 6",
      "No path meets the SLA: fallback-to-best-path, preferred and backup colors, strict mode",
    ], 12, HEX.navy, HEX.navyTint],
    ["LANE DISCIPLINE", "Holds on Catalyst too", [
      "The program observes, reconciles and emits evidence",
      "Manager and the Controllers route and enforce",
      "So the example script is read-only",
    ], 12, HEX.teal, HEX.tealTint],
  ];
  const pw = [7.3, 12.15 - 7.3 - 0.15];
  const h = Math.max(rowH(y, pw[0], [specs[0]]), rowH(y, pw[1], [specs[1]]));
  specs.forEach((p, k) => panel(s, `Policy ${k + 1}`, k ? 0.6 + pw[0] + 0.15 : 0.6, y, pw[k], h, p[4], p[5], p[0], p[1], p[2], p[3]));
  sources(s, "Sources: Cisco Policies Configuration Guide, IOS XE 17.x, Application-Aware Routing (updated Dec 19, 2025); research page (Policy: path classes and lane discipline).");
  notes(s,
`Book 09's lean and bulk classes (Chapters 05 and 08) map onto application-aware routing. SLA classes set thresholds for loss (1–100%), latency and jitter (1–1,000 ms). Platform limits: most edges support six user-defined classes; the Catalyst 8300 supports seven and the 8500 fifteen, from 17.6.1a. Defaults from 17.15.1a (loss %, latency ms, jitter ms): Voice-And-Video 2, 300, 60; Transactional Data 1, 200, 200; Bulk Data 5, 500, 500. Path probes are BFD: 1-second hellos, a 10-minute poll interval and a multiplier of 6. When no path meets the SLA, fallback-to-best-path, preferred and backup preferred colors, and strict mode decide what happens. The mapping (design guidance). Lean (consensus, clock synchronization, voice, sign-in, interactive): a custom SLA class with thresholds taken from the pilot's measured baseline, not the defaults; preferred color the DIA circuit, backup the 5G path; FEC and packet duplication on dual-circuit sites (Chapter 05 cites Cisco's FEC and duplication pages). Bulk (backups, patch and content waves, re-sync): the Bulk SLA class on the DIA color only, with a data policy that excludes the 5G color; QoS so bulk can't queue ahead of the lean class. Path parity (TIC 3.0): every color that can reach the internet lands on the same SSE policy, so no path has less rigor (Chapter 05). Lane discipline holds on Catalyst too: the program observes, reconciles and emits evidence; Manager and the Controllers route and enforce. The example script is read-only for that reason.`,
  `${PAGE} (Policy: path classes and lane discipline).`);
}

// ================================================================== 10 Segmentation
{
  const s = content(S3, "Segmentation and network access control");
  tag(s, "How");
  design(s, "(DESIGN GUIDANCE) VPN 0 FOR TRANSPORT, VPN 512 FOR MANAGEMENT OUT OF BAND; SERVICE VPNS MAP TO BOOK 09 CH 07'S SEGMENTS");
  const tw = 7.3;
  const b = table(s, "Segments", 1.78, [1.9, 5.4], ["Ch 07 segment", "Service VPN treatment"], [
    ["Production", "Corporate service VPN; reaches the hubs and the SSE"],
    ["Remediation", "Separate VPN reaching only management, update and antivirus endpoints"],
    ["Quarantine", "Local only, with no route into the overlay"],
    ["IoT and OT", "Separate VPN reaching only each class's management systems"],
    ["Guest", "DIA through the SSE only; no route to agency resources"],
  ], { fontSize: 12.5 });
  const pb = panel(s, "ISE", 0.6 + tw + 0.15, 1.78, 12.15 - tw - 0.15, null, HEX.navy, HEX.navyTint, "CISCO ISE FITS IN TWO WAYS", "Tags or identity firewall", [
    "Security group tags: inline from TrustSec switches, or learned over SXP from ISE (from IOS XE 17.3.1a)",
    "Identity-based firewall: ISE users and groups through pxGrid (from 17.9.1a)",
    "From 20.18.2/17.18.2, Manager is the hub for ISE (needs ISE 3.2 or later)",
  ], 12.5);
  const c = callout(s, "FIPS trade", Math.max(b, pb) + 0.18, 0.9, "FaTriangleExclamation", HEX.red, "TrustSec isn't supported with FIPS mode on. ",
    "If the edges must run FIPS mode, segment by VPN and leave SGT enforcement to the access switches (design guidance). Chapter 07's posture and CoA design doesn't depend on the WAN edge.", 14);
  warn("seg", c);
  sources(s, "Sources: Cisco Hardening Guide rev. 1.1; Cisco, TrustSec SGT Inline and SXP Propagation (doc 222699); Security Configuration Guide 17.x (firewall; TrustSec). Oct 24, 2026.");
  notes(s,
`Use VPN 0 for transport and VPN 512 for management, out of band (Cisco's Hardening Guide). Map service VPNs to Chapter 07's admission segments (design guidance). Production: corporate service VPN; reaches the hubs and the SSE. Remediation: separate VPN that reaches only management, update and antivirus endpoints. Quarantine: local only, with no route into the overlay. IoT and OT: separate VPN reaching only each class's management systems. Guest: DIA through the SSE only, with no route to agency resources. Cisco ISE fits in two ways. Security group tags: edges carry SGTs inline from TrustSec switches, or learn them over SXP from ISE, from IOS XE 17.3.1a. Identity-based firewall: edge firewall rules can use ISE users and groups through pxGrid from 17.9.1a; from 20.18.2/17.18.2, SD-WAN Manager acts as the hub for ISE, which needs ISE 3.2 or later. Cisco says TrustSec isn't supported with FIPS mode on (the PAC key download fails). If the edges must run in FIPS mode, segment by VPN and leave SGT enforcement to the access switches (design guidance). Chapter 07's posture and Change of Authorization design doesn't depend on the WAN edge.`,
  `${PAGE} (Segmentation and network access control).`);
}

// ================================================================== 11 Certificates
{
  const s = content(S3, "Certificates and onboarding from the agency PKI");
  tag(s, "How");
  const specs = [
    ["OUT OF THE BOX", "Cisco's PKI", [
      "Control components and cloud edges use Cisco PKI",
      "Hardware edges use the SUDI certificate in their trust chip",
      "Edges join only if their serial is on the authorized WAN edge list",
      "Cisco no longer sponsors Symantec/DigiCert certificates for control components",
    ], 12, HEX.navy, HEX.navyTint, false],
    ["ENTERPRISE CERTIFICATE, IOS XE 17.18.1A", "The agency's own CA", [
      "Issues to control components and to hardware and software WAN edges",
      "Enrollment: manual, EST or SCEP",
      "Auto-renewal only at onboarding, or migration from SUDI",
      "Later: \"manual intervention is required\" on an expiry alarm",
    ], 12, HEX.red, HEX.redTint, false],
    ["THREE ITEMS CLOSE IT (DESIGN GUIDANCE)", "A build plus a procedure", [
      "Issue from the retained AD CS through the CLM platform (Book 07)",
      "The CLM platform inventories edge and controller certificates from Manager's API",
      "Renewal is a runbook triggered by Manager's expiry alarm (vendor ask 7)",
    ], 12, HEX.teal, HEX.tealTint, true],
  ];
  const h = rowH(1.5, W3, specs);
  specs.forEach((p, k) => panel(s, `Cert ${k + 1}`, 0.6 + k * (W3 + 0.15), 1.5, W3, h, p[4], p[5], p[0], p[1], p[2], p[3], p[6]));
  const c = callout(s, "CLM", 1.5 + h + 0.18, 0.9, "FaKey", HEX.amber, "On the program's CLM platform: ",
    "the implementation guide Certificate Lifecycle on CyberArk Certificate Manager covers it. The Manager web certificate is a separate certificate-signing-request flow.", 14);
  warn("certs", c);
  sources(s, "Sources: Cisco Certificate Management guide 26.x; Getting Started Guide, Overlay Network Bring-Up; Certificates and Serial Number File PDG; Hardening Guide rev. 1.1. Oct 24, 2026.");
  notes(s,
`Out of the box, Catalyst SD-WAN trusts certificates from Cisco's PKI. Control components and cloud edges use Cisco PKI, and hardware edges use the SUDI certificate in their trust chip. Edges join only if their serial number is on the authorized WAN edge list that Manager sends to the Controllers. Cisco no longer sponsors Symantec/DigiCert certificates for control components. From IOS XE 17.18.1a, Cisco's Enterprise Certificate setting lets the agency's own CA issue certificates to control components and to hardware and software WAN edges. It's set in Manager under Administration > Settings > Trust and Privacy > Certificates Settings. Enrollment is manual, EST or SCEP. Automatic renewal applies to initial onboarding, or to migration from SUDI to an enterprise certificate; "For subsequent renewals, manual intervention is required" when an expiry alarm fires. (Cisco's guide is framed for SD-Routing devices.) That's how Book 09 reaches its "certificate-based edge onboarding from the agency PKI" (Chapter 05) and its CLM row for SD-WAN edge certificates (Chapter 07). Three items close it (design guidance): 1, issue from the retained AD CS through the CLM platform (Book 07); 2, have the CLM platform inventory edge and controller certificates from Manager's API; 3, write the renewal as a runbook triggered by Manager's expiry alarm, until Cisco documents an automated path (vendor ask 7: what is the Enterprise Certificate procedure for overlay edges on 20.18/17.18, and is there an API that a CLM platform can call to renew?). The Manager web certificate is a separate certificate-signing-request flow. Related: the implementation guide Certificate Lifecycle on CyberArk Certificate Manager.`,
  `${PAGE} (Certificates and the CLM platform; Related).`);
}

// ================================================================== 12 FIPS and CC
{
  const s = content(S3, "FIPS and Common Criteria: controllers vs edges");
  tag(s, "What");
  const b = table(s, "FIPS", 1.5, [3.0, 9.15], ["Item", "Status, October 24, 2026"], [
    ["FIPS mode, control components", "On by default from release 20.15.1; on by default in SDWAN-G, verified with show sdwan security-info"],
    ["FIPS module, control components", "Cisco's Dec 10, 2025 letter for Manager, Validator and Controller 20.18 cites CMVP #4747, FIPS 140-3, active, sunset July 31, 2029"],
    [{ text: "FIPS, edges", options: { bold: true, color: HEX.red } }, "Modules #5356 and #5430 are FIPS 140-3 and active, but current letters for 17.18 and 26.1 don't name SD-WAN mode; example edge output shows fips-mode Disabled; no enabling procedure found (vendor ask 5)"],
    ["Common Criteria (NIAP)", "Catalyst 8200/8300/8400/8500 Secure Routers (G2) on 17.18, certified Apr 9, 2026; no SD-WAN product listed; controller mode not mentioned (vendor ask 6)"],
    ["Common Criteria (other)", "\"cEdge Routers running IOS XE 17.12 with SD-WAN 20.12,\" EAL2+, Canadian scheme, Dec 18, 2024 to Dec 18, 2029"],
    ["Configuration baseline (CM-6)", "Edges: CIS Cisco IOS XE 17.x Benchmark plus Cisco's IOS XE Hardening Guide, checked against SD-WAN mode (design guidance). No SD-WAN STIG; IOS XE router STIGs: optional cross-check, High only"],
  ], { fontSize: 12 });
  const c = callout(s, "Two halves", b + 0.18, 0.9, "FaFileShield", HEX.amber, "The honest FIPS 140-3 statement for an acquisition: ",
    "the control plane's module is validated; validation of the edges in SD-WAN mode is a written vendor commitment to obtain before award (design guidance).", 14);
  warn("fips", c);
  sources(s, "Sources: Cisco FIPS and CC pages; NIST CMVP #4747, #5356, #5430; NIAP PCL; Cisco SD-WAN and IOS XE hardening guides; NIST CM-6; CIS Benchmarks; DISA STIG library.");
  notes(s,
`Status on October 24, 2026. FIPS mode, control components: on by default from release 20.15.1; on by default in SDWAN-G, verified with show sdwan security-info. FIPS module, control components: Cisco's December 10, 2025 letter for Manager, Validator and Controller 20.18 cites Cisco FIPS Object Module 7.3a, CMVP #4747, FIPS 140-3, active, sunset July 31, 2029. FIPS modules, edges: IOS Common Cryptographic Module CMVP #5356 (FIPS 140-3, active, sunset August 6, 2029; vendor-affirmed for Catalyst 8200, 8200L, 8300, 8500 and 8500L on IOS XE 17.12) and CiscoSSL FIPS Provider #5430 (active, sunset November 17, 2029); Cisco's current letters for these platforms on 17.18 and 26.1 don't name SD-WAN mode; only archived letters, citing FIPS 140-2 certificates now on the Historical list, did. FIPS mode, edges: Cisco's IOS XE 17.x security guide shows example edge output with fips-mode Disabled, and this research found no documented procedure for enabling it on edges (vendor ask 5). Common Criteria (NIAP): Catalyst 8200, 8300, 8400 and 8500 Secure Routers (G2 hardware) on IOS XE 17.18, certified April 9, 2026; Catalyst 8200, 8300 and 8500 with ASR 1000 on 17.15, certified September 29, 2025, maintained to 17.18; protection profiles NDcPP 3.0e, VPN Gateway 1.3, MACsec 1.0 and SSH 1.0. No Cisco SD-WAN product is listed, and the router listings don't mention controller mode. Common Criteria (other): Cisco lists "Cisco cEdge Routers running IOS XE 17.12 with SD-WAN 20.12," EAL2+, certified December 18, 2024, expiring December 18, 2029, issued under the Canadian scheme with no protection profile claimed. Configuration baseline (CM-6): NIST SP 800-53 CM-6 leaves the agency to choose its common secure configurations and record deviations. For the control components, that's Cisco's Catalyst SD-WAN Hardening Guide and CISA's supplemental guidance. For the edges, draw the settings from the CIS Cisco IOS XE 17.x Benchmark (2.2.1) and Cisco's IOS XE Software Hardening Guide (revision 3.2, December 8, 2025), and check each against SD-WAN mode, in which Manager pushes the edge configuration (design guidance). CIS lists no Catalyst SD-WAN Manager benchmark. DISA STIGs (High only: material for FedRAMP High or Defense environments, not the Moderate civilian baseline; kept as an optional reference): no SD-WAN STIG exists; the Cisco IOS XE Router NDM STIG V3R7 (April 1, 2026) and RTR STIG V3R5 (October 1, 2025) are written for IOS XE and don't mention SD-WAN mode; they're an optional cross-check, not the civilian baseline and not something a Moderate assessor expects to match (inference). For Chapter 10's requirement that acquisitions state a FIPS 140-3 expectation, the honest statement has two halves: the control plane's module is validated under FIPS 140-3; validation of the edges in SD-WAN mode is a written vendor commitment to obtain before award (design guidance). Chapter 11's BOM names first-generation models (C8200L-1N-4T, C8200-1N-4T, C8300-1N1S-4T2X); the 17.18 NIAP listing covers G2 hardware; confirm which listing covers which model (vendor ask 6). TrustSec isn't supported with FIPS mode on.`,
  `${PAGE} (FIPS 140-3, Common Criteria and the configuration baseline).`);
}

// ================================================================== 13 TIC 3.0
{
  const s = content(S4, "TIC 3.0 patterns on Catalyst");
  tag(s, "How");
  const im = img(s, "b09-network/ch08-branch-architectures",
    "A table of four branch architectures. A, hairpin, in amber: the path runs from the branch to the campus or an MTIPS access point and then out; enforcement sits at the central access point; the boundary is assessed but every flow pays the detour. B, bare local breakout, in red: the branch goes straight to the internet; enforcement sits nowhere the agency controls; it is a regression, with egress outside any assessed boundary. C, governed local breakout, in green: an SD-WAN edge sends traffic to a nearby policy enforcement point and then the cloud; enforcement sits at the branch edge and the SASE point of presence; the boundary is assessed after the boundary change and per-application telemetry exists. D, agent-delivered SASE, in blue: a device agent forwards to the nearest point of presence; enforcement sits at the SASE point of presence, with an edge firewall for agentless devices; the boundary is assessed once point-of-presence proximity and telemetry are verified.",
    0.6, 1.45, 12.15, 2.2);
  design(s, "(DESIGN GUIDANCE) THE CATALYST BUILD FOR EACH BOOK 09 CH 08 PATTERN", 0.6, 1.45 + im.h + 0.08);
  const b = table(s, "Patterns", 1.45 + im.h + 0.4, [2.6, 9.55], ["Pattern", "Catalyst build"], [
    ["A. Hairpin", "Data policy sends internet traffic over the overlay to the regional hub, which breaks out through its SSE tunnel; every office's starting state and fallback"],
    [{ text: "B. Bare local breakout", options: { bold: true, color: HEX.red } }, "Never: no local-internet action except to an SSE tunnel or a documented Optimize exception; audit the policy group on each change"],
    [{ text: "C. Governed local breakout", options: { bold: true, color: HEX.teal } }, "Automatic IPsec tunnels to Secure Access for Government, or another SSE by generic SIG tunnel; Microsoft 365 Optimize direct only under the SC-7(4) exception"],
    ["D. Agent-delivered SASE", "The SSE's endpoint agent carries policy; the edge is transport and path telemetry, and keeps agentless devices on A or C"],
  ], { fontSize: 11.5 });
  warn("tic", b);
  sources(s, "Sources: research page (Book 09's patterns on Catalyst); Cisco TIC 3.0 Architecture Guide (Oct 20, 2021); Book 09, Ch 08 (figure), Ch 12.");
  notes(s,
`Cisco's own TIC 3.0 Architecture Guide (October 2021) covers the Traditional, Branch Office and Remote User use cases; its branch patterns are backhaul through the campus, direct cloud access and direct internet access, with security on the SD-WAN routers. It predates the September 2026 Branch Office Use Case that Book 09 relies on, and doesn't mention SASE or Cisco Secure Access, so build to Book 09's reading of the current use case rather than to the vendor guide (inference). Book 09's patterns on Catalyst (design guidance; Chapter 08). A, Hairpin: data policy sends internet-bound traffic over the overlay to the regional hub, which breaks out through the hub's SSE tunnel; this is the starting state for every office and the fallback if the SSE is unreachable. B, Bare local breakout: never; no site carries a local-internet action except to an SSE tunnel or a documented Optimize exception; audit the policy group for it on each change. C, Governed local breakout (the reference pattern): automatic IPsec tunnels from each edge to Cisco Secure Access for Government, or to another SSE through the generic SIG tunnel; Microsoft 365 Optimize traffic goes direct only under the SC-7(4) exception (Chapter 12). D, Agent-delivered SASE: the SSE's endpoint agent (Cisco's client for Secure Access, or the Global Secure Access client) carries policy; the edge is transport and path telemetry; the edge still keeps agentless devices on Pattern A or C.`,
  `${PAGE} (TIC 3.0, SSE and Microsoft 365: Book 09's patterns on Catalyst).`);
}

// ================================================================== 14 SSE and GCC
{
  const s = content(S4, "Secure Access, Global Secure Access and GCC");
  tag(s, "Who");
  const specs = [
    ["CISCO SECURE ACCESS FOR GOVERNMENT", "Certified at High; one region", [
      "Security Cloud for Government, FR2304757473A: Class D (High), Aug 6, 2026",
      "Automatic tunnels documented \"from a Catalyst SD-WAN branch\"",
      "One region: US (Virginia)",
      "Tunnel MTU 1,390 bytes or less; fragmented packets dropped",
      "Whether the TAC step applies to government isn't stated (ask 8)",
    ], 12, HEX.navy, HEX.navyTint],
    ["MICROSOFT GLOBAL SECURE ACCESS", "In GCC; a partial fit", [
      "Available in GCC, not GCC High or DoD",
      "\"Cisco Catalyst\" is a template-based partner; Cisco's guide selects only the Microsoft 365 profile",
      "Remote networks: no Private Access; Conditional Access only with the client; 200 per tenant",
      "Carries branch Microsoft 365 traffic; not a full Pattern C (inference)",
    ], 12, HEX.teal, HEX.tealTint],
    ["MICROSOFT 365 IN GCC", "Path choice from the edge", [
      "Informed network routing: still not GCC Moderate, GCC High or DoD",
      "Cloud OnRamp for SaaS steers by Microsoft's categories",
      "Its telemetry can't run on sites using SIG tunnels",
      "So path choice rests on the edge's own probes",
    ], 12, HEX.amber, HEX.amberTint],
  ];
  const h = rowH(1.5, W3, specs);
  specs.forEach((p, k) => panel(s, `SSE ${k + 1}`, 0.6 + k * (W3 + 0.15), 1.5, W3, h, p[4], p[5], p[0], p[1], p[2], p[3]));
  const c = callout(s, "Location", 1.5 + h + 0.18, 0.9, "FaGlobe", HEX.red, "The enforcement point has a location: ",
    "measure branch-to-PoP latency from the western offices in the pilot, or choose an SSE with PoPs near each office cluster. The SD-WAN build doesn't depend on which SSE.", 14);
  warn("sse", c);
  sources(s, "Sources: FedRAMP Marketplace (FR2304757473A); Cisco Secure Access for Government help; Microsoft Learn (GSA limits, partners; informed routing); Cisco MS SSE guide; Cloud OnRamp.");
  notes(s,
`Cisco Secure Access for Government. Listing: the FedRAMP Marketplace lists Cisco Security Cloud for Government (FR2304757473A) as FedRAMP Certified, Class D (High), certified August 6, 2026; it covers Umbrella for Government and Secure Access for Government and integrates with CISA's Protective DNS. Setup: Cisco's government help center documents automatic tunnels "from a Catalyst SD-WAN branch"; credentials go into SD-WAN Manager under Cloud Credentials (organization ID, API key and secret); the integration was tested on 20.15/17.15 with ISE 3.1 or later. Constraints: the service runs in one region, US (Virginia); tunnel MTU must be 1,390 bytes or less, and fragmented packets are dropped; Cisco's commercial guides add that automated tunnels need 20.15.1/17.15.1 with up to eight tunnel pairs from Manager, and private-access automation needs 20.18.2/17.18.2 and is "on controlled availability," enabled through TAC; whether the government service needs the same TAC step isn't stated (vendor ask 8). Umbrella for Government's current guide lists no Catalyst SD-WAN section; treat Secure Access for Government as Cisco's SSE path for this design (inference). The single region is a physics problem as well as a resilience one: a western office that tunnels to Virginia pays the round trip Chapter 01 prices; measure it and accept it in the pilot, or choose an SSE with PoPs near each office cluster (Chapter 05). The SD-WAN build doesn't depend on which SSE is chosen. Microsoft Global Secure Access: Microsoft says it's available in GCC, but not in GCC High or DoD. Microsoft lists "Cisco Catalyst" as a template-based remote-network partner; Cisco's integration guide uses the generic SIG tunnel and says only the Microsoft 365 traffic forwarding profile can be selected. Remote-network limits: remote networks carry the Microsoft and Internet Access profiles, not Private Access; Conditional Access applies only to users running the client; Custom Bypass doesn't work; 200 remote networks per tenant. So a Catalyst edge can deliver branch Microsoft 365 traffic to Microsoft's SSE; it isn't a full Pattern C to Global Secure Access, and Chapter 12's tenant-restriction analysis still governs (inference). Microsoft 365 in GCC: Microsoft's informed network routing page still says it supports worldwide commercial tenants "but not the GCC Moderate, GCC High, DoD" clouds (Cisco IOS XE SD-WAN 20.4/17.4 or later is the one listed partner). Cloud OnRamp for SaaS can steer Microsoft 365 by Microsoft's categories (Optimize, Optimize and Allow, or All); Microsoft's feedback telemetry starts at 17.4.1a/20.4.1 and can't run on sites that use SIG tunnels. In GCC, Microsoft 365 path choice rests on the edge's own probes, and a Pattern C site loses the telemetry anyway. Book 09's position stands: direct breakout for Optimize traffic under its own exception, application-aware routing on measured paths, and QoS on the overlay (Chapters 11 and 12).`,
  `${PAGE} (Cisco Secure Access for Government; Microsoft Global Secure Access as the SSE; Microsoft 365 in GCC).`);
}

// ================================================================== 15 Evidence
{
  const s = content(S5, "Evidence and telemetry the fabric emits");
  tag(s, "How");
  design(s, "(DESIGN GUIDANCE) EVERY RECORD IS DERIVED FROM MANAGER'S APIS AND LABELED SO, AS CH 05 ALLOWS");
  const tw = 7.2;
  const b = table(s, "Schema", 1.78, [2.55, 4.65], ["Chapter 05 field", "Catalyst source"], [
    ["controller_id", "Manager or Controller system IP; the fabric name for SDWAN-G"],
    ["decision_kind: path, steering", "Active policy group, joined to application-route statistics"],
    ["decision_kind: failover", "Alarms and events for TLOC, BFD and control-connection changes"],
    ["selected_path", "Tunnel color and remote TLOC from application-route statistics"],
    ["sla_state", "The SLA class the flow matched, and whether the path met it"],
    ["policy_refs", "Policy group, data policy and SLA class IDs, linked to the SC-7(4) policy"],
    ["evaluation_timestamp", "entry_time from the API, converted to ISO 8601"],
  ], { fontSize: 11.5 });
  const x = 0.6 + tw + 0.15, w = 12.15 - tw - 0.15;
  const p1 = panel(s, "Logs", x, 1.78, w, null, HEX.navy, HEX.navyTint, "GETTING LOGS OFF THE BOX", "SIEM and CISA", [
    "Syslog over TLS (UDP and TCP also supported)",
    "All SD-WAN syslog to CISA's CLAW",
    "Session records: flow export plus firewall high-speed logging (inference)",
  ], 12);
  const p2 = panel(s, "Sentinel", x, p1 + 0.15, w, null, HEX.red, HEX.redTint, "MICROSOFT SENTINEL CAVEAT", "Treat NetFlow as legacy (inference)", [
    "Syslog via the Azure Monitor Agent: plan on it",
    "NetFlow via Logstash and the workspace key, no DCR support; the API's support ended Sep 14, 2026 (ingestion continues; ask 10)",
  ], 12);
  warn("evidence", Math.max(b, p2));
  sources(s, "Sources: Cisco DevNet (auth, API examples, AuditLogEntry); Hardening Guide; CISA ED 26-03; Microsoft Learn (Sentinel connector, feature availability, Data Collector API).");
  notes(s,
`Manager's APIs. Sign-in from release 20.18.1: JSON web tokens, POST /jwt/login with a username, password and a duration of up to 604,800 seconds (default 1,800); send the token as a bearer header, and the returned csrf value as X-XSRF-TOKEN on POST requests; there's no JWT sign-out, so request short-lived tokens. Earlier releases: POST /j_security_check, then GET /dataservice/client/token, then POST /logout. Reads: device inventory (GET /dataservice/device: host name, system IP, site ID, device type, model, serial, software version, reachability); the Manager audit log (GET /dataservice/auditlog with a query parameter: entry_time, loguser, logusersrcip, logmodule, logfeature, logdeviceid, logmessage, logid, tenant); alarms and path statistics (/dataservice/alarms; /statistics/approute, latency, jitter and loss percentage by tunnel). Mapping to Chapter 05's evidence schema (design guidance; every record is derived and should be labeled so): controller_id from the Manager or Controller system IP, or the fabric name for SDWAN-G; decision_kind path-selection and application-steering from the active application-aware routing and data policy (policy group), joined to application-route statistics for the flow's tunnel; decision_kind failover from alarms and events for TLOC, BFD and control-connection state changes; selected_path from tunnel color and remote TLOC; sla_state from the SLA class the flow matched and whether the path met it; identity_context n/a unless ISE SGTs or identity-firewall users are in play; policy_refs from policy group, data policy and SLA class identifiers, linked to the SC-7(4) traffic-flow policy; evaluation_timestamp from entry_time, converted to ISO 8601. Getting logs off the box: edges and control components send syslog over UDP, TCP or TLS; prefer TLS. Manager aggregates audit, ACL and system logs; firewall high-speed logging exports session records in NetFlow v9. All SD-WAN syslog goes to CLAW. M-26-14's minimum log content (Chapter 13) needs records of source, destination, protocol, port and session; flow export plus firewall high-speed logging is the mechanism (inference). Sentinel: the "Cisco Software Defined WAN" connector, supported by Cisco, has two paths: syslog reaches the Syslog table through the Azure Monitor Agent on an Arc-enabled Linux forwarder; NetFlow and IPFIX go through Filebeat and Logstash, with the workspace key, into CiscoSDWANNetflow_CL, a table with no data collection rule support. Microsoft ended support for the HTTP Data Collector API on September 14, 2026; ingestion continues for TLS 1.2 clients. Syslog through the Azure Monitor Agent is listed as generally available in Azure Government; whether the Cisco solution is in the Azure Government content hub couldn't be confirmed. Treat the NetFlow path as legacy and ask for a data-collection-rule-based one (vendor ask 10).`,
  `${PAGE} (Evidence and telemetry).`);
}

// ================================================================== 16 Phased build
{
  const s = content(S5, "The phased build, mapped to Book 09's gates");
  tag(s, "How");
  design(s, "(DESIGN GUIDANCE) BOOK 09 CH 11'S ROADMAP AND CH 13'S SEQUENCE; PROGRAM-DESIGN WINDOWS, NOT COMMITMENTS");
  const iw = 3.1;
  const b = table(s, "Phases", 1.78, [2.15, 4.55, 2.2], ["Phase or step", "Catalyst build", "Evidence it leaves"], [
    ["Step 0 (Ch 13): Gate 0", "Patch to the floor, hunt, harden, log to SIEM and CLAW, SSO and roles", "Gate CSV, hunt artifacts, CLAW confirmation"],
    ["Phase 0, months 0–6", "Hosted or on-prem and boundary disposition; release baseline; ten-site pilot; paired-branch study; CLAW coordination; static edge addresses", "Breakout authorized; 30 days' pilot stability"],
    ["Phase 1, months 6–18", "12 hubs: C8500L pairs, SSE tunnels, 24 DPs on own servers; configuration and policy groups; SLA classes from the pilot", "Hubs in production"],
    ["Steps 2 and 3 (Ch 13)", "No local-internet action until the SSE tunnel logs and the boundary change is approved", "Approved change dated before cutover"],
    ["Phase 2, months 18–48", "Office waves at MPLS renewal; MPLS retired per office only after CLAW parity", "Per-office CLAW confirmation"],
    ["Phase 3, months 36+", "Microsoft 365 direct path (no INR in GCC); Connected Cache at the hubs", "SC-7(4) exception; five retirement gates"],
  ], { fontSize: 11 });
  img(s, "b09-network/ch11-retirement-gates",
    "An amber box at the top, the 24-DP hub content tier labeled interim, consolidated not permanent, leads down through five slate gate boxes in sequence. Gate 1, app content: client apps and Office Click-to-Run workloads on Intune, and no deployment still sourced from Configuration Manager. Gate 2, update content: Windows Update and device configuration workloads on Intune, and Configuration Manager software updates turned off in client settings. Gate 3, OS provisioning: task-sequence imaging replaced by Windows Autopilot, not a co-management workload. Gate 4, caching role: no Connected Cache instance still running on distribution-point hardware. Gate 5, compliance evidence: no control evidence still sourced from the Configuration Manager site database. Gate 5 leads, labeled all closed, to a green box: retire the last distribution point when all five are closed, in whatever month that is. A dashed red arrow labeled open gate leads from the gate sequence to a red box: any gate open, keep the tier and don't force the cutover.",
    0.6 + 8.9 + 0.15, 1.78, iw, 4.75);
  warn("phases", b);
  sources(s, "Sources: research page (Build phases mapped to Book 09); Cisco Configuration Groups quick start (doc 222297); Cisco upgrade guide (doc 225515); Book 09, Ch 11 (figure), Ch 13.");
  notes(s,
`Chapter 11's roadmap and Chapter 13's sequence, with the Catalyst work and the evidence each step leaves (design guidance). Step 0 (Chapter 13), Gate 0: patch to the floor, hunt, harden, log to the SIEM and CLAW, SSO and roles; evidence: gate CSV, hunt artifacts, hardening record, CLAW confirmation. Phase 0, months 0–6 (Chapter 11): decide hosted or on-premises and record the boundary disposition (Chapter 05); set the release baseline; build the fabric in the Portal or the 14 VMs; run the ten-site pilot across tiers and transports; run the paired-branch study (Chapter 13); start the three-party CLAW coordination; plan static edge addresses, including the 5G path; evidence: authorization for regional breakout, 30 days of pilot stability, paired-branch effect size. Step 1, buy the pipe (Chapter 13): order DIA circuits with static addressing and documented path diversity; HSECK9 licenses where encrypted throughput exceeds 250 Mbps; evidence: per-site latency and loss measured before the order. Phase 1, months 6–18: build the 12 hubs (C8500L pairs, hub tunnels to the SSE, and the 24 distribution points on their own servers); build configuration groups and policy groups; set SLA classes from the pilot's measurements; evidence: hubs in production, replacement telemetry confirmed for the pilot sites. Steps 2 and 3, governor before traffic and boundary change before cutover (Chapter 13): no site gets a local-internet action until its SSE tunnel is up and logging, and its boundary change is approved; evidence: approved boundary change dated before cutover, the PEP named per path class. Phase 2, months 18–48: office waves at MPLS renewal (plug-and-play onboarding against the authorized serial list, overlay, cutover); MPLS retired per office only after CLAW parity for that office (Chapters 03 and 11); evidence: per-office CLAW confirmation, the failover test record per site class. Phase 3, months 36+: Microsoft 365 direct path through data policy and Cloud OnRamp categories (no INR in GCC); Connected Cache at the hubs on its own hosts; evidence: the SC-7(4) exception instruments (Appendix A) and the five retirement gates, tracked as Chapter 11 states them (the figure). Two Catalyst specifics in Phase 0: the release baseline, release 20.18 on the control components with IOS XE 17.18 on the edges, at or above the floor (design guidance), for the JWT API (20.18.1), automated private-access tunnels to Secure Access (20.18.2), Manager as the hub for ISE (20.18.2), the Enterprise Certificate option (17.18.1a), a Cisco FIPS letter for the 20.18 control components, and a NIAP listing for Catalyst 8000 hardware on 17.18; Cisco publishes no "recommended release" statement on the pages reviewed, and SDWAN-G's available trains weren't stated (vendor ask 3). And configuration groups, not device templates: Cisco recommends migrating to configuration groups and policy groups; a device can't be on both; some features, including Cloud OnRamp for SaaS and TrustSec, still need legacy templates or a CLI profile, so decide which features force a template before building 1,500 sites. Upgrades follow Cisco's documented procedure for each train hop, with disaster recovery paused, and confirmed paused, before the Manager cluster is upgraded.`,
  `${PAGE} (Build phases mapped to Book 09).`);
}

// ================================================================== 17 Where this changes Book 09
{
  const s = content(S5, "Where this changes Book 09's planning");
  tag(s, "Why");
  const specs = [
    ["1  STATIC EDGE ADDRESSES", "CISA expects one on every edge", [
      "Agencies \"will need to assign static IPs\" to every edge",
      "Conflicts with zero-touch provisioning from dynamic addresses, and probably the 5G secondary path",
      "Reinforces Ch 10's deterministic-egress action (inference); put static DIA addresses in the circuit order",
    ], 12.5, HEX.red, HEX.redTint],
    ["2  THE COST MODEL", "GovCloud, not on-premises", [
      "Chapter 11's cost model assumes an on-premises control plane",
      "CISA's hardening guidance: \"Host Infrastructure in GovCloud\"",
      "Hosting replaces the 14-VM line with a subscription not yet priced (vendor ask 3)",
    ], 12.5, HEX.navy, HEX.navyTint],
    ["3  KEV GROWTH", "The floor moves", [
      "Nine KEV entries now; the Validator added to the original advisory",
      "Re-run the gate on every KEV addition and each publication day",
      "About 476 more edges would need a second overlay (inference)",
    ], 12.5, HEX.amber, HEX.amberTint],
  ];
  const h = rowH(1.5, W3, specs);
  specs.forEach((p, k) => panel(s, `Change ${k + 1}`, 0.6 + k * (W3 + 0.15), 1.5, W3, h, p[4], p[5], p[0], p[1], p[2], p[3]));
  const c = callout(s, "Unchanged", 1.5 + h + 0.18, 0.9, "FaScaleBalanced", HEX.teal, "What holds: ",
    "Book 09's design doesn't depend on this vendor. These findings change inputs to its plan: the circuit order, the cost model's control-plane line, and the patch intake.", 14);
  warn("changes", c);
  sources(s, "Sources: CISA Supplemental Direction ED 26-03 (perimeter allow-listing; GovCloud); CISA KEV v2026.10.23; Cisco advisory rpa (v2.0); Cisco 20.18 sizing. Oct 24, 2026.");
  notes(s,
`Three findings update Book 09's planning inputs. 1, Static edge addresses: CISA's supplemental guidance asks for a firewall that admits only known edge, Controller, Validator and Manager addresses, and says agencies "will need to assign static IPs" to every edge. That conflicts with zero-touch provisioning from dynamic addresses, and probably with Chapter 11's 5G secondary path. It reinforces Book 09's deterministic-egress action (Chapter 10) (inference). Cisco notes zero-touch onboarding or dynamic edge addresses need "any" on the Validator's UDP 12346; that is the trade to close before Phase 2. Mitigation (design guidance): static DIA addresses in the circuit order; carrier static IPs for 5G or a documented exception for the secondary path; staged onboarding (vendor ask 11 to carriers). 2, The cost model: CISA's hardening guidance points federal users at FedRAMP cloud ("Host Infrastructure in GovCloud"); Chapter 11's cost model assumes an on-premises control plane. This guide recommends Cisco's FedRAMP-certified hosted control plane by default. Hosting replaces Chapter 11's on-premises control-plane line (the 14-VM build) with a subscription the cost model doesn't yet price (vendor ask 3: what does SDWAN-G cost for about 1,524 edges, to replace Chapter 11's $400,000 control-plane line?). 3, KEV growth: the directive's scope has grown since Book 09 recorded it; the catalog now lists nine Catalyst SD-WAN vulnerabilities, Cisco has added the Validator to the advisory for the original authentication bypass, and the newest entry sets today's Manager floor. Re-run the gate's inventory and floor lines on every KEV addition and on each Cisco publication day. Growth trigger: the cluster ceiling is 2,000 devices; about 476 more edges, whether new offices or cloud gateways, would need a second overlay (inference); the risk table puts the growth trigger at about 1,800 devices. Book 09's design doesn't depend on this vendor.`,
  `${PAGE} (What the research found; Hardening; On-premises sizing; Risks).`);
}

// ================================================================== 18 Risks and vendor asks
{
  const s = content(S5, "Risks and vendor asks");
  tag(s, "Who");
  const tw = 7.55;
  const H = { text: "High", options: { bold: true, color: HEX.red } };
  const M = { text: "Medium", options: { bold: true, color: HEX.amber } };
  const L = { text: "Low", options: { color: HEX.slate } };
  const b = table(s, "Risks", 1.5, [3.2, 0.95, 3.4], ["Risk", "Rating", "Mitigation (design guidance)"], [
    ["New KEVs faster than the agency can patch", H, "SDWAN-G with a written patch commitment, or a standing crew on Cisco's Wednesdays"],
    ["Compromise predates the build", H, "Hunt before trusting any fabric; rebuild on any root finding"],
    ["Hosted fabric in scope; custody via Cisco", M, "Artifact delivery times in contract (ask 2)"],
    ["Static addressing vs ZTP and 5G", M, "Static DIA in the order; 5G static IPs or an exception"],
    ["Single-region SSE", M, "Measure in the pilot; fall back to Pattern A"],
    ["Manual edge certificate renewal", M, "CLM inventory plus alarm-driven runbook"],
    ["Edge FIPS and CC in SD-WAN mode", M, "Vendor commitment before award"],
    ["Cluster ceiling; Sentinel NetFlow; templates", L, "Trigger at ~1,800 devices; syslog via agent; list template-only features"],
  ], { fontSize: 11 });
  const pb = panel(s, "Asks", 0.6 + tw + 0.15, 1.5, 12.15 - tw - 0.15, null, HEX.navy, HEX.navyTint, "TWELVE VENDOR ASKS, BY OWNER", "Questions with owners", [
    "Cisco (1–9): SDWAN-G patch record and artifact timing; recommended release, trains and cost; 26.2 fixes; edge FIPS and NIAP mode; certificate renewal API; Secure Access TAC step and a second region; Cloud OnRamp on GCC endpoints",
    "Cisco and Microsoft (10): a data-collection-rule path for NetFlow; Azure Government",
    "Carriers (11): a static 5G address at every office",
    "CISA (12): must a post-March 2026 fabric report?",
  ], 11.5);
  warn("risks", Math.max(b, pb));
  sources(s, "Sources: research page (Risks; Vendor asks), built from the CISA, Cisco and Microsoft sources on the earlier slides. Oct 24, 2026.");
  notes(s,
`Risks, with mitigations (design guidance). High: the control plane collects new known-exploited vulnerabilities faster than the agency can patch; mitigation, hosted SDWAN-G with a written patch commitment, otherwise a standing patch crew working to Cisco's publication Wednesdays, re-run the gate on every KEV addition, Live Protect only as a stopgap. High: compromise predates the build (CISA: likely since 2023); hunt before trusting any existing fabric, and rebuild from patched images on any root finding. Medium: the hosted fabric is still in scope and forensic custody depends on Cisco; contract terms for artifact delivery times (vendor ask 2), CLAW and AWS log delivery confirmed in Phase 0. Medium: static-address allow-listing conflicts with ZTP and 5G; static DIA addresses in the circuit order, carrier static IPs for 5G or a documented exception for the secondary path, staged onboarding. Medium: a single-region SSE adds latency to distant offices and concentrates risk; measure in the pilot, fall back to Pattern A at the hubs, consider an SSE with nearer PoPs. Medium: edge certificate renewal is manual after onboarding; CLM inventory plus an alarm-driven runbook, renewal dates tracked like Book 07's other classes. Medium: edge FIPS and Common Criteria status in SD-WAN mode is unconfirmed; vendor commitment before award, avoid TrustSec on FIPS-mode edges. Low: the 2,000-device Manager cluster ceiling; growth trigger at about 1,800 devices, plan a second overlay early. Low: the Sentinel NetFlow path is on an unsupported API; syslog through the agent now, DCR-based flow ingestion when available. Low: configuration groups don't cover every feature; list the template-only features in Phase 0 and keep them on one model per site class. Vendor asks. 1, does Cisco apply every KEV fix to SDWAN-G inside CISA's due dates (the record for CVE-2026-76504 and CVE-2026-20245)? 2, for an SDWAN-G fabric, how quickly will Cisco deliver the ED 26-03 artifacts: disk and memory images, admin-tech files and AWS network logs? 3, Cisco's recommended release today for SDWAN-G and on-premises; is 20.18 or 26.1 available in SDWAN-G; SDWAN-G cost for about 1,524 edges. 4, is 26.2 fixed for the Controller and Validator against CVE-2026-20182, CVE-2026-20245 and CVE-2026-20262? 5, FIPS 140-3 status of IOS XE edges in SD-WAN mode on the C8200L-1N-4T, C8200-1N-4T, C8300-1N1S-4T2X and C8500L-8S4X, and how FIPS mode is enabled on an edge. 6, is controller mode inside the NIAP-evaluated configuration of the 17.15 and 17.18 Catalyst 8000 listings, and which BOM models does each cover? 7, the Enterprise Certificate procedure for overlay edges on 20.18/17.18, and a renewal API for a CLM platform. 8, does Secure Access for Government's automatic tunnel need TAC enablement; is a second US region planned? 9, does Cloud OnRamp for SaaS category steering work against GCC endpoints? 10, Cisco and Microsoft: a Logs ingestion API (data collection rule) path for SD-WAN NetFlow, and is the solution published in Azure Government? 11, carriers: can the 5G secondary path carry a static public address at every office? 12, CISA: must a Catalyst SD-WAN fabric deployed after March 2026 report under ED 26-03, and is the directive still open?`,
  `${PAGE} (Risks; Vendor asks).`);
}

// ================================================================== 19 Example collector
{
  const s = content(S6, "The example collector: read-only, illustrative");
  tag(s, "How");
  const fb = flow(s, "Collector", 1.55, 1.35, [
    { head: "Sign in", body: "JWT from 20.18.1; short-lived tokens, since there's no JWT sign-out" },
    { head: "Read", body: "Device inventory and the Manager audit log" },
    { head: "Check", body: "Every control component against the directive's and the catalog's fixed releases" },
    { head: "Export", body: "The gate CSV, inventory and audit evidence", color: HEX.amber, tint: HEX.amberTint },
  ], 12);
  const y = fb + 0.2;
  const specs = [
    ["WHAT IT PRODUCES", "The first layer of the evidence schema", [
      "ed-26-03-gate.csv: no fail or confirm rows before production traffic",
      "A fleet_inventory record per device (CM-8, SI-2)",
      "A management_audit record per audit-log entry (AU-6, AU-9, AC-6(9)), flagging sign-ins and sources outside the management network",
    ], 12.5, HEX.teal, HEX.tealTint],
    ["WHAT IT ISN'T", "Read-only, by lane discipline", [
      "It doesn't build sdwan_decision records: those need the policy and statistics reads",
      "It never configures the fabric: Manager and the Controllers enforce",
      "Code: examples/cisco-sdwan in the workbook's GitHub repository",
    ], 12.5, HEX.navy, HEX.navyTint],
  ];
  const h = rowH(y, W2, specs);
  specs.forEach((p, k) => panel(s, `Example ${k + 1}`, 0.6 + k * (W2 + 0.15), y, W2, h, p[4], p[5], p[0], p[1], p[2], p[3]));
  const c = callout(s, "Illustrative", y + h + 0.18, 0.75, "FaTriangleExclamation", HEX.red, "Illustrative: ",
    "unit-tested against mocked responses, not proven against a live fabric.", 15);
  warn("example", c);
  sources(s, "Sources: research page (The example code; Evidence and telemetry; The gate, as a checklist); Cisco DevNet Authentication and Get vManage Audit Log. Oct 24, 2026.");
  notes(s,
`The example code: examples/cisco-sdwan on GitHub. It's a read-only Python script that checks every control component against the fixed releases for the directive and the catalog, and exports inventory and audit-log evidence. It's illustrative: unit-tested against mocked responses, not proven against a live fabric. Sign-in: from release 20.18.1, JSON web tokens through POST /jwt/login, with a duration of up to 604,800 seconds (default 1,800); there's no JWT sign-out, so request short-lived tokens; earlier releases use the session flow. What it builds: the gate findings (ed-26-03-gate.csv must show no fail or confirm rows, gate line 2); a fleet_inventory record per device (CM-8, SI-2), gate line 1; and a management_audit record per audit-log entry (AU-6, AU-9, AC-6(9)), flagged for sign-ins and for sources outside the management network. It doesn't build sdwan_decision records; those need the policy and statistics reads. Lane discipline: the program observes, reconciles and emits evidence; Manager and the Controllers route and enforce; the example script is read-only for that reason. Couldn't verify: the audit-log query's last_n_hours was tested only against mocked responses.`,
  `${PAGE} (The example code; Evidence and telemetry; Lane discipline; What couldn't be verified).`);
}

// ================================================================== 20 Close
{
  const s = content(S6, "What to verify, decide, and read next");
  tag(s, "Who");
  const specs = [
    ["VERIFY", "From under review to Proved", [
      "Build Gate 0 and the ten-site pilot in a lab or pilot fabric",
      "Run the example script against it; record the evidence",
      "With Cisco: a recommended release, SDWAN-G's trains, edge FIPS in SD-WAN mode",
    ], 13, HEX.navy, HEX.navyTint],
    ["DECIDE (DESIGN GUIDANCE)", "Before Phase 0 closes", [
      "Hosted (SDWAN-G) or on-premises",
      "The release baseline, at or above the floor",
      "Static addressing, including the 5G path",
      "Which SSE; the certificate renewal runbook",
    ], 13, HEX.teal, HEX.tealTint],
    ["READ NEXT", "The why and the design", [
      "SD-WAN and SASE Platforms Against Book 09's Requirements (the platform deep dive)",
      "Book 09, Chapters 05 and 11",
      "The Book 09 SD-WAN technical deep-dive deck",
    ], 13, HEX.amber, HEX.amberTint],
  ];
  const h = rowH(1.5, W3, specs);
  specs.forEach((p, k) => panel(s, `Close ${k + 1}`, 0.6 + k * (W3 + 0.15), 1.5, W3, h, p[4], p[5], p[0], p[1], p[2], p[3]));
  const c = callout(s, "Example", 1.5 + h + 0.18, 0.9, "FaLightbulb", HEX.amber, "An example, not an endorsement: ",
    "it names one product to make Book 09's vendor-neutral design concrete; it isn't an endorsement by any agency. Comments and corrections are welcome as issues on GitHub.", 14);
  warn("close", c);
  sources(s, "Sources: research page (Status and review; What couldn't be verified; Related); SD-WAN platform deep dive; Book 09, Ch 05 and Ch 11.");
  notes(s,
`Status: in review. Every claim was checked on October 24, 2026, against CISA's ED 26-03 pages and KEV catalog; Cisco's security advisories, hardening guide, configuration guides, sizing chapter, government guide, certification pages and DevNet references; the Cisco Secure Access for Government help center; FedRAMP Marketplace data, the NIST CMVP, the NIAP Product Compliant List and the DISA STIG library; and Microsoft Learn. The configuration-baseline facts (NIST CM-6, the CIS Benchmarks list and Cisco's IOS XE hardening guide) were added on October 29, 2026. To move this guide to Proved: build Gate 0 and the ten-site pilot in a lab or pilot fabric, run the example script against it, and record the evidence on the page. What couldn't be verified includes a Cisco "recommended release" statement and the trains available in SDWAN-G, and SD-WAN mode in edge FIPS validation and NIAP's evaluated configurations (full list on the backup slide). Decisions (design guidance): hosted or on-premises; the release baseline at or above the floor; static edge addressing, including the 5G path; which SSE; and the certificate renewal runbook on the CLM platform. Read next: SD-WAN and SASE Platforms Against Book 09's Requirements, the product deep dive on why the program builds on Cisco Catalyst SD-WAN under stated conditions; Book 09, Chapter 05 (SD-WAN, SASE and governed transport) and Chapter 11 (field-office WAN transformation); and the Book 09 SD-WAN technical deep-dive deck. Related: Book 07 — PKI & Certificates, the implementation guide Certificate Lifecycle on CyberArk Certificate Manager, and Book 08, Chapter 05 on DNS at the SD-WAN edge. The page names one vendor to illustrate Book 09's vendor-neutral design; it isn't an endorsement by any agency. Comments and corrections are welcome as issues on GitHub.`,
  `${PAGE} (Status and review; Related).`);
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full list on the following slides.");
}
{
  const s = content("Backup", "Couldn't verify");
  T(s, "Gaps", bullets([
    "The joint Cybersecurity Advisory on SD-WAN exploitation (media.defense.gov returned HTTP 403); the ASD pages hosting the hunt guide and Security Considerations for Edge Devices didn't respond. Their content appears only as CISA's supplemental guidance describes it.",
    "A Cisco \"recommended release\" statement, and the trains available in SDWAN-G.",
    "SDWAN-G remediation of CVE-2026-76504: the advisory names only Cisco's managed cloud.",
    "Cflowd and IPFIX export details on IOS XE 17.x (Cisco's page returned 404).",
    "The release-20.18 disaster-recovery procedure for Manager (the design guide found is from 2021).",
    "The DoDIN Approved Products List entry, if any (High only).",
    "SD-WAN mode in edge FIPS validation and in NIAP's evaluated configurations.",
    "Whether Global Secure Access remote networks, specifically, are generally available in GCC (Microsoft's statement is product-wide).",
    "Cisco SD-WAN's Sentinel solution in Azure Government; whether Umbrella for Government still automates Catalyst SD-WAN tunnels.",
    "The audit-log query: last_n_hours was tested only against mocked responses.",
  ], 13), { x: 0.6, y: 1.45, w: 12.1, h: 5.05, paraSpaceAfter: 4, fontSize: 13 });
  sources(s, "Sources: research page (What couldn't be verified; Status and review), Oct 24, 2026. To move the guide to Proved, build Gate 0 and the ten-site pilot.");
}
{
  const s = content("Backup", "Sources: CISA, Cisco advisories and FedRAMP");
  T(s, "Source list 1", bullets([
    "CISA: Known Exploited Vulnerabilities Catalog, JSON feed, catalog version 2026.10.23; ED 26-03, Mitigate Vulnerabilities in Cisco SD-WAN Systems (Feb 25, 2026; V1 updated Mar 11, 2026); Supplemental Direction ED 26-03: Hunt and Hardening Guidance for Cisco SD-WAN Systems.",
    "Cisco security advisories: cisco-sa-sdwan-rpa-EHchtZk (v2.0, Jun 16, 2026); cisco-sa-sd-wan-priv-E6e8tEdF (v1.2, Feb 25, 2026); cisco-sa-sdwan-authbp-qwCX8D4v (v1.3, Apr 22, 2026); cisco-sa-sdwan-rpa2-v69WY2SW (v2.0, Jun 16, 2026); cisco-sa-sdwan-privesc-4uxFrdzx (v1.10, Jul 21, 2026); cisco-sa-sdwan-arbfw-c2rZvQ (v1.1, Jun 15, 2026); cisco-sa-sdwan-webauth-xr8beuuU (v1.1, Oct 2, 2026).",
    "Cisco: Transition to a Risk-Based Vulnerability Disclosure Model; Catalyst SD-WAN Hardening Guide (rev. 1.1, Feb 9, 2026); SD-WAN for Government Configuration Guide (Introduction; Security Features); Control Components Compatibility Matrix and Recommended Computing Resources (20.18); Administrator-Triggered Cluster Failover Deployment Guide.",
    "FedRAMP Marketplace products.json (last change Oct 24, 2026): FR2012534927, Cisco Catalyst SD-WAN for Government (SDWAN-G); FR2304757473A, Cisco Security Cloud for Government.",
    "NIST CMVP certificates #4747, #5356 and #5430; NIAP Product Compliant List; Cisco FIPS 140 and Common Criteria pages; NIST SP 800-53 CM-6; CIS Benchmarks (Cisco IOS XE 17.x); Cisco IOS XE Software Hardening Guide (rev. 3.2); DISA STIG library (Cisco IOS XE Router STIG bundle; High only).",
  ], 12), { x: 0.6, y: 1.45, w: 12.1, h: 5.05, paraSpaceAfter: 5, fontSize: 12 });
  sources(s, "Sources: as listed; full links in the research page's footnotes. All accessed Oct 24, 2026.");
}
{
  const s = content("Backup", "Sources: Cisco guides, DevNet and Microsoft");
  T(s, "Source list 2", bullets([
    "Cisco configuration guides: Certificate Management (26.x); Getting Started Guide, Overlay Network Bring-Up; Certificates and Authorized Serial Number File PDG; Policies Configuration Guide 17.x, Application-Aware Routing; Security Configuration Guide 17.x (TrustSec; Security Parameters; Enterprise Firewall; Umbrella Integration); Cloud OnRamp for SaaS.",
    "Cisco documents: Quick Start Guide, Simplified Configuration (222297); Start Your Catalyst SD-WAN Upgrade (225515); TrustSec SGT Inline and SXP (222699); Configure Secure Access with SD-WAN (225416, 225524); Multi-Region Fabric FAQ (Jun 4, 2024); TIC 3.0 Architecture Guide (Oct 20, 2021); Catalyst SD-WAN and Microsoft SSE Integration User Guide (Sep 17, 2024).",
    "Cisco Secure Access for Government help: Secure Access Regions; Device Compatibility; Integrate Catalyst SD-WAN with Secure Access.",
    "Cisco DevNet: Catalyst SD-WAN Manager API Authentication; API Examples; AuditLogEntry and Get vManage Audit Log; catalystwan Python SDK.",
    "Microsoft Learn: Known limitations for Global Secure Access; Global Secure Access partner ecosystem; Microsoft 365 informed network routing; Sentinel data connector reference (Cisco Software Defined WAN); Sentinel feature availability; Migrate from the HTTP Data Collector API.",
    "Diagrams: Book 09, Chapters 05, 08 and 11 (committed figures). Related: SD-WAN and SASE Platforms Against Book 09's Requirements.",
  ], 12), { x: 0.6, y: 1.45, w: 12.1, h: 5.05, paraSpaceAfter: 5, fontSize: 12 });
  sources(s, "Sources: as listed; full links in the research page's footnotes. All accessed Oct 24, 2026. Not an endorsement by any agency.");
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
