# Building Provider Notices, Chapter 07 — The Weekly Digest and Evidence — narration script (practice copy)

## Slide 1 — Chapter 07: The Weekly Digest and Evidence

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 7: the weekly digest, and evidence. The digest is for the people who act; the evidence is for the people who check. Both come from the same runs, so neither can drift from what was actually read. We'll start from what the implementation guide asks the security officer to keep, then read the digest's five sections, the evidence record, the chain and the stage check, and walk two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why the digest and the evidence share the runs

Why put the digest and the evidence in one chapter? Because they serve two different audiences from the same runs. The digest is for the people who act on notices. The evidence is for the people who check that the work happened. If both come from the same run folders, neither can drift from what the kit actually read. By the end of this chapter you can write the weekly digest from a collection and the routing state, record every run as evidence the security officer can verify with a hash, and say which of a stage's steps have a passing record.

## Slide 3 — What the guide asks the ISSO to keep

Start from what the implementation guide's evidence section asks for, gate by gate. From each provider, Azure, Microsoft 365, Oracle Cloud Infrastructure, AWS and Google Cloud, the raw output, the notices and the manifest. From routing, the payloads, the routing table and the state. And the digests, preflight results and evidence records, with an index and a file of hashes. The guide maps them to NIST controls for external services, advisories, change control, contingency planning, risk assessment, monitoring and audit protection, and to the indicators FedRAMP lists for them. The kit's records support those controls; the assessor decides them.

## Slide 4 — What the guide leaves to you, and the verdict

Naming the evidence isn't the same as having it. Owners read a page, not a JSON file, so the kit writes the digest as a readable page and a spreadsheet. A folder of files can be changed after the fact, so each run is checked against its manifest, copied, and recorded with every file's hash. Someone has to say which run supports which control, so each record names its steps. A record removed from the middle would go unnoticed, so each record holds the hash of the one before it. And a go/no-go needs to know which steps still lack evidence.

## Slide 5 — The digest: five sections for the owners

The digest reads a collection and the routing state, and writes a page, a spreadsheet and a manifest. The page has five sections. Open notices by provider, counted by kind and by whether action is required. Action required, soonest due first, each with the assignment group the routing named. Maintenance and changes starting in the next thirty days. What's new in the last seven days, by when the kit first saw it. And what closed, or stopped being listed, in the last seven days. The two windows are parameters, set in the scheduled run's settings.

## Slide 6 — The evidence record: one run, every file hashed

Now the evidence record. Recording a run folder does four things. It re-hashes every file the run's own manifest lists. It copies the folder into the evidence store. It writes a record with the time, the environment, the mode, the change record, the command, and the result, which is a pass only if every file matches its manifest. The record names the steps it covers, with their controls and indicators, the claim language, every file's hash, and the hash of the record before it. Then it appends the index and rewrites a sums file that a standard checksum tool can check.

## Slide 7 — Which run covers which step, and the chain

Each kind of run covers named steps. A collection covers one collect step for each provider it read, plus normalizing. A routing run covers routing, and the contingency step if a payload asked for a plan review. A digest covers the digest step. The runbook in Chapter 8 adds pre-flight, the scheduled run, the alert plan and rollback. And every record covers the evidence step itself. Two things make the folder checkable: the sums file, which says every file still matches, and the chain, where each record holds the previous record's hash, so a removed record breaks it.

## Slide 8 — The check, and the stage check for a go/no-go

Then there's the check. On its own, it verifies the sums file against every file and walks the chain. With a stage, it adds a row for each step that stage needs. A test stage needs pre-flight, the scheduled run, routing and the digest; production adds the alert plan. Any failing row exits with an error, which is exactly what the runbook's go or no-go reads. The tests cover the digest's sections and counts, the record's fields and claim language, the chain, a changed file, a removed record, a failed run, a stage's missing steps, and the requirements catalog itself.

## Slide 9 — Who reads the digest, who keeps the evidence

Who's involved? The owners read the digest each week and act on their rows. The security officer owns this gate: files each week's digest, keeps the records, and runs the go or no-go check. Developers maintain the digest, the record and the chain. One caution matters here more than anywhere. The evidence chain protects files from undetected change. It doesn't decide a control. Keep the evidence folder on agency storage, with the access the security officer sets.

## Slide 10 — Lab 1: a week of runs, then the digest

Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Step 1 makes a week of runs: Chapter 6's two collections and two routings, in one go. Day one routes twelve creates; the second week makes one create, four updates and one close. Step 2 writes the digest for the second week. Sixteen open notices, eight needing action, five starting in the next thirty days, two new, and four closed or no longer listed. It writes the page, the spreadsheet and a manifest.

