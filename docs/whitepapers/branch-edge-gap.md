# Table of Contents {#table-of-contents .TOC-Heading}

**Status and scope.** This is independent technical analysis by the
author. It is not an agency position, has not been reviewed or endorsed
by any agency, and carries no agency markings. Policy and product
statements are current as of 3 September 2026; §10 records the
verification status of every external claim, including four that could
not be confirmed and are marked as such.

**How this version differs from v1.0.** Version 1.0 (September 2026)
contained factual errors serious enough to invalidate three of its five
findings. This version corrects them. Appendix A lists every change and
why it was made. The three most consequential: v1.0 defined "DIA" as a
Defense Information Systems Agency circuit (it is Direct Internet
Access; DISA is the agency, DIA is the Defense Intelligence Agency);
v1.0 asserted that CISA mandates SD-WAN as a component of SASE, citing a
CISA document that does not exist; and v1.0's Kerberos failure mechanism
does not occur under Microsoft's default configuration. The paper's
central argument survives all three corrections, but it is a weaker and
more honest argument than v1.0 made, and §2.4 says so explicitly.

# 1. Executive summary

Federal agencies are replacing hairpin routing through Trusted Internet
Connections access points with local Direct Internet Access (DIA) at the
branch, secured by a Secure Access Service Edge (SASE) service. That is
the right direction. This paper addresses what is frequently left out of
it: a branch-edge policy layer --- SD-WAN or equivalent --- that decides
which traffic takes which path, measures the health of each path, and
produces per-application transport telemetry.

Without that layer, an agency has cloud-delivered security inspection
applied to traffic it does not govern before the traffic leaves the
building. The security controls work. The transport underneath them is
undifferentiated, unmeasured, and unattested.

**This paper makes one claim about policy and four about engineering.
The policy claim is deliberately narrow.**

**Finding 1 --- TIC 3.0 does not require SD-WAN, and any paper telling
you otherwise is wrong.** TIC 3.0 is explicitly descriptive rather than
prescriptive; it mandates no technology, no vendor, and no topology.
What it does require is that an agency implement and be able to
*evidence* a set of security capabilities and share telemetry with CISA.
The honest version of this paper's argument is therefore an evidence
argument, not a compliance-violation argument: several TIC 3.0 security
capabilities and several NIST SP 800-53 Rev 5 control assertions are
difficult or impossible to evidence at the branch without a
policy-enforcing, telemetry-producing device there. That is a real and
defensible gap. It is not a directive violation, and presenting it as
one will not survive review. (§2.3, §2.4)

**Finding 2 --- DIA and SASE together solve the hairpin problem and
leave the branch-edge problem untouched.** Direct Internet Access
removes the forced trip to a central inspection point. It does not add
path selection across multiple links, application-aware steering,
link-health-driven failover, queue management before traffic enters the
WAN, or per-application path telemetry. Those are properties of a
branch-edge device, and an agency that has replaced a TICAP with DIA has
changed where inspection happens without changing whether transport is
governed. (§3)

**Finding 3 --- The legacy-protocol fragility is real, but not for the
reasons commonly given.** Long-lived, stateful sessions do fail under
proxied and re-routed paths. They fail because of connection resets,
proxy idle timeouts, end-to-end mutual TLS and certificate pinning,
source-IP-dependent application logic, and non-HTTP protocols an
enforcement point cannot parse. They do *not* fail because a path change
breaks TCP sequence continuity (it does not), and Kerberos does *not*
fail because of source-address changes under Microsoft's default KDC
configuration (`KdcUseClientAddresses` defaults to 0 and
`KdcDontCheckAddresses` defaults to 1 --- Windows KDCs neither write nor
check the ticket address field). The correct list of Active Directory
dependencies that genuinely require reachable domain controllers is
short and specific, and §4 gives it. (§4)

**Finding 4 --- Chattiness, not milliseconds, is the dominant
application-latency term, and network work cannot fix it.** A
transaction issuing 30 sequential round trips against a remote database
is dominated by its round-trip count. Re-architecting transport can
plausibly recover 20--35% of the network component on a typical
branch-to-cloud path; reducing 30 round trips to 3 recovers an order of
magnitude. Any business case that offers a network intervention as the
remedy for application chattiness will be dismantled by the first
reviewer who decomposes the path. §4.2 does that decomposition,
including for the intervention this paper recommends. (§4.2)

**Finding 5 --- Sequencing is an engineering dependency, not a mandate,
and it is still the strongest argument here.** An agency that migrates
workloads to a cloud environment before it can govern and measure the
transport its users reach that cloud over has no baseline against which
to attribute post-migration performance and cost problems. The
predictable result is that transport-attributable cost is absorbed as
cloud cost, which produces a "cloud is too expensive" narrative and
pressure to repatriate --- with the actual cause never identified
because it never appears in the metrics being examined. This paper calls
that pattern **phase inversion**. No federal policy mandates the
sequence; the dependency is technical, and it is enough. (§7)

**What this paper deliberately does not do.** It does not give you a
compute-overhead percentage or a dollar figure. Version 1.0 asserted
12--18% additional CPU utilization and \$200,000--\$400,000 in annual
overspend with no derivation, no measurement, and no instance count, and
then directed agencies to use those figures as a TCO baseline. That was
indefensible. §6 replaces it with a measurement method, the specific
counters to collect, and a worked example whose every input is stated so
a reviewer can substitute their own.

# 2. Policy background

## 2.1 What TIC 3.0 changed

The Trusted Internet Connections initiative was established in 2007 and
operationalized by OMB Memorandum M-08-05, *Implementation of Trusted
Internet Connections* (20 November 2007), as a consolidation mandate:
civilian agencies were to reduce external internet access points to a
small approved set, through which all agency traffic would be routed and
inspected.

Consolidation succeeded, and the routing model it required did not age
well. The mandatory architecture sent traffic from any agency location
to a physical access point before it could reach the internet or a cloud
service, which added a long detour to every cloud interaction as cloud
adoption accelerated. Managed Trusted Internet Protocol Services (MTIPS)
moved operation of those access points to GSA-contracted commercial
providers, improving operational consistency while locking the
hub-and-spoke routing model into contract.

**OMB M-19-26, *Update to the Trusted Internet Connections (TIC)
Initiative* (12 September 2019), rescinded M-08-05** --- along with
M-08-16, M-08-27 and M-09-32 --- and replaced physical-routing
compliance with capability-based compliance. Under TIC 3.0, agencies are
not required to route all traffic through a traditional access point,
provided they implement approved use cases that maintain the required
security capabilities and share telemetry with CISA.

