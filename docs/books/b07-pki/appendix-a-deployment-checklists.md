---
title: "Appendix A — Cloud PKI and CBA Deployment Checklists"
description: "Two working checklists, verified against Microsoft documentation as of October 2026: deploying Microsoft Cloud PKI with Intune, and configuring Microsoft Entra certificate-based authentication through to domain cutover; and a read-only certificate store inspection for the servers the estate depends on."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b07-pki
book: B07
part: Appendix
series-order: 90
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Cloud PKI and CBA Deployment Checklists

*A checklist is only as good as the test at the end of each line.*

::: {.callout-note}
## In this appendix
Checklist A.1 deploys Microsoft Cloud PKI and the Intune profiles that use it, wave by wave. Checklist A.2 configures Microsoft Entra certificate-based authentication (CBA) from licensing through domain cutover and monitoring. A.3 inspects the certificate stores on the servers the estate depends on. Each line names an owner role and how to verify it. The reasoning behind each step is in [Chapter 06](06-device-and-user-certificates.md) and [Chapter 07](07-coexistence-and-migration.md); owner roles follow [Chapter 05](05-who-owns-the-certificate-estate.md).
:::

The waves are those of [Chapter 07](07-coexistence-and-migration.md): Assess, Foundation, Pilot, Scale, Cutover, Decommission. Thresholds such as "99% of devices" are the program's gates, not Microsoft requirements.

::: {.callout-warning}
## Illustrative, not tested against a production tenant
The commands in this appendix are examples. They haven't been run against a production forest or tenant. Read each one, run it first in a test scope, and review the output before you change anything.
:::

## A.1 Cloud PKI deployment checklist

