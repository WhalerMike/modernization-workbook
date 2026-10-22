// Trinzic Alone, or Trinzic Plus Cloud DDI?  A ~15-minute plain-language EXPLAINER for a federal architect still learning DDI.
//   1 Title · 2 The words you need · 3 What Trinzic does well · 4 What it sees and can't control in the clouds
//   5 Option A (vNIOS in each cloud) · 6 Option B (Grid + Universal DDI) · 7 Option C (Grid + native cloud DNS)
//   8 Rules that prevent split-brain · 9 Decision table (design guidance) · 10 Where this fits the workbook, next steps
//   Backup (not narrated): full glossary, what couldn't be verified, full source lists.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Trinzic_MultiCloud.pptx
// Modeled on presentations/research-infoblox-ddi/build.js and reuses the shared kit in ../_build/ (icons and backgrounds unchanged).
// Every fact comes from C:\tmp\ib\research_multicloud.md (primary), research_platform.md, research_compare.md,
// research_federal.md, research_divisions.md (all sources opened 2026-10-22) or Book 08 (docs/books/b08-ddi/).
// Recommendations are labeled DESIGN GUIDANCE; inferences are labeled as such; vendor claims are labeled.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Trinzic Alone, or Trinzic Plus Cloud DDI?", title: "Explainer",
  footer: "Trinzic Alone, or Trinzic Plus Cloud DDI?  ·  Explainer  ·  Research — under review" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Research_Trinzic_MultiCloud.pptx";

// ------------------------------------------------------------------ helpers (as in the Infoblox research deck)
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

const subhead = (s, name, text, x, y, w, color = HEX.slate) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color });

// Diagram pieces: a labeled box (node) and an arrow (line with a triangle head) between two points.
const node = (s, name, x, y, w, h, color, tint, headText, body, pt = 11.5) => {
  box(s, name, x, y, w, h, tint, color);
  const runs = [{ text: headText, options: { bold: true, color, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!body } }];
  if (body) runs.push({ text: body, options: { fontSize: pt, color: HEX.ink } });
  T(s, `${name} text`, runs, { x: x + 0.1, y: y + 0.07, w: w - 0.2, h: h - 0.14, fontSize: pt, paraSpaceAfter: 1, valign: "middle" });
};
const arrow = (s, name, x1, y1, x2, y2, color = HEX.slate, both = false) => {
  s.addShape(pres.shapes.LINE, { objectName: name, x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color, width: 2, endArrowType: "triangle" }, both ? { beginArrowType: "triangle" } : {}) });
};
const label = (s, name, text, x, y, w, color = HEX.slate, align = "center") =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 10.5, italic: true, color, align, valign: "middle" });

const SEC = "Explainer";

