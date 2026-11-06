---
title: "Appendix C — Security Categorization Walk-Through"
description: "A worked example of RMF tasks P-12, C-1, C-2 and C-3 for one illustrative identity platform: choosing information types from NIST SP 800-60, reading their provisional impact levels, adjusting them with the special factors, taking the FIPS 199 high-water mark and recording the authorizing official's approval, with a fill-in template, a Copilot prompt and a list of what stays the agency's decision."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Security Categorization Walk-Through

*A categorization is four short records in a row: what the system is, what information it holds, what each piece of information is worth to lose, and who signed off on the answer.*

::: {.callout-note}
## In this appendix
One illustrative system taken through the Categorize step of the Risk Management Framework: the information types it holds, their provisional impact levels from NIST SP 800-60, the adjustments, the FIPS 199 high-water mark and the approval record. Then a fill-in template and a Copilot prompt for the reader's own system, and the list of decisions the workbook can't make for the agency.
:::

::: {.callout-important}
## An illustration, not the agency's categorization
The system below is invented, and so is every adjustment. The information-type names, section identifiers and provisional levels come from NIST SP 800-60 Volume II, Revision 1 (August 2008), as read for this appendix. Where the walk-through maps a type to a function of the example system by judgment, the table says so, and the agency confirms that mapping for its own system. Nothing here is an agency's recorded categorization, and the authorizing official alone approves one.
:::

## Where this fits

