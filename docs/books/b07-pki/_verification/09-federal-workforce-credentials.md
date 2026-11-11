# Verification — Chapter 09, Federal Workforce Credentials: PIV, Derived PIV and Cloud Authentication

Checked November 2, 2026. A new chapter, not a conversion: there's no source guide, so there's no carry-forward ledger.
Inputs read first: Book 07 `index.md`, `_BRIEF.md`, Chapters 04, 05, 06 and 08; the HR-Driven Identity guide's Gates 5
and 6 (`docs/books/guides/hr-driven-identity-implementation.md`); the HR workbook's Chapter 05, Certificate-Based
Authentication Checks; Book 03 Chapter 09; and the federal framework crosswalk's HSPD-12, FIPS 201 and M-19-17 rows.
Every external source below was opened on November 2, 2026. PDFs (FIPS 201-3, M-19-17, M-22-09) were downloaded and
their text extracted to check section numbers and wording.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | HSPD-12 dated August 27, 2004; common identification standard for employees and contractors; four "secure and reliable" criteria; physical and logical access | HSPD-12 and FIPS 201-3 | verified | DHS, HSPD-12 page |
| 2 | FIPS 201-3 final, January 2022 (supersedes 201-2); meets HSPD-12 objectives; covers proofing, interoperability, issuer accreditation | same | verified | CSRC FIPS 201-3 page; PDF abstract |
| 3 | M-19-17: HSPD-12 remains policy; FIPS 201 remains standard; PIV as "primary means"; PIV credential as aggregate output; identity rather than credential lifecycle | same | verified | M-19-17 §III (PDF text) |
| 4 | Minimum keys on the card: PIV auth, card auth; signature and key management unless no government email at issuance | PIV authentication certificate | verified | FIPS 201-3 §4.2.2 |
| 5 | PIV auth key generated on card, non-exportable, contact/virtual contact only, not contactless; cert carries FASC-N and card UUID in SAN; expires no later than card; optional background investigation indicator | same | verified | FIPS 201-3 §4.2.2.1 |
| 6 | Cert asserts `id-fpki-common-authentication`; issuing CAs participate in Common Policy hierarchy managed by the FPKIMA; CAs agency-run or outsourced | same | verified | FIPS 201-3 §5.1–5.2.1 |
| 7 | Card authentication key usable contactless without PIN | same | verified | FIPS 201-3 §4.2.2.2 |
| 8 | Multifactor only for certs protected by PIN or biometric | same | verified | Learn, CBA technical concepts |
| 9 | Give multifactor to the PIV authentication policy only | same | restated-as-design | Program position |
| 10 | Issuance only after proper authority, identity verified, vetted; two identity source documents, one federal or state government picture ID | Lifecycle table | verified | FIPS 201-3 §2.1 |
| 11 | Tier 1 minimum; with no prior investigation, initiate and complete FBI NCHC favorably before issuance; final determination to Central Verification System | Lifecycle table | verified | FIPS 201-3 §2.2 |
| 12 | Accredited issuers only; card valid no more than six years | Lifecycle table | verified | FIPS 201-3 §2.8 |
| 13 | Reissuance reasons; no full re-proofing if biometric enrollment record held; adjudicative authorization for later expiry or changed data | Lifecycle table | verified | FIPS 201-3 §2.9.1 |
| 14 | Termination triggers; collect/destroy or revoke PIV auth and card auth (and signature, key management) certs; update CVS and CMS; invalidate derived; 18 hours | Lifecycle table; leaver gate | verified | FIPS 201-3 §2.9.4 |
| 15 | M-19-17: timely revocation of access and credentials on separation | Leaver gate | verified | M-19-17 §III item 2 |
| 16 | Entra CRL caching; no OCSP; revoke sessions on revocation | Leaver gate | verified | Learn, Entra CBA CRL |
| 17 | Derived PIV: definition; SP 800-63B post-enrollment binding; independent notification; AAL2 or AAL3, AAL2-only at AAL2; only the home agency binds; invalidation triggers incl. card termination; revoke cert if key can't be zeroized | Derived PIV | verified | FIPS 201-3 §2.10–2.10.2 |
| 18 | SP 800-157 (Dec 2014) is the current final; no successor listed | Derived PIV | verified | CSRC SP 800-157 page (history: final 12/19/14 only) |
| 19 | SP 800-157 Rev. 1 is a final public draft, November 14, 2024; comments closed January 10, 2025; no final as of Nov 2, 2026 | Derived PIV | verified | CSRC SP 800-157 Rev. 1 FPD page; a /r1/final URL returned 404; CSRC search found no final |
| 20 | Rev. 1 draft: PKI and non-PKI derived credentials; attributes from PIV identity account; AAL2 or AAL3 and IAL3; no repeat proofing | Derived PIV; 800-63-4 table | verified | pages.nist.gov 800-157r1, Introduction |
| 21 | Configure to the 2014 final until the revision is published | Derived PIV | restated-as-design | Program position |
| 22 | M-19-17 requires agencies to use derived PIV and make apps and devices accept it | When they're used | verified | M-19-17 §III item 2 |
| 23 | Card readers optimized for desktops; derived PIV typical on mobile; requires a PIV credential | same | verified | Phishing-Resistant Authenticator Playbook v1.1 |
| 24 | M-22-09: PIV "including Derived PIV" simplest path | same | verified | M-22-09 §A (PDF text) |
| 25 | Intune derived credentials implement SP 800-157; one issuer per tenant; deleting issuer breaks credentials; platforms; profile types | Intune and Entra | verified | Learn, Use derived credentials with Intune |
| 26 | Supported issuer names not listed in the chapter | same | restated-as-design | The issuer is a procurement decision; the chapter names none |
| 27 | Entra CBA on iOS supports on-device and derived PIV certificates; Safari and MSAL/Authenticator apps; iOS lacks hardware-protected keys out of the box | same | verified | Learn, CBA on iOS and macOS |
| 28 | Derived credential with a different policy OID doesn't inherit the card's multifactor rule | same | verified | Learn, CBA technical concepts (authentication binding example) |
| 29 | Give the derived credential its own rule; multifactor only if AAL3; CA scoping | same | restated-as-design | Program position |
| 30 | IA-2(12) text: "Accept and electronically verify Personal Identity Verification-compliant credentials" | Acceptance, not replacement | verified | SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog |
| 31 | Non-PIV phishing-resistant authenticators permitted where PIV impractical, centrally managed | same | verified | M-22-09 §A |
| 32 | One CRL endpoint per CA, HTTP(S), HTTP recommended; 10 CAs; 10 seconds; 20 MB / 45 MB; Require CRL validation | Four settings | verified | Learn, Entra CBA CRL |
| 33 | IDManagement.gov CBA guide v2.0 (reviewed March 17, 2026) points to the Federal PKI list of PIV issuing CAs; recommends keeping default single-factor; low-affinity PrincipalName binding | Four settings; playbooks | verified | IDManagement.gov CBA on Entra guide |
| 34 | Binding affinity classes | Four settings | verified | Learn, CBA technical concepts |
| 35 | Built-in Phishing-resistant MFA strength = WHfB or platform credential, FIDO2, multifactor CBA; single-factor CBA in no built-in strength | Four settings | verified | Learn, Conditional Access authentication strengths |
| 36 | Custom strength advanced options: issuer and policy OID for CBA | Four settings | verified | Learn, custom authentication strengths |
| 37 | M-22-09: phishing-resistant MFA for staff, contractors, partners; app layer; discontinue SMS, voice, OTP, push for routine self-service | M-22-09 | verified | M-22-09 §A, Actions 2 |
| 38 | Learn's M-22-09 page lists Entra CBA incl. PIV, CAC, derived PIV | M-22-09 | verified | Learn, Meet MFA requirements of M-22-09 |
| 39 | FCPCAG2 root/trust anchor; Federal Bridge CA G4; cross-certified CAs audited annually; NFIs and PIV-I; FPKIMA operates both; not in Microsoft, Mozilla, Apple stores by default | Federal PKI trust | verified | IDManagement.gov FPKI 101 |
| 40 | Agencies cross-certified with Bridge or Common Policy may assert mapped policies | Federal PKI trust | verified | FIPS 201-3 §5.2.1 |
| 41 | M-19-17: accept and electronically verify other agencies' PIV rather than issue new; cross-government federation and agreements | Another agency's PIV | verified | M-19-17 §III item 3 |
| 42 | IA-8(1) text | same | verified | SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog |
| 43 | FIPS 201-3: direct acceptance possible; federation "the recommended interoperability mechanism for most agencies"; RP never sees the credential; stable identifier; IAL, AAL, FAL known to RP; derived credentials often verifiable only by issuer | same | verified | FIPS 201-3 §3.3, §7.1–7.3 |
| 44 | SP 800-217 final public draft November 14, 2024; no final | same | verified | CSRC SP 800-217 FPD page; /final URL returned 404 |
| 45 | Program federates rather than trusting other agencies' issuing CAs | same | restated-as-design | Program position |
| 46 | Cross-tenant inbound trust settings; MFA/device claims not trusted by default; organizational settings override defaults; P1 needed in the configuring tenant; audit category `CrossTenantAccessSettings`; Microsoft cloud settings for commercial–Azure Government; no cross-cloud B2B direct connect | Federation | verified | Learn, Cross-tenant access overview |
| 47 | CBA counts toward external users' strength only when done in the home tenant; trust off means MFA in resource tenant | Federation | verified | Learn, Authentication and Conditional Access for External ID, Table 1 |
| 48 | Authentication strengths apply only to external users who authenticate with Entra ID; SAML/WS-Fed users get the MFA grant control | Federation | verified | same |
| 49 | SAML/WS-Fed IdP federation is for partners with their own IdP and no Entra presence; guest account still created | Federation | verified | Learn, SAML/WS-Fed IdP federation |
| 50 | Custom OIDC IdP federation applies to external tenants; workforce invited guests use Entra, MSA, OTP, Google, SAML/WS-Fed | Federation | verified | Learn, Supported features in workforce and external tenants; Add OIDC as an external IdP |
| 51 | Turn on MFA trust per partner tenant only; require phishing-resistant strength for guests; partner IdP's use of PIV established by agreement | Federation | restated-as-design | Program position |
| 52 | Enterprise SSO Playbook v1.3, March 18, 2026: federation definition; CIO-signed agreement; prefer OIDC; not policy | Playbooks | verified | IDManagement.gov SSO playbook |
| 53 | Cloud Identity Playbook v1.3, March 17, 2026: legal agreement and technical exchange; "A smart card is not automatically a PIV"; FPKIPA memorandum of agreement; not policy | Playbooks | verified | IDManagement.gov Cloud Identity playbook |
| 54 | Phishing-Resistant Authenticator Playbook v1.1, February 22, 2024: PIV "remains the primary authenticator for federal users"; alternatives incl. PIV-I | Playbooks | verified | IDManagement.gov altauthn playbook |
| 55 | SP 800-63-4 final, July 2025; supersedes 800-63-3; parts 63A-4, 63B-4, 63C-4 | 800-63-4 | verified | CSRC SP 800-63-4 page (history entry for the final: 07/31/25) |
| 56 | IAL3, AAL2, AAL3, FAL1–3 definitions | 800-63-4 table | verified | pages.nist.gov SP 800-63-4 base volume |
| 57 | Smart cards among multifactor cryptographic hardware that can meet AAL3 FIPS 140 requirements | 800-63-4 | verified | Learn, NIST AAL3 with Entra ID |
| 58 | IA-2(12), IA-5(2), IA-8, IA-8(1), IA-8(2), IA-12, PS-4, AC-2, CM-8, SC-17, IA-2(1), IA-2(2), IA-5 in the Moderate baseline | Evidence | verified | NIST OSCAL Moderate profile, release 5.2.0, last modified Oct 22, 2026 |
| 59 | KSI pairings: IA-5(2) → KSI-IAM-APM, IAM-ELP, IAM-SNU, SVC-ASM; SC-17 → SVC-ASM; CM-8 → PIY-GIV; AC-2 → IAM-APM, IAM-JIT, IAM-SNU, IAM-SUS; IA-2 strength evidence → IAM-APM | Evidence | verified (repository mappings) | Book 13, Appendix A (rows IA-5(2), SC-17, CM-8, AC-2); Book 04, Chapter 10 (KSI-IAM-APM) |
| 60 | IA-2(12), IA-5, IA-8, IA-8(1), IA-8(2), IA-12, PS-4: no pairing in the repository's verified mappings | Evidence | verified (repository mappings) | Book 13, Appendix A and Book 04, Chapter 10 have no rows for them |
| 61 | Which record supports which control | Evidence | restated-as-design | Program reading |

