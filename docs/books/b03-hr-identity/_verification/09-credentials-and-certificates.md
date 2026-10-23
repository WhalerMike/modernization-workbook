# Verification — Chapter 09, Credentials and Certificates Across Joiner, Mover, Leaver

File: `docs/books/b03-hr-identity/09-credentials-and-certificates.md`
Diagram sources: `docs/images/diagrams/b03-hr-identity/src/ch09-credential-assurance.flow.yaml`, `ch09-leaver-sequence.flow.yaml`
Verified: 2026-10-20. Every kept footnote was re-opened; all URLs resolved and support the sentences.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PIV authentication certificate "issued by the agency's CMS under the Federal PKI" | Why certificates | corrected: issued through the CMS by a CA operating under the Federal PKI Common Policy | FIPS 201-3 §5.1–5.2 |
| 2 | ILM Playbook: HR authoritative for creation and termination; Master User Record links attributes, entitlements, authenticators (PIV, FIDO2) | Why certificates | verified | idmanagement.gov/playbooks/ilm/ (Executive Summary) |
| 3 | Playbook is best practice, not policy | Why certificates | verified | ILM Playbook Disclaimer |
| 4 | Creation stage: IAL3 proofing per SP 800-63A-4 meets PIV eligibility; MUR; bind phishing-resistant authenticators; create accounts | Proofing | verified (playbook doesn't fix a strict order between binding and account creation; text doesn't claim one) | ILM Playbook Stage 1 |
| 5 | FIPS 201-3 establishes the PIV system under HSPD-12; January 2022; no newer revision | Proofing | verified | csrc.nist.gov/pubs/fips/201-3/final |
| 6 | SP 800-63-4 July 2025 supersedes 800-63-3 | Proofing | verified | csrc.nist.gov/pubs/sp/800/63/4/final |
| 7 | Without binding a PIV card is just a badge; same process for PKI and non-PKI derived authenticators | Proofing | verified; footnote section list now names "PIV Alternative Authenticators" | ILM Playbook |
| 8 | CBA validates against trusted CAs, checks CRL, maps via username binding; default SAN PN → userPrincipalName | Binding | verified | concept-certificate-based-authentication-technical-deep-dive |
| 9 | Binding table (7 fields, 4 low / 3 high affinity) | Binding | verified against Microsoft's table (the same page's prose says "three" low-affinity mappings, contradicting its own table of four; chapter follows the table) | technical-deep-dive |
| 10 | High-affinity = non-reusable identifiers; required high affinity removes low-affinity bindings | Binding | verified | technical-deep-dive |
| 11 | Tenant defaults: low affinity, single-factor | Binding | verified (added) | how-to-certificate-based-authentication (Step 3) |
| 12 | "Every card reissue or certificate renewal produces a new SKI, key hash or serial number" | Binding | corrected: reissue → new keys, SKI, SHA1PublicKey, serial; same-key renewal changes serial and SHA1PublicKey (which Microsoft defines as the certificate thumbprint), not necessarily SKI; "key hash" renamed | technical-deep-dive (SHA1PublicKey row); FIPS 201-3 §2.9.1 |
| 13 | FIPS 201-3: old card revoked when new card issued | Binding | verified (added) | FIPS 201-3 §2.9.1 |
| 14 | Populate only current valid certificate values; remove on expiry or revocation | Binding | verified (added) | concept-certificate-based-authentication-certificateuserids |
| 15 | Cloud-only: admin center or Graph, at least Privileged Authentication Administrator | Binding | verified | certificateuserids; how-to-certificate-based-authentication |
| 16 | Admin center: up to four values of 120 characters | Binding | verified | certificateuserids |
| 17 | Attribute limits: 10 values, 1,024 characters, unique per tenant | Binding | verified (added) | certificateuserids |
| 18 | "Microsoft's CertificateBasedAuthentication PowerShell module computes the value" | Binding | corrected: the Microsoft Entra PowerShell module's `Get-EntraUserCertificateUserIdsFromCertificate` cmdlet (cmdlet name confirmed on the page) | certificateuserids |
| 19 | Synced: only Entra Connect updates certificateUserIds; altSecurityIdentities via rules or AltSecId sync; Hybrid Identity Administrator | Binding | verified | certificateuserids; how-to-certificate-based-authentication |
| 20 | AD admins (delegated rights, Connect server admins) can change certificateUserIds for synced accounts | Binding | verified | certificateuserids |
| 21 | CRL checked during CBA; also chain CAs up to the root | Revocation | verified (chain detail added) | concept-...-certificate-revocation-list |
| 22 | No CRL configured → no revocation checking | Revocation | verified | how-to-certificate-based-authentication (Prerequisites) |
| 23 | Require CRL validation; exempt a CA while fixing | Revocation | verified | CRL page |
| 24 | CRL caching; delta CRLs; no OCSP; revoke tokens manually when immediate revocation is critical | Revocation | verified | CRL page |
| 25 | CRL limits 20 MB interactive / 65 MB service in Azure Global incl. GCC | Revocation | verified; added 45 MB / 150 MB for Azure Government (GCC High, DoD) | CRL page FAQ |
| 26 | Unreachable CRL endpoint → CBA fails | Revocation | verified | CRL page |
| 27 | FIPS 201-3: termination invalidates all derived PIV credentials | Derived PIV | verified | FIPS 201-3 §2.9.4, §2.10.2 |
| 28 | Derived PIV auth certificate revoked if key can't be zeroized | Derived PIV | verified (added) | FIPS 201-3 §2.10.2 |
| 29 | SP 800-157 Dec 2014 is the current final; Rev 1 final public draft Nov 14, 2024, non-PKI derived credentials | Derived PIV | verified still a draft as of 2026-10-20 (CSRC page lists FPD only; no final) | csrc.nist.gov/pubs/sp/800/157/final; .../r1/fpd |
| 30 | M-22-09 requires phishing-resistant MFA "for agency staff" | Assurance | corrected: for agency staff, contractors and partners | M-22-09 p. 5 |
| 31 | HR sponsors; PIV process performs proofing | Assurance | restated-as-design (consistent with FIPS 201-3) | — |
| 32 | Reissue on name or attribute change | Mover | verified (added FIPS cite) | FIPS 201-3 §2.9.1 |
| 33 | Card terminated when a contractor changes positions and no longer needs access | Mover | verified | FIPS 201-3 §2.9.4 |
| 34 | Cloud PKI can be the SCEP issuing CA | Devices | verified | learn.microsoft.com/intune/cloud-pki/ |
| 35 | Cloud PKI licensing (subscription beyond Intune P1/P2); GCC High yes, DoD no; CRL 7-day validity, 3.5-day publish, updated on every revocation | Devices | verified (added) | cloud-pki overview |
| 36 | Windows SCEP revoke/remove table (7 rows) | Devices | verified | .../device-configuration/certificates/remove-profiles |
| 37 | Third-party CA SCEP removed not revoked; PKCS revoked+removed on unenroll/wipe/retire | Devices | verified (macOS wipe caveat added) | remove-profiles |
| 38 | Retire or wipe before deleting the user | Devices | verified: Microsoft states this order explicitly (added) | remove-profiles (note) |
| 39 | Manual Cloud PKI revocation with active SCEP assignment → reissue; remove assignments | Devices | verified | .../intune/cloud-pki/monitor-certificates |
| 40 | Disable in AD for synced users; hybrid procedure resets password twice | Leaver step 1 | verified (password reset added) | .../entra/identity/users/users-revoke-access |
| 41 | Disable then revoke refresh tokens; no new tokens | Leaver step 2 | verified | users-revoke-access |
| 42 | Diagram/alt text: step 2 "ends issued tokens now" | Leaver step 2; ch09-leaver-sequence.flow.yaml | corrected: issued access tokens stay valid until expiry (1 h default) unless CAE; app session tokens end in the app; diagram node now "No new tokens from now on…" | users-revoke-access |
| 43 | Footnote title "Revoke user access in an emergency…" | Footnote | corrected to "Revoke user access in Microsoft Entra ID" | users-revoke-access |
| 44 | PIV revocation steps: collect/destroy, else revoke PIV auth + card auth, plus signature and key management certs | Leaver step 3 | verified; added "inform the CA", CVS update and FASC-N/UUID database update, which FIPS also requires | FIPS 201-3 §2.9.4 |
| 45 | 18 hours from notification when card can't be collected | Leaver step 3 | verified; added emergency-procedures clause | FIPS 201-3 §2.9.4 |
| 46 | Wipe needs device online | Leaver step 3 | verified | users-revoke-access (best practices) |
| 47 | Built-in leaver tasks cover groups, Teams, access packages, licenses, disable, revoke tokens, delete; none for PIV/device | LCW | verified | lifecycle-workflow-tasks |
| 48 | Real-time termination tutorial removes groups/Teams, deletes account | LCW | verified | tutorial-offboard-custom-workflow-portal |
| 49 | Custom task extension → consumption Logic App; Launch and wait; timeout = failed; third party can respond; system-assigned MI default | LCW | verified | lifecycle-workflow-extensibility |
| 50 | Tasks run by executionSequence; continueOnError controls stop | LCW | verified (added) | lifecycle-workflow-tasks (common parameters) |
| 51 | Delete user task doesn't support users with Entra role assignments or role-assignable group membership/ownership | LCW | verified (added) | lifecycle-workflow-tasks (Delete User) |
| 52 | Idempotent custom tasks, retry, exceptions | LCW | restated-as-design | — |
| 53 | PS-4 evidence intervals | Evidence | verified (PS-4 text added with footnote) | SP 800-53 Rev. 5 |
| 54 | "In this series" | Why certificates | edited to "In this book" (style) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | added `part: How`; `lifecycle_review` → 2027-04-01 |
| Title, thesis, "In this chapter" | kept | — |
| Why certificates need their own chapter | edited | Federal PKI issuance wording corrected; "series" → "book" |
| Figure ch09-credential-assurance | kept | source comment header renumbered Chapter 07 → 09 |
| Proofing and issuance | kept | footnote keys renamed |
| Binding the PIV certificate to the Entra user | edited | tenant defaults added; reissue/renewal wording corrected; FIPS reissue and Microsoft hygiene added; attribute limits added; PowerShell module corrected |
| Revocation checking | edited | chain checking and Azure Government limits added |
| Derived PIV credentials | edited | §2.10.2 revocation added; Rev 1 draft status reconfirmed |
| Assurance as data | edited | M-22-09 scope corrected |
| Mover | edited | FIPS reissue citation added |
| Device certificates | edited | Cloud PKI licensing/availability/CRL facts; macOS caveat; Microsoft's documented order |
| The canonical leaver sequence (steps 1–5, closing paragraph) | edited | hybrid password reset; token-expiry nuance; CVS and FASC-N/UUID updates; emergency clause |
| Figure ch09-leaver-sequence | edited | step 2 node body corrected; alt text matched; source header renumbered Chapter 07 → 09 |
| Running it from Lifecycle Workflows | edited | executionSequence/continueOnError; Delete user limitation |
| What the evidence must show | edited | PS-4 text and footnote added |
| Continue callout | edited | "Continue the book", "Book index" |
| Footnotes | edited | keys `c07-*` → `c09-*`; added SP 800-53 and Cloud PKI overview; titles and access dates updated |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
