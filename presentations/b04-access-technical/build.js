// Book 04 — Access & Privilege: the 50-minute technical deep dive, in five modules.
// Build:  node presentations/b04-access-technical/build.js presentations/b04-access-technical/B04_Access_Technical.pptx
// Every fact comes from a footnoted chapter of docs/books/b04-access/, named in the notes.
// Each module opens with a divider slide, so the narrated edition can be watched in parts.
const D = require("../_build/lib.js")({ book: "Book 04", title: "Access & Privilege — technical deep dive" });
const { HEX, PART, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B04_Access_Technical.pptx";

// ------------------------------------------------------------------ helpers
const WPM = 142; // narration pace the timing cues assume
let clock = 0, spokenWords = 0;
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
// Speaker notes with a timing cue computed from the spoken word count, then the workbook reference.
const notes = (s, body, ref) => {
  const words = body.trim().split(/\s+/).length;
  const start = clock;
  clock += (words / WPM) * 60;
  spokenWords += words;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: Book 04, ${ref}`);
};
const c = (t, o) => ({ text: t, options: o || {} });
const k = (t, color) => c(t, { bold: true, color: color || HEX.navy }); // bold key cell
const yes = (t) => c(t, { bold: true, color: t === "Yes" ? HEX.teal : t === "No" ? HEX.red : HEX.slate, align: "center" });
const table = (s, header, rows, colW, o) => s.addTable([head(header), ...rows], tableOpts(colW, o));
// A tinted panel with a bold heading and a bullet list.
const panel = (s, name, x, y, w, h, fill, color, heading, items, size) => {
  box(s, name, x, y, w, h, fill);
  txt(s, `${name} head`, heading, { x: x + 0.22, y: y + 0.12, w: w - 0.44, h: 0.45, bold: true, color, fontSize: 16, fontFace: "Cambria", valign: "middle" });
  txt(s, `${name} list`, bullets(items, size || 12.5), { x: x + 0.22, y: y + 0.62, w: w - 0.44, h: h - 0.72, paraSpaceAfter: 5 });
};
// A row of numbered step boxes.
const steps = (s, name, items, y, h, size) => {
  const gap = 0.15, w = (12.15 - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = 0.6 + i * (w + gap), col = i % 2 ? HEX.teal : HEX.navy;
    box(s, `${name} ${i + 1}`, x, y, w, h, i % 2 ? HEX.tealTint : HEX.navyTint);
    txt(s, `${name} ${i + 1} text`, [
      { text: it[0], options: { bold: true, fontSize: size ? size + 2 : 15, fontFace: "Cambria", color: col, breakLine: true } },
      { text: it[1], options: { fontSize: size || 12.5 } },
    ], { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 3 });
  });
};
// Module divider: the module number, what it covers (with each slide's part), and the chapters.
const divider = (sec, n, title, minutes, iconName, items, chapters, idea) => {
  const s = D.content(sec, `Module ${n} — ${title}`);
  box(s, "Module box", 0.6, 1.55, 3.4, 4.05, HEX.navyTint);
  icon(s, iconName, 1.85, 1.8, 0.9, HEX.navy);
  txt(s, "Module number", [
    { text: "MODULE", options: { bold: true, fontSize: 14, color: HEX.slate, charSpacing: 2, breakLine: true } },
    { text: `${n}`, options: { bold: true, fontSize: 88, fontFace: "Cambria", color: HEX.navy, breakLine: true } },
    { text: `About ${minutes} minutes`, options: { fontSize: 14, color: HEX.slate } },
  ], { x: 0.6, y: 2.85, w: 3.4, h: 2.6, align: "center" });
  txt(s, "Module heading", "In this module", { x: 4.4, y: 1.55, w: 8.3, h: 0.45, bold: true, fontSize: 16, color: HEX.slate });
  txt(s, "Module contents", items.map((it, i) => ({ text: "", options: {} })).flatMap((_, i) => [
    { text: `${items[i][0].toUpperCase()}   `, options: { bold: true, color: PART[items[i][0]], fontSize: 13 } },
    { text: items[i][1], options: { fontSize: 19, fontFace: "Cambria", color: HEX.ink, breakLine: i < items.length - 1 } },
  ]), { x: 4.4, y: 2.05, w: 8.35, h: 2.55, paraSpaceAfter: 9 });
  txt(s, "Module idea", idea, { x: 4.4, y: 4.7, w: 8.35, h: 0.9, fontSize: 17, italic: true, fontFace: "Cambria", color: HEX.teal });
  sources(s, `Sources: ${chapters}.`);
  return s;
};

// ------------------------------------------------------------------ 1  Title
{
  const s = D.titleSlide("Orientation", "Access & Privilege: The Technical Deep Dive", "Book 04 — Access & Privilege");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "50 minutes in five modules, for the people who build and run it", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  notes(s, `This is the technical deep dive for Book 04 of the Federal Modernization Workbook, Access and Privilege.

The fifteen-minute briefing made the argument. This session is for the people who build and run it: identity engineers, architects, and the security and assessment staff who have to prove it works.

It runs about fifty minutes in five modules, and each module stands on its own, so you can watch it in parts. After a two-slide orientation, we'll cover the Conditional Access policy library; its rollout, exclusions and break-glass accounts; PIM self-request with approval; access governance; and finally access as code, and the evidence it produces.

Every fact comes from a footnoted chapter of the book, and each slide names its chapter. Code and JSON stay in the book; the slides carry the design.`, "index.");
}

// ------------------------------------------------------------------ 2  Orientation: Why
{
  const s = D.content("Orientation", "Every access decision is a policy decision");
  tag(s, "Why");
  const rows = [
    ["FaLandmark", "OMB M-22-09", HEX.navy, "Evaluate every request, including active sessions; network location confers no trust."],
    ["FaBook", "NIST SP 800-207", HEX.teal, "Tenets 2–4: location implies no trust; per-session least privilege; dynamic policy."],
    ["FaShieldHalved", "CISA Zero Trust Maturity Model", HEX.amber, "Identity pillar: the right resources at the right time, with context-based authorization."],
  ];
  rows.forEach((r, i) => {
    const y = 1.55 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.08, 0.62, r[2]);
    txt(s, `Mandate ${i + 1}`, [{ text: r[1], options: { bold: true, color: r[2], fontSize: 16, breakLine: true } }, { text: r[3], options: { fontSize: 13.5 } }],
      { x: 1.4, y, w: 4.7, h: 1.05 });
  });
  table(s, ["SP 800-207 component", "In Microsoft Entra ID"], [
    [k("Policy engine"), c("Conditional Access: reads the signals and decides block, grant, or grant with conditions")],
    [k("Policy administrator"), c("Entra ID token issuance: issues the token the decision allows, or refuses")],
    [k("Enforcement points"), c("Applications that accept only Entra-issued tokens; gateways in front of older applications")],
    [k("Session re-evaluation"), c("Continuous Access Evaluation: critical events and location changes, in near real time")],
  ], [2.2, 4.1], { x: 6.45, y: 1.55, fontSize: 12.5, rowH: [0.4, 0.6, 0.6, 0.6, 0.6] });
  txt(s, "Mapping note", "The program's interpretation of the architecture — not a mapping Microsoft or NIST publishes.",
    { x: 6.45, y: 4.5, w: 6.3, h: 0.5, fontSize: 12, italic: true, color: HEX.slate });
  callout(s, "One point", 5.25, 1.2, "FaScaleBalanced", HEX.navy, "One decision point, many enforcement points: ",
    "one policy set the agency can read, test, change and prove — instead of a hundred applications each deciding for themselves.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207 §2.1, §3; CISA ZTMM v2.0; Microsoft Learn — Conditional Access overview, Entra roles best practices. Book 04, Ch. 01.");
  notes(s, `Start with why, because every design choice in the next forty-five minutes follows from it.

OMB M-22-09 says federal applications can't rely on the network perimeter, and that every request for access should be evaluated, with the ability to evaluate an active session continuously. When undue risk appears, the answer can be re-authentication, limited access or denial. It also asks agencies to move past static roles toward more granular, dynamic permissions, and to use at least one device-level signal alongside identity.

NIST SP 800-207 gives the architecture. Three of its tenets carry this book: network location alone doesn't imply trust; access is granted per session, with least privilege; and access is determined by dynamic policy. It also separates deciding from enforcing. A policy decision point, made of a policy engine and a policy administrator, decides; policy enforcement points carry the decision out.

The table is how the program maps that onto Entra ID. Conditional Access is the policy engine. Entra ID's token issuance plays the policy administrator: it issues the token the decision allows, or it refuses. The applications that accept only Entra-issued tokens, and the gateways in front of older applications, are the enforcement points. And Continuous Access Evaluation answers M-22-09's active-session requirement, re-evaluating on critical events, such as a disabled account, a password reset or token revocation, and when location changes.

Be careful how you state that mapping in a security plan. It's the program's interpretation, not a mapping Microsoft or NIST publishes. But it explains why the rest of this session treats a Conditional Access policy as the unit of access control: one policy set the agency can read, test, change and prove.`, "Chapter 01 — Access Is a Policy Decision.");
}

// ------------------------------------------------------------------ 3  Orientation: What
{
  const s = D.content("Orientation", "How Conditional Access computes the decision");
  tag(s, "What");
  table(s, ["Rule", "Consequence for design"], [
    [k("Assignments combine with AND"), c("A policy applies only when every one of its assignments matches")],
    [k("Every applicable policy must be met"), c("No priority order: MFA in one policy and a compliant device in another means both")],
    [k("Block wins"), c("Any applicable block stops enforcement, whatever other policies would grant")],
    [k("Controls combine as configured"), c("Require all of the selected controls, or require one of them")],
    [k("Exclusions are absolute"), c("A user who is both included and excluded is excluded")],
    [k("No match issues a token", HEX.red), c("A sign-in that no policy's conditions match gets a token with no controls")],
  ], [2.75, 4.55], { y: 1.55, fontSize: 12.5, rowH: [0.4, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52] });
  panel(s, "Pairs", 8.15, 1.55, 4.6, 3.55, HEX.tealTint, HEX.teal, "Policies come in pairs", [
    "Grant: Finance group to Payroll — phishing-resistant MFA and a compliant device",
    "Block: all users except Finance, to Payroll",
    "Without the block, everyone else gets a Payroll token with no controls",
    "Assignment required is the cleaner first gate, but Global Administrators bypass it",
  ], 13);
  callout(s, "Timing", 5.3, 1.15, "FaArrowsRotate", HEX.navy, "Timing: ",
    "policies run after first-factor authentication, at each token request — about hourly for modern clients. Continuous Access Evaluation enforces critical events, typically within 15 minutes.");
  sources(s, "Sources: Microsoft Learn — Build a Conditional Access policy, plan a deployment, network signals, continuous access evaluation. Book 04, Ch. 01 and 03.");
  notes(s, `Now the mechanism, because Conditional Access doesn't work like Group Policy, and administrators who bring Group Policy habits to it make predictable mistakes.

There's no precedence. Within a policy, assignments combine with AND: the policy applies only when everything it's assigned to matches. Across policies, every applicable policy must be satisfied. If one requires MFA and another a compliant device, the user does both, and the policy numbers are labels, not an order. Block wins: if any applicable policy blocks, enforcement stops. Inside a policy, controls combine as configured, require all or require one. And exclusions are absolute.

The rule that causes the most damage is the default. If no policy's conditions trigger a control, a token is issued. A policy that says Finance users reaching Payroll must use phishing-resistant MFA says nothing about anyone else, so a non-Finance user gets a Payroll token with no controls at all. Restricting a resource takes two policies, written and reviewed together: a grant for the population, and a block for everyone else. Enterprise application assignment, with Assignment required set, is usually the cleaner first gate, but Global Administrators bypass it, which is why sensitive applications keep the block as well.

Two timing facts keep our claims honest. Conditional Access runs after first-factor authentication, so it isn't a front-line defense against password spray. And it evaluates token requests: at sign-in, and when a refresh token gets a new access token, about once an hour for modern clients. Continuous Access Evaluation closes part of that gap, and supporting services enforce critical events typically within fifteen minutes.

With that model in place, on to module one.`, "Chapter 01 — Access Is a Policy Decision; Chapter 03 — The Conditional Access Model.");
}

// ================================================================== Module 1
{
  const s = divider("Module 1 — Policy library", 1, "The Conditional Access policy library", 9, "FaListCheck", [
    ["What", "One library, numbered once"],
    ["Who", "Personas decide who each policy reaches"],
    ["How", "Five enforcement waves, CA001 to CA090"],
    ["Why", "Built to answer CISA's BOD 25-01"],
  ], "Book 04, Chapters 03 and 07; Appendix A",
  "Finished means every sign-in meets a policy someone owns, and no policy depends on another running first.");
  notes(s, `Module one: the Conditional Access policy library.

The chapter sets a clear standard for when a library is finished: every sign-in in the tenant meets a policy that someone owns, and nothing in it depends on another policy running first.

In the next four slides we'll cover how the library is numbered and what it assumes already exists; the personas that every policy targets; the five enforcement waves, policy by policy; and how the library answers the configurations that CISA's BOD 25-01 requires. The deployable JSON template for every policy is in Appendix A.`, "Chapter 07 — The Conditional Access Policy Library.");
}

// ------------------------------------------------------------------ 5  Library structure
{
  const s = D.content("Module 1 — Policy library", "One library, numbered once");
  tag(s, "What");
  table(s, ["Numbers", "What they are"], [
    [k("CA001–CA017"), c("Book 02's migration baseline, identifiers kept; CA002 retired, so 16 policies")],
    [k("CA018–CA038"), c("Book 04's additions: risk, privileged workstations, segmented apps, workload identities")],
    [k("CA090"), c("The permanent report-only coverage probe; 090–099 are reserved for instruments")],
    [k("Name"), c("CA{NNN}-{Population}-{Resource or condition}-{Control}")],
  ], [1.55, 3.85], { y: 1.55, fontSize: 12, rowH: [0.4, 0.55, 0.55, 0.55, 0.5] });
  txt(s, "Name note", "Example: CA013-AllUsers-HighUserRisk-RequireRemediation. Numbers are labels, not order, and a retired number is never reused.",
    { x: 0.6, y: 4.25, w: 5.4, h: 0.75, fontSize: 12, italic: true, color: HEX.slate });
  table(s, ["Prerequisite", "Program object"], [
    [k("Emergency access"), c("CA-Exclude-EmergencyAccess: assigned, two accounts")],
    [k("Persona groups"), c("CA-Persona-Internals and -Admins (dynamic); -WebOnly and -SharedDevice (assigned)")],
    [k("Access groups"), c("CA-Access-ServerAdmins, -AzureOperators, -ProdOperators, -PowerPlatformMakers")],
    [k("Named locations"), c("NL-TrustedNetworks, NL-TrustedCountries, NL-WorkloadEgress")],
    [k("Custom strength"), c("FMP-Privileged-SeparateDevice: FIDO2 keys by AAGUID, or certificate-based auth")],
    [k("Device label"), c("Device extensionAttribute12 = PAW, Kiosk or SharedDevice")],
    [k("App attribute"), c("Custom security attribute FMPAccess.Environment on service principals")],
  ], [1.85, 4.65], { x: 6.25, y: 1.55, fontSize: 11.5, rowH: [0.38, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44] });
  callout(s, "Conventions", 5.3, 1.2, "FaListCheck", HEX.amber, "Every policy: ",
    "excludes the emergency access group; needs Entra ID P1 (P2 for risk, Workload ID Premium for service principals); starts in report-only; never uses the approved-client-app grant, read-only since June 30, 2026.");
  sources(s, "Sources: Microsoft Learn — Conditional Access licensing, workload identities, approved client app migration, authentication strengths. Book 04, Ch. 03 and 07.");
  notes(s, `The library is one policy set, numbered once. Policies CA001 to CA017 are the baseline that Book 02 builds during the migration, and they keep their identifiers here. CA002 stays retired, so that's sixteen policies. Book 04 adds CA018 to CA038, for risk, privileged workstations, segmented applications and workload identities, plus CA090, the permanent report-only probe. Numbers 001 to 089 are for the library and 090 to 099 for report-only instruments. Numbers are labels, not order, and a retired number is never reused. The earlier library used a different numbering scheme, and the chapter maps every one of its policies to where it went.

Every name follows one pattern: number, population, resource or condition, then control. You can read a policy on a call without opening it.

On the right are the prerequisites, and missing ones are the most common reason a report-only policy shows failures that aren't real. The emergency access group. Persona groups, the two big ones dynamic from extension attributes in Book 03's attribute map. Access groups for restricted populations. Three named locations. A custom authentication strength that accepts FIDO2 keys from an approved AAGUID list, or certificate-based authentication. It leaves out Windows Hello for Business on purpose: for privileged accounts, a credential held in the device gaining access doesn't count as a separate device. A device label in extension attribute twelve. And a custom security attribute that tags each application's environment.

Four conventions apply everywhere. The emergency access exclusion is implicit. Every policy needs Entra ID P1; risk policies need P2; workload identity policies need Workload ID Premium. Every policy is created in report-only. And none uses the approved client app grant, which became read-only on June 30, 2026.`, "Chapter 07 — The Conditional Access Policy Library; Chapter 03 — The Conditional Access Model.");
}

// ------------------------------------------------------------------ 6  Personas
{
  const s = D.content("Module 1 — Policy library", "Personas decide who each policy reaches");
  tag(s, "Who");
  table(s, ["Persona", "Population and group", "Risk", "Persona-specific policies"], [
    [k("Admins", HEX.red), c("CA-Persona-Admins: extensionAttribute7 = Privileged, or the PIM-eligible population"), c("High"), c("CA003, CA004, CA005, CA025; CA026 for server admins; excluded from CA027")],
    [k("Internals"), c("CA-Persona-Internals: dynamic, extensionAttribute11 (worker type) in EMP or CTR"), c("Standard"), c("CA006, CA007, CA008, CA017, CA029; CA023–CA024 web-only; CA028 shared devices; CA031 production operators; CA034 department apps")],
    [k("Externals", HEX.amber), c("B2B guests from partner tenants, by guest or external user type"), c("Elevated"), c("CA009, CA010")],
    [k("Guests", HEX.amber), c("Ad hoc guests from other tenants or identity providers"), c("High"), c("CA011, CA012, CA038")],
    [k("Workload identities", HEX.slate), c("Single-tenant service principals, assigned to policies directly"), c("Variable"), c("CA015 and CA037 only — no user-scoped policy reaches them")],
    [k("Break-glass", HEX.teal), c("CA-Exclude-EmergencyAccess: assigned, two members"), c("Excluded"), c("Excluded from every enforced policy; CA090, report-only, still records them")],
  ], [1.75, 4.2, 1.05, 5.15], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.5, 0.62, 0.45, 0.45, 0.5, 0.5] });
  txt(s, "Tenant-wide note", "Tenant-wide policies (CA001, CA013, CA014, CA018–CA022 and others) reach every persona; those scoped to Members leave out guest and external user types.",
    { x: 0.6, y: 5.04, w: 12.15, h: 0.45, fontSize: 12, italic: true, color: HEX.slate });
  callout(s, "Empty", 5.55, 0.95, "FaUserXmark", HEX.red, "An empty attribute is an exclusion nobody approved: ",
    "a user outside every persona group meets no persona policy, so CA018 requires MFA for all users and all resources.");
  sources(s, "Sources: Microsoft Learn — users, groups and workload identities in Conditional Access; Book 03 program attribute map. Book 04, Ch. 03 and 07.");
  notes(s, `Policies target populations, never people, and the populations are personas. They're defined in Book 02 and kept identical here.

Admins are users eligible for or holding privileged roles, from the account-type attribute or the PIM-eligible population. They carry the highest risk and get the strictest policies: phishing-resistant MFA, a compliant device, trusted networks, and privileged workstations. Internals are employees and contractors with standard access, built dynamically from the worker-type attribute. Externals are B2B guests from partner organizations; Guests are ad hoc external users from anywhere else. Workload identities are single-tenant service principals. They must be assigned to a policy directly, because a policy assigned to a group that contains a service principal isn't enforced for it, and only two policies reach them, CA015 and CA037. And break-glass: the two emergency accounts, excluded from every enforced policy, and still recorded by CA090, which is report-only.

The library adds named sub-populations inside the personas: web-only users without a managed device, shared-device frontline staff, server administrators, Azure operators and production operators. Each is a governed group.

Now the failure mode that drives one of the library's most important design choices. Persona groups are dynamic, built from attributes. A user whose attribute is empty falls outside every persona group, and therefore outside every policy that includes only that group. That's an exclusion nobody approved. So the library includes all users and excludes narrowly, and it adds CA018, deliberately redundant: MFA for all users and all resources, with no resource exclusions. It uses the plain require-MFA control rather than a strength, so guests who sign in with email one-time passcodes can still satisfy it.`, "Chapter 03 — The Conditional Access Model; Chapter 07 — The Conditional Access Policy Library.");
}

// ------------------------------------------------------------------ 7  Waves
{
  const s = D.content("Module 1 — Policy library", "Five enforcement waves, CA001 to CA090");
  tag(s, "How");
  table(s, ["Wave", "Policies", "What it closes", "Design detail"], [
    [k("1 · Foundation"), c("CA001, CA020, CA021, CA090"), c("Legacy authentication; an attacker registering their own MFA; device-code phishing"), c("CA090 is never enforced: it measures the end state and sees the break-glass accounts")],
    [k("2 · Administrators", HEX.red), c("CA003–CA005, CA025–CA027"), c("Separate-device phishing-resistant MFA every 4 hours; compliant devices; trusted networks; PAWs only"), c("CA003 targets the persona and the highly privileged roles; CA027 keeps the Azure management plane to operators")],
    [k("3 · Everyone", HEX.teal), c("CA006–CA011, CA016–CA018, CA038"), c("Workforce MFA and managed devices; country block; partner and guest controls; mobile app protection"), c("CA018 is the catch-all; CA038 makes CA011's limited guest access true")],
    [k("4 · Risk and workloads", HEX.amber), c("CA012–CA015, CA019, CA036, CA037"), c("High-risk users and sign-ins; elevated insider risk; workloads off their egress or at high risk"), c("CA019 blocks high sign-in risk, so CA014 acts on medium; CA012 then retires")],
    [k("5 · Segments, end state"), c("CA022–CA024, CA028–CA035"), c("Phishing-resistant MFA for all members; web-only, kiosk, production, staging, Power Platform, department apps"), c("CA030–CA032 select apps by custom security attribute; CA034 and CA035 are the grant-and-block template")],
  ], [1.75, 2.15, 4.0, 4.25], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.66, 0.66, 0.66, 0.66, 0.66] });
  callout(s, "PAW", 5.55, 0.95, "FaLaptop", HEX.amber, "The PAW rule is two policies: ",
    "CA004 requires a compliant device; CA025 blocks admin portals on any device not labeled PAW.");
  sources(s, "Sources: Microsoft Learn — conditions, authentication flows, device filters, app filters, risk policies, workload identities. Book 04, Ch. 07; App. A.");
  notes(s, `The library is enforced in five waves, each closing a class of risk.

Wave one is the foundation, and it has no visible effect for anyone already on modern clients. CA001 blocks legacy authentication, which can't do MFA or present device state. Run the legacy query for at least two weeks first and move every remaining client, including service accounts and multifunction devices that send mail. CA020 requires a managed device to register security information, so an attacker with a password can't register their own method. CA021 blocks device code flow and authentication transfer, the flows used in device-code phishing. And CA090, the probe, never moves to On.

Wave two is administrators. CA003 requires the separate-device strength with a four-hour sign-in frequency, targeting the Admins persona and the highly privileged built-in roles, because role targeting also catches an assignment made outside the persona process. CA004 requires a compliant device, CA005 blocks untrusted locations, and CA025 blocks the admin portals and Azure management from anything that isn't a PAW. That block is written as an exclusion of devices labeled PAW: a positive-operator filter never matches an unregistered device, so an unregistered device isn't excluded, and it's blocked. CA026 gives server and Arc administration the same assurance, and CA027 blocks the Azure management plane for everyone who isn't an administrator or operator.

Wave three is the one users notice: the workforce MFA baseline, managed devices, the country block, partner and guest policies, mobile app protection, the CA018 catch-all, and CA038, without which CA011's limited guest access isn't limited at all.

Wave four is risk and workloads. Wave five is segments and the end state: CA022, phishing-resistant MFA for every member.`, "Chapter 07 — The Conditional Access Policy Library; Appendix A.");
}

// ------------------------------------------------------------------ 8  BOD 25-01
{
  const s = D.content("Module 1 — Policy library", "Why the library looks like this: BOD 25-01");
  tag(s, "Why");
  table(s, ["Required", "Configuration (MS.AAD)", "Library policy"], [
    [k("1.1"), c("Legacy authentication shall be blocked"), c("CA001")],
    [k("2.1"), c("Users detected as high risk shall be blocked"), c("CA013, in its block form")],
    [k("2.3"), c("Sign-ins detected as high risk shall be blocked"), c("CA019 (CA012 until retired)")],
    [k("3.1"), c("Phishing-resistant MFA for all users"), c("CA022; CA003 for admins")],
    [k("3.2"), c("Another MFA method until 3.1 is enforced"), c("CA006, CA009, CA018")],
    [k("3.6"), c("Phishing-resistant MFA for highly privileged roles"), c("CA003")],
  ], [1.2, 3.8, 2.4], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] });
  txt(s, "Should note", "SCuBA SHOULD items also met: CA007 (MS.AAD.3.7, managed devices) and CA020 (MS.AAD.3.8, managed devices to register MFA).",
    { x: 0.6, y: 5.02, w: 7.4, h: 0.5, fontSize: 12, italic: true, color: HEX.slate });
  panel(s, "Conflict", 8.25, 1.5, 4.5, 3.95, HEX.redTint, HEX.red, "When guidance conflicts", [
    "Microsoft recommends “require risk remediation” for high-risk users",
    "BOD 25-01 says they shall be blocked, and block overrides remediation",
    "So CA013 blocks all users in any tenant within BOD 25-01's scope",
    "Recovery runs through the help desk: confirm the account, reset credentials, dismiss the risk",
  ], 13);
  callout(s, "Managed", 5.6, 0.95, "FaClipboardCheck", HEX.navy, "Microsoft-managed policies: ",
    "for each, the program records adopt or supersede; five are superseded by library policies.");
  sources(s, "Sources: CISA BOD 25-01 and its required configurations; SCuBA Entra ID baseline; Microsoft Learn — managed policies, grant controls. Book 04, Ch. 03 and 07.");
  notes(s, `Why does the library look this way? Much of it is the answer to CISA's BOD 25-01, which requires federal civilian agencies to implement CISA's mandatory configurations for in-scope cloud tenants. The deadline for the configurations effective at issuance was June 20, 2025.

The table lists the Entra ID items that Conditional Access answers. Legacy authentication blocked: CA001. High-risk users blocked: CA013. High-risk sign-ins blocked: CA019. Phishing-resistant MFA for all users: CA022, with CA003 for administrators. Another MFA method until then: CA006, CA009 and CA018, as the interim. And phishing-resistant MFA for highly privileged roles: CA003. Two SHOULD items from the SCuBA baseline are met by CA007 and CA020. The other mandatory Entra items, such as authentication methods settings, application consent and the privileged-role rules, aren't Conditional Access settings, and the book covers them elsewhere.

One conflict is worth understanding. Book 02 adopted Microsoft's current recommendation for high-risk users, require risk remediation. BOD 25-01 says high-risk users shall be blocked. Both can't win, because when several risk policies apply, block overrides remediation. So in any tenant within the directive's scope, CA013's grant is Block, it includes all users rather than only members, and recovery runs through the help desk: an administrator confirms the account, resets credentials and dismisses the risk. Where the directive doesn't apply, CA013 uses remediation for members.

Last, Microsoft-managed policies. Microsoft creates some policies itself, in report-only, and turns them on no less than thirty days later unless an administrator sets them to Off. The program writes down a decision for each, adopt or supersede, because a policy Microsoft enables on a schedule is a change the agency didn't make. Five are superseded by library policies.`, "Chapter 07 — The Conditional Access Policy Library; Chapter 03 — The Conditional Access Model.");
}

// ================================================================== Module 2
{
  const s = divider("Module 2 — Rollout and exceptions", 2, "Rollout, exclusions and break-glass", 11, "FaRoute", [
    ["How", "Every policy passes the same gates"],
    ["How", "Reading report-only, rolling back without deleting"],
    ["What", "Exclusions are governed objects"],
    ["Who", "Break-glass: the one standing exception"],
    ["How", "Monitoring: what the sign-in logs must show"],
  ], "Book 04, Chapters 02, 03, 04 and 07",
  "A policy that targets all users can lock out the whole organization, administrators included.");
  notes(s, `Module two: getting the library into production safely.

A policy that targets all users can lock out the whole organization, administrators included. So this module is about the gates every policy passes, how to read report-only results and roll back without deleting anything, why every exclusion is a governed object, how the break-glass accounts are built and watched, and what the sign-in logs must show once the policies are on.`, "Chapter 07 — The Conditional Access Policy Library.");
}

// ------------------------------------------------------------------ 10  Gates
{
  const s = D.content("Module 2 — Rollout and exceptions", "Every policy passes the same gates");
  tag(s, "How");
  steps(s, "Gate", [
    ["Gate 1 · Report-only", "2 to 4 weeks (Microsoft's minimum is 1). Review impact, gaps and exclusions"],
    ["Gate 2 · Pilot ring", "2 weeks, on, for IT and security staff"],
    ["Gate 3 · Expanding rings", "1 to 2 weeks each: headquarters, then field and remote, then everyone"],
    ["Steady state", "Enforced and monitored; drift alerts; roll back by off or report-only"],
  ], 1.5, 1.35, 12.5);
  txt(s, "Cycle left", [
    { text: "1  Pre-check: ", options: { bold: true, color: HEX.navy } }, { text: "prerequisites, readiness gates, emergency exclusion, JSON reviewed in source control", options: { breakLine: true } },
    { text: "2  Create in report-only: ", options: { bold: true, color: HEX.navy } }, { text: "compliant-device versions leave out macOS, iOS and Android", options: { breakLine: true } },
    { text: "3  Measure ", options: { bold: true, color: HEX.navy } }, { text: "at least 7 days in the impact view and insights workbook", options: { breakLine: true } },
    { text: "4  Fix the cause; ", options: { bold: true, color: HEX.navy } }, { text: "add an exclusion only as a governed object" },
  ], { x: 0.6, y: 3.05, w: 6.0, h: 2.1, fontSize: 12.5, paraSpaceAfter: 6 });
  txt(s, "Cycle right", [
    { text: "5  Review: ", options: { bold: true, color: HEX.teal } }, { text: "security and business owners approve; kept as change evidence", options: { breakLine: true } },
    { text: "6  Enforce ring by ring: ", options: { bold: true, color: HEX.teal } }, { text: "never straight from off to on for all users", options: { breakLine: true } },
    { text: "7  Watch 48 hours: ", options: { bold: true, color: HEX.teal } }, { text: "help desk volume, blocks by app, service and kiosk accounts" },
  ], { x: 6.85, y: 3.05, w: 5.9, h: 2.1, fontSize: 12.5, paraSpaceAfter: 6 });
  callout(s, "Readiness", 5.3, 1.2, "FaChartLine", HEX.amber, "Readiness gates: ",
    "95% of in-scope users registered for the policy's strength; 90% of devices enrolled and compliant; attributes populated. Each wave waits until the last has run a week without incident.");
  sources(s, "Sources: Microsoft Learn — plan a Conditional Access deployment, report-only and policy insights. Book 04, Ch. 07; Book 02, Ch. 09 for durations.");
  notes(s, `Every policy, in every wave, passes the same gates. Book 02 set the durations, and Microsoft's own minimum is a week in report-only before enforcement.

Gate one is report-only, two to four weeks, while impact, gaps and exclusions are reviewed. Gate two is a pilot ring of IT and security staff for two weeks. Gate three expands ring by ring, one to two weeks each: headquarters, then field and remote staff, then everyone in scope. Then steady state: enforced, monitored, with drift alerts.

Inside that, the chapter consolidates a seven-step cycle. One, a pre-deployment check: prerequisites exist, readiness gates are met, the emergency exclusion is present, and the policy JSON has been reviewed in source control. Two, create the policy in report-only. One detail: a report-only policy that requires a compliant device can prompt users on macOS, iOS and Android to pick a certificate, so leave those platforms out of the report-only version. Three, measure for at least seven days. Four, analyze and remediate: missing registrations, noncompliant devices, untagged applications, empty attributes. Fix the cause; add an exclusion only as a governed object. Five, security and business owners approve the impact analysis, and that approval is kept as change evidence. Six, enforce for the pilot ring and expand. Turning a policy that targets all users straight from off to on is never allowed. Seven, watch for forty-eight hours after each ring.

The readiness gates are the program's numbers: at least ninety-five percent of in-scope users have a method that satisfies the policy's strength, and at least ninety percent of devices are enrolled and compliant, with the attributes populated. The point is that each wave starts with a measured number, not an estimate. And a wave starts only after the previous one has been enforced for a week without an incident.`, "Chapter 07 — The Conditional Access Policy Library.");
}

// ------------------------------------------------------------------ 11  Report-only and rollback
{
  const s = D.content("Module 2 — Rollout and exceptions", "Reading report-only, rolling back without deleting");
  tag(s, "How");
  table(s, ["Report-only result", "Graph value", "Meaning"], [
    [k("Success"), c("reportOnlySuccess"), c("Matched; controls already satisfied")],
    [k("Failure", HEX.red), c("reportOnlyFailure"), c("Matched; this is what a block would do")],
    [k("User action required", HEX.amber), c("reportOnlyInterrupted"), c("Matched; the user would be prompted")],
    [k("Not applied", HEX.slate), c("reportOnlyNotApplied"), c("Didn't match, for example excluded")],
  ], [1.85, 1.95, 2.15], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.5, 0.5, 0.5, 0.5] });
  txt(s, "Limits", "Policies scoped to user actions can't run in report-only, and GPS-based named locations still prompt for location in report-only.",
    { x: 0.6, y: 4.05, w: 5.95, h: 0.75, fontSize: 12, italic: true, color: HEX.slate });
  table(s, ["Rollback", "When", "How"], [
    [k("Report-only"), c("Need data while investigating"), c("Set the state to report-only")],
    [k("Scope reduction"), c("One population is blocked"), c("Time-bound exclusion group; fix the cause; remove it")],
    [k("Policy off"), c("One policy blocks widely"), c("Set it Off; investigate")],
    [k("Wave rollback", HEX.red), c("A wave's policies interact badly"), c("Wave to report-only; open an incident")],
  ], [1.6, 2.0, 2.3], { x: 6.85, y: 1.5, fontSize: 11.5, rowH: [0.38, 0.5, 0.5, 0.5, 0.5] });
  callout(s, "Delete", 5.05, 1.4, "FaTriangleExclamation", HEX.red, "Never delete during a rollback: ",
    "a deleted policy can be restored within 30 days, but deletion breaks its change history. Locked out? An emergency account reverses the change; failing that, Microsoft support can, after verification.");
  sources(s, "Sources: Microsoft Learn — report-only mode, policy insights, appliedConditionalAccessPolicy, troubleshooting, deployment planning. Book 04, Ch. 03 and 07.");
  notes(s, `Report-only is a policy state, not a test environment. The policy is evaluated at every sign-in and its result is logged, but nothing is enforced.

There are four results, and you'll see them in the sign-in logs and in Microsoft Graph under the names in the middle column. Success means the conditions matched and the controls were already satisfied, for example an MFA claim was already in the token. Failure means the conditions matched and a non-interactive control failed: that's what a block would do. User action required, which Graph calls report-only interrupted, means the user would have been prompted. And not applied means the conditions didn't match, often because the user is excluded. Two limits: user-action policies can't run in report-only at all, and GPS-based named locations still prompt users for location.

To change an enforced policy, Microsoft's practice is to create a report-only copy with the change, compare the two, and then update the original.

Rollback has four forms, from smallest to largest. Revert one policy to report-only when you need data while you investigate. Reduce scope with a time-bound exclusion group when one population is blocked, fix the cause, then remove the group. Turn a policy Off when it's causing widespread blocks. And when several policies in a wave interact badly, set the whole wave to report-only and open an incident.

What's never on the list is deletion. Microsoft does let you restore a deleted policy or named location within thirty days, but a deletion breaks the policy's change history in source control, and the drift record has to explain it. If the tenant is locked out entirely, an emergency account signs in and reverses the change. If no administrator can, Microsoft support can update the blocking policy after verification.`, "Chapter 07 — The Conditional Access Policy Library; Chapter 03 — The Conditional Access Model.");
}

