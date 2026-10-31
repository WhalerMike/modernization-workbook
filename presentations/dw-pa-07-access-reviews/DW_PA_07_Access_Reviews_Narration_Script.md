# Building Privileged Access, Chapter 07 — Access Reviews of Privileged Roles — narration script (practice copy)

## Slide 1 — Chapter 07: Access Reviews of Privileged Roles

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 7: access reviews of privileged roles. Eligibility only ever grows unless someone confirms it on a calendar, so this chapter makes the reviews code: one file says who reviews which role and when, a dry run shows the change, and the decisions come back as evidence. We'll start from Learn's tutorial for reviewing administrative roles, see what it leaves to you, then walk the series, the checks, the evidence, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why reviews, and why as code

Why reviews at all? The approval gate from the earlier chapters controls when privilege is used. Reviews control who keeps the right to use it. Without them, eligibility only grows. Book 04 sets the schedule: the most sensitive tier every month, the rest every quarter, with access removed when reviewers stay silent. And why as code? Because a review set up by hand drifts. Someone leaves, a duration gets shortened, auto-apply is switched off once and never back on. In code, every series has a file, a diff and a reviewer.

## Slide 3 — What it costs, and which cloud it runs in

Two practical questions next: what does it cost, and where does it run. Access reviews belong to Entra ID Governance. Learn's tutorial says the P2 license or Governance will do, but the licensing page asks for Governance for everyone who reviews or is reviewed, so the program budgets for the stricter one. As for the cloud, this estate's GCC tenant uses the worldwide Graph endpoint, and its Azure is commercial. The Graph review APIs are listed for the government clouds too. The Azure role reviews, though, run on a preview API, and their government availability isn't confirmed.

## Slide 4 — Learn's tutorial, pinned and run against a fake

Here's what Microsoft gives you. Learn's tutorial walks through the whole life of one review: create a recurring review of one administrator role, list its instances and decisions, approve one person and deny another, apply the decisions, pull a history report, and delete the review. It also makes a useful point: one review covers one role. The requests only exist inside the web page, so the repository pins the page's source, unmodified, with hashes a test checks. Then the tests send the tutorial's request to a fake Graph, so you can see what it really does.

## Slide 5 — What the tutorial leaves to you: the review itself

Run against the fake, the tutorial shows its limits quickly. It sends a create request every time without reading first, so run it twice and you get two reviews with the same name, and your evidence splits in two. It names a single person as reviewer, with no fallback, so one departure stalls the review. It sets no default decision and no auto-apply, so silence keeps privilege, and a denial changes nothing until someone applies it by hand. And its schedule, one day every three months, isn't the program's. The code keeps the tutorial's scope and fixes the rest.

## Slide 6 — What it leaves to you: evidence, targets, permission

The rest of the gaps are about evidence and permission. The tutorial gives reviewers no instructions, though the API marks that field required. It collects evidence by writing a report and handing you a link that expires in a day, and its report may not even include the review it made. It never touches Azure roles or the privileged groups, two of the program's three targets. And it uses the write permission for everything, even reads. So the verdict: keep the tutorial's scope as the model, but don't run it as published.

## Slide 7 — The reviewed file: seven series in the fixture

Now the code. It's a new module, and unlike the earlier chapters, it can write to a tenant, but only with the apply switch, only what the dry run listed, and it never deletes. One file holds every series. Each has a managed name prefix, a kind, a tier, a cadence, reviewers, a fallback and instructions for reviewers. The fixture's seven series follow Book 04's schedule: role reviews, reviews of the privileged groups, and one Azure role. Notice the first row: Global Administrator makes no change on silence. We'll see why in a moment.

## Slide 8 — The bodies: built only from Learn's documented shapes

Each request body is built only from shapes Learn documents. A role series reviews users. The groups that hold the role aren't reviewed inside it; each gets its own membership series, which matches Book 04's pairing of every role review with a review of its privileged group. Group reviews cover the group's members, a feature still in preview. Azure role reviews go to Resource Manager on a preview version, and their reviewers must be people or service principals, not groups. One honest gap: Learn's request table doesn't list some fields the code sets, so Lab 2 checks they take effect.

## Slide 9 — The checks: PA-AR-01 to PA-AR-14

These are the checks the code runs on every body it builds, and on any Graph body, including Learn's own. Some come straight from Learn: an empty reviewer list is a self-review, reviewers need instructions, a monthly review can't run longer than twenty-seven days, and Azure series can't use group reviewers. Others are the program's design: auto-apply on, justification required, the right cadence per tier, no duplicate names, and every privileged group paired with its own review. One rule, about the emergency accounts, deserves its own slide.

