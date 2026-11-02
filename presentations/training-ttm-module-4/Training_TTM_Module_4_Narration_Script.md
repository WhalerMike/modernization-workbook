# Ticket-to-Machine learning path — Module 4: Sources and the Starting Drift — narration script (practice copy)

## Slide 1 — Module 4: Sources and the starting drift

Welcome to Module 4 of the Ticket-to-Machine learning path: sources and the starting drift. Before you fix anything, you need to know how far the directory is from HR. This module follows the guide's Gate 3, which connects the sources, correlates them on one key, and files the first measurement as the baseline, and the developer workbook's Chapter 06. You'll run the kit's read-only drift reconciliation over two days of fictional data, compare the runs as new, persisting and resolved, and see the comparison refuse two runs that measured different things.

## Slide 2 — Why each drift needs a number before a ticket

Why measure first? Because drift comes in kinds, and each kind needs a number before it needs a ticket. A terminated employee who's still enabled in Entra ID is stale access, which the Federal Modernization Workbook's Book 03 rates High. An account that matches nobody is an orphan account, also High. A department someone typed in by hand is attribute drift, rated Medium. Without a measurement you can't say how many there are, whether they're growing, or whether a fix worked. So Gate 3 connects the sources, correlates them on one key, and files the first measurement as the baseline. Every later gate is measured against it. In this module you run that measurement twice, on two days, and compare the days.

## Slide 3 — What you'll be able to do in Module 4

Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll explain what Gate 3 connects, the key it correlates on, and what it files as the baseline. You'll name Book 03's drift classes, and say which ones the kit doesn't compute. You'll run the drift reconciliation over fixtures and compare two runs as new, persisting and resolved. And you'll explain why a comparison of runs that computed different classes is refused. You need Module 3 first. For the Graph reads, the Microsoft Automation path's first module covers the four request patterns. Lab 1 runs on fixtures; Lab 2 needs a test tenant and a SailPoint sandbox.

## Slide 4 — Gate 3: connect, correlate on employeeId, measure

Gate 3 has six steps. One: aggregate HR into SailPoint as the authoritative source, read-only under Gate 2's first pattern. Two: connect Entra ID and Active Directory as SailPoint sources, the Entra connector and the Active Directory connector through the virtual appliance. Three: correlate on employee I D, the key Book 03 joins on, and treat uncorrelated accounts as orphan candidates, not errors to suppress. Four: turn on Native Change Detection on the Entra and Active Directory sources. It compares stored and newly read data on aggregation, and fires one event per changed account. Five: run the kit's drift reconciliation, read-only. And six: file the first run as the baseline. Expect a burst of High findings in the first month. Book 03 calls that the measurement working.

## Slide 5 — Book 03's drift classes, and what the kit computes

Here are Book 03's drift classes, the ones the finding contract carries, and what the kit computes. Missing identity: an active HR record with no matching account. Stale access: terminated in HR, enabled in the directory. Orphan account: an enabled account with no known employee I D. Those three are High, and the kit computes them. Attribute drift is Medium, and the kit compares department and manager. Unauthorized write, a write by anyone but the provisioning service, is High, and it's computed only when the run reads the Entra audit. Credential drift and schema drift are always reported as not computed, because they need the card system, Intune and the middleware's output. The severities are the program's defaults, not an external standard.

## Slide 6 — The reconciliation: inputs, stable IDs, outputs

The reconciliation is the kit's Build 3. It reads an HR extract, a C S V where employee I D and status are required; Graph users with their employee I D, enabled flag, department and manager's employee I D; SailPoint identities from Search and uncorrelated accounts; and, optionally, the Entra directory audit. In the labs each one is a saved export. Each finding's I D is a hash of its class, system, employee I D, object I D and attribute, so the same drift gets the same I D on every run, and the PowerShell client produces the same I Ds. It writes JSON and C S V, saying which classes were and weren't computed. Why run it at all, when events exist? Events catch changes as they happen; the reconciliation catches the state, including drift whose event was missed.

## Slide 7 — Run over run: new, persisting, resolved

A scheduled run should raise only what's new, so Chapter 06 adds a comparison by finding I D. New means raise it. Persisting means it's already raised, and the de-duplication adds a counter. Resolved means it's no longer measured. That's a lead for the re-read, not a closure: its record still closes only on the re-read client. And the comparison refuses runs that computed different classes, one with the audit and one without, because every finding of the class the second run skipped would look resolved. The lab's day-two fixture tells a small story. HR corrects Erin's department from HR to Finance, the value someone had already typed into Entra ID by hand. Graph now agrees with HR. SailPoint, not yet re-aggregated, doesn't.

## Slide 8 — Dangers of a nightly run, and the guards

Chapter 06's dangers are worth reading before you schedule anything. A class one run skipped looks resolved: unauthorized writes disappear on the night the audit read fails. The guard is the comparison's refusal. A resolved finding closes the record: drift that left the measurement, not the estate, gets called fixed. The guard is that only the re-read closes. Pushing every finding every night fills the tracker with repeats, so push only the comparison's new findings. The first month's burst gets read as failure, and the pipeline is turned off before it's tuned. Book 03 expects that burst, so triage it by class and severity. And an HR extract with names in a shared folder spreads personal data. The run folder is evidence: keep it where HR data is allowed.

