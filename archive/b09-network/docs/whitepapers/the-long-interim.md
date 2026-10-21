# Table of Contents {#table-of-contents .TOC-Heading}

*Independent technical analysis. Policy and product statements are
current as of the date above. Section 10 records sources and states
which figures are measurements, which are estimates, and which could not
be found at all.*

# 1. Executive summary

Most writing about federal branch networking assumes the agency is about
to deploy SD-WAN and adopt a TIC 3.0 use case. For many agencies neither
is true, and neither will be true for years. The acquisition is not
funded, the task orders are not placed, the branch count is in the
hundreds or thousands, and the staff who would run the programme are
absorbed by three other mandates with deadlines inside the next fifteen
months.

This paper is about that interval.

**Finding 1 --- SD-WAN with a TIC 3.0 use case is the residual
architecture, not the mandated one.** No federal instrument, civilian or
defense, names SASE or SD-WAN as required. DoD's own Zero Trust Strategy
states that it "does not mandate or prescribe specific technologies or
potential solutions." What has happened instead is that the alternatives
closed one at a time: the legacy transport vehicles expired in early
2026, the hairpin model is what policy moved away from, agency-operated
access points carry costs few agencies will take on, and cloud-provider
private connectivity solves less than agencies assume --- including for
Microsoft 365, where it solves considerably less than an agency approved
for it in 2018 is likely to believe. What remains is a branch-edge
policy layer feeding a cloud-delivered security stack. That is a
conclusion by elimination, and it should be argued as one. (Section 2)

**Finding 2 --- technology-neutral is not requirement-free, and four
binding obligations land directly on branch equipment.** This is the
correction to the way the "no mandate" argument is usually made. Egress
DNS must route to CISA's Protective DNS, on a statutory basis rather
than a memorandum. Internet-exposed management interfaces on routers,
firewalls and VPN concentrators must be removed or fronted by a separate
policy enforcement point (BOD 23-02). End-of-support edge devices must
be off agency networks by **August 2027** (BOD 26-02). Any device
terminating TLS or IPsec must support post-quantum key exchange
(M-26-15). None names a product. All constrain what a branch can look
like. (Section 3.3)

**Finding 3 --- there is no federal requirement that WAN transport be
encrypted, and the requirement people assume exists does not.** NIST SP
800-53 Rev 5 SC-8 and SC-8(1) apply at Moderate and High and are
mechanism-agnostic: SC-8(1)'s discussion names TLS and IPsec as coequal,
and SC-8 can be satisfied by physical means with no encryption at all.
The two controls that would require protection beyond the payload ---
**SC-8(3), covering message headers and routing metadata, and SC-8(4),
covering traffic-flow concealment --- are in no baseline at any impact
level.** An agency whose branch traffic is TLS-protected end to end has
a defensible SC-8 implementation with no tunnel beneath it. (Section 4)

**Finding 4 --- the encryption argument is genuinely load-bearing in
exactly one place: legacy cleartext protocols.** SC-8(1) attaches to the
information, not the protocol. Cleartext LDAP, SMB, FTP, telnet or
unencrypted database traffic crossing a branch WAN is an SC-8 exposure
regardless of transport, and for those flows an overlay is often the
only practical remedy. That is inventoriable and fixable now, without a
programme. (Section 4.4)

**Finding 5 --- the timeline is long, but one directive is pulling a
piece of it forward.** BOD 26-02 requires end-of-support edge devices
off FCEB networks by August 2027. For agencies with ageing branch
routers, the refresh is happening on a directive clock whether or not an
SD-WAN programme is funded --- and a refresh is precisely the moment a
branch architecture gets re-chosen. An agency that treats the two as
unrelated will buy like-for-like replacements and foreclose the
architecture question for another decade. (Section 5.2)

**Finding 6 --- the attribution problem is real, partly documented, and
the composed claim is original.** Federal agencies demonstrably cannot
track cloud costs and savings consistently; transport requirements are
demonstrably not understood at migration time; and CISA has stated in
policy that transport constraints degraded performance and raised cost
in cloud contexts. What no source documents is the composed phenomenon
this paper calls **phase inversion** --- transport-attributable cost
being systematically misattributed to cloud, driving remedies that raise
cloud spend. Section 8 sets out the evidence chain, labels the
inferential step as the author's own, names the competing explanations a
reviewer will raise, and states what would falsify it. (Section 8)

**On numbers.** Section 2.7 covers cost. The finding there is partly
negative and worth stating up front: **GSA publishes no downloadable EIS
price list, MTIPS is priced on an individual case basis and is excluded
from the public pricer, GAO has never quantified realized EIS savings,
and no federal agency has published before-and-after SD-WAN cost
figures.** What exists is a cost *structure*, a handful of real
government figures, and the observation that the widely repeated
MPLS-versus-broadband multiple comes almost entirely from parties
selling the alternative.

# 2. The alternatives, and why each has closed

The case for a branch-edge policy layer is usually made forward, from
its benefits. It is stronger made backward, from what is left.

## 2.1 The legacy transport vehicles have expired

**Networx expired 31 May 2026. WITS 3 expired 28 February 2026.** Local
telecommunications service contracts expired across 2025 and 2026. As of
31 July 2026, 214 agencies had completed transition to Enterprise
Infrastructure Solutions, whose first option period runs to 31 July 2027
and whose second to 30 July 2032.

MTIPS remains orderable under EIS, so this does not eliminate managed
TIC services. What it means is that every agency has already been
through a transition decision, and the architecture is now a task-order
question rather than a contract-vehicle question. An agency that
intended to defer the decision until its vehicle changed has run out of
deferral. Note also that GSA's own EIS service list does not name SD-WAN
as a service --- agencies buy it through Managed Network Service or VPNS
constructs, which is a scoping detail worth settling early.

## 2.2 The hairpin model is what policy moved away from

OMB M-19-26 (12 September 2019) rescinded M-08-05 and replaced
physical-routing compliance with capability-based compliance. Agencies
are no longer required to route all traffic through a traditional access
point, provided they implement approved use cases maintaining the
required capabilities and share telemetry with CISA.

CISA's own account of why is unusually direct, and it is the single most
useful federal sentence in this paper. From the TIC 3.0 Program
Guidebook:

> "Over time, greater bandwidth demands, transport encryption, and
> perimeter services were placed on agency TICs beyond their ability to
> scale. The growing demands on the enterprise perimeter and degraded
> performance increased the cost and decreased the effectiveness of the
> TIC initiative when using cloud services."

That is the government stating in policy that transport constraints
degraded performance and raised cost specifically in the context of
cloud services. The hairpin architecture remains permitted and an agency
running it is not out of compliance. It is now the expensive option
defended on its own merits.

## 2.3 Agency-operated access points are a capital and staffing commitment

Standing up or expanding an agency-operated TIC access point remains
available. It requires capital, floor space, a refresh cycle, and staff
to operate an inspection stack around the clock. For an agency that
already has one, continuing is rational. For an agency that does not,
building one in 2026 to serve cloud-bound branch traffic has to be
defended against every alternative in this section, and few agencies are
making that case.

## 2.4 VPN backhaul is a hairpin under another name

Backhauling branch traffic to a datacenter over IPsec and egressing
there still works and is still widely deployed. It is also a hairpin: it
adds the datacenter round trip to every cloud interaction, concentrates
capacity at the aggregation point, and gives the branch none of the
properties in Section 2.6. Where it persists, it usually persists
because the concentrator is already paid for.

## 2.5 Cloud-provider private connectivity solves less than agencies assume

Dedicated private connectivity into a cloud provider --- the
ExpressRoute and Direct Connect family --- is genuinely good for what it
covers: traffic between agency infrastructure and that provider's
regions. It does not cover SaaS in general, does not cover the open
internet, does not cover a second provider, and does not govern anything
at the branch. Microsoft's own diagram caption makes the last point for
them: *"the customer's users who aren't located in their ExpressRoute
connected building are connecting over the Internet."*

