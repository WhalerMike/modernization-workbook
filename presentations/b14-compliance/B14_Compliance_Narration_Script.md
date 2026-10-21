# Book 14 — Federal Compliance & Authorization — narration script (practice copy)

## Slide 1 — Can Your Authorization Prove Itself?

This briefing comes from Book 14 of the Federal Modernization Workbook, Federal Compliance and Authorization. It's written for authorizing officials, information system security officers and C I Os.

I'll take four questions: why every control needs proof rather than a promise, and what the federal clock now asks for; what the baseline, the closure rule and the agency-level control families require; who owns compliance; and how to build the authorization package and keep it current.

The short version: a control is closed when the thing that closes it is running and the record shows it working. Everything else is a promise, and promises age.

## Slide 2 — Who owes which proof

Federal compliance is usually described as a list of obligations. What an authorizing official needs is narrower: to know that each control is working today, and to be able to show anyone who asks how they know.

That's the difference between a promise and proof. A promise is a statement in the security plan, backed by evidence someone gathered by hand for the last assessment. It was true the day it was signed, and it has been aging since. Proof is a record the system itself produces, which another reviewer can check again and get the same answer.

So start by asking who owes which proof. The cloud provider proves its service under FedRAMP's 2026 rules. The agency proves its own system and its side of the boundary: its configuration, identities, data and integrations. FedRAMP is plain that each agency still authorizes its own systems, and should never issue a standalone authorization for a cloud service. OMB's M-24-15 gives a provider's package a presumption of adequacy, but the authorizing official must still issue an authorization. And only that official decides whether the remaining risk is acceptable.

## Slide 3 — The federal clock: the dates still ahead

The dates that drive this work belong to FedRAMP, CISA and OMB, and each binds a different party. Every date here was checked against its issuing document on October 21, 2026. Where a document gives a period rather than a date, the date is counted from it.

The nearest is OMB's M-26-15: each agency's post-quantum migration plan is due within 120 days, which is October 22, 2026. The same memorandum sets TLS 1.3 support by January 2, 2030, and mitigation of as much quantum risk as feasible by the end of 2030. Under M-26-14, on logging, the Agency Logging Plan falls on November 18. On December 7, CISA's BOD 26-04 holds agencies to its remediation timelines, and FedRAMP's vulnerability rules become mandatory for providers. FedRAMP's 2026 rules take mandatory effect on January 1, 2027, and listed end-of-support edge devices must be out by February 5.

Some things moved. M-26-05 made software bills of materials and attestation forms contract choices, but kept the software and hardware inventory. So keep one dated register, and re-verify it at every gate.

## Slide 4 — Moderate: two facts, not one

Most civilian cloud systems are authorized at Moderate, and the word does real work. Under FIPS 199, the agency rates the impact of losing confidentiality, integrity and availability for each kind of information. FIPS 200 takes the high-water mark: at least one objective at moderate and none at high makes a moderate system. The agency then selects and tailors NIST's Moderate baseline, which in the current release holds 287 controls and enhancements. That's the size of the promise a Moderate system makes.

FedRAMP's Class C is a separate fact. It includes the current Moderate baseline, but FedRAMP lists 322 controls and enhancements for it, 36 of them outside NIST's Moderate baseline. Automated access enforcement for changes, for example, is NIST High only, yet FedRAMP lists it for Class C. Non-repudiation is High only on both lists.

So cite the two separately. A Moderate system built on a Class C service inherits the provider's evidence for the provider's side. It still has to prove its own side, against its own tailored baseline.

## Slide 5 — A control closes only with its proof

Is a control closed? A program that can't answer precisely answers loosely: the product was bought, the vendor announced the feature, the ticket was marked complete. None of those is the control operating.

The book applies two tests, in order. First, the mechanism exists: the thing that closes the control is deployed, running, and reaches the part of the estate the control covers. A purchase order, an ended pilot or a roadmap fails. Second, its proof is recorded: the closure carries a machine-readable verification, a time, and the identity of what checked it.

A control that fails the first test is open, and belongs in the plan of action with a milestone. One that passes the first but fails the second is worse: it looks closed and can't be shown to be. A person clicking complete is an exception, flagged and counted separately, and reports are derived from closure records, never compiled.

And a vendor roadmap is not a commitment. Date every claim, confirm it before a plan or contract rests on it, and write the capability into the contract.

## Slide 6 — Program management: the agency's, never the provider's

Some control families no cloud provider can close for you. The first is program management. NIST marks the whole family as deployed organization-wide, outside the system baselines and independent of impact level, and FedRAMP lists no class for any of its 37 controls and enhancements. The obligation comes from FISMA and OMB's Circular A-130, and it binds the agency whether or not it uses a single cloud service.

No resolver, overlay or enforcement point can write an organization's risk tolerance or appoint its senior official. These controls close when the artifact exists, a named official has approved it, and the agency can show it is still followed: the security program plan, the appointed senior agency information security officer, a risk strategy with a signed tolerance statement, a process that keeps every system's plan of action comparable, and one organization-wide monitoring strategy.

One distinction matters to an assessor. The program inventory lists systems; each system's component inventory lists what's inside it. The two must agree.

## Slide 7 — Contingency and supply chain close through governance

Two more families close through governance rather than technology. Contingency planning asks for a plan, not a capability. An agency can have tested failover, two circuits and good backups, and still carry an open contingency plan finding, because nothing says who declares a contingency, who is told, what comes back first, or when operations are back to normal. The business impact analysis sets the numbers, and the mission owner, not the database administrator, sets the maximum tolerable downtime. For a Moderate system, NIST's contingency guide recommends a functional exercise with a restore from backup, not just a tabletop.

