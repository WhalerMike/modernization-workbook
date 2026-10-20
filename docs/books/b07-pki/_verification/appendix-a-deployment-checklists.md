# Verification — Appendix A — Cloud PKI and CBA Deployment Checklists

File covered: `appendix-a-deployment-checklists.md`.
Diagrams: none.
Source: `docs/operational-guides/pki-modernization.md` Appendix A (Cloud PKI Deployment Checklist, 30 rows) and Appendix D (Entra CBA Configuration Checklist, 20 rows). Microsoft sources opened through the Microsoft Learn MCP tools and WebFetch on October 20, 2026.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Guide A-1: "Intune Suite or standalone Cloud PKI license" | A.1 #1 | corrected: add-on to Intune Plan 1/2, or M365 E5/E7 (commercial, from July 2026); GCC confirm | Cloud PKI overview; Intune planning guide; What's new June 29, 2026 |
| 2 | Add-ons visible at Tenant administration > Intune add-ons | A.1 #1 | verified | Use Microsoft Intune Suite add-on capabilities (search result) |
| 3 | Three-CA limit | A.1 #3 | verified (new row) | Cloud PKI overview |
| 4 | CA properties fixed; no Any Purpose | A.1 #4 | verified (new row) | Configure BYOCA |
| 5 | HSM-backed licensed vs trial software keys | A.1 #5 | verified | Cloud PKI overview |
| 6 | Guide A-4: "Generate CSR for Cloud Issuing CA" (all models) | A.1 #6 | corrected: CSR only for BYOCA; cloud root signs issuing CA in Intune | Configure BYOCA; Cloud PKI overview |
| 7 | Sign with Subordinate Certification Authority template; export chain .p7b | A.1 #7 | verified | Configure BYOCA, Step 2 |
| 8 | Upload signed cert and chain; status Active; External root CA | A.1 #8 | verified | Configure BYOCA, Step 3 |
| 9 | CDP/AIA hosted by Intune; BYOCA parent AIA from private CA, AD CS default LDAP | A.1 #9 | verified | Cloud PKI overview; Configure BYOCA |
| 10 | Guide A-9: export root as Base-64 | A.1 #11 | corrected: DER `.cer` for trusted certificate profiles (Cloud PKI accepts both for BYOCA upload) | Trusted root certificate profiles; Configure BYOCA |
| 11 | Trusted profiles per platform, per CA in BYOCA chain | A.1 #13 | verified | Configure BYOCA, Step 4 |
| 12 | Guide A-12: assign trusted root to All Devices | A.1 #14 | restated: assign to every group receiving dependent profiles (Microsoft guidance) | Trusted root certificate profiles |
| 13 | Guide A-22: Cloud PKI root via GPO in Scale | A.1 #16 | moved to Foundation (program rule: trust before issuance) | Program design |
| 14 | NTAuth decision and `certutil -dspublish NTAuthCA` | A.1 #17 | verified (new row) | certutil reference; NTAuth KB |
| 15 | Guide A-14: connector v6.2406+ | A.1 #18 | corrected: current supported release; placement constraints (not issuing CA, not DC, not with Intune Connector for AD) | Connector overview; SCEP infrastructure |
| 16 | Connector status location; Warning/Error | A.1 #19 | verified | Connector overview |
| 17 | SCEP profile: link root trusted profile; SCEP URI; keep {{CloudPKIFQDN}}; EKU on CA; no NDES URLs | A.1 #21 | verified | Configure BYOCA, Step 5 |
| 18 | {{OnPremisesSecurityIdentifier}} URI; new profile because editing revokes | A.1 #22 | verified (new row) | SCEP profiles; Remove SCEP or PKCS certificates |
| 19 | Guide A-24–A-30 cutover/decommission rows | A.1 #28–30 | carried; decommission detail deferred to Ch08 | Program design; Ch08 |
| 20 | Guide A-30 owner "the Federal Modernization Program Lead" | A.1 | restated as program lead / owner roles per Ch05 | — |
| 21 | Guide D-1: CBA requires P1; P2 for PIM | A.2 #1 | corrected: CBA not P1-gated; CA needs P1; bulk PKI upload needs P1/P2; PIM irrelevant | Entra licensing; Set up Entra CBA |
| 22 | Guide D-1 verification: SkuPartNumber AAD_PREMIUM | A.2 #1 | corrected: check service plans for AAD_PREMIUM so bundles are counted | Program design (Get-MgSubscribedSku standard properties) |
| 23 | Guide D-2: SID sync required for certificateUserIds population | A.2 #2 | corrected: certificateUserIds write path is admin center/Graph (cloud) or Entra Connect (synced); SID matters for Intune strong mapping (Ch06) | Set up Entra CBA, Test username binding; certificateUserIds (via B03 Ch09) |
| 24 | certauth endpoints and TLS inspection | A.2 #4 | verified (new row) | CBA technical concepts |
| 25 | Guide D-4: Security → Certificate authorities; verify with Get-MgOrganizationCertificateBasedAuthConfiguration | A.2 #5 | corrected: PKI-based trust store (Privileged Authentication Administrator); Graph beta endpoint for verification; classic cmdlet applies to classic store only | Set up Entra CBA, Step 1 |
| 26 | Guide D-5: CRL must be internet-accessible; HEAD returns 200 | A.2 #6 | verified; size, 10 s, no OCSP added | CRL concept page |
| 27 | Require CRL validation | A.2 #7 | verified (new row) | CRL concept page |
| 28 | CA scoping | A.2 #8 | verified (new row) | CBA technical concepts |
| 29 | Guide D-9: pilot group 10–20 users | A.2 #9 | carried (program); separate groups; no nested/dynamic | Migrate from federation to Entra CBA; Staged Rollout page |
| 30 | Guide D-6: enable CBA at Protection > Authentication methods > Policies; verify with Get-MgPolicyAuthenticationMethodPolicyAuthenticationMethodConfiguration 'X509Certificate' | A.2 #10 | verified (path updated to Entra ID > Authentication methods > Certificate-based authentication); don't target All users | Set up Entra CBA, Step 2 |
| 31 | Guide D-7: start PrincipalName→UPN, add SKI/SHA1PublicKey; high-affinity higher priority | A.2 #11 | verified with corrections: at most one low-affinity binding; priority via Graph; Issuer+Subject low | CBA technical concepts |
| 32 | Guide D-8: smart card = multifactor; per issuer/OID | A.2 #12 | verified; precedence added | Set up Entra CBA Step 3; CBA technical concepts |
| 33 | Guide D-11: PHS as fallback | A.2 #13 | verified | Migrate from federation to Entra CBA |
| 34 | Guide D-10: Entra Connect > Staged rollout; verify Get-MgPolicyFeatureRolloutPolicy where DisplayName matches | A.2 #14 | corrected: Hybrid Identity Administrator; current path; limits; verify by feature value `certificateBasedAuthentication` (evolvable enum, Prefer header) | Staged Rollout page; featureRolloutPolicy resource |
| 35 | TAP for first sign-in | A.2 #15 | verified (new row) | Staged Rollout page |
| 36 | Guide D-12: test at login.microsoftonline.com via "Use a certificate or smart card" | A.2 #16 | verified (My Apps portal as in Microsoft's test) | Set up Entra CBA, Step 5 |
| 37 | Guide D-13: token check `"amr": ["x509"]` at jwt.ms | A.2 #16 | removed: not a documented test; sign-in log Additional Details used instead | CBA technical concepts, sign-in logs |
| 38 | Guide D-14: 200 users/wave, 48 h, <1% failure | A.2 #17 | restated: <1% is program gate; staged rollout limits and test-only nature verified | Staged Rollout page |
| 39 | Tenant-wide high affinity lockout risk | A.2 #18 | verified (new row) | Set up Entra CBA |
| 40 | Guide D-15: Get-MgDomainFederationConfiguration backup | A.2 #19 | verified | Migrate from federation to cloud authentication |
| 41 | Guide D-16: convert to managed; Get-MgDomain AuthenticationType Managed | A.2 #20 | verified; Update-MgDomain command and rollback added | Migrate from federation to cloud authentication |
| 42 | Guide D-17, D-18: disable AD FS CBA rules; remove staged rollout groups | A.2 #21–22 | carried; PRT refresh caveat added | Staged Rollout page |
| 43 | Guide D-19: CA policy requiring CBA strength with compliance; Get-MgIdentityConditionalAccessPolicy | A.2 #23 | verified (authentication strength options) | CBA technical concepts |
| 44 | Guide D-20: alert >5 failures/15 min | A.2 #24 | restated-as-design; CRL error codes verified | CRL concept page (AADSTS500173, AADSTS2205012) |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Appendix A — Cloud PKI Deployment Checklist, rows 1–30 | Appendix A, checklist A.1 (#1–30) | Rows 3, 4, 17, 22 new; guide rows 4–6 recast for BYOCA only; row 22 (GPO root) moved to Foundation; rows 24–30 consolidated into #28–30 with Ch08 reference; Status column replaced by Verification column (status tracked in the program tracker) |
| Appendix D — Entra CBA Configuration Checklist intro ("follow in order") | Appendix A, A.2 lead-in | — |
| Appendix D rows 1–20 | Appendix A, checklist A.2 (#1–24) | Rows 4, 7, 8, 15, 18 new; row 13 token check replaced (claim 37) |
| Document Version Control callout and footer (after Appendix D) | Not carried | Document metadata of the archived guide; not content |
