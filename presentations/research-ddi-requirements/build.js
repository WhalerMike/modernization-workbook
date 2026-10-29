// Book 08 — DNS, DHCP & IPAM: "What a Federal DDI Platform Must Do" — a 25-minute requirements briefing.
// Audience: CIOs, CISOs, network and DDI leads, and acquisition teams choosing or building a DDI platform.
// Build:  node presentations/research-ddi-requirements/build.js presentations/research-ddi-requirements/B08_DDI_Requirements.pptx
// Every claim comes from Book 08 (docs/books/b08-ddi/, footnoted) or from primary sources checked on
// October 22, 2026 (FedRAMP products.json, NIST CMVP, NIAP PCL, DISA STIG file store, CISA, OMB, vendor docs);
// civilian hardening sources (CIS Benchmarks list, NIST NCP, NIST SP 800-53 CM-6) read October 29, 2026. STIGs are "High only".
// Vendor-neutral: products appear only as examples of a requirement or as dated status facts, never ranked.
const D = require("../_build/lib.js")({
  book: "Book 08",
  title: "What a Federal DDI Platform Must Do",
  footer: "Federal Modernization Workbook  ·  Book 08 DNS, DHCP & IPAM  ·  What a federal DDI platform must do",
});
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B08_DDI_Requirements.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute.
// The trailing "Workbook:" paragraph isn't spoken (narrate.py drops it).
const WPM = 142;
let clock = 0, spoken = 0;
const per = [];
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const narrate = (s, body, ref) => {
  const n = body.trim().split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (n * 60) / WPM; spoken += n; per.push(n);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// Slide titles must fit on one line (58 characters at most).
const slide = (sec, title) => {
  if (title.length > 58) console.warn(`  ! title over 58 characters (${title.length}): ${title}`);
  return D.content(sec, title);
};

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// Text box with a fit estimate.
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
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  s.addTable([head(headers), ...body], tableOpts(colW, { x: o.x != null ? o.x : 0.6, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  return bottom;
};

// A tinted panel: small caps label, heading, an optional "Tied to" line, then bullets.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13, tied) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: !!tied } });
  if (tied) {
    runs.push({ text: "Tied to: ", options: { bold: true, color: HEX.ink, fontSize: 12 } });
    runs.push({ text: tied, options: { color: HEX.ink, fontSize: 12 } });
  }
  const headH = 0.15 + (label ? 0.24 : 0) + (heading ? 0.34 : 0) + (tied ? lines(`Tied to: ${tied}`, w - 0.4, 12) * 0.21 : 0);
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.1, w: w - 0.4, h: headH });
  const top = y + 0.12 + headH;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.06, w: w - 0.2, h: h - 0.12, paraSpaceAfter: 2, fontSize: pt, valign: "middle" });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

// A labeled list of tinted rows: [label, text].
const rows = (s, prefix, label, list, x, top, step, h, w, lw = 1.9, pt = 12.5) => {
  txt(s, `${prefix} head`, label, { x, y: top - 0.36, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i + 1}`, x, y, w, h, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `${prefix} ${i + 1} label`, j[0], { x: x + 0.15, y, w: lw, h, fontSize: pt, bold: true, color: j[2] || HEX.navy, valign: "middle" });
    T(s, `${prefix} ${i + 1} text`, j[1], { x: x + 0.2 + lw, y, w: w - lw - 0.3, h, fontSize: pt, valign: "middle" });
  });
};

// Cards across the slide: [iconName, heading, color, tint, bullets].
const cards = (s, prefix, list, y, h, pt = 12.5, x0 = 0.6, W = 12.15, gap = 0.15) => {
  const n = list.length, w = (W - gap * (n - 1)) / n;
  list.forEach((c, i) => {
    const x = x0 + i * (w + gap);
    box(s, `${prefix} card ${i + 1}`, x, y, w, h, c[3]);
    icon(s, c[0], x + 0.18, y + 0.15, 0.58, c[2]);
    txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 0.86, y: y + 0.12, w: w - 0.98, h: 0.64, bold: true, color: c[2], fontSize: 15.5, fontFace: "Cambria", valign: "middle" });
    txt(s, `${prefix} text ${i + 1}`, bullets(c[4], pt), { x: x + 0.18, y: y + 0.88, w: w - 0.3, h: h - 0.95, paraSpaceAfter: 4 });
    const need = y + 0.88 + c[4].reduce((a, t) => a + lines(t, w - 0.55, pt) * pt / 72 * 1.2 + 0.06, 0);
    if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${prefix} card ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  });
};

const S_WHY = "Why the name layer is a control plane";
const S_WHAT = "What a platform must deliver";
const S_WHO = "Who runs it, and divisions";
const S_HOW = "How to decide";

// ================================================================== 1 Title
{
  const s = D.titleSlide(S_WHY, "What a Federal DDI Platform Must Do", "Book 08 — DNS, DHCP & IPAM: requirements, due diligence and delegation to divisions");
  D.agenda(s, 0.8, 4.85, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook  ·  Companion briefing", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "25 minutes for CIOs, CISOs, network and DDI leads, and acquisition teams", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.5, w: 8.4, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing is a companion to Book 08 of the Federal Modernization Workbook: DNS, DHCP and IPAM. If an agency is going to buy or build a platform for its name and address layer, what does that platform actually have to do?

Four parts. Why the name and address layer is now a control plane, and what federal rules ask of it. What a platform has to deliver, and what to check before buying one. Who runs it, including how divisions can manage their own DNS, DHCP and IPAM under central governance. And how to decide.

Vendors appear on these slides only as examples. Nothing here recommends or ranks a product, and the status facts carry a date, because they change. Every claim comes from Book 08 or from primary sources checked in October 2026.`,
  "Book 08, index; Chapters 01, 03, 08, 09, 11 and 12. Product status facts: primary sources checked October 22, 2026 (FedRAMP Marketplace data, NIST CMVP, NIAP Product Compliant List, DISA STIG file store, CISA, OMB, vendor documentation), listed in the backup section; CIS Benchmarks list, NIST National Checklist Program and NIST SP 800-53 CM-6 read October 29, 2026.");
}

