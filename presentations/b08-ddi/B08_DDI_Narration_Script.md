# Book 08 — DNS, DHCP & IPAM — narration script (practice copy)

## Slide 1 — Why Is DNS Now the Control Plane?

This briefing comes from Book 08 of the Federal Modernization Workbook, DNS, DHCP and IPAM: governing the name and address layer as one control plane across the data center, every cloud and the branch edge.

I'll take four questions: why DNS is now the control plane, what has to change, who owns it, and how to migrate and run it.

The short version: every connection starts with a name, so whoever governs the name layer governs the enterprise.

## Slide 2 — DNS now does six jobs it was never designed for

Why is DNS now the control plane? OMB said it back in 2008: almost every network connection begins with a DNS query. What has changed is how much the answer decides.

In a hybrid multi-cloud agency, DNS does six jobs its designers never anticipated. It publishes private endpoints: one storage name answers privately inside its network and publicly everywhere else. It selects which SaaS front door a user reaches. It enforces security policy, blocking a known-bad domain before the connection is made. It carries certificate validation, because OCSP responders and CRL distribution points are DNS names. It's the stable service identity that Zero Trust policy is written against. And a wildcard declares a whole namespace of applications.

NIST's 2026 deployment guide says DNS has become more than a service; it's a security control. Yet most agencies run it on as many as five platforms that share no state. The answer is one authoritative DDI policy plane, a requirement rather than a product.

## Slide 3 — Split-brain DNS fails quietly, as something else

Run those platforms independently and you get split-brain DNS: the same name returning different answers depending on where the query starts. Designed split-horizon is fine. The problem is unintentional drift between systems with no shared state.

It takes three forms. Private-IP split-brain: an EC2 instance gets an Azure private endpoint's private address only through a Route 53 forwarding rule. If the rule is missing or stale, the name still resolves, to the public address. Microsoft attributes roughly 70 percent of private-endpoint access-denied cases to exactly that. SaaS split-brain: GCC uses the Worldwide endpoint list, so the risk is path consistency, a stale forwarder or browser DoH to a public resolver. And security-policy split-brain: a block applies only on the resolver that answers, so the posture is the weakest resolver a client can reach.

The failure is silent, the change rate outruns any manual process, and every system has its own timing. Only a control plane that holds the policy objects keeps them in step.

## Slide 4 — The mandates name no product, but describe one layer

The federal mandates never name a product, but together they describe a governed name layer. It's worth being precise about who requires what.

OMB M-22-09 requires encrypted DNS wherever it's technically supported, with endpoints explicitly configured to use agency-designated resolvers. It also notes that DNS must already be routed through CISA-operated infrastructure. The requirement that all egress resolution go through Protective DNS comes from CISA's own guidance, which cites the statute. OMB M-26-14, which rescinded M-21-31 in May 2026, doesn't name DNS, but it requires logs that show source and destination addresses, protocols, ports and sessions, searchable for six months and retrievable for a year. M-08-23 and SP 800-53 carry DNSSEC. And version 3.3 of the TIC 3.0 catalog, published in September 2026, lists five DNS capabilities, from sinkholing to Protective DNS.

NIST SP 800-81 Revision 3, final on March 19, 2026, is the practical guide to all of this: guidance, not a mandate. And FedRAMP certifies a cloud service, not an architecture; the agency still authorizes its own DDI system.

## Slide 5 — Entra ID inherits none of what AD DNS does

What has to change starts with Active Directory. For twenty years AD has been the hidden DNS service of the on-premises network: a domain's name becomes a zone, and every domain-joined machine points at the domain controllers for all of its resolution.

Netlogon on each domain controller registers the SRV locator records that clients use to find LDAP, Kerberos and the global catalog. Secure dynamic update keeps those records current. Forwarders, GlobalNames, reverse and signed zones each need a decision.

Microsoft Entra ID inherits none of it. It hosts no zones and publishes no locator records, yet hybrid-joined devices still look for a domain controller, and Entra Domain Services adds a DNS authority of its own.

So the locator records stay where domain controllers can register them securely, on AD DNS or a DDI platform that accepts GSS-TSIG updates, until the last domain controller goes. Everything else moves zone by zone, once it's inventoried.

