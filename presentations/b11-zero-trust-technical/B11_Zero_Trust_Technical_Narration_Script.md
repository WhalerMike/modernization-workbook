# Book 11 — Zero Trust & Assessment — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Zero Trust & Assessment: the technical deep dive

Welcome. This is the technical deep dive for Book 11 of the Federal Modernization Workbook, Zero Trust and Assessment. It's for the people who actually run the assessment: security engineers and assessors. The whole book turns on one idea. Zero Trust belongs to the whole agency, not to a product or a tenant score, and the assessment tools hand you evidence, not a verdict. Part 1 covers what the mandates really require and what the tools really measure. Part 2 covers who owns the decisions, and how to run the assessment so the output holds up. Let's start with why this matters.

## Slide 2 — Why this matters: the worst failures sat beneath any tool

Two incidents make the case. In 2023, tokens forged with a provider's own stolen signing key read federal email for weeks, and every system that checked those tokens said they were fine. What caught it was one department's own logging, not the provider. Then there's the layer beneath the guest. Ransomware crews went after hypervisors directly, and one flaw handed full control to anyone who could create a directory group with the right name. The security tools inside each virtual machine never saw it. In both cases, the failure sat where no single tool was looking. That's what Module 1 builds from.

## Slide 3 — Module 1: A whole-agency property and its mandates

Module 1 sets the target. We'll look at what the federal guidance actually says about scope, why governance is the capability programs underfund, and which documents are binding and which are guides. Getting that straight is how you scope an assessment honestly.

## Slide 4 — The guidance describes the enterprise, not a tenant

Here's the core argument. Every federal Zero Trust document describes the enterprise: all identities, all devices, every network, cloud and virtualized estate. None of them is scoped to a product. But most agencies assess the network, the clouds and the hypervisors separately, each with its own inventory, and then staple the reports together. The same server shows up as three different objects to three assessors, so the total doesn't measure one architecture. A scanner can confirm that things are unified. It can't unify them. Next, why programs stall even after buying a tool for every pillar.

## Slide 5 — Five pillars, three capabilities: why programs stall

The maturity model looks like five pillars, so programs buy five tools. But underneath sit three capabilities that run the pillars together, and governance is the one nobody sells. That's why programs stall. Pillars get administered but not governed, evidence lives in each tool's format and can't be re-run, and drift turns up only when an auditor finds it. The model's own text says advanced maturity means coordination across pillars. Another per-pillar tool doesn't move that needle. So what does? Five governance principles, starting with identity and privilege.

## Slide 6 — Principles one and two: defend identity and privilege

First, identity. The program makes identity the root that everything else is named through, but that's a naming claim, not a trust claim. The 2023 forged tokens passed every check, so the identity plane is the highest-value target you have. That means sessions you can revoke quickly, phishing-resistant sign-in, and its own monitored log stream. Second, privilege. Standing admin access is the model's lowest stage. Make it eligible and time-boxed, keep emergency accounts tested and watched, and never grant admin rights just because a group has a certain name. Next, the principles about evidence, enforcement and the boundary.

## Slide 7 — Principles three to five: evidence, enforcement, boundary

Principle three: evidence has to be something an assessor can re-run and get the same answer from. If it can't be reproduced, it's an assertion. Principle four: a policy that only produces a dashboard is a report, not a control. Enforcement can still wait for a human approval, but something has to happen when the running state breaks the rule. Principle five: model the cloud boundary. Government clouds don't have every commercial feature, and each mandate stops somewhere. Write those gaps down as governed findings. Now, which documents actually set requirements?

## Slide 8 — Four documents, four kinds of authority, no score

Zero Trust programs get argued by citation, and most citations don't survive a check. Only the executive order and the OMB memo are binding. CISA's maturity model calls itself a general guide, and NIST's architecture is guidance too. Other instruments bind particular surfaces, like cloud tenant configuration and logging. And several popular claims simply don't exist. There's no required maturity stage, no federal Zero Trust score, and no rule that you decrypt all traffic. Knowing that saves a lot of misdirected work. So what does the OMB memo actually require?

