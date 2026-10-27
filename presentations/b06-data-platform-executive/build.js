// Book 06 — Data Platform: SQL Server Identity: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the CISO, the data platform owner, application owners and the program's sponsors.
// Decision-centered: every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B06_Data_Platform_Executive.pptx
// Every fact comes from a footnoted chapter (or Appendix B) of docs/books/b06-data-platform/, named in the notes.
// Decision owners come from the book's responsibility matrix (Chapter 13); where an owner or a timing is the
// program's own model, or where the book gives no date, the notes say "program's model" or "design guidance".
// Diagrams are the committed PNGs in docs/images/sql-server/diagrams/png/ (and docs/images/diagrams/b06-data-platform/png/);
// alt text is read from the chapters' fig-alt so it stays in step with the book. The spoken narration is in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 06", title: "Data Platform: SQL Server Identity",
  footer: "Federal Modernization Workbook  ·  Book 06 Data Platform: SQL Server Identity  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B06_Data_Platform_Executive.pptx";

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
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

// Alt text for each committed diagram, taken from the fig-alt attribute in the chapter that shows it.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b06-data-platform");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header), centered across maxW.
const IMAGES = path.join(__dirname, "..", "..", "docs", "images");
const DIRS = [path.join(IMAGES, "sql-server", "diagrams", "png"), path.join(IMAGES, "diagrams", "b06-data-platform", "png")];
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

