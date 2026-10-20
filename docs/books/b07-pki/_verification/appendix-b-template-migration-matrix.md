# Verification — Appendix B — Certificate Template Migration Matrix

File covered: `appendix-b-template-migration-matrix.md`.
Diagrams: none.
Source: `docs/operational-guides/pki-modernization.md` Appendix B (Certificate Template Migration Matrix, 15 rows). Microsoft sources opened through the Microsoft Learn MCP tools and WebFetch on October 20, 2026. Class definitions follow Book 07 Ch02.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Cloud PKI issues only via SCEP to Intune-enrolled devices | How to use | verified | Cloud PKI overview |
| 2 | Intune doesn't manage Windows Server | How to use | verified | Intune supported operating systems |
| 3 | PKCS/imported PKCS deliver certificates from AD CS or another CA through the connector | How to use | verified | PKCS profiles; connector overview |
| 4 | User → MIGRATE, Cloud PKI SCEP Client Auth, High; deps Entra CBA, RADIUS trust | User row | verified; SID/NTAuth condition added | Cloud PKI overview; KB5014754 via Ch06 |
| 5 | Computer/Machine → MIGRATE, Cloud PKI SCEP | Computer row | corrected: MIGRATE for Intune-managed workstations only; servers BRIDGE; Entra-joined RADIUS limitation | Intune supported OS; Plan Entra join (RADIUS) |
| 6 | Web Server → MIGRATE to Cloud PKI SCEP or PKCS | Web Server row | corrected: RETAIN on AD CS/public CA with CLM; web servers aren't Intune devices; Cloud PKI isn't a PKCS issuer | Cloud PKI overview; Intune supported OS |
| 7 | Smartcard User / Smartcard Logon → MIGRATE to Entra CBA | Smartcard rows | corrected: issuer unchanged; trust moves to Entra CBA; on-prem logon BRIDGE (NTAuth, DC certs); purposes per template table | Certificate templates concepts; smart card logon third-party CA guidelines; B03 Ch09 |
| 8 | Domain Controller → BRIDGE "must remain ADCS" | DC rows | verified; Domain Controller / DC Authentication lack KDC Auth OID; supersede with Kerberos Authentication | WHfB on-premises certificate trust guide |
| 9 | Kerberos Authentication → BRIDGE | Kerberos row | verified; EKUs and HTTP CRL added | WHfB guide; Configure SSO for Entra joined devices |
| 10 | LDAPS row | LDAPS row | added (new); requirements verified | Configure certificates for LDAPS |
| 11 | RAS and IAS Server → BRIDGE, Low; "future Cloud PKI if NPS migrates" | RAS/IAS row | corrected: a successor RADIUS service brings its own certificate plan (Cloud PKI can't issue to servers); FQDN in SAN | Certificate requirements EAP-TLS/PEAP; Cloud PKI overview |
| 12 | Exchange User (S/MIME) → MIGRATE via PKCS Imported; key escrow | Exchange User row | verified; issuer RETAIN noted | PKCS profiles note; connector overview; template table |
| 13 | Exchange Signature Only row | Signature row | added (new); verified | PKCS profiles note; template table |
| 14 | Code Signing → RETAIN, HSM | Code Signing row | verified-as-design | Template table (purpose); program design |
| 15 | Basic EFS → RETIRE, "migrating to Microsoft Information Protection" | Basic EFS row | corrected name: Microsoft Purview Information Protection (formerly Microsoft Information Protection); replacement restated as program design | Microsoft Purview data security solutions |
| 16 | EFS Recovery Agent → RETIRE | EFS RA row | corrected: retire template last; keep recovery keys until no EFS data remains | Template table (EFS Recovery Agent decrypts EFS files); Ch02 RETIRE action "keep decryption keys" |
| 17 | OCSP Response Signing → RETIRE, "Cloud PKI handles revocation natively" | OCSP row | corrected: retire with AD CS Online Responder; Entra doesn't use OCSP; Cloud PKI publishes CRL/AIA | CRL concept page; Cloud PKI overview |
| 18 | Enrollment Agent → RETIRE, "Intune handles enrollment directly" | Enrollment Agent row | corrected: Intune doesn't replace enroll-on-behalf for smart card stations; retire when no workflow remains; restrict per ESC3 | Template table; Ch03 |
| 19 | IPSec (Offline Request) "VPN gateway IPSec" → MIGRATE Cloud PKI SCEP IPSec EKU | IPSEC row | corrected: split — Intune clients MIGRATE; gateways RETAIN; EKUs fixed at CA creation | Template table; Configure BYOCA (EKU) |
| 20 | CEP Encryption / Exchange Enrollment Agent (Offline request) NDES RA certs | NDES RA row | added (new); verified | Renewal of Enrollment Agent certificate used by NDES |
| 21 | Custom NDES SCEP template; up to three per NDES server | NDES template row | added (new); verified | SCEP infrastructure; Entra joined on-prem SSO (NDES three templates) |
| 22 | Custom PKCS template | PKCS row | added (new); verified | PKCS profiles |
| 23 | Router (Offline request) | Router row | added (new); purpose verified | Template table |
| 24 | Subordinate Certification Authority used to sign BYOCA | SubCA row | added (new); verified | Configure BYOCA, Step 2; template table |
| 25 | Key Recovery Agent; CA Exchange | KRA row | added (new); purposes verified | Template table |
| 26 | Directory E-mail Replication | DER row | added (new); purpose verified | Template table |
| 27 | WHfB certificate trust template; cloud Kerberos trust needs no certs (B02); SRO unsupported scenario | WHfB row | added (new); B02 Ch04 verified fact linked; SRO limitation verified | B02 Ch04; Staged Rollout page |
| 28 | Guide Priority values (High/Medium/Low/N/A) | All rows | carried as program priorities | Guide Appendix B |
| 29 | Readiness checklist (four conditions) | What to check | restated-as-design | Program design (Ch07 wave 4) |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Appendix B matrix, column "ADCS Template" | Matrix "AD CS template" | — |
| Column "Purpose" | Matrix "Purpose" | Purposes checked against Microsoft's default template table |
| Columns "Migration Path" | Matrix "Class" | Corrected rows per claims 5–7, 11, 16–19 |
| Columns "Cloud PKI Equivalent" and "Intune Profile Type" | Matrix "Target issuer and profile" (merged) | — |
| Column "Priority" | Matrix "Priority" | — |
| Column "Dependencies" | Matrix "Dependencies and notes" | — |
| Column "Status" (Not Started / Retain / Retire) | Not carried | Per-estate tracking; Appendix B tells readers to keep status in the program tracker |
| All 15 template rows | Matrix rows (User; Computer; Web Server; Smartcard Logon/User; DC/DC Authentication; Kerberos Authentication; RAS and IAS; Exchange User; Code Signing; Basic EFS; EFS Recovery Agent; OCSP Response Signing; Enrollment Agent; IPSEC (Offline request)) | Smartcard User and Smartcard Logon merged into one row; Domain Controller split from Kerberos Authentication; nine rows added |
