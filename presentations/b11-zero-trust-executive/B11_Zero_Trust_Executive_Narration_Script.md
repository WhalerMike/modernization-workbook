# Book 11 — Zero Trust & Assessment — narration script (practice copy)

## Slide 1 — Who Decides Zero Trust for the Whole Agency?

This is the executive briefing for Book 11 of the Federal Modernization Workbook, Zero Trust and Assessment. It runs about thirty minutes, and it's built for the people who make the calls: the CISO, the authorizing officials, the CIO, and the Zero Trust implementation lead.

The book's argument fits in three sentences. Zero Trust maturity is a property of the whole agency, not of any product or tenant. The federal documents set specific actions and configurations, but none of them defines a Zero Trust score or requires a maturity stage. And the assessment tools produce evidence for named people to act on, not verdicts to report.

I'll take four questions in order: why Zero Trust belongs to the whole agency, what the mandates and the tools actually require, who owns the posture, and how to turn findings into a program the authorizing official can see. Every decision slide names the decision, its owner, and when it's needed.

## Slide 2 — Three reports stapled together are not one score

Start with the usual assessment calendar. The network team reviews the boundary, keyed by address. The cloud team runs each provider's posture scan, keyed by resource tags. The virtualization team works a hypervisor checklist, keyed by whatever the management plane calls a machine. At year end someone puts the three reports behind one cover page and calls the result the agency's Zero Trust maturity. It's three partial assessments with one title.

The failure is architectural, not organizational. A policy decision evaluates a subject, a device and a resource, and it can only do that consistently if every platform describes them the same way. A database server that runs as a virtual machine, sits on an agency subnet and backs up to a cloud bucket can appear as three unrelated objects, scored by three tools. A total across them counts objects, not architecture.

The federal guidance describes the enterprise, not a tenant. Executive Order 14028 defines zero trust architecture as working throughout all aspects of the infrastructure. M-22-09 asks for enterprise-managed identities and a complete inventory of every device the government operates. CISA's maturity model asks for agency-wide buy-in for a common architecture. And NIST SP 800-207 grants no implicit trust from network location or ownership.

A scan can confirm that an architecture is unified; it can't make it unified.

So the first decision: reconcile the network, every cloud and the virtualization estate to one authoritative asset and identity record before scoring any of them. The book gives that to the owner of the naming and identity plane, as a step for this quarter. Until it's done, report any whole-agency figure as partial assessments, not one score.

## Slide 3 — The worst failures sat beneath any one tool

Two documented incidents show why this is a security property and not a reporting preference.

In May and June 2023, an actor used a Microsoft consumer signing key to forge authentication tokens and read Exchange Online mail. The federal Cyber Safety Review Board counted 22 enterprise organizations and 503 related personal accounts, with access to some mailboxes for at least six weeks, and called the intrusion preventable. The tokens were valid to every system that checked them. What caught it was a custom alert one federal department had built on mailbox logs it paid for. The agency's own evidence found what the provider's platform didn't.

The second sits beneath the guest. In February 2023, the ESXiArgs campaign compromised more than 3,800 VMware ESXi servers by encrypting the configuration files of the virtual machines on each host. In 2024, CVE-2024-37085 gave full hypervisor control to members of a directory group named ESX Admins, matched by name rather than by security identifier. Microsoft noted that many security products have limited visibility into the hypervisor at all.

Both cases make the same point from opposite ends. The most consequential failures happened where no single platform's tool was looking.

And there's a consequence for the fix. Once one plane names and identifies everything the agency runs, it's a complete map of the attack surface. NIST already calls the policy engine and administrator the key components of the entire enterprise.

So the decision: govern the unified plane as a Tier 0 asset from the day it exists, with eligible, time-boxed administration, its own monitored telemetry, and a design that assumes it will be attacked directly. Identity engineering and the DNS and DDI team own it.

## Slide 4 — Maturity is decided by governance, which nobody sells

Chapter 02 explains why programs stall at the maturity model's Initial stage, or low in Advanced. They read CISA's Zero Trust Maturity Model as a five-pillar shopping list: identity, devices, networks, applications and workloads, and data. But the model runs those pillars through three cross-cutting capabilities: visibility and analytics, automation and orchestration, and governance. Governance is the one programs fund least, and the model defines it as the definition and enforcement of policy, within and across pillars.

Traditional reads like a failure list: siloed pillars of policy enforcement, and limited correlation of logs and telemetry. Advanced calls for cross-pillar coordination and policy enforcement integrated across pillars. No single pillar's tool delivers either.

