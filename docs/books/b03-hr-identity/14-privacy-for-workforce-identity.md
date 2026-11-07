---
title: "Chapter 14 — Privacy for Workforce Identity"
description: "Privacy as a design obligation of HR-driven identity: which identity data is PII, whether the HR-to-directory flow is covered by an existing system-of-records notice, when a privacy impact assessment is required or must be updated, minimization and purpose limits for directory attributes, disclosures to SaaS and cloud providers, accounting of disclosures, correction through HR, retention, the Senior Agency Official for Privacy, and the NIST SP 800-53 PT family, ending in the checklist an engineer runs before adding an attribute or an integration."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b03-hr-identity
book: B03
part: How
series-order: 14
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 14 — Privacy for Workforce Identity

*Every attribute the pipeline copies is a use of a personnel record, and every system it feeds is a disclosure. Design for that from the first mapping.*

::: {.callout-note}
## In this chapter
Which identity data is personally identifiable information, and why correlation keys are the most sensitive of it. Whether the HR-to-directory flow is covered by an existing system-of-records notice. When a privacy impact assessment is required and which identity changes reopen it. Minimization and purpose limits for directory attributes. Disclosures to SaaS and cloud providers, the accounting they need, and the correction path when a worker's record is wrong. Retention, the Senior Agency Official for Privacy, and the NIST SP 800-53 PT family. A checklist an engineer runs before adding an attribute or an integration.
:::

[Appendix B](appendix-b-security-and-privacy.md) assesses the data flow this book builds, once, at design time. This chapter is the standing version: the privacy obligations that attach every time the pipeline changes. It doesn't replace the agency's privacy office, which makes every determination below. It tells the identity engineer what to bring to that office and when, so that privacy work happens at design review and not at go-live. [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) covers the PT controls for any system; this chapter applies them to workforce identity.

The examples use a fictional agency at `contoso.example`.

## Which identity data is PII

OMB Circular A-130 defines personally identifiable information as information that can be used to distinguish or trace an individual's identity, "either alone or when combined with other information that is linked or linkable to a specific individual."[^c14-a130] Under that test almost everything an identity platform holds about a person is PII, including values that look harmless on their own:

| Data in this book | Examples | PII? | Why it matters |
|---|---|---|---|
| Names and display data | `givenName`, `surname`, `displayName`, `jobTitle`, `department` | Yes | Readable by every member user by default (Appendix B) |
| Correlation identifiers | Enterprise person key, `employeeId`, Core HCM `PersonNumber`, affiliation key, directory object ID | Yes | Their purpose is to link records, so they make every record they touch linkable |
| Credential identifiers | PIV FASC-N, card UUID, cardholder UUID, certificate subject and SKI | Yes | Each one resolves to one cardholder |
| Access-targeting codes | Organization code, worker type code, position category | Yes, once attached to a person | A code is not anonymous when it sits on a user object |
| Lifecycle dates | Hire date, leave date | Yes | A leave date on a directory object can disclose a pending separation |
| Relationships | `manager`, sponsor, approver | Yes, about two people | The relationship is a personnel fact |
| Activity | Sign-in logs, provisioning logs, access review decisions, workflow history | Yes | Keyed to the person; often carries IP address and location |
| Evidence | Provenance records, full payloads in the audit store | Yes | The richest copy of the record outside HR |
| Never moved | SSN, date of birth, home address, home phone | Yes | Not in the schema (Chapter 06) and never a join key |

: Identity data and PII {.striped .hover}

