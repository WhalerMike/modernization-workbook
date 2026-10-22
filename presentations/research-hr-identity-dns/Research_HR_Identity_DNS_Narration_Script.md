# DNS for HR-Driven Identity Across Clouds — Explainer — narration script (practice copy)

## Slide 1 — DNS for HR-Driven Identity Across Clouds

Federal HR 2.0, the program OPM runs, moves agencies' core HR records onto one Oracle platform. If an agency builds HR-driven identity on top of it, so that a hire in HR becomes an account and a departure removes one, the data crosses Oracle's cloud, Microsoft's cloud, the agency's own network, and possibly AWS. Every one of those hops starts with a DNS lookup. DNS, the domain name system, turns a name into a network address.

This explainer answers three questions. Which names must resolve where? What breaks? And when do you need private DNS or forwarding, instead of ordinary public DNS? It's built for architects still learning, so terms are defined as we go.

This is research under review. Every fact comes from sources opened on October twenty-second, 2026, mostly vendor documentation. A few Microsoft facts come from search excerpts of Microsoft Learn pages rather than full pages, and I'll say so when they come up. Where I drew a conclusion that no source states directly, I'll call it an inference. And recommendations are labeled program design guidance.

Sources: Research brief, DNS for HR-driven identity across Oracle, Microsoft, on-premises, VMware and AWS (verified Oct. 22, 2026), Method and Bottom line; the Federal Modernization Workbook's Book 03 Ch03 (OPM as the Federal HR 2.0 program owner); Book 08.

## Slide 2 — The HR-driven chain, end to end

Here's the chain end to end, as Microsoft's Oracle tutorial and the Federal Modernization Workbook's Book 03 describe it.

It starts in Oracle Fusion Cloud HCM, the HR system Oracle runs as a service. HCM means human capital management. Changes leave Fusion as extracts, or as Atom feeds, which are lists of recent changes that another program polls. In this pattern, the middleware pulls from Oracle.

The middleware is the program in the middle. Microsoft says it can run in Oracle Integration Cloud, called OIC, or in Azure as an Azure Function, a Logic App, or a Data Factory pipeline. It turns HR records into a standard format called SCIM and posts them to Microsoft Graph, Microsoft's main API, at an endpoint called bulkUpload. That's Entra's API-driven inbound provisioning.

The Entra provisioning service then writes the user into Entra ID. For users who still live in Active Directory, it hands the change to a provisioning agent: a small service on an on-premises server that makes outbound connections only, and writes into AD. Lifecycle Workflows then run joiner and leaver tasks on the hire and leave dates.

Notice the DNS pattern. Every arrow in the top row crosses a vendor's public name. Only the agent-to-AD hop needs internal DNS.

Sources: Microsoft Learn: Configure Oracle HCM for automatic user provisioning [S1], Perform bulkUpload [S5], On-premises application provisioning architecture [S6 (excerpt)], Plan cloud HR application to Entra user provisioning [S8 (excerpt)], Lifecycle workflows attribute sync [S11 (excerpt)]; Oracle, Working with Atom [S18]; Book 03 Ch05, Provisioning Services.

## Slide 3 — Almost every name is public and vendor-owned

That leads to the key idea of this talk. Almost every name in this path is public and owned by a vendor. The Fusion host, which looks like your environment's name, then dot f-a dot o-c-s dot oraclecloud dot com. Microsoft Graph and the Entra sign-in hosts. The provisioning agent's relay names. And the Amazon Connect names that contact-center agents' browsers use.

The agency's job is to resolve those correctly from every resolver a component can reach. A resolver is the DNS server a machine asks. The agency must never host or shadow those names in a private zone of its own. We'll see why on the failure slide.

Private DNS is needed, along with forwarding, which means one resolver passing a query to another that knows the answer, in only four places. One: names the agency owns, like AD domains and their service records, the middleware's evidence store, internal HR or identity APIs, and VMware hosts. Two: cloud private endpoints the middleware uses, such as a storage account behind Azure Private Link, which gives a cloud service a private address in your network. Three: cloud private zones that on-premises systems must read. Four: AWS interface endpoints with private DNS.

Everything else is ordinary public resolution.

Sources: Research brief, Bottom line items 1 and 2, citing Microsoft Learn [S2, S4, S10], Oracle [S20, S23], AWS [S27–S29, S31], Broadcom [S36]; the Federal Modernization Workbook's Book 08 Ch07 and Ch08; research_multicloud.md [prior-M S57].

## Slide 4 — What must resolve where

This table condenses the brief's what-must-resolve-where table. The full version is in the backup.