// ------------------------------------------------------------------ 12  Exclusions
{
  const s = D.content("Module 2 — Rollout and exceptions", "Exclusions are governed objects");
  tag(s, "What");
  table(s, ["Exclusion group", "Policy", "Rule"], [
    [k("CA-Exclude-EmergencyAccess", HEX.teal), c("Every enforced"), c("Permanent by design; assigned; the two emergency accounts")],
    [k("CA-Exclude-ApprovedTravel"), c("CA008"), c("Granted through PIM for Groups after approval, 14 days at most; CA006 and CA018 still apply")],
    [k("CA-Exclude-DeviceCodeFlow"), c("CA021"), c("Teams Rooms and similar devices; narrow further with a device filter or location")],
    [k("CA-Exclude-RegistrationOnboarding"), c("CA020"), c("Remote new hires for a few days, with a Temporary Access Pass")],
    [k("CA-Exclude-PhishResistantNotReady"), c("CA022"), c("Shrinks as users enroll; every member has an expiry")],
  ], [3.05, 1.2, 3.55], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.55, 0.6, 0.6, 0.55, 0.55] });
  panel(s, "Rules", 8.6, 1.5, 4.15, 3.35, HEX.navyTint, HEX.navy, "Rules for every exclusion", [
    "A group, never a named user in the policy",
    "An owner, a reason, an expiry and a review",
    "No user accounts used as services; the sync account is the one exception",
    "Test the exclusion: another policy may still prompt",
  ], 12.5);
  callout(s, "Holes", 5.1, 1.35, "FaDoorOpen", HEX.red, "Exclusions are absolute: ",
    "each one is a standing hole in every policy that lists it. And a dynamic group that misses users with empty attributes is an exclusion nobody approved.");
  sources(s, "Sources: Microsoft Learn — Conditional Access users and groups (exclusions), deployment planning, authentication flows. Book 04, Ch. 01, 03 and 07.");
  notes(s, `Because an exclusion overrides everything, each one is a standing hole in policy, and exclusions accumulate the way Group Policy exceptions did. So the program treats every exclusion as a governed object.

The only exclusion that's permanent by design is the emergency access group, which every enforced policy excludes. The others in the library are each tied to one policy and one reason. Approved travel lets a traveler past CA008's country block, granted through PIM for Groups after an approved request, for at most fourteen days, and the traveler must still meet CA006 and CA018. The device code flow group holds Teams Rooms and similar devices that genuinely need that flow, ideally narrowed further in a companion policy. The onboarding group lets remote new hires who don't have a managed device yet register MFA for a few days, using a Temporary Access Pass from the pre-hire workflow. And the not-ready group for CA022 is the enrollment backlog: it shrinks as users enroll, and every member has an expiry.

The rules on the right apply to all of them. An exclusion is a group, never a user named in a policy. It has an owner, a reason, an expiry, and a place in the access review schedule. Where a script or tool signs in as a user, the fix is a managed identity or workload identity, not an exclusion; the directory sync account is the documented exception. And test the exclusion, not just the policy, because an excluded user can still be prompted by another policy.

The opposite failure is quieter. A policy that includes a dynamic group misses every user whose attribute is empty. That's an exclusion nobody approved, which is why the baseline policies include all users and exclude narrowly, and why attribute completeness is checked before any attribute-scoped policy is enforced.`, "Chapter 03 — The Conditional Access Model; Chapter 07 — The Conditional Access Policy Library.");
}

