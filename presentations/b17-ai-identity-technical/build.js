// Book 17 — AI Identity Governance: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The identity and the inventory:   Module 1 (Ch01–02, AI agents as identities and the federal AI rules),
//                                               Module 2 (Ch03–04, the inventory as an identity source and the kinds of AI identity).
//   Part 2 — Governing it and proving it:      Module 3 (Ch05–06, owners, sponsors, lifecycle, credentials and least privilege),
//                                               Module 4 (Ch07–10, monitoring, drift and shadow AI, the inventory scan, evidence).
// Build:  node presentations/b17-ai-identity-technical/build.js presentations/b17-ai-identity-technical/B17_AI_Identity_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b17-ai-identity/; the notes name the chapter.
// The program's own recommendations are labeled "program design" or "design guidance", product behavior carries its
// release stage and the date it was checked (October 21–22, 2026), as the book does.
// Goes deeper than the 15-minute deck (../b17-ai-identity/) and the executive briefing (../b17-ai-identity-executive/):
// the object model, policy targets, logs, findings, the scan and the package, for identity and security engineers.
// Narration: narration.json (intent-first voice, keyed by slide title) is read by presentations/_build/narrate.py
// (the editor runs that). The notes keep the full detail for a live presenter.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 17", title: "AI Identity Governance — Technical Deep Dive" });
const { HEX, txt, box, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B17_AI_Identity_Technical.pptx";

// ------------------------------------------------------------------ helpers
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} callout`, y + h);
  return D.callout(s, name, y, h, iconName, color, label, text);
};

// Speaker notes with an automatic timing cue (live delivery runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0, modWords = 0;
const modules = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; modWords += n;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};
const endModule = (name) => { modules.push([name, modWords]); modWords = 0; };

// Titles: at most 58 characters and unique across the deck (narrate.py keys narration on them).
const titles = new Set();
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.has(t)) throw new Error(`duplicate slide title: ${t}`);
  titles.add(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));

// The short Sources line on every content slide: at most 185 characters.
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
};

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.34, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, w: colW.reduce((a, b) => a + b, 0), h: rowH.reduce((a, b) => a + b, 0), fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, bottom);
  if (o.limit && bottom > o.limit + 0.01) console.warn(`  ! ${name} table runs into the shape below: bottom ${bottom.toFixed(2)}, limit ${o.limit.toFixed(2)}`);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets. Pass h = null to size it to its text.
// Returns the panel's bottom edge.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (h == null) h = Math.ceil((need + 0.14 - y) * 20) / 20;
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: top - y - 0.14 });
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h - need > 0.75) console.warn(`  ! ${name} panel has ${(y + h - need).toFixed(2)} in of empty space`);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  warn(`${name} panel`, y + h);
  return y + h;
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
// Alt text is the chapter's own fig-alt, read from the chapter so the two can't drift apart.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b17-ai-identity", "png");
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b17-ai-identity");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => n.endsWith(".md"))) {
  const md = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of md.matchAll(/svg\/([a-z0-9-]+)\.svg\)\{#[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
const img = (s, name, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const alt = ALT[name];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${name}`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  warn(`${name} image`, y + h);
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)}, bottom ${(y + h).toFixed(2)}`);
  return { w, h, bottom: y + h };
};

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — The identity and the inventory";
const P2 = "Part 2 — Governing it and proving it";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "AI Identity Governance: the technical deep dive", "Book 17 — AI Identity Governance: identities, owners, credentials, monitoring and evidence for AI");
  txt(s, "Session map", [
    { text: "Part 1 — The identity and the inventory", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  AI agents as identities, and the rules   ·   Module 2  The inventory and kinds of AI identity", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Governing it and proving it", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Owners, lifecycle, credentials, privilege   ·   Module 4  Monitoring, the scan, authorization", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.9, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 17 of the Federal Modernization Workbook, AI Identity Governance. It's for identity engineers, security engineers and platform owners: the people who issue the credentials AI systems sign in with, write the policies that can stop them, and collect the logs that show what they did.

It runs in two parts and four modules you can watch separately. Part 1 is the identity and the inventory: why an AI system that can act is an account, what the federal AI rules require and don't, the use-case inventory read as identity data, and the kinds of AI identity. Part 2 is governing it and proving it: owners and lifecycle, credentials and least privilege, then monitoring and shadow AI, the inventory scan, and the evidence an authorizing official needs.

The 15-minute deck and the executive briefing make the argument; this one goes into the object model, the policies, the logs and the findings. Three labels to listen for. Program design is marked as such. Product statements are dated October 21 and 22, 2026, and move monthly. And the chapters' code is illustrative and read-only; I'll describe it rather than walk through it.`,
  "Book 17, index; Chapters 01–10; Appendix A.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: an agent that acts is an account");
  tag(s, "Why");
  img(s, "ch01-three-ways-in", 0.6, 1.5, 6.4, 3.9);
  panel(s, "Acting", 7.25, 1.5, 5.5, null, HEX.red, HEX.redTint, "FROM ANSWERING TO ACTING", null, [
    "M-25-21's definition of AI includes fully, partially and non-autonomous systems",
    "2025 inventory (Apr. 13, 2026): 3,611 use cases; 117 agentic, 38 of them piloted or deployed",
    "Prompt injection against an agent produces an action, not a bad answer",
    "The blast radius is the access the agent's identity holds",
  ], 14);
  callout(s, "Key", 5.6, 0.9, "FaKey", HEX.red, "The fourth way in: ",
    "an API key or stored secret bypasses Entra ID token issuance entirely, so Conditional Access never sees the call.");
  sources(s, "Sources: OMB M-25-21 §5; OMB 2025 AI Use Case Inventory (README, data dictionary, CSV); NIST AI 600-1 §2.9; Microsoft Learn, Conditional Access for agents. Book 17, Ch 01.");
  notes(s,
`Why this matters. A chat assistant that drafts a memo is a tool: a person reads it and sends it under their own name. An agent reads a mailbox and sends the replies, opens a ticket and closes it, updates a field in a case system. Each step is an action against agency data, taken by something that signed in and holds permissions.

Policy already counts autonomy as part of AI: M-25-21's definition includes fully, partially and non-autonomous systems, and OMB's 2025 inventory has an agentic class. As of April 13, 2026, the consolidated inventory holds 3,611 use cases; 117 are agentic, 38 of them piloted or deployed. Small and self-reported, but it's the share that grows fastest and matters most for identity.

The diagram shows Microsoft's three ways in: on behalf of a signed-in user, as itself with an app-only token, or as its own user account. All three run through the identity provider, where policy and logs apply. The red path is an API key or stored secret, which bypasses Entra ID token issuance entirely: no sign-in is evaluated and Conditional Access never applies.

And the risk is identity-shaped. NIST's Generative AI Profile describes indirect prompt injection, input planted in data the system retrieves. Against a chat tool that produces a bad answer. Against an agent with broad permissions it produces an action, under a legitimate identity the logs will show doing exactly what it was allowed to do. The blast radius is the access the identity holds.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners, \"From answering to acting,\" \"Three ways in,\" \"Why the risk is identity-shaped.\"");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(P1, "Module 1: AI agents as identities, and the federal rules", "Part 1 — The identity and the inventory  ·  Chapters 01–02",
    ["How AI arrived outside the identity program, and the controls that apply", "The seven things every AI identity needs", "The federal AI rule set, and why there's no AI-specific ATO"], 8);
  notes(s,
`Module 1: AI agents as identities, and the federal rules. Before you can govern an AI identity, two things need settling: that it is an identity in the sense your controls already use, and what federal AI policy actually asks of you, as opposed to what people assume.

So: how most AI arrived outside the identity program and why SP 800-53 already covers it; the seven things every AI identity needs; and the rule set as of October 2026, what it leaves out, and the two separate decisions a high-impact AI system needs before it deploys.`,
  "Book 17, Chapter 01 — Why AI Agents Need Identities and Owners; Chapter 02 — What Federal AI Rules Require, and What They Don't.");
}

// ================================================================== 4 Outside the program
{
  const s = content(P1, "AI arrived outside the program; the controls still apply");
  tag(s, "Why");
  subhead(s, "Lacks head", "WHAT AN AI SYSTEM FOUND OUTSIDE THE PROGRAM TYPICALLY LACKS", 0.6, 1.5, 7.3);
  const tb = table(s, "Lacks", 1.85, [3.1, 4.2], ["An employee's account has", "An AI system found outside the program has"], [
    ["An owner of record, and a manager in HR", "A project contact who has often moved on"],
    ["A placement that drives access", "No placement beyond the team that set it up"],
    ["A credential issued under policy", "A secret in a config file, a vault entry or a shared account"],
    ["Access from a role, reviewed on a schedule", "Permissions granted once for a pilot, never reviewed"],
    ["Monitoring tied to its own sign-ins", "Activity that looks like the app or user it runs as"],
    ["A leaver process", "No end date; it outlives the project and its owner"],
  ], { fontSize: 12.5, limit: 5.5 });
  const pb = panel(s, "Controls", 8.15, 1.5, 4.6, null, HEX.navy, HEX.navyTint, "SP 800-53 REV. 5 ALREADY COVERS IT", null, [
    "AC-2: system and service account types, account managers, approval, monitoring, removal",
    "IA-4, IA-5: identifiers and authenticators for a service",
    "AC-6: least privilege for processes acting for users",
    "IA-9: services identified and authenticated before they connect",
  ], 13.5);
  callout(s, "Coverage", Math.max(tb, pb) + 0.2, 0.85, "FaTableList", HEX.navy, "The gap is coverage, not the catalog: ",
    "the AI system's account is often missing from the account inventory the controls are tested against.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-2, AC-6, IA-4, IA-5, IA-9); NIST AI 100-1, GOVERN 1.6, 1.7, 2.1; OMB 2025 AI reporting guidance. The table is program experience. Book 17, Ch 01.");
  notes(s,
`People join an agency through a pipeline the identity program built: an HR record, an account from it, access from the position, scheduled reviews and a leaver process. AI mostly came another way. A mission office ran a vendor pilot. A developer put an API key in a configuration file. A licensed product shipped an assistant as a new feature. A business unit built a low-code agent and gave it a service account to read a shared mailbox. None of those paths runs through the identity program.

The table is the program's experience of what such a system typically lacks: a current owner, usually a project contact who has moved on; any placement beyond the team that set it up; a credential issued under policy; scheduled review; monitoring that tells it apart from the app or user it runs as; and an end date. The inventory doesn't close this, because it describes a use case, not the account it signs in with.

None of it needs a new control family. AC-2 already lists system and service account types, with account managers, approvals, monitoring and removal. IA-4 and IA-5 cover identifiers and authenticators for a service. AC-6 applies least privilege to processes acting for users. IA-9 asks that services authenticate before they communicate. The AI RMF's Govern function adds an AI inventory, safe decommissioning and documented roles.

So the gap isn't in the catalog. It's coverage: the AI system's account is often missing from the account inventory the controls are tested against.`,
  "Book 17, Chapter 01 — \"How AI arrived outside the identity program,\" \"The controls already apply.\"");
}

