# Building HR-Driven Identity, Chapter 03 — Joiner Workflows as Code — narration script (practice copy)

## Slide 1 — Chapter 03: Joiner Workflows as Code

Welcome back to Building HR-Driven Identity. This is Chapter 3: joiner workflows as code, and the Temporary Access Pass bridge. A workflow edited in the portal is a change nobody reviewed. A workflow kept as a file is one a reviewer can read, a test can lint, and a plan can turn into exactly one new version. We'll start from Microsoft Learn's procedure, then see what the kit adds: the workflow files, a lint, a plan, and a measure of day-one readiness. Then two labs and the dangers.

## Slide 2 — Why the workflows belong in code

Why does this gate need code? The guide's Step 3 asks for few workflows scoped by code, a pass that bridges to the card, baseline access by package, execution limits on every scheduled workflow, and a measured readiness rate. Each of those is a property of a workflow definition. And Learn makes a definition change a new version rather than an in-place update. That's what makes code the right home: the file is the version, and the plan is the diff.

## Slide 3 — What Microsoft gives you

Here's what Learn gives you. The Create workflow request: a category, a name, flags, a scope, a trigger and the tasks. A changed definition goes to the create new version action. Triggers run on the hire date, the leave date or the creation date, within a hundred and eighty days either way. The pass task takes a lifetime and a one-time-use flag, and Learn recommends at most twenty-four hours for a new hire. And execution limits quarantine a scheduled run, though a workflow's limit isn't in the API.

## Slide 4 — What Learn leaves to you

What does Learn leave to you? It gives one request at a time, written by hand. It doesn't keep the definitions where a reviewer approves them, check a definition against its own limits before the request, decide between create and new version, or measure what the workflows achieved. So the kit keeps one file per workflow, lints it, plans create or new version, and counts readiness, each pinned by a test. The verdict: keep Learn's bodies exactly as Learn shapes them, and add the file, lint and plan in front.

## Slide 5 — Six workflow files, scoped by code

The kit holds six workflow files. Two joiners: a pre-hire workflow that sends the pass seven days before day one, and a day-one workflow that requests the onboarding package. A mover on the organization code. And three leavers, including a post-separation delete thirty days after the leave date. All of them scope on the employee type and a worker type code, never on a name. The day-one workflow doesn't enable the account; the pipeline is that writer, as Chapter 1's register records. And each file records its version, owner and execution limit.

## Slide 6 — The lint: Learn's limits and the program's rules

The lint has fifteen rules, and each one says where it comes from. Some are Learn's own limits: the category, the offset range, more than twenty-five tasks, more than a hundred workflows, an unknown task I D, or a scope property Learn doesn't list. Some are the program's design: scope by code rather than by a display name, record an execution limit for every scheduled workflow, give access by package rather than group add, and keep delete apart from disable. And the pass rule mixes both: Learn's range is a finding, over twenty-four hours or reusable is a warning.

## Slide 7 — The plan: create, new version, or none

The plan is where the file becomes a change. It lints the folder first, and refuses to go on if any file has a finding. Then it matches each file to the tenant's export by display name and compares the parts a definition owns. A file with no match becomes a create body. A changed one becomes a body for create new version. An unchanged one is left alone. It writes the plan, one body per change and a manifest with a hash per file, and sends nothing. Its one read needs only workflow read permission.

## Slide 8 — Day-one readiness, and the tests

Readiness counts the hires whose hire date is today, and calls a hire ready when the account exists and is enabled, holds a license, has the onboarding package delivered, and has a completed pre-hire run. It reads the hires from H R and three exports, each with a read-only permission. Run it on an export taken at the start of the day, because it measures state, not timestamps. The chapter adds nine tests, and all fifty-seven of the kit's tests pass with no tenant or network.

## Slide 9 — The verified facts

The facts behind the code, read on Learn on November first. Create and create new version share one permission and the Lifecycle Workflows Administrator role, and both are available at L4 and L5. Changes are versions, not in-place updates, and the tenant runs one schedule, every three hours by default. The pass task has a fixed I D and a lifetime range, and its availability in GCC High wasn't confirmed. Execution limits quarantine a scheduled run but not an on-demand one. And a scheduled workflow catches up on a user for three days after the trigger date.

