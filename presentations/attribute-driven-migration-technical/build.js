// Companion guide — Attribute-Driven Migration to Entra ID: the TECHNICAL deep dive, in four modules.
//   Module 1 (the model):                         what the OU tree encoded, placement versus attributes, the stage map, Stage 0.
//   Module 2 (sourcing and proving attributes):   HR as the authority, Federal HR 2.0 and API-driven inbound provisioning,
//                                                 contractors, the canonical schema and its writers, Stages 2 and 3.
//   Module 3 (attributes to mechanisms):          Stages 4 to 6, Intune, beyond users (devices, Arc, service principals,
//                                                 custom security attributes, the object-type crosswalk), PIV and CAC binding.
//   Module 4 (running it):                        the worked mover example, Stages 7 and 8, the limits, the checklist, decisions.
// Build:  node presentations/attribute-driven-migration-technical/build.js presentations/attribute-driven-migration-technical/Attribute_Driven_Migration_Technical.pptx
// Every fact on a slide comes from docs/books/guides/attribute-driven-migration.md or a chapter it links to; the notes
// name the guide's stage and the chapters. Microsoft product facts carry the Microsoft Learn page the guide footnotes
// (all opened October 29, 2026). The program's own recommendations are labeled design guidance, preview features carry
// their stage and date, and the guide's corrections of the chapters (Lifecycle Workflows limit, the device-write
// permission, Intune assignment filters) are stated as the guide states them.
// Narration: narration.json (intent-first voice, keyed by slide title) is read by presentations/_build/narrate.py
// (the editor runs that). The notes keep the full detail for a live presenter.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Companion guide", title: "Attribute-Driven Migration to Entra ID — Technical Deep Dive",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration to Entra ID — Technical Deep Dive" });
const { HEX, txt, box, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "Attribute_Driven_Migration_Technical.pptx";

// ------------------------------------------------------------------ helpers
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} callout`, y + h);
  if (process.env.FIT) console.log(`  callout ${name}: bottom ${(y + h).toFixed(2)} in`);
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

// Neutrality guard: the deck names no agency and no internal program brand.
const BANNED = /\bUIAO\b|\bSSA\b|Social Security|Mainframe PIN/i;
const neutral = (what, text) => { if (BANNED.test(text)) throw new Error(`neutrality: ${what} contains a banned name: ${text.slice(0, 80)}`); };

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

// Committed diagrams from the chapters the guide links to, placed inside a box keeping the PNG's aspect ratio
// (read from its header). Alt text is each chapter's own fig-alt, read from the chapter so the two can't drift apart.
// Keys are "<book folder>/<diagram name>", e.g. "b03-hr-identity/ch05-provisioning-services".
const ROOT = path.join(__dirname, "..", "..", "docs");
const ALT = {};
for (const book of fs.readdirSync(path.join(ROOT, "books"))) {
  const dir = path.join(ROOT, "books", book);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".md"))) {
    const md = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of md.matchAll(/diagrams\/([a-z0-9-]+)\/svg\/([a-z0-9-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[`${m[1]}/${m[2]}`] = m[3];
  }
}
const used = [];
const img = (s, key, x, y, maxW, maxH) => {
  const [book, name] = key.split("/");
  const file = path.join(ROOT, "images", "diagrams", book, "png", `${name}.png`);
  const alt = ALT[key];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${key}`);
  if (!fs.existsSync(file)) throw new Error(`diagram PNG missing: ${file}`);
  neutral(`alt text of ${key}`, alt);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  used.push(key);
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

