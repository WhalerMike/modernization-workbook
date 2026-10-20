const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];
const THEME = {
  name: "HR-Driven Identity",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A44", lt1: "FFFFFF", dk2: "334155", lt2: "F1F5F9",
    accent1: "1F2A44", accent2: "0F766E", accent3: "B45309", accent4: "B91C1C",
    accent5: "64748B", accent6: "E6F2F1", hlink: "0F766E", folHlink: "334155",
  },
};
const HEX = { navy: "1F2A44", teal: "0F766E", amber: "B45309", red: "B91C1C", slate: "64748B",
  ink: "334155", tealTint: "E6F2F1", navyTint: "EEF1F7", amberTint: "FDF3E7", redTint: "FDECEC", line: "CBD5E1", grey: "F1F5F9" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Mike Stratton";
pres.title = "HR-Driven Identity";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Title",
  background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.0, w: 11.7, h: 1.7, fontFace: "Cambria",
      fontSize: 44, bold: true, color: C.text1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.85, w: 11.7, h: 1.0, fontSize: 22,
      color: C.accent2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "Content",
  background: { color: "FFFFFF" },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontFace: "Cambria",
      fontSize: 30, bold: true, color: C.text1, valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "HR-Driven Identity  ·  Mike Stratton", options: { x: 0.6, y: 7.0, w: 8, h: 0.3,
      fontSize: 10, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
});

let n = 0;
const content = (title, section) => {
  const s = pres.addSlide({ masterName: "Content", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  n++;
  return s;
};
const box = (s, name, x, y, w, h, fill, line) => s.addShape(pres.shapes.ROUNDED_RECTANGLE,
  { objectName: name, x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line || fill, width: 1 } });
const txt = (s, name, text, o) => s.addText(text, Object.assign({ objectName: name, isTextBox: true, margin: 0,
  color: C.text2, fontSize: 14, valign: "top" }, o));
const arrow = (s, x, y, w, h, color) => s.addShape(pres.shapes.LINE,
  { x, y, w, h, line: { color: color || HEX.slate, width: 1.75, endArrowType: "triangle" } });
const link = (s, x, y, w, h) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: HEX.slate, width: 1.5 } });
const tableOpts = (colW, extra) => Object.assign({ x: 0.6, colW, fontFace: "Calibri", fontSize: 13, color: HEX.ink,
  border: { type: "solid", color: HEX.line, pt: 0.75 }, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1] }, extra);
const head = (cells) => cells.map((t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.navy } } }));

// Slides follow the HR-Driven Identity bundle, chapter by chapter (00–11).
const path = require("path");
const LEAVER_PNG = path.join(__dirname, "leaver.png");