**Microsoft 365 deserves separate treatment, because a large number of
agencies were approved for ExpressRoute for Office 365 between roughly
2015 and 2018 and have not revisited it since.** An authorization
granted then does not survive as a statement of current Microsoft
guidance, and five things have changed underneath it.

**First, Microsoft now recommends against it.** The Azure documentation
is blunt --- the section headed "When to use ExpressRoute for Microsoft
365?" consists in its entirety of the sentence *"We no longer recommend
the use of ExpressRoute for Microsoft 365 traffic."* That heading
previously enumerated qualifying scenarios. The Microsoft 365
documentation is longer but says the same thing: *"We do not recommend
ExpressRoute for Microsoft 365 because it doesn't provide the best
connectivity model for the service in most circumstances. As such,
Microsoft authorization is required to use this connectivity model. We
review every customer request and authorize ExpressRoute for Microsoft
365 only in the rare scenarios where it's necessary."*

**Second, ExpressRoute has disappeared entirely from Microsoft's
canonical network guidance.** The *Microsoft 365 network connectivity
principles* page --- Microsoft's flagship article on this subject,
refreshed August 2026 --- does not contain the word "ExpressRoute"
anywhere. Its recommendation runs the other way: *"Direct internet
access should be prioritized for the Microsoft 365 domains by reducing
reliance on wide area network (WAN) backhauling, avoiding network
hairpins, and enabling a more efficient internet egress local to the
users and directly to the Microsoft network."* Where that page lists
incremental optimization methods, SD-WAN appears and ExpressRoute does
not: *"The easiest way to choose which network requests to trust is to
use SD-WAN devices that support automated Microsoft 365 configuration at
each of your office locations."*

**Third --- and this is the hard technical limit rather than a
preference --- ExpressRoute cannot carry all Microsoft 365 traffic, and
never could.** Microsoft states it plainly: *"Some Microsoft 365 traffic
can only be routed through the Internet."* The reason is structural.
Route filters advertise IP prefixes; Default-category endpoints have no
published IP addresses because they change. In the current Worldwide
endpoint list, roughly seven endpoint sets are marked ER=Yes against
roughly forty marked ER=No. Among the ER=No sets are **certificate
revocation** endpoints, marked Required; Office client downloads and
redirects, marked Required; secondary authentication and device
registration endpoints including `enterpriseregistration.windows.net`,
marked Required; content delivery networks; telemetry; and Outlook
mobile. Microsoft is explicit that *"Regardless of how you manage vital
Microsoft 365 network traffic, Microsoft 365 requires Internet
connectivity."* An ExpressRoute circuit can never be an agency's sole
path to Microsoft 365. A compliant internet egress path is mandatory
alongside it, which means the branch-edge question is not avoided by
having a circuit.

**Fourth, the authorization gate is real and enforced in the Azure
control plane** --- an unauthorized subscription attempting to create
Office 365 route filters receives an explicit error. But there is a
grandfathering clause that matters directly to this cohort: *"Microsoft
peering of ExpressRoute circuits configured before August 1, 2017, will
have all Microsoft Office service prefixes advertised through Microsoft
peering, even without route filters."* An agency with a pre-August-2017
circuit may still be advertising Office 365 prefixes today with no route
filter and no current authorization on file. That is worth checking as a
discrete action rather than assuming.

**Fifth, for GCC the routing arrangement is documented as working but is
not documented as to how.** Microsoft states that Office 365 GCC pairs
with Entra ID in Azure Commercial, while GCC High and DoD pair with
Azure Government. GCC has no separate endpoint list at all --- it is
served by the Worldwide list, and the endpoint web service publishes
instances only for Worldwide, China, USGovDoD and USGovGCCHigh. There is
no GCC instance. Microsoft's ExpressRoute FAQ nonetheless answers the
obvious question affirmatively: *"Can I access Office 365 US Government
Community (GCC) services over an Azure US Government ExpressRoute
circuit? Yes. Office 365 GCC service endpoints are reachable through the
Azure US Government ExpressRoute. However, you first need to open a
support ticket on the Azure portal to provide the prefixes you intend to
advertise to Microsoft."*

That answer sits in tension with a statement two questions later on the
same page, that Azure Government Microsoft peering is *"limited to only
public IPs within Azure Government regions and doesn't extend to the
broader ranges of commercial public IPs"* --- and GCC endpoints are in
commercial IP space. Microsoft nowhere reconciles the two, and nowhere
states which BGP communities or prefixes the GCC arrangement uses. **The
practical conclusion for an agency: do not assume an existing Azure
Government circuit carries your GCC traffic. Confirm the specific prefix
arrangement with Microsoft in writing.** The ambiguity is itself worth
recording in the architecture documentation.

**Finally, Microsoft treats hairpinning branch traffic to a circuit as a
defect to be fixed**, not as an architecture: *"It may also show global
hairpin network connections where traffic routes to a distant location
in order to get the meet-me location. If a hairpin on the global network
is discovered, it should be remediated before continuing. Either find
another meet-me location, or use selective Internet breakout egress
points to avoid the hairpin."* And on inspection, Microsoft's current
guidance is to *"bypass Microsoft 365 domains from TLS decryption,
traffic interception, deep packet inspection, and network packet and
content filtering"* and to *"bypass traffic intermediation devices such
as proxies and VPN services"* --- a list it says it has *"not tested"*
and which is *"known to cause connectivity issues."* Microsoft applies
that guidance to ExpressRoute paths as well as internet paths; the
circuit creates no inspection-friendly exception.

An agency with private connectivity to its primary cloud and nothing at
the branch edge has solved the leg it was already least worried about
--- and, in the Microsoft 365 case, may be maintaining a circuit for a
workload the vendor now recommends taking off it.

## 2.6 What is left, and what is actually scarce

What remains is local internet breakout at the branch, a cloud-delivered
security stack at a nearby point of presence, and a policy layer at the
branch edge deciding what goes where.

**The scarcity is in the product category, not in the functions**, and
an agency that cannot buy for three years should be clear about which it
is short of:

 -----------------------------------------------------------------------
 Function What it provides Obtainable before an
 award?
 --------------------- -------------------------- ----------------------
 Application-aware Per-application path Partially ---
 steering assignment policy-based routing
 on existing edge
 equipment, for a small
 number of classes

 Multi-link use and Concurrent links, Rarely --- the
 failover sub-second failover function most
 genuinely dependent on
 the product

 Path health Continuous per-path Yes --- synthetic
 measurement latency, jitter, loss transactions,
 IPFIX/NetFlow,
 endpoint telemetry

 QoS before the WAN Priority queuing at the Partially --- most
 constrained link branch routers can
 mark and queue

 Deterministic egress Stable, documented source Usually yes --- a NAT
 address per branch configuration decision

 Per-application Evidence for SC-7, SI-4, Partially --- flow
 telemetry CA-7 records plus
 application logs,
 correlated by hand
 -----------------------------------------------------------------------

Four of six are partially obtainable now. That is the practical content
of this paper for an agency that is years away, and Section 6 builds on
it.

**Where this argument is weakest.** "No alternative" is partly an
artifact of how the market names things. A capable multi-WAN firewall
with policy-based routing and good flow export delivers a meaningful
fraction of the list without being sold as SD-WAN, and an agency with a
modern firewall estate at its branches may be closer than it thinks. The
defensible claim is narrower than "there is no alternative": **no
alternative product category has emerged**, and assembling the functions
separately costs more integration effort than it saves in licence fees
--- but in a long interim, integration effort is what an agency has and
licence fees are what it does not.

## 2.7 What any of this costs

An agency building a business case needs numbers, and the honest report
on where they come from is partly negative. That negative finding is
itself useful, because it explains why so many of the figures in
circulation are unsourced.