The HR middleware, if it runs as Azure Functions or Logic Apps Standard joined to a virtual network, resolves the Fusion host, Graph and sign-in publicly, through the agency's resolver. Its evidence store and key vault sit behind private endpoints, so it needs a linked private zone, or a resolver that forwards to Azure. Microsoft documents an app setting, WEBSITE_DNS_SERVER, for pointing the app at your own DNS server.

Lifecycle Workflow extensions run in Consumption Logic Apps, the multitenant kind. As an inference, they can reach only public names.

The provisioning agent resolves domain controller locator records internally, and Microsoft's relay and sign-in names publicly.

On-premises systems reach cloud private names by forwarding from the Grid, meaning the Infoblox appliances, to each cloud's inbound endpoint: an address inside the cloud network that accepts queries from outside. Fusion users on Oracle's private access still get Fusion's public DNS answer. A Lambda function in a VPC, a virtual private cloud, reaches agency APIs through an outbound rule to the Grid. And vCenter and ESXi need forward and reverse records, A and PTR, in the Grid.

Sources: Research brief §8, What must resolve where, and the sources in each row: Microsoft Learn [S2, S4, S4b (excerpt), S8 (excerpt), S11b (excerpt), S13–S15 (excerpts)]; Oracle [S20–S24]; AWS [S29, S30]; Broadcom [S36]; the Federal Modernization Workbook's Book 08 Ch07 and Ch08; research_multicloud.md [prior-M S31, S57].

## Slide 5 — Government clouds use different names

Next, the government clouds use different names, and getting this wrong fails quietly.

Microsoft Graph has a separate address per cloud. A GCC tenant, Microsoft's government community cloud, keeps using the worldwide endpoints: graph dot microsoft dot com, and login dot microsoftonline dot com. A GCC High tenant uses graph dot microsoft dot us, and login dot microsoftonline dot us. The higher government cloud has its own Graph host and the same dot-us sign-in. Microsoft says access tokens from one national cloud aren't interchangeable with another's.

The provisioning agent has its own list. In the public cloud, which GCC tenants also use, it reaches relay names under msappproxy dot net and servicebus dot windows dot net. In the U.S. Government cloud those become msappproxy dot us and servicebus dot usgovcloudapi dot net, with dot-us certificate-check names too.

The agent uses outbound port 443 for service traffic and port 80 for certificate revocation lists, and needs no inbound ports. Per Microsoft Learn, from search excerpts: public DNS for these names is a chain of CNAME records, you should avoid inline TLS inspection, meaning a proxy that decrypts the traffic, and the agent installs to the default Azure environment unless told otherwise.

So keep a per-cloud list of names, and test through the real egress path.

Sources: Microsoft Learn: Microsoft Graph national cloud deployments [S2]; Prerequisites for Microsoft Entra Cloud Sync, firewall and proxy requirements [S4]; Cloud sync troubleshooting [S4b (excerpt)]; On-premises application provisioning architecture [S6 (excerpt)]; Install the provisioning agent and Hybrid identity considerations for Azure Government [S7 (excerpt)].

## Slide 6 — Oracle: private access is routing, not DNS

Now Oracle, and a common mistake.

Oracle Fusion offers private access from on-premises, which Oracle describes as reaching your environment without going through the internet. It sounds like a DNS feature. It isn't. It's routing. Traffic goes over FastConnect, Oracle's private circuit, or a site-to-site VPN, into an Oracle virtual cloud network, a VCN. From there it goes through the VCN's Service Gateway to the Oracle Services Network's public IP ranges. You add an access rule for the VCN and turn off content acceleration, Oracle's caching. Neither Oracle page says anything about DNS. As an inference, the Fusion name keeps its public answer. So don't build a private zone for Fusion.

Second, Atom feeds. Oracle says Atom data can be periodically purged, and Microsoft warns that delaying Atom feeds can lose changes. As an inference, if the middleware loses DNS or internet access for longer than the purge window, HR events are lost. Middleware DNS is a correctness issue, not just uptime. Reconcile against full extracts.

Third, FedRAMP. The Marketplace lists Oracle Fusion Cloud at FedRAMP Moderate. Oracle's government cloud regions support private DNS zones, but public DNS isn't available there. Which Oracle environment hosts a given agency's tenant wasn't verified.

Sources: Oracle: OCI Fusion Applications, Securely Accessing Fusion Applications [S21]; Transit Routing for Private Access to Oracle Services [S22]; REST API for Fusion Cloud HCM, Working with Atom [S18]; US Government Cloud with FedRAMP authorization [S26]; Microsoft Learn, Oracle HCM provisioning tutorial [S1]; FedRAMP Marketplace products.json, record F1603257882 [S40].

## Slide 7 — Amazon Connect and VMware

Two more components: Amazon Connect, AWS's contact center service, and VMware.