[Chapter 01](01-proof-not-a-promise.md#fips-199-an-impact-level-per-security-objective) explains FIPS 199, the FIPS 200 high-water mark and why "Moderate" is a statement that a process happened. This appendix does the process once, with the standards' own text beside it. Four tasks of NIST SP 800-37 Rev. 2 are involved:

| Task | What it asks (SP 800-37 Rev. 2) | Where it is in this appendix | Primary responsibility in the standard |
|---|---|---|---|
| P-12 | Identify the types of information to be processed, stored and transmitted by the system | Step 2 | System owner; information owner or steward |
| C-1 | Document the characteristics of the system | Step 1 | System owner |
| C-2 | Categorize the system and document the results | Steps 3 to 6 | System owner; information owner or steward |
| C-3 | Review and approve the security categorization results and decision | Step 7 | Authorizing official or designated representative; the senior agency official for privacy, for a system that processes personally identifiable information |

SP 800-37 lists P-12 in the Prepare step and C-1 to C-3 in Categorize, so the order of work is P-12 as an input to C-2, with the system description (C-1) alongside it.[^aC-sp80037] The system boundary the description rests on is the artifact [Book 10, Chapter 11](../b10-cloud-boundary/11-the-authorization-package.md#the-boundary-as-one-artifact) builds, and the learner's version of this exercise is the compliance track's orientation module ([Book 16, Chapter 03](../b16-people/03-the-compliance-track.md#module-0)). RA-2, Security Categorization, is the control that requires the result and its rationale to be documented in the security plan and approved ([Chapter 01](01-proof-not-a-promise.md#fips-199-an-impact-level-per-security-objective)).

## The method in SP 800-60

SP 800-60 Volume I describes four steps: identify information types, select provisional impact levels, review and adjust them, and assign the system security category.[^aC-sp60v1] Volume II holds the catalog. Its Appendix C covers management and support information types, and Appendix D covers mission-based ones. Each type carries a recommended category written as a triple, for example `{(confidentiality, Low), (integrity, Moderate), (availability, Low)}`, and a discussion of special factors that justify moving a level.[^aC-sp60v2]

Two rules in the method matter most for this walk-through:

- **The provisional level is a starting value.** Volume I tells the organization to review it "in the context of the organization, environment, mission, use, and data sharing," adjust it using the special factors, and document each adjustment and its justification.[^aC-sp60v1]
- **The system takes the highest value per objective.** For an information system, the level for each of confidentiality, integrity and availability is the highest level any one information type on the system has for it (the high-water mark), and Volume I then assigns the overall impact level as the highest of the three.[^aC-sp60v1] FIPS 199 permits "not applicable" for a single type but not for the system, and Volume I notes a low minimum for confidentiality, integrity and availability on every system, because the system's own processing functions and information need protection.[^aC-sp60v1]

## The example system

*Northwind identity platform* is an invented agency workforce identity platform: a directory of employee and contractor accounts, a sign-in service with multifactor authentication, and a privileged access broker that issues time-limited administrator access to other agency systems. It writes sign-in and administrator-action logs to a retention store. It is government-operated, hosted on a certified cloud service the agency uses as an external service, and has about 20,000 accounts.

### Step 1: describe the system (C-1)

SP 800-37 lists the kinds of descriptive information a plan can carry: the system's name and identifier, purpose, mission or business processes supported, owner, authorization boundary, interfaces and interconnections, information types, users, and hosting and ownership arrangement.[^aC-sp80037] The example, in the template's form:

| Field | Northwind identity platform |
|---|---|
| System name and identifier | Northwind identity platform; identifier assigned by the agency's inventory |
| Purpose and mission supported | Proves who each person is and what each is allowed to reach, for the agency's other systems |
| System owner / information owner | Named roles, not people, in the template |
| Boundary (in) | Directory, sign-in service, multifactor service, privileged access broker, log store |
| Boundary (out) | The systems that trust it for sign-in; the cloud service's own infrastructure, which is inherited |
| Interconnections | Every agency system that accepts its sign-in tokens (listed in the system inventory) |
| Users | Employees, contractors, and the administrators who manage the platform |
| Hosting and operation | Government-operated on a certified cloud service; the agency's authorization documents its own use |
| Processes PII? | Yes: names, work contact details and account identifiers of individuals |

### Step 2: identify the information types (P-12)

The question is which SP 800-60 types describe what the system stores, processes and transmits. The walk-through selects four, all from Volume II Appendix C. The "Basis" column is the reason for the choice, which Volume I asks the organization to record.[^aC-sp60v1]

| Information type (SP 800-60 Vol. II, App. C) | ID | What it covers in the example | Basis |
|---|---|---|---|
| Personal Identity and Authentication | C.2.8.9 | Account records of individuals: names, identifiers, credentials' metadata | The catalog's own cross-references point here for personal (Privacy Act) information. Its description is about identifying people for federal benefits, so **applying it to workforce accounts is a judgment to confirm** |
| Information Security | C.3.5.5 | Security policy, authentication and access rules, configuration of the platform | The type is defined as functions "covering such services as identification, authentication, and non-repudiation" |
| System and Network Monitoring | C.3.5.8 | Sign-in events, administrator actions, alerts | The type covers "security operations [intrusion monitoring, auditing, etc.]" |
| Record Retention | C.3.5.6 | The retained copy of the logs and records | The type covers management of official documents and records; **whether the retained logs count as an official record is the agency's call** |

The identifiers are the section numbers of Volume II. SP 800-60's own worked figure labels types the same way, for example `[D.7.1] Energy Supply`.[^aC-sp60v1] An agency may add types of its own where the catalog has none; if it does, the type is the agency's, with the agency's level and rationale, not an SP 800-60 type.[^aC-sp80037]

### Step 3: read the provisional impact levels

These are the recommended levels as written in Volume II, Revision 1.[^aC-sp60v2]

| Information type | Confidentiality | Integrity | Availability |
|---|---|---|---|
| Personal Identity and Authentication (C.2.8.9) | Moderate | Moderate | Moderate |
| Information Security (C.3.5.5) | Low | Moderate | Low |
| System and Network Monitoring (C.3.5.8) | Moderate | Moderate | Low |
| Record Retention (C.3.5.6) | Low | Low | Low |

### Step 4: review and adjust

Volume I names the factors to apply. The example applies four, and each result is a recorded decision with a reason. These adjustments are illustrations of how the factors work, not findings about any real system.[^aC-sp60v1]

| Type and objective | Factor (SP 800-60 Vol. I) | Provisional | Adjusted | Rationale recorded |
|---|---|---|---|---|
| Information Security, availability | Critical system functionality (4.4.2.2): access to a system can result in access to others, so the criticality of dependent systems counts | Low | **Moderate** *(illustration)* | Every dependent agency system is unusable to its users when sign-in is down; the dependents' own categorization is Moderate |
| Information Security, confidentiality | Configuration and security policy information, at minimum Low; and credential material such as passwords and keys "need to be protected" | Low | Low *(no change)* | The platform stores no secrets in this type; secrets are held by the hardware-backed service and are not part of the type |
| Personal Identity and Authentication, confidentiality | Privacy information: the level "should generally fall into the moderate range" | Moderate | Moderate *(no change)* | Account data of 20,000 individuals; the privacy office has confirmed it is PII |
| Record Retention, confidentiality | The type's special factor: data retained takes at least the level of the highest-impact type it holds | Low | **Moderate** *(illustration)* | The retained logs contain the same account identifiers as the monitoring type |

Two things in the table are worth noticing. The aggregation factor (4.4.2.1) says that a large body of otherwise ordinary data can be more sensitive together than in pieces; a directory of every account is the case, and the example resolves it by recording that the Moderate level already reflects it. And the discussion of Personal Identity and Authentication warns that where identity data controls access to facilities or border control, the consequences of forged credentials can justify High; the example platform controls access to systems, not buildings, and the agency decides whether any of its dependents changes that.[^aC-sp60v2]

### Step 5: take the high-water mark

For each objective, take the highest value across the four types, using the adjusted levels.

| Objective | Personal Identity and Authentication | Information Security | System and Network Monitoring | Record Retention | System value |
|---|---|---|---|---|---|
| Confidentiality | Moderate | Low | Moderate | Moderate | **Moderate** |
| Integrity | Moderate | Moderate | Moderate | Low | **Moderate** |
| Availability | Moderate | Moderate | Low | Low | **Moderate** |

Security category of the example system: `SC Northwind identity platform = {(confidentiality, Moderate), (integrity, Moderate), (availability, Moderate)}`. The overall impact level is the highest of the three: **Moderate**.[^aC-sp60v1] FIPS 200 then points to the SP 800-53B Moderate baseline as the starting set of controls, as [Chapter 01](01-proof-not-a-promise.md#fips-200-the-high-water-mark) describes.

The adjustments changed nothing in the final triple here, because Personal Identity and Authentication already carries Moderate in all three objectives. That is typical, and it's why the record matters: an assessor or a successor can see which levels came from the catalog and which came from judgment, and what would flip the result. In this example a dependent system categorized High, or a finding that the identity data opens physical or border access, would.

### Step 6: record it (C-2)

The result and its rationale go into the security plan or an attachment to it, and are cross-referenced from the privacy plan for a system that processes PII.[^aC-sp80037] The template below is that record.

### Step 7: approve it (C-3)

The approval is a decision by the people with authority, not a field the system owner fills in. In SP 800-37 the senior agency official for privacy reviews and approves the categorization of a system that processes PII before the authorizing official reviews it. The authorizing official or the designated representative then checks that the category fits the mission and the organization's other systems and risk strategy, and may give guidance that limits tailoring at the Select step. If it isn't approved, the system owner repeats the categorization and resubmits.[^aC-sp80037] Approved results then update the system's registration information.

## Fill-in template

Copy the tables into the agency's own records. Leave a cell blank rather than guess; a blank is a question for the owner, and a guess is a finding for the assessor.

### 1. System description (C-1)

| Field | Entry |
|---|---|
| System name and identifier | |
| Purpose and mission or business processes supported | |
| System owner (role) / information owner or steward (role) | |
| Authorization boundary: in / out (link the boundary artifact) | |
| Interconnected systems and identifiers | |
| Users and roles | |
| Hosting, ownership and operation (government or contractor; external services used) | |
| Processes PII? Who confirmed (privacy office) and when | |
| Laws, directives or policies that set a minimum level (for example the Privacy Act, trade secrets) | |

### 2. Information types (P-12)

| SP 800-60 type name | ID (volume II section) | What it covers here | Basis for selection | Source of the level read (page or section) | Confirmed by (role, date) |
|---|---|---|---|---|---|
| | | | | | |
| *(Agency-defined type, if the catalog has none: say so)* | n/a | | | | |

### 3. Impact levels and adjustments (C-2)

| Type | Objective | Provisional (SP 800-60 or FIPS 199 criteria) | Adjusted | Factor applied | Rationale |
|---|---|---|---|---|---|
| | C | | | | |
| | I | | | | |
| | A | | | | |

### 4. Categorization record (C-2)

| Objective | System value (highest across types) | Driven by which type |
|---|---|---|
| Confidentiality | | |
| Integrity | | |
| Availability | | |
| **Overall impact level** (highest of the three) | | |

`SC system = {(confidentiality, __), (integrity, __), (availability, __)}`

### 5. Approval (C-3)

| Role | Name | Decision (approved / not approved / approved with limits on tailoring) | Date | Reference to the system's registration update |
|---|---|---|---|---|
| Senior agency official for privacy *(systems that process PII)* | | | | |
| Authorizing official or designated representative | | | | |

## Copilot prompt for the agency's tenant

Paste this at work, in the agency's own Copilot, with the system description and the SP 800-60 pages for the candidate types pasted below it. Nothing about the agency's system leaves the agency's environment, and the workbook never sees the answer.

```text
You are helping a system owner prepare a security categorization record
for review. Use only the text I paste below. Do not use outside knowledge
of NIST publications.

I will paste: (1) a description of my system; (2) text from NIST SP 800-60
Volume II Revision 1 for the information types I think apply; (3) the
categorization section of my agency's policy, if there is one.

Do the following, in order:
1. List the information types from the pasted SP 800-60 text that appear to
   match the system. For each, give its name and section ID exactly as in
   the pasted text, and the reason. If a type seems to fit only by analogy,
   say "analogy" and why. Do not invent a type name, ID or level. If the
   pasted text does not contain a type I need, say so.
2. For each type, quote the recommended confidentiality, integrity and
   availability levels from the pasted text. If a level is not in the text,
   write "not in the pasted text: confirm" and do not guess.
3. For each type, list the special factors in the pasted text that could
   raise or lower a level, and whether my description triggers them. Mark
   these as questions for the information owner, not conclusions.
4. Using the pasted text on aggregation and critical system functionality,
   list what I should check about systems that depend on this one.
5. Build the table: type, objective, provisional level, adjusted level,
   rationale. Leave "adjusted level" blank where I have not given you a
   decision.
6. Take the highest level per objective across types and state the overall
   impact level as the highest of the three. Show which type drives each.
7. List every assumption and every item I must confirm, and who in my
   agency should decide it (system owner, information owner, privacy
   official, authorizing official).

Do not approve anything. Do not say the categorization is correct. End
with: "Draft for the system owner and the authorizing official to review."
```

Check the output against the pasted standard text before using any of it. The assistant can put a record in order; it can't tell the agency what its information is worth.

## What stays the agency's decision

| Decision | Why the workbook can't make it | Who decides (SP 800-37 Rev. 2) |
|---|---|---|
| Which information types the system holds, and whether a catalog type fits | The catalog is a guide; the types are the agency's mission information | System owner; information owner or steward |
| Whether a provisional level is right for the agency's mission and environment | Volume I says the impact of one type "can vary" across agencies and over a type's life cycle | System owner; information owner; with the senior leaders the standard names |
| Whether PII is present and what the privacy review requires | A legal and policy determination | System privacy officer; senior agency official for privacy |
| The final categorization | RA-2 and C-3 require the authorizing official or designated representative to approve it | Authorizing official |
| Any minimum level the agency's own policy sets | Agency policy | Chief information officer; senior agency information security officer |
| Whether the system is a high value asset or sits in an agency prioritization | The agency's list | Authorizing official with the risk executive function |

## Honest limits

- **The catalog is dated.** SP 800-60 Revision 1 is from August 2008 and refers to the 2007 Federal Enterprise Architecture reference models. Its type names are still the common vocabulary; check the NIST publication page for a later revision before relying on a level.
- **Mapped by judgment.** Three of the four example types are chosen by function, and Personal Identity and Authentication and Record Retention each carry an explicit caveat above. A different agency could reasonably choose differently.
- **The walk-through is not a baseline.** It ends at the categorization. Selecting and tailoring controls is the next RMF step and is covered in [Chapter 03](03-the-baseline-and-the-crosswalk.md) and [Appendix A](appendix-a-control-crosswalk.md).

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Product Inventory Questionnaire](appendix-b-product-inventory-questionnaire.md) · [Book index](index.md)
:::

[^aC-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations*, December 2018, Tasks P-12, C-1, C-2 and C-3 (chapter 3) and Appendix E (roles), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Nov 6, 2026).
[^aC-sp60v1]: National Institute of Standards and Technology, SP 800-60 Vol. 1 Rev. 1, *Guide for Mapping Types of Information and Information Systems to Security Categories*, August 2008, sections 4.1 to 4.5 (steps, special factors, high-water mark, documentation and Figure 3), <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-60v1r1.pdf> (accessed Nov 6, 2026).
[^aC-sp60v2]: National Institute of Standards and Technology, SP 800-60 Vol. 2 Rev. 1, *Volume II: Appendices to Guide for Mapping Types of Information and Information Systems to Security Categories*, August 2008, Appendix C, sections C.2.8.9, C.3.5.5, C.3.5.6 and C.3.5.8, <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-60v2r1.pdf> (accessed Nov 6, 2026).