**What is not publicly available:**

- **GSA publishes no downloadable EIS price list.** EIS pricing is
 genuinely public and requires no account, but only through the
 interactive EIS Public Pricer, which is a multi-step per-CLIN,
 per-location wizard with no bulk export and no documented API.
 Prices for Virtual Private Network Service, Ethernet Transport
 Service, Internet Protocol Service and Managed Network Service are
 all obtainable by a person with a browser and cannot be cited in
 bulk.
- **MTIPS has no public price at all.** GSA's service documentation
 states that MTIPS features are priced on an Individual Case Basis
 and that ICB CLINs are not available in the unit pricer. There is no
 per-Mbps or per-agency MTIPS figure to cite.
- **GAO has never quantified realized EIS savings.** Its last
 substantive EIS report is from April 2020.
- **No federal agency has published before-and-after SD-WAN cost
 figures.** Task order ceilings are public; realized cost deltas are
 not.
- **No published federal figure isolates legacy WAN or MPLS operating
 cost.** Every federal legacy-systems and O&M figure found is all-IT
 --- applications and mainframes --- not network.

**What is available and citable:**

 -----------------------------------------------------------------------
 Figure Source
 ------------------------------------------- ---------------------------
 \~\$329M missed savings from Networx GAO-14-63, December 2013
 transition delays, on a 28.4% potential 
 savings rate; \$66.4M (44%) transition cost 
 overrun 

 \$2.08B projected additional taxpayer cost GSA EIS case study, June
 of the 2020 Networx extension caused by the 2020
 delayed EIS transition 

 37 EIS task orders totalling over \$7.4B GSA EIS case study, June
 within a year of programme launch 2020

 \~80% of over \$100B annual federal IT GAO-25-107795, July 2025
 spend goes to operations and maintenance 

 \$50B EIS ceiling; \~\$2.5B spent through CRS IF11668, October 2020
 GSA telecom contracts in FY2019 
 -----------------------------------------------------------------------

The **\$2.08B Networx extension figure is the strongest single "cost of
delay" number in the federal record**, because it prices deferral
directly rather than modelling it.

**On the MPLS-versus-broadband multiple.** The claim that MPLS costs
three to ten times broadband per megabit circulates widely. It is
asserted almost exclusively by WAN brokers, SD-WAN vendors and their
content marketing, none of whom publish a methodology. The one
independent dataset --- TeleGeography, a research firm that sells WAN
pricing data and has no stake in the answer --- reports a **much smaller
and less consistent gap**: DIA is cheaper than MPLS across tiers when
both include local access, but at 20 Mbps in New York most carriers
offered only a slight discount for DIA, one offered a significant
discount, and **two priced DIA at a premium.** TeleGeography's free
publications give charts and percentages rather than absolute price
levels; the \$/Mbps data is behind a paid service. **An agency should
not build a business case on the marketing multiple.** It should price
its own circuits in the EIS pricer.

**The cost structure, which is buildable without unit prices.** EIS
charging units make the drivers explicit, and the structural difference
between the architectures is which variable the cost scales with:

 --------------------------------------------------------------------------
 Architecture Recurring One-time Scales with
 ----------------- --------------------- ---------------- -----------------
 MPLS + central VPNS port MRC per Access install; **Site count ×
 TIC/MTIPS site; access MRC per CPE procurement, port speed.**
 location; equipment install, site Largely
 lease and prep; design and insensitive to
 maintenance; MTIPS engineering actual traffic
 port MRC plus ICB --- you buy ports
 features 

 DIA + SASE, no IPS port MRC; IPS Access install; **User count**
 branch edge transport minimal CPE; --- the
 (usage-based); access SASE onboarding structural break
 MRC per site; SASE from the row
 subscription; any above
 per-GB egress 

 DIA + SASE + The row above, plus Appliance **Site count ×
 branch edge appliance licence and procurement and bandwidth tier**,
 orchestration per install labour plus user count
 site (or Managed per site for the SASE
 Network Service MRC layer
 per site), plus 
 usually a second 
 access circuit 

 Agency-operated 24/7 SOC staffing; Security stack Internal; **no
 TICAP facilities; security capital; published federal
 stack subscriptions build-out; figure exists**
 and support; accreditation 
 transport into the 
 TICAP 
 --------------------------------------------------------------------------

The move from the first row to the second is the one that changes the
cost *variable* --- from site count and port speed to user count. For an
agency with many small branches that is favourable; for one with few
large sites and many users it may not be. That is the calculation to
run, and it can be run in the EIS pricer with real numbers before
anything is procured.

**One real price point, for scale.** SASE subscription pricing is
publicly visible on GSA schedule price lists for at least one vendor:
Zscaler's published GSA per-user annual pricing runs roughly \$59--\$185
per user per year depending on edition and tier, with the GSA discount
off list at about one percent. Comparable public GSA pricing for Prisma
Access, Netskope, Cisco/Meraki, Fortinet and VeloCloud could not be
retrieved; the route for a specific vendor is its own contract PDF on
GSA Advantage. **A per-user annual subscription across a large agency
workforce is the term most likely to dominate the comparison, and it is
the one most often left out of the SD-WAN-versus-MPLS framing
entirely.**

# 3. What federal policy actually requires

## 3.1 TIC 3.0 is technology-neutral

TIC 3.0 guidance is descriptive, not prescriptive. It defines security
capabilities and objectives; it does not mandate products, vendors or
topologies. The Program Guidebook gives agencies discretion to apply the
objectives at a level commensurate with the resources being protected,
and the Security Capabilities Catalog deliberately discarded the earlier
critical/recommended prioritization scheme.

The core guidance comprises five volumes --- Program Guidebook,
Reference Architecture, Security Capabilities Catalog, Use Case
Handbook, Service Provider Overlay Handbook --- and four published use
cases: **Traditional, Branch Office, Remote User, Cloud.** There is no
"SASE use case." An agency deploying SASE at branch offices operates
under Branch Office and Cloud.

**CISA has, however, blessed SASE as a compliant path.** In June 2026
CISA published *The Journey to Zero Trust: Using Secure Access Service
Edge in a Modern TIC 3.0 Solution*, issued as support for FCEB agencies
implementing zero trust architectures. It is guidance, not a requirement
--- but it is the one place SASE is named in a federal document, and it
strengthens rather than weakens the descriptive-not-prescriptive
reading: SASE is now federally *permitted and described*, and still
nowhere *required*. Agencies working in this area should obtain and read
it directly.

## 3.2 Nothing else names SASE or SD-WAN either

Checked and confirmed absent: OMB M-22-09, M-25-04, M-26-14, M-26-15,
M-26-05; CISA Zero Trust Maturity Model v2.0; the DoD Zero Trust
Strategy; EO 14306. **No federal instrument names SASE or SD-WAN as
required.**

M-22-09's network pillar requires encrypted DNS "wherever it is
technically supported," HTTPS "for all web and application program
interface (API) traffic in their environment" including internal
traffic, and a zero trust architecture plan describing the agency's
approach to environmental isolation, submitted to OMB and CISA. Its
isolation requirement is a negative architectural constraint rather than
a technology: *"Agencies must move away from the practice of maintaining
a broad enterprise-wide network that allows enhanced visibility or
access to many distinct applications and enterprise functions."* The
words *wide area network*, *branch*, *campus* and *remote site* do not
appear in it.

CISA's Zero Trust Maturity Model states its own status: *"This maturity
model should not be viewed as a strict set of requirements but as a
general guide."* Its Networks pillar describes architectural properties
--- micro-perimeters, service-specific interconnections --- and names no
technology.

## 3.3 But technology-neutral is not requirement-free

This is the correction to how the "no mandate" argument is usually made,
and it matters because four binding obligations land directly on branch
network equipment. None picks a product. All constrain what a branch can
look like.

