# Infoblox DDI for Federal Agencies — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Infoblox DDI for Federal Agencies

This is a technical deep dive on Infoblox DDI for federal agencies: DNS, DHCP and IP address management, delivered on Infoblox's NIOS Grid and on its cloud-managed service, Universal DDI. It's for the architects and engineers who will decide whether to build an agency's name and address layer on Infoblox, and how to run it once they do.

After a five-minute orientation, it comes in two parts of about twenty-two minutes each, in four modules you can watch on their own. Part 1 covers the platform, then the case for it: which federal requirements it answers, what its FedRAMP listing actually covers, how it compares with BlueCat, EfficientIP, Microsoft and the native cloud services, and the risks you have to manage if you choose it. Part 2 covers divisions: how a central team hands DNS, DHCP and address management to bureaus and offices, on NIOS and on Universal DDI, without losing control, and it ends with a worked example, a responsibility matrix and a rollout sequence.

Two ground rules. Every fact here comes from a primary source opened on October twenty-second, 2026. And anything that is only Infoblox marketing is called a vendor claim when it appears.

Sources: Infoblox NIOS 9.1.x and Universal DDI docs; FedRAMP Marketplace products.json; NIST CMVP; DISA STIG file store; OMB and CISA publications; Book 08.

## Slide 2 — DNS, DHCP and IPAM are one control plane

Why this matters. Almost every connection an agency makes starts with a DNS lookup, and in a hybrid, multi-cloud estate that answer decides far more than an address.

DHCP and IP address management sit right beside it. NIST's Secure DNS Deployment Guide, SP 800-81 Revision 3, tells agencies to keep DHCP lease history so an IP address can be mapped to an asset. And the address plan is the record behind everything the inventory directives ask for, which we'll see on the next slide. That's why this deck treats DNS, DHCP and IPAM as one control plane rather than three services.

Book 08 of the workbook describes what that plane is made of, and it isn't one box. There's an authoritative and recursive layer on premises that hosts internal zones, answers clients, and applies response policy zones and DNSSEC. There's a management plane, more and more often delivered as a cloud service, that holds the system of record for zones, forwarding rules, address data and security policy. And there are local resolvers and agents that keep answering from local state if the management plane can't be reached. Cloud DNS isn't replaced; it's managed as an overlay.

So here is the argument of the whole session. Federal rules require capabilities, not products. Those capabilities, taken together, need one authoritative and governed DDI plane. Infoblox is one of the strongest ways to deliver that plane, with evidence, and it also carries real risks you have to manage. We'll cover both.

Sources: NIST SP 800-81r3; Book 08, Chapters 01 and 08.

## Slide 3 — What federal rules require, and what none of them say

Here is what the rules actually require, stated as capabilities.

DNSSEC: SC-20 in the low and moderate baselines means signing agency zones, and OMB M-08-23, from 2008, is still in force; we checked every 2025 and 2026 memo, and none rescinds it. SC-21 means validating answers on recursive resolvers. SC-22 asks for fault-tolerant DNS with internal and external roles separated. TIC 3.0, version 3.3, carries signing and validation as policy enforcement point capabilities.

Encrypted DNS: M-22-09 says agencies must resolve DNS using encrypted DNS wherever it's technically supported, and Executive Order 14144, section 4(c), which the June 2025 amendment left standing, repeats the push and adds contract language for any product that acts as a resolver. CISA's Protective DNS sits upstream: internal resolvers forward to it, and the agency keeps its own logs.

Logging is subtle. M-26-14, from May 2026, rescinded M-21-31 and doesn't mention DNS anywhere. What carries DNS and DHCP logging forward is CISA's Logging Reference Architecture from August, which maps the old DNS and DHCP categories into its network-activity baseline. Retention is six months searchable and twelve retrievable.

Inventory: BOD 23-01 wants discovery of all agency IPv4 space every seven days, and BOD 26-04, which replaced 19-02 and 22-01, wants public IP addresses and domains attested every quarter. M-21-07 set IPv6-only targets that have all passed. And SC-13 wants validated cryptography.

Now the honest starting point. No rule names Infoblox or any DDI vendor, and nothing requires a DDI platform. Windows DNS, BIND, or cloud DNS with a separate IPAM can meet these rules too. Choosing a platform is an architecture decision.

Sources: NIST SP 800-53r5 OSCAL 5.2.0; OMB M-08-23, M-22-09, M-26-14, M-21-07; EO 14144, EO 14306; CISA Protective DNS, Logging Reference Architecture, TIC 3.0 v3.3, BOD 23-01, BOD 26-04; NIST CMVP.

## Slide 4 — Module 1: The platform

Module 1: the platform.

Before arguing for or against Infoblox, we need an accurate picture of what it is in October 2026, because the names have changed and a lot of older material is now wrong. We'll start with the NIOS Grid, the on-premises architecture most agencies know, then the cloud-managed side, Universal DDI and the Infoblox Portal, including the limits Infoblox itself documents. Then DNS, DHCP and IPAM in turn, the Threat Defense security layer, and finally the automation interfaces and the logging and reporting path.

Sources: Infoblox NIOS 9.1.x admin guide; Universal DDI and Threat Defense documentation.

## Slide 5 — Grid architecture: one database, many members

The NIOS Grid is a group of appliances that share sections of one distributed database, configured and monitored through a single access point, the Grid Master. The Grid Master can be one appliance or a high-availability pair, and every administrator reaches the GUI through it, even administrators scoped to a single member.

Members can be physical Infoblox hardware or virtual vNIOS, singly or in HA pairs. The Grid Master talks to every member hub-and-spoke, over encrypted VPN tunnels on UDP 1194 by default, after a challenge-response authentication on port 2114. A Grid Master Candidate holds a complete copy of the database. Promoting it is a manual operation, and you can't do it from the cloud portal. HA pairs share one virtual IP and virtual MAC, with VRRP advertisements as the heartbeat. A Grid can run IPv4-only, IPv6-only or dual mode.

Form factors. The current hardware line is Trinzic X6, supported from NIOS 9.0.1. vNIOS for VMware runs from four virtual CPUs and thirty-two gigabytes up to thirty-two CPUs and three hundred eighty-four, and every model can be a Grid Master. vNIOS for Azure supports HA from 9.0.4 and explicitly covers Azure Government; note that Azure doesn't support running DHCP in Azure for on-premises networks. vNIOS for AWS can be a Grid Master in HA, and its vDiscovery has a GovCloud option. Google Cloud and Oracle Cloud are covered too, with OCI HA new in 9.1. NIOS-X servers are the data plane for Universal DDI, which is next.

Versions: NIOS 9.1.0 went GA in March 2026 and ships BIND 9.20. NIOS 9.0.6 introduced a Long-Term Support train with up to twenty-four months of support.

Sources: Infoblox NIOS 9.1.x About Grids, Promoting a Grid Master Candidate, About HA Failover, 9.1.0 What's New; vNIOS install guides; Supported Platforms for NIOS-X Servers; Infoblox NIOS 9.0.6 and 9.1.0 blogs.

