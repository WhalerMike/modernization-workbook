# Book 08 — What a Federal DDI Platform Must Do — narration script (practice copy)

## Slide 1 — What a Federal DDI Platform Must Do

This briefing is a companion to Book 08 of the Federal Modernization Workbook: DNS, DHCP and IPAM. If an agency is going to buy or build a platform for its name and address layer, what does that platform actually have to do?

Four parts. Why the name and address layer is now a control plane, and what federal rules ask of it. What a platform has to deliver, and what to check before buying one. Who runs it, including how divisions can manage their own DNS, DHCP and IPAM under central governance. And how to decide.

Vendors appear on these slides only as examples. Nothing here recommends or ranks a product, and the status facts carry a date, because they change. Every claim comes from Book 08 or from primary sources checked in October 2026.

## Slide 2 — DNS, DHCP and IPAM now form a control plane

Almost every network connection begins with a DNS query, and in a hybrid multi-cloud agency the answer decides much more than an address. The Federal Modernization Workbook's Book 08 counts six jobs DNS now does: publishing private endpoint addresses, selecting SaaS front doors, enforcing security policy, anchoring certificate revocation checks, and carrying the service identity and application surface that Zero Trust policy is written against. NIST's 2026 DNS deployment guide puts it plainly: DNS has become more than a service; it's a security control.

Yet most agencies run it across as many as five independent platforms: Active Directory DNS or an on-premises grid, Route 53, Azure DNS, Google Cloud DNS and VMware NSX. None shares state with the others. The result is split-brain DNS, the same name giving different answers depending on where the query starts, and it fails quietly, as certificate errors and access denials rather than DNS errors. And the forwarding rules that join the platforms usually belong to no team at all.

IPAM and DHCP are the address half of the same problem. IPAM is the record of who owns which block, and DHCP lease data is how an address becomes a device in the asset inventory.

The book's answer is one authoritative DDI policy plane. That's an architectural requirement, not a product, and it's the yardstick for everything that follows.

## Slide 3 — No rule names a vendor; the rules name capabilities

First, before any procurement: no OMB memorandum, directive, executive order or NIST publication names a DDI vendor, or requires a product category called a DDI platform. They require capabilities.

SP 800-53's SC-20, SC-21 and SC-22 ask for signed answers, validating resolvers and fault-tolerant, role-separated name service. OMB M-08-23 still requires DNSSEC on applicable systems. M-22-09 requires encrypted DNS wherever it's technically supported, to agency-designated resolvers that log the queries. Executive Order 14144's section on encrypted DNS survived the June 2025 amendments: agencies enable it within 180 days wherever clients and servers support it, and CISA is directed to publish contract language for any product that acts as a DNS resolver. Civilian agencies must use CISA's Protective DNS for all egress resolution. And TIC 3.0 lists the matching DNS capabilities.

On logging, be precise. M-26-14 rescinded M-21-31 in May 2026, and it doesn't mention DNS at all. It sets retention: six months searchable, twelve retrievable. CISA's Logging Reference Architecture then maps the old DNS, DHCP and passive DNS categories to network activity, and calls them foundational. That's guidance mapped to a baseline, not a standalone DNS mandate.

For addresses, BOD 23-01 asks for discovery across all agency IPv4 space every seven days, BOD 26-04 asks for quarterly attestation of public IP addresses and domains, M-21-07's IPv6 milestones have all passed, and CM-8 wants an accurate inventory.

NIST SP 800-81 Revision 3 ties these together. It's guidance, not a mandate, and two of its three authors work for a DDI vendor, which is worth knowing when a vendor cites it.

## Slide 4 — Authoritative DNS across clouds, with DNSSEC kept central

Now seven capabilities, each tied to a requirement.

First, authoritative DNS across every environment without split-brain. The platform has to hold one system of record for zones, forwarding rules and policy, and every cloud DNS service consumes it. The Federal Modernization Workbook's Book 08 calls this overlay management, not replacement: Route 53 still serves Route 53 zones, but the policy plane holds each rule once and pushes it everywhere, including to branch resolvers. Underneath, SC-22 asks for fault-tolerant name service with internal and external roles separated.

