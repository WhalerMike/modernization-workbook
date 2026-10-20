---
title: "Chapter 07 — Who Owns Workforce Identity"
description: "Who owns the workforce data (HR, the OPM Federal HR 2.0 program and the contractor sources), who uses it, who guards it, the data architect's role as steward of one model and one key, a responsibility matrix for the key decisions, and where ownership commonly fails."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b03-hr-identity
book: B03
part: Who
series-order: 7
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 07 — Who Owns Workforce Identity

*HR-driven identity is an organizational change before it is a technical one: every attribute needs one owner who can fix it, and every decision needs one person who can say no.*

::: {.callout-note}
## In this chapter
Who owns the workforce data, who uses it and who guards it. The data architect's role: one name, one definition and one accountable owner per attribute, one logical model and one person key. A responsibility matrix for the decisions that HR-driven identity forces. The ways ownership usually fails, and what the program does about each.
:::

Chapters 04 to 06 decided which *system* is authoritative for each fact. This chapter decides which *people* are. The two aren't the same question. A system of record can be authoritative for worker type and still hold the wrong value for half the contractors, if no office accepts that keeping it right is its job. The [Book 02 chapter on migration ownership](../b02-identity/06-who-owns-the-migration.md) covers the people who move the directory: the sponsor, the authorizing official, the CISO, identity engineering, the AD administrators and the help desk. This chapter doesn't repeat those roles. It adds the people who own, guard and use the *data* the directory will be driven by, most of whom sit outside the CIO's organization.

Federal policy names most of these offices but leaves their relationship to the agency. OMB M-19-17 directs each agency to designate an integrated, agency-wide ICAM office, team or other governance structure, and says it should include personnel from the offices of the CIO, the CFO, Human Resources, General Counsel, the CISO, the Senior Agency Official for Privacy, the Chief Acquisition Officer and the officials responsible for physical security.[^c07-m1917] NIST's Risk Management Framework defines the accountable roles, including the information owner or steward, the system owner, the system security officer and the authorizing official.[^c07-sp80037] FIPS 201-3 and its companion guideline set out the PIV processes.[^c07-fips201][^c07-sp80079] None of them says who decides what an organization code means, who may change the person key, or who is accountable when a contractor's access outlives the contract. That's the program's recommended model, set out below as design.

