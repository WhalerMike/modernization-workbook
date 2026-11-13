# Building Provider Notices, Chapter 01 — The Notice Record and Azure Service Health — narration script (practice copy)

## Slide 1 — Chapter 01: The Notice Record and Azure Service Health

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 1: the notice record, and Azure Service Health. Five providers publish the same kinds of news in five shapes, so the first job is one shape, so you can ask what needs action, by when, and who owns it, just once. We'll start from Microsoft Learn's own Resource Graph queries and alert policy, see what they leave to you, then read the kit's record and its Azure collector, and walk two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why one record comes first

Why start with a record? Because a reader should be able to ask, once, what needs action, by when, and who owns it, and five providers answer in five different shapes. So the goal of this chapter is concrete. By the end you can read every Service Health event for the subscriptions in scope, with the least-privileged role, into records that say what kind of notice each is, whether it needs action and by when, who said so, and which resources it names. And you can plan Service Health alerts at scale as a file that a reviewer approves by its hash before anything changes.

## Slide 3 — Which cloud, for this read

Next, which cloud. The workbook's estate is a Microsoft 365 GCC tenant with commercial Azure, so the Azure CLI is set to Azure Cloud and Resource Manager is the commercial host. Azure Government is a side note here: its own CLI cloud name and its own Resource Manager host. Learn's sample queries link the Azure Government portal, but a statement that the table is available there, in so many words, is not yet specified. The kit never guesses: the settings name the cloud, an unknown name throws, and the live run refuses a CLI that's set to another cloud.

## Slide 4 — What Microsoft Learn gives you

Here's Microsoft's starting point. Microsoft Learn publishes Resource Graph sample queries for Service Health: all active events, health advisories, upcoming retirements and planned maintenance. A second page gives the impacted-resources query. Reader on a subscription is enough to see its events, but a security advisory's sensitive fields and its impacted resources need Service Health Security Reader; Reader and Monitoring Reader can't see them. And for alerting between collections, Learn names a built-in policy that creates the Service Health alert rule in every subscription, with a remediation task for the ones that already exist.

## Slide 5 — What it leaves to you, and the verdict

What does Learn leave to you? Each sample answers one question with its own columns, so there are several queries to run and merge. Each event comes back once per subscription, so one outage would be counted many times. Event types don't say what to do: a health advisory can be a retirement. Nothing says action is required. The alert policy is portal steps, with nothing a reviewer can approve before it runs. And nothing covers the other providers. Each of those gaps is pinned by a test. The verdict: keep Learn's queries as the model, and build the record, the merge, the kinds and the action rule.

## Slide 6 — The record: one shape for every provider

So here's the record. Every notice from every provider becomes one record, defined in the kit's JSON schema. It has an ID made of the provider and the provider's own ID, which is what the router de-duplicates on. It has one of six kinds, a status, plain-text title and summary, the impact window in UTC, and the services, regions and resources it names. The three action fields matter most: whether action is needed, by when, and who said so, the provider's own field or a stated rule of the kit. And it ends with a fingerprint.

## Slide 7 — The fingerprint, and a record that must be valid

The fingerprint is the reason the router can tell a changed notice from one it has already seen. It's a hash of the record without the first-seen time and without itself, so when a provider edits a notice the fingerprint changes, and when the kit simply reads the same notice again a week later, it doesn't. And a record has to be valid. The kit checks the schema's rules in code, so the check runs on older PowerShell 7 too, and the collector refuses to write a run with an invalid record. Every time is stored in UTC.

## Slide 8 — The Azure collector: event type to kind

Now the Azure collector. It makes two declared calls, the events query and the impacted-resources query, each a Resource Graph query in a live run and a file in fixture mode. Then the normalizer maps each event type to a kind. Service issues are incidents, planned maintenance is maintenance, and a health advisory is a plain advisory unless its subtype says retirement. Two kinds are action required by the kit's rule: a retirement, due at the advisory's end, and a security advisory, with no date, for the security officer to review. Anything else, like billing, is left out and counted.

## Slide 9 — The alert policy: a plan, a hash, then -Apply

For alerting between collections, the kit follows Learn's built-in policy, but as a plan instead of portal clicks. The script reads the built-in definition and checks its name. It writes a plan with two steps: the policy assignment, with a managed identity that holds the definition's role, and a remediation task for the subscriptions that already exist. Learn's remediation page notes that only the portal grants that role automatically, so the plan names the role itself. The script refuses a resource group scope, prints the plan's hash, and changes nothing unless it's run again with that exact hash.