## Slide 6 — Three ways a query escapes the governed path

Every control in the policy plane assumes the query reaches it. Three ordinary mechanisms decide whether it does, and none of them reports when it doesn't.

First, the edge. Cisco Catalyst SD-WAN's redirect-dns action, as one example, sends branch DNS to a policy-designated resolver, IPv4 and UDP only. It must be a network-addressable agency resolver, not a loopback agent on the device, and any SASE resolver belongs behind it.

Second, encrypted DNS. DNS over TLS and DNS over QUIC use port 853, so block them except to approved resolvers. DNS over HTTPS shares port 443 with all web traffic, so it's governed at the endpoint: Windows DoH policy, the Edge and Chrome DoH mode, and an NXDOMAIN answer for Firefox's canary domain.

Third, rogue DHCP. One rogue server handing out its own resolver in option 6 moves a whole subnet at once, and rogue IPv6 router advertisements do the same. AD authorization doesn't stop them; DHCP snooping and RA Guard on the switches do.

## Slide 7 — Every certificate check starts with a DNS lookup

A certificate can be valid, unrevoked and issued for the right name, and still fail, because every check that makes it trustworthy starts with a DNS lookup: the endpoint, the revocation endpoints, the FQDN that policy names, and the sign-in endpoint for the token's cloud.

If an agency CRL name exists only in AD DNS, a workload in AWS can't resolve it without a forwarding rule. The revocation check fails, the ticket is opened against PKI, and the root cause can take days to find.

DNSSEC adds origin authentication and integrity, not encryption. The program's position follows NIST: sign external zones and the dot-gov delegations, always. Validate on every agency resolver, with the root trust anchor. And sign internal zones only where the system's authorization requires it; NIST calls internal signing of limited value for most organizations. Validation stays on agency resolvers because Azure DNS and Route 53 sign public zones only, and the default Azure resolver doesn't validate.

## Slide 8 — Forward the public zone to one point in Azure

Azure private endpoints are the commonest source of private-IP split-brain.

When a private endpoint is created, Azure writes its A record into a privatelink zone, and public DNS carries a CNAME into that name. The private answer comes back only when the query reaches a resolver linked to the zone. So every origin, on-premises, the other clouds and the branch path, forwards the service's public zone, such as database.windows.net, to the DNS Private Resolver's inbound endpoint. Not the privatelink zone. Azure Government uses different zone names, so commercial rules don't carry over.

The Private Resolver is a recursive bridge, not an authority: reach it by forwarding, never by delegation. Give each endpoint a dedicated subnet and a static address, avoid ruleset loops, and deploy one per region.

Addresses need the same discipline, with the enterprise IPAM as the authority for address blocks. AWS VPC IPAM can allocate from an external IPAM in commercial Regions, but not in GovCloud; on Azure and Google Cloud, mirror the reservations and reconcile.

## Slide 9 — One governed path, five decisions that fail silently

A branch client's query passes the SD-WAN edge to an agency-controlled resolver, then the DDI policy plane, with its response policy zones, DNSSEC, IPAM and forwarding rules, then the per-cloud private zones. Internet-bound recursion leaves through CISA's Protective DNS.

Five decisions carry almost all of the operational risk. One: the redirect-dns target is a network-addressable agency resolver. Two: the agency resolver is the first hop, and any other resolver is its forwarder. Three: the policy plane holds every per-cloud conditional forwarding rule. Four: AD DNS is inventoried and reprovisioned before any domain controller goes. Five: OCSP and CRL endpoints resolve from every origin.

Each fails silently: the query still resolves, just outside policy or to the wrong address. So each comes with a check, run in the live configuration rather than the design document, before the next SD-WAN or DDI change.

## Slide 10 — Who decides, who does the work for DNS, DHCP and IPAM

Who owns it? In an AD estate, DNS belonged to whoever ran the domain controllers; DnsAdmins has full control of every zone by default. A single policy plane concentrates that authority, so its owners have to be named on purpose, one decider per decision.

The sponsor and CIO decide the platform model and when AD DNS and Windows DHCP retire. The CISO and ISSO set the requirements: designated resolvers, allowed transports, DNSSEC and logging. The authorizing official accepts residual risk, including every standing exception.

