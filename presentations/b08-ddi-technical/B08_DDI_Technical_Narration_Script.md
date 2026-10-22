# Book 08 — DNS, DHCP & IPAM — Technical Deep Dive — narration script (practice copy)

## Slide 1 — DNS, DHCP & IPAM: the technical deep dive

This is the technical deep dive for Book 08 of the Federal Modernization Workbook: DNS, DHCP and IPAM. It's for the network and DDI engineers who will design the resolution paths, move authority off Active Directory, and run the result.

It comes in two parts of about twenty-five minutes each, and four modules you can watch on their own. Part 1 covers the hard surfaces: split-brain DNS and what Active Directory DNS really carries, then the places queries escape agency policy, at the edge, at the endpoint and on the access layer, and the DNS identity and DNSSEC work underneath certificates and tokens. Part 2 covers building and running the control plane: cloud private endpoints, the Azure DNS Private Resolver, IPAM as the authority for address blocks, the reference architecture and its five decisions, then the six-phase migration and the telemetry, drift checks and evidence that keep it honest.

Vendors and products appear only as the book's examples, never as endorsements. The commands stay in the chapters, marked illustrative.

## Slide 2 — Why this matters: DNS now decides far more than an address

Why this matters. Almost every network connection begins with a DNS query, and in a hybrid multi-cloud agency the answer now decides far more than an address. NIST's 2026 DNS deployment guide, SP 800-81 Revision 3, says DNS infrastructure has become more than a service; it is also a security control.

Chapter 01 names six jobs DNS now does. It publishes private addresses: an Azure Storage account with a private endpoint resolves privately inside the hosting virtual network and publicly everywhere else. It selects SaaS front doors: Microsoft 365 publishes a Worldwide list, which includes GCC, and separate lists and namespaces for GCC High and DoD. It enforces security policy through response policy zones and DNS firewalls. It anchors certificate validation, because OCSP and CRL endpoints are names. And the FQDN is the service identity that gateways, certificates and Zero Trust policies are written against.

Yet most agencies run it on as many as five platforms that share no state. AD DNS or a DDI grid on premises. Route 53's VPC Resolver, formerly Route 53 Resolver. Azure, where private zones resolve only for linked networks, and where DNS resolver policy now gives an RPZ equivalent. Google Cloud's metadata server. And the NSX forwarder, which workloads reach only if configured to.

The cost shows up on every change. A new Azure private endpoint can need four more DNS changes, on four consoles, in four syntaxes. Chapter 09 assigns ownership, because the forwarding rules that connect the platforms usually belong to no single team.

## Slide 3 — What the mandates require, and the sequence that meets them

Chapter 03 quotes the mandates rather than paraphrasing them into something stronger, and so will I.

OMB M-22-09 says agencies must resolve DNS queries using encrypted DNS wherever it is technically supported, and should explicitly configure endpoints to use agency-designated encrypted DNS servers rather than relying on automatic network discovery. CISA's Protective DNS is required for federal civilian agencies, and CISA's guidance says it is used for all egress DNS resolution. OMB M-26-14 rescinded M-21-31 and its event-logging tiers; it doesn't name DNS at all, but its baseline needs source and destination network address information, and logs actively searchable for six months and retrievable for a year. M-08-23 required DNSSEC by December 2009, and SC-20 and SC-21 carry signing and validation into every baseline. M-21-07's IPv6-only targets have all passed. And TIC 3.0, version 3.3, lists five DNS enforcement capabilities. NIST SP 800-81 Revision 3, from March 2026, is the practical guide to meeting them; it's guidance, not a mandate. Read together: agency-controlled resolvers that log, encrypt, validate, forward egress through Protective DNS, and can't be routed around.

FedRAMP certifies a cloud service, not an architecture, and the agency still authorizes its own system. As an example, the Marketplace lists Infoblox Government Cloud at Class C, its label for Moderate, delivered as SaaS in AWS GovCloud. A Moderate certification doesn't cover High or DoD, and on-premises appliances sit inside the agency's own boundary.

Every chapter follows one sequence: inventory, coexist, migrate authority, federate clouds, decommission AD DNS and DHCP, then harden and evidence. Five configuration decisions carry most of the risk along the way; we'll meet each one in its module.

## Slide 4 — Module 1: Split-brain DNS and the AD DNS departure

Module 1: split-brain DNS and the Active Directory DNS departure.

Chapter 02 defines the structural problem: the same name returning different answers depending on where the query starts, silently, because the name still resolves. Chapter 04 takes the surface most agencies underestimate. Active Directory never presented itself as the agency's DNS service, but for twenty years it was one, and the records it kept for itself don't follow the identities to the cloud. Leaving AD DNS is an inventory problem before it is a migration problem, and the inventory has to be finished before the first domain controller is retired.

## Slide 5 — Split-brain: same name, different answers, and no error

Split-brain is the same name returning different answers depending on where the query originates. Intentional split-horizon, designed and governed, is legitimate. The unintentional kind is the problem, and with several DNS systems holding copies of the same names and no shared state, it's close to guaranteed. Chapter 02 shows three forms.

