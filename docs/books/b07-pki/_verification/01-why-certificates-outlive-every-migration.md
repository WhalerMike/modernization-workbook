# Verification — Chapter 01 — Why Certificates Outlive Every Migration

File covered: `01-why-certificates-outlive-every-migration.md`.
Diagram sources: `docs/images/diagrams/b07-pki/src/ch01-certificate-consumers.flow.yaml`, `ch01-two-clocks.flow.yaml`.
Microsoft sources opened (fetch or search excerpt) through the Microsoft Learn MCP tools on October 20, 2026; other sources opened with WebFetch on the same date.
Sources: `docs/operational-guides/pki-modernization.md` §1 (and front matter), argument sections of `docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md` ("PKI as a Naming-Plane Function," "Certificate Lifecycle Automation"), linked not copied.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A certificate binds a key to a name; PKI is a naming-plane function | §A certificate is a naming claim | restated-as-design | Program argument; links Vol I Book 03 |
| 2 | AD CS supports S/MIME, wireless, VPN, IPsec, EFS, smart card sign-in, TLS, signatures | §A certificate is a naming claim | verified | Learn, "What is Active Directory Certificate Services?" (Benefits) |
| 3 | PKI is a critical AD dependency adapter; certificates fail at expiry weeks/months later | §A certificate is a naming claim | verified (consistency) | Book 02 Ch04 (linked) |
| 4 | DC certificates need KDC Authentication EKU; Kerberos Authentication template carries it; DC and DC Authentication templates don't | table | verified | Learn, "Configure and validate the PKI in a hybrid certificate trust model" |
| 5 | LDAPS enabled by installing Server Auth cert with DC FQDN; ports 636/3269; no other UI | table | verified | Learn, "Configure certificates for LDAP over SSL in AD DS" |
| 6 | Smart card logon: issuing CA in NTAuth; each DC needs DC cert; revocation must succeed on client and DC | table | verified | Learn, "Guidelines for enabling smart card logon with third-party CAs" |
| 7 | Every NPS needs a server certificate trusted by clients for EAP-TLS, PEAP-TLS, PEAP-MS-CHAP v2 | table | verified | Learn, "Manage Certificates Used with NPS" |
| 8 | KB5014754 full enforcement Feb 11, 2025; after Sept 9, 2025 update registry key unsupported; strong vs weak mappings | table, §Mapping rules | verified | Microsoft Support, KB5014754 |
| 9 | Intune SCEP must add OnpremisesSecurityIdentifier to SAN URI; user certs all platforms, device certs hybrid-joined only | table, §Mapping rules | verified | Learn, "Create and assign SCEP certificate profiles in Intune" |
| 10 | Entra CBA is a relying party; CDP HTTP only; customers provide own PKI | table, §Why the dependency | verified | Learn, "Limitations with Microsoft Entra CBA" |
| 11 | Public Key Services objects are forest-wide; changes affect clients beyond the CA; treat CRL/AIA URLs as long-lived dependencies | §Why the dependency | verified | Learn, "Monitor AD CS publication health with Enterprise PKI" |
| 12 | Entra-joined Intune devices have no Group Policy channel | §Why the dependency | verified (consistency) | Book 05 Ch01 (linked) |
| 13 | Cloud PKI issues via SCEP to Intune-managed devices; hosts CDP and AIA | §Why the dependency | verified | Learn, "Overview of Microsoft Cloud PKI for Microsoft Intune" |
| 14 | Intune supported platforms don't include Windows Server | §Why the dependency | verified | Learn, "Supported operating systems and browsers in Intune" (Microsoft list: Windows 11 editions, Cloud PCs, LTSC, Holographic) |
| 15 | SC-081v3 adopted April 2025; 398→47 days; DCV reuse 398→10 days; 25 issuer yes / 0 no; four browsers yes | §Public TLS lifetimes | verified | CA/Browser Forum ballot page |
| 16 | 200 days from 2026-03-15; 100 days from 2027-03-15; 47 days from 2029-03-15 | table | verified | CA/B Forum BR v2.3.1 (Oct 4, 2026) §1.2.2 |
| 17 | Renewal workload columns (about 1/2/4/8 per year; 4/7/15/31 per working day per 1,000) | table | restated-as-design | Program arithmetic, stated as such in the caption |
| 18 | BRs govern public TLS, not internal CAs; program keeps internal lifetimes short | §Public TLS lifetimes | restated-as-design | Program policy; links Vol I Book 03 |
| 19 | Source/compliance book: "first reductions already in force in 2026" | §Public TLS lifetimes | verified | 200-day cap in force since March 15, 2026 |
| 20 | NIST IR 8547 ipd: RSA/ECDSA 112-bit deprecated after 2030, all disallowed after 2035; 10–20 years; PKI must update before apps | §Algorithms | verified | NIST IR 8547 ipd, §1, §2.2, §4.1.1 Table 2 (PDF read) — flagged as a draft in text |
| 21 | AD CS supports ML-DSA on WS2025 with 2026-05 update; ML-KEM/composite planned; CNG required; long-lived trust rationale | §Algorithms | verified | Learn, "Post-Quantum Cryptography in AD CS overview" |
| 22 | Root built 2026 with 20-year life expires 2046 | §Algorithms | restated-as-design | Arithmetic on the illustrative 20-year root lifetime from the guide's §2.2 |
| 23 | Spreadsheet CA failure modes | §Manual lifecycle | restated-as-design | Summarized from Vol I Book 03 (linked) |
| 24 | CyberArk Certificate Manager (formerly Venafi) is the program's CLM tool; no second CLM vendor | §Manual lifecycle | restated-as-design | Program vendor position (book brief) |
| 25 | Palo Alto Networks completed CyberArk acquisition Feb 11, 2026 | §Manual lifecycle | verified | SEC Form 8-K Exhibit 99.1 |
| 26 | SaaS edition now marketed under NGTS (successor to Venafi TLS Protect and CyberArk Certificate Manager SaaS); Self-Hosted continues | §Manual lifecycle | verified | Palo Alto Networks Certificate Manager page (cyberark.com datasheet now 301-redirects there) |
| 27 | M-22-09 requires phishing-resistant MFA for staff, contractors, partners; names PIV | §Why its own program | verified | OMB M-22-09 pp. 5 and 7 (PDF read) |
| 28 | PIV certs come from Federal PKI via CMS, not AD CS | §Why its own program | verified (consistency) | Book 03 Ch09; Book 06 Ch22 (linked) |
| 29 | Book 02 acceptance condition: every renewal confirmed through new CA before AD CS retires | §Why its own program | verified (consistency) | Book 02 Ch04 (linked) |
| 30 | AD CS misconfigurations are a route to domain compromise | §Why its own program | restated-as-design | Forward reference to Ch03 (defensive checklist, sourced there) |
| 31 | Source §1.1 scope listed "ESC vulnerability analysis (ESC1–ESC8)" as an assessment domain | §What this book covers | restated-as-design | Reframed as "hardening of what stays" per book brief's defensive framing |
| 32 | Source §1.1 "Gitea integration for assessment persistence" | §What this book covers | removed | Tool-specific; evidence model is Ch08's job |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Guide front matter (title block, series, classification line, version, repository, author) | — | Not carried: page metadata; classification stamps are not used in the workbook |
| Guide lead image (`read-only-ad-assessment-image-03-…png`, "hybrid coexistence") | — | Not carried: wrong image (an assessment-module screenshot) and old PNG; replaced by house-style diagrams |
| Classification Notice box | — | Not carried: classification and boundary stamps removed workbook-wide |
| Canon Phase Mapping table and paragraph | — | Not assigned to this chapter (phase playbook belongs to Chapter 07) |
| Table of Contents | Ch01 §What this book covers | Replaced by the book's chapter map |
| §1 Purpose and Scope (intro paragraph) | Ch01 §What this book covers | Restated; the "GCC-Moderate boundary" design statement left to the target chapter (Ch04) |
| §1.1 Scope Definition | Ch01 §What this book covers | Carried as the book's scope; ESC item reframed as hardening; Gitea detail dropped (see claims 31–32) |
| §1.2 Classification and Handling | — | Not carried: classification, distribution and retention stamps are not used in the workbook |
| §1.3 Companion Document Cross-References | Ch01 table "Where the workbook migrates it" and links | Replaced by links to the workbook books that now hold that material (Book 02 Ch04, Book 03 Ch09, Book 05, Book 06 Ch22); the named guides are archived |
| §1.4 Audience | Ch01 §What this book covers (last paragraph) | Carried |
| Vol I Book 03 "A Certificate Is a Naming Claim" | Ch01 §A certificate is a naming claim | Summarized and linked (stays in place) |
| Vol I Book 03 "The Failure Mode Being Retired" | Ch01 §Manual lifecycle management breaks | Summarized and linked |
| Vol I Book 03 "The Arithmetic Just Got Worse" | Ch01 §Public TLS lifetimes | Re-verified against CA/B Forum primary sources and restated with program arithmetic |
| Vol I Book 03 automation stack, revocation, telemetry sections | Ch01 four-part list (forward references) | Linked, not copied; detail belongs to Ch04/Ch08 |
