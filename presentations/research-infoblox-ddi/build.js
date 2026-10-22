// Infoblox DDI for Federal Agencies: a 50-minute TECHNICAL deep dive, in an orientation, two parts and four modules.
//   Orientation: the control plane; what federal rules require (and that none names a vendor).
//   Part 1 — The platform and the case for it:  Module 1 (the platform), Module 2 (federal fit, comparison, risks).
//   Part 2 — Divisions under central governance:  Module 3 (divisions on NIOS), Module 4 (Universal DDI and the operating model).
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Infoblox_DDI_Federal_Deep_Dive.pptx
// Modeled on presentations/b08-ddi-technical/build.js and reuses the shared kit in ../_build/.
// Every fact comes from the verified research briefs (C:\tmp\ib\research_*.md, all sources opened 2026-10-22)
// or Book 08 (docs/books/b08-ddi/) for architecture context. Vendor marketing figures are labeled as vendor claims.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const KIT = require("path").join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Infoblox DDI for Federal Agencies", title: "Technical Deep Dive",
  footer: "Infoblox DDI for Federal Agencies  ·  Technical deep dive  ·  Research — under review" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Infoblox_DDI_Federal_Deep_Dive.pptx";

// ------------------------------------------------------------------ helpers
const WPM = 142;
let clock = 0, words = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; per.push({ slide: pres.slides.length, n });
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

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

const divider = (sec, title, sub, items, mins, src) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.65, w: 7.4, h: 1.4, paraSpaceAfter: 3 });
  sources(s, src, 6.08);
  return s;
};