Private-IP split-brain. An Azure Storage private endpoint gives the public name a CNAME into the privatelink subdomain, and the private zone maps it to, say, 10.1.0.4. An EC2 instance sees that only if a Route 53 outbound rule forwards blob.core.windows.net to an Azure Private Resolver inbound endpoint, or to an agency resolver that does. If the rule is missing or stale, the name still resolves, to the public address. Microsoft's guide to 403 errors through a private endpoint attributes roughly seventy percent of cases to exactly that.

Public SaaS split-brain. GCC uses the Worldwide endpoint list, so for a GCC-Moderate agency the risk isn't a wrong-cloud answer; it's path consistency: every reachable resolver must return what Microsoft publishes, through the designed egress. GCC High and DoD have their own namespaces. Drift looks like sign-in failures or Conditional Access denials.

Security policy split-brain. Block lists apply only at the resolver that answers, and the cloud equivalents are configured per network, so the effective posture is the weakest resolver a client can reach. That matters beyond compliance: NIST notes DNS servers can often prevent security incidents earlier than other systems.

Runbooks fail because the failure is silent, the change rate outruns them, and the systems behave differently. The fix is structural: a control plane.

## Slide 6 — AD-integrated DNS: seven components, seven decisions

When a domain is deployed, its DNS name becomes a zone, the domain controllers running the DNS Server role become its authoritative servers, and every domain-joined machine is pointed at them for all of its resolution. Nobody chose that as a DNS architecture, but it is one.

A zone stored in Active Directory exists only on domain controllers that run DNS, and storing it there brings two things a file-backed zone lacks: secure dynamic updates, and multi-master operation, where every hosting domain controller is a primary. Replication rides on AD replication, and the replication scope, exposed as Domain, Forest, Legacy or Custom, decides which domain controllers hold the zone.

The rest decomposes into components, each needing a decision. The AD-integrated zones, including underscore msdcs, lose multi-master and secure updates with the directory, so each is re-created on a platform that gives its clients what they still need. File-backed zones are the simplest to move; watch clients pointed at a secondary. Stub zones usually become forwarding rules. Conditional forwarders carry trusts, partners and cloud namespaces. GlobalNames then depends on suffix search lists. Reverse zones must align with IPAM or fill with orphans. And signed zones move on their own sequence.

One correction: the source whitepaper called conditional forwarders not easily exported. Windows stores each one as a zone, so Get-DNS-Server-Zone lists it. Forwarders accumulate for partners, trusts and retired systems, often with no record of why. Finding them is easy; deciding which still matter is the work.

## Slide 7 — Locator records: what Netlogon registers, what fails

Domain controllers advertise themselves through DNS. Netlogon on each domain controller registers a family of SRV and A records. A client finds a domain controller by calling D S Get D C Name, which queries DNS for SRV records, sends an LDAP UDP ping to the candidates and caches the first one that answers. These records are dynamic: Netlogon re-registers them, and they change as domain controllers come and go and as sites change.

Here's what fails without each. The LDAP record: domain join, authentication and Group Policy. The Kerberos records: ticket acquisition, falling back to NTLM where it's still allowed, otherwise failing. The global catalog records: universal groups and forest-wide searches. The site records: clients reach a distant domain controller rather than failing outright. The PDC record, and kpasswd for password changes.

Two sources make the inventory complete: the Netlogon dot DNS file each domain controller writes, listing what it intends to register, which Microsoft points to for agencies running AD on non-Microsoft DNS, and the underscore msdcs and underscore sites folders of the domain zone. The program's assessment resolves each critical record from every DNS server and every site, and Chapter 10 makes thirty days of clean resolution a gate for decommissioning.

Because they're registered dynamically, these records can only live on a DNS service that accepts secure registration from domain controllers. That's why they stay on AD DNS, or a DDI platform that accepts GSS-TSIG updates, until the last domain controller goes, and why Azure Private DNS can't host them.

## Slide 8 — Secure dynamic updates, and the DHCP server's part in them

Clients keep their own records current through dynamic update, RFC 2136. Secure dynamic update authenticates the client and records each name's owner in an access control list. It exists only for AD-integrated zones, which default to secure-only. Any authenticated user can create a new A or PTR record; once a name exists, only principals on its ACL can change it. Windows signs these updates with GSS-TSIG.

The DHCP server is part of this, and five settings decide whether the records stay trustworthy. Name ownership: a DHCP server that performs a secure update becomes the name's owner, so if its failover partner takes over, the partner can't update it; both partners must use the same DNS credentials. DnsUpdateProxy solves ownership by leaving its members' records unsecured; Microsoft warns against it in secure-only zones. A dedicated credential is the recommended pattern: one standard user account every DHCP server uses. It matters most when DHCP runs on a domain controller, which would otherwise lend its authority over every record, and it isn't backed up with the DHCP database. Name protection creates DHCID records, so an update fails rather than overwrites when another client holds the name. And scavenging: without it DNS becomes a map of where devices used to be, and Microsoft documents that when scavenging and lease durations disagree, you get duplicate records and Kerberos tickets for one computer delivered to another.

