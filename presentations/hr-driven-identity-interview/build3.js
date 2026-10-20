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

// Thesis deck: Federal HR 2.0 is the opportunity to make HR authoritative for
// Entra ID, AD and ICAM, using OPM standard attributes.

const cards3 = (s, y, h, items) => items.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `${c.t} card`, x, y, 3.95, h, c.tint);
  txt(s, `${c.t} text`, [
    { text: c.t, options: { bold: true, color: c.c, fontSize: 18, fontFace: "Cambria", breakLine: true } },
    ...c.items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15.5, breakLine: k < c.items.length - 1 } })),
  ], { x: x + 0.25, y: y + 0.18, w: 3.5, h: h - 0.3, paraSpaceAfter: 5 });
});

// ------------------------------------------------------------------ 1 Title
pres.addSection({ title: "Thesis" });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: "Thesis" });
  n++;
  s.addText("Make HR Authoritative for Identity", { placeholder: "title" });
  s.addText("Federal HR 2.0 is the opportunity to drive Entra ID, Active Directory and ICAM from OPM standard attributes", { placeholder: "body" });
  txt(s, "Presenter", [
    { text: "Mike Stratton", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Digital Identity line of business  ·  GS-14 Enterprise Data Architect  ·  Data Strategy and Enablement", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 11.7, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:40]  Good morning, and thank you.

I chose the Digital Identity line of business, and I want to make one proposal.

SSA is not choosing whether to implement HRIT. Federal HR 2.0 is happening to SSA — the Oracle Core HCM platform, Wave 2, fiscal 2027. My proposal is that we treat it as the opportunity it is: the moment to make HR, through OPM's standard personnel data, the authoritative driver for Entra ID, Active Directory and the rest of ICAM.

I'll cover why, the window, the data — the standard attributes, the logical and physical model — what it does for ICAM and privacy, and the governance I'd bring to deliver it.`);
}

// ------------------------------------------------------------------ 2 Thesis
{
  const s = content("We are not implementing HRIT — we are using it", "Thesis");
  cards3(s, 1.55, 3.3, [
    { t: "HR 2.0 changes anyway", c: HEX.navy, tint: HEX.navyTint, items: [
      "HR interconnections and feeds are rebuilt",
      "HR data is cleaned for migration",
      "EHRI- and eOPF-shaped integrations retire",
      "Today’s HR-to-AD connector must be re-pointed" ] },
    { t: "OPM leaves identity to us", c: HEX.teal, tint: HEX.tealTint, items: [
      "OPM fixes the HR side: platform, waves, interfaces",
      "The agency’s directory and ICAM design is SSA’s decision",
      "The solicitation requires SCIM 2.0 provisioning — the protocol Entra ID consumes" ] },
    { t: "The proposal", c: HEX.amber, tint: HEX.amberTint, items: [
      "HR is authoritative for who works here, in what role, for whom",
      "Expressed in OPM standard attributes",
      "Driving Entra ID, AD and ICAM by rule, with evidence" ] },
  ]);
  box(s, "Choice", 0.6, 5.1, 12.15, 1.35, "FFFFFF", HEX.amber);
  txt(s, "Choice text", [
    { text: "The choice at cutover: ", options: { bold: true, color: HEX.amber } },
    { text: "rebuild the old connector like-for-like against a new source — or rebuild it right, once, while everything around it is being rebuilt anyway." },
  ], { x: 0.95, y: 5.2, w: 11.5, h: 1.15, fontSize: 18, valign: "middle" });
  s.addNotes(
`[0:40–2:00]  The thesis in one slide.

On the left, what Federal HR 2.0 changes regardless of anything we decide: HR interconnections and feeds are rebuilt, HR data gets cleaned for migration, the EHRI- and eOPF-shaped integrations retire, and whatever connector feeds AD from HR today has to be re-pointed at the new platform.

In the middle, what OPM leaves to us. OPM fixes the HR side — the platform, the waves, the interfaces. How SSA's directories and ICAM consume that data is SSA's decision. And the solicitation requires SCIM 2.0 provisioning, which is exactly what Entra ID's inbound provisioning consumes.

On the right, the proposal: HR is authoritative for who works here, in what role, and for whom — expressed in OPM's standard attributes — and Entra ID, AD and ICAM follow by rule, with evidence.

So the real choice at cutover is: re-point the old connector like-for-like, or rebuild it right, once, while everything around it is being rebuilt anyway. The marginal cost is lowest at exactly that moment.`);
}

// ------------------------------------------------------------------ 3 Problem
{
  const s = content("Why HR must be authoritative: identity learns too late", "Thesis");
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
    { text: "A credential proves who signed a claim — not whether it is still true.", options: { bold: true, color: HEX.navy, fontSize: 20, breakLine: true } },
    { text: "Employment, position and supervisor are facts only the HR system of record originates. Cleanup, directory mastery and access reviews can’t substitute for making it the source.", options: { fontSize: 16 } },
  ], { x: 0.95, y: 4.95, w: 11.5, h: 1.55, valign: "middle", paraSpaceAfter: 6 });
  s.addNotes(
`[2:00–3:00]  Why HR has to be the authority.

A token proves who signed a claim; it can't tell you whether the person still works here, still holds the position, still reports to the approver. Those facts originate in one place — the HR system of record.

Without a channel from it, this is what happens. HR knows two weeks early. On day zero everything is live. A ticket disables the directory account on day three; nine application accounts stay on. A review finds two. Six months later a pen test signs in with one of the rest.

That isn't a diligence failure; it's the design working as built. Cleanup produces a snapshot, making the directory the master just turns tickets into the source of truth, and reviews can't see transitions. The fix is to make HR the source — and HR 2.0 is when that's cheapest to do.`);
}

// ------------------------------------------------------------------ 4 Window
{
  const s = content("The window closes at SSA’s interconnection go-live", "Thesis");
  const ms = [
    ["Dec 10, 2025", "OMB/OPM memo", "One government-wide Core HCM platform"],
    ["Jun 11, 2026", "Core HCM award", "Oracle Fusion Cloud HCM (SaaS)"],
    ["Jan–Mar 2027", "First go-lives", "Wave 1 agencies"],
    ["FY 2027", "Wave 2, including SSA", "~8-month onboarding; interconnections live ~month 5"],
    ["FY 2028", "One system", "EHRI and eOPF decommissioned"],
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
  const two = [
    ["Inside the window", "Attribute definitions, data cleanup, interconnection agreements and the new feed are all being decided. Identity’s requirements can be written into them.", HEX.teal, HEX.tealTint],
    ["After it closes", "The old connector is re-pointed under deadline pressure, and ticket-driven identity is locked in until the next platform change.", HEX.red, HEX.redTint],
  ];
  two.forEach((t, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Window ${i + 1}`, x, 4.85, 6.0, 1.85, t[3]);
    txt(s, `Window ${i + 1} text`, [
      { text: t[0], options: { bold: true, color: t[2], fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: t[1], options: { fontSize: 15 } },
    ], { x: x + 0.3, y: 5.0, w: 5.45, h: 1.6, paraSpaceAfter: 6 });
  });
  s.addNotes(
`[3:00–4:10]  The window.

The December 10, 2025 OMB/OPM memo directs one government-wide Core HCM platform. Oracle Fusion Cloud HCM was awarded June 11, 2026. First go-lives are January to March 2027. SSA is in Wave 2, in fiscal 2027: about eight months of onboarding per agency, with interconnections live around month five. By fiscal 2028 EHRI and eOPF are decommissioned.

I'd describe that not as a deadline but as a window. Inside it, the attribute definitions, the data cleanup, the interconnection agreements and the new feed are all being decided — and identity's requirements can be written into them. After it closes, the old connector gets re-pointed under deadline pressure, and ticket-driven identity is locked in until the next platform change.

(Verify SSA's current Wave 2 onboarding dates before presenting.)`);
}

