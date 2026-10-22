# Book 00 — Orientation & Program — Executive Briefing — narration script (practice copy)

## Slide 1 — What Must Leadership Decide, and When?

This is the executive briefing for Book 00 of the Federal Modernization Workbook, Orientation and Program. It runs about thirty minutes, and it's for the people who sponsor, fund and answer for modernization: executive sponsors, CIOs, CISOs and program executives.

One point first. The workbook is independent technical guidance, not federal policy. Where it says a law, memorandum or directive requires something, it cites that source. Everything else, including the program's phases, gates, principles and decision rights, is the workbook's own recommendation: one way to meet those requirements, not a requirement itself.

The argument is short. For twenty years Active Directory quietly did governance nobody wrote down. Federal policy and vendor lifecycles now set clocks the estate can't ignore. Meeting them one product at a time rebuilds the same governance gaps in a new place, so modernization has to run as one governed program.

I'll take four questions in order: why now, what the program is, who decides, and how it runs from pre-flight to steady state. Every decision slide names the decision, its owner, and when it's needed.

## Slide 2 — The directory governed the estate, and nobody wrote it down

Start with why. Most federal estates still run the client/server model they built in the early 2000s, with an Active Directory forest at the center. Since Windows 2000, the organizational unit has grouped objects for delegating administrative rights and assigning policy. So placing a user or a computer in the tree decided, at the same moment and with no separate record, who administers it, which Group Policy applies to it, what its groups let it reach, how it's named in directory-integrated DNS, and which certificates it receives.

It was efficient, and for a quarter century agencies got governance as a side effect of running a directory. The cost is that it was never stated.

The cloud estate doesn't inherit it. Entra ID's administrative units can't be nested. Intune applies policy to groups with no hierarchy, and two policies that disagree produce a conflict to resolve, not an inheritance rule. Access, names and trust move to Conditional Access, a DDI platform and a target PKI.

Each replacement needs someone to decide what the old placement meant. An agency that moves users and retires the forest without recovering those decisions doesn't modernize its governance. It deletes it.

So the first decision is the sponsor's, when the charter is signed: treat modernization as governance reconstruction, not only a technical migration. If stakeholders don't accept that, the charter says, resistance becomes the program's main risk.

## Slide 3 — Federal policy now sets the dates

The second reason is the schedule. Two kinds of clock now set dates from outside, and the first is federal policy.

OMB M-22-09, from January 2022, set Zero Trust objectives for the end of fiscal 2024. That date has passed, but the actions remain in force, on-premises and hybrid as well as cloud. CISA's BOD 25-01 set mandatory configurations for cloud tenants, with the policies due June 20, 2025, and every new tenant baselined before its authorization to operate. BOD 26-02, from February 2026, directs agencies to remove internet-facing end-of-support edge devices; the listed ones go by February 5, 2027. OMB M-26-14, issued May 22, 2026, rescinded M-21-31 and set a risk-based approach to logging. And FedRAMP's Consolidated Rules for 2026, launched June 25, take mandatory effect for all stakeholders on January 1, 2027, and providers then have a year to follow them to keep their certification. FedRAMP accepts no new Rev5 certification applications after June 11, 2027.

M-26-14 counts its deadlines from CISA's Logging Reference Architecture, published August 20, 2026. Counted from that date, the Agency Logging Plan falls on November 18 of this year, Level 1 on December 18, Level 2 on February 16, 2027, and Level 3 on July 6, 2027. Those four dates are the program's arithmetic, not dates OMB published.

So the nearest decision: confirm them with the CISO's office, starting with the logging plan, due November 18 by the program's count.

## Slide 4 — Vendor support dates cluster on the same estate

The second set of clocks is vendor support. After end of support there are no new security updates and no assisted support, and for an estate built in the early 2000s, the dates cluster.

Windows 10 and Exchange Server 2016 and 2019 ended in October 2025; SQL Server 2016, SharePoint Server 2016 and 2019, and the last Windows Server 2012 security updates ended this year. Windows Server 2016 ends on January 12, 2027, under three months away, and it's the operating system of many domain controllers built in the last decade. Windows Server 2019 and Microsoft Identity Manager 2016 end on January 9, 2029. Identity Manager's date was extended from 2026, so an agency that syncs HR data through it has a date, not an open-ended bridge.

A vendor date isn't a federal mandate on its own, but the two connect. BOD 26-02 turns end of support into a directed action for internet-facing edge devices, and every system security plan asserts flaw remediation that an unsupported product can't deliver.