These settings are rarely documented outside the servers, so they belong in the inventory. Chapter 04 gives read-only cmdlets for each.

## Slide 9 — What Entra ID doesn't carry, and what to reprovision

Microsoft's guidance is a phased source-of-authority conversion toward cloud-first and A D-minimized states, not an all-at-once decommission, and AD DS itself isn't deprecated: Windows Server 2025 ships new functional levels. What changes is where the DNS records come from.

Entra ID publishes no zones and no locator records. Entra-joined devices use tokens and don't look for a domain controller; hybrid-joined devices still do. Kerberos survives in pockets, such as Application Proxy with constrained delegation and cloud Kerberos trust, each with a DNS dependency. And Entra Domain Services brings its own DNS, needs conditional forwarders for on-premises zones, and Microsoft says any server-level forwarder other than 168.63.129.16 is unsupported: a DNS authority whose upstream you can't change, which matters for Protective DNS.

Kerberos needs more from DNS than tickets reveal. The source whitepaper described the service resolving the SPN back to an IP; Kerberos does no such check, and the book corrected it. The real failure is simpler and worse: resolve the name to the wrong host and a valid ticket for computer A is presented to computer B, which rejects it. A missing SPN silently drops to NTLM. Either way it looks like identity, and the cause is DNS. Decoupling DNS from identity also removes a shared failure: an identity outage no longer takes name resolution with it.

Before any domain controller goes: keep locator records resolvable until every consumer is token-based; test conditional forwarders over DNS, not ICMP, and retire the dead ones; create the internal namespace explicitly; re-establish dynamic registration per client population; and move GlobalNames, reverse and signed zones by their own methods. DDI platforms commonly offer a coexistence mode; Infoblox NIOS is the book's example. Confirm the capability for whatever you deploy.

## Slide 10 — Module 2: Edge interception, DNS identity and DNSSEC

Module 2: edge interception, DNS identity and DNSSEC.

Every control in the policy plane, response policy zones, DNSSEC validation, logging and Protective DNS forwarding, assumes the query reaches it. Chapter 05 takes the three ordinary mechanisms that decide whether it does, at the network edge, the endpoint and the access layer, and none of them reports when it doesn't. Chapter 06 then shows why a certificate can be valid, unrevoked and issued for the right name and still fail: every check that makes it trustworthy starts with a DNS lookup. It closes with DNSSEC.

## Slide 11 — SD-WAN redirect-dns: the destination decides policy

SD-WAN edges can intercept DNS regardless of the resolver a client was configured with. In Cisco Catalyst SD-WAN, the book's worked example, this is the redirect-dns action of a centralized data policy: the edge matches DNS traffic and sends it to a policy-designated resolver, either unconditionally, or only for named applications.

The destination decides whether agency policy applies at all. On the correct path the query goes through the edge to a network-addressable agency resolver, into the policy plane for response policy zones, validation and logging, and internet recursion leaves through Protective DNS. On the bypassed path the edge hands it to an external resolver: no log entry, no RPZ, no validation under agency trust anchors, and nothing alerts.

The feature has documented limits. Service-side redirect arrived in IOS XE 17.8.1a. It's IPv4 and UDP only, so TCP DNS isn't redirected, and it skips overlay-tunnel DNS, fragments and the router's own queries. Cisco's Umbrella integration is a separate mechanism whose local bypass list is effectively a second copy of the internal namespace on every edge.

Two refinements. The target must be a server the edge can address; a loopback agent such as Infoblox Endpoint protects the roaming device but isn't a redirect target. And a SASE resolver, even Cisco's Umbrella for Government in an offering listed FedRAMP Certified at High, which describes Protective DNS integration, still bypasses the agency's own plane. So the redirect target is always the agency resolver, with any SASE resolver behind it.

Microsoft 365 informed network routing supports Worldwide commercial tenants only, not GCC Moderate, GCC High or DoD. It's a traffic optimization, not a DNS dependency.

## Slide 12 — Encrypted DNS: terminate at agency resolvers

Client-side encrypted DNS to a public resolver is the most common bypass. M-22-09 wants encrypted DNS wherever supported and endpoints set explicitly to agency resolvers; CISA's target state has Protective DNS upstream and endpoints unable to reach third-party DNS over any protocol. So encrypted DNS must terminate at an agency resolver or Protective DNS.

Each transport leaves a different handle. Plain DNS on 53 can be intercepted, redirected and blocked by port. DNS over TLS and DNS over QUIC, on port 853, can't be redirected without breaking the session, but are straightforward to block except to approved resolvers. DNS over HTTPS shares 443 with all web traffic, so redirect-dns can't see it; NIST suggests RPZ entries for known DoH names plus firewall rules, and CISA adds TLS inspection. An edge-only design can't govern encrypted DNS.

