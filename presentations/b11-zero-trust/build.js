// Book 11 — Zero Trust & Assessment: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b11-zero-trust/build.js presentations/b11-zero-trust/B11_Zero_Trust.pptx
// Every fact comes from a footnoted chapter of docs/books/b11-zero-trust/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 11", title: "Zero Trust & Assessment" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B11_Zero_Trust.pptx";

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
// A row of numbered step boxes across the slide.
const steps = (s, prefix, list, tints) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
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

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why the whole agency", "Why Is Zero Trust a Whole-Agency Property, Not a Product?", "Book 11 — Zero Trust & Assessment");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 11 of the Federal Modernization Workbook, Zero Trust and Assessment: how an agency measures its Zero Trust posture across every estate it runs, and turns what the tools find into a program.

I'll take four questions: why Zero Trust is a whole-agency property, what the mandates and tools actually cover, who owns the posture, and how to assess it.

The short version: unify first, assess second, and treat every tool as evidence, never as the verdict.`,
  "Book 11, index; Chapter 01 — Zero Trust Is a Whole-Agency Property.");
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
  ], 1.92, 0.8, 0.68);
  sideBox(s, "Guidance", "FaBook", HEX.navy, HEX.navyTint, "WHAT THE GUIDANCE DESCRIBES", "Written for the enterprise", [
    "EO 14028: “throughout all aspects of the infrastructure”",
    "M-22-09: enterprise-managed identities; a complete device inventory",
    "ZTMM v2.0: agency-wide buy-in for one architecture",
    "SP 800-207: no implicit trust from location or ownership",
  ], 14);
  callout(s, "Unify", 5.4, 1.1, "FaSitemap", HEX.red, "Unify first, assess second: ",
    "one naming and identity plane across the network, every cloud and the virtualization estate. Once it exists it maps the whole attack surface, so defend it as a high-value target.");
  sources(s, "Sources: Executive Order 14028; OMB M-22-09; CISA Zero Trust Maturity Model v2.0; NIST SP 800-207. Book 11, Chapter 01.");
  narrate(s,
`Why is Zero Trust a whole-agency property? Look at the usual assessment calendar. The network team reviews the boundary, keyed by address. The cloud team runs each provider's posture scan, keyed by resource tags. The virtualization team works a hypervisor checklist, keyed by whatever the management plane calls a machine. At year end someone puts the three reports behind one cover page and calls it the agency's maturity. It's three partial assessments with one title.

The failure is architectural. A database server that runs as a virtual machine, sits on an agency subnet and backs up to a cloud bucket can appear as three unrelated objects, scored by three tools. A total across them counts objects, not architecture.

