// Book 03 — HR-Driven Identity: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The data and the pipe:            Module 1 (Ch04 + Ch06, attribute authority and the canonical schema),
//                                              Module 2 (Ch03 + Ch05, the provisioning pipeline).
//   Part 2 — Lifecycle, access and evidence:   Module 3 (Ch08–10, joiner-mover-leaver, credentials, access),
//                                              Module 4 (Ch07, Ch11–12, Appendix C, evidence, ownership and the plan).
// Build:  node presentations/b03-hr-identity-technical/build.js presentations/b03-hr-identity-technical/B03_HR_Identity_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b03-hr-identity/; the notes name the chapter.
// Program recommendations are labeled "design guidance" and the book's own inferences "inference".
// Narration: narration.json (intent-first voice); presentations/_build/narrate.py and captions.py, then
// build_narrated.ps1 (the editor runs those). The notes keep the full detail for a live presenter.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 03", title: "HR-Driven Identity — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  return D.callout(s, name, y, h, iconName, color, label, text);
};
const OUT = process.argv[2] || "B03_HR_Identity_Technical.pptx";
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b03-hr-identity", "png");

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

// Titles: at most 58 characters and unique across the deck.
const titles = new Set();
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.has(t)) throw new Error(`duplicate title: ${t}`);
  titles.add(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// The short Sources line on every content slide: at most 185 characters.
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
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
    const need = y + 0.1 + (pt + 2.5) / 72 * 1.2 * lines(st.head, w - 0.24, pt + 2.5) + lines(st.body, w - 0.24, pt) * pt / 72 * 1.2 + 0.05;
    if (need > y + h) console.warn(`  ! ${name} step ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
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
      { text: f[0], options: { bold: true, color: f[1], fontSize: 14, fontFace: "Cambria", breakLine: true } },
      { text: f[3], options: { fontSize: pt } },
    ], { x: x + 0.15, y: top + 0.08, w: w - 0.3, h: h - 0.14, valign: "middle" });
    const need = 0.3 + lines(f[3], w - 0.3, pt) * pt / 72 * 1.2;
    if (need > h - 0.1) console.warn(`  ! ${name} box ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(h - 0.1).toFixed(2)}`);
  });
};

// A committed diagram from the book, sized from the PNG header's aspect ratio.
const img = (s, name, alt, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  return { w, h };
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, t, sub, items, mins) => {
  const s = titleSlide(sec, t, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((x, k) => ({ text: x, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};


const P1 = "Part 1 — The data and the pipe";
const P2 = "Part 2 — Lifecycle, access and evidence";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "HR-Driven Identity: the technical deep dive", "Book 03 — attribute authority, provisioning, lifecycle, credentials, access and evidence");
  txt(s, "Session map", [
    { text: "Part 1 — The data and the pipe", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Attribute authority and the schema   ·   Module 2  The provisioning pipeline", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Lifecycle, access and evidence", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Lifecycle, credentials and access   ·   Module 4  Evidence, ownership and the plan", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 03 of the Federal Modernization Workbook, HR-Driven Identity. It's for identity engineers, HR systems integrators and ICAM architects: the people who will build the feed from the personnel record to the directory and live with its edge cases.

The fifteen-minute briefing makes the case. This session goes underneath it. It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the data and the pipe: which system owns which fact, the identifier layers and the canonical schema, then the provisioning pipeline from Core HCM to Entra ID and Active Directory, including what Federal HR 2.0 does and doesn't require. Part 2 is lifecycle, access and evidence: personnel actions as triggers, Lifecycle Workflows, PIV binding and revocation, attribute-derived access, then the metrics, drift classes, ownership, the execution plan and the contractor source decision.

The slides show tables, flows and decision matrices. Configuration detail lives in the chapters. Where something is the program's recommendation rather than a vendor or federal fact, the slide says design guidance; where the book infers, it says inference. Vendor facts were checked by the book's chapters on October 20 and 21, 2026, and they change by release.`,
  "Book 03, index; Chapters 01–13; Appendices A–C.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: a token can't prove the claim is true");
  tag(s, "Why");
  img(s, "ch02-orphan-timeline", "The orphan timeline: HR records the separation on day minus 14 and no other system is listening; on day 0 the account, application logins and badge are all still live; on day plus 3 a ticket disables the account but nine application accounts stay enabled; on day plus 45 a review flags two and nobody owns the other seven; on day plus 180 a penetration test signs in with one.",
    0.6, 1.45, 12.15, 1.95);
  const b = table(s, "Era", 3.55, [2.75, 4.2, 5.2], ["", "Perimeter era", "Zero Trust, delivered through SASE"], [
    ["What decides access", "Network location, then static groups", "A token evaluated per session against attributes and dynamic groups"],
    ["Where the user's facts live", "Typed into the directory by IT", "Projected from the HR record"],
    ["Cost of a wrong department", "A wrong phone-book entry", "The wrong dynamic groups, and so the wrong access"],
    ["Cost of a stale status", "An orphaned account", "A valid token for a separated person, usable from anywhere"],
  ], { fontSize: 12.5 });
  txt(s, "Point", [
    { text: "The orphan is the wiring diagram working as built: ", options: { bold: true, color: HEX.red } },
    { text: "one system records the truth, the others need it, and no event channel joins them." },
  ], { x: 0.6, y: b + 0.12, w: 12.15, h: 6.5 - b - 0.12, fontSize: 14, valign: "middle" });
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; CISA ZTMM v2.0; OMB M-19-26; SP 800-53 Rev. 5 PS-5, AC-2; Microsoft Learn — dynamic groups. Book 03, Ch 02.");
  notes(s,
`Why this matters. An access token carries claims: an identifier, group memberships, role assignments. Those claims are projections of upstream facts: this person is employed, holds this position, reports to this supervisor. The platform can prove a claim was signed by the party allowed to sign it. It can't prove the claim is true.

The timeline is Chapter 02's anatomy of an orphaned account. HR records a separation fourteen days ahead; no other system subscribes. On day zero the account, application logins and badge are all live. On day three a ticket disables the directory account and nine application accounts stay enabled. On day forty-five a quarterly review flags two. On day one hundred eighty a penetration test signs in with one. Nothing in that is a failure of diligence; it's one system that records the truth, five that need it, and no wire between them.

The stakes have risen. OMB M-22-09 makes Zero Trust federal strategy, with every request for access evaluated. NIST SP 800-207 describes per-session decisions using attributes the enterprise assigns, and CISA's maturity model makes identity the first pillar. In this book's design SASE delivers it at the edge, and TIC 3.0, under M-19-26, opened that path. In Entra ID, Conditional Access and application roles read dynamic groups computed from attributes, and those attributes are employee data. So a wrong department is now wrong access, and a stale status is a valid token for a separated person.`,
  "Book 03, Chapter 02 — Why HR Is the Source of Authority, \"The fragmented truth problem\" and \"Why the agency needs HR-driven ICAM now.\"");
}

// ================================================================== 3 Architecture
{
  const s = content("Orientation", "The architecture, the boundaries and the principles");
  tag(s, "What");
  flow(s, "Logical", 1.5, 1.3, [
    { head: "Authoritative source", body: "Core HCM; contractors from their own source" },
    { head: "Boundary transform", body: "Source-specific and replaceable" },
    { head: "Governed model", body: "The stable center: canonical schema, one key", color: HEX.amber, tint: HEX.amberTint },
    { head: "Provisioning service", body: "API-driven inbound and Lifecycle Workflows" },
    { head: "Target services", body: "Entra ID, AD, credentials, devices, apps" },
  ], 12);
  table(s, "Contribution", 3.05, [1.6, 4.55], ["Contribution", "What it means here"], [
    ["Authority", "One owner for every attribute; corrections flow upstream"],
    ["Identifiers", "An enterprise person key with layered source, affiliation, directory and credential keys"],
    ["Standards", "OPM data standards and nature-of-action codes as the shared vocabulary"],
    ["Lineage", "A provenance record for every event, from personnel action to every consumer"],
    ["Evidence", "Metrics, drift findings and control support from normal operation"],
  ], { fontSize: 12 });
  panel(s, "Principles", 7.0, 3.05, 5.75, 3.4, HEX.teal, HEX.tealTint, "PRINCIPLES EVERY MODULE USES", null, [
    "Business authority before automation: a designated source must also be correct",
    "Standards before vendor fields; a source change alters only the transform",
    "Block first, reconcile to completion",
    "Native attributes first; extensions only where policy can't read a native one",
    "Privacy by design: the feed is a disclosure",
    "Control support, not control closure",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — HR-driven provisioning; Oracle HCM provisioning tutorial; SOA transfer. OMB M-19-17; FICAM ILM Playbook. Book 03, Ch 01, Ch 05.");
  notes(s,
`The architecture in one line: an authoritative workforce source, a boundary transformation, a governed workforce identity model, a provisioning service, and the target services. The governed model in the middle is the stable center. Everything to its left is source-specific; everything to its right is delivery. In the Microsoft realization, Core HCM feeds integration middleware, which posts to Microsoft Graph's bulkUpload endpoint, and the Entra provisioning service writes to Entra ID or Active Directory. That realization is replaceable; the logical architecture isn't.

The authority boundaries are stated once in Chapter 01. The human capital system is authoritative for the employment and assignment facts it creates. The identity platform is authoritative for credentials, authentication methods, sessions, directory objects and enforcement. The credentialing system stays authoritative for PIV issuance and revocation, endpoint management and PKI for devices and device certificates, and application owners for application-specific accounts. No system becomes authoritative because it receives a copy, and no source field should drive access until the agency has approved its owner, meaning, values, quality expectations, correction path and permitted use.

The book calls this an enterprise data architecture problem before an identity-product problem, and the left table is its contribution: authority, identifiers, standards, lineage and evidence. The principles on the right run through every module. One caution from the book: no OPM document mandates or specifies Entra ID integration. The Entra, Graph and Lifecycle Workflows material comes from Microsoft's guidance and the agency's own decisions, so don't cite it as OPM guidance.`,
  "Book 03, Chapter 01 — Overview and Applicability, \"The architecture in one paragraph,\" \"Authority boundaries\" and \"Architectural principles\"; Chapter 05, \"Logical architecture and Microsoft realization.\"");
}
endModule("Orientation");

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: Attribute authority and the canonical schema", "Part 1 — The data and the pipe  ·  Chapters 04 and 06",
    ["One master per attribute, and effective dating", "Layered identifiers and the enterprise key decision", "OPM standards, the crosswalk and the attribute map"], 12);
  notes(s,
`Module 1: attribute authority and the canonical schema. Before anything is automated, the agency writes down which system owns each fact, which key identifies a person across every source and account, and which attribute carries each value in each directory.

This is the part estates skip because it produces no visible change for end users. It's also the part that decides whether automation propagates truth or propagates errors faster than any ticket queue could. Chapters 04 and 06 carry the detail.`,
  "Book 03, Chapter 04 — Attribute Authority; Chapter 06 — The Canonical Workforce Identity Model.");
}

// ================================================================== 5 Authority map
{
  const s = content(P1, "One master per attribute: the authority map");
  tag(s, "What");
  const b = table(s, "Split", 1.5, [3.25, 1.75, 2.35], ["Function", "Core HCM", "Entra ID"], [
    ["Who a worker is: existence, status, type", { text: "Authoritative", options: { bold: true, color: HEX.amber } }, "Derived: account state follows"],
    ["Where a worker sits: position, org, supervisor", { text: "Authoritative", options: { bold: true, color: HEX.amber } }, "Derived: stamped, computed"],
    ["How identity is proven: credentials, MFA", "—", { text: "Authoritative", options: { bold: true, color: HEX.navy } }],
    ["Whether a request is permitted now", "—", { text: "Authoritative", options: { bold: true, color: HEX.navy } }],
    ["Token issuance and claims format", "—", "Authoritative; values trace upstream"],
  ], { fontSize: 12 });
  panel(s, "Rules", 8.15, 1.5, 4.6, 3.5, HEX.navy, HEX.navyTint, "OPERATING RULES", "One master, one writer", [
    "Authoritative in exactly one system",
    "Writeback, if any, carries only platform values (username, work email, phone)",
    "An IT write to an HR-fed attribute is drift",
    "Every event leaves a provenance record",
  ], 12.5);
  txt(s, "Effective", [
    { text: "Effective dating: ", options: { bold: true, color: HEX.amber } },
    { text: "Core HCM records state transitions with dates, including future-dated hires and separations, which is what makes day-one readiness and same-day revocation possible." },
  ], { x: 0.6, y: b + 0.1, w: 7.35, h: 5.05 - b - 0.1, fontSize: 12.5, valign: "middle" });
  callout(s, "Upstream", 5.2, 1.25, "FaArrowsRotate", HEX.red, "Corrections flow upstream: ",
    "a wrong department in a token is fixed in the HR record or the mapping rule, never by hand-editing the directory copy.");
  sources(s, "Sources: Oracle — date effectivity; jobs and positions; Employee ATOM feeds. Microsoft Learn — transfer user SOA to Entra ID. Book 03, Ch 04.");
  notes(s,
`Naming the HCM as the source of authority invites a misreading: that it competes with the identity platform. It doesn't, because each is authoritative for a different category of fact. The human capital system creates four record families that can't originate anywhere else: the worker record, the position, the assignment and the supervisory hierarchy. Hiring is a business act, positions exist independent of any incumbent, and the assignment is the employment relationship itself. Entra ID is authoritative for how identity is proven and whether a request is permitted now, and for token format, though claim values trace upstream.

A vocabulary point that matters in design reviews. The book uses source of authority for the system that owns a person's facts. Microsoft uses Source of Authority, SOA, for which directory masters a user or group object. The book calls that object SOA. HR can be the source of authority for a person while the account's object SOA is in AD or in Entra ID.

Effective dating is the property that separates a system of record from a directory. Oracle defines date-effective objects with effective start and end dates, one current record, and future changes entered ahead of time. A directory records state; the HCM records state transitions with timestamps, which is exactly what an event-driven lifecycle consumes.`,
  "Book 03, Chapter 04 — Attribute Authority, \"What a human capital system actually owns,\" \"System of record versus identity provider,\" \"Effective dating\" and \"Operating rules.\"");
}

