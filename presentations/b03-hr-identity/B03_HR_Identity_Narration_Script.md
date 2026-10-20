# Book 03 — HR-Driven Identity — narration script (practice copy)

## Slide 1 — Why Should HR Decide Who Exists?

This briefing comes from Book 03 of the Modernization Workbook, HR-Driven Identity.

It has one proposal, and I'll take it through four questions, the way I'd take it to leadership: why it matters, what we should do, who has to be involved, and how we'd carry it out and know it's working.

Book 02 made the case that identity is now where every access decision is made. This book asks where the facts behind that identity should come from. The answer is the HR system of record, starting now.

## Slide 2 — Identity is built by hand, and the mission is outgrowing it

Why. In many agencies today, nothing connects HR to identity. Accounts, access and credentials are created and removed by ticket, and that costs three ways.

Access outlives the job. When someone leaves or changes roles, removal waits for a ticket. Yet the federal PIV standard, FIPS 201-3, requires a card that can't be collected to be terminated within eighteen hours of notification. A ticket-driven process struggles to meet that. Records drift: the phone book, the manager and the approval routing are wrong until someone files a ticket. And every joiner, mover and leaver is help-desk work.

Zero Trust makes the gap visible. A token proves cryptographically who signed it. It can't prove the claim is true: that the person still works here, still holds the position the access was granted for, still reports to the supervisor who approved it. Those are workforce facts, and they live in HR.

If we do nothing, HR moves to Core HCM, identity moves to Entra ID, and we rebuild the same manual process twice, on new platforms.

## Slide 3 — Why now: two migrations open one design window

Why now? Because two migrations open one design window.

On the HR side: the December 10, 2025 memo from OMB and OPM creates Federal HR 2.0, one government-wide core human capital platform. OPM awarded the platform contract on June 10, 2026, and the first agencies begin moving as fiscal year 2027 starts. The memo's sample timeline runs about eight months per agency, with the agency's interconnections going live around month five.

On the identity side: agencies are moving from Active Directory to Entra ID anyway, which is Book 02. In Entra ID, attributes drive Conditional Access, groups and delegation, and inbound provisioning from an HR system is a documented, supported path.

So there's a window. The identity feed has to be designed in during onboarding, before the interconnection goes live, not bolted on afterward.

One honest limit: Federal HR 2.0 covers federal employees only. Contractors and vendors need their own authoritative source, and the onboarding is the right time to decide it too.

## Slide 4 — Four options, weighed against what leadership must balance

What should we do? There are four realistic options, weighed against what leadership has to balance: the mission and the public, security, cost and resilience. Compliance matters, but on its own it isn't a reason to invest.

Option A keeps ticket-driven identity. No new investment, but the risk and the manual work stay where they are: the cost of doing nothing.

Option B automates inside the directories with scripts and exports. It's quick and cheap, but it automates a source that isn't authoritative, so it spreads bad data faster, and it has to be rebuilt when HR changes platforms.

Option C waits for HR 2.0 and integrates afterward. That's defensible, and it's less work this year. But the interconnection decisions are made during onboarding, so waiting means retrofitting after go-live.

Option D starts now: HR as the source of truth, expressed in OPM's standard personnel data and designed into both the HR onboarding and the Entra ID migration. It costs design effort up front and needs shared governance, which is why it's only partial on cost.

The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step, data standards, ownership and the person key, is no-regret either way.

## Slide 5 — One owner per fact, one model, one person key

What does "HR as the source of truth" actually mean? It means one owner for every fact.

The HR system of record is authoritative for employment status, position, organization, supervisor and effective dates. The identity platform stays authoritative for what it does: credentials, authentication, sessions, directory objects and policy. And contractors, whom HR 2.0 doesn't cover, get their own authoritative source mapped into the same model.

That model is the canonical workforce identity model. Its contract is OPM's standard data elements and nature-of-action codes, the government-wide personnel data standards, so vendor field names stay at the boundary and can be replaced. It's keyed on an enterprise person key the agency controls, and that key has to fit Entra ID's employeeId attribute, which holds at most sixteen characters.

The rule that makes it work: every attribute gets one name, one definition and one accountable owner. When a fact is wrong, it gets fixed in its source, never patched in the directory.

## Slide 6 — Provisioning: personnel records in, governed identities out

Provisioning turns personnel records into governed identities.

Core HCM publishes worker records and personnel actions. A small middleware, inside the agency's authorization boundary, does five things for every event: it validates the record, applies events in order, normalizes them to the SCIM standard, writes a provenance record, and reconciles the result. Then Entra ID's API-driven inbound provisioning creates and updates the accounts in Entra ID and, through the provisioning agent, in Active Directory. That interface has daily call limits that scale with the license, which the book sizes against the agency's population.

