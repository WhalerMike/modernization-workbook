# Building Provider Notices, Chapter 04 — AWS Health — narration script (practice copy)

## Slide 1 — Chapter 04: AWS Health

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 4: AWS Health. AWS tells each account which of its instances will be retired, and when. The API that says so needs a support plan, a policy you write yourself, and the right partition. We'll start from AWS's own documentation for the Health API, see what it leaves to you, then read the kit's collector, its kinds and its partition guard, and walk two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why AWS Health, and what done means

Why this chapter? AWS already tells each account, in writing, which instances will be retired and when. The gap is that nobody reads it unless something collects it. So the goal is concrete. By the end you can read every open and upcoming AWS Health event for an account, with a policy that allows three read actions and nothing else, into records that name the affected resources and say whether AWS or the kit decided the event needs action. It's for developers who maintain the kit, the account owner who owns this gate, and whoever owns the account's support plan.

## Slide 3 — Which partition, for this read

Next, which partition. AWS documents two with different Health endpoints. For commercial accounts the active endpoint is in U S East 1. In AWS GovCloud there's a single regional endpoint, in U S Gov West 1, and AWS's GovCloud guide says EventBridge there doesn't send public events from the Service Health view, so a scheduled read through the API is the path. The kit never guesses. The settings name the partition, the region comes from it, and the caller's identity must be in that partition, because a GovCloud account read from the commercial endpoint fails, or worse, reads nothing.

## Slide 4 — What AWS's documentation gives you

Here's AWS's starting point. The Health API reference defines the event: its service, its type code and category, its region, its times, its status, and newer fields such as actionability and personas. The command line's describe events lists them. A second operation returns each event's latest description, one to ten events at a time, and a third names the affected resources. The API needs a qualifying support plan, or it answers with a subscription-required error. And AWS's policy examples grant a wildcard over the describe actions; AWS publishes no read-only managed policy for Health, and the full-access one includes writes.

## Slide 5 — AWS's pages disagree on the support plan

One point deserves its own slide, because AWS's own pages don't agree. The Health concepts page names the newer Business Support Plus, Enterprise Support or Unified Operations. The API reference's welcome page and the GovCloud page name the older Business and Enterprise plans. Without a qualifying plan, the API answers with a subscription-required error, and nothing is read. So the chapter's advice is simple: confirm the account's plan with AWS Support rather than reading it off one page. The kit surfaces the error in AWS's own words, the runbook's pre-flight calls the API first, and the Health Dashboard is the interim path.

## Slide 6 — What it leaves to you, and the verdict

What does AWS leave to you? The event list comes without descriptions or resources, and an event without them can't be routed, so the kit fetches both for every event, ten at a time. No category says retirement or security. AWS's actionability flag is AWS's own, so the kit uses it as published, and labels it as AWS's. A retirement without that flag could look optional. Times are epoch seconds. And a wildcard policy grows as AWS adds actions. Each gap is pinned by a test. The verdict: use AWS's three operations as published, with exactly three actions, and build the batching, the kinds and the partition guard.

## Slide 7 — The collector: three calls, ten ARNs at a time

Now the code. The collector makes three declared calls. First, describe events, filtered to events that are open or upcoming. Then, for those events, the details call for each one's latest description, and the affected-entities call for the resources it names, each ten event identifiers at a time, because AWS's details operation takes one to ten. Then the normalizer builds the record. The title comes from the service and the event type code, like E C 2, instance retirement scheduled. A closed status closes the record. And in a live run, the region is the partition's own Health endpoint region.

## Slide 8 — Category to kind, and who said action is required

The normalizer maps AWS's categories to the record's kinds. Issues and investigations are incidents. A scheduled change whose event type code names a retirement, a lifecycle event, a deprecation or an end of support is a retirement; any other scheduled change is maintenance. An account notification with the security persona is security; otherwise it's an advisory. For every kind, AWS's actionability flag decides first, and the record says provider. Only a retirement without that flag falls to the kit's own rule: action required, due at its start, and the record says rule. The two sources are never mixed.

## Slide 9 — The partition guard, and the tests

