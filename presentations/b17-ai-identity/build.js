// Book 17 — AI Identity Governance: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b17-ai-identity/build.js presentations/b17-ai-identity/B17_AI_Identity.pptx
// Every fact comes from a footnoted chapter of docs/books/b17-ai-identity/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 17", title: "AI Identity Governance" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B17_AI_Identity.pptx";

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
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h, size) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: size || 14, valign: "middle" });
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
// A tinted box to the right of a table, with an icon, a heading and a bullet list.
const tableBox = (s, prefix, iconName, color, tint, heading, list, h, size) => {
  box(s, `${prefix} box`, 7.75, 1.5, 5.0, h || 3.55, tint);
  icon(s, iconName, 8.0, 1.68, 0.6, color);
  txt(s, `${prefix} head`, heading, { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size || 13.5), { x: 8.0, y: 2.42, w: 4.6, h: (h || 3.55) - 1.0, paraSpaceAfter: 6 });
};
// A row of step boxes across the slide (numbered unless labels are given).
const steps = (s, prefix, list, tints, labels, labelColor, size) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: labelColor ? labelColor[i] : HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: size || 14, breakLine: !!f[1] } },
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
// Two tall tinted columns, each with an icon, a small label, a heading and a bullet list.
const columns = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Column ${i + 1}`, x, 1.5, 6.0, 3.6, c[3]);
  icon(s, c[0], x + 0.25, 1.68, 0.68, c[2]);
  txt(s, `Column head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: 1.66, w: 4.75, h: 0.75, valign: "middle" });
  txt(s, `Column text ${i + 1}`, bullets(c[5], size || 14), { x: x + 0.3, y: 2.6, w: 5.45, h: 2.4, paraSpaceAfter: 6 });
});
// Three tinted cards across the slide, each with an icon, a small label, a heading and a bullet list.
const cards3 = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `Card ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
  icon(s, c[0], x + 0.22, 1.66, 0.62, c[2]);
  txt(s, `Card head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 17, fontFace: "Cambria" } },
  ], { x: x + 1.0, y: 1.62, w: 2.85, h: 0.72, valign: "middle" });
  txt(s, `Card text ${i + 1}`, bullets(c[5], size || 13.5), { x: x + 0.25, y: 2.55, w: 3.5, h: 2.45, paraSpaceAfter: 6 });
});

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why AI needs identities", "Every AI System Needs an Identity", "Book 17 — AI Identity Governance");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing for Chief AI Officers, CIOs, CISOs, identity teams, ISSOs and authorizing officials", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 17 of the Federal Modernization Workbook, AI Identity Governance, the last book in the series. It's written for Chief AI Officers, C I Os and CISOs, identity and security operations teams, I S S Os, and authorizing officials.

I'll take four questions: why AI agents need identities and owners; what governing them involves; who owns AI identity; and how to scan the inventory and evidence AI systems for authorization.

