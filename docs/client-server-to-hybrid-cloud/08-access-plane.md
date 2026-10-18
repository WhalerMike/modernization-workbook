# Chapter 08 — Access Plane: SASE, Zero Trust, MFA, Certificate-Based Auth

**The identity-bound access plane that replaces the Active Directory network perimeter**

## The access claim

![Diagram](../images/cshc/access-plane.svg)


Active Directory retirement removes the network perimeter as an authorization boundary. The replacement is an **identity-bound access plane** built on four coordinated surfaces — **Zero Trust** (architectural model), **Conditional Access** (policy enforcement, covered in Chapter 05), **SASE** (edge delivery), and **phishing-resistant multi-factor authentication + certificate-based authentication** (proof of identity). The framework integrates all four into one governed surface targeted by organizational attributes.

The outcome: every access decision is a per-request evaluation of identity + device + signal, made at the cloud edge, logged, and visible to the drift engine.

## The model — Zero Trust

Zero Trust is not a product. It is a set of architectural principles[^cs08-n207] enforced consistently across every access surface.

### The three Zero Trust principles

1. **Verify explicitly.** Every access request is authenticated and authorized at the moment of use. There is no “inside the network equals trusted” concept. Identity, device posture, risk score, and session state are evaluated per request.
2. **Use least-privilege access.** Access is time-bound, resource-scoped, and purpose-scoped. No standing privileged access.
3. **Assume breach.**[^cs08-zt] Every session is treated as potentially compromised. Continuous access evaluation can revoke a session mid-flight. Break-glass carve-outs are minimal, monitored, and audited.

The Zero Trust model is enforced by the combined effect of Conditional Access (policy), device-management compliance (device signal), privileged identity management (privilege elevation), and certificate-based authentication (identity proof). No single control is Zero Trust by itself; the pattern is the four together.

### What retires

When Zero Trust is in place, three Active Directory-era patterns retire:

- **Network-segment-as-authority.** IP-range-based allowlists stop being authoritative. Policy is per-identity, per-device, per-session.
- **Pass-through Active Directory Kerberos.** Services that have been modernized stop accepting Kerberos tickets issued by a domain controller and accept cloud-issued, short-lived tokens instead. Services on a documented Kerberos island keep Kerberos until they retire.
- **Persistent administrative rights.** Domain Admins, local administrator groups, and service accounts with never-expiring passwords migrate to just-in-time elevation, group managed service accounts (where Kerberos islands persist)[^cs08-gmsa], or workload identity federation (where cloud services authenticate to the cloud identity platform).[^cs08-wif]

## SASE — the edge delivery surface

Secure Access Service Edge (SASE) is the cloud-delivered security surface[^cs08-gsa] that replaces the on-premises firewall + VPN + proxy + cloud-access-security-broker stack. The framework does not mandate a specific SASE vendor; it governs the integration contract.

### The SASE component set

| Component | Function | Integration |
|-----------|----------|-------------|
| **Zero Trust Network Access** | Per-application reverse-proxy access, replaces VPN | Targets attribute-scoped application groups; Conditional Access enforces device compliance + multi-factor authentication |
| **Secure Web Gateway** | Outbound web filtering + data loss prevention | Targets attribute-scoped user groups; logs to security information and event management |
| **Cloud Access Security Broker** | Sanctioned-cloud inline enforcement | Reads the cloud application catalog; attribute-scoped policies |
| **Firewall as a Service** | Distributed firewall plane | Hybrid-projected policy targeting |
| **Data Loss Prevention** | Content-aware filtering | Targets attribute-scoped sensitive-data groups |

### SASE integration pattern

The contract with the SASE vendor:

1. **Identity federation.** SASE authenticates users via the cloud identity platform. No local SASE user database.
2. **Group targeting.** SASE policies reference attribute-scoped dynamic groups, not local groups.
3. **Device posture.** SASE accepts the device-management compliance signal as an input to policy.
4. **Logging.** SASE ships access logs to the security information and event management adapter; the drift engine correlates against cloud sign-in logs.
5. **Provenance.** SASE policy changes flow through the policy tree in the authoritative repository — no direct vendor-portal edits.

Vendor choice is an organizational decision; the integration contract is canonical.

## Multi-factor authentication — phishing-resistant methods

