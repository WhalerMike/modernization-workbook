# Building Privileged Access, Chapter 04 — PIM for Microsoft Entra Roles as Code — narration script (practice copy)

## Slide 1 — Chapter 04: PIM for Microsoft Entra Roles as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 4: PIM for Microsoft Entra roles as code. A role setting someone changed in the portal is a control nobody reviewed, so this chapter holds each role's settings in a reviewed file, compares the file with the tenant, and changes the tenant only from the file. We'll start from Microsoft's two samples, see what they leave out, then walk the role files, the checks, the diff and the rollout, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why role settings become code, in a fixed order

Why does this chapter exist? Because a setting someone changed by hand in the portal is a control nobody reviewed. And because the order of changes matters. Learn documents a lockout: every top administrator eligible, none active, approval required, and nobody named to approve. So the chapter won't touch any role setting until the emergency accounts from Chapter 2 hold in the tenant, and it refuses any file that asks for approval without an approver. The plan's order is fixed too: one pilot class first, then every tier, one at a time.

## Slide 3 — Which cloud: Graph v1.0 on the worldwide host

Next, which cloud. Everything here is Microsoft Graph, version one, with no Resource Manager calls at all; Azure resource roles wait for Chapter 6. This estate's tenant is GCC, so Graph is the worldwide host and sign-in is the worldwide sign-in page. GCC High and the Defense Department cloud would use their own hosts, and every call's Learn page lists the US Government clouds as available. One small design choice matters: the code takes an explicit cloud name and has no default, so nobody runs it against the wrong cloud by accident.

## Slide 4 — Settings are per role, and Graph calls them rules

Here's the shape of what we're managing. Every Microsoft Entra role has its own settings, independent of every other role, and every assignment of that role follows them. In Graph, each role gets one policy, and each policy holds seventeen rules with fixed names, grouped into activation, assignment and notification. This chapter manages the seven activation and assignment rules that Book 4 lists, the ones on the slide, and deliberately leaves the notification rules alone. Each of those seven becomes a few lines in a reviewed file.

## Slide 5 — The authentication context: its policy, then PIM

The authentication context deserves its own slide, because it's easy to get wrong. Learn says the Conditional Access policy behind the context must exist and be switched on before you select the context in PIM. If no policy targets it, activation falls back to MFA, but if the policy is off or report-only, nothing is enforced at all. Even with it on, you only get a prompt on every activation if that policy asks for it, and a ten-minute window still applies. Learn's pages also disagree on whether the option is in preview, so the chapter keeps calling it preview.

## Slide 6 — Learn's two samples, pinned and sent to a fake

Microsoft gives you two samples. One shows how to find a role's policy and then update its rules, six requests, each carrying the right type. The other is a tutorial that makes a group eligible for a role and has a member activate it, which is exactly Book 4's pattern: roles are eligible to a group, never to a person. Those samples live only inside web pages, so the repository pins the pages' source, unmodified, with hashes a test checks. Then a harness sends every request to a fake Graph, so you can see what they really do.

## Slide 7 — What the rules sample leaves to you

This is where the samples fall short, and every row is pinned by a test. Learn's read and its rule shapes are good, so the code keeps them. But there's no sample for the authentication context rule at all, and the activation sample relies on MFA, which may not prompt again in a session that already did it. Every update names a policy from somebody else's tenant, so a copied script fails. And even with the right policy, the samples leave a role different from the program's settings in six rules. So the code adds a real diff.

## Slide 8 — What the tutorial leaves to you, and the verdict

The rest of the gaps are about safety. Nothing in the samples reads before writing, offers a dry run, or reads back afterward, and nothing checks for the lockout. The tutorial asks for a year of eligibility, twice what the program allows for that tier, and for permissions far broader than the request needs. Its clean-up would delete the wrong object. So the verdict is clear: keep Learn's read, its rule shapes and its write permission, but don't run the samples as published. Let's look at what the code builds instead.

## Slide 9 — The code: one reviewed file per role, inside bounds

So what does the code add? A module of its own, building on Book 4's appendix script, with one reviewed file per role, twenty-two in all, so a reviewer reads a change to a file as a change to the tenant. Approvers appear by alias, and a small bindings file per tenant turns each alias into a real group, so the same files serve a test tenant and production. Every file sits inside bounds. Where Learn's pages disagree on the longest activation, the code takes the stricter eight hours, and the owner capped standing active assignments at fifteen days.