## Not verified, or left open

- **SP 800-157 Rev. 1 and SP 800-217 finals.** Both are final public drafts from November 14, 2024. If NIST publishes either,
  the derived PIV and federation sections need a recheck; the crosswalk's status column already marks Rev. 1 as a draft.
- **Intune derived credential issuers in GCC High.** Learn's derived credentials page wasn't checked for a
  government-cloud availability row; the chapter makes no cloud-availability claim for it.
- **FedRAMP's own KSI page lists more pairings** than the repository's verified mappings: IA-8 under KSI-IAM-APM, IA-12
  under KSI-IAM-AAM, and PS-4 under KSI-IAM-ELP, KSI-IAM-JIT and KSI-IAM-SUS; it lists no indicator for IA-2(12) or
  IA-8(1). The chapter follows the instruction to use only the repository mappings and writes "no indicator pairing in
  this repository's verified mappings" for those rows. Adding IA-8, IA-12 and PS-4 rows to Book 13, Appendix A would let
  a later edit fill them.
- **Windows sign-in with PIV after AD.** The Cloud Identity Playbook says there's currently no replacement for PIV desktop
  authentication without an AD domain. The chapter doesn't take that up; Book 02 and Chapter 07 cover the domain's
  retirement.

## Diagram

`docs/images/diagrams/b07-pki/src/ch09-piv-under-cloud.flow.yaml`, rendered in WSL with `scripts/diagrams/render.py --only
ch09-piv-under-cloud` to `svg/` and `png/` (under 800 px wide).

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language): the page now says what the mechanism supports or provides evidence for, not that it satisfies a control or requirement. No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| So the requirement and the configuration meet in one place: | So the requirement and the configuration come together in one place: | no source change |

