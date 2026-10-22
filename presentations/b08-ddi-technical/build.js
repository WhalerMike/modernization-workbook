// Book 08 — DNS, DHCP & IPAM: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The hard surfaces:  Module 1 (Ch02 split-brain + Ch04 AD DNS departure), Module 2 (Ch05 edge interception + Ch06 DNS identity and DNSSEC).
//   Part 2 — Building and running the control plane:  Module 3 (Ch07 + Ch08, Appendix C), Module 4 (Ch10 + Ch11, Appendices A–B).
// Build:  node presentations/b08-ddi-technical/build.js presentations/b08-ddi-technical/B08_DDI_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b08-ddi/; the notes name the chapter.
// Vendors and products are examples the book uses to illustrate a requirement, never endorsements.
// Narration: presentations/_build/narrate.py and captions.py, then build_narrated.ps1 (the editor runs those).
const D = require("../_build/lib.js")({ book: "Book 08", title: "DNS, DHCP & IPAM — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B08_DDI_Technical.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (narration runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0;
const per = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; per.push(n);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// Text box with a fit estimate (runs may carry their own font size and breakLine).
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

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.34, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const hH = rh(headers, true);
  const rowH = [hH, ...rows.map((r) => rh(r))];
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

// A tinted panel with a small caps label, a heading and bullets.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.75 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12.5, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 2, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 2, fontSize: pt });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = D.titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — The hard surfaces";
const P2 = "Part 2 — Building and running the control plane";

// ================================================================== 1 Title
{
  const s = D.titleSlide("Orientation", "DNS, DHCP & IPAM: the technical deep dive", "Book 08 — governing the name and address layer as one control plane");
  txt(s, "Session map", [
    { text: "Part 1 — The hard surfaces", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Split-brain and the AD DNS departure   ·   Module 2  Edge, identity and DNSSEC", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Building and running the control plane", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Private endpoints, IPAM, architecture   ·   Module 4  Migration and operations", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.4, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 08 of the Federal Modernization Workbook: DNS, DHCP and IPAM. It's for the network and DDI engineers who will design the resolution paths, move authority off Active Directory, and run the result.

It comes in two parts of about twenty-five minutes each, and four modules you can watch on their own. Part 1 covers the hard surfaces: split-brain DNS and what Active Directory DNS really carries, then the places queries escape agency policy, at the edge, at the endpoint and on the access layer, and the DNS identity and DNSSEC work underneath certificates and tokens. Part 2 covers building and running the control plane: cloud private endpoints, the Azure DNS Private Resolver, IPAM as the authority for address blocks, the reference architecture and its five decisions, then the six-phase migration and the telemetry, drift checks and evidence that keep it honest.

Vendors and products appear only as the book's examples, never as endorsements. The commands stay in the chapters, marked illustrative.`,
  "Book 08, index; Chapters 02, 04–08, 10–11; Appendices A–C.");
}

// ================================================================== 2 Why DNS is the control plane
{
  const s = D.content("Orientation", "Why this matters: DNS now decides far more than an address");
  tag(s, "Why");
  subhead(s, "Jobs head", "THE SIX JOBS DNS NOW DOES (CHAPTER 01)", 0.6, 1.5, 5.4);
  const jobs = [
    ["FaCloud", "Private address publication", "One service name: private inside the linked network, public everywhere else"],
    ["FaGlobe", "SaaS endpoint selection", "Microsoft 365 publishes separate lists: Worldwide (incl. GCC), GCC High, DoD"],
    ["FaShieldHalved", "Security policy enforcement", "Response policy zones and DNS firewalls block before a connection is made"],
    ["FaFileShield", "Certificate validation", "OCSP responders and CRL distribution points are DNS names"],
    ["FaFingerprint", "Service identity and app surface", "The FQDN is the stable identity; a wildcard declares a namespace of apps"],
  ];
  jobs.forEach((j, i) => {
    const y = 1.85 + i * 0.74;
    icon(s, j[0], 0.6, y + 0.04, 0.55, i % 2 ? HEX.teal : HEX.navy);
    T(s, `Job ${i + 1}`, [
      { text: j[1], options: { bold: true, color: i % 2 ? HEX.teal : HEX.navy, fontSize: 14, breakLine: true } },
      { text: j[2], options: { fontSize: 12 } },
    ], { x: 1.28, y, w: 4.75, h: 0.72, fontSize: 12 });
  });
  subhead(s, "Silo head", "FIVE PLATFORMS, NO SHARED STATE", 6.3, 1.5, 6.4);
  table(s, "Platforms", 1.85, [1.55, 2.6, 2.3], ["Platform", "How it resolves", "Native DNS policy"], [
    ["On-premises", "AD-integrated DNS on DCs, or a DDI grid", "RPZ or DNS firewall on the grid"],
    ["Route 53", "VPC Resolver at the VPC+2 address", "Resolver DNS Firewall, per VPC"],
    ["Azure", "Private zones only for linked VNets", "DNS resolver policy, per VNet"],
    ["Google Cloud", "Metadata server 169.254.169.254", "Cloud DNS response policies"],
    ["VMware NSX", "Forwarder on a gateway; opt-in listener IP", "None in the forwarder itself"],
  ], { x: 6.3, fontSize: 12 });
  callout(s, "Burden", 5.6, 0.9, "FaTriangleExclamation", HEX.red, "One private endpoint, four more changes: ",
    "the private zone and links, the Resolver ruleset, a Route 53 rule and on-premises forwarders, on four consoles.");
  sources(s, "Sources: OMB M-08-23; NIST SP 800-81r3 (Mar. 2026); Microsoft Learn — Azure Storage private endpoints, M365 endpoints, DNS resolver policy; AWS Route 53 VPC Resolver; Google Cloud DNS; VMware NSX. Book 08, Ch 01.");
  notes(s,
`Why this matters. Almost every network connection begins with a DNS query, and in a hybrid multi-cloud agency the answer now decides far more than an address. NIST's 2026 DNS deployment guide, SP 800-81 Revision 3, says DNS infrastructure has become more than a service; it is also a security control.

Chapter 01 names six jobs DNS now does. It publishes private addresses: an Azure Storage account with a private endpoint resolves privately inside the hosting virtual network and publicly everywhere else. It selects SaaS front doors: Microsoft 365 publishes a Worldwide list, which includes GCC, and separate lists and namespaces for GCC High and DoD. It enforces security policy through response policy zones and DNS firewalls. It anchors certificate validation, because OCSP and CRL endpoints are names. And the FQDN is the service identity that gateways, certificates and Zero Trust policies are written against.

Yet most agencies run it on as many as five platforms that share no state. AD DNS or a DDI grid on premises. Route 53's VPC Resolver, formerly Route 53 Resolver. Azure, where private zones resolve only for linked networks, and where DNS resolver policy now gives an RPZ equivalent. Google Cloud's metadata server. And the NSX forwarder, which workloads reach only if configured to.

The cost shows up on every change. A new Azure private endpoint can need four more DNS changes, on four consoles, in four syntaxes. Chapter 09 assigns ownership, because the forwarding rules that connect the platforms usually belong to no single team.`,
  "Book 08, Chapter 01 — DNS Is Now the Control Plane.");
}

// ================================================================== 3 Mandates and the sequence
{
  const s = D.content("Orientation", "What the mandates require, and the sequence that meets them");
  tag(s, "What");
  table(s, "Mandates", 1.5, [2.15, 5.15], ["Source", "What it asks of the name layer"], [
    ["OMB M-22-09", "Encrypted DNS wherever technically supported; endpoints set explicitly to agency-designated resolvers"],
    ["CISA Protective DNS", "Required for all egress DNS resolution by federal civilian agencies (6 U.S.C. § 663 note)"],
    ["OMB M-26-14", "Rescinds M-21-31; names no DNS source, but logs searchable 6 months, retrievable 1 year"],
    ["OMB M-08-23; SC-20, SC-21", "DNSSEC on applicable systems by Dec. 2009; signing services and validating resolvers"],
    ["OMB M-21-07", "IPv6-only: 20%, 50%, 80% of assets by end of FY2023, FY2024, FY2025 — all now past"],
    ["TIC 3.0 (v3.3)", "Five DNS PEP capabilities: sinkholing, validation, signing, monitoring, Protective DNS"],
  ], { fontSize: 12 });
  panel(s, "FedRAMP", 8.1, 1.5, 4.65, 3.55, HEX.teal, HEX.tealTint, "FEDRAMP AND AUTHORIZATION", "It certifies a service, not a design", [
    "The agency still authorizes its own DDI system",
    "Example listing: Infoblox Government Cloud, Class C (Moderate), SaaS in AWS GovCloud",
    "Moderate doesn't cover High or DoD",
    "On-prem appliances sit inside the agency boundary",
  ], 12.5);
  flow(s, "Sequence", 5.25, 1.22, [
    { head: "1 Inventory", body: "Export zones, SRV, forwarders, scopes" },
    { head: "2 Coexist", body: "Both systems answer" },
    { head: "3 Migrate authority", body: "Zone by zone; clients in waves" },
    { head: "4 Federate clouds", body: "Forwarding held in one place" },
    { head: "5 Decommission", body: "AD DNS and DHCP, by gate", color: HEX.red, tint: HEX.redTint },
    { head: "6 Harden", body: "Evidence for the AO", color: HEX.amber, tint: HEX.amberTint },
  ], 11);
  sources(s, "Sources: OMB M-22-09; CISA Encrypted DNS Guidance (May 2024), Protective DNS; OMB M-26-14; OMB M-08-23; NIST SP 800-53 Rev. 5; OMB M-21-07; TIC 3.0 v3.3; FedRAMP Marketplace. Book 08, Ch 03, index.");
  notes(s,
`Chapter 03 quotes the mandates rather than paraphrasing them into something stronger, and so will I.

OMB M-22-09 says agencies must resolve DNS queries using encrypted DNS wherever it is technically supported, and should explicitly configure endpoints to use agency-designated encrypted DNS servers rather than relying on automatic network discovery. CISA's Protective DNS is required for federal civilian agencies, and CISA's guidance says it is used for all egress DNS resolution. OMB M-26-14 rescinded M-21-31 and its event-logging tiers; it doesn't name DNS at all, but its baseline needs source and destination network address information, and logs actively searchable for six months and retrievable for a year. M-08-23 required DNSSEC by December 2009, and SC-20 and SC-21 carry signing and validation into every baseline. M-21-07's IPv6-only targets have all passed. And TIC 3.0, version 3.3, lists five DNS enforcement capabilities. NIST SP 800-81 Revision 3, from March 2026, is the practical guide to meeting them; it's guidance, not a mandate. Read together: agency-controlled resolvers that log, encrypt, validate, forward egress through Protective DNS, and can't be routed around.

FedRAMP certifies a cloud service, not an architecture, and the agency still authorizes its own system. As an example, the Marketplace lists Infoblox Government Cloud at Class C, its label for Moderate, delivered as SaaS in AWS GovCloud. A Moderate certification doesn't cover High or DoD, and on-premises appliances sit inside the agency's own boundary.

Every chapter follows one sequence: inventory, coexist, migrate authority, federate clouds, decommission AD DNS and DHCP, then harden and evidence. Five configuration decisions carry most of the risk along the way; we'll meet each one in its module.`,
  "Book 08, Chapter 03 — Federal Requirements: NIST SP 800-81, FedRAMP and Zero Trust; index, \"The canonical sequence.\"");
}

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: Split-brain DNS and the AD DNS departure", "Part 1 — The hard surfaces  ·  Chapters 02 and 04",
    ["Three forms of split-brain, and why process can't fix them", "What AD-integrated DNS carries: zones, locators, secure updates", "What Entra ID doesn't carry, and what to reprovision first"], 10);
  notes(s,
`Module 1: split-brain DNS and the Active Directory DNS departure.

Chapter 02 defines the structural problem: the same name returning different answers depending on where the query starts, silently, because the name still resolves. Chapter 04 takes the surface most agencies underestimate. Active Directory never presented itself as the agency's DNS service, but for twenty years it was one, and the records it kept for itself don't follow the identities to the cloud. Leaving AD DNS is an inventory problem before it is a migration problem, and the inventory has to be finished before the first domain controller is retired.`,
  "Book 08, Chapter 02 — Split-Brain DNS; Chapter 04 — The Active Directory DNS Departure.");
}

// ================================================================== 5 Split-brain
{
  const s = D.content(P1, "Split-brain: same name, different answers, and no error");
  tag(s, "Why");
  panel(s, "Private", 0.6, 1.5, 3.95, 3.7, HEX.navy, HEX.navyTint, "PRIVATE-IP SPLIT-BRAIN", "The cross-cloud case", [
    "Private endpoint: public name CNAMEs into privatelink; A record = e.g. 10.1.0.4",
    "EC2 gets it only if a Route 53 outbound rule forwards blob.core.windows.net into Azure",
    "Missing rule: name resolves, to the public address",
    "Microsoft: ~70% of private-endpoint 403s are DNS resolving public",
  ], 12.5);
  panel(s, "SaaS", 4.7, 1.5, 3.95, 3.7, HEX.teal, HEX.tealTint, "PUBLIC SAAS SPLIT-BRAIN", "Microsoft 365", [
    "GCC uses the Worldwide endpoint list: the risk is path consistency, not a wrong cloud",
    "GCC High and DoD use their own namespaces, such as *.office365.us",
    "Drift shows up as sign-in failures or Conditional Access denials",
  ], 12.5);
  panel(s, "Policy", 8.8, 1.5, 3.95, 3.7, HEX.red, HEX.redTint, "SECURITY POLICY SPLIT-BRAIN", "The weakest resolver wins", [
    "RPZ and block lists apply only at the resolver that answers",
    "Cloud equivalents are set per VPC or VNet, so each new network must be attached",
    "Effective posture = the intersection of every reachable resolver",
  ], 12.5);
  callout(s, "Process", 5.35, 1.15, "FaArrowsRotate", HEX.amber, "Runbooks can't fix it: ",
    "the failure is silent, the change surface is too large, and each system has its own API, rate limits and propagation. Only a plane holding the authoritative objects can.");
  sources(s, "Sources: Microsoft Learn — Azure Storage private endpoints; private endpoint DNS values; 403 through a private endpoint; M365 and GCC High endpoints. AWS Route 53 VPC Resolver, DNS Firewall. NIST SP 800-81r3. Book 08, Ch 02.");
  notes(s,
`Split-brain is the same name returning different answers depending on where the query originates. Intentional split-horizon, designed and governed, is legitimate. The unintentional kind is the problem, and with several DNS systems holding copies of the same names and no shared state, it's close to guaranteed. Chapter 02 shows three forms.

Private-IP split-brain. An Azure Storage private endpoint gives the public name a CNAME into the privatelink subdomain, and the private zone maps it to, say, 10.1.0.4. An EC2 instance sees that only if a Route 53 outbound rule forwards blob.core.windows.net to an Azure Private Resolver inbound endpoint, or to an agency resolver that does. If the rule is missing or stale, the name still resolves, to the public address. Microsoft's guide to 403 errors through a private endpoint attributes roughly seventy percent of cases to exactly that.

Public SaaS split-brain. GCC uses the Worldwide endpoint list, so for a GCC-Moderate agency the risk isn't a wrong-cloud answer; it's path consistency: every reachable resolver must return what Microsoft publishes, through the designed egress. GCC High and DoD have their own namespaces. Drift looks like sign-in failures or Conditional Access denials.

Security policy split-brain. Block lists apply only at the resolver that answers, and the cloud equivalents are configured per network, so the effective posture is the weakest resolver a client can reach. That matters beyond compliance: NIST notes DNS servers can often prevent security incidents earlier than other systems.

Runbooks fail because the failure is silent, the change rate outruns them, and the systems behave differently. The fix is structural: a control plane.`,
  "Book 08, Chapter 02 — Split-Brain DNS: The Structural Problem.");
}

// ================================================================== 6 AD-integrated DNS
{
  const s = D.content(P1, "AD-integrated DNS: seven components, seven decisions");
  tag(s, "What");
  const b = table(s, "Components", 1.5, [2.5, 4.4, 5.25], ["Component", "What it does in an AD estate", "Why it matters for the departure"], [
    ["AD-integrated primary zones", "The domain zone, its _msdcs subzone, internal app zones; replicated by AD", "Multi-master and secure updates disappear with the directory"],
    ["File-backed primary, secondary", "Copied to read-only secondaries by AXFR or IXFR", "Simplest to move; watch clients that use a secondary directly"],
    ["Stub zones", "Only the SOA, NS and glue to find another zone's servers", "Usually become forwarding rules in the target"],
    ["Conditional forwarders", "Send a named namespace to designated servers; stored as zones", "Trusts, partners and cloud namespaces depend on them; often undocumented"],
    ["GlobalNames zone", "Single-label names without WINS", "Then depends on client DNS suffix search lists"],
    ["Reverse lookup zones", "PTR records under in-addr.arpa", "Must align with the IPAM address plan, or fill with orphans"],
    ["DNSSEC-signed zones", "Signed by a Key Master; keys can replicate in AD", "Signing moves by its own sequence (Chapter 06)"],
  ], { fontSize: 12 });
  box(s, "Scope", 0.6, b + 0.12, 12.15, 6.5 - b - 0.12, HEX.tealTint);
  T(s, "Scope text", [
    { text: "Replication scope decides which DCs hold a zone: ", options: { bold: true, color: HEX.teal } },
    { text: "Domain, Forest, Legacy or Custom in the DnsServer cmdlets. " },
    { text: "Forwarders are easy to find: ", options: { bold: true, color: HEX.teal } },
    { text: "Get-DnsServerZone lists them. Deciding which still matter is the work." },
  ], { x: 0.85, y: b + 0.17, w: 11.7, h: 6.5 - b - 0.22, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — DNS and AD DS; DNS zones; Add-DnsServerPrimaryZone (-ReplicationScope); Add-DnsServerConditionalForwarderZone; Set-DnsServerGlobalNameZone; DNSSEC Key Master. Book 08, Ch 04.");
  notes(s,
`When a domain is deployed, its DNS name becomes a zone, the domain controllers running the DNS Server role become its authoritative servers, and every domain-joined machine is pointed at them for all of its resolution. Nobody chose that as a DNS architecture, but it is one.

A zone stored in Active Directory exists only on domain controllers that run DNS, and storing it there brings two things a file-backed zone lacks: secure dynamic updates, and multi-master operation, where every hosting domain controller is a primary. Replication rides on AD replication, and the replication scope, exposed as Domain, Forest, Legacy or Custom, decides which domain controllers hold the zone.

The rest decomposes into components, each needing a decision. The AD-integrated zones, including underscore msdcs, lose multi-master and secure updates with the directory, so each is re-created on a platform that gives its clients what they still need. File-backed zones are the simplest to move; watch clients pointed at a secondary. Stub zones usually become forwarding rules. Conditional forwarders carry trusts, partners and cloud namespaces. GlobalNames then depends on suffix search lists. Reverse zones must align with IPAM or fill with orphans. And signed zones move on their own sequence.

One correction: the source whitepaper called conditional forwarders not easily exported. Windows stores each one as a zone, so Get-DNS-Server-Zone lists it. Forwarders accumulate for partners, trusts and retired systems, often with no record of why. Finding them is easy; deciding which still matter is the work.`,
  "Book 08, Chapter 04 — The Active Directory DNS Departure, \"What AD-integrated DNS actually is.\"");
}

// ================================================================== 7 Locator records
{
  const s = D.content(P1, "Locator records: what Netlogon registers, what fails");
  tag(s, "What");
  table(s, "Locators", 1.5, [3.65, 1.75, 3.2], ["Record", "Service", "What fails without it"], [
    ["_ldap._tcp.dc._msdcs.<domain>", "LDAP on DCs", "Domain join, authentication, Group Policy"],
    ["_kerberos._tcp.dc._msdcs.<domain>", "Kerberos KDC", "Tickets; NTLM fallback where allowed, else failure"],
    ["_ldap._tcp.gc._msdcs.<forest>", "Global catalog", "Universal groups, forest-wide searches"],
    ["_ldap._tcp.<site>._sites.dc._msdcs…", "Site DC", "Clients reach a distant DC: latency, WAN load"],
    ["_ldap._tcp.pdc._msdcs.<domain>", "PDC emulator", "Anything that must find the PDC"],
    ["_kpasswd._tcp.<domain>", "Password change", "Kerberos password changes"],
  ], { fontSize: 12 });
  panel(s, "Inventory", 9.4, 1.5, 3.35, 3.85, HEX.teal, HEX.tealTint, "COMPLETE THE INVENTORY", null, [
    "Netlogon.dns: what each DC intends to register",
    "The _msdcs and _sites folders of the domain zone",
    "Resolve every critical record from every DNS server and site",
    "Chapter 10: 30 days clean resolution is a gate",
  ], 12.5);
  callout(s, "Secure", 5.5, 1.0, "FaLock", HEX.red, "They're dynamic, so they live only where DCs can register securely: ",
    "AD DNS, or a DDI platform that accepts GSS-TSIG, until the last DC goes. Azure Private DNS can't host them.");
  sources(s, "Sources: Microsoft Learn — Locating domain controllers in Windows; Policy CSP ADMX_Netlogon; KB 816587 (SRV records, Netlogon.dns); Kerberos SSP/AP. Book 08, Ch 04.");
  notes(s,
`Domain controllers advertise themselves through DNS. Netlogon on each domain controller registers a family of SRV and A records. A client finds a domain controller by calling D S Get D C Name, which queries DNS for SRV records, sends an LDAP UDP ping to the candidates and caches the first one that answers. These records are dynamic: Netlogon re-registers them, and they change as domain controllers come and go and as sites change.

Here's what fails without each. The LDAP record: domain join, authentication and Group Policy. The Kerberos records: ticket acquisition, falling back to NTLM where it's still allowed, otherwise failing. The global catalog records: universal groups and forest-wide searches. The site records: clients reach a distant domain controller rather than failing outright. The PDC record, and kpasswd for password changes.

Two sources make the inventory complete: the Netlogon dot DNS file each domain controller writes, listing what it intends to register, which Microsoft points to for agencies running AD on non-Microsoft DNS, and the underscore msdcs and underscore sites folders of the domain zone. The program's assessment resolves each critical record from every DNS server and every site, and Chapter 10 makes thirty days of clean resolution a gate for decommissioning.

Because they're registered dynamically, these records can only live on a DNS service that accepts secure registration from domain controllers. That's why they stay on AD DNS, or a DDI platform that accepts GSS-TSIG updates, until the last domain controller goes, and why Azure Private DNS can't host them.`,
  "Book 08, Chapter 04 — The Active Directory DNS Departure, \"The locator records.\"");
}

// ================================================================== 8 Secure dynamic updates and DHCP
{
  const s = D.content(P1, "Secure dynamic updates, and the DHCP server's part in them");
  tag(s, "How");
  panel(s, "Update", 0.6, 1.5, 3.9, 4.95, HEX.navy, HEX.navyTint, "HOW CLIENTS KEEP RECORDS CURRENT", "Dynamic update (RFC 2136)", [
    "Secure update only for AD-integrated zones; the default once integrated",
    "Any authenticated user can create a new A or PTR record",
    "After that, only principals on the name's ACL can change it",
    "On the wire, Windows signs updates with GSS-TSIG (RFC 3645)",
  ], 12.5);
  table(s, "DHCP", 1.5, [2.15, 5.85], ["DHCP setting", "Why it decides whether records can be trusted"], [
    ["Name ownership", "The registering DHCP server owns the name; failover partners must share DNS credentials"],
    ["DnsUpdateProxy", "Leaves its members' records unsecured; Microsoft warns against it in secure-only zones"],
    ["Dedicated credential", "A standard user every server uses; \"strongly recommended\" when DHCP runs on a DC; not restored with the database"],
    ["Name protection", "DHCID records (RFC 4701): an update fails rather than overwrites another client's name"],
    ["Aging and scavenging", "Out of step with lease durations: duplicate records, Kerberos tickets delivered to the wrong host"],
  ], { x: 4.75, fontSize: 12 });
  T(s, "Checks", [
    { text: "Read-only checks (illustrative, not tested against a production forest): ", options: { bold: true, color: HEX.amber } },
    { text: "Get-DhcpServerv4DnsSetting per server and scope · Get-DhcpServerDnsCredential · DnsUpdateProxy membership · each DC's netlogon.dns." },
  ], { x: 4.75, y: 5.5, w: 8.0, h: 0.95, fontSize: 12.5 });
  sources(s, "Sources: RFC 2136; RFC 3645; RFC 4701; Microsoft Learn — Dynamic update; DHCP failover overview; Event ID 1056; Set-DhcpServerv4DnsSetting; scavenging and DHCP lease duration. Book 08, Ch 04.");
  notes(s,
`Clients keep their own records current through dynamic update, RFC 2136. Secure dynamic update authenticates the client and records each name's owner in an access control list. It exists only for AD-integrated zones, which default to secure-only. Any authenticated user can create a new A or PTR record; once a name exists, only principals on its ACL can change it. Windows signs these updates with GSS-TSIG.

The DHCP server is part of this, and five settings decide whether the records stay trustworthy. Name ownership: a DHCP server that performs a secure update becomes the name's owner, so if its failover partner takes over, the partner can't update it; both partners must use the same DNS credentials. DnsUpdateProxy solves ownership by leaving its members' records unsecured; Microsoft warns against it in secure-only zones. A dedicated credential is the recommended pattern: one standard user account every DHCP server uses. It matters most when DHCP runs on a domain controller, which would otherwise lend its authority over every record, and it isn't backed up with the DHCP database. Name protection creates DHCID records, so an update fails rather than overwrites when another client holds the name. And scavenging: without it DNS becomes a map of where devices used to be, and Microsoft documents that when scavenging and lease durations disagree, you get duplicate records and Kerberos tickets for one computer delivered to another.

These settings are rarely documented outside the servers, so they belong in the inventory. Chapter 04 gives read-only cmdlets for each.`,
  "Book 08, Chapter 04 — The Active Directory DNS Departure, \"Secure dynamic updates and the DHCP server.\"");
}

// ================================================================== 9 What Entra ID doesn't carry
{
  const s = D.content(P1, "What Entra ID doesn't carry, and what to reprovision");
  tag(s, "How");
  panel(s, "Entra", 0.6, 1.5, 5.9, 2.75, HEX.navy, HEX.navyTint, "WHAT THE TRANSITION CHANGES", null, [
    "Entra ID publishes no zones and no locators; hybrid-joined devices still look for a DC",
    "Kerberos survives in pockets (App Proxy KCD, cloud Kerberos trust), each with a DNS dependency",
    "Entra Domain Services brings its own DNS; forwarder other than 168.63.129.16 unsupported",
  ], 12.5);
  panel(s, "Kerberos", 0.6, 4.35, 5.9, 2.1, HEX.red, HEX.redTint, "WHAT KERBEROS NEEDS FROM DNS", null, [
    "Wrong host: a valid ticket for A is presented to B, which rejects it",
    "Missing SPN: the connection silently drops to NTLM",
  ], 12.5);
  panel(s, "Reprovision", 6.7, 1.5, 6.05, 3.7, HEX.teal, HEX.tealTint, "REPROVISION BEFORE ANY DC GOES", null, [
    "Locator records: stay resolvable until every consumer is token-based",
    "Conditional forwarders: test over DNS, not ICMP; retire dead ones",
    "The internal namespace: created explicitly; nothing creates it by default",
    "Dynamic registration: per client population, ownership decided",
    "GlobalNames, reverse and signed zones: each by its own method",
  ], 12.5);
  T(s, "Coexist", [
    { text: "Coexistence, for example: ", options: { bold: true, color: HEX.amber } },
    { text: "Infoblox NIOS manages Microsoft DNS and DHCP over MS-RPC, read-only or read/write, and accepts GSS-TSIG. Confirm for your platform and release." },
  ], { x: 6.7, y: 5.3, w: 6.05, h: 1.15, fontSize: 12.5 });
  sources(s, "Sources: Microsoft Learn — Entra cloud-first identity guidance; What's new in Windows Server 2025; Entra Domain Services DNS; duplicate DNS records (scavenging). Infoblox NIOS deployment guides (vendor example). Book 08, Ch 04.");
  notes(s,
`Microsoft's guidance is a phased source-of-authority conversion toward cloud-first and A D-minimized states, not an all-at-once decommission, and AD DS itself isn't deprecated: Windows Server 2025 ships new functional levels. What changes is where the DNS records come from.

Entra ID publishes no zones and no locator records. Entra-joined devices use tokens and don't look for a domain controller; hybrid-joined devices still do. Kerberos survives in pockets, such as Application Proxy with constrained delegation and cloud Kerberos trust, each with a DNS dependency. And Entra Domain Services brings its own DNS, needs conditional forwarders for on-premises zones, and Microsoft says any server-level forwarder other than 168.63.129.16 is unsupported: a DNS authority whose upstream you can't change, which matters for Protective DNS.

Kerberos needs more from DNS than tickets reveal. The source whitepaper described the service resolving the SPN back to an IP; Kerberos does no such check, and the book corrected it. The real failure is simpler and worse: resolve the name to the wrong host and a valid ticket for computer A is presented to computer B, which rejects it. A missing SPN silently drops to NTLM. Either way it looks like identity, and the cause is DNS. Decoupling DNS from identity also removes a shared failure: an identity outage no longer takes name resolution with it.

Before any domain controller goes: keep locator records resolvable until every consumer is token-based; test conditional forwarders over DNS, not ICMP, and retire the dead ones; create the internal namespace explicitly; re-establish dynamic registration per client population; and move GlobalNames, reverse and signed zones by their own methods. DDI platforms commonly offer a coexistence mode; Infoblox NIOS is the book's example. Confirm the capability for whatever you deploy.`,
  "Book 08, Chapter 04 — The Active Directory DNS Departure, \"What Kerberos needs,\" \"What Entra ID does not carry,\" \"What must be reprovisioned.\"");
}

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: Edge interception, DNS identity and DNSSEC", "Part 1 — The hard surfaces  ·  Chapters 05 and 06",
    ["Where queries escape agency policy: SD-WAN, encrypted DNS, rogue DHCP", "Why certificate and token failures are often DNS failures", "DNSSEC: what to sign, where to validate, how to move signed zones"], 12);
  notes(s,
`Module 2: edge interception, DNS identity and DNSSEC.

Every control in the policy plane, response policy zones, DNSSEC validation, logging and Protective DNS forwarding, assumes the query reaches it. Chapter 05 takes the three ordinary mechanisms that decide whether it does, at the network edge, the endpoint and the access layer, and none of them reports when it doesn't. Chapter 06 then shows why a certificate can be valid, unrevoked and issued for the right name and still fail: every check that makes it trustworthy starts with a DNS lookup. It closes with DNSSEC.`,
  "Book 08, Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP; Chapter 06 — DNS Identity, Certificates and DNSSEC.");
}

// ================================================================== 11 redirect-dns
{
  const s = D.content(P1, "SD-WAN redirect-dns: the destination decides policy");
  tag(s, "What");
  subhead(s, "Good head", "CORRECT PATH", 0.6, 1.45, 4);
  flow(s, "Good", 1.75, 0.82, [
    { head: "Branch client" }, { head: "SD-WAN edge" }, { head: "Agency resolver" },
    { head: "DDI policy plane", body: "RPZ, DNSSEC, logs" }, { head: "Protective DNS", body: "internet recursion" },
  ], 11);
  subhead(s, "Bad head", "BYPASSED PATH — NO LOG, NO RPZ, NO AGENCY TRUST ANCHORS", 0.6, 2.62, 8);
  flow(s, "Bad", 2.92, 0.62, [
    { head: "Branch client", color: HEX.red, tint: HEX.redTint }, { head: "SD-WAN edge", color: HEX.red, tint: HEX.redTint },
    { head: "External resolver", color: HEX.red, tint: HEX.redTint }, { head: "Public recursion", color: HEX.red, tint: HEX.redTint },
  ], 11.5);
  panel(s, "Limits", 0.6, 3.7, 5.95, 2.75, HEX.navy, HEX.navyTint, "CISCO CATALYST SD-WAN (THE BOOK'S EXAMPLE)", null, [
    "Service-side VPNs from IOS XE 17.8.1a / vManage 20.8.1",
    "IPv4 and UDP only: TCP DNS isn't redirected",
    "Not overlay-tunnel DNS, fragments or the router's own queries",
    "Umbrella's local bypass list is a second copy of the namespace",
  ], 12.5);
  panel(s, "Target", 6.75, 3.7, 6.0, 2.75, HEX.red, HEX.redTint, "THE PROGRAM'S POSITION", null, [
    "Target = a network-addressable agency resolver, never a loopback agent",
    "A SASE resolver (even one integrating with Protective DNS) sits behind it",
    "M365 INR: Worldwide commercial only, not GCC Moderate, GCC High or DoD",
  ], 12.5);
  sources(s, "Sources: Cisco — Redirect DNS in Catalyst SD-WAN service-side VPNs; Umbrella integration (2021). Infoblox Endpoint docs (vendor). FedRAMP Marketplace FR2304757473A. Microsoft Learn — M365 informed network routing. Book 08, Ch 05.");
  notes(s,
`SD-WAN edges can intercept DNS regardless of the resolver a client was configured with. In Cisco Catalyst SD-WAN, the book's worked example, this is the redirect-dns action of a centralized data policy: the edge matches DNS traffic and sends it to a policy-designated resolver, either unconditionally, or only for named applications.

The destination decides whether agency policy applies at all. On the correct path the query goes through the edge to a network-addressable agency resolver, into the policy plane for response policy zones, validation and logging, and internet recursion leaves through Protective DNS. On the bypassed path the edge hands it to an external resolver: no log entry, no RPZ, no validation under agency trust anchors, and nothing alerts.

The feature has documented limits. Service-side redirect arrived in IOS XE 17.8.1a. It's IPv4 and UDP only, so TCP DNS isn't redirected, and it skips overlay-tunnel DNS, fragments and the router's own queries. Cisco's Umbrella integration is a separate mechanism whose local bypass list is effectively a second copy of the internal namespace on every edge.

Two refinements. The target must be a server the edge can address; a loopback agent such as Infoblox Endpoint protects the roaming device but isn't a redirect target. And a SASE resolver, even Cisco's Umbrella for Government in an offering listed FedRAMP Certified at High, which describes Protective DNS integration, still bypasses the agency's own plane. So the redirect target is always the agency resolver, with any SASE resolver behind it.

Microsoft 365 informed network routing supports Worldwide commercial tenants only, not GCC Moderate, GCC High or DoD. It's a traffic optimization, not a DNS dependency.`,
  "Book 08, Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP, \"SD-WAN DNS interception.\"");
}

// ================================================================== 12 Encrypted DNS
{
  const s = D.content(P1, "Encrypted DNS: terminate at agency resolvers");
  tag(s, "How");
  table(s, "Transports", 1.5, [2.15, 1.35, 3.55], ["Transport", "Port", "What the network can do"], [
    ["Plain DNS", "UDP/TCP 53", "Intercept, redirect, block by port"],
    ["DNS over TLS", "TCP 853", "Can't redirect (the client checks the certificate); block except to approved resolvers"],
    ["DNS over QUIC", "UDP 853", "Same as DoT: block by port"],
    ["DNS over HTTPS", "TCP 443", "Can't see or isolate it: RPZ on known DoH names, firewall rules, or TLS inspection"],
  ], { fontSize: 12 });
  panel(s, "Windows", 7.85, 1.5, 4.9, 3.3, HEX.navy, HEX.navyTint, "WINDOWS", null, [
    "DoH only to known servers; add agency ones with Add-DnsClientDohServerAddress",
    "WS2025 DNS Server takes client DoH (KB5094125) but forwards upstream in plain text",
    "Zero Trust DNS (Win 11 Ent/Edu): outbound IP only to addresses its Protective DNS servers resolved",
  ], 12);
  panel(s, "Browsers", 0.6, 4.25, 7.05, 2.2, HEX.teal, HEX.tealTint, "BROWSERS (CISA'S CONFIGURATION)", null, [
    "OS resolver, or DoH only to agency resolvers, as mandatory policy",
    "Edge and Chrome: DnsOverHttpsMode; Firefox: answer NXDOMAIN for the use-application-dns.net canary",
  ], 12.5);
  panel(s, "CISA", 7.85, 4.9, 4.9, 1.55, HEX.red, HEX.redTint, null, null, [
    "IPsec isn't a substitute (CISA); disable root hints",
    "Can't encrypt upstream? An encrypting proxy",
  ], 12);
  sources(s, "Sources: OMB M-22-09; CISA Encrypted DNS Implementation Guidance (May 2024); NIST SP 800-81r3 §4.2.2; RFCs 7858, 8484, 9250; Microsoft Learn — DoH client, DoH in DNS Server, Zero Trust DNS, DnsOverHttpsMode; Mozilla. Book 08, Ch 05.");
  notes(s,
`Client-side encrypted DNS to a public resolver is the most common bypass. M-22-09 wants encrypted DNS wherever supported and endpoints set explicitly to agency resolvers; CISA's target state has Protective DNS upstream and endpoints unable to reach third-party DNS over any protocol. So encrypted DNS must terminate at an agency resolver or Protective DNS.

Each transport leaves a different handle. Plain DNS on 53 can be intercepted, redirected and blocked by port. DNS over TLS and DNS over QUIC, on port 853, can't be redirected without breaking the session, but are straightforward to block except to approved resolvers. DNS over HTTPS shares 443 with all web traffic, so redirect-dns can't see it; NIST suggests RPZ entries for known DoH names plus firewall rules, and CISA adds TLS inspection. An edge-only design can't govern encrypted DNS.

On Windows, the client uses DoH only with servers on its known list, which ships with Cloudflare, Google and Quad9; add the agency's own. Since June 2026 the Windows Server 2025 DNS Server accepts client DoH, but its upstream traffic stays unencrypted. CISA says IPsec isn't an acceptable substitute, suggests an encrypting proxy, requires root hints disabled, and allows public fallback resolvers only when Protective DNS is unavailable, with alerting. Zero Trust DNS, on Windows 11 Enterprise and Education, permits outbound traffic only to addresses its Protective DNS servers resolved.

Browsers resolve names themselves. The program adopts CISA's configuration: the OS resolver, or DoH only to agency resolvers, as mandatory policy, and an NXDOMAIN answer for Firefox's canary domain. Microsoft documents that on a managed device with the policy unset, Edge sends no DoH queries.`,
  "Book 08, Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP, \"Encrypted DNS and bypass controls.\"");
}

// ================================================================== 13 Rogue DHCP
{
  const s = D.content(P1, "Rogue DHCP and router advertisements");
  tag(s, "Why");
  table(s, "Options", 1.5, [0.8, 2.05, 3.5], ["Option", "Sets", "Why it's governed"], [
    ["6", "The client's resolvers", "Must point to governed resolvers, the same on every server"],
    ["15", "Default domain", "Must match the authoritative zone"],
    ["119", "Search suffix list", "Stale entries send queries to the wrong zone"],
    ["81", "Client FQDN", "Decides whether client or DHCP server owns the name"],
    ["82", "Relay agent info", "Identifies the switch port for IPAM and investigations"],
    ["252", "WPAD (by convention)", "A wrong value bypasses the web proxy"],
  ], { fontSize: 12.5, firstColor: HEX.teal });
  panel(s, "Threat", 7.15, 1.5, 5.6, 2.25, HEX.red, HEX.redTint, "THE THREAT", null, [
    "MITRE ATT&CK T1557.003: DHCP spoofing hands out adversary-owned DNS servers",
    "IPv6: rogue router advertisements with RDNSS (RFC 8106), often ungoverned",
  ], 12.5);
  panel(s, "Controls", 7.15, 3.85, 5.6, 2.6, HEX.teal, HEX.tealTint, "WHAT STOPS IT", null, [
    "AD authorization stops only Windows DHCP servers checking themselves",
    "DHCP snooping and RA Guard (RFC 6105) on access switches",
    "Central scope and option management; rogue detection; IPAM",
  ], 12.5);
  T(s, "Anomalies", [
    { text: "Alert on resolution-path anomalies: ", options: { bold: true, color: HEX.navy } },
    { text: "hosts that connect but never query the governed resolvers · any fallback public resolver · 853 to unapproved destinations · DoH to known public endpoints." },
  ], { x: 0.6, y: 5.0, w: 6.35, h: 1.45, fontSize: 13 });
  sources(s, "Sources: MITRE ATT&CK T1557.003; RFC 8106; RFC 9463; RFC 6105; IANA DHCP and BOOTP parameters; Microsoft Learn — Add-DhcpServerv4OptionDefinition (WPAD); DHCP authorization failures. OMB M-22-09. Book 08, Ch 05.");
  notes(s,
`The third bypass sits on the access layer. A rogue DHCP server that hands out a malicious resolver in option 6 can move a whole subnet onto an attacker's resolver in one step, past every response policy zone and every Protective DNS control. MITRE ATT&CK catalogs it as DHCP Spoofing, T1557.003; the whitepaper's claim of federal incidents couldn't be verified and was removed. In IPv6, rogue router advertisements carrying the RDNSS option do the same, and they're often the larger surface, because many networks govern router advertisements not at all. M-22-09's instruction to configure agency resolvers explicitly is the federal answer to discovery channels like RFC 9463.

Option 6 isn't the only option that moves traffic. Option 15, the default domain, must match the authoritative zone. Option 119, the search list, misdirects queries when stale. Option 81 decides who registers the client's records. Option 82 identifies the switch port for IPAM attribution. And 252 for WPAD is a convention, not an assignment; a wrong value bypasses the web proxy.

The Windows control is narrower than it looks. An unauthorized Windows DHCP server checks its own status in Active Directory and stops leasing. That stops a misconfigured Windows server, not a rogue appliance, a home router in a wall port, or malware. Those need DHCP snooping and RA Guard on the access switches, centralized scope and option management, rogue detection, and IPAM integration so an unexpected lease is visible at once.

Prevention is never complete, so watch for failure: hosts whose queries never reach the governed logs, fallback resolver use, port 853 to unapproved destinations, and DoH to known public endpoints.`,
  "Book 08, Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP, \"DHCP option 6 and rogue DHCP\"; \"Alert on resolution-path anomalies.\"");
}

// ================================================================== 14 DNS identity
{
  const s = D.content(P1, "DNS identity: certificate and token failures");
  tag(s, "What");
  table(s, "Names", 1.5, [2.15, 3.95], ["Name that must resolve", "What the book establishes"], [
    ["Token endpoint", "GCC uses login.microsoftonline.com; GCC High and DoD use login.microsoftonline.us"],
    ["Token audience", "v2.0 aud is the API's client ID, a GUID: a host rename shows as an audience error"],
    ["Certificate SANs", "DNS to a host without the asked-for name fails the handshake"],
    ["Revocation", "Entra CBA checks one HTTP CRL per CA, no OCSP: the CRL URL must resolve"],
    ["ACME dns-01", "TXT under _acme-challenge: the zone gates automated issuance"],
  ], { fontSize: 12 });
  panel(s, "Scenario", 6.85, 1.5, 5.9, 2.35, HEX.red, HEX.redTint, "CERTIFICATE SPLIT-BRAIN", null, [
    "ocsp.pki.agency.gov lives only in AD DNS; no Route 53 rule for pki.agency.gov",
    "Hard-fail clients break; soft-fail ones skip the check; the ticket goes to PKI",
  ], 12.5);
  table(s, "Scope", 3.95, [1.75, 2.45, 1.7], ["Layer", "Mechanism", "Split-brain exposure"], [
    ["DNS namespace", "Per-region names, *.eastus.agency.gov", "High"],
    ["Certificate SANs", "One SAN per region", "Medium"],
    ["Name constraints", "Per-region issuing CA", "Low (test clients)"],
  ], { x: 6.85, fontSize: 12, firstColor: HEX.teal });
  T(s, "Wildcard", [
    { text: "RFC 9525: ", options: { bold: true, color: HEX.navy } },
    { text: "a certificate wildcard is the whole leftmost label and matches one label; application.*.agency.gov is invalid. DNS wildcards can match many labels." },
  ], { x: 0.6, y: 5.45, w: 6.05, h: 1.0, fontSize: 12.5 });
  sources(s, "Sources: Microsoft Learn — national-cloud endpoints, AADSTS900439, Office 365 GCC, access token claims; RFC 8555; RFC 8659; RFC 9525; RFC 5280 §4.2.1.10; NIST SP 800-207. Book 08, Ch 06 (Book 07, Ch 02 for CBA).");
  notes(s,
`DNS identity, the authoritative mapping of names to addresses, owners and lifecycle, is the first link in the trust chain. Certificates, FQDN-based policy and tokens all name their subject by FQDN and trust DNS to take the caller there.

Moving from Kerberos to Entra ID tokens removes the KDC but adds names that must resolve consistently. The token endpoint: GCC uses the global login dot microsoftonline dot com; Azure Government, serving GCC High and DoD, uses the dot us endpoint. The whitepaper grouped GCC with dot us; the book corrected it. The token audience in v2.0 tokens is the API's client ID, a GUID, so a host rename clients don't pick up fails as an audience or redirect-URI error. SANs must contain the name the client asked for. Entra certificate-based authentication checks one HTTP CRL per CA and no OCSP, so the CRL URL must resolve. And ACME dns-01 makes the zone the gate for automated issuance, exercised constantly as public TLS lifetimes fall toward forty-seven days.

Certificate split-brain: a service's OCSP and CRL names exist only in AD DNS, and an EC2 caller has no Route 53 rule for them. A hard-fail client breaks the handshake; a soft-fail client skips the check. The agency resolver logs nothing, and the ticket goes to PKI. That's Decision 5.

Geographic scoping: RFC 9525 allows a certificate wildcard only as the whole leftmost label, matching one label, so application dot star dot agency dot gov doesn't work. Use per-region names, per-region SANs, and name constraints, the only cryptographic layer; RFC 5280 says clients should, not must, process them, so test your relying parties.`,
  "Book 08, Chapter 06 — DNS Identity, Certificates and DNSSEC, \"From Kerberos to tokens,\" \"The certificate split-brain problem,\" \"Geographic scoping.\"");
}

// ================================================================== 15 DNSSEC position and platforms
{
  const s = D.content(P1, "DNSSEC: sign external zones, validate on resolvers");
  tag(s, "How");
  panel(s, "Policy", 0.6, 1.5, 4.55, 3.6, HEX.navy, HEX.navyTint, "WHAT POLICY AND NIST SAY", "The program's position", [
    "M-08-23: DNSSEC on applicable systems, .gov domains signed",
    "SC-21: the agency's resolver must \"request and perform\" verification",
    "SP 800-81r3: root trust anchor, automated rollover",
    "Internal zones: \"limited value\" unless required; then a delegation that chains to the root",
    "Sign external zones always; validate everywhere",
  ], 12.5);
  table(s, "Platforms", 1.5, [1.35, 3.25, 2.8], ["Platform", "Signing", "Validation"], [
    ["Windows Server", "Key Master; keys can replicate in AD; wizard default 1,024-bit ZSK is below NIST's RSA floor", "RFC 5011 trust-anchor update; clients are non-validating stubs (NRPT)"],
    ["Azure", "Public zones only, ECDSAP256SHA256; no Private DNS signing", "Azure-provided resolver doesn't validate"],
    ["AWS Route 53", "Public hosted zones only; customer KSK in KMS", "VPC Resolver per VPC; ignores DO and CD, sets no AD bit"],
  ], { x: 5.35, fontSize: 12, firstColor: HEX.teal });
  callout(s, "Complement", 5.25, 1.2, "FaShieldHalved", HEX.teal, "Complements, not alternatives: ",
    "DNSSEC proves origin and integrity but doesn't encrypt; DoH, DoT and DoQ protect the transaction, not the data. Check signatures with Resolve-DnsName -DnssecOk, not nslookup.");
  sources(s, "Sources: RFCs 4033–4035, 9364; OMB M-08-23; NIST SP 800-53 SC-20/21; NIST SP 800-81r3 §3.8, §4.2.5–4.2.6; Microsoft Learn — DNSSEC Key Master, sign zones, Azure DNSSEC; AWS Route 53 DNSSEC signing and validation. Book 08, Ch 06.");
  notes(s,
`DNSSEC adds data-origin authentication, integrity protection and authenticated denial of existence. It doesn't encrypt anything; it lets a resolver verify the answer is authentic, and a validating resolver that finds a bad signature answers SERVFAIL. NIST is explicit that DNSSEC and encrypted DNS are complements: DNSSEC doesn't protect confidentiality, and DoH, DoT and DoQ protect the transaction but not the data.

The federal position. M-08-23 required DNSSEC by December 2009, with agency dot gov domains signed. SC-20 asks authoritative services for origin and integrity artifacts, and SC-21 asks the recursive resolver to request and perform verification. SP 800-81 Revision 3 recommends the root key as trust anchor with automated rollover. On internal zones it's more cautious than the whitepaper: signing them is likely of limited value and recommended against unless required, because they may not chain to the root, dynamic zones re-sign on every update, and signing is pointless where authoritative and recursive service share servers, as on domain controllers. Where required, use a delegation that chains to the root.

So the program signs external zones always, validates on every agency resolver, and signs internal zones only where the system's authorization requires it.

The platforms aren't equal. Windows Server uses a Key Master, can replicate keys in AD, and supports RFC 5011 rollover; its wizard's default 1,024-bit RSA zone-signing key is below NIST's floor, so the program uses ECDSA or RSA of at least 2,048 bits. Azure DNS and Route 53 sign public zones only; Azure's default resolver doesn't validate, and Route 53's ignores the DO and CD bits. Neither gives the agency validation it controls.`,
  "Book 08, Chapter 06 — DNS Identity, Certificates and DNSSEC, \"DNSSEC\" and \"DNSSEC on Windows Server, Azure and AWS.\"");
}

// ================================================================== 16 Operating and moving signed zones
{
  const s = D.content(P1, "Operating DNSSEC and moving signed zones");
  tag(s, "How");
  table(s, "Ops", 1.5, [1.9, 4.2], ["Area", "NIST and platform guidance"], [
    ["Keys", "HSM for important keys (usually the KSK); signatures 5–7 days; keys 1–3 years"],
    ["Algorithms", "RSA/SHA-256 ≥ 2,048 bits or ECDSA P-256/P-384; ECDSA preferred"],
    ["Denial of existence", "NIST: NSEC \"more prudent\"; Windows labels NSEC3 recommended; Azure uses compact denial (RFC 9824)"],
    ["Response size", "EDNS(0), MTU and fragmentation; larger during algorithm rollovers"],
    ["Across views", "Signed in one view, not another: failures surface as app or certificate errors"],
  ], { fontSize: 12 });
  subhead(s, "Move head", "MOVING A SIGNED ZONE (CHAPTER 10, PHASE 3)", 6.95, 1.5, 5.8);
  const steps = [
    ["1", "Finish any rollover in progress; start none during the move"],
    ["2", "Sign on the new platform, publish the new DS, confirm from an independent validator, then stop old signing"],
    ["3", "Watch validator logs: clients see only generic failures"],
    ["4", "Internal zone landing on Azure Private DNS: a documented risk decision"],
    ["5", "Remove retired trust anchors after the 90-day validation period"],
  ];
  steps.forEach((st, i) => {
    const y = 1.85 + i * 0.74;
    box(s, `Step ${i + 1}`, 6.95, y, 0.55, 0.62, i === 3 ? HEX.red : HEX.amber);
    txt(s, `Step ${i + 1} num`, st[0], { x: 6.95, y, w: 0.55, h: 0.62, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Cambria" });
    T(s, `Step ${i + 1} text`, st[1], { x: 7.62, y, w: 5.13, h: 0.66, fontSize: 12.5, valign: "middle" });
  });
  T(s, "Compensations", [
    { text: "Two compensations corrected: ", options: { bold: true, color: HEX.red } },
    { text: "Azure VNet traffic isn't encrypted by default (VNet encryption is opt-in, limited, and in preview in Azure Government), and Private Link doesn't make in-network answers tamper-proof." },
  ], { x: 0.6, y: 5.35, w: 6.1, h: 1.1, fontSize: 12.5 });
  sources(s, "Sources: NIST SP 800-81r3 §3.8; RFC 9824; RFC 6891; Microsoft Learn — Sign DNS zones (Windows), Azure DNSSEC, unsign an Azure Public DNS zone, Azure Virtual Network encryption. Book 08, Ch 06.");
  notes(s,
`Operating DNSSEC is mostly key management, automated and audited. NIST recommends a hardware security module for important keys, usually the KSK, signature validity of about five to seven days, and key lifetimes of one to three years. Its acceptable algorithms include RSA with SHA-256 at 2,048 bits or more and ECDSA P-256 and P-384, and it prefers ECDSA, because smaller keys keep responses small. On denial of existence, Windows labels NSEC3 recommended, while NIST notes NSEC3 relies on SHA-1 and calls NSEC the more prudent approach; compact denial of existence, RFC 9824, is what Azure DNS uses. Signing grows responses, so EDNS zero and fragmentation handling matter. And a zone signed in one view but not another fails as an application or certificate error.

Moving a signed zone has its own sequence, run during Chapter 10's Phase 3 so the new chain validates before the decommission gate. First, finish any rollover in progress and start none during the move. Second, keep the old signing until the new chain validates: sign on the new platform, publish the new DS at the parent, confirm from an independent validator, and only then stop signing at the source. Third, watch the validators, because clients see only generic failures. Fourth, an AD-signed internal zone landing on Azure Private DNS, which can't sign, is a documented risk decision. The book corrects two compensations the source guide listed: Azure virtual network traffic isn't encrypted by default, and Private Link doesn't make in-network answers tamper-proof. Removing DNSSEC is the reverse: Microsoft documents that the DS record comes off the parent and its TTL expires before the zone is unsigned. Fifth, remove retired trust anchors after the ninety-day validation period.`,
  "Book 08, Chapter 06 — DNS Identity, Certificates and DNSSEC, \"Operational considerations\" and \"Moving signed zones.\"");
}

// ================================================================== 17 Module 3 divider
{
  const s = divider(P2, "Module 3: Private endpoints, IPAM and the reference architecture", "Part 2 — Building and running the control plane  ·  Chapters 07–08, Appendix C",
    ["How each cloud does private DNS; Azure private endpoints in detail", "The Private Resolver in a hub-and-spoke network; IPAM as authority", "The governed path, the five decisions, and what federal clouds change"], 10);
  notes(s,
`Part 2: building and running the control plane. Module 3 covers the design.

Chapter 07's premise: every cloud ships its own private DNS and its own address manager, and unless one plane governs both, names and addresses drift apart one console at a time. We'll take the four private DNS models, Azure private endpoints and the Private Resolver in detail, then IPAM as the authority for address blocks across the clouds. Chapter 08 then draws the reference architecture and the five decisions that carry almost all of its operational risk, each with a check to run in the live configuration, and Appendix C sets out what changes in government clouds.`,
  "Book 08, Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency; Chapter 08 — Reference Architecture; Appendix C — Applicability.");
}

// ================================================================== 18 Four private DNS models + Azure behavior
{
  const s = D.content(P2, "Four private DNS models, and Azure private endpoints");
  tag(s, "What");
  table(s, "Models", 1.5, [1.5, 2.85, 2.6, 2.65, 2.55], ["Platform", "Private namespace", "Entry from outside", "Forwarding out", "DNS-layer policy"], [
    ["AWS", "Route 53 private hosted zones at VPC+2", "VPC Resolver inbound endpoint", "Outbound endpoint + Resolver rules (shareable)", "Resolver DNS Firewall"],
    ["Azure", "Private DNS zones, linked VNets only", "Private Resolver inbound endpoint", "Outbound endpoint + forwarding rulesets", "DNS resolver policy"],
    ["Google Cloud", "Cloud DNS private zones per VPC", "Inbound server policy entry points", "Forwarding zones, outbound policies, peering", "Response policies (one per network)"],
    ["VMware NSX", "No private zone: forwarder on the gateway", "Forwarder IP, only if configured", "Up to 5 FQDN zones × 3 servers", "None beyond forwarding"],
  ], { fontSize: 11.5 });
  const cards = [
    ["FaDoorOpen", "DNS answers don't grant access", HEX.navy, HEX.navyTint, "The public CNAME chain resolves from anywhere by design; access is the service's firewall setting."],
    ["FaCubes", "One zone per service type", HEX.teal, HEX.tealTint, "Use one privatelink zone of each name across all networks, with Microsoft's recommended names."],
    ["FaTriangleExclamation", "The NXDOMAIN trap", HEX.red, HEX.redTint, "A partner's endpoint leads into your empty private zone; set \"fallback to internet\" on the link."],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Card ${i + 1}`, x, 4.45, 3.95, 2.0, c[3]);
    icon(s, c[0], x + 0.15, 4.58, 0.55, c[2]);
    T(s, `Card ${i + 1} head`, c[1], { x: x + 0.82, y: 4.58, w: 3.0, h: 0.55, bold: true, color: c[2], fontSize: 14.5, fontFace: "Cambria", valign: "middle" });
    T(s, `Card ${i + 1} text`, c[4], { x: x + 0.18, y: 5.2, w: 3.62, h: 1.2, fontSize: 12.5 });
  });
  sources(s, "Sources: AWS Route 53 VPC Resolver, DNS Firewall; Microsoft Learn — Azure Private DNS, Private Resolver, DNS resolver policy, private endpoint DNS integration and zone values; Google Cloud DNS server policies, zones, response policies; NSX forwarder. Book 08, Ch 07.");
  notes(s,
`Each cloud ships its own private DNS, with its own console, API, zone model and failure behavior, and none was designed to share policy with the others.

AWS has Route 53 private hosted zones answered by the VPC Resolver, inbound endpoints for queries from outside, outbound endpoints and Resolver rules, and DNS Firewall. Azure has Private DNS zones resolvable only from linked networks, the Private Resolver's endpoints and forwarding rulesets, and resolver policy. Google Cloud has private zones per VPC network, inbound server policies, forwarding and peering zones, and response policies. VMware NSX has no private zone at all: a gateway forwarder holds a default zone and up to five FQDN zones of three servers each, used only by workloads configured for it.

Azure private endpoints are the most common source of private-IP split-brain. With private DNS integration, a zone group writes the endpoint's A record into the matching privatelink zone and removes it when the endpoint goes. Public DNS carries a CNAME into the privatelink name, so connection strings don't change. The private answer comes back only from a resolver that can see a linked zone.

Three behaviors catch teams out. DNS answers don't grant access: the public chain resolves from anywhere by design, and access is the service's network setting, so a wrong answer shows up as a public-path connection or an access denial. Use one zone per service type everywhere, with Microsoft's recommended names, since records are generated only for those. And the NXDOMAIN trap: a partner's storage account with its own private endpoint leads into your empty zone and fails; the fix is fallback to internet on the zone's link.`,
  "Book 08, Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency, \"How each platform implements private DNS\" and \"Azure DNS and private endpoints.\"");
}

// ================================================================== 19 Zones and the Private Resolver
{
  const s = D.content(P2, "Forward the public zone; Private Resolver in the hub");
  tag(s, "How");
  table(s, "Zones", 1.5, [1.6, 2.55, 2.55], ["Service", "Forward from other resolvers", "Azure Government zone"], [
    ["Blob storage", "blob.core.windows.net", "privatelink.blob.core.usgovcloudapi.net"],
    ["Azure SQL Database", "database.windows.net", "privatelink.database.usgovcloudapi.net"],
    ["Key Vault", "vault.azure.net, vaultcore.azure.net", "privatelink.vaultcore.usgovcloudapi.net"],
    ["App Service", "azurewebsites.net, scm.azurewebsites.net", "privatelink.azurewebsites.us"],
  ], { fontSize: 11.5 });
  T(s, "Rule", [
    { text: "Forward the public zone, not privatelink: ", options: { bold: true, color: HEX.red } },
    { text: "from on-premises, Route 53 rules, Cloud DNS forwarding zones and branches, to the inbound endpoint. Commercial and Government names differ; spanning both needs both sets." },
  ], { x: 0.6, y: 4.2, w: 6.7, h: 1.1, fontSize: 12.5 });
  T(s, "Autoreg", [
    { text: "Autoregistration: ", options: { bold: true, color: HEX.navy } },
    { text: "VMs only, primary NIC only, no PTRs, one zone per VNet, never in privatelink zones." },
  ], { x: 0.6, y: 5.4, w: 6.7, h: 0.95, fontSize: 12.5 });
  panel(s, "Resolver", 7.55, 1.5, 5.2, 4.95, HEX.teal, HEX.tealTint, "AZURE DNS PRIVATE RESOLVER — DESIGN RULES", "A forwarding bridge, not an authority", [
    "Dedicated subnet per endpoint, delegated, /28 to /24",
    "5 inbound + 5 outbound endpoints; rulesets of 1,000 rules, 500 VNets; 6 targets; 10,000 QPS each",
    "No encrypted VNets, IPv6 subnets, FastPath or Lighthouse",
    "Static inbound addresses; conditional forwarding, never NS delegation",
    "No ruleset linked where its rule targets that VNet's inbound endpoint",
    "Don't list custom DNS beside 168.63.129.16; a resolver per region",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Private endpoint DNS integration and zone values; autoregistration; DNS Private Resolver overview, endpoints and rulesets; Azure Architecture Center; AKS DNS troubleshooting; hybrid DNS design. Book 08, Ch 07.");
  notes(s,
`Two rules turn Azure private endpoints from a source of split-brain into something governed.

First, forward the public zone. Forwarders on non-Azure resolvers point at each service's public zone, for example database dot windows dot net, not the privatelink zone. Every origin, on-premises resolvers, Route 53 rules, Cloud DNS forwarding zones and branch paths, sends it to the Private Resolver's inbound endpoint, or to an agency resolver that forwards there. Azure Government uses different names, so a design spanning both clouds needs both sets. Forwarding a whole public zone also carries other organizations' lookups, which is why fallback to internet goes on the links. Autoregistration is separate: VMs only, primary NIC only, no PTR records, and no role in privatelink zones.

Second, build the resolver in the hub as a forwarding bridge, not an authority. Because it isn't authoritative, on-premises DNS reaches it by conditional forwarding, never by NS delegation.

The rules that matter. Each endpoint gets its own delegated subnet, slash twenty-eight to slash twenty-four. A resolver supports five inbound and five outbound endpoints; a ruleset holds a thousand rules across five hundred networks; each endpoint handles ten thousand queries a second. No encrypted networks, IPv6 subnets, FastPath or Lighthouse. Static inbound addresses, so forwarders are written once. Never link a ruleset to the network whose inbound endpoint one of its rules targets; that loops. Don't list a custom resolver beside 168.63.129.16, because some clients pick among listed servers. And a resolver in each region.`,
  "Book 08, Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency, \"Zones to plan for,\" \"Recommended pattern,\" \"The Azure DNS Private Resolver in a hub-and-spoke network.\"");
}

// ================================================================== 20 IPAM
{
  const s = D.content(P2, "IPAM is the authority for address blocks");
  tag(s, "How");
  table(s, "IPAM", 1.5, [2.25, 5.1, 4.8], ["Platform", "What it offers", "The program's control"], [
    ["AWS VPC IPAM", "An external IPAM can own a private scope (Infoblox example, since Nov. 2025); Advanced Tier", "Enable in commercial Regions; not in GovCloud (US) or China"],
    ["Azure VNet Manager", "Hierarchical pools (root + 7 layers), IPv4 and IPv6, static CIDRs for outside ranges", "Mirror enterprise reservations as static CIDRs; reconcile"],
    ["Google Cloud", "Internal ranges, including ranges reserved for use outside the network", "Mirror reservations as internal ranges; reconcile"],
    ["VCF 9.1 and NSX", "Native allocation from Infoblox; tenant FQDNs registered automatically", "Enable; confirm IPv6 and limits (vendor blog only)"],
  ], { fontSize: 12 });
  panel(s, "Discovery", 0.6, 4.35, 6.0, 2.1, HEX.teal, HEX.tealTint, "DISCOVERY AND THE INVENTORY", null, [
    "Federation + active and passive discovery: one hierarchy, overlaps found before peering",
    "Track the name side too: FQDNs, wildcards, bound certificates; CM-8 reporting",
  ], 12.5);
  panel(s, "IPv6", 6.75, 4.35, 6.0, 2.1, HEX.amber, HEX.amberTint, "IPV6 AND DUAL STACK", null, [
    "M-21-07 targets: 20%, 50%, 80% IPv6-only by end of FY2023–FY2025",
    "Private Resolver can't use IPv6 subnets; one plane for both paths",
  ], 12.5);
  sources(s, "Sources: AWS What's New (Nov. 17, 2025) and VPC IPAM User Guide; Microsoft Learn — Azure Virtual Network Manager IPAM; Google Cloud internal ranges; VMware VCF 9.1 blog (vendor); OMB M-21-07. Book 08, Ch 07.");
  notes(s,
`The address side has the same structure as the name side. AWS VPCs, Azure virtual networks, Google Cloud VPC networks and NSX segments each allocate on their own, so a CIDR created in a console can overlap on-premises space, another cloud or another division, and the enterprise DDI system doesn't know until discovery runs or a conflict appears.

Integration depth differs. Amazon VPC IPAM can hand a private scope's authority to an external IPAM; since November 2025 the book's example is Infoblox, which chooses a block or accepts or rejects a requested one. It needs the Advanced Tier, covers private scopes only, and isn't available in GovCloud or China, so it doesn't help a GovCloud estate today. Azure Virtual Network Manager offers hierarchical pools, a root and up to seven layers, IPv4 and IPv6, with static CIDRs for ranges outside Azure. Google Cloud's internal ranges can reserve blocks. Neither hands authority to an external IPAM, so mirror the enterprise reservations into them and reconcile. VMware Cloud Foundation 9.1 added native Infoblox allocation and FQDN registration; the source is a vendor blog without IPv6 or limits, so confirm the scope first.

The rule: reserve blocks in the enterprise IPAM before any cloud or NSX network is created, integrate where you can, mirror and reconcile where you can't, and monitor sync health. Federation plus active and passive discovery produce one hierarchy, which catches overlap before two networks are peered and reports the CM-8 inventory. The program also wants IPAM to track FQDNs, wildcards and bound certificates.

IPv6: M-21-07's milestones have passed. Plan both protocols together; the Private Resolver can't use IPv6-enabled subnets.`,
  "Book 08, Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency, \"SDN–IPAM consistency\" and \"IPv6 lifecycle.\"");
}

// ================================================================== 21 Five decisions
{
  const s = D.content(P2, "The governed path, and five decisions that fail silently");
  tag(s, "How");
  flow(s, "Path", 1.5, 0.78, [
    { head: "Client" }, { head: "SD-WAN edge" }, { head: "Agency resolver" },
    { head: "DDI policy plane" }, { head: "Optional SASE DNS" }, { head: "Protective DNS" },
  ], 11);
  table(s, "Decisions", 2.45, [0.55, 3.15, 4.3, 4.15], ["#", "Decision", "Settled as", "Check in the running config"], [
    ["1", "redirect-dns destination", "A network-addressable agency resolver, never a loopback stub", "Read every branch's data policy target"],
    ["2", "Forwarding chain order", "Agency resolver first; SASE DNS is its forwarding target", "Trace the order, not just the parts"],
    ["3", "Per-cloud conditional forwarding", "The plane holds every rule and pushes it to every resolver, branch too", "One name per namespace, every origin; compare"],
    ["4", "AD DNS inventory before retirement", "SRV, forwarders, delegations reprovisioned first", "A dated export, reconciled, before approval"],
    ["5", "OCSP and CRL reachability", "Published in the plane, forwarded to every cloud", "Resolve each one, fetch a response, every origin"],
  ], { fontSize: 12, firstColor: HEX.red });
  sources(s, "Sources: CISA Protective DNS Resolver; Infoblox Endpoint docs (vendor example); Microsoft Learn — private endpoint DNS integration; AWS Route 53 VPC Resolver. Book 08, Ch 08 (and Ch 04–07 for each decision's mechanics).");
  notes(s,
`Chapter 08's architecture is simple to draw. A branch query goes through the SD-WAN edge to a network-addressable agency resolver, into the policy plane for policy, response policy zones, DNSSEC and IPAM, and on to the per-cloud private zones. Internet-bound recursion leaves through CISA's Protective DNS Resolver, which blocks, redirects or sinkholes queries matching threat indicators. On-premises clients reach the agency resolver directly; cloud workloads reach the plane through Chapter 07's per-cloud forwarding.

Five decisions carry almost all of the operational risk, and each fails silently: the query still resolves, just outside policy or to the wrong address. So each has a check to run in the live configuration, not the design document, before the next SD-WAN or DDI change.

Decision 1, the redirect-dns destination: a DDI resolver or forwarding proxy at the branch or a regional hub, never a loopback stub. Check every branch's running data policy. Decision 2, forwarding chain order: a SASE resolver is a forwarding target of the agency resolver, never the redirect target. The common failure is every component present with the SASE service first, so trace the order. Decision 3, per-cloud conditional forwarding: the plane holds every private namespace's rule and pushes it to every resolver, branches included. Check: resolve one name per namespace from on-premises, each cloud and a branch; a public address or NXDOMAIN means a missing rule. Decision 4, the AD DNS inventory, reprovisioned before any domain controller goes, because once the last one holding a zone is gone, its records can't be recovered. Check for a dated, reconciled export before approval. Decision 5, OCSP and CRL reachability from every origin. Check: resolve each endpoint in the issuing CA certificates, and fetch a response.`,
  "Book 08, Chapter 08 — Reference Architecture and the Five Critical Decisions, \"The end-to-end resolution flow and five decisions.\"");
}

// ================================================================== 22 Policy plane and federal clouds
{
  const s = D.content(P2, "The policy plane, and what federal clouds change");
  tag(s, "Who");
  panel(s, "Parts", 0.6, 1.5, 4.45, 4.95, HEX.navy, HEX.navyTint, "THREE PARTS, PACKAGED DIFFERENTLY", "Overlay, not replacement", [
    "DNS and DHCP layer: internal zones, recursion, RPZ, DNSSEC; grids converge in seconds, so verify emergency blocks on serving members",
    "Management plane: the system of record, often a cloud service",
    "Local resolvers and agents: keep resolving if management is unreachable",
    "Route 53 and Azure still serve their zones; the plane holds one policy object",
  ], 12);
  table(s, "Federal", 1.5, [2.55, 2.4, 2.6], ["Component", "Commercial / GCC-Moderate", "GCC High, Azure Gov, GovCloud, DoD"], [
    ["Cloud DDI management plane", "FedRAMP Moderate + agency ATO", "Moderate doesn't cover High"],
    ["Five decisions, RPZ, Protective DNS", "Apply", "Apply (air-gapped differs)"],
    ["Private endpoint zone names", "Commercial names", "*.usgovcloudapi.net, *.azure.us"],
    ["VPC IPAM external authority", "Commercial Regions", "Not in GovCloud (US)"],
    ["Azure DNS Private Resolver", "Available", "FedRAMP High; forecast at IL4–IL5"],
    ["Azure Private DNS signing", "Not supported", "Not supported"],
    ["M365 informed network routing", "Not in GCC-Moderate", "Not available"],
  ], { x: 5.2, fontSize: 11.5, firstColor: HEX.teal });
  sources(s, "Sources: Infoblox release notes and press release (vendor); FedRAMP Marketplace FR2017257053, MSO365MT; FedRAMP Consolidated Rules 2026; Microsoft Learn — Azure Government GA roadmap, private endpoint zone values, INR; AWS VPC IPAM. Book 08, Ch 08; App. C.");
  notes(s,
`The policy plane isn't one box. It has three parts, which products package differently. An on-premises DNS and DHCP layer hosts the internal zones that replace AD DNS, serves recursion, and applies response policy zones and DNSSEC. Grid members answer from local copies, so the program's position is that changes converge in seconds, not milliseconds, and an emergency block must be verified on the members serving the affected clients. A management plane, increasingly a cloud service, holds the system of record and pushes it everywhere. And local resolvers and agents keep resolving from local state if management is unreachable. It's overlay, not replacement: Route 53 and Azure Private DNS still serve their zones.

Infoblox is the book's example: the NIOS grid, and Universal DDI as the cloud plane. Its FedRAMP-listed offering is Infoblox Government Cloud, certified at Moderate; on-premises NIOS appliances aren't a FedRAMP cloud service and sit inside the agency's boundary. Chapter 12 evaluates other platforms against the same requirements.

The architecture is the same everywhere; authorization and integrations change. A plane certified at Moderate, plus the agency's own authorization, suffices for Moderate systems but doesn't cover High: use a service authorized at the required level or keep the plane inside the agency's boundary. Azure Government's zone names differ. VPC IPAM's external authority isn't in GovCloud. The Private Resolver is at FedRAMP High in Azure Government and forecast, not yet authorized, at IL4 and IL5. Azure Private DNS can't be signed anywhere. And informed network routing isn't available in GCC-Moderate, GCC High or DoD.`,
  "Book 08, Chapter 08 — Reference Architecture, \"What a DDI policy plane is made of\" and \"Commercial and federal clouds compared\"; Appendix C — Applicability.");
}

// ================================================================== 23 Module 4 divider
{
  const s = divider(P2, "Module 4: Migration sequence and operating the control plane", "Part 2 — Building and running the control plane  ·  Chapters 10–11, Appendices A–B",
    ["Six phases, the cutover loop, and the gates for decommissioning", "Delegation, telemetry against M-26-14, SRV checks and drift", "Troubleshooting, the evidence checklist, and the appendices"], 12);
  notes(s,
`Module 4: the migration sequence and operating the control plane.

Name resolution has to keep working while its authority moves, so Chapter 10 makes the migration a series of small, reversible cutovers, each proven from every origin before the next starts. Chapter 11 then covers what the plane must support once it exists: scoped autonomy for divisions, one API and audit trail, the query, lease and change evidence that OMB M-26-14 and an authorizing official ask for, and a troubleshooting reference for the hybrid period. Appendix A's record-type catalog and Appendix B's requirements mapping sit underneath both.`,
  "Book 08, Chapter 10 — The Migration Sequence; Chapter 11 — Operating the Control Plane; Appendices A–B.");
}

// ================================================================== 24 Six phases and the cutover loop
{
  const s = D.content(P2, "Six phases, each closed by its validation, not by a date");
  tag(s, "How");
  flow(s, "Phases", 1.5, 1.3, [
    { head: "1 Inventory", body: "Read-only; the step that can't be repaired later" },
    { head: "2 Coexist", body: "New resolvers; forwarding both ways" },
    { head: "3 Migrate authority", body: "Zones, scopes, clients in waves; retarget the edge" },
    { head: "4 Federate clouds", body: "Private endpoints proven from every origin" },
    { head: "5 Decommission", body: "Gated: SRV and _msdcs preserved", color: HEX.red, tint: HEX.redTint },
    { head: "6 Harden", body: "Protective DNS, encryption, DNSSEC, evidence", color: HEX.amber, tint: HEX.amberTint },
  ], 11);
  subhead(s, "Loop head", "THE CUTOVER LOOP EVERY MOVE OF AUTHORITY REPEATS", 0.6, 2.95, 7);
  table(s, "Loop", 3.27, [0.5, 2.35, 4.85], ["#", "Step", "Detail"], [
    ["1", "Lower the TTL", "300 s, at least 48 hours ahead; record the originals"],
    ["2", "Export, transform, import", "Dry run first; never SOA, apex NS or AD locator records"],
    ["3", "Validate from every origin", "Forward and reverse: on-premises, each cloud, branch"],
    ["4", "Switch authority", "Delegation, forwarders or client settings, one at a time"],
    ["5", "Hold and observe", "Query logs, drift reports, SRV checks; no client on the old server"],
    ["6", "Restore TTL, close", "Evidence filed; old copy retired only at decommissioning"],
  ], { fontSize: 11.5, firstColor: HEX.amber });
  panel(s, "Playbook", 8.5, 2.95, 4.25, 3.5, HEX.navy, HEX.navyTint, "THE ELEVEN-STEP PLAYBOOK", null, [
    "Maps onto the six phases for an Azure-heavy estate",
    "Planning estimates (days to 2 weeks per step); gates, not estimates, end a step",
    "A failed check at step 3 or 5 returns to the rollback point",
  ], 12);
  sources(s, "Sources: Book 08, Ch 10, \"The six phases,\" \"How the operational playbook maps to the six phases,\" \"The cutover loop every phase repeats\" (program design; Microsoft Learn cmdlet references).");
  notes(s,
`This is the book's canonical sequence applied to the move from AD-integrated DNS and DHCP, plus independent cloud DNS, to one policy plane.

Phase 1, inventory: export every zone, SRV record, forwarder and DHCP scope, and document resolution paths, including redirect-dns targets and the OCSP and CRL endpoints. Phase 2, coexistence: new resolvers and their Microsoft DNS and DHCP synchronization, with forwarding so both systems answer. Phase 3, migrate authority: zone by zone, clients in waves, redirect-dns retargeted. Phase 4, cloud federation: private endpoint resolution validated from every origin. Phase 5, decommission AD DNS and DHCP, only after reconciliation and failover tests, preserving the SRV and underscore msdcs records remaining domain controllers need. Phase 6, hardening: Protective DNS, encrypted DNS, DNSSEC where required, monitoring and evidence.

Each phase ends with a rollback point and a resolution-path consistency test, not a calendar date. The operational playbook splits the work into eleven steps for an Azure-heavy estate; its durations are planning estimates, and the gates decide. Hardening has no step of its own: logging starts at the first step, and evidence is filed as each step closes.

Every move of authority runs one loop. Lower the TTL, to three hundred seconds at least forty-eight hours ahead, recording the originals. Export, transform and import with a dry run, never migrating SOA or apex NS records, and leaving locator records where domain controllers register. Validate from every origin, forward and reverse. Switch authority one mechanism at a time. Hold and observe until no client queries the old server. Then restore the TTL and file the evidence. A failed check reverts the switch, and the old authority, still intact, answers again.`,
  "Book 08, Chapter 10 — The Migration Sequence, \"The six phases,\" \"How the operational playbook maps,\" \"The cutover loop.\"");
}

// ================================================================== 25 Phases 1-2
{
  const s = D.content(P2, "Phases 1 and 2: sort every component, then coexist");
  tag(s, "How");
  table(s, "Targets", 1.5, [2.2, 2.45, 1.95, 0.85], ["AD DNS component", "Target under the plane", "Azure-native", "Risk"], [
    ["Internal AD zone", "Authoritative zone on the DDI platform", "Private DNS zone", "Medium"],
    ["External AD zone", "Public zone; NS change at the registrar", "Public zone", { text: "High", options: { bold: true, color: HEX.red } }],
    ["Stub zone, forwarder", "Forwarding rule in the plane", "Ruleset rule", "Low"],
    ["GlobalNames", "CNAMEs + suffix search list", "Private zone + list", "Medium"],
    ["AD locator records", "Stay where DCs register, to the last DC", "None", { text: "High", options: { bold: true, color: HEX.red } }],
    ["Dynamic registration", "DHCP-driven DDNS", "VMs only", "Medium"],
    ["Reverse zones", "Aligned to IPAM", "Private in-addr.arpa", "Medium"],
    ["Signed zones", "Signed zone; old signing kept until it validates", "Public zones only", { text: "High", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 11.5 });
  panel(s, "Coexist", 8.25, 1.5, 4.5, 4.95, HEX.red, HEX.redTint, "COEXISTENCE: WHAT BREAKS IT", null, [
    "An on-prem forwarder to 168.63.129.16: unreachable outside a VNet, so private names resolve public",
    "Windows forwarder timeout of 3 s or less: Microsoft wants over 4 s for Azure",
    "Loops: every namespace gets exactly one authoritative path",
    "UDP and TCP 53 open from the resolver subnets",
    "Sync read-only first; write access zone by zone in Phase 3",
  ], 12);
  sources(s, "Sources: Microsoft Learn — DnsServer and DhcpServer modules; Export-DhcpServer; Export-DnsServerZone; Azure Private DNS FAQ; autoregistration; Private Resolver troubleshooting; VNet name resolution. Infoblox NIOS docs (vendor). Book 08, Ch 10.");
  notes(s,
`Phase 1 is read-only, so it carries no rollback risk, and its omission can't be repaired later. The assessment collects every zone with its type, replication scope, update setting and signing state; every record with type, TTL and timestamp; zone health, because stale records migrate as faithfully as good ones; the locator records resolved from every server and site, the Phase 5 baseline; forwarders tested over DNS; DNSSEC state; DHCP scopes, options and failover; resolution paths; and the OCSP and CRL endpoints, committed as JSON to the assessment repository. Import from the record-level export: Microsoft documents Export-DNS-Server-Zone as a troubleshooting export, not zone-file format.

Each component gets a target and a method. Internal zones become authoritative zones on the platform. External zones need an NS change at the registrar, so they're high risk. Stubs and forwarders become forwarding rules. GlobalNames becomes CNAMEs plus a suffix search list. Locator records stay where domain controllers can register; there's no Azure-native equivalent, because Azure Private DNS ignores client registrations and imported SRV records go stale. Dynamic registration becomes DHCP-driven updates. Reverse zones align to IPAM. Signed zones move in Phase 3 by their own sequence, keeping the old signing until the new chain validates, and that has to happen before the Phase 5 gate.

Phase 2 adds resolvers without moving authority. Synchronize read-only first, and forward both ways. Give every namespace exactly one authoritative path, or queries loop, and open UDP and TCP 53 from the resolver subnets through the network security groups. Two errors cause most failures: an on-premises forwarder pointed at 168.63.129.16, reachable only inside a virtual network, and Windows forwarding timeouts of three seconds or less, where Microsoft wants more than four.`,
  "Book 08, Chapter 10 — The Migration Sequence, \"Phase 1 — Inventory and baseline,\" \"Where each component goes,\" \"Phase 2 — Deploy coexistence.\"");
}


// ================================================================== 26 Phase 3
{
  const s = D.content(P2, "Phase 3: move zones, scopes and clients, with a way back");
  tag(s, "How");
  table(s, "Patterns", 1.5, [2.2, 2.95, 2.75], ["Cutover pattern", "Use when", "Rollback"], [
    ["Split horizon", "A name answers private inside, public outside", "Withdraw the private view"],
    ["Subdomain delegation", "A child namespace moves; the parent stays", "Remove the delegation and the child zone"],
    ["Progressive forwarding", "Whole zones move one at a time", "Restore from the archived export; repoint forwarders"],
  ], { fontSize: 12 });
  panel(s, "DHCP", 0.6, 3.5, 3.85, 2.95, HEX.teal, HEX.tealTint, "DHCP SCOPES", null, [
    "Option 6 moves with the scope, set deliberately, checked after import",
    "Keep failover: hot standby (5% reserve) or load balance (50:50)",
    "Re-establish DDNS for A and PTR records",
  ], 12);
  panel(s, "Waves", 4.6, 3.5, 3.85, 2.95, HEX.navy, HEX.navyTint, "CLIENT WAVES AND THE EDGE", null, [
    "Pilot, a department, then all: option 6 and VNet DNS",
    "VMs keep old settings until restart or lease renewal",
    "Retarget redirect-dns; verify the running order",
    "Unlinking a zone deletes autoregistered records for good",
  ], 12);
  panel(s, "AppA", 8.6, 1.5, 4.15, 4.95, HEX.amber, HEX.amberTint, "APPENDIX A — CHECK BEFORE IMPORT", "Record types that bite", [
    "SRV: orphaned at AD retirement; nothing moves them",
    "PTR: most neglected in cloud space; create with the A",
    "CNAME: dangling targets invite subdomain takeover",
    "SPF, DKIM, DMARC: re-test after the move",
    "ALIAS and ANAME: provider-specific, not in IANA",
    "HTTPS records missing from private zones change behavior",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Set-DnsServerResourceRecord; Export/Import-DhcpServer; DHCP failover; Azure Private DNS and DNS FAQs; VNet DNS settings. IANA RR TYPEs; RFCs 1034, 2782, 7208, 9460. Book 08, Ch 10; App. A.");
  notes(s,
`Phase 3 is where zones, forwarders, DHCP scopes and clients actually move, and each move is one pass through the cutover loop.

Records follow the loop, then observe for at least thirty days, with the old copy left in place as the rollback point until decommissioning. Signed zones move here too, by Chapter 06's sequence. Three patterns cover almost every zone. Split horizon, a private answer inside and a public one outside, rolls back by withdrawing the private view. Subdomain delegation, a child moving while the parent stays, rolls back by removing the delegation. Progressive migration with conditional forwarding moves whole zones one at a time and rolls back by restoring the archived export and repointing forwarders.

Check record types the target handles differently before importing; Appendix A is the reference. SRV records are the most security-consequential type in Active Directory and the most underestimated: nothing moves them when AD is retired. PTR records are the most neglected in cloud private space, so IPAM should create the A and PTR together. A CNAME pointing at a deprovisioned resource invites subdomain takeover. ALIAS and ANAME are provider-specific, absent from the IANA registry. Re-test SPF, DKIM and DMARC after the move. And HTTPS records missing from private zones make clients behave differently inside.

DHCP moves scope by scope, with its options. Option 6 moves clients onto the governed resolvers, so set it per scope and check it after import. Keep failover through the move, hot standby or load balance, and re-establish dynamic registration.

Clients move last, in waves: pilot, a department, then everyone. VMs keep old settings until restart or lease renewal. And removing a VNet link from an Azure Private DNS zone deletes its autoregistered records, which Microsoft says can't be restored. Plan that rollback first.`,
  "Book 08, Chapter 10 — The Migration Sequence, \"Phase 3 — Migrate authority\"; Appendix A — DNS Record Types and Ecosystem Integrations.");
}

// ================================================================== 27 Phases 4 and 5
{
  const s = D.content(P2, "Phases 4 and 5: prove it, then decommission by gate");
  tag(s, "How");
  subhead(s, "Matrix head", "PHASE 4 — THE VALIDATION MATRIX", 0.6, 1.5, 7);
  table(s, "Matrix", 1.85, [2.2, 1.55, 1.95, 1.9], ["Name tested", "On-premises", "Each cloud", "Branch"], [
    ["On-prem host names", "Native", "Outbound rule", "Agency resolver"],
    ["Cloud host names", "Inbound endpoint", "Native", "Agency resolver"],
    ["privatelink names", "Private address", "Private address", "Private address"],
    ["AD locator records", "Native", "Rule to the DCs", "Agency resolver"],
    ["OCSP and CRL", "Resolves", "Resolves", "Resolves"],
  ], { fontSize: 12 });
  T(s, "Fail", [
    { text: "A failed test: ", options: { bold: true, color: HEX.red } },
    { text: "a private endpoint name that returns a public address from any origin, even if the application appears to work." },
  ], { x: 0.6, y: 4.6, w: 7.6, h: 0.75, fontSize: 13 });
  panel(s, "Gates", 8.45, 1.5, 4.3, 4.95, HEX.red, HEX.redTint, "PHASE 5 — ALL GATES MUST PASS", null, [
    "Inventory reconciles both ways; signed zones validate on the new chain",
    "Every critical SRV record, every site and VNet, every 15 min: 100% for 30 days",
    "90 days of parallel operation, no critical alerts, no unresolved drift",
    "Failover tested, not assumed",
    "Final query-log review: no direct queries to legacy servers",
  ], 12.5);
  flow(s, "Order", 5.45, 1.0, [
    { head: "Remove old DNS", body: "from DHCP, GPO, VNets" },
    { head: "Remove forwarders", body: "for moved zones" },
    { head: "Archive exports", body: "zones and DHCP" },
    { head: "De-authorize DHCP", body: "then remove roles", color: HEX.red, tint: HEX.redTint },
  ], 10.5, 0.6, 7.65);
  sources(s, "Sources: Microsoft Learn — Remove-DhcpServerInDC; Resolve-DnsName. Book 08, Ch 10, \"Phase 4 — Cloud federation,\" \"Phase 5 — Decommission AD DNS and DHCP\"; Ch 11, \"SRV record monitoring.\"");
  notes(s,
`Phase 4 brings each cloud's DNS and address data under the plane, with private endpoint zones published once and the per-cloud forwarding rules held in one place, Decision 3. Its contribution is the validation matrix: every class of name resolves correctly from every origin. On-premises names resolve natively on premises, through the outbound rule from each cloud, and through the agency resolver from a branch. Cloud names resolve through the inbound endpoint from on premises. Private endpoint names return the private address from all three. Locator records resolve from each cloud through the rule to the domain controllers. And OCSP and CRL endpoints resolve everywhere. A private endpoint name returning a public address from any origin is a failed test, even if the application appears to work.

Phase 5 is the one step whose mistakes can't be rolled back cheaply, so it's gated, not scheduled. All five gates must pass. The inventory reconciles in both directions: nothing missing, nothing unexplained, and every signed zone validating on its new chain with the old signing stopped. Every critical locator record resolves from every VNet and site, checked every fifteen minutes, at one hundred percent for thirty consecutive days. Ninety days of parallel operation with no critical alerts or unresolved drift. Failover tested. And a final query-log review shows nothing still querying the legacy servers.

Then decommission in order: remove legacy DNS addresses from DHCP options, Group Policy and VNets; remove forwarders for moved zones; archive the final exports; de-authorize the old DHCP servers; only then remove the roles, with a seven-day burn-in. The burn-in rollback reinstalls the role from the archived exports, which is why they're archived before anything is removed. Losing locator records early causes forest-wide authentication and domain-join failures.`,
  "Book 08, Chapter 10 — The Migration Sequence, \"Phase 4 — Cloud federation\" and \"Phase 5 — Decommission AD DNS and DHCP.\"");
}

// ================================================================== 28 Operating: delegation and telemetry
{
  const s = D.content(P2, "Operating the plane: delegation, one API, telemetry");
  tag(s, "Who");
  table(s, "Delegation", 1.5, [2.15, 3.45], ["Platform left in service", "Delegation, and the caution"], [
    ["Windows DNS on DCs", "DnsAdmins: read, write, create, delete; a privileged group"],
    ["Windows DHCP", "DHCP Administrators; DHCP Users read-only"],
    ["Azure public DNS", "DNS Zone Contributor; nothing on private zones"],
    ["Azure Private DNS", "Private DNS Zone Contributor at record-set scope; add resource locks"],
  ], { fontSize: 12 });
  T(s, "API", [
    { text: "One API, one audit trail: ", options: { bold: true, color: HEX.navy } },
    { text: "IaC, ITSM, ACME DNS-01 and CI pipelines all use scoped, non-interactive accounts. ACME accounts touch only TXT in their zones." },
  ], { x: 0.6, y: 4.2, w: 5.6, h: 1.05, fontSize: 12.5 });
  table(s, "Logs", 1.5, [2.0, 4.3], ["Source", "What it logs, and how"], [
    ["DDI resolvers", "Query, response, policy action; RPZ and Protective DNS hits"],
    ["Windows DNS", "Audit events on by default; analytic (per-query) log off; ~5% cost at 100,000 QPS"],
    ["Azure VNets", "DNS resolver policy + diagnostic settings: the DNSQueryLogs table"],
    ["Windows DHCP", "Lease events in the audit log; failover state changes"],
    ["Azure control plane", "Activity log: every zone, record set, link and resolver change"],
  ], { x: 6.45, fontSize: 12, firstColor: HEX.teal });
  callout(s, "M2614", 5.35, 1.1, "FaClipboardCheck", HEX.amber, "M-26-14 names neither DNS nor DHCP: ",
    "it needs network-address evidence, searchable 6 months and retrievable a year. Query logs plus lease history supply it; that is the book's design reading.");
  sources(s, "Sources: OMB M-26-14 (May 22, 2026); Microsoft Learn — AD security groups; protect DNS zones; DNS logging; Sentinel DNS via AMA; DNS resolver policy; DHCP audit log; Azure DNS monitoring. Infoblox, ServiceNow, Posh-ACME, lego docs (examples). Book 08, Ch 11.");
  notes(s,
`A single policy plane only works if divisions can still operate their networks through it, because a division that can't will work around it. Corporate administrators see the whole estate; each division gets a scope over its zones, IP spaces and DHCP scopes, with manager, operator and auditor roles and no visibility outside it. Infoblox access views are the book's illustration, and the book notes they currently scope only IPAM roles, so confirm what a release supports.

Whatever stays on Windows or Azure needs the same discipline. DnsAdmins grants full rights on DNS data, and Microsoft lists it as privileged. Azure's DNS Zone Contributor covers public zones only; Private DNS Zone Contributor can be scoped to a record set. A role without delete doesn't protect a record set, because modify can empty it, so add resource locks on critical zones.

Every object should sit behind one documented API, so infrastructure as code, ITSM, ACME DNS-01 automation and pipelines share the same roles and audit trail, with ACME accounts limited to TXT records in their zones.

Telemetry. M-26-14 rescinded M-21-31, whose tables named DNS and DHCP logs, and names neither. Its baseline needs source and destination network address information, searchable for six months and retrievable for a year. The book's reading is that query logs, which host asked for which name, and lease history, which device held which address, supply that. Sources include the DDI resolvers, the Windows DNS analytic log, about five percent cost at a hundred thousand queries a second, Azure resolver policy logs, the DHCP audit log, and the Azure activity log.`,
  "Book 08, Chapter 11 — Operating the Control Plane, \"Delegated administration,\" \"API and automation,\" \"Monitoring and telemetry.\"");
}

// ================================================================== 29 Troubleshooting, evidence, close
{
  const s = D.content(P2, "Keeping it honest: troubleshooting and the evidence checklist");
  tag(s, "How");
  const b = table(s, "Trouble", 1.5, [2.45, 2.45, 2.55], ["Symptom", "Likely cause", "Look first"], [
    ["Private endpoint returns public IP", "Zone not linked; forwarder to 168.63.129.16; short timeout", "Link; target inbound endpoint; > 4 s"],
    ["Domain join fails from a cloud VM", "Locator SRV unresolvable from the VNet", "AD namespace rule; resolve the SRV"],
    ["Queries never resolve", "Forwarding loop", "Trace both directions; one path"],
    ["Old answers after a move", "Cached within the old TTL", "Lower TTLs 48 h ahead"],
    ["DNSSEC fails after a move", "DS at the parent not updated", "Resolve-DnsName -DnssecOk"],
  ], { fontSize: 11.5 });
  T(s, "Watch", [
    { text: "Watch continuously: ", options: { bold: true, color: HEX.navy } },
    { text: "SRV from every site and VNet every 15 min · drift as name, type, data tuples (no SOA or NS), committed to the repo · stale and dangling-CNAME rates monthly · Resolver inbound QPS at zero or +200%." },
  ], { x: 0.6, y: b + 0.1, w: 7.45, h: 6.5 - b - 0.1, fontSize: 12.5 });
  panel(s, "Evidence", 8.25, 1.5, 4.5, 4.95, HEX.amber, HEX.amberTint, "SAMPLE EVIDENCE CHECKLIST", "For the program office and AO", [
    "Decisions 1–5, each checked in the running config",
    "Protective DNS and encrypted DNS configuration",
    "IPAM inventory and discovery reports (CM-8)",
    "Query, lease and audit logs at M-26-14 retention",
    "Rogue DHCP/RA detection; option 6 and RDNSS consistency",
    "Delegated scopes reviewed; DnsAdmins justified",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Private Resolver troubleshooting; VNet name resolution; Azure Private DNS FAQ; dangling DNS; Azure DNS monitoring; Resolve-DnsName. OMB M-26-14; NIST SP 800-53 Rev. 5. Book 08, Ch 11; Ch 10; App. B.");
  notes(s,
`Last, keeping it honest during and after the hybrid period.

Chapter 11's troubleshooting reference covers the common failures. A private endpoint returning its public address usually means the privatelink zone isn't linked to the querying network, a forwarder targets 168.63.129.16, or a Windows forwarder times out too soon. Domain join failing from a cloud VM means the locator records aren't resolvable from that network, so prove SRV forwarding before any cloud VM joins. Queries that never resolve are usually a forwarding loop. Old answers after a move are cached within the old TTL. And DNSSEC failing after a move means the parent's DS record wasn't updated.

Watch continuously. Resolve the locator records every fifteen minutes from every site and VNet, site records included. Detect drift by normalizing both sides to name, type and data, excluding SOA and NS, and commit each report so the history is evidence. Report stale-record and dangling-CNAME rates monthly. The Private Resolver has no forwarding-failure metric, so alert on inbound queries at zero in business hours or spiking over two hundred percent, and use synthetic tests.

The evidence checklist opens with the five decisions, each checked live, then Protective DNS and encrypted DNS evidence, IPAM inventory for CM-8, logs at M-26-14 retention, rogue DHCP and router advertisement detection, and reviewed delegations. Appendix B maps each requirement to its evidence.

So, before the next SD-WAN or DDI change: audit every branch's redirect-dns target, verify the chain order in the running configuration, complete the AD DNS inventory before touching a domain controller, confirm the sovereign-cloud limits, and take open questions to the vendors. Chapter 09 assigns who does each, and Chapter 12 measures success as resolution-path consistency. Thank you.`,
  "Book 08, Chapter 11 — Operating the Control Plane, \"SRV record monitoring,\" \"Drift detection,\" \"Record hygiene,\" \"Troubleshooting reference,\" \"Sample evidence checklist\"; Chapter 10, \"What success looks like\"; Appendix B.");
}

// ================================================================== Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const srcSlide = (title, src) => {
  const s = D.content("Backup", title);
  T(s, "Source list", bullets(src, 11.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 4, fontSize: 11.5 });
};
srcSlide("Sources behind the orientation and Module 1", [
  "OMB M-08-23, Securing the Federal Government's DNS Infrastructure, Aug. 22, 2008  ·  OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, Jan. 26, 2022, \"Encrypting DNS traffic.\"",
  "OMB M-26-14, Ensuring Effective and Efficient Agency Logging and Network Visibility, May 22, 2026  ·  CISA Logging Reference Architecture, Aug. 20, 2026  ·  OMB M-21-07, Completing the Transition to IPv6, Nov. 19, 2020.",
  "CISA Protective DNS Resolver; CISA Encrypted DNS Implementation Guidance, May 16, 2024; CISA TIC 3.0 Security Capabilities Catalog v3.3, Sept. 2026; CISA Zero Trust Maturity Model v2.0, Apr. 2023.",
  "NIST SP 800-81r3, Secure DNS Deployment Guide, Mar. 2026  ·  NIST SP 800-53 Rev. 5 (SC-20, SC-21, SC-22 and others)  ·  NIST SP 800-207, Zero Trust Architecture, Aug. 2020.",
  "FedRAMP Consolidated Rules for 2026, \"Using a FedRAMP Certified Cloud Service\"; FedRAMP Marketplace FR2017257053 (Infoblox Government Cloud). Infoblox press release, July 22, 2026 (vendor).",
  "Microsoft Learn: Azure Storage private endpoints; private endpoint DNS zone values; 403 errors through a private endpoint; Microsoft 365 endpoints (Worldwide incl. GCC; GCC High); DNS resolver policy; DNS Private Resolver.",
  "AWS Route 53 Developer Guide: Route 53 VPC Resolver; DNS Firewall  ·  Google Cloud: DNS server policies; response policies  ·  VMware NSX 4.1: DNS forwarder service  ·  IETF RFCs 882, 1034, 1035.",
  "Microsoft Learn (Ch 04): DNS and AD DS; DNS zones; Add-DnsServerPrimaryZone; Add-DnsServerConditionalForwarderZone; Set-DnsServerGlobalNameZone; DNSSEC Key Master; Locating domain controllers; Policy CSP ADMX_Netlogon; KB 816587; Kerberos SSP/AP.",
  "Microsoft Learn (Ch 04): Dynamic update; DHCP failover; Event ID 1056; Set-DhcpServerv4DnsSetting; DNS scavenging and DHCP lease duration; Entra cloud-first identity guidance; What's new in Windows Server 2025; Entra Domain Services DNS.",
  "IETF RFC 2136 (DNS UPDATE), RFC 3645 (GSS-TSIG), RFC 4701 (DHCID)  ·  Infoblox NIOS deployment guides (vendor)  ·  Enterprise Strategy Group via Infoblox blog, Apr. 2025 (vendor; directional only)  ·  Full footnotes: Book 08, Chapters 01–04.",
]);
srcSlide("Sources behind Module 2 — Edge, identity and DNSSEC", [
  "Cisco: Catalyst SD-WAN Policies Configuration Guide 17.x, \"Redirect DNS in Service-Side VPNs\"; \"Configure Integration with Cisco Umbrella\" (Apr. 8, 2021)  ·  FedRAMP Marketplace FR2304757473A (Cisco Security Cloud for Government).",
  "Infoblox: \"Managing Endpoint\" (vendor)  ·  Microsoft Learn: Microsoft 365 informed network routing; DNSSEC overview (Azure DNS).",
  "IETF RFC 7858 (DoT), RFC 8484 (DoH), RFC 9250 (DoQ), RFC 8106 (RDNSS), RFC 9463 (DNR), RFC 6105 (RA Guard)  ·  IANA DHCP and BOOTP parameters  ·  MITRE ATT&CK T1557.003.",
  "Microsoft Learn: Secure DNS Client over HTTPS; Windows security book (DNS); DNS over HTTPS in DNS Server; Zero Trust DNS; DnsOverHttpsMode (Edge); Add-DhcpServerv4OptionDefinition (WPAD); DHCP authorization failures.",
  "Google Chrome Enterprise policy DnsOverHttpsMode  ·  Mozilla: canary domain use-application-dns.net; DoH heuristics.",
  "Microsoft Learn (Ch 06): Entra authentication and national clouds; AADSTS900439; Office 365 GCC service description; access token claims; Enable DoH in DNS Server (certificates).",
  "IETF RFC 8555 (ACME), RFC 8659 (CAA), RFC 6698 (DANE), RFC 9525 (service identity), RFC 5280 (name constraints), RFC 4592 (wildcards), RFCs 4033–4035 and 9364 (DNSSEC), RFC 9824, RFC 6891 (EDNS(0)).",
  "Microsoft Learn: Sign DNS zones with DNSSEC; What is DNSSEC; Validate DNS responses (RFC 5011); Azure DNS FAQ; unsign an Azure Public DNS zone; Azure Virtual Network encryption.",
  "AWS Route 53 Developer Guide: Configuring DNSSEC signing; Enabling DNSSEC validation  ·  NIST SP 800-81r3 §3.8, §4.2, §5.2; NIST SP 800-53 SC-20, SC-21.",
  "Full footnotes with links and access dates: Book 08, Chapters 05–06 (and Book 07, Chapter 02 for Entra certificate-based authentication).",
]);
srcSlide("Sources behind Part 2 — The control plane", [
  "Microsoft Learn (Ch 07): What is Azure Private DNS; Private Resolver overview, endpoints and rulesets; private endpoint DNS integration and zone values; autoregistration; Azure Architecture Center (Private Resolver; hybrid DNS); AKS DNS troubleshooting.",
  "Microsoft Learn: Configure DNS for Azure VNets; Azure Public DNS; Private Resolver PowerShell quickstart; Azure Virtual Network Manager IPAM  ·  Google Cloud: zones, server policies, response policies, internal ranges.",
  "AWS: \"Amazon VPC IPAM automates IP assignments from Infoblox IPAM,\" Nov. 17, 2025; VPC IPAM User Guide  ·  VMware VCF 9.1 DDI blog, May 15, 2026 (vendor)  ·  Infoblox Azure DNS integration limits (vendor).",
  "Ch 08 and App. C: CISA Protective DNS Resolver; Infoblox release notes Nov. 2025–Jan. 2026 (vendor); FedRAMP Marketplace FR2017257053 and MSO365MT; Azure Government GA roadmap; Azure Government DoD overview; Compare Azure Government.",
  "Microsoft Learn (Ch 10): DnsServer module; Get/Set-DnsServerResourceRecord; Export-DnsServerZone; Export/Import-DhcpServer; Azure Private DNS FAQ; Azure DNS FAQ; Private Resolver troubleshooting; az dns-resolver forwarding-rule.",
  "Microsoft Learn (Ch 10): DHCP failover overview; Create, change or delete a virtual network; Azure VNet FAQ; Remove-DhcpServerInDC; Add-DnsServerConditionalForwarderZone; Resolve-DnsName.",
  "Microsoft Learn (Ch 11): AD security groups and privileged groups; protect DNS and private DNS zones; secure Azure DNS; DNS logging and diagnostics; Sentinel Windows DNS via AMA; DNS traffic; Azure DNS monitoring reference; dangling DNS.",
  "Microsoft Learn: Get-DhcpServerAuditLog; DHCP failover events; az network private-dns record-set  ·  Infoblox access views and policies; terraform-provider-bloxone; Ansible infoblox.universal_ddi; ServiceNow Infoblox spoke and Service Graph Connector; Posh-ACME; lego.",
  "OMB M-26-14, May 22, 2026  ·  NIST SP 800-53 Rev. 5 (CM-8, AU-2, AU-6, AU-12, CM-3)  ·  Appendix A: IANA RR TYPEs; RFCs 1034, 2782, 3596, 4034, 4255, 6376, 7208, 7344, 8162, 8461, 9276, 9460, 9989; CISA BOD 18-01.",
  "Full footnotes with links and access dates: Book 08, Chapters 07–12 and Appendices A–C. Vendor products are cited as examples of a requirement, not endorsements.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:", per.join(" "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