## Slide 9 — What M-22-09 requires, pillar by pillar, in October 2026

The OMB memo sets specific actions for each pillar, and they're more precise than people quote. Phishing-resistant sign-in has a definition, and it means turning off text codes, one-time codes and push approvals for routine staff access. The network action is an isolation plan, not a product. One device signal is the floor, not the goal. The deadlines have passed, but nothing rescinded the memo, so treat its actions as an existing obligation, and read its logging line through the newer logging memo. That's Module 1. Next, the Microsoft cloud baseline and the tools that measure it.

## Slide 10 — Module 2: SCuBA, the two tools and beyond Microsoft 365

Module 2 gets concrete. CISA's cloud directive names exact settings and tells you how to prove them. We'll cover what it requires, the two assessment tools agencies run, and everything those tools can't see beyond Microsoft 365.

## Slide 11 — BOD 25-01: six required actions and a tight scope

CISA's cloud directive has six required actions. Half of them are paperwork: list your tenants, deploy the tools, explain your deviations. Agencies did those quickly. The other half is the real point: implement the mandatory settings, keep up as they change, and baseline every new tenant before it's authorized. In practice that means remediation, and much of it depends on architecture outside the tenant. Scope is tighter than people think, too. It's production software-as-a-service tenants only, so cloud infrastructure subscriptions are out. So measure compliance by what's fixed, not by what's reported. Next, what the mandatory list contains.

## Slide 12 — The mandatory list is a subset of the baselines

The mandatory list is a subset of CISA's full baselines. For Microsoft 365 it's fifty policies, out of well over a hundred in the baseline documents. Treating every recommendation as binding is one mistake; treating the list as all of good practice is the other. The list also moves. Policies get revised, the next tool release adds more, and Google Workspace is now in scope with a December deadline. The rule is simple: CISA's page governs, so track it, and pin the baseline version you assess against. Next, how results reach CISA, and where the directive stops.

## Slide 13 — Reporting to CISA, and what the directive doesn't cover

There are four ways to report to CISA, from fully hosted to manual quarterly uploads. Whichever you pick, the evidence is the tool's own results file, never renamed, and any approved deviation shows up as omitted, with a reason. That file and that rationale matter more than the pretty report. And remember the edge. The directive covers cloud tenant settings. It says nothing about the on-premises directory, old authentication protocols, endpoints or networks. A perfect tenant can sit on top of a messy forest. Next, the two tools agencies use to measure all this.

## Slide 14 — ScubaGear and the Zero Trust Assessment at a glance

Agencies often run two free tools and then wonder if they need both. They do, because they ask different questions. CISA's tool asks whether your Microsoft 365 tenant meets the federal baseline. Microsoft's tool asks how mature your environment is against Microsoft's Zero Trust guidance. They run differently, label findings differently and score severity differently. And read-only doesn't mean low privilege. Both need broad read roles and an admin consent, and some products need admin roles. Test the exact roles in your tenant before you write the run book. Next, where the two tools overlap and where they don't.

## Slide 15 — Where the two tools overlap, and the inverse gap

The tools overlap mostly on identity, and now partly on email threat protection. But overlap means the same area, not the same checks. Microsoft's tool goes much deeper on identity, and it alone covers devices, networking and data. CISA's tool alone covers mail flow, Teams, sharing and Power Platform, and almost half the mandatory policies live there. So dropping either one leaves real gaps, and dropping CISA's tool also stops the reporting the directive requires. Keep both, and reconcile them by control. Next, everything outside Microsoft 365.

## Slide 16 — Beyond Microsoft 365: each tool answers for its platform

