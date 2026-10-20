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
  ink: "334155", tealTint: "DCEFEC", navyTint: "E4EAF4", amberTint: "FBEEDC", redTint: "FBE4E4", line: "CBD5E1", grey: "E9EEF4" };
const path = require("path");
const ASSET = (f) => path.join(__dirname, f);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Mike Stratton";
pres.title = "HR-Driven Identity";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Title",
  background: { path: ASSET("bg_title.png") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.9, w: 6.6, h: 1.8, fontFace: "Cambria",
      fontSize: 44, bold: true, color: C.text1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.85, w: 6.4, h: 1.3, fontSize: 22,
      color: C.accent2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "Content",
  background: { path: ASSET("bg_content.png") },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontFace: "Cambria",
      fontSize: 30, bold: true, color: C.text1, valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "HR-Driven Identity  ·  Mike Stratton  ·  Any Agency edition", options: { x: 0.6, y: 7.0, w: 8, h: 0.3,
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
  { objectName: name, x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line || fill, width: 1 },
    shadow: { type: "outer", color: "64748B", opacity: 0.22, blur: 6, offset: 2, angle: 90 } });
const icon = (s, name, x, y, d, color) => {
  s.addShape(pres.shapes.OVAL, { objectName: `Icon ${name}`, x, y, w: d, h: d, fill: { color }, line: { color } });
  s.addImage({ path: ASSET(`icons/${name}.png`), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, altText: "" });
};
const txt = (s, name, text, o) => s.addText(text, Object.assign({ objectName: name, isTextBox: true, margin: 0,
  color: C.text2, fontSize: 14, valign: "top" }, o));
const arrow = (s, x, y, w, h, color) => s.addShape(pres.shapes.LINE,
  { x, y, w, h, line: { color: color || HEX.slate, width: 1.75, endArrowType: "triangle" } });
const link = (s, x, y, w, h) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: HEX.slate, width: 1.5 } });
const tableOpts = (colW, extra) => Object.assign({ x: 0.6, colW, fontFace: "Calibri", fontSize: 13, color: HEX.ink,
  border: { type: "solid", color: HEX.line, pt: 0.75 }, fill: { color: "FFFFFF" }, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1] }, extra);
const head = (cells) => cells.map((t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.navy } } }));

// Thesis deck: Federal HR 2.0 is the opportunity to make HR authoritative for
// Entra ID, AD and ICAM, using OPM standard attributes.

const cards3 = (s, y, h, items) => items.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `${c.t} card`, x, y, 3.95, h, c.tint);
  icon(s, c.icon, x + 0.25, y + 0.22, 0.6, c.c);
  txt(s, `${c.t} heading`, c.t, { x: x + 1.0, y: y + 0.22, w: 2.8, h: 0.6, bold: true, color: c.c, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, `${c.t} text`, c.items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < c.items.length - 1 } })),
    { x: x + 0.25, y: y + 1.0, w: 3.5, h: h - 1.1, fontSize: 15.5, paraSpaceAfter: 5 });
});