// ================================================================== 2 Why: control plane
{
  const s = slide(S_WHY, "DNS, DHCP and IPAM now form a control plane");
  tag(s, "Why");
  txt(s, "Jobs head", "SIX JOBS DNS NOW DOES (BOOK 08, CHAPTER 01)", { x: 0.6, y: 1.45, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const jobs = [
    ["FaCloud", "Private address publication", "One service name: private inside the linked network, public elsewhere"],
    ["FaGlobe", "SaaS front-door selection", "The answer decides which service endpoint a user reaches"],
    ["FaShieldHalved", "Security policy enforcement", "Response policy zones block a domain before a connection"],
    ["FaFileShield", "Certificate validation", "OCSP responders and CRL distribution points are DNS names"],
    ["FaFingerprint", "Service identity and app surface", "Zero Trust policy is written against the FQDN, not the IP"],
  ];
  jobs.forEach((j, i) => {
    const y = 1.85 + i * 0.74;
    icon(s, j[0], 0.6, y + 0.04, 0.55, i % 2 ? HEX.teal : HEX.navy);
    T(s, `Job ${i + 1}`, [
      { text: j[1], options: { bold: true, color: i % 2 ? HEX.teal : HEX.navy, fontSize: 14, breakLine: true } },
      { text: j[2], options: { fontSize: 12.5 } },
    ], { x: 1.3, y, w: 5.5, h: 0.7, fontSize: 12.5 });
  });
  panel(s, "Fragmented", 7.1, 1.45, 5.65, 3.75, HEX.red, HEX.redTint, "FRAGMENTED BY DEFAULT", "Up to five platforms, no shared state", [
    "AD DNS or a DDI grid, Route 53, Azure DNS, Google Cloud DNS, VMware NSX",
    "Split-brain: one name, different answers by origin, and no DNS error",
    "One new private endpoint: up to four more changes on four consoles",
    "Forwarding rules that join the platforms belong to no team",
  ], 13);
  callout(s, "Fix", 5.62, 0.92, "FaSitemap", HEX.navy, "The book's fix: ",
    "one authoritative DDI policy plane for DNS, DHCP and IPAM. An architectural requirement, not a product.");
  sources(s, "Sources: OMB M-08-23; NIST SP 800-81 Rev. 3 (March 2026), Executive Summary and §1.2; Microsoft Learn, AWS, Google Cloud and VMware NSX DNS documentation. Book 08, Chapter 01.");
  narrate(s,
`Almost every network connection begins with a DNS query, and in a hybrid multi-cloud agency the answer decides much more than an address. Book 08 counts six jobs DNS now does: publishing private endpoint addresses, selecting SaaS front doors, enforcing security policy, anchoring certificate revocation checks, and carrying the service identity and application surface that Zero Trust policy is written against. NIST's 2026 DNS deployment guide puts it plainly: DNS has become more than a service; it's a security control.

Yet most agencies run it across as many as five independent platforms: Active Directory DNS or an on-premises grid, Route 53, Azure DNS, Google Cloud DNS and VMware NSX. None shares state with the others. The result is split-brain DNS, the same name giving different answers depending on where the query starts, and it fails quietly, as certificate errors and access denials rather than DNS errors. And the forwarding rules that join the platforms usually belong to no team at all.

IPAM and DHCP are the address half of the same problem. IPAM is the record of who owns which block, and DHCP lease data is how an address becomes a device in the asset inventory.

The book's answer is one authoritative DDI policy plane. That's an architectural requirement, not a product, and it's the yardstick for everything that follows.`,
  "Book 08, Chapter 01 — DNS Is Now the Control Plane (Why DNS is now the control plane; What DNS has become; The fragmented landscape; The management burden of independence; Hybrid cloud IPAM and DHCP).");
}

// ================================================================== 3 Why: requirements
{
  const s = slide(S_WHY, "No rule names a vendor; the rules name capabilities");
  tag(s, "Why");
  const b = table(s, "Requirements", 1.45, [3.35, 8.8], ["Requirement (status October 2026)", "What it asks of DNS, DHCP and IPAM"], [
    ["NIST SP 800-53 SC-20, SC-21, SC-22", "Signed authoritative answers; validating resolvers; fault-tolerant, role-separated name service (Low and Moderate baselines)"],
    ["OMB M-08-23 (2008; not rescinded)", "DNSSEC on all applicable systems, following NIST SP 800-81"],
    ["OMB M-22-09", "Encrypted DNS wherever technically supported, to agency-designated resolvers that log the queries"],
    ["EO 14144 §4(c), as amended by EO 14306", "Encrypted DNS enabled within 180 days where clients and servers support it; contract language for any product that acts as a DNS resolver"],
    ["CISA Protective DNS (6 U.S.C. §663 note)", "Required for civilian agencies, for all egress DNS resolution"],
    ["TIC 3.0, version 3.3 (September 2026)", "Sinkholing, DNSSEC signing and validation, domain monitoring, Protective DNS; filtering to block unauthorized DoH resolvers"],
    ["OMB M-26-14, with CISA's Logging Reference Architecture", "Logs searchable 6 months, retrievable 12. The memo never names DNS; the LRA maps DNS, DHCP and passive DNS logging to network activity as \"foundational\""],
    ["CISA BOD 23-01 and BOD 26-04", "Discovery across all agency IPv4 space every 7 days; quarterly attestation of public IP addresses and domain names"],
    ["OMB M-21-07", "IPv6-only targets of 20, 50 and 80% of assets by FY2023, FY2024 and FY2025, all now past; native IPv6 public DNS"],
    ["NIST SP 800-53 CM-8", "Accurate component inventory; at Moderate, automated detection of unauthorized components"],
  ], { fontSize: 11.5, minRow: 0.3 });
  T(s, "Guidance note", [
    { text: "Guidance, not a mandate: ", options: { bold: true, color: HEX.teal } },
    { text: "NIST SP 800-81 Rev. 3 (March 2026) ties these together; two of its three authors work for a DDI vendor." },
  ], { x: 0.6, y: b + 0.05, w: 12.15, h: 0.3, fontSize: 12 });
  warn("slide 3 guidance note", b + 0.35);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (5.2.0); OMB M-08-23, M-22-09, M-26-14, M-21-07; EO 14144, EO 14306; CISA Protective DNS, TIC 3.0 v3.3, LRA, BOD 23-01, BOD 26-04; NIST SP 800-81r3. Book 08, Ch. 03.");
  narrate(s,
`First, before any procurement: no OMB memorandum, directive, executive order or NIST publication names a DDI vendor, or requires a product category called a DDI platform. They require capabilities.

SP 800-53's SC-20, SC-21 and SC-22 ask for signed answers, validating resolvers and fault-tolerant, role-separated name service. OMB M-08-23 still requires DNSSEC on applicable systems. M-22-09 requires encrypted DNS wherever it's technically supported, to agency-designated resolvers that log the queries. Executive Order 14144's section on encrypted DNS survived the June 2025 amendments: agencies enable it within 180 days wherever clients and servers support it, and CISA is directed to publish contract language for any product that acts as a DNS resolver. Civilian agencies must use CISA's Protective DNS for all egress resolution. And TIC 3.0 lists the matching DNS capabilities.

On logging, be precise. M-26-14 rescinded M-21-31 in May 2026, and it doesn't mention DNS at all. It sets retention: six months searchable, twelve retrievable. CISA's Logging Reference Architecture then maps the old DNS, DHCP and passive DNS categories to network activity, and calls them foundational. That's guidance mapped to a baseline, not a standalone DNS mandate.

For addresses, BOD 23-01 asks for discovery across all agency IPv4 space every seven days, BOD 26-04 asks for quarterly attestation of public IP addresses and domains, M-21-07's IPv6 milestones have all passed, and CM-8 wants an accurate inventory.

NIST SP 800-81 Revision 3 ties these together. It's guidance, not a mandate, and two of its three authors work for a DDI vendor, which is worth knowing when a vendor cites it.`,
  "Book 08, Chapter 03 — Federal Requirements (What the mandates say; NIST SP 800-81 Rev. 3; Control mapping), Chapter 11 (What M-26-14 requires of DNS and DHCP logs) — with verified research beyond the book: EO 14144 §4(c) and EO 14306 (Federal Register full text); CISA BOD 23-01 and BOD 26-04 directive pages; CISA Logging Reference Architecture, Table A-2 and App. D.3; OSCAL SP 800-53 5.2.0 catalog and Low/Moderate baselines (SC-20, SC-21, SC-22, CM-8, CM-8(3)); OMB memoranda index (M-08-23, M-22-09, M-21-07 not rescinded), all checked October 22, 2026.");
}

// ================================================================== 4 What: capabilities 1-2
{
  const s = slide(S_WHAT, "Authoritative DNS across clouds, with DNSSEC kept central");
  tag(s, "What");
  panel(s, "Cap1", 0.6, 1.45, 5.98, 5.05, HEX.navy, HEX.navyTint, "CAPABILITY 1", "Authoritative multi-cloud DNS, no split-brain", [
    "One system of record for zones, forwarding rules and policy; cloud DNS services consume it (overlay, not replacement)",
    "The same conditional-forwarding rules pushed to every resolver, branches included",
    "Redundant, role-separated internal and external resolvers",
    "Ask whether each cloud integration writes or only reads. Examples: one product imports cloud zones but can't export back; another's Azure DNS sync covers simple-routing records only",
  ], 13, "SC-22; Book 08 Decision 3 (per-cloud forwarding)");
  panel(s, "Cap2", 6.77, 1.45, 5.98, 5.05, HEX.teal, HEX.tealTint, "CAPABILITY 2", "DNSSEC with central key custody", [
    "Sign external zones and .gov delegations; validate on every agency resolver",
    "Key rollover automated and audited in one place; NIST recommends an HSM for important keys, usually the KSK",
    "Clouds don't fill the gap: Route 53 and Azure DNS sign public zones only; the Azure-provided resolver doesn't validate",
    "Check defaults. Examples: Windows Server's default ZSK is 1,024-bit RSA, below NIST's floor; NIOS defaults to RSA/SHA-1",
  ], 13, "SC-20, SC-21; OMB M-08-23; TIC 3.0 DNSSEC capabilities");
  sources(s, "Sources: NIST SP 800-53 SC-20–22; OMB M-08-23; NIST SP 800-81r3; Microsoft Learn (Azure DNSSEC, Windows signing); AWS Route 53 DNSSEC; BlueCat and Infoblox docs. Book 08, Chapters 06, 08 and 12.");
  narrate(s,
`Now seven capabilities, each tied to a requirement.

First, authoritative DNS across every environment without split-brain. The platform has to hold one system of record for zones, forwarding rules and policy, and every cloud DNS service consumes it. Book 08 calls this overlay management, not replacement: Route 53 still serves Route 53 zones, but the policy plane holds each rule once and pushes it everywhere, including to branch resolvers. Underneath, SC-22 asks for fault-tolerant name service with internal and external roles separated.

When you evaluate products, ask whether each cloud integration writes to the cloud or only reads from it. The book gives examples. One product's cloud discovery imports Route 53, Azure and Google zones but can't export changes back. Another's Azure DNS sync handles only simple-routing records and leaves NS records read-only. Each decides how a change reaches the cloud.

Second, DNSSEC with central key custody. The book's position is to sign external zones and dot-gov delegations always, validate on every agency resolver, and sign internal zones only where the authorization requires it. Rollover should be automated and audited in one place, and NIST recommends a hardware security module for important keys, usually the key-signing key. The clouds don't fill the gap: Route 53 and Azure DNS sign public zones only, and the default Azure resolver doesn't validate. And check the defaults. Windows Server's default zone-signing key is 1,024-bit RSA, below NIST's floor, and NIOS defaults to RSA with SHA-1.`,
  "Book 08, Chapter 08 — Reference Architecture (Decision 3; What a DDI policy plane is made of), Chapter 06 — DNS Identity, Certificates and DNSSEC (Why it matters; Operational considerations; DNSSEC on Windows Server, Azure and AWS), Chapter 12 (Comparing the platform models) — with verified research beyond the book: Infoblox NIOS 9.1.x \"Setting DNSSEC Parameters\" (default algorithm RSA/SHA1), checked October 22, 2026.");
}

// ================================================================== 5 What: capability 3
{
  const s = slide(S_WHAT, "DNS security: agency policy first, Protective DNS upstream");
  tag(s, "What");
  txt(s, "Chain head", "THE GOVERNED ORDER (BOOK 08, DECISION 2)", { x: 0.6, y: 1.42, w: 8, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  flow(s, "Chain", 1.75, 1.0, [
    { head: "Client", body: "Branch, on-premises or cloud" },
    { head: "Agency resolver", body: "First hop: RPZ, validation, logging" },
    { head: "DDI policy plane", body: "Zones, forwarding, IPAM" },
    { head: "Optional SASE DNS", body: "A forwarder, not the redirect target", color: HEX.amber, tint: HEX.amberTint },
    { head: "CISA Protective DNS", body: "All egress recursion", color: HEX.red, tint: HEX.redTint },
  ], 11.5);
  panel(s, "Cap3a", 0.6, 2.95, 5.98, 3.55, HEX.navy, HEX.navyTint, "CAPABILITY 3", "Response policy and Protective DNS", [
    "Response policy zones or a DNS firewall on agency resolvers, every hit logged",
    "Forward all egress recursion to Protective DNS, preferably encrypted. Test it: CISA notes some vendors can't forward to its resolver",
    "Order in the running configuration, not just presence",
  ], 13, "CISA Protective DNS; M-22-09; TIC 3.0");
  panel(s, "Cap3b", 6.77, 2.95, 5.98, 3.55, HEX.teal, HEX.tealTint, "CAPABILITY 3, CONTINUED", "Encrypted DNS, and no way around it", [
    "DoH or DoT from clients to agency resolvers, and upstream",
    "Endpoints set to agency-designated resolvers, not discovered ones",
    "Block unauthorized resolvers, including DoH (TIC domain resolution filtering)",
    "A loopback endpoint agent protects a roaming device; it can't be an SD-WAN redirect target",
  ], 13, "M-22-09; EO 14144 §4(c); TIC 3.0");
  sources(s, "Sources: OMB M-22-09; CISA Protective DNS (service page, FAQ) and Encrypted DNS Implementation Guidance (May 2024); TIC 3.0 v3.3; EO 14144; Infoblox Endpoint docs. Book 08, Chapters 03, 05 and 08.");
  narrate(s,
`Third, DNS security: two layers in series. The agency's own resolvers apply the agency's policy, response policy zones or a DNS firewall, with every hit logged. Then all egress recursion goes upstream through CISA's Protective DNS, which blocks, redirects or sinkholes queries that match threat indicators. So the platform has to forward to it, preferably encrypted, and that's worth testing: CISA's own guidance notes that some vendors don't support the protocols for forwarding queries to its resolver.

Order matters more than presence. Book 08's Decision 2 is that the agency resolver is always the first hop. If the agency also uses a SASE provider's DNS service, that service is a forwarding target of the agency resolver, never the place the branch edge redirects to. Every component present, in the wrong order, quietly removes the agency's own policy, validation and logging.

Encrypted DNS completes it. M-22-09 requires encrypted DNS wherever technically supported, with endpoints explicitly configured to agency-designated resolvers rather than ones they discover. So the platform must terminate DNS over HTTPS or TLS on its resolvers and use it upstream. And clients mustn't route around it: TIC 3.0 includes filtering that blocks unauthorized DNS over HTTPS resolvers.

One product detail to check. Endpoint DNS agents commonly listen on the device's loopback address. They protect a roaming laptop, but an SD-WAN edge can't redirect to them, so they don't replace a network-addressable branch resolver.`,
  "Book 08, Chapter 03 (What the mandates say), Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP, Chapter 08 (Decisions 1 and 2) — with verified research beyond the book: CISA Protective DNS FAQ (\"some vendors do not support protocols for forwarding queries to CISA's resolver\"), checked October 22, 2026.");
}

// ================================================================== 6 What: capabilities 4-5
{
  const s = slide(S_WHAT, "IPAM as the address authority, DHCP that stays up");
  tag(s, "What");
  panel(s, "Cap4", 0.6, 1.45, 5.98, 5.05, HEX.navy, HEX.navyTint, "CAPABILITY 4", "IPAM as authority, with discovery", [
    "Every block reserved in the enterprise IPAM before a cloud or NSX network is created",
    "Hand allocation to it where the cloud allows: AWS VPC IPAM can use an external IPAM in commercial Regions, not GovCloud",
    "Elsewhere, mirror reservations into native pools and reconcile continuously",
    "Discovery across all address space; public IPs and domains attested quarterly",
    "IPv4 and IPv6 planned in one place",
  ], 13, "CM-8; BOD 23-01; BOD 26-04; M-21-07");
  panel(s, "Cap5", 6.77, 1.45, 5.98, 5.05, HEX.teal, HEX.tealTint, "CAPABILITY 5", "DHCP that stays up and stays honest", [
    "Failover partners moved and tested together, with the same DNS update credentials",
    "Ask how DHCPv6 stays up: Windows Server and NIOS document failover for DHCPv4 only",
    "Option 6 (the resolver list) set centrally; rogue DHCP and router advertisement detection",
    "DHCP snooping and RA Guard on access switches",
    "Lease history kept, so an address becomes a device",
  ], 13, "NIST SP 800-81r3 (lease history); M-22-09; M-21-07");
  sources(s, "Sources: NIST SP 800-53 CM-8; CISA BOD 23-01, BOD 26-04; OMB M-21-07; AWS VPC IPAM; Microsoft DHCP failover; Infoblox NIOS DHCP failover; NIST SP 800-81r3; MITRE T1557.003. Book 08, Ch. 04, 05, 07, 10.");
  narrate(s,
`Fourth, IPAM as the authority, with discovery. Left alone, each cloud's address manager allocates independently, recreating split-brain for addresses. The book's rule is that every block is reserved in the enterprise IPAM before a cloud or NSX network is created. Where a cloud lets an external IPAM hold allocation authority, use it; AWS VPC IPAM can, but only in commercial Regions, not GovCloud. Elsewhere, mirror the reservations into the native pools and reconcile continuously.

Discovery is where IPAM meets the directives. BOD 23-01 asks for automated discovery across all agency IPv4 space every seven days, and you can't scan space you haven't recorded. BOD 26-04 asks agencies to attest their public IP addresses and domains every quarter. And M-21-07's IPv6-only milestones mean IPv4 and IPv6 have to be planned in the same tool.

Fifth, DHCP that stays up and stays honest. Failover partners move and are tested together, and both use the same DNS update credentials, or a takeover leaves names that nobody can update. Ask how DHCPv6 stays available: in the two products checked, Windows Server and NIOS, failover is documented for DHCPv4 only, which matters under the IPv6 targets. Set option 6, the resolver list, centrally, detect rogue DHCP servers and router advertisements, and keep lease history. NIST's guide calls for it, because it's what turns an address in a query log into a device.`,
  "Book 08, Chapter 07 (SDN–IPAM consistency; IPv6 lifecycle), Chapter 01 (Hybrid cloud IPAM and DHCP), Chapter 04 (Secure dynamic updates and the DHCP server), Chapter 05 (DHCP option 6 and rogue DHCP), Chapter 10 (DHCP scopes) — with verified research beyond the book: CISA BOD 23-01 and BOD 26-04; NIST SP 800-81r3 (DHCP lease history); Microsoft Learn \"DHCP failover\" (DHCPv4 scopes only); Infoblox NIOS 9.1.x \"DHCP Failover\" (IPv4 ranges), checked October 22, 2026.");
}

// ================================================================== 7 What: capabilities 6-7
{
  const s = slide(S_WHAT, "Automation and logging: every change and query on record");
  tag(s, "What");
  panel(s, "Cap6", 0.6, 1.45, 5.98, 5.05, HEX.navy, HEX.navyTint, "CAPABILITY 6", "Automation through one API", [
    "Every object reachable by a documented API: IPAM, DHCP, DNS configuration and data",
    "Non-interactive service accounts held to the same roles and scopes; no console login",
    "Supported Terraform and Ansible; ITSM actions that reserve addresses and register records",
    "A path for existing scripts while authority moves; check how the API authenticates (for example, OAuth 2.0 and OIDC in NIOS 9.1)",
  ], 13, "No rule requires an API; Book 08's operating model and audit trail (AU-2, AC-6) depend on one");
  panel(s, "Cap7", 6.77, 1.45, 5.98, 5.05, HEX.amber, HEX.amberTint, "CAPABILITY 7", "Logging to the SIEM, sized for peak", [
    "Query logs, lease history, policy and Protective DNS hits, change and role audit",
    "Searchable 6 months, retrievable 12, timestamps synchronized",
    "Size for load: Microsoft measured ~5% degradation from full Windows DNS query logging at 100,000 queries/s",
    "Read the limits. Examples: NIOS reporting locks after 5 daily-ingest overruns in 30 days; dnstap drops logs when the receiver is down",
  ], 13, "M-26-14 retention; CISA LRA; AU-2, AU-12, SI-4");
  sources(s, "Sources: OMB M-26-14; CISA LRA; NIST SP 800-53 AU-2, AU-12, SI-4; Microsoft Learn DNS logging; Infoblox NIOS 9.1.x reporting, dnstap and WAPI docs. Book 08, Chapters 03 and 11.");
  narrate(s,
`Sixth, automation. No rule requires an API, but Book 08's operating model depends on one. Every object, addresses, DHCP, DNS configuration and DNS data, should be reachable through a documented API, so infrastructure as code, ITSM workflows, certificate automation and pipelines all go through the same authority and the same audit trail. Automation runs as non-interactive service accounts, held to the same roles and scopes as people and unable to log in to the console. Expect supported Terraform and Ansible, ITSM actions that reserve an address or register a record, and a path for existing scripts. Check how the API authenticates; NIOS, for example, added OAuth 2.0 and OpenID Connect for its API in release 9.1.

Seventh, logging to the SIEM, sized for the load. The requirement here is M-26-14's retention: logs searchable for six months and retrievable for a year, with synchronized timestamps, available to the agency's security operations center. The name layer contributes query logs, lease history, policy hits and the change audit trail.

Capacity is where designs fail. Microsoft measured about five percent degradation from full Windows DNS query logging at 100,000 queries a second. NIOS reporting appliances have daily ingest limits, and after five overruns in a rolling thirty days the reporting functions lock until support intervenes. And dnstap on NIOS drops records rather than buffering them when the receiver is down. Size for peak, and test with the SIEM unreachable.`,
  "Book 08, Chapter 11 — Operating the Control Plane (API and automation; ITSM integration; Monitoring and telemetry; What M-26-14 requires of DNS and DHCP logs; Sources of query, lease and change logs; Compliance evidence), Chapter 03 (Control mapping) — with verified research beyond the book: Infoblox NIOS 9.1.x \"What's New\" (WAPI OAuth 2.0/OIDC), \"Supported Reporting Appliances and Storage Space\", \"Limitations of Using dnstap\", checked October 22, 2026.");
}

// ================================================================== 8 What: due diligence checks
{
  const s = slide(S_WHAT, "Before you buy: check the evidence, not the brochure");
  tag(s, "What");
  rows(s, "Check", "ASK EVERY CANDIDATE FOR THE SAME EVIDENCE", [
    ["FedRAMP listing", "The exact offering, its class (impact level) and what its scope covers"],
    ["Deployment model", "SaaS can be in FedRAMP scope; software you run sits in your boundary"],
    ["Impact level", "A Moderate certification doesn't cover High or DoD"],
    ["Hardening guide", "A CIS Benchmark, vendor guide or NCP checklist; DISA STIG is High only"],
    ["FIPS 140-3", "An ACTIVE certificate; 140-2 certificates went historical Sept. 21, 2026", HEX.red],
    ["NIAP", "A current Common Criteria certification, or one in evaluation"],
    ["CDM APL", "Closed to new submissions; the latest list is April 2025"],
    ["Advisory response", "Fix times, KEV listings, and the open-source DNS code underneath"],
    ["Licensing model", "What is metered, and the cost over three to five years"],
  ], 0.6, 1.85, 0.52, 0.47, 7.0, 1.85, 12.5);
  panel(s, "Scope", 7.85, 1.45, 4.9, 5.05, HEX.teal, HEX.tealTint, "READ THE SCOPE, NOT THE BADGE", "What a listing does and doesn't cover", [
    "FedRAMP certifies a cloud service offering, not a vendor or product family",
    "The agency still authorizes its own DDI system; never a standalone ATO for a cloud service",
    "Appliances and software the agency runs sit inside its own boundary",
    "Historical FIPS modules: \"existing systems only\"",
    "BIND: CISA added a 2015 BIND CVE to KEV on Oct. 8, 2026",
  ], 12.5);
  sources(s, "Sources: FedRAMP Rules and Marketplace; NIST CMVP; NIAP PCL; CIS Benchmarks; NIST NCP; DISA STIGs (High only); CISA CDM APL and KEV; Azure prices. Book 08, Ch. 03, 12.");
  narrate(s,
`Before buying any DDI product, check the evidence an assessor will ask for, not the feature list.

Start with FedRAMP, and read the listing's scope, not just its badge. FedRAMP certifies a specific cloud service offering. A SaaS management plane needs a certification at the right level, and the agency still authorizes its own DDI system. Software and appliances the agency runs aren't covered by any listing; they sit inside the agency's own boundary. And a Moderate certification doesn't cover High or DoD workloads.

Then the hardening baseline. The agency writes its own configuration settings for the product, under NIST SP 800-53 control CM-6, so ask what they can be written from: a CIS Benchmark, the vendor's own hardening guide, or a checklist in NIST's National Checklist Program. A vendor-specific DISA STIG, or the generic DNS security requirements guide, is High only, Defense material, though a civilian agency may borrow one when it's the only published checklist for a product. High only marks material that applies to FedRAMP High or Defense environments, not to the Moderate civilian baseline this workbook targets. Ask for an active FIPS 140-3 certificate, and look up its status yourself. FIPS 140-2 certificates moved to NIST's historical list on September 21, 2026, and historical modules may be used for existing systems only. So a new deployment that relies on validated cryptography can't cite a historical certificate. Ask about NIAP. And know that CISA's CDM Approved Products List isn't accepting new submissions; the latest list is from April 2025.

Advisory response: does the vendor track the open-source DNS code underneath? CISA added an old BIND vulnerability to its Known Exploited Vulnerabilities catalog on October 8, 2026. And licensing: know what's metered. Azure's DNS Private Resolver bills 180 dollars a month per endpoint at list price; one DDI vendor's SaaS uses subscription tokens that expire at term end. Model three to five years.`,
  "Book 08, Chapter 03 (FedRAMP and agency authorization), Chapter 12 — Platform Selection, Cost and Residual Risk (What the cloud-native path meters; Selection criteria; Authorization status, as the Marketplace shows it) — with verified research beyond the book: NIST CMVP program and FIPS 140-3 transition pages (140-2 certificates historical September 21, 2026; \"existing systems only\"); NIAP PCL; Center for Internet Security, CIS Benchmarks list (no NIOS benchmark), NIST SP 800-70 Rev. 5 and the National Checklist Program, and NIST SP 800-53 Rev. 5 CM-6, read October 29, 2026; DISA STIG file store and DNS SRG V4R3 (High only reference); CISA CDM APL page (not accepting new submissions; April 2025 list); CISA KEV catalog 2026.10.21 (CVE-2015-5477 added October 8, 2026); Infoblox Universal DDI tokens FAQ (vendor), checked October 22, 2026.");
}

// ================================================================== 9 What: status table
{
  const s = slide(S_WHAT, "Product evidence status, as of October 22, 2026");
  tag(s, "What");
  const b = table(s, "Status", 1.45, [2.35, 3.25, 2.4, 2.0, 2.15], ["Check", "Infoblox", "BlueCat", "EfficientIP", "Micetro"], [
    ["FedRAMP Marketplace", "Infoblox Government Cloud: Certified, Moderate (Class C), SaaS in AWS GovCloud; 1 agency authorization", "No listing", "No listing", "No listing"],
    ["DISA STIG (High only)", "NIOS 9.x V1R1 (2026); Infoblox 8.x DNS V1R4; no CIS Benchmark", "None found", "None found", "None found"],
    ["Active FIPS 140 certificate", "None: 140-2 certificates historical; four 140-3 modules in NIST review", "#5506, FIPS 140-3, Level 1; sunset Aug. 2029", "None found", "None found"],
    ["NIAP / Common Criteria", "None current; NIOS 9.0 in evaluation", "Archived only (2013)", "None found", "None found"],
    ["CDM APL (April 2025)", "Not listed", "Not listed", "Not listed", "Not listed"],
  ], { fontSize: 12, minRow: 0.42 });
  callout(s, "Read", b + 0.25, Math.min(1.45, 6.5 - b - 0.25), "FaScaleBalanced", HEX.navy, "Status, not a ranking: ",
    "FedRAMP covers only vendor-run cloud services; products run inside your boundary are assessed in your own authorization. Cloud DNS services inherit their cloud's authorization. Not verified: DoDIN APL, GSA schedules, DoD impact levels, whether #5506 covers Micetro.");
  sources(s, "Sources: FedRAMP products.json; NIST CMVP certificates and Modules In Process list; NIAP PCL; CC Portal; DISA STIG store (High only); CIS list (Oct. 29); CISA CDM APL (April 2025). Checked Oct. 22, 2026. Book 08, Ch. 12.");
  narrate(s,
`Here's what those checks returned for four DDI products on October 22, 2026. It's a status snapshot, not a ranking, and any cell can change, so confirm on the day you decide.

FedRAMP. One of the four has a listing: Infoblox Government Cloud, Certified at Class C, Moderate, as SaaS in AWS GovCloud, with one agency authorization. It covers the SaaS, not on-premises NIOS appliances. BlueCat, EfficientIP and Micetro have no listing. Their products run as software or appliances inside the agency's own boundary, where the agency's authorization covers them.

STIGs, a High only reference. DISA publishes vendor-specific STIGs for Infoblox: NIOS 9.x, version 1 release 1, and the 8.x DNS STIG, version 1 release 4. None was found for the other three. There's no CIS Benchmark for NIOS, so for Infoblox the STIG is the only product-specific checklist, useful as a cross-check on the agency's own settings.

FIPS 140. BlueCat holds an active FIPS 140-3 certificate, number 5506, a Level 1 software module that sunsets in August 2029. Infoblox's FIPS 140-2 certificates are now historical, and four FIPS 140-3 modules are in NIST's review queue. No certificate was found for EfficientIP or Micetro, and it wasn't verified whether BlueCat's certificate covers Micetro.

NIAP. None of the four has a current certification. Infoblox's NIOS 9.0 is in evaluation, and BlueCat's entries are archived. And none appears on the April 2025 CDM list.

So every candidate has a gap to close, in the contract or in a plan of action and milestones, whether that's an authorization, a hardening checklist or a validated module.`,
  "Book 08, Chapter 12 (Authorization status, as the Marketplace shows it), Chapter 03 (FedRAMP and agency authorization) — with verified research beyond the book: FedRAMP products.json (meta last_change October 22, 2026; FR2017257053); NIST CMVP certificates #5506, #4692, #4535, #4531, #3332, #3330 and the Modules In Process list; NIAP Product Compliant List API; Common Criteria Portal certified and archived CSVs; DISA STIG file store (U_Infoblox_NIOS_9-x_V1R1_STIG, U_IB_8-x_DNS_V1R4_STIG; High only reference); CIS Benchmarks list, accessed October 29, 2026; CISA CDM APL April 2025, all checked October 22, 2026.");
}

// ================================================================== 10 Who: fenced scope
{
  const s = slide(S_WHO, "Divisions get a fenced scope; everything else is denied");
  tag(s, "Who");
  rows(s, "Scope", "WHAT A DIVISION'S SCOPE COVERS (NIOS TERMS AS THE EXAMPLE)", [
    ["Address space", "Its own block; child networks, ranges and reservations inherit"],
    ["Zones", "Its own zones, with read-only rights on the parent view"],
    ["Servers", "DNS and DHCP work, and restarts, on its own servers only"],
    ["Names in its space", "Address and pointer records need rights on the zone and the block"],
    ["Everything else", "Denied by default; only central creates groups, roles and tags", HEX.red],
  ], 0.6, 1.9, 0.82, 0.74, 7.0, 1.85, 13);
  panel(s, "Auth", 7.85, 1.45, 4.9, 5.05, HEX.teal, HEX.tealTint, "STRONG ADMIN AUTHENTICATION", "Prove who the administrator is", [
    "PIV or CAC: X.509 client certificates checked against OCSP",
    "SAML single sign-on: the identity provider's group decides the division (NIOS: exact name match, first match wins)",
    "A local break-glass administrator, kept and controlled",
    "Check automation scoping: Universal DDI service users can't use access views with API keys",
  ], 12.5);
  sources(s, "Sources: Infoblox NIOS 9.0/9.1 admin guide (permissions, admin groups, authentication, SAML, CAC/PIV); Infoblox Universal DDI access views. Book 08, Chapters 09 and 11.");
  narrate(s,
`Now the question many agencies care about most: can divisions run their own DNS, DHCP and IPAM without breaking central governance? Book 08 says yes, if the platform supports a specific model. Corporate administrators see everything. Each division gets a scope limited to its own zones, address blocks and DHCP scopes, with predefined manager, operator and auditor roles, and automation accounts held to the same scope.

As an example, in Infoblox NIOS every resource is denied by default. A division's administrator group gets read-write on its own address block, which cascades to its networks, ranges and reservations; read-write on its own zones, with read-only on the parent view; and DNS and DHCP permissions, including service restarts, on its own servers only. One setting matters: it makes address and pointer records need rights on both the zone and the address block, so a division with access to a shared zone can't point a name into another division's space. And only central superusers create groups, roles and tag definitions, so a division can't widen its own rights.

Administrators must prove who they are. Expect PIV and CAC certificate login checked against OCSP, and SAML single sign-on where the identity provider's group decides the user's division. In NIOS, group names must match exactly and the first match wins, so order the mappings deliberately. Keep a local break-glass administrator.

And check automation scoping in the product you're evaluating. In Universal DDI, service users can't sign in to a divisional access view with API keys.`,
  "Book 08, Chapter 11 — Operating the Control Plane (Delegated administration across divisions; Illustrative implementation), Chapter 09 — Who Owns DNS, DHCP and IPAM (Roles in each system) — with verified research beyond the book: Infoblox NIOS admin guide pages \"About Administrative Permissions\", \"Administrative Permissions for Network Views\", \"Permissions for DNS Resources in Networks and Ranges\", \"Defining DNS and DHCP Permissions on Grid Members\", \"Defining the Authentication Policy\", SAML and two-factor (CAC/PIV) pages; Universal DDI \"Access View Behavior for Interactive and Service Users\", checked October 22, 2026.");
}

// ================================================================== 11 Who: views and tags
{
  const s = slide(S_WHO, "Overlapping space, views and tags keep divisions apart");
  tag(s, "Who");
  cards(s, "Apart", [
    ["FaSitemap", "Separate address spaces", HEX.navy, HEX.navyTint, [
      "Overlapping RFC 1918 space needs its own routing domain",
      "Infoblox calls these network views; Universal DDI uses IP spaces",
      "In NIOS a DHCP server serves one network view: plan dedicated DHCP servers",
      "NIOS doesn't enforce uniqueness across views; Universal DDI's IPAM Federation records it",
    ]],
    ["FaGlobe", "DNS views", HEX.teal, HEX.tealTint, [
      "Different answers to different clients, by source address or key",
      "The first matching view wins: put internal before an external catch-all",
      "Each NIOS network view gets a DNS view by default",
      "Cloud versions differ: an Azure private zone answers only linked networks",
    ]],
    ["FaHashtag", "Ownership tags", HEX.amber, HEX.amberTint, [
      "Division, cost center, site (Infoblox: extensible attributes; Universal DDI: tags)",
      "Tags drive filters and reports, not permissions",
      "\"Required\" is enforced in the GUI only; API and CSV imports can skip it",
      "NIOS reports ignore object permissions: share dashboards per division",
    ]],
  ], 1.45, 5.05, 12.5);
  sources(s, "Sources: Infoblox NIOS 9.0/9.1 admin guide (network views, DNS views, extensible attributes, reporting permissions); Universal DDI IP spaces, IPAM Federation, tags; Microsoft Learn Azure Private DNS. Book 08, Ch. 01, 11.");
  narrate(s,
`Three constructs keep divisions apart.

First, separate address spaces. When a lab's private range overlaps headquarters and renumbering isn't practical, IPAM needs a separate routing domain, so the same addresses can exist twice. Infoblox calls these network views; Universal DDI uses IP spaces. Two consequences follow. In NIOS, a DHCP server serves only one network view, so a division with overlapping space needs its own DHCP servers. And NIOS doesn't enforce uniqueness across views; Universal DDI's IPAM Federation does, recording which blocks are globally unique, which are delegated, and which overlap deliberately behind NAT.

Second, DNS views, which give different answers to different clients by source address or key. The first matching view wins, so an external catch-all placed first hides the internal view. Cloud services have their own versions; an Azure private zone answers only the networks linked to it.

Third, tags for ownership: division, cost center, site. Infoblox calls them extensible attributes; Universal DDI calls them tags. They drive filtering and reports, not permissions. And a required tag is enforced only in the graphical interface. Objects created through the API or a CSV import can skip it, so the automation has to enforce the division tag itself.

One trap: in NIOS, report data isn't filtered by object permissions. Granting a division the reporting app shows it agency-wide DNS and DHCP data, so share dashboards per division instead.`,
  "Book 08, Chapter 11 (Delegated administration across divisions), Chapter 01 (The fragmented landscape: Azure private zones resolve only for linked virtual networks) — with verified research beyond the book: Infoblox NIOS admin guide pages \"Configuring Network Views\", \"About DNS Views\", \"Managing Extensible Attributes\", reporting permissions; Universal DDI \"Configuring IP Spaces\", \"Configuring IPAM Federation\", \"Managing Tags\", checked October 22, 2026.");
}

// ================================================================== 12 Who: approvals and what stays central
{
  const s = slide(S_WHO, "Approvals work only if nothing goes around them");
  tag(s, "Who");
  flow(s, "Approval", 1.45, 1.05, [
    { head: "Division submits", body: "Ticket number required" },
    { head: "Central approves", body: "Or rejects, or reschedules" },
    { head: "Task runs", body: "With the submitter's own rights" },
    { head: "Audit log", body: "Who, what, when, task ID", color: HEX.amber, tint: HEX.amberTint },
  ], 11.5, 0.6, 7.0);
  rows(s, "Bypass", "WHERE CHANGES SKIP APPROVAL (NIOS AS THE EXAMPLE)", [
    ["CSV import", "Needs no approval: remove the permission from division groups", HEX.red],
    ["Service restarts", "Not subject to approval"],
    ["Blocked for submitters", "DNSSEC signing and KSK rollover, network resize and split, bulk edits"],
    ["Delegated zones", "A zone on division-run servers leaves central audit, RPZ and signing"],
  ], 0.6, 3.0, 0.87, 0.8, 7.0, 1.95, 12.5);
  panel(s, "Central", 7.85, 1.45, 4.9, 5.05, HEX.navy, HEX.navyTint, "IN EVERY PATTERN", "What stays central", [
    "Superuser accounts; group, role and tag definitions",
    "Approval workflows and the authentication policy",
    "DNSSEC keys and signing",
    "Security policy: response policy zones, threat feeds",
    "Top-level address blocks",
    "Logging, and platform-wide DNS and DHCP settings",
  ], 13);
  sources(s, "Sources: Infoblox NIOS admin guide (approval workflows, unsupported operations for submitters, scheduling, audit log, delegated zones). Book 08, Chapters 09 (responsibility matrix; record change approval) and 11.");
  narrate(s,
`Delegation needs change control, and the useful pattern is an approval workflow. A division's group submits a change, with a ticket number required. A central approver group approves, rejects or reschedules it. The task then runs with the submitter's own permissions, so approval can't grant rights the division doesn't have, and it lands in the audit log with a task identifier. That's NIOS; a Universal DDI equivalent wasn't confirmed, so ask.

The weakness of any workflow is what goes around it. In NIOS, CSV imports don't require approval at all, and the console warns when a submitter group holds import permission; remove it from every division group. Service restarts aren't subject to approval either. Some operations are blocked for submitters even when they hold the permission: signing or unsigning zones, key-signing key rollovers, resizing or splitting networks, and bulk edits. And a zone delegated to a division's own servers leaves the platform entirely: its changes, its response policy and its signing.

So decide what stays central in every pattern. The superuser accounts, and the definitions of groups, roles and tags. The approval workflows and the authentication policy. DNSSEC keys and signing. Security policy, meaning response policy zones and threat feeds. The top-level address blocks. And logging, with the platform-wide DNS and DHCP settings.`,
  "Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM (The responsibility matrix; Record change approval), Chapter 11 (Delegated administration across divisions) — with verified research beyond the book: Infoblox NIOS admin guide pages \"Creating Approval Workflows\", \"Unsupported Operations for Submitters\", \"Supported Tasks for Different Admin Groups\", \"Scheduling Tasks\", \"Audit Log\", \"Configuring a Delegation\", checked October 22, 2026.");
}

// ================================================================== 13 Who: four patterns
{
  const s = slide(S_WHO, "Four delegation patterns, four sets of trade-offs");
  tag(s, "Who");
  const b = table(s, "Patterns", 1.45, [2.45, 2.85, 3.05, 2.0, 1.8], ["Pattern", "Strengths", "Risks", "Central keeps", "Use when"], [
    ["A. Central platform, delegated admin groups", "One database, one audit log, one DNSSEC and RPZ posture; denied by default", "Permission sprawl; first-match surprises; import bypass; reports ignore permissions", "Groups, roles, tags; platform settings", "The default for most divisions"],
    ["B. Division-owned servers in the central platform", "Local resilience and restarts; division confined to its own servers", "No platform-wide changes; signed zones keep a central hidden primary", "Management node; DNSSEC keys", "A division needs local service"],
    ["C. Separate network view or IP space", "The only way to hold overlapping RFC 1918; clean visibility boundary", "Dedicated DHCP per view; uniqueness across views needs federation", "Top-level, federated and reserved blocks", "Address space overlaps"],
    ["D. Zone delegation to division-run DNS", "Full autonomy; any DNS software", "Central loses audit trail, RPZ coverage and signing of the child zone", "Parent zone, NS and glue, DS records", "Autonomy outweighs oversight"],
  ], { fontSize: 12.5, minRow: 0.72 });
  T(s, "Combine note", [
    { text: "Patterns combine. ", options: { bold: true, color: HEX.navy } },
    { text: "The worked example on the next slide uses all four. Built from Infoblox's documentation; other platforms offer comparable models under different names (Book 08, Chapter 11)." },
  ], { x: 0.6, y: b + 0.12, w: 12.15, h: 0.62, fontSize: 12.5 });
  warn("slide 13 combine note", b + 0.74);
  sources(s, "Sources: Infoblox NIOS admin guide (permissions, members, network views, delegated zones, DNSSEC on a Grid); Universal DDI access views and IPAM Federation. Book 08, Chapters 09 and 11.");
  narrate(s,
`Those pieces make four delegation patterns, each with a cost. They're drawn from Infoblox's documentation but apply to any comparable platform.

Pattern A: one central platform with delegated division administrator groups. You get one database, one audit log, and one DNSSEC and response-policy posture, with everything denied by default. The risks are permission sprawl, first-match ordering surprises when roles overlap, the import bypass, and reports that ignore permissions.

Pattern B: division-owned servers inside the central platform. The division gets local resilience and can restart its own services, confined to its own servers. But it can't change platform-wide settings, and signed zones still have a central hidden primary, because in NIOS only the Grid Master can be primary for a signed zone.

Pattern C: a separate network view or IP space per division. It's the only way to hold overlapping private address space, and it draws a clean visibility boundary. It needs dedicated DHCP servers per view, and uniqueness across views needs federation.

Pattern D: delegate a zone to DNS servers the division runs itself. That's full autonomy, with any DNS software. But central loses the audit trail, the response policy coverage and the signing of that zone, and keeps only the parent zone, the delegation records and, if the child is signed, its DS records.

The patterns combine, and the worked example uses all four.`,
  "Book 08, Chapter 11 (Delegated administration across divisions), Chapter 09 (The roles: DNS/DDI team) — with verified research beyond the book: Infoblox NIOS admin guide pages on administrative permissions and overlaps, Grid member permissions, network views, delegated zones and \"Configuring DNSSEC on a Grid\" (Grid Master as hidden primary); Universal DDI \"About Access Views\" and \"Configuring IPAM Federation\", checked October 22, 2026. The patterns are syntheses of those sources, not vendor-published patterns.");
}

// ================================================================== 14 Who: worked example
{
  const s = slide(S_WHO, "Worked example: four divisions, one governed platform");
  tag(s, "Who");
  txt(s, "Example label", "ILLUSTRATIVE DESIGN, NOT A VALIDATED CONFIGURATION  ·  AGENCY OWNS 10.0.0.0/8 AND example.gov", { x: 0.6, y: 1.42, w: 12.15, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  cards(s, "Division", [
    ["FaBuildingColumns", "Headquarters NetOps", HEX.navy, HEX.navyTint, [
      "Pattern A; 10.0.0.0/12",
      "Hosts the superusers and the read-only approver group",
      "Signs example.gov from the central hidden primary",
    ]],
    ["FaUserShield", "Law-enforcement bureau", HEX.red, HEX.redTint, [
      "Patterns A and B; 10.16.0.0/12",
      "Its zone on its own two servers; all else denied",
      "No shared dashboards; option: a bureau-lead approver group",
    ]],
    ["FaBuilding", "Regional office", HEX.teal, HEX.tealTint, [
      "10.32.0.0/12; still Windows DNS and DHCP",
      "Platform-managed; rights on its own servers only",
      "Each server's view is fixed at first sync",
    ]],
    ["FaLightbulb", "Research lab", HEX.amber, HEX.amberTint, [
      "Patterns C and D; 10.0.0.0/16 overlaps HQ",
      "Own network view or IP space, own DHCP pair",
      "Zone delegated to lab-run BIND; hands DS to central",
    ]],
  ], 1.8, 3.55, 12.5);
  callout(s, "Platform", 5.5, 1.0, "FaListCheck", HEX.navy, "Across the platform: ",
    "division tag enforced in automation; names-in-networks permission on; no CSV import for division groups; SAML groups mapped deliberately; local break-glass admin.");
  sources(s, "Sources: Infoblox NIOS admin guide (permissions, network views, Microsoft servers, delegation, DNSSEC, approvals, reporting, SAML); Universal DDI IPAM Federation. Book 08, Chapters 09 and 11.");
  narrate(s,
`Here's an illustrative design, not a validated configuration, for an agency that owns ten dot zero slash eight and example dot gov, with four divisions.

Headquarters is the central network operations team. It holds its own slash-twelve block and its own zone under pattern A, and it hosts the central superusers and a read-only approver group. If example dot gov is signed, the central management node signs it as hidden primary.

The law-enforcement bureau needs confidentiality from the other divisions. It gets its own block and its own zone, served from its own two servers, patterns A and B, and nothing else, because everything else stays denied. Its data stays out of shared dashboards. If its change detail shouldn't reach headquarters approvers, a bureau-lead approver group can own its workflow.

The regional office still runs Windows DNS and DHCP. The platform manages those servers, and the region's group gets rights on them only, never the platform-wide DNS and DHCP administrator roles. Each server's network view is fixed at first sync.

The research lab numbered itself in a range that overlaps headquarters. It gets its own network view or IP space and its own DHCP pair, pattern C, and its zone is delegated to lab-run BIND servers, pattern D. The lab hands central the DS records for its signed zone, and federation records its space as an overlapping block behind NAT.`,
  "Book 08, Chapter 11 (Delegated administration across divisions), Chapter 09 (The responsibility matrix; Roles in each system) — with verified research beyond the book: the illustrative design is assembled from Infoblox NIOS admin guide pages (administrative permissions, network views, managing Microsoft servers, delegated zones, DNSSEC on a Grid, approval workflows, reporting permissions, SAML) and Universal DDI IPAM Federation, checked October 22, 2026. It is not a validated configuration.");
}

// ================================================================== 15 Who: who decides
{
  const s = slide(S_WHO, "Who decides, under Book 08's responsibility matrix");
  tag(s, "Who");
  table(s, "Matrix", 1.45, [4.6, 2.45, 2.55, 2.55], ["Decision", "Decides", "Does the work", "Consulted"], [
    ["Platform selection and deployment model", { text: "Sponsor / CIO", options: { bold: true, color: HEX.amber } }, "DNS/DDI team", "CISO/ISSO, AO, operating teams"],
    ["Authorizing a cloud-delivered management plane", { text: "Authorizing official", options: { bold: true, color: HEX.red } }, "DNS/DDI team", "Sponsor/CIO, CISO/ISSO, cloud"],
    ["Namespace design and delegation of zones to divisions", { text: "DNS/DDI team", options: { bold: true, color: HEX.teal } }, "DNS/DDI team", "CISO/ISSO, network, cloud, apps"],
    ["IPAM address plan and top-level blocks", { text: "DNS/DDI team", options: { bold: true, color: HEX.teal } }, "DNS/DDI team, cloud", "CISO/ISSO, network"],
    ["DNSSEC signing (public) and validation; encrypted DNS policy; Protective DNS and query logging", { text: "CISO / ISSO", options: { bold: true, color: HEX.navy } }, "DNS/DDI team; SecOps on logging", "Network, cloud, SecOps"],
    ["Internal zones that lose DNSSEC; encrypted DNS exceptions past the limit", { text: "Authorizing official", options: { bold: true, color: HEX.red } }, "DNS/DDI team, cloud, network", "CISO/ISSO, SecOps"],
    ["High-impact record changes: zones, NS, DS, forwarding, wildcards, RPZ", { text: "DNS/DDI team", options: { bold: true, color: HEX.teal } }, "DNS/DDI team", "CISO/ISSO and affected teams"],
    ["Standard record changes inside a delegated namespace", { text: "DNS/DDI team (pre-approved)", options: { bold: true, color: HEX.teal } }, "Division or application owner", "None per change"],
  ], { fontSize: 12, minRow: 0.42 });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (authorizing official); OMB M-22-09; CISA Protective DNS. Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM (The roles; The responsibility matrix; Record change approval).");
  narrate(s,
`Who decides all this? Book 08's Chapter 09 gives one decider per row, and separates deciding from doing.

The sponsor and CIO decide the platform and its deployment model, with the DNS/DDI team doing the evaluation and the CISO, the authorizing official and the operating teams consulted. They also decide how divisions are scoped, and break ties over the resolver path.

The authorizing official decides whether a cloud-delivered management plane is authorized for the agency's use, and accepts the standing exceptions: an internal zone that loses DNSSEC in its new home, or an encrypted DNS exception that has outlived the agency's limit.

The CISO and ISSO set the control requirements: DNSSEC signing of public zones and validation on agency resolvers, encrypted DNS policy, and Protective DNS forwarding and query logging.

The DNS/DDI team decides the namespace and the delegation of zones to divisions and applications, owns the address plan and its top-level blocks, and approves high-impact changes: zones, NS and DS records, forwarding rules, wildcards and response policy. Standard record changes inside a division's delegated namespace are pre-approved, so the division or application owner does the work through a scoped account, without a change board.

That team holds the most powerful roles in the design, so the book scopes its automation, puts a second approver in front of zone, delegation and forwarding changes, and keeps its privileged roles eligible rather than standing.`,
  "Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM (Decision rights and work are different things; The roles; The responsibility matrix; Record change approval).");
}

// ================================================================== 16 How: decisions and next steps
{
  const s = slide(S_HOW, "Decisions to make, and the next steps");
  tag(s, "How");
  const b = table(s, "Decisions", 1.45, [5.6, 2.75, 3.8], ["Decision", "Owner", "Next step"], [
    ["Adopt one authoritative DDI policy plane; settle the five configuration decisions", "Sponsor / CIO; DNS/DDI team", "Within 90 days; report residual risk to the AO"],
    ["Write the requirement as capabilities, each mapped to its rule", "DNS/DDI team, with the CISO", "Before any solicitation; name no product"],
    ["Request the same evidence pack from every candidate", "DNS/DDI team", "FedRAMP scope, hardening guide, active FIPS 140-3, NIAP, advisory response, 3–5 year cost"],
    ["Choose a delegation pattern per division; fix what stays central", "Sponsor / CIO; DNS/DDI team", "Pilot with one division, ideally with overlapping space"],
    ["Size logging to M-26-14 retention", "CISO / ISSO", "Test at peak query rate, and with the SIEM down"],
  ], { fontSize: 12.5, minRow: 0.5 });
  callout(s, "Next", Math.max(b + 0.15, 5.0), 6.5 - Math.max(b + 0.15, 5.0), "FaRoute", HEX.amber, "Next step, no award needed: ",
    "list every DNS, DHCP and IPAM requirement your systems inherit, the capability each needs, and the evidence that would prove it.");
  sources(s, "Sources: OMB M-22-09, M-26-14; NIST SP 800-53; FedRAMP Marketplace; NIST CMVP. Book 08, Chapters 01 (the ask), 03, 09, 11 and 12.");
  narrate(s,
`So, the decisions and the next steps.

First, the sponsor and CIO authorize one authoritative DDI policy plane, and the DNS/DDI team settles Book 08's five configuration decisions within 90 days and reports the residual risk to the authorizing official. That's the book's ask.

Second, write the requirement as capabilities, each mapped to the rule behind it: signing and validation, encrypted DNS, Protective DNS forwarding, discovery and inventory, IPv6, logging retention. No rule names a product, so the solicitation shouldn't either.

Third, request the same evidence pack from every candidate: the FedRAMP listing and exactly what its scope covers, the hardening guidance the agency's settings will come from, an active FIPS 140-3 certificate, Common Criteria status, the advisory response commitment, and a three-to-five-year cost on the same assumptions. Record every gap with an owner.

Fourth, choose a delegation pattern for each division, write down what stays central, and pilot it with one division, ideally one with overlapping address space, because that's where the design gets tested.

Fifth, the CISO sizes logging to M-26-14's retention, and tests it at peak query rates and with the SIEM down.

The next step needs no award. List every DNS, DHCP and IPAM requirement your systems inherit, the capability each needs, and the evidence that would prove it. Book 08 has the detail, with every claim footnoted. Thank you.`,
  "Book 08, Chapter 01 (The case in one paragraph: the ask), Chapter 03, Chapter 09 (The responsibility matrix), Chapter 11 (Compliance evidence; Sample evidence checklist), Chapter 12 (Selection criteria; Questions to put to every vendor).");
}

// ================================================================== Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const srcSlide = (title, src, pt = 11.5) => {
  const s = slide("Backup", title);
  T(s, "Source list", bullets(src, pt), { x: 0.6, y: 1.45, w: 12.15, h: 5.1, paraSpaceAfter: 4, fontSize: pt });
};
srcSlide("Sources: federal requirements and guidance", [
  "NIST SP 800-53 Rev. 5, release 5.2.0 (OSCAL catalog and Low/Moderate baselines): SC-13, SC-20, SC-21, SC-22, CM-8, CM-8(1), CM-8(3), AU-2, AU-12, SI-4  ·  NIST SP 800-37 Rev. 2.",
  "NIST SP 800-81 Rev. 3, Secure Domain Name System (DNS) Deployment Guide, March 2026 (S. Rose, NIST; C. Liu and R. Gibson, Infoblox); SP 800-81-2 withdrawn March 19, 2026.",
  "OMB M-08-23 (Aug. 22, 2008); M-22-09 (Jan. 26, 2022), \"Encrypting DNS traffic\"; M-21-07 (Nov. 19, 2020); M-26-14 (May 22, 2026), rescinding M-21-31, Appendices B and C; OMB memoranda index.",
  "Executive Order 14144 §4(c) (Jan. 16, 2025), as amended by EO 14306 (June 6, 2025), Federal Register full text.",
  "CISA: Protective DNS Resolver service page, FAQ and fact sheet; Encrypted DNS Implementation Guidance (May 16, 2024); TIC 3.0 Security Capabilities Catalog v3.3 (Sept. 2026), Table 9 and Domain Resolution Filtering; Logging Reference Architecture (Aug. 20, 2026), Table A-2 and App. D.3.",
  "CISA Binding Operational Directives: BOD 23-01 (Asset Visibility and Vulnerability Detection); BOD 26-04 (Prioritizing Security Updates Based on Risk, June 10, 2026); BOD 18-01.",
  "CISA CDM program and Approved Products List (not accepting new submissions; April 2025 list)  ·  CISA Known Exploited Vulnerabilities catalog 2026.10.21.",
  "NIST CMVP: validated-modules search, certificate pages, Modules In Process list; FIPS 140-3 transition effort page (140-2 certificates historical September 21, 2026).",
  "FedRAMP Consolidated Rules for 2026, \"Using a FedRAMP Certified Cloud Service\"; FedRAMP Marketplace data, products.json (781 products, last change Oct. 22, 2026).",
  "Full footnotes with links and access dates: Book 08, Chapters 01, 03, 06, 07, 11 and 12, and Appendix B.",
]);
srcSlide("Sources: product evidence and vendor documentation", [
  "FedRAMP Marketplace: Infoblox Government Cloud (FR2017257053); no BlueCat, EfficientIP or Micetro listing; Azure, AWS GovCloud and Google Cloud listings.",
  "NIST CMVP certificates: BlueCat #5506 (FIPS 140-3, Active) and #4692 (Historical); Infoblox #4535, #4531, #3332, #3330 (FIPS 140-2, Historical); four Infoblox FIPS 140-3 modules on the Modules In Process list; no EfficientIP or Micetro certificate.",
  "NIAP Product Compliant List (API): Infoblox Trinzic Appliances with NIOS v9.0, In Progress; archived BlueCat and Infoblox entries  ·  Common Criteria Portal certified and archived lists.",
  "DISA STIG file store (High only): Infoblox NIOS 9.x STIG V1R1; Infoblox 8.x DNS STIG V1R4; DNS SRG V4R3. None found for BlueCat, EfficientIP or Micetro.",
  "CIS Benchmarks list (no NIOS benchmark); NIST SP 800-70 Rev. 5 and the National Checklist Program; NIST SP 800-53 Rev. 5 CM-6; all read Oct. 29, 2026.",
  "Infoblox documentation (vendor): NIOS 9.0/9.1 admin guide (permissions, admin groups and roles, network and DNS views, extensible attributes, approval workflows, audit log, authentication, SAML, CAC/PIV, Microsoft servers, DNSSEC, DHCP failover, reporting, dnstap, WAPI); Universal DDI (access views, IP spaces, IPAM Federation, tags); Universal DDI tokens FAQ.",
  "Microsoft Learn: DHCP failover; DNS logging and diagnostics; Azure DNSSEC; DNS resolver policy; Azure Private DNS; Windows DNSSEC zone signing  ·  AWS: Route 53 DNSSEC signing; VPC IPAM and the Infoblox integration (not in GovCloud).",
  "BlueCat Cloud Discovery & Visibility and Azure deployment documentation; EfficientIP SOLIDserver DNS Cloud (vendor), as cited in Book 08, Chapter 12.",
  "Azure Retail Prices API (October 20, 2026), as cited in Book 08, Chapter 12  ·  NIST NVD and ISC BIND advisories.",
  "All product facts were checked on October 22, 2026; confirm current status on the day of any decision.",
]);
srcSlide("Not verified, and therefore not claimed", [
  "DoDIN Approved Products List, GSA Multiple Award Schedule and NASA SEWP listings for any of the four DDI vendors (sites unreachable or needed form submission).",
  "DoD Cloud Service Catalog or impact-level authorization for Infoblox Government Cloud; any FedRAMP High plan for it.",
  "Whether BlueCat's FIPS 140-3 certificate #5506 covers Micetro, and Micetro's corporate ownership, against a primary source.",
  "Whether the Infoblox Government Cloud listing covers the Threat Defense resolver, DNS Forwarding Proxy or Data Connector (the listing names Universal DDI, Universal Asset Insights, TIDE and Dossier only).",
  "Infoblox's July 2026 statement that NIOS-X servers are in the certified offering is a vendor claim; the deck cites the Marketplace description.",
  "A Universal DDI equivalent of the NIOS approval workflow; which Universal DDI roles can be scoped to access views (Infoblox's two pages disagree).",
  "BlueCat and EfficientIP DNSSEC automation, DHCP failover and multi-tenancy specifics; EfficientIP's DHCP failover claims are vendor-only and were left out.",
  "CISA's encrypted DNS template contract language under EO 14144 §4(c)(i), and any FAR rule; agency compliance status for M-21-07 and M-22-09 milestones.",
  "Analyst rankings (Gartner, Forrester, IDC) and vendor list prices: none used.",
]);
{
  const s = slide("Backup", "Where each slide comes from");
  const map = [
    ["DNS, DHCP and IPAM are a control plane", "Ch. 01"], ["No rule names a vendor", "Ch. 03, 11; CISA, OMB, EO"],
    ["Authoritative DNS and DNSSEC", "Ch. 06, 08, 12"], ["DNS security and Protective DNS", "Ch. 03, 05, 08"],
    ["IPAM authority and DHCP", "Ch. 01, 04, 05, 07, 10"], ["Automation and logging", "Ch. 03, 11"],
    ["Before you buy", "Ch. 03, 12; CMVP, NIAP, CIS, NCP"], ["Product evidence status", "Ch. 12; primary records"],
    ["Divisions get a fenced scope", "Ch. 09, 11; vendor docs"], ["Overlap, views and tags", "Ch. 01, 11; vendor docs"],
    ["Approvals and what stays central", "Ch. 09, 11; vendor docs"], ["Four delegation patterns", "Ch. 09, 11; vendor docs"],
    ["Worked example", "Ch. 09, 11; vendor docs"], ["Who decides", "Ch. 09"], ["Decisions and next steps", "Ch. 01, 03, 09, 11, 12"],
  ];
  const half = Math.ceil(map.length / 2);
  [map.slice(0, half), map.slice(half)].forEach((part, k) => {
    s.addTable([head(["Slide", "Source"]), ...part.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
      tableOpts([3.4, 2.55], { x: 0.6 + k * 6.2, y: 1.45, fontSize: 12.5, rowH: Array(part.length + 1).fill(0.48) }));
  });
  sources(s, "Chapter numbers refer to Book 08 — DNS, DHCP & IPAM (docs/books/b08-ddi/). \"Vendor docs\" are product documentation used only as examples.");
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
console.log("per slide:", per.join(" "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