When you evaluate products, ask whether each cloud integration writes to the cloud or only reads from it. The book gives examples. One product's cloud discovery imports Route 53, Azure and Google zones but can't export changes back. Another's Azure DNS sync handles only simple-routing records and leaves NS records read-only. Each decides how a change reaches the cloud.

Second, DNSSEC with central key custody. The book's position is to sign external zones and dot-gov delegations always, validate on every agency resolver, and sign internal zones only where the authorization requires it. Rollover should be automated and audited in one place, and NIST recommends a hardware security module for important keys, usually the key-signing key. The clouds don't fill the gap: Route 53 and Azure DNS sign public zones only, and the default Azure resolver doesn't validate. And check the defaults. Windows Server's default zone-signing key is 1,024-bit RSA, below NIST's floor, and NIOS defaults to RSA with SHA-1.

## Slide 5 — DNS security: agency policy first, Protective DNS upstream

Third, DNS security: two layers in series. The agency's own resolvers apply the agency's policy, response policy zones or a DNS firewall, with every hit logged. Then all egress recursion goes upstream through CISA's Protective DNS, which blocks, redirects or sinkholes queries that match threat indicators. So the platform has to forward to it, preferably encrypted, and that's worth testing: CISA's own guidance notes that some vendors don't support the protocols for forwarding queries to its resolver.

Order matters more than presence. The Federal Modernization Workbook's Book 08's Decision 2 is that the agency resolver is always the first hop. If the agency also uses a SASE provider's DNS service, that service is a forwarding target of the agency resolver, never the place the branch edge redirects to. Every component present, in the wrong order, quietly removes the agency's own policy, validation and logging.

Encrypted DNS completes it. M-22-09 requires encrypted DNS wherever technically supported, with endpoints explicitly configured to agency-designated resolvers rather than ones they discover. So the platform must terminate DNS over HTTPS or TLS on its resolvers and use it upstream. And clients mustn't route around it: TIC 3.0 includes filtering that blocks unauthorized DNS over HTTPS resolvers.

One product detail to check. Endpoint DNS agents commonly listen on the device's loopback address. They protect a roaming laptop, but an SD-WAN edge can't redirect to them, so they don't replace a network-addressable branch resolver.

## Slide 6 — IPAM as the address authority, DHCP that stays up

Fourth, IPAM as the authority, with discovery. Left alone, each cloud's address manager allocates independently, recreating split-brain for addresses. The book's rule is that every block is reserved in the enterprise IPAM before a cloud or NSX network is created. Where a cloud lets an external IPAM hold allocation authority, use it; AWS VPC IPAM can, but only in commercial Regions, not GovCloud. Elsewhere, mirror the reservations into the native pools and reconcile continuously.

Discovery is where IPAM meets the directives. BOD 23-01 asks for automated discovery across all agency IPv4 space every seven days, and you can't scan space you haven't recorded. BOD 26-04 asks agencies to attest their public IP addresses and domains every quarter. And M-21-07's IPv6-only milestones mean IPv4 and IPv6 have to be planned in the same tool.

Fifth, DHCP that stays up and stays honest. Failover partners move and are tested together, and both use the same DNS update credentials, or a takeover leaves names that nobody can update. Ask how DHCPv6 stays available: in the two products checked, Windows Server and NIOS, failover is documented for DHCPv4 only, which matters under the IPv6 targets. Set option 6, the resolver list, centrally, detect rogue DHCP servers and router advertisements, and keep lease history. NIST's guide calls for it, because it's what turns an address in a query log into a device.

## Slide 7 — Automation and logging: every change and query on record

Sixth, automation. No rule requires an API, but the Federal Modernization Workbook's Book 08's operating model depends on one. Every object, addresses, DHCP, DNS configuration and DNS data, should be reachable through a documented API, so infrastructure as code, ITSM workflows, certificate automation and pipelines all go through the same authority and the same audit trail. Automation runs as non-interactive service accounts, held to the same roles and scopes as people and unable to log in to the console. Expect supported Terraform and Ansible, ITSM actions that reserve an address or register a record, and a path for existing scripts. Check how the API authenticates; NIOS, for example, added OAuth 2.0 and OpenID Connect for its API in release 9.1.

