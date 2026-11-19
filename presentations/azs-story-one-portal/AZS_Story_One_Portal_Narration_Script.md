# Companion guide — Building Azure Security — One Portal, End to End — narration script (practice copy)

## Slide 1 — One Portal, End to End

Welcome to the story deck for Building Azure Security, a developer workbook in the Federal Modernization Workbook. Instead of nine chapters one at a time, we'll follow one application all the way through: Contoso's public portal, its subscription, its Front Door and gateway, its network, its key vault, and the hub that serves it. It's fictional: every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. Two notes before we begin. The chapters have been reviewed and approved. And the code is illustrative, tested against fixtures, not against a live subscription.

## Slide 2 — The portal's path through the nine chapters

Here's the route. Scene one reads the landing-zone baseline back. Scene two lists every public face of the portal, with its owner. Scene three asks which of its public IP addresses are really under DDoS protection. Scene four finds a web application firewall that logs but doesn't block. Scene five checks whether the portal's origins can be reached around the edge. Scene six follows its egress. Scene seven reads its key vault. Scene eight holds it all with policy, compares two weeks, and records the evidence. And scene nine takes the kit live, test first. Each scene has a story slide, a try-it slide with real output, and a one-question check.

## Slide 3 — Scene 1: the baseline, read back every week

Scene one. The guide's Step 1 sets four things once: the hierarchy settings, the initiatives in audit at the intermediate root, platform logs, and Defender for Cloud plans. Microsoft Learn gives the commands, and its REST reference gives the reads, but nobody runs them back every week across every subscription. So the kit does, with one check scoped to the intermediate root. For our portal, two things turn up. Its subscription's Key Vault plan is on the Free tier. And the hub firewall's public address does send logs, but to an application team's workspace, which doesn't count: a log counts only if it's enabled and goes to the platform workspace.

## Slide 4 — Try it: the baseline check on week one

Try it. From the kit's folder, run the baseline check on the first week's estate. It reads the hierarchy settings, four policy assignments, sixteen platform resources and four subscriptions, from six calls, every one a read. Twelve findings and one information row. Read them: creating management groups doesn't need authorization; the firewall and its public IP send nothing to the platform workspace; the online subscription, the portal's, has its Key Vault plan on Free; and the FedRAMP initiative is in audit, exactly as Step 1 intends.

## Slide 5 — Check 1: does pip-afw-hub's log count?

Check one. The hub firewall's public address has a diagnostic setting that sends all its logs to an application team's workspace. Does the kit count that as logging? Any enabled setting? Only one to the platform workspace? Yes, if the application team owns the address? Or only when Defender for Cloud is on? The answer opens the next scene.

## Slide 6 — Scene 2: every public face of the portal, owned

The answer to check one: no. Only an enabled log to the platform workspace counts. Scene two. Steps 3 to 5 can't be proved complete without a list of what's exposed, and the portal is public in many places: a Front Door profile, the gateway's address, a jump box, a load balancer, two web apps and a vault. The kit joins the guide's Resource Graph queries, built from Microsoft Learn's starter sample, into one register, with an owner on every row. The jump box's address has no owner. A week later a new address appears, with no owner either, and an orphan address is gone, with a reminder to remove any DNS record still pointing at it.

## Slide 7 — Try it: the register, then a week later

Try it. Build the first week's register: nineteen exposures, sixteen with an owner. Read the portal's rows. The gateway's public address carries the gateway's web application firewall policy, wafp-portal. The Front Door profile carries its own. The jump box's address has no owner. Then build the register again a week later, against the first one. The new address, pip-new-api, is reported as new, and the orphan as gone, with the reminder to remove any DNS record that still points at its old address.

## Slide 8 — Check 2: where does the register live?

Check two. The register lists every public address, Front Door profile and gateway, with its owner. Where should it be kept? In a public repository, so assessors can find it? Inside the agency's boundary? Only in the portal's own subscription? Or nowhere, since it's regenerated each week?

## Slide 9 — Scene 3: which of the portal's IPs are protected

The answer to check two: inside the agency's boundary, never in a public repository, because it maps the attack surface. Scene three. Microsoft Learn's Zero Trust recommendations check that every public address in a virtual network is protected, with metrics and logs. The jump box's address says it inherits its protection, which sounds protected. But the kit follows it to its network, the portal's spoke, and that network has no DDoS protection plan. So it's unprotected. The gateway's address inherits from the hub, which is linked to the plan. And it's the one address with both DDoS logs to the platform workspace and an enabled alert on Under DDoS attack.

## Slide 10 — Try it: each public IP's protection