// ------------------------------------------------------------------ 5 Standard attributes
pres.addSection({ title: "The data" });
{
  const s = content("OPM standard attributes are the contract, not vendor fields", "The data");
  const rows = [
    ["Agency / subelement", "Legal employer and component scope"],
    ["Personnel office identifier", "Servicing HR office; delegated administration"],
    ["Duty station", "Location of record; location-based policy scoping"],
    ["Occupational series, pay plan, grade", "Position category; role-eligible access packages"],
    ["Supervisory status", "Approver and reviewer eligibility; manager-chain integrity"],
    ["Tenure, appointment type, work schedule", "Worker type and lifecycle profile"],
    ["Nature of action + effective date", "Lifecycle trigger (next slide)"],
  ];
  s.addTable([head(["OPM standard data element", "Identity use"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([3.9, 4.6], { y: 1.55, h: 4.65, fontSize: 14.5 }));
  box(s, "Why card", 9.35, 1.55, 3.4, 4.65, HEX.tealTint);
  txt(s, "Why text", [
    { text: "Why standards", options: { bold: true, color: HEX.teal, fontSize: 20, fontFace: "Cambria", breakLine: true } },
    { text: "The same elements, codes and meanings at every agency on the platform.", options: { breakLine: true } },
    { text: "One crosswalk from the standard to Entra ID and AD serves every SSA population — and survives the next vendor.", options: { breakLine: true } },
    { text: "Vendor field names are the implementation, not the contract.", options: { bold: true, color: HEX.navy } },
  ], { x: 9.6, y: 1.75, w: 2.95, h: 4.3, fontSize: 15, paraSpaceAfter: 10 });
  txt(s, "Source note", "Elements per OPM’s Guide to Data Standards; confirm against the current edition and how Core HCM exposes them.",
    { x: 0.6, y: 6.35, w: 12.1, h: 0.35, fontSize: 11, color: HEX.slate, italic: true });
  s.addNotes(
`[4:10–5:30]  This is the heart of the proposal, and it's the programmatic data knowledge.

OPM already defines the personnel data every agency records — the Guide to Data Standards. Agency and subelement tell us the legal employer and component. The personnel office identifier tells us which HR office services the person, which is useful for delegated administration. Duty station is the location of record. Occupational series, pay plan and grade give us a position category for role-eligible access. Supervisory status tells us who can approve and review. Tenure, appointment type and work schedule drive the worker type and its lifecycle profile. And the nature-of-action code plus its effective date tells us what just happened — next slide.

Why build on the standard rather than Oracle's field names? Because these elements mean the same thing at every agency on the platform. One crosswalk from the standard to Entra ID and AD serves every SSA population and survives the next vendor change. Vendor field names are the implementation; the standard is the contract.

(Confirm element names against OPM's current Guide to Data Standards, and how Core HCM exposes them.)`);
}

// ------------------------------------------------------------------ 6 NOA → lifecycle
{
  const s = content("Personnel actions drive the lifecycle — by code, not by ticket", "The data");
  const rows = [
    ["Accessions", "100 series", "Joiner", "Account before day one; baseline access derived"],
    ["Position changes", "700 series", "Mover", "Re-derive access; review what remains"],
    ["Conversions", "500 series", "Conversion", "Same person and key; access re-derived"],
    ["Nonpay / nonduty status", "400 series", "Not a leaver", "Account kept; restricted by policy"],
    ["Return to duty", "200 series", "Reinstate", "Restrictions lifted"],
    ["Separations", "300 series", "Leaver", "Block first, then revoke and reconcile"],
  ];
  s.addTable([head(["Action family", "NOA codes", "Lifecycle event", "Identity action"]),
    ...rows.map((r, i) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy }
      : j === 2 ? { bold: true, color: i === 3 ? HEX.amber : i === 5 ? HEX.red : HEX.teal } : {} })))],
    tableOpts([3.0, 1.75, 2.1, 5.3], { y: 1.55, h: 3.9, fontSize: 14.5 }));
  const rules = [
    ["Leave is not a leaver.", "Furlough, LWOP and suspension keep the person; policy restricts the account."],
    ["Precedence is a rule.", "A separation wins; a conversion is applied before a mover."],
    ["Rescinded offers clean up", "the account created before day one."],
  ];
  rules.forEach((r, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `NOA rule ${i + 1}`, x, 5.65, 3.95, 1.05, HEX.grey);
    txt(s, `NOA rule ${i + 1} text`, [
      { text: r[0] + " ", options: { bold: true, color: HEX.navy } },
      { text: r[1] },
    ], { x: x + 0.2, y: 5.7, w: 3.6, h: 0.95, fontSize: 14, valign: "middle" });
  });
  s.addNotes(
`[5:30–6:40]  Personnel actions drive the lifecycle.

Every personnel action carries a nature-of-action code, and the code families map cleanly to identity events. Accessions — the 100 series — are joiners. Position changes in the 700 series are movers. The 500 series are conversions. The 300 series are separations — leavers.

Two families matter more than people expect. The 400 series — nonpay and nonduty status: furlough, leave without pay, suspension — is not a leaver. The person is still employed; policy restricts the account. And the 200 series, return to duty, lifts those restrictions. Getting this wrong either locks out people on leave or leaves access open for people who've separated.

The codes also let us write two rules the corpus I built on left open: precedence — a separation wins, and a conversion is applied before a mover — and rescinded offers, which clean up an account created before day one.

(Confirm code families against OPM's Guide to Processing Personnel Actions.)`);
}