## Slide 6 — Universal DDI and the Infoblox Portal, with its limits

Universal DDI is the cloud-managed side. It used to be called BloxOne DDI; Infoblox renamed it in September 2024, and the on-premises hosts became NIOS-X servers. The old Cloud Services Portal is now the Infoblox Portal, although the documentation still uses both names and the API host is still csp dot infoblox dot com.

The data plane is NIOS-X servers that you run, or NIOS-X as a Service, which Infoblox runs from its own points of presence in AWS and Google Cloud. The management plane reaches outward to Route 53, Azure DNS, Google Cloud DNS, Cloudflare and Akamai, and to Microsoft DNS and DHCP. It can also manage NIOS Grids from inside the Portal, and the documented hybrid DNS pattern makes NIOS primary and NIOS-X secondary. Infoblox markets this as a single cloud-based control plane and API; that's a vendor claim, and the limits on the right are why you should test it.

These limits come from Infoblox's own pages. Inside the Portal, the embedded NIOS view can't promote a Grid Master Candidate, show Splunk reporting or download files, and Multi-Grid Management isn't supported. NIOS DHCP failover associations can't be managed from the Portal. WAPI Passthrough reaches only the Grid Master. NIOS-X as a Service has no IPv6, no overlapping IP spaces and no Azure points of presence, which matters under the IPv6 mandate. The cloud DNS integrations sync simple routing records only, without tags, with NS records read-only and alias records turned into CNAMEs. And Google's DNSSEC records don't sync.

So "one console" is overstated: in practice you'll run Grid Manager and the Portal side by side.

Sources: Infoblox What's New in Universal DDI; Limitations of Universal DDI; Limitations of NIOS-X as a Service; Universal DDI and NIOS Grid Hybrid Deployment; Route 53, Azure DNS and GCP integration pages; infoblox.com Universal DDI page (vendor).

## Slide 7 — DNS: views, DNSSEC, DNS Firewall and encrypted DNS

DNS on NIOS 9.1, with the catch for each feature.

DNS views serve different answers to different clients from match lists of client or destination addresses. The first match wins, and you can set forwarders per view, which is how you'd point an internal view at CISA's Protective DNS.

DNSSEC is strong, with structure you must plan around. Only the Grid Master can be primary for a signed zone. It acts as a hidden primary and members serve the zone as secondaries. Keys live either on the Grid Master or on an external network HSM, Thales Luna or Entrust nShield, not both. Zone-signing keys roll automatically every thirty days by default, and key-signing keys yearly, automatically or by hand. If the parent zone is in the Grid, the new DS record is inserted for you; otherwise someone exports it to the parent, which for a dot-gov zone means the registrar.

DNS Firewall uses response policy zones: local, feed or FireEye, up to thirty-two of them, with hits logged to syslog in CEF format. GSS-TSIG lets Windows domain controllers make Kerberos-signed updates, up to two hundred fifty-six keys per member. Grid members can manage Windows DNS and DHCP servers without an agent, over MS-RPC, read-only or read-write, and 9.1 adds IPv6 management.

Encrypted DNS: from 9.1.0, DNS over TLS and DNS over HTTPS are served by BIND, but only on X6 appliances. Infoblox says they're free on X6 and need an extra license on X5.

One configuration item you must change: the default DNSSEC algorithm is RSA with SHA-1. Pick SHA-256 or an ECDSA curve before you sign anything.

Sources: Infoblox NIOS 9.1.x: Configuring DNS Views, Anycast, DNSSEC on a Grid, Setting DNSSEC Parameters, Thales Luna HSM, DNS Firewall, GSS-TSIG, Managing Microsoft Servers, DoT and DoH Architecture, 9.1.0 What's New; NIOS 9.1.0 blog (vendor).

## Slide 8 — DHCP and IPAM: failover, network views, discovery

DHCP first. Failover peers form an association over TCP, split clients by a hash of the MAC address, fifty-fifty by default, and send each other lease updates directly. The Grid Master isn't involved in failover, whatever older material says. An association serves ranges in one network view only, and failover is IPv4 only. That last point matters under the IPv6 mandate, though as we'll see in Module 2, Windows has the same gap. DHCPv6 itself is supported, including prefix delegation, and fixed addresses arrived in 9.0.6. Fingerprinting matches options 55 and 60 and is on by default, and filters can deny leases to device types per range. Lease history is archived and exportable, which is the address-to-asset record NIST asks for. Dynamic DNS updates from DHCP are something you turn on, not automatic.

IPAM. A network view is a single routing domain, up to one thousand per Grid. Views are mutually exclusive, so the same address space can exist in two of them. A DHCP member serves only one network view. Network containers hold the large blocks, and extensible attributes tag objects with metadata such as division or cost center. Discovery uses ICMP, NetBIOS or TCP, and vDiscovery reads vCenter, OpenStack, Azure and AWS. Network Insight, the layer-two and layer-three device discovery, needs its own license and dedicated appliances that run no DNS or DHCP; budget for that. Universal Asset Insights is the SaaS inventory service. And AWS documents Infoblox as the external authority for a VPC IPAM private scope, on the Advanced tier.

Two corrections to common claims. Separate network views permit overlap; they don't prevent it. And the AWS IPAM integration excludes the GovCloud regions.

Sources: Infoblox NIOS 9.1.x: DHCP Failover, DHCPv6 RFC Compliance, DHCP Fingerprint Detection, Lease History, Enabling DDNS, Configuring Network Views, About Discovery, About Network Insight, Extensible Attributes; Universal Asset Insights; AWS VPC IPAM user guide; AWS What's New, Nov. 17, 2025.

## Slide 9 — Threat Defense: DNS-layer security and intelligence

Infoblox Threat Defense, formerly BloxOne Threat Defense, is the DNS-layer security product. It bundles three things: DNS Firewall using response policy zones, TIDE, the Threat Intelligence Data Exchange, which aggregates and distributes machine-readable intelligence, and Dossier, which researches an indicator across about a dozen sources at once. It detects DNS tunneling and data exfiltration, domain generation algorithms, command-and-control and phishing.

It's delivered two ways. From the cloud, through the DNS Forwarding Proxy, the Infoblox Endpoint agent and a cloud resolver. And on premises, as RPZ feeds into NIOS or NIOS-X. On NIOS, Threat Insight detects tunneling and adds the destination to a mitigation RPZ automatically. Threat Defense Detection Mode streams DNS reply metadata from NIOS to the cloud for passive detection; that metadata includes client IP addresses, so treat it as a boundary decision, not a checkbox.

Licensing comes in four tiers: Essentials, Business On-Premises, Business Cloud and Advanced. The cloud delivery pieces come with Business Cloud and Advanced. Custom feed ingest in TIDE is Advanced only. Dossier gives thirty-two thousand queries a year on the Business tiers and sixty-four thousand on Advanced.

There's one strong independent signal. Google Cloud's own documentation describes its DNS Armor threat detection as powered by Infoblox. That's a cloud provider's statement, not Infoblox marketing.

