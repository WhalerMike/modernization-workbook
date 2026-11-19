# Building Defender XDR, Chapter 08 — The Monthly Evidence Run — narration script (practice copy)

## Slide 1 — Chapter 08: The Monthly Evidence Run

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 8: the monthly evidence run. The metrics measure what the controls do, not whether a setting exists, and the evidence is a chain a security officer can check with one command. We'll start from the guide's monthly run, read the one command that replaces it, the metrics and the evidence record, and walk two labs, including one where we change a recorded file and watch the check catch it. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.

## Slide 2 — Why the month needs one command and a chain

Why one command, and why a chain? Because the guide's metrics measure what the controls actually do, not whether a setting exists, and those numbers have to come from the month's real runs. And because evidence the security officer can't verify alone is just a folder of files. By the end of this chapter you can produce the month's evidence package in one command, read the guide's metrics from it, and show the security officer it hasn't changed since. It's for the developers, the platform owner who owns the run, and the security officer who receives it.

## Slide 3 — What the guide's monthly run gives you

Here's the guide's monthly run. Connect with the two read scopes. Run three hunting queries, coverage, attack surface reduction and prevention, into JSON files. Export the month's incidents, filtered on created date time, which Learn lists as filterable. And hash the folder, so a re-hash next month must match. The guide also gives seven metric formulas, and an evidence catalog with each artifact's kind, gate and retention, which are the program's design.

## Slide 4 — What the guide's run leaves to you

What does that leave to you? Seven gates' checks aren't in it, so the kit runs every check into its own folder with a manifest. A hash list can be regenerated after an edit, so each record holds the hash of the one before. Files don't name their controls, so each record does. A run that found five tickets hashes as cleanly as one that found none, so each record carries the run's own result, and the go or no-go fails until the findings close. Someone computes the metrics by hand, so the kit writes them. And Graph carries no assignment or containment time, so mean time to triage is reported as not computed, with where to get it.

## Slide 5 — The run, the metrics and the record

One command runs every check from Chapters 1 to 7, each into its own folder, then the metrics, and with an evidence path, records every folder. A check that throws, a missing input or a refused session, is an error row, and the others still run. Each record holds the time, the environment, the change record, the command, two results, the files' integrity and the run's own check, the steps with their controls and indicators, the claim, every file's hash, and the previous record's hash. The check re-hashes everything and walks the chain. With a stage, it adds a row per step, which passes only with intact files and a passing check.

## Slide 6 — The metrics, and where each comes from

Here's where each metric comes from. Protected coverage and exception exposure, from the coverage run. Enforcement depth, devices with every applicable rule in block, from the A S R run against the onboarded count. Prevention effectiveness, blocks per thousand onboarded devices per week, from the prevention events and the A S R events scaled to a week. Expired exclusions. Detection validity, from the detection run. And synthetic-event success, from the quarter's exercise record. Mean time to triage and to contain isn't computed: the kit says to take it from the ticketing system or the Action center history.

## Slide 7 — Who runs it, who receives it

Who's involved? The platform owner owns the run, monthly, with the change record. The security officer receives the metrics and the hash file, and re-checks last month's folder this month. The security operations lead runs the quarter's synthetic events and files the exercise record. One caution about Lab 1: the fixtures carry deliberate faults, so most runs record a failed check, and the go or no-go fails. That's the point. Evidence of a finding is still evidence, but it isn't a go.

## Slide 8 — Lab 1: run the month, read the metrics

Lab 1, in the kit's folder. Step 1 runs the month and records every run, with a lab change record. Ten run folders, ten records. Only signals and the metrics pass their own checks; every other run found something, as the earlier chapters showed. Step 2 reads the metrics. Protected coverage, sixty-four point three percent. Two of eleven onboarded devices have every rule in block. One of one enabled detection has a passing test. Four of five synthetic events did what they should. And mean time to triage says not computed, and why.

## Slide 9 — Lab 1: the records, the chain, the go/no-go

Step 3 reads the records' index. Result is the files' integrity, and every record passes. Check result is what the run found, and most fail. Step 4 checks the chain: every file matches its hash, ten records, chain unbroken. Step 5 runs the production stage's go or no-go, and it fails, saying why for each step: no pre-flight record, runs whose own checks failed, and no scheduled run yet. Only signals and the metrics pass. The command exits with an error, which is what a go or no-go should see.

## Slide 10 — Lab 1: change a recorded file; run the tests

Step 6 is the one to remember. Append one line to a recorded tickets file, and check again. Both checks fail. The sums say the file changed, and the chain says it no longer matches its record, naming the file. That's what protects the evidence from an edit after the fact. Step 7 runs the evidence tests: all pass, none fail. Before step 6, you had a folder whose hash file you could hand to the security officer. Delete the output folder when you're done.

## Slide 11 — Lab 2: the month in a test tenant

Lab 2 uses a test tenant, never production, with every earlier chapter's Lab 2 inputs named in your settings file. Sign in with the read scopes. Run the month with an evidence path on agency storage and the change record, then check it. Give the metrics and the hash file to the security officer. Next month, run the check again on this month's folder: last month's files must still match. Nothing changed in the tenant, and the evidence stays with its change record, so you just sign out.

## Slide 12 — Federal requirements and the evidence

Here's what this gate proves, against NIST's catalog. The month's metrics, from the month's runs, support continuous monitoring. Each run recorded with its controls, indicators, check result and hashes supports continuous monitoring and protecting audit information. Kept and unchanged supports audit protection and retention. And the exercise's synthetic events support incident response testing. The indicators are FedRAMP's, as the guide maps them. Each record carries the claim itself: it supports the controls, and the assessor decides them.

## Slide 13 — Dangers, and the guard for each

What breaks in production? A run with findings read as evidence of a control leads to a go on a fleet with gaps; the check result in every record, and a go or no-go that fails until the run passes, guard it. A file edited after recording is caught by the hashes, by name. A removed record breaks the chain. Advanced hunting only keeps thirty days, so the run files results every month. And a metric computed from a field that doesn't hold it is a misleading number, so the kit says not computed, and where the number lives.

## Slide 14 — Done when: the chapter's checklist

Here's what done looks like. The monthly run is scheduled and runs with the change record. The metrics reach the security officer each month. The check passes on last month's folder this month. The quarter's exercise record is named in the settings. And the evidence folder is on agency storage, kept to the evidence catalog's retention. Next, Chapter 9 schedules this run and takes the kit live, test first, then production. Thanks for watching.