const S_WHY = "Why the database", S_WHAT = "What the target is", S_WHO = "Who owns the work", S_HOW = "How to sequence and close";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, checkTitle("SQL Server Identity: the executive briefing"), "Book 06  ·  Data Platform  ·  Executive briefing");
  D.agenda(s, 0.8, 4.82, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for the CIO, the CISO, the data platform owner, application owners and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 9.5, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 06 of the Federal Modernization Workbook, Data Platform: SQL Server Identity. It runs about thirty minutes, for the people who decide: the CIO, the CISO, the data platform owner, application owners and the program's sponsors.

The argument fits in three sentences. Every SQL Server instance joined to the domain inherited Windows Authentication, and none of it is visible to the identity plane that enforces MFA, device compliance and sign-in risk. The estate has to be counted and shrunk before any login moves, because migrating the logins of an instance that's about to be retired is wasted work. And the destination is an Entra token on every connection, proven continuously, with the migration finished well before the program's own NTLM block date of April 1, 2027.

I'll take four questions: why the database is where legacy authentication hides; what the inventory finds and what the target looks like; who owns the work, DBAs and application owners in particular; and how to sequence it against Active Directory's retirement and close it. Every decision slide names the decision, its owner and when it's needed. Where the owner or the timing is the program's model, or the book gives no date, the notes say so. Every external claim in the book was checked against its source on October 20, 2026.`,
  "Book 06, index; Chapter 01 — What Windows Authentication Actually Is; Chapter 13 — Who Owns the Data Platform.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "The database is where legacy authentication hides");
  tag(s, "Why");
  img(s, "book-01-authentication-paths-and-anchors", 0.6, 1.5, 5.0, 3.6);
  sideBox(s, "Hidden", "FaDatabase", HEX.red, HEX.redTint, "Invisible to the identity plane", [
    "Windows Authentication is always on; it can't be disabled",
    "Which protocol a connection used shows only inside the engine",
    "Dependencies hide in connection strings, service accounts, linked servers and sa",
    "Only an Entra token reaches MFA, device compliance and sign-in risk",
  ], 13.5, 5.85, 6.9);
  takeaway(s, "FaTriangleExclamation", HEX.red, "The database breaks last and hardest.  ",
    "When NTLM goes and Conditional Access arrives, the database needs its own plan, not a line in the directory migration.");
  sources(s, "Sources: Microsoft Learn — Choose an authentication mode; Register a Service Principal Name for Kerberos connections; What is Conditional Access? Book 06, Chapter 01.");
  narrate(s,
`Every identity program eventually reaches the database, and that's where it finds the most Windows authentication still in use.

A SQL Server instance doesn't check passwords for Windows logins. It trusts whatever the Windows security subsystem tells it, and Microsoft's documentation is explicit that Windows Authentication is always available and can't be disabled. The protocol a connection actually used, Kerberos or NTLM, is visible only from inside the engine, one session at a time. The dependencies sit in connection strings, service accounts, linked servers and the built-in sa login. None of them shows up on an identity dashboard, and none produces a sign-in that Microsoft Entra ID can evaluate.

The figure shows the four ways a connection reaches SQL Server today: Kerberos, NTLM fallback, a SQL login and password, and a Microsoft Entra token. Only the last is anchored in an identity plane that can enforce MFA, device compliance and sign-in risk.

So when the program retires NTLM, puts Conditional Access in the authentication path and stops treating Active Directory as the identity source, the database is where those changes break things last and hardest. That's why the data platform has its own book, and why it needs its own plan rather than a line in the directory migration.`,
  "Book 06, Chapter 01 — What Windows Authentication Actually Is (Why the database is where legacy authentication hides; The case in one paragraph).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Silent NTLM fallback is invisible until measured");
  tag(s, "Why");
  img(s, "book-01-ch01-kerberos-sspi-ntlm-fallback", 0.6, 1.5, 3.4, 3.6);
  sideBox(s, "Fallback", "FaTriangleExclamation", HEX.red, HEX.redTint, "Fallback no one sees", [
    "No service principal name: every connection drops to NTLM",
    "The application still gets a working connection",
    "The engine doesn't log which protocol each session used",
  ], 13.5, 4.25, 4.15);
  sideBox(s, "Anchors", "FaKey", HEX.amber, HEX.amberTint, "Identities anchored in AD", [
    "Engine service accounts live in Active Directory",
    "sa and SQL logins: passwords only the instance checks",
    "No Entra sign-in, no Conditional Access",
  ], 13.5, 8.55, 4.2);
  takeaway(s, "FaLightbulb", HEX.navy, "Good engineering for a world that's gone.  ",
    "An estate confident it runs Kerberos can be running NTLM on a large share of its connections; only measurement shows how much.");
  sources(s, "Sources: Microsoft Learn — Register a Service Principal Name; Microsoft NTLM; Configure Windows service accounts; Service accounts (gMSA). Book 06, Chapter 01.");
  narrate(s,
`Windows Authentication was good engineering. Kerberos through SSPI keeps passwords off the wire and authenticates both ends of the connection. Its weakness is what happens when it can't work.

If the instance's service principal name was never registered, or the registration failed, Kerberos isn't used and the connection falls back to NTLM, for remote and local connections alike. The application gets a working connection either way. The engine logs a failed registration at startup, but not which protocol each connection negotiated; the only way to see that is to query the live connections, session by session. An environment confident that it runs Kerberos can be running NTLM on a large share of its connections, and only measurement shows how large.

The identities are anchored to authorities the program is retiring or can't see. The engine's service account, whether a domain account, a group managed service account or the virtual account, is anchored in Active Directory. The sa login and every SQL login are checked against a password the instance holds: no Entra sign-in, no domain controller traffic for Defender for Identity to watch. An enabled sa is the most dangerous entry point on the instance.

The book is fair about this. It was correct engineering for a fully domain-joined world, and that world no longer exists.`,
  "Book 06, Chapter 01 (The Kerberos foundation; The NTLM fallback; The service account; The sa account; Why this was correct).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Three drivers end it; 2027-04-01 is the program's date");
  tag(s, "Why");
  img(s, "book-01-ch02-three-drivers-and-order", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Due", "FaUserClock", HEX.navy, HEX.navyTint, "What is really due in 2027", [
    "No Microsoft or federal NTLM deadline falls on April 1, 2027",
    "Windows Server 2016: extended support ends Jan 12, 2027",
    "SQL Server 2014: last ESU year ends July 12, 2027",
    "SQL Server 2017: support ends Oct 12, 2027",
  ], 13.5, 7.1, 5.65);
  decision(s, "Hold the order: assess and consolidate, enable Arc, migrate logins, then block NTLM, with migration finished well before April 1, 2027",
    "CIO and data leadership (program's model)", "Before any login moves");
  sources(s, "Sources: OMB M-22-09; Microsoft Learn — Deprecated features (NTLM); Retiring NTLM FAQ (Sep 9, 2026); Microsoft Lifecycle and Ending Support in 2027. Book 06, Chapters 02 and 21.");
  narrate(s,
`Three drivers end the inheritance.

First, NTLM elimination. The program's Kerberos and NTLM elimination decision, accepted May 13, 2026, commits it to eliminating NTLM. Microsoft deprecated every version of NTLM in June 2024 and plans to disable network NTLM by default in the next major Windows release, subject to change, with no calendar date. Second, zero trust. M-22-09 requires phishing-resistant MFA enforced at the application layer, and Kerberos and NTLM involve no Entra sign-in at all, so a DBA on an unmanaged device can't be blocked by policy. Third, service-account identity. When Active Directory stops being the authoritative source, the engine needs an identity that outlives it, and on premises that arrives through Azure Arc.

April 1, 2027 is the program's own backstop, not Microsoft's and not a federal deadline: on that date the program disables NTLM across the estate. The 2027 dates that are external are support dates: Windows Server 2016 on January 12, SQL Server 2014's last Extended Security Update year on July 12, and SQL Server 2017 on October 12. None of those versions can accept Entra logins, which need SQL Server 2022 or later.

The dependencies set the order: assess and consolidate, enable Arc, migrate logins, then eliminate NTLM. In the program's model the CIO and data leadership own that order, and the book reads the date as the moment the block lands, so migration has to end well before it.`,
  "Book 06, Chapter 02 — Why the Inheritance Must End (all three drivers; What is actually due in 2027); Chapter 21 — What Done Looks Like (What is due in 2027, and what isn't); Chapter 13 (CIO and data leadership).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Count the estate before deciding anything");
  tag(s, "What");
  img(s, "book-02-ch01-three-forms-of-sprawl", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Discover", "FaFilter", HEX.navy, HEX.navyTint, "Three sources, each blind to the others", [
    "A network and directory sweep finds unlisted instances",
    "The Kerberos SPN trail finds every instance ever registered",
    "Assessment tooling adds workload and dependency data",
    "Re-run it: the estate moves during the assessment",
  ], 13.5, 7.1, 5.65);
  takeaway(s, "FaHashtag", HEX.navy, "Forty believed, a hundred and ten found.  ",
    "That team isn't behind schedule; its scope estimate is wrong by nearly three times (the book's illustration).");
  sources(s, "Sources: Microsoft Learn — SQL Server Browser service; Setspn; Azure Migrate discovery and dependency analysis; Entra cloud-first identity guidance; dbatools. Book 06, Chapters 03–04.");
  narrate(s,
`After twenty years across an Active Directory forest, the estate has three overlapping forms of sprawl. Instance sprawl: development instances that became production, evaluation instances nobody removed, Express instances an installer provisioned that held real data for years. Database sprawl: orphaned databases, zombies with no connection in 400 days or more, which is the program's threshold, and near-duplicates. Every database is a potential source of logins, and every login is a unit of migration work. And forest entanglement: instances across trusted domains, logins that resolve in other domains, and linked servers that cross domain boundaries.

The inventory has to be discovered, not retrieved, and no single instrument finds everything. A network and directory sweep listens for instances. A forest-wide query of SQL Server service principal names finds every instance ever registered for Kerberos. Microsoft's assessment tooling adds workload and dependency data. The program closed the gap its engine-authentication decision named with a Phase 0 instrument that fuses all three into one deduplicated, re-runnable inventory, documented in Runbook R02.

The book's illustration is the one to remember. A team that believes it has forty instances, when the sweep finds a hundred and ten, isn't forty instances behind; its scope estimate is wrong by a factor of nearly three. An estate that proceeds on an incomplete inventory discovers its missing instances at the worst possible moment.`,
  "Book 06, Chapter 03 — The Shape of Twenty Years (all three forms of sprawl); Chapter 04 — The Estate Inventory (Discovery instruments; The Phase 0 discovery instrument).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Retain, consolidate or retire gates everything");
  tag(s, "What");
  img(s, "book-02-ch04-retain-consolidate-retire", 0.6, 1.5, 5.6, 3.6);
  sideBox(s, "Lenses", "FaListCheck", HEX.navy, HEX.navyTint, "Three lenses, one verdict each", [
    "Use: no connection in 400+ days marks a zombie (program threshold)",
    "Version: Entra logins need SQL Server 2022 or later",
    "Dependencies: a quarterly job can make an idle instance load-bearing",
    "Name the target now, so authentication migrates once",
  ], 13.5, 6.45, 6.3);
  decision(s, "Give every instance a retain, consolidate or retire verdict, and name the target for each consolidated workload",
    "CIO and data leadership", "Before the authentication audit");
  sources(s, "Sources: Microsoft Learn — CREATE LOGIN; Upgrade SQL Server; SQL Server end of support options; Microsoft Entra authentication for SQL Server. Book 06, Chapters 05, 06 and 13.");
  narrate(s,
`Every instance gets one of three verdicts, and only two of them enter the authentication migration.

Three lenses make the call defensible. Utilization: a database with no connection in 400 days, no restores and a retired owning application is a zombie, the cleanest retirement candidate, and retiring it removes every forgotten login it carries. Version: the login syntax the whole transformation depends on exists only on SQL Server 2022 and later. SQL Server 2012's last security update year ended in July 2025, 2008 and 2008 R2 need a side-by-side upgrade, and SQL Server 2025 accepts in-place upgrades only from 2014 SP3 onward, so for most old engines the answer is consolidate, not upgrade in place. Dependencies: linked servers, replication, and a query that runs once a quarter can make an idle-looking instance load-bearing.

A retain instance survives roughly in place. A consolidate instance's workload moves to a modern target and the source retires. A retire instance goes away with its logins. Targets are SQL Server 2022 or 2025 on Arc-enabled hosts, standalone or in availability groups, because failover cluster instances don't support Entra authentication; Azure SQL Managed Instance, with its 32-terabyte limit; or Azure SQL Database.

The matrix puts the verdict and the target with the CIO and data leadership, with the data platform team doing the work. The charter's first phase excludes full consolidation, so the verdict is in scope while a large consolidation needs its own funding decision.`,
  "Book 06, Chapter 05 — Rationalization (all three lenses); Chapter 06 — The Retain, Consolidate, Retire Decision (classifications; target-state options; what can't be consolidated; the identity dividend); Chapter 13 (responsibility matrix; charter boundaries).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "The audit sorts survivors into three categories");
  tag(s, "What");
  img(s, "book-03-ch01-arc-eligibility-classification", 0.6, 1.5, 6.0, 3.6);
  sideBox(s, "Flags", "FaClipboardCheck", HEX.red, HEX.redTint, "What it flags first", [
    "An enabled sa with an old password: the top finding",
    "Active SQL logins: invisible to the identity plane",
    "Missing SPNs: NTLM nobody knows about",
    "Output: a per-instance record that re-runs, not a spreadsheet",
  ], 13.5, 6.85, 5.9);
  decision(s, "Upgrade or retire each pre-2022 retain instance; one that can't move in time goes to the AO as a dated exception",
    "CIO and data leadership; AO for exceptions", "Before the 2027-04-01 block");
  sources(s, "Sources: Microsoft Learn — Microsoft Entra authentication for SQL Server; Arc prerequisites; sys.server_principals; Register an SPN. Book 06, Chapters 07, 08, 12 and 13.");
  narrate(s,
`The audit runs only on retain instances and consolidation targets, and it asks what is actually authenticating.

Three findings rise to the top. An enabled sa with a password that hasn't been rotated is the highest-priority remediation finding. Active SQL logins are critical, because they're invisible to the Azure identity plane. And a missing service principal name means NTLM on every remote connection that expects Kerberos.

Each instance then gets a category. Category 1 is ready for Entra today: Arc agent, SQL extension, Entra configured, SQL Server 2022 or later. Category 2 meets the prerequisites but needs Arc. Category 3 can't take Entra logins yet: the version is older than 2022, or the host can't enroll. Failover cluster instances don't support Entra authentication on any version, so they re-platform to a standalone instance or availability group, or carry an exception.

The output is a per-instance compliance record that re-runs on a schedule and flags drift, not a spreadsheet.

The matrix gives the upgrade-or-retire call for a pre-2022 retain instance to the CIO and data leadership, with the authorizing official consulted; the dated exception with its interim posture is the authorizing official's decision. A Category 3 instance still in place on April 1, 2027 faces NTLM failure whatever its exception says, because the block runs in the operating system.`,
  "Book 06, Chapter 07 — The Authentication Audit (scope; login type classification; Arc-eligibility output; telemetry sink); Chapter 08 — Reading the Audit (Category 3); Chapter 13 (matrix rows: upgrade or retire; dated exception).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "The target: every connection carries an Entra token");
  tag(s, "What");
  img(s, "book-04-arc-identity-bridge", 0.6, 1.5, 5.9, 3.6);
  sideBox(s, "Target", "FaIdCard", HEX.teal, HEX.tealTint, "What changes, and what doesn't", [
    "Each instance gets an Entra identity through Azure Arc",
    "People, groups and apps get Entra logins; sa is disabled, not migrated",
    "Conditional Access enforces MFA before a token exists",
    "Arc activates nothing until logins migrate",
  ], 13.5, 6.75, 6.0);
  decision(s, "Onboard Arc now, Category 2 instances first, on domain-joined hosts; never hold engine Entra authentication for domain unjoin",
    "Server infrastructure", "After the audit; before login migration");
  sources(s, "Sources: Microsoft Learn — Managed identity for Arc-enabled SQL Server; Entra authentication setup tutorial; Arc sign-in with Entra ID; CREATE LOGIN. Book 06, Chapters 09–11, 13.");
  narrate(s,
`The destination is easy to state: every connection carries a Microsoft Entra token, issued only after Entra's sign-in conditions are met.

Azure Arc is the bridge. Installing the Connected Machine agent gives the server an Azure resource and a system-assigned managed identity. On SQL Server 2025 that managed identity is the instance's Entra identity. On SQL Server 2022 the instance uses an app registration with a certificate in Key Vault; Microsoft recommends a validity of at most twelve months, and unless both the certificate and the registration are service-managed it needs a named renewal owner. Arc provides the capability but activates nothing: Entra authentication is off by default, and no login changes until the migration.

The principals map cleanly. Windows users become Entra users, Windows groups become Entra groups, SQL logins become application identities, preferably managed identities with no stored credential, and sa is disabled and renamed rather than migrated. The engine has no MFA logic; Conditional Access enforces MFA, device compliance and risk before the token is issued, for users.

The sequencing point saves months. Engine Entra authentication, Layer 1, needs SQL Server 2022 or later and Arc; it doesn't need domain unjoin or Windows Server 2025. OS-level Entra sign-in, Layer 2, is a separate, more disruptive program. The book calls blocking Layer 1 on Layer 2 the most common cause of unnecessary delay. The matrix gives the Arc onboarding order to server infrastructure, and the audit's Category 2 list sets it.`,
  "Book 06, Chapter 09 — What Arc Provides to SQL Server (the two-layer distinction; managed identity and service account; why Arc; what Arc doesn't do); Chapter 10 (Category 2 prioritization); Chapter 11 — Three Principal Types; Chapter 13 (matrix: Arc onboarding order).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Five positions the engine decision settles");
  tag(s, "What");
  img(s, "book-05-ch02-five-decisions", 0.6, 1.5, 3.6, 3.6);
  sideBox(s, "Five", "FaFileShield", HEX.navy, HEX.navyTint, "What each position means for the estate", [
    "Consolidation first: retired instances never migrate",
    "Parallel run: create, validate, disable, observe 30 days, then drop",
    "SQL logins eliminated; sa disabled and renamed; break-glass group empty by default",
    "Pre-2022 and cluster instances: upgrade, re-platform or a sunset-dated exception",
    "A per-instance compliance record is the closure artifact",
  ], 13.5, 4.45, 8.3);
  decision(s, "Set the standard once: SQL authentication refused, and sa disabled and renamed, on every production instance",
    "CISO", "Before the first production cutover");
  sources(s, "Sources: Microsoft Learn — sys.server_principals; Disable SQL authentication (Arc); Defender for Identity sensor prerequisites. Book 06, Chapters 11–13; App. B.");
  narrate(s,
`The SQL Server engine-authentication decision, which the book records as still proposed, is the engine-layer companion to the NTLM elimination program and the Arc non-domain-join requirement. It settles five positions in operational order.

One: consolidation precedes and gates migration. Two: the parallel run is required in production. Create the Entra login, validate it with the person's or application's real credential, disable but don't drop the legacy login, observe for 30 days with audit evidence of who still connects, then drop. Non-production can shorten the window only with documented owner sign-off, and disable-and-observe keeps every cutover reversible, so a wrong mapping locks no one out. Three: SQL authentication is eliminated. Every active SQL login moves to a managed identity or service principal, or carries a documented exception with a compensating control and a sunset date; open-ended retention isn't an option. sa is disabled and renamed on every production instance, and emergency recovery is a break-glass Windows group, empty by default and recorded in the exception registry. Four: pre-2022 instances upgrade or carry a sunset-dated exception. Five: the per-instance compliance record is the closure artifact.

The matrix makes the standard the CISO's decision. The data platform team applies it instance by instance, and an instance that can't meet it doesn't get a local decision to stay in mixed mode; it gets an exception row decided by the authorizing official. Timing is design guidance.`,
  "Book 06, Chapter 12 — What the Engine-Authentication Decision Settles (Decisions 1–5); Chapter 11 (The parallel-run migration pattern); Chapter 13 (matrix: authentication standard; four rows that need comment); Appendix B (break-glass design).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "Where it runs, and what it costs");
  tag(s, "What");
  rows(s, "Place", "WHERE THE SQL SERVER ARC RESOURCES LIVE", [
    ["Commercial Azure", "Entra authentication isn't offered for Arc SQL in US Gov Virginia"],
    ["One directory", "A commercial subscription in the GCC tenant's directory"],
    ["Public cloud path", "SQL Server needs it to use Entra authentication"],
    ["FedRAMP High", "Each leveraged Azure service is in audit scope (Sep 21, 2026 list)"],
  ], 1.88, 0.8, 0.68, 6.6);
  sideBox(s, "Cost", "FaCubes", HEX.teal, HEX.tealTint, "Licenses, not prices", [
    "Entra authentication on the engine: license-only is enough",
    "Conditional Access: Entra ID P1",
    "PIM for Groups: Entra ID P2 or ID Governance",
    "Defender for SQL: a Defender for Cloud plan",
  ], 13.5, 7.45, 5.3);
  decision(s, "Accept the leveraged cloud services the design depends on, after reviewing each package and its customer responsibilities",
    "Authorizing official", "Before production Arc onboarding");
  sources(s, "Sources: Microsoft Learn — SQL Server enabled by Azure Arc in US Government; Arc overview (feature availability); Microsoft compliance scope (Sep 21, 2026). Book 06, Ch 09, 13; App. B.");
  narrate(s,
`The SQL Server host stays inside the agency's boundary, but it now depends on leveraged cloud services: Entra ID for tokens, Microsoft Graph for looking up users, groups and applications, and Azure Arc for the agent and the SQL extension.

Placement first. SQL Server enabled by Azure Arc in the US Government Virginia region currently supports onboarding, inventory, licensing and billing, failover cluster management and ESU licenses; Microsoft Entra authentication isn't in that list. So the program assumes, as Book 05 does, a commercial Azure subscription in the same directory as the GCC tenant, and SQL Server needs access to the Azure public cloud to use Entra authentication.

Microsoft's compliance-scope page, dated September 21, 2026, lists each of these Azure public-cloud services in scope for FedRAMP High. Appendix B is careful: an audit-scope listing isn't the agency's authorization. Leveraging a provider authorization still needs the agency's own review of the package and of customer responsibilities, and the decision stays with the authorizing official.

On cost the book names licenses, not prices. Connecting to Arc, inventory, Entra authentication and Defender for Cloud are available to license-only customers; extras such as best-practices assessment need Software Assurance, a subscription or pay-as-you-go. Conditional Access needs Entra ID P1, PIM for Groups P2 or ID Governance, and Defender for SQL a paid Defender for Cloud plan.

Chapter 13 gives the leveraged services to the authorizing official. Before production onboarding is design guidance.`,
  "Book 06, Chapter 09 (What it costs and where it's available); Chapter 13 (The authorizing official); Appendix B — Security-Approval (ATO) Kit (Supports an authorization decision; FedRAMP audit scope; Licensing bill of materials).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Access is now decided in five places");
  tag(s, "Who");
  img(s, "b06-ch13-decide-and-do", 0.6, 1.5, 8.1, 3.6);
  sideBox(s, "Decider", "FaUsersGear", HEX.teal, HEX.tealTint, "One decider per row", [
    "Data leadership: verdicts, targets, closure",
    "AO: every exception",
    "CISO: the standard, privileged access",
    "App owners: their cutovers",
  ], 13, 8.85, 3.9);
  decision(s, "Fill the sponsor and project lead roles the Data Platform charter leaves open, and adopt one decider per row",
    "CIO (inference)", "Before the first login moves");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, Appendix D; Data Platform project charter, as summarized in Book 06, Chapter 13. Roles and matrix are the program's recommended model.");
  narrate(s,
`For twenty years a SQL Server estate ran on an informal model, with the DBA team owning access almost by default. In the target, one connection depends on an Entra group the identity team built, a rule the data owner approved, a managed identity whose directory permissions a Privileged Role Administrator granted, an Arc agent that infrastructure keeps healthy, a login the DBAs created, and a connection string the application team changed. If any of those owners is missing, the gap shows up as drift in the closure record, or as a help desk call nobody can resolve.

The figure is the program's model. The CIO and data leadership usually hold the system owner role: they decide verdicts, targets, upgrade-or-retire and closure. The authorizing official accepts the risks the program can't remove yet: each NTLM exception, each SQL login kept past migration, each pre-2022 instance on the interim posture, and the leveraged cloud services. The CISO sets the authentication standard, the privileged access model and the break-glass design. The ISSO assembles the evidence and runs the exception registry.

The Data Platform charter names a project sponsor and a project lead, both still to be appointed, and four domain leads: database authentication, application-tier identity, secrets lifecycle and evidence. The book doesn't say who makes the appointments; the deck's owner here is an inference. Adapt the model to the agency's governance, but keep one decider per row.`,
  "Book 06, Chapter 13 — Who Owns the Data Platform (introduction; Where the roles come from; The roles; Ownership in practice).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "DBAs run the engine; application owners own the chain");
  tag(s, "Who");
  rows(s, "Work", "WHO DOES WHICH WORK", [
    ["Data platform", "Inventory, audit, logins, parallel run, SPN repair"],
    ["App owners", "Connection strings, test sign-off, cutover windows"],
    ["Data owners", "Confirm each access rule names the right people"],
    ["Identity team", "Graph consent, groups and rules, PIM, Conditional Access"],
    ["Infrastructure", "Arc agent, SQL extension, Key Vault, certificate calendar"],
  ], 1.88, 0.66, 0.58, 6.6);
  sideBox(s, "NoLonger", "FaUserXmark", HEX.amber, HEX.amberTint, "What DBAs no longer decide", [
    "Who gets in: the Entra admin group is a privileged-access call",
    "Staying on NTLM or SQL logins: an AO exception",
    "Shortening the 30-day window: data leadership signs",
  ], 13.5, 7.45, 5.3);
  decision(s, "Confirm that each dynamic access rule describes the intended people before its group grants SQL Server access",
    "App and data owners", "Before each group grants access");
  sources(s, "Sources: Microsoft Learn — Server-level roles; Entra authentication setup tutorial; NIST SP 800-37 Rev. 2. Book 06, Chapters 13, 16 and 17.");
  narrate(s,
`So who does the work? The data platform team owns the engine and everything in it. They run the estate discovery and the audit, build the login mapping, create the Entra logins, run the parallel run and its 30-day window, and disable and later drop the legacy logins.

What they no longer own outright is who gets in. The instance's Entra administrator is granted sysadmin. The program makes that administrator a group, and its membership is a privileged access decision under the CISO's model.

Application owners decide for their applications. They know the service accounts, connection strings, linked servers and hard-coded group names, and they're the only people who can accept a test result or a cutover window. Two things are easy to miss. Data owners are a separate role even when the same person holds both: the data owner says whether a dynamic rule still describes the intended population; the identity team writes it; neither can change a grant alone. And an application owner who can't move by the program's dates doesn't decide to stay on NTLM or SQL authentication. Staying is a risk acceptance, so it goes to the authorizing official.

The matrix gives group design and dynamic rules to the application and data owners. Before each group grants access is design guidance.`,
  "Book 06, Chapter 13 (The data platform team; Application owners and their developers; matrix rows: group design and dynamic rules, observation window; Four rows need comment); Chapter 17 (rules proven before a group grants access).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "Privileged steps sit outside the DBA team on purpose");
  tag(s, "Who");
  img(s, "book-07-ch02-privileged-access", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Azure", "FaUserShield", HEX.red, HEX.redTint, "Azure roles are database controls", [
    "Directory consent needs a Privileged Role Administrator",
    "Contributor on an Arc server can run privileged extensions",
    "Contributor on the SQL resource can switch SQL logins back on",
    "Help desk reads sign-in logs; it can't reset sysadmin holders",
  ], 13.5, 7.1, 5.65);
  decision(s, "Review Azure role assignments on Arc servers and SQL Server resources with the same cadence and rigor as sysadmin",
    "CISO (privileged access model)", "From the first Arc onboarding");
  sources(s, "Sources: Microsoft Learn — Entra built-in roles; PIM for Groups; Arc identity and authorization; Disable SQL authentication; least privileged roles. Book 06, Ch 13, 17.");
  narrate(s,
`Several steps can't be done by the DBA team, and the program keeps it that way.

The identity team owns the Entra side of the engine's identity. On SQL Server 2025, the Arc server's managed identity needs three Microsoft Graph read permissions assigned to each identity; on SQL Server 2022, the app registration needs admin consent. Either way, only a Privileged Role Administrator or higher can grant them, and that role can manage every Entra role, including Global Administrator. The program keeps it with a small, named group in the identity team, eligible through PIM, never with the data platform team. Privileged SQL access lives in cloud-only, role-assignable groups activated just in time through PIM for Groups, never in a dynamic rule.

Azure role assignments around the server are now part of SQL Server security. Microsoft warns that anyone with Contributor on an Arc server resource can deploy extensions that run scripts with privilege, an indirect administrator of the server. On SQL Server 2025, Owner and Contributor on the SQL Server resource can turn SQL authentication off or back on from the portal, which is also how you recover if you lose data-plane access. In the program's model, whoever holds those roles holds a SQL Server privilege.

The CISO owns the privileged access model, so the review of those Azure assignments, on the same cadence as sysadmin, is the CISO's call. Starting at the first onboarding is design guidance.`,
  "Book 06, Chapter 13 (The identity team; Server infrastructure; The help desk; Permissions for each team); Chapter 17 (Privileged access belongs in PIM, not in a rule).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Applications are the other half of the chain");
  tag(s, "How");
  img(s, "book-08-ch01-two-axis-matrix", 0.6, 1.5, 6.5, 3.6);
  sideBox(s, "Gates", "FaRoute", HEX.amber, HEX.amberTint, "Two tracks, both must leave AD", [
    "User sign-in: OIDC first, then SAML, App Proxy, Domain Services last",
    "Database: configuration change, code change, vendor, or no path",
    "An app stuck on Domain Services holds its instance back",
    "Cutover waits for three gates: login, role, production-like test",
  ], 13.5, 7.3, 5.45);
  decision(s, "Approve each application's connection-string cutover only after its Entra login, role grant and production-like test are in place",
    "Application owners", "Per application, at its cutover");
  sources(s, "Sources: Microsoft Learn — Entra authentication with Microsoft.Data.SqlClient; ODBC, OLE DB and JDBC Entra guides; Entra Domain Services; application proxy. Book 06, Chapters 18–19.");
  narrate(s,
`SQL Server doesn't exist in isolation; web servers, APIs, reporting and ETL sit in front of it. An application that has moved its user sign-in to Entra but still reaches the database with a SQL account hasn't finished its transformation. The chain from user to application to database is one authentication path.

Each application sits on two axes. User sign-in follows the program's LDAP-dependent-application plan, accepted May 13, 2026, in strict preference order: OpenID Connect first, then SAML, then application proxy, with Entra Domain Services as the last resort, because it preserves the directory dependency rather than removing it. The database axis is set by evidence: does the deployed driver support the Entra mode, can the application get and refresh a token, does pooling still work, does the vendor support it. That places each application in configuration-only, code change, vendor-dependent, or no Entra path today. An instance serving an application stuck on Domain Services can't reach the target posture until that application moves or retires.

The connection-string change is the simplest step technically and the most gated operationally. Three gates must hold: the Entra login exists on the target, the role is granted, and the change is tested in an environment whose Arc, extension and certificate stack matches production. On an Arc host, every application allowed to request the server's token authenticates as the same identity, so that permission is privileged.

The matrix makes each cutover the application owner's decision and work.`,
  "Book 06, Chapter 18 — The Four-Class Pattern (two axes; classes 1–4); Chapter 19 — Connection String Migration (the change; Entra options by driver; the gate conditions); Chapter 13 (matrix: connection-string cutover).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "NTLM: discover, restrict, then block on 2027-04-01");
  tag(s, "How");
  img(s, "book-06-ntlm-elimination-phases", 0.6, 1.5, 7.3, 2.3);
  strip(s, "Patterns", 0.6, 3.95, 7.3, "Four patterns make NTLM:  ", "missing SPNs, unreachable domain controllers, linked-server passthrough, and unjoined or same-host clients.");
  sideBox(s, "Open", "FaTriangleExclamation", HEX.red, HEX.redTint, "The open question", [
    "The block runs in Windows; it ignores engine exceptions",
    "Instances already on Entra logins don't notice it",
    "Long tail: hold the date, or isolate with dated exceptions?",
  ], 13.5, 8.15, 4.6);
  decision(s, "Decide whether the block holds for instances without their interim posture, or they get dated exceptions with network isolation",
    "NTLM elimination program; AO per exception", "Before the Phase C block");
  sources(s, "Sources: Microsoft Windows IT Pro Blog, Disabling NTLM by default (Jan 29, 2026); KB5066470; Microsoft Learn — Restrict NTLM policies; LAN Manager level. Book 06, Chapters 13–15.");
  narrate(s,
`NTLM is a protocol, not a setting, so removing it means naming every pattern that produces it. At the SQL layer there are four: a missing or incorrect service principal name; cross-site connections where the client can't reach a domain controller for the service account's domain; linked-server passthrough, where NTLM can't make the second hop; and application hosts that are no longer domain-joined, or sit on the same host, since local connections always use NTLM.

The program applies its three phases. Phase A discovers every source. Phase B restricts: block NTLMv1 as soon as the assessment completes, which the program targeted for the third quarter of 2026; repair registrations and domain controller reachability; move linked servers to defined security contexts and unjoined hosts to managed identity; and stage the deny settings from audit. Phase C eliminates: a domain-wide block no later than April 1, 2027, after which any connection that needs NTLM fails inside Windows before the engine sees it. An instance whose logins moved to Entra generates no NTLM, so it's immune.

The long tail is unresolved. Pre-2022 instances and deferred applications rely on certificate-based sign-in as the interim posture, which needs a certificate authority that still exists. Whether the date holds for instances without that posture, or they get dated exceptions with network isolation, belongs to the NTLM elimination program, recorded as an amendment to its enforcement decision, and each exception still reaches the authorizing official.`,
  "Book 06, Chapter 14 — NTLMv1, NTLMv2 and the Patterns That Generate NTLM (four patterns); Chapter 15 — The Three Phases of NTLM Elimination (Phases A–C; Unresolved: the long tail); Chapter 13 (The authorizing official).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Certificates the AD CS retirement plan can't see");
  tag(s, "How");
  img(s, "book-10-adcs-dependencies", 0.6, 1.5, 6.6, 2.5);
  strip(s, "KeySpec", 0.6, 4.15, 6.6, "Test first:  ", "prove a CLM-renewed certificate has the key type SQL Server needs before the waves (design guidance).", HEX.amber);
  sideBox(s, "Issuer", "FaKey", HEX.navy, HEX.navyTint, "Book 07 settles the issuer", [
    "Entra connections are always encrypted: TLS matters more",
    "Cloud PKI can't issue to Windows Server",
    "SQL TLS: retained AD CS, renewed by the CLM platform",
    "DC certificates stay until the last DC retires",
  ], 13.5, 7.45, 5.3);
  decision(s, "Set no AD CS decommission date until every SQL Server certificate dependency has moved to an issuer that will remain",
    "CIO and data leadership", "Before any decommission date");
  sources(s, "Sources: Microsoft Learn — Certificate requirements for SQL Server; Cloud PKI for Intune; smart card logon with third-party CAs; NIST SP 800-53 SC-8. Book 06, Chapters 22 and 13.");
  narrate(s,
`SQL Server has certificate dependencies that most of the teams planning the AD CS retirement can't see, in three places.

The TLS certificate the engine presents. Connections authenticated by Entra ID are always encrypted, so the target makes this certificate more important, not less. Second, certificates behind certificate-mapped logins and endpoints, used for code signing and Service Broker; where AD CS issued one it has to be replaced and its modules re-signed. Third, certificate-based sign-in, the authorized interim posture for NTLM connections that can't reach Entra in time. There the dependency is usually the domain controllers' own certificates, which an enterprise CA enrolls automatically, rather than the PIV card.

Cloud PKI doesn't answer this: it issues only to Intune-enrolled devices, and Intune doesn't support Windows Server. Book 07 has since made the decision. SQL Server's TLS certificate comes from the retained AD CS hierarchy, requested and renewed through the program's certificate lifecycle platform, and moves to a standalone issuing CA under the same root when the forest retires. Domain controller certificates stay on autoenrollment until the last domain controller retires, so the interim posture keeps what it depends on. One test, design guidance: SQL Server needs a legacy key type, so prove a platform-renewed certificate has it before the renewal waves.

The matrix gives the replacement CA and the decommission date to the CIO and data leadership, with infrastructure doing the work.`,
  "Book 06, Chapter 22 — Where SQL Server Touches AD CS (TLS; certificate-mapped logins; certificate-based sign-in; Book 07 has since made the decision; Certificates and the CLM platform); Chapter 13 (matrix: replacement CA and decommission date).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Done means five conditions, proven continuously");
  tag(s, "How");
  img(s, "book-09-ch01-closure-conditions", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Evidence", "FaClipboardCheck", HEX.teal, HEX.tealTint, "Evidence, not a binder", [
    "Six live evidence sets, held over a validation period",
    "Drift is a violation: mixed mode, a new login, Arc offline",
    "Migration ends well before 2027-04-01; the last months validate",
    "The same evidence serves the agency's own authorization",
  ], 13.5, 7.1, 5.65);
  decision(s, "Declare an instance, or the estate, closed only on the ISSO's evidence, with every exception already accepted by the AO",
    "CIO and data leadership (system owner)", "Per instance; estate before 2027-04-01");
  sources(s, "Sources: Microsoft Learn — Disable SQL authentication; sys.dm_exec_connections; Conditional Access for Azure SQL; NIST SP 800-53 Rev. 5 CA-7; SP 800-37 Rev. 2. Book 06, Ch 13, 20, 21.");
  narrate(s,
`SQL Server has no setting that turns Windows authentication off, so closure is evidenced, not switched on.

An instance is closed when five conditions hold at once: no usable Windows-backed login except the empty break-glass group; SQL authentication refused, no usable SQL logins outside the exception registry, and sa disabled and renamed; Entra authentication observed working, with every login mapping to a known principal and no remote NTLM or Kerberos connections over the validation period; a cloud identity for the engine; and multifactor through Conditional Access for every human sign-in.

Six evidence sets prove it, and each is a live output of monitoring, not a binder: the per-instance compliance records, the Entra sign-in logs, NTLM telemetry, the sa status report, the Conditional Access report showing MFA for every human sign-in, and the exception registry. Drift is a compliance violation: an instance flipped back to mixed mode, a new SQL or Windows login, an Arc agent gone offline.

That reframes the date. April 1, 2027 is when the block lands, a consequence, not a completion date. Migration finishes well before it, and the final months are for validation, so the block arrives as a non-event.

The matrix puts closure sign-off with the CIO and data leadership as system owner, on the ISSO's evidence. The authorizing official is consulted because the exception registry that comes with every closure claim is a list of accepted risks, and new exceptions need acceptance first.`,
  "Book 06, Chapter 20 — The Closure Condition (five conditions; drift detection); Chapter 21 — What Done Looks Like (six evidence sets; 2027-04-01 a consequence); Chapter 13 (matrix: closure sign-off; Four rows need comment).");
}

// ------------------------------------------------------------------ How 5
{
  const s = content(S_HOW, "Risks that can still derail the schedule");
  tag(s, "How");
  cards(s, "Risk", [
    ["FaFilter", "Scope", HEX.red, HEX.redTint, ["Instances found late, at the worst moment", "Cluster instances can't take Entra logins", "Apps on Domain Services hold their instance back"]],
    ["FaUserClock", "Sequence", HEX.amber, HEX.amberTint, ["Engine work held for domain unjoin", "AD CS retired before its replacement issues", "Migration still running when the block lands"]],
    ["FaLock", "Control", HEX.navy, HEX.navyTint, ["Azure roles that can turn SQL logins back on", "One Arc identity shared by every app on a host", "No Entra auth for Arc SQL in US Gov Virginia (Oct 2026)"]],
  ], 13.5);
  decision(s, "Carry each residual risk in the exception registry with a compensating control, an owner and a sunset date",
    "ISSO runs it; AO accepts each", "From the first exception");
  sources(s, "Sources: Microsoft Learn — Entra authentication for SQL Server (failover cluster limit); Arc in US Government; Arc managed identity. Book 06, Chapters 04, 09, 11–13, 18, 21, 22.");
  narrate(s,
`These are the risks the book names, grouped three ways.

Scope. An estate that proceeds on an incomplete inventory discovers its missing instances at the worst possible moment. Failover cluster instances don't support Entra authentication on any version, so each one needs a re-platform or an exception. And an application that can only use Entra Domain Services keeps its host instance off the target posture.

Sequence. Blocking engine Entra authentication on domain unjoin is, in the book's words, the most common cause of unnecessary delay. If AD CS is retired before a replacement issuer is in place, the program loses the interim posture at exactly the moment it's needed. And a posture confirmed only on the last day before the block is a posture nobody has had time to prove.

Control. Contributor on the SQL Server resource can switch SQL authentication back on, so Azure role assignments are database controls. The Arc identity belongs to the server, so every process allowed to read it presents the same principal; one login per server is the honest unit of attribution, not one per application. And as of the book's check, Entra authentication isn't offered for Arc-connected SQL Server in the US Government Virginia region.

The book makes the exception registry the place: every NTLM, SQL-login and pre-2022 exception with its justification, compensating control and sunset date. The ISSO runs the registry and the authorizing official accepts each entry.`,
  "Book 06, Chapter 04 (The Phase 0 discovery instrument); Chapter 07 (failover cluster instances); Chapter 09 (two layers; US Government region); Chapter 11 (one login per server); Chapter 13 (Azure RBAC; ISSO; AO); Chapter 18 (Class 4); Chapter 21; Chapter 22 (sequencing).");
}

// ------------------------------------------------------------------ How 6
{
  const s = content(S_HOW, "The platform question comes after, per data domain");
  tag(s, "How");
  img(s, "book-11-three-destinations", 0.6, 1.5, 6.6, 2.6);
  strip(s, "Order", 0.6, 4.25, 6.6, "Order:  ", "audit and rationalize, move authentication on the retained set, then choose a platform per domain.");
  sideBox(s, "Frame", "FaScaleBalanced", HEX.navy, HEX.navyTint, "A framework, not a verdict", [
    "Stay on SQL Server, or move to PostgreSQL or Oracle",
    "Score ten dimensions, with evidence, per data domain",
    "Goal: fewer authoritative platforms, not one vendor",
    "Same parallel run: never drop before you observe",
  ], 13.5, 7.45, 5.3);
  decision(s, "Choose a platform per data domain only after the authentication move, as its own funded decision",
    "CIO and data leadership", "After the retained set closes");
  sources(s, "Sources: Microsoft Learn — Entra authentication for SQL Server and Azure Database for PostgreSQL; Oracle AI Database Security Guide; Managed Instance user migration. Book 06, Ch 13, 23.");
  narrate(s,
`The authentication move is forced; the platform choice isn't, so it comes afterward, one data domain at a time.

Twenty years of accretion produced overlapping instances, duplicated data domains and no single authoritative source for any subject. The goal is fewer authoritative platforms: one authoritative database per data domain, not a single vendor.

Every retained data domain ends at one of three candidate destinations: stay on SQL Server, re-platform to PostgreSQL, or re-platform to Oracle. Each can meet the forced requirement, authentication that's observable and conditionable in the identity plane, and each platform's own documentation is the authority on how. The book deliberately doesn't rank them. It scores each candidate per data domain on ten dimensions, from migration effort and identity integration to required skills and switching cost, with evidence behind each score. Two domains reaching different answers is normal.

The sequence matters. Audit and rationalize first, do the forced authentication move on the retained set, then choose the platform per domain, with the same parallel-run discipline: establish the target, validate in parallel, cut over after the window, never drop before you observe.

The charter leaves full consolidation and platform replacement out of its first phase, and Chapter 13 says re-platforming a data domain needs its own funding decision. In the program's model the CIO and data leadership make the choice per domain, with application and data owners consulted. After the retained set closes is design guidance.`,
  "Book 06, Chapter 23 — Epilogue: The Platform Question (fragmentation cost; three destinations; decision framework; decision sequence); Chapter 13 (Where the roles come from; The CIO and data leadership).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Hold the order; finish migration well before 2027-04-01", "CIO, data leadership", "Before any login moves"],
    ["A verdict for every instance, and a target for each workload", "CIO, data leadership", "Before the audit"],
    ["Upgrade or retire each pre-2022 retain instance", "CIO; AO for exceptions", "Before the block"],
    ["Onboard Arc now, on domain-joined hosts", "Server infrastructure", "After the audit"],
    ["Set the standard; review Azure roles like sysadmin", "CISO", "First cutover; onboarding"],
    ["Accept the leveraged cloud services", "Authorizing official", "Before production onboarding"],
    ["Fill the charter's open sponsor and lead roles", "CIO (inference)", "Before any login moves"],
    ["Confirm access rules; approve each cutover at its gates", "App and data owners", "Per group; per application"],
    ["Decide the long tail at the NTLM block", "NTLM program; AO", "Before Phase C"],
    ["No AD CS retirement date until SQL certificates move", "CIO, data leadership", "Before any date"],
    ["Closure only on evidence, exceptions accepted", "CIO, data leadership", "Per instance"],
    ["Every residual risk in the exception registry", "ISSO; AO", "From the first exception"],
    ["Platform per data domain, after closure", "CIO, data leadership", "After closure"],
  ];
  const colW = [6.65, 2.75, 2.75];
  const est = asks.reduce((h, r) => h + Math.max(0.29, Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, 11.5))) * lh(11.5) + 0.1), 0.32);
  fit("decision table", 1.45 + est, 5.82);
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts(colW, { y: 1.45, w: colW.reduce((a, b) => a + b, 0), fontSize: 11.5, rowH: [0.32, ...asks.map(() => 0.29)] }));
  txt(s, "Close line", [{ text: "None of this waits on a purchase.  ", options: { bold: true, color: HEX.amber } },
    { text: "Count the estate first, and finish before the block lands." }],
    { x: 0.6, y: 5.95, w: 12.15, h: 0.5, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: Book 06, Chapters 01–23 and Appendix B; owners from Chapter 13's responsibility matrix; timings marked as design guidance in the notes.");
  narrate(s,
`So, the decisions, with their owners and timing.

The CIO and data leadership hold the order, assess and consolidate, enable Arc, migrate logins, then block NTLM, and finish the migration well before April 1, 2027. They give every instance a verdict and every consolidated workload a target before the audit, upgrade or retire each pre-2022 retain instance, set no AD CS decommission date until SQL Server's certificate dependencies have moved, declare closure only on the ISSO's evidence, and later choose a platform per data domain as its own funded decision.

Server infrastructure onboards Arc now, Category 2 first, on domain-joined hosts. The CISO sets the authentication standard, SQL logins refused and sa disabled and renamed, and reviews Azure role assignments with the same rigor as sysadmin. The authorizing official accepts the leveraged cloud services and every exception. Application and data owners confirm each access rule and approve each connection-string cutover against its three gates. The NTLM elimination program decides what happens to the long tail at the block. The ISSO carries every residual risk in the exception registry. And the charter's open sponsor and lead roles need filling; who appoints them is our inference, not the book's.

None of this waits on a purchase. The first step is to count the estate. Book 06 has the detail, with every claim footnoted. Thank you.`,
  "Book 06, Chapters 01–23 (owners from Chapter 13's responsibility matrix; timings from the chapters named on each slide, otherwise design guidance); Appendix B.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: Microsoft SQL Server, Arc and Entra");
  const src = [
    "Microsoft Learn (SQL Server): Choose an authentication mode; Change server authentication mode; Register a Service Principal Name for Kerberos connections; CREATE LOGIN; sys.server_principals; sys.dm_exec_connections; Server-level roles; Certificate requirements for SQL Server; Upgrade SQL Server; SQL Server end of support options; SQL Server Audit.",
    "Microsoft Learn (Arc and Entra): Microsoft Entra authentication for SQL Server; SQL Server enabled by Azure Arc (overview, prerequisites, US Government region, deployment options); Managed identity for SQL Server enabled by Azure Arc; Entra authentication setup tutorial; Disable SQL authentication; Rotate certificates; Azure Arc-enabled servers identity and authorization.",
    "Microsoft Learn (identity and data): What is Conditional Access?; Entra ID Protection; Entra built-in roles; PIM for Groups; dynamic membership groups; Microsoft.Data.SqlClient, ODBC, OLE DB and JDBC Entra guides; Azure Migrate; Entra Domain Services; application proxy; Cloud PKI for Intune.",
    "Microsoft lifecycle: Windows Server 2016; SQL Server 2014, 2016 and 2017; Ending Support in 2027.  ·  Microsoft compliance scope page (FedRAMP High, Azure public; dated Sep 21, 2026).",
  ];
  fit("Source list 1", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 1", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: NTLM, federal policy and third parties");
  const src = [
    "NTLM: Microsoft Learn, Deprecated features for Windows client; Features removed or no longer developed in Windows Server; How to enable NTLM 2 authentication; Policy CSP LocalPoliciesSecurityOptions and NTLM.  ·  Windows IT Pro Blog, Disabling NTLM by default (Jan 29, 2026) and Retiring NTLM FAQ (Sep 9, 2026).  ·  KB5066470.",
    "Federal: OMB M-22-09 (January 26, 2022).  ·  NIST SP 800-53 Rev. 5, release 5.2.0 (AC-17, IA-2, CA-6, CA-7, SC-8).  ·  NIST SP 800-37 Rev. 2, Appendix D.  ·  FIPS 201-3.",
    "Third parties, cited as examples: dbatools Find-DbaInstance; Google Cloud SQL for SQL Server Entra integration; Silverfort NTLM case study (control category, not an endorsement); Oracle AI Database Security Guide; CyberArk Certificate Manager, Self-Hosted 26.1 CAPI driver.",
    "All accessed October 20–23, 2026. Full footnotes with links: Book 06, every chapter and Appendix B (whalermike.github.io/modernization-workbook/docs/books/b06-data-platform/).",
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
