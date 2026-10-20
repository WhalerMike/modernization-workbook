# HR-Driven Identity — narration script (practice copy)

## Slide 1 — HR-Driven Identity Modernization

Good morning, and thank you.

I want to make one proposal.

In many agencies today there is no HR-driven identity. Accounts in Active Directory and Entra ID, and the access and credentials that hang off them, come from tickets and manual process.

Two changes are coming regardless: Federal HR 2.0 moves each agency's HR onto Oracle Core HCM in waves through 2027, and agency identity is moving from Active Directory toward Entra ID. My proposal is to use the two together to start HR-driven identity — HR, through OPM's standard personnel data, as the source of authority for Entra ID, Active Directory and the rest of ICAM. That's Microsoft's own term: HR-driven provisioning.

## Slide 2 — HRIT is coming — build identity into it

The thesis in one slide.

On the left, two migrations that happen regardless: HR moves to Core HCM, and identity moves from Active Directory toward Entra ID. Meanwhile nothing connects HR to identity today — accounts come from tickets.

In the middle, what OPM leaves to us. OPM fixes the HR side; how the agency's directories and ICAM consume that data is the agency's decision. And the solicitation requires SCIM 2.0 provisioning — exactly what Entra ID consumes.

On the right, the proposal: start HR-driven identity, with HR as the source of authority, expressed in OPM's standard attributes.

So the real choice is: carry ticket-driven identity through both migrations, or start HR-driven identity once, while both platforms are being rebuilt anyway.

## Slide 3 — Why we need HR-driven ICAM now

Why we need HR-driven ICAM at all — and why now.

Zero Trust is federal strategy — OMB M-22-09, with NIST SP 800-207 as the architecture and CISA's maturity model as the yardstick. SASE is how it's delivered: security enforced at a cloud edge close to the user, which TIC 3.0 opens up for agencies, instead of at our network perimeter. And SASE's decisions are driven by ICAM: the user presents a token from a PIV card or phishing-resistant MFA, and Entra ID decides access through Conditional Access and dynamic groups that read the user's attributes.

In the perimeter era, a wrong department meant a wrong phone-book entry. Now it means the wrong groups, and so the wrong access — and a stale status is worse than ever. In the perimeter era an orphaned account was already a standing security violation that could enable a breach. Now it's a valid token for someone who has left, usable from anywhere, because there is no perimeter left to stop it. When access is decided by attributes, the accuracy of employee data is the accuracy of access.

## Slide 4 — The everyday impact of manually provisioned ICAM

Why this matters to everyone who works in an agency.

In many agencies Active Directory feeds the phone book, and nothing feeds Active Directory from HR. Titles, offices, phone numbers and managers stay wrong until someone notices and files a ticket.

And every time someone changes management, their organization, their manager and their access to tools have to be updated by hand, after the fact, by ticket.

HR already knows all of it. With HR-driven IT, the personnel action that records the reassignment updates the organization and manager in Entra ID and Active Directory, and the phone book, the approval chain and tool access follow from the authoritative source — instead of each person, and the help desk, keeping them current by hand.

## Slide 5 — The window closes at the agency’s interconnection go-live

The window.

The December 10, 2025 OMB/OPM memo directs one government-wide Core HCM platform. Oracle Fusion Cloud HCM was awarded June 11, 2026. First go-lives are January to March 2027. Wave 2 agencies follow in fiscal 2027. For an agency not yet on the platform, that's the point: about eight months of onboarding, with interconnections live around month five, still lie ahead. By fiscal 2028 EHRI and eOPF are decommissioned.

I'd describe that not as a deadline but as a window. Inside it, the data standards, the cleanup, the interconnection design — and, on our side, the Entra ID migration plan — are all being decided, and an HR-driven identity feed can be written into them. After it closes, both migrations finish with ticket-driven identity carried forward, and adding HR-driven identity later means reopening both.

## Slide 6 — Drive identity from OPM’s standard HR data

This is the heart of the proposal, and it's the programmatic data knowledge.

OPM already defines the personnel data every agency records. Agency and subelement give the legal employer and component. Duty station is the location of record. Series, pay plan and grade give a position category for role-based access. Supervisory status tells us who can approve and review. Tenure and appointment type drive the worker type. And the nature-of-action code, with its effective date, tells us what just happened — next slide.

Why build on OPM's standard rather than on Oracle's field names? Because OPM defines these elements and their codes the same way for every agency. We map them to Entra ID and AD once, for every employee population — and if the HR vendor ever changes, the mapping still holds.

One honest limit: HRIT covers federal employees only. Contractors and vendors live in COR spreadsheets today. My best bet is Core HCM's Contingent Worker type — a person record, an assignment and a lifecycle much like an employee's, though it has no vendor-management layer. The alternative is to source them from PIV sponsorship. That's a decision to put in front of the program early.

## Slide 7 — Personnel actions drive the lifecycle — by code, not by ticket

Personnel actions drive the lifecycle.

For federal employees, every personnel action carries a nature-of-action code, and the families map cleanly to identity events: the 100 series are joiners, the 700 series movers, the 500 series conversions, the 300 series separations. Contractors have no SF-50; their events come from contract start and end dates.

Two families matter more than people expect. The 400 series — furlough, leave without pay, suspension — is not a leaver; the person is still employed and policy restricts the account. The 200 series, return to duty, lifts those restrictions. Getting this wrong either locks out people on leave or leaves access open for people who've left.

The codes also settle precedence — a separation wins — and rescinded offers.

## Slide 8 — Model the person, not the account: layered identifiers

Identifiers are where data architecture earns its keep.