On Windows, the client uses DoH only with servers on its known list, which ships with Cloudflare, Google and Quad9; add the agency's own. Since June 2026 the Windows Server 2025 DNS Server accepts client DoH, but its upstream traffic stays unencrypted. CISA says IPsec isn't an acceptable substitute, suggests an encrypting proxy, requires root hints disabled, and allows public fallback resolvers only when Protective DNS is unavailable, with alerting. Zero Trust DNS, on Windows 11 Enterprise and Education, permits outbound traffic only to addresses its Protective DNS servers resolved.

Browsers resolve names themselves. The program adopts CISA's configuration: the OS resolver, or DoH only to agency resolvers, as mandatory policy, and an NXDOMAIN answer for Firefox's canary domain. Microsoft documents that on a managed device with the policy unset, Edge sends no DoH queries.

## Slide 13 — Rogue DHCP and router advertisements

The third bypass sits on the access layer. A rogue DHCP server that hands out a malicious resolver in option 6 can move a whole subnet onto an attacker's resolver in one step, past every response policy zone and every Protective DNS control. MITRE ATT&CK catalogs it as DHCP Spoofing, T1557.003; the whitepaper's claim of federal incidents couldn't be verified and was removed. In IPv6, rogue router advertisements carrying the RDNSS option do the same, and they're often the larger surface, because many networks govern router advertisements not at all. M-22-09's instruction to configure agency resolvers explicitly is the federal answer to discovery channels like RFC 9463.

Option 6 isn't the only option that moves traffic. Option 15, the default domain, must match the authoritative zone. Option 119, the search list, misdirects queries when stale. Option 81 decides who registers the client's records. Option 82 identifies the switch port for IPAM attribution. And 252 for WPAD is a convention, not an assignment; a wrong value bypasses the web proxy.

The Windows control is narrower than it looks. An unauthorized Windows DHCP server checks its own status in Active Directory and stops leasing. That stops a misconfigured Windows server, not a rogue appliance, a home router in a wall port, or malware. Those need DHCP snooping and RA Guard on the access switches, centralized scope and option management, rogue detection, and IPAM integration so an unexpected lease is visible at once.

Prevention is never complete, so watch for failure: hosts whose queries never reach the governed logs, fallback resolver use, port 853 to unapproved destinations, and DoH to known public endpoints.

## Slide 14 — DNS identity: certificate and token failures

DNS identity, the authoritative mapping of names to addresses, owners and lifecycle, is the first link in the trust chain. Certificates, FQDN-based policy and tokens all name their subject by FQDN and trust DNS to take the caller there.

Moving from Kerberos to Entra ID tokens removes the KDC but adds names that must resolve consistently. The token endpoint: GCC uses the global login dot microsoftonline dot com; Azure Government, serving GCC High and DoD, uses the dot us endpoint. The whitepaper grouped GCC with dot us; the book corrected it. The token audience in v2.0 tokens is the API's client ID, a GUID, so a host rename clients don't pick up fails as an audience or redirect-URI error. SANs must contain the name the client asked for. Entra certificate-based authentication checks one HTTP CRL per CA and no OCSP, so the CRL URL must resolve. And ACME dns-01 makes the zone the gate for automated issuance, exercised constantly as public TLS lifetimes fall toward forty-seven days.

Certificate split-brain: a service's OCSP and CRL names exist only in AD DNS, and an EC2 caller has no Route 53 rule for them. A hard-fail client breaks the handshake; a soft-fail client skips the check. The agency resolver logs nothing, and the ticket goes to PKI. That's Decision 5.

Geographic scoping: RFC 9525 allows a certificate wildcard only as the whole leftmost label, matching one label, so application dot star dot agency dot gov doesn't work. Use per-region names, per-region SANs, and name constraints, the only cryptographic layer; RFC 5280 says clients should, not must, process them, so test your relying parties.

## Slide 15 — DNSSEC: sign external zones, validate on resolvers

DNSSEC adds data-origin authentication, integrity protection and authenticated denial of existence. It doesn't encrypt anything; it lets a resolver verify the answer is authentic, and a validating resolver that finds a bad signature answers SERVFAIL. NIST is explicit that DNSSEC and encrypted DNS are complements: DNSSEC doesn't protect confidentiality, and DoH, DoT and DoQ protect the transaction but not the data.

The federal position. M-08-23 required DNSSEC by December 2009, with agency dot gov domains signed. SC-20 asks authoritative services for origin and integrity artifacts, and SC-21 asks the recursive resolver to request and perform verification. SP 800-81 Revision 3 recommends the root key as trust anchor with automated rollover. On internal zones it's more cautious than the whitepaper: signing them is likely of limited value and recommended against unless required, because they may not chain to the root, dynamic zones re-sign on every update, and signing is pointless where authoritative and recursive service share servers, as on domain controllers. Where required, use a delegation that chains to the root.

So the program signs external zones always, validates on every agency resolver, and signs internal zones only where the system's authorization requires it.

