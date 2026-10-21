// Book 16 — People: Training & Education: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b16-people/build.js presentations/b16-people/B16_People.pptx
// Every fact comes from a footnoted chapter of docs/books/b16-people/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 16", title: "People: Training & Education" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B16_People.pptx";

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
const steps = (s, prefix, list, tints, labels, labelColor, size) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: labelColor ? labelColor[i] : HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: size || 14, breakLine: !!f[1] } },
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
const columns = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Column ${i + 1}`, x, 1.5, 6.0, 3.6, c[3]);
  icon(s, c[0], x + 0.25, 1.68, 0.68, c[2]);
  txt(s, `Column head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: 1.66, w: 4.75, h: 0.75, valign: "middle" });
  txt(s, `Column text ${i + 1}`, bullets(c[5], size || 14), { x: x + 0.3, y: 2.6, w: 5.45, h: 2.4, paraSpaceAfter: 6 });
});

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why people close the gap", "Who Will Run the New Estate?", "Book 16 — People: Training & Education");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing for CIOs, CISOs, workforce and training leads, ISSOs and help desk leads", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 16 of the Federal Modernization Workbook, People: Training and Education. It's written for C I Os and CISOs, workforce and training leads, I S S Os, and help desk leads.

I'll take four questions: why people, not tools, close the gap; what the program teaches; who owns workforce readiness; and how to run the curriculum and measure whether it worked.

The short version: every book before this one changes what someone does. Tools enforce the new rules, but people run the estate, and a program that trains last pays twice.`,
  "Book 16, index; Chapter 01 — People, Not Tools, Close the Gap.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why people close the gap", "Tools enforce; people decide");
  tag(s, "Why");
  columns(s, [
    ["FaShieldHalved", "WHAT A TOOL CAN DO", HEX.navy, HEX.navyTint, "Enforce the rule", [
      "Conditional Access requires phishing-resistant sign-in",
      "An entitlement review lists everyone with access",
      "A drift check finds a server off its baseline",
      "Each one leaves a decision for a person",
    ]],
    ["FaUserCheck", "WHAT ONLY A PERSON CAN DO", HEX.teal, HEX.tealTint, "Decide what it means", [
      "Is this caller who they say they are?",
      "Is this access request justified?",
      "Fix, accept or escalate this drift finding?",
      "Is the evidence complete before it goes to the AO?",
    ]],
  ], 14);
  callout(s, "Split", 5.3, 1.2, "FaPeopleArrows", HEX.red, "Almost every book splits a job into deciding and doing: ",
    "two people now need the procedure where one did, and some decisions move outside IT, to HR staff, application owners, contracting officer's representatives and records officers.");
  sources(s, "Sources: Book 16, Chapter 01 (What each book changes in people's work; Tools enforce, people decide), drawing on the who chapters of Books 04, 13 and 14.");
  narrate(s,
`A Conditional Access policy can require phishing-resistant sign-in for every user. It can't decide what happens when a caller tells the help desk their security key is lost and they need to sign in now. An entitlement review can list everyone with access, but it can't make the owner read the list. A drift check can find a server that left its baseline, but it can't say whether the exception behind it was ever approved.