A common design says the employee ID is the person, for life. It breaks the moment the source changes, a contractor converts, or someone is rehired. So I model identifiers in layers: an enterprise person key the agency controls; a source key per HR system; an affiliation key per employment or contract; a directory ID per account; and credential identifiers per PIV or certificate.

The person is the tracked entity, not the account. That's what survives rehire, conversion and reorganization. And many agencies already have one — for example, a Mainframe PIN that already serves as the person ID and employee ID. Then the decision is to confirm it as the enterprise key and map Core HCM's PersonNumber to it — so when the agency moves to Core HCM, only the source key changes, and nothing downstream has to.

## Slide 9 — HR → canonical model → Entra ID and AD → ICAM

Logical and physical modeling, following the data from HR to ICAM.

In the middle is the logical model: a person with an enterprise key the agency controls — their assignments, and the lifecycle events that change them. On the left, the OPM element that feeds each field; then where it lands in Entra ID and Active Directory; and on the right, what ICAM does with it — component scope, location policy, role-based access, approvals, and the joiner, mover and leaver actions, including PIV.

Three physical rules: native attributes first; codes, never display strings, in anything that grants access; and one governed crosswalk as the only place mappings live.

## Slide 10 — Logical architecture and Microsoft realization

Logical architecture and Microsoft realization.

The top row is the architecture, and it's stable: an authoritative source, a boundary transformation, the governed identity model, a provisioning service, and the targets and ICAM. The bottom row is how Microsoft realizes it today: Oracle Core HCM, Azure Functions, the canonical model and provenance store, Graph and the Entra provisioning service, then Entra ID, AD, Intune and card management. Products in the bottom row can change; the top row doesn't.

The table is why the two migrations belong together. Done separately, the Entra ID migration moves ticket-created accounts as they are. Done together, each population arrives in Entra ID already HR-sourced.

## Slide 11 — ICAM: attributes drive credentials, assurance and access

ICAM — beyond accounts.

Credentials: the joiner event schedules PIV enrollment. The leaver event blocks sign-in and revokes sessions first — Microsoft's documented order, and the step that closes certificate sign-in immediately rather than at the next revocation-list refresh — then revokes PIV, derived credentials and device certificates in parallel, reconciled to completion.

Assurance: record each person's proofing level and authenticator assurance as governed attributes, treat missing proofing evidence as a finding, and enforce phishing-resistant MFA under M-22-09.

Access: baseline access derived by rule from the standard attributes; privileged eligibility by position, through PIM, never standing; and any activity from a separated person is an alert.

The result: every entitlement has a "because" — a rule, an attribute, and the personnel action that set it.

## Slide 12 — Privacy by design: HR data in identity is a disclosure

Privacy — which is where a data architect earns trust with HR.

Moving HR attributes into a directory is a disclosure of personnel records. So: confirm the routine-use basis under the governing system-of-records notices — OPM/GOVT-1 for general personnel records, plus the agency's own — before anything flows. Minimize: send only attributes an identity decision actually reads, as codes rather than narrative, and never use the SSN as a join key. Update the privacy impact assessment for the new flow and its consumers. And protect the flow: encrypt every leg, and keep logs to the person key and a payload hash rather than the record itself.

The principle underneath: HR remains the system of records; identity is a governed consumer that never writes an HR-mastered fact back.

## Slide 13 — The governance I’d bring to deliver it safely

The governance I'd bring to deliver it safely.

The data foundation first: an authority map with one owner per attribute, and an enterprise person key the agency controls. A security assessment of the data flow. An acceptance gate with a signed validation before cutover. And a cutover that proves HR is the sole source for a population before the ticket path closes for it.

Then the operating rules on the bottom row, from lifecycle rules through change control.

Together that produces evidence for AC-2, PS-4, PS-5, IA-4 and SI-12 as a byproduct of operating — supporting those controls, not claiming to close them on its own.

## Slide 14 — One standard for HR-driven ICAM, shared across agencies

One standard, shared across agencies.

Every agency is moving to the same Core HCM on the same OPM data standards. If one agency defines HR-driven ICAM as a standard — crosswalk, canonical model, identifiers and evidence — other agencies can reuse it instead of building their own. And attributes that mean the same thing everywhere make details, transfers, shared services and cross-agency access easier.

That's the work an enterprise data architect does: working the issues with other agencies and industry, developing options and predicting their impact, and serving as the data expert on interagency committees and working groups. The goal: present this model to our fellow agencies, and adopt it together.

## Slide 15 — Roadmap and the ask

The roadmap and the ask.

Now: align with the agency's HR 2.0 team so identity is a named consumer of the interconnection. Before onboarding: the crosswalk, authority map, contractor source and privacy basis. Then build and prove in shadow mode, cut each population over as it moves to Entra ID, and sustain it with metrics.

So the ask is simple: decide now to start HR-driven identity, and build it into both the HR 2.0 onboarding and the Entra ID migration — so that Zero Trust and SASE decide access on accurate data.

My contribution as an enterprise data architect: establish authority, identifiers, standards, lineage and evidence, so workforce events produce measurable identity outcomes.

Thank you — I look forward to your questions.

## Slide 16 — More modernizations I’ve designed

HR-driven identity is one piece of a larger set of modernizations I've designed over the last several years: the AD to Entra ID migration, next-generation DNS and IP address management, field office WAN and data-center consolidation, the TIC 3.0 branch edge, the client-server to hybrid cloud path, SQL Server identity, the move from Group Policy to Intune and Azure Arc, and continuous compliance against SCuBA, BOD 25-01 and FedRAMP 20x.

They share the same data discipline you just saw: a named authority for every fact, a governed model, and evidence produced by operation. I'm happy to go into any of them.