| # | Task | Wave | Owner | Verification |
|---|---|---|---|---|
| 1 | Confirm the tenant's Cloud PKI entitlement: an add-on subscription to Intune Plan 1 or Plan 2, or (commercial tenants, from July 2026) Microsoft 365 E5 or E7. For a GCC tenant, confirm with licensing; Government packaging follows the enterprise plans subject to compliance requirements.[^aA-cpki][^aA-intune-plan] | Foundation | Licensing | Cloud PKI shows as active under Tenant administration > Intune add-ons, or in the license record |
| 2 | Choose the deployment model: Cloud PKI root and issuing CA, or a BYOCA issuing CA anchored to the existing private root ([Chapter 04](04-the-target-pki.md)) | Foundation | PKI architect | Decision record signed by the sponsor or CIO |
| 3 | Plan CA count against the limit of three CAs per tenant (root, issuing and BYOCA issuing CAs all count)[^aA-cpki] | Foundation | PKI architect | CA plan lists no more than three CAs |
| 4 | Fix each CA's properties before creating it: EKUs (no Any Purpose), subject, RSA key size; they can't be edited later[^aA-byoca] | Foundation | PKI architect | Properties reviewed against the issuance policy |
| 5 | *Cloud root model:* create the Cloud PKI root CA, then the issuing CA under it, with a licensed tenant (HSM-backed keys), not during a trial (trial CAs keep software keys)[^aA-cpki] | Foundation | PKI admin | Both CAs show Active in Tenant administration > Cloud PKI |
| 6 | *BYOCA model:* create the BYOCA issuing CA and download its certificate request[^aA-byoca] | Foundation | PKI admin | CA status reads Signing required; `.req` file saved |
| 7 | *BYOCA model:* sign the request on the private CA with the Subordinate Certification Authority template (the program signs with the offline root); export the signed certificate and the full chain as `.p7b`[^aA-byoca][^aA-pkcs10] | Foundation | PKI admin | Signed `.cer` and chain file in the ceremony record |
| 8 | *BYOCA model:* upload the signed certificate and chain to the BYOCA issuing CA[^aA-byoca] | Foundation | PKI admin | Status Active; root common name shows External root CA |
| 9 | Record each CA's CRL distribution point and AIA URIs from its properties. Intune hosts them for Cloud PKI CAs; for BYOCA, the parent CRL and AIA come from the private CA, and AD CS defaults to an LDAP AIA location[^aA-byoca] | Foundation | PKI admin | URIs listed in the CA register |
| 10 | Confirm every CRL and AIA URL is reachable over HTTP from inside the network and from the internet | Foundation | Network | HTTP 200 from both locations; private-CA LDAP-only locations replaced |
| 11 | Download each CA certificate in DER `.cer` form (Cloud PKI: CA properties > Download)[^aA-byoca][^aA-trusted-root] | Foundation | PKI admin | Files match the CA register thumbprints |
| 12 | For each CA that will issue user certificates for Entra CBA, add it to the Entra ID PKI-based trust store (checklist A.2, step 5) | Foundation | Identity admin | CA listed in the trust store with its CRL URL |
| 13 | Create a trusted certificate profile per platform for the root, for each intermediate, and for the issuing CA; for BYOCA, one for every CA in the private chain plus the BYOCA issuing CA[^aA-byoca][^aA-trusted-root] | Foundation | Intune admin | Profiles exist for Windows, iOS/iPadOS, Android and macOS as needed |
| 14 | Assign the trusted certificate profiles to every group that will get a cloud SCEP profile or a Wi-Fi, VPN or email profile using one[^aA-trusted-root] | Foundation | Intune admin | Assignment report |
| 15 | Confirm trusted certificate profile success on at least 99% of targeted devices | Foundation | Intune admin | Profile device status report |
| 16 | Deploy the cloud chain to domain-joined relying parties (RADIUS, VPN, mTLS servers) by Group Policy or `certutil -dspublish <file> RootCA` ([Chapter 07](07-coexistence-and-migration.md))[^aA-certutil] | Foundation | AD admin | `certutil -verify` on a relying party builds the chain without errors |
| 17 | Decide whether any cloud CA will issue logon certificates for the forest; publish to NTAuth (`certutil -dspublish <file> NTAuthCA`) only if so | Foundation | PKI architect | Decision record; NTAuth contents match it |
| 18 | *Only if AD CS still serves SCEP or PKCS to Intune:* install the current Certificate Connector release on a domain-joined server that isn't the issuing CA, isn't a domain controller and doesn't host the Intune Connector for Active Directory; enable automatic updates[^aA-connector][^aA-scep-infra] | Foundation | Server admin | Connector listed under Tenant administration > Connectors and tokens > Certificate connectors |
| 19 | Confirm connector health and version; alert on Warning or Action required status[^aA-connector] | Foundation | Intune admin | Status Active; version is a supported release |
| 20 | Issue a test certificate to a test device and validate it on each relying party type | Foundation | PKI admin | Validation record per relying party type |
| 21 | Create the pilot Wi-Fi 802.1X SCEP profile per platform, linked to the root trusted certificate profile, with the issuing CA's SCEP URI (leave `{{CloudPKIFQDN}}` as is); EKUs present on the issuing CA; no NDES URLs mixed in[^aA-byoca] | Pilot | Intune admin | Profile created; no configuration errors |
| 22 | Where the certificate will be used against AD, add a SAN URI attribute with `{{OnPremisesSecurityIdentifier}}`, in a new profile, not by editing a production profile[^aA-scep-profile][^aA-remove] | Pilot | Intune admin | Issued certificate's SAN contains `tag:microsoft.com,2022-09-14:sid:` |
| 23 | Assign the SCEP profile to the pilot device group; keep AD CS autoenrollment on for those devices | Pilot | Intune admin | Certificates issued; AD CS certificates still present |
| 24 | Confirm the RADIUS servers trust the cloud chain and can reach its CRL | Pilot | Network | NPS or RADIUS log shows successful validation |
| 25 | Verify end-to-end Wi-Fi authentication with the cloud certificate | Pilot | Network and PKI | Successful 802.1X sessions for pilot devices |
| 26 | Create and assign the VPN SCEP profile; verify VPN authentication | Pilot | Intune admin, network | Successful VPN sessions for pilot devices |
| 27 | Extend SCEP profiles to production rings through dynamic groups | Scale | Intune admin | Issuance success per ring |
| 28 | For each migrated ring, remove AD CS autoenrollment for its MIGRATE templates | Scale and Cutover | AD admin | GPO links and template permissions updated; change record |
| 29 | Confirm no unexpired AD CS certificates remain on managed endpoints for MIGRATE use cases | Cutover | PKI admin | Inventory report shows zero |
| 30 | Retire AD CS components that served only MIGRATE workloads (NDES and connector servers no longer needed, retired issuing CAs, their enrollment service objects and autoenrollment GPOs), following [Chapter 08](08-lifecycle-monitoring-and-decommissioning.md); archive each CA's database and keys first (`Backup-CARoleService`)[^aA-ca-backup] | Decommission | PKI admin, server admin, AD admin | Decommission record committed to the evidence repository |

