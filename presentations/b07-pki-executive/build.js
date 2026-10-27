// Book 07 — PKI & Certificates: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the CISO, the PKI owner and authorizing officials.
// Decision-centered: every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B07_PKI_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b07-pki/, named in the notes. Decision owners come from the
// book's responsibility matrix (Chapter 05); wave durations and thresholds are the program's planning figures, and where
// an owner or a timing is the program's own model, or the book gives no date, the notes say so. The workbook's Research
// page has an implementation guide for the lifecycle platform; the deck only points to it, and takes its facts from Book 07.
// Diagrams are the committed PNGs in docs/images/diagrams/b07-pki/png/; alt text is read from the chapters' fig-alt so it
// stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 07", title: "PKI & Certificates",
  footer: "Federal Modernization Workbook  ·  Book 07 PKI & Certificates  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B07_PKI_Executive.pptx";

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
// Titles stay at or under 58 characters and unique; each narrated title must match narration.json.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) console.warn(`  ! title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t)) console.warn(`  ! duplicate title: ${t}`);
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
// A context slide ends with a takeaway instead of a decision.
const takeaway = (s, iconName, color, label, text) => {
  fit("takeaway", lines(label + text, 10.6, 16.5) * lh(16.5), 1.1);
  D.callout(s, "Takeaway", 5.3, 1.2, iconName, color, label, text);
};
// Three tinted cards across the slide, each with an icon, a heading and a bullet list.
const cards = (s, prefix, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1, pt = size || 13.5;
  box(s, `${prefix} card ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
  icon(s, c[0], x + 0.22, 1.65, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.65, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  fit(`${prefix} card ${i + 1}`, need(c[4], 3.5 - 0.3, pt, 6), 2.6);
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], pt), { x: x + 0.25, y: 2.42, w: 3.5, h: 2.6, paraSpaceAfter: 6 });
});
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
// A one-line strip under a short image (y to 5.1).
const strip = (s, name, x, y, w, label, text, color) => {
  const h = 5.1 - y;
  box(s, `${name} strip`, x, y, w, h, HEX.grey);
  fit(`${name} strip`, lines(label + text, w - 0.4, 14) * lh(14), h - 0.1);
  txt(s, `${name} strip text`, [{ text: label, options: { bold: true, color: color || HEX.navy } }, { text }],
    { x: x + 0.2, y: y + 0.05, w: w - 0.4, h: h - 0.1, fontSize: 14, valign: "middle" });
};
// A table at x with a navy header row; warns when its estimated height runs past the bottom.
const tableAt = (s, x, y, header, body, colW, rowH, fontSize, bottom) => {
  const pt = fontSize || 12.5;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const est = [header, ...body.map((r) => r.map(cellText))].reduce((h, r, k) =>
    h + Math.max(rowH[k] || rowH[rowH.length - 1], Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, pt))) * lh(pt) + 0.1), 0);
  fit("table", y + est, bottom || 5.12);
  s.addTable([head(header), ...body], tableOpts(colW, { x, y, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

// Alt text for each committed diagram, taken from the fig-alt attribute in the chapter that shows it.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b07-pki");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header), centered across maxW.
const IMAGES = path.join(__dirname, "..", "..", "docs", "images");
const DIRS = [path.join(IMAGES, "diagrams", "b07-pki", "png")];
const img = (s, name, x, y, maxW, maxH) => {
  const alt = ALT[name];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${name}`);
  const file = DIRS.map((d) => path.join(d, `${name}.png`)).find((f) => fs.existsSync(f));
  if (!file) throw new Error(`no committed PNG for ${name}`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  if (y + h > 5.14) console.warn(`  ! slide ${pres.slides.length} ${name} image runs into the decision bar: bottom ${(y + h).toFixed(2)}`);
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)} at x ${(x + (maxW - w) / 2).toFixed(2)}, bottom ${(y + h).toFixed(2)}`);
  return { w, h };
};


const S_WHY = "Why certificates outlive migrations", S_WHAT = "What AD CS holds up and the target", S_WHO = "Who owns the certificate estate", S_HOW = "How to migrate, renew and retire";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, checkTitle("PKI & Certificates: the executive briefing"), "Book 07  ·  PKI & Certificates  ·  Executive briefing");
  D.agenda(s, 0.8, 4.82, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for the CIO, the CISO, the PKI owner and authorizing officials", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 9.5, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 07 of the Federal Modernization Workbook, PKI and Certificates. It runs about thirty minutes, for the people who decide: the CIO, the CISO, the PKI owner and authorizing officials.

The argument fits in three sentences. Certificates are how every other migration's answer to "who is this?" gets proved, and they keep working, unchanged, until they expire, so the certificate estate fails on its own clock, not the directory's. There's no single replacement for Active Directory Certificate Services: the target is four issuers, each serving the subjects only it can, held together by one root-of-trust decision and one lifecycle platform. And the move off AD CS runs as its own program, in gated waves, with AD CS retired last and with evidence.

I'll take four questions: why certificates outlive every migration; what AD CS holds up, how to make what stays safe, and what the target is; who owns the certificate estate; and how to migrate, keep renewing and finally retire the old CAs. Every decision slide names the decision, its owner and when it's needed. Where the owner or the timing is the program's model, a planning figure or design guidance, the notes say so. The book checked every external claim against its source on October 20, 2026, and its vendor and cloud-availability statements are dated observations.`,
  "Book 07, index; Chapter 01 — Why Certificates Outlive Every Migration; Chapter 05 — Who Owns the Certificate Estate.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "A certificate keeps working after its directory moves");
  tag(s, "Why");
  img(s, "ch01-certificate-consumers", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Consumers", "FaKey", HEX.red, HEX.redTint, "What leans on certificates", [
    "Domain controllers, LDAPS and smart card sign-in",
    "Wi-Fi, wired 802.1X and VPN",
    "TLS listeners, SQL Server among them",
    "Code signing, and the keys that decrypt old mail and files",
  ], 13.5, 7.1, 5.65);
  takeaway(s, "FaTriangleExclamation", HEX.red, "No one owns the issuer.  ",
    "Identity, devices, network and data each migrate their own consumers; the CA underneath all of them needs an owner of its own.");
  sources(s, "Sources: Microsoft Learn — What is AD CS?; smart card logon with third-party CAs; NPS certificates; LDAPS certificates; Entra CBA limitations; OMB M-22-09. Book 07, Chapter 01.");
  narrate(s,
`Strip away the ceremony and an X.509 certificate makes one statement: the holder of this private key is entitled to this name, and the certification authority vouches for that binding.

An account is a record in a directory; when you move the directory you move the record. A certificate is a signed statement that has already been handed out. It sits in device stores, on smart cards, in load balancers, in SQL Server configuration and in trust stores on systems nobody remembers configuring. It doesn't move when the directory moves. It keeps working until it expires or is revoked, and then whatever relied on it stops.

The list of what AD CS supports is close to a map of the estate's trust: domain controllers proving themselves to Kerberos clients, LDAPS, smart card and PIV logon, 802.1X and VPN through NPS, TLS listeners including SQL Server, code signing, and the S/MIME and EFS keys that old data still needs. Entra certificate-based authentication sits beside them as a relying party; it validates certificates and issues none.

The identity, workforce, device and data-platform books each migrate one slice of these consumers. None of them owns the issuer underneath all of them. And the stakes are federal: M-22-09 names PIV as a phishing-resistant approach, and for most of the federal workforce phishing-resistant sign-in is a certificate on a card. A PKI program that stalls puts zero trust commitments at risk, not just uptime.`,
  "Book 07, Chapter 01 — Why Certificates Outlive Every Migration (A certificate is a naming claim; What leans on certificates; Why the move off AD CS is its own program).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Two clocks: cutover dates and expiry dates");
  tag(s, "Why");
  img(s, "ch01-two-clocks", 0.6, 1.5, 6.0, 3.6);
  sideBox(s, "Late", "FaUserClock", HEX.red, HEX.redTint, "Why it fails late", [
    "Directory work fails at cutover, where someone is watching",
    "Certificate work fails at expiry, months later",
    "Cloud PKI issues only to Intune-managed devices, not servers",
    "Domain controllers need certificates until the last one retires",
  ], 13.5, 6.85, 5.9);
  decision(s, "Run the move off AD CS as its own program with its own owner, sequenced by expiry dates rather than the directory's milestones",
    "Sponsor and CIO (program's model)", "Now, before the directory cutover");
  sources(s, "Sources: Microsoft Learn — Cloud PKI for Intune; Intune supported platforms; Monitor AD CS publication health; Entra CBA limitations. Book 07, Chapters 01 and 05.");
  narrate(s,
`Three properties make AD CS the hardest part of Active Directory to leave.

First, an enterprise CA is wired into the forest, and domain members enroll through Group Policy autoenrollment. An Entra-joined device managed by Intune has no Group Policy channel, so autoenrollment doesn't follow it into the cloud. Second, the cloud replacements cover only part of the estate. Cloud PKI issues to Intune-managed devices, and Intune's supported platforms don't include Windows Server, so a web server, an NPS server, a SQL Server host or a domain controller can't get its certificate from Cloud PKI. Third, domain controllers need certificates for as long as domain controllers exist.

So the estate outlives the directory migration twice: issued certificates by however long they have left, and some of the issuer's duties until the last domain controller is decommissioned.

The figure shows the two clocks. On the directory's clock, cutover is declared complete and the first expiry wave finds no issuer, weeks or months later, far from its cause. On the certificate's clock, the replacement issuer is live before each wave and AD CS is retired last, with evidence. The book gives five reasons this is its own program: it fails on a different clock; it belongs to everyone, so to no one; its sequence is fixed by expiry dates; there's no single replacement; and what stays has to be hardened.

In the program's model the sponsor and CIO set scope, funding and sequence, so this call is theirs.`,
  "Book 07, Chapter 01 (Why the dependency survives the directory move; Why the move off AD CS is its own program); Chapter 05 (The sponsor and CIO).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Lifetimes are shrinking on a fixed public schedule");
  tag(s, "Why");
  const life = [
    ["Before Mar 15, 2026", "398 days", "about 4"],
    ["From Mar 15, 2026 (now)", "200 days", "about 7"],
    ["From Mar 15, 2027", "100 days", "about 15"],
    ["From Mar 15, 2029", "47 days", "about 31"],
  ];
  txt(s, "Life head", "PUBLIC TLS MAXIMUM VALIDITY", { x: 0.6, y: 1.5, w: 6.3, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  tableAt(s, 0.6, 1.88, ["Certificates issued", "Maximum", "Renewals a day per 1,000"],
    life.map((r, i) => [bold(r[0], i === 1 ? HEX.red : HEX.navy), { text: r[1] }, { text: r[2] }]),
    [2.6, 1.3, 2.4], [0.4, 0.44, 0.44, 0.44, 0.44], 13);
  txt(s, "Life note", "Renewals column: the book's arithmetic, 250 working days, no early renewal.", { x: 0.6, y: 4.3, w: 6.3, h: 0.5, fontSize: 12, italic: true, color: HEX.slate });
  sideBox(s, "Moved", "FaArrowsRotate", HEX.amber, HEX.amberTint, "Other rules moved too", [
    "Strong mapping: full enforcement, no way back since Sep 2025",
    "NIST draft: RSA and ECDSA signatures disallowed after 2035",
    "M-26-15: TLS 1.3 by Jan 2, 2030; quantum risk cut by end of 2030",
    "A root built in 2026 for 20 years expires in 2046",
  ], 13.5, 7.1, 5.65);
  decision(s, "Set certificate lifetimes by policy, and require automated renewal for every class before its lifetime shortens",
    "CISO", "Before March 15, 2027 (the 100-day step)");
  sources(s, "Sources: CA/Browser Forum Ballot SC-081v3 and Baseline Requirements 2.3.1; KB5014754; NIST IR 8547 (draft); OMB M-26-15. Book 07, Chapters 01, 05 and 08.");
  narrate(s,
`A certificate estate used to be something you could leave alone between renewals. Three changes have ended that.

Public TLS lifetimes are shrinking on a fixed schedule. In April 2025 the CA/Browser Forum adopted a ballot that steps the maximum validity of publicly trusted certificates down from 398 days. It's 200 days today, 100 days from March 15, 2027, five months away, and 47 days from March 15, 2029, and the reuse period for domain validation falls to ten days. On the book's arithmetic, a thousand certificates means about seven renewals every working day now and about thirty-one at 47 days. The schedule binds public certificates, not internal CAs, but the program keeps internal lifetimes short too, because a short-lived certificate limits how long a compromised key is useful.

Mapping rules changed under certificates already in use. Microsoft moved domain controllers to full strong-mapping enforcement in February 2025, and since the September 9, 2025 update there's no supported way back.

And the algorithms have a horizon. NIST's draft transition plan would deprecate RSA-2048 after 2030 and disallow RSA and ECDSA signatures after 2035. M-26-15 sets TLS 1.3 by January 2, 2030 and as much quantum risk mitigated as feasible by December 31, 2030. A root built this year with a twenty-year life outlives those dates.

The matrix puts certificate policy, lifetimes included, with the CISO. The book's rule is that no class may depend on a person remembering a date; acting before the 100-day step is design guidance.`,
  "Book 07, Chapter 01 (The rules are moving under certificates already issued: lifetimes, mapping rules, algorithms; M-26-15); Chapter 05 (matrix: certificate and issuance policy); Chapter 08 (Renewal at scale as lifetimes shrink).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "First, inventory what AD CS actually holds up");
  tag(s, "What");
  img(s, "ch02-classification", 0.6, 1.5, 5.5, 3.6);
  sideBox(s, "Verdicts", "FaListCheck", HEX.navy, HEX.navyTint, "Four layers, four verdicts", [
    "Inventory CAs, templates, issued certificates and every relying party",
    "MIGRATE: an Intune or Entra path replaces it",
    "BRIDGE: it depends on AD; AD CS keeps issuing",
    "RETAIN: no cloud path, an owner and a review date; RETIRE: going away",
  ], 13.5, 6.35, 6.4);
  decision(s, "Classify every template MIGRATE, BRIDGE, RETAIN or RETIRE, each with a named owner who makes the call",
    "PKI and CA administrators", "Wave 1 (weeks 1–4, planning figure)");
  sources(s, "Sources: Microsoft Learn — Certification Authority role; certificate templates; Monitor AD CS publication health; Cloud PKI for Intune. Book 07, Chapters 02, 05 and 07; Appendix B.");
  narrate(s,
`Before any certificate moves, the program establishes what the AD CS estate actually is.

The inventory has four layers. The CA layer, including whether the revocation and chain URLs inside real certificates are reachable from where relying parties sit, and how big each CRL is, since Entra enforces size limits. The template layer: who can enroll, who can change the template, whether the requester supplies the subject. The issued-certificate layer, where the expiry waves become dates on a calendar; certificates from public CAs, appliances and self-signing don't appear there, so finding them takes network discovery through the lifecycle platform. And the relying-party layer, which decides the order of work, because a new issuer is useful only once every relying party for that use case trusts it.

Then every template gets one verdict, by three questions asked in order. Is the consumer being retired? Then RETIRE. Does an Intune or Entra path replace it? MIGRATE. Does it depend on Active Directory itself, like domain controllers or NPS? BRIDGE. Otherwise RETAIN, which should be a short list with a name and a review date on every entry. The book corrects its source in several places: internal server TLS isn't a Cloud PKI migration, and S/MIME delivery can move while its issuer and key history stay.

The matrix makes template retirement the PKI administrators' decision and work, and the template's owner makes the classification call. Four weeks is the program's planning figure.`,
  "Book 07, Chapter 02 — What AD CS Holds Up (The typical topology; What the certificate inventory collects; Classifying every use case; The use-case map); Chapter 05 (matrix: template retirement); Chapter 07 (Wave 1).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Harden what stays before anything migrates");
  tag(s, "What");
  img(s, "ch03-esc-control-points", 0.6, 1.5, 5.6, 3.6);
  sideBox(s, "Gate", "FaShieldHalved", HEX.red, HEX.redTint, "The migration gate", [
    "A CA can mint credentials the whole estate trusts",
    "Eight known misconfiguration classes; four rated Critical",
    "AD CS keeps no audit evidence until two settings are on",
    "The new cloud issuer inherits the old hierarchy's weaknesses",
  ], 13.5, 6.45, 6.3);
  decision(s, "Hold the gate: no certificate workload migrates until every Critical and High finding is fixed and re-tested",
    "PKI owner and security team", "Wave 1 exit gate");
  sources(s, "Sources: Microsoft Learn — Secure, delegate and audit CA administration; Defender for Identity certificate assessments; Cloud PKI deployment models. Book 07, Chapters 03 and 07.");
  narrate(s,
`A migration off AD CS takes months, and for some workloads it never finishes. Throughout that time the enterprise CA keeps issuing certificates that domain controllers, VPN gateways, RADIUS servers and Entra ID accept as proof of identity. A CA can create credentials the whole environment trusts, so a single over-privileged account or misconfigured setting on it can undo every other identity control. And under the bring-your-own-CA model the book recommends, the new cloud issuing CA chains to the existing hierarchy, so it inherits every weakness there the day it goes live.

That makes hardening the first technical workstream, not a cleanup task at the end. The book uses the industry's ESC1 to ESC8 labels, which Microsoft's Defender for Identity also adopted, purely as names for defensive checks. In the program's risk matrix four classes are Critical, to be fixed immediately, and four are High, within two weeks; every one is a migration blocker until it's verified closed. Detection comes from Defender for Identity's posture assessments, CA audit events and directory change auditing. Two cautions: AD CS produces no audit evidence by default, so two settings have to be turned on together; and two of Defender's assessments were still preview, so confirm they appear in a government tenant before relying on them.

The gate is program design. The book's wave plan has the PKI owner and the security team approve the assessment, with no unclassified templates and every Critical and High finding re-tested, before Wave 2 starts.`,
  "Book 07, Chapter 03 — Hardening What Stays (The migration gate; The ESC taxonomy; Turn on CA auditing; The risk-scoring matrix; Hardening the AD CS that remains); Chapter 07 (Wave 1 exit gate).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "The target is four issuers, not one replacement");
  tag(s, "What");
  img(s, "ch04-issuer-map", 0.6, 1.5, 6.4, 3.6);
  strip(s, "Relying", 0.6, 4.15, 6.4, "Entra ID:  ", "a relying party beside all four, checking certificates and issuing none.");
  sideBox(s, "Issuers", "FaSitemap", HEX.navy, HEX.navyTint, "Each subject gets the issuer that can serve it", [
    "Cloud PKI: Intune-managed devices only",
    "Retained AD CS: DCs, servers, network gear, HSM code signing",
    "Federal PKI: PIV, through the card system",
    "Public CA: names the internet must trust",
  ], 13.5, 7.2, 5.55);
  decision(s, "Adopt the four-issuer target, with the cloud issuing CA anchored to the existing offline root (BYOCA)",
    "Sponsor and CIO", "Before Wave 2 (Foundation)");
  sources(s, "Sources: Microsoft Learn — Cloud PKI overview and fundamentals; What's new in Intune (Sep 28, 2026); Intune GCC High and DoD; GSA FPKI 101; FIPS 201-3. Book 07, Chapters 04 and 05.");
  narrate(s,
`The guide this book replaced said Cloud PKI removes the need for on-premises AD CS for most use cases. That's true for devices and wrong for the estate.

Microsoft Cloud PKI hosts the root and issuing CAs, a SCEP registration authority and the revocation endpoints. But it issues only to devices enrolled in Intune: Windows, macOS, iOS and Android, never Windows Server. It doesn't issue the server certificates RADIUS, Wi-Fi and VPN infrastructure present; it has no OCSP responder; and a tenant can hold only three CAs. On availability, a GCC tenant uses the commercial Intune service; Cloud PKI reached GCC High in the week of September 28, 2026 and isn't supported in DoD. Licensing changed in 2026: Microsoft 365 E5 and E7 include it for commercial customers from July, and government plans are planned to align, so confirm the entitlement rather than assume it.

So the target is an issuer per class of subject. Cloud PKI for Intune-managed devices. A retained, hardened AD CS for domain controllers and LDAPS, NPS and VPN servers, internal server TLS including SQL Server, network equipment and HSM-held code signing. The Federal PKI for PIV, through the card management system, which the migration doesn't change. And public CAs for names the internet must trust. Entra ID sits beside all of them as a relying party.

The matrix puts the CA hierarchy and target with the sponsor and CIO, because it fixes cost and the system boundary for years. The anchoring choice is on the next slide.`,
  "Book 07, Chapter 04 — The Target PKI (Microsoft Cloud PKI: can and can't, licensing, availability; AD CS retained; Federal PKI for PIV); Chapter 05 (The sponsor and CIO; matrix: CA hierarchy and target).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Anchor to the existing root, and keep its CRL alive");
  tag(s, "What");
  img(s, "ch04-cloud-root-vs-byoca", 0.6, 1.5, 5.45, 3.6);
  sideBox(s, "BYOCA", "FaKey", HEX.amber, HEX.amberTint, "What anchoring brings, and costs", [
    "Relying parties keep the root they already trust",
    "One cloud CA of the tenant's three, and an easy rollback",
    "Signed by the offline root, so the cloud CA outlives the old issuers",
    "The root's CRL must stay reachable over HTTP, Entra ID included",
  ], 13.5, 6.3, 6.45);
  decision(s, "Run the offline root's CRL as a production service: published to an internet-reachable HTTP address, with every ceremony dated",
    "PKI and CA admins, in the CISO's window", "Before the root signs the cloud CA");
  sources(s, "Sources: Microsoft Learn — Cloud PKI deployment models; Bring your own CA; Entra CBA CRL; Operate certificate revocation and CRL publication in AD CS. Book 07, Chapters 04, 05 and 08.");
  narrate(s,
`Cloud PKI offers two ways to anchor trust. A Cloud PKI root creates a new chain, with a Microsoft-managed root key, and every relying party, RADIUS servers, VPN gateways and web servers included, has to be given that new root. Bring your own CA, BYOCA, creates a cloud issuing CA whose request your existing private CA signs; relying parties that already trust the private root trust the new certificates through the existing chain.

For an organization with an established hierarchy, an offline root and cross-forest trust, the program recommends BYOCA. It preserves the trust every relying party already holds, uses one of the tenant's three cloud CAs rather than two, and keeps a natural rollback, because the original root and issuing CAs keep running.

Three program rules go with the choice. Harden first: the root's hierarchy passes the gate before it signs anything. Sign with the offline root, not an issuing CA, so the cloud issuer is a peer of the AD CS issuing CAs and retiring them later doesn't touch it. And treat the root CRL as production. Entra certificate-based authentication accepts one CRL location per CA, over HTTP, and fails sign-in if it can't reach it. An offline root that publishes only over LDAP, or publishes late, breaks the cloud issuer as surely as the on-premises one. Publication from an offline root is a scheduled, witnessed ceremony.

The matrix lets PKI administrators decide publication timing within the window the security office sets. Doing it before the signing ceremony is design guidance.`,
  "Book 07, Chapter 04 (Two deployment models; What BYOCA actually requires; The deployment-model decision matrix; The program's recommendation); Chapter 05 (PKI and CA administrators); Chapter 08 (Operating the CRLs that stay).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Servers renew through one lifecycle platform");
  tag(s, "What");
  rows(s, "Engine", "WHAT RENEWS EACH CLASS", [
    ["Intune profiles", "User and device certificates on managed devices"],
    ["Autoenrollment", "Domain controller certificates, which also serve LDAPS"],
    ["CLM platform", "Server TLS, RADIUS, appliances and public TLS"],
    ["Card system", "PIV and derived PIV"],
    ["Key ceremony", "CA certificates and CRLs"],
  ], 1.88, 0.66, 0.58, 6.5);
  sideBox(s, "CLM", "FaCloudArrowUp", HEX.teal, HEX.tealTint, "The platform decision", [
    "CyberArk Certificate Manager, the existing vendor; no second tool",
    "Its cloud edition had no FedRAMP listing (Oct 20, 2026)",
    "So: the self-hosted edition, inside the boundary",
    "Its CA account is a certificate manager: scope it",
  ], 13.5, 7.35, 5.4);
  decision(s, "Run Certificate Manager, Self-Hosted inside the authorization boundary, and revisit when a certificate-management package is authorized",
    "Sponsor and CIO (program's model)", "Before servers onboard");
  sources(s, "Sources: CyberArk Certificate Manager, Self-Hosted 26.1 docs; Palo Alto Networks (Feb 11, 2026; NGTS); FedRAMP Marketplace data (Oct 20, 2026). Book 07, Chapters 04, 05 and 08.");
  narrate(s,
`Cloud PKI and Intune issue, renew and revoke the certificates they put on managed devices. Nothing Microsoft-native does the same for server certificates from AD CS, public TLS certificates, appliances or certificates nobody inventoried. That gap is the certificate lifecycle management platform's job: discovery, inventory, ownership, policy and automated renewal across issuers.

The issuer decision follows. Internal names, for web servers, NPS and RADIUS, VPN and Remote Desktop gateways and SQL Server, come from the retained AD CS hierarchy, requested and renewed through the platform rather than by hand or by server autoenrollment, so every server certificate has an owner, an expiry alert and automated renewal in one place. Domain controller certificates stay on autoenrollment. Public names come from a public CA through the same platform.

The program's platform is CyberArk Certificate Manager, formerly Venafi, from its existing machine-identity vendor; it consolidates there and adds no second lifecycle vendor. In the FedRAMP Marketplace data as of October 20, 2026, no package covered Certificate Manager, so the program deploys the self-hosted edition inside its own boundary, a program decision to revisit when the Marketplace changes. Two cautions: the platform's CA account holds the certificate-manager right, so it's scoped and reviewed; and its ACME service can't run with FIPS mode on, so it runs on dedicated servers.

The workbook's Research page has an implementation guide for this platform; the facts here come from Book 07. The book calls this a program decision; giving it to the sponsor and CIO is the program's model.`,
  "Book 07, Chapter 04 (The issuer decision for internal server certificates; Certificate lifecycle management); Chapter 05 (renewal ownership; CyberArk Certificate Manager roles); Chapter 08 (three renewal engines; ACME where it applies).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "PIV and certificate sign-in: trust, not issue");
  tag(s, "What");
  img(s, "ch06-cba-sign-in", 0.6, 1.5, 2.5, 3.6);
  sideBox(s, "PIV", "FaIdCard", HEX.navy, HEX.navyTint, "PIV stays with the Federal PKI", [
    "The migration doesn't change the PIV issuer",
    "The federal root isn't in default trust stores",
    "NTAuth and DC certificates while the domain exists",
    "Derived credentials need their own rule",
  ], 13, 3.3, 4.65);
  sideBox(s, "CBA", "FaFingerprint", HEX.teal, HEX.tealTint, "Entra ID only validates", [
    "Any trusted CA can sign in any user it's bound to",
    "High-affinity bindings; weak ones only in a pilot",
    "A PIN-protected card is multifactor; software isn't",
    "Require CRL validation; no OCSP",
  ], 13, 8.1, 4.65);
  decision(s, "Require high-affinity certificate bindings in production; any weaker binding kept becomes a standing exception for the AO",
    "CISO; AO for exceptions", "Before CBA leaves the pilot");
  sources(s, "Sources: GSA FPKI 101; KB5014754; IDManagement.gov CBA guide v2.0; Microsoft Learn — Entra CBA technical concepts, setup and CRL. Book 07, Chapters 04–06.");
  narrate(s,
`PIV certificates aren't issued by Cloud PKI or the program's AD CS, and the migration doesn't change their issuer. They come from Federal PKI shared service providers through the card management system, under the Federal Common Policy root. What the target has to do for PIV is trust, not issue: distribute that federal root, which isn't in the default Microsoft, Mozilla or Apple stores; keep the forest's NTAuth store and domain controller certificates right while the domain exists; and upload the chain to Entra ID.

The decisions sit in Entra certificate-based authentication. The trust store is a blast radius: adding a CA lets any certificate it issues authenticate any user it can be bound to. CA scoping, generally available since April 2026, ties a CA to one group, for example the PIV provider for cardholders and a Cloud PKI CA for derived software certificates. CBA is only as secure as its weakest binding. Microsoft treats a certificate as multifactor only if a PIN or biometric protects it, so a PIV card qualifies, a software certificate doesn't, and a derived credential with a different policy OID needs its own rule.

The program requires high-affinity bindings in production. That departs from IDManagement.gov's CBA guide, which says to select low affinity, on Microsoft's advice that administrators should use high-affinity bindings exclusively. Low affinity is acceptable only in a pilot with test certificates.

The matrix gives bindings and affinity to the CISO, with the PIV office consulted; a low-affinity binding kept as a standing exception goes to the authorizing official.`,
  "Book 07, Chapter 04 (Federal PKI for PIV); Chapter 06 — Device and User Certificates (strong mapping and PIV; the trust store; username bindings and affinity; single-factor and multifactor certificates); Chapter 05 (matrix: CBA bindings; low-affinity exception).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "No one decided who owns the CA; now name one per row");
  tag(s, "Who");
  img(s, "ch05-certificate-estate-owners", 0.6, 1.5, 5.6, 3.6);
  sideBox(s, "Decide", "FaUsersGear", HEX.teal, HEX.tealTint, "Who decides", [
    "Sponsor and CIO: hierarchy, AD CS retirement, renewal owners",
    "CISO: issuance policy, trust anchors, binding strength",
    "AO: every standing exception",
    "Certificate owners: routine revocation",
  ], 13.5, 6.45, 6.3);
  decision(s, "Name one renewal owner for every certificate class, recorded in the lifecycle platform",
    "Sponsor and CIO", "Before servers onboard to the platform");
  sources(s, "Sources: Microsoft Learn — Secure, delegate and audit CA administration; NIST SP 800-37 Rev. 2; NIST SP 800-53 Rev. 5 (SC-17); CyberArk Certificate Manager docs. Book 07, Chapter 05.");
  narrate(s,
`In most Active Directory estates the certificate authority belongs to whoever installed it. On an enterprise CA, the local Administrators, Domain Admins and Enterprise Admins groups are CA administrators by default. Nobody decided that; it's how the role installs.

The target spreads the estate across more systems, not fewer: Cloud PKI administered in Intune, the CAs Entra trusts administered in Entra ID, retained AD CS with its own access list, PIV from the credentialing office, and server and public certificates in the lifecycle platform. Each has its own administrators, and each holds a piece of what the agency trusts.

So the program separates who decides from who does the work. PKI and CA administrators run the CAs and decide only what's purely operational. The CISO decides which CAs may issue for which purposes, lifetimes, key protection, which trust anchors may appear in trust stores, and the minimum binding strength; NIST's SC-17 control asks for exactly that. The authorizing official accepts every standing exception and any AD CS retirement that changes the boundary.

The sponsor and CIO decide the hierarchy and when each AD CS component retires, and they assign renewal ownership per class, because that assignment crosses team lines only the CIO's organization can settle. Expired certificates are the most common way a certificate estate fails, and an expiry is almost always an ownership failure first. Each class gets one owner who answers for it even when automation renews it. Before servers onboard is design guidance.`,
  "Book 07, Chapter 05 — Who Owns the Certificate Estate (introduction; Decision rights and work are different things; The roles; matrix: renewal ownership per class; Renewal ownership per certificate class).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Four permission systems, one access model");
  tag(s, "Who");
  img(s, "ch05-four-permission-planes", 0.6, 1.5, 4.5, 3.6);
  sideBox(s, "Disguise", "FaUserShield", HEX.red, HEX.redTint, "Console clicks that are really risk decisions", [
    "Leaving a template published “in case someone needs it”",
    "Trusting a CA in Entra without a CRL: revoked certificates still work",
    "Leaving CBA bindings at the low-affinity default",
    "The platform's CA account can approve for every template it reaches",
  ], 13.5, 5.35, 7.4);
  decision(s, "Map every team in all four systems, keep privileged roles eligible, and let no one both change and approve what a CA issues",
    "CISO (program's model)", "Before Wave 2");
  sources(s, "Sources: Microsoft Learn — Intune custom roles (Cloud PKI); Set up Entra CBA; certificateUserIds roles; CyberArk Microsoft CA template (26.1). Book 07, Chapter 05.");
  narrate(s,
`Decision rights don't change what a console lets someone do. Roles do, and for certificates there are four separate permission systems.

The AD CS access list governs the retained CAs: CA administrator, certificate manager, auditor, backup custodian and key recovery agent, with template permissions as a separate control point. Intune governs Cloud PKI, where revoking or deleting a CA is permanent. Entra roles govern CBA: one role manages the trust store, another the bindings and affinity, and administrators of synchronized users can change which account a certificate signs in as. And the lifecycle platform has its own roles; its account on the CA holds the certificate-manager right, so it's effectively a certificate manager for every template it can reach, and its top administrators hold that power indirectly.

That's why the book lists everyday console actions that are risk decisions in disguise. Leaving a template published just in case. Adding a CA to the Entra trust store without a CRL, which means certificates it revokes still authenticate. Setting the tenant's binding to low affinity, which is the default. Extending a CRL's validity so an offline root needs fewer ceremonies.

The rule across all four is the same as in the other books: least privilege, privileged roles eligible rather than permanent, and no one who submits a high-impact change approves it. Trust anchors and issuance policy are the CISO's decisions, so the access model is too, in the program's model. Before Wave 2 is design guidance.`,
  "Book 07, Chapter 05 (Decision rights and work are different things; Four permission systems, one access model; What changes from \"whoever installed the CA\").");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Six gated waves, each with a tested rollback");
  tag(s, "How");
  img(s, "ch07-migration-waves", 0.6, 1.5, 2.85, 3.6);
  const waves = [
    ["1 Assess", "1–4", "Every template classified; Critical and High findings closed"],
    ["2 Foundation", "5–8", "Cloud issuing CA live; trust deployed; test certificate validates"],
    ["3 Pilot", "9–16", "Pilot devices and users on cloud certificates and Entra CBA"],
    ["4 Scale", "17–28", "Every managed device holds cloud certificates"],
    ["5 Cutover", "29–36", "Federated domains managed; AD FS certificate sign-in off"],
    ["6 Decommission", "37–44", "AD CS parts that served only MIGRATE retired"],
  ];
  tableAt(s, 3.65, 1.5, ["Wave", "Weeks", "Exit gate"],
    waves.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]), [1.85, 0.95, 6.3], [0.36, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 13);
  txt(s, "Waves note", "Weeks are the program's planning figures for one forest, not commitments.", { x: 3.65, y: 4.8, w: 9.1, h: 0.3, fontSize: 12, italic: true, color: HEX.slate });
  decision(s, "Approve each wave's exit gate before the next starts; no wave begins until its rollback has been rehearsed",
    "Sponsor and CIO (program's model)", "At each wave gate");
  sources(s, "Sources: Microsoft Learn — Migrate from federation to cloud authentication; Staged rollout; Remove SCEP or PKCS certificates; AD FS decommission guide. Book 07, Chapters 05 and 07.");
  narrate(s,
`The book's playbook runs as six waves, each with an entry gate, the work, an exit gate, a rollback and a planning duration. The durations, about forty-four weeks end to end, are the program's planning figures for a single-forest estate, not commitments; scale them to the Wave 1 inventory.

Foundation creates the cloud issuing CA with licensed hardware-backed keys, deploys trust to devices and domain-joined relying parties, and proves a test certificate everywhere, with trust profiles on at least 99 percent of managed devices. Pilot puts 50 to 100 devices and a pilot user group on cloud certificates and Entra CBA, with at least 95 percent issuance success; those thresholds are the program's. Scale extends by rings, removing old autoenrollment ring by ring once the new certificates are accepted. Cutover converts federated domains to managed authentication and turns off AD FS certificate sign-in.

The rollback rules are what make this safe. No wave starts until its rollback has been rehearsed in a test scope. No rollback depends on something the same wave retires, which is why AD CS autoenrollment stays on through the pilot and AD FS stays restorable for thirty days after cutover, for a four-hour recovery objective. Removing or even editing an Intune certificate profile revokes the certificates it issued, so profile changes are changes with impact, not a harmless undo.

Wave 1's exit is approved by the PKI owner and the security team. Approving the later gates sits with the sponsor and CIO, who own sequence in the program's model.`,
  "Book 07, Chapter 07 — Coexistence and Migration (The migration playbook, Waves 1–6; Rollback rules that hold across waves); Chapter 05 (The sponsor and CIO).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Coexistence: both PKIs are production");
  tag(s, "How");
  img(s, "ch07-trust-directions", 0.6, 1.5, 5.7, 3.6);
  sideBox(s, "Rules", "FaRightLeft", HEX.navy, HEX.navyTint, "Five coexistence rules", [
    "One issuer per use case per population",
    "Trust goes up before issuance moves",
    "Revocation reachable wherever validation happens",
    "Nothing revoked to force a move",
    "Every move has a tested rollback",
  ], 13.5, 6.55, 6.2);
  takeaway(s, "FaPlugCircleXmark", HEX.amber, "Most coexistence outages are revocation outages.  ",
    "Every CRL must be reachable inside the network, from the internet and by Entra ID, wherever its certificates are checked.");
  sources(s, "Sources: Microsoft Learn — Set up Entra CBA; Entra CBA CRL; NTAuth import; Distribute certificates by Group Policy; EAP-TLS certificate requirements. Book 07, Chapter 07.");
  narrate(s,
`Coexistence isn't a phase at the end; it's the condition the project runs in. From the first Cloud PKI certificate until the last AD CS-dependent workload retires, devices carry certificates from both issuers, relying parties trust both chains, and two sets of CRLs have to stay reachable.

What stays on AD CS until Active Directory retires: domain controller certificates, which Cloud PKI can't issue because domain controllers aren't Intune-managed, and which also serve LDAPS; and other server certificates, now renewed through the lifecycle platform.

Trust has to run both ways. The AD CS chain goes into the Entra trust store, with internet-facing CRL addresses, which is also what lets AD FS certificate sign-in move to Entra without reissuing a certificate. The cloud chain goes to domain-joined relying parties by Group Policy or directory publication. NTAuth, the forest's list of CAs allowed to issue logon certificates, gets a cloud CA only if it will issue logon certificates, because every entry is a CA the forest lets mint logon credentials.

The book's warning is that most coexistence outages are revocation outages. Relying parties now sit inside the network, on the internet and in Entra ID. A new CRL address appears only in certificates issued after the change. Entra must download a CRL without authentication within ten seconds or fail the sign-in, which is why the program publishes CRLs on plain anonymous web endpoints rather than behind a proxy. And nothing is revoked early: AD CS certificates leave at renewal.`,
  "Book 07, Chapter 07 (Two PKIs, one estate: the coexistence rules; What stays on AD CS until Active Directory retires; Trust in both directions; CRL availability; Renewal while two issuers overlap).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Monitoring turns expiries into signals, not outages");
  tag(s, "How");
  img(s, "ch08-lifecycle-loop", 0.6, 1.5, 3.6, 3.6);
  sideBox(s, "Watch", "FaChartLine", HEX.teal, HEX.tealTint, "What the program watches", [
    "Any certificate within two renewal windows of expiry with no renewal path",
    "Issuance outside policy, and certificates with no enrollment record",
    "Trust store drift, stale CRLs and hardening regressions",
    "Evidence kept at least weekly: assessors ask how long a finding stayed open",
  ], 13.5, 4.45, 8.3);
  decision(s, "Set the grace period before a valid certificate becomes a compliance condition that can cut off access",
    "CISO (security office)", "Before the compliance check is turned on");
  sources(s, "Sources: CA/Browser Forum Baseline Requirements; Microsoft Learn — AD CS revocation and CRL publication; Intune custom compliance; NIST SP 800-53 Rev. 5. Book 07, Chapters 05 and 08.");
  narrate(s,
`Migration ends on a date. Certificates don't. Every certificate reaches its expiry, and every CA that issued it must keep publishing a CRL relying parties can reach until then.

The design rule is that no certificate class may depend on a person remembering a date. Three renewal engines cover everything: Intune profiles for managed devices, autoenrollment for domain controller certificates, and the lifecycle platform for servers, appliances and public TLS. The platform answers three questions for every certificate it finds: which class it belongs to, who owns its renewal, and whether an issuance record explains it. A certificate on a listener with no enrollment record and no owner is a finding, shadow infrastructure or unauthorized issuance. And any certificate within two renewal windows of expiry with no renewal path bound to it is treated as an incident while it can still be fixed.

Revocation is the part that fails silently. Relying parties keep trusting a certificate until they fetch a newer CRL, so CRLs are run as a production service: published before expiry, delivery endpoints monitored, not just the CA, and old addresses kept alive until no unexpired certificate references them.

The drift checks run at least weekly and their outputs are kept as evidence, because an assessor asks how long a finding stayed open; the evidence maps to the IA-5(2), SC-12 and SC-17 controls.

One choice needs care. Intune can make a valid certificate a compliance condition, which turns a failed renewal into lost access. The book makes the grace period a security-office decision.`,
  "Book 07, Chapter 08 — Lifecycle, Monitoring and Decommissioning (Renewal at scale; Inventory and renewal; Revocation and CRL availability; Monitoring; Compliance and drift detection; The evidence an assessor reads).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Retire AD CS last, CA by CA, with evidence");
  tag(s, "How");
  img(s, "ch08-adcs-decommission", 0.6, 1.5, 2.8, 3.6);
  sideBox(s, "Retire", "FaDoorClosed", HEX.amber, HEX.amberTint, "What retirement takes", [
    "Gate: cutover done, 30-day rollback window passed, retained classes running",
    "CRL and AIA endpoints keep serving until the last certificate expires",
    "Under BYOCA, the root that signed the cloud CA stays",
    "CA records kept 7½ to 20½ years (NARA GRS 3.2); the records officer signs off",
  ], 13.5, 3.6, 9.15);
  decision(s, "Set each CA's retirement only after its gate passes; domain controllers keep one AD CS CA until the last of them retires",
    "Sponsor and CIO", "Per CA, after Wave 5");
  sources(s, "Sources: Microsoft Learn — Decommission an enterprise CA (KB 889250); Operate certificate revocation and CRL publication; NARA GRS 3.2, items 060–062. Book 07, Chapters 05, 07 and 08.");
  narrate(s,
`Decommissioning is the last wave, and it applies only to the CAs and role services that no longer serve a retained certificate class. Domain controller, LDAPS and RADIUS certificates usually keep at least one AD CS issuing CA alive for as long as domain controllers exist.

The gate is the program's: cutover complete, the 30-day rollback window passed with no incidents, and every retained class documented and running on the CAs that remain. Then each CA goes through a fixed sequence. Confirm nothing depends on it, using the platform's inventory and the CA database. Stop new issuance. Back up and archive the database and key. Revoke what's outstanding and publish a final CRL whose lifetime outlasts the revoked certificates. Uninstall the role services. Remove the CA from the Entra trust store, Intune profiles, NTAuth and the platform. And keep the revocation and chain endpoints serving until the last certificate expires.

Under the recommended BYOCA model, the root, and any CA that signed the cloud issuing CA, stays in service, publishing CRLs with its keys in custody. Only the AD CS issuing CAs that no longer issue retire.

Records outlive the hardware. NARA's General Records Schedule 3.2 keeps a CA's records for seven and a half to twenty and a half years, depending on its level of operation, and the agency records officer confirms disposition before any archive is destroyed. A rollback after decommissioning means restoring the CA from backup, planned at eight to twelve hours.

The matrix puts each CA's decommissioning with the sponsor and CIO; the PKI administrators run it.`,
  "Book 07, Chapter 08 (Decommissioning AD CS: gate, steps 1–9, BYOCA variation); Chapter 07 (Wave 6; restore time); Chapter 05 (matrix: AD CS decommissioning, per CA).");
}

// ------------------------------------------------------------------ How 5
{
  const s = content(S_HOW, "Risks that turn into outages or findings");
  tag(s, "How");
  cards(s, "Risk", [
    ["FaUserClock", "Expiry", HEX.red, HEX.redTint, ["A certificate nobody owned", "Certificates in no inventory", "Enrollment servers' own certificates lapsing"]],
    ["FaPlugCircleXmark", "Revocation", HEX.amber, HEX.amberTint, ["A CRL Entra can't reach fails every sign-in for that CA", "A CA trusted with no CRL lets revoked certificates work", "Old CRL addresses removed too early"]],
    ["FaLock", "Trust", HEX.navy, HEX.navyTint, ["Weak bindings let a same-name certificate sign in", "The cloud CA inherits the old hierarchy's flaws", "ACME can't run with FIPS mode on (vendor guide)"]],
  ], 13.5);
  decision(s, "Accept each standing exception explicitly: a CA trusted without a working CRL, a low-affinity binding, a CRL kept past policy",
    "Authorizing official", "As each is raised");
  sources(s, "Sources: Microsoft Learn — Entra CBA CRL; NDES enrollment agent renewal; CyberArk Certificate Manager, Self-Hosted 26.1 installation guide. Book 07, Chapters 03–06 and 08.");
  narrate(s,
`These are the failure modes the book names, in three groups.

Expiry. Expired certificates are the most common way a certificate estate fails, and an expiry is almost always an ownership failure first: the reminder went to someone who left, or the certificate was in no inventory, from an unknown issuer, so nobody touched it. The enrollment infrastructure has certificates of its own, too; NDES's registration-authority certificates expire like any other and are a frequent cause of NDES outages.

Revocation. If Entra can't download a CA's CRL, certificate sign-in fails for every certificate that CA issued. The opposite failure is quieter: a CA uploaded to the trust store without a CRL address lets its revoked certificates keep authenticating. And removing an old CRL endpoint while unexpired certificates still reference it breaks validation.

Trust. With several bindings, CBA is only as secure as the weakest, and a low-affinity value lets any certificate with the same name sign in. Under BYOCA the cloud issuer inherits whatever is wrong with the hierarchy above it, which is why the hardening gate comes first. And a vendor detail with federal weight: CyberArk's installation guide says FIPS isn't supported for its ACME service, so the program runs it on dedicated servers outside the FIPS-mode set.

The matrix splits exceptions by time. A temporary exception with an end date is a control decision for the CISO. A standing one, with no end date or past the agency's limit, is a risk acceptance, and the authorizing official decides it: a template that can't be retired yet, a CA trusted without a working CRL, a low-affinity binding, a CRL validity stretched past policy.`,
  "Book 07, Chapter 01 (Manual lifecycle management breaks); Chapter 03 (hardening first); Chapter 05 (The authorizing official; matrix: exceptions); Chapter 06 (NDES certificates; affinity); Chapter 08 (CRL availability; ACME and FIPS).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Run the move off AD CS as its own program, by expiry dates", "Sponsor and CIO", "Now"],
    ["Set lifetimes by policy; automate renewal for every class", "CISO", "Before Mar 15, 2027"],
    ["Classify every template, each with a named owner", "PKI and CA admins", "Wave 1"],
    ["Hold the hardening gate: Critical and High fixed first", "PKI owner; security", "Wave 1 exit"],
    ["Adopt four issuers; anchor the cloud CA to the existing root", "Sponsor and CIO", "Before Wave 2"],
    ["Run the offline root's CRL as a production service", "PKI and CA admins", "Before the signing"],
    ["Self-hosted lifecycle platform inside the boundary", "Sponsor and CIO", "Before servers onboard"],
    ["High-affinity bindings; weaker ones to the AO", "CISO; AO", "Before CBA scales"],
    ["One renewal owner per certificate class", "Sponsor and CIO", "Before servers onboard"],
    ["Four permission systems, one access model", "CISO", "Before Wave 2"],
    ["Approve each wave's exit gate; rehearse its rollback", "Sponsor and CIO", "Each gate"],
    ["Grace period before certificate-based compliance", "CISO", "Before turning it on"],
    ["Retire each CA only after its gate passes", "Sponsor and CIO", "Per CA, after Wave 5"],
    ["Accept each standing exception explicitly", "Authorizing official", "As each is raised"],
  ];
  const colW = [6.65, 2.75, 2.75];
  const est = asks.reduce((h, r) => h + Math.max(0.28, Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, 11.5))) * lh(11.5) + 0.1), 0.32);
  fit("decision table", 1.45 + est, 5.85);
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts(colW, { y: 1.45, w: colW.reduce((a, b) => a + b, 0), fontSize: 11.5, rowH: [0.32, ...asks.map(() => 0.28)] }));
  txt(s, "Close line", [{ text: "Certificates fail on their own clock.  ", options: { bold: true, color: HEX.amber } },
    { text: "Own the issuer, renew without people, and retire AD CS last." }],
    { x: 0.6, y: 6.0, w: 12.15, h: 0.5, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: Book 07, Chapters 01–08; owners from Chapter 05's responsibility matrix; timings marked in the notes as planning figures or design guidance.");
  narrate(s,
`So, the decisions, with their owners and timing.

The sponsor and CIO run the move off AD CS as its own program, sequenced by expiry dates; adopt the four-issuer target with the cloud CA anchored to the existing root; confirm the self-hosted lifecycle platform inside the boundary and revisit it when the Marketplace changes; name one renewal owner per certificate class; approve each wave's exit gate; and retire each CA only after its gate passes, keeping one for the domain controllers until the last of them retires.

The CISO sets lifetimes by policy and requires automated renewal before they shorten; requires high-affinity bindings in production; owns the single access model across the four permission systems; and sets the grace period before certificate presence becomes a compliance condition.

The PKI and CA administrators classify every template with a named owner, and run the offline root's CRL as a production service within the security office's window. The PKI owner and the security team hold the hardening gate. And the authorizing official accepts each standing exception explicitly, or doesn't.

None of this starts with a purchase; the program already has the platform. It starts with the inventory. Certificates fail on their own clock: own the issuer, renew without people, and retire AD CS last, with evidence. Book 07 has the detail, every claim footnoted. Thank you.`,
  "Book 07, Chapters 01–08 (owners from Chapter 05's responsibility matrix; timings from the chapters named on each slide, otherwise design guidance or planning figures).");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: Microsoft PKI, Intune and Entra");
  const src = [
    "Microsoft Learn (AD CS): What is AD CS?; Certification Authority role; certificate templates; Monitor AD CS publication health; Secure, delegate and audit CA administration; Operate certificate revocation, CRL publication and CDP changes; Post-Quantum Cryptography in AD CS; Decommission an enterprise CA (KB 889250); smart card logon with third-party CAs; NTAuth import.",
    "Microsoft Learn (Intune and Cloud PKI): Cloud PKI overview, fundamentals, deployment models, BYOCA, renewal and monitoring; Intune supported platforms; GCC High and DoD service description; What's new in Intune (June and September 2026); SCEP, PKCS and trusted certificate profiles; Certificate Connector; custom compliance.",
    "Microsoft Learn (Entra and Defender): Entra CBA overview, technical concepts, setup, CRL and limitations; certificateUserIds; staged rollout; migrate from federation; AD FS decommission guide; Defender for Identity certificate assessments.  ·  Microsoft Support, KB5014754.",
  ];
  fit("Source list 1", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 1", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: federal, standards and vendor");
  const src = [
    "Federal: OMB M-22-09; OMB M-26-15 (June 24, 2026).  ·  NIST SP 800-53 Rev. 5 (IA-5(2), SC-12, SC-17); SP 800-37 Rev. 2; IR 8547 (initial public draft); FIPS 201-3.  ·  GSA IDManagement.gov: FPKI 101; Network Smart Card Logon; Entra CBA guide v2.0 (March 17, 2026).  ·  NARA General Records Schedule 3.2, items 060–062.",
    "Standards: CA/Browser Forum Ballot SC-081v3 (April 2025) and Baseline Requirements 2.3.1 (October 4, 2026); RFC 8555 (ACME).",
    "Vendor: CyberArk Certificate Manager, Self-Hosted 26.1 documentation and installation guide; Palo Alto Networks press release (February 11, 2026) and Next-Generation Trust Security page; FedRAMP Marketplace product data (October 20, 2026).",
    "All accessed October 20–23, 2026. Full footnotes with links: Book 07, every chapter (whalermike.github.io/modernization-workbook/docs/books/b07-pki/). The Research page's lifecycle-platform implementation guide is a separate, under-review document.",
  ];
  fit("Source list 2", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 2", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// The narration (narration.json) must name every slide before "Backup", in order, with the slide's own title.
const NARR = path.join(__dirname, "narration.json");
if (fs.existsSync(NARR)) {
  const nj = JSON.parse(fs.readFileSync(NARR, "utf8"));
  const narrated = titles.slice(0, perSlide.length);
  if (nj.length !== narrated.length) console.warn(`  ! narration.json has ${nj.length} entries for ${narrated.length} narrated slides`);
  nj.forEach((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i + 1} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title "${e.title}" doesn't match the slide ("${narrated[i]}")`);
  });
  const said = nj.map((e) => e.say.split(/\s+/).filter(Boolean).length);
  console.log(`narration.json: ${said.reduce((a, b) => a + b, 0)} words (${said.join(", ")}), about ${mmss(said.reduce((a, b) => a + b, 0) * 60 / 150)} at 150 wpm`);
}
console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
