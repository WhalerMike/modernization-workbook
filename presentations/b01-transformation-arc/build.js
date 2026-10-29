// Book 01 — The Transformation Arc: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b01-transformation-arc/build.js presentations/b01-transformation-arc/B01_Transformation_Arc.pptx
// Every fact comes from a footnoted chapter of docs/books/b01-transformation-arc/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 01", title: "The Transformation Arc" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B01_Transformation_Arc.pptx";

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
// The book that carries a What slide's detail, top-right.
const depth = (s, text) => txt(s, "In depth", text, { x: 8.75, y: 0.12, w: 4.0, h: 0.32, fontSize: 11, bold: true, color: HEX.teal, align: "right", valign: "middle", charSpacing: 1 });

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why it's hard", "Why Is Modernization So Hard?", "Book 01 — The Transformation Arc");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 01 of the Federal Modernization Workbook, The Transformation Arc: the move from a domain-joined client-server estate to cloud identity, cloud device management and governed hybrid operations. Book 01 is the workbook's overview, and each part of it points to the book that carries the detail.

I'll take four questions: why modernization is so hard, what has to change, who leads it, and how to get there.

The short version: modernization is a governance rebuild, not a platform swap.`,
  "Book 01, index; Chapter 01 — Why Modernization Is Hard.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why it's hard", "Four eras built the estate; none kept one truth");
  tag(s, "Why");
  const eras = [
    ["Mainframe", "One machine held the data and enforced access to it", HEX.navy, HEX.navyTint],
    ["Distributed, late 1980s", "Regional databases and directories, each with its own rules", HEX.amber, HEX.amberTint],
    ["Consolidation, from 2010", "Offices wired back to distant data centers through inspection", HEX.amber, HEX.amberTint],
    ["The breaking point", "Microsoft 365 and several clouds; identity still in regional domains", HEX.red, HEX.redTint],
  ];
  eras.forEach((p, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Era ${i + 1}`, x, 1.5, 2.95, 1.95, p[3]);
    txt(s, `Era ${i + 1} text`, [{ text: p[0], options: { bold: true, color: p[2], fontSize: 15, breakLine: true } }, { text: p[1], options: { fontSize: 13.5 } }],
      { x: x + 0.15, y: 1.6, w: 2.7, h: 1.75, valign: "middle", paraSpaceAfter: 4 });
  });
  const stats = [["432", "federal data centers reported in 1998"], ["1,100+", "reported in 2009"], ["800", "the December 2010 target for closures by 2015"]];
  stats.forEach((d, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Stat ${i + 1}`, x, 3.65, 3.95, 1.4, HEX.grey);
    txt(s, `Stat ${i + 1} text`, [
      { text: d[0], options: { bold: true, color: HEX.navy, fontSize: 26, fontFace: "Cambria", breakLine: true } },
      { text: d[1], options: { fontSize: 13.5 } },
    ], { x: x + 0.25, y: 3.72, w: 3.5, h: 1.26, valign: "middle" });
  });
  callout(s, "Cascade", 5.25, 1.25, "FaArrowDownWideShort", HEX.red, "Each fix assumes the last one is done: ",
    "Zero Trust assumes governed identity, governed identity assumes a clean directory, and a clean directory assumes someone owns it. Start with the foundation, not the mandate.");
  sources(s, "Sources: OMB, Federal Data Center Consolidation Initiative (February 26, 2010); 25 Point Implementation Plan to Reform Federal IT (December 9, 2010). Book 01, Chapter 01.");
  narrate(s,
`Why is modernization so hard? The estate got here in four eras. Each solved a real problem, and none replaced what the first era had: one authoritative answer.

On the mainframe, one machine held the data and enforced access to it. By the late 1980s, regional databases and directories had spread that truth across a dozen systems. From 2010 the direction reversed. OMB reported that federal data centers had grown from 432 in 1998 to more than 1,100 in 2009, and the December 2010 reform plan targeted closing at least 800 by 2015, wiring offices back to distant facilities. Then email and collaboration moved to the cloud, while identity stayed in regional domains.

And each fix assumes the last one is done. Zero Trust assumes governed identity, governed identity assumes a clean directory, and a clean directory assumes someone owns it.`,
  "Book 01, Chapter 01 — Why Modernization Is Hard (How the estate got here; The cascade; The bottom line).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why it's hard", "Sessions carried trust; tokens are checked each time");
  tag(s, "Why");
  const panels = [
    ["FaUserClock", "Sessions: Kerberos in AD", HEX.navy, HEX.navyTint, [
      "Sign in once: the ticket lasts 10 hours, renewable for 7 days",
      "Service tickets last 600 minutes",
      "Open connections survive a ticket's expiry",
      "A disabled account keeps its earlier tickets"]],
    ["FaIdCard", "Tokens: Entra ID", HEX.teal, HEX.tealTint, [
      "Each token request is checked against policy",
      "An access token lasts one hour by default",
      "With CAE, up to 28 hours, revoked on critical events",
      "Event propagation can take up to 15 minutes"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 1.5, 6.0, 3.55, p[3]);
    icon(s, p[0], x + 0.22, 1.68, 0.62, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 1.0, y: 1.68, w: 4.85, h: 0.62, bold: true, color: p[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 15), { x: x + 0.3, y: 2.5, w: 5.5, h: 2.45, paraSpaceAfter: 8 });
  });
  callout(s, "Distance", 5.25, 1.25, "FaRoute", HEX.amber, "Distance costs domain-controller trips, not tickets: ",
    "NAT doesn't break Kerberos, and the famous five minutes is clock skew. Sign-in, password change and policy need a DC; Portland to Washington is about a 45 ms round-trip floor.");
  sources(s, "Sources: Microsoft Learn — Max-Ticket-Age, Max-Renew-Age, service ticket lifetime, continuous access evaluation, KDC keys, hybrid join; RFC 4120; ITU-T G.114. Book 01, Chapter 01.");
  narrate(s,
`Second, trust itself changed. In Active Directory a user signs in once and gets a Kerberos ticket-granting ticket that lasts 10 hours by default and renews for 7 days. An open connection isn't interrupted when its ticket expires, and an account disabled during the day can keep using tickets issued before.

Zero Trust decides each request against current policy. An Entra access token lasts one hour by default, or up to 28 hours with continuous access evaluation, because the service subscribes to events such as a disabled account and stops honoring the token in near real time. It's a badge checked at every door.

Distance doesn't break tickets. It hurts the trips to a domain controller: sign-in, password changes and policy. On the book's worked arithmetic, Portland to Washington has a floor of about 45 milliseconds round trip, whatever the bandwidth.`,
  "Book 01, Chapter 01 — Why Modernization Is Hard (The session problem; What distance does and doesn't cost).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why it's hard", "The OU tree was the governance tree");
  tag(s, "Why");
  rows(s, "Did", "ONE OU PLACEMENT DID FIVE THINGS AT ONCE", [
    ["Delegated admins", "The branch's admins got the account"],
    ["Inherited Group Policy", "Every GPO along the path applied"],
    ["Group membership", "Tools built groups from OU position"],
    ["Delegation authority", "Bound to that branch's authority"],
    ["Audit boundary", "Operational responsibility drawn"],
  ], 1.92, 0.66, 0.56);
  sideBox(s, "Entra", "FaSitemap", HEX.teal, HEX.tealTint, "WHAT ENTRA ID HAS INSTEAD", "No tree: rebuild it explicitly", [
    "Attributes carry organizational position",
    "Dynamic groups: membership follows attributes",
    "Administrative units scope roles; they can't nest",
    "Conditional Access enforces access policy",
  ]);
  callout(s, "Decision", 5.45, 1.05, "FaLandmark", HEX.navy, "Retiring AD is an agency decision: ",
    "Microsoft still supports and enhances Active Directory. What changed is where it invests: a cloud-first, AD-minimized model, reached in phases.");
  sources(s, "Sources: Microsoft Learn — delegating administration by OU, Group Policy overview, dynamic membership groups, administrative units, cloud-first identity guidance. Book 01, Chapter 02.");
  narrate(s,
`Chapter 02 names the problem. Active Directory was the implicit governance model for every Windows-era service, and nobody wrote it down.

Microsoft's design guidance says organizational units exist to apply Group Policy and delegate authority, and that both inherit down the tree. So placing one user in an OU did five things at once. It handed the account to that branch's administrators, applied every policy linked along the path, fed the tools that built groups from position, bound it to the branch's delegation authority, and drew an audit boundary.

Entra ID has no OU tree. Dynamic groups follow attributes, and administrative units scope delegated roles but can't be nested. Neither rebuilds the tree on its own; the rebuild has to be written down.

And Microsoft still supports and enhances Active Directory, so retiring it is an agency decision, not a vendor deadline.`,
  "Book 01, Chapter 02 — The Problem: Governance Hidden in the Directory (What breaks when AD goes away; The OU tree was the governance tree).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = D.content("Why it's hard", "Eleven categories, and the failures are silent");
  tag(s, "Why");
  cards(s, "Hidden", [
    ["FaUsersGear", "What plans count", HEX.navy, HEX.navyTint, ["Users", "Computers", "Security groups", "Group Policy Objects"]],
    ["FaPlugCircleXmark", "What they miss", HEX.red, HEX.redTint, ["Service accounts and SPNs", "DNS and DHCP", "PKI and certificate services", "RADIUS and NPS", "LDAP binds and trusts"]],
    ["FaTriangleExclamation", "How it fails", HEX.amber, HEX.amberTint, ["A certificate doesn't renew: enrollment never re-pointed", "A device loses network access: a group lookup returns empty", "An LDAP app stops: its bind account went with the domain"]],
  ]);
  callout(s, "Discipline", 5.3, 1.2, "FaListCheck", HEX.red, "Five steps, run as a discipline: ",
    "enumerate the hidden dependencies, map each to a modern target, keep delegation continuous, deliver through a governed pipeline, and detect drift continuously.");
  sources(s, "Sources: Microsoft Learn — Windows Server 2025 AD DS, cloud transformation posture, Intune supported platforms, Azure Arc, Entra CBA, DNS Private Resolver. Book 01, Chapter 02.");
  narrate(s,
`Most "AD to Entra ID" projects are scoped around users, groups and mailboxes, the visible part. The program counts eleven categories of object that Active Directory governs: users, computers, service accounts, security groups, Group Policy, DNS and DHCP, certificate services, RADIUS, LDAP, service principal names and trusts. Migrate the users into a flat directory, declare victory, and the rest are left behind.

These failures rarely throw clear errors. A certificate doesn't renew because enrollment was never re-pointed. A device fails network access because a group lookup comes back empty. An LDAP application stops because its bind account was deleted with the domain.

Organizations rarely fail because they can't list objects. They fail because nobody treats five steps as a discipline: enumerate, map each dependency to a target, keep delegation continuous, deliver through a governed pipeline, and detect drift.`,
  "Book 01, Chapter 02 — The Problem: Governance Hidden in the Directory (the eleven categories; Silent failure is the real enemy; Why naive migrations fail).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What changes", "One governed host, five roles, one writer");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 04 AND 05");
  const roles = [["Source of truth", "Signed, versioned commits"], ["Reverse proxy", "TLS and client certificates"], ["Auth bridge", "Domain-joined and Arc-connected"],
    ["Engine", "PowerShell, Python, API integrators"], ["Adapters", "One contract per category"]];
  roles.forEach((f, i) => {
    const x = 0.6 + i * 2.4625;
    box(s, `Role ${i + 1}`, x, 1.5, 2.33, 1.35, i === 0 ? HEX.navyTint : HEX.grey);
    txt(s, `Role ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 14, breakLine: true } },
      { text: f[1], options: { fontSize: 12.5 } },
    ], { x: x + 0.12, y: 1.55, w: 2.1, h: 1.25, valign: "middle" });
  });
  const panels = [
    ["FaScaleBalanced", "Decide and act, kept apart", HEX.navy, HEX.navyTint, ["Governance validates and signs; never touches a target", "Execution runs authorized plans; decides nothing", "Separate accounts, credential stores and logs", "A person approves before anything writes"]],
    ["FaShieldHalved", "Protected as a Tier 0 asset", HEX.teal, HEX.tealTint, ["Windows Server 2025, supported to November 2034", "Reads AD read-only; writes only through plans", "App Control; administered from a privileged workstation", "Logs go to central logging (OMB M-26-14)"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
    icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.75, w: 5.6, h: 1.27, paraSpaceAfter: 2 });
  });
  callout(s, "Not a product", 5.25, 1.25, "FaCubes", HEX.amber, "A reference architecture, not a product: ",
    "standard components configured one way, with no proprietary binary. Scale comes from the target surface, such as Entra ID and Intune, not from fanning out the host.");
  sources(s, "Sources: Microsoft Learn — Windows Server release information, IIS reverse proxy, Arc managed identity, AD DS tier model, App Control; Gitea signing; OMB M-26-14. Book 01, Chapter 03.");
  narrate(s,
`Now, what changes. Before anything moves, the program needs one place where every decision is written down, signed and replayable. Chapter 03 describes a reference platform host: one Windows Server 2025 server, supported to November 2034, with a standby.

The host has five roles: a version-controlled source of truth with signed commits; a reverse proxy for TLS and client certificates; an authentication bridge to the legacy forest; the transformation engine; and an adapter per dependency category. What matters is a single authoritative writer.

Governance and execution never mix. One layer validates and signs plans but never touches a target. The other runs authorized plans but decides nothing, under separate accounts, credentials and logs. The host reads Active Directory read-only and is protected as Tier 0.

Book 05 covers servers under Azure Arc in depth, and Book 04 covers change as code with evidence.`,
  "Book 01, Chapter 03 — The Platform Foundation. Depth: Book 05, Chapter 09; Book 04, Chapter 10.");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What changes", "Identity: one HR stamp drives five outcomes");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 02 AND 03");
  const mech = [["Organizational attributes", "OU placement"], ["Dynamic groups", "OU-derived security groups"], ["Administrative units", "OU-level delegation"], ["Conditional Access targeting", "Group Policy inheritance"]];
  s.addTable([head(["Mechanism", "What it replaces"]), ...mech.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([3.3, 3.6], { y: 1.5, fontSize: 14, rowH: [0.42, 0.55, 0.55, 0.55, 0.55] }));
  txt(s, "Table note", "Dynamic membership usually updates within a few hours but can take more than 24. Design the mover workflow around that window.",
    { x: 0.6, y: 4.25, w: 6.9, h: 0.8, fontSize: 12.5, italic: true, color: HEX.slate });
  box(s, "Stamp box", 7.75, 1.5, 5.0, 3.55, HEX.tealTint);
  icon(s, "FaAddressBook", 8.0, 1.68, 0.6, HEX.teal);
  txt(s, "Stamp head", "One HR stamp, five outcomes", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Stamp list", bullets([
    "Dynamic group membership",
    "Administrative-unit scope",
    "Conditional Access targeting",
    "Group-based licensing",
    "Drift detection against HR",
  ], 14.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "True", 5.25, 1.25, "FaFingerprint", HEX.red, "A token is only as true as its attributes: ",
    "if access still lives in regional OU trees with no HR-derived source, tokens sign broken authorizations efficiently. HR provisioning is the only writer.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; Microsoft Learn — dynamic membership rules and processing, administrative units, group-based licensing, HR provisioning. Book 01, Chapter 04.");
  narrate(s,
`Identity comes first, because every later control reads the attributes. For the workforce, the authoritative source is the HR system of record, and OMB M-22-09 requires centralized identity management for agency users.

Four mechanisms rebuild what the OU tree did: attributes replace OU placement, dynamic groups replace OU-derived groups, administrative units replace OU delegation, and Conditional Access targeting replaces Group Policy inheritance. The program's contribution is the contract that binds them: one HR-sourced stamp drives membership, delegated scope, policy targeting, licensing and drift detection.

Two cautions. Dynamic membership usually updates within a few hours but can take more than 24, so design movers around that window. And HR provisioning must be the only writer of those attributes.

Tokens only work if this is right. Books 02 and 03 carry identity in depth.`,
  "Book 01, Chapter 04 — Identity Transformation. Depth: Book 02 (Identity & Directory), Book 03 (HR-Driven Identity).");
}

// ------------------------------------------------------------------ What 2b: four tracks and the end state
{
  const s = D.content("What changes", "Four tracks, each with its own source of truth");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 02, 03, 05, 06 AND 17");
  const tracks = [
    ["HR track: people", "HR (Core HCM) for employees; the contractor source of authority for contractors", "Every enabled account matches an HR or contractor record, or an owned exception"],
    ["Intune track: devices", "Device provisioning: Autopilot registration and group tag, enrollment. Not HR", "Every managed device carries provisioning-written attributes that target its policy"],
    ["Arc track: servers", "Arc onboarding tags and resource group, then Azure Policy", "Every in-scope server is Arc-enabled, tagged, and evaluated against its baseline"],
    ["Non-person identities", "The owner and sponsor record: system inventory, app registration, AI inventory", "Each has an owner and a target, and no password that never expires"],
  ];
  s.addTable([head(["Track", "Source of truth for its attributes", "You're there when (design guidance)"]),
    ...tracks.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([2.45, 4.75, 4.95], { y: 1.5, fontSize: 13, rowH: [0.42, 0.66, 0.66, 0.66, 0.66] }));
  callout(s, "End state", 4.75, 1.35, "FaFingerprint", HEX.teal, "The end state: ",
    "every person, device, server and workload governed by true attributes, each owned by one source and read by policy. Joining, moving and leaving change access with no ticket, and AD retires without losing a job the OU tree did.");
  txt(s, "Requirements", [{ text: "Federal requirements:  ", options: { bold: true, color: HEX.navy } },
    { text: "OMB M-22-09 §III.A, §III.B, §III.D; NIST SP 800-53 AC-2, AC-6, CM-2, CM-6, CM-8 (Book 01, Appendix A: compliance-enabling, not a compliance claim)" }],
    { x: 0.6, y: 6.2, w: 12.15, h: 0.34, fontSize: 11.5, valign: "middle" });
  sources(s, "Sources: Book 01, Chapters 01, 04, 07, 08 and Appendix A; Book 05, Chapters 03 and 09; Book 02, Chapter 09. Success criteria: program design guidance. Full citations in the backup.");
  narrate(s,
`Why does this matter? Because an Active Directory forest holds four populations of identity, not one, and each moves to the cloud by its own track, with its own source of truth.

People are the HR track: employees from the HR record, contractors from the contractor source of authority. End-user devices are the Intune track. Their attributes come from device provisioning, the Autopilot registration and its group tag, never from HR, and a device rule can't read its owner. Servers are the Arc track: tagged at onboarding, then governed by Azure Policy. And non-person identities, such as service accounts, service principals, managed identities and AI agents, answer to their owner's record, not to HR.

The goal is the same for all four: true attributes, one owning source each, read by policy. Joins, moves and exits change access with no ticket, every workload has a named owner, and AD can retire without losing what the OU tree did. The right-hand column is program design guidance for knowing you're there.

Group Policy splits the same way, so policy is next.`,
  "Book 01, Chapter 01 (What has to be true: one authoritative record per user, device and service account); Chapter 04 (the HR system of record); Chapter 07 (Arc servers tagged with organizational attributes); Chapter 08 (service accounts to managed identities, gMSAs and workload identity federation). Depth: Book 03 (HR track); Book 05, Chapters 03, 04, 08 (Intune track) and 09 (Arc track); non-person identities in Book 02, Chapter 09 (Modernizing service accounts), Book 06 and Book 17. Success criteria are program design guidance.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What changes", "Policy: regenerate Group Policy, don't copy it");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 05 AND 04");
  rows(s, "Target", "WHERE EACH GROUP POLICY CATEGORY GOES", [
    ["Device configuration", "Intune profiles, settings catalog"],
    ["Security baselines", "Intune baselines; Entra smart lockout"],
    ["Software", "Intune apps, with Autopilot"],
    ["Scripts and drives", "Remediations; OneDrive, SharePoint"],
    ["Access control", "Conditional Access"],
    ["Servers", "Azure machine configuration through Arc"],
  ], 1.92, 0.56, 0.48);
  sideBox(s, "Stages", "FaClipboardCheck", HEX.amber, HEX.amberTint, "WHAT EVERY POLICY CHANGE PASSES", "Four stages, none skipped", [
    "Plan validation: one owning layer",
    "A simulated tenant asserts the effect",
    "Pilot, with Conditional Access report-only",
    "Production, after a clean pilot",
  ]);
  callout(s, "Require", 5.45, 1.05, "FaDoorClosed", HEX.teal, "Prefer require to block: ",
    "a bad block locks users out; a bad require adds a step. Block where the SCuBA baseline demands it, such as legacy authentication and high-risk sign-ins.");
  sources(s, "Sources: Microsoft Learn — Group Policy overview, cloud-native endpoint planning, Intune conflicts, Conditional Access planning; CISA BOD 25-01 and SCuBA. Book 01, Chapter 05.");
  narrate(s,
`Group Policy was Active Directory's most ambitious delivery system, and its most network-bound. A client applies it only when it can reach a domain controller, and every refresh is a trip to one. A cloud-native endpoint, Entra joined and in Intune, has no such dependency.

Don't port a fifty-setting GPO as fifty settings; that carries dead weight, old conflicts and manual targeting. Microsoft's recommended option is to start new rather than migrate. So the program regenerates one canonical policy per category, keyed to attributes, into Intune, Conditional Access and, for servers, Azure machine configuration, because Intune doesn't manage Windows Server.

Every change passes four stages: validation, a simulated tenant, a report-only pilot, then production. And prefer require to block, except where the federal SCuBA baseline demands a block, as for legacy authentication.

Book 05 covers the device detail in depth, and Book 04 the Conditional Access library.`,
  "Book 01, Chapter 05 — Policy Transformation. Depth: Book 05 (Devices & Endpoints), Book 04, Chapter 07.");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What changes", "DNS, DHCP and IPAM move together, and with AD");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 08 AND 09");
  cards(s, "Svc", [
    ["FaGlobe", "DNS", HEX.navy, HEX.navyTint, ["AD-integrated zones replicate with AD", "Clients find DCs through DNS records", "Target: a governed authority, Private Resolver as a bridge, private zones", "The domain's own zones go last"]],
    ["FaHashtag", "DHCP", HEX.teal, HEX.tealTint, ["Authorized in AD; checks every hour", "Stops unauthorized Windows servers, not rogue devices", "Azure DHCP reaches on-premises only through a relay"]],
    ["FaTableList", "IPAM", HEX.amber, HEX.amberTint, ["Often one person's spreadsheet", "One authority, on-premises and cloud", "DNS and DHCP derive from it", "Disagreement is hierarchy drift"]],
  ], 13);
  callout(s, "Phase 2", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "Why \"Phase 2\" never comes: ",
    "identity moves, DNS stays AD-integrated, and AD can never retire. A forest that still hosts AD-integrated DNS has not been retired.");
  sources(s, "Sources: Microsoft Learn — AD-integrated DNS zones, DC locator, DNS Private Resolver, DHCP authorization, Virtual Network Manager IPAM; NIST SP 800-53. Book 01, Chapter 06.");
  narrate(s,
`DNS, DHCP and address management are what agencies most often defer, because they still work. That's how they keep the old directory alive.

AD-integrated zones replicate with Active Directory, and domain-joined clients find domain controllers through records Netlogon registers in DNS, so DNS and AD retirement must be sequenced together. The target is a governed authority outside AD, Azure DNS Private Resolver as a forwarding bridge rather than an authority, and Azure private zones for cloud workloads.

A Windows DHCP server checks its authorization in AD every hour. That stops an unauthorized Windows server, not a rogue device. And one IPAM authority owns the address space; DNS and DHCP derive from it.

Leave the three for "Phase 2" and it rarely comes. A forest that still hosts DNS hasn't been retired. Book 08 covers the design in depth, and Book 09 the network underneath.`,
  "Book 01, Chapter 06 — Network Services: DNS, DHCP and IPAM. Depth: Book 08 (DNS, DHCP & IPAM), Book 09 (Network & Transport).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What changes", "Compute: the domain join is the last thing to go");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 05 AND 06");
  const states = [["Domain-joined", "Group Policy", "Migration origin"], ["Hybrid joined", "Group Policy and Intune", "Waypoint, not a target"],
    ["Entra joined", "Intune", "Target for user PCs"], ["Arc-connected", "Arc, Azure Policy", "Target for servers"]];
  s.addTable([head(["Device state", "Managed by", "Use"]), ...states.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 1 ? HEX.amber : HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: i >= 2, color: i >= 2 ? HEX.teal : HEX.ink } }])],
    tableOpts([1.9, 2.6, 2.4], { y: 1.5, fontSize: 13.5, rowH: [0.42, 0.55, 0.55, 0.55, 0.55] }));
  txt(s, "Table note", "No supported path converts a hybrid-joined device to Entra join without resetting Windows, so time the move to a refresh.",
    { x: 0.6, y: 4.25, w: 6.9, h: 0.8, fontSize: 12.5, italic: true, color: HEX.slate });
  box(s, "SPN box", 7.75, 1.5, 5.0, 3.55, HEX.navyTint);
  icon(s, "FaServer", 8.0, 1.68, 0.6, HEX.navy);
  txt(s, "SPN head", "Every SPN needs a decision", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "SPN list", bullets([
    "Migrate: OAuth 2.0 and OpenID Connect",
    "Retire: often the cheapest option",
    "Island: last resort, with an end-of-life date",
    "No server leaves the domain until each is resolved",
  ], 14), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Data", 5.25, 1.25, "FaDatabase", HEX.amber, "Compute stays with its data: ",
    "every synchronous call pays the network's delay, and separation multiplies it by the round trips. Profile and reduce them first; bandwidth doesn't remove the delay.");
  sources(s, "Sources: Microsoft Learn — device identity, Entra join types, hybrid join planning, Autopilot, Azure Arc, Kerberos constrained delegation, NTLM deprecation. Book 01, Chapter 07.");
  narrate(s,
`Once identity, policy and services have moved, domain-joined PCs and servers are the largest remaining dependency. User PCs end Entra joined and in Intune. Servers come under Azure Arc and machine configuration.

Hybrid join is a waypoint. Microsoft says it shouldn't be anyone's end state, and there's no supported way to convert a hybrid-joined device to Entra join without resetting Windows, so time the move to a hardware refresh.

Every service principal name is an application that expects Kerberos, and each needs a decision: migrate it to modern authentication, retire it, or, as a last resort, island it with an end-of-life date. No server leaves the domain until every SPN on it is resolved, and NTLM goes in the same pass.

And compute stays with its data until profiling shows the round trips are reduced. Books 05 and 06 carry the detail in depth.`,
  "Book 01, Chapter 07 — Compute Transformation. Depth: Book 05 (Devices & Endpoints), Book 06 (Data Platform).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What changes", "The access plane: every request decided again");
  tag(s, "What");
  depth(s, "IN DEPTH: BOOKS 04 AND 07");
  const surf = [
    ["Zero Trust", "The model: no trust from network location", HEX.navy, HEX.navyTint],
    ["Conditional Access", "The decision, made per request", HEX.teal, HEX.tealTint],
    ["SASE", "The edge: ZTNA in place of VPN", HEX.amber, HEX.amberTint],
    ["Phishing-resistant MFA", "The proof: FIDO2, Windows Hello, PIV", HEX.red, HEX.redTint],
  ];
  surf.forEach((p, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Surface ${i + 1}`, x, 1.5, 2.95, 1.1, p[3]);
    txt(s, `Surface ${i + 1} text`, [{ text: p[0], options: { bold: true, color: p[2], fontSize: 15, breakLine: true } }, { text: p[1], options: { fontSize: 13 } }],
      { x: x + 0.15, y: 1.55, w: 2.7, h: 1.0, valign: "middle" });
  });
  const panels = [
    ["FaIdCard", "Smart cards, re-anchored", HEX.navy, HEX.navyTint, ["Card and PIN stay; Entra ID validates the chain", "Multifactor only if the binding policy says so", "Issuance moves first: an enterprise CA needs AD DS"]],
    ["FaUserShield", "No standing privilege", HEX.teal, HEX.tealTint, ["Administrator roles eligible in PIM, just in time", "A vault for what PIM can't govern", "CAE revokes sessions on critical events"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 2.8, 6.0, 2.25, p[3]);
    icon(s, p[0], x + 0.2, 2.9, 0.56, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 2.9, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13.5), { x: x + 0.25, y: 3.55, w: 5.6, h: 1.42, paraSpaceAfter: 4 });
  });
  callout(s, "Apps", 5.25, 1.25, "FaLock", HEX.navy, "Log into applications, not networks: ",
    "OMB M-22-09 requires phishing-resistant MFA for staff, contractors and partners, and BOD 25-01 makes blocking legacy authentication mandatory.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; CISA BOD 25-01, SCuBA, ZTMM v2.0, SASE guidance; Microsoft Learn — Entra CBA, AD CS enterprise CAs, PIM, continuous access evaluation. Book 01, Chapter 08.");
  narrate(s,
`When Active Directory retires, being inside the network stops meaning anything. OMB M-22-09 says users should log into applications rather than networks.

The replacement has four surfaces: Zero Trust as the model, Conditional Access as the per-request decision, SASE as the edge, and phishing-resistant MFA as the proof. M-22-09 requires that MFA for staff, contractors and partners, and BOD 25-01 makes blocking legacy authentication mandatory.

Smart cards stay. Entra certificate-based authentication moves validation from the domain controller to Entra ID, but a card counts as phishing-resistant only if the binding policy makes it multifactor. And issuance needs a successor first, because an enterprise CA depends on AD DS.

Administrators hold no standing privilege: roles are eligible in Privileged Identity Management, and a vault covers what can't be made just in time. Book 04 covers the policy and privilege model in depth, and Book 07 the certificates.`,
  "Book 01, Chapter 08 — The Access Plane. Depth: Book 04 (Access & Privilege), Book 07 (PKI & Certificates).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who leads", "Instruments versus orchestra: who leads it");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Sponsor and CIO", "Scope, funding, sequence, AD retirement"], ["Authorizing official", "The only official who accepts risk"], ["CISO", "Control requirements and logging"]]],
    ["FaClipboardCheck", "Run the program", HEX.teal, HEX.tealTint, [["Program office and steward", "Repository, plans; gates G0, G1, G4"], ["HR and contractor sources", "What worker attributes mean"], ["Records and privacy", "Retention before decommission"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Platform teams", "Five workstreams, a lead for each"], ["Application owners", "Dependencies, tests, cutover sign-off"], ["Help desk", "Scoped roles; verified resets"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Orchestra head", "MICROSOFT PROVIDES THE INSTRUMENTS; THE PROGRAM PROVIDES THE ORCHESTRA", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const orch = [
    ["The instruments", "Entra ID, Intune, Arc, Conditional Access, PIM: each excellent, and none decides the target", HEX.teal],
    ["The orchestra", "decide the target, get there, prove it was done right, and keep it right", HEX.navy],
    ["Ask each month", "the drift trend, the share of changes with a signed plan, and open risk acceptances", HEX.red],
  ];
  orch.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Orchestra ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Orchestra ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; OMB M-22-09, M-19-17; CISA BOD 25-01; NARA GRS 3.2; Microsoft Learn — cloud-first identity guidance, Windows Server 2025. Book 01, Chapter 09.");
  narrate(s,
`Who leads it? Chapter 09 puts it in one line: Microsoft provides the instruments; the program provides the orchestra. The tools are each excellent, but none of them decides what the organizational structure should become, or what to do with the findings, and no vendor deadline forces the decision.

So name one decider per row. The sponsor and CIO own scope, funding, sequence and when AD components retire. The authorizing official is the only official who can accept risk, so every deferred cutoff and Kerberos island reaches them. The CISO sets control requirements. The program office and its steward hold the repository and clear most gates. HR decides what worker attributes mean, application owners sign off their cutovers, and the records officer is consulted before any domain controller is decommissioned.

Each month, ask about the drift trend, signed changes and open risk acceptances.`,
  "Book 01, Chapter 09 — Who Leads the Transformation.");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "Inventory first: read-only, with provenance");
  tag(s, "How");
  cards(s, "Assess", [
    ["FaLock", "Read-only by policy", HEX.navy, HEX.navyTint, ["No write rights on the account", "No write commands imported", "Every call logged by class", "Security operations told the window"]],
    ["FaKey", "Two tiers of access", HEX.teal, HEX.tealTint, ["Tier A: default read, broader than most teams expect", "Tier B: DHCP, DNS settings and CA database exports", "Never secrets"]],
    ["FaFileShield", "Provenance, every run", HEX.amber, HEX.amberTint, ["Who, when and against what", "Which tier of rights", "A SHA-256 hash of every file", "A signed commit; no run ID reused"]],
  ]);
  callout(s, "Profile", 5.3, 1.2, "FaChartLine", HEX.red, "Profile before separating: ",
    "count each business transaction's synchronous round trips to its data, reduce them, and measure again. Without that profile, the plan won't approve the move.");
  sources(s, "Sources: NIST SP 800-53 AC-6; Microsoft Learn — default AD permissions, DHCP Users group, Windows Server 2025 AD DS, Arc Extended Security Updates, Defender for Identity. Book 01, Chapter 10.");
  narrate(s,
`How do you get there? Start with an inventory. You can't modernize what you haven't enumerated, and nothing is retired until it's written down, read-only, with proof of how it was read.

The assessment account holds no write rights, the code imports no write commands, and every call is logged. A default authenticated account already reads more than most teams expect: the topology, the OU tree, most Group Policy, users, groups and certificate templates. A narrow second tier adds only server-side exports, never secrets. Every run records who, when, against what, and a hash of every file.

Eleven streams feed the risk scoring. One example: Windows Server 2012 extended updates through Arc ended on October 13, 2026, and Windows Server 2016 reaches end of support on January 12, 2027, so every such server needs a disposition.

And no application leaves its data until its transactions are profiled.`,
  "Book 01, Chapter 10 — Analyzing the Estate.");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Analyze, plan, deliver, under an actuation ceiling");
  tag(s, "How");
  rows(s, "Stage", "THREE STAGES, TWO GATES, ONE EVIDENCE PACKET", [
    ["Analyze", "Current and target graphs, diff, risk"],
    ["Plan", "Typed, scoped, ordered, rollback-paired"],
    ["Validate", "Schema, rules, boundary, safety"],
    ["Authorize", "An approver of record, not the author"],
    ["Deliver", "Separate identity; verify each action"],
    ["Evidence", "Signed packet to the repository and SIEM"],
  ], 1.92, 0.56, 0.48);
  sideBox(s, "Ladder", "FaArrowDownWideShort", HEX.teal, HEX.tealTint, "THE ACTUATION LADDER", "Gated actuation is the ceiling", [
    "L0 Record and L1 Observe: read-only",
    "L2 Advise: plans surfaced, no writes",
    "L3 Gated: a person approves, dry run first",
    "L4 Autonomous: enumerated low-risk classes",
  ], 14);
  callout(s, "Zero", 5.45, 1.05, "FaArrowsRotate", HEX.amber, "The zero-action plan: ",
    "when nothing has drifted, the next run produces no actions. Tenant-wide roles and Conditional Access enforcement stay gated permanently.");
  sources(s, "Sources: CISA Zero Trust Maturity Model v2.0; OMB M-22-09, M-26-14; Microsoft Learn — role-assignable groups, Microsoft Graph best practices and throttling. Book 01, Chapters 03 and 11.");
  narrate(s,
`Chapter 11 turns the inventory into change in three stages. Analyze builds current-state and target-state graphs and a diff. Plan expands the diff into typed actions, each scoped to one object, ordered by dependency and paired with its rollback. A plan must pass validation, then authorization by an approver of record who isn't the author. Only then does a separate execution identity deliver it, verifying every action and closing with an evidence packet.

The actuation ladder caps how far automation may go: record, observe, advise, gated actuation, and autonomy only for enumerated low-risk classes. Gated actuation is the default ceiling, because it's a posture an authorizing official can sign. CISA calls its maturity model a general guide, not a strict set of requirements, so this is design, not mandate.

When nothing has drifted, the next run produces a zero-action plan.`,
  "Book 01, Chapter 11 — Analysis, Plan, Delivery; Chapter 03 (the control plane over the data planes).");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "The roadmap: seven phases, gated by data");
  tag(s, "How");
  const phases = [["Pre-flight", "Weeks 1–4"], ["Foundation", "Weeks 5–8"], ["Pilot division", "Weeks 9–16"], ["General rollout", "Weeks 17–36"],
    ["Legacy retirement", "Weeks 37–44"], ["AD DS retirement", "Weeks 45–48"], ["Steady state", "Week 49 on"]];
  phases.forEach((f, i) => {
    const x = 0.6 + i * 1.75;
    box(s, `Phase ${i}`, x, 1.5, 1.65, 1.35, i === 6 ? HEX.tealTint : (i === 5 ? HEX.redTint : HEX.grey));
    txt(s, `Phase ${i} text`, [
      { text: `${i}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 13, breakLine: true } },
      { text: f[1], options: { fontSize: 11.5 } },
    ], { x: x + 0.1, y: 1.55, w: 1.47, h: 1.25, valign: "middle" });
  });
  const prin = [
    ["One authoritative source", "Every access attribute has one source"],
    ["Application-aware networking", "Identity and context, not location"],
    ["Token-based identity", "Signed tokens replace sessions"],
    ["Govern actively", "Reconcile toward intent, under a ceiling"],
    ["Fewer round trips", "Profile before separating"],
  ];
  prin.forEach((d, i) => {
    const x = 0.6 + i * 2.4625;
    box(s, `Principle ${i + 1}`, x, 3.05, 2.3, 2.0, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Principle ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 22, fontFace: "Cambria", breakLine: true } },
      { text: d[0], options: { bold: true, color: HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: d[1], options: { fontSize: 13 } },
    ], { x: x + 0.15, y: 3.12, w: 2.0, h: 1.86, paraSpaceAfter: 3 });
  });
  callout(s, "Gates", 5.25, 1.25, "FaClipboardCheck", HEX.navy, "Gates read from data: ",
    "\"zero drift for fourteen days\" is a query, not a signature. The weeks are illustrative; large federal estates typically run multi-year.");
  sources(s, "Sources: NIST SP 800-207; FedRAMP Consolidated Rules for 2026 and \"Using a FedRAMP Certified Cloud Service\"; Microsoft Learn — emergency access, DC demotion. Book 01, Chapter 12.");
  narrate(s,
`Chapter 12 sequences everything as an illustrative fifty-two-week program: seven phases, from pre-flight to steady state, with five workstreams running in parallel. Large federal estates typically run multi-year; the weeks are a sequencing model, not a commitment.

A phase opens only when the last gate clears, and gates read from data: "zero drift for fourteen days" is a query, not a signature. The steward clears most gates; the sponsor and CIO sign the one that says Active Directory is retired.

Under it all is one structural move: separate truth from enforcement. A governance layer holds and reconciles authoritative state, while identity, network and device platforms enforce at runtime. Five principles follow: one authoritative source, application-aware networking, token-based identity, governing actively, and fewer synchronous round trips.

And read one clock correctly: FedRAMP's 2027 date governs cloud providers' certification. The agency still authorizes its own systems.`,
  "Book 01, Chapter 12 — The Migration Roadmap.");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaUserCheck", "Name the owners", "One decider per row, starting with the sponsor, the authorizing official and the steward", HEX.navy, HEX.navyTint],
    ["FaListCheck", "Run the read-only assessment", "All eleven categories, committed with provenance", HEX.teal, HEX.tealTint],
    ["FaServer", "Stand up the platform host", "One writer; governance kept apart from execution", HEX.amber, HEX.amberTint],
    ["FaCodeBranch", "Set the dates", "Gate dates on the sponsor's calendar; exception end dates on the authorizing official's", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Start with an inventory, an owner, and a date: ",
    "none of this requires a vendor decision on day one. Phase 0 produces all three, and every later decision reads from them.");
  sources(s, "Sources: OMB M-22-09 (zero trust implementation lead); NIST SP 800-37 Rev. 2. Book 01, Chapters 09, 10 and 12.");
  narrate(s,
`So, four decisions.

Name the owners: one decider per row, starting with the sponsor, the authorizing official and the steward, and confirm who holds the zero trust implementation lead role M-22-09 required.

Run the read-only assessment, across all eleven categories, committed with provenance.

Stand up the platform host, so every change has one writer and a plan.

And set the dates: gate dates on the sponsor's calendar, and every exception's end date on the authorizing official's.

None of this requires a vendor decision on day one. Start with an inventory, an owner, and a date.

Modernization is a governance rebuild, not a platform swap. Book 01 is the map, and Books 02 to 09 carry each part in depth, every claim footnoted. Thank you.`,
  "Book 01, Chapter 09 (What to do next); Chapter 12 (Where to start); index.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB: Federal Data Center Consolidation Initiative (2010); 25 Point IT Reform Plan (2010); M-19-17; M-22-09; M-26-14 (rescinds M-21-31).  ·  EO 14028.  ·  NARA GRS 3.2; 36 CFR 1220.34.",
    "CISA: BOD 25-01 and its required SCuBA configurations; Zero Trust Maturity Model v2.0 (April 2023); SASE in a Modern TIC 3.0 Solution (June 2026); Scattered Spider advisory AA23-320A.",
    "NIST: SP 800-207; SP 800-37 Rev. 2; SP 800-53 Rev. 5 (release 5.2.0).  ·  ITU-T G.114.  ·  RFC 4120.  ·  FedRAMP Consolidated Rules for 2026, timeline and \"Using a FedRAMP Certified Cloud Service\".",
    "Microsoft Learn, identity: Kerberos ticket lifetimes and KDC keys; continuous access evaluation; hybrid join; cloud-first identity guidance; OU delegation; dynamic groups; administrative units; Conditional Access; Entra CBA; PIM.",
    "Microsoft Learn, platform: Windows Server 2025 and release information; IIS reverse proxy; Azure Arc; machine configuration; Intune and Group Policy analytics; AD DS tier model; Microsoft Graph best practices.",
    "Microsoft Learn, services and compute: AD-integrated DNS; DC locator; DNS Private Resolver; DHCP authorization; Virtual Network Manager IPAM; Autopilot; NTLM deprecation; Arc Extended Security Updates.",
    "Full footnotes with links and access dates: Book 01, every chapter (whalermike.github.io/modernization-workbook/docs/books/b01-transformation-arc/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}


// ------------------------------------------------------------------ Backup: federal requirements (the deck's endnotes)
{
  const s = D.content("Backup", "Federal requirements: full citations");
  const R = [
    ["OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles", "§III.A Identity: centralized identity management for agency users; at least one device-level signal alongside identity. §III.B Devices: a complete inventory of every device; EDR. §III.D Applications and workloads", "Jan. 26, 2022", "HR, Intune and non-person tracks"],
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "AC-2 Account Management; AC-6 Least Privilege", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "HR and non-person tracks"],
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "CM-2 Baseline Configuration; CM-6 Configuration Settings; CM-8 System Component Inventory", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "Intune and Arc tracks"],
    ["NIST SP 800-53B, Control Baselines", "AC-2, CM-2, CM-6 and CM-8 are in the Low, Moderate and High baselines; AC-6 in Moderate and High", "Sept. 2020", "All four tracks"],
  ];
  s.addTable([head(["Primary source", "Section or control", "Date", "Used for"]),
    ...R.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }, { text: r[3] }])],
    tableOpts([3.3, 4.85, 1.95, 2.05], { y: 1.45, fontSize: 11.5, rowH: [0.36, 0.89, 0.7, 0.7, 0.5] }));
  txt(s, "Requirements note", "Mapping from Book 01, Appendix A (Requirements Mapping), sources checked October 21, 2026. A compliance-enabling map, not a compliance claim: whether a control is satisfied depends on the agency's own boundary, implementation and assessor.",
    { x: 0.6, y: 6.0, w: 12.15, h: 0.55, fontSize: 11, italic: true, color: HEX.slate });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