// ------------------------------------------------------------------ 1 Title
pres.addSection({ title: "Opening" });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: "Opening" });
  n++;
  s.addText("HR-Driven Identity", { placeholder: "title" });
  s.addText("From the HR system of record to Entra ID — authoritative workforce identity, automated lifecycle, governed access, and measurable evidence", { placeholder: "body" });
  txt(s, "Presenter", [
    { text: "Mike Stratton", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Digital Identity line of business  ·  GS-14 Enterprise Data Architect  ·  Data Strategy and Enablement", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 11.7, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:40]  Good morning, and thank you.

I chose the Digital Identity line of business, and I'm going to present work I've written up as a twelve-chapter modernization workbook: HR-Driven Identity — how hire, transfer and separation records in the HR system of record become accounts, access and evidence.

It's directly relevant to SSA: SSA is a Wave 2 agency in Federal HR 2.0, moving to Oracle Fusion Cloud HCM in fiscal 2027, and the identity feed has to be ready when SSA's interconnection goes live.

I'll follow the workbook's order: the problem, the federal program, the data — authority, the logical model and the physical crosswalk — then lifecycle, credentials, access, measurement and delivery.`);
}

// ------------------------------------------------------------------ 2 Ch00
pres.addSection({ title: "The case" });
{
  const s = content("The goal is not a better HR connector", "The case");
  box(s, "Problem card", 0.6, 1.55, 5.0, 5.15, HEX.grey);
  txt(s, "Problem text", [
    { text: "The problem", options: { bold: true, color: HEX.navy, fontSize: 20, fontFace: "Cambria", breakLine: true } },
    { text: "Hire, transfer, conversion, leave and separation are recorded as effective-dated workforce events. Identity services learn about them later — by ticket, email, periodic reconciliation or audit finding.", options: { breakLine: true } },
    { text: "Replacing one connector with another doesn’t solve that. The task is a governed workforce identity model, resilient and observable actions, and measured time from business event to verified identity outcome.", options: {} },
  ], { x: 0.9, y: 1.8, w: 4.45, h: 3.6, fontSize: 15, paraSpaceAfter: 10 });
  txt(s, "Tagline", "The goal is workforce identity changes that are timely, explainable and measurable.",
    { x: 0.9, y: 5.55, w: 4.45, h: 0.95, fontSize: 16, italic: true, bold: true, color: HEX.teal, fontFace: "Cambria" });
  txt(s, "Outcomes heading", "Modernization outcomes", { x: 5.95, y: 1.55, w: 6.8, h: 0.45, fontSize: 20, bold: true, color: HEX.teal, fontFace: "Cambria" });
  const outs = [
    ["Day-one readiness", "Accounts and baseline access ready at start"],
    ["Separation-to-block", "Logical access blocked at the effective time"],
    ["Revocation completion", "PIV, devices, sessions reconciled to completion"],
    ["Mover convergence", "Prior-assignment access removed and reviewed"],
    ["Correlation coverage", "Enabled accounts reconcile to workforce records"],
    ["Orphan reduction", "Accounts with no authority record found and resolved"],
    ["Explainable access", "Every entitlement traces to a rule or exception"],
    ["Continuous evidence", "Produced by normal operation, not assembled"],
  ];
  outs.forEach((o, i) => {
    const x = 5.95 + (i % 2) * 3.45, y = 2.15 + Math.floor(i / 2) * 1.15;
    box(s, `Outcome ${i + 1}`, x, y, 3.3, 1.0, HEX.tealTint);
    txt(s, `Outcome ${i + 1} text`, [
      { text: o[0], options: { bold: true, color: HEX.teal, breakLine: true } },
      { text: o[1], options: { fontSize: 12.5 } },
    ], { x: x + 0.15, y: y + 0.08, w: 3.05, h: 0.86, fontSize: 15, valign: "middle" });
  });
  s.addNotes(
`[0:40–1:50]  Chapter 00 — the overview.

The problem: workforce events are recorded in HR as effective-dated facts, and identity services find out late — by ticket, email, a periodic reconciliation, or an audit finding. The results are day-one access gaps, stale attributes, access kept after a move, duplicate identities after a conversion or rehire, and accounts that outlive their justification.

Swapping connectors doesn't fix that. The work is to establish a governed workforce identity model, connect authoritative events to the services that act on them, make those actions resilient and observable, and measure business-event-to-outcome time.

So the workbook is organized around these eight outcomes. The model, the pipeline and the workflows are the means; these are the objectives — and every one of them is measurable.`);
}

// ------------------------------------------------------------------ 3 Ch01
{
  const s = content("Why HR is the source of authority", "The case");
  const pts = [
    { d: "Day −14", k: "HR records the separation", f: "No other system is listening", c: HEX.teal },
    { d: "Day 0", k: "Separation takes effect", f: "Account, app logins and badge all still live", c: HEX.amber },
    { d: "Day +3", k: "A ticket disables the account", f: "Nine application accounts stay enabled", c: HEX.amber },
    { d: "Day +45", k: "Quarterly review flags two", f: "Nobody owns the other seven", c: HEX.red },
    { d: "Day +180", k: "Pen test signs in with one", f: "The gap is now an incident", c: HEX.red },
  ];
  link(s, 1.85, 2.6, 9.6, 0);
  pts.forEach((p, i) => {
    const cx = 1.85 + i * 2.4;
    s.addShape(pres.shapes.OVAL, { objectName: `Timeline dot ${i + 1}`, x: cx - 0.22, y: 2.38, w: 0.44, h: 0.44,
      fill: { color: p.c }, line: { color: "FFFFFF", width: 2 } });
    txt(s, `Timeline day ${i + 1}`, p.d, { x: cx - 1.2, y: 1.7, w: 2.4, h: 0.5, fontSize: 20, bold: true, color: p.c, align: "center", fontFace: "Cambria" });
    txt(s, `Timeline event ${i + 1}`, [
      { text: p.k, options: { bold: true, color: HEX.navy, breakLine: true } },
      { text: p.f },
    ], { x: cx - 1.08, y: 3.05, w: 2.16, h: 1.4, fontSize: 14, align: "center" });
  });
  box(s, "Takeaway", 0.6, 4.75, 12.15, 1.9, HEX.grey);
  txt(s, "Takeaway text", [
    { text: "A credential proves who signed a claim — not whether the claim is still true.", options: { bold: true, color: HEX.navy, fontSize: 20, breakLine: true } },
    { text: "Employment, position and supervisor are facts only the human capital system originates. Cleanup, directory mastery and access reviews can’t substitute for designating it as the source.", options: { fontSize: 16 } },
  ], { x: 0.95, y: 4.95, w: 11.5, h: 1.55, valign: "middle", paraSpaceAfter: 6 });
  s.addNotes(
`[1:50–3:00]  Chapter 01 — why HR is the source of authority.

A token proves who signed a claim. It can't tell you whether the person still works here, still holds the position, still reports to the approver. Those are employment facts, and they originate in one system: the human capital system of record.

The orphan timeline shows what happens without a channel from that system. HR knows two weeks early. On day zero everything is still live. A ticket disables the directory account on day three, nine application accounts stay on, a review finds two, and six months later a pen test signs in with one of the rest.

That's not a diligence failure — it's the design working as built. And the three usual patches don't fix it: cleanup produces a snapshot with no event source, making the directory the master just recreates tickets as the source of truth, and reviews sample state but can't see transitions. The fix is to designate the source.`);
}

// ------------------------------------------------------------------ 4 Ch02
{
  const s = content("Federal HR 2.0 sets the clock — SSA is in Wave 2", "The case");
  const ms = [
    ["Dec 10, 2025", "OMB/OPM memo", "One government-wide Core HCM platform; agencies pause their own"],
    ["Jun 11, 2026", "Core HCM award", "Oracle Fusion Cloud HCM (SaaS)"],
    ["Jan–Mar 2027", "First go-lives", "Wave 1 agencies"],
    ["FY 2027", "Wave 2 incl. SSA", "~8-month onboarding; interconnections live ~month 5"],
    ["FY 2028", "One system", "EHRI and eOPF made redundant and decommissioned"],
  ];
  link(s, 1.85, 2.45, 9.6, 0);
  ms.forEach((m, i) => {
    const cx = 1.85 + i * 2.4, key = i === 3;
    s.addShape(pres.shapes.OVAL, { objectName: `Milestone dot ${i + 1}`, x: cx - 0.2, y: 2.25, w: 0.4, h: 0.4,
      fill: { color: key ? HEX.amber : HEX.navy }, line: { color: "FFFFFF", width: 2 } });
    txt(s, `Milestone date ${i + 1}`, m[0], { x: cx - 1.1, y: 1.6, w: 2.2, h: 0.45, fontSize: 18, bold: true, color: key ? HEX.amber : HEX.navy, align: "center", fontFace: "Cambria" });
    txt(s, `Milestone text ${i + 1}`, [
      { text: m[1], options: { bold: true, color: key ? HEX.amber : HEX.navy, breakLine: true } },
      { text: m[2] },
    ], { x: cx - 1.08, y: 2.85, w: 2.16, h: 1.5, fontSize: 14, align: "center" });
  });
  const notes = [
    ["The deadline isn’t the agency’s to set.", "The provisioning feed must be ready at the interconnection slot. Build backward from it.", HEX.amber, HEX.amberTint],
    ["EHRI-shaped integrations expire.", "The durable interface is Core HCM’s own: HCM Extracts, ATOM feeds, REST and SCIM 2.0.", HEX.navy, HEX.navyTint],
    ["No OPM mandate for Entra ID.", "OPM fixes the HR side; the identity design is the agency’s decision.", HEX.teal, HEX.tealTint],
  ];
  notes.forEach((nn, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Consequence ${i + 1}`, x, 4.95, 3.95, 1.6, nn[3]);
    txt(s, `Consequence ${i + 1} text`, [
      { text: nn[0], options: { bold: true, color: nn[2], breakLine: true } },
      { text: nn[1], options: { fontSize: 14 } },
    ], { x: x + 0.25, y: 5.08, w: 3.5, h: 1.4, fontSize: 16, paraSpaceAfter: 6 });
  });
  s.addNotes(
`[3:00–4:10]  Chapter 02 — the federal program, and why the timing matters for SSA.

The December 10, 2025 OMB/OPM memo directs one government-wide Core HCM platform, and agencies pause their own Core HCM modernization. Oracle Fusion Cloud HCM was awarded on June 11, 2026. First Wave 1 go-lives are January to March 2027. SSA is in Wave 2, fully in fiscal 2027: each agency's onboarding runs about eight months, with interconnections live around month five. The government-wide goal is fiscal 2028, and EHRI and eOPF are then decommissioned.

Three consequences. The deadline isn't ours to set — the identity feed has to be ready at SSA's interconnection slot, so we plan backward from it. Anything built against EHRI-shaped feeds has an expiry date; the durable interface is Core HCM's own — extracts, ATOM feeds, REST and SCIM 2.0, which the solicitation requires. And no OPM document mandates Entra ID integration: OPM fixes the HR side, and the identity design is SSA's decision.`);
}

