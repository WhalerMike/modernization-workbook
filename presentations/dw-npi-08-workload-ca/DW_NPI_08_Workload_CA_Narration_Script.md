# Building Non-Person Identity, Chapter 08 — Conditional Access for Workload Identities — narration script (practice copy)

## Slide 1 — Chapter 08: Conditional Access for Workload Identities

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 8: Conditional Access for workload identities. A stolen client secret works from anywhere, unless something says where the workload is allowed to be. So that place is written down, reviewed, and enforced one ring at a time. We'll start from Learn's own sample policy, see why Graph would refuse it as published, then walk the scope file, the checks, the plan, enforcement by ring, the sign-in reader and the alert, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — What workload Conditional Access can and can't do

Why does this chapter matter? Because a stolen secret works from anywhere, and Conditional Access is how you pin a workload to its own networks. Learn is short and firm about what it can do: block from outside known ranges, or on risk, and blocking is the only control. Four limits then decide the whole scope: you need the premium license, only single-tenant apps are covered, managed identities aren't, and a policy assigned through a group simply isn't enforced. For this estate, everything goes to the worldwide Graph endpoint.

## Slide 3 — The program's two policies and its two decisions

The program's design comes from Book 4: two policies. One blocks workloads from anywhere except their named egress ranges. The other blocks them when Microsoft's risk detection marks them high. They roll out report-only first, then ring by ring, and they're never deleted on rollback. Two decisions frame it. The licensing decision covers the top-tier single-tenant apps. The enforcement decision is the security chief's: enforce, wait longer, or enforce with dated exclusions. And don't worry when the risk policy reports nothing; that's normal until something is actually risky.

## Slide 4 — Learn's sample JSON, pinned and checked

Here's Microsoft's starting point. Learn's page gives portal steps for both kinds of policy, says to save them report-only first, tells you where to read the results, and ends with one sample policy in JSON for the beta Graph endpoint. The repository searched Microsoft's sample repositories and found nothing else to start from. So the page is pinned, unmodified, with checked hashes and a weekly watch, and its one JSON block is extracted and sent to a fake Graph and to the program's own pre-merge check, exactly as if someone had committed it.

## Slide 5 — What the sample leaves to you: values and targets

The sample's shape is right, and the code keeps it as the model for the location policy. But the values aren't values. The state field is literally the text "enabled or disabled", and the service principal ID is a placeholder in brackets, so Graph refuses it outright. Worse, the easy ways to fill it in are dangerous. One option covers every service principal in the tenant, reviewed or not. Another trusts every network you've marked trusted for people, too. The code allows only reviewed object IDs and one dedicated, untrusted named location.

## Slide 6 — What it leaves to you: risk, evidence, scope, rings

The rest of the gaps are about what a program needs around one policy. A field the stable API marks required is missing. There's no JSON at all for the risk policy. The results live only in the admin center, where a pipeline can't keep them as evidence. There's no record of who's in scope, who's out, and why. And there are no rings and no alert, so enforcement is all or nothing and nobody hears about a block. So the verdict: keep the sample's shape, and don't create it as published.

## Slide 7 — The code and its reviewed files, one policy per ring

What does the code add? Its own module, building on Chapter 1's core, and unlike the earlier read paths, this one can write Conditional Access, so it's careful about how. The two policies, the named location and the alert are reviewed files. The scope file is the record Gate 5 asks for: who's in, by object ID and ring, who's out and what covers them instead, and the decisions. Each policy is rendered once per ring, so enforcing one ring changes one policy and leaves the next one in report-only.

## Slide 8 — The pre-merge and tenant check: NPI-WCA-01 to -09

There are two checks: one reads only files and runs on every pull request, the other runs against the tenant on every plan. Most of the nine rules come straight from Learn's limits: assign by object ID, never by group; no managed identities; single-tenant apps only; and an object ID that really is the enterprise application. The program adds its own: the licensing decision must be recorded, every policy file stays report-only and block-only, egress ranges stay narrow, and enforcement needs the security chief's decision and a reviewed sign-in summary.

## Slide 9 — The plan, the dry run and the writes

The plan compares the files with the tenant, property by property, and gives each policy one action. Two details matter. A new policy is always created report-only, even if its ring is approved for enforcement; it turns on in the next run. And a policy someone made by hand in the portal is reported, never deleted. Run as the read task, the client simply can't send a write. Run as the apply task, it refuses on any finding. Rollback follows Book 4: take the ring off the record, and its policies go back to report-only.

