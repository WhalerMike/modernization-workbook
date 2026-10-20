// Book 04 — Access & Privilege: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b04-access/build.js presentations/b04-access/B04_Access.pptx
// Every fact comes from a footnoted chapter of docs/books/b04-access/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 04", title: "Access & Privilege" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B04_Access.pptx";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why policy decides", "Why Is Every Access Decision a Policy Decision?", "Book 04 — Access & Privilege");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:34]  This briefing comes from Book 04 of the Modernization Workbook, Access and Privilege.

Book 02 moved the identity. Book 03 made its facts trustworthy. This book is about what happens with them on every sign-in: who gets access to what, under which conditions, and how administrator power is kept from becoming an open door.

I'll take it through why, what, who and how. The short version: in Zero Trust, every access decision is a policy decision, and the policy library is the agency's access control in practice.

Workbook: Book 04, index.`);
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why policy decides", "Access is decided per request, by policy");
  tag(s, "Why");
  const rows = [
    ["FaLandmark", "OMB M-22-09", HEX.navy, "Every request evaluated; network location confers no trust."],
    ["FaBook", "NIST SP 800-207", HEX.teal, "A policy decision point, separate from where access is enforced."],
    ["FaScaleBalanced", "Conditional Access", HEX.amber, "Entra ID's decision point: all applicable policies must be satisfied, block wins."],
  ];
  rows.forEach((r, i) => {
    const y = 1.6 + i * 1.08;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[2]);
    txt(s, `Policy ${i + 1}`, [{ text: r[1], options: { bold: true, color: r[2], fontSize: 16.5, breakLine: true } }, { text: r[3], options: { fontSize: 14.5 } }],
      { x: 1.4, y, w: 5.6, h: 1.0 });
  });
  box(s, "Old box", 7.25, 1.55, 5.5, 3.65, HEX.redTint);
  icon(s, "FaDoorOpen", 7.5, 1.78, 0.75, HEX.red);
  txt(s, "Old head", [
    { text: "WHAT IT REPLACES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Access decided once, trusted afterward", options: { bold: true, color: HEX.red, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.45, y: 1.72, w: 4.15, h: 0.95, valign: "middle" });
  txt(s, "Old list", bullets([
    "Inside the network, therefore trusted",
    "In the group, therefore allowed — forever",
    "These survive a migration unless deliberately replaced by policy",
  ], 15), { x: 7.55, y: 2.85, w: 5.0, h: 2.2, paraSpaceAfter: 7 });
  callout(s, "Exclusions", 5.45, 1.05, "FaTriangleExclamation", HEX.amber, "Every exclusion is a standing hole: ",
    "exclusions override every policy, so each one needs an owner and a review. And policy is only as good as the attributes it reads (Book 03).");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; Microsoft Learn — Conditional Access overview and policy evaluation. Book 04, Chapter 01.");
  s.addNotes(
`[0:34–1:40]  Why is every access decision a policy decision? Because federal Zero Trust policy says so, and the platform works that way.

OMB M-22-09 requires that every access request be evaluated and that network location confer no trust. NIST Special Publication 800-207 describes the architecture: a policy decision point, separate from the places where access is enforced. In Microsoft Entra ID, that decision point is Conditional Access. It decides by rule: every applicable policy must be satisfied, a block wins, and exclusions override everything.

What it replaces is access decided once and trusted afterward. Inside the network, therefore trusted. In the group, therefore allowed, forever. Those assumptions survive a migration unless someone deliberately replaces them with policy.

Two consequences run through the book. Every exclusion is a standing hole, so each one needs an owner and a review. And policy is only as good as the attributes it reads, which is why Book 03 matters here.

