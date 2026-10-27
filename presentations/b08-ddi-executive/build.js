// Book 08 — DNS, DHCP & IPAM: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the CISO, the network and infrastructure lead, and the program's sponsors. Decision-centered:
// every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B08_DDI_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b08-ddi/, named in the notes. Decision owners come from
// the book's responsibility matrix (Chapter 09), which the book labels the program's recommended model; timings
// the book doesn't date are labeled design guidance. Product and authorization statements are dated observations
// (October 20, 2026). Diagrams are the committed PNGs in docs/images/diagrams/b08-ddi/png/; alt text is read from
// the chapters' fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 08", title: "DNS, DHCP & IPAM",
  footer: "Federal Modernization Workbook  ·  Book 08 DNS, DHCP & IPAM  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B08_DDI_Executive.pptx";

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
// Slide titles stay at or under 58 characters and are unique; each narrated title must match narration.json.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t)) throw new Error(`duplicate slide title: ${t}`);
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
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- diagrams
// The committed PNG, scaled to fit (maxW x maxH), centered in its area; alt text from the chapter's fig-alt.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b08-ddi");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b08-ddi", "png");
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
// A labeled list of tinted rows (default: down the left half of the slide).
const rows = (s, prefix, label, list, top, step, h, o = {}) => {
  const x = o.x || 0.6, w = o.w || 6.2, lead = o.lead || "   ";
  txt(s, `${prefix} head`, label, { x, y: o.headY || 1.5, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, x, y, w, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}${lead}`, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: x + 0.2, y, w: w - 0.3, h, fontSize: o.size || 13.5, valign: "middle" });
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
// A compact tinted panel (a one-line heading, then bullets) for the space under a wide diagram.
const panel = (s, prefix, color, tint, heading, list, o) => {
  const { x, y, w } = o; const size = o.size || 13;
  const listNeed = needFor(parasOf(bullets(list, size), size), w - 0.4, 4);
  const h = Math.max(o.minH || 0, Math.round((0.52 + listNeed + 0.12) * 100) / 100);
  if (y + h > 5.12) console.warn(`  ! slide ${pres.slides.length} ${prefix} panel runs past the decision bar (bottom ${(y + h).toFixed(2)} in)`);
  box(s, `${prefix} box`, x, y, w, h, tint);
  T(s, `${prefix} head`, heading, { x: x + 0.2, y: y + 0.1, w: w - 0.4, h: 0.36, bold: true, color, fontSize: 15, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size), { x: x + 0.2, y: y + 0.5, w: w - 0.4, h: listNeed + 0.06, paraSpaceAfter: 4 });
  return h;
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize, y) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const top = y || 1.5;
  const bottom = top + rowH.reduce((a, b) => a + b, 0);
  if (bottom > 5.12) console.warn(`  ! slide ${pres.slides.length} table runs past the decision bar (bottom ${bottom.toFixed(2)} in)`);
  return s.addTable([head(header), ...body], tableOpts(colW, { y: top, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why DNS is the control plane", S_WHAT = "What has to change",
  S_WHO = "Who owns DNS, DHCP and IPAM", S_HOW = "How to migrate and run it";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "DNS, DHCP & IPAM: the executive briefing", "Book 08 — DNS, DHCP & IPAM  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CIO, the CISO, the network and infrastructure lead, and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 08 of the Federal Modernization Workbook: DNS, DHCP and IP address management, which the book calls DDI. It runs about thirty minutes, for the people who make the calls: the CIO, the CISO, the network and infrastructure lead, and the program's sponsors.

The argument fits in three sentences. Almost every connection starts with a DNS query, and in a hybrid multi-cloud agency the answer now decides far more than an address: the private path, the SaaS front door, the security block, the certificate check. Most agencies still run it as a utility, spread across several platforms that share no state, so the same name gives different answers depending on where the query starts, and the failures show up as certificate errors and access denials, not DNS errors. The fix is structural: one authoritative DDI policy plane, with named owners.

I'll take four questions: why DNS is now the control plane, and what federal policy requires of it; what has to change, from leaving Active Directory DNS to treating IPAM as the address record; who owns it; and how to migrate and run it, sequenced against Active Directory retirement.

Two labels run through the deck, as they do through the book. The ownership model, the gates and the planning estimates are the program's design, not federal requirements. And product and authorization statements are dated observations, as of October 20, 2026.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 08, index (The canonical sequence; Reading paths); Chapter 01 — DNS Is Now the Control Plane (Why DNS is now the control plane; The case in one paragraph).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "DNS now decides far more than an address");
  tag(s, "Why");
  figure(s, "ch01-three-perspectives", 0.6, 6.9);
  sideBox(s, "Jobs", "FaGlobe", HEX.navy, HEX.navyTint, "Six jobs DNS now does", [
    "Publishes private cloud endpoints",
    "Picks the SaaS front door a user reaches",
    "Blocks known-malicious domains",
    "Anchors certificate revocation checks",
    "Names the service a policy evaluates",
    "Defines the application surface",
  ]);
  takeaway(s, "FaShieldHalved", HEX.red, "Govern DNS as a control plane, not a utility.  ",
    "NIST's 2026 DNS guide calls DNS infrastructure a security control in its own right, not only a service.");
  sources(s, "Sources: OMB M-08-23; NIST SP 800-81r3, Executive Summary and §1.2 (March 2026); OMB M-22-09; CISA ZTMM v2.0; Microsoft Learn. Book 08, Chapter 01.");
  narrate(s,
`Start with what DNS was built for: let people use names instead of numbers, in a world where every device had one address and inside and outside were separated by a wire. That world has gone.

In a hybrid multi-cloud agency DNS now does six jobs its designers didn't anticipate. It publishes private addresses: an Azure storage account with a private endpoint resolves to a private address inside the network that hosts it and to the public endpoint from everywhere else. It picks the SaaS front door. It enforces security policy, blocking malicious domains before a connection is made. It anchors certificate validation, because revocation responders are DNS names. It's the stable service identity a Zero Trust policy is written against. And a wildcard name defines a whole namespace of applications.

NIST's March 2026 deployment guide says it plainly: DNS infrastructure has become more than a service; it is also a security control.

The figure shows the three perspectives one policy plane has to cover: enterprise internal DNS, the cloud DNS services, and the external zones the agency publishes. IPAM and DHCP sit under all three as the address layer of the asset inventory that M-22-09 and CISA's Zero Trust Maturity Model expect agencies to keep.

So the first point for this room: governing DNS is a security and architecture responsibility, not an IT operations chore.`,
  "Book 08, Chapter 01 — DNS Is Now the Control Plane (What DNS was designed to do; What DNS has become; Three DNS perspectives under one control plane; Hybrid cloud IPAM and DHCP).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Several platforms, no shared state: split-brain");
  tag(s, "Why");
  figure(s, "ch02-split-brain", 0.6, 6.9, 1.95, 1.45);
  panel(s, "Process", HEX.navy, HEX.grey, "Why runbooks can't fix it", [
    "The failure is silent: the name still resolves",
    "The change rate outruns manual sync",
    "Each platform has its own API and timing",
  ], { x: 0.6, y: 3.55, w: 6.9 });
  sideBox(s, "Cost", "FaTriangleExclamation", HEX.red, HEX.redTint, "What it costs", [
    "Posture is the weakest resolver's",
    "Shows up as certificate errors and denials",
    "Hard to evidence one policy to an assessor",
    "Forwarding rules often belong to no team",
  ]);
  decision(s, "Authorize one authoritative DDI policy plane for DNS, DHCP and IPAM across on-premises, every cloud and VMware",
    "Sponsor and CIO", "Before the next migration wave");
  sources(s, "Sources: Microsoft Learn (Azure private endpoints, DNS resolver policy); AWS Route 53; Google Cloud DNS; NIST SP 800-81r3. Book 08, Chapters 01, 02 and 12.");
  narrate(s,
`Agencies don't choose to run DNS in five places. Each cloud ships its own DNS service, because DNS is the connective tissue of everything else the platform does: Active Directory DNS or an on-premises grid, Route 53, Azure DNS, Google Cloud DNS and VMware NSX. None shares state with the others.

The result is split-brain: the same name returning different answers depending on where the query starts. Intentional split-horizon, designed and documented, is fine. The unintentional kind is drift. A forwarding rule in one cloud goes stale, and a workload there gets the public address instead of the private one.

The chapter's point is that process can't fix it. The failure is silent, because the name still resolves. The change rate across dozens of teams outruns any manual sync. And each platform has its own API, timing and consistency model.

It costs three ways. Security policy applies only at the resolver that answers, so the effective posture is the weakest resolver a client can reach. Failures surface as certificate errors and access denials, not DNS errors. And the forwarding rules that cross the boundaries usually belong to none of the teams.

So the first decision belongs to the sponsor and CIO, who own platform scope in the book's matrix: authorize one authoritative DDI policy plane, and do it before the next migration wave, because every new cloud adds another independent DNS system.`,
  "Book 08, Chapter 01 (The fragmented landscape; The management burden of independence); Chapter 02 — Split-Brain DNS (What split-brain DNS is; Security policy split-brain; Why process discipline can't fix a structural problem); Chapter 12 (Why decide now); Chapter 09 (responsibility matrix: platform selection).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Encrypted and Protective DNS are requirements");
  tag(s, "Why");
  figure(s, "ch03-federal-drivers", 0.6, 3.0, 3.62, 1.47);
  sideBox(s, "Require", "FaLandmark", HEX.navy, HEX.navyTint, "What M-22-09 and CISA require", [
    "Encrypted DNS wherever technically supported",
    "Endpoints use agency-designated resolvers",
    "Protective DNS for all egress resolution",
    "Unauthorized DNS blocked, encrypted or not",
  ], { x: 3.8, w: 4.4 });
  sideBox(s, "Bypass", "FaRoute", HEX.red, HEX.redTint, "Where it breaks on the wire", [
    "Port 853 transports can be blocked",
    "DNS over HTTPS only at the endpoint",
    "Some servers can't encrypt upstream",
    "CISA: IPsec isn't a substitute",
  ], { x: 8.35, w: 4.4 });
  decision(s, "Designate the agency's encrypted resolvers and allowed transports, with Protective DNS upstream; an exception with no end date goes to the AO",
    "CISO; the AO for standing exceptions", "Now: the M-22-09 FY24 target has passed");
  sources(s, "Sources: OMB M-22-09 (Encrypting DNS traffic); CISA Protective DNS Resolver; CISA Encrypted DNS Implementation Guidance (May 16, 2024); NIST SP 800-81r3. Book 08, Chapters 03, 05, 09.");
  narrate(s,
`Now the federal requirements, quoted rather than strengthened. M-22-09 says agencies must resolve DNS queries using encrypted DNS wherever it is technically supported; that agency resolvers support DNS over HTTPS or over TLS and use them upstream; and that agencies should configure endpoints to use agency-designated encrypted DNS servers, not ones found by automatic discovery. Agencies were to plan for enterprise-wide support by FY24.

CISA's Protective DNS resolver, launched in 2022, filters queries upstream of agency networks, and civilian agencies are required to use it for all egress resolution. CISA's May 2024 guidance reconciles the two: encrypt, but terminate at agency resolvers, keep Protective DNS upstream, and block unauthorized DNS traffic, encrypted or not.

Chapter 05 shows where this breaks on the wire. DNS over TLS and over QUIC use a dedicated port and can be blocked except to approved resolvers. DNS over HTTPS shares a port with all web traffic, so it can only be governed at the endpoint, through operating-system and browser policy. A Windows DNS server can now accept encrypted queries from clients but still forwards upstream in plain text, so a capable resolver or an encrypting proxy is needed; CISA says IPsec isn't an acceptable substitute.

The book's matrix gives the policy to the CISO: which resolvers are designated and which transports are allowed. An exception with no end date, or past the agency's limit, goes to the authorizing official.`,
  "Book 08, Chapter 03 — Federal Requirements (What the mandates say: M-22-09, CISA Protective DNS, CISA Encrypted DNS Implementation Guidance); Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP (Encrypted DNS and bypass controls); Chapter 09 (responsibility matrix: encrypted DNS policy and exceptions).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = content(S_WHY, "Logging, DNSSEC and IPv6 complete the floor");
  tag(s, "Why");
  const docs = [
    ["OMB M-26-14", "May 22, 2026", "Logs searchable 6 months, kept a year"],
    ["CISA LRA", "Aug 20, 2026", "Logging plan due Nov 18, 2026*"],
    ["OMB M-08-23", "Aug 22, 2008", "DNSSEC on applicable systems"],
    ["OMB M-21-07", "Nov 19, 2020", "80% IPv6-only by FY2025: passed"],
    ["TIC 3.0, v3.3", "Sep 2026", "Five DNS enforcement capabilities"],
    ["SP 800-81r3", "Mar 2026", "Guidance, not a mandate"],
  ];
  leftTable(s, ["Instrument", "Date", "What it asks of the name layer"],
    docs.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.65, 1.45, 3.75], [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  sideBox(s, "Log", "FaListCheck", HEX.teal, HEX.tealTint, "M-26-14 names no DNS log", [
    "It rescinded M-21-31 and its DNS tiers",
    "Sources are set in the agency's logging plan",
    "Query and lease logs attribute a device",
    "Levels 1–3 within 120, 180 and 320 days",
  ]);
  decision(s, "Name the DNS query logs and DHCP lease logs as sources in the agency's logging plan, at M-26-14 retention",
    "CISO", "By Nov 18, 2026 (computed from CISA's date)");
  sources(s, "Sources: OMB M-26-14 (May 22, 2026); CISA Logging Reference Architecture (Aug 20, 2026); OMB M-08-23; OMB M-21-07; CISA TIC 3.0 v3.3; NIST SP 800-81r3. Book 08, Chapters 03, 11.");
  narrate(s,
`Four more instruments complete the floor.

Logging changed this year. OMB M-26-14, in May 2026, rescinded M-21-31 and its event-logging tiers, including the passive DNS requirement. M-26-14 doesn't name DNS. It sets a minimum baseline: logs actively searchable for six months and retrievable for a year, synchronized time, and logs that support determining source and destination network addresses, protocols, ports and session attributes. Each agency submits a logging plan within 90 days of CISA's Logging Reference Architecture, published August 20, so by November 18, 2026; the book computed that date, which is why it carries an asterisk. Then Levels 1, 2 and 3 within 120, 180 and 320 days. Which sources meet the baseline is set in that plan, DNS resolvers included. Chapter 11 adds why it matters: the query log says which address asked for a bad domain; the DHCP lease history says which device that was.

M-08-23 required DNSSEC on applicable federal systems by December 2009, and SP 800-53 carries it into every baseline. M-21-07's IPv6 milestones, 80 percent IPv6-only by the end of FY2025, have all passed. TIC 3.0 lists five DNS enforcement capabilities. And NIST SP 800-81 revision 3 is the practical guide: guidance, not a mandate.

So the CISO, who owns query logging in the matrix, names the DNS query and DHCP lease logs as sources in the logging plan.`,
  "Book 08, Chapter 03 — Federal Requirements (What the mandates say: M-26-14, M-08-23, M-21-07, TIC 3.0; NIST SP 800-81 Rev. 3); Chapter 11 — Operating the Control Plane (What M-26-14 requires of DNS and DHCP logs); Chapter 09 (responsibility matrix: Protective DNS forwarding and query logging).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Leaving AD DNS is an inventory problem first");
  tag(s, "What");
  figure(s, "ch04-ad-dns-departure", 0.6, 6.9, 1.97, 1.45);
  panel(s, "Reprovision", HEX.navy, HEX.grey, "What must be rebuilt before AD leaves", [
    "Locator records, until the last domain controller",
    "Conditional forwarders, as policy-plane rules",
    "The internal namespace, created explicitly",
  ], { x: 0.6, y: 3.55, w: 6.9 });
  sideBox(s, "Entra", "FaIdCard", HEX.navy, HEX.navyTint, "What Entra ID doesn't carry", [
    "No zones and no locator records",
    "Kerberos pockets keep DNS dependencies",
    "Domain Services adds its own DNS authority",
    "AD DS itself isn't deprecated",
  ]);
  decision(s, "Complete and reconcile the AD DNS inventory, and reprovision what it finds, before any domain controller is retired",
    "DNS/DDI team decides; AD admins do it", "Before the first domain controller goes");
  sources(s, "Sources: Microsoft Learn — DNS and AD DS; DC locator; dynamic update; Entra cloud-first guidance; Entra Domain Services DNS. Book 08, Chapters 04 and 09.");
  narrate(s,
`Active Directory never presented itself as the agency's DNS service, but for twenty years it was one. When a domain is deployed, its name becomes a zone, the domain controllers become its authoritative servers, and every domain-joined machine points at them. Domain controllers then publish the locator records that let clients find them.

None of that moves to Microsoft Entra ID. Entra ID consumes names, but it hosts no zones and publishes no locator records. Devices joined only to Entra ID don't look for a domain controller; hybrid-joined devices still do. Kerberos survives in pockets, and each pocket keeps a DNS dependency. Entra Domain Services brings its own DNS, with an upstream the agency can't change. And AD DS itself isn't deprecated; Microsoft's path is phased, toward an AD-minimized state.

So leaving AD DNS is an inventory problem before it's a migration problem. The records a domain controller maintains can't be recovered from it once it's gone. Locator records stay where domain controllers can register them securely, so they're the last thing to move. Conditional forwarders, often undocumented, become rules in the policy plane. The internal namespace is created explicitly, because nothing creates it by default. And the DHCP server's registration credential decides whether dynamic records can be trusted.

The decision is Chapter 08's fourth: the DNS/DDI team decides, AD administrators do the inventory, and it's reconciled before the first domain controller goes.`,
  "Book 08, Chapter 04 — The Active Directory DNS Departure (opening; The locator records; Secure dynamic updates and the DHCP server; What Entra ID does not carry; What must be reprovisioned before AD leaves); Chapter 08 (Decision 4); Chapter 09 (responsibility matrix: AD DNS inventory).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Where a query slips past agency policy");
  tag(s, "What");
  figure(s, "ch05-redirect-dns", 0.6, 6.9);
  sideBox(s, "Bypass", "FaRoute", HEX.red, HEX.redTint, "Three silent bypasses", [
    "An edge redirect aimed outside agency control",
    "Encrypted DNS from devices to public resolvers",
    "A rogue DHCP server hands out its resolver",
    "None of them raises an alarm",
  ]);
  decision(s, "Point every branch edge only at agency resolvers, with any SASE resolver behind them, and detect rogue DHCP and router advertisements",
    "DNS/DDI team; network eng. configures; CISO detects", "Phase 3, then before each SD-WAN change");
  sources(s, "Sources: Cisco Catalyst SD-WAN redirect-dns guide; OMB M-22-09; CISA Encrypted DNS guidance; MITRE ATT&CK T1557.003; RFC 6105, 8106. Book 08, Chapters 05, 08, 09.");
  narrate(s,
`Every control in the policy plane assumes the query reaches it. Three ordinary mechanisms decide whether it does, and none reports when it doesn't.

First, the edge. SD-WAN edges can intercept DNS whatever resolver the client was given; the book's worked example is the redirect-dns action in Cisco Catalyst SD-WAN. The figure shows why the destination matters. Sent to an agency resolver, the query gets response policy, DNSSEC validation and logging before going upstream to Protective DNS. Sent to an external resolver, the agency never sees it. A SASE provider's resolver belongs behind the agency resolver, as its forwarding target, never in front.

Second, encrypted DNS from devices and browsers to public resolvers, the bypass the mandates make more likely if they're applied carelessly. The goal isn't to prohibit encryption, but to make it terminate at an agency resolver or Protective DNS.

Third, rogue DHCP. A rogue server handing out its own resolver can move a whole subnet past every control in one step, and in IPv6 rogue router advertisements can do the same. Active Directory authorization stops a misconfigured Windows server, not a rogue appliance; switch-level snooping and RA Guard do.

The matrix splits deciding from doing on purpose. The DNS/DDI team decides what the edge points at; network engineering configures it; and the CISO decides rogue DHCP detection.`,
  "Book 08, Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP (SD-WAN DNS interception; Encrypted DNS and bypass controls; DHCP option 6 and rogue DHCP; What this chapter establishes); Chapter 08 (Decisions 1 and 2); Chapter 09 (Network engineering; responsibility matrix).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Certificates and tokens fail when names do");
  tag(s, "What");
  figure(s, "ch06-trust-chain", 0.6, 12.15, 1.55, 1.45);
  panel(s, "Disguise", HEX.red, HEX.redTint, "DNS failures in disguise", [
    "Revocation names only in AD DNS fail from a cloud",
    "Sign-ins sent to the wrong cloud's endpoint break",
    "A wildcard missing in one cloud breaks every API",
  ], { x: 0.6, y: 3.2, w: 5.95 });
  panel(s, "DNSSEC", HEX.teal, HEX.tealTint, "DNSSEC: the program's position", [
    "Sign external zones and .gov delegations always",
    "Validate on resolvers the agency controls",
    "Sign internal zones only where required",
  ], { x: 6.8, y: 3.2, w: 5.95 });
  decision(s, "Sign external zones and validate on agency resolvers; moving an internal zone to a service that won't sign it is a risk acceptance",
    "CISO sets it; the AO accepts a lost signature", "Before any signed zone moves");
  sources(s, "Sources: OMB M-08-23; NIST SP 800-53 Rev. 5 SC-20, SC-21; NIST SP 800-81r3; RFC 4033–4035, 5280; Microsoft Learn (Azure DNSSEC); AWS Route 53. Book 08, Chapters 06, 09.");
  narrate(s,
`A certificate can be valid, unrevoked and issued for the right name, and still fail, because every check that makes it trustworthy starts with a DNS lookup. The figure is the chain: the name resolves to the authentic endpoint, the certificate validates, name-based policy applies, and the token reaches the right audience.

The failures come in disguise. If the revocation names exist only in AD DNS, a cloud workload can't resolve them, and the incident ticket is opened as a certificate problem. Token-based sign-in changes the DNS surface rather than shrinking it: a resolver that sends a GCC High tenant's sign-ins toward the commercial endpoint breaks authentication. And a wildcard name that's right on premises but missing in one cloud breaks every API behind it, for every caller there at once.

DNSSEC protects the integrity of the answers. M-08-23 required it on applicable federal systems, and SP 800-53 carries signing and validation into every baseline. NIST's 2026 guide is cautious about internal zones, calling signing them likely to be of limited value for most organizations unless it's required. So the program's position: sign external zones and the dot-gov delegations always, validate on resolvers the agency controls, and sign internal zones only where the authorization requires it. Azure and Route 53 sign public zones only.

The CISO sets the signing and validation requirements. Moving an internal zone to a service that won't sign it is a risk acceptance, so the authorizing official decides it.`,
  "Book 08, Chapter 06 — DNS Identity, Certificates and DNSSEC (DNS identity as the foundation; From Kerberos to tokens; DNS as the application surface; DNSSEC; DNSSEC on Windows Server, Azure and AWS); Chapter 09 (responsibility matrix: DNSSEC rows and their comment).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "IPAM is the address record of the estate");
  tag(s, "What");
  figure(s, "ch07-sdn-ipam", 0.6, 4.3);
  sideBox(s, "Authority", "FaSitemap", HEX.navy, HEX.navyTint, "One authority for address blocks", [
    "Enterprise IPAM is the authority; clouds allocate from it",
    "Native integration: AWS commercial Regions and VMware VCF 9.1",
    "Azure, Google Cloud and GovCloud: reserve first, mirror, reconcile",
    "Federation finds overlaps before networks are joined",
    "The address layer of the asset inventory Zero Trust needs",
  ], { x: 5.1, w: 7.65 });
  decision(s, "Make the enterprise IPAM the authority for address blocks: every cloud and VMware network is reserved there before it's created",
    "DNS/DDI team decides; cloud teams allocate", "From the next cloud network created");
  sources(s, "Sources: AWS VPC IPAM (Nov 17, 2025); Microsoft Learn — Azure Virtual Network Manager IPAM; OMB M-22-09; OMB M-21-07; CISA ZTMM v2.0. Book 08, Chapters 01, 07, 09.");
  narrate(s,
`Names and addresses are the same problem. Every cloud, and VMware, ships its own address manager. Left alone, each allocates address space independently, and that recreates for addresses the divergence split-brain creates for names: overlaps that surface only when two networks are joined, and address space an audit finds undocumented.

The book's answer is that the enterprise IPAM is the authority for address blocks. The figure shows that integration depth differs. AWS VPC IPAM can allocate from an external IPAM, but in commercial Regions only, not GovCloud. VMware Cloud Foundation 9.1 allocates from it natively. Azure Virtual Network Manager and Google Cloud mirror reservations and rely on discovery and reconciliation. Where there's no native integration, the rule is to reserve first, then mirror, then reconcile continuously.

Federation is what turns separate address managers into one inventory, which makes overlap detection, collision-free planning and reporting possible. It's also the address layer of the asset inventory: M-22-09 expects a complete inventory of every device the agency operates, and CISA's maturity model counts cloud network resources, DNS services included. And DDI is where dual-stack and IPv6-only address management happens, against M-21-07 milestones that have now passed.

In the matrix, the address plan and top-level blocks are the DNS/DDI team's decision, and cloud teams allocate from delegated pools. Start with the next cloud network created.`,
  "Book 08, Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency (SDN–IPAM consistency across cloud providers and VMware; IPv6 lifecycle; What this chapter establishes); Chapter 01 (Hybrid cloud IPAM and DHCP); Chapter 09 (responsibility matrix: IPAM rows).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Five settings carry almost all of the risk");
  tag(s, "What");
  figure(s, "ch08-reference-architecture", 0.6, 4.55);
  rows(s, "Five", "THE FIVE CONFIGURATION DECISIONS (CHAPTER 08)", [
    ["1", "The edge redirects only to an agency resolver"],
    ["2", "The agency resolver is the first hop"],
    ["3", "The policy plane holds every cloud forwarding rule"],
    ["4", "AD DNS is inventoried before any DC goes"],
    ["5", "Revocation endpoints resolve from every origin"],
  ], 1.88, 0.62, 0.54, { x: 5.4, w: 7.35 });
  decision(s, "Settle the five configuration decisions, check each in the running configuration, and report residual risk to the AO",
    "DNS/DDI team; network eng. does the edge", "Within 90 days of authorizing the plane");
  sources(s, "Sources: CISA Protective DNS Resolver; Cisco SD-WAN redirect-dns; Microsoft Learn — Azure private endpoint DNS; AWS Route 53 VPC Resolver. Book 08, Chapters 01, 08 and 09.");
  narrate(s,
`Now the architecture, in one picture. A branch client's query passes the SD-WAN edge to an agency-controlled resolver, then into the DDI policy plane, which holds policy, response policy zones, DNSSEC, IPAM and forwarding, and on to each cloud's private zones. Internet-bound queries leave through CISA's Protective DNS. On-premises clients and cloud workloads join the same path.

The architecture is simple to draw. The risk sits in five settings that are easy to get wrong and hard to see when they are. One: the edge redirects only to an agency resolver. Two: that resolver is the first hop, with any other resolver behind it. Three: the policy plane holds every per-cloud forwarding rule and pushes the same rules to every resolver. Four: AD DNS is inventoried before any domain controller goes. Five: certificate revocation endpoints resolve from every origin.

Each one fails silently: the query still resolves, just outside policy or to the wrong address. So each comes with a check to run in the live configuration, not the design document, before the next SD-WAN or DDI change. The common failure on decision two is a chain with every component present and the SASE service first.

Chapter 01's ask is specific: charge the DNS/DDI team, which holds the decision right on all five, with network engineering configuring the edge, to settle them within 90 days and report residual risk to the authorizing official.`,
  "Book 08, Chapter 08 — Reference Architecture and the Five Critical Decisions (The end-to-end resolution flow and five decisions; Decisions 1 to 5); Chapter 01 (The case in one paragraph: Ask); Chapter 09 (responsibility matrix: Decisions 1 to 5).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "Choosing the platform and the source of truth");
  tag(s, "What");
  const models = [
    ["SaaS policy plane", "Writes records into each cloud's DNS", "Published integration limits"],
    ["Agency-operated DDI", "Some import cloud zones, not write back", "How changes reach each cloud"],
    ["Cloud-native, as code", "Cloud resolvers forward between clouds", "No single IPAM or delegation"],
  ];
  leftTable(s, ["Model", "Cross-cloud reach", "What to check"],
    models.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.95, 2.75, 2.25], [0.42, 0.72, 0.72, 0.72], 12.5);
  T(s, "Models note", "Examples to verify in each candidate's current documentation, not a ranking. A smaller, single-cloud agency may need only the cloud-native path (the program's judgment).",
    { x: 0.6, y: 4.2, w: 6.95, h: 0.75, fontSize: 12, italic: true, color: HEX.slate });
  sideBox(s, "Auth", "FaFileShield", HEX.teal, HEX.tealTint, "Authorization is per offering", [
    "FedRAMP certifies the service; the agency authorizes its system",
    "One DDI management plane listed at Moderate since 2022",
    "Moderate doesn't cover High or DoD",
    "On-premises resolvers sit in the agency's boundary",
  ], { x: 7.75, w: 5.0 });
  decision(s, "Choose the platform model on evidence from the agency's own estate; authorize any cloud-delivered management plane at the right level",
    "Sponsor and CIO choose; the AO authorizes", "Before the next migration wave");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026; FedRAMP Marketplace data (Oct 20, 2026); Infoblox, BlueCat and EfficientIP documentation. Book 08, Chapters 03, 08, 12.");
  narrate(s,
`The platform decision is really a source-of-truth decision. The policy plane holds the system of record for zones, forwarding rules, IPAM data and security policy, and the cloud DNS services become consumers of it. That's overlay management, not replacement: Route 53 still serves Route 53 zones.

The book compares three models. A SaaS policy plane, with Infoblox Universal DDI as the example, writes records into each cloud, within published integration limits. Agency-operated DDI, such as BlueCat or EfficientIP, runs inside the agency's boundary; some products import cloud zones but can't write back, so decide how changes reach each cloud. And cloud-native resolvers managed as code reduce independent authoring but give no single multi-cloud IPAM or delegation model by themselves. For a smaller, single-cloud agency, the program's judgment is that the cloud-native path can be enough; the federal requirements don't shrink with it.

Authorization belongs to a specific offering. FedRAMP certifies the cloud service; the agency still authorizes its own DDI system. As of October 20, 2026, the Marketplace lists Infoblox Government Cloud at Moderate, certified since December 15, 2022; the vendor's July 2026 release describes what it includes. Moderate doesn't cover High or DoD, and on-premises appliances sit inside the agency's own boundary.

In the matrix, the sponsor and CIO choose the model, scoring each candidate on evidence it can produce; the authorizing official authorizes any cloud-delivered management plane.`,
  "Book 08, Chapter 08 (What a DDI policy plane is made of; Commercial and federal clouds compared); Chapter 03 (FedRAMP and agency authorization); Chapter 12 — Platform Selection, Cost and Residual Risk (Selection criteria; Authorization status; Comparing the platform models); Chapter 09 (responsibility matrix: platform selection; authorization).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "One decider per decision, named on purpose");
  tag(s, "Who");
  figure(s, "ch09-ddi-owners", 0.6, 6.9);
  sideBox(s, "AD", "FaUsersGear", HEX.teal, HEX.tealTint, "What AD decided for you", [
    "DnsAdmins controls every zone by default",
    "Any user can create address records",
    "The DC team decided DNS by default",
    "One plane now concentrates that power",
  ]);
  decision(s, "Assign the DNS/DDI decision rights to a named group, and empty DnsAdmins of anyone who isn't a domain administrator",
    "Sponsor and CIO; AD administrators", "Before the transition starts");
  sources(s, "Sources: Microsoft Learn — DNS zones (access); DnsAdmins (Defender for Identity); AD security groups; DNS for AD DS owner; NIST SP 800-37 Rev. 2. Book 08, Chapter 09.");
  narrate(s,
`Who owns it? In an Active Directory estate, ownership of DNS was rarely written down, because AD wrote it down for you. The DnsAdmins group has full control of every zone by default. Any authenticated user can create address records. And change approval, where it existed, sat with the small team that ran the domain controllers.

That doesn't survive the target. One policy plane concentrates authority, which is the point, and it means one team now holds the power to break resolution for every user, every cloud and every branch at once. So the owners have to be named on purpose, one decider per decision, or the cloud, network and directory teams will each own a piece by accident.

The figure is the program's recommended model. The sponsor and CIO own scope, platform selection and decommission timing. The authorizing official owns platform authorization and standing exceptions. The CISO and ISSO set the encrypted DNS, DNSSEC, logging and evidence requirements. The DNS/DDI team designs and runs zones, forwarding, IPAM, DHCP and signing. Network engineering does the edge; cloud teams consume authoritative state; AD administrators run the inventory until AD DNS retires; security operations watches the alerts; the help desk triages.

Two decisions before the transition starts: give the decision rights to a named group, not "the network team" in general; and treat DnsAdmins as privileged, emptied of anyone who isn't a domain administrator.`,
  "Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM (opening; Decision rights and work are different things; The roles: sponsor and CIO, DNS/DDI team, Active Directory administrators).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Who decides what for DNS, DHCP and IPAM");
  tag(s, "Who");
  const owners = [
    ["Platform model; decommission timing", "Sponsor and CIO"],
    ["Cloud management-plane authorization", "Authorizing official"],
    ["Encrypted DNS, DNSSEC, query logging", "CISO"],
    ["Standing exceptions; lost signatures", "Authorizing official"],
    ["Namespace, edge target, forwarding", "DNS/DDI team"],
    ["Address plan; phase go/no-go", "DNS/DDI team"],
    ["Edge configuration; DHCP relay", "Network eng. (does)"],
    ["AD DNS inventory work", "AD admins (do)"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r, i) => [{ text: r[0] }, bold(r[1], (i === 1 || i === 3) ? HEX.amber : HEX.teal)]),
    [4.0, 2.9], [0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38], 12);
  sideBox(s, "Risk", "FaScaleBalanced", HEX.amber, HEX.amberTint, "Risk decisions in disguise", [
    "An edge aimed at a public resolver",
    "A device class exempt from encryption",
    "A zone moved where it isn't signed",
    "Each reaches the AO with a review date",
  ]);
  decision(s, "Route every standing exception to the AO with an owner and a review date, so a temporary exception never becomes a permanent risk",
    "CISO raises; the AO decides", "At each exception");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; OMB M-22-09; CISA Protective DNS Resolver; get.gov domain management. Book 08, Chapter 09 (responsibility matrix and its comments).");
  narrate(s,
`The responsibility matrix, in one view. The book separates deciding, doing and being consulted, and keeps one decider per row.

The sponsor and CIO decide the platform model and when AD DNS and Windows DHCP are decommissioned. The authorizing official decides the authorization of any cloud-delivered management plane. The CISO decides encrypted DNS policy, DNSSEC signing and validation, and query logging. The DNS/DDI team decides the namespace design, what the edge points at, the forwarding rules, the address plan and each migration phase's go or no-go. Network engineering and AD administrators do much of the work, but don't decide it.

Why does the authorizing official appear twice? Because name changes are cheap to make and expensive to get wrong, and many are risk decisions in disguise. Leaving a branch edge pointed at a public resolver turns off Protective DNS for that branch. Exempting a device class from encrypted DNS creates a monitoring gap. Moving an internal zone to a service that doesn't sign it removes DNSSEC. Under the Risk Management Framework, the authorizing official accepts risk on the organization's behalf, so those decisions can't stop at the console.

The exception rows split on time: the CISO can grant a temporary exception; one with no end date, or past the agency's limit, goes to the authorizing official, with an owner and a review date.`,
  "Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM (Decision rights and work are different things; The authorizing official; The responsibility matrix, and the four rows that need comment).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "Most record changes need no change board");
  tag(s, "Who");
  figure(s, "ch09-record-change-classes", 0.6, 6.4);
  sideBox(s, "Classes", "FaClipboardCheck", HEX.navy, HEX.navyTint, "What makes the classes work", [
    "Standard changes are decided in advance",
    "The policy that writes records is high-impact",
    "Write access scoped to a zone or record set",
    "The integration account is the most powerful identity",
  ], { x: 7.2, w: 5.55 });
  decision(s, "Adopt the three change classes, pre-approving standard changes inside delegated namespaces and sending high-impact ones to the board",
    "DNS/DDI team; CISO consulted", "Before namespaces are delegated");
  sources(s, "Sources: Microsoft Learn — Private Link and DNS integration at scale; protecting private DNS zones and records; AWS Route 53 shared Resolver rules. Book 08, Chapter 09.");
  narrate(s,
`Most DNS changes don't need a change board, and treating them all alike is how agencies end up with either a six-week wait for an alias record or no control at all. The program sorts record changes into three classes.

Standard changes are ordinary address and alias records inside a namespace already delegated to a division or an application. They're pre-approved, requested through a service catalog item or a pipeline, and written by a scoped service account, with the application owner as requester of record.

Policy-driven changes are records a system writes and removes as part of a lifecycle: private endpoint records, virtual machine registrations, DHCP-driven updates. They need no per-change approval, but the policy that writes them is itself a high-impact change.

High-impact changes are zones, delegations, forwarding rules, locator records, mail records, wildcards and response policy. They go to the change board, with the DNS/DDI team approving, the CISO consulted, and the authorizing official involved when the change accepts risk. Every class feeds one audit trail.

Permissions have to match the classes, but they can't do all the work: Microsoft notes that an update can empty a record set, with the same effect as deleting it. So scope who can write at all, and watch for record sets that suddenly go empty. And the integration account the plane uses to write to each cloud is the most powerful identity in the design: non-interactive, rotated and evidenced.`,
  "Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM (Record change approval; Roles in each system, notes on the integration account; responsibility matrix: standard and high-impact record changes).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Six phases, each closed by its evidence");
  tag(s, "How");
  figure(s, "ch10-migration-phases", 0.6, 3.2);
  sideBox(s, "Loop", "FaArrowsRotate", HEX.navy, HEX.navyTint, "One cutover loop, every move", [
    "Old authority answers until the new is proven",
    "Validate from every origin, both directions",
    "A failed check returns to the rollback point",
  ], { x: 4.0, w: 4.3, minH: 3.6 });
  sideBox(s, "Est", "FaUserClock", HEX.amber, HEX.amberTint, "Planning estimates (design)", [
    "Assessment: 1–2 days",
    "Client waves: 1–2 weeks",
    "Locator-record watch: 30 days",
    "Estimates, not commitments",
  ], { x: 8.45, w: 4.3, minH: 3.6 });
  decision(s, "Close each migration phase on its validation and filed evidence, never on a calendar date; the next phase doesn't start before then",
    "DNS/DDI team decides go/no-go", "At the close of each phase");
  sources(s, "Sources: Microsoft Learn — DnsServer and DhcpServer modules; Azure DNS Private Resolver; Azure Private DNS FAQ; NIOS Microsoft integration. Book 08, Chapters 09 and 10.");
  narrate(s,
`How to get there. The book's canonical sequence has six phases: inventory and baseline; deploy coexistence; migrate authority, zone by zone, with clients moved in waves; federate the clouds; decommission AD DNS and DHCP; and harden and evidence, which switches on Protective DNS forwarding, encrypted DNS and DNSSEC everywhere once authority has moved.

Name resolution has to keep working while its authority moves, so every move, one zone, one forwarder, one DHCP scope or one wave of clients, runs the same loop. Lower the time-to-live ahead of the change. Export, transform and import, with a dry run first. Validate from every origin, forward and reverse. Switch authority. Hold and observe. Then restore and close the change with its evidence. The old authority keeps answering until the new one is proven, so a failed check simply reverts the switch.

The program's planning estimates, for a single forest and a hub-and-spoke cloud footprint, run from a day or two for assessment to one or two weeks for client waves, and thirty days for watching the locator records. They're estimates, not commitments; the gates decide when a step ends.

That's the decision. In the matrix, the DNS/DDI team decides each phase's go or no-go, with the other teams consulted. A phase closes on its validation and filed evidence, not a date, and the next one doesn't start before then.`,
  "Book 08, Chapter 10 — The Migration Sequence (The six phases; How the operational playbook maps to the six phases; The cutover loop every phase repeats); Chapter 09 (responsibility matrix: migration phase go/no-go).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "AD DNS retires through gates, not on a date");
  tag(s, "How");
  rows(s, "Gates", "THE PHASE 5 GATES, ALL OF WHICH MUST PASS (PROGRAM DESIGN)", [
    ["Reconciled", "Inventory accounted for, both directions"],
    ["Locators", "100% resolution for 30 days, every site"],
    ["Parallel", "90 days, no critical alerts or drift"],
    ["Failover", "Tested on the new servers, not assumed"],
    ["Idle", "No queries reach the old servers"],
  ], 1.88, 0.62, 0.54);
  sideBox(s, "AD", "FaDoorClosed", HEX.navy, HEX.navyTint, "Sequenced against AD retirement", [
    "Locator records are the last thing to move",
    "Every remaining DC needs secure registration",
    "Exports and logs are federal records",
    "Then a 7-day burn-in with no client impact",
  ]);
  decision(s, "Set the AD DNS and Windows DHCP decommission date only after every gate passes, with the records officer confirming disposition",
    "Sponsor and CIO; records officer", "After the gates pass");
  sources(s, "Sources: Microsoft Learn — Remove-DhcpServerInDC; Netlogon policy (DC Locator); NARA GRS 3.2 item 036 and GRS 3.1 item 030. Book 08, Chapters 04, 09, 10 and 12.");
  narrate(s,
`Sequencing against Active Directory retirement is where this book meets the identity program. While any domain controller remains, its domain's zones need a DNS service that accepts secure registration from domain controllers: AD DNS itself, or a DDI platform that supports it. So the locator records stay put through the hybrid period, reached by forwarding, and they're the last thing to move. A single-cloud agency that still runs Active Directory keeps AD DNS until the last domain controller is retired.

Decommissioning is the one step whose mistakes can't be rolled back cheaply, so it's gated, not scheduled. Five gates, all program design. The inventory reconciles in both directions. Every critical locator record resolves from every site, checked every fifteen minutes, for thirty consecutive days. Ninety days of parallel operation with no critical alerts. Failover tested, not assumed. And a final log review showing no queries reach the old servers. Then a seven-day burn-in.

The book's warning is blunt: losing the locator records through a premature decommission causes forest-wide authentication and domain-join failures that are hard to diagnose under pressure.

One more point: the archived exports and the old servers' logs are federal records. Security event logs fall under NARA's schedule 3.2, kept thirty months, so the records officer confirms disposition before anything is destroyed.

The sponsor and CIO own decommission timing in the matrix. They set it only after every gate passes.`,
  "Book 08, Chapter 10 — The Migration Sequence (Phase 5 — Decommission AD DNS and DHCP: the gates, the decommissioning order and records, Do not decommission early); Chapter 04 (The locator records); Chapter 12 (single-cloud agencies and the DC Locator records); Chapter 09 (responsibility matrix: decommission timing).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Operate it as one plane, and prove it");
  tag(s, "How");
  figure(s, "ch11-evidence-flow", 0.6, 6.9, 2.0, 1.45);
  panel(s, "Deleg", HEX.navy, HEX.grey, "Divisions keep scoped autonomy", [
    "Corporate visibility; divisional scopes",
    "Every change, human or automated, via one API",
    "One audit trail for the whole estate",
  ], { x: 0.6, y: 3.6, w: 6.9 });
  sideBox(s, "Metric", "FaChartLine", HEX.teal, HEX.tealTint, "Measure one thing first", [
    "Resolution-path consistency: same intended answer from every origin",
    "Baseline it, set a target, report it",
    "Secondary: overlaps; errors traced to DNS",
  ]);
  decision(s, "Baseline resolution-path consistency, set a target and report progress to the authorizing official (program's measure)",
    "DNS/DDI team reports; the AO receives", "Baseline now; report each phase");
  sources(s, "Sources: OMB M-26-14; Microsoft Learn — DNS logging and diagnostics, DNS resolver policy, Azure Monitor; Infoblox access views (example). Book 08, Chapters 11 and 12.");
  narrate(s,
`One policy plane is only an improvement if divisions can still run their own networks through it, every change leaves a trace, and the logs it keeps are the evidence an authorizing official asks for.

Delegation first. Corporate administrators keep full visibility and policy over the estate; each division gets a scope covering its own zones, address spaces and DHCP scopes, with manager, operator and auditor roles, and scoped automation accounts. Every change, human or automated, goes through the same API, roles and audit trail.

The figure shows three evidence streams. Query and lease logs go to the SIEM and the security operations center for detection and M-26-14 retention. The change and role audit goes there too, and to the authorization package. Inventory and drift go to the CMDB for the asset inventory, and to the package. The evidence checklist that closes the final phase starts with the five decisions, each checked in the running configuration.

And measure one thing first. The book's headline measure is resolution-path consistency: the share of tested names that return the same answer, or the intended internal and external answers, from every governed origin. Baseline it, set a target, and report progress to the authorizing official. Secondary measures are address overlaps, and certificate and access errors traced to wrong DNS answers.

The book doesn't name who reports, so this is the program's model: the DNS/DDI team, which runs the plane, baselines it now and reports at each phase.`,
  "Book 08, Chapter 11 — Operating the Control Plane (Delegated administration across divisions; API and automation; Monitoring and telemetry; Compliance evidence; Sample evidence checklist); Chapter 12 (Cost, staffing and success measures).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Price the meters; keep the residual risk on record");
  tag(s, "How");
  figure(s, "ch12-residual-risks", 0.6, 12.15, 1.7, 1.42);
  panel(s, "Cost", HEX.amber, HEX.amberTint, "What it costs (list prices, Oct 20, 2026)", [
    "Commercial DDI licensing isn't published: quote it",
    "Cloud resolver endpoints: $180 each a month",
    "One-region hub: about $362.50 a month, before zones",
    "AWS IPAM: billed per active address monitored",
  ], { x: 0.6, y: 3.27, w: 5.95 });
  panel(s, "Risk", HEX.red, HEX.redTint, "Risks that remain after the plane", [
    "Sync lag becomes the new divergence",
    "In an outage, changes stop; resolution continues",
    "Encrypted DNS bypass where controls are incomplete",
    "Moderate doesn't cover High or DoD",
  ], { x: 6.8, y: 3.27, w: 5.95 });
  decision(s, "Get quotes on identical assumptions from every candidate, re-estimate any budget built on the earlier resolver pricing, and record residual risk",
    "Sponsor and CIO", "Before selection");
  sources(s, "Sources: Azure Retail Prices API and Azure DNS pricing (retrieved Oct 20, 2026); AWS VPC IPAM; Infoblox Azure DNS integration limits; Microsoft Learn. Book 08, Chapter 12.");
  narrate(s,
`Cost and residual risk. Commercial DDI licensing is quoted per agency and isn't published, so the book doesn't estimate it. Get quotes on the same assumptions for every candidate: sites and resolvers, managed addresses, the clouds in scope and the authorization boundary.

The cloud-native components have public meters, and they appear in every model, because even a commercial policy plane forwards into cloud resolvers. At Azure list prices retrieved on October 20, 2026, the private resolver is billed per endpoint per month, 180 dollars each, so a hub with one inbound endpoint, one outbound endpoint and one ruleset costs about 362 dollars a month per region before zones and queries, and a second region for resilience doubles it. AWS bills IPAM per active address it monitors, so cost grows with the estate. The book corrects earlier program guidance that priced the resolver by the hour with cheap endpoints: the endpoints carry the cost, so re-estimate any budget built on it.

The figure shows the risks that remain. Sync lag between the plane and each cloud becomes the new source of divergence. If the management plane is down, changes stop but resolution continues from local state, so decide in advance who may invoke local overrides. Encrypted DNS bypass remains where endpoint controls are incomplete. And a Moderate authorization doesn't cover High or DoD.

None of these negates the architecture; they're the operating controls still required. The sponsor and CIO, who own selection, act before choosing.`,
  "Book 08, Chapter 12 — Platform Selection, Cost and Residual Risk (Cost, staffing and success measures; What the cloud-native path meters; Correction to earlier program guidance; Residual risk and limitations).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Authorize one authoritative DDI policy plane", "Sponsor and CIO", "Next migration wave"],
    ["Designate encrypted resolvers and transports", "CISO; AO if standing", "Now"],
    ["Put DNS query and DHCP lease logs in the logging plan", "CISO", "By Nov 18, 2026*"],
    ["Reconcile the AD DNS inventory before any DC goes", "DNS/DDI team", "Before first DC"],
    ["Aim every edge at agency resolvers; detect rogue DHCP", "DNS/DDI team; CISO", "Phase 3"],
    ["Sign external zones; validate on agency resolvers", "CISO; AO if unsigned", "Before zones move"],
    ["Reserve every cloud network in the enterprise IPAM", "DNS/DDI team", "Next cloud network"],
    ["Settle the five decisions; report residual risk", "DNS/DDI team", "Within 90 days"],
    ["Choose the platform on evidence; authorize the plane", "Sponsor/CIO; the AO", "Next migration wave"],
    ["Name the decision rights; empty DnsAdmins", "Sponsor/CIO; AD admins", "Before transition"],
    ["Close each phase on evidence; decommission by gate", "DNS/DDI; Sponsor/CIO", "Each phase; gates"],
    ["Report path consistency; quote on equal terms", "DNS/DDI; Sponsor/CIO", "Now; before selection"],
  ];
  const rh = [0.36, ...asks.map(() => 0.34)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.4, 3.25, 2.5][j] - 0.2;
    if (linesFor(c.length, w, 12) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.4, 3.25, 2.5], { y: 1.45, w: 12.15, fontSize: 12, rowH: rh }));
  T(s, "Close line", [{ text: "Govern the name layer before the last domain controller goes.  ", options: { bold: true, color: HEX.amber } },
    { text: "One plane, one decider per decision, proven from every origin." }],
    { x: 0.6, y: 5.98, w: 12.15, h: 0.5, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: OMB M-22-09; M-26-14; CISA Protective DNS and encrypted DNS guidance; NIST SP 800-81r3. Book 08, Chapters 01–12. *Computed date. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The sponsor and CIO authorize one authoritative DDI policy plane and choose the platform model on evidence, before the next migration wave, with quotes on identical assumptions; the authorizing official authorizes any cloud-delivered management plane. They also name the decision rights, and set the AD DNS and DHCP decommission date only after every gate passes.

The CISO designates the encrypted resolvers and transports now, puts the DNS query and DHCP lease logs into the logging plan by November 18, decides rogue DHCP detection, and sets signing and validation. Standing exceptions, and zones that lose their signature, go to the authorizing official.

The DNS/DDI team reconciles the AD DNS inventory before the first domain controller goes, decides what every edge points at, makes the enterprise IPAM the authority for address blocks, settles the five configuration decisions within 90 days and reports residual risk, closes each phase on evidence, and reports resolution-path consistency.

AD administrators empty DnsAdmins of anyone who isn't a domain administrator before the transition starts.

The theme under all of it: govern the name layer before the last domain controller goes. One plane, one decider per decision, proven from every origin. Book 08 has the detail, with every claim footnoted. Thank you.`,
  "Book 08, Chapter 01 (The case in one paragraph); Chapter 09 — Who Owns DNS, DHCP and IPAM (The responsibility matrix); Chapter 10 (Phase 5 gates); Chapter 12 (Why decide now; Conclusion).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal requirements and guidance");
  const src = [
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (January 26, 2022), Encrypting DNS traffic.  ·  OMB M-26-14, agency logging and network visibility (May 22, 2026), Appendices B and C.  ·  OMB M-08-23, Securing the Federal Government's DNS Infrastructure (August 22, 2008).  ·  OMB M-21-07, IPv6 (November 19, 2020).",
    "CISA, Protective DNS Resolver service page; Encrypted DNS Implementation Guidance (May 16, 2024); Logging Reference Architecture (August 20, 2026); TIC 3.0 Security Capabilities Catalog v3.3 (September 2026); Zero Trust Maturity Model v2.0; get.gov domain management.",
    "NIST SP 800-81r3, Secure DNS Deployment Guide (March 2026).  ·  SP 800-53 Rev. 5 (SC-20, SC-21, SC-22 and related controls), release 5.2.0.  ·  SP 800-37 Rev. 2.  ·  SP 800-207.  ·  IETF RFCs 1034, 1035, 2136, 3645, 4033–4035, 5280, 6105, 8106, 9463.",
    "FedRAMP, Consolidated Rules for 2026, using a certified cloud service; FedRAMP Marketplace product data (October 20, 2026).  ·  NARA General Records Schedules 3.1 (item 030) and 3.2 (item 036).  ·  MITRE ATT&CK T1557.003 DHCP Spoofing.",
    "Full footnotes with links and access dates (October 20–23, 2026): Book 08, every chapter and Appendix B (whalermike.github.io/modernization-workbook/docs/books/b08-ddi/).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: platforms and products, as of October 2026");
  const src = [
    "Microsoft Learn: DNS and AD DS; DNS zones; dynamic update; locating domain controllers; Netlogon policy; DNSSEC Key Master; DnsAdmins security assessment; AD security groups; Entra cloud-first identity guidance; Entra Domain Services DNS; DHCP failover; DNS client DoH; DNS logging and diagnostics.",
    "Microsoft Learn: Azure private endpoints and DNS integration; Azure DNS Private Resolver; DNS resolver policy; Azure Private DNS FAQ and autoregistration; Azure Virtual Network Manager IPAM; Azure built-in networking roles; Private Link and DNS integration at scale; Microsoft 365 endpoints and informed network routing.  ·  Azure Retail Prices API (October 20, 2026).",
    "AWS: Route 53 VPC Resolver, DNS Firewall, shared Resolver rules, DNSSEC signing; VPC IPAM and its Infoblox integration (November 17, 2025); services in FedRAMP scope.  ·  Google Cloud DNS server and response policies.  ·  VMware NSX DNS forwarder.",
    "Vendor sources, labeled third-party in the book: Infoblox (Universal DDI, Endpoint, Azure DNS integration limits, Microsoft server integration, GSS-TSIG, July 22, 2026 press release); BlueCat; EfficientIP; Cisco Catalyst SD-WAN redirect-dns and Umbrella guidance.",
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
