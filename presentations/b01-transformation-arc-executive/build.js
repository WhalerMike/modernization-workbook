// Book 01 — The Transformation Arc: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: executive sponsors, CIOs, CISOs and authorizing officials. Decision-centered: each decision slide
// names the decision, its owner and when it's needed. No configuration detail.
// Build:  node presentations/b01-transformation-arc-executive/build.js presentations/b01-transformation-arc-executive/B01_Transformation_Arc_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b01-transformation-arc/, named in the notes.
const D = require("../_build/lib.js")({
  book: "Book 01",
  title: "The Transformation Arc — Executive Briefing",
  footer: "Federal Modernization Workbook  ·  Book 01 The Transformation Arc  ·  Executive briefing",
});
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B01_Transformation_Arc_Executive.pptx";

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
  perSlide.push(`${words} (${((words * 60) / WPM / 60).toFixed(1)} min)`);
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
    { text, options: { fontSize: 14, color: HEX.ink } },
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
// A row of numbered step boxes across the slide.
const strip = (s, prefix, steps, y, h, tints, gap) => {
  const g = gap || 0.125, w = (12.15 - g * (steps.length - 1)) / steps.length;
  steps.forEach((f, i) => {
    const x = 0.6 + i * (w + g);
    box(s, `${prefix} ${i + 1}`, x, y, w, h, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: f[1], options: { bold: true, color: HEX.navy, fontSize: 14, breakLine: true } },
      { text: f[2], options: { fontSize: 12, breakLine: !!f[3] } },
      ...(f[3] ? [{ text: f[3], options: { fontSize: 11.5, bold: true, color: HEX.teal } }] : []),
    ], { x: x + 0.1, y: y + 0.05, w: w - 0.2, h: h - 0.1, valign: "middle" });
  });
};
// Two tinted panels side by side under a strip.
const panels = (s, prefix, list, y, h) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `${prefix} ${i + 1}`, x, y, 6.0, h, p[3]);
  icon(s, p[0], x + 0.2, y + 0.08, 0.56, p[2]);
  txt(s, `${prefix} head ${i + 1}`, p[1], { x: x + 0.95, y: y + 0.08, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(p[4], 13.5), { x: x + 0.25, y: y + 0.7, w: 5.6, h: h - 0.76, paraSpaceAfter: 2 });
});

const S_WHY = "Why it's hard", S_WHAT = "What changes", S_WHO = "Who leads", S_HOW = "How to deliver";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, "Who Leads the Governance Rebuild?", "Book 01 — The Transformation Arc  ·  Executive briefing");
  D.agenda(s, 0.8, 4.75, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook  ·  Executive briefing", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for sponsors, CIOs, CISOs and authorizing officials", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.5, w: 8.5, h: 0.85, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 01 of the Federal Modernization Workbook, The Transformation Arc. It runs about thirty minutes, and it's for the people who sponsor, fund, secure and authorize the move from a domain-joined client and server estate to cloud identity, cloud device management and governed hybrid operations: executive sponsors, CIOs, CISOs and authorizing officials.

The book's argument fits in three sentences. For twenty years Active Directory quietly did governance that nobody wrote down, so modernization is a governance rebuild, not a platform swap. The estate has to be analyzed before anything moves, and the work delivered in gated phases with a rollback at every step. And leadership's job is to conduct the orchestra, not to play the instruments.

I'll take four questions in order. Why modernization is so hard. What changes across the platform, identity, policy, network services, compute and access. Who leads the transformation. And how to analyze the estate, turn the analysis into delivered change, and follow a gated roadmap to the retirement of Active Directory.

There's no configuration on these slides. Each decision slide names the decision, who owns it, and when it's needed.`,
  "Book 01, Chapter 01 — Why Modernization Is Hard; Chapter 02 — The Problem: Governance Hidden in the Directory; Chapter 09 — Who Leads the Transformation; book index.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content(S_WHY, "Every new mandate assumes a foundation never built");
  tag(s, "Why");
  rows(s, "Eras", "FOUR ERAS: EACH SOLVED A PROBLEM, NONE KEPT ONE TRUTH", [
    ["Mainframe", "One machine held the truth and enforced access"],
    ["Distributed", "A database and a directory in every region"],
    ["Consolidation", "Data centers closed; inspection stacked inline"],
    ["Breaking point", "Several records per person; none authoritative"],
  ], 1.88, 0.82, 0.7);
  sideBox(s, "Cascade", "FaArrowDownWideShort", HEX.red, HEX.redTint, "Each step waits on the last", [
    "Zero Trust needs authoritative cloud identity",
    "Cloud identity needs a clean directory",
    "A clean directory needs governed groups",
    "Governed groups need an owner: where many agencies are stuck",
  ]);
  decision(s, "Make ownership the first deliverable: name the executive sponsor, the steward who runs the program office, and the authorizing official before any change is planned",
    "CIO and agency leadership", "Phase 0 entry, before the assessment");
  sources(s, "Sources: OMB, Federal Data Center Consolidation Initiative and 25 Point Plan (2010); OMB M-22-09; CISA BOD 25-01; OMB M-26-14. Book 01, Chapters 01, 09 and 12.");
  narrate(s,
`Start with how the estate got here. Federal IT reached its current shape in four eras, and each solved a real problem.

The mainframe held all the data and also enforced access to it: one truth, in one box. Distributed systems put a database and a directory in every region, and nobody replaced that single source of truth. From 2010, OMB set a target of closing at least eight hundred data centers, and agencies stacked inspection devices between field offices and the systems they depended on. Then email moved to Microsoft 365 and workloads spread across clouds, while identity stayed in regional domains. Now the same person can appear as several records, and no one can say which one is authoritative.

That's why modernization stalls. Each step assumes the one before it is finished. Zero Trust assumes authoritative cloud identity. Cloud identity assumes a clean directory. A clean directory assumes governed groups. And governed groups assume someone owns them, which is where many agencies are stuck.

Meanwhile the mandates arrive with dates: M-22-09's Zero Trust goals for fiscal 2024, BOD 25-01's baselines by June 20, 2025, and M-26-14's logging reset in May 2026. Each assumes a foundation the estate never built.

So the first decision is about ownership, not technology. Before anything is planned, name the executive sponsor, the steward who runs the program office, and the authorizing official. The roadmap makes that the entry condition for its first phase.`,
  "Book 01, Chapter 01 — Why Modernization Is Hard (How the estate got here; The cascade: each fix assumes the last one is done); Chapter 09 — Who Leads the Transformation (What to do next, item 1); Chapter 12 — The Migration Roadmap (Phase 0 — Pre-flight, entry).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content(S_WHY, "Active Directory was the governance nobody wrote down");
  tag(s, "Why");
  rows(s, "Placement", "ONE OU PLACEMENT DID FIVE THINGS AT ONCE", [
    ["Delegation", "Handed the account to that branch's administrators"],
    ["Policy", "Applied every Group Policy linked along the path"],
    ["Groups", "Fed tools that built membership from position"],
    ["Authority", "Bound the account to the branch's delegation"],
    ["Audit", "Drew a boundary of operational responsibility"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "Eleven", "FaPlugCircleXmark", HEX.red, HEX.redTint, "Eleven categories, not four", [
    "Plans count users, computers, groups and policies",
    "Missed: service accounts, SPNs, LDAP, trusts",
    "Missed: DNS, DHCP, certificates, RADIUS",
    "The failures are silent and surface months later",
  ]);
  decision(s, "Scope the program as a governance transformation across all eleven categories, not a users-and-groups project; retiring AD is the agency's decision",
    "Executive sponsor and CIO", "When scope and funding are set");
  sources(s, "Sources: Microsoft Learn — What's new in Windows Server 2025; OU delegation; Group Policy overview; cloud-first identity guidance. Book 01, Chapters 02 and 09.");
  narrate(s,
`Chapter 02 states the problem precisely. Active Directory shipped with Windows 2000 as an identity directory. Over twenty-five years every Windows-era service wired itself into it, because it was the only enterprise-wide, governed, replicated namespace available. Nobody wrote down how much governance it carried.

The OU tree wasn't a folder system. Placing one user in a branch handed the account to that branch's delegated administrators, applied every Group Policy linked along the path, fed the tools that built groups from position, bound the account to the branch's delegation, and drew an audit boundary. One act, five effects. Entra ID has no OU tree, so each effect has to be rebuilt on purpose.

Most migration plans count users, computers, groups and Group Policy. The program's inventory counts eleven categories, adding service accounts and service principal names, DNS and DHCP, certificate services, RADIUS, LDAP-bound applications and trust relationships. Those fail silently: a certificate that doesn't renew, an application whose bind account was deleted with the domain. No log line says governance has failed.

Microsoft hasn't deprecated Active Directory. It still supports and enhances it, while pointing customers toward a cloud-first model reached in phases. So there's no vendor deadline; retiring it is the agency's decision.

That makes scope a decision for the sponsor and the CIO: fund this as a governance transformation across all eleven categories, not a users-and-groups project, when scope and funding are set.`,
  "Book 01, Chapter 02 — The Problem: Governance Hidden in the Directory (What shipped with Windows 2000; What breaks when AD goes away; Silent failure is the real enemy; The OU tree was the governance tree; Why naive migrations fail); Chapter 09 (Decision rights: program scope, funding and sequence).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content(S_WHY, "Five things must be true before the target holds");
  tag(s, "Why");
  rows(s, "Prereq", "FIVE PREREQUISITES: THE PROGRAM'S READING OF FEDERAL GUIDANCE", [
    ["1  One identity", "Exactly one record per user, device and account"],
    ["2  Governed first", "Rationalize groups and owners before migrating"],
    ["3  Continuous", "Access re-evaluated as conditions change"],
    ["4  Telemetry", "Sign-in events feed governance, not just response"],
    ["5  Automatic", "Checks run continuously, not by manual review"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "Sessions", "FaKey", HEX.navy, HEX.navyTint, "Sessions became tokens", [
    "Kerberos ticket: 10 hours, renewable for 7 days",
    "Entra token: one hour; up to 28 hours with CAE",
    "Hybrid devices need line of sight to a DC",
    "Portland to Washington: about 45 ms round trip",
  ]);
  callout(s, "Physics", 5.3, 1.2, "FaLightbulb", HEX.teal, "Bandwidth is volume; latency is distance.  ",
    "No purchase removes the domain controller dependency. The durable answer is to remove it: Entra join, not hybrid join, as the end state.");
  sources(s, "Sources: NIST SP 800-207; OMB M-22-09; CISA ZTMM v2.0; OMB M-26-14; RFC 4120; ITU-T G.114; Microsoft Learn — Kerberos lifetimes, CAE, hybrid join. Book 01, Chapter 01.");
  narrate(s,
`What has to be true? The workbook reads federal Zero Trust guidance as requiring five things. No single document publishes this list; it's the program's synthesis of SP 800-207, M-22-09, CISA's maturity model and M-26-14.

One: a single authoritative source of identity, one record per user, device and account. Two: a governed directory, rationalized before the move to a flat cloud directory, not after. Three: continuous verification, not one-time sign-in. Four: telemetry used for management, feeding governance and not only incident response. And five: governance that runs automatically, because manual review can't keep up with a hybrid estate.

The third is where the old world and the new differ most. In Active Directory a user signs in once and gets a ticket that lasts ten hours, renewable for seven days. Entra ID checks tokens against Conditional Access: an access token lasts one hour by default, or up to twenty-eight hours under continuous access evaluation, which revokes it within about fifteen minutes of an event such as a disabled account.

Distance matters, but narrowly. What it hurts is the operations that need a domain controller: hybrid-joined devices need line of sight for sign-in, password changes and policy. Light in fiber from Portland, Oregon to Washington takes about forty-five milliseconds round trip, and bandwidth doesn't change that. The durable answer is to remove the dependency.`,
  "Book 01, Chapter 01 — Why Modernization Is Hard (The session problem; What distance does and doesn't cost; The physics that can't be negotiated; What has to be true; What the book does about it).");
}