So running past end of support is a decision, and it belongs to the authorizing official, who has to sign the risk acceptance. The first of those falls due with Windows Server 2016, on January 12.

## Slide 5 — Read the clocks exactly, then run one program

The clocks are often quoted for more than they say. Four corrections recur.

FedRAMP certifies cloud services, and each agency still authorizes its own systems, so the 2027 date changes what providers publish, not whether the agency's own systems comply. Moderate is now a certification class: Class C includes the current Moderate baseline, and Class D the High. No federal document requires a Zero Trust maturity stage. And BOD 25-01 covers production cloud tenants, not on-premises Active Directory, though the forest still decides much of what a tenant can enforce.

Nothing makes the estate fail on a single date. It's surrounded by deadlines, each binding a different part of it, and each assuming the agency knows what it runs, who owns it and what governs it.

That's why it can't be a set of projects. Moving devices to Intune needs the policy GPO links carried; Conditional Access needs the access groups granted. Separate projects rediscover those decisions differently, or not at all. A program can sequence the work against the dates; a collection of projects can only race them.

Hence the decision for the sponsor and CIO, before the budget lines are set: fund and govern modernization as one sequenced program, with one dependency chain and one set of gates.

## Slide 6 — The charter: the page the sponsor signs

Now, what the program is. It starts with a short charter: the page the sponsor signs, and the page every later decision is checked against: is this inside the scope we chartered, does it serve one of the objectives, and does it move a success criterion?

The problem it sets out to remove has four costs: migration risk concentrated in hidden dependencies; ongoing drift between intended and actual state; weak evidence of change and compliance; and a high cost of reconciling fragmented stores.

Against those, six objectives. One authoritative origin for organizational structure, identity attributes and key claims, with every other copy derived. Governance rebuilt explicitly, through attributes, dynamic membership and scoped policy. Drift treated as a classified finding. Change in controlled waves that start from the authoritative source, run under least privilege, and close with evidence. Domain transformations without rip-and-replace. And continuous, machine-usable evidence.

The scope is deliberate. The program feeds compliance frameworks; it doesn't replace them. Identity providers, network fabrics and device managers stay the enforcers, and the program governs them. And the adopting agency executes its own cutover.

An agency can adopt the charter as written. The decision: the sponsor signs it, and names go into its governance table, starting with the sponsor and the steward, as Phase 0's entry work.

## Slide 7 — Six success criteria, each tested at a gate

A sponsor can't sign off an outcome with no test, so the charter turns each success criterion into a measure, the evidence that shows it, and the gate where it's checked.

First, a current-state assessment that covers every forest in scope and all eleven dependency object types, with zero open priority-one findings, checked at G0. Second, a target structure in which every attribute that drives access has exactly one designated source, checked at G1. Third, a domain playbook whose entry and exit criteria are written as queries, proven when the pilot division clears G2 with zero drift for a hold period; fourteen days is the illustrative example. Fourth, a change-control pattern in use: every pilot change carries all five clauses of the change lifecycle, and every human-only closure is logged as an exception. Fifth, drift classes with a detection signal, a severity and a response, where a missed run is itself a halt condition. Sixth, leadership can describe the path, the risks and the measures without citing internal decision records.

The numbers are illustrative defaults: the agency sets its own, records them, and doesn't change them silently. And the criteria stop at the pilot on purpose.

The sixth criterion is the sponsor's own. The sponsor answers yes to each pre-start question by G0, and the steering committee reviews the drift trend monthly.

## Slide 8 — Fifteen principles, one idea underneath

The charter's six guiding principles expand to fifteen in Chapter 04, and one idea runs underneath them all: keep the record of what should be true apart from the systems that enforce it, and make every change prove itself against that record.

The foundation principles apply to every change. Every claim has one authoritative origin. Every move, add, change, deletion and reset travels five clauses: it originates with the source of truth, carries an authoritative authorization, executes under just-in-time least privilege, closes with provenance, and emits evidence automatically. No closure counts unless it carries its proof. And drift detection re-checks on a schedule.

The structure and estate principles replace the organizational unit (OU) tree with attributes, and they carry one rule executives should hear: a user with an empty attribute falls out of the dynamic group, and so out of every policy that targets it. Attribute completeness is a security control.

The program principles cover people, Zero Trust governance and the direction of travel. Two source rules were corrected on the way: Intune policy conflicts, and token lifetimes, where the principle that survives is continuous evaluation, not a short clock.

The decision here is the steward's, and it comes before the first change is made: set the evidence and provenance expectations that every later change must meet.

## Slide 9 — Seven phases, six gates, and who clears each

