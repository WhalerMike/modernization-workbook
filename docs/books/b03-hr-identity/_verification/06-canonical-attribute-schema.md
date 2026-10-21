# Verification — Chapter 06, The Canonical Workforce Identity Model

File: `docs/books/b03-hr-identity/06-canonical-attribute-schema.md`
Diagram source: `docs/images/diagrams/b03-hr-identity/src/ch06-standard-attribute-layer.flow.yaml`
Verified: 2026-10-20

Footnote keys renamed `c05-*` → `c06-*`. Every kept footnote was re-opened on 2026-10-20; access dates updated.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | OPM data standards, formerly the PDF *Guide to Data Standards*, now in a web-based metadata repository | Standard-attribute layer | verified | opm.gov Data Policy & Guidance |
| 2 | (Added) EHRI Data Standards hosted on data.opm.gov; Agency/Subelement is a listed element | Standard-attribute layer | verified (footnote added) | data.opm.gov EHRI Data Standards |
| 3 | Every personnel action carries a NOA code from the standards | Standard-attribute layer | verified | GPPA, October 2026 edition, Ch. 1 (complete NOA list published in the EHRI Data Standards) |
| 4 | GPPA footnote "October 2026 edition" | Footnote | verified (cover reads October 2026) | GPPA PDF |
| 5 | (Added) Coded SF-50 blocks may use only EHRI Data Standards codes | After element table | verified (added) | GPPA Ch. 1 §5 |
| 6 | Element list (POI, duty station, series/pay plan/grade, supervisory status, tenure, appointment, work schedule, NOA + effective date) | Element table | verified as SF-50/GPPA elements (POI assigned by OPM to the servicing office; supervisory status block 51; duty station, work schedule, tenure change NOACs) | GPPA |
| 7 | OPM standards and NOA codes cover federal employees; contractors not in HRIT | Contractors | verified (GPPA is federal personnel documentation; consistent with Chapter 08's log) | GPPA |
| 8 | Contingent worker is a full Oracle worker type with same interfaces | Contractor options | verified; broken footnote replaced (old 24d "Create a Contingent Worker" URL now redirects to a landing page) with the `workRelationships` POST page listing WorkerType E/C/P/N | Oracle REST "Create a worker work relationship" |
| 9 | Add, renew, convert actions | Contractor options | verified; Change Worker Type (26B) footnote added for conversion | Oracle "How You Convert Pending Workers"; Oracle 26B What's New |
| 10 | PIV system holds adjudication and an expiry for badged contractors | Contractor options | verified for adjudication and expiry (FIPS 201-3: background investigation and favorable adjudication before issuance; validity ≤ 6 years); sponsorship itself is agency practice, not FIPS 201-3 text | FIPS 201-3 |
| 11 | PIV enrollment is the authority for identity proofing and credential status | One authority table | verified (FIPS 201-3: PIV proofing and registration meet IAL3) | FIPS 201-3 |
| 12 | COR spreadsheets, suitability registers, sponsor grace (14 days) and recertification (180 days) | Contractors | restated-as-design (examples labelled "for example"; program design) | — |
| 13 | Register privacy basis "does a routine use allow disclosure to identity systems" | Before a register becomes an authority | corrected (coordinator note, verified in Chapter 04): within the maintaining agency, need-to-know (5 U.S.C. 552a(b)(1)); routine use only if records leave the agency; privacy office decides | Chapter 04 footnotes (Privacy Act; OMB A-108) |
| 14 | Native attributes listed exist on the Entra user | Design rule 1 | verified | Graph user resource (via Chapter 05) |
| 15 | Dynamic rule property list includes department, companyName, jobTitle, employeeId, employeeHireDate (preview), userType, accountEnabled, extensionAttribute1–15, directory extensions; excludes employeeType, employeeOrgData, manager | Design rule 2 | verified | groups-dynamic-membership |
| 16 | extensionAttribute1–15 in AD and Entra; read-only in Entra for synced users; settable for cloud-only | Design rule 4 | verified | Graph onPremisesExtensionAttributes |
| 17 | Schema table SCIM/AD/Entra mappings | Schema | verified against Microsoft worksheets 2, 4, 5, 6 (JobCode → extensionAttribute1; HireDate/TermDate → extensionAttribute2/3; division → employeeOrgData.division; company → companyName) | Oracle HCM tutorial |
| 18 | "Rule can read it" column | Schema | verified against rule property list (displayName, givenName, surname, country readable; employeeLeaveDateTime not) | groups-dynamic-membership |
| 19 | Neither date has a native AD attribute; must be a string; format conversion; all three sync engines support both targets | Notes | verified | how-to-lifecycle-workflow-sync-attributes |
| 20 | extensionAttribute10–12 is this workbook's choice | Notes | restated-as-design (already so stated) | — |
| 21 | Exchange calls them custom attributes 1–15 | Notes | verified | onPremisesExtensionAttributes |
| 22 | Multi-value extension properties not supported in rules | Notes | verified | groups-dynamic-membership |
| 23 | Check write permissions of rule attributes; restrict self-service writes | Writers | verified | groups-dynamic-membership (security consideration) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | kept | edited: `part: What`; `lifecycle_review` → 2027-04-01 |
| Thesis, "In this chapter" | kept | unchanged |
| The standard-attribute layer (incl. diagram and table) | kept | edited: EHRI footnote; SF-50 coded-blocks sentence; "Lands as (Chapter 06 crosswalk)" → "(crosswalk below)" since this is Chapter 06 |
| Contractors and vendors (options table, rules) | kept | edited: replaced broken Oracle footnote; FIPS 201-3 detail on PIV row |
| One fact, one authority | kept | edited: FIPS 201-3 IAL3 note on the proofing row |
| Before a register becomes an authority | kept | edited: privacy-basis bullet corrected |
| Sequence: start with what already exists | kept | unchanged |
| Design rules | kept | unchanged |
| The schema (table and notes) | kept | unchanged |
| Writers | kept | unchanged |
| How other pages use this schema | kept | edited: B02 link now `../b02-identity/09-building-the-entra-target.md` with the Book 02 chapter title |
| Continue the series | kept as "Continue the book" | edited: Next now Chapter 07 — Who Owns Workforce Identity |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: added "Program attribute map" section (user slots 1-15 and device slots), the single home of the map; slots 1-3 and 10-12 unchanged; design rules 2 and 5, Writers bullets, the in-this-chapter callout and "How other pages use this schema" updated to point to it. No new footnotes (device claim cites existing `c06-onprem-ext`). |
