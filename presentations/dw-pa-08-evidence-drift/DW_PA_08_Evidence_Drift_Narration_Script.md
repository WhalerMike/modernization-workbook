# Building Privileged Access, Chapter 08 — Evidence and Drift for the ISSO — narration script (practice copy)

## Slide 1 — Chapter 08: Evidence and Drift for the ISSO

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 8, the last one: evidence and drift for the ISSO. An inventory taken once only proves the day it was taken. The ISSO needs every day of the period, every elevation in it, and a record nobody could have edited afterwards. We'll start from Learn's audit queries for PIM, see what they leave out, then walk the run, the comparison, the package, the period, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — What the evidence has to show

Why does this chapter exist? Because the program's last gates ask for things a single snapshot can't give: a Tier 0 drift handled as an incident, and evidence for every elevation in the period. Book 04 already says what goes in the package. Learn supplies the two facts the design turns on. First, the audit log only keeps thirty days, so evidence has to be collected before it ages out. Second, one activation can show up under several correlation IDs, but its request ID never changes. That request ID becomes the key.

## Slide 3 — Which cloud: the audit read's Graph host

Next, which cloud. The new read in this chapter is the directory audit log in Microsoft Graph. This estate's GCC tenant uses the worldwide Graph endpoint, and its Azure reads go to the commercial Resource Manager host. GCC High and the Department of Defense clouds have their own Graph hosts, and Learn lists the audit API as available in both government levels, with PIM available everywhere too. As in every chapter, the cloud is a required choice with no default, and the reader refuses to send a token anywhere else.

## Slide 4 — Learn's PIM audit page and its three queries

Here's what Microsoft gives you. Learn's audit history page shows PIM's own audit view, says it covers thirty days, and gives three sample queries: one for role activations, one that follows a single request, and one that follows a whole cycle from activation to deactivation. Learn's activity list names every event PIM logs, and its security operations guide says what to watch. The queries only exist in the web page, so the repository pins it, unmodified, and the tests run all three over a set of fictional audit rows. It's a test, not a query engine.

## Slide 5 — What the queries find, and what they mix up

Running the queries over fictional rows shows exactly what they catch. The first query finds the activations, which is good. But it also sweeps in two role assignments made outside PIM, so a standing Tier 0 assignment looks like just another activation. It misses deactivations and the setting change Learn says to always alert on. And the second query, copied with its placeholder, doesn't select one request at all; it returns everything with a request ID. Given a real ID, though, the queries show the key idea: one request, three correlation IDs, one activation. The code keeps that.

## Slide 6 — What the queries leave out entirely

The bigger gaps are about scale and proof. The queries look at one request at a time, with no window, no tier, and no check that anyone approved it, and "every elevation in the period" can't be shown one request at a time. They also only run in Log Analytics, which needs a workspace before any evidence exists. And they stop at the query: nothing compares, packages or hands anything to the ISSO. So the verdict: keep Learn's request ID as the key and its activity names as the vocabulary, but don't treat the first query as evidence of elevation.

## Slide 7 — The run: state, events, and one folder per run

Now the code, in two pieces: a PowerShell run that reads the tenant, and new Python files beside the first workbook's drift pipeline, which stays unchanged. The design has three parts. Chapters 1 and 2 describe the tenant's state. The audit read describes the events in a window. And comparing with the last run turns state into drift. Chain those windows with no gaps, and you have every elevation in the period, in code. Each run writes one folder, with a run file that records the cloud, tenant, window and a hash of each task's manifest.

## Slide 8 — The audit read, and what it flags

The audit read asks Graph's directory audit log for one window at a time: everything PIM logged, plus the role assignments the directory logs when someone goes around PIM. It goes through the same careful reader as Chapter 1, refuses a window older than the log keeps, and starts each window where the last one ended, so no hour goes unread. It keeps IDs and drops names. Then four checks: a role assigned outside PIM, a sensitive activation with no approval, someone approving their own request, and a PIM setting changed.

## Slide 9 — Where Learn's pages differ, and why it fails closed

Learn's pages disagree in two places that matter here, and the chapter writes both down so nobody quietly loosens the code later. They name PIM's logging service differently, so the code asks for both names and removes duplicates. And they disagree on where approvals are logged. The code reads PIM's service, so if an approval only shows up somewhere else, the no-approval check fires anyway. That's deliberate: it fails closed, giving a false finding rather than a missed one. The lab in a test tenant then records which way each one really goes.

