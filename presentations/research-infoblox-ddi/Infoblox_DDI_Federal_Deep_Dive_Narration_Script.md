# Infoblox DDI for Federal Agencies — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Infoblox DDI for Federal Agencies

Welcome. This is a technical deep dive from the Federal Modernization Workbook's Research section, and it's still under review. It's about Infoblox DDI, meaning DNS, DHCP and IP address management, on Infoblox's NIOS Grid and its cloud-managed service, Universal DDI. It's for the architects and engineers deciding whether to build an agency's name and address layer on Infoblox, and how to run it if they do. After a short orientation, Part 1 covers the platform and the case for it, including FedRAMP scope, the competition and the risks. Part 2 covers how a central team hands DDI to divisions without losing control. Every fact comes from a primary source opened on October twenty-second, 2026, and marketing is called a vendor claim.

## Slide 2 — DNS, DHCP and IPAM are one control plane

Here's why this matters. Almost every connection an agency makes starts with a DNS lookup, and in a hybrid, multi-cloud estate that answer decides far more than an address. DHCP and address management sit right beside it, because lease history is how an address maps to a device, and the address plan is the record behind the inventory directives. So this deck treats all three as one control plane. Book 08 of the workbook describes that plane: on-premises servers that answer, a management plane that holds the system of record, and local resolvers that keep working if it's unreachable. The argument of the session is simple. The rules need one governed DDI plane, and Infoblox is one of the strongest ways to build it, with real risks to manage.

## Slide 3 — What federal rules require, and what none of them say

Here's what the rules actually require, stated as capabilities. Sign agency zones and validate answers, with the 2008 DNSSEC memo still in force. Use encrypted DNS wherever it's technically supported, and forward to CISA's Protective DNS upstream. Logging is subtle: the May 2026 memo that replaced the old logging memo doesn't mention DNS at all, so DNS and DHCP logging is carried forward by CISA's Logging Reference Architecture, with six months searchable and twelve retrievable. And the inventory directives want regular discovery of agency address space and attestation of public addresses and domains. Now the honest starting point. No rule names Infoblox or any DDI vendor, so choosing a platform is an architecture decision.

## Slide 4 — Module 1: The platform

Module 1 is the platform. The names have changed and a lot of older material is now wrong, so we'll get an accurate picture: the Grid, the cloud side and its limits, DNS, DHCP and IPAM, security, automation and logging.

## Slide 5 — Grid architecture: one database, many members

The NIOS Grid is a group of appliances sharing one distributed database, run from a single point, the Grid Master, which every administrator goes through. Members can be physical hardware or virtual appliances, singly or in high-availability pairs, and they talk to the Grid Master over encrypted tunnels. A Grid Master Candidate holds a full copy, but promoting it is a manual job you can't do from the cloud portal. The current hardware is Trinzic X6, and the virtual appliances run on VMware and every major cloud, with Azure Government explicitly covered. On versions, NIOS 9.1.0 went GA in March 2026, and 9.0.6 started a long-term-support train. Next, the cloud-managed side.

## Slide 6 — Universal DDI and the Infoblox Portal, with its limits

Universal DDI is the cloud-managed side, renamed from BloxOne DDI in September 2024, and run from what's now called the Infoblox Portal. Its servers run either on your infrastructure or as a service from Infoblox's points of presence, and its management plane reaches out to the major cloud DNS services and to Microsoft DNS and DHCP. Infoblox markets it as a single control plane; that's a vendor claim, and Infoblox's own pages show why you should test it. The Portal can't promote a Grid Master Candidate or manage DHCP failover, the as-a-service option has no IPv6, and the cloud DNS sync handles only simple records. So "one console" is overstated: in practice you'll run both consoles side by side.

## Slide 7 — DNS: views, DNSSEC, DNS Firewall and encrypted DNS

DNS on NIOS is strong, with a catch for each feature. DNS views give different answers to different clients, and that's how you'd point internal traffic at CISA's Protective DNS. DNSSEC signing is central, done only by the Grid Master as a hidden primary, with keys there or on an external hardware security module, and automatic key rollovers. DNS Firewall blocks bad names with response policy zones, the Grid can manage Windows DNS and DHCP servers without an agent, and from 9.1, encrypted DNS is served, but only on X6 appliances, free there and an extra license on X5. And one setting you must change: the default signing algorithm is RSA with SHA-1, so pick something stronger before you sign. Next, DHCP and IPAM.

