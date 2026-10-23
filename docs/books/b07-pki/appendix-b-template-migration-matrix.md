---
title: "Appendix B — Certificate Template Migration Matrix"
description: "The starting classification for common AD CS certificate templates (MIGRATE, BRIDGE, RETAIN or RETIRE), with the target issuer or Intune profile for each and the dependencies that decide when it can move, verified against Microsoft documentation as of October 2026."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b07-pki
book: B07
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Certificate Template Migration Matrix

*A template's name says what it was built for. Its issued certificates say what it's actually used for. Classify by the second.*

::: {.callout-note}
## In this appendix
A starting matrix for the AD CS templates most estates have: what each one is for, its default classification, where its certificates come from in the target state, and what has to be true before it moves. Use it to seed wave 1 of the migration ([Chapter 07](07-coexistence-and-migration.md)), then correct each row against the inventory of certificates the template has actually issued.
:::

## How to use the matrix

The classes are defined in [Chapter 02](02-what-ad-cs-holds-up.md):

| Class | Meaning in this matrix |
|---|---|
| MIGRATE | Certificates move to a cloud issuer (Microsoft Cloud PKI through Intune SCEP) or to Intune delivery, and the AD CS template retires |
| BRIDGE | Stays on AD CS until the thing it serves (Active Directory, NDES, a server role) retires |
| RETAIN | Stays on a managed private or public CA outside Intune for the long term |
| RETIRE | No successor certificate; retire the template once nothing depends on it |

: Template classes {.striped .hover}

Three facts drive most rows. Cloud PKI issues certificates only through SCEP, only to Intune-enrolled devices;[^aB-cpki] Intune doesn't manage Windows Server,[^aB-intune-platforms] so every server certificate is BRIDGE or RETAIN, not MIGRATE. And PKCS and imported PKCS profiles deliver certificates from AD CS or another CA through the Certificate Connector; they move *delivery* to Intune, not *issuance* off AD CS.[^aB-pkcs]

Some rows carry two verdicts because two parts of the use case go different ways, and the parenthesis names the part: the *sign-in path* or *delivery* is what moves to Entra ID or Intune, and the *issuer* is the CA that keeps issuing. Exchange User, for example, is MIGRATE (delivery); RETAIN (issuer): Intune delivers the certificate, while the existing CA and its key history stay. A row marked "RETAIN; was BRIDGE until [Chapter 04](04-the-target-pki.md) named the issuer" records that chapter's decision for internal server TLS: the retained AD CS hierarchy issues internal names, a public CA issues names the internet must trust, and CyberArk Certificate Manager requests and renews both.

The guide's version of this matrix classed Web Server and the IPsec gateway template as MIGRATE to Cloud PKI, Enrollment Agent and OCSP Response Signing as simply RETIRE, and EFS Recovery Agent as RETIRE with no condition. Those rows are corrected below, and the NDES, key archival, subordinate CA and Windows Hello for Business rows are new. The guide's Status column is per-estate tracking; copy the matrix into the program's tracker and keep status there.

## The matrix