// ------------------------------------------------------------------ 5 Ch03
pres.addSection({ title: "The data" });
{
  const s = content("Attribute authority: one master per attribute", "The data");
  const rows = [
    ["Person and affiliation identifiers", "HR system of record (source keys)", "Correlation key, audit joins, account linkage"],
    ["Legal name, worker type, status", "HR system of record", "Display name, enable/disable state"],
    ["Position, title, grade", "HR system of record", "Role-eligible access packages, approvals"],
    ["Organizational placement", "HR system of record", "Dynamic groups, ABAC attributes, chargeback"],
    ["Supervisor / reporting line", "HR system of record", "manager attribute, approvals, attestations"],
    ["UPN, mail, group memberships", "Identity platform — derived by rule", "Applications, token claims"],
    ["Device identity and certificates", "Device management and PKI", "Network admission, TLS"],
  ];
  s.addTable([head(["Attribute", "Authoritative system", "Derived consumers"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : {} })))],
    tableOpts([2.95, 2.75, 2.85], { y: 1.55, h: 4.9, fontSize: 13.5 }));
  box(s, "Rules card", 9.4, 1.55, 3.35, 4.9, HEX.tealTint);
  txt(s, "Rules heading", "Operating rules", { x: 9.65, y: 1.75, w: 2.9, h: 0.5, fontSize: 20, bold: true, color: HEX.teal, fontFace: "Cambria" });
  const rules = [
    ["One master per attribute. ", "Writeback never touches an HR-mastered fact."],
    ["No manual edits ", "to HR-derived attributes; an IT write is drift."],
    ["Corrections flow upstream, ", "to the HR record or the rule."],
    ["Effective dating ", "makes day-one and same-day revocation possible."],
  ];
  txt(s, "Rules list", rules.flatMap((r, i) => [
    { text: r[0], options: { bullet: { type: "number" }, bold: true, color: HEX.navy } },
    { text: r[1], options: { breakLine: i < rules.length - 1 } }]),
    { x: 9.65, y: 2.35, w: 2.9, h: 4.0, fontSize: 14, paraSpaceAfter: 8 });
  s.addNotes(
`[4:10–5:20]  Chapter 03 — attribute authority. This is the programmatic data knowledge.

For every attribute an access decision reads, the authority map names one owning system. Identifiers, legal name, worker type, status, position, organizational placement and supervisor are created by business acts in HR. UPN, mail and group memberships are derived by rule in the identity platform. Device identity and certificates belong to device management and PKI.

The operating rules make it work. One master per attribute — writeback, if used, carries only identity-platform values like work email back to HR, and never an HR-mastered fact. No manual edits to HR-derived attributes: an IT write to one is a drift event. Corrections flow upstream. And effective dating matters: HR records state transitions with timestamps, which is what lets us have accounts waiting on day one and revoke on the effective date.

The chapter also defines layered identifiers — enterprise person key, source key, affiliation key, directory ID, credential IDs — so a source change like the Core HCM cutover doesn't break correlation.`);
}