*Verification note: M-19-26's rescission of M-08-05 is confirmed in the
memorandum text. No instrument rescinding M-19-26 was found; treat TIC
3.0 as operative. Historical access-point reduction figures circulate
widely in secondary sources and are not cited here because no primary
source was confirmed for them.*

## 2.2 The current TIC 3.0 document set

TIC 3.0 core guidance comprises five volumes --- Program Guidebook
(Volume 1), Reference Architecture (Volume 2), Security Capabilities
Catalog (Volume 3), Use Case Handbook (Volume 4), and Service Provider
Overlay Handbook (Volume 5) --- plus four published use cases:
**Traditional, Branch Office, Remote User, and Cloud.**

Three cautions, because v1.0 of this paper got each of them wrong:

- **There is no TIC 3.0 "SASE Use Case."** CISA has not published one.
 Version 1.0 cited it in a section heading, in a formal
 recommendation, and in a program phase table.
- **Use-case version numbers and dates could not be verified for this
 revision.** CISA's core-guidance landing page and the underlying
 PDFs refused automated retrieval. Version 1.0 cited a "TIC 3.0
 Program Guidebook, July 2025, Version 1.2" and a "Branch Office Use
 Case, Version 3.0"; neither could be confirmed, and the July 2025 /
 v1.2 designation appears to belong to the *Cloud* Use Case rather
 than the Program Guidebook. **Anyone citing a TIC version number
 should open the PDF and read it off the cover page.** This paper
 cites the documents by name only.
- **CISA is reported to have published *The Journey to Zero Trust ---
 Using Secure Access Service Edge in a Modern TIC 3.0 Solution*,
 dated 24 June 2026.** Its existence is reported but its text could
 not be retrieved for this revision, so nothing in this paper rests
 on it. If it exists as described, it is the single most relevant
 CISA document to this subject and should be read before this paper
 is acted on.

## 2.3 What TIC 3.0 requires, stated precisely

This is where version 1.0 failed, so it is worth stating carefully.

TIC 3.0 guidance is **descriptive, not prescriptive**. It defines
security capabilities and the objectives they serve; it does not mandate
products, vendors, or topologies. It does not require SD-WAN. It does
not require SASE. It does not prohibit either.

Version 1.0 asserted that "CISA's SASE Roadmap is explicit: SD-WAN is a
structural component of SASE, not an optional enhancement," and cited
*Secure Access Service Edge (SASE) Roadmap for Federal Civilian
Agencies* (CISA, 2023). **No such document appears in CISA's own
guidance index.** Two of v1.0's five findings, an entire subsection, and
a formal acquisition recommendation rested on it. A reviewer who follows
that citation and finds nothing discards the paper, and is right to.

What CISA does say about SD-WAN, in the material that could be verified,
is procurement-oriented rather than architectural: the TIC FAQ notes
that EIS provides SD-WAN networking and connectivity options to and from
agency networks, cloud services, and the internet. That is an
availability statement, not a requirement.

## 2.4 The honest version of the argument

Strip out the invented mandate and what remains is still worth an
agency's attention --- and it is defensible, which the v1.0 version was
not.

TIC 3.0 compliance is demonstrated through implemented security
capabilities and the evidence that they are implemented. Several of
those capabilities, and several NIST SP 800-53 Rev 5 control assertions
an agency makes in its own authorization packages, are hard to evidence
at a branch that has no policy-enforcing, telemetry-producing device:

- **SC-7, Boundary Protection.** The assertion is that the system
 monitors and controls communications at external boundaries and key
 internal boundaries. With local internet breakout at the branch, the
 branch *is* an external boundary. An agency asserting SC-7 there
 should be able to say what is monitored and controlled at that
 boundary, by what, and produce the record.
- **SI-4, System Monitoring.** Detection of attacks and indicators of
 attack. Per-application, per-path transport telemetry is directly
 responsive; a static router that emits interface counters is not.
- **AC-17, Remote Access.** Monitoring and control of remote access
 methods. Application-to-path assignment is part of the answer to how
 remote access is controlled and to where.
- **CA-7, Continuous Monitoring**, and the logging obligations under
 **OMB M-26-14** (§2.5). If transport-layer events are not collected,
 they are not in the pipeline that memo governs.

None of that says an agency is out of compliance for lacking SD-WAN. It
says an agency with an ungoverned branch edge will have difficulty
producing the evidence its own control assertions promise, and that the
gap surfaces at assessment time rather than at deployment time. **That
is an evidence argument, and it is the argument this paper makes.**

## 2.5 Policy currency --- four citations that changed in 2026

Any agency network document written before mid-2026, including version
1.0 of this one, is likely to carry at least one of these:

- **OMB M-21-31 is rescinded.** M-26-14, *Ensuring Effective and
 Efficient Agency Logging and Network Visibility* (22 May 2026),
 states: "Effective immediately, OMB Memorandum M-21-31 is
 rescinded." The EL0--EL3 event-logging tiers no longer exist in
 federal policy. They are replaced by risk-based scoping and a
 five-level maturity model (0 Ineffective through 4 Optimal, scored
 to the lowest watermark), with retention set at six months actively
 searchable and one year retrievable. Agency logging plans are due
 within 90 days of the release of CISA's Logging Reference
 Architecture, published in August 2026. Version 1.0 cited M-21-31 in
 its reference list.
- **CISA BOD 22-01 and BOD 19-02 are revoked** by BOD 26-04,
 *Prioritizing Security Updates Based on Risk* (10 June 2026), which
 replaces flat KEV remediation clocks with a four-variable risk model
 selecting one of five remediation windows.
- **OMB M-22-09 remains operative, and all of its deadlines expired on
 30 September 2024.** No successor has been issued. A document urging
 agencies toward M-22-09 outcomes in late 2026 should say that rather
 than implying a live clock.
- **EO 14028 remains in effect but was amended by EO 14306 (6 June
 2025)**, which also struck Section 5 of EO 14144 in its entirety.

**The transport-contract picture also changed.** Networx expired 31 May
2026 and WITS 3 expired 28 February 2026; as of 31 July 2026, 214
agencies had completed transition to Enterprise Infrastructure Solutions
(EIS), whose first option period runs to 31 July 2027. An agency reading
a recommendation to "exit MTIPS" should understand that the vehicle
question has largely resolved itself; the remaining question is which
EIS services the agency has ordered, not which contract it is on.

## 2.6 FedRAMP does not constrain your routing

This was the strongest section of version 1.0 and it survives intact.

FedRAMP authorizes cloud service offerings against NIST SP 800-53 Rev 5.
It governs the security posture of the service. **It says nothing about
the network topology an agency uses to reach that service.** FedRAMP
does not prohibit SD-WAN, does not require hairpin routing, and does not
mandate any particular path.