Try it. Read each public address's status. The hub's three addresses inherit from the hub network. The test application's address has IP Protection on the address itself. The jump box's inherits from the portal's spoke, which has no plan, so it's unprotected. The load balancer's is unknown: its protection depends on a backend network the frontend doesn't name, and the kit says so rather than guessing. Then the findings: the jump box unprotected, the firewall's address with no logs to the workspace and no alert, and the test application's alert, which exists but is disabled.

## Slide 11 — Check 3: is pip-jump protected?

Check three. The jump box's address has the protection mode virtual network inherited. What decides whether it's actually protected? Nothing, because inherited always means protected? Whether its network is linked to a DDoS protection plan? Whether it has an owner tag? Or whether Front Door sits in front of it?

## Slide 12 — Scene 4: a WAF that logs but doesn't block

The answer to check three: whether its network is linked to a DDoS protection plan, and the portal's spoke isn't. Scene four. DDoS protection stops at layers three and four; layer seven needs a web application firewall. Microsoft Learn is plain about it: detection mode logs and forwards, and only prevention mode blocks. The portal's gateway policy is still in detection. Its Front Door policy blocks, but has no bot protection rule set. The kit checks every policy on both services the same way, and writes the switch to prevention to a plan, which it never runs. The application owner runs it, after reviewing the false positives.

## Slide 13 — Try it: the portal's WAF policies, and the plan

Try it. Read each policy. The gateway's policy, wafp-portal: detection, body inspection on, rule set 2.1, bot rules and a rate limit. The Front Door policy: prevention, body inspection on, rule set 2.1, no bot rules. Then read the plan the kit wrote: a header that says the kit did not run it, then Microsoft Learn's own switch command for wafp-portal, with its resource group and subscription, setting prevention, the state and body inspection. One of three internet-facing endpoints is behind a firewall in prevention this week.

## Slide 14 — Check 4: who sends the switch to Prevention?

Check four. The gateway's policy is in detection, and the kit wrote the switch to prevention into a plan file. Who runs it, and when? The kit, on its next weekly run? The application owner, after the false-positive review, in a change window? Azure Policy, automatically? Or nobody, because detection is enough?

## Slide 15 — Scene 5: can the portal be reached around the edge?

The answer to check four: the application owner, after the false-positive review, in a change window. Scene five. A web application firewall only helps if nothing can reach the origin around it. Microsoft Learn says to use the Front Door service tag and the Front Door ID header together, because the tag's addresses are shared by every Front Door customer. The portal's east web app does both, with this profile's own ID. The west web app allows the tag alone. So any customer's Front Door can reach it. The kit reads each origin's access restrictions and compares the header with the profile's ID. And it knows configuration isn't proof: the guide's test is a direct request, refused.

## Slide 16 — Try it: each origin's lock-down

Try it. Read each origin's lock-down. In the portal's origin group, the east web app is locked with the service tag and the Front Door ID; the west one has the tag only. In the API group, one origin reaches its back end over Private Link and one is a public host the kit can't check, so it says to test a direct request by hand. Then the findings: the west origin's rule has no header, and the API group mixes a private and a public origin, which Learn says not to do.

## Slide 17 — Check 5: why isn't the tag enough?

Check five. The west origin allows the Front Door service tag, with no Front Door ID header. What's wrong with that? Nothing, since the tag is Front Door's own? The tag's addresses are shared by every Front Door customer? The tag blocks Front Door's health probes? Or the tag works only with Private Link?

## Slide 18 — Scene 6: the portal's egress skips the firewall

The answer to check five: the tag's addresses are shared by every Front Door customer, so the header has to prove it's yours. Scene six, what leaves. Microsoft Learn's Zero Trust recommendations for Azure Firewall check that outbound traffic routes through the firewall, with threat intelligence and intrusion detection in alert and deny. The portal's web subnet sends its default route straight to the internet. Its jump subnet sends it to an appliance that isn't the hub firewall. And the hub policy is still in alert. The kit writes Learn's draft-and-deploy commands for the move to deny into a plan, which it never runs, because deploying replaces the whole applied policy.

## Slide 19 — Try it: default routes, and the draft to Deny

Try it. Read each workload subnet's default route. Two go to the hub firewall at 10.0.0.4. The payroll data subnet has no route table at all. The portal's jump subnet goes to an unknown appliance, and its web subnet straight to the internet. Two of five route to the firewall. Then read the plan: Microsoft Learn's four commands, create a draft, set threat intelligence and intrusion detection to deny, show it, and deploy it, each with the policy's resource group and subscription, under a header that says the kit did not run them.

## Slide 20 — Check 6: why a draft, and why not automated?

