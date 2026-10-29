// Book 15 — Compliance Automation & Day-2 Operations: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The front door and the authority:  Module 1 (Ch03 intake, triage and routing),
//                                               Module 2 (Ch04 + Appendix A, help desk authority in Entra ID).
//   Part 2 — Catalogs, records and controls:     Module 3 (Ch05–07 catalogs, SaaS integration, the CMDB),
//                                               Module 4 (Ch08–10 control automation and who runs day two).
// Build:  node presentations/b15-day2-operations-technical/build.js presentations/b15-day2-operations-technical/B15_Day2_Operations_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b15-day2-operations/; the notes name the chapter.
// Program recommendations are labeled "design guidance" and the book's own inferences "inference".
// Narration: narration.json (intent-first voice); presentations/_build/narrate.py and captions.py, then
// build_narrated.ps1 (the editor runs those). The notes keep the full detail for a live presenter.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 15", title: "Day-2 Operations — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  return D.callout(s, name, y, h, iconName, color, label, text);
};
const OUT = process.argv[2] || "B15_Day2_Operations_Technical.pptx";
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b15-day2-operations", "png");

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (narration runs ~142 words a minute).
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

// Titles: at most 58 characters and unique across the deck.
const titles = new Set();
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.has(t)) throw new Error(`duplicate title: ${t}`);
  titles.add(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// The short Sources line on every content slide: at most 185 characters.
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
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
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
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
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12.5) => {
  const n = steps.length, gap = 0.28, w = (12.15 - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = 0.6 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    txt(s, `${name} ${i + 1} text`, [
      { text: st.head, options: { bold: true, color: c, fontSize: pt + 2.5, fontFace: "Cambria", breakLine: true } },
      { text: st.body, options: { fontSize: pt } },
    ], { x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h - 0.2, paraSpaceAfter: 3 });
    const need = y + 0.1 + (pt + 2.5) / 72 * 1.2 * lines(st.head, w - 0.24, pt + 2.5) + lines(st.body, w - 0.24, pt) * pt / 72 * 1.2 + 0.05;
    if (need > y + h) console.warn(`  ! ${name} step ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

// Tinted fact boxes in a row: [label, color, tint, text].
const facts = (s, name, top, h, items, pt = 12) => {
  const gap = 0.15, w = (12.15 - gap * (items.length - 1)) / items.length;
  items.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${name} ${i + 1}`, x, top, w, h, f[2]);
    txt(s, `${name} ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: f[1], fontSize: 14, fontFace: "Cambria", breakLine: true } },
      { text: f[3], options: { fontSize: pt } },
    ], { x: x + 0.15, y: top + 0.08, w: w - 0.3, h: h - 0.14, valign: "middle" });
    const need = 0.3 + lines(f[3], w - 0.3, pt) * pt / 72 * 1.2;
    if (need > h - 0.1) console.warn(`  ! ${name} box ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(h - 0.1).toFixed(2)}`);
  });
};

// A committed diagram from the book, sized from the PNG header's aspect ratio.
const img = (s, name, alt, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  return { w, h };
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, t, sub, items, mins) => {
  const s = titleSlide(sec, t, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((x, k) => ({ text: x, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — The front door and the authority";
const P2 = "Part 2 — Catalogs, records and controls";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Day-2 Operations: the technical deep dive", "Book 15 — intake, help desk authority, catalogs, CMDB and control automation");
  txt(s, "Session map", [
    { text: "Part 1 — The front door and the authority", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Intake, triage and routing   ·   Module 2  Help desk authority in Entra ID", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Catalogs, records and controls", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Catalogs, SaaS and the CMDB   ·   Module 4  Control automation and who runs it", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 15 of the Federal Modernization Workbook, Compliance Automation and Day-2 Operations. It's for help desk leads, cloud services and platform engineers, and the people who automate controls: the teams who run the estate after cutover.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the front door and the authority: how a request is taken in, triaged by the authority it needs and routed, how the person is verified before a reset, and then which Entra ID roles the help desk holds, over whom, and how they reach a technician. Part 2 is catalogs, records and controls: the typed catalog items, SaaS integration governance and the CMDB, then control compliance automation on Microsoft 365, Azure, AWS and VMware, and who runs day two.

The slides show tables, flows and decision matrices. The scripts and commands live in the chapters and Appendix A, and the book marks them as illustrative and untested against a production tenant; I'll point you to them rather than put them on screen. Where something is the program's recommendation rather than a vendor or federal fact, the slide says design guidance.`,
  "Book 15, index; Chapters 01–10; Appendix A.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: a reset can hand over the account");
  tag(s, "Why");
  subhead(s, "Click head", "WHY THE HELP DESK IS WHERE MODERNIZATION IS JUDGED", 0.6, 1.5, 5.8);
  const rows = [
    ["FaKey", "One click re-registers", HEX.red, "Require re-register MFA deletes phones, Authenticator and software OATH, and deactivates hardware tokens; the next sign-in enrolls"],
    ["FaUserXmark", "Attackers call the desk", HEX.amber, "CISA AA23-320A: actors posed as employees to get resets and MFA moved, after probing what a reset required"],
    ["FaUserShield", "Reset roles are privileged", HEX.navy, "Helpdesk and Authentication Administrator carry Microsoft's privileged label; a password change can mean assuming the identity"],
  ];
  rows.forEach((r, i) => {
    const y = 1.88 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.05, 0.6, r[2]);
    txt(s, `Click ${i + 1}`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 15.5, breakLine: true } },
      { text: r[3], options: { fontSize: 13 } },
    ], { x: 1.35, y, w: 5.0, h: 1.05 });
  });
  subhead(s, "Rules head", "FEDERAL GUIDANCE TREATS RECOVERY AS A BYPASS", 6.6, 1.5, 6.1);
  table(s, "Guidance", 1.85, [1.75, 4.4], ["Source", "What it says about recovery"], [
    ["OMB M-22-09", "Recovery is a potential bypass; design it as exceptional, with high-friction methods such as in-person or live video"],
    ["SP 800-63B-4 §4.2", "Codes, recovery contacts or repeated proofing at the original level; recovery SHALL notify the subscriber"],
    ["SP 800-53", "IA-5 verify the recipient and handle lost authenticators; IA-5(1) new password after recovery; IA-12 proofing"],
  ], { x: 6.6, fontSize: 12.5 });
  callout(s, "Transfer", 5.35, 1.1, "FaTriangleExclamation", HEX.red, "An authenticator reset is an account transfer: ",
    "the CISO owns the verification procedure, the most friction goes on the most sensitive accounts, and every reset alerts (design guidance).");
  sources(s, "Sources: Microsoft Learn — Entra built-in roles; manage MFA methods. CISA AA23-320A. OMB M-22-09. NIST SP 800-63B-4; SP 800-53 Rev. 5. Book 15, Ch 01.");
  notes(s,
`Why this matters. A modernization program spends its attention on day one, and the estate is judged on day two.

The most dangerous routine action on the desk follows from one Entra ID button. When an administrator chooses Require re-register MFA, Entra deletes the user's phone numbers, Authenticator registrations and software OATH tokens, deactivates hardware OATH tokens, and asks for a new method at the next sign-in. Whoever signs in next with the password and registers a method controls the account. That's why Microsoft labels Helpdesk Administrator and Authentication Administrator privileged roles, and warns that changing a user's password may mean the ability to assume that user's identity.

Attackers know it. CISA's Scattered Spider advisory, first published in November 2023 and revised in July 2025, describes actors calling help desks to get passwords reset and MFA tokens transferred, after probing what a reset required.

Federal guidance treats recovery as a bypass. M-22-09 says recovery processes are a potential bypass and should require high-friction methods such as in-person verification or live video. SP 800-63B-4, final in July 2025, allows an agent-assisted method only on a documented risk analysis, requires repeated proofing at the original level, and says recovery shall notify the subscriber. In the control catalog that's IA-5, IA-5(1) and IA-12, all in the moderate baseline.

So the program treats the authenticator reset as an account transfer. That's design guidance, and the procedure itself is the CISO's decision.`,
  "Book 15, Chapter 01 — Modernization Succeeds or Fails at the Help Desk.");
}

// ================================================================== 3 Contract
{
  const s = content("Orientation", "Three questions, one contract, five operating rules");
  tag(s, "What");
  table(s, "Questions", 1.5, [1.55, 4.15], ["Question", "Who answers it"], [
    ["Where does it go?", "The ITSM platform triages by required authority and routes to a pipeline"],
    ["Who may say yes?", "The identity governance tool: the approver the control requires, never the requester"],
    ["What proves it?", "Entra ID executes; the closed ticket carries approval, elevation, change and a check"],
  ], { fontSize: 12, minRow: 0.7 });
  table(s, "Contract", 1.5, [2.15, 4.15], ["Coordination contract", "What it means for day-two work"], [
    ["Routed to an owner", "Every request and drift finding is a task with an owner and a clock"],
    ["Gated by approval", "Recorded before the change; the approver is never the requester"],
    ["Least-privilege identity", "Scoped, auditable service identity; never standing write over the estate"],
    ["Evidence emitted", "Request, approval, elevation, result and check become one record"],
    ["Guardrail", "The CMDB reconciles to the authoritative inventory; trusted for routing, never truth"],
  ], { x: 6.45, fontSize: 12 });
  flow(s, "Rules", 4.65, 1.8, [
    { head: "Originate", body: "From the source of truth: an HR event, the NHI registry or the record; email only opens a ticket" },
    { head: "Authorize", body: "The approval gate is a property of the control, not a workflow convenience" },
    { head: "Elevate JIT", body: "An eligible PIM role, time-boxed, through the in-boundary connector" },
    { head: "Close", body: "With the check that proves the state took, not a \"done\" reply" },
    { head: "Emit", body: "The change record feeds attestation and CA-7 automatically" },
  ], 11.5);
  sources(s, "Sources: ServiceNow — Entra ID Spoke notes, MID Server, CAM; Microsoft Learn — PIM; FedRAMP Marketplace data; SP 800-53 Rev. 5, SP 800-137. Book 15, Ch 01–02.");
  notes(s,
`Every day-two request answers three questions before anything changes: where does it go, who may say yes, and what proves it happened. The program answers them across three platforms the agency already runs. The service management platform routes and tracks, the identity governance tool approves, and Entra ID is where the change executes. The help desk performs only the residual manual step that automation can't reach, and never makes an access-governance decision. One control is unconditional: approval of admin consent belongs to the identity governance authority alone.

Chapter 02 calls the requirement a coordination contract, not a product: work routed to a named owner, change gated by an approval record, execution under a least-privilege service identity, and machine-readable evidence, plus a guardrail that the CMDB reconciles to the authoritative inventory. ServiceNow is the reference platform in the sources, not a mandate. Its Government Community Cloud is listed as FedRAMP Certified at Class D, High; every moderate control is also in the high baseline, so the book calls that difference conservative, and the agency records the treatment in its own authorization. Execution reaches agency surfaces through a connector inside the boundary, the MID Server.

The five operating rules apply to every request: originate with the source of truth, carry the authorization the control requires, execute under least privilege elevated just in time, close with provenance, and emit the evidence automatically. If any is missing, the program treats the operation as unauthorized by construction.`,
  "Book 15, Chapter 01, \"Every request answers three questions\"; Chapter 02 — Day Two Is Where Compliance Lives or Dies, \"The coordination contract\" and \"The day-two operating rules.\"");
}
endModule("Orientation");

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: Intake, triage and routing", "Part 1 — The front door and the authority  ·  Chapter 03",
    ["One front door, and triage by the authority a task needs", "What the Entra ID spoke actually covers", "The verification ladder, and the evidence every ticket leaves"], 12);
  notes(s,
`Module 1: intake, triage and routing. Book 04 settled who decides access and set out the authority split, A0 to A3 plus out of scope. That's the governance half. This module is the operations half: how a request actually arrives, who looks at it first, how it reaches the right approver, what the technician checks before touching the tenant, and what's left behind when the ticket closes.

An estate with a clean role model still reverts if the cloud services team keeps answering email, if a manager's "please just do it" counts as approval, or if a caller who sounds right gets an MFA reset. The platforms named are the ones the sources describe; none is endorsed.`,
  "Book 15, Chapter 03 — Intake, Triage and Routing.");
}