Agencies nonetheless refuse SD-WAN on stated FedRAMP grounds. The
correct response to that position is a single question: *name the
control or control enhancement that SD-WAN violates.* There is none. An
architectural refusal with no identifiable control basis is a governance
failure in its own right, and it should be documented as one.

Two corrections to how v1.0 stated this:

- **Drop the control count.** Version 1.0 said FedRAMP Moderate is
 "approximately 325 security controls." 325 is the Rev 4 figure; Rev
 5 Moderate was published at 323. More to the point, FedRAMP Notice
 0013 (16 June 2026) removed the vast majority of FedRAMP-assigned
 control parameter values and nearly all FedRAMP-specific guidance
 from the Rev 5 baselines, and no revised counts have been published.
 **No FedRAMP Moderate control count is currently citable.** Do not
 cite one.
- **Note the vocabulary transition, and do not overstate it.** Under
 the FedRAMP Consolidated Rules for 2026, "authorization" becomes
 "certification" and the Low/Moderate/High impact levels become
 Certification Classes A through D (Class C corresponds to the former
 Moderate). **4 July 2026 was the start of optional early adoption;
 mandatory adoption is 1 January 2027.** Existing Rev 5
 authorizations remain valid to at least 31 December 2028. Two things
 widely said about this transition are not true and should not be
 repeated: POA&Ms were not eliminated --- the rules retain them
 explicitly for agencies --- and "continuous monitoring" was not
 renamed. This paper uses the pre-2026 vocabulary that agency
 packages currently carry.

# 3. What Direct Internet Access does and does not give you

## 3.1 The right problem, half solved

Direct Internet Access at the branch --- local breakout to the internet,
with a SASE service providing secure web gateway, cloud access security
broker, firewall-as-a-service and zero trust network access functions at
a nearby point of presence --- is the architecture TIC 3.0 was written
to permit. It removes the forced detour to a central inspection point.
Agencies adopting it are doing the right thing.

What it changes is *where inspection happens*. What it does not change
is *whether transport is governed*.

A branch with DIA and no branch-edge policy layer has:

**(a) No path selection.** One link is the path. If that link degrades
--- latency, jitter, or partial loss short of a link-down event ---
nothing at the branch detects the condition and moves traffic. A second
link, if one exists, sits idle as a cold standby.

**(b) No application awareness.** Interactive database traffic,
authentication exchanges, video conferencing, backup jobs and patch
downloads are forwarded identically. There is no per-application policy
and no differentiation between latency-sensitive and
throughput-sensitive flows.

**(c) No queue management before the WAN.** Quality of Service must be
applied where traffic enters the constrained link. Without a device at
that point, high-priority flows share an unmanaged queue with bulk
transfers, and the agency's stated prioritization exists only in a
document.

**(d) No link aggregation.** Two circuits cannot be used concurrently,
and failover between them is manual or absent.

**(e) No per-application transport telemetry.** This is the one that
matters most for §2.4. Interface counters tell you a link was busy. They
do not tell you which application experienced which latency over which
path, which is what an SI-4 or CA-7 assertion about transport actually
needs.

## 3.2 The fallacy, stated correctly

The position this paper addresses is: *"We have local internet breakout
and a SASE service. SD-WAN is redundant, adds risk, or isn't authorized
under our controls."*

**Redundant.** SASE inspects and enforces on traffic that has arrived at
the PoP. A branch-edge policy layer governs which traffic goes where,
over which link, with what priority, before it leaves the building. They
operate at different points on the path and neither substitutes for the
other. The security stack is complete; the transport layer under it is
not.

**Adds risk.** A branch-edge SD-WAN appliance is a network device with a
management plane, and that is a real attack surface --- CISA issued
Emergency Directive 26-03 on 26 February 2026 covering vulnerabilities
in Cisco SD-WAN systems, which is exactly the kind of exposure this
objection anticipates. The honest answer is not that the risk is zero.
It is that the branch already has a router with a management plane, that
the replacement produces telemetry and enforces auditable policy the
incumbent does not, and that the device must be brought under the
agency's normal vulnerability management --- now governed by BOD 26-04's
risk-based remediation windows --- like any other internet-reachable
infrastructure. An agency that cannot patch a branch appliance within
BOD 26-04's windows has a different problem, and should solve that one
first.

**Not authorized.** See §2.6. Name the control.

## 3.3 The architectures

**Common deployment --- inspection without transport governance:**

 Branch users
 |
 | static router: no application steering, no QoS,
 | no path health monitoring, no failover, no per-app telemetry
 |
 Local internet breakout (DIA)
 |
 SASE PoP — SWG / CASB / FWaaS / ZTNA
 |
 Cloud services · agency applications · internet

**With a branch-edge policy layer:**

 Branch users
 |
 | branch edge: application-aware steering, QoS,
 | continuous path health measurement, sub-second failover,
 | per-application path telemetry
 |
 DIA (primary) —— second circuit or LTE/5G (secondary)
 | |
 +------------------------+
 |
 SASE PoP — SWG / CASB / FWaaS / ZTNA
 |
 Cloud services · agency applications · internet

The second diagram is not more secure than the first at the PoP. It is
governed and measurable between the user and the PoP, which the first is
not --- and that stretch is the most variable, most user-proximate and
least instrumented part of the path.

## 3.4 Procurement note

If an agency does acquire a branch-edge layer as part of a SASE
procurement, the FedRAMP status of the candidates is not uniform, and it
is worth knowing before a requirement is written. As of this revision:
Palo Alto Networks' Network Security Platform (including Prisma Access,
Prisma SASE and Prisma SD-WAN) holds FedRAMP High (19 December 2024) and
a DoD IL5 provisional authorization; Zscaler ZIA and ZPA hold FedRAMP
High (1 August 2022); Netskope GovCloud holds FedRAMP High (9 January
2024); **Cisco Meraki for Government, including its SD-WAN capability,
holds FedRAMP Moderate (25 February 2025)** --- not High. Impact levels
for Cisco Umbrella for Government and Cisco SD-WAN for Government could
not be verified for this revision.

# 4. Legacy protocols on proxied and re-routed paths

This section was substantially wrong in version 1.0. The phenomenon it
describes is real; the mechanisms it gave were not.

## 4.1 What actually breaks

Long-lived, stateful sessions do fail more often when an enforcement
point sits in the path and when the path itself changes. They fail for
these reasons:

- **Connection resets and proxy idle timeouts.** An enforcement point
 that terminates and re-originates connections holds state on both
 sides and reaps idle connections on its own schedule. A database
 connection pool or a thick client that assumes an indefinitely idle
 connection stays open will find it closed.
