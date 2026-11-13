# Companion guide — Building Provider Notices — One Retirement Notice, End to End — narration script (practice copy)

## Slide 1 — One Retirement Notice, End to End

Welcome to the story deck for Building Provider Notices, a developer workbook in the Federal Modernization Workbook. Instead of eight chapters one at a time, we'll follow one notice all the way through: an Azure Service Health retirement of basic public IP addresses, action required by September 30, 2027. It's fictional: every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. Two notes before we begin. The workbook is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures, not against a live tenant.

## Slide 2 — The notice's path through the eight chapters

Here's the route. Scene one: Azure Service Health reports the retirement, and the kit makes it one record. Scenes two to five ask the same question of Microsoft 365 in GCC, Oracle Cloud, AWS and Google Cloud: how does each provider say something needs action, and by when? Those scenes use each provider's own fixture notices, because our retirement is Azure's. Scene six gives the notice an owner, as a Ticket-to-Machine task. Scene seven carries it into the weekly digest and the evidence chain. And scene eight deploys the whole loop, test first, then production. Each scene has a story slide, a try-it slide with real output, and a one-question check.

## Slide 3 — Scene 1: Azure says retirement; the kit makes a record

Scene one. Microsoft Learn's Resource Graph samples for Service Health show a retirement as a health advisory with the subtype retirement. That's all Microsoft says. Nothing in the event says action is required. So the kit does three things. It merges the event's rows from every subscription into one notice. It applies a stated rule: a retirement is action required, due at the advisory's end. And it writes who said so, the kit's rule, not Microsoft. Then it fingerprints the record, so reading it again next week changes nothing. Why it matters: monitoring the provider, and receiving its advisories, with evidence the security officer can keep.

## Slide 4 — Try it: collect Azure and read the retirement

Try it. From the kit's folder, collect Azure from the day-one fixtures. Five notices, all valid against the schema, two needing action. Five from six rows, because one incident's rows from two subscriptions became one notice. Read the records, and there's our retirement: open, action required, due September 30, 2027. Then read it in full. The window runs a year, the due date is the window's end, and the action basis says rule, Azure retirement, due at the advisory end time. The source link is the event on the commercial Resource Manager host, and the fingerprint is the record's hash.

## Slide 5 — Check 1: who said RT5J-6KL needs action?

Check one. The record says our retirement is action required by September 30, 2027. Who decided that? Microsoft, in a field on the event? The kit's stated rule? The security officer, reviewing the run? Or ServiceNow, when the task was created? The answer opens the next scene.

## Slide 6 — Scene 2: Microsoft 365 says it in its own field

The answer to check one: the kit's stated rule. Microsoft's Service Health event has no field for it. Scene two asks the same question of Microsoft 365. Here Microsoft does say it. Microsoft Learn's service communications API gives a Message center post an action-required-by date, Microsoft's own. The fixtures hold a Microsoft 365 retirement too: Basic authentication for SMTP AUTH client submission. It has that date, so its action basis says provider, not rule. The workbook's tenant is GCC, which reads the worldwide Graph host. GCC High and DoD have their own hosts, and the kit refuses a session in the wrong one.

## Slide 7 — Try it: the Graph host, and who said action is due

Try it. First, the hosts the kit knows: GCC on the worldwide Graph endpoint, GCC High and DoD on their own. Then collect Microsoft 365 from the fixtures and read the records. The SMTP AUTH retirement is action required by January 31, 2027. Then read each notice's action basis. The retirement's says provider, action required by date time: Microsoft's own field. The SharePoint Framework post says rule: a prevent-or-fix post with no date is action required by the kit's rule. Same record shape as our Azure retirement, with the source of each decision written down.

## Slide 8 — Check 2: a GCC High tenant on the wrong host

Check two. A GCC High tenant's settings say G C C by mistake. Without the kit's guard, what would the collection do? Fail loudly, read the posts anyway, return nothing and pass on an empty list, or read someone else's posts?

## Slide 9 — Scene 3: Oracle Cloud says it in the announcement type

