// Book 14 — Federal Compliance & Authorization: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b14-compliance/build.js presentations/b14-compliance/B14_Compliance.pptx
// Every fact comes from a footnoted chapter of docs/books/b14-compliance/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 14", title: "Federal Compliance & Authorization" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B14_Compliance.pptx";

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
const rows = (s, prefix, label, list, top, step, h, size) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: size || 14, valign: "middle" });
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
// A tinted box to the right of a table, with an icon, a heading and a bullet list.
const tableBox = (s, prefix, iconName, color, tint, heading, list, h, size) => {
  box(s, `${prefix} box`, 7.75, 1.5, 5.0, h || 3.55, tint);
  icon(s, iconName, 8.0, 1.68, 0.6, color);
  txt(s, `${prefix} head`, heading, { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 13.5), { x: 8.0, y: 2.42, w: 4.6, h: (h || 3.55) - 1.0, paraSpaceAfter: 6 });
};
// A row of step boxes across the slide (numbered unless labels are given).
const steps = (s, prefix, list, tints, labels) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 14, breakLine: !!f[1] } },
      ...(f[1] ? [{ text: f[1], options: { fontSize: 12 } }] : []),
    ], { x: x + 0.12, y: 1.55, w: w - 0.24, h: 1.25, valign: "middle" });
  });
};
// Two tinted panels side by side under the step row.
const panels = (s, list) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
  icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
  txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.75, w: 5.6, h: 1.27, paraSpaceAfter: 2 });
});
// Two tall tinted columns, each with an icon, a small label, a heading and a bullet list.
const columns = (s, list) => list.forEach((c, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Column ${i + 1}`, x, 1.5, 6.0, 3.6, c[3]);
  icon(s, c[0], x + 0.25, 1.68, 0.68, c[2]);
  txt(s, `Column head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: 1.66, w: 4.75, h: 0.75, valign: "middle" });
  txt(s, `Column text ${i + 1}`, bullets(c[5], 14), { x: x + 0.3, y: 2.6, w: 5.45, h: 2.4, paraSpaceAfter: 6 });
});

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why proof, not a promise", "Can Your Authorization Prove Itself?", "Book 14 — Federal Compliance & Authorization");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing for authorizing officials, ISSOs and CIOs", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 14 of the Federal Modernization Workbook, Federal Compliance and Authorization. It's written for authorizing officials, information system security officers and C I Os.

I'll take four questions: why every control needs proof rather than a promise, and what the federal clock now asks for; what the baseline, the closure rule and the agency-level control families require; who owns compliance; and how to build the authorization package and keep it current.

The short version: a control is closed when the thing that closes it is running and the record shows it working. Everything else is a promise, and promises age.`,
  "Book 14, index; Chapter 01 — Proof, Not a Promise.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why proof, not a promise", "Who owes which proof");
  tag(s, "Why");
  const parties = [
    ["Cloud provider", "Its service, to be certified and stay certified", "FedRAMP's 2026 rules and indicators"],
    ["Agency", "Its own system and its side of the boundary", "FISMA, A-130, NIST, CISA directives, OMB memoranda"],
    ["Assessor", "Tests either party's evidence", "The framework it assesses against"],
  ];
  s.addTable([head(["Party", "Proves", "Bound directly by"]), ...parties.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 1 ? HEX.teal : HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([1.55, 2.65, 2.7], { y: 1.5, fontSize: 13, rowH: [0.42, 1.0, 1.0, 1.0] }));
  tableBox(s, "Cert", "FaLandmark", HEX.red, HEX.redTint, "Certification is evidence", [
    "“Each agency still authorizes its own federal information systems”",
    "Never a standalone ATO for a cloud service offering",
    "M-24-15: a presumption of adequacy, and the AO must still authorize",
    "Only the authorizing official accepts the residual risk",
  ], 3.42);
  callout(s, "Promise", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "A promise ages; proof can be checked again: ",
    "a plan statement backed by hand-gathered evidence is true the day it's signed. Proof is a record the system produces, which another reviewer can re-run and get the same answer.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 (Using a Certified Service; Collaborative Continuous Monitoring); OMB M-24-15 §IV.a; FISMA, 44 U.S.C. § 3554; NIST SP 800-37 Rev. 2 (Task R-4). Book 14, Chapter 01.");
  narrate(s,
`Federal compliance is usually described as a list of obligations. What an authorizing official needs is narrower: to know that each control is working today, and to be able to show anyone who asks how they know.

