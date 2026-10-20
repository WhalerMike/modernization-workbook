# Verification — Chapter 02 — What AD CS Holds Up

File covered: `02-what-ad-cs-holds-up.md`.
Diagram sources: `docs/images/diagrams/b07-pki/src/ch02-adcs-topology.flow.yaml`, `ch02-classification.flow.yaml`.
Microsoft sources opened (fetch or search excerpt) through the Microsoft Learn MCP tools on October 20, 2026.
Sources: `docs/operational-guides/pki-modernization.md` §2, §4 and §13.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Root compromise compromises all CAs and certificates beneath; keep root offline | §Typical topology | verified | Learn, "What is the Certification Authority Role Service?" |
| 2 | Standalone root taken offline after issuing sub CA is production best practice | §Typical topology | verified | Learn, "Configure a certification authority to use ML-DSA" (note) |
| 3 | Only enterprise CAs issue from templates; templates stored in AD DS, shared by every CA in the forest | components table | verified | Learn, "Manage AD CS certificate templates"; "Certificate templates concepts" |
| 4 | NDES is a registration authority for SCEP for devices without domain credentials | components table | verified | Learn, NDES overview |
| 5 | Intune SCEP with a Microsoft CA needs NDES + Certificate Connector | components table | verified | Learn, "Use certificates for authentication in Microsoft Intune" |
| 6 | CES/CEP: HTTPS policy-based enrollment off-domain/off-network; cross-forest; perimeter placement | components table | verified | Learn, CES overview; CEP overview |
| 7 | Source: CES/CEP "often paired with Web Application Proxy or Azure AD Application Proxy" | components table | removed | Not verified as a documented pairing; Learn documents perimeter-network placement instead (and Azure AD Application Proxy is now Microsoft Entra application proxy) |
| 8 | CA Web Enrollment: browser-based; used for standalone CAs | components table | verified | Learn, "Certification Authority Web Enrollment" |
| 9 | Entra CBA: one HTTP CDP per CA; no OCSP or LDAP | components table, use-case map | verified | Learn, "How to configure certificate authorities for Microsoft Entra CBA" |
| 10 | Online Responder answers OCSP with signed status | components table | verified | Learn, "What is AD CS?" (Key features) |
| 11 | Public Key Services containers and their purposes; forest-wide effect; enterprise CAs auto-publish to NTAuth | §What AD CS keeps in the forest | verified | Learn, "Monitor AD CS publication health with Enterprise PKI" |
| 12 | CA inventory record values (OS, key lengths, validity) | CA record table | restated-as-design | Illustrative values from the source, labeled as such; server names changed from `[YOURORG]-…` to the FMP prefix |
| 13 | PQC in AD CS requires CNG providers, not legacy CSPs (reason for the added KSP row) | CA record | verified | Learn, "Post-Quantum Cryptography in AD CS overview" |
| 14 | Entra CBA CRL size limits (reason for the CRL size row) | CA record | verified (consistency) | Book 03 Ch09 (linked) |
| 15 | Template names are AD CS defaults (User, Smartcard User, Computer, Workstation Authentication, Web Server, RAS and IAS Server, Code Signing, Exchange User, Basic EFS, EFS Recovery Agent, Smartcard Logon, Kerberos Authentication, Domain Controller, DC Authentication, OCSP Response Signing, IPSEC (Offline request), Enrollment Agent) | categories table | verified | Learn, "Certificate templates concepts" (Default certificate templates) |
| 16 | EKU OIDs (Client Auth, Server Auth, Code Signing, Secure Email, EFS, EFS Recovery, Smart Card Logon, OCSP Signing, IKE Intermediate, Enrollment Agent) | categories table | verified | Learn, "ObjectIdGroupId enumeration (certenroll.h)" |
| 17 | KDC Authentication OID `1.3.6.1.5.2.3.5`; DCs auto-request DC cert; DC/DC Auth templates lack KDC OID; use Kerberos Authentication | categories table, note | verified | Learn, "Configure and validate the PKI in a hybrid certificate trust model" |
| 18 | Source table omitted RAS and IAS Server and Secure Email rows | categories table | corrected | Added (both used in the source's own §4.2 map); RAS and IAS template verified in Learn NPS template article |
| 19 | Autoenrollment GPO path and the two option names | §Autoenrollment | corrected | Source abbreviated the first option as "Renew expired certificates"; full name per Learn, "Configure auto-enrollment of certificates for NPS" |
| 20 | Template needs Read + Enroll + Autoenroll | §Autoenrollment | corrected | Source said "Enroll and Autoenroll"; Learn ConfigMgr example grants Read and Autoenroll and keeps Enroll |
| 21 | Autoenrollment runs every 8 hours; renew after 80% and within renewal period; renewal period >8h and <20% of validity | §Autoenrollment | verified | Learn troubleshoot, "Approval required for certificate renewals…" |
| 22 | Enrollment Agent certificate is an impersonation capability; restrict templates and populations; no WS2025 step-by-step for restrictions, validate in lab | §Autoenrollment | corrected | Source gave a console path (certsrv.msc → CA Properties → Enrollment Agents) as fact; Learn, "Secure, delegate, and audit CA administration" says no current WS2025 procedure is published, so the path is not repeated |
| 23 | Entra-joined devices don't process Group Policy | §Autoenrollment | verified (consistency) | Book 05 Ch01 (linked) |
| 24 | PowerShell `switch` runs every matching clause unless `break`/`continue` | §Inventory | verified | Learn, "about_Switch" |
| 25 | Default User template carries EFS, secure email, client auth EKUs (so the source function would mark it RETIRE) | §Inventory | verified | Learn, "CMC Request"; "Certificate templates concepts" (User: e-mail, EFS, client authentication) |
| 26 | Source function's ACL check read only the Enroll extended right | §Inventory | restated-as-design | Program review of the archived source code (GUID `0e10c968-…` filter only) |
| 27 | Test the URL in the actual certificate, not the configured one | §CA layer | verified | Learn, "Monitor AD CS publication health with Enterprise PKI" (troubleshooting table) |
| 28 | `pKIExpirationPeriod` / `pKIOverlapPeriod` are validity and renewal periods | §Template layer | verified | Learn troubleshoot, "Approval required for certificate renewals…" |
| 29 | Network discovery of non-AD CS certificates through CyberArk Certificate Manager | §Issued-certificate layer | restated-as-design | Program vendor position (product facts verified in Ch01) |
| 30 | MIGRATE/BRIDGE/RETAIN/RETIRE framework | §Classifying | restated-as-design | Program framework (from source §4.1); RETIRE action adds "keep decryption keys" |
| 31 | Cloud PKI issues to Intune-managed devices via SCEP | use-case map | verified | Learn, Cloud PKI overview |
| 32 | Certificates used against KDC need SID in SAN (Intune SCEP) | use-case map | verified | Learn, SCEP profiles (strong mapping) |
| 33 | Source: Smart Card Logon (PIV) → MIGRATE → Entra CBA | use-case map | corrected | PIV certificates come from Federal PKI via CMS (Book 03 Ch09); sign-in path migrates, issuer doesn't; domain smart card logon still needs NTAuth + DC certs (Learn, smart card guidelines) |
| 34 | LDAPS cert requirements | use-case map | verified | Learn, LDAPS article |
| 35 | Source: "Cross-forest trust" certificates → BRIDGE | use-case map | restated-as-design | Recorded as the NTAuth + KDC-certificate configuration that cross-forest certificate sign-in needs (Learn, "How to set up certificate-based authentication across forests without trust") |
| 36 | Source: LDAPS "Partial (cloud-consumed)" Cloud PKI path | use-case map | removed | Unclear and unsupported; DCs can't get Cloud PKI certificates |
| 37 | NPS server cert via RAS and IAS Server template; clients must trust it | use-case map | verified | Learn, NPS server certificate template article |
| 38 | Source: Web Server TLS (internal) → MIGRATE, Cloud PKI or public CA, PKCS server deploy | use-case map | corrected | Cloud PKI is SCEP-only to Intune-managed devices; Intune doesn't manage Windows Server; reclassified BRIDGE pending Ch04 (consistent with Book 05 and Book 06 Ch22) |
| 39 | Source: EFS → RETIRE, "migrating to MIP/AIP" | use-case map | corrected | Name updated to Microsoft Purview Information Protection (Learn, "What is Azure Information Protection?"); added program caution to keep EFS/recovery keys until data is re-protected (restated-as-design) |
| 40 | Source: Email S/MIME → MIGRATE via "PKCS Imported" Cloud PKI path | use-case map | corrected | Imported PKCS delivers certificates issued elsewhere; Microsoft recommends encryption certificates not be created in Intune; all past encryption certificates must reach every device (Learn, S/MIME overview; imported PKCS article); reclassified BRIDGE |
| 41 | Source: OCSP Response Signing → RETIRE, "Cloud PKI handles" | use-case map | corrected | Cloud PKI's documented features list CRL and AIA, no OCSP responder; Entra CBA doesn't use OCSP; responder retires with the last AD CS CA it serves |
| 42 | Code signing (HSM) RETAIN | use-case map | restated-as-design | Program classification from source |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §2 ADCS Architecture Baseline (intro) | Ch02 §The baseline comes first | Restated |
| §2.1 Typical ADCS Topology (component list) | Ch02 §Typical topology (components table) | Carried and verified; Web Enrollment row added; App Proxy pairing removed (claim 7) |
| §2.1 Diagram placeholder PKI-001 (ADCS topology) | Ch02 figure `ch02-adcs-topology` | Replaced by a house-style diagram |
| §2.2 CA Component Inventory template | Ch02 §The CA inventory record | Carried; KSP, CRL size/interval and templates-published rows added; values labeled illustrative |
| §2.3 Certificate Template Categories | Ch02 §Template categories | Carried with verified names and OIDs; RAS and IAS Server, Secure Email and EFS recovery OID added; DC template note added |
| §2.4 Auto-Enrollment Configuration | Ch02 §Autoenrollment | Carried with corrections (claims 19, 20, 22) and timing added |
| §2.4 Assessment Note (capture GPO config; scope GPOs to exclude migrated devices) | Ch02 §Autoenrollment (last paragraph) | Carried; "AD Interaction Guide" reference replaced by Book 05 link |
| §4 Certificate Inventory and Classification (intro) | Ch02 §Classifying every use case | Restated |
| §4.1 Classification Framework | Ch02 classification table and figure `ch02-classification` | Carried; examples adjusted to match corrected map; RETIRE action extended |
| §4.2 Certificate Use Case Mapping | Ch02 §The use-case map | Carried with corrections (claims 33–41); "Dependencies" column merged with notes; template-level detail goes to Appendix B |
| §4.3 PowerShell Inventory Function (`Get-FMPCertificateInventory`) | Ch02 §What the certificate inventory collects (described, not reproduced) | Not carried as code per assignment; stays in the archived guide with Appendix C pending technical review; two defects recorded (claims 24–26) |
| §13 Companion Document Cross-Reference (table, 11 rows) | — | Not carried: the named companion guides (AD Interaction Guide, AD Security Assessment Guide, Identity Modernization Guide, AD Computer Object Conversion Guide, Network Architecture Guide, Monitoring and Compliance Guide, Program Overview) are being archived or superseded by workbook books; their relationships are expressed as direct links to Book 02, Book 03, Book 05 and Book 06 chapters and to this book's own chapters |
