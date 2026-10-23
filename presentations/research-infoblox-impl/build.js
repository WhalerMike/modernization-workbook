// Implementing Book 08's DDI design on Infoblox NIOS: a ~52-minute IMPLEMENTATION GUIDE.
//   Orientation: what the guide implements; the decisions to take before Phase 1.
//   Part 1 — Build the Grid · Part 2 — Migrate from Microsoft · Part 3 — Sign and harden · Part 4 — Operate and evidence.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Infoblox_Impl.pptx
// Modeled on presentations/research-cyberark-clm/build.js and reuses the shared kit in ../_build/.
// Every fact comes from the verified implementation brief (C:\tmp\ib\research_infoblox_impl.md, new sources opened
// 2026-10-23), the earlier verified Infoblox briefs it reuses, and Book 08 (docs/books/b08-ddi/).
// Program sequencing is labeled design guidance; inferences are labeled as inferences.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Implementing Book 08 on Infoblox NIOS", title: "Implementation Guide",
  footer: "Implementing Book 08 on Infoblox NIOS  ·  Implementation guide  ·  Research — under review" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Research_Infoblox_Impl.pptx";

// ------------------------------------------------------------------ helpers (as in the CyberArk implementation guide)
const WPM = 142;
let clock = 0, words = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; per.push({ slide: pres.slides.length, n, title: titles[titles.length - 1] });
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nSources: ${ref}`);
};
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6;
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const sources = (s, text, y = 6.62) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

const T = (s, name, t, o) => {
  const size = o.fontSize || 14;
  const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
  const paras = []; let cur = { chars: 0, size };
  runs.forEach((r) => {
    const ro = r.options || {}; const sz = ro.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / size);
    if (ro.breakLine || ro.bullet) { paras.push(cur); cur = { chars: 0, size }; }
  });
  if (cur.chars) paras.push(cur);
  const need = paras.reduce((h, p) => h + lines("x".repeat(Math.round(p.chars)), o.w - 0.1, p.size) * p.size / 72 * 1.2 + (o.paraSpaceAfter || 0) / 72, 0);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  return txt(s, name, t, o);
};

const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.32, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  return bottom;
};

const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.34 : 0) + (runs.length ? 0.08 : 0);
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

const flow = (s, name, y, h, steps, pt = 12, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 2, fontSize: pt });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

// Design-guidance and warning labels, so program design never reads as vendor fact.
const label = (s, name, text, x, y, w, color = HEX.red) =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color, valign: "middle" });

const divider = (sec, title, sub, items, mins, src) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Part contents", [
    { text: `IN THIS PART  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.65, w: 7.4, h: 1.4, paraSpaceAfter: 3 });
  sources(s, src, 6.08);
  return s;
};

const SUB = "Implementation guide  ·  Research — under review";
const OR = "Orientation";
const P1 = "Part 1 — Build the Grid";
const P2 = "Part 2 — Migrate from Microsoft";
const P3 = "Part 3 — Sign and harden";
const P4 = "Part 4 — Operate and evidence";

