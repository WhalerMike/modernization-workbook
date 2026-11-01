---
title: "Contractors as Oracle Contingent Workers: Choosing the Contractor Source of Truth"
subtitle: "A product deep dive: what Oracle Fusion Cloud HCM's contingent worker can hold, what Federal HR 2.0 covers, how agencies source contractors today, five options compared, the PIV path, and a phased recommendation"
description: "Research under review: whether contractors could be recorded as Oracle Fusion Cloud HCM contingent workers so one HR feed drives employees and contractors into Entra ID. It sets out what Oracle and Microsoft document about contingent workers, what the Federal HR 2.0 memo, solicitation and award say about scope, licensing and privacy, how agencies' published privacy assessments and inspector general reports show contractors being sourced and deprovisioned, five options compared attribute by attribute against AC-2, PS-7, FIPS 201-3 and M-19-17, the contractor PIV path from sponsorship to revocation, and a phased, agency-neutral recommendation with decisions and owners."
research-status: in review
research-type: evaluation
research-book: "Book 03"
date-modified: 2026-10-29
last-reviewed: 2026-10-29
aliases:
  - /docs/research/oracle-contingent-worker-contractor-source.html
---

# Contractors as Oracle Contingent Workers: Choosing the Contractor Source of Truth {.unnumbered}

[Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md) makes HR the source of authority for the person. Federal HR 2.0 moves federal employees onto one Core HCM platform, Oracle Fusion Cloud HCM, and leaves contractors out. [Chapter 06](../books/b03-hr-identity/06-canonical-attribute-schema.md#contractors-and-vendors-the-population-hrit-doesnt-cover) therefore treats the contractor source as an open decision for the agency, and names the Core HCM *contingent worker* as one option. This page tests that option: could contractors be recorded as contingent workers, so that one HR feed drives employees and contractors into Entra ID, and should they be?

::: {.callout-note}
## Sources, labels and agency names
Every product, program and policy fact was checked against primary sources on October 29, 2026, and is footnoted. Statements marked *(design guidance)* are the program's recommendations; statements marked *(inference)* are conclusions the sources support but don't state. This page names agencies **only as cited public sources** for their documented practice (privacy impact assessments, system-of-records notices and inspector general reports); the recommendation is agency-neutral, and nothing here is endorsed by any agency. It names Oracle, Microsoft and SailPoint because the workbook's principal examples do; that isn't an endorsement either.
:::

## What it covers

| Part | Content |
|---|---|
| 1. The Oracle contingent worker | Person and worker types, work relationships and assignments, how contingent workers are created, what data they carry, how they appear in feeds and extracts, conversion, and how Microsoft's Oracle HCM provisioning treats them |
| 2. Federal fit | What Federal HR 2.0 covers, whether an agency can add contractors, licensing, and the Privacy Act |
| 3. How agencies source contractors today | Six patterns, each with documented examples, and what the oversight reports found |
| 4. The options compared | Five options, attribute by attribute: source, path to Entra ID, mover and leaver, risks and federal requirements |
| 5. The contractor PIV path | What starts sponsorship, the card system's signal back into the pipeline, and the end date as the notice that starts the 18-hour clock |
| 6. Recommendation | A phased path, the source swap, the attribute mapping, and the decisions with owners |
| Close | Questions to ask, what couldn't be verified, status, and source notes |

## What the research found

- **Oracle can hold contractors as a full worker type.** The contingent worker is "a nonemployee, for example, contract worker or temporary worker," one of Oracle's fixed worker types alongside employee, nonworker and pending worker.[^cw-ora-wr] It uses the same assignment resource as an employee: department, job, position, location, managers and business unit.[^cw-ora-rest-asg] The same Atom feeds fire for it.[^cw-ora-feeds]
- **But Oracle's end date ends nothing.** A contingent worker's projected end date is "for information purposes only and have no effect on application processing."[^cw-ora-asg] The worker leaves only through an explicit termination.[^cw-ora-hdl-term] An expired contract that nobody terminates stays active in HR, so the pipeline, not Oracle, has to enforce the end date *(inference)*.
- **Oracle documents supplier fields but no contract number.** HCM Data Loader's contingent-worker rows carry `VendorId` and `VendorSiteId`.[^cw-ora-hdl] No Fusion Cloud page found documents a purchase order or contract number on the assignment, or creating contingent workers from a Procurement purchase order. The detailed purchase-order linkage that appears in search results is Oracle E-Business Suite, a different product.[^cw-ora-ebs]
- **Federal HR 2.0 covers civilian employees only.** The solicitation makes the platform the "system of record for approximately 2 million Executive Branch civilian employees."[^cw-pws-scope] The words "contingent", "non-employee" and "volunteer" don't appear in the memo, the final amendment or either question-and-answer set (full-text search).[^cw-memo][^cw-pws-scope][^cw-qa1] OPM's award release keeps the same scope.[^cw-opm-award]
- **Licensing is an open question, not a detail.** The contract is priced per employee per year, "for 2 million employee licenses."[^cw-pws-clin][^cw-qa1] Oracle's public "Hosted Employee" metric counts "all of Your agents, contractors, and consultants" who use or "are tracked by the programs."[^cw-ora-sd] Whether the awarded contract's terms override Oracle's commercial definition can't be checked; the contract isn't public.
- **An agency can't stand up its own Core HCM to hold them.** The memo pauses agency Core HCM procurement and development, with exceptions only from the OMB and OPM Directors.[^cw-memo] Agency configuration of the shared platform is in scope, and "Platform extensions are considered configurations,"[^cw-pws-config] so contractors in the shared instance would be a configuration decision for the program, not the agency alone *(inference)*.
- **Agencies already run a separate contractor source, and the failures are at the end date.** Published privacy assessments show a contractor management system as the authority,[^cw-doi-access][^cw-gsa-gcims] the card system's status driving deprovisioning,[^cw-dhs-idms] and an HR module for contractors.[^cw-tigta] The oversight reports show the same weakness in every pattern: contractors who left stayed active, kept cards or kept access.[^cw-tigta][^cw-dot-oig][^cw-dhs-oig-23][^cw-doe-oig][^cw-dhs-oig-26]
- **Federal guidance names HR as the source but says nothing on contractors outside HR.** FICAM's Identity Lifecycle Management playbook says "The HR/personnel system is the sole driver of identity creation and termination."[^cw-ilm] It doesn't say what drives a contractor whom HR doesn't hold; M-19-17 requires revocation when a contractor separates without naming a source.[^cw-m1917]
- **Microsoft's Oracle guide has a mapping trap.** Its sample payload maps `userType` from Oracle's `WorkerType`.[^cw-ms-tut] In Entra ID `userType` is Member or Guest,[^cw-ms-b2b] and `employeeType` is the worker-type attribute ("Employee, Contractor, Consultant, or Vendor").[^cw-ms-user] Map worker type to `employeeType` and the worker type code, never to `userType` *(inference; design guidance)*.

**The recommendation in one line:** stand up an agency-owned contractor record now, keyed on the enterprise person key and fed by one authority per fact; treat the Oracle contingent worker as a later *source swap* for the person and assignment, taken only if the HR 2.0 program confirms scope, licensing and privacy coverage; and enforce the contract end date in the pipeline whichever source holds the record *(design guidance)*. Part 6 gives the path.

## Part 1: The Oracle contingent worker

### Person types and worker types

Oracle separates two ideas. A **system person type** is fixed: "You can't change, delete, or create additional system person types." Each has a **user person type** the agency configures.[^cw-ora-pt] The **worker type** is the type of a work relationship:

| Worker type | Oracle's definition | Code |
|---|---|---|
| Employee | "A person who typically has a permanent relationship with the organization" | E |
| Contingent worker | "A nonemployee, for example, contract worker or temporary worker" | C |
| Nonworker | A person with a nonwork relationship with a legal employer, for example a volunteer or retiree | N |
| Pending worker | A person who will be hired or start a contingent relationship | P |

: Oracle worker types[^cw-ora-wr][^cw-ora-rest] {.striped .hover}

Oracle's REST resources give `WorkerType` as E, C, P or N,[^cw-ora-rest] and assignments expose both `SystemPersonType` and `UserPersonType`.[^cw-ora-rest-asg] Oracle's feed samples use longer values such as `EMP` and `PWK`,[^cw-ora-ems] so map both forms, as the [HCM implementation guide](../books/guides/hcm-entra-implementation.md#lifecycle-signals) already says. Oracle also warns that a person security profile mustn't mix the employee, contingent worker, nonworker and pending worker person types,[^cw-ora-pt] which matters if HR administrators for contractors are to be scoped separately *(inference)*.

### Work relationships and assignments

- **One person, several relationships.** "Because a person can have multiple work relationships of multiple types simultaneously, a person can have multiple worker types at once."[^cw-ora-wt] A contractor who is also an employee elsewhere in the agency is one person with two relationships.
- **One primary.** "A person can have only one primary work relationship"; where one worker type is needed, the primary relationship's applies.[^cw-ora-wr][^cw-ora-wt] The identity pipeline has to choose which relationship drives the account *(inference)*: the primary one, per Oracle.
- **Assignment numbers carry the type.** Oracle prefixes the person number with E, C, N or P to form assignment numbers.[^cw-ora-asg]
- **The same assignment resource.** Contingent workers use the worker assignment resource employees use, with department, job, position, location, managers and business unit, plus `ProjectedStartDate` and `ProjectedEndDate`.[^cw-ora-rest-asg][^cw-ora-create] Oracle's Redwood *Add a Contingent Worker* flow carries "All the attributes in the Hire an Employee flow."[^cw-ora-24a]

### How contingent workers are created

| Path | What Oracle documents |
|---|---|
| HR user, Redwood | *Add a Contingent Worker* from the Quick Actions on My Client Groups and My Team[^cw-ora-24a] |
| REST | `POST` a worker with `"WorkerType": "C"`[^cw-ora-create] |
| HCM Data Loader | A `WorkRelationship` with worker type C and action code `ADD_CWK_WORK_RELATION`; work terms and assignment rows with `VendorId`, `VendorSiteId`, `ProjectedStartDate` and `ProjectedEndDate`[^cw-ora-hdl] |
| Renewal and conversion | *Renew Contingent Worker* and *Add Contingent Work Relationship* are named actions;[^cw-ora-convert] the 26B *Change Worker Type* process converts contingent worker to employee and back without terminating one relationship and creating another[^cw-ora-cwt] |
| Procurement or supplier integration | No Fusion Cloud page found. The purchase-order-to-assignment linkage found is documented for Oracle E-Business Suite Services Procurement[^cw-ora-ebs] |

: How a contingent worker is created in Fusion Cloud HCM {.striped .hover}

So a contingent worker exists in Fusion only because an HR user, an integration or a data load creates it. Nothing found makes Oracle Procurement the creator.

### What a contingent worker record carries

| Data identity needs | In the contingent worker record? | Source note |
|---|---|---|
| Person key | Yes: the person number, shared numbering with employees | [^cw-ora-asg] |
| Manager | Yes: the assignment's managers | [^cw-ora-rest-asg] |
| Organization | Yes: department and business unit | [^cw-ora-rest-asg] |
| Job, position, location | Yes | [^cw-ora-rest-asg] |
| Supplier | Yes: `VendorId` and `VendorSiteId` in the data loader | [^cw-ora-hdl] |
| Purchase order or contract number | No documented Fusion field found | [^cw-ora-ebs] |
| Start date | Yes: the work relationship and assignment start; `ProjectedStartDate` | [^cw-ora-create] |
| Projected end date | Yes, informational only: `ProjectedEndDate` on the assignment, `ProjectedTerminationDate` on the relationship | [^cw-ora-rest][^cw-ora-asg] |
| Actual end date | Only when someone terminates: `ActualTerminationDate`; assignments become inactive and supervisor relationships are end-dated | [^cw-ora-hdl-term] |
| Suitability, clearance, PIV status | No | none of the Oracle pages found |

: The contingent worker record against what identity needs {.striped .hover}

Oracle's documentation doesn't say which modules are employee-only. Payment methods, at least, were extended to contingent workers in 25A,[^cw-ora-25a] so don't assume a contingent worker is a thin record *(inference)*.

### Feeds and extracts

- **Atom feeds include contingent workers.** "Feeds are triggered only for employee, contingent worker, and pending worker types."[^cw-ora-feeds] Oracle's entitlement guide says the feeds "track data changes that pertain to employees, contingent workers, and pending workers."[^cw-ora-ems]
- **The termination entry carries the type.** Its context includes `PeriodType` and `WorkerType`, with `ActualTerminationDate` as a conditional attribute, and the termination appears "on the effective date, not necessarily the date that the termination is entered."[^cw-ora-ems] The published-date polling the HCM guide recommends applies to contingent workers too.
- **The assignment feed needs one setting.** The `empassignment` feed must include the period-of-service ID for source objects including `CWKAssignmentDEO`.[^cw-ora-ems]
- **Extracts.** The work-relationship attribute `PERIOD_TYPE` distinguishes E, C and N.[^cw-ora-pos] No Oracle example found filters an extract on contingent workers; build and test the filter in the sandbox.

### Conversion

The 26B *Change Worker Type* process supports contingent worker to employee, employee to contingent worker, and nonworker to either; Oracle says it "eliminates the need to terminate an existing work relationship and create a new one." It can't be combined with a change of legal employer, and cancelling the new relationship reactivates the original.[^cw-ora-cwt] Neither page states that the person number is kept. Oracle's integration example for a pending-worker conversion shows the same person number before and after,[^cw-ora-ems] and the process works within one person record,[^cw-ora-cwt] so a kept person number is the likely behavior *(inference: confirm in the sandbox)*. It matters because Book 03 treats conversion as [an attribute change on the same person](../books/b03-hr-identity/08-joiner-mover-leaver.md).

### Microsoft's side

- **The Oracle tutorial doesn't mention contingent workers.** It recommends scoping filters only to skip records that are no longer relevant. Its mover scenario does include a worker "converted from full-time to contractor or vice-versa."[^cw-ms-tut]
- **The `userType` trap.** The tutorial's sample SCIM payload sets `userType` from `workers.workRelationships.WorkerType`.[^cw-ms-tut] In Entra ID, Member "indicates an employee of the host organization and a user in the organization's payroll," and Microsoft recommends moving internal non-employee accounts to B2B guests.[^cw-ms-b2b] An agency whose contractors hold agency accounts and PIV cards will usually keep them as members, and that is a decision to make on purpose, not a side effect of a sample mapping *(inference; design guidance)*.
- **One app per population is an option, not a rule.** Microsoft says an agency can create "three separate provisioning apps – one for each identity type with its own distinct attribute mapping,"[^cw-ms-faq] and describes a separate app that sets only the manager of contractors who report to employees.[^cw-ms-plan][^cw-ms-config]
- **Lifecycle Workflows can scope by worker type.** Workflow scope rules support `employeeType` with `eq`, `ne` and `in`,[^cw-ms-lcw-rule] and the leaver templates trigger on `employeeLeaveDateTime`.[^cw-ms-lcw-tmpl] So contractors can get their own leaver workflow from the same attribute, whatever source sets it.

## Part 2: Federal fit

### What Federal HR 2.0 covers

| Source | What it says about the population |
|---|---|
| OMB and OPM memo, December 10, 2025 | Military personnel and Intelligence Community agencies are excluded at first; the functions are employee functions ("employee system of record," "employee and manager self-service"); the words "contractor," "contingent" and "non-employee" don't appear[^cw-memo] |
| Solicitation, Amendment 4, PWS §2 | "system of record for approximately 2 million Executive Branch civilian employees"; Postal Service and Intelligence Community employees excluded[^cw-pws-scope] |
| Questions and answers | "2 million employee licenses"; user roles are "employees, managers, administrators, and HR professionals"[^cw-qa1] |
| OPM award release | "approximately two million US Executive Branch civilian employees"; a phased rollout[^cw-opm-award] |

: Federal HR 2.0's stated population {.striped .hover}

The only adjacent term is an undefined "affiliate type," a targeting attribute in two functional requirements.[^cw-pws-affiliate] Nothing ties it to contractors. The memo's timeline has Wave 1 agencies beginning in FY2026 and Wave 2 in FY2027, with government-wide adoption the goal by FY2028;[^cw-memo] the solicitation states the intent for every agency to go live by July 4, 2027.[^cw-pws-config]

**So:** the program doesn't cover contingent workers in its scope, and nothing public says it excludes them by rule. It simply doesn't address them.

### Can an agency add contractors?

- **Not in a Core HCM of its own.** Agencies "are expected to pause their own Core HCM procurement, development, and related modernization projects," with exceptions only from the OMB Director and the OPM Director.[^cw-memo]
- **Possibly, as configuration of the shared platform.** Agency-specific configuration is in scope, extensions are configuration, and the government wants "a common federal baseline configuration."[^cw-pws-config] Recording contractors would be a change to that baseline, so it needs the program's agreement *(inference)*. The memo's only agency step is to "Start identifying agency-unique requirements."[^cw-memo]
- **Integrations are approved centrally.** The [HCM implementation guide](../books/guides/hcm-entra-implementation.md#what-the-solicitation-says-about-identity) records that the Core HCM Steering Committee approves agency-specific integrations. A contractor flow into or out of Core HCM would be one.

### Licensing

The contract's licensing line is "Licensing and Sustainment for 2 million employees," priced per employee per year, and the PWS requires "licenses for all users" on an all-inclusive model.[^cw-pws-clin] Oracle's public Fusion service descriptions define the *Hosted Employee* metric, which HCM Base uses, to include employees and "all of Your agents, contractors, and consultants where such agents, contractors, and consultants have access to, use of, or are tracked by the programs," counted by headcount, "not the actual number of users."[^cw-ora-sd] There's no separate contingent-worker metric.[^cw-ora-sd]

What follows *(inference)*: under Oracle's commercial definition, a contractor recorded as a contingent worker is a licensed headcount. Whether the OPM contract counts only employees, or counts every hosted record, decides whether adding contractors costs anything and who pays. That's a question for OPM, not a detail.

### Privacy Act

- **OPM/GOVT-1 allows contractor records but doesn't require them.** Its categories of individuals, unchanged since 2012, include the note "Volunteers, grantees, and contract employees on whom the agency maintains records may also be covered by this system."[^cw-govt1] The 2023 notice changed routine uses, not categories.[^cw-govt1-2023] Whether an agency's contractor records sit under GOVT-1 or its own notice is the agency's call *(inference)*: [Appendix B](../books/b03-hr-identity/appendix-b-security-and-privacy.md) puts that decision with the privacy office.
- **The PIV system's notice does cover contractors.** GSA/GOVT-7 covers "all participating agency employees, contractors and their employees, consultants, and volunteers" who need routine, long-term access.[^cw-govt7]
- **No Core HCM notice or PIA was found.** Federal Register searches found no Federal HR 2.0 or Core HCM system-of-records notice, and OPM's privacy page lists no Core HCM PIA; the solicitation requires a PIA as a deliverable.[^cw-pws-pia]
- **What changes if contractors move into the shared instance** *(inference)*: their records would sit in a system OPM operates, so the agency has to confirm that the governing notice's categories and routine uses cover contractor records there, and that the platform's PIA covers them. A Circular A-108 significant change applies when a change substantially increases access to a system's records;[^cw-a108] adding a population to a system can be one. The privacy office decides.

## Part 3: How agencies source contractors today

Agencies' published privacy assessments describe the patterns precisely. Each row is an example a public source documents, not a survey.

| Pattern | Documented example | What it is authoritative for | How the end works |
|---|---|---|---|
| **Contractor management system or sponsor registry** | Department of the Interior, DOIAccess: "considered the authoritative data source for DOI contractor personnel" who need a card for network or physical access; HR or COR sponsors enter records; COR data comes from the financial system[^cw-doi-access] | Contractor existence, sponsor, card eligibility | A separation report drives role removal; an invalid-sponsor report flags records with no valid sponsor[^cw-doi-access] |
| | General Services Administration, GCIMS: "An authoritative source of identities for Active Directory, Google mail, and other GSA systems"; holds contract number and "Contract start and end date"[^cw-gsa-gcims] | Credentialing and contract data | The HR feed covers departing employees only; points of contact reverify personnel records twice a year[^cw-gsa-gcims] |
| | NASA, IdMAX: identities for civil servants and supporting individuals, with affiliation "such as civil servant or contractor"; "Human Capital Systems are the authoritative sources for civil servants identity data"[^cw-nasa-idmax] | Contractors by implication (the PIA doesn't say so outright) | Records retained after the contract relationship expires[^cw-nasa-idmax] |
| **PIV card management system as the de facto authority** | Department of Homeland Security, PIV/IDMS: provisioning and de-provisioning "based on changes in DHS PIV Card status (active, revoked, or suspended)"[^cw-dhs-idms] | Card status as the access signal | Revocation or suspension de-provisions directory and physical access[^cw-dhs-idms] |
| | GSA USAccess, a shared PIV service: "Initial information regarding a PIV applicant is provided through an agency sponsor"; the record lasts for a contractor's assignment[^cw-usaccess] | The identity record behind the card | The sponsor ends the assignment |
| **Acquisition or contract data** | No agency found that uses FPDS or SAM.gov directly as an identity authority. The closest: DOIAccess takes COR data from the financial system,[^cw-doi-access] and GCIMS stores contract dates[^cw-gsa-gcims] | Contract existence and period of performance | Contract-level dates, never per person (below) |
| **HR module for contractors** | Treasury's HR system at the IRS: a Contractor Management and a "Contingent Worker Module, which contains all individual contractor employee data"; "The contractor employee separation process is initiated by the COR"[^cw-tigta] | Contractor records in HR | Depends on the COR starting the separation |
| **Identity governance tool** | Department of Energy, MyIdentity (Saviynt): aggregates from authoritative sources and "is not the authoritative source for the privacy data"[^cw-doe-saviynt] | Aggregation, not authority | From its sources |
| | SailPoint Non-Employee Risk Management (product): "an authoritative source of your non-employee identity data"; assignments are time-bound and carry a sponsor[^cw-nerm] | Non-employee profiles and assignments | Time-bound assignments; no federal deployment found in an agency source |
| **Manual sponsor process** | Environmental Protection Agency, ePACS: "A Human Resource Representative, Contracting Officer's Representative (COR), a Grant Officer, or a Project Officer initiates a request" for a badge[^cw-epa-epacs] | The request | The requester ends it |

: Contractor identity sources documented in public agency sources {.striped .hover}

### What the oversight reports found

| Report | Finding |
|---|---|
| TIGTA 2024-100-063, September 18, 2024 | 1,821 (10 percent) of contractors listed active in the HR system "should have been listed as separated because they were no longer assigned to an ongoing contract"; some still had network access[^cw-tigta] |
| DOT OIG ZA2023030, May 24, 2023 | DOT "does not always promptly collect and deactivate contractor employee PIV cards as required"; the cause was unclear accountability[^cw-dot-oig] |
| DHS OIG-23-04, January 9, 2023 | DHS did not always terminate PIV card access or withdraw clearances "for separated employees and contractors"[^cw-dhs-oig-23] |
| DOE-OIG-21-12, January 19, 2021 | "39 percent of separated employees' PIV cards or employment statuses had not been updated" in the shared PIV system, across federal and contractor separations[^cw-doe-oig] |
| DHS OIG-26-28, September 4, 2026 | "15 percent of identified contractor accounts were not disabled in a timely manner after separation"[^cw-dhs-oig-26] |

: Oversight findings on contractor deprovisioning {.striped .hover}

The lesson for this decision *(inference)*: the HR-module pattern failed in the same way as the others. Putting contractors in HR didn't fix the leaver, because the separation still waited for a person to start it. The control the TIGTA report points to is a comparison against an ongoing contract. Whatever source holds the record, the end has to be driven by a date and a reconciliation, not by someone remembering.

### What federal requirements say

| Requirement | What it requires | Bearing on the contractor source |
|---|---|---|
| NIST SP 800-53 Rev. 5, AC-2 | Notify account managers within a set time "when users are terminated or transferred"; "Align account management processes with personnel termination and transfer processes"[^cw-sp80053] | For contractors, the contractor source feeds the "personnel termination and transfer processes"; it needs a dated termination event |
| NIST SP 800-53 Rev. 5, PS-7 | Require external providers to notify the agency of transfers or terminations of external personnel who hold credentials, badges or privileges, within a set time[^cw-sp80053] | The provider's notice is one leaver input; it can't be the only one |
| FIPS 201-3 | A credential is issued "only after a proper authority has authorized issuance"; termination when "A contractor changes positions and no longer needs access"; an uncollected card's termination "within 18 hours of notification"[^cw-fips201] | Sponsorship needs an authority; the 18-hour clock starts at notification |
| NIST SP 800-79-2 | Only the organization decides which employees and contractors need a PIV card, and sponsorship and adjudication "cannot be outsourced"[^cw-sp80079] | The sponsor is a federal role, whatever system records it |
| FAR 4.1301 and 52.204-9 | Agencies "must designate an official responsible for verifying contractor employee personal identity"; contractors return the card "Upon contract completion or termination"[^cw-far41301][^cw-far52049] | Contract completion is a defined card-return event |
| OMB M-19-17 | Revoke access "when the employee or contractor separates"; establish "authoritative solutions" for ICAM services; manage "the lifecycle of identities"[^cw-m1917] | Requires the outcome; names no contractor source |
| FICAM ILM playbook v1.4 | "The HR/personnel system is the sole driver of identity creation and termination"[^cw-ilm] | Silent on contractors outside HR, the gap this page addresses |
| FICAM Architecture v3.3 | Identity management includes creation with an authoritative source, and deactivation; credential management includes sponsorship[^cw-arch] | Authoritative source and sponsorship are distinct services |

: Federal requirements that bear on the contractor source {.striped .hover}

### Contract data as an authority

FPDS defines three dates: the period-of-performance start; the **current completion date**, "The completion date of the base contract plus options that have been exercised"; and the **ultimate completion date**, including all options "whether the options have been exercised or not."[^cw-fpds] USAspending carries the same two end dates, and notes that "The completion date does not change to reflect a closeout date."[^cw-usasp] Both are contract or order dates, never a person's: a contractor can leave a contract long before it ends. So contract data is the **ceiling** on a contractor's end date, not the end date itself *(inference; design guidance)*.

## Part 4: The options compared

### Source of truth for each attribute

| Attribute | A. Oracle contingent worker | B. Agency contractor system of record | C. Card management system | D. Acquisition data plus sponsor | E. Governance tool (NERM-style) |
|---|---|---|---|---|---|
| Person key | Oracle person number, mapped to the enterprise person key | Enterprise person key, issued by the system | Card record; FASC-N and card UUID change on reissue, so not a person key[^cw-fips201] | None; needs a person record elsewhere | Tool profile ID, mapped to the enterprise person key |
| Sponsor / manager | Assignment manager | Sponsor field, a live reference into HR | Sponsor of the card request | The COR on the contract; person-level sponsor by attestation | Assignment sponsor[^cw-nerm] |
| Organization code | Assignment department | Derived from the sponsor | Not held in identity-ready form *(inference)* | Contracting office, not the work unit | Organization profile |
| Worker type | Worker type C | Set by the system (`CTR`) | Affiliation on the card record[^cw-govt7-2006] | Implied | Profile type |
| Start | Relationship start date | Engagement start | Card issuance | Period-of-performance start[^cw-fpds] | Assignment start |
| End | Projected end, informational only; actual end only on termination[^cw-ora-asg] | Engagement end, capped by the contract's current completion date | Card expiry or revocation | Current completion date, contract-level[^cw-fpds] | Time-bound assignment end |
| Suitability / clearance | Not held | From the personnel security system | Adjudication before issuance[^cw-fips201] | Not held | Can hold, if configured |

: Where each attribute comes from, by option {.striped .hover}

### Path to Entra ID, mover and leaver, risks

| | A. Oracle contingent worker | B. Agency contractor system of record | C. Card management system | D. Acquisition data plus sponsor | E. Governance tool |
|---|---|---|---|---|---|
| Path to Entra ID | The same HCM feeds and middleware as employees; `/bulkUpload` on the employee app or a contractor app[^cw-ms-faq] | Its own API-driven provisioning app through the same middleware[^cw-ms-faq] | Indirect: card status as a signal; not built to originate accounts | Not on its own; enriches B or E | The tool's own Entra connector, or the middleware |
| Mover | Assignment change feeds[^cw-ora-feeds] | Sponsor or contract change | Reissue on a status change[^cw-fips201] | Contract modification | Assignment change |
| Leaver | Termination feed, **only if HR terminates**; the projected date doesn't act | Earliest-end rule enforced by the system or the middleware | Revocation, often after the fact | Contract end, too late for most departures | Assignment end |
| Main risks | Out of HR 2.0's stated scope; licensing; SORN and PIA coverage; no contract field; end date not enforced; depends on the program's baseline | Another system to own and fund; must reach HR for sponsors | Covers only badged people; card state ≠ engagement state | Contract-level dates; no person | A third source; NERM agency use not documented |
| Fit with AC-2, PS-7, FIPS 201-3, M-19-17 | AC-2 if terminations are timely; PS-7 notices still land elsewhere | All, if the earliest-end rule and the sponsor recertification are built | FIPS 201-3 by design; AC-2 only through the pipeline | Supports AC-2 as a ceiling | All, if configured; sponsorship stays federal[^cw-sp80079] |

: How each option behaves {.striped .hover}

No option is complete, which is [Chapter 06's](../books/b03-hr-identity/06-canonical-attribute-schema.md#one-fact-one-authority) rule: one authority per fact, the whole record on an accountable federal sponsor. The comparison only decides which system holds the **person and the engagement**: A or B (or E standing in for B). C and D stay authorities for their own facts under any choice.

## Part 5: The contractor PIV path

For employees, Book 03 connects the PIV card end to end: the HR joiner starts sponsorship and proofing, the card management system issues the card and supplies the certificate binding, and the leaver sequence revokes it ([Chapter 09](../books/b03-hr-identity/09-credentials-and-certificates.md)). For contractors, three links have been missing. Each is design guidance, grounded in the requirements above.

1. **What starts sponsorship.** With no HR joiner, the contractor source's joiner (a record with a sponsor, a contract reference and a start date) is what sends the sponsorship request to the PIV office. Agencies document this hand-off as a person in a sponsoring role, a COR or project officer, starting the card request,[^cw-epa-epacs][^cw-usaccess] and FIPS 201-3 requires that "a proper authority has authorized issuance."[^cw-fips201] Make the request an output of the contractor joiner, so no card exists for someone the contractor source doesn't hold. Until the card arrives, the contractor signs in with an interim phishing-resistant method ([Book 04, Chapter 03](../books/b04-access/03-the-conditional-access-model.md#authentication-strengths)).
2. **The card system's signal back into the pipeline.** Card status already drives deprovisioning in at least one documented system.[^cw-dhs-idms] In this design the card management system publishes termination, revocation, suspension and expiry events to the middleware, keyed on the enterprise person key. For a contractor, a termination or expiry is one of the earliest-end conditions and ends the engagement; a suspension or reissue doesn't, and only rewrites the certificate binding. For an employee, the same events are credential drift, never a leaver, because HR owns employment ([Chapter 11](../books/b03-hr-identity/11-drift-metrics-and-evidence.md)). The oversight reports show the cost of leaving this to reconciliation alone.[^cw-doe-oig][^cw-dot-oig]
3. **The contract end date as the notice.** If a card can't be collected, FIPS 201-3 requires termination procedures to be completed "within 18 hours of notification."[^cw-fips201] FAR 52.204-9 makes contract completion a card-return event,[^cw-far52049] and PS-7 asks the provider to notify terminations.[^cw-sp80053] So the contractor source's earliest-end date, capped by the contract's current completion date, generates the notification to the PIV office on that date, instead of waiting for a person to send it. The 18 hours then start on the date the engagement ends, and the evidence shows when.

Book 03 [Chapter 09](../books/b03-hr-identity/09-credentials-and-certificates.md#the-contractor-piv-path), Book 07 [Chapter 04](../books/b07-pki/04-the-target-pki.md#the-contractor-piv-path), Book 04 [Chapter 03](../books/b04-access/03-the-conditional-access-model.md#authentication-strengths) and the [companion guide](../books/guides/attribute-driven-migration.md#pki-binding) carry the path into the books.

## Part 6: Recommendation

### Which option

**Option B, an agency-owned contractor system of record**, holds the person and the engagement now, with C and D as authorities for credential status and the contract ceiling, and with **Option A as a later source swap** for the person and assignment. Option E is a way to build B, not a separate answer *(design guidance)*.

Why not A now:
- It's outside Federal HR 2.0's stated scope, and its licensing and privacy coverage are unconfirmed (Part 2).
- It doesn't hold the two facts the leaver depends on: a contract reference and an enforced end date (Part 1).
- It couldn't be in production before the agency's wave anyway, and contractor orphans exist today.

Why A may still be right later: one person record and one set of feeds for both populations, conversion as an attribute change on the same person, and managers, departments and positions in the same tables as employees'. If the program confirms scope, licensing and coverage, the swap is cheap, because Option B was built against the same canonical model.

### The phased path

| Phase | When | What |
|---|---|---|
| **0. Measure** | Now | Read only: reconcile the existing contractor records, the card management system and the contractor accounts in AD and Entra ID on the enterprise person key; report orphans and expired engagements ([Chapter 06 sequence](../books/b03-hr-identity/06-canonical-attribute-schema.md#sequence-start-with-what-already-exists)) |
| **1. Stand up B** | Before the agency's HR 2.0 wave | Name the contractor system of record (an existing register, the card system's sponsor records lifted into a governed store, or a governance tool's non-employee module). Key it on the enterprise person key. Add a contract reference, the sponsor as a reference into HR, and the engagement end date. Its own API-driven provisioning app through the same middleware.[^cw-ms-faq] **Ship the leaver first**: the earliest-end rule and the card-system signal (Part 5), then the joiner and the sponsorship request |
| **2. Ask the program** | During the wave's pre-onboarding | The questions below: scope, licensing, the "affiliate type," SORN and PIA coverage, and whether a contractor integration would be approved |
| **3. Decide the swap** | At the agency's Core HCM go-live | If the answers allow it, configure the contingent worker, load contractors as worker type C, and point the middleware's contractor mapping at the Oracle feeds. If not, B stays the source |
| **4. Swap** | After go-live, by population | Run Oracle in shadow beside B, compare record by record on the enterprise person key, then cut over. B keeps the contract reference and the earliest-end enforcement unless Oracle can carry them |

: The phased path for the contractor source {.striped .hover}

### Making it a source swap

The swap works only if three things hold from Phase 1 *(design guidance)*:
1. **The enterprise person key, not the source's key, is the identity.** `employeeId` carries the enterprise key; the Oracle person number and B's record ID are source keys mapped to it ([Chapter 04](../books/b03-hr-identity/04-attribute-authority.md#one-person-layered-identifiers)). A contractor who becomes a contingent worker keeps their key, account and access.
2. **One middleware, one canonical record.** The contractor app and the employee app read the same canonical model; swapping the source changes one input mapping, not the directory schema ([Chapter 05](../books/b03-hr-identity/05-the-provisioning-pipeline.md)).
3. **The end date is enforced downstream of the source.** The middleware computes the earliest end and sends `active` false and `employeeLeaveDateTime` itself, so moving to a source whose end date is informational doesn't weaken the leaver.

### Mapping into the canonical schema

| Canonical field ([Chapter 06](../books/b03-hr-identity/06-canonical-attribute-schema.md#the-schema)) | From B (Phase 1) | From Oracle (after the swap) | Entra ID / AD |
|---|---|---|---|
| Person number | Enterprise person key | Person number, mapped to the enterprise key | `employeeId` / `employeeID` |
| Employment active | Earliest-end rule | Assignment status, *and* the earliest-end rule | `accountEnabled` / `accountDisabled` |
| Worker type | `Contractor` | Worker type C → `Contractor`; never to `userType` | `employeeType` |
| **Worker type code** | `CTR` | C → `CTR`; N → the agency's nonworker code; P out of scope | `extensionAttribute11` |
| Manager | Sponsor's enterprise key | Assignment manager's person number (the sponsor) | `manager` |
| **Organization code** | Derived from the sponsor | Assignment department, defaulting to the sponsor's | `extensionAttribute10` |
| **Position category** | Contractor labor category or `CTR-GEN` from the agency's code list | Job family, if HR maintains it for contingent workers | `extensionAttribute12` |
| Legal employer | The agency | The legal employer | `companyName` / `company` |
| Hire date | Engagement start | Relationship start date | `employeeHireDate` / `extensionAttribute2` |
| Leave date | Earliest end | `ActualTerminationDate`, or the earliest end if sooner | `employeeLeaveDateTime` / `extensionAttribute3` |
| Contract reference | Contract or order number | Kept in B, or a configured Oracle field if one is confirmed | A slot from the [program attribute map](../books/b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map), or a custom security attribute |

: Contractor attributes in the canonical schema, before and after the swap *(design guidance)* {.striped .hover}

The worker type code `CTR` is the one Book 03 already reads: Book 04's Internals persona is `extensionAttribute11` in {`EMP`, `CTR`} ([Book 04, Chapter 03](../books/b04-access/03-the-conditional-access-model.md#personas)). Lifecycle Workflows can scope a contractor leaver on `employeeType` eq `Contractor`.[^cw-ms-lcw-rule]

### Decisions and owners

| Decision | Decides | Consulted | When |
|---|---|---|---|
| The contractor system of record (Option B's system) | ICAM governance body | Contracting, personnel security, PIV office, HR, privacy | Phase 1 |
| The earliest-end rule and the sponsor grace and recertification periods | Security | Contracting (COR), HR | Phase 1 |
| The card-system event interface (what's published, how fast) | PIV office | Identity engineering, security | Phase 1 |
| Member or guest for contractors | ICAM governance body | Security, application owners | Phase 1 |
| Privacy basis for contractor records in each system | Privacy office | General counsel, HR | Phase 1, again at Phase 3 |
| Whether to adopt the Oracle contingent worker | ICAM governance body, with the HR 2.0 program's agreement | HR, CFO (licensing), privacy | Phase 3 |
| Contract reference: which system and field | Contracting | Data architect | Phase 1 |

: Decisions and owners for the contractor source {.striped .hover}

The governance body is the agency's ICAM structure under M-19-17;[^cw-m1917] the roles follow [Chapter 07's responsibility matrix](../books/b03-hr-identity/07-who-owns-workforce-identity.md).

## Questions to ask

1. **HR 2.0 program:** will the shared Core HCM instance record contingent workers for agencies that want them? Is that a baseline change, an agency configuration, or out of scope?
2. **HR 2.0 program:** do contingent workers count against the per-employee licenses, given Oracle's Hosted Employee definition? Who pays?
3. **HR 2.0 program:** what is the "affiliate type" in the functional requirements, and does it include non-employees?
4. **OPM privacy:** would contractor records in Core HCM be covered by OPM/GOVT-1 or an agency notice, and by the platform's PIA?
5. **Oracle:** is there a Fusion Cloud path from Procurement to a contingent worker assignment, and a delivered field for a purchase order or contract number?
6. **Oracle:** does any delivered process or notification act on the projected end date? Is the person number kept through *Change Worker Type*?
7. **Microsoft:** correct the Oracle tutorial's `userType` mapping, or say when it applies.

## What couldn't be verified

- **A Fusion Cloud procurement link.** No Fusion page found for creating contingent workers from purchase orders, or for purchase order fields on the assignment; the large REST assignment pages were only partly scanned for vendor or PO attributes.
- **Renewal behavior and end-date notifications.** *Renew Contingent Worker* is named but its flow isn't described on a page found.
- **The person number through conversion.** Implied, not stated.
- **Employee-only modules.** No Oracle statement found.
- **The OPM contract's license terms.** The awarded contract and task orders aren't public.
- **An NIH directory example.** The PIA couldn't be opened (HTTP 403) and isn't cited.
- **Full texts of two inspector general reports.** DOT ZA2023030 and DHS OIG-23-04 were read from their oversight.gov summaries only; figures from secondary sources aren't used.
- **Agency use of SailPoint NERM.** No agency source found; only the product documentation is cited.
- **Whether the 2025 FAR overhaul changed Part 4.** Checked against the FAR as shown on acquisition.gov on October 29, 2026.

## Status and review

**In review.** Every claim was checked on October 29, 2026, against these sources:
- Oracle's Fusion Cloud HCM documentation and service descriptions
- Microsoft Learn
- the Federal HR 2.0 memo, the solicitation's final amendment, its questions and answers, and OPM's award release
- the Federal Register notices for OPM/GOVT-1 and GSA/GOVT-7
- agency privacy impact assessments and inspector general reports
- NIST, OMB, FAR, FICAM, FPDS and USAspending
- SailPoint's product documentation

To move this page to **Proved**:
- Load contingent workers in an Oracle sandbox and confirm the feeds, the termination entry, the extract filter and the person number through *Change Worker Type*.
- Run Option B's leaver (earliest end and the card-system signal) against test records, and record the evidence here.
- Record the HR 2.0 program's answers to questions 1 to 4.

Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md), the implementation guide [Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID](../books/guides/hcm-entra-implementation.md), the [Attribute-Driven Migration companion guide](../books/guides/attribute-driven-migration.md), and [Integrating ServiceNow and SailPoint](../books/guides/snow-sailpoint-integration-kit.md), which treats contractors as a separate SailPoint source.

[^cw-ora-wr]: Oracle, *Oracle Fusion Cloud HCM: Using Global Human Resources*, "Work Relationships" (worker types employee, contingent worker, nonworker, pending worker and offer, with definitions; one primary work relationship), <https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/work-relationships.html>, accessed October 29, 2026.
[^cw-ora-wt]: Oracle, *Oracle Fusion Cloud HCM: Using Global Human Resources*, "Worker Types" (multiple work relationships of multiple types at once; the primary relationship's worker type applies where one is needed), <https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/worker-types.html>, accessed October 29, 2026.
[^cw-ora-pt]: Oracle, *Oracle Fusion Cloud HCM: Implementing Global Human Resources*, "Person Types" (system person types fixed; user person types configurable; don't use the employee, contingent worker, nonworker or pending worker person types in the same security profile), <https://docs.oracle.com/en/cloud/saas/human-resources/faigh/person-types.html>, accessed October 29, 2026.
[^cw-ora-asg]: Oracle, *Oracle Fusion Cloud HCM: Using Global Human Resources*, "Assignments" (assignment numbers prefixed E, C, N or P; projected end date details "are for information purposes only and have no effect on application processing"), <https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/assignments.html>, accessed October 29, 2026.
[^cw-ora-rest]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Get all workers" (`WorkerType` Employee (E), Contingent Worker (C), Pending Worker (P) or Nonworker (N); assignment `ProjectedEndDate`; work relationship `ProjectedTerminationDate`), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/op-workers-get.html>, accessed October 29, 2026.
[^cw-ora-rest-asg]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Get all worker assignments" (one assignment resource for all worker types: `SystemPersonType`, `UserPersonType`, department, job, position, location, business unit, managers, `ProjectedStartDate`, `ProjectedEndDate`), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/op-workers-workersuniqid-child-workrelationships-periodofserviceid-child-assignments-get.html>, accessed October 29, 2026.
[^cw-ora-create]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Create a Contingent Worker" (request with `"WorkerType": "C"`; response with projected start and end dates), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Create_a_Contingent_Worker.html>, accessed October 29, 2026.
[^cw-ora-24a]: Oracle, *Oracle Fusion Cloud Human Resources 24A What's New*, "Redwood Experience for New Person Pages" (Add a Contingent Worker from Quick Actions; "All the attributes in the Hire an Employee flow are also available in the Add a Contingent Worker flow"), <https://docs.oracle.com/en/cloud/saas/readiness/hcm/24a/hure-24a/24A-hr-wn-f30369.htm>, accessed October 29, 2026.
[^cw-ora-hdl]: Oracle, *Oracle Fusion Cloud HCM: HCM Data Loading Business Objects*, "Example of Loading a Tax Reporting Unit for a Worker" (contingent worker example: worker type C, action code `ADD_CWK_WORK_RELATION`; work terms and assignment attributes `VendorId`, `VendorSiteId`, `ProjectedStartDate`, `ProjectedEndDate`, `ProposedWorkerType`), <https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/example-of-loading-a-tax-reporting-unit-for-a-worker.html>, accessed October 29, 2026.
[^cw-ora-hdl-term]: Oracle, *Oracle Fusion Cloud HCM: HCM Data Loading Business Objects*, "Examples of Loading Work Relationship Changes" (termination with `TerminateWorkRelationshipFlag` and `ActualTerminationDate`; assignments inactive after the termination date; supervisor relationship end-dated), <https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/examples-of-loading-work-relationship-changes.html>, accessed October 29, 2026.
[^cw-ora-convert]: Oracle, *Oracle Fusion Cloud HCM: Using Global Human Resources*, "How You Convert Pending Workers" (Renew Contingent Worker, Add Contingent Work Relationship and Add Contingent Worker actions; a new person type usage ID on conversion), <https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/how-you-convert-pending-workers.html>, accessed October 29, 2026.
[^cw-ora-cwt]: Oracle, *Oracle Fusion Cloud Human Resources 26B What's New*, "New Redwood Process to Change Worker Type" (contingent worker, employee and nonworker conversions; no terminate-and-recreate; no legal employer change in the same process; cancelling reactivates the original relationship), <https://docs.oracle.com/en/cloud/saas/readiness/hcm/26b/hure-26b/26B-hr-wn-f43513.htm>, accessed October 29, 2026.
[^cw-ora-25a]: Oracle, *Oracle Fusion Cloud Payroll 25A What's New*, "Redwood Experience for Payment Methods Supports Bank Account Creation For Additional Person Types" (contingent worker, pending worker and nonworker), <https://docs.oracle.com/en/cloud/saas/readiness/hcm/25a/payr-25a/25A-payroll-wn-f36368.htm>, accessed October 29, 2026.
[^cw-ora-feeds]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Employee Feeds" ("Feeds are triggered only for employee, contingent worker, and pending worker types"; the collections), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Employee_Atom_Feeds.html>, accessed October 29, 2026.
[^cw-ora-ems]: Oracle, *Oracle Fusion Cloud HCM Integration with External Entitlement Management Systems* (feeds cover employees, contingent workers and pending workers; termination context with `PeriodType`, `WorkerType` and conditional `ActualTerminationDate`; termination on the effective date; `empassignment` with the period-of-service ID for `CWKAssignmentDEO`; pending worker conversion example), <https://docs.oracle.com/en/applications/fusion-apps/fusion-human-capital-management/hcmintegration/index.html>, accessed October 29, 2026.
[^cw-ora-pos]: Oracle, *Oracle Fusion Cloud HCM: Configuring and Extending HCM Using Autocomplete Rules*, "Attributes for Worker Work Relationship" (`PERIOD_TYPE` E or C, or N; `ACTUAL_TERMINATION_DATE`; `PROJECTED_TERMINATION_DATE`), <https://docs.oracle.com/en/cloud/saas/human-resources/faiau/attributes-for-worker-work-relationship.html>, accessed October 29, 2026.
[^cw-ora-ebs]: Oracle, *Oracle Services Procurement Process Guide*, Release 12.2 (E-Business Suite, not Fusion Cloud: an HR user can place a contingent worker "from a purchase order," with "the purchase order number, line, and project details" defaulted, and the assignment's Supplier region records the supplier), <https://docs.oracle.com/cd/E26401_01/doc.122/e68109/T659470T659474.htm>, accessed October 29, 2026. Cited to show where the linkage is documented; it isn't evidence for Fusion Cloud HCM.
[^cw-ora-sd]: Oracle, *Oracle Fusion Service Descriptions*, effective October 20, 2026, Glossary and Metrics, p. 19 (Hosted Employee: employees plus "all of Your agents, contractors, and consultants where such agents, contractors, and consultants have access to, use of, or are tracked by the programs"; quantity "determined by the number of Hosted Employees and not the actual number of users"), and p. 94 (HCM Base Cloud Service, Hosted Employee, part B85800), <https://www.oracle.com/contracts/docs/oracle-fusion-cloud-service-desc-1843611.pdf>, accessed October 29, 2026.
[^cw-ms-tut]: Microsoft Learn, "Configure Oracle Human Capital Management (HCM) for automatic user provisioning" (sample payload `userType` from `workers.workRelationships.WorkerType`; scoping filters to skip records no longer relevant; mover when "a worker is converted from full-time to contractor or vice-versa"; no mention of contingent workers), <https://learn.microsoft.com/en-us/entra/identity/saas-apps/oracle-hcm-provisioning-tutorial>, accessed October 29, 2026.
[^cw-ms-faq]: Microsoft Learn, "Frequently asked questions about API-driven inbound provisioning" ("three separate provisioning apps – one for each identity type with its own distinct attribute mapping"; no user deletion through `/bulkUpload`), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-faqs>, accessed October 29, 2026.
[^cw-ms-config]: Microsoft Learn, "Configure API-driven inbound provisioning app" (multiple apps for multiple sources, each with their own sync rules), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-configure-app>, accessed October 29, 2026.
[^cw-ms-plan]: Microsoft Learn, "Plan cloud HR application to Microsoft Entra user provisioning" (separate apps where mapping differs by user type, employee or contractor; a separate app to update only the manager of contractors who report to employees), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/plan-cloud-hr-provision>, accessed October 29, 2026.
[^cw-ms-user]: Microsoft Learn, "user resource type," Microsoft Graph v1.0 (`employeeType`: "Captures enterprise worker type. For example, Employee, Contractor, Consultant, or Vendor"), <https://learn.microsoft.com/en-us/graph/api/resources/user?view=graph-rest-1.0>, accessed October 29, 2026.
[^cw-ms-b2b]: Microsoft Learn, "Understand and manage the properties of B2B guest users" (Member "indicates an employee of the host organization and a user in the organization's payroll"), <https://learn.microsoft.com/en-us/entra/external-id/user-properties>; and "Transition to governed collaboration with Microsoft Entra B2B collaboration" (external users added as members; transition them to B2B and change `userType` to Guest), <https://learn.microsoft.com/en-us/entra/architecture/5-secure-access-b2b>, accessed October 29, 2026.
[^cw-ms-lcw-rule]: Microsoft Learn, "ruleBasedSubjectSet resource type," Microsoft Graph v1.0 (workflow scope properties include `employeeType` with `eq`, `ne` and `in`, and `userType`), <https://learn.microsoft.com/en-us/graph/api/resources/identitygovernance-rulebasedsubjectset?view=graph-rest-1.0>, accessed October 29, 2026.
[^cw-ms-lcw-tmpl]: Microsoft Learn, "Lifecycle Workflows templates and categories" (leaver templates triggered on `employeeLeaveDateTime`), <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-templates>, accessed October 29, 2026.
[^cw-memo]: Office of Management and Budget and Office of Personnel Management, *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government*, December 10, 2025 (p. 1 and n. 3: government-wide adoption by FY 2028, military personnel and Intelligence Community agencies not initially included; p. 2: functions in scope, agencies to pause their own Core HCM efforts, exceptions from the OMB and OPM Directors, Wave 1 in FY 2026 and Wave 2 in FY 2027; p. 6, Appendix C: "Start identifying agency-unique requirements"; full-text search: no occurrence of "contractor," "contingent" or "non-employee"), <https://www.opm.gov/chcoc/latest-memos/creating-federal-hr-20-by-consolidating-core-human-capital-management-across-the-federal-government.pdf>, accessed October 29, 2026.
[^cw-pws-scope]: Office of Personnel Management, Solicitation 24322626R0007, *Federal HRIT Modernization*, Amendment 4 (posted December 11, 2025), Performance Work Statement §2, Scope of Work (p. 18: "system of record for approximately 2 million Executive Branch civilian employees"; Postal Service and Intelligence Community employees not included; full-text search: no occurrence of "contingent," "non-employee," "worker type" or "volunteer"), SAM.gov, <https://sam.gov/workspace/contract/opp/8cfe1844758c4fb2b10f5ef192b62f89/view>; document <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 29, 2026.
[^cw-pws-clin]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, Section B, CLIN 0003 (p. 10: "Licensing and Sustainment for 2 million employees," priced per employee per year) and PWS §5.3.1(1) (p. 39: "Provide licenses for all users. The license model must be all-inclusive"), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 29, 2026.
[^cw-pws-config]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §3.2 and §5.1 (pp. 22, 27–28: agency configuration in scope; "Platform extensions are considered configurations"; "a common federal baseline configuration") and §5.2, Agency Transition (p. 32: "It is the intent of government for all agencies to go live by July 4, 2027"), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 29, 2026.
[^cw-pws-affiliate]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS Appendix A, Req. 21, Core HCM Administration (p. 61: "targetable by user role, affiliate type, and record information"; also Req. 60, p. 64), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 29, 2026.
[^cw-pws-pia]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §5.1.1(7) (p. 27: "Complete a Privacy Impact Assessment (PIA)"), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>; Federal Register document search for "Federal HR 2.0" and "Core Human Capital Management," <https://www.federalregister.gov/>; OPM, "Privacy," <https://www.opm.gov/privacy/>, all accessed October 29, 2026.
[^cw-qa1]: Office of Personnel Management, Solicitation 24322626R0007, Questions and Answers, set 1 (Q218, p. 14: "The solicitation and resultant contract is for 2 million employee licenses"; Q279, p. 17: "user roles include employees, managers, administrators, and HR professionals"), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/fbde5477815f434c91d0e77b8ddac549/download>, accessed October 29, 2026; and Questions and Answers, set 2 (posted November 5, 2025; full-text search: no occurrence of "contingent," "non-employee" or "volunteer"), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/be19b6e56b5e43cdb1ad259d6abfc5f5/download>, accessed October 30, 2026.
[^cw-opm-award]: Office of Personnel Management, "OPM Awards Contract for First Ever Governmentwide HR Platform" (news release: "approximately two million US Executive Branch civilian employees"; phased rollout), <https://www.opm.gov/news/news-releases/opm-awards-contract-for-first-ever-governmentwide-hr-platform/>, accessed October 29, 2026.
[^cw-govt1]: Office of Personnel Management, "Privacy Act of 1974: Update Existing System of Records" (OPM/GOVT-1, General Personnel Records), *Federal Register* 77, 73694, December 11, 2012, Categories of Individuals Covered by the System ("Volunteers, grantees, and contract employees on whom the agency maintains records may also be covered by this system"), <https://www.federalregister.gov/documents/2012/12/11/2012-29777/privacy-act-of-1974-update-existing-system-of-records>, accessed October 29, 2026.
[^cw-govt1-2023]: Office of Personnel Management, "Privacy Act of 1974; System of Records" (OPM/GOVT-1, revising routine uses "s" and "hh"), *Federal Register* 88, no. 158, August 17, 2023, <https://www.govinfo.gov/content/pkg/FR-2023-08-17/html/2023-17651.htm>, accessed October 29, 2026.
[^cw-govt7]: General Services Administration, "Privacy Act of 1974; Notice of an Updated System of Records" (GSA/GOVT-7, HSPD-12 USAccess), *Federal Register* 80, 64416, October 23, 2015, Categories of Individuals ("all participating agency employees, contractors and their employees, consultants, and volunteers who require routine, long-term access"), <https://www.federalregister.gov/documents/2015/10/23/2015-26940/privacy-act-of-1974-notice-of-an-updated-system-of-records>, accessed October 29, 2026.
[^cw-govt7-2006]: General Services Administration, "Privacy Act of 1974; Proposed Privacy Act System of Records" (GSA/GOVT-7), *Federal Register* 71, 56983, September 28, 2006, Categories of Records ("employee affiliation") and Record Source Categories (including "sponsoring agency" and "contract employer"), <https://www.govinfo.gov/content/pkg/FR-2006-09-28/html/E6-15901.htm>, accessed October 29, 2026.
[^cw-a108]: Office of Management and Budget, Circular A-108, *Federal Agency Responsibilities for Review, Reporting, and Publication under the Privacy Act*, December 2016, §6 (significant changes requiring a revised notice; §6.j, a contractor-operated system "deemed to be maintained by the agency"), <https://obamawhitehouse.archives.gov/sites/default/files/omb/assets/OMB/circulars/a108/omb_circular_a-108.pdf>, accessed October 29, 2026.
[^cw-doi-access]: Department of the Interior, *DOIAccess System Privacy Impact Assessment*, June 17, 2022 (§1.B: "considered the authoritative data source for DOI contractor personnel who require a DOI Access Card for network or physical access"; sources: HR, the shared PIV service, AD and the financial system's COR and facility data; Separation Report and Invalid Sponsor Report; data provided to SailPoint for CDM), <https://edit.doi.gov/sites/doi.gov/files/doiaccess-pia-06172022.pdf>, accessed October 29, 2026.
[^cw-gsa-gcims]: General Services Administration, *GSA Credential and Identity Management System (GCIMS) Privacy Impact Assessment*, PIA 373, approved January 12, 2023 (p. 2: contract data including "Contract start and end date"; §5.1: nightly HR download of departing employees; §6.1a: "An authoritative source of identities for Active Directory, Google mail, and other GSA systems"; twice-yearly reverification by points of contact), <https://origin-www.gsa.gov/system/files/GSA-Credential-and-Identity-Management-System-%28GCIMS%29-%28PIA-373%29.pdf>, accessed October 29, 2026.
[^cw-nasa-idmax]: National Aeronautics and Space Administration, *Identity Management and Account Exchange (IdMAX) Contains NASA Access Management System (NAMS) Privacy Impact Assessment*, 2025 posting (affiliation "such as civil servant or contractor"; "Human Capital Systems are the authoritative sources for civil servants identity data"; retention after the contract relationship expires), <https://www.nasa.gov/wp-content/uploads/2025/03/identity-management-and-account-exchange-idmax-contains-nasa-access-management-system-nams-2025.pdf>, accessed October 29, 2026.
[^cw-dhs-idms]: Department of Homeland Security, *Privacy Impact Assessment Update for the Personal Identity Verification (PIV) Management System / Identity Management System*, DHS/ALL/PIA-014(c), October 20, 2015 (provisioning and de-provisioning "based on changes in DHS PIV Card status (active, revoked, or suspended)"), <https://www.dhs.gov/sites/default/files/publications/privacy-pia-dhsall014-idms-july2018.pdf>, accessed October 29, 2026.
[^cw-usaccess]: General Services Administration, *USAccess Privacy Impact Assessment*, PIA 391, approved January 12, 2023, §§1.4, 4.3, 5.1 ("Initial information regarding a PIV applicant is provided through an agency sponsor"; record kept for the duration of a contractor's assignment), copy hosted by the Federal Housing Finance Agency, <https://www.fhfa.gov/document/gsa-usaccess-pia-391.pdf>, accessed October 29, 2026.
[^cw-epa-epacs]: Environmental Protection Agency, Office of Facilities and Administration, *ePACS Privacy Impact Assessment*, annual review signed September 2026, system overview, p. 2 ("A Human Resource Representative, Contracting Officer's Representative (COR), a Grant Officer, or a Project Officer initiates a request for an USAccess badge"), <https://www.epa.gov/system/files/documents/2026-09/ofa-epacs-pia-08-28-2026-lk-signed-9_4.pdf>, accessed October 29, 2026.
[^cw-tigta]: Treasury Inspector General for Tax Administration, *Former Contractor Employees Retained Access to IRS Facilities, Systems, and Equipment*, Report 2024-100-063, September 18, 2024 (Highlights: 1,821, or 10 percent, should have been listed as separated; Background: the Contractor Management and Contingent Worker modules of Treasury's HR system; "The contractor employee separation process is initiated by the COR"), <https://www.oversight.gov/sites/default/files/documents/reports/2024-09/2024100063fr.pdf>, accessed October 29, 2026.
[^cw-dot-oig]: Department of Transportation, Office of Inspector General, *Fragmented Processes Weaken DOT's Accountability for Contractor Employee PIV Cards*, ZA2023030, May 24, 2023 (report summary), <https://www.oversight.gov/reports/audit/fragmented-processes-weaken-dots-accountability-contractor-employee-piv-cards>, accessed October 29, 2026.
[^cw-dhs-oig-23]: Department of Homeland Security, Office of Inspector General, *DHS Did Not Always Promptly Revoke PIV Card Access and Withdraw Security Clearances for Separated Individuals*, OIG-23-04, January 9, 2023 (report summary), <https://www.oversight.gov/reports/audit/dhs-did-not-always-promptly-revoke-piv-card-access-and-withdraw-security-clearances>, accessed October 29, 2026.
[^cw-doe-oig]: Department of Energy, Office of Inspector General, *Personnel Security Clearances and Badge Access Controls for Separated Employees*, DOE-OIG-21-12, January 19, 2021 (printed pp. 1–2, PDF pp. 2–3: of separated federal and contractor employees tested, "39 percent of separated employees' PIV cards or employment statuses had not been updated in USAccess"), <https://www.energy.gov/sites/default/files/2021/01/f82/DOE-OIG-21-12.pdf>, accessed October 29, 2026.
[^cw-dhs-oig-26]: Department of Homeland Security, Office of Inspector General, *CBP's IT Access Control Deficiencies Introduced Critical Risk to IT Systems and Sensitive Information*, OIG-26-28, September 4, 2026 (report summary: "15 percent of identified contractor accounts were not disabled in a timely manner after separation"), <https://www.oversight.gov/reports/audit/cbps-it-access-control-deficiencies-introduced-critical-risk-it-systems-and-sensitive>, accessed October 29, 2026.
[^cw-doe-saviynt]: Department of Energy, *Privacy Impact Assessment: Saviynt Identity Governance Administration (IGA) – MyIdentity*, IM-64, August 4, 2022 (identity established from authoritative sources; "MyIdentity is not the authoritative source for the privacy data"), <https://www.energy.gov/sites/default/files/2025-02/IM%20Saviynt%20Identity%20Governance%20Administration%20%28IGA%29%20-%20MyIdentity.pdf>, accessed October 29, 2026.
[^cw-nerm]: SailPoint, *Non-Employee Risk Management Admin Help*, "Managing Non-Employee Profiles in SailPoint Human Fabric" (section "Creating a Profile Management Source") ("use Non-Employee Risk Management as an authoritative source of your non-employee identity data"), <https://documentation.sailpoint.com/ne-admin/help/connector/profile_connector.html>; and "Glossary" (sponsor on assignment profiles; an assignment as a non-employee's time-bound association with a job or project), <https://documentation.sailpoint.com/ne-admin/help/glossary.html>, accessed October 29, 2026.
[^cw-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, AC-2(h) and (l), Account Management, and PS-7(d), External Personnel Security (OSCAL catalog 5.2.0), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>, accessed October 29, 2026.
[^cw-fips201]: National Institute of Standards and Technology, FIPS 201-3, *Personal Identity Verification (PIV) of Federal Employees and Contractors*, January 2022, §2.1 (issuance "only after a proper authority has authorized issuance of the credential"), §2.9.1 (reissuance; new FASC-N and card UUID) and §2.9.4 (termination when "A contractor changes positions and no longer needs access"; "within 18 hours of notification"), <https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.201-3.pdf>, accessed October 29, 2026.
[^cw-sp80079]: National Institute of Standards and Technology, SP 800-79-2, *Guidelines for the Authorization of Personal Identity Verification Card Issuers (PCI) and Derived PIV Credential Issuers (DPCI)*, July 2015, §2.3 (only the organization decides which employees and contractors apply for a PIV card; sponsorship and adjudication "cannot be outsourced"), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-79-2.pdf>, accessed October 29, 2026.
[^cw-far41301]: Federal Acquisition Regulation, 4.1301, Policy (c) ("Agencies must designate an official responsible for verifying contractor employee personal identity") and (d), <https://www.acquisition.gov/far/subpart-4.13>, accessed October 29, 2026.
[^cw-far52049]: Federal Acquisition Regulation, 52.204-9, Personal Identity Verification of Contractor Personnel (January 2011), (b) (return of government-provided identification "Upon contract completion or termination," among other points), <https://www.acquisition.gov/far/52.204-9>, accessed October 29, 2026.
[^cw-m1917]: Office of Management and Budget, M-19-17, *Enabling Mission Delivery through Improved Identity, Credential, and Access Management*, May 21, 2019 (revocation "when the employee or contractor separates from the agency"; "Agencies shall establish authoritative solutions for their ICAM services"; the lifecycle of identities; an ICAM governance structure), <https://www.whitehouse.gov/wp-content/uploads/2019/05/M-19-17.pdf>, accessed October 29, 2026.
[^cw-ilm]: General Services Administration, FICAM, *Identity Lifecycle Management Playbook*, version 1.4, March 31, 2026 ("Authoritative Source of Truth: The HR/personnel system is the sole driver of identity creation and termination"), <https://www.idmanagement.gov/playbooks/ilm/>, accessed October 29, 2026.
[^cw-arch]: General Services Administration, FICAM, *Federal Identity, Credential, and Access Management Architecture*, version 3.3, June 30, 2023 (identity management: creation with an authoritative source, and deactivation; credential management: sponsorship), <https://www.idmanagement.gov/arch/>, accessed October 29, 2026.
[^cw-fpds]: Federal Procurement Data System, data dictionary help: "Period of Performance Start Date" (page `Effective_Date.htm`), "Completion Date" ("The completion date of the base contract plus options that have been exercised") and "Ultimate Completion Date," <https://fpds.gov/help/Effective_Date.htm>, <https://fpds.gov/help/Completion_Date.htm>, <https://fpds.gov/help/Ultimate_Completion_Date.htm>, accessed October 29, 2026.
[^cw-usasp]: USAspending.gov, data dictionary API (period of performance current and potential end dates mapped to FPDS; "The completion date does not change to reflect a closeout date"), <https://api.usaspending.gov/api/v2/references/data_dictionary/>, accessed October 29, 2026.