- **End-to-end mutual TLS and certificate pinning.** A client that
 pins a server certificate, or a protocol requiring mutual TLS end to
 end, cannot tolerate an inspecting proxy. This is a genuine
 incompatibility, not a tuning problem.
- **Applications that assume a stable client source address.** Some
 legacy applications key session state, licensing or authorization to
 the client IP. Behind a SASE PoP the client presents the PoP's
 address, and it may present a different one after a PoP change.
- **Protocols the enforcement point cannot parse.** Non-HTTP protocols
 may be passed through untouched, blocked, or handled by a generic
 proxy that behaves differently from the endpoints' expectations.
- **Path changes that alter the effective MTU or reorder packets**,
 which surface as throughput collapse rather than as an outage and
 are correspondingly hard to diagnose.

**What does not happen:** a path change does not cause TCP
sequence-number discontinuity. Sequence numbers are properties of the
two endpoints and are unaffected by the route packets take. Version 1.0
asserted the opposite as fact, in the body and again in the glossary,
and built on it the claim that "a proactive SD-WAN switch preserves the
TCP session; a reactive static-router reroute terminates it." Neither is
true as a general statement. A re-route that changes the client's
*apparent source address* --- because the new path egresses through a
different NAT --- will break established connections; a re-route that
does not change the source address the server sees generally will not.
**The distinction is address continuity, not sequence continuity**, and
stating it correctly makes the case for deterministic egress policy
stronger rather than weaker.

## 4.2 Kerberos: the real dependencies

Version 1.0 claimed that Microsoft KDCs record the client IP in the
ticket, validate it on subsequent requests, and therefore reject tickets
when SNAT at a SASE PoP changes the apparent source address --- a
failure mode it called "the Kerberos source IP binding problem" and made
the subject of a formal recommendation.

**This does not occur under Microsoft's defaults.** RFC 4120 permits but
does not require the client address field (`caddr`) in a ticket, and
Windows does not use it: `KdcUseClientAddresses`, which controls whether
IP addresses are added in the TGS reply, defaults to **0**, and
`KdcDontCheckAddresses`, which controls whether addresses are checked,
defaults to **1**. The client-side `ClientIpAddresses` setting defaults
to false. Windows KDCs neither populate nor enforce the field. This is
precisely why Kerberos works across NAT in ordinary deployments. Nor is
address checking a KDC function in the general case --- under RFC 4120
it is the application server that would compare addresses, if anyone
did.

Two further corrections. Version 1.0 stated elsewhere in the corpus that
Active Directory expects sub-5-millisecond round trips to a domain
controller and that a "5 ms Kerberos timeout" is the failure threshold.
**No such requirement exists.** The 5-minute figure it appears to derive
from is Kerberos clock-skew tolerance (`SkewTime`, default 5 minutes)
--- a factor-of-60,000 conflation. And Kerberos default lifetimes are
generous, not tight: a ticket-granting ticket lasts 10 hours with 7-day
renewal, and service tickets 600 minutes. Kerberos tolerates latency and
path change far better than its reputation suggests.

**What genuinely requires reachable domain controllers** is a short,
specific list, and it is the list an agency should design around:

1. **Initial TGT acquisition at logon**, including the first sign-in on
 a device.
2. **Group Policy retrieval from SYSVOL.**
3. **Password changes**, including expiry-forced changes, which cannot
 be satisfied from cached credentials.
4. **Microsoft Entra hybrid join registration**, for which Microsoft
 documents a requirement for network line of sight to on-premises
 domain controllers.

A branch on local internet breakout whose domain controllers sit in a
datacenter reaches them over whatever private path or ZTNA connector the
agency has provided --- not over the SASE PoP's internet egress --- so
an architecture that overlooks that path breaks logon, policy and
password change while leaving cloud applications working. That asymmetry
is what produces the characteristic report of "everything works except
signing in," and it is a design question worth naming explicitly at
every branch.

**Corrected remediation.** The audit that version 1.0 recommended asked
the wrong question. The right one has three parts: (a) confirm whether
any hardening baseline applied in the estate has set
`KdcUseClientAddresses` or `KdcDontCheckAddresses` away from their
defaults --- if so, that non-default setting, not the network, is the
exposure and it should be reconsidered; (b) confirm that every branch
has a defined, monitored path to a domain controller for the four
operations above; and (c) where applications key state to a client
source address, establish a deterministic egress policy so those
applications see a stable address. Only (c) is a transport-layer remedy,
and it is the one a branch-edge policy layer actually delivers.

## 4.3 Round trips, decomposed honestly

Chatty database access over a long path is a real problem and the
arithmetic is worth doing --- carefully, because version 1.0's
conclusion does not follow from its own inputs.

Take a branch office with one-way latency of 20--30 ms to its inspection
or breakout point and 40--60 ms from there to the cloud region.
Round-trip time for a single query is then roughly **120--180 ms**. A
transaction that issues 30 sequential queries incurs **3.6--5.4
seconds** of purely network-attributable latency before any database
work. That much is right, and it is the reason chatty applications feel
broken from branch offices.

Version 1.0 then claimed that "SD-WAN-optimized direct-to-SASE-PoP
routing at 25 ms RTT" reduces the same transaction to 750 ms --- **a 6×
improvement.** That cannot happen. The path has two legs, and a
branch-edge device operates on the first one only. The leg from the PoP
to the cloud region is set by geography and by the provider's backbone;
no branch appliance deletes it. Reaching 25 ms round trip end to end
would require the cloud region to be roughly as close as the PoP.

The honest decomposition:

 ----------------------------------------------------------------------------------
 Component Baseline Best case What changes it
 (one way) with 
 branch-edge 
 policy + 
 nearer 
 breakout 
 ------------------------ ------------ ------------- ------------------------------
 Branch → enforcement 20--30 ms 5--15 ms Local breakout to a nearer
 point PoP; better link selection

 Enforcement point → 40--60 ms 40--60 ms Cloud region choice; provider
 cloud backbone. **Not** the branch
 device

 **Round-trip total** **120--180 **90--150 
 ms** ms** 

 **30-query transaction** **3.6--5.4 **2.7--4.5 **≈20--25% improvement**
 s** s** 
 ----------------------------------------------------------------------------------

*Inputs stated so they can be replaced: 30 sequential round trips per
transaction; one-way leg latencies as shown; no application change.
Substitute measured values from your own estate.*

Twenty to twenty-five percent is worth having, and it is what the
intervention delivers. The larger number is elsewhere: **reducing the
transaction from 30 sequential round trips to 3 --- through batching,
stored procedures, or a server-side API --- takes the same transaction
to 270--540 ms, roughly an order of magnitude.** Network work and
application work are not competing options here; the application change
dominates, and any business case that offers transport modernization as
the remedy for chattiness invites a reviewer to point that out.

