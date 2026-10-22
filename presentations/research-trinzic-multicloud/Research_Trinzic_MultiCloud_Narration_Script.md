# Trinzic Alone, or Trinzic Plus Cloud DDI? — Explainer — narration script (practice copy)

## Slide 1 — Trinzic Alone, or Trinzic Plus Cloud DDI?

This explainer answers a question architects hit as soon as workloads move to the cloud. If we already run Infoblox Trinzic appliances on premises, can they handle DNS, DHCP and IP address management for AWS, Azure and Google Cloud by themselves? Or do we need to add some form of cloud-based DDI?

It's built for someone still learning DDI, so every term is explained the first time it appears. We start with the vocabulary, then what Trinzic does well and where it stops at the cloud edge. Then three options: Infoblox virtual appliances in each cloud, Infoblox's cloud service, and native cloud DNS alongside the Grid. Then the rules that keep answers consistent, a decision table, and where this fits the workbook.

This is research under review. Every fact comes from vendor or government documentation opened on October twenty-second, 2026, and recommendations are labeled as design guidance, not endorsements.

Sources: Infoblox NIOS 9.1.x, vNIOS and Universal DDI documentation; AWS, Microsoft Learn and Google Cloud documentation; FedRAMP Marketplace products.json; Book 08.

## Slide 2 — The words you need before we start

First, the words you need.

DDI stands for DNS, DHCP and IPAM. DNS turns names into addresses. DHCP hands addresses to devices when they join a network. And IPAM, IP address management, is the record of which address ranges exist and who owns them. An authoritative server holds the official answer for a zone, a block of names such as corp dot agency dot gov. A resolver is the server your computer asks; it finds the answer.

A Grid is two or more Infoblox appliances that share one database and are managed from one place. That place is the Grid Master, which holds the master copy, serves the console, and is the only appliance that can sign zones with DNSSEC. Every other appliance is a member. Trinzic is Infoblox's physical appliance line; the current one is X6. vNIOS is the same software as a virtual machine, including in AWS, Azure and Google Cloud, and it can join the Grid. NIOS-X is a newer kind of server, managed from Infoblox's cloud service, Universal DDI, whose web console is the Infoblox Portal.

The cloud words. In AWS, the resolver built into every virtual private cloud, or VPC, is now called Route 53 VPC Resolver. Its endpoints are addresses that let queries come in from outside, or go out by rules. A private hosted zone in AWS, or a private zone in Azure or Google, is a zone that only linked cloud networks can see. VPC IPAM is AWS's address planner. And Azure DNS Private Resolver is Azure's version of those endpoints.

Last, split-brain: two systems each believe they own a name and give different answers depending on who asks. Avoiding it is the point of this deck.

Sources: Research glossary: Infoblox NIOS 9.1.x About Grids and Grid Master Candidate; vNIOS for AWS, Azure and Google Cloud; Universal DDI What's New (renames); AWS What is Route 53 VPC Resolver, private hosted zones, What is IPAM; Microsoft Learn Azure DNS Private Resolver; Google Cloud DNS best practices.

## Slide 3 — What Trinzic is, and what it does well on premises

On premises, a Trinzic Grid is the agency's DNS and DHCP servers plus its address record, all managed from the Grid Master. Changes made there replicate to every member over encrypted tunnels.

It does several things well. DNS views let one Grid give internal clients one answer and outside clients another, on purpose. Response policy zones, which Infoblox calls DNS Firewall, block or redirect bad names, up to thirty-two of them, with hits logged to syslog. DNSSEC signing is centralized: only the Grid Master can be primary for a signed zone, and keys live on the Grid Master or on an external hardware security module, a Thales Luna or Entrust nShield, but not both. One caution: the default algorithm is RSA with SHA-1, which a federal deployment should change. DHCP runs as failover pairs. And the Grid can manage existing Windows DNS and DHCP servers without agents.

Why does that matter? Book 08 of the workbook argues for one DDI policy plane: a single system of record for zones, forwarding rules, address data and security policy, with cloud DNS managed as an overlay, not replaced. On premises, the Grid fits that role. The question is the cloud edge. And note that on-premises appliances aren't a FedRAMP cloud service; they sit inside the agency's own boundary.