// ------------------------------------------------------------------ 7 Crosswalk
{
  const s = content("Logical to physical: standard element → model → directories", "The data");
  const rows = [
    ["Person (enterprise key)", "personKey", "employeeId", "employeeID"],
    ["Agency / subelement", "legalEmployer, orgCode", "companyName; extensionAttribute10", "company; extensionAttribute10"],
    ["Duty station", "locationCode, country", "officeLocation; usageLocation", "physicalDeliveryOfficeName; co"],
    ["Occupational series + pay plan", "positionCategory", "extensionAttribute12", "extensionAttribute12"],
    ["Supervisory status; supervisor", "isSupervisor; manager", "manager (+ supervisor group)", "manager (DN)"],
    ["Nature of action + date", "lifecycle event", "hire and leave dates; accountEnabled", "extensionAttribute2/3; enabled"],
  ];
  s.addTable([head(["OPM standard element", "Canonical model", "Entra ID", "Active Directory"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : { fontFace: "Consolas", fontSize: 12 } })))],
    tableOpts([3.0, 2.55, 3.55, 3.05], { y: 1.55, h: 3.7, fontSize: 13 }));
  const rules = [
    ["Native attributes first", "Extensions only where a rule can’t read a native property."],
    ["Codes, not display strings", "Access rules read codes that change only when the fact does."],
    ["One crosswalk, governed", "Versioned, change-controlled, and the only place mappings live."],
  ];
  rules.forEach((r, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Model rule ${i + 1}`, x, 5.75, 3.95, 1.0, HEX.tealTint);
    txt(s, `Model rule ${i + 1} text`, [
      { text: r[0], options: { bold: true, color: HEX.teal, breakLine: true } },
      { text: r[1], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: 5.8, w: 3.6, h: 0.9, fontSize: 15 });
  });
  s.addNotes(
`[6:40–7:50]  Logical and physical modeling.

The logical model sits in the middle: a person with an enterprise key the agency controls, their affiliations and assignments, and the lifecycle events that change them. On the left, the OPM standard element that feeds each field; on the right, where it lands physically in Entra ID and in Active Directory.

Agency and subelement become the legal employer and an organization code. Duty station becomes the location fields. Series and pay plan become a position category in an extension attribute both directories carry. Supervisory status and the supervisor become the manager relationship and a supervisor group for approvals. And the nature of action with its effective date becomes the hire and leave dates and the enabled flag that drive Lifecycle Workflows.

Three physical rules: native attributes first; codes, never display strings, in anything that grants access; and one crosswalk, version-controlled, as the only place mappings live. The extension-attribute choices are proposals to confirm against SSA's tenant.`);
}

// ------------------------------------------------------------------ 8 AD + Entra
pres.addSection({ title: "Identity and ICAM" });
{
  const s = content("One source, two directories: HR owns identity throughout", "Identity and ICAM");
  const flow = [
    ["Core HCM", "OPM standard attributes, personnel actions", HEX.navy, HEX.navy, "FFFFFF"],
    ["Governed identity model", "Validated, sequenced, provenance per event", HEX.teal, HEX.teal, "FFFFFF"],
  ];
  flow.forEach((f, i) => {
    const x = 0.6 + i * 3.0;
    box(s, `Flow ${i + 1}`, x, 2.35, 2.6, 1.5, f[3], f[2]);
    txt(s, `Flow ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: f[4], fontSize: 17, breakLine: true } },
      { text: f[1], options: { fontSize: 13, color: f[4] } },
    ], { x: x + 0.15, y: 2.45, w: 2.3, h: 1.3, align: "center", valign: "middle" });
  });
  arrow(s, 3.2, 3.1, 0.4, 0);
  box(s, "AD target", 7.2, 1.55, 2.6, 1.3, HEX.navyTint, HEX.navy);
  txt(s, "AD target text", [{ text: "Active Directory", options: { bold: true, color: HEX.navy, breakLine: true } }, { text: "Hybrid users, via the provisioning agent", options: { fontSize: 13 } }],
    { x: 7.3, y: 1.6, w: 2.4, h: 1.2, fontSize: 16, align: "center", valign: "middle" });
  box(s, "Entra target", 7.2, 3.35, 2.6, 1.3, HEX.navyTint, HEX.navy);
  txt(s, "Entra target text", [{ text: "Entra ID", options: { bold: true, color: HEX.navy, breakLine: true } }, { text: "Cloud-mastered users, directly", options: { fontSize: 13 } }],
    { x: 7.3, y: 3.4, w: 2.4, h: 1.2, fontSize: 16, align: "center", valign: "middle" });
  s.addShape(pres.shapes.LINE, { x: 6.2, y: 2.2, w: 1.0, h: 0.8, flipV: true, line: { color: HEX.slate, width: 1.75, endArrowType: "triangle" } });
  arrow(s, 6.2, 3.2, 1.0, 0.8);
  box(s, "ICAM consumers", 10.2, 1.55, 2.55, 3.1, HEX.amberTint);
  txt(s, "ICAM consumers text", [
    { text: "ICAM consumers", options: { bold: true, color: HEX.amber, breakLine: true } },
    ...["PIV card management", "Intune and certificates", "Conditional Access", "Access packages and reviews", "SIEM and audit joins"].map((t, k, a) => ({ text: t, options: { bullet: true, fontSize: 13.5, breakLine: k < a.length - 1 } })),
  ], { x: 10.4, y: 1.7, w: 2.25, h: 2.85, fontSize: 16, paraSpaceAfter: 3 });
  arrow(s, 9.8, 3.1, 0.4, 0);
  s.addTable([head(["", "Directory migration (AD → Entra ID)", "HR-driven identity"]),
    [{ text: "What moves", options: { bold: true, color: HEX.navy } }, { text: "The directory" }, { text: "Nothing — HR is upstream" }],
    [{ text: "Identity owner", options: { bold: true, color: HEX.navy } }, { text: "AD before, Entra ID after" }, { text: "HR system of record, before and after" }]],
    tableOpts([2.3, 4.9, 4.95], { y: 5.05, h: 1.6, fontSize: 14 }));
  s.addNotes(
`[7:50–9:00]  How this covers AD and Entra ID at the same time.

Core HCM publishes standard attributes and personnel actions. A governed identity model validates and sequences them and writes provenance for each event. Provisioning lands hybrid users in Active Directory through the provisioning agent, and cloud-mastered users directly in Entra ID. Then the ICAM consumers — PIV card management, Intune and certificates, Conditional Access, access packages and reviews, and the SIEM — all read the same governed attributes.

The table is the point. SSA will move its directory from AD toward Entra ID over several years; that's a separate program. But the identity owner doesn't move: HR is the owner before and after. Doing HR-driven identity now means every population cuts over from AD to Entra ID already sourced correctly, instead of migrating today's drift.`);
}

// ------------------------------------------------------------------ 9 ICAM
{
  const s = content("ICAM: attributes drive credentials, assurance and access", "Identity and ICAM");
  cards3(s, 1.55, 3.6, [
    { t: "Credentials", c: HEX.navy, tint: HEX.navyTint, items: [
      "Joiner schedules PIV enrollment",
      "Leaver: block sign-in and sessions first, then revoke PIV, derived credentials and devices in parallel",
      "Every revocation reconciled to completion" ] },
    { t: "Assurance", c: HEX.teal, tint: HEX.tealTint, items: [
      "Record proofing (IAL) and authenticator assurance (AAL) per person",
      "Missing proofing evidence is itself a finding",
      "Phishing-resistant MFA per OMB M‑22‑09" ] },
    { t: "Access", c: HEX.amber, tint: HEX.amberTint, items: [
      "Baseline access derived by rule from standard attributes",
      "Privileged eligibility by position, through PIM — never standing",
      "Activity from a separated person is an alert" ] },
  ]);
  box(s, "ICAM takeaway", 0.6, 5.45, 12.15, 0.9, HEX.grey);
  txt(s, "ICAM takeaway text", [
    { text: "Every entitlement has a “because”: ", options: { bold: true, color: HEX.navy } },
    { text: "a rule, an attribute, and the personnel action that set it." },
  ], { x: 0.95, y: 5.5, w: 11.5, h: 0.8, fontSize: 17, valign: "middle" });
  s.addNotes(
`[9:00–10:10]  ICAM — beyond accounts.

Credentials: the joiner event schedules PIV enrollment. The leaver event blocks sign-in and revokes sessions first — Microsoft's documented order, and the step that closes certificate sign-in immediately rather than at the next revocation-list refresh — then revokes PIV, derived credentials and device certificates in parallel, reconciled to completion.

Assurance: record each person's proofing level and authenticator assurance as governed attributes, treat missing proofing evidence as a finding, and enforce phishing-resistant MFA under M-22-09.

Access: baseline access derived by rule from the standard attributes; privileged eligibility by position, through PIM, never standing; and any activity from a separated person is an alert.

The result: every entitlement has a "because" — a rule, an attribute, and the personnel action that set it.`);
}

// ------------------------------------------------------------------ 10 Privacy
{
  const s = content("Privacy by design: HR data in identity is a disclosure", "Identity and ICAM");
  const pts = [
    ["Routine use", "Confirm the routine-use basis under the governing SORNs (e.g., OPM/GOVT-1) before any HR attribute flows to a directory."],
    ["Minimize", "Send only the attributes an identity decision reads. Codes, not narrative; no SSN as a join key."],
    ["PIA", "Update the privacy impact assessment for the new data flow and its consumers."],
    ["Protect the flow", "Encrypt every leg; logs carry the person key and a payload hash, not the record."],
  ];
  pts.forEach((p, i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.55 + Math.floor(i / 2) * 2.0;
    box(s, `Privacy ${i + 1}`, x, y, 6.0, 1.8, i % 3 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Privacy ${i + 1} text`, [
      { text: p[0], options: { bold: true, color: i % 3 ? HEX.teal : HEX.navy, fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: p[1], options: { fontSize: 15 } },
    ], { x: x + 0.3, y: y + 0.18, w: 5.45, h: 1.5, paraSpaceAfter: 6 });
  });
  box(s, "Privacy takeaway", 0.6, 5.65, 12.15, 1.05, "FFFFFF", HEX.amber);
  txt(s, "Privacy takeaway text", [
    { text: "HR remains the system of records. ", options: { bold: true, color: HEX.amber } },
    { text: "Identity is a governed consumer that never writes an HR-mastered fact back." },
  ], { x: 0.95, y: 5.72, w: 11.5, h: 0.9, fontSize: 17, valign: "middle" });
  s.addNotes(
`[10:10–11:10]  Privacy — which is where a data architect earns trust with HR.

Moving HR attributes into a directory is a disclosure of personnel records. So: confirm the routine-use basis under the governing system-of-records notices — OPM/GOVT-1 for general personnel records, plus SSA's own — before anything flows. Minimize: send only attributes an identity decision actually reads, as codes rather than narrative, and never use the SSN as a join key. Update the privacy impact assessment for the new flow and its consumers. And protect the flow: encrypt every leg, and keep logs to the person key and a payload hash rather than the record itself.

The principle underneath: HR remains the system of records; identity is a governed consumer that never writes an HR-mastered fact back.

(Confirm the applicable SORNs and routine uses with SSA's privacy office.)`);
}

// ------------------------------------------------------------------ 11 Governance
pres.addSection({ title: "Delivery" });
{
  const s = content("The governance I’d bring to deliver it safely", "Delivery");
  const items = [
    ["Authority map and identifier decision", "One owner per attribute; an enterprise person key SSA controls"],
    ["Security assessment", "Data flow, service identities without secrets, least privilege"],
    ["Acceptance gate", "Business-language test cases; signed validation before cutover"],
    ["Cutover and legacy retirement", "Prove the new path is the sole writer; then retire the old connector"],
    ["Lifecycle rules", "Scope filters, leave vs leaver, precedence, rescinded offers"],
    ["Quarantine and reconciliation", "Failures never auto-resolve; every exception has an owner"],
    ["Drift and metrics", "Separation-to-block, correlation coverage, derivation purity"],
    ["Change control", "Crosswalk and code lists versioned; shadow-tested before they act"],
  ];
  items.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.07, y = 1.55 + row * 2.35;
    box(s, `Gov ${i + 1}`, x, y, 2.92, 2.15, row ? HEX.tealTint : HEX.navyTint);
    txt(s, `Gov ${i + 1} text`, [
      { text: it[0], options: { bold: true, color: row ? HEX.teal : HEX.navy, fontSize: 16, breakLine: true } },
      { text: it[1], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: y + 0.18, w: 2.55, h: 1.85, paraSpaceAfter: 6 });
  });
  txt(s, "Gov note", "Control support for AC-2, PS-4, PS-5, IA-4 and SI-12 — evidence produced by operation, not assembled for the audit.",
    { x: 0.6, y: 6.35, w: 12.1, h: 0.35, fontSize: 13, color: HEX.slate, italic: true });
  s.addNotes(
`[11:10–12:30]  The governance I'd bring to deliver it safely.

The data foundation first: an authority map with one owner per attribute, and an identifier decision — an enterprise person key SSA controls, so the platform change doesn't break correlation. A security assessment of the data flow: service identities without secrets, least privilege. An acceptance gate: business-language test cases and a signed validation before cutover. Cutover that proves the new path is the sole writer before the old connector is retired.

Then the operating rules: scope filters, leave versus leaver, precedence and rescinded offers; a quarantine where failures never auto-resolve and every exception has an owner; drift detection and metrics — separation-to-block, correlation coverage, how much access is derived by rule; and change control, so the crosswalk and code lists are versioned and shadow-tested before they act.

Together that produces evidence for AC-2, PS-4, PS-5, IA-4 and SI-12 as a byproduct of operating — supporting those controls, not claiming to close them on its own.`);
}

// ------------------------------------------------------------------ 12 Roadmap + ask
{
  const s = content("Roadmap and the ask", "Delivery");
  const ph = [
    ["Now", "Align with HR 2.0", "Identity named as an interconnection consumer"],
    ["Pre-onboarding", "Standards and authority", "Crosswalk, authority map, identifier decision, privacy basis"],
    ["Onboarding", "Build and prove", "Joiner, mover, leaver end to end; shadow mode"],
    ["Interconnection live", "Cut over", "HR-driven for each population; old connector retired"],
    ["After", "Sustain", "Metrics and drift on the ConMon cadence"],
  ];
  link(s, 1.85, 2.0, 9.6, 0);
  ph.forEach((p, i) => {
    const cx = 1.85 + i * 2.4;
    const c = i === 1 ? HEX.amber : i === 3 ? HEX.teal : HEX.navy;
    s.addShape(pres.shapes.OVAL, { objectName: `Roadmap dot ${i + 1}`, x: cx - 0.22, y: 1.78, w: 0.44, h: 0.44, fill: { color: c }, line: { color: "FFFFFF", width: 2 } });
    txt(s, `Roadmap when ${i + 1}`, p[0], { x: cx - 1.1, y: 1.3, w: 2.2, h: 0.4, fontSize: 14, bold: true, color: HEX.slate, align: "center" });
    txt(s, `Roadmap text ${i + 1}`, [
      { text: p[1], options: { bold: true, color: c, fontSize: 16, breakLine: true } },
      { text: p[2], options: { fontSize: 13.5 } },
    ], { x: cx - 1.08, y: 2.4, w: 2.16, h: 1.55, align: "center", paraSpaceAfter: 3 });
  });
  box(s, "Ask", 0.6, 4.25, 12.15, 1.4, HEX.amberTint);
  txt(s, "Ask text", [
    { text: "The ask: ", options: { bold: true, color: HEX.amber, fontSize: 20 } },
    { text: "decide now that HR, through OPM standard attributes, is the authoritative source for Entra ID, AD and ICAM — and write identity’s requirements into SSA’s HR 2.0 onboarding before the interconnection is built.", options: { fontSize: 17 } },
  ], { x: 0.95, y: 4.35, w: 11.5, h: 1.2, valign: "middle" });
  const fit = [
    ["Line of business", "Digital identity and SSA’s HR 2.0 timeline"],
    ["Programmatic data", "OPM standard elements and personnel actions"],
    ["Logical and physical modeling", "Canonical model and the governed crosswalk"],
  ];
  fit.forEach((f, i) => {
    const x = 0.6 + i * 4.1;
    txt(s, `Fit ${i + 1}`, [
      { text: f[0], options: { bold: true, color: HEX.teal, breakLine: true } },
      { text: f[1], options: { fontSize: 13.5 } },
    ], { x, y: 5.85, w: 3.95, h: 0.85, fontSize: 15 });
  });
  s.addNotes(
`[12:30–14:15]  The roadmap and the ask.

Now: align with SSA's HR 2.0 team so identity is named as a consumer of the new interconnection. Before onboarding: the standards crosswalk, the authority map, the identifier decision and the privacy basis — the data architecture work. During onboarding: build and prove joiner, mover and leaver end to end, in shadow mode first. At interconnection go-live: cut each population over to HR-driven identity and retire the old connector. After: sustain it with metrics and drift on the continuous-monitoring cadence.

So the ask is simple: decide now that HR, through OPM standard attributes, is the authoritative source for Entra ID, AD and ICAM — and write identity's requirements into SSA's HR 2.0 onboarding before the interconnection is built.

And that's how this maps to what you asked me to cover: the digital identity line of business and SSA's timeline; programmatic data knowledge in OPM's standard elements and personnel actions; and logical and physical modeling in the canonical model and the governed crosswalk.

Thank you — I look forward to your questions.

[Stop by 15:00. If long, shorten slide 9 to the takeaway line.]`);
}
(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT, n, "slides");
})();
