# Trinzic Alone, or Trinzic Plus Cloud DDI? — Explainer — narration script (practice copy)

## Slide 1 — Trinzic Alone, or Trinzic Plus Cloud DDI?

Welcome. This is research from the Federal Modernization Workbook's Research section, and it's still under review. It answers a question architects hit as soon as workloads move to the cloud. If we already run Infoblox Trinzic appliances on premises, can they handle DNS, DHCP and address management for AWS, Azure and Google Cloud on their own? Or do we need some form of cloud-based DDI as well? It's written for someone still learning DDI, so we'll start with the vocabulary, look at where Trinzic stops at the cloud edge, then weigh three options and a decision table. Every fact comes from vendor or government documentation opened on October twenty-second, 2026, and recommendations are labeled as design guidance. Let's start with the words.

## Slide 2 — The words you need before we start

A few words first, because the rest of the deck leans on them. DDI means DNS, DHCP and IPAM: names, addresses handed out, and the record of who owns which address ranges. An Infoblox Grid is a set of appliances sharing one database, run from the Grid Master, which is also the only one that can sign zones with DNSSEC. Trinzic is the physical appliance, vNIOS is the same software as a virtual machine, and Universal DDI is Infoblox's cloud service. On the cloud side, think resolvers, endpoints and private zones that only linked networks can see. And the word to remember is split-brain: two systems each believing they own a name, and giving different answers. Avoiding it is the point of this deck. So what does Trinzic do well?

## Slide 3 — What Trinzic is, and what it does well on premises

On premises, a Trinzic Grid is the agency's DNS and DHCP servers plus its address record, all managed from the Grid Master. It does a lot well. DNS views give internal and outside clients different answers on purpose, DNS Firewall blocks bad names, DNSSEC signing is centralized, and DHCP runs as failover pairs. One caution: the default signing algorithm is RSA with SHA-1, which a federal deployment should change. This matters because Book 08 of the workbook argues for one DDI policy plane, a single system of record with cloud DNS managed as an overlay. On premises, the Grid fits that role, inside the agency's own boundary rather than as a FedRAMP cloud service. The open question is the cloud edge.

## Slide 4 — What Trinzic alone sees in the clouds, and can't control

At the cloud edge, Trinzic alone can see, but it can't control. It can discover cloud networks and virtual machines on a schedule, including GovCloud and Azure Government, and it can import cloud zones so on-premises clients resolve cloud names. But that import is one way, and edits made in NIOS get overwritten. It can't create or own a cloud private zone, manage cloud resolver rules, act as the outside authority for AWS VPC IPAM, or run DHCP for cloud subnets; the clouds hand out their own addresses. So, as an inference: in the cloud, Infoblox's job is DNS and IPAM, and the cloud's own resolver still answers cloud private zones. That leads to three options.

## Slide 5 — Option A: vNIOS members inside each cloud

Option A puts vNIOS members inside each cloud, as Grid members in high-availability pairs, usually in a shared-services hub. Signed zones stay signed, with the keys kept on the Grid Master. Workloads reach vNIOS in one of two ways. Either you point the network's DNS straight at vNIOS, which is simple, but in Azure it means vNIOS must forward Azure-private names back to Azure DNS. Or you keep the cloud's own resolver and forward chosen domains to vNIOS, so clients change nothing. One AWS caution: to resolve Route 53 private zones for other networks, forward to an inbound endpoint, not the built-in resolver address. And every vNIOS member is agency-operated, with no FedRAMP authorization covering it. Next, the cloud service.

## Slide 6 — Option B: the Grid joined to Universal DDI

Option B joins the Grid to Universal DDI, Infoblox's software-as-a-service control plane, while the Grid stays primary for its DNS data. What it adds is the one thing the others lack: it's the only documented Infoblox mechanism that writes back to cloud DNS. It syncs Route 53, Azure DNS and Google Cloud DNS both ways, and on commercial AWS it can be the outside authority for VPC IPAM. The limits are real, though. DNSSEC records aren't synced, some zones can't be created from the portal, and the Grid Master stays the recovery console. The government edition is FedRAMP Certified at Moderate, but with narrower cloud discovery, so confirm the details with Infoblox. Now the simplest option.

## Slide 7 — Option C: Trinzic alongside native cloud DNS

Option C keeps the Grid authoritative for agency zones and lets each cloud's native DNS own its own private zones. The two meet through conditional forwarding: a rule that says, for names ending in this domain, ask that server. The Grid forwards cloud domains inward to the cloud's endpoints, and each cloud forwards agency domains back to the Grid. Google recommends exactly this design. One fact to keep in mind: a Route 53 private zone asked from outside its linked networks resolves on the public internet instead. Addresses follow the same idea. The Grid owns the agency's blocks and hands each cloud a block, automated on commercial AWS and manual in GovCloud, Azure and Google. Whichever you pick, some rules apply.

## Slide 8 — The rules that prevent split-brain

Whatever option you pick, four rules keep split-brain away. First, every zone has exactly one writable owner, never two, and everything else forwards to it or holds a read-only copy. Decide ownership before you turn sync on, because sync overwrites. Second, divide the namespace by owner. For example, corp dot agency dot gov lives on the Grid, and aws dot corp dot agency dot gov lives in Route 53. Third, DNSSEC keys stay on the Grid Master or its hardware security module, and validation belongs on agency resolvers. Fourth, address authority stays on the Grid, with clouds getting delegated blocks so overlaps get caught. With those rules in place, here's how to choose.

## Slide 9 — Which option fits your agency? Design guidance

Here's the decision table, and every row is design guidance, not an endorsement. If you're mostly on premises with a small cloud footprint, Trinzic plus native cloud resolvers and conditional forwarding is the lowest-cost start. Hybrid with one cloud, add a vNIOS pair in a hub network so resolution stays local if the WAN fails. Multi-cloud at FedRAMP Moderate and below, add Universal DDI through Government Cloud, whether those workloads run in commercial regions or in GovCloud and Azure Government; there, confirm which features Infoblox supports first. And for FedRAMP High or Defense Impact Levels 4 and 5, stay with options A and C, because Infoblox's service is Moderate-only. In short: Trinzic plus native resolvers as the baseline, with vNIOS and Universal DDI added only where they earn their place.

## Slide 10 — Where this fits the workbook, and next steps

To close, where this fits. Book 08 of the workbook makes the vendor-neutral case, from split-brain to the policy plane, and the research deep dive on Infoblox DDI covers the platform itself. The decisions to take are which option for each cloud and impact level, one named owner for every zone, where DNSSEC keys live, and how address blocks reach each cloud. The next steps start with Infoblox: ask for the Government Cloud boundary and a feature matrix for government accounts. Then confirm Azure Government availability, size NIOS-X capacity if you want cloud forwarders, and test forwarding in both directions. This is research under review, not an endorsement by any federal agency. Thank you.