## Slide 10 — PA-AR-06: the one guard that changes the setting

This is the one place the code deliberately overrides the program's own setting, and it ties straight back to Chapter 2. The emergency accounts hold Global Administrator permanently. A monthly review of that role, set to remove access on silence with auto-apply on, would quietly remove them the first month reviewers miss. Learn itself warns that the combination can revoke all access. So that one series makes no change on silence, and anything left unreviewed turns into an evidence finding instead. Every other series still removes access when reviewers stay silent.

## Slide 11 — The dry run, the diff, and -Apply

The dry run reads the tenant first, matches each series by name, and compares only what the file sets, ignoring defaults Graph adds on its own. Each series gets an action. New ones are created. Changed settings are updated in place, for future reviews only. But if the scope changes, Learn's update API won't take it, so the code marks it for replacement and leaves that to a person, because deleting a review deletes its decisions, and those are evidence. And the apply refuses to run at all while the plan has any finding.

## Slide 12 — The evidence: decisions read back for the ISSO

Reviews only matter if you can prove they happened, so the last piece reads every decision back, for the ISSO. Each decision becomes a row: who was reviewed, what was decided, by whom, when, and whether it was actually applied. Then come the checks an assessor cares about: a series that's missing or overdue, a denial that didn't take effect, silence deciding for a sensitive role, approvals with no reason, someone reviewing their own access, a burst of identical clicks, and an emergency account denied. The rows name people, so treat the folder as evidence.

## Slide 13 — Who owns the reviews, and least privilege per call

Who is this for? Developers build the pipeline. The identity governance officer owns the reviews themselves. And the ISSO reads the results. The permissions split the same way: the plan and evidence jobs only read, so they hold the read permission and Azure Reader. Only the apply identity can write, with User Access Administrator for Azure, the narrower of the two roles Learn names. Learn's pages disagree on which role can create a review, so the chapter follows the PIM page and applies as an app. A test keeps each task's permissions exactly what its calls need.

## Slide 14 — Lab 1: run the tutorial and the dry run offline

Lab 1 runs on a laptop with no tenant. First, run Learn's tutorial against the fake. Eleven tests pass, and the third one shows the trap: send the tutorial's request twice, and you get two reviews with the same name. Next, list each task's permissions: reads for planning and evidence, writes only for the apply. Then the dry run. It finds one series to create, two to update, one to replace, three already right, and one somebody made by hand in the portal. Nothing is sent. Only two writes would go out, because the Azure update needs the preview switch.

## Slide 15 — Lab 1: Learn's body, the apply, the evidence

The second half of the lab is where it gets convincing. Run the example's checks on Learn's own request body, and it fails on the fallback reviewer, the missing instructions and auto-apply. Apply in the fake, and only the two planned writes go out; everything else is skipped with a reason. Read the evidence, and every kind of problem turns up, from an overdue review to an emergency account that was denied. Then try to switch the Global Administrator series to deny on silence: the apply refuses, and nothing is sent.

## Slide 16 — Lab 2: one real review, closed and read back

Lab 2 runs one real review, end to end, in a test tenant. Pick a role nobody really holds, never Global Administrator. Two apps keep reading and writing apart. You plan as the reader, then a second person reads the request bodies before you apply as the writer. Then you act as a reviewer: approve a test user with a reason, and close the review so it applies. Read the evidence back, and your decision is there with its result. The Azure step is optional, because it's preview. To back out, export the evidence first, then delete by hand.

## Slide 17 — Dangers, and the guard for each

Each of these dangers is a review that looks fine and quietly isn't. The worst ties back to Chapter 2: a setting that removes the emergency accounts the first month nobody responds. Close behind are self-reviews, reviews with nobody to step in, and denials that never take effect because auto-apply is off. Some are traps of the API itself: a scope that can't change in place, or a delete that takes the evidence with it. And one the code can't fix alone: a user denied an Azure role still sits in the group that grants it.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every privileged role, every privileged group, and every privileged Azure role at the control-plane subscriptions has its own series, and none of them is a self-review. The cadence matches the tier, auto-apply is on, and only the emergency accounts' series keeps access on silence. The identities hold only what their task needs, preview Azure series wait for the lab, and every closed review has its decisions in the evidence store. Next, Chapter 8 brings it all together: evidence and drift, for the ISSO. Thanks for watching.