## Slide 8 — DHCP and IPAM: failover, network views, discovery

DHCP first. Failover peers talk to each other directly; the Grid Master isn't involved, whatever older material says. But failover is IPv4 only, which matters under the IPv6 mandate, though Windows has the same gap. Lease history is archived, which is the address-to-asset record NIST asks for. On the IPAM side, a network view is a single routing domain, and discovery tools read both the network and the clouds, though the deeper device discovery needs its own license and dedicated appliances, so budget for that. Two corrections to common claims: separate network views permit overlap, they don't prevent it. And the AWS address-management integration excludes GovCloud. Now, the security layer.

## Slide 9 — Threat Defense: DNS-layer security and intelligence

Infoblox Threat Defense is the DNS-layer security product. It blocks bad names, shares threat intelligence, and detects things like DNS tunneling, data exfiltration and command-and-control. It runs from the cloud or on premises, and one detection mode streams DNS metadata, including client addresses, to the cloud, so treat that as a boundary decision, not a checkbox. Licensing comes in four tiers, with the cloud pieces in the upper two. There's one strong independent signal: Google Cloud's own documentation describes its DNS Armor threat detection as powered by Infoblox. Then there are the marketing figures about how many threats it stops and how early. Nobody independent has verified them, so keep them out of anything an assessor reads.

## Slide 10 — Automation and logging: APIs, IaC, SIEM, reporting

Automation and logging decide whether the platform can be governed at scale. On automation, Infoblox is ahead of the other DDI vendors. NIOS has a REST API with modern sign-in from 9.1, and the Terraform provider moved to a 3.0 beta on October thirteenth that covers both NIOS and Universal DDI but isn't backward compatible, so plan that migration. Ansible and ServiceNow integrations exist too. Logging has sharper edges. Full query logging adds load, the dnstap stream drops logs if its receiver is down, and the built-in reporting appliances lock after repeated overruns of their daily ingest caps. So for federal retention, send logs to the SIEM and size reporting deliberately. That completes the platform.

## Slide 11 — Module 2: Why Infoblox, and why federal needs it

Module 2 is the case for Infoblox. We'll map each federal requirement to an Infoblox feature, read exactly what the FedRAMP listing covers, compare the competition, and lay out the risks, because a recommendation that hides its risks isn't usable.

## Slide 12 — From requirement to capability to Infoblox feature

This is the core of the argument: each requirement, the Infoblox feature that delivers it, and what to watch. Signing and resilient DNS map to the Grid Master and Grid replication, but candidate promotion is manual, so it belongs in a tested runbook. Encrypted DNS works on X6 hardware only. Protective DNS forwarding works per view, but no Infoblox document was found on encrypted forwarding to CISA, so confirm it in a lab. Logging and inventory are well covered, with the caps and hardware we just saw. IPv6 is there, but without DHCP failover. And validated cryptography is the real gap, with no active certificate today. Still, seven of eight requirements land on one platform and one database. That consolidation is the case.

## Slide 13 — FedRAMP scope: what the Moderate listing covers

FedRAMP is the most misquoted part of any Infoblox proposal, so let's read the record. The Marketplace lists Infoblox Government Cloud as FedRAMP Certified at Moderate, as SaaS in AWS GovCloud, with one agency authorization and a reuse count of zero. It covers Universal DDI and some security services, but not everything; ask Infoblox for the authorization boundary diagram. And the biggest point: NIOS appliances and virtual appliances on agency infrastructure aren't a cloud service, so no FedRAMP authorization covers them. They sit inside the agency's own boundary, and that's the path for High or DoD systems. With reuse at zero, expect to do your own ATO work. Ask, too, for a list of features the FedRAMP instance has versus commercial.

## Slide 14 — Trinzic hardware against the workbook's design