The platforms aren't equal. Windows Server uses a Key Master, can replicate keys in AD, and supports RFC 5011 rollover; its wizard's default 1,024-bit RSA zone-signing key is below NIST's floor, so the program uses ECDSA or RSA of at least 2,048 bits. Azure DNS and Route 53 sign public zones only; Azure's default resolver doesn't validate, and Route 53's ignores the DO and CD bits. Neither gives the agency validation it controls.

## Slide 16 — Operating DNSSEC and moving signed zones

Operating DNSSEC is mostly key management, automated and audited. NIST recommends a hardware security module for important keys, usually the KSK, signature validity of about five to seven days, and key lifetimes of one to three years. Its acceptable algorithms include RSA with SHA-256 at 2,048 bits or more and ECDSA P-256 and P-384, and it prefers ECDSA, because smaller keys keep responses small. On denial of existence, Windows labels NSEC3 recommended, while NIST notes NSEC3 relies on SHA-1 and calls NSEC the more prudent approach; compact denial of existence, RFC 9824, is what Azure DNS uses. Signing grows responses, so EDNS zero and fragmentation handling matter. And a zone signed in one view but not another fails as an application or certificate error.

Moving a signed zone has its own sequence, run during Chapter 10's Phase 3 so the new chain validates before the decommission gate. First, finish any rollover in progress and start none during the move. Second, keep the old signing until the new chain validates: sign on the new platform, publish the new DS at the parent, confirm from an independent validator, and only then stop signing at the source. Third, watch the validators, because clients see only generic failures. Fourth, an AD-signed internal zone landing on Azure Private DNS, which can't sign, is a documented risk decision. The book corrects two compensations the source guide listed: Azure virtual network traffic isn't encrypted by default, and Private Link doesn't make in-network answers tamper-proof. Removing DNSSEC is the reverse: Microsoft documents that the DS record comes off the parent and its TTL expires before the zone is unsigned. Fifth, remove retired trust anchors after the ninety-day validation period.

## Slide 17 — Module 3: Private endpoints, IPAM and the reference architecture

Part 2: building and running the control plane. Module 3 covers the design.

Chapter 07's premise: every cloud ships its own private DNS and its own address manager, and unless one plane governs both, names and addresses drift apart one console at a time. We'll take the four private DNS models, Azure private endpoints and the Private Resolver in detail, then IPAM as the authority for address blocks across the clouds. Chapter 08 then draws the reference architecture and the five decisions that carry almost all of its operational risk, each with a check to run in the live configuration, and Appendix C sets out what changes in government clouds.

## Slide 18 — Four private DNS models, and Azure private endpoints

Each cloud ships its own private DNS, with its own console, API, zone model and failure behavior, and none was designed to share policy with the others.

AWS has Route 53 private hosted zones answered by the VPC Resolver, inbound endpoints for queries from outside, outbound endpoints and Resolver rules, and DNS Firewall. Azure has Private DNS zones resolvable only from linked networks, the Private Resolver's endpoints and forwarding rulesets, and resolver policy. Google Cloud has private zones per VPC network, inbound server policies, forwarding and peering zones, and response policies. VMware NSX has no private zone at all: a gateway forwarder holds a default zone and up to five FQDN zones of three servers each, used only by workloads configured for it.

Azure private endpoints are the most common source of private-IP split-brain. With private DNS integration, a zone group writes the endpoint's A record into the matching privatelink zone and removes it when the endpoint goes. Public DNS carries a CNAME into the privatelink name, so connection strings don't change. The private answer comes back only from a resolver that can see a linked zone.

Three behaviors catch teams out. DNS answers don't grant access: the public chain resolves from anywhere by design, and access is the service's network setting, so a wrong answer shows up as a public-path connection or an access denial. Use one zone per service type everywhere, with Microsoft's recommended names, since records are generated only for those. And the NXDOMAIN trap: a partner's storage account with its own private endpoint leads into your empty zone and fails; the fix is fallback to internet on the zone's link.

## Slide 19 — Forward the public zone; Private Resolver in the hub

Two rules turn Azure private endpoints from a source of split-brain into something governed.

First, forward the public zone. Forwarders on non-Azure resolvers point at each service's public zone, for example database dot windows dot net, not the privatelink zone. Every origin, on-premises resolvers, Route 53 rules, Cloud DNS forwarding zones and branch paths, sends it to the Private Resolver's inbound endpoint, or to an agency resolver that forwards there. Azure Government uses different names, so a design spanning both clouds needs both sets. Forwarding a whole public zone also carries other organizations' lookups, which is why fallback to internet goes on the links. Autoregistration is separate: VMs only, primary NIC only, no PTR records, and no role in privatelink zones.

Second, build the resolver in the hub as a forwarding bridge, not an authority. Because it isn't authoritative, on-premises DNS reaches it by conditional forwarding, never by NS delegation.

