# Building Provider Notices, Chapter 03 — Oracle Cloud Infrastructure Announcements — narration script (practice copy)

## Slide 1 — Chapter 03: Oracle Cloud Infrastructure Announcements

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 3: Oracle Cloud Infrastructure announcements. When a platform the agency doesn't run is patched on a Saturday night, the people who own what runs on it should hear from the provider's own record, not from the help desk on Monday. We'll start from what Oracle's documentation gives you, see what it leaves to you, then read how the kit fills the record, and walk two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why read OCI's announcements

Why Oracle Cloud? Because the estate isn't only Microsoft. Where an agency's HR platform runs on Oracle Cloud Infrastructure, a maintenance window on that platform reaches the people who depend on it, whether or not anyone read the announcement. So the goal is concrete. By the end of this chapter you can read every announcement for a tenancy, the latest in each chain, with its affected resources, into records that carry Oracle's own action-required date. Then the HR platform's maintenance goes to the HR system's owners before it lands, not after.

## Slide 3 — Which realm: commercial OC1, government OC2

Next, which realm. Oracle Cloud is divided into realms. The commercial realm, O C 1, is what the lab uses. Oracle's US Government Cloud page lists the Announcements service in realm O C 2, at two government regions, Langley and Luke. For realm O C 3, Oracle's page wasn't readable when the chapter was written, so its endpoint is not yet specified, and the kit refuses it with that reason. Why does it matter? A government tenancy read in the commercial realm returns nothing. So the settings name the realm and region, and a region outside the realm is refused.

## Slide 4 — What Oracle's documentation gives you

Here's Oracle's starting point. Oracle's CLI reference documents the announcements list command, with a required compartment, an option to read all pages, and an option to show only the latest announcement in each chain. Oracle's Announcement model gives the fields: the type, two generic time fields each with its own type, the lifecycle state and the chain ID. A separate get command returns one announcement's details, including its affected resources. Oracle's policy reference makes announcements a resource type: inspect lists summaries, read adds the details. And Oracle's common policy is a single statement that lets a group read announcements in the tenancy.

## Slide 5 — What it leaves to you, and the verdict

What does Oracle leave to you? Updates to one announcement form a chain, so a rescheduled window arrives as a new announcement; read every one and you keep the old date. Several announcement types mean the same kind of news. The window and the deadline sit in generic time fields whose meaning is in another field. The affected resources come only from the details call. Oracle's reference doesn't show the CLI's key casing. And the realms need a guard. Each gap is pinned by a test. The verdict: use Oracle's commands and policy as published, and build the chains, the time fields and the realm guard.

## Slide 6 — The collector: a list, then a get for each

Now the code. The collector makes the list call, then a get for each announcement, because only the details call names the affected resources and carries the full description. The normalizer keeps the latest announcement in each chain, by its update time, and gives the record the chain's ID, so a rescheduled window updates one notice instead of adding a second. The summary is the description from the details, an inactive announcement closes the notice, and the source link is the announcement on the realm's own Announcements host.

## Slide 7 — Announcement types to kinds, and Oracle's flag

Here's the mapping. A type that mentions maintenance is maintenance; one that mentions change, or the action-required type, is a change; a production event notification is an incident; and action-recommended or information types are advisories. The time fields are read by their types: a start or new start time opens the window, an end time closes it, and an action-required-by time is Oracle's own deadline. Notice what's different from Azure and Microsoft 365: Oracle flags action itself. So every action-required OCI notice says the provider decided, and the kit needs no rule of its own.

## Slide 8 — The tests, and what the code isn't yet

The tests cover the collector and the live pieces: seven tests for the OCI block of the collectors, plus the live tests for the list command and the realm guard. The lab runs nine of them. But be clear about what this code isn't yet. The live reader was tested against stand-in CLI output, not a live tenancy, so review it and run Lab 2 before it reads a real one. And two things are still not yet specified: which key casing the CLI actually prints, so the kit accepts both, and the Announcements endpoint in realm O C 3, so the kit refuses it.

## Slide 9 — Who owns it, and what the reader may hold

