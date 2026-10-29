# Companion guide — Attribute-Driven Migration to Entra ID — Technical Deep Dive, Part 2 — narration script (practice copy)

## Slide 1 — Part 2: Devices, servers and non-person identities

Welcome to Part 2 of the technical deep dive on attribute-driven migration to Entra ID. Part 1 covered the model and the HR track, the people. This part takes the other three tracks: end-user devices through Intune, servers through Azure Arc, and the non-person identities, service accounts, workloads and AI agents. Then it runs the migration, from cutover to the checklist. Microsoft facts were checked on October 29, 2026, and design guidance is labeled. First, a quick recap.

## Slide 2 — Recap: four tracks, and where the attributes live

Two things from Part 1 carry everything here. First, the four tracks. People get their attributes from HR, devices from device provisioning, servers from Arc onboarding tags and Azure Policy, and non-person identities from their owner's record, never from HR. Second, the store table, reduced. Extension attributes drive user and device rules, custom security attributes feed Conditional Access for applications but not dynamic rules, Intune's inventory feeds filters, and Azure tags feed Policy. Part 1 covered the HR track. Now the computers.

## Slide 3 — Module 1: The Intune and Arc tracks

Module 1 is the Intune and Arc tracks: what each tool covers, how devices and servers get attributes that policy reads, the dangers of dynamic device groups, and a strategy for whatever neither tool reaches.

## Slide 4 — What Intune covers

Now the Intune track: end-user devices, whose attributes come from device provisioning, not HR. Start with what Intune covers, because it's not just Windows. It manages Windows 11, Cloud PCs and Azure Virtual Desktop, Macs, iPhones and iPads, Android in several modes, and some Linux desktops. ChromeOS is limited: Intune sees the inventory, but policy stays in Google's console. Old Windows releases and Windows Server aren't Intune platforms, and neither are printers, network gear or OT devices. So Intune does manage non-Microsoft platforms, within limits. Now, how it targets them.

## Slide 5 — Intune targeting: device groups, and prefer filters

This slide sets the default for Intune targeting, so it's worth getting right. By default each policy goes to a dynamic device group. Microsoft's current guidance, checked October 29, is to prefer assignment filters where they meet the need, because dynamic device groups add processing delay, and the Federal Modernization Workbook's Book 05 now says the same. Send user settings to user groups and device settings to device groups. The exception is tier and role: filters can't read device extension attributes, so those stay in group rules. And underneath it all, a device rule can never read its owner's attributes. Next, how device attributes get written.

## Slide 6 — Beyond users: Intune and Entra devices

Devices are attribute-driven too, but only through their own attributes, the device rows of the store table in the recap. Dynamic device groups read things like ownership, trust type and enrollment profile, and Autopilot devices carry markers a rule can select. Filters read Intune's own inventory at check-in. The highpoint is the red panel. Writing a device's extension attributes needs the right Graph permission, and it depends on the call: a signed-in administrator uses one permission, an unattended service another. Book 05's sample now uses the signed-in one. Then, the dangers of dynamic device groups.

## Slide 7 — Dynamic device groups: the dangers, and how to avoid them

Dynamic device groups have their own dangers, and a mistake here reaches the whole fleet at once. Only the device provisioning service should write device attributes. A wrong or reused Autopilot group tag puts a device in the wrong group, so check it before enrollment. Device rules can't read their owner, and stale or duplicate device objects keep matching until you reconcile them. For time-sensitive policy, use filters, and never use a dynamic device group as an exclusion. Pilot rings, one owning policy per setting, and watching the deltas finish the list. Now, the servers.

## Slide 8 — What Azure Arc covers

Now the Arc track: servers. Arc isn't just for Windows either. It covers Windows Server 2016 through 2025, a long list of Linux distributions, physical servers and VMs on any hypervisor, VMware through vCenter, and AWS and Google Cloud instances. Two dates matter: Windows Server 2012 stops getting new agents in November 2026, and the SCVMM integration is retiring. Azure VMs don't need Arc at all, because they're already Azure resources. And Unix, mainframes, network devices and sealed appliances are out. So here's how Arc makes a server attribute-driven.

## Slide 9 — Beyond users: Azure Arc servers, through Resource Manager

Arc servers matter because they're the on-premises servers the organizational unit, or O U, tree used to scope. Once connected, a server becomes an Azure resource, and tags become its attributes. You set them at onboarding or later, Azure Policy can test them and even inherit them, and Resource Graph queries them at scale. One boundary to state plainly. Azure's attribute-based access conditions apply only to storage data today, so Microsoft doesn't document them for managing servers. Role assignments at the right scope do that job. Next, the devices neither tool covers.

## Slide 10 — Devices neither covers: the strategy

