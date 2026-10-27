// Book 13 — Governance, Drift & Evidence: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the CISO, authorizing officials and the program office.
// Decision-centered: every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B13_Governance_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b13-governance/, named in the notes. Decision owners come
// from the book's responsibility matrix (Chapter 09) and the chapters' own decision rules; where an owner or a timing
// is the program's own recommendation, the notes say "design" or "design guidance". The 15-minute deck, the
// ticket-to-machine reference and the technical deep dive carry the mechanics; this deck carries the decisions.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 13", title: "Governance, Drift & Evidence: the executive briefing",
  footer: "Federal Modernization Workbook  ·  Book 13 Governance, Drift & Evidence  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B13_Governance_Executive.pptx";

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

// ---------------------------------------------------------------- layout helpers (as in the Book 14 briefing)
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
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b13-governance");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
// A committed diagram on the left (from x 0.6), keeping the PNG's aspect ratio (read from its header) inside
// maxW x 3.6 and centered vertically in the 1.5–5.1 band. Returns its width so a side box can take the rest.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b13-governance", "png");
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

const S_WHY = "Why compliance decays", S_WHAT = "What keeps the record true", S_WHO = "Who governs", S_HOW = "How it runs at scale";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, checkTitle("Governance, Drift & Evidence: the executive briefing"), "Book 13  ·  Governance that doesn't decay");
  D.agenda(s, 0.8, 4.82, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for the CIO, the CISO, authorizing officials and the program office", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 9.5, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 13 of the Federal Modernization Workbook, Governance, Drift and Evidence. It runs about thirty minutes, for the people who fund federal systems, sign for them or answer for them: the CIO, the CISO, the authorizing officials and the program office that keeps the governance running day to day.

The book answers one question: why does compliance decay the day after the audit? Its answer fits in three sentences. An assessment measures one day, and the estate starts changing the next morning. Governance that doesn't decay needs one authoritative record, a single path for every change to it, and evidence the systems produce rather than statements people sign. And the platform that does this can't decide anything, so named people own the record, its rules, its findings and its gaps.

I'll take four parts: why compliance decays; what keeps the record true; who governs it; and how it runs at machine tempo, across agencies and at scale. Every decision slide names the decision, its owner and when it's needed. Where the owner or the timing is the program's own recommendation rather than a federal assignment, the notes say so. Every external claim was checked against its source on October 21, 2026.`,
  "Book 13, index; Chapter 01 — Why Compliance Decays the Day After the Audit; Chapter 09 — Who Governs.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "Compliance decays the day after the audit");
  tag(s, "Why");
  figSide(s, "ch01-point-in-time-gap", 6.3, "Modes", "FaTriangleExclamation", HEX.red, HEX.redTint, "Four structural failure modes", [
    "Fragmented identity context: copies of the same fact disagree",
    "Uncorrelated telemetry: combined by hand at every audit",
    "Point-in-time evidence: rebuilt each cycle, never regenerated",
    "Tool-shaped policy: the intent leaves with the tool",
  ], 14);
  decision(s, "Fix the layer beneath the tools, where the program records what should be true and checks it, before buying another tool",
    "CIO, with the authorizing officials", "Before the next tool purchase");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task M-1); SP 800-137 (§2.4, roles). Book 13, Chapter 01; Chapter 09 for the CIO's funding role. The four modes are the program's diagnostic.");
  narrate(s,
`Picture the week an authorization package is signed. The system security plan describes the system as it is, the assessment results match the configuration, and the plan of action lists every known weakness. On that day the package is true. The next morning an administrator changes a firewall rule to fix an outage, a contractor's role ends but the account stays enabled, a cloud provider ships a new default. Most of it is authorized. None of it reaches the package, and the next assessment rediscovers the gap as new findings.

The book is careful to say these aren't failures of people. It names four structural failure modes, and a program that recognizes all four has a structural problem, not a staffing one. Identity facts mastered in one place and copied everywhere, each copy with its own idea of freshness. Telemetry in every tool's own shape, combined by hand at each audit. Evidence rebuilt by hand each cycle instead of regenerated from what the systems record. And policy recorded inside the tool that enforces it, so it doesn't survive a platform change.

Each looks like a tooling gap and none is: every fix sits beneath the tools. SP 800-137 has the CIO lead the monitoring program and work with authorizing officials to fund it. The timing here is design guidance: decide before the next purchase.`,
  "Book 13, Chapter 01 — Why Compliance Decays the Day After the Audit (Four structural failure modes; Where each fix actually lives; Why more tooling doesn't fix it); Chapter 09 (Where the roles come from: SP 800-137).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Federal policy already points past the snapshot");
  tag(s, "Why");
  figSide(s, "ch01-two-responses", 5.4, "Policy", "FaLandmark", HEX.navy, HEX.navyTint, "What the rules already ask", [
    "FISMA: test no less than annually, with automated tools",
    "SP 800-137: monitoring is ongoing awareness, not a calendar",
    "SP 800-37 Task M-6: the AO reviews posture on an ongoing basis",
    "A-130: move eligible systems to ongoing authorization",
    "NIST: not practical without substantial automation",
  ], 13.5);
  decision(s, "Answer the next findings by making evidence regenerable from the record, not by adding checkpoints and reviewers",
    "CISO", "At the next findings response");
  sources(s, "Sources: FISMA, 44 U.S.C. § 3554(b)(5); NIST SP 800-137; SP 800-37 Rev. 2 (Task M-6, Appendix F); SP 800-53 Rev. 5 (CA-7); OMB Circular A-130, App. I. Book 13, Chapter 01.");
  narrate(s,
`None of this contradicts federal policy. The policy already points away from the snapshot; what lags is practice.

FISMA requires testing "with a frequency depending on risk, but no less than annually," and requires that testing to include automated tools. SP 800-137 defines continuous monitoring as ongoing awareness to support risk decisions, and says its purpose is to make an assessment process that is otherwise static between authorizations a dynamic one. CA-7 turns that into a control. SP 800-37's Monitor step ends in Task M-6, where the authorizing official reviews posture on an ongoing basis. And Circular A-130 directs agencies to move eligible systems to ongoing authorization with the authorizing official's approval.

NIST also says why so few systems get there: if a substantial portion of monitoring isn't automated, the move from static to ongoing authorization won't be feasible or practical. It suggests a phased path, starting with automated information and low-impact systems.

The diagram shows the two responses to findings. Checkbox governance adds controls, checkpoints and reviewers; reporting gets heavier, reviewers approve by pattern, and the drift is found again next cycle. The program's response, which is design, is evidence regenerated deterministically from the record. SP 800-137 gives the senior information security officer the monitoring program and its tools, so the decision sits with the CISO.`,
  "Book 13, Chapter 01 (The compliance paradox; Why checkbox governance makes it worse; What federal guidance already asks for; The deterministic response); Chapter 09 (SP 800-137 roles).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Drift: continuous, silent, and the opening for attack");
  tag(s, "Why");
  figSide(s, "ch02-drift-sources", 6.3, "CM", "FaListCheck", HEX.navy, HEX.navyTint, "Required, though never named", [
    "CM-2: a current baseline under configuration control",
    "CM-3: only approved, recorded change",
    "CM-6: every deviation identified and approved",
    "CA-7: someone keeps checking, and acts",
  ], 13.5);
  decision(s, "Make drift against the record a standing finding in the monitoring strategy, each with a class, a severity and an owner",
    "CISO", "Next strategy review; at least yearly");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task M-1); SP 800-137 (§3.2.2); SP 800-53 Rev. 5 (CM-2, CM-3, CM-6, CA-7); NSA and CISA advisory AA23-278A. Book 13, Chapters 02 and 09.");
  narrate(s,
`Drift is any difference between what the authoritative record says should be true and what the running estate does: a setting changed and never recorded, an account that outlived its owner, a group rule that stopped evaluating.

SP 800-37 names where it comes from, and the program designs for all five: unauthorized change, from adversaries or from honest mistakes by authorized staff; approved change made outside change control and never written back; changes by external providers, which NIST says can be difficult to detect; staff turnover; and hardware, software and firmware upgrades. SP 800-137 calls configuration the most volatile area.

The program ranks drift first among governance threats for three reasons. It's continuous, so there's no single moment to catch it. It's silent, because every system keeps reporting the declared state, and that is exactly what drift has moved away from. And it's the opening other threats use. NSA and CISA's 2023 advisory called the misconfigurations their teams found "systemic weaknesses across many networks."

NIST never says "drift," but CM-2, CM-3, CM-6 and CA-7 read together describe finding it. The decision gives the CISO, who decides on monitoring evidence and drift findings in the book's matrix, a standing finding in the strategy. The strategy is reviewed at least yearly, the program's cadence.`,
  "Book 13, Chapter 02 — Drift Is the Primary Threat (What drift is, in NIST's terms; Where drift comes from; Why drift is the primary threat; From naming to discipline); Chapter 09 (Cadence; The responsibility matrix: continuous monitoring evidence and drift findings).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "One record, and one owner for every fact in it");
  tag(s, "What");
  figSide(s, "ch03-record-and-pointers", 6.3, "Record", "FaDatabase", HEX.navy, HEX.navyTint, "The record holds the authority", [
    "Desired state, rules and an authority map; runtime systems only read it",
    "HR owns who a worker is; the asset registry owns devices; infrastructure as code owns declared infrastructure",
    "Corrections flow upstream to the owning source, never to the copy",
    "A write to a demoted copy is critical: a second source of truth growing back",
  ], 14);
  decision(s, "Settle the record before the next migration: which system owns each fact, how each value is derived, and the provenance it carries",
    "Steward; information owners decide meaning", "Before the next migration wave");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-2); FedRAMP 2026 Rev5 control reference (CM); Microsoft Graph, onPremisesExtensionAttributes. Book 13, Chapters 01, 03, 06 and 09.");
  narrate(s,
`Drift can only be measured against something. If every system holds its own copy of the truth, there's nothing to measure against.

The program keeps one authoritative record. It holds desired state, the schemas, the rules and an authority map. It doesn't master every fact itself: a person's employment status is created by a personnel action, not a commit. What it holds is which system owns each fact, which receives a derived copy, how the copy is derived and who may write it. The HR system of record owns who a worker is; the asset-lifecycle registry owns devices, because enrollment is enforcement, not truth; the infrastructure-as-code repository owns declared infrastructure.

Two rules follow. Corrections flow upstream, to the owning source or the derivation rule, never to the copy. And a write to a copy that has been demoted is a contention finding, critical when the copy is in use, because it's a second source of truth growing back. The record maps onto CM-2's baseline under configuration control, extended from settings to the facts the settings depend on.

Chapter 01 makes the timing point: settle the record before the change, so a migration changes which system supplies a fact rather than what it means. The steward keeps the record; each fact's meaning is decided by its information owner, HR, an application owner or a data owner.`,
  "Book 13, Chapter 03 — One Authoritative Record (What the record is; Who is authoritative for what; Changing the record, and measuring against it); Chapter 01 (Governance has to lead the change); Chapter 06 (contention); Chapter 09 (Who keeps the authoritative record, and who decides what it says).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Every change travels one path; urgency gets no second");
  tag(s, "What");
  figSide(s, "ch04-five-clause-path", 5.3, "Lane", "FaRoute", HEX.amber, HEX.amberTint, "No second lane", [
    "Five classes: move, add, change, delete, reset",
    "Pre-approved lanes are standing grants with a scope and an expiry",
    "Two people per change; administrators can't bypass",
    "An emergency change is back-ported to the record within one business day",
  ], 14);
  decision(s, "Make the repository's protections bind administrators too, and back-port every emergency change to the record within one business day",
    "Steward, as custodian of the record", "Now; design guidance");
  sources(s, "Sources: Microsoft Entra PIM documentation; GitHub, About protected branches; FedRAMP 2026 Key Security Indicators (CMT). Book 13, Chapters 04 and 09. The path is the program's design.");
  narrate(s,
`An authoritative record is only as good as the path into it. Most drift isn't malicious: a technician fixing a group membership in the portal, a hotfix during an outage, a migration script run with a standing administrator account over a weekend. Each may be correct, and none leaves the record able to say who asked, who approved or whether it worked.

So the program, by design, has one path for every operational change and no second path for urgent or routine work. Every change is one of five classes: move, add, change, deletion or reset. Every one travels five clauses: it originates from the source of truth, is authorized from the authority model, executes under least privilege elevated just in time, closes with provenance, and emits its evidence automatically. Skip a clause and it isn't a change with a missing form. It's a drift finding.

Pre-authorized lanes are allowed, but they are standing authorizations with a scope and an expiry, never the absence of approval. Changes to the record itself are pull requests with at least one approver other than the author. Branch-protection rules don't bind administrators by default, so a separate setting has to: a rule administrators can skip is a standing exception. Emergencies get a path, not an exemption, and the drift monitor reports the change until it's back-ported. The steward holds custody of those protections in the book's matrix.`,
  "Book 13, Chapter 04 — Change Control and Provenance (Five change classes; The five-clause path; Changing the record: pull requests; Two identities, not one); Chapter 09 (responsibility matrix: custody of the record).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "From gate G0: no new dependency on Active Directory");
  tag(s, "What");
  rows(s, "AD", "WHAT COUNTS AS A NEW DEPENDENCY (DESIGN GUIDANCE)", [
    ["Join", "A new server or device joined to the domain"],
    ["Protocol", "A new app using Kerberos, NTLM or LDAP"],
    ["Accounts", "A new SPN, gMSA or AD service account"],
    ["Policy", "A new GPO, or new settings in an existing one"],
    ["Groups", "A new AD security group used to grant access"],
    ["Plumbing", "A new AD-integrated DNS zone, trust or AD CS use"],
  ], 1.88, 0.535, 0.47, 6.3);
  sideBox(s, "Exception", "FaUserXmark", HEX.red, HEX.redTint, "A yes is an exception, not an approval", [
    "Owner, reason, end date and the Entra alternative considered",
    "The AO approves it: keeping AD open is a risk acceptance",
    "It joins the Phase 4 retirement list",
    "A weekly check against the G0 baseline flags anything unexplained",
  ], 13.5, 7.15, 5.6);
  decision(s, "Approve each new Active Directory dependency only as a dated exception that names the Entra alternative considered",
    "Authorizing official", "From gate G0, on every Add and Change");
  sources(s, "Sources: Microsoft Learn, Implement a cloud-first approach (change approval; Entra Domain Services by exception), accessed Oct 25, 2026. Book 13, Chapter 04.");
  narrate(s,
`A migration that retires Active Directory runs for most of a year, and the estate doesn't stop changing while it does. Every new domain-joined server, every application that binds over LDAP, every service account and every Group Policy setting added during that year is one more thing to unwind before the domain controllers can go.

So from gate G0 the change process asks one question of every Add and Change: does this create a new dependency on Active Directory? Microsoft's guidance for leaving AD puts the same step first in its cloud-first phase: update change approval so it evaluates whether a change adds a dependency on AD DS, and evaluate Microsoft Entra alternatives when it does.

The list on the left is the book's design guidance. One carve-out: the domain controller and LDAPS certificates stay on AD Certificate Services until AD retires, as Book 07 describes.

A yes isn't automatically a no. Some workloads have no modern path yet, and Microsoft names Entra Domain Services for applications that still need legacy protocols when nothing more current works. But a yes becomes an exception, not a routine approval. It carries an owner, a reason, an end date and the alternative considered; the authorizing official approves it, because keeping AD dependencies open is a risk acceptance; and it goes on the list Phase 4 must retire. Measurement backs the question: anything new that no approved change or exception explains is a drift finding.`,
  "Book 13, Chapter 04 — Change Control and Provenance (No new dependencies on Active Directory).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "A closure without its proof is prose, not evidence");
  tag(s, "What");
  figSide(s, "ch04-closure-record", 6.3, "Proof", "FaClipboardCheck", HEX.teal, HEX.tealTint, "Three rules (program design)", [
    "Every closure carries its check, its time and what checked it",
    "Human-only closure is flagged, counted apart, never aggregated",
    "Reports are re-runnable derivations, never compilations",
    "A weak probe proves little; checks are reviewed like rules",
  ], 13.5);
  decision(s, "Report human-only closures as their own count, never inside control tests, monitoring evidence or service-level attainment",
    "CISO", "From the next monthly metric review");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-5(1), AU-10) and SP 800-53B; FedRAMP 2026 Rev5 control reference (AU). Book 13, Chapters 04 and 09. The three rules are program design.");
  narrate(s,
`Clause four, closing with provenance, is the strictest part of the path, and it gets its own rule. A remediation task, a daily check, a plan-of-action milestone or a control test closed by a person clicking "complete," with no machine-readable verification attached, is prose, not evidence. It asserts that work happened. It proves nothing an assessor can consume.

The rule has three requirements, all program design. Every closure carries provenance: the verification payload that justified it, a timestamp and the identity of the checking mechanism. Human-only closure is an exception state, not a path. Operations need an escape hatch, so it stays possible, but it's flagged, counted separately and never folded into control tests, continuous-monitoring evidence or service-level attainment. A pipeline that can't tell probe-backed closures from attested-only ones is attesting fiction. And reports are derivations, generated from the closure stream by something that can be re-run and diffed.

Two control notes keep this honest. Non-repudiation, AU-10, is a High-baseline control, so a Moderate system doesn't have to evidence it, though the program signs anyway. And verification is only as good as the probe. The CISO decides whether a closure carries enough proof, and the CISO's monthly metric review is where the separate count belongs.`,
  "Book 13, Chapter 04 (Provenance for every state change; No closure counts unless it carries its proof; How the path lines up with the controls; Honest limits); Chapter 09 (Who reviews drift; Cadence: CISO metric review).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Evidence anyone can re-run, not a statement to trust");
  tag(s, "What");
  figSide(s, "ch05-rerun-is-verification", 5.0, "Guide", "FaFileShield", HEX.navy, HEX.navyTint, "Federal guidance goes most of the way", [
    "SP 800-53A: an automated desired-versus-actual comparison counts as assessment results",
    "SP 800-37: a tool's report can be the assessment report",
    "FedRAMP 2026: don't simply review documentation or screenshots",
    "Policies, training and contracts stay attestations; say which",
  ], 13.5);
  decision(s, "Give assessors their own read access to the archived inputs and the pipeline, so the assessor, not the operator, does the re-run",
    "Authorizing official", "Before the next ongoing assessment");
  sources(s, "Sources: NIST SP 800-53A Rev. 5 (§3.2.3.5, App. F); SP 800-37 Rev. 2; FedRAMP 2026 rules (IVV-IAS-VIM); RFC 8785. Book 13, Chapters 05, 07 and 09.");
  narrate(s,
`An attestation answers who is accountable for a claim, and federal authorization needs that: nothing here removes a single signature. Evidence answers a different question: is the claim true, and can I check it?

The program's property is determinism, which is design, not a federal rule. Given the same version of the record and the same collected inputs, the platform produces the same evidence, byte for byte. Automation makes the answer arrive faster; determinism makes it the same answer no matter who asks. Verification becomes a re-run and a comparison of hashes, not an interview.

Federal guidance goes most of the way. SP 800-53A describes expressing intended state as data compared automatically with actual state, and says the resulting information is equivalent to assessment results. SP 800-37 says a tool's report that contains what an assessment report must is the assessment report, and that manual assessment covers what tools can't. FedRAMP's 2026 rules tell independent assessors not to simply review documentation or screenshots.

Two limits. Some controls stay attestations: a policy's approval, a training record, a contract clause. And regeneration needs the archived inputs, kept as long as the records schedule requires. SP 800-53A's reuse test asks about independence, which a re-run answers only if the assessor runs it. The authorizing official sets that independence.`,
  "Book 13, Chapter 05 — Deterministic Governance (The same inputs, the same evidence; Automation is not determinism; Honest limits); Chapter 07 — Evidence Over Attestation (Two artifacts, two questions; What federal assessment guidance already says; What an assessor can verify); Chapter 09 (assessor independence).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "The drift engine: severity is computed, not argued");
  tag(s, "What");
  figSide(s, "ch06-drift-pipeline", 5.3, "Never", "FaShieldHalved", HEX.red, HEX.redTint, "What the engine never does", [
    "Auto-fix a P1: it halts and alerts a named role",
    "Edit the record, or judge whether a rule is right",
    "Accept risk: only the AO does",
    "Built today: schema and provenance; semantic partial; authorization and identity by people",
  ], 13.5);
  decision(s, "Change the drift classifier or its severity thresholds only with a reviewer from outside the program office",
    "Steward; the CISO's staff reviews", "Every change to the platform");
  sources(s, "Sources: NIST SP 800-128; SP 800-53 Rev. 5 (CA-7, CM-3(5), CM-6(2)); SP 800-53B. Book 13, Chapters 06 and 09. Severities, windows and maturity (Oct 2026) are program design.");
  narrate(s,
`The drift engine compares the estate with a versioned record, not a last-known-good snapshot. That matters: an approved change updates the record first, so it isn't drift, and every finding can be re-derived later.

Every finding gets one of five classes: schema, semantic, provenance, authorization or identity. Severity is computed from the class and whether the claim is in active use. Live provenance, authorization or identity drift is P1: halt and alert, never remediated automatically. The others run on the program's default clocks: one hour, twenty-four hours, seventy-two. Those are design; CA-7 leaves frequencies and responses to the agency. Severity sets the clock; the actuation ladder decides who may act, with gated actuation, a person approving, as the default ceiling.

The engine never edits the record, never judges whether a rule is correct, and never accepts risk.

Describe it to an assessor as built, not as designed. As of October 2026, schema and provenance detection are built; semantic detection is partly built; authorization and identity drift are design only, found today by the domain books' assessment modules and by people.

The most dangerous change in the system is a change to what counts as drift: a classifier tuned to ignore a class removes evidence as surely as deleting it. The steward decides those changes, with a reviewer from outside the program office, typically the CISO's staff.`,
  "Book 13, Chapter 06 — The Drift Engine (What the engine compares against; Severity; What the engine remediates, and what it doesn't; What is built today); Chapter 09 (Who approves rule changes: the platform row).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Who governs: one decider for every decision");
  tag(s, "Who");
  figSide(s, "ch09-who-governs", 6.3, "Roles", "FaUsersGear", HEX.teal, HEX.tealTint, "Two jobs kept apart", [
    "The steward keeps the record; information owners decide what its facts mean",
    "The CISO decides requirements and drift evidence",
    "The AO alone accepts risk; government personnel only",
    "The board reviews and never votes",
  ], 13.5);
  decision(s, "Charter the governance board in writing, name the steward, and give every kind of decision one named decider",
    "Sponsor and CIO", "Before the first rule change");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix D; Tasks P-7, M-1, M-6); SP 800-137 (§2.4); SP 800-53 Rev. 5 (CM-3, CM-3(4)); OMB M-19-17. Book 13, Chapter 09.");
  narrate(s,
`A governance platform can detect every drift and still decay, because the platform can't decide anything. A drift finding is a question: should the estate change to match the record, should the record change to match the estate, or should the agency carry the difference for a while? A machine can answer the first for routine classes. The other two need a person with authority.

Federal guidance supplies every role. SP 800-37 makes the authorizing official the only official who can accept risk, assigned to government personnel only, and defines the information owner. SP 800-137 has the CIO lead and fund the monitoring program and the senior information security officer run it. And CM-3 supplies the board: a change control element with security and privacy representatives.

The book keeps two jobs apart. The steward keeps the record: its protections, merge rights, checks and backups. The steward doesn't decide what facts mean; information owners do. A steward who edits a fact to make a finding go away has made someone else's decision. The CISO decides control requirements written as rules, and decides on drift evidence.

The board reviews; it doesn't vote. Every agenda item has one decider. The sponsor and CIO charter it, because they own scope and funding, and the charter is re-signed yearly. It can sit alongside the agency's risk executive function or ICAM governance; it doesn't replace them.`,
  "Book 13, Chapter 09 — Who Governs (Where the roles come from; Who keeps the authoritative record, and who decides what it says; The governance board; Cadence: board charter review).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Exceptions: bounded by the CISO, open-ended by the AO");
  tag(s, "Who");
  figSide(s, "ch09-exception-routing", 5.6, "Exc", "FaUserClock", HEX.amber, HEX.amberTint, "Carried, never closed, by exception", [
    "Bounded: an end date and a compensating control; the CISO approves",
    "No end date, or no compensating control: the AO decides; it enters the POA&M",
    "The rule stays as written; the finding stays visible, marked excepted",
  ], 13.5);
  decision(s, "Review the exception register every quarter: nothing renews automatically, and an item renewed twice goes to the CISO and the AO",
    "Governance board", "Quarterly");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-5); SP 800-37 Rev. 2 (Appendix D). Book 13, Chapter 09 (Who accepts exceptions; responsibility matrix). The quarterly cadence is program design.");
  narrate(s,
`A finding that can't be closed inside its window isn't closed by exception. It's carried, by a named decision, with an end date. The program splits exceptions on time and on whether a compensating control exists, the same split the other books use.

A bounded exception has an end date and a compensating control. The system owner or platform team writes it up, the steward records it in the exception register, and the CISO approves it. A risk acceptance is anything without an end date or past the agency's limit, or anything that leaves a control unmet with no compensating control. The CISO recommends, the authorizing official for the affected system decides, and the item enters the plan of action and milestones, which CA-5 requires and SP 800-37 gives the authorizing official to approve.

An exception never edits the rule. The rule stays as written, the exception is a separate record that points at it, and the drift engine keeps reporting the difference, marked as excepted, until the end date. That way an excepted setting never looks like a passing one.

The register review is the one place the board decides, because confirming each exception is still within its terms is a check, not a risk decision. No exception renews automatically, and one renewed twice goes to the CISO and the authorizing official as a sign the rule, or the system, needs to change.`,
  "Book 13, Chapter 09 — Who Governs (Who accepts exceptions; The responsibility matrix: exception rows and the register review; Cadence).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "The AO's part: small in time, large in consequence");
  tag(s, "Who");
  const cad = [
    ["Daily", "Findings triage", "Program office"],
    ["Weekly", "Evidence and drift review", "Program office, leads"],
    ["Every 2 weeks", "Governance board", "Steward chairs"],
    ["Monthly", "CISO metric review", "CISO, steward"],
    ["Monthly", "Posture report to the AO", "System owners"],
    ["Quarterly", "Exceptions and L4 classes", "Board"],
    ["Yearly", "Monitoring strategy", "Risk executive"],
  ];
  leftTable(s, ["Cadence", "Forum", "Who"], cad.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.5, 2.85, 2.2], [0.34, 0.4], 12.5);
  sideBox(s, "AO", "FaUserTie", HEX.teal, HEX.tealTint, "What the program asks of the AO", [
    "Every carried gap, in writing, with an end date or a reason",
    "Ongoing review: is the risk still acceptable?",
    "Whether a significant change needs reauthorization",
    "Assessor independence, and each class run at L4",
  ], 13.5, 7.4, 5.35);
  decision(s, "Receive a monthly posture report regenerated from the record, and sign every open-ended gap in writing",
    "Authorizing official", "Monthly, or on a significant change");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Appendix D; Tasks P-7, M-6); SP 800-137 (§3.6). Book 13, Chapter 09 (The authorizing official's role; Cadence). The cadence is program design.");
  narrate(s,
`The authorizing official sits outside the program and above the record. The role is small in time and large in consequence, and the program asks four things of it.

First, risk acceptances. Every gap the program carries rather than closes reaches the authorizing official for the affected system in writing, with an end date or the reason it has none, and the official approves the plan of action that holds them. Second, ongoing authorization: under Task M-6 the official reviews posture on an ongoing basis and decides whether risk remains acceptable. The drift trend, the share of findings closed inside their windows and the exception register are the platform's contribution, useful only if regenerated from stored records. Third, significant change: a change to the authoritative-origin rules, the boundary or the actuation ceilings goes to the designated representative as it's decided. Fourth, assessor independence, and each class of change allowed to run without a person.

The official doesn't approve rule changes, triage findings or chair the board. The designated representative can observe the board and do the day-to-day work, but risk acceptance can't be delegated, and because the role is for government personnel only, a contractor-staffed program office can prepare every acceptance and sign none.

The cadence on the left is the program's design; the monitoring strategy and its minimum frequencies are approved by the senior accountable official for risk.`,
  "Book 13, Chapter 09 — Who Governs (The authorizing official's role; Cadence; The responsibility matrix: posture reports, ongoing authorization decision, assessor independence).");
}