// ------------------------------------------------------------------ 13  Break-glass
{
  const s = D.content("Module 2 — Rollout and exceptions", "Break-glass: the one standing exception");
  tag(s, "Who");
  panel(s, "Standard", 0.6, 1.5, 6.0, 3.8, HEX.tealTint, HEX.teal, "The standard", [
    "Two or more cloud-only accounts on *.onmicrosoft.com; not synced, federated or tied to a person",
    "Permanent active Global Administrator: with service principals that can't activate, the only standing assignments",
    "Phishing-resistant: a FIDO2 passkey or certificate-based authentication, unlike normal admins' methods",
    "Excluded from blocking and restricting policies through one group",
    "Validated at least every 90 days, from a PAW or secure workstation",
  ], 12.5);
  panel(s, "Watched", 6.85, 1.5, 5.9, 3.8, HEX.navyTint, HEX.navy, "How the build watches them", [
    "CA090, report-only, is the only policy that sees their sign-ins",
    "Alerts match object IDs, because the names don't reveal the purpose",
    "Every use is a critical incident until a post-use review closes it",
    "The security plan records them as a deviation from AC-2(2), with compensating controls",
    "They exist, and pass a test, before any PIM approval is switched on",
  ], 12.5);
  callout(s, "Lockout", 5.5, 0.95, "FaKey", HEX.red, "The documented lockout: ",
    "all Global and Privileged Role Administrators eligible, approval required, no approvers.");
  sources(s, "Sources: Microsoft Learn — emergency access accounts, mandatory MFA; NIST SP 800-53 AC-2(2). Book 04, Ch. 02, 04, 07 and 08.");
  notes(s, `Every control that blocks an administrative path also creates a way to lock the agency out of its own tenant: federation down, every administrator's MFA device unavailable, a misconfigured policy, or every privileged role eligible with no approver able to act. Emergency access accounts, break-glass, are the answer, and they're the only standing privilege the program accepts by design.

The standard is on the left. Two or more cloud-only accounts on the tenant's onmicrosoft dot com domain, neither synchronized nor federated, and not tied to one person or an employee's phone. Permanent active Global Administrator; together with service principals that can't perform an activation, they're the only standing active assignments in the tenant. Phishing-resistant authentication, a FIDO2 passkey or certificate-based authentication, using methods different from the normal administrator accounts. The older pattern of a password in sealed envelopes is superseded, because a password alone can no longer reach the admin portals where Microsoft's mandatory MFA applies. Excluded from every policy that blocks or restricts sign-in, through one dedicated group. Validated at least every ninety days by signing in and performing an administrative task.

On the right is how the build watches them. Report-only policies don't need the exclusion, so CA090 is the one policy that records their sign-ins. Alerts match the accounts' object IDs, because their names deliberately don't reveal their purpose. Every use is a critical incident until a post-use review closes it. And because NIST's AC-2(2) expects emergency accounts to be disabled automatically after a defined period, the system security plan records these as a documented deviation, with monitoring, post-use review and the ninety-day validation as compensating controls.

Finally, order. The accounts exist and pass a test before any role is made eligible or any approval is switched on. Module three explains the lockout that prevents.`, "Chapter 02 — Why Standing Privilege Fails; Chapter 04 — Privileged Roles and Tiers; Chapter 07.");
}

