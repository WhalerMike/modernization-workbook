# Companion guide — Building Ticket-to-Machine — One Drift Case, End to End — narration script (practice copy)

## Slide 1 — One Drift Case, End to End

Welcome to the story deck for Building Ticket-to-Machine, a developer workbook in the Federal Modernization Workbook. Instead of eight chapters one at a time, we'll follow one person's record all the way through Book 13's loop on ServiceNow and SailPoint. Her name is Erin, and she's fictional: every value you'll see comes from the kit's own test fixtures, and every command was re-run before it went on a slide. Seven scenes: the drift run finds her, her drift becomes a typed task, least-privilege clients touch it, we find why it keeps coming back, the fix is actuated, a re-read closes it, and her closure becomes evidence an I S S O can verify. Each scene ends with a command to try and a one-question check. One more thing before we start: the code is illustrative. Its tests pass against fixtures and mocked responses, but it hasn't been run against a live ServiceNow instance or SailPoint tenant. Where the vendors' documentation doesn't settle a point, the workbook says so, and so will we.

## Slide 2 — The cast and the stakes

Meet the cast. Erin's HR record says she works in HR and reports to employee E1000. Entra ID, in a Microsoft 365 GCC tenant, says Finance, and a different manager. The directory audit shows why: on October twentieth a help desk administrator typed Finance in by hand. SailPoint still says HR. And ServiceNow is the front door, where her drift becomes a typed task with its evidence. The stakes are the two failures the example guide warns about: closing her finding because a ticket says done, and fixing her record by hand while two systems still write department. Either way the drift comes back, and nobody can prove what happened. Keep three numbers in your head: E1004 is Erin, E1000 is the manager HR names, and E1001, Alice, is the manager Entra ID and SailPoint name instead. The estate is a FedRAMP Moderate civilian one: ServiceNow's Government Community Cloud, FedRAMP High; SailPoint's Identity Security Cloud, FedRAMP Moderate; and Entra ID on the worldwide Graph endpoint, which is what GCC uses.

## Slide 3 — Erin's path through the loop and the gates

Here's the route. Book 13's loop has five steps: test, detect drift, raise a typed task, actuate, and close with evidence. The example guide builds it in seven gates, and the workbook's chapters build the code. Scene one is the drift run, Gate 3 and Chapter 6. Scene two turns her drift into a typed task, Gate 4, Chapters 1 and 4. Scene three is least privilege, Gate 1, Chapters 2 and 3. Scene four finds why her department keeps drifting, Gate 2, Chapter 8. Scene five is actuation, Gate 5, which the kit's first pass deliberately doesn't build. Scene six is the re-read, Gate 6, Chapter 5. And scene seven is the evidence, Gate 7, Chapter 7. Every scene has the same shape. First, the story beat: what happens to Erin's record, with the code that handles it and the federal requirement behind it. Then a slide called Try it, with the exact Lab 1 command from the workbook and the output it really printed. Then a one-question check. Pause the video if you want to answer it; the answer opens the next slide.

## Slide 4 — Scene 1: the drift run finds Erin

Scene one. On day one, the drift client joins the HR extract, Microsoft Graph and SailPoint on the employee ID, and measures Book 3's drift classes. Erin collects four findings: her Entra department and Entra manager disagree with HR, her SailPoint manager disagrees too, and there's an unauthorized write on her department. That last one appears only because this run read the directory audit; without it, the class isn't computed at all. Each finding's ID is a hash of its class, system, employee, object and attribute, so the same drift has the same ID every night. Why it matters: Gate 3 measures the starting drift. That's account management and continuous monitoring, and the I S S O keeps every run's output. Notice what the run doesn't claim. Credential drift and schema drift need other systems, the card system, Intune and the provisioning middleware, so every run lists them as not computed instead of implying they're clean. And expect a burst of High findings in a real estate's first month; Book 3 calls that the measurement working.

## Slide 5 — Try it: day one finds Erin's four findings