Sources: Infoblox NIOS 9.1.x: About Grids, Configuring DNS Views, About Infoblox DNS Firewall, Configuring DNSSEC on a Grid, Setting DNSSEC Parameters, DHCP Failover, About Managing Microsoft Windows Servers; Book 08, Chapter 08, What a DDI policy plane is made of; FedRAMP Marketplace products.json (FR2017257053 scope).

## Slide 4 — What Trinzic alone sees in the clouds, and can't control

It can see. vDiscovery logs in to AWS, Azure, Google Cloud or VMware on a schedule and pulls back networks and virtual machines. AWS jobs have a GovCloud option, and Azure jobs cover Azure Government. Discovered subnets become managed networks, and the Grid can create records for discovered machines in zones it already has. It's a scheduled pull, not a live feed.

It can also import cloud zones. With a Cloud Network Automation license, NIOS copies Route 53, Azure DNS and Google Cloud DNS zones into the Grid, so on-premises clients can resolve cloud names. The import is one way. For Route 53, Infoblox says the sync runs into NIOS, not vice versa, and NIOS edits to those records are overwritten.

Now what it can't control. It can't create or own a cloud private zone. No NIOS document describes managing Route 53 VPC Resolver endpoints or rules, or Azure's forwarding rulesets. It can't be the outside authority for AWS VPC IPAM; that's a Universal DDI feature. And it can't run DHCP for cloud subnets. AWS hands out addresses from its own DHCP servers. Google limits vNIOS DHCP to on-premises networks, and Azure doesn't support running DHCP in Azure for on-premises networks.

So, as an inference: in the cloud, Infoblox's job is DNS and IPAM, and the cloud's resolver still answers cloud private zones.

Sources: Infoblox NIOS 9.1.x Selecting the Endpoint Server, vDiscovery AWS, Guidelines for vDiscovery Jobs, Creating DNS Records for Discovered VMs, Cloud Network Automation; Amazon Route 53 Integration Overview; Integrating Azure DNS and Google Cloud DNS with NIOS and their limitations pages; AWS DHCP option sets; Limitations of vNIOS for Google Cloud; About vNIOS for Azure.

## Slide 5 — Option A: vNIOS members inside each cloud

Option A puts vNIOS members inside each cloud, as Grid members and high-availability pairs. Infoblox's AWS reference design puts the pair in a shared-services hub VPC that syncs with the on-premises Grid Master. Signed zones stay signed: the members serve them, but the keys stay on the Grid Master.

How do cloud workloads reach vNIOS? Two documented patterns.

Pattern one: point the network's DNS at vNIOS. In AWS that's a DHCP option set; in Azure, the virtual network's custom DNS setting. Simple, with a catch. In Azure, queries then go straight to vNIOS, and Azure private zones aren't consulted first. So vNIOS has to forward Azure-private names back to Azure DNS at 168.63.129.16, or to a Private Resolver inbound endpoint.

Pattern two: keep the cloud's own resolver and forward chosen domains to vNIOS. In AWS, that's an outbound endpoint and one forwarding rule per domain, and rules can be shared across accounts. In Azure, it's an outbound endpoint and a forwarding ruleset, and clients change nothing. In Google, it's a forwarding zone, which Google prefers.

One AWS caution. If vNIOS has to resolve Route 53 private zones for other networks, forward to an inbound endpoint. AWS says forwarding to a VPC's built-in plus-two resolver address from outside that VPC isn't supported.

And every vNIOS member is agency-operated and inside the agency's boundary; no FedRAMP authorization covers it.

Sources: Infoblox About vNIOS for AWS, Shared-Services VPC Deployments, About vNIOS for Azure, Configure vNIOS as Primary DNS for Azure VNets, vNIOS for Google Cloud; AWS DHCP option sets, What is Route 53 VPC Resolver, Forwarding outbound queries, Resolving queries between VPCs and your network; Microsoft Learn DNS Private Resolver and VNet name resolution; Google Cloud DNS best practices; research_platform (DNSSEC on a Grid).

## Slide 6 — Option B: the Grid joined to Universal DDI

Option B joins the Grid to Universal DDI, Infoblox's software-as-a-service control plane.