// ------------------------------------------------------------------ 14  Monitoring
{
  const s = D.content("Module 2 — Rollout and exceptions", "Monitoring: what the sign-in logs must show");
  tag(s, "How");
  table(s, ["Signal", "SigninLogs query or view", "Expected"], [
    [k("Per-policy results"), c("Each policy's results over 7 days, report-only outcomes included"), c("Wave 2: no “not applied” results for members of the Admins group")],
    [k("Blocked sign-ins"), c("ResultType 53003, BlockedByConditionalAccess, last 24 hours"), c("A spike on one app usually means a client without modern auth or app protection")],
    [k("End-state gap"), c("CA022 report-only failures and interruptions"), c("The list that drives phishing-resistant enrollment")],
    [k("Legacy authentication"), c("Legacy ClientAppUsed values, 14 days"), c("Empty before CA001 is enforced")],
    [k("Coverage gaps", HEX.red), c("Successful sign-ins with ConditionalAccessStatus notApplied"), c("Empty for interactive sign-ins once CA018 is enforced")],
    [k("Emergency access", HEX.teal), c("UserId in the two accounts' object IDs"), c("Zero outside scheduled validation")],
  ], [2.2, 4.55, 5.4], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.48, 0.48, 0.44, 0.44, 0.44, 0.44] });
  callout(s, "Drift", 4.95, 1.5, "FaArrowsRotate", HEX.amber, "Drift alerts: ",
    "a state change without approval; any exclusion group's membership changed; conditions, locations or strengths changed; a policy made or deleted outside the pipeline, Microsoft-managed included; persona or device attributes missing.");
  sources(s, "Sources: Microsoft Learn — SigninLogs, appliedConditionalAccessPolicy, troubleshooting. The chapter's queries are illustrative and untested. Book 04, Ch. 07.");
  notes(s, `Once policies are on, the sign-in logs are the instrument. The queries run against the SigninLogs table in a Log Analytics workspace that receives Entra sign-in logs. The chapter gives them in full; they're illustrative and haven't been tested against a production workspace, so confirm column values against your own data before using them for alerting or evidence.

Six signals matter. Per-policy results over seven days, including report-only outcomes; after wave two, members of the Admins group should show no not-applied results for the administrator policies. Blocked sign-ins, error 53003, which is blocked by Conditional Access; a spike on a single application usually means a client that can't do modern authentication or app protection. The end-state gap: users who would fail CA022 while it's in report-only. That's the list that drives the enrollment campaign. Legacy authentication still in use, over fourteen days, which must be empty before CA001 is enforced. Coverage gaps: successful sign-ins that no policy applied to, which should be empty for interactive sign-ins once CA018 is on. And emergency account use, matched on object IDs, which should be zero outside scheduled validation.

Then drift. The policy set in the tenant must equal the policy set in source control, and the drift check alerts on a policy whose state changed without an approved change; a change to any exclusion group's membership, especially the emergency access group; a change to conditions, named locations, authentication strengths or controls; a policy created or deleted outside the pipeline, including a Microsoft-managed policy that Microsoft added or enabled; and users or devices missing the attributes that put them in scope.

Protected actions, which require fresh strong authentication to change policies and named locations, narrow who can cause drift in the first place. Module three builds them.`, "Chapter 07 — The Conditional Access Policy Library.");
}

// ================================================================== Module 3
{
  const s = divider("Module 3 — PIM", 3, "PIM self-request with approval", 10, "FaUserClock", [
    ["Why", "Eligible, requested, approved: the activation gate"],
    ["What", "Activation controls, set per role and by tier"],
    ["How", "Build it in order: emergency access first"],
    ["Who", "Approvers, alerts and the record PIM leaves"],
  ], "Book 04, Chapters 04 and 08; Appendix B",
  "An eligible role is only as safe as the moment it turns active.");
  notes(s, `Module three: Privileged Identity Management, self-request with approval.

An eligible role is only as safe as the moment it turns active. So that moment needs fresh proof, a reason, a second person, and a record that outlives the audit window. We'll cover the two layers of self-request, the activation controls by tier, the build in the order that avoids locking yourself out, and the approvers, alerts and records an assessor will ask for. Appendix B has every role's settings.`, "Chapter 08 — PIM Self-Request with Approval.");
}

