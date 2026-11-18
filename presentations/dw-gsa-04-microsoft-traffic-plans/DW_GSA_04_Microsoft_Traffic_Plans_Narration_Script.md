# Building Global Secure Access, Chapter 04 — Microsoft Traffic and Change Plans — narration script (practice copy)

## Slide 1 — Chapter 04: Microsoft Traffic and Change Plans

Welcome back to Building Global Secure Access. This is Chapter 4: Microsoft traffic, and change plans. The Microsoft traffic profile is the prerequisite for everything identity-aware the service adds. Turning it on is also the first write, so this chapter builds the plan every later write goes through: a file a second person approves by its hash before anything changes. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.

## Slide 2 — Why the first write needs a plan

Why a plan, now? Because source IP restoration, the compliant network check and universal tenant restrictions all depend on the Microsoft traffic profile, and switching it on is the first time the kit changes anything. So the goal has two halves. Show that a ring's Microsoft 365 and Entra ID traffic goes through the service, carrying its real source address. And change the tenant only through a plan file whose hash a reviewer approved. It's for the developers, the platform owner who runs the changes, and the change board's reviewer.

## Slide 3 — What Microsoft Learn gives you

Here's what Learn gives. The Microsoft traffic profile acquires Microsoft 365 and Entra ID traffic, and only that profile can. Learn's Graph tutorial finds a profile by its traffic type and sets its state with a patch. Assigning users and groups is a portal step on the pages read. Signaling is source IP restoration and the signal Conditional Access needs. It's on by default for newer tenants, and Learn cautions that turning it off while policies depend on it can block users. The test compares a SharePoint sign-in's address with the client on and off. And Learn treats enabling a new profile as a major change.

## Slide 4 — What it leaves to you

What does it leave to you? Each change is one patch typed by hand, and a change board can't approve a command that isn't written down, so the kit writes the plan as a file, with every request and its hash. The assignment is a portal step, so the plan lists it as a manual line with the click path. A plan could turn signaling off in the wrong order, so plans turn it on first and only the rollback turns it off, last. A daily percentage has no pass or fail, so the check sums the week. And nothing ties a profile to its decision, so a profile with no approved decision fails.

## Slide 5 — The plan, and its four guards

Here's the plan. It reads a desired-state file: the three profiles' state, signaling, tagging, and the guide's Conditional Access policies as files. It compares them with a collection and writes the requests that close the gap, in a safe order: signaling, then profiles, then policies, then tagging, with the assignments as manual steps. Four guards. New policies are report-only, and enforcing one needs an explicit switch. A policy that doesn't exclude the emergency group isn't planned. Tagging waits for a blocking tenant restrictions default. And a drifted policy is brought back to its file. Nothing applies without the approved hash, a live collection and a delegated session.

## Slide 6 — Who plans, who approves, who applies

Who does what? The platform owner writes the desired state, plans and applies. A second person, the change board's reviewer, approves the plan's hash, and the change record keeps it. The security monitor reads the sign-in share. For permissions, the reads need Network Access Read All and access to the workspace. The writes are Network Access Read Write All for the profiles, signaling and tagging, and Policy Read Write Conditional Access for the policies. The portal assignment needs Application Administrator, activated through privileged identity management for the window only.

## Slide 7 — Lab 1: the sign-in share is under target

Lab 1. Steps 1 and 2 list the reads and writes and collect the whole pilot tenant, because the plan compares against everything. Step 3 runs the traffic checks. The profile and signaling are on, and the internet and private profiles each have an approved decision. But only two thousand five hundred fifty-five of two thousand eight hundred sign-ins, ninety-one percent, went through the service, under the ninety-five percent target. Step 4 reads the guide's query day by day: rising, but not there yet.

## Slide 8 — Lab 1: plan the pilot, read a step

Step 5 plans the pilot from its desired state. Two Graph steps. The internet profile goes off, because the pilot's desired state hasn't adopted Internet Access yet. And the administrative RDP policy goes back to its reviewed file; Chapter 6 says why. Two portal steps assign the pilot group. Then the plan's hash, and dry run, nothing changed. Step 6 reads the plan's first step in full, as the reviewer does before approving the hash: the call, the method, the address on graph dot microsoft dot com, and the reason.

## Slide 9 — Lab 1: fixture mode refuses to apply

Step 7 tries to apply the plan in fixture mode, with a made-up hash. It's refused before the hash is even read: apply runs only with a live invoker, and fixture mode never changes anything. The tests also show the other refusals: a live session with the wrong hash is refused, and the right hash sends the steps in order through the Graph runner. Step 8 runs this chapter's tests: nine passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: the profile on, from an approved plan

Lab 2 uses a test tenant with Entra ID P1, a pilot group of fictional users and a test device with the client. Sign in, collect, and plan from a desired file that only turns on Microsoft traffic and signaling. Send the plan and its hash to the reviewer, then apply it with the approved hash. Assign the pilot group in the portal, as the plan's manual line says. Validate with Learn's test, comparing the sign-in address with the client on and off, then the guide's query and the kit's checks. Back it out in the guide's order: remove the group, disable the profile, and leave signaling on. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

The profile and signaling support remote access control. The sign-in share, with the real source address, supports the content of audit records and system monitoring. And every plan, approved by its hash and applied in order, supports configuration change control and impact analysis. The guide reads this step as TIC 3.0's remote user pattern to a sanctioned cloud service. The assessor decides the controls. The dangers: a plan nobody read, Internet Access turned on before its decision, and signaling turned off while policies need it. You're done when the profile and signaling are on for the ring, the week's share meets the target, and every change came from an approved plan. Next, Chapter 5: the compliant network and tenant restrictions.