// ------------------------------------------------------------------ What 1: platform
{
  const s = D.content(S_WHAT, "Platform: one governed host, one authoritative writer");
  tag(s, "What");
  cards(s, "Platform", [
    ["FaCodeBranch", "One writer", HEX.navy, HEX.navyTint, ["One repository of signed, versioned decisions", "A standby for recovery, never a second writer", "Standard components; not a product"]],
    ["FaPeopleArrows", "Decide apart from act", HEX.teal, HEX.tealTint, ["Governance validates and signs; never touches a target", "Execution runs authorized plans; decides nothing", "Separate accounts, credentials and logs"]],
    ["FaShieldHalved", "A Tier 0 asset", HEX.red, HEX.redTint, ["Reads the forest; writes to cloud identity", "Hardened and logged centrally", "Target posture: gated actuation, a person approves"]],
  ]);
  decision(s, "Stand up the platform host as the only authoritative writer, protected as Tier 0, and record its standby model and actuation stage in the decision log",
    "Program office, under the steward", "Phase 0; Gate G0 needs it running");
  sources(s, "Sources: Microsoft Learn — Windows Server releases; AD tier model; enterprise access model. NIST SP 800-207; CISA ZTMM v2.0; OMB M-26-14. Book 01, Chapters 03, 09, 12.");
  narrate(s,
`Now what changes, starting with the platform: one place where every decision is written down, signed and replayable.

The book's reference design runs every analysis, plan, delivery and evidence step on one Windows Server 2025 host, with a standby for recovery. The property that matters is a single authoritative writer: two writers would diverge. Every change is a signed commit, never a portal click. It's built from standard components; it isn't a product.

Two design rules matter at this level. First, governance and execution never mix. The governance layer validates plans, signs them and writes the audit trail, but never touches a target. The execution layer runs authorized plans and decides nothing. They run under separate identities, because a component that both decides and acts can cover its tracks.

Second, the host is a control-plane asset. It reads the forest and writes to cloud identity, so it's treated as Tier 0: hardened, and logged centrally under M-26-14. The program's target posture for federal production is gated actuation. The host proposes a correction, and a person approves it before it runs.

The decision belongs to the program office, under the steward: stand up the host as the only authoritative writer, protected as Tier 0, and record the standby model and the actuation stage in the decision log. Gate G0 needs it operational by the end of Phase 0.`,
  "Book 01, Chapter 03 — The Platform Foundation (The architectural claim; Why one host; Separation of governance and execution; The control plane over the data planes; Operational properties; What the platform host is not; Build and decision records); Chapter 09 (Decision rights: target architecture and the authoritative repository); Chapter 12 (Phase 0, Gate G0).");
}