You add a join token from the Infoblox Portal to the Grid, then turn on IPAM Federation and Cloud Grid Management. Federation, which needs NIOS 9.0.4 or later, keeps address space unique everywhere. The Grid stays primary for its DNS data.

What does it add? It's the only documented Infoblox mechanism that writes back to cloud DNS. It syncs Route 53, Azure DNS and Google Cloud DNS read-write, and it discovers resolver endpoints and rules in AWS and Azure. Cloud forwarders take queries in from a cloud, and cloud to cloud only between AWS and Azure. And on commercial AWS, Infoblox can be the outside authority for a VPC IPAM private scope, on the Advanced Tier.

The limits are documented. Route 53 sync doesn't support non-simple routing policies. Azure and Google private zones can't be created from the portal. DNSSEC records aren't synced. And the portal can't promote a Grid Master Candidate or manage DHCP failover, so the Grid Master stays the recovery console.

Two more notes. The cloud forwarding and private-zone features run on NIOS-X servers, not classic Trinzic, so you'd need NIOS-X capacity. And the government edition: Infoblox Government Cloud is FedRAMP Certified at Moderate, hosted in AWS GovCloud. Its cloud discovery is limited: single AWS accounts and no Azure tenants. The VPC IPAM handoff isn't in its release notes, and AWS excludes GovCloud from that integration. Confirm the rest with Infoblox.

Sources: Infoblox Onboarding NIOS Services, NIOS Grid Connector, Managing NIOS from Infoblox Portal, Universal DDI and NIOS Grid Hybrid Deployment, Limitations of AWS Route 53 Integration, Microsoft Azure Integration, Google Cloud Platform Integration, Cloud Forwarders and prerequisites, Discovering Cloud Forwarder Endpoints, Limitations of Universal DDI; AWS Integrate VPC IPAM with Infoblox and What's New Nov. 17, 2025; What's New in Universal DDI for FedRAMP; Universal Asset Insights AWS, Azure, GCP discovery pages; FedRAMP Marketplace FR2017257053.

## Slide 7 — Option C: Trinzic alongside native cloud DNS

Option C keeps the Grid authoritative for agency zones and lets each cloud's native DNS own its own private zones. The two connect by conditional forwarding: a rule that says, for names ending in this domain, ask that server.

Inward: the Grid forwards cloud domains to an inbound endpoint in AWS or Azure, or to an inbound server policy address in Google, over Direct Connect, ExpressRoute or VPN. Outward: each cloud forwards agency domains to the Grid, with an outbound endpoint and rules in AWS, a ruleset in Azure, or a forwarding zone in Google.

Facts to know. A Route 53 private hosted zone answers only inside its linked VPCs or through an inbound endpoint. Asked from anywhere else, the name resolves on the public internet instead. In Azure, a network using Azure-provided DNS checks linked private zones first, then forwarding rulesets, then Azure DNS. Google recommends exactly this design: two authoritative systems, conditional forwarding, no zone transfers.

In GovCloud, Route 53 public and private DNS work, and Resolver endpoints and rules are available, but Resolver delegation isn't.

Addresses follow the same idea. The Grid owns the agency's address blocks and hands each cloud a block. On commercial AWS, that handoff can be automated through Universal DDI. In GovCloud, Azure and Google, it's manual: reserve the block in the Grid, create the cloud pool with that range, and let vDiscovery check the result.

Sources: AWS Working with private hosted zones, What is Route 53 VPC Resolver, Forwarding inbound and outbound queries, Resolving queries between VPCs and your network, GovCloud Route 53 user guide, Route 53 endpoints; Microsoft Learn DNS Private Resolver, Azure Private DNS, AVNM IPAM; Google Cloud DNS best practices and server policies; AWS Integrate VPC IPAM with Infoblox and What's New Nov. 17, 2025.

## Slide 8 — The rules that prevent split-brain

Whatever option you pick, four rules prevent split-brain.

One: every zone has exactly one writable owner. That's the Grid, Route 53, Azure Private DNS or Cloud DNS, never two. Everything else reaches the owner by forwarding, or holds a copy that is explicitly read-only. NIOS overwrites edits to imported cloud zones, and portal-owned resolver rules overwrite cloud-side changes. So decide ownership before you turn sync on.