**Egress DNS must route to CISA's Protective DNS.** M-22-09 records this
as pre-existing --- *"Agencies are already required to have DNS requests
routed through CISA-operated infrastructure"* --- and CISA's *Encrypted
DNS Implementation Guidance* states agencies must route all DNS traffic
leaving agency networks and devices to CISA's Protective DNS
capabilities, from endpoints "whether mobile, roaming, nomadic,
on-premises, or cloud deployed," must disable root hints on
agency-managed endpoints, and must permit external third-party resolvers
to be reached only from authorized internal DNS servers. The underlying
obligation is **statutory** --- 6 U.S.C. § 663 note requires agency
heads to apply CISA's capabilities to information travelling between an
agency system and any non-agency system --- which makes it considerably
harder to waive than a memorandum. This is a genuine architectural
constraint: it dictates where a class of traffic must go. Section 4.5
covers what satisfies it.

**Internet-exposed management interfaces must be removed or fronted.**
BOD 23-02 names the device classes explicitly --- *"Routers, switches,
firewalls, VPN concentrators, proxies, load balancers, and out of band
server management interfaces"* --- and the scope test is device class
plus internet accessibility, not location. A branch appliance with an
internet-reachable management plane is in scope. The required action
within 14 days is to restrict the interface to an internal enterprise
network **or** to *"deploy capabilities, as part of a Zero Trust
Architecture, that enforce access control to the interface through a
policy enforcement point separate from the interface itself (preferred
action)."*

**End-of-support edge devices must be off the network by August 2027.**
BOD 26-02 (5 February 2026) covers edge devices on FCEB networks ---
routers, switches, firewalls, wireless access points, load balancers and
other traffic-handling components --- that no longer receive vendor
firmware or security updates. Its milestones run from an inventory
against CISA's end-of-service list, through decommissioning of devices
reaching end of service within the year, to removal of all
end-of-service devices at eighteen months and continuous discovery at
twenty-four. **This is a binding, dated obligation to replace physical
branch network hardware, and it is the most consequential item in this
section for an agency planning branch architecture.** Section 5.2
returns to it.

**Anything terminating TLS or IPsec must support post-quantum key
exchange.** M-26-15 (24 June 2026) states: *"All network infrastructure
that terminates TLS or IPsec sessions or other relevant
protocols---including firewalls, Virtual Private Network concentrators,
cloud gateways, and Application Programming Interface (API)
proxies---must be configured to support PQC-capable key exchanges that
utilize NIST PQC algorithms."* It applies to systems agencies own or
operate and excludes national security systems. Migration plans were due
approximately October 2026; TLS 1.3 support is required no later than 2
January 2030 and prioritized systems are to have quantum risk mitigated
by 31 December 2030. Formally this is still a capability requirement
rather than a product mandate --- but a branch VPN concentrator or
firewall that cannot perform ML-KEM will not satisfy it, and that is a
refresh decision.

The right formulation for a programme document is therefore: *federal
policy is technology-neutral, and it is not requirement-free.*

## 3.4 The DoD contrast, correctly drawn

DoD is frequently cited as the prescriptive counterexample. It is ---
but not in the way usually claimed. The DoD Zero Trust Strategy sets a
binding, dated capability deadline: *"Components must achieve the
intended Target level outcomes of each DoD Zero Trust Capability and
execution enabler no later than the end of FY2027"* --- 91 Target Level
activities out of 152 total. That is far harder than anything civilian
agencies face.

But the same strategy states: *"This ZT strategy does not mandate or
prescribe specific technologies or potential solutions."* SD-WAN and
SASE do not appear in it. Where they do appear is DISA's **Thunderdome**
programme, whose elements include customer security stacks, SD-WAN, SASE
and application security stacks --- and Thunderdome is DISA procuring
these technologies for its own network, not a mandate on anyone. **The
civilian-defense contrast is about bindingness and deadline, not about
technology prescription.** An agency drawing the contrast the other way
will be corrected.

## 3.5 FedRAMP does not constrain routing

FedRAMP authorizes cloud service offerings against NIST SP 800-53 Rev 5.
It governs the security posture of the service, not the topology used to
reach it. It does not prohibit SD-WAN, require hairpin routing, or
mandate any path. Where a network change is refused on stated FedRAMP
grounds, the question is: **name the control or control enhancement it
violates.** There is none.

Two points of precision for packages. Do not cite a FedRAMP Moderate
control count --- Notice 0013 (16 June 2026) removed most
FedRAMP-assigned parameter values and no revised counts have been
published. And note the vocabulary transition without overstating it:
under the Consolidated Rules for 2026, "authorization" becomes
"certification" and impact levels become Certification Classes A--D,
with optional early adoption from 4 July 2026 and **mandatory adoption 1
January 2027**; existing Rev 5 authorizations remain valid to at least
31 December 2028.

## 3.6 Your own control assertions

The obligations that bite hardest at the branch are the ones the agency
wrote into its own packages. Where a branch performs local internet
breakout, the branch is an external boundary, and four controls are
asserted about it: **SC-7(4)**, requiring a managed interface for each
external telecommunication service, a documented traffic flow policy for
each, and protection of information transmitted across each interface;
**SC-7(8)**, routing internal traffic to external networks through
authenticated proxies at managed interfaces; **SI-4**, detection of
attacks and indicators of attack; and **CA-7**, continuous monitoring,
alongside the logging obligations under M-26-14, which requires
collection of *"source and destination network address information,
including protocols, ports, and session attributes."*

That is the honest form of the architectural argument: not that policy
compels a branch-edge layer, but that an agency asserting these controls
at a branch with nothing there will struggle to produce the evidence,
and will discover it at assessment time.

# 4. The encryption requirement that is not there

## 4.1 What is required

**SC-8, Transmission Confidentiality and Integrity** --- Moderate and
High baselines --- requires protection of the confidentiality or
integrity of transmitted information. Its discussion applies this to
"internal and external networks" and states how it may be satisfied:
*"Protecting the confidentiality and integrity of information can be
accomplished by physical or logical means. Physical protection can be
achieved by using protected distribution systems... Logical protection
can be achieved by employing encryption techniques."*

**SC-8(1), Cryptographic Protection** --- also Moderate and High ---
requires cryptographic mechanisms to prevent disclosure or detect
changes during transmission. Its discussion names them: *"Cryptographic
mechanisms that protect the confidentiality and integrity of information
during transmission include TLS and IPSec."* Coequal. Nothing requires
both.

**SC-13** is in all three baselines and is a selection control: the
agency determines the cryptographic uses and types. Its normative text
does not require FIPS validation; that obligation flows from FIPS 140 as
a mandatory FISMA standard and, for cloud, from FedRAMP policy.

**M-22-09** requires encrypted DNS where technically supported and HTTPS
for all web and API traffic including internal. Email encryption is
explicitly not mandated. **EO 14028 §3(d)** required adoption of
encryption in transit "to the maximum extent consistent with Federal
records laws and other applicable laws," naming no protocol, layer or
standard. **BOD 18-01** requires HTTPS and HSTS on publicly accessible
federal sites and STARTTLS on internet-facing mail servers ---
public-facing scope only.

**TLS versions.** NIST SP 800-52 Rev 2 states agencies *"shall support
TLS 1.3 by January 1, 2024."* M-26-15 requires TLS 1.3 or a successor
"not later than January 2, 2030." **These are different requirements and
the later date is not a relaxation of the earlier one** --- 2030 is a
post-quantum readiness deadline. An agency citing 2030 to justify TLS
1.2-only servers today is out of step with SP 800-52 Rev 2, which has
applied since the start of 2024.

## 4.2 What is not required

**No federal instrument requires the WAN transport itself to be
encrypted where the payload is already protected end to end.** Four
independent lines of evidence:

