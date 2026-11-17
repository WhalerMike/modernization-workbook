# Building Azure Security, Chapter 04 — The Web Application Firewall — narration script (practice copy)

## Slide 1 — Chapter 04: The Web Application Firewall

Welcome back to Building Azure Security. This is Chapter 4: the web application firewall. A firewall in detection mode is a log with good intentions. The check reads the mode, and the switch to prevention stays a decision a person makes. We'll start from what Microsoft Learn gives you, see what it leaves to you, read how the kit checks every policy and every internet-facing endpoint, and why it writes the switch to a plan instead of sending it. Then two labs, the evidence and the dangers. The chapter is a draft, and the code is illustrative.

## Slide 2 — Why a WAF in detection mode isn't protection

Why does the mode matter so much? Because, as Microsoft Learn puts it, detection mode only logs, and only prevention mode blocks. By the end of this chapter you can check every WAF policy against Microsoft's Zero Trust recommendations, find every internet-facing application gateway and Front Door profile that has no WAF or no logs, compute the guide's prevention coverage, and hand the application owner the exact command that moves a policy to prevention, without the kit ever sending it. It's for application owners who tune and switch the WAF, platform owners who own the policies, and security monitors who read the logs.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Microsoft's Zero Trust recommendations for both services check prevention mode, request body inspection, the default rule set, the bot protection rule set, rate limiting and diagnostic logging, among others. Learn recommends the latest Default Rule Set, two point two at the guide's reading, validated in log mode before blocking; the command line's default is two point one. Front Door's managed rules need the Premium tier. Built-in policies require a WAF on each service, and a given mode. And Learn documents the switch between detection and prevention with one command.

## Slide 4 — What it leaves to you

What does Learn leave to you? Its Validate query reads one policy; an estate has several, on two services, so the kit reads them all with the same checks. Front Door says body inspection is enabled where Application Gateway says true, and code written for one reads the other as off, so each shape is read as its own. A policy that requires a WAF audits resources but doesn't count endpoints, so the kit counts them. A Front Door's WAF lives in a security policy, so those are read per profile. The switch to prevention, sent by automation, blocks users before tuning, so it's written to a plan. And an old rule set is a warning, because moving needs validation first.

## Slide 5 — Eight rules, and the coverage count

Eight rules come out of that. A policy in detection, or disabled, is a finding, and so is body inspection switched off. A missing or older rule set, no bot protection, and no rate limit are warnings. An internet-facing gateway or Front Door profile with no WAF at all is a finding, and so is one that sends no logs to the platform workspace. And a Front Door policy that isn't Premium is information: it can't use managed rule sets. Coverage is the endpoints behind a WAF in prevention over all internet-facing endpoints, the guide's metric. A gateway with only a private frontend isn't counted.

## Slide 6 — The switch to Prevention, as a plan

Here's the one thing this check could change, and doesn't. For every Application Gateway policy not in prevention, the check writes Learn's switch command, with the policy's resource group and subscription, to a plan file. For a Front Door policy it writes a line pointing at the guide. Nothing runs either. A person runs the command after the false-positive review, in a change window, because a switch sent by automation before tuning blocks legitimate users. Learn documents the same command in reverse for backing out.

## Slide 7 — Who tunes, who switches, who watches

Who's involved? The application owner tunes the policy while it's in detection, and runs the switch after the false-positive review. The platform owner owns the policies and their rule-set versions. And the security monitor reads the WAF logs, and confirms every endpoint's logs reach the platform workspace. The kit's reads need only Reader. The plan is the application owner's to run.

## Slide 8 — Lab 1: run the check, read each policy

Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Contoso has two WAF policies: one on its portal application gateway, and one on its portal Front Door profile. A second Front Door profile, for careers, has none. Step 1 runs the check: one of three internet-facing endpoints is behind a WAF in prevention, and the plan file is written. Step 2 reads each policy. The gateway's policy is still in detection. The Front Door policy blocks, but has no bot rule set. Both are on Default Rule Set two point one.

## Slide 9 — Lab 1: the findings, and the unsent plan

Step 3 reads the findings. The gateway's policy is in detection. The careers Front Door profile has no WAF and sends no logs. Both policies are a rule-set version behind the baseline, and the Front Door policy has no bot protection. The intranet gateway has a private frontend only, so it isn't counted. Step 4 reads the plan the kit wrote and didn't run: Learn's switch command for the gateway's policy, with its resource group and subscription, ready for the application owner. Step 5 runs the chapter's tests.

## Slide 10 — Lab 2: a test subscription

Lab 2 moves to a test subscription with an Application Gateway WAF version two and its policy, as the guide's pilot builds them, never production. Sign in to commercial Azure, write the settings file, and run the check live, allowing the WAF policy queries that aren't verified on Learn yet. Then compare with the guide's Validate query: the mode, body inspection and rule sets should match the kit's row. If a property is named differently, record it. Nothing changed in Azure and the plan wasn't run, so back out by deleting the output. The guide's own blocked-request test is the application owner's, after the switch. The authors haven't run this lab.

## Slide 11 — Federal requirements and the evidence

Each output supports a specific control from the guide's requirements table. Each policy's mode, body inspection, rule sets and rate limit support NIST's information input validation and boundary protection controls, aligned to a FedRAMP indicator that cites input validation. Every internet-facing endpoint behind a WAF in prevention, the plan reviewed before it runs, and the logs from every endpoint all support boundary protection. The kit's output supports these controls; the assessor decides.

## Slide 12 — Dangers, and the guard for each

What breaks, and what guards against it? A WAF left in detection logs attacks and lets them reach the backend, so the finding comes back every week until it switches. Automation that switches to prevention blocks legitimate traffic before tuning, so the kit only writes the command down. A Front Door profile with no security policy has no WAF, and nothing on the profile says so, so security policies are read per profile. And the two services' property shapes differ, so each is read on its own, with a test for both.

## Slide 13 — Done when: the WAF checklist

Here's what done looks like. Every internet-facing endpoint is behind a WAF in prevention, or has a decision record. Every policy's rule set is the version the application owner validated. The plan file was reviewed with the application owner before anyone ran it. And every endpoint's WAF logs reach the platform workspace. Next, Chapter 5: a WAF only helps if nothing can reach the origin around it.