// ------------------------------------------------------------------ 1 Title
pres.addSection({ title: "Thesis" });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: "Thesis" });
  n++;
  s.addText("HR-Driven Identity Modernization", { placeholder: "title" });
  s.addText("An Enterprise Data Architecture Case Study", { placeholder: "body" });
  txt(s, "Thesis line", "Using Federal HR 2.0 and the Entra ID migration to start HR-driven Entra ID, Active Directory and ICAM on OPM standard attributes",
    { x: 0.8, y: 4.45, w: 6.4, h: 0.9, fontSize: 16, color: HEX.ink });
  txt(s, "Presenter", [
    { text: "Mike Stratton", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Enterprise data architecture  ·  Digital identity modernization", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 11.7, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:55]  Good morning, and thank you.

I want to make one proposal.

In many agencies today there is no HR-driven identity. Accounts in Active Directory and Entra ID, and the access and credentials that hang off them, come from tickets and manual process.

Two changes are coming regardless: Federal HR 2.0 moves each agency's HR onto Oracle Core HCM in waves through 2027, and agency identity is moving from Active Directory toward Entra ID. My proposal is to use the two together to start HR-driven identity — HR, through OPM's standard personnel data, as the source of authority for Entra ID, Active Directory and the rest of ICAM. That's Microsoft's own term: HR-driven provisioning.

Workbook: HR-Driven Identity, Chapter 00 — Overview and Applicability: The proposal; Why now; Why together.`);
}

// ------------------------------------------------------------------ 2 Thesis
{
  const s = content("HRIT is coming — build identity into it", "Thesis");
  cards3(s, 1.55, 3.35, [
    { t: "Two migrations, regardless", icon: "FaArrowsRotate", c: HEX.navy, tint: HEX.navyTint, items: [
      "HR moves to Core HCM: new interconnections, cleaned data",
      "Identity moves from AD toward Entra ID",
      "Today: no HR-driven identity; accounts come from tickets" ] },
    { t: "The agency’s call", icon: "FaLandmark", c: HEX.teal, tint: HEX.tealTint, items: [
      "OPM fixes the HR side: platform, waves, interfaces",
      "The agency’s directory and ICAM design is its own decision",
      "The solicitation requires SCIM 2.0 provisioning — the protocol Entra ID consumes" ] },
    { t: "The proposal", icon: "FaLightbulb", c: HEX.amber, tint: HEX.amberTint, items: [
      "Start HR-driven identity: HR becomes the source of authority",
      "Expressed in OPM standard attributes",
      "Driving Entra ID, AD and ICAM by rule, with evidence" ] },
  ]);
  box(s, "Choice", 0.6, 5.1, 12.15, 1.35, "FFFFFF", HEX.amber);
  txt(s, "Choice text", [
    { text: "The choice: ", options: { bold: true, color: HEX.amber } },
    { text: "carry ticket-driven identity through both migrations — or use them to start HR-driven identity, once, while both platforms are being rebuilt anyway." },
  ], { x: 0.95, y: 5.2, w: 11.5, h: 1.15, fontSize: 18, valign: "middle" });
  s.addNotes(
`[0:55–1:48]  The thesis in one slide.

On the left, two migrations that happen regardless: HR moves to Core HCM, and identity moves from Active Directory toward Entra ID. Meanwhile nothing connects HR to identity today — accounts come from tickets.

In the middle, what OPM leaves to us. OPM fixes the HR side; how the agency's directories and ICAM consume that data is the agency's decision. And the solicitation requires SCIM 2.0 provisioning — exactly what Entra ID consumes.

On the right, the proposal: start HR-driven identity, with HR as the source of authority, expressed in OPM's standard attributes.

So the real choice is: carry ticket-driven identity through both migrations, or start HR-driven identity once, while both platforms are being rebuilt anyway.

Workbook: HR-Driven Identity, Chapter 00 — The proposal; Chapter 02 — Why this is the opportunity, not the project.`);
}

// ------------------------------------------------------------------ 3 Why now (Zero Trust -> SASE -> ICAM -> HR data)
{
  const s = content("Why we need HR-driven ICAM now", "Thesis");
  const chain = [
    ["The strategy", "Zero Trust", "OMB M‑22‑09 · NIST SP 800‑207 · CISA ZTMM", HEX.slate, HEX.grey],
    ["The delivery", "SASE", "Each request enforced at the cloud edge (TIC 3.0)", HEX.navy, HEX.navyTint],
    ["The decision", "ICAM in Entra ID", "Token from PIV or phishing-resistant MFA; dynamic groups read attributes", HEX.teal, HEX.tealTint],
    ["Accuracy decides access", "Employee data", "Organization, position, status, supervisor", HEX.amber, HEX.amberTint],
  ];
  const W = 2.7, G = 0.45;
  chain.forEach((c, i) => {
    const x = 0.6 + i * (W + G);
    box(s, `Chain ${i + 1}`, x, 1.5, W, 1.85, c[4], c[3]);
    txt(s, `Chain ${i + 1} text`, [
      { text: c[0].toUpperCase(), options: { bold: true, color: c[3], fontSize: 11, breakLine: true } },
      { text: c[1], options: { bold: true, color: c[3], fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: c[2], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: 1.62, w: W - 0.4, h: 1.65, paraSpaceAfter: 4 });
  });
  const lab = (t, x) => txt(s, `Arrow label ${t}`, t, { x: x - 0.15, y: 2.2, w: G + 0.3, h: 0.3, fontSize: 10, color: HEX.slate, align: "center" });
  arrow(s, 0.6 + W, 2.42, G, 0);
  arrow(s, 0.6 + 2 * W + G, 2.42, G, 0);
  s.addShape(pres.shapes.LINE, { x: 0.6 + 3 * W + 2 * G, y: 2.42, w: G, h: 0, line: { color: HEX.amber, width: 1.75, beginArrowType: "triangle" } });
  s.addTable([head(["", "Perimeter era", "Zero Trust, delivered through SASE"]),
    [{ text: "What decides access", options: { bold: true, color: HEX.navy } }, { text: "Network location, then static groups" }, { text: "A token evaluated against attributes and dynamic groups, every session" }],
    [{ text: "A wrong department", options: { bold: true, color: HEX.navy } }, { text: "A wrong phone-book entry" }, { text: "The wrong groups — and the wrong access" }],
    [{ text: "A stale status", options: { bold: true, color: HEX.navy } }, { text: "An orphaned account: a standing security violation that can enable a breach" }, { text: "A valid token for a separated person, usable from anywhere" }]],
    tableOpts([2.6, 4.2, 5.35], { y: 3.65, h: 1.65, fontSize: 14 }));
  box(s, "Takeaway", 0.6, 5.85, 12.15, 0.85, "FFFFFF", HEX.amber);
  txt(s, "Takeaway text", [
    { text: "When access is decided by attributes, ", options: { bold: true, color: HEX.amber } },
    { text: "the accuracy of employee data is the accuracy of access." },
  ], { x: 0.95, y: 5.9, w: 11.5, h: 0.75, fontSize: 18, valign: "middle" });
  s.addNotes(
`[1:48–3:09]  Why we need HR-driven ICAM at all — and why now.

Zero Trust is federal strategy — OMB M-22-09, with NIST SP 800-207 as the architecture and CISA's maturity model as the yardstick. SASE is how it's delivered: security enforced at a cloud edge close to the user, which TIC 3.0 opens up for agencies, instead of at our network perimeter. And SASE's decisions are driven by ICAM: the user presents a token from a PIV card or phishing-resistant MFA, and Entra ID decides access through Conditional Access and dynamic groups that read the user's attributes.

In the perimeter era, a wrong department meant a wrong phone-book entry. Now it means the wrong groups, and so the wrong access — and a stale status is worse than ever. In the perimeter era an orphaned account was already a standing security violation that could enable a breach. Now it's a valid token for someone who has left, usable from anywhere, because there is no perimeter left to stop it. When access is decided by attributes, the accuracy of employee data is the accuracy of access.

Workbook: HR-Driven Identity, Chapter 01 — Why the agency needs HR-driven ICAM now; Chapter 08 — The derivation chain.`);
}

// ------------------------------------------------------------------ 3b Personal
{
  const s = content("The everyday impact of manually provisioned ICAM", "Thesis");
  const stories = [
    ["FaAddressBook", "The phone book", "Active Directory feeds the agency phone book, but nothing feeds Active Directory from HR. Titles, offices, phone numbers and managers stay wrong until someone files a ticket."],
    ["FaUserTie", "Every change of management", "A person\u2019s organization, manager and access to tools are updated by hand — by ticket, after the fact, every time."],
  ];
  stories.forEach((st, i) => {
    const y = 1.55 + i * 2.45;
    box(s, `Story ${i + 1}`, 0.6, y, 6.3, 2.25, HEX.redTint);
    icon(s, st[0], 0.85, y + 0.25, 0.7, HEX.red);
    txt(s, `Story ${i + 1} text`, [
      { text: st[1], options: { bold: true, color: HEX.red, fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: st[2], options: { fontSize: 15 } },
    ], { x: 1.8, y: y + 0.22, w: 4.9, h: 1.9, paraSpaceAfter: 6 });
  });
  box(s, "HR-driven panel", 7.2, 1.55, 5.55, 4.7, HEX.tealTint);
  icon(s, "FaRightLeft", 7.45, 1.75, 0.6, HEX.teal);
  txt(s, "HR-driven heading", "With HR-driven IT", { x: 8.2, y: 1.75, w: 4.3, h: 0.6, bold: true, color: HEX.teal, fontSize: 20, fontFace: "Cambria", valign: "middle" });
  const steps = [
    "The personnel action records the reassignment",
    "Organization and manager update in Entra ID and AD",
    "The phone book, approvals and tool access follow — from the authoritative source, not a ticket",
  ];
  steps.forEach((t, i) => {
    const y = 2.65 + i * 1.15;
    s.addShape(pres.shapes.OVAL, { objectName: `Step ${i + 1} badge`, x: 7.5, y, w: 0.5, h: 0.5, fill: { color: HEX.teal }, line: { color: HEX.teal } });
    txt(s, `Step ${i + 1} number`, String(i + 1), { x: 7.5, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, `Step ${i + 1} text`, t, { x: 8.2, y: y - 0.05, w: 4.35, h: 0.95, fontSize: 15.5, color: HEX.navy, valign: "top" });
    if (i < steps.length - 1) s.addShape(pres.shapes.LINE, { x: 7.75, y: y + 0.5, w: 0, h: 0.65, line: { color: HEX.teal, width: 1.5, endArrowType: "triangle" } });
  });
  s.addNotes(
`[3:09–4:11]  Why this matters to everyone who works in an agency.

In many agencies Active Directory feeds the phone book, and nothing feeds Active Directory from HR. Titles, offices, phone numbers and managers stay wrong until someone notices and files a ticket.

And every time someone changes management, their organization, their manager and their access to tools have to be updated by hand, after the fact, by ticket.

HR already knows all of it. With HR-driven IT, the personnel action that records the reassignment updates the organization and manager in Entra ID and Active Directory, and the phone book, the approval chain and tool access follow from the authoritative source — instead of each person, and the help desk, keeping them current by hand.

Workbook: HR-Driven Identity, Chapter 01 — What HR-driven provisioning means; Chapter 08 — Access packages and access reviews.`);
}

// ------------------------------------------------------------------ 4 Window
{
  const s = content("The window closes at the agency’s interconnection go-live", "Thesis");
  const ms = [
    ["Dec 10, 2025", "OMB/OPM memo", "One government-wide Core HCM platform"],
    ["Jun 11, 2026", "Core HCM award", "Oracle Fusion Cloud HCM (SaaS)"],
    ["Jan–Mar 2027", "First go-lives", "Wave 1 agencies"],
    ["FY 2027", "Wave 2 agencies", "~8-month onboarding; interconnections live ~month 5"],
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
    ["Inside the window", "Data standards, cleanup, interconnection design and the Entra ID migration plan are all being decided. An HR-driven feed can be written into them.", HEX.teal, HEX.tealTint],
    ["After it closes", "Both migrations finish with ticket-driven identity carried forward, and retrofitting HR-driven identity costs far more.", HEX.red, HEX.redTint],
  ];
  two.forEach((t, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Window ${i + 1}`, x, 4.85, 6.0, 1.85, t[3]);
    icon(s, i ? "FaDoorClosed" : "FaDoorOpen", x + 0.3, 5.05, 0.65, t[2]);
    txt(s, `Window ${i + 1} text`, [
      { text: t[0], options: { bold: true, color: t[2], fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: t[1], options: { fontSize: 15 } },
    ], { x: x + 1.15, y: 5.0, w: 4.65, h: 1.6, paraSpaceAfter: 6 });
  });
  s.addNotes(
`[4:11–5:18]  The window.

The December 10, 2025 OMB/OPM memo directs one government-wide Core HCM platform. Oracle Fusion Cloud HCM was awarded June 11, 2026. First go-lives are January to March 2027. Wave 2 agencies follow in fiscal 2027. For an agency not yet on the platform, that's the point: about eight months of onboarding, with interconnections live around month five, still lie ahead. By fiscal 2028 EHRI and eOPF are decommissioned.

I'd describe that not as a deadline but as a window. Inside it, the data standards, the cleanup, the interconnection design — and, on our side, the Entra ID migration plan — are all being decided, and an HR-driven identity feed can be written into them. After it closes, both migrations finish with ticket-driven identity carried forward, and adding HR-driven identity later means reopening both.

(Verify the agency's onboarding dates before presenting.)

Workbook: HR-Driven Identity, Chapter 02 — The program facts; Why this is the opportunity, not the project.`);
}