: Cloud PKI deployment checklist {.striped .hover}

**Owner roles in this table and in A.2, mapped to [Chapter 05](05-who-owns-the-certificate-estate.md).** PKI architect and PKI admin are PKI and CA administrators. Intune admin is endpoint engineering. AD admin and Identity admin are the identity team (identity engineering). Network and Server admin are the server and network teams. The Licensing owner is not yet specified: Chapter 05 has no licensing role, and the program has not named who owns the tenant's license entitlements.

Changes from the PKI guide's version: the CSR steps now apply only to the BYOCA model, because a Cloud PKI root signs its own issuing CA inside Intune; CA certificates are exported DER-encoded; the cloud chain goes to domain-joined relying parties in the Foundation wave, before the pilot needs it, not in Scale; the connector is optional and must be on a current, supported release rather than "v6.2406+"; and the strong-mapping, NTAuth and three-CA-limit steps are new.

## A.2 Entra CBA configuration checklist

Work through the steps in order.

| # | Step | Detail | Verification |
|---|---|---|---|
| 1 | Confirm licensing | CBA itself doesn't need a premium license, but Conditional Access needs Entra ID P1, and the PKI-based trust store's bulk `.p7b` upload needs P1 or P2.[^aA-entra-licensing][^aA-cba-howto] The PKI guide's mention of P2 for PIM doesn't apply to CBA. | `Get-MgSubscribedSku \| Where-Object { $_.ServicePlans.ServicePlanName -contains 'AAD_PREMIUM' }` returns a SKU whose `CapabilityStatus` is `Enabled` (this also catches bundles such as Microsoft 365 E3 and E5) |
| 2 | Confirm the user-to-certificate write path | Cloud-only users: `certificateUserIds` written through the admin center or Microsoft Graph. Synced users: only Entra Connect writes it, from `altSecurityIdentities` or sync rules ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md)).[^aA-cba-howto] | A test user's `certificateUserIds` holds the expected value |
| 3 | Export the CA certificates | Root and every intermediate and issuing CA in the user-certificate chain. | `certutil -dump <file>.cer` shows the expected subject, validity and key usage |
| 4 | Open the network path | Allow `*.certauth.login.microsoftonline.com` (Azure Government: `*.certauth.login.microsoftonline.us`) and turn off TLS inspection for it.[^aA-cba-deep] | A test client completes the certificate prompt through the production proxy |
| 5 | Create the PKI-based trust store and add CAs | As at least Privileged Authentication Administrator: create a PKI container, add each CA (marking roots), with the base CRL URL and, if published, the delta CRL URL.[^aA-cba-howto] Prefer the PKI-based store over the classic store.[^aA-cba-howto] | The admin center lists each CA with its CRL URLs; for automation, `GET https://graph.microsoft.com/beta/directory/publicKeyInfrastructure/certificateBasedAuthConfigurations` returns the PKI[^aA-cba-howto] |
| 6 | Verify CRL reachability and size | Each CRL URL must be an internet-reachable HTTP (recommended) or HTTPS URL, downloadable in 10 seconds, within 20 MB (commercial and GCC) or 45 MB (Azure Government) for interactive sign-in. Entra ID doesn't support OCSP.[^aA-crl] | From an external network, `Invoke-WebRequest -Uri <crl-url> -Method Head` returns HTTP 200; file size within the limit |
| 7 | Require CRL validation | Turn on Require CRL validation; exempt a CA only while its CRL is being fixed.[^aA-crl] | Setting shows on; exemption list empty or dated |
| 8 | Scope CAs if several PKIs serve different users | CA scoping ties a CA to one group; one group per CA, up to 30 rules.[^aA-cba-deep] | Scoping rules match the population plan |
| 9 | Create the pilot groups | Cloud security groups, ten to twenty users covering each certificate type, platform and CA. Use separate groups for the CBA method and for staged rollout; staged rollout doesn't support nested or dynamic groups.[^aA-cba-migrate][^aA-sro] | `Get-MgGroup -Filter "displayName eq 'CBA-Pilot-Users'"` returns the group with members |
| 10 | Enable the CBA method for the pilot group only | As at least Authentication Policy Administrator, under Entra ID > Authentication methods > Certificate-based authentication. Never All users: a user in scope is treated as MFA-capable and can't register other methods without satisfying MFA.[^aA-cba-howto] | `Get-MgPolicyAuthenticationMethodPolicyAuthenticationMethodConfiguration -AuthenticationMethodConfigurationId 'X509Certificate'` shows state enabled and the pilot group as target |
| 11 | Configure username bindings | Order is priority. Put high-affinity bindings (`IssuerAndSerialNumber` or `SKI` to `certificateUserIds`) first; keep at most one low-affinity binding. Priority isn't shown in the admin center; Graph returns it.[^aA-cba-deep] The PKI guide classed Issuer + Subject as high affinity; Microsoft classes it as low.[^aA-cba-deep] | The `certificateUserBindings` in the method configuration returned by Graph list fields and priorities as intended |
| 12 | Configure authentication bindings | Default single-factor; multifactor by rule for certificates protected by a PIN or biometric (for example PIV), by issuer, policy OID, or both. Issuer-and-OID rules beat OID rules, which beat issuer rules.[^aA-cba-howto][^aA-cba-deep] | A pilot sign-in's log shows the expected User certificate authentication level |
| 13 | Turn on password hash sync if it isn't on | For a CBA staged rollout, password sign-in for those users works only with password hash sync.[^aA-cba-migrate] | Entra Connect shows password hash sync enabled and current |
| 14 | Enable staged rollout for certificate-based authentication | As at least Hybrid Identity Administrator, under Entra ID > Entra Connect > Connect sync > Enable staged rollout for managed user sign-in. Up to 10 groups per feature; 200 users when a group is first added; later membership changes take up to 24 hours. Synced users only.[^aA-sro] | The staged rollout page lists the pilot groups for certificate-based authentication; via Graph, `Get-MgPolicyFeatureRolloutPolicy` shows a policy whose feature is `certificateBasedAuthentication` (an evolvable enum value, returned only with the `Prefer: include-unknown-enum-members` header)[^aA-feature-rollout] |
| 15 | Sign in each pilot user once | Issue a Temporary Access Pass right after adding the user to staged rollout, so the first sign-in doesn't fall back to the federation server.[^aA-sro] | User reaches the Entra ID sign-in page, not AD FS |
| 16 | Test CBA sign-in | Pilot user signs in at the My Apps portal and chooses **Use a certificate or smart card**.[^aA-cba-howto] | Sign-in log: success; Additional Details show the certificate binding used and the authentication level.[^aA-cba-deep] (The PKI guide's token check for `"amr": ["x509"]` isn't a documented test; use the sign-in log.) |
| 17 | Expand in steps | Add populations as the sign-in data supports, within staged rollout's limits; the program's gate is below 1% CBA failure before the next step. Staged rollout isn't for permanent coexistence; plan the domain cutover.[^aA-sro] | Sign-in log failure rate per step |
| 18 | Require high affinity tenant-wide | Only after every in-scope user's `certificateUserIds` holds correct values; a premature change locks users out.[^aA-cba-howto] | Test users with and without high-affinity values behave as expected in a test tenant first |
| 19 | Record the federation configuration | Before conversion, capture it and back up AD FS.[^aA-fed-migrate] | `Get-MgDomainFederationConfiguration -DomainId <domain> \| ConvertTo-Json \| Out-File adfs-federation-backup.json`; AD FS farm backup present |
| 20 | Convert the domain to managed | Start with a test domain or the smallest; rollback is re-federation with `New-MgDomainFederationConfiguration`.[^aA-fed-migrate] | `Update-MgDomain -DomainId <domain> -AuthenticationType "Managed"`, then `Get-MgDomain -DomainId <domain>` shows `AuthenticationType` Managed |
| 21 | Turn off AD FS certificate authentication | For relying parties that remain on AD FS. | Users are no longer sent to AD FS for certificate sign-in |
| 22 | Remove staged rollout groups | After conversion. Users who signed in to Windows with a certificate stay enabled for the CBA method long enough to refresh their primary refresh token.[^aA-sro] | No groups assigned to the certificate-based authentication feature |
| 23 | Require phishing-resistant strength in Conditional Access | Use the built-in Phishing-resistant MFA strength, or a custom strength that allows CBA (single-factor, multifactor or both, optionally by issuer or policy OID) for sensitive applications, with a device compliance requirement where needed.[^aA-cba-deep] | `Get-MgIdentityConditionalAccessPolicy` shows the policy enabled and targeting the intended apps and users |
| 24 | Monitor and alert | Send sign-in logs to the log workspace; alert on CBA failures (the program's starting threshold: more than five in 15 minutes) and on the CRL errors AADSTS220501, AADSTS500173, AADSTS500179, AADSTS2205012 and AADSTS2205014, whose causes are in [Chapter 08](08-lifecycle-monitoring-and-decommissioning.md)'s troubleshooting reference.[^aA-crl] | A test sign-in with an expired certificate raises the alert in the configured window |

: Entra CBA configuration checklist {.striped .hover}

## A.3 Certificate store inspection

A read-only check of what a Windows server actually holds and trusts. Run it on every server the certificate estate depends on (domain controllers, AD CS servers, NDES and connector hosts, NPS and RADIUS servers, VPN and web servers) at the Foundation gate, at each later wave gate, and after any trust change such as step 16 or 17 of A.1. Owner: PKI admin with the server admin. Keep each run's output, dated, with the wave record.

Windows keeps certificates in local computer, current user and service-account stores. Current-user stores other than Personal inherit the local computer's contents, and a logical store can show a certificate held in another physical store, so compare thumbprint and scope before deciding a certificate is duplicated or missing.[^aA-stores][^aA-inspect] A service uses the local computer or its own service-account store, not your user store.[^aA-inspect]

1. **Open the store the workload uses.** `certlm.msc` opens the local computer store, `certmgr.msc` the current user store; for a service's store, run `mmc`, add the **Certificates** snap-in and choose **Service account**. On each certificate that matters, record subject, issuer, serial number, thumbprint, validity, subject alternative names and application policy from the **Details** tab, and check the chain on the **Certification Path** tab.[^aA-inspect]

    ```cmd
    certlm.msc
    ```

2. **List the computer's stores.** `-store` dumps a store without changing it; `-enterprise` reads the enterprise store, which is where NTAuth lives.[^aA-certutil]

    ```cmd
    certutil -store My
    certutil -store Root
    certutil -store CA
    certutil -enterprise -store NTAuth
    ```

3. **Verify each certificate in a store.** `-verifystore` checks the certificates in the named store; run it for Personal and for the roots.[^aA-certutil]

    ```cmd
    certutil -verifystore My
    certutil -verifystore Root
    ```

4. **Inventory expiry and private keys.** From an elevated PowerShell session; the second command lists what expires within `$days` days; set that to the certificate class's renewal window ([Chapter 08](08-lifecycle-monitoring-and-decommissioning.md)).[^aA-path]

    ```powershell
    Get-ChildItem -Path Cert:\LocalMachine\My |
        Select-Object Subject, Thumbprint, NotAfter, HasPrivateKey

    $days = 60   # set to this class's renewal window
    Get-ChildItem -Path Cert:\LocalMachine\My |
        Where-Object { $_.NotAfter -lt (Get-Date).AddDays($days) } |
        Select-Object Subject, Thumbprint, NotAfter
    ```

5. **Test a server certificate the way TLS clients see it.** `Test-Certificate` checks the SSL policy, the DNS name and revocation; replace `<server-fqdn>` with the name clients use. A pass in this chain context doesn't prove the relying application trusts it, so test the application too.[^aA-inspect]

    ```powershell
    Get-ChildItem -Path Cert:\LocalMachine\My |
        Test-Certificate -Policy SSL -DNSName 'dns=<server-fqdn>'
    ```

6. **Check chain building and revocation from a client network.** Export the certificate (public part only) and run this from a client in the relevant network, not from the CA. `-urlfetch` contacts the AIA, CDP and OCSP URLs the certificate carries, so run it from an approved troubleshooting host.[^aA-path][^aA-inspect]

    ```cmd
    certutil -verify -urlfetch .\<certificate>.cer
    ```

7. **On disconnected servers, confirm the root lists are current.** Servers that can't reach Windows Update get trusted and untrusted certificate trust lists from an internal location; check when each last synchronized.[^aA-ctl]

    ```cmd
    certutil -verifyCTL AuthRoot | findstr /i "lastsynctime"
    certutil -verifyCTL Disallowed | findstr /i "lastsynctime"
    ```

8. **Keep the evidence.** Save each run to a dated file, for example from PowerShell:

    ```powershell
    certutil -store My | Out-File "$env:COMPUTERNAME-My-$(Get-Date -Format yyyy-MM-dd).txt"
    ```

Don't change a store as part of this check. Adding or removing a certificate in the local computer's Trusted Root Certification Authorities store changes what the whole computer trusts, so any change found necessary goes through a change record, one certificate at a time, identified by thumbprint, with the relying application tested afterward.[^aA-inspect]

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 09 — Federal Workforce Credentials: PIV, Derived PIV and Cloud Authentication](09-federal-workforce-credentials.md) · [Book index](index.md) · [Next: Appendix B — Certificate Template Migration Matrix →](appendix-b-template-migration-matrix.md)
:::

