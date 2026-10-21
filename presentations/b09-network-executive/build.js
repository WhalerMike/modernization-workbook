// Book 09 — Network & Transport: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: CIO, CISO, network program executives and budget owners. Decision-centered:
// each decision slide states the decision, who owns it and when it is needed.
// Build:  node presentations/b09-network-executive/build.js presentations/b09-network-executive/B09_Network_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b09-network/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 09", title: "Network & Transport",
  footer: "Federal Modernization Workbook  ·  Book 09 Network & Transport  ·  Executive briefing" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B09_Network_Executive.pptx";
D.pres.title = "Book 09 — Network & Transport: Executive Briefing";

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
const cards = (s, prefix, list, opt = {}) => list.forEach((c, i) => {
  const n = list.length, gap = 0.15, w = (12.15 - gap * (n - 1)) / n, x = 0.6 + i * (w + gap);
  const y = opt.y || 1.55, h = opt.h || 3.55;
  box(s, `${prefix} card ${i + 1}`, x, y, w, h, c[3]);
  icon(s, c[0], x + 0.2, y + 0.17, 0.6, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 0.95, y: y + 0.17, w: w - 1.1, h: 0.6, bold: true, color: c[2], fontSize: opt.head || 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], opt.size || 13.5), { x: x + 0.22, y: y + 0.92, w: w - 0.4, h: h - 1.0, paraSpaceAfter: 5 });
});

// The decision strip every decision slide carries: the decision, its owner, and when it is needed.
const decision = (s, y, what, owner, when) => {
  const h = 1.2;
  box(s, "Decision strip", 0.6, y, 12.15, h, "FFFFFF", HEX.navy);
  icon(s, "FaScaleBalanced", 0.8, y + (h - 0.72) / 2, 0.72, HEX.navy);
  txt(s, "Decision text", [{ text: "DECISION   ", options: { bold: true, color: HEX.navy } }, { text: what }],
    { x: 1.7, y: y + 0.06, w: 6.25, h: h - 0.12, fontSize: 15, valign: "middle" });
  txt(s, "Decision owner", [{ text: "OWNER", options: { bold: true, color: HEX.teal, fontSize: 11.5, breakLine: true } }, { text: owner }],
    { x: 8.1, y: y + 0.06, w: 2.25, h: h - 0.12, fontSize: 13.5, valign: "middle" });
  txt(s, "Decision when", [{ text: "NEEDED BY", options: { bold: true, color: HEX.amber, fontSize: 11.5, breakLine: true } }, { text: when }],
    { x: 10.5, y: y + 0.06, w: 2.15, h: h - 0.12, fontSize: 13.5, valign: "middle" });
};

