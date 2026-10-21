// Book 03 — HR-Driven Identity: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b03-hr-identity/build.js presentations/b03-hr-identity/B03_HR_Identity.pptx
// Framing follows the agency-neutral interview deck (presentations/hr-driven-identity-interview/);
// every fact comes from a footnoted chapter of docs/books/b03-hr-identity/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 03", title: "HR-Driven Identity" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B03_HR_Identity.pptx";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why HR decides", "Why Should HR Decide Who Exists?", "Book 03 — HR-Driven Identity");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's proposal and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:30]  This briefing comes from Book 03 of the Federal Modernization Workbook, HR-Driven Identity.

It has one proposal, and I'll take it through four questions, the way I'd take it to leadership: why it matters, what we should do, who has to be involved, and how we'd carry it out and know it's working.

Book 02 made the case that identity is now where every access decision is made. This book asks where the facts behind that identity should come from. The answer is the HR system of record, starting now.

Workbook: Book 03, index and Chapter 01.`);
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why HR decides", "Identity is built by hand, and the mission is outgrowing it");
  tag(s, "Why");
  txt(s, "Today head", "TODAY: NOTHING CONNECTS HR TO IDENTITY", { x: 0.6, y: 1.55, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const today = [
    ["FaUserXmark", "Access outlives the job", HEX.red, "Removal waits for a ticket — yet a PIV card that can't be collected must be terminated within 18 hours of notification."],
    ["FaAddressBook", "Records we can't trust", HEX.navy, "Phone book, managers and approval routing drift from HR."],
    ["FaUserClock", "Cost and delay", HEX.teal, "Every joiner, mover and leaver is help-desk work."],
  ];
  today.forEach((r, i) => {
    const y = 1.95 + i * 1.08;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[2]);
    txt(s, `Today ${i + 1}`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 16.5, breakLine: true } },
      { text: r[3], options: { fontSize: 14 } },
    ], { x: 1.4, y, w: 5.6, h: 1.02 });
  });
  box(s, "Token box", 7.25, 1.55, 5.5, 3.65, HEX.tealTint);
  icon(s, "FaIdCard", 7.5, 1.78, 0.75, HEX.teal);
  txt(s, "Token head", [
    { text: "THE GAP ZERO TRUST EXPOSES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "A token proves who signed it — not that it's true", options: { bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.45, y: 1.72, w: 4.15, h: 0.95, valign: "middle" });
  txt(s, "Token text", bullets([
    "Does this person still work here?",
    "Do they still hold the position the access was granted for?",
    "Who do they report to today?",
  ], 15), { x: 7.55, y: 2.85, w: 5.0, h: 1.6, paraSpaceAfter: 6 });
  txt(s, "Token close", "Those are workforce facts. They live in HR.", { x: 7.55, y: 4.55, w: 5.0, h: 0.5, fontSize: 15, bold: true, color: HEX.teal });
  callout(s, "Do nothing", 5.45, 1.05, "FaTriangleExclamation", HEX.amber, "If we do nothing: ",
    "HR moves to Core HCM, identity moves to Entra ID — and we rebuild the same manual process twice, on new platforms.");
  sources(s, "Sources: FIPS 201-3 (PIV termination); NIST SP 800-53 PS-4, AC-2. Book 03, Chapters 01–02 and 07.");
  s.addNotes(
`[0:30–1:37]  Why. In many agencies today, nothing connects HR to identity. Accounts, access and credentials are created and removed by ticket, and that costs three ways.

Access outlives the job. When someone leaves or changes roles, removal waits for a ticket. Yet the federal PIV standard, FIPS 201-3, requires a card that can't be collected to be terminated within eighteen hours of notification. A ticket-driven process struggles to meet that. Records drift: the phone book, the manager and the approval routing are wrong until someone files a ticket. And every joiner, mover and leaver is help-desk work.

Zero Trust makes the gap visible. A token proves cryptographically who signed it. It can't prove the claim is true: that the person still works here, still holds the position the access was granted for, still reports to the supervisor who approved it. Those are workforce facts, and they live in HR.