Try it. From the kit's folder, run the drift client over the fixtures, with the audit. The summary counts four attribute drifts, two missing identities, three orphan accounts, two stale accesses and one unauthorized write, and it lists credential and schema drift as not computed rather than implying they're clean. Then look for Erin's employee ID in the CSV. There she is, four times: department and manager in Entra ID, manager in SailPoint, each Medium at P3; and the unauthorized write, High at P2. If you run this yourself, you need Python 3.10 or later with pytest and requests, and you work in the kit's examples folder. Nothing touches a tenant or the network. When you're done, delete the out folder; the labs write everything there.

## Slide 6 — Check 1: which of Erin's findings needs a person?

Check one. Tomorrow, HR corrects Erin's department to Finance, so HR and Entra ID agree. Which of her four day-one findings still won't go away on its own? Is it the Entra department drift, the Entra manager drift, the SailPoint manager drift, or the unauthorized write? Think about what HR agreeing afterwards does, and doesn't, prove. The answer opens the next scene.

## Slide 7 — Scene 2: Erin's drift becomes a typed task

The answer to check one: the unauthorized write. HR agreeing later doesn't make a hand-typed change authorized, so a person decides it. Scene two. Each of Erin's findings becomes one typed task in ServiceNow: a class, a severity, the system where it'll be re-read, one subject, its origin, and the intended state a re-read must find. Her department drift is P3, due in a day. The unauthorized write is P2, due in an hour, and it's accepted with a warning, because its intended state is empty until that person decides. From SailPoint's side, the mover workflow raises her department change with Finance as the intended state. Why it matters: Gate 4 makes every drift an owned record answered inside a window. The tempo is Book 13's design, not a federal clock. The important design choice is that the rules live in one place, the scripted REST resource inside ServiceNow, and the Python mirror is held to it by a test that reads the JavaScript. So a malformed payload fails on a laptop, not as a four hundred from a live instance, and the mirror can't quietly go stale.

## Slide 8 — Try it: what ServiceNow will do with Erin's payloads

Try it. Feed day one's run to the contract check at a fixed clock, noon on November first. Erin's department and manager drifts are accepted at P3, due the next noon. Her unauthorized write is accepted at P2, due at one o'clock, with the warning that its intended state names nothing yet. All twelve payloads are accepted. Then resolve SailPoint's mover workflow against the fictional event for Erin's identity. The intended state is department Finance, P3, and the de-duplication key ends in the attribute. This is the first thing to check whenever a client changes: run its payloads through the validator in its own tests. Nothing a client builds should be rejected, and every warning should be one you understand. Here, the only warnings are for the classes a person decides first: missing identities and the unauthorized write.

## Slide 9 — Check 2: why does Erin need two keys?

Check two. Erin's department and manager both drift in Entra ID. Before Chapter 4's fix, ServiceNow de-duplicated on source, subject and class only. What went wrong with her two findings? Were they rejected, folded together, given the wrong severity, or raised twice?

## Slide 10 — Scene 3: who may touch Erin's record

The answer to check two: the manager drift would have been folded into the department one, and its intended state never re-read. Scene three: who may touch Erin's record. The drift client read her through SailPoint with two read scopes, and through Graph with the user read permission plus the audit permission. That audit read is the only reason the help desk write was seen. In ServiceNow, a finding writer posted her tasks, only the verifier may close them, and an evidence reader may only read. Every call is a row in one file, and a test fails on any call it doesn't declare. Why it matters: Gate 1 records the integration identities, each least-privileged, with certificates rather than secrets, and the closer separated from the raisers. Two details from Chapter 3 are worth carrying. A SailPoint client-credentials token has no user context, and SailPoint warns that most admin APIs often return forbidden with one, so Lab 2 records what actually works in your sandbox. And the scope that creates workflows lives on its own client, used once, then removed.

## Slide 11 — Try it: catching a grant that's too wide