The design consequence: treat every attribute and every log in the pipeline as PII, and argue the exceptions, not the other way round. The correlation keys deserve the most care. Chapter 04's enterprise person key is what makes audit joins possible; it is also what makes a sign-in log, a database login and a badge swipe one person's history. It belongs in every log the program writes (it's how the program avoids copying names and payloads into them), but the stores that can resolve it to a name are the ones to protect.

## Is the flow covered by an existing SORN?

A system of records is a group of records under an agency's control from which information is retrieved by a person's name or other identifier.[^c14-privacy-act] Both the HR system and a directory qualify. Most agencies answer the coverage question through government-wide notices, not one of their own.

**General personnel records.** OPM/GOVT-1, General Personnel Records, is the government-wide notice. It covers current and former federal employees and says volunteers, grantees and contract employees on whom an agency keeps records "may also be covered"; its categories of records include identifying information and the data in OPM's *Guide to Data Standards*.[^c14-govt1-2012] Records on current employees are located within the employing agency, and OPM has delegated to the employing agency the Privacy Act responsibilities for access, amendment and disclosure of those records.[^c14-govt1-2023] The notice keeps changing: it was modified in August 2023, and a routine use proposed on May 12, 2026 took effect on June 12, 2026.[^c14-govt1-2023][^c14-govt1-2026] Read the current text with the privacy office; don't rely on a summary, including this one.

**PIV credentials.** For agencies that use the government-wide shared PIV service, the GSA/GOVT-7 notice, HSPD-12 USAccess, covers employees, contractors and others who need routine, long-term access to federal facilities and systems, and lists logical access to federal systems among its purposes.[^c14-govt7] Agencies that run their own credentialing system have their own notice.

**What a government-wide notice means for the agency.** Circular A-108 says every agency, not only the publishing one, must comply with a government-wide notice's terms and the Privacy Act, including access and amendment for records in its control; and no other agency may publish a notice that duplicates it without OMB approval.[^c14-a108]

**What it doesn't settle.** Three questions remain for the privacy office, and the program's design is to ask them in writing before Phase 1 closes (Chapter 12):

| Question | Why it's open | Where the answer comes from |
|---|---|---|
| Does the directory, as a copy of HR data used for access, fall within an existing notice, or does it need the agency's own (for example, a notice for its account and access management systems)? | A directory is retrieved by identifier, adds its own records (sign-ins, access decisions), and serves a purpose beyond personnel administration | The agency's SORN inventory and the privacy office |
| Which notice covers contractors? | OPM/GOVT-1 says contract employees "may" be covered; the contractor register (Chapter 06) is usually the agency's own system | The register's notice, or a new one |
| Is the change significant enough to revise a notice? | A-108 lists, among significant changes, expanding the categories of records, combining systems, a change in configuration or access controls that substantially increases access within the agency, and a new or expanded routine use[^c14-a108] | The privacy office, using A-108 §6.b |

: Open coverage questions for the HR-to-directory flow {.striped .hover}

A revised notice with a new or changed routine use can't be relied on for at least 30 days after publication.[^c14-privacy-act][^c14-a108] That is why Chapter 07 puts privacy in Phase 1: the clock starts when the notice is published, not when the pipeline is ready.

## When a PIA is required, and what reopens it

Section 208 of the E-Government Act requires a privacy impact assessment before an agency develops or procures IT that collects, maintains or disseminates information in identifiable form, and before certain new collections; the agency's CIO or equivalent reviews it, and it is published if practicable.[^c14-egov] OMB M-03-22, which implements section 208, applies it to information about members of the public and doesn't require a PIA for a system that holds information only about government personnel and contractors, although "OMB encourages agencies to conduct PIAs for these systems as appropriate."[^c14-m0322] Circular A-130, the later policy, directs a PIA whenever an agency develops, procures or uses IT to process PII, absent an applicable exception under section 208,[^c14-a130] and SP 800-53 control RA-8, Privacy Impact Assessments, is in the privacy baseline that applies to every system.[^c14-sp80053b]

Two facts make the personnel-only exception a poor fit for workforce identity. The directory rarely holds only employees and contractors: guest accounts for partners and other external collaborators are people outside the government. And the feed is exactly the kind of change M-03-22 names as a reason to update a PIA. The program's design is to treat the PIA as required and its update as a gate; whether an exception applies is the privacy office's call.

M-03-22 §II.B.2 lists the changes that require a PIA to be updated.[^c14-m0322] Most of them have an identity-engineering equivalent:

| M-03-22 trigger | The identity change that hits it | Also a SORN question? |
|---|---|---|
| Significant merging (databases merged, centralized or matched) | Joining the contractor register to HR on the enterprise person key; consolidating two directories | Yes: combining systems changes scope |
| Internal flow or collection (new uses, disclosures or data from a business-process change) | A new attribute in the feed; a new SCIM integration; a new consumer of the audit store | Yes, if it expands categories of records or needs a routine use |
| Alteration in character of data (new identifiable information raises risk) | Adding clearance level, telework or accommodation data, or anything health- or finance-adjacent | Yes: new categories of records |
| Significant system management changes (new uses or technologies) | Core HCM cutover; new middleware; an AI agent granted read access to user profiles ([Book 17](../b17-ai-identity/index.md)) | Sometimes: new location or access |
| New interagency uses | A shared-service provider, or another agency, receiving the feed | Yes: a routine use |
| Commercial sources | Enriching identities from a purchased data set | Yes |
| Conversions | Moving paper onboarding records into the pipeline | Sometimes |

: Identity changes that reopen the PIA {.striped .hover}

A PIA records what is collected and why, its intended use, with whom it is shared, what opportunity people have to decline, how it is secured, and whether a system of records is created; and it is approved by a reviewing official other than the person who procured the system or wrote the assessment.[^c14-m0322] For the identity flow, the program's PIA appendix is the attribute purpose register (next section) plus the integration register (the section after), so that the PIA is regenerated from the same records the pipeline runs on.

## Minimization and purpose limits for directory attributes

The Privacy Act limits an agency's records to information "relevant and necessary" to a purpose required by statute or executive order.[^c14-privacy-act] A-130's Fair Information Practice Principles say the same twice: **minimization** (only PII directly relevant and necessary to a legally authorized purpose, kept only as long as necessary) and **purpose specification and use limitation** (use it only for a purpose explained in the notice and compatible with the purpose of collection).[^c14-a130] A-130 also requires an inventory of the systems that process PII so that the agency can reduce PII "to the minimum necessary."[^c14-a130] In the control catalog these are SI-12(1), Limit Personally Identifiable Information Elements; SA-8(33), Minimization; PT-3, Personally Identifiable Information Processing Purposes; and PM-5(1), Inventory of Personally Identifiable Information.[^c14-sp80053]

The program's design turns those principles into one artifact, the **attribute purpose register**: one row per attribute in Chapter 06's schema and program attribute map.

| Field | Example for `extensionAttribute10` (organization code) |
|---|---|
| Attribute and carrier | Organization code; `extensionAttribute10` in AD and Entra ID |
| Source and authority | Core HCM department ID; HR is the authority (Chapter 04) |
| Purpose | Access targeting: dynamic group rules for organization-scoped access packages |
| Consumers | Named rules and workflows; e.g. group `grp-org-1420-finance@contoso.example` |
| Visibility | Readable by member users by default; no business need for that (Appendix B) |
| Notice and PIA reference | The governing SORN's category of records; PIA section reference |
| Retention | Deleted with the user object at disposition (Chapter 08) |
| Approved by, and date | Privacy office; data architect |

: The attribute purpose register, one row {.striped .hover}

Three rules make the register work:

- **No consumer, no attribute.** An attribute that no rule, workflow or required field reads doesn't flow, and one whose last consumer is retired is removed from the mapping (Appendix B's minimization rule, made checkable).
- **A new use is a new purpose.** The organization code was collected to target access. Reusing it for something else, such as workforce analytics in a reporting tool, is a new purpose under PT-3, and goes back to the privacy office even though no new data moves.
- **Nothing real in test.** Test and training tenants get synthetic identities on `contoso.example`, never an extract of production; that's SI-12(2) and PM-25, both in the privacy baseline.[^c14-sp80053][^c14-sp80053b]