| AD CS template | Purpose | Class | Target issuer and profile | Priority | Dependencies and notes |
|---|---|---|---|---|---|
| User | User authentication (EAP-TLS, VPN), often with email and EFS | MIGRATE | Cloud PKI, Intune SCEP user certificate with Client Authentication | High | RADIUS and VPN trust the cloud chain first. If the certificate is also used to sign in to AD, add the SID URI to the SCEP profile and decide on NTAuth ([Chapter 06](06-device-and-user-certificates.md)). Move the email and EFS uses separately (rows below). |
| Computer; Workstation Authentication | Device authentication (802.1X, IPsec) | MIGRATE for Intune-managed workstations; BRIDGE for servers | Cloud PKI, Intune SCEP device certificate | High | Entra hybrid joined devices that authenticate to AD need the SID URI. Entra-joined devices can't map to an AD computer object for RADIUS.[^aB-aadj-plan] Servers keep AD CS auto-enrollment. |
| Web Server | TLS on internal web servers, reverse proxies, NDES | RETAIN; was BRIDGE until [Chapter 04](04-the-target-pki.md) named the issuer | Retained AD CS for internal names, a public CA for internet-facing names, both requested and renewed through CyberArk Certificate Manager ([Chapter 04](04-the-target-pki.md)) | Medium | Not a Cloud PKI workload: web servers aren't Intune-managed devices.[^aB-cpki][^aB-intune-platforms] Clients must trust whichever chain issues it. |
| Smartcard Logon; Smartcard User | Smart card sign-in (and, for Smartcard User, email protection)[^aB-templates] | MIGRATE (sign-in path, to Entra CBA); BRIDGE (issuer, while smart card logon to AD remains) | No new issuer: the card's issuer stays. Add the issuing chain to the Entra ID CBA trust store with internet-reachable CRLs. | High | PIV cards are issued through the agency's card management system under the Federal PKI, not from these templates ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md)). Where AD CS issues smart card certificates, on-premises smart card logon still needs the issuing CA in NTAuth and valid domain controller certificates.[^aB-ntauth] High-affinity binding in Entra CBA. |
| Domain Controller; Domain Controller Authentication | Older domain controller certificates | BRIDGE, then superseded | Replace with a template based on Kerberos Authentication | High | These templates lack the KDC Authentication OID; Microsoft's guidance is to supersede them with a Kerberos Authentication-based template through auto-enrollment.[^aB-dc-certs] |
| Kerberos Authentication | Domain controller authentication for Kerberos and certificate sign-in | BRIDGE | AD CS auto-enrollment until the last domain controller retires | High | EKUs Client Authentication, Server Authentication and KDC Authentication; DNS name in the SAN; an HTTP CRL location for Entra-joined devices.[^aB-dc-certs][^aB-aadj-sso] |
| LDAPS server certificate (the domain controller certificate from the Kerberos Authentication copy) | LDAP over TLS on domain controllers | BRIDGE | AD CS auto-enrollment through the Kerberos Authentication row; a dedicated certificate in the NTDS store only by recorded exception | Medium | Server Authentication EKU and the domain controller's FQDN, which the Kerberos Authentication copy carries; every LDAPS client trusts the chain.[^aB-ldaps][^aB-dc-certs] Test an LDAPS bind before unpublishing the superseded Domain Controller template ([Chapter 07](07-coexistence-and-migration.md)). Ends with the domain controllers. |
| RAS and IAS Server | NPS and remote access server certificates | BRIDGE | AD CS while NPS runs, requested and renewed through CyberArk Certificate Manager ([Chapter 04](04-the-target-pki.md)); a successor RADIUS service brings its own certificate plan | Low | Clients validate the server against the trusted root and, for wireless, expect the server's FQDN in the SAN.[^aB-eap] NPS must trust both client chains during coexistence. |
| Exchange Signature Only | S/MIME signing[^aB-templates] | MIGRATE (delivery) | Intune PKCS profile from AD CS | Medium | Microsoft notes many administrators use this template for signing with the Exchange User template for encryption.[^aB-pkcs] |
| Exchange User | S/MIME encryption[^aB-templates] | MIGRATE (delivery); RETAIN (issuer) | Intune imported PKCS profile; the existing CA keeps issuing | Medium | Encryption keys must be archived so old mail stays readable; keep key archival (Key Recovery Agent row). |
| Code Signing | Signing software and scripts[^aB-templates] | RETAIN | A CA with HSM-protected signing keys, outside Intune | — | Code-signing keys and policy are a separate control set; not an Intune profile use case. |
| Basic EFS | Encrypting File System[^aB-templates] | RETIRE | None | — | Program design: replace with BitLocker for devices and Microsoft Purview Information Protection for files.[^aB-purview] Stop issuing only after users have stopped encrypting new files with EFS. |
| EFS Recovery Agent | Decrypting files previously encrypted with EFS[^aB-templates] | RETIRE, last | None | — | Retire the template, but keep the recovery agent certificates and private keys until no EFS-encrypted data remains. Losing them makes that data unrecoverable. |
| OCSP Response Signing | Signing an Online Responder's status responses[^aB-templates] | RETIRE with the AD CS Online Responder | None | — | Entra ID doesn't use OCSP;[^aB-crl] Cloud PKI publishes CRLs and AIA.[^aB-cpki] Keep the responder and this template while any retained AD CS CA has OCSP consumers. |
| Enrollment Agent; Enrollment Agent (Computer) | Requesting certificates on behalf of another subject[^aB-templates] | RETIRE when no enroll-on-behalf workflow remains | None | — | Intune doesn't replace enrollment agents used for smart card issuance stations. Until retired, restrict enrollment to named agent accounts and set enrollment agent restrictions (ESC3, [Chapter 03](03-hardening-what-stays.md)). |
| CEP Encryption; Exchange Enrollment Agent (Offline request) | NDES registration-authority certificates[^aB-ndes-ra] | BRIDGE | AD CS while NDES serves Intune SCEP | Medium | They expire and must be renewed like any certificate; retire with the last NDES server. |
| Custom NDES SCEP template(s) | Certificates issued through NDES to Intune devices | BRIDGE | Replaced by Cloud PKI SCEP profiles | Medium | Subject supplied in the request; Enroll only for the NDES service account.[^aB-scep-infra] Up to three per NDES server (signature, encryption, both).[^aB-ndes-aadj] |
| Custom PKCS template(s) | Certificates issued through the Certificate Connector | BRIDGE or RETAIN | Intune PKCS profile from AD CS | Medium | Allows key export by design; Domain Users removed from permissions.[^aB-pkcs] |
| IPSEC; IPSEC (Offline request) | IPsec for computers; offline variant supplies the subject in the request[^aB-templates] | MIGRATE for Intune-managed client devices; RETAIN for gateways | Clients: Cloud PKI SCEP with the IPsec EKU configured on the issuing CA. Gateways: AD CS or the appliance vendor's CA, with lifecycle automation | Medium | The guide's VPN gateway row was a server-side certificate; gateways aren't Intune devices. A Cloud PKI CA's EKUs are fixed at creation.[^aB-byoca] |
| Router (Offline request) | Network devices enrolling through SCEP[^aB-templates] | RETAIN | AD CS through NDES, or the network vendor's enrollment | Low | Not an Intune workload; plan with the network team. |
| Subordinate Certification Authority | Issuing CA certificates from a parent CA[^aB-templates] | RETAIN on the root | Offline root | — | Used to sign a BYOCA issuing CA's request.[^aB-byoca] Publish only during a signing ceremony. |
| Key Recovery Agent; CA Exchange | Private key archival and recovery on the CA[^aB-templates] | RETAIN while any archived keys are needed | AD CS | — | Required for S/MIME encryption key recovery. |
| Directory E-mail Replication | Active Directory replication over SMTP[^aB-templates] | BRIDGE, or RETIRE if unused | AD CS | Low | Confirm whether any site link still uses SMTP replication before retiring. |
| Windows Hello for Business authentication (custom, certificate trust) | Hello for Business certificate trust deployments | BRIDGE | AD CS while certificate trust is deployed | Medium | Cloud Kerberos trust needs no certificates and is Microsoft's recommended hybrid model ([Book 02, Chapter 04](../b02-identity/04-the-hidden-migration-surface.md)). Staged rollout doesn't support certificate trust with the federation server as registration authority.[^aB-sro] |