And then there's the marketing. Infoblox says it stops ninety percent of threats before the first query, detects threats sixty-eight days before other tools, and has a false-positive rate of 0.0002 percent. Nobody independent has verified those figures. Keep them out of anything an assessor reads.

Sources: Infoblox About Threat Defense; Licensing and Subscriptions; Dossier and TIDE Overview; About Threat Insight (NIOS 9.1.x); TDDM for NIOS; Google Cloud DNS Armor docs; infoblox.com Threat Defense page (vendor claims).

## Slide 10 — Automation and logging: APIs, IaC, SIEM, reporting

Automation and logging, the two things that decide whether the platform can be governed at scale.

On automation, Infoblox is ahead of the other DDI vendors. NIOS's REST API, WAPI, shows version 2.14 in the 9.1.0 examples, and 9.1 adds OAuth 2.0 and OpenID Connect sign-in for the API and immutable object IDs. Universal DDI has its own REST API with API-key tokens. There's also a WAPI-compatible API for Universal DDI, but Infoblox says it's for migration only and isn't a long-term API. For infrastructure as code, the infobloxopen/infoblox Terraform provider went to a 3.0 beta on October thirteenth: one provider for both NIOS and Universal DDI, replacing three older ones, and not backward compatible, so state has to be re-imported. Plan that migration; don't build new work on the older providers. Ansible has current collections for both, and ServiceNow publishes an Infoblox spoke that needs IntegrationHub and a MID Server.

Logging has sharper edges. Query and response capture rolls files every ten minutes or hundred megabytes, with local retention capped by model, and Infoblox recommends not logging queries and responses together because of the load. dnstap runs on BIND in 9.1, but drops logs rather than buffering them if the receiver is down, so monitor the receiver. RPZ hits go to syslog in CEF. Cloud logs reach Splunk or Microsoft Sentinel through the Data Connector; Splunk's own Infoblox add-on is archived.

And the built-in Reporting appliances have daily ingest caps: ten gigabytes on the largest, five on the others. Exceed the cap five times in thirty days and reporting locks until Infoblox Support steps in. For federal retention, send logs to the SIEM and size Reporting deliberately.

Sources: Infoblox NIOS 9.1.0 What's New; Universal DDI API Guide; WAPI 2.0 for Universal DDI; infobloxopen terraform-provider-infoblox releases; infoblox-ansible and universal-ddi-ansible; ServiceNow Infoblox spoke; DNS Query and Response Captures; dnstap limits; Data Connector; Supported Reporting Appliances; Splunkbase 2934.

## Slide 11 — Module 2: Why Infoblox, and why federal needs it

Module 2: why Infoblox is a top recommendation, and why federal networks need what it does.

We'll build the case in four steps. First, map each federal requirement to the capability it demands and to the Infoblox feature that delivers it. Second, look closely at what the FedRAMP listing covers and what stays inside the agency's own boundary. Third, compare the assurance evidence and the features against BlueCat, EfficientIP, Microsoft and the native cloud services. And fourth, lay out the risks plainly, with how to manage each one and what to ask for in the contract. A recommendation that hides its risks isn't one an authorizing official can use.

Sources: FedRAMP Marketplace products.json; DISA STIG file store; NIST CMVP; NIAP PCL; CISA CDM APL; NVD; CISA KEV.

## Slide 12 — From requirement to capability to Infoblox feature

This is the core of the argument: each requirement, the capability it demands, the Infoblox feature that delivers it, and what to watch.

Signing agency zones: the Grid Master signs as a hidden primary, rolls keys automatically, and can keep keys in an HSM. Watch the RSA-SHA1 default and the DS record you'll still hand to the dot-gov registrar. Resilient, role-separated DNS: Grid replication, HA pairs, a Grid Master Candidate, anycast, and internal and external views. Watch that candidate promotion is manual, so it belongs in a tested runbook.

Encrypted DNS at agency resolvers: from 9.1, BIND serves DoT and DoH, but on X6 hardware only. Protective DNS: per-view forwarders send egress to CISA while the Grid keeps local logs. Watch one thing. CISA's FAQ notes that some vendors don't support the protocols for forwarding to its resolver, and our research found no Infoblox document on encrypted forwarding to CISA, so confirm it in a lab before you rely on it.

Logging: query capture, dnstap, lease history, CEF syslog and the Data Connector cover what the Logging Reference Architecture maps; watch the ingest caps and dnstap's drop behavior. Inventory for BOD 23-01, BOD 26-04 and CM-8: IPAM, discovery, cloud vDiscovery and Asset Insights give the authoritative address record; watch the dedicated hardware for Network Insight. IPv6: IPv6 Grids, DHCPv6 and prefix delegation, but DHCP failover is IPv4 only.

And validated cryptography is the gap: Infoblox's FIPS 140-3 modules are in NIST review, with no active certificate today.

Read across the rows: seven of eight requirements land on one platform and one database. That consolidation is the case for a governed DDI plane, and for Infoblox as a strong way to build it.

Sources: NIST SP 800-53r5; OMB M-08-23, M-22-09, M-21-07; EO 14144; CISA Protective DNS FAQ; CISA LRA; BOD 23-01, 26-04; Infoblox NIOS 9.1.x and Universal DDI docs; NIST CMVP modules in process.

## Slide 13 — FedRAMP scope: what the Moderate listing covers

FedRAMP is the most misquoted part of any Infoblox proposal, so let's read the record.

The Marketplace lists Infoblox Government Cloud, package FR2017257053, as FedRAMP Certified at Moderate, which the Marketplace now labels Class C, on the agency path, as SaaS hosted in AWS GovCloud. It was certified in December 2022 through the agency path, with Kratos as assessor. It shows one agency authorization and a reuse count of zero. There's no High listing, and we couldn't verify any DoD impact level.

What's in scope? The listing names Universal DDI, Universal Asset Insights, and the Threat Defense component services TIDE and Dossier. Infoblox's July 2026 blog says the offering now includes NIOS-X servers; treat that as a vendor claim until the package says so. What isn't named: the Threat Defense cloud resolver, the DNS Forwarding Proxy and the Data Connector. Ask Infoblox for the authorization boundary diagram before you design around them.

And the biggest point: NIOS appliances and vNIOS running on agency infrastructure aren't a cloud service at all. No FedRAMP authorization covers them. They sit inside the agency's own boundary and its own ATO, so a statement like "Infoblox's FedRAMP authorization covers the DDI layer" is an overclaim.

For High or DoD systems, the path is agency-operated vNIOS, for example from the Azure Government Marketplace, which Infoblox documents.

Two practical notes. With reuse at zero, expect to do your own ATO work rather than ride a widely reused package. And Infoblox keeps separate FedRAMP release notes whose latest entry is March fourteenth, while the commercial notes run to October seventeenth, which suggests the FedRAMP instance lags commercial features. Ask for the parity list.

