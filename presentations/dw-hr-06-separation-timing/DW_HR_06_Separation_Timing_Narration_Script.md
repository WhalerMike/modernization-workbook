# Building HR-Driven Identity, Chapter 06 — Separation Timing from the Logs — narration script (practice copy)

## Slide 1 — Chapter 06: Separation Timing from the Logs

Welcome back to Building HR-Driven Identity. This is Chapter 6: separation timing from the logs. Saying the leaver workflow ran is a claim. Saying the account was blocked fifteen minutes after the effective time, and the card revoked eleven hours after, is evidence. This chapter computes that evidence for every leaver, from Microsoft's records alone. We'll see what Learn gives you, the two intervals, the nine rules, the read and its permissions, two labs and the dangers.

## Slide 2 — Why this gate needs code

Why does this gate need code? The guide's Gate 6 configures the leaver in the workbook's leaver order and asks for the timing to be proved. But no Microsoft report computes it. Lifecycle Workflows records that a run completed. The audit log records when the account was disabled. The card system and Intune record the rest, each in its own place. So this chapter computes the intervals: each leaver's time to block and time to revocation, the period's percentiles against the thresholds, and the separations that need someone's attention.

## Slide 3 — What Microsoft gives you

Start with what Microsoft gives you. The audit trail names four activities: disable account, enable account, delete user, and an update to the refresh token valid-from timestamp, each with its time, result, initiator and target. Each workflow run has its own record, with its status, its times and its count of failed tasks. The schedule moves the timing: every three hours by default, with a three-day catch-up window. And the disable task doesn't support users who hold directory roles.

## Slide 4 — What it leaves to you

Here's what those records leave to you, and each row is pinned by a test. The disable and the session update are separate records, and a disabled account with live sessions isn't blocked, so the block is the later of the two. A run's completion says the workflow finished, not when access stopped. The catch-up window is only prose, so a late entry gets its own rule. A failed disable sits in the same log, so only successful records count. And a failed task, or a re-enable, each gets a rule.

## Slide 5 — The two intervals

The code is one command, measure. It reads the exports, the HR separations, the card system's revocations, Intune's device actions and the privileged role holders, and writes the intervals, a summary and the findings with a manifest. For each passed separation, blocked is the later of the disable and the session update. Revoked is the latest of the block, the card revocation and the last device action. A cancelled separation is listed, not measured. One open point: Lab 2 confirms which task writes the session update.

## Slide 6 — The rules: ST-01 to ST-05

Nine rules turn the intervals into a work list. S T 1 flags a block slower than the threshold, which is P S 4's organization-defined period; the sample is four hours. S T 2 flags a leaver who was never blocked. S T 3 flags a separation entered more than three days late: a finding if nothing caught it, a warning if an on-demand run did. S T 4 flags an uncollected card revoked more than eighteen hours after notice, from FIPS 201-3. And S T 5 flags a re-enable that HR didn't cancel.

## Slide 7 — The rules: ST-06 to ST-09, and the thresholds

S T 6 warns when a privileged role holder leaves, because Learn says the disable task doesn't support role holders. S T 7 sends a failed leaver run, or one with failed tasks, to a high-priority exception. S T 8 flags a user deleted before the device retire or wipe completed, since disposal comes last. And S T 9 flags revocation slower than its threshold; the sample is twenty-four hours. The thresholds are samples. The agency sets the period, and the tenant schedule is part of it, so set them together.

## Slide 8 — The read: two permissions, which cloud

The read needs two permissions, each the least privileged for its call: audit log read for the directory audits, and the Lifecycle Workflows reports read permission for a workflow's processing results. Both come from Microsoft Graph, on the endpoint for your cloud, and both APIs are listed for the US Government L4 and L5 clouds. Lifecycle Workflows is available in Azure for US Government. The card system's and Intune's records arrive as exports; the code reads neither service.

## Slide 9 — The tests: four for this chapter

Four tests cover this chapter: the intervals and the summary, every rule on the fixture, a failed audit record that isn't a block, and a cancelled separation that isn't flagged. With the other chapters' tests, fifty-seven pass under Python 3.10 or later, with no package, tenant or network. Remember that the code is illustrative. It runs against fictional leavers and exports, so review it and run Lab 2 in a test tenant before it reports a real leaver.

## Slide 10 — The verified facts

