# Building Privileged Access, Chapter 05 — PIM for Groups and the PRV Groups — narration script (practice copy)

## Slide 1 — Chapter 05: PIM for Groups and the PRV Groups

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 5: PIM for Groups and the P R V groups. A privileged role reaches a person through one of these groups, so whoever controls the group controls the role, and that control belongs in a reviewed file. We'll start from Microsoft's own request samples, see what they leave out, then walk the file, the findings, the plan and its guards, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the PRV groups need to be code

Why does this matter? Because the program never hands a privileged role to a person directly. It hands it to a group with the tier in its name, so the tier shows up in every review and alert. That means the group itself is now the privilege: whoever adds a member, or changes the activation policy, has effectively changed who holds the role. Chapter 1 already reads these groups. This chapter writes them, from a reviewed file, and because people can still change membership around it, the code reads the tenant first and treats anything it didn't put there as drift.

## Slide 3 — Which cloud: Graph hosts and availability

Next, which cloud. For a GCC tenant like this estate's, every call goes to the worldwide Graph host, and sign-in goes to the worldwide login page. GCC High and DoD have hosts of their own. Every PIM for Groups API page the chapter read lists the US Government clouds too, and the governance licensing PIM depends on is available in all three government environments. The module never guesses: you name the cloud on every run, and there's no default.

## Slide 4 — Two independent features meet in a PRV group

Two Microsoft features meet in a P R V group, and it helps to keep them apart. A role-assignable group is the only kind that can hold an Entra role; you choose that at creation and can never change it, and there's a limit of five hundred. PIM for Groups is separate: just-in-time membership or ownership, each with its own policy. Book 04 combines them two ways. For an Entra role, the group is eligible and its members activate the role. For anything else, people are eligible for the group itself. The file records which.

## Slide 5 — Where a group's PIM state lives in Graph

Here's where a group's privileged state actually lives. Not in the members list: eligible members don't appear there until they activate. Instead there are separate collections for eligible and active schedules, filtered by group, and two policies per group whose IDs you only learn by reading them. A few facts shape everything that follows. A group joins PIM the first time you touch it, its policy IDs change when it does, and it can never leave. And access packages are deferred to later, with one warning about expiry dates carried forward.

## Slide 6 — Microsoft's samples, pinned and sent to a fake

Microsoft doesn't publish an end-to-end tutorial for PIM for Groups in Graph. What it does publish is a handful of single requests in the API reference, plus a how-to for updating policy rules. Those requests only exist inside web pages, so the repository pins the page source unmodified, with hashes a test checks and a weekly watch for changes. Then a small harness sends each request, exactly as published, to a fake Graph that checks them the way Learn says PIM does. Nothing signs in and nothing leaves the machine.

## Slide 7 — What the samples leave to you

This is the heart of the chapter. The request shapes are good, and the plan copies them exactly. But run as published, the samples go wrong in instructive ways. The first example is titled an ownership request and actually grants membership. Its comment and its dates disagree, and the dates are from 2023, so today the fake refuses them. Nothing reads the tenant first, so a second run grants twice. And one sample is a user's self-activation, not an admin's. So the verdict: keep the shapes, take everything else from the reviewed file.

## Slide 8 — The code, the reviewed file and the tier policy

Now the code. The chapter adds its own module, its own list of allowed calls, and an entry script, and borrows nothing from Chapter 1 except the cloud table. Everything is driven by one reviewed file: for each group, who may be a member or owner, whether active or eligible, until when, and on which ticket. A second file sets the activation policy per tier, and it's labeled design guidance: shorter activation and approval for the top tiers, longer eligibility lower down, and one-hour owner activation with approval everywhere.

## Slide 9 — Activation limits and the authentication context

Two details in the policy deserve a closer look. Learn's pages disagree on how long an activation may last: one says eight hours at most, another says up to twenty-four. The code takes the stricter reading and flags anything longer. Then there's the authentication context from Chapter 3, which isn't built yet. When it arrives, it only forces a fresh sign-in on every activation if its policy says so, and even then there's a ten-minute window. Learn also disagrees on whether it's preview, so the chapter treats it as preview.

## Slide 10 — The findings: PA-PG-01 to PA-PG-09

