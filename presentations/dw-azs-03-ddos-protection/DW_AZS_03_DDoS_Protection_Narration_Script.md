# Building Azure Security, Chapter 03 — DDoS Protection — narration script (practice copy)

## Slide 1 — Chapter 03: DDoS Protection

Welcome back to Building Azure Security. This is Chapter 3: DDoS protection. Protected isn't a property of a public IP. It depends on the address, the network behind it and the plan that network is linked to, and the code has to follow all three. We'll start from what Microsoft Learn gives you, see what it leaves to you, read how the kit follows each address to its network, and walk two labs, the evidence and the dangers. The chapter has been reviewed and approved, and the code is illustrative, tested against a fictional estate.

## Slide 2 — Why protected depends on the network behind it

Why does this need code? Because a public IP's own setting can say it inherits protection, while the network it inherits from has no plan at all. By the end of this chapter you can say, for every public IP in an estate, whether it's under DDoS IP Protection or Network Protection, whether it sends DDoS logs to the platform workspace, and whether an enabled alert fires when it's under attack. And you can compute the guide's DDoS coverage metric from the same run. It's for platform owners who own the plan, security monitors who answer the alert, and the developers who keep the check honest.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Every public IP gets infrastructure protection at no cost. Network Protection and IP Protection add tuning, metrics, alerts and reports, and neither covers a public IP on a NAT gateway. Network Protection is a plan you link to virtual networks; IP Protection is enabled on one Standard public IP. Microsoft's Zero Trust recommendations check that every public IP in a virtual network is protected, that metrics are on, and that diagnostic logs are on. And Learn's simulation tutorial alerts on the metric that says whether an address is under attack. DDoS protection covers layers three and four; layer seven needs a web application firewall.

## Slide 4 — What it leaves to you

What does that leave to you? Inherited from which network, and does that network have a plan? The property doesn't say, so the kit follows each address to the resource that holds it, its subnet, its network and that network's plan. NAT gateway addresses can't be protected, so they're reported as information and left out of coverage. An alert or a diagnostic setting made one address at a time misses the next address, or goes to the wrong workspace. An address set to Disabled isn't protected, whatever the network. And a load balancer's frontend doesn't name its backend network, so the kit says it can't resolve it rather than guessing.

## Slide 5 — Six statuses, and how coverage is counted

So every public IP gets exactly one status. IP Protection when its mode is enabled. Inherited when it inherits and its network has protection and a plan. Unprotected when it's disabled, or inherits from a network with no plan. Unknown when it inherits and the kit can't find the network, as with a load balancer frontend. NAT gateway when it sits on one. And unattached when it's attached to nothing. Coverage is protected addresses over addresses in scope, the guide's metric, with NAT gateway and unattached addresses left out.

## Slide 6 — Logs, the alert, and six rules

For each protected address the check reads its diagnostic settings and the metric alerts. A log counts if one of Learn's three DDoS categories, or all logs, goes to the platform workspace; Learn says the mitigation reports category retires from about mid-August 2026. An alert counts if it's enabled, has a criterion on the under-attack metric, and its scope is the address, its resource group or its subscription. That gives six rules: unprotected, unresolvable, on a NAT gateway, no logs, no alert, and more than one plan, since the guide keeps one plan for the agency.

## Slide 7 — Who owns the plan, and who answers the alert

Who's involved? The platform owner owns the DDoS plan, the networks linked to it, and the coverage number. The security monitor answers the under-attack alert and reads the DDoS logs. And the security officer keeps the decision records for addresses no plan can protect, like those on a NAT gateway. The kit's reads need only Reader. The simulation the guide asks for, run only through Learn's approved partners against the agency's own protected addresses, is a person's work, not the kit's.

## Slide 8 — Lab 1: run the check, read each address

Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Contoso's hub network is linked to its DDoS plan; the portal spoke isn't. Step 1 runs the check: four of six addresses in scope are protected. Step 2 reads each address. The firewall's, the application gateway's and the VPN gateway's addresses inherit from the hub. The test app's address has IP Protection. The jump box's address inherits from the portal spoke, which has no plan. And only the application gateway's address has both logs and an alert.

## Slide 9 — Lab 1: the statuses and the findings

Step 3 counts the statuses: one with IP Protection, three inherited, one unprotected, one unknown, one on a NAT gateway and one unattached. Step 4 reads the findings. The firewall's address sends its logs to an application team's workspace, so the missing-logs finding still fires. The test app's alert exists but is disabled, so the missing-alert finding fires too. The load balancer is reported as unknown, not guessed. And the trial plan is a second plan with no networks. Step 5 runs the chapter's three tests.

## Slide 10 — Lab 2: a test subscription

Lab 2 moves to a test subscription in a test tenant, never production, with at least one public IP in a virtual network. A Network Protection plan is billed per plan; without one the lab still runs, and every address shows as unprotected. Sign in to commercial Azure, write the settings file, and run the check live; six of its seven calls aren't verified on Learn yet, so allow them and compare. The guide's own query gives each address's mode, and the portal shows an inherited network's DDoS protection. Resolve any unknown address by hand and record it. Nothing changed in Azure, so back out by deleting the output. The authors haven't run this lab.

## Slide 11 — Federal requirements and the evidence

Each output supports a specific control from the guide's requirements table. Every address's protection, the network it depends on, and the coverage support NIST's denial-of-service protection control, aligned to FedRAMP's indicator that cites it. DDoS logs and an enabled attack alert on each protected address support system monitoring. And the addresses no plan can protect, or the kit couldn't resolve, are named for the security officer's decision records. The simulation report and the fired alert are the guide's test evidence; the kit doesn't produce them. The kit's output supports these controls; the assessor decides.

## Slide 12 — Dangers, and the guard for each

What breaks, and what guards against it? Trust the inherited setting and you may count an address whose network has no plan, so the kit follows it to the plan. Guess about a load balancer and coverage is claimed for a backend nobody checked, so it's counted as not protected. An alert that exists but is switched off pages nobody, so only enabled alerts count. Logs to the wrong workspace leave the monitor's queries empty, so only the platform workspace counts. And Learn warns that a protected network can't be moved, and disabling protection to move it resets the tuning: that's the change record's job, not the kit's.

## Slide 13 — Done when: the DDoS checklist

Here's what done looks like. Every unprotected address has a plan, a decision record or a ticket. Every address the kit couldn't resolve was resolved by hand and recorded. Every protected address has DDoS logs to the platform workspace and an enabled alert. The coverage in the summary is the number the metric reports. And a simulation ran this year, with its report filed beside the run. Next, Chapter 4 moves to layer seven: the web application firewall.
