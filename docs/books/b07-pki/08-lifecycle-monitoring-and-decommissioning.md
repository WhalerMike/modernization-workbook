---
title: "Chapter 08 — Lifecycle, Monitoring and Decommissioning"
description: "How the certificate estate is kept alive after migration: renewal at scale as public lifetimes shrink, ACME where it applies, CLM inventory and renewal through CyberArk Certificate Manager, revocation and CRL availability, monitoring and drift detection, a troubleshooting reference, the AD CS decommissioning sequence, and the evidence an assessor reads."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b07-pki
book: B07
part: How
series-order: 8
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 08 — Lifecycle, Monitoring and Decommissioning

*A certificate estate fails at its next expiry or its next stale CRL, so after the migration the work is keeping every certificate owned, renewed and checkable, and retiring the old CAs without stranding a single one.*

::: {.callout-note}
## In this chapter
Renewal at scale as publicly trusted TLS lifetimes fall to 47 days, the three renewal engines in the target, ACME where it applies, and inventory and renewal through CyberArk Certificate Manager. Revocation and the availability of CRLs, including what Entra CBA does and doesn't check. Monitoring sources, compliance checks and drift patterns, a troubleshooting reference, the AD CS decommissioning sequence, and the NIST SP 800-53 evidence an assessor reads for IA-5(2), SC-12 and SC-17.
:::

Migration ends on a date. Certificates don't. Every certificate issued during the migration ([Chapter 06](06-device-and-user-certificates.md)) and every one carried across the coexistence period ([Chapter 07](07-coexistence-and-migration.md)) will reach its expiry date, and every CA that issued it must keep publishing a CRL that relying parties can reach until then. The failure modes are well known: an expiry nobody owned, a certificate nobody inventoried, a key reused across renewals. The [Federal Compliance book on certificates and tokens](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md) describes them in its "Certificate Lifecycle Automation" sections, along with the argument that manual renewal can't keep up. This chapter is the operating detail for the target in this book. [Chapter 05](05-who-owns-the-certificate-estate.md) names who owns each part.

