// Book 10 — Cloud Boundary & Landing Zone: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b10-cloud-boundary/build.js presentations/b10-cloud-boundary/B10_Cloud_Boundary.pptx
// Every fact comes from a footnoted chapter of docs/books/b10-cloud-boundary/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 10", title: "Cloud Boundary & Landing Zone" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B10_Cloud_Boundary.pptx";

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

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why the boundary decides", "Why Does the Authorization Boundary Decide What You Can Use?", "Book 10 — Cloud Boundary & Landing Zone");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 10 of the Federal Modernization Workbook, Cloud Boundary and Landing Zone: how the authorization boundary, not the product catalog, decides which cloud features an agency can use,.

I'll take four questions: why the boundary decides what you can use, what has to change, who owns the boundary, and how to get there.

The short version: treat the boundary as a list you can read, not a perimeter you can only accept, and evidence every choice in your own package.`,
  "Book 10, index; Chapter 01 — Why the Boundary Decides What You Can Use.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why the boundary decides", "Three checks, three owners decide what you can use");
  tag(s, "Why");
  cards(s, "Check", [
    ["FaLandmark", "The certification", HEX.navy, HEX.navyTint, ["FedRAMP certifies a specific offering", "At a certification class, A to D", "The Marketplace is the record", "Outside the offering: not covered"]],
    ["FaFilter", "The environment", HEX.amber, HEX.amberTint, ["GCC, GCC High and DoD differ from commercial", "Exclusions published feature by feature", "No single machine-readable list"]],
    ["FaUserCheck", "Agency authorization", HEX.teal, HEX.tealTint, ["The agency authorizes its own system", "The AO accepts the configuration and integrations", "Never a standalone ATO for a cloud service"]],
  ]);
  callout(s, "Overlap", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "Same license, different products: ",
    "a commercial tenant sees per-location network assessments, informed network routing and Adoption Score; a GCC tenant sees none of them. What you can use is the overlap of all three checks.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Using a FedRAMP Certified Cloud Service, Definitions; FedRAMP Marketplace; Microsoft Learn — network connectivity, informed network routing, Adoption Score. Book 10, Chapter 01.");
  narrate(s,
`Why does the authorization boundary decide what you can use? Start with two agencies holding the same Microsoft 365 license. One runs a commercial tenant and sees per-location network assessments, informed network routing and an Adoption Score. The other runs a GCC tenant and sees none of them, because Microsoft documents each one as unavailable there.

Three decisions, made by three parties, have to line up. FedRAMP certifies a specific offering at a certification class, and the Marketplace is the record. The provider publishes, feature by feature, what each government environment leaves out. And the agency authorizes its own system: its authorizing official accepts the risk of the configuration selected and the integrations enabled. FedRAMP says an agency should never create a standalone authorization to operate for a cloud service.

What the agency can use is the overlap of all three. A feature with no citation is unverified, not available.`,
  "Book 10, Chapter 01 — Why the Boundary Decides What You Can Use (The catalog is not the boundary; Three checks, three owners).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why the boundary decides", "The invisible boundary, and the example corrected");
  tag(s, "Why");
  rows(s, "Hidden", "WHY THE GAP STAYS INVISIBLE", [
    ["Shared surfaces", "Intune in GCC is the commercial instance"],
    ["Scattered exclusions", "One sentence per feature page; no list"],
    ["Moving targets", "Adoption Score categories retired for all, 2026"],
    ["Silent absence", "A missing signal looks like a quiet day"],
  ], 1.92, 0.78, 0.66);
  const fix = [
    ["Admin center network connectivity, Locations", "Confirmed unavailable in GCC"],
    ["Endpoint analytics", "Not a documented GCC gap"],
    ["Device Health Attestation", "A GCC High and DoD gap"],
    ["Expedited updates", "A GCC High and DoD gap"],
    ["Azure Arc server monitoring", "An Azure service, in FedRAMP High scope"],
  ];
  s.addTable([head(["Feature in the old example", "Verdict for GCC"]), ...fix.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: i === 0, color: i === 0 ? HEX.red : HEX.ink } }])],
    tableOpts([2.75, 2.9], { x: 7.1, y: 1.55, fontSize: 12.5, rowH: [0.42, 0.62, 0.52, 0.52, 0.52, 0.62] }));
  callout(s, "Both ways", 5.3, 1.2, "FaScaleBalanced", HEX.amber, "Wrong in both directions: ",
    "an invisible boundary hides features that are missing; an unverified boundary story hides features that are present, and builds compensations nobody needs.");
  sources(s, "Sources: Microsoft Learn — Intune for US Government service description, Adoption Score, network connectivity, endpoint analytics, Advanced Analytics, Azure FedRAMP compliance scope. Book 10, Chapter 02.");
  narrate(s,
`Chapter 02 explains why the gap stays invisible until a design depends on it. Surfaces are shared: Intune in GCC is the same instance as commercial Intune. Exclusions are scattered, one sentence per feature page. Features move: Microsoft retired Adoption Score's technology-experience categories for every tenant in early 2026. And absence doesn't announce itself. A detection whose input never arrives looks exactly like a quiet day.

