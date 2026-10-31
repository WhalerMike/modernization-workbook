# Building Non-Person Identity, Chapter 06 — gMSAs, dMSAs and the Kerberos Island — narration script (practice copy)

## Slide 1 — Chapter 06: gMSAs, dMSAs and the Kerberos Island

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 6: group and delegated managed service accounts, and the Kerberos island. These accounts are good credentials with a known expiry date, the day the last domain controller is demoted, so the chapter makes sure every one of them moves, retires, or sits on a dated list before then. We'll start from Learn's own procedures, see what they leave out, then walk the plan, the island list, the write path, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why every gMSA and dMSA needs an end date

Why does this chapter have an end date built in? Because a group managed service account only works while A D is in charge. The program decides early whether A D is retired or kept as a dated Kerberos island, and the risk register is blunt: anything still running under one of these accounts loses its credential when the last domain controller goes. So converting isn't the finish line. Every account must end up moving to a workload identity, retiring, or on a dated island list. The program adds four rules of its own, labeled as design guidance, and the strictest is simple: never delete.

## Slide 3 — What gMSAs and dMSAs are, and where the code runs

A quick grounding in what these accounts are. A group managed service account is a domain account whose password the domain controllers manage and rotate, and which several servers can fetch. The delegated kind is new in Windows Server 2025: it takes over from an old-style service account, and once the move completes, the old password stops working and the old account is disabled. Book 2's matrix says which target each account gets. And because everything here is an Active Directory command against the domain, the cloud choice doesn't change anything in this chapter.

## Slide 4 — Learn's four procedures, pinned and run

Here's what Microsoft gives you: four procedures, covering the delegated account walk-through, its limits, the group account walk-through, and the one-time root key that every managed password is derived from. These procedures live only inside web pages, so the repository pins their source unmodified, with hashes a test checks and a weekly watch for changes. Then a harness runs each PowerShell block exactly as published, against stand-ins that accept only the parameters the real commands have. That last detail matters, as you'll see in a moment.

## Slide 5 — What the procedures leave to you: the key and the steps

This is where the stand-ins earn their keep. The creation steps are fine, and the code keeps them as its model. But the root key check uses a command that returns the key itself, the secret every managed password comes from, so the code reads only its start time. The backdated key is meant for a test lab, not production. And one step sets the migration state with a parameter the command simply doesn't have, so as published it fails. Placeholder names that change from step to step are replaced by names from reviewed data.

## Slide 6 — What they leave to you: limits, waits and deletes

The rest of the gaps are about timing and safety. The walk-through completes a migration with no wait, while the overview asks for weeks, so the code waits twenty-eight days. It never checks the limits, like unconstrained delegation that silently stops working, so the code checks each one before planning. It restarts every service on the host. And the pages disagree on deleting the old account; the code takes the stricter side and has no delete at all. So the verdict: use Learn's commands and their order, but not the procedures as the program.

## Slide 7 — The code and its four reviewed inputs

So what does the code add? A module, two entry scripts kept strictly apart, one that only reads and one that writes, and its own list of allowed calls. It builds on Chapter 1's register and refuses one whose hash doesn't match. Then three reviewed files drive it: the owners' decision for each account, the list of who may fetch each managed password, and the program's end state, with its dates. Notice that the end state has no default. If the decision is missing, the run simply stops rather than guessing.

## Slide 8 — The check: nine rules, NPI-KRB-01 to NPI-KRB-09

The reader collects the root key's start time, every managed account with its password retrievers and migration state, and, for a delegated conversion, the domain controllers and each host's operating system. Then nine rules run. Some come from Learn: the root key must exist and be old enough, the migration's limits must hold, and managed accounts shouldn't sit in privileged groups. Others come from the project plan: every account needs a decision, an owner for its service principal names, an end date inside the program's deadline, and a reconciled destination. Every finding gets a stable ID.

## Slide 9 — The plan: one action per account

Each account becomes exactly one action. The group account path is: create it, wait while the server owner installs it and switches the service over, run in parallel for thirty days, then disable the old account. The delegated path is: create it, start the migration, wait the full twenty-eight days, then complete it, which disables the old account and moves its service principal names across. Anything else is recorded with a reason. And because the same inputs always produce the same file, byte for byte, a reviewer approves one hash.