## Disclosures to SaaS and cloud providers

Every downstream system the pipeline feeds receives personnel data. The Privacy Act question is whether that is a use inside the agency or a disclosure outside it, and the answer depends on who operates the recipient.

**A provider operating a system for the agency.** When an agency contracts for the operation of a system of records "by or on behalf of the agency," it must apply the Privacy Act's requirements to that system.[^c14-privacy-act] A-108 treats such a system as maintained by the agency, and tells the agency to publish a notice for it, establish a routine use that permits disclosure to the contractor for operating the system, and put enforceable clauses in the contract and statement of work. It also has the Senior Agency Official for Privacy review and approve, before award, every contract that involves information that identifies and is about individuals.[^c14-a108] The cloud directory, the middleware's hosting and the SaaS applications provisioned by SCIM are usually in this category.

**A routine use.** A routine use is a disclosure outside the agency that maintains the records, for a purpose compatible with the purpose of collection, published in the notice.[^c14-a108] The 2012 text of OPM/GOVT-1 includes a routine use for disclosure to contractors, grantees or volunteers working on a contract, service, grant or job for the federal government;[^c14-govt1-2012] whether that use, or another, covers a given integration is for the privacy office to say against the current notice. A new or significantly modified routine use needs Federal Register publication at least 30 days before it is used.[^c14-privacy-act][^c14-a108]

