---
title: "Appendix D — Partner Identity Record"
description: "The reusable record for one External Partner Person relationship: partner and authority, risk, agreement and assurance, route and user type, lifecycle and operations, and the readiness checks with their decider, as a copy-paste Markdown block with a worked example for a fictional state partner."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b03-hr-identity
book: B03
part: Appendix
series-order: 93
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix D — Partner Identity Record

*One record per partner relationship, written before access is granted and kept as evidence after.*

::: {.callout-note}
## In this appendix
The record [Chapter 15](15-external-partner-identity.md) requires for each partner relationship. A blank record to copy, field-by-field notes, and a worked example for a fictional state partner. The record names owners, decisions and references. It holds no personal data about individual partner persons, and no secrets.
:::

The record is vendor-neutral. The Microsoft Entra values it asks for (tenant IDs, the user type, the access package) are filled in from [Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md). Keep one record per partner organization and use case, in the repository beside the configuration it describes, so that a change to the configuration and a change to the record arrive in the same pull request.

Three rules apply to every field:

- **Reference, don't copy.** Put the agreement, the privacy determination and the records schedule in as identifiers and dates. The documents live where the agency keeps them.
- **One decider.** Each readiness check in section F names one decider, the agency business owner. The authorizing official is consulted on the last check and does not co-sign it.
- **A blank is a finding.** An empty field means the work isn't done. Write `none` or `not applicable` with a reason when that is the answer.

## The blank record

Copy this block into a new file named `partner-<organization>-<use-case>.md`.

````markdown
# Partner Identity Record: <organization> / <use case>

Record version: <n>        Date: <YYYY-MM-DD>        Next review: <YYYY-MM-DD>

## A. Authority and purpose
- Partner legal name:
- Partner class: State | Tribal | Federal | Commercial | Academic | Nonprofit | Other
- Identity class: External Partner Person
- Authoritative affiliation source (system and owner):
- Credential authority (issuer and owner):
- Business purpose and resources reached:
- Eligible partner affiliations (who qualifies):
- Expected unique person count, and how it was counted:

## B. Owners
- Agency business owner (decider):
- Sponsor (named role, one or more people):
- Resource or application owner:
- Partner accountable owner and contact:
- Agency security and privacy contacts:
- Escalation contacts tested on (date):

## C. Risk, agreement and assurance
- Agreement reference (MOU / ISA / DSA / contract) and expiry:
- System impact level and transaction risk:
- Identity assurance (IAL) required, and how the partner meets it:
- Authentication assurance (AAL) required, accepted authenticators, phishing resistance:
- Federation assurance (FAL) required, and the assurance the partner states:
- Basis for the levels (impact assessment reference, tailoring record):
- Data categories reached: PII | CUI | financial | other
- Privacy determination reference (system of records, PIA or PTA):
- Records determination reference (schedule and owner):
- Section 508 check of request, approval and support workflows (date):
- Authorization boundary note (inside the system boundary, or interface and inherited controls):

## D. Route and user type
- Route: access package (default) | cross-tenant synchronization (exception)
- Reason for an exception (required when synchronization):
- User type: Guest (default) | Member (exception record reference required)
- Partner tenant or identity provider and how it was validated:
- Attributes asserted or provisioned, and why each is needed:
- Matching and collision rule:
- Cloud pair, where the partner is in a Government cloud:

## E. Lifecycle and operations
- Joiner / mover / leaver authority at the partner:
- Disablement time limit after a leaver notice (hours):
- Emergency suspension: who may order it, who acts, how the partner is told:
- Access review: cadence, reviewer, and what happens to no response:
- Population reconciliation: cadence and the evidence kept:
- Incident notification: timeline and contact in both directions:
- Relationship termination plan, including removal of accounts left behind:
- Logs kept, where, and for how long:

## F. Readiness checks (one decider: the agency business owner)
| # | Check | Evidence reference | Date | Decided by |
|---|---|---|---|---|
| 1 | Class and authoritative source approved | | | |
| 2 | Federal-requirement applicability recorded | | | |
| 3 | Agreement, privacy, records, security and boundary reviewed | | | |
| 4 | Assurance approved for each protected transaction | | | |
| 5 | Partner and agency owners named; escalation contacts tested | | | |
| 6 | Population scope and unique count reconciled | | | |
| 7 | Attributes and claims minimized and validated | | | |
| 8 | Create, update, disable, remove, emergency suspension and rollback tested | | | |
| 9 | Policy and application authorization tested, including denial cases | | | |
| 10 | Monitoring, review, drift, bulk-change and incident runbooks working | | | |
| 11 | Production enablement approved. Authorizing official consulted on (date): | | | |
````

## Field notes

