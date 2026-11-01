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

## Additions, October 29, 2026

One-line link added after the contractor options table to the research page that tests the contingent worker option. No new claims. Research page: `docs/evaluations/oracle-contingent-worker-contractor-source.md` (its log: `docs/evaluations/_verification/oracle-contingent-worker-contractor-source.md`).

## Revision 2026-10-29 — four tracks and companion-guide alignment

Added an HR-track signpost after the *In this chapter* callout, a device-half note on the device slots, and a new subsection *The attribute stores* under *Design rules*. Four new footnotes: `c06-ext-1024`, `c06-dirext`, `c06-csa`, `c06-csa-dyn` (names grepped unique in the book folder). Every Learn page below was opened on Oct 29, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Rules can't read `employeeType`, `employeeOrgData` or `manager` | Attribute stores table | re-verified (supported string properties list: employeeId then facsimileTelephoneNumber, neither employeeType nor employeeOrgData; manager only via Direct Reports rule) | learn.microsoft.com/entra/identity/users/groups-dynamic-membership (c06-dyn-rules) |
| 2 | extensionAttribute1–15: up to 1,024 characters each; also known as Exchange custom attributes 1–15; read-only for synced users | Attribute stores table | verified | learn.microsoft.com/graph/api/resources/onpremisesextensionattributes (c06-ext-1024) |
| 3 | Device extensionAttributes managed only in Entra ID (create/update through Graph) | Attribute stores table; device-slot paragraph | verified | same as 2 |
| 4 | Directory extensions `extension_<appId>_<name>`; up to 100 values per object; synced strings over 256 characters truncated | Attribute stores table | verified (the page says the sync engine truncates; worded as "cut at 256 characters") | learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-directory-extensions (c06-dirext) |
| 5 | Single-valued directory extensions readable by rules; multi-value extension properties not | Attribute stores table | verified | groups-dynamic-membership ("Multi-value extension properties aren't supported"; extension attributes and custom extension properties supported as string properties) |
| 6 | Device rules read only the device's own properties, never the owner's | Attribute stores table | verified by inspection (device rule properties list contains no owner or user properties) | groups-dynamic-membership, Rules for devices |
| 7 | Custom security attributes on users and service principals; access restricted by their own roles; anyone who can read an object can read its extension data | Attribute stores table; mirror paragraph | verified | learn.microsoft.com/entra/fundamentals/custom-security-attributes-overview (c06-csa) |
| 8 | Custom security attributes aren't supported in dynamic membership rules | Attribute stores table | verified | learn.microsoft.com/entra/identity/users/users-custom-security-attributes, FAQ (c06-csa-dyn) |
| 9 | Program mirrors employeeType / employeeOrgData into slots 5, 6, 11 | Mirror paragraph | carried from the program attribute map (design guidance) | — |
| 10 | Device slot values come from device provisioning, not HR | Signpost; device-slot paragraph | restated-as-design; links Book 05 Ch 08 #the-device-attribute-schema | — |

Correction to the shared content (ATTRIBUTES.md): none beyond those already recorded in the brief. The brief's "strings up to 256 characters" is, on Learn, a truncation by the sync engine for synced values; the page text says so.