// ================================================================== 6 Identifiers
{
  const s = content(P1, "One person, layered identifiers, one key decision");
  tag(s, "What");
  const b = table(s, "Keys", 1.5, [3.5, 2.75, 2.6, 3.3], ["Key", "Identifies", "Assigned by", "Changes when"], [
    [{ text: "Enterprise person key", options: { color: HEX.amber } }, "The person, across every affiliation", "The agency's identifier decision", { text: "Never, once assigned", options: { bold: true } }],
    ["Source person key (Oracle PersonNumber)", "The person in one HR source", "The HR system", "The source system changes"],
    ["Affiliation or assignment key", "One employment, contract or appointment", "The HR system", "A new affiliation begins"],
    ["Directory object ID", "One account in one directory", "The directory", "The account is recreated"],
    ["Credential IDs: FASC-N, card UUID, SKI", "One authenticator", "The CMS or CA", "The credential is reissued"],
  ], { fontSize: 12 });
  facts(s, "Decide", b + 0.15, 6.5 - b - 0.15, [
    ["The decision, before Phase 1 closes", HEX.amber, HEX.amberTint, "Which key is the enterprise person key: one the agency controls, so the Core HCM cutover changes only the source key"],
    ["Fit the carrier", HEX.navy, HEX.navyTint, "employeeId holds at most 16 characters. The optional PIV cardholder UUID maps to the key; it can't be the key"],
    ["What it buys", HEX.teal, HEX.tealTint, "Rehire re-links the same person; conversion keeps the key; audit joins across SIEM and badge; the SSN never joins"],
  ], 12);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 IA-4, IA-4(4); FIPS 201-3; Microsoft Graph — user resource (employeeId); Oracle — Change Worker Type (26B). Book 03, Ch 04.");
  notes(s,
`IA-4 requires managing identifiers: receiving authorization to assign them, assigning them to the intended entity, and preventing their reuse for a defined period. The book's discipline is stricter and simpler: one governed person record, explicit affiliation records, and stable correlation keys appropriate to each lifecycle. That takes several keys, because each layer has its own lifecycle. The source person key, Oracle's PersonNumber today, changes if the source changes. The directory object ID changes when an account is recreated. Credential identifiers change on reissue; FIPS 201-3 generates a new FASC-N and card UUID when a card is reissued.

The identifier decision is made before Phase 1 closes. The book's implementation projects the source person number into employeeId as the source correlation key. That works while there's one source that never reassigns numbers. Once the source changes, and Core HCM cutover is the obvious case, or contractors come from a separate source, the enterprise person key has to be one the agency controls, with source keys mapped to it. Many agencies already have a long-standing enterprise identifier that can serve: confirm it, carry it in employeeId in both directories, and map PersonNumber and every directory and credential key to it. It has to fit its carrier: Entra ID's employeeId holds at most sixteen characters.

Worker type hangs off the same record. Core HCM's Change Worker Type process converts a contingent worker to an employee in one transaction, so conversion is a re-derivation on the same identifier rather than a second identity, and IA-4(4)'s status characterization comes from the system that classifies workers. The SSN is not a join key; the layered identifiers exist so that it never has to be.`,
  "Book 03, Chapter 04, \"One person, layered identifiers\" and \"The worker-type boundary.\"");
}

// ================================================================== 7 OPM standards
{
  const s = content(P1, "OPM standards are the contract, not vendor fields");
  tag(s, "What");
  const b = table(s, "Std", 1.5, [3.3, 4.85, 4.0], ["OPM standard data element", "Identity use", "Lands as"], [
    ["Agency / subelement", "Legal employer and component scope", "companyName; organization code"],
    ["Personnel office identifier", "Servicing HR office; delegated administration scope", "Administrative-unit rule input"],
    ["Duty station", "Location of record, scoping, physical access", "Location code; usageLocation source"],
    ["Series, pay plan, grade", "Position category for role-eligible access packages", "Position category code"],
    ["Supervisory status", "Approver and reviewer eligibility; manager-chain integrity", "Supervisor group; manager checks"],
    ["Tenure, appointment, work schedule", "Worker type and its lifecycle profile", "employeeType; worker-type code"],
    ["Nature of action + effective date", "Lifecycle trigger: joiner to leaver, correction", "Hire and leave dates; account state"],
  ], { fontSize: 12 });
  callout(s, "Codes", b + 0.15, 6.5 - b - 0.15, "FaBook", HEX.navy, "Why standards hold: ",
    "OPM requires the SF-50's coded blocks to use only codes in the EHRI Data Standards. The standard stops at federal employees; contractors need their own source.");
  sources(s, "Sources: OPM — Data Policy & Guidance; EHRI Data Standards; Guide to Processing Personnel Actions (Oct. 2026). Book 03, Ch 06.");
  notes(s,
`The schema names Oracle fields because Oracle Fusion Cloud HCM is the Core HCM platform. The durable contract is one level up: OPM's standard personnel data. Every agency on the platform records the same data elements with the same codes and meanings, defined by OPM's data standards, which were the Guide to Data Standards and now live in OPM's online metadata repository. Every personnel action carries a nature-of-action code from the same standards.

Mapping identity to the standard rather than to vendor fields means one crosswalk serves every employee population, survives the next vendor change, and can be reused by any agency on the platform. OPM requires that the coded blocks of the SF-50 use only codes listed in the EHRI Data Standards, which is what makes them dependable as access inputs. Where an access decision needs a code a standard element supplies, the code is the standard's, not a locally invented list.

Confirm each element's current name, values and how Core HCM exposes it at engagement time; it's on the verification register. And the limit: the standard describes federal employees. Contractors and vendors are in neither the standard nor Federal HR 2.0, and they're the subject of Module 4's last content slide.`,
  "Book 03, Chapter 06 — The Canonical Workforce Identity Model, \"The standard-attribute layer.\"");
}