## Slide 10 — Who builds it, who runs it, what it may read

Who is involved? Developers build and maintain the kit. The cloud platform lead owns this gate: the reader's roles, the alert policy and its change record. And the security officer keeps the evidence and reviews security advisories. What the reader may hold is short. Two calls, each needing Reader on each subscription in scope. Service Health Security Reader is named as the elevated role, because without it a security advisory is listed but its summary and impacted resources aren't. And nothing the reader holds can write.

## Slide 11 — Lab 1: what Azure needs, and the kit's query

Lab 1 needs only PowerShell 7 with Pester, working in the kit's folder, against two weeks of fictional notices from every provider. No tenant. Step 1 lists what Azure needs: this is what a reviewer reads before granting anything. Two calls, each needing Reader on each subscription in scope, each linked to the Learn page that says so. Step 2 prints the kit's events query. Compare it with Learn's all-active sample: the same filter, with the retirement sample's subtype added, the times converted, and named columns projected and ordered.

## Slide 12 — Lab 1: collect Azure, then read the records

Step 3 collects Azure from the day-one fixtures. Five notices, all open, two needing action, one of each kind but change, and every one valid against the schema. Notice: five notices from six rows. The incident's rows from two subscriptions became one notice. Step 4 reads the records as a table. The retirement of basic public IP addresses is action required by September 30, 2027. The security advisory is action required with no date. The incident, the advisory and the planned maintenance need no action, and they'll go to the weekly digest.

## Slide 13 — Lab 1: the retirement in full, and a second read

Step 5 reads the retirement in full. Look at the action basis: it names the kit's rule, an Azure retirement due at the advisory's end time, not Microsoft, as the reason the notice needs action. So nobody argues with Microsoft about a date Microsoft never set. The source link is the event on the commercial Resource Manager host. Step 6 reads the same fixtures a day later and compares the fingerprints. The first-seen time changes in the run, but no fingerprint does. The last line says zero differ, so the router will see nothing new.

## Slide 14 — Lab 1: plan the alert policy; fixture mode refuses

Step 7 plans the Service Health alert policy. The production fixture names a management group, so the plan assigns the built-in definition there and remediates the existing subscriptions: two would-apply steps, the plan's hash, and dry run, nothing changed. The role ID in the fixture is made up; Lab 2 reads the real one. Step 8 tries to apply it in fixture mode, and the script refuses before it even reads the hash. Step 9 runs this chapter's tests: twenty-six passed, none failed. Then delete the output folder.

## Slide 15 — Lab 2: an Azure test subscription

Lab 2 moves to an Azure test subscription in a test tenant, never production, and an empty list of events is a valid result. Grant the reader its two roles, sign in in the right cloud, and cross-check: Learn's own query and the kit's collection should agree. Then plan the alert policy at the test subscription, have a second person approve the hash, apply it, and check. Learn says the remediation creates a resource group, an alert rule and an action group that emails subscription owners; Service Health alerts are activity log alerts. Finally, back it all out.

## Slide 16 — Federal requirements and the evidence

Each output is evidence for something specific, against NIST's control catalog. The reader's roles, and the fact that nothing can write, support monitoring an external service provider. The run folder shows every event in scope was read, which supports receiving security alerts and advisories. Valid records and unchanged fingerprints support continuous monitoring. The approved alert plan supports the same, and an approved rollback is configuration change control and contingency planning. The key security indicators are FedRAMP's, and which output supports which indicator is the program's mapping. The kit's records support these controls; the agency's assessor decides them.

## Slide 17 — Dangers, and the guard for each

What breaks in production, and what guards against it? Read security advisories with Reader alone and you see the advisory but not its summary or resources. Read from the wrong cloud and you get nothing, and the gate passes on an empty list. Count an event per subscription and one outage becomes five tasks. Read a retirement as an advisory and the deadline passes unnoticed. Mistake a kit rule for Microsoft's and you argue about a date Microsoft never set. Apply the policy unreviewed and resources appear everywhere. And per Learn, remediation may overwrite hand edits to the alert rules.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The reader holds Reader everywhere in scope, the security reader role where security advisories matter, and nothing that writes. The settings name the cloud. Learn's query and the kit's collection agree. Every record validates, and says whether the provider or a kit rule made it action required. The alert plan's hash was approved by someone other than the person who applies it, the alert rule exists in each subscription untouched, and the rollback has been rehearsed. Next, Chapter 2 fills the same record from Microsoft 365. Thanks for watching.