// ------------------------------------------------------------------ 5 Standard attributes
pres.addSection({ title: "The data" });
{
  const s = content("Drive identity from OPM\u2019s standard HR data", "The data");
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
  box(s, "Why card", 9.35, 1.55, 3.4, 2.2, HEX.tealTint);
  icon(s, "FaBook", 9.55, 1.72, 0.5, HEX.teal);
  txt(s, "Why heading", "Why standards", { x: 10.15, y: 1.72, w: 2.5, h: 0.5, bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Why text", "OPM defines these elements and codes the same way for every agency. Map them to Entra ID and AD once, and the mapping still works if the HR vendor changes.",
    { x: 9.55, y: 2.32, w: 3.05, h: 1.35, fontSize: 13.5 });
  box(s, "CWK card", 9.35, 3.95, 3.4, 2.25, HEX.amberTint);
  icon(s, "FaPeopleArrows", 9.55, 4.12, 0.5, HEX.amber);
  txt(s, "CWK heading", "Contractors, vendors", { x: 10.15, y: 4.12, w: 2.5, h: 0.5, bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "CWK text", [
    { text: "Not in HRIT; today in COR spreadsheets. ", options: { bold: true, color: HEX.navy } },
    { text: "Best bet: Core HCM’s Contingent Worker type. Alternative: PIV sponsorship as the source." },
  ], { x: 9.55, y: 4.72, w: 3.05, h: 1.4, fontSize: 13.5 });
  txt(s, "Source note", "Elements per OPM’s Guide to Data Standards; confirm against the current edition and how Core HCM exposes them.",
    { x: 0.6, y: 6.35, w: 12.1, h: 0.35, fontSize: 11, color: HEX.slate, italic: true });
  s.addNotes(
`[5:18–6:49]  This is the heart of the proposal, and it's the programmatic data knowledge.

OPM already defines the personnel data every agency records. Agency and subelement give the legal employer and component. Duty station is the location of record. Series, pay plan and grade give a position category for role-based access. Supervisory status tells us who can approve and review. Tenure and appointment type drive the worker type. And the nature-of-action code, with its effective date, tells us what just happened — next slide.

Why build on OPM's standard rather than on Oracle's field names? Because OPM defines these elements and their codes the same way for every agency. We map them to Entra ID and AD once, for every employee population — and if the HR vendor ever changes, the mapping still holds.

One honest limit: HRIT covers federal employees only. Contractors and vendors live in COR spreadsheets today. My best bet is Core HCM's Contingent Worker type — a person record, an assignment and a lifecycle much like an employee's, though it has no vendor-management layer. The alternative is to source them from PIV sponsorship. That's a decision to put in front of the program early.

(Confirm element names against OPM's current data standards.)

Workbook: HR-Driven Identity, Chapter 05 — The standard-attribute layer; Contractors and vendors.`);
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
    icon(s, ["FaUserClock", "FaArrowDownWideShort", "FaUserXmark"][i], x + 0.18, 5.88, 0.6, [HEX.amber, HEX.navy, HEX.red][i]);
    txt(s, `NOA rule ${i + 1} text`, [
      { text: r[0] + " ", options: { bold: true, color: HEX.navy } },
      { text: r[1] },
    ], { x: x + 0.95, y: 5.7, w: 2.9, h: 0.95, fontSize: 14, valign: "middle" });
  });
  s.addNotes(
`[6:49–7:43]  Personnel actions drive the lifecycle.

For federal employees, every personnel action carries a nature-of-action code, and the families map cleanly to identity events: the 100 series are joiners, the 700 series movers, the 500 series conversions, the 300 series separations. Contractors have no SF-50; their events come from contract start and end dates.

Two families matter more than people expect. The 400 series — furlough, leave without pay, suspension — is not a leaver; the person is still employed and policy restricts the account. The 200 series, return to duty, lifts those restrictions. Getting this wrong either locks out people on leave or leaves access open for people who've left.

The codes also settle precedence — a separation wins — and rescinded offers.

Workbook: HR-Driven Identity, Chapter 06 — Personnel actions are the triggers; Appendix A — Lifecycle Rules.`);
}