There is one case where the network intervention is much larger than
25%, and it should be stated because it is the case many agencies are
actually in: an architecture still hairpinning cross-country to a
central access point before reaching a cloud region has a first leg of
40--60 ms one way rather than 20--30. Replacing that with local breakout
to a nearby PoP is the DIA change this paper takes as given --- and it
is where most of the available latency recovery already happened. The
branch-edge layer this paper argues for is worth roughly the increment
in the table above, plus the governance and telemetry properties in
§3.1, which are the actual reason to do it.

# 5. Token-based access and continuous verification

## 5.1 What the policy actually says

Token-based authentication is the identity and access mechanism for
modern federal applications: OAuth 2.0 and OpenID Connect tokens from
agency identity providers and Login.gov, SAML assertions from federation
services, and session tokens issued by ZTNA enforcement points. OMB
M-22-09 requires phishing-resistant multi-factor authentication and
identity-based access policy rather than network-perimeter trust.
Executive Order 14028, as amended by EO 14306, is the instrument M-22-09
implements.

**M-22-09 mandates no token lifetime.** Version 1.0 twice asserted "the
15-minute token refresh cycles mandated by M-22-09" and built its Zero
Trust prerequisite claim on it. The memorandum contains no such mandate;
its only treatment of reauthentication is permissive and risk-triggered.
A reviewer who checks this finds nothing, and the section that depends
on it falls.

**What does set intervals** is NIST SP 800-63B-4, final 31 July 2025,
which specifies reauthentication at 30 days for AAL1, 24 hours (or one
hour of inactivity) for AAL2, and 12 hours (or 15 minutes of inactivity)
for AAL3. On the platform side, Microsoft issues access tokens with a
one-hour default lifetime, extended to as much as 28 hours in Continuous
Access Evaluation sessions, where revocation is driven by critical-event
signals rather than by expiry --- with up to 15 minutes of event
propagation latency, though IP-location policy enforcement is immediate.

That is a more useful frame than v1.0's, and it changes the argument's
shape. Zero Trust did not abolish sessions; it made them revocable. The
design question at the branch is not how to survive a 15-minute refresh
cycle that does not exist. It is whether the agency can see and revoke a
session it has issued, and whether the signals that drive revocation
reach the enforcement point.

## 5.2 Where transport actually matters here

Authentication and token exchange flows are small, latency-sensitive and
on the critical path of every user interaction. Two properties of a
branch-edge policy layer bear on them directly:

- **Queue priority.** Small authentication exchanges sharing an
 unmanaged queue with a backup job wait behind it. Classifying and
 prioritizing identity traffic at the point where it enters the
 constrained link is straightforward, cheap, and impossible without a
 device there.
- **Deterministic egress.** Conditional access and risk policies
 frequently evaluate network location. An egress address that changes
 unpredictably between sessions produces both false risk detections
 and gaps in the location signal the policy depends on. A stable,
 documented egress presentation per branch makes those policies mean
 what they are written to mean.

Version 1.0 also claimed "sub-10ms path selection decisions by SD-WAN
policy engines" and specific token-relay degradation figures of 250--400
ms. No source supports either. They are removed. Where an agency needs
these numbers, §6 gives the method to measure them.

# 6. Cost: how to measure it in your own estate

Version 1.0 asserted that hairpin routing without SD-WAN generates
12--18% additional CPU utilization on application servers for a
5,000-user agency, translating to \$200,000--\$400,000 in annual cloud
overspend, and then directed agencies to use 12--18% as "the baseline
adjustment factor" in cloud migration business cases. There was no
derivation, no measurement, no instance count and no compute rate behind
those figures, and two of the four mechanisms said to produce them
depended on the Kerberos and TCP claims corrected in §4.

**The figures are withdrawn.** They are replaced with the method that
would have produced defensible ones.

## 6.1 The mechanisms worth measuring

Four effects plausibly move compute cost, and all four are measurable:

1. **Connection re-establishment.** Each re-established session costs a
 TLS handshake, an authentication exchange and application session
 setup, on both sides. Measure: server-side new-connection rate
 versus active-session count, and the ratio of connection setups to
 transactions.
2. **Retry behaviour after a path event.** Clients that reconnect
 immediately and simultaneously produce a burst of server-side
 connection handling. Measure: connection-rate spikes correlated with
 WAN path events, and their duration.
3. **Authentication replay.** Failed token exchanges generate repeat
 cycles at the identity provider. Measure: authentication request
 volume versus successful authentication count.
4. **Cache invalidation.** Dropped sessions discard application caches,
 forcing cold execution. Measure: cache hit ratio and query execution
 time distribution around session-drop events.

## 6.2 The measurement

The comparison that produces a defensible number is a **paired branch
study**, not a model:

- Select two branches with comparable user counts and application mix.
- Instrument both for 30 days: WAN path events, application server CPU
 and new-connection rate, identity provider authentication volume,
 database cache hit ratio, and help desk tickets tagged by
 application.
- Deploy the branch-edge policy layer at one branch only.
- Instrument both for a further 30 days.
- The difference in the post-period, adjusted for the pre-period
 difference, is your effect size. It is agency-specific, defensible,
 and it is the number to put in a business case.

## 6.3 A worked example --- every input stated

To show the shape of the arithmetic, not to supply a result:

> Assume 5,000 branch users; 40 application server instances at
> \$0.192/hour on-demand equivalent, running continuously; and a
> measured post-deployment reduction in average CPU utilization of
> **X%** attributable to reduced connection churn.
>
> Annual compute at baseline: 40 × \$0.192 × 8,760 = **\$67,277**. If
> reduced utilization permits proportional instance reduction, annual
> saving ≈ \$67,277 × X.
>
> At X = 10%, that is **\$6,728/year** --- an order of magnitude below
> what version 1.0 asserted, on an instance count and rate that are at
> least stated.

The example is deliberately unflattering. Compute savings alone rarely
justify a branch-edge programme, and a business case resting on them
will not survive a budget examiner who asks for the instance count.
**The defensible case is built on the other four cost categories** ---
help desk volume, circuit over-provisioning, incident triage of
architecture-induced false positives, and the risk cost of unevidenced
control assertions --- each of which the agency can measure from data it
already holds, and each of which is larger than the compute term in most
estates. Version 1.0 offered figures for all of these too; none were
sourced, and all are withdrawn.

## 6.4 What to stop doing