## Slide 9 — Try it: measure day one

Try it. Lab 1 runs in the kit's folder against fictional fixtures. Step one runs the drift and comparison tests: seventeen pass. Step two runs day one. The summary counts four attribute drifts, two missing identities, three orphan accounts, two stale access and one unauthorized write, and lists credential and schema drift as not computed. Then a one-line script prints Erin's and Carol's rows. Erin's department: HR expects HR, but Entra ID holds Finance, and the audit shows a help-desk account wrote it. That's both attribute drift and an unauthorized write. Her manager differs too, in Entra ID and in SailPoint. Carol is terminated in HR, but enabled in Entra ID and not disabled in SailPoint: stale access, twice.

## Slide 10 — Try it: compare day two, then a run without the audit

Step three runs day two, after HR's correction. The counts are exactly the same, and the totals hide what moved. Step four compares the days: one new, eleven persisting, one resolved. The resolved finding is Erin's department in Entra ID, which now agrees with HR. It's a lead for the re-read, and the tool says so: its record closes only on the re-read client. The new finding is Erin's department in SailPoint, which hasn't been re-aggregated and still holds the old value. Step five runs day two without the audit, so unauthorized write moves to not computed, and the comparison refuses: the runs computed different classes. It exits two. Without that refusal, the unauthorized write would have looked resolved. Step six deletes the output folder.

## Slide 11 — Lab 2: measure your test tenant on two days

Lab 2 runs the client live. You need a test Entra tenant in the worldwide or GCC cloud, a SailPoint sandbox, and synthetic HR data like the fixtures. Grant the read permissions from Module 2, and nothing more. Write a synthetic HR extract that matches your test users, run the client against the tenant and the sandbox on two days, and compare the runs. Push nothing to ServiceNow. Two things the fixtures can't prove are on the verify list: the manager expansion, and SailPoint's employee I D attribute. Back it out in step five: delete the output folder, the synthetic extract, the app registration's permissions and certificate, and the sandbox API client. The authors haven't run Lab 2; follow Chapter 06's Lab 2.

## Slide 12 — Where agencies are: GCC, GCC High, and interim paths

Where are agencies? Most on this path run Microsoft 365 GCC, and a minority GCC High. GCC tenants use the worldwide endpoints. In GCC High, you set the Entra source's Graph and token endpoints to graph dot microsoft dot U S and login dot microsoftonline dot U S; SailPoint's Entra connector documents those overrides. One open question for every tenant: Native Change Detection's presence in SailPoint's FedRAMP environment wasn't confirmed, which is one of the things Gate 1 asks SailPoint in writing. The interim path: without SailPoint, or before it's connected, run the kit's reconciliation against the HR extract and Graph alone, because the SailPoint inputs are optional files. Active Directory-only groups wait for the appliance.

## Slide 13 — Validate Gate 3 before you file the baseline

Before you file the baseline, validate the gate. The guide names four checks. The kit's tests prove the logic against mocked data: the drift classes on the fixtures, the same finding I Ds from the Python and PowerShell clients, and unauthorized writes reported as not computed when there's no audit extract. Live, the reconciliation's findings on a synthetic HR extract should match a hand count. The validation kit's two H R checks look at the key itself: enabled members with no employee I D, and duplicate employee I D values. Each should be clean, or each row should have an owner, because the join depends on the key. And rollback is simple, because the gate only reads: disconnect the source, or turn off Native Change Detection.

## Slide 14 — The federal requirement, and the evidence to keep

The federal requirement. The guide maps Gate 3 to NIST special publication eight hundred fifty-three. A C two, account management: it finds accounts with no worker, and workers with no account, and the baseline drift report is the evidence. C A seven, continuous monitoring: it starts a repeatable comparison of the record and the estate, kept with its date and checker version. And, by inference, C M eight, read for identities: one correlated inventory of accounts per person, shown by the correlation rate and the uncorrelated-account list. Chapter 06 maps the reconciliation and the comparison to account management, continuous monitoring and system monitoring, and adds each run's JSON and C S V, with what wasn't computed, and the comparison output kept with each run.

## Slide 15 — Check yourself: two questions on drift runs

Check yourself with two questions from the module's knowledge check. First: on day two, Entra ID matches HR for Erin's department. How does the comparison report the day-one Entra finding? The answer is a. As resolved, a lead for the re-read. Its record still closes only on the re-read client. A resolved finding is a lead, not a closure. Second: why does the comparison refuse to compare day one, with the audit, and day two, without it? The answer is b. Every unauthorized-write finding would look resolved, because the second run didn't compute that class. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary, and next: Module 5, a typed task

To sum up. You learned how Gate 3 connects HR, Entra ID and Active Directory through SailPoint, and correlates them on employee I D, with uncorrelated accounts treated as orphan candidates. You named Book 03's drift classes, and the two the kit never computes. You measured drift over two days, and compared the runs as new, persisting and resolved. And you saw why the comparison refuses runs that measured different things, so nothing looks fixed just because it stopped being measured. Before you ship, work through the Chapter 06 checklist, and file the first run as the baseline. Next is Module 5, drift to a typed task: you'll predict the finding a SailPoint event produces, and test a workflow change before you import it.