The rules that matter. Each endpoint gets its own delegated subnet, slash twenty-eight to slash twenty-four. A resolver supports five inbound and five outbound endpoints; a ruleset holds a thousand rules across five hundred networks; each endpoint handles ten thousand queries a second. No encrypted networks, IPv6 subnets, FastPath or Lighthouse. Static inbound addresses, so forwarders are written once. Never link a ruleset to the network whose inbound endpoint one of its rules targets; that loops. Don't list a custom resolver beside 168.63.129.16, because some clients pick among listed servers. And a resolver in each region.

## Slide 20 — IPAM is the authority for address blocks

The address side has the same structure as the name side. AWS VPCs, Azure virtual networks, Google Cloud VPC networks and NSX segments each allocate on their own, so a CIDR created in a console can overlap on-premises space, another cloud or another division, and the enterprise DDI system doesn't know until discovery runs or a conflict appears.

Integration depth differs. Amazon VPC IPAM can hand a private scope's authority to an external IPAM; since November 2025 the book's example is Infoblox, which chooses a block or accepts or rejects a requested one. It needs the Advanced Tier, covers private scopes only, and isn't available in GovCloud or China, so it doesn't help a GovCloud estate today. Azure Virtual Network Manager offers hierarchical pools, a root and up to seven layers, IPv4 and IPv6, with static CIDRs for ranges outside Azure. Google Cloud's internal ranges can reserve blocks. Neither hands authority to an external IPAM, so mirror the enterprise reservations into them and reconcile. VMware Cloud Foundation 9.1 added native Infoblox allocation and FQDN registration; the source is a vendor blog without IPv6 or limits, so confirm the scope first.

The rule: reserve blocks in the enterprise IPAM before any cloud or NSX network is created, integrate where you can, mirror and reconcile where you can't, and monitor sync health. Federation plus active and passive discovery produce one hierarchy, which catches overlap before two networks are peered and reports the CM-8 inventory. The program also wants IPAM to track FQDNs, wildcards and bound certificates.

IPv6: M-21-07's milestones have passed. Plan both protocols together; the Private Resolver can't use IPv6-enabled subnets.

## Slide 21 — The governed path, and five decisions that fail silently

Chapter 08's architecture is simple to draw. A branch query goes through the SD-WAN edge to a network-addressable agency resolver, into the policy plane for policy, response policy zones, DNSSEC and IPAM, and on to the per-cloud private zones. Internet-bound recursion leaves through CISA's Protective DNS Resolver, which blocks, redirects or sinkholes queries matching threat indicators. On-premises clients reach the agency resolver directly; cloud workloads reach the plane through Chapter 07's per-cloud forwarding.

Five decisions carry almost all of the operational risk, and each fails silently: the query still resolves, just outside policy or to the wrong address. So each has a check to run in the live configuration, not the design document, before the next SD-WAN or DDI change.

Decision 1, the redirect-dns destination: a DDI resolver or forwarding proxy at the branch or a regional hub, never a loopback stub. Check every branch's running data policy. Decision 2, forwarding chain order: a SASE resolver is a forwarding target of the agency resolver, never the redirect target. The common failure is every component present with the SASE service first, so trace the order. Decision 3, per-cloud conditional forwarding: the plane holds every private namespace's rule and pushes it to every resolver, branches included. Check: resolve one name per namespace from on-premises, each cloud and a branch; a public address or NXDOMAIN means a missing rule. Decision 4, the AD DNS inventory, reprovisioned before any domain controller goes, because once the last one holding a zone is gone, its records can't be recovered. Check for a dated, reconciled export before approval. Decision 5, OCSP and CRL reachability from every origin. Check: resolve each endpoint in the issuing CA certificates, and fetch a response.

## Slide 22 — The policy plane, and what federal clouds change

The policy plane isn't one box. It has three parts, which products package differently. An on-premises DNS and DHCP layer hosts the internal zones that replace AD DNS, serves recursion, and applies response policy zones and DNSSEC. Grid members answer from local copies, so the program's position is that changes converge in seconds, not milliseconds, and an emergency block must be verified on the members serving the affected clients. A management plane, increasingly a cloud service, holds the system of record and pushes it everywhere. And local resolvers and agents keep resolving from local state if management is unreachable. It's overlay, not replacement: Route 53 and Azure Private DNS still serve their zones.

Infoblox is the book's example: the NIOS grid, and Universal DDI as the cloud plane. Its FedRAMP-listed offering is Infoblox Government Cloud, certified at Moderate; on-premises NIOS appliances aren't a FedRAMP cloud service and sit inside the agency's boundary. Chapter 12 evaluates other platforms against the same requirements.

The architecture is the same everywhere; authorization and integrations change. A plane certified at Moderate, plus the agency's own authorization, suffices for Moderate systems but doesn't cover High: use a service authorized at the required level or keep the plane inside the agency's boundary. Azure Government's zone names differ. VPC IPAM's external authority isn't in GovCloud. The Private Resolver is at FedRAMP High in Azure Government and forecast, not yet authorized, at IL4 and IL5. Azure Private DNS can't be signed anywhere. And informed network routing isn't available in GCC-Moderate, GCC High or DoD.