Try it. Suppose the SailPoint reader that read Erin was also given the accounts manage scope. Compare it with what the drift task needs: nothing missing, the manage scope extra, least privilege doesn't hold, exit with a failure. A stolen token could have changed her accounts. Now the ServiceNow verifier, given the broad I T I L role as well: same result, one extra role, failure. The tool calls no network; the operator types or exports the grant, and the output goes beside the access approval. The same comparison works for Graph. An app registration holding only the user read permission fails a drift run that reads the audit, and passes one that doesn't when you ask for required calls only. In Erin's case, the audit read is required, because it's the only way her help desk write was ever seen.

## Slide 12 — Check 3: why not reuse the verifier's account?

Check three. Chapter 7's evidence export reads Erin's closed record. It would work perfectly well if it ran as the verifier. So why does the comparison refuse that grant?

## Slide 13 — Scene 4: why Erin's department keeps drifting

The answer to check three: running as the verifier, the export could also close the findings it's about to hash, which breaks separation of duties. Scene four asks why Erin's department drifts at all. Book 3 makes Entra inbound provisioning the one writer into the directory, but SailPoint can provision Entra ID too. If both update department, each overwrites the other, and fixing her record by hand just schedules the next drift. The writer check compares the two provisioning configurations, offline. The kit's exports are fictional files, not Erin's tenant, but they show exactly the overlap that would keep her drift coming back. Why it matters: Gate 2 decides one writer per attribute, so every account change traces to its source. This is the one item from the kit's planned second pass that can be built today, because both configurations export as JSON through documented reads. The other planned items, one approver per authority class, change records on demand, the SailPoint half of the evidence and email intake, all need a live instance or product internals.

## Slide 14 — Try it: two writers on department

Try it. Run the writer check on the two fictional exports. Entra inbound provisioning writes eight attributes, SailPoint writes seven, and department is a Finding: both update it, so each overwrites the other and the drift never settles. That's Erin's problem in one line. Display name is a warning, and two attributes are only informational. Now map SailPoint's title field to Entra's job title and run it again: a second Finding appears. Without the alias, that second writer was invisible. And notice the guard on the directory name. If you tell the check the wrong name for the Entra directory, it refuses and exits with an error, rather than reporting no overlap, because a wrong name would make every attribute look unwritten.

## Slide 15 — Check 4: Finding, Warn or Info?

Check four. Entra inbound provisioning updates display name on every change, and SailPoint sets it only when it creates the account. What does the writer check report: a Finding, a warning, info, or nothing at all?

## Slide 16 — Scene 5: the fix, on the native surface

The answer to check four: a warning, because there are two sources for the first value. Scene five is the fix itself, and here the kit stops on purpose. The guide says how it should run. Erin's wrong fact is corrected where HR owns it, in Core HCM, and SailPoint re-aggregates; SailPoint can't write HR-mastered attributes back. Her unauthorized write is restored by SailPoint, and the writer's access is reviewed. The ticket authorizes a machine: a connector, under a service identity, and a person only approves. But the kit's first pass doesn't actuate at all: no code writes to Entra ID, Active Directory or SailPoint. What it does have is the closure signal, which we'll try next. Why it matters: Gate 5 keeps changes off personal admin accounts. The guide also keeps people off standing privilege. Where a person must act, they activate an eligible role just in time, with the ticket number as the justification. And when no machine can reach the surface, the declared-exception lane takes over: a named approver, a recorded session and an end date.

## Slide 17 — Try it: a provisioning success only signals

Try it. The kit's provisioning fixture is Alice's, not Erin's, but the shape is the same for anyone. Resolve SailPoint's provisioning-completed workflow against it. ServiceNow gets a closure signal, accepted, with four input fields not sent. And here's what a closure signal does: it moves matching findings to awaiting verification. It never closes one. That's the example guide's first gap, written into code: a success response is not closure. The workflow is also why provisioning status can't be trusted on its own. SailPoint's own best-practice page says its Service Desk integration treats the mapped ServiceNow status as completion. The kit turns that around: a status or a success only starts the wait for evidence.

## Slide 18 — Check 5: SailPoint says SUCCESS. Now what?

