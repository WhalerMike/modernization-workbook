# DNS for HR-Driven Identity Across Clouds — Explainer — narration script (practice copy)

## Slide 1 — DNS for HR-Driven Identity Across Clouds

Welcome. This is research from the Federal Modernization Workbook's Research section, and it's still under review. Federal HR 2.0 moves agencies' core HR records onto one Oracle platform. If an agency builds HR-driven identity on top of it, so a hire becomes an account and a departure removes one, that data crosses Oracle's cloud, Microsoft's cloud, the agency's own network, and maybe AWS. Every hop starts with a DNS lookup. So we'll ask which names must resolve where, what breaks, and when you need private DNS or forwarding. Facts come from sources opened on October twenty-second, 2026, a few Microsoft ones from search excerpts, and I'll flag inferences and program design guidance as we go.

## Slide 2 — The HR-driven chain, end to end

Let's walk the chain end to end. It starts in Oracle Fusion Cloud HCM, the HR system Oracle runs as a service. Changes leave Fusion as extracts or change feeds, and middleware, running in Oracle's integration cloud or in Azure, pulls them, turns them into a standard format called SCIM, and posts them to Microsoft Graph. Entra then writes the user into Entra ID, and for users still in Active Directory, a small on-premises agent writes the change into AD. Lifecycle Workflows run the joiner and leaver tasks. Now notice the DNS pattern: every hop in the top row crosses a vendor's public name, and only the agent-to-AD hop needs internal DNS. That's the key idea, so let's look closer.

## Slide 3 — Almost every name is public and vendor-owned

Here's the idea the rest of the talk builds on. Almost every name in this path is public and owned by a vendor: Oracle's Fusion host, Microsoft Graph and sign-in, the agent's relay names, the Amazon Connect names. The agency's job is to resolve those correctly from every resolver a component can reach, and never to host or shadow them in a private zone of its own. Private DNS and forwarding are needed in only four places: names the agency owns, like AD domains, cloud private endpoints the middleware uses, cloud private zones on-premises systems must read, and AWS interface endpoints with private DNS. Everything else is ordinary public resolution. So where does each component look?

## Slide 4 — What must resolve where

This table maps each component to what it must resolve, and the full version is in the backup. The HR middleware resolves Fusion, Graph and sign-in publicly, but its evidence store and key vault sit behind private endpoints, so it needs a linked private zone or a resolver that forwards to Azure. Lifecycle Workflow extensions, as an inference, can reach only public names. The provisioning agent needs domain controller records internally and Microsoft's relay names publicly. On-premises systems reach cloud private names by forwarding from the Infoblox Grid to each cloud's inbound endpoint. And VMware hosts need forward and reverse records in the Grid. Next, a trap that fails quietly.

## Slide 5 — Government clouds use different names

The government clouds use different names, and getting this wrong fails quietly. A GCC tenant keeps using the worldwide Graph and sign-in endpoints, while GCC High uses dot-us addresses, and Microsoft says access tokens from one national cloud aren't interchangeable with another's. The provisioning agent has its own list of relay names that change in the government cloud too. It needs no inbound ports, and Microsoft's guidance, from search excerpts, is to avoid inline TLS inspection on that path. The practical lesson is simple: keep a per-cloud list of names, and test through the real egress path. Now to Oracle, and a common mistake.

## Slide 6 — Oracle: private access is routing, not DNS

Oracle Fusion offers private access from on-premises, and it sounds like a DNS feature. It isn't; it's routing. Traffic rides Oracle's private circuit or a VPN into an Oracle network and on to Oracle's public address ranges, and neither Oracle page says anything about DNS. As an inference, the Fusion name keeps its public answer, so don't build a private zone for it. A second point: Oracle says its change feeds can be periodically purged, so, as an inference, if the middleware loses DNS longer than that window, HR events are lost. That makes middleware DNS a correctness issue, not just uptime, so reconcile against full extracts. Oracle Fusion is listed at FedRAMP Moderate. Next, two more components.

## Slide 7 — Amazon Connect and VMware

Two more components. Amazon Connect agents work in a browser, and AWS says that traffic traverses the public network and prefers a domain allowlist. If agents can't resolve the media relay names, the softphone can't set up its media channel, so don't over-restrict their DNS. In GovCloud, Connect is available only in the US-West region, uses its own names, and lacks several features. Private API access covers only a subset of Connect, and, as an inference, helps API calls, not the agent or voice path. On VMware, a Broadcom article says changing vCenter's name or address is blocked if the name doesn't fully resolve. So keep those records right in the Grid. Next, the subtle one.

## Slide 8 — The clouds disagree on precedence

Here's the subtle one. Suppose a cloud network has both a private zone and a forwarding rule for the same name. Which wins? The three clouds disagree. In AWS the rule wins. In Azure the private zone wins, and the rule is silently ignored. In Oracle the private view wins, and evaluation stops even on a negative answer. And a private zone that covers a name but has no record for it says the name doesn't exist, instead of asking anyone else. So, as an inference, the only design that behaves the same everywhere is one owner per name. The Grid owns agency zones, each cloud owns its own private zones, and everything else forwards. So how does it break?

## Slide 9 — How it breaks: seven failure modes

The brief lists sixteen ways this breaks, and the slide picks seven. Shadowing is the classic: someone creates a private zone for a vendor's domain, say oraclecloud dot com, and every name not copied into it stops resolving. Silent fallback is sneakier: a private name resolves to the public address because a rule is missing or slow, which is why Windows forwarders to Azure need a timeout above four seconds. The Grid itself can fall back to the internet's root servers if its forwarders fail. Then there are loops, certificate name mismatches, the wrong cloud's endpoints, and capacity, so size resolver endpoints before each onboarding wave. So how should forwarding be wired?

## Slide 10 — Hub, not mesh

With several clouds, every vendor documents a hub, and none recommends a mesh. Here's some illustrative arithmetic. With five environments, a full mesh needs up to twenty one-way rule sets, while a hub needs about five. As an inference, every extra path is one more place for the precedence, fallback and loop failures we just saw. The Infoblox Grid is a natural hub for agency names, and Infoblox's reference design puts its virtual appliance in a shared-services hub network. The earlier multi-cloud research, as design guidance, recommends the Grid plus each cloud's native resolver as the baseline, with customer-operated appliances for FedRAMP High workloads. So what does the agency actually do?

## Slide 11 — What the agency must do

Here's what the agency must do, condensed from a thirteen-step checklist, and it's program design guidance, not a vendor requirement. Start with names and owners: inventory every name in the HR path per cloud, never create a private zone for a vendor's domain, and give each agency namespace one owner. Then forwarding: forward from the Grid to inbound endpoints in two regions, raise Windows forwarder timeouts, run a hub in each cloud, and size endpoints before each onboarding wave. Then the components: run at least two provisioning agents, treat middleware DNS as a data-integrity control, and keep VMware records in the Grid. And test from every origin. Any public answer or missing name for a private name is a defect.

## Slide 12 — Decisions, next steps and where this fits

To close. The decisions are who owns each namespace, which middleware platform and so which resolver path, the hub design in each cloud, and whether Oracle's private access is needed at all, remembering that it's routing, not DNS. The next steps are the things that couldn't be verified, such as which Oracle environment the agency's tenant will use and what's available in the government clouds; they're all listed in the backup. In the workbook, Book 03 covers HR-driven identity and Book 08 covers DNS, DHCP and address management, and three related research items sit beside this one. This is research under review, not an endorsement by any federal agency. Thank you.