A narrower question: if an agency buys Trinzic, the physical appliances, how well does the hardware fit Book 08's design? The Grid gives one shared database with an HA Grid Master and a candidate, though promotion is manual and Infoblox publishes no scale limits, so size it with the vendor. Domain controllers can send Kerberos-signed updates to it, signing is central, and IPAM is built in. The watch points are the ones we've seen: change the signing default, X6 for free encrypted DNS, dedicated appliances for deep discovery, and reporting caps. Trinzic sits inside the agency's boundary, outside the FedRAMP listing. And its FIPS 140-2 certificate went historical in September, with newer modules pending. Next, the clouds.

## Slide 15 — Trinzic alone, or with cloud DDI?

Can Trinzic run an agency's DDI alone once workloads move to the clouds? On its own, it can see into them, discovering networks and importing zones one way, but it can't own cloud DNS. There are three ways to extend it, and they combine: virtual appliances in each cloud, Universal DDI, which is the only Infoblox path that writes back to cloud DNS, or native cloud resolvers wired to the Grid with forwarding both ways. The design guidance is this: mostly on premises, use native resolvers with forwarding; hybrid, add virtual appliances; multi-cloud at Moderate, add Universal DDI; and for government clouds, FedRAMP High or the higher Defense levels, don't depend on the SaaS. The Trinzic explainer has the full reasoning.

## Slide 16 — Assurance: STIGs, FIPS 140, NIAP and SP 800-81r3

Now the assurance evidence, checked on October twenty-second. DISA STIGs are a real strength: Infoblox has two current vendor-specific STIGs, and neither BlueCat nor EfficientIP has one. FIPS 140 is the weak spot, so let's say it plainly. Infoblox has no active certificate today. Its FIPS 140-2 certificates moved to the historical list with the September 21, 2026 sunset, and four FIPS 140-3 submissions are still in NIST's queue. There's no current NIAP certificate either, with NIOS 9.0 in evaluation. And a note on NIST's DNS deployment guide: it's the best practical guide we have, but two of its three authors are Infoblox employees, so disclose that whenever you cite it in support of choosing Infoblox.

## Slide 17 — A fair comparison: dedicated DDI and native clouds

Here's a fair comparison. On FedRAMP, Infoblox is the only dedicated DDI vendor with a listing, though the hyperscalers' government clouds sit at High, a higher ceiling. On FIPS 140, BlueCat leads with an active FIPS 140-3 certificate valid to 2029. Infoblox leads on STIGs and has the broadest DNS security set. On automation, it has the deepest. DHCPv6 failover is missing everywhere we checked, so it's no differentiator. And alternatives do win in places: BlueCat's Micetro manages existing Windows and BIND servers in place, and a single-cloud workload may need no third-party plane at all. So the fair claim is a strong default for a hybrid federal estate, not the only viable choice. Now the risks.

## Slide 18 — Risks: certifications, vulnerabilities, authorization

Now the risks, stated plainly, with how to manage each. First, cryptographic validation: no active FIPS certificate today. If your system needs validated cryptography at award, tie go-live to the issued certificate, or carry the gap as a dated POA&M item, and ask which NIOS versions the pending modules cover. Second, no current NIAP certificate, and the CDM product list is closed, so don't promise anyone that status. Third, vulnerabilities: NIOS has had CVEs rated as high as 9.8, though none is in CISA's known exploited catalog, so write the patch cadence into the ATO plan. Fourth, NIOS runs on BIND, so ask for a BIND advisory commitment. And fifth, the SaaS tops out at Moderate with zero reuse.

## Slide 19 — Risks: cost, capacity, features, and procurement asks

The second set of risks is about cost, capacity and features. Universal DDI licensing uses subscription tokens that expire at the end of the term, so model total cost over three to five years, including a hardware refresh. Size the reporting tier for the retention you need, or make the SIEM the system of record. Plan the hardware refresh around encrypted DNS, put a stronger signing algorithm in the build standard, and keep Grid Manager runbooks for what the Portal can't do. Ignore stale collateral and cite only the Marketplace record. Then turn the risks into contract obligations: a certificate timeline with a remedy if it slips, a BIND advisory commitment, the FedRAMP boundary diagram, and a data export guarantee.

## Slide 20 — Module 3: Divisions on NIOS

Part 2 is about divisions under central governance, starting with NIOS. Most agencies aren't one network, and a central plane only works if divisions can still do their jobs through it, because a division that can't will work around it.