The answer to check two: it would return nothing, and the gate would pass on an empty list. That's why the cloud is always named. Scene three, Oracle Cloud Infrastructure, where an agency's HR platform may well run. Oracle's documentation gives the announcement a type, and that type can itself be action required. That's Oracle's own flag, so no kit rule is needed. The fixtures' example is a change: replace the certificate bundle on load balancers, due December 15, 2026. The kit reads the latest announcement in each chain, so a rescheduled window replaces the first. And it knows Oracle's realms: commercial, and the US Government realm with its own regions.

## Slide 10 — Try it: Oracle's realms and its own flag

Try it. First, the realms the kit knows. The commercial realm, and the US Government realm with its two regions. The third realm is refused, with the reason: Oracle's page for its endpoint wasn't readable when the chapter was written, so the kit won't guess. Then read the day-one OCI records. A database maintenance window that names a database system, the certificate bundle change that's action required by December 15, an advisory and a closed incident. Same record, same fields, from a fourth provider's shape.

## Slide 11 — Check 3: a rescheduled maintenance window

Check three. Oracle reschedules that database maintenance, and publishes a new announcement in the same chain. What does the kit hold afterwards: two notices, one with the latest window, one with the original window, or nothing until it's over?

## Slide 12 — Scene 4: AWS flags some retirements, the kit the rest

The answer to check three: one notice, with the latest window. Scene four, AWS. AWS's documentation says AWS Health tells each account which of its instances will be retired, and when. AWS has its own actionability field, and when it says action required, that's the provider's word. But a scheduled change that names a retirement or lifecycle event without that flag could look optional, so the kit makes it action required by its own rule, due at its start. Two things to know: the Health API needs a qualifying support plan, and the GovCloud partition has a single endpoint. The kit names the partition, and checks the caller is in it.

## Slide 13 — Try it: AWS's flag, and the kit's rule

Try it. First, the partitions: commercial AWS in its Health region, and GovCloud in its single West region, each with its own ARN prefix. Then, after collecting the fixtures, read each notice's action basis. The EC2 instance retirement and the security notification say provider, actionability action required: AWS said so. The Lambda planned lifecycle event says rule: a scheduled change whose event type names a retirement, due at its start. Maintenance and the closed incident need no action. It's the same split our Azure retirement showed: who said it is always written down.

## Slide 14 — Check 4: an account without a support plan

Check four. An AWS account has no qualifying support plan. What does the Health API answer, and what should the agency do? An empty list, the support plan error and a recorded gap, a public status feed, or another account's events?

## Slide 15 — Scene 5: Google Cloud can't say retirement at all

The answer to check four: AWS answers with a subscription required error, and the agency records the gap with the security officer. Scene five, Google Cloud. Google's documentation for Personalized Service Health says its event has one category: incident. Planned maintenance isn't in it. So a notice like our retirement can never arrive from Google through this interface. The kit doesn't pretend otherwise. Every Google notice is an incident, and the gap is written into the guide, the chapter and the security officer's record. One more gap: Google lists no Personalized Service Health in its Assured Workloads FedRAMP and impact-level packages.

## Slide 16 — Try it: two weeks of Google, all incidents

Try it. Collect Google from the day-one fixtures: two notices, one open, none needing action, both incidents. Read them: a Cloud SQL connection problem and a Cloud Storage latency problem, each with its product and region. Then group both weeks by kind. Four records, and every one is an incident. That's not a fault in the kit; it's what the interface carries. So when the digest shows Google with no retirements, that's a gap the security officer has already recorded, not good news.

## Slide 17 — Check 5: no Google retirements in the digest

Check five. The weekly digest shows Google Cloud with no retirements and no maintenance. What does that tell the security officer: Google has nothing planned, the reader lacks a role, nothing at all because the interface carries only incidents, or the collection failed?

## Slide 18 — Scene 6: RT5J-6KL gets an owner and a typed task

The answer to check five: nothing. Google's interface carries only incidents, and that gap is already on record. Scene six brings us back to our retirement. The router matches it against the agency's routing file, rules in order, first match wins. It becomes a typed task: priority three, assigned to the cloud platform engineering group, with a contingency review, because a retirement that names the agency's resources is a plan change. Two dates stay apart: the agency's response window, a day, and Microsoft's action date, next September. The task follows the Ticket-to-Machine pattern from the book Governance, Drift and Evidence: a human-decision lane and five clauses, from origin to the evidence kept.