Seventh, logging to the SIEM, sized for the load. The requirement here is M-26-14's retention: logs searchable for six months and retrievable for a year, with synchronized timestamps, available to the agency's security operations center. The name layer contributes query logs, lease history, policy hits and the change audit trail.

Capacity is where designs fail. Microsoft measured about five percent degradation from full Windows DNS query logging at 100,000 queries a second. NIOS reporting appliances have daily ingest limits, and after five overruns in a rolling thirty days the reporting functions lock until support intervenes. And dnstap on NIOS drops records rather than buffering them when the receiver is down. Size for peak, and test with the SIEM unreachable.

## Slide 8 — Before you buy: check the evidence, not the brochure

Before buying any DDI product, check the evidence an assessor will ask for, not the feature list.

Start with FedRAMP, and read the listing's scope, not just its badge. FedRAMP certifies a specific cloud service offering. A SaaS management plane needs a certification at the right level, and the agency still authorizes its own DDI system. Software and appliances the agency runs aren't covered by any listing; they sit inside the agency's own boundary. And a Moderate certification doesn't cover High or DoD workloads.

Then the security baselines. Especially for DoD systems, ask whether DISA publishes a vendor-specific STIG, or whether only the generic DNS security requirements guide applies. Ask for an active FIPS 140-3 certificate, and look up its status yourself. FIPS 140-2 certificates moved to NIST's historical list on September 21, 2026, and historical modules may be used for existing systems only. So a new deployment that relies on validated cryptography can't cite a historical certificate. Ask about NIAP. And know that CISA's CDM Approved Products List isn't accepting new submissions; the latest list is from April 2025.

Advisory response: does the vendor track the open-source DNS code underneath? CISA added an old BIND vulnerability to its Known Exploited Vulnerabilities catalog on October 8, 2026. And licensing: know what's metered. Azure's DNS Private Resolver bills 180 dollars a month per endpoint at list price; one DDI vendor's SaaS uses subscription tokens that expire at term end. Model three to five years.

## Slide 9 — Product evidence status, as of October 22, 2026

Here's what those checks returned for four DDI products on October 22, 2026. It's a status snapshot, not a ranking, and any cell can change, so confirm on the day you decide.

FedRAMP. One of the four has a listing: Infoblox Government Cloud, Certified at Class C, Moderate, as SaaS in AWS GovCloud, with one agency authorization. It covers the SaaS, not on-premises NIOS appliances. BlueCat, EfficientIP and Micetro have no listing. Their products run as software or appliances inside the agency's own boundary, where the agency's authorization covers them.

STIGs. DISA publishes vendor-specific STIGs for Infoblox: NIOS 9.x, version 1 release 1, and the 8.x DNS STIG, version 1 release 4. None was found for the other three.

FIPS 140. BlueCat holds an active FIPS 140-3 certificate, number 5506, a Level 1 software module that sunsets in August 2029. Infoblox's FIPS 140-2 certificates are now historical, and four FIPS 140-3 modules are in NIST's review queue. No certificate was found for EfficientIP or Micetro, and it wasn't verified whether BlueCat's certificate covers Micetro.

NIAP. None of the four has a current certification. Infoblox's NIOS 9.0 is in evaluation, and BlueCat's entries are archived. And none appears on the April 2025 CDM list.

So every candidate has a gap to close, in the contract or in a plan of action and milestones, whether that's an authorization, a STIG or a validated module.

## Slide 10 — Divisions get a fenced scope; everything else is denied

Now the question many agencies care about most: can divisions run their own DNS, DHCP and IPAM without breaking central governance? The Federal Modernization Workbook's Book 08 says yes, if the platform supports a specific model. Corporate administrators see everything. Each division gets a scope limited to its own zones, address blocks and DHCP scopes, with predefined manager, operator and auditor roles, and automation accounts held to the same scope.

