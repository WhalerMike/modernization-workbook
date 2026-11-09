# Ticket-to-Machine learning path — Module 3: One Writer per Attribute — narration script (practice copy)

## Slide 1 — Module 3: One writer per attribute

Welcome to Module 3 of the Ticket-to-Machine learning path: one writer per attribute. This module follows the guide's Gate 2, which settles two decisions on paper before anything is connected: who writes each attribute, and which system approves each authority class. Then you'll use the developer workbook's Chapter 08 check, which reads two provisioning configurations, Entra inbound provisioning's and SailPoint's, and reports every attribute both of them write. You'll run it on fictional exports, add an alias, and see why the alias list and the directory name are inputs a reviewer has to confirm.

## Slide 2 — Why drift that comes back means two writers

Why does this module exist? Here's the story. Entra inbound provisioning writes department from HR. SailPoint's Entra connector also writes department. Each sync overwrites the other. And the drift you'll measure in Module 4 comes back the next day, no matter how often someone fixes it. The reconciliation sees the result, attribute drift that keeps coming back, but not the cause. Fixing the value by hand never settles it, because the next sync recreates the drift. Gate 2 settles it on paper, before anything is connected: one writer per attribute, and one approver system per authority class. In this module you learn those decisions, and you check two provisioning configurations against the first one.

## Slide 3 — What you'll be able to do in Module 3

Here's what you'll be able to do by the end of this module, which takes about forty minutes with the lab. You'll explain the two writer patterns Gate 2 allows, and why it allows only one of them at a time. You'll explain why Gate 2 names one approver system for each authority class. You'll run the writer check over two configuration exports, and interpret each Finding, Warn and Info line it prints. And you'll verify that the alias list and the directory name are inputs a reviewer checks, not things the tool guesses. You need Module 2 first. For the Graph export in Lab 2, the Microsoft Automation path's first module helps. Lab 1 runs on fixtures, with no tenant.

## Slide 4 — Gate 2 closes two of the four gaps on paper

Used as shipped, the two products fall short of the loop in four places, and Gate 2 closes two of them on paper. Gap two: with SailPoint's Service Catalog app, requests follow the approval process defined in ServiceNow, while the Federal Modernization Workbook's design decides owner-governed access, classes A two and A three, in the identity governance platform. Gate 2 answers with one approver system per authority class. Gap four: two doors into the directory. SailPoint can provision Entra ID and Active Directory, while the workbook's design makes Entra inbound provisioning the one writer of HR-mastered attributes. Gate 2 answers with one writer per attribute. It also gives each operation class a lane and a change-record type. Every later gate builds what this one decides.

## Slide 5 — Two writer patterns: pick one, not both

Gate 2's first step is to choose one writer per attribute, and the guide offers two patterns, as design guidance. In the first, Entra inbound provisioning stays the door. SailPoint aggregates HR read-only, and governs entitlements: groups, roles, access packages and application access. In the second, SailPoint becomes the provisioning service, and takes on the duties the workbook's design gives the HR middleware. Pick one and write it down. Not both. Then record each attribute's writer in the program's attribute map. One fact helps the choice: SailPoint's Oracle HCM Cloud connector reads Core HCM directly, without an on-premises appliance, and writes back only the user name and work email. For the first pattern's build, the guide points to its Oracle HCM to Entra guide.

## Slide 6 — One approver system per class, and a lane for each

Step two chooses one approver system per authority class. The guide's example, design guidance: ServiceNow approves A zero and A one through its Ask for Approval flow. SailPoint approves A two and A three, through access-request approvals by an owner, a manager or a governance group. The Service Catalog app only collects A two and A three requests. And every approval's timeout outcome is reject or cancel, never approve. Step three gives each operation class a lane, following the workbook's design. The mapping onto these products is the program's inference. An autonomous class runs as a standard change, and the authorizing official accepts any class run that way. A gated class is an access request with approval. Step four writes the decisions to the record as a reviewed change.

## Slide 7 — writer_check.py reads two provisioning exports

The guide names the automated check for Gate 2, built in the workbook's Chapter 08. Why now? The implementation example planned a read-only check of the two provisioning mappings for Pass 2, and both configurations export as JSON through documented reads, so the check runs on files, offline, today. It reads two exports. The first is the inbound job's synchronization schema, from Microsoft Graph. It takes the rules that target the Entra directory, the enabled mappings to User, and each attribute's flow type: Always updates it on every change, and Object Add Only sets it only at creation. The second is the SailPoint source's provisioning policies. An Update policy is used for attribute sync, a Create policy when the account is made, and other usage types are ignored.

## Slide 8 — Finding, Warn and Info, and the inputs to review

For each attribute both systems write, the check gives one of three results. A Finding when both update it: each overwrites the other, and the command exits one. A Warn when one updates it and the other sets it at creation: two sources for its first value. And Info when both set it only at creation. Two inputs need a reviewer. First, the alias list. SailPoint's field names are the connector's, not necessarily Entra ID's. The check matches names case-insensitively, and takes an alias for each pair that differs. It doesn't guess. Which connector field writes which Entra attribute is something to confirm in the source's schema. Second, the directory name. A wrong name would make every attribute look unwritten, so the check refuses a name the schema doesn't target.

