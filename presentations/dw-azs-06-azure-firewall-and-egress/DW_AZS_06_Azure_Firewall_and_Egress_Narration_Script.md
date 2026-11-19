# Building Azure Security, Chapter 06 — Azure Firewall and Egress — narration script (practice copy)

## Slide 1 — Chapter 06: Azure Firewall and Egress

Welcome to Building Azure Security, Chapter 6: Azure Firewall and egress. A firewall nobody routes to inspects nothing. So the kit reads the policy and the routes together, and it admits what it can't see: the effective route on a running network interface. We'll start from Microsoft Learn's Zero Trust checks, route commands and Draft and Deployment procedure, see what they leave to you, read the kit's check and the plan it writes but never runs, then walk two labs, the evidence and the dangers. The chapter has been reviewed and approved, and the code is illustrative, tested against a fictional estate.

## Slide 2 — Why the policy and the routes are read together

Why read the policy and the routes together? Because a policy that denies inspects nothing if workloads don't route to it, and a route to a firewall in alert mode lets everything through. By the end of this chapter you can say whether every firewall policy denies on threat intelligence and intrusion detection, whether each firewall has a policy and logs, and what share of workload subnets declare a default route to a firewall, which is the guide's egress-inspection metric. And you can hand the platform owner the commands that move a policy to deny, unrun. It's for platform owners, security monitors, and the developers who review both.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Learn's Zero Trust recommendations for Azure Firewall check that outbound traffic from workloads routes through the firewall, that threat intelligence and intrusion detection are in alert and deny, that outbound TLS is inspected, and that diagnostic logs are on. Threat intelligence deny needs Standard or Premium; intrusion detection and TLS inspection need Premium. The CLI sets each mode to alert, deny or off. Learn's route commands add a default route to the firewall's private IP. And Learn's Draft and Deployment procedure stages every change in a draft and deploys it at once, replacing the whole applied policy.

## Slide 4 — What it leaves to you

What does Learn leave to you? The guide's Validate query reads one policy, and policies drift one at a time. A route command per subnet means a subnet added later has no route, or one to the internet. A virtual appliance at some address may not be the firewall at all. A Standard policy can't deny on intrusion detection whatever its mode says. Sent by automation, a draft would deploy without review and replace live edits made since. And the route a machine actually uses can include system routes that win. The kit answers each one, and is honest that it reads declared routes only.

## Slide 5 — Workload subnets and their default route

Here's how the kit reads egress. It takes every subnet in the workload subscriptions the settings name, except the reserved ones: the gateway, firewall, firewall management, Bastion and route server subnets. Each gets one state. Firewall, when the default route goes to a firewall's private IP. Other appliance, when it goes to an address the kit doesn't know. No route table, or no default route. Or the next hop type it found, such as the internet. The guide's egress-inspection metric is the firewall subnets over all workload subnets, by declared route.

## Slide 6 — The firewall rules, and the plan never run

The check reports seven rules. Threat intelligence not in deny, and intrusion detection not in deny or a policy that isn't Premium, are findings straight from Learn's Zero Trust checks. A workload subnet without a default route to the firewall is a finding; one routed to an unknown appliance is a warning. A firewall with no logs is a finding. A firewall with no policy, and a Premium policy with no TLS inspection, are warnings: the program pilots TLS inspection on one rule collection first. And for each policy not yet in deny, the kit writes Learn's four draft and deployment commands to a plan file, and never runs them.

## Slide 7 — Who owns the policy, the routes and the logs

Who's involved? The platform owner owns the firewall policy and the routes, and runs the draft in a change window, after review. The security monitor reads the threat intelligence and intrusion detection logs the firewall sends. And developers review the check, the plan file and the routes it reads. Every read the check makes is Reader; the plan is the platform owner's to run.

## Slide 8 — Lab 1: run the check, read each subnet

Lab 1 needs PowerShell 7 with Pester, in the kit's folder, and no subscription. Contoso's hub firewall has the private IP ten dot zero dot zero dot four and a Premium policy still in alert. Two workload networks hold five workload subnets. Step 1 runs the firewall check: two of five subnets route to the firewall, and the plan file is written. Step 2 reads each subnet. The payroll data subnet has no route table. The portal web subnet sends its default route to the internet. And the jump subnet sends it to ten dot nine dot nine dot nine, an appliance the kit doesn't know.

## Slide 9 — Lab 1: the findings and the plan

Step 3 reads the findings: threat intelligence and intrusion detection both in alert, no firewall logs, two subnets with no route to the firewall, an unknown appliance, and no TLS inspection. Step 4 reads the plan the kit wrote and didn't run: Learn's four draft and deployment commands for the hub policy, with its resource group and subscription, under a header that says the kit did not run them, and points at the guide's Step 6 and a change window. Step 5 runs this chapter's two tests.

## Slide 10 — Lab 2: a test subscription, effective routes

Lab 2 moves to a test subscription with an Azure Firewall, its policy and a pilot spoke subnet routed to it, never production. Sign in to commercial Azure with the Resource Graph and firewall extensions, write the settings, and run the check live, allowing the unverified calls. Then compare with the guide's Validate commands: the policy's two modes, and the effective route table on a test machine in the pilot subnet. For a subnet the kit called firewall, the effective default route should go to the firewall's private IP. If it doesn't, record why. Nothing changed in Azure, and the plan wasn't run, so back out by deleting the output and signing out.

## Slide 11 — Federal requirements and the evidence

Each output is evidence for something specific, from the guide's requirements table against NIST SP 800-53. Threat intelligence and intrusion detection in deny on every policy supports deny by default, allow by exception, and system monitoring. Every workload subnet's declared route to the firewall, and the share that has one, supports boundary protection. Firewall logs to the platform workspace support system monitoring. And the move to deny, reviewed before it's deployed, supports deny by default too, through the change record. The kit's output supports these controls; the assessor decides. The key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with.

## Slide 12 — Dangers, and the guard for each

What breaks in production? A draft deployed over newer live edits loses them, because deploying replaces the whole applied policy; the kit never deploys, and the plan names the change window and the guide's single change path. A declared route that doesn't win sends traffic around the firewall; the metric says declared, and Lab 2 checks the effective route. A route to an unknown appliance sends egress through something that isn't the inspecting firewall; the kit names it. And a Standard policy with intrusion detection set reads as configured but inspects nothing; the kit says Premium is needed.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. Every policy denies on threat intelligence and intrusion detection, or has a dated plan to. Every workload subnet routes to the firewall, or has a decision record. The effective route was checked on a machine in each pilot subnet. And the plan file went through the change record before anyone ran it. Next, Chapter 7: platform services reached only through private endpoints, and the key vaults behind them.
