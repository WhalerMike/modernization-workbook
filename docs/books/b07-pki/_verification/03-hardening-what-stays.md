# Verification — Chapter 03 — Hardening What Stays

File covered: `03-hardening-what-stays.md`.
Diagram sources: `docs/images/diagrams/b07-pki/src/ch03-esc-control-points.flow.yaml`, `ch03-ca-audit-path.flow.yaml`.
Source: `docs/operational-guides/pki-modernization.md` §3 (ESC assessment, 3.1–3.9), §11 (Security Hardening, 11.1–11.3), and the closing Compliance Amendment (FIPS/HSM). Microsoft sources opened through the Microsoft Learn MCP tools (fetch or search excerpt) on October 20, 2026; non-Microsoft sources by WebFetch/WebSearch the same day.

Defensive framing: every ESC class is written as description (one sentence), detection and remediation. No exploitation steps, no offensive tooling, no attack walkthroughs. The guide's per-class PowerShell detection scripts and its Appendix C module are not reproduced (archive, pending technical review). The only commands included are Microsoft-documented read-only checks and Microsoft-documented remediations (`certutil -getreg`, `-setreg` to clear ESC6 / set ESC11 / set AuditFilter, `-viewstore`).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A CA can create credentials the whole environment trusts; one over-privileged account can weaken policy and issue | Intro | verified | Learn, "Secure, delegate, and audit certification authority administration" |
| 2 | BYOCA issuing CA is anchored to (chains to) the private/AD CS CA | Intro | verified | Learn, "Microsoft Cloud PKI deployment for Microsoft Intune" |
| 3 | Critical/High gate before migration | Gate | restated-as-design | Program rule carried from guide §3 callout |
| 4 | Guide's PowerShell module not reproduced; archived pending review | Gate | restated-as-design | Book brief |
| 5 | ESC names from SpecterOps 2021 "Certified Pre-Owned" (Schroeder, Christensen), June 17, 2021 | Taxonomy | verified | specterops.io/research/certified-pre-owned (taxonomy names only) |
| 6 | Defender for Identity uses ESC labels in certificate assessments | Taxonomy | verified | Learn, "Security assessment: Certificates" |
| 7 | Template assessments for all AD CS customers; CA assessments need sensor on AD CS server | Taxonomy | verified | Learn, "Defender for Identity's security posture assessments" |
| 8 | MDI GCC: security.microsoft.com, GCC sensor endpoint; features in gov clouds within 90 days; preview may not be supported | Taxonomy | verified | Learn, "Defender for Identity for US Government offerings" |
| 9 | ESC1 and ESC6 assessments labeled Preview | Taxonomy | verified | Learn, "Security assessment: Certificates" |
| 10 | ESC1 description, MDI assessment name, remediation options (turn off Supply in the request, remove auth EKUs, restrict enroll, manager approval, unpublish) | ESC1 | verified | Learn, "Security assessment: Certificates" |
| 11 | Supply in the request = SubjectNameEnrolleeSupplies 0x1 in msPKI-Certificate-Name-Flag | ESC1 | verified | Learn, X509CertificateTemplateSubjectNameFlag enumeration; ms-PKI-Certificate-Name-Flag attribute |
| 12 | OIDs Client Auth 1.3.6.1.5.5.7.3.2; Any Purpose 2.5.29.37.0 | ESC1 | verified | Any Purpose OID: Learn, Cloud PKI configure-ca; Client Auth OID: standard OID retained from guide (also in Learn certificate docs) |
| 13 | Event 4886 request received; 4887 approved and issued | ESC1, audit | verified | Learn, "Audit Certification Services"; "Secure, delegate, and audit…" |
| 14 | Guide: "monitor non-matching SANs via 4887" | ESC1 | restated-as-design | Reframed as requester/subject correlation by the program |
| 15 | Template guidance: extra review for requester-supplied subject; validate identity values | ESC1 | verified | Learn, "Manage AD CS certificate templates on an enterprise CA" |
| 16 | ESC2 definition: no EKU or Any Purpose and enrollable by unprivileged users | ESC2 | corrected | Learn, "Security assessment: Certificates". Guide flagged every no-EKU template regardless of enrollment rights |
| 17 | ESC2 remediation: restrict permissions, manager approval, signing requirements | ESC2 | verified | same |
| 18 | ESC3 MDI assessment and remediation list incl. CA enrollment agent restrictions | ESC3 | verified | same |
| 19 | Treat enrollment agent cert as impersonation capability; separate from certificate managers; positive/negative tests; no WS2025 step-by-step for EA restrictions | ESC3 | verified | Learn, "Secure, delegate, and audit…" |
| 20 | ESC4 two assessments (ACL, owner); remediation | ESC4 | verified | Learn, "Security assessment: Certificates" |
| 21 | 5136 logged on DCs only with Audit Directory Service Changes and matching SACL | ESC4, ESC5 | verified | Learn, "Windows security baseline" (DS Access) |
| 22 | Separate template admin from enrollment; grant CA computer account Read if Authenticated Users removed | ESC4 | verified | Learn, "Manage AD CS certificate templates…" |
| 23 | ESC5 definition | ESC5 | verified | SpecterOps (class name/definition) |
| 24 | NTAuthCertificates and Enrollment Services object roles | ESC5 | verified | Learn, "Monitor AD CS publication health with Enterprise PKI" |
| 25 | MDI has no ESC5 assessment; covers ESC1–4, 6–8, 11, 15 | ESC5 | verified | Learn, "Security assessment: Certificates" (full page read) |
| 26 | `certutil -viewstore -enterprise NTAuth` | ESC5 | verified | Learn, certutil reference |
| 27 | Don't delete stale Public Key Services objects without approved plan | ESC5 | verified | Learn, "Monitor AD CS publication health…" |
| 28 | Guide ESC5 remediation "Enterprise Admins, Domain Admins, CA service account" | ESC5 | restated-as-design | Program baseline: Enterprise Admins + CA computer accounts |
| 29 | ESC6 definition; affects all templates | ESC6 | verified | Learn, "Security assessment: Certificates"; "Manage AD CS certificate templates…" |
| 30 | `certutil -getreg policy\EditFlags` syntax | ESC6 | verified | Learn, certutil reference (-getreg) |
| 31 | Remediation command `-setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2` then restart | ESC6 | verified | Learn, "Security assessment: Certificates" |
| 32 | Guide: "KB5014754 restricts SAN override behavior" | ESC6 | corrected | KB5014754: SID extension 1.3.6.1.4.1.311.25.2; Full Enforcement Feb 11, 2025; registry value unsupported after Sept 9, 2025. It reduces Kerberos impact but doesn't change CA behavior |
| 33 | ESC7 definition: Manage CA / Manage Certificates rights; examples | ESC7 | verified | Learn, "Security assessment: Certificates" |
| 34 | Default enterprise CA admins: local Administrators, Enterprise Admins, Domain Admins | ESC7 | verified | Learn, "Secure, delegate, and audit…" |
| 35 | 4882, 4890, 4892 meanings | ESC7, audit | verified | same |
| 36 | Role model (CA admin, cert manager, EA, auditor, backup custodian, KRA); named accounts | ESC7 | verified | same |
| 37 | Issue and Manage Certificates = certificate manager role; issue/deny/revoke/reinstate without Manage CA | ESC7 | verified | Learn, "Review and dispose of pending certificate requests" |
| 38 | Intune Certificate Connector account needs Issue and Manage Certificates to revoke | ESC7 | verified | Learn, "Configure infrastructure to support SCEP with Intune" |
| 39 | Guide ESC7 detection: `certutil -getreg CA\Security` dump | ESC7 | removed | Replaced by MDI assessment, Security tab review, event alerts |
| 40 | ESC8 definition: NTLM without HTTPS or EPA on CES/Certsrv | ESC8 | verified | Learn, "Security assessment: Certificates" |
| 41 | MDI ESC8 detection alert (machine certificate issuance abuse) | ESC8 | verified | Learn, "Defender for Identity alerts in Microsoft Defender format" |
| 42 | KB5005413: EPA Required (recommended), CES web.config extendedProtectionPolicy Always, Require SSL, iisreset; restrict NTLM; Negotiate:Kerberos | ESC8 | verified | Microsoft Support, KB5005413 |
| 43 | Guide listed NDES among ESC8 endpoints | ESC8 | restated-as-design | KB5005413 covers Web Enrollment and CES only; program applies same controls to NDES |
| 44 | Cloud PKI needs no NDES or connector | ESC8 | verified | Learn, Cloud PKI overview |
| 45 | ESC11 IF_ENFORCEENCRYPTICERTREQUEST on by default, command to set | Beyond ESC8 | verified | Learn, "Security assessment: Certificates" |
| 46 | ESC15 / CVE-2024-49019 remediation | Beyond ESC8 | verified | same |
| 47 | CA audit filter + Audit Certification Services both needed; GPO path; AuditFilter 127; restart; start/stop category delay | Audit | verified | Learn, "Secure, delegate, and audit…" |
| 48 | MDI sensor docs require same auditing | Audit | verified | Learn, "Configure Windows event auditing" (MDI) |
| 49 | Baseline event table (4870, 4882, 4885–4888, 4890, 4892, 4896, 4897) | Audit | verified | Learn, "Secure, delegate, and audit…" |
| 50 | 4871/4872 CRL events; 4898 template loaded | Audit | verified | same; "Audit Certification Services" |
| 51 | WEF baseline includes 4886–4888; WEF doesn't enable auditing; size local log | Audit | verified | Learn, "Secure, delegate, and audit…" |
| 52 | Guide residual list "Event IDs 4886, 4887, 4888" | Residual | verified | same |
| 53 | Risk levels, migration-blocker, priorities | Matrix | restated-as-design | Program scoring from guide §3.9 |
| 54 | ESC2 "Domain compromise: Yes" | Matrix | corrected | Downgraded to "Possible" per Microsoft's ESC2 description |
| 55 | MDI assessment column | Matrix | verified | Learn, "Security assessment: Certificates"; posture overview |
| 56 | MDI scores/status update every 24 hours | Matrix | verified | Learn, "Security assessment: Certificates" |
| 57 | Removing template from issuance list = usual first rollback | Residual | verified | Learn, "Manage AD CS certificate templates…" |
| 58 | Entra CBA fails if CRL unreachable | Residual | verified | Learn, Entra CBA CRL page |
| 59 | `certutil -verify -urlfetch` on a schedule shorter than renewal windows | Residual | verified | Learn, "Monitor AD CS publication health…" |
| 60 | Backup-CARoleService backs up DB and private key; protect; isolated restore | Residual | verified | Learn, "Secure, delegate, and audit…" |
| 61 | Hardened management host; avoid interactive sign-in; separate custody | Residual | verified | same |
| 62 | CA servers are Tier 0 | Residual | restated-as-design | Program designation |
| 63 | Network isolation of CA RPC | Residual | restated-as-design | Program control (guide §11.3) |
| 64 | FIPS 140-2/140-3 modules, HSM non-exportable keys, dual control (SC-12, SC-13) | Residual | restated-as-design | Guide's Compliance Amendment; program requirement |
| 65 | Cloud PKI RBAC permissions; scope tags | Cloud PKI | verified | Learn, Cloud PKI overview |
| 66 | Intune Administrator has built-in CA permissions | Cloud PKI | verified | Learn, "Configure root and issuing CA for Microsoft Cloud PKI" |
| 67 | Guide: "Intune PKI Administrator roles" | Cloud PKI | corrected | No such built-in role; custom roles |
| 68 | Guide: use PIM for JIT CA management | Cloud PKI | restated-as-design | Program assigns custom roles via privileged access (Book 04) |
| 69 | EKUs fixed at CA creation; Any Purpose not supported | Cloud PKI | verified | Learn, configure-ca; configure-byoca |
| 70 | Guide: TPM-backed keys on Windows and macOS | Cloud PKI | corrected | KSP setting applies to Windows only (SCEP profile doc) |
| 71 | Guide: 4096-bit RSA for Tier 0 | Cloud PKI | corrected | On Windows 4096-bit keys only in software KSP, not TPM/WHfB; program uses 2048 in TPM |
| 72 | SCEP validity up to 24 months; at least five days | Cloud PKI | verified | Learn, SCEP profile doc |
| 73 | Guide: 2 years for infrastructure certificates | Cloud PKI | corrected | Cloud PKI issues only to Intune-enrolled devices |
| 74 | Guide: "Certificate Transparency" monitoring | Cloud PKI | corrected | Reporting dashboard (24 h) and audit logs |
| 75 | Guide: alerts on unexpected issuance volume | Cloud PKI | restated-as-design | Program monitoring (Ch 08), not a native alert |
| 76 | Trial CAs software keys, not convertible | Cloud PKI | verified | Learn, Cloud PKI overview |
| 77 | High/low affinity binding classification | CBA | verified | Learn, Entra CBA technical concepts |
| 78 | Authentication strength advanced options: issuers and policy OIDs, max five each | CBA | verified | Learn, "Create and manage custom Conditional Access authentication strengths" |
| 79 | Require CRL validation | CBA | verified | Learn, Entra CBA CRL page (consistent with Book 03 Ch 09) |
| 80 | One HTTP CDP per CA; no OCSP/LDAP | CBA | verified | Learn, "What is Microsoft Entra CBA?" |
| 81 | Guide: "CRL pre-fetching in Entra" | CBA | removed | No such documented setting |
| 82 | Guide: CRL refresh no more than 24 hours | CBA | restated-as-design | Program requirement; caching behavior verified on CRL page |
| 83 | CA scoping GA April 2026; one group per CA; 30 rules; lockout risk | CBA | verified | Learn, Entra CBA technical concepts; Entra what's new (April 2026) |
| 84 | Guide: remove decommissioned CA certificates from Entra | CBA | restated-as-design | Program decommissioning step (Ch 08) |
| 85 | Guide: CBA + compliant device CA policy | CBA | restated-as-design | Program pattern |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §3 intro (ESC from SpecterOps 2021) | "The ESC taxonomy" | — |
| §3 Migration Gate callout | "The migration gate" | — |
| §3.1 ESC1 table, detection script, remediation | "ESC1" | Detection script not carried (archived with Appendix C module pending technical review); replaced by MDI assessment and manual checks |
| §3.2 ESC2 | "ESC2" | Script not carried (also flagged no-EKU templates regardless of enrollment rights) |
| §3.3 ESC3 | "ESC3" | Script not carried |
| §3.4 ESC4 | "ESC4" | Script not carried |
| §3.5 ESC5 | "ESC5" | Script not carried |
| §3.6 ESC6 | "ESC6" | Detection reduced to read-only `certutil -getreg`; KB5014754 claim corrected |
| §3.7 ESC7 | "ESC7" | `certutil -getreg CA\Security` dump replaced by MDI assessment and event alerts |
| §3.8 ESC8 | "ESC8" | IIS detection script not carried; remediation aligned to KB5005413 |
| §3.9 ESC Risk Scoring Matrix | "The risk-scoring matrix" | ESC2 compromise column corrected; MDI column added |
| §11.1 Cloud PKI Hardening | "Hardening Microsoft Cloud PKI" | Role name, macOS TPM, 4096-bit, infrastructure validity and "certificate transparency" corrected |
| §11.2 Entra CBA Hardening | "Hardening Entra certificate-based authentication" | "CRL pre-fetching" removed; CA scoping added |
| §11.3 Residual ADCS Hardening | "Hardening the AD CS that remains" | — |
| Compliance Amendment (FIPS 140, HSM CA keys, SC-12/SC-13) | "Hardening the AD CS that remains" (Protect the CA keys) | Cloud PKI key custody covered in Chapter 04 |
| §13 cross-reference rows for §3 and §11 | Not carried | Pointers to companion guides outside this book; replaced by book cross-links |
| Appendix A checklist | Not carried here | Context only; Appendix A writer owns it |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | CRL wording "HTTP (or HTTPS; HTTP recommended)"; `[^c03-cba-crl]` added beside `[^c03-cba-overview]` | Make revocation real (line 263) | verified (same source conflict as Chapter 02, noted in the footnote) | <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> |
| RF-2 | Duplicate footnotes for the configure-ca page merged: `[^c03-cpki-scep-eku]` removed, its one use (line 57) now cites `[^c03-cpki-configure]`, whose annotation now quotes the Intune Administrator and Any Purpose EKU text | Footnotes | verified (page re-opened; quotes checked) | <https://learn.microsoft.com/intune/cloud-pki/configure-ca> |

## Corrections, October 23, 2026 (federal-sources inventory)

Found by the workbook-wide sweep of federal citations for the Federal Framework Crosswalk; each was checked against the primary source on October 23, 2026.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 'FIPS 140-2 or 140-3' modules for every CA | Protect the CA keys | corrected: 140-3 for new CAs; 140-2 modules on retained CAs are existing systems (Historical List after Sept 21, 2026) | NIST CMVP project page; B14 Ch02 |