Do not put a routing-attributable percentage into a TCO model on the
authority of a white paper --- including this one. Put in a measured
figure with its measurement method attached, or put in a range with the
assumption stated and marked as an assumption. A cloud migration
business case that omits routing architecture as a cost variable is
incomplete; one that includes an invented figure for it is worse,
because it will be checked.

# 7. Sequencing, and the phase inversion problem

## 7.1 The dependency is technical

Federal modernization proceeds through phases whose ordering reflects
technical dependency, not policy mandate. No OMB memorandum, CISA
directive or executive order specifies the sequence below. Version 1.0
implied otherwise, requiring "Phase 2 attestation as a precondition for
Phase 3 authorization" as though the requirement were external. It is
not. The argument has to stand on engineering, and it does.

 ------------------------------------------------------------------------
 Phase Activity Dependency
 ------- ---------------------------- -----------------------------------
 0 Assessment and inventory Document current WAN architecture
 as part of the baseline, including
 whether branch transport is
 governed and measurable

 1 Identity and access Can proceed in parallel with 2;
 modernization must precede ZTNA enforcement in 4

 2 Network and transport TIC 3.0 use case adoption, local
 modernization breakout, branch-edge policy layer,
 telemetry to CISA

 3 Cloud workload migration Needs 2 for a performance and cost
 baseline that can be attributed

 4 Zero trust continuous Needs 1 for identity, 2 for
 verification observable transport, 3 for
 protected resources
 ------------------------------------------------------------------------

## 7.2 Phase inversion

**Phase inversion** is the failure mode in which an agency completes
cloud migration before it can govern and measure the transport its users
reach the cloud over.

The consequence is not primarily performance. It is **attribution**.
Post-migration, application response times and cloud bills are both
worse than the business case assumed. The agency has cloud metrics and
it has application metrics; it does not have per-application transport
metrics, because those require the device it did not deploy. The cost is
therefore attributed to the only thing being measured --- the cloud ---
and the remedies chosen follow the attribution: more instances, more
caching, read replicas, a content delivery layer. Each raises cloud
spend, which strengthens the "cloud is too expensive" narrative, which
generates repatriation pressure. The transport contribution is never
identified, because it never appears in the data anyone is looking at.

The self-reinforcing part is what makes this worth naming. The remedy
for a misattributed cost raises the cost that was misattributed.

## 7.3 What to do if you are already inverted

Most agencies reading this have already migrated. The correction is not
to unwind anything:

1. **Instrument before you buy.** Deploy transport measurement at a
 representative sample of branches --- many agencies can obtain
 per-path latency and loss data from existing infrastructure without
 new capital. Establish what fraction of application latency is
 transport-attributable *before* proposing a transport programme.
2. **Re-baseline the attribution.** Take the last four quarters of
 cloud spend growth and test how much correlates with user-experience
 complaints and help desk volume by branch rather than with workload
 growth.
3. **Fix chattiness first where it dominates.** §4.3's arithmetic will
 identify applications where an application change returns more than
 any transport change can.
4. **Then scope the branch-edge programme** to the branches and
 applications where the measurement says it pays, rather than to all
 branches on principle.

That sequence produces a business case a reviewer cannot dismantle,
because every number in it came from the agency's own estate.

# 8. Recommendations

**1. Adopt a TIC 3.0 use case and document the mapping.** Agencies with
branch users reaching cloud services should adopt the **Branch Office**
and **Cloud** use cases as the architectural pattern, and document the
mapping from each required security capability to the mechanism
implementing it and the evidence that mechanism produces. There is no
"SASE use case"; do not cite one. Read the current use-case PDFs and
cite versions from their cover pages.

**2. Specify the branch-edge policy layer explicitly in SASE
acquisitions.** Cloud-delivered inspection without a branch-edge policy
layer leaves the branch-to-PoP path ungoverned and unmeasured.
Requirements should state application-aware steering, continuous path
health measurement, sub-second failover, QoS enforcement, deterministic
egress presentation, and per-application path telemetry exportable to
the agency's log pipeline. State this as an architecture requirement the
agency has decided on --- **not** as a CISA mandate, because it is not
one. Check FedRAMP impact levels before writing the requirement (§3.4);
they are not uniform across candidates.

**3. Treat sequencing as a documented technical dependency.** Investment
review boards should ask, for any cloud migration proposal, what the
transport baseline is and how post-migration cost will be attributed
between workload and transport. An agency that cannot answer should
expect the phase inversion pattern in §7.2 and should say so in the risk
section rather than discovering it later.

**4. Measure the cost; do not import it.** Use §6.2's paired-branch
method. Any figure entering a TCO model should carry its measurement
method or be labelled an assumption. Withdraw any figure sourced from
version 1.0 of this paper.

**5. Make application-to-path routing policy an authorization
artifact.** Where an agency asserts SC-7, SI-4, AC-17 or CA-7 for a
system whose users reach it over branch transport, the package should
document the path assignment for each application class, the QoS policy
at the branch edge, the failover policy and its measured recovery time,
and the monitoring mechanism producing path performance data. Where no
such mechanism exists, that should be stated in the package as a known
limitation rather than left implicit. Note that under OMB M-26-14 the
transport telemetry question is now also a logging-maturity question.

**6. Audit the real Active Directory dependencies.** Replacing version
1.0's Kerberos SNAT recommendation, which rested on a mechanism that
does not occur: (a) verify whether any hardening baseline in the estate
has moved `KdcUseClientAddresses` or `KdcDontCheckAddresses` off their
defaults, and reconsider it if so; (b) confirm every branch has a
defined, monitored path to a domain controller for initial TGT
acquisition, SYSVOL/Group Policy retrieval, password change, and hybrid
join registration; (c) inventory applications that key session state or
authorization to a client source address, and establish deterministic
egress for them. Complete (b) before migrating any Active
Directory-dependent application, because it is the dependency that
breaks logon while leaving cloud applications working.

# 9. Glossary

**AC-17 (Remote Access).** NIST SP 800-53 Rev 5 control requiring
establishment, documentation, monitoring and control of remote access
methods.

**CLAW (Cloud Log Aggregation Warehouse).** CISA's log collection
capability for agency telemetry under the National Cybersecurity
Protection System cloud interface architecture, and the mechanism
through which agencies operating alternative TIC 3.0 architectures share
required telemetry. *Version 1.0 expanded this as "Comprehensive Log
Aggregation Warehouse," which is not the term. The expansion given here
should be confirmed against the current NCPS Cloud Interface Reference
Architecture before citation.*

**DIA (Direct Internet Access).** Local internet breakout at a branch
office, rather than backhauling internet-bound traffic to a central
access point. *Version 1.0 defined DIA as a "Defense Information Systems
Agency circuit." That is wrong twice: DISA is the Defense Information
Systems Agency, and DIA is the Defense Intelligence Agency. DISA's
transport network is DISN.*