## Slide 10 — Compare, by fingerprint; Tier 0 drift is an incident

The comparison is where state becomes drift. Before it compares anything, it checks both runs: every file against its manifest, the same tenant, cloud and mode, and a current run that's actually later. Then every difference gets a result. Two of them are careful by design. A task that failed this time is unverified, not resolved, so a permissions error can't make yesterday's findings vanish. And activations are left out of assignment drift, because they come and go within hours and the audit already records them. Any Tier 0 change is an incident, as Book 04 says.

## Slide 11 — No names in the tracker; packages in a hash chain

Two design choices protect the evidence. First, no names reach the issue tracker. Issue titles come from a fixed catalog, bodies carry object IDs and fingerprints, and a test checks that no name from either run slips through. Names stay in the access-controlled evidence store. Second, each package records the hash of the one before it, so the packages form a chain. Replace a package, or skip a day, and the chain breaks visibly. There's no signature; the hashes plus storage that can't be edited or deleted do that job, and signing stays the ISSO's choice.

## Slide 12 — The period the ISSO receives, and the schedule

This is the deliverable. For any period, the code verifies every package, checks the chain, confirms the windows cover the whole period with no gap, and writes a summary laid out against Gate 4. It's clear about who decides what: the authorizing official accepts residual standing privilege, the ISSO judges the elevations, and one criterion, retiring old group policy settings, simply isn't a privileged read. The sample workflow runs daily with a federated sign-in and no secret, and assembles last month's period on the first. Six-hourly runs need only a shorter schedule.

## Slide 13 — Who runs it, who receives it, what it may read

Who is this for? Developers and pipeline engineers own the scheduled checks. The ISSO and the identity governance officers receive the evidence, and they can check every package with nothing more than a standard hashing tool. The governance officer signs the period summary, and the authorizing official accepts whatever standing privilege remains. The reader app holds nine Graph permissions, and not one of them can write, plus Reader on each Azure scope. It signs in with a certificate or a federated credential, never a secret.

## Slide 14 — Lab 1: Learn's queries and two days of runs

Lab 1 runs on a laptop with no tenant. First, run Learn's queries over the fictional audit rows. Eight tests pass, and the third shows the trap: two of the rows the first query returns are assignments made outside PIM. Next, list the run's permissions. There are nine, and none of them can write. Then run two days against the fictional tenant. The second day has three Tier 0 findings: a role assigned outside PIM, an activation nobody approved, and a changed role setting. Open the events file, and you'll see IDs, not names.

## Slide 15 — Lab 1: compare, package, the period, a break

The second half of the lab follows the evidence all the way to the ISSO. Compare day one, and it's the baseline. Compare day two, and six incidents appear, while six old findings resolve. Draft the issues, and a search for the fictional domain finds nothing: no names reach the tracker. Package day two, chained to day one, and it verifies. Assemble the period, and the Gate 4 table shows two criteria not met, which is exactly right for this tenant. Finally, edit one file or swap the days, and the checks refuse.

## Slide 16 — Lab 2: a test tenant, one activation, read twice

Lab 2 uses a test tenant, never production, and the run only reads. You register the reader app with the nine permissions, make one test activation of a low-tier role, and run the evidence twice, once before and once after. Then comes the real point of the lab: checking what the fixtures assumed, like which service name PIM's events carry and whether the request ID is filled in. Cross-check against PIM's own audit view, as Learn describes, then compare and package the two runs. Back it out, and in production, lock the retention policy.

## Slide 17 — Dangers, and the guard for each

Every danger here is a way evidence can lie. The quietest is a failed read that looks like a fix: a permissions error, and yesterday's findings simply vanish. The code marks the task as an error and keeps those findings open. Close behind is a day nobody read, which would let a gate pass on the days that were. Others are about trust: names leaking into the tracker, a run edited or swapped, a package quietly replaced. And one is about attention: count every activation as drift, and people stop reading the incident queue.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the run side: all three tasks succeed, the reader holds exactly nine read-only permissions and no secret, every window picks up where the last one ended, and every Tier 0 incident has a record. On the evidence side: no names in the tracker, every package verifies with a standard hashing tool, the chain is unbroken, the storage is locked, and the period summary is signed and accepted. That's the last chapter; the workbook index lists all eight if you want to go back. Thanks for watching.
