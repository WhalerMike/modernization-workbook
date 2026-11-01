// Ticket-to-Machine on ServiceNow and SailPoint: An Example — a narrated research deck (about 10 minutes).
// The vendor-named companion to Book 13, Appendix B: the same loop, lanes and identity fixes worked through on
// ServiceNow (the front door and the record) and SailPoint Identity Security Cloud (identity governance), the
// four gaps between the products and the loop, and federal availability and cautions.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_TTM_ServiceNow_SailPoint.pptx
// Code model: ../b13-ticket-to-machine/build.js (its vendor-neutral companion): narration.js keyed by slide
// title, Detail block in the notes, the same table, panel, flow, fact-box and callout helpers.
// Every fact comes from docs/books/guides/ttm-servicenow-sailpoint.md and its footnotes (vendor and Marketplace
// sources opened October 24, 2026). Its labels are kept: "An example, not a recommendation", (inference) and
// (design guidance). Agency-neutral; an example, not an endorsement.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Ticket-to-Machine on ServiceNow and SailPoint", title: "An Example",
  footer: "Ticket-to-Machine on ServiceNow and SailPoint  ·  An example  ·  Research — under review" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "Research_TTM_ServiceNow_SailPoint.pptx";

// ------------------------------------------------------------------ helpers (as in start-here and b15 technical)
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

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame), or a smaller size.
const callout = (s, name, y, h, iconName, color, label, text, pt = 16) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * pt / 72) / 10.45) * pt / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! slide ${pres.slides.length} ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (process.env.FIT) console.log(`  callout ${name}: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  box(s, name, 0.6, y, 12.15, h, "FFFFFF", color);
  const d = Math.min(0.8, h - 0.2);
  icon(s, iconName, 0.85, y + (h - d) / 2, d, color);
  txt(s, `${name} text`, [{ text: label, options: { bold: true, color } }, { text }],
    { x: 1.9, y: y + 0.05, w: 10.65, h: h - 0.1, fontSize: pt, valign: "middle" });
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

// A tinted panel with a small caps label, a heading and bullets (or numbered steps).
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13, numbered = false) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15.5, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.35 : 0) + (runs.length ? 0.08 : 0);
  const list = numbered
    ? items.map((t, k) => ({ text: t, options: { bullet: { type: "number" }, breakLine: k < items.length - 1, fontSize: pt } }))
    : bullets(items, pt);
  txt(s, `${name} list`, list, { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.7, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

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
};

// Tinted fact boxes in a row: [label, color, tint, text].
const facts = (s, name, top, h, items, pt = 12) => {
  const gap = 0.15, w = (12.15 - gap * (items.length - 1)) / items.length;
  items.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${name} ${i + 1}`, x, top, w, h, f[2]);
    txt(s, `${name} ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: f[1], fontSize: 15, fontFace: "Cambria", breakLine: true } },
      { text: f[3], options: { fontSize: pt } },
    ], { x: x + 0.15, y: top + 0.08, w: w - 0.3, h: h - 0.14, valign: "middle" });
    const need = 0.32 + lines(f[3], w - 0.3, pt) * pt / 72 * 1.2;
    if (need > h - 0.1) console.warn(`  ! slide ${pres.slides.length} ${name} box ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(h - 0.1).toFixed(2)}`);
  });
};

// The "program design" marker on slides that carry the program's lanes, ceilings, severities or windows.
const design = (s, text, x = 0.6, y = 1.42, w = 12.15) =>
  txt(s, "Design label", text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color: HEX.amber, valign: "middle" });


const SUB = "An example  ·  Research — under review";
const PAGE = "Research, Ticket-to-Machine on ServiceNow and SailPoint: An Example";
const S0 = "Orientation";
const S1 = "The products";
const S2 = "The loop and the lanes";
const S3 = "Gaps";
const S4 = "Identity fixes and federal availability";
const S5 = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Ticket-to-Machine on ServiceNow and SailPoint", SUB);
  T(s, "Session map", [
    { text: "THE VENDOR-NAMED COMPANION TO BOOK 13, APPENDIX B  ·  ABOUT 10 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The products and their FedRAMP status  ·  How they hand work to each other", options: { color: HEX.ink, breakLine: true } },
    { text: "The loop and the lanes  ·  Four gaps  ·  Identity fixes  ·  Federal cautions", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: SailPoint, ServiceNow, Microsoft Learn and FedRAMP Marketplace data, opened Oct 24, 2026. An example, not a recommendation or an endorsement.", 6.08);
  notes(s,
`A narrated walk through the research example "Ticket-to-Machine on ServiceNow and SailPoint: An Example," the vendor-named companion to the vendor-neutral Book 13, Appendix B — Ticket-to-Machine Reference. Appendix B is vendor-neutral on purpose: the loop runs on "whatever ITSM platform the agency already has." This companion picks two products to show what the loop looks like in practice: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud (ISC) as identity governance. Other products can fill the same slots. The loop in Book 13 has five steps: test, detect drift, raise a typed task, actuate on the native surface, and close with evidence from a re-read. The draft "Keeping Identity Correct After HR Becomes the Source" applies it to identity, with a catalog of the fixes that still happen. The page walks both through the two named products, and finds four places where the products, used as shipped, fall short of the loop. Product facts are the vendors' own statements, checked on October 24, 2026; mappings marked (inference) or (design guidance) are the program's. Status: in review. The page names products to illustrate the vendor-neutral design; it isn't an endorsement by any agency.`,
  `${PAGE} (opening; Status and review).`);
}