Connect agents work in a browser, in the Contact Control Panel, and AWS says that traffic traverses the public network. AWS prefers a domain allowlist: the instance name under my dot connect dot aws, plus telemetry, participant and transport names, and media names for TURN, a relay that carries the call audio, on UDP port 3478. If agents' DNS can't resolve those TURN names, the softphone can't set up its media channel. So don't over-restrict DNS for agents.

In AWS GovCloud, Connect is available only in the US-West region. It uses names under govcloud dot connect dot aws, has no cross-partition integration with commercial regions, and lacks several features, including Customer Profiles, Cases and outbound campaigns.

AWS PrivateLink, which gives an AWS API a private address inside your network, covers only a subset of Connect APIs. As an inference, that helps workloads making API calls, not the agent or voice path. A Lambda function attached to a VPC can reach only that VPC unless you add NAT or interface endpoints.

VMware: a Broadcom knowledge article says changing vCenter's hostname or address runs forward and reverse DNS lookups, and the change is blocked if the name doesn't fully resolve. Keep those records right in the Grid.

Sources: AWS: Amazon Connect, Set up your network for the CCP [S27]; AWS GovCloud (US) User Guide, Connect Customer [S28]; Amazon Connect and interface VPC endpoints [S29]; AWS Lambda, Giving functions access to resources in a VPC [S30]; Broadcom KB 440783, VAMI hostname or IP change fails [S36].

## Slide 8 — The clouds disagree on precedence

Here's the subtle one. Suppose a cloud network has both a private zone and a forwarding rule for the same name. Which wins? The three clouds disagree.

In AWS, the Route 53 Resolver rule wins over the private hosted zone.

In Azure, a linked private DNS zone wins, and, per Microsoft Learn, the forwarding-ruleset rule is silently ignored.

In Oracle Cloud, the attached private views are checked before resolver rules. Once a view answers, evaluation stops, even if the answer is negative.

That word negative matters. A private zone can shadow a name. If the zone covers a name but has no record for it, it returns NXDOMAIN, which means the name doesn't exist, instead of asking anyone else. All three clouds document that behavior.

So, as an inference, the same zone and the same rule give different answers in each cloud. The only design that behaves the same everywhere is one owner per name. The Grid owns agency zones. Each cloud owns its own private zones. Everything else forwards to the owner. Never put a zone and a rule for the same name in one network, and test resolution from every origin, because a configuration that works in one cloud can fail in the next.

Sources: AWS, Route 53, Considerations when working with a private hosted zone [S25]; Microsoft Learn, Troubleshoot NXDOMAIN from an Azure Private DNS zone [S12 (excerpt)]; Oracle, OCI Private DNS [S23]; research brief, Bottom line 4 and failure mode F3.

## Slide 9 — How it breaks: seven failure modes

How does this break? Here are seven failures from the brief's table of sixteen. The full table is in the backup.

One, shadowing. Someone creates a private zone for a vendor's domain, say oraclecloud dot com, and every name not copied into it returns NXDOMAIN.

Two, silent fallback. A private endpoint name resolves to the public address, because a forwarding rule is missing or slow. Per a Microsoft Learn excerpt, Windows DNS servers that forward to Azure need a forwarder timeout above four seconds, or private records may resolve to public addresses.

Three, the Grid's own fallback. Infoblox documents that if Use Forwarders Only is off and the forwarders fail, the member falls back to resolving from the internet's root servers. As an inference, a failed forward can then return the public answer instead of failing.

Four, loops. Azure warns that a ruleset rule that targets an inbound endpoint must not be linked to the network where that endpoint lives.

Five, TLS name mismatch. Keep the public name in every connection string, because the service's certificate carries it.

Six, the wrong cloud's endpoints, as we saw on the government-cloud slide.

Seven, capacity. A Route 53 Resolver endpoint address handles about ten thousand queries per second, but as few as fifteen hundred with connection tracking. Size endpoints before each onboarding wave.

Sources: Research brief §6, failure modes F1, F4, F5, F6, F9, F10, F11: Microsoft Learn [S2, S10 (excerpt), S10b (excerpt), S12 (excerpt), S14b (excerpt)]; AWS [S25, S32]; Oracle [S23]; Infoblox NIOS 9.1, Specifying Forwarders [S37]; the Federal Modernization Workbook's Book 08 Ch02 and Ch10.

## Slide 10 — Hub, not mesh

With several clouds, how do you wire the forwarding? Every vendor documents a hub. None recommends a mesh.

Azure documents two hub designs: link one forwarding ruleset to every spoke network, or point the spokes at the hub's inbound endpoint. AWS shares Resolver rules from one account through Resource Access Manager. Oracle shares a view across networks in a region.