A plan earns its keep by saying what has to be true before the next step starts, not by putting dates on a chart.

The Federal Modernization Workbook's Book 01 of the workbook is canonical: seven phases and six gates. Phase 0, Pre-flight, ends at G0, Ready to Plan. Phase 1, Foundation, ends at G1, Foundation Complete. Phase 2, the pilot division, ends at G2, Pilot Clean. Phase 3, general rollout, at G3, Rollout Complete. Phase 4, legacy retirement, at G4, Legacy Quiet. Phase 5, AD DS retirement, at G5, AD Retired. Phase 6, steady state, runs on a cadence indefinitely.

The gates are owned in proportion to what they end. The steward clears G0, G1 and G4, and co-signs G2 with the executive sponsor. The sponsor and steering committee clear G3. The sponsor and the CIO clear G5.

And five constraints bind every phase, from provenance on every change to no rip-and-replace.

The program's detailed master plan sequences 48 milestones over an illustrative 52 weeks, but its cutover ends with AD DS still running. Book 01's own fifty-two-week sequence models a mid-size, clean forest, and large federal estates typically run multi-year. So the decision for the sponsor and CIO, when they accept the plan: budget the AD DS retirement phase on top of the master plan's 52 weeks.

## Slide 10 — Five workstreams in parallel, one critical path

Inside the phases, five workstreams carry the work: identity, policy, services, compute and access. They run together; finishing one before starting the next roughly doubles the program.

They still have an order. Identity comes first, the attribute model, dynamic membership and the lifecycle origin, because policy, access, devices and data all decide on the basis of who or what is asking. Policy follows identity. Services, naming and addressing, can run in parallel and may bridge. Compute, the device and server work, comes mid to late. Access, token-based and application-aware, comes later, because it consumes both identity and policy.

The master plan organized the same work as five technology pillars, and that view leaves two gaps. Nobody owns the question of which policy surface owns a setting, and the access plane has no pillar at all. The Federal Modernization Workbook's Book 01 closes them by giving policy a security-engineering lead and access a joint identity and security lead.

The critical path runs through the platform, the assessment, attribute and group design, the pilot, each rollout wave, and cutover validation. Every week lost in assessment or attribute design moves every later gate. And one dependency never relaxes: PKI waits for identity.

The decision, made while Phase 0's stakeholders and decision rights are confirmed: name the five workstream leads, including those two.

## Slide 11 — Seven projects, run inside the program

Seven complementary projects turn the program's most common gaps into executable work, each with its own sponsor, lead and pilot.

In their suggested starting order: Identity Lifecycle and Provisioning; Endpoint and Device Modernization; Network and Access Modernization; Continuous Monitoring and the Evidence Fabric; Privileged Access and Administrative Identity; Data Platform Identity Transformation; and Supply Chain and Software Bill of Materials.

The order says which project has to be far enough along before the next can show results. Identity is first, because everything else consumes its attributes and owners; a device project started on unreliable attributes produces policy bypass. Monitoring comes fourth, because an evidence fabric needs at least two sources already emitting records. Privileged access is chartered fifth, but it isn't fifth in practice: the Foundation gate already needs emergency access accounts vaulted and tested, and Tier 0 administrators registered for phishing-resistant sign-in.

Every charter asks for a working pilot, not a finished estate. Two rules keep the portfolio coherent. No project designates a second authoritative source for something another project owns. And every project emits evidence in the shape the monitoring project defines.

The projects don't form a second governance structure, and no project clears a program gate on its own. Filling in their names is each project's first act, and every project lead reports to the steward.

## Slide 12 — Who decides: one decider per row

Who decides? The book's advice: name the people allowed to say no, give each decision one of them, and make the repository remember who said yes.

The book uses the Federal Modernization Workbook's Book 01's program-wide model. The executive sponsor, with the CIO, owns scope, funding and sequence, breaks ties, and decides when Active Directory components retire. The CISO sets the control requirements every target surface must meet: authentication strength, the Conditional Access baseline, logging. The authorizing official is the only official who can accept security and privacy risk. The steward leads the program office and owns the plan, wave sequencing, cross-domain dependencies and the repository. A change to the target architecture, or to the rules for authoritative origin, needs the steward and the sponsor together. HR decides what each organizational attribute means. And workstream leads own their designs, inside the CISO's requirements.

Two federal requirements already name people who belong in these rows. M-22-09 required a zero trust implementation lead within 30 days, and an aligned C-suite. M-19-17 requires an integrated, agency-wide ICAM governance structure.