// ================================================================== 5 Front door
{
  const s = content(P1, "One front door: redirect, filter, reroute");
  tag(s, "How");
  img(s, "ch03-one-front-door", "Every source of work lands in one triage queue: self-service catalog items, the redirected team mailbox and machine-raised tickets all lead to one front door with the assignee blank, then to triage by the authority the task needs, which routes A0 and A1 to the ITSM pipeline, A2 and A3 to the IGA pipeline, and out-of-scope work to escalation.",
    0.6, 1.5, 5.9, 3.85);
  txt(s, "Accessible", [
    { text: "Usable by everyone: ", options: { bold: true, color: HEX.navy } },
    { text: "the Revised 508 Standards cover help desks and forms (603); OMB M-24-08 asks for help desk training on assistive technology." },
  ], { x: 0.6, y: 5.55, w: 5.9, h: 0.9, fontSize: 12.5, valign: "middle" });
  table(s, "Artifacts", 1.5, [1.75, 4.25], ["Artifact", "What it does"], [
    ["Mail-flow rule", "RedirectMessageTo the ITSM inbound address; BlindCopyTo leaves two queues. Pilot in Audit mode, then Enforce"],
    ["Inbound action", "New mail creates a triage record, assignee blank; Flow Designer email triggers win over inbound actions"],
    ["Email filters", "Ignore or move to Junk; defaults skip calendar replies and junk mail from the instance itself, stopping loops"],
    ["Reroute rule", "Business rule sends anything assigned straight to cloud services back to triage"],
    ["Approval subflows", "Manager, owner or IGO approval, with a due date that rejects or cancels, never approves"],
    ["Connector actions", "Execute covered tasks without a person at a console"],
  ], { x: 6.75, fontSize: 12 });
  sources(s, "Sources: Microsoft Learn — New-TransportRule; ServiceNow — inbound email actions, email filters, Ask for Approval; 36 CFR 1194; OMB M-24-08. Book 15, Ch 03.");
  notes(s,
`The operating rule is that nothing is handled as ad hoc email to the cloud services team. Every request is triaged inside the ITSM platform first, then routed by the authority the task requires. Cloud services is the escalation tier above the help desk, not a second intake queue.

The mailbox is moved with an Exchange Online mail-flow rule. The action matters. BlindCopyTo adds a Bcc recipient, so the original mailbox still gets the message and people keep working from it. RedirectMessageTo redirects instead. A single front door needs the redirect, because a copy leaves two queues. A transport rule also has a mode: in Audit mode the actions are written to the message tracking log and nothing affecting delivery happens. So pilot in audit mode, compare what it would have redirected with what the team received, and only then enforce.

On the ServiceNow side, inbound email flows built with Flow Designer take priority over inbound email actions, so decide which owns the triage mailbox. The program's configuration creates a triage record with the assignee blank. Email filters run first and stop mail loops. Then a reroute business rule catches tickets assigned straight to cloud services and sends them back; without it the old habit survives the redirect. Approval subflows carry a due date set to reject or cancel, never approve, so silence can't grant access.

And the front door must be usable by everyone. The Revised 508 Standards apply to help desks and to forms, and OMB M-24-08 asks agencies to train help desk staff on assistive technology.`,
  "Book 15, Chapter 03 — Intake, Triage and Routing, \"One front door\" and \"Redirecting the mailbox.\"");
}

// ================================================================== 6 Triage
{
  const s = content(P1, "Triage by required authority: first match wins");
  tag(s, "What");
  table(s, "Classes", 1.5, [1.25, 4.15, 2.15], ["Class", "The triage test", "Pipeline"], [
    ["A0", "No access change: cloud-only reset after verification, a log lookup, a client-side fix", "ITSM"],
    ["A1", "The requester's own account: an MFA method reset, a license, a profile attribute", "ITSM; supervisor or manager"],
    ["A2", "Owner-governed access: app access, groups, a certification revocation, joiner or leaver", "IGA; application owner"],
    ["A3", "Governance: admin consent, ImmutableID repair, anything sent as a Microsoft notification", "IGA; owner and IGO; never automated"],
    [{ text: "Out of scope", options: { color: HEX.red } }, "Conditional Access, directory roles, service principals, app registrations", "Security or identity engineering"],
  ], { fontSize: 12 });
  panel(s, "Order", 8.3, 1.5, 4.45, 3.55, HEX.amber, HEX.amberTint, "FIXED ORDER", "The first match wins", [
    "Claims to come from Microsoft? A3, escalate only",
    "Target holds a directory role, or out-of-scope task? Escalate",
    "A governance action? A3",
    "Changes who can reach what? A2",
    "Only the requester's own account? A1",
    "Otherwise A0",
  ], 12.5);
  callout(s, "Notify", 5.25, 1.2, "FaTriangleExclamation", HEX.red, "Nothing is approved from an email: ",
    "a sender address is a quick filter, not proof. Find the event in the Entra audit log and match it to an approved ticket; verify within four business hours.");
  sources(s, "Sources: Microsoft Learn — PIM email notifications; Entra general operations guide (notifications); SSPR notifications. Book 15, Ch 03; Book 04, Ch 06.");
  notes(s,
`Triage asks one question: what authority does this task need? Who received the request, how urgent the requester says it is, and how senior they are don't change the answer.

The classes are Book 04's, and the slide gives the test for each. A0 and A1 run through the ITSM pipeline, with the supervisor or the requester's manager approving A1. A2 and A3 run through the IGA pipeline; A3, governance actions such as admin consent and ImmutableID repair, needs the owner and the identity governance officer and is never automated. Out of scope goes to security or identity engineering.

The checks run in a fixed order because the first match wins and the early checks catch the dangerous cases. Microsoft look-alikes first. Then any target holding a directory role, because a role that can reset a non-administrator can't safely reset an administrator. Then governance, then access, then the requester's own account, otherwise A0.

Microsoft does send real administrative mail, and attackers send look-alikes; a technician with an elevated role who follows a Review permissions link can execute a consent grant. The source guidance said to confirm the sender is MSSecurity-noreply at microsoft dot com. That's the documented sender for PIM notices, but Microsoft names azure-noreply for access reviews, Connect Health, ID Protection and provisioning notices, and SSPR uses other addresses again, with separate ones for US Government. So the check that counts is the tenant: find the event in the audit log and match it to an approved ticket. Book 04's clocks: verify within four business hours, and escalate within an hour if it can't be matched. An audit entry showing a consent, role assignment or grant with no ticket behind it is recorded and escalated immediately to the IGO and the SOC.`,
  "Book 15, Chapter 03, \"Triage by required authority\" and \"Notifications that claim to come from Microsoft.\"");
}