// ------------------------------------------------------------------ What 2: identity
{
  const s = D.content(S_WHAT, "Identity: the attributes have to be true first");
  tag(s, "What");
  rows(s, "Stamp", "ONE HR-SOURCED STAMP, FIVE OUTCOMES, NO PORTAL CLICKS", [
    ["Groups", "Membership by rule, not by hand"],
    ["Delegation", "Administrative units scope who manages whom"],
    ["Access", "Conditional Access targets those groups"],
    ["Licenses", "Follow group membership"],
    ["Drift", "Every user's attributes checked against HR"],
  ], 1.88, 0.66, 0.56);
  sideBox(s, "JML", "FaUserCheck", HEX.teal, HEX.tealTint, "Joiner, mover, leaver", [
    "HR creates, moves and separates the worker",
    "Groups, scope and licenses follow on their own",
    "Only HR provisioning writes access attributes",
    "A token is only as true as the attributes behind it",
  ]);
  decision(s, "Decide what each authoritative worker attribute means and make HR provisioning its only writer; give contractors an authoritative source of their own",
    "HR (meaning); identity engineering (flow)", "Before rollout: G1 needs the HR feed");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; Microsoft Learn — dynamic membership groups, administrative units, lifecycle workflows. Book 01, Chapters 04, 09 and 12.");
  narrate(s,
`Identity comes first in the chain, because policy, devices and access all target identity groups.

The OU tree carried delegation, policy scope and accountability in one structure. A flat cloud directory has none of that until the program writes it down. The book rebuilds it with four Microsoft mechanisms bound into one model: attributes, dynamic groups, administrative units and Conditional Access. Setting a user's attributes from the HR record produces every downstream effect: group membership, delegated scope, policy targeting, licenses and drift visibility. One stamp, five outcomes.

That only works if the attributes are true. M-22-09 requires centralized identity management for agency users. For the workforce, the authoritative source is the HR system of record. HR owns who works for the agency, where they sit and who they report to. A dynamic rule is only as trustworthy as whoever can write the attribute it reads, so the help-desk and self-service write paths are removed, and HR provisioning is the only writer.

Then joiner, mover and leaver run on their own. Tokens don't fix a wrong model; they sign broken authorizations efficiently.

So HR decides what the authoritative attributes mean, and identity engineering decides how they flow. Contractors need an authoritative source of their own. Gate G1 requires the HR feed working before any rollout.`,
  "Book 01, Chapter 04 — Identity Transformation (The identity claim; Why the attributes must be true first; The four mechanisms; Protect the write path; HR-driven lifecycle; From sessions to tokens); Chapter 09 (HR and the contractor sources; Decision rights: authoritative worker attributes); Chapter 12 (Phase 1, Gate G1; Common failure modes).");
}

// ------------------------------------------------------------------ What 3: policy
{
  const s = D.content(S_WHAT, "Policy: regenerate Group Policy; don't copy it");
  tag(s, "What");
  const map = [
    ["Device configuration, baselines", "Intune profiles and security baselines"],
    ["Software, scripts, drive mappings", "Intune apps and scripts; Teams, SharePoint, OneDrive"],
    ["Access control", "Conditional Access"],
    ["Server configuration", "Azure machine configuration, through Arc"],
  ];
  leftTable(s, ["What Group Policy did", "Where it goes"], map.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.95, 3.95], [0.42, 0.78, 0.78, 0.78, 0.78], 13);
  sideBox(s, "Rules", "FaListCheck", HEX.amber, HEX.amberTint, "Four rules for every change", [
    "One owning layer for each setting",
    "Prefer require to block",
    "Plan, simulate, report-only pilot, production",
    "Emergency accounts excluded from blocking policies",
  ]);
  decision(s, "Set the control requirements every target surface must meet: the Conditional Access baseline, MFA strength and logging",
    "CISO", "Phase 1; G1 needs the baseline enforced");
  sources(s, "Sources: Microsoft Learn — cloud-native endpoint planning; policy conflicts; emergency access accounts. CISA BOD 25-01; SCuBA Entra ID baseline. Book 01, Chapters 05, 09, 12.");
  narrate(s,
`Policy is next. Group Policy was Active Directory's most ambitious delivery system, and its most network-bound: a client applies it only when it can reach a domain controller. A cloud-native endpoint gets its configuration from the cloud instead.

The replacement is several surfaces: Intune for devices, Conditional Access for access control, and Azure machine configuration, through Arc, for servers, because Intune doesn't manage Windows Server.

The program's pattern is regenerate, not copy. Porting a fifty-setting policy as fifty modern settings carries forward dead weight and old conflicts. Microsoft's own recommendation is to start new rather than migrate.

Four rules govern every change. Each setting has exactly one owning layer. Require is preferred to block, because a bad block locks users out and a bad require adds a step you can fix; blocks are kept for cases such as legacy authentication, which the federal baseline demands. Every change passes plan validation, a simulated tenant, a report-only pilot, and only then production. And the emergency access accounts are excluded from every blocking policy.

The decision is the CISO's: the control requirements every surface must meet, meaning the Conditional Access baseline, MFA strength and logging. Gate G1 needs that baseline enforced, with no user outside the MFA requirement except the documented emergency accounts.`,
  "Book 01, Chapter 05 — Policy Transformation (The policy claim; The target surfaces; Why one-to-one mapping fails; Prefer require to block; Conflict resolution; Break-glass exclusions and testing); Chapter 09 (Decision rights: control requirements); Chapter 12 (Phase 1, Gate G1).");
}

// ------------------------------------------------------------------ What 4: network services
{
  const s = D.content(S_WHAT, "Network services: DNS, DHCP and IPAM move together");
  tag(s, "What");
  cards(s, "Services", [
    ["FaGlobe", "DNS", HEX.navy, HEX.navyTint, ["Every domain controller sits in the name path", "AD can't retire until DNS moves", "The domain's own zones move last"]],
    ["FaRoute", "DHCP", HEX.teal, HEX.tealTint, ["AD authorization stops unauthorized Windows servers", "It doesn't stop rogue devices", "On-premises subnets still need governed DHCP"]],
    ["FaSitemap", "IPAM", HEX.amber, HEX.amberTint, ["Often a spreadsheet one person keeps", "One authority, on-premises and cloud", "DNS and DHCP derive their records from it"]],
  ]);
  decision(s, "Fund DNS, DHCP and IPAM inside the core program, with one IPAM authority, not as a later phase that never comes",
    "Executive sponsor and CIO", "In scope now; pilot zones move in Phase 2");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (SC-20 to SC-22, CM-8); OMB M-22-09; Microsoft Learn — AD-integrated DNS, DHCP authorization. Book 01, Chapters 06 and 12.");
  narrate(s,
`Network services are the part organizations most often defer, because DNS, DHCP and address management still work. That's exactly how they keep the old directory alive.

The three form one surface. DNS usually lives in zones integrated with Active Directory, so every domain controller sits in the name-resolution path, and Active Directory can't retire until DNS moves. DHCP servers are authorized in the forest, but that check is Windows policing itself: it stops an unauthorized Windows server, not a rogue device. And address management, in many organizations, is a spreadsheet one person maintains. Without it, DNS and DHCP drift.

So the program moves them together. One governed IPAM authority covers the whole address surface, on-premises and cloud, and DNS and DHCP derive their records from it. Disagreement between them is drift, and there's no DNS-only run. Federal controls point the same way: SP 800-53 treats secure name resolution and the component inventory as controls of their own.

The common failure is to modernize identity and policy and leave these for a Phase 2 that rarely happens. A forest that still hosts DNS has not been retired.

That makes it a scope and funding decision for the sponsor and the CIO: put DNS, DHCP and IPAM in the core program now, with one IPAM authority. The pilot division's zones move in Phase 2.`,
  "Book 01, Chapter 06 — Network Services: DNS, DHCP and IPAM (The services claim; Why these three, why together; DNS; DHCP; IPAM; Why \"Phase 2\" never comes); Chapter 12 (Phase 2; Phase 4; Common failure modes, item 3).");
}