## Slide 21 — The NIOS permission model: deny first, most specific

The NIOS permission model starts from the right place: everything is denied by default, so a new group sees nothing until you grant it something. Permissions can cover every object of a type, or one specific object and what's inside it, and they inherit downward, with more specific settings overriding. When permissions overlap, the first match wins. So if one role grants read-only and a later role grants read-write on the same records, the admin gets read-only, which can surprise you. Be careful with the built-in DNS and DHCP admin roles, which are far too broad for a division. And the governance lever: only superusers create groups and roles, so a division can't widen its own rights. Next, the recipe.

## Slide 22 — Scoping an admin group to one division

Here's the recipe for scoping one admin group to one division. Create a limited-access group with only the interfaces it needs; help-desk staff can be restricted to running approved tasks. Grant read-write on the division's own address space and its own zones, with read-only on the parent view, and confine its service work to its own servers. Leave everything else at the default deny. Then the step people miss: turn on the Grid setting that makes address records need rights on both the zone and the address block. Without it, a division with write access to a shared zone could point a name at another division's addresses. That one setting is what keeps divisions honest. Next, the constructs that separate them.

## Slide 23 — Network views, DNS views and extensible attributes

Three constructs separate divisions on NIOS, and each has a rule that shapes the design. Network views let two divisions hold the same addresses, but a DHCP server serves only one view, so a division with overlapping space needs its own DHCP servers, and nothing on NIOS enforces uniqueness across views. DNS views give different answers to different clients, and the first match wins, so a catch-all external view placed first hides the internal one. And extensible attributes tag objects with things like Division or cost center. Two cautions: a required tag can be skipped through the API, so automation must enforce it, and tags drive reports, not permissions. Access is always scoped by objects. Next, approvals.

## Slide 24 — Approval workflow, and the CSV import gap

The approval workflow is how central keeps a hand on division changes without doing the work. A division submits, a central group approves, reschedules or rejects, and approved tasks run with the submitter's own permissions and land in the audit log. The riskiest operations, like signing zones, rolling keys, or resizing networks, are blocked for submitters entirely, which suits a federal model well. Now the gap. Infoblox's own page says CSV imports do not require approvals. Leave that permission in place and a division can load a thousand records with no review at all. So remove CSV import from every division group, and give bulk loads to a central group under a change ticket. Next, sign-in.

## Slide 25 — Admin sign-in: CAC/PIV, SAML with Entra, directories

Who can sign in, and which group they land in, is the other half of division scoping. NIOS maps directory groups to its own admin groups, with the first match winning, so an AD group per division can decide where an administrator belongs. For federal staff, the important path is certificate sign-in with CAC or PIV, checked against OCSP. SAML works too, including with Entra, where the user lands in the group whose name exactly matches. A few things to test: certificate sign-in to the API can conflict with certain cloud licenses, SAML-only users get no command line, and it's not confirmed whether Entra sends the group name or its ID. Order mappings carefully, and keep a local break-glass admin.

## Slide 26 — Microsoft servers, what stays central, and reporting

Three topics close the NIOS module. First, a division still running Windows DNS and DHCP can be managed from the Grid, with the division's group given rights on its own servers only, not the system-wide Microsoft roles. Second, what stays central in every design: the Grid Master, DNSSEC keys and signing, security policy, the definitions of groups and roles, sign-in policy, and the top-level address blocks. Third, a limitation that surprises almost everyone. NIOS reporting doesn't filter by permissions, so a division with the reporting app sees agency-wide DNS and DHCP data. That matters a great deal for a law-enforcement bureau. So scope reporting by sharing dashboards per division instead. Next, splitting by service.

## Slide 27 — Separating DNS, DHCP and IPAM by team

Divisions aren't the only way to cut DDI. Many agencies split it by service, with DNS, DHCP and IPAM teams working across the whole agency, and NIOS supports that with the same model. This is an illustrative design, not a validated configuration. The DNS team gets its views, zones and DNS servers, with no network rights. The DHCP team is where the catch is: a permission on a network also covers its ranges, so grant the ranges and fixed addresses directly instead. The IPAM team gets the address containers, with an explicit deny on DHCP ranges if that team owns them. And the same Grid-wide setting from before becomes a deliberate check between the DNS and IPAM teams. Next, combining both.