// ================================================================== 5 Seven needs
{
  const s = content(P1, "Seven things every AI identity needs");
  tag(s, "What");
  const pic = img(s, "ch01-what-every-ai-identity-needs", 0.6, 1.5, 7.6, 3.75);
  panel(s, "Limits", 8.45, 1.5, 4.3, null, HEX.amber, HEX.amberTint, "HONEST LIMITS", null, [
    "Program design: no federal rule requires an AI identity record or sponsor",
    "Not every AI system holds access; the record can say so",
    "Counts are self-reported; use cases aren't systems",
    "The products are young; every product statement is dated",
  ], 13.5);
  callout(s, "First", Math.max(pic.bottom, 5.0) + 0.3, 0.85, "FaRoute", HEX.teal, "Govern agents first: ",
    "systems that can act carry the largest blast radius; start with them, then work out to systems that only answer.");
  sources(s, "Sources: Book 17, Ch 01 (the seven-part model is program design); NIST SP 800-53 Rev. 5; Book 14, Ch 04; Book 12, Ch 02. Book 17, Ch 01.");
  notes(s,
`The program's model has seven parts, and the right-hand column of the figure names the chapter that builds each.

One identity record per AI system that holds access, joined to its inventory entry and its accounts, so you can answer what is this and what can it reach. An accountable human owner, resolvable in HR, with ownership moving before the access outlives them. An organizational placement, so reviews route to the office whose mission it serves. Credentials without stored secrets: managed identity or federation first, certificates only where neither applies, least privilege throughout. Monitoring and drift detection, with an agentic system that has no governed identity raised as a high-priority finding. A lifecycle that ends, with an end date set at creation. And evidence the authorizing official can use, through Book 12's evidence contract.

Four honest limits sit beside it. It's program design: the controls behind each part are required, the model isn't. Not every AI system holds access; many use cases are analytic models run by people or features acting only through the user, and the record can simply say so. The counts are self-reported and use cases aren't systems. And the products are young, so every product statement here is a dated observation.

The practical order follows from the blast radius: govern agents first, the systems that can act, then work outward to the ones that only answer.`,
  "Book 17, Chapter 01 — \"What every AI identity needs,\" \"Honest limits,\" \"What leadership should take from this.\"");
}

// ================================================================== 6 Rule set
{
  const s = content(P1, "The rule set: what binds, what guides, what's missing");
  tag(s, "Why");
  img(s, "ch02-rules-and-guidance", 0.6, 1.5, 4.75, 5.0);
  const a = panel(s, "Requires", 5.6, 1.5, 7.15, null, HEX.navy, HEX.navyTint, "M-25-21 REQUIRES: EVERY DEADLINE HAS PASSED, THE DUTIES RECUR", null, [
    "A Chief AI Officer; an AI governance board in CFO Act agencies",
    "An annual use-case inventory; a compliance plan every two years until 2036",
    "The seven minimum practices for high-impact AI, or safe discontinuation",
  ], 14);
  panel(s, "Omits", 5.6, a + 0.2, 7.15, null, HEX.red, HEX.redTint, "WHAT IT DOESN'T DO", null, [
    "No AI-specific authorization: A-130's ATO requirements continue",
    "It governs AI functionality, not the whole information system",
    "No identity requirements: accounts stay under the system's own controls",
    "It doesn't require the NIST AI RMF; NIST's AI overlays have no public draft",
  ], 14);
  sources(s, "Sources: EOs 14179, 14409, 14434; OMB M-25-21 §§2–4, fns 11, 22; M-25-22; M-26-04; NIST AI 100-1, AI 600-1; NIST COSIS project (Oct. 20, 2026). Book 17, Ch 02.");
  notes(s,
`The rule set in force as of October 2026, split the way the figure splits it: on the left what binds agencies, on the right what guides them.

Executive Order 14179 had OMB replace the 2024 memos, and on April 3, 2025 OMB issued M-25-21 for use and governance and M-25-22 for acquisition. M-26-04 sets contract terms for unbiased AI principles in large language models and sunsets in December 2027. Executive Order 14409 is a security order; it doesn't change how an agency governs its own AI identities. Executive Order 14434 of September 29, 2026 changes the vocabulary to Super Intelligence in non-statutory documents; the definition doesn't move, and the memos still say AI.

M-25-21's duties: a Chief AI Officer; a governance board in CFO Act agencies; a compliance plan, then every two years until 2036; the annual inventory; and documented minimum practices for high-impact AI by April 3, 2026, or safe discontinuation. Every deadline has passed; the obligations recur.

What it doesn't do matters more for engineers. It creates no AI-specific authorization: A-130's requirements continue. It applies to AI functionality, not the whole system. It says nothing about accounts, credentials or permissions; those stay under the controls of the system the AI runs in. And it doesn't require the AI RMF.

On the guidance side, the AI RMF is voluntary and under revision, and NIST's SP 800-53 overlays for AI, renamed COSIS on October 20, 2026, have no public draft. Until one exists, AI is assessed against the system's ordinary baseline.`,
  "Book 17, Chapter 02 — What Federal AI Rules Require, and What They Don't, \"The rule set in force,\" \"M-25-21: what it requires,\" \"What M-25-21 doesn't do,\" \"The 2026 executive orders.\"");
}

// ================================================================== 7 No AI ATO
{
  const s = content(P1, "No AI-specific ATO: two decisions, one record");
  tag(s, "Why");
  const pic = img(s, "ch02-two-decisions", 0.6, 1.5, 6.3, 3.8);
  const pb = panel(s, "Second", 7.15, 1.5, 5.6, null, HEX.navy, HEX.navyTint, "WHAT THE MEMOS SAY", null, [
    "M-25-22: AI operated as an information system gets an ATO \"prior to deployment\"",
    "M-25-21: AI use-case risk acceptance \"does not supersede\" system authorization",
    "High-impact AI adds an impact assessment, independent review and a signed risk acceptance",
    "A deployed use case whose ATO answer is No is a finding against the agency's own policy",
  ], 13.5);
  callout(s, "Signatures", Math.max(pic.bottom, pb) + 0.25, 0.85, "FaScaleBalanced", HEX.teal, "Line up the two signatures: ",
    "both decision-makers read the same identity record of what the system is and what it can reach.");
  sources(s, "Sources: OMB M-25-21 §4(b)(ii), fns 22 and 29; OMB M-25-22 §4(e)(i); OMB Circular A-130. The one-record design and identity reading are program design. Book 17, Ch 02, Ch 08.");
  notes(s,
`Put the rules together and you get one answer: an AI system operating as, or inside, an information system is authorized through the agency's existing process. M-25-22 says AI systems operated as an information system must receive an authorization to operate prior to deployment. M-25-21 says, in footnotes, that A-130's authorization requirements continue, and that accepting risk for an AI use case is separate from, and does not supersede, system authorization.

What M-25-21 adds for high-impact AI is a second decision: the impact assessment, an independent review by someone not involved in development, and a risk acceptance signed by the person accepting the risk. So a high-impact use case needs both before it deploys, possibly from different people: the official accountable for the mission outcome, and the authorizing official. Chapter 08 calls them two tracks, and neither stands in for the other. One person holding both roles signs twice, on two documents.

The program ties both decisions to one record, the identity record in the middle of the figure. And it reads the inventory accordingly: a deployed use case whose ATO answer is No is a finding against the agency's own authorization policy, not against M-25-21.

For engineers, the program's reading turns the seven practices into identity questions. Was the system tested with its production permissions? Are its sign-ins logged under its own identity? Which accounts operate it, and did those people train? And who can disable its identity, and has anyone tried?`,
  "Book 17, Chapter 02 — \"There is no AI-specific ATO,\" \"The seven minimum practices,\" \"Reading the rules as identity obligations\"; Chapter 08 — Who Owns AI Identity Governance, \"Keeping the roles apart.\"");
}
endModule("Module 1");

// ================================================================== 8 Module 2 divider
{
  const s = divider(P1, "Module 2: The inventory and the kinds of AI identity", "Part 1 — The identity and the inventory  ·  Chapters 03–04",
    ["The inventory read as identity data, and why a use case isn't an identity", "Status versus evidence in the high-impact fields", "Whose token, Agent ID's objects, cloud availability, six kinds"], 13);
  notes(s,
`Module 2: the inventory and the kinds of AI identity. The first job is knowing what you have, and the agency already has a list. The question is what that list can tell an identity team.

So we'll read the federal AI use-case inventory as an identity source: what anchors a record, what's only a lead, what's missing, where the join belongs, and what the high-impact fields can evidence. Then we sort the identities: by whose token the system presents, inside the Agent ID object model, by what each government cloud has today, and into six kinds.`,
  "Book 17, Chapter 03 — The AI Use-Case Inventory as an Identity Source; Chapter 04 — Kinds of AI Identity: Workloads, Agents and Delegated Access.");
}

// ================================================================== 9 Anchors and gaps
{
  const s = content(P1, "The inventory read as identity data: anchors and gaps");
  tag(s, "What");
  const pic = img(s, "ch03-anchors-and-gaps", 0.6, 1.5, 7.4, 3.6);
  const pb = panel(s, "File", 8.25, 1.5, 4.5, null, HEX.navy, HEX.navyTint, "WHAT THE 2025 FILE SHOWS", null, [
    "3,611 use cases; 1,818 deployed or piloted; 445 high-impact (Apr. 13, 2026)",
    "1,115 rows have no contact; the rest use only 189 addresses",
    "Live use cases: 681 ATO yes, 596 no, 203 blank",
    "36 columns; none for principal, credential, permissions or owner",
  ], 13.5);
  callout(s, "Sort", Math.max(pic.bottom, pb) + 0.25, 0.85, "FaFilter", HEX.navy, "Anchors key, leads verify, gaps discover: ",
    "id, bureau and stage anchor a record; contact, vendor and ATO name need checking; access facts are missing.");
  sources(s, "Sources: OMB 2025 AI Use Case Inventory: README (Apr. 13, 2026), data dictionary, individually reported CSV (counts computed by the program); NIST SP 800-53 Rev. 5 IA-4. Book 17, Ch 03.");
  notes(s,
`The use-case inventory is the only government-wide list of federal AI, built to tell the public what agencies use AI for. Read with an identity team's eyes, it still gives you something.

OMB's data dictionary has 36 columns, and the program sorts them three ways, as the figure does. Anchors a record can key on: id, which keeps its value year to year and is never reused, the discipline IA-4 asks of identifiers; agency_bureau, the placement once it's normalized from free text; and development_stage, a lifecycle state in which Retired is a leaver event. Leads you have to check: the contact, the vendor, the ATO answer and system name, and classification, where Agentic AI is the class most likely to hold its own credentials. And gaps, the things a record needs most: principal, credential, permissions, named owner and risk acceptor, delegated or autonomous.

The numbers are from OMB's consolidated 2025 file, counted by the program. 1,115 of 3,611 rows have no contact at all, and the rest use only 189 distinct addresses, so the public file names a mailbox, not an owner. Among live use cases, 681 answer yes to the ATO question, 596 no and 203 are blank.

And the unit is wrong. 1,818 counts deployed and piloted use cases, not systems; by the file's own stage column it's 1,480, because 338 rows have no stage. The next slide is why that decides the design.`,
  "Book 17, Chapter 03 — The AI Use-Case Inventory as an Identity Source, \"What the inventory is,\" \"What it records,\" \"Reading the fields as identity data.\"");
}

