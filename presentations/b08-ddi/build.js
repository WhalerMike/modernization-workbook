// Book 08 — DNS, DHCP & IPAM: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b08-ddi/build.js presentations/b08-ddi/B08_DDI.pptx
// Every fact comes from a footnoted chapter of docs/books/b08-ddi/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 08", title: "DNS, DHCP & IPAM" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B08_DDI.pptx";

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
// Small arrow between the boxes of a flow line.
const arrow = (s, name, x, y) => txt(s, name, "›", { x, y, w: 0.3, h: 0.75, fontSize: 28, bold: true, color: HEX.slate, align: "center", valign: "middle" });

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why DNS", "Why Is DNS Now the Control Plane?", "Book 08 — DNS, DHCP & IPAM");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 08 of the Federal Modernization Workbook, DNS, DHCP and IPAM: governing the name and address layer as one control plane across the data center, every cloud and the branch edge.

I'll take four questions: why DNS is now the control plane, what has to change, who owns it, and how to migrate and run it.

The short version: every connection starts with a name, so whoever governs the name layer governs the enterprise.`,
  "Book 08, index; Chapter 01 — DNS Is Now the Control Plane.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why DNS", "DNS now does six jobs it was never designed for");
  tag(s, "Why");
  const jobs = [["Private endpoints", "Private answer inside, public outside"], ["SaaS front doors", "The answer picks the endpoint"],
    ["Security policy", "Blocks before the connection is made"], ["Certificate checks", "OCSP and CRL are DNS names"],
    ["Service identity", "Policy names the FQDN, not the IP"], ["Application surface", "A wildcard declares a namespace"]];
  txt(s, "Jobs head", "WHAT THE ANSWER TO A QUERY NOW DECIDES", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  jobs.forEach((j, i) => {
    const y = 1.92 + i * 0.56;
    box(s, `Job ${i}`, 0.6, y, 6.2, 0.48, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Job ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h: 0.48, fontSize: 14, valign: "middle" });
  });
  box(s, "Platforms box", 7.1, 1.55, 5.65, 3.65, HEX.amberTint);
  icon(s, "FaCubes", 7.35, 1.75, 0.72, HEX.amber);
  txt(s, "Platforms head", [
    { text: "HOW MOST AGENCIES STILL RUN IT", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Five platforms, no shared state", options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "Platforms list", bullets([
    "Active Directory DNS or an on-premises DDI grid",
    "Amazon Route 53",
    "Azure DNS and Azure Private DNS",
    "Google Cloud DNS",
    "VMware NSX DNS forwarder",
  ], 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
  callout(s, "One plane", 5.45, 1.05, "FaSitemap", HEX.red, "One authoritative policy plane: ",
    "DNS, DHCP and IPAM governed as one control plane that propagates state to every resolution surface. An architectural requirement, not a product.");
  sources(s, "Sources: OMB M-08-23; NIST SP 800-81 Rev. 3; Microsoft Learn — Azure Storage private endpoints, Microsoft 365 endpoints. Book 08, Chapter 01.");
  narrate(s,
`Why is DNS now the control plane? OMB said it back in 2008: almost every network connection begins with a DNS query. What has changed is how much the answer decides.

In a hybrid multi-cloud agency, DNS does six jobs its designers never anticipated. It publishes private endpoints: one storage name answers privately inside its network and publicly everywhere else. It selects which SaaS front door a user reaches. It enforces security policy, blocking a known-bad domain before the connection is made. It carries certificate validation, because OCSP responders and CRL distribution points are DNS names. It's the stable service identity that Zero Trust policy is written against. And a wildcard declares a whole namespace of applications.

NIST's 2026 deployment guide says DNS has become more than a service; it's a security control. Yet most agencies run it on as many as five platforms that share no state. The answer is one authoritative DDI policy plane, a requirement rather than a product.`,
  "Book 08, Chapter 01 — DNS Is Now the Control Plane.");
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why DNS", "Split-brain DNS fails quietly, as something else");
  tag(s, "Why");
  const forms = [
    ["FaCloud", "Private-IP split-brain", HEX.navy, HEX.navyTint,
      "An EC2 instance gets an Azure private endpoint's private address only through a forwarding rule. Without it, the name resolves to the public address. Microsoft puts roughly 70% of private-endpoint 403 errors down to that."],
    ["FaGlobe", "SaaS split-brain", HEX.teal, HEX.tealTint,
      "GCC uses the Worldwide endpoint list, so the risk is path consistency: a stale forwarder, or a browser sending DoH to a public resolver. GCC High and DoD have their own .us namespaces."],
    ["FaShieldHalved", "Policy split-brain", HEX.red, HEX.redTint,
      "A block applies only on the resolver that answers. If the cloud resolvers' rules were never created or have drifted, the posture is the weakest resolver a client can reach."],
  ];
  forms.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Form ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Form head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    txt(s, `Form text ${i + 1}`, c[4], { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14 });
  });
  callout(s, "Structure", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "Process can't fix structure: ",
    "the failure is silent, the change rate outruns any runbook, and every system has its own API and timing. Only a control plane that holds the policy objects keeps them in step.");
  sources(s, "Sources: Microsoft Learn — Private Endpoint DNS, private-endpoint 403 troubleshooting, Microsoft 365 endpoints; NIST SP 800-81 Rev. 3. Book 08, Chapter 02.");
  narrate(s,
`Run those platforms independently and you get split-brain DNS: the same name returning different answers depending on where the query starts. Designed split-horizon is fine. The problem is unintentional drift between systems with no shared state.

