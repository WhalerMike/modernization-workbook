const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];
const THEME = {
  name: "Digital Identity Data",
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
pres.title = "Digital Identity as a Data Problem";
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
    { text: { text: "Digital Identity as a Data Problem  ·  Mike Stratton", options: { x: 0.6, y: 7.0, w: 8, h: 0.3,
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

// ------------------------------------------------------------------ 1 Title
pres.addSection({ title: "Opening" });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: "Opening" });
  n++;
  s.addText("Digital Identity as a Data Problem", { placeholder: "title" });
  s.addText("Authoritative records, a governed identity model, and measurable outcomes", { placeholder: "body" });
  txt(s, "Presenter", [
    { text: "Mike Stratton", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Interview presentation  ·  GS-14 Enterprise Data Architect  ·  Data Strategy and Enablement", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 11.7, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:45]  Good morning. Thank you for the time.

I chose the Digital Identity line of business, and I want to make one argument in the next fifteen minutes: digital identity is first a data problem, and only second a technology problem.

Every identity decision SSA makes — create an account, let someone sign in, grant access, take it away — rests on a fact that some authoritative record already holds. The architecture work is making those facts governed, modeled, moving and measured.

I'll walk through the business line, the data, the logical and physical models, how the data moves, how we measure it, and how I'd deliver it.`);
}

// ------------------------------------------------------------------ 2 Line of business
pres.addSection({ title: "Line of business" });
{
  const s = content("Digital Identity rests on facts SSA already records", "Line of business");
  const cards = [
    { x: 0.6, t: "Public digital identity", c: HEX.teal, tint: HEX.tealTint, items: [
      "Enumeration: SSN issuance and the Numident record",
      "my Social accounts, with external credential providers for sign-in",
      "Verification services that answer “does this identity match?”",
      "Identity proofing results as assertions, not new sources of truth" ] },
    { x: 6.8, t: "Workforce digital identity", c: HEX.navy, tint: HEX.navyTint, items: [
      "Employees and contractors: accounts, PIV, devices, access",
      "Federal HR 2.0: SSA moves to Oracle Fusion Cloud HCM in Wave 2 (FY 2027)",
      "Every hire, transfer and separation is an effective-dated HR record",
      "Access must follow those records, not tickets" ] },
  ];
  for (const c of cards) {
    box(s, `${c.t} card`, c.x, 1.55, 5.95, 3.75, c.tint);
    txt(s, `${c.t} heading`, c.t, { x: c.x + 0.35, y: 1.8, w: 5.3, h: 0.5, fontSize: 22, bold: true, color: c.c, fontFace: "Cambria" });
    txt(s, `${c.t} items`, c.items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < c.items.length - 1 } })),
      { x: c.x + 0.35, y: 2.45, w: 5.3, h: 2.7, fontSize: 16, paraSpaceAfter: 8 });
  }
  box(s, "Common discipline", 0.6, 5.55, 12.15, 1.15, "FFFFFF", HEX.teal);
  txt(s, "Common discipline text", [
    { text: "One discipline on both sides:  ", options: { bold: true, color: HEX.teal } },
    { text: "an authoritative source for every fact, a governed identity model, access derived by rule, and evidence produced by normal operation." },
  ], { x: 0.95, y: 5.7, w: 11.5, h: 0.85, fontSize: 17, valign: "middle" });
  s.addNotes(
`[0:45–2:15]  Programmatic line-of-business knowledge.

Digital Identity at SSA has two faces.

The public face starts with enumeration. SSA issues the Social Security number and maintains the Numident — the authoritative record of who holds which number. my Social accounts sit on top of that, with sign-in through external credential providers, and SSA's verification services answer whether a presented identity matches SSA's records. The data point here: identity proofing produces assertions about a person; it doesn't create a new source of truth that competes with the Numident.

The workforce face is SSA's own people. Under Federal HR 2.0, SSA is a Wave 2 agency moving to Oracle Fusion Cloud HCM in fiscal 2027. That is a real, dated forcing function for SSA's workforce identity data: every hire, transfer and separation becomes an effective-dated record in a new platform, and SSA's directories have to follow it.

The point of this slide: the same data discipline serves both sides. The worked example in the rest of the talk is the workforce side, because it's concrete and it's on SSA's calendar — but every principle carries to the public side.

(Verify before Wednesday: current my Social credential providers and the agency's Wave 2 onboarding dates.)`);
}

// ------------------------------------------------------------------ 3 Problem
{
  const s = content("A credential proves who signed it — not whether it is still true", "Line of business");
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
    { text: "The fact existed on day −14. The other systems learned it by accident.", options: { bold: true, color: HEX.navy, fontSize: 20, breakLine: true } },
    { text: "Orphaned accounts are not a diligence failure. They are what a design with one system that records the truth, many systems that need it, and no channel between them is guaranteed to produce.", options: { fontSize: 16 } },
  ], { x: 0.95, y: 4.95, w: 11.5, h: 1.55, valign: "middle", paraSpaceAfter: 6 });
  s.addNotes(
`[2:15–3:30]  The problem, in one timeline.

A token can prove cryptographically who signed a claim. It can't tell you whether the claim is still true — whether this person still works here, still holds this position, still reports to the supervisor who approved the access.

Here's what happens without a channel from the authoritative record. HR records a separation two weeks ahead. On day zero, everything is still live. On day three a ticket disables the directory account, but nine application accounts stay enabled. A quarterly review finds two of them. Six months later a penetration test signs in with one of the rest.

At every point the truth was available — in one system. This is why I treat identity as a data problem: the failure is missing lineage from the authoritative record to every consumer, and cleanup sweeps can't fix that. They measure it.`);
}

// ------------------------------------------------------------------ 4 Authority map
pres.addSection({ title: "Data" });
{
  const s = content("Name the authoritative source for every fact", "Data");
  const rows = [
    ["SSN and enumeration facts", "Enumeration (the Numident)", "Verification services, account linking"],
    ["Employment status, position, supervisor", "HR system of record (Core HCM)", "Account state, approvals, access rules"],
    ["Organizational placement (codes)", "HR system of record", "Dynamic groups, scoping, reporting"],
    ["Credentials, sessions, MFA methods", "Identity platform", "Applications, token claims"],
    ["Device identity and certificates", "Endpoint management and PKI", "Network admission, TLS"],
  ];
  s.addTable([head(["Fact", "Authoritative source", "Derived consumers"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : {} })))],
    tableOpts([2.9, 2.6, 2.75], { y: 1.55, h: 4.6, fontSize: 14 }));
  box(s, "Rules card", 9.25, 1.55, 3.5, 4.6, HEX.tealTint);
  txt(s, "Rules heading", "Three rules", { x: 9.55, y: 1.75, w: 2.9, h: 0.5, fontSize: 20, bold: true, color: HEX.teal, fontFace: "Cambria" });
  const rules = [
    ["Authoritative ", "where a business act creates the fact."],
    ["Derived ", "everywhere else: computed and read, never hand-edited."],
    ["Corrections flow upstream, ", "to the record or the rule, never to the copy."],
  ];
  txt(s, "Rules list", rules.flatMap((r, i) => [
    { text: r[0], options: { bullet: { type: "number" }, bold: true, color: HEX.navy } },
    { text: r[1], options: { breakLine: i < 2 } }]),
    { x: 9.55, y: 2.35, w: 2.95, h: 3.6, fontSize: 15, paraSpaceAfter: 10 });
  s.addNotes(
`[3:30–4:45]  Programmatic data knowledge.

The first artifact I build in any identity program is an authority map: for every fact an access decision reads, which system owns it.

SSN and enumeration facts are owned by enumeration — the Numident. Employment status, position and supervisor are owned by the HR system of record, which for SSA becomes Core HCM. The identity platform owns credentials and sessions; endpoint management and PKI own device identity.

Three rules make the map operable. A fact is authoritative where a business act creates it. Everywhere else it's derived — computed and read, never edited by hand. And corrections flow upstream: when a token carries the wrong department, we fix the HR record or the derivation rule, not the directory attribute, because a hand-edited copy is just a new fragment.

No system becomes authoritative because it received a copy, and no field drives access until it has an owner, a definition, controlled values and a correction path. That's data governance applied to identity.`);
}

// ------------------------------------------------------------------ 5 Logical model
pres.addSection({ title: "Modeling" });
{
  const s = content("Logical model: person, affiliation, account, evidence", "Modeling");
  const W = 3.3, H = 1.25;
  const X = [0.6, 5.0, 9.4], Y = [1.6, 3.55, 5.5];
  const ent = (name, attrs, col, row, color, tint) => {
    box(s, `Entity ${name}`, X[col], Y[row], W, H, tint, color);
    txt(s, `Entity ${name} text`, [
      { text: name, options: { bold: true, color, fontSize: 17, breakLine: true } },
      { text: attrs, options: { fontSize: 13 } },
    ], { x: X[col] + 0.2, y: Y[row] + 0.12, w: W - 0.4, h: H - 0.2 });
  };
  ent("Identifier", "Enterprise, source, affiliation, directory and credential keys", 0, 0, HEX.navy, HEX.navyTint);
  ent("Person", "One governed record per human, across every affiliation", 1, 0, HEX.navy, HEX.navyTint);
  ent("Affiliation", "Worker type, employer, effective dates; assignments with position, org code, supervisor", 2, 0, HEX.navy, HEX.navyTint);
  ent("Credential", "PIV, derived PIV, device certificate; issued and revoked", 0, 1, HEX.teal, HEX.tealTint);
  ent("Account", "One directory object per system; enabled state derived", 1, 1, HEX.teal, HEX.tealTint);
  ent("Lifecycle event", "Joiner, mover, leaver, rehire, conversion; effective-dated", 2, 1, HEX.amber, HEX.amberTint);
  ent("Entitlement", "Derived by rule, or an approved exception with an owner", 1, 2, HEX.teal, HEX.tealTint);
  ent("Provenance record", "Source event, payload hash, inputs, outcome", 2, 2, HEX.amber, HEX.amberTint);
  // relationships (1 : many)
  link(s, X[0] + W, Y[0] + H / 2, X[1] - X[0] - W, 0);
  link(s, X[1] + W, Y[0] + H / 2, X[2] - X[1] - W, 0);
  link(s, X[1] + W / 2, Y[0] + H, 0, Y[1] - Y[0] - H);
  link(s, X[0] + W, Y[1] + H / 2, X[1] - X[0] - W, 0);
  link(s, X[2] + W / 2, Y[0] + H, 0, Y[1] - Y[0] - H);
  link(s, X[1] + W / 2, Y[1] + H, 0, Y[2] - Y[1] - H);
  link(s, X[2] + W / 2, Y[1] + H, 0, Y[2] - Y[1] - H);
  s.addShape(pres.shapes.LINE, { x: X[1] + W, y: Y[1] + H / 2, w: X[2] - X[1] - W, h: 0,
    line: { color: HEX.amber, width: 1.75, beginArrowType: "triangle" } });
  const lab = (t, x, y, w) => txt(s, `Label ${t}`, t, { x, y, w: w || 1.1, h: 0.3, fontSize: 11, color: HEX.slate, align: "center" });
  lab("1 : many", X[0] + W, Y[0] + H / 2 - 0.35);
  lab("1 : many", X[1] + W, Y[0] + H / 2 - 0.35);
  lab("1 : many", X[1] + W / 2 + 0.05, Y[0] + H + 0.25);
  lab("1 : many", X[2] + W / 2 + 0.05, Y[0] + H + 0.25);
  lab("1 : many", X[0] + W, Y[1] + H / 2 - 0.35);
  lab("drives", X[1] + W, Y[1] + H / 2 + 0.08);
  lab("1 : many", X[1] + W / 2 + 0.05, Y[1] + H + 0.25);
  lab("1 : 1", X[2] + W / 2 + 0.05, Y[1] + H + 0.25);
  txt(s, "Legend", [
    { text: "Navy ", options: { bold: true, color: HEX.navy } }, { text: "who the person is   " },
    { text: "Teal ", options: { bold: true, color: HEX.teal } }, { text: "what they can use   " },
    { text: "Amber ", options: { bold: true, color: HEX.amber } }, { text: "what changed, and the proof" },
  ], { x: 0.6, y: 5.55, w: 4.1, h: 1.1, fontSize: 13 });
  s.addNotes(
`[4:45–6:15]  Logical data modeling.

This is the logical model, independent of any product.

The person is the tracked entity — not the account. A person has many identifiers, and many affiliations over time: employee, contractor, a rehire after a break in service. Each affiliation carries assignments: position, organization code, supervisor, all effective-dated.

A person has accounts — one directory object per system — and accounts carry credentials and entitlements. The key design decision is the arrow in amber: lifecycle events drive account state. Accounts are never the place where truth is entered.

And every event produces exactly one provenance record: which source event, which payload, which derivation inputs, what happened. That entity is what turns operations into audit evidence.

Why model the person rather than the account? Because directories forget. An account deleted at separation takes its history with it; a person record survives the rehire, the conversion from contractor to employee, the reorganization.`);
}

// ------------------------------------------------------------------ 6 Identifier layers
{
  const s = content("Model identifiers in layers, not as one “immutable” key", "Modeling");
  const rows = [
    ["Enterprise person key", "The person, across every affiliation", "The agency’s identifier decision", "Never, once assigned"],
    ["Source person key", "The person in one HR source", "The HR system", "The source system changes"],
    ["Affiliation key", "One employment, contract or appointment", "The HR system", "A new affiliation begins"],
    ["Directory object ID", "One account in one directory", "The directory", "The account is recreated"],
    ["Credential identifiers", "One authenticator (PIV, certificate)", "Credentialing system or CA", "The credential is reissued"],
  ];
  s.addTable([head(["Key", "Identifies", "Assigned by", "Changes when"]),
    ...rows.map((r) => r.map((t, j) => ({ text: t, options: j === 0 ? { bold: true, color: HEX.navy } : {} })))],
    tableOpts([2.8, 3.6, 3.1, 2.65], { y: 1.55, h: 3.7, fontSize: 14 }));
  box(s, "SSN note", 0.6, 5.5, 5.9, 1.2, HEX.amberTint);
  txt(s, "SSN note text", [
    { text: "The SSN is an attribute to protect, ", options: { bold: true, color: HEX.amber } },
    { text: "not a join key to copy into every system." },
  ], { x: 0.9, y: 5.62, w: 5.35, h: 0.95, fontSize: 15, valign: "middle" });
  box(s, "Core HCM note", 6.85, 5.5, 5.9, 1.2, HEX.tealTint);
  txt(s, "Core HCM note text", [
    { text: "Core HCM cutover changes the source key. ", options: { bold: true, color: HEX.teal } },
    { text: "Layering means nothing downstream has to." },
  ], { x: 7.15, y: 5.62, w: 5.35, h: 0.95, fontSize: 15, valign: "middle" });
  s.addNotes(
`[6:15–7:30]  Still logical modeling — identifiers, because this is where most identity data models break.

A common design says "employee ID is the immutable anchor for life." It works until the source changes, or contractors come from a different system, or someone is rehired. Each of these keys has its own lifecycle, so I model them as layers: an enterprise person key the agency controls, a source key per HR system, an affiliation key per employment, a directory object ID per account, and credential identifiers per authenticator.

Two SSA-specific consequences. First, the SSN is a protected attribute, not a join key — federal policy has pushed for years to reduce unnecessary SSN use, and a layered key model is how you join records without spreading it. Second, the Core HCM cutover in Wave 2 changes the source key. With layered identifiers, that's a mapping change at the boundary; nothing downstream has to move.`);
}

// ------------------------------------------------------------------ 7 Physical crosswalk
{
  const s = content("Physical model: one canonical field, every target named", "Modeling");
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
    ["Native attributes first", "Use a built-in property wherever one means what the HR record means."],
    ["Codes, not display strings", "A code changes only when the business fact changes."],
    ["Same carrier, both directories", "One rule reads the same field in AD and in Entra ID."],
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
`[7:30–8:45]  Physical data modeling.

The logical model becomes physical in a crosswalk: one canonical field, and its name in every system — the Oracle HCM source, the SCIM payload, on-premises Active Directory and Entra ID. This crosswalk is the single place those mappings live; every other document links to it instead of repeating it.

Three physical design rules. Use a native attribute wherever one exists, because other features — the org chart, Lifecycle Workflows, approvals — already understand it. Put codes in access attributes, never display strings, because a display name changes whenever someone retypes it. And use the same carrier in both directories, so one access rule works during the years when AD and the cloud coexist.

Notice the dates: Active Directory has no native hire or leave date, so the physical model has to choose carriers. That's the kind of decision a data architect documents and governs rather than leaving to whoever configures the connector.`);
}