// ================================================================== 10 Join
{
  const s = content(P1, "A use case isn't an identity: join on the directory");
  tag(s, "What");
  subhead(s, "Gaps head", "IDENTITY FACTS THE INVENTORY DOESN'T RECORD (CONTROL MAPPING IS PROGRAM DESIGN)", 0.6, 1.5, 7.6);
  table(s, "Gaps", 1.85, [2.95, 1.45, 3.15], ["Identity fact", "Control", "Where it actually lives"], [
    ["The principal it signs in as", "IA-4, IA-9, CM-8", "The directory: service principals, managed and agent identities"],
    ["Credential type and expiry", "IA-5", "The application and blueprint objects"],
    ["Permissions held", "AC-6, AC-2", "Grants and role assignments"],
    ["A named, accountable owner", "AC-2", "The identity system's owner or sponsor fields"],
    ["The person who accepted the risk", "—", "The signed impact assessment"],
    ["Delegated or autonomous access", "AC-6, AU-12", "How the system obtains tokens"],
    ["Last sign-in and activity", "AC-2, CA-7", "Sign-in and audit logs"],
  ], { fontSize: 12, limit: 6.5 });
  panel(s, "Join", 8.4, 1.5, 4.35, null, HEX.teal, HEX.tealTint, "THE JOIN (PROGRAM DESIGN)", null, [
    "One use case can run as many principals; one principal can serve many use cases",
    "The record carries the inventory ID; every directory object points back",
    "Custom security attributes can hold the reference and later drive Conditional Access",
    "Join against the agency's own submission: the public file lacks 704 IDs",
  ], 13.5);
  sources(s, "Sources: OMB 2025 data dictionary, guidance and CSV; M-25-21 §4(b)(ii); NIST SP 800-53 Rev. 5; Microsoft Learn: agentIdentity resource, Conditional Access for agents. Book 17, Ch 03.");
  notes(s,
`The table is the identity facts the inventory doesn't record, the control each serves, and where it actually lives: the principal in the directory; credential type and expiry on the application and blueprint objects; permissions in grants and role assignments; the owner in the identity system's owner or sponsor fields; the risk acceptor's signature in the impact assessment; delegated or autonomous in how the system gets tokens; and last sign-in in the logs. The control mapping is program design.

The harder problem is the unit. A use case is a scenario, and scenarios don't sign in. One assistant can have an app registration for its front end, a managed identity for its retrieval index, an agent identity for its actions and an API key for a third-party model. One shared platform, or a commercial product reported in aggregate, can serve dozens of use cases under one service principal. And the public file has no stable key: 704 rows lack an identifier and 13 repeat.

So the program puts the join on the identity side. The identity record carries the inventory ID, and every directory object the system uses carries a reference back. In Entra ID, custom security attributes can hold that reference on service principals and agent identities, and Conditional Access can target agents by attribute, so the same tag can later drive policy. The join runs from the directory, where access is decided, and against the agency's internal submission, the only version guaranteed to carry the ID and the real contact.`,
  "Book 17, Chapter 03 — \"Gaps,\" \"A use case isn't an identity.\"");
}

// ================================================================== 11 Status not evidence
{
  const s = content(P1, "High-impact fields report status, not evidence");
  tag(s, "What");
  const pic = img(s, "ch03-status-not-evidence", 0.6, 1.5, 7.6, 3.55);
  const pb = panel(s, "Answers", 8.45, 1.5, 4.3, null, HEX.amber, HEX.amberTint, "IN THE 2025 FILE", null, [
    "Nine hi_* fields: every one of the seven practices has at least one",
    "Answers are Yes, In-progress or waived; none carries a document",
    "227 deployed high-impact use cases: 101 answered none of the fields",
    "Testing: 81 in progress, 44 yes, as submitted in Dec. 2025",
  ], 13.5);
  callout(s, "Three", Math.max(pic.bottom, pb) + 0.25, 0.9, "FaClipboardCheck", HEX.teal, "Three practices identity evidences: ",
    "ongoing monitoring, operator training and the fail-safe, from the system's own logs, a named operators' group and a tested disable.");
  sources(s, "Sources: OMB 2025 data dictionary (hi_* columns 28–36) and CSV (counts computed by the program); OMB M-25-21 §4(b); OMB 2025 AI reporting guidance. Book 17, Ch 03.");
  notes(s,
`The 2025 inventory has nine high-impact fields, and every one of M-25-21's seven practices has at least one, including operator training and public consultation, which the 2024 schema lacked. The figure lays out each practice, the field that reports it, and the evidence that lives elsewhere.

But the fields hold answers, not artifacts: Yes, In-progress, or waived by the Chief AI Officer. None carries a document, a log, a review date or a name. A Yes for ongoing monitoring says the agency believes it monitors, not what was monitored or found. The inventory can report all seven practices and evidence none of them, Book 13's line between attestation and evidence.

The published data shows the distance. Of 227 deployed high-impact use cases, 101 answered none of the risk fields, and among the rest In-progress outnumbers Yes for every practice; for testing, 81 to 44. Those answers predate the April 2026 deadline, so they describe agencies mid-way, not in breach. They also show the answer is a snapshot while access changes daily.

The three highlighted rows are the identity program's to evidence as a by-product: ongoing monitoring, from the system's own sign-in and audit logs and drift findings; operator training, checked against the members of a named operators' group; and the fail-safe, a named person with the right to disable the identity and a disable that's been tested. For the other four, the record points to where the evidence is kept, so an assessor following it finds all seven.`,
  "Book 17, Chapter 03 — \"What the high-impact fields can and can't evidence.\"");
}