Two: divide the namespace by owner. For example, corp dot agency dot gov lives on the Grid, and aws dot corp dot agency dot gov lives in a Route 53 private hosted zone. On-premises resolvers forward the child to AWS, and AWS forwards the parent to the Grid. AWS also allows inbound delegation, but Resolver delegation isn't available in GovCloud. And don't create a cloud private zone with the same name as a Grid zone unless it's a deliberate split-horizon view.

Three: DNSSEC keys stay on the Grid Master or its hardware security module. Route 53 can't sign private hosted zones, and Universal DDI doesn't sync DNSSEC records, so don't sign in one system and manage through sync from another. Validation belongs on agency resolvers; the Azure-provided resolver doesn't validate.

Four: IPAM authority stays on the Grid. Clouds get delegated blocks, and one network view for routable space lets the Grid catch overlaps.

Sources: Research synthesis, Avoiding split-brain, DNSSEC keys and IPAM authority: Infoblox Route 53, Azure DNS and GCP sync pages; Discovering Cloud Forwarder Endpoints; AWS private hosted zones, Resolver, GovCloud Route 53, DNSSEC signing; Microsoft Learn DNS Private Resolver and Azure DNSSEC; Google Cloud DNS best practices; Infoblox DNSSEC on a Grid and Network Views; Book 08, Chapter 02.

## Slide 9 — Which option fits your agency? Design guidance

The decision table. Every row is design guidance, not an endorsement, resting on the facts we've covered.

Mostly on premises, with a small cloud footprint: Trinzic with native cloud resolvers and conditional forwarding, the minimal form of Option C. It's the lowest cost, needs no new SaaS authorization, and NIOS can't own cloud zones anyway.

Hybrid with one cloud, commercial or government: add an HA vNIOS pair in a hub network, Option A plus C. It keeps resolution local if the WAN fails and extends response policy, signed zones and Grid IPAM into the cloud. vNIOS is documented for both GovCloud and Azure Government.

Multi-cloud at FedRAMP Moderate and below: add Universal DDI on top, through Government Cloud for federal work. It's the only Infoblox mechanism that writes to cloud DNS, within the Government Cloud limits.

GovCloud, Azure Government, FedRAMP High, or Defense Impact Levels 4 and 5: stay with options A and C only. Infoblox's SaaS is Moderate-only, the VPC IPAM integration excludes GovCloud, and native services carry the higher authorizations. Google lists Cloud DNS for High, IL4 and IL5 under Assured Workloads. For Azure Government, confirm DNS Private Resolver is available first.

In short, the design guidance is: Trinzic plus native cloud resolvers as the baseline, with vNIOS and Universal DDI added only where they earn their place.

Sources: Research decision guidance table and its cited sources: Infoblox vDiscovery, vNIOS for AWS and Azure, Route 53 sync, Universal DDI integrations and FedRAMP release notes, Universal Asset Insights discovery pages; AWS Resolver, VPC IPAM + Infoblox, GovCloud Route 53; Google Assured Workloads supported products; FedRAMP Marketplace products.json.

## Slide 10 — Where this fits the workbook, and next steps

Where does this fit? Book 08 makes the vendor-neutral case. Chapter 02 explains split-brain, Chapter 07 covers cloud private endpoints and IPAM, Chapter 08 describes the policy plane that overlays cloud DNS, and Chapter 12 covers platform selection. The research deep dive, Infoblox DDI for Federal Agencies, covers the platform, its FedRAMP scope, its risks, and how divisions share it.

The decisions to take: which option for each cloud and impact level; one named owner for every zone; where DNSSEC keys live; and how address blocks reach each cloud.

The next steps. Ask Infoblox for the Government Cloud authorization boundary and a feature matrix for GovCloud and Azure Government accounts. Confirm that DNS Private Resolver and Virtual Network Manager IPAM are available in Azure Government. Size NIOS-X capacity if you want cloud forwarders. And test forwarding in both directions from every origin.

One note on standing: this is research under review, not an endorsement by any federal agency. Thank you.

Sources: Book 08, Chapters 02, 07, 08 and 12; research item Infoblox DDI for Federal Agencies; research_multicloud, Couldn't verify.
