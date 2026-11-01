// Cloud DNS on AWS, Azure and Oracle Cloud, PART 2: BIND AND THE FEDERAL FIT. A ~16-minute narrated evaluation deck.
//   Why:  1 Title · 2 BIND in AWS: aligned, or a new silo? · 3 When to run your own DNS servers
//   What: 4 vNIOS or BIND, and which BIND · 5 Three roles · 6 Placement and HA · 7 Forwarding to and from the native resolver
//         8 Illustrative forwarder configuration · 9 DNSSEC · 10 RPZ and CISA Protective DNS · 11 Logging · 12 Patching and baselines
//   Who:  13 Who owns the configuration: Git and Ansible
//   How:  14 The alignment checklist · 15–16 Federal mapping · 17 Where Infoblox fits, and what to confirm
//   Backup (not narrated): labels and open points, three source lists.
// Every fact comes from docs/evaluations/cloud-dns-resolvers-infoblox-bind.md (Parts 2–5, "The answer in brief", and their
// footnoted sources, checked Oct 29 and Oct 31, 2026, with the claims log in docs/evaluations/_verification/) or from the
// workbook pages it links (Book 08, Book 12, the Ansible guide, the NIOS implementation guide, the Trinzic explainer).
// The deck adds no external facts and keeps the page's labels: (design guidance), (inference) and "confirm".
// Helpers: ../research-cloud-dns-part-1/helpers.js (the Trinzic explainer's helpers, plus say(), code() and finish()).
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Cloud_DNS_Part_2.pptx   (FIT=1 prints bottoms)
// The build also writes narration.json (one {slide, title, say} per narrated slide) from the same text as the notes.
const H = require("../research-cloud-dns-part-1/helpers.js")({
  book: "Cloud DNS on AWS, Azure and Oracle Cloud",
  title: "Part 2: BIND and the Federal Fit",
  footer: "Cloud DNS on AWS, Azure and Oracle Cloud  ·  Part 2: BIND and the federal fit  ·  Research — in review",
  dir: __dirname,
});
const { HEX, txt, tag, callout, say, sources, T, table, panel, node, line, code, content, titleSlide, backup, srcSlide, finish } = H;
const OUT = process.argv[2] || "Research_Cloud_DNS_Part_2.pptx";
const EV = "Evaluation, Cloud DNS on AWS, Azure and Oracle Cloud";