**The controls that would require it are unbaselined.** SC-8(3),
*Cryptographic Protection for Message Externals*, covers "message
headers and routing information" --- precisely what application-layer
TLS cannot protect. SC-8(4) covers traffic-pattern concealment.
**Neither appears in the Low, Moderate or High baseline.** If policy
intended to require protection beyond the payload, SC-8(3) is where it
would live.

**SC-8 can be satisfied without any encryption.** A protected
distribution system satisfies it. If a physical alternative suffices, a
tunnel is not compelled.

**The assessment procedure is layer-blind.** The SP 800-53A objective
for SC-8(1) asks only that cryptographic mechanisms are implemented
during transmission, and its assessment objects include mechanisms
implementing alternative physical safeguards.

**FedRAMP treats a second layer as optional and unregulated.** FedRAMP's
cryptographic module policy states that where a provider elects a second
encryption layer, that layer may use unvalidated modules --- coherent
only if one compliant layer suffices.

M-22-09 confines its operative network actions to DNS and HTTP and says
so: *"This strategy focuses agencies on two critical and widely used
protocols in the near-term, DNS and HTTP traffic."* Its executive
summary sentence --- *"All traffic must be encrypted and authenticated
as soon as practicable"* --- is routinely quoted as a mandate for
encrypted transport. It is a vision statement, and the memorandum's own
actions do not reach WAN transport as a category.

## 4.3 What this means in practice

An agency whose branch traffic is TLS-protected end to end using
validated modules, whose egress DNS reaches CISA's Protective DNS, with
a documented managed interface and traffic flow policy at each external
telecommunication service under SC-7(4), has a defensible SC-8, SC-8(1)
and SC-7(4) implementation **with no overlay anywhere in it.**

The residual exposure is real and no baselined control names it:
destination addresses, SNI and unencrypted DNS names, packet sizes and
timing, routing metadata. An overlay addresses that. It is a defensible
risk decision. It is not a compliance obligation, and an agency should
not budget on the basis that it is.

## 4.4 Where the encryption argument is genuinely load-bearing

**SC-8(1) applies to the information, not the protocol.** A cleartext
protocol carrying in-scope information across an unprotected path is an
SC-8 finding whatever the transport looks like --- and for those flows
an overlay is frequently the only practical remedy, because the
application cannot be changed.

Supporting controls: **CM-7(1)**, Moderate and High, requires periodic
review to identify unnecessary and nonsecure functions, ports, protocols
and services, and disabling or removal of those the organization deems
unnecessary --- its discussion names FTP among unsecure protocols.
**AC-4**, Moderate and High, whose discussion includes *"keeping
export-controlled information from being transmitted in the clear to the
Internet."*

**The interim action: inventory the cleartext protocols crossing branch
WAN links and treat that inventory as an SC-8 exposure register.**
Cleartext LDAP, SMB, FTP, telnet, unencrypted database traffic and
legacy line-of-business protocols are where the absence of transport
encryption is a real finding rather than a theoretical one. Three
dispositions per entry: encrypt at the application, tunnel that flow
specifically, or retire it. A point-to-point tunnel for three legacy
flows is a small piece of work and the highest-value encryption action
available without an overlay.

## 4.5 DNS: what a DDI platform does and does not satisfy

The Protective DNS obligation is the one hard external-path mandate, and
it raises a practical question: does deploying an enterprise DDI
platform --- Infoblox or equivalent --- satisfy it?

**Partly, and in a specific way: it satisfies the second half of the
requirement and not the first.** The obligation has two parts. Egress
DNS must reach CISA's Protective DNS resolvers, and external third-party
resolvers must be reachable only from authorized internal DNS servers. A
DDI platform is what gives an agency the authorized internal DNS
servers, the control point at which root hints are disabled, the ability
to enforce that endpoints resolve only through it, and --- under M-22-09
--- support for encrypted DNS transport. Those are real and they are
hard to do well without such a platform.

What it does not do is replace CISA's resolvers. **The compliant pattern
is: endpoints → agency internal resolvers → forward egress to CISA
Protective DNS.** The platform is the enforcement point in front of the
mandate, not a substitute for it.

**The trap worth naming explicitly**, because it is easy to configure by
accident: a DDI vendor's own protective-DNS or threat-intelligence
service is architecturally the same shape as CISA's, and a deployment
that forwards egress queries to the *vendor's* cloud resolvers rather
than to CISA's satisfies the vendor's product design and breaches the
federal requirement. The same applies to endpoint agents that establish
DNS-over-TLS or DNS-over-HTTPS sessions directly from the client to a
vendor cloud, bypassing the agency's own resolvers entirely --- that is
precisely the configuration CISA's guidance forbids when it requires
root hints disabled and third-party resolvers reachable only from
authorized internal servers. An agency deploying a DDI platform should
confirm in the design documentation, and test in the running estate,
that egress resolution terminates at CISA and that no endpoint agent has
its own independent path. Vendor threat intelligence applied *at the
internal resolver*, with egress still forwarded to CISA, is compatible;
vendor cloud resolution *instead of* CISA is not.

This is worth a discrete verification task rather than an assumption,
because the failure is silent --- resolution works, users notice
nothing, and the only symptom is that agency queries are not reaching
CISA.

## 4.6 One date inside this quarter

**On 22 September 2026, all FIPS 140-2 certificates move to the CMVP
Historical List.** CMVP supports continued use of these modules in
existing systems and agencies set their own transition timelines, so
this is not a cliff. It is the item in this section with a date inside
the current quarter, and it affects exactly the equipment an agency
would be evaluating. Acquisition documents written now should state the
validation expectation explicitly rather than inheriting it ---
particularly given M-26-15's post-quantum requirement arriving on the
same equipment.

# 5. Why both are a long way off --- and the one thing pulling a piece of it forward

## 5.1 The structural reasons

**Acquisition.** A branch-edge programme is an EIS task order or a
competed acquisition. Requirements, market research, solicitation,
evaluation and award is a multi-quarter process before a device ships,
competing for the same contracting staff as everything else.

**Budget cycle.** Federal budgets are formulated roughly two years ahead
of execution. A programme conceived now is a FY28 execution item unless
absorbed into existing operations and maintenance, which a capital
refresh across hundreds of sites generally cannot be.

**Site count and field logistics.** An agency with a thousand or more
branches is running a multi-year deployment on physical logistics alone.

**Authorization.** A new device class at every branch changes the
boundary described in existing packages. That is assessment work, on the
same security staff.

**TIC 3.0 adoption is not a purchase.** It requires capability mapping,
telemetry integration with CISA, and documentation. That work is
independent of hardware and can begin earlier.

**The competing mandates are the binding constraint.** Three federal
deadlines land inside fifteen months, all drawing on the staff a
branch-edge programme would need:

 -----------------------------------------------------------------------
 Requirement What it demands When
 ----------------------- ------------------------------- ---------------
 OMB M-26-14 Agency logging plan; maturity Plan due within
 assessment against a new 90 days of
 five-level model; retention CISA's Logging
 re-architecture Reference
 Architecture,
 published
 August 2026

 OMB M-26-15 / EO 14412 PQC migration plan; Plan due
 cryptographic inventory; approximately
 PQC-capable key exchange on October 2026;
 TLS/IPsec-terminating migration
 infrastructure through 2030

 CISA BOD 26-04 Vulnerability management Policy update
 re-tooled to a four-variable due 7 August
 risk model; exposed-asset 2026; full
 tagging; quarterly attestations compliance 7
 December 2026
 -----------------------------------------------------------------------

An agency promising an SD-WAN programme in FY27 alongside these three is
promising the same people twice. Saying so in the programme plan is more
credible than not saying it.

## 5.2 BOD 26-02 is a forcing function, and it cuts the other way

There is one countervailing fact, and it is the most important planning
item in this paper.