// A tinted side panel with an icon, a heading and bullets.
const panel = (s, name, x, y, w, h, iconName, color, tint, heading, items, size) => {
  box(s, `${name} box`, x, y, w, h, tint);
  icon(s, iconName, x + 0.22, y + 0.17, 0.6, color);
  txt(s, `${name} head`, heading, { x: x + 0.97, y: y + 0.17, w: w - 1.1, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${name} list`, bullets(items, size || 13.5), { x: x + 0.22, y: y + 0.9, w: w - 0.4, h: h - 0.98, paraSpaceAfter: 5 });
};

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why act now", "Network & Transport: The Executive Decisions", "Book 09 — a 30-minute executive briefing");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "For the CIO, the CISO, network program executives and budget owners", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 09 of the Federal Modernization Workbook, Network and Transport. It's written for the people who fund, authorize and answer for the branch network: the CIO, the CISO, network program executives and budget owners.

It's built around decisions, not configuration. For each one I'll say what has to be decided, who owns it, and when it's needed.

Four questions organize the half hour. Why act now, when the target architecture is years away. What federal policy actually requires, and where the money should go first. Who decides each step. And how to proceed without turning a faster network into a weaker one.

The short version: no product shortens a fiber path, so buy transport on physics, govern it as compliance, and decide in the right order.`,
  "Book 09, index; Chapter 01 — Why Physics Decides the Architecture; Chapter 02 — Transport Is Physics, Control Is Compliance.");
}

// ------------------------------------------------------------------ Why 1: the decisions
{
  const s = D.content("Why act now", "Seven decisions this briefing asks for");
  tag(s, "Why");
  const dec = [
    ["Exit MTIPS only on CLAW parity", "CISO", HEX.navy, HEX.navyTint],
    ["Record the interim gap as accepted risk", "Authorizing official", HEX.red, HEX.redTint],
    ["Specify the BOD 26-02 refresh", "Security architecture", HEX.teal, HEX.tealTint],
    ["Set the investment order", "Sponsor and CIO", HEX.amber, HEX.amberTint],
    ["Test the field-office refresh request", "Sponsor and CIO", HEX.navy, HEX.navyTint],
    ["Choose the NAC platform; tie NPS retirement to the Entra migration", "Sponsor and CIO", HEX.teal, HEX.tealTint],
    ["Adopt the sequence: governor before traffic, boundary before cutover", "Authorizing official and system owner", HEX.red, HEX.redTint],
  ];
  dec.forEach((d, i) => {
    const row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4;
    const w = row ? 3.95 : 2.925, x = 0.6 + col * (w + 0.15), y = 1.55 + row * 1.85;
    box(s, `Decision card ${i + 1}`, x, y, w, 1.7, d[3]);
    txt(s, `Decision card ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: d[2], fontSize: 22, fontFace: "Cambria", breakLine: true } },
      { text: d[0], options: { bold: true, color: HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: d[1], options: { color: HEX.ink, fontSize: 12.5, italic: true } },
    ], { x: x + 0.18, y: y + 0.08, w: w - 0.3, h: 1.56, valign: "top", paraSpaceAfter: 2 });
  });
  callout(s, "Bottom line", 5.4, 1.1, "FaLightbulb", HEX.navy, "The bottom line: ",
    "federal policy is technology-neutral but not requirement-free, one directive is already spending the refresh money, and order and ownership decide whether modernization is a gain or a regression.");
  sources(s, "Sources: Book 09, Chapters 03, 07, 09, 10, 11 and 13.");
  narrate(s,
`Here is where we're going. Seven decisions, each with a named owner. None of them is a product choice, and none of them requires an award to start. Several of them cost nothing but a signature and a few weeks of staff time; the expensive mistakes come from leaving them unmade while circuits, refreshes and migrations move ahead on their own schedules.

Here they are.

One: the CISO decides that managed TIC circuits end only when CISA confirms the replacement telemetry, not when a branch cuts over.

Two: the authorizing official records today's gap as an accepted risk, with compensating measures and a funded plan, so an assessor doesn't find it first.

Three: security architecture writes the target attributes into the edge-device refresh that BOD 26-02 is forcing anyway.

Four: the sponsor and CIO set the investment order, so staff time and requirements work come before capital.

Five: the same pair tests the field-office refresh request against published capacity limits before the money is committed.

Six: they choose the network access control platform, and tie the retirement of the Windows RADIUS server to the Entra migration, not to a date.

Seven: the authorizing official and the system owner hold the line on order. The governor is live before traffic moves, and the boundary change is decided before the first cutover.

The thread running through all seven: policy names no product, but it isn't requirement-free. A directive is already spending the refresh money. And order and ownership decide the outcome. The rest of the briefing gives the evidence behind each one, in the order why, what, who and how.`,
  "Book 09, Chapter 03; Chapter 07; Chapter 09 — Who Owns the Network and Its Transport; Chapter 10 — The Long Interim; Chapter 11; Chapter 13 — Sequencing, Cost and Evidence.");
}

// ------------------------------------------------------------------ Why 2: physics vs compliance
{
  const s = D.content("Why act now", "Transport is physics; control is compliance");
  tag(s, "Why");
  panel(s, "Physics", 0.6, 1.55, 5.95, 3.6, "FaRoute", HEX.amber, HEX.amberTint, "No product shortens a fiber path", [
    "About 5 µs per km of fiber, one way",
    "New York to London: a 56 ms round-trip floor",
    "Voice: 150 ms is mouth to ear; the network gets about 70 to 100 ms",
    "Seattle hairpin through northern Virginia: about 60 ms one way, worked arithmetic",
  ], 14);
  panel(s, "Compliance", 6.8, 1.55, 5.95, 3.6, "FaShieldHalved", HEX.navy, HEX.navyTint, "The pipe closes one control family", [
    "Direct internet access fixes the hairpin",
    "It satisfies none of the protection controls",
    "Transport closes telecommunications diversity only",
    "Boundary, flow, encryption, malware and monitoring come from the control layer",
  ], 14);
  callout(s, "Regression", 5.35, 1.15, "FaDoorOpen", HEX.red, "Bare local breakout is a regression: ",
    "a branch moved from a governed hairpin to ungoverned breakout has lost assessed boundary protection. It is a compliance regression with better latency.");
  sources(s, "Sources: ITU-T G.114; NIST SP 800-53 Rev. 5; CISA TIC 3.0 Branch Office Use Case v3.0. Book 09, Chapters 01 and 02.");
  narrate(s,
`Why act at all? Start with the two decisions programs keep merging.

Choosing a pipe is a physics decision. Light in fiber covers about one kilometer every five microseconds. New York to London has a round-trip floor of 56 milliseconds before any equipment touches a packet. The well-known 150-millisecond voice budget is mouth to ear, and the phones themselves take a large share, which leaves the network roughly 70 to 100. On the book's worked arithmetic, a Seattle office hairpinning through northern Virginia spends about 60 milliseconds one way on geography. That's most of the allowance, gone before the call reaches anything useful. No product moves that floor. Local breakout fixes the geographic part and nothing else.

Choosing what governs the pipe is a compliance decision. Direct internet access solves the hairpin, and it satisfies none of the protection controls. Boundary protection, flow enforcement, transmission confidentiality, malware inspection and monitoring all come from the control layer. Transport selection closes exactly one control family: telecommunications diversity.

So here's the risk an executive should watch for. A branch moved from a governed hairpin to bare local breakout has lost assessed boundary protection relative to where it started. The book's phrase for that is a compliance regression with better latency. It looks like modernization on a dashboard, and it reads as a finding in an assessment.

Every decision in this briefing keeps those two choices separate: buy the pipe on measured physics, and take the protection from the governor and the security services above it. Each new pipe also adds a managed interface someone has to govern, so more circuits without more control means more exposure, not less.`,
  "Book 09, Chapter 01 — Why Physics Decides the Architecture; Chapter 02 — Transport Is Physics, Control Is Compliance.");
}

// ------------------------------------------------------------------ Why 3: the clocks
{
  const s = D.content("Why act now", "The external clocks are already running");
  tag(s, "Why");
  const rows = [
    ["Sep 22, 2026", "FIPS 140-2 to CMVP Historical List", "State FIPS 140-3 in new purchases"],
    ["Oct 22, 2026", "OMB M-26-15", "Post-quantum migration plan due"],
    ["Nov 18, 2026", "OMB M-26-14", "First agency logging plan due"],
    ["Dec 7, 2026", "BOD 26-04, Phase III", "Risk-based remediation; asset tagging"],
    ["Jan 1, 2027", "FedRAMP 2026 rules", "Mandatory adoption"],
    ["Feb 5, 2027", "BOD 26-02, 12 months", "First end-of-support decommissioning"],
    ["Jul 6, 2027", "OMB M-26-14", "Level 3 on every logging element"],
    ["Jul 31, 2027", "GSA EIS", "Option period 1 ends"],
    ["Aug 5, 2027", "BOD 26-02, 18 months", "All identified end-of-support edge devices off"],
  ];
  s.addTable([head(["Date", "Instrument", "What it demands"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 8 ? HEX.red : HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: i === 8, color: i === 8 ? HEX.red : HEX.ink } }])],
    tableOpts([1.55, 2.95, 3.35], { y: 1.5, fontSize: 12, rowH: [0.38, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47] }));
  panel(s, "Staff", 8.2, 1.5, 4.55, 4.85, "FaUsersGear", HEX.red, HEX.redTint, "The same people, twice", [
    "M-26-14 logging, M-26-15 post-quantum and BOD 26-04 all fall inside roughly fifteen months",
    "All three draw on the staff a branch-edge program would need",
    "Legacy telecom vehicles ended May 31, 2026: the vehicle question has resolved itself",
    "Say so in the program plan; it is more credible than promising the same people twice",
  ], 13.5);
  sources(s, "Sources: OMB M-26-14, M-26-15; CISA BOD 26-02, BOD 26-04; NIST CMVP; FedRAMP 2026 rules; GSA EIS. Book 09, Chapters 03 and 10.");
  narrate(s,
`The second reason to act is that the external clocks are already running, whether or not a network program is funded.

Read the table from the top. All FIPS 140-2 certificates moved to NIST's historical list on September 22. That isn't a ban on existing modules, but new purchases should state the 140-3 expectation. OMB M-26-15, the post-quantum memo, wanted agency migration plans by October 22, 2026, and it says anything terminating TLS or IPsec, firewalls and VPN concentrators included, must support post-quantum key exchange. OMB M-26-14 rescinded the old logging memo; the first agency logging plan is due November 18, with maturity milestones running to July 2027. BOD 26-04's third phase lands December 7. FedRAMP's 2026 rules become mandatory on January 1. And the GSA EIS first option period ends July 31, 2027.

The row in red is the one that spends money. BOD 26-02 requires all identified end-of-support edge devices off agency networks by August 5, 2027, with a first decommissioning milestone in February. I'll come back to it, because it's the fork in the road for the whole branch architecture.

The panel on the right is the honest part. Three of these requirements fall inside roughly fifteen months, and all of them draw on the same network and security staff a branch-edge program would need. An agency promising an SD-WAN program next year alongside them is promising the same people twice. The book's advice is to say that plainly in the plan.

One clock has already run out: the legacy telecom contracts all ended by May 31, 2026, so the architecture is now a task-order question, not a contract-vehicle question.`,
  "Book 09, Chapter 03 — What TIC 3.0 and Federal Policy Actually Require; Chapter 10 — The Long Interim.");
}

// ------------------------------------------------------------------ Why 4: risk of not acting
{
  const s = D.content("Why act now", "The risk of not acting is not standing still");
  tag(s, "Why");
  cards(s, "Risk", [
    ["FaCodeBranch", "Spend without choosing", HEX.red, HEX.redTint, [
      "A like-for-like BOD 26-02 refresh closes the architecture question for the life of the equipment",
      "Deferral is priced: six agencies' legacy Networx billing rose 206%, from $13.4M (Feb 2025) to $40.9M (Mar 2025)",
    ]],
    ["FaClipboardCheck", "A finding, not a risk", HEX.amber, HEX.amberTint, [
      "An undocumented gap an assessor finds is a finding",
      "A documented gap with compensating measures and a plan is an accepted risk",
      "Cutting MTIPS before CLAW parity trades a transport gap for a visibility gap",
    ]],
    ["FaArrowsRotate", "Cost blamed on the cloud", HEX.navy, HEX.navyTint, [
      "Cloud migration runs ahead of governed transport",
      "With no transport metrics, slowness is attributed to the cloud",
      "Remedies raise cloud spend; the book labels this an inference",
    ]],
  ], { size: 13.5 });
  callout(s, "Governor", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "The governor is attack surface: ",
    "ED 26-03, February 25, 2026, ordered action on SD-WAN systems after actors compromised them and kept long-term persistence. Protect the controller and edges before they carry traffic.");
  sources(s, "Sources: CISA BOD 26-02, ED 26-03; GAO-26-107919 (August 2026); NIST SP 800-37 Rev. 2; GAO-19-58, GAO-26-107530. Book 09, Chapters 02, 03, 05, 10 and 13.");
  narrate(s,
`Not acting doesn't mean standing still. It means three things happen by default.

First, money gets spent without a choice being made. The BOD 26-02 refresh will happen on a directive clock. Run as like-for-like replacement, the same device class with the same absence of policy and telemetry, it spends the money and closes the architecture question for the service life of the new equipment. Deferral also has a measured price. GAO reported in August 2026 that billing for six agencies' legacy Networx contracts rose from about 13.4 million dollars in February 2025 to about 40.9 million in March, a 206 percent increase. The book calls that the strongest cost-of-delay number in the federal record.

Second, gaps surface as findings rather than accepted risks. The technical situation is identical either way; the institutional position isn't. And cutting managed TIC circuits before CISA confirms replacement telemetry trades a gap in transport for a gap in CISA's visibility, which is worse.

Third, cost gets blamed on the cloud. When workloads migrate before transport is governed and measured, slowness is attributed to the only thing being measured. The remedies, more instances and more caching, raise cloud spend. The book is careful to label that pattern its own inference, built on documented parts, so treat it as a hypothesis to test in your estate.

And one risk sits under all of them. The governor is attack surface. In February 2026, Emergency Directive 26-03 ordered action on Cisco SD-WAN systems after actors were found compromising them and keeping long-term persistence. Whatever you buy, protect it before it carries traffic.`,
  "Book 09, Chapter 02; Chapter 03; Chapter 05 — SD-WAN, SASE and Governed-Path Transport; Chapter 10 — The Long Interim; Chapter 13 — Sequencing, Cost and Evidence.");
}

// ------------------------------------------------------------------ What 1: TIC 3.0
{
  const s = D.content("What is required", "TIC 3.0 as republished in September 2026");
  tag(s, "What");
  const rows = [
    ["Volumes 1, 2, 4, 5", "1.2", "July 2025"],
    ["Vol. 3, Security Capabilities Catalog", "3.3", "July 2025"],
    ["Traditional TIC Use Case", "1.0", "April 2021"],
    ["Branch Office Use Case", "3.0", "July 2025"],
    ["Remote User Use Case", "2.2", "July 2025"],
    ["Cloud Use Case", "1.2", "July 2025"],
  ];
  s.addTable([head(["Document", "Cover", "Content revised"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: i === 3, color: i === 3 ? HEX.teal : HEX.ink } }, { text: r[2] }])],
    tableOpts([3.45, 0.9, 1.75], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45] }));
  txt(s, "Table note", "The 2026 republication changed footnote links only. CISA's landing page labels three volumes v1.1; the covers read 1.2. Cite the cover.",
    { x: 0.6, y: 4.65, w: 6.1, h: 0.6, fontSize: 12, italic: true, color: HEX.slate });
  panel(s, "Requires", 6.95, 1.5, 5.8, 3.75, "FaBook", HEX.navy, HEX.navyTint, "What it actually requires", [
    "Goals, not methods: \"descriptive, not prescriptive\"",
    "Policy enforcement parity on every path, SD-WAN paths included",
    "Preserve CISA's visibility as branches connect directly",
    "Close residual risk with the controls or compensating controls",
    "Four use cases; no SASE use case",
  ], 13.5);
  callout(s, "SASE guide", 5.4, 1.1, "FaLandmark", HEX.teal, "No route mandate: ",
    "CISA's June 2026 SASE guide says TIC 3.0 doesn't require routing through TIC access points when an alternative gives the agency and CISA situational awareness. It permits SASE; it doesn't require it.");
  sources(s, "Sources: CISA TIC 3.0 core guidance Vols. 1–5 and use cases (September 2026); SASE in a Modern TIC 3.0 Solution (June 2026); OMB M-19-26. Book 09, Chapter 03.");
  narrate(s,
`What does TIC 3.0 actually require? The book reads it from the current documents rather than from what's said about them.

CISA republished the whole set in September 2026. The revision tables say the only 2026 changes were updated footnote links, so the substance dates from July 2025, and April 2021 for the Traditional use case. One practical note for anyone writing a package: CISA's landing page labels three volumes 1.1, but the covers read 1.2. Cite the cover.

There are four use cases: Traditional, Branch Office, Remote User and Cloud. There is no SASE use case. An agency deploying SASE at its branches operates under the Branch Office and Cloud use cases.

The program guidebook calls TIC 3.0 descriptive, not prescriptive, and the catalog says it sets goals, not methods. But two statements constrain a branch. Policy enforcement parity: once you decide a capability is needed, you apply it on every path, and the Branch Office use case names SD-WAN paths as one place that applies. And preserve CISA's visibility as branches connect directly to external services. Discretion also carries an obligation: where TIC controls don't cover residual risk, agencies must apply controls or compensating controls.

CISA's June 2026 SASE guide states the consequence plainly. TIC 3.0 doesn't require routing traffic through TIC access points if an alternative gives both the agency and CISA situational awareness. That guide permits and describes SASE. It doesn't require it.

So when someone says TIC requires SD-WAN, or that TIC forbids local breakout, both claims fail the check. The honest position is narrower and stronger: TIC sets goals, local breakout is allowed, and the agency must show parity and preserve CISA's view on every path it opens.`,
  "Book 09, Chapter 03 — What TIC 3.0 and Federal Policy Actually Require.");
}

