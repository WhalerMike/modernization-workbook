# Building Privileged Access, Chapter 06 — PIM for Azure Resources — narration script (practice copy)

## Slide 1 — Chapter 06: PIM for Azure Resources

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 6: PIM for Azure resources. Standing Owner and Contributor are what an attacker hopes to find, so this chapter makes those roles eligible, time-bound and approved, and holds the settings as reviewed code at every scope. We'll start from Learn's walkthroughs and Microsoft's own request examples, see what they leave to you, then walk the plan, the dry run, the apply, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why standing Azure roles have to go

Why does this matter? Because a standing Owner is privilege that's always on. Nobody has to activate it, approve it, or explain it, so an attacker who takes the account doesn't have to wait either. The fix is the one you already know from Entra roles: make the role eligible, time-bound and approved. What's different in Azure is that every scope keeps its own rules. The chapter governs the three roles the plan names, Owner, Contributor and User Access Administrator, with Microsoft's ceiling of three subscription owners on top.

## Slide 3 — Which cloud: the Resource Manager host

Next, which cloud. This estate's tenant is GCC on the worldwide endpoints, with commercial Azure, so every call in this chapter goes to the commercial Resource Manager host. GCC High and Department of Defense subscriptions live in Azure Government, which has its own host. The licensing PIM needs is available in all of these clouds, but notice the honest gap: no page the chapter read states the PIM Resource Manager API's availability in Azure Government outright. So the code makes you name the cloud every time, and refuses a file written for a different one.

## Slide 4 — Resource Manager, not Graph: three resource types

Here's the first thing to know: PIM for Azure resources isn't in Microsoft Graph at all. Entra roles and groups are managed through Graph, but Azure resources go through Resource Manager, with no Graph permissions. Three resource types do the work: one for eligible assignments, one for active assignments and activations, and one for the role settings. The schedules they produce are the same lists Chapter 1's inventory already reads. And there's a deadline: the old beta endpoint stops returning data at the end of October 2026, so the chapter uses only the current API.

## Slide 5 — The version, the scopes and who can be eligible

Three facts shape the code. First, the version: the generally available release covers every PIM resource type, and the code pins it, even though one of Learn's how-to pages still shows an older preview. When Learn's pages disagree, the chapter follows the stricter one and writes the disagreement down. Second, settings don't inherit. A resource group under a governed subscription keeps its defaults, so the file has to list every scope. Third, only users and groups can be eligible. A pipeline's service principal can't activate, so it can't be converted.

## Slide 6 — Microsoft's sample: walkthroughs and pinned examples

Here's what Microsoft gives you. Learn has three walkthroughs, one per job: eligible access, active access, and the role settings. Together they show how to list, grant, remove, activate, and patch a role's rules, and which errors come back when a request breaks a rule. Their source isn't public, so they can't be pinned. But Microsoft's request and response examples for the same calls are, so the repository pins six of them, unmodified, with hashes a test checks. A stand-in Resource Manager then replays them through the code, and nothing signs in or leaves the machine.

## Slide 7 — What the examples get wrong if read naively

Replaying the examples turns up some real traps. The list examples show one page for one person, but a busy subscription spans many pages. One example's role ID and its friendly name disagree, so code that trusts the name files a row under the wrong role. Another example says "assigned", but it's really an activation, and read naively it looks like standing access. The scope is written three different ways, which quietly breaks any diff. And the sample eligibility lasts a year, with no justification, longer than any tier allows. Each of these is pinned by a test.

## Slide 8 — What the examples leave out entirely

The rest of the gaps aren't mistakes, they're things the examples never try to do. They show one rule patched at one subscription, but settings don't inherit, so every scope needs its own. Nothing in them finds standing Owner, which is the whole point of the project. Every write is a request you send by hand, with nothing to review first. And every request goes to the commercial host. So the verdict: use the walkthroughs as the procedure and the examples as the contract for shapes, but don't drive the estate from them.

## Slide 9 — The code: a call list with least-privileged roles

Now the code. It's a second module that imports Chapter 1's and changes nothing in it, so every read is declared, paged to the end, and recorded. The call list has two tasks. Reading needs only Reader. Writing needs User Access Administrator, which can manage role assignments but can't change the resources themselves, the way Owner can. There's one more candidate, the role-based access control administrator, which holds the same write action. But the PIM pages name only Owner and User Access Administrator, so the code takes the stricter reading until a lab proves otherwise.