Sources: FedRAMP Marketplace products.json, FR2017257053 (accessed Oct. 22, 2026); Infoblox blog, July 22, 2026 (vendor); What's New in Universal DDI for FedRAMP; vNIOS for Azure.

## Slide 14 — Trinzic hardware against the workbook's design

A narrower question: if an agency buys Trinzic, the physical NIOS appliances, how well does the hardware fit the design in Book 08 of the workbook?

One authoritative policy plane: the Grid gives you one shared database, an HA Grid Master and a candidate with a full copy. But candidate promotion is manual, and Infoblox publishes no Grid scale limits, so size it with the vendor.

Leaving Active Directory–integrated DNS: GSS-TSIG lets domain controllers send Kerberos-signed updates to the Grid. But an appliance can send GSS-TSIG updates or accept them, not both, so plan which members do which.

DNSSEC signing is central, on the Grid Master, with keys there or in a Thales Luna or Entrust nShield HSM. Change the RSA SHA-1 default. Encrypted DNS is served by BIND from 9.1, free only on X6; X5 needs an extra license.

IPAM and basic discovery are built in, but Network Insight needs a Discovery license and dedicated ND-series appliances that run no DNS or DHCP. Reporting appliances have daily ingest caps; five overruns in thirty days lock reporting, so send logs to the SIEM.

Trinzic sits inside the agency's own boundary and ATO. The FedRAMP Moderate listing doesn't cover it, which is why it's the path for High and DoD.

Assurance and lifecycle: certificate 4531 for Trinzic hardware went Historical in September, the FIPS 140-3 Trinzic modules are pending review, and NIAP has been evaluating Trinzic appliances with NIOS 9.0 since August 17. X6 needs NIOS 9.0.1 or later. Hardware is typically supported about four years after its last order date, and an internet-facing appliance past end of support may fall under BOD 26-02, though it doesn't name DNS appliances.

Sources: Infoblox NIOS 9.1.x: Promoting a Grid Master Candidate, About Grids, About GSS-TSIG, Configuring DNSSEC on a Grid, Setting DNSSEC Parameters, Thales Luna HSM, DoT and DoH Architecture, About Network Insight, Supported Reporting Appliances; NIOS 9.1.0 blog (vendor); NIST CMVP certificate 4531 and Modules In Process list; NIAP PCL; Infoblox End-of-Life policy; CISA BOD 26-02; FedRAMP products.json; Book 08.

## Slide 15 — Trinzic alone, or with cloud DDI?

So can Trinzic run an agency's DDI alone once workloads move to AWS, Azure and Google Cloud?

On its own, it can see into the clouds. vDiscovery pulls in cloud networks and VMs on a schedule, and NIOS can import Route 53, Azure DNS and Google Cloud DNS zones, one way only. What it can't do is own cloud DNS. Changes made in NIOS don't write back, and it can't create the clouds' private zones. No NIOS document describes managing Route 53 VPC Resolver rules or Azure DNS Private Resolver rulesets. It isn't the authority for AWS VPC IPAM, and DHCP in cloud subnets stays with the cloud fabric.

There are three ways to extend it, and they combine. Option A puts vNIOS members in each cloud, joined to the Grid, Azure Government included, so answers stay local during a WAN cut. Option B joins the Grid to Universal DDI, the only Infoblox path that writes back to cloud DNS, but the government edition is Moderate only, with limited discovery: single AWS accounts and no Azure tenants. Its cloud forwarders run on NIOS-X servers, not classic Trinzic. Option C keeps the native cloud resolvers and wires them to the Grid with conditional forwarding in both directions. And the AWS VPC IPAM handoff to Infoblox isn't available in GovCloud.

The bottom row is design guidance, not a rule. Mostly on premises: Option C. Hybrid with one cloud: A plus C. Multi-cloud at Moderate or below: add B. GovCloud, Azure Government, FedRAMP High, or IL4 and IL5: A plus C, and don't depend on the SaaS. For the full reasoning, see the Research explainer, Trinzic Alone, or Trinzic Plus Cloud DDI?

Sources: Infoblox NIOS 9.1.x vDiscovery and Cloud Network Automation; Route 53, Azure DNS and Google Cloud DNS integration pages; vNIOS for AWS, Azure and Google Cloud; Onboarding NIOS Services; Configuring Cloud Forwarders; What's New in Universal DDI for FedRAMP; Universal Asset Insights credential pages; Limitations of Universal DDI; AWS Route 53 VPC Resolver and VPC IPAM docs, What's New Nov. 17, 2025; Microsoft Learn Azure DNS Private Resolver; Google Cloud DNS best practices.

## Slide 16 — Assurance: STIGs, FIPS 140, NIAP and SP 800-81r3

Assurance evidence, checked on October twenty-second.

DISA STIGs are a real strength. DISA's file store has an Infoblox NIOS 9.x STIG, version 1 release 1, with a benchmark date of July 28, 2026 and forty-five rules, and an Infoblox 8.x DNS STIG at version 1 release 4 from September 30, with sixty-nine rules. The generic DNS SRG applies too. Neither BlueCat nor EfficientIP has a vendor-specific STIG.

FIPS 140 is the weak spot, so say it plainly. Infoblox has no active FIPS 140 certificate today. Its FIPS 140-2 certificates, 4531 for hardware and 4535 for virtual appliances, moved to the Historical list with the September 21, 2026 sunset, and NIST says Historical modules may be used for existing systems only. Four FIPS 140-3 submissions are in the CMVP queue, in review or pending review since late September and early October. Until those certificates post, a new NIOS deployment that depends on validated crypto can't cite an active certificate.

NIAP: there's no current Common Criteria certificate. NIOS 9.0 has been in evaluation since August 17, 2026. Infoblox isn't on the CDM Approved Products List, and that list isn't accepting new submissions, so don't expect it to change.

And a word on NIST SP 800-81 Revision 3, the Secure DNS Deployment Guide, final in March 2026. It's the best practical guide we have: Protective DNS, query logging, lease history, encrypted DNS, DNSSEC. But two of its three authors, Cricket Liu and Ross Gibson, are Infoblox employees. That's expertise and influence, not an authorization. Whenever you cite 800-81r3 in support of choosing Infoblox, disclose it.

Sources: DISA STIG file store, U_Infoblox_NIOS_9-x_V1R1 and U_IB_8-x_DNS_V1R4; NIST CMVP certificates 4531, 4535 and modules-in-process list; NIAP PCL; Common Criteria Portal; CISA CDM APL, April 2025; NIST SP 800-81r3 title page.

## Slide 17 — A fair comparison: dedicated DDI and native clouds

A fair comparison, column by column.

FedRAMP: Infoblox is the only dedicated DDI vendor here with a listing, at Moderate. BlueCat and EfficientIP have none. But the hyperscalers' government clouds are all FedRAMP High, a higher ceiling than Infoblox's SaaS.

FIPS 140: BlueCat leads. It holds an active FIPS 140-3 certificate, number 5506, valid to 2029. Infoblox's is still in review, and EfficientIP has none.

STIGs: Infoblox has two current vendor-specific STIGs; BlueCat and EfficientIP have none, and Windows DNS has its own.