// ------------------------------------------------------------------ What 5: compute
{
  const s = D.content(S_WHAT, "Compute: the domain join is the last thing to go");
  tag(s, "What");
  rows(s, "Ends", "WHERE EACH KIND OF MACHINE ENDS", [
    ["User PCs", "Entra joined and managed in Intune"],
    ["Hybrid joined", "A waypoint with a cut date, never the end"],
    ["Servers", "Governed through Azure Arc; unjoin per workload"],
    ["Kerberos apps", "Migrate, retire, or island with an end date"],
  ], 1.88, 0.82, 0.7);
  sideBox(s, "Gates", "FaServer", HEX.amber, HEX.amberTint, "Before a machine leaves", [
    "Every SPN on a server resolved first",
    "NTLM flows removed, or dated exceptions",
    "Compute stays with its data until round trips drop",
    "Hybrid to Entra join needs a reset: time it to refresh",
  ]);
  decision(s, "For each Kerberos-bound application, its owner decides migrate, retire or island; the AO sets the end date of every island and NTLM exception",
    "Application owners; the AO for end dates", "Before its servers unjoin; all by G4");
  sources(s, "Sources: Microsoft Learn — Entra joined vs. hybrid joined; Azure Arc-enabled servers; NTLM deprecation; Windows Autopilot. Book 01, Chapters 07, 09, 10 and 12.");
  narrate(s,
`Compute. Once identity, policy and network services have moved, domain-joined machines are the largest remaining dependency. A machine leaves only when its identity, its policy and its trust have each been replaced, so the domain join is the last thing to go, not the first.

User PCs end Entra joined and managed in Intune, and every hardware refresh should arrive that way. Hybrid join is a transition: there's no supported way to convert a hybrid-joined PC without resetting it, so time that reset to a refresh. A program that leaves devices hybrid joined hasn't finished.

Servers take a different road. Azure Arc projects them into Azure for policy and posture while they stay where they are, and leaving the domain is a separate decision for each workload.

What holds servers in the domain is applications. Every Kerberos service principal name is an application, and each gets one of three answers: migrate to modern authentication, retire it, or, as a last resort, keep it on a small documented island with an end-of-life date. NTLM is resolved in the same pass. And an application's compute stays with its data until its round trips are reduced, because distance multiplies with every call.

Only an application's owner can make that call and sign off its cutover. Keeping legacy authentication open is a risk acceptance, so the authorizing official sets every island and NTLM end date, and every name is resolved by Gate G4.`,
  "Book 01, Chapter 07 — Compute Transformation (The compute claim; The device states; Three migration patterns for user PCs; Servers — the Arc path; Where compute runs; Kerberos and SPN retirement); Chapter 09 (Application owners; Decision rights: application cutover; legacy authentication and NTLM end dates); Chapter 12 (Gate G4).");
}

