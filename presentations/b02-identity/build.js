// Book 02 — Identity & Directory: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b02-identity/build.js presentations/b02-identity/B02_Identity.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b02-identity/;
// the notes name the chapter. Narration: presentations/_build/narrate.py, then build_narrated.ps1.
const D = require("../_build/lib.js")({ book: "Book 02", title: "Identity & Directory" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B02_Identity.pptx";

// ------------------------------------------------------------------ 1 Title
{
  const s = D.titleSlide("Why identity matters", "Why Does Identity Matter?", "Book 02 — Active Directory to Entra ID");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:29]  This briefing comes from Book 02 of the Modernization Workbook, Identity and Directory: the move from Active Directory to Entra ID.

I'll take it through four questions. Why identity matters now. What actually changes when a directory moves to the cloud. Who has to own which decisions. And how to do it without losing the governance that twenty-five years of Active Directory quietly carried.

The short version: this is not a directory upgrade. It decides whether every security control after it works.

Workbook: Book 02, index.`);
}

// ------------------------------------------------------------------ 2 Why: identity is the control plane
{
  const s = D.content("Why identity matters", "Identity is now where access is decided");
  tag(s, "Why");
  txt(s, "Policy head", "FEDERAL ZERO TRUST POLICY MOVED THE DECISION", { x: 0.6, y: 1.55, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const rows = [
    ["FaLandmark", "OMB M-22-09", HEX.navy, "Agency staff use enterprise-managed identities and phishing-resistant MFA."],
    ["FaBook", "NIST SP 800-207", HEX.teal, "No implicit trust from network location; every request is evaluated."],
    ["FaSitemap", "CISA Zero Trust Maturity Model", HEX.amber, "Identity is the first of five pillars."],
  ];
  rows.forEach((r, i) => {
    const y = 1.95 + i * 1.08;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[2]);
    txt(s, `Policy ${i + 1}`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 16.5, breakLine: true } },
      { text: r[3], options: { fontSize: 14.5 } },
    ], { x: 1.4, y, w: 5.6, h: 1.0 });
  });
  box(s, "Consequence box", 7.25, 1.55, 5.5, 3.65, HEX.navyTint);
  icon(s, "FaIdCard", 7.5, 1.78, 0.75, HEX.navy);
  txt(s, "Consequence head", [
    { text: "WHAT THAT MEANS", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The identity provider enforces what it believes", options: { bold: true, color: HEX.navy, fontSize: 19, fontFace: "Cambria" } },
  ], { x: 8.45, y: 1.72, w: 4.15, h: 0.95, valign: "middle" });
  txt(s, "Consequence text", bullets([
    "Who is this person, and is that still true?",
    "Which groups and roles do they hold, and why?",
    "Is this device managed and healthy?",
  ], 15), { x: 7.55, y: 2.85, w: 5.0, h: 1.6, paraSpaceAfter: 6 });
  txt(s, "Consequence close", "If those facts are wrong, every policy built on them is wrong.",
    { x: 7.55, y: 4.5, w: 5.0, h: 0.55, fontSize: 15, bold: true, color: HEX.navy });
  callout(s, "Not an upgrade", 5.45, 1.05, "FaTriangleExclamation", HEX.red, "Not a directory upgrade: ",
    "moving to Entra ID decides whether every later control — Conditional Access, PIM, device compliance — has true facts to act on.");
  sources(s, "Sources: OMB M-22-09 (Jan. 26, 2022); NIST SP 800-207 (Aug. 2020); CISA ZTMM v2.0 (Apr. 2023). Book 02, Chapter 01.");
  s.addNotes(
`[0:29–1:33]  Why. Federal Zero Trust policy moved the access decision. OMB memorandum M-22-09 requires agency staff to use enterprise-managed identities and phishing-resistant multifactor authentication. NIST Special Publication 800-207 removes implicit trust based on network location: every request is evaluated on its own. And CISA's Zero Trust Maturity Model puts identity first among its five pillars.

What that means in practice is that the identity provider enforces whatever it believes. Who is this person, and is that still true? Which groups and roles do they hold, and why? Is the device they're using managed and healthy? Conditional Access, Privileged Identity Management and device compliance all read those facts and act on them, on every sign-in.

So if the facts are wrong, every policy built on them is wrong, at machine speed. That's why moving from Active Directory to Entra ID isn't a directory upgrade. It decides whether every later control has true facts to act on.

Workbook: Book 02, Chapter 01 — Why Identity Matters.`);
}

// ------------------------------------------------------------------ 3 Why: forced, and what lift-and-shift does
{
  const s = D.content("Why identity matters", "AD isn't retiring — but every road now points to the cloud");
  tag(s, "Why");
  const dates = [
    ["June 2024", "All NTLM versions deprecated; NTLMv1 later removed in Windows 11 24H2 and Server 2025", HEX.slate, HEX.grey],
    ["July 1, 2026", "Entra blocks hard-match takeover of privileged or already-mapped cloud accounts", HEX.teal, HEX.tealTint],
    ["October 2026", "Security update restricts NTLMv1-derived single sign-on credentials by default", HEX.amber, HEX.amberTint],
    ["April 7, 2027", "Connect Sync must run 2.6.84.0+ with application-based authentication, or sync stops", HEX.red, HEX.redTint],
  ];
  dates.forEach((d, i) => {
    const x = 0.6 + i * 3.06;
    box(s, `Date ${i + 1}`, x, 1.55, 2.9, 2.3, d[3]);
    txt(s, `Date ${i + 1} text`, [
      { text: d[0], options: { bold: true, color: d[2], fontSize: 19, fontFace: "Cambria", breakLine: true } },
      { text: d[1], options: { fontSize: 14 } },
    ], { x: x + 0.2, y: 1.7, w: 2.5, h: 2.05, paraSpaceAfter: 4 });
  });
  txt(s, "Direction", [
    { text: "Microsoft's direction: ", options: { bold: true, color: HEX.navy } },
    { text: "Cloud Sync replaces Connect Sync; move off AD FS to cloud authentication; convert sources of authority to the cloud one object at a time." },
  ], { x: 0.6, y: 4.05, w: 12.15, h: 0.75, fontSize: 15.5 });
  callout(s, "Lift and shift", 5.0, 1.45, "FaPlugCircleXmark", HEX.red, "The trap — lift and shift: ",
    "synchronize the forest as it stands and twenty-five years of OUs, stale accounts and undocumented trusts arrive in the tenant — while the governance the hierarchy carried is left behind.");
  sources(s, "Sources: Microsoft Learn — deprecated Windows features; Entra Connect hardening and hard-match protections; Windows message center (Oct. 2026). Book 02, Chapters 01–03.");
  s.addNotes(
`[1:33–2:58]  Microsoft isn't retiring Active Directory. It still supports and develops Windows Server AD. But every road now points to the cloud, and the dates are real.

In June 2024 Microsoft deprecated all versions of NTLM, and NTLMv1 is removed from Windows 11 24H2 and Windows Server 2025. On July 1, 2026, Entra ID began blocking sync from taking over privileged or already-mapped cloud accounts. This month's security update restricts NTLMv1-derived single sign-on credentials by default on devices without Credential Guard. And by April 7, 2027, every Connect Sync server must run version 2.6.84.0 or later with application-based authentication, or synchronization stops.

Behind those dates is a direction: Cloud Sync replacing Connect Sync, cloud authentication instead of AD FS, and sources of authority converted to the cloud one object at a time.

The trap is the lift and shift. Synchronize the forest as it stands, and twenty-five years of organizational units, stale accounts and undocumented trusts arrive in the tenant. Meanwhile the governance that the hierarchy carried, who could manage what and where policy applied, is left behind, because Entra ID has no OU tree to carry it.

Workbook: Book 02, Chapters 01 and 02; Chapter 03 for the protocol timeline.`);
}

// ------------------------------------------------------------------ 4 What: two worlds
{
  const s = D.content("What changes", "Two directories, two different models");
  tag(s, "What");
  const rows = [
    ["Structure", "Forest, domains, nested OUs", "One flat tenant; attributes and administrative units"],
    ["Who you are", "Placement in the OU tree", "Attributes from an authoritative source (HR)"],
    ["Policy", "Group Policy linked to OUs", "Conditional Access and Intune, targeted by attributes"],
    ["Protocols", "Kerberos, NTLM, LDAP", "OpenID Connect, OAuth 2.0, SAML, SCIM"],
    ["Admin power", "Standing Domain Admins", "Least-privilege roles, activated just in time (PIM)"],
    ["Management", "ActiveDirectory module, ADSI", "Microsoft Graph and Graph PowerShell"],
  ];
  s.addTable([head(["", "Active Directory", "Microsoft Entra ID"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal, bold: true } }])],
    tableOpts([2.15, 4.6, 5.4], { y: 1.55, fontSize: 15, rowH: [0.45, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55] }));
  callout(s, "Key idea", 5.55, 0.95, "FaRightLeft", HEX.navy, "The key idea: ",
    "in AD, governance is implied by where an object sits. In Entra ID it must be stated as data and rules — or it doesn't exist.");
  sources(s, "Sources: Microsoft Learn — Entra ID, administrative units, Conditional Access, Microsoft Graph PowerShell. Book 02, Chapters 02–03.");
  s.addNotes(
`[2:58–4:08]  What changes. These are two different models, not two versions of one product.

Active Directory is a hierarchy: a forest, domains, and nested organizational units. Entra ID is one flat tenant. Structure comes from attributes and administrative units instead.

In AD, much of what you are is where you sit in the OU tree. In Entra ID it should be attributes from an authoritative source, which for the workforce means HR.

Policy in AD is Group Policy linked to OUs. In the cloud it's Conditional Access and Intune, targeted by those attributes. The protocols change too: Kerberos, NTLM and LDAP give way to OpenID Connect, OAuth, SAML and SCIM. Standing Domain Admin membership gives way to least-privilege roles activated just in time through Privileged Identity Management. And management moves from the ActiveDirectory module to Microsoft Graph.

The key idea is the bottom line. In Active Directory, governance is implied by where an object sits. In Entra ID it has to be stated explicitly, as data and rules, or it simply doesn't exist.

Workbook: Book 02, Chapter 02 — The Structural Problem; Chapter 03 — Active Directory and Entra ID, Side by Side.`);
}

// ------------------------------------------------------------------ 5 What: hidden surface
{
  const s = D.content("What changes", "The migration surface is much larger than users and groups");
  tag(s, "What");
  txt(s, "Lead", "Most plans count users and groups. Active Directory also holds the estate together:",
    { x: 0.6, y: 1.5, w: 12.1, h: 0.4, fontSize: 16, color: HEX.ink });
  const deps = [
    ["FaGlobe", "DNS, DHCP and IPAM", "AD-integrated zones and the records apps depend on"],
    ["FaKey", "Certificates (AD CS)", "Smart card, Wi-Fi, VPN and server certificates"],
    ["FaRoute", "RADIUS / NPS", "802.1X Wi-Fi and VPN sign-in through AD"],
    ["FaPlugCircleXmark", "LDAP-bound apps", "Applications that bind and search the directory"],
    ["FaArrowsRotate", "The sync engine", "Connect Sync or Cloud Sync, a tier 0 asset"],
    ["FaLaptop", "Devices", "Domain join and GPO, moving to Intune and Arc"],
    ["FaUserClock", "Time", "Kerberos needs synchronized clocks across the hierarchy"],
    ["FaDatabase", "File services and DFS", "Share permissions bound to AD groups"],
  ];
  deps.forEach((d, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.06, y = 2.0 + row * 1.55;
    box(s, `Dep ${i + 1}`, x, y, 2.9, 1.4, row === 0 ? HEX.navyTint : HEX.tealTint);
    icon(s, d[0], x + 0.15, y + 0.17, 0.55, row === 0 ? HEX.navy : HEX.teal);
    txt(s, `Dep ${i + 1} text`, [
      { text: d[1], options: { bold: true, color: row === 0 ? HEX.navy : HEX.teal, fontSize: 15, breakLine: true } },
      { text: d[2], options: { fontSize: 12.5 } },
    ], { x: x + 0.82, y: y + 0.12, w: 1.98, h: 1.2 });
  });
  callout(s, "Adapters", 5.25, 1.25, "FaCubes", HEX.amber, "The program's answer: ",
    "one adapter per dependency, each with an owner, a target, a cutover test and a validation check — retired in priority order, not all at once.");
  sources(s, "Sources: Microsoft Learn — Cloud Sync, NPS extension for Entra MFA, Windows Time service, Cloud PKI. Book 02, Chapter 04.");
  s.addNotes(
`[4:08–5:14]  The second thing that changes is the size of the job. Most migration plans count users and groups. But Active Directory has also been holding the estate together.

DNS, DHCP and IP address management, with the zones applications depend on. Certificate Services, behind smart cards, Wi-Fi, VPN and servers. RADIUS through the Network Policy Server for Wi-Fi and VPN sign-in. Applications that bind to the directory over LDAP. The sync engine itself, which is a tier zero asset. Devices that are domain-joined and governed by Group Policy. Time, because Kerberos depends on synchronized clocks. And file services, whose permissions are bound to AD groups.

None of those move just because users sync to the cloud. Some, like the NPS extension for Entra multifactor authentication, are useful interim steps that still depend on AD.

The program's answer is an adapter for each dependency: an owner, a target, a cutover test and a validation check, retired in priority order rather than all at once.

Workbook: Book 02, Chapter 04 — The Hidden Migration Surface.`);
}

// ------------------------------------------------------------------ 6 What: delegation
{
  const s = D.content("What changes", "Delegation has to be rebuilt without OUs");
  tag(s, "What");
  const tiers = [
    ["Tier 0", "Tenant-wide control", "Global Administrator and similar roles; break-glass accounts; activated just in time", HEX.red, HEX.redTint],
    ["Tier 1", "Service administration", "Exchange, Intune, security; scoped where the role allows it", HEX.amber, HEX.amberTint],
    ["Tier 2", "Department administration", "Help desk and local admins, scoped to administrative units", HEX.teal, HEX.tealTint],
  ];
  tiers.forEach((t, i) => {
    const y = 1.55 + i * 1.18;
    box(s, `Tier ${i}`, 0.6, y, 6.4, 1.05, t[4]);
    txt(s, `Tier ${i} text`, [
      { text: `${t[0]}  ·  ${t[1]}`, options: { bold: true, color: t[3], fontSize: 16.5, breakLine: true } },
      { text: t[2], options: { fontSize: 14 } },
    ], { x: 0.85, y: y + 0.1, w: 6.0, h: 0.9 });
  });
  box(s, "Facts box", 7.25, 1.55, 5.5, 3.41, "FFFFFF", HEX.navy);
  txt(s, "Facts head", "WHAT THE PLATFORM ACTUALLY ALLOWS", { x: 7.5, y: 1.7, w: 5.0, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  txt(s, "Facts", bullets([
    "Administrative units can't be nested",
    "Groups that hold roles can't have dynamic membership",
    "Reader roles such as Global Reader are tenant-wide",
    "Restricted management is chosen when an AU is created, and it takes objects out of Entra ID Governance",
  ], 14.5), { x: 7.5, y: 2.1, w: 5.05, h: 2.8, paraSpaceAfter: 7 });
  callout(s, "Decision", 5.25, 1.25, "FaScaleBalanced", HEX.navy, "Program decision: ",
    "administrative units are unrestricted by default; restricted management is a per-unit choice for sensitive accounts, recorded in the registry before the unit is created.");
  sources(s, "Sources: Microsoft Learn — administrative units, restricted management AUs, role-assignable groups. Book 02, Chapter 05.");
  s.addNotes(
`[5:14–6:26]  The third change is delegation. In Active Directory, who can manage what was largely expressed by OUs. Entra ID has no OUs, so delegation has to be rebuilt on purpose.

The program uses three tiers. Tier zero is tenant-wide control: Global Administrator and similar roles, plus break-glass accounts, all activated just in time. Tier one is service administration, such as Exchange, Intune and security. Tier two is departmental administration, like the help desk, scoped to administrative units.

The platform sets real limits, and the old design documents got several wrong. Administrative units can't be nested. Groups that hold roles can't have dynamic membership. Reader roles like Global Reader apply to the whole tenant. And restricted management is chosen when a unit is created; it can't be added later. It also takes those users and groups out of Entra ID Governance: no access reviews or lifecycle workflows for them.

So the program's decision is that administrative units are unrestricted by default. Restricted management is a per-unit choice for sensitive accounts, recorded in the registry before the unit exists.

Workbook: Book 02, Chapter 05 — Delegation Without OUs.`);
}

// ------------------------------------------------------------------ 6b What: authentication
{
  const s = D.content("What changes", "Sign-in moves to phishing-resistant credentials");
  tag(s, "What");
  const rows = [
    ["1", "Privileged accounts", "FIDO2 security keys (passkeys); PIV or CAC where the admin holds a card"],
    ["2", "PIV and CAC holders", "Entra certificate-based authentication — the credential is already issued"],
    ["3", "Managed Windows devices", "Windows Hello for Business"],
    ["4", "Everyone else, including mobile", "Passkeys in Microsoft Authenticator"],
  ];
  s.addTable([head(["Wave", "Who", "Method"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy, align: "center" } }, { text: r[1], options: { bold: true } }, { text: r[2] }])],
    tableOpts([0.85, 2.6, 3.55], { y: 1.55, fontSize: 14, rowH: [0.45, 0.72, 0.72, 0.6, 0.6] }));
  box(s, "Off box", 7.85, 1.55, 4.9, 3.1, HEX.redTint);
  icon(s, "FaLock", 8.1, 1.75, 0.7, HEX.red);
  txt(s, "Off head", [
    { text: "WHAT GOES AWAY", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Methods that phishing defeats", options: { bold: true, color: HEX.red, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.95, y: 1.72, w: 3.7, h: 0.8, valign: "middle" });
  txt(s, "Off list", bullets([
    "SMS and voice codes for staff (M-22-09)",
    "Legacy protocols that send a password with each request — found, fixed, then blocked",
    "Standing reliance on push approval alone",
  ], 14.5), { x: 8.1, y: 2.7, w: 4.5, h: 1.9, paraSpaceAfter: 6 });
  callout(s, "PHS", 5.0, 1.3, "FaKey", HEX.teal, "What stays on: ",
    "password hash sync, whatever the sign-in method — it enables leaked-credential detection and is the manual fallback if pass-through agents or AD FS fail.");
  sources(s, "Sources: OMB M-22-09; Microsoft Learn — authentication strengths, passkeys, certificate-based authentication, legacy authentication. Book 02, Chapter 10.");
  s.addNotes(
`[6:26–7:56]  One more thing changes, and users will feel it: how they sign in.

OMB M-22-09 requires phishing-resistant multifactor authentication for agency staff, and it names PIV as the simplest route. That reorders the usual roadmap. Earlier plans treated smart-card sign-in as the last phase, for high-security users only. But a federal workforce already carries PIV or CAC cards, so Entra certificate-based authentication is the fastest path: the credential is already issued, and it works directly against Entra ID without a federation server.

The book runs four waves. Privileged accounts first, on FIDO2 security keys, or their PIV card. Then everyone who holds a PIV or CAC card, through certificate-based authentication. Then managed Windows devices, with Windows Hello for Business. And finally everyone else, including mobile users, with passkeys in Microsoft Authenticator. All four meet Entra's built-in phishing-resistant authentication strength.

Some things go away: SMS and voice codes for staff, which the memo requires agencies to stop using for routine access, and legacy protocols that send a password with every request. Those are found in the sign-in logs, fixed, then blocked, and watched for thirty days.

One thing stays on: password hash sync. It enables leaked-credential detection, and it's the manual fallback if pass-through agents or AD FS fail.

Workbook: Book 02, Chapter 10 — Migrating and Governing.`);
}

// ------------------------------------------------------------------ 7 Who
{
  const s = D.content("Who owns it", "Who decides, who does the work");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [
      ["CIO and executive sponsor", "Scope, funding, sequence"],
      ["CISO", "Control requirements for the target"],
      ["Authorizing official", "Accepts any risk carried instead of removed"]]],
    ["FaUsersGear", "Build and run", HEX.teal, HEX.tealTint, [
      ["Identity engineering", "Sync, authentication, Conditional Access, PIM, AUs"],
      ["AD administrators", "Clean the source; retire it at the end"],
      ["ISSO", "Evidence, findings, closure"]]],
    ["FaPeopleArrows", "Supply and accept", HEX.amber, HEX.amberTint, [
      ["HR", "The facts the directory can't verify"],
      ["Application owners", "Test results and cutover windows"],
      ["Help desk and users", "Recovery, registration, wave readiness"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [
      { text: r[0], options: { bold: true, color: c[2], breakLine: true } },
      { text: r[1], options: { breakLine: k < c[4].length - 1 } },
    ]), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  callout(s, "Gap owner", 5.3, 1.2, "FaSitemap", HEX.navy, "The missing owner: ",
    "Microsoft's tools each own a slice. Nobody owns the gaps between them — the undocumented trust, the drift no portal shows — unless the program names an owner.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 roles; OMB M-19-17 ICAM governance. Book 02, Chapter 06.");
  s.addNotes(
`[7:56–9:10]  Who. A directory migration fails more often on ownership than on technology, so the book separates who decides from who does the work.

Deciding: the CIO and executive sponsor set scope, funding and sequence. The CISO sets the control requirements the target has to meet. And the authorizing official accepts any risk the program proposes to carry instead of remove, such as a service account that can't be converted yet.

Building and running: identity engineering designs and builds the target: sync, authentication, Conditional Access, PIM and administrative units. AD administrators clean the source and, at the end, retire it. The ISSO assembles the evidence and tracks findings to closure.

Supplying and accepting: HR supplies the facts the directory can't verify on its own, which is the subject of the HR-driven identity book. Application owners accept test results and cutover windows. And the help desk and users carry recovery, registration and wave readiness.

One owner is usually missing. Microsoft's native tools each own a slice of the picture. Nobody owns the gaps between them unless the program names someone.

Workbook: Book 02, Chapter 06 — Who Owns the Migration.`);
}

// ------------------------------------------------------------------ 8 How
{
  const s = D.content("How to do it", "How: discover, assess, build, migrate, prove");
  tag(s, "How");
  const steps = [
    ["1", "Discover", "Read-only first; ask for narrow, time-bound access", "Ch 07"],
    ["2", "Assess", "Full forest inventory, with secrets never requested", "Ch 08"],
    ["3", "Build", "Cloud Sync, password hash sync, PIM, Conditional Access", "Ch 09"],
    ["4", "Migrate", "Waves; phishing-resistant MFA; legacy auth off", "Ch 10"],
    ["5", "Prove", "Drift checks and an evidence bundle for the AO", "Ch 10–11"],
  ];
  steps.forEach((st, i) => {
    const x = 0.6 + i * 2.46;
    box(s, `Step ${st[0]}`, x, 1.6, 2.3, 2.85, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Step ${st[0]} num`, st[0], { x: x + 0.2, y: 1.72, w: 0.6, h: 0.6, fontSize: 30, bold: true, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy });
    txt(s, `Step ${st[0]} text`, [
      { text: st[1], options: { bold: true, fontSize: 18, fontFace: "Cambria", color: i % 2 ? HEX.teal : HEX.navy, breakLine: true } },
      { text: st[2], options: { fontSize: 13.5, breakLine: true } },
      { text: st[3], options: { fontSize: 12, color: HEX.slate, italic: true } },
    ], { x: x + 0.2, y: 2.35, w: 1.95, h: 2.0, paraSpaceAfter: 4 });
  });
  callout(s, "Rules", 4.75, 1.75, "FaClipboardCheck", HEX.amber, "Rules that hold every wave: ",
    "never enforce an untested policy on all users; keep two cloud-only break-glass accounts on phishing-resistant credentials; convert service accounts to managed or workload identities; and treat every closure as unproven until it carries its evidence.");
  sources(s, "Sources: Microsoft Learn — Cloud Sync, PHS, PIM, emergency access accounts, CBA, workload identity federation. Book 02, Chapters 07–11.");
  s.addNotes(
`[9:10–10:27]  How. The book's How chapters follow five steps.

One, discover. Start with read-only access, which every employee already has, and learn the topology, OU tree, groups and Group Policy links. Then ask for narrow, time-bound access for only what you couldn't see. Two, assess: the full forest inventory, including certificate templates, trusts and delegation, without ever requesting the rights that expose secrets.

Three, build the target. The book recommends Cloud Sync unless a Connect-only requirement applies, password hash sync everywhere, Privileged Identity Management for every admin role, and a tested Conditional Access baseline. Four, migrate in waves: phishing-resistant authentication, including PIV and CAC through certificate-based authentication, and legacy authentication turned off. Five, prove it: drift checks against the baseline and an evidence bundle the authorizing official can rely on.

A few rules hold for every wave. Never enforce an untested policy on all users. Keep two cloud-only break-glass accounts on phishing-resistant credentials. Convert service accounts to managed or workload identities. And treat every closure as unproven until it carries its evidence.

Workbook: Book 02, Chapters 07 through 11.`);
}