So what about everything neither tool reaches? It still needs one source of truth, and the program's design gives it four tiers. Tier one is managed by Intune or Arc. Tier two is managed by its own platform tool, like the Google console, a network controller or the mainframe's security system, feeding evidence to the C M D B, which holds its attributes. Tier three is discovered and monitored only, like printers, cameras and OT. Tier four is segmented or retired. That's how the inventory meets C M 8: every component counted once, and a device in no tier is a finding. Now, the fourth track: the non-person identities.

## Slide 11 — Module 2: The non-person track and PIV

Module 2 is the non-person track. Service accounts, service principals, workload identities and AI agents have no HR record, so each needs a named owner, a credential that's managed or expires, and a lifecycle that ends. Then the crosswalk across every track, and PIV binding.

## Slide 12 — Non-person track: service accounts, MSAs and gMSAs

The non-person track starts with what AD already holds. Service accounts have no HR record, so nobody's leave date ever turns them off, and that's why they're so often over-privileged and forgotten. The table is Book 02's migration matrix. The rule is to get rid of stored secrets: a traditional account becomes an app registration with a certificate or federated credential, or a managed identity in Azure; on-premises Kerberos workloads go to a g M S A; and an M S A upgrades to a g M S A first. Each one gets an owner before it's touched, and an account nobody will own is a retirement candidate. Next, the cloud side.

## Slide 13 — Non-person track: workload identities and AI agents

The rest of the non-person track lives in Entra ID, and the question for each identity is the same: who answers for it, what credential does it hold, and what ends its life. Service principals get two human owners and no client secrets in production. Managed identities have credentials nobody sees, and end with their resource. Workload identity federation trusts an external issuer, so there's no secret at all. And AI agents get an agent identity with a required sponsor; the program makes that sponsor an HR-mastered federal employee, and expiry is the review. One caution: check what your cloud supports before you plan on agent identities. Next, how attributes reach applications.

## Slide 14 — Beyond users: service principals and custom attributes

Applications and service principals are the partial answer. The table repeats the recap's store table for these consumers. Extension attributes drive dynamic groups. Custom security attributes can't, but Conditional Access can filter applications by them, and they suit sensitive values that only specific roles should read. For service principals, workload Conditional Access only blocks, applies only to direct assignment, and needs the Workload I D Premium license. And Microsoft documents no dynamic groups of service principals at all. So access codes stay in the user extension slots. Here's everything on one page.

## Slide 15 — The object-type crosswalk: stores, writers, consumers

This crosswalk is the reference you'll come back to, the store table seen by object type: every object type, the store its attributes live in, who writes them and what reads them. Users, devices, Arc servers and service principals each have their own stores and their own consumers. The highpoint is the third column. Every row names one writer, whether that's HR provisioning, device registration, the Arc agent or an attribute administrator. That's the same single-writer rule we set for the user schema, applied to everything. And one user row leads straight into PIV.

## Slide 16 — PIV and CAC: the certificate binding is an attribute

PIV and CAC sign-in is attribute-driven too, which is easy to miss. Entra ID finds the user by matching a field on the certificate to a field on the account. Some matches are low affinity, like the name on the card, and some are high, tied to one specific certificate. Two highpoints. Certificate-based sign-in is only as strong as the weakest binding you allow, and the program's position is high affinity in production. But switch the whole tenant to high before every account's value is right, and you lock people out. Pilot it first. So where does that value come from?

## Slide 17 — certificateUserIds: who writes it, and the open pilot

The certificate user I Ds attribute, the last row of the store table, holds the binding, so who writes it matters as much as any HR field. For cloud-only users, a privileged authentication administrator or Graph writes it. For synced users, only Entra Connect can, from Active Directory, and Microsoft's page doesn't mention Cloud Sync. HR supplies the person; the card management system supplies the binding, because a reissued card changes it. After Active Directory is gone, the plan is for the card system to write it directly. Be clear that this is design guidance, and unverified. It's an open pilot, workbook issue one thirty. Now let's run it.

## Slide 18 — Module 3: Running the migration

Module 3 runs the migration. We'll follow one analyst through a reassignment with no ticket, cut over in phases, keep the attributes true with drift detection, and finish with the limits, the checklist and the decisions for every track.

## Slide 19 — Worked example: one analyst, every mechanism

Here's the model working on one person, which is the best test of it. She's a budget analyst in a finance division, still mastered in Active Directory. Her HR record becomes a handful of coded attributes, and every mechanism reads them. Her organization code puts her in the right groups, and in a database reader group. Her division puts her in the unit whose help desk can reset her password. Her worker type puts her in the employee persona. And her laptop is governed by its own attributes, not hers. Nobody assigned any of it by hand. Now HR moves her.