## Slide 9 — What the check guards against, and what it misses

Here's what the check guards against, from Chapter 08's dangers table. Two systems updating one attribute means drift that's fixed and recreated on every sync, forever; that's a Finding, and an exit code of one. Field names that differ can hide a second writer, so the check would report no overlap; the guard is the reviewed alias list. A wrong directory name makes every attribute look unwritten; the check refuses it. A disabled mapping counted would give false findings, so disabled object mappings are skipped. And here's what it misses: writers outside provisioning policies. A person has to confirm those. The guide is clear about scope, too. The check reads exports. It doesn't check approver systems or lanes; those stay a manual validation of Gate 2.

## Slide 10 — Try it: find the attribute with two writers

Try it. Lab 1 runs in the kit's folder against two fictional exports: an HR-to-Entra inbound job, and a SailPoint source that creates accounts and updates department, title and office location. Step one runs the chapter's tests: six pass. Step two checks the two exports. Entra inbound writes eight attributes and SailPoint writes seven, with one Finding, one Warn and two Info. The Finding is department: both update it, so each overwrites the other and the drift never settles. The command exits one. Step three maps SailPoint's title to Entra ID's job title, and runs it again. Now there are two Findings: job title joins department. Without the alias, the second writer of job title was invisible.

## Slide 11 — Try it: the directory guard and the two reads

Step four shows the directory-name guard. The fixture's rules target Azure Active Directory, the name Learn's examples use. Ask for Microsoft Entra ID instead, and the check stops with an error that names the targets the schema does have, and exits two. That matters, because a wrong name would otherwise look like no overlap at all, and pass. Step five lists the reads the two exports need. On SailPoint, the provisioning policy read scope, for the source's provisioning policies. On Graph, the custom security attribute provisioning read permission, for the job's schema. Both are reads, and the writer check itself reads files only: you export the two configurations by hand. Check your work: given two exports and an alias list, you can say which attributes have two writers.

## Slide 12 — Lab 2: export the real mappings and run the check

Lab 2 runs the check on your own exports. You need a test Entra tenant with an inbound provisioning job, and a SailPoint sandbox with an Entra source. Both reads are GET only. Export the inbound job's schema from the tenant, and the Entra source's provisioning policies from the sandbox. Build the alias list, run the check, and hand each Finding to the data architect, who decides the writer. Export mappings only: a schema with expressions is fine, but a policy with values may not be. Back it out in step five: delete the exports if they hold anything beyond mappings, and remove the Graph permission and the SailPoint API client. The authors haven't run Lab 2; follow Chapter 08's Lab 2 step by step.

## Slide 13 — Where agencies are: the HR feed, and the clouds

Where are agencies? The guide assumes one of two starting points for the HR feed. Either the workbook's HR pipeline, Entra inbound provisioning from HR, is already live, or accounts are still created from tickets. Either way, Gate 2 decides who writes each attribute. For availability, Gate 2 uses nothing new. If API-driven inbound provisioning is the writer, Microsoft Learn's feature availability page lists it in Azure for U S Government, as are PIM, entitlement management, access reviews and Lifecycle Workflows, read on November 1, 2026. In GCC, Entra ID is the commercial service. The interim path: where the HR pipeline isn't live yet, SailPoint can't be measured against a source of authority. Decide the writers now, and run Gates 3 to 6 against the HR extract the kit reads.

## Slide 14 — The federal requirement, and the evidence to keep

The federal requirement. The guide maps Gate 2 to NIST special publication eight hundred fifty-three. A C five, separation of duties: one approver system per class, and the requester never approves. C M three, configuration change control: each operation class has a lane and a change-record type. A C two, account management: one writer per attribute keeps account changes traceable to the source. And the workbook's design requires the authorizing official to accept any autonomous class in writing. Chapter 08 maps the check to configuration settings, change control, impact analysis, continuous monitoring and system monitoring. The evidence an ISSO keeps: the attribute map with each writer, the approver and lane tables, and the check's output with the data architect's decisions.

## Slide 15 — Check yourself: two questions on two writers

Check yourself with two questions from the module's knowledge check. First: why did adding the alias from title to job title add a Finding? The answer is a. SailPoint's field names are the connector's, so without the alias the second writer of job title was invisible. The check doesn't guess name pairs; the alias list is a reviewed input. Second: Gate 2 offers two writer patterns. Which choice does it rule out? The answer is c: both Entra inbound provisioning and SailPoint writing HR-mastered attributes. In the guide's words, not both. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary, and next: Module 4, the starting drift

To sum up. You learned Gate 2's decisions: one writer per attribute, one approver system per authority class, and a lane and change-record type for each operation class. You checked two provisioning configurations for attributes with two writers, and read each Finding, Warn and Info line. And you saw why the alias list and the directory name are inputs a reviewer has to confirm. Before you ship, work through the Chapter 08 checklist, and run the check whenever either provisioning configuration changes. Next is Module 4, sources and the starting drift: Gate 3 connects HR, Entra ID and SailPoint on one key, and you'll measure how far the directory is from HR over two days, and compare the runs without hiding what wasn't measured.
