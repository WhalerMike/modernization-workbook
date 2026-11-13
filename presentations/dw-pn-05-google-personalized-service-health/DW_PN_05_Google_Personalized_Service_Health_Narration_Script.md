# Building Provider Notices, Chapter 05 — Google Cloud Personalized Service Health — narration script (practice copy)

## Slide 1 — Chapter 05: Google Cloud Personalized Service Health

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 5: Google Cloud's Personalized Service Health. It's the smallest collector, with the largest gaps, and saying plainly what it can't see is part of the job. We'll start from Google Cloud's own documentation for the events API and the viewer role, see what it leaves to you, then read how the kit fills the record, which two gaps it writes down instead of hiding, and why one call is refused. Then two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why this chapter: read it, and say what's missing

Why this chapter? Because Google's notices are the narrowest of the five providers, and the danger is an empty list that looks like good news. So the goal has two halves. By the end you can read a project's or an organization's Personalized Service Health incidents, with the viewer role, into records the router and the weekly digest treat like any other provider's. And you can tell the security officer exactly what Google's notices don't cover. It's for developers who maintain the kit, the project owner who owns this gate, and the security officer, who records the gaps.

## Slide 3 — Which cloud and which scope, for this read

Next, which cloud and which scope. Unlike Azure or AWS, Personalized Service Health has no separate government endpoint in the kit's table, so the cloud is simply global, and each record links to the event on Google's Service Health host. The scope comes from the settings: a project, which is the call Google's command line was verified for, or an organization when the settings say so. The API is enabled once per project. And for government workloads, the question isn't an endpoint at all, but a package: as we'll see, Personalized Service Health isn't in the Assured Workloads FedRAMP or impact-level packages.

## Slide 4 — What Google Cloud's documentation gives you

Here's Google's starting point. Google Cloud's REST reference documents the project events list, with its permission, and an organization equivalent. The event resource has a category whose only value is incident, plus a state, a detailed category, relevance, its impacts by product and location, and its updates over time. Planned maintenance isn't in it. The API is enabled once per project. The Personalized Service Health Viewer role reads it. And the command line lists a project's events at the global location.

## Slide 5 — Gap one: incidents only, no planned maintenance

Here's the first gap, and it's built into Google's API. The event's category has one value, incident. Planned maintenance isn't in the resource at all. So maintenance and retirements never arrive through this API, and no amount of code changes that. What the kit does is refuse to hide it. Every Google notice is recorded as an incident, and the gap is written in the guide, in this chapter and in the security officer's record, and it shows in the weekly digest's provider table. Google's maintenance reaches the project by other channels. The danger is assuming it's covered, and a maintenance window landing with nobody told.

## Slide 6 — Gap two: not in the FedRAMP or IL packages

The second gap is about government packages. Google Cloud's Assured Workloads supported-products page lists Personalized Service Health under twenty-five regional packages, including the U S Data Boundary, but not under FedRAMP Moderate, FedRAMP High, I L 2, I L 4, I L 5, C J I S or I T A R. So a workload in one of those packages has nothing to read, and an empty list there looks like good news when it isn't. The kit's answer, which is the program's design guidance, is to record the package as a gap with the security officer, who decides the compensating channel.

## Slide 7 — What it leaves to you, and the verdict

What else does Google leave to you? Impacts are nested product and location objects, so the kit turns them into the record's services and regions. An event's description is sometimes empty, so the kit takes the latest update's text. Nothing says action is required, and the kit adds no rule of its own here: an open incident that names resources routes by the agency's rule, in Chapter 6. The organization call is verified in REST but its command-line flags weren't read, so it's marked unverified. And two response shapes are both accepted. The verdict: use Google's project call and viewer role as published, build the mapping, and write the gaps down.

## Slide 8 — The collector: incidents into the record

Now the code. The collector makes one declared call: the project's events, or the organization's when the settings' scope says organization. The normalizer keeps only incident events; anything else would be left out and counted. An event whose state is closed closes the record. Products and locations from the event's impacts become the record's services and regions. The detailed category and relevance are kept as the provider's severity. And the source link is the event on Google's Service Health host. Personalized Service Health has no separate government endpoint in the kit's table, so the cloud is global.

## Slide 9 — The unverified call, and the tests