// ------------------------------------------------------------------ 6b Layered identifiers
{
  const s = content("Model the person, not the account: layered identifiers", "The data");
  const rows = [
    ["Enterprise person key", "The person, across every affiliation", "The agency \u2014 often an existing ID", "Never, once assigned"],
    ["Source person key", "The person in one HR source", "Core HCM (or the contractor source)", "The source system changes"],
    ["Affiliation key", "One employment, contract or appointment", "The HR system", "A new affiliation begins"],
    ["Directory object ID", "One account in one directory", "Entra ID or AD", "The account is recreated"],
    ["Credential identifiers", "One authenticator (PIV, certificate)", "Card management or CA", "The credential is reissued"],
  ];
  s.addTable([head(["Key", "Identifies", "Assigned by", "Changes when"]),
    ...rows.map((r, k) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: k === 0 ? HEX.amber : HEX.navy } : {} })))],
    tableOpts([2.15, 2.6, 2.45, 1.95], { y: 1.5, h: 3.9, fontSize: 13 }));
  box(s, "EDA card", 10.0, 1.5, 2.75, 3.9, HEX.tealTint);
  icon(s, "FaSitemap", 10.2, 1.68, 0.5, HEX.teal);
  txt(s, "EDA heading", "Why it matters", { x: 10.8, y: 1.68, w: 1.9, h: 0.5, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "EDA list", ["Entity modeling: the person is the tracked entity", "Survives rehire, conversion and reorganization", "The Core HCM cutover changes only the source key", "No SSN as a join key"].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })),
    { x: 10.2, y: 2.35, w: 2.4, h: 2.95, fontSize: 13.5, paraSpaceAfter: 6 });
  box(s, "Decision", 0.6, 5.65, 12.15, 0.95, "FFFFFF", HEX.amber);
  txt(s, "Decision text", [
    { text: "Often the key already exists: ", options: { bold: true, color: HEX.amber } },
    { text: "for example, a Mainframe PIN. Confirm it as the enterprise person key, and map Core HCM\u2019s PersonNumber and every directory and credential key to it." },
  ], { x: 0.95, y: 5.7, w: 11.5, h: 0.85, fontSize: 17, valign: "middle" });
  s.addNotes(
`[7:43–8:48]  Identifiers are where data architecture earns its keep.

A common design says the employee ID is the person, for life. It breaks the moment the source changes, a contractor converts, or someone is rehired. So I model identifiers in layers: an enterprise person key the agency controls; a source key per HR system; an affiliation key per employment or contract; a directory ID per account; and credential identifiers per PIV or certificate.

The person is the tracked entity, not the account. That's what survives rehire, conversion and reorganization. And many agencies already have one — for example, a Mainframe PIN that already serves as the person ID and employee ID. Then the decision is to confirm it as the enterprise key and map Core HCM's PersonNumber to it — so when the agency moves to Core HCM, only the source key changes, and nothing downstream has to.

Workbook: HR-Driven Identity, Chapter 03 — One person, layered identifiers.`);
}