Before anything is planned, the code reads the tenant and checks it against nine rules. Some come straight from Learn: only role-assignable groups can hold a role, PIM can't manage dynamic or synchronized groups, and there's a hard limit of five hundred. Others are the program's design, and they're labeled that way: no nesting at all, every entry has an end and a ticket, no owners on tier zero groups, and anything the file doesn't grant is a finding. One subtle one is the owner trap, which we'll see in the lab. Activations are ignored, since they aren't standing state.

## Slide 11 — The plan, the dry run, -Apply and seven guards

Once the differences are known, the plan turns them into requests in a fixed order: create any missing groups, then set the policy rules so they're in force before anyone is granted, then grants, and removals last. Each request carries its permission and a line of diff a reviewer can read. Nothing is sent unless you ask for it. And even then, seven guards can refuse the whole run: losing approval on a top tier, a permanent grant, a group approving itself, or suddenly removing more people than expected, which usually means a broken file.

## Slide 12 — Where Learn's pages differ, recorded on purpose

Learn isn't always consistent with itself, and the chapter writes down every place it isn't, so a later edit doesn't quietly loosen the code. Activation length is one. Whether PIM for Groups is generally available or still beta is another: the API pages say one thing, a how-to says another. The permissions for role-assignable groups differ between pages, and the Lab 2 run is how you settle that. Even the obvious PowerShell cmdlet disagrees with its own API page, so the code calls the API directly.

## Slide 13 — Who builds it, and the least privilege per call

Who is this for? Developers building the write path, the identity engineers who own the groups and the file, and the I S S O's who review each plan before it's applied. Then, what the code may do. Every call gets its least-privileged permission. The read side needs four permissions and none of them can write. The plan lists exactly the permissions its own changes need, so the app that applies it holds those and no more. And the one powerful permission, the one that can assign any directory role, is kept off the pipeline entirely: create these groups by hand.

## Slide 14 — Lab 1: Microsoft's samples, then a dry run

Lab 1 runs on a laptop: PowerShell 7 and Pester, no tenant and no network. First you send Microsoft's samples, as published, to the fake, and the tests confirm each gap from the table. Then you send the first example by hand and see it for yourself: it's titled ownership, it asks for membership, and the fake refuses it because its end date passed in 2023. Next you list the read permissions, four and none that can write. Finally you plan against a fictional tenant, as a dry run. Let's read what it found.

## Slide 15 — Lab 1: findings, the diff, a guard and -Apply

Reading the results is where the rules become concrete. On the tier zero group, someone holds permanent membership the file never granted, and an owner is eligible with no active owner, which is exactly the trap where activation can't be undone. The policy also allows activation without approval and for twice as long as it should. On the Azure group, another group is nested inside. The diff shows each change in a line, removals last. Then set a tight removal limit and watch a guard refuse to run. Finally apply to the fake, and run the full suite.

## Slide 16 — Lab 2: a test tenant, lab groups, two apps

Lab 2 moves to a test tenant with fictional people, never production, and because a group can never leave PIM, you make groups just for the lab. Create them by hand, register two apps, a reader and a writer, and plan as the reader. Then apply as the writer and compare the portal with your file. This lab also settles open questions: whether the narrower permissions are enough, and whether the policy update really took. Rerun to see zero changes, try one removal, and then back everything out, because the output names privileged people.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a matching rule or guard. The quietest is drift: someone changes membership in the portal, and nobody ever reviews it, so every run reads first and flags what it didn't grant. The sharpest is dropping approval on a top-tier group, which Learn specifically warns lets a lesser admin act on someone else's behalf. And the bluntest is a truncated file that would remove everyone, which is why removals go last and a guard stops more than a handful. Notice again: each guard is code that runs every time.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the group side: a file that passes its own check, with an end and a ticket on every entry; role-assignable groups wherever a role is held; no nesting, and no owners on tier zero; and policies that match the reviewed settings. On the run side: approver groups with at least two people, a plan reviewed by someone other than its author, a rerun that shows nothing left to change, apps holding exactly what they need, and pinned pages still matching. Next, Chapter 6 takes PIM to Azure resources. Thanks for watching.
