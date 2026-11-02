# Building HR-Driven Identity, Chapter 07 — Lifecycle Drift, Metrics and Evidence — narration script (practice copy)

## Slide 1 — Chapter 07: Lifecycle Drift, Metrics and Evidence

Welcome back to Building HR-Driven Identity. This is Chapter 7: lifecycle drift, metrics and evidence. Six gates set the lifecycle up. This one proves, every day, that it still runs the way the first six said, and leaves a record that outlives the accounts it describes. We'll see the run that finds six drift classes and computes six metrics, the packager that hashes and chains each run, the period an I S S O signs, who does what, two labs and the dangers.

## Slide 2 — Why a daily proof, and a record that outlives accounts

Why does this gate exist? Because the first six only set things up; something has to show they keep working. And the evidence has to survive. Entra's own retention is short: thirty days for audit logs with P1 or P2, thirty for provisioning logs with a premium edition, and up to thirty days of Lifecycle Workflows history, none of it retroactive. The accounts get disposed of; the record of what happened to them must outlive them. Attribute drift and schema drift are out of scope on purpose; other tools find them.

## Slide 3 — Start from Book 19's pipeline, and what it leaves

Microsoft documents log retention and routing, but publishes no sample that computes lifecycle metrics or joins HR, the directory and a card system into drift classes. So the nearest start is the program's own drift pipeline from the Federal Modernization Workbook's Book 19, Chapter 9. It compares validation kit runs, keeps names out of the tracker and writes hashed, chained evidence packages. What it can't do is read lifecycle inputs, compute metrics against thresholds, or assemble a period. The verdict: keep it as the scheduler, the sign-in and the hashing, and give it a run shaped for the lifecycle.

## Slide 4 — The run: what it reads and writes

The run reads the HR export and the contractor decisions from Chapter 2, the workforce users, the validation kit's exceptions and the card system's status export. Optionally it reads the outputs of Chapters 1, 3, 4 and 6, and checks each against its own manifest before reading it. Thresholds come from a reviewed config file. It writes its folder once, refusing one that exists: a run file recording the tenant, cloud, mode, window and the hash of every input, plus the findings and metrics. And the mode, fixture or tenant, is required.

## Slide 5 — Six lifecycle drift classes

Here are the six classes, all from Book 3. A worker record with no account is missing identity. An enabled account for someone terminated, or a contractor past the earliest end, is stale access. An enabled account that matches nobody and no owned exception is an orphan. A second writer or forbidden write from Chapter 1's scan is an unauthorized write, keeping Chapter 1's object key so the fingerprint matches. And an active PIV card for a separated worker, or for a contractor the source no longer holds, is credential drift.

## Slide 6 — Six metrics, each against a threshold

The six metrics are Book 3's measured lifecycle. Separation-to-block and separation-to-revocation come from Chapter 6, at the ninetieth percentile. Transfer-to-review comes from Chapter 4, and stays open while the review is open. Joiner readiness comes from Chapter 3. Correlation coverage and derivation purity this run computes itself. A metric over its threshold is a warning. And the key rule: a metric with no input is reported as not measured, never as zero. The thresholds are proposed starting values; choosing them is the agency's decision.

## Slide 7 — The package, the chain and the period

The packager has three commands. Package checks the run, every file and nothing extra, one tenant, cloud and mode, only read requests, and writes a summary with fingerprints but no names, an evidence manifest that names the previous package, and a checksum file. It refuses a chain for another tenant. Verify rechecks every file. And period verifies every package in the window, reports chain breaks and coverage gaps, gives each metric's series, and maps what's still open to the controls. That mapping is design guidance; the assessor decides each control.

## Slide 8 — The verified facts

The facts behind the code, each read on November first. The run's only new Graph read lists users with their leave date, which needs User Read All with the lifecycle info read permission. The Graph host depends on the cloud: graph dot microsoft dot com for G C C, graph dot microsoft dot U S for G C C High, and its D o D variant. Audit and provisioning logs keep thirty days with a premium edition, seven with Free, and Lifecycle Workflows history up to thirty. Reporting and SIEM connectivity are available in Azure Government. The metrics and classes themselves are Book 3's design.

## Slide 9 — What stays open, and what's design guidance

Some points stay open, recorded so a later edit doesn't loosen the code. The guide's Step 7 joins credential drift from the card system with Intune reports; this run reads the card system only, and says so, until the agency's Intune report is in the evidence store. The thresholds are proposed starting values, not approved ones. The period's control mapping is design guidance; the assessor decides. And Gate 7's fourth criterion, proof that HR is the sole source, is reported as not decided by this code.

