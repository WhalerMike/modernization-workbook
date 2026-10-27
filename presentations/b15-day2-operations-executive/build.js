// Book 15 — Compliance Automation & Day-2 Operations: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the service owner, help desk and operations leads, and the CISO.
// Decision-centered: every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B15_Day2_Operations_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b15-day2-operations/, named in the notes. Decision owners
// come from the book's responsibility matrix and artifact-ownership table (Chapter 10); where an owner or a timing is
// the program's own recommendation, the notes say "design" or "design guidance". Product facts are dated observations
// (October 21–22, 2026). The 15-minute deck and the technical deep dive carry the mechanics; this deck the decisions.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 15", title: "Day-2 Operations: the executive briefing",
  footer: "Federal Modernization Workbook  ·  Book 15 Compliance Automation & Day-2 Operations  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B15_Day2_Operations_Executive.pptx";

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

// ---------------------------------------------------------------- checks (print "!" on a likely problem)
// Titles stay at or under 58 characters and are unique; Sources lines stay at or under 185 characters.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) console.warn(`  ! title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t) && t !== "Backup") console.warn(`  ! duplicate title: ${t}`);
  titles.push(t);
  return t;
};
const content = (sec, t) => D.content(sec, checkTitle(t));
// Lines a string needs in a box w inches wide at pt points: greedy word wrap at about half an em per character.
const lines = (text, w, pt) => {
  const per = Math.max(4, Math.floor(w / (0.5 * pt / 72)));
  let n = 1, cur = 0;
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const len = word.length;
    if (cur === 0) cur = len;
    else if (cur + 1 + len <= per) cur += 1 + len;
    else { n += 1; cur = len; }
  }
  return n;
};
const lh = (pt) => (pt / 72) * 1.2;
const need = (items, w, pt, gap) => items.reduce((h, t) => h + lines(t, w, pt) * lh(pt) + (gap || 0) / 72, 0);
const fit = (where, h, has) => { if (h > has + 0.02) console.warn(`  ! slide ${pres.slides.length} ${where} may overflow: needs ${h.toFixed(2)} in, has ${has.toFixed(2)}`); };
const sources = (s, text) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return D.sources(s, text);
};