## Slide 28 — Service teams and divisions together

Service teams and divisions aren't alternatives; most agencies combine them, because a grant can be scoped by service and by address space at once. Again, it's illustrative. The central DNS team keeps the agency's top zone and DNSSEC signing, the central IPAM team keeps the top-level blocks and hands each division its own, and divisions take over DHCP inside their own space. On Universal DDI the picture changes, and there's a documentation conflict over whether separate DNS and DHCP roles are supported in this release, so confirm with Infoblox. And one caution applies however you split: on NIOS, reports ignore permissions, so anyone with the reporting app sees agency-wide data. Now Universal DDI.

## Slide 29 — Module 4: Universal DDI divisions and operating model

Module 4 covers divisions on Universal DDI, and the operating model. We'll look at its access views and IPAM Federation, then four delegation patterns, a worked example, who does what, and a rollout sequence.

## Slide 30 — Universal DDI: access views, IP spaces, federation

On Universal DDI, the division construct is the access view, a container for a division's DDI resources. Corporate admins create one level of sub-views, and divisional admins can't see anything outside theirs. Assign an IP space and everything in it follows. The constraints are significant: users and roles are defined only centrally, access views can't be renamed or deleted, so name them carefully, and service users with API keys can't log in to one. The big gain over NIOS is IPAM Federation, which enforces address uniqueness across Universal DDI, NIOS and cloud IPAM, including deliberate overlap behind NAT. And remember the documentation conflict on supported roles. Confirm it with Infoblox. Next, the patterns.

## Slide 31 — Four delegation patterns and their trade-offs

Put together, these give four delegation patterns, and most agencies mix them. Pattern A is one central Grid with scoped admin groups and approvals, the default, with risks like permission sprawl and the import bypass. Pattern B gives a division its own servers inside the Grid, for local resilience, while signed zones still keep a central primary. Pattern C gives a division its own network view or IP space, the only way to hold overlapping address space. And pattern D delegates a zone to servers the division runs itself: full autonomy, but central loses the audit trail, security policy coverage and signing for that zone. Use A by default, B for resilience, C only for overlap, and D only where autonomy is worth it.

## Slide 32 — Worked example: four divisions on one Grid

Here's an illustrative design, not a validated configuration, for an agency with four divisions. Headquarters is the central operations team. A law-enforcement bureau needs confidentiality, so it gets its own servers, pattern B. A regional office still runs Windows DNS and DHCP, managed from the Grid with rights on those servers only. And a research lab whose range overlaps headquarters gets its own network view and DHCP servers, pattern C, with its zone delegated to its own servers, pattern D. Across the Grid: object permissions turned on, so headquarters can't point a name into the bureau's space, no CSV import for any division, one approval workflow each, and the bureau's data kept out of shared dashboards.

## Slide 33 — Who does what: the DDI responsibility matrix

Who does what? This matrix is adapted from Book 08's, which separates deciding from doing, with a column added for divisions. The CIO decides the platform and how divisions are scoped, and the central DDI team builds it, with divisions consulted, because a scope they can't work in becomes a workaround. The authorizing official decides whether a cloud management plane is authorized. The CISO decides the control requirements, like signing and security policy, and central DDI runs them. Standard record changes are where delegation pays off: central defines them in advance, and divisions do the work. High-impact changes stay central. And an encrypted DNS exception with no end date goes to the authorizing official.

## Slide 34 — Rollout sequence, decisions and next steps

To close, the rollout follows Book 08's order, adapted for divisions: inventory everything first, build the central pieces, coexist with the Windows servers in place, onboard divisions one at a time starting with pattern A, federate the clouds, then harden and evidence. The decisions to take now are the platform model for each impact level, the delegation pattern per division, whether to wait for the FIPS certificate or proceed with a POA&M, and where logs will live. Then send Infoblox the procurement asks and lab-test the open questions. In the program's analysis, Infoblox is one of the strongest ways to build a governed DDI plane, as long as you manage its risks in the open. This is research under review, not an endorsement by any federal agency. Thank you.