The design fails closed. Unknown worker types are refused. A failed record is retried and recorded, never silently skipped. And every event leaves a provenance record before the call returns, which is where the evidence comes from later.

The technology is the example, not the point. Today it's Oracle Core HCM feeding Entra ID. If the vendors change, the model and the rules hold; only the boundary changes.

## Slide 7 — Who owns, who uses, who guards

Who has to be involved. This is an organizational change as much as a technical one.

Owners. HR owns the personnel data and its quality, at the source. The OPM HR 2.0 program owns the platform, the standards and the interconnection. And each contractor source owns its own record.

Users. The CIO's identity team runs Entra ID, Active Directory and access from that data. Security sets the Zero Trust policy and owns the leaver path. And the help desk moves from routine tickets to handling exceptions.

Guards. The privacy office is in from the start. Sharing HR records with identity inside the agency normally rests on the Privacy Act's need-to-know provision, while disclosures outside the agency need a routine use, so the privacy office decides the basis for each leg, along with the privacy impact assessment and minimization. The PIV office owns issuance and termination. And the ISSO and authorizing official own the evidence and any accepted risk.

The data architect ties it together: owning the standards, the crosswalk and the person key, making sure every attribute has one accountable owner, and carrying the standard to the interagency forums where it's adopted.

## Slide 8 — Personnel actions drive joiner, mover and leaver

How. Personnel actions drive the three identity events, by code, not by ticket.

A joiner gets an account and baseline access ready on day one. A mover has the old assignment's access removed, the new baseline applied, and any exceptions reviewed. And a leaver is blocked first: the account disabled and sessions revoked at the effective separation time, then credentials, devices and access removed in parallel, each one reconciled.

The book is precise about what the platform actually does. Lifecycle Workflows run on one tenant-wide schedule and need an Entra ID Governance license. Revoking sessions stops new tokens being issued, but tokens already issued last until they expire. Privileged leavers need their own verified block path, because the built-in disable task doesn't support users with admin roles. And synced users must be deleted in Active Directory, or the next sync brings them back.

Credentials follow the same events: PIV issuance, certificate binding and termination, and device certificates retired before the account is deleted.

## Slide 9 — From attributes to access, with evidence built in

Next, access. Once the attributes are trustworthy, access is derived from them. A personnel record becomes a canonical attribute, a rule or access package turns that into an entitlement, and an evidence record captures why. Every entitlement then traces back to a rule, an approved exception, an authoritative attribute, or a privileged-access decision. That's what makes access explainable.

Drift is found by comparison, not by complaint: scheduled checks compare HR, the model and the directories. It's measured in business terms leadership can read: time from separation to blocked access, orphaned accounts, and access ready on day one. And the records have to be kept long enough. Entra ID keeps audit and provisioning logs for thirty days with P1 or P2, so the book exports them from the pilot onward.

The evidence comes as a byproduct. The same records that run the lifecycle answer the auditor's oldest question: does every account belong to a current person with a current reason?

## Slide 10 — Seven phases, each gate the next phase's precondition

The execution plan has seven phases, and each gate is the next phase's precondition.

Phase zero aligns the program, naming identity as a consumer in both migrations. Phase one settles attribute authority and the schema. Phase two builds and tests the pipeline. Phase three is the pilot. Phase four turns on lifecycle automation and attribute-derived access. Phase five cuts over population by population. And phase six sustains it.

Four rules run through it. Start now, from the HR data the agency already has, and switch the source to Core HCM when it arrives. Run in shadow mode first, comparing what HR says with what the directories hold, and fix the gaps. Cut over one population at a time, with a signed validation report and a rollback. And close the ticket path for a population only when the data proves HR is the sole source.

The gate thresholds, like ninety-nine percent correlation, are proposals. They're starting criteria the agency approves through its own risk governance, not federal requirements. Chapter 13 walks an illustrative agency through all seven phases.

## Slide 11 — How we'll know it works, and what we need

How we'll know it's working, and what we need.

Five measures, each baselined in phase one, and each one a business measure leadership can read. Time from separation to blocked access, in hours. Accounts tied to a person, with orphaned accounts trending to zero. Joiner and mover tickets going down, with access ready on day one. The manager and organization in the directory matching HR. And every exception with an owner and an age.

What we need from leadership is one decision: start HR-driven identity now, as a design requirement of the HR 2.0 onboarding and the Entra ID migration. And to act on it: a sponsor across HR, the identity team and privacy; identity named as a consumer in the HR 2.0 interconnection plan; data owners designated and the person key confirmed; and a small team for the pre-onboarding data work.

Book 03 has the full design, with every external claim footnoted, and Book 02 covers the directory migration it builds on. Thank you.
