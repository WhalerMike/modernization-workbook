// Executive cut: Why / What / Who / How in seven slides. EDITION is set by exec_build.py ("SSA" or "ANY").
const E = (ssa, any) => (EDITION === "SSA" ? ssa : any);
const rate = { Strong: [HEX.teal, HEX.tealTint], Partial: [HEX.amber, HEX.amberTint], Weak: [HEX.red, HEX.redTint] };
const tag = (s, t, c) => { // the Why / What / Who / How marker, top-left of each slide
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `Tag ${t}`, x: 0.6, y: 0.12, w: 0.95, h: 0.32, rectRadius: 0.06, fill: { color: c }, line: { color: c } });
  txt(s, `Tag ${t} text`, t.toUpperCase(), { x: 0.6, y: 0.12, w: 0.95, h: 0.32, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", charSpacing: 1 });
};
const bullets = (items, size) => items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < items.length - 1, fontSize: size } }));

// ------------------------------------------------------------------ X1 Title
pres.addSection({ title: "The decision" });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: "The decision" });
  n++;
  s.addText("HR-Driven Identity Modernization", { placeholder: "title" });
  s.addText("Making HR the source of truth for who gets access", { placeholder: "body" });
  txt(s, "Agenda line", [
    { text: "Why", options: { bold: true, color: HEX.red } }, { text: "   ·   " },
    { text: "What", options: { bold: true, color: HEX.navy } }, { text: "   ·   " },
    { text: "Who", options: { bold: true, color: HEX.teal } }, { text: "   ·   " },
    { text: "How", options: { bold: true, color: HEX.amber } },
  ], { x: 0.8, y: 4.45, w: 6.6, h: 0.5, fontSize: 20, color: HEX.slate });
  txt(s, "Presenter", [
    { text: "Mike Stratton", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: E("Digital Identity line of business  ·  GS-14 Enterprise Data Architect  ·  Data Strategy and Enablement",
      "Enterprise data architecture  ·  Digital identity modernization"), options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 11.7, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:20]  Good morning, and thank you.

I have one proposal, and I'll take it through four questions, the way I'd take it to leadership: why it matters, what we should do, who has to be involved, and how we'd carry it out and know it's working.

Workbook: HR-Driven Identity, Chapter 00 — Overview and Applicability.`);
}

// ------------------------------------------------------------------ X2 Why
{
  const s = content("Identity is built by hand — and the mission is outgrowing it", "The decision");
  tag(s, "Why", HEX.red);
  txt(s, "Today head", E("TODAY AT SSA: NOTHING CONNECTS HR TO IDENTITY", "TODAY: NOTHING CONNECTS HR TO IDENTITY"),
    { x: 0.6, y: 1.4, w: 6.4, h: 0.35, fontSize: 12, bold: true, color: HEX.slate });
  const today = [
    ["FaUserXmark", "Access outlives the job", HEX.red, E("Removal waits for a ticket. A 2026 OIG audit of separated staff found deficiencies in revoking access.", "Removal waits for a ticket, yet federal standards require revoking credentials at separation.")],
    ["FaAddressBook", "Records we can’t trust", HEX.navy, E("Phone book, managers and approvals drift from HR. I’ve lived it at DITM.", "Phone book, managers and approvals drift from HR.")],
    ["FaUserClock", "Cost and delay", HEX.teal, "Every joiner, mover and leaver is help-desk work."],
  ];
  today.forEach((r, i) => {
    const y = 1.85 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[2]);
    txt(s, `Today ${i + 1}`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 16.5, breakLine: true } },
      { text: r[3], options: { fontSize: 14 } },
    ], { x: 1.4, y, w: 5.55, h: 1.05, paraSpaceAfter: 2 });
  });
  box(s, "Mission box", 7.2, 1.4, 5.55, 3.85, HEX.tealTint);
  icon(s, "FaPeopleArrows", 7.45, 1.6, 0.75, HEX.teal);
  txt(s, "Mission head", [
    { text: "WHERE THE MISSION IS HEADING", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Shared services to the public", options: { bold: true, color: HEX.teal, fontSize: 19, fontFace: "Cambria" } },
  ], { x: 8.4, y: 1.58, w: 4.2, h: 0.85, valign: "middle" });
  txt(s, "Mission text", [
    { text: E("Example: one call center serving SSA and IRS customers. ", "Example: one call center serving two agencies’ customers. "), options: { bold: true, breakLine: true } },
    { text: E("The phones already run in the cloud (Amazon Connect). The hard part is the back end:", "Cloud contact centers make the front end easy. The hard part is the back end:"), options: { breakLine: true } },
    ...bullets(["Who is this agent?", "Which agency’s records may they see?", "Does access end the day they leave — everywhere?"], 15),
  ], { x: 7.5, y: 2.5, w: 5.05, h: 2.2, fontSize: 14.5, paraSpaceAfter: 3 });
  txt(s, "Mission answer", "A standardized, HR-driven identity answers all three by rule.",
    { x: 7.5, y: 4.68, w: 5.05, h: 0.5, fontSize: 14.5, bold: true, color: HEX.teal });
  if (EDITION === "SSA") txt(s, "Why source", "Source: SSA OIG, Insider Threat Program (142302), Sept. 2026; standard: FIPS 201-3.",
    { x: 0.6, y: 5.1, w: 6.4, h: 0.3, fontSize: 10.5, italic: true, color: HEX.slate });
  box(s, "Do nothing", 0.6, 5.5, 12.15, 1.15, "FFFFFF", HEX.amber);
  icon(s, "FaTriangleExclamation", 0.85, 5.66, 0.82, HEX.amber);
  txt(s, "Do nothing text", [
    { text: "If we do nothing: ", options: { bold: true, color: HEX.amber } },
    { text: "HR moves to Oracle Core HCM, identity moves to Entra ID — and we rebuild the same manual process twice, on new platforms." },
  ], { x: 1.9, y: 5.55, w: 10.65, h: 1.05, fontSize: 17, valign: "middle" });
  s.addNotes(
`[0:20–2:30]  Why. ${E("Today, nothing connects HR to identity at SSA.", "In many agencies today, nothing connects HR to identity.")} Accounts, access and credentials are created and removed by ticket, and that costs us three ways.

Access outlives the job: when someone leaves or changes roles, removal waits for a ticket, and a stale account is a security violation that can enable a breach of the public's records. ${E("This isn't hypothetical. Last month OIG's Insider Threat audit sampled people who separated over a year and found deficiencies in disabling their access and revoking their credentials. And when a PIV card can't be collected, the federal standard is to terminate it within eighteen hours.", "Federal standards require revoking a separated person's credentials, and terminating a PIV card that can't be collected within eighteen hours. A ticket-driven process struggles to meet that.")} Records we can't trust: ${E("I've lived this at DITM. The phone book was wrong until someone filed a ticket, and every time I changed managers, my organization, my manager and my access to tools like SAM were updated by hand.", "the phone book is wrong until someone files a ticket, and every change of manager means the organization, the manager and tool access are updated by hand.")} Approvals route through that same data. And cost and delay: every joiner, mover and leaver is help-desk work.

But the bigger why is where the mission is heading. ${E("One idea that's been discussed is a shared call center: one front door for SSA and IRS customers.", "Take one idea agencies have discussed: a shared call center, one front door for two agencies' customers.")} The hard part of an idea like that isn't the phones${E(" — SSA's phones already run on a cloud contact center, Amazon Connect, since 2024", " — cloud contact centers make the front end easy")}. It's the back end. Who is this agent? Which agency's records may they see? And does their access end the day they leave, in both agencies? Today each agency answers those questions by hand, and differently. A standardized, HR-driven identity answers them by rule, the same way everywhere.

And if we do nothing, HR moves to Core HCM, identity moves to Entra ID, and we rebuild the same manual process twice, on new platforms.

Workbook: HR-Driven Identity, Chapter 01 — Why the agency needs HR-driven ICAM now.`);
}

// ------------------------------------------------------------------ X3 What: options
{
  const s = content("Four options, weighed against what leadership must balance", "The decision");
  tag(s, "What", HEX.navy);
  const R = (r) => ({ text: r, options: { bold: true, color: rate[r][0], fill: { color: rate[r][1] }, align: "center" } });
  const O = (k, t, d) => ({ text: [
    { text: `${k}  ${t}`, options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: d, options: { fontSize: 12, color: HEX.slate } }] });
  const rows = [
    [O("A", "Keep ticket-driven identity", "No new investment"), R("Weak"), R("Weak"), R("Partial"), R("Partial"), { text: "The cost of doing nothing" }],
    [O("B", "Automate inside the directories", "Scripts and exports, no HR authority"), R("Partial"), R("Partial"), R("Partial"), R("Weak"), { text: "Automates a source that isn’t authoritative" }],
    [O("C", "Wait for HR 2.0, integrate later", "Less work this year"), R("Partial"), R("Weak"), R("Partial"), R("Strong"), { text: "Defensible — but misses the design window" }],
    [O("D", "Start now: HR is the source of truth", "On OPM standard data, built into both migrations"), R("Strong"), R("Strong"), R("Partial"), R("Strong"), { text: "Recommended, phased", options: { bold: true, color: HEX.teal } }],
  ];
  s.addTable([head(["Option", "Mission and the public", "Security", "Cost", "Resilience", "Bottom line"]), ...rows],
    tableOpts([3.75, 1.75, 1.35, 1.35, 1.45, 2.5], { y: 1.45, fontSize: 14, rowH: [0.5, 0.82, 0.82, 0.82, 0.82] }));
  box(s, "Judgment", 0.6, 5.55, 12.15, 1.15, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.85, 5.73, 0.8, HEX.amber);
  txt(s, "Judgment text", [
    { text: "The judgment call: ", options: { bold: true, color: HEX.amber } },
    { text: "if HR 2.0 slipped a long way, C becomes reasonable. But D’s first step — data standards, ownership and the person key — is no-regret either way." },
  ], { x: 1.9, y: 5.6, w: 10.65, h: 1.05, fontSize: 17, valign: "middle" });
  s.addNotes(
`[2:30–5:30]  What should we do? There are four realistic options, and I've weighed each against what leadership actually has to balance: the mission and the public we serve, security, cost and resilience. Compliance matters, but on its own it isn't a reason to invest.

Option A is to keep ticket-driven identity. It needs no new investment, but the risk and the recurring manual work stay exactly where they are. That's the cost of doing nothing.

Option B is to automate inside the directories, with scripts and exports. It's quick and cheap, but it automates a source that isn't authoritative, so it spreads bad data faster, and it has to be rebuilt when HR changes platforms.

Option C is to wait for HR 2.0 and integrate afterward. That's defensible: it's less work this year. But the interconnection decisions are made during onboarding, about five months in. Waiting means retrofitting after go-live, and the Entra ID migration carries the tickets forward in the meantime.

Option D is to start now: make HR the source of truth, expressed in OPM's standard personnel data, and design it into both the HR onboarding and the Entra ID migration. It costs design effort up front and needs shared governance, which is why it scores only partial on cost.

The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step — data standards, ownership and the person key — is no-regret either way, and it can start today from ${E("the HR operational data store SSA already runs", "the HR data the agency already has")}, with the source switched to Core HCM when it arrives.

Workbook: HR-Driven Identity, Chapter 00 — Why now; Why together; Chapter 02 — Why this is the opportunity, not the project.`);
}

// ------------------------------------------------------------------ X4 What: recommendation
{
  const s = content("Recommendation: HR as the source of truth, starting now", "The decision");
  tag(s, "What", HEX.navy);
  const reasons = [
    ["FaUsersGear", "Mission and the public", HEX.navy, HEX.navyTint, "Access to the public’s records ends when the role ends. Staff have the right access on day one. Shared services become possible."],
    ["FaChartLine", "Cost", HEX.teal, HEX.tealTint, "Build it once, while both platforms are rebuilt anyway. Retire ticket work for routine joiners, movers and leavers."],
    ["FaShieldHalved", "Security", HEX.red, HEX.redTint, "Modern access is decided by attributes, so accurate HR data becomes accurate access. Mandates are the floor, not the reason."],
    ["FaArrowsRotate", "Resilience", HEX.amber, HEX.amberTint, E("OPM’s standard data and a person key we control — the Mainframe PIN — survive the next platform change.",
      "OPM’s standard data and a person key the agency controls survive the next platform change.")],
  ];
  reasons.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.45 + row * 1.9;
    box(s, `Reason ${i + 1}`, x, y, 6.0, 1.75, r[3]);
    icon(s, r[0], x + 0.25, y + 0.3, 0.75, r[2]);
    txt(s, `Reason ${i + 1} text`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: r[4], options: { fontSize: 15 } },
    ], { x: x + 1.2, y: y + 0.17, w: 4.6, h: 1.45, paraSpaceAfter: 3 });
  });
  box(s, "Limits", 0.6, 5.35, 6.0, 1.35, "FFFFFF", HEX.slate);
  txt(s, "Limits text", [
    { text: "Honest limits: ", options: { bold: true, color: HEX.slate } },
    { text: "HR 2.0 covers federal employees only — contractors need their own source (Core HCM contingent worker, or PIV sponsorship). Build only what HR is authoritative for." },
  ], { x: 0.85, y: 5.4, w: 5.6, h: 1.25, fontSize: 14, valign: "middle" });
  box(s, "Upside", 6.72, 5.35, 6.03, 1.35, "FFFFFF", HEX.teal);
  txt(s, "Upside text", [
    { text: "The upside: ", options: { bold: true, color: HEX.teal } },
    { text: "every agency is moving to the same HR platform on the same standards — one identity standard can serve them all, and the services they share." },
  ], { x: 6.97, y: 5.4, w: 5.6, h: 1.25, fontSize: 14, valign: "middle" });
  s.addNotes(
`[5:30–8:00]  My recommendation is option D, phased, starting with the no-regret steps. Four reasons.

Mission and the public: access to the public's records should end when a person's role ends, automatically, the same day; the people who serve the public should have the right access on day one; and shared services like the call center become possible, because every agency describes its people the same way.

Cost: we build it once, while both platforms are being rebuilt anyway, and retire ticket work for routine joiners, movers and leavers.

Security: modern access, Zero Trust, is decided by attributes: organization, position, status, supervisor. So the accuracy of HR data becomes the accuracy of access. The federal mandates point the same way, but they're the floor, not the reason. ${E("And it builds on real progress: this year's FISMA audit moved identity and access management up to Level 4, and its open recommendation is to keep improving user-account oversight. This is how.", "And it gives the inspector general's perennial question — how do you know every account belongs to a current person? — a standing answer.")}

Resilience: by building on OPM's standard data rather than one vendor's fields, and on a person key ${E("we control — the Mainframe PIN, which is already our person ID and employee ID —", "the agency controls — often an existing enterprise ID, such as a Mainframe PIN —")} the design survives the next platform change.

Two honest limits. HR 2.0 covers federal employees only, so contractors need their own source: Core HCM's contingent worker record, or PIV sponsorship. And we should build only what HR is authoritative for.

The upside: every agency is moving to the same HR platform on the same standards, so one identity standard can serve them all, and the services they share.

Workbook: HR-Driven Identity, Chapter 01 — Why the agency needs HR-driven ICAM now; Chapter 03 — Attribute Authority; Chapter 05 — Contractors and vendors.`);
}

// ------------------------------------------------------------------ X5 Who
pres.addSection({ title: "Making it real" });
{
  const s = content("Who: the owners, the partners, and my role", "Making it real");
  tag(s, "Who", HEX.teal);
  const cols = [
    ["FaBuildingColumns", "Owns the data", HEX.navy, HEX.navyTint, [
      ["HR", "Personnel data and its quality, at the source"],
      ["OPM HR 2.0 program", "The platform, the standards, the interconnection"]]],
    ["FaUsersGear", "Uses the data", HEX.teal, HEX.tealTint, [
      ["CIO identity team", "Entra ID, Active Directory and access"],
      ["Security", "Zero Trust policy and the leaver path"],
      ["Help desk", "Exceptions, not routine tickets"]]],
    ["FaShieldHalved", "Guards and partners", HEX.amber, HEX.amberTint, [
      ["Privacy office", "Routine use and minimization, from the start"],
      ["Contractor sponsors and PIV", "The source for non-employees"],
      ["Partner agencies", E("One standard for shared services — e.g. IRS", "One standard for shared services")]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.4, 3.95, 3.85, c[3]);
    icon(s, c[0], x + 0.22, 1.58, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.58, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [
      { text: r[0], options: { bold: true, color: c[2], breakLine: true } },
      { text: r[1], options: { breakLine: k < c[4].length - 1 } },
    ]), { x: x + 0.25, y: 2.35, w: 3.5, h: 2.8, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  box(s, "My role", 0.6, 5.45, 12.15, 1.25, "FFFFFF", HEX.navy);
  icon(s, "FaSitemap", 0.85, 5.66, 0.82, HEX.navy);
  txt(s, "My role text", [
    { text: "My role as enterprise data architect: ", options: { bold: true, color: HEX.navy } },
    { text: "own the standards, the crosswalk and the person key; give every attribute one accountable owner; and carry the standard to interagency committees and working groups." },
  ], { x: 1.9, y: 5.5, w: 10.65, h: 1.15, fontSize: 16, valign: "middle" });
  s.addNotes(
`[8:00–10:00]  Who has to be involved. This is an organizational change as much as a technical one, so it matters who owns what.

HR owns the personnel data and its quality, at the source. When the data is wrong, it gets fixed in HR, not patched in the directory. And the OPM HR 2.0 program owns the platform, the standards and the interconnection.

The CIO's identity team uses that data to run Entra ID, Active Directory and access. Security sets the Zero Trust policy and owns the leaver path. And the help desk moves from routine tickets to handling the exceptions.

Then the guards and partners. The privacy office is in from the start, because using HR data for identity is a disclosure that needs a routine use and minimization. Contractor sponsors and the PIV office are the source for people HR doesn't cover. And partner agencies${E(", like IRS for a shared call center,", "")} need the same standard if we're going to share services.

My role, as an enterprise data architect, is to own the standards, the crosswalk and the person key; to make sure every attribute has one accountable owner; and to carry the standard to the interagency committees and working groups where it gets adopted. ${E("It also contributes to a FY2026 FISMA finding: SSA lacks a comprehensive inventory of its data and metadata, and the person model and its attributes are a governed piece of that inventory.", "The person model and its attributes also become a governed piece of the agency's data and metadata inventory, which auditors increasingly ask for.")}

Workbook: HR-Driven Identity, Chapter 03 — Attribute Authority; Appendix B — Security and Privacy Assessment.`);
}

// ------------------------------------------------------------------ X6 How: carry it out
{
  const s = content("How: data, security and operations", "Making it real");
  tag(s, "How", HEX.amber);
  const q = [
    ["FaDatabase", "Data", HEX.teal, HEX.tealTint, ["One governed crosswalk: OPM standard data to a person model", E("Keyed on the Mainframe PIN, so a person stays one person", "Keyed on an enterprise ID the agency controls"), "Personnel actions drive joiner, mover, leaver by code", "Contractors from their own source, same model"]],
    ["FaLock", "Security", HEX.red, HEX.redTint, ["Leavers: block access first, within hours, then clean up", "Least privilege; no stored secrets", "Failures quarantined with an owner — nothing auto-resolves"]],
    ["FaRoute", "Operations", HEX.amber, HEX.amberTint, [E("Start now from the HR Operational Data Store; switch the source at Core HCM", "Start now from today's HR data; switch the source at Core HCM"), "Shadow mode first: compare HR with the directories", "Cut over one population at a time", "Close the ticket path only when the data proves it"]],
  ];
  q.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `How col ${i + 1}`, x, 1.4, 3.95, 3.75, c[3]);
    icon(s, c[0], x + 0.22, 1.58, 0.62, c[2]);
    txt(s, `How head ${i + 1}`, c[1], { x: x + 1.0, y: 1.58, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `How text ${i + 1}`, bullets(c[4], 15), { x: x + 0.25, y: 2.4, w: 3.5, h: 2.65, paraSpaceAfter: 6 });
  });
  txt(s, "Stack label", "EXAMPLE STACK", { x: 0.6, y: 5.6, w: 1.6, h: 0.6, fontSize: 11, bold: true, color: HEX.slate, valign: "middle" });
  const stack = ["Oracle Core HCM", "Entra ID HR-driven provisioning", "Entra ID and Active Directory", "Access packages, lifecycle workflows, PIV"];
  const SW = 2.35, SG = 0.32;
  stack.forEach((t, i) => {
    const x = 2.2 + i * (SW + SG);
    box(s, `Stack ${i + 1}`, x, 5.65, SW, 0.55, "FFFFFF", HEX.line);
    txt(s, `Stack ${i + 1} text`, t, { x: x + 0.08, y: 5.65, w: SW - 0.16, h: 0.55, fontSize: 12, align: "center", valign: "middle", color: HEX.ink });
    if (i < stack.length - 1) arrow(s, x + SW + 0.03, 5.925, SG - 0.06, 0);
  });
  s.addNotes(
`[10:00–13:00]  How we'd carry it out.

Data — this is where data architecture earns its keep. One governed crosswalk maps OPM's standard data elements into a canonical person model, keyed on ${E("the Mainframe PIN", "an enterprise ID the agency controls")}, so a person stays the same person across rehire, conversion and reorganization, and when HR changes platforms only the source key changes. Personnel actions then drive the identity events — joiner, mover, leaver — by code, not by ticket. Contractors come from their own source into the same model.

Security. The leaver path blocks access first, within hours, and cleans up afterward. The integration runs with least privilege and no stored secrets. And anything that fails goes to a quarantine with an owner; nothing resolves itself silently.

Operations. We start now, from ${E("the HR Operational Data Store SSA already runs", "the HR data the agency already has")}, and switch the source to Core HCM when it arrives. We run in shadow mode first, comparing what HR says with what the directories hold, and fixing the gaps. We cut over one population at a time. And we close the ticket path for a population only when the data proves HR is the sole source.

The technology is the example, not the point. Here it's Oracle Core HCM feeding Microsoft's HR-driven provisioning into Entra ID and Active Directory, with access packages, lifecycle workflows and PIV downstream. If the vendors change, the design holds.

Workbook: HR-Driven Identity, Chapter 04 — Logical architecture and Microsoft realization; Chapter 05 — The standard-attribute layer; Chapter 07 — The canonical leaver sequence; Chapter 10 — Execution Plan.`);
}

// ------------------------------------------------------------------ X7 How: measure + ask
{
  const s = content("How we’ll know it works — and what I need", "Making it real");
  tag(s, "How", HEX.amber);
  txt(s, "Measures head", "MEASURES, BASELINED IN THE FIRST PHASE", { x: 0.6, y: 1.4, w: 6.6, h: 0.35, fontSize: 12, bold: true, color: HEX.slate });
  const m = [
    ["FaUserXmark", "Separation to blocked access", "Within hours — PIV termination standard is 18 hours", HEX.red],
    ["FaFingerprint", "Accounts tied to a person", "Orphaned accounts trend to zero", HEX.navy],
    ["FaUserClock", "Joiner and mover tickets", "Volume down; access on day one", HEX.teal],
    ["FaAddressBook", "Directory accuracy", "Manager and organization match HR", HEX.navy],
    ["FaTriangleExclamation", "Exceptions", "Each has an owner and an age", HEX.amber],
  ];
  m.forEach((r, i) => {
    const y = 1.85 + i * 0.86;
    box(s, `Measure ${i + 1}`, 0.6, y, 6.6, 0.76, i % 2 ? "FFFFFF" : HEX.grey, HEX.line);
    icon(s, r[0], 0.75, y + 0.11, 0.54, r[3]);
    txt(s, `Measure ${i + 1} text`, [
      { text: r[1], options: { bold: true, color: r[3], fontSize: 15.5, breakLine: true } },
      { text: r[2], options: { fontSize: 13.5 } },
    ], { x: 1.45, y: y + 0.04, w: 5.6, h: 0.7, valign: "middle" });
  });
  box(s, "Ask box", 7.45, 1.4, 5.3, 5.3, HEX.amberTint);
  icon(s, "FaLightbulb", 7.7, 1.6, 0.75, HEX.amber);
  txt(s, "Ask head", "What I’d need from leadership", { x: 8.6, y: 1.6, w: 4.0, h: 0.75, bold: true, color: HEX.amber, fontSize: 19, fontFace: "Cambria", valign: "middle" });
  txt(s, "Ask text", [
    { text: "One decision: ", options: { bold: true, color: HEX.navy } },
    { text: "start HR-driven identity now, as a design requirement of the HR 2.0 onboarding and the Entra ID migration.", options: { breakLine: true } },
    ...bullets(["A sponsor across HR, the CIO’s identity team and privacy",
      "Identity named as a consumer in the HR 2.0 interconnection plan",
      E("Data owners designated; the Mainframe PIN confirmed as the person key", "Data owners designated; the enterprise person key confirmed"),
      "A small team for the pre-onboarding data work"], 14.5),
  ], { x: 7.7, y: 2.55, w: 4.85, h: 4.0, fontSize: 15, paraSpaceAfter: 6 });
  s.addNotes(
`[13:00–15:00]  How we'll know it's working, and what I'd need.

Five measures, each baselined in the first phase, and each one a business measure leadership can read: time from separation to blocked access, in hours, well inside the eighteen-hour federal standard for terminating a PIV card; accounts tied to a person, with orphaned accounts trending to zero; joiner and mover tickets going down, with access ready on day one; the manager and organization in the directory matching HR; and every exception with an owner and an age. As a byproduct, the same data is evidence for the controls auditors ask about.

What I'd need from leadership is one decision: start HR-driven identity now, as a design requirement of the HR 2.0 onboarding and the Entra ID migration. And to act on it: a sponsor across HR, the CIO's identity team and privacy; identity named as a consumer in the HR 2.0 interconnection plan; data owners designated, and ${E("the Mainframe PIN confirmed as the enterprise person key", "the enterprise person key confirmed")}; and a small team for the pre-onboarding data work.

Thank you. I look forward to your questions.

Workbook: HR-Driven Identity, Chapter 09 — Drift, Metrics and Evidence; Chapter 10 — Execution Plan.`);
}
