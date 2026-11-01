# Building Ticket-to-Machine, Chapter 08 — One Writer per Attribute — narration script (practice copy)

## Slide 1 — Chapter 08: One Writer per Attribute

Welcome to the last chapter of Building Ticket-to-Machine. Chapter 8: one writer per attribute. Two writers on one attribute isn't drift you can fix. It's drift you've scheduled. Book 3 makes Entra inbound provisioning the one writer into the directory, but SailPoint can also provision Entra ID. If both write department, the reconciliation reports drift that the next sync recreates. This chapter compares the two provisioning configurations, offline, and names every attribute with two writers. Then two labs and the dangers.

## Slide 2 — Why two writers is drift you've scheduled

Why does this matter? The example guide's fourth gap: SailPoint reads the HR system and can provision the directory, while Book 3 makes Entra inbound provisioning the one writer. The guide's advice is to pick one writer per attribute. Either Entra inbound provisioning stays the door and SailPoint governs entitlements, or SailPoint becomes the provisioning service. Not both. Until now, the drift client saw only the symptom, drift that keeps coming back, never the cause. Both configurations export as JSON, so the check can run on files, today.

## Slide 3 — Why only this Pass 2 item is built

Why only this one? The kit plans five items for Pass 2, and four of them need more than files. One approver per authority class needs the catalog app's internals, which aren't documented. Change records on demand need a ServiceNow flow on a live instance. The SailPoint half of the evidence export needs event retention nobody has confirmed. And email intake needs a mailbox and an inbound action. The writer check needs only two documented exports compared offline, so it can be built and tested now.

## Slide 4 — Export one: the inbound job's schema

The first export is the inbound provisioning job's schema, read from Graph. The check takes the rules that target the Entra directory, by default named Azure Active Directory, the name Learn's examples use. Inside them it takes the enabled object mappings to User, and each attribute mapping's target name and flow type. Two flow types matter: Always, the default, updates the attribute on every change, and object-add-only sets it only when the user is created.

## Slide 5 — Export two: SailPoint's provisioning policies

The second export is the SailPoint source's provisioning policies, for the source that writes to Entra ID. Each policy has a usage type and a list of field names. The update profile is used for attribute sync, so it counts as an update. The create profile is used when the account is made. Enable, disable and the other types don't write user attributes this way, so they're ignored. One catch to remember: SailPoint's field names are the connector's, not necessarily Entra ID's.

## Slide 6 — Three severities, and aliases a reviewer checks

For each attribute both systems write, the check assigns a severity. Both update it: a Finding, because each overwrites the other and drift never settles. One updates it and the other sets it at creation: a Warning, two sources for its first value. Both set it only at creation: Info. Any Finding fails the command. Names are matched ignoring case, and an alias maps a SailPoint field to its Entra attribute where they differ. The check never guesses that mapping; the alias list is a reviewed input.

## Slide 7 — The tests: six, from flow types to the CLI

Six tests cover flow types, usage types and aliases, the three severities, disabled mappings being ignored, a wrong directory name being refused, and the command line. The usual caution applies, and it matters more here: the check reads fictional exports. It can't show that your schema names the Entra directory the same way, or that SailPoint's field names match Entra's. Run Lab 2 on your own exports and review the alias list before acting on any result.

## Slide 8 — The verified facts behind the two exports

The facts behind the exports, read on November first. Reading a synchronization schema is available in the government clouds; oddly, Learn lists a custom security attribute permission as the least-privileged application permission, with Synchronization dot Read dot All among the higher ones. The schema's shape is rules, object mappings and attribute mappings. SailPoint's policies come from the provisioning-policies endpoint with a read or manage scope, at the org admin user level, each with a name, usage type and fields. GCC uses the worldwide Graph host.

## Slide 9 — What couldn't be verified about the writers

Four points are open, and each one changes what the check can see. Why Learn names a custom security attribute permission as the least privilege for reading a schema; confirm the read works with it. Which directory name an HR inbound job actually uses; Learn's pages differ, so the check refuses a name it can't find. How SailPoint's connector fields map to Entra attributes; that's why aliases are reviewed. And whether SailPoint writes Entra attributes through other paths, transforms or workflows. The check covers policies only.

## Slide 10 — What the writer check proves, and for whom

What this proves. Each Entra user attribute has one authoritative writer, or the overlap is named and assigned to someone, which supports configuration settings and change control. Drift that the next sync would recreate is traced to its cause, which makes the monitoring meaningful. And a change to either provisioning configuration is checked before it lands, which is change control and impact analysis, CM-4. The evidence is the check's output and the data architect's decision for each Finding.

## Slide 11 — Who owns each writer, and who decides

Who's involved? Identity engineers who own the inbound provisioning job or the SailPoint Entra source, and produce the two exports. The data architect, who decides which system owns each attribute and reviews the aliases; Book 3's default keeps Entra inbound provisioning as the writer. And the I S S O, who keeps the decisions. The two reads are read-only. One wrinkle: SailPoint's policies endpoint documents the org admin user level, so a personal token is the wrong tool; use an API client with one read scope.

## Slide 12 — Lab 1: department has two writers

Lab 1. Six tests pass. Then run the check on the two fictional exports. Entra inbound provisioning writes eight attributes and SailPoint writes seven. Department is a Finding: both systems update it, so each overwrites the other and drift never settles. Display name is a Warning: one updates it and the other sets it at creation. Two attributes are only Info, set by both at creation. The command fails because of that Finding.

## Slide 13 — Lab 1: the alias, the guard, the reads

Now map SailPoint's title field to Entra's job title and run it again. A second Finding appears: job title has two writers too. Without the alias that writer was invisible, which is why the alias list gets reviewed. Next, give the wrong directory name. The check refuses and exits with an error, rather than passing quietly as no overlap. Finally, list the reads the exports need: one SailPoint read scope for the policies, and one Graph permission for the schema.

## Slide 14 — Lab 2: your own exports, reviewed

Lab 2 uses your own exports, from a test tenant with an inbound provisioning job and a SailPoint sandbox, never production; the authors haven't run it. Both reads are GET only. Export the job's schema and note the directory name it actually uses. Export the SailPoint source's policies with an API client holding one read scope. Build the alias list from the source's account schema and have the data architect review it. Run the check, and hand each Finding to the data architect. Then clean up.

## Slide 15 — Dangers, and the guard for each

The dangers. Two systems updating one attribute means drift fixed and recreated forever; that's a Finding and a failure. Field names that differ can hide a second writer, so aliases are reviewed. A wrong directory name would make every attribute look unwritten, so it's refused. A disabled mapping would raise false findings, so it's skipped. An export with values in it may carry personal data, so export mappings only. And writers outside provisioning policies aren't seen at all, so a person confirms there are none.

## Slide 16 — Done when: the writer checklist

Done looks like this. The check runs on current exports with the reviewed alias list. Every Finding has a decision, which system owns the attribute, with the other mapping removed. Every Warning is understood, so each first value has one source. The directory name matches the job's schema. The two export identities hold only their reads. And the tests pass. That completes the workbook: the typed task, two least-privilege clients, three builds, the evidence, and one writer per attribute. Thanks for watching.
