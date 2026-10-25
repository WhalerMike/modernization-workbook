// Book 04 — Access & Privilege: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CISO, the CIO, the identity governance officer and authorizing officials. Decision-centered:
// every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B04_Access_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b04-access/, named in the notes. Decision owners come from
// the book's responsibility matrix (Chapter 06) and the Book 02, Chapter 06 assignment that Chapter 06 keeps; tiers,
// durations, cadences and approval chains are the book's program design and are labeled as such. Where the book
// gives no date for a decision, the "When" names the event that triggers it, as design guidance.
// Diagrams are the committed PNGs in docs/images/diagrams/b04-access/png/; alt text is read from the chapters'
// fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 04", title: "Access & Privilege",
  footer: "Federal Modernization Workbook  ·  Book 04 Access & Privilege  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B04_Access_Executive.pptx";

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
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b04-access");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b04-access", "png");
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
const rows = (s, prefix, label, list, top, step, h, w) => {
  const W = w || 6.2;
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: W, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, W, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: W - 0.3, h, fontSize: 13.5, valign: "middle" });
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
// A row of equal cards, each with an icon, a bold lead and a sentence.
const cards = (s, prefix, list, y, h) => {
  const gap = 0.2, w = (12.15 - gap * (list.length - 1)) / list.length;
  list.forEach((c, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i}`, x, y, w, h, c[2]);
    icon(s, c[0], x + 0.2, y + 0.2, 0.55, c[1]);
    T(s, `${prefix} ${i} text`, [{ text: c[3], options: { bold: true, color: c[1], breakLine: true } }, { text: c[4] }],
      { x: x + 0.95, y: y + 0.1, w: w - 1.1, h: h - 0.2, fontSize: 13.5, valign: "middle" });
  });
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize, y) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const top = y || 1.5, bottom = top + rowH.reduce((a, b) => a + b, 0);
  if (bottom > 5.12) console.warn(`  ! slide ${pres.slides.length} table runs past the decision bar (bottom ${bottom.toFixed(2)} in)`);
  return s.addTable([head(header), ...body], tableOpts(colW, { y: top, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why access is a policy decision", S_WHAT = "What the baseline and privilege model require",
  S_WHO = "Who decides access", S_HOW = "How to govern and evidence it";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "Access & Privilege: the executive briefing", "Book 04 — Access & Privilege  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CISO, CIO, identity governance officer and authorizing officials", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 04 of the Federal Modernization Workbook, Access and Privilege. It runs about thirty minutes, for the people who make the calls on access: the CISO, the CIO, the identity governance officer and the authorizing officials.

The argument fits in three sentences. Under Zero Trust, every access request is evaluated against policy, so the Conditional Access policy set becomes the agency's access control in practice. Standing administrator rights are the shortest path from one stolen credential to control of the tenant, and stronger sign-in doesn't narrow them. And because the platform doesn't separate deciding from doing, the agency has to design that separation into its roles, its tickets and its reviews.

I'll take four questions. Why access is a policy decision, and why standing privilege fails. What the access baseline and the privilege model require. Who decides access, from administrative consent to exceptions. And how to govern it, manage it as code, and keep the evidence.

Two labels run through the deck, as they do through the book. The tiers, durations, cadences and approval chains are program design: a starting posture each agency adapts, not a federal requirement. And product statements are as the book checked them, on October 20, 2026.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 04, index; Chapter 01 — Access Is a Policy Decision (The argument in brief); Chapter 02 — Why Standing Privilege Fails (The argument in brief); Chapter 06 — Who Decides Access (Deciding isn't doing).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "Every access decision is a policy decision");
  tag(s, "Why");
  figure(s, "ch01-policy-decision", 0.6, 6.8);
  sideBox(s, "Rules", "FaScaleBalanced", HEX.navy, HEX.navyTint, "How Conditional Access decides", [
    "Every policy that applies must be met",
    "A block wins over any grant",
    "An exclusion overrides everything",
    "Sessions re-checked on critical events",
    "Report-only first; enforcing is a change",
  ]);
  takeaway(s, "FaTriangleExclamation", HEX.red, "Every exclusion is a standing hole.  ",
    "Only the emergency access group is excluded by design; every other exclusion needs an owner, a reason and an expiry.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207 (tenets 2–4); CISA ZTMM v2.0; Microsoft Learn — Conditional Access overview and policy evaluation. Book 04, Chapters 01 and 03.");
  narrate(s,
`In the directory era, access was settled in advance. Someone put a person in a group, the group was on an access list, and the workstation sat inside the perimeter. From then on, every request was approved by default.

Federal policy no longer accepts that. OMB M-22-09 says applications can't rely on the network perimeter, that users should log into applications rather than networks, and that every request for access should be evaluated. NIST SP 800-207 gives the architecture: a policy decision point, separate from the places where access is enforced, with network location conferring no trust and access granted per session.

In Microsoft Entra ID the decision point is Conditional Access, which Microsoft calls its Zero Trust policy engine. The book reads token issuance as the policy administrator and the applications as enforcement points; that mapping is the program's interpretation. Continuous Access Evaluation re-checks a session when an account is disabled or a condition changes.

The rules are few. Every applicable policy must be satisfied; there's no priority order. A block wins. And an exclusion overrides everything, which is why each exclusion is a standing hole. The only permanent one is the emergency access group; every other exclusion needs an owner, a reason and an expiry. And because a policy for all users can lock out everyone, administrators included, every new policy runs in report-only first, and enforcement is a separate, reviewed change.`,
  "Book 04, Chapter 01 — Access Is a Policy Decision (Every request is a decision; The decision point and the enforcement point; Conditional Access as the policy engine; How the decision is computed; Deploy as a decision, not a switch); Chapter 03 — The Conditional Access Model (Exclusions).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Membership and location decide once; policy, every time");
  tag(s, "Why");
  figure(s, "ch01-membership-vs-policy", 0.6, 6.3);
  sideBox(s, "Data", "FaFilter", HEX.amber, HEX.amberTint, "Policy is only as good as its data", [
    "An empty attribute falls outside the policy",
    "Dynamic groups can lag past 24 hours",
    "Urgent removals: disable, revoke sessions",
    "Baselines include all users, exclude narrowly",
  ], { x: 7.15, w: 5.6 });
  decision(s, "Enforce no attribute-scoped policy until its attributes are populated and verified; baseline policies include all users and exclude narrowly",
    "CISO; HR owns the attribute values", "Before each such policy is enforced");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; Microsoft Learn — dynamic membership processing, Continuous Access Evaluation. Book 04, Chapters 01 and 03; Book 02, Chapter 06.");
  narrate(s,
`Most estates still grant access the old way, even after they move to Entra ID. Two habits survive the migration: treating the network as proof of trust, and treating group membership as a permanent grant.

Inside means trusted, so a compromised device or a stolen session inside the perimeter inherits the trust of the building. Membership is decided once and outlives the need, so people who change jobs keep what they had, and nobody can say why a given person holds a given access. Policy replaces both: location becomes one signal among several, and membership is computed from authoritative attributes, reviewed, and only one condition of a policy.

That raises the stakes on the data. The program targets policies at dynamic groups built from organizational attributes, the way Group Policy was once targeted at organizational units (OUs). A user whose attribute is empty falls outside every policy that includes only that group: an exclusion nobody approved. And Microsoft says dynamic membership changes typically take a few hours and can take more than 24, so urgent removals, a leaver or a compromised account, use account disablement and session revocation, not group recalculation.

So the decision: baseline policies include all users and exclude narrowly, and no attribute-scoped policy is enforced until its attributes are populated and verified. The CISO sets that requirement, and HR owns the attribute values behind it, as Book 03 describes.`,
  "Book 04, Chapter 01 — Access Is a Policy Decision (What goes wrong when membership and location decide; Attribute-driven targeting has its own failure mode); Chapter 03 (Exclusions; The program's baseline principles); Book 02, Chapter 06 — Who Owns the Migration (responsibility matrix: control requirements; authoritative worker attributes).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Standing privilege is an open door");
  tag(s, "Why");
  figure(s, "ch02-standing-vs-eligible", 0.6, 6.3);
  sideBox(s, "Scope", "FaKey", HEX.red, HEX.redTint, "A strong sign-in doesn't narrow scope", [
    "A standing role is exposed 8,760 hours a year",
    "NSA and CISA rank it second of ten",
    "Midnight Blizzard: a forgotten app, still privileged",
    "A FIDO2 key verifies; it doesn't limit",
  ], { x: 7.15, w: 5.6 });
  decision(s, "Hold every human administrative role as eligible, activated through PIM; record any standing privilege that remains as residual risk with an owner",
    "CISO sets the model; the AO accepts what remains", "From the first high-risk role class");
  sources(s, "Sources: NSA/CISA AA23-278A (Oct 2023); Microsoft, Midnight Blizzard disclosure (Jan 2024); Microsoft Learn — PIM. Book 04, Chapter 02; Book 02, Chapter 06.");
  narrate(s,
`Privileged access is where the policy argument matters most, and where it's most often abandoned. A Global Administrator can change the Conditional Access policies that make every other decision. If that right is always on, the policy engine protects everything except the accounts that control it.

Standing means the assignment persists and is always active: no activation, no reason, no approval, no time limit. That's 8,760 hours a year of tenant-wide control, nearly all of them hours when no administrative work is being done but a stolen session would still carry the full role. NSA and CISA list improper separation of user and administrator privilege second in their October 2023 top ten misconfigurations. And it isn't only people: in the attack Microsoft disclosed in January 2024, Midnight Blizzard took over a forgotten test application with elevated access.

Stronger sign-in answers one question: is this really the account's owner? It doesn't answer the second: what can that identity do, and for how long? An administrator with a FIDO2 key and standing Global Administrator is a strongly authenticated standing target.

An eligible assignment carries the same rights, but only after an activation that checks authentication, justification and approval, and it expires on its own. So the decision: every human administrative role is eligible, through PIM. The CISO sets that model; anything that has to stay standing is documented residual risk, which the authorizing official accepts.`,
  "Book 04, Chapter 02 — Why Standing Privilege Fails (Administrative identity is the root of the root; Strong authentication doesn't reduce scope; Just in time and just enough; The privileged-access project: phases and risks); Book 02, Chapter 06 (responsibility matrix: privileged role mapping and PIM settings; accept residual risk).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = content(S_WHY, "What least privilege requires, and what policy says");
  tag(s, "Why");
  figure(s, "ch02-privilege-maturity", 0.6, 12.15, 1.3, 1.5);
  sideBox(s, "NIST", "FaBook", HEX.navy, HEX.navyTint, "What the Moderate baseline asks", [
    "AC-6: only the access a task needs",
    "AC-6(7): review privileges on a schedule",
    "AC-6(9): log every privileged function",
  ], { x: 0.6, w: 5.95, y: 2.95 });
  sideBox(s, "Policy", "FaLandmark", HEX.teal, HEX.tealTint, "What federal policy says, precisely", [
    "M-22-09 doesn't mandate time-bound privilege",
    "SP 800-207: least privilege, per session",
    "Microsoft: fewer than five Global Admins",
  ], { x: 6.8, w: 5.95, y: 2.95 });
  takeaway(s, "FaUserClock", HEX.navy, "Time is the dimension most estates never limited.  ",
    "Just-in-time activation limits it, and produces the review and log records AC-6 asks for as a by-product.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and SP 800-53B (AC-5, AC-6 and enhancements, AC-2(2)); OMB M-22-09; NIST SP 800-207; CISA ZTMM v2.0. Book 04, Chapters 02 and 04.");
  narrate(s,
`What does least privilege actually require? The control baseline is explicit. AC-6 allows only the access needed for assigned tasks, and its enhancements make that testable: security functions authorized only for named roles; separate non-privileged accounts for everyday work; privileged accounts restricted to defined people; privileges reviewed on a schedule; privileged functions logged; and non-privileged users prevented from running them. All six are in NIST's Moderate baseline, along with separation of duties.

The strategy documents are often quoted beyond what they say. M-22-09 doesn't mandate time-bound privilege; it asks agencies to evaluate every request and move beyond static roles. SP 800-207 grants access per session, with least privilege. CISA's Zero Trust Maturity Model is the most specific, and the figure shows its four stages: from permanent access with periodic review, through access that expires, to need-based access, and finally automated just-in-time, just-enough access. Most estates that still have standing administrators are at the traditional stage for privileged access, whatever their maturity elsewhere.

Microsoft frames least privilege in three dimensions: permissions, scope and time. Its numbers are short: fewer than five Global Administrators, and fewer than ten privileged role assignments.

None of the controls says "just in time" in so many words. The book's position is that time is the dimension most estates have never limited, and that just-in-time activation limits it while producing the review and logging evidence AC-6 asks for.`,
  "Book 04, Chapter 02 — Why Standing Privilege Fails (What least privilege requires: NIST SP 800-53 AC-6 and its enhancements; What federal Zero Trust policy says, precisely; Just in time and just enough); Chapter 04 — Privileged Roles and Tiers (Built-in roles and the privileged label).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "The Conditional Access baseline, built to BOD 25-01");
  tag(s, "What");
  const req = [
    ["MS.AAD.1.1  Block legacy authentication", "CA001"],
    ["MS.AAD.2.1  Block high-risk users", "CA013, block form"],
    ["MS.AAD.2.3  Block high-risk sign-ins", "CA019"],
    ["MS.AAD.3.1  Phishing-resistant MFA, all users", "CA022"],
    ["MS.AAD.3.2  Other MFA only until then", "CA006, CA009, CA018"],
    ["MS.AAD.3.6  Phishing-resistant MFA, privileged", "CA003"],
  ];
  leftTable(s, ["CISA required configuration", "Library policy"], req.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal)]),
    [4.7, 2.2], [0.42, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46], 12.5);
  sideBox(s, "Waves", "FaListCheck", HEX.amber, HEX.amberTint, "Five waves, each gated", [
    "1. Foundation: block legacy sign-in",
    "2. Administrators: phishing-resistant, PAW",
    "3. Everyone: MFA and managed devices",
    "4. Risk and workload identities",
    "5. Segments and the end state",
  ]);
  decision(s, "Adopt the library and its five waves as the agency's access baseline; in a BOD 25-01 tenant, block high-risk users rather than ask them to remediate",
    "CISO", "Before wave 1 is enforced");
  sources(s, "Sources: CISA BOD 25-01 required configurations; SCuBA Entra ID baseline; Microsoft Learn — Conditional Access. Book 04, Chapter 07; Book 02, Chapter 06.");
  narrate(s,
`Now the what. The book's Conditional Access library is one policy set, numbered once: Book 02's baseline, CA001 to CA017, kept, and twenty-two more for risk, privileged workstations, segmented applications and workload identities, including a report-only probe that never enforces.

It's built to CISA's Binding Operational Directive 25-01, which requires federal civilian agencies to implement CISA's mandatory configurations for in-scope cloud tenants; the deadline for the configurations effective at issuance was June 20, 2025. The table shows the Entra ID requirements that Conditional Access answers: block legacy authentication; block high-risk users; block high-risk sign-ins; phishing-resistant MFA for all users, with another method only until then; and phishing-resistant MFA for highly privileged roles.

One choice needs an executive's attention. Microsoft's current recommendation for high-risk users is to require risk remediation. CISA's required configuration says block. The two can't both win, so in any tenant within the directive's scope the program blocks, and recovery goes through the help desk.

The policies reach production in five waves: the foundation, then administrators, then everyone, then risk and workload identities, then segments and the end state. Every policy passes report-only, a pilot ring and expanding rings, and a wave starts only after the previous one has run a week without incident.

The decision belongs to the CISO, who sets the Conditional Access baseline: adopt the library and its waves before the first wave is enforced.`,
  "Book 04, Chapter 07 — The Conditional Access Policy Library (Conventions; Wave 4: CA013 has two forms; Rollout: from report-only to enforcement; What the library answers in federal requirements: CISA BOD 25-01); Book 02, Chapter 06 (responsibility matrix: control requirements, Conditional Access baseline).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Phishing-resistant MFA is the end state");
  tag(s, "What");
  rows(s, "Strength", "THE BUILT-IN AUTHENTICATION STRENGTHS, AND THE PROGRAM'S USE", [
    ["MFA", "Transitional: a password plus a second factor"],
    ["Passwordless", "Adds Authenticator phone sign-in"],
    ["Phishing-resistant", "Windows Hello, FIDO2 passkey, certificates"],
    ["Admins (custom)", "FIDO2 or certificate, on a separate device"],
  ], 1.9, 0.78, 0.66);
  sideBox(s, "Ready", "FaClipboardCheck", HEX.teal, HEX.tealTint, "Getting there on measured readiness", [
    "Report-only from the program's first day",
    "95% of users registered before enforcing",
    "90% of devices enrolled and compliant",
    "Not-ready group shrinks; each entry expires",
    "FIPS 140 validated keys for privileged use",
  ]);
  decision(s, "Turn the phishing-resistant MFA policy on in report-only on day one, and enforce it as users enroll, with an expiry on every not-ready exception",
    "CISO", "Report-only on day one; enforce on readiness");
  sources(s, "Sources: CISA BOD 25-01 (MS.AAD.3.1, 3.2, 3.6); OMB M-22-09; Microsoft Learn — authentication strengths, passwordless deployment. Book 04, Chapters 03, 07.");
  narrate(s,
`The library's end state is phishing-resistant MFA for everyone, which BOD 25-01 makes mandatory for federal civilian tenants. Other MFA is allowed only until phishing-resistant MFA is enforced, so every policy that accepts ordinary MFA is transitional.

Conditional Access expresses this as authentication strengths. Microsoft's three built-in strengths are MFA, which still accepts a password with a second factor; passwordless MFA, which adds Authenticator phone sign-in; and phishing-resistant MFA: Windows Hello for Business, a FIDO2 passkey, or certificate-based authentication. For administrators the program uses a custom strength, FIDO2 or certificates on a separate device, and leaves Windows Hello out on purpose. It also procures FIPS 140 validated keys for privileged accounts.

Two limits matter. A strength doesn't stop a user typing a password first; it demands a qualifying method before access. And guests who sign in with an emailed one-time passcode can't satisfy any strength, so their policies use plain MFA.

How to get there: the end-state policy, CA022, is created in report-only on the program's first day, before any enrollment campaign, so the logs build a history of who would have been blocked. That's Microsoft's own advice. Enforcement then follows readiness: the program's gates are 95 percent of users registered and 90 percent of devices compliant, and a shrinking not-ready group in which every member has an expiry. When it's empty, the security plan stops describing an interim state. The CISO owns that schedule.`,
  "Book 04, Chapter 03 — The Conditional Access Model (Authentication strengths; The program's baseline principles, 5); Chapter 07 — The Conditional Access Policy Library (Prerequisites: readiness gates; Wave 5: CA022; Government cloud notes); Book 02, Chapter 06 (control requirements).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Policies come in pairs, and Microsoft adds its own");
  tag(s, "What");
  figure(s, "ch03-grant-block-pair", 0.6, 6.9);
  sideBox(s, "Managed", "FaArrowsRotate", HEX.amber, HEX.amberTint, "Microsoft-managed policies", [
    "Arrive in your tenant in report-only",
    "Turned on 30 or more days later, unless Off",
    "Can be excluded; never renamed or deleted",
    "Each needs a recorded adopt or supersede",
  ]);
  decision(s, "Record an adopt-or-supersede decision for every Microsoft-managed policy before Microsoft turns it on, and cite the library policy it duplicates",
    "Identity team, under the CISO's baseline", "Within 30 days of each one's arrival");
  sources(s, "Sources: Microsoft Learn — Conditional Access policy planning, Microsoft-managed policies, approved client app retirement, service limits. Book 04, Chapters 03 and 07.");
  narrate(s,
`Two behaviors of the platform catch out executives and engineers alike.

First, policies come in pairs. Access tokens are issued when no policy's conditions trigger a control. A policy that says Finance users reaching payroll must use phishing-resistant MFA and a compliant device says nothing about anyone else: a non-Finance user gets a token for payroll with no controls at all. To restrict an application to a population, the program writes a second policy that blocks everyone except that population, and reviews the two together. Requiring assignment on the application is the cleaner first gate; the block is defense in depth for sensitive apps.

Second, Microsoft creates some policies in eligible tenants itself: blocking legacy authentication and device code flow, MFA for administrators and for all users, and policies for risky sign-ins and users. Each arrives in report-only mode, and Microsoft turns it on no less than 30 days later unless an administrator sets it to Off. They can be excluded, but not renamed or deleted. A policy Microsoft enables on a schedule is a change the agency didn't make.

So the identity team records one of two decisions for each: adopt it, with the emergency access exclusion added, or supersede it with a library policy and turn it off. Either way it's written down, within the window.

Two more platform facts: a tenant holds at most 240 policies in any state, and the old approved-client-app grant became read-only on June 30, 2026.`,
  "Book 04, Chapter 03 — The Conditional Access Model (Grant controls; How policies combine: policies come in pairs; Microsoft-managed policies; The program's baseline principles, 9); Chapter 07 (Conventions; Wave 2 and Wave 3 notes on superseded managed policies).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Privileged roles are tiered by what they can take over");
  tag(s, "What");
  figure(s, "ch04-tier-model", 0.6, 4.2);
  sideBox(s, "Surprise", "FaUserShield", HEX.navy, HEX.navyTint, "Placements that surprise people", [
    "Conditional Access Administrator is Tier 0: it can weaken the gate on elevation",
    "Exchange Administrator carries no privileged label, yet reaches every mailbox: Tier 1",
    "Readers are tiered too: the security setup is reconnaissance",
    "Sync servers are run as control-plane assets",
  ], { x: 5.1, w: 7.65 });
  decision(s, "Approve the tier of every privileged role and the gate each tier passes, and keep Global Administrators under five",
    "CISO (privileged-role mapping)", "Before any role converts to eligible");
  sources(s, "Sources: Microsoft Learn — privileged roles; least privileged roles by task; enterprise access model; PIM role settings. Book 04, Chapter 04; Book 02, Chapter 06.");
  narrate(s,
`The book places each role in a tier by what its holder could take over. The higher the tier, the stricter the gate before the role is active, and the fewer people hold it at all.

The tiers build on Microsoft's enterprise access model, which builds on the old Active Directory tier model rather than discarding it: prevent anything in a lower plane from controlling a higher one. Tier 0 is the control plane: Global, Privileged Role, Privileged Authentication, Security and Conditional Access Administrator. Tier 1 runs a whole service: Exchange, SharePoint, Intune, Teams, applications and the sync bridge. Tier 2 acts inside a bounded population, scoped to administrative units (AUs). And readers get a tier of their own. The tier boundaries are program design; the hours are a starting posture.

Three placements need explaining. Conditional Access Administrator is Tier 0, because once activation is gated through Conditional Access, whoever edits it can weaken the gate. Exchange Administrator doesn't carry Microsoft's privileged label but can reach every mailbox, so it's Tier 1 regardless; the label describes directory permissions, not what a role does inside its workload. And Global Reader is tiered because reading the whole security setup is reconnaissance.

Most requests for Global Administrator are requests for one task, so the first step of any role request is Microsoft's least-privileged-role-by-task reference, and scoping comes before gating. The CISO, who owns the privileged-role mapping, approves each placement before roles convert.`,
  "Book 04, Chapter 04 — Privileged Roles and Tiers (Built-in roles and the privileged label; Least-privileged choices; What Microsoft's model says; The program's privilege tiers); Book 02, Chapter 06 (responsibility matrix: privileged role mapping and PIM settings).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Just in time, approved from outside the tier");
  tag(s, "What");
  const tiers = [
    ["Tier 0, control plane", "4 hours", "Tier 0 approver group", "90 days"],
    ["Tier 1, management", "8 hours", "Tier 1 approver group", "180 days"],
    ["Tier 2, scoped", "8 hours", "Optional, with a risk acceptance", "180 days"],
    ["Read-only", "8 hours", "None", "365 days"],
  ];
  leftTable(s, ["Privilege tier", "Max activation", "Approval", "Eligible for"],
    tiers.map((r, i) => [bold(r[0], i === 0 ? HEX.red : HEX.navy), { text: r[1] }, { text: r[2] }, { text: r[3] }]),
    [2.3, 1.75, 2.95, 1.65], [0.42, 0.5, 0.5, 0.5, 0.5], 12.5);
  T(s, "Every tier", [bold("Every activation:  "), { text: "a fresh phishing-resistant sign-in through an authentication context and a justification, plus a ticket above read-only. Approvers have 24 hours, a fixed window." }],
    { x: 0.6, y: 4.15, w: 8.65, h: 0.85, fontSize: 14, valign: "middle" });
  figure(s, "ch08-activation-sequence", 9.55, 3.2);
  decision(s, "Staff each tier's approver group from outside that tier, Tier 0 in the security office, with at least two approvers sized for real operating hours",
    "CISO", "Before approval is switched on");
  sources(s, "Sources: Microsoft Learn — PIM role settings, approval, activation. Book 04, Chapter 08 and Appendix B; Book 02, Chapter 06. Durations and approvers: program design.");
  narrate(s,
`Privileged Identity Management turns privilege into a governed request. Every human administrative assignment is eligible, not active. To use it, the administrator asks for the role with a justification and a ticket, satisfies a fresh sign-in, waits for an approver, and holds the role only for the window requested.

The table is the program's design, by tier. Tier 0 activations last at most four hours and need a Tier 0 approver; Tier 1, eight hours with a Tier 1 approver; Tier 2, eight hours, with approval optional only under a documented risk acceptance; readers, no approval. Eligibility itself expires after 90, 180 or 365 days, so it has to be re-authorized, not just reviewed.

Three details make the gate real. PIM's built-in MFA can be satisfied by an earlier sign-in in the same session, so the program forces a fresh phishing-resistant proof through a Conditional Access authentication context. Approvers can't approve their own requests, but the platform doesn't stop an agency making the approver group the same people as the requesters, so a tier's approvers sit outside that tier, and Tier 0's are a security function, not peer administrators. And approvers have 24 hours, a window that can't be configured, so a Tier 0 path staffed by two people in one time zone strands out-of-hours requests.

So the CISO staffs each approver group from outside its tier, at least two people, sized for real hours, before approval is switched on.`,
  "Book 04, Chapter 08 — PIM Self-Request with Approval (Eligible, not active; The activation controls; Settings by tier; The 24-hour window; Approver design and separation of duties); Appendix B; Book 02, Chapter 06 (privileged role mapping and PIM settings).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "Four things that can quietly undo the gate");
  tag(s, "What");
  rows(s, "Risk", "WHAT BREAKS JUST-IN-TIME ACCESS WITHOUT ANYONE NOTICING", [
    ["License lapse", "Eligible roles removed; expiring grants turn permanent"],
    ["Policy editors", "Conditional Access admins can weaken the gate"],
    ["No approvers", "The default falls to admins you made eligible"],
    ["Old scripts", "The legacy PIM API stops on October 28, 2026"],
  ], 1.9, 0.78, 0.66);
  sideBox(s, "Fix", "FaShieldHalved", HEX.teal, HEX.tealTint, "Closing each one", [
    "Renew licenses as a control dependency",
    "Conditional Access roles in Tier 0",
    "Protected actions on policy changes",
    "Named approvers on every role",
    "Keep the role inventory exported",
  ]);
  decision(s, "Treat P2 and Governance licensing as a control dependency: renew without a gap, and keep the role inventory exported so eligibility can be restored",
    "Sponsor and CIO (funding)", "Before every renewal date");
  sources(s, "Sources: Microsoft Learn — PIM licensing and FAQ; role settings; protected actions; PIM API retirement. Book 04, Chapters 04 and 08; Book 02, Chapter 06.");
  narrate(s,
`A well-built gate can still be undone quietly, and the book names four ways.

Licensing. When a P2, Governance or trial license expires, eligible role assignments are removed, PIM's settings are removed, and active time-bound assignments become active permanent and no longer expire. A lapse removes the just-in-time path and turns every expiring grant into standing access. The gate is only as durable as the subscription behind it.

The policy editors. Once activation runs through a Conditional Access authentication context, whoever can edit Conditional Access can weaken it, remove it or block activation. That's why those roles are Tier 0, and why protected actions require a fresh strong sign-in to change Conditional Access policies at all, whichever role granted the permission.

Approvers. If approval is required and no approvers are named, the defaults are the active Global and Privileged Role Administrators, exactly the people this design makes eligible. Microsoft documents that as a tenant lockout. Name the approver group every time, and build the emergency accounts first.

And automation. Microsoft retires the older PIM API on October 28, 2026; from that date it returns no data, and any script or connector still calling it is broken.

The first is a funding decision. The sponsor and CIO treat these licenses as a control dependency: renew without a gap, and keep the role inventory exported so eligibility can be restored.`,
  "Book 04, Chapter 08 — PIM Self-Request with Approval (License continuity is a control dependency; The authentication context creates a privilege dependency; The documented lockout; Never leave the approver list empty; Step 6 — protected actions; Microsoft retires the legacy PIM API); Chapter 04 (Tier 0 placement); Book 02, Chapter 06 (migration scope, funding and sequence).");
}