## Slide 10 — What the evidence proves, and for whom

What does this prove? For continuous monitoring, CA-7, the metrics per run and their series per period, against thresholds in a reviewed file. For audit review, AU-6, the unauthorized writes from Chapter 1's scan, closed at the source. For retention, AU-11 and SI-12, packages written once, hash-chained and kept outside the directory. Continuous reporting under BOD 25-01 is not this code; ScubaGear results sit beside the period. And account management and personnel controls come from the other classes, in a table the assessor reads, not decides from.

## Slide 11 — Who runs the checks, who fixes, who signs

Who does what? Platform and pipeline engineers own the scheduled checks. Identity engineers close findings, and they close them at the source, the owner of the fact, because a fix made in the directory just comes back on the next feed. The next run closes a finding only if the source changed. And the I S S O receives the evidence, checks every package with nothing more than a checksum tool, and signs the period.

## Slide 12 — Lab 1: the chapter outputs, then the first run

Lab 1 runs on a laptop. Step one writes the outputs the run reads, one command each from Chapters 1, 2, 3, 4 and 6. Each exits with code two because each fixture holds findings: one of four hires ready on day one, and a ninetieth percentile separation-to-block of five and a half hours against a threshold of four. Step two writes the first run. It reads four chapter outputs, and five metrics are out of bounds. Transfer-to-review shows not measured, not zero. Fourteen findings and six warnings.

## Slide 13 — Lab 1: reading the findings

Step three reads the findings. Worker one-oh-oh-one-oh-four has no account. Two people terminated in HR are still enabled, and one contractor is past the earliest end. Two orphans: a print kiosk whose exception has no owner, and an old temp account; a scanner service account isn't flagged, because its exception has an owner. Five unauthorized writes carry over from Chapter 1. Then one active card for a separated worker, and two contractor cards. The warnings are the five metrics out of bounds and the mover's review, still open.

## Slide 14 — Lab 1: package both runs, chained, and verify

Step four writes the next day's run with the same inputs and a one-day window; it prints the same metrics and counts. Step five packages both. The first package opens all twenty counted findings. The second names the first package's manifest, opens none and closes none, because nothing changed. Verify rechecks the six files. Then the check an I S S O runs needs nothing but the standard checksum tool: every file in the second package reports OK.

## Slide 15 — Lab 1: the period, and the tests

Step six assembles the period. Two packages, no chain breaks, no coverage gaps, but it isn't complete: drift is open, five metrics are out of bounds, and transfer-to-review isn't measured. So it exits with code two. The summary lists the controls with their open findings, and scores Gate 7: drift classes and metrics not met, evidence unbroken met, sole source not decided by this code. Step seven runs the tests, including the chapter's four drift tests and six package tests: fifty-seven pass, then a hundred and forty-two, with no tenant and no network. Delete the output folder afterwards; it holds fictional names.

## Slide 16 — Lab 2: a run against a test tenant

Lab 2 runs it against a test tenant, never production; the authors haven't run it. Register a reader app with a certificate or federated credential, and grant only the two permissions the export lists. Run Chapters 1 through 6 against the test tenant and keep their folders. Write a run in tenant mode and read every finding. Schedule it in Book 19's workflow with no secret, writing packages to an immutable container outside the directory, each naming the last. After a few runs, check that a skipped day shows as a gap. Then back it all out.

## Slide 17 — Dangers, and the guard for each

The dangers are about evidence that looks fine but isn't. A metric from an edited chapter output proves nothing, so each input is checked against its manifest. A missing input read as zero looks met, so it's a not-measured warning instead. A lab run filed as tenant evidence puts fiction in the package, so the mode is required. Two tenants can't share a chain. Names stay out of the summary. A skipped day shows as a gap. Fix findings at the source. And route logs out from the pilot's first day, before they expire.

## Slide 18 — Done when: the Gate 7 checklist

Here's what done looks like. Every input is the latest run of its chapter, and its hash matches. The thresholds are the agency's approved values, not the samples. Every finding has an owner of the fact and a ticket at the source. Each package names the one before, and verify passes on all of them. The period has no gaps or breaks, and the I S S O has signed it. The evidence sits outside the directory, immutable. That closes the workbook. Thanks for watching.