// ------------------------------------------------------------------ What 6: access plane
{
  const s = D.content(S_WHAT, "Access: log in to applications, not networks");
  tag(s, "What");
  cards(s, "Access", [
    ["FaFingerprint", "The proof", HEX.navy, HEX.navyTint, ["Phishing-resistant MFA for staff, contractors, partners", "FIDO2, passkeys, Windows Hello, PIV by certificate", "SMS and voice not permitted"]],
    ["FaDoorOpen", "Decision and edge", HEX.teal, HEX.tealTint, ["Conditional Access decides each request", "Per-application access instead of VPN", "CAE revokes a live session on critical events"]],
    ["FaUserShield", "Privilege", HEX.red, HEX.redTint, ["No standing admin rights in Entra or Azure", "A vault for what can't be just-in-time", "Two or more break-glass accounts, tested every 90 days"]],
  ], 13);
  decision(s, "Make phishing-resistant MFA the end state for everyone, with FIDO2 or certificates for Tier 0 first, and move certificate issuance off AD DS before AD retires",
    "CISO", "Tier 0 from Phase 1; issuance by G4");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; CISA BOD 25-01; CISA ZTMM v2.0; CISA SASE guidance (2026); Microsoft Learn — CBA, PIM, CAE. Book 01, Chapters 08 and 12.");
  narrate(s,
`The access plane. When Active Directory retires, being inside the network stops meaning anything. M-22-09 says users should log in to applications rather than networks, every application should be treated as internet-accessible, and multifactor authentication belongs at the application layer, not in a VPN.

The replacement has four surfaces: Zero Trust as the model, Conditional Access deciding each request, a secure access service edge replacing the VPN, and phishing-resistant authentication as the proof. M-22-09 requires it for staff, contractors and partners, and BOD 25-01 makes blocking legacy authentication, and phishing-resistant MFA for all users, mandatory. FIDO2 keys, passkeys, Windows Hello, and PIV or CAC cards through certificate-based authentication qualify; SMS and voice don't.

Two consequences need an executive eye. First, smart-card sign-in is anchored in Active Directory today. The card and PIN stay, and validation moves to Entra ID. But issuance is a separate decision: an enterprise certificate authority depends on AD DS, and Microsoft's cloud PKI covers only Intune-managed devices, so issuance needs a successor before Active Directory retires. Second, privilege: every human admin assignment becomes eligible and time-bound, standing credentials go through a vault, and emergency accounts are tested at least every 90 days.

The CISO decides: phishing-resistant MFA as the end state for everyone, with FIDO2 or certificate-based authentication for Tier 0 administrators first, opening in Phase 1, and certificate issuance moved off AD DS by Gate G4.`,
  "Book 01, Chapter 08 — The Access Plane (The access claim; The model — Zero Trust; From sessions to tokens; SASE; Phishing-resistant MFA; Cloud certificate-based authentication; Privileged access management; Continuous access evaluation); Chapter 09 (Decision rights: control requirements); Chapter 12 (Phase 1; Gate G4).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = D.content(S_WHO, "Microsoft supplies the instruments, not the orchestra");
  tag(s, "Who");
  const inst = [
    ["Cloud identity", "What the organizational structure becomes"],
    ["Device management", "Which policies map to which profiles"],
    ["Hybrid management", "Which servers retire or move under Arc"],
    ["Conditional Access", "Which users need which policies"],
    ["Just-in-time privilege", "Which roles, if any, stay standing"],
    ["Assessment tools", "What to do with the findings"],
  ];
  leftTable(s, ["Instrument", "What it doesn't decide"], inst.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.6, 4.3], [0.4, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6], 13);
  sideBox(s, "Policy", "FaLandmark", HEX.navy, HEX.navyTint, "Federal policy already says", [
    "M-22-09: the whole C-suite aligned and committed",
    "M-22-09: a zero trust lead named within 30 days",
    "M-19-17: an agency-wide ICAM governance structure",
    "None says who decides when a forest retires",
  ]);
  decision(s, "Confirm who already holds the zero trust implementation lead and ICAM governance roles, and decide whether the steward role goes to one of them",
    "Executive sponsor and CIO", "Before Phase 0");
  sources(s, "Sources: OMB M-22-09; OMB M-19-17; NIST SP 800-37 Rev. 2; Microsoft Learn — cloud-first identity guidance, Entra licensing. Book 01, Chapter 09.");
  narrate(s,
`Who leads? The book's framing is simple. Microsoft provides the instruments; the program provides the orchestra.

Cloud identity, device management, Conditional Access, privileged identity management and the assessment tools are each excellent. But look at what each one doesn't decide. Cloud identity doesn't decide what your organizational structure should become. Hybrid management doesn't decide which servers retire. The assessment tools don't decide what to do with the findings. Every entry in that column is a decision someone has to own.

And no vendor deadline forces it, so without leadership organizations migrate in pieces and finish with a surface that can't answer last year's audit questions. And the program isn't a product: it needs no license of its own, but the services it orchestrates do, from Entra ID P1 for Conditional Access to Entra ID Governance for lifecycle workflows.

Federal policy already says this belongs to more than the IT shop. M-22-09 says the whole C-suite must be aligned and committed, and it required each agency to designate a zero trust implementation lead within 30 days. M-19-17 requires an agency-wide identity governance structure that includes HR, general counsel, privacy and acquisition.

So the first Who decision, for the sponsor and the CIO before Phase 0: confirm who already holds those roles, and decide whether one of them becomes the program's steward.`,
  "Book 01, Chapter 09 — Who Leads the Transformation (The framing that matters; What the program is — and is not; The instruments, revisited; Who leads, decides and does the work; The program office and the steward; What to do next, item 1).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = D.content(S_WHO, "One decider per decision; the AO signs for risk");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Sponsor and CIO", "Scope, funding, sequence; AD retirement"], ["Authorizing official", "Residual risk, exceptions, boundaries"], ["Steward", "The plan; gates G0, G1, G4"]]],
    ["FaClipboardCheck", "Set the rules", HEX.teal, HEX.tealTint, [["CISO", "Control requirements and evidence"], ["HR", "What the worker attributes mean"], ["Records and privacy", "Retention; new attribute flows"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Platform teams", "The work inside each domain"], ["Application owners", "Dependencies, tests, cutover"], ["Help desk", "Users through every wave"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.35, w: 3.55, h: 2.65, fontSize: 14, paraSpaceAfter: 8 });
  });
  decision(s, "Fill the decision matrix with names, one decider per row, and get the authorizing official's agreement to every risk-acceptance row",
    "Executive sponsor", "Before the program starts");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, Appendix D; OMB M-22-09; OMB M-26-14; CISA BOD 25-01. Book 01, Chapters 09 and 12.");
  narrate(s,
`The book's decision matrix runs on one rule: one decider per row. The single deliberate exception is the pilot gate, G2, which the steward and the sponsor co-sign.

The sponsor and the CIO own scope, funding and sequence, break ties, and decide when Active Directory components retire, because each retirement ends a fallback. They clear gate G3 with the steering committee, and G5, the retirement of Active Directory itself. Their job is to keep it a program, not five projects that finish one at a time.

The CISO decides the control requirements every surface must meet. The authorizing official is the only official who can accept risk on the agency's behalf, so every place the program carries risk instead of removing it reaches that desk: a deferred legacy-authentication cutoff, a Kerberos island with no end date, a deviation from a mandatory baseline.

The program office, led by the steward, runs the orchestra. It holds the repository, turns assessments into authorized plans and evaluates the gates, but it doesn't decide risk or scope. The platform teams do the work inside each domain. Application owners decide for their own applications. HR decides what the worker attributes mean.

The sponsor's decision, before the program starts: fill in the matrix with names, one decider per row, and get the authorizing official's agreement to every risk-acceptance row.`,
  "Book 01, Chapter 09 — Who Leads the Transformation (The executive sponsor and the CIO; The CISO and the authorizing official; The program office and the steward; The platform teams; Application owners; Decision rights across the program; How a sponsor evaluates the program); Chapter 12 (Gates, rollback and authority).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = D.content(S_WHO, "Three decisions that land on the wrong desk");
  tag(s, "Who");
  rows(s, "Desk", "WHERE THE BOOK PUTS THEM", [
    ["Legacy auth end dates", "The authorizing official"],
    ["Help desk identity checks", "The CISO, not the help desk"],
    ["AD-era logs and records", "The records officer, before decommission"],
    ["New personal-data flows", "The privacy office, consulted first"],
  ], 1.88, 0.82, 0.7);
  sideBox(s, "Why", "FaTriangleExclamation", HEX.red, HEX.redTint, "Why each one moved", [
    "Keeping legacy auth open is a risk acceptance",
    "Attackers phone help desks for resets and MFA",
    "Some access records are kept six years",
    "A retired DC's logs can't be recovered",
  ]);
  decision(s, "Settle retention before decommissioning any domain controller, federation farm, sync server or SIEM connector",
    "Agency records officer", "Before the first decommission");
  sources(s, "Sources: CISA BOD 25-01 and Required Configurations; CISA AA23-320A (Scattered Spider); NARA GRS 3.2; 36 CFR 1220.34; OMB M-19-17. Book 01, Chapter 09.");
  narrate(s,
`Three decisions often land on the wrong desk, and the book moves each one on purpose.

First, end dates for legacy authentication and NTLM. They sit with the authorizing official, not with the engineers who'd like more time, because keeping legacy authentication open is a risk acceptance, and BOD 25-01 makes blocking it a mandatory baseline. Authorizing officials may accept risk for deviations from those policies, under agency policy.

Second, the help desk's identity-verification procedure. The help desk supports users through every wave, and that makes it a target. CISA's advisory on the Scattered Spider group describes attackers phoning help desks to get passwords reset and MFA tokens transferred. So the procedure for resets and temporary access passes is a CISO decision. The help desk carries it out with narrowly scoped roles.

Third, records. Retiring Active Directory retires the systems that hold years of access records. NARA's General Records Schedule 3.2 keeps some system access records for six years after the account is terminated, and once a domain controller is gone, its logs can't be recovered for an audit or a legal hold.

So the records officer decides retention before anything is decommissioned: any domain controller, federation farm, sync server or SIEM connector. And the privacy office is consulted before any new attribute flow carries personal data.`,
  "Book 01, Chapter 09 — Who Leads the Transformation (The CISO and the authorizing official; The help desk; Records management and privacy; Decision rights across the program, and the two rows that need comment).");
}

// ------------------------------------------------------------------ How 1: analyze the estate
{
  const s = D.content(S_HOW, "Analyze the estate first: read-only, with provenance");
  tag(s, "How");
  rows(s, "Rules", "FOUR RULES FOR THE ASSESSMENT", [
    ["Read-only", "Enforced in the account, the code and the audit trail"],
    ["Least privilege", "Default read first; narrow additions; never secrets"],
    ["Provenance", "Who, when, against what, which rights, a hash"],
    ["Profiled", "No application leaves its data unmeasured"],
  ], 1.88, 0.82, 0.7);
  sideBox(s, "Finds", "FaDatabase", HEX.navy, HEX.navyTint, "What a long-lived forest holds", [
    "Trusts no one can fully map",
    "Policies whose authors left a decade ago",
    "Certificate templates that open escalation paths",
    "Servers past support that need a disposition",
  ]);
  decision(s, "Commission the read-only assessment, tell security operations first, and accept nothing into planning that lacks provenance",
    "Steward (clears G0)", "Phase 0, weeks 1 to 4");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-6); Microsoft Learn — AD CS; Defender for Identity posture assessments; Arc Extended Security Updates. Book 01, Chapters 09, 10, 12.");
  narrate(s,
`Now how to deliver it, starting with the estate. You can't modernize what you haven't enumerated, and nothing can be retired until someone has written down everything it was quietly doing.

Ask what's in a long-lived forest and the honest answer is usually more than anyone on the current team knows: trusts no one can fully map, Group Policy whose authors left a decade ago, certificate templates whose permissions open privilege-escalation paths, and servers past support, each of which needs a disposition in the plan.

The assessment follows three rules. It's read-only, enforced in the account, the code and the audit trail. It's least-privilege: never a domain or enterprise admin, starting from default read rights and adding only narrow, recorded additions, never secrets. And every run carries provenance: who ran it, when, against what, with which rights, and a hash of every file. The engine rejects a run without it. The output maps privileged groups and service accounts, so it's stored encrypted and handled as sensitive. And because broad enumeration looks like reconnaissance, security operations is told first.

One more input decides whether an application may move: how many round trips it makes to its data, measured, not estimated.

The steward commissions it in Phase 0. In the program's experience a first pass takes days to a few weeks, and Gate G0 needs it committed.`,
  "Book 01, Chapter 10 — Analyzing the Estate (The assessment discipline; The assessment problem; Three design principles; Stream 4 — Computers; One artifact set per run; Profiling transactions before separation); Chapter 09 (What to do next, item 3); Chapter 12 (Phase 0, Gate G0).");
}