The DNS/DDI team runs the policy plane and decides what the edge points at; network engineering configures it. AD administrators own the inventory until AD DNS retires, and cloud teams run their DNS as consumers of the plane.

Record changes come in three classes. Standard changes inside a delegated namespace are pre-approved. Policy-driven records, like private endpoint entries, need no per-change approval, but the policy itself is change-controlled. High-impact changes, zones, delegations, forwarding, SRV, wildcards and response policy, go to the change board.

## Slide 11 — Six phases, one cutover loop, rollback at every step

How do you get there? In six phases: inventory, coexist, migrate authority, federate the clouds, decommission AD DNS and DHCP, then harden and evidence. Each phase ends with a rollback point and a resolution test from every origin, not a calendar date.

Every move of authority, whether a zone, a forwarder, a DHCP scope or a wave of clients, runs the same loop. Lower the TTL to 300 seconds at least 48 hours ahead. Import with a dry run, never moving the SOA, apex NS or AD locator records. Validate from every origin. Switch, then hold and observe, while the old authority keeps answering.

In Azure Private DNS, removing a virtual network link deletes the records autoregistered through it, and Microsoft says they can't be restored. So unlinking is safe only for zones without autoregistration.

Decommissioning is gated, never scheduled: the inventory reconciles, every critical SRV record resolves for 30 consecutive days, 90 days of parallel operation pass cleanly, failover is tested, and the old servers are idle.

## Slide 12 — Operate it as one plane, and keep the evidence

Once it's running, one policy plane is only an improvement if divisions can still run their own networks through it. So each division gets a scope covering its own zones, IP spaces and DHCP scopes, with manager, operator and auditor roles, and automation accounts are held to the same scopes. Infrastructure as code, ITSM workflows and ACME DNS-01 certificate automation all go through one API and one audit trail.

Locator records are resolved every 15 minutes from every site and virtual network until the last domain controller retires. Drift reports compare the source of truth with every copy, and hygiene jobs catch stale records and dangling CNAMEs.

The evidence floor is M-26-14. It doesn't name DNS, but it requires logs that show source and destination addresses, ports and sessions, searchable for six months and retrievable for a year, and readily available to the agency's top-level security operations center. Query logs, encrypted queries included, and DHCP lease history with MAC and IP addresses are how the name layer meets it. The lease history is what turns an address into a device.

## Slide 13 — Choose on evidence, price the meters, record the risk

Choose the platform on the evidence it produces for your own boundary.

Commercial DDI licensing is quoted per agency, so get every quote on the same assumptions. The cloud-native pieces have public meters, and appear in every model. Azure DNS Private Resolver charges per endpoint: 180 dollars a month for each inbound endpoint and each outbound endpoint, plus 2 dollars 50 per ruleset. A hub with one of each is about 362 dollars 50 a month per region, and a second region doubles it.

Authorization belongs to an offering, not a vendor. As one example, Infoblox Government Cloud has been FedRAMP Certified at Moderate since December 15, 2022. BlueCat and EfficientIP have no Marketplace listing, so they run inside the agency's boundary. And a Moderate authorization doesn't cover GCC High or DoD.

Some risk remains. Sync lag becomes the new source of divergence. A management-plane outage blocks changes, though resolution continues from local state. And encrypted DNS bypass stays possible wherever endpoint controls are incomplete.

## Slide 14 — Decisions to make, and next steps

So, four decisions.

Authorize a single authoritative DDI policy plane, and assign an owner, typically the enterprise architecture or network operations lead.

Have that owner settle the five configuration decisions within 90 days, and report the residual risk to the authorizing official.

Choose the platform model on evidence: authorization at the right impact level, and quotes on the same assumptions.

And name the owners, one decider per row, with the DNS/DDI team deciding what every branch edge points at.

The next step is Phase 1, the inventory: export every AD DNS zone, SRV record, conditional forwarder and DHCP scope, and every redirect-dns target and revocation endpoint, before anyone touches a domain controller. It's read-only, and it's the one step whose omission can't be repaired later.

Govern the name layer as one plane, and it can carry the cloud, branch and identity transitions. The Federal Modernization Workbook's Book 08 has the detail, every claim footnoted. Thank you.
