# Book 10 — Cloud Boundary & Landing Zone — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Cloud Boundary & Landing Zone: the technical deep dive

Welcome. This is the technical deep dive for Book 10 of the Federal Modernization Workbook, Cloud Boundary and Landing Zone. It's for the cloud and platform engineers who build the landing zone, and the ISSOs who have to evidence what's in it. The whole book comes down to one idea: the license says what you bought, but the boundary says what you may use. Part 1 is about the boundary itself and what it quietly takes away. Part 2 is about building it into the landing zone and owning it in the authorization package. The code stays in the chapters. Let's start with why this bites so late.

## Slide 2 — Why this matters: the license is not the boundary

Here's the trap. Two agencies can hold the same license and get different products. The commercial tenant sees network scores per location, smart routing for its SD-WAN, and adoption reporting. The GCC tenant sees none of it, and nothing in the license or the price list warns you. Whether a feature is usable depends on three checks lining up: what FedRAMP certified, what the provider leaves out of your environment, and what your own authorizing official accepted. Teams usually find the gap during an authorization cycle, when it's expensive. So the rule is simple: no citation, no feature. Let's look at those three checks.

## Slide 3 — Module 1: Why the boundary decides

Module 1 builds the foundation. First, the three checks and who owns each one. Then why the gaps stay invisible, including a popular example that turns out to be mostly wrong. Then what FedRAMP's 2026 rules actually changed about the word boundary.

## Slide 4 — Three checks, three owners, one overlap you can use

Each check answers a different question, and none of them can stand in for the others. The Marketplace tells you what's certified, but not which features your environment switches off. The provider's notes tell you about features, but not whether your agency authorized the integration. And your own package covers your choices, but nothing outside the certified offering. Two highpoints. Agents you install on agency machines are outside FedRAMP entirely, so they're yours to assess. And impact level and features are different axes: the features missing in GCC are missing in GCC High too. Next, why nobody notices.

## Slide 5 — Why the boundary stays invisible, and a claim corrected

Why don't teams see it coming? The consoles are shared, each exclusion hides in one sentence on its own page, features change underneath you, and a missing signal just looks like a quiet day. But the correction matters just as much. A widely repeated example listed five features as missing from GCC. Checked against the documentation, only one actually is. The rest are GCC High gaps, or belong to Azure entirely. An unverified story sends you to build compensations you don't need. So only vendor-confirmed rows count. Now, a way to describe what changes across any boundary.

## Slide 6 — Four dimensions change across any boundary

The program's model says a boundary is any place where one of four things changes: which signals arrive, who an identity resolves to, who has to enforce a control, and whether a claim is still authoritative or only derived. That turns one boundary into one coherent story instead of a pile of findings. It also matters because FedRAMP's definitions exclude provider telemetry from federal customer data, so no certification promises you a signal. The answer is design guidance: probe what works, label substitutes as derived, and cite every row with a date. Next, FedRAMP's new rules.

## Slide 7 — FedRAMP 2026: services are certified; agencies authorize

FedRAMP changed its vocabulary in 2026, and the change is useful. Cloud services are now certified, in Classes A through D, and Class C covers the old Moderate baseline. The provider gets certified; your agency still authorizes its own system, and never issues a standalone ATO for a cloud service. Here's a telling detail. Because the rules ship as one machine-readable file, you can count the words. The phrase authorization boundary appears zero times. The only boundary the rules name is yours. Mandatory adoption starts January 2027. So what replaced the provider's boundary? Scope.

## Slide 8 — Minimum Assessment Scope: a data test, per resource

Scope is now a data question, not a network diagram. A resource is in the offering if it's likely to handle federal customer data or affect its security, wherever it sits. And security category can vary by resource, which undercuts a lot of "we can't have that, it would raise the whole environment" reasoning. Push back by asking which resource and which data. One caution: the agents and clients you install are outside FedRAMP altogether, so they land in your package. And providers have to publish what's in scope, though that's services, not features. Next, how change and evidence now flow.

## Slide 9 — Change is notified, not re-approved; data becomes a feed

Under the new rules, providers don't go back for approval when they change things. Routine changes need no notice at all, everyday changes are reported afterward, and big ones get announced weeks ahead, all in JSON. That means you can treat change notices as data and test each one against your own authorization. Certification evidence moves into trust centers with programmatic access, though only a small share of listings showed one in October 2026. And for years you'll hold old-style and new-style packages side by side. Read each in its own terms. That's Module 1.

## Slide 10 — Module 2: GCC, the gap and three responses

Module 2 gets specific about Microsoft 365 GCC: what it really is, what it verifiably loses, and what a High certification would and wouldn't change. Then the playbook for a missing capability, and the option of changing the collaboration suite itself.

## Slide 11 — GCC is the worldwide service minus a published list

The common picture of GCC is a fence around the commercial service. Microsoft's own documentation describes something else: the worldwide service, on the same endpoints, with a list of specific features left out. That's good news, because a list can be read, argued and worked one line at a time, while a fence can only be accepted or left. And the list isn't a ladder. Some features reach GCC and stop there. One honest wrinkle: the Marketplace says GCC rides on Azure Government infrastructure. Cite both statements and paraphrase neither. So what does GCC actually lose?