: Certificate template migration matrix {.striped .hover}

## What to check before a row moves

For every row classed MIGRATE, the move is ready when four things are true, and they are the exit criteria wave 4 applies per ring ([Chapter 07](07-coexistence-and-migration.md)):

1. Every relying party for the use case trusts the new chain and can reach its CRL.
2. The Intune profile is assigned and issuing at the program's success threshold.
3. Certificates that will be used against Active Directory carry a strong mapping ([Chapter 06](06-device-and-user-certificates.md)).
4. The AD CS template's remaining issued certificates are on a dated path to expiry, with auto-enrollment removed only after step 2.

For BRIDGE rows, record the event that ends them (the last domain controller, the last NDES server, NPS replaced) so the template's retirement is scheduled with that event rather than forgotten.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Cloud PKI and CBA Deployment Checklists](appendix-a-deployment-checklists.md) · [Next: Appendix C — Anatomy of the CLM Platform →](appendix-c-anatomy-of-the-clm-platform.md) · [Book index](index.md)
:::

[^aB-cpki]: Microsoft Learn, "Overview of Microsoft Cloud PKI for Microsoft Intune," <https://learn.microsoft.com/intune/cloud-pki/> (accessed Oct 20, 2026).
[^aB-intune-platforms]: Microsoft Learn, "Operating systems and browsers supported by Microsoft Intune," <https://learn.microsoft.com/intune/fundamentals/ref-supported-platforms> (accessed Oct 20, 2026).
[^aB-pkcs]: Microsoft Learn, "Configure and use PKCS certificates with Intune," <https://learn.microsoft.com/intune/device-configuration/certificates/pkcs-profiles> (accessed Oct 20, 2026).
[^aB-aadj-plan]: Microsoft Learn, "How to: Plan your Microsoft Entra join implementation," RADIUS and Wi-Fi authentication, <https://learn.microsoft.com/entra/identity/devices/device-join-plan#understand-considerations-for-applications-and-resources> (accessed Oct 20, 2026).
[^aB-templates]: Microsoft Learn, "Certificate templates concepts," Default certificate templates, <https://learn.microsoft.com/windows-server/identity/ad-cs/certificate-template-concepts#default-certificate-templates> (accessed Oct 20, 2026).
[^aB-ntauth]: Microsoft Learn, "Guidelines for enabling smart card logon with third-party certification authorities," <https://learn.microsoft.com/troubleshoot/windows-server/certificates-and-public-key-infrastructure-pki/enabling-smart-card-logon-third-party-certification-authorities> (accessed Oct 20, 2026).
[^aB-dc-certs]: Microsoft Learn, "On-premises certificate trust deployment guide," Configure domain controller certificates, <https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/deploy/on-premises-cert-trust#configure-the-enterprise-pki> (accessed Oct 20, 2026).
[^aB-aadj-sso]: Microsoft Learn, "Configure single sign-on for Microsoft Entra joined devices," <https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/hello-hybrid-aadj-sso#prerequisites> (accessed Oct 20, 2026).
[^aB-ldaps]: Microsoft Learn, "Configure certificates for LDAP over SSL in Active Directory Domain Services," <https://learn.microsoft.com/windows-server/identity/ad-ds/configure-ldap-signing-certificates> (accessed Oct 20, 2026).
[^aB-eap]: Microsoft Learn, "Certificate requirements when you use EAP-TLS or PEAP with EAP-TLS," <https://learn.microsoft.com/troubleshoot/windows-server/networking/certificate-requirements-eap-tls-peap> (accessed Oct 20, 2026).
[^aB-purview]: Microsoft Learn, "Microsoft Purview data security solutions" (Microsoft Purview Information Protection, formerly Microsoft Information Protection), <https://learn.microsoft.com/purview/purview-security> (accessed Oct 20, 2026).
[^aB-crl]: Microsoft Learn, "Understand Microsoft Entra certificate-based authentication Certificate revocation list," <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> (accessed Oct 20, 2026).
[^aB-ndes-ra]: Microsoft Learn, "Renewal of 'Enrollment Agent' certificate used by NDES may fail," <https://learn.microsoft.com/troubleshoot/windows-server/certificates-and-public-key-infrastructure-pki/renewal-of-enrollment-agent-certificate-fail> (accessed Oct 20, 2026).
[^aB-scep-infra]: Microsoft Learn, "Configure infrastructure to support SCEP with Intune," <https://learn.microsoft.com/intune/fundamentals/certificates/scep-infrastructure> (accessed Oct 20, 2026).
[^aB-ndes-aadj]: Microsoft Learn, "Using Certificates for Microsoft Entra joined on-premises single-sign on," <https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/hello-hybrid-aadj-sso-cert#requirements> (accessed Oct 20, 2026).
[^aB-byoca]: Microsoft Learn, "Configure Microsoft Cloud PKI - Bring your own CA," <https://learn.microsoft.com/intune/cloud-pki/configure-byoca> (accessed Oct 20, 2026).
[^aB-sro]: Microsoft Learn, "Microsoft Entra Connect: Cloud authentication via Staged Rollout," unsupported scenarios, <https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-staged-rollout> (accessed Oct 20, 2026).