The program's position is that this technology moves risk from configuration to judgment. What's left is a smaller number of human decisions that carry more weight. And almost every book splits a job into deciding and doing, and moves some decisions to people outside I T, such as HR staff and application owners. A person who doesn't know the new rule falls back on the old habit, which is exactly what the modernization was meant to remove.`,
  "Book 16, Chapter 01 — People, Not Tools, Close the Gap (opening; What each book changes in people's work; Tools enforce, people decide).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why people close the gap", "Training last is paid for twice");
  tag(s, "Why");
  columns(s, [
    ["FaTriangleExclamation", "THE FIRST PAYMENT", HEX.red, HEX.redTint, "At cutover", [
      "Untrained users call the help desk about sign-in",
      "An untrained desk refuses real callers, or resets without the checks",
      "Administrators ask for standing roles “until things settle”",
      "Exceptions granted under pressure tend to stay",
    ]],
    ["FaArrowsRotate", "THE SECOND PAYMENT", HEX.amber, HEX.amberTint, "Afterward", [
      "Find and remove the workarounds",
      "Retrain the people who made them",
      "Unlearn the first weeks' habits; slower than learning",
      "Explain the gap in the training evidence",
    ]],
  ], 14);
  callout(s, "Rules", 5.3, 1.2, "FaLandmark", HEX.red, "The rules already put training first: ",
    "OPM requires awareness before access and training on any significant change; SP 800-53 asks for training when system changes require it; A-130 requires role training before access is authorized.");
  sources(s, "Sources: 5 CFR 930.301(b), (d); NIST SP 800-53 Rev. 5 (AT-2, AT-3, IR-2, CP-3), release 5.2.0; OMB Circular A-130, Appendix I §4.h. Book 16, Chapter 01.");
  narrate(s,
`Many programs train at the end: build, migrate, then train. The program's observation is that this is paid for twice.

The first payment comes at cutover. Users who weren't taught the new sign-in call the help desk. A help desk that wasn't taught the new verification either refuses legitimate callers or resets accounts without the checks meant to stop impersonation. Administrators ask for standing roles until things settle, and exceptions granted under pressure tend to stay.

The second payment comes afterward. The workarounds have to be found and removed, people retrained, and habits unlearned, which is slower than learning.

Federal rules already put training before the change. OPM's rule requires awareness material before access, and training whenever the system environment or procedures change significantly. NIST's controls ask for training when system changes require it, and OMB Circular A-130 requires role-based training before access is authorized. So training last also puts the agency behind requirements it already has.`,
  "Book 16, Chapter 01 — People, Not Tools, Close the Gap (Why training last costs twice).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why people close the gap", "What federal workforce rules require");
  tag(s, "Why");
  const rules = [
    ["FISMA (2014)", "Trained personnel sufficient to comply; CIO trains staff with significant security duties"],
    ["5 CFR 930.301 (2004)", "A training plan; five audiences; awareness before access; training on change"],
    ["OMB A-130 (2016)", "CHCO and CIO set competency requirements; test users' knowledge"],
    ["Workforce Assessment Act (2015)", "Identify every cyber position and assign it a NICE code"],
    ["NICE Framework v2.2.0", "Shared vocabulary: 5 categories, 42 work roles (April 2026)"],
  ];
  s.addTable([head(["Source", "What it adds for the workforce"]), ...rules.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([2.0, 4.9], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.62, 0.62, 0.62, 0.62, 0.62] }));
  tableBox(s, "Not", "FaScaleBalanced", HEX.red, HEX.redTint, "What the rules don't require", [
    "No industry certification for civilian staff",
    "No annual number beyond awareness",
    "NICE is guidance; coding positions is mandatory",
    "DoD 8140 binds DoD and its contractors, not civilian agencies",
  ], 3.62);
  callout(s, "Codes", 5.3, 1.2, "FaHashtag", HEX.red, "The codes are a roster input, not settled fact: ",
    "in 2019 GAO found 22 of 24 agencies had given a non-IT code to 15,779 IT management positions, about 19 percent. A code that disagrees with a role assignment is a finding for HR and the CIO's office.");
  sources(s, "Sources: 44 U.S.C. § 3554; 5 CFR 930.301; OMB A-130 §5.c; Pub. L. 114-113, Div. N, Title III; OPM coding memos (2017, 2022); NIST SP 800-181 Rev. 1 and NICE Components v2.2.0; GAO-19-144; DoDM 8140.03. Book 16, Chapter 02.");
  narrate(s,
`FISMA is a staffing requirement as much as a course requirement: the agency head must have trained personnel sufficient to comply, and the C I O trains and oversees people with significant security duties. OPM's rule names five audiences, from every user to I T operations staff. Circular A-130 has the chief human capital officer and the C I O set competency requirements together. And the Federal Cybersecurity Workforce Assessment Act requires every agency to identify its cyber positions and code each one to the NICE Framework, NIST's vocabulary of forty-two work roles.

The codes haven't been reliable. In 2019, GAO found that 22 of 24 agencies had given a non-I T code to about nineteen percent of their I T management positions. So the program treats codes as one roster input, not settled fact.

Just as important is what the rules don't require: no civilian certification mandate, and the Defense Department's eighty-one forty program doesn't apply to civilian agencies.`,
  "Book 16, Chapter 02 — What Federal Workforce Rules Require (The sources at a glance; FISMA; OPM's rule; OMB Circular A-130; The NICE Framework; Coding the positions; How well it has worked; What the rules don't require; DoD 8140, as a contrast).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What the program teaches", "Education first, then training by role");
  tag(s, "What");
  steps(s, "Idea", [["Governance runs continuously"], ["Identity is the starting point"], ["One map, not many inventories"], ["Every record names its source"], ["A lifecycle, not a project"], ["Drift is the feedback signal"]],
    [HEX.grey, HEX.navyTint, HEX.grey, HEX.navyTint, HEX.grey, HEX.navyTint], null, null, 13.5);
  panels(s, [
    ["FaLightbulb", "Education: the mental model", HEX.navy, HEX.navyTint, ["For everyone, before any tool, in this order", "A 90-minute facilitated walkthrough", "A self-serve written path; a 45-minute auditor briefing"]],
    ["FaRoute", "Training: four tracks by role", HEX.teal, HEX.tealTint, ["Compliance, for people who evidence controls", "Implementation, for people who build", "Vendor training and labs; end-user training"]],
  ]);
  callout(s, "Model", 5.25, 1.25, "FaUserCheck", HEX.navy, "Why the order matters: ",
    "someone who holds the six ideas understands why the help desk asks for verification, why a role is activated instead of held, and why a screenshot isn't evidence. Someone who doesn't feels every rule as friction.");
  sources(s, "Sources: Book 16, Chapters 01 (Education before training) and 09 (Orientation: education before training); Book 00, Chapter 04, Principle 13.");
  narrate(s,
`Now what the program teaches. It separates education from training. Education builds the mental model, for everyone, before any tool, and it teaches six ideas in order, because each depends on the one before. Governance is a system that runs continuously. Identity is the starting point. One map replaces many inventories. Every derived record names its source and version. Modernization is a lifecycle under change control, not a project that ends. And drift is the feedback signal.

Someone who holds those ideas understands why the help desk now asks for verification, why a role is activated instead of held, and why a screenshot isn't evidence. Orientation comes as a ninety-minute walkthrough, a self-serve written path, and a forty-five-minute briefing for auditors and assessors.

Training comes after, by role, in four tracks: compliance, for people who evidence controls; implementation, for people who build; vendor training and labs; and end-user training for everyone who signs in.`,
  "Book 16, Chapter 01 (Education before training); Chapter 09 — Building and Running the Curriculum (Orientation: education before training).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What the program teaches", "The compliance track teaches tracing");
  tag(s, "What");
  const areas = [
    ["1", "Identity", "IA-2, IA-5, AC-2, AC-6"],
    ["2", "Addressing and inventory", "CM-8"],
    ["3", "Network", "SC-7, SC-8, AC-4"],
    ["4", "Telemetry", "CA-7, SI-4, AU-6, RA-5"],
    ["5", "Endpoint", "CM-8, IA-3, SI-2"],
    ["6", "Configuration, change, supply chain", "CM-2, CM-3, SR, PM"],
    ["7", "Continuity", "CP-2, CP-3, CP-4"],
    ["8", "Training", "AT-2, AT-3, AT-4, IR-2, CP-3"],
  ];
  s.addTable([head(["Module", "Evidence area", "Anchor controls"]), ...areas.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy, align: "center" } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal } }])],
    tableOpts([0.9, 3.2, 2.8], { y: 1.5, fontSize: 12, rowH: [0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38] }));
  tableBox(s, "Zero", "FaFileShield", HEX.navy, HEX.navyTint, "Module 0: four ideas", [
    "The RMF's seven steps, Prepare to Monitor",
    "Who owes which proof; only the AO accepts risk",
    "Moderate and FedRAMP Class C: two facts, not one",
    "FedRAMP's 46 indicators bind providers",
  ], 3.42, 13);
  callout(s, "Trace", 5.3, 1.2, "FaRoute", HEX.navy, "Trace in both directions: ",
    "from a control to the mechanism, the book that built it, the record it emits and its place in the package; from a record back to its control and its date. A policy screenshot doesn't prove a sign-in was phishing-resistant.");
  sources(s, "Sources: NIST RMF and SP 800-37 Rev. 2; FedRAMP 2026 rules (Agency Use; Key Security Indicators) and Notice NTC-0004; SP 800-53A Rev. 5; SP 800-137. Book 16, Chapter 03.");
  narrate(s,
`The compliance track is for the people who read evidence rather than build it: I S S Os, compliance staff, control assessors and authorizing officials. It teaches one skill above the others, tracing. Given a control, name the mechanism that closes it, the book that built it, the record it emits and where that record sits in the authorization package. Given a record, work back to its control and say whether it's current.

The orientation module carries four ideas: the Risk Management Framework's seven steps; who owes which proof, with only the authorizing official accepting residual risk; Moderate and FedRAMP's Class C as two facts, not one; and FedRAMP's forty-six key security indicators binding providers, not agencies.

Eight modules then follow the program's evidence areas, from identity to training. Each one teaches a discipline: a policy screenshot can't show that a sign-in was phishing-resistant; only the sign-in record can. The capstone is a continuous-monitoring narrative for one system.`,
  "Book 16, Chapter 03 — The Compliance Track (Who the track is for; Module 0; Modules 1 to 8; The capstone).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What the program teaches", "Implementation: done means the evidence landed");
  tag(s, "What");
  steps(s, "Build", [["Orientation", "Books 00, 01"], ["DNS and IPAM", "Book 08"], ["Identity", "Books 02, 03"], ["Certificates, access", "Books 07, 04"], ["Network, then data", "Books 09, 06"], ["Day two", "Book 15, last"]],
    [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.navyTint, HEX.navyTint, HEX.tealTint], ["0", "1", "2", "3–4", "6–7", "10"]);
  panels(s, [
    ["FaListCheck", "Three habits every lab teaches", HEX.navy, HEX.navyTint, ["Observe first: report-only, monitor and shadow modes", "Keep a way back in: emergency access accounts first", "Export the record, not a screenshot"]],
    ["FaBook", "Certifications: examples, not proof", HEX.teal, HEX.tealTint, ["AZ-500 retired Aug. 31, 2026; SC-500 replaced it", "AZ-800 and AZ-801 retired Sept. 30; AZ-802 is current", "Microsoft certifications expire every year"]],
  ]);
  callout(s, "Done", 5.25, 1.25, "FaClipboardCheck", HEX.navy, "A module is done when it works and its evidence has landed: ",
    "a re-run of the check reads the learner's own record. Devices, the cloud platform and security operations (modules 5, 8, 9) run in parallel once identity exists.");
  sources(s, "Sources: Microsoft Learn (Plan a Conditional Access deployment; emergency access accounts; exam and course retirement, Oct. 22, 2026; certification renewal). Book 16, Chapter 04.");
  narrate(s,
`The implementation track teaches the same estate from the engineer's chair, in ten build modules from D N S and address management to day-two operations. The order is a real dependency chain: address before you identify, identify before you shape transport, transport before you place data, and certificates before the network enforces. Devices, the cloud platform and security operations run in parallel once identity exists. Day two comes last, because it runs what everything else built.

Every module ends the same way. Done means it works and its evidence has landed where an assessor can read it. Every lab teaches three habits: observe before you enforce, with report-only, monitor and shadow modes; keep a way back in, with emergency access accounts created first; and export the record, not a screenshot.

Certifications are examples, not proof, and they change. Microsoft retired AZ-500 on August 31, 2026, and SC-500 replaced it. So the program re-checks its certification table at every gate.`,
  "Book 16, Chapter 04 — The Implementation Track (The rule of the track; The build modules; Order and pairing; Example certifications).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What the program teaches", "Certify what people can show");
  tag(s, "What");
  rows(s, "Scale", "ONE FOUR-LEVEL SCALE FOR EVERY CAPSTONE", [
    ["0  Missing", "Not addressed, or no tie to the books"],
    ["1  Named", "Right books; controls or evidence wrong"],
    ["2  Traced", "Book to control to evidence source, correct"],
    ["3  Assessor-ready", "A real, dated result; gaps stated honestly"],
  ], 1.95, 0.8, 0.7, 14);
  sideBox(s, "Cred", "FaIdCard", HEX.teal, HEX.tealTint, "TWO PROGRAM CREDENTIALS", "Earned with artifacts", [
    "Practitioner: implementation capstone and the exam for its area",
    "Assessor: the full exam and the compliance capstone, or scores within one level of a second assessor",
    "Both expire after 12 months, or when the procedure changes",
  ], 14);
  callout(s, "Bar", 5.35, 1.15, "FaClipboardCheck", HEX.teal, "Pass bar: every area at 2, three at 3, and all four checks. ",
    "A no-findings after-action report scores 0, and so does a percentage with no per-person records. An industry certification can waive a module, never a capstone.");
  sources(s, "Sources: OMB A-130, Appendix I §4.h; NIST SP 800-50 Rev. 1 (Kirkpatrick Level 2); SP 800-53 Rev. 5 release 5.2.0 and SP 800-53B; Microsoft Learn renewal FAQ. Book 16, Chapter 05.");
  narrate(s,
`Federal guidance asks for more than completion. A-130 asks agencies to test users' knowledge, and NIST's learning-program guide recommends practical assessments that mimic the work role. So the program certifies only what a person can show, with an artifact someone else could check.

Every capstone is scored on one four-level scale. Zero is missing. One names the right books but gets the controls or the evidence wrong. Two traces the chain from book to control to evidence source. Three is assessor-ready: a real, dated result, with an honest statement of what isn't evaluated yet. The compliance capstone passes with every area at two or better, at least three at three, and all four whole-submission checks. An after-action report with no findings scores zero, and so does a training percentage with no per-person records behind it.

Two credentials follow: practitioner for builders, assessor for compliance staff. Both expire after twelve months. An industry certification can waive a module, but never a capstone.`,
  "Book 16, Chapter 05 — Assessment and Certification (The scale; The eight evidence areas; Scoring the capstones; Two credentials; Recertification; Industry certifications).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What the program teaches", "Vendor training, and labs that can't hurt production");
  tag(s, "What");
  columns(s, [
    ["FaFilter", "CHOOSING VENDOR TRAINING", HEX.navy, HEX.navyTint, "Four tests, free or paid", [
      "It maps to a book procedure",
      "It is current; vendors retire courses often",
      "The agency can keep the completion record",
      "Its handling of learner data is known",
    ]],
    ["FaLaptop", "WHERE LABS RUN", HEX.teal, HEX.tealTint, "Arranged by the program office", [
      "Microsoft Learn's free sandboxes are gone",
      "Developer sandbox: eligibility limits; no government cloud",
      "No free sandbox in GCC High or DoD",
      "Rehearse once in a non-production government tenant",
    ]],
  ], 14);
  callout(s, "Rules", 5.3, 1.2, "FaLock", HEX.teal, "Rules for every lab: ",
    "never production; emergency access first; observe before enforcing; no sync or federation with production; synthetic data only; tear it down. A lab holding production data has become a production system.");
  sources(s, "Sources: NIST SP 800-50 Rev. 1; SP 800-53 Rev. 5 (CM-4(1), SA-3(2)); Microsoft Learn (M365 Developer Program; Learn FAQ; government trials; SC-401 registration). Book 16, Chapter 06.");
  narrate(s,
`Vendors teach their products, and the book names them as examples, never endorsements. A vendor course earns a place only if it passes four tests: it maps to a book procedure; it's current; the agency can keep its completion record; and the agency knows how the vendor handles learner data. Exam records tied to a work account are lost when the person leaves, so the agency keeps its own record.

Lab environments are harder to get than most programs expect. Microsoft Learn's free sandboxes are gone. The developer sandbox has eligibility limits and isn't offered in any government cloud, and there's no free sandbox in G C C High at all. So the program office arranges lab tenants, and before each gate the team rehearses once in the agency's own non-production government tenant.

Every lab follows the same rules: never production; emergency access first; observe before enforcing; no sync or federation with production; synthetic data only; and tear it down at the end.`,
  "Book 16, Chapter 06 — Vendor Training and Lab Environments (Choosing vendor training; Where lab environments come from; What changes in the government clouds; Rules for every lab).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What the program teaches", "Every user signs in differently");
  tag(s, "What");
  rows(s, "Mod", "SIX END-USER MODULES, EACH ENDING IN SOMETHING THE USER DOES", [
    ["Sign-in", "PIV, Windows Hello or a passkey; two methods"],
    ["Recovery", "Self-service reset; what happens if all is lost"],
    ["Devices", "Read and fix compliance; what the agency sees"],
    ["Files", "OneDrive, SharePoint, Teams; leave old drives"],
    ["Reporting", "The Report button; deny prompts you didn't start"],
    ["Help desk", "What it will and won't ask"],
  ], 1.92, 0.56, 0.5, 13.5);
  sideBox(s, "Desk", "FaUserShield", HEX.red, HEX.redTint, "THE REAL HELP DESK WILL NEVER", "Refuse anything outside the rules", [
    "Ask for your password, PIN or a code",
    "Ask you to approve a prompt for them",
    "Send a pass or link to an address you give on the call",
    "Accept caller ID or a manager's say-so",
  ], 14);
  callout(s, "Policy", 5.4, 1.1, "FaFingerprint", HEX.navy, "Federal policy sets the target: ",
    "M-22-09 and SP 800-63B-4 require phishing-resistant sign-in; passwords, codes and push approvals don't qualify. Teach length, not character classes, and build every module to Section 508.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-63B-4 (July 2025); CISA AA23-320A (rev. July 29, 2025); Microsoft Learn (Entra, Intune, Outlook reporting); Revised 508 Standards; OMB M-24-08. Book 16, Chapter 07.");
  narrate(s,
`Every user will sign in differently. Federal policy sets the target. OMB's zero trust memo and NIST's authentication guideline require phishing-resistant sign-in for staff, contractors and partners, and passwords, one-time codes and push approvals don't qualify. So users learn a PIV card, Windows Hello for Business or a passkey, with at least two methods registered.

The course has six short modules: sign-in; reset and recovery; devices; where files now live; reporting; and what the help desk will and won't ask. Password lessons teach length and passphrases, not character classes.

The last module matters most, because the help desk becomes a target the moment users trust it. CISA's Scattered Spider advisory describes attackers posing as I T staff. The real help desk never asks for a password, a PIN or a code, never asks you to approve a prompt for them, and never sends a pass to an address you give on the call.`,
  "Book 16, Chapter 07 — End-User Training for the Modernized Estate (Module 1; Module 2; Modules 3 to 5; Module 6: What the help desk will and won't ask; Accessible training).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns workforce readiness", "One decider per row; the reporter doesn't decide");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Policy, people, money", HEX.amber, HEX.amberTint, [["Sponsor and CIO", "Fund it; decide each wave's plan"], ["CISO", "Policy, threshold, what users are taught"], ["CHCO and workforce office", "Strategy, coding, rosters, labor"]]],
    ["FaClipboardCheck", "Build, evidence, gate", HEX.navy, HEX.navyTint, [["Training lead", "Curriculum and reports; never decides"], ["ISSO and system owner", "Review the record; judge overdue"], ["Program office", "Training criteria in every gate"]]],
    ["FaUsersGear", "Carry it to people", HEX.teal, HEX.tealTint, [["Managers and supervisors", "Time to learn; completion on time"], ["Help desk", "Trained first; manager decides ready"], ["Communications", "One sender; the CISO's words"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THE SEPARATIONS THAT KEEP THE NUMBERS HONEST", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Report, review, decide", "the training lead reports, the ISSO reviews, the gate or wave owner decides", HEX.navy],
    ["Managers can't waive", "a waiver of required training is the CISO's or a named delegate's, with an end date", HEX.amber],
    ["Contractors deliver", "they can build and report all of it; government officials make the decisions", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: 44 U.S.C. § 3554; 5 U.S.C. §§ 1401–1402; 5 CFR 410.201 and 930.301; OPM coding memo (2017); NIST SP 800-37 Rev. 2 (Appendix D); SP 800-50 Rev. 1; OMB M-24-08. Book 16, Chapter 08.");
  narrate(s,
`Ask who owns training and three offices answer at once. Between them, nobody owns whether people can do the new job on the day it changes. So the program keeps one decider per row.

The sponsor and C I O fund the learning program and decide each wave's readiness plan. The CISO owns the training policy, the completion threshold, and the exact words users are taught about sign-in, reporting and the help desk. The chief human capital officer's office owns workforce strategy, position coding, the facts behind the rosters, and labor relations.

The training lead builds the curriculum and reports the numbers, but never declares a wave ready. The I S S O reviews the training record. The program office puts training into every gate. Supervisors own completion; the help desk manager decides whether the desk is ready; communications owns one sender. Contractors can build and deliver it all, but government officials make the decisions.`,
  "Book 16, Chapter 08 — Who Owns Workforce Readiness (Where the roles come from; The roles; The responsibility matrix; Keeping the roles apart).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to run it and measure it", "Run training on the roadmap's calendar");
  tag(s, "How");
  steps(s, "Gate", [["Plan", "Walkthrough; roster drafted"], ["Foundation", "Help desk on verification"], ["Pilot", "Users trained before cutover"], ["Rollout", "Each division before its wave"], ["Legacy quiet", "Retired-system owners retrained"], ["AD retired", "No course teaches AD"]],
    [HEX.grey, HEX.amberTint, HEX.amberTint, HEX.amberTint, HEX.navyTint, HEX.tealTint], ["G0", "G1", "G2", "G3", "G4", "G5"]);
  panels(s, [
    ["FaUserClock", "Just in time, before each wave", HEX.amber, HEX.amberTint, ["Champions and managers 60 to 45 days out", "Help desk by 30 days; users assigned at 30", "Reminders at 15 and 7; then the readiness check"]],
    ["FaCodeBranch", "Keep the curriculum current", HEX.navy, HEX.navyTint, ["Every module names its chapters and versions", "A scheduled check on sources flags modules", "Each revision is a new course version"]],
  ]);
  callout(s, "Rule", 5.25, 1.25, "FaUserCheck", HEX.amber, "No gate without its training dates, no wave without its training window: ",
    "and the help desk goes first. No technician is made eligible for a help desk role until their training and verification check are on record.");
  sources(s, "Sources: 5 CFR 930.301(d); NIST SP 800-53 Rev. 5 (AT-2, AT-3); SP 800-50 Rev. 1; OMB A-130, Appendix I §4.h; Microsoft Learn, phishing-resistant deployment. Book 16, Chapters 01 and 09.");
  narrate(s,
`The curriculum runs on the roadmap's calendar. The planning rule is simple: no gate is scheduled without its training dates, and no wave without its training window, so a wave that slips moves its training with it.

Each gate carries a training check beside its technical exit. At the foundation gate, the help desk is trained on verification and administrators on just-in-time activation. Pilot and division users are trained before their waves. And by the last gate, no course still teaches an Active Directory procedure. The help desk goes first: no technician is made eligible for a help desk role until their training and verification check are on record.

Before each wave, champions and managers start sixty to forty-five days out, the help desk is trained by thirty days, users are assigned their modules at thirty, with reminders at fifteen and seven, and then the readiness check.`,
  "Book 16, Chapter 01 (Training is part of each gate's readiness); Chapter 09 — Building and Running the Curriculum (Start from the roadmap; What each phase and gate needs; Just-in-time training before each wave; Keeping the curriculum current).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to run it and measure it", "Measure readiness, not attendance");
  tag(s, "How");
  const levels = [
    ["1  Reaction", "End-of-module and post-wave surveys"],
    ["2  Learning", "Assessments, lab demonstrations, observed scenarios"],
    ["3  Behavior", "Ticket trends, method registration, verification audits"],
    ["4  Results", "Gate outcomes and steady-state measures"],
  ];
  s.addTable([head(["Kirkpatrick level", "What the program collects"]), ...levels.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([1.9, 5.0], { y: 1.5, fontSize: 13, rowH: [0.4, 0.75, 0.75, 0.75, 0.75] }));
  tableBox(s, "Page", "FaChartLine", HEX.amber, HEX.amberTint, "The committee's one page", [
    "Is the next gate's workforce ready?",
    "Are the next two waves ready?",
    "What happened in the last wave?",
    "Privileged gaps, as a count",
    "What must the committee decide?",
  ], 3.42, 13.5);
  callout(s, "Comp", 5.3, 1.2, "FaUserShield", HEX.amber, "Completion for everyone; competence where a mistake is a security event: ",
    "help desk, privileged administrators, ISSOs and plan roles must pass an assessment. A wave that isn't ready moves its date, not its threshold.");
  sources(s, "Sources: OMB A-130, Appendix I §4.h; NIST SP 800-50 Rev. 1 (Kirkpatrick levels; assessment report); SP 800-181 Rev. 1; Microsoft Learn (authentication methods activity; passwordless deployment). Book 16, Chapter 10.");
  narrate(s,
`A completion record says someone finished a course. Readiness says they can do the job on the day the change arrives. Following NIST's learning guide, the program measures four levels: reaction, from surveys; learning, from assessments and labs; behavior, from help desk ticket trends, sign-in method registration and verification audits; and results, from gate outcomes.

The rule is completion for everyone, and competence for every role where a mistake is a security event: help desk technicians, privileged administrators, I S S Os, and the people named in incident and contingency plans. For them, completion without a passing assessment doesn't count.

Registration by wave is the most direct end-user measure, and it costs nothing to collect. A wave that isn't ready moves its date, not its threshold, and the pilot sets the baselines. The steering committee gets one page at every meeting, in counts, not names, with privileged gaps as a count, because each one is a finding.`,
  "Book 16, Chapter 10 — Measuring Readiness and Evidencing It (Completion is not competence; Readiness per role; Readiness per gate; Signals beyond the learning management system; Reporting to the steering committee; Baselines and targets are design).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to run it and measure it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaListCheck", "Put training in every gate", "Measured against a roster; a gap only as a named, dated exception", HEX.red, HEX.redTint],
    ["FaUserShield", "Train the help desk first", "Verified before any new role, and before every wave", HEX.navy, HEX.navyTint],
    ["FaSitemap", "Name owners, keep them apart", "CHCO and CIO set competencies; the reporter doesn't decide", HEX.teal, HEX.tealTint],
    ["FaIdCard", "Certify with artifacts", "Capstones and two credentials, renewed every year", HEX.amber, HEX.amberTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaAddressBook", HEX.navy, "Next step, no procurement: ",
    "build the role roster from HR records, coded positions and eligible-role assignments; name a training lead and an owner per track; and brief the workforce office, labor relations and the Section 508 program manager before G0.");
  sources(s, "Sources: 5 CFR 930.301; OMB A-130; NIST SP 800-50 Rev. 1; OMB M-24-08. Book 16, Chapters 01, 05, 08, 09 and 10.");
  narrate(s,
`So, four decisions.

Put training in every gate, measured against a roster from HR and identity records, not a headcount. A gate passes with a gap only as a named, dated exception.

Train and verify the help desk first, before any new role is assigned and before every wave.

Name the owners and keep them apart: the chief human capital officer and the C I O set competencies, the CISO owns the security words, and the training lead reports while others decide.

And certify with artifacts: capstones and two credentials, renewed every year.

The next step needs no procurement. Build the role roster from HR records, coded positions and eligible-role assignments; name a training lead and an owner for each track; and brief the workforce office, labor relations and the Section 508 program manager before the first gate.

People, not tools, close the gap. Book 16 has the detail, every claim footnoted. Thank you.`,
  "Book 16, Chapters 01 (Training is part of each gate's readiness), 05 (Two credentials; Recertification), 08 (The responsibility matrix; Keeping the roles apart; Readiness is an input to every gate), 09 (What each phase and gate needs) and 10 (Readiness per role); index.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Law and regulation: FISMA, 44 U.S.C. § 3554; Federal Cybersecurity Workforce Assessment Act of 2015 (Pub. L. 114-113, Div. N, Title III) and 5 U.S.C. 301 note; 5 U.S.C. §§ 1401–1402; 15 U.S.C. § 7443; 29 U.S.C. § 794d; 5 CFR 410.201, 410.202, 410.601 and 930.301.",
    "OMB: Circular A-130 (July 2016), §5.c, §6.g and Appendix I §4.h; M-22-09 (January 26, 2022); M-24-08 (December 21, 2023).  ·  OPM: cybersecurity coding memoranda (January 4, 2017; April 11, 2022); Interpretive Guidance for Cybersecurity Positions (October 2018).  ·  GAO-19-144 (March 12, 2019).",
    "NIST: SP 800-50 Rev. 1 (September 2024); SP 800-181 Rev. 1 and NICE Framework Components v2.0.0, v2.1.0 and v2.2.0 (April 28, 2026); SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-53A Rev. 5; SP 800-37 Rev. 2; SP 800-63B-4 (July 2025); SP 800-128; SP 800-137; OSCAL.",
    "FedRAMP Consolidated Rules for 2026 (Agency Use; Key Security Indicators; Collaborative Continuous Monitoring); Notices NTC-0004 and NTC-0014.  ·  CISA: Advisory AA23-320A, Scattered Spider (revised July 29, 2025); BOD 26-04; CISA Learning.  ·  U.S. Access Board, Revised 508 Standards.  ·  DoD Directive 8140.01 and Manual 8140.03 (contrast only).",
    "Microsoft Learn: Conditional Access planning and report-only; emergency access; phishing-resistant passwordless deployment; certificate-based authentication; Windows Hello for Business; passkeys; SSPR; smart lockout; Intune compliance and data visibility; Outlook reporting; authentication methods activity; developer program; government trials; certifications, exam retirement and renewal.",
    "Vendor and certification-body sites, as examples only: Infoblox, BlueCat, Cisco, Fortinet, Palo Alto Networks, Zscaler, SailPoint, AWS, Broadcom, ServiceNow; CompTIA, ISC2, ISACA.",
    "Full footnotes with links and access dates (October 21–22, 2026): Book 16, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b16-people/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
