// Book 17 — AI Identity Governance: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: CIO, CISO, Chief AI Officer, authorizing officials, privacy officer and sponsors. Decision-centered:
// every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B17_AI_Identity_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b17-ai-identity/, named in the notes. The governance
// model (sponsors, severities, the scan, IA-9 tailoring) is the book's program design and is labeled as such;
// product release stages and cloud availability are dated observations (October 21–22, 2026).
// Diagrams are the committed PNGs in docs/images/diagrams/b17-ai-identity/png/; alt text is read from the
// chapters' fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 17", title: "AI Identity Governance",
  footer: "Federal Modernization Workbook  ·  Book 17 AI Identity Governance  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B17_AI_Identity_Executive.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's notes are edited. The "Workbook:" line isn't spoken.
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

// ---------------------------------------------------------------- checks
// Slide titles stay at or under 58 characters, and each narrated title must match narration.json.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// A conservative text-fit estimate (Calibri at about 0.55 em per character), used to size the panels and to
// print a "!" warning at build time when text may overflow its box.
const lineH = (pt) => (pt / 72) * 1.2;
const linesFor = (chars, w, pt) => Math.max(1, Math.ceil((chars * 0.55 * pt / 72) / Math.max(0.3, w)));
const needFor = (paras, w, pa) => paras.reduce((h, p) => h + linesFor(p.chars, w - (p.bullet ? 0.3 : 0.05), p.size) * lineH(p.size) + (pa || 0) / 72, 0);
const parasOf = (t, size) => {
  if (typeof t === "string") return [{ chars: t.length, size, bullet: false }];
  const out = []; let cur = { chars: 0, size: 0, bullet: false };
  t.forEach((r) => {
    const o = r.options || {}; const sz = o.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / Math.max(cur.size, sz)); cur.bullet = cur.bullet || !!o.bullet;
    if (o.breakLine || o.bullet) { out.push(cur); cur = { chars: 0, size: 0, bullet: false }; }
  });
  if (cur.chars) out.push(cur);
  return out.map((p) => Object.assign(p, { size: p.size || size }));
};
const T = (s, name, t, o) => {
  const need = needFor(parasOf(t, o.fontSize || 14), o.w, o.paraSpaceAfter);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name}: text may overflow (needs ${need.toFixed(2)} in, has ${o.h.toFixed(2)})`);
  return txt(s, name, t, o);
};
const sources = (s, text) => {
  if (text.length > 170) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- diagrams
// The committed PNG, scaled to fit (maxW x maxH), centered in its area; alt text from the chapter's fig-alt.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b17-ai-identity");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b17-ai-identity", "png");
const CHAPTERS = fs.readdirSync(BOOK).filter((f) => /^\d\d-.*\.md$/.test(f)).map((f) => fs.readFileSync(path.join(BOOK, f), "utf8")).join("\n");
const altFor = (name) => {
  const m = CHAPTERS.match(new RegExp(`svg/${name}\\.svg\\)\\{[^}]*fig-alt="([^"]+)"`));
  if (!m) throw new Error(`no fig-alt found in the chapters for ${name}`);
  return m[1];
};
const figure = (s, name, x, maxW, maxH, top) => {
  const file = path.join(PNG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  const H = maxH || 3.6, y0 = top || 1.5;
  let w = maxW, h = maxW / ar;
  if (h > H) { h = H; w = H * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y: y0 + (H - h) / 2, w, h, altText: altFor(name) });
  return { w, h };
};