// ------------------------------------------------------------------ How 2: analysis, plan, delivery
{
  const s = D.content(S_HOW, "Analyze, plan, deliver: nothing moves without a plan");
  tag(s, "How");
  strip(s, "Stage", [
    ["1", "Analyze", "Current versus target; a diff and a blast radius"],
    ["2", "Plan", "Scoped, ordered actions, each with its inverse"],
    ["3", "Validate", "Naming, scope and safety rules, or rejected"],
    ["4", "Authorize", "An approver of record who isn't the author"],
    ["5", "Deliver", "Separate identity; verify and record each action"],
  ], 1.5, 1.3, [HEX.grey, HEX.grey, HEX.amberTint, HEX.amberTint, HEX.tealTint]);
  panels(s, "Panel", [
    ["FaArrowsRotate", "When delivery fails", HEX.navy, HEX.navyTint, ["The default is halt; rollback is explicit", "Every run ends in a signed evidence packet", "No drift means the next plan has zero actions"]],
    ["FaListCheck", "How far automation may go", HEX.teal, HEX.tealTint, ["Record, observe, advise, then gated actuation", "Autonomy only for named low-risk classes", "Tenant-wide roles and access policy stay gated"]],
  ], 2.98, 2.12);
  decision(s, "Agree the actuation ceiling for each class of change, with high-blast-radius classes gated permanently, as a posture you can sign",
    "Authorizing official", "Before the first production delivery");
  sources(s, "Sources: CISA ZTMM v2.0; OMB M-22-09; OMB M-26-14; Microsoft Learn — Microsoft Graph best practices and throttling. Book 01, Chapters 03 and 11.");
  narrate(s,
`Then the cycle that turns analysis into delivered change. Nothing touches the target without a plan, and no plan touches it without someone of record having read it first.

Analyze compares the current state with the target and produces a diff and a blast-radius score. Plan turns the diff into a sequence of actions, each bounded to a single object, ordered by dependency and paired with its own inverse, so the plan can run backwards. Then two gates. Validation rejects any plan that breaks naming, scope or safety rules, such as deleting too many objects at once. Authorization needs a review and at least one approver of record who isn't the author. Only then does the execution layer, under a separate identity, deliver each action, verify it and record the result.

When something fails, the default is to halt, and rollback is explicit. Every run ends in a signed evidence packet, and when nothing has drifted, the next run is a zero-action plan.

A separate rule caps how far automation may go: record, observe, advise, gated actuation, and autonomy only for named low-risk classes. Tenant-wide role changes, Conditional Access enforcement and bulk device changes stay gated permanently. No federal document requires that ceiling. The book chooses it because it's a posture an authorizing official can sign.

So before the first production delivery, the authorizing official agrees the ceiling for each class of change, with its dry run, its approver and its rollback on record.`,
  "Book 01, Chapter 11 — Analysis, Plan, Delivery (The pipeline contract; Stage 1 — Analyze; Stage 2 — Plan; Plan validation; Authorization gate; Stage 3 — Deliver; Failure modes and rollback; How far automation may go; Evidence packet); Chapter 03 (The control plane over the data planes).");
}

// ------------------------------------------------------------------ How 3: roadmap
{
  const s = D.content(S_HOW, "The roadmap: seven phases, six gates, five workstreams");
  tag(s, "How");
  strip(s, "Phase", [
    ["0", "Pre-flight", "Weeks 1–4", "G0 Ready to Plan"],
    ["1", "Foundation", "Weeks 5–8", "G1 Foundation Complete"],
    ["2", "Pilot division", "Weeks 9–16", "G2 Pilot Clean"],
    ["3", "General rollout", "Weeks 17–36", "G3 Rollout Complete"],
    ["4", "Legacy retirement", "Weeks 37–44", "G4 Legacy Quiet"],
    ["5", "AD DS retirement", "Weeks 45–48", "G5 AD Retired"],
    ["6", "Steady state", "Week 49 on", "Assess on a cadence"],
  ], 1.5, 1.85, [HEX.grey, HEX.navyTint, HEX.navyTint, HEX.navyTint, HEX.amberTint, HEX.redTint, HEX.tealTint], 0.1);
  panels(s, "Panel", [
    ["FaPeopleArrows", "Parallel, not sequential", HEX.navy, HEX.navyTint, ["Identity, policy, services, compute, access", "Each workstream has a named lead"]],
    ["FaDoorClosed", "Gated, not open-ended", HEX.teal, HEX.tealTint, ["A phase opens only when the last gate is green", "Weeks are illustrative; large estates run years"]],
  ], 3.5, 1.6);
  decision(s, "Put the gate dates on the sponsor's calendar and the end date of every exception on the authorizing official's",
    "Executive sponsor; authorizing official", "Gate G0 dated in Phase 0");
  sources(s, "Sources: NIST SP 800-207; Microsoft Learn — block legacy authentication; emergency access accounts; CBA for M-22-09. Book 01, Chapters 09 and 12.");
  narrate(s,
`The roadmap sequences all of this as an illustrative fifty-two-week program. The weeks are a sequencing model, not a commitment; large federal estates typically run multi-year.

There are seven phases and six gates. Phase 0, pre-flight, stands up the platform host and runs the assessment; G0 is Ready to Plan. Phase 1, foundation, puts the identity primitives in place, including the access baseline and the HR feed; G1 is Foundation Complete. Phase 2 proves the whole pattern on one pilot division, typically IT; G2, Pilot Clean, needs zero drift for a hold period. Phase 3, the longest, rolls out division by division, two or three at a time. Phase 4 retires legacy policy, groups, DNS, DHCP and the last service principal names; G4 is Legacy Quiet. Phase 5, the shortest, retires AD DS. And Phase 6 is steady state.

Two properties define it. The five workstreams, identity, policy, services, compute and access, run in parallel, each with a named lead; finishing one before starting the next doubles the duration. And it's gated: a phase opens only when the previous gate clears.

The decision closes the loop on ownership. Put the gate dates on the sponsor's calendar, and the end date of every exception on the authorizing official's. Gate G0 gets its date in Phase 0.`,
  "Book 01, Chapter 12 — The Migration Roadmap (The program claim; The seven phases; The five parallel workstreams; Where to start); Chapter 09 (What to do next, item 5).");
}