// ================================================================== 2 An example, not a recommendation
{
  const s = content(S0, "An example, not a recommendation");
  tag(s, "Why");
  flow(s, "Loop", 1.55, 1.0, [
    { head: "1  Test" },
    { head: "2  Detect drift" },
    { head: "3  Raise a typed task" },
    { head: "4  Actuate natively" },
    { head: "5  Close with a re-read", color: HEX.amber, tint: HEX.amberTint },
  ], 12.5);
  panel(s, "Why name", 0.6, 2.75, 6.0, 2.45, HEX.navy, HEX.navyTint, "WHY NAME PRODUCTS", "Show the loop in practice", [
    "Appendix B is vendor-neutral on purpose: the loop runs on \"whatever ITSM platform the agency already has\"",
    "This companion works the same loop, lanes and identity fixes through two named products",
    "It finds four places where the products, used as shipped, fall short of the loop",
  ], 13);
  panel(s, "Slots", 6.75, 2.75, 6.0, 2.45, HEX.teal, HEX.tealTint, "THE SLOTS IN THE LOOP", "Other products can fill the same slots", [
    "Front door and the record: ServiceNow, in this example",
    "Identity governance: SailPoint Identity Security Cloud, in this example",
    "Names products to illustrate the design; not an endorsement by any agency",
  ], 13);
  callout(s, "Labels", 5.4, 1.0, "FaClipboardCheck", HEX.amber, "Whose statement is it? ",
    "Product facts are the vendors' own, checked Oct 24, 2026. Mappings marked (inference) or (design guidance) are the program's.", 15);
  sources(s, "Sources: research page (An example, not a recommendation; Status and review); Book 13, Appendix B (The coordination loop).");
  notes(s,
`An example, not a recommendation. Book 13, Appendix B is vendor-neutral on purpose: the loop runs on "whatever ITSM platform the agency already has." This companion picks two products to show what the loop looks like in practice: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud as identity governance. Other products can fill the same slots. The five steps of Book 13's loop: test, detect drift, raise a typed task, actuate on the native surface, and close with evidence from a re-read. The identity-maintenance draft applies the loop to identity, with a catalog of the fixes that still happen; this page walks both through the two products and finds four gaps. Labels: product facts are the vendors' own statements, checked on October 24, 2026. Mappings marked (inference) or (design guidance) are the program's, not the vendors'. The page names products to illustrate the vendor-neutral design; it isn't an endorsement by any agency.`,
  `${PAGE} (An example, not a recommendation; opening).`);
}

// ================================================================== 3 Products and FedRAMP status
{
  const s = content(S1, "The products and their FedRAMP status");
  tag(s, "What");
  const b = table(s, "Products", 1.5, [3.85, 3.3, 5.0], ["Slot in the loop", "Product", "FedRAMP Marketplace, Oct 24, 2026"], [
    ["Front door, task record, change approval", "ServiceNow, Government Community Cloud", "FedRAMP Certified, High (Class D), JAB, since August 12, 2019"],
    ["Identity governance: HR aggregation, lifecycle, requests, certifications, provisioning", "SailPoint Identity Security Cloud", "FedRAMP Certified, Moderate (Class C), agency authorization, since June 5, 2024"],
    ["The alternative", "SailPoint IdentityIQ, self-hosted", "No listing of its own; a component inside another provider's High authorization"],
  ], { fontSize: 12.5 });
  const py = b + 0.15, ph = 2.05;
  panel(s, "Why ISC", 0.6, py, 6.0, ph, HEX.teal, HEX.tealTint, "WHY IDENTITY SECURITY CLOUD FOR THE EXAMPLE", "A listing a reader can check", [
    "A public FedRAMP listing, at Moderate",
    "It reaches both Entra ID and Active Directory",
    "SailPoint documents its ServiceNow integrations",
  ], 12.5);
  panel(s, "When IIQ", 6.75, py, 6.0, ph, HEX.navy, HEX.navyTint, "WHEN IDENTITYIQ FITS INSTEAD", "The self-hosted alternative", [
    "Identity governance must run inside the agency's own boundary",
    "The agency needs a High system",
    "It needs ServiceNow change-request tickets from the governance tool",
  ], 12.5);
  callout(s, "Human Fabric", py + ph + 0.12, 0.62, "FaTriangleExclamation", HEX.red, "Check the name: ",
    "SailPoint now markets ISC as \"Human Fabric\"; the Marketplace uses the older name. Confirm the product bought is the one authorized.", 14.5);
  sources(s, "Sources: FedRAMP Marketplace products.json (F1305072116; FR2001938710A; FR2208555094); SailPoint IdentityIQ ITSM and SDIM docs; Human Fabric page. Oct 24, 2026.");
  notes(s,
`The products in this example, with their federal status from FedRAMP Marketplace data on October 24, 2026. Front door, task record and change approval: ServiceNow, Government Community Cloud, FedRAMP Certified at High (Class D), JAB, since August 12, 2019 (F1305072116). Identity governance (HR aggregation, lifecycle, requests, certifications, provisioning): SailPoint Identity Security Cloud, FedRAMP Certified at Moderate (Class C), agency authorization, since June 5, 2024 (FR2001938710A). The alternative, SailPoint IdentityIQ, self-hosted, has no listing of its own; it appears as a component inside another provider's High authorization (UberEther IAM Advantage, FR2208555094, whose component list includes IdentityIQ). Why ISC for the example: it has a public FedRAMP listing a reader can check, it reaches both Entra ID and Active Directory, and SailPoint documents its ServiceNow integrations. IdentityIQ fits an agency that must run identity governance inside its own boundary, needs a High system, or needs ServiceNow change-request tickets from the governance tool, which only IdentityIQ's integration offers. Caution: SailPoint now markets ISC as "Human Fabric" while the Marketplace still uses the older name, so confirm that the product purchased is the one authorized.`,
  `${PAGE} (The products in this example).`);
}

