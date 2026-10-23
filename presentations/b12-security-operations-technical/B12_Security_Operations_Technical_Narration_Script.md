# Book 12 — Security Operations & Telemetry — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Security Operations: the technical deep dive

Welcome. This is the technical deep dive for Book 12 of the Federal Modernization Workbook, Security Operations and Telemetry. It's for the people who build and run the SOC: detection engineers, SOC engineers and security architects. The whole book comes down to one idea. You can't defend what you can't see, and a finding only closes when the thing is actually fixed, with proof. Part 1 is about getting evidence to arrive and turning it into detections. Part 2 is about the findings that pile up, and who acts on them. The code lives in the chapters; I'll stick to what matters. Let's start with why this is harder than it looks.

## Slide 2 — Why this matters: a coverage gap looks like quiet

Here's the uncomfortable part. Every dashboard you own measures what arrived. Nothing measures what didn't. A source that was never connected, a connector that looks green but isn't delivering, data parked where no rule can run, or logging an attacker switched off: all four look exactly like a quiet day. And the federal yardstick has moved with this. The new logging memo scores agencies on how much of their baseline produces real alerts, not on how much they store. So visibility has to be designed, plane by plane, and checked against what you expected to see. That's what Module 1 builds.

## Slide 3 — Module 1: The evidence contract and identity

Module 1 is the foundation. First, one record shape that every tool agrees to, so findings from different stacks can actually be joined. Then we apply it to identity, where the default quietly throws history away after a month.

## Slide 4 — The evidence contract: eight fields, every source

Five tools can't give you one compliance picture just by sharing a dashboard. They have to agree, ahead of time, on what a record says. That's the evidence contract: eight fields every source emits, covering what NIST already asks an audit record to establish, plus which control it proves, whether it passed, and whether it's closed. That last field matters most, because it's where closure lives. Microsoft's normalization model gets you part of the way, but it can't tell you which real asset a record is about. And that turns out to be the hard part, so let's look at it.

## Slide 5 — The join key: naming-plane identity plus observed time

Two records only describe the same server if they carry the same identity, and every tool has its own. So the join key can't come from any one tool. It comes from the naming plane, your authoritative inventory of names and addresses. Time is the other half, and it's easier to get wrong than it sounds: join on when data arrived instead of when it was observed, and you match the wrong records without a single error. One caution worth knowing: the fully correlated trail is a High-baseline control, so at Moderate the program chooses it on purpose. Next, where all these records go.

## Slide 6 — One queue for every finding, and what closes it

A missing patch, a drifted setting, an exposed storage account and a labeled file leaving the agency are all the same kind of statement as a threat alert: this asset isn't in the state it should be. So they all go in one queue. Two lessons here. Queue membership can change underneath you; a vendor default recently moved data loss alerts out of the incident queue without anything failing. And only two things close a record: a later observation showing the fix, or the authorizing official accepting the risk. Now, identity.

## Slide 7 — Entra ID: categories, tables and the tiers to enable

Identity looks instrumented out of the box, which is exactly the trap. Entra keeps its own sign-in and audit history for about a month, and once it's gone, no license brings it back. The fix is one tenant-level setting that streams the logs out. The detail that bites people is that the category you tick isn't always the table you query. The big decision is to treat all four sign-in streams as core, because the non-interactive ones are where unattended credentials do their work. Manage the cost with table plans, never by switching a stream off. Next, how to deploy it properly.

## Slide 8 — Deploy from code; set retention in the workspace

A setting someone clicked once has no history, no review and no drift check. So the program deploys this one from code, and keeps its list of logged categories in the repository as the record. Then retention. Here's a trap that catches a lot of templates: the retention field on a diagnostic setting no longer does anything at all. Retention is set per table in the workspace, at least six months searchable and a year retrievable, to meet the logging memo. Of course, a setting that saved isn't proof anything is arriving. That's next.

## Slide 9 — Prove emission, and use Graph as a magnifying glass

Saving a setting proves nothing. So the program runs a completeness check a day after any change, again at three days, and then daily, against a named list of the tables it expects. The result to fear is stale: it worked, then stopped, and old data hides the gap. Microsoft Graph is useful here, but as a magnifying glass for one specific question, not as a feed. And watch one silent trap: without the right permission, sign-in records quietly drop their Conditional Access results. That's identity. Module 2 moves to the platform and the mailbox.

## Slide 10 — Module 2: Platform telemetry to detection

Module 2 covers the two planes the identity setting never touches, Azure resources and the Microsoft 365 audit log. Then it asks the real question: what turns all this stored data into detections someone can show?

## Slide 11 — Azure: the activity log and resource logs

Azure has two planes, and they behave very differently. The activity log is on by default and records who created and changed things, but it's deleted after ninety days unless you export it. Resource logs, what actually happened inside a key vault or a database, aren't collected at all until each resource gets its own setting. The engineering choice that pays off later is sending them to dedicated tables. The shared table runs out of columns, and when it does, a detection rule silently stops matching. So how do you keep every new resource emitting? Policy.

