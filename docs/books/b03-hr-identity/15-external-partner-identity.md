---
title: "Chapter 15 — External Partner Identity"
description: "The External Partner Person as a workforce identity class: people whose affiliation record and primary credential belong to another organization, such as a state, a tribal government, another agency, a financial institution or an academic partner. Covers the authority split between partner and agency, the boundary to employees, contractors, public users, privileged, non-person, AI agent and break-glass identities, how class, worker type and persona relate, the responsibility table with one agency decider per row, a short technology-neutral standard in nine control areas, assurance selection by transaction risk under NIST SP 800-63-4 and 63C-4, M-22-09's partner scope and FIPS 201-3's limits, the invitation route with automatic provisioning as a recorded exception, privacy, records and redress, eleven readiness checks, and the requirements and KSI map."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b03-hr-identity
book: B03
part: How
series-order: 15
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 15 — External Partner Identity

*A partner's account proves that another organization vouches for a person. It doesn't prove that the agency has decided to let that person in.*

::: {.callout-note}
## In this chapter
Why a partner is neither an employee nor a contractor, and how authority splits. The External Partner Person class, its boundary to the other classes, and how class, worker type and persona relate. Who does what, a short neutral standard, assurance by transaction risk, the route into the tenant, and privacy, records and redress. Eleven readiness checks, the requirements and KSI map, and what is not verified.
:::

Every earlier chapter rests on one rule: the agency's own authoritative source says who works here, and access follows. Employees come from HR ([Chapter 02](02-why-hr-is-the-source-of-authority.md)); contractors from the source the agency designates ([Chapter 06](06-canonical-attribute-schema.md#contractors-and-vendors-the-population-hrit-doesnt-cover)). Many people who sign in to agency systems are neither. A state benefits examiner, a tribal health officer, an analyst at another agency, a compliance officer at a regulated bank: each is employed, proofed and credentialed by someone else.

This chapter defines that population as a class and says what each side owns. The practical Microsoft Entra configuration is [Book 04, Appendix C — Partner Access Profile (Microsoft Entra)](../b04-access/appendix-c-partner-access-profile-entra.md), and the reusable record is [Appendix D — Partner Identity Record](appendix-d-partner-identity-record.md). Neither repeats the guest mechanics already in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#cross-tenant-and-b2b-collaboration) or the guest governance in [Book 04, Chapter 09](../b04-access/09-access-governance.md#guest-access-governance).

The examples use a fictional agency at `contoso.example` and two fictional partners: a state agency at `fabrikam.example` and a regulated financial institution at `tailspin.example`.

## Why a partner is not an employee or a contractor

The difference isn't the person's job. It's who holds the record that proves the job exists.

For an employee, the agency's HR system is authoritative and the pipeline derives everything from it ([Chapter 04](04-attribute-authority.md)). For a contractor, the agency still holds the authority: a contract, a sponsor and a record the agency designates. Either way, a leaver event starts inside the agency.

For a partner person, the affiliation record belongs to the partner. When a `fabrikam.example` examiner leaves the state government, the state's HR system knows first, and possibly only. The agency can't key, correct or see that record except through what the partner sends. The partner usually proofs the person and issues the primary credential too.[^c15-learn-b2b]

So authority splits in two, and the split is the definition of the class:

- **The partner is authoritative** for the person's affiliation with the partner and for the lifecycle of the credential it issues: who works there, in what role, whether the credential is valid, and when either ends.[^c15-learn-posture]
- **The agency is authoritative** for everything that touches its systems: whether it trusts the partner's identity service at all, which partner persons are eligible, what they may access, what assurance each transaction needs, how access is monitored and reviewed, and when it is suspended or ended.

One rule follows: **no partner account gets access just because it exists or synchronizes.** An account in the tenant is a fact about the partner's directory. Access is an agency decision with an approver, a sponsor, an expiry and evidence ([Book 04, Chapter 01](../b04-access/01-access-is-a-policy-decision.md)).

The FICAM Architecture already covers enterprise identity, credential and access management for "government employees, contractors, and authorized partners," and excludes consumer identity.[^c15-ficam] This book's scope covers human affiliations with an identified authoritative source ([Chapter 01](01-overview-and-applicability.md#where-this-book-applies)); for a partner person, that source is the partner's.

Keep two meanings of *affiliation* apart. Elsewhere in this book an affiliation is a record in the agency's own model, joined on the enterprise person key ([Chapter 06](06-canonical-attribute-schema.md)). A partner affiliation is the partner's record; the agency holds only a reference to it.

## The class and its boundary to the other classes