## Slide 23 — Module 4: Migration sequence and operating the control plane

Module 4: the migration sequence and operating the control plane.

Name resolution has to keep working while its authority moves, so Chapter 10 makes the migration a series of small, reversible cutovers, each proven from every origin before the next starts. Chapter 11 then covers what the plane must support once it exists: scoped autonomy for divisions, one API and audit trail, the query, lease and change evidence that OMB M-26-14 and an authorizing official ask for, and a troubleshooting reference for the hybrid period. Appendix A's record-type catalog and Appendix B's requirements mapping sit underneath both.

## Slide 24 — Six phases, each closed by its validation, not by a date

This is the book's canonical sequence applied to the move from AD-integrated DNS and DHCP, plus independent cloud DNS, to one policy plane.

Phase 1, inventory: export every zone, SRV record, forwarder and DHCP scope, and document resolution paths, including redirect-dns targets and the OCSP and CRL endpoints. Phase 2, coexistence: new resolvers and their Microsoft DNS and DHCP synchronization, with forwarding so both systems answer. Phase 3, migrate authority: zone by zone, clients in waves, redirect-dns retargeted. Phase 4, cloud federation: private endpoint resolution validated from every origin. Phase 5, decommission AD DNS and DHCP, only after reconciliation and failover tests, preserving the SRV and underscore msdcs records remaining domain controllers need. Phase 6, hardening: Protective DNS, encrypted DNS, DNSSEC where required, monitoring and evidence.

Each phase ends with a rollback point and a resolution-path consistency test, not a calendar date. The operational playbook splits the work into eleven steps for an Azure-heavy estate; its durations are planning estimates, and the gates decide. Hardening has no step of its own: logging starts at the first step, and evidence is filed as each step closes.

Every move of authority runs one loop. Lower the TTL, to three hundred seconds at least forty-eight hours ahead, recording the originals. Export, transform and import with a dry run, never migrating SOA or apex NS records, and leaving locator records where domain controllers register. Validate from every origin, forward and reverse. Switch authority one mechanism at a time. Hold and observe until no client queries the old server. Then restore the TTL and file the evidence. A failed check reverts the switch, and the old authority, still intact, answers again.

## Slide 25 — Phases 1 and 2: sort every component, then coexist

Phase 1 is read-only, so it carries no rollback risk, and its omission can't be repaired later. The assessment collects every zone with its type, replication scope, update setting and signing state; every record with type, TTL and timestamp; zone health, because stale records migrate as faithfully as good ones; the locator records resolved from every server and site, the Phase 5 baseline; forwarders tested over DNS; DNSSEC state; DHCP scopes, options and failover; resolution paths; and the OCSP and CRL endpoints, committed as JSON to the assessment repository. Import from the record-level export: Microsoft documents Export-DNS-Server-Zone as a troubleshooting export, not zone-file format.

Each component gets a target and a method. Internal zones become authoritative zones on the platform. External zones need an NS change at the registrar, so they're high risk. Stubs and forwarders become forwarding rules. GlobalNames becomes CNAMEs plus a suffix search list. Locator records stay where domain controllers can register; there's no Azure-native equivalent, because Azure Private DNS ignores client registrations and imported SRV records go stale. Dynamic registration becomes DHCP-driven updates. Reverse zones align to IPAM. Signed zones move in Phase 3 by their own sequence, keeping the old signing until the new chain validates, and that has to happen before the Phase 5 gate.

Phase 2 adds resolvers without moving authority. Synchronize read-only first, and forward both ways. Give every namespace exactly one authoritative path, or queries loop, and open UDP and TCP 53 from the resolver subnets through the network security groups. Two errors cause most failures: an on-premises forwarder pointed at 168.63.129.16, reachable only inside a virtual network, and Windows forwarding timeouts of three seconds or less, where Microsoft wants more than four.

## Slide 26 — Phase 3: move zones, scopes and clients, with a way back

Phase 3 is where zones, forwarders, DHCP scopes and clients actually move, and each move is one pass through the cutover loop.

Records follow the loop, then observe for at least thirty days, with the old copy left in place as the rollback point until decommissioning. Signed zones move here too, by Chapter 06's sequence. Three patterns cover almost every zone. Split horizon, a private answer inside and a public one outside, rolls back by withdrawing the private view. Subdomain delegation, a child moving while the parent stays, rolls back by removing the delegation. Progressive migration with conditional forwarding moves whole zones one at a time and rolls back by restoring the archived export and repointing forwarders.

Check record types the target handles differently before importing; Appendix A is the reference. SRV records are the most security-consequential type in Active Directory and the most underestimated: nothing moves them when AD is retired. PTR records are the most neglected in cloud private space, so IPAM should create the A and PTR together. A CNAME pointing at a deprovisioned resource invites subdomain takeover. ALIAS and ANAME are provider-specific, absent from the IANA registry. Re-test SPF, DKIM and DMARC after the move. And HTTPS records missing from private zones make clients behave differently inside.