// ---------------------------------------------------------------- layout helpers (as in the Book 13 and 14 briefings)
// The decision bar: every decision slide states the decision, its owner and when it's needed.
const decision = (s, what, owner, when) => {
  const y = 5.3, h = 1.2;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.25, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => {
    fit(`${name} column`, lh(11) + lines(text, w - 0.05, 14.5) * lh(14.5), h - 0.16);
    txt(s, name, [
      { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
      { text, options: { fontSize: 14.5, color: HEX.ink } },
    ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  };
  col("Decision", 1.75, 6.55, "DECISION", what, HEX.amber);
  col("Owner", 8.5, 2.1, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "WHEN", when, HEX.navy);
};
// A labeled list of tinted rows down the left of the slide (w inches wide).
const rows = (s, prefix, label, list, top, step, h, w) => {
  const rw = w || 6.2;
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: rw, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, rw, h, i % 2 ? HEX.navyTint : HEX.grey);
    fit(`${prefix} row ${i + 1}`, lines(`${j[0]}    ${j[1]}`, rw - 0.35, 14) * lh(14), h);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: rw - 0.3, h, fontSize: 14, valign: "middle" });
  });
};
// A tinted box with an icon, a heading and a bullet list; x and w default to the right-hand column (7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, size, x, w) => {
  const bx = x != null ? x : 7.75, bw = w || 5.0, pt = size || 13.5;
  box(s, `${prefix} box`, bx, 1.5, bw, 3.6, tint);
  icon(s, iconName, bx + 0.25, 1.66, 0.6, color);
  fit(`${prefix} heading`, lines(heading, bw - 1.1, 17) * lh(17), 0.62);
  txt(s, `${prefix} head`, heading, { x: bx + 1.0, y: 1.66, w: bw - 1.1, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  fit(`${prefix} list`, need(list, bw - 0.4 - 0.3, pt, 6), 2.62);
  txt(s, `${prefix} list`, bullets(list, pt), { x: bx + 0.25, y: 2.4, w: bw - 0.4, h: 2.62, paraSpaceAfter: 6 });
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });
// A table on the left (x 0.6) with a navy header row; warns when its estimated height runs past the bottom.
const leftTable = (s, header, body, colW, rowH, fontSize, bottom) => {
  const pt = fontSize || 12.5;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const est = [header, ...body.map((r) => r.map(cellText))].reduce((h, r, k) =>
    h + Math.max(rowH[k] || rowH[rowH.length - 1], Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, pt))) * lh(pt) + 0.1), 0);
  fit("table", 1.5 + est, bottom || 5.12);
  s.addTable([head(header), ...body], tableOpts(colW, { y: 1.5, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};

// Alt text for each committed diagram, taken from the fig-alt attribute in the chapter that shows it.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b15-day2-operations");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
// A committed diagram on the left (from x 0.6), keeping the PNG's aspect ratio (read from its header) inside
// maxW x 3.6 and centered vertically in the 1.5–5.1 band. Returns its width so a side box can take the rest.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b15-day2-operations", "png");
const img = (s, name, maxW) => {
  const alt = ALT[name];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${name}`);
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  const maxH = 3.6;
  let w = maxW || 6.3, h = w / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  const y = 1.5 + (maxH - h) / 2;
  s.addImage({ path: file, x: 0.6, y, w, h, altText: alt });
  if (y + h > 5.14) console.warn(`  ! slide ${pres.slides.length} ${name} image runs into the decision bar: bottom ${(y + h).toFixed(2)}`);
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)}`);
  return w;
};
// A diagram on the left and a side box filling the rest of the row.
const figSide = (s, name, maxW, prefix, iconName, color, tint, heading, list, size) => {
  const w = img(s, name, maxW);
  const x = 0.6 + w + 0.25;
  sideBox(s, prefix, iconName, color, tint, heading, list, size, x, 12.75 - x);
};

const S_WHY = "Why day two decides", S_WHAT = "What changes after cutover", S_WHO = "Who runs day two", S_HOW = "How to prove and measure it";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, checkTitle("Day-2 Operations: the executive briefing"), "Book 15  ·  Where modernization becomes routine");
  D.agenda(s, 0.8, 4.82, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for the CIO, service owners, help desk and operations leads, and the CISO", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 9.5, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 15 of the Federal Modernization Workbook, Compliance Automation and Day-2 Operations. It runs about thirty minutes, for the people who own what happens after cutover: the CIO, the service owners, the help desk and operations leads, and the CISO.

The book's argument fits in three sentences. A modernized estate is judged on day two, at the help desk, where a reset, an unlock, a joiner and a leaver either run safely under the new model or get done the old way. Every day-two change touches a control, so compliance lives or dies in routine operations, not in the assessment. And the fix isn't more discipline at the desk: it's a model in which the governed path is also the easiest one, with the evidence produced as a side effect.

I'll take four parts: why day two decides; what changes for support and operations after cutover; who runs day two and who decides; and how the agency proves and measures it. Every decision slide names the decision, its owner and when it's needed. Where the owner or the timing is the program's own recommendation rather than a federal assignment, the notes say so. Product facts are dated observations, checked October 21 and 22, 2026.`,
  "Book 15, index; Chapter 01 — Modernization Succeeds or Fails at the Help Desk; Chapter 02 — Day Two Is Where Compliance Lives or Dies.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "The estate is judged on day two, at the help desk");
  tag(s, "Why");
  figSide(s, "ch01-one-reset-two-ways", 6.3, "Revert", "FaArrowsRotate", HEX.red, HEX.redTint, "How modernization quietly reverts", [
    "The emergency admin account that never goes away",
    "The email that becomes the request",
    "The temporary password sent back to the same inbox",
    "The old console, and the script someone pasted",
    "Each is reasonable on the day; together they rebuild the old estate",
  ], 14);
  decision(s, "Call a wave complete only after a reset, an unlock, a joiner and a leaver have run under the new model",
    "CIO, at each wave's go/no-go", "Before each wave is closed");
  sources(s, "Sources: Book 15, Chapter 01 (Day two is most of the work; How modernization quietly reverts; What leadership should take from this). Owner and timing are the program's model.");
  narrate(s,
`A modernization program spends most of its attention on day one: the tenant is built, the identities are synchronized, the cutover runs and someone sends a note saying the wave went well. None of that is what the estate is judged on.

It's judged on day two. A user who changed phones over the weekend can't sign in. A new hire needs an account, a license and three groups by Monday. A manager wants a contractor's access removed today. Each lands at the help desk, and each tests the new model. Can the desk do the work without standing administrator rights? Does the request reach someone entitled to approve it? And is there a record of what happened, to whom, on whose authority?

If not, the desk finds a way. The book lists how modernization quietly reverts: an administrator account kept "for emergencies" that never goes away, an email acted on as if it were the request, a temporary password sent back to the mailbox that asked for it, a fix made in the old console, a command pasted by a requester and run under admin rights. Each is reasonable on the day. Together they rebuild the estate the program set out to replace.

The book's first leadership point is to judge the modernization on day two. Making that a go/no-go test for each wave, owned by the CIO, is the program's model, and Book 01 already makes ticket volume a go/no-go input.`,
  "Book 15, Chapter 01 — Modernization Succeeds or Fails at the Help Desk (Day two is most of the work; Attackers know where the keys are; How modernization quietly reverts; What leadership should take from this).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "An authenticator reset hands over the account");
  tag(s, "Why");
  rows(s, "Reset", "WHAT THE SOURCES SAY", [
    ["Microsoft", "Helpdesk Administrator is privileged: a reset can assume an identity"],
    ["Re-register", "Methods deleted; whoever registers next owns it"],
    ["CISA", "Scattered Spider called help desks to reset and move MFA"],
    ["M-22-09", "Recovery is a bypass; use high-friction methods"],
    ["SP 800-63B-4", "Re-proof at the original level; always notify"],
  ], 1.88, 0.64, 0.56, 6.5);
  sideBox(s, "Ladder", "FaUserShield", HEX.navy, HEX.navyTint, "The verification ladder", [
    "Phishing-resistant sign-in: act from that session",
    "Weaker method only: plus a check the CISO approves",
    "Every method lost: identity proofing, then a one-time pass",
    "Never: email, caller ID, a callback the caller gives, knowledge questions",
  ], 13.5, 7.35, 5.4);
  decision(s, "Set the identity-verification procedure for resets and recovery, put the most friction on privileged accounts, and alert on every reset",
    "CISO", "Before cutover; then yearly");
  sources(s, "Sources: Microsoft Entra built-in roles; OMB M-22-09; NIST SP 800-63B-4 (§4.2); CISA AA23-320A (rev. July 29, 2025); SP 800-53 (IA-5, IA-12). Book 15, Chapters 01, 03 and 10.");
  narrate(s,
`The help desk holds the keys, and Microsoft is blunt about it. It labels the Helpdesk Administrator role privileged, and warns that changing a user's password "may mean the ability to assume that user's identity and permissions." When an administrator chooses to require MFA re-registration, Entra ID deletes the user's phone numbers, authenticator registrations and software tokens, and whoever signs in next and registers a method controls the account. An authenticator reset on an unverified request isn't a support task. It's a transfer of the account to whoever asked.

Attackers know it. CISA's advisory on Scattered Spider, revised in July 2025, describes actors calling help desks to reset passwords and transfer MFA tokens. OMB's M-22-09 says recovery processes are a potential bypass of authentication and should use high-friction methods. NIST's SP 800-63B-4 requires repeated proofing to match the original level, and every recovery must notify the account holder.

The program turns this into a verification ladder, with defaults the CISO sets. A user with a phishing-resistant sign-in acts from that session. A user with only a weaker method needs a second check the CISO approves. A user who has lost everything is identity-proofed and gets a one-time pass. Email, caller ID and knowledge questions verify no one. The book's matrix gives the CISO this procedure, reviewed yearly and after any social-engineering incident.`,
  "Book 15, Chapter 01 (The help desk holds the keys; Attackers know where the keys are; Federal guidance treats recovery as a bypass); Chapter 03 (Verify the person before a sensitive action); Chapter 10 (artifact ownership: the identity-verification step).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Day-two volume is where controls erode");
  tag(s, "Why");
  figSide(s, "ch02-two-estates-after-go-live", 6.3, "Erode", "FaTriangleExclamation", HEX.red, HEX.redTint, "Designed, deployed, then operated", [
    "AC-2, IA-5, CM-3 and CM-8 are sampled, and eroded by hand work",
    "At Moderate, few controls demand automation outright",
    "At day-two volume, hand-built records are reconstructions",
    "Designed and deployed but not operated is a hope, not a control",
  ], 14);
  decision(s, "Fund the third layer, operation: an owner, a gate, a clock and an evidence feed for every control, mostly in automation",
    "CIO and executive sponsor", "Next budget cycle");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and SP 800-53B, release 5.2.0 (AC-2, AC-2(1), AC-2(4), IA-5, CM-3, CM-8, CA-7); SP 800-137. Book 15, Chapters 02 and 10.");
  narrate(s,
`The same story, seen from the authorization package. The day after go-live, the help desk resets a few hundred passwords, onboards a dozen people, changes group memberships and grants an application. Every one of those changes touches a control. Routed, approved, executed under least privilege and recorded, the package stays true. Done as portal clicks, it ages with every click.

The controls day-two work touches most, account management, authenticator management, change control and component inventory, are among the most sampled, and their text is specific. An account created from an email has no approval the control recognizes. A subscription stood up by hand never reaches the inventory.

The book is honest about the baseline. At Moderate, few controls demand automation in so many words. The program's case is about volume: at day-two volume, people assembling the record by hand can't keep up, and what they produce is a reconstruction, not evidence.

So the book describes three layers a control passes through: designed, deployed as code, and operated, with an owner, a change gate, a clock and an evidence feed. A control configured but not run that way is, in the program's phrase, a hope. The book's leadership point is to fund that third layer, and that it's mostly automation, not headcount. Scope and funding sit with the CIO and the executive sponsor; the timing is design guidance.`,
  "Book 15, Chapter 02 — Day Two Is Where Compliance Lives or Dies (Compliance decays through routine work; Designed, deployed, operated; What leadership should take from this); Chapter 10 (staffing and funding: CIO and sponsor).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Buy the contract, not the product");
  tag(s, "What");
  rows(s, "Contract", "THE COORDINATION CONTRACT (PROGRAM DESIGN)", [
    ["Owner", "Every request and finding: an owner and a clock"],
    ["Gate", "Approval recorded first; never the requester"],
    ["Identity", "Least-privilege service identity; no standing write"],
    ["Evidence", "Request to closing check, emitted as a record"],
    ["Guardrail", "The CMDB reconciles to the authoritative inventory"],
  ], 1.88, 0.64, 0.56, 6.5);
  sideBox(s, "Platform", "FaServer", HEX.navy, HEX.navyTint, "The platform question", [
    "Actuation stays native; the ITSM platform coordinates",
    "ServiceNow is the reference, not a requirement",
    "Its government cloud: FedRAMP Certified, Class D (High)",
    "Record a High platform serving Moderate systems as a decision",
  ], 13.5, 7.35, 5.4);
  decision(s, "Hold any coordination platform to the four properties and the guardrail, and record its certification treatment in the agency's own authorization",
    "CIO; the platform's own AO authorizes it", "At platform selection or renewal");
  sources(s, "Sources: FedRAMP Marketplace products.json (Oct 21, 2026); ServiceNow MID Server and CAM documentation; SP 800-53 Rev. 5 and 53B (CM-8). Book 15, Chapters 02 and 10.");
  narrate(s,
`Day-two work needs a system of record: somewhere a request becomes a task with an owner, an approval trail, a clock and a link to the asset it touches. The program splits the management plane in two. Actuation stays platform-native: Microsoft 365 through its own tools, Azure through Azure Policy and Defender for Cloud, and so on. Governance and evidence are unified in one workflow-and-evidence system.

The requirement is a contract, not a product, with four properties and a guardrail, all program design. Work routed to a named owner. Change gated by a recorded approval, never the requester's. Execution under a least-privilege service identity, never standing write over the estate it governs. Machine-readable evidence emitted. And the configuration database reconciles to the authoritative inventory; it's depended on for routing, never for truth.

ServiceNow is the reference platform because many agencies run it, not a requirement; another authorized platform, or a composed pipeline inside the boundary, can meet the same contract. On the boundary question: the Marketplace lists ServiceNow's Government Community Cloud as FedRAMP Certified at Class D, High, as of October 21, 2026. Every Moderate control is also in the High baseline, so the direction is conservative, but the program's design is to record that treatment explicitly in the agency's own authorization. The platform also needs its own system owner, ISSO and authorizing official.`,
  "Book 15, Chapter 02 (The coordination contract; ServiceNow as the reference platform; The boundary question; What leadership should take from this: buy the contract); Chapter 10 (The ITSM platform team: the platform is a system in its own right).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "One front door, routed by the authority a task needs");
  tag(s, "What");
  figSide(s, "ch03-one-front-door", 5.4, "Door", "FaDoorOpen", HEX.navy, HEX.navyTint, "Triage by required authority", [
    "Portal, email, IGA and monitoring all land in one queue",
    "Classes A0 to A3 pick the pipeline and the approver",
    "Microsoft look-alikes and privileged targets are caught first",
    "A timed-out approval rejects or cancels; silence never approves",
  ], 13.5);
  decision(s, "Close the side doors: route the team mailbox into triage, and count any work handled outside the front door as a measured gap",
    "Service desk manager; the IGO sets the classes", "Before the first wave cutover");
  sources(s, "Sources: ServiceNow Ask for Approval docs; 36 CFR part 1194 (Section 508); CISA AA23-320A. Book 15, Chapters 03 and 10. Classes from Book 04; service levels are program defaults.");
  narrate(s,
`The program's operating rule is that nothing is handled as ad hoc email to the cloud services team. Every request is triaged inside the service management platform first, then routed by the authority the task requires. Cloud services is the escalation tier above the help desk, not a second intake queue.

Work arrives from four kinds of source: self-service, email, the identity governance platform and monitoring. All land in one queue. Triage asks one question: what authority does this task need? Who sent it, how urgent they say it is and how senior they are don't change the answer. The classes run from A0, no access change, through A1, changes to the requester's own account, A2, owner-governed access, to A3, governance actions that are never automated. The checks run in a fixed order, and the first catches anything claiming to come from Microsoft.

Two details matter at the executive level. Approvals carry a due date, and the program sets the timeout to reject or cancel, never approve, so silence can't grant access. And the front door has to be usable by everyone: the Revised 508 Standards apply to help desks and self-service support.

The book's matrix gives the identity governance officer the authority classification, and the service desk manager the routing rules inside it. The desk's measures include requests handled outside the front door, so a side door shows up as a number.`,
  "Book 15, Chapter 03 — Intake, Triage and Routing (One front door; Triage by required authority; Routing: two pipelines and an escalation lane; Service levels); Chapter 10 (artifact ownership: routing and assignment rules; staffing measures).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "The help desk executes; it never decides");
  tag(s, "What");
  figSide(s, "ch04-who-can-act-on-whom", 6.3, "Exec", "FaUserCheck", HEX.teal, HEX.tealTint, "Capability isn't authority", [
    "No standing roles: eligible, activated per ticket",
    "Some desk roles can delete users or grant consent",
    "Executives sit in a restricted unit the desk can't touch",
    "The SIEM flags any activation with no matching ticket",
  ], 13.5);
  decision(s, "Scope the service desk's privileged access group and review its membership every quarter; no technician holds a standing role",
    "Identity governance officer", "Quarterly");
  sources(s, "Sources: Microsoft Learn: Entra built-in and privileged roles; restricted management units; PIM; audit activities. SP 800-53 (AC-5, AC-6(9)). Book 15, Chapters 04 and 10.");
  narrate(s,
`The service desk executes; it doesn't decide what it executes. Technicians have no approval authority at any level, hold no standing privileged role, and activate eligible roles through Privileged Identity Management with a justification for the ticket in hand. Microsoft recommends phishing-resistant MFA for these roles.

The book is careful about a trap: capability isn't authority. Several roles that fit help desk work can do more than a help desk should. Authentication Administrator can delete and disable the users it covers. User Administrator can delete users and change licenses. Application Administrator can grant consent, the one thing the desk must never do, so the program replaces it with a narrow custom assignment role. Where the platform can't enforce a boundary, the program enforces it twice: in the ticket, which must carry the approval, and in monitoring.

Some accounts should be out of the desk's reach even with no role: executives and their assistants. A restricted management unit puts them there; only administrators assigned at that unit's scope can change them, and the general desk gets no assignment over it.

Each action leaves three records, the ticket, the PIM activation and the directory audit entry, joined in the SIEM, which flags any activation or change with no matching ticket. The book's matrix gives the identity governance officer the desk's privileged access group, reviewed quarterly.`,
  "Book 15, Chapter 04 — Help Desk Authority in Entra ID (Capability is not authority; Restricted management units; How the roles reach a technician; Evidence every action leaves; The authority boundary); Chapter 10 (Identity operations; responsibility matrix).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "High-risk tasks need two approvers besides the executor");
  tag(s, "What");
  figSide(s, "ch04-high-risk-two-approvers", 6.3, "Two", "FaPeopleArrows", HEX.amber, HEX.amberTint, "The high-risk list (program design)", [
    "Resets on accounts the desk can't touch",
    "ImmutableID repair: identity engineering, not the desk",
    "Delete or restore outside the HR lifecycle",
    "Tier 1 app assignments, and bulk changes",
    "Urgency goes to the emergency process, never past the second approver",
  ], 13.5);
  decision(s, "Require two recorded approvers before any role activates on a high-risk task, and never waive the second approver for urgency",
    "CISO; the IGO for access items", "Before the desk takes these tasks");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-5, AC-6(9)); Microsoft Learn: Entra Connect hard and soft match (July 1, 2026 change); PIM. Book 15, Chapters 04 and 10.");
  narrate(s,
`A task is high-risk, in the program's design, when one person could use it to take over an identity, break the link between an identity and its source of truth, or open an application to the wrong people, and the platform can't stop the misuse by itself. SP 800-53 asks agencies to separate duties and log privileged functions. The program's answer is two approvers besides the executor, both recorded in the ticket before any role is activated.

The list is short. A reset or a temporary pass for an account the desk can't touch, approved by the owner's manager and the security office. An ImmutableID repair, which the older design let the desk do and this book moves to identity engineering: Microsoft fixes most of those conflicts at the on-premises source, and from July 1, 2026 Entra ID blocks risky hard matches. Deleting or restoring an account outside the HR-driven lifecycle. Assigning a high-risk application. And bulk changes, where one mistake repeats at scale.

The second approver checks three things: the requester was verified, the change is exactly specified with a rollback, and the urgency is real. A caller who presses for speed is routed to the supervisor's emergency change process, which has its own approvals. Urgency is never a reason to skip the second approver. The gate a request enforces belongs to the control owner: the CISO, or the identity governance officer for access items.`,
  "Book 15, Chapter 04 (The high-risk tasks and why they need a second approver; Why ImmutableID repair left the help desk; What the second approver checks); Chapter 10 (artifact ownership: the approval gate a catalog item enforces).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Consent says who may approve; only a verdict says whether");
  tag(s, "What");
  figSide(s, "ch06-who-versus-whether", 6.3, "Verdict", "FaFileShield", HEX.navy, HEX.navyTint, "The gate is the agency's", [
    "GCC sees the full commercial app gallery; nothing is marked",
    "Gallery risk scores aren't an authorization verdict",
    "Consent rules (BOD 25-01) govern who approves",
    "Record Marketplace status before consent; re-check on a cadence",
  ], 13.5);
  decision(s, "Record each external service's authorization status before any consent or configuration, and stop the request when it is missing or lapsed",
    "Identity governance officer", "Each new integration; then on a cadence");
  sources(s, "Sources: CISA BOD 25-01 (MS.AAD.5.1–5.3); FedRAMP 2026, Using a Certified Service; SP 800-53 Rev. 5 (SA-9, AC-20, CA-3); Microsoft Learn (GCC pairing). Book 15, Chapters 01, 06, 10.");
  narrate(s,
`Every SaaS integration widens the boundary, and three facts put the whole burden on the agency.

First, a GCC tenant pairs with Entra ID in commercial Azure, so it sees the full commercial application gallery. Nothing is blocked and nothing is marked. Second, nothing in the integration path asks about authorization. The gallery's risk scores weigh standards like SOC 2 and ISO 27001; a good score is useful, but it isn't an authorization verdict. Third, FedRAMP's 2026 rules say the authorizing official accepts risk for the agency's use of a service, including "the integrations enabled."

The obvious alternative is the consent baseline. CISA's BOD 25-01 requires that only administrators register applications, that user consent be restricted and that an admin consent workflow exist. The program applies all three. But consent restriction governs who approves an integration. It says nothing about whether the service at the far end is authorized to hold federal data. A fully compliant tenant can still have an administrator, correctly and within policy, consent to a service with no FedRAMP certification. Every check passes, and data still leaves the boundary.

Only an authorization verdict, recorded before anything is configured and re-checked on a cadence, closes that gap. Admin consent approval belongs to the identity governance authority alone and is never delegated; the help desk triages and routes.`,
  "Book 15, Chapter 06 — SaaS Integration Governance (Why the gate has to be the agency's; Consent restriction answers who, not whether; Keeping integrations authorized); Chapter 01 (admin consent approval); Chapter 10 (SaaS attestation row).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "The inventory is only as good as its reconciliation");
  tag(s, "What");
  figSide(s, "ch07-cmdb-is-a-projection", 5.6, "CMDB", "FaDatabase", HEX.teal, HEX.tealTint, "What a bad CI does", [
    "Missing: never patched, and coverage still looks complete",
    "Duplicate: the fix lands on one copy only",
    "Stale: percentages computed over phantoms",
    "A connector returning half its records raises no error",
  ], 13.5);
  decision(s, "Have system owners authorize or remove every shadow asset the reconcile pass finds; fix identity in the naming plane, never in the CMDB",
    "System owner", "Each reconcile pass; reviewed weekly");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-8, CM-8(4), CM-8(9)); SP 800-128; ServiceNow CSDM and CMDB Data Manager. Book 15, Chapters 07 and 10. Measures are program design.");
  narrate(s,
`The CMDB is the inventory every ticket points at, and the program's position on it is short. Discovery and connectors populate the CMDB; the authoritative naming and addressing record governs identity. Where the two disagree, the CMDB is wrong by definition, and the disagreement is itself a finding.

Why not make the CMDB the authority? Because a scanner reports what it found, not what the agency decided should exist. NIST's configuration management guide says even automated inventories need people to enter the owner and the system association, and those human-decided facts are the identity.

The cost of getting this wrong lands on patching and evidence. Patching at scale depends on the inventory. A missing configuration item is never scanned or patched, and coverage still looks complete because the denominator is wrong. A duplicate lets the fix land on one copy while the finding stays open on the other. Stale items route work to assets that don't exist and compute compliance over phantoms. And the measure that matters most: a connector that silently returns half its usual records produces no error and a CMDB that's half right.

The matrix splits ownership three ways. The DNS and addressing team decides identity, the system owner decides assignment and every shadow asset, and the CMDB owner keeps the model and the exception queue, reviewed weekly.`,
  "Book 15, Chapter 07 — The CMDB and Asset Identity (The CMDB is a projection, not the authority; Why patching and evidence depend on it; Measuring the inventory); Chapter 10 (The CMDB owner; responsibility matrix: CMDB rows).");
}

// ------------------------------------------------------------------ What 7
{
  const s = content(S_WHAT, "One loop on every cloud, closed on a re-test");
  tag(s, "What");
  figSide(s, "ch08-one-loop", 5.2, "Loop", "FaCloud", HEX.navy, HEX.navyTint, "What differs by platform", [
    "The ITSM platform reads; it never writes the estate",
    "Patch clocks come from BOD 26-04, not FedRAMP's provider table",
    "Defender's ServiceNow connector: not in Azure Government",
    "AWS Audit Manager is in maintenance mode; VMware evidence is the agency's own",
  ], 13.5);
  decision(s, "Keep the coordination platform read-only on the estate; every automated fix runs as a scoped, approved action with its own change record",
    "CISO, for the automation's identity", "Before any connector goes live");
  sources(s, "Sources: CISA BOD 26-04; Microsoft Learn (Defender for Cloud ServiceNow integration, support matrix); AWS Audit Manager availability change; Broadcom VCF 9.1. Book 15, Chapters 08–10.");
  narrate(s,
`Control automation runs one loop on every surface: test, detect drift, raise a typed task against the configuration item, actuate on the native surface, and close with evidence. Microsoft already tests most of the settings; the agency's job is to own the result, not to re-test it.

Two rules hold the loop together. The coordination platform reads; it doesn't write. A workflow tool with standing write access to Conditional Access or tenant configuration would itself be a least-privilege problem, so a safe automated fix runs as a scoped, logged action under its own approval. And a task closes on a re-test of the same asset, not on a click.

What differs is the platform, and the dates matter. The clock on vulnerabilities comes from BOD 26-04, issued June 10, 2026, not from FedRAMP's provider timeframes. Defender for Cloud's ServiceNow integration is generally available in commercial Azure and not in Azure Government. AWS Audit Manager went into maintenance mode on April 30, 2026, so nobody should start a federal evidence program on it, and the AWS Service Management Connector ends March 31, 2027. On its own VMware estate the agency inherits nothing: in VCF 9.1 the old compliance benchmarks were replaced, and no NIST benchmark is listed, so the mapping is the agency's work.

The matrix gives the CISO the decision on the automation's service identity and its permissions.`,
  "Book 15, Chapter 08 (One loop on every surface; Getting results into the ITSM platform; The clock on each task; Honest limits); Chapter 09 (AWS Audit Manager; VMware: the on-premises evidence gap; Honest limits); Chapter 10 (automation service identity row).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Who runs day two: decisions away from the keyboard");
  tag(s, "Who");
  figSide(s, "ch10-who-runs-day-two", 6.3, "Owners", "FaUsersGear", HEX.teal, HEX.tealTint, "Deciding, doing and owning", [
    "The supervisor approves only routine credential work for ordinary users",
    "Platform owners own runbooks and catalog content; control owners own the gates",
    "The ITSM platform team builds both and decides neither",
    "Contractors execute and prepare; government officials decide",
  ], 13.5);
  decision(s, "Give every catalog item, runbook, workflow and CI class one named owner and a review date; anything past it is the owner's finding",
    "CIO, through the program office", "Before the desk goes live");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (App. D; Task M-1); SP 800-53 Rev. 5 (AC-5, CM-3, CM-5, CM-8(4), CM-9); SP 800-128 (§2.4). Book 15, Chapter 10. Owner is the program's model.");
  narrate(s,
`Day two is run by the people who touch the estate most and decide the least, so the design has to put every decision with someone who isn't holding the keyboard. A service desk that approves its own resets has rebuilt the standing administrator. A service management team that edits an approval rule to clear a backlog has quietly changed who may approve. Nobody is acting in bad faith; each is closing a ticket.

The book separates deciding, doing, being consulted and owning an artifact. The service desk executes. Its supervisor is the one approver inside it, and only for routine credential work on ordinary users after the technician has verified the person; never a ticket the supervisor executes, never access to an application, never the second approver on a high-risk task. Platform owners own the runbooks and what each catalog item does; the control owner, the CISO or the identity governance officer, owns the gate it enforces; and the ITSM platform team builds both and decides neither.

The fourth kind of involvement matters because day-two work runs on artifacts, and artifacts decay. A runbook that still points to a retired console is a decision nobody made, enforced every time someone follows it. The book gives each artifact one owner, recorded on it, with a review date. Who drives that across the estate is the program's model: the CIO, through the program office.`,
  "Book 15, Chapter 10 — Who Runs Day Two (Deciding, doing and owning; The service desk lines; Who owns each catalog item and runbook; Keeping the roles apart).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Measure day-two health where the work happens");
  tag(s, "Who");
  const m = [
    ["Tickets past service level", "Capacity; stuck escalations"],
    ["Share escalated upward", "Runbook or catalog gaps"],
    ["Returned for missing evidence", "Closure discipline"],
    ["Verifications failed or abandoned", "Social-engineering pressure"],
    ["Activations with no ticket", "Queue and roles out of step"],
    ["Work outside the front door", "Email or chat side doors"],
    ["Connector runs short of records", "Inventory coverage decaying"],
  ];
  leftTable(s, ["Measure", "What it shows"], m.map((r) => [bold(r[0]), { text: r[1] }]), [3.55, 3.15], [0.34, 0.4], 12.5);
  sideBox(s, "Fix", "FaChartLine", HEX.amber, HEX.amberTint, "Three problems, three fixes", [
    "Capacity: more people",
    "Coverage: a runbook or catalog change through its owner",
    "Discipline: training",
    "The platform produces the numbers; nobody reports their own work",
  ], 13.5, 7.55, 5.2);
  decision(s, "Decide the desk's staffing and sourcing from these measures, reviewed monthly with the IGO and the CISO's representative",
    "CIO; the service desk manager responds", "Monthly");
  sources(s, "Sources: Book 15, Chapter 10 (Staffing, measuring and watching the queue; responsibility matrix) and Chapter 07 (Measuring the inventory). The measures are program design.");
  narrate(s,
`How well the desk is staffed shows up in its numbers before it shows up in an audit. The program's measures are design, reviewed weekly by the supervisor and monthly by the service desk manager with the identity governance officer and the CISO's representative.

Each one tells you something specific. Tickets past their service level show capacity and stuck escalations. A rising share escalated to cloud services or engineering shows a runbook or catalog gap. Tickets returned for missing evidence show whether closure discipline is holding. Identity verifications that failed or were abandoned show social-engineering pressure, or a step that doesn't work for real users. Privileged activations with no matching ticket mean the queue and the roles have come apart, and each one is a supervisor report. Requests handled outside the front door are side doors. And from the inventory: a discovery or connector run that returns fewer records than last time is coverage decaying before it becomes a finding.

The response depends on the problem. A capacity problem gets more people; a coverage problem gets a runbook or catalog change through its owner; a discipline problem gets training. The service management platform produces the measures, so nobody on the desk reports on their own work by hand.

Staffing and sourcing are the CIO's decision, as every scope and funding decision is. A contracted desk works under this model unchanged.`,
  "Book 15, Chapter 10 (The service desk lines; Staffing, measuring and watching the queue; the responsibility matrix: staffing and sourcing); Chapter 07 (Measuring the inventory).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "The CAB authorizes changes; it never accepts risk");
  tag(s, "Who");
  const c = [
    ["Standard change", "The CAB, once, for the model"],
    ["Normal change", "The CAB, after impact analysis"],
    ["Emergency change", "The CAB's emergency subset"],
    ["A class run at L4", "The AO, in writing"],
    ["Needs reauthorization?", "The AO; the CAB flags it"],
  ];
  leftTable(s, ["Kind of change", "Who authorizes it"], c.map((r) => [bold(r[0]), { text: r[1] }]), [2.85, 3.85], [0.34, 0.5], 13);
  sideBox(s, "Gate", "FaLock", HEX.red, HEX.redTint, "Nobody changes their own gate", [
    "An approval rule is a control; changing one is a normal change",
    "The ITSM team can't approve changes to its own rules",
    "Security and privacy members sit on the CAB (CM-3(4))",
    "Keep the CAB and the governance board's records apart",
  ], 13.5, 7.55, 5.2);
  decision(s, "Treat any change to approval rules, routing or integrations as a normal change the CAB authorizes, with the platform's ISSO consulted",
    "Change advisory board", "From the platform's first release");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-3(4), CM-5, CM-9(1)); SP 800-128 (§2.3.3, §3.3.2); ServiceNow change types and CAB workbench. Book 15, Chapter 10.");
  narrate(s,
`The change advisory board is the agency's change control element for production, the body CM-3 asks for. ServiceNow's change model gives it a defined place. A standard change is pre-authorized and low risk. A normal change needs assessment, peer approval and CAB authorization. An emergency change goes straight to authorization for CAB approval. The program maps that onto its own tempo, as design: approving a standard-change model approves every future instance inside it, so the CAB reviews the model as carefully as a normal change and withdraws it when its failure rate rises.

Two decisions aren't the CAB's. A class of change allowed to run without a person, and a change that may need reauthorization, are risk decisions, and risk is the authorizing official's. The CAB is consulted because it sees the change volume and the failure history.

The most common way separation is lost on day two is quieter. An approval rule is configuration in the platform, and the team that maintains the platform can usually edit it. CM-5 names workflow automation as an access restriction on change, and the program reads that literally: a change to an approval rule, a routing rule or an integration's permissions is a change to a control, raised as a normal change and authorized by the CAB, with the platform's own ISSO consulted.

Membership follows the controls: the CISO's and privacy representatives, the ISSOs on the agenda, platform owners, the service desk lead and security operations.`,
  "Book 15, Chapter 10 (The change advisory board; The ITSM platform team; Keeping the roles apart; the responsibility matrix: ITSM platform change, standard change, L4 and reauthorization rows).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Prove with systems; attest only what no system sees");
  tag(s, "How");
  figSide(s, "ch11-attestation-loop", 6.3, "Attest", "FaClipboardCheck", HEX.teal, HEX.tealTint, "The attestation loop", [
    "Map, test, gap, emit: control state from the task stream",
    "A POA&M item closes on re-test, never on ticket closure",
    "Attesting what a system could read is itself a finding",
    "Indicators bind providers; agency tags are vocabulary only",
  ], 13.5);
  decision(s, "Close POA&M items only on a passing re-test, and escalate every slipped milestone instead of quietly moving it",
    "System owner; the ISSO runs the monthly regeneration", "Monthly");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (App. F); SP 800-137; SP 800-53 Rev. 5 (CA-2, CA-2(1), CA-5, CA-7); OSCAL 1.2.3; FedRAMP 2026 (SDR-CSX-KSI). Book 15, Chapters 10, 11 and 12.");
  narrate(s,
`A closed ticket proves that someone did some work. An assessed control proves the work held, and only the second belongs in front of an authorizing official.

The program's rule is simple: a control is proven by evidence a system produced whenever a system can observe it, and a person attests only to what no system can observe, such as a policy approval, a contract clause or a physical inspection. The package says which is which. Federal guidance supports both halves: SP 800-137 says monitoring can't be achieved by manual processes alone or automated processes alone. What the program won't do is let a signature stand in for a reading a system could have taken; that's a finding, because the package claims less than it could prove.

The loop has four steps: map each control to the tests that evidence it, test on a schedule, turn every gap into a POA&M item with one owner, and emit assessed state and the POA&M in OSCAL. Three POA&M rules follow, all design. An item closes on a passing re-test, not on ticket closure. A slipped milestone escalates; it doesn't quietly move. And the POA&M is never a parallel spreadsheet. The independent assessor stays: automated results are evidence for them, not a substitute.

One correction from the book: FedRAMP's Key Security Indicators bind providers, not agencies. The system owner owns the system's day-two evidence; the ISSO regenerates the results monthly.`,
  "Book 15, Chapter 11 — Attestation, Evidence and the Compliance Application (System evidence first; The attestation loop; A correction about FedRAMP's indicators); Chapter 12 (monthly regeneration); Chapter 10 (day-two evidence in the package).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Buy the native compliance apps first; build the gaps");
  tag(s, "How");
  const n = [
    ["Control records, scheduled tests, issues", "Policy and Compliance Mgmt", "Load controls from the control map"],
    ["RMF workflow, package, POA&M view", "Continuous Authorization and Monitoring", "Link each POA&M item to its task"],
    ["OSCAL export of plan, POA&M, results", "CAM, recent releases", "Validate against the OSCAL release"],
    ["Posture findings into tracked work", "Configuration Compliance (commercial Azure)", "A path for Azure Gov, AWS, VMware"],
    ["Closure only with proof; map kept in step", "Workflow configuration; none", "Closure gate; a map check in CI"],
  ];
  leftTable(s, ["Need", "Native coverage", "What the agency adds"], n.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [3.7, 3.75, 4.7], [0.34, 0.5], 12);
  decision(s, "Configure the platform's native compliance applications first, and build only reconciliation, the closure gate and the map check",
    "CIO, with the ITSM platform team", "Before any custom build");
  sources(s, "Sources: ServiceNow PCM, CAM and Configuration Compliance docs; Microsoft Learn (Defender for Cloud support matrix); FedRAMP Marketplace (Oct 21, 2026). Book 15, Chapter 11.");
  narrate(s,
`Before anyone builds a compliance application, the agency should know what its platform already does. As of October 2026, and every release changes this, ServiceNow ships much of the attestation loop. Policy and Compliance Management schedules control tests and turns gaps into issues. Continuous Authorization and Monitoring walks the seven RMF steps, shows every POA&M in one view, and in recent releases imports and exports OSCAL security plans, POA&Ms, assessment plans and results. It's a separate subscription. Configuration Compliance imports Defender for Cloud findings, but Microsoft lists that integration as not available in Azure Government. A partner has announced an application for FedRAMP's indicators; that's a vendor announcement, not a verified capability.

The platform itself is authorized for federal use: the Marketplace lists ServiceNow's Government Community Cloud at Class D, High, with 101 agency authorizations as of October 21, 2026.

So the program's recommendation is buy first, build only what's missing. What the native applications don't provide, as far as the program could verify, is specific to this design: joining every finding to the authoritative asset identity before a task is raised, a closure gate that demands proof and flags human-only closures, and a check that keeps the platform's control set in step with the authoritative control map. If the platform team can deliver those as configuration, skip the custom build. Build-or-buy is a scope and funding decision.`,
  "Book 15, Chapter 11 (The platform is the workflow record, not the evidence store; What ServiceNow already provides; Build, buy or both); Chapter 10 (scope and funding: CIO).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "The runbook checks the automation, not just the estate");
  tag(s, "How");
  figSide(s, "ch12-harnesses", 6.3, "Harness", "FaShieldHalved", HEX.red, HEX.redTint, "Make silent failure loud", [
    "A dark log source is a control outage, not a hygiene item",
    "Replay known-bad events weekly to prove detections still fire",
    "Count human-only closures; review them every week",
    "A harness that stops running looks like one that passes",
  ], 13.5);
  decision(s, "Alert at high severity on any silent log source, and have the ISSO confirm every month that each harness ran and its failures became work",
    "ISSO; security operations runs the daily check", "Daily check; monthly review");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and 53B (CA-2, CA-7, CA-7(3), SI-4, SI-6, AU-9, AC-6(7)); Microsoft Sentinel connector health; ServiceNow ATF. Book 15, Chapter 12.");
  narrate(s,
`Two things make a runbook more than a checklist. Each step says what it proves, so an operator who skips one knows what evidence stops arriving. And the runbook checks the automation, not just the estate, because the most dangerous failure in an automated operation is a silent one: a log source that stops sending, a detection that stopped matching after a schema change, a pipeline that deployed without closing its control. A control that fails silently is worse than one known to be absent; it carries false confidence into an authorization.

The cadence is design: daily probes and routing, weekly tests of the detectors, monthly regeneration and review, and quarterly step-back reviews, including privileged access, which is never a self-review.

The harnesses make silent failure loud. The telemetry-completeness check is the most valuable: a source past its freshness limit raises a high-severity alert, because a dark source is a control outage. The detection-efficacy replay runs known-bad but harmless events and asserts the rule still fires. Human-only closures are counted and reviewed weekly, either evidenced or reopened.

The book is honest about limits. Efficacy tests bound regression; they don't prove coverage. At Moderate the harnesses are CA-2 and CA-7 evidence, not SI-6, which is High only. And a harness that stops running looks exactly like one that passes, which is why the ISSO's monthly review checks that each one ran.`,
  "Book 15, Chapter 12 — The Day-Two Operator Runbook and Validation (The runbook at a glance; Weekly, monthly and quarterly; Validation and test harnesses; What the harnesses can't prove).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Day-two decisions: owners and timing");
  tag(s, "How");
  const asks = [
    ["Close a wave only after reset, unlock, joiner and leaver run", "CIO", "Each wave's go/no-go"],
    ["Set the verification ladder; alert on every reset", "CISO", "Before cutover; yearly"],
    ["Fund operation: owner, gate, clock, evidence feed", "CIO and sponsor", "Next budget cycle"],
    ["Hold the platform to the contract; record its certification", "CIO; platform AO", "Selection or renewal"],
    ["One front door; count every side door", "Desk manager; IGO", "Before first cutover"],
    ["Scope and review the desk's privileged group", "IGO", "Quarterly"],
    ["Two approvers on high-risk tasks; a verdict before consent", "CISO; IGO", "Before go-live; each app"],
    ["Decide every shadow asset; keep the platform read-only", "System owner; CISO", "Weekly; before connectors"],
    ["One owner per artifact; staff the desk from its measures", "CIO", "Before go-live; monthly"],
    ["Approval-rule changes are normal changes", "CAB", "First platform release"],
    ["POA&M closes on re-test; buy native apps first", "System owner; CIO", "Monthly; before any build"],
    ["Alert on dark sources; confirm every harness ran", "ISSO; security ops", "Daily; monthly"],
  ];
  const colW = [6.65, 2.75, 2.75];
  const est = asks.reduce((h, r) => h + Math.max(0.33, Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, 11.5))) * lh(11.5) + 0.1), 0.34);
  fit("decision table", 1.45 + est, 5.82);
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts(colW, { y: 1.45, w: colW.reduce((a, b) => a + b, 0), fontSize: 11.5, rowH: [0.32, ...asks.map(() => 0.33)] }));
  txt(s, "Close line", [{ text: "None of these is a procurement.  ", options: { bold: true, color: HEX.amber } },
    { text: "Make the governed path the easiest path, and the evidence writes itself." }],
    { x: 0.6, y: 5.9, w: 12.15, h: 0.55, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5; SP 800-63B-4; OMB M-22-09; CISA BOD 25-01, BOD 26-04; FedRAMP 2026 rules. Book 15, Chapters 01–12; owners from Chapter 10.");
  narrate(s,
`So, the decisions, with their owners and timing. None of them is a procurement.

The CIO calls a wave complete only after a reset, an unlock, a joiner and a leaver have run under the new model; funds the operating layer with the executive sponsor; holds whatever coordination platform the agency uses to the contract, with its own authorizing official; gives every catalog item, runbook and configuration class one owner and a review date; staffs the desk from its measures; and buys the native compliance applications before building anything.

The CISO sets the identity-verification ladder for resets and recovery, alerts on every reset, owns the gate on high-risk tasks, and keeps the automation's identity read-only on the estate. The identity governance officer reviews the desk's privileged access group quarterly and records an authorization verdict before any SaaS consent. The service desk manager closes the side doors into one front door.

System owners decide every shadow asset and own their system's day-two evidence, with POA&M items closing only on re-test. The change advisory board treats any change to approval rules, routing or integrations as a normal change. And the ISSO confirms every month that each harness ran, while security operations alerts on any dark source.

The next step needs no procurement: run one reset, one joiner and one leaver end to end under the new model, and look at what the record shows. Make the governed path the easiest path, and the evidence writes itself. Book 15 has the detail, with every claim footnoted. Thank you.`,
  "Book 15, Chapters 01–12 (owners from Chapter 10's responsibility matrix and artifact-ownership table; timing from the chapters named on each slide, otherwise design guidance).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", checkTitle("Backup"));
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal policy, NIST and the law");
  const src = [
    "OMB M-22-09 (January 26, 2022); M-24-08 (December 21, 2023).  ·  CISA BOD 25-01 (MS.AAD.5.1–5.3); BOD 26-04 (June 10, 2026); Advisory AA23-320A, Scattered Spider (revised July 29, 2025).  ·  36 CFR part 1194 (Revised 508 Standards); 47 CFR part 9 (Kari's Law and RAY BAUM'S Act rules).",
    "NIST SP 800-63B-4 (July 2025, §§ 2.2.2, 3.2.5, 4.1.2.1, 4.2, 4.6).  ·  SP 800-37 Rev. 2 (Task M-1; Appendices D and F).  ·  SP 800-137.  ·  SP 800-128 (§§ 2.3.3, 2.4, 3.3.2).  ·  OSCAL 1.2.3 (August 7, 2026).",
    "NIST SP 800-53 Rev. 5, release 5.2.0, and SP 800-53B: AC-2, AC-2(1), AC-2(3), AC-2(4), AC-5, AC-6, AC-6(7), AC-6(9), AC-7, AC-20, AU-6, AU-6(1), AU-9, AU-12(1), CA-2, CA-2(1), CA-3, CA-5, CA-7, CA-7(3), CM-2, CM-3, CM-3(4), CM-5, CM-6, CM-8, CM-8(1), CM-8(4), CM-8(9), CM-9, CM-9(1), IA-5, IA-5(1), IA-12, PS-4, PS-5, RA-5, SA-9, SI-2, SI-4, SI-6.",
    "FedRAMP Consolidated Rules for 2026: Using a FedRAMP Certified Cloud Service; Key Security Indicators (46 in ten themes); SDR-CSX-KSI; Vulnerability Detection and Response.  ·  FedRAMP Marketplace products.json (read October 21, 2026).",
  ];
  fit("Source list 1", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 1", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: platforms, as of October 2026");
  const src = [
    "Microsoft Learn: Entra built-in and privileged roles; MFA user settings; self-service password reset and writeback; Temporary Access Pass; Privileged Identity Management; restricted management administrative units; audit activities and retention; Entra Connect hard and soft match; Verified ID help desk and account recovery.",
    "Microsoft Learn: Defender for Cloud ServiceNow integration and support matrix; Azure Policy; Purview Compliance Manager; Microsoft Graph national clouds; Entra Connect Health and scheduler; Sentinel connector health; Log Analytics data deletion.",
    "ServiceNow documentation: Microsoft Entra ID Spoke; MID Server; Ask for Approval; change types and CAB workbench; CSDM; CMDB Data Manager; Policy and Compliance Management; Continuous Authorization and Monitoring; Configuration Compliance; Automated Test Framework.  ·  AWS: Config, Security Hub CSPM, Audit Manager availability change.  ·  Broadcom: VCF 9.0 and 9.1 Operations.",
    "Full footnotes with links and access dates (October 21–22, 2026): Book 15, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b15-day2-operations/).",
  ];
  fit("Source list 2", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 2", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// The narration (narration.json) must name every slide before "Backup", in order, with the slide's own title.
const NARR = path.join(__dirname, "narration.json");
if (fs.existsSync(NARR)) {
  const nj = JSON.parse(fs.readFileSync(NARR, "utf8"));
  const narrated = titles.slice(0, titles.indexOf("Backup"));
  if (nj.length !== narrated.length) console.warn(`  ! narration.json has ${nj.length} entries for ${narrated.length} narrated slides`);
  nj.forEach((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i + 1} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title "${e.title}" doesn't match the slide ("${narrated[i]}")`);
  });
  const said = nj.map((e) => e.say.split(/\s+/).filter(Boolean).length);
  console.log(`narration.json: ${said.reduce((a, b) => a + b, 0)} words (${said.join(", ")}), about ${mmss(said.reduce((a, b) => a + b, 0) * 60 / 150)} at 150 wpm`);
} else console.warn("  ! narration.json is missing");
console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