Outside Microsoft 365, every provider's tool tells you its own limits, in its own words. One covers only a subset of controls. Another calls its compliance view partial. The hypervisor guidance warns its assumptions may not fit your environment. And a FedRAMP certification covers the provider's service, not how you configured it or connected it to everything else. So running every vendor's tool gives you a pile of reports, one per vendor. The agency is the only party that can hold one posture across them. Next, what has to be reconciled before any score means something.

## Slide 17 — Reconcile first: inventory, naming, no implicit trust

Before you assess, reconcile three things. One inventory, so nothing is counted twice. One naming authority, so a workload has the same name everywhere. And no implicit trust from any boundary, whether that's a VPN, a default cloud network or a flat virtual segment. Then harden two things. The hypervisor management plane gets assessed as its own surface, because guest tools can't see it. And the unified plane you just built becomes the most valuable target in the estate, so it gets top-tier admin controls and its own monitoring. That closes Part 1. Part 2 is about who owns it.

## Slide 18 — Module 3: Who owns Zero Trust, and close before assessing

Module 3 is about ownership and order. Every pillar has an owner, but the overall posture usually doesn't. We'll name who decides what, then look at why you close the known findings before running the maturity assessment.

## Slide 19 — The posture needs an owner no pillar or provider holds

Programs rarely lack owners. They lack an owner for the posture itself, the person who can say what the agency-wide score covers. That can't be a pillar owner, and it can't be whoever manages the biggest cloud vendor relationship. In the program's model, a Zero Trust program lead owns the score's definition, cross-pillar routing and the assessment calendar. Risk acceptance stays with the authorizing official. And here's the subtle part. Omitting a policy from a tool's report looks like configuration, but it's a risk decision. The engineer types it; someone with authority decides it. Next, the matrix that pins that down.

## Slide 20 — The responsibility matrix: one decider per row

The responsibility matrix gives every decision exactly one decider. A few rows carry the weight. The program lead defines what the whole-agency score covers, because everyone else has a reason to shrink it. An exception with an end date is the CISO's call. One with no end date is a standing risk acceptance, so it goes to the authorizing official. Drift goes to the authorizing official too, because it's a change to an authorized system. And a vendor's own tool is evidence for its own platform, never the agency's score. Next, the roles people need in each system.

## Slide 21 — Least-privilege roles for running and reading the tools

Decision rights don't change what a console lets someone do. Roles do, and these tools need broad read access to every tenant. So the operators run as readers, with admin roles only where a product truly needs them. The one-time consent is granted by an administrator who doesn't then run the assessment. Those assessment accounts are among the most sensitive identities you have, so make them eligible rather than standing, and send their sign-ins to the SOC. Even the tool's telemetry setting is a CISO decision, not something decided on the day. Next, the order of work.

## Slide 22 — Architecture first: the assessors run at step five

Here's the discipline of this book. The assessment tools are thermometers. They measure deviation; they don't fix any. Run them as your program before the architecture exists, and you get an accurate list that never shrinks. So the program's sequence puts them at step five. First understand the gaps, design the fix, build it and govern it. Then the tools confirm the built state, and the authorizing official decides. That's the same order as NIST's risk framework. And it means building naming, device identity and the retirement of old protocols first. Next, what to do with each finding today.

## Slide 23 — Route every finding to one of three responses

Not every finding has to wait for architecture. Each one goes to exactly one response. If it's a simple setting with no dependencies, change it now. If it depends on a layer that doesn't exist yet, it gets an owner and a date against that work. If the deviation is needed for now, it becomes a dated risk acceptance by the authorizing official. The only real failure is a finding with no response at all. Then a continuous layer tracks every open item as it ages, run to run. That closes Module 3. Next, running the assessment.

## Slide 24 — Module 4: Running the assessment, evidence not verdicts

Module 4 is the run itself, and what happens to the output. A saved report is an opinion from one day. The same output, sealed with its provenance so an assessor can rebuild it later, is evidence. Let's see how.

## Slide 25 — Before the first run: scope, host, accounts, output, logs