DHCP moves scope by scope, with its options. Option 6 moves clients onto the governed resolvers, so set it per scope and check it after import. Keep failover through the move, hot standby or load balance, and re-establish dynamic registration.

Clients move last, in waves: pilot, a department, then everyone. VMs keep old settings until restart or lease renewal. And removing a VNet link from an Azure Private DNS zone deletes its autoregistered records, which Microsoft says can't be restored. Plan that rollback first.

## Slide 27 — Phases 4 and 5: prove it, then decommission by gate

Phase 4 brings each cloud's DNS and address data under the plane, with private endpoint zones published once and the per-cloud forwarding rules held in one place, Decision 3. Its contribution is the validation matrix: every class of name resolves correctly from every origin. On-premises names resolve natively on premises, through the outbound rule from each cloud, and through the agency resolver from a branch. Cloud names resolve through the inbound endpoint from on premises. Private endpoint names return the private address from all three. Locator records resolve from each cloud through the rule to the domain controllers. And OCSP and CRL endpoints resolve everywhere. A private endpoint name returning a public address from any origin is a failed test, even if the application appears to work.

Phase 5 is the one step whose mistakes can't be rolled back cheaply, so it's gated, not scheduled. All five gates must pass. The inventory reconciles in both directions: nothing missing, nothing unexplained, and every signed zone validating on its new chain with the old signing stopped. Every critical locator record resolves from every VNet and site, checked every fifteen minutes, at one hundred percent for thirty consecutive days. Ninety days of parallel operation with no critical alerts or unresolved drift. Failover tested. And a final query-log review shows nothing still querying the legacy servers.

Then decommission in order: remove legacy DNS addresses from DHCP options, Group Policy and VNets; remove forwarders for moved zones; archive the final exports; de-authorize the old DHCP servers; only then remove the roles, with a seven-day burn-in. The burn-in rollback reinstalls the role from the archived exports, which is why they're archived before anything is removed. Losing locator records early causes forest-wide authentication and domain-join failures.

## Slide 28 — Operating the plane: delegation, one API, telemetry

A single policy plane only works if divisions can still operate their networks through it, because a division that can't will work around it. Corporate administrators see the whole estate; each division gets a scope over its zones, IP spaces and DHCP scopes, with manager, operator and auditor roles and no visibility outside it. Infoblox access views are the book's illustration, and the book notes they currently scope only IPAM roles, so confirm what a release supports.

Whatever stays on Windows or Azure needs the same discipline. DnsAdmins grants full rights on DNS data, and Microsoft lists it as privileged. Azure's DNS Zone Contributor covers public zones only; Private DNS Zone Contributor can be scoped to a record set. A role without delete doesn't protect a record set, because modify can empty it, so add resource locks on critical zones.

Every object should sit behind one documented API, so infrastructure as code, ITSM, ACME DNS-01 automation and pipelines share the same roles and audit trail, with ACME accounts limited to TXT records in their zones.

Telemetry. M-26-14 rescinded M-21-31, whose tables named DNS and DHCP logs, and names neither. Its baseline needs source and destination network address information, searchable for six months and retrievable for a year. The book's reading is that query logs, which host asked for which name, and lease history, which device held which address, supply that. Sources include the DDI resolvers, the Windows DNS analytic log, about five percent cost at a hundred thousand queries a second, Azure resolver policy logs, the DHCP audit log, and the Azure activity log.

## Slide 29 — Keeping it honest: troubleshooting and the evidence checklist

Last, keeping it honest during and after the hybrid period.

Chapter 11's troubleshooting reference covers the common failures. A private endpoint returning its public address usually means the privatelink zone isn't linked to the querying network, a forwarder targets 168.63.129.16, or a Windows forwarder times out too soon. Domain join failing from a cloud VM means the locator records aren't resolvable from that network, so prove SRV forwarding before any cloud VM joins. Queries that never resolve are usually a forwarding loop. Old answers after a move are cached within the old TTL. And DNSSEC failing after a move means the parent's DS record wasn't updated.

Watch continuously. Resolve the locator records every fifteen minutes from every site and VNet, site records included. Detect drift by normalizing both sides to name, type and data, excluding SOA and NS, and commit each report so the history is evidence. Report stale-record and dangling-CNAME rates monthly. The Private Resolver has no forwarding-failure metric, so alert on inbound queries at zero in business hours or spiking over two hundred percent, and use synthetic tests.

The evidence checklist opens with the five decisions, each checked live, then Protective DNS and encrypted DNS evidence, IPAM inventory for CM-8, logs at M-26-14 retention, rogue DHCP and router advertisement detection, and reviewed delegations. Appendix B maps each requirement to its evidence.

So, before the next SD-WAN or DDI change: audit every branch's redirect-dns target, verify the chain order in the running configuration, complete the AD DNS inventory before touching a domain controller, confirm the sovereign-cloud limits, and take open questions to the vendors. Chapter 09 assigns who does each, and Chapter 12 measures success as resolution-path consistency. Thank you.