**Another agency or a shared-service provider.** That is a routine-use disclosure, and usually an information exchange agreement as well (Appendix B).

A-130 makes the agency's privacy program responsible for contractors and third parties that process PII on its behalf, through the contracts and other agreements that bind them.[^c14-a130] The program's design is an **integration register**: one row per downstream system, recording the attributes it receives (a subset of the purpose register), the disclosure basis the privacy office named, the contract and its privacy clauses, whether a disclosure accounting is required, and the deprovisioning behavior when a worker leaves. For example, a learning management system at `lms.contoso.example` receives person key, name, work email, organization code and manager, and nothing else; its row names the contract, the basis and the accounting decision.

## Accounting of disclosures

For each system of records, the Privacy Act requires an accounting of every disclosure, giving its date, nature and purpose and the name and address of the recipient, kept for at least five years or the life of the record, whichever is longer, and made available to the person on request.[^c14-privacy-act] Disclosures to the agency's own officers and employees who need the record for their duties (subsection (b)(1)) and required FOIA releases are exempt.[^c14-privacy-act] PM-21, Accounting of Disclosures, is the control, and it's in the privacy baseline.[^c14-sp80053][^c14-sp80053b]

So the accounting obligation follows the disclosure determination above: internal need-to-know flows don't need one, and routine-use disclosures do. Where one is required, the provisioning log is the raw material, not the accounting. The program's design:

- Export provisioning and audit events for every integration marked "accounting required" to the audit store; Entra ID keeps audit logs for 30 days with a P1 or P2 license, which is far shorter than five years.[^c14-entra-retention]
- Generate the accounting from those events per person: date, integration, attributes sent, purpose from the integration register, recipient name and address from the contract.
- Keep it for five years or the life of the record, whichever is longer, and make it producible for one person on request.

## Correction and redress: through HR, not the directory

The Privacy Act lets a person ask for a record to be corrected. The agency acknowledges the request within 10 working days and then promptly corrects the record or explains its refusal; a refusal can be appealed, with a final determination due within 30 working days.[^c14-privacy-act] Records used to make decisions about a person must be kept with the accuracy, relevance, timeliness and completeness needed for fairness, and anyone who received an accounted disclosure must be told about a correction or a notation of dispute.[^c14-privacy-act] OPM/GOVT-1 tells current employees to contact their current agency to amend their records.[^c14-govt1-2012] A-130 lists access and amendment as a Fair Information Practice Principle; SI-18, Personally Identifiable Information Quality Operations, and SI-18(4), Individual Requests, are the controls, both in the privacy baseline.[^c14-a130][^c14-sp80053b]

For workforce identity that means **one correction path, and it runs through the authoritative source**. Chapter 04's operating rule, "corrections flow upstream," is the privacy rule as well as the engineering one. An example at `contoso.example`: a worker's access review goes to a supervisor she left three months ago, because the reassignment wasn't keyed in HR.

1. The help desk doesn't edit `manager` in the directory. Its script routes the request to HR (for an employee) or to the contractor source owner (for a contractor), and records the ticket.
2. HR corrects the personnel record under its own Privacy Act procedures, with the 10-day acknowledgment.
3. The pipeline propagates the corrected value; the provenance record shows the old and new values and the HR event that changed them (Chapter 11).
4. Every integration that received the wrong value receives the correction on the next cycle. For integrations whose disclosures are accounted, the propagation record is the evidence that the recipient was told.
5. If the wrong value drove an access decision, such as the review above, the access review is rerun with the right reviewer.

A directory-side edit would fix the symptom and leave the record wrong, and the next feed would overwrite it; it is also a drift event (Chapter 11).