[^aA-cpki]: Microsoft Learn, "Overview of Microsoft Cloud PKI for Microsoft Intune" (prerequisites, features, trial, known issues and limitations), <https://learn.microsoft.com/intune/cloud-pki/> (accessed Oct 20, 2026).
[^aA-intune-plan]: Microsoft Learn, "Microsoft Intune planning guide," Step 3, Determine costs and licensing, <https://learn.microsoft.com/intune/fundamentals/planning-guide#step-3---determine-costs-and-licensing>; and "What's new in Microsoft Intune," week of June 29, 2026, <https://learn.microsoft.com/intune/whats-new/> (both accessed Oct 20, 2026).
[^aA-byoca]: Microsoft Learn, "Configure Microsoft Cloud PKI - Bring your own CA," <https://learn.microsoft.com/intune/cloud-pki/configure-byoca> (accessed Oct 20, 2026).
[^aA-trusted-root]: Microsoft Learn, "Trusted root certificate profiles for Microsoft Intune," <https://learn.microsoft.com/intune/device-configuration/certificates/trusted-root-profiles> (accessed Oct 20, 2026).
[^aA-connector]: Microsoft Learn, "Certificate Connector for Microsoft Intune," <https://learn.microsoft.com/intune/fundamentals/certificates/connector/overview> (accessed Nov 9, 2026).
[^aA-scep-infra]: Microsoft Learn, "Configure infrastructure to support SCEP with Intune," <https://learn.microsoft.com/intune/fundamentals/certificates/scep-infrastructure> (accessed Oct 20, 2026).
[^aA-scep-profile]: Microsoft Learn, "Create and assign SCEP certificate profiles in Intune," strong mapping requirements for KB5014754, <https://learn.microsoft.com/intune/device-configuration/certificates/scep-profiles#update-certificate-connector-strong-mapping-requirements-for-kb5014754> (accessed Oct 20, 2026).
[^aA-remove]: Microsoft Learn, "Remove SCEP or PKCS certificates in Microsoft Intune," <https://learn.microsoft.com/intune/device-configuration/certificates/remove-profiles> (accessed Oct 20, 2026).
[^aA-entra-licensing]: Microsoft Learn, "Microsoft Entra licensing," Microsoft Entra Conditional Access, <https://learn.microsoft.com/entra/fundamentals/licensing> (accessed Oct 20, 2026).
[^aA-cba-howto]: Microsoft Learn, "Set up Microsoft Entra certificate-based authentication," <https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-certificate-based-authentication> (accessed Oct 20, 2026).
[^aA-cba-deep]: Microsoft Learn, "Microsoft Entra certificate-based authentication technical concepts," <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-technical-deep-dive> (accessed Oct 20, 2026).
[^aA-crl]: Microsoft Learn, "Microsoft Entra certificate-based authentication Certificate Revocation List (CRL)," section "CRL error reference" (AADSTS500173, AADSTS500179, AADSTS2205012, AADSTS2205014), <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> (accessed Oct 21, 2026); AADSTS220501 from Microsoft Learn, "Error AADSTS220501 - Unable to download Certificate Revocation List," <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts220501-unable-to-download-certificate-revocation-list> (accessed Oct 21, 2026).
[^aA-cba-migrate]: Microsoft Learn, "Migrate from federation to Microsoft Entra certificate-based authentication (CBA)," <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-migration> (accessed Oct 20, 2026).
[^aA-sro]: Microsoft Learn, "Microsoft Entra Connect: Cloud authentication via Staged Rollout," <https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-staged-rollout> (accessed Oct 20, 2026).
[^aA-feature-rollout]: Microsoft Learn, "featureRolloutPolicy resource type," properties, <https://learn.microsoft.com/graph/api/resources/featurerolloutpolicy?view=graph-rest-1.0#properties> (accessed Oct 20, 2026).
[^aA-fed-migrate]: Microsoft Learn, "Migrate from federation to cloud authentication," <https://learn.microsoft.com/entra/identity/hybrid/connect/migrate-from-federation-to-cloud-authentication> (accessed Oct 20, 2026).
[^aA-pkcs10]: Microsoft Learn, "Submit certificate requests using a PKCS #10 or a PKCS #7 file" (on an enterprise CA the template defaults to Subordinate Certification Authority; download the certificate chain), <https://learn.microsoft.com/windows-server/identity/ad-cs/submit-pkcs-certificate-request> (accessed Nov 9, 2026).
[^aA-certutil]: Microsoft Learn, "certutil" (`-dspublish`, `-store`, `-verifystore`, `-viewstore`, `-verify`, `-urlfetch`; the `-enterprise` and `-user` options; `-enterprise NTAuth` example), <https://learn.microsoft.com/windows-server/administration/windows-commands/certutil> (accessed Nov 9, 2026).
[^aA-ca-backup]: Microsoft Learn, "CA Backup and Restore Windows PowerShell cmdlets," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/component-updates/ca-backup-and-restore-windows-powershell-cmdlets> (accessed Nov 9, 2026).
[^aA-stores]: Microsoft Learn, "Local machine and current user certificate stores" (all current user stores except Personal inherit the local machine stores), <https://learn.microsoft.com/windows-hardware/drivers/install/local-machine-and-current-user-certificate-stores> (accessed Nov 9, 2026).
[^aA-inspect]: Microsoft Learn, "Inspect certificates and manage certificate store contents" (store scopes; `certlm.msc`, `certmgr.msc` and the service-account snap-in; Details and Certification Path; `Test-Certificate`; `certutil -urlfetch -verify`; controlled store changes), <https://learn.microsoft.com/windows-server/identity/ad-cs/inspect-certificates-manage-certificate-stores> (accessed Nov 9, 2026).
[^aA-path]: Microsoft Learn, "Configure AIA issuer retrieval and validate certificate endpoints," section "Validate path and revocation retrieval" (`certutil -verify -urlfetch` from a client in scope, not only from the CA; Personal store inventory with `Get-ChildItem Cert:\LocalMachine\My`), <https://learn.microsoft.com/windows-server/identity/ad-cs/configure-certificate-path-validation-revocation-policy> (accessed Nov 9, 2026).
[^aA-ctl]: Microsoft Learn, "Configure trusted roots and disallowed certificates in Windows," sections "Verify Trusted and Untrusted CTLs" and "Checking Last Sync Time," <https://learn.microsoft.com/windows-server/identity/ad-cs/configure-trusted-roots-disallowed-certificates> (accessed Nov 9, 2026).