// ------------------------------------------------------------------ 8b How: reference deployment
{
  const s = D.content("How to do it", "What a reference deployment produces");
  tag(s, "How");
  const ph = [
    ["Discover", "Read-only survey of both forests; service-account and SPN inventory"],
    ["Normalize", "An organizational registry; a finding for every unattributed principal"],
    ["Map", "One adapter per surface: sync, PKI, RADIUS, SQL Server"],
    ["Migrate", "Every change recorded with who asked, on what authority, and a state hash"],
    ["Validate", "Before-and-after inventories compared; drift closed with evidence"],
  ];
  ph.forEach((p, i) => {
    const y = 1.55 + i * 0.7;
    box(s, `Phase ${i + 1}`, 0.6, y, 7.3, 0.6, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Phase ${i + 1} text`, [
      { text: `${i + 1}  ${p[0]}   `, options: { bold: true, color: i % 2 ? HEX.teal : HEX.navy, fontSize: 15.5 } },
      { text: p[1], options: { fontSize: 13.5 } },
    ], { x: 0.8, y, w: 7.0, h: 0.6, valign: "middle" });
  });
  box(s, "Bundle box", 8.15, 1.55, 4.6, 3.4, "FFFFFF", HEX.amber);
  icon(s, "FaFileShield", 8.4, 1.75, 0.75, HEX.amber);
  txt(s, "Bundle head", [
    { text: "THE EVIDENCE BUNDLE", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Read by the AO and the assessor", options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 9.3, y: 1.72, w: 3.35, h: 0.85, valign: "middle" });
  txt(s, "Bundle list", bullets([
    "Readiness and closure records",
    "Inventories, before and after",
    "Drift findings and their resolution",
    "What the agency keeps when the integrator leaves",
  ], 14.5), { x: 8.4, y: 2.75, w: 4.2, h: 2.1, paraSpaceAfter: 6 });
  callout(s, "Framing", 5.25, 1.25, "FaBuilding", HEX.slate, "A framing pattern, not a real engagement: ",
    "the archetype is a two-forest civilian estate with a SQL Server fleet — illustrative figures, real mechanics.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (AO and assessor roles); Microsoft Learn — Cloud Sync limits, Entra authentication for SQL Server. Book 02, Chapter 11.");
  s.addNotes(
`[10:27–11:49]  Chapter 11 puts the steps together in a reference deployment. It's a framing pattern, not a real engagement: a civilian agency with two forests, a trust between them, and a fleet of SQL Server instances. The figures are illustrative; the mechanics are real.

It runs in five phases. Discover: a read-only survey of both forests, including the service accounts and every service principal name the SQL Server work will depend on. Normalize: an organizational registry built from that survey and checked against the agency's own chart, with a finding raised for every account the registry can't attribute to a real owner. Map: one adapter per surface, and four carry most of the risk here: synchronization, certificates, RADIUS and SQL Server. Migrate: every change recorded with who asked for it, on what authority, and a hash of the resulting state. And Validate: the before and after inventories compared, and every drift finding closed with evidence.

What comes out is an evidence bundle. It goes to the authorizing official and the security control assessor, who authorize the agency's own system under the Risk Management Framework. And it belongs to the agency. When the integrator leaves, the registry, the schemas, the findings and the evidence stay behind for the next authorization cycle.

Workbook: Book 02, Chapter 11 — Reference Deployment.`);
}

// ------------------------------------------------------------------ 9 Close
{
  const s = D.content("How to do it", "What we're asking for");
  tag(s, "How");
  const asks = [
    ["FaUserCheck", "Name the owners", "Sponsor, CISO, AO, identity engineering lead — and an owner for the gaps", HEX.navy, HEX.navyTint],
    ["FaListCheck", "Start read-only discovery", "No elevated access needed to begin; delegation follows the evidence", HEX.teal, HEX.tealTint],
    ["FaCalendarCheck", "Put the dates on the plan", "Connect Sync by April 7, 2027; NTLM and legacy auth off by wave", HEX.amber, HEX.amberTint],
    ["FaFileShield", "Agree what 'done' means", "Every control backed by evidence an assessor can read", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0] === "FaCalendarCheck" ? "FaUserClock" : a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [
      { text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: a[2], options: { fontSize: 14.5 } },
    ], { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Close", 5.15, 1.4, "FaBook", HEX.navy, "Read next: ",
    "Book 02 (the full argument and runbooks, every claim footnoted), then Book 03, HR-Driven Identity — where the facts in the directory come from.");
  s.addNotes(
`[11:49–12:52]  So, four asks.

Name the owners: the sponsor, the CISO, the authorizing official, the identity engineering lead, and someone who owns the gaps between the tools.

Start read-only discovery now. It needs no elevated access to begin, and the request for more access then follows the evidence rather than preceding it.

Put the dates on the plan. Connect Sync has to be upgraded by April 7, 2027. NTLM and legacy authentication should come off wave by wave, not in one weekend.

And agree what done means: every control backed by evidence an assessor can read, not a status in a ticket.

Identity matters because it is now where every access decision is made. Getting it right once, while the platform is being rebuilt anyway, is far cheaper than rebuilding the same gaps twice.

Book 02 has the full argument and the runbooks, with every external claim footnoted. Book 03, HR-Driven Identity, picks up where the facts in the directory should come from. Thank you.

Workbook: Book 02, Chapter 11 — Reference Deployment, and Book 03.`);
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Office of Management and Budget, M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022.",
    "NIST SP 800-207, Zero Trust Architecture, August 2020.  ·  NIST SP 800-37 Rev. 2, Risk Management Framework, December 2018.",
    "CISA, Zero Trust Maturity Model, Version 2.0, April 2023.  ·  OMB M-19-17, Enabling Mission Delivery through Improved Identity, Credential, and Access Management, May 21, 2019.",
    "Microsoft Learn: Deprecated features for Windows client (NTLM); Features removed in Windows Server 2025 (NTLMv1).",
    "Microsoft Learn: Windows message center, NTLMv1 hardening with the October 2026 security update (KB5066470).",
    "Microsoft Learn: Hardening update to Microsoft Entra Connect Sync (2.6.84.0 and application-based authentication by April 7, 2027).",
    "Microsoft Learn: Configure Microsoft Entra Connect for an existing tenant — hard match security protections (July 1, 2026).",
    "Microsoft Learn: Administrative units; restricted management administrative units; role-assignable groups; Privileged Identity Management.",
    "Microsoft Learn: Microsoft Entra Cloud Sync; password hash synchronization; emergency access accounts; certificate-based authentication.",
    "Full footnotes with links and access dates: Book 02, every chapter (whalermike.github.io/modernization-workbook/docs/books/b02-identity/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