The short version: an AI system that can act is an account with permissions. Most were deployed outside the identity program, and there's no separate AI authorization to fall back on.`,
  "Book 17, index; Chapter 01 — Why AI Agents Need Identities and Owners; Chapter 02 — What Federal AI Rules Require, and What They Don't (There is no AI-specific ATO).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why AI needs identities", "An agent that acts is an account");
  tag(s, "Why");
  rows(s, "Way", "FOUR WAYS AN AI SYSTEM REACHES AGENCY DATA", [
    ["For a user", "Delegated token: the user is the subject, the agent the actor"],
    ["As itself", "App-only token: policy targets the agent's own identity"],
    ["As its own user", "A user account, for a mailbox, a chat seat or a group"],
    ["With an API key", "Bypasses Entra ID token issuance; Conditional Access never applies"],
  ], 1.95, 0.8, 0.7, 14);
  sideBox(s, "Inv", "FaTableList", HEX.red, HEX.redTint, "THE 2025 FEDERAL AI INVENTORY", "Agentic AI: small, and growing", [
    "3,611 use cases, 445 of them high-impact (as of April 13, 2026)",
    "117 classified agentic; 38 of those in pilot or deployed",
    "M-25-21's definition of AI includes fully autonomous systems",
  ], 14.5);
  callout(s, "Acts", 5.35, 1.15, "FaUserShield", HEX.red, "Answering versus acting: ",
    "a chat assistant's draft reaches nothing until a person acts. An agent that sends mail, closes tickets or updates records signs in, holds permissions and acts on agency data itself.");
  sources(s, "Sources: OMB M-25-21 §5; OMB 2025 AI Use Case Inventory (README as of Apr. 13, 2026; data dictionary; use-case CSV); Microsoft Learn, Conditional Access for agents. Book 17, Chapter 01.");
  narrate(s,
`A chat assistant that drafts a memo is a tool. Nothing it does reaches a record until a person reads the draft and acts. An agent is different. It sends replies from a mailbox, closes tickets and updates case records. Each step is an action against agency data, taken by something that signed in and holds permissions. That makes an agent an identity.

An AI system that acts reaches data in one of four ways: on behalf of a signed-in user, as itself, as its own user account, or with an A P I key. The first three run through the identity provider. The fourth bypasses it entirely, so Conditional Access never applies and no sign-in is evaluated.

Today the agentic share is small. OMB's 2025 inventory holds 3,611 use cases, 445 of them high-impact. 117 are classified agentic, and 38 of those are in pilot or deployed. It's also the share that grows fastest.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners (opening; From answering to acting; Three ways in).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why AI needs identities", "AI arrived outside the identity program");
  tag(s, "Why");
  columns(s, [
    ["FaIdCard", "WHAT AN EMPLOYEE'S ACCOUNT HAS", HEX.navy, HEX.navyTint, "The identity pipeline", [
      "An owner of record, and a manager in HR",
      "An organizational placement that drives access",
      "A credential issued and protected under policy",
      "Reviews on a schedule, and a leaver process",
    ]],
    ["FaUserXmark", "WHAT AI FOUND OUTSIDE IT TYPICALLY LACKS", HEX.red, HEX.redTint, "Pilots, keys and features", [
      "Often only a project contact who has moved on",
      "Any placement beyond the team that set it up",
      "A secret in a configuration file, or a shared account",
      "Pilot permissions never reviewed; no end date",
    ]],
  ], 14);
  callout(s, "Shape", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "The risk is identity-shaped: ",
    "prompt injection against an agent produces an action under a legitimate identity, so the blast radius is the access it holds. AC-2, IA-4, IA-5, AC-6 and IA-9 already apply; the gap is coverage, not the catalog.");
  sources(s, "Sources: NIST AI 600-1 §2.9; NIST SP 800-53 Rev. 5 (AC-2, AC-6, IA-4, IA-5, IA-9), release 5.2.0; NIST AI 100-1 (GOVERN 1.6, 1.7, 2.1). Book 17, Chapter 01.");
  narrate(s,
`People join through a pipeline the identity program built, from an HR record to a leaver process. AI mostly came in another way. A mission office ran a pilot with a vendor. A developer put an A P I key in a configuration file. A product the agency already licensed shipped an assistant. None of those paths produces an owner of record, a placement, a governed credential or an end date.

The risk is identity-shaped. NIST's generative AI profile describes prompt injection, where planted input makes a system misbehave. Against an agent with broad permissions, a successful injection is an action, a message sent or a record changed, under a legitimate identity. The blast radius is the access it holds.

No new control family is needed. Account management, identifier and authenticator management, least privilege and service authentication already cover non-person accounts. The gap is coverage: the AI system's account is often missing from the account inventory the controls are tested against.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners (How AI arrived outside the identity program; Why the risk is identity-shaped; The controls already apply).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why AI needs identities", "What federal AI rules require, and don't");
  tag(s, "Why");
  const rules = [
    ["M-25-21 (Apr. 2025)", "Chief AI Officer; annual inventory; compliance plans; seven practices for high-impact AI"],
    ["M-25-22 (Apr. 2025)", "Acquisition: an ATO from an agency official before deployment"],
    ["M-26-04 (Dec. 2025)", "Unbiased AI principles for procured LLMs; sunsets Dec. 2027"],
    ["EO 14409 (June 2026)", "AI security: cyber defense of federal systems; CISA directives"],
    ["EO 14434 (Sept. 2026)", "Say “Super Intelligence” (SI) in non-statutory documents; definition unchanged"],
  ];
  s.addTable([head(["Instrument", "What it asks of agencies"]), ...rules.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([2.0, 4.9], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.62, 0.62, 0.62, 0.62, 0.62] }));
  tableBox(s, "Not", "FaScaleBalanced", HEX.red, HEX.redTint, "What the rules don't do", [
    "No AI-specific ATO: A-130 still applies",
    "No identity requirements in M-25-21",
    "No requirement to use the NIST AI RMF",
    "Use-case risk acceptance doesn't replace the ATO",
  ], 3.62);
  callout(s, "Two", 5.3, 1.2, "FaFileShield", HEX.red, "Two decisions, one record: ",
    "a high-impact use case needs M-25-21's signed risk acceptance and the system's authorization to operate before it deploys. Like the book, this deck keeps the term “AI”: the instruments it applies still use it.");
  sources(s, "Sources: EO 14179; OMB M-25-21 (§§3–4, footnotes 22 and 29); M-25-22 §4(e)(i); M-26-04; EO 14409; EO 14434 §§1–3; OMB memoranda list through M-26-19. Book 17, Chapter 02.");
  narrate(s,
`Federal AI policy was rewritten in 2025. OMB memo M twenty-five twenty-one governs use: a Chief AI Officer, an annual use-case inventory, compliance plans, and seven minimum practices for high-impact AI. Its companion, M twenty-five twenty-two, governs acquisition, and says AI operated as an information system must receive an authorization to operate before deployment.

What the rules don't do matters as much. There is no AI-specific authorization. Agencies must keep following Circular A-130 for AI systems, and the memo's own risk acceptance is separate from, and doesn't supersede, system authorization. It sets no identity requirements at all.

So a high-impact use case needs two decisions before it deploys: the signed risk acceptance on its impact assessment, and the system's authorization. One more note. Executive Order fourteen four thirty-four tells agencies to say Super Intelligence in non-statutory documents. The definition hasn't changed, and the book keeps the term AI, because the instruments it applies still use it.`,
  "Book 17, Chapter 02 — What Federal AI Rules Require, and What They Don't (The rule set in force; M-25-21: what it requires; What M-25-21 doesn't do; M-25-22: acquiring AI; The 2026 executive orders; There is no AI-specific ATO).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What governing AI identity involves", "The inventory is a seed list, not an identity source");
  tag(s, "What");
  cards3(s, [
    ["FaHashtag", "ANCHORS", HEX.teal, HEX.tealTint, "What a record keys on", [
      "id: stable, never reused",
      "agency_bureau: a placement",
      "development_stage: Retired is a leaver event",
    ]],
    ["FaFilter", "LEADS", HEX.amber, HEX.amberTint, "What must be checked", [
      "contact_email: may be a public inbox",
      "vendor_name and system_name_ato",
      "classification: Agentic AI can act",
    ]],
    ["FaPlugCircleXmark", "GAPS", HEX.red, HEX.redTint, "Not there at all", [
      "The principal it signs in as",
      "Its credential and its permissions",
      "The accountable owner and risk acceptor",
    ]],
  ], 13.5);
  callout(s, "Status", 5.3, 1.2, "FaClipboardCheck", HEX.navy, "Status, not evidence: ",
    "the 2025 inventory has a field for each of the seven practices, but each holds the agency's own answer. 101 of 227 deployed high-impact use cases answered none, and 1,115 of 3,611 rows name no contact.");
  sources(s, "Sources: OMB Guidance on 2025 Agency AI Reporting; 2025 inventory data dictionary and consolidated CSV (counts computed by the book's program); OMB M-25-21 §4(b). Book 17, Chapter 03.");
  narrate(s,
`The inventory is the only government-wide list of federal AI, so the program reads it as identity data. A few fields are anchors. The use-case ID is stable and never reused, so it can key a record. The bureau gives a placement. The stage is a lifecycle state, and Retired is a leaver event. Other fields are leads to check: the contact may be a public inbox, and the authorization field points to a boundary.

The facts that decide access aren't there at all: the principal the system signs in as, its credential, its permissions, and the person accountable.

The high-impact fields report status, not evidence. Each of the seven practices has a field, but each holds the agency's own answer. In the published file, 101 of 227 deployed high-impact use cases answered none of them. And a use case isn't an identity, so the program records the join on the directory side.`,
  "Book 17, Chapter 03 — The AI Use-Case Inventory as an Identity Source (What it records; Reading the fields as identity data; A use case isn't an identity; What the high-impact fields can and can't evidence).");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What governing AI identity involves", "Whose token does it present?");
  tag(s, "What");
  const pat = [
    ["For a user (delegated)", "The user; the agent is the actor", "User policies; a policy on the agent doesn't apply"],
    ["As itself (app-only)", "The agent identity", "Block is the only control"],
    ["As its own user account", "The agent's user account", "Agent-user policies (preview); “All users” excludes it"],
    ["With a stored API key", "No token from Entra ID", "None: a finding"],
  ];
  s.addTable([head(["How it acts", "Token subject", "Conditional Access"]), ...pat.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([2.1, 2.1, 2.7], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.78, 0.78, 0.78, 0.78] }));
  tableBox(s, "AgentID", "FaKey", HEX.navy, HEX.navyTint, "Microsoft Entra Agent ID", [
    "Blueprint: a template that holds the credentials",
    "Agent identity: a special service principal",
    "A sponsor is required for each identity and blueprint",
    "The blueprint is the credential boundary",
  ], 3.52);
  callout(s, "Most", 5.3, 1.2, "FaServer", HEX.navy, "Most AI still runs as ordinary workload identities: ",
    "service principals and managed identities, governed like any application. The new agent identity type governs only the agents that use it.");
  sources(s, "Sources: Microsoft Learn (Conditional Access for agents; Target agent identities; Agent 365 identity; Agent ID owners, sponsors and managers; Disable agent identities), Oct. 2026. Book 17, Chapter 04.");
  narrate(s,
`An AI system's kind of identity is decided by whose token it presents, not by the model it runs.

There are four answers. Acting for a signed-in user, the user is the token's subject and the agent is the actor, so the user's policies apply, and the agent can reach everything the user can. Acting as itself, the agent's own identity is the subject, and the only Conditional Access control is to block it. Acting as its own user account, it isn't covered by policies aimed at all users. And with a stored A P I key, Entra ID issues no token at all.

Microsoft Entra Agent ID adds identity types built for agents: a blueprint that holds the credentials, agent identities created from it, and a required human sponsor. It governs only agents that use it. Most AI still runs as ordinary service principals and managed identities, and the same governance applies to them.`,
  "Book 17, Chapter 04 — Kinds of AI Identity: Workloads, Agents and Delegated Access (opening; Workload identities; Agent identities: Microsoft Entra Agent ID; Delegated and autonomous access).");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What governing AI identity involves", "Release stage and government cloud, October 2026");
  tag(s, "What");
  const rel = [
    ["Agent ID platform: blueprints, agent identities, sponsors", "Generally available, April 2026", "GCC: a partial, documented subset"],
    ["Conditional Access for agent identities", "Agent targeting labeled preview; Block only", "GCC: listed for agents with delegated access"],
    ["Agent risk condition; ID Protection for agents", "Preview", "GCC: listed with Conditional Access"],
    ["Agent's user account", "Preview; Frontier program tenants only", "No government-cloud documentation"],
    ["Sponsor lifecycle workflows", "Generally available, May 2026", "GCC: available"],
    ["Purview audit and DLP, network controls for agents", "—", "GCC: not available"],
  ];
  s.addTable([head(["Capability", "Release stage", "Government cloud"]), ...rel.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([2.6, 2.1, 2.2], { y: 1.5, fontSize: 11.5, rowH: [0.38, 0.53, 0.53, 0.53, 0.53, 0.53, 0.53] }));
  tableBox(s, "High", "FaCloud", HEX.red, HEX.redTint, "GCC High and DoD", [
    "No published availability for agent identities",
    "No Agent ID entries on Entra's Azure Government list",
    "Treat them as unavailable until Microsoft confirms in writing",
    "Meanwhile, govern AI as workload identities",
  ], 3.56, 13);
  callout(s, "Pend", 5.3, 1.2, "FaLandmark", HEX.amber, "Authorization is pending: ",
    "Microsoft states that as of October 1, 2026 Agent 365 meets all FedRAMP High controls its assessor reviewed, with final authorization pending. The program builds on what is generally available in the agency's cloud; preview features are watch items.");
  sources(s, "Sources: Microsoft Learn (Entra releases and announcements, Apr. and May 2026; Agent 365 service description; Entra feature availability, US Government; Conditional Access targeting; ID Protection for agents; Agent 365 CLI for US Government), Oct. 2026. Book 17, Chapters 04–06.");
  narrate(s,
`The agency's cloud decides what it can use, so the book dates every product statement to October 2026. Microsoft announced the Agent ID platform, with blueprints, agent identities and sponsors, as generally available in April 2026, and sponsor lifecycle workflows in May. Several controls are still preview. The policy builder labels agent targeting in Conditional Access as preview, agent identities support only Block, the agent risk condition is preview, and agents' user accounts are limited to Frontier program tenants.

GCC has a partial, documented subset: identity and access governance for agents, but not Microsoft's audit, data loss prevention or network controls. GCC High and D O D have no published availability, so treat agent identities as unavailable there until Microsoft confirms otherwise in writing, and govern AI as workload identities. And Agent 365's FedRAMP High authorization is still pending. The program builds on what is generally available in the agency's own cloud, and keeps preview features as watch items.`,
  "Book 17, Chapter 04 (Release stage, licensing and government clouds; Note for readers of Book 04); Chapter 05 (Release stage and government-cloud availability); Chapter 06 (Status note: Book 04's preview statement still holds; Release stage and government-cloud availability).");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What governing AI identity involves", "A named human, and a lifecycle that ends");
  tag(s, "What");
  rows(s, "Life", "THE AI IDENTITY LIFECYCLE (PROGRAM DESIGN)", [
    ["Create", "From an approved inventory entry; sponsors and owner set"],
    ["Sponsor leaves", "HR event; transfer confirmed within ten business days"],
    ["Recertify", "Access packages expire; the sponsor extends or lets lapse"],
    ["Retire", "Disable, record, then delete; 30-day restore window"],
    ["Orphaned", "Disabled once confirmed; 30 days to name a sponsor or retire"],
  ], 1.95, 0.66, 0.58, 13.5);
  sideBox(s, "Who", "FaUserCheck", HEX.teal, HEX.tealTint, "WHO ANSWERS FOR IT", "Two named humans and a record", [
    "Sponsor: a federal employee mastered in HR",
    "A second sponsor: a small dynamic group of stewards",
    "Technical owner holds the credentials; never the sponsor",
    "Administrators sponsor nothing",
  ], 14);
  callout(s, "Exp", 5.35, 1.15, "FaUserClock", HEX.teal, "Expiry is the review: ",
    "a sponsor who ignores an agent's expiry removes its access, the reverse of a human review left undone. A transfer to the departing sponsor's manager names a human; only confirmation makes them accountable.");
  sources(s, "Sources: Microsoft Learn (Agent ID owners, sponsors and managers; access packages for agent identities; agent sponsor tasks and Lifecycle Workflows templates; agent identity deletion; Agent ID best practices), Oct. 2026. Book 17, Chapter 05.");
  narrate(s,
`An agent has no hire date and no separation date, so its lifecycle has to hang from a person who does. Agent ID separates the owner, who manages credentials, from the sponsor, who is accountable for purpose and lifecycle and can switch an agent off but not back on.

Left to defaults, the sponsor is whoever built the agent. The program decides instead: the sponsor is a federal employee mastered in HR, a small dynamic group of stewards is the second sponsor, and the technical owner is never the sponsor.

The lifecycle follows that person. When the sponsor moves or leaves, the HR event triggers a transfer, and the new sponsor has ten business days to confirm the agent is still needed. Access comes through packages with end dates, so expiry is the review: a sponsor who does nothing removes the access. Retirement is disable first, then delete. Once an orphaned agent is confirmed, a person disables it, never an automatic rule, and its office has thirty days to name a sponsor or retire it.`,
  "Book 17, Chapter 05 — Owners, Sponsors and the AI Identity Lifecycle (Three accountable relationships; The program's rule: two named humans and a record; The lifecycle, event by event; Recertification: expiry is the review; Retirement; The orphaned agent).");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What governing AI identity involves", "No stored secrets, no standing privilege");
  tag(s, "What");
  steps(s, "Cred", [["Managed identity", "Federated to the blueprint, on Azure"], ["Federation", "From the agent's own platform"], ["Certificate", "Key in a vault or HSM"], ["Client secret", "Development and test only"]],
    [HEX.tealTint, HEX.tealTint, HEX.amberTint, HEX.redTint], ["1st", "2nd", "3rd", "Last"], [HEX.teal, HEX.teal, HEX.amber, HEX.red]);
  panels(s, [
    ["FaUserShield", "No standing privileged role", HEX.navy, HEX.navyTint, ["Microsoft's block list is a floor, not least privilege", "Exchange and SharePoint Administrator stay assignable", "Privileged access: delegated, or time-bound"]],
    ["FaFilter", "Bound what an agent can call", HEX.teal, HEX.tealTint, ["Identity: what it can get a token for", "Tool registry: approved, consented tools only", "Data: in GCC, scoped permissions are the boundary"]],
  ]);
  callout(s, "Block", 5.25, 1.25, "FaLock", HEX.navy, "Conditional Access can only block an agent identity: ",
    "an agent can't do multifactor authentication, so what it may do is decided in advance. The program builds a block-unless-approved policy and keeps it in report-only mode while agent targeting is preview.");
  sources(s, "Sources: Microsoft Learn (Agent 365 identity; Create an agent identity blueprint; Agent ID best practices; Authorization in Agent ID; Conditional Access for agents; Secure autonomous agents); NIST SP 800-53 Rev. 5 AC-6. Book 17, Chapter 06.");
  narrate(s,
`An agent can't be asked for a second factor, so everything it may do is decided in advance. Start with the credential. In Agent ID it lives on the blueprint and is shared by every agent created from it, so the blueprint is the credential boundary. The order is settled: a managed identity federated to the blueprint where the agent runs on Azure, workload identity federation from its own platform elsewhere, a certificate in a vault only where neither applies, and a client secret only for development and test.

Then privilege. Microsoft blocks agents from Global Administrator, but still allows Exchange and SharePoint Administrator. That's a floor, not least privilege, so the program's rule is that no AI identity holds a standing privileged role.

Last, an agent's reach is bounded by its tokens, its approved tools, and data protection. In GCC, Purview's agent controls aren't available, so scoped permissions are the data boundary.`,
  "Book 17, Chapter 06 — Credentials, Least Privilege and Access Policy for AI (No stored secrets; What Microsoft blocks, and what it doesn't; Conditional Access and risk policies; Privileged roles for AI: none standing; Tool and data access boundaries).");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What governing AI identity involves", "Watch it, find what nobody declared, raise findings");
  tag(s, "What");
  rows(s, "Surf", "SHADOW AI SHOWS UP ON FOUR SURFACES", [
    ["People", "Generative AI services in use: app and network discovery"],
    ["Consent", "Apps holding granted access: consent inventory"],
    ["Agents", "Local and network-visible agents: endpoint discovery"],
    ["Workloads", "AI built in agency clouds: cloud posture discovery"],
  ], 1.95, 0.8, 0.7, 14);
  sideBox(s, "P1", "FaTriangleExclamation", HEX.red, HEX.redTint, "HIGH-PRIORITY FINDINGS", "Halt, alert, a person decides", [
    "An agentic AI system with no governed identity",
    "A shadow AI identity acting with credentials",
    "A credential or permission added outside the pipeline",
    "None is ever fixed automatically",
  ], 14);
  callout(s, "Keys", 5.35, 1.15, "FaPlugCircleXmark", HEX.red, "API keys are invisible to identity monitoring: ",
    "no sign-in, no risk detection, no Conditional Access decision. A finding closes only when a later observation shows the fixed state; a ticket marked resolved closes nothing.");
  sources(s, "Sources: OMB M-25-21 §4(b)(iii); Microsoft Learn (Agent ID logs; ID Protection for agents; Defender for Cloud Apps; Global Secure Access; Defender for Endpoint), Oct. 2026; Book 13 drift model. Book 17, Chapter 07.");
  narrate(s,
`Every AI identity drifts once it exists: a sponsor changes jobs, a developer adds a secret, an agent gets a new tool. M twenty-five twenty-one asks monitoring of high-impact AI to detect changes to a system after deployment, and the identity logs are where those changes land first.

So the program collects every AI identity's sign-ins, audit events and risk signals, and ties each one to its identity record, because nothing in a service principal's sign-in says it's AI. Discovery is a standing input. Shadow AI shows up in four places: services people use, apps holding consented access, agents on endpoints, and AI built in the agency's own clouds. Anything found without a record is a finding.

An agentic AI system with no governed identity is the finding this book exists to prevent. It's high priority: it halts, alerts a named person, and is never fixed automatically. And A P I keys stay invisible to all of it.`,
  "Book 17, Chapter 07 — Monitoring, Drift and Shadow AI (What policy asks monitoring to do; Watching the identities you know; Finding what nobody declared; The findings; From finding to evidence).");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns AI identity", "Two decision tracks, one identity record");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "The AI use-case track", HEX.amber, HEX.amberTint, [["Chief AI Officer", "Inventory, high-impact, waivers"], ["Use-case risk acceptor", "Signs the impact assessment"], ["CIO", "Shadow AI that belongs to no system"]]],
    ["FaFileShield", "The authorization track", HEX.navy, HEX.navyTint, [["Authorizing official", "Alone accepts residual system risk"], ["System owner and ISSO", "Owns the AI and what it may reach"], ["CISO", "Control requirements for AI identities"]]],
    ["FaUsersGear", "The identity itself", HEX.teal, HEX.tealTint, [["Sponsor", "Agency employee; decides it should exist"], ["Technical owner", "Keeps it running; may be a contractor"], ["Identity governance officer", "Consent, transfers and orphans"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THE SEPARATIONS THAT KEEP AI DECISIONS HONEST", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Two signatures stay two", "a use-case risk acceptance isn't an authorization, and an authorization isn't a risk acceptance", HEX.navy],
    ["The builder doesn't sponsor", "at publication, sponsorship moves to the program that relies on the agent", HEX.amber],
    ["Government decides", "contractors build and operate; government officials sponsor, authorize and accept risk", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: OMB M-25-21 §3(a), §3(b)(i), footnotes 22 and 29; M-25-22 §4(e)(i); M-26-10; NIST SP 800-37 Rev. 2, Appendix D; NIST AI 100-1 GOVERN 2.1; Microsoft Learn, Agent ID sponsors. Book 17, Chapter 08.");
  narrate(s,
`Ask who owns an AI agent's identity and three offices answer at once. The way out is to separate the decisions and give each one a single decider.

AI adds one new executive and one new kind of decision. The Chief AI Officer owns the inventory, high-impact determinations and waivers, and can't delegate the waiver authority. The official accountable for the mission signs the use-case risk acceptance. Neither authorizes the system. The authorizing official alone accepts its residual security and privacy risk, and the system owner owns the AI system and decides what its identities may reach.

For the identity itself, the sponsor, an agency employee, decides whether the agent should exist; the technical owner, who may be a contractor, keeps it running; and the identity governance officer decides consent, transfers and orphans. Two signatures stay two, even when one person holds both roles.`,
  "Book 17, Chapter 08 — Who Owns AI Identity Governance (Where the roles come from; The roles; Who must be a government official; The responsibility matrix; Keeping the roles apart).");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to scan and evidence it", "Run the inventory scan");
  tag(s, "How");
  steps(s, "Scan", [["Load one vintage", "Record what's missing"], ["Detect", "Answers, then the directory"], ["Prioritize", "Agentic AI first"], ["Report", "One row per system and finding"], ["Remediate", "Close only on observation"]],
    [HEX.grey, HEX.amberTint, HEX.amberTint, HEX.navyTint, HEX.tealTint]);
  panels(s, [
    ["FaTableList", "In the published 2025 file", HEX.amber, HEX.amberTint, ["1,480 live use cases with a stage recorded", "799 (54%) give no ATO answer; 488 name no contact", "1,064 (72%) trip at least one check"]],
    ["FaSitemap", "What only the agency can see", HEX.navy, HEX.navyTint, ["The identity behind each use case, and its sponsor", "Identities with no inventory row: shadow AI", "Retired use cases whose identities still hold access"]],
  ]);
  callout(s, "Central", 5.25, 1.25, "FaGlobe", HEX.amber, "A central scan can start the conversation, not finish it: ",
    "run once over the public inventory, it sees answers, not credentials. The counts are answers to reconcile, not findings against any agency, and a use case isn't a system.");
  sources(s, "Sources: OMB M-25-21 §3(b)(v); OMB 2025 reporting guidance; 2025 consolidated inventory CSV (counts computed by the book's program, Oct. 21, 2026); CISA CDM program and dashboards. Book 17, Chapter 09.");
  narrate(s,
`The inventory scan is the program's method, not a federal requirement, and it's cheap because it reads answers agencies already gave. Load one vintage and record what's missing. Detect gaps, from the answers and then the directory. Put agentic systems first. Report one row per finding, routed to a named role. And close a finding only on a later observation.

The scale is real. Of the 1,480 use cases recorded as piloted or deployed in the published 2025 file, 799 give no authorization answer and 488 have no contact; 72 percent trip at least one check. These are answers to reconcile, not findings against agencies.

The checks that matter most need the directory, so only the agency can run them: no identity record, no accountable sponsor, an identity with no inventory row, and a retired use case whose identities still hold access. A central scan of the public file could start that conversation, but it can't see a credential.`,
  "Book 17, Chapter 09 — Running the Inventory Scan, Agency and Central (Steps 1 to 5; What the checks find in the published 2025 file; The central model; What a central scan can't close).");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to scan and evidence it", "Evidence the authorizing official can use");
  tag(s, "How");
  const ev = [
    ["Owner", "Sponsor and technical owner; joined to the inventory", "AC-2, CM-8(4), IA-4"],
    ["Credentials", "Credential type per identity; no stored secrets", "IA-5, IA-9"],
    ["Permissions", "Grants and roles, each with an approval", "AC-6, AC-6(7), AC-3"],
    ["Monitoring", "Log coverage, detections, open findings", "AU-6, AU-12, CA-7"],
    ["Lifecycle", "Expiry dates; leaver evidence on retirement", "AC-2, AC-2(3)"],
  ];
  s.addTable([head(["Area", "Evidence in the package", "Controls"]), ...ev.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { color: HEX.teal } }])],
    tableOpts([1.4, 3.6, 1.9], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.62, 0.62, 0.62, 0.62, 0.62] }));
  tableBox(s, "Tailor", "FaClipboardCheck", HEX.amber, HEX.amberTint, "Tailor the baseline now", [
    "Add IA-9: it's in no NIST baseline and no FedRAMP class",
    "Evidence three practices from identity: monitoring, training, fail-safe",
    "Carry AI identity in OSCAL 1.2.3",
    "NIST's AI overlays: no public draft yet",
  ], 3.62, 13);
  callout(s, "Where", 5.3, 1.2, "FaRoute", HEX.amber, "Where the AI sits decides which package carries it: ",
    "inside an authorized system it's a new component and a change review; on its own, a new package; on a provider's certified service, the agency still governs the identities and grants in its own tenant.");
  sources(s, "Sources: OMB M-25-21; M-25-22 §4(e)(i); NIST SP 800-37 Rev. 2 (P-18, R-4, M-7); SP 800-53 Rev. 5 and SP 800-53B, release 5.2.0; FedRAMP 2026 control reference; OSCAL v1.2.3; NIST COSIS project page. Book 17, Chapter 10.");
  narrate(s,
`Everything ends in the authorization package. It has to answer five questions about each AI system's identity: who owns it, how it authenticates, what it can reach, who's watching it, and when its access ends. Each has an artifact and controls behind it.

Two points stand out. First, service identification and authentication, control I A nine, describes an AI system calling a tool with its own identity, and it's in no NIST baseline and no FedRAMP class. So the program tailors it in. Second, three of the seven high-impact practices can be evidenced by the identity program: monitoring from the system's own logs, training checked against the operators' group, and a fail-safe that's a tested disable.

The package can be machine-readable in OSCAL, with no AI-specific structures needed. NIST's overlays for AI systems, renamed under the new executive order, have no public draft yet. So tailor the baseline now, and compare when they're final.`,
  "Book 17, Chapter 10 — Evidence and Authorization for AI Systems (There is no AI-specific authorization to operate; Where the AI sits decides which package carries it; The evidence an authorizing official needs; The high-impact practices as evidence; Carrying AI identity in OSCAL; NIST's SP 800-53 overlays for AI systems).");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to scan and evidence it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaHashtag", "Count identities, not projects", "Every live inventory entry links to an identity record, made before any credential", HEX.red, HEX.redTint],
    ["FaUserCheck", "Put a person's name on every one", "An agency employee as sponsor; HR events reach the agent", HEX.navy, HEX.navyTint],
    ["FaKey", "No stored secrets, no standing privilege", "Federation first; block-unless-approved, in report-only", HEX.teal, HEX.tealTint],
    ["FaFileShield", "Authorize through the existing process", "Two signatures for high-impact AI; IA-9 tailored in", HEX.amber, HEX.amberTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaListCheck", HEX.navy, "Next step, with tools the agency already has: ",
    "run the inventory-answer checks on the agency's own submission, start with agentic systems and missing authorizations, and confirm each agent capability for the agency's own cloud before planning on it.");
  sources(s, "Sources: OMB M-25-21; M-25-22 §4(e)(i); Microsoft Learn (Agent ID; Agent 365 service description), Oct. 2026. Book 17, Chapters 01, 04, 05, 06, 08, 09 and 10.");
  narrate(s,
`So, four decisions.

Count AI identities, not AI projects. No use case is recorded as piloted or deployed without a link to its identity record, created before any credential is issued.

Put a person's name on every one: an agency employee as sponsor, with HR's mover and leaver events reaching the agent.

Take away stored secrets and standing privilege: federated credentials first, no standing privileged roles, and a block-unless-approved policy kept in report-only mode while agent targeting is preview.

And authorize AI through the process you already run: two signatures for high-impact AI, with I A nine tailored in.

The next step needs no new tooling. Run the inventory checks on the agency's own submission, start with agentic systems and missing authorizations, and confirm each agent capability for your own cloud before planning on it.

Every AI system needs an identity and an owner. Book 17 has the detail, every claim footnoted. Thank you.`,
  "Book 17, Chapters 01 (What leadership should take from this), 04 (Release stage, licensing and government clouds), 05 (The program's rule), 06 (Privileged roles for AI: none standing; Conditional Access and risk policies), 08 (The responsibility matrix), 09 (Step 5: remediate; The four tiers) and 10 (What the authorizing official should find); index.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "OMB: M-25-21 and M-25-22 (April 3, 2025); M-26-04 (December 11, 2025); M-26-10 (March 31, 2026); memoranda list through M-26-19; Guidance on 2025 Agency AI Reporting; 2025 Federal Agency AI Use Case Inventory (README as of April 13, 2026, data dictionary, consolidated CSVs) and the 2024 inventory; Circular A-130, Appendix I.",
    "Executive Orders 14179 (January 23, 2025), 14319 (July 23, 2025), 14409 (June 2, 2026) and 14434 (September 29, 2026).  ·  FISMA, 44 U.S.C. § 3554(b)(5).",
    "NIST: AI 100-1, AI RMF 1.0 (January 2023); AI 600-1, Generative AI Profile (July 26, 2024); SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-37 Rev. 2; SP 800-53 control overlays project (COSAiS, renamed COSIS on October 20, 2026); OSCAL v1.2.3 (August 7, 2026).",
    "CISA: Careful Adoption of Agentic AI Services (May 1, 2026); Deploying AI Systems Securely (April 15, 2024); BOD 23-01; BOD 25-01 required configurations; SCuBA Entra ID baseline and ScubaGear v1.8.0; CDM program and dashboards.  ·  FedRAMP: AI Prioritization Initiative; 2026 Rev5 control reference.",
    "Microsoft Learn: Entra Agent ID (overview, agent identities, blueprints, owners, sponsors and managers, agent users, authorization, best practices, deletion, logs, FAQ); Conditional Access and ID Protection for agents and workload identities; Lifecycle Workflows sponsor tasks; access packages for agents; Entra releases and announcements; Entra feature availability for US Government; Agent 365 service description, identity and US Government CLI; Defender for Cloud Apps, Defender for Endpoint, Global Secure Access, Defender for Cloud.",
    "Other vendors and specifications, as examples only: Amazon Bedrock AgentCore Identity and AWS GovCloud (US); Google Cloud agent identity; Model Context Protocol authorization specification (2026-07-28).",
    "Full footnotes with links and access dates (October 21–22, 2026): Book 17, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b17-ai-identity/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