**FedRAMP.** The federal authorization programme for cloud service
offerings, assessed against NIST SP 800-53 Rev 5. It governs the
security posture of the service, not the network path used to reach it.
Under the Consolidated Rules for 2026, "authorization" becomes
"certification" and impact levels become Certification Classes A--D,
with mandatory adoption on 1 January 2027. No current FedRAMP Moderate
control count is citable following Notice 0013 (16 June 2026).

**Hairpin routing.** Routing that sends traffic to a central point and
back before it reaches its destination, even where a shorter path
exists. The TIC 1.0/2.0 model that TIC 3.0 permits agencies to leave.

**Kerberos.** Network authentication protocol (RFC 4120) using symmetric
cryptography and a Key Distribution Center. Default Active Directory
ticket lifetimes are 10 hours for a ticket-granting ticket with 7-day
renewal and 600 minutes for service tickets; clock-skew tolerance is 5
minutes. **Windows KDCs do not populate or check the ticket
client-address field by default**, so Kerberos operates normally across
NAT.

**MTIPS (Managed Trusted Internet Protocol Services).** GSA-contracted
managed TIC access point service. Now delivered under EIS; Networx
expired 31 May 2026 and WITS 3 expired 28 February 2026.

**Phase inversion.** The failure mode in which cloud migration completes
before transport is governed and measurable, so that
transport-attributable cost is absorbed as cloud cost and the remedies
chosen raise the cost that was misattributed. (§7.2)

**SASE (Secure Access Service Edge).** An industry architecture
converging network security functions --- secure web gateway, cloud
access security broker, firewall-as-a-service and zero trust network
access --- into a cloud-delivered service at distributed points of
presence, generally alongside SD-WAN. *CISA has not published a SASE
definition this paper could verify, and does not mandate SASE or
SD-WAN.*

**SD-WAN (Software-Defined Wide Area Networking).** Branch-edge WAN
control providing application-aware routing policy, multi-link
aggregation, continuous path health measurement, QoS enforcement and
per-application telemetry.

**SC-7 (Boundary Protection) / SI-4 (System Monitoring).** NIST SP
800-53 Rev 5 controls covering monitoring and control of communications
at system boundaries, and monitoring to detect attacks and indicators of
attack. Both are asserted at the branch when the branch is an external
boundary.

**SNAT (Source Network Address Translation).** Replacement of a packet's
source address by a gateway. Relevant here because applications that key
state to a client address, and policies that evaluate network location,
are affected by egress address changes --- **not** because it breaks
Kerberos.

**TDS (Tabular Data Stream).** Microsoft SQL Server's client-server
protocol over TCP 1433. Stateful and session-oriented; sensitive to
connection resets and proxy idle timeouts, and to source-address changes
where the application or path depends on address continuity.

**TIC 3.0.** The capability-based TIC model authorized by OMB M-19-26
(12 September 2019), which rescinded M-08-05. Descriptive rather than
prescriptive: it mandates no technology, vendor or topology.

**ZTNA (Zero Trust Network Access).** Per-session, per-application
access decisions based on verified identity, device posture and context
rather than network location.

# 10. Sources and verification status

Every external claim in this paper falls into one of three categories.
Claims in the third category are marked in the text wherever they
appear.

**Confirmed against a primary source for this revision**

- OMB M-19-26, *Update to the Trusted Internet Connections (TIC)
 Initiative*, 12 September 2019 --- including its rescission of
 M-08-05, M-08-16, M-08-27 and M-09-32.
- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust
 Cybersecurity Principles*, 26 January 2022 --- operative; FY2024
 deadlines expired 30 September 2024; no successor.
- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and
 Network Visibility*, 22 May 2026 --- rescinds M-21-31; five-level
 maturity model; retention six months searchable / one year
 retrievable; plans due 90 days after CISA's Logging Reference
 Architecture.
- CISA BOD 26-04, *Prioritizing Security Updates Based on Risk*, 10
 June 2026 --- revokes BOD 22-01 and BOD 19-02.
- CISA ED 26-03, *Mitigate Vulnerabilities in Cisco SD-WAN Systems*,
 26 February 2026.
- Executive Order 14028 (12 May 2021), as amended by Executive Order
 14306 (6 June 2025).
- NIST SP 800-53 Rev 5 (current; Release 5.2.0, 27 August 2025). There
 is no Revision 6.
- NIST SP 800-207, *Zero Trust Architecture* (11 August 2020) ---
 conceptual and unrevised --- and **NIST SP 1800-35, *Implementing a
 Zero Trust Architecture* (final 10 June 2025)**, the operative
 federal implementation guidance, which version 1.0 did not cite.
- NIST SP 800-63B-4, *Digital Identity Guidelines: Authentication and
 Lifecycle Management*, final 31 July 2025 --- reauthentication
 intervals as cited in §5.1.
- Microsoft Kerberos KDC registry configuration:
 `KdcUseClientAddresses` default 0; `KdcDontCheckAddresses` default
 1; `SkewTime` default 5 minutes. Active Directory schema defaults:
 `Max-Ticket-Age` 10 hours, `Max-Renew-Age` 7 days, service ticket
 600 minutes.
- Microsoft Continuous Access Evaluation: 1-hour default access token
 lifetime, up to 28 hours in CAE sessions, up to 15 minutes event
 propagation latency, immediate IP-location enforcement.
- Microsoft Entra hybrid join: documented requirement for network line
 of sight to on-premises domain controllers.
- FedRAMP Consolidated Rules for 2026: optional early adoption 4 July
 2026, mandatory adoption 1 January 2027; Certification Classes A--D;
 System Security Plan replaced by Certification Package Overview and
 Security Decision Record; agency POA&Ms explicitly retained. FedRAMP
 Notice 0013, 16 June 2026, removing FedRAMP-assigned control
 parameters.
- FedRAMP impact levels cited in §3.4 for Palo Alto Networks, Zscaler,
 Netskope and Cisco Meraki for Government.
- GSA: EIS ceiling and option periods; Networx expiry 31 May 2026;
 WITS 3 expiry 28 February 2026; 214 agencies transitioned as of 31
 July 2026.
- RFC 4120, *The Kerberos Network Authentication Service (V5)*, July
 2005.

**Confirmed as not existing**

- *Secure Access Service Edge (SASE) Roadmap for Federal Civilian
 Agencies* (CISA, 2023), cited as reference \[7\] in version 1.0. No
 document of that title appears in CISA's own enumeration of TIC and
 zero trust guidance.