// ------------------------------------------------------------------ How 4: gates and rollback
{
  const s = D.content(S_HOW, "Gates go green on data, and rollback has an end");
  tag(s, "How");
  const gates = [
    ["G0 Ready to Plan", "Steward (backup: sponsor)"],
    ["G1 Foundation Complete", "Steward"],
    ["G2 Pilot Clean", "Steward and sponsor"],
    ["G3 Rollout Complete", "Sponsor and steering committee"],
    ["G4 Legacy Quiet", "Steward (backup: sponsor)"],
    ["G5 AD Retired", "Sponsor and CIO"],
  ];
  leftTable(s, ["Gate", "Who decides"], gates.map((r, i) => [bold(r[0], i === 5 ? HEX.red : HEX.navy), { text: r[1] }]),
    [3.1, 3.8], [0.4, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6], 13);
  sideBox(s, "Triggers", "FaArrowsRotate", HEX.amber, HEX.amberTint, "Rollback triggers are thresholds", [
    "Drift over threshold for a day: halt the phase",
    "Access policy blocking real sign-ins: revert",
    "Drift detection silent: halt all phase work",
    "Backups age out at 180 days; the last running DC is the real rollback point",
  ]);
  decision(s, "Retire AD DS only on evidence: no live production dependency on AD authentication, or a documented Kerberos island with an end date",
    "Executive sponsor and CIO", "Gate G5 (illustratively week 48)");
  sources(s, "Sources: Microsoft Learn — Demote domain controllers and domains; Back up and restore Active Directory domain controllers (tombstone lifetime). Book 01, Chapters 09 and 12.");
  narrate(s,
`Two things make the gates trustworthy. First, every gate criterion is evaluated from the repository and the drift reports, not from a signature. Zero drift for fourteen days is a query; so is every PC cloud-joined. The engine reports green, the steward concurs, and the record that merges the decision shows who made it. A gate the engine can't evaluate needs a better criterion.

Second, rollback triggers are thresholds, not judgment calls, and the values are the agency's to set. Drift above the threshold for more than a day halts the phase. Conditional Access blocking more than a set share of legitimate sign-ins means the policy is reverted. If drift detection stops reporting, all phase work halts.

Authority is fixed in advance. The steward clears G0, G1 and G4. The steward and the sponsor co-sign G2. The sponsor and the steering committee clear G3. And the sponsor and the CIO clear G5, Active Directory retired.

And be clear about the end. A forest in backup isn't a lasting fallback: a backup is valid only within the tombstone lifetime, 180 days by default. The real rollback point is the last moment a domain controller still runs.

So G5 is the sponsor's and the CIO's decision, made on evidence: no live production dependency on Active Directory authentication, or a documented Kerberos island with an end-of-life date.`,
  "Book 01, Chapter 12 — The Migration Roadmap (Phase 5 — AD DS retirement; Gate G5; Gates, rollback and authority); Chapter 09 (Decision rights: gate decisions; retire domain controllers).");
}