Supply chain moved this year. M-26-05 rescinded the secure-development attestation mandate. The software and hardware inventory is still required; software bills of materials are now a contract choice, and for a cloud platform the one to ask for covers the runtime production environment. Even so, a supply chain policy, plan, controls, acquisition terms and notification agreements are in every NIST baseline. And FedRAMP's vulnerability rules bind providers; the agency reads their reports into its own plan of action.

## Slide 8 — Privacy and training close by records, not settings

Privacy and training are the agency's, end to end. NIST's privacy baseline applies whatever the impact level, so a Low system holding the same personal information carries the same privacy controls. No privacy control carries a FedRAMP class, and none of the 2026 indicator themes is about privacy. The controls ask by what authority the agency collects the information, for what purpose, whether it told the person, and whether it published the system of records notice. The senior agency official for privacy approves the privacy plan before authorization.

Training is the one family no configuration can close. OMB's Circular A-130 requires training before access, and OPM's rule sets an annual floor for awareness. Social engineering awareness is required at Moderate; phishing exercises are optional, tailored in by choice. A dashboard showing 98 percent completion is a number with no denominator. The proof is counts per population, measured against a stated roster, which someone who didn't produce them can re-derive.

## Slide 9 — One owner for every step

Ask who owns compliance and the answer is often the security office, which means nobody in particular. The Risk Management Framework names an owner for every task.

The system owner owns more of those tasks than any other role: categorizing, selecting and implementing controls, remediating findings, keeping the plan of action, and assembling the package. The CISO sets control requirements and the common controls that systems inherit, and reviews providers' quarterly reports or names a delegate. The privacy official approves the categorization and the privacy plan of any system with personal information.

The authorizing official is the only official who can accept the risk, and that acceptance can't be delegated. The official, or the designated representative, also approves the categorization, the plans and the assessment plan, and selects the assessor, before the assessment starts.

Six roles are government-only, among them the authorizing official, the C I O and the CISO. A contractor-heavy team can prepare every plan and package, but can't sign those decisions. And keep the roles apart: nobody assesses their own work, and the authorizing official isn't the system owner.

## Slide 10 — The package: four linked, machine-readable records

The authorizing official doesn't read the evidence directly. They read a package that summarizes it. NIST defines the package by its contents: the security and privacy plans, the assessment reports, the plans of action and milestones, and an executive summary. Each comes from a Risk Management Framework task with a named owner.

NIST also says the package may be generated from a tool, and FedRAMP's 2026 agency rules require governance and inventory tools that produce and ingest machine-readable artifacts, at least OSCAL and JSON. OSCAL gives each artifact a model, and the models link: the assessment plan imports the security plan, the results import the assessment plan, and the plan of action hangs from the security plan.

Every failing item gets a disposition. Actionable drift is an open item with an owner and a deadline. A governed exception carries an in-date acceptance and its expiry. A lapsed acceptance reverts to open. Nothing is always satisfied. And an empty plan of action on a Moderate system should prompt a question: what didn't the assessment look at?

## Slide 11 — Continuous monitoring keeps the package current

A package describes the system on the day it was generated. Continuous monitoring keeps that day recent.

The law already sets the floor. FISMA requires testing no less than annually, and there's no federal three-year rule. OMB's Circular A-130 tells agencies to move to ongoing authorization when a system is eligible, and once monitoring is mature enough, a review frequency replaces the end date. NIST is clear that controls which can't be automated must still be assessed.

The program's cadence, as its own design: monthly, regenerate the results and the plan of action, and report posture to the authorizing official. Quarterly, review each provider's Ongoing Certification Report; FedRAMP's rule says agencies must, and they should name a senior official to do it. Annually, the independent assessor re-assesses every control. Agencies must also notify FedRAMP when a report raises a concern likely to lead to rescinding the authorization.

And vendor posture scores aren't assessment evidence. A score measures progress against a vendor's recommendations. An assessment result says whether an objective is satisfied, and on what evidence.

## Slide 12 — The series as a map, and what stays open

The Federal Compliance series arranged its material by layer; the workbook books arrange it by the question a reader brings. Chapter 12 maps each part of the series to the book that carries it now, and Appendix A indexes 149 controls. Where a book and the older series disagree, the book is the later, footnoted text.

Two dependency claims explain the map. The naming and identity floor comes first: you can't inventory what you can't name. Assurance comes last, because the package can only report what the earlier books made observable.

Build everything on the map and risk still remains, in six kinds: self-assessment, until an independent assessor confirms it; what automation can't see; risk inherited from providers; evidence that stops arriving; risks outside control evaluation, such as insider threat; and design not yet built, or features not yet shipped.

Write the remainder down. A package that lists what's proven, asserted, inherited and accepted gives the authorizing official a risk they can see.

## Slide 13 — Decisions to make, and next steps

So, four decisions.

Name the owners in writing: signed appointments, a person in every decide and do cell of the matrix, and the authorizing official selecting the assessor.

Keep one dated clock. Submit the post-quantum migration plan, and re-verify every federal date against its source at each gate.

Fund the mechanisms that produce records before the tools that measure them. Assessment tools confirm a design; they can't stand in for one.

And generate the package: machine-readable records, a disposition on every failing item, and a named reviewer for every provider's quarterly report.

The next step needs no procurement. Fill the product inventory questionnaire against the estate as it is, verify each FedRAMP status on the day you record it, and decide every flag before the security plan is written.

A promise is true on the day it's signed. Proof keeps showing itself. Book 14 has the detail, every claim footnoted. Thank you.
