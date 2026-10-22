# Verification — Chapter 04 — The Target PKI: Cloud PKI, AD CS and Federal PKI

File covered: `04-the-target-pki.md`.
Diagram sources: `docs/images/diagrams/b07-pki/src/ch04-issuer-map.flow.yaml`, `ch04-cloud-root-vs-byoca.flow.yaml`.
Source: `docs/operational-guides/pki-modernization.md` §5 (5.1–5.3 and the recommendation callout); Appendix A used as context only. Microsoft sources opened through the Microsoft Learn MCP tools on October 20, 2026; vendor, GSA and FedRAMP sources by WebFetch/WebSearch/curl the same day.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Guide: Cloud PKI eliminates on-prem ADCS "for most certificate use cases" | Intro | corrected | Learn, Cloud PKI fundamentals: issues only to MDM-enrolled devices |
| 2 | Entra is a relying party, not a CA | Intro | verified | Consistent with Book 02 Ch 04 (already verified) |
| 3 | Cloud PKI hosts CAs, SCEP RA, CRL, AIA; replaces on-prem CA, NDES, connector | Cloud PKI | verified | Learn, Cloud PKI overview |
| 4 | Private key generated on device; RA validates challenge | Cloud PKI | verified | same (architecture A2–A4) |
| 5 | Platforms Android, iOS/iPadOS, macOS, Windows; must be enrolled and support SCEP profile | Table | verified | same |
| 6 | Intune supported platforms don't include Windows Server | Table | verified | Learn, "Supported operating systems and browsers in Intune" (consistent with Book 05) |
| 7 | Client-auth certificates for Wi-Fi/VPN | Table | verified | Learn, Cloud PKI fundamentals |
| 8 | Cloud PKI doesn't provide relying-party TLS certificates (RADIUS, Wi-Fi, VPN) | Table | verified | Learn, Cloud PKI deployment models (note) |
| 9 | RSA 2048/3072/4096; SHA-256/384/512; SCEP-only leaf issuance | Table | verified | Learn, Cloud PKI overview |
| 10 | CRL 7 days, 3.5-day republish, on revocation | Table | verified | same (consistent with Book 03 Ch 09) |
| 11 | No OCSP responder documented; Entra CBA no OCSP | Table | verified | same; Learn, "What is Entra CBA?" |
| 12 | Three CAs per tenant incl. BYOCA | Table | verified | Learn, Cloud PKI overview (known issues). Consistent with Chapter 06 |
| 13 | No data residency option | Table | verified | same |
| 14 | EKUs not editable after creation | Cloud PKI | verified | Learn, configure-ca |
| 15 | Licensed CAs use Azure Managed HSM, no Azure subscription; trial software keys not convertible | Keys | verified | Learn, Cloud PKI overview |
| 16 | Requires subscription on top of Intune Plan 1/2; standalone add-on or Intune Suite | Licensing | verified | Learn, Cloud PKI overview; "Use Intune Suite add-on capabilities" |
| 17 | "Advanced capabilities (formerly Intune Suite)" | Licensing | verified | Learn, What's new in Intune (2609) |
| 18 | July 2026: M365 E5/E7 include Cloud PKI (commercial); gov plans planned to align subject to compliance | Licensing | verified | Learn, What's new (2606); planning guide |
| 19 | Guide: "Intune Suite add-on or standalone Cloud PKI license" | Licensing | corrected | Updated for 2026 packaging |
| 20 | Intune has no separate GCC instance; GCC = commercial | Availability | verified | Learn, Intune GCC High and DoD service description |
| 21 | GCC High since week of Sept 28, 2026; not DoD | Availability | verified | Learn, What's new (2609); Cloud PKI overview |
| 22 | Both models coexist in one tenant | Models | verified | Learn, deployment models |
| 23 | Cloud root two-tier; root 5–25 y; issuing 2–10 y ≤ root; Graph custom | Models | verified | Learn, configure-ca |
| 24 | Cloud root: deploy new root to all relying parties | Models | verified | Learn, deployment models |
| 25 | BYOCA: CSR signed by private CA (AD CS or non-Microsoft), N+ tier | Models | verified | Learn, Cloud PKI overview; deployment models |
| 26 | Guide: on-prem Root CA (offline) signs the CSR; root must be online | BYOCA | corrected | Learn, configure-byoca: signer can be root or issuing CA at any tier |
| 27 | Web Enrollment or certreq with SubCA template | BYOCA | verified | Learn, configure-byoca |
| 28 | Validity set by signer; hash by signer; key size upper bound; no 1024/SHA-1 | BYOCA | verified | same |
| 29 | Renewal: new CSR, signed, staged before activation | BYOCA | verified | Learn, "Renew a certificate authority in Cloud PKI" |
| 30 | BYOCA AIA from private CA; AD CS default LDAP AIA | BYOCA | verified | Learn, configure-byoca |
| 31 | Android doesn't follow AIA; deploy full chain | BYOCA | verified | Learn, deployment models |
| 32 | Guide: "No new root deployment required" | BYOCA | corrected | Microsoft recommends deploying BYOCA issuing CA cert to relying parties (GPO) and devices |
| 33 | Guide: Root CA CRL remains on-prem, must be accessible | BYOCA | verified | Logic + Entra CBA one HTTP CDP, fails if unreachable (Learn CBA overview; CRL page) |
| 34 | Matrix rows: existing PKI, trust chain, key custody, validity, ceremony, CA count, licensing, DC/LDAPS | Matrix | verified/corrected as marked | Sources per row |
| 35 | Matrix rows: audit posture, cross-forest, rollback, on-prem dependency framing | Matrix | restated-as-design | Program assessment |
| 36 | Guide: "Cost: Intune Suite license only" | Matrix | corrected | Licensing row; no prices given |
| 37 | Guide: "Faster migration timeline / root online for CSR" | Matrix | corrected | Merged into ceremony row |
| 38 | Recommendation: BYOCA for established hierarchy; cloud root for net-new | Recommendation | restated-as-design | Guide callout |
| 39 | Three BYOCA rules (harden first, sign with root, root CRL as production) | Recommendation | restated-as-design | Program rules |
| 40 | DC certificates must chain to NTAuth CA for smart card logon; DCs need DC certs | AD CS | verified | Learn, "Guidelines for enabling smart card logon with third-party CAs" |
| 41 | Retained-use table (LDAPS, NPS, server TLS, NDES, code signing, S/MIME) | AD CS | restated-as-design | Consistent with Chapter 02 classifications; supporting facts footnoted |
| 42 | Server issuer decision: AD CS via CLM for internal names; public CA for internet names | AD CS | restated-as-design | Program decision (closes Chapter 02 BRIDGE note; consistent with Chapter 05 table) |
| 43 | Standalone CAs don't use templates | AD CS | verified | Learn, "Manage AD CS certificate templates…" |
| 44 | CLM Self-Hosted supports enterprise and standalone Microsoft CAs | AD CS, CLM | verified | docs.venafi.com 26.1 Microsoft ADCS CA template page |
| 45 | FPKI definition; FCPCAG2 root; SSPs under Common Policy issue PIV | FPKI | verified | IDManagement.gov FPKI 101 |
| 46 | FCPCAG2 not in Microsoft/Mozilla/Apple stores by default | FPKI | verified | same |
| 47 | FIPS 201-3 January 2022 | FPKI | verified | NIST CSRC (same citation as Book 03 Ch 09) |
| 48 | Third-party CA must be in NTAuth for smart card logon | FPKI | verified | Learn, third-party smart card logon guidelines |
| 49 | Entra CBA validates, doesn't issue | FPKI | verified | Learn, CBA overview; limitations page ("PKI for creating client certificates" unsupported) |
| 50 | Intune/Cloud PKI manage issue/renew/revoke for their certificates | CLM | verified | Learn, Cloud PKI overview |
| 51 | Venafi acquired by CyberArk Oct 1, 2024 | CLM | verified | Thoma Bravo press release (search result) |
| 52 | Palo Alto completed CyberArk acquisition Feb 11, 2026 | CLM | verified | Palo Alto Networks press release (fetched) |
| 53 | SaaS edition now Next-Gen(eration) Trust Security; Self-Hosted on Trust Protection Foundation | CLM | verified | paloaltonetworks.com NGTS page (cyberark.com redirect) |
| 54 | CLM CA account needs Read, Issue and Manage Certificates, Request Certificates | CLM | verified | docs.venafi.com 26.1 Microsoft ADCS page (consistent with Chapter 05) |
| 55 | FedRAMP Marketplace has no Certificate Manager / NGTS package; Palo Alto packages are Idira Identity Security Gov Services Platform (High), Idira EPM for Government (High), Government Cloud Services (Moderate), GCS-HIGH | CLM | verified | fedramp.gov/marketplace/products.json, dataset last_change 2026-10-20 |
| 56 | Deploy Self-Hosted inside the boundary until a package is authorized | CLM | restated-as-design | Program decision |
| 57 | No second CLM vendor | CLM | restated-as-design | Book brief / program position |
| 58 | Public TLS lifetime schedule | CLM | restated-as-design | Pointer to Chapter 01, which carries the verified CA/B Forum figures |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §5 intro (Cloud PKI in Intune Suite) | "Microsoft Cloud PKI"; "Licensing" | "Most use cases" claim corrected; packaging updated |
| §5.1 Cloud PKI Root CA (architecture, trust distribution, CRL/AIA, licensing, best for) | "Two deployment models"; "Licensing"; matrix | — |
| §5.2 BYOCA (architecture, trust distribution, CRL/AIA, best for) | "What BYOCA actually requires"; matrix | Signer and trust-distribution claims corrected |
| §5.3 Deployment Model Decision Matrix | "The deployment-model decision matrix" | Rows corrected as marked; price-like "cost" row recast as licensing |
| Diagram placeholder PKI-002 (Cloud PKI architecture) | `ch04-cloud-root-vs-byoca` diagram | Replaced by house-style SVG source |
| Program Recommendation callout | "The program's recommendation" | Three BYOCA rules added |
| §4.2 rows deferring server TLS issuer (via Chapter 02) | "The issuer decision for internal server certificates" | — |
| Compliance Amendment HSM | "Keys" (Cloud PKI custody) | AD CS HSM requirement is in Chapter 03 |
| §13 cross-reference row for §5 | Not carried | Companion-guide pointer replaced by book links |
| Appendix A checklist | Not carried | Context only; owned by the Appendix A writer |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | "Android doesn't follow AIA paths at all" attributed to Microsoft and narrowed: the Android OS requires servers to return the entire chain and doesn't discover missing certificates through AIA | BYOCA bullets (line 74) | corrected (narrowed to what the page says) | <https://learn.microsoft.com/intune/cloud-pki/deployment-models> |
| RF-2 | CRL wording "HTTP (or HTTPS; HTTP recommended)" | line 77 | verified (same source conflict as Chapter 02, noted in `[^c04-cba-crl]`) | <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> |
| RF-3 | `[^c04-pan]` now cites the SEC Form 8-K Exhibit 99.1, like Chapters 01, 05 and 07; close date February 11, 2026 re-confirmed | Footnote (line 184) | verified | <https://www.sec.gov/Archives/edgar/data/1327567/000119312526045600/d40626dex991.htm> |

## Consistency fixes, 2026-10-21

Cross-chapter consistency pass. Every changed external fact was re-checked on the primary source on 2026-10-21; program decisions are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| CF-1 | NPS/RADIUS/VPN gateway server certificates fall under the internal server issuer decision (AD CS through CyberArk); "ends when" no longer implies a different CLM-managed issuer | Retained AD CS table; issuer decision bullet | restated-as-design | Program decision; makes Chapters 05 and 08 consistent with it |
| CF-2 | Domain controller certificates, which also serve LDAPS, stay on autoenrollment | Issuer decision bullet | restated-as-design | Program decision (Chapter 07 template rule) |