// ================================================================== 4 The picture
{
  const s = content(S1, "The picture: the loop on ServiceNow and SailPoint");
  tag(s, "What");
  img(s, "b13-governance/ttm-snow-sailpoint",
    "Diagram. Core HCM, the source of authority where HR corrects facts, feeds SailPoint Identity Security Cloud by aggregation. SailPoint (identity governance: aggregates HR and runs lifecycle states, access requests and certifications, and native change detection) exchanges tickets and requests with ServiceNow (the front door and record: catalog, cases and change records, approvals per authority class, one closure record). SailPoint provisions Entra ID and AD through connectors; ServiceNow reaches Entra through its Entra spoke for A0 and A1 tasks. Entra and AD lead to a re-read on the next aggregation or a native-change event, not ticket status, and the evidence closes the ServiceNow record. A dashed red line from SailPoint leads to a declared exception: a disconnected application handled by a Service Desk ticket, a recorded session and an end date.",
    0.6, 1.55, 12.15, 3.0);
  facts(s, "Roles", 4.75, 1.65, [
    ["Core HCM", HEX.navy, HEX.navyTint, "The source of authority, where HR corrects facts; feeds SailPoint by aggregation"],
    ["SailPoint", HEX.teal, HEX.tealTint, "Governs identities and entitlements; provisions Entra ID and AD through connectors"],
    ["ServiceNow", HEX.navy, HEX.navyTint, "The front door and the one closure record; its Entra spoke handles simple tasks"],
    ["The re-read", HEX.amber, HEX.amberTint, "The next aggregation or a native-change event closes the record, not the ticket status"],
  ], 12.5);
  sources(s, "Sources: research page (figure: the loop on ServiceNow and SailPoint); Book 13, Appendix B (The coordination loop).");
  notes(s,
`The loop on ServiceNow and SailPoint. Core HCM is the source of authority, where HR corrects facts, and it feeds SailPoint Identity Security Cloud by aggregation. SailPoint is identity governance: it aggregates HR and runs lifecycle states, access requests and certifications, and native change detection; it provisions Entra ID and AD through connectors. SailPoint and ServiceNow exchange tickets and requests. ServiceNow is the front door and the record: the catalog, cases and change records, approvals per authority class, and one closure record; it reaches Entra through its Entra spoke for A0 and A1 tasks. Entra and AD lead to a re-read on the next aggregation or a native-change event, not the ticket status, and that evidence closes the ServiceNow record. A dashed red line from SailPoint leads to a declared exception: a disconnected application handled by a Service Desk ticket, a recorded session and an end date.`,
  `${PAGE} (figure).`);
}

// ================================================================== 5 Handoffs
{
  const s = content(S1, "How the two products hand work to each other");
  tag(s, "How");
  const b = table(s, "Handoffs", 1.5, [2.2, 2.35, 4.6, 3.0], ["Direction", "Mechanism", "What it does", "Fit with the loop"], [
    ["SailPoint to ServiceNow", "Service Desk integration", "Turns provisioning SailPoint can't do directly into ServiceNow Service Requests or Incidents, for \"disconnected applications\"; checks ticket status \"at regular intervals\"", "The residual manual step, and the declared exception. Gap 1"],
    ["ServiceNow to SailPoint", "Service Catalog app", "People request SailPoint roles, access profiles and entitlements in ServiceNow; SailPoint checks separation of duties; approval is \"defined in ServiceNow\"; SailPoint provisions and writes status back", "One front door for people. Gap 2"],
    ["Both", "Identity Governance app", "Syncs user data and lets certifiers review inside ServiceNow; governs ServiceNow's own roles", "Reviewers work in one tool"],
    ["ServiceNow to Entra ID", "Entra ID spoke (Integration Hub)", "Create, update, enable, disable and delete users, revoke sign-in sessions and more, through Microsoft Graph", "Simple, low-authority tasks routed to ServiceNow (Book 15)"],
  ], { fontSize: 12 });
  callout(s, "Apps", b + 0.2, 0.9, "FaCubes", HEX.teal, "Who builds the integration: ",
    "SailPoint publishes these as its own ServiceNow apps, each licensed separately. ServiceNow's docs show no SailPoint integration of its own.", 14.5);
  sources(s, "Sources: SailPoint, Getting Started with ServiceNow; ISC with the Service Catalog app; SDIM intro and status mapping. ServiceNow, Entra ID spoke (Zurich). Oct 24, 2026.");
  notes(s,
`SailPoint publishes the ServiceNow integrations as its own ServiceNow apps, each licensed separately; ServiceNow's documentation shows no SailPoint integration of its own. SailPoint to ServiceNow, the Service Desk integration: it turns provisioning actions SailPoint can't perform directly into ServiceNow Service Requests or Incidents, for "disconnected applications," and checks the ticket's status "at regular intervals." In the loop that's the residual manual step and the declared exception, and it's Gap 1. ServiceNow to SailPoint, the Service Catalog app: people request SailPoint roles, access profiles and entitlements in ServiceNow; SailPoint checks separation of duties; approval is "defined in ServiceNow"; SailPoint provisions and writes the status back. One front door for people, and Gap 2. Both directions, the Identity Governance app: syncs user data and lets certifiers review inside ServiceNow, and governs ServiceNow's own roles, so reviewers work in one tool. ServiceNow to Entra ID, the Entra ID spoke (Integration Hub): create, update, enable, disable and delete users, revoke sign-in sessions and more, through Microsoft Graph; simple, low-authority tasks routed to ServiceNow, as Book 15 describes.`,
  `${PAGE} (How the two products hand work to each other).`);
}