// ------------------------------------------------------------------ 6 Ch05
{
  const s = content("The canonical workforce identity model", "The data");
  const rows = [
    ["Person number", "workers.PersonNumber", "externalId", "employeeID", "employeeId"],
    ["Employment active", "Assignment status", "active", "accountDisabled", "accountEnabled"],
    ["Manager", "Manager’s person number", "manager", "manager (DN)", "manager"],
    ["Hire date", "Effective start date", "HireDate (ext.)", "extensionAttribute2", "employeeHireDate"],
    ["Leave date", "Termination effective date", "TermDate (ext.)", "extensionAttribute3", "employeeLeaveDateTime"],
    ["Organization code", "Department ID (code)", "orgCode (ext.)", "extensionAttribute10", "extensionAttribute10"],
  ];
  s.addTable([head(["Canonical field", "Oracle HCM source", "SCIM", "Active Directory", "Entra ID"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : { fontFace: j === 1 ? "Calibri" : "Consolas", fontSize: 12.5 } })))],
    tableOpts([2.3, 2.75, 2.15, 2.45, 2.5], { y: 1.55, h: 3.6, fontSize: 13 }));
  const rules = [
    ["Native attributes first", "Add an extension only where a rule can’t read a native property."],
    ["Codes, not display strings", "A code changes only when the business fact changes."],
    ["Same carrier, both directories", "extensionAttribute1–15 exist in AD and in Entra ID."],
  ];
  rules.forEach((r, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Design rule ${i + 1}`, x, 5.45, 3.95, 1.25, HEX.grey);
    txt(s, `Design rule ${i + 1} text`, [
      { text: r[0], options: { bold: true, color: HEX.teal, breakLine: true } },
      { text: r[1], options: { fontSize: 14 } },
    ], { x: x + 0.25, y: 5.57, w: 3.5, h: 1.05, fontSize: 16 });
  });
  s.addNotes(
`[5:20–6:30]  Chapter 05 — the canonical workforce identity model. This is the logical-to-physical modeling.

Logically, the model is the person, their affiliations and assignments, and the identifiers that link them — independent of any product. Physically, it becomes this crosswalk: one canonical field, and its name in every system — the Oracle HCM source, the SCIM payload, on-premises Active Directory, and Entra ID. It's the only crosswalk in the workbook; every other chapter links to it.

Three physical design rules. Native attributes first — employeeId, department, manager, employeeHireDate already mean what HR means, and other features understand them. Codes, never display strings, in anything that grants access. And the same carrier in both directories, so one rule works through years of coexistence.

Two details a data architect has to own: AD has no native hire or leave date, so the model chooses carriers; and the person number is a source correlation key, subject to the enterprise identifier decision — not automatically the universal key.`);
}

// ------------------------------------------------------------------ 7 Ch04
{
  const s = content("Provisioning services: one door, five duties per event", "The data");
  const stages = [
    ["Authoritative source", "Oracle Fusion Cloud HCM"],
    ["Boundary transformation", "Source-specific, replaceable"],
    ["Governed identity model", "The durable contract"],
    ["Provisioning service", "Graph /bulkUpload"],
    ["Target services", "Entra ID or on-prem AD"],
  ];
  stages.forEach((st, i) => {
    const x = 0.6 + i * 2.5, key = i === 2;
    box(s, `Stage ${i + 1}`, x, 1.6, 2.1, 1.45, key ? HEX.teal : HEX.navyTint, key ? HEX.teal : HEX.navy);
    txt(s, `Stage ${i + 1} text`, [
      { text: st[0], options: { bold: true, color: key ? "FFFFFF" : HEX.navy, breakLine: true } },
      { text: st[1], options: { fontSize: 13, color: key ? "FFFFFF" : HEX.ink } },
    ], { x: x + 0.15, y: 1.72, w: 1.8, h: 1.25, fontSize: 15, align: "center", valign: "middle" });
    if (i < 4) arrow(s, x + 2.1, 2.325, 0.4, 0);
  });
  const duties = [
    ["1", "Validate", "Required attributes present; unknown worker types refused. Fail closed."],
    ["2", "Sequence", "Apply events in order; a dropped event is silent drift."],
    ["3", "Normalize", "One SCIM bulk payload from the canonical model."],
    ["4", "Provenance", "One record per event, before the Graph call returns."],
    ["5", "Reconcile", "Read the provisioning logs; exceptions get an owner."],
  ];
  duties.forEach((d, i) => {
    const x = 0.6 + i * 2.5;
    s.addShape(pres.shapes.OVAL, { objectName: `Duty ${d[0]} badge`, x, y: 3.5, w: 0.55, h: 0.55, fill: { color: HEX.amber }, line: { color: HEX.amber } });
    txt(s, `Duty ${d[0]} number`, d[0], { x, y: 3.5, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, `Duty ${d[0]} text`, [
      { text: d[1], options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
      { text: d[2], options: { fontSize: 14 } },
    ], { x, y: 4.15, w: 2.25, h: 1.6, paraSpaceAfter: 4 });
  });
  box(s, "Contract note", 0.6, 5.9, 12.15, 0.8, HEX.grey);
  txt(s, "Contract note text", [
    { text: "/bulkUpload: ", options: { bold: true, color: HEX.teal } },
    { text: "SCIM bulk request, up to 50 operations per call; asynchronous (202 Accepted); least-privilege upload permission; one provisioning app per source." },
  ], { x: 0.9, y: 5.95, w: 11.6, h: 0.7, fontSize: 15, valign: "middle" });
  s.addNotes(
`[6:30–7:40]  Chapter 04 — provisioning services, how the data moves.

The shape is: authoritative source, a boundary transformation that's source-specific and replaceable, the governed identity model as the durable contract, one provisioning service, and the target directories. In the Microsoft implementation that's middleware calling Graph's /bulkUpload endpoint, and the Entra provisioning service writing to Entra ID or, through the provisioning agent, to on-premises AD.

Oracle HCM has no native Entra connector, so this API-driven path is Microsoft's own Oracle guidance — and it matches the solicitation's SCIM 2.0 requirement. If the source changes, only the boundary changes.

Every event gets five duties: validate and fail closed; sequence, because an out-of-order mover and leaver is a correctness bug; normalize to one SCIM payload; write provenance before the call returns; and reconcile — read the provisioning logs, retry transient failures, and give permanent ones an owner.`);
}

// ------------------------------------------------------------------ 8 Ch06
pres.addSection({ title: "Lifecycle and access" });
{
  const s = content("Joiner, mover, leaver: the hire causes the account", "Lifecycle and access");
  const rows = [
    ["Joiner", "Future-dated hire", "Account created before the start date; licenses and baseline access derived from attributes"],
    ["Mover", "Assignment change", "Attributes re-stamped; old access leaves as new arrives; review of what remains (PS-5)"],
    ["Leaver", "Effective-dated separation", "Block logical access immediately, then reconcile credentials, devices and access (PS-4)"],
    ["Rehire", "Matched to the prior record", "Prior identifier re-linked; no second identity (IA-4)"],
    ["Conversion", "Worker type changes", "Same identifier; access re-derived from the new worker type"],
  ];
  s.addTable([head(["HR event", "Recorded fact", "Identity actions derived from it"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : {} })))],
    tableOpts([1.8, 2.6, 7.75], { y: 1.55, h: 3.75, fontSize: 14 }));
  const cards = [
    ["Inbound provisioning creates and updates accounts", "and enables or disables them from HR status.", HEX.navy, HEX.navyTint],
    ["Lifecycle Workflows act on users who already exist", "— scheduled triggers on hire and leave dates, plus on-demand for emergency termination.", HEX.teal, HEX.tealTint],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Division ${i + 1}`, x, 5.5, 6.0, 1.2, c[3]);
    txt(s, `Division ${i + 1} text`, [
      { text: c[0] + " ", options: { bold: true, color: c[2] } },
      { text: c[1] },
    ], { x: x + 0.25, y: 5.58, w: 5.5, h: 1.05, fontSize: 15, valign: "middle" });
  });
  s.addNotes(
`[7:40–8:50]  Chapter 06 — joiner, mover, leaver.

The lifecycle is an event stream with five events — the three everyone names plus rehire and conversion, the two estates forget until they hurt. Each is an effective-dated HR record, and each maps to a fixed set of identity actions.

A joiner's account exists before the start date. A mover's attributes are re-stamped, so the old organization's access leaves as the new one's arrives, and what remains gets a review — that's PS-5. A leaver's logical access is blocked immediately. A rehire re-links the prior identifier instead of minting a second identity, and a conversion keeps the identifier and re-derives access.

The property that matters is the direction of causation: nobody remembers to disable a leaver — the separation record causes it. And the division of labor: inbound provisioning creates and updates accounts; Lifecycle Workflows act on users who already exist. A workflow never creates the account.`);
}

