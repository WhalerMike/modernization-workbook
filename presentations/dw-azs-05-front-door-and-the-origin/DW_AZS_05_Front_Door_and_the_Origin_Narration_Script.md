# Building Azure Security, Chapter 05 — Front Door, Application Gateway and the Origin — narration script (practice copy)

## Slide 1 — Chapter 05: Front Door, Application Gateway and the Origin

Welcome to Building Azure Security, Chapter 5: Front Door, Application Gateway and the origin. The service tag tells an origin a request came from a Front Door. Only the header tells it the request came from yours. We'll start from Microsoft Learn's two ways to lock an origin to the edge, see what they leave to you, read how the kit checks each origin's configuration and where it stops and says "test this by hand", then walk two labs, the evidence and the dangers. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against a fictional estate.

## Slide 2 — Why an origin must refuse the way around

Why does this matter? A web application firewall at the edge only helps if nothing can reach the origin around it. By the end of this chapter you can say, for every Front Door origin, whether its configuration lets only your Front Door reach it; which origin groups can't fail over or mix private and public origins; which custom domains or application gateways allow TLS below 1.2; and which classic profiles still need migrating. It's for application owners, who own origins and certificates, and platform owners, who own the profiles. One limit to keep in mind: the kit reads configuration, and the guide's test is a request. You'll know which answers still need that test.

## Slide 3 — What Microsoft Learn gives you

Here's what Microsoft Learn gives you. The origin security page says to use the Azure Front Door Backend service tag and the X-Azure-FDID header together, because the tag's addresses are shared by every Front Door customer. Learn's App Service tutorial does both in one access restriction. Where the origin supports it, Private Link is the alternative: Front Door Premium requests a private endpoint connection that the origin owner approves, and an origin group shouldn't mix public and private origins. The App Service configuration and Front Door origins APIs return what the kit reads, and the header matches exactly. On TLS, 1.2 or 1.3 only. And classic Front Door retires on March 31, 2027.

## Slide 4 — What it leaves to you

What does Learn leave to you? The command adds a restriction, but nothing reads back what every origin has today. A rule with the tag alone admits any customer's Front Door. A header copied from another profile admits that profile, not this one. An allow rule for any address, or a default action of allow, opens the origin whatever the tag rule says. "Don't mix origins" is a sentence, not a check, and one origin can't fail over. And origins of other types restrict access their own ways. The kit answers each, and says plainly which origins it couldn't check, so a person tests them.

## Slide 5 — Each origin gets one lock-down state

Here's how the kit decides. Every origin gets one lock-down state. Private Link, when the shared private link connection is approved. Service tag plus Front Door ID, when an App Service origin has an allow rule for the tag with this profile's header, no allow rule for any address, and no default of allow. Those two count as locked. Tag only, when the header's missing. Other Front Door, when the header is some other profile's. Open, when there's no tag rule, an allow-any rule, or a default of allow. And unchecked, for any origin type the kit can't read: it's not counted as locked by anybody.

## Slide 6 — The edge rules, beyond the origin

Beyond each origin, five more rules. A classic Front Door profile is a finding, because it retires. An origin group that mixes Private Link and public origins is a finding, as Learn advises. A custom domain whose minimum TLS is below 1.2 is a finding, and so is an application gateway whose TLS policy isn't one of the two predefined policies Learn names. An origin group with fewer than two enabled origins is a warning: it can't fail over. The origin groups' and custom domains' calls are still unverified, read by their Resource Manager names, which Lab 2 confirms.

## Slide 7 — Who owns the origin and who owns the profile

Who's involved? The application owner owns the origins and their certificates, and runs the direct-request test the guide asks for. The platform owner owns the Front Door profiles and the gateways' TLS policy. Developers keep the lock-down states honest, and make sure the unchecked list stays visible, so nobody counts it as done. Every read the check makes is Reader, and it sends nothing.

## Slide 8 — Lab 1: run the edge check, read each origin

Lab 1 needs PowerShell 7 with Pester, in the kit's folder, and no subscription. Contoso's Premium profile has two origin groups: one with two App Service origins, one with a Private Link origin and a public one. The Standard careers profile has a single storage origin. Step 1 runs the edge check: two of five origins locked by configuration. Step 2 reads each origin. The east origin has the tag and the header; the west origin has the tag only. The private API origin reaches its origin over Private Link. And two are unchecked.

## Slide 9 — Lab 1: the findings

Step 3 reads the findings. The API origin group mixes a private and a public origin. The west origin's tag rule has no header. The careers custom domain allows TLS 1.0. The intranet gateway uses an old 2015 TLS policy. The careers origin group has one origin, so it can't fail over. The classic profile is still there. And the two unchecked origins get a warning that says, in plain words, test a direct request by hand. Step 4 runs this chapter's two tests.

## Slide 10 — Lab 2: a test profile, and the refused request

Lab 2 moves to a test subscription with a Front Door Premium profile and an App Service origin, never production. Sign in to commercial Azure, write the settings, and run the edge check live, allowing the unverified calls. Compare the origin's access restrictions with what the kit read, and check each custom domain's minimum TLS in the portal. Then run the guide's own test: a direct request to the origin should come back 403, and the same request through Front Door should succeed. If the kit said locked and the direct request isn't refused, record it. Back out by deleting what the lab wrote, and signing out. The authors haven't run this lab.

## Slide 11 — Federal requirements and the evidence

Each output is evidence for something specific, from the guide's requirements table against NIST SP 800-53. Each origin's lock-down, read from configuration and backed by Lab 2's request test, supports boundary protection. TLS 1.2 as the minimum on every custom domain and gateway supports transmission confidentiality and integrity. A second origin in every group, with the failover test, supports the contingency plan. And classic profiles named before their retirement support boundary protection too. The kit's output supports these controls; the assessor decides. And the key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with.

## Slide 12 — Dangers, and the guard for each

What breaks in production? The service tag alone lets any customer's Front Door reach the origin: the kit flags it. A header copied from another profile lets that profile in, so the kit compares the header with this profile's own ID. Configuration taken as proof is a danger of its own: a rule can read right while a request still gets through another path, like another slot or the deployment site. So the metric says "by configuration", and Lab 2's direct request is the test. And an origin the kit can't read would otherwise be counted locked by nobody and tested by nobody, so it's flagged every week until someone tests it.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. Every origin is locked by Private Link or by the tag and this profile's header, or has a decision record with a compensating control. Every unchecked origin has a dated direct-request test. Every origin group has a second origin, and failover was tested this half year. No custom domain or gateway allows TLS below 1.2. And no classic profile remains, or its migration is scheduled before March 31, 2027. Next, Chapter 6 turns from what comes in to what leaves: Azure Firewall and egress.