![The certificate lifecycle the program operates: discover, inventory with an owner, issue under policy, renew before expiry, and revoke or let expire, with monitoring feeding every stage back into the inventory.](../../images/diagrams/b07-pki/svg/ch08-lifecycle-loop.svg){#fig-ch08-lifecycle-loop fig-alt="A vertical flow of five cards with a monitoring card beside it. Discover, in slate: CLM discovery scans, the Intune certificates report, and AD CS and Cloud PKI issuance records. Inventory with an owner, in blue: every certificate has a class, an issuer and one renewal owner. Issue under policy, in blue: Intune SCEP and PKCS, AD CS autoenrollment, and CyberArk Certificate Manager with ACME where the endpoint supports it. Renew before expiry, in green: the Intune renewal threshold, autoenrollment and CLM renewal, each with a new key pair. Revoke or let expire, in amber: routine retirement by non-renewal, and revocation published to the CRL for compromise. A violet monitoring card, listing CA audit events, CRL health, CBA sign-in failures, Defender for Identity findings and drift, has dashed arrows back to the inventory card. An arrow also loops from renew back to issue."}

## Renewal at scale as lifetimes shrink

On April 11, 2025, the CA/Browser Forum adopted ballot SC-081v3, which reduces the maximum validity of publicly trusted TLS certificates from 398 days in steps from March 2026 to March 2029.[^c08-cabf-ballot] Under the Baseline Requirements, the maximum validity is 200 days from March 15, 2026, 100 days from March 15, 2027, and 47 days from March 15, 2029.[^c08-cabf-br] As of this writing, the first step is in force. The schedule binds publicly trusted certificates, not internal CAs. The program aligns internal lifetimes with it anyway, profile by profile, as renewal automation proves itself. An estate built to renew a certificate every 47 days can absorb shorter internal lifetimes. An estate that can't renew automatically can't absorb either.

The arithmetic leads to one design rule: no certificate class may depend on a person remembering a date. The target has three renewal engines, and every automated class in [Chapter 05](05-who-owns-the-certificate-estate.md) runs through one of them. Three classes run on a controlled, scheduled process instead: PIV on the card lifecycle, code signing on an approved request that is never unattended, and CA certificates on the key ceremony and CRL schedule. Renewing a root CA certificate is a CA-administrator procedure that starts with a full CA backup; renewing with a new key pair also starts a new CRL and creates cross-certificates, and the new root has to reach every client.[^c08-root-renew]

| Engine | Covers | How renewal works | What to watch |
|---|---|---|---|
| Intune certificate profiles | User and device certificates on Intune-managed devices, from Cloud PKI or AD CS | The device requests renewal when the remaining lifetime falls to the profile's renewal threshold. For example, a threshold of 20 means renewal at 80 percent of the lifetime. SCEP renewal generates a new key pair.[^c08-scep] | On iOS, iPadOS and macOS, renewal happens only inside the threshold window and the device must be unlocked while it syncs. A failed renewal leaves the expired certificate on the device, and Intune doesn't retry.[^c08-scep] |
| AD CS autoenrollment | Domain controller certificates, which also serve LDAPS | Group Policy and template permissions drive renewal on domain-joined machines ([Chapter 02](02-what-ad-cs-holds-up.md)) | The CA must stay online and its CRL current for as long as the class exists |
| CyberArk Certificate Manager | Server TLS from retained AD CS, including NPS and RADIUS servers ([Chapter 04](04-the-target-pki.md) makes that decision); appliances, public TLS, network devices | The platform discovers certificates, tracks them and renews them before they expire, through its CA integrations and its ACME service[^c08-cyberark-sh] | Every certificate needs a Server Owner, and the platform's CA account needs a deliberately scoped set of templates ([Chapter 05](05-who-owns-the-certificate-estate.md)) |

### ACME where it applies

ACME, the Automatic Certificate Management Environment protocol in RFC 8555, lets a client prove control of a name and obtain a certificate with no person in the loop. It defines the `http-01` and `dns-01` challenges for that proof.[^c08-rfc8555] It fits web listeners, load-balanced services and anything else with a resolvable name and a client that can complete a challenge. It doesn't fit managed endpoints, which already renew through Intune, or devices that can't run a client.

Neither Microsoft issuer in the target offers ACME. Cloud PKI's only enrollment path is its SCEP registration authority for Intune-managed devices.[^c08-cpki] The program provides ACME through CyberArk Certificate Manager (now part of Palo Alto Networks), the program's single lifecycle tool. Its self-hosted edition includes an ACME service. CyberArk documents support for `http-01` and `dns-01` challenges, says the implementation was designed and tested with the certbot, win-acme and acme.sh clients, and warns that other clients may run into unsupported parts of the protocol.[^c08-cyberark-acme] One limit matters for federal deployments. CyberArk's ACME page says only that win-acme needs FIPS mode disabled on the CyberArk server,[^c08-cyberark-acme] but its 26.1 installation guide is broader: FIPS isn't supported for ACMEv2 at all, so no server that runs the ACME service can have FIPS mode enabled.[^c08-cyberark-ig] Until CyberArk states otherwise in writing, the program runs the ACME service on dedicated servers outside the FIPS-mode server set, whichever client requests the certificate. The `dns-01` challenge makes the authoritative DNS zone the gate for automated issuance. The [Federal Compliance book](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md) develops that point, and it's why the server and network teams are consulted on ACME rollout.

### Inventory and renewal through CyberArk Certificate Manager

The CLM platform is where the inventory lives for every certificate Intune doesn't manage. CyberArk Certificate Manager, Self-Hosted automates the provisioning, discovery, monitoring, validation and management of keys and certificates, and it supports multiple CAs.[^c08-cyberark-sh] For AD CS it uses a Microsoft CA template object. That requires Microsoft CA support to be installed and an account with Read, Issue and Manage Certificates, and Request Certificates permissions on the CA.[^c08-cyberark-msca] Since Palo Alto Networks acquired CyberArk, the SaaS edition has been marketed as Next-Generation Trust Security. The self-hosted edition continues as Certificate Manager, Self-Hosted,[^c08-pan-ngts] and from version 26.2 its documentation calls it Palo Alto Networks Certificate Manager - Self-Hosted.[^c08-cyberark-sh] The program's operating model is the same on either edition.

In the program's model, the platform answers three questions for every certificate it finds: which class it belongs to, who owns its renewal, and whether an issuance record explains it. A certificate on a listener with no enrollment record and no owner is a finding. It's either shadow infrastructure or an unauthorized issuance, and the [Federal Compliance book](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md) treats it as a finding either way. The platform also reports any certificate that comes within two renewal windows of expiry with no renewal path bound to it. That's an incident while it can still be fixed, not on the day it expires.

## Revocation and CRL availability

Revocation is the part of the lifecycle that fails silently. Microsoft's AD CS guidance is plain about why. Revocation doesn't take effect everywhere at once. Relying parties keep trusting a certificate until they fetch a newer CRL from a location they can reach, and if publication or distribution breaks, a revoked certificate can stay usable.[^c08-adcs-revoke] Short lifetimes change the balance. Most retirements become non-renewals, and revocation is left for compromise. But they don't remove the need for CRLs that work.

### Operating the CRLs that stay

For each CA that stays, the PKI administrators run CRL publication as a production service.

- **Publish before expiry, and plan the overlap.** A base CRL must be published before it expires and be available at every retrieval endpoint. A delta CRL complements a base CRL but doesn't replace it; the latest base CRL must already be installed for a delta CRL to work.[^c08-crl-retrieve] Overlap must cover the real end-to-end delay of publication, replication, transfer and client reachability. Microsoft recommends sizing these intervals from measurements rather than adopting another organization's schedule.[^c08-adcs-revoke]
- **Treat the offline root as a ceremony.** For an offline root, Microsoft advises against delta CRLs unless a documented requirement justifies them.[^c08-pki-design] Instead it recommends a scheduled, witnessed process that publishes a new base CRL, transfers it to every retrieval endpoint, and verifies it from the networks that depend on the root.[^c08-adcs-revoke]
- **Monitor the delivery chain, not just the CA.** A CA that generated a CRL hasn't proved the web endpoint is serving it. Verify that each HTTP endpoint serves a current, complete and readable file, and alert before the CRL reaches its next-update time.[^c08-adcs-revoke]
- **Never strand an old CDP.** Changing a CDP URL affects only certificates issued after the change. Keep the old endpoint and its current CRL available until no unexpired certificate, including a long-lived CA certificate, references it.[^c08-adcs-revoke]
- **Use the right reason code.** Use *key compromise* or *CA compromise* for incidents, *superseded* for replacements, and *cessation of operation* for retired services. *Certificate hold* is the only reason that can be reversed.[^c08-adcs-revoke]

Enterprise PKI (PKIView) gives an early-warning view of CA certificate and CRL health across the forest's Windows CAs, with warnings for failed validation or approaching expiry. Microsoft notes that it doesn't replace end-to-end validation from a relying party.[^c08-pkiview]

### What Entra CBA checks

Entra CBA has its own revocation rules, and they shape the CRL design for any CA it trusts. [Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md) covers caching and the **Require CRL validation** setting.

- Each trusted CA supports one CRL distribution point, which must be an HTTP or HTTPS URL. Entra CBA doesn't support OCSP or LDAP URLs.[^c08-cba-overview] Microsoft recommends HTTP rather than HTTPS for the CRL, to minimize latency and avoid a circular dependency on certificate validation.[^c08-cba-crl]
- The largest CRL Entra ID downloads during an interactive sign-in is 20 MB in public Microsoft Entra ID and 45 MB in the Azure US Government clouds, and the download must finish within 10 seconds. If Entra can't download the CRL, CBA fails for every certificate that CA issued.[^c08-cba-crl] Keep lifetimes reasonable and clean up expired certificates so that CRLs stay inside those limits.[^c08-cba-crl]
- If a CA is uploaded without a CRL URL, authentication with that CA's revoked certificates doesn't fail.[^c08-cba-ca]

Cloud PKI hosts its own CRLs. Each CRL is valid for seven days, republished every 3.5 days, and updated with every revocation.[^c08-cpki] One Cloud PKI trap belongs in every runbook. If you revoke a certificate by hand while the user or device still has an active SCEP profile assignment, the device requests and gets a new certificate at its next check-in. Remove the SCEP assignments first.[^c08-cpki-monitor]

## Monitoring

Each part of the estate reports in a different place. The program collects these signals into one view, and security operations owns the alerts ([Chapter 05](05-who-owns-the-certificate-estate.md)).

| Source | What it shows | Where |
|---|---|---|
| Intune certificates report | Certificates on managed devices, with thumbprints, issuance details and status[^c08-intune-reports] | **Devices** > **Monitor** > **Certificates** |
| Cloud PKI CA dashboard | Active, expired, revoked and total issued certificates per issuing CA. Report details can take up to 24 hours to appear.[^c08-cpki-monitor] | Each Cloud PKI issuing CA in the Intune admin center |
| Certificate Connector for Microsoft Intune | Admin and Operational event logs. Event ID ranges: 1000–1999 PKCS, 3000–3999 revoke, 4000–4999 SCEP, 5000–5999 connector health. The admin center's Status column shows Active, Warning (the connector can still issue, but an issue needs attention) or Action required (it can't issue certificates, or it's disconnected from Intune), and the connector's details pane lists health messages for CA connectivity, issuing and revocation permissions, and template configuration.[^c08-connector] | Event Viewer on the connector server; **Tenant administration** > **Connectors and tokens** > **Certificate connectors** |
| AD CS audit events | Requests received (4886), issued (4887) and denied (4888); revocations (4870); permission, audit-filter, certificate-manager and CA property changes (4882, 4885, 4890, 4892); database row deletion (4896); role separation (4897); CRL publication requests and publications (4871, 4872)[^c08-adcs-audit] | CA Security log, forwarded to the collector |
| Enterprise PKI (PKIView) | CA certificate and CRL validity and approaching expiration[^c08-pkiview] | AD CS management tools |
| Entra sign-in and audit logs | CBA results and failure reasons, whether the classic trust store was used (**Is Legacy Store Used**), and every create, update and delete on the PKI-based trust store[^c08-cba-setup] | Microsoft Entra admin center |
| Microsoft Defender for Identity | AD CS posture assessments in Secure Score, including ESC1–ESC4, ESC6–ESC8, ESC11 and ESC15. CA-level assessments need a sensor on the AD CS server.[^c08-mdi-certs] | Microsoft Defender portal, Secure Score |
| CyberArk Certificate Manager | Discovered certificates, owners, expiry and renewal status[^c08-cyberark-sh] | The CLM platform |

Auditing on AD CS needs two settings. The CA audit filter selects which CA operations are audited. The **Audit Certification Services** advanced audit subcategory makes the operating system generate the events. Neither works without the other.[^c08-adcs-audit] Size the local Security log so that a collector outage can't overwrite CA audit evidence before it's collected.[^c08-adcs-audit] [Chapter 03](03-hardening-what-stays.md) covers the CA hardening that these events confirm.

## Compliance and drift detection

### Certificate presence as a compliance condition

Intune can include custom settings in a device compliance policy, using a PowerShell discovery script on Windows, or a shell script on macOS and Linux, together with a JSON file that defines the compliant values. Custom results count toward Conditional Access decisions the same way built-in settings do. On Windows, the scripts run every eight hours.[^c08-custom-compliance] A discovery script can check that a device holds an unexpired certificate from the expected issuer with the expected EKU. The program uses that check carefully. Making certificate presence a compliance condition turns a failed renewal into lost access, so the grace period is a security-office decision, as in [Book 05, Chapter 06](../b05-devices/06-who-owns-the-endpoint.md).

The source guide's PowerShell health and compliance functions aren't reproduced here. They stay in the archive with the PKI guide's assessment module until they've had a technical review. Their strong-mapping check looked only for the SID tag in the subject alternative name. It would have flagged AD CS-issued certificates that carry the SID in the certificate extension that AD CS adds instead, which is why the table below lists both forms.

### Drift patterns

| Drift | What it means | How to detect it | Response |
|---|---|---|---|
| Expiring with no renewal path | A certificate within two renewal windows of expiry with no renewal engine bound to it | CLM inventory; Intune certificates report | Assign the class owner and bind the certificate to an engine. Reissue if it's too late. |
| AD CS certificate on a migrated device | A device still holds an AD CS certificate for a use case that moved to Cloud PKI | Compare the issuer with the Cloud PKI CA distinguished name | Expected during coexistence until the old certificate expires. Drift when the certificate was issued, or renewed, from AD CS after autoenrollment was unlinked ([Chapter 07](07-coexistence-and-migration.md)). |
| Issuance outside policy | A certificate issued from a template that should be disabled, or by an unexpected CA | Event 4887 for retired templates; changes to the NTAuthCertificates store; CLM discovery of certificates with no enrollment record | Investigate the CA and requester. Revoke unauthorized certificates with the correct reason. |
| Missing strong mapping | A certificate used for Kerberos authentication without the SID, which domain controllers in Full Enforcement reject | No SID extension (OID 1.3.6.1.4.1.311.25.2), no `tag:microsoft.com,2022-09-14:sid:` URL in the SAN, and no explicit strong `altSecurityIdentities` mapping on the account; for PIV certificates, also not covered by the name-based strong-mapping policy ([Chapter 06](06-device-and-user-certificates.md)); KDC event 39 | Add the `OnPremisesSecurityIdentifier` URL to SCEP profiles, update the connector for PKCS, and reissue with the SID. For PIV certificates, write the explicit mapping instead of reissuing[^c08-kb5014754][^c08-scep][^c08-pkcs] |
| Trust store drift | A trust store holds an anchor that isn't on the approved list, which is an SC-17(b) finding | Entra audit log for trust store changes; **Is Legacy Store Used** in sign-in logs; review of Intune trusted certificate profiles and Group Policy-published roots | Remove unapproved anchors. Retire the classic store after the sign-in logs show it's no longer used.[^c08-cba-setup] |
| CRL near its next update, or an endpoint serving a stale CRL | Revocation checking is about to fail, or is silently out of date | PKIView warnings; endpoint freshness checks; AADSTS220501 in sign-in logs | Publish and verify delivery. Bring an offline CA online if it's the issuer. |
| AD CS posture regression | A template or CA setting that was remediated has come back | Defender for Identity recommendations reopening | Re-remediate through [Chapter 03](03-hardening-what-stays.md). Find the change through events 4882 and 4892. |
| Orphaned profile | A certificate profile assigned to an empty group | Intune assignment review | Remove or reassign the profile |
| Unsupported connector | A connector version past its support window | The installed version is older than the releases still in support under "What's new for the Certificate Connector" | Restore automatic update, or update manually[^c08-connector] |

Since the February 2025 Windows security update, domain controllers that weren't already set to a specific mode run in Full Enforcement and deny authentication for certificates that can't be strongly mapped. The option to return to Compatibility mode ended with the September 9, 2025 update, after which the `StrongCertificateBindingEnforcement` registry key is no longer supported.[^c08-kb5014754] KDC event 39 means a certificate couldn't be strongly mapped and has no SID extension. Event 41 means the SID in the certificate doesn't match the account, which can mean the certificate was issued to a different user. Treat a SID mismatch as a security event, not a configuration error.[^c08-kb5014754] Those IDs hold from Windows Server 2012 onward. On Windows Server 2008 R2 SP1 and 2008 SP2, event 41 means no strong mapping and a SID mismatch is logged as event 49, so read the event text or check the domain controller's version before classifying a hit ([Chapter 06](06-device-and-user-certificates.md)).[^c08-kb5014754]

### Persisting the evidence

In the program's model, the drift checks run on a schedule, at least weekly, and their outputs are committed to the program's evidence repository under `assessments/pki/{domain}/{timestamp}/`. The outputs are the CA and template inventory, the posture findings, certificate health and the compliance results. History matters more than any single run. An assessor asks how long a finding stayed open, not only whether it's open now.

## Certificates as application credentials {#application-certificate-credentials}

A certificate on an app registration or service principal is a credential, not a TLS certificate: Entra ID holds only its public key, the workload signs a token request with the private key, and whoever holds that key *is* the application. [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials) sets the order (managed identity, then federation, then a certificate, never a secret) and the 180-day lifetime cap in the app management policy; [Book 04's certificate table](../b04-access/05-applications-and-workload-identities.md#certificates-and-the-clm-platform) records that these certificates aren't one of this book's renewal classes and that the CLM platform doesn't upload them to Entra ID. What this section adds is the PKI half: which issuers are approved, how the private key is protected, how the certificates are inventoried and owned, and how they are renewed, rolled over and watched. Migrating a service account onto one is [the service account guide's Migration C3](../guides/service-account-migration.md#migration-c); ranking applications by their credentials is [Book 18's](../b18-application-modernization/02-triaging-the-portfolio.md).

Microsoft's Zero Trust guidance for Entra ID carries four checks for these credentials: no client secrets on applications, no application certificates with a lifetime over 180 days, application certificates rotated regularly, and standards enforced through application management policies, with a defined list of trusted certificate authorities for application certificates among the remediations.[^c08-zt-protect-identities] A workload that moves off a client secret onto a governed certificate is how this book supports the closure-map row for application secrets; replacing the secret with a managed identity, where the workload can use one, is Book 04's and the service account guide's.

**Authority:** Microsoft-recommended (certificates over secrets, 180-day lifetime, regular rotation, trusted issuers, from "Configure Microsoft Entra for Zero Trust: Protect identities and secrets," read Nov 11, 2026); the issuer list, the HSM criteria and the overlap window below are risk-based recommended, the program's position for the risk that a copied private key impersonates the application. The HSM criteria and renewal at 80% of lifetime are the program's settled position ([WD-148](../../about/decision-register.md#wd-148)).
**Applies:** every app registration and service principal the agency owns that holds a certificate credential. Environment-dependent: the Microsoft Graph application and service principal APIs are available in the global service, which GCC uses;[^c08-graph-sp-update] the trusted-CA restriction for application certificates is a beta API; the Entra credential-expiry recommendations are preview, and their GCC availability is not yet specified.

### The design

| Element | Program rule | Basis |
|---|---|---|
| **Approved issuers** | Production: the program's internal issuing CA for internal names, the same issuer [Chapter 04](04-the-target-pki.md#the-issuer-decision-for-internal-server-certificates) names for internal server certificates. Key Vault self-signed certificates are allowed only where Key Vault both holds the key and renews it, and only until the trusted-CA restriction can be enforced. Developer self-signed certificates: development and test tenants only | Microsoft prefers a certificate from a trusted CA over a self-signed one, and a self-signed one over a secret ([Book 04](../b04-access/05-applications-and-workload-identities.md#credentials)). A tenant can define up to 10 trusted certificate authorities for application certificates through the `certificateBasedApplicationConfiguration` resource, which on Nov 11, 2026 is in Microsoft Graph beta only[^c08-app-trusted-ca] |
| **Private-key protection** | The key is generated where it will be used and marked non-exportable: in Key Vault for workloads that read it from Key Vault, or in the host's TPM through the Microsoft Platform Crypto Provider for a workload on its own server. Never a `.pfx` copied between hosts or kept in a repository | Microsoft says to keep certificate credentials in a key vault and to scan pipelines so credentials never reach a repository ([Book 04](../b04-access/05-applications-and-workload-identities.md#credentials)); Connect Sync's application credential is the worked Microsoft example of a TPM-held key ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#hardening-the-synchronization-identities)) |
| **HSM criteria** | An HSM-backed key (Key Vault Premium `RSA-HSM`, Managed HSM, or a TPM) is required when the application holds an application permission the program classifies high, any Entra directory role, or an Azure role at subscription scope or above; a non-exportable software key is acceptable otherwise | Key Vault Premium's HSM-protected keys and Managed HSM use FIPS 140-3 Level 3 validated HSMs; the Standard tier uses software validated to FIPS 140 Level 1[^c08-kv-tiers] |
| **Inventory** | Every certificate credential on every app registration and service principal, with its key ID, thumbprint, subject, start and end dates, the application's owners and its `serviceManagementReference` | The read-only script below |
| **Ownership** | The application's registry owner answers for renewal; the two technical owners in Entra ID do it ([Book 04](../b04-access/05-applications-and-workload-identities.md#ownership)). The CLM owner answers only for the issuing CA | [Chapter 05](05-who-owns-the-certificate-estate.md#renewal-ownership-per-certificate-class)'s rule: one renewal owner per certificate |
| **Renewal automation** | Key Vault certificate policy with a lifetime action at 80% of lifetime: `AutoRenew` for self-signed and integrated-CA certificates; `EmailContacts` plus the Event Grid and Automation pattern for a non-integrated (internal) CA | Key Vault renews self-signed and integrated-CA certificates itself; a non-integrated CA needs a new version and a merged CSR, which Microsoft's reference architecture automates with Event Grid and Azure Automation[^c08-kv-renew][^c08-kv-clm-arch] |
| **Rollover overlap** | Add the new public key to the application while the old one is still valid, switch the workload, confirm from the sign-in logs which key ID it uses, then remove the old key. With the 180-day cap and renewal at 80%, the overlap is about 36 days | Microsoft's renewal steps: add the new credential, update the service, validate the key ID in the sign-in logs, then remove the old one[^c08-renew-app-creds] |
| **Expiry alerting** | Three independent signals: the inventory's 45-day flag, Key Vault's `Microsoft.KeyVault.CertificateNearExpiry` event (30 days before expiry), and the Entra recommendations for expiring application and service principal credentials (30 days) | Key Vault event schema; Entra recommendations[^c08-kv-secure][^c08-renew-app-creds] |

### Prerequisites

- Application Administrator or Cloud Application Administrator, through PIM, for the credential changes; Key Vault Certificates Officer on the vault; Reports Reader for the sign-in check.
- The application on the program's app management policy ([Book 04](../b04-access/05-applications-and-workload-identities.md#enforcing-the-order-with-app-management-policies)), so a certificate over 180 days can't be added.
- For an internal CA, the issuing CA reachable by the renewal runbook, and the CA's chain on the workload host.

### Pilot

Pick three applications the identity team owns, one per key location (Key Vault software key, Key Vault HSM key, host TPM), and run the full cycle below on each, including a rollover. Success is a rollover with no failed sign-in for the application and the new key ID in the logs within one hour of the switch.

### Report-only or audit phase

Run the inventory weekly for a month before enforcing anything, and read it: certificates over 180 days, self-signed certificates in production, credentials on service principals rather than on the application object (Microsoft recommends the application object[^c08-renew-sp-creds]), and applications with more than two certificates. Nothing is removed in this phase.

```powershell
#Requires -Modules Microsoft.Graph.Applications
# Read-only: every certificate credential on app registrations and service principals
Connect-MgGraph -Scopes 'Application.Read.All' -NoWelcome
$now = Get-Date
$rows = foreach ($app in Get-MgApplication -All -Property 'id,appId,displayName,keyCredentials,serviceManagementReference') {
    $owners = (Get-MgApplicationOwner -ApplicationId $app.Id -All).Count
    foreach ($k in $app.KeyCredentials) {
        [pscustomobject]@{ Object='Application'; DisplayName=$app.DisplayName; AppId=$app.AppId; KeyId=$k.KeyId
            Subject=$k.DisplayName; Start=$k.StartDateTime; End=$k.EndDateTime
            LifetimeDays=[int]($k.EndDateTime - $k.StartDateTime).TotalDays; DaysLeft=[int]($k.EndDateTime - $now).TotalDays
            Owners=$owners; ServiceRef=$app.ServiceManagementReference }
    }
}
$rows += foreach ($sp in Get-MgServicePrincipal -All -Property 'id,appId,displayName,keyCredentials,appOwnerOrganizationId') {
    foreach ($k in ($sp.KeyCredentials | Where-Object Usage -eq 'Verify')) {
        [pscustomobject]@{ Object='ServicePrincipal'; DisplayName=$sp.DisplayName; AppId=$sp.AppId; KeyId=$k.KeyId
            Subject=$k.DisplayName; Start=$k.StartDateTime; End=$k.EndDateTime
            LifetimeDays=[int]($k.EndDateTime - $k.StartDateTime).TotalDays; DaysLeft=[int]($k.EndDateTime - $now).TotalDays
            Owners=$null; ServiceRef=$null }
    }
}
$rows | Sort-Object DaysLeft |
    Export-Csv ".\FMP-AppCertificateInventory-$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation
$rows | Where-Object { $_.LifetimeDays -gt 180 -or $_.DaysLeft -lt 45 } | Format-Table DisplayName, Object, Subject, LifetimeDays, DaysLeft
```

Service principal credentials with usage `Sign` are SAML signing certificates, which Entra ID issues for single sign-on and which have their own renewal path ([Book 02, Appendix D](../b02-identity/appendix-d-migrating-ad-fs-applications.md#retirement-criteria) keeps them in the inventory); the script reads only `Verify` credentials there.

### Enforcement

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The three pilot applications | One clean rollover each |
| 1 | Applications holding high-classified permissions or roles | Every one on an approved issuer, an HSM-backed key, and a Key Vault lifetime action |
| 2 | All other applications with certificates | Inventory shows no certificate over 180 days and no production self-signed certificate outside the allowed Key Vault case |
| 3 | The trusted-CA restriction | Applied when the API is generally available, with the approved CAs listed |

The rollover, for a certificate held in Key Vault (the commands run as the application's technical owner, through PIM):

```powershell
#Requires -Modules Az.KeyVault, Microsoft.Graph.Applications
# 1. Create the next version in Key Vault (a self-signed or integrated-CA policy renews in place; for an internal CA, merge the signed CSR first)
Connect-AzAccount -Environment '<AzureCloud or AzureUSGovernment>'
$cert = Get-AzKeyVaultCertificate -VaultName '<vault>' -Name '<certificate name>'
$cert.Certificate.NotAfter

# 2. Add the new public key to the application alongside the old one (the list must include every key to keep)
Connect-MgGraph -Scopes 'Application.ReadWrite.All' -NoWelcome
$id   = (Get-MgApplication -Filter "appId eq '<application (client) id>'").Id
$app  = Get-MgApplication -ApplicationId $id -Property 'id,keyCredentials'   # a single-object read returns each key's value
$keys = @($app.KeyCredentials | ForEach-Object { @{ KeyId = $_.KeyId; Type = $_.Type; Usage = $_.Usage; Key = $_.Key; DisplayName = $_.DisplayName } })
$keys += @{ Type = 'AsymmetricX509Cert'; Usage = 'Verify'; Key = $cert.Certificate.RawData; DisplayName = $cert.Certificate.Subject }
Update-MgApplication -ApplicationId $app.Id -KeyCredentials $keys

# 3. Point the workload at the new version (an unversioned Key Vault reference picks it up), then confirm which key it signs with
Get-MgBetaAuditLogSignIn -Filter "appId eq '<application (client) id>' and signInEventTypes/any(t: t eq 'servicePrincipal')" -Top 20 |
    Select-Object CreatedDateTime, ServicePrincipalCredentialKeyId, Status

# 4. Remove the old key once every sign-in uses the new key ID
$keep = @($keys | Where-Object { $_.KeyId -ne '<old key id>' })
Update-MgApplication -ApplicationId $app.Id -KeyCredentials $keep
```

Microsoft Graph returns a key's value only when `keyCredentials` is selected on a single application, which is why step 2 reads the application by its object ID; a list query returns the keys without their values, so its result can't be written back as it is.[^c08-graph-keycred] Check the result with `(Get-MgApplication -ApplicationId $id -Property keyCredentials).KeyCredentials | Select-Object KeyId, EndDateTime` before going on. An application that has its own valid certificate can instead add the next one itself with the `addKey` action, which requires a proof-of-possession token signed with an existing key.[^c08-graph-addkey]

### Rollback

Until step 4, rollback is pointing the workload back at the previous Key Vault version; both keys are valid on the application. After step 4, re-add the old public key while it's still within its validity. The technical owner runs either in minutes. A certificate that has already expired can't be rolled back to.

### Exclusions

Microsoft's own applications' credentials, multitenant applications owned by other organizations, and managed identities aren't in scope: the agency can't, or needn't, govern their keys. Connect Sync's application certificate is self-signed and managed by Connect, and stays so by design ([Book 02](../b02-identity/09-building-the-entra-target.md#hardening-the-synchronization-identities)). Any other exclusion is a dated exception in the application registry, approved through [Book 04, Chapter 06](../b04-access/06-who-decides-access.md#exceptions).

### Telemetry

- Audit log: **Update application – Certificates and secrets management** for every credential added or removed.
- Service principal sign-in logs: `servicePrincipalCredentialKeyId`, which shows the key each sign-in used.
- Key Vault: `Microsoft.KeyVault.CertificateNearExpiry`, `CertificateExpired` and `CertificateNewVersionCreated` events through Event Grid, and Key Vault diagnostic logs.[^c08-kv-secure]
- Entra recommendations **Renew expiring application credentials** and **Renew expiring service principal credentials** (preview), which list credentials expiring within 30 days.[^c08-renew-app-creds][^c08-renew-sp-creds]

### Evidence

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | The design table above | The approved-issuer list and HSM criteria, approved by the CISO |
| Configured | Key Vault certificate policies; app management policy | Certificate policy exports; the policy export from Book 04 |
| Enforced | Rings 1–3 | The inventory showing no certificate over 180 days and none from an unapproved issuer; the trusted-CA configuration once available |
| Evidenced | A rollover per key location | Rollover record with the old and new key IDs and the sign-in log entries |
| Operated | Weekly inventory; the three expiry signals | Inventory history; alert history; the renewal owner in the registry |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**Evidence checklist**

- [ ] **Configuration:** the weekly certificate inventory CSV and the Key Vault certificate policies, in the evidence repository under `assessments/pki/app-credentials/{timestamp}/`
- [ ] **Operational:** audit log entries for credential changes, Key Vault near-expiry events and the recommendation history, kept for the program's log retention
- [ ] **Test:** a rollover record per key location (expected and observed key ID, date, tester), refreshed yearly
- [ ] **Exception:** every application on a dated exception (self-signed in production, software key where an HSM is required), with approver and expiry
- [ ] **Assessor-ready artifact:** the inventory and rollover records, traceable to the "Applications don't have certificates with expiration longer than 180 days" and "Application certificates must be rotated on a regular basis" checks and to any plan of action entry for application secrets

### Day-two ownership

The application's registry owner is accountable for renewal and the technical owners do it; the CLM owner keeps the internal issuing CA available to the renewal runbook; security operations owns the three alerts. The inventory runs weekly, the issuer list and HSM criteria are reviewed yearly with the CISO, and drift looks like a new certificate from an unlisted issuer, a credential added to a service principal instead of the application, a third key on one application, or a near-expiry event with no new version created within a week.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity (workload identities)
- **CISA ZTMM pillar:** Applications and Workloads
- **Depends on:** Book 04's app management policy and ownership rules (Identity); Key Vault or the host TPM (Infrastructure); the internal issuing CA ([Chapter 04](04-the-target-pki.md)); SecOps for the alerts
- **Attack chain interrupted:** Credential Access and Persistence: a copied private key, or a long-lived certificate nobody rotates, used to sign in as the application
:::


## Troubleshooting reference

| Symptom | Likely cause | Check and fix |
|---|---|---|
| SCEP profile stays **Pending** | The device hasn't checked in; the NDES or connector path is down; the Cloud PKI issuing CA is paused | Sync the device. Check connector status and NDES reachability. Check the CA's status in the Intune admin center. |
| PKCS profile fails; connector logs event 1001, or the CA reports "Denied by Policy Module" | Wrong CA FQDN or CA name in the profile; the connector server's computer account lacks Read and Enroll on the template | Confirm both names with `certutil` on the CA. Grant Read and Enroll, then reissue the template.[^c08-pkcs-ts][^c08-connector] |
| Certificate sign-in to AD fails after Full Enforcement; KDC events 39 or 41 (41 or 49 on Windows Server 2008 and 2008 R2) | No strong mapping; or a SID mismatch (event 41, or 49 on 2008-era domain controllers, where 41 means no strong mapping) | See the drift row above. Users and devices must be synchronized for Intune to add the SID.[^c08-scep] Investigate every SID mismatch.[^c08-kb5014754] |
| Entra CBA: AADSTS50017 or "certificate validation failed" | A CA in the chain is missing from the trust store; inconsistent certificate policy extensions across the chain | Upload every CA up to the root. Check the policy OIDs across the chain.[^c08-cba-ca][^c08-aadsts50017] |
| Entra CBA: AADSTS220501, AADSTS500173, AADSTS500179, AADSTS2205012 or AADSTS2205014 | The CRL can't be downloaded (no response, or an HTTP error such as 403) or has expired; the download timed out; or the CRL exceeds the interactive sign-in size limit | Serve the CRL from an internet-facing HTTP endpoint. Check its **Next Update** time. Keep it under the size and 10-second limits.[^c08-aadsts220501][^c08-cba-crl] |
| CBA sign-in works but Conditional Access still demands MFA | The authentication binding rule for that issuer or policy OID is single-factor | Set the rule's protection level to multifactor ([Chapter 06](06-device-and-user-certificates.md))[^c08-cba-setup] |
| Cloud PKI SCEP returns a certificate authority error | The issuing CA is paused or not active; a BYOCA request was never signed and uploaded; the Cloud PKI license has lapsed | Check the CA's status. Complete the BYOCA signing. Check licensing.[^c08-cpki] |
| Trusted root missing on a device | Profile not assigned; device not syncing; bad certificate file | Check the assignment, sync the device, and re-export the CA certificate |
| Certificate expires without renewing | Device offline through the renewal window; profile removed; on Apple platforms, the device was locked or outside the window | Check the profile's assignment and renewal threshold. On iOS, iPadOS and macOS, exclude the device from the profile temporarily to remove the expired certificate and trigger a new request.[^c08-scep] |
| Servers reject Cloud PKI certificates, or the cloud rejects AD CS certificates | The Cloud PKI chain isn't distributed to systems Intune doesn't manage; the AD CS chain isn't in the Entra trust store | Distribute the Cloud PKI root and issuing CA to servers through Group Policy or the CLM platform. Upload the AD CS chain to Entra ([Chapter 07](07-coexistence-and-migration.md)). |
| "Revocation check failed" on premises | The CRL expired because an offline CA didn't publish; the publication or transfer path is broken | Publish a new CRL and verify it at each endpoint, not only at the CA[^c08-adcs-revoke] |
| Connector shows **Warning** or **Action required** | The connector is disconnected from Intune or can't reach the CA; its service account lacks issuing or revocation permission; a PKCS profile doesn't match the CA template; the server can't reach the update service; the service has stopped | Open the connector's details pane and follow the guidance for each health message. Allow `autoupdate.msappproxy.net` on port 443 and the Intune endpoints, update the connector, and restart the service. Health events are 5000–5002.[^c08-connector] |
| SCEP through NDES fails after the CA certificate is renewed | The NDES registration authority certificates still refer to the old CA certificate | Renew the RA certificates[^c08-scep-ra] |
| NDES returns access denied | The NDES service account lacks Read and Enroll on the SCEP template | Grant both permissions[^c08-connector-prereq] |
| A revoked Cloud PKI certificate comes back | An active SCEP assignment caused the device to reissue | Remove the SCEP assignments, then revoke[^c08-cpki-monitor] |
| A revoked certificate is still accepted | The relying party's cache; the CRL hasn't been published or delivered; Entra is still using its cached CRL | Publish and verify delivery. For Entra, revoke the user's sessions if immediate cutoff is needed ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md)).[^c08-adcs-revoke] |

## Decommissioning AD CS

Decommissioning is the program's last wave, Wave 6. It comes after cutover ([Chapter 07](07-coexistence-and-migration.md)), and it applies only to the CAs and role services that no longer serve a retained certificate class. Domain controller, LDAPS and RADIUS certificates usually keep at least one AD CS issuing CA alive for as long as domain controllers exist. The sponsor decides each CA's retirement, and the PKI administrators run it ([Chapter 05](05-who-owns-the-certificate-estate.md)).

![The AD CS decommissioning sequence, from the cutover gate to the final record, with the steps that must wait for the last certificate to expire.](../../images/diagrams/b07-pki/svg/ch08-adcs-decommission.svg){#fig-ch08-adcs-decommission fig-alt="A vertical sequence that starts with an amber gate pill: cutover complete, 30-day rollback window passed, and retained classes documented. Step 1, in slate: confirm no dependents, using the CLM inventory, the CA database and the Entra and Intune chains. Step 2, in slate: stop new issuance by removing templates from the CA, unlinking autoenrollment and denying pending requests. Step 3, in violet: back up and archive the CA database and key. Step 4, in amber: revoke outstanding certificates for cessation of operation, set the CRL lifetime past the last revoked certificate's expiry, and publish the final CRL. Step 5, in slate: uninstall the role services, with NDES, enrollment web services and web enrollment before the CA. Step 6, in red: clean up trust by removing the CA from the Entra trust store, Intune trusted certificate profiles, NTAuthCertificates and the CLM platform. Step 7, in green: keep the CDP and AIA endpoints serving until the last certificate expires, then remove the remaining Active Directory objects and the database. Step 8, in slate: clean up domain controllers, only after they hold certificates from a retained CA. Step 9, in green: record the decommission in the evidence repository. A side note in amber says that under BYOCA, the root and any CA that signed the Cloud PKI issuing CA stay."}

**Gate.** Cutover is complete. The 30-day rollback window has passed with no incidents. Every retained certificate class is documented and running on the CAs that remain. Those are the program's gate conditions. Rolling back after decommissioning means restoring the CA from backup and republishing templates, and the program plans eight to twelve hours for it ([Chapter 07](07-coexistence-and-migration.md)).

1. **Confirm nothing depends on the CA.** Use the CLM inventory and the CA database to confirm that no unexpired certificate in a migrated class is still in use. Confirm that domain controllers hold certificates from a retained CA, and that Entra and Intune reference only the new chains.
2. **Stop new issuance.** Remove the templates from the CA's list of templates to issue, unlink the autoenrollment Group Policy for them, and deny any pending requests.[^c08-decom]
3. **Back up and archive.** Back up the CA database and key with `Backup-CARoleService` from a CA-administrator account.[^c08-ca-backup] Store the backup and its password through separate approved channels, as the retention policy requires.[^c08-adcs-audit]
4. **Revoke and publish the last CRL.** Revoke the outstanding certificates with the reason *cessation of operation*. Set the CRL publication interval so that the CRL's lifetime is longer than the remaining lifetime of the revoked certificates. Then publish a new CRL.[^c08-decom]
5. **Uninstall the role services.** Remove NDES, the certificate enrollment web services and web enrollment before the CA role. Uninstalling an enterprise CA requires Enterprise Admins membership or equivalent. If other role services such as the Online Responder used the CA, reconfigure them first.[^c08-decom] An AD CS Online Responder (OCSP) retires with the last AD CS CA it serves; retiring one is a certificate-lifecycle change, so keep its URL answering until the last unexpired certificate that carries it is gone or replaced.[^c08-ocsp-retire] Entra CBA doesn't use OCSP,[^c08-cba-overview] and Cloud PKI's documented features include CRL and AIA endpoints but no OCSP responder,[^c08-cpki] so nothing in the target takes its place. Relying parties that still query it must be moved to CRL checking first. Retire any Intune Certificate Connector that served only this CA.
6. **Clean up trust.** Remove the CA from the Entra PKI-based trust store once the sign-in logs show it's no longer used. Remove the Intune trusted certificate profiles and any Group Policy-published certificates for it. Delete its certificate from the NTAuthCertificates object, which requires Enterprise Admin permissions.[^c08-decom] Retire the CA object in the CLM platform.
7. **Keep the endpoints until the last certificate expires.** Uninstalling the CA removes only its enrollment services object from Active Directory. The AIA, CDP and certification authority objects stay so that clients can still validate outstanding certificates.[^c08-decom] Keep the HTTP CDP and AIA endpoints serving the final CRL for the same period.[^c08-adcs-revoke] After that, remove the remaining AD objects. Delete certificate templates only after every CA in the forest is gone. With a retained BRIDGE CA, that means not at all.[^c08-decom] Delete the CA database only after the archive is verified.
8. **Clean up domain controllers carefully.** Microsoft's procedure removes domain controller certificates that no longer validate. It doesn't apply to version 1 domain controller templates, and it should run only after the domain controllers hold replacement certificates from a retained CA.[^c08-decom]
9. **Record it.** The CA's records have their own federal retention: NARA's General Records Schedule 3.2 items 060 to 062 cover PKI administrative and transaction records, including the records of "terminating, consolidating, or reorganizing a PKI," and keep a CA's records for 7 years 6 months to 20 years 6 months, depending on its level of operation; the agency records officer confirms the disposition before the archive is ever destroyed ([Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist)).[^c08-grs32] Commit a decommission record to the evidence repository. It covers what was retired, the final CRL's next-update time, the archive location and custody, and the trust stores the CA was removed from.

Two variations depend on the target model ([Chapter 04](04-the-target-pki.md)). Under the Cloud PKI root model, an AD CS hierarchy that's being retired keeps its offline root only as long as policy and outstanding certificates require. Its root CRL publication continues on schedule until the last subordinate certificate expires. Under BYOCA, the Cloud PKI issuing CA chains to the agency's private CA hierarchy.[^c08-cpki] The root, and any intermediate that signed the Cloud PKI issuing CA, stay in service. They keep publishing CRLs and keep their keys in custody. Only the AD CS issuing CAs that no longer issue are retired. The source guide said the chain "is still in use" under BYOCA without saying which CA. The CA that must stay is the one that signed Cloud PKI's issuing CA, not necessarily the AD CS issuing CA being retired.

| How template | Decommissioning one AD CS CA |
|---|---|
| Prerequisites | The gate above; Enterprise Admins for the uninstall and NTAuth change; the records officer's disposition for the archive (step 9) |
| Pilot | The first CA retired is the one with the fewest remaining dependents, and the rest wait until its trust cleanup has run a week with no sign-in or validation failures |
| Report-only or audit phase | Step 2 is the observation phase: issuance stops but nothing is removed, and events 4886 and 4888 show who still asks for the retired templates before the uninstall |
| Enforcement | Steps 4 to 6: the final CRL, the uninstall and the trust cleanup |
| Rollback | Restore from the step 3 backup and republish templates; the program plans eight to twelve hours ([Chapter 07](07-coexistence-and-migration.md)). After step 4's revocations, a restored CA can't un-revoke certificates; replacements are issued instead |
| Exclusions | BRIDGE and RETAIN CAs; under BYOCA, the CA that signed the Cloud PKI issuing CA and the root |
| Telemetry | CA audit events up to the uninstall; Entra sign-in logs for the retired CA's chain; CRL endpoint checks until the last certificate expires |
| Evidence | The checklist below |
| Day-two ownership | The PKI administrators keep the CDP and AIA endpoints serving until the last certificate expires, then remove the remaining objects (step 7); the records officer holds the archive's disposition |

: Decommissioning against the How template {.striped .hover}

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | The sponsor's retirement decision per CA ([Chapter 05](05-who-owns-the-certificate-estate.md)) | The decision record, with the dependency check from step 1 |
| Configured | Step 2: issuance stopped | The CA's template list, empty; GPO links removed |
| Enforced | Steps 4 to 6 | The final CRL and its next-update time; trust stores without the CA |
| Evidenced | Step 6's sign-in log check and the CRL endpoint check | Sign-in logs showing the chain unused; endpoint check output |
| Operated | Step 7's endpoint upkeep until the last expiry | Endpoint freshness history |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**Evidence checklist**

- [ ] **Configuration:** the trust store, NTAuthCertificates and Intune trusted certificate profile exports after cleanup
- [ ] **Operational:** CA audit events through step 2, and CRL endpoint checks until the last certificate expires
- [ ] **Test:** a validation of a certificate the CA issued, against the final CRL from a representative client (date, tester)
- [ ] **Exception:** any CA kept past its planned retirement, with the dependency that holds it and an owner
- [ ] **Assessor-ready artifact:** the decommission record from step 9, traceable to the four above and to SC-17(b)

## The evidence an assessor reads

The control text below is NIST SP 800-53 Rev. 5.[^c08-sp80053] The evidence column is the program's mapping. The [Federal Compliance book](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md) argues why these controls can't be closed without lifecycle automation.

| Control | What it requires | What the assessor reads |
|---|---|---|
| IA-5(2)(a)(1) | Enforce authorized access to the private key | Key storage settings on SCEP profiles (TPM where present). With Cloud PKI SCEP, the private key is created on the device and never leaves it.[^c08-cpki] PKCS keys are generated on the connector server and must be exportable from the template, so PKCS templates and connector hosts are in scope.[^c08-pkcs] |
| IA-5(2)(a)(2) | Map the authenticated identity to the account | CBA username bindings and the tenant's affinity setting; `certificateUserIds` change history; the KDC's strong-mapping enforcement state and event 39 and 41 counts |
| IA-5(2)(b)(1) | Validate certificates by building a certification path to an accepted trust anchor, including status checking | The Entra trust store export showing a CRL URL for every CA; **Require CRL validation**; CRL endpoint freshness checks; PKIView results |
| IA-5(2)(b)(2) | Keep a local cache of revocation data | The relying parties' CRL caching behavior, including Entra's cached CRL ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md)); CRL validity and overlap settings |
| SC-12 | Establish and manage cryptographic keys under the organization's key management requirements | CA key protection: licensed Cloud PKI CAs use Azure Managed HSM keys, while CAs created during a trial use software keys that can't be converted[^c08-cpki]; Managed HSM is FIPS 140-3 Level 3 validated[^c08-mhsm]. AD CS CA keys in an HSM, key ceremony and backup custody records, and key-archival role separation. |
| SC-17(a) | Issue certificates under an organization-defined certificate policy, or obtain them from an approved service provider | The approved certificate policy; the published-template inventory against it; CA audit events 4886, 4887 and 4888; CLM issuance records; Federal PKI as the approved provider for PIV |
| SC-17(b) | Include only approved trust anchors in managed trust stores | Entra trust store exports and audit logs; Intune trusted certificate profiles; Group Policy-published roots; NTAuthCertificates contents; trust store drift findings |

## Where to go next

- [Appendix A — Cloud PKI and CBA Deployment Checklists](appendix-a-deployment-checklists.md) turns this book into task lists with owners.
- [Appendix B — Certificate Template Migration Matrix](appendix-b-template-migration-matrix.md) classifies each template, which drives the decommissioning gate.
- [Chapter 03 — Hardening What Stays](03-hardening-what-stays.md) covers the AD CS settings that the posture findings check.
- [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md) covers the run-state loop for the devices that hold most of these certificates.
- The [Federal Compliance book on certificates and tokens](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md) covers lifecycle automation and control closure in depth.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — Coexistence and Migration](07-coexistence-and-migration.md) · [Book index](index.md) · [Next: Chapter 09 — Federal Workforce Credentials: PIV, Derived PIV and Cloud Authentication →](09-federal-workforce-credentials.md)
:::

[^c08-cabf-ballot]: CA/Browser Forum, "Ballot SC081v3: Introduce Schedule of Reducing Validity and Data Reuse Periods," voting April 4–11, 2025, <https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/> (accessed Oct 20, 2026).
[^c08-cabf-br]: CA/Browser Forum, *Baseline Requirements for the Issuance and Management of Publicly-Trusted TLS Server Certificates*, §1.2.2 "Relevant Dates," <https://cabforum.org/working-groups/server/baseline-requirements/requirements/> (accessed Oct 20, 2026).
[^c08-scep]: Microsoft Learn, "Create and assign SCEP certificate profiles in Intune," sections "Create a SCEP certificate profile" (renewal threshold) and "Update certificate connector: Strong mapping requirements for KB5014754," <https://learn.microsoft.com/intune/device-configuration/certificates/scep-profiles> (accessed Oct 20, 2026).
[^c08-cyberark-sh]: CyberArk, "CyberArk Certificate Manager - Self-Hosted Introduction," documentation version 26.1, <https://docs.venafi.com/Docs/26.1/TopNav/Content/Products/c-tls-protect-landing.php> (accessed Oct 20, 2026); the same page in version 26.2 is titled "Palo Alto Networks Certificate Manager - Self-Hosted Introduction," <https://docs.venafi.com/Docs/current/TopNav/Content/Products/c-tls-protect-landing.php> (accessed Nov 9, 2026).
[^c08-rfc8555]: R. Barnes et al., RFC 8555, *Automatic Certificate Management Environment (ACME)*, March 2019, §8.3–8.4, <https://www.rfc-editor.org/rfc/rfc8555> (accessed Oct 20, 2026).
[^c08-cpki]: Microsoft Learn, "Overview of Microsoft Cloud PKI for Microsoft Intune" (overview of features, architecture, trial), <https://learn.microsoft.com/intune/cloud-pki/> (accessed Oct 20, 2026).
[^c08-cyberark-acme]: CyberArk, "ACME integration with Certificate Manager - Self-Hosted," documentation version 26.1, <https://docs.venafi.com/Docs/26.1/TopNav/Content/ACME/cco-ACME-about.php> (accessed Oct 20, 2026).
[^c08-cyberark-ig]: CyberArk, "Certificate Manager, Self-Hosted Installation and Upgrade Guide," version 26.1 (July 2026), p. 50 ("Because FIPS is not supported for ACMEv2, you cannot have FIPS enabled on any server that is used for ACMEv2"), <https://docs.venafi.com/Docs/26.1PDF/Installation_Guide.pdf> (accessed Oct 22, 2026).
[^c08-cyberark-msca]: CyberArk, "Microsoft Active Directory Certificate Services (ADCS) - Enterprise and Standalone" (Trust Protection Foundation CA template), documentation version 26.1, <https://docs.venafi.com/Docs/current/TopNav/Content/Drivers/cco-MicrosoftCertServices-CATemplate-tpp.php> (accessed Oct 20, 2026).
[^c08-pan-ngts]: Palo Alto Networks, "CyberArk Certificate Manager is now Next-Generation Trust Security" (product page and FAQ), <https://www.paloaltonetworks.com/network-security/next-gen-trust-security/certificate-manager> (accessed Oct 20, 2026).
[^c08-adcs-revoke]: Microsoft Learn, "Operate certificate revocation, CRL publication, and CDP changes in AD CS," <https://learn.microsoft.com/windows-server/identity/ad-cs/operate-certificate-revocation-crl-cdp> (accessed Oct 20, 2026).
[^c08-pkiview]: Microsoft Learn, "Monitor AD CS publication health with Enterprise PKI," <https://learn.microsoft.com/windows-server/identity/ad-cs/monitor-ad-cs-health-enterprise-pki> (accessed Oct 20, 2026).
[^c08-cba-overview]: Microsoft Learn, "What is Microsoft Entra certificate-based authentication?," section "Unsupported scenarios," <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication> (accessed Oct 20, 2026).
[^c08-cba-crl]: Microsoft Learn, "Microsoft Entra certificate-based authentication Certificate Revocation List (CRL)," section "CRL error reference" (AADSTS500173, AADSTS500179, AADSTS2205012, AADSTS2205014), <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> (accessed Oct 21, 2026).
[^c08-cba-ca]: Microsoft Learn, "How to configure certificate authorities for Microsoft Entra certificate-based authentication," <https://learn.microsoft.com/entra/identity/authentication/how-to-configure-certificate-authorities> (accessed Oct 20, 2026).
[^c08-cpki-monitor]: Microsoft Learn, "Monitoring for Microsoft Cloud PKI," <https://learn.microsoft.com/intune/cloud-pki/monitor-certificates> (accessed Oct 20, 2026).
[^c08-intune-reports]: Microsoft Learn, "Intune Reports," section "Certificates report (Operational)," <https://learn.microsoft.com/intune/device-management/reports/overview> (accessed Oct 20, 2026).
[^c08-connector]: Microsoft Learn, "Certificate Connector for Microsoft Intune," sections "Lifecycle," "Connector status," "Logging" and "What's new for the Certificate Connector," <https://learn.microsoft.com/intune/fundamentals/certificates/connector/overview> (accessed Nov 9, 2026).
[^c08-adcs-audit]: Microsoft Learn, "Secure, delegate, and audit certification authority administration," sections "Protect the CA before delegating work" and "Configure CA auditing," <https://learn.microsoft.com/windows-server/identity/ad-cs/secure-delegate-audit-certification-authority> (accessed Oct 20, 2026).
[^c08-cba-setup]: Microsoft Learn, "Set up Microsoft Entra certificate-based authentication," sections "Step 1: Configure the CAs with a PKI-based trust store" (sign-in log, audit log) and "Step 3: Configure an authentication binding policy," <https://learn.microsoft.com/entra/identity/authentication/how-to-certificate-based-authentication> (accessed Oct 20, 2026).
[^c08-mdi-certs]: Microsoft Learn, "Security assessment: Certificates" (Microsoft Defender for Identity), <https://learn.microsoft.com/defender-for-identity/security-posture-assessments/certificates>, and "Microsoft Defender for Identity's security posture assessments," section "Prerequisites," <https://learn.microsoft.com/defender-for-identity/security-assessment> (accessed Oct 20, 2026).
[^c08-custom-compliance]: Microsoft Learn, "Custom compliance settings in Microsoft Intune," <https://learn.microsoft.com/intune/device-security/compliance/custom-settings> (accessed Oct 20, 2026).
[^c08-kb5014754]: Microsoft Support, "KB5014754: Certificate-based authentication changes on Windows domain controllers," sections "Timeline for Windows updates" and "Audit events" (Kdcsvc events 39, 40 and 41; on Windows Server 2008 R2 SP1 and 2008 SP2, 41, 48 and 49), <https://support.microsoft.com/topic/kb5014754-certificate-based-authentication-changes-on-windows-domain-controllers-ad2c23b0-15d8-4340-a468-4d4f3b188f16> (accessed Oct 21, 2026).
[^c08-pkcs]: Microsoft Learn, "Configure and use PKCS certificates with Intune," sections "Configure certificate templates on the CA" and "Update certificate connector: Strong mapping requirements for KB5014754," <https://learn.microsoft.com/intune/device-configuration/certificates/pkcs-profiles> (accessed Oct 20, 2026).
[^c08-pkcs-ts]: Microsoft Learn, "Troubleshooting PKCS certificate deployment in Intune," <https://learn.microsoft.com/troubleshoot/mem/intune/certificates/troubleshoot-pkcs-certificate-profiles> (accessed Oct 20, 2026).
[^c08-aadsts50017]: Microsoft Learn, "Error AADSTS50017 - Validation of given certificate for certificate-based authentication failed," <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts50017-certificate-based-authentication-failed> (accessed Oct 20, 2026).
[^c08-aadsts220501]: Microsoft Learn, "Error AADSTS220501 - Unable to download Certificate Revocation List," <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts220501-unable-to-download-certificate-revocation-list> (accessed Oct 20, 2026).
[^c08-scep-ra]: Microsoft Learn, "SCEP deployment to Windows 10 devices fails after you renew the CA certificate," <https://learn.microsoft.com/troubleshoot/mem/intune/certificates/scep-deployment-to-win10-devices-fails> (accessed Oct 20, 2026).
[^c08-connector-prereq]: Microsoft Learn, "Prerequisites for the Certificate Connector for Microsoft Intune," section "Accounts," <https://learn.microsoft.com/intune/fundamentals/certificates/connector/prerequisites> (accessed Oct 20, 2026).
[^c08-decom]: Microsoft Learn, "How to decommission a Windows enterprise certification authority and remove all related objects" (original KB 889250), <https://learn.microsoft.com/troubleshoot/windows-server/certificates-and-public-key-infrastructure-pki/decommission-enterprise-certification-authority-and-remove-objects> (accessed Oct 20, 2026).
[^c08-sp80053]: NIST, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020 (updated December 10, 2020), controls IA-5(2), SC-12 and SC-17; control text checked against NIST's OSCAL catalog, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026).
[^c08-mhsm]: Microsoft Learn, "What is Azure Key Vault Managed HSM?," <https://learn.microsoft.com/azure/key-vault/managed-hsm/overview> (accessed Oct 20, 2026).
[^c08-grs32]: National Archives, General Records Schedule 3.2, *Information Systems Security Records* (Transmittal 33, January 2023), items 060–062, <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf> (accessed Oct 23, 2026).
[^c08-root-renew]: Microsoft Learn, "Renew root CA certificate" (prerequisite backup of the CA database and private key; renewal with an existing or new key pair; a new key pair produces a new CRL and two cross-certificates; distribution to clients), <https://learn.microsoft.com/windows-server/identity/ad-cs/renew-root-ca-certificate> (accessed Nov 9, 2026).
[^c08-crl-retrieve]: Microsoft Learn, "Retrieve base and delta CRLs using Certification Authority Web Enrollment" (note: "The latest base CRL must already be installed for the delta CRL to function"), <https://learn.microsoft.com/windows-server/identity/ad-cs/retrieve-base-and-delta-crl> (accessed Nov 9, 2026).
[^c08-pki-design]: Microsoft Learn, "PKI design considerations using Active Directory Certificate Services," section "Authority Information Access and Certificate Revocation List Distribution Point settings" ("Avoid publishing delta CRLs on offline root CAs"), <https://learn.microsoft.com/windows-server/identity/ad-cs/pki-design-considerations> (accessed Nov 9, 2026).
[^c08-ca-backup]: Microsoft Learn, "CA Backup and Restore Windows PowerShell cmdlets" (`Backup-CARoleService` parameters, including `-Password` for the key material and `-KeyOnly` and `-DatabaseOnly`), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/component-updates/ca-backup-and-restore-windows-powershell-cmdlets> (accessed Nov 9, 2026).
[^c08-ocsp-retire]: Microsoft Learn, "Secure, monitor, renew, and scale Online Responders," section "Retire a responder or revocation configuration" (inventory unexpired certificates that carry the responder URL; keep the URL available until the last affected certificate expires or is replaced), <https://learn.microsoft.com/windows-server/identity/ad-cs/secure-monitor-scale-online-responders> (accessed Nov 9, 2026).
[^c08-zt-protect-identities]: Microsoft Learn, "Configure Microsoft Entra for Zero Trust: Protect identities and secrets," recommendations "Applications don't have client secrets configured," "Applications don't have certificates with expiration longer than 180 days" (remediations include defining trusted certificate authorities for apps and service principals), "Application certificates must be rotated on a regular basis" and "Enforce standards for app secrets and certificates," <https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-identities> (accessed Nov 11, 2026).
[^c08-graph-sp-update]: Microsoft Learn, Microsoft Graph, "Update servicePrincipal" (national cloud deployments: global service available), <https://learn.microsoft.com/graph/api/serviceprincipal-update?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^c08-app-trusted-ca]: Microsoft Learn, Microsoft Graph beta, "certificateBasedApplicationConfiguration resource type" (trusted certificate authorities for certificates assigned to apps and service principals; up to 10 trusted authorities; `/beta` APIs subject to change and not supported in production), <https://learn.microsoft.com/graph/api/resources/certificatebasedapplicationconfiguration?view=graph-rest-beta> (accessed Nov 11, 2026).
[^c08-kv-tiers]: Microsoft Learn, "About Azure Key Vault" (Standard tier: software validated to FIPS 140 Level 1; Premium tier: HSM-protected keys in FIPS 140-3 Level 3 validated HSMs), <https://learn.microsoft.com/azure/key-vault/general/overview>, and "What is Azure Key Vault Managed HSM?" (FIPS 140-3 Level 3 validated HSMs), <https://learn.microsoft.com/azure/key-vault/managed-hsm/overview> (both accessed Nov 11, 2026).
[^c08-kv-renew]: Microsoft Learn, "Renew your Azure Key Vault certificates" (integrated CAs DigiCert and GlobalSign renewed end to end; nonintegrated CA: new version, download the CSR, merge the signed request; self-signed autorenewal; certificate contacts for near-expiry notifications), <https://learn.microsoft.com/azure/key-vault/certificates/overview-renew-certificate>, and "About Azure Key Vault certificates," section "Certificate policy" (lifetime actions `EmailContacts` or `AutoRenew`, triggered by days before expiry or lifetime percentage), <https://learn.microsoft.com/azure/key-vault/certificates/about-certificates> (both accessed Nov 11, 2026).
[^c08-kv-clm-arch]: Microsoft Learn, Azure Architecture Center, "Certificate life cycle management on Azure" (automated renewal for nonintegrated CAs with Key Vault, Event Grid, Azure Automation and a Hybrid Runbook Worker on the CA server; the private key never leaves Key Vault), <https://learn.microsoft.com/azure/architecture/example-scenario/certificate-lifecycle/> (accessed Nov 11, 2026).
[^c08-renew-app-creds]: Microsoft Learn, "Microsoft Entra recommendation: Renew expiring application credentials (preview)" (credentials expiring within 30 days; add the new credential, update the service, validate the key ID in the sign-in logs, then remove the old credential), <https://learn.microsoft.com/entra/identity/monitoring-health/recommendation-renew-expiring-application-credential> (accessed Nov 11, 2026).
[^c08-renew-sp-creds]: Microsoft Learn, "Microsoft Entra recommendation: Renew expiring service principal credentials (preview)" (credentials on a service principal expiring within 30 days; Microsoft highly recommends using the credential on the backing application object instead of the service principal), <https://learn.microsoft.com/entra/identity/monitoring-health/recommendation-renew-expiring-service-principal-credential> (accessed Nov 11, 2026).
[^c08-kv-secure]: Microsoft Learn, "Secure your Azure Key Vault certificates," section "Certificate lifecycle management" (renew at about 80% of lifetime as a common practice; `Microsoft.KeyVault.CertificateNearExpiry` fires 30 days before expiration, with `CertificateExpired` and `CertificateNewVersionCreated`; maintain a certificate inventory with owning applications), <https://learn.microsoft.com/azure/key-vault/certificates/secure-certificates> (accessed Nov 11, 2026).
[^c08-graph-addkey]: Microsoft Learn, Microsoft Graph, "application: addKey" (adds a key credential; requires a proof-of-possession JWT signed with one of the application's existing valid certificates), <https://learn.microsoft.com/graph/api/application-addkey?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^c08-graph-keycred]: Microsoft Learn, Microsoft Graph, "keyCredential resource type," property `key` (requires `$select`; only available for single-object requests; otherwise always null), <https://learn.microsoft.com/graph/api/resources/keycredential?view=graph-rest-1.0> (accessed Nov 11, 2026).