// ================================================================== 12 Whose token
{
  const s = content(P1, "Whose token does it present? Three subjects and a key");
  tag(s, "What");
  img(s, "ch04-whose-token", 0.6, 1.45, 12.15, 2.55);
  table(s, "Subjects", 4.15, [2.0, 3.25, 3.3, 3.6], ["", "Delegated (on-behalf-of)", "Autonomous (app-only)", "Agent's user account"], [
    ["Token subject", "The signed-in user; the agent is the actor", "The agent identity", "The agent's user account"],
    ["Conditional Access", "User policies; a policy on the agent identity doesn't apply", "Agent identity or blueprint; Block only", "Agent-user targets (preview); not in \"All users\""],
    ["Risk", "Attributed to the user, not the agent", "Agent risk detections (preview condition)", "Agent risk"],
    ["Release stage", "Part of the GA platform", "GA identity; agent risk in preview", "Preview; Frontier program tenants only"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: Conditional Access for agents; Target agent identities; Conditional Access: Grant; ID Protection for agents; Agent 365 identity (Oct. 2026). Book 17, Ch 04.");
  notes(s,
`What kind of identity an AI system has is decided by whose token it presents, not by its model. A model has no account; the application, orchestration and connectors around it do. The figure gives the three answers Entra ID can see and the one it can't.

Delegated, on-behalf-of: the user is the token's subject and the agent the actor. The user's policies and consent apply; a policy aimed at the agent identity doesn't reach this flow; and risk is attributed to the user. Note the ceiling: a delegated agent can't do more than the user, and can do everything the user can. The narrowing comes from consent.

Autonomous, app-only: the agent identity is the subject. Agents don't do passwords or MFA, and the only Conditional Access control for an agent identity is Block, with agent risk, in preview, the only condition. Least privilege does most of the work.

Agent's user account: a user paired one-to-one with an agent identity, for a mailbox, licenses or user-only systems; preview, in Frontier program tenants only. Policies targeting All users don't include it and it can't be targeted by group, so a tenant whose baseline targets All users has, by default, no Conditional Access on agents' user accounts.

Hence Microsoft's guidance: a separate policy for each token subject an agent uses. And the red path again: an API key outside Entra ID means no token, no policy and no sign-in log.`,
  "Book 17, Chapter 04 — Kinds of AI Identity: Workloads, Agents and Delegated Access, opening section and \"Delegated and autonomous access.\"");
}

// ================================================================== 13 Agent ID objects
{
  const s = content(P1, "Agent ID: the blueprint is the credential boundary");
  tag(s, "What");
  img(s, "ch04-agent-id-objects", 0.6, 1.5, 5.9, 4.95);
  const a = panel(s, "Objects", 6.75, 1.5, 6.0, null, HEX.navy, HEX.navyTint, "THE OBJECT MODEL (PLATFORM GA, APRIL 2026)", null, [
    "Blueprint: credentials, inheritable permissions, app roles, publisher",
    "Blueprint principal: in each tenant, acquires tokens and creates agent identities",
    "Agent identity: a special service principal with no credential of its own",
    "Agent's user account: optional, one-to-one, preview (Frontier only)",
  ], 13.5);
  panel(s, "Consequences", 6.75, a + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "THREE CONSEQUENCES", null, [
    "One credential, every agent: one operation on the blueprint reaches them all",
    "Declared isn't granted: real access is consented inheritance plus direct grants and roles",
    "Every agent has a human of record: a sponsor is required at creation",
  ], 13.5);
  sources(s, "Sources: Microsoft Learn: Governing agent identities; Agent ID design patterns; Agent identities; Agent's user account; Agent 365 identity; Entra releases (April 2026). Book 17, Ch 04.");
  notes(s,
`Before Agent ID, AI ran as workload identities, and most still does: app registrations and service principals, managed identities whose credentials nobody sees, and workload identity federation, which trusts an external issuer so the workload holds no secret. Agent ID, generally available since April 2026, adds the four objects in the figure.

The blueprint is a template for a kind of agent: credentials, inheritable permissions, app roles and publisher, and on Azure it can be federated to a managed identity. The blueprint principal, created in each tenant, acquires tokens, creates agent identities and appears in the audit logs for the blueprint. The agent identity is a special service principal with its own object ID, sponsor and permissions, and no credential of its own; it's single-tenant, while a blueprint can be multitenant. The agent's user account is the optional, preview user object.

Three consequences. The blueprint is the credential boundary: every agent shares its credential, so group only agents that can safely share it, and know that one operation on the blueprint, a block, a revoked grant, a disable, reaches every agent of that kind, including future ones. Declared isn't granted: blueprint permissions need admin consent, Azure roles go on each agent directly, and real access is a sum a review has to read. And every agent has a human of record, because a sponsor is required at creation.

Agent identities also appear unplanned: from Copilot Studio, from Foundry projects that share one identity until an agent is published, from App Service and Functions, and from non-Microsoft agents through a sidecar or federation.`,
  "Book 17, Chapter 04 — \"Workload identities: what most AI runs as today,\" \"Agent identities: Microsoft Entra Agent ID,\" \"Which products create agent identities.\"");
}

// ================================================================== 14 Release stage and clouds
{
  const s = content(P1, "What's GA, what's preview, and what each cloud has");
  tag(s, "What");
  const tb = table(s, "Clouds", 1.5, [3.75, 3.0, 2.55, 2.85], ["Capability (as of October 2026)", "Release stage", "GCC", "GCC High and DoD"], [
    ["Agent ID platform: blueprints, agent identities, sponsors", "GA, April 2026", "Available, with listed gaps", "Not published; treat as unavailable"],
    ["Agent's user account", "Preview; Frontier tenants only", "None published", "None published"],
    ["Conditional Access for agents", "Agent targets preview; Block only", "Listed for delegated access", "Not published"],
    ["ID Protection for agents", "Preview; detections offline", "Listed with Conditional Access", "Not stated; confirm"],
    ["Sponsor lifecycle workflows; access packages", "Workflows GA, May 2026", "Available", "Not published"],
    ["Purview audit and DLP, network controls for agents", "—", "Not available", "Not published"],
    ["Workload identity Conditional Access and risk", "GA; Workload ID Premium", "Available", "Available in Azure Government"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "FedRAMP", tb + 0.2, 0.85, "FaCloud", HEX.amber, "FedRAMP status: ",
    "as of Oct. 1, 2026, Agent 365 meets all FedRAMP High controls its assessor reviewed; final authorization is pending.");
  sources(s, "Sources: Microsoft Learn: Agent 365 service description; Entra feature availability (Azure Government); Conditional Access for agents; Agent 365 CLI for US Gov. Book 17, Ch 04, 06.");
  notes(s,
`The agency's cloud decides what it can use. This is Microsoft's documentation as of October 2026; re-check it before each phase gate.

The Agent ID platform is generally available for all Entra customers. GCC has a documented subset in the Agent 365 service description: the registry, governance actions, access packages, sponsor lifecycle policies, Conditional Access and identity protection for agents with delegated access, and device compliance. Network controls, Purview audit, DLP and most Defender agent detections aren't listed. So a GCC agency can govern agent identity and access, but can't yet get Microsoft's audit and data protection for agent interactions.

GCC High and DoD have no published availability: Entra's Azure Government feature list has no Agent ID entries, and configurable endpoints don't guarantee a feature exists. The program treats agent identities there as unavailable until Microsoft confirms otherwise in writing.

Licensing is its own trap. Conditional Access for agents needs Microsoft 365 E7, or Agent 365 with Entra ID P1 or Microsoft 365 E3; ID Protection for agents needs P2 during preview; workload identity Conditional Access needs Workload ID Premium, which is listed for Azure Government.

And authorization is pending: as of October 1, 2026, Agent 365 meets all FedRAMP High controls its assessor reviewed, with final authorization pending, so check current status yourself. The program builds on what's generally available in its own cloud and records preview as watch items. Where agent identities aren't available, the same governance applies to the service principals and managed identities agents run as.`,
  "Book 17, Chapter 04 — \"Release stage, licensing and government clouds\"; Chapter 06 — Credentials, Least Privilege and Access Policy for AI, \"Release stage and government-cloud availability.\"");
}

// ================================================================== 15 Six kinds
{
  const s = content(P1, "Six kinds of AI identity, and where the risk sits");
  tag(s, "What");
  const tb = table(s, "Kinds", 1.5, [2.05, 2.6, 2.4, 2.85, 2.25], ["Kind (program design)", "The directory holds", "Preferred credential", "Policy surface", "Ends when"], [
    ["Delegated assistant", "Consent grants; no standing access", "The user's session", "User policies; consent scope", "Consent revoked or app removed"],
    ["Workload-identity AI", "Service principal or managed identity", "Managed identity or federated credential", "Workload CA, single-tenant only; grants", "Resource deleted or app retired"],
    ["Agent identity", "Blueprint, principal, agent identities", "Blueprint federated to a managed identity", "Block on agents or blueprints; access packages", "Sponsor or workflow disables and deletes"],
    ["Agent with a user account", "Agent identity plus a paired user", "Through the agent identity only", "Agent-user policies (preview)", "Both objects removed together"],
    ["Vendor-hosted AI", "A multitenant service principal, or nothing", "The vendor's", "Consent, permissions, monitoring", "The integration is offboarded"],
    ["Unmanaged key", "Nothing: a finding", "Replace with one of the above", "None", "Never, until found"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "Risk", tb + 0.2, 0.85, "FaTriangleExclamation", HEX.red, "The last two rows carry most of the risk: ",
    "a vendor service sits outside workload policy, and a raw key has no identity at all until it's found.");
  sources(s, "Sources: Microsoft Learn: Conditional Access for workload identities; Agent 365 identity; Disable agent identities; Book 15, Ch 06. Classes are program design. Book 17, Ch 04.");
  notes(s,
`The program classifies every AI system it finds by the kind of identity it uses. The classes are program design; the behavior is Microsoft's.

A delegated assistant holds consent grants and no standing access; its controls are user policies and consent scope, and it ends when consent is revoked or the app removed. Workload-identity AI runs as a service principal or managed identity with two owners on the app, ideally on a managed identity or federated credential. Its Conditional Access is narrow: single-tenant service principals only, assigned directly, Block only, with managed identities and multitenant apps outside it. An agent identity has a required sponsor, a blueprint federated to a managed identity, Block policies on agents or blueprints, and access packages; it ends when the sponsor or a workflow disables and deletes it. An agent with a user account adds a manager and preview agent-user policies, and both objects go together.

The last two rows carry most of the risk. A vendor-hosted service is usually a multitenant service principal: visible, but outside workload policy, so its controls are the consent baseline, permissions, monitoring and Book 15's SaaS verdict. And an unmanaged key is nothing in the directory: no owner, no policy, no log, and no end until it's found.

Everything above those rows has a place to record an owner, a credential to rotate or eliminate, and an object to disable. Part 2 builds on that.`,
  "Book 17, Chapter 04 — \"Policy on workload identities,\" \"Classifying the AI estate.\"");
}
endModule("Module 2");

// ================================================================== 16 Module 3 divider
{
  const s = divider(P2, "Module 3: Owners, lifecycle, credentials and privilege", "Part 2 — Governing it and proving it  ·  Chapters 05–06",
    ["Owner, sponsor and manager, and the program's rule for each", "The lifecycle from the sponsor's HR events; retirement and orphans", "Credentials, least privilege, Conditional Access and tool boundaries"], 14);
  notes(s,
`Module 3: owners, lifecycle, credentials and privilege. Part 1 found the AI identities and sorted them. Now we govern them, and the order matters: an AI identity needs an accountable human before anything else, because every later decision routes to that person.

So: the three relationships Agent ID records and the program's rule for each; the lifecycle from creation through the sponsor's own HR events to retirement and orphans; credentials without stored secrets and no standing privilege; Conditional Access per token subject; and the three boundaries on what an agent can call.`,
  "Book 17, Chapter 05 — Owners, Sponsors and the AI Identity Lifecycle; Chapter 06 — Credentials, Least Privilege and Access Policy for AI.");
}

// ================================================================== 17 Owner, sponsor, manager
{
  const s = content(P2, "Owner, sponsor and manager, and the program's rule");
  tag(s, "Who");
  const tb = table(s, "Roles", 1.5, [1.15, 2.25, 1.6, 2.45], ["Role", "What it means", "Required?", "What it can do"], [
    ["Owner", "Technical administrator: setup, configuration, credentials", "Optional; users or service principals, not groups", "Edit settings and credentials; disable, re-enable, restore, hard-delete"],
    ["Sponsor", "Business accountability: purpose, lifecycle, reviews, retention", "At least one on each agent identity and blueprint, at creation", "Disable, soft-delete, change sponsors; can't re-enable or restore"],
    ["Manager", "Places an agent's user account in the hierarchy", "Optional", "Request access packages for the user account"],
  ], { fontSize: 13, limit: 5.6 });
  const pb = panel(s, "Rule", 8.25, 1.5, 4.5, null, HEX.teal, HEX.tealTint, "THE PROGRAM'S RULE (DESIGN)", null, [
    "Sponsor: a federal employee mastered in HR",
    "Co-sponsor: a small dynamic group of the office's stewards",
    "Technical owner: a named person or the deployment service, never the sponsor",
    "The inventory record carries object ID, blueprint and sponsor",
    "Administrators sponsor nothing",
  ], 13.5);
  callout(s, "Defaults", Math.max(tb, pb) + 0.2, 0.9, "FaUserTie", HEX.navy, "Defaults decide accountability: ",
    "the creator becomes sponsor and a blueprint's creator its owner, so the program sets \"Users can create agent blueprints\" to No.");
  sources(s, "Sources: Microsoft Learn: Administrative relationships in Agent ID; Create an agent identity blueprint; agentIdentityBlueprint resource. The program's rule is design. Book 17, Ch 05.");
  notes(s,
`An agent has no hire date and no separation date, so its lifecycle has to hang from a person who does. Agent ID records that person through three relationships, separate from administrative roles.

The owner is the technical administrator: settings and credentials. Owners are optional, users or service principals but not groups, and can disable, re-enable, restore and hard-delete. The sponsor is business accountability: purpose, lifecycle, access reviews and retention, required on every agent identity and blueprint at creation, up to 100 of them, no more than five groups. Microsoft deliberately gives the sponsor nondestructive power: disable, soft-delete and change sponsors, but not re-enable or restore. The manager places an agent's user account in the hierarchy.

The creation defaults decide who's accountable when nobody chose. A user creating an agent through an app becomes its sponsor; administrators aren't defaulted; and a blueprint's creator becomes owner of the blueprint and its principal, able to create agents without any Agent ID role. Left alone, most agents are sponsored and owned by whoever built them: a developer, a contractor, a pilot user.

So the program sets it explicitly. The sponsor is a federal employee mastered in HR, normally the official accountable in the inventory; a contractor can build an agent but not be its only sponsor. A co-sponsor is a small dynamic group of the office's stewards, built from the organization attribute. The technical owner is a named person or the deployment service, never the sponsor, so whoever decides the agent should exist doesn't hold its credentials. The inventory record carries object ID, blueprint and sponsor. Administrators sponsor nothing.`,
  "Book 17, Chapter 05 — Owners, Sponsors and the AI Identity Lifecycle, \"Three accountable relationships,\" \"What creation sets automatically,\" \"The program's rule: two named humans and a record,\" \"Creation.\"");
}

// ================================================================== 18 Lifecycle
{
  const s = content(P2, "The sponsor's HR events have to reach the agent");
  tag(s, "How");
  img(s, "ch05-agent-lifecycle", 0.6, 1.5, 5.0, 4.95);
  const a = panel(s, "Mover", 5.85, 1.5, 6.9, null, HEX.amber, HEX.amberTint, "WHEN THE SPONSOR MOVES OR LEAVES", null, [
    "Lifecycle Workflows transfers sponsorship to the manager (GA, May 2026)",
    "The trigger is HR's own mover and leaver workflow, not a separate IT process",
    "A transfer is provisional: ten business days to confirm, reassign or retire (program design)",
  ], 13.5);
  panel(s, "Expiry", 5.85, a + 0.2, 6.9, null, HEX.teal, HEX.tealTint, "EXPIRY IS THE REVIEW", null, [
    "Access only through access packages with an end date, never standing direct grants",
    "A sponsor who ignores the expiry notice removes the access",
    "Maximum durations by risk tier, plus a quarterly accountability review (program design)",
  ], 13.5);
  sources(s, "Sources: Microsoft Learn: Agent identity sponsor tasks; Lifecycle Workflows templates; Access packages for agents; Agent ID best practices; Entra releases (May 2026). Book 17, Ch 05.");
  notes(s,
`The lifecycle, as the figure runs it. Creation is the joiner event: nothing goes to production without an approved inventory entry. Microsoft's best practices agree: plan blueprints first, one identity per agent instance, sponsor and owner at creation, and a production handshake in which an identity administrator confirms blueprint, sponsor, consented permissions, Conditional Access coverage and group placement. Access comes through access packages, not direct grants.

The sponsor moving or leaving is the event this program exists to catch. An agent doesn't leave; its sponsor does. Lifecycle Workflows carries sponsorship to the departing sponsor's manager, with notification tasks and templates for leavers and role changes, generally available since May 2026. The program adds two rules. The trigger is HR's: these tasks join the same HR-driven mover and leaver workflows every person runs through. And a transfer is provisional: the inheriting manager has ten business days, a program setting, to confirm, reassign or retire. A manager who inherits a dozen agents is accountable in the directory, not yet in fact.

Reorganization re-derives through the dynamic group sponsor; a change of purpose is a new request with a new access package, never a widened grant.

And recertification inverts the usual weakness. As an agent's package nears its end date, the sponsor can request an extension, which may need new approval, or let it lapse. Ignore a human review and access often stays; ignore an agent's expiry and access ends. The program caps durations by risk tier, never creates agent packages without an end date, and adds a quarterly review for missing sponsors, stale metadata or no activity.`,
  "Book 17, Chapter 05 — \"The lifecycle, event by event,\" \"Creation,\" \"When the sponsor moves or leaves,\" \"Reorganization,\" \"Recertification: expiry is the review.\"");
}

// ================================================================== 19 Retirement and orphans
{
  const s = content(P2, "Retirement and orphans: disable first, then delete");
  tag(s, "How");
  const W = 3.95;
  const a = panel(s, "Retire", 0.6, 1.5, W, null, HEX.navy, HEX.navyTint, "RETIREMENT (PLATFORM BEHAVIOR)", null, [
    "Disable stops authentication and keeps every object",
    "Deleting a blueprint cascades to its children, asynchronously",
    "Soft-deleted objects restore for 30 days",
    "Deleted objects count toward quota: 250 agents per blueprint, app-only",
  ], 13);
  const b = panel(s, "Orphan", 0.6 + W + 0.15, 1.5, W, null, HEX.red, HEX.redTint, "ORPHANED WHEN (PROGRAM DESIGN)", null, [
    "No sponsor confirmed within the grace period",
    "No owner and no owning service",
    "No sign-in over the inactivity window",
    "Inventory record closed, or never existed",
    "Its blueprint was deleted",
  ], 13);
  const c = panel(s, "Fallback", 0.6 + 2 * (W + 0.15), 1.5, W, null, HEX.amber, HEX.amberTint, "WHERE AGENT FEATURES AREN'T AVAILABLE", null, [
    "Govern as applications: two owners, a reference to the inventory record",
    "A task extension on the sponsor's HR workflow opens a ticket per agent",
    "People governance doesn't license agents: Agent 365 or E7",
  ], 13);
  callout(s, "Suspend", Math.max(a, b, c) + 0.25, 0.9, "FaUserXmark", HEX.red, "The orphan response: ",
    "once the identity governance officer confirms it, a person disables it, never automation; the office has 30 days to decide.");
  sources(s, "Sources: Microsoft Learn: Agent identity deletion; Manage agent identities; Governing agent identities; ID Governance licensing. Orphan rules are program design. Book 17, Ch 05.");
  notes(s,
`Retirement is the leaver event, in two steps the program keeps apart. Disable stops authentication and keeps every object, the right move to stop activity or investigate. Delete removes the object, and deleting a blueprint or its principal cascades to every child agent identity and user account.

The details matter. Soft-deleted objects restore for 30 days. The cascade runs asynchronously, possibly hours or days later, each child deletion its own audit entry. And deleted objects still count toward quota, including 250 agent identities per blueprint with app-only permissions. So the program disables, records the decision and the sponsor's attestation in the inventory, lets packages lapse, waits an observation period, then deletes, and the logs carry the evidence afterward.

An agent is orphaned when any anchor fails: no sponsor confirmed after a transfer; no owner or owning service; no sign-in over the inactivity window; no inventory record; or a deleted blueprint, which leaves children that can't authenticate but remain. Once the identity governance officer confirms it, a person disables the agent; disabling is never automatic. The sponsoring office then has 30 days to name a sponsor or retire it.

Where agent features aren't available, in GCC High and DoD or for agents on ordinary service principals, the program runs the same lifecycle on application objects: two owners, a reference to the inventory record that names the sponsor, end dates, and a task extension on the sponsor's HR workflows that opens a ticket per agent. Note that governance of people doesn't license governance of agents; those features need Agent 365 or Microsoft 365 E7. That path is weaker, and the package should say so.`,
  "Book 17, Chapter 05 — \"Retirement,\" \"The orphaned agent,\" \"Release stage and government-cloud availability,\" \"Where the agent features aren't available.\"");
}

// ================================================================== 20 Credential order
{
  const s = content(P2, "Credential order: no stored secrets on the blueprint");
  tag(s, "How");
  img(s, "ch06-credential-order", 0.6, 1.5, 6.6, 4.95);
  const a = panel(s, "Enforce", 7.4, 1.5, 5.35, null, HEX.navy, HEX.navyTint, "ENFORCING THE ORDER", null, [
    "The app management policy blocks new secrets and caps certificates at 180 days; blueprints are covered",
    "SCuBA draft MS.AAD.5.5v1–5.7v1 (SHOULD): not in ScubaGear v1.8.0, not BOD 25-01",
    "Certificates: key in Key Vault or an HSM, rotated at least annually",
    "Separate credentials per environment",
  ], 13);
  panel(s, "Keys", 7.4, a + 0.2, 5.35, null, HEX.red, HEX.redTint, "THE KEYS AN AGENT'S TOOLS USE", null, [
    "An API key bypasses Entra ID token issuance; no policy applies",
    "Unavoidable: in a vault, a named owner, a rotation date, an inventory exception",
  ], 13);
  sources(s, "Sources: Microsoft Learn: Agent 365 identity; Create an agent identity blueprint; Agent ID best practices; CISA SCuBA Entra ID baseline §5; ScubaGear v1.8.0; BOD 25-01. Book 17, Ch 06.");
  notes(s,
`An agent can't be asked for a second factor; agent identities don't use passwords or authenticator apps. So everything is decided in advance, starting with the credential.

An agent identity has no credential of its own; the blueprint does, and gets tokens for every agent made from it, so a compromised blueprint credential affects all of them. The figure is the order of preference, the same as Book 04's for applications. First, a managed identity as a federated credential on the blueprint, Microsoft's production recommendation, for code running on Azure. Second, workload identity federation for agents elsewhere; approving one means approving every workload that issuer vouches for under that subject. Third, a certificate with its key in Key Vault or an HSM, rotated at least annually. Last, a client secret, for development and test only. Keep credentials separate per environment, and check the sign-in logs that agents use the credential you intended.

Enforcing it: a blueprint is an application object, so the app management policy that blocks new client secrets and caps certificates at 180 days covers blueprints too, and a secret on a production blueprint is a finding. CISA's development text for the Entra baseline adds three SHOULD policies in the same direction; they're not in ScubaGear v1.8.0 or BOD 25-01, and the 180-day cap already meets them.

Then the keys an agent's tools use. An API key bypasses Entra ID entirely, so the agent's identity, policy and logs say nothing about that call. Use Entra-issued tokens wherever the service accepts them; where a key is unavoidable, keep it in a vault the agent can read, with a named owner, a rotation date and an inventory exception.`,
  "Book 17, Chapter 06 — Credentials, Least Privilege and Access Policy for AI, \"No stored secrets,\" \"Enforcing the order,\" \"When the agent reaches something Entra doesn't protect.\"");
}

// ================================================================== 21 Least privilege
{
  const s = content(P2, "Least privilege: Microsoft's block list is only a floor");
  tag(s, "How");
  const W = 3.95;
  const a = panel(s, "Mode", 0.6, 1.5, W, null, HEX.navy, HEX.navyTint, "CHOOSE THE ACCESS MODE FIRST", null, [
    "On-behalf-of for interactive agents: the user's policies and consent apply",
    "App-only only when no user is present, with the reason in the inventory",
    "An agent's user account only for a mailbox, Teams presence or a user-only API",
  ], 13);
  const b = panel(s, "Floor", 0.6 + W + 0.15, 1.5, W, null, HEX.red, HEX.redTint, "BLOCKED ISN'T LEAST PRIVILEGE", null, [
    "Blocked: the most privileged directory roles and high-risk Graph permissions",
    "Still allowed: Exchange, SharePoint, Teams and Power Platform admin roles",
    "Inherited permissions: never allAllowed for application roles",
  ], 13);
  const c = panel(s, "Standing", 0.6 + 2 * (W + 0.15), 1.5, W, null, HEX.teal, HEX.tealTint, "NO STANDING PRIVILEGED ROLE", null, [
    "1  Delegated, through a person's own PIM activation",
    "2  Time-bound, via an expiring access package (Entra roles: preview)",
    "3  A time-bound active PIM assignment approved by ticket",
  ], 13);
  callout(s, "Defect", Math.max(a, b, c) + 0.25, 0.9, "FaUserShield", HEX.teal, "A permanent privileged need is a design defect: ",
    "fix it rather than renew it; review privileged assignments under AC-6(7) and log their use under AC-6(9).");
  sources(s, "Sources: Microsoft Learn: Authorization in Agent ID; Inheritable permissions; PIM; ID Governance licensing; SP 800-53 AC-6. The no-standing-role rule is design. Book 17, Ch 06.");
  notes(s,
`Least privilege starts with the access mode, because it decides the permission type and who the token represents. Microsoft's guidance: on-behalf-of for interactive agents, so the user's policies and consent apply; app-only only for autonomous agents with only what they need; and no application permissions where delegated would do, since application grants are tenant-wide and need admin consent. The program records the reason for app-only use, and creates an agent's user account only for a mailbox, Teams presence or a user-only API.

Next, Microsoft's block list. The most privileged directory roles can't go to agents, agents can't join role-assignable groups, and certain high-risk Graph permissions can't be granted even by an administrator. That's a floor. Agents can still hold Exchange, SharePoint, Teams and Power Platform administrator roles and Global Reader, each privileged in an agency tenant, and the lists will change. So the program applies its own permission risk classification from Book 04 and treats not blocked as irrelevant.

Inherited permissions need care too. The allAllowed setting turns any future grant to the blueprint into a grant to every agent, so the program never uses it for application roles, keeps inheritance to the shared baseline, and puts role-specific access in expiring access packages. Azure roles go on each agent, scoped to the resource.

And no AI identity holds a standing privileged role; an agent with Exchange Administrator around the clock is an administrator that can't be asked for MFA. Where privilege is genuinely needed: delegated through a person's own PIM activation; time-bound through an expiring access package, where Entra roles are still preview; or a time-bound active PIM assignment approved by ticket.`,
  "Book 17, Chapter 06 — \"Least privilege for Microsoft Graph and APIs,\" \"Inherited permissions,\" \"Azure resources and other APIs,\" \"Privileged roles for AI: none standing.\"");
}

// ================================================================== 22 Conditional Access
{
  const s = content(P2, "Conditional Access follows the token subject");
  tag(s, "How");
  const tb = table(s, "Targets", 1.5, [2.3, 4.85, 5.0], ["Agent access pattern", "Policy targets", "Available controls"], [
    ["On-behalf-of a user", "The user, directly or through groups; selecting an agent identity doesn't cover it", "The user's normal controls; the token exchange is evaluated"],
    ["App-only, as the agent", "All agent identities, selected ones, a blueprint, or a custom security attribute", "Block only; the only condition is agent risk (preview)"],
    ["As the agent's user account", "Agent-user targets (preview); policies scoped to users don't apply", "Block, or require a compliant device (preview)"],
  ], { fontSize: 12, limit: 3.65 });
  const a = panel(s, "Pattern", 0.6, tb + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "BLOCK UNLESS APPROVED (PROGRAM DESIGN)", null, [
    "All agent identities, all resources, Block; exclude approved agents by attribute",
    "Set the approval attribute only in the production handshake",
    "Report-only until agent targets leave preview in the agency's cloud",
  ], 13);
  const b = panel(s, "Bounds", 6.75, tb + 0.2, 6.0, null, HEX.red, HEX.redTint, "BOUNDARIES TO PLAN AROUND", null, [
    "No policy when a blueprint creates agents, or at the token exchange step",
    "Agents' user accounts can't be targeted by group membership",
    "Agent risk: preview, offline, needs P2; alerts go to the sponsor too",
  ], 13);
  if (process.env.FIT) console.log(`  CA panels bottom ${Math.max(a, b).toFixed(2)}`);
  sources(s, "Sources: Microsoft Learn: Conditional Access for agents; Target agents; Conditional Access: Grant; Secure autonomous agents; ID Protection for agents (Oct. 22, 2026). Book 17, Ch 06.");
  notes(s,
`Conditional Access for agents evaluates whoever is the token's subject, so policy has to follow the subject. On-behalf-of: target the user; selecting an agent identity doesn't cover it. App-only: target all agent identities, selected ones, a blueprint, which covers its future agents, or a custom security attribute; Block is the only control and agent risk the only condition, in preview. Agent's user account: the preview agent-user targets; user-scoped policies don't apply; block or require a compliant device.

The pattern Microsoft recommends for autonomous agents is the left panel: all agent identities, all resources, Block, excluding approved agents by a custom security attribute such as an approval status. The program builds it in report-only mode and sets the attribute only in the production handshake, so the report shows every agent that skipped the handshake. It stays report-only until agent targets leave preview in the agency's cloud. As of October 22 the policy builder still labels them preview, and in GCC the service description lists Conditional Access for agents with delegated access, not app-only targeting, so confirm it in the tenant.

The right panel is what to plan around. No policy applies when a blueprint gets a Graph token to create agents, at the intermediate token exchange, or with security defaults on. Agents' user accounts can't be targeted by group, and agent-identity policies don't reach them. Review broad user policies, like MFA for all users, for side effects on agent flows.

ID Protection for agents adds offline detections, such as early-life malicious activity or a new blueprint credential then used. It's preview and needs P2. The program pairs a block-high-risk policy, report-only first, with the rule that risky-agent alerts go to the sponsor too, who knows what normal looks like.`,
  "Book 17, Chapter 06 — \"Conditional Access and risk policies,\" \"Status note: Book 04's preview statement still holds,\" \"ID Protection for agents.\"");
}

// ================================================================== 23 Three boundaries
{
  const s = content(P2, "Three boundaries on what an agent can call");
  tag(s, "How");
  const pic = img(s, "ch06-three-boundaries", 0.6, 1.5, 6.6, 3.85);
  const pb = panel(s, "Layers", 7.45, 1.5, 5.3, null, HEX.navy, HEX.navyTint, "WHAT EACH LAYER CAN AND CAN'T DO", null, [
    "Identity: a protected MCP server must validate tokens issued for it",
    "But MCP authorization is optional, and local servers read credentials from the environment",
    "Registry: Agent 365 Tools page; approval needs AI Administrator, via PIM",
    "Data: Purview for agents isn't in GCC; scoped permissions are the boundary",
  ], 13);
  callout(s, "Outside", Math.max(pic.bottom, pb) + 0.25, 0.9, "FaPlugCircleXmark", HEX.red, "Outside every layer: ",
    "an unregistered server, an unauthenticated tool or an API key, so each agent's approved tools are in its record and anything else is drift.");
  sources(s, "Sources: MCP specification 2026-07-28, Authorization; Microsoft Learn: Manage MCP servers; MCP options in Agent 365; API Management; Agent 365 service description. Book 17, Ch 06.");
  notes(s,
`An agent's reach is the sum of the tools it can call, and the program bounds it three times.

Layer 1 is identity: what the agent can get a token for. Each Entra-protected tool is its own audience, evaluated at issuance, so consents, app roles and access packages are the first list of what it can call. For MCP servers, the protocol's authorization specification makes a protected server an OAuth 2.1 resource server that must validate tokens were issued for it and must not pass other tokens through. But the same specification makes authorization optional, and tells local STDIO servers to take credentials from the environment. A server with no authorization, or a local one reading a key from an environment variable, sits outside Layer 1.

Layer 2 is the tool registry. Agent 365's Tools page is Microsoft's source of truth for MCP servers in the tenant; custom and third-party servers are reviewed, approved and consented centrally, and tenant-wide tool control is listed for GCC. Approval takes tenant-wide consent rights, which AI Administrator and Global Administrator have; the program uses AI Administrator through PIM, never Global Administrator. The API Management and tools gateway integrations are preview. Each agent's approved tools go in its inventory entry, so a call to an unregistered server is drift.

Layer 3 is data: labels, DLP and insider risk for agents. None of it is listed for GCC. So in GCC the data boundary comes from the identity layer: narrow delegated scopes, application permissions limited to specific sites or mailboxes where the API allows, and resource-scoped Azure roles. They're coarse, and the gap should be recorded, not assumed away.`,
  "Book 17, Chapter 06 — \"Tool and data access boundaries,\" \"Admin consent and the SCuBA consent baseline.\"");
}
endModule("Module 3");

// ================================================================== 24 Module 4 divider
{
  const s = divider(P2, "Module 4: Monitoring, the scan and authorization", "Part 2 — Governing it and proving it  ·  Chapters 07–10",
    ["Where AI sign-ins land, and shadow AI on four surfaces", "AI drift findings, and the inventory scan, agency and central", "The five questions, OSCAL and the AI clocks in the package"], 17);
  notes(s,
`Module 4: monitoring, the scan and authorization. None of Module 3 stays true by itself. A sponsor changes jobs, a developer adds a secret to unblock a test, a team connects a new tool, an office signs up for a generative AI service.

So this module compares what was declared with what's observed: where AI identities appear in the logs and what to alert on, shadow AI on four surfaces, the findings with their class, severity and route, the inventory scan, agency and central, and the evidence an authorizing official needs, in OSCAL, on the clocks AI adds.`,
  "Book 17, Chapters 07 — Monitoring, Drift and Shadow AI; 09 — Running the Inventory Scan, Agency and Central; 10 — Evidence and Authorization for AI Systems.");
}

// ================================================================== 25 Logs
{
  const s = content(P2, "Where AI sign-ins and changes land in the logs");
  tag(s, "What");
  const tb = table(s, "Logs", 1.5, [3.1, 3.05, 3.35, 2.65], ["Principal", "Sign-ins land in", "The audit log records it as", "How you know it's AI"], [
    ["App registration or service principal", "Service principal sign-ins", "Application and service principal events", "Only from the identity record"],
    ["Managed identity", "Managed identity sign-ins", "Service principal events", "Only from the identity record"],
    ["Agent identity blueprint", "Service principal sign-ins", "Add application; agentType agenticApp", "agentType; Agent type filter"],
    ["Agent identity", "Service principal sign-ins, or a user log when acting for a user", "Add service principal; agentType agenticAppInstance", "agentType; Agent type filter"],
    ["Agent's user account", "User sign-in logs", "Add user; agentType agentIDuser", "agentType; Agent type filter"],
    ["Agent acting for a user", "The user's sign-in logs", "—", "The token also identifies the calling agent"],
  ], { fontSize: 13, limit: 5.6 });
  callout(s, "Retention", tb + 0.2, 0.9, "FaDatabase", HEX.amber, "Export on day one: ",
    "Entra keeps sign-in and audit logs 30 days with P1 or P2, and Graph activity logs not at all unless they're exported.");
  sources(s, "Sources: Microsoft Learn: Entra sign-in logs; Agent ID logs; Agent ID FAQ; Agent ID best practices; Entra data retention; Conditional Access for agents. Book 17, Ch 07; Book 12, Ch 03.");
  notes(s,
`Monitoring an AI identity is the job Book 13 describes for any governed object: compare what was declared with what's observed, classify the gap, send it to someone who can act. It starts with knowing where AI lands in the logs.

Entra ID has four sign-in logs: interactive and non-interactive user, service principal and managed identity. The table walks the principals. An app registration or managed identity used by an AI system looks exactly like any other workload: nothing says it's AI, who sponsors it or which inventory entry it belongs to. Only the identity record supplies that. Agent ID objects are tidier, with an agent sign-in resource, an agent type filter and an agentType property on audit events, though audit still records the base type: a blueprint is added as an application, an agent identity as a service principal, an agent's user account as a user. And because an agent can sign in delegated or app-only, its sign-ins can land in any of the four logs.

Two cautions shape the queries. Audit logs don't distinguish agents by default, and Graph activity logs don't separate them at all, so is-this-an-agent detections belong on the sign-in and audit tables, joined. The documented Graph request for agent sign-ins is beta, so use exported tables for evidence.

Alert on what Microsoft lists: token request spikes, unexpected APIs, unfamiliar IP ranges, blueprint changes, and credentials, grants and roles added outside the deployment pipeline, plus expiring credentials and failed token acquisition.

And retention: 30 days for sign-in and audit logs with P1 or P2, none for Graph activity unless exported. An AI identity created before export began has no history.`,
  "Book 17, Chapter 07 — Monitoring, Drift and Shadow AI, \"Where AI sign-ins land,\" \"What the audit log shows, and what it hides,\" \"What to alert on.\"");
}

// ================================================================== 26 Shadow AI
{
  const s = content(P2, "Shadow AI: four surfaces, one reconciliation");
  tag(s, "What");
  const pic = img(s, "ch07-shadow-ai-surfaces", 0.6, 1.5, 7.4, 3.3);
  const pb = panel(s, "Tools", 8.25, 1.5, 4.5, null, HEX.navy, HEX.navyTint, "WHAT SEES EACH SURFACE", null, [
    "People: Defender for Cloud Apps' generative AI catalog; Global Secure Access",
    "Consent: app governance; agent consent bypasses the admin workflow",
    "Agents: Defender for Endpoint local discovery; network agent discovery (preview)",
    "Workloads: Defender CSPM AI security posture",
  ], 13);
  callout(s, "Blind", Math.max(pic.bottom, pb) + 0.25, 0.9, "FaGlobe", HEX.red, "No tool sees an API key: ",
    "endpoint and network discovery and inventory discipline are the only ways to find AI that never touches Entra ID.");
  sources(s, "Sources: Microsoft Learn: Discover AI apps and data; GSA shadow AI and agent discovery; Defender for Endpoint local agents; Defender agent inventory; Agent ID FAQ. Book 17, Ch 07.");
  notes(s,
`For users and servers, discovery mostly confirms the inventory. For AI, much of what matters was never declared, so discovery is a standing input, not a cleanup. Shadow AI shows up on four surfaces, and no tool sees more than one or two.

People: generative AI services staff use. Defender for Cloud Apps has a generative AI category of more than a thousand apps with risk assessments, to sanction, unsanction or alert on; Global Secure Access adds a network view of traffic to AI apps, SaaS MCP servers and model APIs. Neither says whether a service may hold federal data; that's Book 15's SaaS verdict.

Consent: an AI service a user connected through OAuth holds a delegated grant whether or not anyone calls it AI. And the admin consent workflow doesn't work correctly for permissions agent identities request, so those go straight to an administrator, and the consent review lists them separately.

Agents: Defender for Endpoint finds local agents, agentic IDEs and their MCP servers once it observes activity, macOS in preview, and isn't a complete software inventory. Global Secure Access agent discovery, in preview, classes each agent as managed or shadow by whether it's registered with Agent ID. That's the right test, and the program applies it to every source.

Workloads: Defender CSPM's AI posture management finds model endpoints and AI services in the agency's own clouds, including Azure Government.

Everything found is reconciled on the identity record key, never a display name. Global Secure Access isn't yet supported in GCC High and DoD. And no tool closes one gap: an agent using a static key produces no identity signal at all.`,
  "Book 17, Chapter 07 — \"Finding what nobody declared,\" \"Release stage and government-cloud availability.\"");
}

// ================================================================== 27 Findings
{
  const s = content(P2, "AI drift findings: class, severity and who decides");
  tag(s, "How");
  const tb = table(s, "Findings", 1.5, [4.2, 1.45, 2.3, 1.1, 3.1], ["Finding (program design)", "Class", "Severity", "Auto-fix?", "Routed to"], [
    ["Agentic AI system with no governed identity", "Identity", "P1", "Never", "System owner and ISSO; AO informed"],
    ["Shadow AI identity acting with credentials", "Identity", "P1", "Never", "Security operations, then the owner"],
    ["Credential or permission added outside the pipeline", "Authorization", "P1", "Never", "Security operations"],
    ["Deployed AI system with no recorded authorization", "Authorization", "P2; P1 once confirmed", "Never", "Authorizing official and ISSO"],
    ["AI identity with no accountable human", "Identity", "P2", "Never", "Identity governance officer"],
    ["No organizational placement", "Schema", "P2", "Gated", "Identity engineering"],
    ["PII with no PIA reference", "Provenance", "P2 (pinned)", "Never", "Privacy officer"],
    ["Unsanctioned generative AI service in use", "Authorization", "P2 (pinned)", "Never", "The SaaS authorization gate"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "Close", tb + 0.2, 0.9, "FaListCheck", HEX.teal, "One evidence record per finding: ",
    "keyed on the identity record, never a display name, and closed only when a later observation shows the fixed state.");
  sources(s, "Sources: Book 17, Ch 07 (findings and severities are program design); Book 13, Ch 06; Book 12, Ch 02; OMB M-25-22 §4(e)(i); NIST SP 800-53 Rev. 5 (RA-8, CM-8(3)). Book 17, Ch 07.");
  notes(s,
`Each AI finding is an instance of one of Book 13's five drift classes, with a severity the program pins. The table is program design.

The first row is the one this book exists to prevent: an agentic system with no governed identity. It's P1: halt, alert a named person, never remediate automatically, because the fix might be issuing an identity, disabling an unwanted agent, or correcting an inventory entry that called a chatbot an agent. Those are decisions, not repairs. A shadow AI identity acting with credentials is P1, to security operations first, and so is a credential or permission added with no change record.

A deployed system with no recorded authorization is P2 on the inventory answer alone, because that field can be wrong either way, and becomes P1 once the ISSO confirms it, since M-25-22 requires an ATO before deployment. Only the authorizing official accepts that risk. No accountable human includes a sponsor who left and a guest sponsor, which the platform allows and the program doesn't. PII with no PIA reference is pinned at P2, because the PIA link is optional and public-only, so its absence proves nothing. An unsanctioned generative AI service is pinned at P2 so it gets an owner and a clock instead of a dashboard tile. Only a missing placement, filled from the sponsor's organization, is ever fixed by the engine, and only as a gated change. Disabling an agent is never automatic.

Every finding is one record in Book 12's evidence contract. The asset ID is the identity record key, which maps the use-case ID, each directory object ID, the Defender agent ID and the cloud resource ID; a display-name key is rejected. In Rev. 5 the PIA control is RA-8, not PT-2. And a record closes only when a later observation shows the fixed state; a resolved ticket closes nothing.`,
  "Book 17, Chapter 07 — \"Drift: comparing what was declared with what is observed,\" \"The findings,\" \"What the engine does and doesn't do,\" \"From finding to evidence.\"");
}

// ================================================================== 28 Scan
{
  const s = content(P2, "The inventory scan: answers first, then the directory");
  tag(s, "How");
  img(s, "ch09-scan-method", 0.6, 1.5, 6.3, 4.95);
  subhead(s, "Counts head", "ANSWER CHECKS ON THE 2025 PUBLIC FILE: 1,480 LIVE USE CASES", 7.15, 1.5, 5.6);
  const tb = table(s, "Counts", 1.85, [3.35, 1.3, 0.95], ["Check", "Use cases", "Share"], [
    ["Agentic AI, no authorization answer", "14 of 38", "1%"],
    ["No authorization answer", "799", "54%"],
    ["Authorization named nothing", "58", "4%"],
    ["No contact", "488", "33%"],
    ["PII with no PIA link", "248 of 337", "17%"],
    ["At least one of the above", "1,064", "72%"],
  ], { x: 7.15, fontSize: 12, limit: 5.0 });
  panel(s, "Leads", 7.15, tb + 0.2, 5.6, null, HEX.amber, HEX.amberTint, "LEADS, NOT FINDINGS", null, [
    "Answers in a public file, not findings against any agency, and not systems",
  ], 13);
  sources(s, "Sources: OMB 2025 AI Use Case Inventory CSV and data dictionary (counts computed by the program, Oct. 21, 2026); OMB M-25-21 §3(b)(v). The scan method is program design. Book 17, Ch 09.");
  notes(s,
`The scan connects the inventory to the findings, and it's cheap because it reads answers agencies already gave. It's program design; M-25-21 requires the inventory, not a scan of it.

Step 1 loads one vintage as a fixed input, recording the file's hash and the read date so a re-run shows the same findings. It also records what the file can't support: in the 2025 consolidated file, 338 rows have no stage, and the scan reports them as stage not recorded rather than dropping them, because skipping them paints a cleaner picture than the inventory supports.

Step 2 detects in two groups. Inventory-answer checks run on live rows, and anyone with the file can run them. Directory checks only the agency can run: no identity record, no accountable sponsor, an identity with no inventory row, and a retired use case still holding access. The table is the answer checks over the public file's 1,480 live rows: 14 of 38 agentic use cases with no authorization answer, 799 with none at all, 488 with no contact, 248 of 337 with PII and no PIA link, and 72 percent hitting at least one. These are answers to reconcile, not findings against any agency, and use cases aren't systems.

Step 3 orders the work: agentic first, then authorization, owners and placement, privacy, and unreadable rows, with high-impact cases moving up. Step 4 reports one row per system and finding, routed to a named role, never a mailbox, and emitted as evidence records. Step 5 remediates with existing tools and closes only on a later observation.

Then each annual refresh compares vintages by ID: new live entries need records, newly retired ones start the leaver process, and an entry that vanishes without retiring is itself a finding.`,
  "Book 17, Chapter 09 — Running the Inventory Scan, Agency and Central, \"Step 1\" through \"Step 5,\" \"The annual refresh,\" \"Illustrative code.\"");
}

// ================================================================== 29 Central
{
  const s = content(P2, "A central scan: CDM's split, not its tooling");
  tag(s, "How");
  img(s, "ch09-central-tiers", 0.6, 1.5, 6.3, 4.95);
  const a = panel(s, "CDM", 7.15, 1.5, 5.6, null, HEX.navy, HEX.navyTint, "WHAT CDM ACTUALLY DOES", null, [
    "Tools run in agencies; agency dashboards push summaries to the Federal Dashboard",
    "Its identity capability sees accounts, privileges and credentials in its tools' scope",
    "What carries over: a central view, with remediation by the agency",
  ], 13);
  panel(s, "Cannot", 7.15, a + 0.2, 5.6, null, HEX.red, HEX.redTint, "WHAT NO CENTRAL SCAN CAN CLOSE", null, [
    "Whether a credential exists, rotated or was revoked",
    "Withheld, excluded and aggregated AI; shadow AI never inventoried",
    "Change between annual vintages, and the leaver check without stable IDs",
  ], 13);
  sources(s, "Sources: CISA CDM program page, CDM fact sheet (Jan. 2022), CDM dashboards page; CISA BOD 23-01; OMB 2025 inventory. The central model is a program proposal. Book 17, Ch 09.");
  notes(s,
`Every answer check runs on a public file, so a central operator could run it for every agency at once. That's a program proposal, not a federal program, and no agency has adopted it. It's often called CDM for AI, so be precise about CDM.

CDM provides tools, integration services and dashboards to agencies. The tools run in the agencies, the agency dashboard holds object-level data, and summaries flow up to the Federal Dashboard for CISA and OMB. Its identity capability already covers privileges, trust, credentials and training for accounts its tools can see. What carries over is the split: a central view, with remediation inside each agency. What doesn't is the tooling: a central scan reads only what agencies published.

The figure is the four tiers. Tier 0 scans the public file, with no data-sharing agreement needed. Tier 1 delivers each agency only its own rows, agentic and authorization first; the proposal's 72-hour and 30-day windows are kept only as time to acknowledge and route, while confirmed findings take Book 13's shorter clocks. Tier 2 is agency remediation with existing tools, visible in the next vintage. Tier 3 is the agency alone: the directory join, credential lifecycle, sponsor checks and shadow AI discovery.

The red panel is what no central scan can close: whether a credential exists, rotated or was revoked; withheld, excluded and aggregated AI; shadow AI never inventoried; change between annual vintages; and the leaver check, since public files lack stable IDs. BOD 23-01's seven-day discovery doesn't reach AI credentials either. A central scan starts the conversation with every agency at once. Tier 3 is where it finishes.`,
  "Book 17, Chapter 09 — \"The central model,\" \"What CDM actually does,\" \"The four tiers,\" \"What a central scan can't close.\"");
}

// ================================================================== 30 Five questions
{
  const s = content(P2, "Five questions the authorizing official asks");
  tag(s, "How");
  const tb = table(s, "Areas", 1.5, [1.45, 3.15, 4.8, 2.75], ["Area", "The question", "Evidence (program design)", "SP 800-53 Rev. 5"], [
    ["Owner", "Who answers for this identity, and are they still here?", "An employee sponsor and a named technical owner, joined to the inventory and system inventory", "AC-2, CM-8(4), IA-4"],
    ["Credentials", "How does it authenticate, and where are its secrets?", "Credential type per identity, no stored client secrets, expiry, the change log", "IA-5, IA-9"],
    ["Permissions", "What can it reach, and who approved that?", "Grants, roles and access packages with approvals; the access mode", "AC-6, AC-6(7), AC-3"],
    ["Monitoring", "Is anyone watching, and what have they found?", "Log coverage for every identity; detections; open drift findings", "AU-6, AU-12, AC-2(12), CA-7"],
    ["Lifecycle", "When does its access end?", "Expiry or review date; leaver evidence; the last vintage comparison", "AC-2, AC-2(3); SP 800-37 M-7"],
  ], { fontSize: 13, limit: 5.6 });
  callout(s, "IA9", tb + 0.2, 0.9, "FaFingerprint", HEX.amber, "Tailor in IA-9: ",
    "it's in no NIST baseline and no FedRAMP 2026 class, so a baseline-only plan never assesses an AI calling a service as itself.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and SP 800-53B baselines; FedRAMP 2026 Rev5 control reference; NIST SP 800-37 Rev. 2 (P-18, R-4, M-7); OMB M-25-21, M-25-22. Book 17, Ch 10.");
  notes(s,
`Everything ends in the authorization package, because the authorizing official reads the package, not the records, and under SP 800-37 that acceptance of risk can't be delegated. A board, a Chief AI Officer's determination or a vendor score informs it; none makes it.

First, the ISSO asks whose boundary the AI runs in. Inside an authorized system, it's a new component, with a review of whether the addition is a significant change. As a new system, it's the full RMF. On a provider's FedRAMP-certified service, the agency authorizes its use, but the service principals, agent identities and consent grants the service creates in the agency's tenant are still the agency's. A certified service a user consented to with broad delegated permissions is a certified service holding an uncertified grant.

Then the five questions in the table. Owner: an employee sponsor and a named technical owner, joined to the inventory and system inventory. Credentials: type per identity, no stored client secrets without a recorded exception, expiry and the change log. Permissions: every grant with its approval, and the access mode. Monitoring: log coverage, detections and open findings with dispositions. Lifecycle: the expiry or review date, leaver evidence, the last vintage comparison, and Task M-7 disposal.

Three control notes. IA-9 is the control for an AI calling a tool as itself, and it's in no NIST baseline and no FedRAMP 2026 class, so the program tailors it in, naming the services. AC-2 already covers non-person accounts, including aligning with personnel transfer and termination, which is the sponsor-leaver rule as a control. And the use-case inventory is neither CM-8's component inventory nor PM-5's system inventory; the program joins all three.`,
  "Book 17, Chapter 10 — Evidence and Authorization for AI Systems, \"There is no AI-specific authorization to operate,\" \"Where the AI sits decides which package carries it,\" \"The evidence an authorizing official needs.\"");
}

// ================================================================== 31 OSCAL and clocks
{
  const s = content(P2, "OSCAL, the AI clocks, and overlays still to come");
  tag(s, "How");
  const pic = img(s, "ch10-evidence-to-package", 0.6, 1.5, 7.1, 3.1);
  panel(s, "Oscal", 0.6, pic.bottom + 0.2, 7.1, null, HEX.navy, HEX.navyTint, "OSCAL 1.2.3 MAPPING (PROGRAM DESIGN)", null, [
    "AI system: a component with the use-case ID; retired maps to disposition",
    "Each identity: a user with authorized privileges and credential type",
    "Sponsor and technical owner: responsible roles",
  ], 13);
  const a = panel(s, "Clocks", 7.95, 1.5, 4.8, null, HEX.teal, HEX.tealTint, "THREE AI CLOCKS BESIDE FISMA", null, [
    "Inventory: at least annually",
    "Compliance plan: every two years to 2036; next due in 2027",
    "Waivers: certified annually; reported within 30 days",
  ], 13);
  panel(s, "Overlays", 7.95, a + 0.2, 4.8, null, HEX.amber, HEX.amberTint, "NIST AI OVERLAYS: NO PUBLIC DRAFT", null, [
    "Renamed COSIS on Oct. 20, 2026; tailor the baseline now",
    "Add IA-9; adopt CM-8(4) at Moderate; AI logs in AU-6",
  ], 13);
  sources(s, "Sources: NIST OSCAL v1.2.3 (Aug. 7, 2026) SSP schema; OMB M-25-21 §§3(b), 4(a); OMB 2025 reporting guidance; 44 U.S.C. § 3554(b)(5); NIST COSIS project; EO 14434. Book 17, Ch 10.");
  notes(s,
`The package should be machine-readable, and OSCAL 1.2.3, published August 7, 2026, needs nothing AI-specific. The figure is the split: the identity record describes the system through the security plan and proves its state through the assessment layer.

In the plan, each AI system is a component, with the inventory use-case ID as a property and a status that follows its stage: pilot and pre-deployment become under-development or operational depending on production data, and retired becomes disposition until disposal evidence shows its identities gone. Sponsor and technical owner are responsible roles. Each identity is a user with its role, authorized privileges, and credential type and review date as properties. Findings go in the assessment results; open gaps, waivers and pilot certifications become POA&M items. One caution: privileges in the plan are a description. The evidence they match is an observation from the directory.

AI adds three clocks beside FISMA's annual testing. The inventory, at least annually. The compliance plan, every two years until 2036, so the next is due in 2027, and tracking only the inventory misses it. And waivers, certified annually and reported to OMB within 30 days of a change. Waivers and pilot certifications are governed exceptions with an expiry the official should see. Under ongoing authorization, the program treats a new agentic system inside a boundary as worth an event-driven review.

And the overlays. NIST's AI overlay project, renamed COSIS on October 20, 2026, has no public draft. So tailor now: add IA-9, set AC-2 and IA-5 parameters for non-person accounts, adopt CM-8(4) at Moderate, include AI logs in AU-6 review, and compare when the overlay is final.`,
  "Book 17, Chapter 10 — \"The high-impact practices as evidence,\" \"The cadence,\" \"Carrying AI identity in OSCAL,\" \"NIST's SP 800-53 overlays for AI systems.\"");
}

// ================================================================== 32 Decisions
{
  const s = content(P2, "Decisions, owners, and what to start on Monday");
  tag(s, "How");
  table(s, "Decisions", 1.5, [5.15, 2.6, 0.95], ["Decision (design guidance)", "Who decides", "Ch."], [
    ["No live inventory entry without a link to its identity record", "Chief AI Officer", "03, 08"],
    ["The identity record exists before any credential is issued", "Identity governance officer", "05, 08"],
    ["Control requirements: credentials, Conditional Access, logging", "CISO", "06, 08"],
    ["What data and tools an AI identity may reach", "System owner", "06, 08"],
    ["Admin consent for an AI application or agent", "Identity governance officer", "06, 08"],
    ["Disable an AI identity during an incident", "Security operations", "07, 08"],
    ["Does a new tool, permission or model need reauthorization?", "Authorizing official", "08, 10"],
  ], { fontSize: 14, limit: 6.5 });
  panel(s, "Monday", 9.5, 1.5, 3.25, null, HEX.teal, HEX.tealTint, "NO NEW PLATFORM NEEDED", "Start with these", [
    "List agent identities and their owners",
    "Scan your own inventory submission",
    "Build the block policy in report-only",
    "Export every log category",
    "Tailor IA-9 into AI systems' plans",
  ], 15);
  sources(s, "Sources: Book 17, Chapters 05–10 and Appendix A; NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 (IA-9); OMB M-25-21. Decisions and sequence are program design guidance.");
  notes(s,
`So, the decisions, each with its decider from Chapter 08's responsibility matrix, all program design guidance.

The Chief AI Officer decides the one policy that joins the two sides: no use case is recorded as piloted or deployed without a link to its identity record. Without it, the drift comparison has nothing to join on. The identity governance officer decides that the identity record exists before any credential is issued, since creating a principal is identifier management, and decides admin consent for AI applications and agents, reviewing agent grants after the fact because they bypass the workflow. The CISO sets the control requirements: credential types, the Conditional Access baseline for workload and agent identities, and logging. The system owner decides what data and tools an AI identity may reach. Security operations decides incident-driven disabling, because speed matters, then hands the agent's future back to the sponsor and system owner. And the authorizing official decides whether a new tool, permission, user account or model needs reauthorization; the identity team's change record shows the question was asked.

Five things to start on Monday that need no new platform. Run a read-only listing of agent identities and their owners, and flag those with none. Load your agency's own inventory submission, not the public file, and run the answer checks. Build the block-unless-approved policy in report-only mode and read who it would block. Export every sign-in and audit category, because history starts the day export does. And tailor IA-9 into the plan of any system where an AI acts as itself.

An AI agent that can act is an account, and an account nobody owns is the oldest finding in identity. Chapters 01 through 10 and Appendix A carry the detail, every claim footnoted and dated. Thank you.`,
  "Book 17, Chapters 05, 06, 07, 08, 09 and 10; Appendix A — Requirements Mapping: AI Rules to Identity Controls.");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const sourceSlide = (title, src) => {
  const s = content("Backup", title);
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
  const need = 1.5 + src.reduce((a, t) => a + lines(t, 11.8, 12) * 12 / 72 * 1.2 + 0.07, 0);
  if (need > 6.6) console.warn(`  ! ${title} source list may overflow: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "OMB M-25-21 (Apr. 3, 2025): Overview; §§1, 2(a), 3(a)–(b), 4(a)–(b), 5, 6; footnotes 11, 22, 29.  ·  OMB M-25-22 (Apr. 3, 2025): §§3(b), 4(e)–(f).  ·  OMB M-26-04 (Dec. 11, 2025).",
  "Executive Orders 14179 (Jan. 23, 2025), 14319 (July 23, 2025), 14409 (June 2, 2026) and 14434 (Sept. 29, 2026), Federal Register.  ·  OMB Memoranda list through M-26-19.  ·  CISA BOD 26-04.",
  "OMB 2025 Federal Agency AI Use Case Inventory: README (as of Apr. 13, 2026), data dictionary, individually reported use cases CSV; Guidance on 2025 Agency AI Reporting.",
  "NIST SP 800-53 Rev. 5 (release 5.2.0 OSCAL catalog): AC-2, AC-6, IA-4, IA-5, IA-9.  ·  NIST AI 100-1 (AI RMF 1.0): GOVERN 1.6, 1.7, 2.1.  ·  NIST AI 600-1 (July 26, 2024), §2.9.",
  "NIST COSIS project, formerly COSAiS (Aug. 14, 2025; Jan. 8, 2026; Oct. 20, 2026).  ·  CISA: Deploying AI Systems Securely (Apr. 15, 2024); Careful Adoption of Agentic AI Services (May 1, 2026).  ·  FedRAMP AI.",
  "Microsoft Learn: Conditional Access for agents; Target agent identities in Conditional Access; Administrative relationships in Entra Agent ID; Entra releases (April 2026); What's new in Agent ID; Agent 365 service description.",
  "Full footnotes with links and access dates (Oct. 21–22, 2026): Book 17, Chapters 01–02.",
]);
sourceSlide("Sources behind Module 2 — Inventory and kinds of identity", [
  "OMB 2025 AI Use Case Inventory: data dictionary (columns 1–36); individually reported CSV (3,611 rows) and consolidated COTS CSV (900 rows); README; Guidance on 2025 Agency AI Reporting, §§1–5.  ·  2024 inventory README.",
  "OMB M-25-21: §§3(b)(i), 3(b)(v), 4(a)–(b); footnotes 11, 21, 22, 29.  ·  NIST SP 800-53 Rev. 5: AC-2, AC-6, AU-12, CA-7, CM-8, IA-4, IA-5, IA-9.",
  "Microsoft Learn: Conditional Access for agents; Target agent identities; Conditional Access: Grant; Conditional Access for workload identities; Workload ID FAQ; Managed identities overview; Workload identity federation.",
  "Microsoft Learn: What are agent identities; What is Entra Agent ID; Governing agent identities; Agent ID design patterns; Agent identities; Agent's user account; Agent 365 identity; agentIdentity resource; Disable agent identities.",
  "Microsoft Learn: ID Protection for agents; Entra feature availability (Azure Government); Agent 365 service description; Agent 365 CLI for US Government clouds; Entra releases (March–May 2026); Foundry agent identity.",
  "AWS: Amazon Bedrock AgentCore Identity; AgentCore in AWS GovCloud (US).  ·  Google Cloud: Agent identity overview.",
  "Full footnotes with links and access dates (Oct. 21, 2026): Book 17, Chapters 03–04.",
]);
sourceSlide("Sources behind Module 3 — Owners, credentials and access", [
  "Microsoft Learn: Administrative relationships (owners, sponsors, managers); Create an agent identity blueprint; agentIdentityBlueprint resource; Agent identities, service principals and applications; Plan your agent identity architecture.",
  "Microsoft Learn: Access packages for agent identities; Agent identity sponsor tasks; Lifecycle Workflows templates; Agent identity deletion; Best practices for Agent ID; Manage agent identities; Graph list agentIdentity and sponsors.",
  "Microsoft Learn: Authorization in Entra Agent ID; Configure inheritable permissions; Assign agent identities to applications; Secure autonomous agents with Conditional Access; PIM; Entra ID Governance licensing fundamentals.",
  "CISA SCuBA Entra ID baseline, §5 (main branch; ScubaGear v1.8.0, May 7, 2026).  ·  CISA BOD 25-01 required configurations, MS.AAD.5.1v1–5.3v1.  ·  NIST SP 800-53 Rev. 5: AC-6, AC-6(7), AC-6(9).",
  "Model Context Protocol specification, version 2026-07-28, Authorization.  ·  Microsoft Learn: Manage plugins, skills and MCP servers; MCP server options in Agent 365; Agent 365 and Azure API Management (preview); Tools Gateway.",
  "Microsoft Learn: Agent 365 service description (GCC column, FedRAMP High note); Agent 365 CLI for US Government clouds; Entra releases (April–June 2026); Archive of Entra releases (November 2025).",
  "Full footnotes with links and access dates (Oct. 22, 2026): Book 17, Chapters 05–06.",
]);
sourceSlide("Sources behind Module 4 — Monitoring and authorization", [
  "OMB M-25-21: §§3(b)(ii), 3(b)(v), 4(a)–(b).  ·  OMB M-25-22: §4(e)(i).  ·  NIST AI 100-1: GOVERN 1.6, 1.7; MEASURE 2.4; MANAGE 4.1.  ·  NIST SP 800-37 Rev. 2: Tasks P-18, R-4, M-7; Appendix D.",
  "Microsoft Learn: Entra sign-in logs; Agent ID logs; Agent ID FAQ; Entra data retention; Securing workload identities; Discover AI apps and data; GSA shadow AI and agent discovery; Defender for Endpoint local agents; Defender CSPM.",
  "NIST SP 800-53 Rev. 5: AC-2, AC-2(3), AC-2(12), AC-3, AC-6(7), AU-6, AU-12, CA-6, CA-7, CM-8, CM-8(3), CM-8(4), IA-4, IA-5, IA-9, PM-5, RA-8.  ·  SP 800-53B baselines.  ·  FedRAMP 2026 Rev5 control reference.",
  "CISA: CDM program page, CDM fact sheet (Jan. 2022), CDM dashboards; BOD 23-01 (Oct. 3, 2022).  ·  OMB 2025 inventory CSV and data dictionary; 2024 consolidated inventory.",
  "OMB Circular A-130, Appendix I.  ·  44 U.S.C. § 3554(b)(5).  ·  NIST OSCAL v1.2.3 (Aug. 7, 2026), SSP schema.  ·  NIST COSIS project (Oct. 20, 2026).  ·  EO 14434.  ·  FedRAMP AI Prioritization Initiative.",
  "Workbook cross-references: Book 12, Chapters 02–03; Book 13, Chapters 06 and 09; Book 14, Chapters 10–11; Book 15, Chapter 06; Book 16.",
  "Full footnotes with links and access dates (Oct. 21–23, 2026): Book 17, Chapters 07–10; Appendix A.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
