// Book 10 — Cloud Boundary & Landing Zone: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: authorizing officials, ISSOs, CIOs and CISOs. Decision-centered: each decision slide names
// the decision, its owner and when it's needed. No configuration detail.
// Build:  node presentations/b10-cloud-boundary-executive/build.js presentations/b10-cloud-boundary-executive/B10_Cloud_Boundary_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b10-cloud-boundary/, named in the notes.
const D = require("../_build/lib.js")({
  book: "Book 10",
  title: "Cloud Boundary & Landing Zone — Executive Briefing",
  footer: "Federal Modernization Workbook  ·  Book 10 Cloud Boundary & Landing Zone  ·  Executive briefing",
});
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B10_Cloud_Boundary_Executive.pptx";

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
const cards = (s, prefix, list, size, h) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1, ch = h || 3.5;
  box(s, `${prefix} card ${i + 1}`, x, 1.55, 3.95, ch, c[3]);
  icon(s, c[0], x + 0.22, 1.7, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.7, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], size || 13.5), { x: x + 0.25, y: 2.45, w: 3.5, h: ch - 1.0, paraSpaceAfter: 5 });
});
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h, w) => {
  const rw = w || 6.2;
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: rw, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, rw, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: rw - 0.3, h, fontSize: 13.5, valign: "middle" });
  });
};
// A tinted box on the right with an icon, a small label, a heading and a bullet list.
const sideBox = (s, prefix, x, w, h, iconName, color, tint, label, heading, list, size) => {
  box(s, `${prefix} box`, x, 1.55, w, h, tint);
  icon(s, iconName, x + 0.25, 1.7, 0.66, color);
  txt(s, `${prefix} head`, [
    { text: label, options: { bold: true, color: HEX.slate, fontSize: 11.5, breakLine: true } },
    { text: heading, options: { bold: true, color, fontSize: 17, fontFace: "Cambria" } },
  ], { x: x + 1.1, y: 1.65, w: w - 1.25, h: 0.85, valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 13.5), { x: x + 0.25, y: 2.6, w: w - 0.45, h: h - 1.15, paraSpaceAfter: 5 });
};
// The decision bar: what is decided, who owns it, and when it's needed.
const decision = (s, what, owner, when, color) => {
  const c = color || HEX.navy, y = 5.22, h = 1.3;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", c);
  icon(s, "FaListCheck", 0.82, y + 0.25, 0.8, c);
  const col = (name, x, w, label, text) => txt(s, name, [
    { text: label, options: { bold: true, color: HEX.slate, fontSize: 11, charSpacing: 1, breakLine: true } },
    { text, options: { fontSize: 13.5, color: HEX.ink } },
  ], { x, y: y + 0.1, w, h: h - 0.2, valign: "middle" });
  col("Decision text", 1.85, 5.7, "DECISION", what);
  col("Owner text", 7.75, 2.75, "OWNER", owner);
  col("When text", 10.6, 2.05, "NEEDED BY", when);
};

