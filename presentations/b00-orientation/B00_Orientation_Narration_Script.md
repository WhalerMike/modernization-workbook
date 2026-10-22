# Book 00 — Orientation & Program — narration script (practice copy)

## Slide 1 — Why Modernize, and Why Now?

This briefing comes from Book 00 of the Federal Modernization Workbook, Orientation and Program: the front door to the series. It makes the case for modernizing the client/server estate now, and sets out the Federal Modernization Program that the other books carry out.

One point before we start. The workbook is independent technical guidance, not federal policy. Where it says a law, memorandum or directive requires something, it cites that source. Everything else, including the program's phases, gates, principles and decision rights, is the workbook's recommendation: one way to meet those requirements, not a requirement itself.

I'll take four questions: why modernize now, what the program is, who decides, and how it runs. Then the decisions to make next.

## Slide 2 — Active Directory did governance nobody wrote down

Why modernize now? Start with what the directory has been doing. Most federal estates still run the client/server model they built in the early 2000s, with an Active Directory forest at the center. Since Windows 2000, the organizational unit has grouped objects for delegating administrative rights and assigning policies. So placing a user or computer in the tree decided several things at once, with no separate record. Who administers it, through the permissions on the organizational unit (OU). Which policy applies, through Group Policy linked to sites, domains and OUs. What it can reach, through group membership. How it's named, through DNS zones stored in the directory. And whether it's trusted, through certificates enrolled by Group Policy.

None of that was wrong. It just was never written down. And the cloud doesn't inherit it. Entra ID's administrative units can't be nested, and policy is assigned to groups, not inherited from a container. An agency that moves the users and retires the forest without recovering those decisions doesn't modernize its governance. It deletes it.

## Slide 3 — The schedule now belongs to OMB, CISA, FedRAMP and vendors

The second reason is the calendar, and it isn't the agency's any more. Federal policy sets dates from outside. M-22-09's Zero Trust actions were due by the end of fiscal 2024; the deadline has passed, but the actions remain in force. BOD 25-01's mandatory cloud-tenant policies were due June 20, 2025. BOD 26-02 requires listed end-of-support edge devices to be decommissioned by February 5, 2027. M-26-14 rescinded M-21-31, and asks for an Agency Logging Plan within 90 days of CISA's Logging Reference Architecture, published on August 20, 2026. Counted from that date, the plan is due November 18, 2026; that's the program's arithmetic, not a date OMB published. And FedRAMP's Consolidated Rules become mandatory on January 1, 2027.

Vendor support adds its own clock. Windows 10 and Exchange Server 2016 and 2019 ended in October 2025. Windows Server 2016, the operating system of many domain controllers, ends January 12, 2027. Nothing fails on a single date. But every deadline assumes the agency knows what it runs, who owns it and what governs it.

## Slide 4 — Read the clocks exactly, then run one program

The clocks are often quoted for more than they say, so the program plans against the documents. FedRAMP certifies cloud services; each agency still authorizes its own systems. Moderate is now a certification class, Class C. No federal document requires a Zero Trust maturity stage. And BOD 25-01 covers cloud tenants, not the on-premises forest.

Why one program rather than a set of projects? Because every project touches the same implicit decisions. Intune needs the policy that GPO links carried. Retiring directory DNS needs the names the forest registered. Rediscovered project by project, they're answered differently; owned by no project, they fall between them until something breaks. A program can sequence the work against the external dates. A collection of projects can only race them.

The sequence starts with identity, because policy, access, devices and data all decide on the basis of who is asking. So, three conclusions: fund the work as one sequence, hold gates on evidence rather than the calendar, and be honest about maturity.

## Slide 5 — How the workbook works: eighteen books, four questions

A word on how the workbook works, because this briefing comes from it. It's organized as eighteen books, B00 to B17, numbered along the same dependency chain: identity first, then the estate's infrastructure, then the boundary, assurance and operations. Every book asks the same four questions, why, what, who and how, so a reader who knows one can find their way through any other. One book is the authoritative home for each topic; the Federal Modernization Workbook's Book 01, for example, is canonical for the program's phases and gates.

