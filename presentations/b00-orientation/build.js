// Book 00 — Orientation & Program: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b00-orientation/build.js presentations/b00-orientation/B00_Orientation.pptx
// Every fact comes from a footnoted chapter of docs/books/b00-orientation/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 00", title: "Orientation & Program" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B00_Orientation.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's narration is edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const narrate = (s, body, ref) => {
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};
// Three tinted cards across the slide, each with an icon, a heading and a bullet list.
const cards = (s, prefix, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `${prefix} card ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
  icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], size || 13.5), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, paraSpaceAfter: 6 });
});
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: 14, valign: "middle" });
  });
};
// A tinted box on the right with an icon, a small label, a heading and a bullet list.
const sideBox = (s, prefix, iconName, color, tint, label, heading, list, size) => {
  box(s, `${prefix} box`, 7.1, 1.55, 5.65, 3.65, tint);
  icon(s, iconName, 7.35, 1.75, 0.72, color);
  txt(s, `${prefix} head`, [
    { text: label, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: heading, options: { bold: true, color, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
};
// Two tinted panels side by side under a step row.
const panels = (s, list) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
  icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
  txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.72, w: 5.6, h: 1.3, paraSpaceAfter: 1 });
});
// Narrow tinted columns across the slide, each with an icon, a heading and a bullet list.
const columns = (s, prefix, list, size, top, h) => {
  const n = list.length, gap = 0.15, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((c, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, top, w, h, c[3]);
    const stack = w < 2.6; // narrow columns: heading under the icon instead of beside it
    icon(s, c[0], x + 0.18, top + 0.15, stack ? 0.5 : 0.55, c[2]);
    txt(s, `${prefix} head ${i + 1}`, c[1], stack ? { x: x + 0.18, y: top + 0.72, w: w - 0.32, h: 0.6, bold: true, color: c[2], fontSize: 15, fontFace: "Cambria", valign: "middle" }
      : { x: x + 0.82, y: top + 0.1, w: w - 0.92, h: 0.65, bold: true, color: c[2], fontSize: 15, fontFace: "Cambria", valign: "middle" });
    const by = stack ? 1.4 : 0.88;
    txt(s, `${prefix} text ${i + 1}`, bullets(c[4], size), { x: x + 0.18, y: top + by, w: w - 0.32, h: h - by - 0.1, paraSpaceAfter: 5 });
  });
};

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why modernize now", "Why Modernize, and Why Now?", "Book 00 — Orientation & Program");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the case for one governed program", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 00 of the Federal Modernization Workbook, Orientation and Program: the front door to the series. It makes the case for modernizing the client/server estate now, and sets out the Federal Modernization Program that the other books carry out.

One point before we start. The workbook is independent technical guidance, not federal policy. Where it says a law, memorandum or directive requires something, it cites that source. Everything else, including the program's phases, gates, principles and decision rights, is the workbook's recommendation: one way to meet those requirements, not a requirement itself.

I'll take four questions: why modernize now, what the program is, who decides, and how it runs. Then the decisions to make next.`,
  "Book 00, index (Guidance, not federal policy); Chapter 01 — Why Modernize, and Why Now; Chapter 02 — How to Use This Workbook (Three kinds of statement).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why modernize now", "Active Directory did governance nobody wrote down");
  tag(s, "Why");
  rows(s, "Placement", "WHAT AN OBJECT'S PLACE IN THE TREE DECIDED", [
    ["Who administers it", "ACLs on the OU; delegated control"],
    ["Which policy applies", "GPOs linked to site, domain and OU"],
    ["What it can reach", "Group membership, nested far"],
    ["How it is named", "DNS zones stored in the directory"],
    ["Whether it is trusted", "Certificates enrolled via GPO"],
  ], 1.92, 0.66, 0.56);
  sideBox(s, "Cloud", "FaCloud", HEX.navy, HEX.navyTint, "THE CLOUD ESTATE", "No tree to inherit from", [
    "Entra ID administrative units can't be nested",
    "Policy is assigned to groups, evaluated per sign-in",
    "Access becomes a Conditional Access decision",
    "Names move to DDI; trust to a target PKI",
  ], 14);
  callout(s, "Delete", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "Migrate without recovering the decisions, and you delete them: ",
    "each placement has to become an explicit decision with an owner, a record and evidence. Book 01 counts eleven categories of object the directory governs this way.");
  sources(s, "Sources: Microsoft Learn — AD DS users and OUs, AD logical model, Group Policy processing, AD-integrated DNS zones, AD CS overview, Entra administrative units. Book 00, Chapter 01.");
  narrate(s,
`Why modernize now? Start with what the directory has been doing. Most federal estates still run the client/server model they built in the early 2000s, with an Active Directory forest at the center. Since Windows 2000, the organizational unit has grouped objects for delegating administrative rights and assigning policies. So placing a user or computer in the tree decided several things at once, with no separate record. Who administers it, through the permissions on the OU. Which policy applies, through Group Policy linked to sites, domains and OUs. What it can reach, through group membership. How it's named, through DNS zones stored in the directory. And whether it's trusted, through certificates enrolled by Group Policy.

None of that was wrong. It just was never written down. And the cloud doesn't inherit it. Entra ID's administrative units can't be nested, and policy is assigned to groups, not inherited from a container. An agency that moves the users and retires the forest without recovering those decisions doesn't modernize its governance. It deletes it.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (Governance nobody wrote down; Why the cloud doesn't inherit it).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why modernize now", "The schedule now belongs to OMB, CISA, FedRAMP and vendors");
  tag(s, "Why");
  const pol = [
    ["M-22-09 (Jan 2022)", "Zero Trust actions, on-premises and hybrid too", "End of FY 2024; passed, still in force"],
    ["BOD 25-01 (Dec 2024)", "Mandatory cloud-tenant configurations", "Mandatory policies June 20, 2025"],
    ["BOD 26-02 (Feb 2026)", "End-of-support internet-facing edge devices", "Listed devices out by Feb 5, 2027"],
    ["M-26-14 (May 2026)", "Rescinds M-21-31; risk-based logging", "Logging plan 90 days after Aug 20, 2026"],
    ["FedRAMP 2026 rules", "Certification in Classes A to D", "Mandatory January 1, 2027"],
  ];
  s.addTable([head(["Federal policy", "What it sets", "Dates"]), ...pol.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([1.95, 2.45, 2.5], { y: 1.5, fontSize: 12, rowH: [0.42, 0.62, 0.62, 0.62, 0.62, 0.62] }));
  box(s, "Vendor box", 7.75, 1.5, 5.0, 3.55, HEX.redTint);
  icon(s, "FaServer", 8.0, 1.68, 0.6, HEX.red);
  txt(s, "Vendor head", "Vendor support dates", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.red, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Vendor list", bullets([
    "Passed: Windows 10; Exchange Server 2016 and 2019",
    "Passed: SQL Server 2016; SharePoint 2016 and 2019",
    "Windows Server 2016: January 12, 2027",
    "SQL Server 2017: October 12, 2027",
    "Windows Server 2019 and MIM 2016: January 9, 2029",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 5 });
  callout(s, "Deadlines", 5.3, 1.2, "FaUserClock", HEX.red, "Nothing fails on one date: ",
    "the estate is surrounded by deadlines, each binding a different part of it, and each assuming the agency knows what it runs, who owns it and what governs it.");
  sources(s, "Sources: OMB M-22-09, M-26-14; CISA BOD 25-01, BOD 26-02, Logging Reference Architecture; FedRAMP Consolidated Rules for 2026; Microsoft Lifecycle, 2025–2029. Book 00, Chapter 01.");
  narrate(s,
`The second reason is the calendar, and it isn't the agency's any more. Federal policy sets dates from outside. M-22-09's Zero Trust actions were due by the end of fiscal 2024; the deadline has passed, but the actions remain in force. BOD 25-01's mandatory cloud-tenant policies were due June 20, 2025. BOD 26-02 requires listed end-of-support edge devices to be decommissioned by February 5, 2027. M-26-14 rescinded M-21-31, and asks for an Agency Logging Plan within 90 days of CISA's Logging Reference Architecture, published on August 20, 2026. Counted from that date, the plan is due November 18, 2026; that's the program's arithmetic, not a date OMB published. And FedRAMP's Consolidated Rules become mandatory on January 1, 2027.

Vendor support adds its own clock. Windows 10 and Exchange Server 2016 and 2019 ended in October 2025. Windows Server 2016, the operating system of many domain controllers, ends January 12, 2027. Nothing fails on a single date. But every deadline assumes the agency knows what it runs, who owns it and what governs it.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (The clocks that now set the schedule: Federal policy; Vendor support).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why modernize now", "Read the clocks exactly, then run one program");
  tag(s, "Why");
  cards(s, "Clocks", [
    ["FaFilter", "What the clocks don't require", HEX.navy, HEX.navyTint, ["FedRAMP certifies services; the agency authorizes its own systems", "“Moderate” is now Class C", "No document requires a Zero Trust maturity stage", "BOD 25-01 covers cloud tenants, not the forest"]],
    ["FaCodeBranch", "Why separate projects stall", HEX.red, HEX.redTint, ["Every project touches the same implicit decisions", "Rediscovered separately, they're answered differently", "Owned by no project, they fall between them", "A program sequences the dates; projects race them"]],
    ["FaRoute", "Where the sequence starts", HEX.teal, HEX.tealTint, ["Identity first: every decision depends on who is asking", "Then network services, addressing and certificates", "Telemetry and governance: last to build, first to matter"]],
  ], 13.5);
  callout(s, "Conclusions", 5.3, 1.2, "FaLightbulb", HEX.amber, "Three conclusions for leadership: ",
    "fund and govern the work as one sequence; hold gates on evidence, not on the calendar; and be honest about maturity, because a roadmap isn't a statement that the work is done.");
  sources(s, "Sources: FedRAMP, Using a FedRAMP Certified Cloud Service and Notice NTC-0004; CISA BOD 25-01; OMB M-22-09, M-26-14. Book 00, Chapter 01; Book 11, Chapters 03 and 04.");
  narrate(s,
`The clocks are often quoted for more than they say, so the program plans against the documents. FedRAMP certifies cloud services; each agency still authorizes its own systems. Moderate is now a certification class, Class C. No federal document requires a Zero Trust maturity stage. And BOD 25-01 covers cloud tenants, not the on-premises forest.

Why one program rather than a set of projects? Because every project touches the same implicit decisions. Intune needs the policy that GPO links carried. Retiring directory DNS needs the names the forest registered. Rediscovered project by project, they're answered differently; owned by no project, they fall between them until something breaks. A program can sequence the work against the external dates. A collection of projects can only race them.

The sequence starts with identity, because policy, access, devices and data all decide on the basis of who is asking. So, three conclusions: fund the work as one sequence, hold gates on evidence rather than the calendar, and be honest about maturity.`,
  "Book 00, Chapter 01 — Why Modernize, and Why Now (What the clocks don't require; Why one program, not a set of projects; What leadership should take from this).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = D.content("Why modernize now", "How the workbook works: eighteen books, four questions");
  tag(s, "Why");
  rows(s, "Question", "EVERY BOOK ANSWERS THE SAME FOUR QUESTIONS", [
    ["Why", "Why it matters, and why it can't stay as it is"],
    ["What", "What actually changes, read from the documents"],
    ["Who", "Who decides, who does the work, who owns it"],
    ["How", "Discovery and build to steady-state operation"],
  ], 1.92, 0.8, 0.68);
  sideBox(s, "Kinds", "FaBook", HEX.teal, HEX.tealTint, "THREE KINDS OF STATEMENT", "Know which one you're reading", [
    "External fact: footnoted to a primary source, checked October 21, 2026",
    "Program design position: the program's own view, open to argument",
    "Illustrative example: labeled; case studies are framing patterns",
    "A verification file per chapter: claims log and ledger",
  ], 13.5);
  callout(s, "Canonical", 5.4, 1.1, "FaSitemap", HEX.navy, "One authoritative home per topic: ",
    "the eighteen books, B00 to B17, follow the dependency chain, identity first. Book 01 is canonical for the phases and gates, and every book uses its names.");
  sources(s, "Sources: Book 00, Chapter 02 (Eighteen books; Every book asks four questions; How claims are verified). OMB M-26-14 cited there as an example of a rescission.");
  narrate(s,
`A word on how the workbook works, because this briefing comes from it. It's organized as eighteen books, B00 to B17, numbered along the same dependency chain: identity first, then the estate's infrastructure, then the boundary, assurance and operations. Every book asks the same four questions, why, what, who and how, so a reader who knows one can find their way through any other. One book is the authoritative home for each topic; Book 01, for example, is canonical for the program's phases and gates.

Statements come in three kinds. An external fact is footnoted to a primary source, checked on the day the book was built, here October 21, 2026. A program design position is the program's own view, open to argument rather than fact-checking. And an illustrative example is labeled as one; the case studies are framing patterns, not real engagements. Each chapter keeps a verification file, with a claims log and a carry-forward ledger, so every correction is visible.`,
  "Book 00, Chapter 02 — How to Use This Workbook (Eighteen books; Every book asks four questions; How claims are verified; Three kinds of statement; The verification record).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What the program is", "The charter: the page the sponsor signs");
  tag(s, "What");
  rows(s, "Objective", "SIX OBJECTIVES", [
    ["1  One origin", "Structure, identity attributes, key claims"],
    ["2  Explicit governance", "Rebuilt from attributes"],
    ["3  Drift as a finding", "Classified, never a surprise"],
    ["4  Controlled waves", "Least privilege; close with evidence"],
    ["5  No rip-and-replace", "Each domain on its own schedule"],
    ["6  Continuous evidence", "For operations and compliance"],
  ], 1.92, 0.56, 0.48);
  sideBox(s, "Scope", "FaClipboardCheck", HEX.navy, HEX.navyTint, "SCOPE", "The method, not the cutover", [
    "In: discovery of governance surfaces and hidden dependencies",
    "In: target model, wave plans, change control, drift, gates",
    "Out at first: replacing compliance frameworks",
    "Out: inline enforcement, and the agency's own cutover",
  ], 13.5);
  callout(s, "Origin", 5.4, 1.1, "FaKey", HEX.teal, "One platform fact shapes the plan: ",
    "for users synced from Active Directory, the fifteen extension attributes are mastered on premises and read-only in the cloud, so moving the origin is a scheduled change.");
  sources(s, "Sources: Microsoft Learn — Intune settings catalog vs. ADMX, Entra administrative units; Microsoft Graph, onPremisesExtensionAttributes; OMB M-22-09. Book 00, Chapter 03.");
  narrate(s,
`What is the program? It starts with a charter: short on purpose, the page the sponsor signs, and the page every later decision is checked against. Its purpose is to move the organization from fragmented, legacy-dependent identity, policy and addressing systems to a governed, attribute-driven hybrid-cloud operating model, without rip-and-replace disruption.

It has six objectives: one authoritative origin for organizational structure and identity attributes; governance rebuilt explicitly, through attributes, dynamic membership and scoped policy; drift treated as a classified finding; change in controlled waves that close with evidence; domain transformations that can each proceed on their own schedule; and continuous, machine-usable evidence.

The scope is the method. Discovery, the target model, wave plans, change control, drift detection and gates are in. Replacing compliance frameworks, inline enforcement and the agency's own cutover execution are out at first. And one platform fact shapes the plan: for synced users, the extension attributes are mastered in Active Directory and read-only in the cloud.`,
  "Book 00, Chapter 03 — The Program Charter (Purpose; Objectives; Scope; Guiding principles).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What the program is", "Six success criteria, each tested at a gate");
  tag(s, "What");
  const crit = [
    ["1", "A current-state assessment exists", "Every forest in scope, all eleven dependency types; zero open priority-one findings", "G0"],
    ["2", "The target model is agreed", "Every attribute that drives access has exactly one designated source", "G1"],
    ["3", "One domain has a complete playbook", "Entry and exit criteria written as queries; the pilot division passes them", "G2"],
    ["4", "The change-control pattern is in use", "Every pilot change carries all five clauses; human-only closures logged", "G1 onward"],
    ["5", "Drift classes are specified", "A signal, a severity and a response per class; no missed run", "G1"],
    ["6", "Leadership can explain it", "Path, risks and measures, without internal decision records", "G0, monthly"],
  ];
  s.addTable([head(["#", "Criterion", "Measure", "Checked at"]), ...crit.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: HEX.navy } }, { text: r[2] }, { text: r[3], options: { bold: true, color: HEX.teal } }])],
    tableOpts([0.5, 3.4, 6.45, 1.8], { y: 1.5, fontSize: 13, rowH: [0.42, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52] }));
  callout(s, "Thresholds", 5.3, 1.2, "FaScaleBalanced", HEX.navy, "The thresholds are the agency's: ",
    "the numbers are illustrative defaults; set your own, record them, and don't change them silently. These criteria stop at the pilot; program-level success runs to AD retirement and steady state.");
  sources(s, "Sources: Book 00, Chapter 03 (Success criteria), with Chapter 10 (the program scorecard). Gate names from Book 01, Chapter 12.");
  narrate(s,
`A sponsor can't sign off an outcome with no test attached, so each of the charter's six success criteria has a measure, the evidence that shows it, and the gate where it's checked. The current-state assessment covers every forest in scope and all eleven dependency object types, with zero open priority-one findings, at G0. The target model is agreed when every attribute that drives access has exactly one designated source, at G1. One domain has a complete playbook, whose entry and exit criteria are queries the pilot passes. The change-control pattern is in use when every pilot change carries all five clauses of the change lifecycle. Every drift class has a detection signal, a severity and a response. And leadership can describe the path, the risks and how success is measured, without citing internal decision records.

The numbers are illustrative defaults. The agency sets its own, records them, and doesn't change them silently afterwards. And these criteria stop at the pilot; Chapter 10 measures the rest of the program.`,
  "Book 00, Chapter 03 — The Program Charter (Success criteria); Chapter 10 (Measuring success: the program scorecard).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What the program is", "Fifteen principles in five groups");
  tag(s, "What");
  columns(s, "Group", [
    ["FaCubes", "Foundation · 1, 2, 11", HEX.navy, HEX.navyTint, ["Single source of truth", "Change control and provenance: five clauses", "Drift detection, on a loop"]],
    ["FaSitemap", "Directory · 3, 4, 5", HEX.teal, HEX.tealTint, ["Attribute-driven structure", "The hidden surface: eleven object types", "Eight core concepts"]],
    ["FaLaptop", "Devices and policy · 6, 7, 9, 10", HEX.amber, HEX.amberTint, ["Hybrid join, governed", "Observe before changing", "Conditional Access: all policies apply", "GPO sunset: regenerate"]],
    ["FaIdCard", "Identity and data · 8, 12", HEX.red, HEX.redTint, ["HR-driven lifecycle", "SQL Server identity: assess before migrating"]],
    ["FaUsersGear", "Program · 13, 14, 15", HEX.navy, HEX.grey, ["Education and test plans", "Zero Trust governance", "The modernization journey"]],
  ], 12.5, 1.5, 3.6);
  callout(s, "Record", 5.3, 1.2, "FaFingerprint", HEX.navy, "One idea underneath: ",
    "keep the record of what should be true apart from the systems that enforce it, and make every change prove itself against that record. No closure counts unless it carries its proof.");
  sources(s, "Sources: Microsoft Learn — PIM, Conditional Access, Intune policy conflicts, continuous access evaluation; CISA ZTMM v2.0; OMB M-22-09; NIST SP 800-207. Book 00, Chapter 04.");
  narrate(s,
`The charter carries six principles in short form; Chapter 04 sets out all fifteen, in five groups, each tied to the book that carries it in depth. Foundation principles apply to every change: a single source of truth, change control with provenance, and drift detection. The change rule is strict. Every move, add, change, deletion and reset travels five clauses: it originates with the source of truth, carries an authoritative authorization, runs under just-in-time least privilege, closes with proof, and emits evidence automatically. No closure counts unless it carries its proof.

Directory and structure principles say what replaces the OU tree. Devices and policy cover hybrid join, servers, Conditional Access and the Group Policy sunset. Identity and data cover the HR feed and SQL Server. And the program group covers training, Zero Trust governance and the overall journey. Two source rules were corrected against Microsoft's documentation, including token lifetimes: continuous access evaluation revokes sessions on events, and its tokens can last up to 28 hours.`,
  "Book 00, Chapter 04 — The Modernization Principles (How to read the principles; 2. Change control and provenance; 15. Token lifetimes, corrected; Where each principle lives).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What the program is", "Seven phases and six gates: Book 01's model");
  tag(s, "What");
  const ph = [["Pre-flight", "G0 Ready to Plan"], ["Foundation", "G1 Foundation Complete"], ["Pilot division", "G2 Pilot Clean"], ["General rollout", "G3 Rollout Complete"],
    ["Legacy retirement", "G4 Legacy Quiet"], ["AD DS retirement", "G5 AD Retired"], ["Steady state", "No gate: a cadence"]];
  const tints = [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.navyTint, HEX.amberTint, HEX.amberTint, HEX.tealTint];
  const n = ph.length, gap = 0.1, w = (12.15 - gap * (n - 1)) / n;
  ph.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `Phase ${i}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `Phase ${i} text`, [
      { text: `${i}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 13.5, breakLine: true } },
      { text: f[1], options: { fontSize: 11.5 } },
    ], { x: x + 0.1, y: 1.55, w: w - 0.2, h: 1.25, valign: "middle" });
  });
  panels(s, [
    ["FaLock", "Five constraints, every phase", HEX.navy, HEX.navyTint, ["Changes start at the source and close with provenance", "Privilege is time-bound and scoped", "Copies stay non-authoritative; drift stays visible", "No rip-and-replace needed to make progress"]],
    ["FaRoute", "The master plan, mapped", HEX.amber, HEX.amberTint, ["Same order, numbered differently", "Its 52 illustrative weeks stop short of retiring AD DS", "Five workstreams run in parallel", "PKI always waits for identity"]],
  ]);
  callout(s, "Evidence", 5.25, 1.25, "FaDoorClosed", HEX.amber, "Assessment before action: ",
    "no migration work starts until the whole forest is inventoried and committed. Week numbers are illustrative; large federal estates typically run multi-year, and the gates, not the calendar, decide.");
  sources(s, "Sources: Book 00, Chapter 05 (phases, gates, master-plan mapping, workstreams, critical path); Book 01, Chapter 12 (canonical roadmap); Book 07, Chapter 07.");
  narrate(s,
`The plan follows Book 01's seven phases and six gates. Phase 0, Pre-flight, ends at G0, Ready to Plan. Foundation ends at G1, Foundation Complete. A pilot division ends at G2, Pilot Clean. General rollout ends at G3, Rollout Complete. Legacy retirement ends at G4, Legacy Quiet. AD DS retirement ends at G5, AD Retired. And steady state has no gate; it's a standing cadence.

Five constraints bind every phase: changes originate from the authoritative source and close with provenance, privilege is time-bound, copies stay non-authoritative, drift stays visible, and nothing requires rip-and-replace. Underneath them is one rule: assessment before action.

The program's detailed master plan numbers its phases differently, and its illustrative fifty-two weeks stop short of retiring AD DS. Large federal estates typically run multi-year. Five workstreams run in parallel, identity, policy, services, compute and access, and one dependency never relaxes: PKI waits for identity. The gates, not the calendar, decide when the next phase starts.`,
  "Book 00, Chapter 05 — The Program Plan: Phases and Gates (The constraints every phase obeys; The seven phases and six gates; Mapping the master plan onto the gates; Five workstreams; The critical path).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What the program is", "Seven complementary projects, run inside the program");
  tag(s, "What");
  const proj = [
    ["1", "Identity Lifecycle & Provisioning", "Joiner, mover and leaver flows from an authoritative source", "B03, B02, B04"],
    ["2", "Endpoint & Device Modernization", "Governed devices; GPO sunset; an NTLM restriction plan", "B05"],
    ["3", "Network & Access Modernization", "One naming and addressing plane; identity-driven access", "B08, B09"],
    ["4", "Continuous Monitoring & Evidence Fabric", "One evidence contract; drift for one object class", "B11; B13 planned"],
    ["5", "Privileged Access & Administrative Identity", "Just-in-time elevation; governed break-glass", "B04"],
    ["6", "Data Platform Identity Transformation", "Token or managed-identity database sign-in", "B06"],
    ["7", "Supply Chain & Software Bill of Materials", "SBOM pipeline; certification status as a gate", "B14 planned; B10"],
  ];
  s.addTable([head(["#", "Project", "What its pilot delivers", "Book"]), ...proj.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: HEX.navy } }, { text: r[2] }, { text: r[3] }])],
    tableOpts([0.45, 4.3, 5.4, 2.0], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43] }));
  callout(s, "Coherent", 5.25, 1.25, "FaPeopleArrows", HEX.teal, "Two rules keep the portfolio coherent: ",
    "no project designates a second authoritative source for something another project owns, and every project emits evidence in the monitoring project's shape. No project clears a gate alone.");
  sources(s, "Sources: Microsoft Learn — NTLM deprecation, PIM licensing, emergency access accounts; NIST SP 800-137; FedRAMP KSIs and certified-service use; OMB M-26-05. Book 00, Chapter 06.");
  narrate(s,
`Inside the program run seven complementary projects. Each has its own charter, sponsor, lead and pilot-scale success criteria, and each turns a gap the program finds often into executable work: identity lifecycle, endpoints, network and access, continuous monitoring, privileged access, the data platform, and the supply chain.

Identity goes first, because everything else consumes its attributes and owners. Privileged access is chartered fifth but starts early, in the Foundation phase, for Tier 0 and emergency access. One detail matters there: Microsoft's guidance is at least two cloud-only emergency access accounts with permanent Global Administrator, so a target of zero permanent Global Administrators must exempt them by name.

Two source claims have moved. OMB rescinded the secure-development attestation requirement in January 2026, so a software bill of materials is now an agency choice backed by contract terms. And FedRAMP certifies a service, while the agency authorizes its own system. Finally, no project creates a second source of truth, and no project clears a program gate on its own.`,
  "Book 00, Chapter 06 — The Complementary Projects (The seven projects at a glance; Why this order; How the projects fit the program; 5. Privileged Access; 7. Supply Chain).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who decides", "Who decides: one owner for every decision");
  tag(s, "Who");
  const gates = [
    ["G0  Ready to Plan", "Steward"],
    ["G1  Foundation Complete", "Steward"],
    ["G2  Pilot Clean", "Steward and executive sponsor"],
    ["G3  Rollout Complete", "Sponsor with the steering committee"],
    ["G4  Legacy Quiet", "Steward"],
    ["G5  AD Retired", "Executive sponsor and the CIO"],
  ];
  s.addTable([head(["Gate", "Cleared by"]), ...gates.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([2.9, 4.0], { y: 1.5, fontSize: 13, rowH: [0.42, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52] }));
  box(s, "Wrong box", 7.75, 1.5, 5.0, 3.55, HEX.tealTint);
  icon(s, "FaUserTie", 8.0, 1.68, 0.6, HEX.teal);
  txt(s, "Wrong head", "Three decisions the plans misplaced", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Wrong list", bullets([
    "Residual risk: the authorizing official alone",
    "Budget and licenses: the sponsor and CIO; the steward prepares",
    "Gates: spread by what each one ends, not all the steward's",
    "The authorizing official stays outside the program office",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Federal roles", 5.3, 1.2, "FaLandmark", HEX.teal, "Use the roles federal policy already names: ",
    "M-22-09's zero trust strategy implementation lead and M-19-17's agency-wide ICAM governance structure. Build the steward and steering committee from them, not alongside them.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, Appendix D; OMB M-22-09, §III; OMB M-19-17, Governance. Book 00, Chapters 03 and 07; Book 01, Chapter 09.");
  narrate(s,
`Who decides? The workbook uses Book 01's model, and gives every decision an owner. The executive sponsor, with the CIO, owns scope, funding and sequence, and decides when Active Directory components retire. The CISO sets the control requirements. The steward leads the program office and owns the plan and the repository. Gates follow what each one ends: the steward clears G0, G1 and G4; the steward and sponsor co-sign G2; the sponsor and steering committee clear G3; and the sponsor and the CIO clear G5.

The program's plans gave three decisions to the wrong person. Residual risk belongs to the authorizing official alone: under the Risk Management Framework, no one else can accept it, and for federal agencies the role is inherently governmental. Budget belongs to the sponsor and CIO. And gates aren't the steward's alone.

The master plan's core team is about five and a half full-time equivalents. Budget beyond it, for application owners, the help desk, HR, records and the authorizing official's time.`,
  "Book 00, Chapter 07 — Who Runs the Program (Three vocabularies, one model; Who decides what; The people the program needs; Keeping the roles apart; Where the federal roles fit); Chapter 03 (Governance and ownership).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How it runs", "From pre-flight to steady state: what each stretch proves");
  tag(s, "How");
  columns(s, "Stretch", [
    ["FaServer", "Pre-flight", HEX.navy, HEX.navyTint, ["Platform host built as Tier 0", "Read-only assessment: twelve domains plus DHCP, LDAP, SPN map", "23 deliverables: 15 before G0, 8 plans after", "G0: no open critical finding"]],
    ["FaUsersGear", "Design, pilot, rollout", HEX.teal, HEX.tealTint, ["CA baseline enforced after 7 days in report-only", "Pilot: eight numeric criteria", "Drift-clean hold before G2", "Waves chosen by attribute value"]],
    ["FaPlugCircleXmark", "Retirement", HEX.amber, HEX.amberTint, ["Retire only while the rollback works", "DC certificates and domain zones stay to Phase 5", "Records officer before hardware", "Sanitize disks per SP 800-88 Rev. 2"]],
    ["FaArrowsRotate", "Steady state", HEX.red, HEX.redTint, ["Weekly reassessment; daily drift", "Default: critical drift fixed in 4 hours", "Handover recorded, an owner per drift class"]],
  ], 12.5, 1.5, 3.6);
  callout(s, "Twice", 5.3, 1.2, "FaChartLine", HEX.amber, "Measure success twice: ",
    "delivery measures that turn green gate by gate, and outcome measures that operations keeps green after the project team leaves.");
  sources(s, "Sources: Microsoft Learn — AD FS migration, DC Group Policy, CA decommissioning, DC password hashes; NIST SP 800-88 Rev. 2; Microsoft Entra licensing. Book 00, Chapters 08, 09 and 10.");
  narrate(s,
`How does it run? Pre-flight builds the platform host as a Tier 0 system and runs the read-only assessment: the master plan's twelve domains, plus DHCP, LDAP bindings and the service principal name map. It produces twenty-three deliverables: fifteen committed before G0, and eight modernization plans approved just after it. G0 passes with no open critical finding.

Foundation enforces the Conditional Access baseline after at least seven days in report-only. The pilot is one division, measured against eight numeric criteria, such as authentication success above 99 percent, and held drift-free for an agreed period. Rollout then moves in waves chosen by attribute value.

Retirement takes things away, so an action is retired only while its rollback still works. Domain controller certificates and the domain's own DNS zones stay until Phase 5. Consult the records officer before any hardware goes, and sanitize retired disks, which hold password hashes. In steady state, reassessment runs weekly and drift detection daily, with a clock for each severity: by default, a critical finding is fixed within four hours.`,
  "Book 00, Chapter 08 — Pre-Flight: Platform and Assessment; Chapter 09 — Design, Pilot and Rollout (Gate G1; Pilot success criteria; Waves); Chapter 10 — Retirement, Steady State and Measuring Success.");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How it runs", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaUserCheck", "Charter it and name the people", "Sponsor and steward first, from the zero trust lead and ICAM body", HEX.navy, HEX.navyTint],
    ["FaListCheck", "Scope the read-only assessment", "Which forests, which tenants, which read-only accounts", HEX.teal, HEX.tealTint],
    ["FaDatabase", "Designate the authoritative sources", "HR for employees; a source of their own for contractors", HEX.amber, HEX.amberTint],
    ["FaScaleBalanced", "Set thresholds before the first change", "Success thresholds, drift severities and provenance rules", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaClipboardCheck", HEX.navy, "First wave, and one close clock: ",
    "start with identity structure and dynamic membership, since every later wave scopes itself with them. By the program's count, M-26-14's Agency Logging Plan is due November 18, 2026: confirm it with the CISO's office.");
  sources(s, "Sources: OMB M-22-09, M-19-17, M-26-14; CISA Logging Reference Architecture. Book 00, Chapters 01, 03, 05, 07 and 10.");
  narrate(s,
`So, four decisions to make next.

Charter the program and name its people, starting with the sponsor and the steward, built from the zero trust lead and the ICAM governance the agency already has.

Scope the read-only assessment: which forests, which tenants, which read-only accounts.

Designate the authoritative sources: normally the HR system for employees, and a source of their own for contractors, whom HR usually doesn't hold.

And set the thresholds and evidence rules before the first change: success criteria, drift severities and provenance expectations, recorded and never changed silently.

The recommended first wave is identity structure and dynamic membership, because every later wave scopes itself with them. And one clock is close: by the program's count, M-26-14's Agency Logging Plan is due November 18, 2026, so confirm that date with the CISO's office now.

Recover the governance once, in one program, and let named people make the decisions the evidence supports. Book 00 has the detail, every claim footnoted. Thank you.`,
  "Book 00, Chapter 03 (Assumptions; Next steps); Chapter 05 (The first five actions); Chapter 07 (Where the federal roles fit); Chapter 10 (Drift remediation SLAs); Chapter 01 (M-26-14 dates).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB: M-22-09 (January 26, 2022); M-19-17 (May 21, 2019); M-26-14 (May 22, 2026; rescinds M-21-31); M-26-05 (January 23, 2026; rescinds M-22-18 and M-23-16).",
    "CISA: BOD 25-01 (December 17, 2024); BOD 26-02 (February 5, 2026); Logging Reference Architecture (August 20, 2026); Zero Trust Maturity Model v2.0 (April 2023).",
    "FedRAMP: Consolidated Rules for 2026 (launched June 25, 2026), Important Dates, Using a FedRAMP Certified Cloud Service, Key Security Indicators; Notice NTC-0004 (February 25, 2026).",
    "NIST: SP 800-37 Rev. 2, Appendix D; SP 800-207; SP 800-137; SP 800-88 Rev. 2 (September 2025); SP 800-53 Rev. 5, release 5.2.0.",
    "Microsoft Learn: AD DS OUs and logical model; Group Policy processing; AD-integrated DNS; AD CS; Entra administrative units; PIM; emergency access; Conditional Access; continuous access evaluation; Intune conflicts; NTLM deprecation; Entra licensing; Lifecycle end-of-support pages, 2025–2029; MIM 2016.",
    "Microsoft Graph, onPremisesExtensionAttributes.  ·  Gitea, Protected Branches.  ·  U.S. Access Board, Revised 508 Standards.  ·  W3C, WebVTT.",
    "Full footnotes with links and access dates (October 21, 2026): Book 00, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b00-orientation/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