// ---------------------------------------------------------------- layout helpers
// The decision bar: every decision slide states the decision, its owner and when it's needed.
const decision = (s, what, owner, when) => {
  const y = 5.3, h = 1.2;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.25, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => T(s, name, [
    { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
    { text, options: { fontSize: 14, color: HEX.ink } },
  ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  col("Decision", 1.75, 6.55, "DECISION", what, HEX.amber);
  col("Owner", 8.5, 2.1, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "WHEN", when, HEX.navy);
};
// The bottom callout for a context slide (no decision on it), the same size and place as the decision bar.
const takeaway = (s, iconName, color, label, text) => D.callout(s, "Takeaway", 5.3, 1.2, iconName, color, label, text);
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: 13.5, valign: "middle" });
  });
};
// A tinted box with an icon, a heading and a bullet list, sized to its content (default x 7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, o = {}) => {
  const x = o.x || 7.75, w = o.w || 5.0, size = o.size || 13.5, y = o.y || 1.5;
  const listNeed = needFor(parasOf(bullets(list, size), size), w - 0.45, 6);
  const h = Math.max(o.minH || 0, Math.round((0.92 + listNeed + 0.2) * 100) / 100);
  if (y + h > 5.12) console.warn(`  ! slide ${pres.slides.length} ${prefix} box runs past the decision bar (bottom ${(y + h).toFixed(2)} in)`);
  box(s, `${prefix} box`, x, y, w, h, tint);
  icon(s, iconName, x + 0.25, y + 0.16, 0.6, color);
  T(s, `${prefix} head`, heading, { x: x + 1.0, y: y + 0.16, w: w - 1.15, h: 0.6, bold: true, color, fontSize: 16.5, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size), { x: x + 0.25, y: y + 0.92, w: w - 0.45, h: listNeed + 0.1, paraSpaceAfter: 6 });
  return h;
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  return s.addTable([head(header), ...body], tableOpts(colW, { y: 1.5, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why AI needs identities", S_WHAT = "What the rules and the model require",
  S_WHO = "Who owns AI identity", S_HOW = "How to scan and evidence it";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "AI Identity Governance: the executive briefing", "Book 17 — AI Identity Governance  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CIO, CISO, Chief AI Officer, authorizing officials, privacy officer and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 17 of the Federal Modernization Workbook, AI Identity Governance, the last book in the series. It runs about thirty minutes, for the people who make the calls: the CIO, the CISO, the Chief AI Officer, the authorizing officials, the privacy officer and the program's sponsors.

The argument fits in three sentences. An AI system that can act, not just answer, is an account: it signs in, holds permissions and touches agency records. Most AI arrived outside the identity program, with no owner of record, no credential lifecycle and no leaver process. And there is no AI-specific authorization to operate, so AI identities have to be inside the boundary the authorizing official already reviews.

I'll take four questions: why AI agents need identities and owners; what the federal rules require, and what governing an AI identity involves; who owns it; and how to scan the inventory and evidence AI systems for authorization.

Two labels run through the deck, as they do through the book. The governance model is program design, built on controls agencies already have to meet, not a new federal requirement. And every product statement is a dated observation, as of October 21 and 22, 2026.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 17, index; Chapter 01 — Why AI Agents Need Identities and Owners; Chapter 02 — What Federal AI Rules Require, and What They Don't (Honest limits).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "An agent that acts is an account");
  tag(s, "Why");
  figure(s, "ch01-three-ways-in", 0.6, 6.8);
  sideBox(s, "Inventory", "FaHashtag", HEX.navy, HEX.navyTint, "The 2025 inventory, April 13, 2026", [
    "3,611 use cases; 445 of them high-impact",
    "117 classified agentic; 38 in pilot or deployed",
    "Self-reported, and use cases aren't systems",
    "No field for the account, credential or owner",
  ]);
  takeaway(s, "FaUserCheck", HEX.red, "Count AI identities, not AI projects.  ",
    "The risk question isn't how many use cases exist; it's which accounts each one runs as, and what those accounts can reach.");
  sources(s, "Sources: OMB M-25-21 §5; OMB 2025 AI Use Case Inventory (as of April 13, 2026); Microsoft Learn — Conditional Access for agents. Book 17, Chapters 01 and 03.");
  narrate(s,
`Start with answering versus acting. A chat assistant that drafts a memo is a tool: nothing reaches a record until a person reads the draft and sends it. An agent reads a mailbox, sends the replies, closes a ticket, updates a case field and calls another tool. Each step is an action against agency data, taken by something that signed in and holds permissions. That makes it an identity.

Federal policy already treats autonomy as part of AI. M-25-21's definition includes fully, partially and non-autonomous systems, and OMB's 2025 inventory has an Agentic AI class: systems that perform tasks or make decisions autonomously with minimal human intervention.

The consolidated 2025 inventory, as of April 13, 2026, holds 3,611 individually reported use cases, 445 of them high-impact. 117 are classified agentic, and 38 of those are in pilot or deployed. That's small, self-reported and counted in use cases, not systems: a direction, not a measurement. But it's the share with the most direct identity consequence.

The figure shows the ways in. On behalf of a signed-in user, the user is the token's subject and the agent is the actor. As itself, the agent's own identity is the subject. Both run through the identity provider, where Conditional Access, risk detection and sign-in logs apply. An API key or stored secret bypasses token issuance entirely: no sign-in is evaluated, and the only record of the call is whatever the service keeps.

So the first habit to change, from Chapter 01: count AI identities, not AI projects.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners (From answering to acting; Three ways in; What leadership should take from this); Chapter 03 — The AI Use-Case Inventory as an Identity Source (What the inventory is).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "AI arrived outside the identity program");
  tag(s, "Why");
  rows(s, "Lacks", "WHAT AN AI SYSTEM FOUND OUTSIDE THE PROGRAM TYPICALLY LACKS", [
    ["Owner", "A project contact who has moved on"],
    ["Placement", "Nothing beyond the team that set it up"],
    ["Credential", "A secret in a file, or a shared account"],
    ["Access", "Granted once for a pilot, never reviewed"],
    ["Monitoring", "Looks like the app or user it runs as"],
    ["Leaver", "No end date; outlives its project"],
  ], 1.88, 0.53, 0.46);
  sideBox(s, "Risk", "FaTriangleExclamation", HEX.red, HEX.redTint, "The risk is identity-shaped", [
    "A planted prompt makes an agent act, not just answer badly",
    "The blast radius is the access its identity holds",
    "CISA joint guidance on agentic AI, May 1, 2026",
    "EO 14409 names AI agents used to reach data unlawfully",
  ]);
  decision(s, "Treat an agentic AI system with no governed identity as a high-priority finding: it halts, alerts a named person and is never fixed automatically (program design)",
    "System owner and ISSO; the AO informed", "As soon as it's found");
  sources(s, "Sources: NIST AI 600-1 §2.9; CISA, Careful Adoption of Agentic AI Services (May 1, 2026); EO 14409 §4; OMB 2025 inventory guidance. Book 17, Chapters 01 and 07.");
  narrate(s,
`People join an agency through a pipeline the identity program built: an HR record, an account, access derived from the position, scheduled reviews and a leaver process. AI mostly came another way: a mission office's pilot with a vendor, an API key in a configuration file, an assistant shipped inside software the agency already licensed, an agent built in a low-code tool with a service account reading a shared mailbox. None of those paths produces what the identity program requires, so in the program's experience the AI system typically lacks all six things on the left.

The risk is identity-shaped. NIST's Generative AI Profile describes indirect prompt injection: input planted in data the system is likely to retrieve. Against a system that only answers, it produces a bad answer. Against an agent with broad permissions, it produces an action under a legitimate identity that the logs will show doing exactly what it was allowed to do. The blast radius is the access the identity holds. CISA's May 2026 joint guidance on agentic AI and Executive Order 14409 both name the threat.

The decision comes from Chapter 07. An agentic AI system with no governed identity is the program's highest-priority finding: it halts, alerts a named person and is never fixed automatically, because the right answer might be to issue an identity, disable an unwanted agent, or correct an inventory entry that misclassified a chatbot. The system owner and ISSO act, and the authorizing official is informed.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners (How AI arrived outside the identity program; Why the risk is identity-shaped); Chapter 07 — Monitoring, Drift and Shadow AI (The findings: an agentic AI system with no governed identity).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "The controls already apply; coverage is the gap");
  tag(s, "Why");
  figure(s, "ch01-what-every-ai-identity-needs", 0.6, 6.9);
  sideBox(s, "Catalog", "FaBook", HEX.navy, HEX.navyTint, "Already in SP 800-53", [
    "AC-2 names system and service accounts",
    "IA-4, IA-5: identifiers and authenticators for services",
    "AC-6: least privilege for processes, too",
    "IA-9: services authenticate before they talk",
    "AI RMF Govern: inventory, decommission, roles",
  ], { x: 7.75, w: 5.0 });
  takeaway(s, "FaListCheck", HEX.navy, "The gap isn't in the catalog; it's in coverage.  ",
    "The AI system's account is often simply missing from the account inventory the controls are tested against.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-2, AC-6, IA-4, IA-5, IA-9), release 5.2.0; NIST AI 100-1, GOVERN 1.6, 1.7 and 2.1. Book 17, Chapter 01.");
  narrate(s,
`None of this needs a new control family. SP 800-53 already speaks to non-person accounts. AC-2 requires defining account types, assigning account managers, approving creation, monitoring use and acting when accounts are no longer needed, and its discussion lists system and service accounts. IA-4 and IA-5 cover identifiers and authenticators for a service. AC-6 applies least privilege to processes acting on behalf of users. And IA-9 requires services to be identified and authenticated before they communicate.

NIST's AI Risk Management Framework agrees from the AI side: its Govern function asks for mechanisms to inventory AI systems, processes to decommission them safely, and documented roles. An AI system with no owner, no recorded access and no end of life fails all three, and it fails AC-2 and IA-5 in the system it runs in.

So the gap is coverage, not the catalog: the AI system's account is often missing from the account inventory the controls are tested against.

The book's answer is seven things every AI identity needs, shown in the figure: an identity record joined to its inventory entry; an accountable owner who can be found in HR records; an organizational placement; credentials without stored secrets; monitoring and drift detection; a lifecycle that ends, with an end date set at creation; and evidence the authorizing official can use. This is program design. No federal rule today requires an AI identity record or a sponsor, and an analytic model that holds no access can simply say so in its record.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners (The controls already apply; What every AI identity needs; Honest limits).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "What federal AI rules require, and what they don't");
  tag(s, "What");
  const docs = [
    ["EO 14179", "Jan 23, 2025", "Revise the AI use and acquisition memos"],
    ["OMB M-25-21", "Apr 3, 2025", "Chief AI Officer, inventory, minimum practices"],
    ["OMB M-25-22", "Apr 3, 2025", "Acquisition terms; ATO before deployment"],
    ["OMB M-26-04", "Dec 11, 2025", "Unbiased-AI terms for LLMs; ends Dec 2027"],
    ["EO 14409", "Jun 2, 2026", "Harden federal systems; CISA directives"],
    ["EO 14434", "Sep 29, 2026", "Say “Super Intelligence”; same definitions"],
  ];
  leftTable(s, ["Instrument", "Date", "What it asks of agencies"],
    docs.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.6, 1.4, 3.9], [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  sideBox(s, "Limits", "FaFilter", HEX.red, HEX.redTint, "What M-25-21 doesn't do", [
    "Create an AI-specific authorization to operate",
    "Govern the whole information system",
    "Set any identity requirement",
    "Require the NIST AI RMF",
  ]);
  decision(s, "Create no separate AI authorization: put every AI system's accounts in the boundary the authorizing official already reviews",
    "Authorizing official", "Before deployment");
  sources(s, "Sources: EO 14179; OMB M-25-21 (footnotes 22 and 29); M-25-22 §4(e)(i); M-26-04; EO 14409; EO 14434; OMB memoranda index. Book 17, Chapter 02.");
  narrate(s,
`Now, what the rules say. Executive Order 14179 directed OMB to replace the earlier AI memos, and on April 3, 2025 OMB issued M-25-21, for use and governance, and M-25-22, for acquisition. M-26-04 added contract terms for large language models and sunsets in December 2027. The 2026 executive orders are a security order and a terminology order; EO 14434 changes vocabulary, not obligations, and the statutory definition of AI still governs. OMB's memoranda page lists no other AI memo through M-26-19.

M-25-21's dates have all passed: a Chief AI Officer in 60 days; a governance board in 90 for CFO Act agencies; a compliance plan in 180 and then every two years until 2036; policy updates in 270; the inventory at least annually; and the high-impact practices documented within 365 days, by April 3, 2026. The obligations continue.

Four limits matter for identity. It creates no AI-specific authorization: the memo's footnotes say agencies must continue to follow A-130's authorization requirements, and that AI risk acceptance doesn't supersede them. It governs the AI functionality, not the whole system. It sets no identity requirements. And it doesn't require the NIST AI RMF.

M-25-22 is blunter: any AI system operated as an information system by or on behalf of an agency must receive an authorization to operate before deployment.

So the authorizing official creates no second track, and makes sure the AI system's accounts are inside the boundary already reviewed, before it deploys.`,
  "Book 17, Chapter 02 — What Federal AI Rules Require, and What They Don't (The rule set in force; M-25-21: what it requires; What M-25-21 doesn't do; M-25-22; The 2026 executive orders; What leadership should take from this, item 1); Chapter 08 (responsibility matrix: authorization to operate).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Two signatures before high-impact AI deploys");
  tag(s, "What");
  figure(s, "ch02-two-decisions", 0.6, 6.9);
  sideBox(s, "Practices", "FaListCheck", HEX.teal, HEX.tealTint, "The seven minimum practices", [
    "Testing, impact assessment, monitoring, training",
    "Oversight with a fail-safe, appeals, feedback",
    "Documented by April 3, 2026, and for each new case",
    "Waivers: the Chief AI Officer's, not delegable",
    "Pilots exempt only if certified",
  ]);
  decision(s, "Require both decisions for high-impact AI, made on one identity record: the signed impact-assessment risk acceptance and the system's ATO",
    "Use-case risk acceptor; authorizing official", "Before the use case deploys");
  sources(s, "Sources: OMB M-25-21 §3(b)(i), §4(a)–(b), footnotes 21–22; NIST SP 800-37 Rev. 2, Appendix D. Book 17, Chapters 02, 03, 08 and Appendix A.");
  narrate(s,
`AI is high-impact when its output serves as a principal basis for decisions or actions with a legal, material, binding or significant effect on rights or safety, and the memo lists purposes presumed to be high-impact, from safety-critical infrastructure to benefits adjudication.

For those use cases Section 4(b) requires seven practices: pre-deployment testing, an AI impact assessment, ongoing monitoring, operator training, human oversight with a fail-safe where practicable, remedies and appeals, and feedback from end users and the public. Independent review is part of the impact assessment, done by someone not involved in the development, and the assessment ends in risk acceptance signed by the individual accepting the risk, ideally the official accountable for the mission outcome. Pilots are exempt only if limited and certified by the Chief AI Officer, whose waivers can't be delegated.

The point for this room: the memo says its risk acceptance is separate from, and doesn't supersede, system authorization. So a high-impact use case needs two decisions before it deploys, often by two different people: the use-case signature and the authorizing official's decision. Where one person holds both roles, they sign twice, on two documents.

The program's design ties both to one record, because both depend on knowing what the system is, who owns it, which accounts it runs as and what those accounts can reach. Three of the practices, monitoring, training and a tested disable, are evidence the identity program produces anyway.`,
  "Book 17, Chapter 02 — What Federal AI Rules Require, and What They Don't (The seven minimum practices; There is no AI-specific ATO; What leadership should take from this, item 2); Chapter 08 — Who Owns AI Identity Governance (The official who accepts risk for an AI use case); Appendix A.");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "The inventory is a seed list, not an identity source");
  tag(s, "What");
  figure(s, "ch03-anchors-and-gaps", 0.6, 6.9);
  sideBox(s, "Status", "FaClipboardCheck", HEX.amber, HEX.amberTint, "Status, not evidence", [
    "Nine high-impact fields report all seven practices",
    "None carries a document, a log or a name",
    "101 of 227 deployed high-impact cases answered none",
    "An answer is a snapshot; access changes daily",
  ]);
  decision(s, "No use case is recorded as piloted or deployed in the inventory without a link to its AI identity record (program design)",
    "Chief AI Officer", "From the next inventory submission");
  sources(s, "Sources: OMB Guidance on 2025 AI Reporting; 2025 inventory data dictionary and CSV (counts computed Oct 21, 2026); M-25-21 §3(b)(v). Book 17, Chapters 03 and 08.");
  narrate(s,
`The one list of AI every agency keeps is the use-case inventory, built to tell the public what agencies use AI for. The 2025 cycle closed with submissions on December 22, 2025 and public posting by January 28, 2026. OMB's consolidated repository holds 3,611 use cases, 1,818 deployed or piloted, which is where a figure of "over 1,800 AI systems" came from. But a use case isn't a system, and it isn't an identity. As of October 2026 there's no 2026 repository.

Read as identity data, the fields sort three ways. Anchors: the use-case ID, stable and never reused; the bureau, which is placement; and the stage, where retired is a leaver event. Leads someone has to check: the contact email, blank on 1,115 of 3,611 public rows; the vendor; the authorization answer; the classification. And gaps the inventory doesn't hold: the principal, its credential, its permissions, its accountable owner and the risk acceptor.

A correction from the book: the 2025 schema does have a field for each of the seven practices. But the fields are answers, not artifacts: yes, in progress or waived. 101 of 227 deployed high-impact use cases answered none, and those answers predate the April deadline, so they show agencies midway, not in breach.

So the inventory is the seed list, joined from the directory side using the agency's internal submission, not the public file. The Chief AI Officer makes the policy decision that ties the two: no use case is recorded as piloted or deployed without a link to its identity record.`,
  "Book 17, Chapter 03 — The AI Use-Case Inventory as an Identity Source (What the inventory is; About \"over 1,800 AI systems\"; Reading the fields as identity data; A use case isn't an identity; What the high-impact fields can and can't evidence); Chapter 08 — Who Owns AI Identity Governance (The Chief AI Officer; the inventory link row).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Kinds of AI identity, and what your cloud has today");
  tag(s, "What");
  figure(s, "ch04-whose-token", 0.6, 6.9);
  sideBox(s, "Stage", "FaCloud", HEX.navy, HEX.navyTint, "Release stage, October 2026", [
    "Agent ID platform: generally available, April 2026",
    "Agent policies: preview; agent identities Block only",
    "GCC: a documented, partial subset",
    "GCC High and DoD: no published availability",
    "Agent 365: FedRAMP High authorization pending",
  ]);
  decision(s, "Budget the licenses agent governance needs, and confirm each capability in the agency's own cloud before anyone plans on it",
    "CIO, with the executive sponsor", "Before planning on any agent feature");
  sources(s, "Sources: Microsoft Learn — Conditional Access for agents; Agent ID; Agent 365; Entra feature availability; licensing (Oct 2026). Book 17, Chapters 04, 05, 08.");
  narrate(s,
`An AI system's identity isn't the model; a language model has no account. It belongs to the software around it, and what sorts it is whose token it presents.

A signed-in user's: the agent can reach everything that user can, so the narrowing has to come from consent. Its own: a workload or agent identity, where the only Conditional Access control today is to block. Its own user account, for agents that need a mailbox, which is preview and limited to the Frontier program. Or none the identity provider issued: a stored key, which is a finding.

Beside ordinary service principals and managed identities, Microsoft Entra Agent ID adds blueprints, which hold the credential and are the credential boundary for every agent made from them, and agent identities, each with a required human sponsor.

Now the dates. Microsoft announced the Agent ID platform as generally available in April 2026. Agent targets in Conditional Access are still labeled preview. GCC has a documented partial subset: identity and access governance for agents, but not Microsoft's audit and data protection for agent interactions. GCC High and DoD have no published availability, so treat agent identities as unavailable there. And Microsoft says Agent 365 meets the FedRAMP High controls its assessor reviewed, with final authorization pending as of October 1, 2026.

One licensing trap: Entra ID Governance for people doesn't license governance of agents; those features sit under Agent 365 or Microsoft 365 E7. So the CIO, who decides licenses with the executive sponsor, budgets them, and each capability is confirmed in the agency's own cloud first.`,
  "Book 17, Chapter 04 — Kinds of AI Identity (Workload identities; Agent identities: Microsoft Entra Agent ID; Delegated and autonomous access; Release stage, licensing and government clouds); Chapter 05 (Release stage and government-cloud availability: governance of people doesn't license governance of agents); Chapter 08 (The CIO).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "A named human, and a lifecycle that ends");
  tag(s, "What");
  figure(s, "ch05-agent-lifecycle", 0.6, 3.6);
  sideBox(s, "Rule", "FaUserCheck", HEX.teal, HEX.tealTint, "Two named humans and a record", [
    "Sponsor: a federal employee mastered in HR",
    "Co-sponsor: a small dynamic group of stewards",
    "Technical owner holds credentials; never sponsors",
    "Administrators sponsor nothing",
  ], { x: 4.4, w: 4.1, minH: 3.25 });
  sideBox(s, "HR", "FaArrowsRotate", HEX.navy, HEX.navyTint, "HR events reach the agent", [
    "Sponsor leaves: sponsorship moves to the manager",
    "Ten business days to confirm, or it's orphaned",
    "Orphaned agents are suspended, then decided",
    "Access expires unless the sponsor renews it",
  ], { x: 8.65, w: 4.1, minH: 3.25 });
  decision(s, "Name an agency employee as the sponsor of every AI system, and move sponsorship from the builder to the using program at publication",
    "System owner", "At creation, and again at publication");
  sources(s, "Sources: Microsoft Learn — Agent ID owners, sponsors and managers; Lifecycle Workflows; access packages for agents; deletion. Book 17, Chapters 05 and 08.");
  narrate(s,
`A person's identity starts from an HR record, and the separation record causes the disablement. An agent has neither date, so its lifecycle has to hang from a person who has both.

Agent ID separates accountability from administration. The sponsor, required at creation, can disable or soft-delete an agent but can't re-enable it or change its settings. The owner is the technical administrator holding the credentials. Left to the defaults, the sponsor is whoever built the agent, and a blueprint's creator becomes its owner: perhaps a developer, a contractor or a pilot user.

The program's rule, which is design: the sponsor is a federal employee mastered in HR, normally the official named for the use case; a co-sponsor is a small dynamic group of the office's agent stewards, so accountability survives a departure; the technical owner never sponsors; the inventory record names the same sponsor; and administrators sponsor nothing.

Then the lifecycle. When a sponsor leaves, Lifecycle Workflows transfers sponsorship to the manager, generally available since May 2026 and triggered by the same HR events as everyone's. The program treats the transfer as provisional: ten business days to confirm, nominate a successor or retire the agent, or it's orphaned and suspended. Access comes through packages with end dates, so a sponsor who does nothing lets it lapse. Retirement is disable, then delete, with a 30-day restore window. In GCC High and DoD the lifecycle runs on application objects and a ticket, which is weaker and belongs in the package.

The system owner names the sponsor at creation, and moves sponsorship to the using program at publication.`,
  "Book 17, Chapter 05 — Owners, Sponsors and the AI Identity Lifecycle (Three accountable relationships; The program's rule; When the sponsor moves or leaves; Recertification; Retirement; The orphaned agent; Where the agent features aren't available); Chapter 08 (The agent's sponsor and technical owner; responsibility matrix).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "No stored secrets, no standing privilege");
  tag(s, "What");
  figure(s, "ch06-credential-order", 0.6, 5.3);
  sideBox(s, "Privilege", "FaKey", HEX.red, HEX.redTint, "Least privilege, decided in advance", [
    "No MFA for agents: every control is set before it asks",
    "On behalf of a user first; app-only only with no user present",
    "Microsoft's block list is a floor, not least privilege",
    "No AI identity holds a standing privileged role",
    "Block unapproved agents; report-only while in preview",
  ], { x: 6.1, w: 6.65 });
  decision(s, "Set the control requirements for AI identities: no client secrets in production, no standing privileged roles, and a block-unless-approved agent policy",
    "CISO; identity engineering builds", "Before the first production agent");
  sources(s, "Sources: Microsoft Learn — Agent ID authorization, best practices, blueprints, Conditional Access for agents; BOD 25-01; SP 800-53. Book 17, Chapter 06.");
  narrate(s,
`An agent can't be asked for a second factor: agent identities don't use passwords or multifactor authentication. So everything the agent may do is decided before it asks.

Credentials, in the figure's order: a managed identity as the blueprint's federated credential where the agent runs on Azure; workload identity federation from the agent's own platform elsewhere; a certificate in a key vault only where neither applies; and a client secret only in development and test. Every agent made from a blueprint shares its credential, so one compromised blueprint affects them all. The program's app management policy, blocking new secrets and capping certificates at 180 days, covers blueprints too.

Permissions: on behalf of a user first; app-only only when no user is present and the inventory records why. Microsoft blocks agents from Global Administrator, Privileged Role Administrator and some high-risk Graph permissions, but allows roles such as Exchange or SharePoint Administrator. That's a floor, not least privilege. So no AI identity holds a standing privileged role; privilege comes through a person's own activated role or a time-bound assignment.

Policy: block all agent identities except approved ones, built in report-only mode because agent targeting is still preview. A tool reached with an API key is outside the identity program; an unavoidable key sits in a vault with an owner, a rotation date and an inventory exception. In GCC, Purview's data controls for agents aren't available, so scoped permissions are the only data boundary.

The CISO sets these requirements, and identity engineering builds them, before the first production agent.`,
  "Book 17, Chapter 06 — Credentials, Least Privilege and Access Policy for AI (No stored secrets; Least privilege for Microsoft Graph and APIs; Admin consent and the SCuBA consent baseline; Conditional Access and risk policies; Privileged roles for AI: none standing; Tool and data access boundaries); Chapter 08 (responsibility matrix: control requirements for AI identities).");
}

// ------------------------------------------------------------------ What 7
{
  const s = content(S_WHAT, "Watch it, and find what nobody declared");
  tag(s, "What");
  figure(s, "ch07-shadow-ai-surfaces", 0.6, 6.9);
  sideBox(s, "Findings", "FaTriangleExclamation", HEX.red, HEX.redTint, "Findings that halt (P1)", [
    "An agentic AI system with no governed identity",
    "Shadow AI acting with credentials",
    "A credential or grant added outside the pipeline",
    "A deployed system confirmed to have no ATO",
    "Never fixed automatically; a person decides",
  ]);
  decision(s, "Decide the future of shadow AI once security operations has contained it: keep it in a system's boundary or remove it",
    "System owner; the CIO if it belongs to no system", "When discovery finds it");
  sources(s, "Sources: OMB M-25-21 §4(b)(iii); Microsoft Learn — Agent ID logs, ID Protection, Defender and Global Secure Access discovery (Oct 2026). Book 17, Chapters 07, 08.");
  narrate(s,
`An AI identity nobody watches drifts the day after it's issued, and AI nobody declared is drift from the start. M-25-21 asks monitoring of high-impact AI to detect changes after deployment, and a change to an AI system's credentials, permissions, tools or owner is exactly that kind of change, recorded first in the identity logs.

So the program compares three inputs: what was declared, what known identities are seen doing, and what discovery finds.

Shadow AI shows up on four surfaces: generative AI services staff use, apps holding consented access, agents on endpoints and in network traffic, and AI built in the agency's own clouds. Each needs a different tool, several are preview or missing from the higher clouds, and none sees an agent using a static key.

Each gap becomes a finding with a class, a severity, an owner and a window; the severities are program design. The P1s halt: an agentic system with no governed identity, shadow AI acting with credentials, a credential added outside the pipeline, and a deployed system confirmed to have no authorization. PII with no privacy impact assessment goes to the privacy officer. Nothing is disabled automatically, and only a later observation closes a finding.

Security operations contains shadow AI. The system owner decides its future, or the CIO when it belongs to no system.`,
  "Book 17, Chapter 07 — Monitoring, Drift and Shadow AI (What policy asks monitoring to do; Watching the identities you know; Finding what nobody declared; The findings; From finding to evidence); Chapter 08 — Who Owns AI Identity Governance (The CIO; shadow AI rows of the responsibility matrix).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Two decision tracks meet on one AI system");
  tag(s, "Who");
  figure(s, "ch08-two-tracks", 0.6, 6.9);
  sideBox(s, "Apart", "FaScaleBalanced", HEX.teal, HEX.tealTint, "Keeping the roles apart", [
    "The Chief AI Officer owns the declared side",
    "Only the AO accepts the system's residual risk",
    "Whoever waived a practice isn't also the sole AO",
    "The builder doesn't sponsor a published agent",
    "No AI identity approves access or consent",
  ]);
  decision(s, "Create the AI system's identity record before any credential is issued to it (program design)",
    "Identity governance officer", "Before any credential is issued");
  sources(s, "Sources: OMB M-25-21 §3(a), footnotes 21–22; M-25-22 §4(e)(i); NIST SP 800-37 Rev. 2, Appendix D; NIST AI 100-1 GOVERN 2.1. Book 17, Chapter 08.");
  narrate(s,
`Who owns it? Ask who owns an agent's identity and three answers come back. The Chief AI Officer's office says the identity team. The identity team says the Chief AI Officer. And the program office says it accepted the risk when it signed the impact assessment. All three are partly right, and together they leave an agent with credentials, data access and no one answering for it.

AI adds one new executive and one new kind of risk decision. It adds no new authorizing official, no new account manager and no new way to accept security risk.

So there are two tracks. The Chief AI Officer, at senior executive level in CFO Act agencies, owns the declared side: the inventory, high-impact determinations, independent review before risk acceptance, waivers that can't be delegated, and pilot certifications. The Chief AI Officer doesn't authorize systems, accept security or privacy risk, or manage accounts. The authorizing official alone accepts the system's residual risk, an inherently governmental role under SP 800-37.

A few separations keep it honest. If the CIO is also the Chief AI Officer, the official who waived a practice shouldn't be that system's sole authorizing official. The builder becomes the technical owner, not the sponsor. And no AI identity approves access, grants consent or changes the rules it's governed by.

One rule underpins the rest: the identity record exists before any credential is issued. The identity governance officer decides it, because creating a principal is identifier management.`,
  "Book 17, Chapter 08 — Who Owns AI Identity Governance (Where the roles come from; The Chief AI Officer and the AI governance board; The authorizing official; Keeping the roles apart; the identity record row of the responsibility matrix).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Who decides what for an AI identity");
  tag(s, "Who");
  const owners = [
    ["Inventory, high-impact calls, waivers", "Chief AI Officer"],
    ["Impact assessment risk acceptance", "Use-case risk acceptor"],
    ["Authorization; changes needing review", "Authorizing official"],
    ["Control requirements for AI identities", "CISO"],
    ["Licenses; shadow AI owned by no system", "CIO"],
    ["Sponsor; data and tools it may reach", "System owner"],
    ["Admin consent; orphaned AI identities", "Identity governance officer"],
    ["Disabling during an incident", "Security operations"],
    ["PIA for an AI system with PII", "Privacy officer"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r, i) => [{ text: r[0] }, bold(r[1], i === 2 ? HEX.amber : HEX.teal)]),
    [4.0, 2.9], [0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36], 12);
  sideBox(s, "Calls", "FaUsersGear", HEX.navy, HEX.navyTint, "Calls that land on the wrong desk", [
    "An impact assessment isn't an ATO, nor the reverse",
    "Bounded exception: CISO; open-ended: the AO",
    "Incident disable: security ops; its future: the sponsor",
    "Contractors build; officials sponsor and accept risk",
  ]);
  decision(s, "Treat each new tool, permission, user account or model for an AI system as a candidate significant change to its authorization",
    "System owner raises; the AO decides", "At every such change");
  sources(s, "Sources: OMB M-25-21; M-25-22; NIST SP 800-37 Rev. 2, Appendix D; NIST AI 100-1 GOVERN 2.1. Book 17, Chapter 08 (responsibility matrix).");
  narrate(s,
`The book's responsibility matrix, in one view. Every row has one decider.

The Chief AI Officer decides the inventory, high-impact determinations, waivers, pilot certifications and the generative AI acceptable-use policy. The use-case risk acceptor decides the impact assessment. The authorizing official decides authorization, ongoing authorization and whether a change needs reauthorization. The CISO sets the control requirements for AI identities and decides whether a generative AI service may hold agency data. The CIO decides licenses, acquisition terms and shadow AI that belongs to no system. The system owner names the sponsor and decides what data and tools the AI may reach. The identity governance officer decides admin consent, federated credentials, sponsor transfers and orphans. Security operations decides disabling during an incident, then hands the agent's future back. The privacy officer decides the privacy impact assessment.

Government officials: SP 800-37 names the authorizing official, CIO, CISO and senior agency official for privacy; the program adds the use-case risk acceptor, the system owner and the sponsor. Contractors may build and operate, under government oversight.

Exceptions split by time: a bounded exception is the CISO's; an open-ended one, or one without a compensating control, is the authorizing official's. A Chief AI Officer's waiver isn't an exception to a security control.

One decision recurs, because agents change fast. A new tool or MCP server, a new permission, a user account or a new model can change what an agent can do to agency data. The system owner raises each as a candidate significant change, and the authorizing official decides.`,
  "Book 17, Chapter 08 — Who Owns AI Identity Governance (The roles; Who must be a government official; The responsibility matrix and its comments; The authorizing official: the significant-change question).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Run the inventory scan on the agency's own file");
  tag(s, "How");
  figure(s, "ch09-scan-method", 0.6, 4.95);
  sideBox(s, "Counts", "FaTableList", HEX.amber, HEX.amberTint, "In the published 2025 file", [
    "1,480 use cases recorded as piloted or deployed",
    "54% give no authorization answer; 33% name no contact",
    "72% trip at least one inventory-answer check",
    "Answers to reconcile, not findings against agencies",
    "Directory checks need the agency's own submission",
  ], { x: 5.75, w: 7.0 });
  decision(s, "Run the inventory checks on the agency's own submission each vintage, agentic and authorization findings first, and close a finding only on observation",
    "Chief AI Officer (inventory); system owners remediate", "Each new inventory vintage");
  sources(s, "Sources: OMB 2025 AI Use Case Inventory (README, data dictionary and CSV; counts computed Oct 21, 2026); OMB M-25-21 §3(b)(v). Book 17, Chapter 09.");
  narrate(s,
`The inventory scan is cheap because it reads answers agencies have already given, and useful only if each answer it questions ends with an owner who goes and looks. It's the program's method; M-25-21 requires the inventory, not a scan of it.

Five steps. Load one vintage and record its hash and what's missing: 338 rows of the 2025 file have no stage, and the program reports them as a finding instead of skipping them. Detect. Prioritize: agentic systems first, then authorization, owners and placement, privacy, and unreadable rows. Report one row per system and finding, routed to a named role, never a team mailbox. And remediate with tools the agency already has, closing only on a later observation.

On the published 2025 file, of 1,480 use cases recorded as piloted or deployed: 799, or 54 percent, give no authorization answer; 488, a third, name no contact; 248 of the 337 involving personal data have no privacy assessment link; and 1,064, 72 percent, trip at least one check. Those are answers in a public file, not findings against agencies or counts of systems.

The checks that matter most need the directory, so only the agency can run them: no identity record, no accountable sponsor, an identity with no inventory row, and a retired use case still holding access. Each new vintage is compared with the last by ID, and an entry that vanishes without being retired is a finding.

The Chief AI Officer, who owns the inventory, runs the checks each vintage, and system owners remediate.`,
  "Book 17, Chapter 09 — Running the Inventory Scan, Agency and Central (What the scan reads; Steps 1 to 5; What the checks find in the published 2025 file; The annual refresh); Chapter 08 (responsibility matrix: maintain the inventory; remediate an AI drift finding).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "A central scan starts the conversation, not the fix");
  tag(s, "How");
  figure(s, "ch09-central-tiers", 0.6, 5.05);
  sideBox(s, "CDM", "FaSitemap", HEX.navy, HEX.navyTint, "What the CDM comparison supports", [
    "CDM tools run in agencies; summaries flow up to CISA",
    "Kept: a central view, with agency remediation",
    "A central scan reads public answers, not tool output",
    "It can't see a credential, a rotation or a revocation",
    "Its 72-hour and 30-day windows are acknowledgments",
  ], { x: 5.85, w: 6.9 });
  takeaway(s, "FaSitemap", HEX.amber, "Tier 3 stays with the agency.  ",
    "The directory join, the credential lifecycle and shadow AI discovery are what close the gap; no central scan can.");
  sources(s, "Sources: CISA CDM program, fact sheet and dashboards; CISA BOD 23-01; OMB 2025 AI Use Case Inventory. Book 17, Chapter 09. The central scan is a program proposal.");
  narrate(s,
`Every answer check runs on a public file, so one operator could run the scan once over OMB's consolidated inventory and produce a findings file for each agency. That's a proposal from the book's source material, not a federal program, and no agency has adopted it.

The source modeled it on Continuous Diagnostics and Mitigation, and the book corrects the comparison. CDM provides tools, integration and dashboards; the tools run in agencies, and summaries flow up to the Federal Dashboard. What survives is the split: a central view, with agency remediation. A central AI scan reads public answers, not tool output.

There are four tiers. Tier 0, a central scan of the public file, needing no data-sharing agreement. Tier 1, each agency receives only its own rows, agentic and authorization findings first. Tier 2, the agency remediates with tools it already owns, and the next vintage shows the fix. And Tier 3, credential governance, which only the agency can do.

The source's windows, 72 hours for agentic findings and 30 days for the rest, are kept only as the time to acknowledge and route a delivered list; inside the agency, the drift model's shorter targets apply.

No central scan can see whether a credential exists, rotated or was revoked; what wasn't published or was never inventoried; change between annual vintages; or a leaver, without stable IDs. It starts the conversation with every agency at once. It can't finish it.`,
  "Book 17, Chapter 09 — Running the Inventory Scan, Agency and Central (The central model; What CDM actually does; The four tiers; What a central scan can't close).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Evidence the authorizing official can use");
  tag(s, "How");
  figure(s, "ch10-where-the-ai-sits", 0.6, 6.6);
  sideBox(s, "Five", "FaFileShield", HEX.teal, HEX.tealTint, "Five questions for the package", [
    "Owner: who answers for it, today?",
    "Credentials: how it signs in; no secrets",
    "Permissions: what it reaches; who approved",
    "Monitoring: who watches; what they found",
    "Lifecycle: when its access ends",
  ], { x: 7.45, w: 5.3 });
  decision(s, "Tailor IA-9 into the security plan of every system with an AI system acting under its own identity, naming the services it calls (program design)",
    "System owner and ISSO; the AO approves", "Before the next authorization decision");
  sources(s, "Sources: OMB M-25-21 fn. 29; M-25-22 §4(e)(i); NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 and SP 800-53B; FedRAMP 2026 control reference. Book 17, Chapter 10.");
  narrate(s,
`Everything ends in the authorization package. The authorizing official reads the package, not the records, and accepts or declines the risk it describes.

Three things follow from there being no AI-specific authorization. The authorizing official decides, and under SP 800-37 that acceptance can't be delegated; a governance board, a Chief AI Officer's determination or a vendor score only informs it. The inventory's authorization field reports; it doesn't gate. And FedRAMP's AI Prioritization Initiative, from August 2025 to April 2026, sped up providers' certification without changing what the agency does.

First, whose boundary does the AI run in? Inside an authorized system, it's a new component and a possible event-driven review. As its own system, it's the full Risk Management Framework. On a provider's certified service, the agency authorizes its use, and the identities, consent grants and delegated permissions the service creates in the agency's tenant are the agency's to govern.

Then the package answers five questions: owner, credentials, permissions, monitoring and lifecycle.

IA-9, service identification and authentication, describes an AI system calling a tool or an API with its own identity, but it's in no NIST baseline and no FedRAMP class, so a baseline-only agency never assesses it. The program's design tailors it into the security plan of any system with an AI acting under its own identity. The system owner and ISSO do it, and the authorizing official approves, before the next authorization decision.`,
  "Book 17, Chapter 10 — Evidence and Authorization for AI Systems (There is no AI-specific authorization to operate; Where the AI sits decides which package carries it; The evidence an authorizing official needs; IA-9 is not in any baseline); Chapter 08 (responsibility matrix: AI identity evidence in the authorization package).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Keep the evidence current: three AI clocks");
  tag(s, "How");
  const clocks = [
    ["At least annually", "AI use-case inventory", "Vintage comparison; new and retired parts"],
    ["Every two years", "Compliance plan; next in 2027", "States how the agency meets the memo"],
    ["Yearly; 30 days", "Waivers certified, reported", "Each is an exception with an expiry"],
    ["Annually (FISMA)", "Security testing", "Covers the AI controls, IA-9 included"],
  ];
  leftTable(s, ["Cadence", "What happens", "For the package"],
    clocks.map((r, i) => [bold(r[0], i === 3 ? HEX.slate : HEX.navy), { text: r[1] }, { text: r[2] }]),
    [1.7, 2.35, 2.85], [0.42, 0.62, 0.62, 0.62, 0.62], 12.5);
  sideBox(s, "Overlays", "FaBook", HEX.amber, HEX.amberTint, "AI control overlays: none yet", [
    "NIST concept paper, Aug 2025; an outline, Jan 2026",
    "No public draft as of October 21, 2026",
    "Renamed COSIS on October 20, 2026",
    "Tailor the baseline now; compare when final",
  ]);
  decision(s, "Record every waiver and pilot certification as a governed exception with an expiry date; any with no end date goes to the authorizing official",
    "Chief AI Officer; the AO if open-ended", "Annually, and within 30 days of a change");
  sources(s, "Sources: OMB M-25-21 §3(b)(ii), §3(b)(v), §4(a); 44 U.S.C. § 3554(b)(5); OMB A-130 App. I; NIST COSIS project page; EO 14434. Book 17, Chapter 10.");
  narrate(s,
`AI governance adds three clocks beside FISMA's annual testing floor, all feeding the same continuous monitoring stream.

The inventory, at least annually. Each new vintage changes the security plan: a new piloted or deployed entry becomes a component, a retired one moves to disposition until its identities are shown removed, and a changed authorization answer is reconciled. Under ongoing authorization, the program treats a new agentic system inside an authorized boundary as worth an event-driven review; that's design, not a federal rule.

The compliance plan, every two years until 2036. The first fell due at the end of September 2025, so the next is due in 2027: a distinct obligation that an agency tracking only the inventory will miss.

Waivers, certified annually and reported to OMB within 30 days of being granted or revoked. A waiver or a pilot certification is a decision that a practice won't be evidenced, so the authorizing official should see it, and one with no end date is an exception with no expiry.

NIST's SP 800-53 overlays for AI had a concept paper in August 2025 and an annotated outline in January 2026, but no public draft as of October 21, 2026, and the project was renamed COSIS on October 20. Tailor the baseline now, and compare when an overlay is final.

The Chief AI Officer records waivers and pilot certifications as governed exceptions with expiry dates, and any with no end date goes to the authorizing official.`,
  "Book 17, Chapter 10 — Evidence and Authorization for AI Systems (The high-impact practices as evidence; The cadence; Carrying AI identity in OSCAL; NIST's SP 800-53 overlays for AI systems); Chapter 08 (responsibility matrix: waivers; exception rows).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Treat an agentic AI system with no governed identity as P1", "System owner and ISSO", "As soon as it's found"],
    ["Authorize AI in the existing process; no separate AI ATO", "Authorizing official", "Before deployment"],
    ["Put both high-impact signatures on one identity record", "Risk acceptor; the AO", "Before deployment"],
    ["Link every live inventory entry to an identity record", "Chief AI Officer", "Next inventory"],
    ["Budget agent licenses; confirm each feature in your cloud", "CIO, with the sponsor", "Before planning on it"],
    ["Name an agency employee as every AI system's sponsor", "System owner", "Creation; publication"],
    ["No production secrets, no standing privilege, block unapproved", "CISO", "First production agent"],
    ["Decide the future of shadow AI once it's contained", "System owner, or the CIO", "When it's found"],
    ["Create the identity record before any credential", "Identity governance officer", "Before any credential"],
    ["Raise new tools, permissions and models as changes", "System owner; the AO decides", "At each change"],
    ["Scan each vintage; close findings only on observation", "Chief AI Officer; system owners", "Each vintage"],
    ["Tailor IA-9 in; make waivers expiring exceptions", "System owner; CAIO; the AO", "Next authorization"],
  ];
  const rh = [0.36, ...asks.map(() => 0.34)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.6, 3.2, 2.35][j] - 0.2;
    if (linesFor(c.length, w, 12) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.6, 3.2, 2.35], { y: 1.45, w: 12.15, fontSize: 12, rowH: rh }));
  T(s, "Close line", [{ text: "None of these needs a new authorization.  ", options: { bold: true, color: HEX.amber } },
    { text: "Every AI system gets an identity, an owner and an end date, inside the process you already run." }],
    { x: 0.6, y: 5.98, w: 12.15, h: 0.5, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: OMB M-25-21; M-25-22 §4(e)(i); NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5; Microsoft Learn, Oct 2026. Book 17, Chapters 01–10. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The system owner and ISSO treat an agentic AI system with no governed identity as a high-priority finding the moment it's found, with the authorizing official informed.

The authorizing official authorizes AI through the existing process, before deployment; and for high-impact AI, the use-case risk acceptor and the authorizing official sign two decisions on one identity record.

The Chief AI Officer links every live inventory entry to an identity record from the next submission, runs the scan each vintage, and records waivers and pilot certifications as expiring exceptions.

The CIO, with the sponsor, budgets the licenses agent governance needs, and each capability is confirmed in the agency's own cloud before it's planned on.

The system owner names an agency employee as every sponsor, at creation and at publication; decides the future of shadow AI inside a system, with the CIO deciding when no system claims it; raises each new tool, permission, user account or model as a candidate significant change; and, with the ISSO, tailors IA-9 into the plan.

The CISO sets the requirements: no client secrets in production, no standing privileged roles, and a block-unless-approved agent policy.

The identity governance officer makes sure no credential is issued before its identity record exists.

None of these needs a new authorization. Every AI system gets an identity, an owner and an end date, inside the process the agency already runs. Book 17 has the detail, with every claim footnoted. Thank you.`,
  "Book 17, Chapter 01 (What leadership should take from this); Chapter 02 (What leadership should take from this); Chapter 08 — Who Owns AI Identity Governance (The responsibility matrix); Chapter 09 (Step 5); Chapter 10 (What the authorizing official should find).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal AI rules, NIST and CISA");
  const src = [
    "OMB M-25-21, Accelerating Federal Use of AI through Innovation, Governance, and Public Trust (April 3, 2025), §2–§6 and footnotes 11, 21, 22 and 29.  ·  OMB M-25-22, Driving Efficient Acquisition of Artificial Intelligence in Government (April 3, 2025), §3–§4.  ·  OMB M-26-04 (December 11, 2025).  ·  OMB M-26-10 (March 31, 2026).  ·  OMB memoranda index, through M-26-19.",
    "Executive Orders 14179 (January 23, 2025), 14319 (July 23, 2025), 14409 (June 2, 2026) and 14434 (September 29, 2026), Federal Register.  ·  OMB Circular A-130, Appendix I.  ·  44 U.S.C. § 3554 (FISMA).",
    "OMB, Guidance on 2025 Agency Artificial Intelligence Reporting; 2025 Federal Agency AI Use Case Inventory: README (as of April 13, 2026), data dictionary, individually reported and consolidated COTS CSV files; 2024 inventory README.",
    "NIST AI 100-1, AI RMF 1.0 (January 2023).  ·  NIST AI 600-1, Generative AI Profile (July 26, 2024).  ·  SP 800-53 Rev. 5, release 5.2.0, and SP 800-53B.  ·  SP 800-37 Rev. 2, Appendix D and Tasks P-18 and M-7.  ·  NIST COSIS (formerly COSAiS) project page.  ·  OSCAL 1.2.3 (August 7, 2026).",
    "CISA, Careful Adoption of Agentic AI Services (May 1, 2026); Deploying AI Systems Securely (April 15, 2024); BOD 25-01 required configurations; BOD 23-01; CDM program, fact sheet and dashboards.  ·  FedRAMP, AI Prioritization Initiative; Consolidated Rules for 2026, control reference.",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: identity platforms, as of October 2026");
  const src = [
    "Microsoft Learn, Microsoft Entra Agent ID: overview; what are agent identities; agent identities; the agent's user account; owners, sponsors and managers; authorization; best practices; create a blueprint; inheritable permissions; agent identity deletion; logs; FAQ; what's new (April 2026 general availability).",
    "Microsoft Learn, Conditional Access: for agents; target agent identities; Grant; secure autonomous agents; for workload identities.  ·  ID Protection for agents; securing workload identities.  ·  Entra ID Governance: governing agent identities; access packages for agents; Lifecycle Workflows sponsor tasks and templates; licensing fundamentals.",
    "Microsoft Learn, Microsoft Agent 365 service description (feature availability, GCC column, FedRAMP High note as of October 1, 2026); Agent 365 identity; US Government cloud endpoints; MCP server approval.  ·  Microsoft Entra feature availability for Azure Government.",
    "Microsoft Learn, Defender for Cloud Apps generative AI discovery; Global Secure Access shadow AI and AI agent discovery; Defender for Endpoint local AI agent discovery; Defender for Cloud AI security posture.  ·  AWS Bedrock AgentCore Identity and GovCloud; Google Cloud agent identity (named as examples only).",
    "Full footnotes with links and access dates (October 21–22, 2026): Book 17, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b17-ai-identity/).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// ---------------------------------------------------------------- narration.json must match the narrated slides
{
  const NARR = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
  const narrated = titles.slice(0, titles.indexOf("Backup"));
  if (NARR.length !== narrated.length) console.warn(`  ! narration.json has ${NARR.length} entries for ${narrated.length} narrated slides`);
  let said = 0;
  const per = NARR.map((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title ${JSON.stringify(e.title)} doesn't match ${JSON.stringify(narrated[i])}`);
    const n = e.say.split(/\s+/).filter(Boolean).length; said += n; return n;
  });
  console.log(`narration.json: ${said} words (${per.join(", ")}), about ${mmss((said * 60) / 160)} at 160 wpm`);
}

console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