**Partner persons.** People who belong to another organization (the External Partner Person class) have no agency HR record, but a directory of them, their access decisions and their sign-in logs is still retrieved by name and identifier, so the system-of-records question applies to them too. Collect only the attributes the agency's decisions read, and correct a wrong name or organization at the partner's source, not in the directory. [Chapter 15](15-external-partner-identity.md#privacy-records-and-redress) sets out the Privacy Act, minimization, records and redress points for the class.

## Retention

The Privacy Act's own retention rule is for the accounting of disclosures; how long the records themselves are kept comes from the records schedule. A-130's minimization principle says to keep PII only as long as needed for its purpose, and SI-12 and SI-12(3), Information Disposal, make that a control.[^c14-a130][^c14-sp80053] OPM/GOVT-1 keeps the official personnel folder for the employee's service and handles other records under NARA schedules.[^c14-govt1-2012] For identity systems, General Records Schedule 3.2 covers system access records such as user profiles, log-in files and audit trails: destroy when business use ceases, or, for systems requiring special accountability for access, six years after the password is changed or the account is terminated.[^c14-grs32]

The program's design: each store in the pipeline has a schedule item and a disposition step. User objects are deleted at disposition by the post-separation workflow (Chapter 08); the audit store and its accountings are kept for the longer of the schedule and the five-year accounting rule; operational logs keep the person key and a payload hash only (Appendix B). [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist) has the records checklist for retiring the old stores.

## The Senior Agency Official for Privacy

A-130 requires every agency to designate a Senior Agency Official for Privacy with agency-wide responsibility and accountability for privacy, a central policy-making role, and a review of privacy risks that "should begin at the earliest planning and development stages."[^c14-a130] Under A-130's risk management framework, the same official reviews and approves the categorization of systems that process PII, designates which privacy controls are program, common, system-specific or hybrid, assesses the system's privacy controls before it operates, and reviews the authorization package; the authorizing official must consider the official's input.[^c14-a130] A-108 adds the contract review above.[^c14-a108]

For this book, the official (or the privacy staff the official delegates to) signs four things: the disclosure basis for each leg and each integration; the attribute purpose register and every change to it; the PIA and its updates; and the privacy controls in the identity system's authorization package. Chapter 07's responsibility matrix puts the privacy office in the decision seat for these; this chapter says what each decision needs.

## NIST SP 800-53: the PT family and privacy at Moderate

**No PT control is in the Moderate baseline.** In NIST SP 800-53B's Release 5.2.0 baselines, the low, moderate and high baselines are security baselines; the PII processing and transparency controls are in the separate privacy baseline, which "is applied to systems irrespective of impact level."[^c14-sp80053b] A Moderate system that processes PII, which every system in this book is, carries both: the Moderate security baseline and the privacy baseline. Of the privacy baseline's 96 controls and enhancements, 43 are also in the Moderate baseline (among them SI-12, CM-4, SA-9 and PS-6), and 53 come only from the privacy baseline (all of PT, most PM privacy controls, RA-8, AU-3(3), SI-12(1)–(3), SI-18 and SI-19).[^c14-sp80053b]
| Control | In the privacy baseline | What the identity engineer does |
|---|---|---|
| PT-1 Policy and Procedures | Yes | Follows the agency's PII processing policy; no identity-specific policy |
| PT-2 Authority to Process PII | Yes | Records the authority for each attribute in the purpose register |
| PT-3 PII Processing Purposes | Yes | Records purpose per attribute; routes any new use to the privacy office |
| PT-4 Consent | Yes | Rarely applies: workforce records rest on statute, not consent |
| PT-5 Privacy Notice; PT-5(2) Privacy Act Statements | Yes | Confirms onboarding forms that feed HR carry the statement (an HR task) |
| PT-6 System of Records Notice; PT-6(1), PT-6(2) | Yes | Brings coverage questions and significant changes to the privacy office |
| PT-7 Specific Categories of PII; PT-7(1) SSNs; PT-7(2) First Amendment | Yes | Keeps the SSN out of the pipeline; never maps anything about First Amendment activity |
| PT-8 Computer Matching Requirements | Yes | Flags any computer matching of HR data with another agency's records, such as for benefit eligibility or debt collection |

: The PT family and the identity engineer {.striped .hover}

The other privacy-baseline controls this chapter uses are RA-8 (the PIA), PM-5(1) (inventory of PII), PM-21 (accounting of disclosures), PM-22 (PII quality management), PM-25 and SI-12(2) (no production PII in test), AU-3(3) (limit PII in audit records), SA-8(33) and SI-12(1) (minimization), SC-7(24) (PII at system boundaries), SI-18 and SI-18(4) (quality and individual requests), and AC-3(14) (individual access).[^c14-sp80053][^c14-sp80053b]

**The NIST Privacy Framework** is a voluntary tool. Version 1.0 (January 16, 2020) organizes privacy risk management into five Functions, Identify-P, Govern-P, Control-P, Communicate-P and Protect-P; a Version 1.1 initial public draft exists but isn't final.[^c14-pf][^c14-pf-page] It adds no requirement to the controls above. An agency that uses it can file this chapter's registers under Identify-P (the inventory and purposes), its correction path and minimization under Control-P, and its notices under Communicate-P; that mapping is the program's suggestion, not NIST's.

## The privacy checklist

Run it before a change reaches the pipeline's change control (Chapter 12, Phase 6), and attach the answers to the change record. Each line names who answers.

**Before adding an attribute**

- [ ] What decision reads it: a named rule, workflow or required field? If none, stop. *(Identity engineer)*
- [ ] Is it in the HR record already, and is HR (or the contractor source) its authority? *(Data architect)*
- [ ] Is it in a category of records the governing SORN already covers? *(Privacy office)*
- [ ] Is it sensitive in itself (clearance, health, accommodation, finance, location) or does it change the character of the data? *(Privacy office)*
- [ ] Who can read it once it lands, by default, and is that needed? Restrict if not. *(Identity engineer)*
- [ ] Will it appear in logs? Then log the person key and a hash, not the value. *(Identity engineer)*
- [ ] Does the PIA need an update, and is the attribute purpose register row written and approved? *(Privacy office)*
- [ ] Where is it deleted, and under which schedule item? *(Records officer)*

**Before adding an integration**

- [ ] Which attributes does the recipient need for its function, and which does it not get? *(Application owner, identity engineer)*
- [ ] Who operates the recipient: the agency, a contractor on its behalf, or another agency? *(Contracting officer)*
- [ ] What is the disclosure basis, under which notice and routine use, and has any new routine use been published at least 30 days? *(Privacy office)*
- [ ] Does the contract carry the privacy clauses, and did the Senior Agency Official for Privacy review it before award? *(Contracting officer, privacy office)*
- [ ] Is an accounting of disclosures required, and is it generated from the provisioning events? *(Privacy office, identity engineer)*
- [ ] Does the recipient receive corrections and deprovisioning from the pipeline, and is that tested? *(Identity engineer)*
- [ ] Is the PIA updated for the new sharing, and the integration register row written? *(Privacy office)*
- [ ] Does the recipient keep the data after the worker leaves, and for how long? *(Application owner, records officer)*

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 13 — Reference Deployment (Illustrative)](13-reference-deployment.md) · [Book index](index.md) · [Next: Chapter 15 — External Partner Identity →](15-external-partner-identity.md)
:::