**BOD 26-02 requires end-of-support edge devices --- routers, switches,
firewalls, wireless access points --- off FCEB networks by August
2027,** with an inventory milestone already passed and a decommissioning
milestone in February 2027. For an agency with ageing branch equipment,
**a hardware refresh is now on a directive clock whether or not any
architecture programme is funded.**

That changes the interim calculus in two ways.

First, it means part of the capital an agency assumed it did not have is
going to be spent anyway, on a compliance basis, inside the window this
paper describes as "years away." The refresh is not the architecture
programme --- but it is money and field logistics being committed to
branch network hardware on a schedule.

Second, and more consequentially: **a refresh is precisely the moment a
branch architecture gets re-chosen, and the default choice is
like-for-like.** An agency that runs BOD 26-02 compliance as a pure
replacement exercise --- same device class, same topology, same absence
of policy and telemetry --- will have spent the money and foreclosed the
architecture question for the life of the new equipment, which is
another seven to ten years.

The practical recommendation is narrow and cheap: **whoever is scoping
BOD 26-02 replacements should be told, in writing, what the eventual
target architecture requires of a branch device** --- application-aware
steering, path measurement, deterministic egress, exportable
per-application telemetry, PQC-capable key exchange per M-26-15, and a
management plane that satisfies BOD 23-02. Specifying those attributes
in a compliance-driven refresh costs almost nothing at requirements time
and preserves the option. Not specifying them spends the same money and
closes it.

# 6. The interim posture

What an agency can do in the twelve to twenty-four months before it can
buy an architecture. None of it requires an award or a completed use
case adoption, and all of it is work the eventual programme needs
anyway.

**6.1 Write the policy before you can enforce it.** Produce the
application-to-path routing policy as a document: for each application
class, the intended path, priority, failover behaviour and source
address presentation. Say plainly that enforcement is currently manual
and partial. This is the artifact an assessor asks for when testing an
SC-7(4) traffic-flow-policy assertion, and its absence is the finding
--- not the absence of a device. It also converts the eventual
acquisition from a technology purchase into the enforcement of existing
agency policy.

**6.2 Measure what you can already measure.** Synthetic transactions
from branch endpoints, flow records from existing edge equipment, and
endpoint telemetry will together produce per-branch latency, loss and
jitter trends. Instrument a representative sample rather than
everything. The output is a baseline: what fraction of user-visible
application latency is transport-attributable, by branch and by
application. Section 8 explains why having this before the next
migration wave matters far more than having it after.

**6.3 Establish deterministic egress.** Usually a NAT configuration
decision. It pays three times: applications keyed to a client address
stop failing intermittently; location-aware conditional access policies
start meaning what they were written to mean; and the agency gains a
documented, testable fact about each branch.

**6.4 Close the cleartext-protocol exposure.** Per Section 4.4 --- the
encryption work that is actually required and actually available.

**6.5 Verify the DNS path end to end.** Per Section 4.5 --- confirm
egress resolution terminates at CISA's Protective DNS, that root hints
are disabled, and that no endpoint agent holds an independent resolver
path. Test it rather than reading the design.

**6.6 Finish the obligations that already apply.** Encrypted DNS, HTTPS
for web and API traffic including internal, HSTS and STARTTLS on
public-facing services, TLS 1.3 support per SP 800-52 Rev 2. An agency
that has not completed these is exposed on requirements that exist while
contemplating an architecture justified by requirements that do not.

**6.7 Confirm the Active Directory paths.** Per Section 7.2 --- the four
operations that genuinely require a reachable domain controller.

**6.8 Fix chattiness where it dominates.** Per Section 7.3 --- in an
interval where transport cannot change, the only lever that moves user
experience, and it belongs to application owners.

**6.9 Specify the target-architecture attributes into the BOD 26-02
refresh.** Per Section 5.2. Cheapest high-value action in this list.

**6.10 Document the gap as an accepted risk.** Record in the risk
register and the affected packages which control assertions depend on
transport evidence that does not exist, the compensating measures above,
and the remediation and its funding dependency. An undocumented gap
found by an assessor is a finding; a documented gap with compensating
measures and a plan is an accepted risk. The technical situation is
identical; the institutional position is not.

# 7. Engineering realities the interim has to respect

## 7.1 What actually breaks on proxied and re-routed paths

Long-lived stateful sessions fail more often when an enforcement point
sits in the path: connection resets and proxy idle timeouts; end-to-end
mutual TLS and certificate pinning, which need an explicit bypass;
applications that key state to a client source address; protocols an
enforcement point cannot parse; and path changes that alter effective
MTU, which present as throughput collapse rather than outage.

One frequently cited mechanism does not occur: **a path change does not
cause TCP sequence-number discontinuity.** Sequence numbers are endpoint
properties, unaffected by route. A re-route that changes the client's
apparent source address will break established connections; one that
does not, generally will not. The operative property is address
continuity --- which is why Section 6.3 is worth doing early.

## 7.2 Kerberos, and the four dependencies that are real

Kerberos is often described as breaking under source address
translation. **This does not occur under Microsoft's defaults.** RFC
4120 permits but does not require the client address field, and Windows
does not use it: `KdcUseClientAddresses` defaults to 0,
`KdcDontCheckAddresses` defaults to 1, client-side `ClientIpAddresses`
defaults to false. Windows KDCs neither populate nor enforce the field,
which is why Kerberos works across NAT.

Two related figures circulate and neither is real: there is no
sub-5-millisecond round-trip requirement to a domain controller and no
5-millisecond Kerberos timeout --- the 5-minute figure they derive from
is clock-skew tolerance. Ticket lifetimes are generous: 10 hours for a
TGT with 7-day renewal, 600 minutes for service tickets.

What genuinely requires a reachable domain controller: **initial TGT
acquisition at logon; Group Policy retrieval from SYSVOL; password
change, including expiry-forced change; and Microsoft Entra hybrid join
registration**, for which Microsoft documents a network line-of-sight
requirement.

A branch on local breakout whose domain controllers sit in a datacenter
reaches them over whatever private path or connector the agency provides
--- not over the security stack's internet egress. Overlooking that path
breaks sign-in, policy application and password change while cloud
applications keep working. If a hardening baseline has moved either KDC
registry value off its default, that setting rather than the network is
the exposure.

## 7.3 Round trips dominate

A branch with one-way latency of 20--30 ms to its breakout point and
40--60 ms from there to the cloud region sees roughly 120--180 ms round
trip per query; a transaction issuing 30 sequential queries incurs
3.6--5.4 seconds of network latency before any database work.

A branch-edge device acts on the first leg only.

 ----------------------------------------------------------------------------------
 Component Baseline With What moves it
 (one way) branch-edge 
 policy and 
 nearer 
 breakout 
 ------------------------ ------------ ------------- ------------------------------
 Branch → enforcement 20--30 ms 5--15 ms Nearer breakout; better link
 point selection

 Enforcement point → 40--60 ms 40--60 ms Cloud region choice; provider
 cloud backbone

 **Round-trip total** **120--180 **90--150 
 ms** ms** 

 **30-query transaction** **3.6--5.4 **2.7--4.5 **≈20--25%**
 s** s** 
 ----------------------------------------------------------------------------------

*Illustrative inputs, stated so they can be replaced: 30 sequential
round trips, one-way leg latencies as shown, no application change.*

**Reducing the transaction from 30 sequential round trips to 3 takes it
to 270--540 ms --- roughly an order of magnitude.** In an interval where
transport cannot be changed, that is the only lever available. An agency
justifying a future branch-edge programme on latency alone has chosen
the weaker of its two arguments.

# 8. Attribution, and the cost of getting the order wrong

## 8.1 Phase inversion

Most agencies are migrating workloads to cloud now, while transport
modernization is years away. The consequence is not primarily
performance. It is **attribution**.