// ------------------------------------------------------------------ 9 Ch07
{
  const s = content("The leaver sequence: block first, reconcile to completion", "Lifecycle and access");
  s.addImage({ path: LEAVER_PNG, objectName: "Leaver sequence diagram", x: 0.6, y: 1.45, w: 5.6, h: 5.25,
    altText: "Leaver sequence: disable the account and revoke sessions first; then revoke PIV, retire devices and remove access in parallel; reconcile every result; dispose of the directory object last." });
  const pts = [
    ["Disable, then revoke sessions.", "Microsoft’s emergency-revocation order; it closes certificate sign-in now, not at the next CRL refresh."],
    ["Then revoke in parallel.", "PIV and derived credentials through the CMS; Intune retire or wipe; access packages, groups, licenses, privileged eligibility."],
    ["Reconcile every result.", "Custom task extensions are idempotent with bounded retry; failures escalate until revocation is confirmed."],
    ["Dispose last.", "Deleting the user leaves Intune SCEP certificates valid on the device."],
  ];
  pts.forEach((p, i) => {
    const y = 1.55 + i * 1.3;
    s.addShape(pres.shapes.OVAL, { objectName: `Leaver point ${i + 1} badge`, x: 6.6, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: i === 0 ? HEX.navy : i === 3 ? HEX.teal : HEX.slate }, line: { color: "FFFFFF" } });
    txt(s, `Leaver point ${i + 1} number`, String(i + 1), { x: 6.6, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, `Leaver point ${i + 1} text`, [
      { text: p[0], options: { bold: true, color: HEX.navy, breakLine: true } },
      { text: p[1], options: { fontSize: 14 } },
    ], { x: 7.3, y, w: 5.45, h: 1.2, fontSize: 16 });
  });
  s.addNotes(
`[8:50–10:00]  Chapter 07 — credentials and the leaver sequence. This is the operational-safety core.

Block logical access first. At the effective separation time, disable the account in Entra ID and AD, then revoke sessions and refresh tokens — that's Microsoft's documented emergency-revocation order, and it matters because Entra caches certificate revocation lists: revoking a PIV certificate closes certificate sign-in only eventually; disabling and revoking tokens closes it now.

Then, in parallel: revoke the PIV and derived credentials through the card management system — FIPS 201-3 sets an 18-hour clock for a card that can't be collected — retire or wipe devices through Intune, and remove access packages, groups, licenses and privileged eligibility. Lifecycle Workflows has no built-in task for PIV or devices, so those run as custom task extensions, idempotent with bounded retry, and every failure escalates until revocation is confirmed.

Disposal comes last, because deleting a user leaves Intune SCEP certificates valid on the device.`);
}