Three failure patterns recur. Pillars are administered, not governed. Evidence is shaped by each tool rather than by the claim it supports, so every assessment starts from scratch. And drift is found at audit time, months after it opened.

The book answers with five principles. Identity is the anchor, but it isn't self-authenticating, so sessions are re-evaluated and the plane is defended. Privileged identity gets controls of its own. Evidence must be reproducible, machine-readable and regenerable. Governance must enforce, not only observe: a policy whose only consequence is next quarter's finding is a report. And the cloud boundary is modeled, with each government-cloud feature gap recorded as a governed finding.

The decision for the CISO, with identity engineering, this quarter: time-box privileged access, including the assessment accounts, and convert one detective control into a preventive one. Microsoft's own guidance is zero permanently active admin assignments, other than emergency accounts that are monitored and tested at least every 90 days.

## Slide 5 — Only one Zero Trust document sets requirements

Now, what the mandates actually require. Zero Trust programs are usually argued by citation, and most of the citations fail when you check them against the documents.

Four documents get cited as if they were one. Executive Order 14028, from May 2021, is binding, and required each agency to develop a plan to implement Zero Trust Architecture. OMB M-22-09, from January 2022, is binding and sets specific actions by pillar. CISA's Zero Trust Maturity Model, version 2.0, is guidance. It says it should not be viewed as a strict set of requirements but as a general guide, and CISA's page for it is now marked archived, with no later version. NIST SP 800-207 is guidance too: it supplies the tenets and the architecture the others assume.

The relationship runs one way. M-22-09 borrows the model's pillars to organize its actions; it doesn't adopt the model's stages as requirements.

That leaves several requirements that circulate but don't exist. Neither M-22-09 nor FedRAMP requires a particular maturity stage, such as Advanced. No federal document defines a Zero Trust score, so a tool whose output certifies maturity is citing a requirement that isn't there. M-22-09 doesn't require ScubaGear; that obligation comes from BOD 25-01. And inline decryption of all traffic is neither required nor prohibited.

None of that makes the target vague. It means the target is a choice the agency makes and has to defend.

So the decision: set a maturity target for each pillar, written down as program design, not as a mandate. In the book's responsibility matrix the Zero Trust program lead decides it, consulting the CIO, the CISO and the authorizing official, and it's needed before the next assessment is scored.

## Slide 6 — M-22-09 still binds: read it as an existing obligation

M-22-09 is the only one of the four that sets dated actions for the program itself, and it isn't limited to the cloud. It also addresses on-premises and hybrid systems.

By pillar, the actions are specific. Identity: centralized identity management, and phishing-resistant multi-factor authentication for staff, contractors and partners, which means agency systems stop supporting SMS and voice codes, one-time codes and push notifications for routine access. Devices: reliable asset inventories through CISA's Continuous Diagnostics and Mitigation program, and endpoint detection and response deployed widely. Networks: encrypted DNS, HTTPS for all web and API traffic, and a plan for environmental isolation, moving away from one broad enterprise network. Applications: dedicated security testing, a public vulnerability disclosure program, and at least one internal FISMA Moderate application made fully operational over the public internet. Data: initial automation of data categorization, and comprehensive logging.

Its fiscal 2024 deadlines have passed. OMB hasn't rescinded it: its memoranda index lists no rescission, and the memo is still published. A passed deadline doesn't retire an action. Agencies are now measured against these actions as an existing obligation rather than a target date.

There's one adjustment. The logging action points to M-21-31, which M-26-14 rescinded on May 22, 2026, replacing its tiers with a risk-based approach and a Logging Reference Architecture. CISA published that architecture on August 20, 2026, and the memo gives agencies 90 days from its release for their first Agency Logging Plan.

That's the decision with the nearest date. The CISO decides how the Agency Logging Plan covers Zero Trust telemetry, including the hosts and accounts that run the assessments. It's due 90 days after August 20, 2026.

## Slide 7 — BOD 25-01: six actions, and the half that matters

BOD 25-01 is narrower and more concrete. CISA issued it on December 17, 2024. It binds federal civilian agencies, for every production cloud tenant of a product with a finalized SCuBA baseline.

It has six required actions. Inventory the in-scope tenants, by February 21, 2025, and every year in the first quarter. Deploy the SCuBA assessment tools and begin reporting, by April 25, 2025. Implement the mandatory policies, by June 20, 2025. Implement later policy updates on CISA's timelines. Baseline every new tenant, and begin continuous monitoring, before its authorization to operate. And explain deviations with each report.