One call gets special treatment. Google's REST call for organization events is verified against Google's documentation, but the command-line group for it is listed on the beta reference, and its exact flags weren't read. So the kit marks the call unverified, and the live invoker refuses to run it unless someone passes an explicit override. It stays out of the scheduled run until someone reads those flags. A command run on a guess is how a read goes wrong. The tests pin it: six in the collector's Google block, plus the live tests for the project command and the refusal.

## Slide 10 — Who owns it, and the role it may hold

Who's involved? Developers maintain the kit. The project owner owns this gate: enabling the API and granting the viewer role. And the security officer keeps the role binding and records the two gaps. The permissions are short. The project call needs the viewer role on the project. The organization call needs the same role on the organization, and it's the unverified one. Grant at the project unless the settings' scope really is organization, because a viewer role granted at the organization for a project read is more read scope than needed. Nothing the reader holds can write.

## Slide 11 — Lab 1: what Google Cloud needs, and week one

Lab 1 needs only PowerShell 7 with Pester, working in the kit's folder. The lab settings name a fictional project, and nothing signs in. Step 1 lists what Google Cloud needs. The organization call carries its reason for being unverified: verified is false. Step 2 collects the day-one fixtures: two notices, both incidents, one open, none needing action, both valid against the schema. Step 3 reads them: one open and one closed, with products and locations taken from their impacts, Cloud S Q L in U S East 4, and Cloud Storage in U S Central 1.

## Slide 12 — Lab 1: week two, and only one kind

Step 4 collects the second week. The open incident has closed: both records are closed now, each with the end of its window. Step 5 groups both weeks by kind, and there's only one: incident, four times. That's the first gap made visible. However many weeks you collect, maintenance never arrives through this API, which is exactly why the chapter writes it down with the security officer rather than letting an all-incident list suggest that nothing is planned.

## Slide 13 — Lab 1: the refusal, the command, the tests

Step 6 switches the scope to organization in memory and asks the live invoker for the organization call. It refuses before it starts the Google command line, because the call isn't verified, and the message says why: the group is on the beta reference, and its flags weren't read. Step 7 builds the project command a live run would use, without running it: service health events list, for the fictional project, at the global location, as JSON. Step 8 runs this chapter's tests: eight passed, none failed. Then delete the output folder.

## Slide 14 — Lab 2: a Google Cloud test project

Lab 2 moves to a Google Cloud test project, never production, and no incidents is a valid result. As the project owner, enable the API and grant the viewer role to the reader's group. Sign in as the reader. Cross-check with Google's own command: its count and the kit's collection should agree. Then the step that matters most in this chapter: record the gaps with the security officer. Planned maintenance doesn't come through this API, and a project in an Assured Workloads FedRAMP or impact-level folder has no Personalized Service Health at all. Finally, remove the role binding and delete the run.

## Slide 15 — Federal requirements and the evidence

Each output is evidence for something specific, against NIST's control catalog. The viewer role, and nothing that writes, supports monitoring an external service provider. The run folder shows every incident was read, which also supports receiving security alerts and advisories. A call nobody verified isn't run. And the gaps written down support updating the risk assessment, which is the evidence this chapter adds that no other provider chapter needs. The indicators are FedRAMP's, and which output supports which indicator is the program's mapping. The kit's records support these controls; the agency's assessor decides them.

## Slide 16 — Dangers, and the guard for each

What breaks in production, and what guards against it? Assume Google's maintenance is covered, and a maintenance window lands with nobody told; the guard is the gap written in the record, the digest and the security officer's file. Expect Personalized Service Health in a FedRAMP or impact-level workload, and an empty list looks like good news; the guard is recording the package, so the security officer can choose a compensating channel. Run the unverified call, and you've run a command whose flags nobody read; it's refused. And grant the viewer role at the organization for a project read, and you've granted more than needed.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. The API is enabled on the project, and the reader's group holds only the viewer role. Google's list and the kit's collection agree in the test project. The organization call stays unverified, and out of the scheduled run, until someone reads its flags. The test binding was removed. And the two gaps are written down: planned maintenance, and any workload in an Assured Workloads FedRAMP or impact-level package. Next, Chapter 6 routes what all five collectors gather to owners, as Ticket-to-Machine tasks. Thanks for watching.
