# HR-Driven Identity — narration script (practice copy)

## Slide 1 — HR-Driven Identity Modernization

Good morning, and thank you.

Digital identity has two faces: the public who sign in to an agency's services, and the workforce who serve them. Both rest on the same data discipline: one person, one key the agency controls, and every fact owned by one authoritative source. I'll show that discipline through the workforce face, because Federal HR 2.0 puts it on participating agencies' calendars.

I have one proposal, and I'll take it through four questions, the way I'd take it to leadership: why it matters, what we should do, who has to be involved, and how we'd carry it out and know it's working.

## Slide 2 — Identity is built by hand — and the mission is outgrowing it

Why. Based on current visibility, many agencies do not operate a comprehensive enterprise HR-driven identity lifecycle. In the processes I have observed, many workforce identity changes remain dependent on tickets or manual coordination, and that costs three ways.

Access outlives the job: when someone leaves or changes roles, removal can wait for a ticket, and a stale account is a security violation that can enable a breach of the public's records. Federal standards require revoking a separated person's credentials, and a ticket-dependent process struggles to meet that. Records we can't trust: in the processes I have observed, the phone book is wrong until someone files a ticket, and every change of manager means the organization, the manager and tool access are updated by hand. Approvals route through that same data. And cost and delay: many joiners, movers and leavers become help-desk work.

But the bigger why is where the mission is heading. Take an illustrative shared-service scenario: a cross-agency contact center, one front door for two agencies' customers. It's an example, not an approved program. The hard part of an idea like that isn't the phones: cloud contact centers make the front end easy. It's the back end. Who is this agent? Which agency's records may they see? And does their access end the day they leave, in both agencies? A standardized, HR-driven identity supplies the trusted facts needed to answer those questions consistently.

And if we do nothing, HR moves to Core HCM, identity moves to Entra ID, and we rebuild the same manual process twice, on new platforms.

## Slide 3 — Four options, weighed against what leadership must balance

What should we do? I've weighed four realistic options against what leadership actually has to balance: the mission and the public we serve, security, cost and resilience. Compliance matters, but on its own it isn't a reason to invest.

A, keep ticket-driven identity: no new investment, but the risk and the manual work stay where they are. That's the cost of doing nothing.

B, automate inside the directories with scripts and exports: quick and cheap. It can automate selected changes, but without a governed authority model and complete lifecycle events, it risks propagating inconsistent data and being rebuilt when the source changes.

C, wait for HR 2.0 and integrate afterward: defensible, and less work this year. But program material describes interconnections occurring during the onboarding period, so waiting means retrofitting after go-live.

D, start now: HR as the source of truth, in OPM's standard personnel data, designed into both the HR onboarding and the Entra ID migration. It costs design effort up front and needs shared governance, which is why it's only partial on cost.

The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step — data standards, ownership and the person key — is no-regret either way, and it can start now from the HR data the agency already has, subject to data profiling, with the source switched to Core HCM when it arrives.

## Slide 4 — Recommendation: HR as the source of truth, starting now

I propose option D, phased, starting with the no-regret steps. Four reasons.

Mission and the public: access to the public's records should end when a person's role ends, automatically, the same day; the people who serve the public should have the right access on day one; and shared services like the illustrative contact center become possible, because participating agencies would describe their people the same way.

Cost: we build it once, while both platforms are being rebuilt anyway, and retire ticket work for routine joiners, movers and leavers.

Security: modern access decisions, Zero Trust, increasingly depend on authoritative identity, device and contextual attributes, and the identity attributes, organization, position, status and supervisor, come from HR. So the accuracy of HR data drives the accuracy of access. The federal mandates point the same way, but they're the floor, not the reason. And it gives the inspector general's perennial question — how do you know every account belongs to a current person? — a standing answer.

Resilience: by building on OPM's standard data rather than one vendor's fields, and on a person key the agency controls, the design survives the next platform change. I propose an existing enterprise ID, such as a Mainframe PIN, as the candidate, subject to formal identifier validation.

Two honest limits. HR 2.0 covers federal employees only, so a contractor authority decision is required: I propose evaluating suitability records, PIV sponsorship and Core HCM's contingent-worker records as candidate sources. And we should build only what HR is authoritative for.

The upside: participating civilian agencies are moving toward a common Core HCM platform and federal personnel standards, so a reusable identity model could reduce reinvention across agencies and shared services.