Who's involved? Developers maintain the collector and the realm guard. The OCI platform lead owns this gate. The owners of systems on OCI, an HR platform among them where the agency has one, receive the maintenance that names their resources. And the security officer keeps the policy and the run folder. What the reader may hold is one policy statement: read announcements in the tenancy. Inspect is enough to list, but read is what the details call needs. Grant only inspect and you get summaries without affected resources, so nothing routes as naming your resources.

## Slide 10 — Lab 1: what OCI needs, and the realms it knows

Lab 1 needs PowerShell 7 with Pester, in the kit's folder. The lab settings name a fictional tenancy in the commercial realm, in the Ashburn region; nothing signs in. Step 1 lists what OCI needs: inspect to list, read for the details. Step 2 shows the realms the kit knows: the commercial domain, the government domain with its two regions, and O C 3 refused with its reason. That refusal is deliberate: an endpoint nobody could confirm is never guessed.

## Slide 11 — Lab 1: collect, and the records name the resources

Step 3 collects OCI from the day-one fixtures: four notices, three open, one needing action, all valid against the schema. Step 4 reads the records. Look at the resources column: that's why the kit makes a get per announcement. The maintenance names a database system, with its window starting November 22. The change names a load balancer, and it's action required by December 15, by Oracle's own type, not by any kit rule. The advisory is open, and the incident is already closed, because Oracle marked it inactive. Because both name the agency's resources, Chapter 6 can route each one to the owners of those systems.

## Slide 12 — Lab 1: Oracle reschedules; still one notice

Step 5 collects the second week, and this is the step to watch. Oracle rescheduled the maintenance. In Oracle's model, that arrives as a new announcement in the same chain. The kit keeps the chain's latest, so the database maintenance now starts November 29 instead of November 22, with its new window end. And it's still one notice, with the same ID, so Chapter 6 updates the existing task instead of opening a second one. Read every announcement on its own, and the old window would linger next to the new one.

## Slide 13 — Lab 1: the live command, and the tests

Step 6 builds the live list command without running it. These are the exact arguments a live run would pass to Oracle's CLI: the tenancy as the compartment, all pages, only the latest in each chain, the region from the settings, and JSON output. Compare them with Oracle's command reference: they're Oracle's own options. Step 7 runs this chapter's tests: nine pass, none fail. The raw folder holds the list and each announcement's details, which is what the security officer keeps. Delete the output folder when you're done.

## Slide 14 — Lab 2: an OCI test tenancy

Lab 2 uses an OCI test tenancy, never production. As an IAM administrator, add Oracle's one policy statement for the reader's group, from a file so the shell doesn't touch its quotes, and keep the policy's ID for the back-out. Configure the CLI as the reader with Oracle's setup command, which creates the key pair. Then cross-check: Oracle's own list command counts the announcements, and the kit's collection should agree. Record the key casing the CLI printed, because Oracle's reference doesn't show it. Finally, delete the policy and the run, which names the tenancy's resources.

## Slide 15 — Federal requirements and the evidence

Each output is evidence for something specific, against NIST's control catalog. A policy that lets the reader's group read announcements and nothing else supports monitoring an external service provider. A run folder showing every chain's latest announcement was read, in the right realm, supports that and receiving security alerts and advisories. Maintenance that names the agency's resources supports contingency planning, because Chapter 6 asks the system owner to review the plan. And a rescheduled window that stays one notice supports continuous monitoring. The indicators are FedRAMP's; the mapping is the program's. The assessor decides the controls.

## Slide 16 — Dangers, and the guard for each

What breaks in production? Grant inspect instead of read and you get summaries without affected resources, so nothing routes as naming your resources. Read every announcement in a chain on its own and the old window lingers next to the new one. Read a government tenancy in the commercial realm and nothing comes back. Let only the help desk see the HR platform's maintenance and its owners learn of it after it lands, so the workbook's design guidance routes it to them. And treat the email as the record and it can be spoofed and isn't in the evidence; the task links the announcement the kit read.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. The policy grants read announcements to the reader's group, and nothing more. The settings name the realm and the home region, and a government tenancy uses O C 2. Oracle's list and the kit's collection agree in the test tenancy. Maintenance notices name the affected resources. The key casing you saw is recorded. And the owners of systems on OCI, an HR platform among them where the agency has one, are in the routing. Next, Chapter 4 fills the same record from AWS Health. Thanks for watching.