const P1 = "Part 1 — The platform and the case for it";
const P2 = "Part 2 — Divisions under central governance";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Infoblox DDI for Federal Agencies", "Technical deep dive  ·  Research — program analysis, under review");
  txt(s, "Session map", [
    { text: "Part 1 — The platform and the case for it", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  The platform   ·   Module 2  Why it's a top recommendation, and its risks", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Divisions under central governance", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Divisions on NIOS   ·   Module 4  Universal DDI and the operating model", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.7, w: 8.6, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Infoblox NIOS 9.1.x and Universal DDI documentation; FedRAMP Marketplace; NIST CMVP; DISA; OMB; CISA; Book 08. All opened Oct. 22, 2026.", 6.08);
  notes(s,
`This is a technical deep dive on Infoblox DDI for federal agencies: DNS, DHCP and IP address management, delivered on Infoblox's NIOS Grid and on its cloud-managed service, Universal DDI. It's for the architects and engineers who will decide whether to build an agency's name and address layer on Infoblox, and how to run it once they do.

After a five-minute orientation, it comes in two parts of about twenty-two minutes each, in four modules you can watch on their own. Part 1 covers the platform, then the case for it: which federal requirements it answers, what its FedRAMP listing actually covers, how it compares with BlueCat, EfficientIP, Microsoft and the native cloud services, and the risks you have to manage if you choose it. Part 2 covers divisions: how a central team hands DNS, DHCP and address management to bureaus and offices, on NIOS and on Universal DDI, without losing control, and it ends with a worked example, a responsibility matrix and a rollout sequence.

Two ground rules. Every fact here comes from a primary source opened on October twenty-second, 2026. And anything that is only Infoblox marketing is called a vendor claim when it appears.`,
  "Infoblox NIOS 9.1.x and Universal DDI docs; FedRAMP Marketplace products.json; NIST CMVP; DISA STIG file store; OMB and CISA publications; Book 08.");
}

// ================================================================== 2 Control plane
{
  const s = content("Orientation", "DNS, DHCP and IPAM are one control plane");
  tag(s, "Why");
  const jobs = [
    ["FaGlobe", "DNS decides where every connection goes", "Private endpoints, SaaS front doors, certificate checks (OCSP, CRL) all start with a name"],
    ["FaRightLeft", "DHCP decides who a device is on the network", "Lease history maps an address to an asset at a point in time (SP 800-81r3)"],
    ["FaSitemap", "IPAM decides what address space the agency owns", "The record behind asset discovery, inventory attestation and IPv6 planning"],
  ];
  jobs.forEach((j, i) => {
    const y = 1.55 + i * 0.95;
    icon(s, j[0], 0.6, y + 0.05, 0.6, i % 2 ? HEX.teal : HEX.navy);
    T(s, `Job ${i + 1}`, [
      { text: j[1], options: { bold: true, color: i % 2 ? HEX.teal : HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: j[2], options: { fontSize: 12.5 } },
    ], { x: 1.35, y, w: 4.85, h: 0.9, fontSize: 12.5 });
  });
  panel(s, "Plane", 6.45, 1.5, 6.3, 3.0, HEX.teal, HEX.tealTint, "WHAT A DDI POLICY PLANE IS MADE OF (BOOK 08)", null, [
    "Authoritative and recursive DNS and DHCP servers on premises: internal zones, resolvers, RPZ, DNSSEC",
    "A management plane that holds the system of record for zones, forwarding, IPAM and policy",
    "Local resolvers and agents that keep answering if the management plane is unreachable",
    "Cloud DNS is managed as an overlay, not replaced",
  ], 12.5);
  callout(s, "Argument", 4.65, 1.75, "FaLightbulb", HEX.amber, "The argument of this deck: ",
    "federal rules require capabilities, not products. Those capabilities need one authoritative, governed DDI plane. Infoblox is one of the strongest ways to deliver it, with real risks to manage.");
  sources(s, "Sources: NIST SP 800-81r3 (Mar. 2026); Book 08, Ch 01 and Ch 08, \"What a DDI policy plane is made of.\"");
  notes(s,
`Why this matters. Almost every connection an agency makes starts with a DNS lookup, and in a hybrid, multi-cloud estate that answer decides far more than an address.

DHCP and IP address management sit right beside it. NIST's Secure DNS Deployment Guide, SP 800-81 Revision 3, tells agencies to keep DHCP lease history so an IP address can be mapped to an asset. And the address plan is the record behind everything the inventory directives ask for, which we'll see on the next slide. That's why this deck treats DNS, DHCP and IPAM as one control plane rather than three services.

Book 08 of the workbook describes what that plane is made of, and it isn't one box. There's an authoritative and recursive layer on premises that hosts internal zones, answers clients, and applies response policy zones and DNSSEC. There's a management plane, more and more often delivered as a cloud service, that holds the system of record for zones, forwarding rules, address data and security policy. And there are local resolvers and agents that keep answering from local state if the management plane can't be reached. Cloud DNS isn't replaced; it's managed as an overlay.

So here is the argument of the whole session. Federal rules require capabilities, not products. Those capabilities, taken together, need one authoritative and governed DDI plane. Infoblox is one of the strongest ways to deliver that plane, with evidence, and it also carries real risks you have to manage. We'll cover both.`,
  "NIST SP 800-81r3; Book 08, Chapters 01 and 08.");
}

// ================================================================== 3 Requirements
{
  const s = content("Orientation", "What federal rules require, and what none of them say");
  tag(s, "What");
  table(s, "Requirements", 1.5, [2.75, 5.35], ["Rule (status Oct. 2026)", "What it demands of DNS, DHCP and IPAM"], [
    ["SP 800-53 SC-20; M-08-23; TIC DNVAD", "Sign agency zones with DNSSEC (M-08-23 is not rescinded)"],
    ["SC-21; TIC DNVAC", "Validate DNSSEC on recursive resolvers"],
    ["SC-22", "Fault-tolerant DNS with internal and external roles separated"],
    ["M-22-09; EO 14144 §4(c)", "Encrypted DNS wherever supported; agency resolvers support DoH or DoT"],
    ["CISA Protective DNS", "Internal resolvers forward egress queries to CISA; keep local logs"],
    ["M-26-14 + CISA Logging Ref. Arch.", "M-26-14 never mentions DNS; the LRA maps DNS and DHCP logs into its baseline. 6 months searchable, 12 retrievable"],
    ["BOD 23-01; BOD 26-04; CM-8", "Discover all IPv4 space every 7 days; attest public IPs and domains every quarter"],
    ["M-21-07", "IPv6-only for 20%, 50%, 80% of assets by FY23–FY25 (all past)"],
    ["SC-13; FIPS 140", "CMVP-validated crypto; FIPS 140-2 certificates now Historical"],
  ], { fontSize: 11.5 });
  panel(s, "Vendor", 8.95, 1.5, 3.8, 4.95, HEX.red, HEX.redTint, "THE HONEST STARTING POINT", "No rule names a vendor", [
    "No OMB memo, BOD, EO, NIST or CISA text names Infoblox or any DDI vendor",
    "Nothing requires a \"DDI platform\" as a product",
    "Windows DNS, BIND or cloud DNS plus an IPAM can meet the same rules",
    "The choice is an architecture decision, not a mandate",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-53r5 (5.2.0); OMB M-08-23, M-22-09, M-26-14, M-21-07; EO 14144 as amended by EO 14306; CISA PDNS, LRA (Aug. 2026), TIC 3.0 v3.3, BOD 23-01, 26-04; NIST CMVP.");
  notes(s,
`Here is what the rules actually require, stated as capabilities.

DNSSEC: SC-20 in the low and moderate baselines means signing agency zones, and OMB M-08-23, from 2008, is still in force; we checked every 2025 and 2026 memo, and none rescinds it. SC-21 means validating answers on recursive resolvers. SC-22 asks for fault-tolerant DNS with internal and external roles separated. TIC 3.0, version 3.3, carries signing and validation as policy enforcement point capabilities.

Encrypted DNS: M-22-09 says agencies must resolve DNS using encrypted DNS wherever it's technically supported, and Executive Order 14144, section 4(c), which the June 2025 amendment left standing, repeats the push and adds contract language for any product that acts as a resolver. CISA's Protective DNS sits upstream: internal resolvers forward to it, and the agency keeps its own logs.

Logging is subtle. M-26-14, from May 2026, rescinded M-21-31 and doesn't mention DNS anywhere. What carries DNS and DHCP logging forward is CISA's Logging Reference Architecture from August, which maps the old DNS and DHCP categories into its network-activity baseline. Retention is six months searchable and twelve retrievable.

Inventory: BOD 23-01 wants discovery of all agency IPv4 space every seven days, and BOD 26-04, which replaced 19-02 and 22-01, wants public IP addresses and domains attested every quarter. M-21-07 set IPv6-only targets that have all passed. And SC-13 wants validated cryptography.

Now the honest starting point. No rule names Infoblox or any DDI vendor, and nothing requires a DDI platform. Windows DNS, BIND, or cloud DNS with a separate IPAM can meet these rules too. Choosing a platform is an architecture decision.`,
  "NIST SP 800-53r5 OSCAL 5.2.0; OMB M-08-23, M-22-09, M-26-14, M-21-07; EO 14144, EO 14306; CISA Protective DNS, Logging Reference Architecture, TIC 3.0 v3.3, BOD 23-01, BOD 26-04; NIST CMVP.");
}

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: The platform", "Part 1 — The platform and the case for it",
    ["Grid architecture, NIOS 9.1, NIOS-X and vNIOS in the clouds", "Universal DDI, the Infoblox Portal and its documented limits", "DNS, DHCP and IPAM, Threat Defense, automation and logging"], 12,
    "Sources: Infoblox NIOS 9.1.x admin guide; Universal DDI and Threat Defense docs; infobloxopen GitHub; vendor pages (labeled).");
  notes(s,
`Module 1: the platform.

Before arguing for or against Infoblox, we need an accurate picture of what it is in October 2026, because the names have changed and a lot of older material is now wrong. We'll start with the NIOS Grid, the on-premises architecture most agencies know, then the cloud-managed side, Universal DDI and the Infoblox Portal, including the limits Infoblox itself documents. Then DNS, DHCP and IPAM in turn, the Threat Defense security layer, and finally the automation interfaces and the logging and reporting path.`,
  "Infoblox NIOS 9.1.x admin guide; Universal DDI and Threat Defense documentation.");
}

// ================================================================== 5 Grid
{
  const s = content(P1, "Grid architecture: one database, many members");
  tag(s, "What");
  panel(s, "Grid", 0.6, 1.5, 5.6, 4.95, HEX.navy, HEX.navyTint, "HOW A NIOS GRID WORKS", "Grid Master, candidates, members", [
    "Grid Master (single or HA pair): one access point; all admin GUI access goes through it",
    "Members (appliance or vNIOS, single or HA) hold sections of a shared database",
    "Hub-and-spoke replication over encrypted VPN tunnels: UDP 1194, CRAM auth on 2114",
    "Grid Master Candidate holds a full copy; promotion is manual, and not from the Portal",
    "HA (bloxHA): one VIP and virtual MAC, VRRP heartbeats",
    "IPv4-only, IPv6-only or dual-mode Grids",
  ], 12.5);
  table(s, "Forms", 1.5, [2.0, 4.35], ["Form factor", "What the docs say"], [
    ["Trinzic X6", "Current hardware; NIOS 9.0.1 and later"],
    ["vNIOS for VMware", "X6 models 4 vCPU/32 GB to 32 vCPU/384 GB; all can be Grid Master"],
    ["vNIOS for Azure", "HA from 9.0.4; Azure Government covered; no DHCP for on-prem networks"],
    ["vNIOS for AWS", "Grid Master or HA from 9.0.4; vDiscovery has a GovCloud option"],
    ["Google Cloud, OCI", "Shared VPC support; OCI HA new in 9.1.0"],
    ["NIOS-X servers", "Universal DDI data plane: VM, container, bare metal, B1 hardware"],
  ], { x: 6.4, fontSize: 11.5 });
  T(s, "Versions", [
    { text: "October 2026: ", options: { bold: true, color: HEX.teal } },
    { text: "NIOS 9.1.0 (GA Mar. 10, 2026) ships BIND 9.20. NIOS 9.0.6 started a Long-Term Support train: up to 24 months of support." },
  ], { x: 6.4, y: 5.55, w: 6.35, h: 0.9, fontSize: 12.5 });
  sources(s, "Sources: Infoblox NIOS 9.1.x — About Grids; Promoting a GMC; About HA Failover; 9.1.0 What's New; vNIOS guides (VMware X6, Azure, AWS, GCP, OCI); NIOS-X platforms; NIOS 9.0.6 blog.");
  notes(s,
`The NIOS Grid is a group of appliances that share sections of one distributed database, configured and monitored through a single access point, the Grid Master. The Grid Master can be one appliance or a high-availability pair, and every administrator reaches the GUI through it, even administrators scoped to a single member.

Members can be physical Infoblox hardware or virtual vNIOS, singly or in HA pairs. The Grid Master talks to every member hub-and-spoke, over encrypted VPN tunnels on UDP 1194 by default, after a challenge-response authentication on port 2114. A Grid Master Candidate holds a complete copy of the database. Promoting it is a manual operation, and you can't do it from the cloud portal. HA pairs share one virtual IP and virtual MAC, with VRRP advertisements as the heartbeat. A Grid can run IPv4-only, IPv6-only or dual mode.

Form factors. The current hardware line is Trinzic X6, supported from NIOS 9.0.1. vNIOS for VMware runs from four virtual CPUs and thirty-two gigabytes up to thirty-two CPUs and three hundred eighty-four, and every model can be a Grid Master. vNIOS for Azure supports HA from 9.0.4 and explicitly covers Azure Government; note that Azure doesn't support running DHCP in Azure for on-premises networks. vNIOS for AWS can be a Grid Master in HA, and its vDiscovery has a GovCloud option. Google Cloud and Oracle Cloud are covered too, with OCI HA new in 9.1. NIOS-X servers are the data plane for Universal DDI, which is next.

Versions: NIOS 9.1.0 went GA in March 2026 and ships BIND 9.20. NIOS 9.0.6 introduced a Long-Term Support train with up to twenty-four months of support.`,
  "Infoblox NIOS 9.1.x About Grids, Promoting a Grid Master Candidate, About HA Failover, 9.1.0 What's New; vNIOS install guides; Supported Platforms for NIOS-X Servers; Infoblox NIOS 9.0.6 and 9.1.0 blogs.");
}

// ================================================================== 6 Universal DDI
{
  const s = content(P1, "Universal DDI and the Infoblox Portal, with its limits");
  tag(s, "What");
  panel(s, "UDDI", 0.6, 1.5, 5.2, 4.95, HEX.teal, HEX.tealTint, "THE CLOUD-MANAGED SIDE", "Formerly BloxOne DDI (renamed Sept. 2024)", [
    "Management in the Infoblox Portal (formerly the Cloud Services Portal); API host still csp.infoblox.com",
    "Data plane: NIOS-X servers, or NIOS-X as a Service run by Infoblox in AWS and GCP",
    "Manages Route 53, Azure DNS, Google Cloud DNS, Cloudflare, Akamai, Microsoft DNS and DHCP",
    "Hybrid: manage NIOS Grids in the Portal; NIOS primary, NIOS-X secondary",
    "Vendor claim: a \"single cloud-based control plane and API\"",
  ], 12.5);
  table(s, "Limits", 1.5, [2.3, 4.45], ["Area", "Limit Infoblox documents"], [
    ["NIOS in the Portal", "No Grid Master Candidate promotion, Splunk reporting or downloads; no Multi-Grid Management"],
    ["Hybrid NIOS DHCP", "NIOS DHCP failover associations can't be managed from the Portal"],
    ["WAPI Passthrough", "Grid Master only, not a candidate or reporting member"],
    ["NIOS-X as a Service", "No IPv6, no overlapping IP spaces, no Azure points of presence"],
    ["Route 53, Azure DNS", "Simple routing records only; no tags; NS read-only; alias records become CNAMEs"],
    ["Google Cloud DNS", "DNSSEC records don't sync; private zones can't be created"],
  ], { x: 6.0, fontSize: 11.5 });
  sources(s, "Sources: Infoblox — What's New in Universal DDI; Limitations of Universal DDI; NIOS-X as a Service limits; Route 53, Azure DNS, GCP limits; product page (vendor).");
  notes(s,
`Universal DDI is the cloud-managed side. It used to be called BloxOne DDI; Infoblox renamed it in September 2024, and the on-premises hosts became NIOS-X servers. The old Cloud Services Portal is now the Infoblox Portal, although the documentation still uses both names and the API host is still csp dot infoblox dot com.

The data plane is NIOS-X servers that you run, or NIOS-X as a Service, which Infoblox runs from its own points of presence in AWS and Google Cloud. The management plane reaches outward to Route 53, Azure DNS, Google Cloud DNS, Cloudflare and Akamai, and to Microsoft DNS and DHCP. It can also manage NIOS Grids from inside the Portal, and the documented hybrid DNS pattern makes NIOS primary and NIOS-X secondary. Infoblox markets this as a single cloud-based control plane and API; that's a vendor claim, and the limits on the right are why you should test it.

These limits come from Infoblox's own pages. Inside the Portal, the embedded NIOS view can't promote a Grid Master Candidate, show Splunk reporting or download files, and Multi-Grid Management isn't supported. NIOS DHCP failover associations can't be managed from the Portal. WAPI Passthrough reaches only the Grid Master. NIOS-X as a Service has no IPv6, no overlapping IP spaces and no Azure points of presence, which matters under the IPv6 mandate. The cloud DNS integrations sync simple routing records only, without tags, with NS records read-only and alias records turned into CNAMEs. And Google's DNSSEC records don't sync.

So "one console" is overstated: in practice you'll run Grid Manager and the Portal side by side.`,
  "Infoblox What's New in Universal DDI; Limitations of Universal DDI; Limitations of NIOS-X as a Service; Universal DDI and NIOS Grid Hybrid Deployment; Route 53, Azure DNS and GCP integration pages; infoblox.com Universal DDI page (vendor).");
}

// ================================================================== 7 DNS
{
  const s = content(P1, "DNS: views, DNSSEC, DNS Firewall and encrypted DNS");
  tag(s, "What");
  const b = table(s, "DNS", 1.5, [2.35, 9.8], ["Capability", "What NIOS 9.1 does, and the catch"], [
    ["DNS views", "Match lists of clients or destinations; first match wins; forwarders set per view (internal/external split)"],
    ["Anycast", "On the loopback interface; needs OSPF or BGP; no advertisement from IPv6-only appliances"],
    ["DNSSEC signing", "Grid Master is hidden primary for signed zones; keys on the Grid Master or a Thales Luna or Entrust nShield HSM, not both"],
    ["Key rollover", "ZSK automatic, 30 days; KSK automatic or manual, 1 year; DS inserted automatically only if the parent is in the Grid"],
    ["DNS Firewall (RPZ)", "Local, feed and FireEye RPZs, up to 32; hits logged to syslog in CEF; needs recursion"],
    ["GSS-TSIG with AD", "Kerberos-signed updates from Windows Server 2016–2022 DCs; up to 256 keys per member"],
    ["Microsoft DNS, DHCP", "Managed agentlessly over MS-RPC, read-only or read/write; IPv6 management new in 9.1.0"],
    ["Encrypted DNS", "From 9.1.0, DoT and DoH served by BIND on X6 only; X5 needs an extra license (vendor)"],
  ], { fontSize: 11.5 });
  callout(s, "Algo", b + 0.15, 6.5 - b - 0.15, "FaKey", HEX.red, "Change the default before you sign: ",
    "NIOS defaults DNSSEC to RSA/SHA1. Choose RSA/SHA-256 or ECDSA P-256 or P-384, which NIOS also offers.");
  sources(s, "Sources: Infoblox NIOS 9.1.x — DNS Views; Anycast; DNSSEC on a Grid and Parameters; HSM; DNS Firewall; GSS-TSIG; Microsoft Servers; DoT/DoH; 9.1.0 What's New.");
  notes(s,
`DNS on NIOS 9.1, with the catch for each feature.

DNS views serve different answers to different clients from match lists of client or destination addresses. The first match wins, and you can set forwarders per view, which is how you'd point an internal view at CISA's Protective DNS.

DNSSEC is strong, with structure you must plan around. Only the Grid Master can be primary for a signed zone. It acts as a hidden primary and members serve the zone as secondaries. Keys live either on the Grid Master or on an external network HSM, Thales Luna or Entrust nShield, not both. Zone-signing keys roll automatically every thirty days by default, and key-signing keys yearly, automatically or by hand. If the parent zone is in the Grid, the new DS record is inserted for you; otherwise someone exports it to the parent, which for a dot-gov zone means the registrar.

DNS Firewall uses response policy zones: local, feed or FireEye, up to thirty-two of them, with hits logged to syslog in CEF format. GSS-TSIG lets Windows domain controllers make Kerberos-signed updates, up to two hundred fifty-six keys per member. Grid members can manage Windows DNS and DHCP servers without an agent, over MS-RPC, read-only or read-write, and 9.1 adds IPv6 management.

Encrypted DNS: from 9.1.0, DNS over TLS and DNS over HTTPS are served by BIND, but only on X6 appliances. Infoblox says they're free on X6 and need an extra license on X5.

One configuration item you must change: the default DNSSEC algorithm is RSA with SHA-1. Pick SHA-256 or an ECDSA curve before you sign anything.`,
  "Infoblox NIOS 9.1.x: Configuring DNS Views, Anycast, DNSSEC on a Grid, Setting DNSSEC Parameters, Thales Luna HSM, DNS Firewall, GSS-TSIG, Managing Microsoft Servers, DoT and DoH Architecture, 9.1.0 What's New; NIOS 9.1.0 blog (vendor).");
}

// ================================================================== 8 DHCP and IPAM
{
  const s = content(P1, "DHCP and IPAM: failover, network views, discovery");
  tag(s, "What");
  panel(s, "DHCP", 0.6, 1.5, 5.5, 3.75, HEX.navy, HEX.navyTint, "DHCP", null, [
    "Failover peers talk to each other over TCP; MAC hash, 50/50 by default; the Grid Master plays no part",
    "One failover association serves one network view; IPv4 ranges only",
    "DHCPv6 with prefix delegation; fixed addresses from 9.0.6",
    "Fingerprinting (options 55, 60) on by default; filters can deny leases",
    "Lease history archived and exportable; DDNS updates only where enabled",
  ], 12);
  panel(s, "IPAM", 6.3, 1.5, 6.45, 3.75, HEX.teal, HEX.tealTint, "IPAM AND DISCOVERY", null, [
    "Network views: up to 1,000 separate routing domains; a DHCP member serves one view",
    "Network containers hold the top-level blocks; extensible attributes tag every object",
    "Discovery by ICMP, NetBIOS, TCP; vDiscovery of vCenter, OpenStack, Azure, AWS",
    "Network Insight: separate license and dedicated ND appliances (no DNS or DHCP)",
    "Universal Asset Insights (SaaS): AWS, Azure, GCP, Intune, Jamf, ServiceNow CMDB",
    "AWS VPC IPAM: Infoblox as external authority (private scope, Advanced tier)",
  ], 12);
  callout(s, "Views", 5.4, 1.05, "FaTriangleExclamation", HEX.amber, "Network views permit overlap; they don't prevent it. ",
    "Uniqueness across contexts comes from one view, or from IPAM Federation in Universal DDI. The AWS IPAM handoff excludes GovCloud.");
  sources(s, "Sources: Infoblox NIOS 9.1.x — DHCP Failover; DHCPv6; Fingerprints; Lease History; Network Views; Discovery; Network Insight; EAs. Asset Insights. AWS VPC IPAM docs.");
  notes(s,
`DHCP first. Failover peers form an association over TCP, split clients by a hash of the MAC address, fifty-fifty by default, and send each other lease updates directly. The Grid Master isn't involved in failover, whatever older material says. An association serves ranges in one network view only, and failover is IPv4 only. That last point matters under the IPv6 mandate, though as we'll see in Module 2, Windows has the same gap. DHCPv6 itself is supported, including prefix delegation, and fixed addresses arrived in 9.0.6. Fingerprinting matches options 55 and 60 and is on by default, and filters can deny leases to device types per range. Lease history is archived and exportable, which is the address-to-asset record NIST asks for. Dynamic DNS updates from DHCP are something you turn on, not automatic.

IPAM. A network view is a single routing domain, up to one thousand per Grid. Views are mutually exclusive, so the same address space can exist in two of them. A DHCP member serves only one network view. Network containers hold the large blocks, and extensible attributes tag objects with metadata such as division or cost center. Discovery uses ICMP, NetBIOS or TCP, and vDiscovery reads vCenter, OpenStack, Azure and AWS. Network Insight, the layer-two and layer-three device discovery, needs its own license and dedicated appliances that run no DNS or DHCP; budget for that. Universal Asset Insights is the SaaS inventory service. And AWS documents Infoblox as the external authority for a VPC IPAM private scope, on the Advanced tier.

Two corrections to common claims. Separate network views permit overlap; they don't prevent it. And the AWS IPAM integration excludes the GovCloud regions.`,
  "Infoblox NIOS 9.1.x: DHCP Failover, DHCPv6 RFC Compliance, DHCP Fingerprint Detection, Lease History, Enabling DDNS, Configuring Network Views, About Discovery, About Network Insight, Extensible Attributes; Universal Asset Insights; AWS VPC IPAM user guide; AWS What's New, Nov. 17, 2025.");
}

// ================================================================== 9 Threat Defense
{
  const s = content(P1, "Threat Defense: DNS-layer security and intelligence");
  tag(s, "What");
  panel(s, "TD", 0.6, 1.5, 5.6, 3.65, HEX.red, HEX.redTint, "INFOBLOX THREAT DEFENSE (FORMERLY BLOXONE)", null, [
    "Bundles DNS Firewall (RPZ), TIDE threat intelligence and Dossier research",
    "Detects tunneling and exfiltration, DGAs, command-and-control, phishing",
    "Cloud delivery: DNS Forwarding Proxy, Infoblox Endpoint, cloud resolver",
    "On premises: RPZ feeds; Threat Insight adds detected tunnels to a mitigation RPZ",
    "Detection Mode for NIOS streams reply metadata, client IPs included, to the cloud",
  ], 12);
  table(s, "Tiers", 1.5, [3.0, 1.55, 1.85], ["License tier feature", "Business", "Advanced"], [
    ["DFP, Endpoint, cloud resolver", "Cloud tier", "Yes"],
    ["TIDE custom feed ingest", "No", "Yes"],
    ["Dossier queries a year", "32,000", "64,000"],
    ["Threat Insight DGA detection", "Cloud tier", "Yes"],
  ], { x: 6.35, fontSize: 12 });
  T(s, "Tiers note", "Tiers: Essentials, Business On-Premises, Business Cloud, Advanced.", { x: 6.35, y: 3.55, w: 6.4, h: 0.35, fontSize: 11.5, color: HEX.slate });
  T(s, "Proof", [
    { text: "Independent signal: ", options: { bold: true, color: HEX.teal } },
    { text: "Google Cloud documents its DNS Armor threat detection as \"powered by Infoblox.\"" },
  ], { x: 6.35, y: 4.0, w: 6.4, h: 0.65, fontSize: 12.5 });
  callout(s, "Claims", 5.3, 1.15, "FaTriangleExclamation", HEX.amber, "Vendor claims, not verified: ",
    "\"90% of threats before the first query,\" \"68 days before other tools,\" a 0.0002% false-positive rate. Don't put them in an ATO package.");
  sources(s, "Sources: Infoblox — About Threat Defense; Licensing; Dossier and TIDE; Threat Insight; TDDM for NIOS; Google Cloud DNS Armor; infoblox.com Threat Defense (vendor).");
  notes(s,
`Infoblox Threat Defense, formerly BloxOne Threat Defense, is the DNS-layer security product. It bundles three things: DNS Firewall using response policy zones, TIDE, the Threat Intelligence Data Exchange, which aggregates and distributes machine-readable intelligence, and Dossier, which researches an indicator across about a dozen sources at once. It detects DNS tunneling and data exfiltration, domain generation algorithms, command-and-control and phishing.

It's delivered two ways. From the cloud, through the DNS Forwarding Proxy, the Infoblox Endpoint agent and a cloud resolver. And on premises, as RPZ feeds into NIOS or NIOS-X. On NIOS, Threat Insight detects tunneling and adds the destination to a mitigation RPZ automatically. Threat Defense Detection Mode streams DNS reply metadata from NIOS to the cloud for passive detection; that metadata includes client IP addresses, so treat it as a boundary decision, not a checkbox.

Licensing comes in four tiers: Essentials, Business On-Premises, Business Cloud and Advanced. The cloud delivery pieces come with Business Cloud and Advanced. Custom feed ingest in TIDE is Advanced only. Dossier gives thirty-two thousand queries a year on the Business tiers and sixty-four thousand on Advanced.

There's one strong independent signal. Google Cloud's own documentation describes its DNS Armor threat detection as powered by Infoblox. That's a cloud provider's statement, not Infoblox marketing.

And then there's the marketing. Infoblox says it stops ninety percent of threats before the first query, detects threats sixty-eight days before other tools, and has a false-positive rate of 0.0002 percent. Nobody independent has verified those figures. Keep them out of anything an assessor reads.`,
  "Infoblox About Threat Defense; Licensing and Subscriptions; Dossier and TIDE Overview; About Threat Insight (NIOS 9.1.x); TDDM for NIOS; Google Cloud DNS Armor docs; infoblox.com Threat Defense page (vendor claims).");
}

// ================================================================== 10 Automation and logging
{
  const s = content(P1, "Automation and logging: APIs, IaC, SIEM, reporting");
  tag(s, "How");
  table(s, "Auto", 1.5, [2.0, 4.0], ["Interface", "State in Oct. 2026"], [
    ["WAPI (NIOS)", "v2.14 in 9.1.0 examples; adds OAuth 2.0/OIDC sign-in and immutable UUIDs"],
    ["Universal DDI API", "REST with API-key tokens; \"WAPI 2.0\" is for migration only"],
    ["Terraform", "infobloxopen/infoblox v3.0.0-beta (Oct. 13): one provider for NIOS and Universal DDI; state must be re-imported"],
    ["Ansible", "infoblox.nios_modules 1.10.0; infoblox.universal_ddi 1.2.0"],
    ["ServiceNow", "Infoblox spoke v2.1.0: IntegrationHub and a MID Server"],
  ], { fontSize: 11.5 });
  table(s, "Logs", 1.5, [2.0, 4.0], ["Logging path", "What to know"], [
    ["Query capture", "Rolls every 10 min or 100 MB; local cap 3.1–40 GB by model; don't log queries and responses together"],
    ["dnstap (9.1)", "Runs on BIND 9.20; drops logs, doesn't buffer, if the receiver is down"],
    ["Syslog, CEF", "RPZ hits and infrastructure-protection events"],
    ["Data Connector", "To Splunk HEC or Sentinel; cloud-to-cloud needs the Ecosystem subscription"],
    ["Reporting", "TR-2205 10 GB/day; TR-1405, TR-805 5 GB/day; 5 overruns in 30 days lock it"],
  ], { x: 6.75, fontSize: 11.5, firstColor: HEX.teal });
  sources(s, "Sources: Infoblox NIOS 9.1.0 What's New; Universal DDI API; WAPI 2.0; infobloxopen GitHub; ServiceNow spoke; Query Captures; dnstap; Data Connector; Reporting.");
  notes(s,
`Automation and logging, the two things that decide whether the platform can be governed at scale.

On automation, Infoblox is ahead of the other DDI vendors. NIOS's REST API, WAPI, shows version 2.14 in the 9.1.0 examples, and 9.1 adds OAuth 2.0 and OpenID Connect sign-in for the API and immutable object IDs. Universal DDI has its own REST API with API-key tokens. There's also a WAPI-compatible API for Universal DDI, but Infoblox says it's for migration only and isn't a long-term API. For infrastructure as code, the infobloxopen/infoblox Terraform provider went to a 3.0 beta on October thirteenth: one provider for both NIOS and Universal DDI, replacing three older ones, and not backward compatible, so state has to be re-imported. Plan that migration; don't build new work on the older providers. Ansible has current collections for both, and ServiceNow publishes an Infoblox spoke that needs IntegrationHub and a MID Server.

Logging has sharper edges. Query and response capture rolls files every ten minutes or hundred megabytes, with local retention capped by model, and Infoblox recommends not logging queries and responses together because of the load. dnstap runs on BIND in 9.1, but drops logs rather than buffering them if the receiver is down, so monitor the receiver. RPZ hits go to syslog in CEF. Cloud logs reach Splunk or Microsoft Sentinel through the Data Connector; Splunk's own Infoblox add-on is archived.

And the built-in Reporting appliances have daily ingest caps: ten gigabytes on the largest, five on the others. Exceed the cap five times in thirty days and reporting locks until Infoblox Support steps in. For federal retention, send logs to the SIEM and size Reporting deliberately.`,
  "Infoblox NIOS 9.1.0 What's New; Universal DDI API Guide; WAPI 2.0 for Universal DDI; infobloxopen terraform-provider-infoblox releases; infoblox-ansible and universal-ddi-ansible; ServiceNow Infoblox spoke; DNS Query and Response Captures; dnstap limits; Data Connector; Supported Reporting Appliances; Splunkbase 2934.");
}

// ================================================================== 11 Module 2 divider
{
  const s = divider(P1, "Module 2: Why Infoblox, and why federal needs it", "Part 1 — The platform and the case for it",
    ["Requirement → capability → Infoblox feature", "FedRAMP scope and boundary; STIGs, FIPS 140, NIAP", "A fair comparison, the risks and the procurement asks"], 12,
    "Sources: FedRAMP Marketplace; DISA STIG file store; NIST CMVP; NIAP PCL; CISA CDM APL; NVD; CISA KEV; vendor and cloud docs.");
  notes(s,
`Module 2: why Infoblox is a top recommendation, and why federal networks need what it does.

We'll build the case in four steps. First, map each federal requirement to the capability it demands and to the Infoblox feature that delivers it. Second, look closely at what the FedRAMP listing covers and what stays inside the agency's own boundary. Third, compare the assurance evidence and the features against BlueCat, EfficientIP, Microsoft and the native cloud services. And fourth, lay out the risks plainly, with how to manage each one and what to ask for in the contract. A recommendation that hides its risks isn't one an authorizing official can use.`,
  "FedRAMP Marketplace products.json; DISA STIG file store; NIST CMVP; NIAP PCL; CISA CDM APL; NVD; CISA KEV.");
}

// ================================================================== 12 Mapping
{
  const s = content(P1, "From requirement to capability to Infoblox feature");
  tag(s, "What");
  table(s, "Map", 1.5, [2.15, 2.45, 4.4, 3.15], ["Requirement", "Capability", "Infoblox feature", "Watch"], [
    ["SC-20, M-08-23", "Sign agency zones", "Grid Master hidden primary; automatic ZSK/KSK rollover; HSM", "RSA/SHA1 default; DS by hand for .gov"],
    ["SC-22", "Resilient, role-separated DNS", "Grid, HA pairs, candidates, anycast, internal/external views", "Candidate promotion is manual"],
    ["M-22-09, EO 14144", "Encrypted DNS at agency resolvers", "DoT and DoH served by BIND on X6 (9.1.0)", "X6 only; X5 extra license"],
    ["CISA Protective DNS", "Forward egress, keep local logs", "Per-view forwarders; local query logging", "Confirm encrypted forwarding upstream"],
    ["LRA, AU-2, SI-4", "DNS and DHCP logs to the SIEM", "Query capture, dnstap, lease history, CEF, Data Connector", "Ingest caps; dnstap drops"],
    ["BOD 23-01, 26-04, CM-8", "Authoritative address and asset record", "IPAM, network views, discovery, vDiscovery, Asset Insights", "Network Insight hardware cost"],
    ["M-21-07", "IPv6-capable services", "IPv6 Grids, DHCPv6, prefix delegation", "DHCP failover IPv4 only"],
    ["SC-13, FIPS 140", "Validated cryptography", "140-3 modules in CMVP review", "No active certificate today"],
  ], { fontSize: 11 });
  sources(s, "Sources: research mapping of NIST SP 800-53r5, OMB, EO 14144, CISA PDNS FAQ, LRA, BODs to Infoblox NIOS 9.1.x and Universal DDI docs; NIST CMVP modules in process.");
  notes(s,
`This is the core of the argument: each requirement, the capability it demands, the Infoblox feature that delivers it, and what to watch.

Signing agency zones: the Grid Master signs as a hidden primary, rolls keys automatically, and can keep keys in an HSM. Watch the RSA-SHA1 default and the DS record you'll still hand to the dot-gov registrar. Resilient, role-separated DNS: Grid replication, HA pairs, a Grid Master Candidate, anycast, and internal and external views. Watch that candidate promotion is manual, so it belongs in a tested runbook.

Encrypted DNS at agency resolvers: from 9.1, BIND serves DoT and DoH, but on X6 hardware only. Protective DNS: per-view forwarders send egress to CISA while the Grid keeps local logs. Watch one thing. CISA's FAQ notes that some vendors don't support the protocols for forwarding to its resolver, and our research found no Infoblox document on encrypted forwarding to CISA, so confirm it in a lab before you rely on it.

Logging: query capture, dnstap, lease history, CEF syslog and the Data Connector cover what the Logging Reference Architecture maps; watch the ingest caps and dnstap's drop behavior. Inventory for BOD 23-01, BOD 26-04 and CM-8: IPAM, discovery, cloud vDiscovery and Asset Insights give the authoritative address record; watch the dedicated hardware for Network Insight. IPv6: IPv6 Grids, DHCPv6 and prefix delegation, but DHCP failover is IPv4 only.

And validated cryptography is the gap: Infoblox's FIPS 140-3 modules are in NIST review, with no active certificate today.

Read across the rows: seven of eight requirements land on one platform and one database. That consolidation is the case for a governed DDI plane, and for Infoblox as a strong way to build it.`,
  "NIST SP 800-53r5; OMB M-08-23, M-22-09, M-21-07; EO 14144; CISA Protective DNS FAQ; CISA LRA; BOD 23-01, 26-04; Infoblox NIOS 9.1.x and Universal DDI docs; NIST CMVP modules in process.");
}

// ================================================================== 13 FedRAMP
{
  const s = content(P1, "FedRAMP scope: what the Moderate listing covers");
  tag(s, "What");
  panel(s, "Listing", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "FR2017257053", "Infoblox Government Cloud", [
    "FedRAMP Certified, Moderate (Class C), agency path, SaaS",
    "Hosted in AWS GovCloud (US); certified Dec. 15, 2022",
    "Agency-path certification; assessor: Kratos",
    "One agency authorization; reuse 0",
    "No High listing; DoD IL not verified",
  ], 12.5);
  const boxes = [
    [HEX.teal, HEX.tealTint, "IN THE LISTING'S SCOPE", "Universal DDI · Universal Asset Insights · TIDE · Dossier. Infoblox's July 2026 post adds NIOS-X servers (vendor claim)."],
    [HEX.amber, HEX.amberTint, "NOT NAMED — ASK INFOBLOX", "Threat Defense cloud resolver · DNS Forwarding Proxy · Data Connector. Get the boundary diagram."],
    [HEX.red, HEX.redTint, "THE AGENCY'S OWN BOUNDARY", "NIOS appliances and vNIOS on agency infrastructure. No FedRAMP authorization covers them; the agency's ATO does."],
  ];
  boxes.forEach((b, i) => {
    const y = 1.5 + i * 1.12;
    box(s, `Scope ${i + 1}`, 4.8, y, 7.95, 1.02, b[1], b[0]);
    T(s, `Scope ${i + 1} text`, [
      { text: b[2], options: { bold: true, color: b[0] === HEX.amber ? HEX.amber : b[0], fontSize: 11, breakLine: true } },
      { text: b[3], options: { fontSize: 12.5 } },
    ], { x: 5.0, y: y + 0.08, w: 7.6, h: 0.88, fontSize: 12.5 });
  });
  T(s, "Paths", [
    { text: "High or DoD systems: ", options: { bold: true, color: HEX.navy } },
    { text: "plan agency-operated vNIOS, for example from the Azure Government Marketplace, not the SaaS. " },
    { text: "Feature lag: ", options: { bold: true, color: HEX.navy } },
    { text: "the FedRAMP release notes end Mar. 14, 2026; commercial runs to Oct. 17 (an inference of lag)." },
  ], { x: 4.8, y: 4.95, w: 7.95, h: 1.5, fontSize: 12.5 });
  sources(s, "Sources: FedRAMP Marketplace products.json (FR2017257053, Oct. 22, 2026); Infoblox blog, July 22, 2026 (vendor); What's New for FedRAMP; vNIOS for Azure (Azure Government).");
  notes(s,
`FedRAMP is the most misquoted part of any Infoblox proposal, so let's read the record.

The Marketplace lists Infoblox Government Cloud, package FR2017257053, as FedRAMP Certified at Moderate, which the Marketplace now labels Class C, on the agency path, as SaaS hosted in AWS GovCloud. It was certified in December 2022 through the agency path, with Kratos as assessor. It shows one agency authorization and a reuse count of zero. There's no High listing, and we couldn't verify any DoD impact level.

What's in scope? The listing names Universal DDI, Universal Asset Insights, and the Threat Defense component services TIDE and Dossier. Infoblox's July 2026 blog says the offering now includes NIOS-X servers; treat that as a vendor claim until the package says so. What isn't named: the Threat Defense cloud resolver, the DNS Forwarding Proxy and the Data Connector. Ask Infoblox for the authorization boundary diagram before you design around them.

And the biggest point: NIOS appliances and vNIOS running on agency infrastructure aren't a cloud service at all. No FedRAMP authorization covers them. They sit inside the agency's own boundary and its own ATO, so a statement like "Infoblox's FedRAMP authorization covers the DDI layer" is an overclaim.

For High or DoD systems, the path is agency-operated vNIOS, for example from the Azure Government Marketplace, which Infoblox documents.

Two practical notes. With reuse at zero, expect to do your own ATO work rather than ride a widely reused package. And Infoblox keeps separate FedRAMP release notes whose latest entry is March fourteenth, while the commercial notes run to October seventeenth, which suggests the FedRAMP instance lags commercial features. Ask for the parity list.`,
  "FedRAMP Marketplace products.json, FR2017257053 (accessed Oct. 22, 2026); Infoblox blog, July 22, 2026 (vendor); What's New in Universal DDI for FedRAMP; vNIOS for Azure.");
}

// ================================================================== 13a Trinzic against the design
{
  const s = content(P1, "Trinzic hardware against the workbook's design");
  tag(s, "What");
  table(s, "Trinzic fit", 1.5, [2.3, 5.25, 4.6], ["Workbook requirement", "What Trinzic and NIOS deliver", "Caveat"], [
    ["One authoritative policy plane", "NIOS Grid: one shared database; Grid Master as an HA pair; a candidate holds a full copy", "Candidate promotion is manual; no published Grid scale limits"],
    ["Leave AD-integrated DNS", "GSS-TSIG: Kerberos-signed updates from Windows DCs; up to 256 keys per member", "An appliance sends or accepts GSS-TSIG, not both at once"],
    ["Central DNSSEC signing", "Grid Master signs as hidden primary; keys on the Grid Master or a Thales Luna or Entrust nShield HSM", "Default algorithm is RSA/SHA1: change it before signing"],
    ["Encrypted DNS (DoT, DoH)", "Served by BIND from NIOS 9.1.0, on X6 appliances", "Free only on X6; X5 needs an extra license (vendor)"],
    ["IPAM authority and discovery", "Network views, containers, extensible attributes; ICMP, NetBIOS, TCP discovery; vDiscovery", "Network Insight needs a Discovery license and dedicated ND-series appliances that run no DNS or DHCP"],
    ["Logs at federal retention", "Reporting appliances: TR-2205 10 GB a day; TR-1405 and TR-805 5 GB a day", "5 overruns in 30 days lock reporting; send logs to the SIEM"],
    ["Authorization boundary", "Trinzic runs inside the agency's own boundary and ATO", "Not covered by the FedRAMP Moderate SaaS listing; it is the path for High or DoD"],
    ["Assurance and lifecycle", "FIPS 140-2 #4531 (Trinzic HW) Historical, Sept. 2026; 140-3 Trinzic modules Pending Review; NIAP: \"Trinzic Appliances with NIOS v9.0\" in evaluation since Aug. 17, 2026", "X6 needs NIOS 9.0.1+; hardware typically supported ~4 years after last order date; BOD 26-02 if internet-facing at end of support"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: Infoblox NIOS 9.1.x — GMC, Scale, GSS-TSIG, DNSSEC, HSM, DoT/DoH, Network Insight, Reporting; NIST CMVP #4531, MIP list; NIAP PCL; Infoblox EOL policy; CISA BOD 26-02; Book 08.");
  notes(s,
`A narrower question: if an agency buys Trinzic, the physical NIOS appliances, how well does the hardware fit the design in Book 08 of the workbook?

One authoritative policy plane: the Grid gives you one shared database, an HA Grid Master and a candidate with a full copy. But candidate promotion is manual, and Infoblox publishes no Grid scale limits, so size it with the vendor.

Leaving Active Directory–integrated DNS: GSS-TSIG lets domain controllers send Kerberos-signed updates to the Grid. But an appliance can send GSS-TSIG updates or accept them, not both, so plan which members do which.

DNSSEC signing is central, on the Grid Master, with keys there or in a Thales Luna or Entrust nShield HSM. Change the RSA SHA-1 default. Encrypted DNS is served by BIND from 9.1, free only on X6; X5 needs an extra license.

IPAM and basic discovery are built in, but Network Insight needs a Discovery license and dedicated ND-series appliances that run no DNS or DHCP. Reporting appliances have daily ingest caps; five overruns in thirty days lock reporting, so send logs to the SIEM.

Trinzic sits inside the agency's own boundary and ATO. The FedRAMP Moderate listing doesn't cover it, which is why it's the path for High and DoD.

Assurance and lifecycle: certificate 4531 for Trinzic hardware went Historical in September, the FIPS 140-3 Trinzic modules are pending review, and NIAP has been evaluating Trinzic appliances with NIOS 9.0 since August 17. X6 needs NIOS 9.0.1 or later. Hardware is typically supported about four years after its last order date, and an internet-facing appliance past end of support may fall under BOD 26-02, though it doesn't name DNS appliances.`,
  "Infoblox NIOS 9.1.x: Promoting a Grid Master Candidate, About Grids, About GSS-TSIG, Configuring DNSSEC on a Grid, Setting DNSSEC Parameters, Thales Luna HSM, DoT and DoH Architecture, About Network Insight, Supported Reporting Appliances; NIOS 9.1.0 blog (vendor); NIST CMVP certificate 4531 and Modules In Process list; NIAP PCL; Infoblox End-of-Life policy; CISA BOD 26-02; FedRAMP products.json; Book 08.");
}

// ================================================================== 13b Trinzic alone or with cloud DDI
{
  const s = content(P1, "Trinzic alone, or with cloud DDI?");
  tag(s, "How");
  panel(s, "Alone", 0.6, 1.5, 4.65, 2.5, HEX.navy, HEX.navyTint, "TRINZIC ALONE", null, [
    "Sees into clouds: vDiscovery of AWS, Azure, Google Cloud; one-way import of Route 53, Azure DNS, Cloud DNS zones",
    "Can't own cloud DNS: no write-back, no cloud private zones",
    "Doesn't manage Route 53 VPC Resolver rules or Azure rulesets",
    "Not the VPC IPAM authority; no DHCP in cloud subnets",
  ], 11.5);
  const opts = [
    [HEX.teal, HEX.tealTint, "A  vNIOS in each cloud", "Grid members in AWS, Azure (incl. Azure Government) or Google Cloud, in HA pairs; they serve signed zones without holding keys."],
    [HEX.navy, HEX.navyTint, "B  Grid + Universal DDI", "The only Infoblox path that writes back to cloud DNS. Government edition: Moderate, limited discovery. Cloud forwarders run on NIOS-X, not classic Trinzic."],
    [HEX.amber, HEX.amberTint, "C  Trinzic beside native cloud DNS", "Conditional forwarding both ways through the clouds' resolver endpoints. The VPC IPAM handoff to Infoblox isn't available in GovCloud."],
  ];
  opts.forEach((o, i) => {
    const y = 1.5 + i * 0.85;
    box(s, `Option ${"ABC"[i]}`, 5.45, y, 7.3, 0.78, o[1], o[0]);
    T(s, `Option ${"ABC"[i]} text`, [
      { text: o[2], options: { bold: true, color: o[0], fontSize: 12.5, fontFace: "Cambria", breakLine: true } },
      { text: o[3], options: { fontSize: 11 } },
    ], { x: 5.6, y: y + 0.04, w: 7.05, h: 0.72, fontSize: 11 });
  });
  subhead(s, "Guidance head", "DESIGN GUIDANCE, NOT A RULE: WHICH PATTERN FITS", 0.6, 4.2, 12.15);
  const rows = [
    ["Mostly on premises", "C: the Grid stays authoritative; clouds forward to it"],
    ["Hybrid, one cloud", "A + C: an HA vNIOS pair keeps answers local"],
    ["Multi-cloud, Moderate or below", "Add B for cloud DNS write-back"],
    ["GovCloud, Azure Gov, High, IL4–5", "A + C only; don't depend on the SaaS"],
  ];
  const gw = (12.15 - 3 * 0.15) / 4;
  rows.forEach((r, i) => {
    const x = 0.6 + i * (gw + 0.15);
    box(s, `Guide ${i + 1}`, x, 4.55, gw, 1.05, "FFFFFF", HEX.line);
    T(s, `Guide ${i + 1} text`, [
      { text: r[0], options: { bold: true, color: HEX.navy, fontSize: 12, breakLine: true } },
      { text: r[1], options: { fontSize: 11 } },
    ], { x: x + 0.1, y: 4.6, w: gw - 0.2, h: 0.95, fontSize: 11 });
  });
  T(s, "Explainer", [
    { text: "Go deeper: ", options: { bold: true, color: HEX.teal } },
    { text: "the Research explainer \"Trinzic Alone, or Trinzic Plus Cloud DDI?\" covers each option, split-brain and where keys and IPAM authority live." },
  ], { x: 0.6, y: 5.8, w: 12.15, h: 0.6, fontSize: 12.5 });
  sources(s, "Sources: Infoblox vDiscovery, cloud DNS sync, vNIOS, Onboarding NIOS, Cloud Forwarders, FedRAMP notes; AWS Route 53 Resolver, VPC IPAM; Microsoft Learn; Google Cloud DNS.");
  notes(s,
`So can Trinzic run an agency's DDI alone once workloads move to AWS, Azure and Google Cloud?

On its own, it can see into the clouds. vDiscovery pulls in cloud networks and VMs on a schedule, and NIOS can import Route 53, Azure DNS and Google Cloud DNS zones, one way only. What it can't do is own cloud DNS. Changes made in NIOS don't write back, and it can't create the clouds' private zones. No NIOS document describes managing Route 53 VPC Resolver rules or Azure DNS Private Resolver rulesets. It isn't the authority for AWS VPC IPAM, and DHCP in cloud subnets stays with the cloud fabric.

There are three ways to extend it, and they combine. Option A puts vNIOS members in each cloud, joined to the Grid, Azure Government included, so answers stay local during a WAN cut. Option B joins the Grid to Universal DDI, the only Infoblox path that writes back to cloud DNS, but the government edition is Moderate only, with limited discovery: single AWS accounts and no Azure tenants. Its cloud forwarders run on NIOS-X servers, not classic Trinzic. Option C keeps the native cloud resolvers and wires them to the Grid with conditional forwarding in both directions. And the AWS VPC IPAM handoff to Infoblox isn't available in GovCloud.

The bottom row is design guidance, not a rule. Mostly on premises: Option C. Hybrid with one cloud: A plus C. Multi-cloud at Moderate or below: add B. GovCloud, Azure Government, FedRAMP High, or IL4 and IL5: A plus C, and don't depend on the SaaS. For the full reasoning, see the Research explainer, Trinzic Alone, or Trinzic Plus Cloud DDI?`,
  "Infoblox NIOS 9.1.x vDiscovery and Cloud Network Automation; Route 53, Azure DNS and Google Cloud DNS integration pages; vNIOS for AWS, Azure and Google Cloud; Onboarding NIOS Services; Configuring Cloud Forwarders; What's New in Universal DDI for FedRAMP; Universal Asset Insights credential pages; Limitations of Universal DDI; AWS Route 53 VPC Resolver and VPC IPAM docs, What's New Nov. 17, 2025; Microsoft Learn Azure DNS Private Resolver; Google Cloud DNS best practices.");
}

// ================================================================== 14 Assurance
{
  const s = content(P1, "Assurance: STIGs, FIPS 140, NIAP and SP 800-81r3");
  tag(s, "What");
  table(s, "Assurance", 1.5, [2.25, 5.4], ["Check (Oct. 22, 2026)", "Infoblox status"], [
    [{ text: "DISA STIG" }, "NIOS 9.x STIG V1R1 (benchmark Jul. 28, 2026, 45 rules); Infoblox 8.x DNS V1R4 (Sept. 30, 2026, 69 rules); DNS SRG also applies"],
    ["FIPS 140, active", "None"],
    ["FIPS 140-2", "#4531 (hardware), #4535 (virtual): Historical since the Sept. 21, 2026 sunset; existing systems only"],
    ["FIPS 140-3", "Four modules in CMVP review or pending review (Sept. 29 – Oct. 9, 2026)"],
    ["NIAP / Common Criteria", "No current certificate; NIOS 9.0 in evaluation since Aug. 17, 2026 (NDcPP v3.0e)"],
    ["CDM APL", "Not listed; the APL takes no new submissions"],
    ["FedRAMP", "Moderate SaaS (previous slide); the only one among dedicated DDI vendors"],
  ], { fontSize: 11.5 });
  panel(s, "NIST", 8.45, 1.5, 4.3, 4.95, HEX.amber, HEX.amberTint, "NIST SP 800-81r3 (FINAL, MAR. 2026)", "Cite it with a disclosure", [
    "Protective DNS, query logging, DHCP lease history, encrypted DNS, DNSSEC",
    "Two of its three authors, Cricket Liu and Ross Gibson, are Infoblox employees",
    "That's influence, not an authorization: disclose it when citing 800-81r3 for Infoblox",
  ], 12.5);
  sources(s, "Sources: DISA STIG file store (NIOS 9.x V1R1; IB 8.x DNS V1R4); NIST CMVP certs #4531, #4535, modules in process; NIAP PCL; CC Portal; CISA CDM APL (Apr. 2025); NIST SP 800-81r3.");
  notes(s,
`Assurance evidence, checked on October twenty-second.

DISA STIGs are a real strength. DISA's file store has an Infoblox NIOS 9.x STIG, version 1 release 1, with a benchmark date of July 28, 2026 and forty-five rules, and an Infoblox 8.x DNS STIG at version 1 release 4 from September 30, with sixty-nine rules. The generic DNS SRG applies too. Neither BlueCat nor EfficientIP has a vendor-specific STIG.

FIPS 140 is the weak spot, so say it plainly. Infoblox has no active FIPS 140 certificate today. Its FIPS 140-2 certificates, 4531 for hardware and 4535 for virtual appliances, moved to the Historical list with the September 21, 2026 sunset, and NIST says Historical modules may be used for existing systems only. Four FIPS 140-3 submissions are in the CMVP queue, in review or pending review since late September and early October. Until those certificates post, a new NIOS deployment that depends on validated crypto can't cite an active certificate.

NIAP: there's no current Common Criteria certificate. NIOS 9.0 has been in evaluation since August 17, 2026. Infoblox isn't on the CDM Approved Products List, and that list isn't accepting new submissions, so don't expect it to change.

And a word on NIST SP 800-81 Revision 3, the Secure DNS Deployment Guide, final in March 2026. It's the best practical guide we have: Protective DNS, query logging, lease history, encrypted DNS, DNSSEC. But two of its three authors, Cricket Liu and Ross Gibson, are Infoblox employees. That's expertise and influence, not an authorization. Whenever you cite 800-81r3 in support of choosing Infoblox, disclose it.`,
  "DISA STIG file store, U_Infoblox_NIOS_9-x_V1R1 and U_IB_8-x_DNS_V1R4; NIST CMVP certificates 4531, 4535 and modules-in-process list; NIAP PCL; Common Criteria Portal; CISA CDM APL, April 2025; NIST SP 800-81r3 title page.");
}

// ================================================================== 15 Comparison
{
  const s = content(P1, "A fair comparison: dedicated DDI and native clouds");
  tag(s, "What");
  const C = (t) => ({ text: t, options: { fontSize: 10.5 } });
  table(s, "Compare", 1.5, [1.9, 2.1, 2.0, 1.75, 1.85, 2.55], ["Dimension", "Infoblox", "BlueCat", "EfficientIP", "Windows Server", "Azure / AWS / Google"], [
    ["FedRAMP", C("Moderate SaaS"), C("None"), C("None"), C("n/a (agency-run)"), C("High (each CSP)")],
    ["FIPS 140 active", C("None; 140-3 in review"), C("#5506, 140-3, to 2029"), C("None"), C("CNG (not re-verified)"), C("Inherit CSP")],
    ["Vendor DISA STIG", C("NIOS 9.x, IB 8.x DNS"), C("None"), C("None"), C("Windows DNS"), C("n/a")],
    ["Multi-cloud DNS", C("Route 53, Azure, Google (one console)"), C("AWS, Azure, GCP (vendor)"), C("Route 53, Azure; GCP (vendor)"), C("None"), C("Own cloud only")],
    ["DNS security", C("RPZ, TIDE, tunneling, DGA"), C("RPZ, feeds (vendor)"), C("DNS Guardian (vendor)"), C("Query policies; no feeds"), C("Firewall or policy lists; AWS adds DGA")],
    ["DHCPv6 failover", C("No (IPv4 only)"), C("Not verified"), C("Claims HA modes"), C("No (IPv4 only)"), C("n/a")],
    ["Automation", C("2 Terraform, 2 Ansible, ServiceNow"), C("Terraform; Micetro Ansible"), C("Community Terraform"), C("PowerShell"), C("Native")],
  ], { fontSize: 11 });
  callout(s, "Fair", 5.35, 1.1, "FaScaleBalanced", HEX.teal, "Fair framing: ",
    "the only purpose-built DDI platform with a FedRAMP-authorized SaaS, integrated by AWS and Google. A strong default for a hybrid estate, not the only viable choice.");
  sources(s, "Sources: FedRAMP products.json; NIST CMVP #5506; DISA STIG store; BlueCat, EfficientIP pages (vendor); Microsoft Learn; AWS, Google Cloud docs; Terraform Registry; Ansible Galaxy.");
  notes(s,
`A fair comparison, column by column.

FedRAMP: Infoblox is the only dedicated DDI vendor here with a listing, at Moderate. BlueCat and EfficientIP have none. But the hyperscalers' government clouds are all FedRAMP High, a higher ceiling than Infoblox's SaaS.

FIPS 140: BlueCat leads. It holds an active FIPS 140-3 certificate, number 5506, valid to 2029. Infoblox's is still in review, and EfficientIP has none.

STIGs: Infoblox has two current vendor-specific STIGs; BlueCat and EfficientIP have none, and Windows DNS has its own.

Multi-cloud DNS: Infoblox manages Route 53, Azure DNS and Google Cloud DNS from one interface. BlueCat and EfficientIP claim similar coverage on their product pages. Each cloud's native service covers only that cloud, and Windows covers none.

DNS security: Infoblox has the broadest set, response policy zones plus TIDE intelligence and tunneling and DGA analytics. Azure uses domain lists and a Microsoft feed, AWS DNS Firewall Advanced adds DGA and tunneling detection, Google's response policies are passthrough only, and Windows DNS policies have no feed integration.

DHCPv6 failover is missing everywhere we checked, Infoblox and Windows included, so it's not a differentiator. EfficientIP claims extra DHCP high-availability modes; that's a vendor claim.

Automation: two partner-tier Terraform providers, two Ansible collections and ServiceNow give Infoblox the deepest set. EfficientIP's Terraform provider is community tier.

Where alternatives win: BlueCat's Micetro manages existing Windows and BIND servers in place, and a single-cloud workload may need no third-party plane. So the fair claim is the one on the slide: a strong default for a hybrid federal estate, not the only viable choice.`,
  "FedRAMP Marketplace products.json; NIST CMVP certificate 5506; DISA STIG store; BlueCat Integrity and Micetro pages, EfficientIP SOLIDserver datasheet (vendor); Microsoft Learn DNS Policies and DHCP failover; Azure DNS resolver policy; Route 53 DNS Firewall Advanced; Google Cloud response policies and DNS Armor; Terraform Registry; Ansible Galaxy.");
}

// ================================================================== 16 Risks 1
{
  const s = content(P1, "Risks: certifications, vulnerabilities, authorization");
  tag(s, "Why");
  table(s, "Risks1", 1.5, [2.3, 5.1, 4.75], ["Risk", "Evidence (Oct. 2026)", "How to manage it"], [
    ["No active FIPS 140 certificate", "140-2 certs Historical since Sept. 21, 2026; four 140-3 modules in review. BlueCat holds active #5506", "Make go-live depend on the issued cert, or a POA&M; ask which NIOS versions the modules cover"],
    ["No NIAP certificate; not on CDM APL", "NIOS 9.0 in NIAP evaluation; the APL is closed to submissions", "Track the evaluation; don't promise APL status"],
    ["Critical NIOS CVEs, 2025–2026", "Four CVEs at 9.1–9.8 (Feb. 2025); RCE CVE-2025-61880 (Feb. 2026). None in CISA KEV", "Patch cadence and LTS train in the ATO plan; Grid management off untrusted networks"],
    ["BIND dependency", "NIOS-X updates in Sept. 2026 fixed BIND CVEs; CISA added BIND CVE-2015-5477 to KEV Oct. 8", "Ask for a BIND-advisory SLA and a not-affected attestation; track ISC advisories"],
    ["Moderate ceiling, low reuse", "SaaS is Moderate only; 1 authorization, reuse 0", "Agency-operated vNIOS for High or DoD; budget a full ATO"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: NIST CMVP (#4531, #4535, #5506, modules in process); NIAP PCL; CISA CDM APL; NVD CVE API; CISA KEV catalog 2026.10.21; Infoblox Cloud release notes; FedRAMP products.json.");
  notes(s,
`Now the risks, stated plainly, with how to manage each one.

First, cryptographic validation. There's no active FIPS 140 certificate today. The 140-2 certificates went Historical with the September 21 sunset, and four 140-3 modules are in NIST review. BlueCat holds an active certificate. If your system requires validated cryptography at award, make go-live depend on the issued certificate, or carry the gap as a POA&M item with a date. Ask Infoblox which NIOS versions the pending modules cover, because a certificate for the wrong version doesn't help.

Second, there's no current NIAP certificate; NIOS 9.0 is in evaluation. And Infoblox isn't on the CDM Approved Products List, which is closed to new submissions. Track the NIAP evaluation, and don't promise anyone APL status.

Third, vulnerabilities. NVD lists four NIOS CVEs from February 2025 rated between 9.1 and 9.8, including improper authentication for Grids, and a remote-code-execution deserialization flaw, CVE-2025-61880, from February 2026. None of the Infoblox CVEs is in CISA's Known Exploited Vulnerabilities catalog. Write the patch cadence and the Long-Term Support train into the ATO plan, and keep the Grid management plane off untrusted networks.

Fourth, the BIND dependency. NIOS and NIOS-X run on BIND, and NIOS-X updates in September 2026 shipped to address lists of BIND CVEs. On October eighth CISA added an old BIND flaw, CVE-2015-5477, to the KEV catalog. Ask Infoblox for its BIND advisory SLA and a written attestation that current releases aren't affected by KEV-listed BIND CVEs, and track ISC's advisories yourself.

Fifth, the SaaS ceiling is Moderate, and reuse is zero. Use agency-operated vNIOS for High or DoD systems, and budget a full ATO.`,
  "NIST CMVP certificates 4531, 4535, 5506 and modules-in-process list; NIAP PCL; CISA CDM APL; NVD CVE API (keyword Infoblox); CISA KEV catalog 2026.10.21; Infoblox Cloud release notes; FedRAMP products.json.");
}

// ================================================================== 17 Risks 2 and asks
{
  const s = content(P1, "Risks: cost, capacity, features, and procurement asks");
  tag(s, "How");
  table(s, "Risks2", 1.5, [2.05, 5.0], ["Risk", "Evidence and mitigation"], [
    ["Token licensing", "Three token types in minimum packs; expire at term end; overage by \"True Forward\" (vendor). Model 3–5 year TCO"],
    ["Reporting ingest caps", "5 or 10 GB a day; 5 overruns in 30 days locks reporting. Size it, or send logs to the SIEM"],
    ["Encrypted DNS hardware", "DoT and DoH on X6 only; X5 needs a license. Plan the X6 refresh"],
    ["DNSSEC default", "RSA/SHA1 out of the box. Set RSA/SHA-256 or ECDSA in the build standard"],
    ["Hybrid limits", "Portal can't promote candidates or manage DHCP failover. Keep Grid Manager runbooks"],
    ["Stale collateral", "An older Infoblox post still says Universal DDI isn't FedRAMP. Cite the Marketplace record"],
  ], { fontSize: 11.5 });
  panel(s, "Asks", 7.85, 1.5, 4.9, 4.95, HEX.amber, HEX.amberTint, "PUT THESE IN THE CONTRACT", "Procurement asks", [
    "FIPS 140-3 certificate timeline, versions covered, and a remedy if it slips",
    "BIND advisory SLA and KEV not-affected attestation",
    "FedRAMP boundary diagram and commercial-parity list",
    "Reporting sizing for 6-month searchable retention",
    "Token true-forward caps; data-export clause",
  ], 12.5);
  sources(s, "Sources: Infoblox Universal DDI Tokens FAQ, Supplemental Terms (vendor); Reporting appliances; NIOS 9.1.0 blog (vendor); DNSSEC Parameters; Limitations of Universal DDI; EOL policy.");
  notes(s,
`The second set of risks is about cost, capacity and features.

Licensing. Universal DDI uses three token types, management, server and reporting, sold in minimum packs. Tokens are a subscription entitlement that expires at the end of the term, can only be rebalanced within a type, and overage is handled by what Infoblox calls True Forward, on a rolling three-month average. Model total cost over three to five years, including the hardware refresh: Infoblox's end-of-life policy typically supports hardware four years after its last order date.

Reporting capacity. We covered the ingest caps; five overruns in thirty days locks reporting. Size the Reporting tier for the retention you need, or make the SIEM the system of record for logs.

Encrypted DNS needs X6 hardware, or an extra license on X5. Plan the refresh around the encrypted DNS deadline.

DNSSEC defaults to RSA with SHA-1. Put SHA-256 or ECDSA in the build standard so nobody signs with the default.

Hybrid limits: the Portal can't promote a Grid Master Candidate or manage DHCP failover associations, so keep Grid Manager runbooks for both.

And stale collateral: an older Infoblox blog post still says Universal DDI isn't FedRAMP compliant. Cite only the Marketplace record.

On the right are the procurement asks that turn these risks into obligations. A FIPS 140-3 certificate timeline, the versions it covers, and a remedy if it slips. A BIND advisory SLA with a KEV not-affected attestation. The FedRAMP boundary diagram and a commercial-parity list. Reporting sized for six months searchable. Caps on token true-forward, and a clause guaranteeing you can export your data.`,
  "Infoblox Universal DDI Tokens FAQ and Supplemental Terms (vendor); Supported Reporting Appliances; NIOS 9.1.0 blog (vendor); Setting DNSSEC Parameters; Limitations of Universal DDI; Infoblox EOL policy; Infoblox Top 12 Questions post (search summary).");
}

// ================================================================== 18 Module 3 divider
{
  const s = divider(P2, "Module 3: Divisions on NIOS", "Part 2 — Divisions under central governance",
    ["The permission model and scoping a group to one division", "Network views, DNS views, attributes and approvals", "Sign-in, Microsoft servers, what stays central, reporting", "Separating DNS, DHCP and IPAM by team"], 16,
    "Sources: Infoblox NIOS 9.1.x and 9.0 admin guides — permissions, admin groups, views, EAs, approvals, authentication, reporting.");
  notes(s,
`Part 2: divisions under central governance. Module 3 covers divisions on NIOS.

Most agencies aren't one network. Bureaus, regional offices and labs run their own address space and often their own DNS, and a central policy plane only works if those divisions can still do their jobs through it, because a division that can't will work around it. NIOS has a detailed permission model for exactly this. We'll go through how it decides access, how to scope an admin group to one division, the views and attributes that separate divisions, approvals and their one big gap, sign-in, Microsoft servers, what stays central, and a reporting surprise.`,
  "Infoblox NIOS 9.1.x and 9.0 administration guides; Book 08, Chapter 11.");
}

// ================================================================== 19 Permission model
{
  const s = content(P2, "The NIOS permission model: deny first, most specific");
  tag(s, "What");
  panel(s, "Levels", 0.6, 1.5, 5.6, 2.55, HEX.navy, HEX.navyTint, "LEVELS AND SCOPE", null, [
    "Read/Write, Read-Only, Deny; Deny is the default for every resource",
    "Global permissions cover a whole type; object permissions one member, zone, network or record",
    "Inheritance runs parent to child; a more specific setting overrides",
  ], 12.5);
  panel(s, "Groups", 0.6, 4.15, 5.6, 2.3, HEX.teal, HEX.tealTint, "WHO CAN CHANGE THE RULES", null, [
    "Only superusers create admin groups, roles and EA definitions",
    "So a division can't widen its own rights",
    "A local admin superuser always exists (break-glass)",
  ], 12.5);
  subhead(s, "Order head", "HOW NIOS RESOLVES OVERLAPPING PERMISSIONS", 6.45, 1.5, 6.3);
  flow(s, "Order", 1.85, 1.35, [
    { head: "Most specific object", body: "first, then up" },
    { head: "Group's own", body: "permissions first" },
    { head: "Then roles", body: "in listed order" },
    { head: "First found wins", body: "later ones ignored", color: HEX.red, tint: HEX.redTint },
  ], 11, 6.45, 6.3);
  T(s, "Example", [
    { text: "Example: ", options: { bold: true, color: HEX.red } },
    { text: "role 1 grants Read-Only on A records and role 2 grants Read/Write on the same records. The admin gets Read-Only. Grid Manager flags overlaps with \"See Conflicts.\"" },
  ], { x: 6.45, y: 3.4, w: 6.3, h: 1.0, fontSize: 12.5 });
  T(s, "Roles", [
    { text: "Roles: ", options: { bold: true, color: HEX.navy } },
    { text: "reusable permission sets, up to 21 per group. The system DNS Admin and DHCP Admin roles cover every member and every managed Microsoft server, so they're too broad for a division." },
  ], { x: 6.45, y: 4.55, w: 6.3, h: 1.4, fontSize: 12.5 });
  sources(s, "Sources: Infoblox NIOS — Administrative Permissions; Admin Groups; Admin Roles; Managing Overlaps; Superuser Admin Groups; Managing EAs.");
  notes(s,
`The NIOS permission model has three levels: read-write, read-only and deny. Deny is the default for every resource, which is the right starting point for divisions: a new group sees nothing until you grant it something.

Permissions come in two scopes. Global permissions cover every object of a type, for example every DHCP network. Object permissions cover one specific member, zone, response policy zone, network, record or fixed address, together with what's inside it. Inheritance runs from parent to child, and you override it by setting a permission at a more specific level, such as deny on one fixed address inside a read-write network.

When permissions overlap, NIOS resolves them in a fixed order. It starts at the most specific object and works up. At each level it checks permissions assigned directly to the group first, then the group's roles in the order they're listed. The first permission it finds wins, and everything after it is ignored. So if one role grants read-only on A records and a later role grants read-write on the same records, the admin gets read-only. Grid Manager flags overlaps with a See Conflicts link and an Overlaps filter.

Roles are reusable permission sets, up to twenty-one per group. Be careful with the system roles: DNS Admin and DHCP Admin grant read-write across all members and all managed Microsoft servers, far too broad for a division.

The governance lever is on the left. Only superusers can create admin groups and roles, or define extensible attributes, so a division can't widen its own rights. And a local admin superuser always exists, so someone can still log in if the directory or OCSP is down.`,
  "Infoblox NIOS: About Administrative Permissions, About Admin Groups, About Admin Roles, Applying Permissions and Managing Overlaps, Creating Superuser Admin Groups, Managing Extensible Attributes.");
}

// ================================================================== 20 Scoping recipe
{
  const s = content(P2, "Scoping an admin group to one division");
  tag(s, "How");
  flow(s, "Recipe", 1.5, 1.15, [
    { head: "1 Create the group", body: "Limited-access; only the interfaces it needs" },
    { head: "2 Grant objects", body: "Container or view, zones, members" },
    { head: "3 Leave the rest", body: "at the default Deny" },
    { head: "4 Bind DNS to IP", body: "Turn on DNS object permissions", color: HEX.amber, tint: HEX.amberTint },
  ], 11.5);
  const b = table(s, "Grants", 2.85, [3.0, 4.6], ["Object", "What a division grant does"], [
    ["Network container or network", "RW reaches every object inside; overrides globals"],
    ["Network view (own space)", "RW reaches networks, ranges, fixed addresses"],
    ["DNS view RO + zones RW", "Division creates zones, can't edit the view"],
    ["Record types in a zone", "e.g. RW on MX and SRV, Deny on CNAME"],
    ["Member DNS / DHCP", "Confines work to the division's own members"],
    ["Restart DNS/DHCP on member", "Restarts without changing properties"],
  ], { fontSize: 11.5 });
  panel(s, "Setting", 8.45, 2.85, 4.3, 3.6, HEX.amber, HEX.amberTint, "ONE GRID SETTING TO TURN ON", "DNS Object Permissions in Networks and Ranges", [
    "A, AAAA, PTR and host records need RW on the zone and the IP's network",
    "Stops a division pointing names at another division's addresses",
    "Tasks-only groups suit help-desk staff",
  ], 12);
  sources(s, "Sources: Infoblox NIOS — Limited-Access Admin Groups; Object Permissions; Network View, IPAM, DNS View, Zone, Record permissions; DNS in Networks and Ranges.");
  notes(s,
`Here is the recipe for scoping one admin group to one division, built from Infoblox's permission pages.

Step one, as a superuser, create a limited-access group and turn on only the interfaces it needs: GUI, API, or CLI with specific command groups. Limited-access groups never get the console. For help-desk staff, a group can be restricted to the Tasks Dashboard only, so they run approved task packs and nothing else.

Step two, grant object permissions. Read-write on the division's network container or networks reaches every object inside them and overrides global settings. If the division has overlapping space, grant read-write on its own network view instead, which reaches its networks, ranges and fixed addresses. For DNS, the documented pattern is read-only on the parent DNS view and read-write on the division's zones, so the division can create zones without editing the view. You can go finer, per record type: read-write on MX and SRV, deny on CNAME. And Member DNS and Member DHCP permissions confine the group's service work to its own members, with a separate permission to restart services without changing properties. Only superusers can change Grid-level DNS and DHCP properties.

Step three, leave everything else at the default deny.

Step four is the one people miss. Turn on the Grid property called Enable DNS Object Permissions in Networks and Ranges. With it on, creating an A, AAAA or PTR record or a host needs read-write on both the zone and the network or range that holds the address. Without it, a division with write access to a shared zone could point a name at another division's addresses. Fixed address and reservation permissions are always enforced either way.`,
  "Infoblox NIOS: Creating Limited-Access Admin Groups; Defining Object Permissions; Administrative Permissions for Network Views, IPAM Resources, DNS Views, Zones and Resource Records; Permissions for DNS Resources in Networks and Ranges; DNS and DHCP Permissions on Grid Members.");
}

// ================================================================== 21 Views and EAs
{
  const s = content(P2, "Network views, DNS views and extensible attributes");
  tag(s, "What");
  panel(s, "NV", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "NETWORK VIEWS", "For overlapping space", [
    "A single routing domain; views may overlap (two merged firms both on 10.0.0.0/24)",
    "Up to 1,000; the default view can be renamed, not deleted",
    "A DHCP member serves one view, and both failover peers the same one",
    "So a division with overlapping space needs its own DHCP members",
  ], 12);
  panel(s, "DV", 4.75, 1.5, 4.0, 4.95, HEX.teal, HEX.tealTint, "DNS VIEWS", "Different answers by client", [
    "Match on source IP or TSIG key; first match wins",
    "Each network view gets default.<view>; a DNS view belongs to one network view",
    "Only one DNS view per network view takes dynamic updates",
    "A catch-all external view placed first hides the internal one",
  ], 12);
  panel(s, "EA", 8.9, 1.5, 3.85, 4.95, HEX.amber, HEX.amberTint, "EXTENSIBLE ATTRIBUTES", "Tag, don't permit", [
    "e.g. Division, CostCenter; types, lists, required flag",
    "Inherit view → container → network → range → host",
    "\"Required\" is enforced only in Grid Manager, not WAPI or CSV",
    "EAs drive Smart Folders and reports, not permissions",
  ], 12);
  sources(s, "Sources: Infoblox NIOS — Configuring Network Views; About DNS Views; Managing Extensible Attributes; Inheritable EAs; Smart Folders and EA filters.");
  notes(s,
`Three constructs separate divisions on NIOS, and each has a rule that shapes the design.

Network views. A network view is a single routing domain with its own networks. Views are mutually exclusive, so two of them can hold the same addresses; You can have up to a thousand, and the default view can be renamed but not deleted. The design rule: a DHCP member serves only one network view, and both failover peers must serve the same one. So a division with overlapping space needs its own DHCP members. Remember too that nothing on NIOS enforces uniqueness across views; that's a Universal DDI feature, in Module 4.

DNS views give different answers to different clients, matched on source address or TSIG key, and the first match wins. Every network view gets an automatic DNS view called default dot the view name, and a DNS view belongs to exactly one network view. Only one DNS view per network view can receive dynamic DNS updates. And order matters: put a catch-all external view first and the internal view is never reached.

Extensible attributes are metadata: such as Division and CostCenter, with types, allowed values and a required flag. They inherit down from the network view to the container, network, range and host. Two cautions. Required is enforced only in Grid Manager; objects created through the API or CSV import can skip it, so your automation has to enforce the Division tag. And attributes drive smart folders, dashboards and reports, not permissions. We found no way to grant access by attribute value. Access is always scoped by objects: containers, networks, views and zones.`,
  "Infoblox NIOS: Configuring Network Views; About DNS Views; Managing Extensible Attributes; Configuring Inheritable EAs; Smart Folders and EA filters.");
}

// ================================================================== 22 Approval workflow
{
  const s = content(P2, "Approval workflow, and the CSV import gap");
  tag(s, "How");
  flow(s, "Wf", 1.5, 1.1, [
    { head: "Submitter group", body: "one workflow per group" },
    { head: "Approver group", body: "approve, reschedule, reject" },
    { head: "Runs as submitter", body: "with a task ID in the audit log" },
    { head: "Notify", body: "submitter, approver or both" },
  ], 11.5);
  panel(s, "Covered", 0.6, 2.8, 4.0, 3.65, HEX.navy, HEX.navyTint, "WHAT CAN BE APPROVED", null, [
    "Zones, views and records (not SOA)",
    "Networks, containers, ranges, fixed addresses",
    "Microsoft objects NIOS supports; RPZs",
    "Ticket number: Required, Optional or Not Used",
    "Not service restarts",
  ], 12);
  panel(s, "Blocked", 4.75, 2.8, 4.0, 3.65, HEX.teal, HEX.tealTint, "SUBMITTERS CAN'T, EVEN WITH RIGHTS", null, [
    "Sign or unsign zones, import DS, roll KSKs",
    "Reclaim, resize or split networks",
    "Bulk edits and bulk deletes",
    "Recycle Bin restore, RPZ ordering",
  ], 12);
  panel(s, "CSV", 8.9, 2.8, 3.85, 3.65, HEX.red, HEX.redTint, "THE GAP", "CSV imports bypass approval", [
    "\"CSV imports do not require approvals\"",
    "Grid Manager warns if a submitter can import",
    "Remove CSV import from every division group",
  ], 12);
  sources(s, "Sources: Infoblox NIOS — Configuring and Creating Approval Workflows; Unsupported Operations for Submitters; Supported Tasks for Admin Groups; Scheduling Tasks; Audit Log.");
  notes(s,
`The approval workflow is how central keeps a hand on division changes without doing the work.

Only superusers create workflows. Each workflow routes tasks from one submitter group to an approver group; a submitter group has exactly one workflow, while an approver group can serve several. Approvers approve, approve with a new execution time, or reject. Approved tasks run with the submitter's permissions and land in the audit log with a task ID. You can require a ticket number and comments, and notify either side.

What can go through approval: DNS zones, views and records except SOA; hosts, networks, containers, ranges, fixed addresses and reservations; Microsoft objects that NIOS supports; response policy zones and their rules. Service restarts aren't subject to approval.

Some operations are blocked for submitters even if they hold the permission: signing or unsigning zones, importing DS records and rolling key-signing keys; reclaiming, resizing or splitting networks; bulk edits and deletes; Recycle Bin restores and RPZ ordering. Those stay with central staff, which suits a federal model well.

Now the gap. CSV imports bypass approval entirely. Infoblox's own page says CSV imports do not require approvals, and Grid Manager shows a warning when a submitter group holds CSV import permission. If you leave that permission in place, a division can load a thousand records with no review at all. Remove CSV import from every division submitter group, and give bulk loads to a central group that works under a change ticket.`,
  "Infoblox NIOS: Configuring Approval Workflows; Creating Approval Workflows; Unsupported Operations for Submitters; Supported Tasks for Different Admin Groups; Scheduling Tasks; Audit Log.");
}

// ================================================================== 23 Authentication
{
  const s = content(P2, "Admin sign-in: CAC/PIV, SAML with Entra, directories");
  tag(s, "Who");
  table(s, "Auth", 1.5, [2.2, 5.2], ["Method", "What NIOS documents"], [
    ["Policy", "Ordered list of server groups; remote groups map to local admin groups by name; first match wins"],
    ["AD, LDAP, RADIUS, TACACS+", "Directory group decides the admin group; AD nested groups resolved"],
    ["CAC / PIV", "X.509 client certificate plus OCSP check; both must pass; name matched from SAN UPN, email or DN"],
    ["SAML 2.0 (\"Azure SSO\")", "IdP group attribute must exactly match a NIOS group name; else saml-group"],
    ["Local", "The admin superuser stays as break-glass"],
  ], { fontSize: 11.5 });
  panel(s, "Gotchas", 8.2, 1.5, 4.55, 4.95, HEX.red, HEX.redTint, "CHECK THESE", null, [
    "Certificate sign-in to WAPI fails if the Grid Master has a Cloud Network Automation or Cloud API license",
    "SAML-only users can't run CLI commands",
    "Confirm whether Entra sends group names or object IDs; NIOS needs an exact name",
    "Order mappings so a user in two groups lands where you intend",
  ], 12);
  sources(s, "Sources: Infoblox NIOS — Authenticating Administrators; Authentication Policy; Remote Admins; Certificate Authentication Services; SAML; AD Nested Groups.");
  notes(s,
`Who can sign in, and which group they land in, is the other half of division scoping.

NIOS supports local accounts, RADIUS, Active Directory, LDAP, TACACS+ and SAML, in any combination. The authentication policy is an ordered list of server groups, plus an ordered list that maps remote groups to local admin groups by name. The first match wins, and there's an optional default group. So a directory, for example an AD security group per division, decides which division an administrator belongs to, and AD nested groups are resolved recursively.

For federal staff the important one is certificate authentication. NIOS authenticates administrators by X.509 client certificate, and its documentation names CAC and PIV smart-card holders as the example. Certificate status is checked against an ordered list of OCSP responders, and both the authentication policy and the OCSP check must pass. The admin name is matched from the certificate's UPN, email or subject.

SAML 2.0 lists Azure SSO among its identity provider types. The provider sends a group attribute, and the user lands in the NIOS group whose name exactly matches; otherwise in a default SAML group.

Four things to check. Certificate-based sign-in to the API doesn't work if the Grid Master holds a Cloud Network Automation or Cloud API license, so decide that before you license. SAML-only users can't run CLI commands. Infoblox's Universal DDI guide says Entra sends group object IDs, while NIOS needs an exact group name match, and we couldn't confirm which the NIOS Azure SSO type expects, so test it. And because the first mapping wins, order mappings so a user in two groups lands where you intend. Keep the local admin as break-glass.`,
  "Infoblox NIOS: Authenticating Administrators; Defining the Authentication Policy; About Remote Admins; Two-Factor and Certificate Authentication Services; SAML pages; AD Nested Groups; Creating Limited-Access Admin Groups; Universal DDI SAML for Entra ID.");
}

// ================================================================== 24 Microsoft, central, reporting
{
  const s = content(P2, "Microsoft servers, what stays central, and reporting");
  tag(s, "Who");
  panel(s, "MS", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "A DIVISION'S WINDOWS DNS AND DHCP", null, [
    "Managed over MS-RPC, no agent; read-only or read/write; Microsoft Management license",
    "Each server syncs into one network view and one DNS view, fixed after first sync",
    "Grant the division rights on its own server objects, not DNS/DHCP Admin",
    "Changing the managing member or mode reverts unsynced edits",
  ], 12);
  panel(s, "Central", 4.75, 1.5, 4.0, 4.95, HEX.teal, HEX.tealTint, "WHAT STAYS CENTRAL", null, [
    "Grid Master and candidates; Grid DNS and DHCP properties",
    "DNSSEC keys and signing (Grid Master or HSM only)",
    "RPZ and Threat Defense policy",
    "Groups, roles, EAs, workflows, authentication policy",
    "Top-level address blocks",
  ], 12);
  panel(s, "Report", 8.9, 1.5, 3.85, 4.95, HEX.red, HEX.redTint, "REPORTING DOESN'T FILTER", null, [
    "Report data ignores object permissions",
    "Granting a division the Reporting app exposes agency-wide DNS and DHCP data",
    "Scope by shared dashboards per role, filtered by EA",
  ], 12);
  sources(s, "Sources: Infoblox NIOS — Managing Microsoft Servers; Admin Roles; Grid permissions; DNSSEC on a Grid; RPZ permissions; Reporting permissions; EA filters.");
  notes(s,
`Three topics close the NIOS module.

First, a division that still runs Windows DNS and DHCP. NIOS manages those servers over MS-RPC with no agent, read-only or read-write, with a Microsoft Management license on the managing member. Each Windows server syncs into exactly one network view and one DNS view, fixed after the first sync. Each server object carries its own permissions inside Grid Manager, so give the division's group rights on its own servers rather than the system DNS Admin or DHCP Admin roles, which cover every Microsoft server. And be careful: changing the managing member, or switching from read-write to read-only, reverts any edits made in Grid Manager since the last sync.

Second, what stays central in every design. The Grid Master and its candidates, and Grid-level DNS and DHCP properties, which only superusers can change anyway. DNSSEC keys and signing, because only the Grid Master or its HSM can sign. Response policy zones and Threat Defense policy, so security posture is uniform. The definitions of groups, roles, attributes and workflows, and the authentication policy. And the top-level address blocks.

Third, a limitation that surprises almost everyone. NIOS reporting doesn't filter by object permissions. Infoblox's page says that when you view a DNS or DHCP report, you see all the data, even for objects you have no permission to see. So giving a division the Reporting app exposes agency-wide DNS and DHCP data, which matters a great deal for a law-enforcement bureau. Scope reporting by which dashboards you share with each division's role, filtered by the Division attribute, not by row-level security.`,
  "Infoblox NIOS: Managing Microsoft Servers; About Admin Roles; Administrative Permission for the Grid; Configuring DNSSEC on a Grid; RPZ license and permissions; Reporting permissions; EA filters and Smart Folders.");
}

// ================================================================== 24a Separating by service team
{
  const s = content(P2, "Separating DNS, DHCP and IPAM by team");
  tag(s, "How");
  T(s, "Label", [
    { text: "ILLUSTRATIVE DESIGN — NOT A VALIDATED CONFIGURATION.  ", options: { bold: true, color: HEX.red } },
    { text: "Deny by default; first match wins, most specific object first, group before roles." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.35, fontSize: 12.5 });
  table(s, "Teams", 1.85, [1.6, 3.65, 3.2, 3.7], ["Team", "What to grant", "What to deny or leave out", "The catch"], [
    ["DNS team", "RW on its DNS views and zones (record types as needed); Member DNS and restart on its DNS members", "Networks, ranges and fixed addresses; DHCP members", "Per-type grants work (RW on MX and SRV, Deny on CNAME); RPZ rules take only global permissions"],
    ["DHCP team", "Object permissions on DHCP ranges and fixed addresses; Member DHCP and restart on DHCP members", "Networks and containers; zones", "A permission on a network covers its ranges and fixed addresses, so grant the ranges, not the network"],
    ["IPAM team", "RW on network containers and networks, to allocate space", "DNS and DHCP members; explicit Deny on DHCP ranges", "Network RW inherits to ranges and fixed addresses; the Deny keeps DHCP ranges with the DHCP team"],
    [{ text: "Division admin (contrast)", options: { color: HEX.slate } }, "RW on its own container and zones; Member DNS and DHCP on its own members", "Everything else, at the default Deny", "Cuts by address space, not by service: one group runs all three"],
  ], { fontSize: 11 });
  panel(s, "Coupling", 0.6, 4.95, 7.0, 1.55, HEX.amber, HEX.amberTint, "THE DELIBERATE COUPLING", null, [
    "Grid property \"Enable DNS Object Permissions in Networks and Ranges\": A, AAAA and PTR records and hosts need RW on the zone and the network",
    "A check between the DNS and IPAM teams; decide who holds both",
  ], 11.5);
  panel(s, "Central", 7.75, 4.95, 5.0, 1.55, HEX.navy, HEX.navyTint, "CENTRAL STAYS CENTRAL", null, [
    "Only superusers create admin groups, roles, EAs and approval workflows",
    "No defined permission on a Grid member means Deny",
  ], 11.5);
  sources(s, "Sources: Infoblox NIOS — Administrative Permissions; Global and Object Permissions; Managing Overlaps; Zones; Grid Members; DNS in Networks and Ranges; Admin Groups.");
  notes(s,
`Divisions aren't the only way to cut DDI. Many agencies split it by service instead: DNS, DHCP and IPAM teams, each working across the whole agency. NIOS supports that with the same permission model, but each service has a catch. This is an illustrative design, not a validated configuration.

First, the rules. Everything is denied by default. A global permission covers every object of a type, so read-write on all DHCP networks also covers their ranges and fixed addresses. An object permission covers one member, zone, network, record or fixed address. Inheritance runs parent to child, a more specific permission overrides, and the first match wins, with the group's own permissions checked before its roles.

The DNS team gets read-write on its DNS views and zones, per record type if needed, and Member DNS on its DNS members. No network rights. Note that response policy zone rules only take global permissions.

The DHCP team is where the catch is. A permission on a network covers its ranges and fixed addresses, so don't grant networks. Grant object permissions on the ranges and fixed addresses, plus Member DHCP and restart on the DHCP members.

The IPAM team gets read-write on network containers and networks to allocate space. That inherits down to ranges and fixed addresses, so if the DHCP team must own them, add an explicit deny on the DHCP ranges.

For contrast, a division admin gets all three services inside one slice of address space.

Two points stay Grid-wide. Turn on DNS Object Permissions in Networks and Ranges, and A, AAAA and PTR records and hosts need read-write on both the zone and the network. That's a deliberate check between the DNS and IPAM teams. And only superusers create groups, roles, attributes and approval workflows.`,
  "Infoblox NIOS: About Administrative Permissions; Defining Global Permissions; Defining Object Permissions; Applying Permissions and Managing Overlaps; Administrative Permissions for Zones; DNS and DHCP Permissions on Grid Members; Administrative Permission for the Grid; Permissions for DNS Resources in Networks and Ranges; About Admin Groups.");
}

// ================================================================== 24b Service teams and divisions together
{
  const s = content(P2, "Service teams and divisions together");
  tag(s, "Who");
  T(s, "Label", [
    { text: "ILLUSTRATIVE DESIGN — NOT A VALIDATED CONFIGURATION.  ", options: { bold: true, color: HEX.red } },
    { text: "The worked example's four divisions, scoped by service and by space." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.35, fontSize: 12.5 });
  table(s, "Grid", 1.85, [1.6, 3.65, 3.35, 3.55], ["Division", "DNS", "DHCP", "IPAM"], [
    ["HQ", "Central DNS team: agency.gov internal and external; DNSSEC signing", "HQ admins: Member DHCP and its ranges in 10.0.0.0/12", "Central IPAM team keeps the top-level blocks as containers"],
    ["LEB", "leb.agency.gov on leb-ns-1/2, with Member DNS", "Member DHCP and its ranges in 10.16.0.0/12", "Container 10.16.0.0/12, allocated by central"],
    ["REG", "reg.agency.gov from its Windows servers", "Rights on its own Microsoft server objects", "Container 10.32.0.0/12, allocated by central"],
    ["LAB", "lab.agency.gov delegated to lab BIND; DS records to central", "Member DHCP on lab-dhcp-1/2, in view nv-lab", "10.0.0.0/16 in its own view nv-lab (overlaps HQ)"],
  ], { fontSize: 11 });
  panel(s, "UDDI", 0.6, 4.8, 7.9, 1.7, HEX.teal, HEX.tealTint, "ON UNIVERSAL DDI", null, [
    "Access policy = role + user group + access view; divisions can't manage users or roles",
    "Separate DNS and DHCP roles? Docs conflict (IPAM, DNS, DHCP roles vs. four IPAM roles only): confirm with Infoblox",
    "DHCP objects can't be assigned to access views; ranges, subnets, fixed addresses inherit the parent's view",
  ], 11);
  panel(s, "Report", 8.65, 4.8, 4.1, 1.7, HEX.red, HEX.redTint, "REPORTING CAUTION", null, [
    "NIOS report and search data ignore object permissions",
    "A service split doesn't hide data in reports",
  ], 11.5);
  sources(s, "Sources: illustrative, from Infoblox NIOS permissions, network views, DNSSEC, Microsoft servers, reporting; Portal Access Views, Access Control, Access Policies.");
  notes(s,
`Service teams and divisions aren't alternatives. Most agencies combine them, because a grant can be scoped by service and by address space at once. Again, it's illustrative, using the worked example's four divisions.

The central DNS team keeps agency dot gov, internal and external, and DNSSEC signing, which only the Grid Master or its HSM can do. The central IPAM team keeps the top-level blocks as network containers and allocates each division its slash twelve. Divisions take over DHCP: each division's admins get Member DHCP and restart on their own DHCP members, and read-write on their ranges, inside their own space.

Read the grid by row. HQ's DHCP admins work in ten slash twelve. LEB serves its own zone from its own members, with Member DNS and DHCP on them. REG's Windows servers are managed from the Grid, so its admins get rights on those server objects. And LAB, with overlapping space, has its own network view, its own DHCP members, and a delegated zone whose DS records go to central.

On Universal DDI the picture changes. An access policy binds a role, a user group and an access view. Whether a division can have separate DNS and DHCP roles depends on a documentation conflict: one Infoblox page lists DDI IPAM, DNS and DHCP roles, while another says only the four DDI IPAM roles are supported in this release. Confirm with Infoblox. DHCP objects can't be assigned to access views directly; ranges, subnets and fixed addresses inherit their access view from their parent. And divisions can't administer their own users or roles.

One reporting caution applies however you split. On NIOS, report and search data ignore object permissions, so any team or division with the Reporting app sees agency-wide DNS and DHCP data.`,
  "Illustrative design synthesized from Infoblox NIOS: Object Permissions, DNS and DHCP Permissions on Grid Members, Network Views, Network Containers, Delegated Zones, Configuring DNSSEC on a Grid, Managing Microsoft Servers, Reporting permissions; Infoblox Portal: About Access Views, Supported Objects for Access Views, Setting Up Access Control, Creating Access Policies.");
}

// ================================================================== 25 Module 4 divider
{
  const s = divider(P2, "Module 4: Universal DDI divisions and operating model", "Part 2 — Divisions under central governance",
    ["Access views, IP spaces, IPAM Federation, Entra SSO", "Four delegation patterns and a worked example", "Who does what, rollout sequence, decisions"], 10,
    "Sources: Infoblox Portal and Universal DDI docs — access views, RBAC, IP spaces, federation, SSO, audit; Book 08, Ch 09–10.");
  notes(s,
`Module 4: divisions on Universal DDI, and the operating model.

Universal DDI has its own divisional construct, access views, and its own answer to overlapping address space, IPAM Federation, which NIOS lacks. We'll cover those and their limits, including a conflict in Infoblox's own documentation you'll need to resolve with them. Then we'll step back to four delegation patterns and their trade-offs, walk through an illustrative design for four divisions, set out who does what, and end with a rollout sequence and the decisions to take next.`,
  "Infoblox Portal and Universal DDI documentation; Book 08, Chapters 09 and 10.");
}

// ================================================================== 26 Universal DDI divisions
{
  const s = content(P2, "Universal DDI: access views, IP spaces, federation");
  tag(s, "What");
  panel(s, "AV", 0.6, 1.5, 6.0, 3.3, HEX.navy, HEX.navyTint, "ACCESS VIEWS: THE DIVISION CONTAINER", null, [
    "Corporate admins create sub-views under the account's default view; one level only",
    "Assign IP spaces, address blocks, DNS views and zones, synced cloud and AD zones included",
    "Users, roles and policies live only at the default view: divisions can't manage their own",
    "Can't be deleted or renamed; about 10 minutes to propagate; interactive users only",
  ], 12);
  panel(s, "IP", 6.75, 1.5, 6.0, 3.3, HEX.teal, HEX.tealTint, "IP SPACES AND IPAM FEDERATION", null, [
    "IP space = network view; spaces may overlap",
    "Federation enforces uniqueness across Universal DDI, NIOS and cloud IPAM",
    "Federated realm, federated block, delegation, overlapping block, reserved block",
    "Access policy = role + user group + access view; keep TD and access-control admin central",
  ], 12);
  T(s, "SSO", [
    { text: "Entra SSO: ", options: { bold: true, color: HEX.navy } },
    { text: "non-gallery SAML app; group claim by object ID, mapped to Portal user groups. " },
    { text: "Audit: ", options: { bold: true, color: HEX.navy } },
    { text: "13 months, with user, source IP and object. Login can be limited to CIDRs per group." },
  ], { x: 0.6, y: 4.95, w: 6.9, h: 1.5, fontSize: 12.5 });
  panel(s, "Conflict", 7.65, 4.95, 5.1, 1.5, HEX.red, HEX.redTint, null, null, [
    "Docs conflict: one page lists IPAM, DNS and DHCP roles for access views, another says IPAM roles only. Confirm with Infoblox",
  ], 12);
  sources(s, "Sources: Infoblox Portal — Access Views; Access Policies; RBAC; User Group Restrictions; SAML for Entra ID; Audit Logs. Universal DDI — IP Spaces; IPAM Federation.");
  notes(s,
`On Universal DDI the division construct is the access view, which Infoblox describes as a logical container for DDI resources, built for divisional admins. The account itself is the default access view. Corporate admins create sub-views under it, and only one level is allowed. Divisional admins can't see or manage anything outside their sub-view.

You can assign IP spaces, address blocks, DNS views and zones, including synced cloud and Active Directory zones. Assign an IP space and everything in it follows. The constraints are significant. Users, roles and policies are defined only at the default view, so divisions can't administer their own users. Access views can't be deleted or renamed once created, so name them carefully. They take about ten minutes to propagate. And only interactive users work fully in them; service users with API keys can't log in to one.

IP spaces are the Universal DDI version of network views, and they can overlap. What NIOS lacks is IPAM Federation, which enforces uniqueness across Universal DDI, NIOS and cloud IPAM, with realms, federated blocks, delegations, overlapping blocks for space behind NAT, and reserved blocks.

Access policies bind a role, a user group and an access view. Keep the Threat Defense and access-control administrator policies central. Entra sign-in uses a non-gallery SAML app whose group claim carries object IDs, mapped to Portal groups. The audit log keeps thirteen months.

And a documentation conflict. One Infoblox page lists IPAM, DNS and DHCP roles for access views; another says only IPAM roles are supported in this release. Confirm with Infoblox before you design around DNS or DHCP roles.`,
  "Infoblox Portal: About Access Views, Supported Objects, Setting Up Access Control, Creating Access Views, Interactive and Service Users, Access Policies, Restricting User Groups, SAML for Entra ID, Mapping User Groups, Audit Logs; Universal DDI: IP Spaces, IPAM Federation.");
}

// ================================================================== 27 Patterns
{
  const s = content(P2, "Four delegation patterns and their trade-offs");
  tag(s, "Who");
  table(s, "Patterns", 1.5, [2.45, 3.1, 3.4, 3.2], ["Pattern", "Strengths", "Risks", "Central must keep"], [
    ["(a) Central Grid, delegated admin groups", "One database, one audit log, one DNSSEC and RPZ posture; deny by default", "Permission sprawl; first-match surprises; CSV bypass; reporting unfiltered", "Groups, roles, EAs; Grid DNS and DHCP properties"],
    ["(b) Division-owned members in the Grid", "Local resilience and restarts; division confined to its appliances", "No Grid-level changes; signed zones still primary on the Grid Master", "Grid Master and candidates; DNSSEC keys"],
    ["(c) Own network view or IP space", "The only way to hold overlapping RFC 1918; clean visibility boundary", "Own DHCP members per view; NIOS doesn't enforce uniqueness across views", "Top-level blocks: containers, or federated and reserved blocks"],
    ["(d) Zone delegated to division DNS", "Full autonomy; non-Infoblox servers allowed", "Central loses audit, RPZ coverage and DNSSEC of the child zone", "Parent zone, NS and glue; DS records"],
  ], { fontSize: 11.5 });
  callout(s, "Mix", 5.35, 1.1, "FaSitemap", HEX.teal, "Most agencies mix them: ",
    "(a) as the default, (b) where a division needs local resilience, (c) only for overlap, (d) only where autonomy outweighs lost coverage.");
  sources(s, "Sources: synthesis of Infoblox NIOS permissions, network views, delegated zones, DNSSEC, approvals, reporting; Universal DDI access views, IPAM Federation.");
  notes(s,
`Put together, the constructs give four delegation patterns.

Pattern (a): one central Grid, with division admin groups scoped by object permissions and changes routed through approval workflows. Its risks are permission sprawl, first-match ordering surprises, the CSV import bypass, and reporting that ignores permissions. Central keeps the definitions of groups, roles and attributes, and the Grid properties.

Pattern (b): the division owns members inside the central Grid, with member DNS and DHCP and restart permissions. It gets local resilience and local restarts, confined to its own appliances. But it can't change Grid-level properties, and if a zone is signed, the Grid Master is still its hidden primary. Central keeps the Grid Master, its candidates and the DNSSEC keys.

Pattern (c): the division gets its own network view on NIOS, or its own IP space on Universal DDI. It's the only way to hold overlapping private address space, and it draws a clean visibility boundary. It costs dedicated DHCP members per view, and on NIOS nothing enforces uniqueness across views; on Universal DDI, IPAM Federation does. Central keeps the top-level blocks.

Pattern (d): delegate a zone to DNS servers the division runs, Infoblox or not. Full autonomy, at a price: central loses the audit trail, RPZ coverage and DNSSEC for that child zone, and the delegation must sit inside a zone with a Grid primary. Central keeps the parent, the NS and glue records, and the DS records.

Most agencies mix them: (a) as the default, (b) where local resilience matters, (c) only for overlap, and (d) only where autonomy is worth the lost coverage.`,
  "Synthesis of Infoblox NIOS: Administrative Permissions, Managing Overlaps, DNS and DHCP Permissions on Grid Members, Network Views, Delegated Zones, DNSSEC on a Grid, Approval Workflows, Reporting permissions; Universal DDI: Access Views, IPAM Federation.");
}

// ================================================================== 28 Worked example
{
  const s = content(P2, "Worked example: four divisions on one Grid");
  tag(s, "How");
  T(s, "Label", [
    { text: "ILLUSTRATIVE DESIGN — NOT A VALIDATED CONFIGURATION.  ", options: { bold: true, color: HEX.red } },
    { text: "The agency owns 10.0.0.0/8 and agency.gov." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.35, fontSize: 12.5 });
  table(s, "Example", 1.85, [1.5, 2.55, 2.8, 2.05, 3.25], ["Division", "Address space", "DNS", "Pattern", "Admin group grants"], [
    ["HQ (central NetOps)", "10.0.0.0/12 in view agency", "hq.agency.gov; owns agency.gov", "(a)", "ib-hq-netops: RW container and zones; RO view"],
    ["LEB (law-enforcement bureau)", "10.16.0.0/12 in agency", "leb.agency.gov on LEB's members", "(a) + (b)", "ib-leb-ddi: RW container, zone; member DNS/DHCP, restart on leb-ns-1/2"],
    ["REG (regional office)", "10.32.0.0/12 in agency", "reg.agency.gov from Windows servers", "(a), managed Microsoft", "ib-reg-ddi: RW on its Microsoft server objects and zone"],
    ["LAB (research lab)", "10.0.0.0/16 in view nv-lab (overlaps HQ)", "lab.agency.gov delegated to lab BIND", "(c) + (d)", "ib-lab-ddi: RW view nv-lab; member DHCP on lab-dhcp-1/2"],
  ], { fontSize: 11 });
  T(s, "Controls", [
    { text: "Grid-wide: ", options: { bold: true, color: HEX.navy } },
    { text: "DNS object permissions on · no CSV import for division groups · one workflow per division, approver ib-central-approvers, ticket required · SAML group names match exactly · local admin as break-glass · " },
    { text: "LEB: ", options: { bold: true, color: HEX.red } },
    { text: "no LEB data in other divisions' dashboards; consider a bureau-lead approver." },
  ], { x: 0.6, y: 5.15, w: 12.15, h: 1.3, fontSize: 12.5 });
  sources(s, "Sources: illustrative design built from Infoblox NIOS permissions, network views, DNS views, delegated zones, approval workflows, SAML, Microsoft servers and reporting pages.");
  notes(s,
`Here's a worked example. It's an illustrative design, not a validated configuration.

The agency owns ten slash eight and agency dot gov, with four divisions. HQ is the central network operations team. LEB is a law-enforcement bureau that needs confidentiality from the other divisions. REG is a regional office still running Windows DNS and DHCP. And LAB is a research lab whose ten dot zero slash sixteen overlaps HQ.

HQ, LEB and REG share the network view called agency, each with its own slash twelve container tagged with a Division attribute that inherits down. HQ's group gets read-write on its container and zones and read-only on the internal view; central keeps agency dot gov itself. LEB adds pattern (b): its zone is served by its own members, with member DNS, DHCP and restart rights on them. REG's Windows servers are managed from the Grid, and its group gets rights on those server objects and its zone, not the system Microsoft roles.

LAB is the overlap case. It gets its own network view, nv-lab, with its own DHCP members, because a DHCP member serves one view. And its zone is delegated to two lab-run BIND servers, pattern (d), inside the Grid-primary agency dot gov. If agency dot gov is signed, the lab hands its DS records to central.

Grid-wide controls: turn on DNS object permissions, so HQ can't point a name into LEB's space. No CSV import for any division group. One approval workflow per division, approved by a central group, with a ticket number required. SAML group names that match exactly, and the local admin as break-glass. For LEB, keep its data out of other divisions' dashboards, and consider a bureau-lead approver group if central shouldn't see change detail.`,
  "Illustrative design synthesized from Infoblox NIOS: Network Views, DNS Views, Extensible Attributes, Object Permissions, DNS Resources in Networks and Ranges, Delegated Zones, Approval Workflows, SAML, Managing Microsoft Servers, Reporting permissions.");
}

// ================================================================== 29 RACI
{
  const s = content(P2, "Who does what: the DDI responsibility matrix");
  tag(s, "Who");
  const C = (t) => ({ text: t, options: { align: "center" } });
  table(s, "RACI", 1.5, [4.15, 1.2, 1.15, 0.85, 1.35, 1.2, 1.15, 1.1], ["Decision or work item", "CIO", "CISO/ISSO", "AO", "Central DDI", "Network", "Division", "SecOps"], [
    ["Platform and deployment model (NIOS, SaaS, hybrid)", C("D"), C("C"), C("C"), C("R"), C("C"), C("C"), C("C")],
    ["Authorizing the cloud management plane", C("C"), C("C"), C("D"), C("R"), C(""), C(""), C("")],
    ["Division scoping: groups, views, access views", C("D"), C("C"), C(""), C("R"), C(""), C("C"), C("")],
    ["Top-level blocks and namespace design", C(""), C("C"), C(""), C("D, R"), C("C"), C("C"), C("")],
    ["DNSSEC signing and key rollover", C(""), C("D"), C(""), C("R"), C(""), C(""), C("")],
    ["RPZ and Threat Defense policy", C(""), C("D"), C(""), C("R"), C(""), C(""), C("C")],
    ["Standard record changes in a division zone", C(""), C(""), C(""), C("D"), C(""), C("R"), C("")],
    ["Approving high-impact changes", C(""), C("C"), C(""), C("D, R"), C("C"), C("C"), C("C")],
    ["Encrypted DNS exceptions past the limit", C("C"), C("C"), C("D"), C("R"), C("R"), C("C"), C("C")],
  ], { fontSize: 11.5 });
  T(s, "Key", [
    { text: "D ", options: { bold: true, color: HEX.navy } }, { text: "decides (accountable) · " },
    { text: "R ", options: { bold: true, color: HEX.navy } }, { text: "does the work · " },
    { text: "C ", options: { bold: true, color: HEX.navy } }, { text: "consulted. Adapted from Book 08's matrix; the Division column is this deck's addition." },
  ], { x: 0.6, y: 6.05, w: 12.15, h: 0.45, fontSize: 12 });
  sources(s, "Sources: Book 08, Ch 09, \"The responsibility matrix\" (roles from NIST SP 800-37 and OMB M-22-09); division column derived from Infoblox permission and workflow design above.");
  notes(s,
`Who does what. This matrix is adapted from Book 08's responsibility matrix, which separates deciding from doing: D decides and is accountable, R does the work, C is consulted. I've added a Division column for the delegated model.

The CIO decides the platform and deployment model, NIOS, the SaaS, or hybrid, with the central DDI team doing the evaluation and everyone else consulted. The authorizing official decides whether a cloud-delivered management plane is authorized at the right impact level.

The CIO also decides how divisions are scoped in the policy plane, and the central DDI team builds it: admin groups, network views, access views. Divisions are consulted, because a scope they can't work in becomes a workaround.

Central DDI owns the top-level address blocks and namespace design, deciding and doing. DNSSEC signing and key rollover, and response policy and Threat Defense policy, are control requirements, so the CISO decides them and central DDI runs them, with security operations consulted on response policy.

Standard record changes in a division's zone are where delegation pays off. Central decided in advance what a standard change is; the division does the work, inside its scope, through the approval workflow where one applies. High-impact changes, such as zones, NS and SRV records, apex records, wildcards and RPZ, stay with central to decide and do, with divisions consulted.

And an encrypted DNS exception that has no end date, or has outlived the agency's limit, goes to the authorizing official, because at that point it's a risk acceptance, not a configuration choice.`,
  "Book 08, Chapter 09, \"Decision rights and work are different things,\" \"The roles,\" \"The responsibility matrix\"; Infoblox NIOS approval workflows; Universal DDI access policies.");
}

// ================================================================== 30 Rollout and decisions
{
  const s = content(P2, "Rollout sequence, decisions and next steps");
  tag(s, "How");
  flow(s, "Seq", 1.5, 1.25, [
    { head: "1 Inventory", body: "Zones, scopes, forwarders, AD DNS" },
    { head: "2 Build central", body: "Grid Master, HSM, build standard" },
    { head: "3 Coexist", body: "Manage Windows servers in place" },
    { head: "4 Onboard divisions", body: "One at a time, pattern (a) first" },
    { head: "5 Federate clouds", body: "Cloud DNS as managed overlay" },
    { head: "6 Harden, evidence", body: "STIG, logs, audit for the AO", color: HEX.amber, tint: HEX.amberTint },
  ], 11);
  panel(s, "Decide", 0.6, 2.95, 6.0, 3.5, HEX.navy, HEX.navyTint, "DECISIONS TO TAKE", null, [
    "NIOS, Universal DDI or hybrid, per impact level",
    "Delegation pattern per division; who approves LEB-type changes",
    "FIPS 140-3: wait, or accept a POA&M",
    "Where logs live for 6 months searchable",
  ], 12.5);
  panel(s, "Next", 6.75, 2.95, 6.0, 3.5, HEX.teal, HEX.tealTint, "NEXT STEPS", null, [
    "Send Infoblox the procurement asks (Module 2)",
    "Confirm access-view roles and Entra group values",
    "Lab-test Protective DNS forwarding and DNSSEC algorithm",
    "Draft division scopes and the RACI with each division",
  ], 12.5);
  sources(s, "Sources: Book 08, index (canonical sequence) and Ch 10; Infoblox NIOS and Universal DDI docs cited in Modules 1–4; research on federal requirements and validations.");
  notes(s,
`To close, a rollout sequence, the decisions to take, and the next steps.

The sequence follows Book 08's canonical order, adapted for divisions. One: inventory everything first, zones, scopes, forwarders, and every record Active Directory DNS holds, before any domain controller is touched. Two: build the central pieces, the Grid Master and candidates, the HSM if you'll use one, and a build standard that sets the DNSSEC algorithm, logging and STIG settings. Three: coexist, by managing the existing Windows DNS and DHCP servers from the Grid in place, so nothing moves until you're ready. Four: onboard divisions one at a time, starting with pattern (a), the simplest, and adding views or delegations only where a division needs them. Five: federate the clouds. Six: harden and evidence, with the STIG applied, logs at retention, and audit trails the authorizing official can read.

The decisions to take now. Which platform model, NIOS, Universal DDI or hybrid, for each impact level. Which delegation pattern for each division, and who approves changes for a bureau that needs confidentiality. Whether to wait for the FIPS 140-3 certificate or proceed with a POA&M. And where logs will live to stay searchable for six months.

And the next steps. Send Infoblox the procurement asks from Module 2. Confirm which roles access views support, and what value Entra sends for group matching. Lab-test encrypted forwarding to CISA's Protective DNS and the DNSSEC algorithm change. And draft each division's scope and the responsibility matrix with the division itself.

In the program's analysis, Infoblox is one of the strongest ways to build a governed DDI plane for a federal agency, as long as you manage its risks in the open. One note on standing: this is the program's research analysis, under review, not an endorsement by any federal agency. Thank you.`,
  "Book 08, index (canonical sequence) and Chapter 10; Infoblox NIOS and Universal DDI documentation; federal requirements and validation research cited in Modules 1 and 2.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full lists on the following slides. All sources opened Oct. 22, 2026.");
}
const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 11), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 3, fontSize: 11 });
  sources(s, "Sources: primary documents as listed; vendor marketing labeled (vendor). Access date for all: Oct. 22, 2026.");
};
srcSlide("Sources behind the orientation and Module 1", [
  "NIST SP 800-53 Rev. 5, Release 5.2.0 (OSCAL catalog and LOW/MODERATE baselines): SC-13, SC-20, SC-21, SC-22, SC-23, CM-8, AU-2, AU-12, SI-4  ·  NIST SP 800-81r3, Secure DNS Deployment Guide, Mar. 2026 (authors Rose, Liu, Gibson).",
  "OMB M-08-23 (Aug. 22, 2008); M-22-09 (Jan. 26, 2022); M-21-07 (Nov. 19, 2020); M-26-14 (May 22, 2026, rescinds M-21-31); M-26-05; M-26-15  ·  EO 14144 §4(c) as amended by EO 14306 (Federal Register full text).",
  "CISA: Protective DNS Resolver and FAQ; Logging Reference Architecture (Aug. 20, 2026); TIC 3.0 Security Capabilities Catalog v3.3 (Sept. 2026); BOD 23-01; BOD 26-04 (June 10, 2026); BOD 26-02; BOD 18-01.",
  "Book 08, Federal Modernization Workbook: Ch 01 (DNS Is Now the Control Plane), Ch 08 (Reference Architecture), Ch 09 (Who Owns DNS, DHCP and IPAM), Ch 10 (Migration Sequence).",
  "Infoblox NIOS 9.1.x admin guide (infoblox-docs.atlassian.net, space nios91x): About Grids; Promoting a Grid Master Candidate; About HA Failover; 9.1.0 What's New; DNS Views; Anycast; DNSSEC on a Grid; Setting DNSSEC Parameters; Thales Luna HSM; DNS Firewall; GSS-TSIG; Managing Microsoft Servers; DoT and DoH Architecture.",
  "Infoblox NIOS 9.1.x: DHCP Failover; DHCPv6 RFC Compliance; DHCP Fingerprint Detection; Lease History; Enabling DDNS; Network Views; Network Containers; Discovery; Network Insight; Extensible Attributes; Query and Response Captures; dnstap limitations; Reporting Cluster Modes; Supported Reporting Appliances.",
  "Infoblox vNIOS guides (VMware X6, Azure incl. Azure Government, AWS, Google Cloud, OCI); Supported Platforms for NIOS-X Servers; NIOS upgrade matrix  ·  Universal DDI: What's New (commercial and FedRAMP); Limitations of Universal DDI; Limitations of NIOS-X as a Service; Hybrid Deployment; IPAM Federation; Route 53, Azure DNS, GCP integration limits.",
  "Infoblox Threat Defense: About; Licensing and Subscriptions; Dossier and TIDE; DNS Forwarding Proxy; TDDM for NIOS; Threat Insight  ·  Universal DDI API Guide; WAPI 2.0; WAPI Passthrough; Data Connector; Sentinel HTTPS destination.",
  "GitHub infobloxopen: terraform-provider-infoblox (v3.0.0-beta, v2.13.0), terraform-provider-bloxone, terraform-provider-nios, infoblox-ansible, universal-ddi-ansible  ·  ServiceNow Infoblox spoke  ·  Splunkbase 2934  ·  Microsoft Sentinel connectors reference  ·  AWS VPC IPAM + Infoblox; Google Cloud DNS Armor.",
  "Vendor (labeled as vendor claims): infoblox.com NIOS, Universal DDI and Threat Defense product pages; NIOS 9.0.6 and 9.1.0 blogs.",
]);
srcSlide("Sources behind Module 2 — Federal fit and risks", [
  "FedRAMP Marketplace dataset, fedramp.gov/marketplace/products.json (meta last_change Oct. 22, 2026): FR2017257053 Infoblox Government Cloud; Azure Government, AWS GovCloud, Google Services listings.",
  "DISA STIG file store, dl.dod.cyber.mil: U_Infoblox_NIOS_9-x_V1R1_STIG (benchmark Jul. 28, 2026); U_IB_8-x_DNS_V1R4_STIG (Sept. 30, 2026); DNS SRG V4R3.",
  "NIST CMVP: certificates #4531, #4535, #3332, #3330 (Infoblox, Historical); #5506 and #4692 (BlueCat); validated-modules search (EfficientIP, Men&Mice); Modules In Process list; FIPS 140-3 transition page.",
  "NIAP Product Compliant List (API) — Infoblox Trinzic Appliances with NIOS v9.0, In Progress; Common Criteria Portal certified and archived CSVs  ·  CISA CDM APL page and April 2025 APL workbook.",
  "NVD CVE API (keyword Infoblox): CVE-2024-37566, -37567, -36046, -36047; CVE-2025-61880, -61879  ·  CISA KEV JSON, catalog 2026.10.21 (incl. CVE-2015-5477)  ·  Infoblox Cloud release notes (NIOS-X DNS 3.8.11, 3.8.12).",
  "Comparison: BlueCat Integrity and Micetro pages; EfficientIP SOLIDserver DDI datasheet (Jan. 2026) — vendor  ·  Microsoft Learn: IPAM overview and WS2012 R2 planning; DNS Policies; DHCP failover; removed and deprecated features; Azure DNSSEC; DNS resolver policy; AVNM IPAM.",
  "AWS: VPC IPAM; Integrate VPC IPAM with Infoblox; What's New Nov. 17, 2025; Route 53 DNSSEC signing; Route 53 in GovCloud; DNS Firewall Advanced  ·  Google Cloud: DNSSEC; response policies; DNS Armor.",
  "Terraform Registry API (infobloxopen, bluecatlabs, efficientip-labs, menandmice providers); Ansible Galaxy API (infoblox, menandmice collections).",
  "Infoblox (vendor): Universal DDI Tokens FAQ; Universal DDI Supplemental Terms; End-of-Life policy (Mar. 31, 2025); \"Universal DDI comes to Infoblox Government Cloud\" (July 22, 2026); \"Top 12 Questions\" post (search summary).",
  "Trinzic slides — Infoblox: vDiscovery (Endpoint Server, AWS, Azure, Guidelines); Cloud Network Automation; Cloud Platform License Limitations; Route 53, Azure DNS, Google Cloud DNS integration and limits; vNIOS for AWS, Azure, Google Cloud (About, Limitations); Shared-Services VPC; Onboarding NIOS Services; Cloud Forwarders; Discovering Cloud Forwarder Endpoints; UAI AWS, Azure, GCP credentials; CMVP Modules In Process; CISA BOD 26-02.",
  "Trinzic slides — clouds: AWS Route 53 private hosted zones, VPC Resolver, inbound/outbound forwarding, GovCloud Route 53, DHCP option sets, VPC IPAM + Infoblox; Microsoft Learn DNS Private Resolver, VNet name resolution, AVNM IPAM; Google Cloud DNS best practices, server policies, Assured Workloads.",
]);
srcSlide("Sources behind Part 2 — Divisions and operating model", [
  "Infoblox NIOS (spaces nios91x and nios90): About Administrative Permissions; About Admin Groups; About Admin Roles; Creating Limited-Access and Superuser Admin Groups; Applying Permissions and Managing Overlaps; Global and Object Permissions.",
  "Infoblox NIOS: Permissions for Grid Members, IPAM Resources, Network Views, DNS Views, Zones, Resource Records; Permissions for DNS Resources in Networks and Ranges; Grid permissions; RPZ license and permissions.",
  "Infoblox NIOS: Configuring Network Views; About DNS Views; Managing and Inheritable Extensible Attributes; Network Containers; Delegated Zones; Configuring DNSSEC on a Grid.",
  "Infoblox NIOS: Configuring and Creating Approval Workflows; Unsupported Operations for Submitters; Supported Tasks for Admin Groups; Scheduling Tasks; Audit Log.",
  "Infoblox NIOS: Authenticating Administrators; Authentication Policy; Remote Admins; Two-Factor and Certificate Authentication Services; SAML (incl. Enabling SAML); AD Nested Groups; Managing Microsoft Servers; Reporting permissions; EA filters and Smart Folders; Dashboard Tasks; Multi-Grid Manager (MAG8).",
  "Infoblox Portal (BloxOneCloud): About Access Views; Supported Objects; Setting Up Access Control; Creating Access Views; Interactive and Service Users; RBAC; Access Policies; Restricting User Groups; SAML for Entra ID; Mapping User Groups; Audit Logs.",
  "Universal DDI (BloxOneDDI): IP Spaces; IPAM Federation and Federated Realms; Zone Delegation; Tags; NIOS Grid Connector; Universal DDI Agent for Microsoft.",
  "Book 08, Ch 09 (roles and responsibility matrix; NIST SP 800-37 authorizing official) and Ch 10 and index (canonical migration sequence).",
  "The worked example and the four patterns are illustrative syntheses of the pages above, not validated configurations.",
  "Separating DNS, DHCP and IPAM by team (base infoblox-docs.atlassian.net/wiki/spaces/<space>/pages/<id>): nios90/280275424 Administrative Permissions; nios90/1343324540 Global; docs.infoblox.com/space/nios90/1343095459 Object; nios91x/2397439547 Overlaps; nios91x/2397014241 Zones; nios90/1343095499 Grid Members; nios90/280668320 Grid; nios90/280401646 DNS in Networks and Ranges; nios90/280275587 Admin Groups; nios90/280857269 Reporting.",
  "Service teams and divisions together: nios91x/2456224006 Network Views; nios90/1346013877 Network Containers; nios91x/2456846341 DNSSEC on a Grid; nios90/1432781524 Delegated Zones; nios90/280662903 Microsoft Servers; BloxOneCloud/680362600 About Access Views; BloxOneCloud/680657470 Supported Objects; BloxOneCloud/680362726 Setting Up Access Control; BloxOneCloud/35431431 Creating Access Policies.",
]);

srcSlide("Learn more: official Infoblox training", [
  "Learning paths by role, costs and links: the workbook's Research page \"Infoblox Training and Learning Paths\" (docs/research/infoblox-training).",
  "Launchpad, Infoblox's learning portal: launchpad.education.infoblox.com (free with Infoblox products; organizational .gov email required; catalog behind sign-in).",
  "Certifications: NIOS Operator → Administrator → Expert (INO → INA → INE); vendor-neutral DDIA/DDIP and DSA/DSP; exams $29 / $69 / $99 per attempt (Education KB, Oct. 2026).",
  "Version currency: NIOS courses were \"refreshed against NIOS 8.6\"; pair them with the NIOS 9.1.x documentation at docs.infoblox.com and confirm the lab version with Infoblox Education.",
  "Hands-on: browser labs at infoblox.com/labs (four hours per lab); 60-day vNIOS evaluation (NIOS 9.0.3 images); lab guides at docs.education.infoblox.com/lab.",
  "Automation: NIOS 9.1.0 WAPI documentation (PDF), Universal DDI API Guide, Developer Portal, WAPI Bytes video playlist.",
  "Community and video: community.infoblox.com forums; YouTube @InfobloxInc playlists. NetMRI Administrator (IMA) exam retires Dec. 31, 2026.",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated notes: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:", per.map((p) => `${p.slide}:${p.n}`).join(" "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
