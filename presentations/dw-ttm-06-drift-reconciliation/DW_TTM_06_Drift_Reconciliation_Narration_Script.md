# Building Ticket-to-Machine, Chapter 06 — Drift Reconciliation — narration script (practice copy)

## Slide 1 — Chapter 06: Drift Reconciliation

Welcome back to Building Ticket-to-Machine. This is Chapter 6: drift reconciliation, the kit's Build 3. Events tell you what changed. A reconciliation tells you what is wrong now, including what changed while nobody was listening. The drift client joins the HR extract, Microsoft Graph and SailPoint on the employee ID and measures Book 3's drift classes. This chapter adds a comparison of two runs, so a scheduled run raises only what's new, and shows what has stopped being measured. Then a two-day lab on a laptop.

## Slide 2 — Why measure the state, not just the events

Why a reconciliation as well as events? Because events only tell you about changes you heard. A missed event is drift nobody ever raised. The reconciliation measures the state itself, so it catches what changed while nobody was listening. But one run is one moment. Push every finding every night and you lean on de-duplication, and nothing tells you what disappeared. So this chapter compares runs, raises only what's new, and refuses to call something resolved just because a run didn't measure it.

## Slide 3 — identity_drift.py: inputs, classes, IDs

Here's the drift client. Its inputs are an HR extract, Graph users, SailPoint identities and uncorrelated accounts, and optionally the Entra directory audit; each can be a saved file, which is how the labs run. It measures four of Book 3's classes, and an unauthorized write only when it reads the audit. Credential and schema drift are always reported as not computed, because they need other systems. Each finding's ID is a hash of what it's about, so the same drift has the same ID every run. And pushing to ServiceNow still needs the apply flag.

## Slide 4 — drift_compare.py: new, persisting, resolved

The new tool compares two runs by finding ID and sorts every finding into three groups. New ones should be raised. Persisting ones are already raised, and de-duplication just adds a counter. Resolved ones are no longer measured, which is a lead for the re-read, never a closure. And it refuses to compare runs that computed different classes. If one run read the audit and the next didn't, every unauthorized write would look resolved. A resolved finding always prints with a reminder that only Chapter 5's re-read closes its record.

## Slide 5 — Day two of the fictional estate

To exercise the comparison, the chapter adds a second day to the fictional estate. On day one, HR says Erin works in HR, but someone has already typed Finance into Entra ID by hand, and SailPoint still says HR. On day two, HR corrects her department to Finance. Now Graph agrees with HR, but SailPoint, not yet re-aggregated, doesn't. The chapter also adds a fixture settings file with no secrets, and the client now creates its output folder if it's missing.

## Slide 6 — The tests: four new, thirteen unchanged

Four new tests cover the day-two story, identical runs, the refusal and the command line. The kit's original thirteen drift tests still pass, including the check that the Python and PowerShell clients produce the same finding IDs. One caution: these run over fictional exports, and two inputs, the manager expansion and the SailPoint employee ID attribute, are still on the verify list. And expect a burst of High findings in a real estate's first month. Book 3 calls that the measurement working.

## Slide 7 — The verified facts behind the join

The facts the join depends on, read on November first. Graph lists users with User dot Read dot All. For the manager, Learn documents expanding it on the users list, while the manager endpoint itself doesn't support application permissions. The audit needs AuditLog dot Read dot All and is available in the government clouds. SailPoint identities come from Search, paged past ten thousand, and uncorrelated accounts from the Accounts API with a filter, at most two hundred fifty a page. And GCC uses the worldwide Graph host.

## Slide 8 — What couldn't be verified about the join

Three inputs aren't settled. Whether expanding the manager works under an application permission. Which SailPoint identity attribute holds the HR key, the employee number or an employee ID attribute. And the exact property names the Entra audit uses for the changes the client watches, such as department. Each is on the kit's verify list. Lab 2 records whether Graph rejects the manager expansion, and Chapter 3's lab finds where your tenant keeps the HR key.

## Slide 9 — What the reconciliation proves, and for whom

What this proves. Every active HR record has its accounts, every terminated one has none enabled, and every enabled account belongs to a person: account management, AC-2, and Book 3's leaver and orphan measures, kept as each run's output. Drift is measured on a schedule, and what changed between runs is reported: continuous monitoring and system monitoring. And what wasn't measured is stated, not implied, which feeds the Federal Modernization Workbook's Book 13's detection coverage measure. The not-computed list and the refusal are that evidence.

## Slide 10 — Who schedules it and who reads it

Who's involved? Developers and identity engineers who schedule the reconciliation and set the estate's settings: which SailPoint attribute holds the employee ID, which sources are authoritative, and which apps are allowed to write. And the identity data steward, who reads the output, triages the first month's burst by class and severity, and sends decisions to the right people. The client reads only what Chapter 3 granted: Graph user and audit reads with a certificate, and two SailPoint read scopes.

## Slide 11 — Lab 1: day one and day two

Lab 1 tells the two-day story. Seventeen tests pass. Day one: run the reconciliation over all the fixtures, including the audit. It counts four attribute drifts, two missing identities, three orphan accounts, two stale accesses and one unauthorized write, and lists credential and schema drift as not computed. In the CSV, Erin's Entra department is Finance where HR says HR, and the audit shows a help desk administrator made the change. Carol, terminated, is still enabled. Day two, after HR's correction: exactly the same counts. The totals hide what moved.

## Slide 12 — Lab 1: comparing the days, and the refusal

Now compare the two days. One new, eleven persisting, one resolved. Entra ID now matches HR, so that finding is resolved, but SailPoint still holds the old value, so a new finding opens there. And notice what persists: the unauthorized write. HR agreeing afterwards doesn't make a hand-typed change authorized; a person decides that. Last, run day two without the audit and compare. The tool refuses, exiting with an error. Without that refusal, the unauthorized write would have looked resolved.

## Slide 13 — Lab 2: a live run on synthetic data

Lab 2 runs the client live, on a test tenant and a SailPoint sandbox with synthetic data, never production; the authors haven't run it. Grant only Chapter 3's reads. Write a small HR extract that matches test users, with one terminated user still enabled and one department that differs. Run the client, and check its counts against a hand count. Record whether Graph rejects the manager expansion. Run again the next day after changing one department, and compare. Push nothing. Then delete everything.

## Slide 14 — Dangers, and the guard for each

The dangers. A class one run skipped would look resolved, so unauthorized writes would vanish the night the audit read fails; the refusal stops that. A resolved finding must never close a record, because drift can leave the measurement without leaving the estate. Pushing every finding every night fills the tracker, so push only what's new. The first month's burst isn't failure; triage it. Guests and the HR source's own accounts are excluded as noise. And an HR extract is personal data: keep it where HR data is allowed.

## Slide 15 — Done when: the reconciliation checklist

Done looks like this. The HR extract's statuses map the way the client expects. The three estate settings are set. A live run matched a hand count on synthetic data. The scheduled job compares each run with the last and pushes only new findings. Every run computes the same classes, or the comparison is rerun. And the tests pass, with the PowerShell client's IDs still matching. Next, Chapter 7 turns closed findings into the evidence an I S S O keeps. Thanks for watching.