## Slide 12 — Azure Policy keeps new resources emitting, not old ones

Azure Policy can make logging a property of the platform, so new resources are never born silent. But here's what catches teams out. The policy fixes new and changed resources automatically, and for everything that already existed, it only marks them non-compliant. Nothing gets deployed until someone runs a remediation task. So the dashboard trends green while the old estate stays dark. The program's habit is simple: assign, run the remediation, then compare the compliant count against the inventory. That comparison is the real coverage number. Next, the Microsoft 365 audit log.

## Slide 13 — The unified audit log: verify, collect, deduplicate

The Microsoft 365 audit log is the plane most often assumed and least often checked. Verify it's actually on, and do it in the right PowerShell session, because the other one always says off. Collecting it through Microsoft's API has a few rules that break almost every first attempt: patience when you subscribe, a seven-day window to fetch content, events that arrive out of order, and duplicates by design. So the collector tracks what it's fetched, deduplicates, and looks back over a trailing window every run. Then there's how long Microsoft keeps it.

## Slide 14 — Unified audit retention follows the user's license

This one surprises people. How long a Microsoft 365 audit record survives depends on the license of the person who did the thing, not on the tenant. Fully licensed users get a year for the core workloads; everyone else, including every guest, gets six months. Most federal tenants are mixed, so they have a split retention horizon that no dashboard shows. The program's answer is to stop treating that tier as the evidence store. Collect everything into your own workspace, set retention there, and write the license split into the security plan. Now, what do we do with all this data?

## Slide 15 — From warehouse to detection: the MTTD floor

Here's the heart of the book. A place where logs are kept isn't the same as a capability that reads them. A workspace with no rules can prove storage; it can't prove analysis. So the program's rule is that no source counts as monitored until an enabled rule reads it and someone owns what it raises. The rule types also set a floor on how fast you can possibly detect anything. And get ready for the assessor's favorite request: show me an alert from last month, and what you did about it. Next, how the data gets in.

## Slide 16 — Connector paths, and the table each one lands in

Every source reaches Sentinel by its own path and lands in its own table, and each path has one gotcha worth knowing. Appliances like DNS and SASE come through a forwarder that stamps its own time, which matters when you join on time. Write DNS rules against the normalized parser, so they survive a vendor change. And plan in the Defender portal, because that's the only place Sentinel will be supported after March 2027. In the government clouds, check each connector in your own portal before you design on it. But how do you know a connector's still working?

## Slide 17 — Prove connectors deliver; split the work with XDR

A connector that silently stops is worse than one you never set up, because you believe you're covered. Microsoft's health table only covers some connectors, so the program checks the data itself: when did each table last hear something, and is that longer than it should be? Make that check a rule, so a quiet source opens an incident. Then divide the work with Defender XDR. Let Defender detect what its own sensors see, and point Sentinel at everything Defender can't. That's Part 1. Part 2 starts with vulnerabilities.

## Slide 18 — Module 3: Vulnerability, patch and posture

Module 3 is about findings and the clock. A vulnerability program is judged on one record: which flaw, which asset, found when, due when, fixed when. We'll see the new federal clock, hand the work to the platforms that can fix it, and finish in the cloud control plane.

## Slide 19 — BOD 26-04: four questions set the remediation clock

In June 2026, CISA replaced the old severity buckets with a smarter clock. Four questions about each vulnerable asset set the deadline: is it exposed to the internet, is the flaw being exploited, can the attack be automated, and how much control does it give an attacker. The answers range from three days, plus a forensic check, down to fix it at the next upgrade. Two points to hold onto. The clock starts at the earliest moment, and there are no waivers. By December, every externally reachable asset needs an exposure tag. So, how do you run that daily?

## Slide 20 — The daily queue: inputs, defaults and the record

The daily job joins four things: what the scanner found, CISA's list of exploited flaws, CISA's data on automation and impact, and your own exposure tags. Two design choices make it trustworthy. When data is missing, the program assumes the stricter answer. And it remembers when each finding was first seen, because recalculating that every morning quietly resets every clock. Report how many findings closed on time and how many are past due, never a percentage of the open queue, which improves every time new findings arrive. Next, proving the scanner sees everything.

## Slide 21 — Defender Vulnerability Management: prove the coverage

The scanner choice comes down to one property: the sensor follows the inventory. Enroll a server in Azure Arc, in a covered subscription, and it's scanned. But enrollment isn't coverage. An extension can fail, a sensor can go unhealthy, so the program checks daily that every enrolled server is actually reporting, and treats any gap as a finding. And lifecycle sets a hard edge: a server whose security updates have ended can still be scanned, but nothing can fix it. That's a decision for the authorizing official, not a row that ages forever. Now, who actually does the fixing?

## Slide 22 — Actuation is platform-native; governance is unified