## Learn citations, November 9, 2026

Learn coverage pass (citations for Microsoft Learn identity pages the chapter already covered, plus small additions). Pages read on 2026-11-09 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | Entra CBA on Android supports on-device and derived PIV certificates in MSAL or Authenticator apps; smart cards and security keys from supported vendors only | Derived PIV, Entra ID accepts it | verified (sentence added) | `c09-cba-android`: Learn, "Microsoft Entra certificate-based authentication on Android devices" (read Nov 9, 2026) |
| L2 | FIDO2 security keys are device-bound passkeys; the private key never leaves the key | Require the phishing-resistant strength | verified (sentence added) | `c09-passkeys`: Learn, "Authentication methods in Microsoft Entra ID - passkeys (FIDO2)" and "Sign in with a FIDO2 security key" (read Nov 9, 2026) |

## Zero Trust Assessment closure additions (Nov 11, 2026)

Added for the Zero Trust Assessment closure update (the Book 07 part of CM-03). Each row uses the verification-log row from [Book 00, Appendix D](../../b00-orientation/appendix-d-control-states-and-evidence.md#block-verification-row). Learn pages were read on the date shown; `ms.date` wasn't exposed by the fetch tool, so the read date is the date recorded.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| Z1 | Zero Trust checks: privileged accounts have phishing-resistant methods registered; privileged roles targeted with phishing-resistant Conditional Access | Administrators: the PIV certificate | verified | Learn, Configure Microsoft Entra for Zero Trust: Protect identities and secrets | Nov 11, 2026 |
| Z2 | Emergency access accounts: passkey (FIDO2) recommended, CBA if the organization has a PKI; excluded from blocking policies | Administrators table | verified | Learn, Manage emergency access accounts in Microsoft Entra ID | Nov 11, 2026 |
| Z3 | CBA and Conditional Access available in Azure for US Government | Applies | verified | Learn, Microsoft Entra feature availability | Nov 11, 2026 |
| Z4 | Admin binding on the cloud-only admin account; strength restricted to PIV issuer and OID; emergency accounts on a different method | Administrators table | restated-as-design | Program design on Book 04 Chapters 04 and 07 | Nov 11, 2026 |
| Z5 | authenticationMethod reads X.509 Certificate for CBA sign-ins; KQL and Graph checks | Evidence queries | restated-as-design (query shape is the program's) | Program design | Nov 11, 2026 |