## Slide 10 — The island list and the reconciliation

Two outputs carry the chapter's end date. The island list holds every account that will stay on Kerberos, under the name it will end up with, along with its owner, its end date, and whether it's ready to hand to the program's retirement work. The hand-off flag only turns true when every single row is ready. The reconciliation covers every managed account, existing or planned, and says where it ends up. When the program confirms its end-state decision, that file changes in a reviewed pull request and the run is repeated well before A D retires.

## Slide 11 — The separate write path, and its refusals

Writing to the domain is the dangerous part, so it lives in its own script that refuses to run unless several things are true. The plan must be the exact one a reviewer approved, by hash. It must be for this domain and less than a week old. Every write must be a declared call with only its allowed parameters, and nothing that deletes, uninstalls, undoes or resets exists to call. It runs as a person, never a job. Then, before each write, it checks the target again and skips anything that changed since review.

## Slide 12 — Who builds, runs and reviews it, and with what rights

Who's involved? Developers build the code. Server and directory engineers run the write path and change the hosts. Application owners name who owns each service principal name and when it ends, and the security officer reviews the island list. The rights split is the important part. The read task holds no domain administration at all, just a narrow delegated read of the root key's dates. The write task does need administrator rights, because Learn's procedure requires them, and that's exactly why it's a separate script, run by a person, on a plan someone else approved.

## Slide 13 — Lab 1: Learn's procedures, then the check

Lab 1 needs only a laptop, PowerShell 7 and Pester, plus Chapter 1's inventory output. First you run Learn's own procedures against the stand-ins, and you can read the test where the migration-state step fails, just as it would on a real server. Then you list what each task is allowed to run: the read task is only lookups. Then you run the check against a fictional estate. Nine accounts are in scope, with six findings, four planned writes, and a hand-off that isn't ready yet. Let's see why.

## Slide 14 — Lab 1: reading the findings and the plan

Reading the findings is where the rules become concrete. One web server account is trusted for unconstrained delegation, which stops working after a delegated migration, so that conversion is blocked. Another account's reviewed retrievers add a server that Active Directory doesn't have yet, and its end date runs past the program's deadline. An intranet account has no owner and an end date years out, so it can't be reconciled. One sits in Domain Admins. Meanwhile the plan completes a migration that started forty days ago, and creates two new group accounts.

## Slide 15 — Lab 1: the island list, a dry run and a refusal

Next you read the island list and the reconciliation side by side. Two rows aren't ready for hand-off, so the flag stays false, which is the point: an incomplete list never goes. Then the write path. A dry run with the approved hash reports the four writes it would send. Applying it to the fake sends them, and the results tell the operator what comes next, such as installing each new account on its hosts. Finally you pass a hash nobody approved, and it refuses outright. The full suite is five hundred thirteen passing tests.

## Slide 16 — Lab 2: a test domain, a real migration

Lab 2 moves to a test domain, never production, with a Windows Server 2025 domain controller and member server. You make two test accounts, one for each path, and grant the reader only a narrow delegated read of the root key's dates, recording whether that really works without exposing the key. A second person reviews the plan and hands you its hash. You apply it as a person, then run the next plan to start the migration, restart only the test service, and watch the Kerberos events. After twenty-eight days, complete it, or back it out by hand.

## Slide 17 — Dangers, and the guard for each

Each of these failures has a guard in the code. The biggest is the one the chapter is built around: an account left behind when A D retires, and the guard is the reconciliation, rerun whenever the end-state decision changes. Others are about the migration itself: completing too early, on a host that can't use the new account, or deleting the old one so there's no way back. Then the quieter ones: reading the root key as a secret, widening retrievers by hand, or a plan that changed after review. Each guard is a rule that runs every time.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every Kerberos account has a reviewed decision. The root key was checked without anyone holding administrator rights. Retrievers match the reviewed list, no migration broke the limits or finished early, and every plan was approved by someone other than the person who applied it. Nothing was deleted. Every island account has an owner and an end date inside the deadline, and every managed account has a reconciled destination. With the Kerberos accounts accounted for, Chapter 7 turns to least privilege for service principals. Thanks for watching.