// ------------------------------------------------------------------ 16  Activation gate
{
  const s = D.content("Module 3 — PIM", "Eligible, requested, approved: the activation gate");
  tag(s, "Why");
  box(s, "Layer 1", 0.6, 1.5, 5.95, 1.3, HEX.navyTint);
  txt(s, "Layer 1 text", [
    { text: "Layer 1 · Eligibility", options: { bold: true, color: HEX.navy, fontSize: 16, fontFace: "Cambria", breakLine: true } },
    { text: "Entitlement management, through an access package for the role-assignable group. May this person ever hold this role?", options: { fontSize: 12.5 } },
  ], { x: 0.8, y: 1.58, w: 5.55, h: 1.15 });
  box(s, "Layer 2", 6.8, 1.5, 5.95, 1.3, HEX.tealTint);
  txt(s, "Layer 2 text", [
    { text: "Layer 2 · Activation — this module", options: { bold: true, color: HEX.teal, fontSize: 16, fontFace: "Cambria", breakLine: true } },
    { text: "PIM, per use. May this person use this role right now? The record AC-6(9) and AC-17(4) are tested against.", options: { fontSize: 12.5 } },
  ], { x: 7.0, y: 1.58, w: 5.55, h: 1.15 });
  steps(s, "Act", [
    ["1 Request", "Duration within the maximum, justification, ticket"],
    ["2 Step up", "Context c1: a fresh phishing-resistant sign-in"],
    ["3 Pending", "Approvers emailed; listed in Approve requests"],
    ["4 Decide", "An approver outside the tier, with their own reason"],
    ["5 Active", "Until the requested end; reverts on its own"],
    ["6 Or not", "Denied, or no decision in 24 hours: stays eligible"],
  ], 3.0, 1.65, 12);
  callout(s, "License", 4.9, 1.5, "FaTriangleExclamation", HEX.red, "License continuity is a control dependency: ",
    "if P2 or Governance lapses, eligible Entra role assignments are removed, PIM settings are removed and role reviews end. Keep the role inventory exported so eligibility can be restored.");
  sources(s, "Sources: Microsoft Learn — PIM overview, role settings, approval workflow, ID Governance licensing, DoD Zero Trust user pillar. Book 04, Ch. 08.");
  notes(s, `Self-request has two layers, and an agency can run either or both. Self-request for eligibility is a person asking to become eligible for a role. It's decided in entitlement management, through an access package for the role-assignable group, and it answers: may this person ever hold this role? Self-request for activation is an already-eligible person asking to turn the role on for a bounded window. It's decided in PIM, and it answers: may this person use this role right now? Microsoft's guidance for the DoD Zero Trust user pillar treats the two as composable.

This module builds the second layer, because it produces a per-use, time-bounded, individually justified record of privileged use, which is what AC-6(9) and AC-17(4) are tested against. Eligibility without an activation gate is standing privilege through a nicer front door. If an agency runs only one layer, it should run this one.

The sequence is six steps. The administrator requests activation with a duration within the role's maximum, a justification and a ticket number. PIM sends them through authentication context c1, which demands a fresh phishing-resistant sign-in. The request goes pending, and approvers are emailed. An approver from outside the requester's tier approves or denies, with their own justification. On approval, the role is active until the requested end time and returns to eligible with no action. Denied, or undecided after twenty-four hours, the role stays eligible and a new request is needed.

One dependency people miss. If the P2 or Governance license lapses, permanent assignments are unaffected, but eligible Entra role assignments are removed, PIM settings are removed and role reviews end. Treat a license expiry as a configuration-management event, and keep the role inventory exported so eligibility can be restored.`, "Chapter 08 — PIM Self-Request with Approval.");
}

// ------------------------------------------------------------------ 17  Controls by tier
{
  const s = D.content("Module 3 — PIM", "Activation controls, set per role and by tier");
  tag(s, "What");
  table(s, ["Tier", "Max activation", "On activation", "Ticket", "Approval", "Eligibility expiry"], [
    [k("Tier 0 · control plane", HEX.red), c("4 hours"), c("Context c1"), c("Required"), c("PIM-Approvers-T0"), c("90 days")],
    [k("Tier 1 · management plane"), c("8 hours"), c("Context c1"), c("Required"), c("PIM-Approvers-T1"), c("180 days")],
    [k("Tier 2 · scoped operations", HEX.teal), c("8 hours"), c("Context c1"), c("Required"), c("Optional, with a risk acceptance per role"), c("180 days")],
    [k("Read-only", HEX.slate), c("8 hours"), c("Context c1"), c("Optional"), c("Not required"), c("365 days")],
  ], [2.65, 1.55, 1.6, 1.25, 3.2, 1.9], { y: 1.5, fontSize: 12, rowH: [0.4, 0.45, 0.45, 0.55, 0.45] });
  panel(s, "Really", 0.6, 4.0, 5.95, 2.45, HEX.navyTint, HEX.navy, "What the controls really do", [
    "Activation lasts 1 to 24 hours: that's the exposure window",
    "“Require MFA on activation” may not prompt if MFA happened earlier in the session",
    "Ticket information is recorded, never validated",
    "Approval needs one approver at least; Microsoft recommends two",
  ], 12.5);
  panel(s, "Side door", 6.8, 4.0, 5.95, 2.45, HEX.amberTint, HEX.amber, "Assignment controls close the side door", [
    "No permanent eligible: expiry by tier, inside Book 02's 12-month ceiling",
    "No permanent active, except Global Administrator for the emergency accounts",
    "MFA and justification required when an active assignment is made",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — configure Entra role settings in PIM. Book 04, Ch. 04 and 08; Appendix B.");
  notes(s, `PIM settings are defined per role. Each role's settings are independent of every other role's, and every assignment of a role follows them. The program sets them by tier, from Chapter 04's tier model.

Tier 0 is the control plane: Global, Privileged Role, Privileged Authentication, Security and Conditional Access Administrator. Four-hour activations, authentication context c1, justification and ticket required, approval by the Tier 0 approver group, and eligibility that expires after ninety days. Tier 1, the management plane, such as Exchange, SharePoint, Intune and Application Administrator, gets eight hours, the Tier 1 approver group, and a hundred and eighty days. Tier 2, scoped operations inside administrative units, gets eight hours, and approval is optional, with a documented risk acceptance per role. Read-only roles need no approval, but still pass c1 with a justification, and their eligibility runs a year.

Now, what the controls really do, because the old guides got several wrong. The activation maximum runs from one to twenty-four hours, and it's the exposure window, so set the shortest the work needs. Require MFA on activation may not prompt at all if the user authenticated strongly earlier in the session, so it proves nothing at activation time. That's why every role uses the authentication context instead, which is Microsoft's recommendation when the goal is authentication during activation. Ticket information is recorded but never checked against a ticketing system; enforced correlation belongs in the SIEM or ITSM. And approval needs at least one approver, with two recommended.

The assignment controls close the side door, so a well-built gate can't be bypassed by simply granting someone a permanent active assignment. No permanent eligible assignments. No permanent active ones, except Global Administrator for the emergency accounts. And MFA and justification are required when an active assignment is made, because PIM can't apply an activation requirement to someone who's already active.`, "Chapter 08 — PIM Self-Request with Approval; Appendix B — PIM Role Settings Reference.");
}

// ------------------------------------------------------------------ 18  Build order
{
  const s = D.content("Module 3 — PIM", "Build it in order: emergency access first");
  tag(s, "How");
  const st = [["Step 0", "Emergency access accounts"], ["Step 1", "Approver groups per tier"], ["Step 2", "Context c1 and its policy, On"], ["Step 3", "Role settings in the portal"], ["Step 4", "Role settings in Graph"],
    ["Step 5", "Standing to eligible, eligible first"], ["Step 6", "Protected actions with c2"], ["Step 7", "Notifications and alerts"], ["Step 8", "Reviews of eligibility"], ["Step 9", "Export audit records"]];
  st.forEach((t, i) => {
    const col = i % 5, row = Math.floor(i / 5), w = 2.31, x = 0.6 + col * (w + 0.15), y = 1.5 + row * 0.82;
    box(s, `Step ${i}`, x, y, w, 0.72, i === 0 ? HEX.redTint : row ? HEX.tealTint : HEX.navyTint);
    txt(s, `Step ${i} text`, [{ text: `${t[0]}  `, options: { bold: true, color: i === 0 ? HEX.red : row ? HEX.teal : HEX.navy, fontSize: 11 } }, { text: t[1], options: { bold: true, fontSize: 12.5 } }],
      { x: x + 0.1, y: y + 0.04, w: w - 0.2, h: 0.64, valign: "middle" });
  });
  panel(s, "c1", 0.6, 3.25, 5.95, 2.4, HEX.navyTint, HEX.navy, "c1 · FMP-PIM-Activation", [
    "Policy: separate-device strength and compliant device; sign-in frequency every time; emergency group excluded",
    "On before c1 is selected in PIM; report-only doesn't count",
    "Don't scope it to a directory role: the user doesn't hold it yet",
    "Off, report-only or excluded: no fallback to MFA",
  ], 11.5);
  panel(s, "c2", 6.8, 3.25, 5.95, 2.4, HEX.tealTint, HEX.teal, "c2 · FMP-ProtectedActions", [
    "Ties a context to permissions, whatever role grants them",
    "Covers policy create, update, delete; context changes; hard delete",
    "Azure PowerShell fails protected actions; Graph PowerShell works",
    "Recovery entry point: aka.ms/MSALProtectedActions",
  ], 11.5);
  callout(s, "Order", 5.74, 0.82, "FaTriangleExclamation", HEX.red, "Step 0 can't move: ",
    "required approval with no approvers and no active admin locks the tenant.");
  sources(s, "Sources: Microsoft Learn — PIM role settings, rules mapping, assign roles in PIM, protected actions, emergency access. Book 04, Ch. 08.");
  notes(s, `Work the build in order. Step zero isn't optional and can't be moved: configuring approval before emergency access accounts exist is the one sequence that can lock an agency out of its own tenant. Microsoft documents it. Every Privileged Role and Global Administrator assignment is eligible, approval is required, and no approvers are configured, so the default approvers, the active administrators, don't exist. Avoid it with both halves of the fix: emergency accounts with permanent active Global Administrator, and named approver groups on every role that needs approval.

Step one builds those approver groups, one per tier. Step two builds authentication context c1 and its Conditional Access policy: the separate-device strength and a compliant device, sign-in frequency every time, excluding the emergency group, and turned On, because Microsoft requires the policy to exist and be enabled before the context is selected in PIM. Three constraints. Don't scope that policy to a directory role, because at activation the user doesn't hold the role yet. The fallback to plain MFA happens only when no policy targets the context; it doesn't trigger if the policy is off, in report-only or excludes the user. And the context governs activation, not use, so CA003, CA004 and CA025 still apply to every privileged sign-in.

Steps three and four apply role settings, in the portal for one role and in Microsoft Graph for thirty. Each role's policy has seventeen rules. Step five converts standing assignments: create the eligible assignment first, confirm the person can activate, then remove the active one.

Step six closes a gap PIM leaves. PIM protects becoming a Conditional Access Administrator, but not editing a policy once someone holds that permission. Protected actions attach a second context, c2, to those permissions. Steps seven to nine are notifications and alerts, reviews, and log export, on the next slide.`, "Chapter 08 — PIM Self-Request with Approval.");
}

// ------------------------------------------------------------------ 19  Approvers, alerts, record
{
  const s = D.content("Module 3 — PIM", "Approvers, alerts and the record PIM leaves");
  tag(s, "Who");
  table(s, ["Approver rule", "Why"], [
    [k("Approvers aren't in the population they approve"), c("Otherwise approval is mutual sign-off; the platform blocks only self-approval")],
    [k("At least two per tier, held as groups"), c("Survives one absence; named people break when they leave")],
    [k("Tier 0 approvers outside Tier 0"), c("For example the security office; approvers need a license, not a role")],
    [k("Approver justification required"), c("The record holds the decision, not a click")],
    [k("Approver groups are reviewed"), c("They hold no role, but they're privileged objects")],
  ], [3.0, 3.3], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.55, 0.5, 0.55, 0.45, 0.45] });
  panel(s, "Signals", 7.15, 1.5, 5.6, 3.25, HEX.amberTint, HEX.amber, "Signals and records", [
    "Alert, high severity: roles assigned outside PIM, the bypass signal; each is an incident",
    "A fixed 24-hour approval window, single stage: staff approvers for real hours",
    "Eligibility reviews: Tier 0 monthly, others quarterly; never self-review",
    "PIM audit and Entra logs keep 30 days: export for AU-11",
  ], 12);
  callout(s, "Legacy API", 4.95, 1.5, "FaTriangleExclamation", HEX.red, "October 28, 2026: ",
    "the legacy /beta/privilegedAccess PIM API stops returning data. Move scripts and connectors to roleManagement now. Approving through Graph is beta only, so human approval stays in the admin center.");
  sources(s, "Sources: Microsoft Learn — PIM approval workflow, security alerts, APIs, access reviews, audit history, data retention. Book 04, Ch. 08; Appendix B.");
  notes(s, `The approval engine has three properties that shape the design. Approvers don't need to hold any role. Approvers can't approve their own requests, and service principals can't approve at all; that's enforced by the platform, which is worth saying in the security plan. And approvers need a P2 or Governance license.

From those, the separation rules. A tier's approvers aren't members of that tier's eligible population; otherwise the approvers and the requesters are the same set, and approval degrades to mutual sign-off. The platform blocks self-approval; only group design blocks collusion. At least two approvers per tier, held as governed groups, because named individuals leave. Tier 0 approvers sit outside the Tier 0 population, for example in the security office. The approver's own justification is required, so the record holds a decision, not a click. And approver groups are reviewed like the privileged objects they are.

On the right, the signals and records. The most important PIM alert is roles assigned outside PIM, high severity, because an assignment made outside PIM never met the gate. It detects rather than prevents; limiting who holds Privileged Role Administrator is the prevention. The approval window is a fixed twenty-four hours with a single stage, so a Tier 0 path staffed by two people in one time zone will strand out-of-hours requests; the documented answer to "the approvers are unavailable and production is down" is the emergency procedure, not a workaround. Role reviews run monthly for Tier 0 and quarterly otherwise, and never as self-review, because self-review leaves role-assignable groups out entirely. And PIM's audit history keeps thirty days, so the logs are exported for AU-11 before go-live.

One date to act on: the legacy beta privileged-access API stops returning data on October 28, 2026. Anything still calling it must move now.`, "Chapter 08 — PIM Self-Request with Approval; Appendix B — PIM Role Settings Reference.");
}