| Section | What a good entry looks like | Where the rule comes from |
|---|---|---|
| A. Authority and purpose | Names the system that says the person is affiliated and the party that issued the credential. The expected unique count is the number of distinct people, not the number of group members, because nested and overlapping groups inflate the second | [Chapter 15](15-external-partner-identity.md#why-a-partner-is-not-an-employee-or-a-contractor) |
| B. Owners | People or roles with a contact, not teams without names. The sponsor is the agency-side person who vouches for the partner persons' access and reviews it; the business owner decides | [Chapter 15](15-external-partner-identity.md#who-does-what-partner-and-agency); [Book 04, Chapter 06](../b04-access/06-who-decides-access.md#the-responsibility-matrix) |
| C. Risk, agreement and assurance | The levels follow from an impact assessment of the transaction, with tailoring written down. Record the partner's stated assurance and how the agency checked it. Don't write a credential down as PIV-equivalent without a policy that says so | [Chapter 15](15-external-partner-identity.md#assurance-by-transaction-risk) |
| D. Route and user type | Default route is an access package. A synchronization exception states why an invitation can't do the job. Guest is the default user type, and a Member entry points to an exception record | [Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md) |
| E. Lifecycle and operations | Times and owners, each one testable. "Promptly" isn't an entry | [Chapter 08](08-joiner-mover-leaver.md) for the agency's own lifecycle; [Chapter 15](15-external-partner-identity.md) for the partner's |
| F. Readiness checks | Each row cites the evidence by reference and date. The business owner decides every row; the authorizing official is consulted on row 11 and the date recorded | [Chapter 15](15-external-partner-identity.md#readiness-checks) |

: How to fill each section {.striped .hover}

## A worked example

A fictional state labor department, `fabrikam.example`, needs 40 caseworkers to read case files in an agency application at `contoso.example`. The example shows the shape of an entry, not a recommendation of any value.

````markdown
# Partner Identity Record: Fabrikam State Labor Department / Case file read access

Record version: 1        Date: 2026-11-06        Next review: 2027-05-06

## A. Authority and purpose
- Partner legal name: Fabrikam State Department of Labor
- Partner class: State
- Identity class: External Partner Person
- Authoritative affiliation source (system and owner): State HR system, state labor department HR director
- Credential authority (issuer and owner): State department identity provider, state labor department CIO office
- Business purpose and resources reached: Read-only view of benefit case files in the Case Review application
- Eligible partner affiliations (who qualifies): Full-time state employees in the Claims Review unit
- Expected unique person count, and how it was counted: 40; counted from the partner's roster, reconciled to group members on 2026-11-02 (42 members, 2 duplicates)

## B. Owners
- Agency business owner (decider): Director, Benefits Programs, contoso.example
- Sponsor (named role, one or more people): Program manager, Claims Liaison Office (2 named)
- Resource or application owner: Case Review application owner
- Partner accountable owner and contact: State labor department CIO, contact on file
- Agency security and privacy contacts: ISSO for Case Review; Privacy Office
- Escalation contacts tested on (date): 2026-10-30

## C. Risk, agreement and assurance
- Agreement reference (MOU / ISA / DSA / contract) and expiry: ISA-2026-014, expires 2029-09-30
- System impact level and transaction risk: Moderate; read of PII in benefit files
- Identity assurance (IAL) required, and how the partner meets it: IAL2, state employee proofing at hire, documented in the ISA
- Authentication assurance (AAL) required, accepted authenticators, phishing resistance: AAL2 with phishing-resistant authenticator, required by agency policy at sign-in
- Federation assurance (FAL) required, and the assurance the partner states: FAL2, partner states signed assertions; checked in test 2026-10-28
- Basis for the levels (impact assessment reference, tailoring record): Impact assessment CR-2026-031; no tailoring
- Data categories reached: PII
- Privacy determination reference (system of records, PIA or PTA): PIA update 2026-10-15
- Records determination reference (schedule and owner): Agency records officer, determination REC-2026-007
- Section 508 check of request, approval and support workflows (date): 2026-10-20
- Authorization boundary note (inside the system boundary, or interface and inherited controls): Inside the Case Review boundary; partner IdP is an external interface

## D. Route and user type
- Route: access package (default)
- Reason for an exception (required when synchronization): not applicable
- User type: Guest
- Partner tenant or identity provider and how it was validated: Partner tenant ID recorded in the tenant map; domain ownership confirmed by the partner CIO in writing
- Attributes asserted or provisioned, and why each is needed: display name, work email, partner affiliation; nothing else
- Matching and collision rule: Match on the partner's immutable object identifier; a collision stops the request for review
- Cloud pair, where the partner is in a Government cloud: not applicable

## E. Lifecycle and operations
- Joiner / mover / leaver authority at the partner: Claims Review unit manager, through the partner HR system
- Disablement time limit after a leaver notice (hours): 24
- Emergency suspension: Agency security operations may block at the agency tenant at once; the partner revokes at source
- Access review: quarterly, by the sponsor; no response removes access
- Population reconciliation: monthly, roster against package assignments
- Incident notification: partner to agency within 24 hours; agency to partner within 24 hours
- Relationship termination plan, including removal of accounts left behind: remove package assignments, then confirm no guest accounts remain
- Logs kept, where, and for how long: Per Book 04 chapter 09 retention table

## F. Readiness checks (one decider: the agency business owner)
| # | Check | Evidence reference | Date | Decided by |
|---|---|---|---|---|
| 1 | Class and authoritative source approved | Record section A | 2026-11-03 | Director, Benefits Programs |
| 11 | Production enablement approved. Authorizing official consulted on (date): | AO consult note | 2026-11-05 | Director, Benefits Programs |
````

The example shows rows 1 and 11 only; a real record fills all eleven.

This appendix cites no outside source of its own. The sources behind each field are in [Chapter 15](15-external-partner-identity.md) and its [verification note](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/b03-hr-identity/_verification/15-external-partner-identity.md).