If we do nothing, HR moves to Core HCM, identity moves to Entra ID, and we rebuild the same manual process twice, on new platforms.

Workbook: Book 03, Chapters 01 and 02; Chapter 07 for the PIV office.`);
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why HR decides", "Why now: two migrations open one design window");
  tag(s, "Why");
  const cols = [
    ["FaBuildingColumns", "Federal HR 2.0", HEX.navy, HEX.navyTint, [
      "OMB/OPM memo, December 10, 2025: one government-wide Core HCM",
      "OPM awarded the platform contract June 10, 2026",
      "First agencies begin as FY 2027 starts; onboarding about 8 months, interconnections live around month 5"]],
    ["FaCloudArrowUp", "The Entra ID migration", HEX.teal, HEX.tealTint, [
      "Identity moves from Active Directory to Entra ID anyway (Book 02)",
      "Attributes now drive Conditional Access, groups and delegation",
      "Inbound provisioning from HR is a supported, documented path"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.2;
    box(s, `Col ${i}`, x, 1.55, 4.05, 3.6, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Col ${i} head`, c[1], { x: x + 1.0, y: 1.72, w: 2.9, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Col ${i} text`, bullets(c[4], 14.5), { x: x + 0.25, y: 2.5, w: 3.6, h: 2.6, paraSpaceAfter: 7 });
  });
  box(s, "Window", 9.0, 1.55, 3.75, 3.6, "FFFFFF", HEX.amber);
  icon(s, "FaDoorOpen", 9.25, 1.72, 0.62, HEX.amber);
  txt(s, "Window head", "The window", { x: 10.05, y: 1.72, w: 2.6, h: 0.62, bold: true, color: HEX.amber, fontSize: 19, fontFace: "Cambria", valign: "middle" });
  txt(s, "Window text", "The identity feed has to be designed in during onboarding — before the agency's interconnection goes live — not bolted on after.",
    { x: 9.25, y: 2.5, w: 3.3, h: 2.5, fontSize: 14.5 });
  callout(s, "Limit", 5.4, 1.1, "FaScaleBalanced", HEX.slate, "Honest limit: ",
    "Federal HR 2.0 covers federal employees only. Contractors need their own authoritative source — decided during the same onboarding.");
  sources(s, "Sources: OMB/OPM, Creating \"Federal HR 2.0\" (Dec. 10, 2025); OPM award (June 10, 2026). Book 03, Chapter 03.");
  s.addNotes(
`[1:37–2:48]  Why now? Because two migrations open one design window.

On the HR side: the December 10, 2025 memo from OMB and OPM creates Federal HR 2.0, one government-wide core human capital platform. OPM awarded the platform contract on June 10, 2026, and the first agencies begin moving as fiscal year 2027 starts. The memo's sample timeline runs about eight months per agency, with the agency's interconnections going live around month five.

On the identity side: agencies are moving from Active Directory to Entra ID anyway, which is Book 02. In Entra ID, attributes drive Conditional Access, groups and delegation, and inbound provisioning from an HR system is a documented, supported path.

So there's a window. The identity feed has to be designed in during onboarding, before the interconnection goes live, not bolted on afterward.

One honest limit: Federal HR 2.0 covers federal employees only. Contractors and vendors need their own authoritative source, and the onboarding is the right time to decide it too.

Workbook: Book 03, Chapter 03 — Federal HR 2.0 and the Core HCM Platform.`);
}

// ------------------------------------------------------------------ What 1: options
{
  const s = D.content("What we should do", "Four options, weighed against what leadership must balance");
  tag(s, "What");
  const rate = { Strong: [HEX.teal, HEX.tealTint], Partial: [HEX.amber, HEX.amberTint], Weak: [HEX.red, HEX.redTint] };
  const R = (r) => ({ text: r, options: { bold: true, color: rate[r][0], fill: { color: rate[r][1] }, align: "center" } });
  const O = (k, t, d) => ({ text: [
    { text: `${k}  ${t}`, options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: d, options: { fontSize: 12, color: HEX.slate } }] });
  const rows = [
    [O("A", "Keep ticket-driven identity", "No new investment"), R("Weak"), R("Weak"), R("Partial"), R("Partial"), { text: "The cost of doing nothing" }],
    [O("B", "Automate inside the directories", "Scripts and exports, no HR authority"), R("Partial"), R("Partial"), R("Partial"), R("Weak"), { text: "Automates a source that isn't authoritative" }],
    [O("C", "Wait for HR 2.0, integrate later", "Less work this year"), R("Partial"), R("Weak"), R("Partial"), R("Strong"), { text: "Defensible — but misses the design window" }],
    [O("D", "Start now: HR is the source of truth", "On OPM standard data, built into both migrations"), R("Strong"), R("Strong"), R("Partial"), R("Strong"), { text: "Recommended, phased", options: { bold: true, color: HEX.teal } }],
  ];
  s.addTable([head(["Option", "Mission", "Security", "Cost", "Resilience", "Bottom line"]), ...rows],
    tableOpts([3.85, 1.45, 1.4, 1.3, 1.5, 2.65], { y: 1.55, fontSize: 14, rowH: [0.5, 0.8, 0.8, 0.8, 0.8] }));
  callout(s, "Judgment", 5.5, 1.1, "FaLightbulb", HEX.amber, "The judgment call: ",
    "if HR 2.0 slipped a long way, C becomes reasonable. But D's first step — data standards, ownership and the person key — is no-regret either way.");
  sources(s, "Program assessment; ratings are the book's judgment, not external fact. Book 03, Chapters 01 and 03.");
  s.addNotes(
`[2:48–4:07]  What should we do? There are four realistic options, weighed against what leadership has to balance: the mission and the public, security, cost and resilience. Compliance matters, but on its own it isn't a reason to invest.

Option A keeps ticket-driven identity. No new investment, but the risk and the manual work stay where they are: the cost of doing nothing.

Option B automates inside the directories with scripts and exports. It's quick and cheap, but it automates a source that isn't authoritative, so it spreads bad data faster, and it has to be rebuilt when HR changes platforms.

Option C waits for HR 2.0 and integrates afterward. That's defensible, and it's less work this year. But the interconnection decisions are made during onboarding, so waiting means retrofitting after go-live.

Option D starts now: HR as the source of truth, expressed in OPM's standard personnel data and designed into both the HR onboarding and the Entra ID migration. It costs design effort up front and needs shared governance, which is why it's only partial on cost.

The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step, data standards, ownership and the person key, is no-regret either way.

Workbook: Book 03, Chapters 01 and 03.`);
}

// ------------------------------------------------------------------ What 2: the data
{
  const s = D.content("What we should do", "One owner per fact, one model, one person key");
  tag(s, "What");
  const rows = [
    ["HR system of record", "Employment status, position, organization, supervisor, effective dates"],
    ["Identity platform", "Credentials, authentication, sessions, directory objects, policy"],
    ["Contractor source", "Its own authoritative record for people HR 2.0 doesn't cover"],
  ];
  s.addTable([head(["Who is authoritative", "For which facts"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([2.9, 4.6], { y: 1.55, fontSize: 14.5, rowH: [0.45, 0.75, 0.75, 0.75] }));
  box(s, "Model box", 8.35, 1.55, 4.4, 3.5, HEX.navyTint);
  icon(s, "FaSitemap", 8.6, 1.75, 0.7, HEX.navy);
  txt(s, "Model head", "The canonical model", { x: 9.45, y: 1.75, w: 3.2, h: 0.7, bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Model text", bullets([
    "OPM's standard data elements and nature-of-action codes are the contract",
    "Vendor field names stay at the boundary",
    "An enterprise person key the agency controls — it must fit Entra's 16-character employeeId",
  ], 14), { x: 8.6, y: 2.6, w: 3.95, h: 2.4, paraSpaceAfter: 7 });
  callout(s, "Rule", 5.3, 1.25, "FaKey", HEX.teal, "The rule that makes it work: ",
    "every attribute gets one name, one definition and one accountable owner. When a fact is wrong, it is fixed in its source — never patched in the directory.");
  sources(s, "Sources: OPM Guide to Data Standards and Guide to Processing Personnel Actions; Microsoft Graph user resource. Book 03, Chapters 04 and 06.");
  s.addNotes(
`[4:07–5:12]  What does "HR as the source of truth" actually mean? It means one owner for every fact.

The HR system of record is authoritative for employment status, position, organization, supervisor and effective dates. The identity platform stays authoritative for what it does: credentials, authentication, sessions, directory objects and policy. And contractors, whom HR 2.0 doesn't cover, get their own authoritative source mapped into the same model.

That model is the canonical workforce identity model. Its contract is OPM's standard data elements and nature-of-action codes, the government-wide personnel data standards, so vendor field names stay at the boundary and can be replaced. It's keyed on an enterprise person key the agency controls, and that key has to fit Entra ID's employeeId attribute, which holds at most sixteen characters.

The rule that makes it work: every attribute gets one name, one definition and one accountable owner. When a fact is wrong, it gets fixed in its source, never patched in the directory.

Workbook: Book 03, Chapter 04 — Attribute Authority; Chapter 06 — The Canonical Workforce Identity Model.`);
}

// ------------------------------------------------------------------ What 3: pipeline
{
  const s = D.content("What we should do", "Provisioning: personnel records in, governed identities out");
  tag(s, "What");
  const steps = [
    ["Core HCM", "Worker records and personnel actions", HEX.slate, HEX.grey],
    ["Middleware", "Validate, sequence, normalize to SCIM, write provenance, reconcile", HEX.amber, HEX.amberTint],
    ["Entra inbound provisioning", "API-driven bulk upload; daily call limits apply", HEX.navy, HEX.navyTint],
    ["Entra ID and AD", "Accounts created and updated from the record", HEX.teal, HEX.tealTint],
  ];
  steps.forEach((st, i) => {
    const x = 0.6 + i * 3.06;
    box(s, `Pipe ${i}`, x, 1.6, 2.85, 2.2, st[3]);
    txt(s, `Pipe ${i} text`, [
      { text: st[0], options: { bold: true, fontSize: 17, fontFace: "Cambria", color: st[2], breakLine: true } },
      { text: st[1], options: { fontSize: 14 } },
    ], { x: x + 0.2, y: 1.75, w: 2.45, h: 1.95, paraSpaceAfter: 4 });
  });
  txt(s, "Pipe facts", [
    { text: "Fail closed: ", options: { bold: true, color: HEX.navy } },
    { text: "unknown worker types are refused; a failed record is retried and recorded, never skipped; every event leaves a provenance record before the call returns." },
  ], { x: 0.6, y: 4.0, w: 12.15, h: 0.8, fontSize: 15 });
  callout(s, "Example", 5.2, 1.35, "FaRightLeft", HEX.slate, "The technology is the example, not the point: ",
    "Oracle Core HCM feeding Entra ID today. If the vendors change, the model and the rules hold — only the boundary changes.");
  sources(s, "Sources: Microsoft Learn — API-driven inbound provisioning, provisioning limits; Oracle HCM REST APIs. Book 03, Chapter 05.");
  s.addNotes(
`[5:12–6:19]  Provisioning turns personnel records into governed identities.

Core HCM publishes worker records and personnel actions. A small middleware, inside the agency's authorization boundary, does five things for every event: it validates the record, applies events in order, normalizes them to the SCIM standard, writes a provenance record, and reconciles the result. Then Entra ID's API-driven inbound provisioning creates and updates the accounts in Entra ID and, through the provisioning agent, in Active Directory. That interface has daily call limits that scale with the license, which the book sizes against the agency's population.

The design fails closed. Unknown worker types are refused. A failed record is retried and recorded, never silently skipped. And every event leaves a provenance record before the call returns, which is where the evidence comes from later.

The technology is the example, not the point. Today it's Oracle Core HCM feeding Entra ID. If the vendors change, the model and the rules hold; only the boundary changes.

Workbook: Book 03, Chapter 05 — Provisioning Services.`);
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who owns, who uses, who guards");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Owns the data", HEX.navy, HEX.navyTint, [
      ["HR", "Personnel data and its quality, at the source"],
      ["OPM HR 2.0 program", "Platform, standards, interconnection"],
      ["Contractor sources", "Their own authoritative record"]]],
    ["FaUsersGear", "Uses the data", HEX.teal, HEX.tealTint, [
      ["CIO identity team", "Entra ID, Active Directory, access"],
      ["Security", "Zero Trust policy and the leaver path"],
      ["Help desk", "Exceptions, not routine tickets"]]],
    ["FaShieldHalved", "Guards it", HEX.amber, HEX.amberTint, [
      ["Privacy office", "Disclosure basis, PIA, minimization"],
      ["PIV office", "Issuance and termination"],
      ["ISSO and AO", "Evidence and accepted risk"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [
      { text: r[0], options: { bold: true, color: c[2], breakLine: true } },
      { text: r[1], options: { breakLine: k < c[4].length - 1 } },
    ]), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  callout(s, "Architect", 5.3, 1.2, "FaSitemap", HEX.navy, "The data architect's role: ",
    "own the standards, the crosswalk and the person key; make sure every attribute has one accountable owner; carry the standard to the interagency forums where it is adopted.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; OMB M-19-17; FIPS 201-3; OMB A-108, A-130. Book 03, Chapter 07.");
  s.addNotes(
`[6:19–7:36]  Who has to be involved. This is an organizational change as much as a technical one.

Owners. HR owns the personnel data and its quality, at the source. The OPM HR 2.0 program owns the platform, the standards and the interconnection. And each contractor source owns its own record.

Users. The CIO's identity team runs Entra ID, Active Directory and access from that data. Security sets the Zero Trust policy and owns the leaver path. And the help desk moves from routine tickets to handling exceptions.

Guards. The privacy office is in from the start. Sharing HR records with identity inside the agency normally rests on the Privacy Act's need-to-know provision, while disclosures outside the agency need a routine use, so the privacy office decides the basis for each leg, along with the privacy impact assessment and minimization. The PIV office owns issuance and termination. And the ISSO and authorizing official own the evidence and any accepted risk.

The data architect ties it together: owning the standards, the crosswalk and the person key, making sure every attribute has one accountable owner, and carrying the standard to the interagency forums where it's adopted.

Workbook: Book 03, Chapter 07 — Who Owns Workforce Identity.`);
}

// ------------------------------------------------------------------ How 1: lifecycle and credentials
{
  const s = D.content("How to do it", "Personnel actions drive joiner, mover and leaver");
  tag(s, "How");
  const ev = [
    ["Joiner", "Account and baseline access ready on day one", HEX.teal, HEX.tealTint],
    ["Mover", "Old access removed, new baseline applied, exceptions reviewed", HEX.navy, HEX.navyTint],
    ["Leaver", "Block first: disable and revoke sessions — then credentials, devices, access", HEX.red, HEX.redTint],
  ];
  ev.forEach((e, i) => {
    const y = 1.55 + i * 1.12;
    box(s, `Ev ${i}`, 0.6, y, 6.55, 1.0, e[3]);
    txt(s, `Ev ${i} text`, [
      { text: e[0], options: { bold: true, color: e[2], fontSize: 17, breakLine: true } },
      { text: e[1], options: { fontSize: 14 } },
    ], { x: 0.85, y: y + 0.08, w: 6.1, h: 0.86 });
  });
  box(s, "Facts", 7.4, 1.55, 5.35, 3.36, "FFFFFF", HEX.navy);
  txt(s, "Facts head", "WHAT THE PLATFORM ACTUALLY DOES", { x: 7.65, y: 1.7, w: 4.9, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  txt(s, "Facts list", bullets([
    "Lifecycle Workflows run on one tenant-wide schedule and need Entra ID Governance",
    "Revoking sessions stops new tokens; issued tokens last until they expire",
    "Privileged leavers need their own verified block path",
    "Synced users are deleted in AD, or the next sync restores them",
  ], 14), { x: 7.65, y: 2.1, w: 4.95, h: 2.75, paraSpaceAfter: 7 });
  callout(s, "Codes", 5.15, 1.4, "FaListCheck", HEX.amber, "By code, not by ticket: ",
    "the personnel action's nature-of-action code decides the identity event; credentials follow the same events — PIV issuance, binding and termination, device certificates retired before the account is deleted.");
  sources(s, "Sources: Microsoft Learn — Lifecycle Workflows, revoke user access; FIPS 201-3. Book 03, Chapters 08–09 and Appendix A.");
  s.addNotes(
`[7:36–8:43]  How. Personnel actions drive the three identity events, by code, not by ticket.

A joiner gets an account and baseline access ready on day one. A mover has the old assignment's access removed, the new baseline applied, and any exceptions reviewed. And a leaver is blocked first: the account disabled and sessions revoked at the effective separation time, then credentials, devices and access removed in parallel, each one reconciled.

The book is precise about what the platform actually does. Lifecycle Workflows run on one tenant-wide schedule and need an Entra ID Governance license. Revoking sessions stops new tokens being issued, but tokens already issued last until they expire. Privileged leavers need their own verified block path, because the built-in disable task doesn't support users with admin roles. And synced users must be deleted in Active Directory, or the next sync brings them back.

Credentials follow the same events: PIV issuance, certificate binding and termination, and device certificates retired before the account is deleted.

Workbook: Book 03, Chapter 08 — Joiner, Mover, Leaver; Chapter 09 — Credentials and Certificates; Appendix A.`);
}

// ------------------------------------------------------------------ How 2: access and evidence
{
  const s = D.content("How to do it", "From attributes to access, with evidence built in");
  tag(s, "How");
  const chain = ["Personnel record", "Canonical attribute", "Rule or access package", "Entitlement", "Evidence record"];
  chain.forEach((c, i) => {
    const x = 0.6 + i * 2.46;
    box(s, `Chain ${i}`, x, 1.7, 2.25, 1.0, i === 4 ? HEX.amberTint : (i % 2 ? HEX.tealTint : HEX.navyTint));
    txt(s, `Chain ${i} text`, c, { x: x + 0.1, y: 1.7, w: 2.05, h: 1.0, fontSize: 15, bold: true, align: "center", valign: "middle", color: i === 4 ? HEX.amber : HEX.navy });
  });
  txt(s, "Chain note", "Every entitlement traces back to a rule, an approved exception, an authoritative attribute, or a privileged-access decision.",
    { x: 0.6, y: 2.95, w: 12.15, h: 0.5, fontSize: 15.5, italic: true, color: HEX.ink });
  const drift = [
    ["Drift found by comparison", "Scheduled checks compare HR, the model and the directories"],
    ["Measured in business terms", "Separation-to-block time, orphan accounts, day-one readiness"],
    ["Kept long enough", "Entra keeps audit and provisioning logs 30 days with P1/P2 — export from the pilot onward"],
  ];
  drift.forEach((d, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Drift ${i}`, x, 3.6, 3.95, 1.45, "FFFFFF", HEX.line);
    txt(s, `Drift ${i} text`, [
      { text: d[0], options: { bold: true, color: HEX.teal, fontSize: 15, breakLine: true } },
      { text: d[1], options: { fontSize: 13.5 } },
    ], { x: x + 0.2, y: 3.7, w: 3.55, h: 1.3 });
  });
  callout(s, "Evidence", 5.3, 1.2, "FaFileShield", HEX.amber, "Evidence as a byproduct: ",
    "the same records that run the lifecycle answer the auditor's question — does every account belong to a current person with a current reason?");
  sources(s, "Sources: Microsoft Learn — dynamic membership, entitlement management, log retention; NIST SP 800-53 AC-2, CA-7. Book 03, Chapters 10–11.");
  s.addNotes(
`[8:43–9:45]  Next, access. Once the attributes are trustworthy, access is derived from them. A personnel record becomes a canonical attribute, a rule or access package turns that into an entitlement, and an evidence record captures why. Every entitlement then traces back to a rule, an approved exception, an authoritative attribute, or a privileged-access decision. That's what makes access explainable.

Drift is found by comparison, not by complaint: scheduled checks compare HR, the model and the directories. It's measured in business terms leadership can read: time from separation to blocked access, orphaned accounts, and access ready on day one. And the records have to be kept long enough. Entra ID keeps audit and provisioning logs for thirty days with P1 or P2, so the book exports them from the pilot onward.

The evidence comes as a byproduct. The same records that run the lifecycle answer the auditor's oldest question: does every account belong to a current person with a current reason?

Workbook: Book 03, Chapter 10 — From Attributes to Access; Chapter 11 — Drift, Metrics and Evidence.`);
}

