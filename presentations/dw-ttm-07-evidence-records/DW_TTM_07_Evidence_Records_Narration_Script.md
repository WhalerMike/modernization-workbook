# Building Ticket-to-Machine, Chapter 07 — Evidence Records for Book 13 and the ISSO — narration script (practice copy)

## Slide 1 — Chapter 07: Evidence Records for Book 13 and the ISSO

Welcome back to Building Ticket-to-Machine. This is Chapter 7: evidence records for the Federal Modernization Workbook's Book 13 and the I S S O. The I S S O doesn't need the tracker. The I S S O needs one record per finding, in one shape, that nobody could have edited afterwards without it showing. This chapter reads closed findings out of ServiceNow, writes each in Book 13's evidence shape, checks what an assessor would check, and packages the period with a hash chain and a verifier. Then two labs and the dangers.

## Slide 2 — Why the ISSO needs records, not the tracker

Why records rather than the tracker? Because an assessor asks different questions from an operator. Chapter 5's re-read client already writes evidence onto every record it closes, but nothing read those records back out. And the assessor's worries are specific: was a record edited after it closed, so it now says something the re-read didn't? Was one quietly deleted, so the period only looks complete? Were fields filled in to claim an approval or an execution that never happened? This chapter answers each one.

## Slide 3 — One record per finding, in Book 13's shape

Each closed finding becomes one record with Book 13's seven fields. Origin: when and where the drift was detected. Owner and clock: who, how urgent, when it was due and whether it finished in time. The result: the re-read evidence and whether it's intact. And the closure, with its lane. The other three fields, approval, the executing identity and what ran, are written as null, each with its reason: Pass 1 doesn't actuate. The record says what it doesn't hold, rather than leaving the field out or filling it in.

## Slide 4 — Four checks per record, each reported by name

Every record gets four checks, each reported by name. Is the evidence intact: does it still hash to the stored hash? An edit after closure fails, and so does a value cut short by the field's four-thousand-character limit. Is there evidence at all? A close that bypassed the business rule fails. Did the evidence say the intended state matched? And did it finish inside its window? Window adherence is measured as closures inside the window over closures judged, not a ratio that improves just because new findings arrive.

## Slide 5 — The package: a hash per file and a chain

Then the package. Each line of the records file carries the hash of the line before it, so removing or reordering a record breaks the chain. The excerpt on the slide is the whole idea in seven lines. A summary file holds window adherence, the declared exceptions and the records with problems. And a manifest holds a hash of every file and the chain's head. Next month's export continues the chain from this month's manifest, and a fixed timestamp means the same records always give the same bytes.

## Slide 6 — The verifier, the live read, five records

Two more pieces. A verifier recomputes every file's hash and walks the chain; that's the check an I S S O runs on a package someone hands them. And a live read pulls closed and cancelled findings through the Table API, under its own read-only role from Chapter 2, so the export can never close anything. Five fictional records cover the cases: one closed in its window, one closed late, one whose evidence was edited after it closed, one cancelled as a declared exception, and one closed with no evidence at all.

## Slide 7 — The tests: eight, from fields to chains

Eight tests cover the export: the seven fields and the null later-pass fields; the late, tampered and unevidenced closures and a truncated evidence field; the package and its verification, with tampering detected; the chain continued across periods; reproducible bytes; and evidence written by the real re-read client verifying. One honest limit: the package is tamper-evident, not signed. Anyone who can rewrite every file and the manifest can rewrite the chain. Signing, and where the package lives, are the program's decisions.

## Slide 8 — The verified facts, and what isn't verified

The vendor facts are few: the Table API's read and its query parameters, ServiceNow's Government Community Cloud at FedRAMP High, and SailPoint's Search events index, which the SailPoint half will read when it's built. The record shape, the window and the lanes are Book 13's, and the hash chain is design guidance. Two points stay open: the format and time zone of the dates the Table API returns, which the export parses both ways, and what SailPoint keeps in its events index and for how long. That's why the SailPoint half waits.

## Slide 9 — What the package proves, for the ISSO

This chapter's output is the evidence. One record per finding supports change control and continuous monitoring. Records unchanged after closure, and none removed, supports protection of audit information, AU-9, through the manifest and the chain. Closures inside the windows, with the late ones named, goes to the governance board. Declared exceptions carry their note and a plan of action item. And what isn't evidenced yet is stated outright. Non-repudiation isn't in the Moderate baseline; signing the package would be a further step.

## Slide 10 — Who builds the pipeline and who reads it

Who's involved? Developers who build the evidence pipeline, and the I S S O and assessors who read what it produces and verify every package they receive. The export runs as its own identity: the evidence reader, with read-only access to the finding table, its own user and OAuth client, and never the verifier's role, because it must not be able to close what it's hashing. And keep each period's manifest somewhere the exporter can't write, signed if the program requires it.

## Slide 11 — Lab 1: exporting October's closed findings

Lab 1. Eight tests pass. Then export October's five fictional findings. Four closed on a re-read, and one is a declared exception. Two of three judged closures were inside the window. Then the problems, by name: one closed late, one whose evidence no longer matches its hash, and one closed with no re-read evidence at all; its close note just says done, which Book 13 calls prose, not evidence. The command exits with a failure rather than producing a clean-looking package. The last line is the chain's head.

## Slide 12 — Lab 1: verify, continue the chain, tamper

Now act as the I S S O. Verify the package: every file matches the manifest and the chain is unbroken. Start November's chain from October's head; November's manifest records October's head as its previous link. The lab reuses October's records for this, where a real November has its own. Then remove one record from October's package and verify again. Two problems: the file's hash no longer matches the manifest, and the next line's link points at a record that isn't there. The package doesn't hold.

## Slide 13 — Lab 2: a live export from a developer instance

Lab 2 exports for real from your developer instance, with at least one finding closed in Chapter 5's lab; the authors haven't run it. Create the evidence reader and check its grant. Export live since the date of your test closure, and expect every record intact with no problems. Check that the due and finished times are the ones you expect, in UTC, since the Table API's date format wasn't confirmed. Verify the package. Then delete the output and the reader's client, user and role.

## Slide 14 — Dangers, and the guard for each

The dangers map onto the assessor's worries. An edit after closure is caught by recomputing the evidence hash. Evidence cut short by the field limit is reported, and the attachment keeps the full copy. A close that bypassed the business rule shows as closed without evidence. A deleted record breaks the chain. A package rewritten end to end is the one the chain alone can't catch, so store manifests where the exporter can't write. Fields filled to look complete are null by design. And the export never runs as the verifier.

## Slide 15 — Done when: the evidence checklist

Done looks like this. The export runs on a schedule as the evidence reader and holds nothing more. Each period's package verifies and continues the last period's chain. Every reported problem has gone to its owner, and none sits in the package unexplained. Manifests are stored where the exporter can't overwrite them. Window adherence is reviewed with Book 13's other measures. And the tests pass. Next, Chapter 8: one writer per attribute. Thanks for watching.