## Slide 10 — The checks: PA-PIM-01 to PA-PIM-09

Before anything is written, nine checks run. The first two are the two halves of the lockout: approval with no approver, and too few emergency accounts holding Global Administrator. Others keep approvers separate from the people they approve, keep every file inside its bounds, and refuse a wave until the earlier ones match. Any finding blocks the write. One check can't be automated: whether the activation gate's policy is on lives in a beta property, so a person has to state it, with a flag, after Chapter 3's run shows it's on.

## Slide 11 — The calls, and a permission for each task

Reading and writing are different jobs here, with different permissions. Every read uses a read-only permission, and the client refuses anything but a read unless it was built for writing, which only happens when you ask to apply. Rule updates and new eligibility need two write permissions; removing a standing assignment is a third task with its own. Learn's PowerShell guide and the tutorial ask for broader permissions, so the code follows the narrower reference pages instead. And a test makes sure the dry run's app never holds a write permission.

## Slide 12 — The diff, the plan, the read-back, the conversion

This is the write path, and it's careful by design. First it reads each role's policy, then compares the seven rules with the file, after smoothing out differences that don't matter. The plan lists every change and sends nothing. Only when you ask to apply does it write: rules first, then eligibility, so each request meets the new limits. Then it reads the tenant again, and that read-back is the evidence, not the response. Converting standing access follows Book 4's order: eligible first, activation confirmed, and only then removed.

## Slide 13 — Who builds it, who owns it, who reviews it

Who is this chapter for? Developers build the write path, and they need PowerShell, the file format, and a sense of what an eligible assignment is. The identity engineers own PIM itself: the role files, the bindings, and the groups. And the information system security officers review the changes, because every file is read by two people and every apply follows a reviewed dry run. The identities are split the same way: a reader for dry runs, a writer for applying, and the removal permission held only for a conversion run.

## Slide 14 — Lab 1: Learn's samples, permissions, a dry run

Lab 1 needs only a laptop: PowerShell 7 and Pester, no tenant and no network. First you send Learn's own samples to the fake and watch thirteen tests pass, including the one that shows the samples applying cleanly and still leaving a role six rules away from its file. Then you list each task's permissions, and see that a dry run needs only reads. Finally you dry-run the pilot wave: nine roles, no findings, a plan of rule updates, eligibility requests and two conversions, and nothing sent.

## Slide 15 — Lab 1: reading the diff, the block and the apply

Now read what came out. One role was partly set by hand, so its diff is short and touches only what's wrong; what already matches isn't touched. The findings name the people holding standing access, an automation account with no documented owner, and someone eligible outside their group. Then you try Tier zero too early, and the run blocks, one finding for each pilot role not yet done. Applying the pilot wave stops once to make you confirm the activation gate, then sends everything and reads back zero differences. The whole suite passes.

## Slide 16 — Lab 2: one role in a test tenant, then back out

Lab 2 moves to a test tenant, never production, and works one role. First the prerequisites: the emergency accounts pass, and the activation gate's policy is truly on, not report-only. You create the approver group and the role's group, and two apps, a reader and a writer. Dry-run as the reader and review the plan with a second person, then apply as the writer and expect zero differences. Next, convert one standing assignment the safe way, after a confirmed activation. And finally, restore the rules from the saved copy and clean up.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard that runs every time. The two worst are the lockout halves, and both are checked against the live tenant before any write. A context switched on before its policy is on looks protective but enforces nothing, which is why a person has to confirm the gate. Then there are the quieter ones: a script nobody reviewed, one identity that can change everything, settings drifting in the portal, and a back-out done from memory. The pattern holds: rules and saved files, not people remembering.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every role file has had two reviewers, the bindings name every group, and no approver group can approve itself. The emergency accounts pass, and the activation gate's policy is on before anyone says so. The reader, the writer and the conversion run each hold only what they need. Every apply followed a reviewed dry run and read back clean, every removal has a confirmed activation, and every run folder is kept as evidence. Next, Chapter 5 builds PIM for Groups, the groups that hold this eligibility. Thanks for watching.