// ================================================================== 7 Spoke coverage
{
  const s = content(P1, "Prefer the connector, but check what it covers");
  tag(s, "How");
  const b = table(s, "Spoke", 1.5, [2.75, 0.8, 4.55, 4.05], ["Task", "Class", "What the Entra ID spoke documents", "Execution in the program"], [
    ["Password reset, cloud-only user", "A0", "Reset Password, for users created in Entra ID only; not federated users", "Connector action, after verification"],
    ["Password reset, synced user", "A0", "Not covered", "Help desk in the Entra admin center with writeback, or in AD"],
    ["MFA or method reset", "A1", "No action: user authentication lists only Revoke User SignIn Sessions", "Help desk task, after verification"],
    ["License; user enable, disable, update", "A1–A2", "Assign and Remove User License; Enable, Disable and Update User", "Connector; joiners and leavers by lifecycle workflow"],
    ["Groups: members, creation, owners", "A1–A2", "Add or remove user, create security group, add or remove owner", "Connector action"],
    ["Enterprise application access", "A2", "Create and Delete Application Assignment; app-role binding unstated", "Connector for membership; task for the binding until piloted"],
    ["Device actions", "A2", "Group membership for devices only", "Device team"],
    ["ImmutableID repair; admin consent", "A3", "Not covered", "Identity engineering (two approvals); the IGO, never automated"],
  ], { fontSize: 11.5 });
  txt(s, "Perms", [
    { text: "The connection type decides what works: ", options: { bold: true, color: HEX.navy } },
    { text: "Reset Password accepts the application permission User-PasswordProfile.ReadWrite.All; Change Password and Revoke User SignIn Sessions need delegated permissions. Requires Integration Hub; validate against the installed spoke." },
  ], { x: 0.6, y: b + 0.1, w: 12.15, h: 6.5 - b - 0.1, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: ServiceNow — Microsoft Entra ID spoke (Zurich), actions and permission tables; Microsoft Learn — reset a user's password; SSPR writeback. Book 15, Ch 03.");
  notes(s,
`Execution prefers automation. Where a connector action exists, the ticket authorizes the machine and the person's role stops at approval, which is Book 13's default tempo. For Entra tasks ServiceNow ships the Microsoft Entra ID spoke. It covers ten action categories: audit logs, group, license, application, device, organization, user authentication, service principal, password and user management. It authenticates through a custom app registered in the agency's tenant.

The source crosswalk mapped more tasks to the spoke than its documentation supports. Checked against the current page: Reset Password works only for users created in Entra ID and doesn't reset federated users, so a synced user's reset is a help desk task. There's no MFA or method reset action at all; the user authentication category lists only Revoke User SignIn Sessions. Application assignment exists, but the page doesn't say whether it handles group-to-app-role assignment, so the program keeps the binding as a help desk task until a pilot proves it. ImmutableID repair and admin consent aren't covered and stay with identity engineering and the IGO.

Two corrections matter for configuration. The source said reset, change-password and session revocation can't run with application permissions. Today Reset Password accepts User-PasswordProfile.ReadWrite.All, while Change Password and the user-management Revoke Sessions action support only delegated permissions, so the connection type decides which actions work. And because an MFA reset has no action, it stays a person's task, which makes verification the control that matters.

For synced users: an administrator can reset an on-premises-mastered password only with writeback on and a managed domain; federated domains aren't supported. A reset in the Entra admin center writes back; one in the Microsoft 365 admin center doesn't, and the passwords drift apart. Coverage changes by release, so validate against the installed spoke.`,
  "Book 15, Chapter 03, \"Prefer the connector, and check what it actually covers.\"");
}

// ================================================================== 8 Verification ladder
{
  const s = content(P1, "Verify the person: the program's verification ladder");
  tag(s, "How");
  const b = table(s, "Ladder", 1.5, [3.1, 4.75, 4.3], ["Situation", "Verification the program accepts (design guidance)", "Then"], [
    ["Can sign in with a phishing-resistant method", "Raises or confirms the ticket from an authenticated session", "Reset or bind the new method"],
    ["Can sign in with a weaker method only", "Authenticated session plus a CISO-approved second check, such as video against the badge photo", "Bind a phishing-resistant method as part of the fix"],
    ["Has lost every method", "Identity proofing: Entra account recovery, or in person against a PIV card or government ID", "One-time pass, short lifetime, handed over in the session"],
    ["Target holds a directory role", "None at the help desk", "Escalate to role holders who can act on admins"],
    [{ text: "Anything else", options: { color: HEX.red } }, "Email alone, caller ID, a caller-supplied callback, knowledge questions, a manager's say-so", "Not accepted"],
  ], { fontSize: 12 });
  facts(s, "Facts", b + 0.15, 6.5 - b - 0.15, [
    ["SP 800-63B-4", HEX.navy, HEX.navyTint, "At AAL2: two codes by different methods, a code plus a bound factor, or re-proofing. Always notify. OTPs aren't phishing-resistant"],
    ["Entra account recovery", HEX.teal, HEX.tealTint, "Verified ID with Face Check, GA May 2026; needs P1 and Face Check. Verified ID in GCC, not GCC High"],
    ["Record the rung, not the proof", HEX.amber, HEX.amberTint, "No document numbers, photos or dates of birth in the ticket; notify on another channel"],
  ], 12);
  sources(s, "Sources: CISA AA23-320A; NIST SP 800-63B-4; Microsoft Learn — Verified helpdesk; account recovery overview and FAQ; Verified ID what's new; TAP. Book 15, Ch 03.");
  notes(s,
`Approval answers "should this be done?" It doesn't answer "is this caller the person the account belongs to?" A manager's approval of an MFA reset is worthless if the caller is an attacker who has also emailed the manager. Password resets, MFA resets, Temporary Access Passes and account recovery all need the second answer.

SP 800-63B-4 is the federal reference. It names social engineering as a risk wherever recovery is human-assisted. Recovery may rely on saved or issued recovery codes, recovery contacts, or repeated identity proofing; at AAL2 that's two codes obtained by different methods, one code plus a bound single-factor authenticator, or re-proofing. Every recovery notifies the subscriber. And phishing resistance needs cryptographic authentication; one-time passwords and out-of-band codes don't qualify.

Microsoft's verified help desk guidance says personal information and knowledge questions are no match for phishing, social engineering and AI voice cloning. Its pattern for total loss is Verified ID with Face Check before any pass or reset. Entra account recovery productizes it: a third-party verifier checks a government document and liveness, the Verified ID is matched to the Entra profile, by first and last name unless a custom extension checks more, and the user gets a Temporary Access Pass. Microsoft announced it generally available in May 2026; it needs Entra ID P1 and a Face Check license, and Verified ID has been supported in GCC, not GCC High, since September 2025. Confirm availability and have the privacy office review the provider's terms.

The ladder on the slide is a CISO decision, and the values are program defaults. Email alone, caller ID and knowledge questions verify no one.

Every reset triggers a notice through a channel other than the one recovered, and the ticket records the rung used, never the evidence itself.`,
  "Book 15, Chapter 03, \"Verify the person before a sensitive action.\"");
}

// ================================================================== 9 Evidence
{
  const s = content(P1, "Close with evidence: three records that must agree");
  tag(s, "Who");
  table(s, "Fields", 1.5, [2.45, 3.85], ["Field the ticket carries", "Why"], [
    ["Requester, UPN, request", "Who asked, and for what"],
    ["Authority class, triage outcome", "Why it took this pipeline"],
    ["Approval chain, names, times", "Who decided; not the requester or executor"],
    ["Verification rung used", "The person was proven, with no personal data stored"],
    ["PIM activation and justification", "Which privilege, when, for how long"],
    ["Action and object IDs", "What changed, by identifier, not display name"],
    ["Audit-log reference, re-read", "It happened, and the object matches the request"],
    ["User notification sent", "The account owner was told"],
  ], { fontSize: 12 });
  table(s, "SLA", 1.5, [1.4, 1.15, 1.6, 1.8], ["Priority", "Acknowledge", "Resolve", "Supervisor alerted"], [
    ["1, critical", "15 minutes", "4 hours", "At half the window"],
    ["2, high", "1 hour", "8 business hours", "At 6 hours"],
    ["3, normal", "4 hours", "3 business days", "On day 2"],
    ["4, low", "8 hours", "5 business days", "On day 4"],
  ], { x: 6.8, fontSize: 12, minRow: 0.36 });
  panel(s, "Build", 6.8, 3.6, 5.95, 2.85, HEX.red, HEX.redTint, "WHAT ENTRA ID DOESN'T ENFORCE", null, [
    "PIM's ticket number is information only: a SIEM rule joins each activation to an assigned ITSM ticket",
    "Audit and sign-in logs last 30 days on P1 or P2, seven on Free: forward to the SIEM",
    "Close within an hour of the change; supervisor reports breaches to the IGO within one business day",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — PIM role settings (ticket information); Entra data retention; NIST SP 800-53 Rev. 5 CM-3. Service levels are program defaults. Book 15, Ch 03.");
  notes(s,
`A ticket that closes with "done" is an assertion. For the help desk, three records have to agree: the closed ticket records the decision, the PIM activation records the privilege, and the Entra audit log records the change. CM-3 asks for that shape, with documented change decisions and retained records.

Before a ticket can close it carries the fields on the left, by object ID rather than display name, and a supervisor returns any ticket closed without them. The ticket closes within an hour of the change, the IGA platform is updated when a license or provisioning state changed, and the executor ends the PIM session rather than letting it run out.

Then what Entra ID doesn't enforce. PIM can require a ticket number on activation, but Microsoft says correlation with any ticketing system isn't enforced. The source promised that activations without a valid ticket number were flagged within 24 hours. That only happens if the program builds it: a SIEM detection rule that compares each activation's ticket number with the ITSM platform's assigned tickets, owned by identity engineering and reported to the IGO. Retention is the other gap: thirty days on P1 or P2, seven on Free, far shorter than an audit cycle, so logs go to the SIEM.

The supervisor reports to the IGO within one business day: an activation with no valid ticket, a change found with no approved ticket, an attempt outside the desk's authority, an admin consent grant by a help desk account, or audit data copied or exported.

Service levels are program defaults, and a shorter external clock, such as an incident notification deadline, overrides them.`,
  "Book 15, Chapter 03, \"The evidence each ticket leaves\" and \"Service levels.\"");
}
endModule("Module 1");

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: Help desk authority in Entra ID", "Part 1 — The front door and the authority  ·  Chapter 04, Appendix A",
    ["Five built-in roles, and whose accounts each can touch", "Scope, restricted units, role-assignable groups and PIM", "Temporary Access Pass recovery and the two-approver tasks"], 10);
  notes(s,
`Module 2: help desk authority in Entra ID. In Active Directory, help desk authority was a property of the tree: reset rights on an organizational unit, and every account in it was in scope.

Entra ID answers the question in three parts. The role decides what a technician can do. The target decides whether the role applies, because most help desk roles act only on users with no administrative role. And the scope narrows the population to an administrative unit. Get any of the three wrong and the desk either can't do its job or can do far more than it should. Appendix A carries the task-by-task reference.`,
  "Book 15, Chapter 04 — Help Desk Authority in Entra ID; Appendix A.");
}

// ================================================================== 11 Roles
{
  const s = content(P1, "Five roles, and whose accounts each can touch");
  tag(s, "What");
  const b = table(s, "Roles", 1.5, [2.55, 4.35, 4.2, 1.05], ["Role", "What it adds", "Whose credentials it can act on (tenant scope)", "Tier"], [
    ["Password Administrator", "Reset passwords; nothing else of note", "No admin role; Directory Readers, Guest Inviter, Password Admin", "2"],
    ["Helpdesk Administrator", "Passwords, invalidate refresh tokens, service requests, service health", "The Password Admin set plus Helpdesk Admin and some reader roles", "2"],
    ["Authentication Administrator", "Set, reset, delete methods; require MFA re-registration; TAP for members", "No admin role; some limited roles, incl. Authentication and Password Admins", "2"],
    ["User Administrator", "Create users, groups, licenses, reset passwords; can't manage MFA", "Non-admins and limited admins, incl. Helpdesk, Groups, User Admins", "2"],
    ["Privileged Authentication Administrator", "All of the above for every user, including Global Administrators", "Everyone, including role-assignable group members and owners", { text: "0", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 12 });
  callout(s, "Cap", b + 0.15, 6.5 - b - 0.15, "FaScaleBalanced", HEX.amber, "Capability isn't authority: ",
    "Authentication Admin can disable and delete users; User Admin can delete users; Application Admin can grant consent. So the desk gets a custom appRoleAssignedTo/update role.");
  sources(s, "Sources: Microsoft Learn — Entra built-in roles; privileged roles and permissions; least privileged roles by task; custom enterprise app roles; Graph users. Book 15, Ch 04.");
  notes(s,
`Entra ID has no single help desk role, and five built-in roles carry most of the identity work. All five carry Microsoft's privileged label. The slide gives what each adds. Privileged Authentication Administrator does all of it for every user, Global Administrators included, which is why it's Tier 0 and outside the help desk.

The column people get wrong is whose credentials each role can act on. Microsoft publishes two matrices, "who can reset passwords" and "who can perform sensitive actions." Two rows matter most: members and owners of role-assignable groups, and users with a role scoped to a restricted management unit, can be reset only by Privileged Authentication Administrators and Global Administrators.

Several roles can do more than a help desk should, and the platform doesn't stop them. Authentication Administrator can delete, disable and enable users and change their UPN. User Administrator can delete users and create guests. Application Administrator can grant consent and create enterprise applications. So Book 04 replaces it with a custom role holding only appRoleAssignedTo update, scoped to one app or the tenant, needing P1 per assignee. Where the platform can't enforce a boundary, the program enforces it twice: in the ticket and in monitoring.

Microsoft's documentation also forces five corrections to the older design. Helpdesk Administrator is the right role for routine resets, not an unused one. The least-privileged role for a non-admin reset is Password Administrator, not Authentication Administrator. Hybrid Identity Administrator can't write onPremisesImmutableId; Authentication, User and Privileged Authentication Administrators and Global Administrators can, for the users in Microsoft's table. Role-assignable groups need P1, and PIM needs P2. And there's no "temporarily disable MFA" step; a user who lost every method gets a Temporary Access Pass. Every script uses Graph PowerShell, since MSOnline is deprecated.`,
  "Book 15, Chapter 04, \"The built-in roles that fit help desk work\" and \"Corrections to the older help desk design.\"");
}

// ================================================================== 12 Scope and PIM
{
  const s = content(P1, "Scope and reach: AUs, restricted units and PIM");
  tag(s, "How");
  panel(s, "AU", 0.6, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "ADMINISTRATIVE UNITS", "Narrow the population", [
    "Password, Helpdesk, Authentication, User, Groups and License Admin assignable to an AU",
    "Application, Cloud App and Hybrid Identity Admin aren't",
    "AU-scoped roles act only on members with no admin role",
    "Limits change, not view; units can't nest",
    "P1 per scoped admin; P1 per member if dynamic",
  ], 12.5);
  panel(s, "RMAU", 4.7, 1.5, 3.95, 4.95, HEX.red, HEX.redTint, "RESTRICTED MANAGEMENT UNITS", "Out of the desk's reach", [
    "Executives, their assistants and devices",
    "Set at creation; can't be changed later",
    "Only unit-scoped admins edit members; tenant Global Admins can't",
    "Executive support: Authentication and Password Admin, eligible, approval required",
    "Never the technicians: no PIM or governance there",
  ], 12.5);
  panel(s, "PIM", 8.8, 1.5, 3.95, 4.95, HEX.teal, HEX.tealTint, "HOW A ROLE REACHES A PERSON", "Eligible, never active", [
    "One role-assignable group per role and scope: PRV-T2-<role>-<AU>",
    "Membership by access package; reviewed quarterly",
    "No dynamic or nested members; set at creation; 500 per tenant",
    "Tier 2: 8-hour ceiling, justification and ticket, 180-day eligibility",
    "Activation limit 1–24 hours, set per role, tenant-wide",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — assign roles at AU scope; administrative units; restricted management AUs; role-assignable groups; PIM for Groups; PIM role settings. Book 15, Ch 04.");
  notes(s,
`Scope comes from administrative units (AUs), following Book 02. Authentication, Helpdesk, Password, User, Groups and License Administrator can all be assigned at AU scope; Application, Cloud Application and Hybrid Identity Administrator can't. At AU scope Microsoft restricts the role further: methods, password resets, sensitive properties and delete or restore apply only to members of the unit with no administrator role. So an AU-scoped help desk can't reset a limited administrator in its own unit; that goes to identity engineering. Each administrator assigned over a unit needs P1; members need only Free, unless membership is dynamic. A unit limits what a technician can change, not what they can see, and units can't be nested.

Some accounts should be out of the desk's reach even with no role: executives and their assistants. A restricted management unit means only administrators with a role at that unit's scope can change its members; tenant Global Administrators and Privileged Role Administrators can't edit the objects, though they can manage the unit, audited. The pattern: put executive accounts and devices in one, decided at creation because it can't change later; give a small executive-support group Authentication and Password Administrator over it, eligible with approval; give the general desk nothing. Don't put technicians in one, because members can't be managed by Entra ID Governance features, PIM included.

Roles reach technicians through Book 04's pattern, not one group holding every role: one role-assignable group per role and scope, named PRV-T2, role, AU, holding an eligible assignment; membership through an access package; a custom role for app assignments. Role-assignable groups also protect members, since only Privileged Authentication and Global Administrators can reset them, so one technician can't take over another's access. PIM settings are per role: Tier 2 is eligible only, an eight-hour ceiling, justification and ticket number, 180-day eligibility. The approval lives in the ticket, and shortening the ceiling changes it tenant-wide.`,
  "Book 15, Chapter 04, \"Scope: administrative units\" and \"How the roles reach a technician.\"");
}

// ================================================================== 13 TAP recovery
{
  const s = content(P1, "Recovery with a Temporary Access Pass");
  tag(s, "How");
  flow(s, "Steps", 1.5, 1.85, [
    { head: "1 Re-proof", body: "Against the record the agency holds; run the target check" },
    { head: "2 Revoke", body: "Sign out every session, invalidating refresh tokens" },
    { head: "3 Remove", body: "Delete the lost method, or require re-registration" },
    { head: "4 Issue", body: "One-time pass, shortest lifetime, to the verified person" },
    { head: "5 Register", body: "Stay while they bind a phishing-resistant method" },
    { head: "6 Notify", body: "Another channel; close with the evidence" },
  ], 11.5);
  table(s, "TAP", 3.55, [2.1, 10.05], ["Pass control", "What Microsoft documents"], [
    ["Who issues it", "Authentication Admin for members, not themselves; Privileged Authentication Admin for admins; the policy is Authentication Policy Admin's"],
    ["Lifetime", "Tenant minimum, maximum and default between 10 minutes and 30 days (defaults 1 hour and 8 hours); one pass per user"],
    ["One-time use", "Enforceable tenant-wide; the user must finish registering a passwordless method within 10 minutes"],
    ["Expiry", "Doesn't end sessions already established; Conditional Access sign-in frequency governs how long access lasts"],
    ["Limits", "Not with the NPS extension or the AD FS adapter; not for external guests; the value is shown once"],
  ], { fontSize: 12 });
  sources(s, "Sources: Microsoft Learn — Configure Temporary Access Pass; manage user authentication methods; NIST SP 800-63B-4 §4.2; CISA AA23-320A. Book 15, Ch 04; Appendix A.");
  notes(s,
`When a user has lost their only strong method, the desk has two tools the older design had neither of. Require re-register MFA deletes phones, Authenticator registrations and software OATH tokens and deactivates hardware tokens. Revoke sessions invalidates refresh tokens and forces reauthentication everywhere. Re-registration alone leaves a gap: the next sign-in, whoever makes it, registers the new method.

A Temporary Access Pass closes that gap. It's a time-limited passcode, single or multi-use, that lets a user sign in and register a new method, a passkey included, without the one they lost. The table carries its controls: who can issue it, lifetimes from ten minutes to thirty days, one-time use with ten minutes to register, expiry that doesn't end established sessions, and no NPS extension, AD FS adapter or guests.

The program's recovery sequence, run by an Authentication Administrator scoped to the user's unit against a supervisor-approved ticket: re-proof the user and run the target check; revoke sessions; delete the lost method, or require re-registration if several are lost; issue a one-time pass with the shortest lifetime the handover allows, to the verified person, never to an email address or a number given on the call; stay while they register a phishing-resistant method and confirm the old one is gone; then notify and close.

Re-proof, don't interview. For a workforce proofed at hiring, that follows 800-63B-4's repeated-proofing option: in person with the PIV card, or a supervised video session against the HR-sourced identity. And check the target before the method: any role, role-assignable group membership or restricted unit stops the desk. The pass policy settings belong to Book 04's authentication policy owners, not the help desk.`,
  "Book 15, Chapter 04, \"Identity proofing before any credential action\" and \"Temporary Access Pass and MFA re-registration\"; Appendix A.");
}

// ================================================================== 14 High-risk
{
  const s = content(P1, "High-risk tasks: two approvers besides the executor");
  tag(s, "Who");
  const b = table(s, "Risk", 1.5, [4.45, 3.05, 2.2, 2.45], ["High-risk task (design guidance)", "Who executes", "First approver", "Second approver"], [
    ["Reset or pass for an account the desk can't touch", "Privileged Authentication Admin, or the restricted unit's admins", "Owner's manager", "Security office"],
    ["ImmutableID or hard-match repair", "Identity engineering", "Its lead", "Identity governance officer"],
    ["Delete, disable or restore outside the HR lifecycle", "User Administrator, in identity engineering", "Owner's manager", "Identity governance officer"],
    ["Enterprise-app assignment to a Tier 1 application", "Help desk, custom assignment role", "Application owner", "Identity governance officer"],
    ["Bulk change: many users, one request", "Automation, under Book 13's change classes", "Change owner", "Change advisory board"],
  ], { fontSize: 12 });
  const top = b + 0.15, h = 6.5 - top;
  panel(s, "Immut", 0.6, top, 6.0, h, HEX.amber, HEX.amberTint, "WHY IMMUTABLEID LEFT THE HELP DESK", null, [
    "Matching runs only when a new object arrives from AD",
    "The usual fix is in AD: set mS-DS-ConsistencyGuid",
    "Since July 1, 2026 hard match is blocked for privileged targets",
  ], 12);
  panel(s, "SIEM", 6.75, top, 6.0, h, HEX.navy, HEX.navyTint, "THREE SIEM RULES RUN CONTINUOUSLY", null, [
    "An activation whose ticket number matches no assigned ticket",
    "A directory change by a help desk account with no ticket",
    "A forbidden action (consent, role, CA) alerts the SOC at once",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Entra Connect for an existing tenant (hard match); Graph user update; audit activity reference; FedRAMP AC-5, AC-6(9). Book 15, Ch 04.");
  notes(s,
`A task is high-risk in the program's design when one person could use it to take over an identity, break the link between an identity and its source of truth, or open an application to the wrong people, and the platform can't stop the misuse by itself. SP 800-53 asks for separated duties, AC-5, and logging of privileged functions, AC-6(9). The program's answer is two approvers besides the executor, both recorded in the ticket before any role is activated. Admin consent isn't on the list because the help desk never performs it at all.

The second approver checks three things the first may not: that the requester was verified and the record is in the ticket; that the change is exactly specified, with the target's object ID, values supplied by the authoritative source, and the rollback; and that the urgency is real. Pressure to skip a step routes to the supervisor's emergency change process, never past the second approver.

Why ImmutableID repair left the desk. Entra Connect evaluates hard match on the source anchor only when a new object arrives; changing an existing object to match produces an error. For the common duplicate-object conflict, Microsoft's fix is to set the on-premises user's mS-DS-ConsistencyGuid to the cloud user's ImmutableID, which is an AD change. From July 1, 2026, Entra blocks a hard match when the cloud account already has onPremisesObjectIdentifier set or holds or is eligible for a privileged role, and Microsoft advises blocking hard match except while taking over cloud-only accounts. So the desk detects, with sign-in failures, duplicates and stale sync times, and escalates; Appendix A has a read-only comparison script.

Each action leaves three records joined on the target and the time, the ticket, the PIM record and the directory audit entry, and three SIEM rules run on them. And the least-privileged role for reading logs is Reports Reader, plus Security Reader to see which Conditional Access policies applied.`,
  "Book 15, Chapter 04, \"The high-risk tasks and why they need a second approver\" and \"Evidence every action leaves\"; Appendix A, Hybrid identity.");
}
endModule("Module 2");

// ================================================================== 15 Module 3 divider
{
  const s = divider(P2, "Module 3: Catalogs, SaaS and the CMDB", "Part 2 — Catalogs, records and controls  ·  Chapters 05–07",
    ["The identity catalog, five verbs, and Teams emergency calling", "SaaS integrations: a verdict first, then least-privileged Graph", "The CMDB as a reconciled projection: duplicates and stale CIs"], 13);
  notes(s,
`Module 3: catalogs, SaaS and the CMDB. A service desk makes hundreds of identity changes a week, and done as portal clicks under standing administrator rights, each has no recorded reason, approval or proof. That's the largest steady source of control erosion in the estate.

The answer is a catalog: every routine change is a typed request against a named target, approved by the gate its control needs, executed by a machine or a scoped technician, and written back as a record. Then two places the catalog leans on: SaaS integrations, where an administrator can federate a third-party service in fifteen minutes, and the CMDB every ticket points at.`,
  "Book 15, Chapters 05–07.");
}

// ================================================================== 16 Identity catalog and verbs
{
  const s = content(P2, "The identity catalog: ten items, five verbs");
  tag(s, "What");
  table(s, "Catalog", 1.5, [2.35, 0.85, 2.95], ["Catalog item", "Control", "Approval gate (design guidance)"], [
    ["Joiner", "AC-2", "Manager and identity team"],
    ["Mover", "AC-6", "Manager and identity team"],
    ["Leaver", "AC-2", "Manager and identity team"],
    ["Password reset", "IA-5", "Self-service; else supervisor or manager after verification"],
    ["MFA method reset", "IA-5", "Supervisor or manager, after re-proofing; alerts"],
    ["Account unlock", "IA-5", "Self-service or the desk; repeats are a signal"],
    ["Group membership", "AC-6", "Group owner and an approver; time-bound if elevating"],
    ["License", "AC-2", "Manager; group-based licensing preferred"],
    ["CA exception", "AC-3", "Security approver; expiry and review (Book 04)"],
    ["Guest invitation", "AC-2", "Sponsor and security; expiry on every guest"],
  ], { fontSize: 11.5, minRow: 0.3 });
  const b = table(s, "Verbs", 1.5, [0.9, 1.55, 3.6], ["Verb", "Started by", "The closing check proves"], [
    ["Add", "HR joiner event", "Exactly the derived entitlements; MFA registered; every app has the account"],
    ["Move", "HR mover event", "The new derivation matches; old entitlements are gone"],
    ["Change", "Checked request", "Scope granted equals scope approved, nothing broader"],
    ["Delete", "HR separation", "Unusable everywhere; no sessions; nothing owned is ownerless"],
    ["Reset", "Checked request", "Re-proofed first; new credential meets policy; old one fails"],
  ], { x: 6.7, fontSize: 11.5 });
  panel(s, "Leaver", 6.7, b + 0.15, 6.05, 6.5 - b - 0.15, HEX.red, HEX.redTint, "THE LEAVER FAILS AUDITS (AC-2(3))", null, [
    "Disable, revoke sessions and tokens, deprovision every app, reassign owned objects",
    "Spoke: Disable User and Revoke Sessions; SCIM apps follow; others are manual tasks",
  ], 11.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-2, AC-2(3), AC-3, AC-6, IA-4, IA-5); ServiceNow — Entra ID spoke, sample offboarding flow. Book 15, Ch 05.");
  notes(s,
`Every catalog item runs the same loop: a typed request against the reconciled identity record, the approval its control requires, execution through the in-boundary connector under a scoped identity, and a change record that closes only when a read of the target confirms it.

The identity catalog has ten items in three families: lifecycle, credentials and access. The control column is SP 800-53; the approval gates are the program's design. Two items reuse existing patterns rather than building copies. The Conditional Access exception is a front door to Book 04's one exception path, with expiry and review.

Every identity operation is one of five verbs: add, move, change, delete or reset. Each starts from the authoritative record, is approved by the person with authority, runs under a just-in-time role, closes with a check, and emits evidence.

The leaver fails audits. AC-2(3) asks for disablement within a defined time. The leaver item disables the account, revokes sessions and refresh tokens, deprovisions every connected application, and reassigns everything owned, including service accounts and app registrations, because an ownerless non-human identity is a finding. The spoke documents Disable User and Revoke User SignIn Sessions, and its sample offboarding flow disables the user and removes groups. A SCIM-provisioned application receives the disable automatically; one that isn't becomes a manual task with no automatic check.`,
  "Book 15, Chapter 05 — The Service Catalogs, \"The loop every item runs,\" \"The identity catalog\" and \"Five verbs.\"");
}

// ================================================================== 17 Teams Phone
{
  const s = content(P2, "Teams Phone: emergency calling is the operator's duty");
  tag(s, "Why");
  panel(s, "Rules", 0.6, 1.5, 4.85, 4.95, HEX.red, HEX.redTint, "47 CFR PART 9 BINDS THE OPERATOR", "Kari's Law and RAY BAUM'S", [
    "Dial 911 directly, no prefix; notify a central point as the call starts",
    "MLTS includes VoIP and systems owned or leased by government agencies",
    "Whoever installs, manages or operates it configures dialing, notification, location",
    "Dispatchable location: validated street address plus floor or suite",
    "Fixed phones by Jan 6, 2021; non-fixed and off-premises by Jan 6, 2022",
  ], 12.5);
  table(s, "Teams", 1.5, [1.75, 5.15], ["Catalog item", "What it enforces in Teams"], [
    ["Address", "Validated before assignment; map search validates and geocodes; a gate on every number"],
    ["Network map", "LIS matches access point, switch port, switch, then subnet; changes take up to 4 hours"],
    ["Notification", "Emergency calling policy conferences the security desk; a site overrides a user"],
    ["Routing", "Direct Routing: routing policy, PIDF-LO on the SBC, and an ERSP or ELIN"],
    ["Web client", "No dynamic emergency calling there, so web PSTN calling is turned off"],
    ["Test and records", "933 test call closes the item; Graph call records last 30 days, so export them"],
  ], { x: 5.65, fontSize: 12 });
  txt(s, "Legal", [
    { text: "Guidance, not legal advice: ", options: { bold: true, color: HEX.red } },
    { text: "counsel and the telecommunications office decide whether the configuration meets the FCC rules; the catalog keeps the evidence that it was put in place and kept current." },
  ], { x: 5.65, y: 5.1, w: 7.1, h: 1.35, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: FCC 19-76; 47 CFR 9.3, 9.16; Microsoft Learn — PSTN options; emergency addresses; dynamic emergency calling; call records; PSTN usage report. Book 15, Ch 05.");
  notes(s,
`Teams Phone carries day-two work that's usually run by ad hoc administrator action. In GCC High and DoD, Direct Routing must be configured for Teams voice to work.

The emergency-address item is where a silent error has physical consequences, and where federal rules bind the agency directly. Kari's Law requires a multi-line telephone system to let a user dial 911 without a prefix and to notify someone, such as a front desk, when 911 is called, for systems installed after February 16, 2020. RAY BAUM'S Act Section 506 led to rules so a dispatchable location is conveyed with every 911 call. In 47 CFR part 9, an MLTS includes VoIP and systems owned or leased by governmental agencies; the person installing, managing or operating it must configure direct dialing, notification and dispatchable location. Fixed on-premises phones had to provide location by January 6, 2021, and non-fixed and off-premises devices by January 6, 2022. This is guidance, not legal advice; counsel and the telecommunications office own the determination.

Teams provides the mechanisms; the catalog keeps them configured. An address must be validated before it can be assigned, and the catalog makes it a gate for every connectivity option. The client sends its network connectivity to the Location Information Service, which matches access point, switch port, switch, then subnet; some changes take up to four hours to reach clients, so network-to-location mapping is its own item, raised whenever IPAM records a new subnet or access point. The web client doesn't support dynamic emergency calling, so web PSTN calling is off. A 933 test call is the closing check.

Call records last thirty days in Graph, and the PSTN report keeps 365 days for Calling Plans and 150 for Direct Routing in most countries, so records go to the evidence store at onboarding. Teams baseline drift under BOD 25-01 joins the Microsoft 365 loop in Module 4.`,
  "Book 15, Chapter 05, \"The telephony catalog\" and \"Emergency calling is the agency's obligation.\"");
}

// ================================================================== 18 SaaS verdict
{
  const s = content(P2, "SaaS integrations: a verdict before any configuration");
  tag(s, "What");
  img(s, "ch06-who-versus-whether", "Consent restriction answers who may approve an integration; only an authorization verdict answers whether the service may hold the data. Consent alone lets data leave the boundary; the integration proceeds only when both are answered.",
    0.6, 1.5, 5.9, 3.2);
  txt(s, "Consent", [
    { text: "BOD 25-01 consent baseline: ", options: { bold: true, color: HEX.navy } },
    { text: "admins register apps (MS.AAD.5.1v1), user consent restricted (5.2v1), an admin consent workflow (5.3v1). Good controls; they settle who, not whether, so they don't close SA-9." },
  ], { x: 0.6, y: 4.85, w: 5.9, h: 1.6, fontSize: 12.5, valign: "middle" });
  panel(s, "Verdict", 6.75, 1.5, 6.0, 4.95, HEX.amber, HEX.amberTint, "PHASE 1: THE GATE", "No verdict, no configuration", [
    "Record the service, owner, need and the identity attributes it will receive",
    "Threshold (design guidance): FedRAMP Certified, Class C or higher",
    "Below it: a risk decision for the authorizing official, not the catalog",
    "Read the Marketplace dataset on a schedule; stamp its last-change time",
    "Oct 21, 2026: all 42 Li-SaaS listings carry Class B",
    "Name matching feeds a review queue, never an 'unauthorized' verdict",
    "Provisioning (replica) path: interconnection agreement first (CA-3)",
  ], 12.5);
  sources(s, "Sources: CISA BOD 25-01 required configurations; FedRAMP 2026 rules; FedRAMP Marketplace products.json; Microsoft Learn — gallery risk scores, GCC identity. Book 15, Ch 06.");
  notes(s,
`An administrator can open the gallery, follow the vendor's tutorial and configure SAML single sign-on and SCIM provisioning in about fifteen minutes. Chapter 06 calls onboarding the densest control-closing moment in the identity estate: SCIM is automated account management, the separation event reaching the vendor is disablement, the signing certificate is an authenticator, the service principal is a component, the assignment is access enforcement. Each is closed during onboarding or silently skipped.

Three facts put the gate on the agency. GCC pairs with the public Entra ID and calls the worldwide Graph endpoints, so it sees the full commercial gallery; nothing is blocked or marked. Nothing in the vendor path asks about authorization: the gallery's risk scores are useful, but they aren't a verdict. And FedRAMP's 2026 rules say the authorizing official accepts risk for the agency's use of a cloud service, including the integrations enabled.

The consent baseline is the strongest alternative a reviewer will propose. BOD 25-01 requires admin-only registration, restricted user consent, and an admin consent workflow. The program applies them, but they govern who approves, not whether the far-end service is authorized to hold federal data. Every check can pass and data still leaves the boundary.

So phase 1 configures nothing. The verdict is the gate. The program's default for identity data is FedRAMP Certified at Class C or higher, the former Moderate and High; anything lower goes to the authorizing official as a risk decision. FedRAMP publishes the Marketplace as a machine-readable dataset, so the catalog reads it on a schedule and date-stamps each verdict. In the October 21, 2026 data, the 42 Li-SaaS listings all carry Class B. Name matching is a heuristic, so tooling produces a review queue, never an unauthorized verdict. A standing replica needs an interconnection agreement before provisioning. Phases 2 to 7 follow: register, credentials, provision, lifecycle, evidence, attest and exit.`,
  "Book 15, Chapter 06 — SaaS Integration Governance, \"Why the gate has to be the agency's,\" \"Consent restriction answers who, not whether\" and \"Phase 1.\"");
}

// ================================================================== 19 Graph surface
{
  const s = content(P2, "The least-privileged Graph surface for SaaS");
  tag(s, "How");
  const b = table(s, "Graph", 1.5, [2.85, 5.6, 3.7], ["Operation", "Graph call", "Least-privileged application permission"], [
    ["Add a gallery or non-gallery app", "POST /applicationTemplates/{id}/instantiate", "Application.ReadWrite.OwnedBy"],
    ["Set the single sign-on mode", "PATCH /servicePrincipals/{id} (preferredSingleSignOnMode)", "Application.ReadWrite.OwnedBy"],
    ["Create a signing certificate", "POST /servicePrincipals/{id}/addTokenSigningCertificate", "Application.ReadWrite.OwnedBy"],
    ["Create the provisioning job", "POST /servicePrincipals/{id}/synchronization/jobs (created disabled)", "Application.ReadWrite.OwnedBy"],
    ["Push one user now", "POST …/jobs/{jobId}/provisionOnDemand (5 per 10 seconds)", "Application.ReadWrite.OwnedBy"],
    ["Assign a group to the app", "POST /servicePrincipals/{id}/appRoleAssignedTo", { text: "AppRoleAssignment.ReadWrite.All", options: { color: HEX.red, bold: true } }],
  ], { fontSize: 11.5 });
  facts(s, "Fix", b + 0.15, 6.5 - b - 0.15, [
    ["OwnedBy is enough", HEX.navy, HEX.navyTint, "Synchronization.ReadWrite.All is higher-privileged and would undo the ownership boundary"],
    ["Assignment grants anything", HEX.red, HEX.redTint, "Keep it off the connector: a PIM-activated person binds the access group once"],
    ["Self-signed only", HEX.amber, HEX.amberTint, "The certificate call can't apply agency policy; upload instead. Not in GCC High or DoD"],
  ], 12);
  sources(s, "Sources: Microsoft Learn — Graph v1.0 instantiate, servicePrincipal, addTokenSigningCertificate, synchronization, appRoleAssignedTo; permissions reference. Book 15, Ch 06.");
  notes(s,
`The catalog executes through Microsoft Graph from the in-boundary connector. The source design proposed a permission set; checked against the Graph reference, the operations are right but the permissions aren't, and the corrections matter more than the methods.

Adding a gallery or non-gallery application, setting the single sign-on mode, creating a signing certificate, creating the provisioning job, storing provisioning credentials and pushing one user on demand all list Application.ReadWrite.OwnedBy as the least-privileged application permission.

Three corrections. First, Application.ReadWrite.OwnedBy is enough, and Synchronization.ReadWrite.All isn't needed. OwnedBy allows the same operations as ReadWrite.All but only on applications and service principals the calling app owns, though it can still list every app in the tenant. Adding the tenant-wide synchronization permission would undo the ownership boundary the design relies on. Second, assignment needs a permission that can grant anything. Assigning users or groups through appRoleAssignedTo requires AppRoleAssignment.ReadWrite.All, and Microsoft warns that such permissions let an app grant additional privileges to itself, other apps or any user. A connector holding it is effectively a privileged administrator, so the program keeps it off: a person in the approved role, activated through PIM against the ticket, binds the application's access group once, and ongoing access is group membership. Third, addTokenSigningCertificate creates a self-signed certificate, valid up to three years, and isn't available in GCC High or DoD. It's fine for a short-lived certificate on controlled rotation, but it can't place a certificate issued under the agency's policy; that's an upload.

The connector refuses execution when the change record is unapproved or the approver equals the requester. Negative tests prove the refusals, including configuring without a verdict. And the book's limit is candid: measure the population first with its read-only inventory script, and scale the catalog to what it finds.`,
  "Book 15, Chapter 06, \"The actuation surface, least privilege first,\" \"Tests that would prove the design wrong\" and \"Honest limits.\"");
}

// ================================================================== 20 CMDB projection
{
  const s = content(P2, "The CMDB is a projection of the naming plane");
  tag(s, "What");
  img(s, "ch07-reconcile-pass", "One incoming record: the platform identifies the CI and decides which source may write each attribute; the program's pass then matches it to the naming plane by authoritative name or address first and cloud resource ID second, and either binds it or raises a shadow-asset finding or a naming-plane gap.",
    0.6, 1.5, 5.9, 3.65);
  txt(s, "Baselines", [
    { text: "CM-8 in SP 800-53B: ", options: { bold: true, color: HEX.navy } },
    { text: "Moderate selects CM-8, (1) and (3); High adds (2) and (4). The program uses (4), (6), (7) and (9) at every level (design guidance)." },
  ], { x: 0.6, y: 5.3, w: 5.9, h: 1.15, fontSize: 12.5, valign: "middle" });
  table(s, "Recon", 1.5, [1.95, 4.1], ["Step", "What it decides"], [
    ["IRE identification", "Is this record an existing CI or a new one?"],
    ["IRE reconciliation", "Which source may write which attribute of a class"],
    ["IRE data source rules", "Which sources may not create a class at all"],
    [{ text: "Program: match", options: { color: HEX.teal } }, "Naming-plane name or address first, cloud resource ID second, never the reverse"],
    [{ text: "Program: bind", options: { color: HEX.teal } }, "The authoritative identity becomes the CI's asset_id"],
    [{ text: "Program: flag", options: { color: HEX.teal } }, "Shadow asset (CM-8(3) finding) or naming-plane gap, fixed in IPAM, never in the CMDB"],
  ], { x: 6.7, fontSize: 12 });
  txt(s, "Cadence", [
    { text: "BOD 23-01 cadence: ", options: { bold: true, color: HEX.navy } },
    { text: "automated asset discovery every 7 days, vulnerability enumeration every 14, results to the CDM dashboard within 72 hours. That stream is what the pass reconciles." },
  ], { x: 6.7, y: 4.75, w: 6.05, h: 1.7, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: NIST SP 800-53 Rev. 5 CM-8, SP 800-53B, SP 800-128; CISA BOD 23-01; ServiceNow — Discovery, SGC for Azure, IRE, reconciliation rules. Book 15, Ch 07.");
  notes(s,
`A compliance task is only as good as the asset it names, and that pointer is the CMDB's job. The program's position: discovery and connectors populate the CMDB, and the authoritative naming and addressing record, IPAM and DDI, governs identity. Where they disagree the CMDB is wrong by definition, and the disagreement is a finding. A scanner reports what it found, not what the agency decided should exist; SP 800-128 says the inventory is populated through discovery, but owners and unique identifiers still have to be decided by people.

CM-8 asks for an inventory that's accurate, complete, without duplicate accounting, and reviewed on a set frequency, and its discussion says preventing duplicates needs a unique identifier per component, warning that scanning IPv4 and IPv6 can surface one component twice. Moderate selects CM-8, CM-8(1) and CM-8(3); High adds CM-8(2) and (4).

CIs come from connectors, never hand entry: Discovery through a MID Server inside the network, the Service Graph Connector for Azure through the Identification and Reconciliation Engine, and Resource Graph's change feed between full loads. Configuration objects such as Conditional Access policies are CIs too, so a drift task names the exact object.

IRE already prevents duplicates and lets only authoritative sources write: identification rules, reconciliation rules by attribute, and data source rules that stop sources creating a class. It updates last_discovered and discovery_source on every payload. That answers "is this the same CI?" It doesn't answer "is this the asset the naming plane says exists?" So the program adds a pass: match by authoritative name or address first and cloud ID second; bind the authoritative identity as asset_id, the evidence contract's join key; flag anything unmatched. A shadow asset is a CM-8(3) finding; an authorized but unrecorded one is fixed in IPAM and flows back.`,
  "Book 15, Chapter 07 — The CMDB and Asset Identity, \"What CM-8 asks,\" \"Where configuration items come from\" and \"How the platform reconciles.\"");
}

// ================================================================== 21 Duplicates and stale
{
  const s = content(P2, "Duplicates, stale CIs and what they break");
  tag(s, "How");
  const b = table(s, "Defects", 1.5, [2.4, 4.95, 4.8], ["CMDB defect", "What it does to patching", "What it does to evidence"], [
    ["Missing CI (shadow)", "Never scanned or patched; in no window", "Coverage looks complete: the denominator is wrong"],
    ["Duplicate CI", "The fix lands on one copy; the finding stays open on the other", "Two partial histories; neither proves the fix"],
    ["Stale CI", "Work routed to an asset that no longer exists", "Percentages computed over phantoms"],
    ["No owner", "The task sits unassigned until its window lapses", "No one to attest; a CM-8(4) gap"],
    ["Cloud ID only", "Breaks when the resource is redeployed", "History splits at every redeployment"],
  ], { fontSize: 12 });
  const top = b + 0.15, h = 6.5 - top;
  panel(s, "Dup", 0.6, top, 6.0, h, HEX.navy, HEX.navyTint, "DUPLICATES: BIND, DON'T DELETE", null, [
    "They come from the sources: reimages, Defender merged IDs, IPv4 and IPv6 scans",
    "Health counts each duplicate set as its size minus one",
    "Move tickets and findings to the survivor before retiring the rest",
  ], 12);
  panel(s, "Stale", 6.75, top, 6.0, h, HEX.amber, HEX.amberTint, "STALE: DETECT, ATTEST, RETIRE, THEN DELETE", null, [
    "Entra's activity timestamp isn't an audit: under 21 days isn't stale",
    "Health default: stale after 60 days; Data Manager attests per Managed By Group",
    "Entra: disable first; a deleted device takes its BitLocker keys",
  ], 12);
  sources(s, "Sources: Microsoft Learn — manage stale Entra devices; DeviceInfo; ServiceNow — CMDB Health metrics, CMDB Data Manager; NIST SP 800-53 CM-8. Book 15, Ch 07.");
  notes(s,
`An inventory row says what exists; evidence also needs when. The join key is authoritative asset identity plus time, and each source means something different by "last seen." The CMDB's last_discovered changes whenever a source vouches for a CI, not when the asset was used. Entra's device timestamp, ApproximateLastSignInDateTime, isn't an audit: it's replaced only when the new value is more than about fourteen days newer, so Microsoft advises against treating anything younger than 21 days as stale. So every evidence attribute carries its observation time and source, and joins use the evidence record's observed_at, not the CMDB refresh time.

Duplicates are CM-8's first named failure, and they come from the sources. Entra sees them after reimages, and Defender keeps merged device IDs. ServiceNow's CMDB Health counts duplicates in its correctness score, as each set's size minus one. The program resolves a duplicate by binding, not deleting: match the set to one naming-plane identity, keep the CI that carries it, and move the tickets, changes and findings before retiring the others. Deleting the wrong one first is how an open vulnerability loses its asset and stops counting.

A stale CI is the opposite failure, just as costly. CMDB Health calls a CI stale after its effective duration, sixty days by default, and Data Manager turns that into lifecycle work, with attestation tasks per Managed By Group. Microsoft's stale-device guidance shows why sequence matters: disable first and delete after a grace period, because deleted devices can't be recovered and take their BitLocker recovery keys. The program's lifecycle: detect, attest through the owning group, retire with history while updating the naming plane, and archive or delete only after attached work is closed, within the records schedule.

The table shows why patching depends on this: CM-8 is the precondition for SI-2 at scale.`,
  "Book 15, Chapter 07, \"The join key,\" \"Duplicate CIs,\" \"Stale CIs,\" \"Why patching and evidence depend on it\" and \"Measuring the inventory.\"");
}
endModule("Module 3");

// ================================================================== 22 Module 4 divider
{
  const s = divider(P2, "Module 4: Control automation and who runs it", "Part 2 — Catalogs, records and controls  ·  Chapters 08–10",
    ["One loop on Microsoft 365 and Azure, and three routes in", "AWS without Audit Manager, and the VMware evidence gap", "Who executes, who approves, and who owns each artifact"], 13);
  notes(s,
`Module 4: control automation, and who runs it. Microsoft, AWS and Broadcom already ship tools that test most of the settings an assessor asks about. That isn't the gap. The gap is that a native console shows current state, while an assessor needs to know, for each finding, who owns it, what clock they work against, who approved the change or exception, and what re-test showed it closed.

So the program runs one loop on every surface, then asks how results reach the ITSM platform in each cloud, where the government clouds differ, and who decides what along the way.`,
  "Book 15, Chapters 08–10.");
}

// ================================================================== 23 Loop and M365
{
  const s = content(P2, "One loop, and the Microsoft 365 evidence sources");
  tag(s, "How");
  img(s, "ch08-one-loop", "One loop on every surface: test with the native tool, detect drift against the baseline, raise a typed task against the CMDB configuration item, actuate on the native surface, and close with evidence on the next test; exceptions become requests with an approver and an expiry.",
    0.6, 1.5, 5.5, 3.7);
  txt(s, "TwoRules", [
    { text: "Two rules: ", options: { bold: true, color: HEX.navy } },
    { text: "the coordination platform reads control state and never writes it; a task closes on a re-test, not a click (design guidance)." },
  ], { x: 0.6, y: 5.35, w: 5.5, h: 1.1, fontSize: 12.5, valign: "middle" });
  table(s, "M365", 1.5, [1.95, 4.5], ["Source", "What it gives day two"], [
    ["ScubaGear", "SCuBA results in JSON with stable IDs such as MS.AAD.1.1v1; -M365Environment gcc, gcchigh or dod; an omission is an exception with an expiry"],
    ["Graph: Conditional Access", "Policy.Read.All, Global or Security Reader; graph.microsoft.com for GCC, .us for GCC High, dod-graph for DoD"],
    ["Purview audit", "Management Activity API per cloud; Standard keeps 180 days, Premium one year by default, up to ten"],
    ["Compliance Manager", "A readiness signal, not the evidence of record; 24-hour refresh; continuous assessments still rolling out in GCC"],
  ], { x: 6.3, fontSize: 12 });
  txt(s, "Purview", [
    { text: "Data protection is change-controlled too: ", options: { bold: true, color: HEX.navy } },
    { text: "a label taxonomy or DLP rule change carries a change record; a user override of a DLP block opens an incident with a review task (design guidance)." },
  ], { x: 6.3, y: 4.7, w: 6.45, h: 1.75, fontSize: 12.5, valign: "middle" });
  sources(s, "Sources: CISA ScubaGear v1.8.0, BOD 25-01; Microsoft Learn — Graph CA list, national clouds; Management Activity API; Purview audit; Compliance Manager. Book 15, Ch 08.");
  notes(s,
`The loop has five steps: test with the native tool, detect drift, raise a typed task against the configuration item with the control, severity and due date, actuate natively, and close with evidence on the next test.

Two rules hold it together. The coordination platform reads; it doesn't write. And a task closes on a re-test, which is why step one runs on a schedule, not on demand.

On Microsoft 365, ScubaGear checks the tenant against the SCuBA baselines. For day two the JSON matters: each result carries a stable policy ID, such as MS.AAD.1.1v1, legacy authentication blocked, so the mapping from policy to task is data. An omission becomes an exception record with an approver and an expiry, not a line in a config file.

Graph reads Conditional Access with Policy.Read.All, as Global Reader or Security Reader. GCC keeps graph.microsoft.com; GCC High uses graph.microsoft.us and DoD dod-graph.microsoft.us, each with an app registration in that cloud. That read catches an exclusion still present after its request expired, a high-severity finding.

Purview's unified audit log comes through the Management Activity API, with its own endpoint per cloud. Compliance Manager is the closest Microsoft product. It's a readiness signal, not the evidence of record, because Microsoft itself says a high score isn't an absolute measure of compliance, and in GCC continuous assessments are still rolling out.`,
  "Book 15, Chapter 08 — Control Compliance Automation: Microsoft 365 and Azure, \"One loop on every surface\" and \"Microsoft 365: what produces the evidence.\"");
}

// ================================================================== 24 Azure
{
  const s = content(P2, "Azure: Policy, Defender for Cloud and Resource Graph");
  tag(s, "What");
  panel(s, "Policy", 0.6, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "AZURE POLICY", "FedRAMP initiatives", [
    "FedRAMP Moderate built-in, and a separate Azure Government one",
    "\"Compliant\" covers only the definitions: a partial view",
    "Daily cycle; a changed resource shows in about 15 minutes",
    "Exemption: Waiver or Mitigated, expiresOn; the object is kept",
    "Exemptions only from an approved ITSM request (design guidance)",
  ], 12.5);
  panel(s, "MDC", 4.7, 1.5, 3.95, 4.95, HEX.teal, HEX.tealTint, "DEFENDER FOR CLOUD", "Regulatory compliance", [
    "Standards are Policy initiatives; manual controls greyed out",
    "Any plan except Servers Plan 1 or APIs Plan 1",
    "FedRAMP High and Moderate; 800-53 R5.1.1 on Azure, AWS, Google",
    "Export and workflow automation GA in Azure and Azure Government",
    "Export sends on change: silence isn't proof",
  ], 12.5);
  panel(s, "ARG", 8.8, 1.5, 3.95, 4.95, HEX.amber, HEX.amberTint, "AZURE RESOURCE GRAPH", "The read path", [
    "PolicyResources: policystates",
    "SecurityResources: regulatorycompliancestandards, with passed and failed counts",
    "Exempt resources queryable too",
    "Generally available in Azure Government",
    "1,000 records per request: page with a skip token",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — FedRAMP Moderate initiatives; Policy compliance data; exemption structure; Defender for Cloud standards, support matrix; Resource Graph. Book 15, Ch 08.");
  notes(s,
`Azure Policy publishes regulatory compliance built-in initiatives, including FedRAMP Moderate for Azure and a separate FedRAMP Moderate for Azure Government, with its own definitions. Microsoft's caveat is the most important sentence to carry into an assessment: compliant refers only to the policy definitions themselves and doesn't ensure you're fully compliant with a control; it's a partial view. So the initiative is a source of findings for the settings it covers, not a verdict on a control.

Timing matters for the record. Azure Policy re-evaluates in a standard cycle every 24 hours; a new or updated resource's result appears about fifteen minutes after the change. A task closed on "the next evaluation" closes up to a day after the fix, and the record carries the evaluation time.

Exceptions have a native form. An exemption is a Waiver, the non-compliance temporarily accepted, or Mitigated, the intent met another way, with an optional expiresOn. When it passes, the exemption stops being honored but the object isn't deleted. In the program's design every exemption comes only from an approved ITSM request with the expiry set, and an exemption created any other way is itself a finding.

Defender for Cloud's regulatory compliance dashboard presents standards that are Policy initiatives underneath. Assigning a standard needs any Defender plan except Servers Plan 1 or APIs Plan 1. Export sends on state change, so silence isn't proof that nothing is open.

Resource Graph is the simplest read-only path: policy states in PolicyResources, Defender's per-standard state in SecurityResources, and exemptions. It's generally available in Azure Government and returns at most a thousand records per request, so a collector pages with a skip token.`,
  "Book 15, Chapter 08, \"Azure: what produces the evidence.\"");
}

// ================================================================== 25 Routes and clock
{
  const s = content(P2, "Three routes into the ITSM platform, one clock");
  tag(s, "How");
  const b = table(s, "Routes", 1.5, [1.85, 4.3, 3.0, 3.0], ["Route", "What it does", "Government clouds", "Program treatment"], [
    ["Vendor connector", "Defender for Cloud's ServiceNow integration opens incidents, changes or problems from recommendations; syncs every 24 hours", "Needs Defender CSPM; GA in Azure, not in Azure Government", "A routing convenience, not the evidence record"],
    ["Platform import", "ServiceNow Configuration Compliance imports Defender results and matches CMDB records; it doesn't calculate them", "Depends on what the instance and scope can reach", "Strong where licensed"],
    ["Program collector", "A read-only identity reads Resource Graph, Graph and ScubaGear output and writes evidence records", "Works in every cloud, endpoints set per cloud", "The default; the only route covering ScubaGear"],
  ], { fontSize: 12 });
  const top = b + 0.15, h = 6.5 - top;
  panel(s, "Clock", 0.6, top, 6.0, h, HEX.red, HEX.redTint, "THE CLOCK ON EACH TASK", null, [
    "Vulnerabilities and patches: BOD 26-04 (June 10, 2026), by exposure and KEV",
    "FedRAMP's PAIN timeframes bind providers; not the agency's queue",
    "Configuration findings: the program's service level per severity",
  ], 12);
  panel(s, "SN", 6.75, top, 6.0, h, HEX.navy, HEX.navyTint, "SERVICENOW'S OWN PRODUCTS", null, [
    "CAM: RMF steps, 800-53A objectives, POA&M, OSCAL SSP import and export",
    "Configuration Compliance imports results; none supplies the agency's mapping",
    "One route per source: two routes means two tasks and two clocks",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Defender for Cloud ServiceNow integration, support matrix; ServiceNow — Configuration Compliance, CAM; CISA BOD 26-04; FedRAMP VDR. Book 15, Ch 08.");
  notes(s,
`There are three ways a result reaches the ITSM platform, and the program uses whichever the agency can run in its own cloud, always landing the same evidence record.

The vendor connector: Defender for Cloud's ServiceNow integration creates and links incidents, changes or problems from recommendations, synchronizing every 24 hours. It needs the Defender CSPM plan and is generally available in Azure but not in Azure Government. The GCC case is easy to get wrong: GCC tenants pair with Entra ID in commercial Azure, so a GCC agency's Defender subscriptions are usually commercial, where the connector works; an agency on Azure Government can't use it. The platform import: ServiceNow Configuration Compliance imports Defender test results and matches them to CMDB records; it imports results, it doesn't calculate them. The program collector: a read-only service identity reads Resource Graph, Graph and ScubaGear output and writes evidence-contract records that open or update tasks. It works in every cloud and is the only route that also covers ScubaGear. Routes can be combined, but each source feeds through exactly one; two routes for one finding make two tasks with two clocks.

Every task carries a due date, and its source matters. For vulnerabilities and patches the agency's clock is BOD 26-04, Prioritizing Security Updates Based on Risk, June 10, 2026, which sets deadlines by public exposure and whether the vulnerability is in the Known Exploited Vulnerabilities catalog, and is mandatory for federal civilian agencies. The source volume used FedRAMP's PAIN timeframe table instead; those rules apply to providers with FedRAMP certifications and state their timeframes as SHOULD.

ServiceNow's Continuous Authorization and Monitoring, a separate subscription, can hold the authorization-level roll-up. What none of these products supplies is the agency's own mapping from native result to typed task, exception rule and re-test closure.`,
  "Book 15, Chapter 08, \"Getting results into the ITSM platform,\" \"The clock on each task\" and \"Where ServiceNow's own products overlap.\"");
}

// ================================================================== 26 AWS
{
  const s = content(P2, "AWS: Config and Security Hub CSPM, not Audit Manager");
  tag(s, "What");
  const b = table(s, "AWS", 1.5, [2.1, 4.05, 3.15, 2.85], ["Service", "What it gives the loop", "AWS GovCloud (US)", "Keep in mind"], [
    ["Config conformance packs", "FedRAMP Low, Moderate, High and NIST 800-53 rev 5 sample packs; per-resource results with run times", "Both Regions; remediation documents conflict across AWS pages: test", "Samples don't guarantee compliance; rev 5 pack primary (design guidance)"],
    ["Security Hub CSPM", "FSBP, CIS AWS Foundations and a NIST 800-53 Rev. 5 subset; ASFF findings", "Both Regions; shorter integration list; no Patch Manager", "No backfill; 90-day retention; auto-resolves"],
    ["New Security Hub", "Correlates CSPM, Inspector, Macie, GuardDuty", "Since Mar 30, 2026; no third-party integrations", "Its ServiceNow integration is commercial only"],
    ["Patch Manager", "Patch compliance against the agency's baseline", "Patch data from Systems Manager directly", "Point-in-time snapshot; BOD 26-04 clock"],
    [{ text: "Audit Manager", options: { color: HEX.red } }, "Maintenance mode since Apr 30, 2026; no new frameworks", "No GovCloud endpoint", "FedRAMP framework is Rev. 4: don't build on it"],
  ], { fontSize: 11.5 });
  callout(s, "SMC", b + 0.15, 6.5 - b - 0.15, "FaPlugCircleXmark", HEX.amber, "Connector deadline: ",
    "AWS's Service Management Connector for ServiceNow took no new customers after March 31, 2026; support ends March 31, 2027. Plan the move now.");
  sources(s, "Sources: AWS docs — Config conformance packs and samples; GovCloud Config; Security Hub CSPM and GovCloud; Audit Manager availability change; SMC end of support. Book 15, Ch 09.");
  notes(s,
`AWS Config evaluates resources with rules, and a conformance pack is a collection of rules and remediation actions deployed as one entity. AWS is as plain as Microsoft about limits: the samples aren't designed to ensure compliance, and the FedRAMP Moderate page aligns to a subset without saying which baseline revision it maps. So for a Rev. 5 system the program uses the rev 5 pack as the primary mapping and the FedRAMP pack as a cross-check. Both AWS locations are valid for a Moderate system: AWS lists US East and West at Class C, formerly Moderate, and GovCloud at Class D, formerly High, which includes the Moderate controls, and it lists FedRAMP scope per service and per Region. An agency may run most workloads in GovCloud at Moderate and a contact center in a commercial Region. The column on the slide shows where GovCloud differs. On remediation in GovCloud, the Config guide lists both Regions as supporting remediation actions, but the GovCloud user guide says the SSM documents for Config remediation aren't available. Test in a GovCloud account and plan on the agency's own Automation documents.

Security Hub CSPM runs control checks against standards including FSBP, a NIST 800-53 Rev. 5 standard that supports a subset, and the CIS AWS Foundations Benchmark, versions 5.0.0 back to 1.2.0 with 5.0.0 recommended, available in every Region where Security Hub CSPM runs. For a civilian agency the CIS standard is the published hardening benchmark for the account layer. Three properties shape the loop: no backfill, so the first cycle is a baseline; findings kept 90 days after the last update, so copy them to the evidence store; and automatic resolution when a control passes, which means a synced ticket can close itself. In GovCloud, Patch Manager isn't on the integration list, so patch compliance comes from Systems Manager. The new AWS Security Hub reached GovCloud on March 30, 2026, without third-party integrations, so its ServiceNow integration is commercial only.

Audit Manager is no longer a foundation. From April 30, 2026 it can't be set up in new accounts, and AWS adds no new frameworks. It has no GovCloud endpoint, and its FedRAMP framework is Rev. 4, with 36 automated and 289 manual controls for Moderate. And the Service Management Connector ends support March 31, 2027; the program's collector reads Config and Security Hub CSPM through the APIs, and EventBridge can push finding changes.`,
  "Book 15, Chapter 09 — Control Compliance Automation: AWS and VMware, \"AWS: what produces the evidence.\"");
}

// ================================================================== 27 VMware
{
  const s = content(P2, "VMware: the evidence the agency produces itself");
  tag(s, "Why");
  panel(s, "Gap", 0.6, 1.5, 3.9, 3.6, HEX.red, HEX.redTint, "THE ON-PREMISES GAP", "Nothing to inherit", [
    "Nothing below the guest is visible to the guest",
    "No provider publishes the control mapping",
    "The compliance feature changed between VCF 9.0 and 9.1",
  ], 12.5);
  table(s, "VCF", 1.5, [2.15, 3.55, 2.4], ["Tool", "The test it provides", "Condition"], [
    ["vSphere Configuration Profiles", "One desired host configuration per cluster, as JSON; drift and remediation", "Image-managed; ESX 8.0 U1+, vCenter 9.0+; permanent"],
    ["vLCM images", "Hosts assessed against a desired image", "Baselines deprecated for upgrades in 9.0"],
    ["Security Posture Management (9.1)", "VCF hardening guide, PCI DSS v4.0.1, VCF 9 General Controls; CSV export", "No 800-53 benchmark; the guide is the vendor baseline"],
    ["CIS ESXi 8.0 and 9.0", "Vendor-neutral host benchmarks, a cross-check on the vendor guide", "The agency picks its CM-6 settings"],
  ], { x: 4.65, fontSize: 12, minRow: 0.7 });
  callout(s, "Collector", 5.3, 1.15, "FaRoute", HEX.navy, "Collector by default: ",
    "no verified VMware-to-ServiceNow compliance integration. Where no machine reaches, a recorded, time-boxed privileged session is a declared exception.");
  sources(s, "Sources: Broadcom TechDocs — vSphere Configuration Profiles, vLCM, VCF Operations 9.0, 9.1 (Security Posture Management); CIS ESXi; VCF blog — Cyber Compliance. Book 15, Ch 09.");
  notes(s,
`The hypervisor, the virtual network and the management plane are the agency's to operate and patch, there's no provider authorization for them, and every piece of evidence about that layer is the agency's to produce. Three facts make it the hardest part to evidence: an agent in a virtual machine can't assess the ESX host beneath it; no provider publishes a FedRAMP or 800-53 mapping, so mapping Broadcom's hardening content to the agency's baseline is the agency's work; and the tooling changed between VCF 9.0 and 9.1.

vSphere Configuration Profiles sets one desired configuration for all hosts in a cluster. It needs a cluster managed with a vSphere Lifecycle Manager image, hosts at ESX 8.0 Update 1 or later, and vCenter 9.0 or later; baseline clusters use Host Profiles, and switching is permanent. vLCM images are the patch test: in vSphere 9.0, using baselines to upgrade is deprecated, and images must be used for hosts at 8.0 and later. So one image move unlocks both tests, and in the program's design a cluster still on baselines is its own finding with a migration date.

In VCF 9.1 the compliance benchmarks of VCF Operations, formerly Aria Operations, which included DISA and NIST 800-53 R5, were deprecated in favor of Security Posture Management. No 800-53 benchmark is listed, so an agency moving to 9.1 can lose the 800-53 view it had.

For a Moderate civilian agency the baseline is Broadcom's own VMware Cloud Foundation Security Configuration and Hardening Guide, which Security Posture Management measures, with CIS's ESXi 8.0 and 9.0 benchmarks as a cross-check, written as the agency's CM-6 settings. Broadcom's DISA STIG readiness content is High only: an optional reference, not a civilian requirement. An agency that borrows it records the readiness-guide version, because identifiers will change.

No current VMware-to-ServiceNow compliance integration could be verified, so the collector is the default. Where no machine reaches, Book 13's rule applies: a declared, time-boxed, proxied, recorded privileged session, closing a task as a documented process, never a pipeline-validated change.`,
  "Book 15, Chapter 09, \"VMware: the on-premises evidence gap\" and \"One contract, four platforms.\"");
}

// ================================================================== 28 Who runs day two
{
  const s = content(P2, "Who runs day two: one decider per row");
  tag(s, "Who");
  table(s, "RACI", 1.5, [3.75, 2.1, 1.95], ["Decision (design guidance)", "Decides", "Does the work"], [
    ["Identity-verification procedure", "CISO", "Service desk, ITSM team"],
    ["Authority class and routing", "IGO", "Service desk, ITSM team"],
    ["Routine credential task, ordinary user", "Desk supervisor", "Technician"],
    ["A catalog item's purpose and steps", "Platform owner", "ITSM platform team"],
    ["The approval gate an item enforces", "CISO; IGO for access", "ITSM platform team"],
    ["Change to ITSM approval rules or integrations", "CAB", "ITSM platform team"],
    ["CI class model and reconciliation rules", "CMDB owner", "ITSM platform team"],
    ["Naming-plane identity of an asset", "DDI team", "DDI team"],
    ["L4 class, reauthorization, open-ended exception", "Authorizing official", "System owner, ISSO"],
  ], { fontSize: 12 });
  panel(s, "Sep", 8.55, 1.5, 4.2, 4.95, HEX.teal, HEX.tealTint, "SEPARATIONS THE PLATFORM ENFORCES", null, [
    "Executors don't approve; approver and executor must differ",
    "Nobody changes the gate they pass through",
    "The CMDB owner doesn't edit identity",
    "The CAB authorizes changes; it doesn't accept risk",
    "CM process not written by those it governs (CM-9(1))",
    "The AO stays outside: government-only",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 (AC-5, CM-3, CM-5, CM-8, CM-9); SP 800-128; ServiceNow — change types, CAB workbench, CSDM. Book 15, Ch 10.");
  notes(s,
`Day two is run by the people who touch the estate most and decide the least, so every decision sits with someone not holding the keyboard.

No federal document defines a service desk tier or a CMDB owner; the roles come from four places. SP 800-37 makes the authorizing official the only official who can accept risk, government-only, and gives the system security officer managing changes and assessing their impact. CM-3 asks for a configuration change control element, naming change advisory boards, and CM-3(4) puts security and privacy representatives on it. CM-9(1) keeps the configuration process away from the people it governs.

The service desk has three support lines: the first line takes, classifies, verifies and executes; cloud services is the escalation tier; the owning engineering team takes design escalations and owns the runbooks. Classification isn't approval. The supervisor is the one approver inside the desk, for routine credential work on ordinary users, never a ticket they execute, never access, never the second approver.

The ITSM platform team builds what owners specify and decides neither the item nor the gate; a change to an approval rule is a normal change the CAB authorizes. The CMDB owner owns the class model, the rules, the exception queue, health and lifecycle policies, but not the facts. Standard changes, pre-authorized in ServiceNow's model, map to catalog items and L3 classes whose steps and rollback are fixed; the CAB approves the model once and withdraws it when its failure rate rises. L4 classes and reauthorization are the authorizing official's.

The slide is a cut of the chapter's full responsibility matrix, which agrees with the other Who chapters. Every artifact, catalog item, runbook, CI class, carries one owner and a review date.`,
  "Book 15, Chapter 10 — Who Runs Day Two.");
}

// ================================================================== 29 Close
{
  const s = content(P2, "Decisions to make, and next steps for day two");
  tag(s, "How");
  const b = table(s, "Decide", 1.5, [4.3, 3.0, 4.85], ["Decision", "Owner", "First step"], [
    ["The verification ladder for resets and recovery", "CISO", "Approve the rungs; alert and notify on every reset"],
    ["The front door and the triage classifier", "Desk manager; IGO", "Redirect in Audit mode; approval due dates reject"],
    ["Help desk role groups and AU scopes", "IGO; identity engineering", "PRV-T2 groups; custom app-assignment role"],
    ["The SaaS verdict threshold", "Authorizing official", "Class C default; run the read-only inventory"],
    ["The CMDB's identity authority", "CMDB owner; DDI team", "Reconcile to the naming plane; work the queue"],
    ["One route per source into the ITSM platform", "Platform owners", "Collector where no connector; leave AWS's SMC"],
  ], { fontSize: 13.5, minRow: 0.5 });
  callout(s, "Next", b + 0.15, 6.5 - b - 0.15, "FaClipboardCheck", HEX.navy, "Measure before you build: ",
    "run the read-only SaaS inventory and the collectors against a test scope, size the catalog from what they find, and finish the AWS connector move before March 31, 2027.");
  sources(s, "Sources: as cited on the module slides; AWS Service Management Connector end-of-support notice. Book 15, Chapters 01–10; Appendix A.");
  notes(s,
`So, from Monday, six decisions, each with an owner.

The CISO approves the verification ladder for resets and recovery, with the most friction on the most sensitive accounts and an alert and a notice on every reset. The service desk manager and the IGO stand up one front door: redirect the team mailbox in audit mode first, set the triage classifier, and make every approval due date reject rather than approve. The IGO and identity engineering build the help desk's role-assignable groups, one per role and scope, eligible through PIM, with the custom app-assignment role in place of Application Administrator, and an executive restricted unit outside the desk's reach.

The authorizing official sets the SaaS verdict threshold; the program's default is FedRAMP Certified at Class C or higher for identity data. The CMDB owner and the DDI team make the naming plane the identity authority, and work the reconciliation exception queue weekly. And the platform owners choose one route per source into the ITSM platform, with the program's collector wherever no connector exists, and move off AWS's Service Management Connector before support ends.

The first step needs no procurement: measure before you build. Run Chapter 06's read-only SaaS inventory and the read-only collectors from Chapters 08 and 09 against a test scope, and size the catalog and the queues from what they find.

Operations is where modernization becomes routine or quietly reverts. Chapters 03 through 10 and Appendix A carry the detail, every claim footnoted. Thank you.`,
  "Book 15, Chapters 03–10; Appendix A; Chapter 06, \"Honest limits\"; Chapter 09, \"Getting AWS results into the ITSM platform.\"");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const sourceSlide = (t, src) => {
  const s = content("Backup", t);
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
  const need = 1.5 + src.reduce((a, x) => a + lines(x, 11.75, 12) * 0.2 + 0.07, 0);
  if (need > 6.6) console.warn(`  ! ${t} source list may overflow: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "Microsoft Learn: Microsoft Entra built-in roles; Privileged roles and permissions (who can reset passwords); Manage user authentication methods for Entra MFA.",
  "CISA AA23-320A, Scattered Spider (Nov. 16, 2023, rev. July 29, 2025).  ·  OMB M-22-09 (Jan. 26, 2022).  ·  OMB M-24-08 (Dec. 21, 2023).",
  "NIST SP 800-63B-4 (July 2025), §§2.2.2, 3.2.5, 4.1.2.1, 4.2, 4.6.  ·  NIST SP 800-53 Rev. 5, release 5.2.0 OSCAL catalog and baselines.  ·  NIST SP 800-137.",
  "Microsoft Learn: SSPR how it works and writeback; Temporary Access Pass; PIM overview, email notifications, role settings, approval workflow; phishing-resistant MFA for admins.",
  "ServiceNow: Microsoft Entra ID Spoke release notes and spoke documentation (Zurich); MID Server; Continuous Authorization and Monitoring; inbound email actions; email filters; Ask for Approval.",
  "Microsoft Learn: New-TransportRule; Entra general operations guide (notifications); Reset a user's password; troubleshoot admin password resets in the Microsoft 365 admin center.",
  "Microsoft Learn: Verified helpdesk with Entra Verified ID; Account recovery overview and FAQ; What's new in Verified ID (Sept. 2025, May 2026); Entra data retention.",
  "FedRAMP Marketplace products.json (last change Oct. 21, 2026): ServiceNow Government Community Cloud; Atlassian Government Cloud.",
  "U.S. Access Board, Revised 508 Standards, 36 CFR part 1194.  ·  21st Century IDEA, Pub. L. 115-336, §3(c).",
  "Full footnotes with links and access dates: Book 15, Chapters 01–03 (whalermike.github.io/modernization-workbook/docs/books/b15-day2-operations/).",
]);
sourceSlide("Sources behind Module 2 — Help desk authority", [
  "Microsoft Learn: Microsoft Entra built-in roles (Authentication, Hybrid Identity, Password, Privileged Authentication and User Administrator).",
  "Microsoft Learn: Privileged roles and permissions in Entra ID (compare authentication roles; who can reset passwords; who can perform sensitive actions).",
  "Microsoft Learn: Least privileged roles by task; Create custom roles to manage enterprise apps; Working with users in Microsoft Graph (sensitive actions); Update user.",
  "Microsoft Learn: Assign roles with administrative unit scope; Administrative units; Restricted management administrative units; Role-assignable groups; PIM for Groups.",
  "Microsoft Learn: Configure Entra role settings in PIM; Approve or deny PIM requests; Upgrade from Azure AD PowerShell to Microsoft Graph PowerShell.",
  "Microsoft Learn: Configure Temporary Access Pass; Manage user authentication methods (re-register MFA, revoke sessions).",
  "Microsoft Learn: Configure Entra Connect for an existing tenant (hard match vs soft match; block hard match; hard match security protections, July 1, 2026).",
  "Microsoft Learn: Entra audit log activity reference; Entra data retention; View applied Conditional Access details in the activity logs.",
  "CISA AA23-320A.  ·  NIST SP 800-63B-4 §4.2.  ·  FedRAMP, Access Control (SP 800-53 Rev. 5 release 5.2.0), AC-5 and AC-6(9).",
  "Full footnotes with links and access dates: Book 15, Chapter 04 and Appendix A.",
]);
sourceSlide("Sources behind Module 3 — Catalogs, SaaS and the CMDB", [
  "NIST SP 800-53 Rev. 5 release 5.2.0 (AC, AU, CA, CM, IA, PS, SA, SC, SI controls cited); SP 800-53B baselines; SP 800-128 (2011, updated Oct. 10, 2019).",
  "ServiceNow: Entra ID Spoke (sample offboarding flow); Discovery; Service Graph Connector for Microsoft Azure; IRE; reconciliation rules; CMDB Health; CMDB Data Manager.",
  "FCC 19-76 (Aug. 2019), Kari's Law and RAY BAUM'S Act §506.  ·  47 CFR §§ 9.3 and 9.16.",
  "Microsoft Learn: PSTN connectivity options; Teams service description; GCC High and DoD; manage emergency calling; Calling Plan emergency considerations; dynamic emergency calling.",
  "Microsoft Learn: Graph call records; Teams PSTN usage report.  ·  CISA BOD 25-01 and its required configurations (MS.TEAMS, MS.AAD.5.1v1–5.3v1).",
  "Microsoft Learn: Cloud feature availability for US Government; Azure Government identity; Graph national clouds; application gallery risk scores; Teams government clouds.",
  "FedRAMP Consolidated Rules for 2026 (Using a certified service; KSI-PIY-GIV).  ·  FedRAMP Marketplace products.json (781 listings, Oct. 21, 2026).  ·  CISA BOD 23-01.",
  "Microsoft Learn: illicit consent grants; app consent investigation; app governance FAQ; Defender for Cloud Apps for US Government; EMS for US Government; how provisioning works; SSO.",
  "Microsoft Graph v1.0: applicationTemplate instantiate; servicePrincipal update and addTokenSigningCertificate; synchronization jobs, secrets, provisionOnDemand; appRoleAssignedTo; permissions reference.",
  "Microsoft Learn: manage stale devices; DeviceInfo; Azure Resource Graph.  ·  Section508.gov ACR guidance.  ·  Full footnotes: Book 15, Chapters 05–07.",
]);
sourceSlide("Sources behind Module 4 — Control automation and roles", [
  "CISA ScubaGear v1.8.0 README, parameters and Entra ID baseline.  ·  CISA BOD 25-01 (Dec. 17, 2024).  ·  CISA BOD 26-04 (June 10, 2026).",
  "Microsoft Learn: Graph Conditional Access list; Graph national clouds; Office 365 Management Activity API; Purview auditing; Purview GCC planning; Compliance Manager regulations and actions.",
  "Microsoft Learn: FedRAMP Moderate initiatives (Azure and Azure Government); Policy compliance data; exemption structure; Resource Graph samples and paging; Azure Government GA roadmap.",
  "Microsoft Learn: Defender for Cloud regulatory compliance standards, assignment, dashboard, support matrix and ServiceNow integration; Microsoft and CMMC (cloud pairing).",
  "ServiceNow: Configuration Compliance (Defender for Cloud import); Continuous Authorization and Monitoring and release notes; change types; CAB workbench; CSDM Foundation.",
  "FedRAMP Consolidated Rules for 2026, Vulnerability Detection and Response.  ·  FedRAMP Marketplace products.json, ServiceNow F1305072116.",
  "AWS docs: Config conformance packs and samples; FedRAMP (Moderate) practices; get-conformance-pack-compliance-details; remediation; Config in GovCloud.",
  "AWS docs: Security Hub CSPM, NIST 800-53 Rev. 5, endpoints, Regional limits, ASFF filters; Security Hub in GovCloud and ServiceNow; Audit Manager change; SMC end of support; CIS AWS Foundations Benchmark in Security Hub CSPM; AWS FedRAMP and services in scope.",
  "Broadcom: vSphere Configuration Profiles and vLCM (9.0); VCF Operations compliance (9.0) and Security Posture Management (9.1); CIS Benchmarks (VMware ESXi 8.0, 9.0); VCF 9.1 STIG blog (High only reference); Advanced Cyber Compliance blog.",
  "NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 (AC-5, CM-3, CM-5, CM-8, CM-9); SP 800-128.  ·  Full footnotes: Book 15, Chapters 08–10.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