**External Partner Person** is a person whose authoritative employment or affiliation record and primary credential are held by another organization: a state, a tribal government, another federal agency, a financial institution or other regulated entity, an academic or nonprofit partner, or another organization the agency approves. The class covers people, not organizations. The organization is the partner; the class is its people who use agency systems.

The workbook's other identity populations each have a home already. This chapter doesn't redefine them; it draws the boundary.

| Class | Authoritative source | Accountable owner | Where the workbook covers it |
|---|---|---|---|
| Federal employee | Agency HR (Core HCM) | HR for the record; agency for access | This book, [Chapters 02](02-why-hr-is-the-source-of-authority.md) to [08](08-joiner-mover-leaver.md) |
| Contractor | The contractor source the agency designates | The agency, through the sponsor and the source owner | [Chapter 06](06-canonical-attribute-schema.md#contractors-and-vendors-the-population-hrit-doesnt-cover) |
| External Partner Person | The partner's workforce or affiliation authority | Partner for affiliation and credential; agency for trust and access | This chapter; [Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md) |
| Public or beneficiary | The program's public-facing identity service | The program agency | Outside workforce scope; [Book 18](../b18-application-modernization/index.md) |
| Privileged administrator | The parent class, plus the privileged access system | Agency | An overlay on the parent class; [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md) |
| Non-person (workload, service account) | The owning system's record | The system owner and sponsor | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md); the [non-person identity track](../guides/attribute-driven-migration.md#non-person-identity-track) |
| AI agent | The AI inventory | The accountable sponsor and system owner | [Book 17, Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md) |
| Break-glass | Agency security authority | Agency | [Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#emergency-access-accounts); [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts) |

: Identity classes and where the workbook covers them {.striped .hover}

Four boundary rules keep the classes from bleeding into each other:

- **Partner is not public.** A member of the public applying for a benefit is not a partner person, even if a partner delivers the benefit. Don't make public users workforce guests for convenience.
- **Partner is not contractor.** If the agency holds the contract and the sponsor and the person works on agency business, the person is a contractor ([Chapter 06](06-canonical-attribute-schema.md)), even if their employer runs its own directory. If the person works on the partner's business and uses an agency system in a shared program, the person is a partner person.
- **Privilege and break-glass are overlays.** A partner person who needs an administrative role takes the same privileged path as anyone ([Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md)), and the request cites the partner record *(design guidance)*. Emergency access accounts are always the agency's own.
- **People and agents stay apart.** An AI agent acting for a partner is a non-person identity with its own sponsor ([Book 17](../b17-ai-identity/index.md)).

Hybrid cases, where a partner reaches on-premises Active Directory through a forest, external or Kerberos realm trust, stay in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#mapping-ad-trusts-to-cross-tenant-access). This chapter is about the cloud identity a partner person uses.

### Class, worker type and persona

The workbook now has three words for populations. They don't compete; each is a view of the one above it.

| Term | What it is | Where it lives | Partner persons |
|---|---|---|---|
| **Class** | The parent term: who is authoritative for the person and who owns access | This chapter | External Partner Person |
| **Worker type** | The HR attribute that classifies the agency's own workers: employee, contractor, intern, volunteer, vendor, external | [Chapter 04](04-attribute-authority.md#the-worker-type-boundary), [Chapter 06](06-canonical-attribute-schema.md#program-attribute-map) | None from HR. A partner person has no agency HR record, so the class is carried by the partner identity record and the account's user type |
| **Persona** | The Conditional Access targeting unit | [Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md#personas) | The **Externals** persona, which CA009 and the other partner policies target through the `{tenant:partners}` list ([Book 04, Appendix A](../b04-access/appendix-a-conditional-access-templates.md)) |

: Class, worker type and persona {.striped .hover}

The Externals persona is the class as Conditional Access sees it, and the two must match one to one. A partner with a record but missing from the tenant list gets treated as an ad hoc guest; a listed tenant with no record is access with no owner. Both are drift findings.

User type is where the views can silently diverge.[^c15-learn-mt-considerations] The workbook's member baselines, such as the compliant-device policies, exclude guests, so a partner person created as a member would fall into the internal baselines and out of the partner ones. So partner persons are **Guest by default**; a Member partner person needs an exception record with a reason, an approver and a review date *(design guidance)*.

## Who does what: partner and agency

The partner and the agency each carry part of every decision. The table below allocates them. For the agency side, it uses the format of [Book 04, Chapter 06](../b04-access/06-who-decides-access.md#the-responsibility-matrix): one decider per row. The decider is the **agency business owner**, the agency official accountable for the program or business process the partner persons serve. That title is provisional; agencies use different names for the role, and the record names a person, not a title.

The **sponsor** is a named role: the agency-side person, usually the program manager who works with the partner, who vouches for its persons and reviews their access.[^c15-learn-sponsors] Every relationship has at least one;[^c15-learn-unsponsored] the sponsor reviews and requests suspensions but doesn't approve their own requests. The identity governance officer (IGO) owns the list of approved partner organizations and tenants ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#the-responsibility-matrix)).

D = decides · R = does the work · C = consulted · I = informed.

| Activity | What the partner does | What the agency does | Business owner | Sponsor | Others |
|---|---|---|---|---|---|
| Affiliation | Keeps an accurate record of who works for it and in what role | Defines which partner affiliations are eligible | D | R | Partner: R |
| Identity proofing | Proofs the person under its documented practice | Assesses whether that proofing meets each transaction's risk and the agreement | D | C | ISSO: C |
| Credential | Issues, protects and revokes the credential; reports compromise | Defines acceptable authenticators; verifies what the federation asserts | D | I | Identity engineering: R; ISSO: C |
| Attributes | Sends accurate, minimal attributes and change events | Approves the mapping, minimization, matching and collision rules | D | C | Privacy office: C; identity engineering: R |
| Authentication | Authenticates the person and issues trustworthy assertions | Validates issuer, audience, freshness, assurance and policy context | D | I | Identity engineering: R |
| Authorization | Supplies only agreed attributes or groups | Makes every application and resource authorization decision | D | R | Application owner: C |
| Lifecycle | Sends timely mover, leaver, disable and compromise notices | Disables access, reconciles, reviews, and ends the relationship | D | R | Identity engineering: R |
| Incident response | Notifies and coordinates under the agreement | Contains agency access, preserves evidence, reports and recovers | D | I | Security operations: R; ISSO: C |
| Audit evidence | Provides agreed attestations | Keeps configuration, review, access and monitoring evidence | D | R | ISSO: C |
| Enable for production, continue or end | Signs the agreement; confirms its contacts | Decides that the relationship goes live, continues at review, or ends | D | R | Authorizing official: C (required) |

: Responsibility for partner identity {.striped .hover}

Two rows need comment. In a live incident security operations contains first, as in [Book 04, Chapter 06](../b04-access/06-who-decides-access.md#the-responsibility-matrix), and the business owner is told after. The last row has one decider and a **required consult**: no production enablement without the authorizing official's input on record, because the relationship changes who can reach systems inside the authorization boundary. A consult is not a second approval; an objection goes to the record, and an objection the business owner overrides becomes a risk acceptance, which is the authorizing official's decision ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#exceptions)) *(design guidance)*.

## The standard, in nine control areas

The standard is short on purpose. It says what has to be true for any partner, on any platform; the Entra profile says how ([Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md)). Each area becomes a section of the partner identity record ([Appendix D](appendix-d-partner-identity-record.md)) *(design guidance)*.

| Control area | Minimum |
|---|---|
| Partner qualification | An approved use case; the partner's legal name; accountable owners on both sides; a signed agreement; a risk review; security and privacy contacts |
| Trust establishment | The partner's identity service validated by identifier and issuer; an approved federation protocol or provisioning channel; keys and certificates documented with their renewal dates; a claim policy |
| Population scope | An explicit eligible population; immutable identifiers; governed groups or attributes; duplicate reconciliation; an expected unique count |
| Assurance | IAL, AAL and FAL selected per transaction; accepted authenticators; phishing resistance; device conditions; exceptions |
| Authorization | Application roles and entitlements separate from authentication; least privilege; expiry; approval and recertification |
| Lifecycle | Create, update, disable, remove and restore tested; a disable interval agreed with the partner; emergency suspension; source outage; credential compromise; partner exit |
| Data protection | Minimum attributes; purpose limitation; privacy determinations; retention; correction and redress |
| Operations | Monitoring and alerting; failed-event handling; bulk-change protection; drift detection; log retention; support authority |
| Evidence | Configuration export, mapping inventory, test results, approvals, reviews, exceptions, risk decisions and incident records |

: The partner identity standard {.striped .hover}

Three points matter most. **Authorization is separate from authentication**: a valid `fabrikam.example` assertion proves the examiner signed in at the state; only an agency assignment opens the case system.[^c15-learn-lob-onboard] **Partner exit is a lifecycle event**: when an agreement ends, the accounts are removed, not left disabled.[^c15-learn-guest-lifecycle] **Statements are not controls**: a partner saying it requires MFA is input to the agreement; a policy the agency enforces and tests is the control. CISA's Zero Trust Maturity Model frames this as continuous verification, but it is "one of many roadmaps," not a mandate.[^c15-ztmm]

## Assurance by transaction risk

NIST SP 800-63-4, final since July 31, 2025, measures digital identity on three separate scales.[^c15-sp80063] For a partner person, the partner usually performs two of the three, and the agency has to decide whether what the partner does is enough for each transaction.

| Scale | NIST's definition | For a partner person | What the agency records |
|---|---|---|---|
| IAL | "The robustness of the identity proofing process to determine the identity of an individual" | The partner proofs, under its own practice | The partner's proofing practice and whether it meets the selected IAL |
| AAL | "The robustness of the authentication process itself" | The partner's identity service authenticates | The authenticators accepted, and how the agency verifies them |
| FAL | "The robustness of the federation process used to communicate authentication" and attribute data from identity provider to relying party | The agency, as relying party, sets it per application | The FAL each application requires, and the assertion checks that prove it |

: SP 800-63-4 scales applied to partner persons {.striped .hover}

The levels, in brief:[^c15-sp80063]

- **IAL1** supports the real-world existence of the claimed identity; **IAL2** adds evidence and a more rigorous process; **IAL3** adds a trained representative in an attended session and at least one biometric.
- **AAL1** gives basic confidence; **AAL2** high confidence, with two distinct factors; **AAL3** very high confidence, with a phishing-resistant authenticator.
- **FAL1** protects against forged assertions; **FAL2** also against assertion injection; **FAL3** also against compromise of the identity provider.

SP 800-63C-4 sets what each FAL demands of the federation.[^c15-sp80063c] At FAL1 the identity provider signs the assertion and the relying party validates the signature against the expected key, with the assertion audience-restricted and protected against replay. FAL2 adds injection protection, a transaction the relying party initiates, an assertion for a single relying party, a **trust agreement established in advance**, and federated identifiers that don't contain plaintext personal information. FAL3 adds holder-of-key or a bound authenticator, with identifiers and keys established manually. At every level the relying party confirms that the issuer is the identity provider it expects. For partners, the FAL2 trust agreement and the agreement in the partner record are the same document, or the record says where the trust agreement is *(design guidance)*.

**Selecting the levels** follows SP 800-63-4's steps.[^c15-sp80063] Define the online service (section 3.1). Assess the impact of a failure for each user group, at Low, Moderate or High, including the required impact categories (section 3.2). Combine the impacts by high-water mark or another documented method (section 3.2.4). Take the initial levels from the result: Low gives IAL1 and AAL1, Moderate gives IAL2 and AAL2, High gives IAL3 and AAL3; for FAL, High gives FAL2 or FAL3 after a further assessment of the identity provider's risk (section 3.3.3). Tailor where the mission needs it, and document the result in a Digital Identity Acceptance Statement (section 3.4).

Partner persons are their own user group in that assessment: same application, different proofing, different identity provider. A `tailspin.example` officer submitting a financial filing and a `fabrikam.example` examiner reading a case summary can land at different levels on one system, so the record holds one row per protected transaction, not one level per partner.[^c15-learn-plan] The SP 800-63C-4 landing page carries a planning note dated October 6, 2026 that this chapter didn't read in full; check it before relying on the FAL text above.

**M-22-09.** OMB's zero trust strategy requires that "MFA must be enforced at the application layer" and that "for agency staff, contractors, and partners, phishing-resistant MFA is required."[^c15-m2209] Its note defines partners as users external to the agency "whose use of agency systems requires a strong form of MFA," gives contractors submitting financial information as an example, and says "Agencies will need to determine the scope of this category."[^c15-m2209] So partner persons are in scope **as each agency defines the category**, not every external person by default. The agency writes its definition into the record and applies phishing-resistant MFA to everyone inside it. [Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md#phishing-resistant-mfa-under-m-22-09) has the configuration.

**FIPS 201-3.** The PIV standard's scope is federal employees and contractors, and PIV eligibility rests on a completed investigation and adjudication. Its section 7 covers federation as the way to accept PIV credentials issued by other agencies, with the IAL, AAL and FAL known to the relying party at the end of the transaction; the standard has no provision for PIV-I.[^c15-fips201] Two consequences follow. A partner person from another federal agency who holds that agency's PIV is accepted by federation, not by trusting their agency's CAs, as [Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md#accepting-another-agencys-piv) sets out. A partner person who isn't a federal employee or contractor isn't a PIV population under FIPS 201-3, so **never call a partner credential PIV-equivalent** unless a policy the agency can cite says so. Describe it by its assurance levels instead.

## The route into the tenant

The route is the same in principle on any platform *(design guidance)*:

1. **The partner is qualified first.** The partner identity record exists, the agreement is signed, and the partner's identity service is trusted for the agency's tenant only through a setting scoped to that partner.[^c15-learn-b2b][^c15-learn-allowlist]
2. **Each partner person arrives through an approved request.** The request names the sponsor, the approver and an expiry. Approval creates the account and assigns the access in one step; nothing creates a partner account without an approved request behind it.[^c15-learn-em-tutorial][^c15-learn-guest-deploy]
3. **The account is a guest.** The class's default user type is Guest; Member is an exception record.
4. **Access ends with the last assignment.** When the request expires or is removed, the account is blocked and then removed.[^c15-learn-em-tutorial][^c15-learn-guest-lifecycle]

**Automatic provisioning is an exception.** Pushing accounts from a partner's directory without a per-person request moves the eligibility decision to whoever controls the partner's groups, and copies personal data across organizations on a schedule.[^c15-learn-xts-gov][^c15-learn-mt-considerations] Use it only with a recorded reason, an agency-approved scope, and the invited route's expiry and review *(design guidance)*.

In Microsoft Entra the default route is entitlement management with B2B collaboration guests, which [Book 04, Chapter 09](../b04-access/09-access-governance.md#guest-access-governance) already governs: invitation through an access package, removal after the last assignment, quarterly sponsor review. Cross-tenant synchronization is the exception. Microsoft's own guidance says: "For privacy reasons, cross-tenant synchronization is intended for use within an organization. Consider using entitlement management for inviting B2B collaboration users across organizations."[^c15-xts] It also syncs only internal members of the source tenant, so a partner on a non-Microsoft identity provider can't use it, and it creates external **members** by default, which conflicts with Guest by default unless the user type mapping is set to Guest.[^c15-xts] [Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md) has both routes, the required mapping and the tests.

## Privacy, records and redress

[Chapter 14](14-privacy-for-workforce-identity.md) already counts guest accounts among the reasons a workforce identity system can't rely on the personnel-only PIA exception. This section adds what changes for the class.

**System of records.** The Privacy Act defines a system of records as "a group of any records under the control of any agency from which information is retrieved by the name of the individual or by some identifying number, symbol, or other identifying particular assigned to the individual," and subsection (m) extends the Act to systems a contractor operates for an agency.[^c15-privacy-act] A directory of partner persons, their access decisions and their sign-in logs is retrieved by name and identifier. Whether an existing notice covers it, or the agency needs a new or revised one, is the privacy office's determination; bring the question before the first partner goes live, using [Chapter 14's coverage questions](14-privacy-for-workforce-identity.md#is-the-flow-covered-by-an-existing-sorn). The partner record holds the reference to the determination.

**Minimization.** The agency receives only the attributes its decisions read. For most partners that is a name, a work email, an immutable identifier from the partner, the partner organization and, where an application needs it, a role. No partner employee numbers, home data or HR codes. The attribute purpose register in [Chapter 14](14-privacy-for-workforce-identity.md#minimization-and-purpose-limits-for-directory-attributes) gets a row for each one, and [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) has the PT controls.

**Records.** NARA's General Records Schedule 3.2 covers system access records. Item 030 says destroy when business use ceases; item 031, for systems requiring special accountability for access, says destroy six years after the password is altered or the account is terminated, or longer if business use requires.[^c15-grs32] Partner agreements, memoranda of understanding, interconnection agreements and access-review records may fall under other schedules. This chapter **has not verified** which; the agency records officer names the schedule items, and the record carries them. No retention period is stated here for those records.

**Redress.** Corrections flow upstream ([Chapter 14](14-privacy-for-workforce-identity.md#correction-and-redress-through-hr-not-the-directory)), but upstream is the partner: a wrong name or organization is corrected at the partner's source, not edited in the directory. What the agency created, such as an access decision, a suspension or a log entry, is the agency's record, disputed through the agency's process; which Privacy Act procedures reach a given partner person is the privacy office's call. The record names both paths and a contact.

**Accessibility.** The request, approval, notice and redress workflows a partner person uses are information and communication technology the agency provides, and Section 508 applies to them.[^c15-508] [Book 04, Chapter 09](../b04-access/09-access-governance.md#the-request-portal-is-covered-by-section-508) covers the request portal.

## Readiness checks

Eleven checks stand between a qualified partner and production. They are *readiness checks*: they aren't the program gates G0 to G5, and they aren't the acceptance step in [Appendix C](appendix-c-acceptance-and-cutover.md). Each has one decider, the agency business owner, who decides that the check is met; the determinations behind a check stay with the office that owns them. The authorizing official is a required consult on the last *(design guidance)*.

| # | Check | Evidence | Decides | Consulted |
|---|---|---|---|---|
| 1 | Class and authoritative source confirmed: the people are partner persons, not contractors or public users, and the partner's affiliation source is named | Partner record, authority section | Business owner | Sponsor |
| 2 | Requirements applicability recorded: which controls, mandates and assurance rules apply to this partner | The requirements rows of the record | Business owner | ISSO |
| 3 | Agreement, privacy, records, security and authorization boundary reviewed | Signed agreement; privacy and records determinations; ISSO boundary note | Business owner | Privacy office, records officer, ISSO |
| 4 | Assurance selected for each protected transaction | IAL, AAL and FAL per transaction; the Digital Identity Acceptance Statement | Business owner | ISSO, application owner |
| 5 | Partner and agency owners named; escalation contacts tested | Contact list; a dated test message and reply | Business owner | Sponsor, partner |
| 6 | Population scope and unique count reconciled | Expected count from the partner against accounts in the tenant, dated | Business owner | Identity engineering |
| 7 | Attributes and claims minimized and validated | Mapping or claim inventory; purpose register rows | Business owner | Privacy office, identity engineering |
| 8 | Create, update, disable, remove, emergency suspension and rollback tested | Test results with timestamps for each case | Business owner | Identity engineering, sponsor |
| 9 | Conditional Access and application authorization tested, including denial cases | Sign-in log extracts for allowed and denied attempts | Business owner | Application owner, identity engineering |
| 10 | Monitoring, access review, drift, bulk-change and incident runbooks operating | Alert rules; review schedule; runbook links; one exercised alert | Business owner | Security operations |
| 11 | Production enablement | The business owner's decision, with the authorizing official's consult on record | Business owner | Authorizing official (required) |

: Readiness checks for a partner relationship {.striped .hover}

The checks repeat at each review of the relationship, not only once. A partner that adds a new application reruns checks 4, 7, 9 and 11 for it; a partner exit runs check 8's remove and rollback cases for every account and confirms none remain.

## Requirements and KSI map

The map follows the workbook's rule: controls from NIST SP 800-53 Rev. 5, indicators only where the workbook already pairs a control with a FedRAMP 20x Key Security Indicator, and the evidence an ISSO keeps.[^c15-sp80053] It extends, and doesn't replace, the [federal requirements crosswalk](../b02-identity/appendix-a-federal-requirements-crosswalk.md) and [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md). Which record supports which control is the program's reading *(design guidance)*.

| What the record proves | Requirement | KSI | Evidence |
|---|---|---|---|
| The partner relationship is an approved exchange under a signed agreement | CA-3 Information Exchange | No pairing in the workbook's existing mappings | The agreement; partner record section A; check 3 |
| Partner persons are uniquely identified and authenticated as non-organizational users; external authenticators are accepted only from named partners | IA-8, IA-8(2) | No pairing in the workbook's existing mappings | Partner trust settings export; the partner tenant list; checks 4 and 9 |
| Phishing-resistant MFA is enforced for partner persons inside the agency's M-22-09 category | M-22-09; IA-8 | KSI-IAM-APM, as [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) maps authentication strength evidence | Authentication strength and Conditional Access exports; sign-in logs |
| Every partner account has an approved request, a sponsor, an expiry and a review | AC-2 | KSI-IAM-APM, KSI-IAM-JIT, KSI-IAM-SNU, KSI-IAM-SUS | Request and approval records; review history; check 8 |
| Accounts are disabled automatically when the assignment ends or the partner exits | AC-2(3) | KSI-IAM-AAM | Assignment expiry and removal records; partner-exit test results |
| Partner leavers are handled under the agreement; PS-4 and PS-5 are written for the agency's own personnel, so the agreement carries the equivalent obligation, as the program reads them | Agreement terms; AC-2 | As for AC-2 | Partner leaver notices joined to agency disable times; check 8 |
| Access is limited to the assigned applications and roles | AC-3, AC-6 | KSI-IAM-APM, KSI-IAM-ELP, KSI-IAM-JIT (AC-3); KSI-IAM-ELP, KSI-IAM-JIT (AC-6) | Assignment exports; denial-case sign-in logs; check 9 |
| Partner sign-ins and provisioning events are reviewed | AU-6 | KSI-MLA-RVL | Saved queries and alert history; check 10 |
| The partner configuration is monitored for drift and the partner list matches the record | CA-7 | KSI-MLA-EVC | Drift findings; tenant list against record reconciliation; check 6 |
| The privacy determinations are made before go-live | PT-2, PT-3, RA-8 | No KSI | Privacy office determinations; purpose register rows ([Chapter 14](14-privacy-for-workforce-identity.md)) |

: Partner identity requirements and KSI map {.striped .hover}

Key Security Indicators describe what cloud service providers report for their offerings. The agency doesn't report them itself; it aligns its records with them ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). The cloud services involved also need to be within a FedRAMP-certified offering the agency's own authorization relies on: FedRAMP certifies the cloud service offering, and the agency remains responsible for its own authorization, which covers the configuration it selects and the integrations it enables.[^c15-fedramp]

## What this chapter has not verified

- **FedRAMP boundary rules.** Whether each feature used for partners sits inside a given certified offering, and how the Consolidated Rules for 2026 boundary rulesets and significant-change tiers treat a partner configuration, were not checked against the primary rulesets. Confirm both with the ISSO.
- **Retention for agreements and reviews.** GRS 3.2 covers system access records; the schedules for partner agreements, memoranda, interconnection agreements and access-review records were not verified.
- **The SP 800-63C-4 planning note** dated October 6, 2026 was not read in full.
- **Cross-cloud synchronization support level.** Microsoft's Entra pages list cross-tenant synchronization between commercial and Government clouds without a preview label, while one Microsoft 365 page described it as public preview from August 2025. Confirm the current support level before relying on it ([Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md)).
- **The agency business owner's title** is provisional. The record names the person; the title may change.
- **Privacy Act coverage for a given partner population**, and which redress procedures reach which partner persons, are the privacy office's determinations, not this chapter's.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 14 — Privacy for Workforce Identity](14-privacy-for-workforce-identity.md) · [Book index](index.md) · [Next: Appendix A — Lifecycle Rules →](appendix-a-lifecycle-rules.md)
:::

[^c15-ficam]: Federal CIO Council ICAM Subcommittee and GSA, IDManagement.gov, *Federal Identity, Credential, and Access Management (FICAM) Architecture*, version 3.3 (scope: enterprise ICAM for "government employees, contractors, and authorized partners"; consumer ICAM excluded), <https://www.idmanagement.gov/arch/> (accessed Nov 6, 2026).
[^c15-sp80063]: National Institute of Standards and Technology, SP 800-63-4, *Digital Identity Guidelines*, July 31, 2025 (final; §3.1 defining the online service; §3.2 and §3.2.4 initial and combined impact assessment; §3.3.1 definitions of IAL, AAL and FAL; §3.3.2 assurance levels; §3.3.3 initial assurance levels; §3.4 tailoring and the Digital Identity Acceptance Statement), <https://pages.nist.gov/800-63-4/sp800-63.html>; publication record <https://csrc.nist.gov/pubs/sp/800/63/4/final> (accessed Nov 6, 2026).
[^c15-sp80063c]: National Institute of Standards and Technology, SP 800-63C-4, *Digital Identity Guidelines: Federation and Assertions*, July 31, 2025 (final; §2.2 FAL1; §2.3 FAL2; §2.4 FAL3; §3.9 issuer verification), <https://pages.nist.gov/800-63-4/sp800-63c.html> (accessed Nov 6, 2026).
[^c15-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022 (§A "Identity," action on multi-factor authentication; note 7, definition and scope of "partners"), <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Nov 6, 2026).
[^c15-fips201]: National Institute of Standards and Technology, FIPS 201-3, *Personal Identity Verification (PIV) of Federal Employees and Contractors*, January 2022 (scope; §2.1–2.2 credentialing requirements; §7 federation considerations), <https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.201-3.pdf>; publication record <https://csrc.nist.gov/pubs/fips/201-3/final> (accessed Nov 6, 2026).
[^c15-privacy-act]: Privacy Act of 1974, 5 U.S.C. §552a (2023 edition), subsections (a)(5) and (m), <https://www.govinfo.gov/content/pkg/USCODE-2023-title5/html/USCODE-2023-title5-partI-chap5-subchapII-sec552a.htm> (accessed Nov 6, 2026).
[^c15-grs32]: National Archives, General Records Schedule 3.2, *Information Systems Security Records*, Transmittal 33, January 2023, items 030 and 031, system access records, <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf> (accessed Nov 6, 2026).
[^c15-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, <https://www.cisa.gov/zero-trust-maturity-model> (accessed Nov 6, 2026).
[^c15-xts]: Microsoft Learn, "What is cross-tenant synchronization?" (sections on supported users, the default user type, and the FAQ on use across organizations), <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/cross-tenant-synchronization-overview> (accessed Nov 6, 2026).
[^c15-508]: 29 U.S.C. §794d (2023 edition); the Revised 508 Standards took effect January 18, 2018, <https://www.govinfo.gov/content/pkg/USCODE-2023-title29/html/USCODE-2023-title29-chap16-subchapV-sec794d.htm> (accessed Nov 6, 2026).
[^c15-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, Release 5.2.0 (controls AC-2, AC-2(3), AC-3, AC-6, AU-6, CA-3, CA-7, IA-8, IA-8(2), PS-4, PS-5, PT-2, PT-3 and RA-8), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; OSCAL catalog <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Nov 6, 2026).
[^c15-fedramp]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *Consolidated Rules for 2026* (FedRAMP certifies the cloud service offering; the agency issues its own authorization, covering the configuration selected and the integrations enabled), <https://www.fedramp.gov/2026/agencies/use/> (accessed Nov 6, 2026).
[^c15-learn-b2b]: Microsoft Learn, "What is Microsoft Entra B2B collaboration?" (partners use their own identities and credentials; organization-specific cross-tenant access settings; guest user type), <https://learn.microsoft.com/entra/external-id/what-is-b2b> (accessed Nov 9, 2026).
[^c15-learn-posture]: Microsoft Learn, "Determine your security posture for external access with Microsoft Entra ID" (partner-managed credentials signal the end of access when the person leaves their own company), <https://learn.microsoft.com/entra/architecture/1-secure-access-posture> (accessed Nov 9, 2026).
[^c15-learn-mt-considerations]: Microsoft Learn, "Common considerations for multitenant user management in Microsoft Entra ID" (converting an external user's user type; dedicated Conditional Access policies for external accounts; restricting who controls the groups in cross-tenant synchronization scope), <https://learn.microsoft.com/entra/architecture/multi-tenant-common-considerations> (accessed Nov 9, 2026).
[^c15-learn-sponsors]: Microsoft Learn, "Add sponsors to a guest user in the Microsoft Entra admin center - External ID" (the sponsor manages and monitors the guest's lifecycle and can be an approver in entitlement management), <https://learn.microsoft.com/entra/external-id/b2b-sponsors> (accessed Nov 9, 2026).
[^c15-learn-unsponsored]: Microsoft Learn, "Manage unsponsored guests using Lifecycle Workflows (Preview)" (guests without a valid sponsor are a security and compliance risk), <https://learn.microsoft.com/entra/id-governance/how-to-lifecycle-workflow-unsponsored-guest-removal> (accessed Nov 9, 2026).
[^c15-learn-lob-onboard]: Microsoft Learn, "Onboard external users to line of business applications using Microsoft Entra B2B" (where user assignment is required, an invited user can't gain access regardless of authentication), <https://learn.microsoft.com/entra/architecture/11-onboard-external-user> (accessed Nov 9, 2026).
[^c15-learn-guest-lifecycle]: Microsoft Learn, "Plan new governance scenarios for business partners and external users with Microsoft ID Governance" (offboarding: partner-linked accounts removed; guest account removed when the last access package assignment expires), <https://learn.microsoft.com/entra/id-governance/scenarios/govern-guest-lifecycle-new-project> (accessed Nov 9, 2026).
[^c15-learn-plan]: Microsoft Learn, "Create a security plan for external access to resources" (sign-in requirements for external users based on each resource's risk profile), <https://learn.microsoft.com/entra/architecture/3-secure-access-plan> (accessed Nov 9, 2026).
[^c15-learn-allowlist]: Microsoft Learn, "Allow or block invitations" (an allow list limits invitations to named partner organizations), <https://learn.microsoft.com/entra/external-id/allow-deny-list> (accessed Nov 9, 2026).
[^c15-learn-em-tutorial]: Microsoft Learn, "Tutorial - Onboard external users to Microsoft Entra ID through an approval process" (approval before external users gain access to the directory; removal when the last access package expires), <https://learn.microsoft.com/entra/id-governance/entitlement-management-onboard-external-user> (accessed Nov 9, 2026).
[^c15-learn-guest-deploy]: Microsoft Learn, "Microsoft Entra ID Governance deployment guide to govern guest and partner access" (external users who request access are invited to the directory and assigned access), <https://learn.microsoft.com/entra/architecture/governance-deployment-guest-access> (accessed Nov 9, 2026).
[^c15-learn-xts-gov]: Microsoft Learn, "Governance and cross-tenant synchronization" (synchronization is configured in the source tenant, whose administrators control which users are provisioned), <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/cross-tenant-synchronization-governance> (accessed Nov 9, 2026).