Here's some illustrative arithmetic. Take five environments: on-premises, Azure, AWS, Oracle Cloud and VMware. In a full mesh, each forwards directly to every other, so you need up to twenty one-way rule sets, five times four. With a hub, you need about five, one per environment pointing at the hub. As an inference, every extra path is one more place for the precedence, fallback and loop failures we just saw.

Where does Infoblox fit? The Grid is a natural hub for agency names. Each Grid member can have its own forwarders for a forward zone, and Infoblox's reference design puts vNIOS, its virtual appliance, in a shared-services hub network as a Grid member. The earlier multi-cloud research, labeled as design guidance, recommends a baseline of the Grid plus each cloud's native resolver, forwarding both ways, with customer-operated appliances for FedRAMP High workloads, because Infoblox's software-as-a-service offering is FedRAMP Moderate only.

Sources: Microsoft Learn, Azure DNS Private Resolver endpoints and rulesets [S10 (excerpt)] and Private resolver architecture [S10c (excerpt)]; AWS, Route 53, Managing forwarding rules [S33]; Oracle, OCI Private DNS [S23]; Infoblox NIOS 9.1, Configuring a Forward Zone [S38]; research_multicloud.md, Bottom line and Option A (Infoblox Shared-Services VPC Deployments [S27]); mesh-versus-hub arithmetic is illustrative.

## Slide 11 — What the agency must do

So what must the agency do? This is program design guidance, not a vendor requirement, condensed from a thirteen-step checklist.

Names and owners first. Inventory every name in the HR path, per cloud. Never create a private zone for a vendor's domain. Give each agency namespace one owner, and forward everything else. And never let a zone and a rule for the same name exist in one network.

Forwarding. From the Grid, forward each Azure service's public zone, not its privatelink zone, to inbound endpoints in two regions, and set Use Forwarders Only on those zones. Raise Windows forwarder timeouts above four seconds. Run a hub in each cloud, and review the forwarding graph for loops at every change. Size resolver endpoints before each HR 2.0 onboarding wave.

Components. Put the middleware in a Logic Apps Standard or Functions plan joined to a virtual network, using the agency resolver path, and keep Lifecycle Workflow extensions to public targets. Run at least two provisioning agents dedicated to HR provisioning, near preferred domain controllers, with no TLS inspection. Treat middleware DNS as a data-integrity control, and reconcile against full extracts. For Connect, let the TURN names resolve. For VMware, keep A and PTR records in the Grid.

And test from every origin. Any public answer or NXDOMAIN for a private name is a defect.

Sources: Research brief §9, Agency checklist steps 1–13 (all PROGRAM DESIGN GUIDANCE) and the facts each step cites: Microsoft Learn [S1, S2, S4, S4b, S7b, S8, S10, S10c, S11b, S12, S12b, S13–S15, S14b]; Oracle [S18, S21–S23]; AWS [S25, S27–S30, S32, S33]; Broadcom [S36]; Infoblox [S37]; the Federal Modernization Workbook's Book 03 Ch03, Ch05; Book 08 Ch02, Ch07, Ch08, Ch10.

## Slide 12 — Decisions, next steps and where this fits

The decisions. Who owns each namespace, the Grid or a cloud. Which middleware platform, and so which network and resolver path it uses. The hub design in each cloud. And whether Oracle's private access is needed at all, remembering that it's routing, not DNS.

The next steps are the things I couldn't verify. Which Oracle environment and hostnames the agency's Core HCM tenant will use. Whether API-driven inbound provisioning is available in the U.S. Government Graph cloud. Whether Azure's DNS Private Resolver, Lifecycle Workflows and Connect private endpoints are available in the government clouds. And the VMware install guides' DNS rules and Oracle's own connectivity patterns, which I couldn't open. They're all listed in the backup.

Where does this fit? The Federal Modernization Workbook's Book 03 covers HR-driven identity, with Federal HR 2.0 in Chapter 03 and the provisioning pipeline in Chapter 05. Book 08 covers DNS, DHCP and IP address management: split-brain DNS in Chapter 02, cloud private endpoints in Chapter 07, the reference architecture in Chapter 08, and the migration sequence in Chapter 10. Three research items sit beside this one: Trinzic Alone, or Trinzic Plus Cloud DDI; Infoblox DDI for Federal Agencies; and Who Names the Device After AD.

One note on standing: this is research under review, not an endorsement by any federal agency. Thank you.

Sources: Research brief, Couldn't verify and Agency checklist; Book 03 Ch03 and Ch05; Book 08 Ch02, Ch07, Ch08 and Ch10; research items Trinzic Alone, or Trinzic Plus Cloud DDI?, Infoblox DDI for Federal Agencies, and Who Names the Device After AD?
