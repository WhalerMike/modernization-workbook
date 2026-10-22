// Book 05 — Devices & Endpoints: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Endpoints: onboarding and the GPO sunset:  Module 1 (Ch04–05), Module 2 (Ch07–08 + Appendix A).
//   Part 2 — Servers and the run state:                  Module 3 (Ch09),    Module 4 (Ch10).
// Build:  node presentations/b05-devices-technical/build.js presentations/b05-devices-technical/B05_Devices_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b05-devices/; the notes name the chapter.
// Narration: presentations/_build/narrate.py and captions.py, then build_narrated.ps1 (editor runs that).
const D = require("../_build/lib.js")({ book: "Book 05", title: "Devices & Endpoints — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B05_Devices_Technical.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (narration runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0, slideNo = 0;
const perModule = {};
let moduleName = "Orientation";
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; slideNo += 1;
  perModule[moduleName] = perModule[moduleName] || { slides: [], words: 0 };
  perModule[moduleName].slides.push(slideNo); perModule[moduleName].words += n;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.34, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const hH = rh(headers, true);
  const rowH = [hH, ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, bottom);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.75 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  warn(`${name} panel`, y + h);
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12.5) => {
  const n = steps.length, gap = 0.28, w = (12.15 - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = 0.6 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    txt(s, `${name} ${i + 1} text`, [
      { text: st.head, options: { bold: true, color: c, fontSize: pt + 2, fontFace: "Cambria", breakLine: true } },
      { text: st.body, options: { fontSize: pt } },
    ], { x: x + 0.1, y: y + 0.1, w: w - 0.2, h: h - 0.2, paraSpaceAfter: 3 });
    const need = y + 0.1 + (pt + 2) / 72 * 1.25 * lines(st.head, w - 0.1, pt + 2) + lines(st.body, w - 0.1, pt) * pt / 72 * 1.2 + 0.1;
    if (need > y + h + 0.02) console.warn(`  ! ${name} step ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

// A tinted box with a bold lead-in and a sentence, for a callout that doesn't span the slide.
const note = (s, name, x, y, w, h, color, tint, label, text, pt = 12.5) => {
  box(s, name, x, y, w, h, tint, color);
  txt(s, `${name} text`, [{ text: label, options: { bold: true, color } }, { text }],
    { x: x + 0.2, y: y + 0.08, w: w - 0.4, h: h - 0.16, fontSize: pt, valign: "middle" });
  const need = y + 0.1 + lines(label + text, w - 0.3, pt) * pt / 72 * 1.2;
  if (need > y + h + 0.02) console.warn(`  ! ${name} note may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  warn(`${name} note`, y + h);
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = D.titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — Endpoints: onboarding and the GPO sunset";
const P2 = "Part 2 — Servers and the run state";

// ================================================================== 1 Title
{
  const s = D.titleSlide("Orientation", "Devices & Endpoints: the technical deep dive", "Book 05 — from Group Policy to Intune and Azure Arc");
  txt(s, "Session map", [
    { text: "Part 1 — Endpoints: onboarding and the GPO sunset", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Intune-first onboarding and the paths   ·   Module 2  The GPO sunset and policy migration", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Servers and the run state", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Servers under Azure Arc   ·   Module 4  Operating and evidencing the fleet", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.2, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 05 of the Federal Modernization Workbook, Devices and Endpoints. It's for the architects and engineers who move a domain-joined fleet onto Intune, and its servers onto Azure Arc.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the endpoints. First, how a new device is governed from the moment it powers on, and the three paths an existing estate can take to the same end state. Then the Group Policy sunset: how every GPO is inventoried, classified, replaced and retired, and the policy library that replaces it. Part 2 is servers and the run state: bringing servers under Azure Arc with a day-one baseline, and then operating and evidencing the whole fleet once Intune is the authority.

The slides show tables, flows and decision matrices. The scripts and policy payloads live in the chapters and in Appendix A; they're marked there as illustrative and untested against a production tenant, and I'll point you to them rather than put them on screen.`,
  "Book 05, Chapters 04–10 and Appendix A; index.");
}

// ================================================================== 2 Why Group Policy can't come
{
  const s = D.content("Orientation", "Why Group Policy can't come to the cloud");
  tag(s, "Why");
  subhead(s, "Machinery head", "WHAT THE OU TREE DID IMPLICITLY, AND ITS NEAREST INTUNE EQUIVALENT", 0.6, 1.45, 7.8);
  table(s, "Machinery", 1.8, [2.05, 2.25, 3.55], ["Group Policy", "Nearest in Intune", "What is different"], [
    ["OU linking, inheritance", "Include and exclude groups", "Flat: no precedence by position"],
    ["WMI filters", "Assignment filters", "Device properties at enrollment and check-in; 200 per tenant"],
    ["Startup and logon scripts", "Platform scripts; Remediations", "Scripts run once, 30-minute timeout; Remediations every 24 hours"],
    ["Drive maps", "None built in", "Move users to Teams, SharePoint and OneDrive"],
    ["90-minute refresh", "Maintenance check-in", "About every 8 hours, plus change notifications"],
    ["RSoP and gpresult", "Per-setting status", "Reported after check-in; can lag the device"],
  ], { fontSize: 12 });
  panel(s, "Conflicts", 8.65, 1.45, 4.1, 3.8, HEX.red, HEX.redTint, "CONFLICTS CHANGE SHAPE", "Reported, not resolved", [
    "Two Intune configuration policies disagree: the conflict is reported and the setting may not apply",
    "Compliance policies: the most restrictive value applies",
    "GPO and MDM on one hybrid device: Group Policy wins by default; MDMWinsOverGP covers only the Policy CSP",
    "Outside the Policy CSP, such as Defender: a race",
  ], 12.5);
  callout(s, "Regenerate", 5.45, 1.0, "FaArrowsRotate", HEX.navy, "Regenerate, don't copy: ",
    "Microsoft says lifting and shifting GPOs isn't the preferred approach. Identify the mandatory settings and treat the gaps as blockers.");
  sources(s, "Sources: Microsoft Learn — Group Policy processing; cloud-native endpoints planning guide and tutorial; Intune policy conflicts; assignment filters; ControlPolicyConflict (MDMWinsOverGP). Book 05, Ch 01.");
  notes(s,
`Why this matters. For twenty years Group Policy did a great deal of governance without anyone writing it down. A computer sat in an OU, GPOs linked to that OU and its parents applied in a fixed order, and the closest container won. That one structure was the targeting model, the precedence model, the delegation model, a timing guarantee and an evidence source.

Microsoft's planning guidance says it plainly: Group Policy enforcement isn't possible on cloud-native endpoints, which are joined to Entra ID, not to a domain. Intune can deliver most of the settings, but each mechanism changes. Assignment to groups is flat. Assignment filters evaluate device properties at enrollment and check-in, up to two hundred per tenant. A platform script runs once and times out after thirty minutes; Remediations rerun every twenty-four hours by default. There's no built-in answer for mapped drives. Devices check in about every eight hours instead of every ninety minutes. And per-setting status is reported after check-in, so it can lag.

The conflict rules change too. When two Intune configuration policies set one setting differently, the conflict is reported and the setting may not apply at all. Compliance policies take the most restrictive value. And on a hybrid device that gets both a GPO and an MDM policy, Group Policy wins by default. MDM wins over GP reverses that only for the Policy CSP; for other CSPs, such as Defender, Microsoft warns of a race with no guaranteed winner.

So the program's rule is regenerate, not copy. Microsoft's own guidance is not to lift and shift: identify the mandatory settings, compare them with MDM, and treat the gaps as blockers.`,
  "Book 05, Chapter 01 — Why Group Policy Can't Come to the Cloud.");
}

// ================================================================== 3 Hybrid join trap + where data lives
{
  const s = D.content("Orientation", "The hybrid-join trap, and where each device fact lives");
  tag(s, "What");
  panel(s, "Flip", 0.6, 1.45, 5.0, 3.85, HEX.amber, HEX.amberTint, "CHAPTER 02", "A program that turns out to be a switch", [
    "Add computer OUs to sync scope; publish an SCP per forest, or push it by GPO",
    "Each device's join task reads the SCP and registers itself: no per-device gate, owner or position check",
    "Microsoft: Entra join for new or reset devices; hybrid join for existing ones, never the end state",
    "Moving to Entra join later needs a reset; hybrid devices still need line of sight to a DC",
  ], 12.5);
  subhead(s, "Authority head", "ONE AUTHORITATIVE ORIGIN PER FACT (CHAPTER 03)", 5.85, 1.45, 6.9);
  table(s, "Authority", 1.8, [3.0, 3.9], ["Claim", "Authoritative origin"], [
    ["Ownership, organizational assignment", "Procurement record (validated against the registry)"],
    ["Device identity and join type", "Entra ID device object"],
    ["Management authority", "Intune enrollment; Azure Arc for servers"],
    ["Compliance state", "Intune evaluation (Entra isCompliant is a copy)"],
    ["Threat and exposure", "Defender for Endpoint"],
  ], { x: 5.85, fontSize: 12.5 });
  callout(s, "Keys", 5.45, 1.0, "FaKey", HEX.teal, "Correlate on the right key: ",
    "Entra device ID across Microsoft records, serial number to procurement, Azure resource ID for Arc servers. Delete the Entra object last: it holds the BitLocker keys.");
  sources(s, "Sources: Microsoft Learn — configure and plan hybrid join; Entra join vs. hybrid join; device resource type; managedDevice; Autopilot registration; stale devices. Book 05, Ch 02–03.");
  notes(s,
`Two more ideas from the first part of the book frame everything in this session.

First, the hybrid-join trap. Converting a domain-joined fleet to hybrid join is close to a tenant-wide switch. Extend the sync scope to the computer OUs, publish a service connection point in each forest, or push the same two values by GPO, and every Windows device's Automatic Device Join task reads it and registers itself, retrying every hour. Nothing in that path checks ownership, organizational position or approval. Microsoft's guidance has two halves: Entra join is the default for new, refurbished or reset devices; hybrid join gives existing domain-joined devices a cloud identity with minimal impact, but it shouldn't be long term or the end goal. Converting a hybrid device to Entra join later needs a reset, and hybrid devices need periodic line of sight to a domain controller. Done ungoverned, the waypoint becomes the destination.

Second, where the truth lives. A modern laptop is described by a procurement record, an Autopilot registration, an Entra ID device object, an Intune record and a Defender machine; a server adds an Arc resource. The program decides, fact by fact, which one is authoritative. Procurement owns the business facts. The Entra object owns identity and join type. Intune owns management and evaluates compliance; Entra's is-compliant flag only reports it. Defender owns threat and exposure. Arc owns management for servers.

Correlate on the right key: the Entra device ID across Microsoft records, the serial number to procurement, and the Azure resource ID for Arc. And delete the Entra object last, because deleting it deletes the BitLocker recovery keys.`,
  "Book 05, Chapter 02 — The Hybrid Join Trap; Chapter 03 — Where Device and Server Data Lives.");
}

// ================================================================== 4 Module 1 divider
{
  moduleName = "Module 1";
  const s = divider(P1, "Module 1: Intune-first onboarding and the paths", "Part 1 — Endpoints: onboarding and the GPO sunset  ·  Chapters 04–05",
    ["The doctrine: five pillars, five phases, one carrier", "Windows provisioning, the day-zero baseline and the exceptions", "Governed, manual and retrofit: one runbook, three decision records"], 12);
  notes(s,
`Module 1: Intune-first onboarding and the paths. Migration takes a device that already exists and brings it under governance. Intune-first refuses to let an ungoverned device exist in the first place.

Chapter 04 covers devices bought after the modernization decision, net-new only; the program keeps the phrase Intune-first for that doctrine and doesn't use it for replacing Group Policy on the existing fleet. Chapter 05 then covers how existing workstations and servers reach the same end state, by one of three paths that share a single runbook.`,
  "Book 05, Chapter 04 — Intune-First Onboarding; Chapter 05 — The Governed, Manual and Retrofit Paths.");
}

// ================================================================== 5 Doctrine
{
  const s = D.content(P1, "Intune-first: five pillars and a five-phase process");
  tag(s, "What");
  flow(s, "Phases", 1.45, 1.6, [
    { head: "1 Procure", body: "Purchase order carries the organizational assignment, validated against the registry" },
    { head: "2 Pre-stage", body: "Vendor record (Autopilot, Apple Business Manager) carries the assignment" },
    { head: "3 Position", body: "Mapping keyed on serial number, committed and reviewed" },
    { head: "4 Provision", body: "Zero-touch enrollment; compliant, and Conditional Access grants" },
    { head: "5 Validate", body: "Validation record in the audit log; leaves quarantine", color: HEX.teal, tint: HEX.tealTint },
  ], 12);
  panel(s, "Pillars", 0.6, 3.2, 6.7, 3.3, HEX.navy, HEX.navyTint, "THE FIVE PILLARS (PROGRAM DOCTRINE)", null, [
    "No ungoverned device, ever: quarantine (/UNPOSITIONED) is the safety valve, not the steady state",
    "Procurement is the first governance step",
    "Zero-touch only: manual enrollment is a justified, finite, audited exception",
    "One management plane per asset: no greenfield Configuration Manager, Group Policy or hybrid join",
    "Quarantine on failure; never silently degrade",
  ], 12.5);
  panel(s, "Order", 7.45, 3.2, 5.3, 3.3, HEX.teal, HEX.tealTint, "WHERE THE ASSIGNMENT COMES FROM", "First source that can supply it", [
    "The procurement record",
    "The vendor or program carrier: group tag, Apple assignment",
    "User derivation, the fallback",
    "Unpositioned: an explicit marker, never an empty attribute",
    "Target: 14 days from purchase order to governed; 5 expedited",
  ], 12.5);
  sources(s, "Sources: program doctrine; Microsoft Learn — device identity overview; Autopilot registration overview. Book 05, Ch 04.");
  notes(s,
`The doctrine is simple to state. A net-new asset is governed from the moment it first powers on: by Intune for endpoints, and by Azure Arc for servers. There is no state where it joins on-premises Active Directory to wait for a migration, gets provisioned by Configuration Manager and co-managed later, runs without an organizational assignment, or reaches production without a compliance evaluation.

Five pillars carry it, and they're the program's doctrine, not Microsoft requirements. No ungoverned device, ever; quarantine is the safety valve. Procurement is the first governance step: the assignment is set when the purchase order is issued, the way HR feeds user provisioning. Zero-touch only. One management plane per asset, so no greenfield Configuration Manager, Group Policy or hybrid join. And quarantine on failure: an onboarding failure produces a quarantine entry and a ticket, never a degraded production device.

Every asset follows the same five phases. Procure, with the assignment validated against the organizational registry. Pre-stage, where the vendor record carries it. Position, where the governance pipeline commits a mapping keyed on the serial number. Note that phase 3 doesn't pre-stage an Entra object; classic Autopilot creates that automatically at registration, so phase 3 confirms the registration carries the right group tag. Provision, zero-touch. And validate.

The assignment comes from the first source that can supply it: procurement, then the vendor carrier, then derivation from the user, and finally an explicit unpositioned marker. A known nowhere is still a value a rule can match. The latency target is fourteen calendar days from purchase order, five for expedited orders.`,
  "Book 05, Chapter 04 — Intune-First Onboarding, \"The five pillars\" and \"The five-phase process.\"");
}

// ================================================================== 6 Autopilot vs device preparation
{
  const s = D.content(P1, "Windows in a GCC tenant: Autopilot or device preparation");
  tag(s, "What");
  table(s, "Compare", 1.45, [3.7, 1.75, 1.75], ["Requirement", "Device preparation", "Classic Autopilot"], [
    ["Device registration required", "No", "Yes"],
    ["Group tag on the registration", "Not applicable", "Yes"],
    ["Microsoft Entra hybrid join", "No", "Yes"],
    ["Pre-provisioned and self-deploying", "No", "Yes"],
    ["More than 10 apps or 10 scripts in setup", "No", "Yes"],
    ["Block the desktop until user config applies", "No", "Yes"],
    ["Uses the Enrollment Status Page", "No", "Yes"],
    ["GCC High and DoD", "Yes", "No"],
  ], { fontSize: 12.5 });
  panel(s, "Default", 7.95, 1.45, 4.8, 3.0, HEX.navy, HEX.navyTint, "PROGRAM DEFAULT IN GCC", "Classic, user-driven, Entra join", [
    "OEM or reseller registration with a group tag",
    "Why: the registration carries the procurement attribute before power-on",
    "Device preparation has no carrier: the attribute comes from the mapping table",
  ], 12.5);
  panel(s, "DP", 7.95, 4.55, 4.8, 1.95, HEX.teal, "FFFFFF", "DEVICE PREPARATION NEEDS", null, [
    "Windows 11 24H2, or 23H2 or 22H2 with KB5035942",
    "Entra automatic enrollment; first user allowed to join",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — compare Autopilot device preparation and Autopilot; device preparation FAQ, overview and requirements; Intune Government Service overview. Book 05, Ch 04.");
  notes(s,
`Microsoft now ships two Windows provisioning solutions. Windows Autopilot device preparation is a re-architecture with simpler configuration and near real-time reporting; classic Windows Autopilot remains more feature-rich. The rows on the left are the differences that matter. Device preparation needs no registration, so it has no group tag. It can't do hybrid join, pre-provisioning or self-deploying mode. It applies up to ten apps and ten scripts during setup, can't hold the desktop until user configuration lands, and doesn't use the Enrollment Status Page. But it's available in GCC High and DoD, where classic Autopilot isn't.

The workbook assumes a Microsoft 365 GCC tenant. Intune has no separate GCC instance: GCC uses the commercial Intune service, so both solutions are available. Only GCC High and DoD use the separate government instance.

The program's default for standard hardware in GCC is classic Windows Autopilot, user-driven, with Entra join, and OEM or reseller registration carrying a group tag. The reason is pillar 2. Classic Autopilot's registration carries the procurement attribute, the group tag and the purchase order ID, from the vendor to the Entra device object before the device is powered on. Device preparation adds devices to a group at enrollment, so the assignment has to come from the procurement mapping table afterward.

Use device preparation where its advantages matter, such as faster provisioning or a tenant that might later move to GCC High. It needs Windows 11 24H2, or 23H2 or 22H2 with KB5035942, and automatic enrollment. And the first user must be allowed to join devices: on that path, the user's own join permission brings the device in. Never use either with hybrid join for new devices.`,
  "Book 05, Chapter 04 — Intune-First Onboarding, \"Windows: Autopilot or Autopilot device preparation.\"");
}

// ================================================================== 7 Carrier
{
  const s = D.content(P1, "Carrying the purchase order to the device's configuration");
  tag(s, "How");
  flow(s, "Carrier", 1.45, 1.55, [
    { head: "Purchase order", body: "Organizational node code and serial number", color: HEX.slate, tint: HEX.grey },
    { head: "Registration", body: "OEM or reseller registers; group tag holds the node code" },
    { head: "Entra device", body: "Tag appears as an [OrderID] physical ID; PO as [PurchaseOrderId]" },
    { head: "Dynamic group", body: "Autopilot profile, compliance and configuration assigned here" },
  ], 12.5);
  panel(s, "Restrict", 0.6, 3.15, 3.95, 3.35, HEX.red, HEX.redTint, "ENROLLMENT RESTRICTIONS", "The enforcement point", [
    "Block personally owned Windows enrollment",
    "Autopilot is an approved corporate path; device preparation needs corporate identifiers or device association",
    "Unregistered device: an enrollment error, which is quarantine",
  ], 12.5);
  panel(s, "Naming", 4.7, 3.15, 3.95, 3.35, HEX.navy, HEX.navyTint, "NAMING", "The serial, not the org chart", [
    "15 characters or fewer; letters, numbers, hyphens; not all numbers",
    "Short asset-class prefix plus %SERIAL%",
    "Position goes in the group tag, so a reorganization changes no names",
  ], 12.5);
  panel(s, "ESP", 8.8, 3.15, 3.95, 3.35, HEX.teal, HEX.tealTint, "ENROLLMENT STATUS PAGE", "Block on what matters", [
    "Custom ESP that shows app and profile progress",
    "Selected blocking list: compliance config, Defender, BitLocker, checked agents",
    "No user bypass on that list; up to 51 ESP profiles",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — OEM registration; Autopilot for HoloLens 2 (OrderID); dynamic membership rules; enrollment restrictions; corporate identifiers; Autopilot profile; ESP setup. Book 05, Ch 04.");
  notes(s,
`Here's how the procurement decision reaches a device's configuration without anyone touching it.

The purchase order carries an organizational node code and the serial number. The OEM, reseller or distributor registers the hardware hash at purchase, which is also what makes it zero-touch. A supplier can register devices only after the organization's Global Administrator authorizes it; Microsoft calls out that this one feature needs that role, so plan the consent as a one-time, recorded approval per supplier. The group tag Intune stores on the registration appears on the Entra device as an Order ID physical ID, and the purchase order as a Purchase Order ID. A dynamic group rule matches on them, and the Autopilot profile, compliance and configuration are assigned to that group. The program's convention is that the tag holds the node identifier, never a free-text department name, so a reorganization changes the mapping table, not thousands of registrations.

Enrollment restrictions give the doctrine its enforcement point. Block personally owned Windows enrollment, and Intune authorizes corporate enrollment only through approved paths, of which Autopilot is one. Device preparation devices are blocked unless they're pre-identified with corporate identifiers or bound by device association. An unregistered device then fails with an enrollment restriction error, which is pillar 5 in practice.

Naming: fifteen characters or fewer, letters, numbers and hyphens, not all numbers. The program uses a short asset-class prefix plus the serial macro, because the serial is the procurement join key. Position goes in the tag.

And the Enrollment Status Page: use a custom one, block on a Selected list of security-critical items, and don't let users bypass it for those.`,
  "Book 05, Chapter 04 — Intune-First Onboarding, \"Registration and group tags,\" \"Enrollment restrictions,\" \"Naming,\" \"The Enrollment Status Page.\"");
}

// ================================================================== 8 Baseline + exceptions
{
  const s = D.content(P1, "The day-zero baseline, and the four exception paths");
  tag(s, "How");
  panel(s, "Baseline", 0.6, 1.45, 4.6, 5.05, HEX.navy, HEX.navyTint, "THE BASELINE", "Compliance decides access", [
    "Tenant setting: devices with no compliance policy are Not compliant",
    "BitLocker, Secure Boot, code integrity; firewall, TPM, antivirus; Defender current; minimum OS",
    "With Defender: at or under a machine risk score",
    "Configuration: Windows security baseline (25H2 is the latest) and the Defender baseline",
    "Then BitLocker escrow, Windows Hello for Business, firewall, Windows LAPS: no GPO to conflict with",
  ], 12.5);
  table(s, "Exceptions", 1.45, [0.55, 2.35, 4.45], ["Path", "Applies to", "Governed as"], [
    ["A", "Personal devices", "User enrollment or work profile: lower assurance beats ungoverned"],
    ["B", "Linux Intune can't manage", "Azure Arc with machine configuration"],
    ["C", "Windows Server 2019, 2022", "Arc without Entra sign-in, which needs Server 2025 with Desktop Experience"],
    ["D", "Windows that can't enroll", "Isolate first; Defender security settings management; then a named exclusion"],
  ], { x: 5.4, fontSize: 12.5 });
  note(s, "PathD", 5.4, 4.3, 7.35, 2.2, HEX.amber, HEX.amberTint, "Path D under compliant-device policies: ",
    "isolate the host; if its users must reach the cloud, use an exclusion group with an owner, a review within 90 days and the AO's risk acceptance, paired with a deviceId NotIn filter. MFA policies stay on.");
  sources(s, "Sources: Microsoft Learn — compliance policy settings; security baselines; CA grant and device filters; Defender security settings management; Arc Entra sign-in. Book 05, Ch 04.");
  notes(s,
`A net-new device should arrive at a known baseline before anyone uses it, in two halves.

Compliance decides access. First set the tenant-wide setting, mark devices with no compliance policy assigned as Not compliant, so an unassigned device can't pass Conditional Access by default; Microsoft recommends this whenever compliance feeds Conditional Access. The Windows policy typically requires BitLocker, Secure Boot and code integrity; firewall, TPM, antivirus and antispyware; current Defender intelligence with real-time protection; and a minimum OS. With Defender for Endpoint connected, add a machine risk score ceiling.

Configuration sets the device up. Start from the Windows security baseline, version 25H2 being the latest, and the Defender for Endpoint baseline. Existing baseline profiles don't move to a new version automatically, and different baselines can set the same setting differently, so review overlaps. Then BitLocker with escrow to Entra ID, Windows Hello for Business, firewall and Windows LAPS. Because these devices never had Group Policy, there's nothing to conflict with. That's the payoff.

Four exception paths cover what can't follow the main path, each with written justification, a compensating control and an audit entry. A: personal devices, governed at lower assurance. B: Linux that Intune can't manage, under Arc. C: Server 2019 and 2022, under Arc without Entra sign-in, which is Microsoft's support boundary. D: Windows that can't enroll, such as instrument PCs or disconnected enclaves.

Path D can't pass a compliant-device policy. So isolate it first. Manage its Defender settings through security settings management, which doesn't make it compliant. And if its users must reach a protected resource, record a named exclusion, paired with a policy that blocks that group from every device not on the approved list.`,
  "Book 05, Chapter 04 — Intune-First Onboarding, \"The compliance and configuration baseline\" and \"The four exception paths.\"");
}

// ================================================================== 9 Three paths
{
  const s = D.content(P1, "Three paths to one end state: governed, manual and retrofit");
  tag(s, "What");
  table(s, "Phases", 1.45, [1.3, 6.6], ["Phase", "What runs (observe first: nothing is restricted until measured)"], [
    ["1 Observe", "Read-only: NTLM audit, SPN inventory, SQL Server audit, Intune posture, GPO overlap"],
    ["2 Onboard", "Arc onboarding and server baseline; Intune automatic enrollment"],
    ["3 Harden", "SPN repair, NTLM restriction, Conditional Access baseline, after Phase 1 sign-off"],
    ["4 Watch", "Read-only: Conditional Access drift, compliance, cross-domain status"],
  ], { fontSize: 12.5 });
  table(s, "Choose", 3.85, [1.3, 6.6], ["Path", "When, and who holds the decision record"], [
    ["Manual", "Small estates and pilots; the operator owns change record, approval and rollback"],
    ["Governed", "Over a few hundred devices, or an AO must sign; an approval reference on every write"],
    ["Retrofit", "Modernized by hand, now needs governance; current state registered as desired"],
  ], { fontSize: 12.5 });
  panel(s, "Ladder", 8.75, 1.45, 4.0, 5.05, HEX.teal, HEX.tealTint, "THE ACTUATION LADDER", "A rung per operation", [
    "L0 Record · L1 Observe · L2 Advise",
    "L3 Gated: a human approves, the program applies through the provider API; the federal ceiling",
    "L4 Autonomous: refused",
    "Intune Multi Admin Approval is recorded as the L3 approval where it covers the workload",
  ], 12.5);
  sources(s, "Sources: program design (control plane, ladder, paths); Microsoft Learn — Conditional Access report-only; emergency access accounts; Intune Multi Admin Approval. Book 05, Ch 05.");
  notes(s,
`Chapter 05 is about how the existing estate gets there. The workbook's sources described three separate kits that repeated most of the same steps, because the destination is the same: servers in Arc, workstations in Intune, NTLM restricted after it's measured, clean service principal names, hardened SQL Server, and Conditional Access enforced. What differs is who holds the decision record.

The rule all three obey: the control plane governs, the data plane executes. The program holds desired state, observes, classifies drift and reconciles. Entra ID, Intune, Azure Policy and Active Directory do the runtime work. An adapter may call a management API; it never sits inline in a sign-in.

Every path runs four phases in order, and nothing is restricted until it has been measured. Observe is read-only. Onboard attaches the management planes. Harden closes the identity gaps, only after Phase 1 is signed off. Watch keeps the estate from drifting back. Budget at least two weeks of assessment, treat every first run as a dry run, deploy Conditional Access report-only first, and exclude the emergency access accounts before enforcing. Domain unjoin is a separate decision.

The manual path suits small estates and pilots; the operator owns the change record. The governed path is for larger estates, or where an authorizing official must sign: every state-changing step carries an approval reference. The retrofit adopts a hand-modernized estate without re-enrollment. Its risk is that registering the current state as desired blesses whatever drift is there.

Every governed operation declares a rung. The federal ceiling is L3, human approval, and autonomous L4 is refused. Where Intune Multi Admin Approval covers a workload, it is the L3 approval.`,
  "Book 05, Chapter 05 — The Governed, Manual and Retrofit Paths.");
}

// ================================================================== 10 Sharp edges
{
  const s = D.content(P1, "The runbook's sharp edges: precedence, NTLM and SPNs");
  tag(s, "How");
  subhead(s, "NTLM head", "RESTRICT NTLM IN STAGES, AFTER A 14 TO 30 DAY AUDIT AND OWNER SIGN-OFF", 0.6, 1.45, 7.6);
  const b = table(s, "NTLM", 1.8, [1.6, 2.9, 3.35], ["Stage", "LAN Manager level", "Restrict NTLM policies"], [
    ["1 Audit", "3 or higher on clients (NTLMv2 only)", "Audit in this domain and incoming: all accounts"],
    ["2 Refuse legacy", "5 on DCs: refuse LM and NTLMv1, still accept NTLMv2", "Deny for domain accounts, audited server exceptions"],
    ["3 Block", "5", "Deny all; remove exceptions as dependencies retire"],
  ], { fontSize: 12.5 });
  panel(s, "SPN", 0.6, b + 0.15, 7.85, 6.5 - b - 0.15, HEX.navy, HEX.navyTint, "SPNs BEFORE KERBEROS", null, [
    "Missing SPN: Kerberos isn't attempted and NTLM quietly succeeds; stage 3 turns that into an outage",
    "Duplicate SPN: KDC_ERR_PRINCIPAL_NOT_UNIQUE. Validate: klist purge, then auth_scheme in sys.dm_exec_connections",
  ], 12.5);
  panel(s, "Precedence", 8.65, 1.45, 4.1, 5.05, HEX.red, HEX.redTint, "GPO AND INTUNE ON ONE DEVICE", "Group Policy wins by default", [
    "MDMWinsOverGP reverses it only for the Policy CSP",
    "Defender CSP and others: a race with no guaranteed winner",
    "Windows Hello for Business: Intune settings don't apply until the GPO settings are cleared",
    "Conditional Access can't block on-premises NTLM",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — LMCompatibilityLevel; NTLM security policies; NTLM deprecation; Kerberos KDC errors; SSPI context; SQL Server SPNs; ControlPolicyConflict; WHfB policy conflicts. Book 05, Ch 05.");
  notes(s,
`Three places in the shared runbook cause most of the outages.

Precedence first. Moving the existing fleet into Intune usually goes through Group Policy triggered automatic enrollment of hybrid joined devices: no reimage, no user interaction. Confirm with dsregcmd that the device shows both Azure AD joined and domain joined. But while the GPOs are still linked, overlaps are dangerous. When the same policy is set in both, Group Policy takes precedence. MDM wins over GP reverses that only for the Policy CSP. For the Defender CSP and others, it's a race. And Windows Hello for Business, in the PassportForWork CSP, won't take the Intune settings until the Group Policy settings are cleared. So document every overlap before Intune enforces anything.

NTLM second. It's deprecated in all versions, and NTLMv1 is removed in Windows 11 24H2 and Server 2025. A common mistake is treating LAN Manager level 5 as block all NTLM. Level 5 makes domain controllers refuse LM and NTLMv1, but they still accept NTLMv2. Blocking is done by the Restrict NTLM policies. So stage it: audit, refuse the legacy variants, then deny all, removing exceptions as each dependency retires, and only after a fourteen to thirty day audit and application owner sign-off. Conditional Access can't help here: a Kerberos or NTLM exchange with a domain controller never reaches it.

SPNs third. A missing SPN is the silent case: Kerberos isn't attempted, and NTLM usually succeeds, until stage 3 makes it an outage. A duplicate is the loud case. Validate each repair by purging the ticket cache and checking that SQL Server reports Kerberos.`,
  "Book 05, Chapter 05 — The Governed, Manual and Retrofit Paths, \"The shared runbook.\"");
}

// ================================================================== 11 Module 2 divider
{
  moduleName = "Module 2";
  const s = divider(P1, "Module 2: The GPO sunset and policy migration", "Part 1 — Endpoints: onboarding and the GPO sunset  ·  Chapters 07–08, Appendix A",
    ["Seven steps from inventory to retirement", "Coexistence: who wins while both apply", "The working plan and the policy library"], 12);
  notes(s,
`Module 2: the GPO sunset and policy migration. This is the existing-fleet program. It replaces Group Policy Objects on endpoints that are already deployed, and it ends when those GPOs are formally retired.

The program measures it by GPOs retired with evidence, not by settings copied. Chapter 07 runs it as a program, Chapter 08 is what an endpoint engineer works from inside those rules, and Appendix A is the crosswalk: where a control lands in Intune, not what its value should be.`,
  "Book 05, Chapter 07 — The GPO Sunset Program; Chapter 08 — GPO to Intune Policy Migration; Appendix A.");
}

// ================================================================== 12 Pipeline + GPA
{
  const s = D.content(P1, "The sunset pipeline and Group Policy analytics");
  tag(s, "How");
  flow(s, "Pipe", 1.45, 1.55, [
    { head: "Inventory", body: "Every linked GPO and setting; Get-GPOReport XML" },
    { head: "Classify", body: "Required, obsolete, high-risk, redundant" },
    { head: "Crosswalk", body: "Closest Intune surface (App. A)" },
    { head: "Decide", body: "Migrate, replace, retire or dated exception" },
    { head: "Sequence", body: "Pilot cohort, then waves, by population" },
    { head: "Unlink", body: "Freeze, back up, disable links, watch", color: HEX.amber, tint: HEX.amberTint },
    { head: "Retire", body: "Archive after the retention window", color: HEX.teal, tint: HEX.tealTint },
  ], 11.5);
  panel(s, "GPA", 0.6, 3.15, 6.6, 3.35, HEX.navy, HEX.navyTint, "GROUP POLICY ANALYTICS", "Evidence an equivalent exists, never that it's needed", [
    "Per-setting CSP and OMA-URI; Ready, Not supported or Deprecated",
    "Each export under 4 MB with proper Unicode encoding; non-ADMX settings in English only",
    "Parses Policy, PassportForWork, BitLocker, Firewall and AppLocker CSPs and preferences",
    "Imports carry scope tags: admins without one can't see them",
  ], 12.5);
  panel(s, "Migrate", 7.35, 3.15, 5.4, 3.35, HEX.red, HEX.redTint, "THE MIGRATE BUTTON", "Best effort", [
    "Firewall rules and AppLocker can't migrate: build them in Endpoint security",
    "Conflicting values across GPOs stop the migration: OU precedence's hidden conflicts surface",
    "Microsoft publishes no \"percent with an equivalent\" figure: run it on your own exports",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Get-GPOReport; Group Policy analytics; create a settings catalog policy from imported GPOs; cloud-native endpoints tutorial. Book 05, Ch 01, Ch 07.");
  notes(s,
`Three efforts touch Intune and the program keeps them apart: Intune-first onboarding for new devices, this sunset for the existing fleet, and regenerate-not-copy, the philosophy for authoring the replacements. Microsoft's own guidance is that assessing every GPO and every setting is likely impractical; identify the mandatory settings and treat the gaps as blockers. The program turns that into seven steps, each with an exit condition.

Step 1: nothing is translated or retired until it's inventoried. Get-GPO-Report produces each GPO's links, security filtering, WMI filtering and settings as XML, which is the shape Group Policy analytics imports. Record the targeting too, because it's the part that doesn't survive the move. The program's triage script sorts each live GPO onto a target plane, Intune for workstations and Arc for servers, using two classifiers side by side, so disagreements surface instead of hiding behind one guess.

Group Policy analytics shows, per setting, the CSP and OMA-URI behind it, and sorts settings into ready for migration, not supported or deprecated. Plan around its limits: each export under four megabytes with proper Unicode, the five CSPs plus preferences it parses, non-ADMX settings read accurately only in English, and scope tags that hide imports from admins without them.

The Migrate step is, in Microsoft's words, best effort. Firewall rules and AppLocker can't move that way. And when several GPOs set one setting differently, migration stops and asks you to pick, which usefully surfaces the conflicts OU precedence used to hide. The program treats the readiness report as evidence that an equivalent exists, never that a setting is needed. And it quotes no percentage: Microsoft publishes none.`,
  "Book 05, Chapter 07 — The GPO Sunset Program, \"Step 1: Inventory and parse\"; Chapter 01, \"Group Policy analytics measures the gap.\"");
}

// ================================================================== 13 Classify and dispose
{
  const s = D.content(P1, "Classify, then dispose: tags, questions, landing zones");
  tag(s, "How");
  panel(s, "Questions", 0.6, 1.45, 4.6, 5.05, HEX.amber, HEX.amberTint, "A REQUIRED SETTING: FIRST YES DECIDES", "Four questions, in order", [
    "Still required in the target model? If not, retire",
    "Native Intune equivalent? Migrate",
    "Cloud-native pattern removes the need? Replace: Known Folder Move, Universal Print, update rings",
    "Can a script enforce and prove it? A Remediation, reviewed later",
    "None: a dated exception with an owner, reason and review date; its GPO stays linked for that population only",
  ], 12.5);
  table(s, "Zones", 1.45, [1.9, 5.45], ["Landing zone", "What to know"], [
    ["Settings catalog", "Most ADMX and security settings; the old Administrative Templates profile is read-only since 2412"],
    ["Imported ADMX", "Public preview: at most 20 files of 1 MB, en-us only, dependencies first"],
    ["Endpoint security", "Antivirus, encryption, firewall, ASR, account protection, EDR; one method per setting"],
    ["Remediations, scripts", "Remediations need Windows Enterprise E3 or E5, A3 or A5, or VDA; up to 200 packages"],
  ], { x: 5.4, fontSize: 12.5 });
  note(s, "Tags", 5.4, 4.15, 7.35, 2.35, HEX.navy, HEX.navyTint, "First, one tag per setting: ",
    "required (translate), obsolete or redundant (retire), high-risk (retire or replace with a stronger control). Then record configuration, compliance or both, and the evidence that proves it.");
  sources(s, "Sources: Microsoft Learn — settings catalog; ADMX in the settings catalog; custom ADMX import (public preview); endpoint security policies; Remediations; PowerShell scripts. Book 05, Ch 07.");
  notes(s,
`Step 2 gives every setting in the inventory one tag. Required: still needed, so it's translated to a modern control. Obsolete: an old Windows version, a retired product, a network assumption that no longer holds, so it's retired. High-risk: it weakens security, so it's retired or replaced with something stronger. Redundant: already enforced by another control or a Windows default, so it's retired.

A required setting then gets a disposition from four questions, asked in order, where the first yes decides. Is it still required in the target operating model? Group Policy accumulated settings that existed only because it could set them. Does a native Intune equivalent exist? Most do. Does a cloud-native pattern remove the need? Folder redirection becomes OneDrive Known Folder Move, mapped printers become Universal Print, WSUS targeting becomes update rings. And can a script enforce and prove it? Then it's a Remediation, reviewed later for a native replacement. A setting that fails all four is a dated exception, and its GPO stays linked for that population and no other. For each one, also record whether it's configuration, compliance, or both, and what evidence proves it.

The questions send settings to four landing zones. The settings catalog holds most ADMX and security settings; the old Administrative Templates profile has been read-only since the 2412 release. Imported ADMX is for third-party templates: public preview, twenty files of a megabyte or less, en-us only. Endpoint security owns antivirus, encryption, firewall, attack surface reduction, account protection and EDR, and Microsoft's practice is one method per setting. Remediations need Enterprise, Education or VDA licensing, up to two hundred packages per tenant.`,
  "Book 05, Chapter 07 — The GPO Sunset Program, \"Step 2: Classify each setting\" and \"The landing zones.\"");
}

// ================================================================== 14 Coexistence
{
  const s = D.content(P1, "Coexistence: who wins while GPOs and Intune both apply");
  tag(s, "What");
  table(s, "Rules", 1.45, [2.6, 3.45, 2.3], ["Conflict", "What happens", "Program rule"], [
    ["Compliance vs. compliance", "Most restrictive applies", "Verify the intended value"],
    ["Compliance vs. configuration", "Compliance setting takes precedence", "Align thresholds with values"],
    ["Configuration vs. configuration", "Equal priority; reported; may not apply", "One owning policy per setting"],
    ["GPO vs. MDM, Policy CSP", "GPO wins unless MDMWinsOverGP is 1", "Set it in transition; remove the GPO copy"],
    ["GPO vs. MDM, other CSPs", "A race; WHfB must never be in both", "Unlink first or exclude"],
    ["GPO vs. MDM, Windows Update", "IgnoreWindowsUpdateGroupPolicies, 24H2 with KB5101684+", "Older builds: unlink the GPO"],
    ["Configuration Manager vs. Intune", "The slider sets one authority per workload", "No Intune policy on a ConfigMgr workload"],
  ], { fontSize: 12 });
  panel(s, "Unlink", 9.15, 1.45, 3.6, 5.05, HEX.navy, HEX.navyTint, "FREEZE, THEN UNLINK", "Gated, reversible", [
    "Freeze: new requirements go to Intune",
    "Backup-GPO",
    "Prove: the owning Intune policy reports success",
    "Set-GPLink -LinkEnabled No: the link, not the GPO",
    "Preferences stay on the device unless set to remove",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Intune policy conflicts; endpoint security conflicts; ControlPolicyConflict; Policy CSP Update; co-management workloads; Backup-GPO; Set-GPLink; GP preferences. Book 05, Ch 07.");
  notes(s,
`While a population has both GPOs and Intune policies, three conflict systems are in play, and the program plans against each one.

Inside Intune: two compliance policies take the most restrictive value; a compliance setting beats the same setting in a configuration policy; and between configuration policies of any type, settings catalog, endpoint security, security baselines, there is no precedence. The conflict is reported and the setting might not apply until it's fixed. The chapter states two corrections to earlier program material: profiles don't resolve by last write wins, and endpoint security doesn't automatically beat configuration profiles. So each setting has exactly one owning policy.

Between Group Policy and MDM: in the Policy CSP, Group Policy keeps winning unless MDM wins over GP is set to one; set it where a population is in transition and remove the GPO copy as Intune takes the setting. Outside the Policy CSP it's a race, and Windows Hello for Business shouldn't be configured through both at all. For Windows Update, Microsoft recommends Ignore Windows Update Group Policies instead, on Windows 11 24H2 with KB5101684 and later.

Between Configuration Manager and Intune, the co-management slider sets one authority per workload. Note two traps: switching device configuration also moves resource access and Endpoint Protection; and with Pilot Intune selected, Intune deploys policies but doesn't remove them on unassignment.

Disabling a link is the moment production behavior changes, so it's gated. Freeze the GPO, back it up, prove the replacement reports success, then disable the link, not the GPO, with one reversible command. And remember that preference items stay on the device unless configured to remove themselves.`,
  "Book 05, Chapter 07 — The GPO Sunset Program, \"One authority per workload,\" \"Coexistence: who wins,\" \"Freezing and unlinking GPOs.\"");
}

// ================================================================== 15 Seven phases
{
  const s = D.content(P1, "Seven phases at working level: durations, gates and waves");
  tag(s, "How");
  table(s, "Plan", 1.45, [2.35, 1.3, 4.6, 3.9], ["Phase", "Duration", "Exit gate", "Rollback while open"], [
    ["1 Inventory, classify", "3–5 weeks", "A decision record per setting; a gpresult baseline per tier", "None needed"],
    ["2 Coexistence plan", "2–3 weeks", "Pilot enrolled and syncing; one authority per workload", "Slider back to ConfigMgr"],
    ["3 Baseline authoring", "3–4 weeks", "Built unassigned; no setting in two policies; reviewed", "Delete unassigned policies"],
    ["4 Pilot (about 5%)", "4–6 weeks", "No unexplained Conflict or Error; GPOs still linked", "Remove pilot assignments"],
    ["5 Workload cutover", "8–12 weeks", "Four waves, each watched 72 hours", "Slider back; re-enable links"],
    ["6 Verify, clean up", "About 2 weeks", "No migrated device processes an in-scope GPO", "Re-enable the link"],
    ["7 Retirement", "2 weeks + 90 days", "GPOs archived and deleted; only dated exceptions", "Restore and re-link"],
  ], { fontSize: 12 });
  callout(s, "Waves", 5.3, 1.2, "FaRoute", HEX.amber, "Wave order: ",
    "compliance, then Endpoint Protection, then device configuration, then Windows Update. Device configuration carries Endpoint Protection and resource access, so it can't go first. Pilot Intune doesn't clean up on unassignment.");
  sources(s, "Sources: program reference plan; Microsoft Learn — Group Policy analytics; switch co-management workloads; co-management workloads; noncompliance actions. Book 05, Ch 08.");
  notes(s,
`Chapter 08 breaks the seven phases into working tasks. The durations come from the program's reference plan for a large fleet with an existing Configuration Manager estate; a fleet without one skips most of Phase 2.

Phase 1, three to five weeks: export and import every GPO, find the GPO-on-GPO conflicts that OU precedence hid, classify every setting, and capture an effective-policy baseline per device tier with gpresult on a sample. Phase 2, two to three weeks: enable co-management for a pilot collection, set the first workloads to Pilot Intune, and decide MDM wins over GP per population. The matching Intune policy must already exist, because a co-managed device syncs MDM policy as soon as a workload moves. Phase 3, three to four weeks, can overlap it: build every policy unassigned, with attack surface reduction and controlled folder access in audit mode, and peer review that every setting traces to a decision record and no setting appears twice.

Phase 4 is the pilot, about five percent of the fleet, representative across tiers, regions and departments, with a seven-day grace period instead of one. GPOs stay linked: the pilot measures conflicts by comparing gpresult with Intune's per-setting status. Phase 5 is four waves of three weeks each, watched for seventy-two hours. Endpoint Protection goes before device configuration, because moving device configuration drags Endpoint Protection and resource access with it. Phases 6 and 7 disable the remaining links, clear tattooed preferences, then disable each GPO, keep it ninety days, back it up, archive and delete.

On these estimates the program reaches Phase 7 in roughly thirty-four weeks, with the last deletions about three months later. Remember that rolling back a pilot means reassigning a policy with the old value, not just removing the assignment.`,
  "Book 05, Chapter 08 — GPO to Intune Policy Migration, \"The seven phases at working level.\"");
}

// ================================================================== 16 Policy architecture + compliance
{
  const s = D.content(P1, "The policy library: attribute targeting and the compliance set");
  tag(s, "What");
  subhead(s, "Attr head", "DEVICE ATTRIBUTES DRIVE DYNAMIC GROUPS", 0.6, 1.45, 5.2);
  const b = table(s, "Attributes", 1.8, [2.25, 2.95], ["Device attribute", "Meaning and values"], [
    ["extensionAttribute1", "Region: EAST, WEST, CENTRAL"],
    ["extensionAttribute3", "Department or function"],
    ["extensionAttribute11", "Security tier: Tier0, Tier1, Tier2"],
    ["extensionAttribute12", "Role: PAW, Kiosk, SharedDevice"],
    ["extensionAttribute13", "Environment: Production, Staging, Dev"],
  ], { fontSize: 12.5 });
  box(s, "Filters", 0.6, b + 0.15, 5.2, 6.5 - b - 0.15, HEX.amberTint);
  txt(s, "Filters text", [
    { text: "Filters can't read extension attributes: ", options: { bold: true, color: HEX.amber } },
    { text: "attribute targeting goes in the group rule; filters handle join type, ownership, model and OS. Values are written to the device object through Graph." },
  ], { x: 0.8, y: b + 0.22, w: 4.85, h: 6.5 - b - 0.3, fontSize: 12.5, valign: "middle" });
  subhead(s, "CP head", "COMPLIANCE POLICIES (WINDOWS 11 FLOOR)", 6.05, 1.45, 6.7);
  table(s, "Compliance", 1.8, [1.75, 1.25, 1.25, 1.25, 1.2], ["Setting", "CP-001 base", "CP-002 Tier 0", "CP-003 Tier 2", "CP-005 kiosk"], [
    ["Minimum OS", "24H2", "25H2", "24H2", "24H2"],
    ["BitLocker", "Require", "Require", "Require", "—"],
    ["Defender risk", "—", "Clear", "—", "—"],
    ["Password length", "14", "14", "12", "—"],
    ["Mark noncompliant", "1 day", "0 days", "3 days", "2 days"],
    ["Retire list", "30 days", "7 days", "30 days", "No"],
  ], { x: 6.05, fontSize: 12.5 });
  txt(s, "CP004", [
    { text: "CP-004 is gone: ", options: { bold: true, color: HEX.navy } },
    { text: "Windows Server doesn't enroll in Intune, so the server baseline moves to Chapter 09." },
  ], { x: 6.05, y: 5.75, w: 6.7, h: 0.7, fontSize: 12.5 });
  sources(s, "Sources: Microsoft Learn — dynamic membership rules; assignment filter properties; noncompliance actions; Windows compliance settings; Windows 11 release information; supported platforms. Book 05, Ch 08.");
  notes(s,
`The policy library has five types, each with an ID prefix: compliance policies, CP; settings catalog profiles, SC; endpoint security, ES; app protection, AP; and app configuration, AC. Every one is assigned to dynamic device groups built from attributes, which replaces OU-linked scoping.

Entra dynamic rules for devices can use extension attributes one through fifteen, but the values have to be written to the device object through Microsoft Graph first; they're the device's own set, not the user attributes. The program uses one numbering: one for region, three for department, eleven for security tier, twelve for device role and thirteen for environment, with one fixed spelling per value. Assignments then add exclude groups for break-glass and staging, and assignment filters. The correction that matters: filters can't read extension attributes. A filter on attribute eleven doesn't evaluate. Attribute targeting belongs in the group rule; filters work on Intune properties such as join type, ownership, model and OS edition.

Three Microsoft facts shape every compliance template. Noncompliance actions are scheduled in days, zero to three hundred sixty-five, not hours. Windows supports only three actions: mark noncompliant, email the user, and add to the retire list, which retires nothing by itself. There is no block action; blocking is what Conditional Access does with a noncompliant device. And BitLocker, Secure Boot and code integrity are measured at boot, so a newly encrypted device needs a restart.

The set: a workstation baseline with a 24H2 floor; a strict Tier 0 policy with a 25H2 floor, a Clear risk score and no grace period; a Tier 2 policy; and a kiosk policy. The server baseline, CP-004, can't be built in Intune, so it moves to Chapter 09.`,
  "Book 05, Chapter 08 — GPO to Intune Policy Migration, \"Policy architecture\" and \"Compliance policies.\"");
}

// ================================================================== 17 Endpoint security + crosswalk traps
{
  const s = D.content(P1, "Endpoint security settings, and the crosswalk traps");
  tag(s, "What");
  table(s, "ES", 1.45, [1.85, 5.95], ["Policy", "Program choices"], [
    ["ES-001 antivirus", "Cloud block High; extended timeout 50 s; safe samples only; tamper protection needs Defender onboarding"],
    ["ES-002 BitLocker", "XTS-AES 256; silent TPM-only for standard and kiosk; TPM plus PIN for Tier 0, in a separate policy"],
    ["ES-003 firewall", "Inbound block on all profiles; outbound block on public; rules built by hand"],
    ["ES-004 EDR", "Onboarding package from the connector; AIR, live response, web filtering set in the Defender portal"],
    ["ES-005 ASR", "Every rule in audit for 30 days, then block; PSExec and WMI rule not on ConfigMgr devices"],
    ["ES-006 accounts", "Credential Guard (Enterprise or Education); WHfB; Windows LAPS: 24 characters, 30 days, 8-hour reset"],
  ], { fontSize: 12 });
  panel(s, "Traps", 8.6, 1.45, 4.15, 5.05, HEX.red, HEX.redTint, "APPENDIX A: EASY TO GET WRONG", null, [
    "Lockout is DeviceLock AccountLockoutPolicy, not MaxDevicePasswordFailedAttempts",
    "Audit Logon sits under AccountLogonLogoff_",
    "SC-002, 006, 007, 008 retired: their settings live in ES policies",
    "A logon banner breaks Autopilot pre-provisioning",
    "Known Folder Move won't move share-redirected folders",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Defender CSP; BitLocker with Intune; ASR rules reference; Credential Guard; Windows LAPS; DeviceLock and Audit CSPs; LocalPoliciesSecurityOptions; Known Folder Move. Book 05, Ch 08; App. A.");
  notes(s,
`Endpoint security policies aren't a higher-priority source; they have the same standing as configuration profiles. In the program's library they own every Defender, BitLocker, firewall, account protection and LAPS setting, and the four settings catalog IDs that duplicated them, SC-002, 006, 007 and 008, are retired and never reused.

ES-001, antivirus: cloud block level High, a fifty-second extended timeout, which is the maximum, and safe samples sent automatically. Sending all samples can upload documents with organizational data, so that's the data owner's decision. Tamper protection needs Defender onboarding and isn't supported this way on co-managed devices until Endpoint Protection moves. ES-002, BitLocker: silent encryption and a TPM PIN can't apply to the same device, so standard and kiosk devices encrypt silently with TPM only, and Tier 0 uses TPM plus PIN in a separate policy. ES-003, firewall: on an Entra-joined device the domain profile doesn't apply, so management rules need a private-profile equivalent, and Group Policy analytics can't migrate firewall rules. ES-004, EDR: automated investigation, live response and web content filtering are set in the Defender portal, not here. ES-005: attack surface reduction rules in audit for thirty days, then block; the PSExec and WMI rule stays off Configuration Manager devices, because its client depends on WMI. ES-006: Credential Guard, which needs Enterprise or Education, Hello for Business, and Windows LAPS with an eight-hour post-authentication reset.

Appendix A flags the traps. Account lockout maps to the DeviceLock lockout policy. Audit Logon sits under the logon-logoff path. A logon message breaks Autopilot pre-provisioning. And Known Folder Move won't carry folders redirected to a share: copy them first with Migration Manager.`,
  "Book 05, Chapter 08 — GPO to Intune Policy Migration, \"Endpoint security policies\"; Appendix A — GPO to Intune Crosswalk.");
}

// ================================================================== 18 Module 3 divider
{
  moduleName = "Module 3";
  const s = divider(P2, "Module 3: Servers under Azure Arc", "Part 2 — Servers and the run state  ·  Chapter 09",
    ["What Arc changes, and preparing roles, network and tags", "Onboarding a wave and the day-one baseline", "Extended Security Updates, Entra ID sign-in and rollback"], 10);
  notes(s,
`Module 3: servers under Azure Arc. Group Policy reached servers through OU placement, the same way it reached workstations. Intune doesn't take over that job, because Intune's supported platforms don't include Windows Server.

The cloud equivalent is Azure Arc. A server outside Azure runs the Connected Machine agent and appears as an Azure resource, managed the way native virtual machines are. Arc gives the server an address in the control plane; everything that makes it governed is what you then attach to that address.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc.");
}

// ================================================================== 19 What Arc changes
{
  const s = D.content(P2, "What Arc changes, and what it doesn't");
  tag(s, "What");
  table(s, "Changes", 1.45, [3.75, 3.45], ["Arc changes", "Arc doesn't change"], [
    ["An Azure resource ID in a resource group", "Domain membership: onboarding doesn't unjoin"],
    ["Azure RBAC, tags and Azure Policy apply", "Authentication, unless you enable Entra sign-in"],
    ["A system-assigned managed identity in Entra ID", "The workload: an Arc outage impairs management only"],
    ["Extensions from Azure, with full privileges", "Where the server runs: it isn't a migration"],
  ], { fontSize: 12.5 });
  panel(s, "State", 7.95, 1.45, 4.8, 5.05, HEX.teal, HEX.tealTint, "CONNECTION STATE IS EVIDENCE", "Azure is the agent's source of truth", [
    "Heartbeat every 5 minutes; Disconnected within 15 to 30",
    "Disconnected 45 days: can become Expired, unmanageable until reconnected",
    "Managed identity credential valid up to 90 days, renewed every 45",
    "Guest assignments kept locally 14 days, then deleted",
  ], 12.5);
  note(s, "Cost", 0.6, 4.15, 7.2, 2.35, HEX.navy, HEX.navyTint, "Plan cost by license, then attest: ",
    "with Software Assurance, a subscription or pay-as-you-go, Windows Server Management enabled by Arc gives Update Manager, Change Tracking and machine configuration for Server 2012 and later at no extra cost. It isn't automatic: attest each server's license, and record who attested on what evidence.");
  sources(s, "Sources: Microsoft Learn — Azure Arc-enabled servers overview; Connected Machine agent; Arc security overview; managed identity; Windows Server Management enabled by Azure Arc. Book 05, Ch 09.");
  notes(s,
`Arc is the management plane. It isn't the identity plane, and onboarding doesn't change how the server authenticates users or whether it's joined to a domain. Keep the two separate in every plan.

What changes: the server gets an Azure resource ID in a resource group alongside other Azure resources; Azure RBAC, tags and Azure Policy apply to it; it gets a system-assigned managed identity in Entra ID; and extensions can be installed from Azure, running with full privileges on the server. What doesn't: its domain membership; how users and services authenticate to it, unless you enable Entra ID sign-in; the workload, since an Arc outage impairs management only; and where it runs. Arc isn't a migration to Azure.

Two properties shape the operating model. Azure is the source of truth for the agent: the only way to tell it to do something is to act on the server's Azure representation, so RBAC and policy are evaluated before any change reaches the server. And connection state is evidence. The agent sends a heartbeat every five minutes. A server that stops shows Disconnected within fifteen to thirty minutes, and one disconnected for forty-five days can become Expired, unmanageable until an administrator disconnects and reconnects it. If a server disconnects, its guest assignments are kept for fourteen days and then deleted, so a long outage silently removes its baseline evaluation.

Plan cost by service, not by connection. If the Windows Server licenses carry Software Assurance, or are subscription or pay-as-you-go, Windows Server Management enabled by Arc provides Update Manager, Change Tracking and Inventory and machine configuration at no extra cost. But it isn't automatic: you attest each server's licensing, and that becomes a recorded step in the runbook.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc, \"What Arc changes and what it doesn't\" and \"Plan cost by service.\"");
}

// ================================================================== 20 Before you onboard
{
  const s = D.content(P2, "Before you onboard: roles, network, tags and images");
  tag(s, "How");
  const b = table(s, "Roles", 1.45, [3.4, 2.6, 6.15], ["Role", "Holder", "What it allows"], [
    ["Azure Connected Machine Onboarding", "Onboarding principal only", "Read and create Arc resources; can't delete servers or manage extensions"],
    ["Azure Connected Machine Resource Administrator", "Server operations team", "Read, modify, re-onboard and delete machines, extensions, licenses"],
    ["VM Administrator Login / VM User Login", "People who sign in", "Entra ID sign-in; Owner and Contributor don't confer it"],
  ], { fontSize: 12.5 });
  panel(s, "Network", 0.6, b + 0.15, 4.0, 6.5 - b - 0.15, HEX.navy, HEX.navyTint, "NETWORK", null, [
    "Outbound TCP 443 only; no inbound rule",
    "Six service tags, adding AzureFrontDoor.Frontend as of April 2026",
    "Private link scope, not a proxy, keeps traffic off public networks",
  ], 12);
  panel(s, "Tags", 4.75, b + 0.15, 4.0, 6.5 - b - 0.15, HEX.teal, HEX.tealTint, "TAGS AT CONNECT TIME", null, [
    "Environment, Workload, Criticality, Owner, CostCenter, PatchGroup, ArcOnboardedDate",
    "Plain text: nothing sensitive",
    "SQL opt-out: ArcSQLServerExtensionDeployment = Disabled",
  ], 12);
  panel(s, "Images", 8.9, b + 0.15, 3.85, 6.5 - b - 0.15, HEX.red, HEX.redTint, "ROLES AND IMAGES", null, [
    "Any Contributor on the Arc resource is an indirect server admin",
    "Install the agent in a golden image; never connect the image",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Arc RBAC roles; CAF identity and access for Arc servers; Arc network requirements; azcmagent check; Arc onboarding security; deployment options; agent overview. Book 05, Ch 09.");
  notes(s,
`Before the first server connects, settle roles, network, tags and images.

Use the narrowest built-in roles. Azure Connected Machine Onboarding goes to the onboarding service principal only: it can read and create Arc server resources, but not delete them or manage extensions. Azure Connected Machine Resource Administrator is for the server operations team. And Virtual Machine Administrator Login or User Login are for people who sign in with Entra ID; Owner and Contributor don't confer sign-in. Then remember what extensions can do. They run arbitrary scripts with full privileges, so Microsoft says to treat any Contributor on the Arc resource as an indirect administrator of the server, and the Cloud Adoption Framework warns that Contributor, Owner and the resource administrator role can effectively delegate root access. Scope those roles to the resource groups a team owns, and hold them through Privileged Identity Management.

Network: the agent communicates outbound over TCP 443, with no inbound rule. Allow the Azure Active Directory, Traffic Manager, Resource Manager, Arc Infrastructure and Storage service tags and, as of April 2026, Azure Front Door Frontend. A proxy doesn't add security, because the traffic is already encrypted; a private link scope keeps it off public networks. Run azcmagent check from a representative server first, adding the cloud parameter for Azure Government.

Tags: one taxonomy at connection time, which drives policy scope, Update Manager's dynamic scoping and cost reporting. They're plain text, so nothing sensitive. A server with SQL Server installed connects its instances to Arc automatically; opt out with a tag when you connect.

And images: install the agent in a golden image, but never connect the image, or every clone shares one resource ID.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc, \"Before you onboard.\"");
}

// ================================================================== 21 Onboarding wave
{
  const s = D.content(P2, "Onboarding a wave with a least-privileged principal");
  tag(s, "How");
  flow(s, "Wave", 1.45, 1.75, [
    { head: "Prepare", body: "Resource group, tags, network check, certificate-based principal", color: HEX.amber, tint: HEX.amberTint },
    { head: "Connect", body: "azcmagent connect with tags, through the existing automation tool" },
    { head: "Attest, baseline", body: "License attestation; machine configuration, Update Manager, Defender" },
    { head: "Verify", body: "Connected, baseline evaluated, Defender onboarded, ESU coverage" },
    { head: "Close", body: "Delete certificate files; rotate or remove the credential; disable the GPO", color: HEX.teal, tint: HEX.tealTint },
  ], 12);
  panel(s, "Cred", 0.6, 3.35, 6.6, 3.15, HEX.red, HEX.redTint, "THE ONBOARDING CREDENTIAL", "Short-lived, small scope", [
    "Onboarding role on the target resource group, not the subscription",
    "A certificate, not a secret: a certificate can be controlled with Conditional Access",
    "Needed only while azcmagent connect runs; a stolen one connects outside servers",
    "Never a plain-text secret in a startup script: SYSVOL is readable by every domain user",
  ], 12.5);
  panel(s, "Lock", 7.35, 3.35, 5.4, 3.15, HEX.navy, HEX.navyTint, "LOCAL LOCKDOWN", "Set on the server; Azure can't change it", [
    "Extension allowlist per server class",
    "Disable remote connections or machine configuration for DCs and strict-change servers",
    "Resource name is the host name: settle conflicts before the wave",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Arc deployment options; connect at scale with a service principal; Arc onboarding security; Group Policy onboarding; azcmagent connect and config; extension security. Book 05, Ch 09.");
  notes(s,
`Onboarding runs in waves. Each wave creates its credential, connects a defined set of servers, attaches the baseline on the same change, verifies, and closes by removing what onboarding needed.

Microsoft supports many methods: a portal-generated script, PowerShell, a service principal with the installation script, Ansible, Arc-enabled VMware vSphere, the multicloud connector for AWS, Windows Admin Center, Configuration Manager, and Group Policy. The program's recommendation is a dedicated service principal that authenticates with a certificate, deployed through the automation tool the server team already runs. The interactive script is for a handful of servers or a pilot.

The service principal exists only to connect machines, and the credential is needed only while azcmagent connect runs; if it expires afterward, the server stays connected. So keep its lifetime short and its scope small: the onboarding role, on the target resource group. Microsoft recommends a certificate over a secret, because a certificate credential can be controlled with Conditional Access. If you must use a secret, Microsoft's examples create one valid for a year; set it shorter and rotate it after each wave. A stolen onboarding credential lets an attacker connect servers outside your organization into your subscription, and private endpoints close that path.

Protect the credential in deployment. A secret in a hand-built startup script is readable by every domain user through SYSVOL. Microsoft's Group Policy method encrypts its configuration file so only computer accounts can decrypt it, which still means any computer account, so scope the GPO, rotate after the wave, and disable the GPO once servers connect.

For sensitive servers, set local controls that Azure can't override: an extension allowlist, and disabling remote connections.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc, \"Onboarding.\"");
}

// ================================================================== 22 Day-one baseline
{
  const s = D.content(P2, "The day-one baseline: configuration, patching and protection");
  tag(s, "How");
  panel(s, "MC", 0.6, 1.45, 3.95, 3.85, HEX.navy, HEX.navyTint, "GOVERN", "Machine configuration", [
    "Desired State Configuration inside the OS, scoped by Azure resource scope, not OU",
    "Built into the agent: no extension",
    "Built-in Azure compute security baselines; CIS for Linux in preview",
    "Policy-as-code; noncompliance is a finding",
  ], 12.5);
  panel(s, "AUM", 4.7, 1.45, 3.95, 3.85, HEX.teal, HEX.tealTint, "PATCH", "Azure Update Manager", [
    "Assesses every 24 hours; maintenance windows",
    "Dynamic scoping by tag: PatchGroup",
    "Per server per month, but not with ESU through Arc, Defender for Servers Plan 2, or SA, subscription or PAYG",
  ], 12.5);
  panel(s, "DFS", 8.8, 1.45, 3.95, 3.85, HEX.amber, HEX.amberTint, "PROTECT", "Defender for Servers", [
    "Plan 1: EDR. Plan 2 adds agentless scanning, compliance, premium vulnerability management, FIM",
    "Program scope: Plan 2, plus Defender for SQL",
    "Onboard through Arc, not a direct agent install",
  ], 12.5);
  callout(s, "Addr", 5.45, 1.0, "FaServer", HEX.red, "Connected is addressable, not governed: ",
    "watch machine configuration, Update Manager and Defender together. Security settings management needs at least one Defender for Endpoint user license.");
  sources(s, "Sources: Microsoft Learn — machine configuration governance; deploy a security baseline; Update Manager FAQ; Defender for Servers plans; onboard servers; security settings management. Book 05, Ch 09.");
  notes(s,
`A connected server is addressable, not yet governed. Attach three things on the same change.

Govern with Azure machine configuration, formerly Azure Policy Guest Configuration. It extends Azure Policy inside the operating system, using Desired State Configuration to audit or set OS settings, and reports compliance per machine. Unlike Group Policy it's scoped by Azure resource scope, subscription, resource group or machine, not by OU. The agent includes the service natively, so there's no extension to deploy. The Windows and Linux audit baselines are built-in definitions against the Azure compute security baseline, both customizable, and a CIS benchmark definition for Linux is in preview. Deploy the prerequisite initiative first, keep the customized baseline in the governance repository as policy-as-code, and treat noncompliance as a finding, not a failed deployment.

Patch with Azure Update Manager. It assesses every twenty-four hours when periodic assessment is on, patches in maintenance windows, and groups machines by tag through dynamic scoping, which is where the patch group tag earns its keep. It's charged per Arc server per month, except when the server is enabled for ESUs through Arc, when Defender for Servers Plan 2 covers the subscription, or with Software Assurance, a subscription or pay-as-you-go license.

Protect with Defender for Servers. Plan 1 centers on endpoint detection and response; Plan 2 adds agentless scanning, regulatory compliance, premium vulnerability management, configuration assessment and file integrity monitoring. The program's FedRAMP Moderate scope uses Plan 2, plus Defender for SQL on Arc-connected SQL hosts. Onboard through Arc rather than installing Defender directly, which gives only Plan 1 function. And if your only Defender entitlement comes through Defender for Servers, security settings management isn't available.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc, \"The day-one baseline.\"");
}

// ================================================================== 23 ESU, sign-in, rollback
{
  const s = D.content(P2, "Extended Security Updates, Entra ID sign-in and rollback");
  tag(s, "How");
  subhead(s, "ESU head", "AS OF OCTOBER 20, 2026", 0.6, 1.45, 6.3);
  const b = table(s, "ESU", 1.8, [2.0, 4.3], ["Product", "Status"], [
    ["Server 2012, 2012 R2", "ESUs ended October 13, 2026: a red finding"],
    ["Server 2016", "End of support January 12, 2027; Arc ESUs up to three years"],
    ["SQL Server 2014", "ESU year 3; available until July 2027"],
    ["SQL Server 2016", "ESU year 1; available until July 17, 2029"],
  ], { fontSize: 12.5 });
  panel(s, "Rollback", 0.6, b + 0.15, 6.3, 6.5 - b - 0.15, HEX.navy, HEX.navyTint, "ROLLBACK, IN ORDER", null, [
    "Remove extensions, then azcmagent disconnect (resource administrator), then uninstall",
    "Domain membership and the workload are untouched",
  ], 12.5);
  panel(s, "Signin", 7.1, 1.45, 5.65, 5.05, HEX.teal, HEX.tealTint, "ENTRA ID SIGN-IN, WINDOWS", "Server 2025 with Desktop Experience", [
    "Not Server 2019 or 2022: exception path C",
    "Azure Global and Azure Government",
    "Managed identity, then AADLoginForWindows: installing it Entra-joins the server",
    "VM Login roles; member users only, not guests",
    "Conditional Access isn't supported with this extension",
    "Linux: AADSSHLoginForLinux with the same roles",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — prepare to deliver Windows Server ESUs; SQL Server ESU FAQ; Arc Entra ID sign-in (Windows); SSH to Arc servers; uninstall the agent; azcmagent disconnect. Book 05, Ch 09.");
  notes(s,
`Arc is also how many organizations keep end-of-support servers patched while they migrate. As of October twentieth, 2026: the Windows Server 2012 and 2012 R2 ESU period ended on October thirteenth, and Arc ESU licenses deactivated the next day. Any such host still running receives no further security updates through any channel. Treat it as a red finding: migrate, upgrade, or isolate it and record the risk acceptance. Windows Server 2016 reaches end of support on January twelfth, 2027, with ESUs for up to three years; connect and enroll those hosts before then if they won't be upgraded in time. SQL Server 2014 is in its third ESU year, until July 2027, and SQL Server 2016 in its first, until July 2029. ESUs through Arc are billed monthly, need no product keys, and show coverage per server.

Entra ID sign-in. Arc-enabled Windows servers can use Entra ID for Remote Desktop, with Azure RBAC deciding who signs in. It needs Windows Server 2025 or later with Desktop Experience, or Windows 11 24H2; 2019 and 2022 aren't supported, which is exception C from Module 1. It's available in Azure Global and Azure Government. Installing the sign-in extension Entra-joins the server, so it's for servers that won't be domain-joined. Only member users of the same tenant can sign in. And Conditional Access isn't supported with the join extension on Arc servers. That corrects a common assumption: the control you get is RBAC on who may sign in, held through PIM, not workstation Conditional Access. Linux uses SSH through Arc with its own extension and the same roles.

Rollback order matters: remove extensions first, because uninstalling the agent leaves them behind; then disconnect, which needs the resource administrator role; then uninstall.`,
  "Book 05, Chapter 09 — Servers Under Azure Arc, \"Extended Security Updates,\" \"Microsoft Entra ID sign-in,\" \"Rollback.\"");
}

// ================================================================== 24 Module 4 divider
{
  moduleName = "Module 4";
  const s = divider(P2, "Module 4: Operating and evidencing the fleet", "Part 2 — Servers and the run state  ·  Chapter 10",
    ["The compliance signal and configuration status", "Updates, Defender, inventory and retirement", "Drift, alerts and the evidence an assessor reads"], 11);
  notes(s,
`Module 4: operating and evidencing the fleet. Once the GPOs are gone, a device's state is no longer explained by where it sits. It has to be proved, continuously, from records the services already keep.

The run state replaces the OU answer with three records: the policy library from Chapter 08, which says what each device should be; the status Intune and Defender report per device, which says what it is; and the audit log of every change. Operating the fleet means keeping those three in agreement. Evidencing it means handing an assessor the same records, not a document written for the audit.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet.");
}

// ================================================================== 25 Compliance signal
{
  const s = D.content(P2, "Making the compliance signal accurate");
  tag(s, "What");
  subhead(s, "Tenant head", "TENANT-WIDE COMPLIANCE SETTINGS", 0.6, 1.45, 7.3);
  const b = table(s, "Tenant", 1.8, [3.4, 1.3, 1.25, 1.35], ["Setting", "Default", "Program", "Range"], [
    ["Devices with no compliance policy assigned", "Compliant", "Not compliant", "—"],
    ["Compliance status validity period", "30 days", "14 days", "1–120 days"],
  ], { fontSize: 12.5 });
  table(s, "Status", b + 0.25, [2.0, 5.3], ["Status", "What it means"], [
    ["In grace period", "Noncompliant, inside the Mark noncompliant schedule"],
    ["Not evaluated", "Newly enrolled, or not checked in since a policy changed"],
    ["Error (a setting)", "Keeps the existing status up to 7 days, then noncompliant"],
    ["Conflict (configuration)", "Another policy sets the same setting: a library defect"],
  ], { fontSize: 12.5 });
  panel(s, "Handoff", 8.15, 1.45, 4.6, 5.05, HEX.navy, HEX.navyTint, "THE HAND-OFF TO BOOK 04", "This book makes the signal true", [
    "Conditional Access decides what a noncompliant device can reach",
    "The grant control works only for devices registered in Entra ID and enrolled in Intune",
    "Review Not evaluated and Error weekly: both hide devices from the noncompliant count",
    "Tier 0: a Defender detection becomes a loss of access (CP-002)",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — compliance policy settings; monitor compliance; Windows compliance settings; monitor baselines and profiles; Intune conflicts; CA grant. Book 05, Ch 10.");
  notes(s,
`The compliance policies decide whether a device is compliant; Conditional Access decides what a noncompliant device can reach. Book 04 owns that second decision. This book's side of the hand-off is making sure the compliance signal is accurate, and remember that the compliant-device grant works only for devices registered in Entra ID and enrolled in Intune.

Two tenant settings sit above every policy. Devices with no compliance policy assigned default to Compliant; the program sets Not compliant, so a device that falls outside every group, a missing tier attribute for example, can't pass Conditional Access by default. And the compliance status validity period defaults to thirty days, with a range of one to a hundred twenty; the program uses fourteen. That's a program choice: short enough that a device left in a drawer loses access before its posture is stale by a whole patch cycle, long enough not to catch staff on leave.

Read the dashboard carefully. In grace period means noncompliant, but inside the schedule on the mark noncompliant action. Not evaluated is a new device, or one that hasn't checked in since a policy changed. A compliance setting that returns Error keeps the existing status for up to seven days, then the device becomes noncompliant. The program reviews Not evaluated and Error weekly, because both hide devices from the noncompliant count.

Configuration status is per device and per setting: Succeeded, Error, or Conflict, which means another policy sets the same setting differently. A conflict is a defect in the library. Move the setting into the one policy that owns it.

And on Tier 0, the risk score requirement means a Defender detection on a privileged access workstation becomes a compliance failure, and through Conditional Access, a loss of access.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet, \"Compliance and the Conditional Access hand-off\" and \"Configuration status and conflicts.\"");
}

// ================================================================== 26 Updates
{
  const s = D.content(P2, "Windows updates: rings, Autopatch and version currency");
  tag(s, "How");
  subhead(s, "Ring head", "THE PROGRAM'S RINGS (QUALITY UPDATES, IN DAYS)", 0.6, 1.45, 7.0);
  const b = table(s, "Rings", 1.8, [1.0, 2.6, 1.15, 1.15, 1.1], ["Ring", "Population", "Deferral", "Deadline", "Grace"], [
    ["Test", "Engineering lab devices", "0", "2", "1"],
    ["First", "Pilot cohort, about 5%", "1", "3", "2"],
    ["Fast", "About a quarter of the fleet", "3", "5", "2"],
    ["Broad", "Everyone else", "7", "7", "2"],
  ], { fontSize: 12.5 });
  table(s, "Versions", b + 0.25, [1.0, 1.0, 2.0], ["Version", "Build", "End of updates"], [
    ["25H2", "26200", "2028-10-10"],
    ["24H2", "26100", "2027-10-12"],
    ["23H2", "22631", "2026-11-10"],
  ], { fontSize: 12.5 });
  txt(s, "Currency", [
    { text: "Feature update policy targets 25H2; ", options: { bold: true, color: HEX.navy } },
    { text: "the compliance floor (24H2) rises each year." },
  ], { x: 4.85, y: b + 0.3, w: 2.85, h: 1.3, fontSize: 12.5 });
  panel(s, "Autopatch", 8.0, 1.45, 4.75, 5.05, HEX.teal, HEX.tealTint, "WINDOWS AUTOPATCH", "Use it where licensed", [
    "Included for GCC with Microsoft 365 G3 GCC or G5 GCC; not supported in GCC High or DoD",
    "Devices Entra joined or hybrid joined; co-managed sliders at Intune or Pilot Intune",
    "It creates and maintains the rings: don't assign your own to its devices",
    "The ring table stays the specification, and what the assessor reads for SI-2",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Windows update management; update ring settings; Essential Eight patching (Autopatch rings); Autopatch prerequisites and FAQ; Windows 11 release information. Book 05, Ch 10.");
  notes(s,
`Intune manages Windows updates through four policy types built on the Windows Update client policies: update rings for deferrals, deadlines and restarts; feature update policies that pin a Windows version; quality update policies, which can expedite a critical update or deliver hotpatches; and driver update policies.

Rings stage each month's quality update. The names follow Windows Autopatch, Test, First, Fast and Broad; the values are the program's design. Test is the engineering lab, with no deferral and a two-day deadline. First is the pilot cohort, about five percent. Fast is about a quarter of the fleet. Broad is everyone else, with a seven-day deferral, a seven-day deadline and a two-day grace period. Rings allow deferrals of zero to thirty days, deadlines of two to thirty and grace of zero to seven. With these values a quality update reaches every online device within about sixteen days of release, and an update that breaks Test or First can be paused before Broad. Feature deferral is zero everywhere, because a feature update policy pins the version.

Windows Autopatch automates ring management, sequencing and reporting. For government tenants, it's included for GCC customers with Microsoft 365 G3 GCC or G5 GCC, and isn't supported in GCC High or DoD. Devices must be Entra joined or hybrid joined, and co-managed devices need the update and device configuration workloads at Intune or Pilot Intune. Autopatch creates and maintains its own rings, so don't assign yours to its devices. The program's position: use it where licensed, and keep the ring table as the specification its groups are configured to.

Version currency: 23H2 Enterprise and Education stop receiving updates on November tenth, 2026. So the feature update policy targets 25H2 now, and the compliance floor of 24H2 rises each year.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet, \"Windows updates.\"");
}

// ================================================================== 27 Inventory + retirement
{
  const s = D.content(P2, "Reconciling three inventories, and retiring a device in order");
  tag(s, "How");
  const b = table(s, "Inventories", 1.45, [3.2, 2.9, 6.05], ["Inventory", "Key", "Typical mismatch"], [
    ["Intune managed devices", "Intune ID, with Entra ID", "Devices that stopped checking in; cleanup rules hide them"],
    ["Entra ID device objects", "Entra device ID", "Stale objects from reimaging, broken hybrid trust, or never enrolled"],
    ["Defender for Endpoint inventory", "Machine ID, with Entra ID", "Onboarded but not enrolled, or enrolled but never onboarded"],
  ], { fontSize: 12.5 });
  subhead(s, "Retire head", "RETIREMENT: THE ORDER DECIDES WHAT CAN STILL BE RECOVERED", 0.6, b + 0.15, 12.1);
  flow(s, "Retire", b + 0.5, 6.5 - b - 0.5, [
    { head: "Record", body: "Export BitLocker keys and the LAPS password; record reason and approval", color: HEX.slate, tint: HEX.grey },
    { head: "Act", body: "Wipe for reuse or disposal; retire a personal device; runs at next check-in" },
    { head: "Deregister", body: "Remove from Windows Autopilot if leaving for good", color: HEX.amber, tint: HEX.amberTint },
    { head: "Delete Intune", body: "On Windows this triggers a retire if one hasn't run" },
    { head: "Delete Entra last", body: "After a disable period; this deletes the recovery keys", color: HEX.red, tint: HEX.redTint },
  ], 12);
  sources(s, "Sources: Microsoft Learn — device cleanup rules; manage stale devices; device actions retire, wipe and delete; Entra PowerShell manage devices. Book 05, Ch 10.");
  notes(s,
`Three services keep their own device inventory, and they disagree in predictable ways. Intune's managed devices drift when devices stop checking in, and cleanup rules hide them. Entra ID accumulates stale objects from reimaging, broken hybrid trust, or devices that never enrolled. Defender has devices onboarded but not enrolled, or enrolled but never onboarded.

The program reconciles them weekly on the Entra device ID. Every enrolled device must have an Entra object with its tier, role and environment attributes set, and a healthy Defender sensor. Every Entra object for a corporate Windows device must have an Intune enrollment. A device missing from any one is a finding, and the same comparison is the evidence for CM-8's requirement of a complete inventory with no duplicates.

Stale records need care. Intune cleanup rules hide devices after thirty to two hundred seventy days, per platform; the program uses ninety for Windows. They don't wipe or retire anything, and hidden devices stay in Entra ID. Entra's last sign-in timestamp isn't updated on every sign-in, so Microsoft advises not treating anything newer than about twenty-one days as stale, and disabling before deleting. Hybrid devices are removed in Active Directory, and the change syncs.

Retirement follows a fixed order, because the order decides what can still be recovered. Record first: export the BitLocker keys and the LAPS password. Retiring or deleting the Intune object of an Entra-joined BitLocker device suspends BitLocker, so back up first. Then act on the device: wipe a corporate device, retire a personal one; actions run at next check-in. Deregister from Autopilot if it's leaving for good. Delete the Intune record. And delete the Entra object last, after a disable period, because that permanently deletes its keys. Plan mass refreshes in daily batches: the tenant limit is a thousand retires and a thousand deletes a day.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet, \"Device inventory reconciliation\" and \"Retirement and wipe.\"");
}

// ================================================================== 28 Drift + alerts
{
  const s = D.content(P2, "Drift detection: what the logs can tell you, and when");
  tag(s, "How");
  panel(s, "Latency", 0.6, 1.45, 5.2, 5.05, HEX.amber, HEX.amberTint, "INTUNE TO LOG ANALYTICS", "Trends and evidence, not minute alerts", [
    "Audit and operational logs: sent immediately",
    "Compliance organizational logs and IntuneDevices: every 24 hours, up to 48 to arrive",
    "No per-setting configuration status: that comes from Microsoft Graph reports",
    "Don't hard-code state strings or join IntuneOperationalLogs on DeviceId",
  ], 12.5);
  table(s, "Alerts", 1.45, [2.7, 2.35, 1.9], ["Alert", "Threshold", "Source"], [
    ["Noncompliant devices", "Over 10% of managed devices", "Daily compliance export"],
    ["Tier 0 noncompliance", "Any device", "Graph, polled hourly"],
    ["Policy deployment failure", "Over 5 devices, one policy", "Graph configuration status"],
    ["Tamper protection off", "Any device", "Defender alerts"],
    ["BitLocker not encrypted", "Noncompliant over 2 days", "Compliance export"],
    ["Inventory mismatch", "Any reconciliation finding", "Reconciliation script"],
  ], { x: 5.95, fontSize: 12 });
  txt(s, "Loop", [
    { text: "The loop: ", options: { bold: true, color: HEX.teal } },
    { text: "daily export, compare with the Chapter 08 values, classify (policy gap, device fault, conflict, inventory mismatch), then remediate the device or change the policy. Governed writes carry an approval reference." },
  ], { x: 5.95, y: 5.1, w: 6.8, h: 1.4, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — send Intune log data to Azure Monitor; IntuneOperationalLogs, IntuneDeviceComplianceOrg, IntuneDevices and IntuneAuditLogs table references. Book 05, Ch 10.");
  notes(s,
`Drift is a difference between the policy library and a device's reported state that the policy should have prevented: BitLocker off, tamper protection off, an OS below the floor, a setting stuck in Conflict. The program detects it with the same loop Chapter 05 describes for the governed path, applied to Intune and Defender. A daily export of compliance, configuration and inventory status. A comparison against the template values in Chapter 08. Classification as a policy gap, a device fault, a conflict or an inventory mismatch, alerted by severity. And remediation: a device sync or a Remediation script, or a policy change through change control when the library itself is wrong. On the governed path every remediating write carries an approval reference.

Know what Log Analytics receives, and when. Intune's diagnostic settings send audit logs, operational logs, compliance organizational logs and the Intune devices inventory. Audit and operational logs are sent immediately. Compliance and inventory are exported once every twenty-four hours and can take up to forty-eight to arrive, and Microsoft says not to rely on a fixed delivery time. So those tables are for trends and evidence, not minute-level alerts. And per-setting configuration status isn't among them, so the configuration comparison comes from Microsoft Graph reports. Three query pitfalls: don't hard-code compliance state strings, don't join the operational logs on a device ID column it doesn't have, and don't look for configuration conflicts there.

The alerts follow from that. Fleet-wide noncompliance above ten percent comes from the daily export. But Tier 0 noncompliance is polled from Graph hourly: from the export, the alert would arrive two days late. Meanwhile Conditional Access blocks the device, because CP-002 has no grace period.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet, \"Drift detection and alerting.\"");
}

// ================================================================== 29 Evidence + GCC + close
{
  const s = D.content(P2, "The evidence an assessor reads, and the GCC boundary facts");
  tag(s, "Who");
  table(s, "Controls", 1.45, [1.55, 5.75], ["Control", "Evidence the program hands over"], [
    ["CM-2 Baseline", "The policy library exported as JSON from Graph, under version control, with review history"],
    ["CM-6 Settings", "Per-setting status; the exception register with approvals; Intune audit logs"],
    ["CM-7 Least function", "ASR rules in block, firewall rule set, Edge extension allow list, consumer features off"],
    ["CM-8 Inventory", "The weekly three-way reconciliation, with findings and their closure"],
    ["SI-2 Flaws", "The ring table, quality update compliance per ring, Test and First results, expedites"],
  ], { fontSize: 12.5 });
  panel(s, "GCC", 7.55, 1.45, 5.2, 5.05, HEX.navy, HEX.navyTint, "GCC (MODERATE) BOUNDARY FACTS", null, [
    "Intune: the same instance as commercial; only GCC High and DoD are separate",
    "Graph: graph.microsoft.com; GCC High uses graph.microsoft.us",
    "Defender for Endpoint for US Government, in Azure US Government; portal security.microsoft.com",
    "Windows Update for Business reports don't meet GCC compliance: use Intune and Autopatch reports",
    "Keys and LAPS passwords live on the Entra object: export before any delete",
  ], 12);
  note(s, "KSI", 0.6, 4.7, 6.75, 1.8, HEX.teal, HEX.tealTint, "FedRAMP 20x: ",
    "the program uses the 2026 Key Security Indicators as a vocabulary for this evidence, its own claim. Not for recovery, supply chain, education or incident response.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (release 5.2.0); FedRAMP 2026 controls and Key Security Indicators; Microsoft Learn — Intune government service; Graph national clouds; Defender for US Government; WUfB reports. Book 05, Ch 10.");
  notes(s,
`Last, what the assessor reads. The program's evidence is the records the services keep, exported on a schedule and retained, for the configuration management and flaw remediation controls. The control wording is from NIST SP 800-53 Revision 5, release 5.2.0, which FedRAMP's 2026 catalog uses without adding parameter values to these controls.

CM-2, baseline configuration: the policy library exported from Graph, under version control, with its review history. CM-6, configuration settings: per-setting status, the exception register with approvals, and the Intune audit log of every change. CM-7, least functionality: attack surface reduction in block, the firewall rule set, the Edge extension allow list. CM-8, inventory: the weekly reconciliation. SI-2, flaw remediation: the ring table and per-ring compliance. SI-2's defined period is the organization's parameter, and the ring deadlines are what set it.

Two GCC facts change where data and endpoints live. Intune in a GCC tenant isn't a separate government instance: GCC uses the commercial service and worldwide Graph, and only GCC High and DoD are separate. Defender for Endpoint for US Government is built in Azure US Government, with the GCC portal at security dot microsoft dot com. And Windows Update for Business reports don't meet GCC compliance requirements, so SI-2 evidence comes from Intune and Autopatch reports.

The program also maps this evidence to FedRAMP 20x Key Security Indicators, as its own claim, written for cloud service offerings, not an agency fleet.

So, from Monday: inventory and triage every GPO; set the tenant compliance defaults; carry procurement into the group tag; onboard servers with a short-lived certificate principal; and reconcile inventories weekly. Chapters 04 to 10 and Appendix A carry the detail. Thank you.`,
  "Book 05, Chapter 10 — Operating and Evidencing the Fleet, \"Reporting and the evidence an assessor reads\" and \"GCC (Moderate) boundary facts\"; Chapters 04–09.");
}

// ================================================================== Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the orientation and Part 1 — Endpoints");
  const src = [
    "Microsoft Learn: Group Policy processing, scope, Modeling and Results, GPMC; cloud-native endpoints planning guide, known issues, tutorial and join types; Intune policy conflicts and assignment; assignment filters.",
    "Microsoft Learn: Policy CSP ControlPolicyConflict (MDMWinsOverGP); enroll a Windows device automatically using Group Policy; Windows Hello for Business configuration; co-management workloads and switching.",
    "Microsoft Learn: configure, plan and control hybrid join; device registration; Primary Refresh Token; stale and pending devices; Entra device and managedDevice resource types; Defender machine resource.",
    "Microsoft Learn: Autopilot registration, OEM and manual registration, profiles and ESP; device preparation overview, FAQ, requirements and comparison; Intune Government Service; enrollment restrictions; corporate identifiers.",
    "Microsoft Learn: compliance policy settings; Windows compliance settings; security baselines; CA grant, device filters and planning; Defender security settings management; Intune supported platforms.",
    "Microsoft Learn: NTLM deprecation, LMCompatibilityLevel, NTLM policies and NTLMv1 audit; Kerberos KDC errors; SSPI context; SQL Server SPNs; emergency access accounts; Intune RBAC; Multi Admin Approval; Windows LAPS.",
    "Microsoft Learn: Get-GPOReport, Backup-GPO, Set-GPLink; Group Policy analytics and migration; settings catalog; custom ADMX import (public preview); endpoint security; Remediations; scripts; GP preferences; Policy CSP Update.",
    "Microsoft Learn: noncompliance actions; Windows 11 release information; dynamic membership rules; filter properties; Defender, DeviceLock, Audit, UserRights, BitLocker and Personalization CSPs; ASR rules; Credential Guard; Known Folder Move.",
    "FedRAMP Consolidated Rules for 2026: Key Security Indicators and certification.  ·  NIST SP 800-53 Rev. 5.",
    "Full footnotes with links and access dates: Book 05, Chapters 01–08 and Appendix A.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = D.content("Backup", "Sources behind Part 2 — Servers and the run state");
  const src = [
    "Microsoft Learn: What is Azure Arc-enabled servers; Connected Machine agent overview; Arc security overview; identity and authorization (RBAC roles); managed identity; Windows Server Management enabled by Azure Arc.",
    "Microsoft Learn: Cloud Adoption Framework identity, access and automation for Arc servers; Arc network requirements; azcmagent check, connect, config and disconnect; deployment options; extension security.",
    "Microsoft Learn: connect hybrid machines at scale with a service principal; connect at scale using Group Policy; Arc onboarding security (credential and secrets); uninstall the agent.",
    "Microsoft Learn: machine configuration governance and security baselines; Azure Update Manager FAQ; Defender for Servers plans, onboarding and prerequisites; Defender security settings management.",
    "Microsoft Learn: prepare to deliver Windows Server ESUs; SQL Server ESU FAQ; agent release notes archive; Arc Entra ID sign-in (Windows); SSH to Arc servers; Entra sign-in for Linux.",
    "Microsoft Learn: compliance settings and monitoring; baseline monitoring; update management, ring settings and rings; Autopatch prerequisites and FAQ; Essential Eight patching; Windows 11 release information.",
    "Microsoft Learn: EDR deployment; Defender for Endpoint for US Government; Intune government service; device cleanup rules; stale devices; retire, wipe and delete actions; Entra PowerShell device management.",
    "Microsoft Learn: send Intune logs to Azure Monitor; IntuneOperationalLogs, IntuneDeviceComplianceOrg, IntuneDevices and IntuneAuditLogs tables; Windows Update for Business reports; Graph national clouds.",
    "NIST SP 800-53 Rev. 5, release 5.2.0 (OSCAL catalog).  ·  FedRAMP 2026 control catalog (CM, SI) and Key Security Indicators.",
    "Full footnotes with links and access dates: Book 05, Chapters 09–10 (whalermike.github.io/modernization-workbook/docs/books/b05-devices/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
for (const [m, v] of Object.entries(perModule)) console.log(`  ${m}: slides ${v.slides[0]}–${v.slides[v.slides.length - 1]}, ${v.words} words, ${(v.words / WPM).toFixed(1)} min`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