const S_WHY = "Why the boundary decides", S_WHAT = "What changed", S_WHO = "Who owns it", S_HOW = "How to respond";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, "What Does the Authorization Boundary Let You Use?", "Book 10 — Cloud Boundary & Landing Zone");
  D.agenda(s, 0.8, 4.75, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook  ·  Executive briefing", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for authorizing officials, ISSOs, CIOs and CISOs", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.55, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 10 of the Federal Modernization Workbook, Cloud Boundary and Landing Zone. It's for the people who sign for a cloud system or answer for it: authorizing officials, ISSOs, CIOs and CISOs.

The book's argument fits in one line. The license says what you bought; the boundary says what you may use. A design that confuses the two fails in front of the assessor, not in the lab.

In the next thirty minutes I'll take four questions. Why the authorization boundary decides what you can use, and why so much of it stays invisible. What changed at FedRAMP in 2026, and what Government Community Cloud leaves out. Who owns the boundary. And how to respond when a capability falls outside it, and evidence that response in your own authorization package.

There's no configuration on these slides. Each decision slide says what the decision is, who owns it, and when you need it.`,
  "Book 10, index; Chapter 01 — Why the Boundary Decides What You Can Use.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content(S_WHY, "Three checks, three owners decide what you can use");
  tag(s, "Why");
  cards(s, "Check", [
    ["FaLandmark", "The certification", HEX.navy, HEX.navyTint, ["FedRAMP certifies a specific offering, at a class from A to D", "The Marketplace is the record", "Outside the offering: not covered, whatever the portal shows"]],
    ["FaFilter", "The environment", HEX.amber, HEX.amberTint, ["GCC, GCC High and DoD differ from commercial", "Exclusions published one feature at a time", "No single machine-readable list"]],
    ["FaUserCheck", "Your authorization", HEX.teal, HEX.tealTint, ["The AO accepts the configuration and integrations", "Never a standalone ATO for a cloud service", "You authorize your system, which uses it"]],
  ]);
  decision(s, "List every cloud feature a design depends on with its Marketplace package, its availability in your environment and the page that says so. No citation means unverified, not available.",
    "System owner checks each dependency; workload owners declare them", "Before the next architecture review or authorization milestone", HEX.red);
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Using a FedRAMP Certified Cloud Service, Definitions; FedRAMP Marketplace; Microsoft Learn — network connectivity, informed network routing, Adoption Score. Book 10, Chapters 01 and 08.");
  narrate(s,
`Start with two agencies holding the same Microsoft 365 license. One runs a commercial tenant. Its admin center shows per-location network assessments, informed network routing to its SD-WAN, and an Adoption Score for its workforce. The other runs a GCC tenant and sees none of them, because Microsoft documents each one as unavailable there. Nothing in the license, the price list or the commercial documentation tells the second agency that.

The book's explanation is that three separate decisions, made by three different parties, have to line up before a feature is usable in a federal system.

First, the certification. FedRAMP certifies a specific cloud service offering at a certification class, and the FedRAMP Marketplace is the record. A feature outside the certified offering isn't covered by it, whatever the portal shows.

Second, the environment. Microsoft runs GCC, GCC High and DoD with features that differ from commercial, and it publishes those differences one feature at a time, on separate pages. There's no single machine-readable list.

Third, the agency's own authorization. The authorizing official accepts the risk of the agency's specific use: the configuration selected and the integrations enabled. FedRAMP says an agency should never create a standalone authorization to operate for a cloud service. It authorizes its own system, which uses the service.

What you can actually use is the overlap of all three. So the first decision is simple and cheap. Before the next architecture review or authorization milestone, require every cloud feature a design depends on to be listed with its Marketplace package, its availability in your environment, and the page that says so. Workload owners declare the dependencies, and the system owner checks each one. A feature with no citation is unverified, not available.`,
  "Book 10, Chapter 01 — Why the Boundary Decides What You Can Use (The catalog is not the boundary; The case in one paragraph; Three checks, three owners); Chapter 08 — Who Owns the Boundary (The responsibility matrix: feature dependency row).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content(S_WHY, "Why the gap stays invisible, and the example corrected");
  tag(s, "Why");
  rows(s, "Hidden", "WHY NOBODY SEES IT COMING", [
    ["Shared surfaces", "Intune in GCC is the commercial instance"],
    ["Scattered exclusions", "One sentence per feature page; no list"],
    ["Moving targets", "Adoption Score categories retired for all, 2026"],
    ["Silent absence", "A missing signal looks like a quiet day"],
  ], 1.92, 0.78, 0.66);
  const fix = [
    ["Network connectivity, Locations", "Confirmed unavailable in GCC"],
    ["Endpoint analytics", "Not a documented GCC gap"],
    ["Device Health Attestation", "A GCC High and DoD gap"],
    ["Expedited updates", "A GCC High and DoD gap"],
    ["Azure Arc server monitoring", "An Azure service, in FedRAMP High scope"],
  ];
  s.addTable([head(["Feature in the old example", "Verdict for GCC"]), ...fix.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: i === 0, color: i === 0 ? HEX.red : HEX.ink } }])],
    tableOpts([2.75, 2.9], { x: 7.1, y: 1.55, fontSize: 12.5, rowH: [0.42, 0.55, 0.5, 0.5, 0.5, 0.62] }));
  decision(s, "Rebuild any boundary gap list you rely on so every row cites a vendor page; drop or relabel the rest. Build designs and narratives only on confirmed rows.",
    "System owner keeps the list; the CISO decides what counts as evidence", "Before any design or narrative relies on the list");
  sources(s, "Sources: Microsoft Learn — Intune for US Government service description, Adoption Score, network connectivity, endpoint analytics, Advanced Analytics, Azure FedRAMP compliance scope. Book 10, Chapters 01, 02 and 08.");
  narrate(s,
`Why does nobody see this coming? Chapter 02 gives four reasons.

Surfaces are shared. Commercial and government tenants use the same admin centers and much of the same documentation, and Intune in GCC is the same instance as commercial Intune. Exclusions are scattered, usually one sentence on each feature's own page. Features move: Microsoft retired Adoption Score's technology-experience categories for every tenant in early 2026, so a gap list written in 2025 can name a GCC loss that's now a loss for everyone. And absence doesn't announce itself. A detection whose input never arrives produces the same dashboard as a quiet day. An agency that builds a Zero Trust control on a signal its environment doesn't deliver hasn't built a weak control. It has built no control, and nothing tells it so.

That's why discovery tends to come late, during an authorization cycle or an analytics rollout. And the problem is structural: no tenant setting turns on a feature the environment doesn't offer.

But the opposite error is just as costly. A widely repeated example listed five features as silently missing from GCC. Checked against Microsoft's documentation, one is: the Locations view of network connectivity in the admin center. Device Health Attestation and expedited updates are GCC High and DoD gaps. Endpoint analytics isn't a documented GCC gap. And Azure Arc is an Azure service, in Azure's FedRAMP High scope. An unverified boundary story sends an agency to build compensations it doesn't need.

The program's own register of GCC telemetry gaps has 26 rows. Eight are vendor-confirmed; fifteen are inference. So rebuild any gap list you rely on so every row cites a vendor page. The system owner keeps it, and the CISO decides what counts as evidence.`,
  "Book 10, Chapter 02 — The Invisible Boundary (Why the boundary is invisible; The worked example, corrected); Chapter 01 (Where the boundary shows up: late); Chapter 08 (The roles: CISO and ISSO).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content(S_WHAT, "FedRAMP 2026: services are certified, and you still authorize");
  tag(s, "What");
  cards(s, "Rules", [
    ["FaLandmark", "Certified, Classes A to D", HEX.navy, HEX.navyTint, ["Class B: the former low-impact baselines", "Class C includes the current Moderate baseline", "Class D includes the current High baseline", "No numbers, to avoid confusion with DoD impact levels"]],
    ["FaUserCheck", "Your ATO, not theirs", HEX.teal, HEX.tealTint, ["Each agency still authorizes its own systems", "Authorize at the security category you deem appropriate", "Notify FedRAMP with the ATO letter"]],
    ["FaUserClock", "The dates", HEX.amber, HEX.amberTint, ["June 25, 2026: rules announced", "July 4, 2026: optional early adoption", "January 1, 2027: mandatory for all", "June 11, 2027: no new Rev5 requests", "Existing Rev5: \"likely no later than 2029\""]],
  ], 13, 3.55);
  callout(s, "Vocabularies", 5.3, 1.2, "FaBook", HEX.navy, "Two vocabularies for years: ",
    "Rev5 packages describe a provider-drawn boundary; packages under the new rules describe scope, as data. The scope, change and data-sharing rule families apply to Rev5 Class C too.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Definitions, Using a FedRAMP Certified Cloud Service, Agency Use, Important Dates, Rev5 Class C; Notices NTC-0004, NTC-0013; FedRAMP launch announcement. Book 10, Chapters 03, 09, 11; Book 01, Ch. 12.");
  narrate(s,
`What changed at FedRAMP? FedRAMP announced its Consolidated Rules for 2026 on June 25, 2026, and they rename the product of the program. A cloud service offering is now FedRAMP Certified, at a certification class from A to D. FedRAMP's February 2026 notice maps the classes to the old baselines: Class B covers the former low-impact baselines, Class C includes the current Moderate baseline, and Class D the current High. It dropped numbered levels on purpose, to avoid confusion with the Defense Department's impact levels.

Two cautions come with the new labels. The class describes what FedRAMP assessed, not your use: agencies may authorize a service at any security category they deem appropriate under the Risk Management Framework. And certification doesn't replace your decision. Each agency still authorizes its own federal information systems, and notifies FedRAMP afterward with a copy of the authorization letter.

The dates matter for planning. Optional early adoption began on July 4, 2026. Adoption is mandatory for everyone on January 1, 2027. FedRAMP stops accepting new Rev5 certification requests on June 11, 2027, and says the end date for existing Rev5 certifications isn't final, but is likely no later than 2029. Plan against those words, not against a specific date someone repeats.

So for years you'll hold two kinds of package at once. Rev5 packages describe a boundary the provider drew. Packages under the new rules describe scope, as data. And the new rule families on assessment scope, change notification and data sharing apply to Rev5 Class C certifications too. Read each package in its own terms, and don't force one vocabulary into the other.`,
  "Book 10, Chapter 03 — What Changed at FedRAMP (Certification replaces authorization; Rev5 and the 2026 rules side by side); Chapter 09 (Make the scope arguments the 2026 rules allow); Chapter 11 (What the package is). Announcement date: Book 01, Chapter 12 — Migration Roadmap.");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content(S_WHAT, "\"The boundary\" is now four sets of obligations, and yours");
  tag(s, "What");
  txt(s, "Count head", "IN RULESET 2026.10.13.01", { x: 0.6, y: 1.55, w: 6.3, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  [["0", "times: \"authorization boundary\"", HEX.red, HEX.redTint], ["8", "times: \"boundary\" (3 your system, 4 tags, 1 other)", HEX.navy, HEX.navyTint]].forEach((c, i) => {
    const x = 0.6 + i * 3.2;
    box(s, `Count ${i + 1}`, x, 1.9, 3.05, 0.85, c[3]);
    txt(s, `Count ${i + 1} text`, [{ text: `${c[0]}  `, options: { bold: true, color: c[2], fontSize: 26, fontFace: "Cambria" } }, { text: c[1], options: { fontSize: 12.5 } }],
      { x: x + 0.15, y: 1.9, w: 2.8, h: 0.85, valign: "middle" });
  });
  const fam = [
    ["Minimum Assessment Scope", "What is in the offering"],
    ["Cryptographic Module Use", "How customer data is protected"],
    ["Vulnerability Detection and Response", "How weaknesses are handled"],
    ["Certification Data Sharing", "How the evidence reaches you"],
  ];
  s.addTable([head(["Family tagged \"boundary\"", "What it governs"]), ...fam.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([3.35, 2.9], { y: 2.9, fontSize: 12.5, rowH: [0.38, 0.44, 0.44, 0.44, 0.44] }));
  sideBox(s, "Scope", 7.1, 5.65, 3.5, "FaFilter", HEX.teal, HEX.tealTint, "MINIMUM ASSESSMENT SCOPE", "A test about data, not topology", [
    "In scope if likely to handle or affect federal customer data",
    "Security category may vary by resource",
    "Agents, clients, mobile apps: \"entirely outside the scope of FedRAMP\"",
    "Outside FedRAMP is inside your ATO",
  ]);
  decision(s, "Decide who owns each agent and client the provider delivers, and cover it in the agency's own authorization: its configuration, updates and the data it sends.",
    "Authorizing official draws the boundary; endpoint engineering does the work", "Next package update; rules mandatory January 1, 2027", HEX.teal);
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — machine-readable ruleset 2026.10.13.01, Minimum Assessment Scope (MAS-CSO-IIR, MAS-CSO-FLO), Cryptographic Module Use; NIST glossary. Book 10, Chapters 03, 08 and 09.");
  narrate(s,
`The rules also changed what the word boundary means. They're published as one machine-readable ruleset, so the vocabulary can be counted rather than characterized. In version 2026.10.13.01, the phrase authorization boundary occurs zero times. The word boundary occurs eight times: three times about the agency's own system, four times as a tag on rule families, and once in supply-chain guidance.

Those four families say what a provider's boundary now is. Minimum Assessment Scope, what is in the offering. Cryptographic Module Use. Vulnerability Detection and Response. And Certification Data Sharing, how the evidence reaches you. Four sets of obligations, not a line on a diagram. The only boundary the rules name is the agency's own system.

Minimum Assessment Scope is a test about data, not topology. A resource is in the offering if it's likely to handle federal customer data or affect its security, wherever it sits. And resources may vary by security category, so a refusal that rests on "it would raise the whole environment's level" now has to show which resource and which data.

One line in that guidance matters to every estate. Software delivered for installation on agency systems, and not operated in a shared-responsibility model, typically agents, application clients and mobile apps, is entirely outside the scope of FedRAMP. That doesn't make it unassessed. It makes it yours.

So decide who owns each agent and client, and cover it in the agency's own authorization: its configuration, its updates and the data it sends. The authorizing official draws the boundary; endpoint engineering does the work. Settle it at the next package update, and before the rules become mandatory on January 1, 2027.`,
  "Book 10, Chapter 03 — What Changed at FedRAMP (The rules have no provider authorization boundary; Minimum Assessment Scope: a test about data, not topology; Some software is outside FedRAMP entirely; What changes for the agency); Chapter 08 (The roles: identity, endpoint and network engineering); Chapter 09.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content(S_WHAT, "Change is notified, not re-approved, and evidence becomes a feed");
  tag(s, "What");
  const scn = [
    ["Class change", "A new assessment; not a notification"],
    ["Routine recurring", "No formal notice (patching, signatures)"],
    ["Adaptive", "Within 10 business days after finishing"],
    ["Transformative", "30 and 10 business days before; 5 after finishing and after verification"],
  ];
  s.addTable([head(["Provider change", "What the provider owes"]), ...scn.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 0 ? HEX.red : HEX.navy } }, { text: r[1] }])],
    tableOpts([2.2, 4.1], { y: 1.55, fontSize: 13, rowH: [0.42, 0.62, 0.62, 0.62, 0.95] }));
  sideBox(s, "Feed", 7.1, 5.65, 3.5, "FaArrowsRotate", HEX.navy, HEX.navyTint, "CERTIFICATION DATA SHARING", "The package becomes a feed", [
    "Every notice in human-readable and JSON; 12 months kept",
    "A FedRAMP-compatible trust center, with programmatic access",
    "October 21, 2026: 110 of 781 listings had a trust-center entry",
    "Agencies must review each Ongoing Certification Report",
  ]);
  decision(s, "Name the reviewer of every provider change notice and ongoing certification report, and take both in as data rather than PDFs.",
    "CISO or a named delegate reviews; ISSO reads against the record; AO decides on risk", "Now: agencies must already review each report");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Significant Change Notification, Certification Data Sharing, Collaborative Continuous Monitoring, Agency Use; FedRAMP Marketplace (October 21, 2026). Book 10, Chapters 03, 08 and 11.");
  narrate(s,
`Under the old model, a significant change to a certified service went back through an approval. The Significant Change Notification rules replace that with notification, scaled to risk, and the deadlines are in business days.

The provider classifies every potential change. A change of certification class needs a new assessment; it can't be handled as a notification. Routine recurring changes, such as patching and signature updates, get no formal notice at all. Adaptive changes are notified within 10 business days after they finish. Transformative changes, the ones with substantive new risk, need initial plans at least 30 business days before work starts, final plans 10 business days before, and notices within 5 business days after finishing and after verification. Every notice must be human-readable and JSON, and providers keep 12 months of them.

Evidence becomes a feed too. Providers must use a FedRAMP-compatible trust center, with documented programmatic access to all certification data. On October 21, 2026, only 110 of 781 Marketplace listings had a trust-center entry.

There are two consequences for you. A provider that ships continuously can treat most releases as routine and file nothing, so keeping current with commercial no longer costs the provider a compliance cycle. But your review duty doesn't shrink. Agencies must review each Ongoing Certification Report for changes that affect the risk accepted in their own authorization.

So name the reviewer now. FedRAMP recommends designating a federal senior information security official; in the program's model that's the CISO or a named delegate. The ISSO reads each notice against the boundary record, and the authorizing official decides whether it changes the agency's risk.`,
  "Book 10, Chapter 03 — What Changed at FedRAMP (Change control replaces re-authorization; Certification data becomes a feed); Chapter 08 (The roles: CISO and ISSO; The responsibility matrix); Chapter 11 (Keeping the package current).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content(S_WHAT, "GCC is the worldwide service, minus a published list");
  tag(s, "What");
  const feats = [
    ["Admin center network connectivity", "No", "No", "No"],
    ["Adoption Score", "No", "No", "No"],
    ["Office 365 CDN for SharePoint", "No", "No", "No"],
    ["Informed network routing", "No", "No", "No"],
    ["Windows release health", "Yes", "No", "No"],
    ["Word version history; Office Scripts", "Yes", "No", "No"],
  ];
  const yn = (v) => ({ text: v, options: { bold: true, color: v === "No" ? HEX.red : HEX.teal, align: "center" } });
  s.addTable([head(["Feature", "GCC", "GCC High", "DoD"]), ...feats.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, yn(r[1]), yn(r[2]), yn(r[3])])],
    tableOpts([3.5, 0.85, 1.1, 0.85], { y: 1.55, fontSize: 12.5, rowH: [0.42, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47] }));
  sideBox(s, "Loss", 7.1, 5.65, 3.5, "FaChartLine", HEX.red, HEX.redTint, "THE LARGEST DOCUMENTED LOSS", "Network connectivity, admin center", [
    "Daily 0 to 100 assessment per location; 80 is healthy",
    "Per-location egress and front doors",
    "Insights, including TLS interception",
    "Performance by named provider: ISP, overlay, corporate",
    "The test tool still works in GCC, run locally",
  ], 13);
  decision(s, "Budget for the independent network measurement that replaces the admin center layer; a commercial peer gets that evidence from a dashboard.",
    "Sponsor and CIO, who fund the platform", "Before choosing a transport or SASE provider", HEX.red);
  sources(s, "Sources: Microsoft Learn — US Government endpoints, network connectivity, network assessment, Network Insights, provider attribution, connectivity test tool, Adoption Score, Office 365 CDN, informed network routing, Windows release health, Office in Government plans. Book 10, Ch. 04, 08.");
  narrate(s,
`Now the feature gap itself. Chapter 04 reads GCC from Microsoft's own documents, and they don't describe a compliance perimeter that dims the commercial service. GCC has no endpoint list of its own: Microsoft publishes one list for Worldwide, including GCC. The restricted, separately networked environment begins at GCC High.

What GCC has is a list of exclusions, and the list isn't a ladder. Network connectivity in the admin center, Adoption Score, the Office 365 content delivery network and informed network routing are missing in GCC, GCC High and DoD alike. Windows release health, Word version history and Excel Office Scripts reach GCC and stop there. Moving up doesn't restore everything.

The largest documented loss is the network connectivity layer. A commercial tenant gets, at no extra license cost, a daily network assessment from 0 to 100 for each location, with 80 as the healthy baseline; a view of each location's egress and front doors; insights such as detecting TLS interception; and performance attributed to named network providers, whether ISP, overlay or corporate.

An agency choosing between SASE or transport providers in a commercial tenant gets comparative evidence from Microsoft, in its own admin center. The same agency in GCC gets none of it. Microsoft's network connectivity test tool does support GCC, run locally from each location, and it closes part of the gap, but not the provider comparison.

So this decision is a budget line. Fund the independent measurement that replaces the layer, before you pick a transport or SASE provider. That's the sponsor and CIO's call, because they fund the platform.`,
  "Book 10, Chapter 04 — GCC, GCC High and the Commercial Feature Gap (What GCC is, in Microsoft's own words; The gaps form a list, not a ladder; What agencies verifiably lose); Chapter 08 (The roles: sponsor and CIO); Chapter 09 (Build in-boundary equivalents).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content(S_WHAT, "A higher certification class won't bring the features back");
  tag(s, "What");
  const pk = [
    ["GCC (MSO365MT)", "FedRAMP Certified", "Class C (Moderate)", "100"],
    ["GCC, same name (MSO365MTA)", "In Process", "Class D (High)", "0"],
    ["GCC High (FR1824057433)", "FedRAMP Certified", "Class D (High)", "5"],
  ];
  txt(s, "Packages head", "MICROSOFT 365 GOVERNMENT PACKAGES, MARKETPLACE, OCTOBER 21, 2026", { x: 0.6, y: 1.55, w: 6.6, h: 0.3, fontSize: 11.5, bold: true, color: HEX.slate });
  s.addTable([head(["Package", "Status", "Class", "ATOs"]), ...pk.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: true, color: i === 1 ? HEX.amber : HEX.ink } }, { text: r[3], options: { align: "center" } }])],
    tableOpts([2.3, 1.55, 1.55, 0.75], { y: 1.92, fontSize: 12.5, rowH: [0.42, 0.72, 0.72, 0.72] }));
  txt(s, "Axes note", [{ text: "Different axes: ", options: { bold: true, color: HEX.red } }, { text: "a class decides what data you may place in the service; the provider decides what the service does in each environment." }],
    { x: 0.6, y: 4.6, w: 6.2, h: 0.55, fontSize: 13 });
  sideBox(s, "Read", 7.1, 5.65, 3.5, "FaScaleBalanced", HEX.amber, HEX.amberTint, "READ IT AS A QUESTION", "Not a roadmap", [
    "Same name, relationship not stated: ask",
    "Service description says High; Marketplace says Class C",
    "GCC High is Class D and still lacks network connectivity",
    "Don't hard-code Moderate either: it may move",
  ]);
  decision(s, "Plan against the class of the package you actually use. Never defer an in-boundary equivalent because \"High is coming\"; record the second package as an open question.",
    "Sponsor and CIO own the honest plan", "In the current architecture and acquisition plan", HEX.amber);
  sources(s, "Sources: FedRAMP Marketplace, products.json (October 21, 2026); FedRAMP Significant Change Notification (SCN-CSO-EVA), Notice NTC-0004; Microsoft Learn — Office 365 GCC service description, network connectivity. Book 10, Chapters 01, 04, 08 and 09.");
  narrate(s,
`Much federal reasoning runs two questions together: GCC is Moderate, Moderate is why the feature is missing, and a High certification would bring it back. The Marketplace doesn't support that chain.

Read on October 21, 2026, it lists three Microsoft 365 government packages. The GCC package agencies run is FedRAMP Certified at Class C, Moderate, with 100 authorizations. A second package with the identical name is In Process at Class D, High, with none. And GCC High is a separate package, certified at Class D, with 5.

The straightforward reading of that second package is a High effort for GCC, but the Marketplace doesn't state how the two relate, or whether one will replace the other. Treat it as a question for the provider, not a roadmap. Microsoft's own GCC service description adds a wrinkle: it says Office 365 Government supports FedRAMP at a High impact level, while the Marketplace record says Class C. Cite the Marketplace and the package, and record the discrepancy.

Now the key point. Network connectivity is missing in GCC High too, and GCC High is already Class D. A higher class changes what data you may place in the service. It doesn't, by itself, restore a feature the provider excluded. An agency that defers an equivalent because High is coming may wait for something the certification was never going to deliver.

So plan against the class of the package you actually use. And don't hard-code Moderate into a multi-year architecture either, because that premise may move. The sponsor and CIO own that honest plan, in the current architecture and acquisition cycle.`,
  "Book 10, Chapter 04 — GCC, GCC High and the Commercial Feature Gap (Microsoft is pursuing High for GCC, and what that doesn't change; Impact level and feature availability are different axes); Chapter 01; Chapter 08 (The roles: sponsor and CIO); Chapter 09 (A higher class doesn't restore an excluded feature).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = D.content(S_WHO, "One decider per row: who owns the boundary");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Authorizing official", "The boundary; every exception; reauthorization"], ["Sponsor and CIO", "Which clouds, funding, sequence, tie-breaks"], ["CISO and ISSO", "Control requirements; evidence; provider notices"]]],
    ["FaClipboardCheck", "Keep the record", HEX.teal, HEX.tealTint, [["System owner", "The boundary record, the package, placement"], ["Acquisition and CO", "The contract and the GCC SKU"], ["FedRAMP", "Consulted; receives the ATO letter"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Platform team", "Landing zone, policy, vending, probe"], ["Workload owners", "Feature dependencies; data class"], ["Security operations", "Drift findings; change notices"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.8, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.95, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Rules head", "THREE RULES THAT DON'T BEND", { x: 0.6, y: 4.47, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Can't be delegated", "explicit risk acceptance is the AO's alone; the role is for government personnel only", HEX.navy],
    ["Builders don't accept gaps", "the platform team implements; whether a gap is acceptable goes to the AO", HEX.amber],
    ["FedRAMP is consulted", "its certification is an input to the AO's decision; it never replaces it", HEX.teal],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Rule ${i + 1}`, x, 4.85, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Rule ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.93, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task P-11, Task R-4, Appendix D); FedRAMP Consolidated Rules for 2026 — Using a FedRAMP Certified Cloud Service, Agency Use; FAR 1.602-1; Microsoft Learn — shared responsibility, subscription vending. Book 10, Chapter 08.");
  narrate(s,
`Who owns all this? Chapter 08's rule is one decider per row, and it starts from FedRAMP's split. The provider owns the service boundary and its certification. The agency owns the boundary of its own system, and everything it builds, configures and connects inside it.

On the agency side, the authorizing official determines the authorization boundary, with input from the system owner. That comes straight from NIST SP 800-37. The official signs every documented exception, approves the plan of action and milestones, and decides whether a change requires reauthorization. Explicit risk acceptance can't be delegated, and for federal agencies the role is assigned to government personnel only. A designated representative can run the process; only the authorizing official signs.

The system owner is the boundary owner: keeper of the boundary record and the package. The CISO sets the control requirements and decides what counts as evidence, and the ISSO reads provider notices against the record. The sponsor and CIO choose the clouds, fund the platform, set the sequence and break the ties, which will happen, because everyone can reasonably claim the landing zone.

Then the people who do the work. The platform team builds the landing zone, the policy and subscription vending, but it doesn't decide whether a gap is acceptable. That goes to the authorizing official. Workload owners declare the features their designs depend on. Security operations runs drift detection. And acquisition holds the contract, because only a contracting officer can change what the agency bought.

FedRAMP is consulted, not in charge. Agencies notify it after authorizing, and work with it when a determination conflicts with a provider's package. Its certification is an input to the authorizing official's decision. It never replaces it.`,
  "Book 10, Chapter 08 — Who Owns the Boundary (Where the roles come from; Decision rights and work are different things; The roles; The responsibility matrix).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = D.content(S_WHO, "Five decisions that look like engineering tickets");
  tag(s, "Who");
  const dec = [
    ["Placing a workload in a new subscription", "System owner (vending is the platform's mechanism)", "Before it's vended: no record, no go-live"],
    ["A design's dependency on a cloud feature", "System owner", "Before the design is built"],
    ["The SKU and shared responsibility terms", "Contracting officer", "In the order: a GCC SKU puts the tenant in scope"],
    ["Whether a provider change alters your risk", "Authorizing official", "When the notice is reviewed"],
    ["Requiring more than FedRAMP requires", "Agency head or delegate; FedRAMP notified", "Before it goes into a contract"],
  ];
  s.addTable([head(["Decision", "Who decides", "When it's needed"]), ...dec.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([4.4, 3.75, 4.0], { y: 1.5, fontSize: 13, rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  const panels = [
    ["FaSitemap", "The landing zone makes it checkable", HEX.teal, HEX.tealTint, ["It enforces structure; it doesn't authorize", "Microsoft calls the policy compliance view partial"]],
    ["FaTriangleExclamation", "Plan it, don't discover it", HEX.red, HEX.redTint, ["Accelerators supported only in public Azure", "Terraform state is sensitive data, in the boundary"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 4.7, 6.0, 1.8, p[3]);
    icon(s, p[0], x + 0.2, 4.8, 0.56, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 4.8, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13.5), { x: x + 0.25, y: 5.45, w: 5.6, h: 0.98, paraSpaceAfter: 3 });
  });
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Agency Use (AGU-AGC-NAR, -TPP); FedRAMP Marketplace (GCC SKU message); NIST SP 800-37 Rev. 2; Microsoft Learn — landing zones, Azure Policy; HashiCorp — sensitive data. Book 10, Chapters 05, 07, 08.");
  narrate(s,
`The most consequential boundary decisions don't look like boundary decisions. They look like engineering tickets, and that's how they slip past the people who should make them.

Placement. Vending a new subscription is the platform team's mechanism, but whether a workload is inside the authorized system is the system owner's decision. The cheapest way to turn an authorized system into an unauthorized one is a subscription no one recorded. A workload whose subscription isn't in the boundary record doesn't go live.

Feature dependency. The system owner checks each feature a design depends on against what's been tested to work in your cloud, before the design is built.

The contract. The GCC listing says customers must buy a GCC SKU to be covered by the GCC authorization, so a licensing choice is a boundary choice, and it belongs to the contracting officer.

Provider changes. When a provider notice might change the agency's risk, the authorizing official decides, not whoever happens to be on the distribution list.

And asking for more. Agencies must not require a certified service to supply more than FedRAMP requires, unless the agency head or a delegate finds a demonstrable need and notifies FedRAMP.

The landing zone makes these decisions checkable, but it doesn't make them. It enforces structure, and its compliance reports are evidence, yet Microsoft itself calls the policy compliance view partial. Two planning facts for leaders. Microsoft's landing-zone accelerators are supported only in public Azure, so an Azure Government build needs the code adapted by hand. And the pipeline that builds it is inside the boundary question too, because Terraform state is sensitive data. Plan both; don't discover them.`,
  "Book 10, Chapter 08 — Who Owns the Boundary (The responsibility matrix; Acquisition and the contracting officer); Chapter 05 — The Landing Zone (What a landing zone is; What a landing zone can't prove); Chapter 07 — The Landing Zone Front Door (The pipeline is inside the boundary too).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content(S_HOW, "Three honest responses when a capability is outside");
  tag(s, "How");
  cards(s, "Resp", [
    ["FaShieldHalved", "Compensate in-boundary", HEX.navy, HEX.navyTint, ["Rebuild enough of it from inside the boundary", "Say that it's derived, everywhere it flows", "Say what it doesn't replace"]],
    ["FaFileShield", "Documented exception", HEX.amber, HEX.amberTint, ["The provider's own exception path, or", "A dated risk acceptance the AO signs", "Closing it: POA&M. Living with it: signed exception"]],
    ["FaRoute", "Alternative path", HEX.teal, HEX.tealTint, ["A different certified service or approach", "Going without is legitimate, if decided", "Probe first: test the output, not the switch"]],
  ]);
  decision(s, "Choose a response for each register row: equivalent, exception, alternative path or going without, and evidence it in the agency's own package.",
    "System owner proposes; AO decides every exception; CISO sets the evidence class", "Per row, before a design depends on the capability", HEX.amber);
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task R-4, Appendix G); SP 800-53 CA-5; Microsoft Learn — network connectivity, network connectivity test tool. Book 10, Chapters 01, 02 and 09.");
  narrate(s,
`How do you respond when a capability is outside? NIST SP 800-37 names four options: employ compensating controls, accept greater risk, contract with a more trustworthy provider, or don't obtain the service. The book turns them into three responses, and each one is a decision with an owner.

One: compensate in-boundary. Rebuild the capability, or enough of it, from signals inside the boundary, and say that it's derived. Take the network connectivity gap. Scheduled runs of Microsoft's test tool from each location close part of it, if the results are labeled derived. They don't replace the provider comparison, and the register should say so. A narrative that hides the substitution is exactly the kind an assessor takes apart.

Two: a documented exception. Either a request through the provider's own exception process, or the authorizing official accepting the residual risk in writing. A gap you intend to close goes on the plan of action and milestones, with a milestone and an owner. A gap you've decided to live with goes into a signed exception with an end or review date, so that permanent is a decision someone repeats, not a default.

Three: an alternative path, a different certified service or a different way to meet the need. And going without is legitimate too, as long as someone decided it.

Before any of these, probe. A scripted test of what actually works in your own tenant, checking for the output rather than the switch, rerun on a schedule and after any relevant provider notice.

So for each gap, the system owner proposes a response, the authorizing official decides every exception, and the CISO sets the evidence class. Make that call per register row, before a design depends on the capability.`,
  "Book 10, Chapter 09 — In-Boundary Equivalents and Documented Exceptions (Probe what actually works; Build in-boundary equivalents; Use documented exceptions; The playbook, in order); Chapter 01 (Three responses when a capability is outside).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content(S_HOW, "Exceptions: the provider's path, and the rules' limits");
  tag(s, "How");
  const panels = [
    ["FaDoorOpen", "The provider's own path", HEX.navy, HEX.navyTint, [
      "ExpressRoute for Microsoft 365: \"not recommend\"",
      "Authorized only when a regulation mandates direct connectivity",
      "Quote the regulation, with a link",
      "No FedRAMP rule or FISMA provision found that does"]],
    ["FaScaleBalanced", "Four scope arguments, four limits", HEX.amber, HEX.amberTint, [
      "Category varies by resource: binds the provider",
      "Agents outside FedRAMP: still in your ATO",
      "Routine changes unnotified: you still review",
      "Demanding more needs the agency head"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 1.5, 6.0, 2.5, p[3]);
    icon(s, p[0], x + 0.2, 1.62, 0.6, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 1.62, w: 4.9, h: 0.6, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13.5), { x: x + 0.25, y: 2.32, w: 5.6, h: 1.62, paraSpaceAfter: 3 });
  });
  callout(s, "Badge", 4.12, 0.98, "FaListCheck", HEX.red, "Buy the capability, not the badge: ",
    "Microsoft's Network Provider Program is closed to new providers, so naming membership as a qualification restricts competition.");
  decision(s, "Don't write a provider exception into a task order before it's authorized; specify the capability the register row describes, not a product or program.",
    "System owner decides to request; acquisition and engineering do the work", "Before the solicitation is written");
  sources(s, "Sources: Microsoft Learn — ExpressRoute for Microsoft 365, Assessing network connectivity, Network Provider Program; FedRAMP Consolidated Rules for 2026 — MAS, SCN, Agency Use; NIST SP 800-37 Rev. 2. Book 10, Chapters 08 and 09; Appendix A.");
  narrate(s,
`Two cautions on exceptions.

First, the provider's path. ExpressRoute for Microsoft 365 is the worked example. Microsoft says it doesn't recommend it, and authorizes it only when a customer's regulatory requirement mandates direct connectivity, with the text excerpt and a web link to the regulation. Federal readers often assume FedRAMP or FISMA supplies that hook. The program hasn't found a FedRAMP rule or a FISMA provision that mandates private connectivity to Microsoft 365, and TIC 3.0 mandates no specific technology. Write it into a task order before the authorization is in hand, and you may find the gate afterwards. But the process is a good template for every request you make: a named requirement, quoted, with a link.

Second, the scope arguments the 2026 rules allow each come with a limit. Security category can vary by resource, but that binds the provider's description; your own system is still categorized under the Risk Management Framework. Agents are outside FedRAMP, but not outside your authorization. Routine changes go unnotified, but you still decide whether a change affects your risk. And you can't simply demand more than FedRAMP requires.

Acquisition is where an exception path gets closed by accident. Microsoft's Network Provider Program is no longer open to new network providers, so a solicitation that names membership as a qualification restricts competition to a closed pool. Specify the capability instead. Write the requirement the register row describes, not the product that happens to meet it today.

The system owner decides whether to make a provider-side request, and acquisition and engineering do the work. That decision belongs before the solicitation is written.`,
  "Book 10, Chapter 09 — In-Boundary Equivalents and Documented Exceptions (The provider's own exception path; Make the scope arguments the 2026 rules allow; Buy the capability, not the badge); Chapter 08 (The responsibility matrix: provider-side exception row).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content(S_HOW, "The alternative path: change the suite, keep the identity plane");
  tag(s, "How");
  const svc = [
    ["Microsoft 365 GCC (MSO365MT)", "Class C (Moderate)"],
    ["Google Workspace", "Class D (High)"],
    ["Gemini for Government", "Class B (Low)"],
    ["Zoom for Government", "Class C (Moderate)"],
    ["Webex for Government", "Class C (Moderate)"],
    ["Slack / GovSlack", "Class C / Class D"],
    ["Box Enterprise Cloud", "Class D (High)"],
  ];
  s.addTable([head(["FedRAMP Certified listing", "Class (impact level)"]), ...svc.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([3.75, 2.45], { y: 1.55, fontSize: 12.5, rowH: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4] }));
  sideBox(s, "Identity", 7.1, 5.65, 3.5, "FaIdCard", HEX.teal, HEX.tealTint, "THE PUBLIC RECORD, AND THE RULE", "Read the listing, keep Entra ID", [
    "Up to $89M over five years, to move 50,000+ staff",
    "Elsewhere, ~150,000 licenses ended at ~16% use",
    "The suite is a workload that consumes identity",
    "Super admins sign in outside it; report drift",
  ]);
  decision(s, "Treat a suite change as its own decision, with its own approval and decision record, separate from identity modernization; measure adoption in the pilot.",
    "Sponsor and CIO decide which clouds and services", "Re-read the listing on the day you decide", HEX.teal);
  sources(s, "Sources: FedRAMP Marketplace (October 21, 2026); Google Cloud FedRAMP scope; Microsoft Learn — Google Workspace provisioning and SSO, Conditional Access; Google Workspace Admin Help; GSA (April 2025); Nextgov/FCW; Stars and Stripes. Book 10, Ch. 08, 10.");
  narrate(s,
`The third response is a different certified service for the workload. Chapter 10 works through collaboration, and its first rule is to read the certification, not the announcement.

On the Marketplace, Google Workspace is certified at Class D. Gemini for Government is a separate listing at Class B, Low, even though Google says Gemini in Workspace apps is FedRAMP High authorized. Which AI features sit inside which certification is a question for the package. And the Workspace listing marks some services as not meeting a control enhancement, SA-9 five, on where processing and storage happen. Details like those decide what you can turn on.

The public record shows both outcomes. In September 2025 a cabinet-level department awarded a five-year agreement worth up to 89 million dollars to move more than 50,000 employees to Google Workspace, under a GSA agreement with a temporary 71 percent price reduction. So a five-year cost model has to price the renewal years, not the launch price. A military department went the other way, ending about 150,000 Google email licenses after an audit found about 16 percent in use. Adoption has to be measured in the pilot, not assumed.

The choice is only safe if the identity plane stays put. Entra ID remains the source, and the suite is a workload that consumes identity: provisioned, federated, with Conditional Access applied at sign-in. Then close two gaps. Google super administrators sign in outside it, and Google's own directory is derived, so report its drift.

The sponsor and CIO decide which services the agency uses. Make the suite decision its own approval, separate from identity modernization, and read the listing again on the day you decide.`,
  "Book 10, Chapter 10 — Alternative Collaboration Paths (Read the certification, not the announcement; A public example; A counter-example; Keep the identity plane where it is; The decision record); Chapter 08 (The responsibility matrix).");
}

// ------------------------------------------------------------------ How 4
{
  const s = D.content(S_HOW, "What to ask a cloud provider for");
  tag(s, "How");
  const asks = [
    ["A1", "Exclusion list as data", "Extends CDS-CSO-SVC"],
    ["A2", "Exception path per feature", "The ExpressRoute model"],
    ["A3", "Network observability in GCC", "Or the named obstacle"],
    ["A4", "The two GCC packages", "What Class D would change"],
    ["A5", "Software outside the offering", "MAS-CSO-IIR guidance"],
    ["A6", "A trust center with an API", "CDS-CSO-UTC, CDS-TRC-PAC"],
    ["A7", "Change notices as a feed", "SCN-CSO-HRM, -HIS, -NOM"],
    ["A8", "Crypto modules per service", "CMU-CSO-CMD, -UVM, -CAT"],
  ];
  asks.forEach((a, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.075, y = 1.5 + row * 1.85;
    box(s, `Ask ${a[0]}`, x, y, 2.95, 1.7, row ? HEX.navyTint : HEX.grey);
    txt(s, `Ask ${a[0]} text`, [
      { text: a[0], options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: a[1], options: { bold: true, color: HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: a[2], options: { fontSize: 12.5 } },
    ], { x: x + 0.15, y: y + 0.08, w: 2.7, h: 1.55, valign: "middle", paraSpaceAfter: 2 });
  });
  decision(s, "Put the eight requests to your provider: name one item, cite the basis, ask for data. Record each request, its date and the answer; a documented no is evidence too.",
    "System owner, with acquisition", "Once the feature inventory exists", HEX.teal);
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — CDS, SCN, CMU, MAS, Agency Use; Microsoft Learn — assessing network connectivity (ExpressRoute), network provider attribution; FedRAMP Marketplace (October 21, 2026). Book 10, Appendix A; Ch. 08.");
  narrate(s,
`Appendix A turns the book into requests. "Give us commercial parity" can't be answered. A specific question tied to a published rule or a published exclusion can, with a yes, a no or a date. Three habits make a request hard to deflect: name one item, cite the basis with a link, and ask for data, not documents.

Eight requests follow. Publish the per-feature exclusion list as data. Name the exception path for each excluded feature. Restore the network observability layer in GCC, or publish the specific obstacle. Explain the two same-named GCC packages, and which exclusions Class D would and wouldn't lift. List the agents and clients that sit outside the certified offering. Provide a FedRAMP-compatible trust center with programmatic access: on October 21, 2026, none of the three Microsoft 365 government packages had a trust-center entry. Deliver change notices as a JSON feed. And document the cryptographic modules for each service, with their validation status.

Five of the eight rest on obligations the 2026 rules already place on providers, so none of them needs a boundary argument. And asking isn't requiring. Requiring more than FedRAMP does takes a determination by the agency head or a delegate, and notice to FedRAMP.

The system owner makes these requests, with acquisition. Put them to your provider once your feature inventory exists, and record each request, its date and the answer in the authorization package. A documented no is evidence too.`,
  "Book 10, Appendix A — What to Ask a Cloud Provider For; Chapter 08 (The responsibility matrix: request for provider materials beyond FedRAMP's requirements).");
}

// ------------------------------------------------------------------ How 5
{
  const s = D.content(S_HOW, "Evidence the boundary in your own package");
  tag(s, "How");
  const arts = [
    ["SSP: the boundary", "Boundary the AO set; components", "P-11, PL-2"],
    ["SSP: external services", "Package, class, SKU, oversight roles", "SA-9"],
    ["SSP: exchanges", "Each crossing, with an agreement", "CA-3"],
    ["Compensating narrative", "Four sentences; substitute is derived", "FedRAMP"],
    ["POA&M", "Agency's own gaps, with milestones", "CA-5"],
    ["Component definition", "Each in-boundary equivalent", "OSCAL"],
    ["Continuous monitoring", "Probe reruns, drift, provider notices", "CA-7"],
  ];
  s.addTable([head(["Package artifact", "What the boundary record adds", "Basis"]), ...arts.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: true } }])],
    tableOpts([2.15, 3.45, 1.0], { y: 1.5, fontSize: 12, rowH: [0.38, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44] }));
  sideBox(s, "Whose", 7.45, 5.3, 3.55, "FaBook", HEX.navy, HEX.navyTint, "KNOW WHOSE PACKAGE YOU READ", "Inherit; don't copy", [
    "GCC leverages Azure Government as its IaaS and PaaS: two packages",
    "A GCC SKU puts the tenant in scope",
    "Don't copy provider controls into your SSP",
    "Listing's trust-center and guide fields: empty",
  ], 13);
  decision(s, "Write the boundary down once, as a boundary record that the SSP, POA&M and component definition all cite; keep it current from the probe and provider notices.",
    "System owner keeps it; the AO determines the boundary", "Before the package reaches the AO, then continuously");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 PL-2, SA-9, CA-3, CA-5, CA-7; FedRAMP Consolidated Rules for 2026 — Rev5 Certification Packages, Agency Use, agency responsibilities; NIST OSCAL; FedRAMP Marketplace. Book 10, Chapter 11.");
  narrate(s,
`Finally, the package. An agency never authorizes a cloud service; it authorizes its own system, which uses one. The provider's certification is evidence you read. Your package is evidence you write, and its plan should contain only what the agency is responsible for. FedRAMP's Rev5 guidance is blunt: don't copy and paste provider controls into the agency plan, and don't blindly copy provider findings into your plan of action and milestones.

The program writes the boundary down once, as a boundary record the system owner keeps, and every artifact cites it. The system description names the boundary the authorizing official determined. The external services section names each certified service with its Marketplace package, class and SKU. Each crossing, such as a federated trust or a connector, is an information exchange with an agreement. Gaps you'll close go on the plan of action and milestones. Each equivalent is described as a component in OSCAL. When the probe finds a change, one record changes, and every narrative that cites it is current.

Know whose package you're reading. The GCC listing says the service leverages Azure Government as its infrastructure, so inheritance runs through two provider packages before it reaches you. And on October 21, 2026, that listing's trust-center and secure-configuration fields were empty, so record where you got the guidance.

A compensating narrative takes four sentences: what the control needs; what the provider documents as unavailable, with the citation; what runs instead, marked derived; and where the remaining gap is recorded.

The system owner builds this before the package reaches the authorizing official, and keeps it current from then on.`,
  "Book 10, Chapter 11 — Evidencing the Boundary in the Authorization Package (What the package is; The boundary as one artifact; Know whose package you are reading; Writing control narratives at the boundary; Keeping the package current).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content(S_HOW, "Five decisions, five owners, and the next step");
  tag(s, "How");
  const dec = [
    ["Determine the boundary; sign every exception with an end or review date", "Authorizing official", "Before workloads arrive"],
    ["Keep the boundary record; gate every subscription and feature dependency", "System owner", "Before vending; before design"],
    ["Name the change-notice reviewer; decide what counts as evidence", "CISO, with the ISSO", "Now"],
    ["Fund measurement and compensations; plan against the class you have", "Sponsor and CIO", "Current plan and budget"],
    ["Buy the SKU the boundary assumes; specify capabilities, not badges", "Contracting officer", "In every order"],
  ];
  s.addTable([head(["Decision", "Owner", "Needed by"]), ...dec.map((r) => [{ text: r[0] }, { text: r[1], options: { bold: true, color: HEX.navy } }, { text: r[2] }])],
    tableOpts([6.85, 2.75, 2.55], { y: 1.5, fontSize: 13.5, rowH: [0.4, 0.6, 0.6, 0.6, 0.6, 0.6] }));
  callout(s, "Next", 5.15, 1.35, "FaRoute", HEX.navy, "Next step, no award needed: ",
    "before the next architecture review, list every cloud feature your designs depend on, with its Marketplace package, its availability in your environment and the page that says so. Then put Appendix A's requests to your provider.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Using a FedRAMP Certified Cloud Service, Agency Use, Important Dates; NIST SP 800-37 Rev. 2; FedRAMP Marketplace. Book 10, Chapters 01, 04, 08, 09 and 11; Appendix A.");
  narrate(s,
`So, five decisions, each with its owner.

The authorizing official determines the boundary before workloads arrive, and signs every exception with an end or review date.

The system owner keeps the boundary record, gates every new subscription, and checks every feature dependency before a design is built.

The CISO names the reviewer of provider change notices and ongoing certification reports, and decides what counts as evidence, with the ISSO doing the reading.

The sponsor and CIO fund the measurement and the compensations the register calls for, and plan against the class you actually have, not the one you're waiting for.

And the contracting officer buys the SKU the boundary assumes, and specifies capabilities, not program badges.

The next step needs no award. Before the next architecture review, list every cloud feature your designs depend on, with its Marketplace package, its availability in your environment and the page that says so. Then put Appendix A's requests to your provider, and record the answers in your package.

The rules become mandatory on January 1, 2027, and new Rev5 requests stop on June 11, 2027. Neither date moves your own boundary. It's still yours to draw, to evidence and to sign.

The license says what you bought; the boundary says what you may use. Book 10 has the detail, with every claim footnoted. Thank you.`,
  "Book 10, Chapters 01, 04, 08, 09 and 11; Appendix A.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources: rules, standards and the Marketplace");
  const src = [
    "FedRAMP Consolidated Rules for 2026: Using a FedRAMP Certified Cloud Service; Definitions (Certification Class, Cloud Service Offering, Federal Customer Data, Trust Center); Scope of FedRAMP (quoting OMB M-24-15); Minimum Assessment Scope (MAS-CSO-IIR, -FLO, -TPR, -MDI, -SUP); Cryptographic Module Use (CMU-CSO-CMD, -UVM, -CAT).",
    "FedRAMP Consolidated Rules for 2026, continued: Significant Change Notification (SCN-CSO-EVA, -HIS, -HRM, -NOM, -EMG; SCN-RTR-NNR; SCN-ADP-NTF; SCN-TRF-NIP, -NFP, -NAF, -NAV, -UPD); Certification Data Sharing (CDS-CSO-PUB, -SVC, -UTC; CDS-TRC-USH, -PAC, -AAI, -ACL, -HMR, -SSM); Agency Use; Collaborative Continuous Monitoring; Federal Agencies responsibilities; Certification Packages and Rev5 Certification Packages; Rev5 Rulesets and Rev5 Class C; Important Dates.",
    "FedRAMP machine-readable ruleset fedramp-consolidated-rules.json, version 2026.10.13.01 (October 13, 2026).  ·  FedRAMP Notices NTC-0004 (February 25, 2026) and NTC-0013 (June 16, 2026).  ·  FedRAMP, \"Propelling Change: FedRAMP Launches Consolidated Rules for 2026\" (June 25, 2026), cited in Book 01, Chapter 12.",
    "FedRAMP Marketplace dataset, products.json (last changed October 21, 2026): MSO365MT, MSO365MTA, FR1824057433, F1603087869, F1209051525, F1206081364, FR2604952026, FR1825941347A, F1511207635, FR1823447014, FR2230252267, F1212191840A; trust-center field count; HCP Terraform, GitHub Enterprise Cloud, GitLab Dedicated for Government.",
    "NIST SP 800-37 Rev. 2 (Tasks P-11, R-1, R-4; Appendices D, F, G); SP 800-53 Rev. 5, release 5.2.0 (PL-2, SA-4, SA-9, CA-3, CA-5, CA-7); NIST glossary, \"authorization boundary\"; OSCAL component definition model.  ·  FAR 1.602-1.",
  ];
  txt(s, "Source list 1", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Sources: providers and the public record");
  const src = [
    "Microsoft Learn, Microsoft 365: network connectivity in the admin center; network assessment; Network Insights; network provider details and attribution; network connectivity test tool; informed network routing; Adoption Score; Office 365 CDN quickstart; US Government endpoints; GCC High and DoD network requirements; ExpressRoute for Microsoft 365; assessing network connectivity; Network Provider Program; managing Microsoft 365 endpoints.",
    "Microsoft Learn, service descriptions and Intune: Office 365 GCC; Office application and feature availability in Government plans; Windows release health; Intune for US Government; endpoint analytics; Advanced Analytics.",
    "Microsoft Learn, Azure: cloud feature availability for US Government; services in FedRAMP audit scope; shared responsibility; Azure landing zones and subscription vending; Azure Policy regulatory compliance; Microsoft FedRAMP offering page.",
    "Identity and collaboration: Microsoft Learn — Google Workspace provisioning and SSO tutorials, Conditional Access target resources; Google Cloud FedRAMP and DoD compliance scope; Google Workspace Admin Help (SSO, super administrator SSO).  ·  HashiCorp — sensitive data in state.",
    "Public record: GSA news releases (April 10 and August 21, 2025); Nextgov/FCW (October 29 and December 29, 2025; October 16, 2026); Google Cloud blog (December 5, 2025); Stars and Stripes (February 28, 2025).",
    "Full footnotes with links and access dates: Book 10, every chapter (whalermike.github.io/modernization-workbook/docs/books/b10-cloud-boundary/).",
  ];
  txt(s, "Source list 2", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Where each slide comes from");
  const map = [
    ["Three checks, three owners", "Ch. 01, 08"], ["Why the gap stays invisible", "Ch. 01, 02, 08"],
    ["FedRAMP 2026: certified, you authorize", "Ch. 03, 09, 11; Book 01 Ch. 12"], ["\"The boundary\" is four obligations", "Ch. 03, 08, 09"],
    ["Change is notified; evidence is a feed", "Ch. 03, 08, 11"], ["GCC is the worldwide service, minus a list", "Ch. 04, 08, 09"],
    ["A higher class won't restore features", "Ch. 01, 04, 08, 09"], ["One decider per row", "Ch. 08"],
    ["Five decisions that look like engineering", "Ch. 05, 07, 08"], ["Three honest responses", "Ch. 01, 02, 09"],
    ["Exceptions and the rules' limits", "Ch. 08, 09; App. A"], ["The alternative path", "Ch. 08, 10"],
    ["What to ask a cloud provider for", "App. A; Ch. 08"], ["Evidence the boundary in your package", "Ch. 11"],
  ];
  const half = Math.ceil(map.length / 2);
  [map.slice(0, half), map.slice(half)].forEach((part, k) => {
    s.addTable([head(["Slide", "Book 10 source"]), ...part.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
      tableOpts([3.6, 2.35], { x: 0.6 + k * 6.2, y: 1.5, fontSize: 12.5, rowH: Array(part.length + 1).fill(0.48) }));
  });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