// ================================================================== Module 4
{
  const s = divider("Module 4 — Governance", 4, "Access governance", 8, "FaClipboardCheck", [
    ["What", "Access packages: who requests, who approves, how long"],
    ["How", "Reviews on a calendar, removals by default"],
    ["How", "Lifecycle events and guest access"],
  ], "Book 04, Chapter 09",
  "A grant nobody re-confirms is a decision made once and trusted forever.");
  notes(s, `Module four: access governance.

Conditional Access decides whether a session may proceed, and PIM decides whether a privileged role may be active. Neither decides whether a person should still hold the access they were given last year. A grant nobody re-confirms is a decision made once and trusted forever. Three mechanisms close that gap without anyone opening a ticket: requests through access packages, reviews on a calendar, and lifecycle events.`, "Chapter 09 — Access Governance: Packages, Reviews and Lifecycle.");
}

// ------------------------------------------------------------------ 21  Packages
{
  const s = D.content("Module 4 — Governance", "Access packages: who requests, who approves, how long");
  tag(s, "What");
  table(s, ["Tier", "Approval stages", "Deadline", "Expiry", "Extension"], [
    [k("Tier 1", HEX.red), c("Application owner (alternate: backup owner), then the identity governance office"), c("5 days"), c("90 days"), c("With approval")],
    [k("Tier 2"), c("Application owner (alternate: backup owner)"), c("5 days"), c("180 days"), c("With approval")],
    [k("Tier 3", HEX.teal), c("Department owner: the requestor's manager, with a fallback approver"), c("7 days"), c("365 days"), c("No approval, while in scope")],
    [k("External", HEX.amber), c("A separate, stricter policy for partner users"), c("—"), c("365 days at most"), c("Sponsor approval")],
  ], [1.1, 3.25, 1.0, 1.15, 1.35], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.62, 0.5, 0.62, 0.5] });
  txt(s, "Platform", "Platform: one to three stages; one approver decides each stage; a denial or timeout ends the request; no one approves their own; a package can't change catalogs.",
    { x: 0.6, y: 4.3, w: 7.85, h: 0.75, fontSize: 12, italic: true, color: HEX.slate });
  panel(s, "Substrate", 8.7, 1.5, 4.05, 3.55, HEX.navyTint, HEX.navy, "The group substrate", [
    "Apps are assigned to groups, never to users",
    "No nesting: assignment ignores it, and reviews see but can't remove it",
    "APP-<App>-<Role>-<Tier>, e.g. APP-PAYROLL-ADMINS-T1",
    "Dynamic only for Tier 3, Tier 2 with office approval, never Tier 1",
  ], 12);
  callout(s, "SoD", 5.3, 1.15, "FaPeopleArrows", HEX.teal, "Separation of duties: ",
    "incompatible packages must list each other, because the check is one-way. An exception becomes a combined package with a shorter expiry, more reviews and an exception-register entry.");
  sources(s, "Sources: Microsoft Learn — entitlement management, approval and lifecycle settings, separation of duties, group assignment, external access. Book 04, Ch. 09.");
  notes(s, `Entitlement management automates access requests, assignments, reviews and expiration for groups, applications and SharePoint sites, for internal and external users. It has three building blocks. A catalog is the container and the unit of delegation; the program creates one per business domain, with the domain's business owner as catalog owner, and doesn't use the automatic General catalog. An access package bundles resource roles. And a policy says who may request, who approves, and when the assignment ends.

The approval chains follow the application's risk tier, as design positions. Tier 3: the department owner, which is the requestor's manager with a fallback approver for anyone with no manager in the directory, seven days to decide, and a one-year expiry that extends without approval while the user is still in scope. Tier 2: the application owner, with the backup owner as alternate, five days, a hundred and eighty days. Tier 1 adds a second stage, the identity governance office, and expires in ninety days. The earlier procedure only notified the office of Tier 1 grants; a second stage costs a few hours and leaves an approval record instead of an email. External users get a separate, stricter policy and at most a year. The program never uses "never."

Underneath is the group substrate. Applications are assigned to groups, never to users directly. Nested groups are prohibited, because group assignment to an application gives access only to direct members, and a group review shows nested users but can only remove direct members. And names follow one convention, so a group's purpose and tier can be read from it.

Separation of duties: a package can list incompatible packages and groups, but the check is one-way, so each package must list the other. A legitimate exception becomes its own combined package with a shorter expiry and more frequent reviews. And privileged access arrives through PIM eligibility, never through a package that grants an active role.`, "Chapter 09 — Access Governance: Packages, Reviews and Lifecycle.");
}

// ------------------------------------------------------------------ 22  Reviews
{
  const s = D.content("Module 4 — Governance", "Reviews on a calendar, removals by default");
  tag(s, "How");
  table(s, ["Review target", "Cadence", "Reviewers", "No response", "Auto-apply"], [
    [k("PIM roles, Tier 0", HEX.red), c("Monthly"), c("PIM-Approvers-T0"), c("Remove access"), yes("Yes")],
    [k("PIM roles, other tiers"), c("Quarterly"), c("Role owner with approvers or security office"), c("Remove access"), yes("Yes")],
    [k("Tier 1 app groups"), c("Quarterly; two stages of 7 days"), c("Manager, then app owner"), c("No change; escalate"), yes("Yes")],
    [k("Tier 2 app groups"), c("Semiannual"), c("Application owner"), c("No change; escalate"), yes("Yes")],
    [k("Tier 3 app groups"), c("Annual"), c("App or department owner"), c("No change"), yes("Yes")],
    [k("Guests", HEX.amber), c("Quarterly"), c("Sponsors"), c("Remove access"), yes("Yes")],
  ], [2.15, 1.65, 2.0, 1.45, 0.9], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.45, 0.55, 0.55, 0.45, 0.45, 0.45] });
  panel(s, "Bite", 8.4, 1.5, 4.35, 3.4, HEX.amberTint, HEX.amber, "Rules that make reviews bite", [
    "Review groups, not apps: an app review doesn't remove group members",
    "A fallback reviewer whenever reviewers are managers or owners",
    "“Remove” with auto-apply can revoke everything: only privileged roles and guests",
    "Justification on every decision; none in bulk on privileged reviews",
  ], 11.5);
  callout(s, "Evidence", 5.15, 1.3, "FaClipboardCheck", HEX.navy, "Evidence: ",
    "results download as CSV; history reports stay downloadable 30 days, so each goes to the evidence store. Denied access still present five business days after close is a finding.");
  sources(s, "Sources: Microsoft Learn — create and complete access reviews, review history, access reviews FAQ, PIM role reviews. Book 04, Ch. 08 and 09; App. B.");
  notes(s, `Access reviews are recurring attestation that each person still needs what they hold. Each instance captures a snapshot of access when it starts, and changes during a review show up in the next cycle.

The schedule is set by risk. Privileged roles are reviewed in PIM, monthly for Tier 0 by the Tier 0 approver group, and quarterly for the other tiers, with removal if nobody responds. Tier 1 application groups are reviewed quarterly in two stages of seven days: the manager first, then the application owner for everyone the manager approved or marked don't know. That replaces the old manual escalation step. Tier 2 groups are semiannual and Tier 3 annual, by the application or department owner. Guests are reviewed quarterly by their sponsors, and denied guests are blocked and then removed.

Four rules make reviews bite. First, review the groups, not the applications. Microsoft notes that reviewing an application that uses group assignment doesn't remove the members of those groups; they keep their access through the group. Second, whenever reviewers are managers or group owners, add a fallback reviewer for users with no manager and groups with no owner. Third, choose the no-response default deliberately. Microsoft warns that combining remove access with auto-apply can revoke all access to a resource if reviewers don't respond. So the program sets remove only where an unreviewed grant is riskier than a lost one, privileged roles and guests, and no change with escalation for business applications, where a mass removal would stop work. Fourth, justification on every decision, and no bulk decisions on privileged reviews. The service can't prevent a bulk action, so the history is checked for one reviewer recording many identical decisions within minutes.

The records: results download as a CSV, and review history reports stay downloadable for only thirty days, so each one goes straight to the evidence store.`, "Chapter 09 — Access Governance; Chapter 08 — PIM Self-Request with Approval; Appendix B.");
}