Multi-cloud DNS: Infoblox manages Route 53, Azure DNS and Google Cloud DNS from one interface. BlueCat and EfficientIP claim similar coverage on their product pages. Each cloud's native service covers only that cloud, and Windows covers none.

DNS security: Infoblox has the broadest set, response policy zones plus TIDE intelligence and tunneling and DGA analytics. Azure uses domain lists and a Microsoft feed, AWS DNS Firewall Advanced adds DGA and tunneling detection, Google's response policies are passthrough only, and Windows DNS policies have no feed integration.

DHCPv6 failover is missing everywhere we checked, Infoblox and Windows included, so it's not a differentiator. EfficientIP claims extra DHCP high-availability modes; that's a vendor claim.

Automation: two partner-tier Terraform providers, two Ansible collections and ServiceNow give Infoblox the deepest set. EfficientIP's Terraform provider is community tier.

Where alternatives win: BlueCat's Micetro manages existing Windows and BIND servers in place, and a single-cloud workload may need no third-party plane. So the fair claim is the one on the slide: a strong default for a hybrid federal estate, not the only viable choice.

Sources: FedRAMP Marketplace products.json; NIST CMVP certificate 5506; DISA STIG store; BlueCat Integrity and Micetro pages, EfficientIP SOLIDserver datasheet (vendor); Microsoft Learn DNS Policies and DHCP failover; Azure DNS resolver policy; Route 53 DNS Firewall Advanced; Google Cloud response policies and DNS Armor; Terraform Registry; Ansible Galaxy.

## Slide 18 — Risks: certifications, vulnerabilities, authorization

Now the risks, stated plainly, with how to manage each one.

First, cryptographic validation. There's no active FIPS 140 certificate today. The 140-2 certificates went Historical with the September 21 sunset, and four 140-3 modules are in NIST review. BlueCat holds an active certificate. If your system requires validated cryptography at award, make go-live depend on the issued certificate, or carry the gap as a POA&M item with a date. Ask Infoblox which NIOS versions the pending modules cover, because a certificate for the wrong version doesn't help.

Second, there's no current NIAP certificate; NIOS 9.0 is in evaluation. And Infoblox isn't on the CDM Approved Products List, which is closed to new submissions. Track the NIAP evaluation, and don't promise anyone APL status.

Third, vulnerabilities. NVD lists four NIOS CVEs from February 2025 rated between 9.1 and 9.8, including improper authentication for Grids, and a remote-code-execution deserialization flaw, CVE-2025-61880, from February 2026. None of the Infoblox CVEs is in CISA's Known Exploited Vulnerabilities catalog. Write the patch cadence and the Long-Term Support train into the ATO plan, and keep the Grid management plane off untrusted networks.

Fourth, the BIND dependency. NIOS and NIOS-X run on BIND, and NIOS-X updates in September 2026 shipped to address lists of BIND CVEs. On October eighth CISA added an old BIND flaw, CVE-2015-5477, to the KEV catalog. Ask Infoblox for its BIND advisory SLA and a written attestation that current releases aren't affected by KEV-listed BIND CVEs, and track ISC's advisories yourself.

Fifth, the SaaS ceiling is Moderate, and reuse is zero. Use agency-operated vNIOS for High or DoD systems, and budget a full ATO.

Sources: NIST CMVP certificates 4531, 4535, 5506 and modules-in-process list; NIAP PCL; CISA CDM APL; NVD CVE API (keyword Infoblox); CISA KEV catalog 2026.10.21; Infoblox Cloud release notes; FedRAMP products.json.

## Slide 19 — Risks: cost, capacity, features, and procurement asks

The second set of risks is about cost, capacity and features.

Licensing. Universal DDI uses three token types, management, server and reporting, sold in minimum packs. Tokens are a subscription entitlement that expires at the end of the term, can only be rebalanced within a type, and overage is handled by what Infoblox calls True Forward, on a rolling three-month average. Model total cost over three to five years, including the hardware refresh: Infoblox's end-of-life policy typically supports hardware four years after its last order date.

Reporting capacity. We covered the ingest caps; five overruns in thirty days locks reporting. Size the Reporting tier for the retention you need, or make the SIEM the system of record for logs.

Encrypted DNS needs X6 hardware, or an extra license on X5. Plan the refresh around the encrypted DNS deadline.

DNSSEC defaults to RSA with SHA-1. Put SHA-256 or ECDSA in the build standard so nobody signs with the default.

Hybrid limits: the Portal can't promote a Grid Master Candidate or manage DHCP failover associations, so keep Grid Manager runbooks for both.

And stale collateral: an older Infoblox blog post still says Universal DDI isn't FedRAMP compliant. Cite only the Marketplace record.

On the right are the procurement asks that turn these risks into obligations. A FIPS 140-3 certificate timeline, the versions it covers, and a remedy if it slips. A BIND advisory SLA with a KEV not-affected attestation. The FedRAMP boundary diagram and a commercial-parity list. Reporting sized for six months searchable. Caps on token true-forward, and a clause guaranteeing you can export your data.

Sources: Infoblox Universal DDI Tokens FAQ and Supplemental Terms (vendor); Supported Reporting Appliances; NIOS 9.1.0 blog (vendor); Setting DNSSEC Parameters; Limitations of Universal DDI; Infoblox EOL policy; Infoblox Top 12 Questions post (search summary).

## Slide 20 — Module 3: Divisions on NIOS

Part 2: divisions under central governance. Module 3 covers divisions on NIOS.

Most agencies aren't one network. Bureaus, regional offices and labs run their own address space and often their own DNS, and a central policy plane only works if those divisions can still do their jobs through it, because a division that can't will work around it. NIOS has a detailed permission model for exactly this. We'll go through how it decides access, how to scope an admin group to one division, the views and attributes that separate divisions, approvals and their one big gap, sign-in, Microsoft servers, what stays central, and a reporting surprise.

Sources: Infoblox NIOS 9.1.x and 9.0 administration guides; Book 08, Chapter 11.

## Slide 21 — The NIOS permission model: deny first, most specific

The NIOS permission model has three levels: read-write, read-only and deny. Deny is the default for every resource, which is the right starting point for divisions: a new group sees nothing until you grant it something.

Permissions come in two scopes. Global permissions cover every object of a type, for example every DHCP network. Object permissions cover one specific member, zone, response policy zone, network, record or fixed address, together with what's inside it. Inheritance runs from parent to child, and you override it by setting a permission at a more specific level, such as deny on one fixed address inside a read-write network.

When permissions overlap, NIOS resolves them in a fixed order. It starts at the most specific object and works up. At each level it checks permissions assigned directly to the group first, then the group's roles in the order they're listed. The first permission it finds wins, and everything after it is ignored. So if one role grants read-only on A records and a later role grants read-write on the same records, the admin gets read-only. Grid Manager flags overlaps with a See Conflicts link and an Overlaps filter.