## Slide 19 — Try it: read RT5J-6KL's payload; a re-run writes nothing

Try it. After routing the day-one collection, read our retirement's payload. Create, de-duplication key azure and the tracking ID, P3 with a twenty-four-hour window, response due the next day, action due September 30, 2027. Cloud Platform Engineering, contingency review true, and the controls and indicators the step supports. Then the five clauses: the human decision lane, the notice as origin, the system owner as approver, plan the change under change control, a re-read check, and the evidence kept. Finally, route the same collection again on a copy of the state. Twenty-two unchanged, zero payloads.

## Slide 20 — Check 6: Microsoft closes the retirement notice

Check six. Next spring, Microsoft stops listing our retirement notice. What does the router do with its task: resolve it, delete it, send an update asking for the re-read, or wait for the action date?

## Slide 21 — Scene 7: the digest for owners, the chain for the ISSO

The answer to check six: an update asking for the re-read. A provider closing its notice isn't the agency's work being done. Scene seven. The digest is for the people who act, and the evidence is for the people who check. Both come from the same runs, so neither can drift from what was actually read. Every week, our retirement sits in the digest's action-required section, soonest due first, with the group it was routed to. And every run is recorded as evidence: its steps, the controls and indicators they support, every file's hash, and the hash of the record before it. Change a recorded file, and the check fails.

## Slide 22 — Try it: RT5J-6KL in the digest, then a tampered file

Try it. After a week of runs, write the digest for the second week and read it. Under action required, our row: due 2027-09-30, Azure, retirement, routed to Cloud Platform Engineering, with its notice ID. Then, with the collection, the routing and the digest each recorded, check the evidence: twenty-five files match their sums, three records, chain unbroken. Now append one line to the recorded digest and check again. The sums fail on that file, the chain fails on its record, and the check exits with a failure.

## Slide 23 — Check 7: the stage check in Lab 1

Check seven. In the lab, the stage check for test passes the sums, the chain, routing and the digest. Why does it still fail? An edited file, no pre-flight or scheduled-run record yet, mismatched indicators, or an old digest?

## Slide 24 — Scene 8: the loop goes live, test first

The answer to check seven: there's no pre-flight or scheduled-run record yet, and only the runbook makes them. Scene eight, the runbook. It's one ordered set of commands run twice, against test and then production, and only the settings file changes. Reads come first, one provider at a time, each cross-checked against the provider's own command. Routing runs as a dry run, then a smoke test, then the one write to a cloud, the Service Health alert policy Microsoft Learn describes, applied only with its approved hash. Then the weekly schedule, the stage's evidence, and a rollback someone has already run. One honest label: nobody has run this runbook against a live tenant yet.

## Slide 25 — Try it: the runbook's dry run on the fixtures

Try it. The runbook's own dry run on the fixtures: the test pre-flight passes fourteen checks and is recorded, then the scheduled run collects three providers, routes eight creates as a dry run, and writes the digest. Now the stage check that failed in the last scene passes on every row, because the pre-flight and the run are recorded. The Azure step on the test fixture shows one retirement, ours. And the production alert plan prints the same hash as the chapter one lab, which a reviewer approves before anything is applied.

## Slide 26 — Check 8: production before test passes

Check eight, the last one. An operator runs the production pre-flight before the test stage's evidence passes. Does it pass anyway, fail on the check that reads the test evidence, warn and let the operator decide, or apply the alert policy regardless?

## Slide 27 — Your turn: Lab 2, and where to go next

The answer to check eight: the pre-flight's last check fails, because production needs the test stage's evidence to pass first. That's our retirement, end to end: read with the least privilege, made one record that says who decided it needs action, routed to an owner with two dates kept apart, carried in the weekly digest, recorded as evidence the security officer can check, and deployed test first. Now it's your turn. Each provider chapter has a second lab in your own test subscription, tenant, tenancy, account or project, and routing has one in a ServiceNow developer instance, never production. Then go deeper: the workbook's chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.