// ------------------------------------------------------------------ 23  Lifecycle and guests
{
  const s = D.content("Module 4 — Governance", "Lifecycle events and guest access");
  tag(s, "How");
  table(s, ["Event", "Access tasks in Lifecycle Workflows"], [
    [k("Joiner"), c("Request the onboarding and department packages; never add a new hire directly to an application group")],
    [k("Mover", HEX.amber), c("Remove the old department's packages, request the new one, send the rest to review; 15-day default grace, zero for Tier 1 and privileged")],
    [k("Leaver", HEX.red), c("Cancel pending requests, remove all package assignments, remove from all groups and teams, revoke refresh tokens")],
    [k("Inactivity", HEX.slate), c("Offboard inactive users as a backstop; Microsoft's templates default to 90 days, then 120 to offboard")],
  ], [1.35, 5.35], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.6, 0.6, 0.6, 0.6] });
  txt(s, "Limits", "Up to 50 workflows and 100 custom task extensions per tenant: spend workflows on events, not applications.",
    { x: 0.6, y: 4.4, w: 6.7, h: 0.6, fontSize: 12, italic: true, color: HEX.slate });
  panel(s, "Guests", 7.55, 1.5, 5.2, 3.5, HEX.tealTint, HEX.teal, "Guests, in four layers", [
    "Invite through a package: every guest arrives with an approver, a sponsor and an expiry",
    "Last assignment gone: blocked, then removed after 30 days — governed guests only",
    "Quarterly sponsor review; denied guests blocked and removed",
    "Guest lifecycle policies are preview: adopt at general availability",
  ], 12);
  callout(s, "License", 5.25, 1.2, "FaUserClock", HEX.amber, "Licensing: ",
    "entitlement management and reviews are licensed by Entra ID Governance for the member users involved. Plan it for the whole workforce, or part of it stays ungoverned.");
  sources(s, "Sources: Microsoft Learn — Lifecycle Workflows tasks, templates and conditions; external users; guest lifecycle; ID Governance licensing. Book 04, Ch. 09.");
  notes(s, `The third mechanism is lifecycle events. The HR-driven lifecycle itself, from attributes to joiner, mover and leaver design, belongs to Book 03. This chapter covers only the Lifecycle Workflows tasks that change access, because those tasks are where mover and leaver problems turn into access decisions.

A joiner gets the onboarding package and the department package, never a direct add to an application group. A move is a re-derivation, not an additional grant: remove the previous department's packages, request the new department's package, and send everything the person still holds outside packages to a review. Microsoft's built-in job profile change template does the first two steps, and its remove-all-assignments task defaults to fifteen days after the trigger, a grace period for handover. The program keeps that grace for standard access and sets it to zero for Tier 1 and privileged access. A leaver's workflow cancels pending requests, removes every package assignment, removes the user from all groups and teams, and revokes refresh tokens. And an inactivity workflow is the backstop for accounts whose HR record never produced a leaver event. A tenant can have fifty workflows, so spend them on events, not on applications.

Guests are where unreviewed access piles up fastest, because nobody's HR record ends when a partner project does. Four layers. Invite through a package, so every guest arrives with an approver, a sponsor and an expiry. When a governed guest loses their last assignment, they're blocked and, by default, removed after thirty days; ungoverned guests stay in the tenant indefinitely, so the program marks existing guests with assignments as governed. Sponsors review guests quarterly. And guest lifecycle policies, still in preview, will be adopted when they're generally available.

All of this is licensed by Entra ID Governance, so plan it for the whole workforce. Partial licensing produces a program that governs some people and leaves the rest ungoverned.`, "Chapter 09 — Access Governance: Packages, Reviews and Lifecycle.");
}

// ================================================================== Module 5
{
  const s = divider("Module 5 — Access as code", 5, "Access as code, and the evidence", 9, "FaCodeBranch", [
    ["What", "One file per object, one writer per class"],
    ["How", "Change control, and closing drift at the source"],
    ["Why", "What the assessor reads"],
    ["How", "Taking it back to the tenant"],
  ], "Book 04, Chapter 10",
  "Portal clicks can't be diffed, reviewed or replayed — so they can't be assessed.");
  notes(s, `Module five: access as code, and the evidence it produces.

An access policy that exists only as portal clicks can't be diffed, reviewed or replayed, so it can't be assessed. The invariant this module enforces: every access decision has a reviewable source of truth, a pipeline applies that source, and a monitor checks the tenant against it. Then the evidence is produced by doing the work, not reconstructed for the assessment.`, "Chapter 10 — Access as Code, and the Evidence It Produces.");
}

// ------------------------------------------------------------------ 25  Tools
{
  const s = D.content("Module 5 — Access as code", "One file per object, one writer per class");
  tag(s, "What");
  table(s, ["Object class", "Graph", "Terraform azuread", "Microsoft365DSC", "Tenant monitor"], [
    [k("CA policies, locations, strengths"), yes("Yes"), yes("Yes"), yes("Yes"), yes("Yes")],
    [k("PIM settings, Entra roles"), yes("Yes"), yes("No"), yes("Yes"), yes("Yes")],
    [k("PIM settings, PIM for Groups"), yes("Yes"), yes("Yes"), yes("Yes"), yes("Not listed")],
    [k("Role eligibility"), yes("Yes"), yes("Yes"), yes("Yes"), yes("Yes")],
    [k("Groups"), yes("Yes"), yes("Yes"), yes("Yes"), yes("Yes")],
    [k("Catalogs, packages, policies"), yes("Yes"), yes("Yes"), yes("Yes"), yes("Yes")],
    [k("Access review definitions"), yes("Yes"), yes("No"), yes("Yes"), yes("No")],
    [k("Lifecycle Workflows"), yes("Yes"), yes("No"), yes("Yes"), yes("No")],
  ], [2.6, 0.9, 1.35, 1.55, 1.2], { y: 1.5, fontSize: 11.5, rowH: [0.55, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38] });
  panel(s, "Choice", 8.45, 1.5, 4.3, 3.6, HEX.navyTint, HEX.navy, "The program's choice", [
    "Write: Microsoft365DSC, the one declarative tool covering every class; pin its version",
    "Or Terraform where it covers, with Graph PowerShell for the rest",
    "Detect: the tenant monitor where it covers; a daily comparison for reviews and workflows",
    "Back up: Entra Exporter weekly, kept apart from baselines",
  ], 11.5);
  callout(s, "Writer", 5.3, 1.15, "FaListCheck", HEX.amber, "One writer per object class: ",
    "each class has exactly one tool that writes it, recorded in the repository, and every merge checks the safety rules, starting with the emergency access exclusion.");
  sources(s, "Sources: HashiCorp azuread provider v3.10.0; Microsoft365DSC 2.26.1015.1; Microsoft Learn — Tenant Configuration Management, recoverability. Book 04, Ch. 10.");
  notes(s, `Every access object the program governs has a file in the repository, one per object, and the safety rules travel with the files. Every blocking or grant policy excludes the emergency access group, and new and changed policies deploy as report-only. PIM settings require an authentication context or MFA, justification, and approval for Tier 0, with no permanent active assignment except the emergency accounts. Groups follow the naming convention with no nested members. Packages have an expiry, and incompatible packages are listed both ways. Review definitions have a fallback reviewer and auto-apply. Leaver workflows remove all package assignments and revoke refresh tokens.

Four tools can hold those objects, and every one ends in Microsoft Graph. Graph covers everything, but holds no state, so desired state has to live in the repository and the comparison has to be written. The Terraform azuread provider, at version 3.10.0 as of October 2026, covers most classes but has no access review definitions, no Lifecycle Workflows, and no role management policy for Entra directory roles. Microsoft365DSC, an open-source community module, covers every class in the table. And Microsoft Entra Tenant Governance configuration management, built on generally available Graph APIs, monitors a baseline but doesn't cover review definitions or workflows.

The program's reference choice minimizes write paths while keeping drift detection native. Microsoft365DSC writes, because it's the only declarative tool that covers every class; treat it as a community project, check its release notes, and pin its version. A team already invested in Terraform can use it where it covers, and Graph PowerShell for the rest. The rule that matters is one writer per object class, recorded in the repository. The tenant monitor detects drift where it covers; a daily read-only comparison handles reviews and workflows. And Entra Exporter takes a weekly backup, kept separate from the baselines, as Microsoft advises.`, "Chapter 10 — Access as Code, and the Evidence It Produces.");
}

// ------------------------------------------------------------------ 26  Change control and drift
{
  const s = D.content("Module 5 — Access as code", "Change control, and closing drift at the source");
  tag(s, "How");
  txt(s, "Rules head", "Change control", { x: 0.6, y: 1.5, w: 6.2, h: 0.45, bold: true, fontSize: 16, fontFace: "Cambria", color: HEX.navy });
  txt(s, "Rules", [
    "Two people per change; Tier 0 objects need a second approver from security",
    "Checks before merge: schema, emergency exclusion, safety rules, plan output attached",
    "Report-only first; enable in a second pull request citing the impact review",
    "The pipeline signs in by workload identity federation, no secret: a Tier 0 asset",
    "Emergency portal change under PIM, back-ported within one business day",
    "Rollback is a revert, with the same record as the change",
  ].map((t, i, a) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < a.length - 1 } })),
  { x: 0.6, y: 2.0, w: 6.2, h: 3.0, fontSize: 12.5, paraSpaceAfter: 5 });
  table(s, ["Tenant configuration monitoring", "Limit"], [
    [k("Monitors per tenant"), c("30")],
    [k("Run interval"), c("Every 6 hours, fixed")],
    [k("Resources monitored a day"), c("800 with P1 or P2; Governance adds 10 per license")],
    [k("Snapshot retention"), c("7 days")],
    [k("Resolved drift"), c("Deleted 30 days after it's resolved")],
    [k("Baseline update", HEX.red), c("Deletes that monitor's results and drifts")],
  ], [2.8, 2.9], { x: 7.05, y: 1.5, fontSize: 11.5, rowH: [0.38, 0.42, 0.42, 0.55, 0.42, 0.45, 0.45] });
  callout(s, "Drift", 5.2, 1.3, "FaArrowsRotate", HEX.red, "Close drift at the source: ",
    "unauthorized drift is redeployed from the repository and investigated; intended drift is back-ported by pull request, after exporting the monitor's results. Tier 0 drift is a security incident.");
  sources(s, "Sources: Microsoft Learn — Tenant Governance configuration management, APIs, licensing, FAQ; FedRAMP 20x change management KSIs. Book 04, Ch. 10.");
  notes(s, `The repository is the only normal path to production. Six change-control rules, which together are how the program meets CM-3 and CM-5 for the identity plane and FedRAMP 20x's change-management indicators.

One, two people per change: the author of a pull request can't approve it, and Tier 0 objects, such as emergency exclusions and Tier 0 PIM settings, need a second approver from the security team. Two, checks before merge: schema validation, the emergency exclusion check, the safety rules, and a plan or dry run attached to the pull request. Three, report-only first; a policy runs at least a week against the sign-in logs and is enabled in a second pull request that cites the impact review. Four, the pipeline signs in as a service principal with workload identity federation, no secret. It can change every access policy in the tenant, so it's a Tier 0 asset, with two owners, quarterly permission reviews and a workload identity policy restricting where it signs in from. Five, emergency changes in the portal happen under a PIM activation with a ticket, and are back-ported within one business day; until then the drift monitor reports them, which is the point. Six, rollback is a revert, so it has the same record as the change.

Drift detection catches what code can't stop, because a Global Administrator can still change the tenant directly. The tenant monitor's limits shape how it's used. It runs every six hours, fixed. Snapshots expire after seven days, resolved drifts are deleted thirty days after they're resolved, and updating a baseline deletes that monitor's earlier results. Those are evidence rules in disguise: export every result before changing a baseline.

Every drift is one of two things. Unauthorized or accidental: redeploy the repository's version and investigate from the audit log. Intended but not yet in code: back-port it by pull request. A drift open more than one business day goes to the governance office, and drift on a Tier 0 object is a security incident.`, "Chapter 10 — Access as Code, and the Evidence It Produces.");
}

