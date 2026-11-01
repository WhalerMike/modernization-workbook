# Independent verification pass — October 2026

Run: October 30, 2026. Requested by the author after the contractor-source and HR 2.0 shared-governance research, to test the claims without relying on their own logs.

## Scope

- Research page `docs/evaluations/oracle-contingent-worker-contractor-source.md`: all 62 footnotes and every sentence or table cell that cites them.
- Research page `docs/books/explainers/hr2-shared-governance-fedramp-boundary.md`: all 47 footnotes. PR #196 was still open, so the page was read from branch `claude/hr2-sharing-fedramp20x` (line numbers below are that branch's), and **no change was made to it**. Its fixes are listed for after #196 merges.
- The contractor PIV path in the books, every footnoted sentence and each factual statement:
  - Book 03: Ch08 (contractors paragraph and the custom-task sentence), Ch09 "The contractor PIV path", Ch11 (contractor credential drift row, PS-7 row), Ch12 (decision bullet), Appendix A "Contractor leavers";
  - Book 04 Ch03 "Contractors and the PIV path";
  - Book 07 Ch04 "The contractor PIV path";
  - the Attribute-Driven Migration guide, "Contractors" in the PKI binding section.

## Method

- Five checkers worked in parallel (A: Oracle, Microsoft and SailPoint; B: Federal HR 2.0 documents, privacy notices and assessments, inspector general reports; C: NIST, FAR, OMB, FICAM, FPDS, USAspending and the book footnotes; D: HR 2.0 governance sources; E: FedRAMP, Oracle Cloud, cryptography and domain sources). None used the existing logs.
- Every source was re-opened on October 30, 2026 by a raw fetch (`curl`), with PDFs downloaded and their text extracted (pypdf). No quote was checked through a summarizing fetch tool.
- Where a site refused automated requests, the same document was read raw from the publisher's own alternative: govinfo.gov for federalregister.gov notices, the eCFR API for the eCFR page, the help desk's Zendesk API for the OPM Touchpoint Q&A, NIST's OSCAL catalog for SP 800-53 control text.
- Each row checks: the claim against the source; that quotes are verbatim and under 25 words; dates, sections and page numbers (printed and PDF page given where they differ); and that *(inference)* and *(design guidance)* items aren't stated as fact elsewhere. Absence claims were re-run as full-text searches.

Verdicts: **supported**; **partly supported** (true in part, or the wording overstates or drops a condition); **not supported**; **source changed**; **couldn't open**.

## Results

| Set | Rows | Supported | Partly supported | Not supported | Source changed | Couldn't open |
|---|---|---|---|---|---|---|
| A: contractor page, Oracle / Microsoft / SailPoint; Book 04 and Book 07 Microsoft footnotes | 30 | 24 | 6 | 0 | 0 | 0 |
| B: contractor page, HR 2.0 / privacy / IG | 30 | 25 | 4 | 1 | 0 | 0 |
| C: contractor page, NIST / FAR / OMB / FICAM / FPDS; book contractor PIV sections | 35 | 33 | 2 | 0 | 0 | 0 |
| D: HR 2.0 page, governance and OPM | 23 | 18 | 4 | 1 | 0 | 0 |
| E: HR 2.0 page, FedRAMP / Oracle / crypto / domains | 41 | 33 | 8 | 0 | 0 | 0 |

No source has changed since the pages were written: the FedRAMP rules are still version 2026.10.13.01, and the Marketplace record matches the data of October 30, 2026. Every source opened, two of them by the alternative routes above.

## Mechanical corrections applied in this pass

Contractor-source research page (`docs/evaluations/oracle-contingent-worker-contractor-source.md`):

| Footnote / line | Correction |
|---|---|
| Part 3 requirements table, AC-2 row | Quote made verbatim: "personnel termination and transfer processes" (was "personnel termination process") |
| Part 5, link 3 | Ungrammatical fragment "of notification" replaced by the verbatim "within 18 hours of notification", with the can't-be-collected condition |
| cw-fpds | Page title "Period of Performance Start Date" (was "Effective Date") |
| cw-ora-pos | Guide and page title: *Configuring and Extending HCM Using Autocomplete Rules*, "Attributes for Worker Work Relationship" |
| cw-ora-ebs | Footnote described content not on the page ("projected assignment end"); restated to what the page says |
| cw-ora-hdl, cw-ora-hdl-term | Guide title *HCM Data Loading Business Objects* |
| cw-nerm | Page title "Managing Non-Employee Profiles in SailPoint Human Fabric" |
| cw-ora-wr | The page also lists the Offer worker type |
| cw-pws-clin | CLIN 0003 is on p. 10 (was pp. 9–10) |
| cw-pws-config | July 4, 2027 sentence is in §5.2, Agency Transition (was "the agency transition table") |
| cw-pws-affiliate | Second occurrence is Req. 60, p. 64 |
| cw-pws-pia | §5.1.1(7) (was §5.1(7)) |
| cw-qa1 | Body says "either question-and-answer set"; set 2 now cited, its absence search re-run |
| cw-opm-award, cw-govt1, cw-govt7-2006 | Titles as published |
| cw-epa-epacs | Quote is in the system overview, p. 2 (was §1) |
| cw-doe-oig | Printed pp. 1–2, PDF pp. 2–3 |
| cw-dhs-oig-26 | Report title added |

Books:

| Location | Correction |
|---|---|
| Book 03 Ch11, footnote `c11-nist-80053` | PS-7 added to the control list (the PS-7 row cites it) |
| Book 07 Ch04, footnote `c04-fips201` | §2.1 and §2.9.4 named, with what each is cited for |

Each correction is logged in the page's own `_verification` file.

## Substantive findings — proposed, awaiting the author's approval

Nothing below has been changed. Each needs the author's yes before the claim is reworded.

### Contractor-source research page