As an example, in Infoblox NIOS every resource is denied by default. A division's administrator group gets read-write on its own address block, which cascades to its networks, ranges and reservations; read-write on its own zones, with read-only on the parent view; and DNS and DHCP permissions, including service restarts, on its own servers only. One setting matters: it makes address and pointer records need rights on both the zone and the address block, so a division with access to a shared zone can't point a name into another division's space. And only central superusers create groups, roles and tag definitions, so a division can't widen its own rights.

Administrators must prove who they are. Expect PIV and CAC certificate login checked against OCSP, and SAML single sign-on where the identity provider's group decides the user's division. In NIOS, group names must match exactly and the first match wins, so order the mappings deliberately. Keep a local break-glass administrator.

And check automation scoping in the product you're evaluating. In Universal DDI, service users can't sign in to a divisional access view with API keys.

## Slide 11 — Overlapping space, views and tags keep divisions apart

Three constructs keep divisions apart.

First, separate address spaces. When a lab's private range overlaps headquarters and renumbering isn't practical, IPAM needs a separate routing domain, so the same addresses can exist twice. Infoblox calls these network views; Universal DDI uses IP spaces. Two consequences follow. In NIOS, a DHCP server serves only one network view, so a division with overlapping space needs its own DHCP servers. And NIOS doesn't enforce uniqueness across views; Universal DDI's IPAM Federation does, recording which blocks are globally unique, which are delegated, and which overlap deliberately behind NAT.

Second, DNS views, which give different answers to different clients by source address or key. The first matching view wins, so an external catch-all placed first hides the internal view. Cloud services have their own versions; an Azure private zone answers only the networks linked to it.

Third, tags for ownership: division, cost center, site. Infoblox calls them extensible attributes; Universal DDI calls them tags. They drive filtering and reports, not permissions. And a required tag is enforced only in the graphical interface. Objects created through the API or a CSV import can skip it, so the automation has to enforce the division tag itself.

One trap: in NIOS, report data isn't filtered by object permissions. Granting a division the reporting app shows it agency-wide DNS and DHCP data, so share dashboards per division instead.

## Slide 12 — Approvals work only if nothing goes around them

Delegation needs change control, and the useful pattern is an approval workflow. A division's group submits a change, with a ticket number required. A central approver group approves, rejects or reschedules it. The task then runs with the submitter's own permissions, so approval can't grant rights the division doesn't have, and it lands in the audit log with a task identifier. That's NIOS; a Universal DDI equivalent wasn't confirmed, so ask.

The weakness of any workflow is what goes around it. In NIOS, CSV imports don't require approval at all, and the console warns when a submitter group holds import permission; remove it from every division group. Service restarts aren't subject to approval either. Some operations are blocked for submitters even when they hold the permission: signing or unsigning zones, key-signing key rollovers, resizing or splitting networks, and bulk edits. And a zone delegated to a division's own servers leaves the platform entirely: its changes, its response policy and its signing.

So decide what stays central in every pattern. The superuser accounts, and the definitions of groups, roles and tags. The approval workflows and the authentication policy. DNSSEC keys and signing. Security policy, meaning response policy zones and threat feeds. The top-level address blocks. And logging, with the platform-wide DNS and DHCP settings.

## Slide 13 — Four delegation patterns, four sets of trade-offs

Those pieces make four delegation patterns, each with a cost. They're drawn from Infoblox's documentation but apply to any comparable platform.

Pattern A: one central platform with delegated division administrator groups. You get one database, one audit log, and one DNSSEC and response-policy posture, with everything denied by default. The risks are permission sprawl, first-match ordering surprises when roles overlap, the import bypass, and reports that ignore permissions.

Pattern B: division-owned servers inside the central platform. The division gets local resilience and can restart its own services, confined to its own servers. But it can't change platform-wide settings, and signed zones still have a central hidden primary, because in NIOS only the Grid Master can be primary for a signed zone.

Pattern C: a separate network view or IP space per division. It's the only way to hold overlapping private address space, and it draws a clean visibility boundary. It needs dedicated DHCP servers per view, and uniqueness across views needs federation.