// ================================================================== 1 Title
{
  const s = titleSlide("Why", "Cloud DNS, Part 2: BIND and the Federal Fit", "Running BIND in the clouds  ·  Research — in review");
  txt(s, "Session map", [
    { text: "ABOUT 16 MINUTES  ·  FOR FEDRAMP MODERATE CIVILIAN AGENCIES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "When to run your own DNS servers  ·  vNIOS or BIND", options: { color: HEX.ink, breakLine: true } },
    { text: "BIND roles, forwarding, DNSSEC, response policy zones, logging, patching, Git", options: { color: HEX.ink, breakLine: true } },
    { text: "The seven-question alignment checklist  ·  The federal mapping", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.8, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Evaluation, Cloud DNS on AWS, Azure and Oracle Cloud (in review), Parts 2–5; ISC, NIST, CISA, OMB, AWS, Microsoft Learn, Oracle. Checked Oct. 29 and 31, 2026.", 6.08);
  say(s,
`Welcome to Part 2 of Cloud DNS on AWS, Azure and Oracle Cloud, a Federal Modernization Workbook evaluation that's still under review. Part 1 covered the native resolvers. Part 2 asks when an agency should run its own DNS servers in a cloud, and how to run BIND there so it stays inside Book 08's single policy plane.

We'll start with the test that matters: does a cloud BIND server align with that plane, or create a silo? Then the criteria, vNIOS or BIND, and BIND itself, from roles to patching and Git. Then a seven-question checklist for an agency adding BIND servers in AWS, and the federal mapping.

The labels carry over from Part 1: design guidance, inference, and confirm.`,
  "Evaluation page, \"The answer in brief\" and \"What it covers\".",
  `${EV}, "The answer in brief" and "What it covers".`);
}

// ================================================================== 2 Aligned or silo
{
  const s = content("Why", "BIND in AWS: aligned, or a new silo?");
  tag(s, "Why");
  line(s, "Lead", "Additional BIND servers in AWS align with Book 08 when they are forwarders or resolvers under central configuration, logged to the SOC, owned and with a reason.", 1.45, 0.62, 14);
  table(s, "Align", 2.2, [6.05, 6.1], ["BIND in AWS aligns when it is…", "BIND in AWS creates a silo when it…"], [
    ["A resolver or forwarder configured from the policy plane: cloud names to Route 53 Resolver inbound endpoints, on-premises names back through outbound rules, its addresses in IPAM, its queries logged to the SOC",
     { text: "Hosts zones authored separately from the DDI platform: a new source of truth and a new split-brain", options: { color: HEX.red } }],
    ["A deliberate bridge with an owner and an end date, for example during AD DNS retirement, or for a need the Route 53 Resolver can't meet",
     { text: "Is edited by hand: no baseline, no change record, drift", options: { color: HEX.red } }],
    ["Configured from Git and applied by automation: the repository is the CM-2 baseline, the pull request the CM-3 change record",
     { text: "Skips the shared policy (Protective DNS, DNSSEC validation, query logging), so resolution in AWS is less protected than on premises", options: { color: HEX.red } }],
    ["Hardened, patched, inventoried and owned like any other DNS server",
     { text: "Duplicates the Route 53 Resolver with no stated reason: more servers to harden and patch (CM-6, SI-2) for nothing", options: { color: HEX.red } }],
  ], { fontSize: 12, firstColor: HEX.teal });
  sources(s, "Sources: Evaluation page, \"The answer in brief\" (alignment table); Book 08, Ch 08 (Decision 3); Ansible guide, Evidence to the program.");
  say(s,
`Additional BIND servers in AWS align with Book 08 when they are forwarders or resolvers under central configuration, logged to the SOC, owned and with a reason.

BIND aligns when it's a resolver or forwarder whose configuration comes from the policy plane: its forwarding, its addresses and its logging all governed. It aligns as a deliberate bridge, with an owner and an end date. It aligns when Git configures it, and when it's hardened and inventoried.

It creates a silo when it hosts zones authored apart from the DDI platform, when it's edited by hand, when it skips the shared Protective DNS, validation and logging, or when it duplicates the Route 53 Resolver for no stated reason.`,
  "Evaluation page, \"The answer in brief\" (BIND in AWS aligns / creates a silo); Book 08, Chapter 08, Decision 3; Ansible guide, Evidence to the program.",
  `${EV}, "The answer in brief"; Book 08, Chapter 08 — Reference Architecture.`);
}

// ================================================================== 3 When to run your own
{
  const s = content("Why", "When to run your own DNS servers in a cloud");
  tag(s, "Why");
  T(s, "Guidance", [
    { text: "Microsoft: ", options: { bold: true, color: HEX.navy } },
    { text: "\"Use DNS Private Resolver instead of custom DNS server software like BIND when possible\"; VM-hosted DNS is needed for an NS-delegated subdomain.  ", options: {} },
    { text: "AWS: ", options: { bold: true, color: HEX.amber } },
    { text: "current guidance steers hybrid DNS to Resolver endpoints and rules; the older whitepaper on EC2 resolvers is for historical reference only." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.66, fontSize: 12 });
  table(s, "When", 2.2, [6.45, 5.7], ["Run your own (vNIOS or BIND) when… (design guidance)", "Stay with the native resolver when…"], [
    ["A zone must be authoritative in the cloud and reached by NS delegation, and AWS's delegation features don't fit or aren't available in the Region", "The need is forwarding in and out; the endpoints do that, managed and zone-redundant"],
    ["The agency's response policy zones, or its encrypted-DNS logging at the agency resolver (M-22-09), must apply exactly as on premises, and the native filter can't carry them, or (Oracle) there is none", "The cloud's own filter plus forwarding \".\" to the agency resolvers gives the same policy; on Oracle, a catch-all rule to agency resolvers"],
    ["Workloads need DoT or DoH inside the cloud and the native protocols don't fit (AWS outbound: Do53 or DoH; Azure ruleset targets: plain DNS)", "Clients use Do53 to the VPC or VNet resolver, and encryption starts at the agency resolver"],
    ["A migration bridge, such as AD DNS retirement or a datacenter exit, with an end date", "The bridge has no end date, or no one owns its removal"],
    ["Load would exceed per-instance quotas (1,024 packets per second per ENI on AWS; 1,000 queries per second per VM on Azure), and a caching tier helps", "Volume fits the endpoint quotas (10,000 queries per second per endpoint address)"],
  ], { fontSize: 11 });
  sources(s, "Sources: Microsoft Learn, hybrid DNS design; AWS Resolving queries between VPCs and your network; AWS whitepaper (2022); VPC User Guide; Azure limits (Oct. 29, 2026).");
  say(s,
`When should an agency run its own DNS servers in a cloud at all? Microsoft's guidance is direct: use DNS Private Resolver instead of custom DNS server software like BIND when possible. AWS steers hybrid DNS to Resolver endpoints too.

So the criteria, as design guidance. Run your own when a zone must be authoritative in the cloud and reached by delegation. When the agency's response policy zones, or its encrypted-DNS logging at the agency resolver, must apply exactly as on premises and the native filter can't carry them, or, as on Oracle, there isn't one. When workloads need encrypted DNS the native endpoints don't offer. For a migration bridge with an end date. Or when load would exceed the per-instance quotas. Otherwise, stay with the native resolver.`,
  "Microsoft Learn, Azure Architecture Center, Design a hybrid DNS solution by using Azure; AWS Resolving DNS queries between VPCs and your network; AWS whitepaper, Hybrid Cloud DNS Options for Amazon VPC (2022, historical); AWS VPC User Guide, Understanding Amazon DNS; Azure subscription and service limits.",
  `${EV}, Part 2, "When to run your own DNS servers in the cloud".`);
}

// ================================================================== 4 vNIOS or BIND, and which BIND
{
  const s = content("What", "vNIOS or BIND, and which BIND to run");
  tag(s, "What");
  panel(s, "Choice", 0.6, 1.5, 6.0, 5.0, HEX.navy, HEX.navyTint, "vNIOS OR BIND", null, [
    "vNIOS where the agency's DNS runs on an Infoblox Grid: it joins the same Grid, takes zones, response policy zones and DNSSEC from the Grid Master, in the same console (option A in the Trinzic explainer)",
    "Infoblox's cloud HA documentation lists only commercial endpoints, so vNIOS failover in GovCloud and Azure Government is a point to confirm (NIOS guide)",
    "BIND where there is no Grid, a vNIOS license or member isn't justified for a small footprint, or a tool expects BIND itself",
    "BIND has no policy plane of its own: for Book 08 its policy comes from the DDI platform and Git",
  ], 12);
  panel(s, "Version", 6.75, 1.5, 6.0, 5.0, HEX.teal, HEX.tealTint, "WHICH BIND (AS OF OCT. 29, 2026)", null, [
    "ISC supports each even-numbered BIND 9 branch for four years",
    "9.20 (9.20.30, October 2026) is the supported production branch: current stable and Extended Support, end of life in Q2 2028",
    "9.18 reached end of life in June 2026; odd-numbered branches (9.21) are development",
    "ISC's vulnerability policy covers only the most recent monthly releases of supported branches",
    "OS packages follow their vendor (Ubuntu 24.04 carries 9.18.39): decide which you rely on, and record it (design guidance)",
  ], 12);
  sources(s, "Sources: Evaluation page, Part 2 (vNIOS or BIND); NIOS implementation guide; Trinzic explainer; ISC support policy, Download and disclosure policy (Oct. 29, 2026).");
  say(s,
`If the agency does run its own servers, which ones? Where its DNS runs on an Infoblox Grid, vNIOS is the natural choice. It joins the same Grid and takes its policy from the Grid Master. One caution: vNIOS failover in GovCloud and Azure Government is a point to confirm.

BIND is the choice when there's no Grid, for a small footprint, or when a tool expects BIND itself. BIND has no policy plane of its own; for Book 08, its policy comes from the DDI platform and Git.

Which BIND? ISC supports each even-numbered branch for four years. As of October twenty-ninth, 9.20 is the supported production branch, with end of life in 2028, and 9.18 reached end of life in June 2026. Operating-system packages follow their vendor, so record which support you rely on.`,
  "Evaluation page, Part 2 (vNIOS or BIND) and Part 3 (Version and support); Infoblox NIOS implementation guide; Trinzic explainer; ISC Software Support Policy; ISC Download; ISC Vulnerability Disclosure Policy. Accessed Oct. 29, 2026.",
  `${EV}, Part 2 and Part 3, "Version and support"; Infoblox NIOS implementation guide.`);
}

// ================================================================== 5 Three roles
{
  const s = content("What", "Three roles, kept apart");
  tag(s, "What");
  T(s, "Keep apart", [
    { text: "NIST SP 800-81r3: ", options: { bold: true, color: HEX.navy } },
    { text: "DNS hosts \"should be dedicated to that task and hardened\"; recursion off on authoritative servers; an internet-facing instance \"should not be configured to serve in both roles\" (combining is acceptable on internal-only servers).  " },
    { text: "ISC: ", options: { bold: true, color: HEX.navy } },
    { text: "\"Do not combine authoritative and recursive nameserver functions.\"" },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.92, fontSize: 12.5 });
  table(s, "Roles", 2.5, [2.9, 4.9, 4.35], ["Role", "When it fits in a cloud", "Book 08 condition (design guidance)"], [
    ["Forwarder (no zones; forwards by domain)", "The common case: a cloud-side hop that applies agency policy and logging, then forwards cloud names to the native resolver and everything else to the agency resolvers or Protective DNS", "Its forward zones are the Decision 3 rules, generated from the policy plane"],
    ["Recursive resolver (caches, validates, applies response policy zones)", "Where agency policy and logging must apply at the first hop in the cloud", "Same response policy zones, validation and logging as on premises"],
    ["Authoritative (hosts zones)", "Only for an NS-delegated zone the native services can't answer, or a secondary of a zone mastered on the DDI platform", { text: "A secondary, never a separately authored primary; the zone's one writable owner stays on the DDI platform", options: { color: HEX.red, bold: true } }],
  ], { fontSize: 12 });
  sources(s, "Sources: NIST SP 800-81r3, §2.3 and §2.3.1; ISC KB, BIND Best Practices - Authoritative; Evaluation page, Part 3 (Roles, placement and high availability).");
  say(s,
`BIND does three jobs, and NIST and ISC both say to keep them apart. NIST says an internet-facing server shouldn't serve in both roles, and ISC agrees.

In a cloud, the forwarder is the common case. It holds no zones; it applies agency policy and logging, then forwards each name to the right place.

A recursive resolver fits where agency policy and logging must apply at the first hop, with the same response policy zones, validation and logging as on premises.

And authoritative service fits only for a delegated zone the native services can't answer, or as a secondary of a zone mastered on the DDI platform. Never a separately authored primary.`,
  "NIST SP 800-81r3, §2.3 Protecting the DNS Service and Infrastructure and §2.3.1 Dedicated DNS Services; ISC Knowledge Base, BIND Best Practices - Authoritative; evaluation page, Part 3, roles table.",
  `${EV}, Part 3, "Roles, placement and high availability"; Book 08, Chapter 08, Decision 3.`);
}

// ================================================================== 6 Placement and HA
{
  const s = content("What", "Placement and high availability in each cloud");
  tag(s, "What");
  line(s, "Hub", "Put cloud DNS servers in the shared-services or network hub VPC or VNet that holds the native resolver's endpoints, never in workload accounts (design guidance).", 1.45, 0.62, 13.5);
  const cl = [
    ["AWS", HEX.amber, HEX.amberTint, "Forward only to its own VPC's +2 address: forwarding to \"any VPC CIDR + 2 address from on-premises or other VPC DNS servers is not supported.\" Private hosted zones it needs are associated with its VPC, or reached through an inbound endpoint."],
    ["Azure", HEX.navy, HEX.navyTint, "A custom DNS server sits in the same virtual network as the VMs whose hostnames it resolves, and forwards those to 168.63.129.16."],
    ["Oracle Cloud", HEX.teal, HEX.tealTint, "Forwards oraclevcn.com and the private views to 169.254.169.254; subnets get it through the custom resolver DHCP option, at most three servers."],
  ];
  cl.forEach((c, i) => node(s, `Place ${i + 1}`, 0.6 + i * 4.1, 2.2, 3.95, 2.25, c[1], c[2], c[0], c[3], 11.5));
  panel(s, "HA", 0.6, 4.6, 12.15, 1.9, HEX.navy, "FFFFFF", "HIGH AVAILABILITY", null, [
    "NIST: at least two servers on different network segments, dispersed geographically, and a hidden primary for authoritative service; Microsoft: at least two DNS VMs across availability zones",
    "In practice: two or more servers per Region in different Availability Zones, a second Region for a Region-wide failure, and every client and forwarder configured with all of them (design guidance)",
  ], 12);
  sources(s, "Sources: AWS Resolving queries between VPCs and your network; Microsoft Learn, VNet name resolution and hybrid DNS; Oracle DNS in a VCN, Troubleshooting DNS; NIST SP 800-81r3 §2.3.2.");
  say(s,
`Where do the servers go? As design guidance: in the shared-services or network hub VPC or virtual network that already holds the native resolver's endpoints, never in workload accounts.

Each cloud adds a constraint. On AWS, a BIND server can forward only to its own VPC's plus-two address. On Azure, a custom DNS server sits in the same virtual network as the VMs whose hostnames it resolves, and forwards those to 168.63.129.16. On Oracle Cloud, it forwards the VCN's own names and private views to 169.254.169.254.

For high availability, NIST asks for at least two servers on different segments, dispersed geographically. In practice: two or more per Region in different zones, a second Region, and every client configured with all of them.`,
  "AWS Resolving DNS queries between VPCs and your network; Microsoft Learn, Configure DNS name resolution for Azure virtual networks, and hybrid DNS design; Oracle DNS in a Virtual Cloud Network and Troubleshooting DNS; NIST SP 800-81r3, §2.3.2; AWS whitepaper (2022).",
  `${EV}, Part 3, "Roles, placement and high availability".`);
}

// ================================================================== 7 Forwarding
{
  const s = content("What", "Forwarding to and from the native resolver");
  tag(s, "What");
  T(s, "Rule", [
    { text: "The native resolver stays the only path to the cloud's own names. ", options: { bold: true, color: HEX.navy } },
    { text: "AWS: a custom DNS server must \"route your private DNS queries to the IP address of the Amazon-provided DNS servers for your VPC.\" BIND's forward default is first, which falls back to its own recursion and can return the public answer or NXDOMAIN, so \"it is critical to specify the forward only option.\"" },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.95, fontSize: 12.5 });
  const q = [
    ["Per-instance limits", HEX.red, HEX.redTint, "AWS: the 1,024-packet-per-second quota covers everything BIND sends to VPC+2. Azure: 1,000 queries per second and 200 pending per VM to 168.63.129.16; over that, queries \"are dropped.\" Size the fleet so no server forwards near the limit (design guidance)."],
    ["Timeouts", HEX.amber, HEX.amberTint, "Microsoft: a forwarder's timeout should be more than four seconds, or Private DNS records may resolve to public addresses."],
    ["Visibility", HEX.navy, HEX.navyTint, "The VPC Resolver sees BIND as the source, not the client, and never sees BIND's cache hits (inference). BIND's own logs carry the client."],
    ["Loops", HEX.teal, HEX.tealTint, "Don't forward a domain to an inbound endpoint from inside the network that holds it; don't associate a VPC with both a rule and that rule's inbound endpoint."],
  ];
  q.forEach((c, i) => node(s, `Q ${i + 1}`, 0.6 + (i % 2) * 6.15, 2.55 + Math.floor(i / 2) * 2.0, 6.0, 1.85, c[1], c[2], c[0], c[3], 12));
  sources(s, "Sources: AWS private hosted zone considerations; BIND 9.20 ARM; AWS whitepaper (2022); VPC User Guide; Azure limits; VNet name resolution; Resolver best practices.");
  say(s,
`How does BIND forward? The native resolver stays the only path to the cloud's own names. BIND's forward setting defaults to first, which falls back to its own recursion when forwarders fail. For private names, that fallback can return the public answer or NXDOMAIN, so the AWS whitepaper says it's critical to specify forward only.

Per-instance limits: on AWS, the 1,024-packet-per-second quota covers everything BIND sends to VPC plus two; on Azure, a VM may send 1,000 queries per second, and queries over the limit are dropped. Size the fleet so no server forwards near the limit. Visibility: the VPC Resolver sees BIND as the source, never the client, so BIND's logs are the record. And loops: don't forward a domain to an inbound endpoint from inside the network that holds it.`,
  "AWS Considerations when working with a private hosted zone; BIND 9 ARM 9.20, forward; AWS whitepaper, Hybrid Cloud DNS Options for Amazon VPC; AWS VPC User Guide; Azure-provided DNS resolver VM limits; Configure DNS name resolution for Azure virtual networks; AWS Best practices for Resolver; Azure endpoints and rulesets.",
  `${EV}, Part 3, "Forwarding to and from the native resolver".`);
}

// ================================================================== 8 Illustrative configuration
{
  const s = content("What", "An illustrative forwarder configuration");
  tag(s, "What");
  const bottom = code(s, "Conf", 0.6, 1.45, 8.45, [
    "// Illustrative only: forwarder in a shared-services VPC (10.20.0.0/16).",
    "// Generated from the DDI policy plane and Git; never edited on the host.",
    "acl \"clients\" { 10.0.0.0/8; };",
    "options {",
    "    directory \"/var/cache/bind\";",
    "    version none;                       // don't disclose the version",
    "    recursion yes;",
    "    allow-query { clients; };",
    "    allow-recursion { clients; };",
    "    allow-transfer { none; };",
    "    dnssec-validation auto;",
    "    validate-except { \"aws.corp.agency.gov\"; \"corp.agency.gov\"; \"internal\"; };",
    "    // Internet-bound: the governed upstream (agency resolvers, then Protective DNS)",
    "    forward only;",
    "    forwarders { 10.1.0.10; 10.1.0.11; };",
    "};",
    "// Cloud names to the VPC Resolver of this VPC (VPC+2)",
    "zone \"aws.corp.agency.gov\" { type forward; forward only; forwarders { 10.20.0.2; }; };",
    "zone \"compute.internal\"    { type forward; forward only; forwarders { 10.20.0.2; }; };",
    "// On-premises names to the agency resolvers",
    "zone \"corp.agency.gov\"  { type forward; forward only; forwarders { 10.1.0.10; 10.1.0.11; }; };",
  ], { pt: 10, label: "named.conf: THE FORWARDER ROLE ON AWS (SHORTENED: ONE COMMENT DROPPED)" });
  panel(s, "Status", 9.2, 1.45, 3.55, 2.45, HEX.red, HEX.redTint, "ILLUSTRATIVE", null, [
    "Names and addresses are examples",
    "Passed named-checkconf from BIND 9.18.39 (Ubuntu 24.04); not run in a VPC or checked on 9.20",
    "Rendered from the policy plane and Git, not typed",
  ], 11);
  panel(s, "Others", 9.2, 4.05, 3.55, 2.45, HEX.navy, "FFFFFF", "THE SAME FILE ELSEWHERE", null, [
    "Oracle: oraclevcn.com, OCI private zones and private endpoint names to 169.254.169.254",
    "Azure: Azure namespaces and each private endpoint public zone to 168.63.129.16, or the inbound endpoint",
  ], 11);
  if (bottom > 6.55) console.warn("  ! Conf code runs into the Sources line");
  sources(s, "Sources: Evaluation page, Part 3 (illustrative named.conf; checked with named-checkconf 9.18.39); BIND 9.20 ARM; Oracle DNS in a VCN; Azure VNet name resolution; Book 08, Ch 07.");
  say(s,
`Here's the forwarder role on AWS, from the evaluation. It's illustrative. It passed BIND's configuration checker on version 9.18.39 but it hasn't run against a VPC or been checked on 9.20. And in practice it's rendered from the policy plane and Git, never typed on the host.

Version none hides the version, queries and recursion are limited to the agency's clients, and transfers are off. Validation is on, with an exceptions list for the private namespaces, which have no DNSSEC chain. Internet-bound queries go forward only, to the agency resolvers, the governed upstream to Protective DNS. The cloud's names go to this VPC's own plus-two resolver, and on-premises names go to the agency resolvers.

On Oracle Cloud and Azure, the same file sends those clouds' names to 169.254.169.254 or 168.63.129.16.`,
  "Evaluation page, Part 3, illustrative named.conf (named-checkconf, BIND 9.18.39) and the Oracle and Azure variants; BIND 9 ARM 9.20; Oracle DNS in a Virtual Cloud Network; Microsoft Learn, VNet name resolution; Book 08, Chapter 07.",
  `${EV}, Part 3, "Forwarding to and from the native resolver" (illustrative configuration); Book 08, Chapter 07.`);
}

// ================================================================== 9 DNSSEC
{
  const s = content("What", "DNSSEC validation and signing in the cloud");
  tag(s, "What");
  panel(s, "Val", 0.6, 1.5, 6.6, 5.0, HEX.teal, HEX.tealTint, "VALIDATION (SC-21)", null, [
    "BIND validates by default: dnssec-validation auto, root trust anchor built in; SP 800-81r3 asks for validation with automated trust anchor rollover",
    "Behind the VPC Resolver, BIND can't validate: it ignores the DO bit and returns no DNSSEC records; validate in the VPC Resolver, or in BIND toward an upstream that returns DNSSEC data",
    "Oracle's VCN resolver validates; whether it passes DNSSEC data and the AD bit back to BIND: confirm",
    "Private zones under a signed public parent look bogus to a validator: list them in validate-except, held in the policy plane with the forwarding rules (design guidance)",
    "Whether CISA's Protective DNS returns DNSSEC records to forwarders: confirm with CISA",
  ], 11.5);
  panel(s, "Sign", 7.35, 1.5, 5.4, 5.0, HEX.navy, HEX.navyTint, "SIGNING (SC-20)", null, [
    "SC-20 asks for signed authoritative data; M-08-23 required DNSSEC on federal systems",
    "Neither AWS nor Azure signs private zones, and no Oracle page describes it",
    "SP 800-81r3 §3.8.6: signing internal zones \"is not recommended\" except where required, and agencies may require it",
    "BIND's dnssec-policy default is ISC's recommended, fully automated signing",
    "The zone's one writable owner signs it; keys stay on the Grid Master or an HSM; a cloud BIND secondary holds no keys (design guidance)",
  ], 11.5);
  sources(s, "Sources: BIND 9.20 ARM (reference, DNSSEC chapter); NIST SP 800-81r3 §3.8.6, §4.2.5–4.2.6; AWS DNSSEC validation and signing; Oracle Private DNS; SP 800-53; M-08-23.");
  say(s,
`DNSSEC has two halves. BIND validates by default. But behind the VPC Resolver, BIND can't validate: the VPC Resolver ignores the DNSSEC OK bit and returns no DNSSEC records. So validate in the VPC Resolver, or in BIND toward an upstream that returns DNSSEC data. Oracle's VCN resolver validates, but whether it passes that data back to BIND isn't documented; confirm. Private zones under a signed parent go on BIND's exceptions list, held in the policy plane. And whether Protective DNS returns DNSSEC records to forwarders is a point to confirm with CISA.

Signing: no cloud signs private zones. NIST says signing internal zones is not recommended except where required, and notes agencies may require it. The design guidance is that the zone's one writable owner signs it, with keys on the Grid Master or an HSM, so a cloud BIND secondary holds no keys.`,
  "BIND 9 ARM 9.20 (dnssec-validation, validate-except; chapter 5 DNSSEC); NIST SP 800-81r3, §3.8, §3.8.6, §4.2.5, §4.2.6; AWS Enabling DNSSEC validation and Configuring DNSSEC signing; Azure DNSSEC overview; Oracle Private DNS; SP 800-53 Rev. 5 SC-20; OMB M-08-23.",
  `${EV}, Part 3, "DNSSEC signing and validation"; Book 08, Chapter 06 — DNS, Identity and DNSSEC.`);
}

// ================================================================== 10 RPZ and Protective DNS
{
  const s = content("What", "Response policy zones and CISA Protective DNS");
  tag(s, "What");
  panel(s, "RPZ", 0.6, 1.5, 4.0, 5.0, HEX.navy, HEX.navyTint, "BIND'S MECHANISM", null, [
    "Ordinary DNS zones; a response-policy statement takes up to 64",
    "Five triggers (client IP, query name, response IP, name server name or IP) map to NXDOMAIN, NODATA, PASSTHRU, DROP, TCP-only or local data",
    "Kept in sync with zone transfers and NOTIFY",
    "NIST: protective DNS is \"generally implemented by using DNS firewalls or RPZs\"",
  ], 11.5);
  panel(s, "CISA", 4.75, 1.5, 4.0, 5.0, HEX.red, HEX.redTint, "CISA'S PROTECTIVE DNS", null, [
    "Mandatory for civilian agencies; sits \"upstream from agency networks\" and \"does not interfere with internal DNS architecture\"",
    "Agency DNS \"should use only Protective DNS as its upstream provider\"; DoH and DoT, and plain DNS for authorized agency DNS infrastructure",
    "IaaS uses Protective DNS or agency DNS as its upstream",
    "CISA's public pages don't mention RPZ: the layering is NIST's and the program's",
  ], 11.5);
  panel(s, "Layer", 8.9, 1.5, 3.85, 5.0, HEX.teal, HEX.tealTint, "THE LAYERING (DESIGN GUIDANCE)", null, [
    "Agency RPZs on cloud BIND, from the same feed as on premises, in front of CISA's",
    "Internet-bound queries leave only toward Protective DNS",
    "RPZ hits and blocks logged to the SOC",
    "BIND 9.20 can forward over DoT; CISA's April 2024 note that BIND can't was true of 9.18; follow the current ARM (inference)",
  ], 11.5);
  sources(s, "Sources: BIND 9.20 ARM, RPZ and chapter 6; NIST SP 800-81r3 §2.1; CISA Protective DNS Resolver; CISA Encrypted DNS Implementation Guidance (Apr. 2024).");
  say(s,
`Response policy zones are BIND's filter. They're ordinary DNS zones, up to 64 per server, whose triggers map to actions like NXDOMAIN or drop. They stay in sync through zone transfers.

CISA's Protective DNS Resolver is mandatory for civilian agencies. CISA says agency DNS should use only Protective DNS as its upstream, and cloud infrastructure should use Protective DNS or agency DNS as its upstream. CISA's pages don't mention response policy zones, so the layering is NIST's and the program's.

As design guidance: the agency's own policy zones run on cloud BIND, from the same feed as on premises, in front of CISA's. Internet-bound queries leave only toward Protective DNS. Hits and blocks go to the SOC. And BIND 9.20 can forward over DNS over TLS; CISA's 2024 note that it can't was true of 9.18.`,
  "BIND 9 ARM 9.20, Response Policy Zone (RPZ) Rewriting and chapter 6, §6.9; NIST SP 800-81r3, §2.1 and §2.1.2; CISA, Protective Domain Name System (DNS) Resolver; CISA, Encrypted DNS Implementation Guidance, v1.0, April 2024, including Appendix A.3.1.",
  `${EV}, Part 3, "Response policy zones as Protective DNS".`);
}

// ================================================================== 11 Logging
{
  const s = content("What", "Query and response logging into the SOC");
  tag(s, "What");
  panel(s, "Ask", 0.6, 1.5, 4.0, 5.0, HEX.red, HEX.redTint, "WHAT IS ASKED", null, [
    "SP 800-81r3: \"robust DNS traffic logging\"; dnstap as an efficient method; blocked or malicious queries \"should always be logged\"; integration with the SIEM",
    "M-22-09: visibility kept by logging at the agency's designated resolvers",
    "M-26-14: searchable for six months, retrievable for a year",
  ], 11.5);
  panel(s, "Bind log", 4.75, 1.5, 4.0, 5.0, HEX.navy, HEX.navyTint, "BIND'S TWO MECHANISMS", null, [
    "The logging statement: queries, responses, query-errors, security, dnssec, rpz, rpz-passthru and xfer-out, to files or syslog; querylog or rndc querylog turns query logging on",
    "dnstap: client, resolver, auth, forwarder and update messages, to a file or Unix socket; needs a build with --enable-dnstap; its output can't change on reload",
    "ISC warns query logging adds heavy overhead and needs planning",
  ], 11.5);
  panel(s, "SOC", 8.9, 1.5, 3.85, 5.0, HEX.teal, HEX.tealTint, "INTO THE SOC", null, [
    "Through the Azure Monitor Agent's syslog path or the agency's collector",
    "Detections against ASIM's _Im_Dns, which already parses BIND (Book 12, Ch 05)",
    "The native resolver sees BIND, not the client, so BIND's log is the record of who asked; without it, cloud DNS is a blind spot (inference)",
  ], 11.5);
  sources(s, "Sources: NIST SP 800-81r3 §2.1.3; OMB M-22-09; OMB M-26-14, Appendix B; BIND 9.20 ARM (logging, dnstap); ISC BIND Best Practices - Recursive; Book 12, Ch 05.");
  say(s,
`Logging is where cloud DNS most often goes dark. NIST asks for robust DNS traffic logging, with blocked queries always logged. OMB's M-22-09 expects agencies to keep visibility by logging at their designated resolvers, and M-26-14 sets the retention: searchable for six months and retrievable for a year.

BIND offers two mechanisms. The logging statement writes categories such as queries, responses and policy-zone hits to files or syslog, and dnstap records messages to a file or socket, in a build with dnstap enabled. ISC warns that query logging adds heavy overhead, so plan for it.

Send them to the SIEM, where ASIM's DNS parser already handles BIND, as Book 12 describes. Because the native resolver sees BIND rather than the client, BIND's log is the record of who asked. Without it, cloud DNS is a blind spot.`,
  "NIST SP 800-81r3, §2.1.3 and §2.3.3; OMB M-22-09, Encrypting DNS traffic; OMB M-26-14, Appendix B; BIND 9 ARM 9.20, logging categories, querylog, dnstap; ISC Knowledge Base, BIND Best Practices - Recursive; Book 12, Chapter 05.",
  `${EV}, Part 3, "Query and response logging into the SOC"; Book 12, Chapter 05 — From Log Warehouse to Detection.`);
}

// ================================================================== 12 Patching, settings, baselines
{
  const s = content("What", "Patching, settings and hardening baselines");
  tag(s, "What");
  panel(s, "Patch", 0.6, 1.5, 4.0, 5.0, HEX.red, HEX.redTint, "PATCHING (SI-2)", null, [
    "Subscribe to bind-announce; check ISC's BIND 9 Software Vulnerability Matrix for each version in use",
    "Stay on a supported branch; ISC gives support customers three to five business days' notice of serious vulnerabilities",
    "BOD 26-04 (June 10, 2026) replaced BOD 22-01 and 19-02: shortest window three days, for the highest-risk flaws in publicly exposed assets",
    "BOD 23-01: discovery every 7 days, enumeration every 14, cloud included",
  ], 11.5);
  panel(s, "Set", 4.75, 1.5, 4.0, 5.0, HEX.navy, HEX.navyTint, "SETTINGS (CM-6, CM-7)", null, [
    "version none stops version answers; allow-query defaults to all hosts, so set it, and set allow-recursion to the agency's clients",
    "allow-transfer restricts transfers; TSIG authenticates them; SP 800-81r3 adds TLS for confidentiality",
    "Run named unprivileged, chrooted where practical",
    "Keep the host to DNS only, as NIST and ISC both say",
  ], 11.5);
  panel(s, "Base", 8.9, 1.5, 3.85, 5.0, HEX.teal, HEX.tealTint, "BASELINES THAT EXIST", null, [
    "NIST SP 800-81r3 (March 2026), the deployment guide",
    "ISC's ARM security chapter and best-practice pages (the recursive page is marked stale)",
    "CIS: BIND 9.11 v1.0.0 and 9.9 v3.0.1 only; none for 9.20 or 9.18; read 9.11 for intent",
    "So the agency's own profile, approved by the CISO, is the CM-6 baseline (design guidance)",
  ], 11.5);
  sources(s, "Sources: ISC KB (best practices, vulnerability matrix, disclosure policy); CISA BOD 26-04, BOD 23-01; BIND 9.20 ARM ch. 7; NIST SP 800-81r3; CIS Benchmarks: BIND.");
  say(s,
`The patching sources are ISC's, and the clock is CISA's. Subscribe to ISC's bind-announce list and check its vulnerability matrix for each version in use. And patch to CISA's clock: Binding Operational Directive 26-04, from June 2026, replaced the older remediation directives with risk-based timelines, the shortest three days for the highest-risk flaws in publicly exposed assets.

Version none hides the version. Query access defaults to all hosts, so restrict it, and restrict recursion to the agency's clients. Restrict zone transfers and authenticate them with TSIG keys. Run named unprivileged, and keep the host to DNS only.

For a baseline, CIS has benchmarks only for BIND 9.11 and 9.9, none for 9.20 or 9.18. So the agency states its own profile, approved by the CISO, as design guidance.`,
  "ISC Knowledge Base: BIND Best Practices - Authoritative and Recursive; BIND 9 Software Vulnerability Matrix; bind-announce; Disclosure Policy. CISA BOD 26-04 (June 10, 2026); CISA BOD 23-01. BIND 9 ARM 9.20, reference and chapter 7; NIST SP 800-81r3, §2.3.1, §3.1; CIS Benchmarks: BIND.",
  `${EV}, Part 3, "Patching and configuration settings" and "Hardening baselines: what exists".`);
}

// ================================================================== 13 Who: Git and Ansible
{
  const s = content("Who", "Who owns the configuration: Git and Ansible");
  tag(s, "Who");
  T(s, "Tier 2", [
    { text: "The Ansible guide ", options: { bold: true, color: HEX.navy } },
    { text: "treats Linux hosts outside Intune and Arc as tier 2, managed by a playbook from a reviewed repository. A BIND server is exactly that case (design guidance)." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.62, fontSize: 13 });
  const steps = [
    ["Rendered, not typed", HEX.navy, HEX.navyTint, "named.conf and its forward zones are templates rendered from DDI policy-plane data: forwarding rules, validate-except, RPZ primaries, TSIG key references"],
    ["Checked before it lands", HEX.teal, HEX.tealTint, "Main only by pull request with a required reviewer; CI runs named-checkconf and named-checkzone; the playbook validates again before reload"],
    ["Git is the evidence", HEX.amber, HEX.amberTint, "Commit and tag are the CM-2 baseline, the pull request the CM-3 change record; check-mode runs report drift"],
    ["One owning tool", HEX.red, HEX.redTint, "Ansible owns named.conf on these hosts and nothing else writes it; a hand edit is drift, to be reverted"],
  ];
  steps.forEach((c, i) => node(s, `Own ${i + 1}`, 0.6 + i * 3.075, 2.25, 2.925, 2.95, c[1], c[2], c[0], c[3], 12));
  callout(s, "Secrets", 5.4, 1.1, "FaKey", HEX.navy, "Secrets stay out of Git: ", "TSIG keys and DoT certificates come from the agency's secrets store at run time.");
  sources(s, "Sources: Evaluation page, Part 3 (Configuration from Git, applied by Ansible); Ansible guide: Linux and Unix; Evidence to the program; One owning tool per setting.");
  say(s,
`Who owns a cloud BIND server's configuration? The workbook's Ansible guide manages such Linux hosts by playbook from a reviewed repository.

Four practices make it work, as design guidance. Rendered, not typed: BIND's configuration is a template rendered from data the DDI policy plane exports.

Checked before it lands: every change arrives by reviewed pull request, and CI and the playbook both run BIND's checkers.

Git is the evidence: the commit and tag are the CM-2 baseline, the pull request is the CM-3 change record, and check-mode runs report drift.

One owning tool: Ansible owns named.conf on these hosts, and nothing else writes it. A hand edit is drift, to be reverted. And secrets stay out of Git: keys and certificates come from the secrets store at run time.`,
  "Evaluation page, Part 3, Configuration from Git, applied by Ansible; Ansible guide, Linux and Unix, Evidence to the program, One owning tool per setting.",
  `${EV}, Part 3, "Configuration from Git, applied by Ansible"; Ansible for Configuration Automation guide.`);
}

// ================================================================== 14 How: checklist
{
  const s = content("How", "The alignment checklist: seven questions");
  tag(s, "How");
  table(s, "Check", 1.45, [0.4, 3.3, 4.6, 3.85], ["#", "Question", "Aligns when the answer is…", "Silo signal"], [
    ["1", "Role: authoritative, recursive or forwarder?", "Forwarder or resolver, or an authoritative secondary of a DDI-mastered zone; roles separated", "A primary for zones, or both roles on an internet-facing server"],
    ["2", "Source of truth: which zones, and who creates them?", "None, or zones transferred from the DDI platform", "Records created on the server, or zones also edited in Route 53 or on premises"],
    ["3", "Why BIND, not the VPC Resolver or vNIOS? Permanent or a bridge?", "A stated Part 2 need; a bridge has an end date and a retiring change", "\"We've always run BIND,\" or no end date"],
    ["4", "Configuration: in Git, applied by a tool, reviewed?", "Rendered from policy data, merged by reviewed pull request, drift-checked", "Edited on the host; no repository; no change records"],
    ["5", "Placement: EC2 or VMware guests? GovCloud or commercial? Shared rules?", "Hub VPC per Region, two or more across zones; rules shared through RAM or a Profile; each placement checked against Part 1", "Workload accounts; rules per account; one Region copied to the other unchecked"],
    ["6", "Shared policy: logs, Protective DNS, validation?", "Logs or dnstap in the SIEM with M-26-14 retention; same RPZ feed; upstream only Protective DNS; validation on", "No logs, or only VPC Resolver logs; no RPZs; its own upstream"],
    ["7", "Hardening, inventory, owner?", "Supported branch; stated baseline (CM-6); CMDB record (CM-8) and IPAM entry; named owner", "End-of-life branch; no baseline; not in the CMDB; \"the cloud team\""],
  ], { fontSize: 10.5, minRow: 0.3 });
  line(s, "Read", "Rows 2 or 4 are the serious signals: move the zones to the DDI platform and the configuration into Git before adding servers. Row 3 alone: compare with the VPC Resolver, and retire what adds nothing.", 5.75, 0.75, 12.5, HEX.ink);
  sources(s, "Sources: Evaluation page, Part 4 (Alignment checklist for self-managed BIND in AWS; How to read the answers); NIST SP 800-81r3 §2.3.1; Book 08, Ch 07.");
  say(s,
`Here's the checklist, seven questions an agency asks of each BIND server it adds in AWS, as design guidance. First establish whether they're EC2 instances or VMware guests on AWS.

One, role: a forwarder, resolver or secondary aligns; a primary doesn't. Two, source of truth: no zones, or zones transferred from the DDI platform. Three, why BIND: a stated need from the criteria, or a bridge with an end date. Four, configuration: rendered, reviewed and applied by automation, not edited on the host. Five, placement: the hub VPC of each Region, at least two servers, rules shared once. Six, shared policy: logs in the SIEM with the M-26-14 retention, the same policy-zone feed, and Protective DNS as the only upstream. Seven: a supported branch, a stated baseline, a CMDB record and a named owner.

Rows two and four are the serious signals. Row three alone means the servers may not be needed at all.`,
  "Evaluation page, Part 4, Alignment checklist for self-managed BIND in AWS and How to read the answers; Book 08, Chapter 07 (NSX row).",
  `${EV}, Part 4, "Alignment checklist for self-managed BIND in AWS".`);
}

// ================================================================== 15 How: federal mapping I
{
  const s = content("How", "Federal mapping: configuration and inventory");
  tag(s, "How");
  table(s, "Map 1", 1.45, [3.4, 3.4, 5.35], ["Requirement", "What it asks of cloud DNS", "Evidence for a self-managed BIND or vNIOS server"], [
    ["CM-2 Baseline Configuration", "A current, documented baseline", "The Git commit and tag of the rendered configuration"],
    ["CM-3 Configuration Change Control", "Reviewed, approved, recorded changes", "Pull requests with required review; the policy-plane change that produced them"],
    ["CM-6 Configuration Settings", "Settings set to a stated baseline", "The agency profile (9.20 ARM, SP 800-81r3, CIS benchmark intent), and drift reports in check mode"],
    ["CM-7 Least Functionality", "Only the functions needed", "Dedicated DNS host; one role per server; version none; recursion and transfers limited"],
    ["CM-8 System Component Inventory", "Every component inventoried", "CMDB record per server and IPAM entry per address, with owner; BOD 23-01 discovery covers cloud assets"],
    ["SI-2 Flaw Remediation", "Flaws fixed on time", "Supported BIND branch; bind-announce and the vulnerability matrix; remediation inside BOD 26-04's timelines"],
  ], { fontSize: 12 });
  line(s, "Note", "The controls and citations are the ones Book 08 has already verified (Chapters 03 and 11). The mapping is illustrative: validate it against the system's own authorization boundary.", 5.45, 0.75, 12.5, HEX.ink);
  sources(s, "Sources: Evaluation page, Part 5; NIST SP 800-53 Rev. 5; CISA BOD 23-01, BOD 26-04; Book 08, Ch 03 (control mapping) and Ch 11 (compliance evidence).");
  say(s,
`The federal mapping reuses the controls Book 08 has already verified. It's illustrative, so validate it against the system's own authorization boundary.

Configuration and inventory first. CM-2, the baseline: the evidence is the Git commit and tag of the rendered configuration. CM-3, change control: pull requests with required review. CM-6, configuration settings: the agency's stated profile, plus drift reports. CM-7, least functionality: a dedicated DNS host, one role per server, the version hidden, and recursion and transfers limited.

CM-8, inventory: a CMDB record for each server and an IPAM entry for each address, with an owner. And SI-2, flaw remediation: a supported BIND branch, ISC's announcement list and vulnerability matrix, and remediation inside the timelines of Binding Operational Directive 26-04.`,
  "Evaluation page, Part 5, Federal mapping; NIST SP 800-53 Rev. 5 (CM-2, CM-3, CM-6, CM-7, CM-8, SI-2); CISA BOD 23-01 and BOD 26-04; Book 08, Chapter 03 control mapping and Chapter 11 compliance evidence.",
  `${EV}, Part 5, "Federal mapping"; Book 08, Chapter 03 and Chapter 11.`);
}

// ================================================================== 16 How: federal mapping II
{
  const s = content("How", "Federal mapping: resolution, logging and Protective DNS");
  tag(s, "How");
  table(s, "Map 2", 1.45, [3.0, 3.75, 5.4], ["Requirement", "What it asks of cloud DNS", "Evidence for a self-managed BIND or vNIOS server"], [
    ["SC-20 (authoritative source)", "Signed authoritative data", "Signing by the zone's one owner; cloud secondaries serve signed data and hold no keys"],
    ["SC-21 (recursive or caching resolver)", "Validation of answers", "dnssec-validation auto; validate-except from the policy plane; VPC Resolver validation where BIND forwards to it"],
    ["SC-22 Architecture and Provisioning", "Fault-tolerant, role-separated service", "At least two servers per Region across zones; roles separated (SP 800-81r3 §2.3)"],
    ["SI-4 System Monitoring", "DNS as a detection source", "RPZ hits and blocks, DNS Firewall or resolver policy actions, Oracle resolution paths, all in the SIEM"],
    ["AU-2 and AU-12", "DNS events selected and generated", "Query, response, security and RPZ categories or dnstap; the three clouds' resolver logs beside them; M-26-14 retention"],
    ["OMB M-22-09", "Encrypted DNS where supported; logging at agency resolvers", "DoT or DoH to clients that support it; DoT upstream from BIND 9.20; logs at the BIND server"],
    ["CISA Protective DNS and Encrypted DNS guidance", "Protective DNS for all egress; cloud upstream to it or agency DNS; unauthorized DNS blocked", "Internet-bound forwarding only to Protective DNS or the agency resolvers; egress port 53, DoT and DoH to anything else blocked"],
    ["CISA ED 19-01 (sunset Jan. 8, 2026)", "Audit records, change passwords, add MFA, monitor Certificate Transparency", "Its four actions remain sound practice for anyone who can change records, in the cloud consoles as on the DDI platform"],
  ], { fontSize: 10.5, minRow: 0.3 });
  sources(s, "Sources: Evaluation page, Part 5; NIST SP 800-53 Rev. 5; OMB M-22-09, M-26-14; CISA Protective DNS, Encrypted DNS Implementation Guidance, ED 19-01; NIST SP 800-81r3.");
  say(s,
`Then resolution, logging and Protective DNS. SC-20 asks for signed authoritative data: the zone's one owner signs it, and cloud secondaries serve signed data and hold no keys. SC-21 asks for validation: validation on, the exceptions list from the policy plane, and VPC Resolver validation where BIND forwards to it. SC-22: at least two servers per Region, roles separated.

SI-4 treats DNS as a detection source, with every filter's hits in the SIEM. AU-2 and AU-12: BIND's logs beside the three clouds' resolver logs, kept for the M-26-14 retention.

For M-22-09's encrypted DNS and resolver logging: encrypted DNS to clients, DNS over TLS upstream from BIND 9.20, and logs at the BIND server. CISA's guidance: internet-bound forwarding only to Protective DNS or agency resolvers, and other DNS egress blocked. And Emergency Directive 19-01 is sunset, but its four actions remain sound practice.`,
  "Evaluation page, Part 5, Federal mapping; NIST SP 800-53 Rev. 5 (SC-20, SC-21, SC-22, SI-4, AU-2, AU-12); OMB M-22-09; OMB M-26-14; CISA Protective DNS Resolver; CISA Encrypted DNS Implementation Guidance; CISA ED 19-01 and its January 8, 2026 sunset; NIST SP 800-81r3, §2.3.",
  `${EV}, Part 5, "Federal mapping"; Book 08, Chapter 03 and Chapter 11.`);
}

// ================================================================== 17 How: Infoblox fit, confirm, close
{
  const s = content("How", "Where Infoblox fits, and what to confirm");
  tag(s, "How");
  panel(s, "IB", 0.6, 1.5, 4.0, 5.0, HEX.navy, HEX.navyTint, "WHERE INFOBLOX (vNIOS) FITS", null, [
    "Where the Grid already runs the agency's DNS: vNIOS joins it and gets its policy from the Grid Master",
    "Same criteria as BIND: run it only for a stated reason; it consumes the policy plane",
    "Its cloud HA is documented for commercial endpoints only: confirm failover in GovCloud and Azure Government",
    "Options A, B and C: the Trinzic explainer; the build: the NIOS implementation guide",
  ], 11.5);
  panel(s, "Conf", 4.75, 1.5, 4.0, 5.0, HEX.red, "FFFFFF", "OPEN POINTS FOR PART 2", null, [
    "Whether Oracle's VCN resolver passes DNSSEC data to a resolver behind it",
    "Whether CISA's Protective DNS returns DNSSEC data to agency forwarders",
    "The National Checklist Program dates for the CIS BIND benchmarks",
    "The illustrative named.conf: checked on 9.18.39, not yet run in a VPC or on 9.20",
  ], 11.5);
  panel(s, "Next", 8.9, 1.5, 3.85, 5.0, HEX.amber, HEX.amberTint, "NEXT STEPS", null, [
    "Ask the seven questions of every cloud BIND server, and record the answers in the CMDB",
    "Build the forwarder pattern in a test account in each target Region and realm",
    "Run Book 08's Chapter 10 validation matrix from every origin, and record the evidence",
  ], 11.5);
  sources(s, "Sources: Evaluation page, Part 2, Part 4 and \"Status and review\"; NIOS implementation guide; Trinzic explainer; Book 08, Ch 10.");
  say(s,
`Where does Infoblox fit? Where the Grid already runs the agency's DNS, vNIOS is the choice, because it joins the same Grid and gets its policy from the Grid Master. The same criteria apply as for BIND. Confirm its failover in GovCloud and Azure Government.

The open points for this part: whether Oracle's VCN resolver passes DNSSEC data to a resolver behind it, and whether CISA's Protective DNS returns DNSSEC data to agency forwarders. And the illustrative configuration hasn't yet run in a VPC.

The next steps: ask the seven questions of every cloud BIND server, build the forwarder pattern in a test account in each Region and realm, and run Book 08's validation matrix from every origin. This is research under review, not an endorsement by any federal agency. Thank you.`,
  "Evaluation page, Part 2 (vNIOS or BIND), Part 4 and \"Status and review\"; Infoblox NIOS implementation guide; Trinzic explainer; Book 08, Chapter 10.",
  `${EV}, Part 2 and "Status and review"; Infoblox NIOS implementation guide; Book 08, Chapter 10.`);
}

// ================================================================== Backup
backup("Sources: labels, open points and full source lists on the following slides. Checked Oct. 29, 2026; Oracle Oct. 30–31, 2026.");
{
  const s = content("Backup", "Labels, scope and open points (Part 2)");
  table(s, "Labels", 1.45, [2.6, 9.55], ["Label or point", "Meaning on these slides"], [
    ["(design guidance)", "The program's recommendation, not a provider statement: the criteria, placement, HA practice, the RPZ layering, Git and Ansible, the checklist"],
    ["(inference)", "A conclusion the sources support but don't state: the VPC Resolver's view of BIND as the client; following the current ARM over CISA's 2024 BIND appendix; BIND's log as the record of who asked"],
    ["confirm", "A point the sources don't settle; the agency settles it with the provider or CISA"],
    ["Scope", "FedRAMP Moderate civilian agencies: the configuration authority is CISA, NIST SP 800-53 at Moderate, and CIS benchmarks or NIST National Checklist Program content"],
    ["Open points", "vNIOS failover in GovCloud and Azure Government; Oracle VCN resolver DNSSEC pass-through; Protective DNS returning DNSSEC data; National Checklist Program dates for the CIS BIND benchmarks"],
    ["Illustrative configuration", "Passed named-checkconf from BIND 9.18.39 (Ubuntu 24.04 package) in WSL; not run in a VPC; not checked on 9.20"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: Evaluation page, \"Sources, labels and scope\" and \"Status and review\"; verification log.");
}
srcSlide("Sources: ISC, NIST and CIS", [
  "ISC, BIND 9 Administrator Reference Manual, 9.20 (stable): Configuration Reference (forward, forwarders with TLS, type forward, allow-query, allow-recursion, allow-transfer, version, dnssec-validation, validate-except, logging, querylog, dnstap); chapter 5 DNSSEC; Response Policy Zone (RPZ) Rewriting and chapter 6 §6.9; chapter 7 Security Configurations.",
  "ISC Knowledge Base: Software Support Policy and Version Numbering  ·  Software Defect and Vulnerability Disclosure Policy  ·  BIND 9 Software Vulnerability Matrix  ·  BIND Best Practices - Authoritative  ·  BIND Best Practices - Recursive (marked stale)  ·  ISC Download (9.20.30)  ·  bind-announce list.",
  "NIST SP 800-81r3, Secure Domain Name System (DNS) Deployment Guide, March 2026: §2.1 and §2.1.2 (protective DNS), §2.1.3 (logging), §2.3, §2.3.1 and §2.3.2 (dedicated, resilient servers), §3.1 (zone transfers), §3.8 and §3.8.6 (signing internal zones), §4.2.5, §4.2.6 and §4.3 (validation).",
  "NIST SP 800-53 Rev. 5 (release 5.2.0): CM-2, CM-3, CM-6, CM-7, CM-8, SC-20, SC-21, SC-22, SI-2, SI-4, AU-2, AU-12.",
  "Center for Internet Security, CIS Benchmarks: BIND (ISC BIND DNS Server 9.11 v1.0.0; 9.9 v3.0.1).",
  "All accessed Oct. 29, 2026, as footnoted on the evaluation page.",
], "Sources: the evaluation page's footnotes (cdns-bind-*, cdns-isc-*, cdns-nist81*, cdns-sp80053, cdns-cis).");
srcSlide("Sources: AWS, Microsoft and Oracle (Part 2)", [
  "AWS: Resolving DNS queries between VPCs and your network  ·  Considerations when working with a private hosted zone  ·  Best practices for Resolver  ·  Enabling DNSSEC validation  ·  Configuring DNSSEC signing  ·  Resolver query logging  ·  How Resolver DNS Firewall works  ·  VPC User Guide, Understanding Amazon DNS.",
  "AWS Whitepaper, Hybrid Cloud DNS Options for Amazon VPC, December 2, 2022 (marked for historical reference only).",
  "Microsoft Learn: Design a hybrid DNS solution by using Azure (Architecture Center)  ·  Configure DNS name resolution for Azure virtual networks  ·  Azure subscription and service limits (Azure-provided DNS resolver VM limits)  ·  Azure DNS Private Resolver endpoints and rulesets  ·  DNSSEC overview.",
  "Oracle Cloud Infrastructure Documentation: Private DNS  ·  DNS in a Virtual Cloud Network  ·  Troubleshooting DNS. Accessed Oct. 31, 2026.",
  "AWS and Microsoft sources accessed Oct. 29, 2026.",
], "Sources: the evaluation page's footnotes (cdns-r53-*, cdns-vpc-dns, cdns-aws-whitepaper, cdns-az-*, cdns-oci-*).");
srcSlide("Sources: OMB, CISA and the workbook (Part 2)", [
  "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, Jan. 26, 2022 (Encrypting DNS traffic)  ·  OMB M-26-14, agency logging and network visibility, May 22, 2026, Appendix B  ·  OMB M-08-23, Securing the Federal Government's DNS Infrastructure, Aug. 22, 2008.",
  "CISA: Protective Domain Name System (DNS) Resolver  ·  Encrypted DNS Implementation Guidance, v1.0, April 2024 (including Appendix A.3.1, BIND)  ·  BOD 26-04, Prioritizing Security Updates Based on Risk, June 10, 2026  ·  BOD 23-01, Improving Asset Visibility and Vulnerability Detection, Oct. 3, 2022  ·  ED 19-01, Mitigate DNS Infrastructure Tampering, sunset Jan. 8, 2026.",
  "Evaluation: Cloud DNS on AWS, Azure and Oracle Cloud: Native Resolvers, Infoblox and BIND (in review), and its verification log.",
  "Book 08 — DNS, DHCP & IPAM: Ch 03 (control mapping), Ch 06 (DNS, identity and DNSSEC), Ch 07 (cloud private endpoints; NSX row), Ch 08 (Decisions 2 and 3), Ch 10 (validation matrix), Ch 11 (compliance evidence).",
  "Book 12, Ch 05 (ASIM DNS parser)  ·  Ansible for Configuration Automation guide  ·  Infoblox NIOS implementation guide  ·  Trinzic Alone, or Trinzic Plus Cloud DDI?",
], "Sources: the evaluation page's footnotes (cdns-m*, cdns-cisa-*, cdns-bod*, cdns-ed1901) and the workbook pages it links.");

finish(OUT);