Roles are reusable permission sets, up to twenty-one per group. Be careful with the system roles: DNS Admin and DHCP Admin grant read-write across all members and all managed Microsoft servers, far too broad for a division.

The governance lever is on the left. Only superusers can create admin groups and roles, or define extensible attributes, so a division can't widen its own rights. And a local admin superuser always exists, so someone can still log in if the directory or OCSP is down.

Sources: Infoblox NIOS: About Administrative Permissions, About Admin Groups, About Admin Roles, Applying Permissions and Managing Overlaps, Creating Superuser Admin Groups, Managing Extensible Attributes.

## Slide 22 — Scoping an admin group to one division

Here is the recipe for scoping one admin group to one division, built from Infoblox's permission pages.

Step one, as a superuser, create a limited-access group and turn on only the interfaces it needs: GUI, API, or CLI with specific command groups. Limited-access groups never get the console. For help-desk staff, a group can be restricted to the Tasks Dashboard only, so they run approved task packs and nothing else.

Step two, grant object permissions. Read-write on the division's network container or networks reaches every object inside them and overrides global settings. If the division has overlapping space, grant read-write on its own network view instead, which reaches its networks, ranges and fixed addresses. For DNS, the documented pattern is read-only on the parent DNS view and read-write on the division's zones, so the division can create zones without editing the view. You can go finer, per record type: read-write on MX and SRV, deny on CNAME. And Member DNS and Member DHCP permissions confine the group's service work to its own members, with a separate permission to restart services without changing properties. Only superusers can change Grid-level DNS and DHCP properties.

Step three, leave everything else at the default deny.

Step four is the one people miss. Turn on the Grid property called Enable DNS Object Permissions in Networks and Ranges. With it on, creating an A, AAAA or PTR record or a host needs read-write on both the zone and the network or range that holds the address. Without it, a division with write access to a shared zone could point a name at another division's addresses. Fixed address and reservation permissions are always enforced either way.

Sources: Infoblox NIOS: Creating Limited-Access Admin Groups; Defining Object Permissions; Administrative Permissions for Network Views, IPAM Resources, DNS Views, Zones and Resource Records; Permissions for DNS Resources in Networks and Ranges; DNS and DHCP Permissions on Grid Members.

## Slide 23 — Network views, DNS views and extensible attributes

Three constructs separate divisions on NIOS, and each has a rule that shapes the design.

Network views. A network view is a single routing domain with its own networks. Views are mutually exclusive, so two of them can hold the same addresses; You can have up to a thousand, and the default view can be renamed but not deleted. The design rule: a DHCP member serves only one network view, and both failover peers must serve the same one. So a division with overlapping space needs its own DHCP members. Remember too that nothing on NIOS enforces uniqueness across views; that's a Universal DDI feature, in Module 4.

DNS views give different answers to different clients, matched on source address or TSIG key, and the first match wins. Every network view gets an automatic DNS view called default dot the view name, and a DNS view belongs to exactly one network view. Only one DNS view per network view can receive dynamic DNS updates. And order matters: put a catch-all external view first and the internal view is never reached.

Extensible attributes are metadata: such as Division and CostCenter, with types, allowed values and a required flag. They inherit down from the network view to the container, network, range and host. Two cautions. Required is enforced only in Grid Manager; objects created through the API or CSV import can skip it, so your automation has to enforce the Division tag. And attributes drive smart folders, dashboards and reports, not permissions. We found no way to grant access by attribute value. Access is always scoped by objects: containers, networks, views and zones.

Sources: Infoblox NIOS: Configuring Network Views; About DNS Views; Managing Extensible Attributes; Configuring Inheritable EAs; Smart Folders and EA filters.

## Slide 24 — Approval workflow, and the CSV import gap

The approval workflow is how central keeps a hand on division changes without doing the work.

Only superusers create workflows. Each workflow routes tasks from one submitter group to an approver group; a submitter group has exactly one workflow, while an approver group can serve several. Approvers approve, approve with a new execution time, or reject. Approved tasks run with the submitter's permissions and land in the audit log with a task ID. You can require a ticket number and comments, and notify either side.

What can go through approval: DNS zones, views and records except SOA; hosts, networks, containers, ranges, fixed addresses and reservations; Microsoft objects that NIOS supports; response policy zones and their rules. Service restarts aren't subject to approval.

Some operations are blocked for submitters even if they hold the permission: signing or unsigning zones, importing DS records and rolling key-signing keys; reclaiming, resizing or splitting networks; bulk edits and deletes; Recycle Bin restores and RPZ ordering. Those stay with central staff, which suits a federal model well.

Now the gap. CSV imports bypass approval entirely. Infoblox's own page says CSV imports do not require approvals, and Grid Manager shows a warning when a submitter group holds CSV import permission. If you leave that permission in place, a division can load a thousand records with no review at all. Remove CSV import from every division submitter group, and give bulk loads to a central group that works under a change ticket.

Sources: Infoblox NIOS: Configuring Approval Workflows; Creating Approval Workflows; Unsupported Operations for Submitters; Supported Tasks for Different Admin Groups; Scheduling Tasks; Audit Log.

## Slide 25 — Admin sign-in: CAC/PIV, SAML with Entra, directories

Who can sign in, and which group they land in, is the other half of division scoping.

NIOS supports local accounts, RADIUS, Active Directory, LDAP, TACACS+ and SAML, in any combination. The authentication policy is an ordered list of server groups, plus an ordered list that maps remote groups to local admin groups by name. The first match wins, and there's an optional default group. So a directory, for example an AD security group per division, decides which division an administrator belongs to, and AD nested groups are resolved recursively.

For federal staff the important one is certificate authentication. NIOS authenticates administrators by X.509 client certificate, and its documentation names CAC and PIV smart-card holders as the example. Certificate status is checked against an ordered list of OCSP responders, and both the authentication policy and the OCSP check must pass. The admin name is matched from the certificate's UPN, email or subject.

SAML 2.0 lists Azure SSO among its identity provider types. The provider sends a group attribute, and the user lands in the NIOS group whose name exactly matches; otherwise in a default SAML group.

Four things to check. Certificate-based sign-in to the API doesn't work if the Grid Master holds a Cloud Network Automation or Cloud API license, so decide that before you license. SAML-only users can't run CLI commands. Infoblox's Universal DDI guide says Entra sends group object IDs, while NIOS needs an exact group name match, and we couldn't confirm which the NIOS Azure SSO type expects, so test it. And because the first mapping wins, order mappings so a user in two groups lands where you intend. Keep the local admin as break-glass.

Sources: Infoblox NIOS: Authenticating Administrators; Defining the Authentication Policy; About Remote Admins; Two-Factor and Certificate Authentication Services; SAML pages; AD Nested Groups; Creating Limited-Access Admin Groups; Universal DDI SAML for Entra ID.

## Slide 26 — Microsoft servers, what stays central, and reporting

Three topics close the NIOS module.