// ------------------------------------------------------------------ 10 Ch08
{
  const s = content("From attributes to access: every entitlement has a “because”", "Lifecycle and access");
  const chain = ["Worker record", "Stamped attributes", "Dynamic groups", "Entitlements"];
  chain.forEach((c, i) => {
    const x = 0.6 + i * 3.13;
    box(s, `Chain ${i + 1}`, x, 1.6, 2.75, 1.0, i === 0 ? HEX.navy : HEX.navyTint, HEX.navy);
    txt(s, `Chain ${i + 1} text`, c, { x: x + 0.1, y: 1.6, w: 2.55, h: 1.0, fontSize: 17, bold: true, color: i === 0 ? "FFFFFF" : HEX.navy, align: "center", valign: "middle" });
    if (i < 3) arrow(s, x + 2.75, 2.1, 0.4, 0);
  });
  box(s, "Rule example", 0.6, 2.95, 12.15, 0.85, HEX.grey);
  txt(s, "Rule example text", [
    { text: "Example rule:  ", options: { bold: true, color: HEX.teal, fontFace: "Calibri" } },
    { text: "(user.accountEnabled -eq true) -and (user.extensionAttribute10 -eq \"FIN-LED\") -and (user.extensionAttribute11 -eq \"EMP\")", options: { fontFace: "Consolas", fontSize: 14 } },
  ], { x: 0.9, y: 3.0, w: 11.6, h: 0.75, fontSize: 15, valign: "middle" });
  const cols = [
    ["What it gives you", HEX.teal, HEX.tealTint, [
      "Membership is computed: no group owner to lobby, no offboarding step to forget",
      "Access packages route approvals to the supervisor of record",
      "Reviews scoped to exceptions, not 400 rows approved in bulk"]],
    ["Where it stops", HEX.red, HEX.redTint, [
      "Privileged roles use assigned, role-assignable groups",
      "PIM for Groups doesn’t take dynamic groups",
      "Break-glass accounts depend on none of this"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `${c[0]} card`, x, 4.05, 6.0, 2.3, c[2]);
    txt(s, `${c[0]} heading`, c[0], { x: x + 0.3, y: 4.2, w: 5.4, h: 0.45, fontSize: 18, bold: true, color: c[1], fontFace: "Cambria" });
    txt(s, `${c[0]} list`, c[3].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < c[3].length - 1 } })),
      { x: x + 0.3, y: 4.72, w: 5.45, h: 1.55, fontSize: 15, paraSpaceAfter: 6 });
  });
  s.addNotes(
`[10:00–11:10]  Chapter 08 — from attributes to access.

The derivation chain: worker record, stamped attributes, dynamic groups, entitlements. Rules evaluate the coded access attributes from the canonical model — here, an organization code and a worker-type code — so nobody joins these groups and nobody forgets to leave one.

Every entitlement has a "because": access exists because an attribute satisfied a rule, the attribute exists because an HR record asserted it, and that record has an author, a date and a business act. That chain is queryable evidence.

It also has limits I'm deliberate about. In a dynamic group, whoever writes the attribute controls access — so the provisioning service is the only writer. And dynamic membership stops at privilege: privileged roles use assigned role-assignable groups, PIM for Groups doesn't accept dynamic groups, and break-glass accounts depend on none of this.`);
}