Statements come in three kinds. An external fact is footnoted to a primary source, checked on the day the book was built, here October 21, 2026. A program design position is the program's own view, open to argument rather than fact-checking. And an illustrative example is labeled as one; the case studies are framing patterns, not real engagements. Each chapter keeps a verification file, with a claims log and a carry-forward ledger, so every correction is visible.

## Slide 6 — The charter: the page the sponsor signs

What is the program? It starts with a charter: short on purpose, the page the sponsor signs, and the page every later decision is checked against. Its purpose is to move the organization from fragmented, legacy-dependent identity, policy and addressing systems to a governed, attribute-driven hybrid-cloud operating model, without rip-and-replace disruption.

It has six objectives: one authoritative origin for organizational structure and identity attributes; governance rebuilt explicitly, through attributes, dynamic membership and scoped policy; drift treated as a classified finding; change in controlled waves that close with evidence; domain transformations that can each proceed on their own schedule; and continuous, machine-usable evidence.

The scope is the method. Discovery, the target model, wave plans, change control, drift detection and gates are in. Replacing compliance frameworks, inline enforcement and the agency's own cutover execution are out at first. And one platform fact shapes the plan: for synced users, the extension attributes are mastered in Active Directory and read-only in the cloud.

## Slide 7 — Six success criteria, each tested at a gate

A sponsor can't sign off an outcome with no test attached, so each of the charter's six success criteria has a measure, the evidence that shows it, and the gate where it's checked. The current-state assessment covers every forest in scope and all eleven dependency object types, with zero open priority-one findings, at G0. The target model is agreed when every attribute that drives access has exactly one designated source, at G1. One domain has a complete playbook, whose entry and exit criteria are queries the pilot passes. The change-control pattern is in use when every pilot change carries all five clauses of the change lifecycle. Every drift class has a detection signal, a severity and a response. And leadership can describe the path, the risks and how success is measured, without citing internal decision records.

The numbers are illustrative defaults. The agency sets its own, records them, and doesn't change them silently afterwards. And these criteria stop at the pilot; Chapter 10 measures the rest of the program.

## Slide 8 — Fifteen principles in five groups

The charter carries six principles in short form; Chapter 04 sets out all fifteen, in five groups, each tied to the book that carries it in depth. Foundation principles apply to every change: a single source of truth, change control with provenance, and drift detection. The change rule is strict. Every move, add, change, deletion and reset travels five clauses: it originates with the source of truth, carries an authoritative authorization, runs under just-in-time least privilege, closes with proof, and emits evidence automatically. No closure counts unless it carries its proof.

Directory and structure principles say what replaces the OU tree. Devices and policy cover hybrid join, servers, Conditional Access and the Group Policy sunset. Identity and data cover the HR feed and SQL Server. And the program group covers training, Zero Trust governance and the overall journey. Two source rules were corrected against Microsoft's documentation, including token lifetimes: continuous access evaluation revokes sessions on events, and its tokens can last up to 28 hours.

## Slide 9 — Seven phases and six gates: Book 01's model

The plan follows the Federal Modernization Workbook's Book 01's seven phases and six gates. Phase 0, Pre-flight, ends at G0, Ready to Plan. Foundation ends at G1, Foundation Complete. A pilot division ends at G2, Pilot Clean. General rollout ends at G3, Rollout Complete. Legacy retirement ends at G4, Legacy Quiet. AD DS retirement ends at G5, AD Retired. And steady state has no gate; it's a standing cadence.

Five constraints bind every phase: changes originate from the authoritative source and close with provenance, privilege is time-bound, copies stay non-authoritative, drift stays visible, and nothing requires rip-and-replace. Underneath them is one rule: assessment before action.