First, a division that still runs Windows DNS and DHCP. NIOS manages those servers over MS-RPC with no agent, read-only or read-write, with a Microsoft Management license on the managing member. Each Windows server syncs into exactly one network view and one DNS view, fixed after the first sync. Each server object carries its own permissions inside Grid Manager, so give the division's group rights on its own servers rather than the system DNS Admin or DHCP Admin roles, which cover every Microsoft server. And be careful: changing the managing member, or switching from read-write to read-only, reverts any edits made in Grid Manager since the last sync.

Second, what stays central in every design. The Grid Master and its candidates, and Grid-level DNS and DHCP properties, which only superusers can change anyway. DNSSEC keys and signing, because only the Grid Master or its HSM can sign. Response policy zones and Threat Defense policy, so security posture is uniform. The definitions of groups, roles, attributes and workflows, and the authentication policy. And the top-level address blocks.

Third, a limitation that surprises almost everyone. NIOS reporting doesn't filter by object permissions. Infoblox's page says that when you view a DNS or DHCP report, you see all the data, even for objects you have no permission to see. So giving a division the Reporting app exposes agency-wide DNS and DHCP data, which matters a great deal for a law-enforcement bureau. Scope reporting by which dashboards you share with each division's role, filtered by the Division attribute, not by row-level security.

Sources: Infoblox NIOS: Managing Microsoft Servers; About Admin Roles; Administrative Permission for the Grid; Configuring DNSSEC on a Grid; RPZ license and permissions; Reporting permissions; EA filters and Smart Folders.

## Slide 27 — Separating DNS, DHCP and IPAM by team

Divisions aren't the only way to cut DDI. Many agencies split it by service instead: DNS, DHCP and IPAM teams, each working across the whole agency. NIOS supports that with the same permission model, but each service has a catch. This is an illustrative design, not a validated configuration.

First, the rules. Everything is denied by default. A global permission covers every object of a type, so read-write on all DHCP networks also covers their ranges and fixed addresses. An object permission covers one member, zone, network, record or fixed address. Inheritance runs parent to child, a more specific permission overrides, and the first match wins, with the group's own permissions checked before its roles.

The DNS team gets read-write on its DNS views and zones, per record type if needed, and Member DNS on its DNS members. No network rights. Note that response policy zone rules only take global permissions.

The DHCP team is where the catch is. A permission on a network covers its ranges and fixed addresses, so don't grant networks. Grant object permissions on the ranges and fixed addresses, plus Member DHCP and restart on the DHCP members.

The IPAM team gets read-write on network containers and networks to allocate space. That inherits down to ranges and fixed addresses, so if the DHCP team must own them, add an explicit deny on the DHCP ranges.

For contrast, a division admin gets all three services inside one slice of address space.

Two points stay Grid-wide. Turn on DNS Object Permissions in Networks and Ranges, and A, AAAA and PTR records and hosts need read-write on both the zone and the network. That's a deliberate check between the DNS and IPAM teams. And only superusers create groups, roles, attributes and approval workflows.

Sources: Infoblox NIOS: About Administrative Permissions; Defining Global Permissions; Defining Object Permissions; Applying Permissions and Managing Overlaps; Administrative Permissions for Zones; DNS and DHCP Permissions on Grid Members; Administrative Permission for the Grid; Permissions for DNS Resources in Networks and Ranges; About Admin Groups.

## Slide 28 — Service teams and divisions together

Service teams and divisions aren't alternatives. Most agencies combine them, because a grant can be scoped by service and by address space at once. Again, it's illustrative, using the worked example's four divisions.

The central DNS team keeps agency dot gov, internal and external, and DNSSEC signing, which only the Grid Master or its HSM can do. The central IPAM team keeps the top-level blocks as network containers and allocates each division its slash twelve. Divisions take over DHCP: each division's admins get Member DHCP and restart on their own DHCP members, and read-write on their ranges, inside their own space.

Read the grid by row. HQ's DHCP admins work in ten slash twelve. LEB serves its own zone from its own members, with Member DNS and DHCP on them. REG's Windows servers are managed from the Grid, so its admins get rights on those server objects. And LAB, with overlapping space, has its own network view, its own DHCP members, and a delegated zone whose DS records go to central.

On Universal DDI the picture changes. An access policy binds a role, a user group and an access view. Whether a division can have separate DNS and DHCP roles depends on a documentation conflict: one Infoblox page lists DDI IPAM, DNS and DHCP roles, while another says only the four DDI IPAM roles are supported in this release. Confirm with Infoblox. DHCP objects can't be assigned to access views directly; ranges, subnets and fixed addresses inherit their access view from their parent. And divisions can't administer their own users or roles.

One reporting caution applies however you split. On NIOS, report and search data ignore object permissions, so any team or division with the Reporting app sees agency-wide DNS and DHCP data.

Sources: Illustrative design synthesized from Infoblox NIOS: Object Permissions, DNS and DHCP Permissions on Grid Members, Network Views, Network Containers, Delegated Zones, Configuring DNSSEC on a Grid, Managing Microsoft Servers, Reporting permissions; Infoblox Portal: About Access Views, Supported Objects for Access Views, Setting Up Access Control, Creating Access Policies.

## Slide 29 — Module 4: Universal DDI divisions and operating model

Module 4: divisions on Universal DDI, and the operating model.

Universal DDI has its own divisional construct, access views, and its own answer to overlapping address space, IPAM Federation, which NIOS lacks. We'll cover those and their limits, including a conflict in Infoblox's own documentation you'll need to resolve with them. Then we'll step back to four delegation patterns and their trade-offs, walk through an illustrative design for four divisions, set out who does what, and end with a rollout sequence and the decisions to take next.

Sources: Infoblox Portal and Universal DDI documentation; Book 08, Chapters 09 and 10.

## Slide 30 — Universal DDI: access views, IP spaces, federation

On Universal DDI the division construct is the access view, which Infoblox describes as a logical container for DDI resources, built for divisional admins. The account itself is the default access view. Corporate admins create sub-views under it, and only one level is allowed. Divisional admins can't see or manage anything outside their sub-view.

You can assign IP spaces, address blocks, DNS views and zones, including synced cloud and Active Directory zones. Assign an IP space and everything in it follows. The constraints are significant. Users, roles and policies are defined only at the default view, so divisions can't administer their own users. Access views can't be deleted or renamed once created, so name them carefully. They take about ten minutes to propagate. And only interactive users work fully in them; service users with API keys can't log in to one.

IP spaces are the Universal DDI version of network views, and they can overlap. What NIOS lacks is IPAM Federation, which enforces uniqueness across Universal DDI, NIOS and cloud IPAM, with realms, federated blocks, delegations, overlapping blocks for space behind NAT, and reserved blocks.

Access policies bind a role, a user group and an access view. Keep the Threat Defense and access-control administrator policies central. Entra sign-in uses a non-gallery SAML app whose group claim carries object IDs, mapped to Portal groups. The audit log keeps thirteen months.

And a documentation conflict. One Infoblox page lists IPAM, DNS and DHCP roles for access views; another says only IPAM roles are supported in this release. Confirm with Infoblox before you design around DNS or DHCP roles.

