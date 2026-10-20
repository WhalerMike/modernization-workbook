# HR-Driven Identity — narration script (practice copy)

## Slide 1 — HR-Driven Identity Modernization

Good morning, and thank you.

I have one proposal, and I'll take it through four questions, the way I'd take it to leadership: why it matters, what we should do, who has to be involved, and how we'd carry it out and know it's working.

## Slide 2 — Identity is built by hand — and the mission is outgrowing it

Why. In many agencies today, nothing connects HR to identity. Accounts, access and credentials are created and removed by ticket, and that costs us three ways.

Access outlives the job: when someone leaves or changes roles, removal waits for a ticket, and a stale account is a security violation that can enable a breach of the public's records. Federal standards require revoking a separated person's credentials, and terminating a PIV card that can't be collected within eighteen hours. A ticket-driven process struggles to meet that. Records we can't trust: the phone book is wrong until someone files a ticket, and every change of manager means the organization, the manager and tool access are updated by hand. Approvals route through that same data. And cost and delay: every joiner, mover and leaver is help-desk work.

But the bigger why is where the mission is heading. Take one idea agencies have discussed: a shared call center, one front door for two agencies' customers. The hard part of an idea like that isn't the phones — cloud contact centers make the front end easy. It's the back end. Who is this agent? Which agency's records may they see? And does their access end the day they leave, in both agencies? Today each agency answers those questions by hand, and differently. A standardized, HR-driven identity answers them by rule, the same way everywhere.

And if we do nothing, HR moves to Core HCM, identity moves to Entra ID, and we rebuild the same manual process twice, on new platforms.

## Slide 3 — Four options, weighed against what leadership must balance

What should we do? There are four realistic options, and I've weighed each against what leadership actually has to balance: the mission and the public we serve, security, cost and resilience. Compliance matters, but on its own it isn't a reason to invest.

Option A is to keep ticket-driven identity. It needs no new investment, but the risk and the recurring manual work stay exactly where they are. That's the cost of doing nothing.

Option B is to automate inside the directories, with scripts and exports. It's quick and cheap, but it automates a source that isn't authoritative, so it spreads bad data faster, and it has to be rebuilt when HR changes platforms.

Option C is to wait for HR 2.0 and integrate afterward. That's defensible: it's less work this year. But the interconnection decisions are made during onboarding, about five months in. Waiting means retrofitting after go-live, and the Entra ID migration carries the tickets forward in the meantime.

Option D is to start now: make HR the source of truth, expressed in OPM's standard personnel data, and design it into both the HR onboarding and the Entra ID migration. It costs design effort up front and needs shared governance, which is why it scores only partial on cost.

The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step — data standards, ownership and the person key — is no-regret either way, and it can start today from the HR data the agency already has, with the source switched to Core HCM when it arrives.

## Slide 4 — Recommendation: HR as the source of truth, starting now

My recommendation is option D, phased, starting with the no-regret steps. Four reasons.

Mission and the public: access to the public's records should end when a person's role ends, automatically, the same day; the people who serve the public should have the right access on day one; and shared services like the call center become possible, because every agency describes its people the same way.

Cost: we build it once, while both platforms are being rebuilt anyway, and retire ticket work for routine joiners, movers and leavers.

Security: modern access, Zero Trust, is decided by attributes: organization, position, status, supervisor. So the accuracy of HR data becomes the accuracy of access. The federal mandates point the same way, but they're the floor, not the reason. And it gives the inspector general's perennial question — how do you know every account belongs to a current person? — a standing answer.

Resilience: by building on OPM's standard data rather than one vendor's fields, and on a person key the agency controls — often an existing enterprise ID, such as a Mainframe PIN — the design survives the next platform change.

Two honest limits. HR 2.0 covers federal employees only, so contractors need their own source: Core HCM's contingent worker record, or PIV sponsorship. And we should build only what HR is authoritative for.

The upside: every agency is moving to the same HR platform on the same standards, so one identity standard can serve them all, and the services they share.

## Slide 5 — Who: the owners, the partners, and my role

Who has to be involved. This is an organizational change as much as a technical one, so it matters who owns what.

HR owns the personnel data and its quality, at the source. When the data is wrong, it gets fixed in HR, not patched in the directory. And the OPM HR 2.0 program owns the platform, the standards and the interconnection.

The CIO's identity team uses that data to run Entra ID, Active Directory and access. Security sets the Zero Trust policy and owns the leaver path. And the help desk moves from routine tickets to handling the exceptions.

Then the guards and partners. The privacy office is in from the start, because using HR data for identity is a disclosure that needs a routine use and minimization. Contractor sponsors and the PIV office are the source for people HR doesn't cover. And partner agencies need the same standard if we're going to share services.

My role, as an enterprise data architect, is to own the standards, the crosswalk and the person key; to make sure every attribute has one accountable owner; and to carry the standard to the interagency committees and working groups where it gets adopted. The person model and its attributes also become a governed piece of the agency's data and metadata inventory, which auditors increasingly ask for.

## Slide 6 — How: data, security and operations

How we'd carry it out.

Data — this is where data architecture earns its keep. One governed crosswalk maps OPM's standard data elements into a canonical person model, keyed on an enterprise ID the agency controls, so a person stays the same person across rehire, conversion and reorganization, and when HR changes platforms only the source key changes. Personnel actions then drive the identity events — joiner, mover, leaver — by code, not by ticket. Contractors come from their own source into the same model.

Security. The leaver path blocks access first, within hours, and cleans up afterward. The integration runs with least privilege and no stored secrets. And anything that fails goes to a quarantine with an owner; nothing resolves itself silently.

Operations. We start now, from the HR data the agency already has, and switch the source to Core HCM when it arrives. We run in shadow mode first, comparing what HR says with what the directories hold, and fixing the gaps. We cut over one population at a time. And we close the ticket path for a population only when the data proves HR is the sole source.

The technology is the example, not the point. Here it's Oracle Core HCM feeding Microsoft's HR-driven provisioning into Entra ID and Active Directory, with access packages, lifecycle workflows and PIV downstream. If the vendors change, the design holds.

## Slide 7 — How we’ll know it works — and what I need

How we'll know it's working, and what I'd need.

Five measures, each baselined in the first phase, and each one a business measure leadership can read: time from separation to blocked access, in hours, well inside the eighteen-hour federal standard for terminating a PIV card; accounts tied to a person, with orphaned accounts trending to zero; joiner and mover tickets going down, with access ready on day one; the manager and organization in the directory matching HR; and every exception with an owner and an age. As a byproduct, the same data is evidence for the controls auditors ask about.

What I'd need from leadership is one decision: start HR-driven identity now, as a design requirement of the HR 2.0 onboarding and the Entra ID migration. And to act on it: a sponsor across HR, the CIO's identity team and privacy; identity named as a consumer in the HR 2.0 interconnection plan; data owners designated, and the enterprise person key confirmed; and a small team for the pre-onboarding data work.

Thank you. I look forward to your questions.
