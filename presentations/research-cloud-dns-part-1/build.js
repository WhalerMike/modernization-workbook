// Cloud DNS on AWS, Azure and Oracle Cloud, PART 1: THE NATIVE RESOLVERS. A ~16-minute narrated evaluation deck.
//   Why:  1 Title · 2 Why cloud DNS belongs to one policy plane · 3 The answer in brief
//   What: 4 Route 53 VPC Resolver · 5 its endpoints · 6 rules, sharing, Profiles, private zones · 7 DNS Firewall, logging, DNSSEC
//         8 GovCloud beside the commercial Regions · 9 Azure DNS Private Resolver · 10 resolver policy, logging, DNSSEC
//         11 Oracle VCN resolver · 12 its endpoints, rules and gaps
//   Who:  13 AWS and Azure FedRAMP scope · 14 Oracle US Government Cloud
//   How:  15 meeting on-premises DNS · 16 Protective DNS, policy and logs · 17 what to confirm, and Part 2
//   Backup (not narrated): labels and open points, three source lists.
// Every fact comes from docs/evaluations/cloud-dns-resolvers-infoblox-bind.md (Part 1, "The answer in brief", and its
// footnoted sources, checked Oct 29 and Oct 31, 2026, with the claims log in docs/evaluations/_verification/) or from
// Book 08, which the page links. The deck adds no external facts and keeps the page's labels:
// (design guidance), (inference) and "confirm".
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_Cloud_DNS_Part_1.pptx   (FIT=1 prints bottoms)
// The build also writes narration.json (one {slide, title, say} per narrated slide) from the same text as the notes.
const H = require("./helpers.js")({
  book: "Cloud DNS on AWS, Azure and Oracle Cloud",
  title: "Part 1: The Native Resolvers",
  footer: "Cloud DNS on AWS, Azure and Oracle Cloud  ·  Part 1: The native resolvers  ·  Research — in review",
  dir: __dirname,
});
const { HEX, txt, box, tag, callout, say, sources, T, table, panel, subhead, node, arrow, label, line, content, titleSlide, backup, srcSlide, finish } = H;
const OUT = process.argv[2] || "Research_Cloud_DNS_Part_1.pptx";
const EV = "Evaluation, Cloud DNS on AWS, Azure and Oracle Cloud";