The mandatory list is a subset of the baselines. For Microsoft 365, CISA's Required Configurations page lists 50 policies; in Entra ID, that's 20 of the 30 in the current baseline. CISA's guidance limits scope to software as a service, so Azure subscriptions are out even when they share the tenant, and on-premises Active Directory, endpoints and networks are untouched.

Google Workspace is now in scope. Its tenant inventory is due November 2, 2026, and the tools by December 1. CISA's two pages disagree on the policy date, December 1 or December 31, so plan to December 1. Even a small tenant used by one component carries all six obligations.

Now count honestly. Inventory, deployment and explanations take days. Actions three to five are architecture, and they're what the directive exists for. So measure compliance by the substantive work: how many mandatory policies hold, and whether every open deviation is being fixed on a date or carried as the authorizing official's documented risk acceptance. The CISO owns the inventory and the reporting route, and the Workspace inventory is due November 2.

## Slide 8 — Reporting to CISA, and where deviations go

Reporting is where many agencies stopped, so it's worth being precise about what CISA actually receives.

The directive allows continuous integration with CISA's monitoring, or quarterly manual reporting, and CISA's implementation guidance describes four routes. CISA-hosted ScubaConnect, where CISA manages reporting after setup and results feed the CDM dashboard. Self-hosted ScubaConnect, where the agency runs it and keeps local copies. An agency-hosted integration, through CLAW or TALON, with automated scans at least once a quarter, which takes development work on the agency's side. Or manual upload to CyberScope, quarterly or more often, from the most recent version of the tool.

Whatever the route, the reported artifact is the tool's own results file, and agencies are told not to rename it. A deviation that's operationally required appears in the output as Omitted, with its rationale, and the guidance says omissions must be approved through the organization's security risk management process. CISA also supplies a template for tracking non-compliant policies, planned fixes and target dates. In effect, it's a plan of action and milestones.

The directive puts the risk decision in the right place. Authorizing officials may accept risk for deviations from the mandatory policies to meet operational needs, under agency policy, and CISA reviews and resolves what they submit.

Two decisions follow. The CISO picks the reporting route, and the assessment operators run it. Operators never edit results, and never decide omissions. And every deviation without an end date goes to the authorizing official, because a standing omission is a standing risk acceptance. The reporting floor is at least quarterly, so both are needed before the next quarterly report.

## Slide 9 — Two assessment tools, two questions, no verdict

Agencies run two free, read-only assessments of their Microsoft cloud, and often drop one because it covers identity. They answer different questions.

ScubaGear is CISA's tool. It asks a compliance question: does this Microsoft 365 tenant meet the federal baselines, including the BOD 25-01 mandatory policies? It's the tool the directive names, and its output is what CISA receives.

Microsoft's Zero Trust Assessment asks a maturity question: how close is the Microsoft cloud environment, across identity, devices, network and data, to Microsoft's Zero Trust guidance? Release 3.1.0, from October 20, 2026, holds 364 tests. It's a community project maintained by Microsoft employees, not an official product, and no Microsoft support program covers it. It isn't a BOD 25-01 tool.

They overlap mostly on Entra ID identity, and now on Defender threat policies. Only ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform, and 22 of the 50 mandatory policies sit in those four products. Dropping ScubaGear would leave mandatory policies unassessed and stop the reporting the directive requires. Dropping the Zero Trust Assessment leaves devices, network and data unmeasured against Microsoft's guidance.

Running both, fully, is still one vendor's answer about one vendor's platform. Neither sees another cloud, the network or the hypervisors. And neither closes a finding: a score is a reading, not a treatment plan. Both outputs are maps of where the tenant is weak, so they're handled as sensitive.

The decision belongs to the CISO: approve both tools, with pinned versions, for production tenants, and require their output to stay inside the authorization boundary, before the next production run. Expect the score to move when a version changes, even when the tenant didn't.

## Slide 10 — Beyond Microsoft 365, each tool answers for itself

Everything so far stops at the edge of Microsoft 365 and Google Workspace. Nothing on BOD 25-01's list covers infrastructure accounts, the agency network or the virtualized estate. So the whole-agency argument rests on the Zero Trust documents, and on the SP 800-53 controls every system security plan already asserts.

Three things get reconciled before those estates are assessed. One inventory: control CM-8 forbids duplicate accounting of components, and BOD 23-01 requires automated asset discovery every 7 days, including cloud virtual machines. One naming authority, because each cloud provider and VMware ships its own private DNS. And no implicit trust from any boundary: a site-to-site VPN, a default virtual network and a flat virtualized segment are architecturally the same mistake.