Workbook: Book 04, Chapter 01 — Access Is a Policy Decision.`);
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why policy decides", "Standing privilege is an open door");
  tag(s, "Why");
  const cols = [
    ["Standing", HEX.red, HEX.redTint, ["Always on, at any hour", "A stolen credential yields the full role", "Stronger sign-in doesn't narrow scope"]],
    ["Eligible, just in time", HEX.teal, HEX.tealTint, ["Activated only when needed, for a set time", "Approval by someone other than the requester", "Fresh strong sign-in; every elevation logged"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.2;
    box(s, `Col ${i}`, x, 1.55, 4.05, 3.6, c[2]);
    txt(s, `Col ${i} head`, c[0], { x: x + 0.25, y: 1.7, w: 3.6, h: 0.55, bold: true, color: c[1], fontSize: 20, fontFace: "Cambria" });
    txt(s, `Col ${i} text`, bullets(c[3], 15), { x: x + 0.25, y: 2.4, w: 3.6, h: 2.6, paraSpaceAfter: 8 });
  });
  box(s, "BG box", 9.0, 1.55, 3.75, 3.6, "FFFFFF", HEX.amber);
  icon(s, "FaKey", 9.25, 1.72, 0.62, HEX.amber);
  txt(s, "BG head", "The one exception", { x: 10.0, y: 1.72, w: 2.7, h: 0.62, bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "BG text", "Two break-glass accounts stay permanently active — safe only when phishing-resistant, monitored, tested every 90 days, and documented as a deviation in the security plan.",
    { x: 9.25, y: 2.5, w: 3.3, h: 2.55, fontSize: 14 });
  callout(s, "Evidence", 5.4, 1.1, "FaShieldHalved", HEX.navy, "Why it matters to assessors: ",
    "NSA and CISA rank poor separation of user and administrator privilege among the most common misconfigurations; NIST AC-6 requires least privilege, reviews and logged privileged functions.");
  sources(s, "Sources: NSA/CISA AA23-278A; NIST SP 800-53 AC-6; CISA ZTMM; Microsoft Learn — emergency access accounts. Book 04, Chapter 02.");
  s.addNotes(
`[1:40–2:44]  The same logic applies to administrators, and this is where most breaches go.

A standing administrator is always on, at any hour, so any stolen credential or session that reaches the role yields all of it. Stronger authentication helps, but it doesn't narrow what the role can do, where, or when. An eligible administrator is different: the role is activated only when needed, for a set time, with approval from someone other than the requester, a fresh strong sign-in, and a log of every elevation.

NSA and CISA rank poor separation of user and administrator privilege among the most common misconfigurations they find, and NIST control AC-6 requires least privilege, recurring reviews and logged privileged functions.

There's one standing exception: two break-glass accounts stay permanently active, so the tenant can be recovered if everything else fails. They're safe only when they're governed: phishing-resistant, monitored, tested every ninety days, and documented as a deviation in the system security plan.