// ================================================================== 1 Title
{
  const s = titleSlide("Why", "Cloud DNS, Part 1: The Native Resolvers", "Three native resolvers  ·  Research — in review");
  txt(s, "Session map", [
    { text: "ABOUT 16 MINUTES  ·  FOR FEDRAMP MODERATE CIVILIAN AGENCIES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Route 53 VPC Resolver  ·  Azure DNS Private Resolver  ·  Oracle Cloud VCN resolver", options: { color: HEX.ink, breakLine: true } },
    { text: "Endpoints and rules · query logging · DNS-layer filters · government clouds", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2: when to run your own DNS servers, BIND, and the federal fit", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.8, h: 1.3, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Evaluation, Cloud DNS on AWS, Azure and Oracle Cloud (in review); AWS, Microsoft Learn, Oracle, CISA, FedRAMP Marketplace. Checked Oct. 29 and 31, 2026.", 6.08);
  say(s,
`Welcome. This is Part 1 of a two-part narrated tour of a Federal Modernization Workbook evaluation: Cloud DNS on AWS, Azure and Oracle Cloud, with native resolvers, Infoblox and BIND. It's research under review, written for FedRAMP Moderate civilian agencies.

Part 1 covers the three native resolvers in depth: the Route 53 VPC Resolver, the Azure DNS Private Resolver, and the Oracle Cloud VCN resolver. For each: its endpoints and forwarding rules, its query logging and its DNS-layer filter. Then what the providers say about their government clouds, and how all three meet on-premises DNS.

Statements marked design guidance are the program's recommendations, inferences are labeled, and confirm marks a point to settle with the provider.`,
  "Evaluation page, front matter and the callout \"Sources, labels and scope\".",
  `${EV}, introduction and "Sources, labels and scope".`);
}

// ================================================================== 2 Why one policy plane
{
  const s = content("Why", "Why cloud DNS belongs to one policy plane");
  tag(s, "Why");
  panel(s, "Asks", 0.6, 1.5, 6.0, 2.45, HEX.navy, HEX.navyTint, "WHAT BOOK 08 ASKS FOR", null, [
    "One authoritative policy and state plane that every other DNS system consumes",
    "Zones, forwarding rules, IPAM data and security policy in one place",
    "Cloud DNS services as \"synchronized targets or forwarding destinations rather than independently authored sources\" (Ch 08)",
  ], 12.5);
  panel(s, "Silos", 6.75, 1.5, 6.0, 2.45, HEX.red, HEX.redTint, "WHAT AUTHORING IN EVERY SILO PRODUCES", null, [
    "Split-brain answers",
    "Names that work in one cloud but not another",
    "Uneven Protective DNS and logging",
  ], 12.5);
  table(s, "Gaps", 4.15, [3.6, 8.55], ["Where the workbook stood", "What this evaluation adds"], [
    ["Infoblox with Azure and AWS: covered", "Book 08 Ch 07 and 08, and the Trinzic explainer's options A, B and C, already cover it"],
    ["Route 53 Resolver: covered thinly", "Part 1 lays out how it works, and what differs in GovCloud, service by service"],
    ["Oracle Cloud: comparison level only", "Part 1 adds its resolver in the same depth, with the US Government Cloud and FedRAMP scope"],
    ["BIND in AWS or Azure: not covered", "Part 2: when to run it, how, and how it stays inside the single policy plane"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: Evaluation page, introduction; Book 08, Ch 07 and Ch 08 (Moving from per-cloud local syncs to a unified control plane); Trinzic explainer.");
  say(s,
`Why does cloud DNS need a deck of its own? Book 08 of the workbook asks for one authoritative policy and state plane that every other DNS system consumes. Cloud DNS services are synchronized targets or forwarding destinations, not independently authored sources.

The warning is about authoring copies in every silo. That produces split-brain answers, names that work in one cloud but not another, and uneven Protective DNS and logging.

The workbook already covers Infoblox with Azure and AWS. It covered the Route 53 Resolver thinly, and Oracle Cloud only at the comparison level, so Part 1 adds both in depth. BIND in a cloud wasn't covered at all; that's Part 2.`,
  "Evaluation page, introduction (Book 08 Chapter 08 quotation; the four gaps); Book 08, Chapters 07 and 08; Trinzic explainer.",
  `${EV}, introduction; Book 08, Chapter 08 — Reference Architecture; Book 08, Chapter 07.`);
}

// ================================================================== 3 Answer in brief
{
  const s = content("Why", "The answer in brief: native resolvers as the bridge");
  tag(s, "Why");
  line(s, "Lead", "Use the native resolver as the forwarding bridge in each cloud, and keep the policy in the DDI plane.", 1.45, 0.4, 15);
  const cards = [
    ["AWS: Route 53 VPC Resolver", HEX.amber, HEX.amberTint, "Managed, zone-redundant forwarding service; AWS recommends it over DNS servers on virtual machines. Doesn't sign private zones."],
    ["Azure: DNS Private Resolver", HEX.navy, HEX.navyTint, "Managed, zone-redundant forwarding service; Microsoft recommends it over DNS servers on virtual machines. Doesn't sign private zones."],
    ["Oracle Cloud: VCN resolver", HEX.teal, HEX.tealTint, "A dedicated resolver in every VCN, with listening and forwarding endpoints. No native DNS-layer filter for private DNS."],
  ];
  cards.forEach((c, i) => node(s, `Card ${i + 1}`, 0.6 + i * 4.1, 2.0, 3.95, 1.75, c[1], c[2], c[0], c[3], 12));
  panel(s, "Points", 0.6, 3.95, 7.4, 2.55, HEX.navy, "FFFFFF", "WHAT FOLLOWS", null, [
    "None of the three is an authority for the agency's own namespaces",
    "In an Oracle VCN, agency policy applies only if queries are forwarded to agency resolvers",
    "Book 08's Decision 3 already treats the inbound endpoints as forwarding destinations",
  ], 12.5);
  panel(s, "Own", 8.15, 3.95, 4.6, 2.55, HEX.red, HEX.redTint, "DESIGN GUIDANCE (PART 2)", null, [
    "Run your own DNS servers in a cloud only for a stated reason the native resolver can't meet",
    "vNIOS or BIND then consumes the policy plane; it doesn't become a second one",
  ], 12.5);
  sources(s, "Sources: Evaluation page, \"The answer in brief\" (Microsoft hybrid DNS design; Route 53 VPC Resolver; Oracle Private DNS and Traffic Management; AWS and Azure DNSSEC pages).");
  say(s,
`Here is the answer in brief. Use the native resolver as the forwarding bridge in each cloud, and keep the policy in the DDI plane.

The Route 53 VPC Resolver and the Azure DNS Private Resolver are managed, zone-redundant forwarding services, and both providers recommend them over DNS servers on virtual machines. Oracle Cloud gives every virtual cloud network, or VCN, a dedicated resolver that does the same job.

None of the three is an authority for the agency's own namespaces, and neither AWS nor Azure signs private zones. Oracle Cloud is the one with no native DNS-layer filter for private DNS, so in a VCN the agency's policy applies only if queries are forwarded to agency resolvers.

And, as design guidance, run your own DNS servers in a cloud only for a stated reason. Part 2 covers that.`,
  "Evaluation page, \"The answer in brief\": Microsoft Learn hybrid DNS design; AWS What is Route 53 VPC Resolver?; Oracle Private DNS; AWS DNSSEC signing; Azure DNSSEC overview; Oracle Traffic Management Steering Policies.",
  `${EV}, "The answer in brief"; Book 08, Chapter 08, Decision 3.`);
}

// ================================================================== 4 Route 53 VPC Resolver
{
  const s = content("What", "AWS: what the Route 53 VPC Resolver answers");
  tag(s, "What");
  panel(s, "Every VPC", 0.6, 1.5, 6.9, 3.1, HEX.amber, HEX.amberTint, "THE RESOLVER IN EVERY VPC", null, [
    "Renamed Route 53 VPC Resolver when AWS introduced Route 53 Global Resolver; the VPC guide, the API, the GovCloud guide and the FedRAMP page still use the old name",
    "Reached at the VPC's base address plus two (VPC+2) and at 169.254.169.253",
    "Answers the VPC's own EC2 names and its associated private hosted zones; recurses for public names",
    "Answers only recursive queries; network ACLs and security groups can't filter traffic to it",
  ], 12);
  panel(s, "Quota", 7.65, 1.5, 5.1, 3.1, HEX.red, HEX.redTint, "THE QUOTA TO KNOW", null, [
    "1,024 packets per second per network interface to link-local services: DNS, instance metadata, time and Windows licensing together",
    "Can't be raised; traffic over it is rejected",
    "Matters to any DNS server on EC2 that forwards to VPC+2 (Part 2)",
  ], 12);
  panel(s, "Global", 0.6, 4.8, 12.15, 1.7, HEX.navy, "FFFFFF", "A DIFFERENT THING: ROUTE 53 GLOBAL RESOLVER", null, [
    "Generally available since March 2026: an internet-reachable anycast resolver (Do53, DoT and DoH) for authorized clients in branches and on-premises sites",
    "Resolves private hosted zones and filters malicious domains; listed in 30 commercial Regions and not in GovCloud",
  ], 12);
  sources(s, "Sources: AWS Route 53 Developer Guide, What is Route 53 VPC Resolver? and What is Route 53 Global Resolver?; VPC User Guide, Understanding Amazon DNS (Oct. 29, 2026).");
  say(s,
`Start with AWS. AWS renamed the Route 53 Resolver the Route 53 VPC Resolver when it introduced Route 53 Global Resolver. Several AWS pages still use the older name, so both appear in runbooks.

Every VPC reaches it at the VPC's base address plus two, called VPC plus two. It answers the VPC's own EC2 names and records in private hosted zones associated with the VPC, and it recurses for public names.

One quota matters. Each network interface may send 1,024 packets per second to link-local services, shared by DNS and other services. It can't be raised, and traffic over it is rejected. That matters to any DNS server on EC2 that forwards to VPC plus two.

Route 53 Global Resolver is a different thing, an internet-reachable resolver for branches and on-premises sites, listed in 30 commercial Regions and not in GovCloud.`,
  "AWS Route 53 Developer Guide, What is Route 53 VPC Resolver?; AWS VPC User Guide, Understanding Amazon DNS (link-local quota); What is Route 53 Global Resolver? and What's New, March 9, 2026. All accessed Oct. 29, 2026.",
  `${EV}, Part 1, "AWS: the Route 53 VPC Resolver".`);
}

// ================================================================== 5 Endpoints
{
  const s = content("What", "AWS: inbound and outbound endpoints");
  tag(s, "What");
  node(s, "Agency", 0.6, 1.55, 3.6, 1.3, HEX.navy, HEX.navyTint, "Agency resolvers", "On premises, or in another cloud", 12);
  node(s, "VPC", 9.15, 1.55, 3.6, 1.3, HEX.amber, HEX.amberTint, "VPC Resolver (VPC+2)", "Private hosted zones, EC2 names", 12);
  arrow(s, "In", 4.2, 1.9, 9.15, 1.9, HEX.navy);
  label(s, "In label", "Inbound endpoint: queries into the VPC", 4.3, 1.6, 4.75, HEX.navy);
  arrow(s, "Out", 9.15, 2.5, 4.2, 2.5, HEX.teal);
  label(s, "Out label", "Outbound endpoint: queries that match a forwarding rule", 4.3, 2.55, 4.75, HEX.teal);
  panel(s, "Inbound", 0.6, 3.1, 6.0, 3.4, HEX.navy, "FFFFFF", "INBOUND ENDPOINT", null, [
    "Resolvers outside forward queries in and get the answers that VPC sees, private hosted zones included",
    "At least two IP addresses in different Availability Zones (six by default)",
    "Up to 10,000 UDP queries per second per address; as few as 1,500 under connection tracking or behind a Network Load Balancer",
    "Do53, DoH and DoH-FIPS (FIPS 140-2), the last for inbound forward endpoints only",
    "A second type, the delegation inbound endpoint, answers NS delegations",
  ], 11.5);
  panel(s, "Outbound", 6.75, 3.1, 6.0, 3.4, HEX.teal, "FFFFFF", "OUTBOUND ENDPOINT", null, [
    "Sends queries that match a forwarding rule from the VPC to the agency's resolvers",
    "Do53 and DoH only, so no FIPS option outbound",
    "Needs Direct Connect, VPN or a NAT gateway",
    "Sharing a rule shares its outbound endpoint too",
  ], 11.5);
  sources(s, "Sources: AWS Route 53 Developer Guide, Resolving DNS queries between VPCs and your network; Considerations when creating endpoints; Quotas (Oct. 29, 2026).");
  say(s,
`Hybrid resolution in AWS runs through two kinds of endpoint.

An inbound endpoint lets outside resolvers forward queries into a VPC and get the answers it sees, private zones included. It has at least two addresses, in different Availability Zones. Each address handles up to 10,000 UDP queries per second, but as few as 1,500 under connection tracking. It speaks plain DNS, DNS over HTTPS, and a FIPS 140-2 version of DNS over HTTPS, inbound only. A second type, the delegation inbound endpoint, answers NS delegations.

An outbound endpoint goes the other way: it sends queries that match a forwarding rule from the VPC to the agency's resolvers. It speaks only plain DNS and DNS over HTTPS, so there's no FIPS option outbound. And sharing a rule shares its outbound endpoint too.`,
  "AWS Route 53 Developer Guide: Resolving DNS queries between VPCs and your network; Considerations when creating inbound and outbound endpoints; Quotas. Accessed Oct. 29, 2026.",
  `${EV}, Part 1, Route 53 VPC Resolver component table (inbound and outbound endpoints).`);
}

// ================================================================== 6 Rules, sharing, Profiles, private zones
{
  const s = content("What", "AWS: rules, sharing, Profiles and private zones");
  tag(s, "What");
  table(s, "Rules", 1.45, [2.2, 5.15, 4.8], ["Component", "What it does", "Limits and points to know"], [
    ["Forwarding rules", "One rule per domain, with target addresses; the most specific match wins, and a rule overrides a private hosted zone of the same name", "1,000 rules per Region; 6 targets per rule; a \".\" rule forwards almost everything"],
    ["System rules", "Carve a subdomain back out of a forwarding rule so it resolves locally; AWS also creates autodefined rules, reverse DNS among them", "The recursive Internet Resolver rule handles everything else and can't be deleted"],
    ["Delegation rules", "Forward queries whose answers carry NS records for a delegated subdomain to the agency's resolvers", "GovCloud availability conflicts (slide 8)"],
    ["Rule sharing (AWS RAM)", "Shares rules with accounts, OUs or the whole organization; receivers associate them but can't change or delete them", "Moving an account between OUs removes its associations unless the rule is shared with the new OU too"],
    ["Profiles", "Bundle private hosted zones, rules, DNS Firewall rule groups, interface endpoints and query log settings; share through RAM", "One Profile per VPC; local VPC settings win on an exact-name tie"],
    ["Private hosted zones", "Answered only inside associated VPCs; same-name public and private zones give split-view DNS", "300 VPCs per zone; cross-account association by API only; an empty match returns NXDOMAIN, no public fallback"],
  ], { fontSize: 11 });
  sources(s, "Sources: AWS Route 53 Developer Guide: rules; Managing forwarding rules; private hosted zones and cross-account association; Profiles; Quotas (Oct. 29, 2026).");
  say(s,
`Rules decide where queries go. A forwarding rule names one domain and its target addresses. The most specific matching rule wins, and a rule overrides a private hosted zone of the same name. A rule for the root, a single dot, forwards almost everything.

System rules carve a subdomain back out of a forwarding rule, so it resolves locally, and delegation rules handle delegated subdomains.

Rules are shared through AWS Resource Access Manager. The receiving account associates them with its VPCs but can't change or delete them. Profiles go further, bundling zones, rules, firewall rule groups and logging settings, one Profile per VPC.

Private hosted zones answer only inside associated VPCs, up to 300 per zone, and an empty match returns NXDOMAIN, with no fallback to public DNS.`,
  "AWS Route 53 Developer Guide: Using rules to control which queries are forwarded; Managing forwarding rules and sharing Resolver rules; Working with private hosted zones and considerations; cross-account association; What are Route 53 Profiles?; Quotas. Accessed Oct. 29, 2026.",
  `${EV}, Part 1, Route 53 VPC Resolver component table (rules, sharing, private hosted zones, Profiles).`);
}

// ================================================================== 7 DNS Firewall, query logging, DNSSEC
{
  const s = content("What", "AWS: DNS Firewall, query logging and DNSSEC");
  tag(s, "What");
  panel(s, "FW", 0.6, 1.5, 3.95, 5.0, HEX.red, HEX.redTint, "DNS FIREWALL", null, [
    "Rule groups of allow, alert and block rules; block answers NODATA, NXDOMAIN or a custom override",
    "Custom or AWS managed domain lists; managed lists can't be downloaded or browsed",
    "Advanced tier detects domain generation algorithms (DGA) and DNS tunneling",
    "Filters only queries that pass through the VPC Resolver, including those through inbound endpoints",
    "Fails closed (SERVFAIL) by default",
  ], 11.5);
  panel(s, "QL", 4.7, 1.5, 3.95, 5.0, HEX.navy, HEX.navyTint, "QUERY LOGGING", null, [
    "Queries from the VPC, through inbound and outbound endpoints, and DNS Firewall actions",
    "To CloudWatch Logs, S3 or Firehose",
    "Fields include query name and type, response code, answer, source address and source instance or endpoint",
    "Logs only queries that reach the VPC Resolver, not answers from its cache",
    "Configurations can be shared through RAM",
  ], 11.5);
  panel(s, "SEC", 8.8, 1.5, 3.95, 5.0, HEX.teal, HEX.tealTint, "DNSSEC", null, [
    "Validation of public signed names, enabled per VPC",
    "Signing of public hosted zones only, with the key-signing key in AWS KMS; no signing for private hosted zones",
    "The VPC Resolver ignores the DO and CD bits and returns no DNSSEC records and no AD bit, so a resolver behind it can't validate",
    "AWS warns enabling validation \"could result in an outage\"",
  ], 11.5);
  sources(s, "Sources: AWS Route 53 Developer Guide: DNS Firewall pages (actions, how it works, VPC configuration, managed lists, Advanced); Resolver query logging; DNSSEC validation and signing.");
  say(s,
`DNS Firewall applies rule groups of allow, alert and block rules. It uses custom or AWS managed domain lists, and the managed lists can't be browsed. The Advanced tier detects domain generation algorithms and DNS tunneling. It filters only queries that pass through the VPC Resolver, including those arriving through inbound endpoints, and by default it fails closed, with SERVFAIL.

Query logging records queries from the VPC, through the endpoints, and firewall actions, to CloudWatch Logs, S3 or Firehose. It logs only queries that reach the VPC Resolver, and not answers from its cache.

DNSSEC: the VPC Resolver can validate public signed names, enabled per VPC. Route 53 signs public hosted zones only. And the VPC Resolver returns no DNSSEC records, so a resolver behind it can't validate for itself. AWS warns that enabling validation could result in an outage.`,
  "AWS Route 53 Developer Guide: Using DNS Firewall; How Resolver DNS Firewall works; Rule actions; DNS Firewall VPC configuration; AWS Managed Domain Lists; DNS Firewall Advanced; Resolver query logging and its values; sharing query logging configurations; Enabling DNSSEC validation; Configuring DNSSEC signing. Accessed Oct. 29, 2026.",
  `${EV}, Part 1, Route 53 VPC Resolver component table (DNS Firewall, query logging, DNSSEC).`);
}

// ================================================================== 8 GovCloud
{
  const s = content("What", "AWS GovCloud (US) beside the commercial Regions");
  tag(s, "What");
  T(s, "Gov page", [
    { text: "AWS's GovCloud Route 53 page: ", options: { bold: true, color: HEX.navy } },
    { text: "public and private DNS in US-West and US-East; control plane in US-West; public zone queries \"answered from within FedRAMP boundary\"; no latency, geo or IP-based routing in private zones. It doesn't mention the Resolver features; other AWS pages do." },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.62, fontSize: 12 });
  table(s, "Gov", 2.15, [4.6, 1.9, 5.65], ["Capability (checked Oct. 29, 2026)", "Commercial", "AWS GovCloud (US)"], [
    ["Endpoints, forwarding and system rules", "Yes", "Yes: Resolver API endpoints in us-gov-east-1 and us-gov-west-1"],
    ["Resolver delegation", "Yes", { text: "Conflicting: GovCloud guide says not available; an April 8, 2026 announcement says it is. Confirm", options: { color: HEX.red, bold: true } }],
    ["DNS Firewall and AWS managed domain lists", "Yes", "Yes"],
    ["DNS Firewall Advanced", "Yes", "Dictionary DGA announced Nov. 2025; confirm the other protections"],
    ["Resolver query logging", "Yes", "Yes, since Sept. 2020 (the GovCloud guide doesn't list it)"],
    ["Route 53 Profiles", "Yes", "Yes, since June 2024"],
    ["DNSSEC signing of public hosted zones", "Yes", "Yes; the KMS key must be in GovCloud (US-West)"],
    ["DNSSEC validation in the VPC Resolver", "Yes", "Not stated on the GovCloud page; confirm"],
    ["Route 53 Global Resolver", "30 Regions", "Not listed"],
    ["VPC IPAM allocation from Infoblox", "Yes", "No (Book 08, Ch 07)"],
  ], { fontSize: 11, minRow: 0.3 });
  sources(s, "Sources: AWS GovCloud (US) User Guide, Route 53; Route 53 endpoints and quotas; What's New (Apr. 8, 2026; Nov. 17, 2025; Sept. 2020; June 4, 2024); Book 08, Ch 07.");
  say(s,
`What changes in GovCloud? AWS's GovCloud page for Route 53 says public and private DNS work in GovCloud US-West and US-East, the control plane is in US-West, and public hosted zone queries are answered from within the FedRAMP boundary. That page doesn't mention the Resolver features, so the table draws on other AWS pages.

Endpoints and rules: yes. Resolver delegation is the conflict: the GovCloud guide says it's not available, and an April 2026 announcement says it is. Confirm. DNS Firewall and its managed lists: yes. Of the Advanced protections, only dictionary DGA was announced for GovCloud; confirm the rest. Query logging and Profiles: yes. Signing of public zones: yes, with the key in US-West. Validation in the VPC Resolver isn't stated, so confirm. And Global Resolver isn't listed.`,
  "AWS GovCloud (US) User Guide, Amazon Route 53 in AWS GovCloud (US); AWS General Reference, Route 53 endpoints and quotas; AWS What's New, April 8, 2026 (delegation), November 17, 2025 (dictionary DGA), September 2020 (query logging), June 4, 2024 (Profiles); DNS Firewall availability and managed lists pages; Book 08, Chapter 07.",
  `${EV}, Part 1, "GovCloud (US) and commercial Regions, as AWS states it"; Book 08, Chapter 07.`);
}

// ================================================================== 9 Azure DNS Private Resolver
{
  const s = content("What", "Azure: the DNS Private Resolver");
  tag(s, "What");
  T(s, "Az lead", [
    { text: "Book 08, Chapter 07 ", options: { bold: true, color: HEX.navy } },
    { text: "covers the hub-and-spoke design, its subnets, limits, loop rules and an illustrative deployment. In summary, with today's limits:" },
  ], { x: 0.6, y: 1.45, w: 12.15, h: 0.46, fontSize: 12.5 });
  table(s, "Az", 2.0, [2.75, 4.7, 4.7], ["Component", "What it does", "Limits and points to know"], [
    ["Inbound endpoint", "Receives queries from on premises or other clouds and answers from private DNS zones linked to its virtual network", "Its own delegated subnet; static address recommended; 5 per resolver; 10,000 queries per second each"],
    ["Outbound endpoint and forwarding ruleset", "Sends queries for named domains to target servers; rulesets are linked to virtual networks", "1,000 rules per ruleset, 500 virtual network links, 6 targets per rule; one ruleset per virtual network; same region only"],
    ["Platform constraints", "—", "No virtual networks with encryption enabled, no IPv6-enabled subnets; one region per resolver, zone-redundant inside it"],
    ["Zone transfers", "—", "\"Azure DNS doesn't currently support zone transfers (AXFR/IXFR)\": a BIND server can't be a secondary of an Azure private zone, or the reverse"],
  ], { fontSize: 11.5 });
  callout(s, "Az note", 5.35, 1.15, "FaRoute", HEX.navy, "Not an authoritative server: ",
    "the Private Resolver is a recursive resolver and conditional forwarding service, so its inbound endpoint doesn't accept an ordinary NS delegation of a private zone.");
  sources(s, "Sources: Microsoft Learn: What is Azure DNS Private Resolver?; endpoints and rulesets; service limits; Reliability; Azure DNS FAQ; Architecture Center (Oct. 29, 2026).");
  say(s,
`Now Azure. Book 08's Chapter 07 covers the Private Resolver's hub-and-spoke design, so here is the summary with today's limits.

The inbound endpoint receives queries from on premises or other clouds and answers from private DNS zones linked to its virtual network. There can be five per resolver, at 10,000 queries per second each.

The outbound endpoint and its forwarding ruleset send queries for named domains to target servers; a ruleset holds up to 1,000 rules, and a virtual network links only one ruleset.

It's a single-region service, zone-redundant inside the region, and it doesn't work in encrypted virtual networks or IPv6-enabled subnets. And Azure DNS doesn't support zone transfers, so a BIND server can't be a secondary of an Azure private zone, or the reverse.`,
  "Microsoft Learn: What is Azure DNS Private Resolver?; Azure DNS Private Resolver endpoints and rulesets; Azure subscription and service limits; Reliability in Azure DNS Private Resolver; Azure DNS FAQ; Architecture Center, Azure DNS Private Resolver. Accessed Oct. 29, 2026.",
  `${EV}, Part 1, "Azure: the DNS Private Resolver and DNS resolver policy"; Book 08, Chapter 07, The Azure DNS Private Resolver in a hub-and-spoke network.`);
}

// ================================================================== 10 Azure resolver policy, logs, DNSSEC
{
  const s = content("What", "Azure: DNS resolver policy, logging and DNSSEC");
  tag(s, "What");
  panel(s, "Policy", 0.6, 1.5, 4.6, 5.0, HEX.red, HEX.redTint, "DNS RESOLVER POLICY", null, [
    "Formerly \"DNS security policy\"; the URL, the price meters and the Architecture Center still use the old name",
    "Filters and logs every query in a linked virtual network, public and private",
    "Allow, block and alert rules, with a Microsoft-managed threat intelligence list from MSRC",
    "One policy per virtual network, in the same region",
  ], 12);
  panel(s, "Logs", 5.35, 1.5, 3.85, 5.0, HEX.navy, HEX.navyTint, "LOGGING", null, [
    "Resolver policy logs go to Log Analytics (DNSQueryLogs), storage or Event Hubs through diagnostic settings",
    "The resolver and its rulesets have metrics: endpoint counts, queries per second",
    "Per-query logs come from a resolver policy, or Azure Firewall's DNS proxy, not from the resolver itself (inference)",
  ], 12);
  panel(s, "Sec", 9.35, 1.5, 3.4, 5.0, HEX.teal, HEX.tealTint, "DNSSEC", null, [
    "Public zones can be signed",
    "The Azure-provided resolver doesn't validate DNSSEC",
    "No Microsoft page describes signing private zones, or whether the Private Resolver validates: confirm",
  ], 12);
  sources(s, "Sources: Microsoft Learn: Overview of DNS resolver policy; Secure and view DNS traffic; Azure DNS monitoring data reference; DNSSEC overview; hybrid DNS design (Oct. 29, 2026).");
  say(s,
`Azure's DNS-layer filter is DNS resolver policy. Microsoft renamed it from DNS security policy, so expect both names.

A resolver policy filters and logs every query in a linked virtual network, public and private, with allow, block and alert rules. It includes a Microsoft-managed threat intelligence list from the Microsoft Security Response Center.

Its logs go to Log Analytics, in the DNS query logs table, or to storage or Event Hubs, through diagnostic settings. Microsoft lists resource logs only for resolver policies, so the inference is that per-query logs come from a resolver policy, or Azure Firewall's DNS proxy, not from the resolver itself.

DNSSEC: Azure can sign public zones, but the Azure-provided resolver doesn't validate. No Microsoft page describes signing private zones, or whether the Private Resolver validates, so confirm that.`,
  "Microsoft Learn: Overview of DNS resolver policy; Secure and view DNS traffic; Azure DNS monitoring data reference; DNSSEC overview (Azure DNS); Architecture Center, Design a hybrid DNS solution by using Azure. Accessed Oct. 29, 2026.",
  `${EV}, Part 1, Azure component table (DNS resolver policy, monitoring, DNSSEC).`);
}

// ================================================================== 11 Oracle VCN resolver
{
  const s = content("What", "Oracle Cloud: how the VCN resolver answers");
  tag(s, "What");
  subhead(s, "Order head", "THE VCN RESOLVER (169.254.169.254), CREATED WITH EACH VCN, ANSWERS IN THIS ORDER", 0.6, 1.45, 12.15, HEX.teal);
  const steps = [["1  Attached private views", "In order"], ["2  Its default view", "Next"], ["3  Resolver rules", "Forward to targets"], ["4  The internet", "Recursion and DNSSEC validation"]];
  steps.forEach((st, i) => {
    const x = 0.6 + i * 3.1;
    node(s, `Step ${i + 1}`, x, 1.85, 2.75, 1.0, HEX.teal, HEX.tealTint, st[0], st[1], 11.5);
    if (i < 3) arrow(s, `Step arrow ${i + 1}`, x + 2.75, 2.35, x + 3.1, 2.35, HEX.teal);
  });
  panel(s, "Trap", 0.6, 3.1, 6.0, 3.4, HEX.red, HEX.redTint, "A MATCH ENDS RESOLUTION", null, [
    "Even an NXDOMAIN from a view ends the sequence",
    "So a private zone for example.com hides a forwarding rule for onprem.example.com",
    "The resolver \"performs recursion to the internet and DNSSEC validation for DNSSEC-signed zones\"",
  ], 12);
  panel(s, "Views", 6.75, 3.1, 6.0, 3.4, HEX.navy, "FFFFFF", "PRIVATE ZONES AND VIEWS", null, [
    "Private zones are grouped into views; a view can be attached to any number of resolvers, sharing private DNS data across VCNs in the same region",
    "Same-name private and public zones give split-horizon DNS",
    "Between VCNs, in the same or another region, resolution uses resolver endpoints over a local or remote peering gateway",
  ], 12);
  sources(s, "Sources: Oracle Cloud Infrastructure Documentation, Private DNS; Troubleshooting DNS (Oct. 31, 2026); Book 08, Ch 07 (How each platform implements private DNS).");
  say(s,
`Oracle Cloud Infrastructure matters here because the HR platform runs on Oracle Cloud. Every VCN gets a dedicated resolver, listening on 169.254.169.254. It answers from the private views attached to it, in order, then its default view, then its resolver rules, then the internet. Oracle says it performs recursion to the internet and DNSSEC validation for signed zones.

The trap is in that order. A match in the sequence ends resolution, even an NXDOMAIN. So a private zone for example dot com hides a forwarding rule for onprem dot example dot com.

Views can be attached to many resolvers, sharing private DNS data across VCNs in a region. Same-name private and public zones give split-horizon DNS. Between VCNs, resolution uses resolver endpoints over a peering gateway.`,
  "Oracle Cloud Infrastructure Documentation: Private DNS; Troubleshooting DNS. Accessed Oct. 31, 2026. Book 08, Chapter 07.",
  `${EV}, Part 1, "Oracle Cloud: the VCN resolver"; Book 08, Chapter 07, How each platform implements private DNS.`);
}

// ================================================================== 12 Oracle endpoints, rules, gaps
{
  const s = content("What", "Oracle Cloud: endpoints, rules and what's missing");
  tag(s, "What");
  table(s, "OCI", 1.45, [2.6, 4.75, 4.8], ["Component", "What it does", "Limits and points to know"], [
    ["Listening endpoint", "Receives queries from on premises or other VCNs", "One IP address in the subnet; security rules for UDP and TCP port 53"],
    ["Forwarding endpoint and resolver rules", "Sends queries that no view answers to target servers", "Two IP addresses; up to 50 rules; match a client block, a domain (up to 10 each) or None, which matches any query; forward is the only action; first match wins; an unreachable target ends processing"],
    ["Custom resolver (DHCP option)", "Sends a subnet's instances to up to three DNS servers of the agency's choosing", "Private views and rules are reached only if 169.254.169.254 is in the list; otherwise internet names only"],
    ["DNS-layer policy", { text: "None native: steering policies apply only to public DNS; no Oracle page describes a DNS firewall or response policy for the VCN resolver", options: { color: HEX.red, bold: true } }, "—"],
    ["Logging", "Private resolver query and response logs through OCI Logging, with each query's resolution path", "Documented for the commercial realms only"],
    ["Resilience", "May answer from stale cache (RFC 8767), 30-second TTL, for up to 24 hours", "No published query rate for 169.254.169.254"],
  ], { fontSize: 11 });
  sources(s, "Sources: Oracle Cloud Infrastructure Documentation: Private DNS; Creating a Resolver Rule; DNS in a VCN; Troubleshooting DNS; Traffic Management; Private DNS Logs (Oct. 30–31, 2026).");
  say(s,
`A listening endpoint receives queries from on premises or other VCNs. A forwarding endpoint sends queries no view answers to targets, under up to 50 resolver rules. A rule matches a client address block, a domain, or None, which matches any query. Forward is the only action, the first match wins, and an unreachable target ends processing.

A subnet's DHCP options can name a custom resolver of up to three DNS servers. Those instances reach private views and rules only if 169.254.169.254 is in that list.

Then the gaps. There's no native DNS-layer policy: no Oracle page describes a DNS firewall for the VCN resolver. Private resolver logs, with each query's resolution path, are documented for the commercial realms only. And the resolver can serve stale answers for up to 24 hours.`,
  "Oracle Cloud Infrastructure Documentation: Private DNS; Creating a Resolver Rule; DNS in a Virtual Cloud Network; Troubleshooting DNS; Traffic Management Steering Policies; Private DNS Logs. Accessed Oct. 30 and 31, 2026.",
  `${EV}, Part 1, Oracle Cloud component table.`);
}

// ================================================================== 13 Who: AWS and Azure scope
{
  const s = content("Who", "Who authorizes it: AWS and Azure FedRAMP scope");
  tag(s, "Who");
  panel(s, "AWS scope", 0.6, 1.5, 6.0, 5.0, HEX.amber, HEX.amberTint, "AWS", null, [
    "Services-in-scope page (Oct. 15, 2026): one row, Amazon Route 53, in scope for FedRAMP Class C (formerly Moderate) in US East/West and Class D (formerly High) in GovCloud",
    "No separate rows for the VPC Resolver, DNS Firewall or Profiles; generally available features are in scope unless specifically excluded",
    "FedRAMP Marketplace: AWS US East/West at Moderate, AWS GovCloud at High; both cover the DNS service for a Moderate workload",
    "The Resolver features are covered by AWS's general statement, not a row of their own: worth noting in the SSP (inference)",
  ], 12);
  panel(s, "Azure scope", 6.75, 1.5, 6.0, 5.0, HEX.navy, HEX.navyTint, "AZURE", null, [
    "Audit-scope page (Feb. 2026): one DNS row, FedRAMP High in Azure and in Azure Government; no separate row for the Private Resolver or resolver policy",
    "No Learn page states their Azure Government availability; the products-by-region table shows no Azure Government regions",
    "The retail price list carries Private Resolver meters in US Gov zones (Oct. 1, 2024) and resolver policy meters (June 1, 2026)",
    "A meter is a strong signal, not an availability statement: confirm in the target region before design (inference)",
  ], 12);
  sources(s, "Sources: AWS Services in Scope, FedRAMP; FedRAMP Marketplace products.json; Microsoft Learn compliance scope; Products by region; Azure Retail Prices API (Oct. 29, 2026).");
  say(s,
`Who authorizes all this?

AWS's services-in-scope page, updated October fifteenth, 2026, lists one row, Amazon Route 53, in scope for FedRAMP Class C, formerly Moderate, in US East and West, and Class D, formerly High, in GovCloud. There are no separate rows for the Resolver features; generally available features are in scope unless excluded. For a Moderate civilian workload, both locations cover the DNS service. As an inference, note that in the system security plan.

Microsoft's audit-scope page has one DNS row, at FedRAMP High in Azure and in Azure Government, with no separate row for the Private Resolver or resolver policy. No Learn page states their Azure Government availability. The price list carries their meters in the US Gov zones: a strong signal, not an availability statement. Confirm in the target region.`,
  "AWS Services in Scope by Compliance Program: FedRAMP (updated Oct. 15, 2026); FedRAMP Marketplace products.json; Microsoft Learn, services compliance scope (Feb. 2026); Products available by region and Compare Azure Government and global Azure; Azure Retail Prices API. Accessed Oct. 29, 2026.",
  `${EV}, Part 1, "FedRAMP scope" (AWS) and "Azure Government and FedRAMP scope".`);
}

// ================================================================== 14 Who: Oracle US Government Cloud
{
  const s = content("Who", "Who authorizes it: Oracle US Government Cloud");
  tag(s, "Who");
  panel(s, "OC2", 0.6, 1.5, 6.0, 5.0, HEX.teal, HEX.tealTint, "AS ORACLE AND FEDRAMP STATE IT", null, [
    "US Government Cloud: realm OC2, with US Gov East (Ashburn) and US Gov West (Phoenix); FedRAMP High authorization",
    "Its tenancies \"can't subscribe to the commercial regions\"",
    "Its DNS API is \"for private DNS only\"; public DNS isn't available in the government realms",
    "FedRAMP Marketplace: Oracle Cloud Infrastructure-Government Cloud, FedRAMP Certified at High (JAB, Oct. 2020); no commercial OCI infrastructure listing",
    "Oracle's SaaS has its own listings, such as Fusion Cloud at Moderate",
  ], 12);
  panel(s, "OCI inf", 6.75, 1.5, 6.0, 5.0, HEX.navy, "FFFFFF", "WHAT FOLLOWS (INFERENCE)", null, [
    "A Moderate system on OCI infrastructure inherits from the Government Cloud's High authorization",
    "Commercial OCI regions have no FedRAMP listing of their own, so a federal system there needs its own authorization basis, settled before design",
    "Private resolver logging in the government realm isn't documented: confirm with Oracle",
    "An agency holding only the HR platform's SaaS has no VCN: the HR platform is a public name, and the work is keeping agency resolvers' path to it consistent (Book 08, Ch 07)",
  ], 12);
  sources(s, "Sources: Oracle, US Government Cloud with FedRAMP Authorization; FedRAMP Marketplace products.json (Oct. 31, 2026); Private DNS Logs; Book 08, Ch 07.");
  say(s,
`Oracle's government cloud works differently. The US Government Cloud is its own realm, called OC2, with US Gov East in Ashburn and US Gov West in Phoenix, and it holds a FedRAMP High authorization. And its DNS API is for private DNS only; public DNS isn't available in the government realms.

The FedRAMP Marketplace lists the Government Cloud at High, and no commercial Oracle infrastructure offering. Oracle's software-as-a-service has its own listings, such as Fusion Cloud at Moderate.

So, as inferences. A Moderate system on OCI infrastructure inherits from the Government Cloud's High authorization. Commercial OCI regions have no FedRAMP listing of their own, so a federal system placed there needs its own authorization basis, settled before design. Whether private resolver logging exists in the government realm isn't documented; confirm with Oracle. And an agency holding only the HR platform's software-as-a-service has no VCN at all.`,
  "Oracle Cloud Infrastructure Documentation, Oracle Cloud Infrastructure US Government Cloud with FedRAMP Authorization; FedRAMP Marketplace products.json (dataset of Oct. 31, 2026); Private DNS Logs; Book 08, Chapter 07.",
  `${EV}, Part 1, "Oracle US Government Cloud and FedRAMP scope"; Book 08, Chapter 07.`);
}

// ================================================================== 15 How: meeting on-premises DNS
{
  const s = content("How", "How the three resolvers meet on-premises DNS");
  tag(s, "How");
  node(s, "Onprem", 0.6, 1.6, 2.9, 3.05, HEX.navy, HEX.navyTint, "Agency resolvers", "On premises and in other clouds; they hold the agency's namespaces and policy", 12);
  const cx = 5.15, cw = 3.85, ch = 1.0, cys = [1.5, 2.6, 3.7];
  const clouds = [
    ["AWS", "In: inbound endpoint. Out: outbound endpoint + forwarding rules"],
    ["Azure", "In: inbound endpoint. Out: outbound endpoint + ruleset"],
    ["Oracle Cloud", "In: listening endpoint. Out: forwarding endpoint + resolver rules"],
  ];
  clouds.forEach((c, i) => {
    node(s, `Cloud ${c[0]}`, cx, cys[i], cw, ch, HEX.amber, HEX.amberTint, c[0], c[1], 11);
    const yc = cys[i] + ch / 2;
    arrow(s, `Cloud in ${i + 1}`, 3.5, yc - 0.13, cx, yc - 0.13, HEX.navy);
    arrow(s, `Cloud out ${i + 1}`, cx, yc + 0.13, 3.5, yc + 0.13, HEX.teal);
  });
  T(s, "Legend", [
    { text: "→ ", options: { bold: true, color: HEX.navy } }, { text: "cloud namespaces forwarded in   ", options: { color: HEX.ink } },
    { text: "← ", options: { bold: true, color: HEX.teal } }, { text: "agency namespaces forwarded out", options: { color: HEX.ink } },
  ], { x: 0.6, y: 4.8, w: 8.4, h: 0.32, fontSize: 10.5 });
  panel(s, "Rules", 9.25, 1.5, 3.5, 3.6, HEX.navy, "FFFFFF", "THE RULES (DESIGN GUIDANCE)", null, [
    "Book 08's Decision 3 holds them",
    "Static endpoint addresses, written once",
    "For Azure, each private endpoint service's public zone too",
  ], 11.5);
  T(s, "Points", [
    { text: "No ordinary NS delegation: ", options: { bold: true, color: HEX.red } },
    { text: "neither the AWS nor the Azure inbound endpoint accepts one for a private zone; AWS's delegation inbound endpoint is the new exception.", options: { breakLine: true } },
    { text: "One policy object: ", options: { bold: true, color: HEX.teal } },
    { text: "on AWS, create the rules once in a network account and share them through RAM or a Profile, so spokes associate them and can't edit them (design guidance)." },
  ], { x: 0.6, y: 5.25, w: 12.15, h: 1.25, fontSize: 12, paraSpaceAfter: 4 });
  sources(s, "Sources: Evaluation page, \"How each meets on-premises DNS\"; AWS Resolving queries between VPCs and your network; Managing forwarding rules; Profiles; Azure Architecture Center.");
  say(s,
`How do the three meet on-premises DNS? The same way, and Book 08's Decision 3 already holds the rules, as design guidance.

Into the cloud: on-premises resolvers, and other clouds' resolvers, conditionally forward each cloud namespace to that cloud's inbound endpoint, using static addresses written once. On Oracle Cloud, the entry point is a listening endpoint. Neither the AWS nor the Azure inbound endpoint accepts an ordinary NS delegation of a private zone; AWS's delegation inbound endpoint is the exception, and it's new.

Out of the cloud: each cloud forwards the agency's namespaces back to the agency resolvers, by its rules.

On AWS, create the rules once in a network account and share them through Resource Access Manager or a Profile. Spokes associate them and can't edit them. That's the cloud form of one policy object.`,
  "Evaluation page, \"How each meets on-premises DNS and the policy plane\": AWS Resolving DNS queries between VPCs and your network; Managing forwarding rules; What are Route 53 Profiles?; Microsoft Architecture Center, Azure DNS Private Resolver; Oracle Private DNS.",
  `${EV}, Part 1, "How each meets on-premises DNS and the policy plane"; Book 08, Chapter 08, Decision 3.`);
}

// ================================================================== 16 How: Protective DNS, policy, logs
{
  const s = content("How", "How Protective DNS, policy and logs reach each cloud");
  tag(s, "How");
  panel(s, "PDNS", 0.6, 1.5, 4.0, 5.0, HEX.red, HEX.redTint, "INTERNET-BOUND QUERIES", null, [
    "CISA requires Protective DNS for all egress DNS resolution",
    "Cloud deployments use it upstream \"either directly or via a SASE/SSE solution,\" or use agency DNS as their upstream",
    "No native resolver forwards the default path there on its own: that takes a \".\" rule (AWS, Azure) or a None rule (Oracle) to the agency resolvers",
    "Whether cloud egress already reaches Protective DNS another way: confirm with CISA",
  ], 11.5);
  panel(s, "Pol", 4.75, 1.5, 4.0, 5.0, HEX.navy, HEX.navyTint, "POLICY", null, [
    "DNS Firewall and DNS resolver policy are each cloud's own DNS-layer filter",
    "They're useful, but a second policy surface beside the agency's response policy zones",
    "Feed them from the same indicator decisions, or use them as a backstop, so a block on premises is a block in each cloud (design guidance)",
    "Oracle has none for private DNS: its catch-all rule is the only way agency policy reaches a VCN (inference)",
  ], 11.5);
  panel(s, "Log", 8.9, 1.5, 3.85, 5.0, HEX.teal, HEX.tealTint, "LOGS", null, [
    "Route 53 query logs, Azure resolver policy logs and Oracle private resolver logs",
    "To the SIEM, beside the agency resolvers' logs",
    "Parsed through ASIM's DNS schema, as Book 12 does for every DNS source",
  ], 11.5);
  sources(s, "Sources: CISA Encrypted DNS Implementation Guidance (Apr. 2024); Oracle Creating a Resolver Rule; Evaluation page, \"How each meets on-premises DNS\"; Book 12, Ch 05.");
  say(s,
`First, internet-bound queries. CISA requires Protective DNS for all egress DNS resolution, including from agency cloud deployments, directly or through agency DNS. None of the native resolvers forwards the default path to Protective DNS on its own. That takes a root rule in AWS or Azure, or a rule whose condition is None in Oracle Cloud, pointing at the agency resolvers. Whether cloud egress already reaches it some other way is for the agency to confirm with CISA.

Second, policy. The clouds' own filters are a second policy surface beside the agency's response policy zones. The design guidance: feed them from the same indicator decisions, or use them as a backstop, so a block on premises is also a block in each cloud. Oracle has no such filter for private DNS, so its catch-all rule is the only way agency policy reaches a VCN.

Third, logs: all three go to the SIEM, parsed through ASIM's DNS schema, as Book 12 does.`,
  "CISA Encrypted DNS Implementation Guidance, v1.0, April 2024 (Agency Cloud Deployments); Oracle Creating a Resolver Rule; evaluation page, \"How each meets on-premises DNS and the policy plane\"; Book 12, Chapter 05.",
  `${EV}, Part 1, "How each meets on-premises DNS and the policy plane"; Book 12, Chapter 05 — From Log Warehouse to Detection.`);
}

// ================================================================== 17 How: confirm, and Part 2
{
  const s = content("How", "What to confirm, and what Part 2 covers");
  tag(s, "How");
  panel(s, "Confirm", 0.6, 1.5, 6.0, 5.0, HEX.red, "FFFFFF", "OPEN POINTS TO CONFIRM", null, [
    "AWS: Resolver delegation in GovCloud, where AWS's own pages conflict; DNSSEC validation in GovCloud",
    "Azure: Private Resolver and resolver policy availability in each Azure Government region; whether the Private Resolver validates DNSSEC",
    "Oracle: private resolver logging in the government realm; whether the VCN resolver passes DNSSEC data to a resolver behind it",
    "CISA: whether Protective DNS returns DNSSEC data to agency forwarders",
  ], 12);
  panel(s, "Part 2", 6.75, 1.5, 6.0, 3.3, HEX.amber, HEX.amberTint, "PART 2: BIND AND THE FEDERAL FIT", null, [
    "When to run your own DNS servers in a cloud: vNIOS or BIND",
    "BIND on AWS, Azure and Oracle Cloud: roles, forwarding, DNSSEC, response policy zones, logging, patching",
    "The seven-question alignment checklist, and the federal mapping",
  ], 12);
  panel(s, "Proved", 6.75, 4.95, 6.0, 1.55, HEX.navy, HEX.navyTint, "TO MOVE THE PAGE TO PROVED", null, [
    "Build the forwarder pattern in a test account in each target Region and realm, and run Book 08's Chapter 10 validation matrix from every origin",
  ], 12);
  sources(s, "Sources: Evaluation page, \"Status and review\" (open points) and \"What it covers\"; Book 08, Ch 10.");
  say(s,
`To close Part 1, here's what the providers don't settle, so confirm it with them.

AWS: Resolver delegation and DNSSEC validation in GovCloud. Azure: the Private Resolver's and resolver policy's availability in each Azure Government region, and whether the Private Resolver validates DNSSEC. Oracle: private resolver logging in the government realm, and whether the VCN resolver passes DNSSEC data to a resolver behind it. And CISA: whether Protective DNS returns DNSSEC data to agency forwarders.

To prove the page, the plan is to build the pattern in test accounts and run Book 08's Chapter 10 validation matrix.

Part 2 picks up from here: when to run your own DNS servers, BIND, the alignment checklist, and the federal mapping. This is research under review, not an endorsement by any federal agency. Thank you.`,
  "Evaluation page, \"Status and review\" (open points to confirm; path to Proved) and \"What it covers\"; Book 08, Chapter 10.",
  `${EV}, "Status and review"; Book 08, Chapter 10 — validation matrix.`);
}

// ================================================================== Backup
backup("Sources: labels, open points and full source lists on the following slides. AWS and Microsoft checked Oct. 29, 2026; Oracle Oct. 30–31, 2026.");
{
  const s = content("Backup", "Labels, scope and open points (Part 1)");
  table(s, "Labels", 1.45, [2.6, 9.55], ["Label or point", "Meaning on these slides"], [
    ["(design guidance)", "The program's recommendation, not a provider statement"],
    ["(inference)", "A conclusion the sources support but don't state"],
    ["confirm", "A point the providers don't document; the agency settles it with them before design"],
    ["Scope", "FedRAMP Moderate civilian agencies; AWS commercial and GovCloud (US), Azure and Azure Government, and Oracle's commercial and US Government realms are all candidate places for Moderate workloads; authorization is checked per service and per region"],
    ["AWS open points", "Resolver delegation in GovCloud (the GovCloud guide and an Apr. 8, 2026 announcement conflict); DNSSEC validation in GovCloud; DNS Firewall Advanced protections other than dictionary DGA in GovCloud"],
    ["Azure open points", "Private Resolver and resolver policy availability per Azure Government region (price meters only); Private Resolver DNSSEC validation; private zone signing"],
    ["Oracle open points", "Private resolver logging in the government realm; whether the VCN resolver passes DNSSEC records and the AD bit to a resolver behind it"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: Evaluation page, \"Sources, labels and scope\" and \"Status and review\"; verification log (claims marked confirm).");
}
srcSlide("Sources: AWS (Part 1)", [
  "Amazon Route 53 Developer Guide: What is Route 53 VPC Resolver?  ·  Resolving DNS queries between VPCs and your network  ·  Considerations when creating inbound and outbound endpoints  ·  Quotas  ·  Using rules to control which queries are forwarded  ·  Managing forwarding rules (sharing Resolver rules).",
  "Amazon Route 53 Developer Guide: Using DNS Firewall  ·  How Resolver DNS Firewall works  ·  Rule actions in DNS Firewall  ·  DNS Firewall VPC configuration  ·  AWS Managed Domain Lists  ·  DNS Firewall Advanced  ·  DNS Firewall availability.",
  "Amazon Route 53 Developer Guide: Resolver query logging  ·  Values that appear in VPC Resolver query logs  ·  Sharing query logging configurations  ·  Working with private hosted zones, and considerations  ·  Cross-account association  ·  What are Route 53 Profiles?  ·  Enabling DNSSEC validation  ·  Configuring DNSSEC signing  ·  What is Route 53 Global Resolver?",
  "Amazon VPC User Guide, Understanding Amazon DNS (VPC+2, 169.254.169.253, the 1,024 packets-per-second link-local quota).",
  "AWS GovCloud (US) User Guide, Amazon Route 53 in AWS GovCloud (US)  ·  AWS General Reference, Route 53 endpoints and quotas.",
  "AWS What's New: Route 53 Global Resolver GA (Mar. 9, 2026)  ·  Resolver endpoints support delegation in GovCloud (Apr. 8, 2026)  ·  dictionary DGA protection (Nov. 17, 2025)  ·  Resolver query logging in GovCloud (Sept. 2020)  ·  Route 53 Profiles in GovCloud (June 4, 2024).",
  "AWS Services in Scope by Compliance Program: FedRAMP (updated Oct. 15, 2026)  ·  FedRAMP Marketplace, products.json (AWS US East/West Moderate; AWS GovCloud High).",
  "All AWS sources accessed Oct. 29, 2026, as footnoted on the evaluation page.",
], "Sources: the evaluation page's footnotes (cdns-r53-*, cdns-vpc-dns, cdns-gov-r53, cdns-aws-fedramp, cdns-fedramp-mkt).");
srcSlide("Sources: Microsoft and Oracle (Part 1)", [
  "Microsoft Learn: What is Azure DNS Private Resolver?  ·  Azure DNS Private Resolver endpoints and rulesets  ·  Azure subscription and service limits  ·  Reliability in Azure DNS Private Resolver  ·  Azure DNS FAQ (zone transfers).",
  "Microsoft Learn: Overview of DNS resolver policy  ·  Secure and view DNS traffic  ·  Azure DNS monitoring data reference  ·  DNSSEC overview (Azure DNS).",
  "Microsoft Learn, Azure Architecture Center: Design a hybrid DNS solution by using Azure  ·  Azure DNS Private Resolver.",
  "Microsoft Learn: services compliance scope (Feb. 2026)  ·  Compare Azure Government and global Azure  ·  Microsoft, Products available by region  ·  Azure Retail Prices API (US Gov meters). Accessed Oct. 29, 2026.",
  "Oracle Cloud Infrastructure Documentation: Private DNS  ·  Creating a Resolver Rule  ·  Troubleshooting DNS  ·  DNS in a Virtual Cloud Network  ·  Traffic Management Steering Policies  ·  Private DNS Logs  ·  Oracle Cloud Infrastructure US Government Cloud with FedRAMP Authorization. Accessed Oct. 30–31, 2026.",
  "FedRAMP Marketplace, products.json (dataset of Oct. 31, 2026): Oracle Cloud Infrastructure-Government Cloud (High, JAB); Fusion Cloud (Moderate).",
], "Sources: the evaluation page's footnotes (cdns-az-*, cdns-oci-*).");
srcSlide("Sources: CISA and the workbook (Part 1)", [
  "CISA, Encrypted DNS Implementation Guidance, v1.0, April 2024 (Agency Cloud Deployments; Protective DNS as the upstream). Accessed Oct. 29, 2026.",
  "CISA, Protective Domain Name System (DNS) Resolver. Accessed Oct. 29, 2026.",
  "Evaluation: Cloud DNS on AWS, Azure and Oracle Cloud: Native Resolvers, Infoblox and BIND (in review), and its verification log.",
  "Book 08 — DNS, DHCP & IPAM: Chapter 07 (Cloud Private Endpoints, SDN and IPAM Consistency), Chapter 08 (Reference Architecture; Decisions 2 and 3), Chapter 10 (validation matrix).",
  "Book 12, Chapter 05 — From Log Warehouse to Detection (ASIM DNS schema).",
  "Evaluation: Trinzic Alone, or Trinzic Plus Cloud DDI? (options A, B and C).",
], "Sources: the evaluation page's footnotes (cdns-cisa-*, cdns-b08-c07) and the workbook pages it links.");

finish(OUT);
