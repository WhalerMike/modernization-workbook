// Shared slide builders for the two-part Attribute-Driven Migration technical deep dive.
// Part 1 (attribute-driven-migration-technical-part-1/build.js) and Part 2 (…-part-2/build.js) each call
// require("../attribute-driven-migration-technical-part-1/slides.js")(cfg) and run the builders they need, in order.
// Each builder adds one slide to the section set with section(name).
//
// The slides were one 50-slide deck until it was split by track into Part 1 (the model and the HR track) and Part 2
// (devices, servers, non-person identities, and running it). Section names come from each part's section() calls.
// Every fact on a slide comes from docs/books/guides/attribute-driven-migration.md or a chapter it links to; the notes
// name the guide's stage and the chapters. Microsoft product facts carry the Microsoft Learn page the guide footnotes
// (all opened October 29, 2026). The program's own recommendations are labeled design guidance, preview features carry
// their stage and date, and the guide's corrections of the chapters (Lifecycle Workflows limit, the device-write
// permission, Intune assignment filters) are stated as the guide states them.
// Narration: narration.json (intent-first voice, keyed by slide title) is read by presentations/_build/narrate.py
// (the editor runs that). The notes keep the full detail for a live presenter.
module.exports = (cfg) => {
  const fs = require("fs");
  const path = require("path");
  const D = require("../_build/lib.js")({ book: "Companion guide", title: cfg.title, footer: cfg.footer });
  const { HEX, txt, box, tag, bullets, tableOpts, head } = D;

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

  const G = "Attribute-Driven Migration guide";

  // The section the next slides belong to (pptx sections; one per module).
  let SEC = "Orientation";
  const section = (name) => { SEC = name; };

  const SL = {};


  // 2 Why
  SL.why = () => {
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
};

  // 4 OU jobs
  SL.oujobs = () => {
  const s = content(SEC, "What the OU tree encoded, and where each job goes");
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

Stage 0's decision follows: for every OU function, where it goes. GPO scoping to Conditional Access and Intune, delegation to units, logical organization to attributes and dynamic groups. But the tree held more than people, and the next slide sorts its objects into four tracks.`,
  `${G}, Stage 0 "Decision," "Limits: rule limits"; Book 01, Chapter 04 — "The four mechanisms," "Where the attributes live"; Book 02, Chapter 09 — "Organizational units"; Book 03, Chapter 06 — "Design rules."`);
};

  // 5 Four tracks (new)
  SL.tracks = () => {
  const s = content(SEC, "Four tracks, four sources of truth");
  tag(s, "What");
  const tb = table(s, "Tracks", 1.45, [2.15, 3.45, 3.05, 3.5], ["Track", "Source of truth", "Where it's written", "What reads it in the target"], [
    ["HR track: people", "HR (Core HCM; Federal HR 2.0 for employees) and the contractor source, through provisioning", "The user object: in AD while synced, in Entra ID once cloud-mastered", "Dynamic user groups, units, CA personas, Lifecycle Workflows, licenses, access packages"],
    ["Intune track: end-user devices", "Autopilot registration and group tag, Intune enrollment, Graph writes by device provisioning", "The Entra device object: extension attributes 1–15, enrollment profile, physical IDs", "Dynamic device groups, assignment filters, CA device filters, compliance"],
    ["Azure Arc track: servers", "Arc onboarding (azcmagent connect --tags, resource group), then Azure Policy", "Azure resource tags; the resource group or subscription", "Azure Policy and machine configuration, Update Manager, Defender for Servers, RBAC"],
    ["Non-person track: workloads", "The owner and sponsor record: system inventory or CMDB, app registration, AI inventory. Not HR", "SP and app properties, custom security attributes, owners and sponsors, credentials", "CA for workload identities, app roles, Azure RBAC, owner reviews, expiry and orphan checks"],
  ], { fontSize: 11.5, limit: 5.0 });
  const a = panel(s, "GPO", 0.6, tb + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "GROUP POLICY SPLITS THE SAME WAY", null, [
    "User-configuration settings move with people: user-targeted Intune policy and Conditional Access",
    "Computer-configuration settings move with devices (Intune) and with servers (Azure Policy)",
  ], 12.5);
  panel(s, "Reach", 6.85, tb + 0.2, 5.9, a - tb - 0.2, HEX.red, HEX.redTint, "WHAT EACH ATTRIBUTE CAN REACH", null, [
    "HR never describes a device, a server or a service",
    "A device rule can never read its owner's attributes",
    "A non-person identity has no HR record: its owner and sponsor are its accountability",
  ], 12.5);
  sources(s, "Sources: Guide, \"Beyond users\"; Book 03 (HR); Book 05, Ch 03, 04, 08 (Intune), Ch 09 (Arc); Book 02, Ch 09; Book 06; Book 17 (non-person). The track model is design guidance.");
  notes(s,
`An Active Directory forest holds four different populations of identity, and they move to Entra ID and Azure by different paths. So the series treats them as four tracks, each with its own source of truth. The track model is the program's framing, design guidance; the facts in each row come from the chapters named in the sources line.

The HR track is people: user accounts for employees and contractors. HR, meaning Core HCM and Federal HR 2.0 for employees, and the contractor source of authority are the source, through provisioning. The values land on the user object, in AD while users are synced and in Entra ID once they're cloud-mastered, and dynamic user groups, administrative units, Conditional Access personas, Lifecycle Workflows, and license and access-package assignment read them. Book 03 carries it.

The Intune track is end-user devices. Device provisioning is the source: Autopilot registration and its group tag, Intune enrollment, and Graph writes by the device provisioning service. The values land on the Entra device object, extension attributes one to fifteen, the enrollment profile and physical IDs, and dynamic device groups, Intune assignment filters, Conditional Access device filters and compliance read them. Book 05, Chapters 03, 04 and 08.

The Azure Arc track is servers, brought under Azure Resource Manager. Arc onboarding, the connect command's tags and the resource group, then Azure Policy, are the source; tags and the resource group or subscription hold the values; Azure Policy and machine configuration, Update Manager scoping, Defender for Servers and Azure RBAC read them. Book 05, Chapter 09.

The non-person track is workloads and services: AD service accounts, MSAs and gMSAs, app registrations and service principals, managed identities, workload identities and AI agents. Their source is the owner and sponsor record, the system inventory or CMDB entry, the app registration and the AI inventory, not HR. Service principal and application properties, custom security attributes, owners, sponsors and credentials hold the values, and Conditional Access for workload identities, app roles, Azure RBAC, owner access reviews and credential-expiry and orphan checks read them. Book 02, Chapter 09 for service accounts, Book 06 for SQL principals, Book 17 for AI agents.

Group Policy splits the same way: user-configuration settings move with people, to user-targeted Intune policy and Conditional Access; computer-configuration settings move with devices, to Intune device policy and filters, and with servers, to Azure Policy and machine configuration. And each attribute's reach is bounded: HR never describes a device, server or service, a device rule can't read its owner's attributes, and a non-person identity's accountability is its owner and sponsor.`,
  `${G}, "Beyond users"; series framing (four tracks, design guidance); Book 03; Book 05, Chapters 03, 04, 08 and 09; Book 02, Chapter 09 — "Service accounts," "Modernizing service accounts"; Book 06; Book 17.`);
};

  // 6 What it accomplishes (new)
  SL.accomplish = () => {
  const s = content(SEC, "What this migration accomplishes, and how you know");
  tag(s, "Why");
  const g = panel(s, "Goal", 0.6, 1.5, 4.35, null, HEX.navy, HEX.navyTint, "THE GOAL", "True, owned, read by policy", [
    "Joining, moving and leaving change access automatically, with no ticket or hand-edited group; a new device or workload gets access from its owning record",
    "Delegation and policy follow facts about the object, not its folder",
    "Every non-person identity: a named owner, least privilege, an expiring or managed credential",
    "Every access decision and change leaves evidence",
    "AD can be reduced, then retired, without losing any of the tree's four jobs",
  ], 12.5);
  const tb = table(s, "Done", 1.5, [1.25, 4.6, 1.8], ["Track", "You're there when (design guidance, on the books' gates)", "Federal requirement"], [
    ["HR", "Every enabled account correlates to HR or the contractor source, or carries an owned exception; every OU-derived access group is a validated rule over codes", "AC-2, PS-4, PS-5, IA-4"],
    ["Intune", "Every managed device carries provisioning-written attributes that target its policy; computer-side GPO links disabled per population, rollback tested", "CM-2, CM-6, CM-8, IA-3"],
    ["Arc", "Every in-scope server is Arc-enabled with its tag taxonomy, and its baseline assigned and evaluated by Azure Policy", "CM-2, CM-6, CM-8"],
    ["Non-person", "Every service account and service principal has an owner, a sponsor, a reason and a target; no password that never expires; none orphaned", "AC-2, AC-6(5), IA-5, IA-9"],
    ["All tracks", "The scheduled drift comparison is clean; findings fixed at the source, not in the copy", "AU-6, SI-4, CA-7"],
  ], { fontSize: 11.5, x: 5.1, limit: 6.5 });
  if (process.env.FIT) console.log(`  accomplish: goal ${g.toFixed(2)}, table ${tb.toFixed(2)}`);
  sources(s, "Sources: Guide, \"What this migration accomplishes,\" federal requirements; Book 03, Ch 12; Book 05, Ch 08–10; Book 02, Ch 10; Book 17, Ch 05; NIST SP 800-53 Rev. 5 (5.2.0) as named.");
  notes(s,
`What is the migration trying to accomplish? The program's goal, stated as design guidance: every person, device, server and workload is governed by attributes that are true, owned by exactly one source, and read by policy.

That means five things. Joining, moving and leaving change access automatically and correctly, with no ticket and no hand-edited group, and a new workload or device gets its access the same way, from its owning record. Delegation and policy follow facts about the object, not its position in a folder tree. Every non-person identity has a named owner, the least privilege it needs, and a credential that expires or is managed, so none is left orphaned. Every access decision and change leaves evidence. And Active Directory can be reduced and eventually retired without losing any of the four jobs the OU tree did: delegation, policy scope, accountability and security scope.

How you know you're there, per track. These criteria are design guidance; where a book states its own gate, that gate governs.

The HR track: every enabled account correlates to an authoritative record, HR or the contractor source, or carries an owned exception; and every OU-derived access group is a validated rule over coded attributes, so no hand-maintained membership remains for it. The gates are Book 03's Phase 1 and Phase 5, its sole-source proof in Appendix C, and Book 01's verification list.

The Intune track: every managed device carries attributes written by provisioning, its policy is targeted by them, and computer-side GPO links are disabled population by population, with rollback tested. Book 05, Chapter 08's testing at each gate and its rollback govern.

The Arc track: every in-scope server is Arc-enabled with its tag taxonomy applied, and its baseline is assigned and evaluated by Azure Policy: Book 05, Chapter 09's day-one baseline.

The non-person track: every service account and service principal has an owner and sponsor, a reason and a target. Each one is retired, re-platformed to a managed identity or gMSA, or made a certificate or federated-credential workload identity. None holds a password that never expires, and none is orphaned. Book 02's Phase 4 is the gate for service accounts, and Book 17's lifecycle for agents.

Across all tracks: the scheduled drift comparison is clean, and findings are fixed at the source, not in the copy, the Stage 8 gate.

The right-hand column names the federal requirement each track's end state supports, from the guide's federal-requirements mapping, which the next slide sets out: account management, personnel termination and transfer, and identifier management for HR; baseline configuration, configuration settings, component inventory and device identification for Intune; the configuration controls for Arc; account management, privileged accounts, authenticator management and service identification for the non-person track; and audit review, system monitoring and continuous monitoring across all four. NIST SP 800-53 Rev. 5, release 5.2.0; the mapping is the program's reading.`,
  `${G}, "What this migration accomplishes" (design guidance), Stage 8; Book 01, Chapter 04 — "Verification"; Book 03, Chapter 12 — Phases 1 and 5; Appendix C — "Proving HR is the sole source"; Book 05, Chapter 08 — "Testing at each gate," "Rollback"; Chapter 09 — "The day-one baseline"; Book 02, Chapter 10 — "Phase 4: service account modernization"; Book 17, Chapter 05 — "The lifecycle, event by event."`);
};

  // Federal requirements (new)
  SL.federal = () => {
  const s = content(SEC, "Federal requirements each track satisfies");
  tag(s, "Why");
  table(s, "Federal", 1.45, [2.0, 5.3, 4.85], ["Track", "Requirement", "What satisfies it"], [
    ["HR", "SP 800-53 AC-2, AC-2(1), AC-2(3); PS-4, PS-5; IA-4, IA-4(4)", "Accounts trace to worker records; joiner, mover and leaver by workflow, not ticket; one person key"],
    ["HR: the source", "OMB M-19-17; FICAM ILM playbook (not policy); Federal HR 2.0 memo, Dec. 10, 2025", "HR authoritative for who works here; the pipeline keyed so the source can change; a contractor source"],
    ["HR: sign-in and PIV", "OMB M-22-09; IA-2(1), (2), (8), (12); FIPS 201-3; SP 800-63-4; AC-3; BOD 25-01 SCuBA", "PIV-bound certificate sign-in at a phishing-resistant strength; Conditional Access on every sign-in"],
    ["HR and Intune: Stages 4–5", "AC-3(13), tailored in; AC-6; AC-6(7)", "Access computed from coded attributes; scoped roles; access reviews"],
    ["Intune", "CM-2, CM-3, CM-6, CM-7, CM-8; IA-3; M-22-09 device signal", "Policy library as code; weekly reconciliation; compliance feeds Conditional Access"],
    ["Arc", "CM-2, CM-6, CM-8; IA-9, tailored in", "Machine-configuration baselines; a reconciled inventory; the tiers"],
    ["Non-person", "AC-2, AC-6(5); IA-4, IA-5, IA-9; SCuBA MS.AAD.5.1–5.3; M-25-21 for AI", "Sponsors and owners; no standing privilege; no stored secrets; the AI inventory"],
    ["All tracks: Stage 8", "AU-2, AU-6, AU-12, SI-4, CA-7; OMB M-26-14, which rescinded M-21-31", "Logs out of Entra ID from day one; the drift comparison; metrics on the ConMon cadence"],
  ], { fontSize: 11.5, limit: 6.1 });
  txt(s, "FedNote", "The program's mapping, reusing the books' crosswalks: the architecture contributes evidence; the authorizing official decides. Not mapped, for lack of support in the books: PS-7, IA-8 for contractors.",
    { x: 0.6, y: 6.12, w: 12.15, h: 0.45, fontSize: 11, italic: true, color: HEX.slate });
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (5.2.0); OMB M-19-17, M-22-09, M-25-21, M-26-14; OMB/OPM HR 2.0 memo; FIPS 201-3; SP 800-63-4; BOD 25-01. Guide; full citations in backup.");
  notes(s,
`The tracks and their end state aren't only good practice: each one supports controls and mandates the agency already has to meet. This table is the guide's mapping, which reuses only mappings the books already make. The control identifiers and titles are SP 800-53 Rev. 5, release 5.2.0, and the mapping is the program's reading, as it is in every book: the architecture contributes mechanisms and evidence to a control, and the agency's authorizing official and assessors decide whether it's satisfied.

The HR track. Account management, AC-2, with automated account management, AC-2(1), and disable accounts, AC-2(3): every account traces to a worker record, and hire, transfer and separation create, change and disable accounts by workflow, not ticket; the evidence is provenance records, provisioning logs and Lifecycle Workflows run history. Personnel termination and transfer, PS-4 and PS-5, measured as separation-to-block, separation-to-revocation and transfer-to-review intervals. Identifier management, IA-4, and identify user status, IA-4(4): one enterprise person key kept across rehire and conversion, with worker type as the status.

HR as the source: OMB M-19-17, the enterprise ICAM policy framework, and the FICAM Identity Lifecycle Management Playbook, which recommends HR as the authoritative source and says it isn't official policy. The coming source: the OMB and OPM Federal HR 2.0 memorandum of December 10, 2025, consolidating Core HCM; contractors and vendors are outside it, so the agency designates a contractor source.

Sign-in and PIV: OMB M-22-09's phishing-resistant MFA for staff, contractors and partners; IA-2 with enhancements 1, 2, 8 and 12, acceptance of PIV credentials; FIPS 201-3; and SP 800-63-4. Plus access enforcement, AC-3, and CISA BOD 25-01's required SCuBA policies, such as blocking legacy authentication and phishing-resistant MFA for all users, evidenced by ScubaGear reports.

Stages 4 and 5, for the HR and Intune tracks: attribute-based access control, AC-3(13), which is outside the Moderate baseline and so tailored in; least privilege, AC-6; and review of user privileges, AC-6(7). The rule set in Git is itself the audit evidence.

Intune: baseline configuration CM-2, change control CM-3, configuration settings CM-6, least functionality CM-7 and component inventory CM-8, with exported policy JSON, status reports and the weekly reconciliation; and device identification, IA-3, with M-22-09's device-level signal. Arc: CM-2, CM-6 and CM-8 through machine-configuration baselines, a reconciled inventory and the tiers for what neither tool reaches, and service identification, IA-9, tailored in, for the Arc managed identity.

The non-person track: AC-2 and privileged accounts, AC-6(5), with every workload and agent identity a defined account type with a sponsor and no standing privileged roles; IA-4, authenticator management IA-5, and IA-9, with managed identities and federation first and credentials rotated; the SCuBA policies MS.AAD.5.1 to 5.3 on application creation and consent; and OMB M-25-21's AI use-case inventory and the ability to discontinue an AI system.

All tracks, at Stage 8: AU-2, AU-6, AU-12, SI-4 and continuous monitoring, CA-7, and OMB M-26-14 on agency logging, which rescinded M-21-31. And the GCC boundary: Microsoft 365 GCC is offered at FedRAMP Moderate, and the NIST baseline and the FedRAMP class are separate facts, Book 14 Chapter 03.

The guide leaves out what the books don't support: PS-7, external personnel security; AC-2(13), which the books map to incident response; IA-8 for contractors, which the books map to guests and agents acting for the public; and M-21-31, rescinded. The full citations are in the backup section.`,
  `${G}, "The federal requirements each track satisfies"; Book 02, Appendix A — "NIST SP 800-53 Rev. 5 control mapping," "The crosswalk: identity controls"; Book 03, Chapters 02, 03, 08, 09, 11; Book 05, Chapters 04, 10; Book 06, Appendix A; Book 01, 11, 12, 14 and 17, Appendix A or as named.`);
};

  // Attributes primer 1 (new): the model
  SL.model = () => {
  const s = content(SEC, "AD vs Entra ID: the model");
  tag(s, "What");
  const tb = table(s, "Model", 1.45, [2.2, 4.55, 5.4], ["Topic", "Active Directory", "Entra ID"], [
    ["Structure", "Hierarchy: distinguished names and OUs", "Flat"],
    ["Schema", "Extensible LDAP schema; additions are forest-wide and can't be removed, only made defunct", "Fixed properties, plus extension mechanisms"],
    ["Access", "LDAP or AD PowerShell", "Microsoft Graph; some filters, such as on extension attributes, need advanced queries"],
    ["Write control", "Per-attribute ACLs and OU delegation", "Roles scoped by administrative units; custom security attributes have their own roles"],
    ["Groups from attributes", "None native: scripts", "Dynamic rules, over some attributes only"],
    ["Identity anchor", "objectGUID, objectSid", "The Entra object ID, plus onPremisesImmutableId: Connect uses ms-DS-ConsistencyGuid; Cloud Sync falls back to objectGUID"],
    ["Mastering", "AD", "For synced users, AD still masters most attributes; read-only in Entra ID until the source of authority moves"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "KeyLine", tb + 0.2, 0.8, "FaSitemap", HEX.navy, "The key line: ",
    "in AD, where an object sits does half the work; in Entra ID, what the object says about itself has to do all of it.");
  sources(s, "Sources: Microsoft Learn: user resource type; dynamic membership rules; Connect attributes synchronized (as cited in the guide). Book 01, Ch 04; Book 02, Ch 03, 09.");
  notes(s,
`Before the stages, a primer the rest of the deck leans on: how Entra ID's attributes differ from Active Directory's, and the stores they live in. The key line: in AD, where an object sits does half the work; in Entra ID, what the object says about itself has to do all of it.

The model, row by row. AD is a hierarchy of distinguished names and OUs; Entra ID is flat. AD's LDAP schema is extensible, and additions are forest-wide and can't be removed, only made defunct; Entra ID has fixed properties plus extension mechanisms, which the store slide sorts out. AD is read over LDAP or AD PowerShell; Entra ID over Microsoft Graph, and some filters, such as those on extension attributes, need advanced queries. Write control in AD is per-attribute ACLs and OU delegation; in Entra ID it's roles scoped by administrative units, and custom security attributes have their own roles. AD has no native groups from attributes, only scripts; Entra ID has dynamic rules, over some attributes only. The anchor in AD is objectGUID and objectSid; in Entra ID it's the Entra object ID, plus onPremisesImmutableId, the source anchor: Entra Connect uses ms-DS-ConsistencyGuid, from version 1.1.524.0, and Cloud Sync uses ms-DS-ConsistencyGuid with a fallback to objectGUID, which can't be changed.

And mastering. For synced users AD still masters most attributes, and they're read-only in Entra ID until the source of authority moves. That one fact shapes the whole migration: while users are synced, edit attributes in AD or HR, not in Entra ID.`,
  `${G}, attributes primer (Entra ID compared with AD); Book 01, Chapter 04 — "Where the attributes live"; Book 02, Chapter 03 — AD and Entra side by side; Chapter 09 — "Soft match and hard match"; Book 03, Chapter 06 — "Design rules."`);
};

  // Attributes primer 2 (new): the mapping
  SL.mapping = () => {
  const s = content(SEC, "The attributes you know, side by side");
  tag(s, "What");
  table(s, "Mapping", 1.45, [3.35, 3.6, 5.2], ["AD attribute", "Entra ID property", "What to know"], [
    ["sAMAccountName", "onPremisesSamAccountName", "Read-only in Entra ID"],
    ["distinguishedName", "onPremisesDistinguishedName", "Read-only; never use it for policy"],
    ["objectGUID / ms-DS-ConsistencyGuid", "onPremisesImmutableId", "The source anchor"],
    ["department / title / company", "department / jobTitle / companyName", "Rules read codes, not these strings"],
    ["manager (a DN)", "manager (a reference)", "Rules can't read it, except in the direct-reports rule"],
    ["employeeID / employeeType", "employeeId / employeeType", "employeeId carries the person key; rules can't read employeeType, so slot 11 mirrors it"],
    ["extensionAttribute1–15", "onPremisesExtensionAttributes", "AD-mastered for synced users; rules can read them"],
    ["Custom schema attributes", "Directory extensions", "extension_<appId>_<name>"],
    ["userAccountControl (disabled bit)", "accountEnabled", "Every access rule requires it to be true"],
    ["altSecurityIdentities", "certificateUserIds", "Only through sync rules the administrator adds: the PIV binding"],
    ["servicePrincipalName (Kerberos)", "No equivalent", "SPNs stay in AD until workloads move: the non-person track"],
    ["adminCount", "None", "Privilege comes from roles and PIM"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: user resource type; extension attributes; dynamic membership rules; certificateUserIds (as cited in the guide). Book 03, Ch 06 (slot 11: design guidance).");
  notes(s,
`The attributes the team already knows, and what each becomes. This is the key rows of the guide's mapping table.

userPrincipalName carries over as itself. sAMAccountName becomes onPremisesSamAccountName, read-only. distinguishedName becomes onPremisesDistinguishedName, read-only, and never used for policy, because it is the placement we're leaving. objectGUID, or ms-DS-ConsistencyGuid, becomes onPremisesImmutableId, the source anchor; objectSid becomes onPremisesSecurityIdentifier.

department, title and company become department, jobTitle and companyName; rules read codes, not these strings. Office, city, state and country map across, and Entra ID adds usageLocation for licensing. manager, a DN in AD, becomes a reference that rules can't read, except in the direct-reports rule. employeeID becomes employeeId, which carries the enterprise person key; employeeType carries over, but rules can't read it, so the program mirrors it in slot 11, design guidance from Book 03's attribute map.

extensionAttribute1 to 15 become onPremisesExtensionAttributes, AD-mastered for synced users, and rules can read them. Custom schema attributes become directory extensions. The userAccountControl disabled bit becomes accountEnabled, which every access rule should require to be true. memberOf and member carry over, but rules don't nest, and the memberOf rule preview ends November 3, 2026. altSecurityIdentities reaches certificateUserIds, the PIV binding, only through sync rules the administrator adds, because it isn't in the default attribute set. And two have no attribute at all: Kerberos service principal names stay in AD until the workloads move, which is the non-person track, and adminCount has no equivalent, because privilege comes from roles and PIM. A computer object becomes a device object with its own properties and slots, which can't read its owner.`,
  `${G}, attributes primer, "Attribute mapping"; Book 03, Chapter 06 — "Program attribute map" (slot assignments are design guidance); Book 02, Chapter 09; Book 03, Chapter 09 (certificateUserIds).`);
};

  // Attributes primer 3 (new): the stores
  SL.stores = () => {
  const s = content(SEC, "Attribute stores and who can read them");
  tag(s, "What");
  table(s, "StoreTable", 1.45, [2.55, 2.9, 2.2, 2.25, 2.25], ["Store", "Objects", "Dynamic rules", "Conditional Access", "Other readers"], [
    ["Native properties", "Users, devices", "Yes, except employeeType, employeeOrgData, manager", "Through groups", "Lifecycle Workflows; licensing (usageLocation)"],
    ["extensionAttribute1–15", "Users (read-only for synced users); devices (Graph)", "Yes, users and devices", "Device filters, if managed, compliant or hybrid joined", "Lifecycle Workflows scope"],
    ["Directory extensions", "Users, groups, devices; synced or Graph", "Yes, single-value only", "Not documented", "Token claims"],
    ["Custom security attributes", "Users; service principals", "No", "App filters (SPs, string type)", "Azure ABAC; LCW scope; HR provisioning"],
    ["Schema and open extensions", "Many Graph resources", "No", "No", "Application data only"],
    ["Intune inventory", "Managed devices", "No", "No", "Assignment filters"],
    ["Azure resource tags", "Arc servers, Azure resources", "No", "No", "Policy; Resource Graph; Update Manager"],
    ["certificateUserIds", "Users", "No", "Authentication strength, through CBA", "CBA username binding"],
  ], { fontSize: 11, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: dynamic rules; custom security attributes; directory extensions; CA filters; certificateUserIds (Oct. 29, 2026). Guide, attribute stores; Book 03, Ch 06.");
  notes(s,
`Every later slide that names a store points back here, so this is the store table: the places an attribute can live, in the order to reach for them, and what can read each. The table is the guide's; the writers are in these notes.

One: native properties, written by HR provisioning, sync from AD or an administrator. Use a native property first. Dynamic rules read many of them, but not employeeType, employeeOrgData or manager. Two: extensionAttribute1 to 15, which came from the Exchange schema. On synced users they're mastered in AD and read-only in Entra ID; on cloud-only users they're writable in Entra ID; on devices they're written through Graph. Dynamic user and device rules read them, Conditional Access device filters read the device's own slots, but only when the device is Intune-managed, compliant or hybrid joined, and Lifecycle Workflows can scope on them. On a cloud-only user who was once synced, they're read-only in Graph and managed through Exchange; test that case before a population's source of authority moves, which is design guidance. The catch: anyone who can read the object can read them, so they aren't for sensitive values. Three: directory extensions, for more than fifteen slots or custom AD schema attributes; rules read single-valued ones, and Microsoft doesn't document Conditional Access reading them.

Four: custom security attributes, typed, in attribute sets, on users and service principals. The Attribute Definition Administrator defines them and the Attribute Assignment Administrator assigns them; Global Administrator can't read them by default; HR provisioning can set them. Conditional Access app filters, Azure ABAC and Lifecycle Workflows read them; dynamic rules can't. At most 500 active definitions and 50 values per object. Use them for sensitive values no rule reads, and for tagging service principals.

Five: device properties, on the Entra device object, read by device rules, and Intune's own inventory, read by assignment filters. Six: Azure resource tags on the Arc track, read by Azure Policy, Resource Graph and Update Manager. Tags aren't a role-assignment scope, since Azure RBAC attaches to the management group, subscription, resource group or resource, and they're plain text, so no security boundary. Seven: certificateUserIds, the credential binding, up to ten values each unique in the tenant, written only by Entra Connect for synced users, through sync rules the administrator adds, and by a Privileged Authentication Administrator or Graph for cloud-only users. And schema and open extensions hold application data; they can't be used in rules and don't sync from AD, so no targeting relies on them.`,
  `${G}, attributes primer (attribute stores), "Which attribute store each mechanism can read"; Book 01, Chapter 04 — "Where the attributes live"; Book 03, Chapter 06 — "Design rules"; Book 03, Chapter 09 (certificateUserIds); Book 05, Chapters 08 and 09.`);
};

  // 5 Stage map
  SL.stagemap = () => {
  const s = content(SEC, "Nine stages, each with a decider and a gate");
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
};

  // 6 Stage 0
  SL.stage0 = () => {
  const s = content(SEC, "Stage 0: read what the tree encodes before moving it");
  tag(s, "How");
  const pic = img(s, "b02-identity/ch08-gpo-analysis", 0.6, 1.5, 7.2, 2.7);
  const a = panel(s, "Collect", 8.05, 1.5, 4.7, null, HEX.navy, HEX.navyTint, "READ-ONLY INVENTORY", null, [
    "Placement and size of every OU",
    "GPO links and inheritance, site links included",
    "Non-inherited access-control entries someone delegated by hand",
    "What read-only discovery couldn't see, recorded",
  ], 13.5);
  const b = panel(s, "Decide", 0.6, pic.bottom + 0.2, 5.95, null, HEX.teal, HEX.tealTint, "DECISION AND GATE", null, [
    "Every security group: keep synced, convert to cloud-only, convert to dynamic, or retire",
    "GPO settings: user-side to the HR track; computer-side to Intune and Arc",
    "Gate: inventory in Git, a UPN remediation plan, a decision per group, OUs mapped to proposed units",
  ], 13);
  panel(s, "Fail", 6.8, Math.max(a, pic.bottom) + 0.2, 5.95, null, HEX.red, HEX.redTint, "FAILURE MODES", null, [
    "A site-linked GPO looks unlinked to an OU-only search",
    "adminCount stays set after an account leaves a protected group, so it overstates privilege",
  ], 13.5);
  sources(s, "Sources: Guide, Stage 0; Book 02, Ch 07, Ch 08 (OU hierarchy; what to collect), Ch 09 (per-group decision; AdminSDHolder), Ch 10 (Phase 0); Book 05, Ch 08, 09 (GPO split).");
  notes(s,
`Stage 0 is read-only. The assessment captures what each OU actually encodes so the target reproduces intent, not structure. The figure is Book 02's GPO analysis: the inventory of every GPO with its status, owner and WMI filter, then the reports and inheritance views per GPO and per OU.

Collect four things. Placement and size of each OU. GPO links and inheritance. The non-inherited access-control entries that someone delegated by hand, because that's where the real delegation lives. And a record of what read-only discovery couldn't see, so nobody mistakes a gap for an absence.

Two decisions come out of it. For every OU function, where it goes, which the OU-jobs slide covered. And for every security group, one of four outcomes: keep it synced, convert it to cloud-only, convert it to dynamic, or retire it.

The GPO analysis also sorts by track. User-configuration settings move with people, so they belong to the HR track and go to user-targeted Intune policy and Conditional Access. Computer-configuration settings move with machines: end-user devices on the Intune track, to Intune device policy and filters, and member servers on the Arc track, to Azure Policy and machine configuration. That split is the series framing, design guidance; Book 05, Chapters 08 and 09 carry each half.

The gate is Book 02's Phase 0: a complete inventory in Git, a UPN remediation plan, a recorded decision for every group, and the OU structure mapped to proposed administrative units.

Two failure modes. A GPO linked at a site looks unlinked to a search that only walks OUs, so include site links. And adminCount overstates current privilege, because it stays set after an account leaves a protected group; check actual membership.

That's the model. Module 2 sources the attributes that replace the tree.`,
  `${G}, Stage 0; Book 02, Chapter 07 — "Recording what read-only discovery couldn't see"; Chapter 08 — "OU hierarchy and delegation," "What to collect"; Chapter 09 — "The per-group decision," "AdminSDHolder and protected groups"; Chapter 10 — "Phase 0: assessment."`);
};

  // 8 Authority
  SL.authority = () => {
  const s = content(SEC, "Stage 1: HR is the authority, one fact to one system");
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
};

  // 9 Federal HR 2.0
  SL.hr20 = () => {
  const s = content(SEC, "Federal HR 2.0: the coming source and what OPM leaves open");
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
};

  // 10 API-driven provisioning
  SL.api = () => {
  const s = content(SEC, "API-driven inbound provisioning and the two landing zones");
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
};

  // 11 Contractors and other writers
  SL.contractors = () => {
  const s = content(SEC, "What HR doesn't supply: contractors and other writers");
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
};

  // 12 Canonical schema
  SL.schema = () => {
  const s = content(SEC, "The canonical schema, and one writer per attribute");
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
};

  // 13 Stage 2
  SL.stage2 = () => {
  const s = content(SEC, "Stage 2: prove the attributes true before use");
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
};

  // 14 Stage 3
  SL.stage3 = () => {
  const s = content(SEC, "Stage 3: map the attributes through sync");
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
};

  // 16 Stage 4
  SL.stage4 = () => {
  const s = content(SEC, "Stage 4: OU subtrees become dynamic-group rules");
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
};

  // 17 Stage 5
  SL.stage5 = () => {
  const s = content(SEC, "Stage 5: delegation moves to administrative units");
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
};

  // 18 Stage 6
  SL.stage6 = () => {
  const s = content(SEC, "Stage 6: Conditional Access targets personas, not the tree");
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

Devices are the other half of Stage 6, and Part 2 takes them up on the Intune track; first, the dangers of dynamic user groups.`,
  `${G}, Stage 6; Book 01, Chapter 04 — "Conditional Access: the policy-inheritance replacement," "Verification"; Book 02, Chapter 09 — "Testing and rollout"; Book 04, Chapter 03 — "Personas," "Policies come in pairs," "Exclusions," "Users, groups, roles and workload identities."`);
};

  // Intune coverage (new)
  SL.intunecov = () => {
  const s = content(SEC, "What Intune covers");
  tag(s, "What");
  txt(s, "Lead", "Intune isn't only for Microsoft platforms: it manages Apple, Android and Linux devices as well as Windows, within these limits.",
    { x: 0.6, y: 1.4, w: 12.15, h: 0.4, fontSize: 14, color: HEX.ink });
  table(s, "IntuneCov", 1.85, [3.75, 8.4], ["Platform", "Coverage (Microsoft Learn, Oct. 29, 2026)"], [
    ["Windows 11; Windows 10 LTSC 2019, 2021; Windows 11 LTSC 2024", "Managed: Autopilot, Entra join, provisioning package, co-management, or GPO-triggered for hybrid-joined devices"],
    ["Windows 10, not LTSC", "Limited: out of support since October 14, 2025, so only allowed; it enrolls, but nothing is guaranteed"],
    ["Windows 365 Cloud PC; Azure Virtual Desktop", "Managed. AVD with limits: settings catalog and a few templates, no Autopilot, pooled host pools for multi-session"],
    ["macOS; iOS and iPadOS", "Managed: macOS 15 and later, iOS 18 and later supported; Automated Device Enrollment through Apple Business Manager"],
    ["Android Enterprise; AOSP", "Managed: work profile, corporate work profile, fully managed, dedicated; AOSP for listed devices without Google services"],
    ["Linux desktop", "Limited: Ubuntu 24.04 and 26.04 LTS, RHEL 9 and 10; compliance, and Conditional Access for Microsoft 365 in Edge"],
    ["ChromeOS", "Limited: a connector syncs inventory and a few actions; enrollment and policy stay in the Google Admin console"],
    ["HoloLens 2, Surface Hub, Teams Rooms, AR/VR; kiosks and shared devices", "Managed; some specialty devices need extra licensing"],
    ["Not covered", "Windows 7 and 8.1, write-filter devices; Android device administrator; Windows Server (Arc); printers, network gear, IoT and OT"],
  ], { fontSize: 11, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: Intune supported platforms; enrollment; Windows 365; AVD; Apple; Android; AOSP; Linux; ChromeOS (Oct. 29, 2026). Guide, Intune coverage; Book 05, Ch 03.");
  notes(s,
`Now the Intune track: end-user devices, whose attributes come from device provisioning, not HR. First, what Intune covers, because it isn't only for Microsoft platforms. It manages Apple, Android and Linux devices as well as Windows, within the limits the guide verified on Microsoft Learn on October 29, 2026.

Windows. Windows 11 in its editions, Windows 10 LTSC 2019 and 2021 and Windows 11 LTSC 2024 are managed, enrolling through Autopilot or Autopilot device preparation, Entra join with automatic enrollment, a provisioning package, co-management, Group Policy-triggered enrollment for hybrid-joined devices, or a work account for personal devices. Windows 10 outside LTSC went out of support on October 14, 2025, so Intune treats it as allowed: it enrolls, but functionality isn't guaranteed. Windows 7, 8.1 and devices with Unified Write Filter on aren't supported.

Windows 365 Cloud PCs are provisioned, joined and enrolled automatically. Azure Virtual Desktop is managed with limits: the settings catalog plus certificate and device-tunnel VPN templates only, no Autopilot or Enrollment Status Page, some update rings and remote actions unsupported, pooled host pools only for multi-session; it's supported in GCC, GCC High and DoD.

Apple. macOS 15 and later is supported, and 13 and later allowed for devices with no user affinity; iOS and iPadOS 18 and later supported, 16 and later allowed. Automated Device Enrollment through Apple Business Manager or Apple School Manager, Apple Configurator, and the Company Portal or account-driven user enrollment for personal devices.

Android. Android Enterprise personally owned work profile, corporate-owned work profile, fully managed and dedicated, on Android 10 and later, dedicated 8 and later, enrolling by QR code, zero-touch, Knox Mobile Enrollment, NFC or token. AOSP covers a listed set of devices without Google Mobile Services, mostly AR and VR headsets and rugged devices. Android device administrator isn't supported on devices with Google Mobile Services since December 2024, except Teams Android devices.

Linux desktops are limited: Ubuntu Desktop 24.04 and 26.04 LTS and Red Hat Enterprise Linux 9 and 10, managed for compliance, including custom Bash scripts, and Conditional Access for Microsoft 365 in Edge. ChromeOS is limited too: the Chrome Enterprise connector syncs inventory and allows deprovision, lost mode, restart and wipe, but enrollment and policy stay in the Google Admin console, compliance shows Not evaluated, and app protection isn't supported.

Specialty devices, HoloLens 2, Surface Hub, Teams Rooms on Windows and AR and VR headsets, are managed, some with extra licensing; kiosks and shared devices through kiosk profiles and shared PC on Windows, and Entra shared device mode on iOS, iPadOS and Android.

Not covered: Windows Server, which goes to Arc, and printers, network gear, IoT and OT devices, cameras and thin clients that don't run a supported Windows edition. Defender for Endpoint device discovery finds those, which is the tiered strategy two slides on.`,
  `${G}, "Which end-user devices Intune covers" (Microsoft Learn, Oct. 29, 2026: supported operating systems, enrollment methods, Windows 365, Azure Virtual Desktop, Apple and Android enrollment, AOSP, Linux, ChromeOS connector, specialty and frontline devices, Defender device discovery); Book 05, Chapter 03 — "Which end-user devices Intune covers"; Chapter 04.`);
};

  // 19 Intune
  SL.intune = () => {
  const s = content(SEC, "Intune targeting: device groups, and prefer filters");
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
};

  // 20 Devices
  SL.devices = () => {
  const s = content(SEC, "Beyond users: Intune and Entra devices");
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
};

  // Arc coverage (new)
  SL.arccov = () => {
  const s = content(SEC, "What Azure Arc covers");
  tag(s, "What");
  txt(s, "Lead", "Arc isn't limited to Microsoft platforms either: it manages Linux servers, VMware virtual machines and AWS and Google Cloud instances.",
    { x: 0.6, y: 1.4, w: 12.15, h: 0.4, fontSize: 14, color: HEX.ink });
  table(s, "ArcCov", 1.85, [3.75, 8.4], ["Server or platform", "Coverage (Microsoft Learn, Oct. 29, 2026)"], [
    ["Windows Server 2016–2025", "Supported, Desktop Experience and Server Core; 2016 gets new agent versions until February 2030"],
    ["Windows Server 2012 and 2012 R2", "Listed; no new agent versions after November 2026; their ESUs ended October 13, 2026, and Arc doesn't extend them"],
    ["Linux: RHEL, Rocky, Alma, Oracle, SUSE, Ubuntu, Debian, Amazon, Azure Linux", "Supported, by listed version; several older versions get no new agent versions after November 2026"],
    ["Physical servers; VMs on any hypervisor", "Supported, with the Connected Machine agent"],
    ["VMware vSphere VMs, including Azure VMware Solution", "Supported through a resource bridge to vCenter 8, then the agent; ESXi hosts appear as inventory only"],
    ["System Center VMM VMs", "Retiring: new onboardings stop by October 2026, the service ends September 2029"],
    ["AWS EC2 and Google Cloud VMs", "Supported: the agent, or the multicloud connector (AWS; Google Cloud in preview; not in Azure Government)"],
    ["Azure Local; Kubernetes; SQL Server", "Azure Local through its built-in Arc plane; Arc-enabled Kubernetes; SQL Server enabled by Arc (Book 06)"],
    ["Azure VMs; Windows 10 and 11", "Azure VMs are native, so no Arc; clients only in server-like roles, since end-user machines belong in Intune"],
    ["Not covered", "2008 R2 and earlier, 32-bit; AIX, Solaris, HP-UX, mainframe, network devices; sealed appliances (program's reading)"],
  ], { fontSize: 11, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: Arc agent prerequisites; choose Arc; Arc VMware vSphere; SCVMM; multicloud connector; Arc Kubernetes (Oct. 29, 2026). Guide, Arc coverage; Book 05, Ch 09.");
  notes(s,
`Now the Arc track: servers. Arc isn't limited to Microsoft platforms either; it manages Linux servers, VMware virtual machines and AWS and Google Cloud instances. These are Microsoft Learn facts the guide verified on October 29, 2026, and the guide marks the two entries that are the program's reading.

Windows Server 2016, 2019, 2022 and 2025, Desktop Experience and Server Core, are supported, and 2016 gets new agent versions until February 2030. Windows Server 2012 and 2012 R2 are listed with no new agent versions after November 2026; their Extended Security Updates ended October 13, 2026, and Arc support doesn't extend them. 2008 R2 and earlier, and any 32-bit OS, aren't supported, and machine configuration doesn't run on Arm64.

Linux: Red Hat Enterprise Linux 7 to 10, Rocky and AlmaLinux 8 and 9, Oracle Linux 7 to 10, SUSE 12 SP5 and 15, Ubuntu 18.04 to 26.04, Debian 11 to 13, Amazon Linux 2 and 2023, and Azure Linux 3.0. Several of the older ones get no new agent versions after November 2026, and the agent isn't tested on CIS-hardened systems.

Physical servers and VMs on any other hypervisor are supported with the agent. VMware vSphere VMs, including Azure VMware Solution, connect through an Arc resource bridge to vCenter Server 8, up to 9,500 VMs per bridge, then guest management installs the agent; ESXi hosts are discovered as inventory, and that the host itself takes no agent is the program's reading. VMs under System Center Virtual Machine Manager are retiring: new onboardings stop by October 2026 and the service ends in September 2029.

AWS EC2 and Google Cloud VMs take the agent, or the multicloud connector, which covers AWS, with Google Cloud in preview, and isn't available in Azure Government. Azure Local is supported through its built-in Arc control plane. Arc-enabled Kubernetes attaches any CNCF-certified cluster, and SQL Server enabled by Arc is Book 06's subject.

Azure VMs aren't Arc: Microsoft says not to install Arc on them, because they're already native Azure resources. Windows 10 and 11 clients are only for server-like roles such as signage; end-user machines belong in Intune. And AIX, Solaris, HP-UX, mainframe operating systems and network devices aren't on Microsoft's list; vendor-sealed appliances aren't covered where the vendor doesn't allow an agent, which is the program's reading.`,
  `${G}, "Which servers Arc covers" (Microsoft Learn, Oct. 29, 2026: Connected Machine agent prerequisites, choosing Arc, Arc-enabled VMware vSphere, Arc-enabled SCVMM retirement, multicloud connector, Arc-enabled Kubernetes); Book 05, Chapter 09 — "Which servers Arc reaches"; Book 06, Chapter 09.`);
};

  // 21 Arc
  SL.arc = () => {
  const s = content(SEC, "Beyond users: Azure Arc servers, through Resource Manager");
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

And one boundary, stated as the guide states it. Azure attribute-based access control conditions can currently be added only to role assignments with blob or queue storage data actions. Microsoft doesn't document them for managing Arc servers. So role assignments at those scopes govern who manages the server. Next, what neither Intune nor Arc reaches.`,
  `${G}, "Azure Arc-enabled servers: yes, through Azure Resource Manager"; Book 05, Chapter 09 — "Resource groups and tags," "Azure Policy and machine configuration."`);
};

  // Neither (new)
  SL.neither = () => {
  const s = content(SEC, "Devices neither covers: the strategy");
  tag(s, "How");
  const tb = table(s, "Tiers", 1.45, [3.0, 4.5, 4.65], ["Tier (design guidance)", "What's in it", "How it's governed"], [
    ["1. Managed by Intune or Arc", "The default for every platform on the last two slides", "Attributes written at enrollment or onboarding from the procurement record; policy reads them"],
    ["2. The platform's own tool, with an evidence feed", "ChromeOS in the Google Admin console; network devices under their controllers; the mainframe's security system; ESXi under vCenter", "Attributes mastered in the CMDB; each tool sends inventory and configuration state there on a schedule"],
    ["3. Discovered and monitored only", "Printers, cameras, badge readers, OT, anything that can't take an agent", "Defender for Endpoint discovery, Defender for IoT for OT, NAC records, CDM asset feeds; the CMDB record still exists"],
    ["4. Segmented and isolated, or retired", "Out-of-support systems; anything that can't be inventoried with confidence", "Behind segmentation, with a recorded risk acceptance and a retirement date"],
  ], { fontSize: 12, limit: 5.5 });
  callout(s, "CM8", tb + 0.25, 0.85, "FaListCheck", HEX.navy, "CM-8, System Component Inventory: ",
    "every component is in exactly one tier and counted once. A device in no tier is a finding.");
  sources(s, "Sources: Guide, \"What neither tool reaches\" (design guidance); Book 05, Ch 03, 09, 10; Books 09, 12; Microsoft Learn, Defender device discovery. NIST SP 800-53 Rev. 5, CM-8.");
  notes(s,
`Both tools manage non-Microsoft platforms, Intune for Apple, Android, Linux and ChromeOS within its limits, and Arc for Linux, VMware, AWS and Google Cloud, but neither reaches everything. This is design guidance from the guide: a four-tier strategy for the rest. The four-track rule still holds: every device and server has exactly one source of truth for its attributes, and for anything Intune and Arc don't manage, that source is the CMDB or asset inventory, the same record that owns the business facts for managed devices, Book 05 Chapter 03.

Tier 1 is managed by Intune or Arc, the default for every platform on the last two slides: attributes written at enrollment or onboarding from the procurement record, and policy reads them.

Tier 2 is managed by the platform's own tool, with an evidence feed: ChromeOS in the Google Admin console, network devices under their controllers, Book 09 Chapter 09, the mainframe under its own security system, Book 01 Chapter 04, and ESXi hosts under vCenter. Attributes are mastered in the CMDB, and each tool sends its inventory and configuration state there on a schedule.

Tier 3 is discovered and monitored only: printers, cameras, badge readers, OT equipment and anything else that can't take an agent. Defender for Endpoint device discovery finds them, with Defender for IoT for OT; network access control connection records, Book 09 Chapter 07; and CISA CDM asset feeds under BOD 23-01, Book 12 Chapter 01. The CMDB record exists even though no tool manages the device.

Tier 4 is segmented and isolated, or retired: out-of-support systems and anything that can't be inventoried with confidence, behind segmentation, with a recorded risk acceptance and a retirement date, Book 05 Chapter 09.

The tiers are how the inventory meets NIST SP 800-53 Rev. 5 control CM-8, System Component Inventory, in the program's mapping: it includes every component and counts none twice, Book 05 Chapter 10. A device in no tier is a finding.`,
  `${G}, "What neither tool reaches: a tiered strategy" (design guidance); Book 05, Chapter 03 — "Which system owns which fact"; Chapter 09 — "Extended Security Updates"; Chapter 10 — "Reporting and the evidence an assessor reads"; Book 09, Chapters 07 and 09; Book 12, Chapter 01; Book 01, Chapter 04; NIST SP 800-53 Rev. 5, CM-8.`);
};

  // Non-person 1 (new): service accounts
  SL.npi1 = () => {
  const s = content(SEC, "Non-person track: service accounts, MSAs and gMSAs");
  tag(s, "What");
  const tb = table(s, "SvcAccts", 1.45, [1.95, 2.55, 4.4, 3.25], ["AD account", "Where the workload runs", "Entra ID or AD target", "Credential"], [
    ["Traditional (svc- user)", "Calls Entra-protected APIs", "App registration and service principal", "Certificate, or a federated credential"],
    ["Traditional", "An Azure resource", "Managed identity (user-assigned preferred)", "Managed by Azure"],
    ["Traditional", "On premises, Kerberos only", "gMSA, or a dMSA on a Windows Server 2025 domain", "Managed by AD"],
    ["MSA", "On premises", "gMSA (upgrade first: an MSA or gMSA can't become a dMSA)", "Managed by AD"],
    ["gMSA", "Moving to the cloud", "Workload identity federation or managed identity", "No stored secret"],
    ["gMSA", "Hybrid", "Keep the gMSA, plus an app registration for cloud calls", "Split"],
  ], { fontSize: 11.5, limit: 4.75 });
  const a = panel(s, "Owner", 0.6, tb + 0.2, 6.0, null, HEX.teal, HEX.tealTint, "OWNER, SPONSOR AND RECORD", null, [
    "The application owner is identified before the account is touched, and decides its conversion",
    "Two human owners per replacement app; an account nobody will own is a retirement candidate",
  ], 12.5);
  panel(s, "Life", 6.85, tb + 0.2, 5.9, a - tb - 0.2, HEX.amber, HEX.amberTint, "CREDENTIALS AND LIFECYCLE", null, [
    "High-risk accounts (password never expires) convert first",
    "Old and new credentials run in parallel for 30 days, then the legacy account is disabled",
  ], 12.5);
  sources(s, "Sources: Book 02, Ch 09, \"Service accounts,\" \"The migration path matrix\" (Microsoft Learn on dMSA, as footnoted); Ch 06 matrix; Ch 10, Phase 4. Guide, non-person track.");
  notes(s,
`Now the non-person track, and it starts with the accounts Active Directory already holds. Service accounts are, in Book 02's words, a critical identity class that's often under-governed, and they have no HR record to drive them.

The table is Book 02 Chapter 09's migration path matrix, shortened. The general rule is to eliminate stored secrets. A traditional service account, a user object often with an svc prefix, a password that never expires and interactive logon, is the highest risk. If it calls Microsoft 365 or another Entra-protected API it becomes an app registration and service principal with a certificate, or a federated credential where the host has an OIDC issuer. If it runs on an Azure resource, a managed identity, user-assigned preferred. If it's on premises and Kerberos only, a gMSA, or a delegated managed service account on a Windows Server 2025 domain. An MSA upgrades to a gMSA first, because an MSA or gMSA can't be migrated to a dMSA. A gMSA moving to the cloud becomes workload identity federation or a managed identity; a hybrid one keeps the gMSA and adds an app registration for cloud calls. IIS application pools and scheduled tasks go to gMSAs now and managed identities once they move.

Owner and sponsor. Book 02's responsibility matrix gives service account conversion, per application, to the application owner, with identity engineering and the AD administrators doing the work. Book 02's Phase 4 identifies the owner before the account is touched and gives every replacement application two human owners; an account nobody will own is a retirement candidate. The owning system's inventory or CMDB entry, not HR, is its record.

Credentials and lifecycle. High-risk accounts, password never expires and over-privileged, convert first. The targets remove the stored secret: AD manages gMSA and dMSA passwords, Azure manages managed identities, and federation replaces the secret with a token. The lifecycle follows the owning application: discovered and classified read-only in Phase 0 with the Appendix C function, converted with old and new credentials in parallel for 30 days, then the legacy account disabled, and retired when the application is. Book 02's Phase 4 is the gate.`,
  `${G}, "Non-person identity track"; Book 02, Chapter 09 — "Service accounts," "Modernizing service accounts," "The migration path matrix," "Discovering service accounts"; Chapter 10 — "Phase 4: service account modernization"; Chapter 06 — "The responsibility matrix" (service account conversion, per application); Appendix C; series framing (non-person track).`);
};

  // Non-person 2 (new): workload identities and AI agents
  SL.npi2 = () => {
  const s = content(SEC, "Non-person track: workload identities and AI agents");
  tag(s, "Who");
  const tb = table(s, "Workloads", 1.45, [2.2, 3.45, 3.0, 3.5], ["Identity", "Owner and sponsor", "Credentials", "Lifecycle"], [
    ["Service principal (app registration)", "At least two human owners, never service accounts; serviceManagementReference points at the inventory record", "Federated credential or certificate; no client secrets in production; app management policies can block new secrets", "Owners review permissions; credential expiry is a review point; orphan policy when owners lapse"],
    ["Managed identity", "The owner of the Azure resource it serves", "Managed by Azure; nobody sees it", "System-assigned: deleted with its resource. User-assigned: deleted explicitly"],
    ["Workload identity federation", "As its app registration or user-assigned managed identity", "Trusts an external issuer; issuer, subject and audience must match; at most 20 per app", "Test each one: a wrong subject fails only at token exchange"],
    ["AI agent identity (Agent ID)", "Sponsor required at creation. Program: an HR-mastered federal employee plus a small steward group; the owner is never the sponsor", "None of its own: the blueprint holds them, so it is the credential boundary", "Sponsor mover and leaver tasks in Lifecycle Workflows; access packages with end dates; disable, then delete"],
  ], { fontSize: 11.5, limit: 5.6 });
  callout(s, "AgentCloud", tb + 0.2, 0.8, "FaCloud", HEX.red, "Check the agency's cloud: ",
    "Agent ID has no Azure Government feature-list entry; GCC has a documented subset. Workload CA doesn't cover managed identities.");
  sources(s, "Sources: Book 02, Ch 09 (WIF; workload CA; governing SPs); Book 17, Ch 04, 05 (Microsoft Learn as footnoted, Oct. 2026); Guide, non-person track. Program rules are design guidance.");
  notes(s,
`The rest of the non-person track lives in Entra ID: service principals, managed identities, workload identities and, now, AI agents. For each one, the question is who answers for it, what credential it holds and what ends its life.

Service principals, from Book 02 Chapter 09. Every app registration and service principal gets at least two human owners, never service accounts. Managed identities first, then federated credentials, then certificates on a rotation schedule, the program standard annually; no client secrets for production workloads. Microsoft's application management policies, free per the Workload ID FAQ, can block new password secrets and cap credential lifetimes tenant-wide. Owners review delegated and application permissions, and credential expiry is a scheduled review point. Book 17 adds that the app's serviceManagementReference points at its inventory record, and Book 04 Chapter 06's orphan policy applies when owners lapse.

Managed identities, from Book 17 Chapter 04. Azure manages the credential and nobody can see it. A system-assigned identity is created with one resource and deleted with it; a user-assigned one is a standalone resource that has to be deleted explicitly. Conditional Access for workload identities doesn't cover managed identities, so Book 02 puts them in access reviews instead.

Workload identity federation lets an app registration or user-assigned managed identity trust tokens from an external issuer, GitHub Actions, Kubernetes, another cloud. Issuer and subject must match exactly, the audience is the token-exchange value, there are at most 20 per app, and a wrong subject is accepted at creation and fails only at exchange, so test each one.

AI agents, from Book 17. Microsoft Entra Agent ID gives each agent an agent identity, a special service principal with no credentials of its own; the blueprint holds them, so Microsoft calls the blueprint the credential boundary. A sponsor is required at creation. The program's rule, design guidance: the sponsor is a federal employee mastered in HR, a second sponsor is a small dynamic group of the office's stewards, and the technical owner is never the sponsor. Lifecycle Workflows' sponsor tasks, generally available in May 2026, carry the sponsor's mover and leaver event; access packages carry end dates so expiry is the review; and retirement is disable, then delete, with a 30-day soft-delete window.

The callout: check the agency's cloud. Agent ID has no entry on Entra's Azure Government feature list; GCC has a documented subset, and GCC High and DoD should treat agent identities as unavailable until Microsoft confirms in writing. Where they aren't available, the same governance applies to the service principals and managed identities the agents run as.`,
  `Book 02, Chapter 09 — "Workload identity federation," "Conditional Access for workload identities," "Governing service principals"; Book 17, Chapter 04 — "Workload identities," "Agent identities," "Release stage, licensing and government clouds"; Chapter 05 — "The program's rule," "The lifecycle, event by event," "Retirement"; Book 04, Chapters 05 and 06.`);
};

  // 22 Service principals
  SL.sp = () => {
  const s = content(SEC, "Beyond users: service principals and custom attributes");
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
};

  // 23 Object crosswalk
  SL.crosswalk = () => {
  const s = content(SEC, "The object-type crosswalk: stores, writers, consumers");
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
};

  // 24 PIV binding
  SL.piv = () => {
  const s = content(SEC, "PIV and CAC: the certificate binding is an attribute");
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
};

  // 25 certificateUserIds
  SL.cuid = () => {
  const s = content(SEC, "certificateUserIds: who writes it, and the open pilot");
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

After AD, the design is that the card management system writes the value through Graph at issuance. That's design guidance and unverified: an open pilot, workbook issue 130, asking which permission a workload needs and how the write behaves once source of authority has moved. Microsoft documents neither. Module 3 of this part puts all of this to work.`,
  `${G}, "PIV and CAC certificates as attributes": "certificateUserIds," "Where the binding comes from"; verification log claims 70 and 74, "Could not verify"; Book 03, Chapter 09 — "Binding the PIV certificate," "The canonical leaver sequence"; Book 07, Chapter 06 — "Strong certificate mapping"; Chapter 07 — "AD CS chain into Entra ID."`);
};

  // 27 Worked example
  SL.worked = () => {
  const s = content(SEC, "Worked example: one analyst, every mechanism");
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
};

  // 28 Mover event
  SL.mover = () => {
  const s = content(SEC, "The mover event: one personnel action, no ticket");
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
};

  // 29 Stage 7
  SL.stage7 = () => {
  const s = content(SEC, "Stage 7: cut over in phases, wave by wave");
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
};

  // 30 Stage 8
  SL.stage8 = () => {
  const s = content(SEC, "Stage 8: detect drift and fix it at the source");
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
};

  // Dangers 1 (new): dynamic user groups
  SL.dangersU = () => {
  const s = content(SEC, "Dynamic user groups: the dangers, and how to avoid them");
  tag(s, "How");
  table(s, "UserDangers", 1.45, [3.9, 8.25], ["Danger (HR track)", "How to avoid it"], [
    ["Write access to an attribute is access", "The provisioning service is the only writer; remove help-desk, self-service and Exchange custom-attribute write paths, in AD and Entra ID"],
    ["One rule edit has a large blast radius", "Validate (up to 20 users at a time), shadow against the group it replaces, pilot; rule changes under change control, rules held in Git"],
    ["Rules that forget the guards", "Every access rule requires accountEnabled true and userType Member, and excludes agents' user accounts"],
    ["Display names instead of codes", "Rules read codes in slots 10 to 12 from HR-owned code lists; a value not on the list is drift"],
    ["Empty or missing values", "No rule grants production access until its attributes are verified for a pilot cohort; report empty carriers as drift"],
    ["Processing delay and pauses; removal doesn't revoke tokens", "Never the only control for urgent revocation: pair it with disable and session revocation; check for paused rules"],
    ["Automatic removal has side effects", "Licenses and app access go with the group: base license groups on stable attributes; fix a mis-coded record inside 30 days"],
    ["What dynamic groups can't do; slow operators", "Privilege stays assigned, cloud-only and time-bound; prefer -eq, -startsWith and -in to -match and -contains"],
    ["Unwatched membership; emergency access caught", "Alert on membership deltas; review rule history in Git; emergency-access accounts excluded from CA and from all of this"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: dynamic rules; validate rules; processing; group licensing; Exchange licensing (Oct. 29, 2026). Guide, dangers; Book 03, Ch 06, 10; Book 06, Ch 16, 17.");
  notes(s,
`Dynamic groups remove the ticket queue, and with it the human check that came with it, so the guide names their dangers. This is the HR track's mechanism. The facts come from the chapters and were checked on Microsoft Learn on October 29, 2026; the responses are design guidance unless a chapter states them as its rule.

Write access to an attribute is access. Anyone who can write an attribute a rule reads can put an account into the group. Microsoft warns that the group is only as secure as the write permissions on the attributes its rule references, in Entra ID and in any source directory, and that some synced AD attributes may let users write their own values. So the provisioning service is the only writer, help-desk, self-service and Exchange custom-attribute write paths are removed in AD and Entra ID, Book 03 Chapter 06, and the write permissions on every attribute a security-relevant rule reads are audited.

One rule edit has a large blast radius. A typo or wrong operator adds or drops every matching member at the next evaluation, and a rule change removes existing members who no longer match, Book 06 Chapter 17. Validate the rule, the Validate rules tab tests up to 20 users or devices at a time and needs at least Groups Administrator, shadow it against the group it replaces, pilot it, and put rule changes under change control with the rules held in Git, Book 03 Chapter 10.

Rules that forget the guards. Without accountEnabled and userType clauses, a rule includes disabled accounts and guests, and an agent's user account is a kind of user that user rules include unless they exclude it. Every access rule requires accountEnabled true and userType Member and excludes agents' user accounts.

Display names instead of codes: renames, retyping, case and whitespace move people silently, so rules read the codes in extensionAttribute10 to 12 from HR-owned code lists, and a value not on the list is drift. Empty or missing values: an account with an empty carrier falls out of every group that tests for a value, and a Conditional Access policy that includes a dynamic group silently misses it, Book 04 Chapter 03. No rule grants production access until its attributes are populated and verified for a pilot cohort; test for the value you expect, and report empty carriers as drift.

Processing delay. Membership is usually processed within hours but can take more than 24, bulk changes can call for pausing groups, and a paused rule stops updating. Removal doesn't revoke tokens or sessions already issued, Book 06 Chapter 16. So a dynamic group is never the only control for urgent revocation: pair it with disabling the account and revoking sessions, and check for paused rules in the drift scan.

Automatic removal has side effects. A mover or a mis-coded record leaves a group and loses what it gave: application access, and with group-based licensing the license itself. A user who leaves one licensed group before the new license applies is unlicensed until processing finishes, and when an Exchange Online license goes, mailbox access goes with it; the data is held for 30 days, and adding the license back restores it. So base license groups on attributes that don't change on an ordinary move, such as legal employer or worker type, monitor group-based licensing errors, and fix a mis-coded record at the source inside the 30 days. Microsoft documents an optional delicensing-resiliency setting; confirm it's available in the tenant's cloud before relying on it.

What dynamic groups can't do: they can't be role-assignable or used by PIM for Groups, they don't nest, and the Limits slide has the numbers. Prefer equals, starts-with and in to match and contains, which slow processing.

And monitoring, design guidance: alert on membership deltas above a threshold per group per evaluation, from the audit logs routed to Log Analytics; review the rule change history, since the rules live in Git and the nightly comparison flags any rule that differs; keep emergency-access accounts excluded from every Conditional Access policy and dependent on none of this; and know how to pause processing before a bulk change, then check no rule stayed paused.`,
  `${G}, "Dynamic group dangers and how to avoid them": "Dynamic user groups (HR track)," "Monitoring both"; Book 02, Chapters 05 and 10; Book 03, Chapters 06, 08 and 10; Book 04, Chapter 03; Book 06, Chapters 16 and 17; Microsoft Learn as footnoted in the guide (Oct. 29, 2026).`);
};

  // Dangers 2 (new): dynamic device groups
  SL.dangersD = () => {
  const s = content(SEC, "Dynamic device groups: the dangers, and how to avoid them");
  tag(s, "How");
  table(s, "DeviceDangers", 1.45, [3.9, 8.25], ["Danger (Intune track)", "How to avoid it"], [
    ["Who can write device extension attributes", "The device provisioning service is the only writer, with the app-only permission; Intune Administrator PIM-eligible, not standing; reconcile weekly"],
    ["Wrong or reused Autopilot group tags and enrollment profiles", "Take the tag from procurement intake as a controlled vocabulary, and reconcile it against the CMDB"],
    ["Device rules can't read the owner's attributes", "Write the device's own organization value at provisioning, or send user-owned settings to user groups"],
    ["Stale and duplicate device objects still match", "Require device.accountEnabled; follow Microsoft's stale-device guidance; prevent the registered-plus-joined dual state"],
    ["Evaluation delay", "For time-sensitive assignment, a filter on a user group or All devices; never a dynamic device group as an exclusion"],
    ["A rule edit's fleet-wide blast radius", "Validate and shadow the rule, move it through the pilot rings, keep rule changes under change control"],
    ["Overlapping groups and conflicting policies", "One owning policy per setting, and tier groups that are mutually exclusive by design"],
    ["Ownership values and enrollment edge cases", "Rules say Company, Intune says Corporate: use each tool's vocabulary; Unknown ownership is a finding"],
    ["Unwatched membership deltas", "Alert on deltas; add membership counts to the weekly reconciliation report"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: dynamic rules; Update device; Autopilot groups; stale devices; Intune cleanup; assignment (Oct. 29, 2026). Guide, dangers; Book 05, Ch 03, 04, 08, 10.");
  notes(s,
`The same goes for dynamic device groups on the Intune track, and here one mistake reaches the whole fleet. Facts as the guide checked them on October 29, 2026; responses are design guidance unless a chapter states them.

Who can write device extension attributes. Device slots are written through Graph, with Device read-write all app-only or, delegated, Directory access-as-user all as at least Intune Administrator, and whoever can write them can retarget compliance, configuration and app policy. So the device provisioning service is the only writer, holding the app-only permission; Intune Administrator is PIM-eligible rather than standing; and the inventory is reconciled weekly, Book 05 Chapter 10.

Group tags and enrollment profiles. The Autopilot group tag becomes the device's OrderID physical ID, and the enrollment profile name comes from enrollment, so a wrong or reused tag or profile name moves a device into the wrong policy set. Take the tag from the procurement intake, Book 05 Chapter 04, as a controlled vocabulary, and reconcile it against the CMDB.

Device rules can't read the owner's attributes. A device group keyed to the user's department finds nothing, and the primary user's department isn't a source anyway, Book 05 Chapter 03. Write the device's own department or organization value at provisioning from the procurement record, or send user-owned settings to user groups.

Stale and duplicate device objects. Reimaging leaves duplicates; a domain-joined device that is also Entra registered has two states that can evaluate nondeterministically; and stale objects still match rules. Intune cleanup rules only hide records, after 30 to 270 days without check-in, and don't remove the Entra device object. Include device.accountEnabled true in device rules, and follow Microsoft's stale-device guidance: a timeframe of at least 21 days, disable for a grace period before deleting, retire in Intune first, delete hybrid-joined devices in AD and let sync carry it, back up BitLocker keys, and don't delete system-managed Autopilot devices. Prevent the dual state on Windows 10 1803 and later, or block Entra registration on domain-joined devices.

Evaluation delay. Membership-driven policy is slower than assignment filters, which are evaluated at check-in, and a dynamic exclusion computed late lets the policy reach the device first. For time-sensitive assignment use a filter on a user group or on All devices, and don't use dynamic device groups as exclusions, Book 05 Chapter 08.

Blast radius. One rule edit can push or pull compliance, configuration, endpoint security and app assignments for a whole fleet, and a device that falls out of its tier group lands in none, so the tenant setting marks it noncompliant and Conditional Access blocks it. Validate and shadow the rule, move it through the pilot rings, and keep rule changes under change control.

Conflicts and overlap. A device in two groups gets two policies that set the same setting, and between configuration policies there's no precedence, so one owning policy per setting, and tier groups mutually exclusive by design.

Ownership values. Entra rules use Company, Personal or Unknown while Intune shows Corporate, so a rule written with Corporate matches nothing, and trust type values differ the same way. Devices enrolled outside Autopilot carry no group tag. Use each tool's vocabulary, and treat Unknown ownership and an enrollment without a registration as findings.

And monitoring: alert on membership deltas, and add membership counts to the weekly reconciliation report, Book 05 Chapter 10.`,
  `${G}, "Dynamic group dangers and how to avoid them": "Dynamic device groups (Intune track)," "Monitoring both"; Book 05, Chapter 03 — "Which system owns which fact"; Chapter 04 — "Registration and group tags"; Chapter 08 — "Assignment strategy," "The device attribute schema," "Policy types," "Testing at each gate"; Chapter 10 — reconciliation, stale records, alerts; Microsoft Learn as footnoted in the guide (Oct. 29, 2026).`);
};

  // 31 Limits 1
  SL.limits1 = () => {
  const s = content(SEC, "Limits: dynamic membership and latency");
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
};

  // 32a Limits: administrative units (replaces part of old 32)
  SL.limAU = () => {
  const s = content(SEC, "Limits: administrative units");
  tag(s, "What");
  const tb = table(s, "AULimits", 1.45, [3.4, 4.0, 4.75], ["Limit", "What it means", "Response (design guidance)"], [
    ["No nesting", "The OU tree becomes a flat set of units", "Flat units; where a role covers several, one assignment per unit, generated from one list"],
    ["A write boundary, not a confidentiality boundary", "Units limit who can change members, not who can read them", "Custom security attributes and app-level controls for confidentiality"],
    ["Only some roles can be unit-scoped", "Part of the delegation matrix may not fit a unit", "Check every role against Microsoft's list; the rest stay central or behind PIM approval"],
    ["Dynamic units: global Azure cloud only", "GCC can use them; GCC High and DoD can't", "In GCC High or DoD, maintain units with an automation job under change control and drift checks"],
    ["At most 100 restricted units; members outside ID Governance", "Restriction stops joiner, mover and leaver automation for its members", "Restrict only by explicit decision, default no; never restrict a large HR population"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "Writes", tb + 0.3, 0.85, "FaUsersGear", HEX.navy, "Units scope writes, not reads: ",
    "delegation follows the unit; confidentiality needs its own controls.");
  sources(s, "Sources: Microsoft Learn: administrative units; dynamic administrative units; restricted management units (Oct. 29, 2026). Guide, Limits; Book 01, Ch 04; Book 02, Ch 05.");
  notes(s,
`The limits of administrative units, each with what it means and the program's response. The limits are Microsoft's as the chapters state them; the responses are design guidance.

No nesting. The OU tree becomes a flat set of units. Where one role has to cover several units, give it one assignment per unit, generated from a single list so the assignments can't drift apart.

A write boundary, not a confidentiality boundary. A unit limits who can change its members, not who can read them. Confidentiality comes from custom security attributes and from controls in the applications.

Only some roles can be unit-scoped. Check every role in the delegation matrix against Microsoft's list; roles that can't be scoped stay central or go behind PIM approval.

Dynamic units are available only in the global Azure cloud. A GCC tenant, the program's target, can use them; GCC High and DoD can't, so there units are maintained by an automation job under change control and covered by the drift checks. Microsoft's prerequisite still read that way on October 29.

At most 100 restricted management units, and their members fall outside Entra ID Governance. So restriction is an explicit decision, default no, and never applied to a large HR population, or the joiner, mover and leaver automation stops for those people.`,
  `${G}, "Limits: administrative units"; LIMITS shared content (design guidance responses); Book 01, Chapter 04 — "Administrative units: the delegation replacement," "The three-tier model"; Book 02, Chapter 05 — "Restricted management administrative units."`);
};

  // 32b Lifecycle Workflows: pieces and limits (new)
  SL.lcw1 = () => {
  const s = content(SEC, "Lifecycle Workflows: the pieces and the limits");
  tag(s, "What");
  const a = panel(s, "Pieces", 0.6, 1.5, 6.0, null, HEX.navy, HEX.navyTint, "THE PIECES", null, [
    "Workflow: one scenario, with execution conditions (a trigger and a scope rule) and ordered tasks",
    "Task: built-in steps, such as a Temporary Access Pass, groups, access packages, licenses, disable or delete",
    "Custom task extension: calls a Logic App to reach other systems, fire-and-forget or with a callback",
    "Scheduled run: one tenant interval, every 3 hours by default (1 to 24), switched on per workflow",
    "On-demand run: at most 10 users, and it ignores the execution conditions",
  ], 12.5);
  table(s, "LCWLimits", 1.5, [3.4, 2.5], ["Limit", "Value"], [
    ["Workflows per tenant", "100"],
    ["Tasks per workflow", "25"],
    ["Custom task extensions per tenant", "100"],
    ["Trigger offset", "-180 to +180 days"],
    ["Administrative scopes per workflow", "5"],
    ["Custom task extension timeout", "Microsoft's pages disagree"],
  ], { x: 6.85, fontSize: 12, limit: 4.6 });
  callout(s, "Quarantine", Math.max(a, 4.45) + 0.2, 0.95, "FaUserShield", HEX.red, "Execution limits quarantine scheduled runs only: ",
    "an on-demand run bypasses quarantine and the workflow's own conditions. Edits create new versions.");
  sources(s, "Sources: Microsoft Learn: ID Governance service limits; Lifecycle Workflow deployment; execution limits and quarantine; extensibility; understanding lifecycle workflows (Oct. 29, 2026).");
  notes(s,
`Lifecycle Workflows carry the joiner, mover and leaver events, so their pieces and limits matter. They need Entra ID Governance or Microsoft Entra Suite, and the books record ID Governance as available in GCC, GCC High and DoD; re-check feature-level availability on Microsoft's government pages.

The pieces. A workflow is one automated process for one scenario, joiner, mover, leaver, pre-hire and so on. Its execution conditions are a trigger, a time-based attribute such as employeeHireDate or employeeLeaveDateTime with an offset, or an attribute change, and a scope, a rule over user properties. Then an ordered list of tasks. Built-in tasks include a welcome email, a Temporary Access Pass, adding or removing groups and Teams, requesting or removing access packages, removing licenses, and disabling or deleting the account. A custom task extension calls an Azure Logic App, so the workflow can reach systems Microsoft doesn't, such as a card management system, Intune device retire, a ticketing system or an HR write-back, fire-and-forget or waiting for a callback.

Runs. The tenant evaluates every scheduled workflow on one interval, every three hours by default, configurable from one to 24, and scheduling is switched on per workflow. Real-time leaver and mover workflows can't be scheduled, by design. An on-demand run is for testing or a situation that requires it: at most ten users, and it ignores the workflow's execution conditions, so the tasks apply to whoever is selected, whether or not they qualify.

Limits: 100 workflows per tenant, 25 tasks per workflow, 100 custom task extensions per tenant, an offset of minus to plus 180 days, five administrative scopes per workflow. The custom task extension timeout is stated differently on two Microsoft pages: the service-limits page says 30 minutes to three hours, the deployment page three minutes to five hours. The guide flags it rather than picking one, and its response, design guidance, is to design callbacks to finish well inside 30 minutes until Microsoft reconciles the pages. Microsoft notes that these default limits can be raised through Microsoft Support.

Guardrails. Execution limits are a tenant-wide or per-workflow threshold, a percentage of users, a number, or both with OR logic. If a scheduled run would exceed it, the workflow is quarantined, administrators are notified, and it doesn't run until one approves; quarantine can't be cleared automatically. On-demand runs aren't subject to execution limits. The three-day catch-up processes a user whose trigger or scope attributes were set late, if the setup completes within three days of the intended time; it doesn't apply to the time-based attribute V2 preview. And execution conditions and tasks can't be edited in place: a change creates a new workflow version, which needs change control. Book 02 Chapter 10 says 50 workflows; Microsoft says 100, and the guide states 100.`,
  `${G}, "Limits: Lifecycle Workflows"; Microsoft Learn: "Microsoft Entra ID Governance service limits" (Lifecycle Workflows), "Plan a Lifecycle Workflow deployment," "Understanding lifecycle workflows," "Configure execution limits and quarantine," "Lifecycle Workflow extensibility," Lifecycle Workflows API overview (all Oct. 29, 2026); Book 02, Chapter 10 (corrected); Book 03, Chapter 08.`);
};

  // 32c Lifecycle Workflows at scale (new)
  SL.lcw2 = () => {
  const s = content(SEC, "Lifecycle Workflows at our scale: what could break");
  tag(s, "How");
  table(s, "LCWRisks", 1.45, [3.55, 8.6], ["Risk (design guidance)", "Mitigation"], [
    ["Running out of 100 workflows", "A few general workflows (pre-hire, joiner, mover, leaver, rehire, conversion) branching on coded attributes; never one per organization; a workflow budget"],
    ["Running out of 100 custom task extensions", "One parameterized Logic App per integration, taking the component or code as input; count per environment"],
    ["25 tasks per workflow", "Group steps inside one Logic App, or chain a leaver with a post-leaver offset workflow"],
    ["The 10-user on-demand cap", "Fix the data at the source and let the scheduled run process it; a documented bulk-remediation procedure"],
    ["On-demand ignores conditions and bypasses quarantine", "Lifecycle Workflows Administrator behind PIM with approval; on-demand runs as changes, second-person check, logged"],
    ["A reorganization fires the mover for thousands", "Execution limits sized to normal weekly volume; reorganizations as change events with a pre-agreed release; rehearse"],
    ["Urgent terminations wait for the schedule", "Real-time leaver, plus disable and revoke sessions out of band"],
    ["Late HR data beyond the 3-day catch-up", "Monitor HR timeliness; report triggers in the past and never processed"],
    ["No built-in PIV revoke or device retire", "Custom extensions for card management and Intune; until then, a leaver checklist with owners"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn: ID Governance service limits; execution limits and quarantine; understanding LCW (Oct. 29, 2026). Book 03, Ch 08. Risks and mitigations: design guidance.");
  notes(s,
`This is design guidance: what could break at an agency of this size. The estate is the one the guide and Book 03 describe: one forest of twelve trees synchronized to a live GCC Moderate tenant, with every user synced, so the attributes are AD-mastered.

Running out of workflows. A workflow per tree, per component, per worker type or per scenario multiplies fast: twelve trees times joiner, mover and leaver times three worker types is 108, before pre-hire, rehire, conversion and reminders. So build a small set of general workflows that branch on coded attributes through scope rules, up to five administrative scopes each, never one per organization, keep a workflow budget in change control, and ask Microsoft Support before planning beyond the default.

Running out of custom task extensions. Each integration becomes one: card management, Intune retire and wipe, server access removal, ticketing, mailbox delegation, HR write-back, and variants multiply them. Build parameterized Logic Apps, one per integration, that take the component or code as input, and count extensions in both the test and production tenants.

Twenty-five tasks per workflow can be tight for a four-track leaver, so group steps inside one Logic App or chain a leaver with a post-leaver offset workflow.

The ten-user on-demand cap. A reorganization, a failed HR batch or a correction can affect hundreds or thousands of people at once, and there's no manual bulk run, so fix the data at the source, let the scheduled run process it, and keep a documented bulk-remediation procedure for incidents.

On-demand ignores the execution conditions and bypasses quarantine. An administrator who runs the leaver on the wrong ten people disables them, whether or not they're leavers. So the Lifecycle Workflows Administrator role sits behind PIM with approval, and an on-demand run is a change with a second-person check, logged.

Mass events. A reorganization that recodes thousands of organization codes fires the mover workflow for all of them. A good execution limit quarantines it; without one, it runs. Size tenant-wide and per-workflow limits to normal weekly volume, plan reorganizations as change events with a pre-agreed approval to release the quarantine, and rehearse in test.

Urgent terminations. The schedule, plus sync, plus dynamic-group processing, means a scheduled leaver isn't immediate. For hostile or urgent cases, use the real-time leaver and also disable the account and revoke sessions out of band, the help desk's emergency path.

Late HR data. A hire or separation entered more than three days late can miss the time-based workflow, so monitor HR timeliness and report triggers in the past that were never processed, a validation-kit check.

No built-in PIV revoke or device retire. One HR leaver event has to reach all four tracks, and natively only the account side is done. Custom extensions handle card management, revoking the certificate and removing certificateUserIds, and Intune retire; until they exist, a leaver checklist with owners. And because workflow changes are new versions, change control, a test tenant, a scoped pilot and version history as evidence.`,
  `${G}, "Limits: Lifecycle Workflows"; LIMITS shared content ("What could break," design guidance); Microsoft Learn as on the previous slide; Book 03, Chapter 08 — "Triggers and schedule," "Built-in tasks by stage"; the agency estate as Book 03 and Book 05 describe it.`);
};

  // 32d What still needs AD (from old 32)
  SL.needsAD = () => {
  const s = content(SEC, "What still needs AD during hybrid");
  tag(s, "What");
  const tb = table(s, "NeedsAD", 1.45, [4.3, 7.85], ["Still in AD", "Response (design guidance)"], [
    ["Synced users' attributes, and their disposition", "The provisioning service writes to AD; moving the source of authority is a gated step per population"],
    ["Kerberos applications", "Inventory them; write the group back as a universal group, or move the app to SAML or OIDC; each write-back is a dependency to retire"],
    ["DNS, DHCP, Kerberos-bound legacy apps; SQL Windows logins bypass CA", "They block AD retirement: track them in Books 08 and 06; report Windows-authenticated SQL logins as an IA-2 gap"],
    ["Domain GPOs hybrid-joined devices still need", "Move the policy to Intune first; disable links population by population with rollback tested"],
    ["Moving the source of authority", "Entry checks per population: HR direct to Entra ID, no on-premises Exchange, no AD FS, no password-based apps"],
    ["Source-of-authority transfer in GCC: open", "Confirm with Microsoft; until then the AD-mastered path is the default, with an owner and a decide-by date"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "Hybrid", tb + 0.3, 0.75, "FaRoute", HEX.navy, "Hybrid lasts: ",
    "retiring AD means clearing a list of named dependencies, not reaching a date.");
  sources(s, "Sources: Microsoft Learn: user SOA guidance; Transfer user SOA (Oct. 29, 2026). Guide, Limits; Books 02, 03, 05, 06 as noted; NIST SP 800-53 Rev. 5, IA-2.");
  notes(s,
`What still needs Active Directory during hybrid, and the response to each, design guidance.

Synced users' attributes. AD is where they're written, and the Entra copies are read-only, so the provisioning service writes to AD, Book 03 Chapter 05's landing zones, and disposition of synced users happens in AD or through the provisioning agent. Moving the source of authority is a gated step per population.

Kerberos applications need a cloud group provisioned back to AD as a universal group. Inventory them; write the group back, or move the app to SAML or OpenID Connect, and count each written-back group as a dependency to retire.

DNS, DHCP and Kerberos-bound legacy applications keep the forest alive after it stops being the governance model, and any surviving Windows login to SQL Server bypasses Conditional Access. They block AD retirement, so track them in Books 08 and 06, and report each Windows-authenticated SQL login as a gap against IA-2, identification and authentication, which is the program's mapping in Book 06, Appendix A. Deleting a synced user only in Entra ID doesn't stick, so synced users are disposed of at the source.

Domain-level GPOs that hybrid-joined devices still need, which is why migrated OUs don't block inheritance. Move the policy to Intune first, disable links population by population with rollback tested, and keep the domain baselines until the last hybrid device is gone.

Moving a user's source of authority has prerequisites Microsoft lists: HR integrated so changes go directly to Entra ID, no on-premises Exchange workloads, no AD FS federation for those users, and no applications that need password-based authentication such as LDAP bind. Make those the entry checks per population, evaluated by the validation kit; the populations that pass move first.

And whether user source-of-authority transfer is available in GCC is still open in Book 03's verification register. Confirm it with Microsoft; until then, plan the AD-mastered path as the default, which Book 03 supports in both editions, with an owner and a decide-by date. The overall lesson: hybrid lasts, and retiring AD means clearing a list of named dependencies, not reaching a date.`,
  `${G}, "Limits: What still needs AD during hybrid"; LIMITS shared content (responses, design guidance); verification log "Could not verify"; Book 01, Chapter 04 — "Phase 5: steady state"; Book 02, Chapter 09 — "The per-group decision"; Book 03, Chapters 05, 06, 08 and 12; Book 05, Chapter 08; Book 06, Chapter 16; NIST SP 800-53 Rev. 5, IA-2.`);
};

  // 33 Checklist
  SL.checklist = () => {
  const s = content(SEC, "The checklist, stage by stage");
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
    ["Intune", "Device attributes written by provisioning at registration · Policy targeted by them · Computer-side GPO links disabled per population, rollback tested"],
    ["Arc", "Every in-scope server Arc-enabled · Tag taxonomy applied at connect · Baseline assigned and evaluated by Azure Policy"],
    ["Non-person", "Every service account and SP: owner, sponsor, reason, target · No never-expiring password · Two human owners per app · Agents: HR-mastered sponsor"],
  ], { fontSize: 10.5, limit: 6.5 });
  sources(s, "Sources: Guide, \"Checklist\"; track rows from Book 02, Ch 09; Book 05, Ch 08, 09; Book 17, Ch 05 (design guidance). Detail is in the stage and chapters each row names.");
  notes(s,
`The guide's checklist, one row per stage, plus a row for PIV and a row each for the Intune, Arc and non-person tracks. The stage rows are mostly the HR track. It's design guidance, and it's meant to be printed and ticked.

A few checks that are easy to miss. Stage 0: export site links, not just OU links, because a site-linked GPO hides from an OU-only search. Stage 1: take the HR-to-identity feed to the Steering Committee and name it in the HR 2.0 integration inventory, and start the privacy basis and PIA, which the full checklist carries too. Stage 2: populate employeeId before the first full sync, and remove every other write path to the access slots, in AD and in Entra ID. Stage 3: confirm the carriers are free and in the provisioning apps' target lists, and read the feeds by published date.

Stage 4: every access rule on codes, excluding disabled accounts, guests and agents, and no memberOf, given the preview's end date. Stage 5: decide restriction before the unit exists, and create units before the groups they hold. Stage 6: grant and block policies in pairs, report-only first, the emergency-access group excluded, device attributes written at registration, and one owning policy per setting.

Stage 7: the signed validation report, the dry run with writes off, seven days of sole-source proof, then the ticket path closed and provisioning retargeted per population. PIV: name the card management system as the binding writer, pilot high affinity before the tenant setting changes, require phishing-resistant strength for CBA users, and make the leaver remove the binding. Stage 8: drift scans scheduled, logs routed outside Entra ID from day one, findings closed at the source.

The track rows come from the per-track success criteria, design guidance. Intune: device attributes written by provisioning at registration, policy targeted by them, and computer-side GPO links disabled population by population with rollback tested, Book 05 Chapter 08. Arc: every in-scope server Arc-enabled, the tag taxonomy applied at connection time, and its baseline assigned and evaluated by Azure Policy, Book 05 Chapter 09. Non-person: every service account and service principal with an owner, sponsor, reason and target, no password that never expires, at least two human owners per app registration, Book 02 Chapter 09, and every agent identity sponsored by an HR-mastered federal employee, Book 17 Chapter 05.`,
  `${G}, "Checklist"; Stages 0–8 and "PIV and CAC certificates as attributes"; Book 02, Chapter 09; Book 05, Chapters 08–09; Book 17, Chapter 05; series framing (per-track success criteria, design guidance).`);
};

  // 34 Decisions
  SL.decisions = () => {
  const s = content(SEC, "Decisions, owners, and where to start");
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
    ["Each service account's conversion", "The application owner", "Non-person"],
    ["An AI agent's sponsor", "An HR-mastered federal employee", "Non-person"],
  ], { fontSize: 12, limit: 6.5 });
  panel(s, "Start", 9.85, 1.5, 2.9, null, HEX.teal, HEX.tealTint, "FROM THE CHECKLIST", "Start with these", [
    "Export the tree, read-only",
    "Name the HR feed to the Steering Committee",
    "Populate employeeId",
    "Remove other writers",
    "Route logs out now",
  ], 14);
  sources(s, "Sources: Guide, \"The path on one page,\" \"Checklist\"; Book 02, Ch 06 and Book 03, Ch 07 matrices; Book 17, Ch 05. Decisions and sequence are design guidance.");
  notes(s,
`So, the decisions, each with one decider from the two responsibility matrices, Book 02 Chapter 06 for the directory and Book 03 Chapter 07 for the data. All of it is the program's recommended model, design guidance.

Identity engineering decides where each OU function goes and each group's fate, the sync engine and sign-in method, the delegation model with restriction per unit defaulting to no, and each wave's go or no-go. The ICAM governance body decides the authority map, the enterprise person key and the contractor source. HR owns the code lists and the data architect owns the schema. The agency's risk governance sets the correlation threshold. Security decides who may write HR-mastered attributes. Each application's owner decides its access rule, and, per Book 02's matrix, each of its service accounts' conversion. Book 17 makes an AI agent's sponsor a federal employee mastered in HR, never an administrator. And the CISO owns the control requirements and the drift findings.

Five places to start, all from the checklist and none needing a new platform. Export the OU tree, its GPO links and its hand-made delegations, read-only. Name the HR-to-identity feed and take it to the HR 2.0 Steering Committee before the interconnection goes live. Populate employeeId before the first full sync. Remove every other writer to the access attributes. And route logs out of Entra ID from day one, because history starts the day export does.

In Active Directory, where an object sat decided what applied to it. In Entra ID, what the object says about itself decides. Make those statements true, keep them true, and the migration follows. The guide maps every step to the chapter that carries it. Thank you.`,
  `${G}, "The path on one page," "Checklist," Stages 0–8; Book 02, Chapter 06 — "The responsibility matrix"; Book 03, Chapter 07 — "The responsibility matrix."`);
};

  const sourceSlide = (title, src) => {
    const s = content("Backup", title);
    txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
    const need = 1.5 + src.reduce((a, t) => a + lines(t, 11.8, 12) * 12 / 72 * 1.2 + 0.07, 0);
    if (need > 6.6) console.warn(`  ! ${title} source list may overflow: needs ${need.toFixed(2)}`);
    if (process.env.FIT) console.log(`  sources ${title}: needs ${need.toFixed(2)}`);
  };

  const backup = () => {
    const s = content("Backup", "Backup");
    txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  };
  const finish = (OUT) => {
    console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
    modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
    console.log(`diagrams (${used.length}): ${used.join(", ")}`);
    return D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
  };
  return { D, HEX, txt, box, tag, bullets, G, content, titleSlide, divider, notes, endModule, section, table, panel, callout, sources, sourceSlide, backup, finish, SL };
};