## Slide 12 — The largest documented loss: network observability

The biggest documented loss isn't a telemetry detail. It's the whole network connectivity layer in the admin center: scores per location, insights like spotting TLS interception, and attribution of performance to named network providers. A commercial agency compares its SASE and transport options from a dashboard. A GCC agency gets none of that. Some measurement survives: the connectivity test tool still works in GCC, run from each location. But the practical message is budget. If you need comparative network evidence, you'll be funding the measurement yourself. Next, the question everyone asks about High.

## Slide 13 — Three packages, and why High won't bring features back

The Marketplace shows three Microsoft 365 government packages, and a new one stands out: a package with the same name as GCC, now pursuing High. The fact is the listing. The reading, that it's a High effort for GCC, is inference, so ask the provider rather than planning around it. Here's the key point. A higher class changes what data you can put in the service. It doesn't bring excluded features back. Network connectivity is already missing in GCC High, which is certified High today. So never wait on a class for a feature. Next, what to do instead.

## Slide 14 — Work the gap as a list: register, probe, equivalent

Start with a register, not an argument. One row per feature, each with the provider's own sentence and a date, because a citation can't be dismissed and an inference can. Then probe your own tenant, and test for output, not for whether a switch turns on, because the failure here is a report that never fills in. Where there's a gap, build an in-boundary equivalent and say plainly that it's derived. Scheduled network tests from each location close part of the network gap, not all of it, and the row should say so. Some gaps have no equivalent. That's next.

## Slide 15 — Exceptions, scope arguments and buying the capability

When there's no equivalent, you take an exception, and there are two kinds. The provider's own path, like ExpressRoute for Microsoft 365, wants a regulation that mandates it, quoted with a link, and FedRAMP alone isn't one. Or your authorizing official accepts the risk in writing, with an end date, so permanent is a decision someone repeats. The new rules also give you real arguments, each with a limit worth knowing before you use it. And in acquisitions, specify the capability, not a program badge, because some programs are closed. Then there's the third answer: change the service.

## Slide 16 — Change the suite, keep the identity plane

Sometimes the honest answer is a different collaboration suite. That's only safe if identity stays where it is: the suite is a workload that consumes identity, not a second source of truth. Read the certification, not the press release, because announcements and listings don't always match. The public record shows both outcomes: one department moved fifty thousand people on a steep temporary discount, and another dropped licenses almost nobody used. Keep Entra ID provisioning and federating sign-in, watch the admin accounts that skip it, and treat stray edits in the second directory as drift. That's Part 1.

## Slide 17 — Module 3: Landing zone and front door

Part 2 starts with the landing zone, where the boundary becomes something the platform actually enforces. We'll cover policy, AWS and GovCloud, the address plan, network as code, and the front door every change has to pass through.

## Slide 18 — The hierarchy is where boundary policy lands

If the boundary says a service is out of scope but the landing zone lets a team deploy it anyway, the boundary is just a document. The management group hierarchy is where it becomes a control. Boundary policy goes on an intermediate root, and every subscription beneath inherits it. Keep the tree flat, separate environments by subscription so test faces the same rules as production, and protect the hierarchy so new subscriptions can't land outside it. One trap for Azure Government teams: Microsoft's accelerators only run unmodified in public Azure. Next, the policies themselves.

## Slide 19 — Five boundary decisions, five enforced mechanisms

Every line in the package's boundary description should have a mechanism behind it: which cloud, which regions, which services, which settings, and which exceptions. The fine print matters. The built-in allowed-types policy skips some resource types unless you copy it and change its mode. And the FedRAMP compliance initiative is, in Microsoft's own words, only a partial view. The rollout is the real lesson: audit first, review with the system owner and ISSO, fix or exempt, and only then deny. Block production on day one and teams learn to ask for exemptions. Next, the same idea on AWS.

## Slide 20 — AWS, GovCloud and automation that declares its boundary

AWS gets to the same place with accounts, organizational units and service control policies, but GovCloud works differently enough that you have to plan for it, not discover it. Accounts are created in pairs from the commercial side, and some factory features simply aren't there. And GovCloud isn't only for High. A Moderate system can run there or in the commercial Regions, and an agency can use both, so check each service, Region by Region. The other half of this slide is about your own automation. A collector calling a commercial-only API from inside the boundary is a crossing nobody approved. So every adapter declares its boundary, resolves endpoints from it, and fails closed when it doesn't recognize the cloud. Next, the address plan.

## Slide 21 — The address plan: the denominator every inventory needs

An inventory needs a denominator. A scan tells you what answered during a window; the address plan tells you what was handed out. Reconcile the two, or your scan is just a sample. That's why the program treats IP address management as the join key everything else correlates on. But it isn't the boundary, and it isn't the asset record: it can't see software, owners or classification, so a configuration database carries those. And because cloud fabrics hand out addresses with no broadcast, the plan has to live above all of them. Next, how Azure mirrors it.

## Slide 22 — Mirror the authority, enforce the pool