[^c14-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource*, July 28, 2016 (§5.a(1)(a)(ii), inventory of systems that process PII; §10, definition 57, personally identifiable information; Appendix I §5.f, the SAOP and the authorization decision; Appendix II §3, Fair Information Practice Principles: Access and Amendment, Minimization, Purpose Specification and Use Limitation; §4, Senior Agency Official for Privacy; §5.d, contractors and third parties; §5.e, privacy impact assessments; §5.i, the SAOP in the risk management framework), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Nov 2, 2026).
[^c14-privacy-act]: Privacy Act of 1974, 5 U.S.C. §552a (2023 edition), subsections (a)(5), (a)(7), (b)(1), (b)(3), (c)(1)–(4), (d)(2)–(3), (e)(1), (e)(5), (e)(11) and (m)(1), <https://www.govinfo.gov/content/pkg/USCODE-2023-title5/html/USCODE-2023-title5-partI-chap5-subchapII-sec552a.htm> (accessed Nov 2, 2026).
[^c14-govt1-2012]: Office of Personnel Management, "Privacy Act of 1974: Update Existing System of Records" (OPM/GOVT-1, General Personnel Records: system location, categories of individuals and records, routine use jj, retention and disposal, contesting record procedure), *Federal Register* 77 FR 73694, December 11, 2012, <https://www.govinfo.gov/content/pkg/FR-2012-12-11/html/2012-29777.htm> (accessed Nov 2, 2026).
[^c14-govt1-2023]: Office of Personnel Management, "Privacy Act of 1974; System of Records" (modified system of records, OPM/GOVT-1, General Personnel Records: system location; system manager, delegation of access, amendment and disclosure for current employees to the employing agency), *Federal Register* 88 FR 56058, August 17, 2023, Docket OPM-2023-0024, <https://www.govinfo.gov/content/pkg/FR-2023-08-17/html/2023-17651.htm> (accessed Nov 2, 2026).
[^c14-govt1-2026]: Office of Personnel Management, "Privacy Act of 1974; System of Records" (new routine use for OPM/GOVT-1; comments due June 11, 2026; effective June 12, 2026), *Federal Register* 91 FR 25937, May 12, 2026, <https://www.govinfo.gov/content/pkg/FR-2026-05-12/html/2026-09339.htm> (accessed Nov 2, 2026).
[^c14-govt7]: General Services Administration, "Privacy Act of 1974; Notice of an Updated System of Records" (GSA/GOVT-7, HSPD-12 USAccess: categories of individuals; purposes), *Federal Register* 80 FR 64416, October 23, 2015, <https://www.govinfo.gov/content/pkg/FR-2015-10-23/html/2015-26940.htm> (accessed Nov 2, 2026).
[^c14-a108]: Office of Management and Budget, Circular A-108, *Federal Agency Responsibilities for Review, Reporting, and Publication under the Privacy Act*, December 2016 (§6.b, significant changes; §6.e, timing; §6.i, government-wide systems of records; §6.j, systems of records operated by a contractor, and SAOP review of contracts; §6.k, routine uses; §12, privacy reviews), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A108/omb_circular_a-108.pdf> (accessed Nov 2, 2026).
[^c14-egov]: E-Government Act of 2002, Pub. L. 107-347, §208(b)(1), Privacy Impact Assessments, <https://www.govinfo.gov/content/pkg/PLAW-107publ347/html/PLAW-107publ347.htm> (accessed Nov 2, 2026).
[^c14-m0322]: Office of Management and Budget, M-03-22, *OMB Guidance for Implementing the Privacy Provisions of the E-Government Act of 2002*, September 26, 2003 (§II.B.1, when to conduct a PIA; §II.B.2, changes that require an update; §II.B.3.a and note 6, systems about government personnel and contractors; §II.C.1, content; §II.C.3.a, the reviewing official), <https://georgewbush-whitehouse.archives.gov/omb/memoranda/m03-22.html> (accessed Nov 2, 2026).
[^c14-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, Release 5.2.0 (control titles and statements for AC-3(14), AU-3(3), PM-5(1), PM-21, PM-22, PM-25, PT-1 to PT-8, RA-8, SA-8(33), SC-7(24), SI-12 and SI-12(1)–(3), SI-18, SI-18(4), SI-19), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Nov 2, 2026).
[^c14-sp80053b]: National Institute of Standards and Technology, SP 800-53B, *Control Baselines for Information Systems and Organizations*, September 2020, with the Release 5.2.0 note of August 27, 2025 (no change to the baselines); abstract ("a privacy baseline that is applied to systems irrespective of impact level"), <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final>; baseline membership read from NIST's OSCAL Release 5.2.0 profiles, `NIST_SP-800-53_rev5_MODERATE-baseline_profile.json` (287 controls and enhancements, no PT control) and `NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json` (96, including PT-1 to PT-8, PT-5(2), PT-6(1), PT-6(2), PT-7(1) and PT-7(2)), <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Nov 2, 2026).
[^c14-entra-retention]: Microsoft Learn, "Microsoft Entra data retention" (audit logs and sign-ins: seven days with Entra ID Free, 30 days with P1 or P2; route to storage to keep longer), <https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-reports-data-retention> (accessed Nov 2, 2026).
[^c14-grs32]: National Archives, General Records Schedule 3.2, *Information Systems Security Records*, Transmittal 33, items 030 and 031, system access records, <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf> (accessed Nov 2, 2026).
[^c14-pf]: National Institute of Standards and Technology, *NIST Privacy Framework: A Tool for Improving Privacy through Enterprise Risk Management*, Version 1.0, January 16, 2020 (§2.1, the Core and its five Functions), <https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.01162020.pdf> (accessed Nov 2, 2026).
[^c14-pf-page]: National Institute of Standards and Technology, "Privacy Framework" (a voluntary tool; Version 1.0 current; Version 1.1 initial public draft), <https://www.nist.gov/privacy-framework> (accessed Nov 2, 2026).