Not all multi-factor authentication is equal. The access-plane guidance requires phishing-resistant methods for every privileged user and for all users on high-risk resources.[^cs08-m2209]

### The method hierarchy

| Method | Phishing-resistant | Typical use |
|--------|--------------------|-------------|
| **FIDO2 security keys** | Yes | Tier-0 administrators, high-privilege users |
| **Windows Hello for Business** (and Platform SSO on macOS)[^cs08-psso][^cs08-whfb] | Yes | User PCs, default daily authentication |
| **Certificate-based authentication** (with PIV/CAC) | Yes | Users with smart cards |
| **Authenticator application** push notifications (number matching is always on)[^cs08-numm] | No — resists push fatigue, not phishing | Standard users during transition, secondary method |
| **Passkey in Authenticator** (device-bound)[^cs08-passkey] | Yes | Mobile and cross-device sign-in |
| **SMS / Voice** | No | Retired — not permitted |

### Method policy

The Conditional Access library (Chapter 05) enforces:

- Role-scoped policies require FIDO2 or certificate-based authentication for Tier-0 administrators, privileged identity roles, and break-glass test accounts.
- Enterprise baseline policies require multifactor authentication for all users, using an authentication strength that excludes SMS and voice,[^cs08-authstr] and move users toward phishing-resistant methods.
- Workload-specific policies require elevated methods for sensitive applications.

Organizations with smart-card holders use certificate-based authentication as the user default. Smart-card plus PIN reaches the same cloud session that a non-smart-card user reaches via Windows Hello for Business — both are phishing-resistant; both are preferred methods.

## Cloud certificate-based authentication — the Active Directory Certificate Services retirement path

### The problem it solves

Organizations using smart cards have historically anchored smart-card logon in Active Directory Certificate Services. When Active Directory Domain Services retires, the certificate-services trust chain for smart-card logon loses its validation path — unless the chain is re-anchored in the cloud identity platform.

### How it works

Cloud certificate-based authentication accepts X.509 certificates from certificate authorities in the tenant's trust store (the PKI-based trust store, which holds root and issuing CA certificates and their revocation-list locations).[^cs08-cbaca] When a user presents a certificate:

1. The platform validates the certificate chain against the uploaded certificate-authority list.
2. The platform binds the certificate to a cloud user through configured username-binding rules (for example, the SAN principal name, RFC 822 name, or issuer and serial number). High-affinity bindings are preferred.[^cs08-cbacfg]
3. The user is authenticated; a token is issued; Conditional Access policies evaluate the sign-in.

The user experience is: insert smart card → enter PIN → get a token. No difference from Active Directory-anchored smart-card logon. The governance difference: the validation chain ends in the cloud identity platform, not in Active Directory.

### The retirement sequence

1. Add the issuing and root certificate-authority certificates (with revocation-list locations) to the tenant's PKI-based trust store.
2. Configure username bindings.
3. Enable certificate-based authentication as an authentication method.
4. Enforce via Conditional Access. Policies require certificate-based authentication for designated user groups (attribute-scoped).
5. Validate. Users sign in with smart cards without issue; sign-in logs show the method; Conditional Access evaluation passes.
6. Retire the Active Directory smart-card logon configuration. The Active Directory-side chain is no longer needed for sign-in; the Group Policy Object that configured it retires per Chapter 05.