Before a live run reads anything, the kit checks who it's signed in as. It asks AWS's security token service for the caller's identity, once, and refuses a caller whose identity isn't in the partition the settings name. The region is that partition's Health endpoint region. When the tool fails, for example with the subscription-required error, the error surfaces in AWS's own words. The tests pin all of this: six in the collector's AWS block, plus the live tests for the endpoint per partition, the eleven-identifier refusal, the caller guard and the support-plan error.

## Slide 10 — Who owns it, and the policy it may hold

Who's involved? Developers maintain the kit. The AWS account owner owns this gate, including the reader's policy. And whoever owns the support plan confirms it with AWS Support, or records the gap with the security officer. The policy is the whole permission story: a customer managed policy with exactly the three describe actions the kit calls, and nothing else. Not AWS's wildcard example, because a wildcard grows as AWS adds actions, and never the full-access managed policy attached for convenience, because then the reader can write.

## Slide 11 — Lab 1: what AWS needs, and each partition's region

Lab 1 needs only PowerShell 7 with Pester, working in the kit's folder. The lab settings name AWS's own documentation account, in the commercial partition, and nothing signs in. Step 1 lists what AWS needs: three calls, each with one read action, and each verified against AWS's documentation. That's the whole policy. Step 2 shows each partition's Health endpoint region and the prefix a caller's identity must carry: U S East 1 for commercial, U S Gov West 1 for GovCloud.

## Slide 12 — Lab 1: collect AWS, then read the records

Step 3 collects AWS from the day-one fixtures. Five notices, four open, three needing action, and every one valid against the schema. Step 4 reads them as a table. Two retirements, an instance retirement and a Lambda lifecycle event, each with a due date and the affected resource. Maintenance on a database. A security notification. And a closed incident. Notice that every row but the incident names the resource it affects, because the kit fetched the affected entities for every event.

## Slide 13 — Lab 1: who said so, and the GovCloud request

Step 5 shows who said each notice needs action. The instance retirement and the security notification carry AWS's own actionability flag. The Lambda lifecycle event carries the kit's rule: a scheduled change whose type code names a retirement, due at its start time. Step 6 switches the partition to GovCloud in memory and builds the command a live run would use, without sending it. The region is U S Gov West 1. Step 7 asks for details of eleven events in one call. AWS's operation takes one to ten, and the kit refuses before anything runs.

## Slide 14 — Lab 1: the tests, then Lab 2 in a test account

Step 8 runs this chapter's tests: eleven passed, none failed, and the manifest lists the three calls with their actions. Then delete the output. Lab 2 moves to an AWS test account with a qualifying support plan, never production. Without the plan, the subscription-required error at step 3 is the expected result. Create the policy with exactly the three actions and attach it to the reader's role. Check who you're signed in as: the identity must be in the commercial partition. Cross-check AWS's own event count against the kit's collection. Then detach and delete the policy, and delete the run, because it names the account's resources.

## Slide 15 — Federal requirements and the evidence

Each output is evidence for something specific, against NIST's control catalog. The three-action policy, and the reads going to the partition's own endpoint as a caller in that partition, support monitoring an external service provider. The run folder shows every open and upcoming event was read with its description and resources, which supports receiving security alerts and advisories. And events AWS marks action required carry AWS's due date, which supports carrying out directives in their time frames, through the task Chapter 6 routes. The indicators are FedRAMP's, and the mapping is the program's. The kit's records support these controls; the assessor decides them.

## Slide 16 — Dangers, and the guard for each

What breaks in production, and what guards against it? No support plan, and nothing is read: the error surfaces, the runbook's pre-flight calls the API first, and the Health Dashboard is the interim path. The full-access policy attached for convenience lets the reader write, so the kit uses three actions. A GovCloud account read from the commercial endpoint fails, so the partition names the region and the caller is checked. Eleven identifiers in one call are refused before calling. A retirement without AWS's flag could stop an instance on its date, so the kit's rule makes it action required. And in GovCloud, EventBridge won't bring public events, so the kit reads on a schedule.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. The account has a qualifying support plan, or the gap is recorded with the security officer. The reader's policy holds exactly the three describe actions the kit calls. The settings name the partition, and the caller's identity is in it. AWS's own count and the kit's collection agree in the test account. Every retirement has a due date and its resource. And the test policy was detached and deleted. Next, Chapter 5: Google Cloud's Personalized Service Health, the smallest collector, with the largest gaps. Thanks for watching.