It takes three forms. Private-IP split-brain: an EC2 instance gets an Azure private endpoint's private address only through a Route 53 forwarding rule. If the rule is missing or stale, the name still resolves, to the public address. Microsoft attributes roughly 70 percent of private-endpoint access-denied cases to exactly that. SaaS split-brain: GCC uses the Worldwide endpoint list, so the risk is path consistency, a stale forwarder or browser DoH to a public resolver. And security-policy split-brain: a block applies only on the resolver that answers, so the posture is the weakest resolver a client can reach.

The failure is silent, the change rate outruns any manual process, and every system has its own timing. Only a control plane that holds the policy objects keeps them in step.`,
  "Book 08, Chapter 02 — Split-Brain DNS: The Structural Problem.");
}

// ------------------------------------------------------------------ Why 3
{
  const s = D.content("Why DNS", "The mandates name no product, but describe one layer");
  tag(s, "Why");
  const rows = [
    ["OMB M-22-09 (January 2022)", "Encrypted DNS wherever technically supported; endpoints set to agency-designated resolvers"],
    ["CISA encrypted DNS guidance (May 2024)", "Protective DNS for all egress DNS resolution, citing 6 U.S.C. § 663 note"],
    ["OMB M-26-14 (May 2026)", "Logs of source and destination address, port and session; searchable 6 months, retrievable 1 year"],
    ["OMB M-08-23; SP 800-53", "DNSSEC: sign agency zones (SC-20) and validate on resolvers (SC-21)"],
    ["TIC 3.0 catalog v3.3 (September 2026)", "Five DNS capabilities: sinkholing, DNSSEC validation and signing, domain monitoring, Protective DNS"],
  ];
  s.addTable([head(["Source", "What it requires of the name layer"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([2.6, 5.0], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.62, 0.62, 0.62, 0.62, 0.62] }));
  box(s, "NIST box", 8.45, 1.5, 4.3, 3.5, HEX.navyTint);
  icon(s, "FaBook", 8.7, 1.68, 0.6, HEX.navy);
  txt(s, "NIST head", "NIST SP 800-81 Rev. 3", { x: 9.45, y: 1.68, w: 3.2, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "NIST list", bullets([
    "Final March 19, 2026; supersedes SP 800-81-2",
    "Guidance, not a mandate",
    "Protective DNS, encryption, DNSSEC, dedicated servers",
    "Block DoT, DoH and DoQ to unauthorized resolvers",
  ], 13), { x: 8.7, y: 2.42, w: 3.9, h: 2.5, paraSpaceAfter: 6 });
  callout(s, "FedRAMP", 5.2, 1.25, "FaLandmark", HEX.navy, "FedRAMP certifies a service, not an architecture: ",
    "the agency still authorizes its own DDI system. A cloud-delivered policy plane is an external dependency; resolvers in data centers, branches and cloud tenants stay inside the agency's boundary.");
  sources(s, "Sources: NIST SP 800-81 Rev. 3; OMB M-22-09, M-26-14, M-08-23; CISA Encrypted DNS Implementation Guidance; TIC 3.0 Catalog v3.3; FedRAMP. Book 08, Chapter 03.");
  narrate(s,
`The federal mandates never name a product, but together they describe a governed name layer. It's worth being precise about who requires what.

OMB M-22-09 requires encrypted DNS wherever it's technically supported, with endpoints explicitly configured to use agency-designated resolvers. It also notes that DNS must already be routed through CISA-operated infrastructure. The requirement that all egress resolution go through Protective DNS comes from CISA's own guidance, which cites the statute. OMB M-26-14, which rescinded M-21-31 in May 2026, doesn't name DNS, but it requires logs that show source and destination addresses, protocols, ports and sessions, searchable for six months and retrievable for a year. M-08-23 and SP 800-53 carry DNSSEC. And version 3.3 of the TIC 3.0 catalog, published in September 2026, lists five DNS capabilities, from sinkholing to Protective DNS.