// ------------------------------------------------------------------ What 7
{
  const s = content(S_WHAT, "Break-glass: the one governed exception");
  tag(s, "What");
  sideBox(s, "Built", "FaLock", HEX.navy, HEX.navyTint, "How the accounts are built", [
    "Two or more cloud-only accounts",
    "Permanent active Global Administrator",
    "Passkey or certificate, methods of their own",
    "Excluded only from blocking policies",
    "Alerted on every sign-in and change",
  ], { x: 0.6, w: 5.95, minH: 2.75 });
  sideBox(s, "Used", "FaDoorOpen", HEX.red, HEX.redTint, "How they're used", [
    "Only when PIM is down and it can't wait",
    "Two senior administrators, dual custody",
    "Session ends within four hours",
    "Every action reviewed within 24 hours",
    "Sign-in and a task tested every 90 days",
  ], { x: 6.8, w: 5.95, minH: 2.75 });
  T(s, "Order", [bold("Order matters:  ", HEX.red), { text: "the accounts exist and pass a test before any role is made eligible or any approval is switched on." }],
    { x: 0.6, y: 4.4, w: 12.15, h: 0.6, fontSize: 14.5, valign: "middle" });
  decision(s, "Build and test the emergency accounts before any role goes eligible, and record them in the security plan as a deviation from AC-2(2), with compensating controls",
    "CISO; the AO accepts the deviation", "Before the first role converts");
  sources(s, "Sources: Microsoft Learn — emergency access accounts; mandatory MFA for Azure; NIST SP 800-53 AC-2(2). Book 04, Chapters 02, 04, 06 and 08; Book 02, Chapter 06.");
  narrate(s,
`Every control that blocks an administrative path also creates a way to lock the agency out of its own tenant: federation down, every administrator's MFA device unavailable, a misconfigured policy, or every privileged role eligible with no approver able to act. Emergency access, or break-glass, accounts are the answer, and they're the only standing privilege the program accepts by design.

Microsoft's current guidance changes older designs. Two or more cloud-only accounts on the tenant's own onmicrosoft domain, not tied to a person. Global Administrator as a permanent active assignment, because PIM may be what failed. Passwordless, phishing-resistant authentication with methods separate from the normal administrators', because mandatory MFA applies to these accounts too; a password alone no longer signs in to the admin portals. Excluded only from policies that block or restrict sign-in. Alerted on every use, and validated at least every 90 days.

Using them is strict. All three conditions hold: PIM isn't available, the incident can't wait, and two senior administrators know. They retrieve the credential together, do only what the emergency needs, end the session within four hours, and every action is reviewed within 24.

Two decisions. Order: the accounts exist and pass a test before any role is made eligible. And honesty: NIST's AC-2(2) expects emergency accounts to be disabled automatically, so the security plan records these as a deviation with compensating controls. The CISO owns the build; the authorizing official accepts the deviation.`,
  "Book 04, Chapter 02 — Why Standing Privilege Fails (Break-glass: the one governed exception); Chapter 04 (Emergency access accounts); Chapter 06 — Who Decides Access (Emergency access); Chapter 08 (Step 0 — Establish emergency access accounts first); Book 02, Chapter 06 (accept residual risk).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Deciding isn't doing: rules Entra doesn't enforce");
  tag(s, "Who");
  figure(s, "ch06-authority-split", 0.6, 4.6);
  sideBox(s, "Rules", "FaPeopleArrows", HEX.teal, HEX.tealTint, "Three rules, designed in", [
    "Approvers don't execute; executors don't approve",
    "Nobody approves their own access",
    "Application Administrator can grant most consent and act as any app",
    "So the help desk gets an assignments-only role",
    "Every request triaged by the authority it needs",
  ], { x: 5.4, w: 7.35 });
  decision(s, "Give the help desk a custom role that manages application assignments only; Application Administrator stays with identity engineering, eligible behind approval",
    "Identity governance officer", "Before the help desk takes access tickets");
  sources(s, "Sources: NIST SP 800-53 AC-5; Microsoft Learn — Entra built-in and custom roles, admin consent. Book 04, Chapter 06. Roles and routing are program design.");
  narrate(s,
`Who decides access? Every day someone asks for an application, an application asks for permission to an API, or an owner leaves. Each is a policy decision. It has to be made by someone with the authority to make it and carried out by someone with the rights to carry it out, and in a well-run tenant those are different people. NIST's AC-5 asks for exactly that separation.

The program applies it in three rules. Approvers don't execute. Executors, the help desk, cloud services and automation, don't approve, and act only on an approved, assigned ticket. And nobody approves their own access.

The trouble is that Entra ID doesn't enforce any of this. Application Administrator can consent to delegated permissions and to application permissions for every API except Microsoft Graph, and can add a credential to any app and act as it. Microsoft calls that a potential elevation of privilege. A help desk that activates that role can technically grant most consents, so "the help desk never approves consent" is only a procedural rule unless the role is narrowed.

So the help desk works under a custom role that manages group-to-application assignments only, plus the narrowest group and authentication roles its other tasks need. Application Administrator stays with identity engineering, eligible only, behind approval. Requests are triaged by the authority they need: the requester's manager for changes to their own account, the application owner and governance officer for owner-governed access and consent. The identity governance officer decides the help desk role's scope.`,
  "Book 04, Chapter 06 — Who Decides Access (Deciding isn't doing; The roles; Help desk and cloud services; What each Entra role can actually do; The help desk and cloud services authority split; The responsibility matrix: help desk PAG membership and role scope).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Application risk tiers set the approval chain");
  tag(s, "Who");
  const tiers = [
    ["Access approver", "App owner; IGO may hold", "App owner", "Business approver"],
    ["Admin consent", "IGO; CISO notified", "App owner and IGO", "App owner; IGO told"],
    ["Access review", "Quarterly", "Twice a year", "Annual"],
    ["Owners", "Owner and backup", "Owner; backup advised", "Owner"],
  ];
  leftTable(s, ["", "Tier 1, high", "Tier 2, moderate", "Tier 3, low"],
    tiers.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }, { text: r[3] }]),
    [1.65, 1.85, 1.75, 1.7], [0.42, 0.62, 0.62, 0.5, 0.62], 12.5);
  sideBox(s, "Gaps", "FaTriangleExclamation", HEX.red, HEX.redTint, "Rules that close the gaps", [
    "Untiered or discovered apps are Tier 1",
    "Any application permission: Tier 1",
    "Critical scopes need the IGO and CISO",
    "Ownerless: 30 days, then suspended",
    "The grant is made by someone else",
  ]);
  decision(s, "Assign a risk tier to every enterprise application before anyone gets access to it; an untiered or ownerless app is handled as Tier 1",
    "Identity governance officer", "Before the first access grant");
  sources(s, "Sources: Microsoft Learn — admin consent workflow; tenant-wide consent; app ownership. Book 04, Chapters 05, 06. Tiers, chains and cadences: program design.");
  narrate(s,
`For applications, the approval chain follows risk. Every enterprise application gets a risk tier from the identity governance officer, the IGO, before anyone is given access to it. An app qualifies for Tier 1 if it meets any one high-risk criterion: any application permission; personal, health, financial, HR or tenant-wide data; an external or vendor operator, or no owner; all users; or internet exposure. It's Tier 3 only if it meets every low-risk criterion.

The tier sets everything else, as the table shows. Access to a Tier 1 app is approved by its owner, with the IGO able to place a hold; Tier 3 by the business approver alone. Administrative consent for a Tier 1 app is the IGO's, with the CISO notified. Reviews run quarterly, twice a year or annually. These values are program design.

Administrative consent is the highest-risk request in the catalog, because a grant applies to the whole tenant immediately and stays until someone revokes it. So any application permission is handled as Tier 1 whatever the app's tier, and the scopes the program rates critical need the IGO and the CISO together. Even then, the person who grants the consent in Entra ID is never the person who approved it.

Two rules catch what slips through. An app discovered without a tier, including the ones that appear on their own through user consent, is Tier 1 until classified. And an ownerless app goes to the IGO, who has 30 days to find an owner before it's suspended.`,
  "Book 04, Chapter 06 — Who Decides Access (Risk tiers set the approval chain; Who approves admin consent; Ownership changes and orphaned apps); Chapter 05 — Applications and Workload Identities (Two objects for one application; Admin consent).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "Applications are identities, with owners and an end");
  tag(s, "Who");
  figure(s, "ch05-app-lifecycle", 2.17, 9.0, 2.3, 1.5);
  cards(s, "Facts", [
    ["FaKey", HEX.red, HEX.redTint, "Grants don't expire.", "Revoking one leaves issued tokens valid."],
    ["FaUserShield", HEX.amber, HEX.amberTint, "Owners can become the app.", "An owner can add a credential and act as it."],
    ["FaLock", HEX.teal, HEX.tealTint, "No stored secrets.", "Managed identity or federation; else a short-lived certificate."],
  ], 3.95, 1.15);
  decision(s, "Block new client secrets, cap certificates at 180 days, and require two named technical owners on every app registration",
    "CISO; secret exceptions IGO and CISO", "For every app created after the effective date");
  sources(s, "Sources: Microsoft Learn — app and service principal objects; consent; ownership; app management policies; SCuBA MS.AAD.5.2. Book 04, Chapters 05, 06.");
  narrate(s,
`Applications hold privilege without a person behind them, so the book governs an app registration the way Book 03 governs a person: a request, a scoped consent, a credential, rotation, attestation and retirement, which is the stage most often skipped.

Three facts drive the design. First, consent grants don't expire, and revoking one isn't instant: tokens already issued stay valid for their lifetime, and users can consent again unless the app stops asking. Second, an owner isn't a contact field. An owner can manage the app's configuration and add a credential to act as the app, which Microsoft calls an elevation of privilege. So the Owners list holds two named technical people, and the business owner who approves access is recorded in the application registry instead. Third, credentials. Microsoft's order is a managed identity, then a federated credential, then a certificate, and never a client secret.

Policy turns that order into tenant rules. Application management policies can block new secrets and cap certificate lifetimes; Microsoft recommends blocking secrets outright and a 180-day cap, and the program adopts that for every app created after its effective date. Where an app genuinely can't use a certificate, the exception is time-limited and needs the IGO and the CISO. The program also turns off user app registration and limits user consent to verified publishers and low-risk permissions, one of the two ways CISA's baseline allows.

The CISO sets these rules; application owners decide each app's credential within them.`,
  "Book 04, Chapter 05 — Applications and Workload Identities (Who can create applications; User consent and the consent policy; Admin consent: four behaviors of grants; Ownership; Credentials; Enforcing the order with app management policies; Governing app registrations); Chapter 06 (Exceptions; responsibility matrix: credential type and rotation).");
}