Only the platform that runs a workload can fix it. So the program lets each platform patch with the tools its support model expects, in every cloud and on premises. What's unified is the record every one of them sends back, keyed to the same asset identity. One thing no single tool can reach is the hypervisor and firmware layer, so don't let an overlay promise otherwise. And remember, a finding closes only when both halves agree: the platform says what it applied, and a later scan no longer sees the flaw. Patching is half the job. Configuration is the other.

## Slide 23 — Baselines that record their own drift

A patch that drifts back out of its hardened settings hasn't stayed fixed. So baselines are written as code, rolled out in audit mode first, and every drift becomes a record. There's one setting worth knowing well. Azure's auto-correct mode fixes drift silently, and Microsoft says it can't report that the drift ever happened. That means an attacker's change can be quietly undone and leave no trace. So use auto-correct only for low-risk settings, and keep visible drift wherever you need the evidence. And a server that drops out of the report isn't clean; it's a gap. Next, the cloud itself.

## Slide 24 — Cloud posture: owned tool first, then one queue

A public storage bucket has no missing patch, so no scanner will ever flag it. Cloud posture tools read the cloud's own settings instead. The program's rule for choosing them is practical: where you already own a platform's native tool, it's primary for that platform, and a coordinating tool earns its role only where it actually reaches. Check every listing against the FedRAMP Marketplace, not memory, and know the gaps, like no Oracle coverage from Microsoft's tool. For containers, enforce at the gate: refuse the privileged or unscanned workload before it ever runs. Module 4 turns to data.

## Slide 25 — Module 4: Data protection and who runs it

Module 4 closes the book with two questions. What is actually in the file? And who decides what the security team sees, keeps and lets go?

## Slide 26 — CUI to sensitivity labels: the Registry decides

Network and identity controls can all pass while a sensitive file walks out the door, because nothing said what the file was. A sensitivity label supplies that signal, and other tools can read it. The federal rules are simpler than people think: there are only two levels, Basic and Specified, and the CUI Registry decides which applies, not how sensitive something feels. Privacy Act records, for example, are Basic, while taxpayer information is Specified. The program maps those levels to labels, encrypts to groups rather than people, and deploys the whole set as code. Then the labels have to be enforced.

## Slide 27 — DLP on three surfaces, simulated before enforced

Labels only matter if something acts on them. Data loss prevention acts in three places: inside the Microsoft 365 services, on the device, and at the cloud session. The program's minimum set of policies is on the slide. The rollout discipline is the part to copy. Every policy starts in simulation, measured against real content, because a false-positive storm that stamps CUI on routine files becomes an agency-wide help desk event. And once enforcement starts, watch the people who keep overriding it. Next, the encryption keys behind all this.

## Slide 28 — Three meanings of customer-managed key

When someone says bring your own key, ask which one, because in Microsoft 365 it means three different things. One protects every encrypted label at the root. One encrypts the services at rest. And one, double key encryption, protects only the content you choose, at the cost of search, eDiscovery and co-authoring for that content. The program uses that last one only for the narrowest categories. One operational trap: Customer Key keys must never expire, so a rotation policy that sets an expiry date can take Microsoft 365 down. Which brings us to people, and who decides.

## Slide 29 — Who runs security operations: decide, do, consult

Most agencies can name their SOC. Fewer can say who decided a log source is collected, or who accepted the risk when it went quiet. In practice it's whoever holds the console. The book separates three things: who decides, who does the work, and who's consulted. The CIO decides scope and funding. The CISO sets the requirements. Only the authorizing official accepts risk, including the risk of not seeing. And the SOC runs the queue and owns the one-hour notice to CISA. Let's look at the decisions that matter most.

## Slide 30 — The responsibility matrix: rows that narrow visibility

These are the decisions that quietly shrink what the agency can see, each with one owner. The pattern to notice is that the person who can make a change is rarely the person who should decide it. Lowering retention looks like a slider, but it's a records decision. Silencing a noisy rule with an end date is the CISO's call; silencing it forever is a risk acceptance for the authorizing official. And a playbook that disables accounts needs approval before it ever runs. Next, how roles and separations keep the evidence honest.

## Slide 31 — Owners, roles and separations that keep evidence honest

Every rule and playbook gets exactly one named owner, with a test and a review date, so a silent table can be traced to the rules it blinds. Each team gets the least access it needs, with powerful roles activated only when needed. And because security operations keeps the record of what everyone else did, its own separations matter most. Nobody quietly shortens the record. Platform owners can't silence their own logs. The SOC doesn't assess itself. And a contractor can prepare a risk acceptance, but never sign it. Let's close with the decisions.

## Slide 32 — Decisions to make, and what to run on Monday

So here are the decisions, each with an owner. Name what must emit and check it against what arrives. Build the naming plane before the evidence pipeline. Tag every exposed asset before December. Decide your key strategy before labels encrypt anything. And send every blind spot to the authorizing official with an end date. The good news is that the first steps cost nothing: run the checks from this session on Monday, and put an owner on every rule. You can't defend what you can't see, and a finding closes only when it's fixed, with proof. Thank you.