## Slide 11 — Lab 1: read the digest's action-required table

Step 3 reads the digest as the owners will. The first table counts open notices by provider and kind: Azure, Microsoft 365, Oracle Cloud Infrastructure, AWS, and Google Cloud, which has nothing open this week. Then the action-required table, soonest due first, each with the team the routing named. An Oracle Cloud certificate bundle to replace by December 15, a Microsoft 365 retirement of basic authentication for SMTP client submission, the Azure retirement from Chapter 1. And at the bottom, the two with no date, shown as not stated.

## Slide 12 — Lab 1: upcoming, new, and closed this week

The rest of the digest looks ahead and back. Maintenance and changes starting in the next thirty days: an AWS database window, two Azure maintenance windows, and the rescheduled Oracle Cloud database maintenance in Ashburn. New in the last seven days: an Azure maintenance and a Microsoft 365 change. And closed or no longer listed: the AWS security notification and other notices the providers closed, plus the Azure incident that's simply no longer listed. The last line says the digest is neutral by design: what providers published and the routing the agency set. File it with the run's evidence.

## Slide 13 — Lab 1: record three runs as evidence

Step 4 records three runs as evidence: the second week's collection, its routing, and the digest. Each prints its record number, a pass, the steps it covers, and the controls and indicators those steps support. The collection covers all five providers and normalizing. The digest covers the digest step, and adds risk assessment. Notice the routing run: it adds the contingency step, and contingency planning among its controls, because one of its payloads asked for a contingency plan review.

## Slide 14 — Lab 1: check the chain and the test stage

Step 5 checks the chain: twenty-five files match the sums, and three records, chain unbroken. Step 6 checks the test stage's coverage, and here a failure is the right answer. A lab has no pre-flight and no scheduled run, so those two steps fail, routing and the digest pass, and the command exits with an error. That's exactly what a go or no-go would see: the gap, by name. Step 7 reads the records' index: three records, collect, route and digest, each a pass, with the steps it covers.

## Slide 15 — Lab 1: change a recorded file; run every test

Step 8 is the one to remember. Change a recorded file, by appending one line to the recorded digest, and check again. Both checks fail. The sums say the digest changed, and the chain says it no longer matches its record, naming the file. That's what protects the evidence from an edit after the fact. Step 9 runs the kit's whole test suite: a hundred and forty passed, none failed. Before step 8, you had an evidence folder whose sums file you could hand to the security officer. Delete the output folder when you're done.

## Slide 16 — Lab 2: a test environment's runs

Lab 2 uses real run folders from any earlier chapter's second lab, in a test tenant, account, tenancy or project, never production, kept on agency storage. Route and digest the test collection with the lab's routing and a new state file. Record all three runs, this time with the test change record's number, and check the chain. Then give the digest to the test environment's owners, and ask whether each action-required row reached the right person. To back it out, keep the stage's evidence with its change record, and delete only the copies outside agency storage.

## Slide 17 — Federal requirements and the evidence

Here's what this gate proves, against NIST's control catalog. The digest shows the owners got the week's notices, what needs action, by when and who owns it, which supports disseminating advisories, monitoring external services, and responding to risk. Each record, with its hashes and the chain, supports continuous monitoring and protecting audit information. A folder that's unchanged, and a change that's caught, is audit protection. And a stage check that names every gap supports continuous monitoring at the go or no-go. The indicators are FedRAMP's, mapped by the program. The records support these controls; the assessor decides them.

## Slide 18 — Dangers, and the guard for each

What breaks in production? The quietest failure is the weekly run stopping: no digest, no evidence, no tasks. The chain shows the gap in dates, and the go or no-go fails without a passing scheduled run. A recorded file edited later is caught by the sums and the record's hashes, and the check names the file. A record removed from the middle breaks the chain. A digest sent outside the agency publishes which clouds and services matter, so it stays on agency storage. And a pass is not a control decision: each record's claim says so.

## Slide 19 — Done when: the chapter's checklist

Here's what done looks like. The digest reaches every owner the routing names, every week. Every collection, routing run and digest is recorded, with the change record where there is one. The check passes on the evidence folder. The stage check lists every step the go or no-go needs, and each one passes. And the evidence folder lives on agency storage, with the access the security officer set. Next, Chapter 8 runs all of it, first in a test environment and then in production. Thanks for watching.