The guidance describes the enterprise, not a tenant. Executive Order 14028 says throughout all aspects of the infrastructure, and NIST SP 800-207 grants no implicit trust from network location or ownership. So unify first, then assess, and defend the unified plane, because it becomes a complete map of the attack surface.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property (The question this book answers; What the federal guidance actually describes; Three partial assessments are not one score); Chapter 03 (EO 14028 definition).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why the whole agency", "Evidence, not verdicts: failures beneath any one tool");
  tag(s, "Why");
  cards(s, "Incidents", [
    ["FaKey", "A forged token, 2023", HEX.red, HEX.redTint, ["Tokens forged with a provider's consumer signing key", "22 enterprise organizations, 503 personal accounts", "Access for at least six weeks", "Caught by an agency's own log alert"]],
    ["FaServer", "Beneath the guest", HEX.amber, HEX.amberTint, ["ESXiArgs, February 2023: over 3,800 ESXi servers", "CVE-2024-37085: “ESX Admins” trusted by name", "Many security products barely see the hypervisor"]],
    ["FaFilter", "One vendor, two tools", HEX.navy, HEX.navyTint, ["ScubaGear is CISA's, for the BOD 25-01 baselines", "The Zero Trust Assessment is Microsoft's guidance", "Neither sees other clouds, the network or hypervisors"]],
  ]);
  callout(s, "Verdict", 5.3, 1.2, "FaScaleBalanced", HEX.navy, "The agency owns the verdict: ",
    "every tool is an evidence input, reconciled at the control level with NIST SP 800-53 as the common vocabulary. No provider's tool can hold one posture across every platform.");
  sources(s, "Sources: Cyber Safety Review Board, Summer 2023 Exchange Online intrusion; CISA and FBI AA23-039A; Microsoft Threat Intelligence, CVE-2024-37085; CISA SCuBA; Microsoft Learn. Book 11, Chapter 01.");
  narrate(s,
`Two documented incidents show why the whole-agency view is a security property, not a reporting preference. In May and June 2023, an actor used a Microsoft consumer signing key to forge tokens and read Exchange Online mail. The Cyber Safety Review Board counted 22 enterprise organizations and 503 related personal accounts, with access to some mailboxes for at least six weeks. The tokens were valid to every system that checked them. What caught the intrusion was a custom alert one federal department had built on mailbox logs it paid for.

The second sits beneath the guest. ESXiArgs compromised more than 3,800 ESXi servers in February 2023. In 2024, CVE-2024-37085 gave full hypervisor control to members of a directory group named ESX Admins, matched by name.

Even one vendor's two tools don't add up. ScubaGear is CISA's, the Zero Trust Assessment is Microsoft's, and neither sees past Microsoft's platform. Tools are evidence inputs. The agency owns the verdict.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property (Two incidents that sat beneath any single tool; Even one vendor's two tools don't add up; Tools are evidence inputs, not verdicts).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why the whole agency", "Five governance principles, none of them a purchase");
  tag(s, "Why");
  rows(s, "Principle", "FIVE PRINCIPLES THAT MOVE A PROGRAM PAST INITIAL", [
    ["1  Identity anchors", "Re-evaluated in session; the plane defended"],
    ["2  Privilege apart", "Zero permanently active admin roles"],
    ["3  Evidence", "Reproducible, machine-readable, regenerable"],
    ["4  Enforcement", "Block, reapply or expire; don't just report"],
    ["5  The boundary", "Each cloud gap recorded as a governed finding"],
  ], 1.92, 0.66, 0.56);
  sideBox(s, "Stall", "FaTriangleExclamation", HEX.red, HEX.redTint, "WHY PROGRAMS STALL BELOW ADVANCED", "The model is not a shopping list", [
    "Five pillars run through three cross-cutting capabilities",
    "Governance: definition and enforcement, within and across pillars",
    "Traditional: “siloed pillars of policy enforcement”",
    "Drift is found at audit time, months late",
  ], 14);
  callout(s, "Break glass", 5.4, 1.1, "FaUserShield", HEX.amber, "Emergency accounts are governed too: ",
    "two or more, monitored, and tested at least every 90 days. And revocation comes from continuous access evaluation, not short tokens: its tokens can last up to 28 hours.");
  sources(s, "Sources: CISA Zero Trust Maturity Model v2.0; OMB M-22-09; NIST SP 800-207; Microsoft Learn — continuous access evaluation, PIM, emergency access accounts; NIST OSCAL. Book 11, Chapter 02.");
  narrate(s,
`Chapter 02 explains why programs stall at Initial or low Advanced. They read CISA's maturity model as a five-pillar shopping list. But the model runs those pillars through three cross-cutting capabilities, and the one programs fund least is Governance, which the model defines as the definition and enforcement of policy within and across pillars. Its Traditional stage reads like the failure list: siloed pillars of policy enforcement, and limited correlation of logs and telemetry.

Five principles answer it. Identity is the anchor, but it isn't self-authenticating, so sessions are re-evaluated and the identity plane is defended. Privileged identity gets controls of its own: Microsoft's guidance is zero permanently active assignments other than emergency accounts, which are tested at least every 90 days. Evidence must be reproducible, machine-readable and regenerable. Governance enforces: a policy that only produces next quarter's finding is a report. And the cloud boundary is modeled, with each government-cloud feature gap recorded as a governed finding.`,
  "Book 11, Chapter 02 — Governance Principles for Zero Trust.");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What the mandates cover", "Only one Zero Trust document sets requirements");
  tag(s, "What");
  const docs = [
    ["EO 14028 (May 2021)", "Binding", "Required each agency to plan a Zero Trust Architecture"],
    ["OMB M-22-09 (Jan 2022)", "Binding; in force", "Specific actions by pillar; FY 2024 deadlines"],
    ["CISA ZTMM v2.0 (Apr 2023)", "Guidance", "“A general guide,” not a strict set of requirements"],
    ["NIST SP 800-207 (Aug 2020)", "Guidance", "Tenets; policy engine, administrator, enforcement point"],
  ];
  s.addTable([head(["Document", "Authority", "What it does"]), ...docs.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: i < 2 ? HEX.red : HEX.teal } }, { text: r[2] }])],
    tableOpts([2.3, 1.4, 3.2], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.68, 0.68, 0.68, 0.68] }));
  box(s, "Reading box", 7.75, 1.5, 5.0, 3.55, HEX.navyTint);
  icon(s, "FaLandmark", 8.0, 1.68, 0.6, HEX.navy);
  txt(s, "Reading head", "Reading them in October 2026", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Reading list", bullets([
    "M-22-09 isn't rescinded; passed deadlines don't retire actions",
    "Its logging action now reads through M-26-14 (May 22, 2026)",
    "CISA's ZTMM page is marked archived; no later version",
    "M-22-09 sets actions, not a maturity stage",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "No score", 5.3, 1.2, "FaHashtag", HEX.red, "No federal document defines a Zero Trust score: ",
    "the model describes stages per function, M-22-09 sets actions, and neither requires a stage. A tool whose output “certifies maturity” is citing a requirement that doesn't exist.");
  sources(s, "Sources: Executive Order 14028; OMB M-22-09, M-26-14 and memoranda index; CISA Zero Trust Maturity Model v2.0 and landing page; NIST SP 800-207. Book 11, Chapter 03; Appendix A.");
  narrate(s,
`What do the mandates actually require? Four documents get cited as if they were one. Executive Order 14028 is binding, and required each agency to develop a plan to implement Zero Trust Architecture. OMB M-22-09 is binding and sets specific actions by pillar: phishing-resistant MFA for staff, contractors and partners, reliable device inventories through CDM, encrypted DNS and HTTPS, and an environmental isolation plan. CISA's Zero Trust Maturity Model, version 2.0, is guidance. It says it should not be viewed as a strict set of requirements but as a general guide, and CISA's page for it is now marked archived, with no later version. NIST SP 800-207 supplies the architecture.

M-22-09's FY 2024 deadlines have passed, but OMB hasn't rescinded it, and a passed deadline doesn't retire an action. One adjustment: its logging action pointed to M-21-31, which M-26-14 rescinded on May 22, 2026.

And no federal document defines a Zero Trust score, or requires a maturity stage.`,
  "Book 11, Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require; Appendix A.");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What the mandates cover", "BOD 25-01: six actions and 50 required policies");
  tag(s, "What");
  const acts = [
    ["1", "Inventory in-scope tenants", "Feb 21, 2025; yearly in Q1"],
    ["2", "Deploy the SCuBA tools; report", "Apr 25, 2025"],
    ["3", "Implement the mandatory policies", "Jun 20, 2025"],
    ["4", "Implement later policy updates", "CISA's timelines"],
    ["5", "Baseline every new tenant", "Before its ATO"],
    ["6", "Explain deviations", "With each report"],
  ];
  s.addTable([head(["#", "Required action", "Deadline"]), ...acts.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: i >= 2 && i <= 4, color: i >= 2 && i <= 4 ? HEX.navy : HEX.ink } }, { text: r[2] }])],
    tableOpts([0.5, 3.6, 2.8], { y: 1.5, fontSize: 13, rowH: [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  box(s, "Policies box", 7.75, 1.5, 5.0, 3.55, HEX.tealTint);
  icon(s, "FaListCheck", 8.0, 1.68, 0.6, HEX.teal);
  txt(s, "Policies head", "50 Microsoft 365 policies", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Policies list", bullets([
    "Entra ID: 20 of the baseline's 30; Exchange Online: 10 of 40",
    "Defender 8; Power Platform, SharePoint, Teams 4 each",
    "Google Workspace policies due December 1, 2026",
    "SaaS only: Azure subscriptions and on-premises AD are out",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Substantive", 5.3, 1.2, "FaClipboardCheck", HEX.amber, "Half the actions are administrative: ",
    "inventory, deployment and explanations take days. Actions 3 to 5, implementing the policies, keeping up and baselining new tenants, are architecture, and they're what the directive exists for.");
  sources(s, "Sources: CISA BOD 25-01 (December 17, 2024), Required Configurations page, Implementation Guidance (updated July 27, 2026); ScubaGear v1.8.0 baselines; ScubaGoggles releases. Book 11, Chapter 04.");
  narrate(s,
`BOD 25-01 is narrower and more concrete. CISA issued it on December 17, 2024, for every production cloud tenant with a finalized SCuBA baseline. It has six required actions: inventory the tenants by February 21, 2025; deploy the SCuBA tools and report by April 25; implement the mandatory policies by June 20; keep up with updates; baseline every new tenant before its ATO; and explain deviations with each report.

The mandatory list is a subset of the baselines. For Microsoft 365, CISA's Required Configurations page lists 50 policies; in Entra ID, that's 20 of the 30 in ScubaGear's baseline. Google Workspace is now in scope too, with its policies due December 1, 2026. CISA's guidance limits scope to software as a service, so Azure subscriptions are out even when they share the tenant, and on-premises Active Directory is untouched.

Inventory, deployment and explanations take days. Implementing the policies is architecture, and that's what the directive exists for.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What the mandates cover", "Two assessment tools answer two different questions");
  tag(s, "What");
  const cmp = [
    ["Question", "Does the tenant meet the federal baseline?", "How mature against Zero Trust guidance?"],
    ["Owner", "CISA; the tool BOD 25-01 names", "Microsoft staff; a community project, unsupported"],
    ["Version", "1.8.0, May 7, 2026; 2.0.0 in preview", "3.1.0, October 20, 2026; 364 tests"],
    ["Runs in", "Windows PowerShell 5.1", "PowerShell 7"],
    ["Finding", "Policy ID; SHALL or SHOULD", "Numeric test ID; High, Medium, Low"],
  ];
  s.addTable([head(["", "ScubaGear", "Zero Trust Assessment"]), ...cmp.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([1.2, 2.85, 2.85], { y: 1.5, fontSize: 12, rowH: [0.42, 0.62, 0.62, 0.62, 0.5, 0.62] }));
  box(s, "Overlap box", 7.75, 1.5, 5.0, 3.55, HEX.amberTint);
  icon(s, "FaFilter", 8.0, 1.68, 0.6, HEX.amber);
  txt(s, "Overlap head", "Where they overlap", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Overlap list", bullets([
    "Both: Entra ID identity; Defender threat policies",
    "ScubaGear only: Exchange, Teams, SharePoint, Power Platform",
    "Zero Trust Assessment only: Intune, Azure, Purview, SecOps",
    "22 of the 50 mandatory policies have no ZTA counterpart",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Both", 5.3, 1.2, "FaCodeBranch", HEX.teal, "Run both; reconcile at the control: ",
    "match findings through the tenant setting and its NIST SP 800-53 control, never tool to tool. Both outputs map where the tenant is weak, so keep them inside the boundary.");
  sources(s, "Sources: ScubaGear v1.8.0 README and baselines; PowerShell Gallery; Zero Trust Assessment 3.1.0 release, source and repository README; Microsoft Learn — Zero Trust Assessment. Book 11, Chapters 05 and 09.");
  narrate(s,
`Agencies run two free, read-only assessments of their Microsoft cloud, and often drop one because it covers identity. They answer different questions. ScubaGear is CISA's tool, and asks whether the tenant meets the federal baseline. Version 1.8.0 shipped May 7, 2026, with 2.0.0 in preview. Microsoft's Zero Trust Assessment asks how mature the environment is against Microsoft's guidance. Release 3.1.0 shipped October 20, 2026, with 364 tests. It's a community project maintained by Microsoft employees, not an official product, and no Microsoft support program covers it.

They overlap on Entra ID identity and, in 3.1.0, on Defender threat policies. Only ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform, and 22 of the 50 mandatory policies sit in those four products. Dropping ScubaGear leaves mandatory policies unassessed and stops the reporting the directive requires.

So run both, and reconcile at the control level: the tenant setting and the SP 800-53 control it supports.`,
  "Book 11, Chapter 05 — ScubaGear and Microsoft's Zero Trust Assessment; Chapter 09 (community project, not supported).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What the mandates cover", "Beyond Microsoft 365: networks, clouds, hypervisors");
  tag(s, "What");
  cards(s, "Estate", [
    ["FaDatabase", "One inventory", HEX.navy, HEX.navyTint, ["CM-8: no duplicate accounting of components", "BOD 23-01: discovery every 7 days", "Every cloud account and cluster resolves to one record"]],
    ["FaGlobe", "One naming authority", HEX.teal, HEX.tealTint, ["SC-20 to SC-22 apply to the whole service", "Each cloud and VMware ships its own private DNS", "No implicit trust from a VPN or flat segment"]],
    ["FaServer", "The hypervisor", HEX.amber, HEX.amberTint, ["A distinct threat class beneath every guest", "Assess the management plane as its own surface", "Bind identities by verified identifier, not name"]],
  ]);
  callout(s, "Providers", 5.3, 1.2, "FaCloud", HEX.red, "Each provider's tool answers for its own platform: ",
    "AWS's NIST standard supports “a subset” of requirements; Azure Policy is “only a partial view.” FedRAMP certifies the service; the agency authorizes its own use of it.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-8, SC-20 to SC-22); CISA BOD 23-01; Microsoft Threat Intelligence; AWS Security Hub; Azure Policy; FedRAMP Consolidated Rules for 2026. Book 11, Chapter 06.");
  narrate(s,
`Everything so far stops at the edge of Microsoft 365. Nothing on BOD 25-01's list covers infrastructure accounts, the agency network or the virtualized estate. So the whole-agency argument rests on the Zero Trust documents, and on the SP 800-53 controls every system security plan asserts.

Three things get reconciled before assessing. One inventory: CM-8 forbids duplicate accounting of components, and BOD 23-01 requires asset discovery every 7 days. One naming authority, because each cloud provider and VMware ships its own private DNS. And no implicit trust from any boundary: a site-to-site VPN, a default virtual network and a flat virtualized segment are the same mistake.

The hypervisor is a distinct threat class, so its management plane is assessed as its own surface, not inferred from its guests.

And every provider's tool answers for its own platform. AWS says its NIST standard supports a subset of requirements. Microsoft calls Azure Policy compliance only a partial view. FedRAMP certifies the service; the agency authorizes its own use of it.`,
  "Book 11, Chapter 06 — Beyond Microsoft 365: Networks, Other Clouds and Virtualized Estates.");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who owns the posture, not just the pillars");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["CIO and sponsor", "Scope, sequence, funding, tie-breaks"], ["Zero Trust program lead", "What the score covers; priority"], ["Authorizing official", "Residual risk; every POA&M"]]],
    ["FaClipboardCheck", "Set the rules", HEX.teal, HEX.tealTint, [["CISO and ISSO", "Evidence standard; tools; accounts"], ["Identity-plane owner", "The unified record, as Tier 0"], ["Control assessors", "Independence the AO sets"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Pillar owners", "Remediate through change control"], ["Assessment operators", "Run the tools; never edit results"], ["Security operations", "Drift; the assessment accounts"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THREE DECISIONS THAT OFTEN GO TO THE WRONG PERSON", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Omission with an end date", "the CISO, recorded in the configuration file with its expiry", HEX.teal],
    ["Exception with no end date", "the authorizing official: a standing risk acceptance", HEX.navy],
    ["A native tool's score", "the program lead admits it as evidence for its platform, never as the agency's score", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: OMB M-22-09; NIST SP 800-37 Rev. 2, Appendix D; CISA BOD 25-01; ScubaGear v1.8.0 configuration file documentation; OMB M-26-14. Book 11, Chapter 07.");
  narrate(s,
`Who owns it? Every pillar already has an owner. What most agencies lack is an owner for the posture itself. M-22-09 required each agency to designate a zero trust strategy implementation lead within 30 days, and many will give this role to that person.

The program lead owns the definition of the whole-agency score, what it covers and what it excludes, plus cross-pillar correlation and the assessment calendar. The lead decides priority but doesn't accept risk, and shouldn't also own the agency's relationship with its largest cloud vendor.

The CIO decides scope and sequence. The CISO sets the evidence standard and approves the tools and the accounts that run them. The authorizing official accepts residual risk and approves each plan of action and milestones.

Exceptions split on time. An omission with an expiration date is a CISO decision; one with no end date is a standing risk acceptance for the authorizing official. Pillar owners decide how to fix a finding, never that it doesn't need fixing.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust.");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to assess", "Close before you assess: assessors run at step five");
  tag(s, "How");
  steps(s, "Phase", [["Understand", "Gaps and root causes"], ["Design", "The closure pattern"], ["Implement", "Runbooks, integrations"], ["Govern", "Owners, POA&Ms"], ["Validate", "The assessors run here"], ["Authorize", "The AO decides"]],
    [HEX.grey, HEX.grey, HEX.grey, HEX.grey, HEX.tealTint, HEX.navyTint]);
  panels(s, [
    ["FaCubes", "Build these layers first", HEX.navy, HEX.navyTint, ["Naming, addressing and certificates", "Device and workload identity", "Legacy authentication retired in phases", "Exceptions governed, dated and owned"]],
    ["FaListCheck", "One response per finding", HEX.teal, HEX.tealTint, ["Configuration change: closes now", "Architectural work: an owner and a date", "Risk acceptance: the AO decides; marked Omitted", "No response recorded: the only failure"]],
  ]);
  callout(s, "Thermometer", 5.25, 1.25, "FaChartLine", HEX.amber, "A thermometer isn't a treatment plan: ",
    "ScubaGear measures deviation and closes none. Run it as the program before the architecture exists and it reports the same growing list to CISA, faithfully, indefinitely.");
  sources(s, "Sources: CISA BOD 25-01 and Implementation Guidance; NIST SP 800-37 Rev. 2; ScubaGear v1.8.0 Exchange Online baseline; Microsoft Learn — Zero Trust Assessment. Book 11, Chapter 08.");
  narrate(s,
`How do you get there? First, close before you assess. Agencies met BOD 25-01's early dates: tenants inventoried, ScubaGear deployed and reporting. Many now treat that as the answer. But ScubaGear measures deviation from a baseline; it doesn't close any, and neither does the Zero Trust Assessment. A thermometer that reports a fever every day isn't a treatment plan.

So the program's six-phase sequence puts the assessors at step five, as confirmation rather than discovery: understand, design, implement, govern, then validate, and then the authorizing official decides. That's the Risk Management Framework's own order: implement, assess, authorize, monitor.

Before validating, build the layers a finding depends on: naming and certificates, device and workload identity, a phased retirement of legacy authentication, and governed exceptions.

Meanwhile, route every current finding to exactly one response: a configuration change now, architectural work with an owner and a date, or a risk acceptance by the authorizing official. A finding with no response is the only failure.`,
  "Book 11, Chapter 08 — Close Before You Assess.");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to assess", "Run the assessment: pin it, record it, never edit it");
  tag(s, "How");
  rows(s, "Prep", "FIVE DECISIONS BEFORE THE FIRST RUN", [
    ["Scope", "The BOD 25-01 tenant inventory"],
    ["Host", "Dedicated Windows hosts inside the boundary"],
    ["Accounts", "Reader accounts; consent granted separately"],
    ["Output", "Controlled data, moved unaltered"],
    ["Logging", "Assessment accounts in the logging plan"],
  ], 1.92, 0.66, 0.56);
  sideBox(s, "Run", "FaFileShield", HEX.teal, HEX.tealTint, "THE RUN ITSELF", "The config file is the exception record", [
    "Annotations, omissions with expiry dates, exclusions",
    "Versioned in the repository; hashed with every run",
    "ScubaResults JSON is never renamed or edited",
    "Zero Trust Assessment: a skipped check isn't a pass",
  ], 14);
  callout(s, "Toolkit", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "Install the toolkit only from the program's repository: ",
    "never “pip install fmp.” The fmp package on the public index is an unrelated import formatter, and it would run someone else's code on a host holding tenant data.");
  sources(s, "Sources: ScubaGear v1.8.0 documentation (dependencies, configuration file, reports); BOD 25-01 Implementation Guidance; Zero Trust Assessment guide; OMB M-26-14; CISA Logging Reference Architecture; PyPI. Book 11, Chapter 09.");
  narrate(s,
`Then run the assessment and keep the evidence. Five things are decided before either tool touches a production tenant. Scope comes from the BOD 25-01 tenant inventory. The host is a dedicated Windows machine inside the authorization boundary, a separate one for each tool, because their dependencies conflict. Each tool gets a reader account, with consent granted once, separately. Output is handled as controlled data. And the assessment accounts belong in the M-26-14 Agency Logging Plan, due 90 days after CISA's August 20 reference architecture.

ScubaGear runs in Windows PowerShell 5.1. Its configuration file is the exception record: annotations, omissions with a rationale and an expiration date, and exclusions for emergency accounts. It's versioned in the repository, and its hash is recorded with every run, like the tool version. The results file is never renamed or edited, only hashed and copied.

The Zero Trust Assessment needs PowerShell 7 and can take more than 24 hours. And install the program's toolkit only from its own repository: a package named fmp on the public Python index is unrelated.`,
  "Book 11, Chapter 09 — Running the Assessment and Ingesting the Evidence (Before the first run; Running ScubaGear; Running the Zero Trust Assessment; Ingesting the Zero Trust Assessment).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to assess", "Ingest the evidence: four stages to OSCAL");
  tag(s, "How");
  steps(s, "Stage", [["Tool run", "Unaltered output"], ["Claim", "Provenance envelope"], ["Bundle and seal", "Deterministic, hashed"], ["OSCAL artifact", "Observations; POA&M items"]],
    [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.tealTint]);
  panels(s, [
    ["FaFingerprint", "One finding, traced", HEX.navy, HEX.navyTint, ["MS.AAD.1.1v1 fails; CISA maps it to CM-7", "Claim carries a SHA-256 lineage hash", "The bundle opens a POA&M item, then seals", "An assessor walks back without re-running"]],
    ["FaTriangleExclamation", "Limits, stated", HEX.red, HEX.redTint, ["Same inputs give a byte-identical bundle", "Interval evidence, not continuous capture", "No ScubaGoggles adapter: Workspace is a gap", "Compare ZTA scores on one version only"]],
  ]);
  callout(s, "Opinion", 5.25, 1.25, "FaLock", HEX.teal, "Evidence, not opinion: ",
    "an archived report is a point-in-time opinion. The same output, wrapped with its provenance and sealed into a bundle an assessor can rebuild months later, is evidence.");
  sources(s, "Sources: ScubaGear tool output schema and SP 800-53 mappings; NIST OSCAL Layers and Models Reference; ScubaGoggles v1.0.0; Zero Trust Assessment 3.1.0. Book 11, Chapter 09.");
  narrate(s,
`Most agencies run ScubaGear, save the HTML report, and reopen it when an assessor asks. The program instead treats each tool as an adapter, one input to one evidence chain, and leaves the tools exactly as their publishers ship them.

Each run flows through four stages. The tool writes its own unaltered output. Each result becomes a claim in a provenance envelope: who issued it, when it was extracted, and a lineage hash. Claims from one interval are assembled into a sealed bundle. And the bundle emits OSCAL assessment results and plan of action and milestones items.

Take MS.AAD.1.1v1, legacy authentication shall be blocked, which CISA maps to CM-7. Say it fails. The claim's lineage hash ties it to the raw result, and the bundle opens a POA&M item. Months later an assessor can rebuild the bundle, check its hash, and walk back to the raw output without re-running the tool.

The limits are stated. ScubaGear runs on an interval, not continuously. And there's no ScubaGoggles adapter yet, so Google Workspace is a gap.`,
  "Book 11, Chapter 09 — Running the Assessment and Ingesting the Evidence (The four-stage pipeline; A worked trace; Honest limits).");
}

// ------------------------------------------------------------------ How 4
{
  const s = D.content("How to assess", "From findings to a program the AO can see");
  tag(s, "How");
  const res = [
    ["Fail, Warning", "Failed, Investigate", "A finding"],
    ["N/A", "—", "A manual check, not a pass"],
    ["Error", "Error", "Absence of evidence; re-run"],
    ["—", "Skipped", "Absence of evidence, with reason"],
    ["Omitted", "—", "A decision with an owner and expiry"],
  ];
  s.addTable([head(["ScubaGear", "Zero Trust Assessment", "How the program reads it"]), ...res.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: HEX.navy } }, { text: r[2], options: { bold: i === 0, color: i === 0 ? HEX.red : HEX.ink } }])],
    tableOpts([1.7, 2.0, 3.2], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.55, 0.55, 0.55, 0.55, 0.55] }));
  box(s, "Score box", 7.75, 1.5, 5.0, 3.55, HEX.amberTint);
  icon(s, "FaTableList", 8.0, 1.68, 0.6, HEX.amber);
  txt(s, "Score head", "Score, reconcile, own", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Score list", bullets([
    "Severity 0 to 100; priority is severity over effort",
    "P1 at 50 or above, P2 at 30, P3 at 15, P4 above zero",
    "Both tools reconciled to the same SP 800-53 control",
    "Unfixed, unexcepted findings become POA&M items",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Drift", 5.3, 1.2, "FaArrowsRotate", HEX.navy, "Drift goes to the authorizing official: ",
    "a control that passed every interval and failed the last one is a change to an authorized system. Re-run after every remediation wave, so evidence, not a ticket, closes a finding.");
  sources(s, "Sources: ScubaGear tool output schema and configuration file; Zero Trust Assessment status code and terminology; NIST SP 800-53 (CA-5, CA-7, RA-7); SP 800-37 Rev. 2; BOD 25-01 Implementation Guidance. Book 11, Chapter 10.");
  narrate(s,
`Last, turn findings into a program. Read each result before counting it. Only ScubaGear's Fail and Warning, and the Zero Trust Assessment's Failed and Investigate, are findings. A skipped check isn't a gap and isn't a pass. It's absence of evidence, recorded with the reason, which is often a license or a government-cloud feature that isn't available in the boundary.

The program scores findings with a documented method: severity from 0 to 100, priority as severity divided by effort, and buckets from P1 at 50 or above down to P4. Quick wins go into the next change window; major projects go onto a pillar owner's roadmap. Both tools' findings are reconciled against the same SP 800-53 control, so two pieces of evidence become one finding for one owner.

Anything not fixed and not excepted becomes a plan of action and milestones item, which the authorizing official approves. Drift between intervals goes to the authorizing official too, not only to security operations. And re-run after every remediation wave, so a finding is closed by evidence, not by a ticket status.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts: From Findings to a Program.");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to assess", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaUserCheck", "Name the posture owner", "A program lead separate from every cloud provider relationship", HEX.navy, HEX.navyTint],
    ["FaSitemap", "Reconcile before scoring", "The network, every cloud and the hypervisors to one record", HEX.teal, HEX.tealTint],
    ["FaListCheck", "Close BOD 25-01 findings first", "Mandatory policies before maturity; Workspace by December 1, 2026", HEX.amber, HEX.amberTint],
    ["FaScaleBalanced", "Put exceptions in the file", "With expirations; standing ones go to the authorizing official", HEX.red, HEX.redTint],
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
    "find out which pillar evidence can be re-run without the operator's help, since every no marks the adoption boundary, and put the assessment hosts and accounts in the Agency Logging Plan now.");
  sources(s, "Sources: CISA BOD 25-01 and Required Configurations; ScubaGear v1.8.0 configuration file; NIST SP 800-37 Rev. 2; OMB M-26-14. Book 11, Chapters 02, 06, 07, 08, 09 and 10.");
  narrate(s,
`So, four decisions.

Name an agency-level owner of the Zero Trust posture, separate from every cloud provider relationship.

Reconcile the network, every cloud and the virtualization estate to one authoritative record before scoring any of them.

Close the BOD 25-01 mandatory findings before measuring maturity, with Google Workspace due December 1, 2026.

And move every exception into the versioned configuration file, with an expiration, and route each standing one to the authorizing official.

The next step needs no procurement. Find out, pillar by pillar, which evidence can be re-run without the operator's help, because every no is the adoption boundary. And put the assessment hosts and accounts in the Agency Logging Plan now.

Unify first, assess second, and let named people make the decisions the evidence supports. Book 11 has the detail, every claim footnoted. Thank you.`,
  "Book 11, Chapters 02, 06, 07, 08, 09 and 10; Appendix A.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Executive Order 14028 (May 12, 2021).  ·  OMB M-22-09 (January 26, 2022); M-26-14 (May 22, 2026; rescinds M-21-31); OMB memoranda index.",
    "CISA: Zero Trust Maturity Model v2.0 (April 2023) and its archived landing page; BOD 23-01; BOD 25-01 (December 17, 2024), Required Configurations, Implementation Guidance (July 27, 2026); Logging Reference Architecture.",
    "CISA SCuBA: ScubaGear v1.8.0 (README, baselines, parameters, permissions, configuration file, reports, output schema, SP 800-53 mappings); ScubaGoggles v1.0.0; ScubaConnect.",
    "Microsoft: Zero Trust Assessment 3.1.0 (release, source, repository guide); Microsoft Learn — Zero Trust Assessment, continuous access evaluation, PIM, emergency access, government feature availability.",
    "NIST SP 800-207; SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-37 Rev. 2; SP 1800-35; OSCAL.  ·  FedRAMP Consolidated Rules for 2026 and Key Security Indicators.",
    "Cyber Safety Review Board, Summer 2023 Exchange Online intrusion (March 20, 2024).  ·  CISA and FBI AA23-039A (ESXiArgs).  ·  Microsoft Threat Intelligence and NVD, CVE-2024-37085.",
    "Broadcom vSphere and VMware Cloud Foundation guidance.  ·  AWS Security Hub CSPM NIST SP 800-53 standard.  ·  Azure Policy NIST SP 800-53 Rev. 5 initiative.  ·  PyPI “fmp” project page.",
    "Full footnotes with links and access dates: Book 11, every chapter (whalermike.github.io/modernization-workbook/docs/books/b11-zero-trust/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