Issuance is a separate decision. An AD CS *enterprise* CA depends on AD DS,[^cs08-entca] so before AD retires, certificate issuance has to move to a successor: a standalone CA, a managed cloud PKI service,[^cs08-cpki] or a third-party or federal shared-service CA (for PIV/CAC, the agency's existing PIV issuer usually already fills this role).

The framework also governs the certificate issuance pipeline so new user certificates are issued against the same certificate authority that the cloud identity platform trusts.

## Privileged access management

Every privileged account — domain-admin equivalent, cloud administrator, emergency break-glass — passes through a privileged access management vault. The pattern applies to any privileged access management vendor.

### The pattern

- **No standing privileged access.**[^cs08-pim] A privileged account exists in just-in-time elevation but requires explicit elevation for each use (multi-factor-authentication-gated, time-bound, purpose-documented).
- **Break-glass accounts** live in a vault. Checkout requires dual approval; the session is recorded; automatic rotation on release.
- **Service accounts** with elevated rights use managed identities and workload identity federation where possible; group managed service accounts on the remaining Kerberos islands; vaulted accounts only as last resort.
- **Session recording** for every privileged session — desktop session video, keystroke log, command-line capture — shipped to security information and event management. (Session recording is a capability of third-party privileged access management products, not of Entra PIM.)

Drift monitoring: vaulted accounts that do not appear in the cloud identity platform are orphan drift; cloud privileged accounts that are not vaulted are phantom drift.

## Continuous access evaluation — the session-level Zero Trust

A Zero Trust session is not “good for twelve hours, then re-authenticate.” It is continuously evaluated. Continuous access evaluation lets the platform and participating services revoke a live session mid-flight when risk changes:

- User password changes → session revoked.
- User is deleted or disabled → session revoked.
- Network location changes to a blocked location → access revoked (for location policies, with strict location enforcement enabled).
- User risk rises to high (for example, leaked credentials detected by Entra ID Protection)[^cs08-idp] → session revoked.

Continuous access evaluation works only with CAE-capable applications and services,[^cs08-cae] and it reacts to these critical events and to IP-location changes, not to every Conditional Access condition. Device-compliance changes, for example, take effect at the next token refresh. Policies are authored with that in mind.

## Putting it together — the access plane in one flow

A user opens their laptop in the morning:

1. **Device boot.** Laptop boots; device-management compliance checks run; encryption unlocks with an escrowed key; the device is compliant.
2. **Sign-in.** User inserts smart card, enters PIN. Certificate-based authentication validates the certificate chain against the enterprise certificate authority; the user is authenticated; a continuously evaluated session token is issued.
3. **Conditional Access evaluation.** Enterprise baseline evaluates: compliant device, certificate-based authentication satisfies phishing-resistant multi-factor authentication, location in expected range, risk score low. Session allowed.
4. **Application access.** User opens productivity applications. Platform single sign-on satisfies subsequent authentications; continuous access evaluation is live; if risk rises, the session can be revoked.
5. **VPN replacement.** User needs to reach an internal application. SASE zero-trust network access reverse-proxy accepts the cloud token; validates compliance, multi-factor authentication, and attribute scope; proxies the connection; logs the access.
6. **Privileged elevation.** User needs to make a change to a Tier-0 resource. They request elevation through just-in-time; multi-factor authentication is re-challenged; approval is granted for a defined window; the session is recorded; the event is emitted.
7. **End of day.** Laptop sleeps. Tokens expire or are refreshed on the next sign-in; re-authentication and Conditional Access evaluation start the cycle again.

Every step above is attribute-scoped, provenance-bound, and drift-monitored. A failure anywhere generates a tracked item within the defined response time.

## Validation

Access-plane migration passes when:

- Every user has FIDO2, a passkey, Windows Hello for Business, or certificate-based authentication as their primary multi-factor authentication method. No SMS or voice as primary.
- Every smart-card user signs in via cloud certificate-based authentication (not Active Directory-anchored smart-card logon).
- Every user-facing policy targets attribute-scoped dynamic groups.
- SASE (zero-trust network access + secure web gateway + cloud access security broker, minimum) is in place and cloud-identity-federated.
- Every privileged account passes through privileged access management with session recording.
- Continuous access evaluation is enabled for supported applications, with strict location enforcement where location policies apply.
- Break-glass account use is monitored and audited on a schedule.
- The traditional VPN is retired except for explicit legacy-application-access cases with a documented end-of-life.
- Drift detection reports zero access-plane drift for a defined period.


## Authoritative references

- Microsoft Learn, [Zero Trust as a security foundation](https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview)
- NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- Microsoft Learn, [Workload Identity Federation - Microsoft Entra Workload ID](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation)
- Microsoft Learn, [Group Managed Service Accounts overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview)
- Microsoft Learn, [Windows Hello for Business overview](https://learn.microsoft.com/en-us/windows/security/identity-protection/hello-for-business/)
- Microsoft Learn, [Configure Platform SSO for macOS devices - Microsoft Intune](https://learn.microsoft.com/en-us/intune/device-configuration/settings-catalog/configure-platform-sso-macos)
- Microsoft Learn, [How number matching works in MFA push notifications for Authenticator - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-mfa-number-match)
- Microsoft Learn, [Enable and support passkeys in Authenticator for Microsoft Entra ID - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-enable-authenticator-passkey)
- Microsoft Learn, [Overview of Conditional Access Authentication Strengths - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths)
- OMB, [OMB M-22-09: Moving the U.S. Government Toward Zero Trust Cybersecurity Principles](https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf)
- Microsoft Learn, [How to configure certificate authorities for Microsoft Entra certificate-based authentication - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-configure-certificate-authorities)
- Microsoft Learn, [Set Up Microsoft Entra CBA - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-certificate-based-authentication)
- Microsoft Learn, [What is the Certification Authority Role Service in Windows Server?](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/certification-authority-role)
- Microsoft Learn, [Microsoft Cloud PKI for Microsoft Intune - Microsoft Intune](https://learn.microsoft.com/en-us/intune/cloud-pki/)
- Microsoft Learn, [Continuous access evaluation in Microsoft Entra - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-continuous-access-evaluation)
- Microsoft Learn, [What is Global Secure Access? - Global Secure Access](https://learn.microsoft.com/en-us/entra/global-secure-access/overview-what-is-global-secure-access)
- Microsoft Learn, [What is Privileged Identity Management? - Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure)
- Microsoft Learn, [What are risk detections? - Microsoft Entra ID Protection](https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks)

---

**Previous:** [Chapter 07 — Compute Transformation](07-compute-transformation.md)  
**Next:** [Chapter 09 — Migration Roadmap](09-migration-roadmap.md)

[^cs08-zt]: Microsoft Learn, *Zero Trust as a security foundation*. <https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview>
[^cs08-n207]: NIST, *SP 800-207, Zero Trust Architecture*. <https://csrc.nist.gov/pubs/sp/800/207/final>
[^cs08-wif]: Microsoft Learn, *Workload Identity Federation - Microsoft Entra Workload ID*. <https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation>
[^cs08-gmsa]: Microsoft Learn, *Group Managed Service Accounts overview*. <https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview>
[^cs08-whfb]: Microsoft Learn, *Windows Hello for Business overview*. <https://learn.microsoft.com/en-us/windows/security/identity-protection/hello-for-business/>
[^cs08-psso]: Microsoft Learn, *Configure Platform SSO for macOS devices - Microsoft Intune*. <https://learn.microsoft.com/en-us/intune/device-configuration/settings-catalog/configure-platform-sso-macos>
[^cs08-numm]: Microsoft Learn, *How number matching works in MFA push notifications for Authenticator - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-mfa-number-match>
[^cs08-passkey]: Microsoft Learn, *Enable and support passkeys in Authenticator for Microsoft Entra ID - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-enable-authenticator-passkey>
[^cs08-authstr]: Microsoft Learn, *Overview of Conditional Access Authentication Strengths - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths>
[^cs08-m2209]: OMB, *OMB M-22-09: Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*. M-22-09 requires phishing-resistant MFA for agency staff, contractors, and partners. <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
[^cs08-cbaca]: Microsoft Learn, *How to configure certificate authorities for Microsoft Entra certificate-based authentication - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-configure-certificate-authorities>
[^cs08-cbacfg]: Microsoft Learn, *Set Up Microsoft Entra CBA - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-certificate-based-authentication>
[^cs08-entca]: Microsoft Learn, *What is the Certification Authority Role Service in Windows Server?*. <https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/certification-authority-role>
[^cs08-cpki]: Microsoft Learn, *Microsoft Cloud PKI for Microsoft Intune - Microsoft Intune*. <https://learn.microsoft.com/en-us/intune/cloud-pki/>
[^cs08-cae]: Microsoft Learn, *Continuous access evaluation in Microsoft Entra - Microsoft Entra ID*. Strict location enforcement is in public preview at the time of writing. <https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-continuous-access-evaluation>
[^cs08-gsa]: Microsoft Learn, *What is Global Secure Access? - Global Secure Access*. Microsoft's Security Service Edge offering is Global Secure Access (Entra Internet Access and Entra Private Access). <https://learn.microsoft.com/en-us/entra/global-secure-access/overview-what-is-global-secure-access>
[^cs08-pim]: Microsoft Learn, *What is Privileged Identity Management? - Microsoft Entra ID Governance*. <https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure>
[^cs08-idp]: Microsoft Learn, *What are risk detections? - Microsoft Entra ID Protection*. <https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks>