The hypervisor is a distinct threat class, so its management plane is assessed as its own surface, not inferred from the posture of the guests running on it.

Then the providers' own tools, each of which describes its own limits. AWS says its NIST standard supports a subset of requirements through automated checks. Microsoft says Azure Policy compliance is only a partial view of overall compliance. Broadcom calls its VMware hardening material general guidance whose assumptions may not hold in your environment. And FedRAMP certifies the cloud service offering, while each agency still authorizes its own systems, including the configuration it selected and the integrations it enabled.

The decision is the program lead's: admit each native tool's findings as evidence for its own platform, under the CISO's evidence standard, and never as the agency's score. It's needed before any whole-agency figure is reported.

## Slide 11 — Every pillar has an owner; the posture needs one too

Who owns it? Zero Trust programs rarely fail for lack of owners. They fail because every owner is a pillar owner. Nobody owns the question this book keeps asking: what is the agency's posture across all five pillars, and what does the number on the cover page actually measure?

The book's model separates deciding from doing. The CIO and executive sponsor set strategy, scope and funding, and break ties. Three CIO decisions matter here: which estates the whole-agency score covers, stated in writing so it can't quietly shrink to the estates that assess well; the sequence, since closing BOD 25-01 findings competes for the same engineers as every other deadline; and which team owns a control that spans pillars.

The Zero Trust program lead owns the posture: the definition of the score, cross-pillar correlation, the assessment calendar and the prioritized worklist. Many agencies will give this role to the implementation lead M-22-09 required them to designate within 30 days. The lead decides priority but doesn't accept risk, and shouldn't also own the agency's relationship with its largest cloud vendor. That independence is the point of the role.

The CISO sets the control requirements and the evidence standard, and approves the tools and the accounts that run them. The authorizing official accepts residual risk, approves each plan of action and milestones, and sets assessor independence. Most agencies have several, so the lead aggregates, and each official accepts risk only for the systems they authorize.

The decision is the CIO's, and the book puts it in this quarter: name an agency-level owner of the Zero Trust posture, and a cross-pillar correlation owner, separate from any cloud provider relationship.

## Slide 12 — Who owns each pillar, and three calls that go astray

Pillar by pillar, the book maps CISA's five pillars to the teams that own them after modernization. Identity engineering owns identity. Endpoint engineering owns devices. Network engineering, with security architecture, owns networks. Application owners, with the platform teams, own applications and workloads. And the data owners and the data office own data, the one pillar without a workbook book of its own yet.

More owners sit across them. The naming and identity plane belongs to identity engineering and the DNS and DDI team, governed as Tier 0. Each other cloud and the virtualization estate belongs to its platform team, reconciled to the plane. Security operations owns visibility and analytics. Pillar owners own automation, under gated change. And governance, the across-pillars part no pillar owner can deliver alone, sits with the program lead, together with the CISO and the authorizing official.

Pillar owners decide how to fix a finding. They don't decide that it doesn't need fixing.

Three calls often land on the wrong desk. First, an omission or incorrect-result marking with an expiration date is a CISO decision, recorded in the versioned configuration file. Second, one with no end date is a standing risk acceptance, and goes to the authorizing official, which matches BOD 25-01's assignment of deviation risk. Third, drift, a control that passed every interval and failed the last one, goes to the authorizing official too, because it's a change to an authorized system, and the official decides whether it's significant.

The decision for the CISO, this quarter: move every exception out of documents and into the configuration file and the repository, with an expiration, and route each standing one to the authorizing official.

## Slide 13 — Close before you assess: assessors run at step five

How do you get there? First, close before you assess.

Agencies met BOD 25-01's early dates: tenants inventoried, ScubaGear deployed and reporting. Many now treat that as the answer. But ScubaGear measures deviation from a baseline; it doesn't close any, and neither does the Zero Trust Assessment. A thermometer that reports a fever every day for a year isn't a treatment plan. Without an architecture to absorb the fix, remediation collapses into re-running the scan and filing another plan-of-action line.

So the program's six-phase sequence puts the assessors at step five, as confirmation rather than discovery: understand the gaps and their root causes, design the closure pattern, implement it, govern it with owners and plans, then validate, and then the authorizing official decides on the evidence. That's the Risk Management Framework's own order: implement, assess, authorize, monitor. BOD 25-01 says the same for new tenants: baseline first, then the authorization to operate.

