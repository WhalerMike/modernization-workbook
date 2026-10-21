// Book 09 — Network & Transport: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b09-network/build.js presentations/b09-network/B09_Network.pptx
// Every fact comes from a footnoted chapter of docs/books/b09-network/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 09", title: "Network & Transport" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B09_Network.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's narration is edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const narrate = (s, body, ref) => {
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};
// Three tinted cards across the slide, each with an icon, a heading and a bullet list.
const cards = (s, prefix, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `${prefix} card ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
  icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], size || 13.5), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, paraSpaceAfter: 6 });
});

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why physics", "Why Does Physics Decide the Architecture?", "Book 09 — Network & Transport");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 09 of the Federal Modernization Workbook, Network and Transport: how to move branch traffic off the long hairpin without turning a latency gain into a compliance loss.

I'll take four questions: why physics decides the architecture, what has to change, who owns the network, and how to get there.

The short version: no product shortens a fiber path, so buy transport on physics, and govern it as compliance.`,
  "Book 09, index; Chapter 01 — Why Physics Decides the Architecture.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why physics", "Distance sets a latency floor no product moves");
  tag(s, "Why");
  const rows = [
    ["Within a metro", "50 km", "0.25 ms", "0.5 ms"],
    ["Same continent", "1,000 km", "5 ms", "10 ms"],
    ["New York to London", "5,570 km", "28 ms", "56 ms"],
    ["New York to Singapore", "15,330 km", "77 ms", "153 ms"],
  ];
  s.addTable([head(["Path", "Great circle", "One way", "Round trip"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: true, color: HEX.red } }, { text: r[3], options: { bold: true, color: HEX.red } }])],
    tableOpts([2.6, 1.5, 1.25, 1.35], { y: 1.5, fontSize: 13, rowH: [0.42, 0.52, 0.52, 0.52, 0.52] }));
  txt(s, "Table note", "Arithmetic, not measurement: distance × ITU-T G.114's 5 µs per km of fiber. Straight-fiber minimums; measured internet paths run several times longer.",
    { x: 0.6, y: 4.1, w: 6.7, h: 0.85, fontSize: 12, italic: true, color: HEX.slate });
  box(s, "Budget box", 7.65, 1.5, 5.1, 3.55, HEX.amberTint);
  icon(s, "FaChartLine", 7.9, 1.68, 0.62, HEX.amber);
  txt(s, "Budget head", "The 150 ms budget, read right", { x: 8.7, y: 1.68, w: 3.95, h: 0.62, bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Budget list", bullets([
    "150 ms is mouth to ear, terminals included",
    "Terminals take 50 to 80 ms",
    "The network gets roughly 70 to 100 ms one way",
    "Seattle hairpin via northern Virginia: about 60 ms one way, worked arithmetic",
  ], 14), { x: 7.9, y: 2.45, w: 4.7, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Less sync", 5.25, 1.25, "FaArrowsRotate", HEX.red, "Need less global synchronization: ",
    "a synchronous commit pays a round trip every time, and bandwidth doesn't shorten it. Keep strong consistency inside a region; make long-distance copies asynchronous.");
  sources(s, "Sources: ITU-T G.114; NIST CODATA (speed of light); Bozkurt et al., PAM 2017; Raft (Ongaro and Ousterhout); Microsoft Learn — microservices data. Book 09, Chapter 01.");
  narrate(s,
`Why does physics decide the architecture? Because part of every delay on a wide-area path is the time light takes to travel through glass. ITU-T G.114 plans on 5 microseconds per kilometer of fiber, about one millisecond for every 200 kilometers, one way. New York to London has a round-trip floor of 56 milliseconds before any equipment touches a packet. Optimization works on the gap above that floor, never on the floor.

G.114's 150 milliseconds is often quoted as the network's voice budget. It isn't. It's mouth to ear, and the terminals take 50 to 80 milliseconds of it, which leaves the network roughly 70 to 100. On the book's worked arithmetic, a Seattle office hairpinning through northern Virginia spends about 60 milliseconds one way on the detour: most of the allowance.

A synchronous commit pays a round trip every time, and no bandwidth changes that. So the answer is to need less global synchronization, not faster synchronization.`,
  "Book 09, Chapter 01 — Why Physics Decides the Architecture.");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why physics", "Transport is physics; control is compliance");
  tag(s, "Why");
  const rows = [
    ["SC-7", "Monitor and control external interfaces", "Enforcement point at the boundary"],
    ["SC-7(4)", "A managed interface and flow policy per service", "The governing layer, per circuit"],
    ["SC-8, SC-8(1)", "Protect transmitted information", "Encryption at the edge or endpoint"],
    ["AC-4, SI-3", "Flow enforcement; malicious code", "The policy enforcement point"],
    ["SI-4", "Detect attacks and unauthorized links", "Governor and PEP telemetry"],
    ["CP-8, SC-47", "Alternate telecommunications paths", "The pipes: the one family they close"],
  ];
  s.addTable([head(["Control", "What it asks for", "Satisfied by"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 5 ? HEX.teal : HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: i === 5, color: i === 5 ? HEX.teal : HEX.ink } }])],
    tableOpts([1.5, 2.75, 2.65], { y: 1.5, fontSize: 12, rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  box(s, "Governor box", 7.75, 1.5, 5.0, 3.45, HEX.redTint);
  icon(s, "FaTriangleExclamation", 8.0, 1.68, 0.6, HEX.red);
  txt(s, "Governor head", "The governor is attack surface", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.red, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Governor list", bullets([
    "BOD 26-02: end-of-support edge devices off by August 5, 2027",
    "ED 26-03, February 25, 2026: SD-WAN systems compromised; syslog to CISA via CLAW",
    "BOD 26-04: the shortest patch window is three days",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.45, paraSpaceAfter: 6 });
  callout(s, "Regression", 5.15, 1.3, "FaDoorOpen", HEX.red, "Bare local breakout is a regression: ",
    "it fixes the hairpin and loses assessed boundary protection. Buy the pipe on measured physics; take the protection controls from the governor and the security service edge above it.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (release 5.2.0); RFC 4364; CISA BOD 26-02, ED 26-03, BOD 26-04; TIC 3.0 Branch Office Use Case v3.0. Book 09, Chapters 02 and 03.");
  narrate(s,
`Chapter 02 pulls apart two decisions that programs keep merging. Choosing a pipe, whether fiber, MPLS, low earth orbit, 5G or direct internet access, is a physics decision. Choosing what governs the pipe is a compliance decision.

Direct internet access solves one problem, the geographic hairpin. It satisfies none of the protection controls: boundary protection, flow enforcement, transmission confidentiality, malware inspection and monitoring all come from the control layer. Transport closes exactly one control family, telecommunications diversity. So a branch moved from a governed hairpin to bare local breakout is a compliance regression with better latency.

And the governor is itself attack surface. BOD 26-02 targets end-of-support edge devices on the agency boundary. On February 25, 2026, Emergency Directive 26-03 ordered action on Cisco SD-WAN systems after actors were found compromising them and keeping long-term persistence. Protect the controller and every edge before they carry traffic.`,
  "Book 09, Chapter 02 — Transport Is Physics, Control Is Compliance; Chapter 03 (BOD 26-02 dates).");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What changes", "TIC 3.0 sets goals, but it isn't requirement-free");
  tag(s, "What");
  cards(s, "Policy", [
    ["FaBook", "TIC 3.0 as it reads", HEX.navy, HEX.navyTint, ["Four use cases; no SASE use case", "Catalog v3.3: goals, not methods", "Parity on every path", "Preserve CISA's visibility"]],
    ["FaFileShield", "OMB M-26-14 logging", HEX.teal, HEX.tealTint, ["Rescinded M-21-31, May 22, 2026", "Searchable 6 months, retrievable 1 year", "Addresses, ports and sessions", "First plan due November 18, 2026"]],
    ["FaCloudArrowUp", "CLAW, not MTIPS sensors", HEX.amber, HEX.amberTint, ["Sensor feed stops at local breakout", "Comprehensive Log Aggregation Warehouse", "Agency, CISA and provider onboard it", "Keep MTIPS until CISA confirms parity"]],
  ]);
  callout(s, "Obligations", 5.3, 1.2, "FaLandmark", HEX.red, "Four obligations still land on the branch: ",
    "Protective DNS for all egress DNS; BOD 23-02 for management interfaces; BOD 26-02 for end-of-support edge devices; and M-26-15 post-quantum key exchange on anything terminating TLS or IPsec.");
  sources(s, "Sources: CISA TIC 3.0 core guidance and Branch Office Use Case v3.0; CISA SASE guide (June 2026); OMB M-26-14, M-26-15, M-22-09; BOD 23-02, BOD 26-02. Book 09, Chapter 03.");
  narrate(s,
`What does federal policy actually require? Read from the documents, TIC 3.0 is descriptive, not prescriptive. There are four use cases, Traditional, Branch Office, Remote User and Cloud, and no SASE use case. The Security Capabilities Catalog, version 3.3, sets goals, not methods. Two statements constrain a branch: policy enforcement parity on every path, and preserving CISA's visibility as branches connect directly.

OMB M-26-14 rescinded M-21-31 on May 22, 2026. Logs must be searchable for six months and retrievable for a year, and must show source and destination addresses, ports and session attributes. The first agency logging plan is due November 18, 2026.

When branches leave MTIPS, the sensor telemetry CISA received stops. The replacement is CLAW, CISA's Comprehensive Log Aggregation Warehouse, and onboarding needs the agency, CISA and the provider together. Keep MTIPS until CISA confirms parity.

Technology-neutral isn't requirement-free: four binding obligations still land on branch equipment.`,
  "Book 09, Chapter 03 — What TIC 3.0 and Federal Policy Actually Require.");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What changes", "Centralize the truth; let tokens carry the trust");
  tag(s, "What");
  cards(s, "Data", [
    ["FaDatabase", "Centralize the truth", HEX.navy, HEX.navyTint, ["Logical: one writer, every copy derived", "Physical: stopped by light, blast radius and residency", "Small stores survive as caches"]],
    ["FaKey", "Tokens carry the trust", HEX.teal, HEX.tealTint, ["Inbound: check each token's tenant ID", "Outbound: a token as the database password, 5 to 60 minutes", "No long-lived secret to steal"]],
    ["FaArrowsRotate", "The weakest consistency", HEX.amber, HEX.amberTint, ["Strong in a region, async across", "Example: strong write = 2 × farthest RTT + 10 ms", "Blocked beyond 8,000 km by default"]],
  ]);
  callout(s, "Risk", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "The risk it imports: ",
    "isolation is enforced in code, so a defect in tenant resolution is a cross-tenant exposure. Keep that path small, exhaustively tested and fail-closed.");
  sources(s, "Sources: NIST SP 800-207; OMB M-22-09; Microsoft Learn — access token and claims validation, PostgreSQL Entra authentication, Cosmos DB consistency levels. Book 09, Chapter 04.");
  narrate(s,
`Chapter 04 separates two meanings of centralize. Logical centralization, one authoritative source of truth with every other copy derived, is almost always right. Physical centralization, one server in one place, stops at three walls: the speed of light, blast radius and data residency.

Token-based security removes the strongest old reason to fragment. When every request carries a verifiable identity, one store can serve many trust domains. Inbound, a multitenant service checks each Entra token's tenant ID against the tenant the data was stored under. Outbound, the service signs in to its database with a short-lived token in the password field, valid 5 to 60 minutes, so the long-lived database password disappears. The price is that isolation lives in code.

Then choose the weakest consistency each flow tolerates. Azure Cosmos DB, as one documented example, puts multi-region strong write latency at twice the farthest round trip plus 10 milliseconds, and blocks strong consistency beyond 8,000 kilometers by default.`,
  "Book 09, Chapter 04 — Logical Centralization and Token-Based Security.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What changes", "SD-WAN reaches the floor; SASE makes it lawful");
  tag(s, "What");
  const jobs = [["Lean class", "Consensus, voice, sign-in on the short path"], ["Bulk class", "Backups, patches, re-syncs on the big path"],
    ["Route inflation", "A better underlay pulls toward the floor"], ["Tail latency", "FEC, packet duplication, fast failover"],
    ["Encryption", "Tunnels across every circuit (SC-8)"], ["The floor", "Reached, never beaten"]];
  txt(s, "Jobs head", "WHAT SD-WAN DOES AT THE BRANCH EDGE", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  jobs.forEach((j, i) => {
    const y = 1.92 + i * 0.56;
    box(s, `Job ${i}`, 0.6, y, 6.2, 0.48, i === 5 ? HEX.redTint : (i % 2 ? HEX.navyTint : HEX.grey));
    txt(s, `Job ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: i === 5 ? HEX.red : HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h: 0.48, fontSize: 14, valign: "middle" });
  });
  box(s, "SASE box", 7.1, 1.55, 5.65, 3.65, HEX.tealTint);
  icon(s, "FaShieldHalved", 7.35, 1.75, 0.72, HEX.teal);
  txt(s, "SASE head", [
    { text: "WHAT SITS ABOVE IT", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "SASE closes the boundary controls", options: { bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "SASE list", bullets([
    "Web gateway, CASB, firewall and ZTNA",
    "CISA lists SD-WAN as a SASE tool; it mandates neither",
    "A distant point of presence is a hairpin",
    "FedRAMP status is per offering, not per vendor",
  ], 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
  callout(s, "Listing", 5.45, 1.05, "FaLandmark", HEX.amber, "Read the listing, not the brand: ",
    "Cisco Catalyst SD-WAN for Government is FedRAMP Certified at Class C (Moderate); Palo Alto Networks GCS-HIGH, which includes Prisma SD-WAN, at Class D (High). Examples only.");
  sources(s, "Sources: Microsoft Learn — Azure network latency, TCP/IP tuning; Cisco SD-WAN FEC and packet duplication; CISA SASE guide (June 2026); FedRAMP Marketplace. Book 09, Chapter 05.");
  narrate(s,
`SD-WAN is the governor's first layer. It splits traffic into a lean class, consensus, voice and sign-in, and a bulk class, backups, patches and re-syncs, and keeps bulk transfers from queuing ahead of latency-critical packets. It recovers route inflation: Microsoft measured a median 78 milliseconds from UK South to East US, against a fiber floor of about 62. And it tightens the tail with forward error correction, packet duplication and fast failover. It reaches the floor; it never goes below it.

SASE sits above it: secure web gateway, CASB, firewall and zero trust network access. CISA lists SD-WAN among SASE's networking tools, but mandates neither, and SD-WAN alone doesn't close the boundary, flow and malware controls.

Two cautions. The enforcement point has a location, so a distant point of presence is a hairpin with a different name. And FedRAMP status differs by offering, not by vendor, so read the Marketplace when the requirement is written.`,
  "Book 09, Chapter 05 — SD-WAN, SASE and Governed-Path Transport.");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What changes", "On re-routed paths, design around the real list");
  tag(s, "What");
  cards(s, "Legacy", [
    ["FaPlugCircleXmark", "What actually breaks", HEX.navy, HEX.navyTint, ["Idle timeouts and resets at a proxy", "Pinned certificates, mutual TLS, channel binding", "A changed source address", "MTU black holes"]],
    ["FaServer", "What needs a DC", HEX.teal, HEX.tealTint, ["Initial logon and its TGT", "Service tickets for on-premises services", "Group Policy, password change, hybrid join", "No path: Kerberos falls back to NTLM"]],
    ["FaRightLeft", "Round trips dominate", HEX.amber, HEX.amberTint, ["Better branch path: 17 to 25% less time", "30 round trips cut to 3: about ten times less", "Illustrative inputs; measure your own"]],
  ]);
  callout(s, "Egress", 5.3, 1.2, "FaRoute", HEX.navy, "Keep egress deterministic: ",
    "a stable, documented source address per branch keeps address-keyed sessions alive, and lets Conditional Access location policy and continuous access evaluation mean what they say.");
  sources(s, "Sources: RFC 9293, RFC 4120; Microsoft Learn — Kerberos registry keys, Kerberos SSP/AP, hybrid join, NTLM overview, continuous access evaluation. Book 09, Chapter 06.");
  narrate(s,
`Re-routing a branch breaks things for a short list of reasons, so design around the list. Proxies reap idle connections, TLS inspection breaks pinned certificates and channel-bound authentication, and a change in the client's apparent source address resets established connections. A path change doesn't break TCP sequence numbers. Address continuity is the property that matters.

Kerberos tolerates NAT under Windows defaults: the domain controller doesn't put client addresses in tickets or check them. And there's no five-millisecond requirement; the five is minutes of allowed clock skew. What genuinely needs a reachable domain controller is short: initial logon, service tickets for on-premises services, Group Policy, password change and hybrid join. Leave that path out and everything works except signing in, while Kerberos quietly falls back to NTLM.

Round trips dominate chatty applications. In the book's illustrative arithmetic, a better branch path saves 17 to 25 percent; cutting 30 sequential round trips to three saves about an order of magnitude.`,
  "Book 09, Chapter 06 — Legacy Protocols on Re-Routed Paths.");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What changes", "802.1X proves the device; NPS is the last AD tie");
  tag(s, "What");
  const rows = [
    ["Production", "Valid certificate, Intune compliant", "Agency resources, by ACL"],
    ["Remediation", "Valid certificate, noncompliant", "Update and Intune endpoints only"],
    ["Quarantine", "No valid certificate", "Captive portal only"],
    ["Guest", "MAC bypass, unmanaged", "Internet only"],
    ["IoT and OT", "MAC bypass, approved class", "Its management systems only"],
  ];
  s.addTable([head(["Segment", "Condition", "Network access"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 2 ? HEX.red : HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([1.6, 2.75, 2.65], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.55, 0.55, 0.55, 0.55, 0.55] }));
  box(s, "NPS box", 7.9, 1.5, 4.85, 3.55, HEX.navyTint);
  icon(s, "FaPlugCircleXmark", 8.15, 1.68, 0.6, HEX.navy);
  txt(s, "NPS head", "Why NPS can't follow Entra", { x: 8.9, y: 1.68, w: 3.75, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "NPS list", bullets([
    "There is no Entra RADIUS product",
    "NPS has no posture engine; NAP left in 2012 R2",
    "Entra joined devices have no AD computer object",
    "Posture comes from Intune's compliance service",
  ], 13.5), { x: 8.15, y: 2.42, w: 4.45, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "EAP-TLS", 5.25, 1.25, "FaFingerprint", HEX.teal, "EAP-TLS for every managed device: ",
    "Credential Guard already blocks PEAP-MSCHAPv2 single sign-on. After Blast-RADIUS, require Message-Authenticator everywhere and prefer RADIUS over TLS.");
  sources(s, "Sources: IEEE 802.1X-2020; RFC 9190, RFC 3579; Microsoft Learn — NPS overview, Entra join planning, Intune NAC integration, Credential Guard; KB5040268. Book 09, Chapter 07.");
  narrate(s,
`Every token in this book assumes the device on the wire is the device it claims to be. 802.1X turns that assumption into a proof at the switch port. Use EAP-TLS, mutual certificate authentication, for every managed device. Password methods are failing on their own: Credential Guard blocks PEAP-MSCHAPv2 single sign-on, and the October 2026 Windows update restricts NTLMv1-derived credentials too.

The RADIUS server is usually the last piece of the network standing on Active Directory. Windows NPS authorizes against AD computer objects, and Entra joined devices don't support that. There's no Entra RADIUS product; the NPS extension adds MFA, but NPS still authenticates against AD. And NPS has no posture engine: Network Access Protection was deprecated back in Windows Server 2012 R2.

So posture comes from Intune's compliance retrieval service, read by a NAC platform, and each device lands in production, remediation, quarantine, guest or IoT. After the Blast-RADIUS attack, require Message-Authenticator everywhere.`,
  "Book 09, Chapter 07 — Network Access Control: 802.1X and RADIUS.");
}

// ------------------------------------------------------------------ What 6
{
  const s = D.content("What changes", "One rule, four branch patterns, five decisions");
  tag(s, "What");
  const pats = [
    ["A · Hairpin", "Assessed; every flow pays the detour", HEX.amber, HEX.amberTint],
    ["B · Bare breakout", "A regression; not a TIC option", HEX.red, HEX.redTint],
    ["C · Governed breakout", "Edge plus nearby SASE: the reference", HEX.teal, HEX.tealTint],
    ["D · Agent SASE", "Small and roaming sites, if the PoP is close", HEX.navy, HEX.navyTint],
  ];
  pats.forEach((p, i) => {
    const x = 0.6 + i * 3.075;
    box(s, `Pattern ${i + 1}`, x, 1.5, 2.95, 1.0, p[3]);
    txt(s, `Pattern ${i + 1} text`, [{ text: p[0], options: { bold: true, color: p[2], fontSize: 15, breakLine: true } }, { text: p[1], options: { fontSize: 13 } }],
      { x: x + 0.15, y: 1.55, w: 2.7, h: 0.9, valign: "middle" });
  });
  const dec = [
    ["One writer, one region", "Cross-region copies asynchronous"],
    ["Write the path policy", "SC-7(4) already asks for it"],
    ["Boundary change first", "Decided before cutover"],
    ["Protect the governor", "Before it carries traffic"],
    ["Make the path evidence", "Telemetry to the SIEM and CLAW"],
  ];
  dec.forEach((d, i) => {
    const x = 0.6 + i * 2.4625;
    box(s, `Decision ${i + 1}`, x, 2.7, 2.3, 2.3, HEX.grey);
    txt(s, `Decision ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 24, fontFace: "Cambria", breakLine: true } },
      { text: d[0], options: { bold: true, color: HEX.navy, fontSize: 15, breakLine: true } },
      { text: d[1], options: { fontSize: 13 } },
    ], { x: x + 0.15, y: 2.8, w: 2.0, h: 2.1, paraSpaceAfter: 4 });
  });
  callout(s, "Rule", 5.2, 1.25, "FaSitemap", HEX.navy, "Align consistency class with transport class: ",
    "only authoritative writes and in-region quorum ride the lean path, and neither crosses a region synchronously. Everything that spans distance is asynchronous on the bulk path.");
  sources(s, "Sources: CISA SASE guide (June 2026); TIC 3.0 Branch Office Use Case v3.0; NIST SP 800-53 SC-7(4); Microsoft Learn — PostgreSQL business continuity, read replicas. Book 09, Chapter 08.");
  narrate(s,
`Chapter 08 puts the pieces together with one rule: align each flow's consistency class with its transport class. Only authoritative writes and in-region quorum ride the lean path, and neither crosses a region synchronously.

At the branch, four patterns cover practice. A, the hairpin: assessed, but every flow pays the detour. B, bare local breakout: not an option in the TIC use case at all. C, governed local breakout, an SD-WAN edge plus a nearby SASE point of presence: the reference pattern. D, agent-delivered SASE, for small and roaming sites, if the point of presence is close and agentless devices are covered.

Five decisions carry most of the risk: one writer per region; a written path policy, which SC-7(4) already asks for; the boundary change before cutover; the governor protected before it carries traffic; and the path made evidence. Each fails quietly, so each comes with a check.`,
  "Book 09, Chapter 08 — Reference Architecture: Consistency Classes Meet Network Classes.");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who decides, who does the work for the network");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Sponsor and CIO", "Platforms, wave order, NPS retirement"], ["Authorizing official", "Boundary change; every exception"], ["CISO and ISSO", "Control requirements; telemetry parity"]]],
    ["FaClipboardCheck", "Decide at a gate", HEX.teal, HEX.tealTint, [["System owner", "Per site: governor live before traffic"], ["Security architecture", "TIC conformance; refresh attributes"], ["Contracting officer", "EIS orders; ends circuits"]]],
    ["FaUsersGear", "Do the work", HEX.amber, HEX.amberTint, [["Network engineering", "Transport, SD-WAN, switching, NAC"], ["Security operations", "Telemetry per branch; NAC alerts"], ["Facilities, app owners", "Closets, diversity; chattiness"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Gates head", "THREE GATES, AND WHO SAYS EACH ONE HAS PASSED", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const gates = [
    ["Governor before traffic", "the system owner, site by site; no live, logging control layer, no new egress", HEX.teal],
    ["Boundary before cutover", "the authorizing official, before the first production cutover, not after", HEX.navy],
    ["Circuit ends after parity", "the CISO decides, security operations confirms, the contracting officer terminates", HEX.red],
  ];
  gates.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Gate ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Gate ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; SP 800-53 SC-7(4) and CP-8; FAR 1.602-1; GSA EIS; CISA SASE guide (June 2026). Book 09, Chapter 09.");
  narrate(s,
`Who owns it? The most expensive mistakes in this book are ownership gaps: a circuit bought before anyone owned the governor, a cutover before anyone filed the boundary change, a telemetry contract cancelled before its replacement was confirmed. So the rule is one decider per row.

The sponsor and CIO decide the governor platforms and the order of branch waves. The authorizing official decides the boundary change, the SC-7(4) exception and every standing exception. The CISO sets the control requirements and owns confirming CISA telemetry parity.

The system owner decides, site by site, whether the governor is live and logging before traffic moves. Security architecture decides TIC conformance and writes target attributes into every refresh. And under the Federal Acquisition Regulation only a contracting officer can enter into or terminate a contract, so no engineer can cancel a circuit.

Network engineering and security operations do the work.`,
  "Book 09, Chapter 09 — Who Owns the Network and Its Transport.");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "The long interim: the refresh is the fork");
  tag(s, "How");
  const alts = [["Legacy vehicles", "All ended by May 31, 2026"], ["Hairpin", "Permitted; CISA says it raised cloud cost"],
    ["New access point", "Capital, floor space, round-the-clock staff"], ["VPN backhaul", "A hairpin under another name"],
    ["ExpressRoute for M365", "No longer recommended by Microsoft"]];
  txt(s, "Alts head", "WHY EACH ALTERNATIVE HAS CLOSED", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  alts.forEach((p, i) => {
    const y = 1.92 + i * 0.66;
    box(s, `Alt ${i}`, 0.6, y, 6.2, 0.56, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Alt ${i} text`, [{ text: `${p[0]}   `, options: { bold: true, color: HEX.navy } }, { text: p[1] }],
      { x: 0.8, y, w: 5.9, h: 0.56, fontSize: 14, valign: "middle" });
  });
  box(s, "Fork box", 7.1, 1.55, 5.65, 3.65, HEX.amberTint);
  icon(s, "FaCodeBranch", 7.35, 1.75, 0.72, HEX.amber);
  txt(s, "Fork head", [
    { text: "BOD 26-02: OFF BY AUGUST 5, 2027", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Write the target into the refresh", options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "Fork list", bullets([
    "Application-aware steering, path measurement",
    "Deterministic egress; exportable telemetry",
    "PQC-capable key exchange (M-26-15)",
    "Management plane that meets BOD 23-02",
  ], 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
  callout(s, "Interim", 5.45, 1.05, "FaListCheck", HEX.navy, "Ten actions need no award: ",
    "write the path policy, measure a sample of branches, fix egress, register cleartext protocols, verify the DNS path, and record the gap as an accepted risk.");
  sources(s, "Sources: GSA EIS transition report; OMB M-19-26, M-26-14, M-26-15; CISA TIC Program Guidebook, BOD 23-02, BOD 26-02, BOD 26-04; Microsoft Learn — ExpressRoute for Microsoft 365. Book 09, Chapter 10.");
  narrate(s,
`How do you get there when the target is years away? Make the case by elimination. The legacy telecom contracts had all ended by May 31, 2026. The hairpin is still permitted, but CISA's own guidebook says it raised the cost of using cloud services. A new access point is a capital commitment, VPN backhaul is a hairpin, and Microsoft no longer recommends ExpressRoute for Microsoft 365. What's left is local breakout, a cloud security stack and a branch-edge policy layer.

Meanwhile three deadlines compete for the same staff: the M-26-14 logging plan, the M-26-15 post-quantum plan and BOD 26-04.

BOD 26-02 is the fork. End-of-support edge devices must be off agency networks by about August 5, 2027, so a refresh happens anyway. Tell whoever scopes it, in writing, what the target needs. Like-for-like spends the same money and closes the question for the life of the equipment.`,
  "Book 09, Chapter 10 — The Long Interim.");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Field offices: fix the circuit, not the content");
  tag(s, "How");
  const rows = [
    ["Clients per distribution point", "4,000, Microsoft's published limit"],
    ["Distribution points needed", "24: two at each of 12 hubs"],
    ["Capacity at 70,000 endpoints", "96,000 clients, 73% used"],
    ["Refresh proposal", "About $50M, one per office"],
    ["Network program, Year 1 capital", "About $10.0M"],
    ["Breakeven current MPLS cost", "$873 per office per month"],
  ];
  s.addTable([head(["Worked case, about 1,500 offices", "Value"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: i >= 4, color: i === 5 ? HEX.red : HEX.ink } }])],
    tableOpts([3.5, 3.3], { y: 1.5, fontSize: 13, rowH: [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  box(s, "Transport box", 7.75, 1.5, 5.0, 3.5, HEX.tealTint);
  icon(s, "FaRoute", 8.0, 1.68, 0.6, HEX.teal);
  txt(s, "Transport head", "Solve it at the transport layer", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Transport list", bullets([
    "Internet access sized to seats, plus 5G for continuity",
    "SD-WAN overlay; breakout at 12 hubs first",
    "Waves keyed to MPLS renewal dates",
    "Peer caching keeps one WAN copy per site",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.5, paraSpaceAfter: 6 });
  callout(s, "Gates", 5.2, 1.3, "FaClipboardCheck", HEX.red, "Gates, not dates: ",
    "no office's MPLS is retired until its replacement telemetry is confirmed, and the last distribution point retires only when five content gates close. Every cost is a planning assumption to replace.");
  sources(s, "Sources: Microsoft Learn — Configuration Manager size and scale, peer cache, Connected Cache, co-management workloads; Cisco Catalyst 8000 data sheets and licensing. Book 09, Chapter 11.");
  narrate(s,
`Chapter 11 is a worked case: a large field-office estate, about 1,500 offices and 70,000 endpoints, asked to fund a 50-million-dollar refresh of a Configuration Manager distribution point in every office.

Microsoft's published limit is 4,000 clients per distribution point. On capacity, the estate needs 24, two at each of 12 hubs, for 96,000 clients. The other 1,476 exist only to compensate for slow branch circuits. So fix the circuit: dedicated internet access sized to seats, a 5G continuity path, and an SD-WAN overlay.

On the book's planning assumptions, the network program needs about 10 million dollars of first-year capital and reaches a positive cumulative position in year four. But the financial case turns on one number. Breakeven is 873 dollars of current MPLS cost per office per month; below that, argue capability, not savings.

And no office's MPLS is retired until its replacement telemetry is confirmed.`,
  "Book 09, Chapter 11 — Field Office WAN Transformation.");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "Microsoft 365 Optimize: a signed SC-7(4) exception");
  tag(s, "How");
  const rows = [
    ["1", "Exchange Online", "Names and IP ranges"],
    ["31", "SharePoint and OneDrive", "Names and IP ranges"],
    ["11", "Teams media, UDP 3478–3481", "IP prefix only; no names"],
  ];
  s.addTable([head(["Set", "Optimize service", "Steer by"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: HEX.navy } }, { text: r[2], options: { bold: i === 2, color: i === 2 ? HEX.red : HEX.ink } }])],
    tableOpts([0.8, 3.2, 2.9], { y: 1.5, fontSize: 13, rowH: [0.42, 0.5, 0.5, 0.5] }));
  box(s, "Controls box", 0.6, 3.6, 6.9, 1.45, HEX.redTint);
  txt(s, "Controls text", [
    { text: "What the bypass punctures, named", options: { bold: true, color: HEX.red, fontSize: 15, breakLine: true } },
    { text: "SI-3, SI-4(10) where selected, AC-4 and AU-3. SC-8 is not a gap: the flows carry TLS or SRTP.", options: { fontSize: 14 } },
  ], { x: 0.8, y: 3.65, w: 6.5, h: 1.35, valign: "middle" });
  box(s, "Instruments box", 7.75, 1.5, 5.0, 3.55, HEX.navyTint);
  icon(s, "FaScaleBalanced", 8.0, 1.68, 0.6, HEX.navy);
  txt(s, "Instruments head", "Three instruments, three signers", { x: 8.75, y: 1.68, w: 3.9, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Instruments list", bullets([
    "Exception memo: the authorizing official",
    "Site register: the system owner",
    "Architecture review: the review board",
    "Precondition: tenant restrictions v2 from the device",
  ], 13.5), { x: 8.0, y: 2.42, w: 4.6, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "SC-7(4)", 5.25, 1.25, "FaListCheck", HEX.amber, "SC-7(4)(d) and (e): ",
    "each exception is documented with its mission need and duration, reviewed on a stated cadence and removed when the need lapses. Informed network routing isn't available to GCC Moderate tenants.");
  sources(s, "Sources: Microsoft Learn — Microsoft 365 URLs and IP ranges, connectivity principles, tenant restrictions v2, informed network routing; NIST SP 800-53 SC-7(4). Book 09, Chapter 12; Appendix A.");
  narrate(s,
`Microsoft says to send its Optimize traffic straight to Microsoft, without TLS inspection. The boundary says inspect everything. Both positions hold up, so the gap is a decision someone signs.

Optimize is small: three endpoint sets, for Exchange Online, SharePoint and OneDrive, and Teams media, which has no names and must be steered by IP prefix. Exempting only Optimize is narrower than Microsoft asks, and it leaves sign-in on the inspected path.

Name what the bypass punctures: SI-3, SI-4(10) where it's selected, AC-4 and AU-3. SC-8 is not a gap. The vehicle is SC-7(4): each exception documented with its mission need and duration, and reviewed.

The assessor's attack is tenant-to-tenant exfiltration. Only Windows device-side tenant restrictions v2 reaches the SharePoint and Exchange data plane, so it's a precondition to cutover. Three instruments carry the decision: the authorizing official's memo, the system owner's site register and the architecture review board's determination.`,
  "Book 09, Chapter 12 — Microsoft 365 Traffic and the Optimize Inspection Exemption; Appendix A.");
}

// ------------------------------------------------------------------ How 4
{
  const s = D.content("How to do it", "Governor before traffic, boundary before cutover");
  tag(s, "How");
  const steps = ["Secure the governor", "Buy the pipe on measured physics", "Governor live before traffic", "Boundary change before cutover", "Microsoft 365 by its own exception", "Evidence; CISA parity first"];
  steps.forEach((f, i) => {
    const x = 0.6 + i * 2.045;
    box(s, `Step ${i}`, x, 1.5, 1.92, 1.35, i === 0 ? HEX.redTint : (i === 2 || i === 3 ? HEX.navyTint : HEX.grey));
    txt(s, `Step ${i} text`, [
      { text: `${i}`, options: { bold: true, color: HEX.amber, fontSize: 20, fontFace: "Cambria", breakLine: true } },
      { text: f, options: { bold: true, color: HEX.navy, fontSize: 13 } },
    ], { x: x + 0.12, y: 1.55, w: 1.7, h: 1.25, valign: "middle" });
  });
  const panels = [
    ["FaArrowsRotate", "Phase inversion", HEX.red, HEX.redTint, ["Cloud migrates before transport is measured", "Slowness is blamed on the cloud", "Remedies raise cloud spend", "The book's inference, labeled as one"]],
    ["FaChartLine", "Confirm it in your estate", HEX.teal, HEX.tealTint, ["Two comparable branches, 30 days", "Change one; 30 more days", "Difference in differences: the effect", "Agency-specific and defensible"]],
  ];
  panels.forEach((p, i) => {
    const x = 0.6 + i * 6.15;
    box(s, `Panel ${i + 1}`, x, 3.05, 6.0, 2.0, p[3]);
    icon(s, p[0], x + 0.2, 3.13, 0.56, p[2]);
    txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.13, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Panel text ${i + 1}`, bullets(p[4], 13), { x: x + 0.25, y: 3.75, w: 5.6, h: 1.27, paraSpaceAfter: 2 });
  });
  callout(s, "Stop", 5.25, 1.25, "FaTriangleExclamation", HEX.amber, "An engineering dependency, not a mandate: ",
    "no memo sets this order, which is why it survives review. Price your own circuits, and put only measured figures, with their method, in the business case.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, SP 800-53 SC-7(4); GAO-19-58, GAO-22-106195, GAO-26-107530; CISA TIC Program Guidebook; GSA EIS Public Pricer. Book 09, Chapter 13.");
  narrate(s,
`Order decides whether modernization is a gain or a regression. Step zero: bring the governor under vulnerability management, privileged access and logging. Then buy the pipe on measured physics, deploy the governor before production traffic, decide the boundary change before the first cutover, handle Microsoft 365 through its own exception, and register the evidence, confirming CISA telemetry parity before any legacy circuit ends. No memo mandates that order; it's an engineering dependency.

Phase inversion is what happens when cloud migration runs ahead of transport. With no transport metrics, slowness is attributed to the cloud, the remedies raise cloud spend, and the cause never enters the data. The book labels that an inference built on documented parts, and names better-evidenced competitors.

So measure in your own estate. A paired-branch study, two comparable branches instrumented for 30 days before and after a change at one, gives an effect size a budget examiner will accept.`,
  "Book 09, Chapter 13 — Sequencing, Cost and Evidence.");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaListCheck", "Adopt the sequence", "Governor before traffic; boundary before cutover; parity before circuits end", HEX.navy, HEX.navyTint],
    ["FaCodeBranch", "Specify the BOD 26-02 refresh", "Target attributes in writing, before August 5, 2027", HEX.teal, HEX.tealTint],
    ["FaScaleBalanced", "Decide the Optimize exception", "Memo, register and review; device-side tenant restrictions first", HEX.amber, HEX.amberTint],
    ["FaUserCheck", "Name one decider per row", "From the authorizing official to the contracting officer", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Next step, no award needed: ",
    "write the application-to-path policy that SC-7(4) already asks for, and instrument a sample of branches before the next migration wave; that baseline can't be rebuilt afterward.");
  sources(s, "Sources: NIST SP 800-53 SC-7(4); CISA BOD 26-02; Microsoft Learn — tenant restrictions v2; FAR 1.602-1. Book 09, Chapters 02, 09, 10, 12 and 13.");
  narrate(s,
`So, four decisions.

Adopt the sequence as policy: the governor secured and live before traffic, the boundary change decided before cutover, and CISA telemetry parity confirmed before any MTIPS or MPLS circuit ends.

Put the target attributes in writing for every BOD 26-02 replacement, before the August 2027 deadline spends the money like for like.

Decide the Microsoft 365 Optimize exception with tenant restrictions v2 from the device as a precondition.

And name one decider per row, from the authorizing official to the contracting officer.

The next step needs no award: write the application-to-path policy that SC-7(4) already asks for, and instrument a sample of branches before the next migration wave, because that baseline can't be rebuilt afterward.

Buy transport on physics and govern it as compliance, and the branch gets faster without getting weaker. Book 09 has the detail, every claim footnoted. Thank you.`,
  "Book 09, Chapters 02, 09, 10, 12 and 13; Appendices A and B.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "ITU-T G.114 (one-way transmission time).  ·  NIST CODATA.  ·  Bozkurt et al., PAM 2017.  ·  Raft; Spanner; CRDTs (Shapiro et al.).  ·  ITU-R M.2410.  ·  RFC 4364, 4120, 9293, 9190, 3579, 5176.",
    "CISA: TIC 3.0 core guidance (Catalog v3.3), Branch Office Use Case v3.0, Program Guidebook; SASE in a Modern TIC 3.0 Solution (June 2026); Encrypted DNS guidance; Logging Reference Architecture.",
    "CISA directives: BOD 23-02, BOD 26-02, BOD 26-04; ED 26-03.  ·  OMB M-19-26, M-22-09, M-26-14 (rescinds M-21-31), M-26-15; EO 14412.",
    "NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; SP 800-37 Rev. 2; SP 800-207; SP 800-63B-4; FIPS 140-3 transition.  ·  IEEE 802.1X-2020.  ·  FAR 1.602-1.",
    "Microsoft Learn: Microsoft 365 connectivity principles, URLs and IP ranges, informed network routing, ExpressRoute for Microsoft 365; tenant restrictions v2; continuous access evaluation.",
    "Microsoft Learn: Kerberos and NTLM; hybrid join; NPS; Intune NAC integration; Credential Guard; Configuration Manager size and scale; PostgreSQL Entra authentication; Cosmos DB consistency.",
    "FedRAMP Marketplace dataset and 2026 Consolidated Rules.  ·  GSA EIS and EIS Public Pricer.  ·  GAO-19-58, GAO-22-106195, GAO-26-107530, GAO-26-107919.  ·  Cisco SD-WAN and Catalyst 8000 documentation.",
    "Full footnotes with links and access dates: Book 09, every chapter (whalermike.github.io/modernization-workbook/docs/books/b09-network/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