The book then corrects a widely repeated example. Five features were said to be silently missing from GCC. Checked against Microsoft's documentation, one is: the Locations view of network connectivity in the admin center. Device Health Attestation and expedited updates are GCC High and DoD gaps. Endpoint analytics isn't a documented GCC gap. And Azure Arc is an Azure service, in Azure's FedRAMP High scope.

An unverified boundary story sends an agency to build compensations it doesn't need.`,
  "Book 10, Chapter 02 — The Invisible Boundary (Why the boundary is invisible; The worked example, corrected).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why the boundary decides", "Four things change across any boundary");
  tag(s, "Why");
  const dims = [
    ["Telemetry fidelity", "Which signals actually arrive on this side?", "DRIFT-SCHEMA, DRIFT-PROVENANCE", "Shipped"],
    ["Identity authority", "Who does a claim's issuer resolve to here?", "DRIFT-IDENTITY", "Design only"],
    ["Enforcement responsibility", "Platform or agency: who enforces it?", "DRIFT-AUTHZ", "Design only"],
    ["Provenance classification", "Still authoritative, or only derived?", "DRIFT-SEMANTIC", "Partial"],
  ];
  s.addTable([head(["Dimension", "The question", "Drift class", "Detection"]), ...dims.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { fontSize: 11 } }, { text: r[3], options: { bold: true } }])],
    tableOpts([1.85, 2.3, 1.8, 1.05], { y: 1.55, fontSize: 12.5, rowH: [0.42, 0.75, 0.75, 0.75, 0.75] }));
  box(s, "GCC box", 7.85, 1.55, 4.9, 3.5, HEX.tealTint);
  icon(s, "FaCloud", 8.1, 1.72, 0.6, HEX.teal);
  txt(s, "GCC head", "In GCC, from documented facts", { x: 8.85, y: 1.72, w: 3.8, h: 0.6, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "GCC list", bullets([
    "Telemetry: network connectivity, INR and Adoption Score absent",
    "Identity: GCC pairs with Entra ID in commercial Azure",
    "Enforcement: path choice rests on agency SD-WAN data",
    "Provenance: every substitute signal labeled derived",
  ], 13.5), { x: 8.1, y: 2.45, w: 4.5, h: 2.5, paraSpaceAfter: 6 });
  callout(s, "No promise", 5.3, 1.2, "FaFileShield", HEX.red, "No certification promises a signal: ",
    "FedRAMP's 2026 definition of federal customer data excludes analytics and telemetry the provider generates, so whether a signal arrives is the agency's question to model.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — Definitions, Minimum Assessment Scope; Microsoft Learn — cloud feature availability for US Government, network connectivity, informed network routing. Book 10, Chapter 02.");
  narrate(s,
`The book models a boundary as any surface across which four things change. It's the book's own model, not a FedRAMP or Microsoft construct.

Telemetry fidelity asks which signals actually arrive on this side. In GCC, admin-center network connectivity, informed network routing and Adoption Score are documented as unavailable. Identity authority asks who a claim's issuer resolves to: GCC pairs with Entra ID in commercial Azure, GCC High and DoD with Azure Government. Enforcement responsibility asks who must enforce a control: without Microsoft's per-circuit feedback, path selection rests on the agency's own SD-WAN measurements. Provenance classification asks whether a claim is still authoritative, or only derived.

Each dimension raises its own drift class. Detection is shipped for two classes, partial for one and design only for two.

And FedRAMP's definition of federal customer data excludes the analytics and telemetry a provider generates. No certification promises you a signal.`,
  "Book 10, Chapter 02 — The Invisible Boundary (Four things that change across a boundary).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What changes", "FedRAMP 2026: classes, obligations, business days");
  tag(s, "What");
  cards(s, "Rules", [
    ["FaLandmark", "Certified, Classes A to D", HEX.navy, HEX.navyTint, ["Class C includes the Moderate baseline", "Class D includes the High baseline", "Agencies authorize at the security category they deem appropriate"]],
    ["FaFileShield", "No provider boundary", HEX.teal, HEX.tealTint, ["\"Authorization boundary\": zero times in ruleset 2026.10.13.01", "Families tagged boundary: MAS, CMU, VDR, CDS", "Security category may vary by resource"]],
    ["FaArrowsRotate", "Notice, in business days", HEX.amber, HEX.amberTint, ["Routine recurring: no notice", "Adaptive: within 10 after finishing", "Transformative: 30 and 10 before, 5 after", "Class change: a new assessment"]],
  ], 13);
  callout(s, "Vocabularies", 5.3, 1.2, "FaBook", HEX.navy, "Two vocabularies for years: ",
    "adoption is mandatory January 1, 2027; new Rev5 requests stop June 11, 2027; existing Rev5 certifications end \"likely no later than 2029.\" Rev5 packages describe boundaries; 20x packages describe scope.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — ruleset 2026.10.13.01, Minimum Assessment Scope, Significant Change Notification, Important Dates; Notices NTC-0004 and NTC-0013. Book 10, Chapter 03.");
  narrate(s,
`What changed at FedRAMP? Three things.

First, services are now certified, in Classes A to D. FedRAMP's February 2026 notice says Class C includes the current Moderate baseline and Class D the current High, and that agencies may authorize at any security category they deem appropriate.

Second, the rules have no provider authorization boundary. In the machine-readable ruleset, version 2026.10.13.01, that phrase occurs zero times. The word boundary appears eight times, four of them as a tag on rule families: minimum assessment scope, cryptographic module use, vulnerability detection and response, and certification data sharing. Security category may vary by resource.

Third, change is notified, not re-approved, and the deadlines are in business days. Routine recurring changes need no notice. Adaptive changes, within 10 business days after finishing. Transformative changes, initial plans 30 business days before.

Adoption is mandatory on January 1, 2027, and new Rev5 requests stop on June 11, 2027.`,
  "Book 10, Chapter 03 — What Changed at FedRAMP (Certification replaces authorization; The rules have no provider authorization boundary; Change control replaces re-authorization; Rev5 and the 2026 rules side by side).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What changes", "GCC is the worldwide service, minus a list");
  tag(s, "What");
  const feats = [
    ["Admin center network connectivity", "No", "No", "No"],
    ["Adoption Score", "No", "No", "No"],
    ["Office 365 CDN for SharePoint", "No", "No", "No"],
    ["Informed network routing", "No", "No", "No"],
    ["Windows release health", "Yes", "No", "No"],
    ["Excel Office Scripts", "Yes", "No", "No"],
  ];
  const yn = (v) => ({ text: v, options: { bold: true, color: v === "No" ? HEX.red : HEX.teal, align: "center" } });
  s.addTable([head(["Feature", "GCC", "GCC High", "DoD"]), ...feats.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, yn(r[1]), yn(r[2]), yn(r[3])])],
    tableOpts([3.5, 1.0, 1.2, 1.0], { y: 1.55, fontSize: 13, rowH: [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  box(s, "Packages box", 7.6, 1.55, 5.15, 3.5, HEX.navyTint);
  icon(s, "FaLandmark", 7.85, 1.72, 0.6, HEX.navy);
  txt(s, "Packages head", "Marketplace, October 21, 2026", { x: 8.6, y: 1.72, w: 4.05, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Packages list", bullets([
    "MSO365MT (GCC): Certified, Class C (Moderate), 100 authorizations",
    "MSO365MTA, the same name: In Process, Class D, 0 authorizations",
    "FR1824057433 (GCC High): Certified, Class D, 5 authorizations",
    "How the two GCC packages relate: not stated",
  ], 13.5), { x: 7.85, y: 2.45, w: 4.75, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Axes", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "A higher class doesn't restore a feature: ",
    "network connectivity is missing in GCC High too, and GCC High is already Class D. It's the largest documented loss: per-location assessments and network provider attribution.");
  sources(s, "Sources: FedRAMP Marketplace, products.json (October 21, 2026); Microsoft Learn — network connectivity and assessment, Adoption Score, Office 365 CDN, informed network routing, Windows release health, Office in Government plans. Book 10, Chapter 04.");
  narrate(s,
`Chapter 04 reads GCC from Microsoft's own documents. It's the worldwide service with a published list of exclusions, and the list isn't a ladder. Network connectivity in the admin center, Adoption Score, the Office 365 CDN and informed network routing are missing in GCC, GCC High and DoD alike. Windows release health and Excel Office Scripts reach GCC and stop there.

The largest documented loss is the network connectivity layer: a daily assessment from 0 to 100 for each location, with 80 as the healthy baseline, and performance attributed to named network providers. A GCC agency funds its own measurement instead.

On the Marketplace, read October 21, 2026, the GCC package, MSO365MT, is FedRAMP Certified at Class C, Moderate, with 100 authorizations. A second package with the identical name is In Process at Class D. But GCC High is already Class D, and still lacks network connectivity. A higher class doesn't restore an excluded feature.`,
  "Book 10, Chapter 04 — GCC, GCC High and the Commercial Feature Gap (The gaps form a list, not a ladder; What agencies verifiably lose; Microsoft is pursuing High for GCC; Impact level and feature availability are different axes).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What changes", "The landing zone turns the boundary into policy");
  tag(s, "What");
  rows(s, "MG", "THE BASELINE MANAGEMENT GROUP HIERARCHY", [
    ["Intermediate root", "Agency-wide boundary policy assigned here"],
    ["Platform", "Security, Management, Connectivity, Identity"],
    ["Landing zones", "Corp, Online and Local workloads"],
    ["Sandbox", "Looser policy; default for new subscriptions"],
    ["Decommissioned", "Cancelled; deleted after 30 to 60 days"],
  ], 1.92, 0.62, 0.54);
  sideBox(s, "Decisions", "FaSitemap", HEX.teal, HEX.tealTint, "FIVE BOUNDARY DECISIONS", "Each one gets a mechanism", [
    "Cloud: Azure or Azure Government, both Class D",
    "Regions: Allowed locations, Deny at the intermediate root",
    "Services: allowed resource types, against audit scope",
    "Settings: FedRAMP initiative, \"a partial view\"",
    "Exceptions: an exemption with an expiry date",
  ], 13.5);
  callout(s, "Gov", 5.35, 1.15, "FaTriangleExclamation", HEX.amber, "Azure Government needs hand work: ",
    "Microsoft's portal, Bicep and Terraform accelerators are supported only in public Azure, so the platform team adapts the code. Roll every policy out in audit mode before Deny.");
  sources(s, "Sources: Microsoft Learn — Azure landing zones, management groups, deploy Azure landing zones, Azure Policy built-ins, exemptions, FedRAMP Moderate initiative, FedRAMP audit scope; FedRAMP Marketplace. Book 10, Chapter 05.");
  narrate(s,
`The landing zone is where the boundary stops being a diagram. Each workload landing zone is a subscription placed in a management group that carries its policy.

The baseline hierarchy puts an intermediate root under the tenant root, and that's where boundary policy goes. Platform groups hold security, management, connectivity and identity. Landing zone groups hold corporate, online and local workloads. Make Sandbox the default, so no new subscription lands outside the boundary policy.

Each boundary decision gets a mechanism: the cloud choice; Allowed locations with Deny; allowed resource types, checked against Microsoft's audit-scope list; the FedRAMP regulatory compliance initiative, which Microsoft calls only a partial view; and exemptions, Mitigated or Waiver, with an expiry date. Roll each policy out in audit mode first.

One catch: Microsoft's accelerators are supported only in public Azure. In Azure Government, the platform team adapts the code by hand.`,
  "Book 10, Chapter 05 — The Landing Zone (What a landing zone is; The management group hierarchy; Where each boundary decision lands; Enforcing without breaking things).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What changes", "The address plan is the join key the evidence needs");
  tag(s, "What");
  rows(s, "IPAM", "THE ENTERPRISE IPAM STAYS THE AUTHORITY", [
    ["1  Reserve", "The Azure block, in the enterprise IPAM first"],
    ["2  Mirror", "Into Virtual Network Manager pools; static CIDRs"],
    ["3  Enforce", "Azure Policy denies a VNet without a pool"],
    ["4  Reconcile", "Discovery compares; a mismatch is a finding"],
  ], 1.92, 0.78, 0.66);
  sideBox(s, "Inputs", "FaHashtag", HEX.navy, HEX.navyTint, "INPUTS AND CAVEATS", "Check the boundary of IPAM too", [
    "BOD 23-01: discovery every 7 days, the entire IPv4 space",
    "Virtual Network Manager: not named in FedRAMP audit scope",
    "No separate GCC endpoint list: GCC uses Worldwide",
    "Endpoints change monthly, with 30 days' notice",
  ], 13.5);
  callout(s, "Modules", 5.35, 1.15, "FaCubes", HEX.teal, "Five modules, in dependency order: ",
    "platform, address plan, then naming and network, then the enforcement edge, through a change-controlled pipeline. Each writes its deployed state as evidence.");
  sources(s, "Sources: NIST SP 800-53 CM-8; CISA BOD 23-01; Microsoft Learn — Virtual Network Manager IPAM, overlapping address spaces, FedRAMP audit scope, Microsoft 365 IP Address and URL web service. Book 10, Chapter 06.");
  narrate(s,
`Chapter 06 makes the address plan the join key. A scan finds what answered; the IPAM records what was allocated, so every inventory reconciles against it. BOD 23-01 already asks for automated discovery every 7 days across the entire IPv4 space the agency uses.

In Azure the enterprise IPAM stays the authority. Reserve the block there first. Mirror it into Virtual Network Manager pools, entering ranges used elsewhere as static CIDRs. Then assign an Azure Policy that denies any virtual network without a pool allocation, and reconcile by discovery. Virtual Network Manager isn't named in Microsoft's FedRAMP audit-scope tables, so record it as a dependency until coverage is confirmed.

Build it as five layered modules, each writing its state as evidence. And treat outside inputs as code. There's no separate GCC endpoint list: a GCC tenant uses the Worldwide instance, updated monthly, with 30 days' notice of new endpoints.`,
  "Book 10, Chapter 06 — IPAM and Network as Code (The address plan is the join key; Azure: mirror the authority, enforce the pool; A boundary check on the IPAM service itself; Network as code; Inputs that change underneath the code).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What changes", "The front door: no landing zone without a request");
  tag(s, "What");
  const steps = [["Request", "Typed variables"], ["Approve", "Not the requester"], ["Plan", "Reviewed first"], ["Apply", "Reviewed source"], ["Reconcile", "IPAM and CMDB"], ["Close", "Gate verdict"]];
  steps.forEach((f, i) => {
    const x = 0.6 + i * 2.045;
    box(s, `Step ${i + 1}`, x, 1.5, 1.92, 1.35, i === 4 ? HEX.tealTint : (i === 1 || i === 2 ? HEX.amberTint : HEX.grey));
    txt(s, `Step ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 15, breakLine: true } },
      { text: f[1], options: { fontSize: 12.5 } },
    ], { x: x + 0.12, y: 1.55, w: 1.7, h: 1.25, valign: "middle" });
  });
  const panels = [
    ["FaHashtag", "Step 5 carries the most weight", HEX.teal, HEX.tealTint, ["Write the allocation back to the enterprise IPAM", "Fail the run if the two disagree", "An unreconciled block is shadow inventory"]],
    ["FaLock", "The pipeline is in the boundary", HEX.red, HEX.redTint, ["Terraform state is sensitive data", "October 21, 2026: no HCP Terraform listing", "GitHub Enterprise Cloud Class B; GitLab Dedicated Class C"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
    icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.75, w: 5.6, h: 1.27, paraSpaceAfter: 2 });
  });
  callout(s, "SoD", 5.25, 1.25, "FaUserShield", HEX.navy, "Separation of duties is AC-5: ",
    "the requester can't approve, and the approver sees the plan that will run. In HashiCorp's ServiceNow catalog 2.9, a rejected plan is discarded and nothing changes.");
  sources(s, "Sources: NIST SP 800-53 CM-3, CM-3(2), AC-5, CM-5, CM-8(1); Microsoft Learn — subscription vending; HashiCorp — ServiceNow Catalog for Terraform, sensitive data; FedRAMP Marketplace. Book 10, Chapter 07.");
  narrate(s,
`Code anyone can apply from a laptop isn't change control. Chapter 07 adds the front door: the governed request into the landing zone, which Microsoft calls subscription vending.

The loop has six steps: request, approve, plan, apply, reconcile and close. The requester can't approve their own request, which is AC-5, separation of duties. The approver reviews the actual plan before anything changes. And step 5 carries the most weight: the pipeline writes the address allocation back to the enterprise IPAM and fails the run if the two disagree, because an unreconciled block is shadow inventory the moment it exists.

The pipeline is inside the boundary question too. Terraform state is sensitive data. On October 21, 2026, the Marketplace had no listing for HCP Terraform; GitHub Enterprise Cloud was listed at Class B, and GitLab Dedicated for Government at Class C. The default is a self-hosted runner and state inside the agency's boundary.`,
  "Book 10, Chapter 07 — The Landing Zone Front Door (Microsoft's model: subscription vending; The provisioning loop; The pipeline is inside the boundary too).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who decides, who keeps the record, who does the work");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Authorizing official", "The boundary; every exception; reauthorization"], ["Sponsor and CIO", "Which clouds, funding and sequence"], ["CISO and ISSO", "Control requirements; provider notices"]]],
    ["FaClipboardCheck", "Keep the record", HEX.teal, HEX.tealTint, [["System owner", "Boundary record, package, placement"], ["Acquisition and CO", "The contract and the GCC SKU"], ["FedRAMP", "Consulted; receives the ATO letter"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Platform team", "Hierarchy, policy, vending, probe"], ["Workload owners", "Feature dependencies; data class"], ["Security operations", "Drift findings; change notices"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THREE DECISIONS THAT LOOK LIKE ENGINEERING", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Placement", "the system owner decides; an unrecorded subscription makes an authorized system unauthorized", HEX.teal],
    ["Risk acceptance", "the authorizing official only; it can't be delegated, and the role is for government personnel", HEX.navy],
    ["The contract", "the contracting officer; customers must buy a GCC SKU to be covered by the GCC authorization", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 SA-4; FedRAMP Consolidated Rules for 2026 — Agency Use, agency responsibilities; Microsoft Learn — shared responsibility; FAR 1.602-1; FedRAMP Marketplace. Book 10, Chapter 08.");
  narrate(s,
`Who owns the boundary? The rule is one decider per row.

The authorizing official determines the boundary, signs every documented exception and decides whether a change requires reauthorization. Under SP 800-37, explicit risk acceptance can't be delegated, and for federal agencies the role is assigned to government personnel only. The system owner is the boundary owner: keeper of the boundary record and the package, and the decider on placing a new workload, because vending an unrecorded subscription is the cheapest way to turn an authorized system into an unauthorized one. The CISO sets control requirements, and the ISSO reads provider change notices against the record.

The platform team builds the hierarchy, policy, vending and probe, but doesn't decide whether a gap is acceptable. And the contract is a boundary decision: the GCC listing says customers must buy a GCC SKU to be covered. Only a contracting officer changes what the agency bought.`,
  "Book 10, Chapter 08 — Who Owns the Boundary (Where the roles come from; The roles; The responsibility matrix).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "Inventory, probe, then compensate or except");
  tag(s, "How");
  rows(s, "Play", "THE PLAYBOOK, ONE ROW AT A TIME", [
    ["Register", "One feature per row, with the provider's statement"],
    ["Probe", "Test the output, not the switch, on a schedule"],
    ["Equivalent", "Compensate inside the boundary; say it's derived"],
    ["Exception", "A provider path, or a dated AO risk acceptance"],
    ["Alternative", "A different service or path (Chapter 10)"],
  ], 1.92, 0.62, 0.54);
  sideBox(s, "Scope", "FaScaleBalanced", HEX.amber, HEX.amberTint, "WHAT THE 2026 RULES ALLOW", "Four scope arguments, four limits", [
    "Category varies by resource: it binds the provider",
    "Agents are outside FedRAMP: still in your ATO",
    "Routine changes go unnotified: you still review",
    "Asking beyond FedRAMP needs the agency head",
  ], 14);
  callout(s, "Badge", 5.35, 1.15, "FaListCheck", HEX.red, "Buy the capability, not the badge: ",
    "ExpressRoute for Microsoft 365 needs a regulation that mandates it, and the book found no FedRAMP or FISMA rule that does. The Network Provider Program is closed to new providers.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, SP 800-53 CA-5; FedRAMP Consolidated Rules for 2026 — MAS, SCN, Agency Use; Microsoft Learn — ExpressRoute for Microsoft 365, network connectivity test tool, Network Provider Program. Book 10, Chapter 09.");
  narrate(s,
`How do you handle a capability that's outside? NIST SP 800-37 names four options: compensating controls, accepting greater risk, a more trustworthy provider, or not obtaining the service.

Build a register, one feature per row, each with the provider's own statement. Only vendor-confirmed rows support a claim to a provider or an assessor. Probe what actually works in your tenant, on a schedule, testing for the output rather than the switch. Where a gap is real, build an in-boundary equivalent and say it's derived. Or take an exception. ExpressRoute for Microsoft 365 is authorized only when a regulatory requirement mandates direct connectivity, and the book found no FedRAMP rule or FISMA provision that does. Otherwise the authorizing official signs a dated risk acceptance.

The 2026 rules add four scope arguments, each with a limit. And buy the capability, not the badge: Microsoft's Network Provider Program is closed to new providers.`,
  "Book 10, Chapter 09 — In-Boundary Equivalents and Documented Exceptions.");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Change the suite, keep the identity plane");
  tag(s, "How");
  const svc = [
    ["Microsoft 365 GCC (MSO365MT)", "Class C (Moderate)"],
    ["Google Workspace", "Class D (High)"],
    ["Gemini for Government", "Class B (Low)"],
    ["Zoom for Government", "Class C (Moderate)"],
    ["Webex for Government", "Class C (Moderate)"],
    ["GovSlack", "Class D (High)"],
    ["Box Enterprise Cloud", "Class D (High)"],
  ];
  s.addTable([head(["FedRAMP Certified listing", "Class (impact level)"]), ...svc.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([3.9, 2.5], { y: 1.55, fontSize: 12.5, rowH: [0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42] }));
  sideBox(s, "Identity", "FaIdCard", HEX.teal, HEX.tealTint, "KEEP THE IDENTITY PLANE", "Entra ID stays the source", [
    "Provision users and groups into the suite",
    "Federate sign-in; Conditional Access applies there",
    "Google super administrators sign in outside it",
    "The suite's directory is derived: report drift",
  ], 14);
  callout(s, "Record", 5.35, 1.15, "FaPeopleArrows", HEX.navy, "The public record runs both ways: ",
    "a department's five-year deal of up to $89 million moved 50,000-plus staff to Google Workspace; a military department ended about 150,000 licenses at about 16% use.");
  sources(s, "Sources: FedRAMP Marketplace (October 21, 2026); Microsoft Learn — Google Workspace provisioning and SSO, Conditional Access targets; Google Workspace Admin Help; GSA (April 2025); Nextgov/FCW; Stars and Stripes. Book 10, Chapter 10.");
  narrate(s,
`The third answer is an alternative path: a different certified service for the workload, with the identity plane left where it is.

Read the Marketplace, not the announcement. Google Workspace is listed at Class D, while Gemini for Government is a separate listing at Class B. Which AI features sit inside which certification is a question for the package.

The public record shows both outcomes. In September 2025 a cabinet-level department awarded a five-year agreement worth up to 89 million dollars to move more than 50,000 employees to Google Workspace, under a GSA agreement with a temporary 71 percent price reduction. A military department went the other way, ending about 150,000 Google email licenses after an audit found about 16 percent in use.

Keep Entra ID as the source: provision users, federate sign-in, apply Conditional Access there. Then close the gaps: Google super administrators sign in outside it, and Google's directory is derived, so report drift.`,
  "Book 10, Chapter 10 — Alternative Collaboration Paths.");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "Write the boundary once; cite it everywhere");
  tag(s, "How");
  const arts = [
    ["SSP: the boundary", "Components, environment, connections", "P-11, PL-2"],
    ["SSP: external services", "Package, class, SKU, oversight roles", "SA-9"],
    ["SSP: exchanges", "Each crossing, with an agreement", "CA-3"],
    ["POA&M", "Gaps the agency will close; not provider findings", "CA-5"],
    ["Component definition", "Each in-boundary equivalent", "OSCAL"],
    ["Continuous monitoring", "Probe reruns, drift, provider notices", "CA-7"],
  ];
  s.addTable([head(["Package artifact", "What the boundary record adds", "Basis"]), ...arts.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: true } }])],
    tableOpts([2.3, 3.35, 1.25], { y: 1.55, fontSize: 12.5, rowH: [0.42, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52] }));
  box(s, "Package box", 7.75, 1.55, 5.0, 3.5, HEX.navyTint);
  icon(s, "FaBook", 8.0, 1.72, 0.6, HEX.navy);
  txt(s, "Package head", "Know whose package you read", { x: 8.75, y: 1.72, w: 3.9, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Package list", bullets([
    "GCC leverages Azure Government as its IaaS and PaaS",
    "A GCC SKU puts the tenant in scope",
    "Don't copy provider controls into your SSP",
    "The listing's trust-center and guide fields: empty",
  ], 13.5), { x: 8.0, y: 2.45, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Narrative", 5.3, 1.2, "FaFileShield", HEX.amber, "A compensating narrative, in four sentences: ",
    "what the control needs; what's unavailable, with its citation; what runs instead, marked derived; and where the remaining gap is recorded.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 PL-2, SA-9, CA-3, CA-5, CA-7; FedRAMP Consolidated Rules for 2026 — Rev5 Certification Packages, Agency Use; NIST OSCAL; FedRAMP Marketplace. Book 10, Chapter 11.");
  narrate(s,
`Finally, evidence the boundary in the agency's own package. The agency never authorizes a cloud service; it authorizes its system that uses one, and its plan should only contain what the agency is responsible for. FedRAMP's Rev5 guidance is blunt: don't copy and paste provider controls into the agency plan.

Write the boundary down once, as a boundary record the system owner keeps, and cite it everywhere: the system description under PL-2, each external service under SA-9 with its Marketplace package, class and SKU, each crossing under CA-3, the gaps the agency will close on the POA&M, and each equivalent in an OSCAL component definition.

Know whose package you're reading. The GCC listing says the service leverages Azure Government as its infrastructure, so the inheritance chain runs through two provider packages.

A compensating narrative takes four sentences: what the control needs, what's unavailable with its citation, what runs instead marked derived, and where the remaining gap is recorded.`,
  "Book 10, Chapter 11 — Evidencing the Boundary in the Authorization Package.");
}

// ------------------------------------------------------------------ Close 1
{
  const s = D.content("How to do it", "What to ask a cloud provider for");
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
    const x = 0.6 + col * 3.075, y = 1.5 + row * 1.8;
    box(s, `Ask ${a[0]}`, x, y, 2.95, 1.65, row ? HEX.navyTint : HEX.grey);
    txt(s, `Ask ${a[0]} text`, [
      { text: a[0], options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: a[1], options: { bold: true, color: HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: a[2], options: { fontSize: 12.5 } },
    ], { x: x + 0.15, y: y + 0.08, w: 2.7, h: 1.5, valign: "middle", paraSpaceAfter: 2 });
  });
  callout(s, "Ask", 5.3, 1.2, "FaListCheck", HEX.teal, "Name it, cite it, ask for data: ",
    "on October 21, 2026, 110 of 781 Marketplace listings had a trust-center entry, and none of the three Microsoft 365 government packages did. A documented no is evidence too.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 — CDS, SCN, CMU, MAS; Microsoft Learn — assessing network connectivity (ExpressRoute), network provider attribution; FedRAMP Marketplace (October 21, 2026). Book 10, Appendix A.");
  narrate(s,
`Appendix A turns all of this into requests. Three habits make a request hard to deflect: name one item, cite the basis with a link, and ask for data, not documents.

Eight requests follow. Publish the per-feature exclusion list as data. Name the exception path for each feature. Restore the network observability layer in GCC, or publish the specific obstacle. Explain the two same-named GCC packages, and what Class D would and wouldn't change. List the agents and clients that sit outside the certified offering. Provide a FedRAMP-compatible trust center with programmatic access: on October 21, 2026, only 110 of 781 Marketplace listings had a trust-center entry, and none of the three Microsoft 365 government packages did. Deliver change notices as a JSON feed. And document the cryptographic modules for each service.

Five of the eight rest on obligations the rules already place on providers. A documented no is evidence too.`,
  "Book 10, Appendix A — What to Ask a Cloud Provider For.");
}

// ------------------------------------------------------------------ Close 2
{
  const s = D.content("How to do it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaTableList", "Build the register on cited rows", "One row per feature and environment; relabel anything uncited", HEX.navy, HEX.navyTint],
    ["FaUserCheck", "Name the boundary owner", "The AO decides the boundary; the system owner gates every subscription", HEX.teal, HEX.tealTint],
    ["FaSitemap", "Enforce it in the landing zone", "Policy at the intermediate root, audit before deny, the front door", HEX.amber, HEX.amberTint],
    ["FaFileShield", "Evidence every response", "Equivalent, exception or alternative path, in the agency's package", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Decision ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Decision ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Next step, no award needed: ",
    "before the next architecture review, list every cloud feature your designs depend on, with its Marketplace package, its availability in your environment and the page that says so. Then put Appendix A's requests to your provider.");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026; FedRAMP Marketplace; NIST SP 800-37 Rev. 2; Microsoft Learn — Azure Policy, subscription vending. Book 10, Chapters 01, 05, 07, 08, 09 and 11; Appendix A.");
  narrate(s,
`So, four decisions.

Build the feature register on cited rows only, one row per feature and environment, and drop or relabel anything without a vendor page.

Name the boundary owner: the authorizing official decides the boundary, and the system owner keeps the record and gates every new subscription.

Enforce the boundary in the landing zone: policy at the intermediate root, audit before deny, and the governed front door.

And evidence every response, whether equivalent, exception or alternative path, in the agency's own package.

The next step needs no award: before the next architecture review, list every cloud feature your designs depend on, with its Marketplace package, its availability in your environment and the page that says so. Then put Appendix A's requests to your provider.

The license says what you bought; the boundary says what you may use. Book 10 has the detail, every claim footnoted. Thank you.`,
  "Book 10, Chapters 01, 05, 06, 07, 08, 09 and 11; Appendix A.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "FedRAMP Consolidated Rules for 2026: Using a FedRAMP Certified Cloud Service; Definitions; Minimum Assessment Scope; Significant Change Notification; Certification Data Sharing; Cryptographic Module Use; Agency Use; Collaborative Continuous Monitoring; Rev5 packages; Important Dates; ruleset 2026.10.13.01.",
    "FedRAMP Notices NTC-0004 (February 25, 2026) and NTC-0013 (June 16, 2026).  ·  FedRAMP Marketplace dataset, products.json (read October 21, 2026).",
    "NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; OSCAL component definition model.  ·  CISA BOD 23-01.  ·  FAR 1.602-1.",
    "Microsoft Learn, Microsoft 365: network connectivity, assessment, insights and provider attribution; informed network routing; Adoption Score; Office 365 CDN; IP Address and URL web service; ExpressRoute for Microsoft 365; Office and Intune government service descriptions.",
    "Microsoft Learn, Azure: cloud feature availability for US Government; FedRAMP audit scope; landing zones, management groups, subscription vending; Azure Policy; Virtual Network Manager IPAM; shared responsibility.",
    "AWS: Organizations SCPs; Control Tower in GovCloud (US); Landing Zone Accelerator.  ·  HashiCorp: ServiceNow Catalog for Terraform; sensitive data.  ·  ServiceNow Cloud Provisioning and Governance.",
    "Google Cloud FedRAMP scope; Google Workspace Admin Help; Microsoft Learn — Google Workspace provisioning and SSO.  ·  GSA (April 10 and August 21, 2025).  ·  Nextgov/FCW.  ·  Stars and Stripes.",
    "Full footnotes with links and access dates: Book 10, every chapter (whalermike.github.io/modernization-workbook/docs/books/b10-cloud-boundary/).",
  ];
  txt(s, "Source list", bullets(src, 12.5), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