- A TIC 3.0 "SASE Use Case." CISA has published four use cases:
 Traditional, Branch Office, Remote User and Cloud.

**Could not be verified for this revision --- do not rely on these
without opening the source**

1. **TIC 3.0 document version numbers and dates.** cisa.gov refused
 automated retrieval. Version 1.0's "Program Guidebook, July 2025,
 Version 1.2" and "Branch Office Use Case, Version 3.0" are both
 unconfirmed and at least the first appears misattributed. Read
 versions off the cover pages.
2. **CISA, *The Journey to Zero Trust --- Using Secure Access Service
 Edge in a Modern TIC 3.0 Solution*, reported 24 June 2026.**
 Existence reported; text not retrieved. Nothing here rests on it,
 and it should be read before this paper is acted on.
3. **CLAW expansion and current role.** "Cloud Log Aggregation
 Warehouse" is the expansion used here; confirm against the current
 NCPS Cloud Interface Reference Architecture.
4. **Historical TIC access-point reduction figures** (the "4,000 to
 under 100" range in circulation). No primary source confirmed;
 omitted from §2.1 rather than repeated.

Two further cautions on claims *not* made here because they could not be
supported: this paper does not state that EINSTEIN has been sunset or
replaced (no primary source confirms a sunset date), and it gives no
Starlink or LEO latency figure (no vendor-published figure could be
retrieved; SpaceX's 2026 S-1 defines "low-latency" as under 70 ms and
publishes no measured value).

# Appendix A --- Change log from version 1.0

Recorded so that anyone holding version 1.0 can see exactly what changed
and judge the revision.

 ------------------------------------------------------------------------
 Location in What it said Why it changed
 v1.0 
 -------------- ----------------------- ---------------------------------
 Header "UNCLASSIFIED // FOUO FOUO and TLP:CLEAR contradict
 --- TLP: CLEAR"; each other; FOUO is a legacy
 "Prepared For: Agency marking superseded by CUI; and
 Review --- Federal the header implied agency
 CIOs, CISOs..." sponsorship for solo-authored
 analysis. Replaced with an author
 byline and an explicit status
 note.

 Throughout, "DIA circuit (Defense DIA is Direct Internet Access.
 §3, Glossary Information Systems DISA is the Defense Information
 Agency circuit)... Systems Agency; DIA is the
 government-contracted Defense Intelligence Agency;
 MPLS or dedicated DISA's network is DISN. §3 was
 fiber" rewritten around local internet
 breakout.

 Exec summary, "CISA's SASE Roadmap is The cited document does not
 §2.3, §3.3, explicit: SD-WAN is a exist. Two of five findings, one
 Rec. 1, Rec. structural component of subsection and one recommendation
 2, ref. \[7\] SASE" rested on it. Replaced with the
 evidence argument in §2.4.

 §2.3, §7.4, "TIC 3.0 SASE Use Case" No such use case. Replaced with
 Rec. 1 Branch Office and Cloud.

 §2.1, §2.3, "Program Guidebook Unverifiable; the July 2025 /
 refs (July 2025, Version v1.2 designation appears to
 \[5\]\[6\] 1.2)"; "Branch Office belong to the Cloud Use Case.
 Use Case, Version 3.0" Documents now cited by name only,
 with a note to read versions from
 the cover page.

 §2.2 "approximately 325 325 is the Rev 4 Moderate figure;
 security controls" Rev 5 was 323; and Notice 0013
 (16 June 2026) removed most
 FedRAMP-assigned parameters with
 no revised counts published.
 Count removed.

 §4.1, §4.3, Kerberos client IP Does not occur under Microsoft
 Rec. 6 recorded in the TGT and defaults (`KdcUseClientAddresses`
 validated by the KDC; 0, `KdcDontCheckAddresses` 1).
 SNAT at a PoP causes Replaced with the four real DC
 ticket rejection dependencies and a corrected
 audit.

 §4.1, Glossary "a path re-route that TCP sequence numbers are endpoint
 (TDS) causes sequence number properties, unaffected by path.
 discontinuity triggers Replaced with the real failure
 session termination" modes; the distinction is address
 continuity, not sequence
 continuity.

 §4.2 30 queries × 150 ms = A branch-edge device operates on
 4,500 ms, reduced to the first leg only; the
 750 ms with SD-WAN --- PoP-to-cloud leg is set by
 "6×" geography. Replaced with the
 decomposition in §4.3 (≈20--25%)
 and the observation that
 application chattiness dominates.

 §5.1, §5.3 "the 15-minute token M-22-09 mandates no token
 refresh cycles mandated lifetime. Replaced with SP
 by M-22-09" 800-63B-4 reauthentication
 intervals and Microsoft CAE token
 behaviour.

 §5.3 "Sub-10ms path Unsourced. Removed.
 selection decisions"; 
 token relay 
 "250--400ms" 

 §5.4, §6.1, 12--18% CPU; No derivation, measurement,
 Rec. 4 \$200,000--\$400,000 instance count or rate. All
 annual; help desk, withdrawn and replaced with §6's
 over-provisioning, measurement method and a worked
 incident and MTIPS example with stated inputs.
 figures 

 §7.2, §7.4, Phase 2 as a No federal policy specifies the
 Rec. 3 policy-required sequence. Reframed as a technical
 precondition for Phase dependency, which is sufficient.
 3 

 Ref. \[3\] OMB M-21-31 Rescinded 22 May 2026 by M-26-14.
 Replaced.

 Glossary "Comprehensive Log Not the term; "Cloud Log
 (CLAW) Aggregation Warehouse" Aggregation Warehouse," flagged
 for confirmation.

 Throughout No treatment of NIST SP Final 10 June 2025 and now the
 1800-35 operative federal zero trust
 implementation guidance. A paper
 arguing about zero trust
 implementation that omits it
 invites the obvious question.

 §3.2 SD-WAN "does not Overstated. A branch appliance is
 introduce new risk... a real attack surface --- ED
 this is improved 26-03 (26 February 2026)
 security posture" concerned exactly that --- and
 the honest answer is a
 vulnerability management answer,
 now under BOD 26-04.

 Exec summary, SD-WAN absence framed Not supportable, and the most
 §2 as a compliance gap; damaging claim in v1.0. TIC 3.0
 agencies mandates no technology. Reframed
 "misrepresenting their as an evidence gap in §2.4.
 compliance posture" to 
 Congress and IGs 
 ------------------------------------------------------------------------

**One thing version 1.0 got right and this revision keeps in full:**
§2.2's argument that FedRAMP does not constrain network routing, and
that an agency refusing SD-WAN on FedRAMP grounds should be asked to
name the control. That section was correct, is well-made, and is the
most immediately useful page in the paper.