Before validating, build the layers a finding depends on: naming, addressing and certificates; device and workload identity; a phased retirement of legacy authentication; and governed exceptions.

Not every finding waits for architecture. Route each one to exactly one response: a configuration change that closes now; architectural work with an owner and a target date; or a risk acceptance by the authorizing official, marked Omitted with a rationale. A finding with no response recorded is the only state the program treats as a failure.

This is the CIO's sequence decision: close the BOD 25-01 findings before the maturity assessment, and staff that order against the agency's other deadlines. It's needed before the maturity assessment is scheduled.

## Slide 14 — Read the result before you count it

Then the evidence. The two tools use different words for the same outcomes, and some of their outcomes aren't findings at all.

Only four results are findings: ScubaGear's Fail and Warning, and the Zero Trust Assessment's Failed and Investigate. A not-applicable result is usually a manual check for the pillar owner to verify by hand, not a pass. An error is absence of evidence: fix the run and re-run. And a skipped check isn't a gap and isn't a pass. The tool's own guide says missing prerequisites produce skipped checks, not evidence that the tenant meets a recommendation. Often the reason is a license, or a feature that isn't available or authorized in a government cloud. Scoring it as a failure overstates the gap; scoring it as a pass overstates the posture. So it's recorded as absence of evidence, with the reason, and it becomes a boundary finding.

The program then scores the real findings with a documented method: severity from 0 to 100, priority as severity over effort, and buckets from P1 down to P4. Quick wins go into the next change window. The method is the program's, not a federal standard, and a P1 is a priority, not a risk acceptance.

Last, reconcile at the control, not tool to tool. A ScubaGear failure and a Zero Trust Assessment failure on the same setting and the same SP 800-53 control are one finding with two pieces of evidence, routed to one pillar owner.

Underneath all of this sits the CISO's evidence standard: a pinned tool version, a recorded run time, an unaltered output file and a hash. It's needed before any result is scored or reported.

## Slide 15 — From findings to a program the AO can see

Now turn the worklist into a program the authorizing official can see.

Every finding that isn't fixed in the next change window and isn't covered by an approved exception becomes a plan of action and milestones item. SP 800-53 requires one for each system, updated from assessments and continuous monitoring, and the authorizing official approves it. Each item names the pillar owner, the control it bears on, the evidence that will show it closed, and the re-assessment that will test that evidence.

Behind those items, the program wraps each tool's unaltered output with its provenance and seals it into a bundle. Because the same inputs produce a byte-identical bundle, an assessor can rebuild it months later and walk back from a finding to the raw result without re-running the tool. That's the difference between an archived opinion and evidence.

Re-assessment runs on a calendar the program lead owns, and after each remediation wave, so a finding is closed by evidence, not by a ticket status. BOD 25-01's reporting routes set the floor for ScubaGear at quarterly. A Zero Trust Assessment score is compared across runs only on the same tool version, or after a review of what changed.

And drift goes to the authorizing official, not only to security operations. A control that passed every interval and failed the last one is a change to an authorized system. The book calls treating that drift as something the official sees the cheapest adoption step in its final chapter.

So the decision sits with the authorizing official: receive interval-to-interval drift findings, prepared by the program lead and security operations, every assessment interval, and decide which ones are significant changes. Stand it up this quarter.

## Slide 16 — Decisions to make this quarter, and who makes them

So, the decisions, with their owners. None of them is a procurement.

The CIO names an agency-level owner of the Zero Trust posture, and a cross-pillar correlation owner, separate from any cloud provider relationship, and puts the scope of the whole-agency score in writing.

The identity-plane owner reconciles the network, every cloud and the virtualization estate to one authoritative record before any of them is scored.

The program lead finds out, pillar by pillar, which evidence can be re-run without the operator's help, because every no marks the adoption boundary.

The CISO moves every exception into the configuration file, with an expiration; covers the assessment hosts and accounts in the Agency Logging Plan, due 90 days after August 20; brings any Google Workspace tenant into the inventory by November 2; and, with identity engineering, time-boxes privileged access and converts one detective control into a preventive one.

The program lead and security operations stand up drift detection, and the authorizing official receives its findings. And the system owner and ISSO record each government-cloud feature gap as a governed finding, rather than an unstated assumption.

Each is a structural step that compounds. Unify first, assess second, and let named people make the decisions the evidence supports. No tool, and no number of tools, certifies Zero Trust maturity. The Federal Modernization Workbook's Book 11 has the detail, with every claim footnoted. Thank you.