// ------------------------------------------------------------------ How 5: the clocks
{
  const s = D.content(S_HOW, "The clocks: FedRAMP's dates don't set the agency's");
  tag(s, "How");
  cards(s, "Clocks", [
    ["FaCloud", "FedRAMP's clock", HEX.navy, HEX.navyTint, ["2026 rules mandatory January 1, 2027", "New Rev5 applications end June 11, 2027", "Certifies cloud services, not your estate"]],
    ["FaLandmark", "The agency's own", HEX.red, HEX.redTint, ["M-26-14's logging plan and maturity levels", "BOD 25-01's secure baselines", "Each agency authorizes its own systems"]],
    ["FaServer", "End of support", HEX.amber, HEX.amberTint, ["Windows 10: October 14, 2025", "Server 2012 and 2012 R2 updates: October 13, 2026", "Windows Server 2016: January 12, 2027"]],
  ]);
  decision(s, "Sequence the program against the agency's own deadlines and end-of-support dates, not against FedRAMP's 2027 date",
    "Executive sponsor and CIO", "Now: Server 2016 ends January 12, 2027");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 (Important Dates; Using a Certified Cloud Service); OMB M-26-14; CISA BOD 25-01; OMB M-22-09; Microsoft lifecycle. Book 01, Chapter 12.");
  narrate(s,
`Two external clocks bear on the schedule, and they're easy to conflate.

FedRAMP's Consolidated Rules for 2026, announced on June 25, 2026, govern how cloud services are certified. They become mandatory for everyone on January 1, 2027, and FedRAMP stops accepting new Rev5 certification applications on June 11, 2027. None of that certifies the agency's own estate. FedRAMP is explicit that each agency still authorizes its own federal information systems, and should never create a standalone authorization for a cloud service. What the 2027 date changes is the evidence your providers publish and you inherit.

The deadlines that bind the agency directly come from OMB and CISA: M-26-14's logging plan and maturity levels, and BOD 25-01's secure configuration baselines for in-scope Microsoft 365 tenants. The estate has its own dates too. Windows 10 reached end of support on October 14, 2025. Extended security updates for Windows Server 2012 and 2012 R2 ended on October 13, 2026, and Windows Server 2016 reaches end of support on January 12, 2027.

Mainframes have a place in the sequence. Token-based access joins the access workstream late, discrete read-mostly transactions first, and M-22-09 notes that mainframes may need other zero trust mechanisms where endpoint detection tools don't fit.

So the sponsor and the CIO sequence the program against the agency's own deadlines and end-of-support dates, starting now, not against FedRAMP's 2027 date.`,
  "Book 01, Chapter 12 — The Migration Roadmap (The clocks the roadmap runs against; Mainframe access in the sequence; Key takeaways, item 4).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content(S_HOW, "Decisions, owners, and where to start");
  tag(s, "How");
  const asks = [
    ["Name the sponsor, steward and AO; fill the matrix, one decider per row", "CIO and leadership", "Before Phase 0"],
    ["Scope all eleven categories, with DNS, DHCP and IPAM in the core program", "Sponsor and CIO", "When scope is set"],
    ["Stand up the platform host: one authoritative writer, Tier 0", "Steward", "Phase 0 (G0)"],
    ["Commission the read-only assessment, with provenance", "Steward", "Phase 0 (G0)"],
    ["Set the control requirements: access baseline, MFA strength, logging", "CISO", "Phase 1 (G1)"],
    ["Define the worker attributes; the HR feed is their only writer", "HR", "Before rollout (G1)"],
    ["Agree the actuation ceiling and every exception's end date", "Authorizing official", "Before production"],
    ["Settle retention of AD-era records", "Records officer", "Before decommission"],
    ["Retire AD DS on evidence, or a dated Kerberos island", "Sponsor and CIO", "Gate G5"],
  ];
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([7.4, 2.55, 2.2], { y: 1.45, fontSize: 12.5, rowH: [0.38, ...asks.map(() => 0.41)] }));
  txt(s, "Close line", [{ text: "No vendor decision on day one.  ", options: { bold: true, color: HEX.amber } },
    { text: "Start with an inventory, an owner and a date." }],
    { x: 0.6, y: 5.75, w: 12.15, h: 0.6, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: as on each slide. Book 01, Chapters 09 (What to do next), 10, 11 and 12 (Where to start).");
  narrate(s,
`So, the decisions, with their owners.

Agency leadership and the CIO name the sponsor, the steward and the authorizing official, and the sponsor fills the matrix with one decider per row. The sponsor and the CIO scope all eleven categories, with DNS, DHCP and address management in the core program, and at the end retire Active Directory on evidence.

The steward stands up the platform host as the one authoritative writer, protected as Tier 0, and commissions the read-only assessment, both in Phase 0.

The CISO sets the control requirements, enforced at Gate G1. HR defines what the worker attributes mean. The authorizing official agrees the actuation ceiling and every exception's end date. And the records officer settles retention before anything is decommissioned.

None of this requires a vendor decision on day one. It requires an inventory, an owner and a date: the read-only assessment, a named sponsor and steward, and Gate G0 on the calendar.

Microsoft has supplied the instruments. The program is the orchestra, and the people named in this briefing are the ones who have to play it. Retiring Active Directory is a governance transformation, and it should be led as one. Book 01 has the detail, with every claim footnoted. Thank you.`,
  "Book 01, Chapter 09 — Who Leads the Transformation (What to do next; Key takeaways); Chapter 12 — The Migration Roadmap (Where to start); Chapters 02, 03, 05, 06, 10 and 11.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources: federal policy, standards and records");
  const src = [
    "OMB, Federal Data Center Consolidation Initiative (February 26, 2010)  ·  25 Point Implementation Plan to Reform Federal IT Management (December 9, 2010), items 1 and 3.",
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (January 26, 2022), §II, §III.A–§III.D  ·  OMB M-19-17, Enabling Mission Delivery through Improved ICAM (May 21, 2019), Governance, item 1  ·  OMB M-26-14, agency logging and network visibility (May 22, 2026; rescinds M-21-31), Appendix B.",
    "CISA BOD 25-01, Implementing Secure Practices for Cloud Services (December 17, 2024), and its Required Configurations page  ·  SCuBA Microsoft Entra ID baseline  ·  CISA Zero Trust Maturity Model v2.0 (April 2023)  ·  CISA AA23-320A, Scattered Spider (November 16, 2023; revised July 29, 2025)  ·  CISA, Using SASE in a Modern TIC 3.0 Solution, v1.0 (June 2026).",
    "NIST SP 800-207, Zero Trust Architecture (August 2020), §2.1, §3, §3.4.1  ·  SP 800-53 Rev. 5, release 5.2.0 (AC-6, CM-8, SC-20 to SC-22)  ·  SP 800-37 Rev. 2, Appendix D.",
    "FedRAMP Consolidated Rules for 2026 (announced June 25, 2026): Important Dates; Key Security Indicators; Using a FedRAMP Certified Cloud Service; Agency Use, and the machine-readable ruleset version 2026.10.13.01.",
    "NARA General Records Schedule 3.2, Transmittal 33 (January 2023), items 030 and 031  ·  36 CFR § 1220.34  ·  IETF RFC 4120 (Kerberos V5)  ·  ITU-T Recommendation G.114 (05/2003).",
  ];
  txt(s, "Source list 1", bullets(src, 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Sources: Microsoft, IBM and the full footnotes");
  const src = [
    "Microsoft Learn, identity: Kerberos ticket lifetimes (Max-Ticket-Age, Max-Renew-Age, service ticket); KDC configuration keys; continuous access evaluation; hybrid join planning and concepts; Entra joined vs. hybrid joined; cloud-first identity guidance; cloud transformation posture; dynamic membership groups; administrative units; lifecycle workflows; Entra licensing; Privileged Identity Management; certificate-based authentication; authentication strengths; emergency access accounts.",
    "Microsoft Learn, devices, servers and policy: cloud-native endpoints planning guide and tutorial; Intune supported platforms; policy conflicts; Conditional Access report-only mode and block legacy authentication; Azure Arc-enabled servers; machine configuration; Windows Autopilot; NTLM deprecation; What's new in Windows Server 2025; Windows Server release information; AD tier model and enterprise access model; Microsoft Cloud PKI; AD CS certification authority role; Defender for Identity posture assessments.",
    "Microsoft Learn, network, delivery and lifecycle: AD-integrated DNS; DHCP authorization; Azure DNS Private Resolver; Microsoft Graph best practices and throttling; demoting domain controllers; Active Directory backup and tombstone lifetime; Windows 10 end of support; Arc Extended Security Updates; meeting M-22-09 MFA requirements.",
    "IBM Documentation: z/OS Connect identity mapping; RACF distributed identity filters; CICS PassTickets (the mainframe boundary, Chapters 04, 08 and 12).",
    "Full footnotes with links and access dates (October 21, 2026): Book 01, every chapter and Appendices A and B (whalermike.github.io/modernization-workbook/docs/books/b01-transformation-arc/).",
  ];
  txt(s, "Source list 2", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Where each slide comes from");
  const map = [
    ["Every mandate assumes a foundation", "Ch. 01, 09, 12"], ["AD was the governance", "Ch. 02, 09"],
    ["Five things must be true", "Ch. 01"], ["Platform: one writer", "Ch. 03, 09, 12"],
    ["Identity: attributes first", "Ch. 04, 09, 12"], ["Policy: regenerate, don't copy", "Ch. 05, 09, 12"],
    ["DNS, DHCP and IPAM together", "Ch. 06, 12"], ["Compute: domain join goes last", "Ch. 07, 09, 10, 12"],
    ["Access: applications, not networks", "Ch. 08, 12"], ["Instruments, not the orchestra", "Ch. 09"],
    ["One decider per decision", "Ch. 09, 12"], ["Three decisions, wrong desk", "Ch. 09"],
    ["Analyze the estate first", "Ch. 09, 10, 12"], ["Analyze, plan, deliver", "Ch. 03, 11"],
    ["Seven phases, six gates", "Ch. 09, 12"], ["Gates go green on data", "Ch. 09, 12"],
    ["The clocks", "Ch. 12"], ["Decisions and where to start", "Ch. 09, 10, 11, 12"],
  ];
  const half = Math.ceil(map.length / 2);
  [map.slice(0, half), map.slice(half)].forEach((part, k) => {
    s.addTable([head(["Slide", "Book 01 source"]), ...part.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
      tableOpts([3.75, 2.2], { x: 0.6 + k * 6.2, y: 1.5, fontSize: 12.5, rowH: Array(part.length + 1).fill(0.46) }));
  });
}

console.log(`narration: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