NIST SP 800-81 Revision 3, final on March 19, 2026, is the practical guide to all of this: guidance, not a mandate. And FedRAMP certifies a cloud service, not an architecture; the agency still authorizes its own DDI system.`,
  "Book 08, Chapter 03 — Federal Requirements: NIST SP 800-81, FedRAMP and Zero Trust.");
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What changes", "Entra ID inherits none of what AD DNS does");
  tag(s, "What");
  const parts = [["Locator records", "SRV records that Netlogon registers"], ["Secure dynamic update", "GSS-TSIG; the DHCP credential decides trust"],
    ["Conditional forwarders", "Easy to list, hard to justify"], ["GlobalNames, reverse, signed", "Each moves by its own method"],
    ["The internal namespace", "Nothing creates it by default"]];
  txt(s, "Parts head", "WHAT AD-INTEGRATED DNS DOES FOR A DOMAIN", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  parts.forEach((p, i) => {
    const y = 1.92 + i * 0.66;
    box(s, `Part ${i}`, 0.6, y, 6.2, 0.56, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Part ${i} text`, [{ text: `${p[0]}   `, options: { bold: true, color: HEX.navy } }, { text: p[1] }],
      { x: 0.8, y, w: 5.9, h: 0.56, fontSize: 14, valign: "middle" });
  });
  box(s, "Entra box", 7.1, 1.55, 5.65, 3.65, HEX.tealTint);
  icon(s, "FaPlugCircleXmark", 7.35, 1.75, 0.72, HEX.teal);
  txt(s, "Entra head", [
    { text: "WHAT MICROSOFT ENTRA ID DOES NOT CARRY", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Identities move; the records don't", options: { bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "Entra list", bullets([
    "No zones and no locator records",
    "Hybrid-joined devices still look for a domain controller",
    "Kerberos pockets keep their DNS dependencies",
    "Entra Domain Services adds a DNS authority of its own",
  ], 14.5), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
  callout(s, "Locators last", 5.45, 1.05, "FaServer", HEX.navy, "Locator records move last: ",
    "they live only where domain controllers can register them securely, on AD DNS or a DDI platform that accepts GSS-TSIG, until the last DC goes. Everything else moves zone by zone.");
  sources(s, "Sources: Microsoft Learn — DNS and AD DS, DC locator, dynamic update, Entra Domain Services DNS; RFC 3645 (GSS-TSIG). Book 08, Chapter 04.");
  narrate(s,
`What has to change starts with Active Directory. For twenty years AD has been the hidden DNS service of the on-premises network: a domain's name becomes a zone, and every domain-joined machine points at the domain controllers for all of its resolution.

Netlogon on each domain controller registers the SRV locator records that clients use to find LDAP, Kerberos and the global catalog. Secure dynamic update keeps those records current. Forwarders, GlobalNames, reverse and signed zones each need a decision.

Microsoft Entra ID inherits none of it. It hosts no zones and publishes no locator records, yet hybrid-joined devices still look for a domain controller, and Entra Domain Services adds a DNS authority of its own.

So the locator records stay where domain controllers can register them securely, on AD DNS or a DDI platform that accepts GSS-TSIG updates, until the last domain controller goes. Everything else moves zone by zone, once it's inventoried.`,
  "Book 08, Chapter 04 — The Active Directory DNS Departure.");
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What changes", "Three ways a query escapes the governed path");
  tag(s, "What");
  const cols = [
    ["FaRoute", "The SD-WAN edge", HEX.navy, HEX.navyTint, ["redirect-dns sends branch DNS to one resolver", "IPv4 and UDP only; TCP DNS isn't redirected", "Target: an agency resolver, never a loopback agent", "SASE resolvers forward behind it"]],
    ["FaLock", "Encrypted DNS", HEX.teal, HEX.tealTint, ["DoT and DoQ on port 853: block except to approved resolvers", "DoH on 443: govern it at the endpoint", "Windows DoH policy; Edge and Chrome DoH mode", "IPsec isn't a substitute, per CISA"]],
    ["FaUserXmark", "Rogue DHCP", HEX.red, HEX.redTint, ["Option 6 moves a whole subnet at once", "Rogue IPv6 router advertisements do the same", "AD authorization stops only Windows DHCP servers", "DHCP snooping and RA Guard close the gap"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Path col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Path head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Path text ${i + 1}`, bullets(c[4], 13.5), { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, paraSpaceAfter: 6 });
  });
  callout(s, "Silent", 5.3, 1.2, "FaTriangleExclamation", HEX.red, "None of them raises an alarm: ",
    "the client gets a normal-looking answer and the agency resolver logs nothing. So the program also alerts on hosts whose queries never reach the governed resolvers.");
  sources(s, "Sources: Cisco Catalyst SD-WAN redirect DNS; CISA Encrypted DNS Implementation Guidance; NIST SP 800-81 Rev. 3; MITRE ATT&CK T1557.003; RFC 6105. Book 08, Chapter 05.");
  narrate(s,
`Every control in the policy plane assumes the query reaches it. Three ordinary mechanisms decide whether it does, and none of them reports when it doesn't.

First, the edge. Cisco Catalyst SD-WAN's redirect-dns action, as one example, sends branch DNS to a policy-designated resolver, IPv4 and UDP only. It must be a network-addressable agency resolver, not a loopback agent on the device, and any SASE resolver belongs behind it.

Second, encrypted DNS. DNS over TLS and DNS over QUIC use port 853, so block them except to approved resolvers. DNS over HTTPS shares port 443 with all web traffic, so it's governed at the endpoint: Windows DoH policy, the Edge and Chrome DoH mode, and an NXDOMAIN answer for Firefox's canary domain.

Third, rogue DHCP. One rogue server handing out its own resolver in option 6 moves a whole subnet at once, and rogue IPv6 router advertisements do the same. AD authorization doesn't stop them; DHCP snooping and RA Guard on the switches do.`,
  "Book 08, Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP.");
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What changes", "Every certificate check starts with a DNS lookup");
  tag(s, "What");
  const steps = [["1   Name", "Resolves to the authentic endpoint"], ["2   Certificate", "SAN, OCSP and CRL, CAA, ACME dns-01"],
    ["3   Policy", "FQDN-based ZTNA and app networking"], ["4   Token", "Reaches the right sign-in endpoint"]];
  txt(s, "Chain head", "THE TRUST CHAIN STARTS WITH A LOOKUP", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  steps.forEach((p, i) => {
    const y = 1.92 + i * 0.8;
    box(s, `Step ${i}`, 0.6, y, 6.2, 0.66, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Step ${i} text`, [{ text: `${p[0]}   `, options: { bold: true, color: HEX.navy } }, { text: p[1] }],
      { x: 0.8, y, w: 5.9, h: 0.66, fontSize: 15, valign: "middle" });
  });
  box(s, "DNSSEC box", 7.1, 1.55, 5.65, 3.65, HEX.tealTint);
  icon(s, "FaFileShield", 7.35, 1.75, 0.72, HEX.teal);
  txt(s, "DNSSEC head", [
    { text: "THE PROGRAM'S DNSSEC POSITION", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Validate under agency control", options: { bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "DNSSEC list", bullets([
    "Sign external zones and .gov delegations, always",
    "Validate on every agency resolver, with the root trust anchor",
    "Sign internal zones only where the authorization requires it",
    "Azure DNS and Route 53 sign public zones only",
  ], 14), { x: 7.35, y: 2.75, w: 5.25, h: 2.4, paraSpaceAfter: 6 });
  callout(s, "Cert split-brain", 5.45, 1.05, "FaKey", HEX.red, "It looks like a PKI failure: ",
    "if a CRL name exists only in AD DNS, an AWS workload can't resolve it, the revocation check fails, and the ticket is opened against PKI. Decision 5 exists for this.");
  sources(s, "Sources: NIST SP 800-81 Rev. 3; SP 800-53 SC-20 and SC-21; RFC 8555, RFC 4033; Microsoft Learn — Azure DNSSEC; AWS Route 53 DNSSEC. Book 08, Chapter 06.");
  narrate(s,
`A certificate can be valid, unrevoked and issued for the right name, and still fail, because every check that makes it trustworthy starts with a DNS lookup: the endpoint, the revocation endpoints, the FQDN that policy names, and the sign-in endpoint for the token's cloud.

If an agency CRL name exists only in AD DNS, a workload in AWS can't resolve it without a forwarding rule. The revocation check fails, the ticket is opened against PKI, and the root cause can take days to find.

DNSSEC adds origin authentication and integrity, not encryption. The program's position follows NIST: sign external zones and the dot-gov delegations, always. Validate on every agency resolver, with the root trust anchor. And sign internal zones only where the system's authorization requires it; NIST calls internal signing of limited value for most organizations. Validation stays on agency resolvers because Azure DNS and Route 53 sign public zones only, and the default Azure resolver doesn't validate.`,
  "Book 08, Chapter 06 — DNS Identity, Certificates and DNSSEC.");
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What changes", "Forward the public zone to one point in Azure");
  tag(s, "What");
  const rows = [
    ["Storage (blob)", "blob.core.windows.net", "privatelink.blob.core.windows.net"],
    ["Azure SQL Database", "database.windows.net", "privatelink.database.windows.net"],
    ["Key Vault", "vault.azure.net, vaultcore.azure.net", "privatelink.vaultcore.azure.net"],
    ["App Service", "azurewebsites.net", "privatelink.azurewebsites.net"],
    ["Azure Government", "Its own names, such as", "privatelink.database.usgovcloudapi.net"],
  ];
  s.addTable([head(["Service", "Forward from every origin", "Private zone Azure answers from"]),
    ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: i === 4 ? HEX.red : HEX.navy } }, { text: r[1], options: { bold: i < 4, color: i < 4 ? HEX.teal : HEX.ink } }, { text: r[2], options: { fontSize: i === 4 ? 11.5 : 12.5 } }])],
    tableOpts([1.95, 2.65, 3.45], { y: 1.5, fontSize: 12.5, rowH: [0.42, 0.55, 0.55, 0.6, 0.55, 0.55] }));
  box(s, "Resolver box", 8.85, 1.5, 3.9, 3.55, HEX.navyTint);
  icon(s, "FaServer", 9.1, 1.68, 0.6, HEX.navy);
  txt(s, "Resolver head", "DNS Private Resolver", { x: 9.85, y: 1.68, w: 2.8, h: 0.6, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Resolver list", bullets([
    "A recursive bridge: forward to it, never delegate",
    "Dedicated subnet, static inbound address",
    "No ruleset linked where its inbound target lives",
    "A resolver per region, both in every forwarder",
  ], 13), { x: 9.1, y: 2.42, w: 3.5, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "IPAM", 5.25, 1.25, "FaAddressBook", HEX.teal, "IPAM is the authority for address blocks: ",
    "AWS VPC IPAM can allocate from an external IPAM in commercial Regions, not GovCloud; on Azure and Google Cloud, mirror the reservations and reconcile. Names and addresses need the same plane.");
  sources(s, "Sources: Microsoft Learn — Private Endpoint DNS integration and zone values, DNS Private Resolver, endpoints and rulesets; AWS VPC IPAM. Book 08, Chapter 07.");
  narrate(s,
`Azure private endpoints are the commonest source of private-IP split-brain.

When a private endpoint is created, Azure writes its A record into a privatelink zone, and public DNS carries a CNAME into that name. The private answer comes back only when the query reaches a resolver linked to the zone. So every origin, on-premises, the other clouds and the branch path, forwards the service's public zone, such as database.windows.net, to the DNS Private Resolver's inbound endpoint. Not the privatelink zone. Azure Government uses different zone names, so commercial rules don't carry over.

The Private Resolver is a recursive bridge, not an authority: reach it by forwarding, never by delegation. Give each endpoint a dedicated subnet and a static address, avoid ruleset loops, and deploy one per region.

Addresses need the same discipline, with the enterprise IPAM as the authority for address blocks. AWS VPC IPAM can allocate from an external IPAM in commercial Regions, but not in GovCloud; on Azure and Google Cloud, mirror the reservations and reconcile.`,
  "Book 08, Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency.");
}

// ------------------------------------------------------------------ What 5
{
  const s = D.content("What changes", "One governed path, five decisions that fail silently");
  tag(s, "What");
  const flow = ["Branch client", "SD-WAN edge", "Agency resolver", "DDI policy plane", "Cloud zones · Protective DNS"];
  flow.forEach((f, i) => {
    const x = 0.6 + i * 2.49;
    box(s, `Flow ${i}`, x, 1.5, 2.2, 0.75, i === 2 || i === 3 ? HEX.navyTint : HEX.grey);
    txt(s, `Flow ${i} text`, f, { x: x + 0.08, y: 1.5, w: 2.04, h: 0.75, fontSize: 14, bold: true, color: HEX.navy, align: "center", valign: "middle" });
    if (i < flow.length - 1) arrow(s, `Flow arrow ${i}`, x + 2.2, 1.5);
  });
  const dec = [
    ["redirect-dns target", "A network-addressable agency resolver, never a loopback agent"],
    ["Chain order", "The agency resolver first; SASE and others are its forwarders"],
    ["Cloud forwarding", "The plane holds every per-cloud rule, pushed to every resolver"],
    ["AD DNS inventory", "Reconciled before any domain controller goes"],
    ["OCSP and CRL", "Resolve from on-premises, every cloud and every branch"],
  ];
  dec.forEach((d, i) => {
    const x = 0.6 + i * 2.4625;
    box(s, `Decision ${i + 1}`, x, 2.5, 2.3, 2.6, HEX.amberTint);
    txt(s, `Decision ${i + 1} text`, [
      { text: `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 26, fontFace: "Cambria", breakLine: true } },
      { text: d[0], options: { bold: true, color: HEX.navy, fontSize: 15, breakLine: true } },
      { text: d[1], options: { fontSize: 13 } },
    ], { x: x + 0.15, y: 2.6, w: 2.0, h: 2.4, paraSpaceAfter: 4 });
  });
  callout(s, "Check", 5.3, 1.2, "FaClipboardCheck", HEX.red, "Each fails silently: ",
    "the query still resolves, just outside policy or to the wrong address. Check each one in the running configuration, not the design document, before the next SD-WAN or DDI change.");
  sources(s, "Sources: CISA Protective DNS Resolver; Cisco Catalyst SD-WAN redirect DNS; Microsoft Learn — Private Endpoint DNS integration; AWS Route 53. Book 08, Chapter 08.");
  narrate(s,
`A branch client's query passes the SD-WAN edge to an agency-controlled resolver, then the DDI policy plane, with its response policy zones, DNSSEC, IPAM and forwarding rules, then the per-cloud private zones. Internet-bound recursion leaves through CISA's Protective DNS.

Five decisions carry almost all of the operational risk. One: the redirect-dns target is a network-addressable agency resolver. Two: the agency resolver is the first hop, and any other resolver is its forwarder. Three: the policy plane holds every per-cloud conditional forwarding rule. Four: AD DNS is inventoried and reprovisioned before any domain controller goes. Five: OCSP and CRL endpoints resolve from every origin.

Each fails silently: the query still resolves, just outside policy or to the wrong address. So each comes with a check, run in the live configuration rather than the design document, before the next SD-WAN or DDI change.`,
  "Book 08, Chapter 08 — Reference Architecture and the Five Critical Decisions.");
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who decides, who does the work for DNS, DHCP and IPAM");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Sponsor and CIO", "Platform model; AD DNS retirement"], ["CISO and ISSO", "Resolvers, transports, DNSSEC, logging"], ["Authorizing official", "Cloud plane authorization; exceptions"]]],
    ["FaUsersGear", "Do", HEX.teal, HEX.tealTint, [["DNS/DDI team", "Runs the plane; decides edge targets"], ["Network engineering", "redirect-dns, DHCP relay, RA Guard"], ["AD admins and cloud teams", "AD inventory; cloud DNS as consumers"]]],
    ["FaPeopleArrows", "Consulted and support", HEX.amber, HEX.amberTint, [["Security operations", "Protective DNS alerts, RPZ hits, logs"], ["Application owners", "Request names; accept cutover windows"], ["Help desk", "Auditor role and runbooks; no writes"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.5, 3.95, 2.75, c[3]);
    icon(s, c[0], x + 0.22, 1.63, 0.56, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 0.95, y: 1.63, w: 2.9, h: 0.56, bold: true, color: c[2], fontSize: 18, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.3, w: 3.55, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  });
  txt(s, "Classes head", "THREE CLASSES OF RECORD CHANGE, AND WHO APPROVES EACH", { x: 0.6, y: 4.42, w: 12, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const cls = [
    ["Standard", "pre-approved: A, AAAA, CNAME and TXT in a delegated namespace, written by a scoped account", HEX.teal],
    ["Policy-driven", "no per-change approval: private endpoint records and DHCP updates; the policy is change-controlled", HEX.navy],
    ["High-impact", "change board: zones, NS and DS, forwarding, SRV, apex, MX, wildcards and response policy", HEX.red],
  ];
  cls.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Class ${i + 1}`, x, 4.8, 3.95, 1.6, "FFFFFF", c[2]);
    txt(s, `Class ${i + 1} text`, [{ text: `${c[0]} — `, options: { bold: true, color: c[2] } }, { text: c[1] }],
      { x: x + 0.22, y: 4.88, w: 3.55, h: 1.44, fontSize: 14, valign: "middle" });
  });
  sources(s, "Sources: Microsoft Learn — DNS zones, DnsAdmins, Private Link and DNS at scale; NIST SP 800-37 Rev. 2; OMB M-22-09; CISA. Book 08, Chapter 09.");
  narrate(s,
`Who owns it? In an AD estate, DNS belonged to whoever ran the domain controllers; DnsAdmins has full control of every zone by default. A single policy plane concentrates that authority, so its owners have to be named on purpose, one decider per decision.

The sponsor and CIO decide the platform model and when AD DNS and Windows DHCP retire. The CISO and ISSO set the requirements: designated resolvers, allowed transports, DNSSEC and logging. The authorizing official accepts residual risk, including every standing exception.

The DNS/DDI team runs the policy plane and decides what the edge points at; network engineering configures it. AD administrators own the inventory until AD DNS retires, and cloud teams run their DNS as consumers of the plane.

Record changes come in three classes. Standard changes inside a delegated namespace are pre-approved. Policy-driven records, like private endpoint entries, need no per-change approval, but the policy itself is change-controlled. High-impact changes, zones, delegations, forwarding, SRV, wildcards and response policy, go to the change board.`,
  "Book 08, Chapter 09 — Who Owns DNS, DHCP and IPAM.");
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "Six phases, one cutover loop, rollback at every step");
  tag(s, "How");
  const rows = [
    ["1 Inventory", "Zones, SRV, forwarders, scopes, edge", "A dated, committed export"],
    ["2 Coexist", "New resolvers, sync, two-way forwarding", "Both directions resolve"],
    ["3 Migrate authority", "Zones, scopes, client waves, the edge", "Every wave clean"],
    ["4 Federate clouds", "Discovery, IPAM, private endpoints", "Every origin passes"],
    ["5 Decommission", "AD DNS and Windows DHCP", "30 days SRV, 90 parallel"],
    ["6 Harden", "Protective DNS, encrypted DNS, DNSSEC", "Evidence checklist done"],
  ];
  s.addTable([head(["Phase", "What moves", "Closes when"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { bold: i === 4, color: i === 4 ? HEX.red : HEX.ink } }])],
    tableOpts([2.05, 3.55, 2.6], { y: 1.5, fontSize: 12.5, rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  box(s, "Loop box", 9.05, 1.5, 3.7, 3.4, HEX.tealTint);
  icon(s, "FaArrowsRotate", 9.3, 1.68, 0.6, HEX.teal);
  txt(s, "Loop head", "The cutover loop", { x: 10.05, y: 1.68, w: 2.6, h: 0.6, bold: true, color: HEX.teal, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  txt(s, "Loop list", bullets([
    "TTL to 300 seconds, 48 hours ahead",
    "Dry run; skip SOA, apex NS and locator records",
    "Validate from every origin",
    "Switch, hold and observe",
    "The old authority answers until proven",
  ], 13), { x: 9.3, y: 2.42, w: 3.3, h: 2.45, paraSpaceAfter: 5 });
  callout(s, "Rollback", 5.15, 1.35, "FaTriangleExclamation", HEX.red, "Unlinking is not a safe rollback: ",
    "removing a VNet link from an Azure Private DNS zone deletes the records autoregistered through it, and Microsoft says they can't be restored. Plan the rollback for those zones before the change.");
  sources(s, "Sources: Microsoft Learn — DnsServer and DhcpServer modules, Azure Private DNS FAQ, Azure DNS FAQ, DNS Private Resolver. Book 08, Chapter 10.");
  narrate(s,
`How do you get there? In six phases: inventory, coexist, migrate authority, federate the clouds, decommission AD DNS and DHCP, then harden and evidence. Each phase ends with a rollback point and a resolution test from every origin, not a calendar date.

Every move of authority, whether a zone, a forwarder, a DHCP scope or a wave of clients, runs the same loop. Lower the TTL to 300 seconds at least 48 hours ahead. Import with a dry run, never moving the SOA, apex NS or AD locator records. Validate from every origin. Switch, then hold and observe, while the old authority keeps answering.

In Azure Private DNS, removing a virtual network link deletes the records autoregistered through it, and Microsoft says they can't be restored. So unlinking is safe only for zones without autoregistration.

Decommissioning is gated, never scheduled: the inventory reconciles, every critical SRV record resolves for 30 consecutive days, 90 days of parallel operation pass cleanly, failover is tested, and the old servers are idle.`,
  "Book 08, Chapter 10 — The Migration Sequence.");
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Operate it as one plane, and keep the evidence");
  tag(s, "How");
  const ops = [
    ["FaSitemap", "Scoped delegation", "Each division's zones, IP spaces and DHCP scopes, with manager, operator and auditor roles", HEX.navy],
    ["FaCodeBranch", "One API, one audit trail", "Automation accounts in the same scopes: infrastructure as code, ITSM, ACME DNS-01", HEX.teal],
    ["FaChartLine", "Continuous checks", "SRV every 15 minutes from every site and VNet; drift and hygiene reports", HEX.amber],
  ];
  txt(s, "Ops head", "DIVISIONS KEEP AUTONOMY UNDER ONE AUTHORITY", { x: 0.6, y: 1.5, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  ops.forEach((r, i) => {
    const y = 1.9 + i * 1.08;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[3]);
    txt(s, `Op ${i}`, [{ text: r[1], options: { bold: true, color: r[3], fontSize: 16.5, breakLine: true } }, { text: r[2], options: { fontSize: 14 } }], { x: 1.4, y, w: 5.6, h: 1.0 });
  });
  box(s, "Logging box", 7.35, 1.5, 5.4, 3.6, HEX.navyTint);
  icon(s, "FaFileShield", 7.6, 1.68, 0.62, HEX.navy);
  txt(s, "Logging head", "The M-26-14 logging floor", { x: 8.4, y: 1.68, w: 4.2, h: 0.62, bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Logging list", bullets([
    "Source and destination address, port and session in the logs",
    "Searchable 6 months, retrievable for a year",
    "Readily available to the top-level SOC",
    "Lease history ties each query to a device",
  ], 14), { x: 7.6, y: 2.45, w: 5.0, h: 2.6, paraSpaceAfter: 6 });
  callout(s, "Checklist", 5.3, 1.25, "FaListCheck", HEX.amber, "The evidence checklist opens with the five decisions: ",
    "redirect targets, chain order, cloud forwarding, the AD DNS inventory, and OCSP and CRL reachability; then Protective DNS, IPAM inventory, retained logs and role reviews.");
  sources(s, "Sources: OMB M-26-14; NIST SP 800-53 Rev. 5; Microsoft Learn — DNS logging and diagnostics, Azure DNS monitoring, DNS resolver policy. Book 08, Chapter 11.");
  narrate(s,
`Once it's running, one policy plane is only an improvement if divisions can still run their own networks through it. So each division gets a scope covering its own zones, IP spaces and DHCP scopes, with manager, operator and auditor roles, and automation accounts are held to the same scopes. Infrastructure as code, ITSM workflows and ACME DNS-01 certificate automation all go through one API and one audit trail.

Locator records are resolved every 15 minutes from every site and virtual network until the last domain controller retires. Drift reports compare the source of truth with every copy, and hygiene jobs catch stale records and dangling CNAMEs.

The evidence floor is M-26-14. It doesn't name DNS, but it requires logs that show source and destination addresses, ports and sessions, searchable for six months and retrievable for a year, and readily available to the agency's top-level security operations center. Query logs, encrypted queries included, and DHCP lease history with MAC and IP addresses are how the name layer meets it. The lease history is what turns an address into a device.`,
  "Book 08, Chapter 11 — Operating the Control Plane: Delegation, Automation and Evidence.");
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "Choose on evidence, price the meters, record the risk");
  tag(s, "How");
  const rows = [["Private Resolver inbound endpoint", "$180.00 a month"], ["Private Resolver outbound endpoint", "$180.00 a month"],
    ["Forwarding ruleset", "$2.50 a month"], ["Hub with one of each, per region", "about $362.50 a month"]];
  s.addTable([head(["Azure meter", "List price"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: i === 3 ? HEX.amber : HEX.ink } }])],
    tableOpts([3.75, 2.35], { y: 1.5, fontSize: 14, rowH: [0.45, 0.52, 0.52, 0.52, 0.52] }));
  txt(s, "Table note", "Azure Retail Prices API list prices, US commercial, retrieved October 20, 2026, before discounts; a second region doubles the hub. Commercial DDI licensing is quoted per agency and isn't published.",
    { x: 0.6, y: 4.1, w: 6.1, h: 0.95, fontSize: 12, italic: true, color: HEX.slate });
  box(s, "Auth box", 7.0, 1.5, 5.75, 3.55, HEX.navyTint);
  icon(s, "FaLandmark", 7.25, 1.68, 0.62, HEX.navy);
  txt(s, "Auth head", "Authorization is per offering", { x: 8.05, y: 1.68, w: 4.6, h: 0.62, bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Auth list", bullets([
    "Example: Infoblox Government Cloud, FedRAMP Certified at Moderate since December 15, 2022",
    "BlueCat, EfficientIP: no listing; run inside the agency boundary",
    "A Moderate authorization doesn't cover GCC High or DoD",
    "Confirm status on the Marketplace at decision time",
  ], 13.5), { x: 7.25, y: 2.45, w: 5.35, h: 2.55, paraSpaceAfter: 6 });
  callout(s, "Residual", 5.25, 1.25, "FaScaleBalanced", HEX.red, "Residual risk stays on the record: ",
    "sync lag becomes the new source of divergence; a management-plane outage blocks changes while resolution continues locally; and encrypted DNS bypass remains wherever endpoint controls are incomplete.");
  sources(s, "Sources: Azure Retail Prices API; FedRAMP Marketplace dataset; Infoblox, BlueCat and EfficientIP documentation. Book 08, Chapters 03, 08 and 12.");
  narrate(s,
`Choose the platform on the evidence it produces for your own boundary.

Commercial DDI licensing is quoted per agency, so get every quote on the same assumptions. The cloud-native pieces have public meters, and appear in every model. Azure DNS Private Resolver charges per endpoint: 180 dollars a month for each inbound endpoint and each outbound endpoint, plus 2 dollars 50 per ruleset. A hub with one of each is about 362 dollars 50 a month per region, and a second region doubles it.

Authorization belongs to an offering, not a vendor. As one example, Infoblox Government Cloud has been FedRAMP Certified at Moderate since December 15, 2022. BlueCat and EfficientIP have no Marketplace listing, so they run inside the agency's boundary. And a Moderate authorization doesn't cover GCC High or DoD.

Some risk remains. Sync lag becomes the new source of divergence. A management-plane outage blocks changes, though resolution continues from local state. And encrypted DNS bypass stays possible wherever endpoint controls are incomplete.`,
  "Book 08, Chapter 12 — Platform Selection, Cost and Residual Risk; Chapters 03 and 08.");
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaSitemap", "Authorize one policy plane", "A single authoritative DDI policy plane, with a named owner", HEX.navy, HEX.navyTint],
    ["FaListCheck", "Settle the five decisions", "Within 90 days, with residual risk reported to the AO", HEX.teal, HEX.tealTint],
    ["FaScaleBalanced", "Choose the platform on evidence", "Authorization at the right level; quotes on the same assumptions", HEX.amber, HEX.amberTint],
    ["FaUserCheck", "Name the owners", "One decider per row; the DNS/DDI team decides the edge target", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Next step — Phase 1, Inventory: ",
    "export every AD DNS zone, SRV record, forwarder and DHCP scope, every redirect-dns target and every OCSP and CRL endpoint, before touching a domain controller. Book 08 has the detail, every claim footnoted.");
  sources(s, "Sources: FedRAMP Marketplace; Microsoft Learn — DnsServer and DhcpServer modules; NIST SP 800-37 Rev. 2. Book 08, Chapters 01, 08, 09, 10 and 12.");
  narrate(s,
`So, four decisions.

Authorize a single authoritative DDI policy plane, and assign an owner, typically the enterprise architecture or network operations lead.

Have that owner settle the five configuration decisions within 90 days, and report the residual risk to the authorizing official.

Choose the platform model on evidence: authorization at the right impact level, and quotes on the same assumptions.

And name the owners, one decider per row, with the DNS/DDI team deciding what every branch edge points at.

The next step is Phase 1, the inventory: export every AD DNS zone, SRV record, conditional forwarder and DHCP scope, and every redirect-dns target and revocation endpoint, before anyone touches a domain controller. It's read-only, and it's the one step whose omission can't be repaired later.

Govern the name layer as one plane, and it can carry the cloud, branch and identity transitions. Book 08 has the detail, every claim footnoted. Thank you.`,
  "Book 08, Chapters 01, 08, 09, 10 and 12; Appendices B and C.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "NIST SP 800-81 Rev. 3, Secure DNS Deployment Guide (final March 19, 2026).  ·  SP 800-53 Rev. 5 (SC-20, SC-21, SC-22, AU-2, CM-8).  ·  SP 800-37 Rev. 2; SP 800-207.",
    "OMB M-22-09 (encrypted DNS); M-26-14 (logging baseline and retention; rescinded M-21-31); M-08-23 (DNSSEC); M-21-07 (IPv6).",
    "CISA: Encrypted DNS Implementation Guidance (May 16, 2024); Protective DNS Resolver; TIC 3.0 Security Capabilities Catalog v3.3 (September 2026); get.gov domain management.",
    "Microsoft Learn: DNS and AD DS; DC locator; dynamic update; DNSSEC; Windows DoH client and server; Zero Trust DNS; DHCP failover; DnsServer and DhcpServer modules; Entra Domain Services DNS.",
    "Microsoft Learn: Private Endpoint DNS integration and zone values; Azure Private DNS and FAQ; DNS Private Resolver, endpoints and rulesets; DNS resolver policy; Azure DNS monitoring.  ·  Azure Retail Prices API.",
    "AWS: Route 53 VPC Resolver, DNS Firewall, DNSSEC signing and validation; VPC IPAM and Infoblox integration.  ·  Google Cloud DNS server and response policies.  ·  VMware NSX DNS forwarder.",
    "Cisco Catalyst SD-WAN redirect DNS and Umbrella integration.  ·  FedRAMP Marketplace dataset.  ·  IETF RFCs 1034, 2136, 3645, 4033, 6105, 8484, 9250, 9525.  ·  MITRE ATT&CK T1557.003.",
    "Full footnotes with links and access dates: Book 08, every chapter (whalermike.github.io/modernization-workbook/docs/books/b08-ddi/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

console.log(`narration: ${spoken} spoken words, about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