Pattern D: delegate a zone to DNS servers the division runs itself. That's full autonomy, with any DNS software. But central loses the audit trail, the response policy coverage and the signing of that zone, and keeps only the parent zone, the delegation records and, if the child is signed, its DS records.

The patterns combine, and the worked example uses all four.

## Slide 14 — Worked example: four divisions, one governed platform

Here's an illustrative design, not a validated configuration, for an agency that owns ten dot zero slash eight and example dot gov, with four divisions.

Headquarters is the central network operations team. It holds its own slash-twelve block and its own zone under pattern A, and it hosts the central superusers and a read-only approver group. If example dot gov is signed, the central management node signs it as hidden primary.

The law-enforcement bureau needs confidentiality from the other divisions. It gets its own block and its own zone, served from its own two servers, patterns A and B, and nothing else, because everything else stays denied. Its data stays out of shared dashboards. If its change detail shouldn't reach headquarters approvers, a bureau-lead approver group can own its workflow.

The regional office still runs Windows DNS and DHCP. The platform manages those servers, and the region's group gets rights on them only, never the platform-wide DNS and DHCP administrator roles. Each server's network view is fixed at first sync.

The research lab numbered itself in a range that overlaps headquarters. It gets its own network view or IP space and its own DHCP pair, pattern C, and its zone is delegated to lab-run BIND servers, pattern D. The lab hands central the DS records for its signed zone, and federation records its space as an overlapping block behind NAT.

## Slide 15 — Who decides, under Book 08's responsibility matrix

Who decides all this? The Federal Modernization Workbook's Book 08's Chapter 09 gives one decider per row, and separates deciding from doing.

The sponsor and CIO decide the platform and its deployment model, with the DNS/DDI team doing the evaluation and the CISO, the authorizing official and the operating teams consulted. They also decide how divisions are scoped, and break ties over the resolver path.

The authorizing official decides whether a cloud-delivered management plane is authorized for the agency's use, and accepts the standing exceptions: an internal zone that loses DNSSEC in its new home, or an encrypted DNS exception that has outlived the agency's limit.

The CISO and ISSO set the control requirements: DNSSEC signing of public zones and validation on agency resolvers, encrypted DNS policy, and Protective DNS forwarding and query logging.

The DNS/DDI team decides the namespace and the delegation of zones to divisions and applications, owns the address plan and its top-level blocks, and approves high-impact changes: zones, NS and DS records, forwarding rules, wildcards and response policy. Standard record changes inside a division's delegated namespace are pre-approved, so the division or application owner does the work through a scoped account, without a change board.

That team holds the most powerful roles in the design, so the book scopes its automation, puts a second approver in front of zone, delegation and forwarding changes, and keeps its privileged roles eligible rather than standing.

## Slide 16 — Decisions to make, and the next steps

So, the decisions and the next steps.

First, the sponsor and CIO authorize one authoritative DDI policy plane, and the DNS/DDI team settles the Federal Modernization Workbook's Book 08's five configuration decisions within 90 days and reports the residual risk to the authorizing official. That's the book's ask.

Second, write the requirement as capabilities, each mapped to the rule behind it: signing and validation, encrypted DNS, Protective DNS forwarding, discovery and inventory, IPv6, logging retention. No rule names a product, so the solicitation shouldn't either.

Third, request the same evidence pack from every candidate: the FedRAMP listing and exactly what its scope covers, the STIG, an active FIPS 140-3 certificate, Common Criteria status, the advisory response commitment, and a three-to-five-year cost on the same assumptions. Record every gap with an owner.

Fourth, choose a delegation pattern for each division, write down what stays central, and pilot it with one division, ideally one with overlapping address space, because that's where the design gets tested.

Fifth, the CISO sizes logging to M-26-14's retention, and tests it at peak query rates and with the SIEM down.

The next step needs no award. List every DNS, DHCP and IPAM requirement your systems inherit, the capability each needs, and the evidence that would prove it. Book 08 has the detail, with every claim footnoted. Thank you.