Check five. SailPoint reports success for the fix to Erin's record, and the closure signal reaches ServiceNow. What happens to her finding? Does it close, wait for a re-read, get ignored, or reopen?

## Slide 19 — Scene 6: the re-read closes Erin's finding

The answer to check five: her finding moves to awaiting verification, and waits for a re-read. Scene six. On day two, Entra ID matches HR, so the reconciliation calls that finding resolved, which is only a lead. SailPoint still says HR until its next aggregation, so a new finding opens there. When it's re-read, waiting record I D F one thousand four, Erin's SailPoint identity with intended department Finance, reads Finance, and verifies. The client guards both ways. An intended state that names nothing is skipped, never verified. And a read older than the wait is pending through a grace period, then reopens the record. Why it matters: Gate 6, Book 13's fourth clause. The record closes only on a re-read, with its evidence, and no person can close it by setting its state.

## Slide 20 — Try it: day two, and the re-read

Try it. Compare day one with day two: one new, eleven persisting, one resolved, and both changes are Erin's. Her Entra finding resolved; a SailPoint finding opened. Then run the re-read client offline over six waiting records at noon on November first. Erin's record verifies, and would be patched to closed. One record is pending: a terminated user's account, read before the finding started waiting. One is skipped for an empty intended state. Run the same records a day later, and that pending one becomes a mismatch, and would reopen. Everything here is a dry run. The offline mode refuses the apply flag, and a subject with no saved read is an error, because a missing read is never a match. On a developer instance, Chapter 5's Lab 2 runs the same client for real, as the verifier.

## Slide 21 — Check 6: resolved means closed?

Check six. On day two, the comparison reports Erin's Entra department finding as resolved. Can its ServiceNow record close now, because it's resolved, or because a person sets it closed? Or does something else have to happen first?

## Slide 22 — Scene 7: Erin's closure becomes evidence

The answer to check six: no. Resolved is a lead; only a matching re-read closes the record. Scene seven. When the re-read verified Erin's record, it wrote the result with an evidence hash. On a real instance, that closed record is read back out and written as one line of an evidence package, in Book 13's shape: origin, owner and clock, the re-read result, and the closure. Approval, the executing identity and what ran are written as null, each with its reason, because the first pass doesn't actuate. The record says what it doesn't hold. Each line carries the hash of the line before it, and a manifest holds a hash of every file. Why it matters: Gate 7. The I S S O gets records nobody could edit or remove without it showing.

## Slide 23 — Try it: the package, verified and tampered

Try it. The lab's package uses five other fictional records, but Erin's would be one more line in the same file. Export October: four closed on a re-read, one declared exception, two of three inside their windows, and a chain head. It also names three problem records and exits with a failure, rather than producing a clean-looking package. Now verify it as the I S S O would: the package holds. Then delete one record and verify again. The file's hash no longer matches the manifest, and the next line's link is broken. The package doesn't hold. Next month's export continues the chain from this month's manifest, so a gap between periods shows too. One limit to remember: the package is tamper-evident, not signed. Someone who can rewrite every file and the manifest can rewrite the chain, so keep each manifest where the exporter can't write.

## Slide 24 — Check 7: one record deleted from the period

Check seven, the last one. Someone deletes one closed record from October's records file. What does the verifier report: nothing, only a file hash mismatch, the file hash and a broken chain, or a moved chain head?

## Slide 25 — Your turn: Lab 2, and where to go next

The answer to check seven: the file's hash no longer matches the manifest, and the chain breaks at the next line. That's Erin's record, end to end: measured, typed and clocked, touched only by least-privileged clients, traced to two writers, fixed at the source, closed on a re-read, and filed as evidence. Now it's your turn. Every chapter has a Lab 2 in your own test instance: a ServiceNow Personal Developer Instance, a SailPoint sandbox, and for some chapters a test Entra tenant with synthetic data, never production. There's no hosted sandbox; you bring your own, and every lab ends with a back-out step. Then go deeper: the workbook's eight chapters, a narrated tour of each, the seven-module learning path, and the example guide with its gate-level deck. Thanks for following Erin.