// ================================================================== 8 Crosswalk
{
  const s = content(P1, "The crosswalk: native attributes first, three coded slots");
  tag(s, "What");
  const g = { options: { color: HEX.teal, bold: true } };
  const r = { options: { color: HEX.red, bold: true } };
  const b = table(s, "Crosswalk", 1.5, [1.95, 2.35, 2.25, 1.9, 2.45, 1.25], ["Canonical field", "Oracle HCM source", "SCIM attribute", "On-prem AD", "Entra ID", "Rule reads"], [
    ["Person number", "workers.PersonNumber", "externalId", "employeeID", "employeeId", Object.assign({ text: "Yes" }, g)],
    ["Employment active", "Assignment status", "active", "accountDisabled", "accountEnabled", Object.assign({ text: "Yes" }, g)],
    ["Manager", "Manager's number", "enterprise manager", "manager (DN)", "manager", "Direct reports"],
    ["Worker type", "Worker type", "ext. workerType", "employeeType", "employeeType", Object.assign({ text: "No" }, r)],
    ["Hire / leave date", "Start / termination", "ext. HireDate, TermDate", "extAttr 2 / 3", "employeeHireDate / LeaveDateTime", "Hire: preview"],
    [{ text: "Organization code", options: { color: HEX.amber } }, "Department ID", "ext. orgCode", "extAttr10", "extensionAttribute10", Object.assign({ text: "Yes" }, g)],
    [{ text: "Worker type code", options: { color: HEX.amber } }, "Worker type code", "ext. workerTypeCode", "extAttr11", "extensionAttribute11", Object.assign({ text: "Yes" }, g)],
    [{ text: "Position category", options: { color: HEX.amber } }, "Job family code", "ext. positionCategory", "extAttr12", "extensionAttribute12", Object.assign({ text: "Yes" }, g)],
  ], { fontSize: 11.5 });
  txt(s, "Rules", [
    { text: "Why three slots: ", options: { bold: true, color: HEX.navy } },
    { text: "rules can't read employeeType, employeeOrgData or manager, or multi-value extensions. Same carrier in both landing zones; codes, never display strings; no hierarchy encoded. Slots 10–12 are design guidance: confirm free per tenant." },
  ], { x: 0.6, y: b + 0.1, w: 12.15, h: 6.5 - b - 0.1, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — dynamic membership rules; onPremisesExtensionAttributes; Oracle HCM provisioning tutorial; custom attributes; LCW attribute sync. Book 03, Ch 06.");
  notes(s,
`Chapter 06 gives one schema the whole site uses, and the design rules behind it. First, use a native Entra attribute wherever one exists: employeeId, department, jobTitle, companyName, manager, employeeType, employeeHireDate, employeeLeaveDateTime and employeeOrgData already mean what the HR record means, and the org chart, Lifecycle Workflows and access-package approvals read them directly.

Second, add an extension attribute only where access needs a value a rule can't read. Dynamic membership rules support a fixed list of user properties, including department, companyName, jobTitle, employeeId, employeeHireDate in preview, userType, accountEnabled, and extensionAttribute1 to 15. They don't include employeeType, employeeOrgData or manager; direct-reports groups use a separate rule form. So three coded attributes cover the access-targeting gap: organization code, worker type code and position category, in slots 10, 11 and 12. Rules can't use multi-value extension properties, so each holds one code.

Third, put codes in access attributes, never display strings. Fourth, use the same carrier in both landing zones: extensionAttribute1 to 15 exist in on-premises AD and in Entra ID. For synced users AD is the source and the Entra values are read-only; for cloud-only users they can be set directly. A rule on extensionAttribute10 works the same for a hybrid user and a cloud-mastered one through years of coexistence.

The dates need care. Neither has a native AD attribute, so Microsoft's Oracle HCM worksheet writes HireDate and TermDate to extensionAttribute2 and 3, and a sync rule maps each to employeeHireDate or employeeLeaveDateTime, as a string converted to the format Entra expects. The choice of slots 10 to 12 is the workbook's proposed implementation, not a Microsoft default: confirm each is in the provisioning app's target list and unused before Phase 1 closes.`,
  "Book 03, Chapter 06, \"Design rules\" and \"The schema.\"");
}

// ================================================================== 9 Attribute map
{
  const s = content(P1, "The program attribute map, and one writer per slot");
  tag(s, "What");
  const b = table(s, "Slots", 1.5, [1.25, 3.05, 3.3], ["Slot", "Meaning", "Writer"], [
    ["1", "Job code (JobCode)", "Core HCM via inbound provisioning"],
    ["2 / 3", "Hire / leave date, AD-side carrier", "Core HCM HireDate / TermDate"],
    ["4", "Region code", "Core HCM duty station, via crosswalk"],
    ["5 / 6", "Cost center / division code mirrors", "Core HCM; rules can't read employeeOrgData"],
    ["7", "Account type: Standard, Service, Privileged", "Identity team"],
    ["9", "Clearance level", "Personnel security system"],
    ["10–12", "Org code, worker type code, position category", "Core HCM"],
    ["15", "DoNotSync, read by a sync scoping filter", "Identity operations, in AD"],
  ], { fontSize: 12 });
  panel(s, "Writers", 8.4, 1.5, 4.35, 4.95, HEX.red, HEX.redTint, "WRITERS (DESIGN GUIDANCE)", "Whoever writes it decides access", [
    "The provisioning service is the only writer of every HR field",
    "Slots 7, 9 and 15 have the writers the map names; still one per slot",
    "Remove help desk, self-service and Exchange custom-attribute write paths",
    "Review AD ACLs on target OUs",
    "Any other principal's write is drift",
  ], 12.5);
  txt(s, "Device", [
    { text: "Device objects have their own fifteen slots, ", options: { bold: true, color: HEX.navy } },
    { text: "mastered in Entra ID and set through Graph, so they never collide with user slots (region, tier, device role, environment)." },
  ], { x: 0.6, y: b + 0.1, w: 7.6, h: 6.5 - b - 0.1, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — Oracle HCM provisioning tutorial (worksheet slots 1–3); dynamic membership rules (write permissions); onPremisesExtensionAttributes. Book 03, Ch 06.");
  notes(s,
`The other books need more slots than the three access codes: region, cost center and division for groups and administrative units, account type and clearance for personas and restricted access packages, and a flag that keeps an object out of sync. Chapter 06's program attribute map is the one assignment of extensionAttribute1 to 15 on user objects for the whole site; every page that names a slot uses these meanings or links to them.

Slots 1 to 3 follow Microsoft's Oracle HCM worksheet: a job code, and the AD-side carriers for the hire and leave dates. The rest are the workbook's proposed choices, to confirm before Phase 1 closes. Slots 5 and 6 exist because employeeOrgData holds cost center and division but rules can't read it, so license-assignment groups, administrative-unit rules and the mover trigger use flat code mirrors, not a path. Slot 7, account type, is written by the identity team; during the transition a sync rule derives it from OU placement. Slot 9 comes from the personnel security system.

The panel is the point. A dynamic membership rule moves the access decision to whoever can write the attribute it reads. Microsoft's guidance is to check write permissions for every attribute a rule uses, in Entra ID and any source directory, and to restrict self-service write access to attributes used in security-sensitive groups. So the only writer of every schema field is the provisioning service: the API-driven app for cloud-mastered users, the agent plus Entra Connect for AD-mastered ones. Remove help desk, self-service and Exchange-admin write paths, review the ACLs on the target OUs, and treat any other write as a drift event.`,
  "Book 03, Chapter 06, \"Program attribute map\" and \"Writers.\"");
}
endModule("Module 1");

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: The provisioning pipeline", "Part 1 — The data and the pipe  ·  Chapters 03 and 05",
    ["Federal HR 2.0: the window, and what its SCIM requirement covers", "The middleware's five duties and the /bulkUpload contract", "Two landing zones across the Entra ID migration"], 12);
  notes(s,
`Module 2: the provisioning pipeline. Module 1 decided what the data is and who owns it. This module is how it moves: from the Core HCM platform, through middleware inside the agency's boundary, into Entra ID's API-driven inbound provisioning, and from there into Active Directory, Entra ID, or both.

It starts with Federal HR 2.0, because the program fixes the HR side on its own schedule and that schedule decides when the identity feed has to be ready. Chapters 03 and 05 carry the detail.`,
  "Book 03, Chapter 03 — Federal HR 2.0 and the Core HCM Platform; Chapter 05 — Provisioning Services.");
}

// ================================================================== 11 HR 2.0
{
  const s = content(P1, "Federal HR 2.0: the window and what SCIM covers");
  tag(s, "Why");
  const b = table(s, "HR20", 1.5, [2.75, 9.4], ["Program fact (as of Oct. 20, 2026)", "Value"], [
    ["Directing instrument", "OMB/OPM memo, Dec. 10, 2025: one Core HCM platform; agencies pause their own Core HCM procurement and modernization"],
    ["Platform", "Oracle Fusion Cloud HCM (SaaS), awarded June 10, 2026; FedRAMP Authorized, Moderate"],
    ["Waves", "Wave 1 volunteers (~900K FTE); Wave 2 all others (~1.1M FTE) in FY 2027; adoption goal FY 2028"],
    ["Onboarding shape", "~8 months; interconnection go-live ≈ month 5 (a planning assumption: confirm with the program office)"],
    ["Standing systems", "eOPF and EHRI eventually made redundant: don't build against their feed shapes"],
    ["Procurement SCIM requirement", "SCIM 2.0 provisioning from the Government's identity provider into the platform, near real time"],
  ], { fontSize: 12 });
  callout(s, "Reverse", b + 0.15, 6.5 - b - 0.15, "FaRightLeft", HEX.amber, "The reverse direction is the agency's: ",
    "HR events driving Entra ID aren't in the solicitation. Microsoft documents them for Oracle HCM through API-driven inbound provisioning. Design the feed in before month 5.");
  sources(s, "Sources: OMB/OPM Federal HR 2.0 memo; OPM award notice; FedRAMP Marketplace data; Solicitation 24322626R0007 Amdt 4, PWS App. A Req. 5. Book 03, Ch 03–04.");
  notes(s,
`Federal HR 2.0 is not the project; it's the opening. The joint OMB and OPM memo of December 10, 2025 moves the government's more than 100 Core HCM systems onto one platform, and says the single system will eventually make eOPF and EHRI redundant and allow their decommissioning. OPM awarded the Core HCM contract on June 10, 2026 for Oracle Fusion Cloud HCM, delivered as SaaS under Oracle's FedRAMP Moderate authorization.

The wave clock: Wave 1 is the agencies that volunteered, about 900,000 FTE; Wave 2 is everyone else, about 1.1 million FTE, transitioning in FY 2027. First agencies were expected to begin onboarding as FY 2027 began, with initial go-lives reported for January to March 2027. The memo's sample timeline runs about eight months, with interconnection go-live and production setup around month five and cutover at month eight.

Now the precise point about SCIM. The solicitation's Functional Requirements Matrix, requirement 5, asks for SCIM 2.0 automated user provisioning from the Government's identity provider into the contractor's system, in near real time or within an SLA such as 15 minutes. That points into the platform: provisioning the HR system's own users. Nothing in it makes the platform the source for the agency's directory. The reverse direction, HR events driving Entra ID, is an agency decision. Microsoft documents it for Oracle Fusion Cloud HCM through API-driven inbound provisioning, which accepts SCIM-formatted payloads built from HCM Extracts or Atom feeds.

The window closes at the interconnection. A feed designed into onboarding costs a fraction of one retrofitted after it, and the durable interface is the platform's own: extracts, Atom feeds, REST and SCIM, carrying OPM's standard elements.`,
  "Book 03, Chapter 03 — Federal HR 2.0 and the Core HCM Platform, \"The program facts,\" \"Why this is the opportunity\" and \"What OPM requires\"; Chapter 04 (FedRAMP listing).");
}

// ================================================================== 12 Architecture realized
{
  const s = content(P1, "Logical architecture, replaceable Microsoft realization");
  tag(s, "What");
  img(s, "ch05-provisioning-services", "Provisioning services: Core HCM extracts, ATOM feeds, REST and SCIM feed a replaceable boundary transformation, then a middleware with five duties per event: validate and fail closed, sequence, normalize to SCIM, write provenance, reconcile results. The middleware posts to Graph bulkUpload and the Entra provisioning service, which writes hybrid users to Active Directory through the provisioning agent and cloud-managed users to Entra ID. A dashed line goes from the middleware to an evidence store of provenance and provisioning logs.",
    0.6, 1.5, 7.1, 2.45);
  panel(s, "Call", 0.6, 4.1, 7.1, 2.35, HEX.navy, HEX.navyTint, "HOW THE CALL BEHAVES", null, [
    "The client posts a SCIM bulk request; the service decides create, update, enable or disable",
    "202 Accepted, processed asynchronously: read the provisioning logs per record",
    "Transient failures: bounded, idempotent retry. Permanent: an owned exception",
  ], 12.5);
  panel(s, "Why", 7.95, 1.5, 4.8, 4.95, HEX.teal, HEX.tealTint, "WHY API-DRIVEN INBOUND", null, [
    "Oracle Fusion Cloud HCM has no native Entra connector; prebuilt ones are Workday and SuccessFactors",
    "Microsoft's own Oracle HCM guidance is this pattern: CSV extracts, then ATOM feeds or extract deltas",
    "One entry point, one provenance stream for lineage and drift",
    "A future native connector is an optimization inside this design",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — API-driven inbound provisioning concepts; plan cloud HR provisioning; Oracle HCM provisioning tutorial. Book 03, Ch 05.");
  notes(s,
`The diagram is the Microsoft realization of the logical architecture: Core HCM, a boundary transformation, middleware in Azure Functions or Logic Apps, Microsoft Graph's bulkUpload endpoint, and the Entra provisioning service landing users in Active Directory or Entra ID, with provenance going to an evidence store.

The division of labor is easy to get wrong. The API client reads identity data from the source and posts it to the provisioning app's bulkUpload endpoint as a SCIM bulk request. It doesn't compare source and target to decide whether to create, update, enable or disable; the provisioning service does that, applies the attribute mappings the administrator configured, and writes the user to AD for hybrid users or to Entra ID for cloud-only users. The endpoint returns 202 Accepted and processes asynchronously, so the client reads the provisioning logs API for each record's result. Transient failures get bounded, idempotent retry; permanent failures become reconciled exceptions with an owner and an alternate completion path.

Why this pattern rather than a connector. Entra's prebuilt HR connectors are for Workday and SAP SuccessFactors; Oracle Fusion Cloud HCM has none, and Microsoft's own Oracle HCM integration guidance is the API-driven pattern: CSV extracts for the initial load, ATOM feeds or HCM Extracts for deltas, or Oracle Integration Cloud where the agency subscribes, and optional writeback through Oracle's SCIM APIs. One entry point gives one provenance stream, which is what makes lineage and drift detection tractable. And if Microsoft ships a native Oracle connector later, it becomes an optimization inside this architecture, not a replacement.`,
  "Book 03, Chapter 05 — Provisioning Services, \"Logical architecture and Microsoft realization,\" \"Why API-driven inbound provisioning\" and \"Native connectors.\"");
}

// ================================================================== 13 Source and duties
{
  const s = content(P1, "Oracle source surfaces and five duties per event");
  tag(s, "How");
  const b = table(s, "Surfaces", 1.5, [1.75, 5.0, 5.4], ["Sync", "Mechanism", "Notes"], [
    ["Initial / full", "HCM Extracts (or BI Publisher) to CSV", "Full worker population, scoped by Phase 1's filter rules"],
    ["Delta", "ATOM feeds: newhire, empassignment, empupdate, termination, cancelworkrelship, workrelshipupdate", "Turn on immediately after the initial sync; a gap loses changes"],
    ["Delta (alternative)", "Periodic HCM Extract deltas", "Simpler; latency equals the extract cadence"],
    ["Enrichment", "workers REST resource", "Oracle marks emps for future deprecation; use workers"],
  ], { fontSize: 12 });
  flow(s, "Duties", b + 0.2, 6.45 - b - 0.2, [
    { head: "1 Validate", body: "Required attributes present; unknown worker types refused. Fail closed" },
    { head: "2 Sequence", body: "Apply in order; an out-of-order mover/leaver pair is a bug; retry, never skip" },
    { head: "3 Normalize", body: "SCIM BulkRequest: core, enterprise and extension schemas; the full record every time" },
    { head: "4 Provenance", body: "Event ID, payload hash, inputs, outcome, written before the call returns" },
    { head: "5 Reconcile", body: "Match logs to events; exceptions stay open until the directory matches" },
  ], 11.5);
  sources(s, "Sources: Oracle — HCM Extracts; Employee ATOM feeds; Employees and Workers REST endpoints. Microsoft Learn — inbound provisioning concepts; RFC 7643/7644. Book 03, Ch 05.");
  notes(s,
`The source side first. The initial full load comes from HCM Extracts, or BI Publisher, to CSV, scoped by the filter rules set in Phase 1. Deltas come from Oracle's ATOM feeds: newhire, empassignment, empupdate, termination, cancelworkrelship and workrelshipupdate. Turn them on immediately after the initial sync, because a gap loses changes. When a feed event doesn't carry an attribute the payload needs, enrich from the workers REST resource. Microsoft's guide also names the employees resource, but Oracle marks it for future deprecation and advises workers for new integrations.

The source correlation key is PersonNumber to employeeId in Entra ID and AD, subject to the enterprise identifier decision. Populate employeeId on existing accounts before the first full sync: matching is what prevents duplicate identities at go-live.

Then the middleware, inside the agency's authorization boundary, with five duties for every event. Validate: required attributes present, unknown worker types refused, fail closed. Sequence and retry: apply feed events in order, because an out-of-order mover and leaver pair is a correctness bug and a dropped event is silent drift; a failed transform retries and is recorded, never skipped. Write provenance: one record per event, with source event ID, payload hash, derivation inputs and outcome, to the evidence store before the Graph call returns. Reconcile: read the provisioning logs, match each result to its source event, and keep exceptions open until the directory reflects the source, with a scheduled population comparison as backstop.

Two rules. The middleware never writes HR-mastered facts back to HR. And send the complete user record every time, for full and delta syncs: if clearing attribute values, a preview feature, is enabled, an omitted or null mapped attribute can clear the target value.`,
  "Book 03, Chapter 05, \"The source: Oracle Fusion Cloud HCM\" and \"The middleware: five duties per event.\"");
}

// ================================================================== 14 bulkUpload
{
  const s = content(P1, "The /bulkUpload contract: limits, rights and licenses");
  tag(s, "How");
  const b = table(s, "Envelope", 1.5, [2.55, 9.6], ["Property", "Value"], [
    ["Endpoint", "Microsoft Graph worldwide endpoint, graph.microsoft.com (Microsoft 365 GCC tenants use the worldwide endpoints)"],
    ["Payload", "SCIM bulk request; up to 50 operations per call"],
    ["Throttling", "40 calls in any 5-second window (concepts page) vs 40 requests per second (Graph reference): pace to the stricter, handle 429"],
    ["Tenant daily cap", "2,000 calls per 24 hours with Entra ID P1 or P2; 6,000 with Entra ID Governance (300,000 records a day at 50 a call)"],
    ["Client permissions", "SynchronizationData-User.Upload, or least-privileged ...Upload.OwnedBy; ProvisioningLog.Read.All for the reader"],
    ["Licensing floor", "Entra ID P1; Entra ID Governance for Lifecycle Workflows"],
  ], { fontSize: 12 });
  facts(s, "Rules", b + 0.15, 6.5 - b - 0.15, [
    ["One app per source", HEX.navy, HEX.navyTint, "HR, a contractor system and a badging system each get their own provisioning app and endpoint"],
    ["No client secrets", HEX.teal, HEX.tealTint, "Managed identity or a certificate (design guidance); Microsoft recommends them for production"],
    ["A pause switch", HEX.red, HEX.redTint, "An operator role pauses the job; the upload client can't. Hold any abnormally large delta"],
  ], 12);
  sources(s, "Sources: Microsoft Learn — inbound provisioning concepts, FAQs, grant access; Graph bulkUpload; national cloud deployments; accidental deletions. Book 03, Ch 05; App B; Ch 12.");
  notes(s,
`The bulkUpload envelope, as the chapter documents it. The endpoint is Microsoft Graph's worldwide endpoint; Microsoft's national-cloud page says Microsoft 365 GCC tenants continue using the worldwide endpoints. The payload is a SCIM bulk request of up to 50 operations per call.

Throttling is where two Microsoft pages disagree. The Entra concepts page says 40 calls in any five-second window, with HTTP 429 beyond it; the Graph API reference says 40 requests per second. Pace the client to the stricter figure and handle 429s. The tenant cap is 2,000 calls per 24 hours with Entra ID P1 or P2, and 6,000 with Entra ID Governance; at 50 operations a call that's 300,000 records a day, which Phase 2 sizes against the population and the reorganization cases.

Permissions: Microsoft's standard setup grants SynchronizationData-User.Upload. The least-privileged option, SynchronizationData-User.Upload.OwnedBy, limits uploads to provisioning apps the client's identity owns. The component that reads per-record results needs ProvisioningLog.Read.All. The licensing floor is Entra ID P1, with Entra ID Governance for Lifecycle Workflows.

Appendix B adds the service-identity rules, which are program design. No client secrets: a managed identity where the middleware runs on Azure resources, or a certificate on its service principal; Microsoft's walkthrough uses a secret but recommends certificates or managed identities for production. Keep a documented pause: pausing a job through Graph takes a permission the upload client doesn't hold, so it belongs to an operator role. Accidental deletions prevention quarantines the job when disables and deletions exceed a threshold; the middleware's own large-delta check covers mass re-scoping, which that threshold doesn't count.`,
  "Book 03, Chapter 05, \"The /bulkUpload contract\"; Appendix B — Security and Privacy Assessment, \"Service identity and privilege\" and \"A pause switch\"; Chapter 12, Phase 2.");
}

// ================================================================== 15 Landing zones
{
  const s = content(P1, "Two landing zones across the Entra ID migration");
  tag(s, "How");
  img(s, "ch05-two-patterns", "Two landing patterns. Top, while AD holds the object SOA: HR lands users in Active Directory through the provisioning agent and they sync to Entra ID. Bottom, after the object SOA moves to the cloud: HR lands users in Entra ID as cloud-managed users, and Active Directory accounts are provisioned from Entra ID only where applications still need them.",
    0.6, 1.5, 5.3, 2.75);
  panel(s, "Agents", 0.6, 4.4, 5.3, 2.05, HEX.amber, HEX.amberTint, "LANDING IN AD", null, [
    "OU computed by expression on parentDistinguishedName",
    "Two agents minimum; Cloud Sync now recommends three, hardened as Tier 0",
    "gMSA, rights delegated to target OUs only",
  ], 12);
  const b = table(s, "Absorb", 1.5, [1.85, 2.4, 2.4], ["Dimension", "Active Directory", "Entra ID"], [
    ["Structure", "OU tree: structure as place, read by GPO", "Attributes, read by policy through groups"],
    ["Reporting line", "manager DN reference", "manager relationship"],
    ["Org placement", "OU computed at provisioning", "department, employeeOrgData, stamped"],
    ["Membership", "Static groups, manual or scripted", "Dynamic membership rules"],
    ["Delegation", "OU ACL delegation", "Administrative units (flat)"],
    ["Reorganization", "OU restructure and GPO re-link: a project", "Re-stamp and re-evaluate: a data change"],
  ], { x: 6.1, fontSize: 12 });
  txt(s, "SOA", [
    { text: "Converge per population: ", options: { bold: true, color: HEX.teal } },
    { text: "HR is the source for the person, Entra ID holds the object SOA, and AD becomes a shrinking downstream target." },
  ], { x: 6.1, y: b + 0.12, w: 6.65, h: 6.45 - b - 0.12, fontSize: 13, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — plan cloud HR provisioning; Cloud Sync prerequisites; transfer user SOA; transition to the cloud; administrative units; Org Explorer. Book 03, Ch 05.");
  notes(s,
`The same HR feed can land in two places, separately or at once, and which one a population uses changes as the agency moves off Active Directory. API-driven inbound provisioning to Entra ID creates cloud-only users directly. API-driven inbound provisioning to AD delivers the same payloads through the Microsoft Entra provisioning agent, which writes to AD DS from inside the network; Connect Sync or Cloud Sync then projects the user to the cloud.

Landing in AD. The OU is computed, not hand-picked: an expression mapping on parentDistinguishedName derives the domain and OU from HR attributes. The reporting line becomes a DN reference to the already-provisioned supervisor. Deploy at least two agents with line of sight to the domain controllers; Microsoft's Cloud Sync prerequisites now recommend three active agents, on servers hardened as Tier 0. The agent runs as a group managed service account; And SCIM active maps to accountDisabled, so an HR termination disables the AD account and sync carries it to the cloud. The caveat: AD stores structure as place, so HR-driven provisioning keeps AD correct but can't make it attribute-native.

Landing in Entra ID, there are no OUs. Structure becomes data: manager, which drives the org chart in Teams and Outlook and approval routing, department, jobTitle, employeeId, employeeType, the hire and leave dates and employeeOrgData.

Over the migration, Microsoft's path moves users' object SOA from AD to Entra ID, governs the lifecycle in the cloud, and provisions from Entra ID to AD for users who still need on-premises access. Its guidance makes the same split for HR. So both programs converge, population by population. During coexistence, provision both zones and retire OU-bound policy deliberately in Phase 5.`,
  "Book 03, Chapter 05, \"Two landing zones,\" \"Landing in Active Directory,\" \"Landing in Entra ID\" and \"Over the Entra ID migration.\"");
}
endModule("Module 2");

// ================================================================== 16 Module 3 divider
{
  const s = divider(P2, "Module 3: Lifecycle, credentials and access", "Part 2 — Lifecycle, access and evidence  ·  Chapters 08–10, Appendix A",
    ["Personnel actions as triggers; provisioning versus workflows", "PIV binding, revocation and the leaver sequence", "From attributes to access, and where rules stop"], 13);
  notes(s,
`Module 3: lifecycle, credentials and access. With the data trusted and the pipe built, the HR event becomes the cause: nobody requests an account for a new hire, because the hire causes it.

This module follows the event through three layers. The lifecycle: which personnel actions trigger what, and the division of labor between inbound provisioning and Lifecycle Workflows. The credentials: how a PIV card is bound to an Entra user and why disabling an account doesn't revoke a certificate. And access: how attributes become entitlements, and where dynamic membership has to stop.`,
  "Book 03, Chapter 08 — Joiner, Mover, Leaver; Chapter 09 — Credentials and Certificates; Chapter 10 — From Attributes to Access; Appendix A.");
}

// ================================================================== 17 NOA
{
  const s = content(P2, "Personnel actions are the triggers, by NOA family");
  tag(s, "How");
  table(s, "NOA", 1.5, [3.1, 2.35, 2.55], ["NOA family (GPPA chapters)", "Examples", "Identity event"], [
    ["Accessions — 1xx", "100, 101, 130, 170", "Joiner"],
    ["Conversions — 5xx", "500, 501, 570", "Conversion: same key"],
    ["Position changes — 7xx", "702, 713, 721", "Mover"],
    ["Other 7xx: name, realignment, duty station", "780, 790, 792", "Mover; UPN kept on a name change"],
    ["Nonpay or nonduty — 4xx", "430, 450, 460, 471", { text: "Not a leaver: restrict", options: { bold: true, color: HEX.amber } }],
    ["Return to duty — 2xx", "280, 292", "Reinstate"],
    ["Separations — 3xx", "300–304, 312, 317, 330, 350–357", { text: "Leaver: block first", options: { bold: true, color: HEX.red } }],
    ["Corrections and cancellations", "002, 001", "Re-derive, with evidence"],
  ], { fontSize: 12 });
  panel(s, "Precedence", 8.8, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "PRECEDENCE (APPENDIX A)", "One cycle, one person", [
    "Order by effective date",
    "A separation wins; pending mover and conversion dropped and logged",
    "Conversion applied before a mover is evaluated",
    "Nonpay restricts, never disables",
    "A cancelled separation re-enables from the corrected record",
  ], 12.5);
  sources(s, "Sources: OPM — Guide to Processing Personnel Actions (Oct. 2026 ed.); NIST SP 800-53 Rev. 5 PS-4, PS-5, IA-4. Proposed interpretation, not an OPM rule. Book 03, Ch 08; App A.");
  notes(s,
`Five state changes: joiner, mover, leaver, plus the two estates forget until they hurt, rehire and conversion. Each is recorded in HR as an effective-dated event, and each maps to a fixed set of identity actions.

For federal employees every event is a personnel action, and every personnel action carries a nature-of-action code. The first digit sets the family, 1 for appointments, 3 for separations, 5 for conversions, 7 for position and miscellaneous changes, and OPM's Guide to Processing Personnel Actions organizes its chapters around those codes. That gives a standard, government-wide trigger vocabulary. Every accession, conversion and separation, and every correction or cancellation, must be documented on an SF-50. A few actions don't need one; realignment is one, so a mover feed can't assume an SF-50.

The table is the book's proposed interpretation, not an OPM rule; HR, security, labor relations, privacy and personnel policy owners validate it before automation.

Three rules matter most. Leave is not a leaver: furlough, leave without pay and suspension keep the person; the account stays and policy restricts it. Precedence is a rule: when two actions land in one cycle, order by effective date, a separation wins, and a conversion is applied before a mover is evaluated. Cancellations are first-class: a cancelled separation re-enables what it disabled, from the corrected record, with evidence, but doesn't restore manually granted access without review.

Contractors have no SF-50 and no NOA codes. Their joiner and leaver events are contract or sponsorship start and end dates, and a sponsor's withdrawal is a leaver event.`,
  "Book 03, Chapter 08 — Joiner, Mover, Leaver, \"The lifecycle is an event stream\" and \"Personnel actions are the triggers\"; Appendix A — Lifecycle Rules.");
}

// ================================================================== 18 Provisioning vs LCW
{
  const s = content(P2, "Provisioning creates accounts; workflows act on them");
  tag(s, "How");
  panel(s, "Split", 0.6, 1.5, 5.3, 3.55, HEX.navy, HEX.navyTint, "WHO DOES WHAT", "Never blur the boundary", [
    "Inbound provisioning creates, updates and enables or disables from SCIM active",
    "bulkUpload never deletes; deletion is the workflow Delete user task",
    "Lifecycle Workflows act on users who already exist: scope plus trigger",
    "Provisioning from P1; workflows need ID Governance or Entra Suite",
  ], 12.5);
  const b = table(s, "Sched", 1.5, [2.15, 4.5], ["Trigger and schedule", "What Microsoft documents"], [
    ["Trigger types", "Time-based attribute, attribute change, group membership change, sign-in inactivity; or on demand"],
    ["Time-based offset", "employeeHireDate, employeeLeaveDateTime or createdDateTime, 0–180 days (relative: 365, preview)"],
    ["Schedule", "Every 3 hours by default; 1–24 hours, one tenant-wide setting; enabled per workflow"],
    ["Before running", "Each user re-evaluated; anyone no longer in scope is skipped"],
    ["Catch-up window", "Three days: a later-recorded separation needs the on-demand path"],
  ], { x: 6.1, fontSize: 12 });
  callout(s, "Gap", 5.2, 1.25, "FaTriangleExclamation", HEX.red, "No built-in task revokes a PIV credential or retires a device: ",
    "those steps go through a custom task extension. The schedule interval is part of the separation-to-block metric.");
  sources(s, "Sources: Microsoft Learn — LCW overview, built-in tasks, execution conditions, schedule, attribute sync; inbound provisioning FAQs; ID Governance licensing. Book 03, Ch 08.");
  notes(s,
`Two Microsoft services share the lifecycle, and the boundary between them is easy to blur. Inbound provisioning creates and updates accounts: it creates the user, keeps attributes current, and enables or disables the account from HR status. With API-driven inbound provisioning, SCIM active sets the account status by default, and the bulkUpload endpoint doesn't delete users; Microsoft points to the Lifecycle Workflows Delete user task. Lifecycle Workflows act on users who already exist. Microsoft describes them as automating the routine processes around HR-driven provisioning. A workflow is tasks plus execution conditions: a scope and a trigger.

Triggers and schedule are where the evidence numbers come from. Four scheduled trigger types plus on demand. The time-based trigger reads the hire date, leave date or creation date with an offset of zero to 180 days; a relative trigger in preview extends to 365. Scheduling is turned on per workflow; scheduled workflows run every three hours by default, settable from one to 24, and it's one tenant-wide setting. A workflow never runs earlier than its trigger time, but the schedule can delay it, so a leaver workflow runs at the first pass after the leave date. There's a three-day catch-up window: a separation recorded more than three days late has to go through the on-demand path.

Built-in tasks by stage. Joiner: welcome email, a Temporary Access Pass to the manager, access packages, licenses, groups and Teams, enable the account. Emergency termination uses the Real-time employee termination template as an on-demand workflow that runs the same sequence as the scheduled one, not a shorter one. And note the gap on the callout: no built-in task touches certificates, PIV or devices.`,
  "Book 03, Chapter 08, \"Who does what: provisioning and Lifecycle Workflows,\" \"Triggers and schedule,\" \"Built-in tasks by stage\" and \"Emergency termination.\"");
}

// ================================================================== 19 certificateUserIds
{
  const s = content(P2, "Binding the PIV card: certificateUserIds and its writer");
  tag(s, "How");
  const hi = { options: { bold: true, color: HEX.teal } };
  table(s, "Bind", 1.5, [2.75, 1.15], ["Binding", "Affinity"], [
    ["PrincipalName", "Low"], ["RFC822Name", "Low"], ["Subject", "Low"], ["IssuerAndSubject", "Low"],
    ["SKI", Object.assign({ text: "High" }, hi)], ["SHA1PublicKey", Object.assign({ text: "High" }, hi)], ["IssuerAndSerialNumber", Object.assign({ text: "High" }, hi)],
  ], { fontSize: 12, minRow: 0.36 });
  const b = table(s, "Writer", 1.5, [2.15, 3.55, 2.35], ["Where the user is mastered", "How the value is written", "Least role"], [
    ["Cloud-only", "Entra admin center or Microsoft Graph", "Privileged Authentication Admin"],
    ["Synced from AD", "Only Entra Connect: altSecurityIdentities in AD synced to certificateUserIds", "Hybrid Identity Admin"],
    ["After the object SOA moves (design guidance)", "The card management system's issuance event writes it through Graph", "The CMS integration only"],
  ], { x: 4.7, fontSize: 12 });
  txt(s, "Lifecycle", [
    { text: "A high-affinity value identifies one certificate: ", options: { bold: true, color: HEX.navy } },
    { text: "a reissue or renewal changes it, so the CMS rewrites the binding and removes the old value. Up to 10 values, each unique in the tenant." },
  ], { x: 4.7, y: b + 0.1, w: 8.05, h: 5.15 - b - 0.1, fontSize: 12.5, valign: "middle" });
  callout(s, "AD", 5.3, 1.2, "FaUserShield", HEX.red, "AD administrators can change certificateUserIds for any synced account: ",
    "whoever writes altSecurityIdentities decides which certificate signs in as whom. One writer; any other write is drift.");
  sources(s, "Sources: Microsoft Learn — CBA technical concepts; set up CBA; certificateUserIds mapping. FIPS 201-3; GSA FICAM ILM Playbook. Book 03, Ch 09; research: hybrid credentials.");
  notes(s,
`Certificates don't follow the account automatically. A PIV authentication certificate is issued through the agency's card management system by a CA under the Federal PKI Common Policy, and stays valid until it expires or is revoked. The FICAM Identity Lifecycle Management Playbook, best practice rather than policy, makes the point that without the binding between the card's certificate and the digital identity, a PIV card is just a badge.

Entra certificate-based authentication validates the presented certificate against the tenant's trusted CAs, checks the CRL, then maps a certificate field to a user attribute through username bindings. By default the SAN principal name maps to userPrincipalName. The stronger option is certificateUserIds, which holds explicit identifiers. High-affinity bindings, SKI, SHA1PublicKey and issuer plus serial number, use identifiers that can't be reused; username and email bindings are low affinity. If the tenant requires high affinity, low-affinity bindings drop out of evaluation.

Lifecycle consequence: a high-affinity value identifies one certificate. A reissue produces new keys, and FIPS 201-3 requires the old card revoked when the new one is issued; even a same-key renewal changes the serial and the thumbprint. So the binding is rewritten at the CMS's issuance event and the old value removed.

Who writes it depends on mastery. Cloud-only users: the admin center or Graph, by at least a Privileged Authentication Administrator. Synced users: only Entra Connect can update it, from altSecurityIdentities in AD, needing Hybrid Identity Administrator. After AD, Connect no longer carries it; the research explainer's design, labeled design guidance, is that the CMS issuance event writes the high-affinity value through Graph, because that event is where the new serial number first exists. Whether Cloud Sync can carry the value isn't settled in the sources. And Microsoft's warning: AD administrators, and anyone with rights over the Connect servers, can change certificateUserIds for any synced account.`,
  "Book 03, Chapter 09 — Credentials and Certificates, \"Joiner: proofing, issuance, binding\" and \"Binding the PIV certificate to the Entra user\"; research explainer, Certificates, Tokens and Keys Across the Hybrid Estate.");
}

// ================================================================== 20 Revocation
{
  const s = content(P2, "Revocation: CRLs, device certificates and reissue traps");
  tag(s, "How");
  panel(s, "CRL", 0.6, 1.5, 5.75, 3.6, HEX.navy, HEX.navyTint, "ENTRA CBA REVOCATION CHECKING", null, [
    "No CRL configured, no revocation check: turn on Require CRL validation",
    "CRLs are cached; delta CRLs carry updates; no OCSP",
    "Limits: 20 MB interactive, 65 MB service in Azure Global incl. GCC; 45 / 150 MB in Azure Government",
    "So revoke tokens for an immediate cut-off",
  ], 12.5);
  const sc = { options: { bold: true, color: HEX.red } };
  table(s, "SCEP", 1.5, [4.05, 2.15], ["Windows action", "Intune SCEP certificate"], [
    ["User unenrolls the device", "Revoked, removed"],
    ["Administrator runs wipe or retire", "Revoked, removed"],
    ["Device removed from an Entra group", "Revoked, removed"],
    ["Profile removed from the assignment", "Revoked, removed"],
    ["Intune license lost or withdrawn", Object.assign({ text: "Stays; not revoked" }, sc)],
    ["User or group removed from Entra ID", Object.assign({ text: "Stays; not revoked" }, sc)],
  ], { x: 6.55, fontSize: 12 });
  callout(s, "Order", 5.25, 1.2, "FaLaptop", HEX.amber, "Retire or wipe devices before deleting the user, ",
    "and remove SCEP assignments before revoking a Cloud PKI certificate by hand, or the device simply requests a new one.");
  sources(s, "Sources: Microsoft Learn — CBA CRL; set up CBA; remove SCEP and PKCS certificates; Cloud PKI overview and monitoring. FIPS 201-3; SP 800-157. Book 03, Ch 09.");
  notes(s,
`Revocation checking first. Entra ID checks the CRL of the issuing CA and the chain up to the root during CBA sign-in. Three properties decide how fast a PIV revocation takes effect. No CRL, no revocation: if a trusted CA has no CRL configured, revoked certificates still authenticate. Turn on Require CRL validation, and exempt a CA only while its CRL is being fixed. Caching: Entra caches the CRL, so a revocation isn't seen until the cache refreshes with a newer CRL; delta CRLs carry those updates, and Entra doesn't support OCSP. Microsoft advises revoking tokens manually when immediate revocation is critical. Size: in Azure Global, which includes GCC, the download limits are 20 megabytes for interactive sign-in and 65 for the service; in Azure Government, 45 and 150. If Entra can't reach a configured CRL endpoint, CBA fails. Phase 1 checks every issuing CA against those limits.

So PIV revocation closes CBA eventually, on the CA's schedule; disabling and token revocation close Entra now. Both are needed: one protects every other relying party, the other the tenant.

Device certificates. Intune issues SCEP or PKCS certificates for Wi-Fi and VPN; Microsoft Cloud PKI can be the issuing CA, licensed on top of Intune Plan 1 or 2, available in GCC High but not DoD, with a CRL valid seven days and republished every three and a half. The table is Intune's Windows behavior. Unenroll, wipe, retire, group removal and profile removal revoke and remove. Losing the license, or removing the user from Entra ID, leaves the certificate valid on the device. Hence Microsoft's order: wipe or retire first, then remove the user. And a manual Cloud PKI revocation with an active SCEP assignment just gets reissued at next check-in.`,
  "Book 03, Chapter 09, \"Revocation checking,\" \"Derived PIV credentials\" and \"Device certificates: Intune and Microsoft Cloud PKI.\"");
}

// ================================================================== 21 Leaver sequence
{
  const s = content(P2, "The leaver sequence: block first, reconcile to the end");
  tag(s, "How");
  img(s, "ch09-leaver-sequence", "The leaver sequence. The HR separation record sets employeeLeaveDateTime through provisioning. Block, at the effective separation time: step 1, disable the account in Entra ID and AD; step 2, revoke sessions and refresh tokens in Entra ID. Step 3, in parallel where practical: the card management system revokes the PIV credential and derived credentials; Intune retires or wipes every managed device, revoking SCEP and PKCS certificates; Entra ID and applications remove access packages, groups, licenses, privileged-role eligibility and application accounts. Step 4, reconcile every result and escalate anything incomplete. Step 5, dispose of the directory object under the approved disposition rule. A red note explains that disposal comes last because deleting the user or removing the license leaves SCEP certificates valid on the device.",
    0.6, 1.45, 5.3, 5.05);
  panel(s, "LCW", 6.1, 1.5, 6.65, 3.25, HEX.amber, HEX.amberTint, "RUNNING IT FROM LIFECYCLE WORKFLOWS", null, [
    "Disable user account, then Revoke all refresh tokens: first, in that order",
    "One custom task extension: a Logic App starts Intune retire and CMS revocation in parallel; Launch and wait",
    "Then groups, Teams, packages, licenses; Delete user in a separate post-offboarding workflow",
    "Delete user and the disable task don't support role holders: privileged leavers need their own path",
  ], 12);
  panel(s, "Clocks", 6.1, 4.9, 6.65, 1.55, HEX.red, HEX.redTint, "TWO CLOCKS THE BLOCK DOESN'T CONTROL", null, [
    "Issued access tokens live until expiry, one hour by default, unless the app supports CAE",
    "PIV: 18 hours from notification for a card that can't be collected",
  ], 12);
  sources(s, "Sources: Microsoft Learn — revoke user access; LCW built-in tasks; custom task extension; real-time termination tutorial. FIPS 201-3 §2.9.4, §2.10.2. Book 03, Ch 09; App A.");
  notes(s,
`The canonical leaver sequence: block logical access first. At the effective separation time, disable sign-in and revoke sessions. Every other revocation runs after the block, in parallel where practical, and is reconciled to completion. None of them may delay the block.

Step 1, disable the account in Entra ID and, for synced users, in AD. Step 2, revoke sessions and refresh tokens, so no new token is issued for any app tied to Entra ID. Access tokens already issued stay valid until they expire, one hour by default, unless the app supports continuous access evaluation; apps with their own session tokens have to end those themselves. This step also closes CBA immediately rather than at the next CRL. Disable first, then revoke, is Microsoft's documented order; revoking first leaves a window for a new token.

Step 3, in parallel. PIV through the CMS: collect and destroy the card where possible, otherwise revoke the authentication and card authentication certificates, and signature and key management certificates if present. For a card that can't be collected, FIPS 201-3 requires normal termination within 18 hours of notification, and emergency procedures where that's too long. Devices through Intune: retire or wipe, and wipe needs the device online. Access: privileged-role eligibility, packages, groups, Teams, licenses and app accounts. Step 4, reconcile every result and escalate anything incomplete. Step 5, dispose of the object last.

From Lifecycle Workflows: tasks run in sequence, and each task's continueOnError decides whether a failure stops the rest. Put disable and revoke first; then one custom task extension, a Logic App on the consumption plan, using Launch and wait so a missing response fails the task, authorized by its system-assigned managed identity. Delete user goes in a separate workflow; it doesn't support users with Entra role assignments or role-assignable group membership, and Appendix A notes the disable task has the same limit, so privileged leavers need their own verified block path. A partial leaver is a security incident, not a backlog item.`,
  "Book 03, Chapter 09, \"The canonical leaver sequence\" and \"Running it from Lifecycle Workflows\"; Appendix A, \"Partial leavers.\"");
}

// ================================================================== 22 Access
{
  const s = content(P2, "From attributes to access, and where rules stop");
  tag(s, "How");
  const b = table(s, "Rules", 1.5, [1.85, 5.6], ["Pattern", "Rule (codes are placeholders)"], [
    ["Organization", "(user.accountEnabled -eq true) -and (user.userType -eq \"Member\") -and (user.extensionAttribute10 -eq \"FIN-LED\")"],
    ["Several orgs", "... -and (user.extensionAttribute10 -in [\"FIN-LED\",\"FIN-AP\"])"],
    ["Employees only", "... -and (user.extensionAttribute11 -eq \"EMP\")"],
    ["Position category", "... -and (user.extensionAttribute12 -eq \"ANALYST\")"],
    ["Direct reports", "Direct Reports for \"<manager object ID>\": direct reports only; can't combine"],
  ], { fontSize: 11.5 });
  txt(s, "Limits", [
    { text: "Limits: ", options: { bold: true, color: HEX.navy } },
    { text: "3,072-character rules; 15,000 dynamic groups and dynamic AUs per tenant; P1 count per member. Exclude disabled accounts, guests and agent users. Shadow every rule first." },
  ], { x: 0.6, y: b + 0.1, w: 7.45, h: 6.5 - b - 0.1, fontSize: 12.5, valign: "middle" });
  panel(s, "Stop", 8.25, 1.5, 4.5, 4.95, HEX.red, HEX.redTint, "WHERE DYNAMIC MEMBERSHIP STOPS", null, [
    "Role-assignable groups are assigned; 500 per tenant",
    "PIM for Groups takes neither dynamic nor synced groups",
    "HR decides eligibility through an access package; PIM activates just in time",
    "Dynamic AUs: global cloud only, not GCC High or DoD",
    "Restricted AUs fall outside PIM, packages, workflows and reviews",
    "Break-glass accounts depend on none of it",
  ], 12);
  sources(s, "Sources: Microsoft Learn — dynamic membership rules; efficient rules; AUs, dynamic and restricted; PIM for Groups; access packages; access reviews; emergency access. Book 03, Ch 10.");
  notes(s,
`The derivation chain runs one way: worker record, stamped attributes, dynamic groups, entitlements. Entra ID adds and removes members as attributes change, and a member can't be added or removed by hand. Conditional Access and app roles consume the same groups. It's only as good as its weakest writer, which is why Chapter 06 makes the provisioning service the only writer.

Rule patterns are written against the canonical schema: native attributes where a rule can read them, the three coded slots otherwise, and every access rule excludes disabled accounts and guests explicitly. An agent's user account is a kind of user, so exclude agents from workforce rules too. The direct-reports rule uses the manager's object ID, adds the manager, covers direct reports only and can't be combined with another rule. Limits: 3,072 characters per rule; 15,000 dynamic groups per tenant, and dynamic administrative units count against it. Dynamic membership needs a P1 count covering each unique member user.

Administrative units scope delegation and can't be nested. A dynamic unit needs P1 per administrator and member, and dynamic units exist in the global cloud, not Azure Government; GCC uses the global cloud, GCC High and DoD don't. Restricted management units take their users out of PIM, entitlement management, Lifecycle Workflows and access reviews, so use them for small, chosen populations.

Access packages can name Manager as approver, which reads the HR-fed manager attribute; configure a fallback approver. Reviews can go to managers of users, scoped to exceptions.

Where rules stop: privileged roles use assigned role-assignable groups, at most 500; PIM for Groups excludes dynamic and synced groups. HR decides eligibility, PIM activates just in time. Break-glass accounts are cloud-only, on onmicrosoft.com, excluded from blocking policies, monitored on every sign-in, and excluded from HR-driven rules.`,
  "Book 03, Chapter 10 — From Attributes to Access.");
}
endModule("Module 3");

// ================================================================== 23 Module 4 divider
{
  const s = divider(P2, "Module 4: Evidence, ownership and the execution plan", "Part 2 — Lifecycle, access and evidence  ·  Chapters 07, 11, 12; Appendix C",
    ["Six metrics, the drift classes and evidence that outlives the account", "Who owns, guards and uses workforce identity data", "Seven phases, Gate G1, cutover and the contractor decision"], 14);
  notes(s,
`Module 4: evidence, ownership and the execution plan. An architecture that can't measure its own revocation latency is asserting PS-4 on faith. So this module starts with what the event stream lets you measure and detect, and what evidence it leaves.

Then the people: HR-driven identity is an organizational change before it's a technical one, and most of the owners sit outside the CIO's organization. Then the plan: seven phases, each gate the next phase's precondition, how it ties to the program's foundation gate, how a population is cut over, and the contractor source decision the book leaves open for the agency.`,
  "Book 03, Chapter 07 — Who Owns Workforce Identity; Chapter 11 — Drift, Metrics and Evidence; Chapter 12 — Execution Plan; Appendix C.");
}

// ================================================================== 24 Metrics and drift
{
  const s = content(P2, "Six lifecycle metrics, and the drift classes behind them");
  tag(s, "How");
  table(s, "Metrics", 1.5, [2.35, 3.6], ["Metric", "Definition"], [
    ["Separation-to-block", "HR effective time to disabled and sessions revoked (PS-4a)"],
    ["Separation-to-revocation", "HR effective time to the last confirmed revocation (PS-4b)"],
    ["Transfer-to-review", "Transfer date to the residual-access review done (PS-5)"],
    ["Joiner readiness rate", "Account, licenses, baseline access at start of day one"],
    ["Correlation coverage", "Enabled accounts that resolve to a current worker record"],
    ["Derivation purity", "Access memberships computed by rule, not by hand"],
  ], { fontSize: 12 });
  const hi = { options: { bold: true, color: HEX.red } };
  table(s, "Drift", 1.5, [1.9, 3.35, 0.9], ["Drift class", "Detection signal", "Default"], [
    ["Missing identity", "Active HR records with no matching employeeId", Object.assign({ text: "High" }, hi)],
    ["Stale access", "Terminated in HR, enabled in Entra or AD", Object.assign({ text: "High" }, hi)],
    ["Orphan account", "Enabled, with no or unknown employeeId", Object.assign({ text: "High" }, hi)],
    ["Attribute drift", "Field-by-field compare of the schema", "Medium"],
    ["Unauthorized write", "Audit logs on schema fields and certificateUserIds", Object.assign({ text: "High" }, hi)],
    ["Credential drift", "CMS and Intune reports joined on the worker", Object.assign({ text: "High" }, hi)],
    ["Schema drift", "Middleware validation output", "Medium"],
  ], { x: 6.6, fontSize: 12 });
  sources(s, "Sources: NIST SP 800-53 Rev. 5 PS-4, PS-5, AC-2, CA-7; Microsoft Learn — LCW schedule; ID Governance Account Discovery. Severities are program defaults. Book 03, Ch 11.");
  notes(s,
`An event-driven lifecycle is a measured one: every interval from event to action is a number. Six metrics. Separation-to-block, from HR effective time to the account disabled and sessions revoked, evidences PS-4a continuously. Separation-to-revocation, to the last confirmed revocation in the leaver sequence, evidences PS-4b with its exceptions. Transfer-to-review evidences PS-5. Correlation coverage, the share of enabled accounts resolving to a current worker by the correlation key, turns the orphan population into a query instead of a hunt. None of these numbers exists in a ticket-driven estate, because the events aren't recorded as events.

Two inputs belong in the first metric's definition: the Lifecycle Workflows schedule interval, three hours by default and settable from one to 24, and the PIV issuing CA's CRL publication interval.

Drift is any difference between what the HR record says and what the directory holds. The table gives each class its detection signal and a default severity; the severities are the program's defaults, not an external standard. The provisioning logs are the first source for most, since the client already reads them; the rest are joins between the HR extract, the directory and the CMS on the one identifier they share. The unauthorized-write signal filters the Entra audit log and AD change auditing on the schema's attributes plus certificateUserIds and altSecurityIdentities. Entra ID Governance's Account Discovery extends the orphan class past the directory, finding accounts in target applications with and without matching Entra accounts.

Expect a burst of high-severity findings in the first month: leavers the manual process hadn't caught and orphans years of tickets left behind. That burst is the measurement working, not the pipeline failing.`,
  "Book 03, Chapter 11 — Drift, Metrics and Evidence, \"The measured lifecycle\" and \"Drift between HR and the directory.\"");
}

// ================================================================== 25 Evidence
{
  const s = content(P2, "Evidence that outlives the account");
  tag(s, "How");
  const b = table(s, "Evidence", 1.5, [2.2, 5.55, 4.4], ["Event", "Evidence", "Kept in Entra ID"], [
    ["Any HR event", "The middleware's provenance record: event ID, payload hash, inputs, outcome", "Not at all: the agency's log store"],
    ["Provisioning", "The provisioning log entry for the record", "30 days with a premium edition, 7 with Free"],
    ["Joiner, mover, leaver", "Lifecycle Workflows run history, per task", "Up to 30 days; download to keep longer"],
    ["Leaver credentials", "Intune device actions; the CMS revocation record and the CRL that published it", "Outside Entra ID"],
    ["Access", "Membership changes and their rule; access-review decisions", "Audit log 30 days (P1/P2), 7 Free; review history 30 days"],
  ], { fontSize: 12 });
  facts(s, "Keep", b + 0.15, 6.5 - b - 0.15, [
    ["Export from day one of the pilot", HEX.red, HEX.redTint, "Retention isn't retroactive: route audit, sign-in, provisioning and entitlement logs to Azure Monitor, storage or the SIEM"],
    ["AU-11 and AU-6", HEX.navy, HEX.navyTint, "Retain for the records schedule; the unauthorized-write signal supports AU-6's review of unusual activity"],
    ["Logs carry no PII", HEX.teal, HEX.tealTint, "Operational logs hold the person key and a payload hash; full payloads only in an access-controlled audit store"],
  ], 12);
  sources(s, "Sources: Microsoft Learn — Entra data retention; provisioning logs; LCW history; review history; entitlement logs. SP 800-53 AU-3(3), AU-6, AU-11. Book 03, Ch 11; App B.");
  notes(s,
`Each event leaves evidence, and most of it doesn't stay in Entra ID for long. Any HR event leaves the middleware's provenance record: source event ID, payload hash, derivation inputs and outcome. That never lives in Entra ID; the middleware writes it to the agency's log store. Provisioning leaves a provisioning log entry per record, kept 30 days with a premium edition and 7 with Free. The leaver's credential steps leave Intune device action records and the CMS revocation record and CRL, outside Entra ID. Access leaves membership changes, the rule that produced them, and review decisions: the audit log keeps 30 days with P1 or P2 and 7 with Free, and access-review history reports stay downloadable for 30 days after creation.

So keep the evidence outside the directory, for the retention period the records schedule sets. The account itself is disposed of under the account-disposition rule, and the evidence has to outlive it. Entra's retention is far shorter than any federal records schedule, and it isn't retroactive: data that expired before export can't be recovered. Route audit, sign-in and provisioning logs to Azure Monitor, a storage account or the SIEM from the first day of the pilot, and export entitlement-management audit events the same way.

That retention is AU-11, keeping audit records for an organization-defined period to support after-the-fact investigations, and the unauthorized-write signal supports AU-6's review of audit records for unusual activity. Appendix B adds the privacy rule for logs: operational logs hold the person key and a payload hash, the kind of limit AU-3(3) places on PII in audit records, and full payloads go only to an access-controlled audit store, retained by schedule.`,
  "Book 03, Chapter 11, \"The evidence each event leaves\"; Appendix B, \"Protecting every leg\"; Chapter 08, \"Deletion.\"");
}

// ================================================================== 26 Controls
{
  const s = content(P2, "Control support, not control closure");
  tag(s, "How");
  const b = table(s, "Controls", 1.5, [1.55, 5.45, 5.15], ["Control", "What the architecture contributes", "What the agency still supplies"], [
    ["AC-2", "Every account traces to a worker record; account management aligned with termination and transfer (AC-2l)", "Account types, account managers, periods; accounts outside the HR population"],
    ["AC-2(1)", "Provisioning and workflows run the lifecycle from effective-dated events", "Automation for apps outside enterprise identity"],
    ["PS-4", "The separation starts the sequence; block and revocations timestamped and reconciled", "The period; exit interviews, property retrieval (PS-4c–e); late HR records"],
    ["PS-5", "The mover re-derives access and opens a residual review", "Physical access needs; actions, period, notification (PS-5d)"],
    ["IA-4", "One enterprise key, preserved across rehire and conversion; IA-4(4) status", "The identifier decision; reuse period; non-person identifiers"],
    ["SI-12", "Lineage from HR record through provenance to each consumer", "Records schedules, legal holds, disposition; privacy rules"],
  ], { fontSize: 12 });
  callout(s, "Separate", b + 0.15, 6.5 - b - 0.15, "FaScaleBalanced", HEX.navy, "Separate binding authority from guidance: ",
    "M-19-17, FIPS 201-3 and agency policy bind; the FICAM ILM Playbook and CISA's maturity model guide.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (Release 5.2.0) AC-2, AC-2(1), PS-4, PS-5, IA-4, SI-12; OMB M-19-17; FIPS 201-3; FICAM ILM Playbook; CISA ZTMM. Book 03, Ch 11.");
  notes(s,
`The architecture implements mechanisms and produces evidence for these controls. It doesn't satisfy any of them on its own: each also needs agency policy, organization-defined parameters, procedures and assessment. The right-hand column is what the agency still has to supply. Control text is from SP 800-53 Rev. 5, Release 5.2.0.

AC-2: every account traces to a worker record, creation, change and disablement follow hire, transfer and separation events, which is AC-2 l's alignment with personnel processes, and authorizations resolve to attribute, rule and record. The agency still defines account types, conditions of membership, account managers and periods, and covers accounts outside the HR population: non-person, emergency and shared. AC-2(1): provisioning and Lifecycle Workflows run the lifecycle, evidenced by run history and provisioning logs; automation for applications not integrated with enterprise identity remains. PS-4: the separation starts the leaver sequence on the effective date, and the block and revocations are timestamped and reconciled; the agency supplies the time period, exit interviews, retrieval of property and retained access to information the person controlled, and handles separations HR records late. IA-4: one enterprise key with mapped keys, preserved across rehire and conversion, and worker type as the IA-4(4) status characteristic; the identifier decision, authorization to assign, the reuse period and non-person identifiers remain. SI-12: lineage from the HR record through middleware provenance to each consumer; records schedules, legal holds and privacy requirements remain.

The agency's full requirements mapping should separate binding authorities, OMB M-19-17, FIPS 201-3 and its own policy, from implementation guidance: the FICAM ILM Playbook, which describes itself as best practice, and CISA's Zero Trust Maturity Model. The compliance treatment of the same controls is in the workbook's Federal Compliance Volume I, Book 04.`,
  "Book 03, Chapter 11, \"Control support: NIST SP 800-53 Rev. 5.\"");
}

// ================================================================== 27 Who owns
{
  const s = content(P2, "Who owns workforce identity: one decider per row");
  tag(s, "Who");
  table(s, "RACI", 1.5, [4.15, 2.05, 2.0], ["Decision (design guidance)", "Decides", "Does the work"], [
    ["Who owns each attribute; the person key", "ICAM governance body", "Data architect"],
    ["Meaning, values and code lists of an HR attribute", "HR", "HR"],
    ["Canonical schema and crosswalk changes", "Data architect", "Identity engineering"],
    ["Privacy basis, PIA, minimized set", "Privacy office", "Data arch.; identity eng."],
    ["Provisioning rules: scoping, matching, UPN", "Identity engineering", "Identity engineering"],
    ["Write permissions on HR-mastered attributes", "Security", "Identity engineering"],
    ["Access rules for an application", "Application owner", "Identity engineering"],
    ["Leaver timing: threshold, schedule, grace", "Security", "Identity engineering"],
    ["Contractor source; one authority per fact", "ICAM governance body", "Data architect"],
    ["Contractor sponsorship and end dates", "Contracting (COR)", "PIV office"],
    ["Authorize the feed; accept residual risk", "Authorizing official", "ISSO"],
  ], { fontSize: 11.5 });
  panel(s, "Fail", 9.0, 1.5, 3.75, 4.95, HEX.red, HEX.redTint, "WHERE OWNERSHIP FAILS", null, [
    "Ownership by console: IT fixes a title HR still has wrong",
    "The help desk as a shadow source",
    "A key owned by the source, lost at cutover",
    "A leaver owned in pieces",
    "Privacy arrives at go-live, too late for a routine use",
  ], 12);
  sources(s, "Sources: OMB M-19-17, M-19-23, A-108, A-130, M-03-22; NIST SP 800-37 Rev. 2, SP 800-79-2, SP 800-47 Rev. 1; FIPS 201-3; Microsoft Learn — built-in roles. Book 03, Ch 07.");
  notes(s,
`Chapters 04 to 06 decided which system is authoritative for each fact; Chapter 07 decides which people are. A system of record can be authoritative for worker type and still be wrong for half the contractors if no office accepts that keeping it right is its job. Federal policy names the offices but not their relationships: OMB M-19-17 directs an agency-wide ICAM governance structure that should include the CIO, CFO, HR, General Counsel, CISO, the Senior Agency Official for Privacy, the Chief Acquisition Officer and physical security. None of it says who decides what an organization code means or who may change the person key. The matrix is the program's recommended model, with exactly one decider per row.

Owners: HR is the information owner, in NIST SP 800-37's terms, for personnel data, and keeps that responsibility when the data is shared. Contractor sources own the people HR doesn't cover, and NIST SP 800-79-2 says sponsorship and adjudication can't be outsourced.

Users: the CIO's identity team runs the platforms; configuring an inbound provisioning app needs at least Application Administrator, plus Hybrid Identity Administrator for an AD target. Security owns the leaver path end to end. The help desk handles exceptions and routes data errors; User Administrator could update most user properties, which would make it a second writer, so Helpdesk Administrator scoped to an administrative unit fits better.

Guards: the privacy office decides the disclosure basis; A-108 says a new or significantly modified routine use can't be relied on until 30 days after publication, which is why privacy comes in at Phase 1. The PIV office owns sponsorship, proofing, issuance and termination. The ISSO owns evidence and gates; the authorizing official accepts residual risk. The data architect stewards one name, one definition, one owner and one key per attribute. The failures on the right have one root: whoever can make a change ends up owning the data.`,
  "Book 03, Chapter 07 — Who Owns Workforce Identity, \"Who owns the data,\" \"Who uses it,\" \"Who guards it,\" \"The responsibility matrix\" and \"Where ownership fails.\"");
}

// ================================================================== 28 Phases and G1
{
  const s = content(P2, "Seven phases, and the HR feed Gate G1 needs");
  tag(s, "How");
  table(s, "Phases", 1.5, [2.65, 5.35], ["Phase", "Gate (proposed starting criteria)"], [
    ["0 Program alignment", "Integration-point inventory, naming the identity feed, signed by the ISSO and submitted"],
    ["1 Authority and schema", "Identifier decision, map and schema signed; ≥99% correlation on the pilot cohort; the rest excepted"],
    ["2 Build and test", "Joiner, mover, leaver end to end in a test tenant, incl. device retire and test-CA revocation"],
    ["3 Hybrid go-live (pilot)", "Shadow mode; every difference explained; zero unmatched creations"],
    ["4 Automate, leaver first", "Zero missed leavers over a pay period; a test reorg with zero manual changes"],
    ["5 Cutover per population", "Cloud-native lifecycle with evidence; no AD writes for migrated populations; rollback tested"],
    ["6 Sustained posture", "Metrics on the ConMon cadence; high findings closed or on a dated plan"],
  ], { fontSize: 12 });
  panel(s, "G1", 8.8, 1.5, 3.95, 4.95, HEX.amber, HEX.amberTint, "PROGRAM GATE G1, FOUNDATION COMPLETE", "Identity's share", [
    "HR-to-cloud provisioning operational for the foundation scope",
    "Attribute slots in use confirmed free and single-writer",
    "Enterprise groups and AUs drift-clean",
    "The steward decides G1",
  ], 12.5);
  sources(s, "Sources: OMB/OPM Federal HR 2.0 memo; Microsoft Learn — LCW overview; bulkUpload limits; access package approval. Thresholds are proposals. Book 03, Ch 12; Book 01, Ch 12.");
  notes(s,
`Chapter 12's sequencing principle: each phase's gate is the next phase's precondition, and the source must be correct, not just designated. A drifted HR feed produces drifted access faster than any ticket queue. The numbers in the gates, such as 99 percent correlation or zero missed leavers across a pay-period cycle, are proposed starting criteria, not federal requirements; the agency approves or replaces each through its risk governance, and a risk-tiered threshold is usually more useful than one enterprise-wide number.

Phase 0 executes the Federal HR 2.0 memo's preparation actions: name the integrated project team point of contact, inventory integration points, name the HR-driven identity feed as an interconnection consumer, and name HR as the source for each population in the Entra ID migration plan. Phase 1 records the identifier decision, builds the standard-attribute crosswalk and the NOA trigger table, establishes the privacy basis, decides the contractor source, signs the authority map, finalizes the schema against Oracle field names. Phase 4 turns on causation leaver first, converts groups to rules, and re-bases access packages on Manager as approver. Phase 5 retargets each cloud-mastered population from the AD app to the Entra app, a configuration change per population. Phase 6 sustains it.

The panel ties this to the program roadmap. Book 01's Phase 1, Foundation, includes the HR-to-cloud provisioning feed for the foundation scope, pointing to this chapter, and Gate G1, Foundation Complete, requires it operational, with the attribute slots in use confirmed free and single-writer, alongside the Conditional Access baseline, drift-clean groups and units, and the other foundation items. The steward decides G1. Book 01's risk register names the failure it prevents: an HR connector that breaks mid-rollout and stalls the program, so G1 requires HR provisioning before rollout.`,
  "Book 03, Chapter 12 — Execution Plan; Book 01, Chapter 12 — Migration Roadmap, \"Phase 1 — Foundation\" and its risk register; Book 00, Chapter 09, \"Gate G1 — Foundation Complete.\"");
}

// ================================================================== 29 Cutover
{
  const s = content(P2, "Cutover: prove HR is the sole source, then close tickets");
  tag(s, "How");
  img(s, "appc-cutover-sequence", "Acceptance and cutover in six steps: acceptance tests in business language by worker type; a validation report signed before cutover; a dry run on production data with no writes; cutover with spot checks and rollback ready; seven days of proof that every change came from HR; then the ticket path closes for the population.",
    0.6, 1.45, 12.15, 1.55);
  const b = table(s, "Accept", 3.15, [4.55, 7.6], ["Acceptance scenario", "Expected outcome"], [
    ["A hire entered with a start date two weeks out", "The account exists, disabled, before day one; baseline access ready on day one"],
    ["A separation takes effect", "Sign-in blocked and sessions revoked at the effective time; PIV, devices and access reconciled"],
    ["An employee goes on leave without pay", "The account is kept and restricted; nothing is deprovisioned"],
    ["A contractor converts to employee", "Same person and key; access re-derived; manual contractor access removed"],
    ["A record fails validation", "Quarantined with a reason; nothing partial reaches the directory"],
  ], { fontSize: 12 });
  txt(s, "Sole", [
    { text: "Sole-source proof: ", options: { bold: true, color: HEX.teal } },
    { text: "for seven days every create, change and disable traces to an HR event; any audit-log change without a provisioning record restarts the clock." },
  ], { x: 0.6, y: b + 0.1, w: 12.15, h: 6.5 - b - 0.1, fontSize: 13, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — LCW templates and built-in tasks; provisioning logs; pause a provisioning job. NARA GRS 3.2. Book 03, App C; App A.");
  notes(s,
`Appendix C's rule: a population is cut over when HR is provably its only source of accounts, not when the pipeline first runs.

Acceptance tests are written in business terms, by worker type and event, so HR, the business and security can read them. The slide shows five of the appendix's scenarios. Anything that could leave a separated person with access, or lock out an active one, blocks acceptance. HR, the identity owner, the ISSO and the population's business owner sign.

A short validation report gates every cutover: acceptance results, open defects and dispositions, the drift baseline, Appendix B's privacy and security checks, and the rollback plan, signed before the cutover is scheduled. Then a dry run on production data with writes disabled, where every difference is explained; cutover for one population at a time, aligned with its move to Entra ID; and a written rollback: pause the provisioning job, which keeps its state and resumes where it left off, quarantine the batch, and return the population to the prior process.

Sole-source proof: for seven days after cutover every create, change and disable must trace to an HR event and a provenance record. The provisioning logs record each outcome, so compare them with the directory's audit log; anything in the audit log without a matching provisioning record came from somewhere else and restarts the clock. When the proof holds, the manual account-creation path closes for that population. Where an agency already runs an HR script or connector, revoke its credentials once the new path is proven, keep its state and logs under the applicable records schedules, often GRS 3.2 items 030 and 031 as the records officer confirms, and decommission it with the same sign-off.`,
  "Book 03, Appendix C — Acceptance and Cutover.");
}

// ================================================================== 30 Contractors
{
  const s = content(P2, "Contractors: the source-of-authority decision still open");
  tag(s, "Who");
  const b = table(s, "Facts", 1.5, [2.4, 4.45], ["Fact identity needs", "Authority"], [
    ["Existence and contract link", "Suitability register, or the Core HCM contingent worker record once configured"],
    ["End of engagement", "The contract record; if the register lacks end dates, the sponsor attests"],
    ["Suitability", "The contractor suitability register"],
    ["Proofing and credential status", "PIV enrollment and card management (IAL3)"],
    ["Accountable sponsor", "The COR or another federal employee, mastered in HR"],
    ["Person key", "The enterprise person key, same as employees"],
  ], { fontSize: 12 });
  panel(s, "Options", 7.65, 1.5, 5.1, 3.6, HEX.navy, HEX.navyTint, "THE OPEN DECISION (PHASE 1)", "Candidate sources", [
    "Core HCM contingent worker: best fit, but no contract or vetting data; confirm it will be configured",
    "PIV sponsorship system: only people with a PIV credential",
    "Suitability register: often records vetting, not the end date",
    "A non-employee lifecycle service: a complement, not a replacement",
  ], 12);
  callout(s, "Earliest", 5.3, 1.2, "FaUserClock", HEX.red, "Access ends at the earliest of: ",
    "contract end, suitability withdrawn, PIV revoked, sponsor gone with no successor in a grace period, or a missed sponsor recertification.");
  sources(s, "Sources: Oracle — WorkerType values; contingent worker actions; Change Worker Type. FIPS 201-3; NIST SP 800-79-2. Book 03, Ch 06, Ch 07, Ch 12 (verification register).");
  notes(s,
`OPM's data standards and Federal HR 2.0 cover federal employees. Contractors and vendors, often a large share of accounts and the share most likely to be orphaned, are in neither, and in most agencies they're tracked in contracting officer's representative spreadsheets: a sponsor, a contract, a start date and an end date nobody is obliged to keep current. A spreadsheet can't be a source of authority. The book frames the contractor source as a decision the agency makes in Phase 1, and leaves it open, with two items on the verification register: whether the agency's Core HCM configuration will record contingent workers, and whether the suitability register records engagement end dates and the enterprise person key.

The candidates. Core HCM's contingent worker is the best fit: Oracle treats contractors as a full worker type with a person record, an assignment and add, renew and convert actions. It lacks vendor management and non-employee governance: sponsorship, contract linkage and end-date attestation still need an owner. The PIV sponsorship system already has sponsorship, adjudication and expiry for every badged contractor; FIPS 201-3 requires investigation and favorable adjudication before issuance and caps card validity at six years, but it misses vendors and short-term workers without a card. A suitability register links a person to a contract under agency authority but often records the vetting decision, not the end.

So don't pick one: give each fact one authority and hang the record on an accountable federal sponsor, the left table. Access ends at the earliest end condition; the book's examples are a 14-day grace period for a departed sponsor and recertification every 180 days. Reconcile both ways: a badge with no contractor record and a contractor record with no badge are both drift.

Before a register becomes an authority, settle six things with its owner: owner, content, freshness, privacy basis, join key and coverage. The sequence starts with what exists: read-only reconciliation first; before Core HCM, the register plus sponsor attestation, leaver trigger first; at go-live, decide on the contingent worker type.`,
  "Book 03, Chapter 06, \"Contractors and vendors: the population HRIT doesn't cover\" and \"One fact, one authority\"; Chapter 07; Chapter 12, \"Open verification register.\"");
}

// ================================================================== 31 Close
{
  const s = content(P2, "Decisions to make, and next steps for HR-driven identity");
  tag(s, "How");
  const b = table(s, "Decide", 1.5, [4.45, 2.85, 4.85], ["Decision", "Owner", "First step"], [
    ["The enterprise person key", "ICAM governance body", "Choose a key the agency controls; check it fits employeeId"],
    ["Name the identity feed in the Core HCM interconnection", "HR 2.0 point of contact", "Add it to the Phase 0 inventory, before month 5"],
    ["The privacy basis and minimized set", "Privacy office", "Written determination per leg; update the PIA"],
    ["The authority map and attribute slots", "Governance body; data architect", "Sign the map; confirm slots free and single-writer"],
    ["The contractor source, one authority per fact", "ICAM governance body", "Read-only reconciliation of register and PIV"],
    ["Leaver timing and the block threshold", "Security; AO consulted", "Set the schedule interval; measure from day one"],
  ], { fontSize: 13, minRow: 0.5 });
  callout(s, "Next", b + 0.15, 6.5 - b - 0.15, "FaClipboardCheck", HEX.navy, "Measure before you automate: ",
    "baseline correlation coverage and orphans read-only, fix errors at the source, then build leaver first.");
  sources(s, "Sources: as cited on the module slides. Book 03, Chapters 01–13; Appendices A–C; Book 01, Chapter 12.");
  notes(s,
`So, from Monday, six decisions, each with an owner. The ICAM governance body decides the enterprise person key: one the agency controls, mapped from every source and credential key, and short enough for employeeId's sixteen characters. The agency's Federal HR 2.0 point of contact names the identity feed in the Phase 0 integration-point inventory, so it's designed in before the interconnection goes live, around month five of onboarding in the memo's sample timeline. The privacy office makes the written determination of the disclosure basis for each leg of the feed and approves the minimized attribute set and the updated PIA, because those timelines can't be compressed at go-live.

The governance body signs the authority map, with the data architect keeping the record, and identity engineering confirms the attribute slots are free, in the provisioning apps' target lists, and single-writer, which is also a Gate G1 item. The governance body decides the contractor source, with one authority per fact and an accountable sponsor, starting with read-only reconciliation of the register and PIV enrollment against the directories. And security sets leaver timing: the block threshold, the workflow schedule interval and grace periods, with the authorizing official consulted because a threshold looser than policy is a risk acceptance.

The first step needs no new platform: measure before you automate. Populate and baseline the correlation key, list every unmatched enabled account with an owner, fix data errors in HR rather than in the directory, and then build, leaver first, because revocation is where the risk and the evidence value are.

HR-driven identity turns accounts, credentials and access into consequences of personnel records rather than tickets. Chapters 04 through 12 and the appendices carry the detail, every claim footnoted. Thank you.`,
  "Book 03, Chapters 04, 06, 07 and 12; Appendix B; Book 01, Chapter 12.");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const sourceSlide = (t, src) => {
  const s = content("Backup", t);
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
  const need = 1.5 + src.reduce((a, x) => a + lines(x, 11.75, 12) * 0.2 + 0.07, 0);
  if (need > 6.6) console.warn(`  ! ${t} source list may overflow: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "OMB M-22-09 (Jan. 26, 2022); OMB M-19-26 (TIC 3.0); OMB M-19-17 (May 21, 2019).  ·  NIST SP 800-207.  ·  CISA Zero Trust Maturity Model v2.0 (Apr. 2023).",
  "GSA / Federal CISO Council ICAM Subcommittee, Identity Lifecycle Management Playbook (best practice, not policy).  ·  FICAM Architecture.",
  "Microsoft Learn: Plan cloud HR application to Entra user provisioning (HR-driven provisioning); Transfer user Source of Authority (SOA) to Entra ID; Transition to the cloud.",
  "Oracle Fusion Cloud HCM: Date Effectivity; Considerations for Using Jobs and Positions; Employee ATOM Feeds; 26B What's New, Change Worker Type.",
  "NIST SP 800-53 Rev. 5, Release 5.2.0: IA-4, IA-4(4), PS-4, PS-5, AC-2.  ·  NIST FIPS 201-3 (Jan. 2022): reissuance, cardholder UUID.",
  "Microsoft Graph v1.0: user resource type (employeeId, max 16 characters; employeeType, employeeHireDate, employeeLeaveDateTime, employeeOrgData); onPremisesExtensionAttributes.",
  "Privacy Act, 5 U.S.C. § 552a(b)(1), (b)(3).  ·  OMB Circular A-108 (Dec. 2016).  ·  OPM/GOVT-1 SORN, 88 FR (Aug. 17, 2023).",
  "OPM: Data Policy & Guidance (metadata repository); EHRI Data Standards; Guide to Processing Personnel Actions (Oct. 2026 edition).",
  "Microsoft Learn: Manage rules for dynamic membership groups; Oracle HCM provisioning tutorial (attribute worksheet); Extend API-driven provisioning to custom attributes; LCW attribute sync.",
  "Full footnotes with links and access dates: Book 03, Chapters 01, 02, 04 and 06 (whalermike.github.io/modernization-workbook/docs/books/b03-hr-identity/).",
]);
sourceSlide("Sources behind Module 2 — The provisioning pipeline", [
  "OMB and OPM, Creating \"Federal HR 2.0\" by Consolidating Core Human Capital Management Across the Federal Government (Dec. 10, 2025), §I, §II, Appendices A–C.",
  "OPM: OPM Awards Contract for First-Ever Governmentwide HR Platform; Core HCM page; HR QSMO.  ·  Oracle press release (June 11, 2026).",
  "OPM Solicitation 24322626R0007, Federal HRIT Modernization, Amendment 4, PWS Appendix A, Functional Requirements Matrix, Req. 5.",
  "FedRAMP Marketplace data, product F1603257882, Oracle Fusion Cloud (Moderate).  ·  Trade press on go-live timing: Federal News Network (June 10, 2026); MeriTalk (Sept. 1, 2026).",
  "Microsoft Learn: API-driven inbound provisioning concepts; FAQs; Grant access to the inbound provisioning API; Configure Oracle HCM for automatic user provisioning.",
  "Microsoft Graph: Perform bulkUpload (rate limit, permissions); National cloud deployments (GCC uses the worldwide endpoints).",
  "Oracle: Introduction to HCM Extracts; Employee ATOM Feeds; Employees REST deprecation notice; Workers REST endpoints; SCIM Users (writeback).",
  "IETF RFC 7644 §3.7 (SCIM bulk operations); RFC 7643 §4.3 (enterprise user extension).",
  "Microsoft Learn: Plan cloud HR provisioning (parentDistinguishedName, manager references, agents); Cloud Sync prerequisites (gMSA, three agents, Tier 0); administrative units; Org Explorer.",
  "Microsoft Learn: accidental deletions prevention; workload identity Conditional Access.  ·  Full footnotes: Book 03, Chapters 03 and 05; Appendix B.",
]);
sourceSlide("Sources behind Module 3 — Lifecycle and credentials", [
  "OPM, Guide to Processing Personnel Actions (Oct. 2026 edition): nature-of-action families, SF-50 documentation requirement.  ·  NIST SP 800-53 Rev. 5 IA-4, PS-4, PS-5.",
  "Microsoft Learn: What are lifecycle workflows; built-in tasks; execution conditions and scheduling; customize the schedule; synchronize attributes; real-time termination tutorial.",
  "Microsoft Learn: Lifecycle Workflows custom task extension; Revoke user access in Entra ID; Restore or remove a recently deleted user; ID Governance licensing fundamentals.",
  "Microsoft Learn: CBA technical concepts (username bindings, affinity); Set up CBA; Mapping to certificateUserIds; CBA certificate revocation list.",
  "NIST FIPS 201-3 §2.9.1, §2.9.4, §2.10.2; SP 800-63-4 (July 2025); SP 800-157 (Dec. 2014) and SP 800-157 Rev. 1 final public draft (Nov. 2024).  ·  OMB M-22-09.",
  "Microsoft Learn: Remove SCEP and PKCS certificates in Intune; Overview of Microsoft Cloud PKI; Monitoring for Cloud PKI.",
  "Microsoft Learn: dynamic membership rules and efficient rules; administrative units (dynamic, restricted, FAQ); Planning identity for Azure Government applications.",
  "Microsoft Learn: access package approval settings; create an access review; PIM for Groups; manage emergency access accounts; Conditional Access users and groups.",
  "Workbook research explainer: Certificates, Tokens and Keys Across the Hybrid Estate (certificateUserIds after AD; design guidance).",
  "Full footnotes with links and access dates: Book 03, Chapters 08–10 and Appendix A.",
]);
sourceSlide("Sources behind Module 4 — Evidence and the plan", [
  "NIST SP 800-53 Rev. 5, Release 5.2.0: AC-2, AC-2(1), AU-3(3), AU-6, AU-11, CA-7, IA-4, PS-4, PS-5, SI-12.  ·  CISA Zero Trust Maturity Model v2.0.",
  "Microsoft Learn: Entra data retention; provisioning logs; LCW history and downloadable reports; access review history; entitlement management logs; Account Discovery.",
  "OMB M-19-17 §IV; M-19-23 (Data Governance Body); Circular A-130; Circular A-108 §6; M-03-22 §II.B.  ·  Privacy Act, 5 U.S.C. § 552a.",
  "NIST SP 800-37 Rev. 2, Appendix D roles; SP 800-79-2 §2.1, §2.3; SP 800-47 Rev. 1; FIPS 201-3 §2.1, §2.7, §2.9.4.",
  "OPM Data Policy & Guidance (data element requests).  ·  Microsoft Learn: Entra built-in roles; Configure API-driven inbound provisioning app.",
  "OMB/OPM Federal HR 2.0 memo (Phase 0 actions).  ·  Microsoft Learn: LCW overview and tasks; bulkUpload limits; access package Manager as approver.",
  "Microsoft Learn: LCW templates; provisioning logs; pause a provisioning job.  ·  NARA General Records Schedule 3.2, items 030 and 031.",
  "Oracle: Create a worker work relationship (WorkerType values); How You Convert Pending Workers; Change Worker Type.  ·  NIST FIPS 201-3 (IAL3, six-year validity).",
  "Workbook: Book 01, Chapter 12 (Phase 1 Foundation, Gate G1, risk register); Book 00, Chapter 09 (Gate G1 checklist).",
  "Full footnotes with links and access dates: Book 03, Chapters 06, 07, 11, 12 and Appendices B–C.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
