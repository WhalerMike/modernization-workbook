# Building Ticket-to-Machine, Chapter 05 — The Re-read Rule — narration script (practice copy)

## Slide 1 — Chapter 05: The Re-read Rule

Welcome back to Building Ticket-to-Machine. This is Chapter 5: the re-read rule, the kit's Build 2. A success response is not closure. Neither is a ticket status, and neither is a comparison against nothing. A finding closes only when a re-read of the target shows the intended state. A ServiceNow business rule enforces that, and a Python client does the re-reading. This chapter adds an offline mode so you can watch every decision on a laptop, and a guard against closing on nothing.

## Slide 2 — Why a success response isn't closure

Why does this rule exist? Because there are several ways to close a finding without proving anything. The first is closure by ticket status: SailPoint's Service Desk integration treats the mapped ServiceNow status as completion, and a person can simply mark the work done. That's the example guide's first gap. The others are subtler: comparing against an intended state that names nothing, which always matches; trusting a read older than the fix; and treating a missing read as a match. This chapter closes all four.

## Slide 3 — The business rule: every close becomes a wait

Here's the rule inside ServiceNow. It runs before any update that changes the state. If someone sets a closed state, the record goes to awaiting verification instead, unless that same update carries a new evidence hash and comes from the verifier account. Evidence alone isn't enough, and the verifier alone isn't enough. There's one human path: a named exception approver can cancel with a close note, which is the Federal Modernization Workbook's Book 13's declared-exception lane, and it stays on the record. The rule also governs tickets the Service Desk integration opened.

## Slide 4 — The re-read client: read, compare, close or reopen

The other half is the re-read client. It lists waiting findings, re-reads each subject according to its system, an account, an identity or an Entra user, and compares the read with the intended state. A match closes the record with the evidence: the query, the time, a hash of the response, the intended state and the checker, attached as JSON too. A difference reopens it. Because SailPoint's copy reflects the last aggregation, a read older than the wait is pending for a grace period. And nothing is written without the apply flag.

## Slide 5 — The guard: never verify against nothing

Two things were missing. The first was this guard. The client already skipped a record with an empty intended state, but not one whose intended state was a non-empty object naming nothing, which is exactly what ServiceNow stores for a native change the workflow didn't describe. Comparing a read against that finds no difference, so the client would have closed the record, with evidence, on nothing. Now Chapter 1's check runs before anything is read, and such a record is skipped with the reason, never verified.

## Slide 6 — The offline mode, and six waiting records

The second thing missing was a way to watch the decisions without a tenant. The offline mode takes saved waiting records in the Table API's shape, saved reads keyed by subject, and a fixed clock. The same function makes the same decisions; only the reader is swapped. It's a dry run only: the apply flag is refused, and a subject with no saved read is an error, because a missing read isn't a match. Six fictional waiting records cover every outcome, from a clean verify to the empty intended state the guard exists for.

## Slide 7 — The tests: six offline, nine re-read, six rule

The tests. Six new offline tests cover the six outcomes, the grace period expiring, the guard never calling the reader, a missing saved read as an error, a null read as not found, and the refusals. The kit's original nine re-read tests still pass. And the business rule's six Node tests pin its behavior: a person's close is redirected, only the verifier with fresh evidence may close, either one alone isn't enough, the exception approver may cancel with a note, and on incidents only the integration's tickets are governed.

## Slide 8 — The verified facts behind every re-read

The facts each re-read depends on, read on November first. The Table API lists and patches records, and the Attachment API uploads the evidence file with a mandatory content type. An account is re-read through SailPoint's Accounts API, an identity through Search on the identities index, and an Entra user through Graph's get-a-user call, which returns not found when the user doesn't exist. And SailPoint's own best-practice page confirms the gap: the mapped ServiceNow status decides when it treats provisioning as complete.

## Slide 9 — What couldn't be verified about the rule

Three points are open. The biggest: which user ServiceNow records for a call made with an OAuth client-credentials token. The rule compares exactly that with its verifier property, so if they differ it refuses every close, and people start looking for a way around the rule. Lab 2 checks it before go-live. Also open: how long a SailPoint read lags the source, which depends on the aggregation schedule, and how to recognize a ticket the Service Desk integration opened.

## Slide 10 — What the re-read proves, and for whom

For the I S S O, this is the closure evidence. A finding closed only after a re-read showed the intended state, with the query, the time, a hash of the response and the checker, which is Book 13's fourth clause and supports change control and continuous monitoring. No person can close a finding by setting its state, which is separation of duties. A read that predates the change doesn't count. And an empty intended state never closes anything: a verified change, not an asserted one.

## Slide 11 — Who owns the rule, the client and the evidence

Who owns this? Developers who own the client or the rule; ServiceNow administrators who configure the rule's properties, the waiting state's value, the verifier's user name, and the exception role; and the I S S O, for whom this is the closure evidence. The identities are simple. The verifier can close a finding only in the same update as fresh evidence. A named exception approver can cancel with a note. Anyone else who sets a closed state just moves the record to awaiting verification.

## Slide 12 — Lab 1: six waiting findings at noon

Lab 1. Fifteen tests pass. Then re-read the six waiting findings at noon on November first. Three verify and would close. One mismatches: a terminated user is still enabled in Entra ID, so it would reopen with that difference. One is pending: the SailPoint account was last modified before the finding started waiting, so the read predates the change and the client leaves it alone. And one is skipped, because its intended state names nothing. That's the case the guard exists for.

## Slide 13 — Lab 1: a day later, and the rule's own tests

Now run the same records a day later. The pending one has passed its twenty-four-hour grace period. The account still isn't disabled, so it's now a mismatch, and the record would reopen. A stale read can't hold a finding open forever. The results file keeps each outcome with its evidence hash. Finally, run the business rule's six Node tests. They pass: a person's close is redirected, and only the verifier with fresh evidence can close.

## Slide 14 — Lab 2: close one finding with evidence

Lab 2 is on your developer instance, never production, and the authors haven't run it. Configure the rule and its properties. Close a test finding as an ordinary user and watch it land in awaiting verification. Then the important step: as the verifier's OAuth client, make one harmless update and see which user ServiceNow recorded. If it isn't the verifier property, the rule will refuse every close. Then give a test finding a checkable intended state and run the client, dry first, then for real. Back it all out.

## Slide 15 — Dangers, and the guard for each

The dangers line up with the ways to close without proof. Closure by ticket status is redirected by the rule. An intended state that names nothing is skipped by the guard. A stale read is pending inside the grace period and a mismatch after it. A missing read is an error, never a match; the live reader raises on anything but a not-found. A misconfigured verifier would refuse every close, so check it in Lab 2. And evidence edited after closure no longer proves anything, which is why Chapter 7 recomputes the hash.

## Slide 16 — Done when: the re-read checklist

Done looks like this. The rule is active on the finding table, and on incidents and request items if the Service Desk integration opens tickets. The verifier property matches the user ServiceNow actually records. The grace period is at least the longest aggregation interval. A dry run over this week's waiting findings skips nothing for an empty intended state, or each such record has gone to a person. Closed records carry their evidence and attachment. And the tests pass. Next, Chapter 6: drift reconciliation. Thanks for watching.
