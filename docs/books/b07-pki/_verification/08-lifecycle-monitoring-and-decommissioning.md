# Verification — Chapter 08, Lifecycle, Monitoring and Decommissioning

Checked October 20, 2026. Sources: `docs/operational-guides/pki-modernization.md` §9 Phase 6 (Decommission), §10
(Monitoring, Compliance, and Drift Detection), §12 (Troubleshooting Reference), and the Compliance Amendment (SC-12/SC-13);
`docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md` "Certificate Lifecycle Automation" sections and
the NIST control-closure table (stay in place; linked).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SC-081v3 adopted April 11, 2025; 398 days stepping down March 2026 to March 2029 | Renewal at scale | verified | CA/B Forum ballot page |
| 2 | 200 days from 2026-03-15; 100 from 2027-03-15; 47 from 2029-03-15 | Renewal at scale | verified (corrects Vol I Book 03's "first reductions in 2026" to exact dates) | CA/B Forum BRs §1.2.2 |
| 3 | Align internal lifetimes; no class depends on memory | Renewal at scale | restated-as-design | Program model |
| 4 | Renewal threshold semantics (20 = renew at 80%); SCEP renewal generates new key pair | Engines table | verified | Learn, Create and assign SCEP profiles |
| 5 | iOS/iPadOS/macOS renewal only in threshold window, device unlocked; expired cert remains, no retrigger; exclude to reissue | Engines; troubleshooting | verified | same |
| 6 | Guide: "default 20%" renewal | Troubleshooting | corrected (Intune doc gives 20 as an example; 20 is the documented default only for the Configuration Manager cmdlet) | Learn, SCEP profiles; New-CMCertificateProfileScep |
| 7 | ACME RFC 8555; http-01 and dns-01 | ACME | verified | RFC 8555 |
| 8 | Cloud PKI only SCEP RA; no ACME | ACME | verified (SCEP is the only enrollment path documented) | Learn, Overview of Cloud PKI |
| 9 | CyberArk Self-Hosted ACME: http-01/dns-01; tested with certbot, win-acme, acme.sh; win-acme needs FIPS mode disabled on server | ACME | verified | CyberArk docs 26.1, ACME integration |
| 10 | CyberArk Self-Hosted automates provisioning, discovery, monitoring, validation; heterogeneous CAs | CLM | verified | CyberArk docs 26.1, Introduction |
| 11 | Microsoft CA template object; Microsoft CA support; account permissions | CLM | verified | CyberArk docs 26.1, Microsoft ADCS CA template |
| 12 | SaaS marketed as NGTS after acquisition; Self-Hosted keeps name | CLM | verified | Palo Alto NGTS Certificate Manager page |
| 13 | Two-renewal-window expiry analytic; unknown certificate = drift | CLM; drift | restated-as-design | From Vol I Book 03 (program doctrine; linked) |
| 14 | Revocation not instantaneous; revoked cert usable until fresh CRL | Revocation | verified | Learn, Operate certificate revocation, CRL publication, and CDP changes |
| 15 | Base/delta, overlap, size from measurements; offline root: no delta, witnessed base CRL | CRLs that stay | verified | same |
| 16 | Monitor delivery chain; alert before next update; never strand old CDP; reason codes; hold is reversible | CRLs that stay | verified | same |
| 17 | PKIView early warning; doesn't replace relying-party validation | CRLs that stay | verified | Learn, Monitor AD CS publication health with Enterprise PKI |
| 18 | Entra CBA: one CDP, HTTP(S) only, no OCSP or LDAP | Entra CBA | verified | Learn, What is Entra CBA (Unsupported scenarios) |
| 19 | Prefer HTTP over HTTPS for CRL | Entra CBA | verified | Learn, Entra CBA CRL |
| 20 | 20 MB public / 45 MB US Gov; 10 seconds; CBA fails if CRL can't download | Entra CBA | verified (consistent with Book 03 Ch09) | same |
| 21 | No CRL URL: revoked certs don't fail | Entra CBA | verified | Learn, How to configure CAs for CBA |
| 22 | Cloud PKI CRL valid 7 days, 3.5-day republish, updated per revocation | Entra CBA | verified (consistent with Book 03 Ch09) | Learn, Overview of Cloud PKI |
| 23 | Manual revoke with active SCEP assignment reissues | Entra CBA; troubleshooting | verified | Learn, Monitoring for Cloud PKI |
| 24 | Intune certificates report at Devices > Monitor > Certificates | Monitoring | verified | Learn, Intune Reports |
| 25 | Cloud PKI dashboard counts; details within 24 hours | Monitoring | verified | Learn, Monitoring for Cloud PKI |
| 26 | Connector event ID ranges; Warning/Error status; six-month support lifecycle | Monitoring; troubleshooting | verified | Learn, Certificate Connector for Microsoft Intune |
| 27 | Guide: connector "v6.2406+" | Drift; troubleshooting | corrected (6.2406.0.1001 added SID support; current is 6.2510.3.3007, May 18, 2026; versions supported six months) | same |
| 28 | AD CS audit event IDs 4870, 4882, 4885–4888, 4890, 4892, 4896, 4897; 4871/4872 CRL | Monitoring | verified (guide listed only 4886–4888) | Learn, Secure, delegate, and audit CA administration |
| 29 | Audit filter and Audit Certification Services both required; size the Security log | Monitoring | verified | same |
| 30 | Entra sign-in "Is Legacy Store Used"; audit log for trust store CRUD | Monitoring; drift | verified | Learn, Set up Entra CBA (Step 1) |
| 31 | MDI AD CS assessments ESC1–4, 6–8, 11, 15; CA assessments need sensor | Monitoring | verified | Learn, MDI Security assessment: Certificates; What's new archive; Security posture assessments |
| 32 | Intune custom compliance: script + JSON; feeds Conditional Access; Windows scripts every 8 hours | Compliance | verified | Learn, Custom compliance settings |
| 33 | Guide §10.2: "iOS/Android compliance policy checks for valid certificate profile deployment status" | — | removed | No such built-in compliance setting found on Learn |
| 34 | Strong mapping: SID extension OID 1.3.6.1.4.1.311.25.2; SAN URL tag format; OnpremisesSecurityIdentifier; users/devices synced | Drift; troubleshooting | verified | KB5014754; Learn, SCEP profiles; Configure infrastructure to support SCEP |
| 35 | Full Enforcement with Feb 2025 update; Compatibility mode option ended Sept 9, 2025; registry key unsupported after | Drift | verified | KB5014754 |
| 36 | KDC events 39 (no strong mapping, no SID), 41 (SID mismatch) | Drift; troubleshooting | verified | KB5014754 |
| 37 | Guide §12: "KDC_ERR_CLIENT_NAME_MISMATCH" | Troubleshooting | corrected (replaced with the KDC event IDs Microsoft documents) | KB5014754 |
| 38 | Guide §10.4 health function checked only SAN URL tag | Compliance | corrected (noted that AD CS uses the SID extension) | KB5014754 |
| 39 | Weekly evidence commit to assessments/pki/{domain}/{timestamp}/ | Persisting evidence | restated-as-design | Program model (from guide §10.5) |
| 40 | PKCS: CA FQDN/name; computer account Read and Enroll; "Denied by Policy Module"; event 1001 PkcsRequestFailure | Troubleshooting | verified | Learn, Troubleshooting PKCS; Connector logging |
| 41 | AADSTS50017 causes (missing CA, policy extensions) | Troubleshooting | verified | Learn, AADSTS50017 |
| 42 | AADSTS220501 (CRL inaccessible/expired; Next Update); AADSTS500179 (timeout/size) | Troubleshooting | verified | Learn, AADSTS220501; Entra CBA CRL error reference |
| 43 | MFA via protection level on issuer/policy OID rule | Troubleshooting | verified | Learn, Set up Entra CBA (Step 3) |
| 44 | Guide: "Intune Suite license expired" | Troubleshooting | corrected to "Cloud PKI license" (subscription on top of Intune Plan 1/2) | Learn, Overview of Cloud PKI |
| 45 | Guide: "Publish CRL via Azure App Proxy" | Troubleshooting | removed (unverified; Entra needs an internet-facing HTTP CDP, HTTP preferred) | Learn, Entra CBA CRL |
| 46 | Connector: autoupdate.msappproxy.net:443; health events 5000–5002 | Troubleshooting | verified (guide's "*.manage.microsoft.com" generalized to Intune endpoints) | Learn, Certificate Connector overview and prerequisites |
| 47 | NDES SCEP failure after CA renewal: RA certs reference old CA | Troubleshooting | verified | Learn, SCEP deployment fails after you renew the CA certificate |
| 48 | NDES app pool account needs Read and Enroll | Troubleshooting | verified | Learn, Connector prerequisites |
| 49 | Gate: Phase 5 complete, 30-day rollback window, retained classes documented; rollback ≈ a working day (guide: 8–12 h) | Decommissioning | restated-as-design | Program model |
| 50 | Revoke with cessation of operation; CRL lifetime longer than remaining life of revoked certs; publish; deny pending | Decommissioning | verified | Learn, KB 889250 decommission procedure |
| 51 | Backup-CARoleService from CA-admin account; separate password custody | Decommissioning | verified | Learn, Secure, delegate, and audit CA administration |
| 52 | Web enrollment uninstalled first; Enterprise Admins needed; reconfigure Online Responder | Decommissioning | verified | KB 889250 |
| 53 | OCSP responder retires with last AD CS CA; Entra doesn't use OCSP; Cloud PKI lists no OCSP responder | Decommissioning | verified (Entra); restated from Cloud PKI feature list (CRL and AIA only) | Learn, What is Entra CBA; Overview of Cloud PKI |
| 54 | Uninstall removes only pKIEnrollmentService; AIA/CDP/CA objects remain for outstanding certs; NTAuth removal needs Enterprise Admin; templates only after all CAs gone | Decommissioning | verified | KB 889250 |
| 55 | Keep old CDP endpoints until no unexpired cert references them | Decommissioning | verified | Learn, Operate certificate revocation |
| 56 | DC cleanup procedure; not for v1 DC templates | Decommissioning | verified | KB 889250 |
| 57 | BYOCA anchors Cloud PKI issuing CA to private CA hierarchy | Decommissioning | verified | Learn, Overview of Cloud PKI |
| 58 | Guide: under BYOCA "do not revoke — the Issuing CA certificate chain is still in use" | Decommissioning | corrected (the CA that must stay is the one that signed Cloud PKI's issuing CA, not necessarily the retiring AD CS issuing CA) | Program analysis of the BYOCA model |
| 59 | IA-5(2)(a)(1)(2),(b)(1)(2), SC-12, SC-17(a)(b) control text | Evidence | verified | NIST SP 800-53 Rev. 5 via NIST OSCAL catalog |
| 60 | Cloud PKI SCEP private key created on device, never leaves | Evidence | verified | Learn, Overview of Cloud PKI (Architecture A2) |
| 61 | PKCS key generated on connector server; template must allow export | Evidence | verified | Learn, Configure and use PKCS certificates |
| 62 | Licensed Cloud PKI CAs use Azure Managed HSM keys; trial CAs software keys, can't convert | Evidence | verified | Learn, Overview of Cloud PKI |
| 63 | Managed HSM FIPS 140-3 Level 3 | Evidence | verified | Learn, What is Azure Key Vault Managed HSM |
| 64 | Guide amendment: AD CS CA keys in HSM, split knowledge/dual control | Evidence | restated-as-design | Program requirement |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| pki-modernization.md §9 Phase 6 Decommission (objective, prerequisites, steps 1–10, validation, rollback, duration) | This chapter, Decommissioning AD CS (merged with Microsoft's KB 889250 sequence; BYOCA caveat corrected) | Duration "8 weeks" folded into the program's phase plan in Chapter 07 |
| §9 Phases 1–5 | — | Chapter 07 (other writer) |
| §10 intro | This chapter, Monitoring | — |
| §10.1 Intune Certificate Dashboard | Monitoring table (Intune certificates report; Cloud PKI dashboard; corrected path) | — |
| §10.2 Certificate Compliance Policies | Compliance and drift detection, first subsection | iOS/Android "profile status" compliance claim removed (unverified) |
| §10.3 Drift Detection Patterns (5 rows) | Drift patterns table (all five carried, corrected, four rows added) | — |
| §10.4 PowerShell Health Functions (Get-FMPCertificateHealth, Test-FMPCertificateCompliance) | Described in prose only | Code not reproduced: held in the archive with Appendix C pending technical review; strong-mapping check incomplete |
| §10.5 Gitea Integration | Persisting the evidence (restated as program design) | Gitea named generically as the program's evidence repository |
| §12 Troubleshooting Reference (13 rows) | Troubleshooting reference (all 13 carried, condensed, corrected; three rows added) | — |
| Compliance Amendment, SC-12/SC-13 (FIPS, HSM) | Evidence table, SC-12 row | SC-13 FIPS validation detail belongs with hardening (Chapter 03/04) |
| Vol I Book 03, "Certificate Lifecycle Automation" (failure mode, arithmetic, automation stack, revocation in a short-lived world, telemetry as evidence) | Linked throughout; analytics restated as program design | Stays in place per brief |
| Vol I Book 03, NIST control closure (IA-5(2), SC-12, SC-17) | Evidence table; linked | Closure Necessity argument stays in place |

## Consistency fixes, 2026-10-21

Cross-chapter consistency pass. Every changed external fact was re-checked on the primary source on 2026-10-21; program decisions are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| CF-1 | Renewal engines: AD CS autoenrollment now covers domain controller certificates (which serve LDAPS); NPS and RADIUS server certificates move to the CyberArk row, per Chapter 04 | Renewal engines table | restated-as-design | Chapter 04 issuer decision |
| CF-2 | KDC event 41 caveat: IDs as stated hold from Server 2012 on; on 2008 R2 SP1 and 2008 SP2, 41 = no strong mapping and a SID mismatch is 49 | Revocation and strong mapping paragraph; troubleshooting row | verified | <https://support.microsoft.com/en-us/topic/kb5014754-certificate-based-authentication-changes-on-windows-domain-controllers-ad2c23b0-15d8-4340-a468-4d4f3b188f16> |
| CF-3 | CBA CRL troubleshooting row lists AADSTS220501, 500173, 500179, 2205012 and 2205014 with causes; all five exist with these meanings (Appendix A's 500173 and 2205012 were correct too) | Troubleshooting reference | verified | <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list#crl-error-reference>; <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts220501-unable-to-download-certificate-revocation-list> |