After migration, application response times and cloud bills are both
worse than the business case assumed. The agency has cloud metrics and
application metrics. It does not have per-application transport metrics,
because those require the device it has not deployed. Cost is attributed
to the only thing being measured --- the cloud --- and the remedies
follow the attribution: more instances, more caching, read replicas, a
delivery layer. Each raises cloud spend, which strengthens the "cloud is
too expensive" narrative, which generates repatriation pressure. The
transport contribution is never identified because it never appears in
the data anyone examines.

The self-reinforcing property is what makes it worth naming: **the
remedy for a misattributed cost raises the cost that was
misattributed.**

## 8.2 What the evidence actually supports

The individual links in that chain have federal support. **The composed
phenomenon does not appear in any literature this paper could locate,
and is presented here as the author's own inference.** The distinction
matters, so the components are set out separately.

**Documented: federal agencies cannot track cloud costs and savings
consistently.** GAO-19-58 (April 2019) reviewed 16 agencies and found
they "identified issues in tracking and reporting cloud spending and
savings data, including not having consistent processes in place to do
so," and concluded "it is likely that agency-reported cloud spending and
savings figures were underreported." GAO-22-106195 (September 2022)
named cost and savings tracking as one of four federal cloud challenges,
with agencies using "inconsistent data to calculate cloud spending."
GAO-26-107530 (June 2026) covered all 24 CFO Act agencies and found **17
of 24** reported that "control of cloud costs required changes in IT
management approaches."

**Documented: transport requirements were not understood at migration
time.** From GAO-26-107530, under cost tracking following migration:
*"Commerce officials reported that cloud usage and requirements (data
volume, bandwidth, throughput, etc.) did not immediately translate one
for one with the previously on-premise solution."* That is a federal
agency stating that bandwidth and throughput requirements were not
understood at migration, categorized by GAO as a cost-tracking problem.
It is not a claim of misattribution, and should not be represented as
one.

**Documented: transport constraints degraded performance and raised cost
in a federal cloud context.** The CISA passage quoted in Section 2.2.

**Documented: transport cost has been assumed out of a federal cloud
cost estimate.** GAO's own Inspector General (OIG-25-1, February 2025)
found GAO "did not include data egress fees in a major system's cost
estimate and did not document the exclusion because they deemed data
egress fees minimal," and had "not established formal procedures
implementing cloud cost management policies." Narrow, but a clean,
primary-source instance of the estimating blind spot.

**Documented: latency is a first-order, non-obvious performance
driver.** A University of Cambridge Computer Laboratory study injected
latency at nanosecond resolution and found 10 µs added each direction
produces a noticeable effect and 50 µs "significantly negatively
impact\[s\]" performance, with Memcached degrading over 20% at 100 µs.
That is a datacenter-scale study at microsecond resolution; WAN latency
is three orders of magnitude larger, which makes the mechanism more
plausible at WAN scale but does not license quoting microsecond findings
as WAN measurements.

**Not documented: the composed claim.** No GAO report, IG report,
academic paper or research-firm study describes transport-attributable
cost being misattributed to cloud and driving compensatory spend.
Notably, the highest-profile debate on cloud cost --- the Andreessen
Horowitz "Cost of Cloud" analysis and its rebuttals --- does not mention
network transport at all on either side. That silence is the gap this
section addresses, and it is also the reason the claim must be labelled
as an inference.

## 8.3 The competing explanations a reviewer will raise

These are better evidenced than the transport explanation and must be
addressed rather than ignored.

**Idle and over-provisioned resources.** Flexera's annual survey (2026
edition, 750+ cloud decision-makers, fifteenth year) reports
self-estimated wasted cloud spend at **29%**, attributed to idle
capacity, oversized instances and unused commitments. This is the
best-evidenced driver of cloud overspend and it is not network-related.

**Egress fees are quantitatively small.** The UK Competition and Markets
Authority, with access to provider financial data, found egress fees
generated 0--5% of total UK public cloud revenues for the three largest
providers in 2022, and that a majority of customers paid **less than
1%** of annual cloud spend on egress. A regulator's finding beats any
survey. **This paper's argument is not about egress fees** --- it is
about transport-*induced* compute spend --- but the argument will be
read as an egress argument unless it says otherwise, so it says
otherwise here.

**Licensing practices.** GAO-25-107114 documents restrictive software
licensing driving cost increases agencies were "unable to specify the
actual amount of" across six agencies. Federally documented, and not
transport.

**Management and accounting model change.** GAO-26-107530's finding that
17 of 24 agencies needed changed IT management approaches is an
organizational explanation competing directly with the transport one.

**Repatriation is smaller than commonly claimed.** Uptime Institute's
own survey conclusion is that high costs drive repatriation "but impact
is overstated" --- 33% moved some production applications back, only 6%
left public cloud entirely. **Neither Uptime nor comparable surveys list
network or latency among stated repatriation reasons.** The widely
circulated "71% will repatriate" figure comes from a vendor-sponsored
survey with no published sample size or methodology and should not be
cited.

That last point deserves a note on falsifiability. This paper's claim
predicts that organizations would *not* name transport as the cause,
since by hypothesis they cannot see it. That makes survey silence weak
evidence in either direction, and the claim correspondingly hard to test
from survey data. **It is not, however, untestable.** Section 8.4 states
what would settle it.

## 8.4 What would confirm or refute this

The paired-branch study in Section 8.5, run before and after a migration
wave rather than before and after a device deployment, is the direct
test. Three specific measurements would settle the question in a given
estate:

1. **Instance-count elasticity to path events.** If autoscaling or
 manual capacity increases correlate with branch WAN path degradation
 rather than with user or transaction volume, the mechanism is
 present. If they correlate only with volume, it is not.
2. **Cache and replica additions traced to a diagnosis.** Where a
 caching layer or read replica was added post-migration, examine the
 incident or performance record that justified it. If the diagnosis
 was "slow application" with no transport measurement available, the
 attribution was unavailable rather than wrong --- which is the
 claim.
3. **Help desk ticket clustering by branch.** Ticket volume per user
 that varies significantly by branch, uncorrelated with application
 mix, points at transport. Uniform distribution points away from it.

An agency that runs these three has either evidence or a disproof, and
either is worth more than the argument.

## 8.5 Measuring the eventual case

When funding becomes possible, the number that survives a budget
examiner is a measurement. A **paired-branch study** produces one: two
branches with comparable user counts and application mix; instrument
both for 30 days across WAN path events, application server CPU and
new-connection rate, identity provider authentication volume, database
cache hit ratio, and help desk tickets tagged by application; deploy at
one; instrument both for a further 30 days. The difference in the
post-period, adjusted for the pre-period difference, is the effect size.

Four cost categories are worth measuring and in most estates all four
exceed the compute term: help desk volume by branch normalized by user
count; circuit capacity bought as headroom for unmanaged queuing;
analyst hours on alerts closed as benign network behaviour; and the risk
cost of control assertions that cannot be evidenced.

**Do not put a routing-attributable percentage into a TCO model on the
authority of any white paper, including this one.** Put in a measured
figure with its method attached, or a range with the assumption labelled
as an assumption.

# 9. Recommendations

**1. Make the architectural case by elimination, not by mandate.** State
in programme documentation that no federal policy requires SD-WAN or
SASE, that TIC 3.0 is technology-neutral, that CISA's June 2026 guidance
describes SASE as a permitted path rather than a required one, and that
the branch-edge architecture is the residual after the legacy vehicles
expired and the alternatives were assessed. That framing survives
scrutiny.

**2. But state the four obligations that do land on branch equipment**
--- Protective DNS egress routing, BOD 23-02 management interfaces, BOD
26-02 end-of-support devices, and M-26-15 PQC-capable key exchange.
"Technology-neutral, not requirement-free" is the accurate formulation
and it is a stronger position than either half alone.