// ------------------------------------------------------------------ 8 Data in motion
pres.addSection({ title: "Operations" });
{
  const s = content("Data in motion: one governed path, five duties per event", "Operations");
  const stages = [
    ["Authoritative source", "Core HCM, Numident"],
    ["Boundary transformation", "Source-specific, replaceable"],
    ["Governed identity model", "The durable contract"],
    ["Provisioning service", "One door, one log"],
    ["Target services", "AD, Entra ID, apps, PKI"],
  ];
  stages.forEach((st, i) => {
    const x = 0.6 + i * 2.5;
    const key = i === 2;
    box(s, `Stage ${i + 1}`, x, 1.6, 2.1, 1.45, key ? HEX.teal : HEX.navyTint, key ? HEX.teal : HEX.navy);
    txt(s, `Stage ${i + 1} text`, [
      { text: st[0], options: { bold: true, color: key ? "FFFFFF" : HEX.navy, breakLine: true } },
      { text: st[1], options: { fontSize: 13, color: key ? "FFFFFF" : HEX.ink } },
    ], { x: x + 0.15, y: 1.72, w: 1.8, h: 1.25, fontSize: 15, align: "center", valign: "middle" });
    if (i < 4) arrow(s, x + 2.1, 2.325, 0.4, 0);
  });
  const duties = [
    ["1", "Validate", "Required fields present; unknown worker types refused. Fail closed."],
    ["2", "Sequence", "Apply events in order; a mover after a leaver is a correctness bug."],
    ["3", "Normalize", "Build one payload from the governed model, whatever the source."],
    ["4", "Provenance", "One record per event, written before the call returns."],
    ["5", "Reconcile", "Match every result to its event; exceptions get an owner."],
  ];
  duties.forEach((d, i) => {
    const x = 0.6 + i * 2.5;
    s.addShape(pres.shapes.OVAL, { objectName: `Duty ${d[0]} badge`, x, y: 3.6, w: 0.55, h: 0.55, fill: { color: HEX.amber }, line: { color: HEX.amber } });
    txt(s, `Duty ${d[0]} number`, d[0], { x, y: 3.6, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, `Duty ${d[0]} text`, [
      { text: d[1], options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
      { text: d[2], options: { fontSize: 14 } },
    ], { x, y: 4.3, w: 2.25, h: 1.5, paraSpaceAfter: 4 });
  });
  box(s, "Platform note", 0.6, 5.95, 12.15, 0.8, HEX.grey);
  txt(s, "Platform note text", [
    { text: "On the Microsoft stack: ", options: { bold: true, color: HEX.teal } },
    { text: "API-driven inbound provisioning into Entra ID and AD, with Lifecycle Workflows acting on the results. A source change touches only the boundary." },
  ], { x: 0.9, y: 6.0, w: 11.6, h: 0.7, fontSize: 15, valign: "middle" });
  s.addNotes(
`[8:45–10:00]  How the data moves.

One governed path. On the left, the authoritative source. Then a boundary transformation that's specific to that source and deliberately replaceable. In the middle — highlighted — the governed identity model, which is the durable contract. Then one provisioning service, and the target services.

The design point: a source change touches only the boundary. When SSA moves to Core HCM, the transformation changes; the model, the lifecycle rules and the access policy don't.

And every event gets five duties. Validate, failing closed. Sequence, because a mover applied after a leaver is a correctness bug. Normalize to one payload. Write a provenance record before the call returns — no record, no verifiable outcome. And reconcile: read the result back, match it to the event, and give every failure an owner and an alternate completion path.

On the Microsoft stack this is API-driven inbound provisioning into Entra ID and AD, with Lifecycle Workflows acting on the results — but the duties are product-neutral.`);
}

// ------------------------------------------------------------------ 9 Measure
{
  const s = content("Data quality becomes drift, metrics and evidence", "Operations");
  const tiles = [
    ["Separation-to-block", "HR effective time → sign-in disabled and sessions revoked"],
    ["Correlation coverage", "Enabled accounts that resolve to a current person record"],
    ["Joiner readiness", "New hires with account and baseline access on day one"],
    ["Derivation purity", "Access granted by rule rather than by hand"],
  ];
  tiles.forEach((t, i) => {
    const x = 0.6 + (i % 2) * 3.1, y = 1.55 + Math.floor(i / 2) * 1.7;
    box(s, `Metric ${i + 1}`, x, y, 2.95, 1.55, HEX.tealTint);
    txt(s, `Metric ${i + 1} text`, [
      { text: t[0], options: { bold: true, color: HEX.teal, fontSize: 18, breakLine: true } },
      { text: t[1], options: { fontSize: 14 } },
    ], { x: x + 0.25, y: y + 0.15, w: 2.5, h: 1.3, paraSpaceAfter: 4 });
  });
  box(s, "Drift card", 0.6, 5.0, 6.05, 1.7, HEX.redTint);
  txt(s, "Drift text", [
    { text: "Drift classes, each with a signal and an owner", options: { bold: true, color: HEX.red, fontSize: 16, breakLine: true } },
    { text: "Missing identity  ·  Stale access  ·  Orphan account  ·  Attribute drift  ·  Unauthorized write  ·  Credential drift", options: { fontSize: 14 } },
  ], { x: 0.85, y: 5.15, w: 5.6, h: 1.45, paraSpaceAfter: 6 });
  const rows = [
    ["AC-2", "Every account traces to a person record and a rule"],
    ["PS-4", "Separation starts a timed, reconciled leaver sequence"],
    ["PS-5", "A transfer re-derives access and opens a review"],
    ["IA-4", "Layered keys survive rehire and conversion"],
    ["SI-12", "Lineage from the HR record to every consumer"],
  ];
  txt(s, "Controls heading", "Evidence for NIST SP 800-53 controls", { x: 6.95, y: 1.55, w: 5.8, h: 0.45, fontSize: 18, bold: true, color: HEX.navy, fontFace: "Cambria" });
  s.addTable([head(["Control", "Architecture contribution"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([1.25, 4.55], { x: 6.95, y: 2.1, h: 3.3, fontSize: 14 }));
  txt(s, "Controls caveat", [
    { text: "Supports the controls; doesn’t close them. ", options: { bold: true, color: HEX.amber } },
    { text: "Agency policy, parameters, procedures and assessment still apply." },
  ], { x: 6.95, y: 5.6, w: 5.8, h: 0.9, fontSize: 14 });
  s.addNotes(
`[10:00–11:15]  How we measure it.

Once events flow through one governed path, data quality stops being an annual cleanup and becomes a set of numbers. Four I'd report on the continuous-monitoring cadence: separation-to-block — the time from the HR effective date to sign-in disabled and sessions revoked; correlation coverage — what share of enabled accounts resolve to a current person; joiner readiness on day one; and derivation purity — how much access is granted by rule rather than by hand.

Drift is any difference between the authoritative record and a consumer: missing identities, stale access, orphan accounts, attribute drift, unauthorized writes. Each has a detection signal and an owner.

On the right, the evidence those same records produce for AC-2, PS-4, PS-5, IA-4 and SI-12. One thing I'm careful about: the architecture supports these controls — it doesn't close them on its own. Agency policy, organization-defined parameters, procedures and assessment still have to be there. I'd rather tell an assessor exactly what the data proves than overclaim.`);
}

// ------------------------------------------------------------------ 10 Delivery
pres.addSection({ title: "Delivery" });
{
  const s = content("Deliver in gated phases, timed to SSA’s Wave 2 move", "Delivery");
  const ph = [
    ["0", "Align", "Integration inventory signed"],
    ["1", "Authority and schema", "Authority map, identifier decision, data fixed at source"],
    ["2", "Build and test", "Joiner, mover, leaver end to end with evidence"],
    ["3", "Pilot in shadow mode", "Every difference explained before it acts"],
    ["4", "Automate lifecycle", "Leavers first; access derived by rule"],
    ["5", "Cut over to cloud", "Per population, as Core HCM goes live"],
    ["6", "Sustain", "Metrics on the monitoring cadence"],
  ];
  const w = 1.6, gap = 0.155;
  link(s, 0.6 + w / 2, 2.55, 6 * (w + gap), 0);
  ph.forEach((p, i) => {
    const x = 0.6 + i * (w + gap);
    const c = i === 1 ? HEX.amber : i === 5 ? HEX.teal : HEX.navy;
    s.addShape(pres.shapes.OVAL, { objectName: `Phase ${p[0]} badge`, x: x + w / 2 - 0.35, y: 2.2, w: 0.7, h: 0.7, fill: { color: c }, line: { color: "FFFFFF", width: 2 } });
    txt(s, `Phase ${p[0]} number`, p[0], { x: x + w / 2 - 0.35, y: 2.2, w: 0.7, h: 0.7, fontSize: 22, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Cambria" });
    txt(s, `Phase ${p[0]} text`, [
      { text: p[1], options: { bold: true, color: c, fontSize: 15, breakLine: true } },
      { text: "Gate: ", options: { bold: true, fontSize: 13, color: HEX.slate } },
      { text: p[2], options: { fontSize: 13 } },
    ], { x, y: 3.15, w, h: 1.9, align: "center", paraSpaceAfter: 4 });
  });
  box(s, "Delivery note 1", 0.6, 5.3, 5.95, 1.4, HEX.amberTint);
  txt(s, "Delivery note 1 text", [
    { text: "Phases 1 and 2 are invisible to users. ", options: { bold: true, color: HEX.amber } },
    { text: "That is why programs skip them — and then automate against data nobody agreed to trust." },
  ], { x: 0.9, y: 5.42, w: 5.4, h: 1.15, fontSize: 15, valign: "middle" });
  box(s, "Delivery note 2", 6.8, 5.3, 5.95, 1.4, HEX.tealTint);
  txt(s, "Delivery note 2 text", [
    { text: "Gates are proposed, then risk-approved. ", options: { bold: true, color: HEX.teal } },
    { text: "Thresholds are set by agency governance and tiered by population risk." },
  ], { x: 7.1, y: 5.42, w: 5.4, h: 1.15, fontSize: 15, valign: "middle" });
  s.addNotes(
`[11:15–12:45]  How I'd deliver it.

Seven phases, each with an exit gate that is the next phase's precondition.

Phase 0 aligns with the Federal HR 2.0 preparation actions — that's compliance, not overhead. Phase 1, in amber, is the one that matters most to a data architect: sign the authority map, record the identifier decision, and fix data at the source. Phase 2 builds and proves joiner, mover and leaver end to end with evidence in a test tenant. Phase 3 runs a pilot in shadow mode — the pipeline computes what it would do, and every difference is explained before it's allowed to act. Phase 4 automates lifecycle, leavers first, because that's where the risk is. Phase 5, in teal, cuts populations over to cloud-mastered identity as SSA's Core HCM interconnections go live. Phase 6 is sustained measurement.

Two things I've learned. Phases 1 and 2 produce nothing users can see, which is exactly why programs skip them and end up automating against unverified data. And the numbers in the gates — 99 percent correlation, zero missed leavers — are proposed starting criteria. Agency risk governance approves them, ideally tiered so privileged and high-impact populations get tighter thresholds.`);
}

// ------------------------------------------------------------------ 11 Fit
{
  const s = content("What I bring to Data Strategy and Enablement", "Delivery");
  const items = [
    ["Enterprise data models", "Logical and physical models with a governed crosswalk, not connector-by-connector mappings"],
    ["Data governance", "Authority maps, owners, definitions, controlled values and correction paths"],
    ["Metadata and lineage", "Provenance designed in at the source, so lineage is emitted rather than reconstructed"],
    ["Data quality", "Drift classes, detection signals and metrics on the monitoring cadence"],
    ["Architecture review", "Source-independent designs that survive platform changes like Core HCM"],
    ["Clear communication", "A published modernization workbook written for program teams and leadership"],
  ];
  items.forEach((it, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.1, y = 1.55 + row * 2.05;
    box(s, `Strength ${i + 1}`, x, y, 3.95, 1.85, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Strength ${i + 1} text`, [
      { text: it[0], options: { bold: true, color: i % 2 ? HEX.teal : HEX.navy, fontSize: 18, breakLine: true } },
      { text: it[1], options: { fontSize: 14 } },
    ], { x: x + 0.25, y: y + 0.2, w: 3.5, h: 1.5, paraSpaceAfter: 6 });
  });
  box(s, "First 90 days", 0.6, 5.75, 12.15, 0.95, "FFFFFF", HEX.amber);
  txt(s, "First 90 days text", [
    { text: "First 90 days:  ", options: { bold: true, color: HEX.amber } },
    { text: "inventory authoritative sources  ·  publish the authority map  ·  stand up one measured pilot" },
  ], { x: 0.9, y: 5.82, w: 11.6, h: 0.8, fontSize: 17, valign: "middle" });
  s.addNotes(
`[12:45–14:30]  How this maps to the position.

The position is about enterprise data architecture in service of SSA's lines of business, so let me close on what I'd bring.

Enterprise data models: logical and physical, with one governed crosswalk instead of connector-by-connector mappings. Data governance: authority maps with owners, definitions, controlled values and correction paths. Metadata and lineage: provenance designed in at the source, so lineage is emitted where data originates rather than reconstructed afterward. Data quality: drift classes, detection signals and metrics on the monitoring cadence. Architecture review: designs that are source-independent, so a platform change like Core HCM is a boundary change, not a redesign. And communication: I maintain a published modernization workbook written for program teams and leadership.

In the first ninety days I'd inventory the authoritative sources for one line of business, publish its authority map, and stand up one measured pilot — so the conversation moves from opinions to numbers.

Thank you. I'm looking forward to your questions.

[Stop by 15:00. If running long, shorten slide 9's control table to one sentence.]`);
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT, n, "slides");
})();