const M1 = "Module 1 — The model";
const M2 = "Module 2 — Sourcing and proving attributes";
const M3 = "Module 3 — Attributes to mechanisms";
const M4 = "Module 4 — Running it";
const G = "Attribute-Driven Migration guide";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Attribute-Driven Migration: the technical deep dive", "Companion guide — moving a forest to Entra ID on attributes, not OU placement");
  txt(s, "Session map", [
    { text: "Module 1  The model   ·   Module 2  Sourcing and proving attributes", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Module 3  Attributes to mechanisms   ·   Module 4  Running it", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Facts dated October 29, 2026  ·  design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.9, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for the Federal Modernization Workbook's companion guide, Attribute-Driven Migration from Active Directory to Microsoft Entra ID. It's for identity engineers, Entra and AD administrators, Intune and Azure platform owners, PKI and credential teams, and ISSOs: the people who will write the attributes, the rules that read them and the evidence that shows they were true.

The guide's claim fits in one line. In Active Directory an object's place in the tree decided what applied to it; in Entra ID what the object says about itself decides. So the migration is the work of making those statements true and keeping them true.

Four modules you can watch separately. Module 1 is the model: what the OU tree encoded, placement versus attributes, and the nine-stage map. Module 2 is sourcing and proving the attributes: HR as the authority, Federal HR 2.0 and API-driven inbound provisioning, contractors, the canonical schema and its single writer, then proof and sync. Module 3 maps attributes to mechanisms: dynamic groups, administrative units, Conditional Access and Intune, then devices, Arc servers, service principals and PIV certificate binding. Module 4 runs it: a worked mover example, the phased cutover, drift, the limits and the decisions.

Three labels to listen for. The guide is a map; the books hold the depth, and each slide names the chapter. Microsoft facts were checked against Microsoft Learn on October 29, 2026. And the program's own recommendations are marked design guidance.`,
  `${G}, "How to read this guide," "The path on one page"; Book 01, Chapter 04; Books 02, 03, 04, 05, 06 and 07 as linked.`);
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: the attributes now decide");
  tag(s, "Why");
  const pic = img(s, "b01-transformation-arc/ch04-one-attribute-five-outcomes", 0.6, 1.5, 7.0, 3.6);
  const pb = panel(s, "Jobs", 7.85, 1.5, 4.9, null, HEX.red, HEX.redTint, "THE OU TREE DID FOUR JOBS AT ONCE", null, [
    "Delegation: who may manage the object",
    "Policy scope: which GPOs inherit down to it",
    "Accountability: which office owns it",
    "Security scope: what it can reach",
    "Entra ID has no OUs: its directory is flat",
  ], 14);
  callout(s, "Truth", Math.max(pic.bottom, pb) + 0.25, 0.85, "FaTriangleExclamation", HEX.red, "One stamp, five outcomes: ",
    "a wrong HR-sourced attribute is wrong group membership, unit scope, policy, licensing and drift, all at once.");
  sources(s, "Sources: Microsoft Learn, Manage rules for dynamic membership groups (Oct. 29, 2026). Guide, Stage 0 and Stage 1; Book 01, Ch 04; Book 03, Ch 12.");
  notes(s,
`Why this matters. The Active Directory OU tree was never just folders. It did four jobs at once: delegation, policy inheritance, operational accountability and security scope, all in one hierarchy. Entra ID has no OUs. Its directory is flat, and it has none of that structure by default.

The attribute-driven model rebuilds those properties with governed mechanisms, and the figure from Book 01 shows the contract. One governed set of HR-sourced attributes, department, an organization code, worker type and position category, drives five outcomes: dynamic group membership, administrative-unit scope, Conditional Access targeting through those groups, group-based licensing, and drift detection against HR. The grey card is the legacy: OU placement, position encoded as location in a tree, which becomes data.

That's the reason the attributes have to be true first. Book 03 puts it bluntly: every later control reads these attributes, so a drifted HR feed produces drifted access faster than any ticket queue. And Book 01 adds the token view: a token has to assert an authorization that's true, not just well-formed.

So the migration isn't moving objects. It's moving the meaning the tree carried into attributes, and proving those attributes before anything depends on them. Module 1 starts with what the tree actually encoded.`,
  `${G}, Stage 0 "What it is," Stage 1 "What it is," Stage 2 "What it is"; Book 01, Chapter 04 — "The identity claim," "What the attributes drive"; Book 03, Chapter 12 — "Sequencing principle."`);
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(M1, "Module 1: The model, from placement to attributes", "Book 01, Chapter 04  ·  Book 02, Chapters 07–09",
    ["What the OU tree encoded, and where each job goes", "The nine stages, their deciders and their gates", "Stage 0: reading the tree before moving it"], 5);
  notes(s,
`Module 1: the model. Before anything moves, the team needs a shared picture of what the OU tree was doing and where each of those jobs lands in Entra ID, because the target has to reproduce intent, not structure.

So: the four jobs and the mechanism that replaces each; the nine stages of the guide's path, each with one decider and a gate that says it's done; and Stage 0, the read-only inventory of the tree, its GPO links and its hand-made delegations.`,
  `${G}, "The path on one page," Stage 0; Book 01, Chapter 04 — Identity Transformation; Book 02, Chapters 07–09.`);
}

// ================================================================== 4 OU jobs
{
  const s = content(M1, "What the OU tree encoded, and where each job goes");
  tag(s, "What");
  const tb = table(s, "Mechanisms", 1.5, [2.6, 3.0, 2.35], ["OU job", "Entra ID mechanism", "Driven by"], [
    ["OU placement", "Organizational attributes", "HR, through provisioning"],
    ["OU-derived security groups", "Dynamic groups", "Rules over coded attributes"],
    ["OU-level delegation", "Administrative units", "Unit rules mirroring group rules"],
    ["GPO inheritance", "Conditional Access and Intune targeting", "Governed groups"],
  ], { fontSize: 13, limit: 4.3 });
  panel(s, "Where", 8.8, 1.5, 3.95, null, HEX.navy, HEX.navyTint, "WHERE THE ATTRIBUTES LIVE", null, [
    "Native Entra attributes first",
    "Extension attributes only where a rule can't read a native one",
    "Rules can't read employeeType, employeeOrgData or manager",
    "Codes, never display strings, in anything a rule reads",
  ], 13.5);
  img(s, "b02-identity/ch09-ad-to-entra-objects", 0.6, tb + 0.2, 7.95, 6.5 - tb - 0.2);
  sources(s, "Sources: Microsoft Learn, Manage rules for dynamic membership groups (Oct. 29, 2026). Guide, Stage 0, Limits; Book 01, Ch 04; Book 02, Ch 09; Book 03, Ch 06.");
  notes(s,
`Book 01 names four governed mechanisms, and the table pairs each with the OU job it replaces. OU placement becomes organizational attributes on every governed user. OU-derived security groups become dynamic groups. OU-level delegation becomes administrative units. And GPO inheritance becomes Conditional Access and Intune targeting. Microsoft documents each mechanism; the program's contribution is the contract that binds them, so setting a user's attributes produces consistent effects everywhere.

The figure below is Book 02's object map. Users sync and later become cloud-managed. Security groups become assigned or dynamic groups, by sync, conversion or retirement. The organizational unit row is the one that matters here: it becomes administrative units, dynamic groups and policy targeting, re-expressed as attributes. Service accounts become workload identities, protected groups become PIM-eligible roles, and computers become devices.

On the right, where the attributes live. Native Entra attributes first, and an extension attribute only where a dynamic rule needs a value it can't read natively. Rules can't read employeeType, employeeOrgData or manager, which is why the schema carries coded mirrors; Microsoft's page still said so on October 29. And codes, never display strings, in anything a rule reads, because a display string breaks the next time someone retypes it.

Stage 0's decision follows: for every OU function, where it goes. GPO scoping to Conditional Access and Intune, delegation to units, logical organization to attributes and dynamic groups.`,
  `${G}, Stage 0 "Decision," "Limits: rule limits"; Book 01, Chapter 04 — "The four mechanisms," "Where the attributes live"; Book 02, Chapter 09 — "Organizational units"; Book 03, Chapter 06 — "Design rules."`);
}

// ================================================================== 5 Stage map
{
  const s = content(M1, "Nine stages, each with a decider and a gate");
  tag(s, "How");
  table(s, "Stages", 1.45, [0.45, 2.75, 3.55, 5.4], ["#", "Stage", "Decision, and who decides", "Gate: done when"], [
    ["0", "Read what the tree encodes", "What each OU function becomes: identity engineering", "Inventory in Git; a decision for every group; OU-to-unit map drafted"],
    ["1", "Source the attributes", "Authority map, person key, contractor source: ICAM governance body", "Identifier decision, authority map and schema signed"],
    ["2", "Prove they're true", "Correlation threshold: the agency's risk governance", "Threshold met on the pilot; every enabled account correlated or excepted"],
    ["3", "Map them through sync", "Sync engine and sign-in method: identity engineering", "Counts match; no sync errors; shadow-mode differences explained"],
    ["4", "Subtrees as dynamic groups", "An application's access rule: its owner", "Each rule validated, shadowed against its old group, piloted"],
    ["5", "Delegate with units", "Delegation model: identity engineering; restriction default no", "Unit rules mirror group rules; role assignments match the matrix"],
    ["6", "Retarget policy", "Control requirements: the CISO", "Report-only reviewed; enforced in waves; GPO links disabled"],
    ["7", "Cut over in phases", "Wave go/no-go: identity engineering", "Seven days of sole-source proof; ticket path closed; rollback tested"],
    ["8", "Detect and correct drift", "Drift findings: the CISO", "Zero-action plan; high-severity findings closed or dated"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Guide, \"The path on one page\" and \"How the books' phase numbers line up\"; Book 02, Ch 06 and Book 03, Ch 07 responsibility matrices (design guidance).");
  notes(s,
`This is the guide's path on one page: nine stages, numbered zero to eight. Each book numbers its own phases; the guide names stages instead, and its phase-alignment table, in the backup sources, lines them up. That alignment is approximate, and each book's gates still govern its own work.

Read the columns as a contract. Every stage has one decision and one decider, taken from two responsibility matrices, Book 02 Chapter 06 for the directory and Book 03 Chapter 07 for the data. Both are the program's recommended model, design guidance, with one decider per row.

A few to notice. Stage 1's authority map, person key and contractor source belong to the ICAM governance body; HR owns the code lists and the data architect owns the schema. Stage 2's correlation threshold is the agency's, through risk governance, not a number the program imposes. Stage 4 puts each application's access rule with its owner, while HR owns the values the rule reads. Stage 6's control requirements and Stage 8's drift findings sit with the CISO.

And every stage has a gate that says it's done. The gates are the point: Stage 4 doesn't grant production access until the rule has been validated, shadowed against the group it replaces and piloted; Stage 7 doesn't close a population until seven days of changes all trace to HR. The rest of the deck walks the stages in order.`,
  `${G}, "The path on one page," "How the books' phase numbers line up"; Book 02, Chapter 06 — "The responsibility matrix"; Book 03, Chapter 07 — "The responsibility matrix."`);
}

// ================================================================== 6 Stage 0
{
  const s = content(M1, "Stage 0: read what the tree encodes before moving it");
  tag(s, "How");
  const pic = img(s, "b02-identity/ch08-gpo-analysis", 0.6, 1.5, 7.2, 2.95);
  const a = panel(s, "Collect", 8.05, 1.5, 4.7, null, HEX.navy, HEX.navyTint, "READ-ONLY INVENTORY", null, [
    "Placement and size of every OU",
    "GPO links and inheritance, site links included",
    "Non-inherited access-control entries someone delegated by hand",
    "What read-only discovery couldn't see, recorded",
  ], 13.5);
  const b = panel(s, "Decide", 0.6, pic.bottom + 0.2, 5.95, null, HEX.teal, HEX.tealTint, "DECISION AND GATE", null, [
    "Every security group: keep synced, convert to cloud-only, convert to dynamic, or retire",
    "Gate: inventory in Git, a UPN remediation plan, a decision per group, OUs mapped to proposed units",
  ], 13.5);
  panel(s, "Fail", 6.8, Math.max(a, pic.bottom) + 0.2, 5.95, null, HEX.red, HEX.redTint, "FAILURE MODES", null, [
    "A site-linked GPO looks unlinked to an OU-only search",
    "adminCount stays set after an account leaves a protected group, so it overstates privilege",
  ], 13.5);
  sources(s, "Sources: Guide, Stage 0; Book 02, Ch 07 (read-only discovery), Ch 08 (OU hierarchy and delegation; what to collect), Ch 09 (per-group decision; AdminSDHolder), Ch 10 (Phase 0).");
  notes(s,
`Stage 0 is read-only. The assessment captures what each OU actually encodes so the target reproduces intent, not structure. The figure is Book 02's GPO analysis: the inventory of every GPO with its status, owner and WMI filter, then the reports and inheritance views per GPO and per OU.

Collect four things. Placement and size of each OU. GPO links and inheritance. The non-inherited access-control entries that someone delegated by hand, because that's where the real delegation lives. And a record of what read-only discovery couldn't see, so nobody mistakes a gap for an absence.

Two decisions come out of it. For every OU function, where it goes, which the last slide covered. And for every security group, one of four outcomes: keep it synced, convert it to cloud-only, convert it to dynamic, or retire it.

The gate is Book 02's Phase 0: a complete inventory in Git, a UPN remediation plan, a recorded decision for every group, and the OU structure mapped to proposed administrative units.

Two failure modes. A GPO linked at a site looks unlinked to a search that only walks OUs, so include site links. And adminCount overstates current privilege, because it stays set after an account leaves a protected group; check actual membership.

That's the model. Module 2 sources the attributes that replace the tree.`,
  `${G}, Stage 0; Book 02, Chapter 07 — "Recording what read-only discovery couldn't see"; Chapter 08 — "OU hierarchy and delegation," "What to collect"; Chapter 09 — "The per-group decision," "AdminSDHolder and protected groups"; Chapter 10 — "Phase 0: assessment."`);
}
endModule("Module 1");

// ================================================================== 7 Module 2 divider
{
  const s = divider(M2, "Module 2: Sourcing and proving the attributes", "Stages 1 to 3  ·  Book 03, Chapters 03–07 and 12  ·  Book 02, Chapter 09",
    ["HR as the authority; Federal HR 2.0 and API-driven provisioning", "Contractors, the canonical schema and its single writer", "Proving the attributes true, then mapping them through sync"], 13);
  notes(s,
`Module 2: sourcing and proving the attributes. Every mechanism in Module 3 reads these values, so this is where the migration is won or lost, and it's the work estates skip because users never see it.

So: which system owns each fact, and the enterprise person key; Federal HR 2.0 as the coming source and how Core HCM reaches Entra ID through API-driven inbound provisioning; the facts HR doesn't supply, including contractors; the canonical schema and its one writer; and then Stages 2 and 3, proving the values true and carrying them through sync.`,
  `${G}, Stages 1–3; Book 03, Chapters 03–07 and 12; Book 02, Chapter 09.`);
}

// ================================================================== 8 Authority
{
  const s = content(M2, "Stage 1: HR is the authority, one fact to one system");
  tag(s, "What");
  const pic = img(s, "b03-hr-identity/ch04-authority-map", 0.6, 1.5, 7.2, 3.05);
  const pb = panel(s, "Key", 8.05, 1.5, 4.7, null, HEX.navy, HEX.navyTint, "THE ENTERPRISE PERSON KEY", null, [
    "A key the agency controls, carried in employeeId (at most 16 characters)",
    "The source person number maps to it",
    "A change of HR source changes only the source key",
    "Decided by the ICAM governance body",
  ], 13.5);
  callout(s, "Upstream", Math.max(pic.bottom, pb) + 0.25, 0.9, "FaArrowsRotate", HEX.teal, "Authoritative once, derived everywhere: ",
    "each attribute is authoritative in one system, and corrections flow upstream to it, never into the copy.");
  sources(s, "Sources: Guide, Stage 1 \"Decisions and owners\" and \"Failure modes\"; Book 01, Ch 04; Book 03, Ch 04 (authority; identifiers), Ch 07 (where ownership fails).");
  notes(s,
`Stage 1 decides where each attribute comes from, what it's called, what it holds and who may write it.

Start with which system owns each fact; the figure is Book 03's authority map. HR is authoritative for who a worker is and where they sit: person and affiliation keys, worker type and status, position, organization, duty station and supervisor. The identity platform is authoritative for how identity is proven and whether a request is permitted now: accounts, sessions and group membership by rule. Card management and PKI own the PIV and derived credentials. Consumers only derive. Every attribute is authoritative in one system and derived everywhere else, and corrections flow upstream.

Then the enterprise person key. It's a key the agency controls, carried in employeeId, which holds at most 16 characters, with the source system's person number mapped to it. That layering is what lets the HR source change without breaking identity: a new source changes only the source key. The governance body decides it.

Book 03 Chapter 07 names three ways ownership fails. A key owned by the source breaks at the Core HCM cutover. An owner without the means leaves duty station stale. And the help desk becomes a shadow source. The design answers each: an agency-owned key, owners with the means, and one writer.

And that cutover is coming, which is the next slide.`,
  `${G}, Stage 1 "What it is," "Decisions and owners," "Failure modes"; Book 01, Chapter 04 — "What the attributes drive"; Book 03, Chapter 04 — "System of record versus identity provider," "Authoritative versus derived attributes," "One person, layered identifiers"; Chapter 07 — "Where ownership fails."`);
}

// ================================================================== 9 Federal HR 2.0
{
  const s = content(M2, "Federal HR 2.0: the coming source and what OPM leaves open");
  tag(s, "Why");
  const pic = img(s, "b03-hr-identity/ch03-hr20-window", 0.6, 1.5, 12.15, 2.0);
  const a = panel(s, "Facts", 0.6, pic.bottom + 0.2, 6.0, null, HEX.navy, HEX.navyTint, "THE PROGRAM FACTS (BOOK 03, OCT. 20, 2026)", null, [
    "OMB/OPM memo, Dec. 10, 2025: one government-wide Core HCM platform",
    "Award to Oracle Fusion Cloud HCM, June 10, 2026",
    "Wave 2 in FY 2027; adoption goal FY 2028; eOPF and EHRI expected to go",
    "Sample onboarding ~8 months, interconnections ~month 5: a planning assumption",
  ], 13);
  panel(s, "Open", 6.85, pic.bottom + 0.2, 5.9, null, HEX.amber, HEX.amberTint, "WHAT OPM DOESN'T SPECIFY", null, [
    "No OPM document mandates how the platform reaches the agency's directory",
    "Only a sample \"Identity Management Solution\" interconnection; no protocol or product",
    "Design guidance: take the HR-to-identity feed to the Steering Committee in Phase 0",
    "The window closes at interconnection go-live",
  ], 13);
  sources(s, "Sources: Guide, Stage 1 \"Building the attributes from Federal HR 2.0\"; Book 03, Ch 03 (program facts; what OPM requires), Ch 12. Schedule: confirm with the HR 2.0 program office.");
  notes(s,
`Federal HR 2.0 will supply most of these attributes for federal employees, so it belongs in Stage 1, not after it. These are Book 03 Chapter 03's facts, dated October 20, 2026; the guide didn't re-check the schedule after that, and says to confirm it with the HR 2.0 program office.

The joint OMB and OPM memorandum of December 10, 2025 consolidates the government's Core HCM systems onto one government-wide platform, and OPM awarded the contract to Oracle, Oracle Fusion Cloud HCM, on June 10, 2026. Wave 1 is the volunteer agencies; Wave 2 is everyone else, in fiscal 2027; the adoption goal is fiscal 2028; and the memo expects the platform to make eOPF and EHRI redundant. The sample onboarding runs about eight months with interconnections live around month five, which Book 03 treats as a planning assumption.

What OPM doesn't require matters more. No OPM document mandates or specifies how the platform integrates with the agency's directory. The solicitation's identity requirements point into the platform: its users sign in through OPM's identity provider and are provisioned by SCIM. The reverse direction appears only as a sample interconnection, an Identity Management Solution fed by Core HCM, with no protocol, product or directory named, and the Steering Committee approves agency integrations.

So the Entra design is the agency's own. The book's design guidance: take the HR-to-identity feed to the Steering Committee in Phase 0 and name it in the memo's integration inventory, because the window closes at go-live.`,
  `${G}, Stage 1 "Building the attributes from Federal HR 2.0"; Book 03, Chapter 03 — "The program facts," "What OPM requires and what it leaves to the agency," "Why this is the opportunity, not the project"; Chapter 12 — "Phase 0: program alignment."`);
}

// ================================================================== 10 API-driven provisioning
{
  const s = content(M2, "API-driven inbound provisioning and the two landing zones");
  tag(s, "How");
  const pic = img(s, "b03-hr-identity/ch05-provisioning-services", 0.6, 1.45, 7.3, 2.5);
  const pb = panel(s, "Lic", 8.15, 1.45, 4.6, null, HEX.amber, HEX.amberTint, "LICENSING AND GCC, OCT. 29, 2026", null, [
    "Included with Entra ID P1, P2 and ID Governance",
    "GA in the US Government cloud since June 2025",
    "/bulkUpload: 2,000 calls a day (P1/P2), 6,000 (ID Governance), 50 operations a call",
  ], 13);
  table(s, "Zones", Math.max(pic.bottom, pb) + 0.15, [2.45, 4.9, 4.8], ["Population", "Where HR writes", "How it reaches Entra ID"], [
    ["AD-mastered (synced), most of the estate today", "AD, through the provisioning agent; the OU is computed from HR attributes", "Connect Sync or Cloud Sync; Entra extension attributes read-only"],
    ["Cloud-mastered", "Entra ID directly; structure lands as attributes, not an OU", "Already there; any AD account an app needs is provisioned from Entra ID"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn, API-driven inbound provisioning concepts; Entra releases archive (June 2025); Entra feature availability (Oct. 29, 2026). Guide, Stage 1; Book 03, Ch 05.");
  notes(s,
`How the record gets from HR to Entra ID. Oracle Fusion Cloud HCM has no native Entra connector, so the Microsoft realization is API-driven inbound provisioning. The figure is Book 03's pipeline: HCM Extracts for the full load and Atom feeds for changes, read by middleware in the agency's boundary. The middleware has five duties per event: validate, failing closed; sequence; normalize to SCIM; write provenance; and reconcile the result. Then it posts to the Microsoft Graph bulk upload endpoint. One rule from Book 03: read the hire, termination and cancellation feeds by published date, or pre-hire workflows never run.

Each provisioning app has its own endpoint and lands users in one of two places, the table at the bottom. For AD-mastered users, most of the estate today, the provisioning agent writes AD, the OU is computed from HR attributes and manager becomes a DN reference; sync carries them up, and the Entra extension-attribute values are read-only. For cloud-mastered users HR writes Entra ID directly. The two converge population by population: HR stays the authority for the person, and AD becomes a shrinking downstream target.

Licensing, from Microsoft Learn on October 29, 2026. API-driven provisioning is included with Entra ID P1, P2 and ID Governance. It became generally available in the US Government cloud in June 2025, and the feature-availability table lists it. The daily cap is 2,000 calls with P1 or P2 and 6,000 with ID Governance, at up to 50 operations a call.`,
  `${G}, Stage 1 "The path from HR to Entra ID," "Licensing and GCC"; Book 03, Chapter 05 — "Why API-driven inbound provisioning," "What the feeds do," "Two landing zones," "Over the Entra ID migration."`);
}

// ================================================================== 11 Contractors and other writers
{
  const s = content(M2, "What HR doesn't supply: contractors and other writers");
  tag(s, "Who");
  table(s, "Writers", 1.5, [3.15, 4.3], ["Not from HR", "Writer instead"], [
    ["Contractors and vendors (not in HRIT)", "One authority per fact: suitability register, contract record, PIV system, a federal sponsor mastered in HR"],
    ["Account type: Standard, Service, Privileged (slot 7)", "Identity team; during transition a sync rule derives it from OU placement"],
    ["Clearance level (slot 9)", "Personnel security system"],
    ["DoNotSync (slot 15)", "Identity operations, in AD"],
    ["Device region, department, tier, role, environment", "Device provisioning at registration, through Graph"],
    ["Where someone signs in from", "Sign-in signals: duty location scopes; network-location policy enforces"],
    ["Credentials, sessions, group membership", "The identity platform"],
  ], { fontSize: 12.5, limit: 6.5 });
  const a = panel(s, "Switch", 8.25, 1.5, 4.5, null, HEX.navy, HEX.navyTint, "BEFORE THE WAVE LANDS", "A source swap, not a redesign", [
    "Key on an agency-owned person key",
    "Map to OPM standard elements and codes",
    "One door into the directory: middleware",
    "Don't build on EHRI or eOPF feed shapes",
  ], 13);
  panel(s, "Manual", 8.25, a + 0.2, 4.5, null, HEX.amber, HEX.amberTint, "NO HR FEED YET (DESIGN GUIDANCE)", null, [
    "Treat the hand steward as a temporary source: named owner, same writer and provenance; retire it read-only first",
  ], 13);
  sources(s, "Sources: Guide, Stage 1 \"What HR supplies\" and \"Before the agency's wave lands\"; Book 03, Ch 03, 04, 05, 06 (one fact, one authority; sequence), Ch 13; Book 05, Ch 08.");
  notes(s,
`HR supplies most of the person, but not all of it, and the guide names a writer for every fact HR doesn't own.

Contractors and vendors aren't in HRIT. Book 03's rule is one authority per fact: the suitability register, the contract record, the PIV system, and a federal sponsor who is mastered in HR. Account type, slot 7, is the identity team's; during the transition a sync rule derives it from OU placement, and that rule is dropped once the value is on the source object. Clearance comes from the personnel security system. The do-not-sync flag is identity operations', in AD. Device attributes come from device provisioning at registration, through Graph, not from the user's HR record. Where someone signs in from is a sign-in signal: duty location is for scoping, and network-location policy enforces on the sign-in. Credentials, sessions and membership belong to the identity platform.

On the right, the pipeline doesn't wait for Core HCM. Book 03's reference deployment builds the middleware against the current HR system and Core HCM sandbox extracts at once, and switches source at go-live. Four choices make that a source swap: key on an agency-owned person key; map to OPM's standard elements, not vendor field names; keep one door into the directory, so validation, provenance and reconciliation outlast the source; and don't build on EHRI or eOPF shapes.

Where no HR feed exists yet, the guide's design guidance treats whoever stewards the attributes by hand as a temporary source contract, then retires it the way the contractor sequence does.`,
  `${G}, Stage 1 "What HR supplies, and what it doesn't," "Before the agency's wave lands"; Book 03, Chapter 04 — "Authoritative versus derived attributes"; Chapter 06 — "One fact, one authority," "Sequence: start with what already exists"; Chapter 13 — "Phase by phase"; Book 05, Chapter 08 — "The device attribute schema."`);
}

// ================================================================== 12 Canonical schema
{
  const s = content(M2, "The canonical schema, and one writer per attribute");
  tag(s, "What");
  img(s, "b03-hr-identity/ch07-attribute-ownership-chain", 0.6, 1.5, 3.3, 5.0);
  const tb = table(s, "Schema", 1.5, [3.4, 2.85, 2.35], ["Fact (codes are placeholders)", "Carrier", "Rules read it?"], [
    ["Enterprise person key", "employeeId", "Yes; rarely used"],
    ["Organization code, e.g. FIN-LED", "extensionAttribute10", "Yes: node groups"],
    ["Worker type code", "extensionAttribute11 (mirrors employeeType)", "Yes: personas"],
    ["Position category", "extensionAttribute12", "Yes: functional groups"],
    ["Division; cost center", "extensionAttribute6; 5 (mirror employeeOrgData)", "Yes: division units"],
    ["Region code (duty station)", "extensionAttribute4", "Yes: region groups"],
    ["Hire and leave dates", "employeeHireDate; employeeLeaveDateTime", "Hire date preview only; leave no"],
  ], { fontSize: 12, x: 4.15, limit: 5.5 });
  panel(s, "Writer", 4.15, tb + 0.15, 8.6, null, HEX.navy, HEX.navyTint, "THE PROVISIONING SERVICE IS THE ONLY WRITER", null, [
    "Help-desk, self-service and Exchange-admin write paths to the access slots are removed",
    "Security decides write permissions on HR-mastered attributes; any other write is drift",
  ], 13.5);
  sources(s, "Sources: Guide, Stage 1, crosswalk; Book 03, Ch 06 (design rules; writers; program attribute map), Ch 07; Book 06, Ch 17. Slots per the program attribute map (design guidance).");
  notes(s,
`The canonical schema is the data architect's, with HR owning the code lists. The chain on the left is Book 03's ownership model: OPM's standard defines the element and its codes, HR owns each person's value, the data architect stewards one name and one definition, the provisioning service is the only writer, and consumers read the value. A red arrow runs back: corrections flow upstream.

Book 03's design rules. Native Entra attributes first. Three coded extension attributes for access: organization code in slot 10, worker type code in slot 11, position category in slot 12. Codes, never display strings, in anything a rule reads. The table shows the program's carriers; FIN-LED and the other codes are placeholders for the agency's own lists. Division and cost center mirror employeeOrgData in slots 6 and 5, because rules can't read employeeOrgData; the worker type code mirrors employeeType for the same reason. Hire date is readable by rules only in preview, so keep it out of production rules; leave date isn't readable at all. For AD-landed users, the dates travel in slots 2 and 3 and a sync rule maps them. Use the same carrier in both landing zones, so a rule on slot 10 works for hybrid and cloud users alike.

And the writer rule, which is the one that holds the rest together. The provisioning service is the only writer of every schema field. Help-desk, self-service and Exchange-admin write paths to the access slots are removed, and security decides write permissions on HR-mastered attributes. Any other write is drift.`,
  `${G}, Stage 1 "The canonical schema," "Writers"; "Attribute-to-mechanism crosswalk"; Book 03, Chapter 06 — "Design rules," "Writers," "Program attribute map," "The schema"; Chapter 07 — "The data architect"; Book 06, Chapter 17 — "FedRAMP Moderate in the commercial cloud."`);
}

// ================================================================== 13 Stage 2
{
  const s = content(M2, "Stage 2: prove the attributes true before use");
  tag(s, "How");
  const pic = img(s, "b03-hr-identity/ch12-phase-gates", 0.6, 1.45, 12.15, 1.9);
  panel(s, "Work", 0.6, pic.bottom + 0.2, 6.0, null, HEX.navy, HEX.navyTint, "THE WORK (BOOK 03, PHASE 1)", null, [
    "Baseline HR against reality: worker type, organization, supervisor, status",
    "Fix errors at the source; populate employeeId before the first full sync",
    "Flag every unmatched enabled account as an orphan candidate with an owner",
    "Remove AD write paths on target OUs and Exchange custom-attribute cmdlets",
  ], 13);
  panel(s, "Gate", 6.85, pic.bottom + 0.2, 5.9, null, HEX.teal, HEX.tealTint, "DECISION AND GATE", null, [
    "Threshold set by the agency's risk governance; 99% on the pilot is a proposed start, not a requirement",
    "Every enabled account correlated or on a dated exception list",
    "Privacy basis, PIA and the minimized attribute set are gate items too",
    "Expect a burst of high-severity findings in month one: the measurement working",
  ], 13);
  sources(s, "Sources: Guide, Stage 2; Book 01, Ch 04 (from sessions to tokens); Book 03, Ch 06 (writers), Ch 07 (privacy office), Ch 11, Ch 12 (sequencing principle; Phase 1).");
  notes(s,
`Stage 2 is the one most programs want to skip, and the one Book 03 says not to. Every later control reads these attributes, so prove them before anything depends on them. The strip across the top is Book 03's phase model; Phase 1 is standards and authority, and its gate is Stage 2's.

The work. Baseline HR against reality for worker type, organization, supervisor and status, and fix every error at the source; HR owns the fix. Populate employeeId on existing accounts before the first full sync, because matching is what prevents duplicate identities at go-live. Flag every unmatched enabled account as an orphan candidate and give it an owner. Confirm the extension-attribute carriers are free. And remove the other writers: in AD, the write paths on the target OUs and Exchange's custom-attribute cmdlets.

The decision is the correlation threshold, set by the agency's risk governance. Ninety-nine percent on the pilot cohort is Book 03's proposed starting point, not a requirement, and a risk-tiered threshold is usually better. The gate: the threshold met on the pilot, and every enabled account correlated or on a dated exception list. Book 03 Chapter 07 adds that the privacy basis, the PIA and the minimized attribute set are Phase 1 gate items too.

The failure mode is automating against unverified data in month one. And expect a burst of high-severity findings when a new pipeline starts. That's the measurement working, not the program failing.`,
  `${G}, Stage 2; Book 01, Chapter 04 — "From sessions to tokens"; Book 03, Chapter 06 — "Writers"; Chapter 07 — "The privacy office"; Chapter 11 — "Drift between HR and the directory"; Chapter 12 — "Sequencing principle," "Phase 1: attribute authority and schema," "The program at a glance."`);
}

// ================================================================== 14 Stage 3
{
  const s = content(M2, "Stage 3: map the attributes through sync");
  tag(s, "How");
  img(s, "b02-identity/ch09-sync-auth-decision", 0.6, 1.5, 4.9, 5.0);
  const a = panel(s, "Decide", 5.75, 1.5, 7.0, null, HEX.navy, HEX.navyTint, "DECISIONS: IDENTITY ENGINEERING", null, [
    "Cloud Sync unless a Connect-only requirement applies; password hash sync everywhere",
    "Filtering: the DoNotSync scoping filter on extensionAttribute15",
    "Attribute flow: date mappings for AD-landed users; a transitional account-type rule from OU placement",
    "Gate: counts within ±1%, no sync errors; full sync reconciled, then shadow mode explained",
  ], 13);
  panel(s, "Fail", 5.75, a + 0.2, 7.0, null, HEX.red, HEX.redTint, "FAILURE MODES", null, [
    "A soft or hard match overwrites cloud values: clean AD first, block both outside a window",
    "Connect Sync below 2.6.84.0 with app-based auth stops syncing on April 7, 2027",
    "An omitted attribute in a /bulkUpload record can clear the target: send the whole record",
  ], 13);
  sources(s, "Sources: Guide, Stage 3; Book 02, Ch 09 (sync engine; filtering; attribute flow; soft and hard match), Ch 10 (Phase 1); Book 03, Ch 05, Ch 06, Ch 12 (Phase 3).");
  notes(s,
`Stage 3 is the plumbing between HR, AD and Entra ID during coexistence. The figure is Book 02's sync and sign-in decision.

Two decisions, both identity engineering's. The sync engine: Cloud Sync, the default, unless a Connect-only requirement applies, such as very large domains or groups, advanced sync rules, or cross-forest references. And the sign-in method: password hash sync everywhere, which leaked-credential detection and outage survival both need.

Then filtering and attribute flow. The do-not-sync scoping filter reads slot 15. The date mappings carry hire and leave dates for AD-landed users. And the transitional account-type rule derives slot 7 from OU placement until the value is on the source object, then it's dropped.

The gate comes from two books. Book 02's Phase 1: object counts within plus or minus one percent, no sync errors, and an attribute spot check. Book 03's Phase 3: the initial full sync reconciled before deltas, then shadow mode with every difference between pipeline and directory explained, and zero unmatched-record creations.

Three failure modes. A soft or hard match overwrites cloud attributes with on-premises values, so clean AD first and keep both match types blocked outside a planned window. A Connect Sync server that isn't on version 2.6.84.0 with application-based authentication stops synchronizing on April 7, 2027. And an omitted attribute in a bulk-upload record can clear the target value if clearing is enabled, so send the complete record every time.

With the attributes true and in place, Module 3 puts them to work.`,
  `${G}, Stage 3; Book 02, Chapter 09 — "Choosing and configuring the sync engine," "Filtering," "Attribute flow and transformations," "Soft match and hard match," "Cloud Sync or Connect Sync"; Chapter 10 — "Phase 1"; Book 03, Chapter 05 — "The middleware"; Chapter 06 — "The schema"; Chapter 12 — "Phase 3."`);
}
endModule("Module 2");

// ================================================================== 15 Module 3 divider
{
  const s = divider(M3, "Module 3: From attributes to mechanisms", "Stages 4 to 6  ·  beyond users  ·  PIV and CAC binding",
    ["Dynamic groups, administrative units, Conditional Access and Intune", "Devices, Arc servers, service principals and the object crosswalk", "PIV and CAC certificate binding as an attribute"], 18);
  notes(s,
`Module 3: from attributes to mechanisms. The attributes are true and in the directory. Now each mechanism that replaces an OU job reads them, and each has its own rules for what it can read.

So: Stage 4, OU subtrees rebuilt as dynamic-group rules; Stage 5, delegation through administrative units; Stage 6, Conditional Access personas and Intune targeting. Then the question the guide asks of every other object the tree held: does Microsoft document targeting it by attribute? Intune devices, Azure Arc servers, service principals and custom security attributes, and a crosswalk by object type. And last, PIV and CAC certificate binding, which is attribute-driven too.`,
  `${G}, Stages 4–6, "Beyond users," "PIV and CAC certificates as attributes."`);
}

// ================================================================== 16 Stage 4
{
  const s = content(M3, "Stage 4: OU subtrees become dynamic-group rules");
  tag(s, "How");
  const pic = img(s, "b03-hr-identity/ch10-derivation-chain", 0.6, 1.45, 12.15, 2.1);
  const tb = table(s, "Patterns", pic.bottom + 0.2, [2.1, 4.55], ["Pattern", "What it answers"], [
    ["Node query", "One place in the organization, by organization code; -in for a roll-up of codes"],
    ["Functional query", "An organizational attribute combined with another, e.g. IT and the security position category"],
    ["Every access rule", "Excludes disabled accounts, guests and agents' user accounts explicitly"],
  ], { fontSize: 12.5, limit: 6.5 });
  panel(s, "Gate", 7.5, pic.bottom + 0.2, 5.25, null, HEX.teal, HEX.tealTint, "DECIDE, GATE, FAIL", null, [
    "Convert only groups whose membership really follows department, location or role; flatten nesting",
    "No production access until the rule is validated, shadowed against its old group and piloted",
    "A rule change removes members who no longer match",
  ], 13);
  sources(s, "Sources: Guide, Stage 4; Book 01, Ch 04 (two query patterns); Book 02, Ch 09 (converting groups; nesting); Book 03, Ch 07, Ch 10 (rule patterns); Book 06, Ch 16, Ch 17.");
  notes(s,
`Stage 4. AD answered "who is in the Finance branch?" by walking the tree. Entra ID answers it by evaluating a rule. The strip at the top is Book 03's derivation chain: the personnel record, the stamped codes, dynamic groups where nobody joins by hand, and then access.

Every governed group uses one of two patterns from Book 01. A node query captures one place in the organization by organization code, and a roll-up over several codes uses the in operator rather than a chain of ors. A functional query combines an organizational attribute with another, for a question that isn't about position at all, like every IT user in the security position category, in every region. And every access rule explicitly excludes disabled accounts, guests and agents' user accounts.

The decision: convert a group only where its membership really follows department, location or role; otherwise keep it assigned. The application owner decides the access rule, and HR owns the values. Flatten nested chains rather than rebuilding them.

The gate is Book 06's: no dynamic group grants production access until its attributes are verified for a pilot cohort and its rule has been validated, shadowed against the group it replaces and reconciled.

Two failure modes. A rule on a display string breaks the next time someone retypes it. And a rule change removes existing members who no longer match, so a rule edit is a change with blast radius. Next, delegation.`,
  `${G}, Stage 4; Book 01, Chapter 04 — "The two query patterns"; Book 02, Chapter 09 — "Converting static groups to dynamic groups," "Nested groups"; Book 03, Chapter 07 — "Who uses it"; Chapter 10 — "Rule patterns"; Book 06, Chapter 16 — "Flat by design"; Chapter 17 — "Writing, naming and testing rules," "Choosing the attributes."`);
}

// ================================================================== 17 Stage 5
{
  const s = content(M3, "Stage 5: delegation moves to administrative units");
  tag(s, "Who");
  const pic = img(s, "b02-identity/ch05-three-tier-delegation", 0.6, 1.5, 6.6, 3.55);
  const a = panel(s, "Decide", 7.45, 1.5, 5.3, null, HEX.navy, HEX.navyTint, "DECISIONS (DESIGN GUIDANCE)", null, [
    "Each unit's dynamic rule mirrors its group's rule; division units read extensionAttribute6",
    "Restricted management: per unit, default no, decided before creation",
    "Role principals: assigned, role-assignable, PIM-eligible groups",
    "Create the unit and its scoped role before the groups it holds",
  ], 13);
  callout(s, "Write", Math.max(pic.bottom, a) + 0.25, 0.95, "FaTriangleExclamation", HEX.red, "A unit scopes writes, not reads: ",
    "it isn't a confidentiality boundary, and restricting a broad HR population takes it out of PIM, access reviews and workflows.");
  sources(s, "Sources: Guide, Stage 5; Book 01, Ch 04 (three-tier model; restricted management); Book 02, Ch 05 (units; restriction; role matrix; drift), Ch 06; Book 06, R07.");
  notes(s,
`Stage 5. OU-level delegation becomes administrative units: containers of users, groups or devices against which a role is assigned, so it applies only to the unit's members. The figure is the three-tier model. Tenant-scoped readers sit on top, because reader roles have no unit scope. Department units sit below with user and group administrators. Division units, created on demand, hold help-desk and password roles. Units don't nest; the dashed lines are naming only.

Each unit's dynamic rule mirrors the matching group's rule, and division units read the division code in slot 6.

The decisions. The delegation model is identity engineering's. Restricted management is a per-unit decision with a default of no, and it's made before the unit exists, because it can't be changed afterward. Role principals are assigned, role-assignable groups whose members are PIM-eligible. And create the unit and its scoped assignment before the groups it will hold, so there's no window where only a tenant-wide administrator can manage them.

The gate: every unit's rule matches the registry with processing on, every role assignment is in the matrix, and the scoped role is denied outside its unit.

Three failure modes from Book 01. Treating a unit as a confidentiality boundary when it only scopes writes. Restricting a broad HR-driven population, which removes it from PIM, entitlement management, Lifecycle Workflows and access reviews. And expecting a Global Administrator to be locked out, when restriction only makes the bypass deliberate and audited.`,
  `${G}, Stage 5; Book 01, Chapter 04 — "The three-tier model," "Restricted management"; Book 02, Chapter 05 — "What administrative units are," "Division AUs," "Restricted management: a per-AU decision," "Role assignment matrix," "Drift detection"; Chapter 06 — "The responsibility matrix"; Book 06, Runbook R07 — "Sequencing."`);
}

// ================================================================== 18 Stage 6
{
  const s = content(M3, "Stage 6: Conditional Access targets personas, not the tree");
  tag(s, "How");
  const pic = img(s, "b04-access/ch03-grant-block-pair", 0.6, 1.45, 7.4, 2.2);
  const a = panel(s, "Persona", 8.25, 1.45, 4.5, null, HEX.navy, HEX.navyTint, "PERSONAS FROM ATTRIBUTES", null, [
    "Internals: worker type code in extensionAttribute11",
    "Admins: account type Privileged, or the PIM-eligible population",
    "Emergency-access group excluded",
  ], 13);
  const b = panel(s, "Gate", 0.6, Math.max(pic.bottom, a) + 0.2, 5.6, null, HEX.teal, HEX.tealTint, "GATE", null, [
    "Every policy in report-only for two to four weeks, then enforced in waves behind a monitoring gate",
    "Every policy targets only governed groups",
    "Account lockout isn't a CA control: Entra smart lockout or Intune",
  ], 13);
  panel(s, "Fail", 6.45, Math.max(pic.bottom, a) + 0.2, 6.3, null, HEX.red, HEX.redTint, "FAILURE MODES", null, [
    "A grant policy restricts nothing on its own: pair it with a block",
    "A policy on a dynamic group misses every user whose attribute is empty",
    "Role targeting misses unit-scoped roles: target the admins' group",
    "No inheritance through units: the branch group must hold everyone the GPO reached",
  ], 13);
  sources(s, "Sources: Guide, Stage 6; Book 01, Ch 04 (CA, the inheritance replacement; verification); Book 02, Ch 06, Ch 09 (testing and rollout); Book 04, Ch 03 (personas; pairs; exclusions).");
  notes(s,
`Stage 6. GPOs inherited down the tree; Conditional Access policies and Intune assignments target groups. So the targeting unit becomes a persona built from authoritative attributes. Internals come from the worker type code in slot 11. Admins come from account type Privileged, or the PIM-eligible population. And the emergency-access group is excluded from enforced policies.

The figure is Book 04's most important pattern. A grant policy restricts nothing on its own: requiring phishing-resistant MFA for Finance on the payroll app doesn't stop anyone else. It needs a paired block for everyone who isn't in the group.

The gate. Every policy runs in report-only for two to four weeks, then is enforced in waves behind a monitoring gate, with the emergency-access group excluded, and every policy targets only governed groups. The CISO owns the control requirements. Some GPO settings aren't Conditional Access controls at all; account lockout goes to Entra smart lockout or Intune.

Three more failure modes, all attribute-shaped. A policy that includes a dynamic group silently misses every user whose attribute is empty, so the block side has to catch them. Role targeting doesn't reach roles scoped to an administrative unit, so target the administrators' group instead. And Conditional Access doesn't inherit through units, so the branch group has to include everyone the ancestor GPO targeted.

Devices are the other half of Stage 6, and there the guide corrects the emphasis.`,
  `${G}, Stage 6; Book 01, Chapter 04 — "Conditional Access: the policy-inheritance replacement," "Verification"; Book 02, Chapter 09 — "Testing and rollout"; Book 04, Chapter 03 — "Personas," "Policies come in pairs," "Exclusions," "Users, groups, roles and workload identities."`);
}

// ================================================================== 19 Intune
{
  const s = content(M3, "Intune targeting: device groups, and prefer filters");
  tag(s, "How");
  img(s, "b05-devices/ch08-targeting-layers", 0.6, 1.5, 2.75, 5.0);
  const tb = table(s, "Target", 1.5, [3.0, 6.15], ["Target", "Use it for (Microsoft Learn, Oct. 29, 2026)"], [
    ["User groups", "Settings that belong to the user, such as email and user certificates"],
    ["Device groups", "Settings that must stay on a device; dynamic rules read device attributes only"],
    ["Assignment filters", "Where a filter meets the need; for time-sensitive assignment, a filter on a user group or All devices"],
    ["Device extension attributes", "Group rules only: filters can't read them, so tier and role stay in dynamic device groups"],
  ], { fontSize: 12.5, x: 3.6, limit: 5.2 });
  panel(s, "Owner", 3.6, tb + 0.2, 9.15, null, HEX.amber, HEX.amberTint, "PREFER FILTERS WHERE THEY MEET THE NEED", null, [
    "Dynamic device groups add processing delay; for time-sensitive assignment, filter a user group or All devices",
    "Device rules can't read the owner's attributes: a user's code never reaches a device group",
  ], 13.5);
  sources(s, "Sources: Microsoft Learn, Assign policies in Microsoft Intune; Manage rules for dynamic membership groups (Oct. 29, 2026). Guide, Stage 6, Limits; Book 05, Ch 08.");
  notes(s,
`Intune targeting is where Microsoft's current guidance changes the emphasis, and Book 05 now carries it.

By default Book 05 assigns each Intune policy to dynamic device groups built from device extension attributes, with assignment filters as a second layer for hardware, ownership, join type and OS. The figure is that layering: device attributes on the Entra device object, dynamic device groups, then the assignment with exclusions and a filter, then one owning policy per setting, feeding compliance to Conditional Access.

Microsoft Learn, checked October 29, 2026, moves the emphasis. Intune can assign to user groups too: settings that belong to the user, such as email and user certificates, go to user groups, and settings that must stay on a device go to device groups. Dynamic device groups add processing delay, and for time-sensitive assignment Microsoft recommends an assignment filter on a user group or on All devices. So prefer filters where they meet the need.

It's not a contradiction for extension-attribute targeting, because filters evaluate Intune device properties at check-in and can't read extension attributes. Security tier, device role and environment still belong in dynamic device group rules. The guide and Book 05 state both.

And one rule underneath everything: device rules can read only device attributes, never the device owner's. A user's organization code never reaches a device group by itself; device attributes come from device provisioning. Next slide, how those are written.`,
  `${G}, Stage 6 "What it is," "Limits: latency"; verification log D2; Book 05, Chapter 08 — "Assignment strategy," "The device attribute schema," "Policy types."`);
}

// ================================================================== 20 Devices
{
  const s = content(M3, "Beyond users: Intune and Entra devices");
  tag(s, "What");
  const a = panel(s, "Rules", 0.6, 1.5, 6.0, null, HEX.navy, HEX.navyTint, "DYNAMIC DEVICE GROUPS", null, [
    "Rules read device properties only: OS type, ownership, trust type, enrollment profile, physical IDs, extension attributes 1–15",
    "Autopilot: a [ZTDid] rule selects every Autopilot device; the group tag maps to OrderID",
  ], 13);
  panel(s, "Filters", 0.6, a + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "ASSIGNMENT FILTERS AND SCOPE TAGS", null, [
    "Filters read Intune properties at check-in: name, ownership, trust type, model, OS SKU, OS version and more",
    "No extension attributes in filters",
    "Scope tags: at most 100 per object or role; Intune RBAC doesn't apply to Entra roles",
  ], 13);
  const b = panel(s, "Write", 6.85, 1.5, 5.9, null, HEX.amber, HEX.amberTint, "WRITING DEVICE EXTENSION ATTRIBUTES", null, [
    "Microsoft Graph: PATCH /devices/{id} with an extensionAttributes body",
    "Application permission: Device.ReadWrite.All",
    "Delegated: Directory.AccessAsUser.All, with Intune Administrator as the least role",
    "App-only calls, or non-Windows devices: only extensionAttributes can be updated",
  ], 13);
  panel(s, "Check", 6.85, b + 0.2, 5.9, null, HEX.red, HEX.redTint, "PICK THE PERMISSION FOR THE CALL", null, [
    "Signed in: Directory.AccessAsUser.All as at least Intune Administrator, as Book 05's sample now does; an unattended service: Device.ReadWrite.All",
  ], 13);
  sources(s, "Sources: Microsoft Learn, dynamic membership rules; Windows Autopilot device groups; Graph Update device; Intune filters; scope tags (Oct. 29, 2026). Guide; Book 05, Ch 08.");
  notes(s,
`Beyond users. The stages move users, but the tree held other objects, and the guide asks the same question of each: does Microsoft document targeting it by attribute? For Intune and Entra devices, yes. These are Microsoft Learn facts as of October 29, 2026.

Dynamic device groups read device properties, such as OS type, ownership, trust type, enrollment profile name, physical IDs and extension attributes one through fifteen, and only device properties. Windows Autopilot devices carry their own markers: a rule on the zero-touch ID marker selects every Autopilot device, and the Autopilot group tag maps to the device's order ID, so a rule can select one tag.

Writing device extension attributes is a Graph call, a patch on the device with an extension-attributes body. The permission depends on the call. Microsoft's least-privileged application permission is Device read-write all. For delegated calls it's Directory access-as-user all, with Intune Administrator as the least-privileged role. And in app-only calls, or for non-Windows devices, only the extension attributes can be updated. Book 05's sample signs in with the delegated permission, as at least Intune Administrator.

Assignment filters evaluate Intune properties at check-in, operating-system version among them; no extension attributes, which matches Book 05. And scope tags delegate inside Intune: at most 100 per object or role, and Intune's role-based access control doesn't apply to Entra roles.`,
  `${G}, "Beyond users: Intune and Entra devices"; verification log D5; Book 05, Chapter 08 — "Writing a device attribute," "Scope tags."`);
}

// ================================================================== 21 Arc
{
  const s = content(M3, "Beyond users: Azure Arc servers, through Resource Manager");
  tag(s, "What");
  const pic = img(s, "b05-devices/ch09-arc-management-plane", 0.6, 1.5, 6.1, 3.85);
  const a = panel(s, "Arc", 6.95, 1.5, 5.8, null, HEX.navy, HEX.navyTint, "TAGS ARE THE SERVER'S ATTRIBUTES", null, [
    "The Connected Machine agent gives the server an Azure resource ID, governed and tagged like a VM",
    "Tags set at onboarding with azcmagent connect --tags, or later through portal, CLI, PowerShell, ARM or Policy",
    "Azure Policy can test tags; the built-in inherit-a-tag policy uses modify, with remediation",
    "Azure Resource Graph queries tags at scale",
  ], 13);
  callout(s, "ABAC", Math.max(pic.bottom, a) + 0.25, 0.95, "FaServer", HEX.red, "Not documented for Arc: ",
    "Azure ABAC conditions work only on role assignments with blob or queue storage data actions, not on managing servers.");
  sources(s, "Sources: Microsoft Learn: Cloud-native server management; Organize and inventory servers; azcmagent connect; Tag policies; Azure ABAC overview (Oct. 29, 2026). Guide; Book 05, Ch 09.");
  notes(s,
`Azure Arc-enabled servers: yes, attribute-driven, but through Azure Resource Manager rather than Entra ID. The figure is Book 05's management plane: the on-premises server runs the Connected Machine agent, still domain joined until a separate decision, and connects outbound to an Arc machine resource with its resource ID, tags, Azure role assignments and extensions, plus a system-assigned managed identity in Entra ID.

From Microsoft Learn, October 29, 2026. Once connected, the server is an Azure resource, organized by management group, subscription and resource group like an Azure VM, and policies, role assignments and tags apply the same way. Tags are its attributes: key-value pairs set at onboarding, where the connect command takes a comma-delimited tag list, or afterward through the portal, CLI, PowerShell, ARM templates or Azure Policy. Book 05 sets the program's tag taxonomy and warns that tags are plain text.

Azure Policy assignments are scoped by management group, subscription or resource group, and rules can test tag values. The built-in policy that inherits a tag from the resource group if it's missing uses the modify effect, and a remediation task fixes existing resources. Resource Graph queries server metadata and tags at scale.

And one boundary, stated as the guide states it. Azure attribute-based access control conditions can currently be added only to role assignments with blob or queue storage data actions. Microsoft doesn't document them for managing Arc servers. So role assignments at those scopes govern who manages the server.`,
  `${G}, "Azure Arc-enabled servers: yes, through Azure Resource Manager"; Book 05, Chapter 09 — "Resource groups and tags," "Azure Policy and machine configuration."`);
}

// ================================================================== 22 Service principals
{
  const s = content(M3, "Beyond users: service principals and custom attributes");
  tag(s, "What");
  const tb = table(s, "Stores", 1.5, [3.0, 2.3, 2.25, 4.6], ["Attribute store", "Dynamic rules", "Conditional Access", "Other consumers"], [
    ["extensionAttribute1–15 (users, devices)", "Yes, users and devices", "Device filters", "Lifecycle Workflows scope"],
    ["Directory extension properties", "Yes, single-value only", "Not documented", "—"],
    ["Custom security attributes (users, SPs)", "No", "App filters (SPs, string type)", "Azure ABAC principal; LCW scope; HR provisioning"],
    ["Azure resource tags (Arc and others)", "No", "No", "Azure Policy; Resource Graph; Update Manager"],
  ], { fontSize: 12, limit: 4.4 });
  panel(s, "SP", 0.6, tb + 0.2, 6.0, null, HEX.navy, HEX.navyTint, "SERVICE PRINCIPALS: PARTLY", null, [
    "CA for workload identities: single-tenant SPs, direct assignment, Block only, Workload ID Premium",
    "App role assignment: group-based needs P1 or P2; no cascade to nested groups",
    "No dynamic-group rule type for service principals is documented",
  ], 12.5);
  panel(s, "CSA", 6.85, tb + 0.2, 5.9, null, HEX.teal, HEX.tealTint, "CUSTOM SECURITY ATTRIBUTES", null, [
    "Defined and assigned by two attribute roles; Global Administrator can't read them by default",
    "Up to 500 definitions per tenant, 50 values per object",
    "For sensitive values no rule reads; access codes stay in slots 10 to 12",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn: custom security attributes; CA filter for applications; CA for workload identities; app assignment; dynamic rules (Oct. 29, 2026). Guide; Book 04, Ch 03.");
  notes(s,
`Service principals and applications: partly. The table at the top is the guide's view of which attribute store each mechanism can read, from Microsoft Learn as of October 29, 2026.

Extension attributes one to fifteen work in dynamic rules for users and devices, device filters read the device's slots, and Lifecycle Workflows can scope on them. Directory extension properties work in rules, single-value only, and Conditional Access use isn't documented. Custom security attributes can't be used in dynamic membership rules, but Conditional Access can filter applications by them on service principals, string type only, evaluated at token issuance; Azure ABAC conditions can read them on the principal; Lifecycle Workflows can scope on them; and they can be provisioned from HR, including through API-driven provisioning. Azure resource tags feed Policy, Resource Graph and Update Manager dynamic scoping.

For service principals specifically. Conditional Access for workload identities covers single-tenant service principals assigned directly; a group that contains one isn't enforced, Block is the only grant, managed identities aren't covered, and Workload ID Premium is required. App role assignment to users and groups reaches the token's roles claim; group-based assignment needs P1 or P2 and doesn't cascade to nested groups. And Microsoft documents no dynamic-group rule type for service principals; agent identities aren't supported as members.

Custom security attributes suit sensitive values no rule reads, because reading them is restricted to the attribute roles. Access codes stay in slots ten to twelve, as Book 03 decides.`,
  `${G}, "Service principals and applications: partly," "Which attribute store each mechanism can read"; Book 03, Chapter 06 — "Design rules"; Book 04, Chapter 03 — "Target resources"; Book 05, Chapter 09 — "Resource groups and tags."`);
}

// ================================================================== 23 Object crosswalk
{
  const s = content(M3, "The object-type crosswalk: stores, writers, consumers");
  tag(s, "What");
  table(s, "Objects", 1.45, [1.55, 3.0, 3.85, 3.75], ["Object", "Attribute store", "Who writes it", "What consumes it"], [
    ["User", "Native attributes; extensionAttribute1–15", "HR via API-driven provisioning, into Entra ID, or into AD then sync", "Dynamic groups and units; CA through groups; Lifecycle Workflows"],
    ["User", "Custom security attributes", "Attribute Assignment Administrator; HR provisioning", "Azure ABAC; Lifecycle Workflows scope"],
    ["User", "certificateUserIds", "Entra Connect from AD (synced); Graph or admin center (cloud-only)", "CBA username binding"],
    ["Device", "extensionAttribute1–15", "Graph at registration (delegated or app-only permission)", "Dynamic device groups; CA device filters"],
    ["Device", "Enrollment profile; physical IDs", "Intune at enrollment; Autopilot registration and group tag", "Dynamic device groups; Intune filters"],
    ["Device", "Intune inventory (model, ownership, OS SKU)", "Intune", "Assignment filters"],
    ["Arc server", "Azure tags; resource group", "azcmagent --tags; CLI, PowerShell, ARM; Policy modify", "Azure Policy; Resource Graph; RBAC scope"],
    ["Service principal", "Custom security attributes", "Attribute Assignment Administrator", "CA application filters; Azure ABAC"],
    ["Service principal", "None: direct assignment", "Conditional Access Administrator", "CA for workload identities"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn pages as footnoted in the guide's \"Attribute-driven targeting by object type\" table (Oct. 29, 2026); guide crosswalk; Book 02, App C; Book 03, Ch 06.");
  notes(s,
`This is the guide's object-type crosswalk on one slide: for each object, the attribute store, who writes it, what consumes it. Every row carries a Microsoft Learn source in the guide, checked October 29, 2026.

Users have three stores. Native attributes and extension attributes, written by HR through API-driven provisioning, either into Entra ID or into AD and then sync, and consumed by dynamic groups and units, Conditional Access through groups, and Lifecycle Workflows. Custom security attributes, assigned by the Attribute Assignment Administrator or provisioned from HR, consumed by Azure ABAC and Lifecycle Workflows scope. And certificateUserIds, which the PIV slides come to next.

Devices have three too. Extension attributes, written through Graph at registration, with the delegated or app-only permission from the devices slide, and read by dynamic device groups and Conditional Access device filters. Enrollment profile and physical IDs, set by Intune at enrollment and by Autopilot registration and group tag. And Intune's own inventory, model, ownership and OS SKU, which only assignment filters read.

Arc servers carry Azure tags and their resource group, written at connect time or by CLI, PowerShell, ARM or a Policy modify effect, and consumed by Policy, Resource Graph and role-assignment scope. Service principals carry custom security attributes for application filters and ABAC, or nothing at all: workload-identity Conditional Access is direct assignment by the Conditional Access Administrator.

The pattern to take away: every row names one writer. That's the same single-writer rule as the user schema.`,
  `${G}, "Object types, stores, writers and consumers," "Attribute-to-mechanism crosswalk"; Book 02, Appendix C — "Extension attribute assignments"; Book 03, Chapter 06 — "Program attribute map."`);
}

// ================================================================== 24 PIV binding
{
  const s = content(M3, "PIV and CAC: the certificate binding is an attribute");
  tag(s, "What");
  const pic = img(s, "b03-hr-identity/ch09-credential-assurance", 0.6, 1.45, 12.15, 2.15);
  const tb = table(s, "Bindings", pic.bottom + 0.2, [2.9, 3.6, 0.95], ["Certificate field", "User attributes it can bind to", "Affinity"], [
    ["PrincipalName (SAN), RFC822Name", "userPrincipalName, onPremisesUserPrincipalName, certificateUserIds", "Low"],
    ["Subject, IssuerAndSubject", "certificateUserIds", "Low"],
    ["SKI, SHA1PublicKey, IssuerAndSerialNumber", "certificateUserIds", "High"],
  ], { fontSize: 12, limit: 6.5 });
  panel(s, "Aff", 8.3, pic.bottom + 0.2, 4.45, null, HEX.navy, HEX.navyTint, "AFFINITY AND STRENGTH", null, [
    "Default binding: SAN Principal Name to userPrincipalName; required affinity defaults to low",
    "CBA is only as secure as its lowest-affinity binding",
    "Setting high tenant-wide too early locks users out",
    "Phishing-resistant strength takes multifactor CBA only",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn: CBA technical concepts; Set up CBA; Authentication strengths; M-22-09 MFA (Oct. 29, 2026). Guide, PIV section; Book 03, Ch 09; Book 07, Ch 06.");
  notes(s,
`Certificate-based authentication is attribute-driven too: Entra ID finds the user by matching a field of the presented certificate to a user attribute. Book 03 Chapter 09 and Book 07 Chapter 06 carry the design; the guide ties it to attribute sourcing. The strip is Book 03's credential chain: the HR joiner event starts sponsorship, proofing follows, card management issues the PIV credential, it's bound to the account, and phishing-resistant sign-in records the assurance.

Microsoft Learn, October 29, 2026. By default the SAN Principal Name maps to userPrincipalName. The table is the binding policy: name and email fields, low affinity; subject and issuer-and-subject, also low, to certificateUserIds only; and subject key identifier, public-key hash and issuer-and-serial, high affinity. A note from the verification log: Microsoft's prose says three low-affinity mappings while its own table marks four; the guide and the chapters follow the table.

High-affinity bindings use identifiers that can't be reused. The tenant's required affinity defaults to low, can be set to high or overridden by rules on issuer or policy OID, and when high applies the low bindings are dropped. With several bindings, CBA is only as secure as the lowest one. Setting the tenant to high before every user's value is right can lock users out. The program's position is high affinity in production.

And strength. The built-in phishing-resistant strength accepts multifactor CBA; the binding policy treats every certificate as single-factor by default, and issuer or OID rules raise PIV or CAC certificates to multifactor.`,
  `${G}, "PIV and CAC certificates as attributes": "Username binding," "Affinity," "Authentication strength"; verification log D6; Book 03, Chapter 09 — "Binding the PIV certificate to the Entra user"; Book 07, Chapter 06 — "Entra certificate-based authentication," "Username bindings and affinity."`);
}

// ================================================================== 25 certificateUserIds
{
  const s = content(M3, "certificateUserIds: who writes it, and the open pilot");
  tag(s, "Who");
  const tb = table(s, "Cuid", 1.5, [2.5, 4.9, 4.75], ["User", "Who can write certificateUserIds", "How"], [
    ["Cloud-only", "At least a Privileged Authentication Administrator", "Admin center (four values of 120 characters) or Graph, authorizationInfo"],
    ["Synced", "At least a Hybrid Identity Administrator; only Entra Connect", "Synced from AD, e.g. altSecurityIdentities, or an expression over the UPN"],
    ["Either", "Up to 10 values of 1,024 characters, unique in the tenant", "Only current, valid certificates; remove on expiry or revocation"],
  ], { fontSize: 12.5, limit: 4.1 });
  const a = panel(s, "Source", 0.6, tb + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "WHERE THE BINDING COMES FROM", null, [
    "HR supplies the person: record, key, the joiner event that starts sponsorship",
    "The card management system supplies the binding; a reissue changes it",
    "Hybrid: written to altSecurityIdentities in AD, then synced",
    "The leaver removes the value as well as revoking the card",
  ], 12.5);
  const b = panel(s, "Open", 6.85, tb + 0.2, 5.9, null, HEX.red, HEX.redTint, "UNVERIFIED: ISSUE #130, OPEN", null, [
    "After AD, the card management system writes certificateUserIds through Graph at issuance: design guidance, unverified",
    "Open: which permission a workload needs, and how the write behaves after source of authority moves",
    "Cloud Sync for this attribute: not documented",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn, Mapping to the certificateUserIds attribute (Oct. 29, 2026). Guide, PIV section; workbook issue #130; Book 03, Ch 09; Book 07, Ch 06, Ch 07.");
  notes(s,
`The certificate user IDs attribute is the one that carries a PIV or CAC binding, so who writes it matters as much as any HR attribute. From Microsoft Learn, October 29, 2026.

It holds up to ten values of up to 1,024 characters, each unique in the tenant, with case-sensitive prefixes. For cloud-only users, at least a Privileged Authentication Administrator writes it, in the admin center, up to four values of 120 characters there, or through Graph on the user's authorization info. For synced users, at least the Hybrid Identity Administrator role is needed and only Microsoft Entra Connect can update it, by syncing a value from AD such as altSecurityIdentities, or an expression over the UPN. Microsoft notes that AD administrators can change the value for any synced account, and asks that only current valid certificates be populated and that values be removed on expiry or revocation. The page names Entra Connect only; it doesn't document Cloud Sync for this attribute, and the guide says so.

Where the binding comes from. HR supplies the person: the record, the key and the joiner event. The card management system supplies the binding, because a high-affinity value identifies one certificate and a reissue changes it. During hybrid it's written to altSecurityIdentities in AD, which strong certificate mapping also uses on domain controllers, and synced.

After AD, the design is that the card management system writes the value through Graph at issuance. That's design guidance and unverified: an open pilot, workbook issue 130, asking which permission a workload needs and how the write behaves once source of authority has moved. Microsoft documents neither. Module 4 puts all of this to work.`,
  `${G}, "PIV and CAC certificates as attributes": "certificateUserIds," "Where the binding comes from"; verification log claims 70 and 74, "Could not verify"; Book 03, Chapter 09 — "Binding the PIV certificate," "The canonical leaver sequence"; Book 07, Chapter 06 — "Strong certificate mapping"; Chapter 07 — "AD CS chain into Entra ID."`);
}
endModule("Module 3");

// ================================================================== 26 Module 4 divider
{
  const s = divider(M4, "Module 4: Running the migration", "Stages 7 and 8  ·  worked example  ·  limits, checklist and decisions",
    ["One analyst through a mover event, end to end", "Phased cutover by attribute-defined waves; drift correction", "The limits, the checklist and the decisions"], 16);
  notes(s,
`Module 4: running it. The model is in place, the attributes are true and every mechanism reads them. Now the guide follows one person through a mover event to show the chain working, then runs the cutover and the drift loop that keeps it true.

So: the worked example, one budget analyst and one reassignment with no ticket; Stage 7, the phased cutover and how a population proves HR is its sole source; Stage 8, drift detection and correction at the source; the limits as the chapters and Microsoft state them; and the checklist and decisions.`,
  `${G}, "Worked example," Stages 7–8, "Limits," "Checklist."`);
}

// ================================================================== 27 Worked example
{
  const s = content(M4, "Worked example: one analyst, every mechanism");
  tag(s, "How");
  const tb = table(s, "Her", 1.5, [3.5, 3.5, 5.15], ["Her record (codes are placeholders)", "Carrier", "What it does for her"], [
    ["Enterprise person key", "employeeId", "Matches her worker record; joins audit and drift"],
    ["Organization code FIN-LED", "extensionAttribute10", "The node group for FIN-LED; a SQL Server reader group with her position code"],
    ["Division code", "extensionAttribute6", "The division unit, so its scoped help desk can reset her password"],
    ["Worker type EMP", "extensionAttribute11", "The Internals persona: the baseline Conditional Access policies"],
    ["Position category ANALYST", "extensionAttribute12", "The functional group for analysts across organizations"],
    ["Supervisor", "manager", "Approver for access packages, reviewer for access reviews"],
    ["Her laptop (not her record)", "Device tier and role", "Device groups on the laptop's own attributes"],
  ], { fontSize: 12.5, limit: 5.55 });
  callout(s, "Landing", tb + 0.2, 0.85, "FaRoute", HEX.teal, "She's AD-mastered: ",
    "the provisioning agent writes her AD account, Cloud Sync carries it up, and her Entra extension attributes are read-only.");
  sources(s, "Sources: Guide, \"Worked example\" Stages 1, 3 and 4 to 6; Book 02, Ch 05; Book 03, Ch 05, Ch 06, Ch 10; Book 04, Ch 03; Book 05, Ch 08; Book 06, Ch 17.");
  notes(s,
`The guide's worked example follows one user. A budget analyst in a finance division, a federal employee, AD-mastered because her division hasn't cut over yet. The codes are placeholders.

Stage 1, the record. Core HCM holds her worker record and assignment, and the crosswalk projects it: her enterprise person key in employeeId, department Finance, organization code FIN-LED in slot 10, a division code in slot 6, worker type EMP in slot 11, position category ANALYST in slot 12, a region code, and her supervisor as manager.

Stage 3, the landing. Because she's AD-mastered, the provisioning agent writes these values to her AD account and Cloud Sync projects them to Entra ID, where her extension attributes are read-only.

Stages 4 to 6, the effects, the right-hand column. She's in the node group for FIN-LED and the functional group for analysts across organizations. She's in the department and division units, so the division's scoped help desk can reset her password. She's in the Internals persona, so the baseline Conditional Access policies apply. She's in a SQL Server reader group whose rule reads her organization and position codes. Her supervisor approves her access packages and reviews her access.

And the last row is deliberately not her record. Her laptop's policies come from device groups on the laptop's own tier and role attributes. Nobody assigned her to any of this by hand. Now HR moves her.`,
  `${G}, "Worked example: one user and one mover event," Stages 1, 3 and 4–6; Book 02, Chapter 05 — "Role assignment matrix"; Book 03, Chapter 05 — "Landing in Active Directory"; Chapter 06 — "Program attribute map"; Chapter 10 — "Rule patterns"; Book 04, Chapter 03 — "Personas"; Book 05, Chapter 08 — "Tier groups"; Book 06, Chapter 17 — "Choosing the attributes."`);
}

// ================================================================== 28 Mover event
{
  const s = content(M4, "The mover event: one personnel action, no ticket");
  tag(s, "How");
  img(s, "b03-hr-identity/ch08-personnel-action-lifecycle", 0.6, 1.5, 3.9, 4.75);
  table(s, "Chain", 1.5, [0.5, 7.5], ["#", "Nature-of-action code 721 moves her to accounts payable"], [
    ["1", "Core HCM publishes it; middleware validates, writes provenance, sends her complete record with FIN-AP"],
    ["2", "The agent updates AD; the next sync carries it up. Attribute-change triggers fire only after sync"],
    ["3", "Groups and units recompute, usually within hours but possibly over 24; analyst group and persona don't change"],
    ["4", "The mover workflow swaps access packages, notifies managers and reviews what's left"],
    ["5", "Her laptop's device groups don't move: device rules can't read her attributes"],
    ["6", "The drift scan compares HR with the directory field by field; the evidence is what PS-5 asks for"],
  ], { fontSize: 12.5, x: 4.75, firstColor: HEX.teal, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn, dynamic membership rules (Oct. 29, 2026). Guide, \"The mover event\"; Book 01, Ch 04; Book 02, Ch 10; Book 03, Ch 05, 08, 11; Book 05, Ch 08; Book 06, Ch 16.");
  notes(s,
`HR processes her reassignment to the accounts-payable division as a personnel action, nature-of-action code 721, which the figure classifies as a seven-hundred-series mover. Nobody opens a ticket. The chain:

One. Core HCM publishes the change on its assignment feed; the middleware validates it, writes a provenance record and sends her complete record to bulk upload, with organization code FIN-AP and the new division code.

Two. The provisioning agent updates her AD account, and the next sync cycle carries the values to Entra ID. Attribute-change triggers fire only after the sync delivers the change.

Three. Dynamic groups and units recompute. She leaves the FIN-LED groups and the old division unit and joins the FIN-AP ones, usually within a few hours but possibly more than 24. The analyst group and the Internals persona don't change, because position category and worker type didn't. Access the SQL Server group gave her ends at the engine only after rule processing, token expiry and session turnover.

Four. The mover workflow, triggered by the division-code change, removes the old department's access package, requests the new one, notifies the managers and starts a review of what's left, because access from a package or a direct assignment doesn't leave on its own. Approvals now route to her new supervisor.

Five. Her laptop's device groups don't move, because device rules can't read her attributes; that's device reconciliation, not HR.

Six. The drift scan compares her HR record with the directory field by field. The evidence is the provenance record, the provisioning log, the workflow history and the transfer-to-review interval PS-5 asks for. When her division cuts over, the same record lands in Entra ID directly, and nothing she has changes.`,
  `${G}, "Worked example: The mover event"; Book 01, Chapter 04 — "Mover"; Book 02, Chapter 10 — "Lifecycle Workflows," "Mover workflow"; Book 03, Chapter 05 — "The middleware"; Chapter 08 — "Personnel actions are the triggers," "Mover"; Chapter 11 — "The measured lifecycle"; Book 05, Chapter 08; Book 06, Chapter 16 — "When a change takes effect."`);
}

// ================================================================== 29 Stage 7
{
  const s = content(M4, "Stage 7: cut over in phases, wave by wave");
  tag(s, "How");
  const strip = img(s, "b03-hr-identity/appc-cutover-sequence", 0.6, 1.45, 12.15, 1.55);
  const pic = img(s, "b00-orientation/ch09-waves-by-attribute", 0.6, strip.bottom + 0.2, 5.6, 2.25);
  const a = panel(s, "Plan", 6.45, strip.bottom + 0.2, 6.3, null, HEX.navy, HEX.navyTint, "THE RUNBOOK, NOT A FLAG DAY", null, [
    "Pilot division, then two or three at a time, each drift-clean",
    "Waves are attribute values: each scope is a query",
    "Leaver automation first; HR, directory and Core HCM aligned",
    "Retarget provisioning to the Entra app; AD leg dormant",
  ], 12.5);
  callout(s, "Disable", Math.max(pic.bottom, a) + 0.15, 0.7, "FaDoorClosed", HEX.red, "Disable, don't delete: ",
    "deleting GPOs removes the rollback; deleting a synced user only in Entra ID gets restored by sync.");
  sources(s, "Sources: Microsoft Learn, Guidance for user Source of Authority (Oct. 29, 2026). Guide, Stage 7; Book 00, Ch 09; Book 01, Ch 04; Book 03, Ch 08, Ch 12, App C; Book 05, Ch 08.");
  notes(s,
`Stage 7 is a phased runbook, not a flag day. The bottom-left figure is Book 00's waves by attribute: because waves are defined by attribute values, each wave's scope is a query and its dynamic groups already exist. A pilot division first, then division by division, two or three at a time, each drift-clean before the next. Book 05's workload waves run inside those division waves.

Decisions. Wave go and no-go is identity engineering's. Leaver automation goes first, because revocation is where the risk and the evidence are. Align each population's HR cutover with its move to Entra ID and with the agency's Core HCM interconnection. And as a population becomes cloud-mastered, retarget its provisioning from the AD app to the Entra app, with the AD leg dormant but intact. Microsoft's source-of-authority guidance, checked October 29, 2026, says the same: once the users' sync cycle completes, remove them from the HR-to-AD scope and add them to the HR-to-Entra configuration.

The gate is the strip across the top, Book 03's Appendix C. Acceptance tests by worker type, a signed validation report, a dry run on production data with writes disabled, cutover with rollback ready, then seven days in which every change for the population traces to an HR event, and only then the ticket path for account creation closes. Cloud-mastered populations run the full lifecycle with no AD writes, and rollback has been tested once. Legacy retirement is the only destructive phase, approved item by item.

Failure modes: a division reaching full availability before its own pilot is drift-clean; deleting GPOs instead of disabling links; and deleting a synced user only in Entra ID, which the next sync restores.`,
  `${G}, Stage 7; Book 00, Chapter 09 — "Waves defined by attribute values"; Book 01, Chapter 04 — "Migration phases," "Phase 4: legacy retirement"; Book 03, Chapter 08 — "Deletion"; Chapter 12 — "Phase 4," "Phase 5"; Appendix C — "Proving HR is the sole source"; Book 05, Chapter 08 — "Phase 5," "Rollback."`);
}

// ================================================================== 30 Stage 8
{
  const s = content(M4, "Stage 8: detect drift and fix it at the source");
  tag(s, "How");
  const pic = img(s, "b03-hr-identity/ch11-drift-evidence-loop", 0.6, 1.45, 12.15, 1.6);
  const a = panel(s, "Classes", 0.6, pic.bottom + 0.2, 6.0, null, HEX.navy, HEX.navyTint, "TWO SCHEDULED COMPARISONS", null, [
    "HR against the directory: missing identity, stale access, orphan, attribute drift, unauthorized write, credential and schema drift",
    "Registry against the tenant: unit rule drift, paused processing, unmatched role assignments, restriction mismatches",
    "Findings belong to the CISO; close each at the source, the record or the rule, never the copy",
  ], 12.5);
  const b = panel(s, "Gate", 6.85, pic.bottom + 0.2, 5.9, null, HEX.teal, HEX.tealTint, "GATE: BOOK 01'S VERIFICATION LIST", null, [
    "Valid attributes for every HR-listed worker; every group on one of two patterns",
    "Every unit rule mirrors its group, processing on; policies target governed groups only",
    "Zero drift findings and a zero-action nightly plan; lifecycle metrics on the ConMon cadence",
  ], 12.5);
  callout(s, "Logs", Math.max(a, b) + 0.2, 0.75, "FaFileShield", HEX.red, "Route logs out from day one: ",
    "Entra log retention is far shorter than federal records schedules, and isn't retroactive.");
  sources(s, "Sources: Guide, Stage 8; Book 01, Ch 04 (verification); Book 02, Ch 05 (drift detection), Ch 06, Ch 10; Book 03, Ch 11, Ch 12 (Phase 6); Book 06, Ch 17 (access reviews).");
  notes(s,
`Stage 8 keeps the statements true. The loop at the top is Book 03's: the HR record says what should be true, the directories and applications hold what is true, a scheduled comparison finds the differences, and each is corrected and evidenced.

Two comparisons run on a schedule. HR against the directory, with Book 03's drift classes: missing identity, stale access, orphan account, attribute drift, unauthorized write, credential drift and schema drift. And the unit and role registry against the tenant, with Book 02's checks: unit rule drift, paused rule processing, unmatched role assignments and restriction mismatches.

The CISO owns continuous-monitoring evidence and drift findings. Each finding is closed at the source, by fixing the record or the rule, never the copy. If you patch the directory value, the next sync or provisioning cycle puts the wrong one back, and you've hidden the real error.

The gate is Book 01's verification list: valid attributes for every HR-listed worker, every group on one of the two patterns, every unit rule mirroring its group with processing on, every policy targeting only governed groups, zero drift findings, and a zero-action nightly plan. Book 03 adds a recurring gate: the six lifecycle metrics within thresholds on the ConMon cadence.

Two failure modes. Entra ID's log retention is far shorter than federal records schedules and isn't retroactive, so route logs out from the pilot's first day. And access-review decisions don't change dynamic-group membership; the next evaluation puts the member back, so review the rule and its inputs instead.`,
  `${G}, Stage 8; Book 01, Chapter 04 — "Verification"; Book 02, Chapter 05 — "Drift detection"; Chapter 06; Chapter 10 — "The assessment pipeline"; Book 03, Chapter 11 — "Drift between HR and the directory," "The evidence each event leaves"; Chapter 12 — "Phase 6"; Book 06, Chapter 17 — "Access reviews."`);
}

// ================================================================== 31 Limits 1
{
  const s = content(M4, "Limits: dynamic membership and latency");
  tag(s, "What");
  const a = panel(s, "Stops", 0.6, 1.5, 6.0, null, HEX.navy, HEX.navyTint, "WHERE DYNAMIC MEMBERSHIP STOPS", null, [
    "Role-assignable groups: assigned, no nesting, at most 500 per tenant",
    "PIM for Groups takes no dynamic or AD-synced groups: privilege stays assigned and time-bound",
    "A rule is at most 3,072 characters; 15,000 dynamic groups per tenant, dynamic units included",
    "Rules can't read employeeType, employeeOrgData or manager; no multi-value extension properties",
  ], 13);
  panel(s, "Latency", 6.85, 1.5, 5.9, null, HEX.amber, HEX.amberTint, "LATENCY", null, [
    "Membership usually within hours, sometimes over 24",
    "Bulk change (500+ groups or 20,000+ changes): pause nonessential groups 24 hours or more",
    "Tokens last 60 to 90 minutes: urgent removal disables and revokes sessions",
    "Lifecycle Workflows run every 3 hours by default (1 to 24); synced users also wait for sync",
  ], 13);
  callout(s, "MemberOf", a + 0.3, 1.0, "FaUserClock", HEX.red, "memberOf preview ends November 3, 2026: ",
    "groups, units and auto-assignment policies that use it freeze in their last state. Microsoft's page still said so on Oct. 29.");
  sources(s, "Sources: Microsoft Learn: dynamic membership rules; memberOf operator (preview); dynamic group processing; Intune assignment (Oct. 29, 2026). Guide, Limits; Book 03, Ch 08, 10.");
  notes(s,
`The limits, as the chapters state them, with the Microsoft Learn pages re-checked on October 29, 2026.

Where dynamic membership stops. Groups that hold Entra roles must have assigned membership, can't nest, and are capped at 500 per tenant. PIM for Groups doesn't take dynamic groups or groups synced from AD, so privileged access is assigned, cloud-only and time-bound, and HR attributes decide only eligibility. Break-glass accounts depend on none of this machinery.

Rule limits. A rule body is at most 3,072 characters, a tenant can have at most 15,000 dynamic groups, and dynamic units count against the same total. Rules can't read employeeType, employeeOrgData or manager, and multi-value extension properties aren't supported; both still held on October 29. Prefer equals, starts-with and in over match and contains. And dynamic groups hold users or devices, never groups.

The date to note. The memberOf preview ends on November 3, 2026, after which groups, units and auto-assignment policies that use it freeze in their last state. Microsoft's page still said so on October 29, five days before that date. The checklist says plainly: no memberOf.

Latency. Membership is usually processed within a few hours but can take more than 24; for bulk changes Microsoft recommends pausing nonessential groups for at least a day. Tokens live 60 to 90 minutes by default, so urgent removal disables the account and revokes sessions. Lifecycle Workflows run on a tenant schedule, every three hours by default, with a three-day catch-up. Synced users also wait for the sync cycle, and dynamic Intune device groups add the same delay, which is why Microsoft points time-sensitive assignment at filters.`,
  `${G}, "Limits": "Where dynamic membership stops," "Rule limits," "Latency"; Book 02, Chapter 09 — "Dynamic group rule syntax"; Book 03, Chapter 06 — "Design rules"; Chapter 08 — "Triggers and schedule"; Chapter 10 — "Where dynamic membership stops," "Limits and efficiency"; Book 04, Chapter 03; Book 06, Chapter 16.`);
}

// ================================================================== 32 Limits 2
{
  const s = content(M4, "Limits: units, Lifecycle Workflows, what still needs AD");
  tag(s, "What");
  const a = panel(s, "AU", 0.6, 1.5, 6.0, null, HEX.navy, HEX.navyTint, "ADMINISTRATIVE UNITS", null, [
    "No nesting; a write boundary, not a confidentiality boundary; only some roles unit-scoped",
    "Dynamic units: global Azure cloud only. GCC can use them; GCC High and DoD can't",
    "At most 100 restricted units; their members are outside Entra ID Governance",
  ], 13);
  panel(s, "LCW", 0.6, a + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "LIFECYCLE WORKFLOWS (ID GOVERNANCE OR ENTRA SUITE)", null, [
    "Up to 100 workflows per tenant and 100 custom task extensions",
    "An on-demand run covers at most 10 users",
    "No built-in task revokes a certificate or PIV credential, or retires a device",
  ], 13);
  panel(s, "AD", 6.85, 1.5, 5.9, null, HEX.amber, HEX.amberTint, "WHAT STILL NEEDS AD DURING HYBRID", null, [
    "The attributes of every synced user, and their disposition",
    "Kerberos apps: a cloud group provisioned back as a universal group",
    "DNS, DHCP and Kerberos-bound legacy apps; SQL Windows logins bypass CA",
    "Domain-level GPOs that hybrid-joined devices still need",
    "Moving source of authority: HR direct to Entra, no on-premises Exchange, no AD FS, no password-based apps",
    "Whether user source-of-authority transfer is available in GCC: open",
  ], 13);
  sources(s, "Sources: Microsoft Learn: dynamic administrative units; What are lifecycle workflows; Lifecycle Workflow deployment; Transfer user SOA (Oct. 29, 2026). Guide, Limits; Books 01, 02, 03.");
  notes(s,
`More limits, and two places where the guide corrects or qualifies a chapter.

Administrative units. They don't nest; they're a write boundary, not a confidentiality boundary; and only some roles can be unit-scoped. Dynamic units hold one object type and are available only in the global Azure cloud: a GCC tenant can use them, GCC High and DoD can't. Microsoft's prerequisite still read that way on October 29. And there's a cap of 100 restricted management units, whose members fall outside Entra ID Governance.

Lifecycle Workflows need Entra ID Governance or Entra Suite, and ID Governance is available in GCC, GCC High and DoD. Here's the correction. A tenant can hold up to 100 workflows and 100 custom task extensions. Book 02 Chapter 10 says 50 workflows; Microsoft Learn says 100, and the guide states 100 and flags the chapter. An on-demand run covers at most ten users. And no built-in task revokes a certificate or a PIV credential, or retires a device, so those are custom extensions.

What still needs AD during hybrid. The attributes themselves for every synced user, since AD is where they're written. Kerberos applications, which need a cloud group provisioned back as a universal group. Disposition of synced users. DNS, DHCP and Kerberos-bound legacy apps, which keep the forest alive after it stops being the governance model, and any surviving Windows login to SQL Server bypasses Conditional Access. And domain-level GPOs that hybrid-joined devices still need.

Moving a user's source of authority has prerequisites Microsoft lists: HR integrated directly with Entra ID, no on-premises Exchange, no AD FS for those users, and no password-based apps such as LDAP bind. Whether that transfer is available in GCC is still open in Book 03's verification register; the guide couldn't verify it.`,
  `${G}, "Limits": "Administrative units," "Lifecycle Workflows," "What still needs AD during hybrid"; Stage 1 "Licensing and GCC"; verification log D1 and "Could not verify"; Book 01, Chapter 04; Book 02, Chapters 05, 09 and 10; Book 03, Chapters 06, 08 and 12; Book 05, Chapter 08; Book 06, Chapter 16.`);
}

// ================================================================== 33 Checklist
{
  const s = content(M4, "The checklist, stage by stage");
  tag(s, "How");
  table(s, "Checks", 1.45, [0.75, 11.4], ["Stage", "Check (design guidance)"], [
    ["0", "OU links, inheritance and hand-made delegations exported, site links included · A decision for every group · OU-to-unit mapping drafted"],
    ["1", "Authority map, identifier and schema signed · Code lists owned by HR · HR-to-identity feed taken to the Steering Committee · Contractor source decided"],
    ["2", "employeeId populated before the first full sync · Correlation threshold met · Orphans owned · Other write paths to access slots removed"],
    ["3", "Sync engine and PHS decided · Carriers free and in the apps' target lists · Date mappings tested · Feeds read by published date · Shadow mode explained"],
    ["4", "Every access rule on codes, excluding disabled accounts, guests and agents · Validated, shadowed, piloted · No memberOf · Nesting flattened"],
    ["5", "Unit rules mirror group rules, processing on · Restriction decided before creation · Role principals PIM-eligible · Units before their groups"],
    ["6", "Personas from authoritative attributes · Grant and block in pairs · Report-only first · Emergency access excluded · One owning policy per setting"],
    ["7", "Validation report signed · Dry run, writes off · Seven days of sole-source proof · Ticket path closed · Provisioning retargeted · Rollback tested"],
    ["PIV", "Card management system named as the binding writer · High affinity piloted first · Phishing-resistant strength · Leaver removes the binding"],
    ["8", "Drift scans scheduled for HR, units and roles · Logs routed out from day one · Findings closed at the source · Metrics on the ConMon cadence"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Guide, \"Checklist\"; each row's detail is in the stage it names and the chapters cited there.");
  notes(s,
`The guide's checklist, one row per stage, plus a row for PIV. It's design guidance, and it's meant to be printed and ticked.

A few checks that are easy to miss. Stage 0: export site links, not just OU links, because a site-linked GPO hides from an OU-only search. Stage 1: take the HR-to-identity feed to the Steering Committee and name it in the HR 2.0 integration inventory, and start the privacy basis and PIA, which the full checklist carries too. Stage 2: populate employeeId before the first full sync, and remove every other write path to the access slots, in AD and in Entra ID. Stage 3: confirm the carriers are free and in the provisioning apps' target lists, and read the feeds by published date.

Stage 4: every access rule on codes, excluding disabled accounts, guests and agents, and no memberOf, given the preview's end date. Stage 5: decide restriction before the unit exists, and create units before the groups they hold. Stage 6: grant and block policies in pairs, report-only first, the emergency-access group excluded, device attributes written at registration, and one owning policy per setting.

Stage 7: the signed validation report, the dry run with writes off, seven days of sole-source proof, then the ticket path closed and provisioning retargeted per population. PIV: name the card management system as the binding writer, pilot high affinity before the tenant setting changes, require phishing-resistant strength for CBA users, and make the leaver remove the binding. Stage 8: drift scans scheduled, logs routed outside Entra ID from day one, findings closed at the source.`,
  `${G}, "Checklist"; Stages 0–8 and "PIV and CAC certificates as attributes."`);
}

// ================================================================== 34 Decisions
{
  const s = content(M4, "Decisions, owners, and where to start");
  tag(s, "How");
  table(s, "Decisions", 1.5, [5.0, 3.15, 0.9], ["Decision (design guidance)", "Who decides", "Stage"], [
    ["Where each OU function goes; each group's fate", "Identity engineering", "0"],
    ["Authority map, person key, contractor source", "ICAM governance body", "1"],
    ["Code lists; the schema", "HR; the data architect", "1"],
    ["Correlation threshold", "Agency risk governance", "2"],
    ["Write permissions on HR-mastered attributes", "Security", "1–2"],
    ["Sync engine, sign-in method, provisioning rules", "Identity engineering", "3"],
    ["An application's access rule", "The application owner", "4"],
    ["Delegation model; restriction per unit", "Identity engineering", "5"],
    ["Control requirements; drift findings", "The CISO", "6, 8"],
    ["Wave go/no-go", "Identity engineering", "7"],
  ], { fontSize: 12.5, limit: 6.5 });
  panel(s, "Start", 9.85, 1.5, 2.9, null, HEX.teal, HEX.tealTint, "FROM THE CHECKLIST", "Start with these", [
    "Export the tree, read-only",
    "Name the HR feed to the Steering Committee",
    "Populate employeeId",
    "Remove other writers",
    "Route logs out now",
  ], 14);
  sources(s, "Sources: Guide, \"The path on one page\" and \"Checklist\"; Book 02, Ch 06 and Book 03, Ch 07 responsibility matrices. Decisions and sequence are design guidance.");
  notes(s,
`So, the decisions, each with one decider from the two responsibility matrices, Book 02 Chapter 06 for the directory and Book 03 Chapter 07 for the data. All of it is the program's recommended model, design guidance.

Identity engineering decides where each OU function goes and each group's fate, the sync engine and sign-in method, the delegation model with restriction per unit defaulting to no, and each wave's go or no-go. The ICAM governance body decides the authority map, the enterprise person key and the contractor source. HR owns the code lists and the data architect owns the schema. The agency's risk governance sets the correlation threshold. Security decides who may write HR-mastered attributes. Each application's owner decides its access rule. And the CISO owns the control requirements and the drift findings.

Five places to start, all from the checklist and none needing a new platform. Export the OU tree, its GPO links and its hand-made delegations, read-only. Name the HR-to-identity feed and take it to the HR 2.0 Steering Committee before the interconnection goes live. Populate employeeId before the first full sync. Remove every other writer to the access attributes. And route logs out of Entra ID from day one, because history starts the day export does.

In Active Directory, where an object sat decided what applied to it. In Entra ID, what the object says about itself decides. Make those statements true, keep them true, and the migration follows. The guide maps every step to the chapter that carries it. Thank you.`,
  `${G}, "The path on one page," "Checklist," Stages 0–8; Book 02, Chapter 06 — "The responsibility matrix"; Book 03, Chapter 07 — "The responsibility matrix."`);
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
  if (process.env.FIT) console.log(`  sources ${title}: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "Attribute-Driven Migration guide: \"How to read this guide,\" \"The path on one page,\" Stage 0, \"Limits: rule limits,\" \"How the books' phase numbers line up\" (approximate; each book's gates govern its own work).",
  "Book 01, Chapter 04 — Identity Transformation: \"The identity claim,\" \"What the attributes drive,\" \"The four mechanisms,\" \"Where the attributes live,\" \"From sessions to tokens.\"",
  "Book 02, Chapter 06 — \"The responsibility matrix\"; Chapter 07 — \"Recording what read-only discovery couldn't see\"; Chapter 08 — \"OU hierarchy and delegation,\" \"What to collect.\"",
  "Book 02, Chapter 09 — \"Organizational units,\" \"The per-group decision,\" \"AdminSDHolder and protected groups\"; Chapter 10 — \"Phase 0: assessment.\"",
  "Book 03, Chapter 06 — \"Design rules\"; Chapter 07 — \"The responsibility matrix\"; Chapter 12 — \"Sequencing principle.\"",
  "Microsoft Learn: \"Manage rules for dynamic membership groups in Microsoft Entra ID\" (learn.microsoft.com/entra/identity/users/groups-dynamic-membership), accessed Oct. 29, 2026.",
  "Diagrams: Book 01 ch04-one-attribute-five-outcomes; Book 02 ch09-ad-to-entra-objects, ch08-gpo-analysis (committed renders; alt text from each chapter's fig-alt).",
]);
sourceSlide("Sources behind Module 2 — Sourcing and proving attributes", [
  "Attribute-Driven Migration guide: Stage 1 (including \"Building the attributes from Federal HR 2.0\" and \"Licensing and GCC\"), Stage 2, Stage 3; attribute-to-mechanism crosswalk.",
  "Book 03, Chapter 03 — \"The program facts\" (dated Oct. 20, 2026), \"What OPM requires and what it leaves to the agency\"; Chapter 04 — authority, layered identifiers; Chapter 05 — the provisioning pipeline, two landing zones.",
  "Book 03, Chapter 06 — design rules, writers, program attribute map, standard attribute layer, one fact one authority; Chapter 07 — ownership, privacy office; Chapter 12 — Phases 0, 1 and 3; Chapter 13 — reference deployment.",
  "Book 02, Chapter 09 — sync engine, filtering, attribute flow, soft and hard match, Connect Sync deadline; Chapter 10 — Phase 1.  ·  Book 05, Chapter 08 — device attribute schema.  ·  Book 06, Chapter 17.",
  "Microsoft Learn (accessed Oct. 29, 2026): API-driven inbound provisioning concepts; Archive for Microsoft Entra releases (June 2025); Microsoft Entra feature availability; What are lifecycle workflows?",
  "Research: HCM-to-Entra implementation guide (provisioning apps; sequences).",
  "Diagrams: Book 03 ch04-authority-map, ch03-hr20-window, ch05-provisioning-services, ch07-attribute-ownership-chain, ch12-phase-gates; Book 02 ch09-sync-auth-decision.",
]);
sourceSlide("Sources behind Module 3 — Attributes to mechanisms", [
  "Attribute-Driven Migration guide: Stages 4, 5 and 6; \"Beyond users\"; \"Which attribute store each mechanism can read\"; \"Object types, stores, writers and consumers\"; \"PIV and CAC certificates as attributes.\"",
  "Book 01, Ch 04; Book 02, Ch 05, 06, 09; Book 03, Ch 07, 09, 10; Book 04, Ch 03; Book 05, Ch 08, 09; Book 06, Ch 16, 17 and Runbook R07; Book 07, Ch 06, 07. Verification log D2, D5, D6.",
  "Microsoft Learn (Oct. 29, 2026): Assign policies in Microsoft Intune; dynamic membership rules; Create device groups for Windows Autopilot; Graph Update device; Intune filter device properties; Intune RBAC and scope tags.",
  "Microsoft Learn (Oct. 29, 2026): Cloud-native server management with Arc; Organize and inventory servers; azcmagent connect; tag policies; Azure ABAC overview and condition format; custom security attributes (overview; users FAQ).",
  "Microsoft Learn (Oct. 29, 2026): CA filter for applications; app user and group assignment; CA for workload identities; CBA technical concepts; Set up CBA; Mapping to certificateUserIds; Authentication strengths; M-22-09 MFA.",
  "Unverified: certificateUserIds written through Graph by the card management system after AD (design guidance), workbook issue #130, open as of Oct. 29, 2026. Cloud Sync for certificateUserIds: not documented.",
  "Diagrams: Book 03 ch10-derivation-chain, ch09-credential-assurance; Book 02 ch05-three-tier-delegation; Book 04 ch03-grant-block-pair; Book 05 ch08-targeting-layers, ch09-arc-management-plane.",
]);
sourceSlide("Sources behind Module 4 — Running it", [
  "Attribute-Driven Migration guide: \"Worked example: one user and one mover event,\" Stage 7, Stage 8, \"Limits,\" \"Checklist,\" \"The path on one page.\"",
  "Book 00, Ch 09 — waves by attribute.  ·  Book 01, Ch 04 — mover, migration phases, verification.  ·  Book 02, Ch 05, 06, 09, 10.  ·  Book 03, Ch 05, 06, 08, 10, 11, 12 and Appendix C.",
  "Book 04, Ch 03 — personas.  ·  Book 05, Ch 08 — tier groups, workload waves, rollback.  ·  Book 06, Ch 16 — when a change takes effect; Ch 17 — choosing the attributes, access reviews.",
  "Microsoft Learn (Oct. 29, 2026): Guidance for user SOA; Transfer user SOA; memberOf operator (preview; ends Nov. 3, 2026); dynamic group processing; dynamic administrative units; lifecycle workflows; Lifecycle Workflow deployment.",
  "Corrections stated as the guide states them: Lifecycle Workflows 100 per tenant (Book 02, Ch 10 says 50); verification log D1.",
  "Could not verify: user SOA transfer in GCC (Book 03, Ch 12 open register); Federal HR 2.0 schedule after Oct. 20, 2026 (confirm with the HR 2.0 program office).",
  "Diagrams: Book 03 ch08-personnel-action-lifecycle, appc-cutover-sequence, ch11-drift-evidence-loop; Book 00 ch09-waves-by-attribute.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
console.log(`diagrams (${used.length}): ${used.join(", ")}`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