These are the facts behind the code, each read on Learn on November first. The four audit activities are generally available. The directory audits list needs audit log read and filters on equals, greater or equal, less or equal, and starts with. The processing results list needs the reports read permission, and both are in the L4 and L5 clouds. The schedule runs every three hours by default with a three-day catch-up. The disable task excludes role holders. And Lifecycle Workflows is available for US Government.

## Slide 11 — Where Learn says nothing or differs

Two places where Learn says nothing or differs are written down, so a later edit doesn't loosen the code. First, what records the revocation: Learn lists the timestamp update but doesn't tie it to the revoke task, and Lab 2 confirms it. Second, the preview trigger. Learn says version two of the time-based attribute trigger, still in preview, has no three-day catch-up window. Rule S T 3 assumes the standard trigger, so a workflow on version two skips a late separation even inside three days.

## Slide 12 — What the intervals prove, and for whom

What does this prove? Each leaver's two intervals against the organization-defined period, which is personnel termination and disabling accounts, P S 4 and A C 2 enhancement 3, in the Moderate baseline. The I S S O keeps each run's outputs with the manifest and the exports behind them. The same intervals cover contractors under P S 7. Rule S T 4 shows FIPS 201-3's eighteen-hour card rule. And the on-demand emergency path supports high-risk disables. The summary's percentiles feed Chapter 7's metrics.

## Slide 13 — Who builds, who owns, who reports

Who does what? Developers build the leaver's evidence, and need to read Python, but no tenant until Lab 2. The security team owns the leaver path end to end, including the privileged leavers the disable task can't handle. And the I S S O reports P S 4, keeping each run's intervals, summary and findings with the manifest. The checklist makes ownership concrete: every late entry, re-enable, failed run and early delete has an owner and a closure, and every privileged leaver has a recorded verified path.

## Slide 14 — Lab 1: the read and the measurement

Lab 1 runs on a laptop with Python 3.10 or later. Step one lists the read: two calls, two read permissions, nothing that writes. Step two measures the fictional leavers: seven separated, one cancelled, one not blocked. The median block is a quarter of an hour, but the ninetieth percentile is five and a half hours against a four-hour threshold, and revocation's ninetieth percentile is a hundred and ten hours against twenty-four. Ten findings and two warnings, so it exits with code two.

## Slide 15 — Lab 1: the findings and the intervals

Steps three and four read the findings and the intervals side by side. Every fictional leaver tells a story. Casey blocked after five and a half hours, and Casey's uncollected card was revoked twenty-three hours after notice. Drew was entered almost seven days late, and the only disable failed, so Drew was never blocked. Emery was caught on demand, but blocked after eighty-five hours. Harper was re-enabled by the pipeline and had a failed task. Kai holds a privileged role. And Blake was deleted before the device retire completed.

## Slide 16 — Lab 1: the tests, then clean up

Step five runs the tests: fifty-seven pass. Then delete the output folder either way. The tool refuses to write into a folder that already holds a run, and Chapter 7's first step measures the separations again into the same place.

## Slide 17 — Lab 2: measure a real test leaver

Lab 2 uses a test tenant with a leaver workflow in the workbook's leaver order; the authors haven't run it. Register a reader app with only the two permissions. Give one test user a leave date a few hours ahead and wait for the scheduled run, and run the leaver on demand for a second. Export the logs, and confirm which activity the revoke task really wrote, and who initiated it. Then measure. Each block should include the wait for the tenant schedule. Finally, back everything out.

## Slide 18 — Dangers, and the guard for each

The dangers are quiet ones. A disable with live sessions lets the leaver keep working, so the block needs both records. A late H R entry is never processed by the schedule, so S T 3 runs every time. A late re-send brings the account back. A failed revocation leaves the card valid with nobody hearing. A privileged leaver's disable task can't run. Deleting before devices are retired leaves certificates valid. A threshold set without the schedule passes everyone. And logs that age out before export can't prove anything later.

## Slide 19 — Done when: the separation checklist

Here's what done looks like. The configuration holds the agency's approved thresholds, and the tenant schedule fits inside the block threshold. Lab 2 confirmed which activity the revoke task writes. The run covers every separation in the period, with no leaver left unblocked. Every late entry, re-enable, failed run and early delete has an owner and a closure. Every privileged leaver has a verified path. And the reader app holds exactly two permissions. Next, Chapter 7: lifecycle drift, metrics and evidence. Thanks for watching.