The program's detailed master plan numbers its phases differently, and its illustrative fifty-two weeks stop short of retiring AD DS. Large federal estates typically run multi-year. Five workstreams run in parallel, identity, policy, services, compute and access, and one dependency never relaxes: PKI waits for identity. The gates, not the calendar, decide when the next phase starts.

## Slide 10 — Seven complementary projects, run inside the program

Inside the program run seven complementary projects. Each has its own charter, sponsor, lead and pilot-scale success criteria, and each turns a gap the program finds often into executable work: identity lifecycle, endpoints, network and access, continuous monitoring, privileged access, the data platform, and the supply chain.

Identity goes first, because everything else consumes its attributes and owners. Privileged access is chartered fifth but starts early, in the Foundation phase, for Tier 0 and emergency access. One detail matters there: Microsoft's guidance is at least two cloud-only emergency access accounts with permanent Global Administrator, so a target of zero permanent Global Administrators must exempt them by name.

Two source claims have moved. OMB rescinded the secure-development attestation requirement in January 2026, so a software bill of materials is now an agency choice backed by contract terms. And FedRAMP certifies a service, while the agency authorizes its own system. Finally, no project creates a second source of truth, and no project clears a program gate on its own.

## Slide 11 — Who decides: one owner for every decision

Who decides? The workbook uses the Federal Modernization Workbook's Book 01's model, and gives every decision an owner. The executive sponsor, with the CIO, owns scope, funding and sequence, and decides when Active Directory components retire. The CISO sets the control requirements. The steward leads the program office and owns the plan and the repository. Gates follow what each one ends: the steward clears G0, G1 and G4; the steward and sponsor co-sign G2; the sponsor and steering committee clear G3; and the sponsor and the CIO clear G5.

The program's plans gave three decisions to the wrong person. Residual risk belongs to the authorizing official alone: under the Risk Management Framework, no one else can accept it, and for federal agencies the role is inherently governmental. Budget belongs to the sponsor and CIO. And gates aren't the steward's alone.

The master plan's core team is about five and a half full-time equivalents. Budget beyond it, for application owners, the help desk, HR, records and the authorizing official's time.

## Slide 12 — From pre-flight to steady state: what each stretch proves

How does it run? Pre-flight builds the platform host as a Tier 0 system and runs the read-only assessment: the master plan's twelve domains, plus DHCP, LDAP bindings and the service principal name map. It produces twenty-three deliverables: fifteen committed before G0, and eight modernization plans approved just after it. G0 passes with no open critical finding.

Foundation enforces the Conditional Access baseline after at least seven days in report-only. The pilot is one division, measured against eight numeric criteria, such as authentication success above 99 percent, and held drift-free for an agreed period. Rollout then moves in waves chosen by attribute value.

Retirement takes things away, so an action is retired only while its rollback still works. Domain controller certificates and the domain's own DNS zones stay until Phase 5. Consult the records officer before any hardware goes, and sanitize retired disks, which hold password hashes. In steady state, reassessment runs weekly and drift detection daily, with a clock for each severity: by default, a critical finding is fixed within four hours.

## Slide 13 — Decisions to make, and next steps

So, four decisions to make next.

Charter the program and name its people, starting with the sponsor and the steward, built from the zero trust lead and the ICAM governance the agency already has.

Scope the read-only assessment: which forests, which tenants, which read-only accounts.

Designate the authoritative sources: normally the HR system for employees, and a source of their own for contractors, whom HR usually doesn't hold.

And set the thresholds and evidence rules before the first change: success criteria, drift severities and provenance expectations, recorded and never changed silently.

The recommended first wave is identity structure and dynamic membership, because every later wave scopes itself with them. And one clock is close: by the program's count, M-26-14's Agency Logging Plan is due November 18, 2026, so confirm that date with the CISO's office now.

Recover the governance once, in one program, and let named people make the decisions the evidence supports. The Federal Modernization Workbook's Book 00 has the detail, every claim footnoted. Thank you.