The enterprise address authority stays in charge, and Azure mirrors it. Reserve the range in the enterprise system first, mirror it into Azure's pools with outside ranges blocked off, and use a deny policy so no virtual network exists without a pool allocation. Then reconcile, and treat any mismatch as a finding. And here's the book's argument in miniature: the Azure pool service isn't named in Microsoft's FedRAMP scope tables. So until that's confirmed in writing, record it as a dependency and choose a path deliberately. Next, building the network from code.

## Slide 23 — Network as code: five modules in dependency order

The network gets built from reviewed source as five modules, each owning one plane and depending only on the layers below it: platform, address plan, naming, network, and the enforcement edge. Naming mechanisms rather than products is the point, because changing vendors should change syntax, not the design. And some inputs change underneath your code. Microsoft's endpoint list is the classic case, and GCC uses the worldwide list, so blocking commercial endpoints would block GCC itself. Pull that list on a schedule and apply it through the pipeline. Which raises the question of who gets to run that pipeline.

## Slide 24 — The front door: six steps from request to closed change

Code that anyone with credentials can apply is just a click path with extra steps. It becomes change control only behind a front door: request, approve, plan, apply, reconcile, close. Each step leaves evidence for a named control, and the requester can never approve their own change. The step that carries the most weight is reconcile. An address block the code allocated but nobody recorded is shadow inventory the moment it exists. So the pipeline writes the allocation back, with the request number and owner, and fails the run on any mismatch. Next, how to build it.

## Slide 25 — Building the loop, and why the pipeline is in scope

There are documented ways to build this loop on ServiceNow and Terraform, and whichever you choose, the approver has to see the actual plan that will run. The bigger point is that the pipeline itself is inside the boundary. Terraform state and plans hold secrets, even ones marked sensitive, so where the runner, the state and the repository live is a boundary decision, not a tooling preference. The program's default is a self-hosted runner and state inside the boundary. And after apply, drift goes back through the same front door. That's Module 3.

## Slide 26 — Module 4: Who owns it, and the package

Module 4 is about people and paper: who decides each boundary question, and how the boundary gets written once into the authorization package, kept current, and backed by the right questions to the provider.

## Slide 27 — One decider per row: who owns the boundary

Most boundary failures aren't engineering errors. They're decisions nobody owned: a feature designed in before anyone checked it, a workload placed in an unrecorded subscription, a provider notice nobody read. So name one decider per row. The authorizing official decides the boundary, and that can't be delegated. The system owner decides placement, not the platform team, because vending an unrecorded subscription is the cheapest way to make an authorized system unauthorized. And acquisition matters more than people expect: the SKU you buy decides whether the certification even covers you. Next, the record.

## Slide 28 — The boundary record: write it once, cite it everywhere

Your agency never authorizes a cloud service. It authorizes its own system that uses one. So your package covers only what you implement, configure, operate or inherit, and you never paste the provider's control text into it. The program's answer is a single boundary record: what's in scope, what the probe found, the gaps, the equivalents and the exceptions. Everything else cites it, so when a capability changes, one record changes and every narrative stays current. Information exchanges are where most crossings live. Next, how to write the narratives.

## Slide 29 — Narratives at the boundary, and whose package you read

Most controls aren't touched by the boundary. The ones that are fall into four patterns, and naming the pattern lets an assessor follow you. The hard one is compensating. Don't describe the missing feature as if you had it, and don't hide the substitute either. Say what the control needs, what's unavailable with the citation, what you run instead and what it misses, and where the remaining gap is recorded. Also know whose package you're reading: GCC inherits from Azure Government, so your chain runs through two packages, plus the SKU. Next, keeping it current.

## Slide 30 — Keeping the package current: one review, one decider

A package describes the system on the day it was signed, and the boundary keeps moving. Three inputs feed one review: provider change notices, ongoing certification reports, and your own probe and drift findings. Each gets one question: does this change a disposition, an equivalent or an exception? If it might change your risk, it goes to the authorizing official, who decides whether it's a significant change. A provider removing a capability your narrative depends on is exactly that. The table is what an assessor should be able to find. Next, what to ask providers.

## Slide 31 — What to ask a cloud provider for, with the basis

Asking for commercial parity can't be answered. A specific question tied to a published rule or exclusion can. So name the item, cite the basis, and ask for data rather than documents. The eight requests on the slide follow that pattern, and most of them rest on obligations the 2026 rules already place on providers, like trust center access and machine-readable change notices. Microsoft's own exception process sets the standard you can hold it to. Record every request, its date and the answer in your package, because a documented no is evidence too. Let's close with decisions.

## Slide 32 — Decisions to make, and the first week's work

Six decisions, each with an owner, and two matter most. The authorizing official settles the boundary before workloads arrive, because discovering it later is expensive. And every gap gets a deliberate response, recorded. You can start this week without buying anything: re-cite your gap list, read each service's Marketplace class with the date, put allowed regions in audit, and name someone to read provider notices. The license says what you bought; the boundary says what you may use. Write it down once, cite it everywhere, keep it current. The book has the detail, every claim footnoted. Thank you.