Workbook: Book 04, Chapter 02 — Why Standing Privilege Fails.`);
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What it is", "What Conditional Access evaluates");
  tag(s, "What");
  const steps = [["Signals", "User, groups and roles; device; app; location; sign-in and user risk"], ["Conditions", "Which policies apply to this request"],
    ["Controls", "Block, or grant with MFA, authentication strength, compliant device, app protection, terms"], ["Session", "Sign-in frequency, persistent browser, app-enforced limits"]];
  steps.forEach((st, i) => {
    const x = 0.6 + i * 3.06;
    box(s, `Step ${i}`, x, 1.6, 2.85, 2.1, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Step ${i} text`, [{ text: st[0], options: { bold: true, fontSize: 18, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } }, { text: st[1], options: { fontSize: 14 } }],
      { x: x + 0.2, y: 1.75, w: 2.45, h: 1.85, paraSpaceAfter: 4 });
  });
  txt(s, "Rules", bullets([
    "Report-only first: every policy shows its impact before it enforces",
    "Personas, not individuals: admins, internals, guests, workload identities",
    "Deleted policies stay recoverable for 30 days; a tenant holds up to 240 policies",
  ], 15), { x: 0.6, y: 3.9, w: 12.15, h: 1.3, paraSpaceAfter: 5 });
  callout(s, "Changed", 5.35, 1.15, "FaArrowsRotate", HEX.amber, "Recent platform change: ",
    "the \"approved client app\" grant became read-only on June 30, 2026 — mobile access now relies on app protection policies.");
  sources(s, "Sources: Microsoft Learn — Conditional Access policy components, report-only mode, service limits. Book 04, Chapter 03.");
  s.addNotes(
`[2:44–3:52]  What does the policy engine actually evaluate?

Signals first: the user, their groups and roles; the device; the application; the location; and sign-in and user risk. Conditions decide which policies apply to this particular request. Then controls: block, or grant with requirements such as multifactor authentication, a specific authentication strength, a compliant device, an app protection policy, or acceptance of terms. And session controls, like how often to re-authenticate.

Three operating rules run through the library. Every policy runs in report-only mode first, so its impact is visible before it enforces. Policies target personas, admins, internal staff, guests and workload identities, not individuals. And deletion isn't final: deleted policies are recoverable for thirty days, and a tenant can hold up to two hundred and forty policies.

One recent platform change matters: the approved client app grant became read-only on June 30, 2026, so mobile access now relies on app protection policies.

Workbook: Book 04, Chapter 03 — The Conditional Access Model.`);
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What it is", "Privilege and applications, structured");
  tag(s, "What");
  const cols = [
    ["FaUserShield", "Privileged roles", HEX.navy, HEX.navyTint, ["Least-privileged built-in roles, by task", "Fewer than 5 Global Administrators", "Role-assignable groups: assigned membership only, 500 per tenant", "Tiers follow the enterprise access model"]],
    ["FaCubes", "Applications", HEX.teal, HEX.tealTint, ["App owners hold admin rights over their app — keep them few", "Admin consent through a governed workflow", "Certificates or federated credentials, not secrets", "Managed identities for Azure workloads"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 6.12;
    box(s, `Col ${i}`, x, 1.55, 6.0, 3.6, c[3]);
    icon(s, c[0], x + 0.25, 1.72, 0.62, c[2]);
    txt(s, `Col ${i} head`, c[1], { x: x + 1.05, y: 1.72, w: 4.7, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Col ${i} text`, bullets(c[4], 15), { x: x + 0.25, y: 2.5, w: 5.5, h: 2.6, paraSpaceAfter: 7 });
  });
  callout(s, "Grants", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "What people get wrong: ",
    "consent grants never expire, and revoking one leaves issued tokens valid — so application access needs the same review discipline as people.");
  sources(s, "Sources: Microsoft Learn — privileged roles and permissions, role-assignable groups, enterprise access model, consent, app ownership. Book 04, Chapters 04–05.");
  s.addNotes(
`[3:52–4:49]  What's the structure underneath? Two parts: privilege and applications.

For privilege: use the least-privileged built-in role for each task; keep fewer than five Global Administrators, as Microsoft recommends; use role-assignable groups, which take assigned membership only and are limited to five hundred per tenant; and tier everything along Microsoft's enterprise access model, which builds on the old Active Directory tier model rather than replacing it.

For applications: application owners actually hold administrator rights over their app, including adding a credential, so keep them few. Admin consent goes through a governed workflow. Applications authenticate with certificates or federated credentials rather than secrets, and Azure workloads use managed identities.

What people get wrong: consent grants never expire, and revoking one leaves already-issued tokens valid. So application access needs the same review discipline as people.

Workbook: Book 04, Chapter 04 — Privileged Roles and Tiers; Chapter 05 — Applications and Workload Identities.`);
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who decides", "Who decides access, and who executes it");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Business and app owners", "Who should have access, and why"], ["CISO", "The policy baseline and exceptions"], ["Identity governance office", "Approval chains and reviews"]]],
    ["FaUsersGear", "Execute", HEX.teal, HEX.tealTint, [["Identity engineering", "Policies, PIM, consent, packages"], ["Help desk", "Assignments, under a scoped role"], ["Security operations", "Alerts, risky sign-ins, response"]]],
    ["FaShieldHalved", "Assure", HEX.amber, HEX.amberTint, [["ISSO", "Evidence and findings"], ["Authorizing official", "Accepted risk"], ["Reviewers", "Recertify access on schedule"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  callout(s, "Split", 5.3, 1.2, "FaPeopleArrows", HEX.navy, "The rule: ",
    "the people who execute access changes never approve them. The help desk works under a custom role that manages assignments only; consent and roles stay with identity engineering.");
  sources(s, "Program design; Microsoft Learn — Entra roles and custom roles. Book 04, Chapter 06.");
  s.addNotes(
`[4:49–5:53]  Who decides access, and who executes it? The book keeps those apart.

Deciding: business and application owners decide who should have access and why. The CISO owns the policy baseline and its exceptions. And an identity governance office owns approval chains and reviews.

Executing: identity engineering builds the policies, the PIM settings, consent and access packages. The help desk handles assignments under a scoped role. Security operations handles alerts, risky sign-ins and response.

Assuring: the ISSO owns the evidence and findings, the authorizing official owns accepted risk, and reviewers recertify access on schedule.

The rule that holds it together: the people who execute access changes never approve them. That's why the help desk works under a custom role that manages assignments only, while consent and administrator roles stay with identity engineering. The old guide gave the help desk Application Administrator, which can grant consent and act as any app, so that rule existed only on paper.

Workbook: Book 04, Chapter 06 — Who Decides Access.`);
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to run it", "The policy library, rolled out in waves");
  tag(s, "How");
  const waves = [["Wave 1", "Foundation", "Block legacy authentication; baselines"], ["Wave 2", "Admins", "Phishing-resistant MFA; PAW-only sign-in"], ["Wave 3", "Everyone", "MFA baseline; device and app controls"], ["Wave 4", "Risk", "Block high-risk users and sign-ins"], ["Wave 5", "Segments", "Guests, workloads, end state"]];
  waves.forEach((w, i) => {
    const x = 0.6 + i * 2.46;
    box(s, `Wave ${i}`, x, 1.6, 2.3, 2.15, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Wave ${i} text`, [{ text: w[0], options: { bold: true, fontSize: 13, color: HEX.slate, breakLine: true } }, { text: w[1], options: { bold: true, fontSize: 18, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } }, { text: w[2], options: { fontSize: 13.5 } }],
      { x: x + 0.15, y: 1.72, w: 2.0, h: 1.95, paraSpaceAfter: 3 });
  });
  txt(s, "Gates", [
    { text: "Every policy: ", options: { bold: true, color: HEX.navy } },
    { text: "report-only 2–4 weeks → pilot ring → expanding rings → enforced and monitored. A wave starts only after the previous one has run a week without incident. Roll back by switching off or to report-only — never by deleting." },
  ], { x: 0.6, y: 3.95, w: 12.15, h: 0.95, fontSize: 15 });
  callout(s, "BOD", 5.25, 1.3, "FaListCheck", HEX.amber, "Built to the CISA baseline: ",
    "the library keeps Book 02's CA001–CA017 and adds CA018–CA038 for the BOD 25-01 Entra ID requirements — including blocking high-risk users and phishing-resistant MFA for all members.");
  sources(s, "Sources: Microsoft Learn — Conditional Access deployment; CISA BOD 25-01 and SCuBA Entra ID baseline. Book 04, Chapter 07 and Appendix A.");
  s.addNotes(
`[5:53–7:05]  How. The policy library is rolled out in five waves.

Wave one is the foundation, starting with blocking legacy authentication. Wave two is administrators: phishing-resistant authentication and sign-in only from privileged access workstations. Wave three is everyone: an MFA baseline plus device and app controls. Wave four is risk: blocking high-risk users and sign-ins. And wave five covers the remaining segments, guests and workload identities, and the end state.

Every policy passes the same gates: two to four weeks in report-only, then a pilot ring, then expanding rings, then enforced and monitored. A wave starts only after the previous one has run a week without incident. And rollback means switching a policy off or back to report-only, never deleting it.

The library is built to CISA's baseline. It keeps Book 02's policies CA001 to CA017 and adds CA018 to CA038 for the BOD 25-01 Entra ID requirements, including blocking high-risk users and requiring phishing-resistant MFA for all members.

Workbook: Book 04, Chapter 07 — The Conditional Access Policy Library; Appendix A.`);
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to run it", "PIM: eligible, requested, approved, logged");
  tag(s, "How");
  const st = ["Eligible assignment", "Request with justification and ticket", "Step-up through an authentication context", "Approval by someone else", "Time-boxed activation", "Logged, alerted, reviewed"];
  st.forEach((t, i) => {
    const x = 0.6 + i * 2.05;
    box(s, `PIM ${i}`, x, 1.65, 1.9, 1.7, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `PIM ${i} text`, [{ text: `${i + 1}`, options: { bold: true, fontSize: 24, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } }, { text: t, options: { fontSize: 13.5, bold: true } }],
      { x: x + 0.12, y: 1.72, w: 1.66, h: 1.58, align: "center" });
  });
  txt(s, "PIM facts", bullets([
    "Activation runs 1 to 24 hours; the approval window is a fixed 24 hours, single stage",
    "PIM's built-in MFA can be satisfied earlier in the session — an authentication context forces a fresh step-up",
    "Approvers can't approve their own requests; a role with no approvers falls back to active Privileged Role Administrators",
    "Licenses: Entra ID P2 or ID Governance; if they lapse, eligible assignments are removed",
  ], 14.5), { x: 0.6, y: 3.55, w: 12.15, h: 1.75, paraSpaceAfter: 5 });
  callout(s, "Settings", 5.45, 1.05, "FaClipboardCheck", HEX.slate, "Per-role settings: ",
    "Appendix B sets each role's activation time, approvers, context and notifications — tighter for Tier 0 and Tier 1 than Book 02's first table.");
  sources(s, "Sources: Microsoft Learn — PIM role settings, approval workflow, licensing. Book 04, Chapter 08 and Appendix B.");
  s.addNotes(
`[7:05–8:17]  For administrators, Privileged Identity Management turns privilege into a governed request.

An administrator holds an eligible assignment, not an active one. To use it, they request activation with a justification and a ticket; step up through an authentication context; get approval from someone else; and receive a time-boxed activation that's logged, alerted and later reviewed.

The details matter, and the old guides had several wrong. Activation can run from one to twenty-four hours, and the approval window is a fixed twenty-four hours with a single stage. PIM's built-in MFA can be satisfied by an earlier sign-in in the same session, so the book uses an authentication context to force a fresh step-up. Approvers can't approve their own requests, and if a role has no approvers configured, active Privileged Role Administrators become the approvers by default. And licensing: PIM needs Entra ID P2 or ID Governance, and if those licenses lapse, eligible assignments are removed.

Appendix B sets every role's activation time, approvers, context and notifications, tighter for Tier 0 and Tier 1 than Book 02's first table.

Workbook: Book 04, Chapter 08 — PIM Self-Request with Approval; Appendix B.`);
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to run it", "Govern access, manage it as code, prove it");
  tag(s, "How");
  const cols = [
    ["FaListCheck", "Governance", HEX.navy, HEX.navyTint, ["Access packages with approval and expiry", "Reviews on a tiered cadence", "Review groups, not just apps", "Guests sponsored and reviewed"]],
    ["FaCodeBranch", "As code", HEX.teal, HEX.tealTint, ["Policies, PIM and packages in version control", "Change through review, not the portal", "Drift monitored against a baseline", "Export results before changing baselines"]],
    ["FaFileShield", "Evidence", HEX.amber, HEX.amberTint, ["AC-2, AC-3, AC-6, IA-2, CA-7", "Logs kept 30 days in Entra — export them", "Every elevation and review on record"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gov ${i}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Gov ${i} head`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Gov ${i} text`, bullets(c[4], 14), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, paraSpaceAfter: 6 });
  });
  callout(s, "Gap", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "A trap in the tooling: ",
    "reviewing an application doesn't remove members of the groups assigned to it — and Entra keeps sign-in and audit logs only 30 days with P1/P2.");
  sources(s, "Sources: Microsoft Learn — entitlement management, access reviews, configuration management, log retention; NIST SP 800-53. Book 04, Chapters 09–10.");
  s.addNotes(
`[8:17–9:25]  Finally, governance, code and evidence.

Governance: access is requested through access packages with approval and expiry; reviews run on a tiered cadence; and the book reviews groups, not just applications. Guests have sponsors and are reviewed too.

As code: Conditional Access, PIM settings and access packages live in version control. Changes go through review rather than the portal, drift is monitored against a baseline, and results are exported before a baseline is changed, because changing it erases that monitor's history.

Evidence: the book maps all of this to the access-control, identification and continuous-monitoring controls, AC-2, AC-3, AC-6, IA-2 and CA-7, with every elevation and every review on record.

Two traps in the tooling. Reviewing an application doesn't remove members of the groups assigned to it, so the groups themselves have to be reviewed. And Entra keeps sign-in and audit logs only thirty days with P1 or P2, so the evidence has to be exported from day one.

Workbook: Book 04, Chapter 09 — Access Governance; Chapter 10 — Access as Code, and the Evidence It Produces.`);
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to run it", "What we need");
  tag(s, "How");
  const asks = [
    ["FaListCheck", "Adopt the library", "Book 04's Conditional Access library and wave plan as the access baseline", HEX.navy, HEX.navyTint],
    ["FaUserClock", "End standing privilege", "Every admin role eligible through PIM, except two governed break-glass accounts", HEX.teal, HEX.tealTint],
    ["FaPeopleArrows", "Separate decide from execute", "Name owners; scope the help desk role; stand up the governance office", HEX.amber, HEX.amberTint],
    ["FaCodeBranch", "Manage access as code", "Version control, review and drift monitoring — and keep the evidence", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaBook", HEX.navy, "Read next: ",
    "Book 04 for the full library and settings, every claim footnoted; Book 05 for the device compliance that Conditional Access reads.");
  s.addNotes(
`[9:25–10:20]  So, four asks.

Adopt the library: Book 04's Conditional Access library and wave plan as the agency's access baseline.

End standing privilege: every administrator role eligible through PIM, with two governed break-glass accounts as the only standing exception.

Separate deciding from executing: name the owners, scope the help desk role, and stand up the identity governance office.

And manage access as code: version control, review and drift monitoring, with the evidence kept from day one.

In Zero Trust, every access decision is a policy decision. Writing that policy down, testing it, and proving it ran is how an agency knows who can reach what, and why.

Book 04 has the full library and settings, with every external claim footnoted. Book 05 covers the device compliance that Conditional Access reads. Thank you.

Workbook: Book 04, index.`);
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022.  ·  NIST SP 800-207, Zero Trust Architecture, August 2020.",
    "NSA and CISA, AA23-278A, NSA and CISA Red and Blue Teams Share Top Ten Cybersecurity Misconfigurations, October 2023.",
    "NIST SP 800-53 Rev. 5 (AC-2, AC-3, AC-6 and enhancements, IA-2, CA-7).  ·  CISA Zero Trust Maturity Model v2.0.  ·  CISA BOD 25-01 and the SCuBA Entra ID baseline.",
    "Microsoft Learn: Conditional Access overview, policy components, report-only mode, service limits; approved client app retirement.",
    "Microsoft Learn: privileged roles and permissions; least privileged roles by task; role-assignable groups; enterprise access model; emergency access accounts.",
    "Microsoft Learn: PIM role settings, approval workflow, alerts, licensing.  ·  Consent and app ownership; workload identities; managed identities.",
    "Microsoft Learn: entitlement management; access reviews; Tenant Governance configuration management; data retention.",
    "Full footnotes with links and access dates: Book 04, every chapter (whalermike.github.io/modernization-workbook/docs/books/b04-access/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