## Slide 10 — Enforcement, ring by ring: five conditions

Turning a policy on is the moment a production job can stop, so the code asks for five things at once, or the ring stays held in report-only with the reason written down. The security chief's decision must mark the ring. The change must explicitly allow enforcement. A reviewed sign-in summary must be cited by its hash. That summary must show the ring ready. And every earlier ring must already be enforced. Exclusions are allowed, but each one has an owner, a reason and an end date, and it drops out by itself when that date arrives.

## Slide 11 — The sign-in reader, its summary and the block alert

The evidence comes from the service principal sign-in logs, and there are three traps. Without the right filter you only get interactive sign-ins. Without a Conditional Access read permission, the policy results are silently left out. And without a special request header, the report-only results come back as an unknown value. The reader handles all three, and throws rather than guessing. It gives each principal a status, and a ring is ready when everyone's clear for two weeks. Once enforced, a block alert goes to security operations.

## Slide 12 — Who owns the policies, and what each task may hold

Who's involved? Developers build it. Identity engineers own the policies. Application owners have workloads in scope, and the security officer and security operations review results and receive the alert. Three tasks split the permissions. Reading needs only policy and application read. Reading sign-ins needs the audit log permission plus the narrowest of the three ways to see policy results; Learn doesn't rank them, so the chapter picked by name. Only the apply task holds the write permission, and a test keeps every task's permissions equal to its calls, with no delete anywhere.

## Slide 13 — Lab 1: Learn's sample, then the pre-merge check

Lab 1 runs on a laptop, with the fixture's date fixed at the end of October. First you run the tests on Learn's sample as published, and read the one where the fake Graph refuses it, because its state is just display text. Then list what each task needs. Then run the pre-merge check on the repository's own files, which passes cleanly; a finding would fail the pipeline. And then the instructive step: run the same check on Learn's sample, and it reports five findings, one for each of the dangers we walked through earlier.

## Slide 14 — Lab 1: the plan and the sign-in summary

Next, plan against the fictional tenant, sending nothing. The named location is missing its IPv6 range, so it's an update. Ring 1's location policy already exists and matches. Three policies are new. And a policy someone made in the portal, covering every service principal, is reported but left alone. Then read the sign-ins. Ring 1 is clear and ready. In Ring 2, a deploy bot signed in from an address outside the egress ranges, so it would be blocked, and that ring isn't ready. Notice that no user sign-ins come back at all.

## Slide 15 — Lab 1: apply twice, enforce Ring 1, read the alert

Now apply the plan to the fake, twice. The first run sends four requests, and the second sends none, because everything already matches; and every workload policy is report-only, while an unrelated user policy is untouched. Then try to enforce Ring 1. Record the decision and the summary's hash, and plan without the enforcement switch: the ring is held, with the reason. Add the switch and the summary, and the location policy turns on, while the brand-new risk policy waits for the next run. Change one byte of the summary, and it's held again.

## Slide 16 — Lab 2: a test tenant, report-only, then one ring

Lab 2 uses a test tenant with a Premium trial, never production. You write a scope with one test app, by its enterprise application ID, and an egress range of exactly one address. A reading app plans with read permissions only. Then you add the write permission, apply twice, and confirm everything landed report-only. Generate sign-ins from inside and outside the range, and read them with a separate reader. After two clear weeks, enforce Ring 1 in its own change, and watch the outside sign-in get blocked. Then back it all out.

## Slide 17 — Dangers, and the guard for each

Several of these dangers are quiet ones: a policy that looks configured and enforces nothing, because the app was assigned through a group, or by the registration's ID instead of the enterprise app's. Others are loud: switching a policy straight on, so a workload that moved stops at once. And some hide in the evidence: report-only results that never came back, so the summary looks clean, or a block nobody hears about. Then the slow ones: a lapsed license, so a fix can't ship, and a write permission left lying around. Each has a guard.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The licensing decision is recorded. Every in-scope app is top-tier, single-tenant, listed by its enterprise application ID, in exactly one ring, and everything out of scope names the control that covers it instead. The egress location holds only the workload ranges and isn't trusted. Every policy started report-only. Each ring was enforced in its own change, on two clean weeks of reviewed evidence, with the alert already in place. Next, Chapter 9 takes on AI agent identities. Thanks for watching.
