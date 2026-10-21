// Book 11 — Zero Trust & Assessment: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: CISO, authorizing officials, CIO, Zero Trust implementation lead. Decision-centered:
// every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build:  node presentations/b11-zero-trust-executive/build.js presentations/b11-zero-trust-executive/B11_Zero_Trust_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b11-zero-trust/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 11", title: "Zero Trust & Assessment",
  footer: "Federal Modernization Workbook  ·  Book 11 Zero Trust & Assessment  ·  Executive briefing" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, sources } = D;
const OUT = process.argv[2] || "B11_Zero_Trust_Executive.pptx";

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
  const y = 5.3, h = 1.2;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.25, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => txt(s, name, [
    { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
    { text, options: { fontSize: 14.5, color: HEX.ink } },
  ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  col("Decision", 1.75, 6.55, "DECISION", what, HEX.amber);
  col("Owner", 8.5, 2.1, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "WHEN", when, HEX.navy);
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
const rows = (s, prefix, label, list, top, step, h) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: 14, valign: "middle" });
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

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why the whole agency", "Who Decides Zero Trust for the Whole Agency?", "Book 11 — Zero Trust & Assessment  ·  Executive briefing");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for the CISO, authorizing officials, the CIO and the Zero Trust lead", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 8.5, h: 0.85, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 11 of the Federal Modernization Workbook, Zero Trust and Assessment. It runs about thirty minutes, and it's built for the people who make the calls: the CISO, the authorizing officials, the CIO, and the Zero Trust implementation lead.

The book's argument fits in three sentences. Zero Trust maturity is a property of the whole agency, not of any product or tenant. The federal documents set specific actions and configurations, but none of them defines a Zero Trust score or requires a maturity stage. And the assessment tools produce evidence for named people to act on, not verdicts to report.

I'll take four questions in order: why Zero Trust belongs to the whole agency, what the mandates and the tools actually require, who owns the posture, and how to turn findings into a program the authorizing official can see. Every decision slide names the decision, its owner, and when it's needed.`,
  "Book 11, index; Chapter 01 — Zero Trust Is a Whole-Agency Property; Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require; Chapter 10 — Evidence, Not Verdicts.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why the whole agency", "Three reports stapled together are not one score");
  tag(s, "Why");
  rows(s, "Calendar", "THE USUAL ASSESSMENT CALENDAR", [
    ["Network review", "Keyed by address"],
    ["Per-cloud scans", "Keyed by each provider's resource tags"],
    ["Hypervisor checklist", "Keyed by the management plane's names"],
    ["Cover page", "Three partial assessments, one title"],
  ], 1.88, 0.82, 0.7);
  sideBox(s, "Guidance", "FaBook", HEX.navy, HEX.navyTint, "Written for the enterprise", [
    "EO 14028: “throughout all aspects of the infrastructure”",
    "M-22-09: enterprise-managed identities; a complete device inventory",
    "ZTMM v2.0: agency-wide buy-in for one architecture",
    "SP 800-207: no implicit trust from location or ownership",
  ]);
  decision(s, "Reconcile the network, every cloud and the virtualization estate to one authoritative asset and identity record before scoring any of them",
    "Owner of the naming and identity plane", "This quarter; before any estate is scored");
  sources(s, "Sources: Executive Order 14028; OMB M-22-09; CISA Zero Trust Maturity Model v2.0; NIST SP 800-207. Book 11, Chapters 01, 06 and 10.");
  narrate(s,
`Start with the usual assessment calendar. The network team reviews the boundary, keyed by address. The cloud team runs each provider's posture scan, keyed by resource tags. The virtualization team works a hypervisor checklist, keyed by whatever the management plane calls a machine. At year end someone puts the three reports behind one cover page and calls the result the agency's Zero Trust maturity. It's three partial assessments with one title.

The failure is architectural, not organizational. A policy decision evaluates a subject, a device and a resource, and it can only do that consistently if every platform describes them the same way. A database server that runs as a virtual machine, sits on an agency subnet and backs up to a cloud bucket can appear as three unrelated objects, scored by three tools. A total across them counts objects, not architecture.

The federal guidance describes the enterprise, not a tenant. Executive Order 14028 defines zero trust architecture as working throughout all aspects of the infrastructure. M-22-09 asks for enterprise-managed identities and a complete inventory of every device the government operates. CISA's maturity model asks for agency-wide buy-in for a common architecture. And NIST SP 800-207 grants no implicit trust from network location or ownership.

A scan can confirm that an architecture is unified; it can't make it unified.

So the first decision: reconcile the network, every cloud and the virtualization estate to one authoritative asset and identity record before scoring any of them. The book gives that to the owner of the naming and identity plane, as a step for this quarter. Until it's done, report any whole-agency figure as partial assessments, not one score.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property (Three partial assessments are not one score; What the federal guidance actually describes); Chapter 03 (EO 14028 definition); Chapter 06 — Beyond Microsoft 365 (What a whole-agency score requires); Chapter 10 (What an agency can do this quarter, item 7).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why the whole agency", "The worst failures sat beneath any one tool");
  tag(s, "Why");
  cards(s, "Incidents", [
    ["FaKey", "A forged token, 2023", HEX.red, HEX.redTint, ["Tokens forged with a provider's consumer signing key", "22 enterprise organizations, 503 personal accounts", "Access for at least six weeks", "Caught by a department's own log alert"]],
    ["FaServer", "Beneath the guest", HEX.amber, HEX.amberTint, ["ESXiArgs, February 2023: over 3,800 ESXi servers", "CVE-2024-37085: “ESX Admins” trusted by name", "Many security products barely see the hypervisor"]],
    ["FaSitemap", "The fix becomes a target", HEX.navy, HEX.navyTint, ["One plane maps the whole attack surface", "NIST: policy components are “the key components of the entire enterprise”", "So it is defended as Tier 0"]],
  ]);
  decision(s, "Govern the unified naming and identity plane as a Tier 0 asset: eligible, time-boxed administration and its own monitored telemetry",
    "Identity engineering and the DNS/DDI team", "From the day the plane exists");
  sources(s, "Sources: Cyber Safety Review Board (2024); CISA and FBI AA23-039A; Microsoft Threat Intelligence, CVE-2024-37085; NIST SP 800-207. Book 11, Chapters 01, 06, 07.");
  narrate(s,
`Two documented incidents show why this is a security property and not a reporting preference.

In May and June 2023, an actor used a Microsoft consumer signing key to forge authentication tokens and read Exchange Online mail. The federal Cyber Safety Review Board counted 22 enterprise organizations and 503 related personal accounts, with access to some mailboxes for at least six weeks, and called the intrusion preventable. The tokens were valid to every system that checked them. What caught it was a custom alert one federal department had built on mailbox logs it paid for. The agency's own evidence found what the provider's platform didn't.

The second sits beneath the guest. In February 2023, the ESXiArgs campaign compromised more than 3,800 VMware ESXi servers by encrypting the configuration files of the virtual machines on each host. In 2024, CVE-2024-37085 gave full hypervisor control to members of a directory group named ESX Admins, matched by name rather than by security identifier. Microsoft noted that many security products have limited visibility into the hypervisor at all.

Both cases make the same point from opposite ends. The most consequential failures happened where no single platform's tool was looking.

And there's a consequence for the fix. Once one plane names and identifies everything the agency runs, it's a complete map of the attack surface. NIST already calls the policy engine and administrator the key components of the entire enterprise.

So the decision: govern the unified plane as a Tier 0 asset from the day it exists, with eligible, time-boxed administration, its own monitored telemetry, and a design that assumes it will be attacked directly. Identity engineering and the DNS and DDI team own it.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property (Two incidents that sat beneath any single tool); Chapter 06 — Beyond Microsoft 365 (The unification layer becomes the target); Chapter 07 — Who Owns Zero Trust (The owner of the naming and identity plane).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why the whole agency", "Maturity is decided by governance, which nobody sells");
  tag(s, "Why");
  rows(s, "Principle", "FIVE PRINCIPLES, MOST OF THEM DECISIONS, NOT PURCHASES", [
    ["1  Identity anchors", "Re-evaluated in session; the plane defended"],
    ["2  Privilege apart", "Zero permanently active admin assignments"],
    ["3  Evidence", "Reproducible, machine-readable, regenerable"],
    ["4  Enforcement", "Block, reapply or expire; don't just report"],
    ["5  The boundary", "Each cloud feature gap is a governed finding"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "Stall", "FaTriangleExclamation", HEX.red, HEX.redTint, "Why programs stall", [
    "Five pillars, run through three cross-cutting capabilities",
    "Governance: definition and enforcement, within and across pillars",
    "Traditional: “siloed pillars of policy enforcement”",
    "Drift is found at audit time, months late",
  ]);
  decision(s, "Time-box privileged access, including the assessment accounts, and convert one detective control into a preventive one",
    "CISO, with identity engineering", "This quarter");
  sources(s, "Sources: CISA Zero Trust Maturity Model v2.0; OMB M-22-09; NIST SP 800-207; Microsoft Learn — PIM, emergency access accounts; NIST OSCAL. Book 11, Chapters 02 and 10.");
  narrate(s,
`Chapter 02 explains why programs stall at the maturity model's Initial stage, or low in Advanced. They read CISA's Zero Trust Maturity Model as a five-pillar shopping list: identity, devices, networks, applications and workloads, and data. But the model runs those pillars through three cross-cutting capabilities: visibility and analytics, automation and orchestration, and governance. Governance is the one programs fund least, and the model defines it as the definition and enforcement of policy, within and across pillars.

Traditional reads like a failure list: siloed pillars of policy enforcement, and limited correlation of logs and telemetry. Advanced calls for cross-pillar coordination and policy enforcement integrated across pillars. No single pillar's tool delivers either.

Three failure patterns recur. Pillars are administered, not governed. Evidence is shaped by each tool rather than by the claim it supports, so every assessment starts from scratch. And drift is found at audit time, months after it opened.

The book answers with five principles. Identity is the anchor, but it isn't self-authenticating, so sessions are re-evaluated and the plane is defended. Privileged identity gets controls of its own. Evidence must be reproducible, machine-readable and regenerable. Governance must enforce, not only observe: a policy whose only consequence is next quarter's finding is a report. And the cloud boundary is modeled, with each government-cloud feature gap recorded as a governed finding.

The decision for the CISO, with identity engineering, this quarter: time-box privileged access, including the assessment accounts, and convert one detective control into a preventive one. Microsoft's own guidance is zero permanently active admin assignments, other than emergency accounts that are monitored and tested at least every 90 days.`,
  "Book 11, Chapter 02 — Governance Principles for Zero Trust (The model is not a shopping list; Why programs stall below Advanced; Principles one to five; Governance decisions for this quarter); Chapter 10 (What an agency can do this quarter, item 8).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What the mandates require", "Only one Zero Trust document sets requirements");
  tag(s, "What");
  const docs = [
    ["EO 14028 (May 2021)", "Binding", "Each agency plans a Zero Trust Architecture"],
    ["OMB M-22-09 (Jan 2022)", "Binding; in force", "Specific actions, organized by pillar"],
    ["CISA ZTMM v2.0 (Apr 2023)", "Guidance", "“A general guide,” not strict requirements"],
    ["NIST SP 800-207 (Aug 2020)", "Guidance", "The tenets and architecture the rest assume"],
  ];
  leftTable(s, ["Document", "Authority", "What it does"],
    docs.map((r, i) => [bold(r[0]), bold(r[1], i < 2 ? HEX.red : HEX.teal), { text: r[2] }]),
    [2.35, 1.45, 3.1], [0.42, 0.78, 0.78, 0.78, 0.78]);
  sideBox(s, "Myths", "FaHashtag", HEX.red, HEX.redTint, "Cited, but not in the record", [
    "A required maturity stage, such as Advanced",
    "A federal Zero Trust score, or a tool that certifies maturity",
    "M-22-09 requiring ScubaGear (that is BOD 25-01)",
    "Mandatory inline decryption of all traffic",
  ]);
  decision(s, "Set a maturity target for each pillar, written down as program design rather than as a federal mandate",
    "Zero Trust program lead", "Before the next assessment is scored");
  sources(s, "Sources: EO 14028; OMB M-22-09; CISA ZTMM v2.0 and landing page; NIST SP 800-207; FedRAMP Consolidated Rules for 2026. Book 11, Chapters 03, 07; Appendix A.");
  narrate(s,
`Now, what the mandates actually require. Zero Trust programs are usually argued by citation, and most of the citations fail when you check them against the documents.

Four documents get cited as if they were one. Executive Order 14028, from May 2021, is binding, and required each agency to develop a plan to implement Zero Trust Architecture. OMB M-22-09, from January 2022, is binding and sets specific actions by pillar. CISA's Zero Trust Maturity Model, version 2.0, is guidance. It says it should not be viewed as a strict set of requirements but as a general guide, and CISA's page for it is now marked archived, with no later version. NIST SP 800-207 is guidance too: it supplies the tenets and the architecture the others assume.

The relationship runs one way. M-22-09 borrows the model's pillars to organize its actions; it doesn't adopt the model's stages as requirements.

That leaves several requirements that circulate but don't exist. Neither M-22-09 nor FedRAMP requires a particular maturity stage, such as Advanced. No federal document defines a Zero Trust score, so a tool whose output certifies maturity is citing a requirement that isn't there. M-22-09 doesn't require ScubaGear; that obligation comes from BOD 25-01. And inline decryption of all traffic is neither required nor prohibited.

None of that makes the target vague. It means the target is a choice the agency makes and has to defend.

So the decision: set a maturity target for each pillar, written down as program design, not as a mandate. In the book's responsibility matrix the Zero Trust program lead decides it, consulting the CIO, the CISO and the authorizing official, and it's needed before the next assessment is scored.`,
  "Book 11, Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require (Four documents, four kinds of authority; What the model says about itself; Requirements that are cited but don't exist); Chapter 07 — Who Owns Zero Trust (responsibility matrix: maturity target per pillar); Appendix A.");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What the mandates require", "M-22-09 still binds: read it as an existing obligation");
  tag(s, "What");
  const acts = [
    ["Identity", "Centralized identity; phishing-resistant MFA for staff, contractors and partners"],
    ["Devices", "Reliable inventories through CDM; EDR deployed widely"],
    ["Networks", "Encrypted DNS; HTTPS everywhere; an environmental isolation plan"],
    ["Applications", "Security testing; vulnerability disclosure; one Moderate app on the internet"],
    ["Data", "Initial categorization automation; comprehensive logging"],
  ];
  leftTable(s, ["Pillar", "What M-22-09 requires (summary)"], acts.map((r) => [bold(r[0]), { text: r[1] }]),
    [1.55, 5.35], [0.4, 0.64, 0.64, 0.64, 0.64, 0.64]);
  sideBox(s, "Reading", "FaLandmark", HEX.navy, HEX.navyTint, "Reading it in October 2026", [
    "FY 2024 deadlines passed; OMB hasn't rescinded it",
    "A passed deadline doesn't retire an action",
    "Logging now reads through M-26-14 (May 22, 2026)",
    "Logging Reference Architecture published August 20, 2026",
  ]);
  decision(s, "Cover Zero Trust telemetry, including the assessment hosts and accounts, in the first Agency Logging Plan",
    "CISO", "90 days after August 20, 2026");
  sources(s, "Sources: OMB M-22-09 and memoranda index; OMB M-26-14; CISA Logging Reference Architecture. Book 11, Chapters 03, 07 and 09; Appendix A.");
  narrate(s,
`M-22-09 is the only one of the four that sets dated actions for the program itself, and it isn't limited to the cloud. It also addresses on-premises and hybrid systems.

By pillar, the actions are specific. Identity: centralized identity management, and phishing-resistant multi-factor authentication for staff, contractors and partners, which means agency systems stop supporting SMS and voice codes, one-time codes and push notifications for routine access. Devices: reliable asset inventories through CISA's Continuous Diagnostics and Mitigation program, and endpoint detection and response deployed widely. Networks: encrypted DNS, HTTPS for all web and API traffic, and a plan for environmental isolation, moving away from one broad enterprise network. Applications: dedicated security testing, a public vulnerability disclosure program, and at least one internal FISMA Moderate application made fully operational over the public internet. Data: initial automation of data categorization, and comprehensive logging.

Its fiscal 2024 deadlines have passed. OMB hasn't rescinded it: its memoranda index lists no rescission, and the memo is still published. A passed deadline doesn't retire an action. Agencies are now measured against these actions as an existing obligation rather than a target date.

There's one adjustment. The logging action points to M-21-31, which M-26-14 rescinded on May 22, 2026, replacing its tiers with a risk-based approach and a Logging Reference Architecture. CISA published that architecture on August 20, 2026, and the memo gives agencies 90 days from its release for their first Agency Logging Plan.

That's the decision with the nearest date. The CISO decides how the Agency Logging Plan covers Zero Trust telemetry, including the hosts and accounts that run the assessments. It's due 90 days after August 20, 2026.`,
  "Book 11, Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require (What M-22-09 requires; Reading M-22-09 in October 2026); Chapter 07 (responsibility matrix: Agency Logging Plan coverage); Chapter 09 — Running the Assessment (Before the first run: Logging); Appendix A.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What the mandates require", "BOD 25-01: six actions, and the half that matters");
  tag(s, "What");
  const acts = [
    ["1", "Inventory in-scope tenants", "Feb 21, 2025; yearly in Q1"],
    ["2", "Deploy the SCuBA tools; report", "Apr 25, 2025"],
    ["3", "Implement the mandatory policies", "Jun 20, 2025"],
    ["4", "Implement later policy updates", "CISA's timelines"],
    ["5", "Baseline every new tenant", "Before its ATO"],
    ["6", "Explain deviations", "With each report"],
  ];
  leftTable(s, ["#", "Required action", "Deadline"],
    acts.map((r, i) => [bold(r[0]), { text: r[1], options: { bold: i >= 2 && i <= 4, color: i >= 2 && i <= 4 ? HEX.navy : HEX.ink } }, { text: r[2] }]),
    [0.5, 3.6, 2.8], [0.42, 0.53, 0.53, 0.53, 0.53, 0.53, 0.53], 13);
  sideBox(s, "Scope", "FaListCheck", HEX.teal, HEX.tealTint, "Scope and the 50 policies", [
    "50 mandatory Microsoft 365 policies; Entra ID: 20 of 30",
    "SaaS only: Azure subscriptions and on-premises AD are out",
    "Google Workspace: inventory Nov 2, 2026; tools and policies Dec 1",
    "Actions 3 to 5 are architecture; the rest take days",
  ]);
  decision(s, "Inventory every Google Workspace tenant, and measure compliance by mandatory policies held and deviations owned, not by reports filed",
    "CISO", "Workspace inventory by November 2, 2026");
  sources(s, "Sources: CISA BOD 25-01 (December 17, 2024); Required Configurations page; Implementation Guidance (updated July 27, 2026); ScubaGear v1.8.0 baselines. Book 11, Chapters 04 and 07.");
  narrate(s,
`BOD 25-01 is narrower and more concrete. CISA issued it on December 17, 2024. It binds federal civilian agencies, for every production cloud tenant of a product with a finalized SCuBA baseline.

It has six required actions. Inventory the in-scope tenants, by February 21, 2025, and every year in the first quarter. Deploy the SCuBA assessment tools and begin reporting, by April 25, 2025. Implement the mandatory policies, by June 20, 2025. Implement later policy updates on CISA's timelines. Baseline every new tenant, and begin continuous monitoring, before its authorization to operate. And explain deviations with each report.

The mandatory list is a subset of the baselines. For Microsoft 365, CISA's Required Configurations page lists 50 policies; in Entra ID, that's 20 of the 30 in the current baseline. CISA's guidance limits scope to software as a service, so Azure subscriptions are out even when they share the tenant, and on-premises Active Directory, endpoints and networks are untouched.

Google Workspace is now in scope. Its tenant inventory is due November 2, 2026, and the tools by December 1. CISA's two pages disagree on the policy date, December 1 or December 31, so plan to December 1. Even a small tenant used by one component carries all six obligations.

Now count honestly. Inventory, deployment and explanations take days. Actions three to five are architecture, and they're what the directive exists for. So measure compliance by the substantive work: how many mandatory policies hold, and whether every open deviation is being fixed on a date or carried as the authorizing official's documented risk acceptance. The CISO owns the inventory and the reporting route, and the Workspace inventory is due November 2.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01 (What BOD 25-01 requires; What \"in scope\" means; The mandatory list is a subset of the baselines; Google Workspace is in scope; What BOD 25-01 doesn't cover; Administrative obligations and substantive work); Chapter 07 (responsibility matrix: tenant inventory and reporting route).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What the mandates require", "Reporting to CISA, and where deviations go");
  tag(s, "What");
  const routes = [
    ["CISA-hosted ScubaConnect", "CISA manages reporting; results feed the CDM dashboard"],
    ["Self-hosted ScubaConnect", "The agency runs it and keeps local copies"],
    ["Agency-hosted (CLAW or TALON)", "Automated scans at least quarterly; development work"],
    ["Manual (CyberScope)", "Upload quarterly or more often, from the latest tool version"],
  ];
  leftTable(s, ["Reporting route", "How it works"], routes.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.6, 4.3], [0.42, 0.78, 0.78, 0.78, 0.78]);
  sideBox(s, "Sees", "FaClipboardCheck", HEX.navy, HEX.navyTint, "What CISA sees, and who decides", [
    "The tool's own results file, never renamed",
    "Required deviations show as “Omitted,” with a rationale",
    "Omissions approved through risk management",
    "The AO may accept deviation risk, under agency policy",
  ]);
  decision(s, "Choose the reporting route, and send every deviation with no end date to the authorizing official as a standing risk acceptance",
    "CISO; the AO for standing deviations", "Before the next quarterly report");
  sources(s, "Sources: CISA BOD 25-01; BOD 25-01 Implementation Guidance (reporting options and deviations); ScubaConnect. Book 11, Chapters 04, 07 and 10.");
  narrate(s,
`Reporting is where many agencies stopped, so it's worth being precise about what CISA actually receives.

The directive allows continuous integration with CISA's monitoring, or quarterly manual reporting, and CISA's implementation guidance describes four routes. CISA-hosted ScubaConnect, where CISA manages reporting after setup and results feed the CDM dashboard. Self-hosted ScubaConnect, where the agency runs it and keeps local copies. An agency-hosted integration, through CLAW or TALON, with automated scans at least once a quarter, which takes development work on the agency's side. Or manual upload to CyberScope, quarterly or more often, from the most recent version of the tool.

Whatever the route, the reported artifact is the tool's own results file, and agencies are told not to rename it. A deviation that's operationally required appears in the output as Omitted, with its rationale, and the guidance says omissions must be approved through the organization's security risk management process. CISA also supplies a template for tracking non-compliant policies, planned fixes and target dates. In effect, it's a plan of action and milestones.

The directive puts the risk decision in the right place. Authorizing officials may accept risk for deviations from the mandatory policies to meet operational needs, under agency policy, and CISA reviews and resolves what they submit.

Two decisions follow. The CISO picks the reporting route, and the assessment operators run it. Operators never edit results, and never decide omissions. And every deviation without an end date goes to the authorizing official, because a standing omission is a standing risk acceptance. The reporting floor is at least quarterly, so both are needed before the next quarterly report.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01 (How agencies report); Chapter 07 — Who Owns Zero Trust (The assessment operators; responsibility matrix: omission rows); Chapter 10 (Re-assess on a cadence).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What the mandates require", "Two assessment tools, two questions, no verdict");
  tag(s, "What");
  const cmp = [
    ["Question", "Does the tenant meet the federal baseline?", "How mature against Zero Trust guidance?"],
    ["Owner", "CISA; the tool BOD 25-01 names", "Microsoft staff; community project, unsupported"],
    ["Scope", "Microsoft 365 workloads", "Entra, Intune, Azure, Purview and more"],
    ["BOD 25-01 tool?", "Yes", "No"],
  ];
  leftTable(s, ["", "ScubaGear", "Zero Trust Assessment"], cmp.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.5, 2.7, 2.7], [0.42, 0.8, 0.8, 0.62, 0.5]);
  sideBox(s, "Overlap", "FaFilter", HEX.amber, HEX.amberTint, "Where they overlap", [
    "Both: Entra ID identity; Defender threat policies",
    "ScubaGear only: Exchange, Teams, SharePoint, Power Platform",
    "22 of the 50 mandatory policies sit in those four",
    "Neither sees other clouds, the network or hypervisors",
  ]);
  decision(s, "Approve both tools, with pinned versions, for production tenants, and require their output to stay inside the authorization boundary",
    "CISO", "Before the next production run");
  sources(s, "Sources: CISA ScubaGear v1.8.0; BOD 25-01 Required Configurations; Zero Trust Assessment 3.1.0; Microsoft Learn. Book 11, Chapters 05, 07 and 09.");
  narrate(s,
`Agencies run two free, read-only assessments of their Microsoft cloud, and often drop one because it covers identity. They answer different questions.

ScubaGear is CISA's tool. It asks a compliance question: does this Microsoft 365 tenant meet the federal baselines, including the BOD 25-01 mandatory policies? It's the tool the directive names, and its output is what CISA receives.

Microsoft's Zero Trust Assessment asks a maturity question: how close is the Microsoft cloud environment, across identity, devices, network and data, to Microsoft's Zero Trust guidance? Release 3.1.0, from October 20, 2026, holds 364 tests. It's a community project maintained by Microsoft employees, not an official product, and no Microsoft support program covers it. It isn't a BOD 25-01 tool.

They overlap mostly on Entra ID identity, and now on Defender threat policies. Only ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform, and 22 of the 50 mandatory policies sit in those four products. Dropping ScubaGear would leave mandatory policies unassessed and stop the reporting the directive requires. Dropping the Zero Trust Assessment leaves devices, network and data unmeasured against Microsoft's guidance.

Running both, fully, is still one vendor's answer about one vendor's platform. Neither sees another cloud, the network or the hypervisors. And neither closes a finding: a score is a reading, not a treatment plan. Both outputs are maps of where the tenant is weak, so they're handled as sensitive.

The decision belongs to the CISO: approve both tools, with pinned versions, for production tenants, and require their output to stay inside the authorization boundary, before the next production run. Expect the score to move when a version changes, even when the tenant didn't.`,
  "Book 11, Chapter 05 — ScubaGear and Microsoft's Zero Trust Assessment; Chapter 07 (The CISO and ISSO; responsibility matrix: approved tools and pinned versions); Chapter 09 (Running the Zero Trust Assessment: community project, not supported).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What the mandates require", "Beyond Microsoft 365, each tool answers for itself");
  tag(s, "What");
  cards(s, "Estate", [
    ["FaDatabase", "Reconcile first", HEX.navy, HEX.navyTint, ["CM-8: no duplicate accounting of components", "BOD 23-01: asset discovery every 7 days", "One naming authority, not one per platform", "No implicit trust from a VPN or flat segment"]],
    ["FaServer", "The hypervisor", HEX.amber, HEX.amberTint, ["A distinct threat class beneath every guest", "Assessed as its own surface, not inferred from guests", "Identities bound by verified identifiers"]],
    ["FaCloud", "Each tool's own limits", HEX.teal, HEX.tealTint, ["AWS: supports “a subset” of requirements", "Azure Policy: “only a partial view”", "VMware hardening: general guidance", "FedRAMP certifies the service, not the agency's use"]],
  ]);
  decision(s, "Admit each provider's native-tool findings as evidence for its own platform, under the CISO's evidence standard, and never as the agency's score",
    "Zero Trust program lead", "Before any agency-wide score");
  sources(s, "Sources: NIST SP 800-53 Rev. 5; CISA BOD 23-01; AWS Security Hub CSPM; Azure Policy; Broadcom VCF guidelines; FedRAMP 2026 rules. Book 11, Chapters 06, 07.");
  narrate(s,
`Everything so far stops at the edge of Microsoft 365 and Google Workspace. Nothing on BOD 25-01's list covers infrastructure accounts, the agency network or the virtualized estate. So the whole-agency argument rests on the Zero Trust documents, and on the SP 800-53 controls every system security plan already asserts.

Three things get reconciled before those estates are assessed. One inventory: control CM-8 forbids duplicate accounting of components, and BOD 23-01 requires automated asset discovery every 7 days, including cloud virtual machines. One naming authority, because each cloud provider and VMware ships its own private DNS. And no implicit trust from any boundary: a site-to-site VPN, a default virtual network and a flat virtualized segment are architecturally the same mistake.

The hypervisor is a distinct threat class, so its management plane is assessed as its own surface, not inferred from the posture of the guests running on it.

Then the providers' own tools, each of which describes its own limits. AWS says its NIST standard supports a subset of requirements through automated checks. Microsoft says Azure Policy compliance is only a partial view of overall compliance. Broadcom calls its VMware hardening material general guidance whose assumptions may not hold in your environment. And FedRAMP certifies the cloud service offering, while each agency still authorizes its own systems, including the configuration it selected and the integrations it enabled.

The decision is the program lead's: admit each native tool's findings as evidence for its own platform, under the CISO's evidence standard, and never as the agency's score. It's needed before any whole-agency figure is reported.`,
  "Book 11, Chapter 06 — Beyond Microsoft 365: Networks, Other Clouds and Virtualized Estates; Chapter 07 — Who Owns Zero Trust (responsibility matrix: cloud provider native-tool findings admitted as evidence).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = D.content("Who owns it", "Every pillar has an owner; the posture needs one too");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["CIO and sponsor", "Scope, sequence, funding, tie-breaks"], ["Zero Trust program lead", "The score, correlation, calendar, priority"], ["Authorizing official", "Residual risk; every POA&M; assessor independence"]]],
    ["FaClipboardCheck", "Set the rules", HEX.teal, HEX.tealTint, [["CISO and ISSO", "Control requirements; evidence standard; tools"], ["Identity-plane owner", "The unified record, governed as Tier 0"], ["Privacy and records", "Consulted on sharing and retention"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Pillar owners", "Remediate through change control"], ["Assessment operators", "Run the tools; never edit results"], ["Security operations", "Drift; watching the assessment accounts"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.35, w: 3.55, h: 2.65, fontSize: 14, paraSpaceAfter: 8 });
  });
  decision(s, "Name an agency-level owner of the Zero Trust posture, and a cross-pillar correlation owner, separate from any cloud provider relationship",
    "CIO", "This quarter");
  sources(s, "Sources: OMB M-22-09; CISA Zero Trust Maturity Model v2.0; NIST SP 800-37 Rev. 2, Appendix D; CISA BOD 25-01. Book 11, Chapters 02, 07 and 10.");
  narrate(s,
`Who owns it? Zero Trust programs rarely fail for lack of owners. They fail because every owner is a pillar owner. Nobody owns the question this book keeps asking: what is the agency's posture across all five pillars, and what does the number on the cover page actually measure?

The book's model separates deciding from doing. The CIO and executive sponsor set strategy, scope and funding, and break ties. Three CIO decisions matter here: which estates the whole-agency score covers, stated in writing so it can't quietly shrink to the estates that assess well; the sequence, since closing BOD 25-01 findings competes for the same engineers as every other deadline; and which team owns a control that spans pillars.

The Zero Trust program lead owns the posture: the definition of the score, cross-pillar correlation, the assessment calendar and the prioritized worklist. Many agencies will give this role to the implementation lead M-22-09 required them to designate within 30 days. The lead decides priority but doesn't accept risk, and shouldn't also own the agency's relationship with its largest cloud vendor. That independence is the point of the role.

The CISO sets the control requirements and the evidence standard, and approves the tools and the accounts that run them. The authorizing official accepts residual risk, approves each plan of action and milestones, and sets assessor independence. Most agencies have several, so the lead aggregates, and each official accepts risk only for the systems they authorize.

The decision is the CIO's, and the book puts it in this quarter: name an agency-level owner of the Zero Trust posture, and a cross-pillar correlation owner, separate from any cloud provider relationship.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust (Why the posture needs its own owner; Decision rights and work are different things; The roles); Chapter 02 (Governance decisions for this quarter); Chapter 10 (What an agency can do this quarter, item 2).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = D.content("Who owns it", "Who owns each pillar, and three calls that go astray");
  tag(s, "Who");
  const owners = [
    ["Identity", "Identity engineering"],
    ["Devices", "Endpoint engineering"],
    ["Networks", "Network engineering, with security architecture"],
    ["Applications and workloads", "Application owners, with the platform teams"],
    ["Data", "Data owners and the data office"],
    ["Naming and identity plane", "Identity engineering and the DNS/DDI team"],
    ["Visibility and analytics", "Security operations"],
    ["Governance", "Program lead, with the CISO and the AO"],
  ];
  leftTable(s, ["Pillar or capability", "Owner in the program's model"], owners.map((r, i) => [bold(r[0], i < 5 ? HEX.navy : HEX.teal), { text: r[1] }]),
    [2.65, 4.25], [0.38, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4], 12);
  sideBox(s, "Calls", "FaScaleBalanced", HEX.teal, HEX.tealTint, "Three calls, three owners", [
    "Omission with an end date: the CISO",
    "Omission with no end date: the authorizing official",
    "Drift on an authorized system: the authorizing official",
    "How to fix is the pillar owner's; whether to fix isn't",
  ]);
  decision(s, "Move every exception out of documents into the versioned configuration file, with an expiration, and route each standing one to the AO",
    "CISO", "This quarter");
  sources(s, "Sources: CISA Zero Trust Maturity Model v2.0; CISA BOD 25-01; ScubaGear v1.8.0 configuration file documentation; NIST SP 800-37 Rev. 2. Book 11, Chapters 07 and 10.");
  narrate(s,
`Pillar by pillar, the book maps CISA's five pillars to the teams that own them after modernization. Identity engineering owns identity. Endpoint engineering owns devices. Network engineering, with security architecture, owns networks. Application owners, with the platform teams, own applications and workloads. And the data owners and the data office own data, the one pillar without a workbook book of its own yet.

More owners sit across them. The naming and identity plane belongs to identity engineering and the DNS and DDI team, governed as Tier 0. Each other cloud and the virtualization estate belongs to its platform team, reconciled to the plane. Security operations owns visibility and analytics. Pillar owners own automation, under gated change. And governance, the across-pillars part no pillar owner can deliver alone, sits with the program lead, together with the CISO and the authorizing official.

Pillar owners decide how to fix a finding. They don't decide that it doesn't need fixing.

Three calls often land on the wrong desk. First, an omission or incorrect-result marking with an expiration date is a CISO decision, recorded in the versioned configuration file. Second, one with no end date is a standing risk acceptance, and goes to the authorizing official, which matches BOD 25-01's assignment of deviation risk. Third, drift, a control that passed every interval and failed the last one, goes to the authorizing official too, because it's a change to an authorized system, and the official decides whether it's significant.

The decision for the CISO, this quarter: move every exception out of documents and into the configuration file and the repository, with an expiration, and route each standing one to the authorizing official.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust (The responsibility matrix; Who owns each pillar; What changes, in one table); Chapter 10 (Exceptions belong in the configuration file, with an owner; What an agency can do this quarter, item 4).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to assess", "Close before you assess: assessors run at step five");
  tag(s, "How");
  const phases = [["Understand", "Gaps and root causes"], ["Design", "The closure pattern"], ["Implement", "Build and integrate"], ["Govern", "Owners, POA&Ms"], ["Validate", "The assessors run here"], ["Authorize", "The AO decides"]];
  const tints = [HEX.grey, HEX.grey, HEX.grey, HEX.grey, HEX.tealTint, HEX.navyTint];
  const gap = 0.125, w = (12.15 - gap * 5) / 6;
  phases.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `Phase ${i + 1}`, x, 1.5, w, 1.3, tints[i]);
    txt(s, `Phase ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: f[1], options: { fontSize: 12.5 } },
    ], { x: x + 0.12, y: 1.55, w: w - 0.24, h: 1.2, valign: "middle" });
  });
  const panels = [
    ["FaCubes", "Build these layers first", HEX.navy, HEX.navyTint, ["Naming, addressing and certificates", "Device and workload identity", "Legacy authentication retired in phases", "Exceptions governed, dated and owned"]],
    ["FaListCheck", "One response per finding", HEX.teal, HEX.tealTint, ["Configuration change: closes now", "Architectural work: an owner and a date", "Risk acceptance: the AO decides", "No response recorded: the only failure"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 2.98, 6.0, 2.12, p[3]);
    icon(s, p[0], x + 0.2, 3.06, 0.56, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.06, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13.5), { x: x + 0.25, y: 3.68, w: 5.6, h: 1.38, paraSpaceAfter: 2 });
  });
  decision(s, "Close the BOD 25-01 findings before the maturity assessment, and staff that sequence against the agency's other deadlines",
    "CIO", "Before the maturity assessment");
  sources(s, "Sources: CISA BOD 25-01 and Implementation Guidance; NIST SP 800-37 Rev. 2; Microsoft Learn — Zero Trust Assessment. Book 11, Chapters 07 and 08.");
  narrate(s,
`How do you get there? First, close before you assess.

Agencies met BOD 25-01's early dates: tenants inventoried, ScubaGear deployed and reporting. Many now treat that as the answer. But ScubaGear measures deviation from a baseline; it doesn't close any, and neither does the Zero Trust Assessment. A thermometer that reports a fever every day for a year isn't a treatment plan. Without an architecture to absorb the fix, remediation collapses into re-running the scan and filing another plan-of-action line.

So the program's six-phase sequence puts the assessors at step five, as confirmation rather than discovery: understand the gaps and their root causes, design the closure pattern, implement it, govern it with owners and plans, then validate, and then the authorizing official decides on the evidence. That's the Risk Management Framework's own order: implement, assess, authorize, monitor. BOD 25-01 says the same for new tenants: baseline first, then the authorization to operate.

Before validating, build the layers a finding depends on: naming, addressing and certificates; device and workload identity; a phased retirement of legacy authentication; and governed exceptions.

Not every finding waits for architecture. Route each one to exactly one response: a configuration change that closes now; architectural work with an owner and a target date; or a risk acceptance by the authorizing official, marked Omitted with a rationale. A finding with no response recorded is the only state the program treats as a failure.

This is the CIO's sequence decision: close the BOD 25-01 findings before the maturity assessment, and staff that order against the agency's other deadlines. It's needed before the maturity assessment is scheduled.`,
  "Book 11, Chapter 08 — Close Before You Assess (What the assessors can't do; The sequence: architecture before assessment; Closing findings first; Route every finding to one of three responses); Chapter 07 (The roles: the CIO's sequence decision).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to assess", "Read the result before you count it");
  tag(s, "How");
  const res = [
    ["Fail, Warning", "Failed, Investigate", "A finding"],
    ["N/A", "—", "A manual check, not a pass"],
    ["Error", "Error", "Absence of evidence; re-run"],
    ["—", "Skipped", "Absence of evidence, with reason"],
    ["Omitted", "—", "A decision with an owner and expiry"],
  ];
  leftTable(s, ["ScubaGear", "Zero Trust Assessment", "How the program reads it"],
    res.map((r, i) => [bold(r[0]), bold(r[1]), { text: r[2], options: { bold: i === 0, color: i === 0 ? HEX.red : HEX.ink } }]),
    [1.7, 2.05, 3.15], [0.42, 0.62, 0.62, 0.62, 0.62, 0.62]);
  sideBox(s, "Score", "FaTableList", HEX.amber, HEX.amberTint, "Score, then reconcile", [
    "Severity 0 to 100; priority is severity over effort",
    "P1 to P4; quick wins go to the next change window",
    "The program's method, not a federal standard",
    "One setting, one SP 800-53 control, one owner",
  ]);
  decision(s, "Set the evidence standard: a pinned tool version, a recorded run time, an unaltered output file and a hash",
    "CISO", "Before results are scored or reported");
  sources(s, "Sources: ScubaGear output schema and SP 800-53 mappings; Zero Trust Assessment guide and terminology; Microsoft Learn. Book 11, Chapters 07, 09, 10.");
  narrate(s,
`Then the evidence. The two tools use different words for the same outcomes, and some of their outcomes aren't findings at all.

Only four results are findings: ScubaGear's Fail and Warning, and the Zero Trust Assessment's Failed and Investigate. A not-applicable result is usually a manual check for the pillar owner to verify by hand, not a pass. An error is absence of evidence: fix the run and re-run. And a skipped check isn't a gap and isn't a pass. The tool's own guide says missing prerequisites produce skipped checks, not evidence that the tenant meets a recommendation. Often the reason is a license, or a feature that isn't available or authorized in a government cloud. Scoring it as a failure overstates the gap; scoring it as a pass overstates the posture. So it's recorded as absence of evidence, with the reason, and it becomes a boundary finding.

The program then scores the real findings with a documented method: severity from 0 to 100, priority as severity over effort, and buckets from P1 down to P4. Quick wins go into the next change window. The method is the program's, not a federal standard, and a P1 is a priority, not a risk acceptance.

Last, reconcile at the control, not tool to tool. A ScubaGear failure and a Zero Trust Assessment failure on the same setting and the same SP 800-53 control are one finding with two pieces of evidence, routed to one pillar owner.

Underneath all of this sits the CISO's evidence standard: a pinned tool version, a recorded run time, an unaltered output file and a hash. It's needed before any result is scored or reported.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts: From Findings to a Program (Read the result before counting it; Absence of evidence is a different claim; Score and rank the findings; Reconcile at the control; Honest limits); Chapter 07 (The CISO and ISSO: the evidence standard); Chapter 09 (output handling).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to assess", "From findings to a program the AO can see");
  tag(s, "How");
  rows(s, "Program", "FROM A WORKLIST TO A PROGRAM", [
    ["POA&M", "Every unfixed, unexcepted finding; the AO approves"],
    ["Seal", "Unaltered output, wrapped with its provenance"],
    ["Rebuild", "Same inputs give a byte-identical bundle"],
    ["Re-assess", "On the lead's calendar, after every wave"],
    ["Compare", "Scores only on the same tool version"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "Drift", "FaArrowsRotate", HEX.navy, HEX.navyTint, "Drift goes to the AO", [
    "Passed every interval, failed the last: a change",
    "The AO decides whether it is significant",
    "Prepared by the program lead and security operations",
    "The cheapest adoption step in Chapter 10",
  ]);
  decision(s, "Receive interval-to-interval drift findings as changes to an authorized system, and decide which are significant",
    "Authorizing official", "Every interval, from this quarter");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-5, CA-7, RA-7); NIST SP 800-37 Rev. 2; NIST OSCAL; BOD 25-01 Implementation Guidance; Zero Trust Assessment. Book 11, Chapters 07, 09 and 10.");
  narrate(s,
`Now turn the worklist into a program the authorizing official can see.

Every finding that isn't fixed in the next change window and isn't covered by an approved exception becomes a plan of action and milestones item. SP 800-53 requires one for each system, updated from assessments and continuous monitoring, and the authorizing official approves it. Each item names the pillar owner, the control it bears on, the evidence that will show it closed, and the re-assessment that will test that evidence.

Behind those items, the program wraps each tool's unaltered output with its provenance and seals it into a bundle. Because the same inputs produce a byte-identical bundle, an assessor can rebuild it months later and walk back from a finding to the raw result without re-running the tool. That's the difference between an archived opinion and evidence.

Re-assessment runs on a calendar the program lead owns, and after each remediation wave, so a finding is closed by evidence, not by a ticket status. BOD 25-01's reporting routes set the floor for ScubaGear at quarterly. A Zero Trust Assessment score is compared across runs only on the same tool version, or after a review of what changed.

And drift goes to the authorizing official, not only to security operations. A control that passed every interval and failed the last one is a change to an authorized system. The book calls treating that drift as something the official sees the cheapest adoption step in its final chapter.

So the decision sits with the authorizing official: receive interval-to-interval drift findings, prepared by the program lead and security operations, every assessment interval, and decide which ones are significant changes. Stand it up this quarter.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts (From findings to plans of action and milestones; Drift is continuous verification; Re-assess on a cadence; What an agency can do this quarter, item 5); Chapter 09 — Running the Assessment (The four-stage pipeline); Chapter 07 (responsibility matrix: drift findings).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to assess", "Decisions to make this quarter, and who makes them");
  tag(s, "How");
  const asks = [
    ["Name the posture owner and a correlation owner; put the score's scope in writing", "CIO", "This quarter"],
    ["Reconcile network, clouds and virtualization to one record", "Identity-plane owner", "Before any scoring"],
    ["Find which pillar evidence re-runs without the operator", "Program lead", "This quarter"],
    ["Move exceptions into the configuration file, with expirations", "CISO", "This quarter"],
    ["Cover Zero Trust telemetry in the Agency Logging Plan", "CISO", "90 days after Aug 20, 2026"],
    ["Inventory any Google Workspace tenant", "CISO", "November 2, 2026"],
    ["Time-box privilege; make one detective control preventive", "CISO, with identity eng.", "This quarter"],
    ["Stand up drift detection; take its findings to the AO", "Program lead, SecOps; AO", "This quarter"],
    ["Record each government-cloud gap as a governed finding", "System owner and ISSO", "This quarter"],
  ];
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([7.2, 2.75, 2.2], { y: 1.45, fontSize: 12.5, rowH: [0.38, ...asks.map(() => 0.41)] }));
  txt(s, "Close line", [{ text: "None of these is a procurement.  ", options: { bold: true, color: HEX.amber } },
    { text: "Unify first, assess second; the evidence supports the decisions, and named people make them." }],
    { x: 0.6, y: 5.75, w: 12.15, h: 0.6, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: CISA BOD 25-01 Implementation Guidance; OMB M-26-14; CISA Logging Reference Architecture; NIST SP 800-37 Rev. 2. Book 11, Chapters 02, 04, 06, 07, 09 and 10.");
  narrate(s,
`So, the decisions, with their owners. None of them is a procurement.

The CIO names an agency-level owner of the Zero Trust posture, and a cross-pillar correlation owner, separate from any cloud provider relationship, and puts the scope of the whole-agency score in writing.

The identity-plane owner reconciles the network, every cloud and the virtualization estate to one authoritative record before any of them is scored.

The program lead finds out, pillar by pillar, which evidence can be re-run without the operator's help, because every no marks the adoption boundary.

The CISO moves every exception into the configuration file, with an expiration; covers the assessment hosts and accounts in the Agency Logging Plan, due 90 days after August 20; brings any Google Workspace tenant into the inventory by November 2; and, with identity engineering, time-boxes privileged access and converts one detective control into a preventive one.

The program lead and security operations stand up drift detection, and the authorizing official receives its findings. And the system owner and ISSO record each government-cloud feature gap as a governed finding, rather than an unstated assumption.

Each is a structural step that compounds. Unify first, assess second, and let named people make the decisions the evidence supports. No tool, and no number of tools, certifies Zero Trust maturity. Book 11 has the detail, with every claim footnoted. Thank you.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts (What an agency can do this quarter; Honest limits); Chapter 02 (Governance decisions for this quarter); Chapter 04 (Google Workspace is in scope); Chapter 07; Chapter 09 (Logging).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources: mandates, directives and NIST");
  const src = [
    "Executive Order 14028, Improving the Nation's Cybersecurity (May 12, 2021), §3(b)(ii) and §10(k).",
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (January 26, 2022), §II, §III.A–§III.F.  ·  OMB M-26-14 (May 22, 2026; rescinds M-21-31).  ·  OMB memoranda index.",
    "CISA Zero Trust Maturity Model v2.0 (April 2023) and its landing page, marked “Archived Content.”  ·  CISA Logging Reference Architecture (August 20, 2026).",
    "CISA BOD 25-01, Implementing Secure Practices for Cloud Services (December 17, 2024); Required Configurations page; Implementation Guidance (updated July 27, 2026).  ·  CISA BOD 23-01 (October 3, 2022).",
    "NIST SP 800-207, Zero Trust Architecture (August 2020).  ·  SP 800-53 Rev. 5, release 5.2.0 (CA-5, CA-7, CM-8, RA-7, SC-20 to SC-22) and SP 800-53B.  ·  SP 800-37 Rev. 2, Appendix D.  ·  SP 1800-35.  ·  OSCAL.",
    "FedRAMP Consolidated Rules for 2026: “Using a FedRAMP Certified Cloud Service” and Key Security Indicators.",
  ];
  txt(s, "Source list", bullets(src, 13.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = D.content("Backup", "Sources: tools, providers and incidents");
  const src = [
    "CISA SCuBA project; ScubaGear v1.8.0 (May 7, 2026): README, baselines, configuration file, reports, tool output schema, SP 800-53 mappings; PowerShell Gallery version history; ScubaGoggles v1.0.0 (July 24, 2026); ScubaConnect.",
    "Microsoft Zero Trust Assessment 3.1.0 (October 20, 2026): release, source and repository guide.  ·  Microsoft Learn: Zero Trust Assessment overview, get-started and terminology; Office 365 GCC; PIM; emergency access accounts.",
    "AWS Security Hub CSPM, NIST SP 800-53 Rev. 5 standard.  ·  Azure Policy, NIST SP 800-53 Rev. 5 regulatory compliance initiative.  ·  Broadcom, VMware Cloud Foundation security and compliance guidelines.",
    "Cyber Safety Review Board, Review of the Summer 2023 Microsoft Exchange Online Intrusion (March 20, 2024).  ·  CISA and FBI AA23-039A, ESXiArgs (February 8, 2023).  ·  Microsoft Threat Intelligence, CVE-2024-37085 (July 29, 2024).",
    "Full footnotes with links and access dates (October 21, 2026): Book 11, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b11-zero-trust/).",
  ];
  txt(s, "Source list", bullets(src, 13.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

console.log(`narration: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