So the decision for the sponsor and CIO, in Phase 0: name the sponsor, the steward and the steering committee, and build them from those existing roles, not alongside them.

## Slide 13 — Three decisions the plans put on the wrong desk

Most of what the program's plans said about decisions holds. Three items don't.

Residual risk. The plans let the security lead and the steward accept it jointly. Under the Risk Management Framework, only the authorizing official can accept security and privacy risk to the organization. So the security lead and steward prepare and recommend, and the acceptance carries a justification, compensating controls and an end date.

Budget and licenses. They belong to the sponsor and CIO, who own funding. The steward prepares the case.

Gate decisions. The master plan made the steward the sole signatory at every gate. The Federal Modernization Workbook's Book 01 spreads the gates across the steward, the sponsor, the steering committee and the CIO, in proportion to what each gate ends.

Four separations keep the governance honest. The authorizing official is a government official, the decision can't be delegated, and the role stays outside the program office: contractors can prepare a risk acceptance, but can't sign one. No one holds two roles that check each other. Requesters don't approve their own changes. And the component that decides isn't the one that acts.

The decision sits with the authorizing official from G0 onward, where an unremediated Critical finding needs the official's acceptance: every risk acceptance comes in writing, with an end date.

## Slide 14 — The people the program needs, and its rhythm

Who does the work? The master plan estimated the program office and workstreams at about five and a half full-time equivalents, for an illustrative 52-week program: half a steward; a full-time infrastructure lead, identity lead and endpoint lead; and half-time DNS, PKI and security leads and a project manager. It's a planning model, not a staffing standard.

What matters more is what the estimate leaves out: application owners for every application that moves, help desk capacity for every wave, HR and contractor-source owners, records and privacy, and the CISO's and authorizing official's time for requirements and risk decisions. The program can't run without them, so budget for them explicitly. And cross-train two people per workstream.

The rhythm: daily standups, and a weekly report rating each workstream green, yellow or red. The steering committee meets every two weeks, the steward and sponsor review gate readiness monthly, and each gate gets a ninety-minute review that ends in go, no-go or conditional go. And two consecutive red weeks for any workstream go to the sponsor.

The decision for the sponsor and CIO: put those people in the Phase 0 business case, alongside the licenses, and approve the budget before design begins.

## Slide 15 — Pre-flight: assessment before action

Now, how it runs, starting with pre-flight. The program adopts one rule unchanged: assessment before action. No migration work starts until the whole forest is inventoried, classified and committed to the repository, and every plan is generated from that data.

First, the program builds the place where every decision will be written down: a platform host with one authoritative, protected writer. The reference design is Gitea on Windows Server 2025, one way to meet the requirement, not the only one. The host is a Tier 0 system, and a branch protection the steward can quietly override is a convention, not a control.

Then it reads the estate: read-only first, at default rights, then narrow delegated additions and a security assessment. The master plan's twelve Active Directory domains are joined by the DHCP, LDAP-binding and service-principal-name streams that the Federal Modernization Workbook's Book 01 adds, and by an inventory of RADIUS and NPS, which depend on the directory too. The phase delivers twenty-three artifacts: fifteen committed before G0, and eight generated plans approved just after it.

G0 has three conditions: the platform host is operational, the assessment is committed, and no priority-one finding is open. Every finding is classed Critical, High, Medium or Low, and each class has a gate that closes it.

A Critical finding is remediated before G0, or formally accepted by the authorizing official. The steward clears G0 on that basis, with the executive sponsor as backup.

## Slide 16 — Foundation and pilot: prove it on one division

Phase 1, Foundation, opens by generating the eight plans from the committed assessment and approving them. It then designs every surface from those plans, attributes, dynamic groups, Intune policy, Conditional Access, sync, DNS and PKI, and builds the shared foundation the pilot needs. Group processing is planned in hours, not minutes.

The steward clears G1 when the plans and designs are approved, the baseline Conditional Access policies are enforced after at least a week in report-only, the emergency access accounts are vaulted and tested, the HR feed is live, and every High finding is remediated.

Phase 2 proves the whole pattern on real people. The Federal Modernization Workbook's Book 01 sets the pilot's scope as one division, typically IT, which tolerates disruption best, and the master plan's sizes are a floor for what it must exercise. It's measured against eight criteria, from sign-in success to help desk volume. The values are illustrative: set them in the decision log before the pilot opens, and evaluate them from the systems, not from opinion. Every surface has a rollback trigger and a procedure.

G2 is signed jointly by the steward and the executive sponsor: zero drift for the agreed hold period, every criterion met, and no hybrid-joined PC without a cut date.