## Slide 20 — The mover event: one personnel action, no ticket

This is why the whole design exists. HR records her move to accounts payable as a personnel action, and nobody opens a ticket. The record flows through the middleware to Active Directory and up through sync. Her groups and units recompute, usually within hours, but it can take more than a day. A workflow swaps her access packages and starts a review of what's left. Her laptop stays put, because device rules can't see her. And a drift scan checks the result field by field. Next, cutting over at scale.

## Slide 21 — Stage 7: cut over in phases, wave by wave

Stage seven is a runbook, not a flag day, and that's what keeps rollback possible. Waves are defined by attribute values, so each wave is a query whose groups already exist. Start with a pilot division, and keep each one drift-clean before the next. Do leaver automation first, because revocation is where the risk is. The gate is the strip across the top: a signed report, a dry run with writes off, then seven days in which every change traces to HR. Only then does the ticket path close. And disable, never delete, so you can always go back. Then, drift.

## Slide 22 — Stage 8: detect drift and fix it at the source

Stage eight keeps the statements true after cutover; without it, everything slowly decays. Two comparisons run on a schedule: HR against the directory, and the unit and role registry against the tenant. Every finding goes to the CISO and is fixed at the source, in the HR record or the rule, never in the copy, because the next cycle would just overwrite your fix. The callout is the one to act on today. Entra's logs don't last nearly as long as federal records rules require, and they aren't retroactive. Route them out from day one. Now, the limits.

## Slide 23 — Limits: administrative units

Administrative units are the delegation replacement, so their limits shape the whole delegation model. They don't nest, so the tree becomes a flat set, and a role covering several units gets one assignment per unit. They limit who can change members, not who can see them. Only some roles can be scoped to a unit. Dynamic units work in G C C, but not in G C C High or D O D, where an automation job has to keep them up. And restricting a unit takes its members out of governance automation, so restriction is a deliberate choice, default no. Next, Lifecycle Workflows.

## Slide 24 — Lifecycle Workflows: the pieces and the limits

Lifecycle Workflows carry joiner, mover and leaver, so it helps to know the pieces. A workflow has a trigger, a scope rule and a list of tasks. Custom task extensions call a Logic App to reach other systems. Scheduled runs happen on one tenant interval, every three hours by default. The limits are a hundred workflows, twenty-five tasks each and a hundred extensions. Two behaviors deserve the red box. Execution limits can quarantine a scheduled run that would touch too many people, but an on-demand run skips that guardrail, and it ignores the workflow's own conditions too. So what could break at our size?

## Slide 25 — Lifecycle Workflows at our scale: what could break

At an agency our size, the limits bite in predictable ways, and this is the program's design guidance for each. A workflow per organization runs out of a hundred fast, so build a few general workflows that branch on codes. Build one reusable Logic App per integration. Treat every on-demand run as a change with a second person, because it can disable the wrong ten people. Size execution limits so a reorganization gets quarantined until someone approves it. For urgent terminations, don't wait for the schedule: disable and revoke. And until PIV revoke and device retire are automated, keep a leaver checklist with owners. Next, what still needs AD.

## Slide 26 — What still needs AD during hybrid

Hybrid lasts longer than anyone plans, so it helps to name exactly what still needs Active Directory. Synced users' attributes are still written there. Kerberos applications need groups written back. D N S, D H C P and legacy apps keep the forest alive, and Windows logins to SQL Server skip Conditional Access. Hybrid-joined devices still need some domain policy. Moving a population's source of authority has firm entry checks, and whether that move works in G C C is still unverified. So retiring AD means clearing a list of named dependencies, not reaching a date. Here's the checklist.

## Slide 27 — The checklist, stage by stage

The checklist turns the nine stages into something you can tick off, and that's its whole purpose. There's one row per stage, plus PIV, and one each for the Intune, Arc and non-person tracks. A few are easy to miss. Export site links, not just O U links. Match accounts before the first full sync. Write every access rule on codes, and don't use member-of. Decide unit restriction before the unit exists. Pair every grant with a block. Prove seven days of sole-source changes before closing the ticket path. And route logs out from the first day. Finally, who decides.

## Slide 28 — Decisions, owners, and where to start

Every decision here has one owner, and that's what keeps the migration from stalling. Identity engineering owns the plumbing, the delegation model and each wave's go or no-go. The ICAM governance body owns the authority map and the person key. HR owns the codes, the data architect the schema, and application owners their own access rules and their service accounts' conversion. The CISO owns the controls and the drift findings. And you can start Monday without new tools: export the tree, name the HR feed early, populate the person key, remove other writers, and route your logs out. Make the attributes true, and keep them true. Thank you.