## Slide 5 — Who: the owners, the partners, and my role

Who has to be involved. This is an organizational change as much as a technical one, so it matters who owns what.

HR owns the personnel data and its quality, at the source. When the data is wrong, it gets fixed in HR, not patched in the directory. And the OPM HR 2.0 program owns the platform, the standards and the interconnection.

The CIO's identity team uses that data to run Entra ID, Active Directory and access. Security sets the Zero Trust policy and owns the leaver path. And the help desk moves from routine tickets to handling the exceptions.

Then the guards and partners. The privacy office is in from the start, because using HR data for identity is a disclosure that needs a routine use and minimization. For people HR doesn't cover, contractor sponsors, credentialing, acquisition, suitability and HR systems each may hold part of the record; the authority decision identifies which source owns each required fact. And partner agencies need the same standard if we're going to share services.

My role, as an enterprise data architect, is to own the data standards, the logical model and the person key: every attribute gets one name, one definition and one accountable owner. I'd chair the data working group for the effort, review the HR 2.0 integrator's design artifacts against those standards, and carry the standard to the interagency committees and working groups where it gets adopted. The person model and its attributes also become a governed piece of the agency's data and metadata inventory, which auditors increasingly ask for.

## Slide 6 — How: the data model, logical to physical

This is the data architecture underneath, and one principle carries it: the person is the durable entity. Accounts, affiliations, assignments, identifiers and credentials have different lifecycles but resolve to the same governed person.

I propose keying that person on an enterprise person key the agency controls. In the proposed canonical model, conversion creates a new affiliation for the same person, so history survives. The right-hand side shows where each piece would live; the backup slides carry the detail.

The standard behind it: one name, one definition and one owner per attribute, and the DBAs build from the logical model, not from a vendor's fields.

## Slide 7 — How: data, security and operations

Here is how I propose we carry it out.

Data. One governed crosswalk maps OPM's standard data elements into that person model, so when HR changes platforms only the crosswalk's source side changes. Validated personnel-action mappings then initiate the identity events — joiner, mover, leaver — using a proposed classification that the data owners validate first. Contractors come into the same model once the contractor authority decision is made.

Security. The leaver path blocks access first, within the approved threshold, and then reconciles every downstream action. The integration runs with least privilege, using managed identities and secretless authentication wherever supported. And anything that fails goes to a quarantine with an owner; nothing resolves itself silently.

Operations. We start now, from the HR data the agency already has, subject to data profiling, and switch the source to Core HCM when it arrives. We run in shadow mode first, comparing what HR says with what the directories hold, and fixing the gaps. We cut over one population at a time. And we close the ticket path for a population only when the data proves HR is the sole source.

The products on the slide are one realization; the agency-owned model remains stable if they change.

## Slide 8 — How we’ll know it works — and what I need

How we'll know it's working, and what I'd need.

Six measures, each baselined in the first phase, and each one a business measure leadership can read: time from separation to blocked access, in hours, against an agency-approved threshold; credential and access revocation, reconciled to verified completion, where one credential-specific constraint is the federal requirement to terminate a PIV card that can't be collected within eighteen hours; accounts tied to a person, with orphaned accounts trending to zero; joiner and mover tickets going down, with access ready on day one; the manager and organization in the directory matching HR; and every exception with an owner and an age. As a byproduct, the same data is evidence for the controls auditors ask about.

I'm asking leadership to make three decisions: name identity as an HR 2.0 data consumer, authorize the cross-functional data-governance work, and require assumptions to be validated by accountable owners before implementation. That lets the agency modernize the platforms and the lifecycle together, rather than carrying the ticket process forward.

Thank you. I look forward to your questions.

## Slide 9 — More modernizations I’ve designed

HR-driven identity is one piece of a larger set of modernizations I've designed over the last several years: Entra ID migration, next-generation DNS and IP address management, field office WAN and data-center consolidation, the TIC 3.0 Cloud and Branch Office cases, the client-server to hybrid cloud path, SQL Server identity, the move from Group Policy to Intune and Azure Arc, and continuous compliance against SCuBA, BOD 25-01 and FedRAMP 20x.

They share the same data discipline you just saw: a named authority for every fact, a governed model, and evidence produced by operation. I'm happy to go into any of them.

Two companion decks go deeper on this one: the Contractor Identity Source deck, on who is authoritative for a contractor, and the original HR-Driven Identity deck, with the full model, lifecycle and plan.
