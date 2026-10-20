# Verification — Chapter 07 — Coexistence and Migration

File covered: `07-coexistence-and-migration.md`.
Diagram sources: `docs/images/diagrams/b07-pki/src/ch07-trust-directions.flow.yaml`, `ch07-migration-waves.flow.yaml`.
Source: `docs/operational-guides/pki-modernization.md` §8 (8.1–8.5) and §9 (Phases 1–6). Microsoft sources opened through the Microsoft Learn MCP tools and WebFetch on October 20, 2026; CyberArk, Palo Alto Networks and SEC sources by WebFetch/WebSearch the same day. Consistency checked against Book 07 Ch 02, 03, 04, 05 and 08, Book 03 Ch 09 and Book 02 Ch 04.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Coexistence rules 1–5 | Two PKIs | restated-as-design | Program design; rule 4 carried from guide §8.5 |
| 2 | Guide: DC certificates must stay on AD CS because Cloud PKI can't issue KDC Authentication EKU | DC certificates | corrected reason: Cloud PKI issues only via SCEP to Intune-enrolled devices; Intune doesn't manage Windows Server (EKU claim not verified, dropped) | Cloud PKI overview; Intune supported OS |
| 3 | Kerberos Authentication template; DC and DC Authentication templates lack KDC Auth OID; required EKUs, DNS SAN, CRL/OCSP; supersede via autoenrollment | DC certificates | verified (new detail) | WHfB on-premises certificate trust deployment guide |
| 4 | Entra-joined devices can't read LDAP CRLs before auth; publish HTTP (not HTTPS) CDP first; delta CRL too | DC certificates | verified | Configure SSO for Microsoft Entra joined devices |
| 5 | Root on Entra-joined devices via Intune trusted certificate profile | DC certificates | verified | Configure and validate the PKI in a hybrid certificate trust model |
| 6 | Guide: DC templates classified BRIDGE; DC certs not affected by Intune | DC certificates | verified (consistent with Ch02 classes) | Ch02; Intune supported OS |
| 7 | Guide: LDAPS for cloud-consumed endpoints can move to Cloud PKI | LDAPS | corrected: LDAPS endpoints are servers; Cloud PKI doesn't issue to them | Cloud PKI overview |
| 8 | LDAPS certificate requirements; NTDS store preferred, no restart; random pick among several in computer store | LDAPS | verified | Configure certificates for LDAPS in AD DS; Enable LDAP over SSL with a third-party CA |
| 9 | Domain Controller template has LDAPS-ready properties | LDAPS | verified | Configure certificates for LDAPS |
| 10 | Server certificates (NPS, RD gateway, web, SQL, appliances) stay on AD CS/public CA during coexistence | Server certs | restated-as-design (based on claim 2 facts) | Program design; B06 Ch22 link |
| 11 | CyberArk Certificate Manager discovers certificates and renews before expiry | Server certs | verified | docs.venafi.com, CyberArk Certificate Manager - Self-Hosted Introduction |
| 12 | Palo Alto Networks completed CyberArk acquisition Feb 11, 2026 | Server certs | verified (new) | PANW press release, SEC Form 8-K Ex. 99.1 |
| 13 | Palo Alto presents CyberArk Certificate Manager as Next-Generation Trust Security, evolution of SaaS previously Venafi TLS Protect | Server certs | verified (new) | paloaltonetworks.com Next-Generation Trust Security page (redirect target of cyberark.com datasheet) |
| 14 | EAP server cert validated against trusted root; wireless expects FQDN in SAN | Server certs | verified | Certificate requirements for EAP-TLS/PEAP |
| 15 | Guide §8.3: AD CS root → Entra trust store | Trust | verified | Set up Entra CBA, Step 1 |
| 16 | BYOCA issuing CA must be installed on all relying parties | Trust | verified | Configure BYOCA, Step 4 |
| 17 | GPO path Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies > Trusted Root CAs | Trust | verified (guide path lacked "Policies") | Distribute certificates by using Group Policy |
| 18 | Intermittent untrusted roots when many roots distributed by GPO; workarounds | Trust | verified (new) | Valid root CA certificates distributed using GPO might intermittently appear as untrusted |
| 19 | certutil -dspublish RootCA / NTAuthCA | Trust | verified | certutil reference |
| 20 | Logon certificates need issuing CA in NTAuth; enterprise CAs auto-publish | Trust | verified (new) | Import third-party CA certificates into the Enterprise NTAuth store |
| 21 | Wi-Fi/VPN/mTLS certificates don't need NTAuth | Trust | restated-as-design | Derived: NTAuth governs logon/authentication certificates per source 20; scoped to AD logon |
| 22 | Guide: cross-forest — each forest root "trusted by Cloud PKI (via Entra upload)" | Trust | corrected: Cloud PKI doesn't trust CAs; Entra ID trust store does; per-forest distribution | Set up Entra CBA; Cloud PKI overview |
| 23 | CA scoping for multiple PKIs | Trust | verified | CBA technical concepts |
| 24 | Guide: Cloud PKI CRL hosted by Microsoft, auto-configured | CRL | verified (7 days / 3.5 days added) | Cloud PKI overview |
| 25 | BYOCA AIA from private CA; AD CS default LDAP AIA | CRL | verified | Configure BYOCA, Step 3 note |
| 26 | Entra CBA: HTTP/HTTPS only, HTTP recommended, no LDAP/OCSP, size limits, 10-second download | CRL | verified | CRL concept page |
| 27 | Guide: "OCSP is supported if configured" | CRL | corrected: not supported | CRL concept page |
| 28 | Guide: publish internal CDP through Azure Application Proxy | CRL | restated-as-design: anonymous HTTP endpoint instead (Entra must download unauthenticated within 10 s) | CRL concept page; program design |
| 29 | Entra uses CRL URL configured in trust store; new CDP appears only in newly issued certs | CRL | verified (trust store URL from how-to Step 1/CRL page); second half is standard X.509 behavior restated as design | Set up Entra CBA; CRL concept page |
| 30 | Guide §8.5 renewal rules (renew until migrated; new devices get Cloud PKI; cutover trigger) | Renewal | verified-as-design (carried) | Program design |
| 31 | Guide: set Cloud PKI validity ≥ remaining AD CS validity | Renewal | restated-as-design (replaced by overlap rule) | Program design |
| 32 | SCEP/PKCS validity not below five days | Renewal | verified | SCEP infrastructure (validity period) and PKCS profiles |
| 33 | Removing SCEP assignment / device leaving group revokes and removes on Windows | Renewal | verified | Remove SCEP or PKCS certificates |
| 34 | Cloud PKI in-place issuing CA renewal | Renewal | verified (new) | What's new, week of June 8, 2026 |
| 35 | Six phases, durations (4/4/8/12/8/8 weeks) and thresholds (99%, 95%, 200/48h, 30 days, 4 h, 8–12 h) | Playbook | restated-as-design (program planning figures) | Guide §9 |
| 36 | Phase 1 steps use Get-FMP* module functions (guide Appendix C) | Wave 1 | restated: module stays in archive pending technical review; steps described tool-neutrally; ESC checks per Ch03 | Brief rule |
| 37 | Guide prerequisite "Intune Suite license provisioned" | Wave 2 | corrected: Cloud PKI entitlement (add-on or E5/E7 commercial); see Ch06 | Cloud PKI overview; Intune planning guide |
| 38 | BYOCA signed with Subordinate Certification Authority template | Wave 2 | verified | Configure BYOCA, Step 2 |
| 39 | Guide: connector "v6.2406+" | Wave 2 | corrected: current release | Connector overview |
| 40 | Guide: deploy Cloud PKI root via GPO "to non-Intune devices" in phase 2 (and checklist placed it in Scale) | Wave 2 | carried in Foundation for all domain-joined relying parties | Program design (rule 2) |
| 41 | Deleting a Cloud PKI CA as last rollback step (3-CA limit; new keys) | Wave 2 | verified (limit) / design | Cloud PKI overview |
| 42 | Staged rollout limits in pilot (no nested/dynamic; 10 groups; 200 on first add) | Wave 3 | verified | Staged Rollout page |
| 43 | Guide: "devices fall back to ADCS auto-enrolled certificates" | Wave 3 rollback | verified with condition: only if AD CS certs still present; unassignment revokes cloud certs | Remove SCEP or PKCS certificates |
| 44 | Users return to federation after one more interactive sign-in; keep CBA enabled to refresh PRT | Wave 3 rollback | verified | Staged Rollout page |
| 45 | Guide: "200 users per wave, monitor 48 hours" | Wave 4 | restated: staged rollout is test-only with 10-group limit; cut over by domain | Staged Rollout page (FAQ, limits) |
| 46 | Get-MgDomainFederationConfiguration; export relying party trust; back up AD FS | Wave 5 | verified | Migrate from federation to cloud authentication |
| 47 | Update-MgDomain -DomainId -AuthenticationType "Managed"; Get-MgDomain to confirm | Wave 5 | verified | Migrate from federation to cloud authentication (implement) |
| 48 | Start with test domain or fewest users | Wave 5 | verified (new) | Best practices to migrate applications and authentication |
| 49 | Observe usage at least a week with Connect Health before decommissioning AD FS | Wave 5 | verified (new) | AD FS decommission guide |
| 50 | Rollback: re-federate with New-MgDomainFederationConfiguration | Wave 5 | verified | Migrate from federation to cloud authentication (plan the project) |
| 51 | Guide Phase 6 steps (certutil -backup, revoke issuing CA, NDES, CES/CEP, root retention, GPOs, pKIEnrollmentService, Gitea record) | Wave 6 | summarized; detailed procedure owned by Ch08 | Ch08 |
| 52 | Guide: BYOCA "do not revoke — chain still in use" | Wave 6 | corrected/extended: the signing CA must keep publishing CRLs; Ch04 signs with offline root | Configure BYOCA (signing CA from any tier); B07 Ch04 rule 2 |
| 53 | Guide: cloud-root model revoke AD CS issuing CA from root | Wave 6 | restated-as-design: only after all its certificates expired/revoked and no BRIDGE/RETAIN dependency | Program design |
| 54 | Rollback rules across waves | Rollback rules | restated-as-design; SCEP edit/unassign revocation and 24-h SRO change delay verified | Remove SCEP or PKCS certificates; Staged Rollout page |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §8 intro | Ch07 "Two PKIs, one estate" | — |
| §8.1 Domain Controller Certificates | Ch07 "Domain controller certificates" | Reason corrected; template guidance added |
| §8.2 LDAPS Certificates | Ch07 "LDAPS" | Cloud PKI claim corrected |
| §8.3 Cross-Trust Scenarios | Ch07 "Trust in both directions" (AD CS chain into Entra ID; cloud chain into forest; NTAuth; more than one forest) + ch07-trust-directions diagram | Cross-forest wording corrected |
| §8.4 CRL Availability | Ch07 "CRL availability" table | OCSP corrected; App Proxy suggestion replaced |
| §8.5 Certificate Renewal During Transition | Ch07 "Renewal while two issuers overlap" | Lifetime-alignment rule restated |
| PKI-004 diagram placeholder (coexistence timeline) | Replaced by ch07-migration-waves.flow.yaml | — |
| §9 intro (six phases, gates) | Ch07 "The migration playbook" + table + ch07-migration-waves diagram | — |
| §9 Phase 1 Assessment | Ch07 "Wave 1 — Assess" | FMP module functions not reproduced (archive, pending review); Gitea → evidence repository |
| §9 Phase 2 Foundation | Ch07 "Wave 2 — Foundation" | Licensing and connector corrected |
| §9 Phase 3 Pilot | Ch07 "Wave 3 — Pilot" | Rollback condition added |
| §9 Phase 4 Scale | Ch07 "Wave 4 — Scale" | Staged rollout pacing corrected |
| §9 Phase 5 Cutover | Ch07 "Wave 5 — Cutover" | Commands verified; AD FS decommission guidance added |
| §9 Phase 6 Decommission | Ch07 "Wave 6 — Decommission" (gate, summary, corrections, rollback) | Step-by-step procedure in Ch08 (other writer) to avoid duplication |