// ------------------------------------------------------------------ Who 4
{
  const s = content(S_WHO, "The record is a federal record: never rewrite history");
  tag(s, "Who");
  rows(s, "Rec", "WHAT THE RECORDS RULES SAY", [
    ["Decider", "The records officer; the steward implements"],
    ["GRS 3.1", "Change records: 5 years after the system ends"],
    ["Oversight", "Compliance reports: 5 years after completion"],
    ["36 CFR 1236", "Protect integrity; keep audit trails complete"],
    ["Privacy", "Privacy office reviews new attribute flows first"],
  ], 1.88, 0.64, 0.56, 6.4);
  sideBox(s, "History", "FaCodeBranch", HEX.navy, HEX.navyTint, "History is the evidence", [
    "Protected branches and signed commits protect authenticity",
    "A force-push or a purge destroys records",
    "A leaked secret is revoked and rotated first",
    "Any purge after that is a recorded records decision",
  ], 13.5, 7.25, 5.5);
  decision(s, "Rewrite or purge repository history only with the records officer's and the CISO's concurrence",
    "Records officer", "Any rewrite or purge");
  sources(s, "Sources: 36 CFR §§ 1220.34, 1236.10; NARA GRS 3.1 (items 030, 040); NIST SP 800-53 Rev. 5 (CM-3); SP 800-37 Rev. 2 (SAOP). Book 13, Chapter 09 (Who keeps the record as a record).");
  narrate(s,
`The authoritative record is a recordkeeping system whether or not anyone calls it one. Its commit history documents who changed configuration-controlled settings, who approved them and when, which is exactly what CM-3 asks an agency to retain. Its evidence packets document control operation, and its decision records document how the agency governed its systems.

The records regulations require each agency to assign records management to a person and office with the authority to carry it out. So the records officer decides how long each class lasts and when it may be destroyed; the steward implements the schedule; the CISO is consulted. NARA's General Records Schedule 3.1 schedules configuration and change management records for destruction five years after the system is superseded or no longer needed, and oversight and compliance records five years after the activity completes. Which item fits which artifact, and whether anything is permanent, is the records officer's call.

NARA also requires protection against unauthorized alteration and audit trails that keep records complete. Protected branches, signed commits and the commit history already do most of that. The one thing that undoes them is rewriting history: a force-push or a purge destroys records. If a credential is committed by mistake, it's revoked and rotated first, so the secret in the history is worthless. The privacy office also reviews every new attribute flow into the record before it lands.`,
  "Book 13, Chapter 09 — Who Governs (Who keeps the record as a record; The responsibility matrix: retention, history rewrite and privacy rows).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Ticket to machine: the person's role stops at approval");
  tag(s, "How");
  figSide(s, "ch10-ticket-to-machine", 4.3, "TTM", "FaArrowsRotate", HEX.amber, HEX.amberTint, "Machine tempo, inside the ladder", [
    "A machine runs a versioned plan after a dry run; a re-read proves the result",
    "Qualifies when reachable, deterministic, bounded, reversible and verifiable",
    "Always gated: tenant-wide roles, Conditional Access, bulk device state",
    "No API: a declared, recorded session with an end date",
    "The help desk executes approved tickets and decides nothing",
  ], 13.5);
  decision(s, "Accept in writing each class of change allowed to run without a person (L4), with its conditions and the triggers that drop it back",
    "Authorizing official", "Before any class runs at L4; reviewed quarterly");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-3(1), CM-6(1), AC-5, AU-14) and SP 800-53B; SP 800-137; Microsoft Entra PIM. Book 13, Chapters 09 and 10. Tempo and tests are design.");
  narrate(s,
`A platform that detects perfectly and closes slowly produces a growing, accurate, timestamped list of things nobody fixed, and an assessor will read it as neglect. What keeps the list short is tempo.

The usual shape of change management is a ticket that sends a person to a console, who replies "done." That changes who's to blame, not what's proved. The program's rule is that wherever a machine can reach the surface, the ticket authorizes a machine. A human approves; the platform executes from a versioned plan under a service identity, after a dry run, and re-reads the object to verify it. The person's role stops at approval.

A class qualifies when it passes six tests, all design: reachable, deterministic, bounded, reversible, verifiable, and not on the permanent gated list. Conditional Access, tenant-wide roles, bulk device state and network policy touching thousands of endpoints stay gated whatever the maturity. Where no machine can reach, the fallback is a declared exception: an approved, time-boxed, proxied, recorded session, never a quiet trip to the console. The help desk is the front door; it executes approved tickets and decides nothing.

At the default ceiling, a person approves each instance. At L4 the approval attaches to the whole class, which accepts the risk of being wrong at machine speed. That's why the authorizing official accepts each L4 class, and the board reviews them quarterly.`,
  "Book 13, Chapter 10 — Operational Tempo: Ticket to Machine, Not Ticket to Human (The program's tempo; Ticket to machine, not ticket to human; Which change classes qualify; Approval gates; When no machine can reach the surface; How the service desk fits); Chapter 09 (Who approves rule changes: the L4 row).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Reuse by default; every agency still signs for itself");
  tag(s, "How");
  figSide(s, "ch11-one-package-many-decisions", 5.5, "Reuse", "FaRightLeft", HEX.navy, HEX.navyTint, "What reuse requires", [
    "M-24-15: presume a maintained FedRAMP package adequate",
    "Ask for more only on a documented demonstrable need",
    "Never a standalone ATO for a cloud service offering",
    "Review each provider's quarterly report; treated as MUST",
    "The 46 Key Security Indicators bind providers, not agencies",
  ], 13.5);
  decision(s, "Reuse certified packages by default, and document any demonstrable need, and notify FedRAMP, before asking for more",
    "Agency head or delegate; the AO signs the ATO", "Each new use of a certified service");
  sources(s, "Sources: OMB M-24-15; FedRAMP Consolidated Rules for 2026 (AGU-USE-ABU, AGU-AGC-NAR, CCM-AGM-ROR; KSIs); NIST SP 800-37 Rev. 2 (App. F). Book 13, Chapter 11.");
  narrate(s,
`The federal estate assesses the same controls over and over: twenty agencies, twenty assessment teams, twenty snapshots of the same data center, none current a month later.

Reuse is now the default. OMB's M-24-15 says agencies must presume the security assessment in a FedRAMP authorization package adequate for their use at or below its impact level, but only while it's maintained by continuous monitoring. An agency can set the presumption aside for a demonstrable need or a deficient package, and must document why and inform FedRAMP. FedRAMP's 2026 rules enforce it: agencies must not require materials beyond FedRAMP's requirements unless the agency head or a delegate finds a demonstrable need and notifies FedRAMP.

Reuse always ends in the agency's own signature. Each agency authorizes its own system and should never create a standalone authorization for a cloud service offering. Each must review every quarterly Ongoing Certification Report; the rule appears once as MUST and once as SHOULD, and the program treats it as MUST. The 46 Key Security Indicators bind providers, not agencies.

For a shared service many agencies consume, the book corrects its earlier "single ATO" wording: one package and one provider decision cover the platform, and each consuming agency issues its own decision. What the program adds is the evidence side: a package produced continuously stops meaning last year's snapshot.`,
  "Book 13, Chapter 11 — Reciprocity, Indicators and One Authorization (What M-24-15 says about reuse; What FedRAMP's 2026 rules add; One package for a shared service; The 2026 Key Security Indicators; What is design and what is requirement).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Ongoing authorization: a standing decision on evidence");
  tag(s, "How");
  figSide(s, "ch11-ongoing-authorization", 4.6, "OA", "FaChartLine", HEX.teal, HEX.tealTint, "How the decision works (SP 800-37)", [
    "Two conditions: a complete initial review, and monitoring at the required frequencies",
    "A new decision with no termination date",
    "Reviews on a schedule, and at once when a trigger fires",
    "Reauthorization becomes the exception",
    "Moderate and High: evidence analyzed by an independent entity",
  ], 13.5);
  decision(s, "Approve each eligible system's move to ongoing authorization, with its review frequency and the events that trigger a review",
    "Authorizing official", "When each system is eligible");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task M-6; Appendix F, ongoing authorization); OMB Circular A-130, Appendix I; OMB M-24-15. Book 13, Chapters 01 and 11.");
  narrate(s,
`Reciprocity reuses one package across agencies. Ongoing authorization reuses one package across time, and the second is what makes the first safe.

SP 800-37 defines ongoing authorization as follow-on risk determinations and acceptance decisions at agreed, documented frequencies, dependent on a robust continuous monitoring program. Circular A-130 requires agencies to transition systems to it when eligible and with the authorizing official's formal approval. Until then, systems stay on static authorizations with termination dates.

The mechanics are specific. Two conditions: an initial authorization based on a complete, zero-based review, and a monitoring program that checks the system's controls with the right rigor at the required frequencies. The official documents the transition with a new decision that is no longer bound to a termination date. Reviews are time-driven, at the strategy's frequency, and event-driven, immediately when a trigger fires; reauthorization becomes, in most cases, an event-driven action. Automation is necessary but not sufficient: manual assessments cover what tools can't, and for moderate- and high-impact systems the information comes from an entity meeting the independence requirements.

This is where the book lands. The record, controlled change, deterministic rules, drift detection and system-produced evidence are what a robust monitoring program looks like when it's built rather than described. And because FedRAMP presumes a package adequate only while it's maintained, the same evidence stream keeps reuse lawful.`,
  "Book 13, Chapter 11 (One body of evidence, one standing decision); Chapter 01 (What federal guidance already asks for).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "At scale: classify coverage and register every gap");
  tag(s, "How");
  figSide(s, "ch12-gap-lifecycle", 5.0, "Gap", "FaTableList", HEX.amber, HEX.amberTint, "Honest coverage (program design)", [
    "Covered, partial, gap or out of scope, per boundary",
    "Partial is the answer most often rounded up to covered",
    "Each gap names, when opened, the evidence that will close it",
    "Report proven and asserted counts, not one percentage",
  ], 13.5);
  decision(s, "Approve the organization-wide monitoring strategy with its minimum frequencies, and charter the monitoring program as a project",
    "Senior accountable official for risk", "Phase 0; reviewed at least yearly");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-5, CA-7, PM-4, PM-31); SP 800-37 Rev. 2 (P-5, P-7, R-4); SP 800-137; OMB Circular A-130; FISMA. Book 13, Chapter 12.");
  narrate(s,
`An agency doesn't have one estate. It has dozens or hundreds of systems, several programs at once and more than one authorization boundary. The program's scaling rule, which is design, is to hold the definitions small, one record, five drift classes, four severities, and let the uses grow: adapters, mappings and evidence. If every program could add its own class, a P1 in one would mean something different from a P1 in another.

Federal guidance draws the line between system and organization. PM-31 asks for an organization-wide monitoring strategy, and SP 800-37's Task P-7 gives it to the senior accountable official for risk, who approves it, including the minimum monitoring frequencies. The program runs monitoring as a chartered project with five phases, from charter to detection and assembly, and its charter leaves the sponsor and lead to be named, the first thing phase zero closes.

Coverage is where honesty matters. Every control, per boundary or workload, is covered, partial, a gap or out of scope. Each partial or gap enters a register that names the evidence that will close it. A gap closes by configuration, by a compensating control, or by the authorizing official's acceptance with a review date; accepted gaps leave the plan of action but stay in the register. SP 800-137 says every control must be assessed, even when it can't be automated. Report proven and asserted counts, not one percentage.`,
  "Book 13, Chapter 12 — Governance at Scale and the Continuous-Monitoring Program (What stays small and what grows; The continuous-monitoring program as a project; Coverage, gaps and how gaps close; The honest limits of coverage).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Governance decisions: owners and timing");
  tag(s, "How");
  const asks = [
    ["Fix the layer beneath the tools before buying another tool", "CIO, with AOs", "Before the next purchase"],
    ["Make drift a standing finding; answer findings with regenerable evidence", "CISO", "Next strategy review"],
    ["Settle the record: who owns each fact and how it's derived", "Steward; info owners", "Before the next wave"],
    ["Bind protections to administrators; back-port emergencies in a day", "Steward", "Now"],
    ["Approve each new AD dependency only as a dated exception", "AO", "From gate G0"],
    ["Count human-only closures on their own", "CISO", "Next monthly review"],
    ["Let assessors re-run the evidence; accept each L4 class in writing", "AO", "Next assessment; before L4"],
    ["Outside reviewer on every classifier or threshold change", "Steward; CISO's staff", "Every platform change"],
    ["Charter the board, with one named decider per decision", "Sponsor and CIO", "Before the first rule change"],
    ["Review exceptions quarterly; guard the repository's history", "Board; records officer", "Quarterly; any rewrite"],
    ["Reuse packages by default; approve ongoing authorization", "Agency head; AO", "Each use; when eligible"],
    ["Approve the monitoring strategy and charter its project", "Senior official for risk", "Phase 0; yearly"],
  ];
  const colW = [6.65, 2.75, 2.75];
  const est = asks.reduce((h, r) => h + Math.max(0.33, Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, 11.5))) * lh(11.5) + 0.1), 0.34);
  fit("decision table", 1.45 + est, 5.82);
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts(colW, { y: 1.45, w: colW.reduce((a, b) => a + b, 0), fontSize: 11.5, rowH: [0.32, ...asks.map(() => 0.33)] }));
  txt(s, "Close line", [{ text: "None of these is a procurement.  ", options: { bold: true, color: HEX.amber } },
    { text: "A package describes one day; governance that doesn't decay keeps proving itself." }],
    { x: 0.6, y: 5.9, w: 12.15, h: 0.55, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-137; OMB Circular A-130; OMB M-24-15; FedRAMP 2026 rules; NARA GRS 3.1. Book 13, Chapters 01–12; owners from Chapter 09's matrix.");
  narrate(s,
`So, the decisions, with their owners and timing. None of them is a procurement.

The CIO, with the authorizing officials who fund monitoring alongside, fixes the layer beneath the tools before buying another. The CISO makes drift a standing finding in the monitoring strategy, answers findings with regenerable evidence rather than more reviewers, and counts human-only closures on their own.

The steward settles the record before the next migration, with information owners deciding what each fact means; makes the repository's protections bind administrators; and takes every change to the classifier or thresholds to an outside reviewer from the CISO's staff.

The sponsor and CIO charter the governance board with one named decider for every kind of decision. The board reviews the exception register quarterly, and the records officer guards the repository's history.

The authorizing official approves each new Active Directory dependency only as a dated exception, gives assessors their own access to re-run the evidence, accepts each class allowed to run without a person, receives a monthly posture report, and approves ongoing authorization when a system is eligible. The agency head or a delegate documents any demonstrable need before asking a provider for more. And the senior accountable official for risk approves the monitoring strategy.

The next step needs no procurement: classify every control's coverage, open the gap register, and record every drift finding in the same shape, however it was found. A package describes one day. Governance that doesn't decay keeps proving itself every day after. Book 13 has the detail, with every claim footnoted. Thank you.`,
  "Book 13, Chapters 01–12 (owners from Chapter 09's responsibility matrix and the chapters' decision rules; timing from the chapters named on each slide, otherwise design guidance).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", checkTitle("Backup"));
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: law, OMB, NIST and records");
  const src = [
    "FISMA, 44 U.S.C. § 3554(b)(5).  ·  OMB Circular A-130 (Appendix I, §§ 4.c, 4.d, 5.h); M-24-15 (July 25, 2024); M-19-17; M-26-14 (Appendix C).  ·  36 CFR §§ 1220.34 and 1236.10; NARA General Records Schedule 3.1 (items 030, 040).",
    "NIST SP 800-37 Rev. 2 (Tasks P-5, P-7, M-1, M-6, R-4; Appendices D and F).  ·  SP 800-137 (§§ 1, 2.2, 2.3, 2.4, 3.2.2, 3.6).  ·  SP 800-53A Rev. 5 (§ 3.2.3.5; Appendices C and F).  ·  SP 800-128.  ·  SP 800-207.",
    "NIST SP 800-53 Rev. 5, release 5.2.0, and SP 800-53B: AC-5, AU-9, AU-10, AU-14, CA-5, CA-6(1), CA-6(2), CA-7, CA-7(1), CA-7(4), CM-2, CM-3, CM-3(1)–(5), CM-4, CM-5, CM-5(1), CM-6, CM-6(1), CM-6(2), PM-4, PM-31, SA-10, SI-2(5), SI-7, SR-4.",
    "FIPS 186-5; FIPS 198-1; RFC 8785 (JSON Canonicalization Scheme); NIST OSCAL layers and models, v1.2.3 reference.",
  ];
  fit("Source list 1", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 1", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: FedRAMP, CISA and platforms");
  const src = [
    "FedRAMP Consolidated Rules for 2026 (machine-readable ruleset 2026.10.13.01): Using a FedRAMP Certified Cloud Service; AGU-USE-ABU, AGU-USE-ROR, AGU-AGC-NAA, AGU-AGC-NAR, AGU-AGC-TPP, AGU-AGC-GRC; CCM-AGM-ROR; IVV-IAS-VIM; CPO rules; Key Security Indicators (46 in ten themes); Rev5 control reference (AU, CM, SA).",
    "CISA BOD 26-04 (June 10, 2026); federal incident notification guidelines; ScubaGear.  ·  NSA and CISA advisory AA23-278A (October 5, 2023).  ·  CA/Browser Forum Ballot SC-081v3.",
    "Microsoft Learn: Implement a cloud-first approach (accessed October 25, 2026); Privileged Identity Management; Azure Machine Configuration; Microsoft Graph onPremisesExtensionAttributes.  ·  GitHub Docs: About protected branches.  ·  Open Policy Agent; Pro Git.",
    "Full footnotes with links and access dates (October 21, 2026, unless noted): Book 13, every chapter and Appendices A and B (whalermike.github.io/modernization-workbook/docs/books/b13-governance/).",
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