// ------------------------------------------------------------------ 11 Ch09
pres.addSection({ title: "Measurement and delivery" });
{
  const s = content("Drift, metrics and evidence", "Measurement and delivery");
  const tiles = [
    ["Separation-to-block", "HR effective time → disabled and sessions revoked"],
    ["Separation-to-revocation", "HR effective time → last confirmed revocation"],
    ["Transfer-to-review", "Transfer date → review of residual access"],
    ["Joiner readiness", "Account and baseline access on day one"],
    ["Correlation coverage", "Enabled accounts that resolve to a worker record"],
    ["Derivation purity", "Access granted by rule rather than by hand"],
  ];
  tiles.forEach((t, i) => {
    const x = 0.6 + (i % 2) * 3.1, y = 1.55 + Math.floor(i / 2) * 1.35;
    box(s, `Metric ${i + 1}`, x, y, 2.95, 1.2, HEX.tealTint);
    txt(s, `Metric ${i + 1} text`, [
      { text: t[0], options: { bold: true, color: HEX.teal, fontSize: 15, breakLine: true } },
      { text: t[1], options: { fontSize: 13 } },
    ], { x: x + 0.2, y: y + 0.1, w: 2.6, h: 1.0, valign: "middle" });
  });
  box(s, "Drift card", 0.6, 5.65, 6.05, 1.05, HEX.redTint);
  txt(s, "Drift text", [
    { text: "Drift classes: ", options: { bold: true, color: HEX.red } },
    { text: "missing identity · stale access · orphan account · attribute drift · unauthorized write · credential drift · schema drift" },
  ], { x: 0.85, y: 5.72, w: 5.6, h: 0.9, fontSize: 14, valign: "middle" });
  const rows = [
    ["AC-2", "Every account traces to a worker record and a rule"],
    ["AC-2(1)", "Lifecycle runs from effective-dated HR events"],
    ["PS-4", "Separation starts a timed, reconciled leaver sequence"],
    ["PS-5", "A transfer re-derives access and opens a review"],
    ["IA-4", "Layered keys survive rehire and conversion"],
    ["SI-12", "Lineage from the HR record to every consumer"],
  ];
  txt(s, "Controls heading", "Control support, NIST SP 800-53 Rev. 5", { x: 6.95, y: 1.55, w: 5.8, h: 0.45, fontSize: 18, bold: true, color: HEX.navy, fontFace: "Cambria" });
  s.addTable([head(["Control", "Architecture contribution"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([1.25, 4.55], { x: 6.95, y: 2.1, h: 3.4, fontSize: 13.5 }));
  txt(s, "Controls caveat", [
    { text: "Supports the controls; doesn’t close them. ", options: { bold: true, color: HEX.amber } },
    { text: "Agency policy, parameters, procedures and assessment still apply." },
  ], { x: 6.95, y: 5.7, w: 5.8, h: 0.9, fontSize: 14 });
  s.addNotes(
`[11:10–12:20]  Chapter 09 — drift, metrics and evidence.

An event-driven lifecycle is a measured one. Six metrics: separation-to-block and separation-to-revocation, transfer-to-review, joiner readiness, correlation coverage — the orphan population as a query instead of a hunt — and derivation purity, how much access still runs on hand assignment.

Drift is any difference between the HR record and the directory, and each class — missing identity, stale access, orphans, attribute drift, unauthorized writes, credential drift, schema drift — has a detection signal and a severity.

On the right, what the architecture contributes to AC-2, AC-2(1), PS-4, PS-5, IA-4 and SI-12. I'm careful with the claim: the architecture supplies mechanisms and evidence; it doesn't close the controls on its own. Agency policy, organization-defined parameters, procedures and assessment still apply.`);
}

// ------------------------------------------------------------------ 12 Ch10 + Ch11
{
  const s = content("Execution plan: gated phases to the Core HCM cutover", "Measurement and delivery");
  const ph = [
    ["0", "Program alignment", "Integration inventory signed"],
    ["1", "Authority and schema", "Authority map, identifier decision, data fixed at source"],
    ["2", "Build and test", "Joiner, mover, leaver end to end with evidence"],
    ["3", "Hybrid pilot", "Shadow mode; every difference explained"],
    ["4", "Lifecycle automation", "Leavers first; access derived by rule"],
    ["5", "Cloud-mastered cutover", "Per population, as Core HCM goes live"],
    ["6", "Sustained posture", "Metrics on the ConMon cadence"],
  ];
  const w = 1.6, gap = 0.155;
  link(s, 0.6 + w / 2, 1.95, 6 * (w + gap), 0);
  ph.forEach((p, i) => {
    const x = 0.6 + i * (w + gap);
    const c = i === 1 ? HEX.amber : i === 5 ? HEX.teal : HEX.navy;
    s.addShape(pres.shapes.OVAL, { objectName: `Phase ${p[0]} badge`, x: x + w / 2 - 0.32, y: 1.63, w: 0.64, h: 0.64, fill: { color: c }, line: { color: "FFFFFF", width: 2 } });
    txt(s, `Phase ${p[0]} number`, p[0], { x: x + w / 2 - 0.32, y: 1.63, w: 0.64, h: 0.64, fontSize: 20, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Cambria" });
    txt(s, `Phase ${p[0]} text`, [
      { text: p[1], options: { bold: true, color: c, fontSize: 14, breakLine: true } },
      { text: p[2], options: { fontSize: 13 } },
    ], { x, y: 2.45, w, h: 1.6, align: "center", paraSpaceAfter: 4 });
  });
  box(s, "Reference deployment", 0.6, 4.3, 12.15, 2.4, HEX.grey);
  txt(s, "Reference heading", "Reference deployment (illustrative): a Wave 2 agency", { x: 0.9, y: 4.45, w: 11.6, h: 0.45, fontSize: 18, bold: true, color: HEX.navy, fontFace: "Cambria" });
  const cols = [
    ["Starting estate", "~50,000 employees and several thousand contractors; GCC tenant; a bespoke HR-to-AD connector; two-thirds of users AD-mastered; no drift detection or provisioning evidence"],
    ["What the phases find", "Accounts with no employeeId, duplicate identities from conversions, managers who left years ago, and separated workers the manual process never reached"],
    ["What survives", "The schema, code lists, workflows, rules and evidence belong to the agency — the Core HCM cutover plugs a new source into the same model"],
  ];
  cols.forEach((c, i) => {
    const x = 0.9 + i * 3.95;
    txt(s, `Reference col ${i + 1}`, [
      { text: c[0], options: { bold: true, color: HEX.teal, breakLine: true } },
      { text: c[1], options: { fontSize: 13 } },
    ], { x, y: 5.0, w: 3.7, h: 1.6, fontSize: 15, paraSpaceAfter: 4 });
  });
  s.addNotes(
`[12:20–13:40]  Chapters 10 and 11 — the execution plan and an illustrative deployment.

Seven phases, each gate the next phase's precondition. Phase 0 executes the HR 2.0 memo's preparation actions. Phase 1 — in amber — is the data architect's phase: sign the authority map and schema, record the identifier decision, fix data at the source. Phase 2 proves joiner, mover, leaver in a test tenant with evidence. Phase 3 pilots in shadow mode. Phase 4 automates, leavers first. Phase 5, in teal, cuts populations over to cloud-mastered as the Core HCM interconnection goes live. Phase 6 is sustained measurement. The thresholds in the gates are proposed starting criteria that agency risk governance approves.

Chapter 11 runs that plan against an illustrative Wave 2 agency of about fifty thousand employees: a bespoke HR-to-AD connector, two-thirds of users still AD-mastered, no drift detection. The phases surface the usual findings. And what survives the engagement belongs to the agency: the schema, code lists, workflows, rules and evidence — so the Core HCM cutover is a new source contract on the same model.`);
}

// ------------------------------------------------------------------ 13 Close
{
  const s = content("How this maps to the role", "Measurement and delivery");
  const items = [
    ["Line-of-business knowledge", "Workforce digital identity, Federal HR 2.0, and SSA’s Wave 2 timeline", "Ch 00–02"],
    ["Programmatic data knowledge", "An authority map: one owner for every attribute, corrections upstream", "Ch 03"],
    ["Logical and physical modeling", "A canonical model and one crosswalk from Oracle HCM to SCIM, AD and Entra ID", "Ch 05"],
    ["Data in motion and quality", "Provenance per event, drift classes and six lifecycle metrics", "Ch 04, 09"],
  ];
  items.forEach((it, i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.55 + Math.floor(i / 2) * 1.8;
    box(s, `Fit ${i + 1}`, x, y, 6.0, 1.6, i % 3 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Fit ${i + 1} text`, [
      { text: it[0], options: { bold: true, color: i % 3 ? HEX.teal : HEX.navy, fontSize: 18, breakLine: true } },
      { text: it[1], options: { fontSize: 15, breakLine: true } },
      { text: it[2], options: { fontSize: 12, color: HEX.slate } },
    ], { x: x + 0.3, y: y + 0.15, w: 5.45, h: 1.35, paraSpaceAfter: 4 });
  });
  box(s, "Closing line", 0.6, 5.4, 12.15, 0.95, "FFFFFF", HEX.amber);
  txt(s, "Closing line text", [
    { text: "The full workbook: ", options: { bold: true, color: HEX.amber } },
    { text: "twelve chapters, published and downloadable as one Word document — happy to walk any chapter in depth." },
  ], { x: 0.9, y: 5.47, w: 11.6, h: 0.8, fontSize: 17, valign: "middle" });
  s.addNotes(
`[13:40–14:40]  To close, how this maps to what you asked me to cover.

Line-of-business knowledge: workforce digital identity, the Federal HR 2.0 program, and SSA's Wave 2 timeline — chapters 00 through 02. Programmatic data knowledge: the authority map — one owner for every attribute, and corrections that flow upstream — chapter 03. Logical and physical data modeling: the canonical workforce identity model and the single crosswalk from Oracle HCM through SCIM to AD and Entra ID — chapter 05. And data in motion and data quality: provenance on every event, drift classes and six lifecycle metrics — chapters 04 and 09.

The whole workbook is published and downloadable as one Word document, and I'm glad to go deeper on any chapter in the questions.

Thank you.

[Stop by 15:00. If running long, skip the rule example on slide 10 and the controls table on slide 11.]`);
}
(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT, n, "slides");
})();
