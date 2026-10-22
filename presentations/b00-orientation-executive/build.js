// Book 00 — Orientation & Program: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: executive sponsors, CIOs, CISOs and program executives. Decision-centered: every
// decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build:  node presentations/b00-orientation-executive/build.js presentations/b00-orientation-executive/B00_Orientation_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b00-orientation/, named in the notes.
const D = require("../_build/lib.js")({
  book: "Book 00",
  title: "Orientation & Program — Executive Briefing",
  footer: "Federal Modernization Workbook  ·  Book 00 Orientation & Program  ·  Executive briefing",
});
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, sources } = D;
const OUT = process.argv[2] || "B00_Orientation_Executive.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's narration is edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const perSlide = [];
const narrate = (s, body, ref) => {
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  perSlide.push(words);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// ---------------------------------------------------------------- layout helpers
// The decision bar: every decision slide states the decision, its owner and when it's needed.
const decision = (s, what, owner, when) => {
  const y = 5.25, h = 1.25;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.27, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => txt(s, name, [
    { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
    { text, options: { fontSize: 14, color: HEX.ink } },
  ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  col("Decision", 1.75, 6.35, "DECISION", what, HEX.amber);
  col("Owner", 8.3, 2.3, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "NEEDED BY", when, HEX.navy);
};
// Three tinted cards across the slide, each with an icon, a heading and a bullet list.
const cards = (s, prefix, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `${prefix} card ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
  icon(s, c[0], x + 0.22, 1.65, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.65, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], size || 13.5), { x: x + 0.25, y: 2.42, w: 3.5, h: 2.6, paraSpaceAfter: 6 });
});
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h, size) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: size || 14, valign: "middle" });
  });
};
// A tinted box on the right with an icon, a heading and a bullet list (x 7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, size) => {
  box(s, `${prefix} box`, 7.75, 1.5, 5.0, 3.6, tint);
  icon(s, iconName, 8.0, 1.66, 0.6, color);
  txt(s, `${prefix} head`, heading, { x: 8.75, y: 1.66, w: 3.9, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 13.5), { x: 8.0, y: 2.4, w: 4.6, h: 2.62, paraSpaceAfter: 6 });
};
// A table on the left (x 0.6 to 7.5) with a navy header row.
const leftTable = (s, header, body, colW, rowH, fontSize) => s.addTable([head(header), ...body],
  tableOpts(colW, { y: 1.5, fontSize: fontSize || 12.5, rowH }));
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why modernize now", S_WHAT = "What the program is", S_WHO = "Who decides", S_HOW = "How it runs";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, "What Must Leadership Decide, and When?", "Book 00 — Orientation & Program  ·  Executive briefing");
  D.agenda(s, 0.8, 4.75, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for sponsors, CIOs, CISOs and program executives", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 8.5, h: 0.85, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 00 of the Federal Modernization Workbook, Orientation and Program. It runs about thirty minutes, and it's for the people who sponsor, fund and answer for modernization: executive sponsors, CIOs, CISOs and program executives.

One point first. The workbook is independent technical guidance, not federal policy. Where it says a law, memorandum or directive requires something, it cites that source. Everything else, including the program's phases, gates, principles and decision rights, is the workbook's own recommendation: one way to meet those requirements, not a requirement itself.

The argument is short. For twenty years Active Directory quietly did governance nobody wrote down. Federal policy and vendor lifecycles now set clocks the estate can't ignore. Meeting them one product at a time rebuilds the same governance gaps in a new place, so modernization has to run as one governed program.

I'll take four questions in order: why now, what the program is, who decides, and how it runs from pre-flight to steady state. Every decision slide names the decision, its owner, and when it's needed.`,
  "Book 00, index (Guidance, not federal policy); Chapter 01 — Why Modernize, and Why Now; Chapter 02 — How to Use This Workbook (Three kinds of statement).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content(S_WHY, "The directory governed the estate, and nobody wrote it down");
  tag(s, "Why");
  rows(s, "Placement", "WHAT AN OBJECT'S PLACE IN THE TREE DECIDED", [
    ["Delegation", "ACLs on the OU set who administers it"],
    ["Policy", "GPOs linked to sites, domains and OUs; the closest wins"],
    ["Access", "Group membership, nested far from the grant"],
    ["Names", "DNS zones stored and replicated in the directory"],
    ["Trust", "Certificates enrolled through Group Policy"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "Cloud", "FaCloud", HEX.navy, HEX.navyTint, "The cloud doesn't inherit it", [
    "Entra ID administrative units can't be nested",
    "Intune has no hierarchy: conflicts, not inheritance",
    "Access becomes a Conditional Access decision",
    "Names move to DDI; trust to a target PKI",
  ]);
  decision(s, "Charter modernization as governance reconstruction: each decision the tree made by placement gets an owner, a record and evidence",
    "Executive sponsor", "When the charter is signed");
  sources(s, "Sources: Microsoft Learn — AD DS logical model, Group Policy processing, AD-integrated DNS, AD CS, Entra administrative units, Intune settings catalog. Book 00, Chapters 01 and 03.");
  narrate(s,
`Start with why. Most federal estates still run the client/server model they built in the early 2000s, with an Active Directory forest at the center. Since Windows 2000, the organizational unit has grouped objects for delegating administrative rights and assigning policy. So placing a user or a computer in the tree decided, at the same moment and with no separate record, who administers it, which Group Policy applies to it, what its groups let it reach, how it's named in directory-integrated DNS, and which certificates it receives.

It was efficient, and for a quarter century agencies got governance as a side effect of running a directory. The cost is that it was never stated.

The cloud estate doesn't inherit it. Entra ID's administrative units can't be nested. Intune applies policy to groups with no hierarchy, and two policies that disagree produce a conflict to resolve, not an inheritance rule. Access, names and trust move to Conditional Access, a DDI platform and a target PKI.

Each replacement needs someone to decide what the old placement meant. An agency that moves users and retires the forest without recovering those decisions doesn't modernize its governance. It deletes it.

So the first decision is the sponsor's, when the charter is signed: treat modernization as governance reconstruction, not only a technical migration. If stakeholders don't accept that, the charter says, resistance becomes the program's main risk.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (Governance nobody wrote down; Why the cloud doesn't inherit it); Chapter 03 — The Program Charter (The problem; Assumptions; Key risks).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content(S_WHY, "Federal policy now sets the dates");
  tag(s, "Why");
  const pol = [
    ["OMB M-22-09 (Jan 2022)", "Zero Trust actions; on-premises and hybrid too", "End of FY 2024; still in force"],
    ["CISA BOD 25-01 (Dec 2024)", "Mandatory configurations for cloud tenants", "Policies June 20, 2025; new tenants before ATO"],
    ["CISA BOD 26-02 (Feb 2026)", "End-of-support edge devices on the internet", "Listed devices out by Feb 5, 2027"],
    ["OMB M-26-14 (May 2026)", "Risk-based logging; rescinds M-21-31", "Logging plan 90 days after the reference architecture"],
    ["FedRAMP 2026 rules (June 2026)", "Cloud services certified in Classes A to D", "Mandatory Jan 1, 2027; no new Rev5 after June 11, 2027"],
  ];
  leftTable(s, ["Instrument", "What it sets", "Dates"], pol.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [2.15, 2.45, 2.3], [0.38, 0.62, 0.62, 0.62, 0.62, 0.62], 11.5);
  sideBox(s, "Logging", "FaUserClock", HEX.amber, HEX.amberTint, "M-26-14, counted out", [
    "Reference architecture published Aug 20, 2026",
    "Logging plan: November 18, 2026",
    "Level 1: December 18, 2026",
    "Level 2: February 16, 2027; Level 3: July 6, 2027",
    "The program's arithmetic, not OMB's dates",
  ], 13);
  decision(s, "Confirm the M-26-14 deadlines against the program's count, starting with the first Agency Logging Plan",
    "The CISO's office", "November 18, 2026, by the program's count");
  sources(s, "Sources: OMB M-22-09; CISA BOD 25-01 and BOD 26-02; OMB M-26-14; CISA Logging Reference Architecture; FedRAMP Consolidated Rules for 2026 and timeline. Book 00, Chapter 01.");
  narrate(s,
`The second reason is the schedule. Two kinds of clock now set dates from outside, and the first is federal policy.

OMB M-22-09, from January 2022, set Zero Trust objectives for the end of fiscal 2024. That date has passed, but the actions remain in force, on-premises and hybrid as well as cloud. CISA's BOD 25-01 set mandatory configurations for cloud tenants, with the policies due June 20, 2025, and every new tenant baselined before its authorization to operate. BOD 26-02, from February 2026, directs agencies to remove internet-facing end-of-support edge devices; the listed ones go by February 5, 2027. OMB M-26-14, issued May 22, 2026, rescinded M-21-31 and set a risk-based approach to logging. And FedRAMP's Consolidated Rules for 2026, launched June 25, take mandatory effect for all stakeholders on January 1, 2027, and providers then have a year to follow them to keep their certification. FedRAMP accepts no new Rev5 certification applications after June 11, 2027.

M-26-14 counts its deadlines from CISA's Logging Reference Architecture, published August 20, 2026. Counted from that date, the Agency Logging Plan falls on November 18 of this year, Level 1 on December 18, Level 2 on February 16, 2027, and Level 3 on July 6, 2027. Those four dates are the program's arithmetic, not dates OMB published.

So the nearest decision: confirm them with the CISO's office, starting with the logging plan, due November 18 by the program's count.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (The clocks that now set the schedule: Federal policy).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content(S_WHY, "Vendor support dates cluster on the same estate");
  tag(s, "Why");
  const eos = [
    ["Windows 10; Exchange Server 2016 and 2019", "Oct 14, 2025", "Passed"],
    ["SQL Server 2016; SharePoint Server 2016 and 2019", "July 14, 2026", "Passed"],
    ["Windows Server 2012 and 2012 R2, ESU Year 3", "Oct 13, 2026", "Passed"],
    ["Windows Server 2016", "Jan 12, 2027", "Under three months"],
    ["SQL Server 2017", "Oct 12, 2027", "About a year"],
    ["Windows Server 2019; Identity Manager 2016", "Jan 9, 2029", "Within the horizon"],
  ];
  leftTable(s, ["Product", "End of support", "On Oct 21, 2026"],
    eos.map((r, i) => [bold(r[0]), { text: r[1] }, { text: r[2], options: { bold: i === 3, color: i < 3 ? HEX.red : (i === 3 ? HEX.amber : HEX.ink) } }]),
    [3.6, 1.5, 1.8], [0.38, 0.53, 0.53, 0.53, 0.53, 0.53, 0.53], 12);
  sideBox(s, "Binds", "FaTriangleExclamation", HEX.red, HEX.redTint, "Why a vendor date binds", [
    "After it: no security updates, no assisted support",
    "BOD 26-02 makes it a directed action at the edge",
    "Every security plan asserts flaw remediation",
    "Running past it is a risk acceptance the AO signs",
  ]);
  decision(s, "Retire, or accept in writing, every component that will run past end of support, starting with Windows Server 2016",
    "Authorizing official", "January 12, 2027");
  sources(s, "Sources: Microsoft Learn — Ending Support in 2025, 2026, 2027 and 2029; MIM 2016 news and updates; CISA BOD 26-02; NIST SP 800-53 Rev. 5 (SA-22). Book 00, Chapter 01; Appendix A.");
  narrate(s,
`The second set of clocks is vendor support. After end of support there are no new security updates and no assisted support, and for an estate built in the early 2000s, the dates cluster.

Windows 10 and Exchange Server 2016 and 2019 ended in October 2025; SQL Server 2016, SharePoint Server 2016 and 2019, and the last Windows Server 2012 security updates ended this year. Windows Server 2016 ends on January 12, 2027, under three months away, and it's the operating system of many domain controllers built in the last decade. Windows Server 2019 and Microsoft Identity Manager 2016 end on January 9, 2029. Identity Manager's date was extended from 2026, so an agency that syncs HR data through it has a date, not an open-ended bridge.

A vendor date isn't a federal mandate on its own, but the two connect. BOD 26-02 turns end of support into a directed action for internet-facing edge devices, and every system security plan asserts flaw remediation that an unsupported product can't deliver.

So running past end of support is a decision, and it belongs to the authorizing official, who has to sign the risk acceptance. The first of those falls due with Windows Server 2016, on January 12.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (Vendor support); Appendix A — Risk Register and Control Traceability (SA-22, Unsupported System Components); Chapter 07 — Who Runs the Program (Who decides what: risk acceptance).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = D.content(S_WHY, "Read the clocks exactly, then run one program");
  tag(s, "Why");
  rows(s, "Clocks", "WHAT THE CLOCKS DON'T REQUIRE", [
    ["FedRAMP", "Certifies cloud services; each agency still authorizes its own systems"],
    ["Moderate", "Now certification Class C; High is Class D"],
    ["Zero Trust", "No federal document requires a maturity stage"],
    ["BOD 25-01", "Covers cloud tenants, not the on-premises forest"],
  ], 1.88, 0.8, 0.68, 13.5);
  sideBox(s, "Program", "FaSitemap", HEX.navy, HEX.navyTint, "Why one program", [
    "Every project touches the same implicit decisions",
    "Fund and govern the program as a sequence",
    "Hold gates on evidence, not on the calendar",
    "Be honest about maturity: a target, not a claim",
  ]);
  decision(s, "Fund and govern modernization as one sequenced program, with one dependency chain and one set of gates",
    "Executive sponsor and CIO", "Before budget lines are set");
  sources(s, "Sources: FedRAMP, Using a FedRAMP Certified Cloud Service; FedRAMP Notice NTC-0004; OMB M-22-09; CISA BOD 25-01. Book 00, Chapters 01 and 07.");
  narrate(s,
`The clocks are often quoted for more than they say. Four corrections recur.

FedRAMP certifies cloud services, and each agency still authorizes its own systems, so the 2027 date changes what providers publish, not whether the agency's own systems comply. Moderate is now a certification class: Class C includes the current Moderate baseline, and Class D the High. No federal document requires a Zero Trust maturity stage. And BOD 25-01 covers production cloud tenants, not on-premises Active Directory, though the forest still decides much of what a tenant can enforce.

Nothing makes the estate fail on a single date. It's surrounded by deadlines, each binding a different part of it, and each assuming the agency knows what it runs, who owns it and what governs it.

That's why it can't be a set of projects. Moving devices to Intune needs the policy GPO links carried; Conditional Access needs the access groups granted. Separate projects rediscover those decisions differently, or not at all. A program can sequence the work against the dates; a collection of projects can only race them.

Hence the decision for the sponsor and CIO, before the budget lines are set: fund and govern modernization as one sequenced program, with one dependency chain and one set of gates.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (What the clocks don't require; Why one program, not a set of projects; What leadership should take from this); Chapter 07 (Who decides what: budget and licenses).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content(S_WHAT, "The charter: the page the sponsor signs");
  tag(s, "What");
  rows(s, "Objectives", "SIX OBJECTIVES", [
    ["1  One origin", "One authoritative source; every other copy derived"],
    ["2  Explicit governance", "Attributes, dynamic membership, scoped policy"],
    ["3  Drift as a finding", "Classified, not an exception or a surprise"],
    ["4  Controlled waves", "From the source, least privilege, closed with evidence"],
    ["5  No rip-and-replace", "Each domain on its own schedule"],
    ["6  Continuous evidence", "Machine-usable, for operations and compliance"],
  ], 1.86, 0.54, 0.47, 13);
  sideBox(s, "Scope", "FaFileShield", HEX.red, HEX.redTint, "Scope, in and out", [
    "In: discovery, the target model, phased plans, change control, drift, gates",
    "Out at first: replacing compliance frameworks",
    "Out: inline enforcement; the enforcers stay",
    "Out: the agency's own cutover execution",
  ], 13);
  decision(s, "Sign the charter, put names in its governance table, and check every later decision against its scope and objectives",
    "Executive sponsor, with the steward", "Phase 0 entry work");
  sources(s, "Sources: Book 00, Chapter 03 (Purpose; The problem; Objectives; Scope; Next steps); OMB M-22-09 §III.A; Chapter 05 (Phase 0 entry work).");
  narrate(s,
`Now, what the program is. It starts with a short charter: the page the sponsor signs, and the page every later decision is checked against: is this inside the scope we chartered, does it serve one of the objectives, and does it move a success criterion?

The problem it sets out to remove has four costs: migration risk concentrated in hidden dependencies; ongoing drift between intended and actual state; weak evidence of change and compliance; and a high cost of reconciling fragmented stores.

Against those, six objectives. One authoritative origin for organizational structure, identity attributes and key claims, with every other copy derived. Governance rebuilt explicitly, through attributes, dynamic membership and scoped policy. Drift treated as a classified finding. Change in controlled waves that start from the authoritative source, run under least privilege, and close with evidence. Domain transformations without rip-and-replace. And continuous, machine-usable evidence.

The scope is deliberate. The program feeds compliance frameworks; it doesn't replace them. Identity providers, network fabrics and device managers stay the enforcers, and the program governs them. And the adopting agency executes its own cutover.

An agency can adopt the charter as written. The decision: the sponsor signs it, and names go into its governance table, starting with the sponsor and the steward, as Phase 0's entry work.`,
  "Book 00, Chapter 03 — The Program Charter (What the charter is for; The problem; Objectives; Scope; Next steps, item 1); Chapter 05 — The Program Plan (The seven phases and six gates: Phase 0 entry work).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content(S_WHAT, "Six success criteria, each tested at a gate");
  tag(s, "What");
  const crit = [
    ["1", "A current-state assessment", "Every forest in scope; all eleven dependency types; zero open priority-one findings", "G0"],
    ["2", "A target structure, agreed", "Every attribute that drives access has exactly one designated source", "G1"],
    ["3", "A domain playbook with gates", "The pilot division passes it, with zero drift for a hold period", "G2"],
    ["4", "A change-control pattern in use", "Every pilot change carries all five clauses; human-only closures logged", "G1, then every gate"],
    ["5", "Drift classes specified", "A signal, a severity and a response for each; no missed run", "G1"],
    ["6", "Leadership can explain it", "Sponsor answers yes to each pre-start question; monthly drift review", "G0, then monthly"],
  ];
  s.addTable([head(["#", "Criterion", "Measure (thresholds are illustrative)", "Checked at"]),
    ...crit.map((r) => [bold(r[0], HEX.amber), bold(r[1]), { text: r[2] }, bold(r[3], HEX.teal)])],
    tableOpts([0.45, 3.0, 6.65, 2.05], { y: 1.5, fontSize: 12.5, rowH: [0.38, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55] }));
  decision(s, "Answer yes to every pre-start question, and have the steering committee review the drift trend each month",
    "Executive sponsor", "G0, then monthly");
  sources(s, "Sources: Book 00, Chapter 03 (Success criteria) and Chapter 10 (Delivery measures); Book 01, Chapter 09 (How a sponsor evaluates the program), as Chapter 03 cites it.");
  narrate(s,
`A sponsor can't sign off an outcome with no test, so the charter turns each success criterion into a measure, the evidence that shows it, and the gate where it's checked.

First, a current-state assessment that covers every forest in scope and all eleven dependency object types, with zero open priority-one findings, checked at G0. Second, a target structure in which every attribute that drives access has exactly one designated source, checked at G1. Third, a domain playbook whose entry and exit criteria are written as queries, proven when the pilot division clears G2 with zero drift for a hold period; fourteen days is the illustrative example. Fourth, a change-control pattern in use: every pilot change carries all five clauses of the change lifecycle, and every human-only closure is logged as an exception. Fifth, drift classes with a detection signal, a severity and a response, where a missed run is itself a halt condition. Sixth, leadership can describe the path, the risks and the measures without citing internal decision records.

The numbers are illustrative defaults: the agency sets its own, records them, and doesn't change them silently. And the criteria stop at the pilot on purpose.

The sixth criterion is the sponsor's own. The sponsor answers yes to each pre-start question by G0, and the steering committee reviews the drift trend monthly.`,
  "Book 00, Chapter 03 — The Program Charter (Success criteria); Chapter 10 — Retirement, Steady State and Measuring Success (Measuring success: delivery measures).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content(S_WHAT, "Fifteen principles, one idea underneath");
  tag(s, "What");
  cards(s, "Principles", [
    ["FaBook", "Foundation", HEX.navy, HEX.navyTint, ["1  Single source of truth", "2  Change control and provenance", "11  Drift detection", "No closure counts without its proof"]],
    ["FaSitemap", "Structure and estate", HEX.teal, HEX.tealTint, ["3 to 5  Attributes replace the OU tree", "6, 7, 9, 10  Devices, servers, policy", "8, 12  The HR feed; the database tier", "Empty attributes bypass policy"]],
    ["FaUsersGear", "Program", HEX.amber, HEX.amberTint, ["13  Education, training, test plans", "14  Zero Trust governance", "15  Continuous evaluation, not a short clock", "The record kept apart from the enforcer"]],
  ], 13.5);
  decision(s, "Set the evidence and provenance expectations that every later change must meet",
    "Steward", "Before the first change is made");
  sources(s, "Sources: Microsoft Learn — Entra extension attributes, PIM, Conditional Access, continuous access evaluation; NIST SP 800-207. Book 00, Chapters 03 and 04.");
  narrate(s,
`The charter's six guiding principles expand to fifteen in Chapter 04, and one idea runs underneath them all: keep the record of what should be true apart from the systems that enforce it, and make every change prove itself against that record.

The foundation principles apply to every change. Every claim has one authoritative origin. Every move, add, change, deletion and reset travels five clauses: it originates with the source of truth, carries an authoritative authorization, executes under just-in-time least privilege, closes with provenance, and emits evidence automatically. No closure counts unless it carries its proof. And drift detection re-checks on a schedule.

The structure and estate principles replace the OU tree with attributes, and they carry one rule executives should hear: a user with an empty attribute falls out of the dynamic group, and so out of every policy that targets it. Attribute completeness is a security control.

The program principles cover people, Zero Trust governance and the direction of travel. Two source rules were corrected on the way: Intune policy conflicts, and token lifetimes, where the principle that survives is continuous evaluation, not a short clock.

The decision here is the steward's, and it comes before the first change is made: set the evidence and provenance expectations that every later change must meet.`,
  "Book 00, Chapter 04 — The Modernization Principles (How to read the principles; Principles 1, 2, 9, 11 and 15); Chapter 03 — The Program Charter (Guiding principles; Next steps, item 5; Governance and ownership).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content(S_WHAT, "Seven phases, six gates, and who clears each");
  tag(s, "What");
  const phases = [
    ["0", "Pre-flight", "G0 Ready to Plan", "Steward"],
    ["1", "Foundation", "G1 Foundation Complete", "Steward"],
    ["2", "Pilot division", "G2 Pilot Clean", "Steward and sponsor"],
    ["3", "General rollout", "G3 Rollout Complete", "Sponsor and steering committee"],
    ["4", "Legacy retirement", "G4 Legacy Quiet", "Steward"],
    ["5", "AD DS retirement", "G5 AD Retired", "Sponsor and CIO"],
    ["6", "Steady state", "No exit gate", "Runs on a cadence"],
  ];
  const tints = [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.navyTint, HEX.amberTint, HEX.redTint, HEX.tealTint];
  const gap = 0.1, w = (12.15 - gap * 6) / 7;
  phases.forEach((p, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `Phase ${p[0]}`, x, 1.5, w, 1.8, tints[i]);
    txt(s, `Phase ${p[0]} text`, [
      { text: `Phase ${p[0]}`, options: { bold: true, color: HEX.amber, fontSize: 12, breakLine: true } },
      { text: p[1], options: { bold: true, color: HEX.navy, fontSize: 14, breakLine: true } },
      { text: p[2], options: { bold: true, color: HEX.teal, fontSize: 12, breakLine: true } },
      { text: p[3], options: { fontSize: 12 } },
    ], { x: x + 0.1, y: 1.56, w: w - 0.2, h: 1.68, valign: "middle", paraSpaceAfter: 3 });
  });
  const panels = [
    ["FaBook", "Book 01 is canonical", HEX.navy, HEX.navyTint, ["The master plan's phases map onto these gates", "Its 52 weeks stop short of retiring AD DS", "Large federal estates typically run multi-year"]],
    ["FaListCheck", "Five constraints on every phase", HEX.teal, HEX.tealTint, ["Origin and provenance; time-bound privilege", "Copies non-authoritative; drift visible", "No rip-and-replace: map, bridge, replace"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 3.45, 6.0, 1.65, p[3]);
    icon(s, p[0], x + 0.2, 3.53, 0.5, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.85, y: 3.53, w: 5.0, h: 0.5, bold: true, color: p[2], fontSize: 16, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 4.1, w: 5.6, h: 0.95, paraSpaceAfter: 2 });
  });
  decision(s, "Accept the plan against the charter, and budget the AD DS retirement phase on top of the master plan's 52 weeks",
    "Executive sponsor and CIO", "When the plan is accepted");
  sources(s, "Sources: Book 00, Chapters 05 and 07; Book 01, Chapters 09 and 12 (phases, gates and gate owners), as Book 00 cites them.");
  narrate(s,
`A plan earns its keep by saying what has to be true before the next step starts, not by putting dates on a chart.

Book 01 of the workbook is canonical: seven phases and six gates. Phase 0, Pre-flight, ends at G0, Ready to Plan. Phase 1, Foundation, ends at G1, Foundation Complete. Phase 2, the pilot division, ends at G2, Pilot Clean. Phase 3, general rollout, at G3, Rollout Complete. Phase 4, legacy retirement, at G4, Legacy Quiet. Phase 5, AD DS retirement, at G5, AD Retired. Phase 6, steady state, runs on a cadence indefinitely.

The gates are owned in proportion to what they end. The steward clears G0, G1 and G4, and co-signs G2 with the executive sponsor. The sponsor and steering committee clear G3. The sponsor and the CIO clear G5.

And five constraints bind every phase, from provenance on every change to no rip-and-replace.

The program's detailed master plan sequences 48 milestones over an illustrative 52 weeks, but its cutover ends with AD DS still running. Book 01's own fifty-two-week sequence models a mid-size, clean forest, and large federal estates typically run multi-year. So the decision for the sponsor and CIO, when they accept the plan: budget the AD DS retirement phase on top of the master plan's 52 weeks.`,
  "Book 00, Chapter 05 — The Program Plan: Phases and Gates (One plan, three altitudes; The constraints every phase obeys; The seven phases and six gates; Mapping the master plan onto the gates; The first five actions, item 1); Chapter 07 — Who Runs the Program (Who decides what).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content(S_WHAT, "Five workstreams in parallel, one critical path");
  tag(s, "What");
  const ws = [
    ["Identity", "Attribute model, dynamic membership, lifecycle origin", "Early: wave 1"],
    ["Policy", "Existing policy mapped to attribute-driven scope", "After identity"],
    ["Services", "Naming, addressing and their dependencies", "Parallel or mid"],
    ["Compute", "Device and server identity and management", "Mid to late"],
    ["Access", "Token-based, application-aware access", "Later"],
  ];
  leftTable(s, ["Workstream", "Primary focus", "Position"], ws.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.45, 3.75, 1.7], [0.4, 0.62, 0.62, 0.62, 0.62, 0.62]);
  sideBox(s, "Path", "FaRoute", HEX.amber, HEX.amberTint, "The critical path", [
    "Platform, assessment, then attribute design",
    "Then the pilot, each wave, cutover validation",
    "A week lost in assessment moves every gate",
    "PKI always waits for identity",
  ]);
  decision(s, "Name the five workstream leads, with a security-engineering lead for policy and a joint identity and security lead for access",
    "Executive sponsor and steward", "Phase 0, with its stakeholders");
  sources(s, "Sources: Book 00, Chapter 05 (Five workstreams, run in parallel; The critical path; The first five actions) and Chapter 03 (Governance and ownership); Book 01, Chapter 12, as cited.");
  narrate(s,
`Inside the phases, five workstreams carry the work: identity, policy, services, compute and access. They run together; finishing one before starting the next roughly doubles the program.

They still have an order. Identity comes first, the attribute model, dynamic membership and the lifecycle origin, because policy, access, devices and data all decide on the basis of who or what is asking. Policy follows identity. Services, naming and addressing, can run in parallel and may bridge. Compute, the device and server work, comes mid to late. Access, token-based and application-aware, comes later, because it consumes both identity and policy.

The master plan organized the same work as five technology pillars, and that view leaves two gaps. Nobody owns the question of which policy surface owns a setting, and the access plane has no pillar at all. Book 01 closes them by giving policy a security-engineering lead and access a joint identity and security lead.

The critical path runs through the platform, the assessment, attribute and group design, the pilot, each rollout wave, and cutover validation. Every week lost in assessment or attribute design moves every later gate. And one dependency never relaxes: PKI waits for identity.

The decision, made while Phase 0's stakeholders and decision rights are confirmed: name the five workstream leads, including those two.`,
  "Book 00, Chapter 05 — The Program Plan (Five workstreams, run in parallel; The critical path; The first five actions, item 2); Chapter 03 — The Program Charter (Governance and ownership; Next steps, item 1).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content(S_WHAT, "Seven projects, run inside the program");
  tag(s, "What");
  const proj = [
    ["1", "Identity Lifecycle & Provisioning", "Joiner, mover, leaver from one source"],
    ["2", "Endpoint & Device Modernization", "Governed devices; GPO sunset; NTLM plan"],
    ["3", "Network & Access Modernization", "One naming and addressing plane"],
    ["4", "Continuous Monitoring & Evidence", "One evidence contract; drift for one class"],
    ["5", "Privileged Access & Admin Identity", "Just-in-time elevation; governed break-glass"],
    ["6", "Data Platform Identity", "One engine on token or managed identity"],
    ["7", "Supply Chain & SBOM", "An SBOM for one system; certification status"],
  ];
  leftTable(s, ["#", "Project", "A working pilot delivers"], proj.map((r) => [bold(r[0], HEX.amber), bold(r[1]), { text: r[2] }]),
    [0.45, 3.1, 3.35], [0.38, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45], 12);
  sideBox(s, "Rules", "FaCubes", HEX.teal, HEX.tealTint, "Rules that keep it coherent", [
    "Never a second authoritative source",
    "Every project emits evidence in project 4's shape",
    "Privileged access: fifth on paper, early in fact",
    "No project clears a program gate on its own",
  ]);
  decision(s, "Name a sponsor and a lead for each chartered project, with every project lead reporting to the steward",
    "Agency leadership", "Each project's first act");
  sources(s, "Sources: Book 00, Chapter 06 (The seven projects at a glance; Why this order; How the projects fit the program; What the charters leave to the agency); Chapter 07 (The complementary projects).");
  narrate(s,
`Seven complementary projects turn the program's most common gaps into executable work, each with its own sponsor, lead and pilot.

In their suggested starting order: Identity Lifecycle and Provisioning; Endpoint and Device Modernization; Network and Access Modernization; Continuous Monitoring and the Evidence Fabric; Privileged Access and Administrative Identity; Data Platform Identity Transformation; and Supply Chain and Software Bill of Materials.

The order says which project has to be far enough along before the next can show results. Identity is first, because everything else consumes its attributes and owners; a device project started on unreliable attributes produces policy bypass. Monitoring comes fourth, because an evidence fabric needs at least two sources already emitting records. Privileged access is chartered fifth, but it isn't fifth in practice: the Foundation gate already needs emergency access accounts vaulted and tested, and Tier 0 administrators registered for phishing-resistant sign-in.

Every charter asks for a working pilot, not a finished estate. Two rules keep the portfolio coherent. No project designates a second authoritative source for something another project owns. And every project emits evidence in the shape the monitoring project defines.

The projects don't form a second governance structure, and no project clears a program gate on its own. Filling in their names is each project's first act, and every project lead reports to the steward.`,
  "Book 00, Chapter 06 — The Complementary Projects (Why the program has projects; The seven projects at a glance; Why this order; How the projects fit the program; What the charters leave to the agency); Chapter 07 — Who Runs the Program (The complementary projects).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = D.content(S_WHO, "Who decides: one decider per row");
  tag(s, "Who");
  const dec = [
    ["Scope, funding, sequence; when AD components retire", "Executive sponsor and CIO"],
    ["Control requirements: authentication, CA baseline, logging", "CISO"],
    ["Acceptance of security and privacy risk", "Authorizing official only"],
    ["The plan, wave sequencing, the repository", "Steward"],
    ["Target architecture or authoritative-origin rules", "Steward and sponsor together"],
    ["What each organizational attribute means", "HR"],
    ["Technical design inside a workstream", "Workstream lead, within the CISO's rules"],
  ];
  leftTable(s, ["Decision", "Who decides"], dec.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal)]),
    [4.25, 2.65], [0.38, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47], 12);
  sideBox(s, "Federal", "FaBuildingColumns", HEX.navy, HEX.navyTint, "Use the roles you already have", [
    "M-22-09: a zero trust lead within 30 days",
    "M-22-09: the whole C-suite aligned",
    "M-19-17: an agency-wide ICAM governance body",
    "Build the steward and steering committee from them",
  ]);
  decision(s, "Name the sponsor, the steward and the steering committee, built from the zero trust lead and the ICAM body, not beside them",
    "Executive sponsor and CIO", "Phase 0, before G0");
  sources(s, "Sources: OMB M-22-09 §III; OMB M-19-17; NIST SP 800-37 Rev. 2. Book 00, Chapters 03 and 07; Book 01, Chapter 09, as Chapter 07 cites it.");
  narrate(s,
`Who decides? The book's advice: name the people allowed to say no, give each decision one of them, and make the repository remember who said yes.

The book uses Book 01's program-wide model. The executive sponsor, with the CIO, owns scope, funding and sequence, breaks ties, and decides when Active Directory components retire. The CISO sets the control requirements every target surface must meet: authentication strength, the Conditional Access baseline, logging. The authorizing official is the only official who can accept security and privacy risk. The steward leads the program office and owns the plan, wave sequencing, cross-domain dependencies and the repository. A change to the target architecture, or to the rules for authoritative origin, needs the steward and the sponsor together. HR decides what each organizational attribute means. And workstream leads own their designs, inside the CISO's requirements.

Two federal requirements already name people who belong in these rows. M-22-09 required a zero trust implementation lead within 30 days, and an aligned C-suite. M-19-17 requires an integrated, agency-wide ICAM governance structure.

So the decision for the sponsor and CIO, in Phase 0: name the sponsor, the steward and the steering committee, and build them from those existing roles, not alongside them.`,
  "Book 00, Chapter 07 — Who Runs the Program (Three vocabularies, one model; Who decides what; The workstream RACI; Where the federal roles fit); Chapter 03 — The Program Charter (Governance and ownership).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = D.content(S_WHO, "Three decisions the plans put on the wrong desk");
  tag(s, "Who");
  cards(s, "Desk", [
    ["FaScaleBalanced", "Residual risk", HEX.red, HEX.redTint, ["The plans: security lead and steward", "Correct: the authorizing official alone", "Others prepare and recommend", "Written, with an end date"]],
    ["FaLandmark", "Budget and licenses", HEX.navy, HEX.navyTint, ["The plans: steward and leadership", "Correct: the sponsor and CIO", "The steward prepares the business case"]],
    ["FaDoorOpen", "Gate decisions", HEX.teal, HEX.tealTint, ["The plans: the steward signs every gate", "Correct: spread by what each gate ends", "G2, G3 and G5 are joint decisions"]],
  ]);
  decision(s, "Keep the authorizing official outside the program office, and take every risk acceptance to the AO in writing, with an end date",
    "Authorizing official", "From G0 onward");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, Appendix D (authorizing official; conflicts of interest). Book 00, Chapter 07 (Who decides what; Keeping the roles apart); Chapter 08; Appendix A.");
  narrate(s,
`Most of what the program's plans said about decisions holds. Three items don't.

Residual risk. The plans let the security lead and the steward accept it jointly. Under the Risk Management Framework, only the authorizing official can accept security and privacy risk to the organization. So the security lead and steward prepare and recommend, and the acceptance carries a justification, compensating controls and an end date.

Budget and licenses. They belong to the sponsor and CIO, who own funding. The steward prepares the case.

Gate decisions. The master plan made the steward the sole signatory at every gate. Book 01 spreads the gates across the steward, the sponsor, the steering committee and the CIO, in proportion to what each gate ends.

Four separations keep the governance honest. The authorizing official is a government official, the decision can't be delegated, and the role stays outside the program office: contractors can prepare a risk acceptance, but can't sign one. No one holds two roles that check each other. Requesters don't approve their own changes. And the component that decides isn't the one that acts.

The decision sits with the authorizing official from G0 onward, where an unremediated Critical finding needs the official's acceptance: every risk acceptance comes in writing, with an end date.`,
  "Book 00, Chapter 07 — Who Runs the Program (Who decides what; Keeping the roles apart); Chapter 08 — Pre-Flight (Step 3, security assessment; Gate G0); Appendix A (The risk register: decision rights).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = D.content(S_WHO, "The people the program needs, and its rhythm");
  tag(s, "Who");
  const fte = [
    ["Steward", "0.5", "Throughout, and ongoing"],
    ["Infrastructure lead", "1.0", "Pre-flight to legacy retirement"],
    ["Identity lead", "1.0", "Assessment to legacy retirement"],
    ["Endpoint lead", "1.0", "Foundation to legacy retirement"],
    ["DNS and PKI leads", "0.5 each", "Assessment to legacy retirement"],
    ["Security lead", "0.5", "Assessment into steady state"],
    ["Project manager", "0.5", "Throughout"],
  ];
  leftTable(s, ["Role (illustrative)", "FTE", "Engaged"], fte.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [2.4, 1.1, 3.4], [0.38, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45], 12);
  sideBox(s, "Beyond", "FaUsersGear", HEX.teal, HEX.tealTint, "Outside the 5.5-FTE core", [
    "Application owners for every app that moves",
    "Help desk capacity for every wave",
    "HR, contractor-source, records and privacy owners",
    "CISO and AO time; two red weeks go to the sponsor",
  ]);
  decision(s, "Budget explicitly for the people beyond the 5.5-FTE core, alongside the licenses, in the Phase 0 business case",
    "Executive sponsor and CIO", "Approved before design begins");
  sources(s, "Sources: Book 00, Chapter 07 (The rhythm; The gate review; The people the program needs); Appendix A (R-012, R-013); Book 01, Chapter 12, as Chapter 07 cites it.");
  narrate(s,
`Who does the work? The master plan estimated the program office and workstreams at about five and a half full-time equivalents, for an illustrative 52-week program: half a steward; a full-time infrastructure lead, identity lead and endpoint lead; and half-time DNS, PKI and security leads and a project manager. It's a planning model, not a staffing standard.

What matters more is what the estimate leaves out: application owners for every application that moves, help desk capacity for every wave, HR and contractor-source owners, records and privacy, and the CISO's and authorizing official's time for requirements and risk decisions. The program can't run without them, so budget for them explicitly. And cross-train two people per workstream.

The rhythm: daily standups, and a weekly report rating each workstream green, yellow or red. The steering committee meets every two weeks, the steward and sponsor review gate readiness monthly, and each gate gets a ninety-minute review that ends in go, no-go or conditional go. And two consecutive red weeks for any workstream go to the sponsor.

The decision for the sponsor and CIO: put those people in the Phase 0 business case, alongside the licenses, and approve the budget before design begins.`,
  "Book 00, Chapter 07 — Who Runs the Program (The rhythm; The gate review; The people the program needs); Appendix A — Risk Register and Control Traceability (R-012, R-013).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content(S_HOW, "Pre-flight: assessment before action");
  tag(s, "How");
  rows(s, "G0", "GATE G0, READY TO PLAN", [
    ["Platform host", "Operational, and protected as a Tier 0 asset"],
    ["Assessment", "Twelve AD domains, plus DHCP, LDAP, SPN and RADIUS"],
    ["Deliverables", "Fifteen committed before G0; eight plans just after"],
    ["Findings", "No open Critical; every High owned and dated"],
  ], 1.88, 0.8, 0.68, 13.5);
  sideBox(s, "Classes", "FaListCheck", HEX.red, HEX.redTint, "Each finding class has a gate", [
    "Critical: closed, or accepted by the AO, by G0",
    "High: remediated by G1, before the pilot",
    "Medium: remediated during rollout, by G3",
    "Low: tracked and reviewed at each gate",
  ]);
  decision(s, "Clear G0 only when no Critical finding is open, or the authorizing official has accepted it in writing",
    "Steward, with the sponsor as backup", "G0, Ready to Plan");
  sources(s, "Sources: Book 00, Chapter 08 (Where pre-flight sits; The platform host; The read-only assessment; The twenty-three deliverables; Gate G0); Chapter 07 (The repository as the program's memory).");
  narrate(s,
`Now, how it runs, starting with pre-flight. The program adopts one rule unchanged: assessment before action. No migration work starts until the whole forest is inventoried, classified and committed to the repository, and every plan is generated from that data.

First, the program builds the place where every decision will be written down: a platform host with one authoritative, protected writer. The reference design is Gitea on Windows Server 2025, one way to meet the requirement, not the only one. The host is a Tier 0 system, and a branch protection the steward can quietly override is a convention, not a control.

Then it reads the estate: read-only first, at default rights, then narrow delegated additions and a security assessment. The master plan's twelve Active Directory domains are joined by the DHCP, LDAP-binding and service-principal-name streams that Book 01 adds, and by an inventory of RADIUS and NPS, which depend on the directory too. The phase delivers twenty-three artifacts: fifteen committed before G0, and eight generated plans approved just after it.

G0 has three conditions: the platform host is operational, the assessment is committed, and no priority-one finding is open. Every finding is classed Critical, High, Medium or Low, and each class has a gate that closes it.

A Critical finding is remediated before G0, or formally accepted by the authorizing official. The steward clears G0 on that basis, with the executive sponsor as backup.`,
  "Book 00, Chapter 08 — Pre-Flight: Platform and Assessment (Where pre-flight sits in the program; The platform host; The read-only assessment; Step 3, security assessment; The twenty-three deliverables; Gate G0); Chapter 07 — Who Runs the Program (The repository as the program's memory).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content(S_HOW, "Foundation and pilot: prove it on one division");
  tag(s, "How");
  const panels = [
    ["FaCubes", "G1 Foundation Complete", "Cleared by the steward", HEX.navy, HEX.navyTint, [
      "The eight plans and every design approved",
      "Baseline Conditional Access enforced after a week in report-only",
      "Emergency access accounts vaulted and tested",
      "The HR feed live; every High finding remediated"]],
    ["FaUserCheck", "G2 Pilot Clean", "Signed by the steward and the sponsor", HEX.teal, HEX.tealTint, [
      "One division, typically IT; the master plan's sizes as a floor",
      "Eight measured criteria, set before the pilot opens",
      "A rollback for every surface",
      "Zero drift for the hold period; every hybrid PC has a cut date"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Gate panel ${i + 1}`, x, 1.5, 6.0, 3.6, p[4]);
    icon(s, p[0], x + 0.22, 1.65, 0.62, p[3]);
    txt(s, `Gate panel head ${i + 1}`, [
      { text: p[1], options: { bold: true, color: p[3], fontSize: 17, fontFace: "Cambria", breakLine: true } },
      { text: p[2], options: { color: HEX.slate, fontSize: 12.5 } },
    ], { x: x + 1.0, y: 1.6, w: 4.85, h: 0.72, valign: "middle" });
    txt(s, `Gate panel text ${i + 1}`, bullets(p[5], 14), { x: x + 0.25, y: 2.5, w: 5.55, h: 2.5, paraSpaceAfter: 8 });
  });
  decision(s, "Choose the pilot division, record its success thresholds in the decision log before it opens, and sign G2 on the data",
    "Steward and executive sponsor", "Before the pilot opens");
  sources(s, "Sources: Microsoft Learn — dynamic membership processing, Plan a Conditional Access deployment, emergency access accounts. Book 00, Chapter 09.");
  narrate(s,
`Phase 1, Foundation, opens by generating the eight plans from the committed assessment and approving them. It then designs every surface from those plans, attributes, dynamic groups, Intune policy, Conditional Access, sync, DNS and PKI, and builds the shared foundation the pilot needs. Group processing is planned in hours, not minutes.

The steward clears G1 when the plans and designs are approved, the baseline Conditional Access policies are enforced after at least a week in report-only, the emergency access accounts are vaulted and tested, the HR feed is live, and every High finding is remediated.

Phase 2 proves the whole pattern on real people. Book 01 sets the pilot's scope as one division, typically IT, which tolerates disruption best, and the master plan's sizes are a floor for what it must exercise. It's measured against eight criteria, from sign-in success to help desk volume. The values are illustrative: set them in the decision log before the pilot opens, and evaluate them from the systems, not from opinion. Every surface has a rollback trigger and a procedure.

G2 is signed jointly by the steward and the executive sponsor: zero drift for the agreed hold period, every criterion met, and no hybrid-joined PC without a cut date.`,
  "Book 00, Chapter 09 — Design, Pilot and Rollout (Phase 1 — Foundation; The attribute taxonomy; Dynamic groups, policy and access; Gate G1; Phase 2 — The pilot; Pilot success criteria; Rollback, surface by surface; Gate G2).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content(S_HOW, "Roll out in waves, then retire only what nothing uses");
  tag(s, "How");
  cards(s, "Retire", [
    ["FaArrowsRotate", "Phase 3: waves", HEX.navy, HEX.navyTint, ["Divisions chosen by attribute value", "The lowest-risk region first", "GPO links kept until 7 clean days", "G3: sponsor and steering committee"]],
    ["FaPlugCircleXmark", "Phase 4: legacy", HEX.amber, HEX.amberTint, ["AD FS, AD CS issuance, forwarders, links, trusts", "Retired only while its rollback works", "The domain's own zones and DC certificates stay", "G4: the steward"]],
    ["FaServer", "Phase 5: AD DS", HEX.red, HEX.redTint, ["Records officer consulted first", "Retired disks sanitized: they hold hashes", "Or a Kerberos island with an end date", "G5: the sponsor and CIO"]],
  ], 13);
  decision(s, "Decide when each Active Directory component retires, after the records officer has been consulted about the records it holds",
    "Executive sponsor and CIO", "Before any domain controller goes");
  sources(s, "Sources: Microsoft Learn — AD FS decommission guide, Group Policy for domain controllers, Active Directory accounts; NIST SP 800-88 Rev. 2. Book 00, Chapters 07, 09 and 10.");
  narrate(s,
`Phase 3, general rollout, repeats the proven pattern until every division has moved. A wave is a set of divisions chosen by attribute value, usually by region, with the lowest-risk region first. Group Policy links stay in place during a wave, and come off a migrated OU only after seven days of clean compliance. The sponsor and steering committee clear G3 when every division has passed its own exit gate.

Then the work changes character: these phases take old things away. Phase 4 retires AD FS, user and device certificate issuance from AD CS, DNS forwarders, Group Policy links, non-essential trusts and legacy servers, each through its own plan. A component is retired only while its rollback still works. Some things stay until the domain itself retires: its own DNS zones, the domain controller and LDAPS certificates, and the default domain account policies. The steward clears G4.

Phase 5 retires AD DS itself, which the master plan never reached, or reduces it to a documented Kerberos island with an end date. Two steps are easy to forget. Records come before hardware. And domain controllers store the password hashes of every account, so retired hosts and their storage are sanitized.

The sponsor and CIO clear G5, and they decide when each component retires, after the records officer is consulted.`,
  "Book 00, Chapter 09 — Design, Pilot and Rollout (Phase 3 — General rollout; Gate G3); Chapter 10 — Retirement, Steady State and Measuring Success (Phase 4 — Legacy retirement; Gate G4; Phase 5 — AD DS retirement; Gate G5); Chapter 07 (The workstream RACI: legacy decommissioning).");
}

// ------------------------------------------------------------------ How 4
{
  const s = D.content(S_HOW, "Steady state, and what success looks like");
  tag(s, "How");
  rows(s, "Outcome", "OUTCOME MEASURES AT STEADY STATE", [
    ["Drift", "Zero findings open past their SLA"],
    ["Nightly plan", "Zero actions is the normal case"],
    ["AD authentication", "Zero, or confined to dated Kerberos islands"],
    ["Evidence", "Every delivery signed and sent to the SIEM"],
    ["Ownership", "A named owner for every drift class and review"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "SLA", "FaUserClock", HEX.amber, HEX.amberTint, "Default drift SLAs (illustrative)", [
    "Critical: detect in 1 hour, fix in 4",
    "High: detect in 4 hours, fix in 24",
    "Medium: detect in 24 hours, fix in 7 days",
    "Low: detect in 7 days, fix in 30",
    "The agency sets its own values",
  ], 13);
  decision(s, "Record the handover to operations: who owns the repository and its protections, each drift class, each severity and each review",
    "Steward", "Before the project team leaves");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-7). Book 00, Chapter 10 (Phase 6; Drift remediation SLAs; Handing over to operations; The program scorecard); Chapter 05; Appendix A (R-025).");
  narrate(s,
`Phase 6, steady state, has no exit gate. The modernized estate runs under continuous governance: reassessment weekly, drift detection daily, a monthly compliance report, quarterly access reviews and an annual architecture review. The finish line is zero drift findings, zero actions from the nightly plan run, and signed evidence flowing to the SIEM.

Every finding gets a severity, and every severity a clock. The master plan's defaults run from a Critical finding fixed within four hours to a Low one within thirty days. The agency sets its own values; what the program insists on is that there are some, written into its continuous monitoring strategy and measured.

Success is measured twice. Delivery measures turn green gate by gate: the assessment accepted at G0, the target model agreed at G1, the first wave run with full provenance and evidence at G2, drift detection operating by G2 and G3, and every residual risk owned by G5. Outcome measures are what operations keeps green after the project ends.

A program can meet every delivery measure and still fail if the outcome measures drift after the project team leaves. That's why the handover is part of the scorecard. The steward records it before the team leaves: who owns the repository and its protections, each drift class, each severity and each review.`,
  "Book 00, Chapter 10 — Retirement, Steady State and Measuring Success (Phase 6 — Steady state; Drift remediation SLAs; Handing over to operations; Measuring success: the program scorecard); Chapter 05 (How success is measured); Appendix A (R-025).");
}

// ------------------------------------------------------------------ How 5
{
  const s = D.content(S_HOW, "The risk register: what can sink the program");
  tag(s, "How");
  const risks = [
    ["P-1", "Hidden dependencies missed", "A structured assessment; a pilot built to find them"],
    ["P-2", "Competing sources of truth", "One authoritative origin per object class"],
    ["P-3", "Resistance to explicit authority", "Early alignment; one decider per row"],
    ["P-4", "Tooling leads the design", "The target model before any tool is chosen"],
    ["P-5", "Physics or data residency", "Truth centralized logically, not physically"],
  ];
  leftTable(s, ["ID", "Program risk", "How the plan answers it"], risks.map((r) => [bold(r[0], HEX.red), bold(r[1]), { text: r[2] }]),
    [0.65, 2.65, 3.6], [0.38, 0.62, 0.62, 0.62, 0.62, 0.62], 12.5);
  sideBox(s, "Delivery", "FaTriangleExclamation", HEX.red, HEX.redTint, "Delivery risks to watch", [
    "AD CS misconfiguration: Critical impact, Phase 0",
    "NTLM: each dependency a dated, owned finding",
    "Strong certificate mapping: already enforced",
    "Records lost at decommission; governance decays",
  ], 13);
  decision(s, "Review the register at every gate, update the security plan and risk assessment, and carry open security risk as a POA&M item",
    "Project manager keeps it; the AO accepts", "Every gate review");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (PL-2, RA-3, CA-5); NIST SP 800-30 Rev. 1; Microsoft KB5014754. Book 00, Appendix A; Chapters 03, 05 and 07.");
  narrate(s,
`The risk register starts with five program risks. Hidden dependencies are missed in discovery: the answer is a structured assessment and a pilot designed to surface unknowns early. Competing sources of truth persist: one authoritative origin is designated per object class. The organization resists making authority explicit: the answer is early alignment, and decision rights with one decider per row. Tooling leads the design: the target model comes first, because tools bought first automate the old ambiguity faster. And physics or data residency limits centralization, so truth is centralized logically, not necessarily in one physical store.

Beneath them sit twenty-five delivery risks. A few deserve executive attention. Critical certificate-services misconfigurations can force emergency PKI work. Legacy applications depend on NTLM, which Conditional Access can't evaluate, so each dependency becomes a finding with an owner and a dated exception. Strong certificate mapping is no longer a future risk: domain controllers already enforce it. And at the end, access records can be lost at decommission, and governance can decay once the team leaves.

The register doesn't satisfy a control. It tells the agency when its system security plan and its risk assessment have to be updated, which is at every gate. The project manager keeps the register, the authorizing official accepts residual risk, and security risk left open past a gate becomes a plan of action and milestones item.`,
  "Book 00, Appendix A — Risk Register and Control Traceability (What PL-2 and RA-3 ask for; Program-level risks; Delivery risks R-002, R-003 and R-011; Risks the corrections add); Chapter 03 (Key risks); Chapter 05 (Risks that shape the plan); Chapter 07 (The workstream RACI: risk register maintenance).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content(S_HOW, "Decisions to make, and who makes them");
  tag(s, "How");
  const asks = [
    ["Charter the program as governance reconstruction; sign it and name the roles", "Executive sponsor", "Phase 0 entry"],
    ["Fund one sequenced program; budget AD DS retirement and people beyond the core", "Sponsor and CIO", "Before design begins"],
    ["Build the steward and steering committee from the zero trust lead and ICAM body", "Sponsor and CIO", "Phase 0"],
    ["Confirm the M-26-14 dates, starting with the Agency Logging Plan", "CISO's office", "Nov 18, 2026 (program's count)"],
    ["Retire, or accept in writing, every component past end of support", "Authorizing official", "Jan 12, 2027 (WS 2016)"],
    ["Set the evidence and provenance expectations for every change", "Steward", "Before the first change"],
    ["Close, or have the AO accept, every Critical finding", "Steward; the AO accepts", "G0"],
    ["Record the pilot's thresholds; sign G2 on the data", "Steward and sponsor", "Before the pilot"],
    ["Decide when each AD component retires, records officer first", "Sponsor and CIO", "Before any DC goes"],
    ["Record the handover to operations", "Steward", "Before the team leaves"],
  ];
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([7.1, 2.55, 2.5], { y: 1.45, fontSize: 12, rowH: [0.36, ...asks.map(() => 0.38)] }));
  txt(s, "Close line", [{ text: "None of these is a purchase.  ", options: { bold: true, color: HEX.amber } },
    { text: "Recover the governance once, in one program, and hold every gate on evidence." }],
    { x: 0.6, y: 5.8, w: 12.15, h: 0.6, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: Book 00, Chapters 01, 03, 05, 07, 08, 09 and 10; Appendix A.");
  narrate(s,
`So, the decisions, with their owners.

The executive sponsor charters the program as governance reconstruction, signs the charter, and puts names in it as Phase 0's entry work. The sponsor and CIO fund one sequenced program, with the AD DS retirement phase and the people beyond the five-and-a-half-person core in the budget, approved before design begins. And they build the steward and steering committee from the zero trust lead and the ICAM governance body the agency already has.

The CISO's office confirms the M-26-14 dates, starting with the Agency Logging Plan, due November 18 by the program's count. The authorizing official decides whether anything runs past end of support, beginning with Windows Server 2016 on January 12.

The steward sets the evidence and provenance expectations before the first change, and clears G0 only when every Critical finding is closed or accepted by the authorizing official. The steward and sponsor record the pilot's thresholds before it opens, and sign G2 on the data. The sponsor and CIO decide when each Active Directory component retires, after the records officer is consulted. And the steward records the handover to operations before the project team leaves.

None of these is a purchase. The case for modernizing now is that the estate's governance was never written down, the dates that bind it now belong to others, and the only way to meet them without losing that governance is to recover it deliberately, once, in one program. Thank you.`,
  "Book 00, Chapter 01 (What leadership should take from this); Chapter 03 (Next steps); Chapter 05 (The first five actions); Chapter 07 (Who decides what); Chapter 08 (Gate G0); Chapter 09 (Gate G2); Chapter 10 (Phase 5; Handing over to operations); Appendix A.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources: federal policy, NIST and FedRAMP");
  const src = [
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (January 26, 2022), §III and §III.A.  ·  OMB M-19-17, Enabling Mission Delivery through Improved ICAM (May 21, 2019), Governance, item 1.  ·  OMB M-26-14, Agency Logging and Network Visibility (May 22, 2026; rescinds M-21-31).  ·  OMB M-26-05, A Risk-based Approach to Software and Hardware Security (January 23, 2026).",
    "CISA BOD 25-01, Implementing Secure Practices for Cloud Services (December 17, 2024).  ·  CISA BOD 26-02, Mitigating Risk From End-of-Support Edge Devices (February 5, 2026).  ·  CISA Logging Reference Architecture (August 20, 2026).  ·  CISA Zero Trust Maturity Model v2.0 (April 2023).",
    "FedRAMP: Propelling Change — Consolidated Rules for 2026 (June 25, 2026); Important Dates for the Consolidated Rules; Using a FedRAMP Certified Cloud Service; Key Security Indicators (FedRAMP 20x); Notice NTC-0004 (February 25, 2026).",
    "NIST SP 800-37 Rev. 2, Appendix D.  ·  SP 800-53 Rev. 5, release 5.2.0 (PL-2, RA-3, CA-5, CA-7, SA-22, AU-11, SI-12, MP-6) and the Low and Moderate baselines.  ·  SP 800-30 Rev. 1.  ·  SP 800-88 Rev. 2 (September 2025).  ·  SP 800-137.  ·  SP 800-207 (August 2020).  ·  OSCAL layers and models.",
    "National Archives, Controlled Unclassified Information FAQ.  ·  U.S. Access Board, Revised 508 Standards.  ·  W3C, WebVTT.  ·  SpecterOps, Certified Pre-Owned (June 17, 2021).",
  ];
  txt(s, "Source list 1", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Sources: Microsoft, vendors and products");
  const src = [
    "Microsoft lifecycle: Ending Support in 2025, 2026, 2027 and 2029; Microsoft Identity Manager 2016 news and updates; Windows Server release information; PowerShell support lifecycle; Windows 10 reaching end of support; deprecated Windows features (NTLM).",
    "Active Directory: Users in AD DS; the AD logical model; Group Policy processing and domain-controller rules; AD-integrated DNS zones; AD CS overview and CA decommissioning; CRL and CDP operations; Network Policy Server; certificate auto-enrollment; deleted objects container; Backup-GPO; Get-GPInheritance; Active Directory accounts; KB5014754.",
    "Microsoft Entra: administrative units; onPremisesExtensionAttributes; PIM; licensing and ID Governance; access reviews; emergency access accounts; Conditional Access (building and planning policies, users and groups, report-only impact); continuous access evaluation; dynamic membership rules and processing; hybrid join; Cloud Sync decision guide; staged rollout; federation to cloud authentication; AD FS decommission guide; least-privileged roles.",
    "Intune and Azure: settings catalog and Group Policy analytics; policy conflicts; endpoint security; MDMWinsOverGP; supported platforms; planning guide; add-ons; Cloud PKI overview and deployment; Azure Arc machine configuration and disconnect; Azure DNS Private Resolver; SQL Server enabled by Azure Arc; Defender for Identity posture and certificate assessments; RSAT.",
    "Other: Gitea documentation (Windows service, reverse proxies, configuration, authentication, protected branches, mirrors); Git githooks; CIS Windows Server 2025 Benchmark v2.1.0.  ·  Full footnotes with links and access dates (October 21, 2026): Book 00, every chapter and both appendices.",
  ];
  txt(s, "Source list 2", bullets(src, 11.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Where each slide comes from");
  const map = [
    ["The directory governed the estate", "Ch. 01, 03"], ["Federal policy now sets the dates", "Ch. 01"],
    ["Vendor support dates cluster", "Ch. 01, 07; App. A"], ["Read the clocks exactly; one program", "Ch. 01, 07"],
    ["The charter", "Ch. 03, 05"], ["Six success criteria", "Ch. 03, 10"],
    ["Fifteen principles", "Ch. 03, 04"], ["Seven phases, six gates", "Ch. 05, 07"],
    ["Five workstreams, one critical path", "Ch. 03, 05"], ["Seven projects", "Ch. 06, 07"],
    ["Who decides", "Ch. 03, 07"], ["Three decisions on the wrong desk", "Ch. 07, 08; App. A"],
    ["People and rhythm", "Ch. 07; App. A"], ["Pre-flight", "Ch. 07, 08"],
    ["Foundation and pilot", "Ch. 09"], ["Rollout and retirement", "Ch. 07, 09, 10"],
    ["Steady state and success", "Ch. 05, 10; App. A"], ["The risk register", "App. A; Ch. 03, 05, 07"],
    ["Decisions to make", "Ch. 01, 03, 05, 07–10"],
  ];
  const half = Math.ceil(map.length / 2);
  [map.slice(0, half), map.slice(half)].forEach((part, k) => {
    s.addTable([head(["Slide", "Book 00 source"]), ...part.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
      tableOpts([3.6, 2.35], { x: 0.6 + k * 6.2, y: 1.5, fontSize: 12, rowH: Array(part.length + 1).fill(0.44) }));
  });
}

console.log(`narration: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