Five decisions come before either tool touches production. Scope: which tenants and subscriptions this run covers, written down. The host: a dedicated Windows machine inside your boundary, a clean one for each tool, never a shared internet build runner. Accounts: a dedicated reader for each tool, with consent granted separately. Output: treat every report as sensitive, because it's a map of your weaknesses, so move it unaltered into the evidence store and delete the local copy. And logging: the assessment accounts' sign-ins belong in your agency logging plan now. Next, the run itself.

## Slide 26 — Running both tools: pin, record, never edit the output

For both tools, three habits matter. Pin the version, and record it with every run, along with the configuration file that holds your exceptions. Keep the results file exactly as the tool wrote it. Never edit or rename it; only hash it and copy it. And expect quirks. Microsoft's tool is a fast-moving community project, it can run for more than a day on a big tenant, and you shouldn't stop it halfway. One honest gap, too: the Google Workspace assessor isn't wired into the program's evidence chain yet. Next, how a result becomes evidence.

## Slide 27 — From result to claim: four stages and one worked trace

Each tool becomes an input to one evidence chain. Every result, passes included, gets wrapped with where it came from, who issued it and a hash of the raw output. The results from one run are sealed into a bundle that rebuilds byte for byte from the same inputs, so an assessor can check it months later. Then it's emitted in NIST's machine-readable assessment format. Follow one failed legacy sign-in check through those four hops, and you can walk back from the final record to the raw result without re-running the tool. Next, how to read the results before counting them.

## Slide 28 — Findings, manual checks and absence of evidence

Before you count results, read them. Only fails, warnings and items flagged for investigation are findings. A skipped check isn't a pass, and it isn't a gap. It's absence of evidence, often because a license or a connection was missing. In a government cloud, some premium features simply aren't available, so a skipped or failed premium check may not be a real gap. Score it as failed and you overstate the problem; score it as passed and you overstate your posture. Record it as a boundary finding instead. Next, scoring and reconciling.

## Slide 29 — Score, rank and reconcile at the control, not the tool

Findings get ranked by severity and effort, so a serious problem with a cheap fix rises to the top. Quick wins go into the next change window; big projects go onto a pillar roadmap with funding. That scoring is the program's own method, documented so anyone can check it, and a top priority still isn't a risk acceptance. Then reconcile the two tools by control, not tool to tool. When both flag the same setting, that's one finding with two pieces of evidence and one owner. Next, exceptions and re-assessment.

## Slide 30 — Exceptions, POA&Ms and re-assessment on a cadence

Some findings won't be fixed soon, and that's fine if it's governed. Exceptions live in the tool's configuration file, under version control, with an expiry date and a named approver. Whatever isn't fixed or excepted goes on the plan of action and milestones, with an owner and the evidence that will prove it closed. Then re-run on a calendar and after each remediation wave, so findings close by evidence, not by ticket status. Each run adds an interval, and anything that newly breaks goes to the authorizing official. Next, how this maps to controls.

## Slide 31 — Requirements mapping: the controls the evidence supports

The requirements map is careful about what it claims. It helps you reuse the design and evidence in your own plans; it doesn't certify anything. It shows which controls Zero Trust evidence supports, which book builds each capability, and what an assessor should expect to see. It's honest about gaps, too, like incident response and data protection, which aren't designed here yet. And one detail worth knowing: no control in the NIST catalog mentions Zero Trust. The evidence supports controls you already have. Let's finish with the decisions.

## Slide 32 — Decisions for this quarter, none of them a purchase

None of this needs a procurement. This quarter, find out which pillar evidence can be re-run without the operator. Name an owner for the whole posture, separate from any cloud vendor. Bring one tool into the evidence chain. Move exceptions into version control, with expiry dates. Send drift to the authorizing official. Model the cloud boundary, reconcile the inventory first, and time-box privileged access, including the assessment accounts. No tool certifies Zero Trust maturity. The evidence supports the decisions, and named people make them. Thank you.