## Slide 10 — Where Learn differs, and what stays open

Learn's own pages disagree in four places, recorded so a later edit doesn't loosen the code. The pass's lifetime argument has two names, and the lint reads either. The custom task extension has two I Ds. The mover category appears in an example but not in the property table. And the workflow ceiling is a hundred on two pages and fifty on another, so the budget is fifty. Still open: the trigger name for an extension attribute, the execution limit the API doesn't carry, and the pass's availability in GCC High.

## Slide 11 — What the output proves, and for whom

What does this give the I S S O? The reviewed files and the plan that changed each version, with its manifest hash: the definitions and versions AC-2 enhancement 1 asks for. The lint's clean run, showing a one-time pass of at most twenty-four hours and an execution limit on every scheduled workflow, which supports IA-5. And the readiness summary for each start date. The pass is a bridge to phishing-resistant MFA, so an account still on a pass after the agreed window is a finding, though this code doesn't read it.

## Slide 12 — Who builds, who owns, who approves

Who does what? Developers build the lifecycle automation, and need to read Python and JSON. Identity engineers own the workflows: they set each execution limit in the admin center, and send each change as a Lifecycle Workflows Administrator. Reviewers approve each file and its plan, and the I S S O receives the evidence. The code itself only reads: the planning app holds a single workflow read permission, and the readiness reads hold only their four read permissions.

## Slide 13 — Lab 1: the reads, and a clean lint

Lab 1 runs on a laptop. Step one lists the reads and their permissions. The plan needs one read, of the workflows, with workflow read permission. Readiness reads the users, the pre-hire processing results and the package assignments, with four read permissions in all. Step two lints the program's six workflow files against a budget of fifty: no findings, no warnings.

## Slide 14 — Lab 1: three broken copies

Step three lints three broken copies, with a budget of two so the ceiling rule fires. Seven findings and four warnings. The day-one copy has an offset of two hundred days and adds the user to groups directly. The leaver triggers on the hire date, deletes and disables in one workflow, and scopes on the manager, which Learn doesn't list. The pre-hire copy has no execution limit, scopes on a department name, and sends a three-day pass that isn't one-time use. The exit code is two.

## Slide 15 — Lab 1: the plan, and day one measured

Step four plans against the tenant's export. The day-one workflow in the tenant requests a different package, so it gets a new version. The employee leaver doesn't exist yet, so it gets a create. The one warning is a legacy workflow made in the portal that no file defines. Nothing is sent. Plan the broken folder and it refuses. Step five measures day one: one of four hires ready. One lacks only the package, one is disabled and unlicensed, and one has no account at all. The fifty-seven tests pass.

## Slide 16 — Lab 2: one change, through the plan

Lab 2 uses a test tenant, never production; the authors haven't run it. Export the workflows with a reader app. Make one example edit, moving the pre-hire trigger from seven days to five, and plan against the export. As a Lifecycle Workflows Administrator, send that one change with Graph PowerShell, scheduling off. Set the execution limit in the admin center, and read it back with the validation kit. Check the pass policy and the manager's mailbox, then measure readiness on the start date. Finally, back it out: remove what you created, or send the previous body as a further version.

## Slide 17 — Dangers, and the guard for each

The dangers are mostly drift and scale. A workflow edited in the portal drifts from its file; every plan warns on it. A scope on a department name silently stops after a reorganization. A long or reusable pass outlives the card's arrival. A rehire whose old account kept its methods can't get a pass, so rehires need their own path. With no execution limit, a bad H R load runs to the end. A delete in the leaver removes the account before devices are retired. And a readiness figure from a midday export counts late fixes as ready.

## Slide 18 — Done when: the Gate 3 checklist

Here's what done looks like. Every workflow in the tenant has a file, and the last plan showed no unknown workflows. The lint is clean against a budget of fifty. Every execution limit matches its file, and the validation kit agrees. The pass is one-time and lasts at most twenty-four hours. Each change reached the tenant as a reviewed body with its hash recorded. The readers hold only read permissions. And the readiness rate is reported for every start date. Next, Chapter 4: access from attributes, and the mover's residual review. Thanks for watching.