// ================================================================== 1 Title
{
  const s = titleSlide(SEC, "Trinzic Alone, or Trinzic Plus Cloud DDI?", "A plain-language explainer  ·  Research — under review");
  txt(s, "Session map", [
    { text: "ABOUT 15 MINUTES  ·  BUILT FOR ARCHITECTS STILL LEARNING DDI", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The words you need  ·  What Trinzic does well, and where it stops at the cloud edge", options: { color: HEX.ink, breakLine: true } },
    { text: "Three options: vNIOS in each cloud · Grid + Universal DDI · Grid + native cloud DNS", options: { color: HEX.ink, breakLine: true } },
    { text: "Rules that prevent split-brain  ·  Which option fits which agency", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Infoblox NIOS 9.1.x, vNIOS and Universal DDI docs; AWS, Microsoft Learn and Google Cloud docs; FedRAMP Marketplace; Book 08. All opened Oct. 22, 2026.", 6.08);
  notes(s,
`This explainer answers a question architects hit as soon as workloads move to the cloud. If we already run Infoblox Trinzic appliances on premises, can they handle DNS, DHCP and IP address management for AWS, Azure and Google Cloud by themselves? Or do we need to add some form of cloud-based DDI?

It's built for someone still learning DDI, so every term is explained the first time it appears. We start with the vocabulary, then what Trinzic does well and where it stops at the cloud edge. Then three options: Infoblox virtual appliances in each cloud, Infoblox's cloud service, and native cloud DNS alongside the Grid. Then the rules that keep answers consistent, a decision table, and where this fits the workbook.

This is research under review. Every fact comes from vendor or government documentation opened on October twenty-second, 2026, and recommendations are labeled as design guidance, not endorsements.`,
  "Infoblox NIOS 9.1.x, vNIOS and Universal DDI documentation; AWS, Microsoft Learn and Google Cloud documentation; FedRAMP Marketplace products.json; Book 08.");
}

// ================================================================== 2 Glossary
{
  const s = content(SEC, "The words you need before we start");
  tag(s, "What");
  box(s, "Basics", 0.6, 1.45, 12.15, 0.72, HEX.tealTint, HEX.teal);
  T(s, "Basics text", [
    { text: "DDI ", options: { bold: true, color: HEX.teal } },
    { text: "= DNS (names to addresses) + DHCP (hands addresses to devices) + IPAM (the record of who owns which address ranges).  " },
    { text: "Authoritative server: ", options: { bold: true, color: HEX.teal } },
    { text: "holds the official answer for a zone.  " },
    { text: "Resolver: ", options: { bold: true, color: HEX.teal } },
    { text: "the server a client asks; it finds the answer." },
  ], { x: 0.75, y: 1.5, w: 11.85, h: 0.62, fontSize: 12.5, valign: "middle" });
  const L = [
    ["Grid", "Two or more Infoblox NIOS appliances sharing one database, managed from one point"],
    ["Grid Master", "The appliance or HA pair with the master database; serves the console and API; the only DNSSEC signing primary"],
    ["Member", "Any other appliance in the Grid; serves DNS or DHCP and replicates with the Grid Master"],
    ["Trinzic", "Infoblox's physical NIOS appliance line; the current line is X6"],
    ["vNIOS", "NIOS as a virtual machine (VMware, AWS, Azure, Google Cloud, OCI and others) that can join a Grid"],
    ["NIOS-X", "Newer servers managed from the Infoblox Portal (formerly BloxOne hosts): the Universal DDI data plane"],
  ];
  const R = [
    ["Universal DDI / Infoblox Portal", "Infoblox's SaaS control plane (formerly BloxOne DDI) and its web console"],
    ["Route 53 VPC Resolver endpoints", "AWS's in-VPC resolver (renamed from Route 53 Resolver); inbound takes queries in, outbound sends them out by rules"],
    ["Private hosted zone / private zone", "A zone only linked VPCs or VNets can see (AWS / Azure, Google)"],
    ["VPC IPAM", "AWS's organization-wide IP planner; pools hand out address ranges to VPCs"],
    ["DNS Private Resolver", "Azure's managed resolver: inbound and outbound endpoints plus forwarding rulesets"],
    ["Split-brain", "Two systems each think they own a name and give different answers depending on who asks"],
  ];
  const b1 = table(s, "Infoblox terms", 2.35, [1.45, 4.5], ["Infoblox term", "Plain meaning"], L, { fontSize: 11.5 });
  const b2 = table(s, "Cloud terms", 2.35, [2.15, 3.85], ["Cloud and DNS term", "Plain meaning"], R, { x: 6.75, fontSize: 11.5 });
  sources(s, "Sources: research glossary built from Infoblox NIOS 9.1.x About Grids, vNIOS and Universal DDI docs; AWS Route 53, VPC IPAM; Microsoft Learn; Google Cloud DNS.");
  notes(s,
`First, the words you need.

DDI stands for DNS, DHCP and IPAM. DNS turns names into addresses. DHCP hands addresses to devices when they join a network. And IPAM, IP address management, is the record of which address ranges exist and who owns them. An authoritative server holds the official answer for a zone, a block of names such as corp dot agency dot gov. A resolver is the server your computer asks; it finds the answer.

A Grid is two or more Infoblox appliances that share one database and are managed from one place. That place is the Grid Master, which holds the master copy, serves the console, and is the only appliance that can sign zones with DNSSEC. Every other appliance is a member. Trinzic is Infoblox's physical appliance line; the current one is X6. vNIOS is the same software as a virtual machine, including in AWS, Azure and Google Cloud, and it can join the Grid. NIOS-X is a newer kind of server, managed from Infoblox's cloud service, Universal DDI, whose web console is the Infoblox Portal.

The cloud words. In AWS, the resolver built into every virtual private cloud, or VPC, is now called Route 53 VPC Resolver. Its endpoints are addresses that let queries come in from outside, or go out by rules. A private hosted zone in AWS, or a private zone in Azure or Google, is a zone that only linked cloud networks can see. VPC IPAM is AWS's address planner. And Azure DNS Private Resolver is Azure's version of those endpoints.

Last, split-brain: two systems each believe they own a name and give different answers depending on who asks. Avoiding it is the point of this deck.`,
  "Research glossary: Infoblox NIOS 9.1.x About Grids and Grid Master Candidate; vNIOS for AWS, Azure and Google Cloud; Universal DDI What's New (renames); AWS What is Route 53 VPC Resolver, private hosted zones, What is IPAM; Microsoft Learn Azure DNS Private Resolver; Google Cloud DNS best practices.");
}

// ================================================================== 3 What Trinzic does well
{
  const s = content(SEC, "What Trinzic is, and what it does well on premises");
  tag(s, "What");
  // a small Grid picture: Grid Master with three members
  node(s, "GM", 0.6, 1.55, 4.6, 0.95, HEX.navy, HEX.navyTint, "Grid Master (Trinzic or vNIOS, HA pair)", "Master database, console and API, DNSSEC signing", 11.5);
  const mx = [0.6, 2.2, 3.8];
  ["Member: DNS", "Member: DHCP", "Member: DNS"].forEach((m, i) => {
    node(s, `Member ${i + 1}`, mx[i], 3.25, 1.4, 0.75, HEX.teal, HEX.tealTint, m, null, 11);
    arrow(s, `Replication ${i + 1}`, 2.9, 2.5, mx[i] + 0.7, 3.25, HEX.slate);
  });
  label(s, "Replication label", "Encrypted replication, hub and spoke", 0.6, 4.05, 4.6);
  T(s, "Boundary", [
    { text: "Inside the agency boundary: ", options: { bold: true, color: HEX.navy } },
    { text: "on-premises appliances are not a FedRAMP cloud service; they sit in the agency's own authorization boundary." },
  ], { x: 0.6, y: 4.45, w: 4.6, h: 0.75, fontSize: 12 });
  panel(s, "Well", 5.45, 1.5, 7.3, 3.7, HEX.navy, "FFFFFF", "WHAT IT DOES WELL (NIOS 9.1)", null, [
    "DNS views: one Grid gives internal and external clients different answers, on purpose",
    "Response policy zones (DNS Firewall): block or redirect bad names; up to 32 RPZs, hits logged to syslog",
    "DNSSEC: Grid Master is the hidden primary; keys on the Grid Master or an HSM (Thales Luna, Entrust nShield), not both",
    "Default DNSSEC algorithm is RSA/SHA1: change it to RSA/SHA-256 or ECDSA",
    "DHCP failover pairs; manages existing Windows DNS and DHCP servers without agents",
  ], 12.5);
  callout(s, "Plane", 5.4, 1.1, "FaSitemap", HEX.teal, "Why Book 08 cares: ",
    "it wants one DDI policy plane, one system of record for zones, forwarding, IPAM and policy, with cloud DNS managed as an overlay, not replaced.");
  sources(s, "Sources: Infoblox NIOS 9.1.x — About Grids; DNS Views; DNS Firewall; DNSSEC on a Grid; DNSSEC Parameters; DHCP Failover; Microsoft Servers; Book 08, Ch 08; FedRAMP products.json.");
  notes(s,
`On premises, a Trinzic Grid is the agency's DNS and DHCP servers plus its address record, all managed from the Grid Master. Changes made there replicate to every member over encrypted tunnels.

It does several things well. DNS views let one Grid give internal clients one answer and outside clients another, on purpose. Response policy zones, which Infoblox calls DNS Firewall, block or redirect bad names, up to thirty-two of them, with hits logged to syslog. DNSSEC signing is centralized: only the Grid Master can be primary for a signed zone, and keys live on the Grid Master or on an external hardware security module, a Thales Luna or Entrust nShield, but not both. One caution: the default algorithm is RSA with SHA-1, which a federal deployment should change. DHCP runs as failover pairs. And the Grid can manage existing Windows DNS and DHCP servers without agents.

Why does that matter? Book 08 of the workbook argues for one DDI policy plane: a single system of record for zones, forwarding rules, address data and security policy, with cloud DNS managed as an overlay, not replaced. On premises, the Grid fits that role. The question is the cloud edge. And note that on-premises appliances aren't a FedRAMP cloud service; they sit inside the agency's own boundary.`,
  "Infoblox NIOS 9.1.x: About Grids, Configuring DNS Views, About Infoblox DNS Firewall, Configuring DNSSEC on a Grid, Setting DNSSEC Parameters, DHCP Failover, About Managing Microsoft Windows Servers; Book 08, Chapter 08, What a DDI policy plane is made of; FedRAMP Marketplace products.json (FR2017257053 scope).");
}

// ================================================================== 4 What Trinzic alone sees and can't control
{
  const s = content(SEC, "What Trinzic alone sees in the clouds, and can't control");
  tag(s, "What");
  panel(s, "Sees", 0.6, 1.5, 6.0, 3.85, HEX.teal, HEX.tealTint, "WHAT IT CAN DO BY ITSELF", "See, import and automate", [
    "vDiscovery: scheduled pull of networks and VMs from AWS, Azure, GCP, VMware; GovCloud option (AWS) and Azure Government covered",
    "Discovered subnets become managed networks; DNS records for VMs only in zones NIOS already has",
    "Imports Route 53, Azure DNS, Google Cloud DNS zones one way into NIOS (Cloud Network Automation license on the Grid Master)",
    "Serves imported zones to on-prem clients; Cloud Platform members and an AWS API proxy automate provisioning",
  ], 12);
  panel(s, "Cannot", 6.75, 1.5, 6.0, 3.85, HEX.red, HEX.redTint, "WHAT IT CANNOT DO", "Own or steer cloud DNS", [
    "No write-back: \"NOT vice versa\" (Route 53); NIOS edits to synced records are overwritten",
    "Can't create or own cloud private zones",
    "No Route 53 VPC Resolver rules or Azure rulesets: no NIOS doc describes it",
    "Not AWS VPC IPAM's external authority (a Universal DDI feature)",
    "No DHCP in cloud subnets: AWS leases from Amazon DHCP; GCP vNIOS DHCP is on-prem only; Azure doesn't support it",
  ], 12);
  callout(s, "Takeaway", 5.5, 0.95, "FaLightbulb", HEX.amber, "Inference: ",
    "in the clouds, Infoblox's job is DNS and IPAM; DHCP stays with the cloud fabric, and the cloud resolver still answers cloud private zones.");
  sources(s, "Sources: Infoblox NIOS 9.1.x vDiscovery (S1–S5); Cloud Network Automation (S6); Route 53, Azure DNS, GCP sync (S13–S18); AWS DHCP option sets (S23); vNIOS GCP, Azure (S20, S24).");
  notes(s,
`It can see. vDiscovery logs in to AWS, Azure, Google Cloud or VMware on a schedule and pulls back networks and virtual machines. AWS jobs have a GovCloud option, and Azure jobs cover Azure Government. Discovered subnets become managed networks, and the Grid can create records for discovered machines in zones it already has. It's a scheduled pull, not a live feed.

It can also import cloud zones. With a Cloud Network Automation license, NIOS copies Route 53, Azure DNS and Google Cloud DNS zones into the Grid, so on-premises clients can resolve cloud names. The import is one way. For Route 53, Infoblox says the sync runs into NIOS, not vice versa, and NIOS edits to those records are overwritten.

Now what it can't control. It can't create or own a cloud private zone. No NIOS document describes managing Route 53 VPC Resolver endpoints or rules, or Azure's forwarding rulesets. It can't be the outside authority for AWS VPC IPAM; that's a Universal DDI feature. And it can't run DHCP for cloud subnets. AWS hands out addresses from its own DHCP servers. Google limits vNIOS DHCP to on-premises networks, and Azure doesn't support running DHCP in Azure for on-premises networks.

So, as an inference: in the cloud, Infoblox's job is DNS and IPAM, and the cloud's resolver still answers cloud private zones.`,
  "Infoblox NIOS 9.1.x Selecting the Endpoint Server, vDiscovery AWS, Guidelines for vDiscovery Jobs, Creating DNS Records for Discovered VMs, Cloud Network Automation; Amazon Route 53 Integration Overview; Integrating Azure DNS and Google Cloud DNS with NIOS and their limitations pages; AWS DHCP option sets; Limitations of vNIOS for Google Cloud; About vNIOS for Azure.");
}

// ================================================================== 5 Option A
{
  const s = content(SEC, "Option A: vNIOS members inside each cloud");
  tag(s, "How");
  // Row 1: Grid Master to vNIOS
  node(s, "A GM", 0.6, 1.5, 3.3, 0.98, HEX.navy, HEX.navyTint, "On-prem Grid Master", "Database and DNSSEC keys stay here");
  arrow(s, "A sync", 3.9, 1.99, 5.05, 1.99, HEX.slate, true);
  label(s, "A sync label", "Grid replication", 3.85, 1.6, 1.25);
  node(s, "A vNIOS", 5.05, 1.5, 3.35, 0.98, HEX.teal, HEX.tealTint, "vNIOS HA pair in a hub VPC/VNet", "Grid member; serves signed zones, no keys");
  // Row 2: Pattern 1
  subhead(s, "A p1 head", "PATTERN 1 — POINT THE NETWORK'S DNS AT vNIOS", 0.6, 2.6, 7.8, HEX.navy);
  const r2 = 2.92, bw = 2.3, gx = [0.6, 3.35, 6.1];
  node(s, "A p1 wl", gx[0], r2, bw, 0.95, HEX.navy, "FFFFFF", "Cloud workload", "DHCP option set (AWS) or custom DNS (Azure)", 11);
  node(s, "A p1 v", gx[1], r2, bw, 0.95, HEX.teal, HEX.tealTint, "vNIOS", "Answers agency zones; applies RPZ", 11);
  node(s, "A p1 back", gx[2], r2, bw, 0.95, HEX.amber, HEX.amberTint, "Back to the cloud", "Azure 168.63.129.16 or an inbound endpoint", 11);
  arrow(s, "A p1 a1", gx[0] + bw, r2 + 0.47, gx[1], r2 + 0.47);
  arrow(s, "A p1 a2", gx[1] + bw, r2 + 0.47, gx[2], r2 + 0.47);
  // Row 3: Pattern 2
  subhead(s, "A p2 head", "PATTERN 2 — KEEP THE CLOUD RESOLVER; FORWARD BY RULE", 0.6, 4.05, 7.8, HEX.navy);
  const r3 = 4.37;
  node(s, "A p2 wl", gx[0], r3, bw, 0.95, HEX.navy, "FFFFFF", "Cloud workload", "No client change", 11);
  node(s, "A p2 r", gx[1], r3, bw, 0.95, HEX.amber, HEX.amberTint, "Native resolver", "Outbound endpoint + one rule per agency domain", 11);
  node(s, "A p2 v", gx[2], r3, bw, 0.95, HEX.teal, HEX.tealTint, "vNIOS", "Answers the forwarded agency names", 11);
  arrow(s, "A p2 a1", gx[0] + bw, r3 + 0.47, gx[1], r3 + 0.47);
  arrow(s, "A p2 a2", gx[1] + bw, r3 + 0.47, gx[2], r3 + 0.47);
  T(s, "A natives", [
    { text: "Native resolver = ", options: { bold: true, color: HEX.amber } },
    { text: "Route 53 VPC Resolver (rules shareable across accounts) · Azure DNS Private Resolver (ruleset) · Google Cloud DNS forwarding zone (Google's preferred way)." },
  ], { x: 0.6, y: 5.45, w: 7.8, h: 0.95, fontSize: 11.5 });
  panel(s, "A know", 8.65, 1.5, 4.1, 4.95, HEX.red, "FFFFFF", "WHAT TO KNOW", null, [
    "Azure, pattern 1: Azure private zones are not consulted first, so vNIOS must forward Azure names back",
    "AWS: to resolve Route 53 private zones for other networks, forward to an inbound endpoint, not the VPC's +2 resolver address",
    "Plan an HA pair per region that must survive a WAN cut (inference)",
    "vNIOS covers GovCloud discovery and Azure Government; every member is agency-operated, and no FedRAMP authorization covers it",
  ], 11.5);
  sources(s, "Sources: vNIOS for AWS, Azure, GCP (S20, S24–S27); AWS DHCP options, Resolver (S23, S30, S31, S33); Microsoft Learn (S28, S29); Google Cloud DNS (S32); research_platform.");
  notes(s,
`Option A puts vNIOS members inside each cloud, as Grid members and high-availability pairs. Infoblox's AWS reference design puts the pair in a shared-services hub VPC that syncs with the on-premises Grid Master. Signed zones stay signed: the members serve them, but the keys stay on the Grid Master.

How do cloud workloads reach vNIOS? Two documented patterns.

Pattern one: point the network's DNS at vNIOS. In AWS that's a DHCP option set; in Azure, the virtual network's custom DNS setting. Simple, with a catch. In Azure, queries then go straight to vNIOS, and Azure private zones aren't consulted first. So vNIOS has to forward Azure-private names back to Azure DNS at 168.63.129.16, or to a Private Resolver inbound endpoint.

Pattern two: keep the cloud's own resolver and forward chosen domains to vNIOS. In AWS, that's an outbound endpoint and one forwarding rule per domain, and rules can be shared across accounts. In Azure, it's an outbound endpoint and a forwarding ruleset, and clients change nothing. In Google, it's a forwarding zone, which Google prefers.

One AWS caution. If vNIOS has to resolve Route 53 private zones for other networks, forward to an inbound endpoint. AWS says forwarding to a VPC's built-in plus-two resolver address from outside that VPC isn't supported.

And every vNIOS member is agency-operated and inside the agency's boundary; no FedRAMP authorization covers it.`,
  "Infoblox About vNIOS for AWS, Shared-Services VPC Deployments, About vNIOS for Azure, Configure vNIOS as Primary DNS for Azure VNets, vNIOS for Google Cloud; AWS DHCP option sets, What is Route 53 VPC Resolver, Forwarding outbound queries, Resolving queries between VPCs and your network; Microsoft Learn DNS Private Resolver and VNet name resolution; Google Cloud DNS best practices; research_platform (DNSSEC on a Grid).");
}

// ================================================================== 6 Option B
{
  const s = content(SEC, "Option B: the Grid joined to Universal DDI");
  tag(s, "How");
  node(s, "B portal", 3.9, 1.45, 5.55, 0.78, HEX.navy, HEX.navyTint, "Infoblox Portal — Universal DDI (SaaS)", "Join token · Cloud Grid Management · IPAM Federation (NIOS 9.0.4+)", 11);
  const by = 2.75, bh = 0.95;
  node(s, "B grid", 0.6, by, 3.75, bh, HEX.navy, "FFFFFF", "NIOS Grid (Trinzic)", "Stays primary; still the console for DR and DHCP failover", 11);
  node(s, "B niosx", 4.75, by, 3.85, bh, HEX.teal, HEX.tealTint, "NIOS-X servers", "Run cloud forwarders and private zones (not classic Trinzic)", 11);
  node(s, "B cloud", 9.0, by, 3.75, bh, HEX.amber, HEX.amberTint, "Route 53 · Azure DNS · Cloud DNS", "Read-write sync; resolver endpoints and rules discovered", 11);
  arrow(s, "B a1", 5.3, 2.23, 2.48, by, HEX.slate, true);
  arrow(s, "B a2", 6.67, 2.23, 6.67, by, HEX.slate, true);
  arrow(s, "B a3", 8.05, 2.23, 10.88, by, HEX.slate, true);
  panel(s, "B limits", 0.6, 3.92, 6.0, 2.55, HEX.red, "FFFFFF", "DOCUMENTED LIMITS", null, [
    "Route 53: no non-simple routing policies; apex aliases unsupported; NS read-only",
    "Azure and Google private zones can't be created; DNSSEC records not synced",
    "Outbound cloud forwarders: AWS↔Azure only",
    "Portal can't promote a Grid Master Candidate or manage NIOS DHCP failover",
    "AWS VPC IPAM authority: Advanced Tier, private scopes only",
  ], 11.5);
  panel(s, "B gov", 6.75, 3.92, 6.0, 2.55, HEX.navy, HEX.navyTint, "THE GOVERNMENT EDITION", "Infoblox Government Cloud", [
    "FedRAMP Certified, Moderate, Agency path; hosted in AWS GovCloud (US)",
    "Discovery limits: single AWS accounts, no Azure tenants, static GCP credentials",
    "VPC IPAM–Infoblox: not in its release notes; AWS excludes GovCloud",
    "Write sync and forwarders against GovCloud or Azure Government: confirm",
  ], 11.5);
  sources(s, "Sources: Universal DDI onboarding, hybrid, limits, Route 53/Azure/GCP, cloud forwarders (S35–S48, S56); AWS VPC IPAM + Infoblox (S38, S39); FedRAMP notes (S50–S55); products.json.");
  notes(s,
`Option B joins the Grid to Universal DDI, Infoblox's software-as-a-service control plane.

You add a join token from the Infoblox Portal to the Grid, then turn on IPAM Federation and Cloud Grid Management. Federation, which needs NIOS 9.0.4 or later, keeps address space unique everywhere. The Grid stays primary for its DNS data.

What does it add? It's the only documented Infoblox mechanism that writes back to cloud DNS. It syncs Route 53, Azure DNS and Google Cloud DNS read-write, and it discovers resolver endpoints and rules in AWS and Azure. Cloud forwarders take queries in from a cloud, and cloud to cloud only between AWS and Azure. And on commercial AWS, Infoblox can be the outside authority for a VPC IPAM private scope, on the Advanced Tier.

The limits are documented. Route 53 sync doesn't support non-simple routing policies. Azure and Google private zones can't be created from the portal. DNSSEC records aren't synced. And the portal can't promote a Grid Master Candidate or manage DHCP failover, so the Grid Master stays the recovery console.

Two more notes. The cloud forwarding and private-zone features run on NIOS-X servers, not classic Trinzic, so you'd need NIOS-X capacity. And the government edition: Infoblox Government Cloud is FedRAMP Certified at Moderate, hosted in AWS GovCloud. Its cloud discovery is limited: single AWS accounts and no Azure tenants. The VPC IPAM handoff isn't in its release notes, and AWS excludes GovCloud from that integration. Confirm the rest with Infoblox.`,
  "Infoblox Onboarding NIOS Services, NIOS Grid Connector, Managing NIOS from Infoblox Portal, Universal DDI and NIOS Grid Hybrid Deployment, Limitations of AWS Route 53 Integration, Microsoft Azure Integration, Google Cloud Platform Integration, Cloud Forwarders and prerequisites, Discovering Cloud Forwarder Endpoints, Limitations of Universal DDI; AWS Integrate VPC IPAM with Infoblox and What's New Nov. 17, 2025; What's New in Universal DDI for FedRAMP; Universal Asset Insights AWS, Azure, GCP discovery pages; FedRAMP Marketplace FR2017257053.");
}

// ================================================================== 7 Option C
{
  const s = content(SEC, "Option C: Trinzic alongside native cloud DNS");
  tag(s, "How");
  node(s, "C grid", 0.6, 1.75, 2.75, 3.3, HEX.navy, HEX.navyTint, "On-prem NIOS Grid", "Authoritative for agency zones. Forwards each cloud's names to that cloud.", 12);
  const cx = 5.0, cw = 3.85, ch = 1.1, cys = [1.5, 2.85, 4.2];
  const clouds = [
    ["AWS", "Route 53 private hosted zones. In: inbound endpoint. Out: outbound endpoint + rules."],
    ["Azure", "Private DNS zones. In: Private Resolver inbound endpoint. Out: outbound endpoint + ruleset."],
    ["Google Cloud", "Private zones. In: inbound server policy. Out: forwarding zone."],
  ];
  clouds.forEach((c, i) => {
    node(s, `C ${c[0]}`, cx, cys[i], cw, ch, HEX.amber, HEX.amberTint, c[0], c[1], 11);
    const yc = cys[i] + ch / 2;
    arrow(s, `C in ${i + 1}`, 3.35, yc - 0.15, cx, yc - 0.15, HEX.navy);
    arrow(s, `C out ${i + 1}`, cx, yc + 0.15, 3.35, yc + 0.15, HEX.teal);
  });
  T(s, "C legend", [
    { text: "→ ", options: { bold: true, color: HEX.navy } }, { text: "Grid sends cloud names in  ", options: { color: HEX.ink } },
    { text: "← ", options: { bold: true, color: HEX.teal } }, { text: "cloud sends agency names out", options: { color: HEX.ink } },
  ], { x: 0.6, y: 5.12, w: 4.35, h: 0.36, fontSize: 10.5 });
  T(s, "C ipam", [
    { text: "IPAM handoff: ", options: { bold: true, color: HEX.navy } },
    { text: "the Grid owns the supernets; each cloud gets a block. Commercial AWS can automate it (VPC IPAM + Universal DDI). GovCloud, Azure, Google: manual — reserve in NIOS, create the cloud pool with that range, let vDiscovery check." },
  ], { x: 0.6, y: 5.5, w: 8.25, h: 0.95, fontSize: 11.5 });
  panel(s, "C facts", 9.1, 1.5, 3.65, 4.95, HEX.navy, "FFFFFF", "FACTS TO KNOW", null, [
    "Route 53 private zones answer only linked VPCs or via an inbound endpoint; elsewhere the name resolves on the internet",
    "Azure, with Azure-provided DNS: linked private zones, then rulesets, then Azure DNS",
    "Google: two authoritative systems; no zone transfers; forwarded answers cached 60 s",
    "GovCloud: Route 53 private DNS and Resolver endpoints work; Resolver delegation doesn't",
  ], 11);
  sources(s, "Sources: AWS private hosted zones, Resolver, GovCloud Route 53 (S22, S30–S33, S57, S61, S62); Microsoft Learn (S28, S64, S65); Google Cloud DNS (S67, S68); AWS VPC IPAM (S38, S39).");
  notes(s,
`Option C keeps the Grid authoritative for agency zones and lets each cloud's native DNS own its own private zones. The two connect by conditional forwarding: a rule that says, for names ending in this domain, ask that server.

Inward: the Grid forwards cloud domains to an inbound endpoint in AWS or Azure, or to an inbound server policy address in Google, over Direct Connect, ExpressRoute or VPN. Outward: each cloud forwards agency domains to the Grid, with an outbound endpoint and rules in AWS, a ruleset in Azure, or a forwarding zone in Google.

Facts to know. A Route 53 private hosted zone answers only inside its linked VPCs or through an inbound endpoint. Asked from anywhere else, the name resolves on the public internet instead. In Azure, a network using Azure-provided DNS checks linked private zones first, then forwarding rulesets, then Azure DNS. Google recommends exactly this design: two authoritative systems, conditional forwarding, no zone transfers.

In GovCloud, Route 53 public and private DNS work, and Resolver endpoints and rules are available, but Resolver delegation isn't.

Addresses follow the same idea. The Grid owns the agency's address blocks and hands each cloud a block. On commercial AWS, that handoff can be automated through Universal DDI. In GovCloud, Azure and Google, it's manual: reserve the block in the Grid, create the cloud pool with that range, and let vDiscovery check the result.`,
  "AWS Working with private hosted zones, What is Route 53 VPC Resolver, Forwarding inbound and outbound queries, Resolving queries between VPCs and your network, GovCloud Route 53 user guide, Route 53 endpoints; Microsoft Learn DNS Private Resolver, Azure Private DNS, AVNM IPAM; Google Cloud DNS best practices and server policies; AWS Integrate VPC IPAM with Infoblox and What's New Nov. 17, 2025.");
}

// ================================================================== 8 Split-brain rules
{
  const s = content(SEC, "The rules that prevent split-brain");
  tag(s, "How");
  label(s, "S illus", "ILLUSTRATIVE NAMES", 0.6, 1.45, 4.6, HEX.red, "left");
  node(s, "S parent", 0.6, 1.8, 4.6, 1.0, HEX.navy, HEX.navyTint, "corp.agency.gov", "Owner: NIOS Grid · signed on the Grid Master or HSM", 11.5);
  node(s, "S child", 0.6, 3.75, 4.6, 1.0, HEX.amber, HEX.amberTint, "aws.corp.agency.gov", "Owner: a Route 53 private hosted zone", 11.5);
  arrow(s, "S down", 1.2, 2.8, 1.2, 3.75, HEX.navy);
  arrow(s, "S up", 4.6, 3.75, 4.6, 2.8, HEX.teal);
  txt(s, "S down label", "On-prem resolvers forward the child to AWS", { x: 1.35, y: 3.0, w: 1.55, h: 0.55, fontSize: 10.5, italic: true, color: HEX.navy, valign: "middle" });
  txt(s, "S up label", "AWS forwards the parent to the Grid", { x: 2.95, y: 3.0, w: 1.5, h: 0.55, fontSize: 10.5, italic: true, color: HEX.teal, align: "right", valign: "middle" });
  T(s, "S mech", [
    { text: "One owner each, joined by forwarding. ", options: { bold: true, color: HEX.navy } },
    { text: "AWS also allows inbound delegation (NS glue), but Resolver delegation isn't available in GovCloud." },
  ], { x: 0.6, y: 4.95, w: 4.6, h: 0.9, fontSize: 11.5 });
  const cards = [
    ["1  One writable owner per zone", HEX.red, HEX.redTint, "Grid, Route 53, Azure Private DNS or Cloud DNS, never two. NIOS overwrites edits to imported zones; portal-owned resolver rules overwrite cloud changes: decide ownership before sync."],
    ["2  Divide the namespace by owner", HEX.navy, HEX.navyTint, "Delegate children by name. Don't create a cloud private zone with a Grid zone's name unless it's a deliberate split-horizon view."],
    ["3  DNSSEC keys stay on the Grid", HEX.teal, HEX.tealTint, "Grid Master or HSM. Route 53 can't sign private zones; Universal DDI doesn't sync DNSSEC records. Validate on agency resolvers."],
    ["4  IPAM authority stays on the Grid", HEX.amber, HEX.amberTint, "The Grid owns supernets; clouds get delegated blocks. One network view for routable space lets the Grid catch overlaps."],
  ];
  cards.forEach((c, i) => {
    const x = 5.5 + (i % 2) * 3.65, y = 1.5 + Math.floor(i / 2) * 2.5;
    node(s, `Rule ${i + 1}`, x, y, 3.5, 2.35, c[1], c[2], c[0], c[3], 11.5);
  });
  sources(s, "Sources: research_multicloud §5 (S13, S17, S18, S22, S28, S30, S33, S48, S61, S63, S66, S67); research_platform (DNSSEC on a Grid, network views); Book 08, Ch 02.");
  notes(s,
`Whatever option you pick, four rules prevent split-brain.

One: every zone has exactly one writable owner. That's the Grid, Route 53, Azure Private DNS or Cloud DNS, never two. Everything else reaches the owner by forwarding, or holds a copy that is explicitly read-only. NIOS overwrites edits to imported cloud zones, and portal-owned resolver rules overwrite cloud-side changes. So decide ownership before you turn sync on.

Two: divide the namespace by owner. For example, corp dot agency dot gov lives on the Grid, and aws dot corp dot agency dot gov lives in a Route 53 private hosted zone. On-premises resolvers forward the child to AWS, and AWS forwards the parent to the Grid. AWS also allows inbound delegation, but Resolver delegation isn't available in GovCloud. And don't create a cloud private zone with the same name as a Grid zone unless it's a deliberate split-horizon view.

Three: DNSSEC keys stay on the Grid Master or its hardware security module. Route 53 can't sign private hosted zones, and Universal DDI doesn't sync DNSSEC records, so don't sign in one system and manage through sync from another. Validation belongs on agency resolvers; the Azure-provided resolver doesn't validate.

Four: IPAM authority stays on the Grid. Clouds get delegated blocks, and one network view for routable space lets the Grid catch overlaps.`,
  "Research synthesis, Avoiding split-brain, DNSSEC keys and IPAM authority: Infoblox Route 53, Azure DNS and GCP sync pages; Discovering Cloud Forwarder Endpoints; AWS private hosted zones, Resolver, GovCloud Route 53, DNSSEC signing; Microsoft Learn DNS Private Resolver and Azure DNSSEC; Google Cloud DNS best practices; Infoblox DNSSEC on a Grid and Network Views; Book 08, Chapter 02.");
}

// ================================================================== 9 Decision table
{
  const s = content(SEC, "Which option fits your agency? Design guidance");
  tag(s, "How");
  T(s, "DG flag", [
    { text: "DESIGN GUIDANCE — NOT AN ENDORSEMENT.  ", options: { bold: true, color: HEX.red } },
    { text: "Each row rests on the documented facts in the last column." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.32, fontSize: 12.5 });
  table(s, "Decision", 1.85, [2.45, 3.3, 3.35, 3.05], ["Agency situation", "Pattern", "Why", "Rests on"], [
    ["Mostly on-prem, small cloud", "Trinzic + native resolvers + conditional forwarding (minimal C)", "Lowest cost and boundary impact; no new SaaS authorization", "NIOS can't own cloud zones; documented forwarding in all three clouds"],
    ["Hybrid, one cloud (commercial, GovCloud or Azure Government)", "A + C: HA vNIOS pair in a hub; native rules forward agency zones to it", "Resolution stays local if the WAN fails; RPZ, signed zones and Grid IPAM reach the cloud", "vNIOS documented for GovCloud discovery and Azure Government"],
    ["Multi-cloud, FedRAMP Moderate and below", "B on top of A or C (Government Cloud for federal work)", "Only Infoblox path that writes to cloud DNS and discovers resolver rules", "Government Cloud: single AWS accounts, no Azure tenants, no VPC IPAM handoff"],
    ["GovCloud, Azure Government, High, IL4–IL5", "A + C only; don't depend on Universal DDI SaaS", "Infoblox's SaaS is Moderate-only; native services carry higher authorizations", "VPC IPAM integration excludes GovCloud; Cloud DNS on Assured Workloads High/IL4/IL5; Azure Gov resolver: confirm"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: research_multicloud §5 decision table (S2, S3, S13, S20–S31, S38, S39, S41–S48, S50–S55, S61, S62, S67, S69); research_federal and research_compare (FedRAMP levels).");
  notes(s,
`The decision table. Every row is design guidance, not an endorsement, resting on the facts we've covered.

Mostly on premises, with a small cloud footprint: Trinzic with native cloud resolvers and conditional forwarding, the minimal form of Option C. It's the lowest cost, needs no new SaaS authorization, and NIOS can't own cloud zones anyway.

Hybrid with one cloud, commercial or government: add an HA vNIOS pair in a hub network, Option A plus C. It keeps resolution local if the WAN fails and extends response policy, signed zones and Grid IPAM into the cloud. vNIOS is documented for both GovCloud and Azure Government.

Multi-cloud at FedRAMP Moderate and below: add Universal DDI on top, through Government Cloud for federal work. It's the only Infoblox mechanism that writes to cloud DNS, within the Government Cloud limits.

GovCloud, Azure Government, FedRAMP High, or Defense Impact Levels 4 and 5: stay with options A and C only. Infoblox's SaaS is Moderate-only, the VPC IPAM integration excludes GovCloud, and native services carry the higher authorizations. Google lists Cloud DNS for High, IL4 and IL5 under Assured Workloads. For Azure Government, confirm DNS Private Resolver is available first.

In short, the design guidance is: Trinzic plus native cloud resolvers as the baseline, with vNIOS and Universal DDI added only where they earn their place.`,
  "Research decision guidance table and its cited sources: Infoblox vDiscovery, vNIOS for AWS and Azure, Route 53 sync, Universal DDI integrations and FedRAMP release notes, Universal Asset Insights discovery pages; AWS Resolver, VPC IPAM + Infoblox, GovCloud Route 53; Google Assured Workloads supported products; FedRAMP Marketplace products.json.");
}

// ================================================================== 10 Where it fits, decisions, next steps
{
  const s = content(SEC, "Where this fits the workbook, and next steps");
  tag(s, "How");
  panel(s, "Fit", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "WHERE IT FITS", null, [
    "Book 08, Ch 02: split-brain DNS",
    "Book 08, Ch 07: cloud private endpoints and IPAM",
    "Book 08, Ch 08: the policy plane that overlays cloud DNS",
    "Book 08, Ch 12: platform selection and residual risk",
    "Research: Infoblox DDI for Federal Agencies deep dive (platform, FedRAMP scope, risks, divisions)",
  ], 12);
  panel(s, "Decide", 4.75, 1.5, 3.85, 4.95, HEX.teal, HEX.tealTint, "DECISIONS TO TAKE", null, [
    "Which option per cloud and impact level",
    "One named owner for every zone",
    "Where DNSSEC keys live (Grid Master or HSM)",
    "How address blocks reach each cloud",
  ], 12.5);
  panel(s, "Next", 8.75, 1.5, 4.0, 4.95, HEX.amber, HEX.amberTint, "NEXT STEPS", null, [
    "Ask Infoblox for the Government Cloud boundary and a feature matrix for GovCloud and Azure Government accounts",
    "Confirm Azure Government availability of DNS Private Resolver and AVNM IPAM",
    "Size NIOS-X capacity if you want cloud forwarders",
    "Test forwarding both ways from every origin",
  ], 12);
  sources(s, "Sources: Book 08, Ch 02, 07, 08, 12; research: Infoblox DDI for Federal Agencies; research_multicloud, Couldn't verify (manual checks needed).");
  notes(s,
`Where does this fit? Book 08 makes the vendor-neutral case. Chapter 02 explains split-brain, Chapter 07 covers cloud private endpoints and IPAM, Chapter 08 describes the policy plane that overlays cloud DNS, and Chapter 12 covers platform selection. The research deep dive, Infoblox DDI for Federal Agencies, covers the platform, its FedRAMP scope, its risks, and how divisions share it.

The decisions to take: which option for each cloud and impact level; one named owner for every zone; where DNSSEC keys live; and how address blocks reach each cloud.

The next steps. Ask Infoblox for the Government Cloud authorization boundary and a feature matrix for GovCloud and Azure Government accounts. Confirm that DNS Private Resolver and Virtual Network Manager IPAM are available in Azure Government. Size NIOS-X capacity if you want cloud forwarders. And test forwarding in both directions from every origin.

One note on standing: this is research under review, not an endorsement by any federal agency. Thank you.`,
  "Book 08, Chapters 02, 07, 08 and 12; research item Infoblox DDI for Federal Agencies; research_multicloud, Couldn't verify.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full glossary, open questions and source lists on the following slides. All sources opened Oct. 22, 2026.");
}
{
  const s = content("Backup", "Full glossary");
  table(s, "Glossary A", 1.45, [1.75, 4.2], ["Term", "Meaning"], [
    ["Grid", "Two or more NIOS appliances sharing one distributed database, managed through one point"],
    ["Grid Master (GM)", "Holds the master database, serves GUI and API; only DNSSEC signing primary"],
    ["Grid Master Candidate", "Member with a full database copy; promoted to GM manually"],
    ["Grid member", "Physical Trinzic or vNIOS appliance that serves DNS or DHCP and replicates with the GM"],
    ["Trinzic", "Infoblox's physical NIOS appliance line; current line X6"],
    ["vNIOS", "NIOS virtual appliance (VMware, Hyper-V, KVM, AWS, Azure, Google Cloud, OCI)"],
    ["CNA / Cloud Platform", "NIOS licenses: CNA = GM cloud visibility, needed for Route 53 sync; CP = member answering cloud API calls (X6 only)"],
    ["NIOS-X", "Universal DDI data plane (formerly BloxOne hosts); also NIOS-X as a Service"],
  ], { fontSize: 10.5 });
  table(s, "Glossary B", 1.45, [2.1, 4.0], ["Term", "Meaning"], [
    ["Universal DDI / Infoblox Portal", "SaaS control plane (formerly BloxOne DDI) / its console (formerly CSP); FedRAMP edition: Infoblox Government Cloud"],
    ["IPAM Federation", "Realms, blocks and delegations keeping space unique across NIOS, Universal DDI and cloud IPAMs; NIOS 9.0.4+"],
    ["Private hosted / private zone", "Zone visible only to associated or linked VPCs or VNets"],
    ["Route 53 VPC Resolver endpoint", "Inbound: queries in from on-prem. Outbound: queries out by forward, system or delegation rules"],
    ["Azure DNS Private Resolver", "Inbound and outbound endpoints in dedicated subnets plus forwarding rulesets"],
    ["Forwarding zone / inbound server policy", "Google Cloud's outbound and inbound conditional forwarding"],
    ["VPC IPAM / AVNM IPAM", "AWS / Azure IP planners; a VPC IPAM private scope can name Infoblox as authority (Advanced Tier)"],
    ["Conditional forwarding · split-brain", "\"For this domain, ask that server\" · two systems giving different answers for one name"],
  ], { x: 6.65, fontSize: 10.5 });
  sources(s, "Sources: research_multicloud §6 Glossary; research_platform (renames, Grid). Conditional forwarding defined in plain language from the forwarding docs cited.");
}
{
  const s = content("Backup", "What we couldn't verify, and dropped");
  table(s, "Unverified", 1.5, [4.6, 7.55], ["Open question", "Status as of Oct. 22, 2026"], [
    ["Azure Government: DNS Private Resolver and AVNM IPAM", "Not verified; Microsoft's region page is client-rendered. Confirm before designing"],
    ["Azure Private DNS zones in Azure Government", "Seen only as a 2020 Azure Update search result, not opened"],
    ["Government Cloud write sync, cloud forwarders, Cloud Grid Management with GovCloud and Azure Government accounts", "Listed in the FedRAMP release stream; no page states end-to-end support. Ask Infoblox for the boundary and feature matrix"],
    ["NIOS managing Route 53 Resolver rules or Azure rulesets", "No NIOS doc found (absence of evidence)"],
    ["Google Cloud IPAM equivalent; DNSSEC on Cloud DNS private zones", "Not found or not researched"],
    ["Zone transfers from Route 53 or Azure DNS to NIOS", "Not checked; Google states Cloud DNS does not support zone transfers"],
    ["vNIOS GovCloud AMI / Marketplace availability", "Enablement section referenced, not opened"],
    ["Infoblox FedRAMP High or DoD IL plans", "None found"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: research_multicloud, Couldn't verify (manual check needed).");
}
const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 10.5), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 2, fontSize: 10.5 });
  sources(s, "Sources: primary documents as listed; vendor marketing labeled (vendor). Access date for all: Oct. 22, 2026.");
};
srcSlide("Sources: Infoblox NIOS and vNIOS", [
  "S1 Selecting the Endpoint Server (nios91x)  ·  S2 vDiscovery – AWS (nios91x)  ·  S3 Performing vDiscovery on Virtual Networks (vniosazure)  ·  S4 Guidelines for Configuring vDiscovery Jobs  ·  S5 Creating DNS Records for Newly Discovered VMs.",
  "S6 Cloud Network Automation (nios91x)  ·  S7 Cloud Platform License Limitations  ·  S8 Proxying Cloud API Requests  ·  S9 About the Infoblox AWS API Proxy (NAIG)  ·  S10 vNIOS for AWS Deployments  ·  S11 AWS API Proxy Use Cases  ·  S12 Limitations of vNIOS for AWS.",
  "S13 Amazon Route 53 Integration Overview (NAIG)  ·  S14 Integrating Azure DNS with NIOS  ·  S15 Prerequisites for Route 53 Integration  ·  S16 Integrating Google Cloud DNS with NIOS  ·  S17 Azure DNS Integration best practices, limitations  ·  S18 Google Cloud DNS Integration best practices, limitations.",
  "S19 Configure vNIOS as Primary DNS for Azure VNets  ·  S20 About vNIOS for Microsoft Azure  ·  S21 Deploying vNIOS for Azure from the Marketplace  ·  S24 Limitations of vNIOS for Google Cloud  ·  S25 About vNIOS for AWS  ·  S26 About vNIOS for Google Cloud  ·  S27 Shared-Services VPC Deployments  ·  S34 vNIOS for AWS with HA (BYOL/PayGo).",
  "Platform research (research_platform.md): About Grids; Promoting a Grid Master Candidate; Configuring DNS Views; Configuring DNSSEC on a Grid; Setting DNSSEC Parameters; Thales Luna HSM; About Infoblox DNS Firewall; DHCP Failover; About Managing Microsoft Windows Servers; Network Views; What's New in Universal DDI (renames).",
  "All Infoblox pages read at infoblox-docs.atlassian.net (the Confluence behind docs.infoblox.com), opened Oct. 22, 2026.",
]);
srcSlide("Sources: Universal DDI and the government edition", [
  "S35 Onboarding NIOS Services (BloxOneDDI)  ·  S36 Enabling the NIOS Grid Connector Service  ·  S37 Managing NIOS from Infoblox Portal  ·  S40 Universal DDI and NIOS Grid Hybrid Deployment  ·  S56 Limitations of Universal DDI (Mar. 18, 2026).",
  "S41 Limitations of AWS Route 53 Integration  ·  S42 Microsoft Azure Integration  ·  S43 Importing Azure Private Zones as Forward Zones  ·  S45 Google Cloud Platform Integration  ·  S46 Configuring and Creating Cloud Forwarders  ·  S47 Prerequisites for Cloud Forwarders  ·  S48 Discovering Cloud Forwarder Endpoints.",
  "S38 AWS, Integrate VPC IPAM with Infoblox infrastructure; Infoblox, Amazon VPC IPAM and Universal DDI Integration  ·  S39 AWS What's New, VPC IPAM automates IP assignments from Infoblox IPAM (Nov. 17, 2025; excludes China and GovCloud).",
  "S44, S50 What's New in Infoblox Universal DDI for FedRAMP (latest entry Mar. 14, 2026)  ·  S49 Infoblox blog, \"Universal DDI Comes to Infoblox Government Cloud\" (July 22, 2026) — vendor.",
  "S51–S55 Universal Asset Insights: Creating AWS and Azure Credentials; AWS, Azure and GCP General discovery pages (GovCloud (FedRAMP) limits).",
  "FedRAMP Marketplace dataset, fedramp.gov/marketplace/products.json: FR2017257053 Infoblox Government Cloud (FedRAMP Certified, Moderate, Agency path, SaaS, AWS GovCloud (US)).",
]);
srcSlide("Sources: AWS, Microsoft, Google and Book 08", [
  "AWS: S10a What is IPAM?  ·  S22 Working with private hosted zones  ·  S23 DHCP option sets  ·  S30 What is Route 53 VPC Resolver?  ·  S31 Forwarding outbound queries  ·  S33 Resolving queries between VPCs and your network  ·  S57 Forwarding inbound queries  ·  S58 Modify IPAM tier.",
  "AWS: S59 VPC IPAM in GovCloud (US) (Dec. 8, 2022)  ·  S60 VPC IPAM in Asia Pacific (Taipei) (June 13, 2025)  ·  S61 GovCloud (US) User Guide, Amazon Route 53  ·  S62 General Reference, Route 53 endpoints  ·  S63 Configuring DNSSEC signing in Route 53  ·  GovCloud VPC differences.",
  "Microsoft Learn: S28 What is Azure DNS Private Resolver?  ·  S29 Name resolution for resources in Azure virtual networks  ·  S64 What is Azure Private DNS?  ·  S65 IPAM in Azure Virtual Network Manager  ·  S66 Azure DNSSEC overview  ·  Azure Government vs global Azure.",
  "Google Cloud: S32, S67 Cloud DNS best practices  ·  S68 DNS server policies overview  ·  S69 Assured Workloads supported products  ·  Forwarding zones.",
  "Book 08, Federal Modernization Workbook: Ch 02 (Split-Brain DNS), Ch 07 (Cloud Private Endpoints, SDN and IPAM), Ch 08 (Reference Architecture; What a DDI policy plane is made of), Ch 12 (Platform Selection, Cost and Residual Risk).",
  "Research: Infoblox DDI for Federal Agencies (technical deep dive, under review); research briefs on platform, federal requirements, comparison and divisions, verified Oct. 22, 2026.",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated notes: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:", per.map((p) => `${p.slide}:${p.n} (${(p.n / WPM).toFixed(1)}m)`).join(" "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(path.join(__dirname, OUT)).catch((e) => { console.error(e); process.exit(1); });