// ------------------------------------------------------------------ Who 4
{
  const s = content(S_WHO, "Who decides what for access");
  tag(s, "Who");
  const owners = [
    ["Access control requirements and baseline", "CISO"],
    ["Privileged-role tiers and PIM settings", "CISO"],
    ["App risk tier; consent above Tier 3", "Identity governance officer"],
    ["Who gets access to a Tier 1 or 2 app", "Application owner"],
    ["Business need; Tier 3 access", "Business approver"],
    ["Revoking consent during an incident", "Security operations"],
    ["Exceptions within policy", "Identity governance officer"],
    ["Residual risk; uncompensated exceptions", "Authorizing official"],
    ["Funding, licenses and sequence", "Sponsor and CIO"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r, i) => [{ text: r[0] }, bold(r[1], i === 7 ? HEX.amber : HEX.teal)]),
    [4.2, 2.7], [0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36], 12);
  sideBox(s, "Clock", "FaUserClock", HEX.navy, HEX.navyTint, "Exceptions run on a clock", [
    "Six months at most; never renewed automatically",
    "Expired: the app moves up one risk tier",
    "Renewed more than twice: CISO and AO",
    "Short log retention: CISO, CIO and the AO",
  ]);
  decision(s, "Send every exception that leaves a control unmet without a compensating control to the authorizing official; no exception lasts more than six months",
    "Authorizing official, after the IGO and CISO", "At each request and renewal");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (roles); NIST SP 800-53 AC-5; CISA BOD 25-01 (deviations). Book 04, Chapter 06 (responsibility matrix; Exceptions); Book 02, Chapter 06.");
  narrate(s,
`Here's the responsibility model in one view, with one decider per row. Book 04 keeps the migration-era roles from Book 02 and adds the daily ones.

The CISO decides the control requirements, the Conditional Access baseline, and the privileged-role mapping and PIM settings. The identity governance officer decides each application's risk tier, administrative consent above Tier 3, ownership assignments and exceptions within policy. The application owner decides who gets access to a Tier 1 or Tier 2 app; the business approver decides whether a requester has a business need, and Tier 3 access. Security operations decides incident-driven revocation, because speed matters more than the chain. The authorizing official decides residual risk. And the sponsor and CIO decide scope, funding and sequence.

Global Administrator isn't on the list. In the program's design it's held permanently only by the emergency accounts and used by nobody for routine work.

Exceptions run on a clock. An exception authorizes one specific deviation, with compensating controls, for a fixed time, and it never lasts more than six months or renews automatically. An expired one moves the app up a risk tier. Renewed more than twice, it goes to the CISO and the authorizing official, as a sign that the requirement or the system needs to change. Keeping audit logs for less than the minimum needs the CISO and CIO, with the authorizing official accepting the risk.

The decision: any exception that leaves a control unmet with no compensating control goes to the authorizing official, because accepting that risk is an authorization decision.`,
  "Book 04, Chapter 06 — Who Decides Access (The roles; Exceptions; The responsibility matrix and its comments); Book 02, Chapter 06 — Who Owns the Migration (The roles; responsibility matrix).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Govern access with packages, reviews and expiry");
  tag(s, "How");
  figure(s, "ch09-access-package-anatomy", 0.6, 6.9);
  sideBox(s, "Gov", "FaListCheck", HEX.teal, HEX.tealTint, "The program's defaults", [
    "No grant without an end: 90, 180, 365 days",
    "Tier 0 roles reviewed monthly, others quarterly",
    "Guests reviewed quarterly by sponsors",
    "Review the groups, not just the apps",
    "Movers lose old access; leavers lose all",
  ]);
  decision(s, "License Entra ID Governance for the whole workforce, so every person is in scope of access packages, reviews and lifecycle workflows",
    "Sponsor and CIO (funding)", "Before the review program starts");
  sources(s, "Sources: NIST SP 800-53 AC-2, AC-6(7); Microsoft Learn — entitlement management, access reviews, Lifecycle Workflows, licensing. Book 04, Chapter 09.");
  narrate(s,
`Now the how. A well-configured tenant can still fail an account-management audit. Conditional Access decides whether a session proceeds, and PIM whether a role is active, but neither decides whether a person should still hold what they were given last year. AC-2 and AC-6(7) ask for exactly that.

The program closes the gap with three mechanisms that run without anyone opening a ticket. Requests come through access packages: a bundle of access, named approvers, and an expiry from the moment it's granted. The program never uses "never": 90 days for Tier 1 application access, 180 for Tier 2, a year for Tier 3, and no more than a year for external users. Reviews run on a calendar set by risk: Tier 0 roles monthly, other roles quarterly, guests quarterly by their sponsors, with denied access removed automatically. And lifecycle events act on access: a mover loses the old department's packages and requests the new, and a leaver loses everything.

One trap matters. Because access is assigned through groups, reviewing an application doesn't remove the members of its groups; they keep access. So the program reviews the groups.

The licensing is the executive call. As of October 2026, Microsoft licenses entitlement management and reviews by Entra ID Governance for every member user in scope, including reviewers, and adds no new governance features to P2. It's available in the government clouds. Partial licensing produces a program that governs some people and leaves the rest ungoverned, so the sponsor and CIO fund it for the whole workforce.`,
  "Book 04, Chapter 09 — Access Governance: Packages, Reviews and Lifecycle (opening; Licensing: what needs Entra ID Governance; Expiration and extension; What can be reviewed; Cadence; Lifecycle Workflows at the access level; Guest access governance); Book 02, Chapter 06 (funding).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Access as code, and the evidence it leaves");
  tag(s, "How");
  figure(s, "ch10-access-as-code-loop", 0.6, 2.3);
  sideBox(s, "Change", "FaCodeBranch", HEX.navy, HEX.navyTint, "Change control", [
    "Two people per change",
    "Report-only first, a week at least",
    "A pipeline with no stored secret",
    "Emergency edits back in code in a day",
  ], { x: 3.15, w: 4.65, minH: 2.95 });
  sideBox(s, "Keep", "FaFileShield", HEX.amber, HEX.amberTint, "Evidence outlasts 30 days", [
    "Entra keeps logs 30 days on P1 or P2",
    "Audit, sign-in and PIM: one year",
    "Consent and break-glass: three years",
    "Tier 0 drift is a security incident",
  ], { x: 7.95, w: 4.8, minH: 2.95 });
  decision(s, "Make the repository the only normal path to production for access policy, and stream every access log to the agency's own store from day one",
    "CISO (monitoring evidence)", "Before the first policy is enforced");
  sources(s, "Sources: NIST SP 800-53 AC-2, AC-3, AC-6, IA-2, CA-7, CM-3; FedRAMP 20x KSIs; Microsoft Learn — configuration management, retention. Book 04, Chapters 09, 10.");
  narrate(s,
`The last how is about how these decisions are held. A Conditional Access estate nobody can compare against intent is a control no assessor can trace.

The invariant: every access decision has a reviewable source of truth, a pipeline applies it, and a monitor checks the tenant against it. Conditional Access, PIM settings, groups, packages and reviews each have a file in a repository. A change is a pull request, and its author can't approve it; Tier 0 changes need a second approver from security. New and changed policies deploy as report-only for at least a week. The pipeline signs in with workload identity federation, no stored secret, and because it can change every access policy, it's a Tier 0 asset. In an incident, an administrator may change a policy in the portal under PIM, but the change is back in code within a business day, and until then the drift monitor reports it.

Drift is closed at the source. Microsoft's configuration monitor checks the tenant every six hours, and drift on a Tier 0 object, such as a relaxed approval rule, is a security incident.

Then the evidence. Entra keeps audit and sign-in logs for seven days on Free and 30 on P1 or P2, and upgrading doesn't recover older data. The program keeps audit, sign-in and PIM logs at least a year, and consent and break-glass records at least three. A gap in forwarding is reported to the CISO within 24 hours.

The CISO, who owns the monitoring evidence, makes the repository the only normal path before the first policy is enforced.`,
  "Book 04, Chapter 10 — Access as Code, and the Evidence It Produces (opening; What goes in the repository; Change control; Drift detection and closure; What the assessor reads; Honest limits); Chapter 09 (Retention: the logs don't keep themselves); Book 02, Chapter 06 (continuous monitoring evidence).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Include all users; enforce attribute policies only on verified data", "CISO; HR", "Each such policy"],
    ["Make every human admin role eligible through PIM", "CISO; the AO", "First role class"],
    ["Adopt the library and waves; block high-risk users", "CISO", "Before wave 1"],
    ["Phishing-resistant MFA report-only day one; enforce on readiness", "CISO", "Day one"],
    ["Adopt or supersede each Microsoft-managed policy", "Identity team", "Within 30 days"],
    ["Approve each role's tier; approvers from outside it", "CISO", "Before roles convert"],
    ["Build and test break-glass; record it as a deviation", "CISO; the AO", "Before roles convert"],
    ["Fund P2 and Governance for everyone, with no lapse", "Sponsor and CIO", "Each renewal"],
    ["Help desk: an assignments-only custom role", "IGO", "Before help desk work"],
    ["Tier every app; untiered or ownerless is Tier 1", "IGO", "First access grant"],
    ["No new secrets; 180-day certificates; two owners", "CISO; app owners", "New apps"],
    ["Uncompensated exceptions to the AO; six months at most", "Authorizing official", "Each request"],
    ["Repository the only path; stream logs from day one", "CISO", "First enforced policy"],
  ];
  const rh = [0.36, ...asks.map(() => 0.3)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.6, 3.2, 2.35][j] - 0.2;
    if (linesFor(c.length, w, 12) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.6, 3.2, 2.35], { y: 1.45, w: 12.15, fontSize: 12, rowH: rh }));
  T(s, "Close line", [{ text: "Write the policy down, test it, prove it ran.  ", options: { bold: true, color: HEX.amber } },
    { text: "That's how an agency knows who can reach what, and why." }],
    { x: 0.6, y: 6.0, w: 12.15, h: 0.5, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: OMB M-22-09; CISA BOD 25-01; NIST SP 800-53 Rev. 5; Microsoft Learn, Oct 2026. Book 04, Chapters 01–10; Book 02, Chapter 06. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The CISO sets the access baseline: baseline policies include all users, and attribute-scoped policies wait for verified data, with HR owning the attributes; the library and its five waves are adopted before the first is enforced, blocking high-risk users in any BOD 25-01 tenant; and phishing-resistant MFA runs in report-only from day one and is enforced as users are ready.

The CISO also owns the privilege model: every human administrative role eligible through PIM, each role's tier approved, approvers drawn from outside the tier, and the emergency accounts built and tested before any role converts. The authorizing official accepts the standing privilege that remains and the break-glass deviation. The identity team records an adopt-or-supersede decision for each Microsoft-managed policy within its 30-day window.

The sponsor and CIO fund P2 and Governance licensing for the whole workforce, renewed without a gap.

The identity governance officer narrows the help desk to an assignments-only role, and tiers every application before anyone gets access. The CISO sets the credential rules for new apps, and application owners apply them. Uncompensated exceptions go to the authorizing official, for six months at most. And the repository becomes the only normal path, with every log streamed from day one.

In Zero Trust, every access decision is a policy decision. Writing the policy down, testing it and proving it ran is how an agency knows who can reach what, and why. Book 04 has the detail, with every claim footnoted. Thank you.`,
  "Book 04, Chapter 01 and Chapter 02 (The argument in brief); Chapter 06 — Who Decides Access (The responsibility matrix); Chapters 07–10; Book 02, Chapter 06 (responsibility matrix).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal policy, NIST and CISA");
  const src = [
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (January 26, 2022).  ·  NIST SP 800-207, Zero Trust Architecture (August 2020).  ·  CISA Zero Trust Maturity Model v2.0 (identity pillar, Access Management).",
    "NIST SP 800-53 Rev. 5, release 5.2.0 (AC-2 and AC-2(2), AC-3, AC-5, AC-6 and enhancements, AC-12, AC-17, AC-19, IA-2, IA-8, IA-11, CA-7, CM-3), and SP 800-53B Moderate baseline.  ·  NIST SP 800-37 Rev. 2 (roles).",
    "CISA BOD 25-01, Implementing Secure Practices for Cloud Services, and its required-configurations list; SCuBA Microsoft Entra ID baseline (MS.AAD.1.1, 2.1, 2.3, 3.1, 3.2, 3.6, 3.7, 3.8, 5.2).",
    "NSA and CISA, AA23-278A, Top Ten Cybersecurity Misconfigurations (October 2023).  ·  Microsoft Security Response Center, Midnight Blizzard disclosure (January 2024).  ·  FedRAMP Rev. 5 control catalog; FedRAMP 20x Key Security Indicators (IAM, CMT).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: Microsoft platform, as of October 2026");
  const src = [
    "Microsoft Learn, Conditional Access: overview; policy components and evaluation; grant and session controls; authentication strengths; report-only mode; planning a deployment; Microsoft-managed policies; workload identities; approved client app retirement (June 30, 2026); service limits.",
    "Microsoft Learn, privileged access: privileged roles and permissions; least privileged roles by task; enterprise access model; role-assignable groups; PIM role settings, approval, activation, licensing and licensing FAQ; protected actions; PIM API history (legacy API retirement, October 28, 2026); emergency access accounts; mandatory MFA for Azure.",
    "Microsoft Learn, applications: application and service principal objects; consent and the admin consent workflow; granting tenant-wide consent; app ownership; app management policies; managed identities; workload identity federation; Workload ID FAQ; app instance property lock.",
    "Microsoft Learn, governance and evidence: entitlement management; access reviews; Lifecycle Workflows; ID Governance licensing; Tenant Governance configuration management; data retention.",
    "Full footnotes with links and access dates (October 20, 2026): Book 04, every chapter and both appendices (whalermike.github.io/modernization-workbook/docs/books/b04-access/).",
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
