# Contractor Identity Source — narration script (practice copy)

## Slide 1 — Who is authoritative for a contractor?

The interview deck makes one honest limit explicit: published Federal HR 2.0 scope centers on the federal employee lifecycle, so a contractor authority decision is required. In the processes I have observed, contractors are tracked in COR spreadsheets. This companion goes one step further. It asks which record should be authoritative for a contractor, and it adds an option the main deck doesn't name: the agency's contractor suitability register.

The one-sentence version: don't wait for one contractor feed. Most agencies maintain contractor information in several operational contexts. Evaluate them as candidate authorities, give each fact one authority, and hang the record on an accountable federal sponsor.

## Slide 2 — Contractors need an equivalent personnel authority

Three facts that don't fit together.

First, scope. The Federal HR 2.0 memo of December 10, 2025 scopes Core HCM to personnel action processing, the employee system of record and the federal employee lifecycle. The June 2026 Oracle award covers civilian employees. Neither establishes contractor treatment in the sources reviewed. Oracle Fusion HCM can hold contingent workers as a product, but the program doesn't commit to it.

Second, what I have observed. In the processes I have observed, contractors are tracked in COR spreadsheets, and many of their accounts come from tickets. Based on current visibility, nothing authoritative tells identity that a contractor's engagement has ended.

Third, guidance. Federal lifecycle guidance, including GSA's ILM Playbook, calls for an authoritative personnel source for identity creation and termination, and CDM's master user record must include contractors. Employee HR may not carry them, so contractors need an equivalent authoritative personnel source. Something else has to be the authority, and it needs the same rigor as the HR record.

Sources: OMB/OPM, Creating Federal HR 2.0 (2025-12-10); GSA ILM Playbook v2.0; FIPS 201-3 and OMB M-19-17 cover employees and contractors; NIST SP 800-53 PS-7 (external personnel security).

## Slide 3 — Three operational contexts hold contractor information

The useful finding: most agencies aren't starting from zero. Contractor information usually appears in several operational contexts.

COR spreadsheets: real, but kept per COR, with no common format or timing. They're evidence, not a source.

The contractor suitability register: many agencies keep one, under personnel security or contracting. It typically holds contractors working on agency contracts, with the suitability determination and its date. Its coverage, contract identifiers, lifecycle fields, owner, interface and update cadence require validation.

PIV enrollment: the credentialing system enrolls employees, contractors and other personnel. It covers identity proofing and background-investigation workflows, and the card management system issues the credential. That makes it a candidate source for proofing and credential status; its authoritative fields and population coverage require confirmation.

What's usually missing is any link from these to Entra ID or Active Directory: contractor accounts come from tickets.

Core HCM's Contingent Worker type is a possible fourth source later, if the agency chooses to configure it. It won't exist before the agency's Core HCM onboarding wave.

Sources: FIPS 201-3 and OMB M-19-17 (PIV for employees and contractors); NIST SP 800-53 Rev. 5, PS-7 (external personnel security).

## Slide 4 — Four candidate sources, compared

Same four sources, against the facts identity needs.

COR spreadsheets exist now, but they're not a governed record. Use them to reconcile, not as a source.

Core HCM's Contingent Worker type would give a person record and an assignment with dates, like an employee's. But it has no contract or vetting data, it sits outside the Federal HR 2.0 program scope, and current planning puts it no earlier than 2027.

Where an agency keeps a contractor suitability register, it is the only one that links a person to an agency contract with a suitability decision. What varies by agency: who owns it, how it's accessed, how fast it's updated, and whether it records the end of an engagement.

PIV enrollment covers everyone with a badge and carries proofing and background-investigation status. But it manages a card, not an identity with an organization and entitlements, and it misses anyone who works without a PIV card.

So the answer isn't to pick one. It's to give each fact one authority. Next slide.

## Slide 5 — Working position: one fact, one authority

I propose this working position; it is not yet a decision. It's the same discipline as the employee design: a named authority for every fact.

I propose the contractor suitability register as the candidate authority for existence, the contract link and suitability, subject to the questions on the next slide. If it also records the end of the engagement, it becomes the contractor's leaver signal, the equivalent of a separation action. That's the first thing to confirm.

PIV enrollment is the authority for proofing and credential status. Identity reads it and cross-checks it. A badge with no contractor record, or a contractor record with no badge, is a finding.

The accountable party is a federal employee sponsor, normally the COR, mastered in HR. The contractor's organization placement is an explicit authoritative assignment; the sponsor's organization is a default only where policy confirms that relationship.

I propose the enterprise person key, the same as for employees, proposed for confirmation. Many agencies already issue it to contractors along with their PIV card, for example as a Mainframe PIN. Where they do, a contractor is keyed exactly like an employee, and keeps the same key on a new contract; in the proposed canonical model, conversion to federal employment creates a new affiliation for the same person.

On the right: access ends at the earliest of five events. The last two close the gap the Digital Worker playbook leaves open: what happens when the sponsor leaves. The sponsor is a live reference into HR, not a name on a form.

Design reference: the proposed sponsored-identity pattern, with an accountable sponsor, a governed engagement record, identity linkage, recertification and explicit end conditions. The PIV cross-check follows FIPS 201-3; separation follows NIST SP 800-53 PS-4 and PS-7.

## Slide 6 — What must be true before a register can be an authority

Six things to establish before calling a suitability register an authority. The first two decide whether it can be the leaver signal at all.

Owner: is it contracting or personnel security? The owner has to accept identity as a named consumer, just as I'm asking HR to.

Content: if the register records only the suitability decision and its date, it's a vetting source, not a lifecycle source. Then the end date has to come from the contract record or from the sponsor.

Freshness: if the register is keyed by hand from COR spreadsheets, it inherits their lag, and every separation delay carries over to contractors.

Privacy: which SORN covers the register, and does a routine use cover disclosure to identity systems? It's the same question the main deck asks for HR data.

Join on the key: if contractors may already get the enterprise key with their PIV card, confirm coverage and timing. The question is also whether the register records it. If it does, the register, PIV enrollment and the directories join on one key. If not, the first job is a crosswalk from the register to the key.

Coverage: who works without a PIV card and isn't in the register? Those people still need a sponsor-only path.

Source: the register's owner, and the agency's SORN and PIA catalog.

## Slide 7 — Sequence: start with what already exists

Start with what already exists, and start read-only.

Now: reconcile the register and PIV enrollment against the contractor accounts in AD and Entra ID. The output is unmatched accounts, unmatched contractor records, credential mismatches, and any records the available source shows as expired or inactive. Nothing is written to any directory. That measures the problem before anyone is asked to change a process.

Before Core HCM: I propose that the register plus sponsor attestation become the contractor source, once the contractor authority decision is made. Ship the leaver trigger first, because that's where the risk is, then the joiner. Mismatches between badges and records become findings.

At Core HCM go-live: decide whether to configure the Contingent Worker type. If the agency adopts it, it holds the person and the assignment, and the register stays the authority for the contract and suitability. Either way, the identity pipeline doesn't change. It reads one canonical record whatever the source.

The ask is small: make the contractor authority decision, evaluating the suitability register, sponsorship, and contingent-worker records; name its owner; validate the planning assumptions with the data owners; and give read access to the register for a shadow reconciliation.