## Slide 10 — The desired state: settings by tier, and its refusals

The heart of the configuration is one reviewed file. It names the scopes, the roles, who's eligible, and the settings for each tier, taken from Book 04's role settings: shorter activations and tighter eligibility for the most sensitive tier, approval by a named group, and a justification and ticket on every activation. Those values are the program's design guidance. The loader also refuses what Learn or the program rules out. The subtle one is authentication context: Learn says to create its Conditional Access policy before you point PIM at it, so the file can't use it until that's confirmed.

## Slide 11 — The read and the plan, in the order it must run

The read is straightforward: at each governed scope, both schedule lists and one policy per role. A schedule counts as permanently active only when it's assigned, never ends, isn't an activation, and is direct. The plan is where order matters. Policies go first, because a request that breaks the policy is refused. New eligible assignments go second. And standing access is removed last, so nobody loses a role before they can activate it. Anything eligible that the file doesn't mention is reported, not removed: taking access away is its own reviewed change.

## Slide 12 — Findings, and an apply that is off by default

The plan also reports what it found, and just as important, what it won't touch. Standing privileged roles outside owned exceptions are findings. A service principal is reported, never converted, because it can't activate. Root-scope elevation is flagged for removal. The identity running the plan never plans away its own access; that's decided last, from another session. And a subscription that would end up with more than three owners is flagged. Writing, meanwhile, is hard to do by accident: it's a dry run unless you ask to apply, and every run leaves evidence, including the state as read, which is your back-out.

## Slide 13 — Who owns it, who reviews it, what it runs as

Who is this for? The platform engineers who own the Azure management group hierarchy write and keep the file. The identity engineers and the information system security officers review every change before it's applied, by reading the diff and the plan. The eligible holders are people and groups, licensed for PIM, who'll now activate with a reason, a ticket and an approval. And the automation itself runs with as little as possible: Reader for the dry run, User Access Administrator held only for a day or so for the apply, never Owner, and no Graph permissions at all.

## Slide 14 — Lab 1: replay the examples and plan a dry run

Lab 1 runs on a laptop, with no tenant and no network. First you replay Microsoft's own examples, and the six tests pass. Read the second one: Microsoft's assignment example is really an activation. Next, ask the code which roles each task needs. Owner isn't needed for anything. Then plan against a small fictional estate, as a dry run. It reads the schedules and policies, plans eleven policy updates, five new eligible assignments and three removals, and writes nineteen requests without sending one. Let's read what it planned.

## Slide 15 — Lab 1: reading the plan, applying, the refusals

Now read the plan the way a reviewer would. Three standing assignments become eligible, each with a matching removal, and two declared groups gain eligibility. Seventy policy rules change, but a policy that's already right isn't touched. The findings tell the rest: the automation's own access is left alone, a root-scope elevation is flagged, a pipeline's service principal is reported, not converted, and one subscription would have four owners. Then apply against the fake, and a fresh read shows nothing left to change. Finally, watch the code refuse an undeclared write and a scope it doesn't govern.

## Slide 16 — Lab 2: a test subscription, a live plan, a back-out

Lab 2 moves to a test tenant and a test subscription, never production. You give a reader app nothing but Reader, write a small desired state with one hand-made standing Owner to convert, and plan live, comparing what the code read with what the admin center shows. Then you grant the write role for a single day, apply, and activate as the test user to see the approval flow. There's also a small experiment to settle an open question about the narrower role. And to back it out, wait five minutes first: Learn says a new assignment can't be removed sooner.

## Slide 17 — Dangers, and the guard for each

Every danger here is a way a well-meant change goes wrong in production, and each has a guard in the code. The worst is order: remove standing Owner before the eligible role exists and someone loses access in the middle of a task. Close behind is the automation removing its own access halfway through a run. Others are quieter: a resource group nobody listed keeps its defaults, an authentication context points at a policy that isn't there, or a typo lands unreviewed. The pattern is the same as before: a dry run by default, and rules that run every time.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the estate side: every governed scope is listed, and you've written down what isn't; each role's settings match the tier everywhere, and a fresh read after the apply shows nothing left; no standing privileged roles remain outside owned exceptions; and no subscription has more than three owners. On the run side: the right roles, held briefly, the right cloud, a reviewer who read the plan before the apply, and pinned examples still matching what was reviewed. Next, Chapter 7 reviews who holds these privileged roles. Thanks for watching.
