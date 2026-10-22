# Verification — Chapter 06 — Device and User Certificates: Intune and Entra CBA

File covered: `06-device-and-user-certificates.md`.
Diagram sources: `docs/images/diagrams/b07-pki/src/ch06-delivery-paths.flow.yaml`, `ch06-cba-sign-in.seq.yaml`.
Source: `docs/operational-guides/pki-modernization.md` §6 (6.1–6.5) and §7 (7.1–7.5). Microsoft sources opened through the Microsoft Learn MCP tools (search and fetch) and WebFetch on October 20, 2026. Consistency checked against Book 03 Ch 09, Book 05 Ch 08–10, Book 02 Ch 04 and Book 07 Ch 04.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CBA validates against trusted CAs, checks CRL, maps via username binding; it isn't a CA | Two jobs | verified | CBA technical concepts; consistent with B02 Ch04 |
| 2 | Trusted root profile: export DER `.cer` (guide said Base-64) | Trusted cert profile | corrected | Learn, Trusted root certificate profiles |
| 3 | Deploy trusted profile to same groups as SCEP/PKCS; SCEP references it, PKCS references the CA server; profile failure if root not trusted | Trusted cert profile | verified | Trusted root certificate profiles |
| 4 | Windows destination stores: computer root, computer intermediate, user intermediate (guide: Trusted Root only, plus macOS/Android stores) | Trusted cert profile | corrected (platform-specific stores dropped as unverified) | Trusted root certificate profiles |
| 5 | Trusted profile supports Linux (guide) | Trusted cert profile | corrected: Android, iOS/iPadOS, macOS, Windows | PKCS profiles page (trusted certificate profile platforms) |
| 6 | Profile only for root/intermediate certificates | Trusted cert profile | verified | Trusted root certificate profiles |
| 7 | BYOCA: trusted profile for every CA in private chain plus BYOCA issuing CA, every platform | Trusted cert profile | verified | Configure Cloud PKI BYOCA, Step 4 |
| 8 | SCEP: device generates key; private key never leaves device | SCEP | verified | Cloud PKI overview, Architecture A2 |
| 9 | Guide: "Intune generates and submits the CSR on behalf of the device" | SCEP with Cloud PKI | corrected: device creates CSR | Cloud PKI overview, A2 |
| 10 | Intune challenge encrypted/signed; RA rejects mismatched subject/SAN | SCEP | verified | Configure infrastructure to support SCEP (policy module); Cloud PKI overview A3 |
| 11 | Cloud PKI hosts CAs, SCEP RA, CDP, AIA; replaces on-prem CA, NDES, connector | Cloud PKI | verified | Cloud PKI overview |
| 12 | Leaf issuance only to Intune MDM-enrolled devices supporting SCEP; Android, iOS/iPadOS, macOS, Windows | Cloud PKI | verified | Cloud PKI overview, prerequisites/features |
| 13 | Intune supported platforms don't include Windows Server | Cloud PKI | verified | Intune supported operating systems page (Windows Server not listed); consistent with B05 Ch09/10 |
| 14 | Cloud PKI is SCEP-only, not a PKCS issuer | Cloud PKI | verified | Cloud PKI overview (end-entity issuance: SCEP only); consistent with B07 Ch04 |
| 15 | Three CAs per tenant, root/issuing/BYOCA all count | Cloud PKI | verified | Cloud PKI overview, known issues |
| 16 | EKUs fixed at creation; no Any Purpose; EKU mismatch fails; don't mix NDES and Cloud PKI SCEP URLs | Cloud PKI | verified | Configure BYOCA, Steps 1 and 5 |
| 17 | RSA 2048/3072/4096; SHA-256/384/512; licensed CAs on Azure Managed HSM; trial CAs software keys, not convertible | Cloud PKI | verified | Cloud PKI overview |
| 18 | CRL valid 7 days, republished every 3.5 days, updated on each revocation | Cloud PKI | verified | Cloud PKI overview; matches B03 Ch09 |
| 19 | Cloud PKI needs a subscription on top of Intune Plan 1/2 | Cloud PKI | verified | Cloud PKI overview, prerequisites |
| 20 | From July 2026 Microsoft 365 E5/E7 include Cloud PKI (commercial); Government plans planned to align subject to compliance | Cloud PKI | verified (new) | Intune planning guide Step 3; What's new, week of June 29, 2026 |
| 21 | Cloud PKI in GCC High (week of Sept 28, 2026); not in DoD | Cloud PKI | verified | What's new, week of Sept 28, 2026; Cloud PKI overview |
| 22 | AD CS SCEP requirements table (enterprise CA, NDES/connector server rules, reverse proxy passthrough, 403 on direct browse, template settings, Issue and Manage Certificates) | SCEP with AD CS | verified | Configure infrastructure to support SCEP |
| 23 | Guide: NDES "validates and forwards"; connector requirement for strong mapping v6.2406.0.1001+ | SCEP with AD CS | verified (version detail superseded, see 28) | SCEP infrastructure; connector overview |
| 24 | SCEP template "supply in request" is safe only with Enroll limited to NDES account (ESC1 link) | SCEP with AD CS | restated-as-design | Program hardening position; facts from SCEP infrastructure |
| 25 | NDES maps purpose to up to three templates; can't be clustered/load-balanced; multiple servers, Intune spreads requests | SCEP with AD CS | verified | Using Certificates for Entra joined on-premises SSO (Requirements, High Availability) |
| 26 | NDES RA certificates: CEP Encryption and Exchange Enrollment Agent (Offline request), Certificate Request Agent purpose | SCEP with AD CS | verified | Renewal of Enrollment Agent certificate used by NDES may fail |
| 27 | RA certificate expiry as a frequent outage cause | SCEP with AD CS | restated-as-design | Program operating experience; not presented as Microsoft fact |
| 28 | Guide: connector "v6.2406+" | Connector | corrected: six-month support lifecycle; current 6.2510.3.3007 (May 18, 2026); 6.2510.3.2002 (Feb 2026) blocks unknown SCEP extensions; 6.2406.0.1001 (Sept 2024) added KB5014754 support | Certificate Connector for Microsoft Intune (lifecycle; what's new) |
| 29 | Out-of-support connector functions up to 18 months; auto-update needs 443 to autoupdate.msappproxy.net; up to 100 instances; any PKCS instance handles any PKCS/revocation request | Connector | verified | Connector overview |
| 30 | PKCS: key generated on connector server; template must allow export; key non-exportable on device | PKCS | verified | Configure and use PKCS certificates |
| 31 | Guide: PKCS "scenarios requiring specific private key handling" | PKCS | restated: program prefers SCEP because PKCS key leaves the server | Design position based on claim 30 |
| 32 | PKCS template: subject in request, connector Read/Enroll, remove Domain Users | PKCS | verified | PKCS profiles, Configure certificate templates |
| 33 | PKCS template with Domain Users enrolled is an ESC1 finding | PKCS | restated-as-design | Links to B07 Ch03 |
| 34 | Imported PKCS for S/MIME, connector handles PFX | PKCS | verified | Connector overview capabilities |
| 35 | Exchange Signature Only for signing, Exchange User for encryption | PKCS | verified | PKCS profiles note |
| 36 | Guide use-case table rows (Wi-Fi, VPN, S/MIME, mTLS, CA device cert, wired 802.1X) | Use-case table | verified with corrections (wired 802.1X: workstations only; S/MIME split signing/encryption) | Cloud PKI overview; PKCS profiles |
| 37 | Guide rows: RADIUS NPS server cert via SCEP; RD Gateway via SCEP; App Proxy connector via PKCS from Cloud PKI | Use-case table | corrected/removed: server certificates; Intune doesn't manage Windows Server; Cloud PKI isn't a PKCS issuer | Intune supported platforms; Cloud PKI overview |
| 38 | Guide row: MDM enrollment bootstrap via SCEP | Use-case table | removed: not a certificate profile use case | Not supported by any Learn source found |
| 39 | Guide targeting by extensionAttribute2/3/6 | Use-case table | restated-as-design: targeting via governed dynamic groups (B05 Ch08) | Program design |
| 40 | Entra-joined devices don't support RADIUS auth using on-prem computer object; use Intune certs or user credentials | Use-case table | verified (new) | Plan your Microsoft Entra join implementation |
| 41 | KB5014754 strong mapping: SID extension OID 1.3.6.1.4.1.311.25.2 added for online templates after May 10, 2022; non-Microsoft CAs may not add it | Strong mapping | verified | KB5014754 |
| 42 | SAN URL tag `tag:microsoft.com,2022-09-14:sid:<value>` | Strong mapping | verified | SCEP infrastructure; SCEP profiles (KB5014754 section). Not present in KB text itself |
| 43 | altSecurityIdentities strong (IssuerSerialNumber recommended, reversed bytes; SKI; SHA1PublicKey) vs weak (IssuerSubject, SubjectOnly, RFC822) | Strong mapping | verified | KB5014754 |
| 44 | Guide: "As of February 2025, Windows enforces strong mapping" | Timeline | corrected: four phases (May 10 2022 compatibility; Apr 11 2023 Disabled ignored; Feb 11 2025 Full Enforcement default; Sept 9 2025 registry key unsupported) | KB5014754 (timeline, FAQ, change log Sept 9 correction) |
| 45 | As of Oct 2026 every current DC is in Full Enforcement with no way back | Timeline | verified (derived from claim 44) | KB5014754 |
| 46 | CertificateBackdatingCompensation applies only to weak mappings in compatibility mode | Timeline | verified | KB5014754 |
| 47 | Strong mapping applies to Intune user certs all platforms; device certs only Entra hybrid joined Windows; requires sync of SID | Intune needs | verified | SCEP profiles; PKCS profiles |
| 48 | Guide: Cloud PKI SCEP includes SID URI automatically, no configuration | Intune needs | corrected: add URI attribute with {{OnPremisesSecurityIdentifier}} | SCEP profiles (KB5014754 section and Create profile step) |
| 49 | Variable works only with URI attribute | Intune needs | verified | SCEP profiles |
| 50 | AD CS with KB5014754 supports the tag; third-party CAs may fail to issue | Intune needs | verified | SCEP infrastructure |
| 51 | Guide: PKCS connector "retrieves SID from Entra ID" | Intune needs | corrected: connector 6.2406.0.1001+, registry `EnableSidSecurityExtension`=1 under PFXCertificateConnector, restart two services; rollback steps | PKCS profiles |
| 52 | Guide: hybrid-joined devices need onPremisesSecurityIdentifier synced | Intune needs | verified | SCEP/PKCS profiles (users and devices synced from AD) |
| 53 | Logon certificates must come from a CA in NTAuth; enterprise CAs publish automatically | Intune needs | verified (new) | Guidelines for enabling smart card logon with third-party CAs |
| 54 | Microsoft recommends piloting and gradual rollout of SAN change | Intune needs | verified | Intune What's new, Notices (Plan for change: strong mapping) |
| 55 | Changing or updating a SCEP profile revokes certificates on Windows, iOS/iPadOS, macOS | Intune needs | verified (new) | Remove SCEP or PKCS certificates in Microsoft Intune |
| 56 | KDC events 39/40/41 (41/48/49 on 2008/2008 R2) in System log | Weak certificates | verified | KB5014754 |
| 57 | PowerShell sweep (Get-WinEvent by Id, filter provider matching 'Kdc') | Weak certificates | restated-as-design: illustrative read-only example, real cmdlet and parameters; provider name not hard-coded because KB names source "Kdcsvc" | Get-WinEvent standard parameters |
| 58 | CBA flow steps; certauth endpoints (.com / .us); PRT returned; single-factor gets second factor | CBA flow | verified | CBA technical concepts |
| 59 | Guide flow ordered token issuance before Conditional Access | CBA flow | corrected: MFA strength evaluated against CA requirement before sign-in completes | CBA technical concepts, step 8 |
| 60 | Allow certauth endpoint, turn off TLS inspection | CBA flow | verified | CBA technical concepts; how-to Step 2 note |
| 61 | PKI-based trust store: up to 250 CAs, 8 KB each, issuer hints, recommended over classic; Privileged Authentication Administrator; bulk upload needs P1/P2 | Trust store | verified (new) | Set up Microsoft Entra CBA, Step 1 |
| 62 | PKI-based store prioritized; sign-in log shows legacy store use | Trust store | verified | Set up Entra CBA, Step 1 |
| 63 | Guide: upload at "Security → Certificate authorities" | Trust store | corrected: PKI-based store; classic store is legacy | Set up Entra CBA |
| 64 | No CRL URL → revoked certificate still authenticates; Require CRL validation; exemptions | Trust store | verified | How-to Step 1; CRL concept page |
| 65 | Guide: "OCSP is supported if configured" | Trust store | corrected: Entra ID doesn't support OCSP | CRL concept page (item 6); matches B03 Ch09, B02 Ch04 |
| 66 | HTTP/HTTPS only, HTTP recommended, one CRL endpoint, 10-second download | Trust store | verified | CRL concept page |
| 67 | CRL size limits 20/45 MB interactive, 65/150 MB service | Trust store | verified | CRL concept page FAQ; matches B03 Ch09 |
| 68 | CRL caching; revoke sessions for immediacy | Trust store | verified | CRL concept page |
| 69 | Chain built on SKI/AKI; up to 10 CAs for CRL validation | Trust store | verified | CRL concept page |
| 70 | Adding a CA lets it authenticate any bindable user incl. synced; secure PKI; high affinity | Trust store | verified | Set up Entra CBA, Considerations |
| 71 | CA scoping: CA by SKI to one group; one group per CA; 30 rules; lockout risk | Trust store | verified (new) | CBA technical concepts, CA Scoping |
| 72 | Default binding SAN PN → userPrincipalName | Bindings | verified | Set up Entra CBA, Step 4 |
| 73 | Guide: Issuer + Subject is high affinity | Bindings | corrected: low affinity | CBA technical concepts binding table; matches B03 Ch09 |
| 74 | Guide binding table (8 rows incl. "SHA1 public key strongest uniqueness") | Bindings | consolidated: summary here, full table in B03 Ch09 | CBA technical concepts |
| 75 | Priority order; high-affinity requirement drops low-affinity bindings; next binding on no match | Bindings | verified | CBA technical concepts, multiple username binding rules |
| 76 | Priority not shown in admin center; Graph returns it | Bindings | verified | CBA technical concepts |
| 77 | Only as secure as lowest-affinity binding; at most one low-affinity binding | Bindings | verified | CBA technical concepts, secure configuration |
| 78 | Guide: high-affinity requires explicit admin action per certificate | Bindings | restated: values written by credential system issuance event (B03) | Program design per B03 Ch09 |
| 79 | Tenant-wide high affinity or global high-affinity rule can lock out users | Bindings | verified | Set up Entra CBA, Test the affinity binding |
| 80 | Default single-factor; rules by issuer, OID or both; Authentication Policy Administrator | MFA | verified | Set up Entra CBA, Step 3 |
| 81 | Guide: "set protection level per certificate issuer or policy OID" at Protection > Authentication methods | MFA | verified with precedence added | CBA technical concepts (rule precedence) |
| 82 | Conflicting OIDs → single-factor; derived credential with different OID doesn't inherit | MFA | verified | CBA technical concepts |
| 83 | All Issuance Policies must be 2.5.29.32.0 | MFA | verified | Set up Entra CBA, Step 3 |
| 84 | Multifactor only if PIN/biometric protected | MFA | verified | CBA technical concepts, Multifactor certificate authentication |
| 85 | Supported first/second factor combinations | MFA | verified | CBA technical concepts, MFA with single-factor CBA |
| 86 | Users in CBA scope are MFA-capable and can't register other methods; don't target All users; TAP/phone options | MFA | verified | Set up Entra CBA Step 2; technical concepts |
| 87 | Phishing-resistant MFA strength includes CBA, FIDO2, WHfB; custom strength with advanced options | Conditional Access | verified | CBA technical concepts |
| 88 | Conditional Access requires Entra ID P1 | Conditional Access | verified | Microsoft Entra licensing |
| 89 | Guide (App D): CBA requires P1 minimum | Conditional Access | corrected: CBA not P1-gated; PKI bulk upload and Conditional Access are | Set up Entra CBA; Entra licensing |
| 90 | Staged rollout: synced users, modern auth only; temporary, not permanent mixed state | Staged rollout | verified | Staged Rollout page (overview, supported scenarios, FAQ) |
| 91 | 10 groups per feature; no nested/dynamic; 200 users on first add; changes up to 24 h; cloud groups recommended | Staged rollout | verified (guide's "10–20 users", "200 users per wave, 48 hours" kept only as program pacing) | Staged Rollout page |
| 92 | One more federated sign-in on add; TAP workaround | Staged rollout | verified (new) | Staged Rollout page |
| 93 | Hybrid Identity Administrator; Entra ID > Entra Connect > Connect sync | Staged rollout | verified (guide path corrected) | Staged Rollout page |
| 94 | Password sign-in in CBA staged rollout needs PHS (guide: "PHS as fallback") | Staged rollout | verified | Migrate from federation to Entra CBA |
| 95 | Separate groups for staged rollout and CBA method policy | Staged rollout | verified (new) | Migrate from federation to Entra CBA |
| 96 | WHfB hybrid certificate trust with federation RA / smart card users unsupported in staged rollout | Staged rollout | verified (new) | Staged Rollout page, unsupported scenarios |
| 97 | Keep user enabled for CBA after removal from SRO to refresh PRT | Staged rollout | verified (new) | Staged Rollout page, Remove a user |
| 98 | Guide: users "authenticate at login.microsoftonline.com, no longer redirected to ADFS" | Staged rollout | verified | Migrate from federation to Entra CBA |
| 99 | Guide: "Convert using Update-MgDomain or the admin center" | Staged rollout | verified (detail in Ch07) | Migrate from federation to cloud authentication |
| 100 | Guide: monitor sign-in logs "authentication method X.509 Certificate" | Staged rollout | restated: verify certificate binding and authentication level in sign-in log Additional Details | CBA technical concepts, sign-in logs |
| 101 | AD FS-only-for-CBA estates; credential and PKI unchanged; PKI owners keep control | AD FS migration | verified | Migrate from federation to Entra CBA, FAQ |
| 102 | Sync altSecurityIdentities to certificateUserIds via Connect rules; Hybrid Identity Administrator | AD FS migration | verified | Migrate from federation to Entra CBA |
| 103 | Connect server admins can change synced attribute values | AD FS migration | verified | Migrate from federation to Entra CBA |
| 104 | Staged rollout users in federated domain remain exposed to federation compromise | AD FS migration | verified | Migrate from federation to Entra CBA, FAQ |
| 105 | Get-MgDomainFederationConfiguration; customized settings; AD FS Rapid Restore Tool; export relying party trust | AD FS migration | verified | Migrate from federation to cloud authentication, prerequisites |
| 106 | Guide: domain conversion is "one-way" | AD FS migration | corrected: reversible via New-MgDomainFederationConfiguration; Update-MgDomain -AuthenticationType "Managed" | Migrate from federation to cloud authentication (plan the project; implement) |
| 107 | Guide: maintain AD FS 30 days post-conversion | AD FS migration | restated-as-design (Ch07 wave 5) | Program design |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §6 intro (three profile types) | Ch06 "Two jobs" and section openings | — |
| §6.1 Trusted Root Certificate Profile | Ch06 "The trusted certificate profile comes first" | Corrected (claims 2–5) |
| §6.2 SCEP intro | Ch06 "SCEP profiles" | — |
| §6.2.1 SCEP with Cloud PKI | Ch06 "SCEP with Microsoft Cloud PKI" | Corrected CSR claim; constraints, licensing, cloud availability added |
| §6.2.2 SCEP with On-Premises ADCS | Ch06 "SCEP with AD CS through NDES and the Certificate Connector"; "Keep the connector current" | Version claim updated |
| §6.3 PKCS Certificate Profile (incl. PKCS Imported) | Ch06 "PKCS and imported PKCS profiles" | — |
| §6.4 Strong Mapping Enforcement (callout, SAN URI format, impact by profile type) | Ch06 "Strong certificate mapping (KB5014754)" | Timeline and profile requirements corrected |
| §6.5 Certificate Use Case Mapping table | Ch06 "Which profile for which use" | Server rows and MDM bootstrap removed (claims 37–38); Ch07 covers server certificates |
| PKI-002 diagram placeholder (Cloud PKI architecture) | Not carried here | Cloud PKI architecture diagram belongs to Ch04 (ch04-cloud-root-vs-byoca); Ch06 has ch06-delivery-paths |
| Recommendation callout after §5 (BYOCA vs Cloud root) | Not carried here | §5 content; Ch04 owns it |
| §7 intro | Ch06 "Entra certificate-based authentication" | — |
| §7.1 Authentication Flow | Ch06 "How a CBA sign-in works" + ch06-cba-sign-in diagram | Ordering corrected (claim 59) |
| PKI-003 diagram placeholder (CBA flow) | Replaced by ch06-cba-sign-in.seq.yaml | — |
| §7.2 Certificate-to-User Binding Methods table + High-Affinity callout | Ch06 "Username bindings and affinity" (summary; full table in B03 Ch09) | Issuer+Subject affinity corrected |
| §7.3 Single-Factor vs Multi-Factor CBA | Ch06 "Single-factor and multifactor certificates"; "Conditional Access" | — |
| §7.4 Staged Rollout Methodology (steps 1–9) | Ch06 "Staged rollout" (program sequence) | Limits corrected; navigation paths updated |
| §7.5 Migration from ADFS CBA | Ch06 "Migrating from AD FS certificate authentication" | "One-way" corrected; rollback detail in Ch07 wave 5 |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | Caption spells out the per-row mapping on Windows Server 2008 R2 SP1 and 2008 SP2 (39 as 41, 40 as 48, 41 as 49); a new sentence warns that ID 41 means a SID mismatch on later versions and no strong mapping on 2008/2008 R2, and says to add 48 and 49 to the sweep for 2008-era domain controllers | Finding weak certificates (lines 166–168) | verified | <https://support.microsoft.com/en-us/topic/kb5014754-certificate-based-authentication-changes-on-windows-domain-controllers-ad2c23b0-15d8-4340-a468-4d4f3b188f16> |
| RF-2 | OCSP bullet footnoted with `[^c06-ocsp]`, quoting "We don't support Online Certificate Status Protocol (OCSP)" (CBA overview) and the stated reason (CRL page) | The trust store (line 210) | verified | <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication>; <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> |

The chapter file is CRLF; it was edited with CRLF preserved.

## Consistency fixes, 2026-10-21

Cross-chapter consistency pass. Every changed external fact was re-checked on the primary source on 2026-10-21; program decisions are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| CF-1 | Server-certificate cross-reference now points to Chapter 04 (where the decision is made) and Chapter 07 (coexistence) | Constraints, first bullet | wording-only | — |