1. **DOIAccess and the financial system** (Part 3, pattern table and "closest" sentence; cw-doi-access) — *not supported.* The PIA lists FBMS among DOIAccess's authoritative data sources but never says it supplies COR or facility data. Proposed: "HR or COR sponsors enter records; the financial system (FBMS) is one of its listed authoritative data sources", and the matching footnote restatement.
2. **DHS IDMS de-provisioning** (Part 3 and Part 5; cw-dhs-idms) — *partly supported.* Card status drives de-provisioning in the physical access systems only; the directory receives the card's certificates for log-on. Proposed: "Revocation or suspension de-provisions physical access (PACS); directory accounts receive the card's certificates for log-on."
3. **Oracle person security profiles** (Part 1, line ~62; cw-ora-pt) — *partly supported.* The "don't mix E, C, N, P in one security profile" rule is a step for *Not Managed by HR* profiles only, so the inference about scoping contractor administrators doesn't follow. Proposed: restate it as an NMBHR-only rule *(inference)*, or delete the sentence.
4. **"No contract number" on the contingent worker** (Findings, Part 1, Part 6, What couldn't be verified) — *partly supported.* The REST assignment resource documents `ContractId` and `ContractNumber`, and a work-relationship `contracts` child; they hold the employment contract, not a procurement contract or PO. Proposed: "No Fusion Cloud page found documents a purchase order or procurement contract number on the assignment; the assignment's `ContractNumber` is the employment contract, held 'for information purposes'."
5. **Change Worker Type** (Part 1, line ~78; cw-ora-cwt) — *partly supported.* The 26B process creates a new work relationship in one transaction (cancelling it reactivates the original); it removes only the manual terminate-and-recreate. Proposed: "converts contingent worker to employee and back in one transaction, creating the new work relationship without a separate termination and hire."
6. **Lifecycle Workflows leaver templates** (Part 1, line ~120; cw-ms-lcw-tmpl) — *partly supported.* Three of six leaver templates trigger on `employeeLeaveDateTime`. Proposed: "the date-based leaver templates (pre-offboarding, offboarding and post-offboarding) trigger on `employeeLeaveDateTime`."
7. **Circular A-108 test** (Part 2, Privacy Act; cw-a108) — the page uses the weaker "substantially increases access" test. §6.b(1) names "A substantial increase in the number, type, or category of individuals" as a significant change, with an analogous example. Proposed: "adding contractors to an employee system is that kind of change. The privacy office decides."
8. **"Affiliate type" as the only adjacent term** (Part 2) — Amendment 4 Req. 95 (p. 69) also covers learning records "regardless of affiliation". Proposed: name both terms; nothing ties either to contractors.
9. **Smaller overstatements:** "in every pattern" (Findings) → "across the patterns they cover"; GCIMS "departing employees only" → "a nightly download of departing employees"; the USAccess cell "The sponsor ends the assignment" has no source → label *(inference)*; "The published-date polling … applies to contingent workers too" (Part 1) → label *(inference)*; the memo's absence search can't cover its image-only appendices → say "(full-text search of the memo's text)"; OPM/GOVT-1 was also amended in 2022 and May 2026 (routine uses, per the abstracts) → "The 2023 and 2026 notices changed routine uses, not categories" after opening them.

### Book contractor PIV sections

10. **Book 04 Ch03, Temporary Access Pass and guests** — *partly supported.* Microsoft's "only internal guest accounts can be issued a TAP" is a rule *among guest types*; member accounts can be issued one. As written, the sentence reads as a general restriction. Proposed: "Among guest accounts, only internal guests can be issued a Temporary Access Pass; an external B2B guest can't get one from the agency's tenant,[^c03-tap] which is one more reason …", and the footnote to match.
11. **Book 03 Ch08, the custom-task sentence** — *partly supported.* "so the card's termination clock starts on that date" drops the condition that the 18-hour clock applies only to a card that can't be collected, and isn't labelled. Proposed: "so, for a card that can't be collected, the 18-hour termination clock starts on that date *(design guidance)*".
12. **FIPS 201-3 notification** (all locations) — no error, but a caution: FIPS 201-3 doesn't say who gives the notification or what it is. "The pipeline's end-date notice starts the clock" is design in every location, and every location except item 11 already says so. FIPS 201-3 also never names contract end as a termination event; FAR 52.204-9(b)(3) does, and the pages cite it for that.

### HR 2.0 shared-governance research page (after PR #196 merges)

13. **No change control board** (Part 1, "After the award"; hb-qa2) — *not supported.* Q360 says there is "no pre-established change control board cadence or appeal path defined in the contract", not that there is no board. Proposed: "No set change-control cadence …; schedule- or cost-affecting changes go to the Contracting Officer at the task-order level."
14. **Customer Advisory Board quote** (Findings and Part 1; hb-pws-gov) — truncated so it shifts meaning: the full sentence is "represent their agency on behalf of the program", a channel from the program to agencies. Proposed: quote it whole.
15. **"No public forum lets agencies share …"** (Findings) — an unlabelled absence claim, in tension with the Data working group's remit "within and across federal agencies". Proposed: label *(inference)* or "No source found describes …", and add it to What couldn't be verified.
16. **The feed's path and credentials are OPM's to set** (Part 2 table) — the gateway rule covers OPM-owned and managed integrations, and the page's own Question 3 asks whether the feed uses it. Proposed: "If the feed runs through the OPM gateway, …*(inference)*", and label the table's effect column.
17. **Oracle hostnames** (Findings, Part 4, What couldn't be verified; hb-ora-url) — the "commercial regions only … restricted regions differ" sentence is from Oracle's EPM documentation, about EPM URLs, not Fusion Applications. Proposed rewording for the three places, and "in the documentation checked" on the absence claim; the Findings heading "is `.com`, not `.us`" contradicts the page's own unverified list.
18. **Rev5 end date** (Part 2; hb-ntc13) — NTC-0013 targets June 11, 2027 for new Rev5 certifications; only the end date for existing ones is open ("likely to be no later than 2029").
19. **USDA Connect carve-out** (Part 2 tiers table) — the trust-center on-request and denial-reporting rules don't apply to providers still using USDA Connect.
20. **Smaller overstatements:** "every certified provider" → "every Class B–D provider"; "the provider's intellectual property" drops "usually"; M-24-15 §VII.a(7) is a GSA duty, p. 15 (not p. 16); the §3609 repeal note covers §3609 only (cite the §3607 note for §§3607–3616); "don't stop it" / "don't forbid it" → "the rules contain no prohibition on it"; the MAESC is the Multi-Agency Executive *Strategy* Committee.

Mechanical fixes for the HR 2.0 page (verbatim quotes, titles, section and page numbers) are listed in ledgers D and E below, to apply after #196 merges.

## The checkers' ledgers

The full row-by-row ledgers follow, as the checkers wrote them. Line numbers are those of the files before this pass's corrections. Items under "Mechanical fixes" for the contractor-source page and the books were applied as listed above, except those that only make sense with a substantive rewording (cw-ora-pt, cw-doi-access, cw-a108, c03-tap), which wait for items 1, 3, 7 and 10.

### Ledger A — contractor page: Oracle, Microsoft, SailPoint; Book 04 and Book 07 Microsoft footnotes

Page: `docs/evaluations/oracle-contingent-worker-contractor-source.md` (RP). Sources fetched raw with curl on 2026-10-30, all HTTP 200; the Oracle Service Descriptions PDF was extracted with pypdf (227 pages).

#### 1. Table

| Footnote | Where cited | Claim (short) | Verdict | Discrepancy / note |
|---|---|---|---|---|
| cw-ora-wr | RP L35, L56 table, L60 caption, L67 | CW = "A nonemployee, for example, contract worker or temporary worker"; fixed worker types E/C/N/P; one primary relationship | partly supported | Definitions and the quote "A person can have only one primary work relationship" are verbatim. But the page also lists a fifth worker type, **Offer (O)** (Oracle Recruiting only), so "alongside employee, nonworker and pending worker" leaves one out. The word "fixed" isn't stated (the page says the worker type can't be changed after creation, and that you can't create new nonworker types). |
| cw-ora-wt | L66, L67 | "Because a person can have multiple work relationships…"; the primary relationship's worker type applies | supported | Verbatim. |
| cw-ora-pt | L51, L62 | "You can't change, delete, or create additional system person types"; a security profile mustn't mix E/C/N/P person types | partly supported | The first quote is verbatim. The second rule sits **inside the Not Managed by HR (NMBHR) section**, as a step for building an NMBHR person security profile: "You must not use Employee, Contingent Worker, Nonworker, or Pending Worker person types in the same security profile." It doesn't say a general profile can't mix E and C. See Substantive 1. |
| cw-ora-asg | L36, L68, L89, L96, L221 | Projected dates "for information purposes only and have no effect on application processing"; assignment numbers prefixed E/C/N/P | supported | Source: "The projected date details are for information purposes only and have no effect on application processing." The note covers both projected dates generally, not contingent workers specifically. The same page says "Assignments can include contract details for information purposes" (see Substantive 2). |
| cw-ora-rest | L60, L62, L96 | `WorkerType` E, C, P or N; assignment `ProjectedEndDate`; relationship `ProjectedTerminationDate` | supported | "such as Employee (E), Contingent Worker (C), Pending Worker (P), or Nonworker (N)". |
| cw-ora-rest-asg | L35, L62, L69, L90–92 | Same assignment resource: department, job, position, location, managers, BU, `SystemPersonType`, `UserPersonType`, `ProjectedStartDate`/`EndDate` | supported | All present. The same resource also documents assignment **`ContractId` and `ContractNumber` ("Number of the contract")**, plus a work-relationship `contracts` child with `ContractNumber` and `ContractEndDate` (employment contract). This bears on the "no contract number" claims; see Substantive 2. |
| cw-ora-create | L69, L76, L95 | `POST` with `"WorkerType": "C"`; response shows projected start and end dates | supported | Response has `"ProjectedStartDate": null, "ProjectedEndDate": null`. |
| cw-ora-24a | L69, L75 | Add a Contingent Worker from Quick Actions on My Client Groups and My Team; "All the attributes in the Hire an Employee flow…" | supported | Verbatim. |
| cw-ora-hdl | L37, L77, L93 | CW rows: worker type C, `ADD_CWK_WORK_RELATION`, `VendorId`, `VendorSiteId`, `ProjectedStartDate`, `ProjectedEndDate` | supported | These appear as METADATA columns in the "Create Work Relationship" example; the sample values for them are blank. The guide's breadcrumb name is "HCM Data Loading Business Objects", not "HCM Data Loader…" (Mechanical 3). |
| cw-ora-hdl-term | L36, L97 | Leaves only by explicit termination; `ActualTerminationDate`; assignments inactive; supervisor end-dated | supported | "All associated assignments are automatically made inactive after the termination date"; "the worker supervisor relationship is end-dated." Same guide-title note as above. |
| cw-ora-convert | L78 | Renew Contingent Worker and Add Contingent Work Relationship are named actions | supported | These are listed as conversion actions for a pending worker converted to a contingent worker. |
| cw-ora-cwt | L78, L113 | 26B Change Worker Type: CW↔E; "eliminates the need to terminate…"; no legal employer change; cancel reactivates | partly supported | L113 is verbatim and accurate. The source also lists Employee→Nonworker and CW→Nonworker, which the page omits (harmless). **L78 overstates:** the source says to reverse it "cancel the work relationship that was created as part of the transaction", so the process *does* create a new relationship; it only removes the manual terminate-and-recreate. Payroll balances "aren't transferred to a new payroll relationship." See Substantive 3. |
| cw-ora-25a | L102 | Payment methods extended to CW in 25A | supported | The source adds: "also made available in the December monthly update of 24D." |
| cw-ora-feeds | L35, L106, L231 | "Feeds are triggered only for employee, contingent worker, and pending worker types." | supported | Verbatim. |
| cw-ora-ems | L62, L106–108, L113 | Feeds "track data changes that pertain to employees, contingent workers, and pending workers"; termination context `PeriodType`/`WorkerType`, conditional `ActualTerminationDate`; effective-date note; `CWKAssignmentDEO`; EMP/PWK; same person number on pending conversion | supported | All verbatim or confirmed. Source: "…not necessarily the date that the termination is entered into the system" (the page truncates at "entered", which is fine). Pending worker 966169008890210 keeps the same PersonNumber in the Add and Convert samples. The guide's cancelworkrelship sample also shows `"WorkerType" : "E"`, so both forms appear even in one guide, which supports "map both forms". |
| cw-ora-pos | L109 | `PERIOD_TYPE` distinguishes E, C and N | supported | "E or C, or non-worker: N". The footnote title is wrong (Mechanical 1). |
| cw-ora-ebs | L37, L79, L94 | PO-to-assignment linkage documented only for EBS | partly supported | The page supports the body text (an HR user can place a contingent worker "from a purchase order"; "the purchase order number, line, and project details if any default"; a Supplier tabbed region). The **footnote's** "supplies supplier, site and projected assignment end" isn't on this page: "projected" occurs 0 times (Mechanical 2). |
| cw-ora-sd | L39, L147 (x2) | Hosted Employee definition; "not the actual number of users"; HCM Base uses Hosted Employee, B85800; no CW metric | supported | Effective Date: 20-October-2026 (PDF p.1). The definition is on printed **p. 19 = PDF p. 19**, under GLOSSARY AND METRICS; quotes are verbatim. HCM Base Cloud Service – Hosted Employee, Part #: B85800, is on printed **p. 94 = PDF p. 94**. Absence check: "contingent" occurs only on p. 92 (an `HR_CONTINGENT_WORKER` party-usage exclusion), so there is no contingent-worker metric. |
| cw-ms-tut | L43, L117, L118 | `userType` from `workers.workRelationships.WorkerType`; scoping filters; mover "converted from full-time to contractor or vice-versa"; no mention of contingent | supported | Sample payload: `"userType": "<Oracle HCM workers.workRelationships.WorkerType "`. Absence: "contingent" occurs 0 times. Page updated_at 2026-06-15. |
| cw-ms-faq | L119, L230, L268 | "three separate provisioning apps – one for each identity type…"; no deletion via `/bulkUpload` | supported | Verbatim ("You can create three separate provisioning apps"); the page paraphrases "You" as "an agency". |
| cw-ms-config | L119 | Multiple apps for multiple sources, each with its own sync rules | supported | "If you plan to ingest data from multiple sources, each with their own sync rules, you can create multiple apps…" |
| cw-ms-plan | L119 | Separate apps by user type; a separate app updates only the manager of contractors reporting to employees | supported | "Use the separate app to update only the manager attribute." This is in the HR2AD (on-premises AD) topology section. The page H1 is now "Cloud HR application to Microsoft Entra user provisioning"; the `<title>` still starts with "Plan". |
| cw-ms-user | L43 | `employeeType` "Employee, Contractor, Consultant, or Vendor" | supported | "Captures enterprise worker type. For example, Employee, Contractor, Consultant, or Vendor." `userType` possible values are Member and Guest. |
| cw-ms-b2b | L43, L118 | Member "indicates an employee of the host organization and a user in the organization's payroll"; recommends moving non-employees to B2B Guest | supported | First quote verbatim (user-properties). Second source: "We recommend you transition these accounts to Microsoft Entra B2B external user accounts and then change their UserType to Guest." That advice is framed for external users (vendors, partners, contractors) added as members. |
| cw-ms-lcw-rule | L120, L300 | Workflow scope supports `employeeType` with `eq`, `ne`, `in`; `userType` too | supported | `employeeType` is ticked in the "Supports eq, ne, in" column; `userType` is listed. |
| cw-ms-lcw-tmpl | L120 | "the leaver templates trigger on `employeeLeaveDateTime`" | partly supported | Only 3 of the 6 Leaver-category templates do (Pre-Offboarding, Offboard, Post-Offboarding of an employee). Real-time employee termination is "On-demand". Pre-Offboard and Offboard inactive users use sign-in inactivity, attribute or group triggers. See Substantive 4. |
| cw-nerm | L172, L217 | "an authoritative source of your non-employee identity data"; assignments time-bound with sponsor | supported | Verbatim. Glossary: Assignment is "a non-employee's time-bound association with a job or project"; Sponsor is "An attribute on assignment profiles". The page has been retitled (Mechanical 4). |
| c03-tap | b04 Ch03 L125 (x2) | TAP lets users "onboard other passwordless authentication methods"; "Only internal guest accounts can be issued a Temporary Access Pass" | partly supported | The first quote is verbatim. The second is verbatim in the source (Troubleshooting) **but only in a guest-only context**: "You can add a TAP as a sign-in method to an internal guest, but not other types of guests" and "Both internal and external guest accounts have an option to add a TAP… However, only internal guest accounts can be issued a TAP." Out of context, the book sentence reads as "only internal guests (not members)", which is wrong: members can be issued a TAP. The source also says external guests can sign in with a TAP **from their home tenant** if cross-tenant MFA trust is configured. See Substantive 5. |
| c03-tap (strength claim; source: Authentication strengths doc) | b04 Ch03 L125 | TAP satisfies only the Multifactor authentication strength, not Phishing-resistant MFA | supported | Raw table row "Temporary Access Pass (one-time use and multiple use)": ✅ under MFA strength, blank under Passwordless MFA and Phishing-resistant MFA. This claim isn't attributed to [^c03-tap]; it relies on the table "above" (c03-auth-strengths), which matches the source. |
| c04-cba-crl | b07 Ch04 L148 (also L77) | A revocation reaches Entra CBA only when the CA publishes a newer CRL and Entra's cache refreshes | supported | "If a CRL is already cached, newly revoked certificates aren't detected until the cache refreshes with an updated CRL." Also: "Token revocation for a revoked certificate isn't immediate because of CRL caching." The footnote quote "supports only HTTP or HTTPS. We recommend using HTTP instead of HTTPS for CRL distribution" is verbatim. The overview's "The CDP can be only HTTP URLs" is also still verbatim. "So the account disable, not the CRL, is what stops sign-in" is the book's own reasoning; it's consistent with the source, which advises manual token revocation for immediate effect. |

#### 2. Mechanical fixes

1. RP **L375** (cw-ora-pos):
   - Old: `*Oracle Fusion Cloud HCM*, "Attribute for Worker Work Relationship"`
   - New: `*Oracle Fusion Cloud HCM: Configuring and Extending HCM Using Autocomplete Rules*, "Attributes for Worker Work Relationship"`
2. RP **L376** (cw-ora-ebs):
   - Old: `(E-Business Suite, not Fusion Cloud: the purchase order line supplies supplier, site and projected assignment end for a contingent worker)`
   - New: `(E-Business Suite, not Fusion Cloud: an HR user can place a contingent worker "from a purchase order," with "the purchase order number, line, and project details" defaulted, and the assignment's Supplier region records the supplier)`
3. RP **L368, L369** (optional): change `*Oracle Fusion Cloud HCM: HCM Data Loader Business Objects*` to `*Oracle Fusion Cloud HCM: HCM Data Loading Business Objects*`, the guide name shown on both pages.
4. RP **L411** (cw-nerm):
   - Old: `"Profile Management Source"`
   - New: `"Managing Non-Employee Profiles in SailPoint Human Fabric" (section "Creating a Profile Management Source")`
5. RP **L362** (cw-ora-pt):
   - Old: `don't use the employee, contingent worker, nonworker or pending worker person types in the same security profile`
   - New: `a person security profile for the Not Managed by HR person type mustn't also use the employee, contingent worker, nonworker or pending worker person types`
6. RP **L360** (cw-ora-wr): change `(worker types employee, contingent worker, nonworker and pending worker, with definitions;` to `(worker types employee, contingent worker, nonworker, pending worker and offer, with definitions;`
7. RP **L381** (optional, cw-ms-plan): the H1 is now "Cloud HR application to Microsoft Entra user provisioning". The current title is acceptable because the `<title>` still starts with "Plan".
8. b04 **L273** (c03-tap):
   - Old: `only internal guest accounts can be issued a TAP)`
   - New: `among guest accounts, only internal guests can be issued a TAP; external guests can't)`

#### 3. Substantive findings

1. **Person security profile rule misread (RP L62).**
   - Source (faigh/person-types, inside "Not Managed by HR System Person Type › Person Security Profile"): "You can create a new person security profile with Not Managed by HR system person type. You must not use Employee, Contingent Worker, Nonworker, or Pending Worker person types in the same security profile."
   - The rule is about NMBHR profiles, not about separating E from C, so the inference about scoping contractor HR administrators doesn't follow.
   - Proposed: "Oracle also warns that a person security profile for the *Not Managed by HR* person type mustn't include the employee, contingent worker, nonworker or pending worker person types,[^cw-ora-pt] which matters only if contractors are held as NMBHR persons rather than contingent workers *(inference)*." Or delete the sentence.
2. **"No contract number" needs a qualifier (RP L37, L94, L233, L258, L330, Q5 L324).**
   - The REST worker-assignment resource documents `ContractId` and `ContractNumber` ("Number of the contract"), and a work-relationship `contracts` child with `ContractNumber`, `ContractEndDate` and `ContractType`. The Assignments page says "Assignments can include contract details for information purposes, which some legal employers require."
   - These are employment-contract fields, not a procurement contract or PO, but a reader will find them.
   - Proposed for L37: "No Fusion Cloud page found documents a purchase order or procurement contract number on the assignment. The assignment's `ContractNumber` is the employment contract, held 'for information purposes'.[^cw-ora-rest-asg][^cw-ora-asg]"
   - Also qualify L94 ("No documented procurement-contract or PO field; an employment `ContractNumber` exists") and L330 ("the large REST assignment pages were only partly scanned"): a scan finds `ContractNumber` but no `Vendor*` or `PurchaseOrder*` attribute on the assignments resource.
3. **Change Worker Type overstated (RP L78).**
   - The source says the process "eliminates the need to terminate an existing work relationship and create a new one", but to reverse it you "cancel the work relationship that was created as part of the transaction"; the original is then reactivated.
   - So a new work relationship *is* created, just in one transaction.
   - Proposed L78: "the 26B *Change Worker Type* process converts contingent worker to employee and back in one transaction, creating the new work relationship without a separate termination and hire[^cw-ora-cwt]".
   - Consider adding to L113: "it creates a new work relationship (cancelling it reactivates the original)". This matters for identity because the new relationship gets a new period of service and assignment number (C… to E…).
4. **Lifecycle Workflows leaver templates (RP L120).**
   - Source: Real-time employee termination is "On-demand"; the inactive-user templates use "Sign-in inactivity, Attribute changes, Group Membership change".
   - Proposed: "and the date-based leaver templates (pre-offboarding, offboarding and post-offboarding) trigger on `employeeLeaveDateTime`.[^cw-ms-lcw-tmpl]"
5. **TAP and guests (b04 Ch03 L125).**
   - "Only internal guest accounts can be issued a Temporary Access Pass" reads as a general restriction. Microsoft says only internal guests, **among guest types**, can be issued one: "You can add a TAP as a sign-in method to an internal guest, but not other types of guests." Member accounts can be issued a TAP.
   - Proposed: "Among guest accounts, only internal guests (a UserType of Guest with credentials in the agency's own tenant) can be issued a Temporary Access Pass; an external B2B guest can't get one from the agency's tenant,[^c03-tap] which is one more reason to decide on purpose whether contractors with agency accounts are members or guests (…)."
   - Optional nuance: an external guest can sign in with a TAP issued by its home tenant if cross-tenant MFA trust is configured.

#### 4. Label check

- RP L107: "The published-date polling the HCM guide recommends applies to contingent workers too." This is unlabeled and has no footnote. It follows from cw-ora-feeds and cw-ora-ems, but no source says it. Add *(inference)*.
- RP L258: "It doesn't hold the two facts the leaver depends on: a contract reference and an enforced end date (Part 1)." This is stated as fact. Given `ContractNumber` (Substantive 2), make it "a procurement contract reference", or label it.
- RP L67: the inference is labeled. L36, L43, L118 and L208 are labeled correctly, and no labeled inference in my scope is restated as plain fact elsewhere.
- b04 L123–126 is under *(design guidance)*. Its factual sub-claims (TAP strength, the TAP guest rule) are footnoted; only the guest wording needs the fix above.

#### 5. Couldn't open

None. All 31 HTML sources and the PDF returned HTTP 200 on raw curl; nothing used a summarizing fetch.

### Ledger B — contractor page: HR 2.0, privacy, inspector general

Checker B. Every source was fetched raw with curl, and PDFs were extracted with pypdf 6.18.1.
Page convention: "PDF p." is the physical page in the PDF. "printed p." is the number on the page.
Solicitation Amendment 4 prints "Page N of 159" on each page, so its printed page equals its PDF page. Q&A set 1 has no printed page numbers, so the page numbers below are PDF pages. The memo's printed numbers equal its PDF pages.
SAM.gov resource listing (opportunity ed2202dc…): Amd 4 was posted 2025-12-11 and is the latest amendment. "Questions and Answers 2" (resource be19b6e5…) was posted 2025-11-05. Q&A set 1 was posted 2025-10-29.

#### 1. Table

| Footnote | Where cited | Claim (short) | Verdict | Discrepancy / note |
|---|---|---|---|---|
| cw-memo | L38 | "contingent", "non-employee" and "volunteer" don't appear in the memo | supported | Full-text search of the extracted text finds 0 hits for contractor, contingent, non-employee and volunteer. Caveat: the Appendix A (wave list) and Appendix B (timeline) graphics on pp. 4–5 are images with no extractable text, so the search doesn't cover them. |
| cw-memo | L40, L141 | Pause agency Core HCM; exceptions from the OMB and OPM Directors; quote "are expected to pause their own Core HCM procurement, development, and related modernization projects" | supported | p. 2, §II, verbatim. |
| cw-memo | L128 | Military and Intelligence Community excluded at first; "employee system of record," "employee and manager self-service" | supported | p. 1 n. 3; p. 2. |
| cw-memo | L135 | Wave 1 begins FY2026, Wave 2 FY2027, adoption by FY2028 | supported | p. 2 and p. 1. |
| cw-memo | L142 | "Start identifying agency-unique requirements" | supported | p. 6, Appendix C, verbatim. In the source the word is hyphenated across a line break ("agency-\nunique"). |
| cw-pws-scope | L38, L129 | "system of record for approximately 2 million Executive Branch civilian employees"; USPS and IC excluded | supported | PWS §2, p. 18 (PDF = printed). Verbatim. |
| cw-pws-scope | L38 | Absence of contingent, non-employee, worker type and volunteer in Amd 4 | supported | 0 hits for each (whitespace-insensitive). "contractor" has 538 hits, but those refer to the vendor. See the "affiliation" note under Substantive findings. |
| cw-pws-clin | L39, L147 | CLIN 0003 "Licensing and Sustainment for 2 million employees," PEPY; §5.3.1(1) "Provide licenses for all users…all-inclusive" | supported | The CLIN 0003 row is entirely on p. 10; p. 9 holds only CLIN 0002 rows, so "pp. 9–10" should be "p. 10". The §5.3.1(1) quote is on p. 39, verbatim. |
| cw-pws-config | L40, L142 | Agency configuration in scope; "Platform extensions are considered configurations"; "a common federal baseline configuration" | supported | §3.2 is on p. 22. "Platform extensions…" is in the §5.1.1 definitions on p. 28. "common federal baseline configuration" is §5.1.1(11) on p. 27. All verbatim. |
| cw-pws-config | L135 | Intent for all agencies to go live by July 4, 2027 | supported | p. 32, verbatim. The sentence is in the §5.2 Agency Transition narrative above the complexity table, not in the table itself. §3 on p. 22 has a similar sentence: "implemented across the entire federal government by July 4, 2027". |
| cw-pws-affiliate | L135 | Undefined "affiliate type," a targeting attribute in two functional requirements | partly supported | "affiliate type" appears twice: Req 21 (p. 61) and Req 60 (p. 64, survey targeting). That matches "two." But Req 95 (p. 69, LMS) says "for all individuals that are part of the talent development activities regardless of affiliation." That isn't "affiliate type," but it is adjacent wording the page doesn't mention. See Substantive findings. |
| cw-pws-pia | L155 | PIA required as a deliverable; no Federal HR 2.0 or Core HCM SORN in the Federal Register; no Core HCM PIA on OPM's privacy page | supported | The quote is §5.1.1(7), p. 27 (the footnote says §5.1(7)). FR API term searches: "Federal HR 2.0" = 0; "Core HCM" = 0; "Core Human Capital Management" = 1, a July 2, 2026 proposed rule (Strategic Human Capital Management), not a SORN. Six OPM SORN notices since 2025-06 cover routine uses, Central-9, Central-15, Internal-3 and Internal-18; none is for Core HCM. The OPM /privacy/ PIA list has no HCM, Core or Oracle entry. |
| cw-qa1 | L38, L39, L130 | Q218 p. 14 "2 million employee licenses"; Q279 p. 17 user roles | supported | Both are verbatim on PDF p. 14 and PDF p. 17; the Q&A has no printed page numbers. Absence check: set 1 has 0 hits for contingent, non-employee or volunteer. L38 also says "either question-and-answer set," but set 2 isn't cited anywhere. I checked set 2 myself: 0 hits for those words too. |
| cw-opm-award | L38, L131 | "approximately two million US Executive Branch civilian employees"; phased rollout | supported | Verbatim; "implemented through a phased approach". The release title is written "First Ever" with no hyphen. |
| cw-govt1 | L153 | Categories include "Volunteers, grantees, and contract employees on whom the agency maintains records may also be covered by this system" | supported | Verbatim, 77 FR 73694–73699, 12/11/2012. Read via govinfo, because federalregister.gov returned a bot "Request Access" page. The govinfo title uses a colon: "Privacy Act of 1974: Update Existing System of Records". |
| cw-govt1-2023 | L153 | The 2023 notice changed routine uses "s" and "hh," not categories | supported | 88 FR 56058–56059, no. 158. The "unchanged since 2012" claim is only partly verifiable: OPM's SORN list also shows 87 FR 5874 (2/2/2022) for GOVT-1, and FR 2026-09339 (May 12, 2026) added a Do Not Pay routine use to GOVT-1. Both abstracts are routine-use changes only, and I didn't open either one. |
| cw-govt7 | L154 | GOVT-7 covers "all participating agency employees, contractors and their employees, consultants, and volunteers" with routine, long-term access | supported | Verbatim, 80 FR 64416, 10/23/2015 (via govinfo). |
| cw-govt7-2006 | L219 | "Affiliation on the card record" | supported | 71 FR 56983 Categories of Records lists "employee affiliation," and the card carries "employee affiliation… color-coding for employee affiliation." The footnote's parenthetical cites Record Source Categories instead. That text is verbatim ("sponsoring agency," "contract employer"), but it isn't what L219 relies on. The notice title is wrong: the actual title is "Privacy Act of 1974; Proposed Privacy Act System of Records". |
| cw-a108 | L156 | A significant change applies when a change substantially increases access; adding a population "can be one"; §6.j "deemed to be maintained by the agency" | partly supported | §6.j is verbatim (PDF p. 10). The access test is §6.b(7). But §6.b(1) directly names "A substantial increase in the number, type, or category of individuals about whom records are maintained" as a significant change. The page uses the weaker access test and hedges ("can be one"). See Substantive findings. |
| cw-doi-access | L41, L164 | "considered the authoritative data source for DOI contractor personnel…"; HR or COR sponsors enter records; separation report drives role removal; invalid-sponsor report | supported | §1.B, PDF p. 2, verbatim. "entered into DOIAccess by Bureau Sponsors or CORs" is §2.B. The Separation Report "is used by system owners to… remove any personnel who have separated" (p. 9). The Invalid Sponsor Report is on p. 10. |
| cw-doi-access | L164, L169, footnote | "COR data comes from the financial system"; footnote: "the financial system's COR and facility data" | not supported | The PIA only lists FBMS among the "authoritative data sources" (with FPPS, AD and USAccess) and says the system "was modified to streamline data import from FBMS." It never says what data FBMS supplies; COR and facility data aren't mentioned in connection with FBMS. |
| cw-gsa-gcims | L41, L165, L169 | "Contract start and end date" (p. 2); nightly HR download of departing employees (§5.1); "An authoritative source of identities for Active Directory, Google mail, and other GSA systems" (§6.1a); twice-yearly POC reverification | supported | All verbatim. CPO approval date is 1/12/2023 and the PIA expired 1/11/2026, which is worth noting. L165 says "The HR feed covers departing employees only." The PIA says the HR system provides "a nightly download of all departing employees"; "only" is an inference. The contract-number wording is "Task order number, delivery order, or contract base number". |
| cw-nasa-idmax | L166 | Affiliation "such as civil servant or contractor"; "Human Capital Systems are the authoritative sources for civil servants identity data"; retention after the contract relationship expires | supported | All verbatim (PDF pp. 2, 4, 8–9). |
| cw-dhs-idms | L41, L167, L245 | De-provisioning "based on changes in DHS PIV Card status (active, revoked, or suspended)" | partly supported | The quote is verbatim (PDF p. 8; PIA-014(c), October 20, 2015 matches; the URL filename says july2018). But the PIA ties status-based de-provisioning only to PACS (physical access): "This information is passed to DHS Component PACS… de-provisioning… based on changes in DHS PIV Card status". AD receives certificate data for log-on; the PIA doesn't say card status de-provisions directory accounts. L167 "de-provisions directory and physical access" overstates it. |
| cw-usaccess | L168, L244 | "Initial information regarding a PIV applicant is provided through an agency sponsor"; record lasts for a contractor's assignment | supported | §5.1 is verbatim; §4.3 says information comes from Sponsors and Registrars; §1.4 says "could be for the duration of the individual's employment/assignment (for contractors)". The source says "could be"; the page states it flatly. CPO approval date is 1/12/2023. |
| cw-epa-epacs | L173, L244 | "A Human Resource Representative, Contracting Officer's Representative (COR), a Grant Officer, or a Project Officer initiates a request for an USAccess badge" | supported | Verbatim, but it's in the system overview on PDF p. 2, before "Section 1". The form date is 04/08/2026 (Annual Review). A signature field is present and the PDF ModDate is 2026-09-04, which is consistent with "signed September 2026". |
| cw-tigta | L41, L170, L181 | Contractor Management and Contingent Worker modules; "Contingent Worker Module, which contains all individual contractor employee data"; separation "initiated by the COR"; 1,821 (10 percent) "should have been listed as separated…"; some still had network access | supported | All verbatim (Highlights PDF p. 2; Background PDF p. 5; findings PDF p. 7). Of the 63 former contractors who kept ID media, 13 had active network access. |
| cw-dot-oig | L41, L182, L245 | DOT "does not always promptly collect and deactivate contractor employee PIV cards as required"; cause was unclear accountability | supported | Oversight.gov summary is verbatim: "because it has not established clear accountability over this process." ZA2023030, May 24, 2023. |
| cw-dhs-oig-23 | L41, L183 | Did not always terminate PIV access or withdraw clearances "for separated employees and contractors" | supported | Summary is verbatim. OIG-23-04, January 9, 2023. |
| cw-doe-oig | L41, L184, L245 | "39 percent of separated employees' PIV cards or employment statuses had not been updated in USAccess"; across federal and contractor separations | supported | Verbatim. It's on printed p. 2 = PDF p. 3; the memo's printed p. 1 = PDF p. 2. The footnote's "pp. 1–2" is printed pages, which is fine; adding "(printed)" would remove the ambiguity. 2,703 separated Federal and contractor employees were tested. |
| cw-dhs-oig-26 | L41, L185 | "15 percent of identified contractor accounts were not disabled in a timely manner after separation" | supported | Summary is verbatim. OIG-26-28, issued Friday, September 4, 2026. The footnote gives no report title. |
| cw-doe-saviynt | L171 | Identity established from authoritative sources; "is not the authoritative source for the privacy data" | supported | Verbatim (PDF pp. 2, 6). Date 8/4/2022, IM-64. |

#### 2. Mechanical fixes

File: `docs/evaluations/oracle-contingent-worker-contractor-source.md`

1. L388 (cw-pws-clin): `Section B, CLIN 0003 (pp. 9–10:` → `Section B, CLIN 0003 (p. 10:`
2. L389 (cw-pws-config): `and the agency transition table (p. 32:` → `and §5.2, Agency Transition (p. 32:`
3. L390 (cw-pws-affiliate): `(p. 61: "targetable by user role, affiliate type, and record information"; also p. 64)` → `(p. 61: "targetable by user role, affiliate type, and record information"; also Req. 60, p. 64)`
4. L391 (cw-pws-pia): `PWS §5.1(7) (p. 27:` → `PWS §5.1.1(7) (p. 27:`
5. L392 (cw-qa1) and L38: L38 claims "either question-and-answer set," but only set 1 is cited. Add a citation for set 2: `…; and Questions and Answers 2 (posted November 5, 2025; full-text search: no occurrence of "contingent," "non-employee" or "volunteer"), <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/be19b6e56b5e43cdb1ad259d6abfc5f5/download>`. I verified the set 2 absence myself.
6. L393 (cw-opm-award): `"OPM Awards Contract for First-Ever Governmentwide HR Platform"` → `"OPM Awards Contract for First Ever Governmentwide HR Platform"` (optional; this is how the page writes it).
7. L394 (cw-govt1): `"Privacy Act of 1974; Update Existing System of Records"` → `"Privacy Act of 1974: Update Existing System of Records"` (as printed in the FR/govinfo text).
8. L397 (cw-govt7-2006): `"Privacy Act of 1974; Notice of New System of Records" (GSA/GOVT-7), … Record Source Categories (including "sponsoring agency" and "contract employer")` → `"Privacy Act of 1974; Proposed Privacy Act System of Records" (GSA/GOVT-7), … Categories of Records ("employee affiliation") and Record Source Categories (including "sponsoring agency" and "contract employer")`
9. L398 (cw-a108): `§6 (significant changes requiring a revised notice;` → `§6.b (significant changes requiring a revised notice, including (1) "A substantial increase in the number, type, or category of individuals about whom records are maintained";`
10. L399 (cw-doi-access): `sources: HR, the shared PIV service, AD and the financial system's COR and facility data;` → `authoritative data sources: FPPS (HR), USAccess, AD and FBMS (the financial system); records entered by Bureau Sponsors or CORs;`
11. L404 (cw-epa-epacs): `§1 ("A Human Resource Representative` → `system overview, p. 2 ("A Human Resource Representative`
12. L408 (cw-doe-oig): `(pp. 1–2:` → `(printed pp. 1–2, PDF pp. 2–3:`
13. L409 (cw-dhs-oig-26): `OIG-26-28, September 4, 2026, CBP IT access controls (report summary:` → `*CBP's IT Access Control Deficiencies Introduced Critical Risk to IT Systems and Sensitive Information*, OIG-26-28, September 4, 2026 (report summary:`

#### 3. Substantive findings

- **L164 and L169, DOIAccess "COR data comes from the financial system."** The PIA says "DOIAccess synchronizes digital identity and adjudication data from authoritative data sources: DOI Federal Personnel and Payroll System (FPPS), Active Directory (AD), Financial and Business Management System (FBMS), and the United States General Services Administration (GSA) USAccess system." It never says what FBMS supplies. Proposed rewording:
  - L164: "HR or COR sponsors enter records; the financial system (FBMS) is one of its listed authoritative data sources"
  - L169: "The closest: DOIAccess lists the financial system (FBMS) among its authoritative data sources"
- **L167, DHS IDMS "Revocation or suspension de-provisions directory and physical access."** The source says card data "is passed to DHS Component PACS in order to facilitate provisioning… and de-provisioning… based on changes in DHS PIV Card status." For AD it only says certificate information is provided "to enable DHS PIV Card log-in." Proposed rewording: "Revocation or suspension de-provisions physical access (PACS); directory accounts receive the card's certificates for log-on."
- **L156, A-108.** The page frames the trigger as access ("substantially increases access to a system's records") and hedges "adding a population… can be one." A-108 §6.b(1) lists "A substantial increase in the number, type, or category of individuals about whom records are maintained in the system" as a significant change. Its own example is a physicians system expanded to nurses, which is directly analogous to adding contractors to an employee system. Proposed rewording: "Circular A-108 lists a substantial increase in the number, type or category of individuals in a system as a significant change requiring a revised notice;[^cw-a108] adding contractors to an employee system is that kind of change. The privacy office decides."
- **L135, "The only adjacent term is an undefined 'affiliate type'."** Amd 4 Req 95 (p. 69, LMS) requires Talent Development data "for all individuals that are part of the talent development activities regardless of affiliation." That's a second adjacent term the page doesn't mention, and it implies learning records may cover non-employees. Proposed rewording: "The only adjacent terms are an undefined 'affiliate type,' a targeting attribute in two functional requirements, and a learning requirement covering individuals 'regardless of affiliation' (Req. 95).[^cw-pws-affiliate] Nothing ties either to contractors." The footnote would add "Req. 95, p. 69".
- **L41, "The oversight reports show the same weakness in every pattern."** The five reports cover an HR module (IRS), PIV cards and USAccess (DOT, DHS, DOE) and account disablement (CBP). None covers the contractor-management-system pattern (DOIAccess, GCIMS), the governance-tool pattern or the manual-sponsor pattern. Proposed rewording: "The oversight reports show the same weakness across the patterns they cover:"
- **L165, GCIMS "The HR feed covers departing employees only."** The source says "the HR system provides a nightly download of all departing employees." "only" is an inference, though a reasonable one. Proposed rewording: "The HR feed is a nightly download of departing employees."
- **L38 absence claim, memo.** This is a caveat, not an error: the memo's Appendix A and B are images, so a text search can't cover them. Consider "(full-text search of the memo's text)".
- **L153, "unchanged since 2012."** OPM's SORN list shows GOVT-1 modifications in 2022 (87 FR 5874) and FR 2026-09339 (May 12, 2026, a Do Not Pay routine use), besides the 2023 notice. The abstracts describe routine-use changes only, so the claim probably still holds, but the page cites only the 2023 notice. Consider "The 2023 and 2026 notices changed routine uses, not categories."

#### 4. Label check

- L40 and L142: "would be a configuration decision for the program, not the agency alone *(inference)*" and "needs the program's agreement *(inference)*" are labelled. I found no unlabelled restatement as fact in my scope.
- L153: "the agency's call *(inference)*" is labelled. L156 is labelled *(inference)* as a whole.
- L168: the cell "The sponsor ends the assignment" has no citation and no label. The USAccess PIA doesn't say the sponsor ends the assignment. Suggest adding *(inference)*.
- L166: "Contractors by implication (the PIA doesn't say so outright)" is properly hedged.
- L167 (see Substantive findings): "de-provisions directory…" is presented as fact but isn't in the source.

#### 5. Couldn't open

- federalregister.gov document pages for 2012-29777 and 2015-26940 returned HTTP 200, but the body was the "Federal Register :: Request Access" bot page. I read the same documents on govinfo.gov instead (FR-2012-12-11/html/2012-29777.htm and FR-2015-10-23/html/2015-26940.htm). Not blocking.
- oversight.gov summary pages first returned 406 with a bare UA string. A full browser UA and Accept headers returned 200, so all three were read raw.

### Ledger C — contractor page: NIST, FAR, OMB, FICAM, FPDS; the books' contractor PIV sections

Sources fetched raw on 2026-10-30 (all HTTP 200): FIPS 201-3 PDF (nvlpubs), SP 800-79-2 PDF (nvlpubs) + CSRC landing page, OSCAL SP 800-53 rev5 catalog JSON (version 5.2.0, last-modified 2026-10-22), acquisition.gov FAR 4.13 and 52.204-9 (FAC 2026-01, effective 03/13/2026), M-19-17 PDF, idmanagement.gov ILM playbook and Architecture pages, three fpds.gov help pages, USAspending data dictionary API.

FIPS 201-3 page map (printed / PDF): §2.1 = p.7 / PDF 18; §2.9.1 = pp.19–21 / PDF 30–32 (new FASC-N/UUID text on p.21 / PDF 32); §2.9.4 = pp.25–26 / PDF 36–37 (18-hour sentence on p.26 / PDF 37). SP 800-79-2 §2.3 = p.8 / PDF 16.

R = docs/evaluations/oracle-contingent-worker-contractor-source.md

#### 1. Table

| Footnote | Where cited | Claim (short) | Verdict | Discrepancy / note |
|---|---|---|---|---|
| cw-sp80053 | R L195 | AC-2(h) notify "when users are terminated or transferred"; AC-2(l) "Align account management processes with personnel termination and transfer processes" | supported | Both verbatim (OSCAL 5.2.0). Right-hand column quotes "personnel termination process", which isn't the control wording (it's "personnel termination and transfer processes"); see Mechanical fixes. |
| cw-sp80053 | R L196 | PS-7: providers notify of transfers/terminations of external personnel with credentials, badges or privileges, within a set time | supported | PS-7(d): "notify [personnel or roles] of any personnel transfers or terminations of external personnel who possess organizational credentials and/or badges, or who have system privileges within [time period]". |
| cw-sp80053 | R L246 | "PS-7 asks the provider to notify terminations" | supported | — |
| cw-fips201 | R L197 | §2.1 "only after a proper authority has authorized issuance"; §2.9.4 contractor bullet; uncollected card "within 18 hours of notification" | supported | All verbatim. §2.9.4: "If the card cannot be collected, normal termination procedures SHALL be completed within 18 hours of notification." It applies only when the card can't be collected. FIPS doesn't say who notifies or of what. |
| cw-fips201 | R L216 | FASC-N and card UUID change on reissue | supported | §2.9.1: "certificates SHALL be populated with the new FASC-N and card UUID" (p.21). |
| cw-fips201 | R L222 | Adjudication before issuance | supported | §2.1 bullet 2: "issued only after an individual's eligibility has been favorably adjudicated". The footnote's parenthetical doesn't list this bullet, but it's in §2.1, which is cited. |
| cw-fips201 | R L231 | Reissue on a status change | supported | §2.9.1: reissuance "in the event of an employee status or attribute change". |
| cw-fips201 | R L244 | FIPS requires "a proper authority has authorized issuance" | supported | Verbatim. |
| cw-fips201 | R L246 | The 18-hour clock for a card that can't be collected starts "of notification" | partly supported | The fact is right, but the quoted fragment "of notification" is ungrammatical; see Mechanical fixes. The next sentences ("generates the notification…", "The 18 hours then start on the date the engagement ends") are design, covered by the Part 5 lead-in "Each is design guidance". |
| cw-fips201 (def) | R L413 | §2.1, §2.9.1, §2.9.4 quotes; January 2022 | supported | All quotes verbatim; date matches. |
| cw-sp80079 | R L198 | Only the organization decides which employees and contractors need a PIV card; sponsorship and adjudication "cannot be outsourced" | supported | §2.3 p.8: "Only the organization can decide which of its employees and contractors are required to apply for a PIV Card… Therefore, these two functions cannot be outsourced." The two functions are Sponsorship and Adjudication. Note: SP 800-79-2 (July 2015) is still final on CSRC (supersedes 800-79-1, no withdrawal notice), but its text refers to FIPS 201-2. |
| cw-sp80079 | R L234 | "sponsorship stays federal" | supported | The source says "the organization", and here that's the federal agency. |
| cw-far41301 | R L199 | "must designate an official responsible for verifying contractor employee personal identity" | supported | 4.1301(c), verbatim. (d)(1)(iii) "Upon contract completion or termination" is also present. |
| cw-far52049 | R L199, L246 | Return the card "Upon contract completion or termination"; contract completion is a card-return event | supported | 52.204-9 (Jan 2011)(b)(3), verbatim; return is "at the earliest of" the three events. acquisition.gov now shows "Parent topic: 52.204 [Reserved]" (FAR Overhaul), but the clause text is unchanged and the URL works. |
| cw-m1917 | R L42, L200 | Revoke access "when the employee or contractor separates"; "authoritative solutions"; "the lifecycle of identities" | supported | All verbatim (PDF p.3–4). The "shall" is "implement processes to manage access control, including the ability to revoke access privileges, when no longer authorized"; the "separates" phrase is from the next, explanatory sentence. "Requires revocation" is a fair reading. |
| cw-m1917 | R L316 | Agency ICAM governance structure | supported | "Each agency shall designate an integrated agency-wide ICAM office, team, or other governance structure" (p.5). |
| cw-ilm | R L42, L201 | "The HR/personnel system is the sole driver of identity creation and termination." | supported | Verbatim, under "Authoritative Source of Truth:". Version 1.4, 3/31/2026 matches, but the page also shows a stray line "Date: March 2026 - Version: 2.0". |
| cw-ilm | R L42, L201 | Silent on contractors outside HR | supported | Full-text search: no "sponsor", "non-employee" or "nonemployee". The MUR table puts User Type (incl. Contractor) under "Agency HR". |
| cw-arch | R L202 | Identity management: creation with an authoritative source, and deactivation; credential management includes sponsorship | supported | v3.3, June 30, 2023. Creation keywords "Identity Record, Authoritative Source"; Deactivation "Deactivate or remove enterprise identity records"; Sponsorship "Formally establish that a person or entity requires a credential." |
| cw-fpds | R L208, L220, L221 | Current completion date quote; ultimate completion date "whether the options have been exercised or not"; period-of-performance start | supported | Quotes verbatim. Effective_Date.htm is titled "Period of Performance Start Date", not "Effective Date"; see Mechanical fixes. |
| cw-usasp | R L208 | Same two end dates; "The completion date does not change to reflect a closeout date." | supported | Verbatim under PeriodOfPerformanceCurrentEndDate; PotentialEndDate maps to FPDS "Ultimate Completion Date". The current end date is also revised when a modification shortens the contract "(such as termination)", which is consistent with the page. |
| c09-fips201 | b03 Ch09 L72 (item 1) | Issued only after "a proper authority has authorized issuance," | supported | §2.1, verbatim. |
| c09-fips201 | b03 Ch09 L74 (item 3) | 18-hour clock for a card that can't be collected runs from notification | supported | §2.9.4, p.26. The rest of item 3 ("so the 18 hours start on the date the engagement ends") is design, covered by the L70 lead-in. |
| c09-sp80079 | b03 Ch09 L72 | Only the organization can decide which of its contractors must apply, so sponsorship can't be outsourced | supported | §2.3. |
| c09-far52049 | b03 Ch09 L74 | Card returned upon contract completion or termination | supported | (b)(3). |
| c09-sp80053-ps7 | b03 Ch09 L74 | PS-7 asks the provider to notify the agency of terminations within a defined time | supported | PS-7(d). The control says "notify [organization-defined personnel or roles]", not "the agency"; acceptable. |
| c11-nist-80053 | b03 Ch11 L93 (PS-7 row) | PS-7(d) notification requirement and organization-defined time period | supported | Wording matches OSCAL, but the footnote definition (L106) doesn't list PS-7; see Mechanical fixes. |
| (none) | b03 Ch11 L58 | Contractor credential drift row | supported (design) | Metric definition with no external claim; it's consistent with Ch09. |
| c04-fips201 | b07 Ch04 L146 (Issue) | Issuance only once a proper authority has authorized it | supported | §2.1. The footnote (L193) gives no section numbers; see Mechanical fixes. |
| c04-fips201 | b07 Ch04 L149 (End) | 18-hour termination clock for a card that can't be collected | supported | §2.9.4. The bullet list is labelled *(design guidance)*. |
| adm-fips201 | guides/attribute-driven-migration L589 | 18-hour termination clock for a card that can't be collected; §2.9.4 paraphrase in footnote | supported | Footnote L816 paraphrase is accurate. The paragraph is labelled *(design guidance)*. |
| (none) | b03 Ch08 L67 | Contractors have no SF-50 or NOA codes; PIV follows the two events | supported (design) | Labelled *(design guidance)*. |
| (none) | b03 Ch08 L107 | Custom task sends the termination notice on the end date, "so the card's termination clock starts on that date" | partly supported | No label, and it drops the condition that the 18-hour clock applies only to a card that can't be collected; see Label check. |
| (none) | b03 App A L73–84 | Contractor leaver rules; "the 18-hour clock for a card that can't be collected starts on that date" | supported (design) | Labelled *(design guidance)*; the qualifier is present. |
| (none) | b03 Ch12 L51 | Decide the contractor PIV path | supported | Plan item, no factual claim. |

#### 2. Mechanical fixes

1. R L195, right-hand column: `The contractor source is the "personnel termination process" for contractors` → `The contractor source feeds the "personnel termination and transfer processes" for contractors` (or drop the quote marks).
2. R L246: `FIPS 201-3's 18-hour clock for a card that can't be collected starts "of notification."[^cw-fips201]` → `If a card can't be collected, FIPS 201-3 requires termination "within 18 hours of notification."[^cw-fips201]`
3. b03-hr-identity/11-drift-metrics-and-evidence.md L106 (c11-nist-80053): `controls AC-2, AC-2(1), AU-6, AU-11, CA-7, IA-4, IA-4(4), PS-4, PS-5 and SI-12` → `controls AC-2, AC-2(1), AU-6, AU-11, CA-7, IA-4, IA-4(4), PS-4, PS-5, PS-7 and SI-12`. Optionally refresh the release note too: the OSCAL catalog is still version 5.2.0, but its metadata last-modified is now 2026-10-22.
4. b07-pki/04-the-target-pki.md L193 (c04-fips201): after `January 2022,` insert `§2.1 (issuance only after a proper authority has authorized it) and §2.9.4 (termination within 18 hours of notification if the card can't be collected),`. Optionally change the access date to Oct 29, 2026 once it's re-checked.
5. R L420 (cw-fpds): `"Effective Date" (period of performance start)` → `"Period of Performance Start Date"` (that's the page title at Effective_Date.htm).
6. Optional, b03 Ch09 L189 (c09-sp80053-ps7): `notify the organization` → `notify organization-defined personnel or roles`.

#### 3. Substantive findings

- **FIPS 201-3 §2.9.4, the contractor trigger.** The only contractor bullet is "A contractor changes positions and no longer needs access to federal buildings or systems." No bullet names contract end or a contractor leaving the company. Opening sentence: "A PIV Card is terminated when the department or agency that issued the card determines that the cardholder is no longer eligible". The page says termination applies when a contractor "changes positions and no longer needs access", which is accurate. Anywhere the books imply FIPS names contract end as a termination event would overstate it; none found. FAR 52.204-9(b) is the source for contract completion, and the page cites it correctly.
- **FIPS 201-3 §2.9.4, the 18-hour clock.** It covers only a card that can't be collected ("If the card cannot be collected, normal termination procedures SHALL be completed within 18 hours of notification"). FIPS doesn't define who gives notice or what it is. "The pipeline's end-date notice starts the clock" is therefore design, not a FIPS requirement. Every location except Ch08 L107 keeps the "can't be collected" qualifier and a design label or lead-in.
- **SP 800-79-2 §2.3.** "cannot be outsourced" is verbatim ("these two functions cannot be outsourced"). The two functions are Sponsorship and Adjudication, and every location represents that correctly. Caveat: the publication was written against FIPS 201-2 and has not been revised for 201-3.
- **M-19-17.** The binding sentence is about revoking "when no longer authorized"; "when the employee or contractor separates" is the explanatory sentence after it. Optional rewording for R L200: `Implement processes to revoke access "when no longer authorized," to prevent access "when the employee or contractor separates"`.
- No claim was found that its source doesn't support.

#### 4. Label check

- b03 Ch08 L107: "For contractors the same custom task also sends the PIV office its termination notice on the end date, so the card's termination clock starts on that date" is design, but it's unlabelled and drops the "can't be collected" condition. Proposed: `… so, for a card that can't be collected, the 18-hour termination clock starts on that date *(design guidance)* ([Chapter 09](…))`.
- b03 Ch09 L70 uses the lead-in "they are the program's design, built on the requirements cited" rather than the *(design guidance)* tag. Its meaning is equivalent; add `*(design guidance)*` there if the books enforce the tag convention.
- R L246 "The 18 hours then start on the date the engagement ends": covered by the Part 5 lead-in (L242, "Each is design guidance"). OK.
- R L208: labelled *(inference; design guidance)*, and the "ceiling" idea isn't stated as plain fact elsewhere. OK.

#### 5. Couldn't open

None. All URLs returned HTTP 200 on a raw fetch.

### Ledger D — HR 2.0 page: governance and OPM sources, and the page-wide label check

Checked October 30, 2026. All sources fetched raw with curl; PDFs extracted with pypdf 6.18.1.
Page numbers: for the solicitation (Amd 4, 159 pp.), the memo, the APG, and the charter, the printed page number matches the PDF page. For the CHCO report, they differ (PDF p. 13 = printed p. 8; PDF p. 10 = printed p. 5), and the footnote correctly says "PDF p."
SAM.gov file identity was confirmed from the Content-Disposition headers:
- 88d26ce7… = "Solicitation 24322626R0007 Amd 4 - Federal HRIT Modernization.pdf" (PDF created 2025-12-11)
- fbde5477… = "Questions and Answers - Solicitation No 24322626R0007.pdf"
- be19b6e5… = "Questions and Answers 2 - Solicitation No 24322626R0007.pdf"

#### 1. Table

| Footnote | Where cited | Claim (short) | Verdict | Discrepancy / note |
|---|---|---|---|---|
| hb-memo | L28, L50, L51 | Advisory Board "comprising key stakeholder agencies" (p. 3). "assist with governance and change management." App. C: Policy, Data, Learning and Super User WGs "meet regularly to address agency readiness, migration, and testing coordination" (p. 6) | supported | Quotes are verbatim. Dec 10, 2025 matches. p. 3 and p. 6 are correct (printed = PDF). |
| hb-pws-gov | L28, L52–L55 | §2.1 governance: exec sponsorship, Steering Committee "senior leaders", CAB members "represent their agency", CAB "formal open communication from the program to agency customers", Data WG "within and across federal agencies"; OPM chairs SC and CAB, which meet at least monthly | partly supported | Everything checks out, but the role descriptions are in an **image** on p. 18 (verified visually), and the chair and monthly text is on p. 19. The full CAB sentence is "The members must be positioned to represent their agency **on behalf of the program**." The truncated quote at L28 and L54 reads as agency representation, but the source frames members as the program's channel. See Substantive. Exec sponsorship (p. 19): "final decision-making authority on critical priorities and major system configurations, customizations, and/or enhancements". L52 is a fair paraphrase. |
| hb-pws-cust | L29, L53 | SC approves customizations; "enforce configuration patterns and reusable templates across all agencies" | supported | Verbatim, on p. 41. The §5.6 heading is on p. 40 and its text is on p. 41. Optional fix: "pp. 40–41". |
| hb-pws-appb | L29, L53 | SC approves agency-specific integrations (App. B p. 88) | supported | p. 88: "The Core HCM Steering Committee will review and approve any agency-specific integrations requirements necessary for implementation." |
| hb-pws-base | L29 | "a common federal baseline configuration"; one OPM-approved version for all tenants | supported | p. 27 is §5.1.1(11), and the quote is verbatim. **The p. 51 text is §6.9.4(3)**, "Uniform software baseline and release governance": "must run the same current, OPM-approved baseline version". The footnote's "and p. 51" reads as if it were still §5.1. See Mechanical. |
| hb-pws-gpmo | L29, L56 | GPMO; OPM "primary integrator" for agencies, incl. identity mgmt, SSO, integration, data migration; data readiness jointly with agency (p. 36) | supported (minor conflation) | §5.2 starts on p. 31, and the text is on pp. 31–32. Source: the GPMO "will serve as the primary integrator responsible for working directly with the agencies". Identity management and data migration are listed among the "technical resources from the OPM CIO" inside the GPMO. p. 36 (§5.2.3): "OPM GPMO and Agency/Department — Jointly manage data readiness". OK. |
| hb-pws-gw | L40, L145 | p. 26: FedRAMP Moderate or higher, single OPM ATO. App. B pp. 82–83: persistent integrations through OPM-hosted APIM with OAuth 2.0, rate limiting, IP filtering | supported (scope caveat) | p. 26 §5.1.1(1),(5): "OPM's ATO covers any agency's use of the platform." p. 82: "integrate all persistent system connections with the … OPM-hosted API Management (APIM) solution … for all OPM-owned and managed governmentwide Core HCM platform integrations"; "Enforce authentication (OAuth2.0), rate limiting, and IP filtering." p. 83 covers exceptions approved by the CO and COR. The requirement is scoped to OPM-owned and managed integrations. Whether an agency's own identity feed falls under it is not stated, and the page's own Question 3 (L195) admits this. See Label check for L145. |
| hb-qa1 | L66 | Q85: HR QSMO has change control of HR data model. Q127: one centrally governed baseline | supported | Q85: "The HR QSMO will be responsible for change control of the Employee/HR data model." Q127: "The Government intends to maintain one centrally governed baseline…" |
| hb-qa2 | L67 | "No change control board. The answers say none is defined." | **not supported (overstated)** | Q360 asks about change-control *cadence* and the appeal path. The answer: "There is no pre-established change control board cadence or appeal path defined in the contract." It does not say no CCB exists or is defined. See Substantive. |
| hb-chcoc-report | L50, L64 | Advisory board of CHCOs and federal CIOs for HR IT modernization (PDF p. 13); one new WG in 2025, different topic (PDF p. 10) | supported | PDF p. 13 (printed 8): "a collaborative governance framework for HR IT Modernization which includes an Advisory Board comprised of CHCOs and federal Chief Information Officers." PDF p. 10 (printed 5): "One new working group was established in 2025". It is the Combined Federal Campaign WG. The PDF page labels are correct. |
| hb-chcoc-charter | L64 | Charter lets it form WGs and share promising practices (pp. 2–3), effective Dec 14, 2021 | supported | p. 2: "Identify and share promising practices…". p. 3: "Additional Standing Committees and/or Working Groups". Date matches. |
| hb-hsa | L64 | §1303(b), 116 Stat. 2289: advise and coordinate agencies' activities incl. modernization of HR systems | supported | 116 Stat. 2289 (PDF p. 155): "shall meet periodically to advise and coordinate the activities of the agencies of its members on such matters as modernization of human resources systems…". **The codification is wrong.** §1303 carries the margin note "5 USC 1401 note". 5 U.S.C. 1401–1402 are the agency-CHCO provisions from §1302. See Mechanical. |
| hb-apg | L60 | APG 3 p. 8 stakeholders: "Interagency executive investment and advisory board", CHCO Council, HRLOB, HR QSMO; March 2026 | supported | Verbatim, on p. 8 (printed = PDF). The source says "Members of the Chief Human Capital Officers Council", which L60 shortens to "the CHCO Council". Acceptable. |
| hb-hrlob | L65 | HR LOB human capital standards are those the solicitation requires | supported | The page lists HCBRM, HC-FIBF and HCIM. The solicitation requires HCBRM 4.0 functions (§2.1, p. 19) and HCIM (§5.1.1(11), p. 27). The link to the solicitation needs a PWS cite. See Substantive (minor). "Its pages don't mention Core HCM": the body text doesn't. "Core HCM" appears only as a site-navigation menu link on both HR LOB pages. |
| hb-hrlob-maesc | L65 | "multi-agency executive steering committee sets up communities of practice" | partly supported | **Name is wrong.** The page says "The Multi-Agency Executive **Strategy** Committee (MAESC)". It "acts as a collective voice representing the Federal agencies including establishing communities of practice". The footnote at L245 has the same error. See Mechanical. |
| hb-fibf | L65 | FIBF HR/HCM standards | supported | The page title is "Human Capital Management (HCM) \| Enterprise Shared Services". It lists HC-FIBF, HCBRM and HCIM as HRLOB/MAESC products. The footnote title "Human Resources / Human Capital Management" doesn't match the live title (minor). |
| hb-qsmo | L66 | HR QSMO continues, with "customer engagement and feedback model" | supported | Live page: "Institute a customer engagement and feedback model that allows for continuous improvement and performance management of solutions." Verbatim. |
| hb-m1916 | L66 | M-19-16 (Apr 26, 2019) is the basis of the QSMO | supported | Title and date match. M-19-16 sets up the QSMO framework and doesn't name OPM. The OPM QSMO page says M-19-16 established the QSMOs. |
| hb-opm-core | L71 | Core HCM page describes no onboarding playbook, liaison model or community | supported | Full-text search of the page body for playbook, liaison, communit and onboard: no hits. The body has three paragraphs plus links. |
| hb-opm-award | L71 | Award release describes no playbook, liaison, community | supported | Searched for the same terms: no hits. The release says only that "OPM will work closely with agencies and stakeholders throughout implementation…". It calls the platform "FedRAMP-certified" and names no package. |
| hb-touch-jun | L72 | June 2026 Q&A sends Core HCM questions to the Wave 1 agency POC or the program mailbox | supported | The article URL returns **403 (Cloudflare challenge)** to curl. I read the body raw via the Zendesk API (`/api/v2/help_center/en-us/articles/53223497231891.json`), not a summarizing tool. Text: "If you are part of Wave 1, reach out to your Core HCM POC / If you are part of Wave 2, reach out to CoreHCM@opm.gov". The touchpoints are March, June and September 2026, so "quarterly" holds. Note: a **September 2026** Touchpoint (posted 2026-10-01) exists. Its only Core HCM content is "reach out to CoreHCM@opm.gov" and one slide line, "Integrating eOPF with Core HCM". Nothing changes. |
| hb-touch-deck | L73 | June 24, 2026 slide, draft and pre-decisional, mentions "governance and working group formation" | supported | It is slide 7 (PDF p. 7): "Core HCM program foundations developed through agency and partner engagement, governance and working group formation, and preparation of materials for agency readiness". It appears as a **past** milestone on a timeline. The full marking is "DRAFT – PRE-DECISIONAL & DELIBERATIVE - FOIA EXEMPT – DO NOT DISTRIBUTE". The footnote gives no slide number. |
| hb-touch-mar | L74 | March 25, 2026 slide 5: guiding principles incl. single ATO, agencies don't need their own | supported | Slide 5 (PDF p. 5): "Compliancy and security with single ATO (Agencies do not require their own ATO)". It has the same full draft marking. The non-draft PWS p. 26 says the same thing ("OPM's ATO covers any agency's use of the platform"), so the claim needn't rest on a draft slide. |

#### 2. Mechanical fixes (file: hr2.md as extracted; same lines in the source page)

1. **L242 (hb-hsa):** `codified at 5 U.S.C. 1401–1402` → `codified at 5 U.S.C. 1401 note`
2. **L65:** `Its multi-agency executive steering committee sets up communities of practice,` → `Its Multi-Agency Executive Strategy Committee (MAESC) establishes communities of practice,`
3. **L245 (hb-hrlob-maesc):** `(the multi-agency executive steering committee; communities of practice)` → `(the Multi-Agency Executive Strategy Committee; "establishing communities of practice")`
4. **L235 (hb-pws-base):** `PWS §5.1 (p. 27: "a common federal baseline configuration") and p. 51 (one OPM-approved version for all tenants)` → `PWS §5.1.1(11) (p. 27: "a common federal baseline configuration") and §6.9.4(3) (p. 51: all production tenants "must run the same current, OPM-approved baseline version")`
5. **L233 (hb-pws-cust), optional:** `PWS §5.6 (p. 41:` → `PWS §5.6 (pp. 40–41:`
6. **L232 (hb-pws-gov), optional precision:** `(pp. 18–19: executive sponsorship, …` → `(pp. 18–19; the role descriptions are in the governance-structure graphic on p. 18: executive sponsorship, …`
7. **L252 (hb-touch-deck):** `June 24, 2026 (marked "DRAFT – PRE-DECISIONAL," publicly posted; Core HCM update, including governance and working group formation)` → `June 24, 2026, slide 7 (marked "DRAFT – PRE-DECISIONAL & DELIBERATIVE – FOIA EXEMPT – DO NOT DISTRIBUTE," publicly posted; Core HCM timeline, including "governance and working group formation")`
8. **L246 (hb-fibf), optional:** `"Human Resources / Human Capital Management" standards` → `"Human Capital Management (HCM)" standards page`
9. **L60, optional:** `with the CHCO Council,` → `with members of the CHCO Council,`

#### 3. Substantive findings

1. **L67, the "No change control board" claim (hb-qa2) is overstated.**
   - Source (Q&A set 2, Q360): "There is no pre-established change control board cadence or appeal path defined in the contract. Such matters … will be addressed by the Contracting Officer at the Task Order level".
   - Proposed: `- **No set change-control cadence.** The answers say no change control board cadence or appeal path is pre-established in the contract; schedule- or cost-affecting changes go to the Contracting Officer at the task-order level.[^hb-qa2]`
   - Update footnote L239 to: `(Q360: "no pre-established change control board cadence or appeal path defined in the contract")`.
2. **L28 and L54, the CAB quote is truncated in a way that shifts its meaning (hb-pws-gov).**
   - The full source text (graphic, p. 18): "A forum to provide formal open communication from the program to agency customers … The members must be positioned to represent their agency on behalf of the program."
   - L28 uses "represent their agency" as evidence that agencies have seats. The source frames the CAB as a one-way channel from the program, with members acting on the program's behalf. That actually supports the bullet's headline ("every forum is OPM's") better.
   - Proposed L28: `…a Customer Advisory Board whose members "represent their agency on behalf of the program,"…`
   - Proposed L54: `Members "positioned to represent their agency on behalf of the program"`.
3. **L56 and L29, the GPMO "primary integrator … including identity management" is a slight conflation.**
   - "Primary integrator" describes the GPMO working directly with agencies. Identity management is listed among the OCIO technical resources inside the GPMO.
   - Acceptable as is. For precision: `OPM's program office, staffed with OCIO resources for integration, identity management and data migration, is the "primary integrator" for agencies.`
4. **L65, the HR LOB standards claim lacks a solicitation cite.**
   - The claim cites only [^hb-hrlob][^hb-fibf], which show the standards but not that the solicitation requires them.
   - Add [^hb-pws-base] (p. 27 names HCIM) and note §2.1 p. 19 (HCBRM 4.0).

#### 4. Label check (whole page)

1. **L28, unlabeled absence and inference claim:** "No public forum lets agencies share configurations or integrations with each other directly, and none of these bodies publishes its output."
   - No source states this.
   - It is also in tension with the Data working group's remit, "develop and oversee implementation of data migration and integration strategy within and across federal agencies" (PWS p. 18 graphic).
   - Fix: add *(inference)*, or reword to "No source found describes a forum where agencies share configurations or integrations directly, or a published output from any of these bodies." Then add it to "What couldn't be verified."
2. **L145, the table's effect column states inference as fact:** "The feed's path and credentials are OPM's to set."
   - The APIM requirement (p. 82) covers "OPM-owned and managed governmentwide Core HCM platform integrations".
   - The page's own Question 3 (L195) asks whether the agency feed even passes through the gateway.
   - Fix: `If the feed runs through the OPM gateway, its path and credentials are OPM's to set *(inference)*`. Also label the whole "Effect on the HR-to-identity feed" column, for example in the caption at L150: `{…} — effects are *(inference)*`. L144, L146 and L148 are likewise derived, not sourced. L148 ("An agreement between the agency and the program for the feed") is design guidance.
3. **L35 and L140, interpretation as fact:** "The rules document data leaving the scope; they don't stop it." and "They don't forbid it."
   - These are reasonable readings of MAS. No rule text says it, though, and it's an absence claim.
   - Fix: label *(inference)*, or say "No 2026 rule prohibits…" after a full-text search. That search is the MAS/CDS checker's job, not mine.
4. **L40:** The "program's API gateway requirement" is listed as a limit on HR data reaching the agency. It has the same scope problem as item 2.
5. **L42 heading:** "Oracle's government cloud is `.com`, not `.us`." is stated flatly, but L208 lists "Any statement that no Oracle government service uses `.us`" as unverified.
   - Fix: `**Oracle's government cloud infrastructure uses `.com` hosts; no `.us` host was found.**`
6. **L41 heading, "a must for the agency":** This rests on CMVP's "if cryptography is required, then it must be validated", so it is sourced. The conclusion that FedRAMP's SHOULD "is weaker than the agency's own obligation" is labeled *(inference)* at L168. Acceptable; no change needed.
7. **L29, L78–81, L113, L136, L168, L184–189:** Correctly labeled.
8. **L79:** The claim that the solicitation shows an "Identity Management Solution" fed by Core HCM in its sample interconnection is not in the PWS text layer. The only text hit is §5.1.1(3), "OPM approved identity management solution using OPM MS Entra-based solution". If the claim is true, it is in a graphic. That's outside my footnotes and was not verified here; whoever checks the implementation guide should confirm it.

#### 5. Couldn't open

| URL | Status | Workaround |
|---|---|---|
| https://eopfhelpdesk.opm.gov/hc/en-us/articles/53223497231891-Agency-Touchpoint-Q-A-June-2026 | HTTP 403 (Cloudflare "Just a moment…" challenge) | Read raw via the Zendesk API: `https://eopfhelpdesk.opm.gov/api/v2/help_center/en-us/articles/53223497231891.json` (200). The quote is confirmed verbatim. |

Every other assigned source returned 200.

### Ledger E — HR 2.0 page: FedRAMP, Oracle Cloud, cryptography, domains

Checked 2026-10-30. Sources were fetched raw with curl . Line numbers refer to hr2.md.

Rules source: `https://raw.githubusercontent.com/FedRAMP/rules/main/fedramp-consolidated-rules.json`. Its `info.version` is **2026.10.13.01** and `last_updated` is 2026-10-13. The latest commit is a89d784 (2026-10-13), and no later commit exists, so the version claim is confirmed.

Marketplace: `products.json` returned HTTP 200 with Last-Modified Fri, 30 Oct 2026 05:04:47 GMT and `meta.last_change` 2026-10-30T05:02:29.728Z. That is the same day the page was written, and every value the page reports still matches. The source has not changed.

#### 1. Table

| Footnote | Where cited | Claim (short) | Verdict | Discrepancy / note |
|---|---|---|---|---|
| hb-cds | L30 | Every certified provider, Rev5 included, must publish a service list "complete enough…" | partly supported | The quote is verbatim (CDS-CSO-SVC). The CDS-CSO subset applies to Classes B, C and D only, not Class A, so "every certified provider" overstates slightly. |
| hb-cds | L32 | The scope documentation stays in the package and is shared via a trust center with "all necessary parties" | supported | CDS-CSO-UTC: "MUST use a FedRAMP-compatible trust center to store and share FedRAMP Certification Data with all necessary parties." |
| hb-cds | L33 | FedRAMP treats that material as "the provider's intellectual property and is not federal information." | partly supported | The source says "the information **usually** remains the provider's intellectual property and is not federal information" (CDS purpose statement). L33 drops "usually". L97 quotes it correctly. |
| hb-cds | L91 | Public tier: the two MUST quotes (CDS-CSO-PUB, CDS-CSO-SVC) | supported | Both are verbatim in the rules JSON and on the web page. |
| hb-cds | L92 | Must use a FedRAMP-compatible trust center | supported | CDS-CSO-UTC. |
| hb-cds | L93 | On request: SHOULD supply access; a denial reported within 5 business days | partly supported | CDS-UTC-AGA (SHOULD) and CDS-UTC-AAD (5 business days) are verbatim. The UTC subset description, however, says these rules "DO NOT apply to providers using USDA Connect." A Rev5 provider still on USDA Connect, possibly Oracle today, is outside the UTC subset. |
| hb-cds | L97 (×3) | "that would likely enable a threat actor to gain unauthorized access"; "usually remains…"; "Providers MAY responsibly share some or all of the information in a FedRAMP Certification Package publicly." | supported | All three are verbatim (CDS-CSO-RIS, the purpose statement and CDS-CSO-RPS). The RPS quote is truncated before "or with other parties if the provider determines doing so will NOT likely have an adverse effect…". That is acceptable but drops the condition. |
| hb-cds-dates | L31, L107 | Rev5: obtain 2027-01-01, maintain 2027-08-01, grace ends 2028-02-01 (a fixed date) | supported | Matches the JSON `rev5.effective.date` (grace default 2028-02-01, until_next_assessment false) and the web page. |
| hb-defs | L32 | "All necessary parties" needn't include a potential agency customer | supported | Definition: "should also be included in most cases but this is not a mandatory requirement…" |
| hb-defs | L92 | The trust-center tier quote and the scope-documentation statement | supported | Verbatim. |
| hb-defs | L140 | "Any information resource that is not entirely included in the Minimum Assessment Scope," | supported | Verbatim. The source continues "…for the cloud service offering obtaining FedRAMP Certification." |
| hb-mas | L35 (×2) | The provider documents flows and third-party resources; material outside the offering is "not FedRAMP Certified." | supported | MAS-CSO-FLO and MAS-CSO-TPR. MAS-CSO-SUP: "these resources will not be FedRAMP Certified". The fragment is a verbatim substring. Note that SUP concerns supplementary *materials in a package supplement*, not data flows. |
| hb-mas | L92 | The scope is "documented by the cloud service provider in their FedRAMP Certification Package" | supported | Verbatim (MAS-CSO-IIR, third note). |
| hb-mas | L140 (×2) | Flows, security categories and third-party resources must be identified and explained; "will not be FedRAMP Certified" | supported | MAS-CSO-FLO ("clearly identify, document, and explain") and MAS-CSO-SUP. |
| hb-mas-dates | L108, L113 | Rev5 obtain and maintain 2027-01-01; grace ends at the first assessment "started after 2027-01-01" | supported | The web page reads "On the first FedRAMP independent assessment started after 2027-01-01". The JSON has grace default 2027-01-01 with until_next_assessment true. |
| hb-rules | L109 | CMU Rev5: 2027-01-01, 2027-01-01, grace ends 2027-06-01 | supported | JSON CMU `rev5`: obtain 2027-01-01, maintain 2027-01-01, grace 2027-06-01 (fixed). The web page matches. |
| hb-rules | L161 | SC-13 guidance: "Follow the FedRAMP Cryptographic Module Use rules" | supported | JSON `CTL.SC.SC-13.guidance[0]` = "Follow the FedRAMP Cryptographic Module Use rules." |
| hb-ntc13 | L113 | Rev5 adopts during the first assessment "that is completed after January 1, 2027" | supported | Verbatim, NTC-0013, published 16 Jun 2026. |
| hb-ntc13 | L113 | "The notice gives no end date for Rev5 itself, only that it 'is likely to be no later than 2029.'" | partly supported | The quote is verbatim, but the notice does give a date for **new** Rev5: "The current end date for new FedRAMP Rev5 Certifications is targeted at June 11, 2027" (also "will stop accepting new FedRAMP Rev5 Certification requests on June 11, 2027"). Only the end date for existing Rev5 is unfinalized. |
| hb-mkt | L34, L117–130 | F1603257882: Certified/ongoing, Class C, Moderate, Agency path, certified 2020-01-13, 10 authorizations (9 reuses), OPM not named, GCC, SaaS, trust_center null, certified_services [], third_party_information_resources null, secure_configuration_guidance null | supported | Every field matches the live JSON. The named agencies are DISA, DOE, FDIC, Fermilab, IHS, NCUA, NRC, SRNL and USPTO, with Southwestern Power Administration as partnering agency. "OPM" and "Office of Personnel Management" appear in no Oracle record. |
| hb-mkt | L34, L132 | None of Oracle's 8 listings has a trust center; 117 of 778 listings across the Marketplace do; Oracle's High listing is OCI-Government Cloud (PaaS/IaaS) | supported | 8 Oracle listings, all trust_center null. 778 products, 117 with a non-null trust_center. FR1900048743 is High, PaaS/IaaS. One of the 8 (Primavera, FR2534673267) is "Agency Authorization In Process", not certified. "Listings" is still accurate. |
| hb-mkt | L133 | The description names complementary services as separate offerings | supported | "Other cloud services can be leveraged to complement Oracle Fusion Applications including Oracle Cloud EPM…, Oracle Integration Cloud and other PaaS (platform) services (Oracle Cloud Infrastructure-Government Cloud)." |
| hb-ora-award | L34 | Calls the platform "FedRAMP-authorized" without naming a package | supported | "an AI-powered, secure, FedRAMP-authorized HR platform" is verbatim. The release contains no package ID. Its headline uses "U.S. Office…", not "US Office…" (footnote title). |
| hb-ora-compliance | L134 | The FedRAMP entry points to the Marketplace; attestations via "your Oracle sales representative" | supported | The FedRAMP text links https://marketplace.fedramp.gov/. The source sentence is "…by contacting their Oracle sales representative". The footnote quote is verbatim, but L134's "your Oracle sales representative" is not: the source says "their". |
| hb-agency-use | L36, L144 | "An agency should never create a standalone authorization to operate for a cloud service offering"; integrate securely, including identity | supported | Verbatim. "Configure and integrate the service securely, including identity, logging, monitoring, data protection…" |
| hb-m2415 | L37, L146 | FedRAMP "does not replace other legal, Executive Order, regulatory, or OMB-issued compliance requirements" | supported | Verbatim, in footnote 7 to §IV, PDF and printed p. 6. |
| hb-m2415 | L152 | "presume the security assessment documented in the authorization package is adequate for their use"; "as long as a FedRAMP authorization is actively maintained" | supported | §IV.a. The first quote is on p. 6 and the second on p. 7, both verbatim. |
| hb-m2415 | L152 | Places the duty to make artifacts accessible on GSA and agencies, not on providers | partly supported | §VII.a(7) is a GSA duty: "establish a secure, transparent, and automated process for enabling agency officials' access to artifacts in the FedRAMP repository". It is on **p. 15** (PDF and printed), not p. 16. The agencies' duties (§VII, p. 18) are to supply the ATO letter and to "Ensure authorization artifacts meet FedRAMP requirements and are of sufficient quality for reuse". That is not a duty to make artifacts accessible. "Not on providers" is an absence reading. |
| hb-usc3609 | L99 | 3609(a)(4): "promote transparency for agencies and users as to which services are included in the scope of a FedRAMP authorization" | supported | Verbatim. |
| hb-usc3609 | L210 | The note repeals §§3607–3616 five years after Dec 23, 2022 | partly supported | The 3609 page's note says "the repeal of **this section** is effective on the date that is 5 years after Dec. 23, 2022" (§5921(d)(1)). The cited page covers 3609 only. The claim about 3607–3616 needs the 3607 note. |
| hb-cui | L38, L147 | 2002.14(g) "no less than the moderate confidentiality impact level"; 2002.16(a) written agreements "whenever feasible" | supported | Opened via the eCFR renderer API because the www page redirected to unblock.federalregister.gov. 2002.14(g) is verbatim. "Whenever feasible" appears in 2002.16(a)(6)(i), and also in 2002.4. |
| hb-sp80047 | L39, L148 | "before, during, and after the exchange" | supported | Verbatim on the CSRC abstract. Published July 2021. |
| hb-cmu | L41, L158–160 | Class C "SHOULD use…active validations"; only D MUST; CMD MUST for B–D; CAT SHOULD | supported | L158's quote is verbatim (CMU-CSO-UVM c). CMU-CSO-CMD's "including whether these modules are validated under the NIST Cryptographic Module Validation Program" is verbatim. CMU-CSO-CAT is SHOULD. The subset applies to B, C and D. |
| hb-sp80053 | L162 | SC-13: types of cryptography are organization-defined; standards include FIPS-validated | supported | Checked against the NIST OSCAL catalog (usnistgov/oscal-content). The CSRC landing page in the footnote has no control text. SC-13b: "Implement the following types of cryptography required for each specified cryptographic use". The discussion reads "Generally applicable cryptographic standards include FIPS-validated cryptography and NSA-approved cryptography." |
| hb-cmvp | L41, L163 | "if cryptography is required, then it must be validated"; "applicable to all U.S. Federal agencies" | supported | Both are verbatim on the CMVP page. |
| hb-cmvp-transition | L41, L164, L168 | Moved to historical after Sept 21, 2026; usable "for existing systems only"; the table says Sept 22 | partly supported | The transition page says "until September 21, 2026, when the FIPS 140-2 validations will be moved to the historical list", and its table gives "September 22, 2026 All FIPS 140-2 certificates are placed on the Historical List". Its wording is "CMVP supports the purchase and use of these modules for existing systems". **"for existing systems only" is not on the transition page.** It is on the CMVP main page (hb-cmvp): "allowing agencies to continue using these modules for existing systems only." |
| hb-oci-gov | L42, L174, L182 | `console.us-langley-1.oraclegovcloud.com`, `identity.us-langley-1.oraclegovcloud.com`; no .us/.mil host | supported | Both hosts are present, along with us-luke-1. A regex scan of the raw HTML found no hostname ending in .us or .mil. The page title is "Oracle US Government Cloud", not "FedRAMP Authorized Services" (footnote title). |
| hb-oci-dod | L42, L175, L182 | `console.us-gov-ashburn-1.oraclegovcloud.com`; regions ashburn, chicago and phoenix; no .us/.mil | supported | All present. The .us/.mil scan found none. |
| hb-oci-info | L182 | "bring your own identity provider that meets your agency's compliance requirements and supports … (CAC/PIV)" | supported | Verbatim; the source continues "…authentication". The FIPS-mode statement in the footnote is also present. |
| hb-ora-url | L42, L176, L207 | Oracle doesn't publish the Fusion restricted-region pattern; "for commercial regions only. In restricted regions … the patterns are different"; Fusion `systemName.fa.<dc>.oraclecloud.com` | partly supported | The quote is verbatim, but it is from the **EPM Cloud** Sample URLs page and concerns EPM/EDM URLs (`…epm.REGION.ocs.oraclecloud.com`), not Fusion Applications. The OIC page gives `https://systemName.fa.dcsn.oraclecloud.com/...` ("dcsn", not "dc") and says nothing about restricted regions. Neither page states anything about the Fusion restricted-region pattern, so L207's "Oracle says only that restricted-region patterns differ" misattributes the EPM statement to Fusion. |
| hb-ms-deploy | L42, L177–178 | GCC uses the worldwide endpoints; GCC High `graph.microsoft.us` and `login.microsoftonline.us`; DoD `dod-graph.microsoft.us` | supported | All verbatim on the page. The page assigns `login.microsoftonline.us` to "Azure US Government" generally, which also covers GCC High. |

#### 2. Mechanical fixes

File: `hr2.md`, which corresponds to the research page on the unmerged branch.

1. **L33**: `FedRAMP treats that material as "the provider's intellectual property and is not federal information."` → `FedRAMP says that material "usually remains the provider's intellectual property and is not federal information."`
2. **L134**: `attestations come through "your Oracle sales representative."` → `attestations come through "their Oracle sales representative."`. Alternatively, keep it unquoted: `attestations come through the customer's Oracle sales representative.`
3. **L164** (table) and **L272** (footnote hb-cmvp-transition): the quote "for existing systems only" comes from the CMVP main page. Either change L164 to `usable "for existing systems only"[^hb-cmvp]`, or keep [^hb-cmvp-transition] and change the wording to `still supported "for existing systems"`. Then change L272 `usable for existing systems only` → `CMVP "supports the purchase and use of these modules for existing systems"`.
4. **L265** (hb-m2415): `§VII.a(7) (p. 16: GSA to enable agency officials' access to artifacts)` → `§VII.a(7) (p. 15: GSA to enable agency officials' access to artifacts)`. PDF page and printed page are both 15.
5. **L273** (hb-oci-gov): `"FedRAMP Authorized Services" for US Government Cloud` → `"Oracle US Government Cloud"`. That is the page title at govfedramp.htm; no "FedRAMP Authorized Services" heading is present.
6. **L176** and **L276**: `systemName.fa.<dc>.oraclecloud.com` → `systemName.fa.<dcsn>.oraclecloud.com` (Oracle's placeholder is "dcsn"). Optional.
7. **L262** (hb-ora-award): `"US Office of Personnel Management Selects Oracle…"` → `"U.S. Office of Personnel Management Selects Oracle…"`, to match the headline.
8. **L97**: the RPS quote ends at "publicly." The source continues "or with other parties if the provider determines doing so will NOT likely have an adverse effect on the cloud service offering." Consider appending "…if the provider determines doing so will NOT likely have an adverse effect".

#### 3. Substantive findings

- **The EPM statement is attributed to Fusion (L42, L176, L207; hb-ora-url).** The restricted-region sentence is from the EPM Cloud page. Its text is: "This pattern is for commercial regions only. In restricted regions (for example OC2 and OC4), the patterns are different." It refers to EPM/EDM URLs. The OIC page that gives the Fusion pattern says nothing about restricted regions.
  - Proposed L176 cell: `oraclecloud.com`; Fusion Applications `systemName.fa.<dcsn>.oraclecloud.com`. Oracle's EPM documentation adds that its own URL pattern "is for commercial regions only. In restricted regions … the patterns are different."
  - Proposed L207: `**The Fusion US Government hostname.** Oracle's Fusion endpoint documentation gives only the commercial pattern; its EPM documentation says restricted-region patterns differ.`
  - L42 can stay as an absence claim ("Oracle doesn't publish…"). It is consistent with what was found but rests on two pages only. Add "in the documentation checked".
- **NTC-0013 end date (L113).** Source: "The current end date for new FedRAMP Rev5 Certifications is targeted at June 11, 2027; the current end date for existing FedRAMP Rev5 Certifications has not been finalized but is likely to be no later than 2029." Proposed: `The notice targets June 11, 2027 for the last new Rev5 certifications and gives no final end date for existing ones, only that it "is likely to be no later than 2029."`
- **USDA Connect carve-out (L93).** The CDS "Using a Trust Center" subset, which contains AGA and AAD, says: "These rules apply to providers that are using a FedRAMP-compatible trust center instead of USDA Connect; they DO NOT apply to providers using USDA Connect." The Rev5 effective dates for CDS also run to 2027/2028. Proposed: add to the On-request row `(applies once the provider uses a trust center rather than USDA Connect)`.
- **"Every certified provider" (L30).** The CDS-CSO, MAS-CSO and CMU-CSO subsets apply to Classes B, C and D. Proposed: `require every Class B–D provider, Rev5 included, to publish…`. Oracle Fusion is Class C, so the conclusion is unaffected.
- **M-24-15 duty (L152).** Source §VII.a(7), p. 15, is a GSA duty: "establish a secure, transparent, and automated process for enabling agency officials' access to artifacts in the FedRAMP repository". The agencies' §VII duties concern supplying artifacts of reusable quality, not access. Proposed: `It places the duty to give agency officials access to artifacts on GSA, through the FedRAMP repository, not on providers.`
- **Repeal note (L210, hb-usc3609).** The 3609 note says only "the repeal of this section". Either cite the 3607 note for the §§3607–3616 statement, or say `the code notes repeal §3609 (and, under §5921(d)(1), the rest of §§3607–3616) five years after December 23, 2022`.

#### 4. Label check

- **L42**: "Oracle doesn't publish the Fusion Applications hostname pattern for its restricted regions" is stated as plain fact, but it is an absence finding based on two documentation pages, and one of them concerns EPM. L208 already hedges the related .us claim. Hedge L42 the same way: "in the documentation checked".
- **L35**: "they don't stop it" is an interpretation; the rules contain no statement saying so. A search of the CDS, MAS and AGU text found no rule that forbids data leaving the Minimum Assessment Scope, so the reading holds. It is not a source statement, though; consider "the rules contain no prohibition on it".
- **L113**: "can move a provider's date by most of a year" is correctly labelled *(inference)*.
- **L136, L168, L184–189**: labelled as inference, and their claims are not restated as fact elsewhere. L41's crypto bullet states the SHOULD/MUST facts only and is sourced.
- No other inference or design item from my footnotes appears as plain fact.

#### 5. Couldn't open

- `https://www.ecfr.gov/current/title-32/subtitle-B/chapter-XX/part-2002`: HTTP 200, but the request redirected to `https://unblock.federalregister.gov/` (bot block). The text was verified instead via `https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-32?part=2002`. Consider leaving the footnote URL as is.
- `https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final`: opens (200), but it is a landing page with no SC-13 text. The text was verified via the NIST OSCAL catalog on GitHub (usnistgov/oscal-content).
- All other URLs returned 200 with content.