![Who owns workforce identity: HR, the OPM Federal HR 2.0 program and the contractor sources own the data; the data architect stewards one model and one key, with the privacy office, the PIV office and the ISSO and authorizing official guarding it; the CIO identity team, security, the help desk and application owners use it.](../../images/diagrams/b03-hr-identity/svg/ch07-owners-users-guards.svg){#fig-ch07-owners-users-guards fig-alt="Three rows of cards. The top row, in amber, holds the owners: HR, which owns personnel data and its quality at the source; the OPM Federal HR 2.0 program, which owns the platform, the data standards and the interconnection; and the contractor sources, meaning the sponsor or COR, PIV sponsorship and the contingent worker record. Arrows labelled personnel facts, standards and contractor facts run from the owners to a blue card in the middle row, the data architect, who stewards one model, one key and one owner per attribute. Beside the data architect in the middle row are three violet guard cards: the privacy office (routine use, PIA, minimization), the PIV office (sponsorship, proofing, issuance, termination) and the ISSO and authorizing official (authorization, risk acceptance, evidence). Blue arrows run from the data architect down to four green cards in the bottom row, the users: the CIO identity team (Entra ID, AD, provisioning, access), security (Zero Trust policy and the leaver path), the help desk (exceptions, not routine tickets) and application owners (access rules for their applications)."}

## Who owns the data

### HR owns personnel data and its quality, at the source

HR owns the facts that only a personnel action creates: that a person is a worker, of what type, in which position and organization, at which duty station, reporting to whom, from and until when (Chapter 04). Owning them means more than holding them. It means HR accepts a quality expectation for each attribute identity reads, and when a value is wrong it is fixed in HR, not patched in the directory. OPM already places that responsibility with the agency for the government-wide data it collects: its data-standards guidance is addressed to the agency officials who prepare, submit and *correct* HR, payroll and training data.[^c07-opm-data]

In NIST's terms HR is the **information owner** for personnel data: the official with statutory, management or operational authority for the information, responsible for the policies that govern its generation, collection, processing, dissemination and disposal. That responsibility doesn't end when the data is shared. The information owner sets the rules for its appropriate use and keeps that responsibility when the information goes to other organizations.[^c07-sp80037] An identity feed is one of those uses. HR doesn't stop owning the department value because a dynamic group now reads it.

The program asks three concrete things of HR: name an owner for each HR-mastered attribute the authority map lists, own the controlled code lists that access attributes carry (Chapter 10), and treat a reassignment of direct reports after a supervisor separates as HR work, not IT work (Appendix A).

### The OPM Federal HR 2.0 program owns the platform, the standards and the interconnection

OPM owns the government-wide definitions. Its data standards, now kept in an online metadata repository, define the personnel data elements and their codes, and changes go through OPM's own data element request process.[^c07-opm-data] An agency doesn't change what a nature-of-action code means; it maps to it (Chapter 06). Under Federal HR 2.0, OPM and OMB also own the Core HCM platform and its rollout (Chapter 03). The December 10, 2025 memo asks each agency to name an integrated project team point of contact and points of contact for interagency working groups on policy, data, learning and super users, and to define integration points, identify interfacing systems and document data flows. It also says OMB and OPM will stand up a Federal HR 2.0 Advisory Board and use the government-wide councils, the Chief Data Officers Council among them, for updates on implementation.[^c07-hr20]

So the agency doesn't own the HR platform, but it does own its side of the interconnection. The program's position is that the identity feed is named in that inventory, as Chapter 12's Phase 0 requires, and that the agency's data working-group representative carries the identity view into those meetings. That's how one identity standard can spread across agencies that share the same platform and the same data standards.

### Contractor sources own the people HR doesn't cover

Federal HR 2.0 is a program for federal employees. Contractors and vendors need their own source, and Chapter 06 sets out the options and the rule: no single source is complete, so each fact identity needs has one authority, and the whole record hangs on an accountable federal sponsor. In ownership terms that means:

- The **contracting officer's representative** (or another federal sponsor, mastered in HR) owns the engagement: that the contractor works on this contract, for this sponsor, until this date. The COR spreadsheet stops being the record; the sponsor becomes a live reference with a recertification cycle.
- **Contracting or personnel security**, whichever keeps the contractor suitability register, owns the contract link and the suitability determination.
- The **PIV office** owns sponsorship processing, identity proofing and credential status.
- If the agency configures the Core HCM **contingent worker** type, HR owns that record as it owns an employee's, and the register stays the authority for the contract and suitability (Chapter 06).

Sponsorship is an ownership decision the agency can't hand to a contractor. NIST's guideline for authorizing PIV card issuers says only the organization can decide which of its employees and contractors must apply for a PIV card (sponsorship) and under what conditions the application is approved (adjudication), so those two functions can't be outsourced.[^c07-sp80079]

## Who uses it

The users consume governed projections of the data. None of them owns the HR-mastered values, and none of them should be able to change one.

- **The CIO's identity team** runs Entra ID, Active Directory, the provisioning services and the access model built on them (Chapters 05, 08 and 10). It owns the identity-platform facts: accounts, UPNs, authentication, sessions, group membership by rule. In Entra ID, configuring an API-driven inbound provisioning app needs at least Application Administrator, plus Hybrid Identity Administrator when the target is on-premises AD.[^c07-api-config] Lifecycle Workflows Administrator and Identity Governance Administrator are both privileged roles.[^c07-entra-roles] The program assigns them through PIM, as Book 02 describes.
- **Security** sets the Zero Trust policy that reads the attributes (Chapter 02) and owns the leaver path end to end: the block threshold, the order of the leaver sequence and completion of every revocation (Chapters 08 and 09). Revocation touches HR, identity, the PIV office and endpoint management, so a single owner of the outcome is what keeps it from stalling between them.
- **The help desk** moves from routine joiner, mover and leaver tickets to exceptions: quarantined records, failed revocations and the people the pipeline can't serve yet (Appendix A). It routes data errors to their owner; it doesn't correct them. That boundary needs an Entra boundary to match. User Administrator can update most user properties for all users,[^c07-entra-roles] which would make the help desk a second writer of HR-mastered attributes. Helpdesk Administrator, by contrast, can reset passwords and invalidate refresh tokens, and can be scoped to an administrative unit.[^c07-entra-roles]
- **Application owners** decide which access their application grants and to whom, using the attributes the feed carries (Chapter 10). NIST notes that the decision about who may access specific information in a system may sit with the information owner rather than the system owner.[^c07-sp80037] The program treats the application owner as the decider for access rules on that application and HR as the owner of the attribute values those rules read.

## Who guards it

### The privacy office

HR records are a Privacy Act system of records, so moving them into identity systems is a disclosure that needs a basis (Appendix B). The Privacy Act lets an agency disclose a record to its own officers and employees who need it for their duties, and outside the agency for a **routine use**, meaning a use compatible with the purpose for which the record was collected, described in the system-of-records notice.[^c07-privacy-act] OMB's guidance on the Act describes a routine use as a disclosure outside the agency that maintains the system, says routine uses must be narrowly tailored, and says a new or significantly modified routine use can't be relied on until at least 30 days after it is published in the Federal Register.[^c07-a108] Which basis applies to the identity feed depends on who maintains the records and where the HR platform runs, which is why the decision belongs to the privacy office and not to the project.

The Senior Agency Official for Privacy has agency-wide responsibility and accountability for the privacy program, and OMB Circular A-130 requires agencies to limit the collection, use and disclosure of PII to what is legally authorized, relevant and reasonably deemed necessary.[^c07-a130] NIST's RMF gives the same official the review and approval of privacy plans before a system is authorized.[^c07-sp80037] OMB's guidance on privacy impact assessments lists, among the changes that need a new or updated PIA, merging or matching databases that hold identifiable information and business-process changes that create significant new uses or disclosures.[^c07-m0322] An HR-to-directory feed does both. In the program's model, the privacy office decides the basis, approves the minimized attribute set and the PIA, and is consulted on every schema change that adds an attribute. It is brought in at Phase 1 (Chapter 12), because the timelines above can't be compressed at go-live.

### The PIV and credentialing office

The PIV office runs the credential that most federal workforce users sign in with (Chapter 09). FIPS 201-3 requires that a credential be issued only after a proper authority has authorized it, the individual's identity has been verified and the individual has been vetted, and that identity proofing, registration, issuance and reissuance follow the principle of separation of duties, so that no single individual can issue a PIV card without the cooperation of another authorized person.[^c07-fips201] NIST's issuer guideline names the processes an issuer has to run: sponsorship, identity proofing and registration, adjudication, card production, activation and issuance, and maintenance.[^c07-sp80079] Many agencies staff them as separate sponsor, registrar and issuer roles. That staffing is agency practice: FIPS 201-3 itself states a separation-of-duties requirement, not a list of named roles, and NIST's issuer guideline expects the roles and responsibilities to be described in the issuer's operations plan.[^c07-sp80079]

The PIV office also owns termination. FIPS 201-3 requires termination when, for example, an employee separates or a contractor changes positions and no longer needs access, and requires the normal termination procedures for a card that can't be collected to be completed within 18 hours of notification.[^c07-fips201] That clock starts with a notification, and in HR-driven identity the notification is the separation record. The PIV office decides how its card management system receives it; security owns the leaver sequence it is part of.

### The ISSO and the authorizing official

The feed, the middleware and the directories sit inside an authorization boundary. The system security officer keeps that system's security posture in place day to day and advises on its controls; the authorizing official is the only organizational official who can accept security and privacy risk on the organization's behalf, and approves memorandums of agreement or understanding.[^c07-sp80037] NIST SP 800-47 Rev. 1 covers the agreements that govern an information exchange between systems,[^c07-sp80047] which is what the interconnection with Core HCM is. In the program's model the ISSO owns the evidence (Chapter 11 and the Appendix B checklist) and the phase gates (Chapter 12), and the authorizing official decides the residual risks the program carries instead of removing: a population left on tickets, a leaver threshold looser than the policy, a contractor source still keyed by hand.

## The data architect: one model, one key, one owner per attribute

Every role above owns part of the picture. The **enterprise data architect** is the role that keeps the parts consistent: the steward of the canonical workforce identity model rather than the owner of any value in it. NIST describes enterprise architects as building a holistic view of the organization's missions, processes, information and IT assets,[^c07-sp80037] and OMB describes agency data governance as a shared activity among many data stewards, convened by the Chief Data Officer through the agency's Data Governance Body.[^c07-m1923] The program places the workforce identity model under that body, so the person model and its attributes become a governed data asset like any other.

The architect's job reduces to four rules:

- **One name.** Each attribute has one canonical name in the model and one mapped carrier in each system (Chapter 06). "Org code," "department ID" and `extensionAttribute10` are one attribute, not three.
- **One definition.** Each attribute has a written meaning, tied to the OPM standard element where one exists, with its allowed values.
- **One accountable owner.** Each attribute has one office that can fix a wrong value, named by role so it survives turnover.
- **One key.** The enterprise person key (Chapter 04) is the join for every source, account and credential. The architect keeps the identifier decision record; the ICAM governance body makes the decision.

Chapter 01 says no source field should drive access until the agency has approved its owner, meaning, values, quality expectations, correction path and permitted use. The architect turns that sentence into a record per attribute:

| Field | Organization code | Leave date | Worker type | Contractor sponsor |
|---|---|---|---|---|
| Canonical name | Organization code | Leave date | Worker type | Accountable sponsor |
| Definition and values | The OPM-standard organizational code for the assignment; HR's code list | Effective date and time of separation or engagement end | Employee, contractor, intern, volunteer, vendor, external; the agency's taxonomy | The federal employee accountable for the engagement |
| Authoritative source | Core HCM assignment | Core HCM separation action; contract record for contractors | Core HCM worker record; contractor source | Contractor source, as a reference into HR |
| Owner (fixes it) | HR | HR; contracting for contractors | HR; contracting for contractors | Contracting (the COR) |
| Quality expectation | Matches the assignment of record | Recorded before the effective date | Matches the appointment or contract | Recertified on the agreed cycle |
| Writer in Entra ID and AD | Provisioning service only | Provisioning service only | Provisioning service only | Provisioning service only (as `manager`) |
| Permitted use | Access targeting, scoping, reporting | Leaver workflow trigger | Policy baseline, license, access ceiling | Approvals, reviews, recertification |
| Privacy approval | In the minimized set | In the minimized set | In the minimized set | In the minimized set |

: The ownership record for an attribute, with four examples (illustrative values) {.striped .hover}

![The ownership chain for one attribute: the OPM standard defines the element, HR owns each person's value and its quality, the data architect stewards the name and definition, the provisioning service is the only writer, and consumers only read; corrections flow back to the owner.](../../images/diagrams/b03-hr-identity/svg/ch07-attribute-ownership-chain.svg){#fig-ch07-attribute-ownership-chain fig-alt="Five cards from left to right joined by arrows. Amber: OPM standard, defines the element and its codes. Amber: HR, owns each person's value and its quality. Blue: data architect, stewards one name, one definition and one owner. Blue: provisioning service, the only writer to Entra ID and AD. Green: consumers, which read the value in rules, access packages and Conditional Access. A red dashed arrow labelled corrections flow upstream runs from the consumers back to HR."}

The record is what makes the operating rules of Chapter 04 enforceable. "Corrections flow upstream" needs an upstream with a name. "No manual edits to HR-derived attributes" needs a list of which attributes those are and who the one writer is. Microsoft's guidance makes the same point from the other direction: before an attribute is used in a dynamic membership rule, review who can write it, in Entra ID and in any source directory, and restrict self-service write access to attributes used in security-sensitive groups.[^c07-dyn-rules]

## The responsibility matrix

The matrix is the program's recommended model, using the same convention as Book 02: each decision has exactly one decider. Adapt the columns to the agency's structure, but keep that rule.

D = decides (accountable) · R = does the work · C = consulted · blank = informed at most. "Gov. body" is the agency's ICAM governance structure under OMB M-19-17, chaired by the program's executive sponsor.

| Decision or work item | Gov. body | HR | Data arch. | Identity eng. | Security | Privacy | PIV office | Contracting | ISSO | AO | Help desk | App owners |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Who owns each attribute (the authority map) | D | C | R | C | C | C | C | C | C | | | |
| Meaning, values and code lists of an HR-mastered attribute | | D, R | C | C | | | | | | | | C |
| Enterprise person key (the identifier decision) | D | C | R | C | C | C | C | C | C | | | |
| Canonical schema and crosswalk changes | | C | D | R | C | C | | | C | | | |
| Privacy basis, PIA and the minimized attribute set | | C | R | R | | D | | | C | C | | |
| Provisioning rules: scoping, matching, mappings, UPN generation | | C | C | D, R | C | | | | C | | | |
| Write permissions on HR-mastered attributes | | | C | R | D | | | | C | | C | |
| Access rules for an application (dynamic groups, access packages) | | | C | R | C | | | | | | | D |
| Leaver timing: block threshold, schedule interval, grace periods | | C | | R | D | | C | C | C | C | | |
| Contractor source and one authority per fact | D | C | R | C | C | C | C | C | C | | | |
| Contractor sponsorship and end-date attestation | | | | | | | R | D | | | | |
| PIV issuance and termination procedures | | C | | C | C | C | D, R | C | | | | |
| Exception process and its service levels (quarantine, emergency termination) | | C | C | R | D | | C | | C | | R | |
| Fix a data error in an employee record | | D, R | | C | | | | | | | R | |
| Agency side of the Core HCM interconnection | C | D | R | R | C | C | | | C | | | |
| Authorize the feed and accept residual risk | C | | | C | C | C | | | R | D | | |

: Who decides, who does the work and who is consulted {.striped .hover}

Four rows need comment. The authority map, the person key and the contractor source sit with the governance body because each one binds several offices at once, and no single office can impose it on the others. Schema changes sit with the data architect, but a change that adds an attribute also goes through the privacy row before it ships. Leaver timing sits with security because it is a security policy parameter, but the authorizing official is consulted, because a threshold looser than policy is a risk acceptance. And a data error in a contractor record follows the same pattern as the employee row, with contracting in HR's place.

The matrix sets decision rights. Chapter 12's roles table lists who does each phase's work, and the two should be read together.

## Where ownership fails, and how the program prevents it

| How it fails | What it looks like | What the program does |
|---|---|---|
| Ownership by console | The directory team fixes a wrong title because it can; the HR record stays wrong and the next sync overwrites the fix, or doesn't | One writer per attribute; any other write is drift (Chapter 11); corrections go to the named owner |
| An owner without the means | The authority map names HR for duty station, but nobody in HR thinks keeping it current is their job | The owner accepts a quality expectation per attribute in Phase 1 and signs the map; quality is baselined before automation (Chapter 12) |
| Two masters | Writeback sends a value to HR that HR also edits; neither side knows which is right | No attribute is writable in both directions (Chapter 04) |
| The help desk as a shadow source | Tickets to "update my department" are worked in the directory | The help desk routes data errors to the owner; no help desk role that can write user properties |
| Contractors owned by nobody | A COR spreadsheet with a start date and no end date; the contractor keeps access after the contract ends | One authority per fact; a sponsor as a live reference; access ends at the earliest end condition (Chapter 06) |
| A key owned by the source | The source person number is the key, and the source changes at Core HCM cutover | An enterprise person key the agency controls, decided by the governance body (Chapter 04) |
| A leaver owned in pieces | HR records it, IT disables the account, the PIV office revokes the card, and nobody owns completion | Security owns the leaver path end to end; every step is reconciled and measured (Chapters 09 and 11) |
| Privacy arrives late | The privacy office first sees the feed at go-live, when a new routine use still needs publication and a waiting period | Privacy basis, PIA and minimized set are Phase 1 gate items |
| Local codes | A team invents its own organization codes because the standard's were inconvenient | Codes for access are the standard's, owned by HR (Chapters 06 and 10) |
| Ownership decays | The named owner leaves; a reorganization moves the function | Owners named by role; the authority map, schema and register re-validated annually (Chapter 12, Phase 6) |

: Common ownership failures and the program's countermeasures {.striped .hover}

Most of these failures have the same root: in a ticket-driven estate, whoever can make a change ends up owning the data by default. HR-driven identity reverses that. The office that creates a fact owns it, the office that guards it can stop its use, and the people who run the directory deliver it without editing it. Chapter 08 starts the How part of the book: the joiner, mover and leaver events that this ownership model makes possible.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 06 — The Canonical Workforce Identity Model](06-canonical-attribute-schema.md) · [Book index](index.md) · [Next: Chapter 08 — Joiner, Mover, Leaver →](08-joiner-mover-leaver.md)
:::

[^c07-m1917]: Office of Management and Budget, M-19-17, *Enabling Mission Delivery through Improved Identity, Credential, and Access Management*, May 21, 2019, §IV "Governance," <https://www.whitehouse.gov/wp-content/uploads/2019/05/M-19-17.pdf> (accessed Oct 20, 2026).
[^c07-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, Appendix D (Authorizing Official; Enterprise Architect; Information Owner or Steward; Senior Agency Official for Privacy; System Owner, including note 122; System Security or Privacy Officer), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Oct 20, 2026).
[^c07-fips201]: National Institute of Standards and Technology, FIPS 201-3, *Personal Identity Verification (PIV) of Federal Employees and Contractors*, January 2022, §2.1 control objectives, §2.7 identity proofing and registration requirements (separation of duties), and §2.9.4 PIV Card termination requirements, <https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.201-3.pdf> (accessed Oct 20, 2026).
[^c07-sp80079]: National Institute of Standards and Technology, SP 800-79-2, *Guidelines for the Authorization of Personal Identity Verification Card Issuers (PCI) and Derived PIV Credential Issuers (DPCI)*, July 2015, §2.1 "Issuer" and §2.3 "Outsourcing of Issuing Functions," <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-79-2.pdf> (accessed Oct 20, 2026).
[^c07-opm-data]: U.S. Office of Personnel Management, "Data Policy & Guidance" (Metadata Repository for data standards; Data Element Request Form; guidance for agency officials who prepare, submit and correct HR, payroll and training data), <https://www.opm.gov/policy-data-oversight/data-analysis-documentation/data-policy-guidance/> (accessed Oct 20, 2026).
[^c07-hr20]: Office of Management and Budget and Office of Personnel Management, memorandum, *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government*, December 10, 2025, p. 3 and Appendix C, <https://www.opm.gov/chcoc/latest-memos/creating-federal-hr-20-by-consolidating-core-human-capital-management-across-the-federal-government.pdf> (accessed Oct 20, 2026).
[^c07-api-config]: Microsoft Learn, "Configure API-driven inbound provisioning app" (prerequisites), <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-configure-app> (accessed Oct 20, 2026).
[^c07-entra-roles]: Microsoft Learn, "Microsoft Entra built-in roles" (Helpdesk Administrator, Identity Governance Administrator, Lifecycle Workflows Administrator, User Administrator), <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (accessed Oct 20, 2026).
[^c07-privacy-act]: Privacy Act of 1974, 5 U.S.C. § 552a(a)(7), (b)(1), (b)(3) and (e)(4)(D), via Legal Information Institute, Cornell Law School, <https://www.law.cornell.edu/uscode/text/5/552a> (accessed Oct 20, 2026).
[^c07-a108]: Office of Management and Budget, Circular A-108, *Federal Agency Responsibilities for Review, Reporting, and Publication under the Privacy Act*, 2016, §6 (publication of new or significantly modified routine uses) and §6.k "Routine Uses," <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A108/omb_circular_a-108.pdf> (accessed Oct 20, 2026).
[^c07-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource*, July 28, 2016, §5.f.1 and Appendix I §4.e, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Oct 20, 2026).
[^c07-m0322]: Office of Management and Budget, M-03-22, *OMB Guidance for Implementing the Privacy Provisions of the E-Government Act of 2002*, September 26, 2003, §II.B (when to conduct a PIA), <https://www.whitehouse.gov/wp-content/uploads/2017/11/203-M-03-22-OMB-Guidance-for-Implementing-the-Privacy-Provisions-of-the-E-Government-Act-of-2002-1.pdf> (accessed Oct 20, 2026).
[^c07-sp80047]: National Institute of Standards and Technology, SP 800-47 Rev. 1, *Managing the Security of Information Exchanges*, July 2021, <https://csrc.nist.gov/pubs/sp/800/47/r1/final> (accessed Oct 20, 2026).
[^c07-m1923]: Office of Management and Budget, M-19-23, *Phase 1 Implementation of the Foundations for Evidence-Based Policymaking Act of 2018: Learning Agendas, Personnel, and Planning Guidance*, July 10, 2019 (Data Governance Body; Chief Data Officer governance responsibilities), <https://www.whitehouse.gov/wp-content/uploads/2019/07/M-19-23.pdf> (accessed Oct 20, 2026).
[^c07-dyn-rules]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID" (security consideration: evaluate attribute write permissions), <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 20, 2026).