// ================================================================== 6 The loop step by step
{
  const s = content(S2, "The loop, step by step, on these products");
  tag(s, "How");
  const b = table(s, "Steps", 1.5, [1.9, 2.55, 5.25, 2.45], ["Loop step", "Done by", "Documented mechanism", "Status"], [
    ["1  Test", "SailPoint refresh and aggregation", "Lifecycle states are evaluated on scheduled refreshes, and missing access is provisioned", "Documented"],
    ["2  Detect drift", "SailPoint", "\"Identity Attributes Changed\" when authoritative-source attributes differ; native-change events when an account is updated outside SailPoint; certification findings", "Documented; as Book 13's drift classes (inference)"],
    ["3  Raise a typed task", "ServiceNow", "Service Desk tickets from SailPoint; Service Catalog requests; drift events raised by a SailPoint workflow calling ServiceNow", "Drift-to-task is a build (design guidance)"],
    ["4  Actuate", "SailPoint connectors; the ServiceNow Entra spoke", "Entra SaaS connector (accounts, groups, licenses, roles, administrative units, access packages, PIM); AD connector through SailPoint's on-premises appliance; spoke actions", "Documented as vendor capability"],
    ["5  Close with evidence", "SailPoint events and search; the ServiceNow record", "SailPoint records Service Desk activity as events in Search; search covers identities, entitlements, events and account activity", { text: "Partial: Gap 1", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 12 });
  callout(s, "Weak spots", b + 0.18, 0.85, "FaRoute", HEX.amber, "The weak spots are steps 3 and 5: ",
    "turning drift into a typed task is something you build, and closing with evidence is only partial.", 14.5);
  sources(s, "Sources: SailPoint Developer (Lifecycle States; Identity Attributes Changed; Native Change; Workflows; Search); SailPoint Entra, AD, SDIM and certification docs.");
  notes(s,
`The loop, step by step. 1, Test: SailPoint refresh and aggregation; lifecycle states are evaluated on scheduled refreshes, and missing access is provisioned. Documented. 2, Detect drift: SailPoint raises "Identity Attributes Changed" when authoritative-source attributes differ, native-change events when an account is updated outside SailPoint, and certification findings. Documented; treating these as Book 13's drift classes is (inference). 3, Raise a typed task: ServiceNow, through Service Desk tickets from SailPoint, Service Catalog requests, and drift events raised by a SailPoint workflow calling ServiceNow. Tickets and catalog are documented; drift-to-task is a build (design guidance). 4, Actuate: SailPoint connectors and the ServiceNow Entra spoke. The Entra SaaS connector covers accounts, groups, licenses, roles, administrative units, access packages and PIM; the AD connector runs through SailPoint's on-premises appliance; plus the spoke's actions. Documented as vendor capability. 5, Close with evidence: SailPoint events and search, and the ServiceNow record. SailPoint records Service Desk activity as events in Search, and search covers identities, entitlements, events and account activity. Partial: this is Gap 1.`,
  `${PAGE} (The loop, step by step).`);
}

// ================================================================== 7 The lanes
{
  const s = content(S2, "The lanes on these products");
  tag(s, "Who");
  design(s, "THE STATUS COLUMN SAYS WHAT THE VENDORS DOCUMENT AND WHAT IS THE PROGRAM'S (INFERENCE) OR (DESIGN GUIDANCE)");
  const b = table(s, "Lanes", 1.78, [2.25, 4.6, 3.6, 1.7], ["Lane", "Done by", "Mechanism", "Status"], [
    ["Machine, autonomous", "SailPoint lifecycle states and birthright access; ServiceNow standard change", "Pre-authorized, low-risk standard changes", "(inference) mapping"],
    ["Machine, gated", "SailPoint access request with approval; ServiceNow normal change", "Approvers by owner, manager or governance group; normal change with approvals", "(inference) mapping"],
    ["Human decision", "SailPoint certification decisions; ServiceNow approval or CAB", "Unsigned revoke decisions aren't applied", "Documented"],
    ["Protocol-enforced", "Neither product: certificates stay with the CLM platform (Book 07)", "—", "—"],
    ["Declared exception", "Service Desk ticket for a disconnected application, a recorded session and an end date", "Service Desk integration", "(design guidance)"],
    ["Emergency change", "ServiceNow emergency change; a SailPoint workflow or lifecycle-state change", "Emergency changes go straight to the CAB; unplanned changes to a configuration item create an unauthorized change request", "Partly documented"],
  ], { fontSize: 12 });
  warn("lanes", b);
  sources(s, "Sources: ServiceNow, Change types (Zurich ITSM); SailPoint Developer, Access Request Approvals; SailPoint, Understanding Certifications; SDIM intro. Oct 24, 2026.");
  notes(s,
`The lanes on these products. Machine, autonomous: SailPoint lifecycle states and birthright access, and ServiceNow standard change, which covers pre-authorized, low-risk standard changes; the mapping is (inference). Machine, gated: a SailPoint access request with approval, where approvers are set by owner, manager or governance group, and a ServiceNow normal change with approvals; (inference) mapping. Human decision: SailPoint certification decisions and ServiceNow approval or the CAB; documented that unsigned revoke decisions aren't applied. Protocol-enforced: neither product; certificates stay with the CLM platform, as Book 07 describes. Declared exception: a Service Desk ticket for a disconnected application, a recorded session and an end date (design guidance). Emergency change: a ServiceNow emergency change, and a SailPoint workflow or lifecycle-state change. Emergency changes go straight to the CAB, and unplanned changes to a configuration item create an unauthorized change request; partly documented.`,
  `${PAGE} (The loop, step by step: lane rows).`);
}

// ================================================================== 8 Gaps 1 and 2
{
  const s = content(S3, "Gaps 1 and 2: ticket status, and who approves");
  tag(s, "Why");
  panel(s, "Gap 1", 0.6, 1.5, 6.0, 3.55, HEX.red, HEX.redTint, "GAP 1", "A ticket status isn't a re-read", [
    "SailPoint's Service Desk best practices: the mapped ServiceNow status decides when the provisioning task is \"treated as complete\"",
    "That is what Book 13 calls closure by assertion",
    "(Design guidance) Close the ServiceNow record only on evidence: the next SailPoint aggregation, or a native-change event, showing the account in the intended state",
  ], 14.5);
  panel(s, "Gap 2", 6.75, 1.5, 6.0, 3.55, HEX.red, HEX.redTint, "GAP 2", "The catalog app moves approval into ServiceNow", [
    "Book 15, Chapter 03: owner-governed access (A2 and A3) is decided in the identity governance platform",
    "With the Service Catalog app, approval is defined in ServiceNow",
    "(Design guidance) Choose one approver system per authority class and write it down: for example, ServiceNow approves A0 and A1, SailPoint approves A2 and A3, and the catalog app only collects the request",
  ], 14.5);
  callout(s, "As shipped", 5.3, 0.95, "FaTriangleExclamation", HEX.red, "Used as shipped, ",
    "the products fall short of Book 13's loop in these two places. In each case the fix is a design choice (design guidance).", 14.5);
  sources(s, "Sources: SailPoint, SDIM: Best Practices; Getting Started with ServiceNow and ISC with the Service Catalog app; Book 15, Ch 03; Book 13, Ch 10. Oct 24, 2026.");
  notes(s,
`Four gaps between the products and the loop; the first two here. Gap 1, a ticket status isn't a re-read. SailPoint's Service Desk best practices say the mapped ServiceNow status decides when the provisioning task is "treated as complete." That's the failure Book 13 calls closure by assertion. (Design guidance:) the ServiceNow record closes only on evidence: the next SailPoint aggregation, or a native-change event, showing the account in the intended state. Gap 2, the catalog app moves access approval into ServiceNow. In Book 15, Chapter 03, access governed by an owner (classes A2 and A3) is decided in the identity governance platform. With the Service Catalog app, approval is defined in ServiceNow. (Design guidance:) choose one approver system per authority class and write it down: for example, ServiceNow approves A0 and A1, and SailPoint approves A2 and A3, with the catalog app only collecting the request.`,
  `${PAGE} (Four gaps between the products and the loop, 1 and 2).`);
}

// ================================================================== 9 Gaps 3 and 4
{
  const s = content(S3, "Gaps 3 and 4: change records, and one writer");
  tag(s, "Why");
  panel(s, "Gap 3", 0.6, 1.5, 6.0, 3.55, HEX.red, HEX.redTint, "GAP 3", "No change-request tickets from ISC", [
    "ISC's Service Desk integration creates Service Requests and Incidents only",
    "IdentityIQ's integration can create change requests",
    "(Design guidance) Where a change class needs a change record, a ServiceNow flow raises it from the request",
    "An agency that needs change-request tickets from the governance tool itself is an IdentityIQ case",
  ], 14.5);
  panel(s, "Gap 4", 6.75, 1.5, 6.0, 3.55, HEX.red, HEX.redTint, "GAP 4", "One door into the directory becomes a choice", [
    "SailPoint reads Oracle HCM Cloud directly, with no on-premises appliance, and writes back only user name and work email, as Book 03 allows",
    "Book 03's design makes Entra inbound provisioning the one writer into the directory",
    "(Design guidance) Pick one writer per attribute: inbound provisioning stays the door and SailPoint governs entitlements, or SailPoint becomes the provisioning service with Book 03's middleware duties",
  ], 14.5);
  callout(s, "Not both", 5.3, 0.95, "FaRightLeft", HEX.navy, "Not both: ",
    "either Entra inbound provisioning or SailPoint writes each attribute into the directory (design guidance).", 14.5);
  sources(s, "Sources: SailPoint, SDIM intro; Configuring IdentityIQ to Integrate with ServiceNow; Oracle HCM Cloud SaaS: Supported Features; Book 03, Ch 05. Oct 24, 2026.");
  notes(s,
`Gap 3, no change-request tickets from ISC. ISC's Service Desk integration creates Service Requests and Incidents only; IdentityIQ's can create change requests. Where a change class needs a change record, a ServiceNow flow raises it from the request (design guidance). Gap 4, one door into the directory becomes a choice. SailPoint reads Oracle HCM Cloud directly, with no on-premises appliance, and writes back only the user name and work email, which matches what Book 03 (The provisioning pipeline) allows. But Book 03's design makes Entra inbound provisioning the one writer into the directory. (Design guidance:) pick one writer per attribute. Either Entra inbound provisioning stays the door and SailPoint governs entitlements, or SailPoint becomes the provisioning service and takes on Book 03's middleware duties. Not both.`,
  `${PAGE} (Four gaps between the products and the loop, 3 and 4).`);
}

// ================================================================== 10 Identity fixes, part 1
const FIXCOLS = [2.7, 3.15, 2.35, 3.95];
const FIXHEAD = ["Fix", "Detect", "Route and track", "Fix and carry back"];
{
  const s = content(S4, "Identity fixes: HR facts, leavers and stray writes");
  tag(s, "How");
  design(s, "(INFERENCE) OR (DESIGN GUIDANCE) UNLESS THE SOURCES LINE CITES A VENDOR  ·  FROM THE IDENTITY-MAINTENANCE FIX CATALOG");
  const b = table(s, "Fixes 1", 1.78, FIXCOLS, FIXHEAD, [
    ["A wrong fact in HR", "SailPoint \"Identity Attributes Changed\", or a ServiceNow \"my information is wrong\" item", "ServiceNow case to HR", "HR corrects it in Core HCM; SailPoint re-aggregates. Only user name and work email are writable back"],
    ["A late or retroactive personnel action", "A lifecycle-state change on aggregation", "ServiceNow emergency change if after the fact", "The leaver state disables accounts; the Entra connector revokes sessions on disable"],
    ["An urgent leaver HR hasn't entered", "A manager or security calls", "ServiceNow emergency change", "A SailPoint workflow or manual lifecycle-state change runs the same leaver sequence"],
    ["A record the pipeline couldn't apply", "A failed provisioning action, or a Service Desk \"Failed\" status", "ServiceNow task to the identity data steward", "Re-run through SailPoint, never by hand"],
    [{ text: "A write outside the pipeline", options: { bold: true, color: HEX.teal } }, "SailPoint native change detection: an account updated outside SailPoint", "ServiceNow task, provenance class", "SailPoint restores the value; the writer's access is reviewed. The closest one-to-one fit"],
  ], { fontSize: 12 });
  warn("fixes 1", b);
  sources(s, "Sources: SailPoint Developer (Identity Attributes Changed; Lifecycle States; Workflows; Native Change); SailPoint Entra, Oracle HCM and SDIM status docs.");
  notes(s,
`The identity fixes, on these products, from the identity-maintenance draft's fix catalog. Everything here is (inference) or (design guidance) unless a vendor source is cited. A wrong fact in HR: detected by SailPoint's "Identity Attributes Changed" trigger, or a caller uses a ServiceNow "my information is wrong" item; routed as a ServiceNow case to HR; HR corrects it in Core HCM and SailPoint re-aggregates. SailPoint can't write HR-mastered attributes back: only user name and work email are writable (Oracle HCM Cloud connector). A late or retroactive personnel action: detected as a lifecycle-state change on aggregation; a ServiceNow emergency change if after the fact; the leaver state disables accounts and the Entra connector revokes sessions on disable. An urgent leaver HR hasn't entered: a manager or security calls; a ServiceNow emergency change; a SailPoint workflow or a manual lifecycle-state change runs the same leaver sequence. A record the pipeline couldn't apply: a failed provisioning action or a Service Desk "Failed" status; a ServiceNow task to the identity data steward; re-run through SailPoint, never by hand. A write outside the pipeline: SailPoint native change detection, an account updated outside SailPoint; a ServiceNow task in the provenance class; SailPoint restores the value and the writer's access is reviewed. The closest one-to-one fit in the catalog.`,
  `${PAGE} (The identity fixes, on these products, rows 1–5).`);
}

// ================================================================== 11 Identity fixes, part 2
{
  const s = content(S4, "Identity fixes: matching, contractors and rules");
  tag(s, "How");
  design(s, "(INFERENCE) OR (DESIGN GUIDANCE) UNLESS THE SOURCES LINE CITES A VENDOR  ·  FROM THE IDENTITY-MAINTENANCE FIX CATALOG");
  const b = table(s, "Fixes 2", 1.78, FIXCOLS, FIXHEAD, [
    ["An account that matches nobody", "Uncorrelated accounts on aggregation", "The account owner decides", "Correlate it to a person, or disable it"],
    ["The same person twice, or a broken link", "SailPoint correlation; rehire and conversion handling", "Data architect", "A correlation-rule change; partial support for some mover cases in the change feed"],
    ["A fact HR doesn't own (contractors)", "A separate contractor source in SailPoint", "Sponsor", "Correct it in the contractor source; confirm NERM is in the ISC authorization from the package"],
    ["A rule that derives the wrong access", "A certification campaign", "Governance body, via a ServiceNow normal change", "Change the role or lifecycle rule"],
    ["Residual access after a move", "Attribute-change trigger, then a certification", "Entitlement owner", "Previous-state access is revoked automatically; else through the connector or a Service Desk ticket"],
    ["A credential that outlives the person", "Outside both products: PIV and certificates", "Credentialing office", "The card system and the CLM platform (Book 07)"],
  ], { fontSize: 12 });
  warn("fixes 2", b);
  sources(s, "Sources: SailPoint Developer (Native Change; Identity Attributes Changed; Lifecycle States); SailPoint Oracle HCM and certification docs; NERM press release (Mar 4, 2025).");
  notes(s,
`The rest of the fix catalog on these products, (inference) or (design guidance) unless a vendor source is cited. An account that matches nobody: uncorrelated accounts on aggregation; the account owner decides; correlate it to a person, or disable it. The same person twice, or a broken link: SailPoint correlation, with rehire and conversion handling; routed to the data architect; a correlation-rule change. SailPoint notes partial support for some mover cases in the change feed. A fact HR doesn't own (contractors): a separate contractor source in SailPoint; the sponsor; correct it in the contractor source. SailPoint says its Non-Employee Risk Management (NERM) product is inside the ISC FedRAMP authorization (press release, March 4, 2025); confirm that from the authorization package, not the press release. A rule that derives the wrong access: a certification campaign; the governance body, through a ServiceNow normal change; change the role or lifecycle rule. Residual access after a move: the attribute-change trigger, then a certification; access granted by the previous lifecycle state is revoked automatically; the entitlement owner; revocation through the connector, else a Service Desk ticket. A credential that outlives the person: outside both products, PIV and certificates; the credentialing office; the card system and the CLM platform (Book 07).`,
  `${PAGE} (The identity fixes, on these products, rows 6–11).`);
}

// ================================================================== 12 Federal availability and cautions
{
  const s = content(S4, "Federal availability and cautions");
  tag(s, "What");
  const b = table(s, "Availability", 1.5, [3.1, 3.35, 2.9, 2.8], ["Piece", "GCC (Microsoft 365 Moderate)", "GCC High", "Note"], [
    ["SailPoint ISC", "Worldwide Microsoft Graph endpoints apply", "Endpoint overrides documented for the Entra source", "FedRAMP Moderate"],
    ["ServiceNow Entra ID spoke", "Default Graph endpoint fits", "Not documented on the spoke page", "Needs an Integration Hub subscription"],
    ["SailPoint's ServiceNow apps", "Not confirmed in ServiceNow's government Store", "Not confirmed", "The government cloud has an isolated Store instance"],
  ], { fontSize: 12.5 });
  const py = b + 0.2, ph = 6.45 - py, pw = (12.15 - 0.3) / 3;
  panel(s, "Where", 0.6, py, pw, ph, HEX.amber, HEX.amberTint, "CAUTION 1", "Where the connector runs", [
    "Cloud connectors call Graph from SailPoint's cloud; only AD runs through the on-premises appliance",
    "Record which actions run from the vendor's cloud (inference)",
  ], 12.5);
  panel(s, "MFA", 0.6 + pw + 0.15, py, pw, ph, HEX.amber, HEX.amberTint, "CAUTION 2", "Vendor claims aren't policy", [
    "\"MFA attribute management\" isn't an authentication-method reset with identity proofing",
    "That reset stays with the Book 15 help desk procedure",
  ], 12.5);
  panel(s, "Parity", 0.6 + 2 * (pw + 0.15), py, pw, ph, HEX.amber, HEX.amberTint, "CAUTION 3", "Confirm the FedRAMP environment", [
    "No SailPoint page found lists which features are or aren't in the FedRAMP environment",
    "Ask before relying on any of this",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn, Graph national cloud deployments; SailPoint Azure Government endpoints, AD and Entra docs; ServiceNow Entra spoke; federal Store page. Oct 24, 2026.");
  notes(s,
`Federal availability. SailPoint ISC: in GCC (Microsoft 365 Moderate) the worldwide Microsoft Graph endpoints apply; for GCC High, endpoint overrides are documented for the Entra source; FedRAMP Moderate. The ServiceNow Entra ID spoke: the default Graph endpoint fits GCC; GCC High isn't documented on the spoke page; it needs an Integration Hub subscription. SailPoint's ServiceNow apps: not confirmed in ServiceNow's government Store for either; ServiceNow's government cloud has an isolated Store instance. Cautions. Where the connector runs matters: SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud; only the Active Directory path runs through SailPoint's on-premises appliance. Book 15's rule is to execute through a connector inside the boundary, so record which actions run from the vendor's cloud (inference). Vendor claims aren't help desk policy: the Entra connector lists "MFA attribute management"; that isn't the same as an authentication-method reset with identity proofing, which stays with the help desk procedure in Book 15. Confirm what's in the FedRAMP environment: no SailPoint page was found that lists which features are or aren't available in the FedRAMP environment; ask before relying on any of the above.`,
  `${PAGE} (Federal availability and cautions).`);
}

// ================================================================== 13 Close
{
  const s = content(S5, "What to verify, decide, and read next");
  tag(s, "Who");
  const pw = (12.15 - 0.3) / 3, ph = 3.6;
  panel(s, "Verify", 0.6, 1.5, pw, ph, HEX.navy, HEX.navyTint, "VERIFY IN A LAB", "From under review to Proved", [
    "Build the loop with a test tenant and record the evidence",
    "ISC feature parity in the FedRAMP environment",
    "The SailPoint apps in the government Store",
    "The Entra spoke in GCC High",
  ], 13.5);
  panel(s, "Decide", 0.6 + pw + 0.15, 1.5, pw, ph, HEX.teal, HEX.tealTint, "DECIDE (DESIGN GUIDANCE)", "The four gaps, as decisions", [
    "A record closes on a re-read, not a ticket status",
    "One approver system per authority class",
    "How change records are raised from requests",
    "One writer into the directory per attribute",
  ], 13.5);
  panel(s, "Read", 0.6 + 2 * (pw + 0.15), 1.5, pw, ph, HEX.amber, HEX.amberTint, "READ NEXT", "The vendor-neutral originals", [
    "Book 13, Appendix B — Ticket-to-Machine Reference, and its narrated deck",
    "Keeping Identity Correct After HR Becomes the Source (draft)",
    "Book 15 — Compliance Automation & Day-2 Operations",
  ], 13.5);
  callout(s, "Example", 5.3, 0.9, "FaLightbulb", HEX.amber, "An example, not an endorsement: ",
    "other products can fill the same slots. The loop, the lanes and the fixes are the design; the products illustrate it.", 14.5);
  sources(s, "Sources: research page (Status and review; Related); Book 13, Appendix B; identity-maintenance draft.");
  notes(s,
`Status: in review. To move this example to Proved, build the loop in a lab with a test tenant and record the evidence on the page. What couldn't be verified, and so should be checked: the ServiceNow Store listings for the SailPoint apps, their availability in the government Store, the Service Catalog app's internals, ISC feature parity in the FedRAMP environment, the Service Desk status-check interval, event retention in SailPoint, end-dated access requests, and the Entra spoke in GCC High. Decisions, restating the four gaps as design guidance: the ServiceNow record closes only on evidence from a re-read; one approver system per authority class, written down; a ServiceNow flow raises change records where a change class needs one; one writer per attribute into the directory, not both. Read next: Book 13, Appendix B — Ticket-to-Machine Reference and its narrated deck; Book 15 — Compliance Automation & Day-2 Operations; and the draft Keeping Identity Correct After HR Becomes the Source. The page names products to illustrate the vendor-neutral design; it isn't an endorsement by any agency. Comments and corrections are welcome as issues on GitHub.`,
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
    "The ServiceNow Store listings for the SailPoint apps: the pages render by script.",
    "Their availability in ServiceNow's government Store.",
    "The Service Catalog app's internals.",
    "ISC feature parity in the FedRAMP environment.",
    "The Service Desk status-check interval (documented only as \"at regular intervals\").",
    "Event retention in SailPoint.",
    "End-dated access requests.",
    "The ServiceNow Entra ID spoke in GCC High.",
  ], 16), { x: 0.6, y: 1.5, w: 12.1, h: 4.6, paraSpaceAfter: 8, fontSize: 16 });
  sources(s, "Sources: research page (Status and review), Oct 24, 2026. To move the example to Proved, build the loop in a lab with a test tenant.");
}
{
  const s = content("Backup", "Sources behind this example");
  T(s, "Source list", bullets([
    "FedRAMP Marketplace data, fedramp.gov/marketplace/products.json (last change Oct 24, 2026): ServiceNow Government Community Cloud (F1305072116); SailPoint Identity Security Cloud (FR2001938710A); UberEther IAM Advantage (FR2208555094).",
    "SailPoint documentation: Configuring IdentityIQ to Integrate with ServiceNow; Integrating SailPoint with ServiceNow Service Desk (Sept 21, 2026); SDIM: Status Mapping, Configuring SailPoint, Best Practices; Getting Started with ServiceNow; Integrating ISC with the ServiceNow Service Catalog Application (Oct 23, 2026).",
    "SailPoint documentation: Understanding Certifications; Microsoft Entra SaaS: Supported Features; Azure Government Endpoint Configuration; Integrating SailPoint with Active Directory (Sept 17, 2026); Oracle HCM Cloud SaaS: Supported Features.",
    "SailPoint Developer: Lifecycle States; Identity Attributes Changed and Native Change Account Updated event triggers; Workflows; Search; Access Request Approvals.",
    "SailPoint: Human Fabric product page; press release, Non-Employee Risk Management FedRAMP authorized (Mar 4, 2025).",
    "ServiceNow: Microsoft Entra ID spoke (Zurich); Change types (Zurich IT Service Management); Environments with federal or regional ServiceNow Store instances (Yokohama).",
    "Microsoft Learn: Microsoft Graph national cloud deployments. Diagram: the research page's figure. Full links in the page's footnotes; all accessed Oct 24, 2026.",
  ], 12), { x: 0.6, y: 1.45, w: 12.1, h: 5.05, paraSpaceAfter: 5, fontSize: 12 });
  sources(s, "Sources: as listed. Product facts are the vendors' own; (inference) and (design guidance) are the program's. An example, not a recommendation.");
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