// ================================================================== 1 Title
{
  const s = titleSlide(OR, "Implementing Book 08 on Infoblox NIOS", SUB);
  txt(s, "Session map", [
    { text: "BUILDING BOOK 08'S DDI DESIGN ON INFOBLOX NIOS 9.1  ·  ABOUT 52 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Orientation  ·  Part 1 Build the Grid  ·  Part 2 Migrate from Microsoft", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 3 Sign and harden  ·  Part 4 Operate and evidence", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Infoblox NIOS 9.1.x, upgrade and FIPS/CC docs; DISA Infoblox NIOS 9.x STIG V1R1; Microsoft Learn; CISA KEV; Book 08. New sources opened Oct. 23, 2026.", 6.08);
  notes(s,
`This is an implementation guide. Book 08 sets the program's design for DNS, DHCP and IP address management, and the Research section's deep dive explains why Infoblox is one of the strongest platforms for it. This guide shows how to build that design on Infoblox NIOS, version 9.1, and how to move off Microsoft DNS and DHCP without breaking anything.

It runs in four parts after a short orientation. Part 1 builds the Grid: the Grid Master, its candidate, members, time, licensing, and virtual appliances in the clouds. Part 2 migrates from Microsoft: managing the Windows servers first, importing zones, Active Directory zones and secure updates, and taking over DHCP. Part 3 signs and hardens: DNSSEC, the hardware security module, the DISA STIG, FIPS mode and administrator access. And Part 4 covers running it: upgrades, backup and recovery, logging, automation, and the build mapped onto Book 08's six phases.

The ground rules are the same as the other implementation guides. Every fact comes from a primary source; the new ones were opened on October twenty-third, 2026. Sequencing recommendations are labeled design guidance, and inferences are labeled as inferences.`,
  "Research brief, Implementing Book 08's DDI design on Infoblox NIOS (verified Oct. 23, 2026), with the earlier verified Infoblox briefs it reuses; Infoblox NIOS 9.1.x, NIOS upgrade and FIPS/CC documentation; DISA Infoblox NIOS 9.x STIG V1R1; Book 08, Chapters 04, 06, 08 to 11.");
}

// ================================================================== 2 What it implements
{
  const s = content(OR, "What this guide implements: Book 08 on a Grid");
  tag(s, "What");
  const b = table(s, "Map", 1.5, [3.4, 4.65, 4.1], ["Book 08 element", "On Infoblox NIOS", "Where in this guide"], [
    ["Governed authoritative DNS and IPAM", "A Grid: one Grid Master database, replicated to members over an encrypted tunnel", "Part 1"],
    ["Coexistence with Microsoft DNS and DHCP", "Managing members sync Windows servers over MS-RPC, read-only first", "Part 2"],
    ["Zones and scopes moved one at a time", "Zone import by transfer; DHCP server-assignment takeover", "Part 2"],
    ["Locator records stay on AD DNS until the last DC", "Default kept; NIOS hosting the AD zone shown as the alternative", "Part 2"],
    ["DNSSEC signing and validation (Ch 06)", "The Grid Master signs as a hidden primary; keys in the database or an HSM", "Part 3"],
    ["Evidence and monitoring (Ch 11)", "Secure syslog to the SIEM, audit log copy, backups, STIG checklist", "Part 4"],
  ], { fontSize: 11.5 });
  callout(s, "Phases", b + 0.15, Math.min(0.95, 6.5 - b - 0.15), "FaDatabase", HEX.teal, "Book 08's six phases still govern: ",
    "this guide adds a Phase 0 of decisions that can't be undone cheaply, and maps every build step onto Phases 1 to 6.");
  sources(s, "Sources: Book 08, Ch 04, 06, 08, 10, 11; Infoblox NIOS 9.1.x Grid, Microsoft servers, zone import and DNSSEC pages; research brief §10.");
  notes(s,
`What does this guide implement? Book 08's design, mapped onto the way Infoblox works.

Book 08 wants governed authoritative DNS and IP address management. On NIOS that's a Grid: one Grid Master holds the database, and every member gets its copy over an encrypted tunnel. Part 1 builds it.

Book 08 wants a coexistence period with Microsoft DNS and DHCP. On NIOS, managing members synchronize the Windows servers over Microsoft's remote procedure call protocol, read-only first. Book 08 moves zones and scopes one at a time; on NIOS that's zone import by transfer, and a DHCP takeover done by changing server assignments. Book 08's default keeps the Active Directory locator records on AD DNS until the last domain controller goes, and this guide keeps that default, showing NIOS hosting the AD zone only as the alternative. Part 2 covers all of that.

Book 08 Chapter 06 requires DNSSEC. On NIOS, the Grid Master signs as a hidden primary, with keys in its database or a hardware security module. That's Part 3. And Chapter 11's evidence becomes secure syslog to the SIEM, a copy of the audit log, backups and the STIG checklist, in Part 4.

Book 08's six phases still govern. This guide adds a Phase 0 of decisions, because some NIOS choices can't be undone cheaply.`,
  "Book 08, Chapters 04 (AD DNS departure), 06 (DNSSEC), 08 (reference architecture), 10 (six phases, cutover loop), 11 (operations and evidence); Infoblox NIOS 9.1.x About Grids, Managing Microsoft Windows servers, Importing zone data, DNSSEC on a Grid; research brief section 10.");
}

// ================================================================== 3 Phase 0
{
  const s = content(OR, "Phase 0: decide these before you build anything");
  tag(s, "Why");
  flow(s, "Decide", 1.5, 2.15, [
    { head: "1 FIPS mode", body: "CLI only, after a factory reset (reset all). It turns off every cloud connection and Infoblox Portal access" },
    { head: "2 LTS train", body: "The STIG's CAT I version rule measures you against the approved federal Long Term Support release" },
    { head: "3 DNSSEC defaults", body: "Defaults are RSA/SHA1 and a 1024-bit ZSK: change them before the first zone is signed" },
    { head: "4 HSM or stealth", body: "The STIG wants the Grid Master stealth and HSM signing, or a documented exception" },
  ], 11.5);
  panel(s, "Cost", 0.6, 3.85, 6.0, 2.6, HEX.red, HEX.redTint, "WHY NOW", null, [
    "Leaving FIPS mode also needs reset all",
    "FIPS Grids lose Universal DDI hybrid management; the Data Connector too (inference)",
    "Fixing signed-zone crypto later means an algorithm rollover and new DS records at the parent",
  ], 12);
  panel(s, "Claim", 6.75, 3.85, 6.0, 2.6, HEX.amber, HEX.amberTint, "WHAT INFOBLOX SAYS ABOUT FIPS", null, [
    "NIOS 9.0.7 and later supports FIPS and CC-NIAP mode",
    "\"FIPS 140-3 and Common Criteria certifications are currently pending\"",
    "Running in FIPS mode isn't holding a validated module",
  ], 12);
  sources(s, "Sources: Infoblox NIOS FIPS/CC enabling and guidelines pages; NIOS 9.1.x DNSSEC parameters; DISA NIOS 9.x STIG V1R1 (V-285229, V-285269, V-285308).");
  notes(s,
`Before Phase 1, four decisions, because each is expensive to reverse.

First, FIPS mode. On NIOS you can set it only from the command line, and only after a factory reset, the reset all command. On a Grid you set it on the Grid Master, and members take it when they join. Turning it off again also needs reset all. And enabling it disables every cloud connection, including the Infoblox Portal. So a FIPS-mode Grid can't use Universal DDI hybrid management, and by my inference it loses the portal-managed Data Connector as well. Be precise about the claim, too: Infoblox says NIOS 9.0.7 and later is supported in FIPS and Common Criteria mode, but that the FIPS 140-3 and Common Criteria certifications are still pending. Running in FIPS mode isn't the same as holding a validated module.

Second, the Long Term Support train. One of the STIG's category one rules measures you against the current approved long-term-support version for federal systems.

Third, the DNSSEC defaults. NIOS defaults to RSA with SHA-1, and a 1024-bit zone-signing key. Change both before you sign anything, because fixing it later means an algorithm rollover and new DS records at the parent.

And fourth, the hardware security module. The STIG wants the Grid Master hidden from every zone's name server list, and HSM signing, or a documented exception.`,
  "Infoblox NIOS FIPS and CC mode: Enabling FIPS or CC mode, and Guidelines for FIPS/CC mode; NIOS 9.1.x Configuring DNSSEC parameters; DISA Infoblox NIOS 9.x STIG V1R1, rules V-285229, V-285269 and V-285308; research brief sections 0.1 to 0.3.");
}

// ================================================================== Part 1 divider
{
  const s = divider(P1, "Part 1: Build the Grid", "Implementation guide  ·  Part 1 of 4",
    ["The Grid Master pair and its candidate", "Joining members, ports, time and licenses", "vNIOS on VMware, Azure and AWS"], 9,
    "Sources: Infoblox NIOS 9.1.x Grid, HA, ports, NTP and license pages; vNIOS for VMware, Azure and AWS guides; Book 08 Ch 08.");
  notes(s,
`Part 1: build the Grid.

We'll start with the Grid Master, built as a high-availability pair, and its candidate, the appliance that takes over if the Grid Master is lost. Then how members join, the ports the Grid needs, time, and licenses, including one licensing trap that can evict a member from the Grid. And finally the virtual appliances, vNIOS, on VMware, Azure and AWS, where the government regions have a documentation gap.`,
  "Infoblox NIOS 9.1.x Grid setup, HA, joining members, ports, NTP and license documentation; vNIOS for VMware, Azure and AWS installation guides; Book 08, Chapter 08.");
}

// ================================================================== 4 Grid Master
{
  const s = content(P1, "The Grid Master: an HA pair, built in order");
  tag(s, "How");
  flow(s, "GM", 1.5, 1.6, [
    { head: "1 Cable and switch", body: "LAN1 and HA on each node; separate power" },
    { head: "2 Node 1 wizard", body: "Configure a Grid Master: name, secret, VRID, addresses" },
    { head: "3 Node 2 wizard", body: "Join Existing Grid: same name, VIP and secret" },
    { head: "4 Manage by VIP", body: "Then add the candidate and members" },
  ], 11.5);
  panel(s, "Switch", 0.6, 3.3, 6.0, 3.15, HEX.navy, HEX.navyTint, "SWITCH PORTS FOR HA (VRRP)", null, [
    "Spanning tree off or Portfast; no EtherChannel; IGMP snooping off",
    "Trunking off unless you tag VLANs; speed and duplex matched",
    "DHCP snooping off or trusted: it must be off to run DHCP on the Grid",
  ], 11.5);
  panel(s, "Wizard", 6.75, 3.3, 6.0, 3.15, HEX.red, HEX.redTint, "CHANGE THE DEFAULTS", null, [
    "Login admin / infoblox; Grid name Infoblox; shared secret test",
    "VRID unique per subnet (1–255)",
    "Lose the shared secret and only Infoblox Support can help: escrow it",
    "No IPv6 HA on public clouds; under 250 GB of disk, not a Grid Master",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS 9.1.x Creating a Grid Master; HA physical setup; switch port guidelines; Configure a Grid Master and Join Existing Grid wizards.");
  notes(s,
`The Grid Master. Infoblox's sequence is simple: create the Grid Master first, then add members, and build the Grid Master as a high-availability pair.

Physically, cable each node's LAN1 and HA ports to the switch, and put the nodes on separate power circuits where you can. The pair uses VRRP, so the switch ports matter. Spanning tree off, or Portfast. No EtherChannel or port channeling. IGMP snooping off. Trunking off unless you tag VLANs. Speed and duplex matched. And DHCP snooping disabled or trusted; Infoblox says it must be disabled to run DHCP on the Grid.

On node one, run the wizard to configure a Grid Master. It enters the Grid name, the shared secret, a virtual router ID that's unique on the subnet, the virtual address, and each node's addresses, plus the time zone and NTP servers. On node two, run Join Existing Grid with the same name, the virtual address and the secret. After that, manage the pair through the virtual address.

Now the defaults, which you must change: the login is admin and infoblox, the Grid name is Infoblox, and the shared secret is the word test. Escrow the new secret; Infoblox says if you forget it, you have to contact their support. Two more rules: no IPv6 high availability on public clouds, and appliances with less than two hundred fifty gigabytes of disk shouldn't be Grid Masters.`,
  "Infoblox NIOS 9.1.x Creating a Grid Master; Setting up an HA Grid Master (physical placement, LCD); Guidelines for switch ports in an HA pair; Configure a Grid Master wizard; Join Existing Grid wizard; NIOS 9.x guide (disk size rule) from the earlier platform brief.");
}

// ================================================================== 5 GMC, members, ports
{
  const s = content(P1, "The candidate, joining members, and Grid ports");
  tag(s, "How");
  panel(s, "GMC", 0.6, 1.5, 4.0, 3.5, HEX.teal, HEX.tealTint, "GRID MASTER CANDIDATE", null, [
    "Member Properties: Master Candidate; full database copy",
    "Same model as the Grid Master",
    "GMC Promote Test: up to 120 seconds; one at a time; never during an upgrade",
    "Azure NAT: the test fails, promotion works",
  ], 11.5);
  panel(s, "Join", 4.75, 1.5, 3.85, 3.5, HEX.navy, HEX.navyTint, "JOINING MEMBERS", null, [
    "Define the member on the Grid Master first",
    "Join with VIP, Grid name and secret (wizard, GUI or CLI)",
    "Green joined, yellow joining, red not joined",
    "A dual-mode Grid needs a dual-mode candidate",
  ], 11.5);
  table(s, "Ports", 1.5, [1.55, 2.4], ["Port", "Use"], [
    ["UDP 2114", "Key exchange"],
    ["UDP 1194", "Grid VPN tunnel"],
    ["VRRP", "HA, same subnet"],
    ["TCP 647, 7911", "DHCP failover"],
    ["TCP 135/445 + RPC", "Managing Windows"],
    ["TCP 6514", "Secure syslog"],
  ], { x: 8.8, fontSize: 11 });
  callout(s, "FIPSports", 5.2, 1.25, "FaTriangleExclamation", HEX.amber, "FIPS mode changes the ports: ",
    "Grid OpenVPN runs over TCP 22, with 1023 for HA passive to active. Firewall rules written only for 1194 and 2114 won't do (inference).");
  sources(s, "Sources: Infoblox NIOS 9.1.x GMC; GMC Promote Test; Joining appliances; Source and destination ports (v2, Oct. 6, 2026); FIPS/CC enabling page; vNIOS Azure limits.");
  notes(s,
`Next, the Grid Master Candidate. You designate it in the member's properties with the Master Candidate option. It holds a full copy of the database, and it should be the same model as the Grid Master. Infoblox gives you a promote test, which sends crafted packets from the candidate to the members you pick. It runs for at most a hundred twenty seconds, only one candidate can be tested at a time, and never during an upgrade. One quirk: behind NAT in Azure, the test fails but the real promotion works.

Joining members. Define each member on the Grid Master before you configure the appliance. Then join it with the Grid Master's virtual address, the Grid name and the shared secret, through the wizard, Grid Manager or the command line. Status icons show green for joined, yellow for joining and red for not joined. A dual-mode Grid needs a dual-mode candidate.

The ports. Members need UDP 2114 for key exchange and UDP 1194 for the Grid's VPN tunnel to the Grid Master and candidate. HA pairs use VRRP and must share a subnet. DHCP failover uses TCP 647, and 7911 for partner down. Managing Windows servers needs 135, 445 and the dynamic RPC range. And secure syslog uses 6514.

But FIPS mode changes this. The Grid's OpenVPN runs over TCP 22, and port 1023 carries HA passive to active. So, my inference, firewall rules written only for 1194 and 2114 won't be enough on a FIPS Grid.`,
  "Infoblox NIOS 9.1.x Designating a Grid Master Candidate; GMC Promote Test; Joining appliances to the Grid; Defining members; Source and destination ports for services (version 2, dated Oct. 6, 2026); NIOS FIPS/CC Enabling FIPS or CC mode; vNIOS for Azure limitations.");
}

// ================================================================== 6 Time and licenses
{
  const s = content(P1, "Time first, then licenses: two quiet failure modes");
  tag(s, "Why");
  panel(s, "NTP", 0.6, 1.5, 6.0, 4.95, HEX.navy, HEX.navyTint, "TIME (NTP)", "Grid level first, then members", [
    "The Grid Master serves time to members inside the tunnel; if it's offline, members use the external servers",
    "STIG V-285309: external NTP at the Grid level; at least three sources recommended",
    "More than 5 minutes off is stepped at once; less is slewed",
    "Grid sync, GSS-TSIG and DHCP failover all fail without synced clocks",
    "NTP auth keys: MD5, DES, SHA1 only; no SHA-2 key type listed",
  ], 12);
  panel(s, "Lic", 6.75, 1.5, 6.0, 4.95, HEX.red, HEX.redTint, "LICENSES", "A temporary license can evict a member", [
    "Temporary licenses last 60 days, can't be renewed; at expiry the member's services stop and it's evicted from the Grid",
    "Grid-wide licenses bind to the Grid Master; member licenses to a hardware ID",
    "HA pairs: install on both nodes; NIOS and some add-on licenses restart the product",
    "Microsoft Management license expiry stops sync to Windows servers",
    "VMware permanent keys: show hwid, submit; allow 24–48 hours",
  ], 12);
  sources(s, "Sources: Infoblox NIOS 9.1.x NTP pages (Grid, members, auth keys); license types, expiry and installation; vNIOS for VMware licensing; DISA STIG V-285309.");
  notes(s,
`Two quiet failure modes, time and licenses.

Time first. Enable NTP and set the external servers at the Grid level before you configure the Grid Master and members as clients. The Grid Master then serves time to the members inside the encrypted tunnel, and if it goes offline, the candidate and members sync to the external servers. The STIG requires the external servers at the Grid level and recommends at least three. A clock more than five minutes off is stepped immediately; a smaller error is slewed. Time isn't cosmetic here: Grid synchronization, Kerberos-signed updates, and DHCP failover all depend on it. One gap to note for your control mapping: NIOS lists NTP authentication keys of MD5, DES and SHA-1 only, with no SHA-2 option.

Licenses. Member licenses bind to a hardware ID, Grid-wide licenses bind to the Grid Master and replicate, and subscriptions expire with the contract. The trap is the temporary license. It lasts sixty days and can't be renewed, and when it expires, the member's services stop and it's evicted from the Grid. So never let a production member run on one. Install licenses on both nodes of an HA pair, and expect the NIOS and some add-on licenses to restart the product. If the Microsoft Management license expires, synchronization to the Windows servers stops. For VMware, get permanent keys by submitting each VM's hardware ID, and allow a day or two.`,
  "Infoblox NIOS 9.1.x Configuring NTP (Grid and member), NTP clock behavior, NTP authentication keys; License types, Expiring licenses, Installing licenses; vNIOS for VMware obtaining permanent licenses; DISA Infoblox NIOS 9.x STIG V1R1, V-285309.");
}

// ================================================================== 7 vNIOS in clouds
{
  const s = content(P1, "vNIOS on VMware, Azure and AWS");
  tag(s, "What");
  table(s, "vNIOS", 1.5, [1.6, 5.3, 5.25], ["Platform", "What the guides require", "Limits to plan around"], [
    ["VMware", "OVA from the Infoblox Support site; don't change VM settings in vSphere (licensing, join)", "No mixed SR-IOV and non-SR-IOV NICs; cloned VMs unsupported"],
    ["Azure", "Marketplace on Azure public and Azure Government; managed disks; HA from 9.0.4 with a custom role and managed identity", "No DHCP failover behind NAT; no LAN2; no IPv6 HA; HA nodes same region, group, zone and size"],
    ["AWS", "HA from 9.0.4: VPC and subnets, an HA IAM role, a Grid DNS resolver that reaches IAM and EC2", "No IPv6 HA; same region, zone and type; IMDSv2 only from 9.1.0"],
  ], { fontSize: 11.5 });
  label(s, "Gov label", "DOCUMENTATION GAP — ASK INFOBLOX", 0.6, 4.35, 12.15);
  T(s, "Gov", [
    { text: "Cloud HA endpoints list no government regions. ", options: { bold: true, color: HEX.navy } },
    { text: "AWS HA lists global and China endpoints only, not GovCloud; Azure HA needs management.azure.com and login.microsoftonline.com, with no Azure Government equivalents. Failover time depends on the cloud's API. Confirm before relying on vNIOS HA failover in GovCloud or Azure Government." },
  ], { x: 0.6, y: 4.65, w: 12.15, h: 1.1, fontSize: 12.5 });
  T(s, "Managing", [
    { text: "And vNIOS can't manage Windows servers: ", options: { bold: true, color: HEX.red } },
    { text: "Part 2's managing members must be physical appliances." },
  ], { x: 0.6, y: 5.85, w: 12.15, h: 0.6, fontSize: 12.5 });
  sources(s, "Sources: vNIOS for VMware guide; vNIOS for Azure (deployment, HA, limitations v19, Aug. 31, 2026); vNIOS for AWS (HA, limits); NIOS 9.1.x managing-member guidelines.");
  notes(s,
`Virtual appliances, vNIOS, in each environment.

On VMware, the OVA comes from Infoblox's support site, which needs a login. Infoblox says not to change the VM's settings in vSphere, because that may violate the virtual licensing terms and stop the VM joining. Mixed SR-IOV and regular network cards aren't supported, and cloned VMs aren't either.

On Azure, marketplace deployment is supported on Azure public and Azure Government, with managed disks only. High availability arrived in 9.0.4, and needs a custom role and a managed identity. The limits to plan around: DHCP failover doesn't work behind NAT, there's no LAN2, no IPv6 high availability, and both HA nodes must be in the same region, resource group, availability zone and size.

On AWS, high availability also starts at 9.0.4, and needs the VPC and subnets, an HA IAM role, and a Grid DNS resolver that can reach the IAM and EC2 endpoints. Same limits: no IPv6 HA, same region, zone and instance type.

Now the gap. The HA prerequisites list only commercial endpoints. AWS lists the global and China endpoints, not GovCloud. Azure lists management dot azure dot com and login dot microsoftonline dot com, with no Azure Government equivalents. And failover time depends on the cloud's own API. So ask Infoblox, in writing, before you rely on vNIOS failover in either government cloud.

One more constraint that shapes Part 2: vNIOS members can't manage Microsoft servers.`,
  "Infoblox vNIOS for VMware installation guide (OVA, VM settings, SR-IOV); vNIOS for Azure (Marketplace support, managed disks, HA prerequisites, custom role and managed identity, limitations page version 19, Aug. 31, 2026); vNIOS for AWS (HA prerequisites and limitations); NIOS 9.1.x Guidelines for managing Microsoft servers.");
}

// ================================================================== Part 2 divider
{
  const s = divider(P2, "Part 2: Migrate from Microsoft", "Implementation guide  ·  Part 2 of 4",
    ["Manage the Windows servers first, then take over", "Zone import, AD zones and Kerberos-signed updates", "DHCP takeover, failover and rollback"], 14,
    "Sources: Infoblox NIOS 9.1.x Microsoft server, zone import, GSS-TSIG and DHCP failover pages; Microsoft Learn (DNS, DHCP, Kerberos); Book 08 Ch 10.");
  notes(s,
`Part 2: migrate from Microsoft. This is the longest part, because it's where a mistake hurts users.

We'll start with the method Book 08's coexistence phase relies on: Infoblox managing the Windows servers before it takes them over. Then zone import, Active Directory zones and Kerberos-signed dynamic updates, where a Microsoft change from July 2026 breaks the vendor's example. Then the DHCP takeover, which has one destructive step to avoid, DHCP failover and IPv6, and finally how each method rolls back.`,
  "Infoblox NIOS 9.1.x Managing Microsoft Windows servers, Importing zone data, GSS-TSIG and DHCP failover documentation; Microsoft Learn DNS, DHCP and Kerberos RC4 pages; Book 08, Chapter 10.");
}

// ================================================================== 8 Manage then take over
{
  const s = content(P2, "Method A: manage the Windows servers, then take over");
  tag(s, "How");
  panel(s, "How", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "HOW IT WORKS", null, [
    "Agentless over MS-RPC, read-only or read/write; changes sync both ways",
    "Needs the Microsoft Management license",
    "Managing members must be physical, near the DCs; not the Grid Master or candidate",
    "Service account: DnsAdmins, DHCP Administrators, service control rights",
  ], 11.5);
  table(s, "Sync", 1.5, [2.15, 2.2], ["Synced", "Not synced"], [
    ["Forward and reverse zones", "Conditional forwarders"],
    ["AD-integrated zones", "Trust anchors"],
    ["Stub zones, delegations", "Cached and root zones"],
    ["Most record types", "WINS, WINSR, ATMA"],
  ], { x: 4.75, fontSize: 11, firstBold: false });
  panel(s, "Rules", 9.25, 1.5, 3.5, 4.95, HEX.red, HEX.redTint, "RULES THAT BITE", null, [
    "One Windows server syncs into one network view and one DNS view",
    "First sync off-hours",
    "An HA failover mid-sync aborts it; Grid-side changes since the last sync are lost",
  ], 11.5);
  T(s, "Phase", [
    { text: "Book 08 Phase 1 (design guidance): ", options: { bold: true, color: HEX.teal } },
    { text: "add the Windows servers read-only; the synced views become a live inventory. Forwarders and trust anchors still come from the PowerShell export." },
  ], { x: 4.75, y: 4.15, w: 4.35, h: 2.3, fontSize: 12 });
  sources(s, "Sources: Infoblox NIOS 9.1.x Managing Microsoft servers; guidelines; service account rights; what is synchronized; Book 08, Ch 10 (Phase 1 commands).");
  notes(s,
`Method A, which Book 08's coexistence phase leans on: manage the Windows servers first, then take them over.

Grid members manage Windows DNS and DHCP servers without an agent, over Microsoft's RPC protocol, in read-only or read-write mode. Edits sync in both directions. It needs the Microsoft Management license on the managing member, and as we saw, that member must be a physical appliance. Infoblox recommends dedicated managing members close to the Windows servers, not the Grid Master or candidate. The service account needs DnsAdmins for DNS, DHCP Administrators for DHCP, and the right to start and stop the services, rather than full administrator.

What syncs: forward and reverse zones, Active Directory-integrated zones, stub zones, delegations and most record types. What doesn't: conditional forwarders, trust anchors, cached and root zones, and a few legacy record types. So you still need Book 08's PowerShell export to recreate every forwarder.

Three rules that bite. Each Windows server syncs into one network view and one DNS view, so overlapping servers need separate views. Schedule the first sync off-hours. And if an HA managing member fails over mid-sync, that sync aborts, and Grid-side changes made since the last sync are lost.

The program's design guidance: in Phase 1, add the Windows servers read-only, and the synced views become a live inventory alongside the export.`,
  "Infoblox NIOS 9.1.x Managing Microsoft Windows servers; Guidelines for managing Microsoft servers; Requirements for the Microsoft server account; Synchronized data; Book 08, Chapter 10 (Phase 1 illustrative commands); research brief section 2.1.");
}

// ================================================================== 9 Zone import
{
  const s = content(P2, "Method B: import zones by transfer; bulk data by CSV");
  tag(s, "How");
  flow(s, "AXFR", 1.5, 1.5, [
    { head: "1 Allow transfer", body: "On Windows, to the Grid Master's address (VIP on a pair)" },
    { head: "2 Create the zone", body: "Same name on NIOS" },
    { head: "3 Import", body: "One zone with its subzones per run" },
    { head: "4 Validate", body: "Record counts and answers, then flip delegation" },
  ], 11.5);
  panel(s, "What", 0.6, 3.2, 6.0, 3.25, HEX.teal, HEX.tealTint, "WHAT AN IMPORT DOES", null, [
    "Imports A, CNAME, DNAME, SRV, TXT, MX, PTR and host records",
    "Recreates NS and SOA for the new primary: Book 08's never-migrate-the-apex rule",
    "Subzones become delegations; a failed import leaves the zone disabled",
    "Blank-name A or AAAA records need superuser or explicit permission",
  ], 11.5);
  panel(s, "Bulk", 6.75, 3.2, 6.0, 3.25, HEX.amber, HEX.amberTint, "BULK DATA", null, [
    "Data Import Wizard (support login) reads Microsoft, ISC, VitalQIP and CSV",
    "CSV Import can verify a file before it replaces data",
    "Infoblox warns mass imports \"will significantly affect member performance, resulting in service outage\": use a window",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS 9.1.x Importing zone data; Data Import Wizard; CSV Import; Microsoft Learn Set-DnsServerPrimaryZone and zone transfer settings; Book 08 Ch 10.");
  notes(s,
`Method B: import zones by zone transfer.

On NIOS, zone import is a zone transfer. The Windows server must be authoritative and must allow transfers to the destination, which on a Grid is the Grid Master's address, or its virtual address for an HA pair. On Windows, that's one PowerShell command per zone, Set DNS Server Primary Zone, with the secure secondaries setting pointed at the Grid Master. Then create the zone on NIOS with the same name, import it, one zone with its subzones per run, and validate record counts and answers before you change any delegation or forwarder. That's Book 08's cutover loop.

What the import does: it brings in address, alias, service, text, mail, pointer and host records. It recreates the NS and SOA records for the new primary rather than copying them, which matches Book 08's rule to never migrate the zone apex. Subzones become delegations, and their records aren't imported, so import them separately. If an import fails, the zone is left disabled. And records with a blank name need superuser rights or an explicit permission.

For bulk data, Infoblox's Data Import Wizard, from the support site, reads Microsoft, ISC, VitalQIP and CSV formats, and the CSV Import Manager can verify a file before it replaces anything. Infoblox warns that mass imports will significantly affect member performance, resulting in service outage, so run them in a change window.`,
  "Infoblox NIOS 9.1.x Importing zone data; Data Import Wizard; CSV Import Manager; Mass operations guidance; Microsoft Learn Set-DnsServerPrimaryZone (Windows Server 2025 PowerShell) and Configure zone transfer settings; Book 08, Chapter 10 (cutover loop).");
}

// ================================================================== 10 AD zones and GSS-TSIG
{
  const s = content(P2, "AD zones and Kerberos-signed updates: use AES");
  tag(s, "How");
  label(s, "RC4 label", "VENDOR EXAMPLE IS OUT OF DATE", 0.6, 1.45, 12.15);
  T(s, "RC4", [
    { text: "Infoblox's keytab example uses RC4 (-crypto RC4-HMAC-NT). ", options: { bold: true, color: HEX.red } },
    { text: "Microsoft's July 2026 update puts Kerberos RC4 protections into enforcement on domain controllers, with no rollback. Generate the keytab with -crypto AES256-SHA1." },
  ], { x: 0.6, y: 1.75, w: 12.15, h: 0.8, fontSize: 12.5 });
  panel(s, "Default", 0.6, 2.7, 6.0, 3.75, HEX.navy, HEX.navyTint, "BOOK 08 DEFAULT", "Locator zones stay on AD DNS", [
    "Reached by forwarding until the last DC goes",
    "NIOS keytabs (AES) loaded in Phase 2 so DHCP can send signed updates",
    "Infoblox DHCP sends GSS-TSIG updates for one domain per member",
    "Keys survive upgrades; keys without a DNS/ prefix log a warning",
  ], 11.5);
  panel(s, "Alt", 6.75, 2.7, 6.0, 3.75, HEX.teal, HEX.tealTint, "ALTERNATIVE: NIOS HOSTS THE AD ZONE", null, [
    "Transfer from the DC, import the AES keytab, create and import the zone",
    "Allow GSS-TSIG updates; the wizard creates _msdcs, _sites, _tcp, _udp and the partition zones",
    "Clear \"Allow unsigned updates\"",
    "Pages list DCs up to 2016 or 2022; none names Windows Server 2025: confirm",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS 9.1.x keytab generation; AD zone configuration; GSS-TSIG pages; Microsoft Learn RC4 detection and remediation; Windows message center; Book 08 Ch 04.");
  notes(s,
`Active Directory zones and Kerberos-signed dynamic updates. Start with a correction to the vendor's documentation.

Infoblox's NIOS 9.1 page for generating the keytab, the key file NIOS uses for Kerberos-signed updates, shows the ktpass command with RC4 encryption. Microsoft's July 2026 security update moved Kerberos RC4 protections into enforcement mode on domain controllers, with no rollback, and Windows Server 2025 domain controllers don't issue RC4 ticket-granting tickets. So generate the keytab with AES 256. Note that ktpass also resets the account's password and increments its key version.

Book 08's default is that the locator zones stay on AD DNS, reached by forwarding, until the last domain controller goes. Under that default, NIOS still needs AES keytabs, loaded in Phase 2, so that its DHCP can send signed updates. One limit: an Infoblox DHCP server sends signed updates for one domain only, though each member can serve a different domain. Keys survive upgrades.

The alternative is NIOS hosting the AD zone itself. Allow transfers from the domain controller, import the AES keytab, create the zone with the exact AD name, import it, and allow signed updates. The wizard creates the underscore zones, such as underscore msdcs and underscore sites. Then clear the option that allows unsigned updates. But the Infoblox pages list domain controllers up to 2016 on one page and 2022 on another, and none names Windows Server 2025. Confirm support before you take this path.`,
  "Infoblox NIOS 9.1.x Generating the keytab file (Windows Server 2016/2019/2022); Configuring DNS for Active Directory; Configure Active Directory wizard; About GSS-TSIG; Kerberos behavior; GSS-TSIG and upgrades; Microsoft Learn Detect and remediate RC4 usage in Kerberos; Windows message center (July 2026 enforcement); Book 08, Chapter 04.");
}

// ================================================================== 11 DHCP takeover
{
  const s = content(P2, "DHCP takeover: change assignments, never remove first");
  tag(s, "How");
  label(s, "Danger", "DESTRUCTIVE — ORDER MATTERS", 0.6, 1.45, 12.15);
  T(s, "Delete", [
    { text: "Removing a managed Windows DHCP server deletes \"all the DHCP ranges, leases, and fixed addresses\" synced from it. ", options: { bold: true, color: HEX.red } },
    { text: "Take the scopes over first; remove the server from management last." },
  ], { x: 0.6, y: 1.75, w: 12.15, h: 0.8, fontSize: 12.5 });
  flow(s, "Take", 2.7, 1.75, [
    { head: "1 Fixed addresses", body: "Set each to server None" },
    { head: "2 Ranges", body: "Set each to None" },
    { head: "3 Network", body: "Replace the Windows server with a Grid member" },
    { head: "4 Assign ranges", body: "To that member" },
    { head: "5 Restart", body: "Services; old leases clear" },
  ], 11);
  panel(s, "Client", 0.6, 4.6, 6.0, 1.85, HEX.navy, HEX.navyTint, "THE CLIENT SIDE (MICROSOFT)", null, [
    "Renew by unicast to the old server at 50%; rebind by broadcast at 87.5%",
    "Stop the old scope answering, or clients keep its options",
  ], 11.5);
  panel(s, "Pilot", 6.75, 4.6, 6.0, 1.85, HEX.amber, HEX.amberTint, "PILOT IT (INFERENCE)", null, [
    "Not documented: whether clients keep the same address",
    "Lower lease times ahead of the change to shorten the transition",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS 9.1.x Modifying DHCP server assignments; Removing Microsoft servers; Synchronized DHCP data; Microsoft Learn DHCP troubleshooting; Book 08 Ch 10.");
  notes(s,
`The DHCP takeover, which has one destructive trap.

Infoblox documents that when you remove a managed Windows DHCP server from Grid management, Grid Manager deletes all the DHCP ranges, leases and fixed addresses associated with it. So the order is: take the scopes over first, and remove the server from management last.

The takeover itself is five steps, from Infoblox's page on modifying DHCP server assignments. Set every fixed address in the scope to the server None. Set every range served by the Windows server to None. In the network's member assignment, replace the Windows server with a Grid member. Assign the ranges to that member. Then restart services. Infoblox says you don't need to clear the old leases, because the member clears them when the assignment changes.

Now the client side, from Microsoft's documentation. Windows clients renew by unicast to the server that issued the lease at half the lease time, and rebind by broadcast to any server at eighty-seven and a half percent. So the old Windows scope must stop answering, deactivated or with the service stopped, or clients keep renewing with it and keep its options, including the DNS servers in option six.

What isn't documented is whether a client keeps the same address across the takeover. My inference: pilot it on one scope, and lower lease times beforehand to shorten the transition. Then follow Book 08's last step, de-authorizing the old server.`,
  "Infoblox NIOS 9.1.x Modifying DHCP server assignments; Removing a Microsoft server from Grid management; Synchronized DHCP data; Microsoft Learn Troubleshoot problems on the DHCP client (renewal at 50 and 87.5 percent); Book 08, Chapter 10 (Phase 3 DHCP scopes, Phase 5 de-authorization).");
}

// ================================================================== 12 DHCP failover and DHCPv6
{
  const s = content(P2, "DHCP failover and DHCPv6 on NIOS");
  tag(s, "What");
  table(s, "FO", 1.5, [2.6, 4.6], ["Failover rule", "What NIOS documents"], [
    ["Peers", "Two NIOS servers, or NIOS and an ISC-compliant server"],
    ["Windows partners", "A mixed Windows and NIOS pair isn't offered: move both partners together"],
    ["Ports", "TCP 647 between peers (519 on upgraded Grids); 7911 for partner down"],
    ["Defaults", "50/50 load balance; MCLT 1 hour. Keep both"],
    ["One association", "Each pair joins only one; IPv4 ranges in one network view"],
    ["Order", "Configure everything, then enable DHCP"],
  ], { fontSize: 11.5 });
  panel(s, "V6", 7.95, 1.5, 4.8, 3.6, HEX.teal, HEX.tealTint, "DHCPV6", "No failover: use an HA member", [
    "An IPv6 range is served by one Grid member",
    "Redundancy from an HA pair's virtual address",
    "Or non-overlapping ranges on two members (inference)",
    "Windows DHCPv6 has no failover either",
  ], 11.5);
  callout(s, "GM", 5.35, 1.1, "FaTriangleExclamation", HEX.amber, "Placement: ",
    "the Grid Master plays no part in failover; peers talk directly. vNIOS on Azure: no failover behind NAT. Universal DDI can't manage NIOS failover associations.");
  sources(s, "Sources: Infoblox NIOS 9.1.x DHCP failover associations; IPv6 ranges; bloxHA; DHCPv6 lease affinity; vNIOS Azure limits; Microsoft Learn DHCP failover.");
  notes(s,
`DHCP failover, and IPv6.

The rules, from Infoblox's failover page. Peers are two NIOS servers, or NIOS and an ISC-compliant server; at least one must be NIOS. A mixed pair of Windows and NIOS isn't offered, and that's why Book 08 says to move both partners of a Windows failover relationship together. Peers talk on TCP 647 by default, or 519 on Grids upgraded from older versions, and on 7911 for partner down. The defaults are a fifty-fifty load balance and a maximum client lead time of one hour, and Infoblox says not to change them unless you understand the consequences. Each pair of servers can be in only one association, covering IPv4 ranges in one network view. And configure everything before you enable DHCP.

One correction to a common assumption: the Grid Master plays no part in failover. The peers talk directly. On Azure, failover doesn't work behind NAT, and Universal DDI's portal can't manage NIOS failover associations.

Then IPv6. An IPv6 range is served by a single Grid member; there's no failover association for it. So redundancy comes from making that member an HA pair, served through its virtual address, or, by my inference, from non-overlapping ranges on two members. That isn't a regression: Microsoft's DHCPv6 has no failover either.`,
  "Infoblox NIOS 9.1.x Configuring DHCP failover associations (rules, ports, load balance, MCLT); IPv6 range wizard; About bloxHA; DHCPv6 lease affinity; vNIOS for Azure limitations; earlier platform brief (Universal DDI hybrid limits); Microsoft Learn DHCP failover overview.");
}

// ================================================================== 13 Rollback
{
  const s = content(P2, "Rollback: what reverses, and how");
  tag(s, "How");
  table(s, "RB", 1.5, [2.6, 5.15, 4.4], ["Method", "How it rolls back", "Watch for"], [
    ["Managed, read-only", "Stop managing the server; Windows data is untouched", "Nothing changed on Windows"],
    ["Managed, read/write", "Changing the managing member or going read-only reverts Grid edits since the last sync", "Edits lost silently"],
    ["Zone import", "Windows stays authoritative until delegation or forwarders change; NIOS can restore zone data", "Book 08's cutover loop is the real rollback point"],
    ["DHCP takeover", "Reverse the assignments, reactivate the Windows scope, renew (inference)", "No Infoblox rollback procedure found"],
    ["NIOS config errors", "Database snapshot: faster than a restore, database only", "One snapshot; promotion, upgrade or restore deletes it"],
  ], { fontSize: 11.5 });
  callout(s, "Rule", 5.0, 1.4, "FaUserShield", HEX.teal, "Book 08's rule holds: ",
    "each phase ends with a rollback point and a resolution-path consistency test, not a calendar date. Archive the Windows exports before anything is removed.");
  sources(s, "Sources: Infoblox NIOS 9.1.x Microsoft server modes; zone import and restore; DHCP server assignments; database snapshots; Book 08, Ch 10.");
  notes(s,
`Rollback, method by method.

If you're managing the Windows servers read-only, rollback is simply to stop managing them; nothing on Windows changed. In read-write mode, be careful: changing the managing member, or switching to read-only, reverts any Grid Manager edits made since the last sync, silently.

For zone import, the Windows zone stays authoritative until you change delegation or forwarders, so Book 08's cutover loop is the real rollback point, and NIOS can also restore zone data after an import.

For the DHCP takeover, I found no Infoblox rollback procedure. My inference, mirroring the forward steps: reverse the server assignments, reactivate the Windows scope, and let clients renew.

For configuration mistakes on NIOS itself, there's the database snapshot, which you take from Grid Manager. Rolling back to it is faster than a restore, but it covers only the database. There's only one, and a candidate promotion, an upgrade or a restore deletes it. Don't use it to undo migration data that clients already depend on.

And Book 08's rule holds throughout: each phase ends with a rollback point and a resolution-path consistency test, not a calendar date, and the Windows exports are archived before anything is removed.`,
  "Infoblox NIOS 9.1.x Microsoft server management modes; Importing zone data and Restoring zone data; Modifying DHCP server assignments; Database snapshots; earlier divisions brief (read/write revert behavior); Book 08, Chapter 10.");
}

// ================================================================== Part 3 divider
{
  const s = divider(P3, "Part 3: Sign and harden", "Implementation guide  ·  Part 3 of 4",
    ["DNSSEC parameters, signing and DS publication", "The HSM, and the DISA NIOS 9.x STIG", "FIPS mode and administrator access"], 12,
    "Sources: Infoblox NIOS 9.1.x DNSSEC and HSM pages; NIOS FIPS/CC pages; DISA Infoblox NIOS 9.x STIG V1R1; Book 08 Ch 06.");
  notes(s,
`Part 3: sign and harden.

First DNSSEC on NIOS: how signing works on a Grid, the parameters to set before you sign, and how to publish DS records. Then the hardware security module. Then what the DISA STIG for NIOS 9 actually checks, which is narrower than people assume. Then the FIPS mode procedure, and finally hardening administrator access, including two upgrade gates that can lock people out.`,
  "Infoblox NIOS 9.1.x DNSSEC and HSM documentation; NIOS FIPS and CC mode documentation; DISA Infoblox NIOS 9.x STIG V1R1; Book 08, Chapter 06.");
}

// ================================================================== 14 DNSSEC parameters
{
  const s = content(P3, "DNSSEC on NIOS: set parameters before you sign");
  tag(s, "How");
  table(s, "Params", 1.5, [2.2, 3.0, 3.6], ["Parameter", "NIOS default", "Set it to"], [
    ["Algorithm", "RSA/SHA1 (KSK and ZSK)", "RSA/SHA-256, or ECDSA P-256 or P-384"],
    ["ZSK size", "1024 bits", "2048 bits for RSA (KSK at least as large)"],
    ["Signature validity", "4 days", "Within the STIG's 2 to 7 days"],
    ["Denial of existence", "NSEC3", "NSEC3 for external zones (STIG)"],
    ["ZSK rollover", "30 days, pre-publish", "Keep pre-publish"],
    ["KSK rollover", "1 year, automatic, on", "Keep; notify on manual DS updates"],
  ], { fontSize: 11.5 });
  panel(s, "How", 9.0, 1.5, 3.75, 4.95, HEX.navy, HEX.navyTint, "HOW SIGNING WORKS", null, [
    "Only the Grid Master signs, as hidden primary",
    "Signing makes it the zone's primary",
    "Grid DNS Properties, Advanced Mode, DNSSEC; zones can override",
    "Sign from the DNSSEC toolbar; schedulable",
  ], 11.5);
  T(s, "NSEC", [
    { text: "A documented decision: ", options: { bold: true, color: HEX.amber } },
    { text: "Book 08 Ch 06 records NIST SP 800-81r3's preference for NSEC; the STIG requires NSEC3 externally. Decide for internal zones." },
  ], { x: 0.6, y: 5.0, w: 8.2, h: 0.75, fontSize: 12 });
  T(s, "Change", [
    { text: "Changing a signed zone's algorithm: ", options: { bold: true, color: HEX.red } },
    { text: "add, wait past the TTLs, update the parent DS, then remove the old one." },
  ], { x: 0.6, y: 5.8, w: 8.2, h: 0.65, fontSize: 12 });
  sources(s, "Sources: Infoblox NIOS 9.1.x DNSSEC parameters; signing zones; ZSK and KSK rollover; DISA STIG V-285246, V-285265, V-285274, V-285279; Book 08 Ch 06.");
  notes(s,
`DNSSEC on NIOS. On a Grid, only the Grid Master signs, acting as a hidden primary, and signing a zone makes it the zone's primary server. You set the parameters in the Grid's DNS properties, in advanced mode, and individual zones can override them.

Set them before you sign anything, because the defaults fail the STIG. The default algorithm is RSA with SHA-1, for both keys. Change it to RSA with SHA-256, or ECDSA with P-256 or P-384. The default zone-signing key is 1024 bits; raise it to 2048 for RSA, and keep the key-signing key at least as large, which is Infoblox's own advice. Book 08 Chapter 06, citing NIST, says RSA keys of at least 2048 bits, with elliptic curve preferred.

The other defaults are fine. Signature validity is four days, inside the STIG's two-to-seven-day window. Denial of existence is NSEC3, which the STIG requires for external zones. Zone-signing keys roll every thirty days by pre-publication, which Infoblox recommends. Key-signing keys roll yearly, automatically, with notifications when the parent's DS record needs a manual update.

One decision to document: Book 08 records NIST's preference for NSEC, while the STIG requires NSEC3 externally. Decide it for internal zones.

And if you ever change a signed zone's algorithm: add the new one, wait longer than the record lifetimes, update the parent's DS, and only then remove the old one.`,
  "Infoblox NIOS 9.1.x Configuring DNSSEC parameters (defaults and recommendations); Signing a zone; ZSK rollover; KSK rollover and notifications; Changing algorithms; DISA Infoblox NIOS 9.x STIG V1R1 rules V-285246, V-285265, V-285274 and V-285279; Book 08, Chapter 06 (NIST SP 800-81r3).");
}

// ================================================================== 15 HSM and DS
{
  const s = content(P3, "The HSM and DS publication");
  tag(s, "How");
  panel(s, "HSM", 0.6, 1.5, 6.0, 4.95, HEX.navy, HEX.navyTint, "HARDWARE SECURITY MODULE", null, [
    "Superuser only; one HSM group at a time; deleting a group is permanent",
    "Thales Luna (TCP 1792) or Entrust nShield (TCP 9004)",
    "Register the Grid Master and the candidate (Luna: distinct names in HA, VIP route; nShield: enroll both)",
    "Enable HSM Signing at Grid level; signing moves to the HSM at the next key rollover",
    "NIOS never deletes keys from the HSM; SNMP traps report signing results",
  ], 11.5);
  panel(s, "DS", 6.75, 1.5, 6.0, 3.3, HEX.teal, HEX.tealTint, "PUBLISHING DS RECORDS", null, [
    "Parent zone in the same Grid: DS inserted automatically",
    "Otherwise Export Trust Anchors: DNSKEY, DS or BIND format",
    "Exports carry SHA-1 and SHA-256 digests: submit only SHA-256 (inference)",
    "Check KSK Rollover Due lists keys due within a week",
  ], 11.5);
  T(s, "Move", [
    { text: "Moving signed zones from Windows (Book 08 Ch 06): ", options: { bold: true, color: HEX.red } },
    { text: "finish rollovers, sign on NIOS, publish the new DS, validate, then stop the old signing. NIOS doesn't sync Windows trust anchors." },
  ], { x: 6.75, y: 4.95, w: 6.0, h: 1.5, fontSize: 12 });
  sources(s, "Sources: Infoblox NIOS 9.1.x HSM groups (Luna, nShield, enabling); trust anchor export; KSK rollover due; ports page; Book 08 Ch 06.");
  notes(s,
`The hardware security module, and publishing DS records.

The HSM is configured by a superuser, one HSM group at a time, and deleting a group is permanent. NIOS supports Thales Luna, on TCP 1792, and Entrust nShield, on TCP 9004. Register both the Grid Master and the candidate with it, because the candidate becomes the signer after a promotion. For Luna, generate client certificates for both, give HA nodes distinct names, and add a route for the Grid's virtual address. For nShield, enroll both addresses. Then enable HSM signing, which is a Grid-level setting. Signing moves to the HSM at the next key rollover, not immediately. Key lifecycle lives on the HSM, and NIOS never deletes keys from it. The Grid sends SNMP traps on signing success or failure.

Publishing DS records. If the parent zone is in the same Grid, NIOS inserts the DS records automatically. Otherwise, export the trust anchors, as DNSKEY, DS, or BIND format. The exported DS file carries both SHA-1 and SHA-256 digests; my inference is to submit only the SHA-256 one to the parent. And the Check KSK Rollover Due tool lists keys due within a week.

For zones already signed on Windows, follow Book 08 Chapter 06's order: finish any rollover, sign on NIOS, publish the new DS, validate, and only then stop the old signing. NIOS doesn't sync Windows trust anchors, so recreate them.`,
  "Infoblox NIOS 9.1.x HSM groups overview, Thales Luna configuration, Entrust nShield configuration, Enabling HSM signing; Exporting trust anchors; Check KSK rollover due; Source and destination ports; Book 08, Chapter 06.");
}

// ================================================================== 16 STIG
{
  const s = content(P3, "What the DISA NIOS 9.x STIG checks");
  tag(s, "What");
  panel(s, "Cat1", 0.6, 1.5, 5.0, 4.95, HEX.red, HEX.redTint, "THE FIVE CAT I RULES", null, [
    "Grid Master stealth in every zone and NS group (not a finding with an HSM)",
    "DNSSEC enabled and validating",
    "The approved federal LTS version, under maintenance",
    "FIPS-validated crypto: no RSA/SHA-1 (N/A in FIPS mode)",
    "No DSA for DNSSEC",
  ], 12);
  table(s, "Cat2", 1.5, [2.5, 4.45], ["40 CAT II areas", "Examples"], [
    ["Transfers, updates", "Named secondaries only; GSS-TSIG or ACLs for dynamic updates"],
    ["Architecture", "Internal and external roles split; no recursion on external authoritative"],
    ["Admin access", "MFA policy with a remote service; password policy; approved CAs only"],
    ["Logging", "External syslog plus Copy Audit Log Message to Syslog"],
    ["Resilience", "Documented primary promotion; HSM signing; NTP"],
  ], { x: 5.8, fontSize: 11 });
  T(s, "Scope", [
    { text: "Scope: DNS only. ", options: { bold: true, color: HEX.navy } },
    { text: "V1R1 (Aug. 2026), 45 rules. DHCP and IPAM hardening aren't in it; it's written for DoW, and other agencies may use it. Check settings at the zone level, not just the Grid." },
  ], { x: 5.8, y: 5.3, w: 6.95, h: 1.15, fontSize: 12 });
  sources(s, "Sources: DISA Infoblox NIOS 9.x STIG V1R1 XCCDF and Overview (benchmark July 28, 2026; downloaded Oct. 22, 2026); earlier federal brief (8.x STIG).");
  notes(s,
`What the DISA STIG for NIOS 9 actually checks.

Version one, release one, accepted in August 2026, has forty-five rules: five in category one and forty in category two. Its scope is only the DNS capabilities of the appliance. DHCP and IPAM hardening aren't in it, so those rely on the program's own baseline. It was written for the Department of War, and the overview says other agencies are free to use it, though some settings may not fit.

The five category one rules. The Grid Master is stealth, hidden, in every zone and name server group, which isn't a finding if the keys are on an HSM. DNSSEC is enabled and validating. NIOS runs the current approved long-term-support version for federal systems, under maintenance. Cryptography is FIPS-validated, so no RSA with SHA-1, which doesn't apply on a FIPS-mode Grid. And no DSA for DNSSEC.

The forty category two rules group into areas. Zone transfers only to named secondaries, and dynamic updates restricted by Kerberos signing or access lists. Internal and external roles kept apart, with no recursion on external authoritative servers. Administrator access through a multi-factor policy with a remote service, a password policy, and only approved CAs. External syslog plus a copy of the audit log to syslog. And resilience: a documented primary promotion procedure, HSM signing, and NTP.

One practical point from the overview: check these settings at the zone level, not only at the Grid level.`,
  "DISA Infoblox NIOS 9.x STIG V1R1: XCCDF benchmark (July 28, 2026) and Overview document, downloaded Oct. 22, 2026 and re-read Oct. 23, 2026; rules V-285229, V-285259, V-285269, V-285274, V-285279 and the CAT II rules cited in research brief section 5.1; earlier federal brief (Infoblox 8.x DNS STIG V1R4).");
}

// ================================================================== 17 FIPS procedure
{
  const s = content(P3, "FIPS mode: the procedure and what it changes");
  tag(s, "How");
  flow(s, "FIPS", 1.5, 1.6, [
    { head: "1 reset all", body: "Factory reset from the CLI" },
    { head: "2 Network, licenses", body: "Before the mode is set" },
    { head: "3 Shared secret", body: "20 to 64 characters in FIPS or CC mode" },
    { head: "4 set fips_mode", body: "Or set cc_mode" },
    { head: "5 Reboot", body: "Self-tests run; a failure loops" },
  ], 11);
  panel(s, "Changes", 0.6, 3.3, 6.0, 3.15, HEX.red, HEX.redTint, "WHAT CHANGES", null, [
    "Only TLS 1.2 and 1.3; DES-CBC-MD5, DSA, RSASHA1, MD5 flagged",
    "Portal and cloud connections off, and not restored if FIPS is turned off",
    "Rulesets and modulesets uploaded by hand",
    "In CC mode the CLI is console-only",
  ], 11.5);
  panel(s, "Order", 6.75, 3.3, 6.0, 3.15, HEX.navy, HEX.navyTint, "ORDER AND UPKEEP", null, [
    "On an HA pair, set the mode on each node before forming the pair",
    "Join reporting and other special members before enabling (9.0.7+)",
    "After upgrading a FIPS Grid, run set distributed_grid_comm_mode",
    "Change the local admin on first login",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS FIPS/CC mode: Enabling FIPS or CC mode; Guidelines for FIPS/CC mode; DISA STIG V-285274.");
  notes(s,
`FIPS mode: the procedure, and what it changes.

The procedure has five steps. Run reset all, the factory reset. Configure the network and licenses. Change the Grid's shared secret, which in FIPS or Common Criteria mode must be twenty to sixty-four characters. Run set fips mode, or set cc mode. The appliance reboots and runs self-tests, and if a self-test fails, it loops on the console. On an HA pair, set the mode on each node before you form the pair. Join any reporting or other special members before you enable it. And after you upgrade a FIPS Grid, run the distributed Grid communication mode command to make Grid traffic compliant; a banner reminds you until you do.

What changes. Only TLS 1.2 and 1.3 stay enabled, and Infoblox flags DES, DSA, RSA with SHA-1 and MD5 as not compliant with FIPS 140-3. Portal and cloud connections are disabled, and they aren't restored if FIPS mode is later turned off. Threat rulesets and module sets have to be uploaded by hand. In Common Criteria mode the command line is console-only. The local admin password must be changed on first login.

On the STIG side, the rule against RSA with SHA-1 doesn't apply to a FIPS-mode Grid. But remember slide three: the certificates themselves are still pending.`,
  "Infoblox NIOS FIPS and CC mode: Enabling FIPS or CC mode (procedure, HA, shared secret, distributed Grid communication mode); Guidelines for FIPS/CC mode (algorithms, TLS, portal, rulesets, CLI); DISA Infoblox NIOS 9.x STIG V1R1, V-285274.");
}

// ================================================================== 18 Admin access
{
  const s = content(P3, "Administrator access and two upgrade gates");
  tag(s, "Who");
  panel(s, "Auth", 0.6, 1.5, 6.0, 3.45, HEX.navy, HEX.navyTint, "SIGN-IN AND REACH", null, [
    "PIV through X.509 client certificates with OCSP; admin name matches the CN, or SAN UPN or email",
    "SAML (Entra) with group mapping; SAML-only users get no CLI",
    "GUI and API on the MGMT port; set security limits source addresses",
    "Consent banner (up to 10,000 characters); local admin kept as break-glass",
  ], 11.5);
  panel(s, "Gates", 6.75, 1.5, 6.0, 3.45, HEX.red, HEX.redTint, "9.1.0 UPGRADE GATES", null, [
    "Non-compliant admin usernames fail the test upgrade, and those users can't log in after it",
    "Check first: show non_compliant_usernames",
    "TLS 1.0 and 1.1 must be off before the upgrade",
  ], 11.5);
  T(s, "STIG", [
    { text: "STIG evidence: ", options: { bold: true, color: HEX.teal } },
    { text: "an authentication policy with at least one remote service and the \"Two-Factor Authentication Enabled\" banner; a password policy; only the agency's approved CAs in Manage CA Certificates (the STIG names DoW PKI; a civilian reading, inference)." },
  ], { x: 0.6, y: 5.1, w: 12.15, h: 1.35, fontSize: 12.5 });
  sources(s, "Sources: earlier divisions brief (CAC/PIV, SAML); NIOS 9.1.x set security, MGMT port, consent banner; 9.1.0 upgrade guidelines; DISA STIG V-285296, V-285297, V-285260.");
  notes(s,
`Administrator access, and two upgrade gates.

Administrators sign in with PIV through X.509 client-certificate authentication, checked by OCSP. The administrator's name must match the certificate's common name, or NIOS can match on the UPN or email in the subject alternative name. SAML works too, with Entra and group mapping, but SAML-only users have no command line. Put the GUI and API on the management port; serving them on both management and LAN1 is off by default. Use the set security command to restrict which source addresses can reach the GUI. Add the notice and consent banner, which can be up to ten thousand characters. And keep the local admin as break-glass for directory outages.

Now two gates in the 9.1.0 upgrade that can lock people out. The test upgrade fails on administrator usernames that don't comply, for example ones that don't start with a letter or that mix scripts, and non-compliant users can't log in after the upgrade. Check first with the show non-compliant usernames command. And TLS 1.0 and 1.1 must be turned off before the upgrade.

For the STIG, the evidence is an authentication policy that includes at least one remote service, with the two-factor banner showing, a password policy, and only approved CAs in the certificate list. The STIG names the Department of War's PKI; my inference is that a civilian agency reads that as its own approved CA set.`,
  "Earlier divisions brief (CAC/PIV and SAML authentication on NIOS); Infoblox NIOS 9.1.x set security command; Using the MGMT port; Notice and consent banner; NIOS upgrade guidelines for 9.1.0 (usernames, TLS); DISA Infoblox NIOS 9.x STIG V1R1, V-285296, V-285297 and V-285260.");
}

// ================================================================== Part 4 divider
{
  const s = divider(P4, "Part 4: Operate and evidence", "Implementation guide  ·  Part 4 of 4",
    ["Upgrades, LTS and patching", "Backup, restore and Grid Master recovery", "Logging, automation, and the build mapped to Book 08's phases"], 15,
    "Sources: Infoblox NIOS upgrade, backup, GMC, logging and Data Connector pages; Terraform and Ansible repos; CISA KEV; Book 08 Ch 10–11.");
  notes(s,
`Part 4: operate and evidence.

First upgrades: the five steps, the point at which you can no longer go back, and long-term support. Then patching. Then backup and restore, and how to recover if the Grid Master is lost. Then logging to the SIEM, and what can and can't be automated. And finally the whole build mapped onto Book 08's six phases, with the decisions and vendor asks to close.`,
  "Infoblox NIOS upgrade, backup and restore, Grid Master Candidate, logging and Data Connector documentation; terraform-provider-nios and infoblox-ansible repositories; CISA KEV catalog; Book 08, Chapters 10 and 11.");
}

// ================================================================== 19 Upgrades
{
  const s = content(P4, "Upgrades: five steps, and the point of no return");
  tag(s, "How");
  flow(s, "Up", 1.5, 1.55, [
    { head: "1 Download", body: "Release notes first (support login)" },
    { head: "2 Upload", body: "To the active Grid Master node" },
    { head: "3 Distribute", body: "Removes the older revert image", color: HEX.red, tint: HEX.redTint },
    { head: "4 Test", body: "Mandatory from 9.1.0; no service impact" },
    { head: "5 Upgrade", body: "By upgrade group" },
  ], 11);
  panel(s, "During", 0.6, 3.2, 6.0, 3.25, HEX.navy, HEX.navyTint, "DURING A FULL UPGRADE", null, [
    "Scheduled and approval tasks are deleted",
    "Don't change member DNS or DHCP properties, restart unupgraded members, or rename",
    "HA pairs fail over; upgrade the candidate right after the Grid Master",
    "Finish in a couple of days; nine days triggers a warning",
  ], 11.5);
  panel(s, "Revert", 6.75, 3.2, 6.0, 3.25, HEX.red, HEX.redTint, "REVERT AND LTS", null, [
    "One member: while paused, within its window (default 24 hours)",
    "Whole Grid: restarts at once; changes since, new leases included, are lost",
    "LTS: 9.0.6 (April 2025) began a 24-month train; window to about April 2027 (inference)",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS upgrade guide: five steps, distribution, test upgrade, full and lite, groups, revert; 9.1.0 guidelines; earlier platform brief (LTS).");
  notes(s,
`Upgrades. Infoblox's process has five steps: download, upload to the Grid Master, distribute, test, and upgrade. Read the release notes first; they list the addressed CVEs, and they're behind the support login.

Upload goes to the active Grid Master node. If it fails over before distribution, upload again.

Distribution is the point of no return. It loads the new software into the alternate partition, which removes the ability to revert to the version you had before. And once it starts, you can't add, remove or regroup members.

The test upgrade is mandatory from 9.1.0 onward. It doesn't affect services, and it reports data translation errors before they hurt you.

Then the upgrade itself runs by upgrade group. During a full upgrade, scheduled and approval tasks are deleted, so recreate them after. Don't change member DNS or DHCP properties, restart members not yet upgraded, or rename members. HA pairs fail over, and if DNSSEC operations are in flight, upgrade the candidate right after the Grid Master. Infoblox expects you to finish within a couple of days, and warns at nine.

Reverting one member is possible only while the upgrade is paused, within its revert window, twenty-four hours by default. Reverting the whole Grid restarts it at once and loses every change since, including new leases.

Long-term support: 9.0.6 in April 2025 started a twenty-four-month train, so by my inference its window runs to about April 2027. Confirm the approved federal build on the support portal.`,
  "Infoblox NIOS upgrade guide: Upgrading NIOS (five steps), Uploading, Distributing, Test upgrade, Full and lite upgrades, Upgrade groups, During the upgrade, Reverting a member, Reverting the Grid; Upgrade guidelines for NIOS 9.1.0; earlier platform brief (LTS program).");
}

// ================================================================== 20 Patching
{
  const s = content(P4, "Patching: hotfixes, images and known exploits");
  tag(s, "How");
  table(s, "Patch", 1.5, [2.8, 9.35], ["Item", "What to do"], [
    ["Hotfix", "Back up; Grid, Upgrade, Apply Hotfix to the Grid Master and all members; check show action_to_activate_hotfix; reboot if required"],
    ["Later joiners", "Members that join after a hotfix must have it applied again; a custom hotfix needs Support first"],
    ["Common Criteria Grids", "Upload the .bin2 upgrade image, not .bin"],
    ["Threat Insight in 9.1.0", "Use the nios-with-ti image if the Grid has Threat Insight or IB-FLEX licenses, or distribution fails"],
    ["CISA KEV", "Catalog 2026.10.21: no Infoblox product listed; it does list ISC BIND CVE-2015-5477 (added Oct. 8, 2026)"],
  ], { fontSize: 11.5 });
  callout(s, "BIND", 4.75, 1.3, "FaFilter", HEX.amber, "Watch BIND advisories too: ",
    "NIOS 9.1 ships BIND 9.20, so ISC's advisories and KEV entries for BIND are part of the patch watch, not only Infoblox's own.");
  sources(s, "Sources: Infoblox NIOS upgrade guide (hotfixes); NIOS 9.1.x upgrade image notes; 9.1.0 guidelines; CISA KEV JSON feed (catalog 2026.10.21); earlier platform brief.");
  notes(s,
`Patching.

Infoblox's hotfix procedure: back up first, then in Grid Manager apply the hotfix to the Grid Master and every member, upload it, and use the show action to activate hotfix command to see whether a member needs a reboot. Two catches. Members that join the Grid after a hotfix must have it applied again. And a custom hotfix has to go through Infoblox Support first.

On a Common Criteria Grid, upload the dot bin two upgrade image, not the plain dot bin. And in 9.1.0, if the Grid has Threat Insight or flex licenses, use the image that includes Threat Insight, or distribution fails.

For known exploited vulnerabilities, I checked CISA's catalog, version 2026.10.21, with 1,754 entries. It lists no Infoblox product. It does list an old ISC BIND vulnerability, CVE-2015-5477, added on October eighth, 2026, with a short remediation deadline. Because NIOS 9.1 ships BIND 9.20, the program's patch watch covers ISC's BIND advisories and the catalog's BIND entries, not only Infoblox's own notices. Map each against the release notes' list of addressed CVEs.`,
  "Infoblox NIOS upgrade guide: Applying consolidated hotfixes; NIOS 9.1.x uploading upgrade images (bin2 for CC); Upgrade guidelines for NIOS 9.1.0 (Threat Insight image); CISA Known Exploited Vulnerabilities catalog JSON feed, catalog version 2026.10.21; earlier platform brief (BIND 9.20).");
}

// ================================================================== 21 Backup and DR
{
  const s = content(P4, "Backup, restore and Grid Master recovery");
  tag(s, "How");
  panel(s, "Backup", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "BACKUP", null, [
    "Automatic backup is off by default: schedule it",
    "SCP (SSHv2), not FTP (clear-text credentials)",
    "SCP uses LAN1 even with MGMT enabled",
    "Back up before upgrades, restores, reverts, and after a Grid mode change",
  ], 11.5);
  panel(s, "Restore", 4.75, 1.5, 3.85, 4.95, HEX.red, HEX.redTint, "RESTORE", null, [
    "SCP isn't a restore source: stage the file back first (inference)",
    "Same version, or a later one on a supported path",
    "Overwrites everything and reboots",
    "CC-mode backups restore only to CC appliances",
  ], 11.5);
  panel(s, "DR", 8.75, 1.5, 4.0, 4.95, HEX.teal, HEX.tealTint, "PROMOTE THE CANDIDATE", null, [
    "Check 1194 and 2114 from candidate to members",
    "Console or SSH: set promote_master",
    "Notify members sequentially (default 120 seconds apart)",
    "Verify every member reconnected; update anything pointing at the old Grid Master",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS backup and restore; database snapshots; Promoting a Grid Master Candidate; DISA STIG V-285271, V-285273.");
  notes(s,
`Backup, restore, and recovering the Grid Master.

Backup first. Automatic backup is off by default, so schedule it. Send it by SCP, over SSH version two, not FTP, which sends credentials in clear text. One detail: SCP uses LAN1 even when the management port is enabled, so the firewall path has to allow it. Back up before every upgrade, restore or revert, and again after changing the Grid's IP mode, because restoring an older backup afterward can stop members rejoining.

Restore. SCP isn't listed as a restore source; the choices are your computer, TFTP, FTP or the Grid Master's local backups. My inference is to copy SCP backups back to the management system and restore from there, and to rehearse that. You can restore to the same version, or to a later one on a supported path. A restore overwrites everything and reboots, and a backup taken in Common Criteria mode restores only to compliant appliances.

Recovering from the loss of the Grid Master means promoting the candidate. Confirm UDP 1194 and 2114 are open from the candidate to every member. On the candidate's console or SSH, run set promote master. Choose to notify members sequentially, which Infoblox says can minimize DNS outages; the default spacing is a hundred twenty seconds. Then log in to the new Grid Master and check every member has reconnected. Afterward, wait up to two hours before any further promotion, and update anything that points at the old Grid Master's address, including HSM registrations. Written down, those steps are the STIG's documented promotion procedure.`,
  "Infoblox NIOS Backing up and restoring configuration files; Restoring backups; Database snapshots; NIOS 9.1.x Promoting a Grid Master Candidate; DISA Infoblox NIOS 9.x STIG V1R1, V-285271 and V-285273 (mapping is inference).");
}

// ================================================================== 22 Logging
{
  const s = content(P4, "Logging and evidence for the SIEM");
  tag(s, "What");
  table(s, "Logs", 1.5, [2.4, 9.75], ["Source", "Configure it as"], [
    ["Syslog", "Grid Properties, Monitoring, external syslog over Secure TCP (6514, server certificate uploaded), on the MGMT interface"],
    ["Audit log", "Detailed or WAPI Detailed, and Copy Audit Log Message to Syslog (STIG V-285237)"],
    ["Queries and responses", "Not the queries or responses categories, which \"significantly affect system performance\": use capture or dnstap"],
    ["DHCP lease history", "Archived and exported: the attribution source Book 08 Ch 11 calls for"],
    ["Data Connector", "Forwards DNS data to a SIEM in CEF or LEEF, but is portal-managed: unavailable on a FIPS Grid (inference)"],
  ], { fontSize: 11.5 });
  callout(s, "M2614", 4.75, 1.3, "FaDatabase", HEX.teal, "The SIEM is the system of record: ",
    "OMB M-26-14 wants logs searchable for 6 months and retrievable for 12; NIOS local retention can't do that (Book 08 Ch 11).");
  sources(s, "Sources: Infoblox NIOS 9.1.x syslog, audit log, DNS logging, capture; Data Connector pages; DISA STIG V-285237; earlier federal brief (M-26-14); Book 08 Ch 11.");
  notes(s,
`Logging, and the evidence it produces.

Syslog: in the Grid's monitoring properties, log to external syslog servers over Secure TCP, on port 6514, with the server's certificate uploaded, and send it out the management interface.

The audit log: use the Detailed type, or WAPI Detailed, which also records API calls. And turn on Copy Audit Log Message to Syslog, which the STIG requires in addition to external syslog.

DNS queries and responses: Infoblox warns that turning on the queries and responses logging categories will significantly affect system performance. Use the capture feature or dnstap instead, and note dnstap drops data if its receiver is down.

DHCP lease history is archived and exportable, and it's the source Book 08 Chapter 11 needs to tie an address to a device at a point in time.

The Data Connector forwards DNS data to a SIEM in CEF or LEEF format, but it's managed from the Infoblox Portal, so by my inference it isn't available on a FIPS-mode Grid. There, use Secure TCP syslog or dnstap.

And the SIEM is the system of record. OMB memorandum M-26-14 requires logs searchable for six months and retrievable for twelve, which NIOS's local retention can't meet.`,
  "Infoblox NIOS 9.1.x Logging to external syslog servers; Audit log types and rolling; DNS logging categories; Capturing DNS queries and responses; dnstap; Data Connector overview and registration; DISA Infoblox NIOS 9.x STIG V1R1, V-285237; earlier federal brief (OMB M-26-14); Book 08, Chapter 11.");
}

// ================================================================== 23 Automation
{
  const s = content(P4, "Automation: what you can codify, and what you can't");
  tag(s, "How");
  table(s, "Auto", 1.5, [3.0, 4.2, 4.95], ["Tool", "Version and requirements", "Use"], [
    ["Terraform infobloxopen/nios", "v2.1.0 (July 28, 2026); NIOS 9.1.0+ and WAPI v2.14 (1.x: 9.0.6+, v2.13.6)", "Members, upgrade groups, zones, views, records, networks, ranges, failover, admin groups, syslog"],
    ["Terraform infobloxopen/infoblox", "v3.0.0-beta (Oct. 13, 2026); one provider for NIOS and Universal DDI", "Not backward compatible: state re-import. Build on nios v2 now (inference)"],
    ["Ansible infoblox.nios_modules", "v1.10.0 (July 16, 2026); WAPI 2.12.3+, Python 3.10+", "Zones, records, networks, members; no failover or DNSSEC module"],
  ], { fontSize: 11.5 });
  panel(s, "Manual", 0.6, 4.35, 12.15, 2.1, HEX.red, HEX.redTint, "STAYS MANUAL (INFERENCE FROM THE DOCS)", null, [
    "FIPS and CC mode, reset all, set promote_master and temporary licenses: CLI only",
    "HSM groups and DNSSEC signing: no Terraform or Ansible resource listed. Script these as runbooks with evidence capture",
  ], 12);
  sources(s, "Sources: GitHub infobloxopen/terraform-provider-nios (README, resources); terraform-provider-infoblox releases; infobloxopen/infoblox-ansible (README, modules); Oct. 23, 2026.");
  notes(s,
`Automation, and its limits.

Terraform's NIOS provider, version 2.1.0 from July 2026, needs NIOS 9.1.0 or later and WAPI version 2.14. That settles a question the earlier research left open: 9.1.0 is WAPI 2.14. The older 1.x provider works with 9.0.6 and WAPI 2.13.6. Version 2 identifies resources by UUID, and its resources cover Grid members, upgrade groups and schedules, zones, views, records, networks, DHCP ranges, failover, fixed addresses, managed Microsoft servers, admin groups and roles, SAML, and syslog endpoints.

There's also a new combined provider, version 3.0.0 beta from October 2026, for NIOS and Universal DDI together. It isn't backward compatible, so moving to it means re-importing state. My inference: build on the NIOS version 2 provider now, and plan a state re-import when version 3 is generally available.

Ansible's NIOS collection, version 1.10.0, needs WAPI 2.12.3 or later and Python 3.10. It covers zones, records, networks, ranges, members and more, but it has no module for failover associations or DNSSEC.

And some things stay manual. FIPS and Common Criteria mode, the factory reset, promoting the candidate, and temporary licenses are command-line only. HSM groups and DNSSEC signing have no Terraform or Ansible resource in those listings. Write those as runbooks that capture their evidence as they go.`,
  "GitHub infobloxopen/terraform-provider-nios README compatibility matrix and resource listing (v2.1.0); infobloxopen/terraform-provider-infoblox releases (v3.0.0-beta); infobloxopen/infoblox-ansible README and modules (v1.10.0); all accessed Oct. 23, 2026; research brief section 9.");
}

// ================================================================== 24 Phases
{
  const s = content(P4, "The build mapped to Book 08's six phases");
  tag(s, "How");
  label(s, "Design label", "PROGRAM DESIGN GUIDANCE — SEQUENCING, NOT VENDOR PROCEDURE", 0.6, 1.4, 12.15);
  table(s, "Phases", 1.72, [2.1, 10.05], ["Book 08 phase", "NIOS build steps"], [
    ["0 Decide", "FIPS mode; LTS train; DNSSEC defaults; HSM or documented exception"],
    ["1 Inventory", "Lab Grid; Grid Master pair with NTP; candidate and promote test; permanent licenses; PIV/SAML, banner, MGMT; syslog; SCP backup; physical managing members; Windows servers read-only"],
    ["2 Coexist", "DNS and DHCP members on-premises, vNIOS in cloud hubs (HA only where documented); forwarders recreated; AES keytabs loaded"],
    ["3 Migrate authority", "Zone import, validate, flip; signed zones re-signed and DS published; DHCP per scope: lower leases, takeover, failover, deactivate Windows scope"],
    ["4 Federate clouds", "Cloud discovery, DNS sync and IPAM federation; Universal DDI only on non-FIPS scopes"],
    ["5 Decommission", "Book 08's five gates; locator zones last; disable sync, remove managed servers, archive, de-authorize"],
    ["6 Harden, evidence", "Remaining STIG items; approved LTS via test upgrade; the evidence checklist"],
  ], { fontSize: 11 });
  sources(s, "Sources: research brief §10 (program design guidance); Book 08, Ch 10 (six phases, gates); Infoblox and DISA sources cited in Parts 1–3.");
  notes(s,
`Here's the whole build mapped onto Book 08's six phases. This is the program's design guidance: the order is a recommendation, and each step rests on the facts from earlier slides.

Phase 0, decide: FIPS mode, the long-term-support train, the DNSSEC defaults, and the HSM.

Phase 1, inventory and baseline: build a lab Grid first. Then production in order: the Grid Master pair with NTP set at the Grid level, the candidate with a promote test, permanent licenses, PIV and SAML sign-in with the banner and the management port, syslog, and scheduled SCP backups. Then physical managing members next to the domain controllers, with the Windows servers added read-only.

Phase 2, coexist: DNS and DHCP members on-premises, and vNIOS in each cloud hub, with high availability only where the region is documented. Recreate the forwarders, and load AES keytabs.

Phase 3, migrate authority: import each zone, validate, and flip delegation. Re-sign signed zones on NIOS and publish the new DS. For DHCP, scope by scope: lower lease times, take the scope over, create the failover association, confirm the DNS server option, and deactivate the Windows scope.

Phase 4, federate the clouds, with Universal DDI only on non-FIPS scopes.

Phase 5, decommission, behind Book 08's five gates, with the locator zones last. Disable sync, remove the managed servers, archive the exports, and de-authorize the old DHCP servers.

And Phase 6: the remaining STIG items, the approved long-term-support build through a test upgrade, and the evidence checklist in the backup slides.`,
  "Research brief section 10 (phase-by-phase build sequence, program design guidance); Book 08, Chapter 10 (six phases, Phase 5 gates, cutover loop); Infoblox NIOS and DISA STIG sources cited in Parts 1 to 3.");
}

// ================================================================== 25 Close
{
  const s = content(P4, "Decisions, vendor asks and next steps");
  tag(s, "Who");
  panel(s, "Decide", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "DECISIONS TO TAKE", null, [
    "FIPS mode, and what it costs in cloud management",
    "HSM, or stealth Grid Master with an exception",
    "NSEC or NSEC3 for internal zones",
    "Keep locator zones on AD DNS (default) or host them on NIOS",
    "Physical managing members: how many, where",
  ], 11.5);
  panel(s, "Ask", 4.75, 1.5, 4.0, 4.95, HEX.amber, HEX.amberTint, "ASK INFOBLOX IN WRITING", null, [
    "The current approved federal LTS build",
    "FIPS 140-3 and CC certificate dates",
    "GSS-TSIG with Windows Server 2025 DCs",
    "vNIOS HA in GovCloud and Azure Government",
    "Address continuity in a DHCP takeover; a SHA-2 NTP key",
  ], 11.5);
  panel(s, "Next", 8.9, 1.5, 3.85, 4.95, HEX.teal, HEX.tealTint, "NEXT STEPS", null, [
    "Stand up the lab Grid on evaluation images",
    "Set DNSSEC defaults, then sign a test zone",
    "Pilot one DHCP scope takeover",
    "Run the STIG checklist on the lab",
  ], 11.5);
  sources(s, "Sources: research brief §0, §12 and Couldn't verify; Book 08, Ch 04, 06, 10, 11; Infoblox and DISA sources cited in Parts 1–3.");
  notes(s,
`To close: decisions, vendor asks, and next steps.

The decisions to take. FIPS mode, knowing it costs cloud management. A hardware security module, or a stealth Grid Master with a documented exception. NSEC or NSEC3 for internal zones. Whether the locator zones stay on AD DNS, which is Book 08's default, or move to NIOS. And how many physical managing members you need, and where.

Ask Infoblox, in writing: which build is the current approved federal long-term-support release; when the FIPS 140-3 and Common Criteria certificates are expected; whether Kerberos-signed updates are supported with Windows Server 2025 domain controllers; whether vNIOS high availability works in GovCloud and Azure Government; whether clients keep their addresses in a DHCP takeover; and whether a SHA-2 NTP key type is coming.

Next steps. Stand up a lab Grid on Infoblox's evaluation images. Set the DNSSEC defaults, then sign a test zone and validate it. Pilot one DHCP scope takeover end to end. And run the STIG checklist against the lab.

The program's view is plain: Infoblox NIOS can carry Book 08's design, and its risks are known and manageable if the Phase 0 decisions come first. The backup slides list the assessor evidence, the risks, and what couldn't be verified. This is the program's research, under review, not an endorsement by any federal agency. Thank you.`,
  "Research brief sections 0 and 12, and Couldn't verify; Book 08, Chapters 04, 06, 10 and 11; Infoblox NIOS and DISA STIG sources cited in Parts 1 to 3.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full lists on the following slides. New sources opened Oct. 23, 2026.");
}

{
  const s = content("Backup", "Assessor evidence checklist");
  table(s, "Evidence", 1.45, [3.0, 7.05, 2.1], ["Evidence", "What the assessor reads", "Source"], [
    ["Crypto posture", "FIPS mode status, or a POA&M for the pending FIPS 140-3 certificates", "FIPS/CC pages"],
    ["STIG results", "45-rule V1R1 checklist; CAT I items evidenced by screenshots or exports", "DISA STIG"],
    ["DNSSEC", "Grid DNSSEC tab: no RSA/SHA1 or DSA; ZSK 2048+ or ECDSA; validity 2–7 days; NSEC3 external; KSK rollover on", "DNSSEC pages"],
    ["Signer", "GM stealth in every zone and NS group, or HSM group enabled with test output; DS matches parent", "STIG, HSM"],
    ["Admin access", "Auth policy with remote or two-factor service and banner; OCSP; CA list; scoped admin groups", "STIG V-285296"],
    ["Logging", "Secure TCP syslog; audit copy to syslog; Detailed audit type; SIEM retention 6/12 months", "V-285237, M-26-14"],
    ["Time, version", "Three Grid NTP servers; every member on the approved LTS build; latest test-upgrade result", "V-285309, V-285269"],
    ["Recovery", "Backup schedule and last SCP backup; annual test restore; GMC promote test", "V-285273"],
    ["DNS controls", "Transfer ACLs and DDNS restrictions at zone level; only required services per member", "V-285249, V-285238"],
    ["DHCP and migration", "Failover status Normal with a test record; sync history; per-scope tickets; archived exports", "Book 08 Ch 10"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief §11; DISA Infoblox NIOS 9.x STIG V1R1; Book 08, Ch 10 and Ch 11.");
}

{
  const s = content("Backup", "Risks register");
  table(s, "Risks", 1.45, [3.4, 5.4, 3.35], ["Risk", "Why it matters", "Manage it by"], [
    ["FIPS vs. hybrid cloud", "Severs portal: Universal DDI, Data Connector, cloud feeds; back out only by reset all", "Phase 0 decision; separate scopes"],
    ["Certificates pending", "FIPS mode isn't a validated module", "POA&M; vendor dates in writing"],
    ["Default crypto", "RSA/SHA1 and 1024-bit ZSK are CAT I findings once signed", "Set defaults before signing"],
    ["RC4 keytab example", "Kerberos RC4 enforcement breaks GSS-TSIG", "AES256-SHA1 keytabs"],
    ["Destructive removal", "Removing a managed DHCP server deletes ranges, leases, fixed addresses", "Take over first"],
    ["Managing-member hardware", "vNIOS can't manage Windows servers", "Procure physical members early"],
    ["Gov-region cloud HA", "Endpoints undocumented; API-dependent failover; no NAT failover", "Written confirmation; test"],
    ["Upgrade irreversibility", "Distribution drops revert image; tasks deleted; Grid revert loses changes", "Back up; test upgrade; windows"],
    ["9.1.0 gates; restore gaps", "Username lockout, TLS 1.0/1.1; SCP not a restore source; snapshot loss", "Pre-checks; rehearse restore"],
    ["Query-logging load; temp licenses", "Categories degrade DNS; expiry evicts a member", "Capture or dnstap; permanent keys"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief §12; Infoblox NIOS 9.1.x, upgrade and FIPS/CC pages; Microsoft Learn RC4 guidance.");
}

{
  const s = content("Backup", "Couldn't verify, or login-gated");
  T(s, "Gaps", bullets([
    "The current approved federal LTS build and 9.1.x patch level: release notes, images, Data Import Wizard and hotfix forms are behind the Infoblox support login.",
    "DISA public.cyber.mil and dl.dod.cyber.mil didn't answer on Oct. 23, 2026: STIG content is from the zip downloaded Oct. 22; a newer revision is unknown.",
    "GSS-TSIG with Windows Server 2025 domain controllers: no Infoblox page names it, and the 9.1 pages disagree (to 2016, or 2016–2022).",
    "vNIOS HA in AWS GovCloud and Azure Government: the endpoint lists omit government endpoints.",
    "Whether a client keeps its address across a Windows-to-NIOS DHCP scope takeover: not documented; pilot it.",
    "A SHA-2 NTP authentication key type: not listed in 9.1 (MD5, DES and SHA1 only).",
    "Data Connector on a FIPS-mode Grid, and SHA-256-only DS submission: inferences, not vendor statements.",
    "Universal DDI and NIOS-X FIPS posture for the cloud-managed data plane: not researched here.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: research brief, Couldn't verify / login-gated, Oct. 23, 2026.");
}

const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 11), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 3, fontSize: 11 });
  sources(s, "Sources: primary documents as listed. New sources accessed Oct. 23, 2026.");
};
srcSlide("Sources: Infoblox documentation", [
  "All at infoblox-docs.atlassian.net (mirrored at docs.infoblox.com). NIOS 9.1.x: creating a Grid Master; HA physical setup and switch ports; Configure a Grid Master and Join Existing Grid wizards; GMC and promote test; joining and defining members.",
  "NIOS 9.1.x: source and destination ports (v2, Oct. 6, 2026); MGMT port; NTP (Grid, members, clock behavior, auth keys); license types, expiry and installation.",
  "NIOS 9.1.x Microsoft servers: managing, guidelines, account rights, synchronized data, AD-integrated primaries, removal, DHCP sync, server assignments; zone import; Data Import Wizard; CSV Import.",
  "NIOS 9.1.x GSS-TSIG: keytab generation, AD zone configuration, Kerberos behavior, DHCP updates, upgrades  ·  DHCP failover, IPv6 ranges, bloxHA, DHCPv6 lease affinity.",
  "NIOS 9.1.x DNSSEC: parameters, signing, ZSK and KSK rollover, algorithm changes, trust-anchor export, KSK rollover due, HSM groups (Luna, nShield, enabling)  ·  set security; consent banner; syslog; audit log; DNS logging; capture; upgrade groups; backup.",
  "NIOS upgrade guide: five steps, upload, distribution, test upgrade, full and lite, during the upgrade, revert member and Grid, downgrade, 9.1.0 guidelines, hotfixes, backup and restore, snapshots.",
  "NIOS FIPS/CC mode: enabling FIPS or CC mode; guidelines  ·  vNIOS for VMware, Azure (deployment, HA, limitations v19) and AWS (HA, limits)  ·  Data Connector overview and registration.",
]);
srcSlide("Sources: government, Microsoft, code and Book 08", [
  "DISA Infoblox NIOS 9.x STIG V1R1: XCCDF (benchmark July 28, 2026), Overview and Release Memo (Aug. 6, 2026), from dl.dod.cyber.mil, downloaded Oct. 22, 2026.",
  "CISA Known Exploited Vulnerabilities catalog, JSON feed, catalog version 2026.10.21.",
  "Microsoft Learn: Set-DnsServerPrimaryZone (Windows Server 2025); Manage DNS zones (zone transfers); Detect and remediate RC4 usage in Kerberos; Windows message center; Troubleshoot DHCP client issues; DHCP failover overview.",
  "GitHub: infobloxopen/terraform-provider-nios (README compatibility matrix, resources, v2.1.0); infobloxopen/terraform-provider-infoblox releases (v3.0.0-beta); infobloxopen/infoblox-ansible (v1.10.0).",
  "Earlier verified research briefs: Infoblox platform, federal requirements, divisions, multicloud, comparison, device naming and training (Oct. 2026).",
  "Book 08: Ch 04 (AD DNS departure), Ch 06 (DNSSEC, NIST SP 800-81r3), Ch 08 (reference architecture), Ch 10 (six phases, gates, cutover loop), Ch 11 (operations, evidence, M-26-14).",
  "Program design guidance and inferences are labeled on the slides; they are not Infoblox, DISA or Microsoft statements.",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated notes: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:\n" + per.map((p) => `  ${p.slide}  ${(p.n / WPM).toFixed(1)} min  ${p.n} w  ${p.title}`).join("\n"));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