Sources: Infoblox Portal: About Access Views, Supported Objects, Setting Up Access Control, Creating Access Views, Interactive and Service Users, Access Policies, Restricting User Groups, SAML for Entra ID, Mapping User Groups, Audit Logs; Universal DDI: IP Spaces, IPAM Federation.

## Slide 31 — Four delegation patterns and their trade-offs

Put together, the constructs give four delegation patterns.

Pattern (a): one central Grid, with division admin groups scoped by object permissions and changes routed through approval workflows. Its risks are permission sprawl, first-match ordering surprises, the CSV import bypass, and reporting that ignores permissions. Central keeps the definitions of groups, roles and attributes, and the Grid properties.

Pattern (b): the division owns members inside the central Grid, with member DNS and DHCP and restart permissions. It gets local resilience and local restarts, confined to its own appliances. But it can't change Grid-level properties, and if a zone is signed, the Grid Master is still its hidden primary. Central keeps the Grid Master, its candidates and the DNSSEC keys.

Pattern (c): the division gets its own network view on NIOS, or its own IP space on Universal DDI. It's the only way to hold overlapping private address space, and it draws a clean visibility boundary. It costs dedicated DHCP members per view, and on NIOS nothing enforces uniqueness across views; on Universal DDI, IPAM Federation does. Central keeps the top-level blocks.

Pattern (d): delegate a zone to DNS servers the division runs, Infoblox or not. Full autonomy, at a price: central loses the audit trail, RPZ coverage and DNSSEC for that child zone, and the delegation must sit inside a zone with a Grid primary. Central keeps the parent, the NS and glue records, and the DS records.

Most agencies mix them: (a) as the default, (b) where local resilience matters, (c) only for overlap, and (d) only where autonomy is worth the lost coverage.

Sources: Synthesis of Infoblox NIOS: Administrative Permissions, Managing Overlaps, DNS and DHCP Permissions on Grid Members, Network Views, Delegated Zones, DNSSEC on a Grid, Approval Workflows, Reporting permissions; Universal DDI: Access Views, IPAM Federation.

## Slide 32 — Worked example: four divisions on one Grid

Here's a worked example. It's an illustrative design, not a validated configuration.

The agency owns ten slash eight and agency dot gov, with four divisions. HQ is the central network operations team. LEB is a law-enforcement bureau that needs confidentiality from the other divisions. REG is a regional office still running Windows DNS and DHCP. And LAB is a research lab whose ten dot zero slash sixteen overlaps HQ.

HQ, LEB and REG share the network view called agency, each with its own slash twelve container tagged with a Division attribute that inherits down. HQ's group gets read-write on its container and zones and read-only on the internal view; central keeps agency dot gov itself. LEB adds pattern (b): its zone is served by its own members, with member DNS, DHCP and restart rights on them. REG's Windows servers are managed from the Grid, and its group gets rights on those server objects and its zone, not the system Microsoft roles.

LAB is the overlap case. It gets its own network view, nv-lab, with its own DHCP members, because a DHCP member serves one view. And its zone is delegated to two lab-run BIND servers, pattern (d), inside the Grid-primary agency dot gov. If agency dot gov is signed, the lab hands its DS records to central.

Grid-wide controls: turn on DNS object permissions, so HQ can't point a name into LEB's space. No CSV import for any division group. One approval workflow per division, approved by a central group, with a ticket number required. SAML group names that match exactly, and the local admin as break-glass. For LEB, keep its data out of other divisions' dashboards, and consider a bureau-lead approver group if central shouldn't see change detail.

Sources: Illustrative design synthesized from Infoblox NIOS: Network Views, DNS Views, Extensible Attributes, Object Permissions, DNS Resources in Networks and Ranges, Delegated Zones, Approval Workflows, SAML, Managing Microsoft Servers, Reporting permissions.

## Slide 33 — Who does what: the DDI responsibility matrix

Who does what. This matrix is adapted from Book 08's responsibility matrix, which separates deciding from doing: D decides and is accountable, R does the work, C is consulted. I've added a Division column for the delegated model.

The CIO decides the platform and deployment model, NIOS, the SaaS, or hybrid, with the central DDI team doing the evaluation and everyone else consulted. The authorizing official decides whether a cloud-delivered management plane is authorized at the right impact level.

The CIO also decides how divisions are scoped in the policy plane, and the central DDI team builds it: admin groups, network views, access views. Divisions are consulted, because a scope they can't work in becomes a workaround.

Central DDI owns the top-level address blocks and namespace design, deciding and doing. DNSSEC signing and key rollover, and response policy and Threat Defense policy, are control requirements, so the CISO decides them and central DDI runs them, with security operations consulted on response policy.

Standard record changes in a division's zone are where delegation pays off. Central decided in advance what a standard change is; the division does the work, inside its scope, through the approval workflow where one applies. High-impact changes, such as zones, NS and SRV records, apex records, wildcards and RPZ, stay with central to decide and do, with divisions consulted.

And an encrypted DNS exception that has no end date, or has outlived the agency's limit, goes to the authorizing official, because at that point it's a risk acceptance, not a configuration choice.

Sources: Book 08, Chapter 09, "Decision rights and work are different things," "The roles," "The responsibility matrix"; Infoblox NIOS approval workflows; Universal DDI access policies.

## Slide 34 — Rollout sequence, decisions and next steps

To close, a rollout sequence, the decisions to take, and the next steps.

The sequence follows Book 08's canonical order, adapted for divisions. One: inventory everything first, zones, scopes, forwarders, and every record Active Directory DNS holds, before any domain controller is touched. Two: build the central pieces, the Grid Master and candidates, the HSM if you'll use one, and a build standard that sets the DNSSEC algorithm, logging and STIG settings. Three: coexist, by managing the existing Windows DNS and DHCP servers from the Grid in place, so nothing moves until you're ready. Four: onboard divisions one at a time, starting with pattern (a), the simplest, and adding views or delegations only where a division needs them. Five: federate the clouds. Six: harden and evidence, with the STIG applied, logs at retention, and audit trails the authorizing official can read.

The decisions to take now. Which platform model, NIOS, Universal DDI or hybrid, for each impact level. Which delegation pattern for each division, and who approves changes for a bureau that needs confidentiality. Whether to wait for the FIPS 140-3 certificate or proceed with a POA&M. And where logs will live to stay searchable for six months.

And the next steps. Send Infoblox the procurement asks from Module 2. Confirm which roles access views support, and what value Entra sends for group matching. Lab-test encrypted forwarding to CISA's Protective DNS and the DNSSEC algorithm change. And draft each division's scope and the responsibility matrix with the division itself.

In the program's analysis, Infoblox is one of the strongest ways to build a governed DDI plane for a federal agency, as long as you manage its risks in the open. One note on standing: this is the program's research analysis, under review, not an endorsement by any federal agency. Thank you.

Sources: Book 08, index (canonical sequence) and Chapter 10; Infoblox NIOS and Universal DDI documentation; federal requirements and validation research cited in Modules 1 and 2.