// ------------------------------------------------------------------ 7 Crosswalk
{
  const s = content("HR → canonical model → Entra ID and AD → ICAM", "The data");
  const rows = [
    ["Person (enterprise key)", "personKey", "employeeId", "employeeID", "Audit and SIEM joins"],
    ["Agency / subelement", "legalEmployer, orgCode", "companyName; extensionAttribute10", "company; extensionAttribute10", "Component scope"],
    ["Duty station", "locationCode, country", "officeLocation; usageLocation", "physicalDeliveryOfficeName; co", "Location policy"],
    ["Occupational series + pay plan", "positionCategory", "extensionAttribute12", "extensionAttribute12", "Role-based access packages"],
    ["Supervisory status; supervisor", "isSupervisor; manager", "manager (+ supervisor group)", "manager (DN)", "Approvals and reviews"],
    ["Nature of action + date", "lifecycle event", "hire and leave dates; accountEnabled", "extensionAttribute2/3; enabled", "Joiner, mover, leaver; PIV"],
  ];
  s.addTable([head(["HR (OPM standard element)", "Canonical model", "Entra ID", "Active Directory", "ICAM use"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : j === 4 ? { bold: true, color: HEX.teal } : { fontFace: "Consolas", fontSize: 11 } })))],
    tableOpts([2.25, 2.0, 2.95, 2.85, 2.1], { y: 1.5, h: 3.9, fontSize: 12.5 }));
  const rules = [
    ["Native attributes first", "Extensions only where a rule can’t read a native property."],
    ["Codes, not display strings", "Access rules read codes that change only when the fact does."],
    ["One crosswalk, governed", "Versioned, change-controlled, and the only place mappings live."],
  ];
  rules.forEach((r, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Model rule ${i + 1}`, x, 5.75, 3.95, 1.0, HEX.tealTint);
    icon(s, ["FaCubes", "FaHashtag", "FaTableList"][i], x + 0.18, 5.95, 0.6, HEX.teal);
    txt(s, `Model rule ${i + 1} text`, [
      { text: r[0], options: { bold: true, color: HEX.teal, breakLine: true } },
      { text: r[1], options: { fontSize: 13.5 } },
    ], { x: x + 0.95, y: 5.8, w: 2.9, h: 0.9, fontSize: 15 });
  });
  s.addNotes(
`[8:48–9:39]  Logical and physical modeling, following the data from HR to ICAM.

In the middle is the logical model: a person with an enterprise key the agency controls — their assignments, and the lifecycle events that change them. On the left, the OPM element that feeds each field; then where it lands in Entra ID and Active Directory; and on the right, what ICAM does with it — component scope, location policy, role-based access, approvals, and the joiner, mover and leaver actions, including PIV.

Three physical rules: native attributes first; codes, never display strings, in anything that grants access; and one governed crosswalk as the only place mappings live.

Workbook: HR-Driven Identity, Chapter 05 — The standard-attribute layer; The schema.`);
}

// ------------------------------------------------------------------ 8 AD + Entra
pres.addSection({ title: "Identity and ICAM" });
{
  const s = content("Logical architecture and Microsoft realization", "Identity and ICAM");
  const rowsLM = [
    ["Logical architecture \u2014 stable", HEX.navy, HEX.navyTint, [
      "Authoritative source", "Boundary transformation", "Governed identity model", "Provisioning service", "Targets and ICAM"]],
    ["Microsoft realization \u2014 replaceable", HEX.teal, HEX.tealTint, [
      "Oracle Core HCM", "Azure Functions or Logic Apps", "Canonical model and provenance store", "Graph /bulkUpload; Entra provisioning", "Entra ID, AD, Intune, card management"]],
  ];
  rowsLM.forEach((row, ri) => {
    const y = 1.85 + ri * 1.55;
    txt(s, `Row label ${ri + 1}`, row[0], { x: 0.6, y: y - 0.42, w: 8, h: 0.35, fontSize: 14, bold: true, color: row[1] });
    row[3].forEach((t, i) => {
      const x = 0.6 + i * 2.475;
      box(s, `LM ${ri + 1}.${i + 1}`, x, y, 2.25, 1.0, row[2], row[1]);
      txt(s, `LM ${ri + 1}.${i + 1} text`, t, { x: x + 0.1, y, w: 2.05, h: 1.0, fontSize: 13.5, bold: ri === 0, color: HEX.navy, align: "center", valign: "middle" });
      if (i < 4) arrow(s, x + 2.25, y + 0.5, 0.225, 0, row[1]);
    });
  });
  s.addTable([head(["", "Directory migration (AD → Entra ID)", "HR-driven identity"]),
    [{ text: "What changes", options: { bold: true, color: HEX.navy } }, { text: "Users’ source of authority moves from AD to Entra ID" }, { text: "HR becomes the start of authority for both" }],
    [{ text: "Without the other", options: { bold: true, color: HEX.navy } }, { text: "Ticket-created accounts, migrated as they are" }, { text: "An HR feed into a directory about to change" }]],
    tableOpts([2.3, 4.9, 4.95], { y: 4.95, h: 1.6, fontSize: 14 }));
  s.addNotes(
`[9:39–10:27]  Logical architecture and Microsoft realization.

The top row is the architecture, and it's stable: an authoritative source, a boundary transformation, the governed identity model, a provisioning service, and the targets and ICAM. The bottom row is how Microsoft realizes it today: Oracle Core HCM, Azure Functions, the canonical model and provenance store, Graph and the Entra provisioning service, then Entra ID, AD, Intune and card management. Products in the bottom row can change; the top row doesn't.

The table is why the two migrations belong together. Done separately, the Entra ID migration moves ticket-created accounts as they are. Done together, each population arrives in Entra ID already HR-sourced.

Workbook: HR-Driven Identity, Chapter 04 — Logical architecture and Microsoft realization; Two landing zones; Over the Entra ID migration.`);
}

// ------------------------------------------------------------------ 9 ICAM
{
  const s = content("ICAM: attributes drive credentials, assurance and access", "Identity and ICAM");
  cards3(s, 1.55, 3.65, [
    { t: "Credentials", icon: "FaIdCard", c: HEX.navy, tint: HEX.navyTint, items: [
      "Joiner schedules PIV enrollment",
      "Leaver: block sign-in and sessions first, then revoke PIV, derived credentials and devices in parallel",
      "Every revocation reconciled to completion" ] },
    { t: "Assurance", icon: "FaFingerprint", c: HEX.teal, tint: HEX.tealTint, items: [
      "Record proofing (IAL) and authenticator assurance (AAL) per person",
      "Missing proofing evidence is itself a finding",
      "Phishing-resistant MFA per OMB M‑22‑09" ] },
    { t: "Access", icon: "FaKey", c: HEX.amber, tint: HEX.amberTint, items: [
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
`[10:27–11:23]  ICAM — beyond accounts.

Credentials: the joiner event schedules PIV enrollment. The leaver event blocks sign-in and revokes sessions first — Microsoft's documented order, and the step that closes certificate sign-in immediately rather than at the next revocation-list refresh — then revokes PIV, derived credentials and device certificates in parallel, reconciled to completion.

Assurance: record each person's proofing level and authenticator assurance as governed attributes, treat missing proofing evidence as a finding, and enforce phishing-resistant MFA under M-22-09.

Access: baseline access derived by rule from the standard attributes; privileged eligibility by position, through PIM, never standing; and any activity from a separated person is an alert.

The result: every entitlement has a "because" — a rule, an attribute, and the personnel action that set it.

Workbook: HR-Driven Identity, Chapter 07 — The canonical leaver sequence; Assurance as data; Chapter 08 — Where dynamic membership stops.`);
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
    icon(s, ["FaScaleBalanced", "FaFilter", "FaFileShield", "FaLock"][i], x + 0.3, y + 0.3, 0.7, i % 3 ? HEX.teal : HEX.navy);
    txt(s, `Privacy ${i + 1} text`, [
      { text: p[0], options: { bold: true, color: i % 3 ? HEX.teal : HEX.navy, fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: p[1], options: { fontSize: 15 } },
    ], { x: x + 1.25, y: y + 0.18, w: 4.55, h: 1.5, paraSpaceAfter: 6 });
  });
  box(s, "Privacy takeaway", 0.6, 5.65, 12.15, 1.05, "FFFFFF", HEX.amber);
  txt(s, "Privacy takeaway text", [
    { text: "HR remains the system of records. ", options: { bold: true, color: HEX.amber } },
    { text: "Identity is a governed consumer that never writes an HR-mastered fact back." },
  ], { x: 0.95, y: 5.72, w: 11.5, h: 0.9, fontSize: 17, valign: "middle" });
  s.addNotes(
`[11:23–12:23]  Privacy — which is where a data architect earns trust with HR.

Moving HR attributes into a directory is a disclosure of personnel records. So: confirm the routine-use basis under the governing system-of-records notices — OPM/GOVT-1 for general personnel records, plus the agency's own — before anything flows. Minimize: send only attributes an identity decision actually reads, as codes rather than narrative, and never use the SSN as a join key. Update the privacy impact assessment for the new flow and its consumers. And protect the flow: encrypt every leg, and keep logs to the person key and a payload hash rather than the record itself.

The principle underneath: HR remains the system of records; identity is a governed consumer that never writes an HR-mastered fact back.

(Confirm the applicable SORNs and routine uses with the agency's privacy office.)

Workbook: HR-Driven Identity, Chapter 03 — Privacy: identity is a routine-use consumer; Appendix B — Security and Privacy Assessment.`);
}

// ------------------------------------------------------------------ 11 Governance
pres.addSection({ title: "Delivery" });
{
  const s = content("The governance I’d bring to deliver it safely", "Delivery");
  const items = [
    ["Authority map and identifier decision", "One owner per attribute; an enterprise person key the agency controls"],
    ["Security assessment", "Data flow, service identities without secrets, least privilege"],
    ["Acceptance gate", "Business-language test cases; signed validation before cutover"],
    ["Cutover from tickets", "Prove HR is the sole source; then close manual account creation"],
    ["Lifecycle rules", "Scope filters, leave vs leaver, precedence, rescinded offers"],
    ["Quarantine and reconciliation", "Failures never auto-resolve; every exception has an owner"],
    ["Drift and metrics", "Separation-to-block, correlation coverage, derivation purity"],
    ["Change control", "Crosswalk and code lists versioned; shadow-tested before they act"],
  ];
  items.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.07, y = 1.5 + row * 2.4;
    box(s, `Gov ${i + 1}`, x, y, 2.92, 2.25, row ? HEX.tealTint : HEX.navyTint);
    icon(s, ["FaSitemap", "FaUserShield", "FaClipboardCheck", "FaPlugCircleXmark", "FaListCheck", "FaTriangleExclamation", "FaChartLine", "FaCodeBranch"][i], x + 0.2, y + 0.18, 0.5, row ? HEX.teal : HEX.navy);
    txt(s, `Gov ${i + 1} text`, [
      { text: it[0], options: { bold: true, color: row ? HEX.teal : HEX.navy, fontSize: 16, breakLine: true } },
      { text: it[1], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: y + 0.8, w: 2.6, h: 1.4, paraSpaceAfter: 4 });
  });
  txt(s, "Gov note", "Control support for AC-2, PS-4, PS-5, IA-4 and SI-12 — evidence produced by operation, not assembled for the audit.",
    { x: 0.6, y: 6.35, w: 12.1, h: 0.35, fontSize: 13, color: HEX.slate, italic: true });
  s.addNotes(
`[12:23–13:10]  The governance I'd bring to deliver it safely.

The data foundation first: an authority map with one owner per attribute, and an enterprise person key the agency controls. A security assessment of the data flow. An acceptance gate with a signed validation before cutover. And a cutover that proves HR is the sole source for a population before the ticket path closes for it.

Then the operating rules on the bottom row, from lifecycle rules through change control.

Together that produces evidence for AC-2, PS-4, PS-5, IA-4 and SI-12 as a byproduct of operating — supporting those controls, not claiming to close them on its own.

Workbook: HR-Driven Identity, Chapter 09 — Drift, Metrics and Evidence; Chapter 10 — Execution Plan; Appendices A–C.`);
}

// ------------------------------------------------------------------ 11b Cross-agency standard
{
  const s = content("One standard for HR-driven ICAM, shared across agencies", "Delivery");
  const cols = [
    { x: 0.6, head: "Why a shared standard", tint: HEX.navyTint, c: HEX.navy, rows: [
      ["FaBuildingColumns", "Same platform, same standards", "Every agency moves to Core HCM on OPM’s data standards — one crosswalk and canonical model, reused rather than rebuilt"],
      ["FaRightLeft", "Attributes that travel", "Details, transfers and shared services read the same coded attributes; cross-agency access can trust the data"],
      ["FaChartLine", "Comparable evidence", "Common metrics for ICAM and Zero Trust maturity reporting across agencies"],
    ] },
    { x: 6.75, head: "How I’d carry it across agencies", tint: HEX.tealTint, c: HEX.teal, rows: [
      ["FaPeopleArrows", "Work the issues together", "With other agencies and the private sector; track legislative and policy developments and trends"],
      ["FaScaleBalanced", "Options and their impact", "Define the issues, develop options, predict the impact of alternatives, and present the findings"],
      ["FaUsersGear", "Committees and working groups", "Chair agency data committees; serve as the data expert on interagency ICAM working groups; recommend data technology and architecture"],
    ] },
  ];
  cols.forEach((col, k) => {
    box(s, `Cross col ${k + 1}`, col.x, 1.4, 6.0, 4.3, col.tint);
    txt(s, `Cross head ${k + 1}`, col.head, { x: col.x + 0.25, y: 1.5, w: 5.5, h: 0.45, fontSize: 18, bold: true, color: col.c });
    col.rows.forEach((r, i) => {
      const y = 2.05 + i * 1.2;
      icon(s, r[0], col.x + 0.25, y + 0.05, 0.62, col.c);
      txt(s, `Cross ${k + 1}.${i + 1}`, [
        { text: r[1], options: { bold: true, color: col.c, fontSize: 15.5, breakLine: true } },
        { text: r[2], options: { fontSize: 13 } },
      ], { x: col.x + 1.05, y, w: 4.75, h: 1.12, paraSpaceAfter: 2 });
    });
  });
  box(s, "Cross banner", 0.6, 5.9, 12.15, 0.8, HEX.amberTint);
  txt(s, "Cross banner text", [
    { text: "The goal: ", options: { bold: true, color: HEX.amber } },
    { text: "present this model to our fellow agencies, and adopt one HR-driven ICAM standard together as each agency onboards to HR 2.0." },
  ], { x: 0.9, y: 5.95, w: 11.6, h: 0.7, fontSize: 17, valign: "middle" });
  s.addNotes(
`[13:10–13:58]  One standard, shared across agencies.

Every agency is moving to the same Core HCM on the same OPM data standards. If one agency defines HR-driven ICAM as a standard — crosswalk, canonical model, identifiers and evidence — other agencies can reuse it instead of building their own. And attributes that mean the same thing everywhere make details, transfers, shared services and cross-agency access easier.

That's the work an enterprise data architect does: working the issues with other agencies and industry, developing options and predicting their impact, and serving as the data expert on interagency committees and working groups. The goal: present this model to our fellow agencies, and adopt it together.

Workbook: HR-Driven Identity, Chapter 02 — Federal HR 2.0; Chapter 05 — The standard-attribute layer.`);
}

// ------------------------------------------------------------------ 12 Roadmap + ask
{
  const s = content("Roadmap and the ask", "Delivery");
  const ph = [
    ["Now", "Align with HR 2.0", "Identity named as an interconnection consumer"],
    ["Pre-onboarding", "Standards and authority", "Crosswalk, authority map, contractor source, privacy basis"],
    ["Onboarding", "Build and prove", "Joiner, mover, leaver end to end; shadow mode"],
    ["Interconnection live", "Cut over", "HR-driven for each population as it moves to Entra ID"],
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
  icon(s, "FaLightbulb", 0.85, 4.5, 0.9, HEX.amber);
  txt(s, "Ask text", [
    { text: "The ask: ", options: { bold: true, color: HEX.amber, fontSize: 20 } },
    { text: "decide now to start HR-driven identity — HR, through OPM standard attributes, as the source of authority for Entra ID, AD and ICAM — and build it into both the HR 2.0 onboarding and the Entra ID migration, so Zero Trust and SASE decide access on accurate data.", options: { fontSize: 17 } },
  ], { x: 2.0, y: 4.35, w: 10.5, h: 1.2, valign: "middle" });
  box(s, "EDA contribution", 0.6, 5.85, 12.15, 0.85, "FFFFFF", HEX.navy);
  txt(s, "EDA contribution text", [
    { text: "EDA contribution: ", options: { bold: true, color: HEX.navy } },
    { text: "establish authority, identifiers, standards, lineage and evidence \u2014 so workforce events produce measurable identity outcomes." },
  ], { x: 0.95, y: 5.9, w: 11.5, h: 0.75, fontSize: 17, valign: "middle" });
  s.addNotes(
`[13:58–14:53]  The roadmap and the ask.

Now: align with the agency's HR 2.0 team so identity is a named consumer of the interconnection. Before onboarding: the crosswalk, authority map, contractor source and privacy basis. Then build and prove in shadow mode, cut each population over as it moves to Entra ID, and sustain it with metrics.

So the ask is simple: decide now to start HR-driven identity, and build it into both the HR 2.0 onboarding and the Entra ID migration — so that Zero Trust and SASE decide access on accurate data.

My contribution as an enterprise data architect: establish authority, identifiers, standards, lineage and evidence, so workforce events produce measurable identity outcomes.

Thank you — I look forward to your questions.

[Stop by 15:00.]

Workbook: HR-Driven Identity, Chapter 10 — Execution Plan; Appendix C — Acceptance and Cutover.`);
}
// ------------------------------------------------------------------ 13 Teaser
pres.addSection({ title: "Beyond" });
{
  const s = content("More modernizations I\u2019ve designed", "Beyond");
  const items = [
    ["FaCloudArrowUp", "AD \u2192 Entra ID migration", "Directory move with drift detection and evidence"],
    ["FaGlobe", "Next-generation DNS and IPAM", "One DDI control plane across on-premises and clouds"],
    ["FaBuilding", "Field office WAN and data centers", "Office network transformation and consolidation"],
    ["FaRoute", "TIC 3.0 branch edge", "SD-WAN versus direct internet access"],
    ["FaServer", "Client-server to hybrid cloud", "Application path from on-premises to cloud"],
    ["FaDatabase", "SQL Server identity", "Database logins moved to governed identity"],
    ["FaLaptop", "GPO sunset to Intune and Arc", "Policy and device management in the cloud"],
    ["FaShieldHalved", "Continuous compliance", "SCuBA baselines, BOD 25-01, FedRAMP 20x"],
  ];
  items.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.07, y = 1.45 + row * 2.25;
    const c = row ? HEX.teal : HEX.navy;
    box(s, `Teaser ${i + 1}`, x, y, 2.92, 2.1, row ? HEX.tealTint : HEX.navyTint);
    icon(s, it[0], x + 0.2, y + 0.18, 0.5, c);
    txt(s, `Teaser ${i + 1} text`, [
      { text: it[1], options: { bold: true, color: c, fontSize: 16, breakLine: true } },
      { text: it[2], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: y + 0.78, w: 2.6, h: 1.25, paraSpaceAfter: 3 });
  });
  box(s, "Teaser footer", 0.6, 6.0, 12.15, 0.7, "FFFFFF", HEX.amber);
  txt(s, "Teaser footer text", [
    { text: "Also: ", options: { bold: true, color: HEX.amber } },
    { text: "Zero Trust whole-agency unification \u00b7 AI identity governance \u00b7 help desk Entra operations" },
  ], { x: 0.9, y: 6.02, w: 11.6, h: 0.66, fontSize: 16, valign: "middle" });
  s.addNotes(
`[Leave up during questions — about 20 seconds]

HR-driven identity is one piece of a larger set of modernizations I've designed over the last several years: the AD to Entra ID migration, next-generation DNS and IP address management, field office WAN and data-center consolidation, the TIC 3.0 branch edge, the client-server to hybrid cloud path, SQL Server identity, the move from Group Policy to Intune and Azure Arc, and continuous compliance against SCuBA, BOD 25-01 and FedRAMP 20x.

They share the same data discipline you just saw: a named authority for every fact, a governed model, and evidence produced by operation. I'm happy to go into any of them.

Workbook: HR-Driven Identity, the same site's Whitepapers, Next-Generation DDI, Client-Server to Hybrid Cloud and Operational Guides sections.`);
}
(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT, n, "slides");
})();