## Slide 17 — Roll out in waves, then retire only what nothing uses

Phase 3, general rollout, repeats the proven pattern until every division has moved. A wave is a set of divisions chosen by attribute value, usually by region, with the lowest-risk region first. Group Policy links stay in place during a wave, and come off a migrated OU only after seven days of clean compliance. The sponsor and steering committee clear G3 when every division has passed its own exit gate.

Then the work changes character: these phases take old things away. Phase 4 retires AD FS, user and device certificate issuance from AD CS, DNS forwarders, Group Policy links, non-essential trusts and legacy servers, each through its own plan. A component is retired only while its rollback still works. Some things stay until the domain itself retires: its own DNS zones, the domain controller and LDAPS certificates, and the default domain account policies. The steward clears G4.

Phase 5 retires AD DS itself, which the master plan never reached, or reduces it to a documented Kerberos island with an end date. Two steps are easy to forget. Records come before hardware. And domain controllers store the password hashes of every account, so retired hosts and their storage are sanitized.

The sponsor and CIO clear G5, and they decide when each component retires, after the records officer is consulted.

## Slide 18 — Steady state, and what success looks like

Phase 6, steady state, has no exit gate. The modernized estate runs under continuous governance: reassessment weekly, drift detection daily, a monthly compliance report, quarterly access reviews and an annual architecture review. The finish line is zero drift findings, zero actions from the nightly plan run, and signed evidence flowing to the SIEM.

Every finding gets a severity, and every severity a clock. The master plan's defaults run from a Critical finding fixed within four hours to a Low one within thirty days. The agency sets its own values; what the program insists on is that there are some, written into its continuous monitoring strategy and measured.

Success is measured twice. Delivery measures turn green gate by gate: the assessment accepted at G0, the target model agreed at G1, the first wave run with full provenance and evidence at G2, drift detection operating by G2 and G3, and every residual risk owned by G5. Outcome measures are what operations keeps green after the project ends.

A program can meet every delivery measure and still fail if the outcome measures drift after the project team leaves. That's why the handover is part of the scorecard. The steward records it before the team leaves: who owns the repository and its protections, each drift class, each severity and each review.

## Slide 19 — The risk register: what can sink the program

The risk register starts with five program risks. Hidden dependencies are missed in discovery: the answer is a structured assessment and a pilot designed to surface unknowns early. Competing sources of truth persist: one authoritative origin is designated per object class. The organization resists making authority explicit: the answer is early alignment, and decision rights with one decider per row. Tooling leads the design: the target model comes first, because tools bought first automate the old ambiguity faster. And physics or data residency limits centralization, so truth is centralized logically, not necessarily in one physical store.

Beneath them sit twenty-five delivery risks. A few deserve executive attention. Critical certificate-services misconfigurations can force emergency PKI work. Legacy applications depend on NTLM, which Conditional Access can't evaluate, so each dependency becomes a finding with an owner and a dated exception. Strong certificate mapping is no longer a future risk: domain controllers already enforce it. And at the end, access records can be lost at decommission, and governance can decay once the team leaves.

The register doesn't satisfy a control. It tells the agency when its system security plan and its risk assessment have to be updated, which is at every gate. The project manager keeps the register, the authorizing official accepts residual risk, and security risk left open past a gate becomes a plan of action and milestones item.

## Slide 20 — Decisions to make, and who makes them

So, the decisions, with their owners.

The executive sponsor charters the program as governance reconstruction, signs the charter, and puts names in it as Phase 0's entry work. The sponsor and CIO fund one sequenced program, with the AD DS retirement phase and the people beyond the five-and-a-half-person core in the budget, approved before design begins. And they build the steward and steering committee from the zero trust lead and the ICAM governance body the agency already has.

The CISO's office confirms the M-26-14 dates, starting with the Agency Logging Plan, due November 18 by the program's count. The authorizing official decides whether anything runs past end of support, beginning with Windows Server 2016 on January 12.

The steward sets the evidence and provenance expectations before the first change, and clears G0 only when every Critical finding is closed or accepted by the authorizing official. The steward and sponsor record the pilot's thresholds before it opens, and sign G2 on the data. The sponsor and CIO decide when each Active Directory component retires, after the records officer is consulted. And the steward records the handover to operations before the project team leaves.

None of these is a purchase. The case for modernizing now is that the estate's governance was never written down, the dates that bind it now belong to others, and the only way to meet them without losing that governance is to recover it deliberately, once, in one program. Thank you.