**3. Specify the target-architecture attributes into the BOD 26-02
refresh now.** Whoever is scoping end-of-support replacements should
have, in writing, what the eventual architecture requires of a branch
device. This is the highest-leverage action in the paper and it costs
requirements-writing time.

**4. Re-examine any ExpressRoute arrangement for Microsoft 365 approved
before 2019.** Microsoft no longer recommends it, its canonical network
guidance no longer mentions it, it cannot carry all Microsoft 365
traffic, pre-August-2017 circuits may still advertise Office 365
prefixes without a current authorization, and the GCC routing
arrangement is documented as working but not documented as to how.
Confirm the prefix arrangement with Microsoft in writing.

**5. Correct the encryption position in writing.** SC-8 and SC-8(1) are
mechanism-agnostic and satisfiable by end-to-end TLS; SC-8(3) and
SC-8(4) are unbaselined; no federal requirement compels an encrypted WAN
overlay where the payload is protected. Then state the residual risk an
overlay would address, so the eventual decision is a risk decision with
a named residual.

**6. Inventory cleartext protocols crossing branch WAN links** and treat
it as an SC-8 exposure register. Three dispositions per entry.

**7. Verify the DNS egress path end to end**, including that no DDI
platform or endpoint agent holds an independent resolver path that
bypasses CISA's Protective DNS. Test it; the failure mode is silent.

**8. Instrument a sample of branches before the next migration wave**,
and run the three measurements in Section 8.4. The baseline cannot be
reconstructed afterward and it costs staff time rather than capital.

**9. Document the gap as an accepted risk** --- which control assertions
depend on transport evidence that does not exist, the compensating
measures, and the funding dependency.

**10. Price the alternatives in the EIS pricer with your own circuits
and site counts**, rather than from published multiples. Note that the
SASE per-user subscription term is the one most often omitted from
SD-WAN-versus-MPLS comparisons and may dominate the result.

# 10. Sources

Figures are labelled by type. The latency decomposition in Section 7.3
is illustrative with all inputs stated. Section 8 distinguishes
documented components from the author's own inference. Where something
could not be found, it is stated as not found rather than estimated.

**Policy, directives and statute.** OMB M-19-26 (12 September 2019),
rescinding M-08-05, M-08-16, M-08-27 and M-09-32 · OMB M-22-09 (26
January 2022) · OMB M-25-04 (January 2025), the current annual FISMA
guidance · OMB M-26-05 (23 January 2026) · OMB M-26-14 (22 May 2026),
rescinding M-21-31 · OMB M-26-15 (24 June 2026) · EO 14028 (12 May 2021)
Section 3(d), as amended by EO 14306 (6 June 2025) · EO 14412 (22 June
2026) · CISA BOD 18-01, BOD 23-01, BOD 23-02, BOD 26-02 (5 February
2026), BOD 26-04 (10 June 2026) · CISA *Encrypted DNS Implementation
Guidance* (May 2024) · 6 U.S.C. § 663 note · CISA Zero Trust Maturity
Model v2.0 (April 2023) · DoD Zero Trust Strategy (November 2022).

**TIC 3.0.** Program Guidebook (the passage quoted in Section 2.2
appears in both the December 2019 and July 2025 versions), Reference
Architecture, Security Capabilities Catalog, Use Case Handbook, Service
Provider Overlay Handbook; Traditional, Branch Office, Remote User and
Cloud use cases. **CISA, *The Journey to Zero Trust: Using Secure Access
Service Edge in a Modern TIC 3.0 Solution* (June 2026)** --- existence
and guidance status confirmed from CISA's announcement; its text should
be obtained and read directly. TIC document versions move independently
and the indexing pages are not always current: take versions from cover
pages. Note also: M-19-26 contains no latency or backhaul language and
should not be cited for one.

**Standards.** NIST SP 800-53 Rev 5 (Release 5.2.0, 27 August 2025) ---
SC-7, SC-7(4), SC-7(8), SC-8, SC-8(1)--(5), SC-13, CM-7(1), AC-4 · SP
800-53B for baseline allocation · SP 800-53A Rev 5 for the SC-8(1)
assessment objective · SP 800-52 Rev 2 (August 2019) · SP 800-207
(August 2020) and SP 1800-35 (final 10 June 2025) · RFC 4120 · CMVP FIPS
140-2 historical-list transition, 22 September 2026.

**Microsoft.** *Azure ExpressRoute for Microsoft 365*; *Using
ExpressRoute for routing Microsoft 365 traffic*; *Implementing
ExpressRoute for Microsoft 365*; *Microsoft 365 network connectivity
principles* (August 2026); *Microsoft 365 URLs and IP address ranges*;
*Microsoft 365 endpoints*; GCC High and DoD endpoint articles;
*Microsoft 365 IP Address and URL web service*; *Managing Microsoft 365
endpoints*; ExpressRoute FAQ, prerequisites, routing requirements and
route-filter configuration; *Cloud feature availability for US
Government customers*; Office 365 GCC and Office 365 US Government
service descriptions. Kerberos KDC registry configuration keys and
Active Directory ticket-lifetime defaults; Microsoft Entra hybrid join
line-of-sight requirement. *Note: the Microsoft 365 ExpressRoute
article's displayed date and its authored metadata date disagree; cite
it as retrieved September 2026.*

**Contract, programme and pricing.** GSA EIS Public Pricer (interactive;
no bulk export or published API) · GSA MTIPS features and price
structure (ICB pricing, excluded from the pricer) · GSA EIS contract
basics · GAO-14-63 (December 2013) · GAO-20-155 (April 2020) ·
GAO-25-107795 (July 2025) · CRS IF11668 (October 2020) · GSA EIS case
study (June 2020) · Zscaler GSA schedule price lists (per-user annual
pricing; two published lists differ --- cite the specific file) ·
FedRAMP Consolidated Rules for 2026 and Notice 0013 (16 June 2026) ·
FedRAMP *Policy for Cryptographic Module Selection and Use*.

**Cost and attribution evidence.** GAO-19-58 (April 2019) ·
GAO-22-106195 (September 2022) · GAO-26-107530 (June 2026) · GAO
OIG-25-1 (February 2025) · GAO-25-107114 (November 2024) · Popescu,
Zilberman & Moore, *Characterizing the impact of network latency on
cloud-based applications' performance*, University of Cambridge Computer
Laboratory Technical Report UCAM-CL-TR-914 · Flexera *State of the
Cloud* 2026 (750+ respondents; vendor with commercial interest in
cost-management findings) · Uptime Institute Data Center Capacity Trends
Survey analysis on repatriation · UK Competition and Markets Authority
cloud services egress fees working paper (23 May 2024) · TeleGeography
WAN pricing research (independent research firm; free publications give
percentages, not absolute prices) · Andreessen Horowitz, *The Cost of
Cloud, a Trillion Dollar Paradox* (2021) and Quinn's rebuttal --- both
parties hold commercial interests on opposite sides and are cited
against each other.

**Stated as not found.** No downloadable GSA EIS price list; no public
MTIPS price; no GAO quantification of realized EIS savings; no federal
agency's published before-and-after SD-WAN cost figures; no public GSA
pricing for Prisma Access, Netskope, Cisco/Meraki, Fortinet or
VeloCloud; no free absolute cost-per-Mbps figure for MPLS versus DIA
from a non-commercial source; no published federal TICAP operating cost;
no federal figure isolating legacy WAN or MPLS operating cost; no
federal cloud repatriation documentation; no documented case study,
federal or commercial, in which WAN transport was identified as the root
cause of a believed cloud cost or performance problem.

**A note on citation practice.** TIC document versions, FedRAMP
marketplace listings, vendor authorization levels and Microsoft endpoint
data all move faster than the documents citing them. Anything that
becomes load-bearing in an authorization package or acquisition document
should be read from the primary source at the time of writing, with the
retrieval date recorded alongside it.
