// Book 02 — Identity & Directory: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: CIO, CISO, identity program lead and sponsors. Decision-centered: every decision slide states the
// decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B02_Identity_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b02-identity/, named in the notes. The responsibility
// matrix, the adapter model, the phase gates and the duration estimates are the book's program design and are
// labeled as such; Microsoft product statements are as checked in the book (October 20–21, 2026).
// Diagrams are the committed PNGs in docs/images/diagrams/b02-identity/png/; alt text is read from the
// chapters' fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 02", title: "Identity & Directory",
  footer: "Federal Modernization Workbook  ·  Book 02 Identity & Directory  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B02_Identity_Executive.pptx";

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
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b02-identity");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b02-identity", "png");
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
// A small tinted panel with a bold heading and a short bullet list, at a fixed place (no icon).
const panel = (s, prefix, x, y, w, h, tint, color, heading, list, size) => {
  const pt = size || 13;
  box(s, `${prefix} panel`, x, y, w, h, tint);
  T(s, `${prefix} panel text`, [{ text: heading, options: { bold: true, color, fontSize: pt + 1, breakLine: true } }, ...bullets(list, pt)],
    { x: x + 0.2, y: y + 0.1, w: w - 0.35, h: h - 0.2, fontSize: pt, paraSpaceAfter: 3 });
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  return s.addTable([head(header), ...body], tableOpts(colW, { y: 1.5, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why identity is the control plane", S_WHAT = "What changes in the move",
  S_WHO = "Who owns identity", S_HOW = "How to build, migrate and retire";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "Identity & Directory: the executive briefing", "Book 02 — Identity & Directory  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CIO, CISO, identity program lead and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 02 of the Federal Modernization Workbook, Identity and Directory. It runs about thirty minutes, for the people who make the calls: the CIO, the CISO, the identity program lead and the program's sponsors.

The argument fits in three sentences. Federal Zero Trust policy has moved the access decision from the network to the identity provider, so whatever the directory believes is what every application enforces. Active Directory isn't being retired, but Microsoft's sync, federation, protocol and source-of-authority direction all point to Entra ID, and some of the dates are already set. And the move isn't a directory upgrade: synchronizing the forest as it stands carries twenty-five years of accumulated risk into the tenant and leaves behind the governance the organizational units (OUs) carried.

I'll take four questions: why identity is now the control plane; what changes, including the hidden migration surface and delegation without OUs; who owns which decision; and how to build the target, migrate, retire Active Directory in the right order and prove it.

Two labels run through the deck, as they do through the book. The responsibility matrix, the adapter model, the phase gates and the duration estimates are program design, not federal or Microsoft requirements. And every product statement is as Microsoft documented it in October 2026.

What Book 02 accomplishes: a directory in which placement has become attributes and rules, delegation has moved to administrative units, and every service account has an owner and a target. Of the workbook's four tracks, it carries the directory side of the HR track and the service accounts on the non-person track; where people's attributes come from is Book 03, end-user devices and servers, the Intune and Arc tracks, are Book 05, and AI agents are Book 17.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 02, index; Appendix A; Chapter 01 — Why Identity Matters (The argument in brief); Chapter 06 — Who Owns the Migration (The responsibility matrix).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "The access decision has moved to identity");
  tag(s, "Why");
  figure(s, "ch01-identity-control-plane", 0.6, 6.9);
  sideBox(s, "Policy", "FaLandmark", HEX.navy, HEX.navyTint, "What federal policy requires", [
    "M-22-09: central identity, phishing-resistant MFA",
    "Log into applications, not networks",
    "SP 800-207: no trust from network location",
    "CISA: identity is the first of five pillars",
    "HR and personnel data keep the facts current",
  ]);
  takeaway(s, "FaTriangleExclamation", HEX.red, "A wrong attribute is now wrong access, everywhere.  ",
    "A stale account becomes a valid identity, usable wherever the applications are published.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; CISA Zero Trust Maturity Model 2.0, §5.1; Microsoft Learn — on-premises resources; Private Access. Book 02, Chapter 01.");
  narrate(s,
`Start with where access is decided. For most of the directory era the network made the first decision: inside the perimeter, you reached what the perimeter allowed. Federal direction has moved that decision onto identity.

M-22-09 requires centralized identity management for agency users, multifactor authentication enforced at the application layer, phishing-resistant MFA for staff, contractors and partners, and at least one device signal alongside identity. It says users should log into applications rather than networks, and directs agencies to consolidate identity systems. NIST SP 800-207 grants no implicit trust from network location, and re-evaluates each request. CISA's Zero Trust Maturity Model makes identity the first of its five pillars.

M-22-09 is explicit about the data, too: the enterprise identity system keeps the user's metadata correct when people leave or change position, drawing on HR, contract management and personnel security systems.

So in the target, the identity provider is the decision point for everything that signs in through it. A wrong attribute used to be a wrong phone-book entry. Now it's a wrong group, a wrong policy match and wrong access, enforced consistently everywhere. One caveat: resources still reached over Kerberos, NTLM or LDAP authenticate against a domain controller, so they stay outside that decision until they move or sit behind a broker such as Entra Private Access.`,
  "Book 02, Chapter 01 — Why Identity Matters (The access decision moved to identity).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "AD isn't retiring, but the dates are already set");
  tag(s, "Why");
  const signals = [
    ["Sync", "Cloud Sync is replacing Connect Sync"],
    ["Federation", "Move from AD FS to cloud authentication"],
    ["Protocols", "NTLM deprecated; NTLMv1 removed"],
    ["Authority", "Synced users convert to cloud, GA Jan 2026"],
    ["Posture", "Five states to 100% cloud; multi-year"],
  ];
  leftTable(s, ["Signal", "What Microsoft states, October 2026"],
    signals.map((r) => [bold(r[0]), { text: r[1] }]), [1.6, 5.3], [0.42, 0.52, 0.52, 0.52, 0.52, 0.52], 13);
  sideBox(s, "Clocks", "FaUserClock", HEX.amber, HEX.amberTint, "Clocks already set", [
    "Oct 2026 update: MS-CHAPv2 Wi-Fi and VPN can break",
    "Apr 7, 2027: Connect Sync upgraded, or sync stops",
    "Next major Windows: network NTLM off by default",
    "Skype, Exchange: the cloud got the features",
  ]);
  decision(s, "Put the dated platform clocks on the program plan, and set scope, funding and sequence against them",
    "Executive sponsor and CIO", "At program start");
  sources(s, "Sources: Microsoft Learn — Entra releases; Connect Sync; federation to cloud auth; deprecated Windows features; NTLM plan; road to the cloud. Book 02, Ch. 01, 03, 06, 09.");
  narrate(s,
`The usual worry is that Microsoft will retire Active Directory and force the migration. That isn't what's happening, and planning against the wrong threat leads to the wrong plan. Microsoft says it continues to support and enhance Windows Server Active Directory. The forcing comes from federal policy and from where Microsoft's identity investment is going.

The table is that direction. Cloud Sync is replacing Connect Sync, which retires once Cloud Sync reaches parity. Microsoft recommends moving from AD FS to cloud authentication, and names federation trusts as one of the two main paths from an on-premises compromise into the cloud. All versions of NTLM were deprecated in June 2024. Converting synced users to cloud-managed users became generally available in January 2026, so authority can move object by object. And Microsoft models the journey as five states ending at 100 percent cloud, a multi-year effort for large organizations.

Some dates are set. From the October 2026 security update, current Windows restricts NTLMv1-derived single sign-on credentials on devices without Credential Guard, which can break Wi-Fi, Ethernet and VPN that rely on MS-CHAPv2. Every Connect Sync server must be on 2.6.84.0 or later with application-based authentication by April 7, 2027, or synchronization stops. And Microsoft plans network NTLM off by default in the next major Windows release.

The precedent is Skype for Business Online and Exchange Server: the on-premises path narrowed, and the cleaned-up estates moved most easily. The sponsor and CIO own scope, funding and sequence, so the clocks go on their plan.`,
  "Book 02, Chapter 01 — Why Identity Matters (Why the move to Entra ID is forced); Chapter 03 (Where the old protocols stand in 2026); Chapter 09 (Connect Sync deadline: April 7, 2027); Chapter 06 (responsibility matrix: migration scope, funding and sequence).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Lift-and-shift copies the risk into the tenant");
  tag(s, "Why");
  figure(s, "ch01-two-paths", 0.6, 6.0);
  sideBox(s, "Carried", "FaTriangleExclamation", HEX.red, HEX.redTint, "What syncing as it stands carries", [
    "Delegation and Group Policy: no landing place",
    "Synced admins: an on-premises breach reaches the cloud",
    "Owners of access groups become privileged",
    "Stale accounts become cloud identities",
    "Undocumented dependencies break silently",
  ], { x: 6.85, w: 5.9 });
  decision(s, "Run the migration as a governance event: discover what the directory encodes, rebuild it explicitly in Entra ID, and prove it survived",
    "Executive sponsor and CIO", "Before the sync scope is set");
  sources(s, "Sources: Microsoft Learn — Protect Microsoft 365 from on-premises attacks; Zero Trust identities; CISA AD compromise guidance (Sept 2024). Book 02, Chapters 01, 02.");
  narrate(s,
`The tempting plan is to install a sync engine, synchronize the forest as it stands and call the identity layer migrated. The sync works. What it carries across is the problem.

Most agencies don't have a clean directory; they have twenty-five years of organic growth: regional domains never consolidated, OUs that mirror old organization charts, Group Policy layered on Group Policy, service accounts nobody remembers creating, and trusts with no current owner. CISA and its partners described Active Directory in September 2024 as the most widely used authentication and authorization system in enterprise networks, and explained how attackers use it to escalate privilege.

Synced as it stands, OU delegation and Group Policy have no landing place. A synced account holding cloud privileges lets an on-premises compromise reach the cloud; Microsoft's guidance is that privileged cloud roles use cloud-only accounts. On-premises changes to group membership or attributes change cloud access, so owners of access groups become privileged. A compromised AD FS token-signing certificate lets its holder impersonate anyone in the tenant. Stale accounts become valid cloud identities. And undocumented Kerberos, SQL Server, LDAP and certificate dependencies break silently.

The quiet risk is paying for a cloud identity platform and running it as a copy of the old directory. So the program treats the migration as a governance event, in five capabilities: discovery, normalization, mapping, continuity and validation, with governance in place before the first object moves. That framing is the sponsor's and CIO's to set, before the sync scope is.`,
  "Book 02, Chapter 01 — Why Identity Matters (What twenty-five years of Active Directory accumulated; What a lift-and-shift puts at risk); Chapter 02 — The Structural Problem (The migration is a governance event).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Placement becomes attributes: governance by rule");
  tag(s, "What");
  figure(s, "ch02-placement-vs-attributes", 0.6, 4.0);
  sideBox(s, "Limits", "FaFilter", HEX.navy, HEX.navyTint, "Two limits decide whether the mapping works", [
    "Administrative units (AUs) can't nest: the OU tree becomes a flat set",
    "An object can belong to no more than 30 AUs",
    "Dynamic AUs: documented for global Azure, not Azure Government",
    "Synced users' attributes are mastered in AD; changes wait on sync",
    "Converting authority to the cloud moves the attribute decision earlier",
  ], { x: 4.85, w: 7.9 });
  decision(s, "Settle which attributes are authoritative, what each one means and where it is mastered, before any rule is built on them",
    "HR (meaning); identity engineering (flow)", "Before AU and group mapping");
  sources(s, "Sources: Microsoft Learn — administrative units; limits; dynamic AUs; extension attributes; source-of-authority conversion. Book 02, Chapters 02, 05, 06, 09.");
  narrate(s,
`Now, what changes. In Active Directory, an object's position decides how it is governed. Group Policy links to sites, domains and OUs and inherits down the tree. Move a user to another OU and its administrators, policies and often its access change without anyone editing the user. Over twenty-five years, help desk scope, server baselines and the organization chart itself were built on that property.

Entra ID has no tree. A tenant governs objects by what they carry: attributes, memberships, roles and policy conditions. So the gap isn't a missing feature a later release will fill; it's a different idea of where governance lives. Containment becomes predicate, and every piece of governance that relied on containment has to be found and rewritten.

Two limits decide how far administrative units, the usual answer, get you. They can't nest, so the OU tree becomes a flat set, each unit with its own rule, and an object can belong to no more than thirty. Dynamic units are documented for the global Azure cloud, not Azure Government. And for synchronized users the attributes those rules match on are written in Active Directory: the cloud can't stamp them, and every change waits on a sync cycle. Converting a user's source of authority to the cloud changes that one object at a time, but it moves the attribute decision earlier rather than removing it.

The book's matrix gives HR the decision on what worker attributes mean, and identity engineering how they flow. Settle it before anything is mapped.`,
  "Book 02, Chapter 02 — The Structural Problem (Hierarchy is the governance model; Two limits decide whether the mapping works); Chapter 05 (Dynamic administrative units); Chapter 06 (The roles: HR; responsibility matrix).");
}

// ------------------------------------------------------------------ What 1b: four tracks (new)
{
  const s = content(S_WHAT, "Four tracks: what Book 02 moves, and where the rest goes");
  tag(s, "What");
  leftTable(s, ["Track", "What it covers", "Book 02's part", "Carried in"], [
    [bold("HR track: people"), "Employee and contractor accounts", "Sync, the Entra target, the groups and units that read the attributes", bold("Book 03: the attributes", HEX.teal)],
    [bold("Intune track: devices"), "Workstations, laptops, mobile", "Device objects; the computer side of the GPO analysis", bold("Book 05, Ch 03, 04, 08", HEX.teal)],
    [bold("Azure Arc track: servers"), "Member servers", "The computer side of the GPO analysis", bold("Book 05, Ch 09", HEX.teal)],
    [bold("Non-person track"), "Service accounts, MSAs, gMSAs, service principals, AI agents", "Every service account inventoried, owned and given a target", bold("Book 02, Ch 09; Book 17", HEX.teal)],
  ], [2.75, 2.9, 3.85, 2.65], [0.45, 0.8, 0.8, 0.8, 0.8], 13.5);
  takeaway(s, "FaClipboardCheck", HEX.navy, "What Book 02 accomplishes: ",
    "placement becomes attributes and rules, and every service account gets an owner and a target. Federal requirement: NIST SP 800-53 Rev. 5 AC-2, AC-3(13), AC-6; OMB M-22-09.");
  sources(s, "Sources: Book 02, Ch 02, 08, 09; App A (NIST SP 800-53 Rev. 5 AC-2, AC-3(13), AC-6; OMB M-22-09). Tracks: series framing (design guidance); Books 03, 05, 17.");
  narrate(s,
`One OU tree holds four different populations of identity, and they move by different paths, so the workbook treats them as four tracks, each with its own source of truth. The track model is program design.

People are the HR track. Book 02 builds the directory side, sync, the Entra target and the groups and administrative units that read the attributes; Book 03 decides where those attributes come from. End-user devices are the Intune track and member servers the Azure Arc track: Book 02's Group Policy analysis finds their computer-configuration settings, and Book 05 moves them. Service accounts, MSAs, gMSAs and service principals are the non-person track: Book 02, Chapter 09 gives every one an owner and a target, and Book 17 carries AI agents.

What Book 02 accomplishes, in one line: placement becomes attributes and rules, and every service account gets an owner and a target. Appendix A maps that to NIST SP 800-53 Rev. 5 account management, AC-2, attribute-based access control, AC-3(13), and least privilege, AC-6, and to M-22-09's enterprise-managed identities with phishing-resistant MFA.`,
  "Book 02, Chapters 02, 08 and 09; Appendix A (NIST SP 800-53 Rev. 5 control mapping; OMB M-22-09); series framing (four tracks, design guidance); Books 03, 05 and 17.");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Kerberos and NTLM never reach Conditional Access");
  tag(s, "What");
  figure(s, "ch03-two-worlds", 0.6, 6.9, 2.0);
  T(s, "Meaning", [
    { text: "In the program's planning model, ", options: { color: HEX.ink } },
    { text: "every remaining Kerberos or NTLM dependency is an access path with no cloud policy decision. ", options: { bold: true, color: HEX.navy } },
    { text: "Each one is found, moved to a token-based protocol, or accepted as a documented exception.", options: { color: HEX.ink } },
  ], { x: 0.6, y: 3.75, w: 6.9, h: 1.25, fontSize: 15, valign: "middle" });
  sideBox(s, "Status", "FaPlugCircleXmark", HEX.amber, HEX.amberTint, "The old protocols, October 2026", [
    "NTLM deprecated; NTLMv1 removed",
    "NTLMv2 slated for removal; NTLM auditing now",
    "Kerberos RC4 deprecated; DES removed",
    "LDAP signing required in new 2025 forests",
  ]);
  decision(s, "Audit NTLM from the start of discovery, and make every remaining Kerberos or NTLM path either a move or a documented exception",
    "Application owners; the AO for exceptions", "From discovery on");
  sources(s, "Sources: Microsoft Learn — Conditional Access overview; on-premises SSO; deprecated features; Windows Server 2025 deprecations; NTLM plan (Jan 2026). Book 02, Chapter 03.");
  narrate(s,
`Microsoft identity has moved from a directory-and-tickets world to a token-and-API world. In the old one, the domain controller is the trust root, issuing Kerberos tickets and answering LDAP. In the new one, the tenant is the trust root, issuing OAuth and OpenID Connect tokens and exposing the directory through Microsoft Graph.

The figure carries the point that matters for leadership. Conditional Access runs after first-factor sign-in to Entra ID. A Kerberos ticket or an NTLM exchange is settled between a client and a domain controller, and never reaches it. Even a cloud-native device reaching an on-premises file server gets its ticket from a domain controller. So in the program's planning model, every remaining Kerberos or NTLM dependency is an access path with no cloud policy decision, and each one is found, moved, or accepted as a documented exception.

The old protocols aren't frozen. NTLM is deprecated and NTLMv1 is gone from current Windows. NTLMv2 is slated for removal; Microsoft's January 2026 plan adds auditing now and turns network NTLM off by default in the next major release. Kerberos RC4 is deprecated and DES removed in Windows Server 2025, and new 2025 forests require LDAP signing.

An agency that waits for cutover to find its NTLM dependencies will find them in production. So auditing starts in discovery. Application owners decide for their own applications, and any path that stays is a risk the authorizing official accepts.`,
  "Book 02, Chapter 03 — Active Directory and Entra ID, Side by Side (The shift in one paragraph; What Conditional Access can and can't see; Where the old protocols stand in 2026); Chapter 06 (responsibility matrix: application sign-in migration; authorizing official).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "The hidden surface: eleven object types, not two");
  tag(s, "What");
  figure(s, "ch04-dependency-surface", 0.6, 6.9);
  sideBox(s, "Critical", "FaTriangleExclamation", HEX.red, HEX.redTint, "Three critical adapters fail silently", [
    "PKI: renewals stop weeks after “done”",
    "RADIUS and VPN: total network access failure",
    "LDAP: the largest uninventoried surface",
    "SPNs and trusts: no Entra equivalent",
    "The sync engine finishes last",
  ]);
  decision(s, "Decommission no AD infrastructure until the PKI, RADIUS and LDAP adapters pass the validation checklist (program design)",
    "Executive sponsor; ISSO and AO consulted", "Before any decommission");
  sources(s, "Sources: the program's dependency inventory and adapter priority matrix; Microsoft Learn — cross-tenant synchronization; Entra Kerberos. Book 02, Chapter 04.");
  narrate(s,
`Migration plans count users and groups. For twenty years Active Directory also held together name resolution, certificates, network access, application sign-in, time and file paths, none of them designed as AD projects. They simply assumed a domain controller would always be there.

The program's inventory names eleven object types. The first five, users, computers, service accounts, groups and Group Policy, are what plans usually cover. Six to eleven are the hidden surface: DNS and DHCP, certificate services, RADIUS, LDAP-bound applications, service principal names and trusts. When AD goes away, most of them don't fail loudly. Certificates stop renewing and nobody notices until they expire. RADIUS fails at the network edge. Applications bound over LDAP stop letting people in. Each looks like a local outage with a local cause.

Each service gets an adapter, ranked by the cost of getting it wrong. Three are critical, and all three fail silently: PKI, where the failure arrives weeks after the migration is declared complete; RADIUS, 802.1X and VPN, a total loss of network access; and the LDAP proxy, the largest uninventoried surface. Service principal names and trusts have no direct Entra counterpart, so until their adapters exist they're manual line items. The sync engine is high priority but finishes last, because it's the tether that keeps AD in production.

Retiring AD components is the sponsor's decision in the matrix. The program's rule: nothing is decommissioned until those three adapters pass the validation checklist.`,
  "Book 02, Chapter 04 — The Hidden Migration Surface (The eleven AD dependency object types; The adapter priority matrix; Gaps in the adapter registry; Post-migration validation); Chapter 06 (responsibility matrix: retire AD FS, domain controllers and AD-dependent services).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Delegation without OUs: scope by attribute");
  tag(s, "What");
  figure(s, "ch05-three-tier-delegation", 0.6, 6.9);
  sideBox(s, "AUs", "FaSitemap", HEX.teal, HEX.tealTint, "What AUs do, and don't", [
    "Avoid both traps: over- or under-delegating",
    "A write boundary, not a confidentiality one",
    "Admin groups assigned, never dynamic; PIM",
    "Restricted management: per AU, default no",
    "Restriction is set at creation, for good",
  ]);
  decision(s, "Approve the delegation model: AUs from HR attributes, assigned admin groups eligible through PIM, and restriction decided per AU",
    "Identity engineering; CISO consulted", "Before any AU is created");
  sources(s, "Sources: Microsoft Learn — administrative units; AU-scoped roles; restricted management AUs; role-assignable groups; PIM for AUs. Book 02, Chapters 05, 06.");
  narrate(s,
`In Active Directory, delegation was implicit: grant a group rights on an OU and it was done. Entra ID's directory is flat, and without a replacement organizations make one of two bad choices. They over-delegate, handing out tenant-wide roles because nothing narrower exists, which breaks least privilege and produces audit findings. Or they under-delegate, so every password reset becomes a ticket in a central queue.

Administrative units are the replacement, and the constraints matter more than the definition. They can't nest, so division inside department is a naming convention, not containment. They scope management, not visibility: administrators can still browse outside their unit, so treat a unit as a write boundary, not a confidentiality boundary. Only some roles can be scoped to one.

The program's model has three tiers: reader roles across the tenant for security, compliance and executives, which have to be tenant-scoped; department units for full lifecycle administration; and narrow division units for the help desk, created on demand. Membership comes from HR attributes. Two corrections from the book: groups that hold roles can't be dynamic, so admin groups are assigned through an approval workflow and made eligible through Privileged Identity Management; and restricted management, which shields members from tenant administrators, also takes them out of lifecycle workflows, access reviews and PIM. So it's decided per unit, default no, at creation, because it can't be changed afterward.

The delegation model is identity engineering's decision, with the CISO consulted.`,
  "Book 02, Chapter 05 — Delegation Without OUs (What administrative units are; The three-tier model; Role assignment matrix; Restricted management: a per-AU decision; Delegation principles); Chapter 06 (responsibility matrix: delegation model).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "One decider per decision, many doers");
  tag(s, "Who");
  figure(s, "ch06-decide-and-do", 0.6, 6.9);
  sideBox(s, "Rules", "FaScaleBalanced", HEX.teal, HEX.tealTint, "Rules that keep it honest", [
    "Risk acceptance reaches the AO, not the console",
    "No application moves without its owner",
    "HR decides what worker attributes mean",
    "Help desk identity checks: the CISO's call",
    "M-19-17: an agency-wide ICAM governance body",
  ]);
  decision(s, "Adopt the one-decider responsibility matrix, so every decision that amounts to accepting risk reaches the authorizing official",
    "Executive sponsor and CIO", "At program start");
  sources(s, "Sources: OMB M-19-17; NIST SP 800-37 Rev. 2 (roles); CISA BOD 25-01; Microsoft Learn — Temporary Access Pass. Book 02, Chapter 06.");
  narrate(s,
`Who owns it? In an Active Directory estate, ownership rarely had to be written down: Domain Admins could change anything, and the same small team made most of the decisions. Once identity becomes the control plane that Conditional Access, devices, applications and audit evidence depend on, those decisions belong to more people, and some carry legal accountability.

Federal policy already says so. M-19-17 directs each agency to set up an integrated, agency-wide ICAM governance structure, with the CIO, CFO, HR, General Counsel, the CISO, the senior agency official for privacy, acquisition and physical security. NIST's Risk Management Framework defines the accountable roles. Neither says who decides how to replace OU delegation, or who signs off on moving a wave to cloud authentication. That's the program's recommended model.

It separates three kinds of involvement: a role decides when it's accountable and can say no; it does the work when it builds or runs the thing; it's consulted when the decision needs its input. Every decision has exactly one decider. That matters because the AD habit is to let whoever can make a change also decide whether to make it, and that's how an engineer ends up setting the agency's risk posture by leaving legacy authentication open. The authorizing official is the only official who can accept risk on the organization's behalf.

The sponsor and CIO adopt the matrix at the start, and route every decision that amounts to accepting risk to the authorizing official.`,
  "Book 02, Chapter 06 — Who Owns the Migration (introduction; Decision rights and work are different things; The roles).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Who decides what in the migration");
  tag(s, "Who");
  const owners = [
    ["Scope, funding and sequence", "Sponsor and CIO"],
    ["Sync, sign-in method, delegation design", "Identity engineering"],
    ["Authorize tenant; accept residual risk", "Authorizing official"],
    ["Control requirements; privileged access", "CISO"],
    ["Worker attributes and their meaning", "HR"],
    ["Service accounts and sign-in, per app", "Application owner"],
    ["Pilot and wave go/no-go", "Identity engineering"],
    ["Legacy authentication cutoff", "Authorizing official"],
    ["Retire AD FS, DCs, AD-dependent services", "Sponsor and CIO"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r) => [{ text: r[0] }, bold(r[1], r[1] === "Authorizing official" ? HEX.amber : HEX.teal)]),
    [4.0, 2.9], [0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36], 12);
  sideBox(s, "Roles", "FaUsersGear", HEX.navy, HEX.navyTint, "Entra roles, least privilege", [
    "Sync: Hybrid Identity Administrator",
    "Help desk: scoped to an AU",
    "CISO, ISSO, assessors: reader roles",
    "Role assignment: a small group, eligible only",
    "Fewer than five Global Administrators",
  ]);
  decision(s, "Keep the legacy-authentication cutoff with the authorizing official: keeping legacy sign-in open is a risk acceptance",
    "Authorizing official", "Before the cutoff phase");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; Microsoft Learn — Entra built-in roles; least-privileged roles; privileged roles. Book 02, Chapters 06 and 09.");
  narrate(s,
`The book's responsibility matrix, in one view. Every row has one decider.

The sponsor and CIO decide scope, funding and sequence, and when Active Directory components retire, because retirement ends a fallback the rest of the program relies on. Identity engineering decides the sync tool and sign-in method, the delegation model, and each wave's go or no-go. The authorizing official authorizes the tenant and its interconnections, and accepts residual risk. The CISO decides the control requirements: phishing-resistant authentication, the Conditional Access baseline, the privileged-access model and logging, plus the help desk's identity-verification procedure and the access review cadence. HR decides what the authoritative worker attributes mean. And application owners decide service-account conversion and sign-in testing for their own applications.

Decision rights don't change what a console lets someone do; roles do. So each team gets its least-privileged Entra role: Hybrid Identity Administrator for sync, help desk roles scoped to administrative units, reader roles for the CISO, ISSO and assessors, and role assignment kept to a small named group, eligible only, with approval. Microsoft recommends fewer than five Global Administrators.

One row needs comment. The legacy-authentication cutoff sits with the authorizing official, because the alternative, keeping it open, is a risk acceptance. CISA's BOD 25-01 makes the same point for cloud baselines: agencies must explain any deviation from a mandatory SCuBA policy, and authorizing officials may accept that risk.`,
  "Book 02, Chapter 06 — Who Owns the Migration (The roles; The responsibility matrix and its comments; Entra roles for each team); Chapter 09 (Mapping AD privileged groups to Entra roles).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "Microsoft supplies the tools; someone owns the gaps");
  tag(s, "Who");
  figure(s, "ch06-instruments-and-orchestra", 0.6, 5.8);
  sideBox(s, "Gaps", "FaCubes", HEX.amber, HEX.amberTint, "No native tool inventories", [
    "The OU tree and its delegation",
    "Trusts, DNS and the full Group Policy estate",
    "PKI health and migration readiness",
    "One record joining it all, with drift",
    "Consume ScubaGear: BOD 25-01 reporting",
  ], { x: 6.65, w: 6.1 });
  decision(s, "Name an owner for the governance pipeline: the one correlated record of source, target and drift that no single tool keeps",
    "CISO (evidence and drift)", "Before discovery starts");
  sources(s, "Sources: Microsoft Learn — Cloud Sync, Defender for Identity, Group Policy analytics, ID Governance (Oct 20, 2026); CISA ScubaGear; BOD 25-01. Book 02, Ch. 06.");
  narrate(s,
`"Doesn't Microsoft already do this?" is the first question a sponsor asks. The book's answer: Microsoft does most of the individual pieces well and none of the connecting. Each tool solves one part of the migration and keeps its results in its own portal, report or log.

The book checked them on October 20, 2026. Cloud Sync and Connect Sync synchronize, but aren't assessment tools. Defender for Identity detects identity attacks and publishes posture findings, including certificate template misconfigurations, but exports no forest topology, OU tree, DNS assessment or trust inventory. Group Policy analytics covers the Windows MDM subset of settings. ScubaGear assesses the tenant against CISA's baselines, and BOD 25-01 requires agencies to run it and report. Entra ID Governance runs lifecycle, reviews and PIM, but doesn't decide who should have access.

So the program consumes what the native tools do well, and builds only what none of them does: the OU tree and delegation, trusts, DNS, the full Group Policy inventory, PKI health, and above all one correlated record of the source estate, the target and the drift between them. Licensing changes often, so confirm against the agency's own agreements before planning purchases.

Every native tool already has an owner in the matrix. What no tool has, unless the program assigns it, is an owner for the gaps between them: the OU tree nobody inventories, the trust nobody documented, the drift no single portal sees. The CISO owns evidence and drift, so the CISO names that owner before discovery starts.`,
  "Book 02, Chapter 06 — Who Owns the Migration (The tools; What each tool does and doesn't do; The gap analysis; What the program consumes and what it builds; Ownership in practice; responsibility matrix: continuous monitoring evidence and drift findings).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Start read-only, then ask for exactly what's missing");
  tag(s, "How");
  figure(s, "ch07-discovery-pipeline", 0.6, 2.6);
  sideBox(s, "Request", "FaKey", HEX.navy, HEX.navyTint, "The delegation request", [
    "Read only; never secrets",
    "Each line: a right, a path, a reason",
    "Time-bound to the assessment window",
    "One named, dedicated account",
    "An export beats a granted right",
  ], { x: 3.45, w: 4.55, minH: 2.7 });
  sideBox(s, "Safely", "FaShieldHalved", HEX.teal, HEX.tealTint, "Run it safely", [
    "Tell security operations first",
    "Protect the output as sensitive",
    "Hash and version every run",
    "Report only the coverage measured",
  ], { x: 8.2, w: 4.55, minH: 2.7 });
  decision(s, "Start read-only discovery now; grant elevated access only through a narrow, time-bound request built from the gap list",
    "Security review board; AD admins implement", "Week one; elevate after the gap list");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-6); Microsoft Learn — AD default permissions; Defender for Identity discovery alerts. Book 02, Chapters 07, 08.");
  narrate(s,
`Now, how. An assessment team rarely gets privileged access on day one: authorization paperwork, security review and trust all take time. The program uses that window. A standard domain account, with no rights beyond what every employee has, can read most of what the plan needs: the topology, the OU tree, groups, Group Policy links, sites and certificate templates. It changes nothing in the directory, and it applies least privilege, control AC-6, to the assessment team itself.

Exactly how much it can read depends on the forest's history, so the first step is a pre-flight that tests it, and every export records which access it relied on. Each gap is then recorded with the narrowest right or export that would close it.

The gap list becomes a short written request with fixed rules: read only, never rights that expose secrets; each line naming the right, the object path and the reason, never "Domain Admin for the assessment"; expiring with the assessment window; one named, dedicated account; and an administrator-run export wherever that can replace a granted right.

Run it safely. Tell security operations first, because broad enumeration looks like reconnaissance. Protect the output as sensitive: it's a map of the estate. Hash every file and commit it to a versioned repository, so later runs show drift. And report only the coverage actually measured; the book declines to repeat the source material's coverage percentages, because neither was a measurement.

The security review board approves the request, and the directory team implements it through its own change process.`,
  "Book 02, Chapter 07 — Read-Only Discovery (introduction; What a standard account can read; Recording what read-only discovery couldn't see; The delegation request; Running the assessment safely); Chapter 08 — Assessing the Forest.");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Build the target: Cloud Sync, PHS, no standing admin");
  tag(s, "How");
  figure(s, "ch09-sync-auth-decision", 0.6, 3.6);
  sideBox(s, "Sync", "FaArrowsRotate", HEX.navy, HEX.navyTint, "Sync and sign-in", [
    "Cloud Sync unless a Connect-only need",
    "Connect Sync: upgrade by April 7, 2027",
    "Password hash sync on in every case",
    "Pass-through is transition; AD FS retires",
  ], { x: 4.4, w: 4.1, minH: 3.4 });
  sideBox(s, "Privilege", "FaUserShield", HEX.red, HEX.redTint, "Privileged access", [
    "No standing access to privileged roles",
    "Privileged roles on cloud-only accounts",
    "Fewer than five Global Administrators",
    "Two break-glass accounts, tested every 90 days",
  ], { x: 8.65, w: 4.1, minH: 3.4 });
  decision(s, "Set the privileged-access model: cloud-only admin accounts, every privileged role eligible through PIM, two tested break-glass accounts",
    "CISO; identity engineering builds", "Before the PIM rollout");
  sources(s, "Sources: Microsoft Learn — Cloud Sync decision guide; Connect Sync hardening; choose authentication; emergency access; privileged roles. Book 02, Chapters 01, 09.");
  narrate(s,
`Building the target starts from one principle: Entra ID inverts Active Directory's model. Placement used to decide policy; now attributes decide group memberships, and memberships decide policy. That's why attribute quality gates everything after it.

Three decisions shape the build. First, the sync engine. Microsoft describes Cloud Sync as its strategic direction, and the program uses it unless a forest needs something only Connect Sync does: more than 150,000 objects in a domain, groups over 50,000 members, advanced sync rules or cross-forest references. Whatever the migration schedule says, any Connect Sync server must be upgraded and switched to application-based authentication by April 7, 2027. Identity engineering decides this, with the CISO and application owners consulted.

Second, sign-in. Password hash sync stays on in every case: it's the fallback if other methods fail, it's required for leaked-credential detection, and Microsoft says organizations that had it recovered from ransomware outages in hours rather than weeks. Pass-through authentication is transitional, and AD FS is a decommission target.

Third, privileged access, which is the CISO's. No standing access to privileged roles: every assignment is eligible and activated just in time, except two emergency accounts. Privileged cloud roles sit on cloud-only accounts, never synced ones. Microsoft recommends fewer than five Global Administrators. And the two break-glass accounts use phishing-resistant methods and are tested at least every 90 days. The CISO sets this model before the PIM rollout, and identity engineering builds it.`,
  "Book 02, Chapter 09 — Building the Entra ID Target (Design principle: placement versus attributes; Cloud Sync or Connect Sync; Connect Sync deadline; Choosing the sign-in method; Privileged access; Emergency access accounts); Chapter 01 (privileged accounts on cloud-only identities); Chapter 06 (responsibility matrix).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Phishing-resistant sign-in: PIV first, not last");
  tag(s, "How");
  const plan = [
    ["1", "Privileged accounts", "FIDO2 keys; PIV through CBA", "4–6"],
    ["2", "PIV and CAC holders", "Certificate-based auth", "8–12"],
    ["3", "Managed Windows devices", "Windows Hello for Business", "8–12"],
    ["4", "Everyone else, incl. mobile", "Passkeys in Authenticator", "8–12"],
  ];
  leftTable(s, ["Phase", "Population", "Method", "Weeks"],
    plan.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }, { text: r[3] }]), [0.8, 2.45, 2.75, 0.9], [0.42, 0.52, 0.52, 0.52, 0.52], 12.5);
  T(s, "Parallel", [{ text: "Phases 2 to 4 run in parallel after phase 1: ", options: { bold: true, color: HEX.navy } },
    { text: "12 to 18 weeks end to end (program estimate)." }], { x: 0.6, y: 4.2, w: 6.9, h: 0.75, fontSize: 14, valign: "middle" });
  sideBox(s, "Rules", "FaIdCard", HEX.navy, HEX.navyTint, "What the rules settle", [
    "M-22-09's targets fell due at the end of FY2024",
    "SMS and voice off for staff",
    "PIV and FIDO2 keys count as a separate device",
    "Windows Hello: not for privileged accounts",
  ]);
  decision(s, "Require phishing-resistant MFA for all staff, administrators first, and PIV through certificate-based authentication for card holders",
    "CISO", "Before Phase 7; admins first");
  sources(s, "Sources: OMB M-22-09; M-19-17; NIST SP 800-53 Rev. 5 IA-2 (FedRAMP release 5.2.0); Microsoft Learn — CBA; passkeys; authentication strengths. Book 02, Chapter 10.");
  narrate(s,
`Sign-in is where users feel the migration. M-22-09 requires phishing-resistant MFA for staff, contractors and partners, and says agencies must stop supporting methods that fail to resist phishing, such as SMS, voice, one-time codes and push notifications, for routine access. It names PIV as the simplest route, allows FIDO2 where PIV isn't practical, and its targets fell due at the end of fiscal 2024. So these are requirements to meet now, not goals to plan toward.

That changes the order. The earlier roadmap saved smart cards for last. For a workforce that already carries PIV or CAC cards, Entra certificate-based authentication is the fastest path, because the credential is already issued, and it works without a federation server.

The roadmap has four phases. Privileged accounts first, on FIDO2 keys and PIV, so administrators are protected before anyone else. Then card holders through certificate-based authentication, Windows Hello for Business on managed devices, and passkeys in Authenticator for everyone else. Phases two to four reach different populations and run in parallel, so the program estimates twelve to eighteen weeks end to end.

One control detail matters for the authorization package. IA-2(6) asks for a factor on a device separate from the one gaining access. PIV cards and FIDO2 keys count; Windows Hello's key lives in the device itself, so the program doesn't count it for privileged accounts.

The CISO sets this requirement, administrators first.`,
  "Book 02, Chapter 10 — Migrating and Governing (The phishing-resistant authentication roadmap; Authentication methods policy; The compliance amendment: IA-2(6)); Chapter 06 (responsibility matrix: control requirements).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Eleven phases in five waves, each one gated");
  tag(s, "How");
  figure(s, "ch10-migration-waves", 0.6, 12.15, 2.1);
  panel(s, "Gates", 0.6, 3.75, 5.95, 1.35, HEX.tealTint, HEX.teal, "Go/no-go gates in the playbook", [
    "MFA registration above 95% before enforcing",
    "Help desk volume back to baseline within a week",
    "Every privileged account on FIDO2 or PIV",
  ]);
  panel(s, "Estimates", 6.8, 3.75, 5.95, 1.35, HEX.amberTint, HEX.amber, "Program estimates, not measurements", [
    "43 to 68 weeks across the eleven phases",
    "Policies run report-only for 2 to 4 weeks first",
    "No all-users policy goes straight from off to on",
  ]);
  decision(s, "Approve each wave on its gate: registration rates, help desk volume and sign-in failures, with rollback ready",
    "Identity engineering; sponsor and CISO consulted", "Before each wave");
  sources(s, "Sources: Microsoft Learn — Conditional Access deployment; staged rollout; federation migration. Book 02, Chapters 09, 10. Durations are program planning estimates.");
  narrate(s,
`The migration runs as an eleven-phase playbook in five waves. Foundation: assess, deploy sync with password hash sync on, and put Conditional Access in report-only. Objects: groups, then service accounts. Privilege and policy: PIM, then Conditional Access enforced in waves. Authentication: phishing-resistant methods, the legacy cutoff, and AD FS out. Then steady-state governance.

Each phase has prerequisites, steps, validation criteria, a rollback procedure and a duration, and a phase's criteria must be met before the next begins. The durations are the program's planning estimates, not measured results, and they add up to 43 to 68 weeks.

The gates are what leadership sees. Conditional Access isn't enforced on a population until MFA registration is above 95 percent, and each enforcement wave has to bring help desk volume back to baseline within a week. Phishing-resistant authentication isn't done until every privileged account is on a FIDO2 key or PIV, and more than 70 percent of all users are on a phishing-resistant method, with the rest on a dated plan. The legacy cutoff needs thirty days of zero legacy sign-ins. And AD FS stays recoverable for ninety days after it's decommissioned.

One rule is absolute: never switch a policy that targets all users straight from off to on, because a misconfigured one can lock out the whole organization, administrators included.

Identity engineering decides each wave's go or no-go, with the sponsor and CISO consulted, and treats registration rates and help desk tickets as the inputs.`,
  "Book 02, Chapter 10 — Migrating and Governing (The migration execution playbook, Phases 0–10); Chapter 09 (Testing and rollout; Never enforce untested policies on all users); Chapter 06 (responsibility matrix: pilot and wave go/no-go; End users).");
}

// ------------------------------------------------------------------ How 5
{
  const s = content(S_HOW, "Retire Active Directory last, on six conditions");
  tag(s, "How");
  rows(s, "Criteria", "THE SYNC ENGINE RETIRES WHEN ALL SIX ARE TRUE", [
    ["Users", "Provisioned from HR or the designated source"],
    ["Groups", "Dynamic or managed in Entra ID"],
    ["Apps", "None use on-premises AD authentication"],
    ["Devices", "Managed by Intune, no AD dependency"],
    ["Services", "Every service account a workload identity"],
    ["Network", "PKI, DNS, RADIUS and LDAP moved and validated"],
  ], 1.88, 0.53, 0.46);
  figure(s, "ch04-adapter-sequence", 7.0, 5.75, 3.4, 1.6);
  decision(s, "Retire each AD component only after its validation gate: AD FS after the cloud cutover, the sync engine last, then the forest",
    "Executive sponsor; ISSO and AO consulted", "After each gate passes");
  sources(s, "Sources: the program's adapter specification (retirement criteria); Microsoft Learn — Cloud Sync; group and user source of authority. Book 02, Chapters 04, 06, 10.");
  narrate(s,
`The last decision in the sequence is when Active Directory goes. The sync engine is both the bridge to Entra ID and the tether that keeps AD alive: as long as it runs, AD is a production dependency. So the program retires it last, after every other adapter has moved, and only when six conditions are all true.

Every user is provisioned from the authoritative source for its population: employees from HR, contractors from the source the agency designates, guests through invitation. Every group is dynamic or managed in Entra ID. No application uses on-premises AD authentication. Every device is managed by Intune with no AD dependency. Every service account is an Entra workload identity. And certificates, DNS, RADIUS and LDAP applications are migrated and validated.

Two Microsoft facts make that workable. Source of authority can now move object by object, for users and for groups, and it can be reversed, so the conditions can be met incrementally rather than in one cutover. But provisioning back to AD is asymmetric: Cloud Sync can provision groups to AD, but no client provisions users from the cloud to AD. An application that still needs an AD user account keeps AD alive.

In the matrix, retiring AD FS, domain controllers and AD-dependent services is the sponsor's decision, because it ends a fallback everyone relies on, with the ISSO and authorizing official consulted because it changes the authorization boundary. The sponsor makes it one gate at a time.`,
  "Book 02, Chapter 04 — The Hidden Migration Surface (Sync engine: retirement criteria; Post-migration validation); Chapter 06 (The responsibility matrix: retire AD components); Chapter 10 (Phase 9: Federation decommission).");
}

// ------------------------------------------------------------------ How 6
{
  const s = content(S_HOW, "Evidence that comes out of operations");
  tag(s, "How");
  figure(s, "ch11-evidence-bundle", 0.6, 6.4);
  sideBox(s, "Bundle", "FaFileShield", HEX.teal, HEX.tealTint, "Who receives it, and the rules", [
    "The agency's assessor and AO, not a 3PAO",
    "M-26-14: logs that show who did what",
    "BOD 25-01: SCuBA baselines, assessed",
    "FedRAMP 20x indicators map the controls",
    "The record belongs to the agency",
  ], { x: 7.25, w: 5.5 });
  decision(s, "Make the evidence bundle and its registry agency-owned deliverables, produced from every phase rather than assembled afterward",
    "CISO; the ISSO assembles", "From the first readiness bundle");
  sources(s, "Sources: OMB M-26-14; CISA BOD 25-01; NIST SP 800-37 Rev. 2; FedRAMP 20x KSI pages. Book 02, Chapters 10, 11. The reference deployment is a framing pattern.");
  narrate(s,
`Everything ends in evidence. Chapter 11 puts the How chapters together on a reference deployment: about fifty thousand users in two forests joined by an undocumented trust, about ninety SQL Server instances, and a GCC destination. It's a framing pattern, not a real engagement; the counts are illustrative.

It runs in five phases, discover, normalize, map, migrate and validate, and each ends in a signed readiness bundle that is the next phase's only entry condition. That gating is program design, and it's what makes the evidence bundle possible: the readiness bundles, the before-and-after service principal inventories, the provenance chain, every drift finding with its remediation, and the GCC compensating controls with when each was last verified.

The rules around it are federal. M-26-14 requires logs that show the identity used for each operation and changes to privilege, searchable for six months. BOD 25-01 requires the SCuBA baselines, assessed with CISA's tools. And the book maps the identity controls to FedRAMP 20x's Key Security Indicators. One correction it makes: the bundle goes to the agency's own security control assessor and authorizing official, under the Risk Management Framework; third-party assessors assess cloud providers.

The difference from the usual authorization is timing. The bundle comes out of operations as they happen, so the authorizing official sees current state. And the registry, the drift findings and the bundle belong to the agency, so the next engagement starts from them. The CISO owns that evidence, and the ISSO assembles it.`,
  "Book 02, Chapter 11 — Reference Deployment (A framing pattern; The archetype; The evidence bundle the assessor consumes; What survives the engagement); Chapter 10 (Compliance Manager and the FedRAMP 20x indicators); Chapter 06 (responsibility matrix: continuous monitoring evidence).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Plan against the platform clocks; set scope and sequence", "Sponsor and CIO", "Program start"],
    ["Run the migration as a governance event, not a sync", "Sponsor and CIO", "Before sync scope"],
    ["Settle which attributes are authoritative, and their meaning", "HR; identity engineering", "Before mapping"],
    ["Audit NTLM; move or document every Kerberos and NTLM path", "App owners; the AO", "From discovery"],
    ["Decommission nothing before PKI, RADIUS and LDAP validate", "Executive sponsor", "Before decommission"],
    ["Approve the AU delegation model, restriction decided per AU", "Identity engineering", "Before any AU"],
    ["Adopt the one-decider responsibility matrix", "Sponsor and CIO", "Program start"],
    ["Keep the legacy-authentication cutoff with the AO", "Authorizing official", "Before the cutoff"],
    ["Name an owner for the governance pipeline", "CISO", "Before discovery"],
    ["Start read-only; elevate only through a narrow request", "Review board; AD admins", "Week one"],
    ["Cloud-only admins, eligible roles, two break-glass accounts", "CISO", "Before PIM rollout"],
    ["Phishing-resistant MFA for all staff, admins first", "CISO", "Before Phase 7"],
    ["Approve each wave on its gate", "Identity engineering", "Before each wave"],
    ["Retire AD components only after their gates; sync last", "Executive sponsor", "After each gate"],
    ["Make the evidence bundle an agency-owned deliverable", "CISO; the ISSO", "First readiness bundle"],
  ];
  const fs11 = 11, rh = [0.32, ...asks.map(() => 0.28)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.6, 3.2, 2.35][j] - 0.2;
    if (linesFor(c.length, w, fs11) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.6, 3.2, 2.35], { y: 1.4, w: 12.15, fontSize: fs11, rowH: rh, margin: [0.02, 0.1, 0.02, 0.1] }));
  T(s, "Close line", [{ text: "This isn't a directory upgrade.  ", options: { bold: true, color: HEX.amber } },
    { text: "Discover what Active Directory encodes, rebuild it explicitly in Entra ID, and prove it survived." }],
    { x: 0.6, y: 6.05, w: 12.15, h: 0.52, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: OMB M-22-09; M-19-17; NIST SP 800-37 Rev. 2; CISA BOD 25-01; Microsoft Learn, Oct 2026. Book 02, Chapters 01–11. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The sponsor and CIO set scope, funding and sequence against the platform clocks, run the migration as a governance event rather than a sync, and adopt the one-decider matrix, all at the start.

HR settles what the authoritative attributes mean, and identity engineering how they flow, before anything is mapped. Application owners audit and move their Kerberos and NTLM paths from discovery on, and anything that stays is an exception the authorizing official accepts.

The executive sponsor decommissions nothing before the PKI, RADIUS and LDAP adapters validate, and retires each AD component only after its gate, with the sync engine last.

Identity engineering approves the delegation model before any administrative unit exists, and decides each wave on its gate. The authorizing official keeps the legacy-authentication cutoff.

The CISO names an owner for the governance pipeline before discovery, sets the privileged-access model before the PIM rollout, requires phishing-resistant MFA for all staff, administrators first, and owns the evidence bundle the ISSO assembles from the first readiness bundle on.

And the security review board starts read-only discovery in week one, granting elevated access only through a narrow, time-bound request.

None of this is a directory upgrade. Discover what Active Directory encodes, rebuild it explicitly in Entra ID, and prove it survived. Book 02 has the detail, with every claim footnoted. Thank you.`,
  "Book 02, Chapter 01 (The argument in brief); Chapter 06 — Who Owns the Migration (The responsibility matrix); Chapters 04, 05, 07, 09, 10 and 11 (the decisions on each slide).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal policy, NIST and CISA");
  const src = [
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (January 26, 2022).  ·  OMB M-19-17, Enabling Mission Delivery through Improved Identity, Credential, and Access Management.  ·  OMB M-26-14 (rescinding M-21-31), event logging.",
    "NIST SP 800-207, Zero Trust Architecture (August 2020).  ·  NIST SP 800-37 Rev. 2, Risk Management Framework, roles and ongoing authorization.  ·  NIST SP 800-53 Rev. 5 (AC-2, AC-6, AC-6(7), IA-2, IA-2(6), IA-5), as published in FedRAMP's catalog, release 5.2.0.",
    "CISA, Zero Trust Maturity Model, Version 2.0 (April 2023), §5.1 Identity.  ·  CISA and partners, Detecting and Mitigating Active Directory Compromises (September 2024).  ·  CISA BOD 25-01, Implementing Secure Practices for Cloud Services; ScubaGear.",
    "FedRAMP 20x and the Consolidated Rules for 2026: Key Security Indicators KSI-IAM-AAM, -ELP, -JIT, -APM, -SNU; KSI-MLA-LET, -RVL.  ·  Foundations for Evidence-Based Policymaking Act of 2018, Title II.",
    "Full footnotes with links and access dates (October 20–21, 2026): Book 02, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b02-identity/).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: Microsoft identity platform, October 2026");
  const src = [
    "Microsoft Learn, Entra releases and announcements (Connect Sync to Cloud Sync, April 2026; user source-of-authority conversion GA, January 2026); group and user source of authority; Cloud Sync decision guide, comparison and FAQ; Connect Sync hardening and version history (April 7, 2027).",
    "Microsoft Learn, migrate from federation to cloud authentication; choose the right authentication method; staged rollout; protect Microsoft 365 from on-premises attacks; road to the cloud posture; new name for Azure AD (on-premises support).",
    "Microsoft Learn, deprecated features for Windows client and Windows Server 2025; NTLM plan (January 2026); NTLMv1 October 2026 update; LDAP signing and channel binding; Conditional Access overview and conditions; on-premises SSO for cloud-native devices; Entra Private Access for domain controllers; Entra Kerberos.",
    "Microsoft Learn, administrative units, dynamic and restricted management AUs, AU-scoped roles; role-assignable groups; PIM; emergency access accounts; privileged roles; certificate-based authentication; passkeys; authentication strengths; Temporary Access Pass.",
    "Microsoft Learn, Defender for Identity posture assessments; Group Policy analytics; Entra ID Governance licensing and GCC availability; Purview Audit; Sentinel; Zero Trust Assessment.  ·  CISA ScubaGear.",
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