// ------------------------------------------------------------------ What 2: not requirement-free
{
  const s = D.content("What is required", "Technology-neutral is not requirement-free");
  tag(s, "What");
  const obl = [
    ["Protective DNS", "All egress DNS resolution goes to CISA's resolvers", HEX.navy, HEX.navyTint],
    ["BOD 23-02", "Management interfaces off the internet, or behind a separate enforcement point", HEX.teal, HEX.tealTint],
    ["BOD 26-02", "End-of-support edge devices off agency networks by August 5, 2027", HEX.red, HEX.redTint],
    ["OMB M-26-15", "Post-quantum key exchange on anything terminating TLS or IPsec", HEX.amber, HEX.amberTint],
  ];
  txt(s, "Obligations head", "FOUR BINDING OBLIGATIONS THAT LAND ON BRANCH EQUIPMENT", { x: 0.6, y: 1.5, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  obl.forEach((o, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Obligation ${i + 1}`, x, 1.88, 2.95, 1.5, o[3]);
    txt(s, `Obligation ${i + 1} text`, [{ text: o[0], options: { bold: true, color: o[2], fontSize: 16, breakLine: true } }, { text: o[1], options: { fontSize: 13 } }],
      { x: x + 0.15, y: 1.95, w: 2.7, h: 1.38, valign: "top" });
  });
  panel(s, "Assertions", 0.6, 3.55, 6.0, 2.95, "FaFileShield", HEX.navy, HEX.navyTint, "Your own control assertions", [
    "A branch that breaks out locally is an external boundary",
    "SC-7, SC-7(4), SI-4, CA-7 and CP-8 assert evidence about it",
    "The gap surfaces at assessment, not deployment",
  ], 13.5);
  panel(s, "Not required", 6.75, 3.55, 6.0, 2.95, "FaScaleBalanced", HEX.amber, HEX.amberTint, "What not to budget as compliance", [
    "No instrument requires SD-WAN or SASE",
    "No encrypted WAN where the payload is already protected: an overlay is a risk decision",
    "FedRAMP certifies services, not routes: name the control",
  ], 13.5);
  sources(s, "Sources: OMB M-22-09, M-26-15; CISA Encrypted DNS guidance, BOD 23-02, BOD 26-02; NIST SP 800-53 Rev. 5 and 800-53B; FedRAMP 2026 rules. Book 09, Chapter 03.");
  narrate(s,
`The opposite mistake is just as common: concluding that because policy is technology-neutral, the branch is unconstrained. It isn't. Four binding obligations land directly on branch equipment, and none of them picks a product.

Egress DNS must go to CISA's Protective DNS; that's statutory, and a vendor's own resolver in its place satisfies the product and breaches the requirement. BOD 23-02 requires internet-exposed management interfaces to be taken off the internet, or fronted by a separate enforcement point. BOD 26-02 takes end-of-support edge devices off agency networks by August 5, 2027. And M-26-15 requires post-quantum key exchange on anything that terminates TLS or IPsec.

The obligations that bite hardest are often the ones an agency wrote itself. Once a branch breaks out locally, it's an external boundary, and the system security plan asserts boundary protection, traffic flow policy, monitoring and alternate paths about it. The gap surfaces at assessment time, not deployment time. That's an evidence argument, not a mandate argument.

The right-hand panel matters to budget owners. No federal instrument requires SD-WAN or SASE. No instrument requires the WAN itself to be encrypted where the payload is already protected end to end, so an overlay is a defensible risk decision, and the book says it shouldn't be budgeted as a compliance obligation. And FedRAMP certifies cloud services, not the routes an agency uses to reach them. When a network change is refused on FedRAMP grounds, ask one question: which control does it violate? A refusal with no control basis is a governance failure, and should be recorded as one.`,
  "Book 09, Chapter 03 — What TIC 3.0 and Federal Policy Actually Require.");
}

// ------------------------------------------------------------------ What 3: telemetry after MTIPS (decision)
{
  const s = D.content("What is required", "Logging and CISA telemetry after MTIPS");
  tag(s, "What");
  cards(s, "Telemetry", [
    ["FaFileShield", "OMB M-26-14 logging", HEX.navy, HEX.navyTint, [
      "Rescinded M-21-31, May 22, 2026",
      "Searchable 6 months, retrievable 1 year",
      "Must show addresses, ports and session attributes",
      "Plan due November 18, 2026",
    ]],
    ["FaCloudArrowUp", "CLAW replaces the sensors", HEX.teal, HEX.tealTint, [
      "At local breakout, MTIPS sensor telemetry to CISA stops",
      "Comprehensive Log Aggregation Warehouse replaces it",
      "Agency, CISA and provider must coordinate",
    ]],
    ["FaListCheck", "On the critical path", HEX.amber, HEX.amberTint, [
      "CLAW onboarding sits beside the authorization package",
      "Start it in Phase 0, not at cutover",
      "Parity is confirmed per branch",
    ]],
  ], { h: 3.6 });
  decision(s, 5.3, "MTIPS and MPLS circuits end only on confirmed CLAW parity, branch by branch, not when cutover completes.",
    "CISO decides; security operations confirms; contracting officer terminates", "Onboarding from Phase 0; parity before any circuit ends");
  sources(s, "Sources: OMB M-26-14; CISA Logging Reference Architecture (August 2026), SASE guide (June 2026), TIC Program Guidebook; FAR 1.602-1. Book 09, Chapters 03, 09 and 11.");
  narrate(s,
`Logging and CISA telemetry are where branch modernization most often goes wrong quietly.

OMB M-26-14 rescinded M-21-31 on May 22, 2026. Logs must be searchable for six months and retrievable for a year, and among the minimum content, agencies must be able to show source and destination addresses, ports and session attributes. That's the transport-layer record a branch with nothing at its edge doesn't produce. The first agency logging plan is due November 18.

When branches leave the managed TIC service, the sensor telemetry CISA has been receiving stops. CISA's SASE guide says so in plain terms. The replacement is CLAW, CISA's Comprehensive Log Aggregation Warehouse, and onboarding needs the agency, CISA and the provider working together. That's a three-party dependency with its own lead time, not a configuration change one team completes. It belongs on the critical path beside the authorization package, and the field-office case starts it in Phase 0.

Here is the decision. The exit criterion for leaving MTIPS, and for ending each branch's MPLS, is confirmed CLAW parity, not branch cutover completion. Cutting circuits first trades a transport gap for a visibility gap, which is worse than the position being fixed.

Ownership splits three ways on purpose. The CISO decides CLAW onboarding and when parity is reached. Security operations does the confirming, branch by branch. And under the Federal Acquisition Regulation only a contracting officer can terminate a contract, so the contracting officer ends the circuit, and only after that confirmation. No engineer can cancel a circuit, however redundant it looks.`,
  "Book 09, Chapter 03 — What TIC 3.0 and Federal Policy Actually Require; Chapter 09 — Who Owns the Network and Its Transport; Chapter 11 — Field Office WAN Transformation.");
}

// ------------------------------------------------------------------ What 4: the long interim (decision)
{
  const s = D.content("What is required", "The long interim: the case by elimination");
  tag(s, "What");
  const alts = [["Legacy vehicles", "All ended by May 31, 2026"], ["Hairpin", "Permitted; CISA says it raised cloud cost"],
    ["New access point", "Capital, floor space, round-the-clock staff"], ["VPN backhaul", "A hairpin under another name"],
    ["ExpressRoute for Microsoft 365", "No longer recommended by Microsoft"]];
  txt(s, "Alts head", "WHY EACH ALTERNATIVE HAS CLOSED", { x: 0.6, y: 1.5, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  alts.forEach((p, i) => {
    const y = 1.85 + i * 0.66;
    box(s, `Alt ${i}`, 0.6, y, 6.2, 0.56, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Alt ${i} text`, [{ text: `${p[0]}   `, options: { bold: true, color: HEX.navy } }, { text: p[1] }],
      { x: 0.8, y, w: 5.9, h: 0.56, fontSize: 13.5, valign: "middle" });
  });
  panel(s, "Years", 7.05, 1.5, 5.7, 3.6, "FaUserClock", HEX.amber, HEX.amberTint, "Why the target is years away", [
    "Acquisition: quarters before a device ships",
    "Budget: submissions go to OMB in September",
    "Site count: a multi-year field deployment",
    "Authorization: a new device class at every branch",
    "Yet four of six edge functions are partly obtainable now",
  ], 13.5);
  decision(s, 5.3, "Record which control assertions lack transport evidence, the compensating measures and the funded remediation, as an accepted risk.",
    "Authorizing official; system owner prepares", "Now, while the gap exists");
  sources(s, "Sources: GSA EIS transition report; OMB M-19-26, Circular A-11; CISA TIC Program Guidebook, SASE guide; Microsoft Learn — ExpressRoute for Microsoft 365. Book 09, Chapters 09 and 10.");
  narrate(s,
`For many agencies, neither SD-WAN nor a new TIC use case is close. The acquisition isn't funded and the task orders aren't placed. The book calls that interval the long interim, and it argues the architecture by elimination rather than by mandate, because no mandate exists.

The legacy telecom vehicles all ended by May 31, 2026. The hairpin is still permitted, but CISA's own guidebook says it raised the cost and reduced the effectiveness of TIC for cloud services. A new agency-operated access point is a capital and round-the-clock staffing commitment. VPN backhaul is a hairpin under another name. And Microsoft no longer recommends ExpressRoute for Microsoft 365. What's left is local breakout, a cloud-delivered security stack at a nearby point of presence, and a policy layer at the branch edge deciding what goes where.

The target is years away for structural reasons. Acquisition takes quarters. Agencies send budget submissions to OMB in September, so a program conceived now has usually missed the next budget year. A thousand branches is a multi-year deployment on logistics alone. And every new device class at every branch is assessment work. But the interval isn't empty: four of the six functions a branch-edge layer provides are partly obtainable before any award.

The decision on this slide belongs to the authorizing official. Record in the risk register and the affected packages which control assertions depend on transport evidence that doesn't exist, the compensating measures, and the remediation with its funding dependency. An undocumented gap found by an assessor is a finding. A documented gap with a plan is an accepted risk. Do it now, while the gap exists.`,
  "Book 09, Chapter 10 — The Long Interim; Chapter 09 — Who Owns the Network and Its Transport.");
}

// ------------------------------------------------------------------ What 5: BOD 26-02 fork (decision)
{
  const s = D.content("What is required", "BOD 26-02 makes the refresh the fork in the road");
  tag(s, "What");
  const rows = [
    ["May 5, 2026", "Inventory listed devices and report"],
    ["Feb 5, 2027", "Decommission devices whose support ends by then"],
    ["Aug 5, 2027", "Decommission all identified end-of-support edge devices"],
    ["Feb 5, 2028", "Continuous discovery; replace on or before end of support"],
  ];
  s.addTable([head(["Milestone", "What BOD 26-02 requires"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 2 ? HEX.red : HEX.navy } }, { text: r[1], options: { bold: i === 2, color: i === 2 ? HEX.red : HEX.ink } }])],
    tableOpts([1.6, 4.4], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.5, 0.5, 0.5, 0.5] }));
  txt(s, "Scope note", "Edge devices sit on the boundary and are reachable from the internet. A branch router with its own circuit qualifies; an interior access switch may not, so don't assume the directive funds the access layer.",
    { x: 0.6, y: 4.05, w: 6.0, h: 1.05, fontSize: 12.5, italic: true, color: HEX.slate });
  panel(s, "Attributes", 6.85, 1.5, 5.9, 3.6, "FaCodeBranch", HEX.teal, HEX.tealTint, "Write the target into the refresh", [
    "Application-aware steering and path measurement",
    "Deterministic egress; per-application telemetry",
    "Post-quantum key exchange (M-26-15)",
    "Management plane that meets BOD 23-02",
    "An explicit FIPS 140-3 expectation",
  ], 13.5);
  decision(s, 5.3, "Tell whoever scopes BOD 26-02 replacements, in writing, what the target architecture requires of a branch device.",
    "Security architecture; acquisition writes it into orders", "Before replacements are scoped; all off by Aug 5, 2027");
  sources(s, "Sources: CISA BOD 26-02, BOD 23-02; OMB M-26-15; NIST FIPS 203, CMVP FIPS 140-3 transition. Book 09, Chapters 03, 07, 09 and 10.");
  narrate(s,
`This is the most important planning item in the book.

BOD 26-02, issued February 5, 2026, puts branch edge hardware on a directive clock. Inventory came due in May. Devices whose support ends by February 2027 come out then. All identified end-of-support edge devices must be off agency networks by August 5, 2027. After that, discovery is continuous. The directive covers devices on the network boundary that are reachable from the internet, so a branch router with its own internet circuit qualifies. An interior access switch may not, so don't assume the directive funds the access layer.

For an agency with aging branch equipment, part of the capital it assumed it didn't have is going to be spent anyway, on a compliance basis, inside the window everyone calls years away. And a refresh is exactly the moment a branch architecture gets chosen again. The default choice is like-for-like, which spends the money and closes the question for the life of the new equipment.

The recommendation is narrow and cheap. Tell whoever is scoping the replacements, in writing, what the eventual target needs from a branch device: application-aware steering and path measurement, deterministic egress, per-application telemetry the log pipeline can take, post-quantum key exchange under M-26-15, a management plane that satisfies BOD 23-02, and an explicit FIPS 140-3 expectation.

Security architecture owns that decision, because the refresh row in the book's matrix fixes the branch design for years. Acquisition writes it into every order. It's needed before the replacements are scoped. It costs requirements-writing time, and not doing it spends the same money and closes the option.`,
  "Book 09, Chapter 10 — The Long Interim; Chapter 03 (BOD 26-02 milestones); Chapter 07 (access-switch scope); Chapter 09 — Who Owns the Network and Its Transport.");
}

// ------------------------------------------------------------------ What 6: where to invest (decision)
{
  const s = D.content("What is required", "Where to invest, and in what order");
  tag(s, "What");
  const steps = [
    ["Staff time, no award", "Path policy, branch measurement, deterministic egress, cleartext register, DNS test"],
    ["Requirements time", "Target attributes in the BOD 26-02 refresh"],
    ["Accreditation and CLAW", "The critical path; Phase 0 in the worked case"],
    ["Governor protection", "MFA, baseline, patching in BOD 26-04 windows, off-box logs"],
    ["Then capital", "Hubs first; office waves at MPLS renewal, where measurement says it pays"],
  ];
  steps.forEach((p, i) => {
    const y = 1.5 + i * 0.75;
    box(s, `Invest ${i}`, 0.6, y, 6.6, 0.66, i === 4 ? HEX.tealTint : (i % 2 ? HEX.navyTint : HEX.grey));
    txt(s, `Invest ${i} text`, [{ text: `${i + 1}  `, options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria" } }, { text: `${p[0]}   `, options: { bold: true, color: HEX.navy } }, { text: p[1], options: { fontSize: 12.5 } }],
      { x: 0.75, y, w: 6.35, h: 0.66, fontSize: 14, valign: "middle" });
  });
  panel(s, "Price", 7.45, 1.5, 5.3, 3.6, "FaChartLine", HEX.amber, HEX.amberTint, "Price it honestly", [
    "The cost variable shifts from site count to user count",
    "Per-user SASE subscription is the line most likely to dominate",
    "Price your own circuits in the EIS Public Pricer",
    "Don't justify on latency alone: governance and evidence are stronger",
  ], 13.5);
  decision(s, 5.3, "Fund staff time and requirements work first, then accreditation and governor protection, then capital scoped by measurement.",
    "Sponsor and CIO", "Before the next September budget submission");
  sources(s, "Sources: OMB Circular A-11; GSA EIS Public Pricer; CISA BOD 26-04; NIST SP 800-53 SC-7(4). Book 09, Chapters 05, 09, 10, 11 and 13.");
  narrate(s,
`So where should the money go, and in what order? The book's chapters line up into five tiers, cheapest and most certain first.

One: staff time, with no award. Write the application-to-path policy that SC-7(4) already asks for. Instrument a sample of branches. Fix deterministic egress, usually a NAT decision. Register the cleartext protocols crossing branch links. And test, not just read, that DNS reaches CISA's Protective DNS.

Two: requirements time. Put the target attributes into the BOD 26-02 refresh.

Three: accreditation and CLAW onboarding. The field-office case calls accreditation, not procurement, the critical path; circuits arrive in about a quarter, an authorized breakout architecture takes far longer.

Four: protect the governor. Phishing-resistant MFA, a hardened baseline, patching inside BOD 26-04's windows, the shortest of which is three days, and logs held off the box.

Five, and only then: capital. Hubs first, then office waves timed to MPLS contract renewals, scoped to the branches and applications where measurement says it pays.

The panel on the right is about pricing. Moving from MPLS to internet access plus a cloud security service changes the cost variable from site count and port speed to user count, and the per-user security subscription is the line most likely to dominate, and the one most often left out. Price your own circuits in GSA's EIS pricer rather than citing a marketing multiple. And don't justify the program on latency alone; the stronger argument is governance and evidence.

The sponsor and CIO set scope, funding and sequence, and this order needs to be settled before the next September budget submission.`,
  "Book 09, Chapter 10 — The Long Interim; Chapter 11; Chapter 13 — Sequencing, Cost and Evidence; Chapter 05 (governor protection); Chapter 09 (sponsor and CIO).");
}

// ------------------------------------------------------------------ What 7: field-office WAN (decision)
{
  const s = D.content("What is required", "Field offices: fix the circuit, not the content");
  tag(s, "What");
  const rows = [
    ["Refresh request", "About $50M, $33,333 per office"],
    ["Fully loaded server case", "$16,000: request is about twice it"],
    ["Clients per distribution point", "4,000, Microsoft's published limit"],
    ["Distribution points needed", "24: two at each of 12 hub sites"],
    ["Network program, Year 1 capital", "About $10.0M; positive by year four"],
    ["Breakeven current MPLS cost", "$873 per office per month"],
  ];
  s.addTable([head(["Worked case: about 1,500 offices, 70,000 endpoints", "Value"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: i >= 4, color: i === 5 ? HEX.red : HEX.ink } }])],
    tableOpts([3.75, 3.2], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  panel(s, "Field", 7.8, 1.5, 4.95, 3.6, "FaBuilding", HEX.teal, HEX.tealTint, "What the case shows", [
    "The other 1,476 servers only compensate for slow circuits",
    "Every cost is a planning assumption to replace",
    "Below $873, argue capability, not savings",
    "No office's MPLS retires before its telemetry is confirmed",
  ], 13.5);
  decision(s, 5.3, "State whether the $50M is acquisition or five-year cost, and validate current MPLS cost per office, before comparing options.",
    "Sponsor and CIO", "Before the refresh money is committed");
  sources(s, "Sources: Microsoft Learn — Configuration Manager size and scale, support lifecycle; Cisco Catalyst 8000 data sheets and licensing. Book 09, Chapter 11 (planning assumptions labeled).");
  narrate(s,
`Field offices are where these decisions become a budget line. Chapter 11 works a case many civilian agencies will recognize: about 1,500 field offices, about 70,000 endpoints, and a request for about 50 million dollars to refresh a Configuration Manager distribution point in every office.

Three findings. First, the unit cost doesn't reconcile. Fifty million over 1,500 offices is 33,333 dollars each, about twice the book's fully loaded server case. So the sponsor needs to say whether that figure is acquisition cost or five-year cost of ownership, and itemize anything bundled in. Second, capacity. Microsoft's published limit is 4,000 clients per distribution point, so the estate needs 24, two at each of 12 hub sites. The other 1,476 exist only to compensate for slow branch circuits. Third, timing. Microsoft has moved Configuration Manager to an annual release cadence and says new device-management innovation happens in Intune, so hardware bought now depreciates past its likely use.

The alternative fixes the circuit: internet access sized to seats, a 5G continuity path, and an SD-WAN overlay, with breakout at the hubs first. On the book's labeled planning assumptions, that needs about 10 million dollars of first-year capital and turns cumulatively positive in year four.

But the financial case turns on one number the analysis doesn't hold. Breakeven is 873 dollars of current MPLS cost per office per month. Above it the program pays for itself; below it, argue capability rather than savings.

So the decision for the sponsor and CIO is to decompose the request and validate that MPLS figure before any comparison, and before the refresh money is committed.`,
  "Book 09, Chapter 11 — Field Office WAN Transformation.");
}

// ------------------------------------------------------------------ What 8: NAC (decision)
{
  const s = D.content("What is required", "Network access control: the last Active Directory tie");
  tag(s, "What");
  panel(s, "NPS", 0.6, 1.5, 6.0, 3.6, "FaPlugCircleXmark", HEX.red, HEX.redTint, "Why it reaches the executive agenda", [
    "Windows NPS authorizes against AD computer objects; Entra joined devices have none",
    "There is no Entra RADIUS service, and NPS has no posture engine",
    "Lose NPS before its replacement is validated: total loss of network access",
    "Credential Guard and the October 2026 update are breaking password-based Wi-Fi",
  ], 13.5);
  panel(s, "Target", 6.75, 1.5, 6.0, 3.6, "FaFingerprint", HEX.teal, HEX.tealTint, "What the program adopts", [
    "EAP-TLS certificates for every managed device",
    "Posture read from Intune's compliance service",
    "Rollout in four phases over about 90 to 180 days",
    "Cloud RADIUS: confirm the function is inside a FedRAMP listing",
  ], 13.5);
  decision(s, 5.3, "Choose the NAC platform, and make the retirement of NPS follow the Entra migration, not a date.",
    "Sponsor and CIO; CISO sets posture", "Before cloud-native cutover retires AD computer objects");
  sources(s, "Sources: IEEE 802.1X-2020; Microsoft Learn — NPS, Entra join planning, Intune NAC integration, Credential Guard; FedRAMP Marketplace (Oct 21, 2026). Book 09, Chapters 07 and 09.");
  narrate(s,
`Network access control looks like an engineering topic. It reaches the executive agenda because it's usually the last piece of the network still standing on Active Directory.

Windows Network Policy Server, the RADIUS server built into Windows, authorizes devices against Active Directory computer objects. Microsoft's Entra join guidance says Entra joined devices don't support that. There's no Entra RADIUS service, and NPS has no posture engine. So as the Entra migration progresses, NPS becomes less useful. And if NPS goes away before its replacement is validated, the result isn't a degraded experience; it's a total loss of network access.

The older password methods are breaking on their own schedule. Credential Guard, on by default on eligible Windows 11 devices, blocks single sign-on for PEAP-MSCHAPv2 Wi-Fi and VPN, and the October 2026 Windows update restricts NTLMv1-derived credentials too. Agencies that followed older guidance now have a deadline they didn't choose.

The program's target is certificate-based EAP-TLS for every managed device, with posture read from Intune's compliance service by a NAC platform, rolled out in four phases over roughly 90 to 180 days, monitor mode first. One caution for cloud-delivered RADIUS: as of October 21, 2026, several well-known cloud RADIUS offerings have no FedRAMP listing, so confirm the specific function is inside a certified offering before designing around it.

The decision sits with the sponsor and CIO: which NAC platform, and when NPS retires. The book's rule is that the retirement is triggered by the Entra migration, not by a date, and the replacement must be in place before cloud-native cutover retires the computer objects NPS depends on. The CISO sets the posture requirement.`,
  "Book 09, Chapter 07 — Network Access Control: 802.1X and RADIUS; Chapter 09 — Who Owns the Network and Its Transport.");
}

// ------------------------------------------------------------------ Who: the decision register
{
  const s = D.content("Who decides", "One decider per row: the network decision register");
  tag(s, "Who");
  const rows = [
    ["Governor platforms (SD-WAN, SASE, NAC); wave order", "Sponsor and CIO", "Phase 0; waves at contract renewals"],
    ["Security envelope: module validation, supply chain, PQC", "CISO", "Written into every order"],
    ["Target attributes for every refresh, BOD 26-02 included", "Security architecture", "Before replacements are scoped"],
    ["TIC 3.0 use case and enforcement-point placement", "Security architecture", "Phase 0, with the use-case package"],
    ["Boundary change", "Authorizing official", "Before the first production cutover"],
    ["Governor live and logging, per site", "System owner", "Before that site's new egress"],
    ["Microsoft 365 Optimize SC-7(4) exception", "Authorizing official", "Before cutover; device-side tenant restrictions first"],
    ["CLAW onboarding and telemetry parity", "CISO; security operations confirms", "Before any legacy circuit ends"],
    ["Circuit termination", "Contracting officer", "Only after parity is confirmed"],
    ["Interim gap; standing exceptions with no end date", "Authorizing official", "Now, and at each review"],
  ];
  s.addTable([head(["Decision", "Decides", "Needed by"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: HEX.teal } }, { text: r[2] }])],
    tableOpts([5.6, 2.9, 3.65], { y: 1.5, fontSize: 12, rowH: [0.38, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46] }));
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 SC-7(4); FAR 1.602-1; GSA EIS; CISA SASE guide (June 2026); Microsoft Learn — tenant restrictions v2. Book 09, Chapters 09, 11, 12 and Appendix A.");
  narrate(s,
`Who owns all this? The book's sharpest observation is that the most expensive network mistakes aren't engineering errors. They're ownership gaps: a circuit bought before anyone owned the governor, a cutover before anyone filed the boundary change, a telemetry contract cancelled before anyone confirmed its replacement. Naming one decider for each step is cheaper than any product.

The register separates deciding from doing. A role decides when it is accountable and can say no. Network engineering does most of the work, but decides only physics and enforcement phasing.

Read down the middle column. The sponsor and CIO decide the governor platforms and the order of branch waves, because those fix cost and the boundary for years; acquisition is engaged in Phase 0 and waves follow contract renewals. The CISO sets the security envelope every order carries. Security architecture decides the refresh attributes and where each enforcement capability sits, but doesn't accept the risk of a non-conformant design.

The authorizing official accepts risk, so four rows land there: the boundary change, decided before the first production cutover; the Microsoft 365 Optimize exception, where device-side tenant restrictions are a precondition; the interim gap; and any standing exception with no end date.

Two rows split on purpose. The authorizing official decides whether the boundary may change, but the system owner decides, site by site, whether that site's control layer is live and logging. And telemetry splits three ways: the CISO decides, security operations confirms, and the contracting officer terminates.

When an architectural refusal arrives with no control basis, record it as a governance failure, with the refusing role named.`,
  "Book 09, Chapter 09 — Who Owns the Network and Its Transport; Chapter 11 (Phase 0); Chapter 12 — Microsoft 365 Traffic; Appendix A.");
}

// ------------------------------------------------------------------ How 1: the sequence (decision)
{
  const s = D.content("How to proceed", "Governor before traffic, boundary before cutover");
  tag(s, "How");
  const steps = [
    ["Secure the governor", "CISO"], ["Buy the pipe on measured physics", "Network eng.; contracting officer"],
    ["Governor live before traffic", "System owner, per site"], ["Boundary change before cutover", "Authorizing official"],
    ["Microsoft 365 by its own exception", "Authorizing official"], ["Evidence; CISA parity first", "CISO"],
  ];
  steps.forEach((f, i) => {
    const x = 0.6 + i * 2.045;
    box(s, `Step ${i}`, x, 1.5, 1.92, 1.75, i === 0 ? HEX.redTint : (i === 2 || i === 3 ? HEX.navyTint : HEX.grey));
    txt(s, `Step ${i} text`, [
      { text: `${i}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 13, breakLine: true } },
      { text: f[1], options: { color: HEX.teal, fontSize: 11.5, italic: true } },
    ], { x: x + 0.12, y: 1.55, w: 1.7, h: 1.65, valign: "top", paraSpaceAfter: 2 });
  });
  panel(s, "Evidence", 0.6, 3.42, 6.0, 1.75, "FaClipboardCheck", HEX.navy, HEX.navyTint, "What the boundary package carries", [
    "Path policy, failover tests, path telemetry, exceptions, CISA parity, known limits",
  ], 13);
  panel(s, "Paired", 6.75, 3.42, 6.0, 1.75, "FaChartLine", HEX.teal, HEX.tealTint, "Prove it in your own estate", [
    "Two comparable branches, 30 days, change one, 30 more: the effect size",
  ], 13);
  decision(s, 5.3, "Adopt this order as program policy. No memo mandates it; it is an engineering dependency, which is why it survives review.",
    "Authorizing official and system owner; CISO", "Before the first production cutover");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, SP 800-53 SC-7(4); CISA BOD 26-04, ED 26-03; GAO-26-107530. Book 09, Chapters 05, 09 and 13.");
  narrate(s,
`How to proceed comes down to order. Order decides whether branch modernization is a gain or a regression.

Step zero: secure the governor. The SD-WAN controller and its edges are internet-facing with estate-wide authority, so they come under vulnerability management, privileged access and off-box logging before they carry traffic. Step one: buy the pipe on measured physics, latency and loss recorded per site before the order. Step two: deploy the governor before production traffic; a site whose control layer isn't live and logging doesn't get its new egress. Step three: treat the boundary change as the significant change it is, decided before the first production cutover. Step four: handle Microsoft 365 Optimize traffic through its own signed exception. Step five: register the evidence, and confirm CISA telemetry parity before any legacy circuit ends.

The book is candid that no memo, directive or executive order sets this sequence. It's an engineering dependency, and saying so is what makes it survive review. Doing it out of order, above all lighting up fast circuits before the security layer is live, is in the program's experience the most common and most costly mistake.

The boundary package carries the evidence: the path policy, failover test records, path telemetry, each exception with its need and duration, CISA parity, and the known limitations stated openly.

And when funding becomes possible, prove the case in your own estate. Instrument two comparable branches for 30 days, change one, measure 30 more. The difference in differences is an effect size a budget examiner will accept.

The decision: adopt this order as program policy before the first production cutover.`,
  "Book 09, Chapter 13 — Sequencing, Cost and Evidence; Chapter 09 — Who Owns the Network and Its Transport; Chapter 05 (securing the governor).");
}

// ------------------------------------------------------------------ How 2: close
{
  const s = D.content("How to proceed", "Start now: the work that needs no award");
  tag(s, "How");
  cards(s, "Start", [
    ["FaListCheck", "Staff work, no award", HEX.navy, HEX.navyTint, [
      "Write the application-to-path policy SC-7(4) asks for",
      "Instrument a sample of branches before the next migration wave",
      "Verify DNS egress ends at CISA",
    ]],
    ["FaCodeBranch", "Before money moves", HEX.teal, HEX.tealTint, [
      "Target attributes to the BOD 26-02 scoping team, in writing",
      "Decompose the field-office refresh request",
      "Re-examine any ExpressRoute for Microsoft 365",
    ]],
    ["FaUserCheck", "Before cutover", HEX.amber, HEX.amberTint, [
      "Start CLAW coordination with CISA and the provider",
      "Record the interim gap as an accepted risk",
      "Name one decider per row",
    ]],
  ], { h: 3.6 });
  callout(s, "Close", 5.3, 1.2, "FaRoute", HEX.navy, "Buy transport on physics and govern it as compliance: ",
    "the branch gets faster without getting weaker. The branch measurement baseline can't be rebuilt after the next migration wave.");
  sources(s, "Sources: NIST SP 800-53 SC-7(4); CISA BOD 26-02, SASE guide (June 2026); Microsoft Learn — ExpressRoute for Microsoft 365. Book 09, Chapters 03, 09, 10, 11 and 13.");
  narrate(s,
`Let me close with what can start now, because most of it needs no award.

The staff work: write the application-to-path routing policy that SC-7(4) already asks for. Its absence is the finding, not the absence of a device, and it turns the eventual purchase into enforcement of existing policy. Instrument a sample of branches before the next migration wave. And verify that DNS egress really ends at CISA.

Before money moves: send the target attributes to whoever scopes the BOD 26-02 replacements, in writing. Ask the field-office refresh request to separate acquisition from five-year cost. And re-examine any ExpressRoute arrangement for Microsoft 365; an approval granted years ago isn't current Microsoft guidance.

Before cutover: start CLAW coordination with CISA and the provider, because it's a three-party effort with its own lead time. Have the authorizing official record the interim gap as an accepted risk. And name one decider per row.

Recapping the seven decisions: MTIPS ends on confirmed parity, the interim gap becomes an accepted risk, the refresh carries the target, the investment order starts with staff time, the field-office request gets tested, NPS retirement follows the Entra migration, and the sequence becomes policy.

One point on urgency. The branch measurement baseline can't be reconstructed after the next migration wave, and it costs staff time rather than capital.

Buy transport on physics and govern it as compliance, and the branch gets faster without getting weaker. Book 09 has the detail, every claim footnoted, and the backup slides list the sources behind each slide in this briefing. Thank you.`,
  "Book 09, Chapter 10 — The Long Interim; Chapters 03, 09, 11 and 13.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources: policy, directives and acquisition");
  const src = [
    "CISA TIC 3.0 core guidance, September 2026 republication: Program Guidebook v1.2, Reference Architecture v1.2, Security Capabilities Catalog v3.3, Use Case Handbook v1.2, Overlay Handbook v1.2; Traditional, Branch Office v3.0, Remote User v2.2 and Cloud use cases.",
    "CISA: The Journey to Zero Trust — Using SASE in a Modern TIC 3.0 Solution, v1.0 (June 2026); Encrypted DNS Implementation Guidance; Logging Reference Architecture (August 20, 2026); CLAW Cloud Interface Reference Architecture; TIC FAQ.",
    "CISA directives: BOD 23-02; BOD 26-02 (February 5, 2026); BOD 26-04 (June 10, 2026); ED 26-03 (February 25, 2026; V1 March 11, 2026).",
    "OMB: M-19-26; M-22-09; M-26-14 (May 22, 2026; rescinds M-21-31); M-26-15 (June 24, 2026); Circular A-11.  ·  EO 14028, EO 14306, EO 14412.",
    "NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-37 Rev. 2; SP 800-52 Rev. 2; FIPS 203; CMVP FIPS 140-3 transition.",
    "FedRAMP 2026 Consolidated Rules, Notice 0013 and Marketplace product data (October 21, 2026).  ·  FAR 1.602-1.",
    "GSA: EIS program and option periods; EIS Transition Progress Tracking Report (period ending August 31, 2026); EIS Public Pricer; Trusted Internet Connections services.",
  ];
  txt(s, "Source list", bullets(src, 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Sources: technical, cost and evidence");
  const src = [
    "ITU-T G.114 (one-way transmission time); NIST CODATA; Bozkurt et al., PAM 2017.",
    "GAO-19-58, GAO-22-106195, GAO-25-107114, GAO-26-107530 (June 2026), GAO-26-107919 (August 2026); GAO-14-63; GAO OIG cloud cost report.",
    "Microsoft Learn: Configuration Manager size and scale, support lifecycle, peer cache, Connected Cache, co-management workloads; ExpressRoute for Microsoft 365; Microsoft 365 connectivity principles, URLs and IP ranges, informed network routing; tenant restrictions v2.",
    "Microsoft Learn: NPS overview and configuration export; Microsoft Entra join planning; Intune network access control integration; Credential Guard; KB5040268 (Blast-RADIUS).",
    "IEEE 802.1X-2020; RFC 3579, RFC 5176, RFC 9190.  ·  Cisco Catalyst 8000 data sheets and licensing; Cisco SD-WAN documentation.",
    "Book 09 chapters behind this briefing: 01, 02, 03, 05, 07, 09, 10, 11, 12, 13 and Appendix A. Field-office costs in Chapter 11 are labeled planning assumptions, not quotes.",
    "Full footnotes with links and access dates: Book 09, every chapter (whalermike.github.io/modernization-workbook/docs/books/b09-network/).",
  ];
  txt(s, "Source list", bullets(src, 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