// ------------------------------------------------------------------ How 3: plan
{
  const s = D.content("How to do it", "Seven phases, each gate the next phase's precondition");
  tag(s, "How");
  const ph = [["0", "Align"], ["1", "Authority and schema"], ["2", "Build and test"], ["3", "Pilot"], ["4", "Lifecycle and access"], ["5", "Cutover by population"], ["6", "Sustain"]];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 1.75;
    box(s, `Phase ${p[0]}`, x, 1.65, 1.6, 1.6, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Phase ${p[0]} text`, [
      { text: p[0], options: { bold: true, fontSize: 26, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } },
      { text: p[1], options: { fontSize: 13.5, bold: true } },
    ], { x: x + 0.12, y: 1.72, w: 1.4, h: 1.45, align: "center" });
  });
  txt(s, "Plan rules", bullets([
    "Start now from the HR data the agency already has; switch the source to Core HCM when it arrives",
    "Run in shadow mode first: compare what HR says with what the directories hold, and fix the gaps",
    "Cut over one population at a time, with a signed validation report and a rollback",
    "Close the ticket path for a population only when the data proves HR is the sole source",
  ], 15), { x: 0.6, y: 3.45, w: 12.15, h: 1.8, paraSpaceAfter: 6 });
  callout(s, "Gates", 5.45, 1.05, "FaClipboardCheck", HEX.amber, "Gates are proposals: ",
    "thresholds such as 99% correlation are starting criteria the agency approves through its own risk governance, not federal requirements.");
  sources(s, "Program design. Book 03, Chapter 12 — Execution Plan; Appendix C — Acceptance and Cutover; Chapter 13 — Reference Deployment.");
  s.addNotes(
`[9:45–10:56]  The execution plan has seven phases, and each gate is the next phase's precondition.

Phase zero aligns the program, naming identity as a consumer in both migrations. Phase one settles attribute authority and the schema. Phase two builds and tests the pipeline. Phase three is the pilot. Phase four turns on lifecycle automation and attribute-derived access. Phase five cuts over population by population. And phase six sustains it.

Four rules run through it. Start now, from the HR data the agency already has, and switch the source to Core HCM when it arrives. Run in shadow mode first, comparing what HR says with what the directories hold, and fix the gaps. Cut over one population at a time, with a signed validation report and a rollback. And close the ticket path for a population only when the data proves HR is the sole source.

The gate thresholds, like ninety-nine percent correlation, are proposals. They're starting criteria the agency approves through its own risk governance, not federal requirements. Chapter 13 walks an illustrative agency through all seven phases.

Workbook: Book 03, Chapter 12 — Execution Plan; Appendix C; Chapter 13.`);
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "How we'll know it works, and what we need");
  tag(s, "How");
  txt(s, "Measures head", "FIVE MEASURES, BASELINED IN PHASE 1", { x: 0.6, y: 1.55, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  txt(s, "Measures", bullets([
    "Separation to blocked access, in hours",
    "Accounts tied to a person; orphans trending to zero",
    "Joiner and mover tickets down; access ready on day one",
    "Manager and organization in the directory match HR",
    "Every exception has an owner and an age",
  ], 15.5), { x: 0.6, y: 1.95, w: 6.3, h: 3.2, paraSpaceAfter: 8 });
  box(s, "Ask box", 7.25, 1.55, 5.5, 3.6, HEX.tealTint);
  icon(s, "FaUserCheck", 7.5, 1.75, 0.7, HEX.teal);
  txt(s, "Ask head", "One decision", { x: 8.35, y: 1.75, w: 4.2, h: 0.7, bold: true, color: HEX.teal, fontSize: 19, fontFace: "Cambria", valign: "middle" });
  txt(s, "Ask text", [
    { text: "Start HR-driven identity now, as a design requirement of the HR 2.0 onboarding and the Entra ID migration.", options: { bold: true, breakLine: true } },
    ...bullets(["A sponsor across HR, identity and privacy", "Identity named in the HR 2.0 interconnection plan", "Data owners designated; the person key confirmed", "A small team for the pre-onboarding data work"], 14),
  ], { x: 7.5, y: 2.55, w: 5.05, h: 2.5, fontSize: 14.5, paraSpaceAfter: 5 });
  callout(s, "Next", 5.4, 1.1, "FaBook", HEX.navy, "Read next: ",
    "Book 03 for the full design, every claim footnoted; Book 02 for the directory migration it builds on.");
  s.addNotes(
`[10:56–11:59]  How we'll know it's working, and what we need.

Five measures, each baselined in phase one, and each one a business measure leadership can read. Time from separation to blocked access, in hours. Accounts tied to a person, with orphaned accounts trending to zero. Joiner and mover tickets going down, with access ready on day one. The manager and organization in the directory matching HR. And every exception with an owner and an age.

What we need from leadership is one decision: start HR-driven identity now, as a design requirement of the HR 2.0 onboarding and the Entra ID migration. And to act on it: a sponsor across HR, the identity team and privacy; identity named as a consumer in the HR 2.0 interconnection plan; data owners designated and the person key confirmed; and a small team for the pre-onboarding data work.

Book 03 has the full design, with every external claim footnoted, and Book 02 covers the directory migration it builds on. Thank you.

Workbook: Book 03, Chapters 11 and 12.`);
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB and OPM, Creating \"Federal HR 2.0\" by Consolidating Core Human Capital Management Across the Federal Government, December 10, 2025.",
    "OPM, Core HCM contract award, June 10, 2026.  ·  OPM, Guide to Data Standards; Guide to Processing Personnel Actions.",
    "NIST FIPS 201-3, Personal Identity Verification (PIV) of Federal Employees and Contractors, January 2022.",
    "NIST SP 800-53 Rev. 5 (PS-4, PS-5, AC-2, CA-7, IA-4)  ·  NIST SP 800-37 Rev. 2  ·  OMB M-19-17; OMB Circulars A-108 and A-130.",
    "Privacy Act of 1974, 5 U.S.C. 552a (need-to-know and routine uses).",
    "Microsoft Learn: API-driven inbound provisioning and its limits; Lifecycle Workflows; revoke user access; log retention.",
    "Microsoft Learn: Microsoft Graph user resource (employeeId); dynamic membership; entitlement management; certificate-based authentication.",
    "Oracle: Fusion Cloud HCM REST APIs (workers).",
    "Full footnotes with links and access dates: Book 03, every chapter (whalermike.github.io/modernization-workbook/docs/books/b03-hr-identity/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