// ------------------------------------------------------------------ 27  Assessor
{
  const s = D.content("Module 5 — Access as code", "What the assessor reads");
  tag(s, "Why");
  table(s, ["Control", "How the program meets it", "Evidence the assessor reads"], [
    [k("AC-2"), c("Access packages with approval and expiry; scheduled reviews; Lifecycle Workflows"), c("Package files; entitlement audit records per request; review history; workflow runs")],
    [k("AC-3"), c("Conditional Access and group-based application assignment"), c("Policy files and deployment history; monitor results; sign-in logs")],
    [k("AC-5"), c("Three-party group model; incompatible packages; two-person pull requests"), c("Incompatibility settings; approvals showing author and approver differ")],
    [k("AC-6, AC-6(7)"), c("PIM eligibility, not standing roles; reviews monthly for Tier 0, quarterly otherwise"), c("PIM settings files; assignment reports; review results and removals")],
    [k("IA-2(1), (2)"), c("Phishing-resistant authentication strength"), c("Policy files; sign-ins showing the strength met; registration report")],
    [k("AU-11"), c("Export past the 30-day native window"), c("Workspace retention; a 31-day-old activation still in the workspace")],
    [k("CA-7"), c("Six-hourly monitoring, daily comparisons, drift issues"), c("Exported drifts and resolutions; issue history; monthly metrics")],
  ], [1.65, 5.0, 5.5], { y: 1.5, fontSize: 11, rowH: [0.36, 0.46, 0.4, 0.46, 0.46, 0.4, 0.4, 0.4] });
  callout(s, "Limits", 5.3, 1.15, "FaFileShield", HEX.navy, "Honest limits: ",
    "code governs the definition, not the use; native retention is short; and tool coverage moves with every release.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (5.2.0) via FedRAMP; FedRAMP 20x IAM and CMT KSIs. Design-intent mapping, not an assessment result. Book 04, Ch. 08 and 10.");
  notes(s, `Configuration evidence proves a setting existed. Operational evidence proves the setting did its job. An assessor needs both, for the whole assessment period, not just the day of the visit.

The table is the program's mapping. AC-2, account management, is met by access packages with approval and expiry, scheduled reviews, and Lifecycle Workflows; the evidence is the package files, the entitlement audit records for each request, the review history and the workflow run history. AC-3, access enforcement, is the Conditional Access library and group-based assignment, evidenced by policy files, their deployment history, monitor results showing no unresolved drift, and sign-in logs showing policies applied. AC-5, separation of duties, is the three-party group model, incompatible packages and two-person pull requests. AC-6 and its review enhancement are PIM eligibility instead of standing roles, with reviews monthly for Tier 0 and quarterly otherwise. IA-2's MFA enhancements are the phishing-resistant strength, shown in policy files, sign-ins and the registration report. AU-11 isn't met by PIM configuration at all, only by the export, and the validation test is an activation still queryable after thirty-one days. And CA-7, continuous monitoring, is the six-hourly monitor, the daily comparisons and the drift issues with their resolutions.

FedRAMP doesn't set the account-review or privilege-review frequencies; they stay organization-defined, so the security plan states the program's schedule. Under FedRAMP 20x, the same records support the identity indicators, for automated account management, least privilege, just-in-time authorization and passwordless methods, and the change-management indicators for logging, redeploying and validating changes.

And the honest limits. A correct policy file says nothing about whether reviewers read what they approved; the review history carries that. Native retention is short. And tool coverage moves, so re-check the coverage table at every upgrade. This is a design-intent mapping, not an assessment result.`, "Chapter 10 — Access as Code, and the Evidence It Produces; Chapter 08.");
}

// ------------------------------------------------------------------ 28  Close
{
  const s = D.content("Module 5 — Access as code", "Taking it back to the tenant");
  tag(s, "How");
  const cards = [
    ["FaListCheck", "Library", "Prerequisites built, readiness measured, report-only first, waves in order", HEX.navy, HEX.navyTint],
    ["FaDoorClosed", "Exceptions", "Every exclusion a governed group; break-glass alerted and tested every 90 days", HEX.red, HEX.redTint],
    ["FaUserClock", "PIM", "Emergency accounts first; c1 On; named approver groups; eligible only", HEX.teal, HEX.tealTint],
    ["FaClipboardCheck", "Governance", "Packages that expire; groups reviewed, not apps; auto-apply on", HEX.amber, HEX.amberTint],
    ["FaCodeBranch", "Code", "One writer per class; two-person changes; drift monitored", HEX.navy, HEX.navyTint],
    ["FaFileShield", "Evidence", "Exported before the 30-day window closes, assembled monthly", HEX.teal, HEX.tealTint],
  ];
  cards.forEach((a, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 0.6 + col * 4.1, y = 1.5 + row * 1.75;
    box(s, `Card ${i + 1}`, x, y, 3.95, 1.6, a[4]);
    icon(s, a[0], x + 0.2, y + 0.2, 0.6, a[3]);
    txt(s, `Card ${i + 1} head`, a[1], { x: x + 0.95, y: y + 0.2, w: 2.85, h: 0.6, bold: true, color: a[3], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Card ${i + 1} text`, a[2], { x: x + 0.2, y: y + 0.85, w: 3.6, h: 0.7, fontSize: 12.5 });
  });
  callout(s, "Keep", 5.15, 1.3, "FaBook", HEX.navy, "Keep at hand: ",
    "Appendix A for every policy's JSON template, Appendix B for every role's PIM settings, and Book 05 for the device compliance that Conditional Access reads.");
  sources(s, "Sources: Book 04, Chapters 02, 07–10; Appendices A and B.");
  notes(s, `To close, here's what to take back to the tenant.

The library: build the prerequisites before the first policy, measure readiness rather than estimating it, create every policy in report-only, and enforce the waves in order. Exceptions: every exclusion is a governed group with an owner and an expiry, and the break-glass accounts are alerted on every use and tested every ninety days. PIM: emergency accounts first, then the c1 policy switched On, then named approver groups, with every human administrator eligible only. Governance: packages that always expire, reviews of groups rather than applications, and auto-apply turned on. Code: one writer per object class, two people per change, and drift monitored against the baseline. And evidence: exported before Microsoft's thirty-day window closes, and assembled every month.

In Zero Trust, every access decision is a policy decision. This session has been about making those policies explicit, testing them before they enforce, and keeping the proof that they ran.

Keep Appendix A at hand for every policy's template, Appendix B for every role's settings, and Book 05 for the device compliance that Conditional Access reads. Thank you.`, "index; Appendix A; Appendix B.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  s.addNotes("Backup section: not narrated. Policy index and full source list.");
}
{
  const s = D.content("Backup", "Policy index: CA001 to CA090");
  const idx = [
    ["CA001", "1", "All users: block legacy authentication"], ["CA003", "2", "Admins: phishing-resistant separate-device MFA"],
    ["CA004", "2", "Admins: compliant device"], ["CA005", "2", "Admins: block untrusted locations"],
    ["CA006", "3", "Internals: MFA"], ["CA007", "3", "Internals: compliant or hybrid-joined device"],
    ["CA008", "3", "Internals: block non-US locations"], ["CA009", "3", "Externals: MFA"],
    ["CA010", "3", "Externals: terms of use"], ["CA011", "3", "Guests: limited app access"],
    ["CA012", "4", "Guests: block high risk (retired after CA019)"], ["CA013", "4", "High user risk: block where BOD 25-01 applies"],
    ["CA014", "4", "Medium sign-in risk: MFA every time"], ["CA015", "4", "Workload identities: location restriction"],
    ["CA016", "3", "Members: compliant device, Office desktop"], ["CA017", "3", "Internals: app protection, mobile"],
    ["CA018", "3", "All users: MFA catch-all"], ["CA019", "4", "All users: block high sign-in risk"],
    ["CA020", "1", "Members: managed device to register MFA"], ["CA021", "1", "All users: block device code and auth transfer"],
    ["CA022", "5", "Members: phishing-resistant MFA (end state)"], ["CA023", "5", "Web-only: block desktop and mobile clients"],
    ["CA024", "5", "Web-only: limited web session"], ["CA025", "2", "Admins: block non-PAW devices"],
    ["CA026", "2", "Server admins: phishing-resistant, compliant"], ["CA027", "2", "Azure management: block non-operators"],
    ["CA028", "5", "Shared devices: kiosk apps, compliant"], ["CA029", "5", "Internals off-network: session limits"],
    ["CA030", "5", "Production apps: block unassigned"], ["CA031", "5", "Production operators: phishing-resistant, compliant"],
    ["CA032", "5", "Staging apps: block off-network"], ["CA033", "5", "Power Platform: block non-makers"],
    ["CA034", "5", "Template: department app, compliant and MFA"], ["CA035", "5", "Template: department app, block unassigned"],
    ["CA036", "4", "Members: block elevated insider risk"], ["CA037", "4", "Workload identities: block high risk"],
    ["CA038", "3", "Guests: block non-approved apps"], ["CA090", "1", "All users: report-only coverage probe, never enforced"],
  ];
  const half = idx.length / 2;
  [idx.slice(0, half), idx.slice(half)].forEach((part, j) => {
    s.addTable([head(["Policy", "Wave", "Purpose"]), ...part.map((r) => [k(r[0]), c(r[1], { align: "center" }), c(r[2])])],
      tableOpts([0.85, 0.6, 4.5], { x: 0.6 + j * 6.2, y: 1.45, fontSize: 10, rowH: 0.235, margin: [0.02, 0.06, 0.02, 0.06] }));
  });
  sources(s, "Source: Book 04, Chapter 07 and Appendix A. Every enforced policy excludes CA-Exclude-EmergencyAccess; CA002 is retired.");
}
{
  const s = D.content("Backup", "Sources: federal policy and standards");
  txt(s, "Source list", bullets([
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022.",
    "NIST SP 800-207, Zero Trust Architecture, August 2020 (§2.1 tenets, §3 logical components).",
    "NIST SP 800-53 Rev. 5, release 5.2.0 (AC-2, AC-2(2), AC-3, AC-5, AC-6 and enhancements, AC-17(4), AU-11, CA-7, CM-5, IA-2); SP 800-53B Moderate baseline.",
    "CISA Zero Trust Maturity Model v2.0, April 2023 (identity pillar).",
    "CISA BOD 25-01, Implementing Secure Practices for Cloud Services, December 17, 2024, and its Required Configurations list; SCuBA Microsoft Entra ID baseline.",
    "FedRAMP Rev. 5 controls (Access Control; Identification and Authentication; Assessment, Authorization, and Monitoring).",
    "FedRAMP 20x Key Security Indicators: Identity and Access Management; Change Management.",
    "Full footnotes with links and access dates: Book 04, every chapter (whalermike.github.io/modernization-workbook/docs/books/b04-access/).",
  ], 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}
{
  const s = D.content("Backup", "Sources: Microsoft Learn and tools");
  txt(s, "Source list", bullets([
    "Conditional Access: overview and licensing; build a policy; plan a deployment; users, groups and workload identities; target resources; conditions; grant; session; authentication strengths; network signals; device and app filters; authentication flows.",
    "Conditional Access: report-only and policy insights; Microsoft-managed policies; approved client app migration; continuous access evaluation; troubleshooting; SigninLogs and appliedConditionalAccessPolicy.",
    "Privileged access: emergency access accounts; privileged roles and permissions; least privileged roles by task; protected actions (overview; add, test or remove).",
    "PIM: overview; Entra role settings; approval workflow; assign roles; extend and renew; security alerts; email notifications; APIs; audit history; role access reviews; rules mapping and update rules in Graph.",
    "ID Governance: licensing fundamentals; entitlement management (overview, approval, lifecycle, separation of duties, external users); access reviews (create, complete, history, FAQ); Lifecycle Workflows (tasks, templates, conditions); guest lifecycle.",
    "Access as code: Tenant Governance configuration management (concepts, APIs, licensing, FAQ); recoverability; Entra data retention.",
    "Tools: HashiCorp terraform-provider-azuread v3.10.0; Microsoft365DSC 2.26.1015.1; Microsoft Entra Exporter v3.0.1.",
  ], 12.5), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

console.log(`narration: ${spokenWords} words, about ${(spokenWords / WPM).toFixed(1)} minutes at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