That's the difference between a promise and proof. A promise is a statement in the security plan, backed by evidence someone gathered by hand for the last assessment. It was true the day it was signed, and it has been aging since. Proof is a record the system itself produces, which another reviewer can check again and get the same answer.

So start by asking who owes which proof. The cloud provider proves its service under FedRAMP's 2026 rules. The agency proves its own system and its side of the boundary: its configuration, identities, data and integrations. FedRAMP is plain that each agency still authorizes its own systems, and should never issue a standalone authorization for a cloud service. OMB's M-24-15 gives a provider's package a presumption of adequacy, but the authorizing official must still issue an authorization. And only that official decides whether the remaining risk is acceptable.`,
  "Book 14, Chapter 01 — Proof, Not a Promise (Who owes which proof; The provider's certification is evidence, not the agency's authorization; What the agency inherits from the provider).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why proof, not a promise", "The federal clock: the dates still ahead");
  tag(s, "Why");
  const dates = [
    ["Oct 22, 2026*", "Post-quantum migration plan (M-26-15)", "Agency"],
    ["Nov 18, 2026*", "Agency Logging Plan (M-26-14)", "Agency"],
    ["Dec 7, 2026", "BOD 26-04 Phase III*; FedRAMP VDR, VER", "Both"],
    ["Jan 1, 2027", "FedRAMP 2026 rules mandatory", "Providers"],
    ["Feb 5, 2027*", "Listed edge devices out (BOD 26-02)", "Agency"],
    ["Jun 11, 2027", "Last new Rev5 applications", "Providers"],
    ["Jan 2, 2030", "TLS 1.3 supported (M-26-15)", "Agency"],
    ["Dec 31, 2030", "Quantum risk mitigated where feasible", "Agency"],
  ];
  s.addTable([head(["Date", "What is due", "Binds"]), ...dates.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 0 ? HEX.red : HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: r[2] === "Agency" ? HEX.teal : HEX.ink } }])],
    tableOpts([1.6, 4.1, 1.2], { y: 1.5, fontSize: 12, rowH: [0.4, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42] }));
  tableBox(s, "Moved", "FaArrowsRotate", HEX.red, HEX.redTint, "What moved this year", [
    "M-26-05: SBOMs and attestation forms are contract choices; the inventory stays required",
    "BOD 26-04 revoked BOD 19-02 and 22-01: remediation by risk",
    "M-26-15 put a firm 2030 deadline in front of 2035",
    "* Counted from the document's stated period",
  ], 3.76, 13);
  callout(s, "Register", 5.45, 1.05, "FaUserClock", HEX.red, "A date in a package is evidence: ",
    "keep one dated register (document, exact wording, whom it binds, the day last checked) and re-verify it at every gate.");
  sources(s, "Sources: OMB M-26-15, M-26-14, M-26-05; CISA BOD 26-04, BOD 26-02; FedRAMP 2026 timeline and Notice NTC-0014. All checked October 21, 2026. Book 14, Chapter 02.");
  narrate(s,
`The dates that drive this work belong to FedRAMP, CISA and OMB, and each binds a different party. Every date here was checked against its issuing document on October 21, 2026. Where a document gives a period rather than a date, the date is counted from it.

The nearest is OMB's M-26-15: each agency's post-quantum migration plan is due within 120 days, which is October 22, 2026. The same memorandum sets TLS 1.3 support by January 2, 2030, and mitigation of as much quantum risk as feasible by the end of 2030. Under M-26-14, on logging, the Agency Logging Plan falls on November 18. On December 7, CISA's BOD 26-04 holds agencies to its remediation timelines, and FedRAMP's vulnerability rules become mandatory for providers. FedRAMP's 2026 rules take mandatory effect on January 1, 2027, and listed end-of-support edge devices must be out by February 5.

Some things moved. M-26-05 made software bills of materials and attestation forms contract choices, but kept the software and hardware inventory. So keep one dated register, and re-verify it at every gate.`,
  "Book 14, Chapter 02 — The Federal Clock (Who each clock binds; FedRAMP's 2026 rules; BOD 26-04; BOD 26-02; M-26-14; M-26-05; M-26-15; The dates still ahead; How the program keeps the clock).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What a control needs", "Moderate: two facts, not one");
  tag(s, "What");
  steps(s, "Moderate", [["Categorize", "Rate each information type"], ["High-water mark", "One moderate, none high"], ["Select and tailor", "287 controls and enhancements"], ["Authorize", "The agency's own decision"]],
    [HEX.grey, HEX.grey, HEX.navyTint, HEX.tealTint], ["FIPS 199", "FIPS 200", "SP 800-53B", "The AO"]);
  panels(s, [
    ["FaBook", "NIST Moderate: the agency's system", HEX.navy, HEX.navyTint, ["Selected by the agency's own categorization", "AU-10 and AU-12(1): NIST High only", "PM and PT sit outside both lists"]],
    ["FaCloud", "Class C: the provider's service", HEX.teal, HEX.tealTint, ["Includes the current Moderate baseline", "322 listed; 36 not in NIST Moderate", "CM-5(1): NIST High only, yet in Class C"]],
  ]);
  callout(s, "Separate", 5.25, 1.25, "FaScaleBalanced", HEX.navy, "Cite the two facts separately: ",
    "“required at Moderate” means nothing until it says which. A Moderate system on a Class C service inherits the provider's side, and still proves its own against its own tailored baseline.");
  sources(s, "Sources: FIPS 199; FIPS 200; NIST SP 800-53B and release 5.2.0 OSCAL baseline profiles; FedRAMP Notice NTC-0004; FedRAMP 2026 Rev5 control reference. Book 14, Chapters 01 and 03.");
  narrate(s,
`Most civilian cloud systems are authorized at Moderate, and the word does real work. Under FIPS 199, the agency rates the impact of losing confidentiality, integrity and availability for each kind of information. FIPS 200 takes the high-water mark: at least one objective at moderate and none at high makes a moderate system. The agency then selects and tailors NIST's Moderate baseline, which in the current release holds 287 controls and enhancements. That's the size of the promise a Moderate system makes.

FedRAMP's Class C is a separate fact. It includes the current Moderate baseline, but FedRAMP lists 322 controls and enhancements for it, 36 of them outside NIST's Moderate baseline. Automated access enforcement for changes, for example, is NIST High only, yet FedRAMP lists it for Class C. Non-repudiation is High only on both lists.

So cite the two separately. A Moderate system built on a Class C service inherits the provider's evidence for the provider's side. It still has to prove its own side, against its own tailored baseline.`,
  "Book 14, Chapter 01 — Proof, Not a Promise (What \"Moderate\" means: FIPS 199, FIPS 200, SP 800-53B, FedRAMP Class C); Chapter 03 — The Control Baseline and the Crosswalk (Two facts, not one; Controls that sit outside both).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What a control needs", "A control closes only with its proof");
  tag(s, "What");
  cards(s, "Test", [
    ["FaServer", "1 · The mechanism exists", HEX.navy, HEX.navyTint, ["Deployed, running, and reaching the surface the control covers", "A purchase order, an ended pilot or a roadmap fails", "Fails: open, with a POA&M milestone"]],
    ["FaClipboardCheck", "2 · Its proof is recorded", HEX.teal, HEX.tealTint, ["A machine-readable verification, a time, and who checked", "Human-only closure is a flagged exception", "Reports are derived, never compiled"]],
    ["FaUserClock", "3 · Every claim is dated", HEX.amber, HEX.amberTint, ["A vendor roadmap is not a commitment", "Confirm with the vendor and the Marketplace first", "Write the capability into the contract (SA-4)"]],
  ], 13.5);
  callout(s, "Looks", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "Worse than open: ",
    "a control that passes the first test and fails the second looks closed and can't be shown to be. Mechanism, not product: many compliant paths before the agency chooses, exactly one after.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-2, CA-5, SA-4) and SP 800-53B; FedRAMP 2026 Rev5 control reference and Key Security Indicators; FedRAMP Marketplace data, October 21, 2026. Book 14, Chapter 04.");
  narrate(s,
`Is a control closed? A program that can't answer precisely answers loosely: the product was bought, the vendor announced the feature, the ticket was marked complete. None of those is the control operating.

The book applies two tests, in order. First, the mechanism exists: the thing that closes the control is deployed, running, and reaches the part of the estate the control covers. A purchase order, an ended pilot or a roadmap fails. Second, its proof is recorded: the closure carries a machine-readable verification, a time, and the identity of what checked it.

A control that fails the first test is open, and belongs in the plan of action with a milestone. One that passes the first but fails the second is worse: it looks closed and can't be shown to be. A person clicking complete is an exception, flagged and counted separately, and reports are derived from closure records, never compiled.

And a vendor roadmap is not a commitment. Date every claim, confirm it before a plan or contract rests on it, and write the capability into the contract.`,
  "Book 14, Chapter 04 — Closure: A Control Closes Only With Its Proof (What \"closed\" has to mean; Mechanism, not product; No closure counts without its proof; A vendor roadmap is not a commitment; How the rules line up with the controls).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What a control needs", "Program management: the agency's, never the provider's");
  tag(s, "What");
  rows(s, "PM", "WHAT THE PROGRAM MANAGEMENT FAMILY ASKS FOR", [
    ["Program plan", "One plan, approved by a senior official (PM-1)"],
    ["Senior official", "An appointed security officer (PM-2)"],
    ["Risk strategy", "A signed risk tolerance every decision cites (PM-9)"],
    ["POA&M process", "Keeps every system's plan comparable (PM-4)"],
    ["System inventory", "Lists systems; CM-8 lists components (PM-5)"],
    ["Monitoring", "One organization-wide strategy (PM-31)"],
  ], 1.92, 0.56, 0.5, 13.5);
  sideBox(s, "Outside", "FaBuildingColumns", HEX.navy, HEX.navyTint, "OUTSIDE EVERY BASELINE AND CLASS", "No certification supplies it", [
    "NIST: “deployed organization-wide,” independent of impact level",
    "FedRAMP lists no class for any of the 37 PM controls",
    "FISMA and A-130 bind the agency directly",
    "No resolver or overlay writes a risk tolerance",
  ], 14);
  callout(s, "PMclose", 5.4, 1.1, "FaFileShield", HEX.navy, "A PM control closes when ",
    "the artifact exists, a named official has approved it, and the agency can show it is still followed. An organization chart isn't evidence; a signed appointment is.");
  sources(s, "Sources: NIST SP 800-53B (Table 3-13); SP 800-53 Rev. 5, PM family; FedRAMP 2026 Rev5 control reference; OMB Circular A-130; FISMA; NIST SP 800-37 Rev. 2. Book 14, Chapters 05 and 10.");
  narrate(s,
`Some control families no cloud provider can close for you. The first is program management. NIST marks the whole family as deployed organization-wide, outside the system baselines and independent of impact level, and FedRAMP lists no class for any of its 37 controls and enhancements. The obligation comes from FISMA and OMB's Circular A-130, and it binds the agency whether or not it uses a single cloud service.

No resolver, overlay or enforcement point can write an organization's risk tolerance or appoint its senior official. These controls close when the artifact exists, a named official has approved it, and the agency can show it is still followed: the security program plan, the appointed senior agency information security officer, a risk strategy with a signed tolerance statement, a process that keeps every system's plan of action comparable, and one organization-wide monitoring strategy.

One distinction matters to an assessor. The program inventory lists systems; each system's component inventory lists what's inside it. The two must agree.`,
  "Book 14, Chapter 05 — Program Management Controls (The controls at a glance; PM-1; PM-2 and PM-10; PM-9; PM-4; PM-5; PM-6 and PM-31); Chapter 10 (What changes, in one table).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What a control needs", "Contingency and supply chain close through governance");
  tag(s, "What");
  columns(s, [
    ["FaArrowsRotate", "CONTINGENCY PLANNING", HEX.navy, HEX.navyTint, "A plan, not a capability", [
      "CP-2 asks for a plan; the runbooks are its appendices",
      "The mission owner sets maximum tolerable downtime",
      "Moderate test: a functional exercise with a restore from backup",
      "Alternate storage, processing and telecom begin at Moderate",
    ]],
    ["FaCubes", "SUPPLY CHAIN RISK MANAGEMENT", HEX.teal, HEX.tealTint, "Know what you run", [
      "M-26-05 rescinded the attestation mandate",
      "The software and hardware inventory is still required",
      "SBOMs are a contract choice; for cloud, the runtime environment",
      "SR-1, SR-2, SR-3, SR-5 and SR-8 are in every NIST baseline",
    ]],
  ]);
  callout(s, "Gov", 5.3, 1.2, "FaClipboardCheck", HEX.teal, "Both close through governance artifacts: ",
    "an approved plan, a tested exercise, a contract clause, a supplier record. FedRAMP's vulnerability rules bind providers; the agency reads their reports into its own plan of action.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CP, SR); SP 800-53B; NIST SP 800-34 Rev. 1; SP 800-161 Rev. 1; OMB M-26-05; FedRAMP NTC-0014 and VDR/VER rules. Book 14, Chapters 06 and 07.");
  narrate(s,
`Two more families close through governance rather than technology. Contingency planning asks for a plan, not a capability. An agency can have tested failover, two circuits and good backups, and still carry an open contingency plan finding, because nothing says who declares a contingency, who is told, what comes back first, or when operations are back to normal. The business impact analysis sets the numbers, and the mission owner, not the database administrator, sets the maximum tolerable downtime. For a Moderate system, NIST's contingency guide recommends a functional exercise with a restore from backup, not just a tabletop.

Supply chain moved this year. M-26-05 rescinded the secure-development attestation mandate. The software and hardware inventory is still required; software bills of materials are now a contract choice, and for a cloud platform the one to ask for covers the runtime production environment. Even so, a supply chain policy, plan, controls, acquisition terms and notification agreements are in every NIST baseline. And FedRAMP's vulnerability rules bind providers; the agency reads their reports into its own plan of action.`,
  "Book 14, Chapter 06 — Contingency Planning and Business Continuity (What the family asks; The business impact analysis; Testing and training); Chapter 07 — Supply Chain Risk Management (What the controls ask for; The federal position in October 2026; FedRAMP: what binds cloud providers).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What a control needs", "Privacy and training close by records, not settings");
  tag(s, "What");
  columns(s, [
    ["FaUserShield", "PII PROCESSING AND TRANSPARENCY", HEX.navy, HEX.navyTint, "A public promise, kept true", [
      "The privacy baseline applies at any impact level",
      "No PT control carries a FedRAMP class",
      "Authority, purpose, notice, records notices, matching",
      "The privacy official approves the privacy plan first",
    ]],
    ["FaUserCheck", "AWARENESS AND TRAINING", HEX.teal, HEX.tealTint, "A record, not a percentage", [
      "Before access (A-130); awareness at least annually (OPM)",
      "AT-2(3), social engineering, is required at Moderate",
      "Phishing exercises, AT-2(1), are optional",
      "Counts per population, against a stated roster",
    ]],
  ]);
  callout(s, "Records", 5.3, 1.2, "FaBook", HEX.navy, "No configuration closes them: ",
    "privacy closes through documents the public can read, and training through a record of who was trained, on what and when, that someone else can re-derive.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (PT, AT) and SP 800-53B privacy baseline; Privacy Act of 1974; OMB Circulars A-130 and A-108; 5 CFR 930.301; NIST SP 800-50 Rev. 1. Book 14, Chapters 08 and 09.");
  narrate(s,
`Privacy and training are the agency's, end to end. NIST's privacy baseline applies whatever the impact level, so a Low system holding the same personal information carries the same privacy controls. No privacy control carries a FedRAMP class, and none of the 2026 indicator themes is about privacy. The controls ask by what authority the agency collects the information, for what purpose, whether it told the person, and whether it published the system of records notice. The senior agency official for privacy approves the privacy plan before authorization.

Training is the one family no configuration can close. OMB's Circular A-130 requires training before access, and OPM's rule sets an annual floor for awareness. Social engineering awareness is required at Moderate; phishing exercises are optional, tailored in by choice. A dashboard showing 98 percent completion is a number with no denominator. The proof is counts per population, measured against a stated roster, which someone who didn't produce them can re-derive.`,
  "Book 14, Chapter 08 — Privacy: PII Processing and Transparency (The PT family; The legal frame; Before a system that processes PII goes live); Chapter 09 — Training and Awareness Controls (What federal law and policy require; The controls, one by one; Training records as evidence).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns compliance", "One owner for every step");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Authorizing official", "The only one who can accept risk"], ["Head of agency", "Risk tolerance; names each AO"], ["Privacy official", "Approves privacy plans for PII"]]],
    ["FaUsersGear", "Own and run", HEX.teal, HEX.tealTint, [["System owner", "More RMF tasks than any role; keeps the POA&M"], ["CISO", "Control requirements; common controls"], ["ISSO and ISSM", "Posture, change, day-to-day upkeep"]]],
    ["FaClipboardCheck", "Check and support", HEX.amber, HEX.amberTint, [["Control assessor", "Selected by the AO; never assesses own work"], ["Contingency coordinator", "Impact analysis, plan, test schedule"], ["Supply chain risk lead", "Supplier assessments; risk register"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "WHO MAY SIGN, AND WHAT STAYS APART", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Government only", "the AO, CIO, CISO, privacy official, risk management official and risk executive function", HEX.navy],
    ["Contractors prepare", "every plan, assessment and package, and sign none of the government-only decisions", HEX.teal],
    ["Kept apart", "nobody assesses their own work; the AO isn't the system owner; no one approves their own acceptance", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix D; Tasks P-1, P-2, C-3, S-6, A-1, A-6, R-1, R-4, M-6); OMB Circular A-130; FISMA; SP 800-53 Rev. 5 (CA-2(1), CA-6, PM-2, PM-10). Book 14, Chapter 10.");
  narrate(s,
`Ask who owns compliance and the answer is often the security office, which means nobody in particular. The Risk Management Framework names an owner for every task.

The system owner owns more of those tasks than any other role: categorizing, selecting and implementing controls, remediating findings, keeping the plan of action, and assembling the package. The CISO sets control requirements and the common controls that systems inherit, and reviews providers' quarterly reports or names a delegate. The privacy official approves the categorization and the privacy plan of any system with personal information.

The authorizing official is the only official who can accept the risk, and that acceptance can't be delegated. The official, or the designated representative, also approves the categorization, the plans and the assessment plan, and selects the assessor, before the assessment starts.

Six roles are government-only, among them the authorizing official, the C I O and the CISO. A contractor-heavy team can prepare every plan and package, but can't sign those decisions. And keep the roles apart: nobody assesses their own work, and the authorizing official isn't the system owner.`,
  "Book 14, Chapter 10 — Who Owns Compliance (The roles; Who must be a government official; One owner for each step of the authorization path; The responsibility matrix; Keeping the roles apart).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to authorize and monitor", "The package: four linked, machine-readable records");
  tag(s, "How");
  const pkg = [
    ["Security plan", "S-6: AO approves; owner writes", "System Security Plan"],
    ["Assessment plan", "A-2: AO approves, before testing", "Assessment Plan"],
    ["Assessment report", "A-4: the control assessor", "Assessment Results"],
    ["Plan of action", "A-6: system owner", "Plan of Action and Milestones"],
    ["Decision", "R-4: the AO alone", "A date or a frequency"],
  ];
  s.addTable([head(["Artifact", "RMF task and owner", "OSCAL model"]), ...pkg.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 4 ? HEX.red : HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal } }])],
    tableOpts([1.85, 2.75, 2.3], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.62, 0.62, 0.62, 0.62, 0.62] }));
  tableBox(s, "Disp", "FaListCheck", HEX.amber, HEX.amberTint, "A disposition for every failure", [
    "Actionable drift: open, with an owner and a deadline",
    "Governed exception: an in-date acceptance, with expiry",
    "Lapsed acceptance: reverts to open",
    "Nothing is “always satisfied”",
  ], 3.52);
  callout(s, "Generated", 5.3, 1.2, "FaFileShield", HEX.amber, "The package is meant to be generated: ",
    "NIST lets a tool produce it; FedRAMP's 2026 agency rules require tools that produce and ingest OSCAL. An empty POA&M on a Moderate system prompts a question, not a celebration.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Tasks S-6, A-2, A-4, A-6, R-1, R-4); SP 800-53 Rev. 5 (CA-2, CA-5); NIST OSCAL 1.2.3 layers, models and schemas; FedRAMP 2026 agency rules (AGU). Book 14, Chapter 11.");
  narrate(s,
`The authorizing official doesn't read the evidence directly. They read a package that summarizes it. NIST defines the package by its contents: the security and privacy plans, the assessment reports, the plans of action and milestones, and an executive summary. Each comes from a Risk Management Framework task with a named owner.

NIST also says the package may be generated from a tool, and FedRAMP's 2026 agency rules require governance and inventory tools that produce and ingest machine-readable artifacts, at least OSCAL and JSON. OSCAL gives each artifact a model, and the models link: the assessment plan imports the security plan, the results import the assessment plan, and the plan of action hangs from the security plan.

Every failing item gets a disposition. Actionable drift is an open item with an owner and a deadline. A governed exception carries an in-date acceptance and its expiry. A lapsed acceptance reverts to open. Nothing is always satisfied. And an empty plan of action on a Moderate system should prompt a question: what didn't the assessment look at?`,
  "Book 14, Chapter 11 — The Authorization Package and Continuous Monitoring (What the package contains; One OSCAL model per artifact; Assessment results; The plan of action and milestones).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to authorize and monitor", "Continuous monitoring keeps the package current");
  tag(s, "How");
  steps(s, "Cadence", [["Regenerate results", "Plan of action; posture report"], ["Provider reports", "Each one reviewed; evidence quality"], ["Independent assessor", "Every control; plans updated"], ["Ongoing authorization", "A frequency replaces the end date"]],
    [HEX.amberTint, HEX.amberTint, HEX.navyTint, HEX.tealTint], ["Monthly", "Quarterly", "Annually", "When mature"]);
  panels(s, [
    ["FaLandmark", "What the law already sets", HEX.navy, HEX.navyTint, ["FISMA: test no less than annually; no three-year rule", "A-130: move to ongoing authorization when eligible", "Manual controls are still assessed (SP 800-137)"]],
    ["FaCloudArrowUp", "Provider reports, reviewed", HEX.teal, HEX.tealTint, ["An Ongoing Certification Report every three months", "Agencies MUST review each one; name a senior official", "Notify FedRAMP of rescission-level concerns"]],
  ]);
  callout(s, "Scores", 5.25, 1.25, "FaChartLine", HEX.amber, "Vendor scores are signals, not assessment evidence: ",
    "a posture score measures progress against a vendor's recommendations. An assessment result says whether a control objective is satisfied, on what evidence, judged by an assessor.");
  sources(s, "Sources: FISMA, 44 U.S.C. § 3554(b)(5); OMB Circular A-130; NIST SP 800-37 Rev. 2; SP 800-137; SP 800-53 Rev. 5 (CA-7); FedRAMP 2026 rules (CCM-AGM-ROR, AGU); Microsoft Learn. Book 14, Chapter 11.");
  narrate(s,
`A package describes the system on the day it was generated. Continuous monitoring keeps that day recent.

The law already sets the floor. FISMA requires testing no less than annually, and there's no federal three-year rule. OMB's Circular A-130 tells agencies to move to ongoing authorization when a system is eligible, and once monitoring is mature enough, a review frequency replaces the end date. NIST is clear that controls which can't be automated must still be assessed.

The program's cadence, as its own design: monthly, regenerate the results and the plan of action, and report posture to the authorizing official. Quarterly, review each provider's Ongoing Certification Report; FedRAMP's rule says agencies must, and they should name a senior official to do it. Annually, the independent assessor re-assesses every control. Agencies must also notify FedRAMP when a report raises a concern likely to lead to rescinding the authorization.

And vendor posture scores aren't assessment evidence. A score measures progress against a vendor's recommendations. An assessment result says whether an objective is satisfied, and on what evidence.`,
  "Book 14, Chapter 11 — The Authorization Package and Continuous Monitoring (Continuous monitoring; The cadence; Ongoing authorization; What FedRAMP's 2026 rules expect; Vendor scores are not assessment evidence).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to authorize and monitor", "The series as a map, and what stays open");
  tag(s, "How");
  rows(s, "Map", "WHERE EACH PART OF THE COMPLIANCE SERIES LIVES NOW", [
    ["Foundation", "Naming, identity and transport: Books 02–04 and 07–10"],
    ["Data", "The data platform: Book 06"],
    ["Operations", "Security operations: Book 12; privileged access, Book 04"],
    ["Assurance", "Governance and assurance: this book, Chapters 05–11"],
    ["Build and run", "Implementation, automation, day-2: no new closures"],
  ], 1.92, 0.66, 0.6, 13.5);
  sideBox(s, "Residual", "FaTriangleExclamation", HEX.red, HEX.redTint, "AFTER EVERYTHING ON THE MAP IS BUILT", "Six kinds of residual risk", [
    "Self-assessment, until independently assessed",
    "What automation can't see",
    "Risk inherited from providers",
    "Evidence that stops arriving",
    "Risks outside control evaluation",
    "Design not built; features not shipped",
  ], 13.5);
  callout(s, "Order", 5.4, 1.1, "FaSitemap", HEX.amber, "Naming and identity first; assurance last: ",
    "you can't inventory what you can't name, and the package can only report what the earlier books made observable.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task R-4); SP 800-53 Rev. 5 (CA-2(1), CA-7(1)); FedRAMP 2026 rules (CCM, AGU); the series crosswalk, recounted October 21, 2026. Book 14, Chapters 03 and 12; Appendix A.");
  narrate(s,
`The Federal Compliance series arranged its material by layer; the workbook books arrange it by the question a reader brings. Chapter 12 maps each part of the series to the book that carries it now, and Appendix A indexes 149 controls. Where a book and the older series disagree, the book is the later, footnoted text.

Two dependency claims explain the map. The naming and identity floor comes first: you can't inventory what you can't name. Assurance comes last, because the package can only report what the earlier books made observable.

Build everything on the map and risk still remains, in six kinds: self-assessment, until an independent assessor confirms it; what automation can't see; risk inherited from providers; evidence that stops arriving; risks outside control evaluation, such as insider threat; and design not yet built, or features not yet shipped.

Write the remainder down. A package that lists what's proven, asserted, inherited and accepted gives the authorizing official a risk they can see.`,
  "Book 14, Chapter 12 — The Series as a Map (The map, volume by volume; What the volumes depend on; The residual risk after the whole program); Chapter 03 (How the crosswalk was built; Coverage by volume and by book).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to authorize and monitor", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaUserTie", "Name the owners, in writing", "Signed appointments; the AO selects the assessor", HEX.navy, HEX.navyTint],
    ["FaUserClock", "Keep one dated clock", "Submit the post-quantum plan; re-verify at each gate", HEX.red, HEX.redTint],
    ["FaServer", "Fund records before scanners", "Mechanisms that produce proof come first", HEX.teal, HEX.tealTint],
    ["FaFileShield", "Generate the package", "OSCAL records; a disposition on every failing item", HEX.amber, HEX.amberTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaClipboardCheck", HEX.navy, "Next step, no procurement: ",
    "fill the product inventory questionnaire against the estate as it is, verify each FedRAMP status the day you record it, and decide every flag before the security plan is written.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; OMB M-26-15; OMB Circular A-130; FedRAMP Consolidated Rules for 2026 and Marketplace data. Book 14, Chapters 01, 02, 03, 10 and 11; Appendix B.");
  narrate(s,
`So, four decisions.

Name the owners in writing: signed appointments, a person in every decide and do cell of the matrix, and the authorizing official selecting the assessor.

Keep one dated clock. Submit the post-quantum migration plan, and re-verify every federal date against its source at each gate.

Fund the mechanisms that produce records before the tools that measure them. Assessment tools confirm a design; they can't stand in for one.

And generate the package: machine-readable records, a disposition on every failing item, and a named reviewer for every provider's quarterly report.

The next step needs no procurement. Fill the product inventory questionnaire against the estate as it is, verify each FedRAMP status on the day you record it, and decide every flag before the security plan is written.

A promise is true on the day it's signed. Proof keeps showing itself. Book 14 has the detail, every claim footnoted. Thank you.`,
  "Book 14, Chapters 01 (What leadership should take from this), 02 (How the program keeps the clock), 03 (How an agency uses the two together), 10 (The responsibility matrix) and 11 (What the authorizing official should find); Appendix B.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Federal Information Security Modernization Act of 2014, 44 U.S.C. §§ 3553–3554.  ·  OMB Circular A-130 (July 2016), Appendices I and II; Circular A-108.  ·  OMB M-24-15 (July 25, 2024); M-26-05 (January 23, 2026); M-26-14 (May 22, 2026); M-26-15 (June 24, 2026).",
    "CISA: BOD 26-04 (June 10, 2026); BOD 26-02 (February 5, 2026); BOD 25-01 (December 17, 2024); Logging Reference Architecture (August 20, 2026).  ·  Privacy Act of 1974; 5 CFR 930.301.",
    "NIST: FIPS 199; FIPS 200; SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B with OSCAL baseline profiles; SP 800-37 Rev. 2; SP 800-137; SP 800-34 Rev. 1; SP 800-161 Rev. 1; SP 800-50 Rev. 1; OSCAL 1.2.3.",
    "FedRAMP Consolidated Rules for 2026: timeline; Using a Certified Cloud Service; Collaborative Continuous Monitoring; agency rules; Key Security Indicators; Rev5 control reference; Notices NTC-0004 and NTC-0014; Marketplace data (October 21, 2026).",
    "Microsoft Learn: Secure Score and Compliance Manager, cited as examples of vendor posture scores.",
    "Every date and count was checked against its primary source on October 21, 2026; dates marked * are counted from a stated period.",
    "Full footnotes with links and access dates: Book 14, every chapter and Appendices A and B (whalermike.github.io/modernization-workbook/docs/books/b14-compliance/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