Check six. Why does the kit write the move to deny as a draft-and-deploy plan, instead of sending it? Because drafts are cheaper? Because deploying replaces the whole applied policy, so it goes through review and a change window? Because deny can't be set from the command line? Or because the kit has no network access?

## Slide 21 — Scene 7: the portal's vault, missing every part

The answer to check six: deploying replaces the whole applied policy, so it goes through review and a change window. Scene seven, the vault. Microsoft Learn's Key Vault recommendations are clear: Azure role-based access, not access policies; soft delete and purge protection; private endpoints with public access disabled; and audit logging. The portal's vault misses every part. It uses access policies, has no purge protection, a firewall that allows all networks, public access on, no private endpoint, and no audit events to the workspace. The payroll team's vault next door has every part, so the estate already shows what done looks like.

## Slide 22 — Try it: the vaults

Try it. Read each vault. The hub's certificate vault has role-based access, purge protection, a closed firewall and audit logs, but public access on and no private endpoint. The payroll vault has everything. The portal's vault has nothing: no role-based access, no purge protection, a firewall that allows all networks, public access, no endpoints, no audit. Then its findings, one per missing part, from access policies to the missing audit events. One of three vaults has the full posture.

## Slide 23 — Check 7: can purge protection be undone?

Check seven. The fix for the portal's vault includes turning on purge protection. Can that be rolled back later? Yes, with a key vault update? No, because once it's on it can't be turned off, and that's the point? Only by Microsoft support? Or only in a test subscription?

## Slide 24 — Scene 8: an exemption due, a week of drift, the evidence

The answer to check seven: no. Once on, purge protection can't be turned off, and that's the point. Scene eight. The portal's WAF tuning runs under a waiver that expires on December first, so the kit warns it's due within thirty days. A week later, the platform team switches the gateway's firewall to prevention, adds the west origin's header, routes the web subnet to the firewall, and turns on the vault's purge protection. A new address arrives, with no owner and no protection. The kit compares the two weeks by fingerprint, and records each run as evidence that supports the controls, with its key security indicators, its hashes and the record before it.

## Slide 25 — Try it: the exemption, the drift, the records

Try it. The policy check flags the portal's waiver, due December first. Compare the two weeks: thirteen fixed, four new. Among the fixed, the portal's firewall policy, the west origin, the web subnet's route and the vault's purge protection. Among the new, the arriving address, with no owner and no protection plan. Record the run as evidence: it covers all nine area steps, and the check shows the hashes match and the chain is unbroken. Then ask whether this evidence could promote anything to production. Every stage step fails: no passing live record.

## Slide 26 — Check 8: why does the stage check fail?

Check eight. The evidence folder's hashes match, and its chain is unbroken. Why does the test-stage check still fail every step? Is the chain too short? Do the records come from fixture runs, when only live records count toward a stage? Are the key security indicators wrong? Or were the metrics not recorded?

## Slide 27 — Scene 9: the kit goes live, test first

The answer to check eight: the records come from fixture runs, and only live records count toward a stage. Scene nine, the runbook. It's one ordered set of commands, run against a test subscription, then production, and only the settings file changes. The weekly run needs only Reader. The kit's one write is the security initiative's assignment at the intermediate root in DoNotEnforce, which evaluates without enforcing, as Microsoft Learn's assignment structure page describes. It's a plan, applied only with its approved hash, and its rollback is rehearsed in test before production. Go or no-go is the test stage's live evidence. One honest label: nobody has run this runbook against a live subscription.

## Slide 28 — Try it: the runbook's rehearsal on the fixtures

Try it. The runbook's own rehearsal on the fixtures. The first weekly run reads every area, records itself as the baseline, and covers every area step and the metrics. A week later, the second run finds last week's, compares them, thirteen fixed and four new, and its record adds the comparison. Then the rollback for production, back to audit: one command, printed with its plan's hash, and nothing sent. In a live stage, a second person approves that hash before anyone applies it.

## Slide 29 — Check 9: production before test passes

Check nine, the last one. An operator runs production's preflight before the test stage's evidence passes its stage check. Does it pass anyway, fail on the check that reads the test evidence, warn and let the operator decide, or assign the initiative regardless?

## Slide 30 — Your turn: Lab 2, and where to go next

The answer to check nine: the preflight's last check fails, because production needs the test stage's evidence to pass first. That's the portal, end to end: its baseline read back, every public face owned, its protection traced to the network behind it, a web application firewall switched by a person, origins locked to the edge, egress through the firewall, its vault fixed, and every week's drift recorded as evidence. Now it's your turn. Each chapter has a second lab in your own test subscription, never production, with Reader and the guide's own Validate commands beside the kit. Then go deeper: the chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.
