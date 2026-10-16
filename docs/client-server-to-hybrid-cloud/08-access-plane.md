# Chapter 08 — Access Plane: SASE, Zero Trust, MFA, Certificate-Based Auth

**The identity-bound access plane that replaces the Active Directory network perimeter**

## The access claim

![Diagram](../images/cshc/access-plane.svg)


Active Directory retirement removes the network perimeter as an authorization boundary. The replacement is an **identity-bound access plane** built on four coordinated surfaces — **Zero Trust** (architectural model), **Conditional Access** (policy enforcement, covered in Chapter 05), **SASE** (edge delivery), and **phishing-resistant multi-factor authentication + certificate-based authentication** (proof of identity). The framework integrates all four into one governed surface targeted by organizational attributes.

The outcome: every access decision is a per-request evaluation of identity + device + signal, made at the cloud edge, logged, and visible to the drift engine.

## The model — Zero Trust

Zero Trust is not a product. It is a set of architectural principles enforced consistently across every access surface.

### The three Zero Trust principles

1. **Verify explicitly.** Every access request is authenticated and authorized at the moment of use. There is no “inside the network equals trusted” concept. Identity, device posture, risk score, and session state are evaluated per request.
2. **Use least-privilege access.** Access is time-bound, resource-scoped, and purpose-scoped. No standing privileged access.
3. **Assume breach.** Every session is treated as potentially compromised. Continuous access evaluation can revoke a session mid-flight. Break-glass carve-outs are minimal, monitored, and audited.

The Zero Trust model is enforced by the combined effect of Conditional Access (policy), device-management compliance (device signal), privileged identity management (privilege elevation), and certificate-based authentication (identity proof). No single control is Zero Trust by itself; the pattern is the four together.

### What retires

When Zero Trust is in place, three Active Directory-era patterns retire:

- **Network-segment-as-authority.** IP-range-based allowlists stop being authoritative. Policy is per-identity, per-device, per-session.
- **Pass-through Active Directory Kerberos.** Services no longer accept Kerberos tickets issued by a domain controller. Tokens are cloud-issued, short-lived, and continuously evaluated.
- **Persistent administrative rights.** Domain Admins, local administrator groups, and service accounts with never-expiring passwords migrate to just-in-time elevation, group managed service accounts (where Kerberos islands persist), or workload identity federation (where cloud services authenticate to the cloud identity platform).

## SASE — the edge delivery surface

Secure Access Service Edge (SASE) is the cloud-delivered security surface that replaces the on-premises firewall + VPN + proxy + cloud-access-security-broker stack. The framework does not mandate a specific SASE vendor; it governs the integration contract.

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

Not all multi-factor authentication is equal. The access-plane guidance requires phishing-resistant methods for every privileged user and for all users on high-risk resources.

### The method hierarchy

| Method | Phishing-resistant | Typical use |
|--------|--------------------|-------------|
| **FIDO2 security keys** | Yes | Tier-0 administrators, high-privilege users |
| **Platform single sign-on passkeys** (Windows Hello for Business) | Yes | User PCs, default daily authentication |
| **Certificate-based authentication** (with PIV/CAC) | Yes | Users with smart cards |
| **Authenticator application** with number-matching | Partial (resists push bombing) | Standard users, secondary method |
| **Authenticator application** without number-matching | No | Retired — not permitted |
| **SMS / Voice** | No | Retired — not permitted |

### Method policy

The Conditional Access library (Chapter 05) enforces:

- Role-scoped policies require FIDO2 or certificate-based authentication for Tier-0 administrators, privileged identity roles, and break-glass test accounts.
- Enterprise baseline policies require platform single sign-on, FIDO2, or authenticator with number-matching for all users. SMS and voice are explicitly blocked.
- Workload-specific policies require elevated methods for sensitive applications.

Organizations with smart-card holders use certificate-based authentication as the user default. Smart-card plus PIN reaches the same cloud session that a non-smart-card user reaches via platform single sign-on — both are phishing-resistant; both are preferred methods.

## Cloud certificate-based authentication — the Active Directory Certificate Services retirement path

### The problem it solves

Organizations using smart cards have historically anchored smart-card logon in Active Directory Certificate Services. When Active Directory Domain Services retires, the certificate-services trust chain for smart-card logon loses its validation path — unless the chain is re-anchored in the cloud identity platform.

### How it works

Cloud certificate-based authentication accepts X.509 certificates from a trusted certificate authority (uploaded into the tenant). When a user presents a certificate:

1. The platform validates the certificate chain against the uploaded certificate-authority list.
2. The platform maps the certificate’s subject name (or user principal name, or principal name subject alternative name) to a cloud user via configured mapping rules.
3. The user is authenticated; a token is issued; Conditional Access policies evaluate the sign-in.

The user experience is: insert smart card → enter PIN → get a token. No difference from Active Directory-anchored smart-card logon. The governance difference: the validation chain ends in the cloud identity platform, not in Active Directory.

### The retirement sequence

1. Upload enterprise certificate-authority certificates to the cloud identity platform.
2. Configure certificate-to-user mapping.
3. Enable certificate-based authentication as an authentication method.
4. Enforce via Conditional Access. Policies require certificate-based authentication for designated user groups (attribute-scoped).
5. Validate. Users sign in with smart cards without issue; sign-in logs show the method; Conditional Access evaluation passes.
6. Retire Active Directory Certificate Services smart-card logon configuration. The Active Directory-side chain is no longer needed; the Group Policy Object that configured it retires per Chapter 05.

The framework also governs the certificate issuance pipeline so new user certificates are issued against the same certificate authority that the cloud identity platform trusts.

## Privileged access management

Every privileged account — domain-admin equivalent, cloud administrator, emergency break-glass — passes through a privileged access management vault. The pattern applies to any privileged access management vendor.

### The pattern

- **No standing privileged access.** A privileged account exists in just-in-time elevation but requires explicit elevation for each use (multi-factor-authentication-gated, time-bound, purpose-documented).
- **Break-glass accounts** live in a vault. Checkout requires dual approval; the session is recorded; automatic rotation on release.
- **Service accounts** with elevated rights use managed identities and workload identity federation where possible; group managed service accounts on the remaining Kerberos islands; vaulted accounts only as last resort.
- **Session recording** for every privileged session — desktop session video, keystroke log, command-line capture — shipped to security information and event management.

Drift monitoring: vaulted accounts that do not appear in the cloud identity platform are orphan drift; cloud privileged accounts that are not vaulted are phantom drift.

## Continuous access evaluation — the session-level Zero Trust

A Zero Trust session is not “good for twelve hours, then re-authenticate.” It is continuously evaluated. Continuous access evaluation lets the platform and participating services revoke a live session mid-flight when risk changes:

- User password changes → session revoked.
- User is deleted or disabled → session revoked.
- Network location changes to a blocked region → session revoked.
- Risk score rises (impossible travel, leaked credentials) → session revoked.

Conditional Access policies are authored with continuous-access-evaluation-aware semantics. Every policy that requires compliance or location constraints is re-evaluated continuously, not just at sign-in.

## Putting it together — the access plane in one flow

A user opens their laptop in the morning:

1. **Device boot.** Laptop boots; device-management compliance checks run; encryption unlocks with an escrowed key; the device is compliant.
2. **Sign-in.** User inserts smart card, enters PIN. Certificate-based authentication validates the certificate chain against the enterprise certificate authority; the user is authenticated; a continuously evaluated session token is issued.
3. **Conditional Access evaluation.** Enterprise baseline evaluates: compliant device, certificate-based authentication satisfies phishing-resistant multi-factor authentication, location in expected range, risk score low. Session allowed.
4. **Application access.** User opens productivity applications. Platform single sign-on satisfies subsequent authentications; continuous access evaluation is live; if risk rises, the session can be revoked.
5. **VPN replacement.** User needs to reach an internal application. SASE zero-trust network access reverse-proxy accepts the cloud token; validates compliance, multi-factor authentication, and attribute scope; proxies the connection; logs the access.
6. **Privileged elevation.** User needs to make a change to a Tier-0 resource. They request elevation through just-in-time; multi-factor authentication is re-challenged; approval is granted for a defined window; the session is recorded; the event is emitted.
7. **End of day.** Laptop sleeps. Token expires; continuous access evaluation revokes on next reconnect; re-authentication starts the cycle.

Every step above is attribute-scoped, provenance-bound, and drift-monitored. A failure anywhere generates a tracked item within the defined response time.

## Validation

Access-plane migration passes when:

- Every user has FIDO2, platform single sign-on passkey, or certificate-based authentication as their primary multi-factor authentication method. No SMS or voice as primary.
- Every smart-card user signs in via cloud certificate-based authentication (not Active Directory-anchored smart-card logon).
- Every user-facing policy targets attribute-scoped dynamic groups.
- SASE (zero-trust network access + secure web gateway + cloud access security broker, minimum) is in place and cloud-identity-federated.
- Every privileged account passes through privileged access management with session recording.
- Every Conditional Access policy is continuous-access-evaluation-aware.
- Break-glass account use is monitored and audited on a schedule.
- The traditional VPN is retired except for explicit legacy-application-access cases with a documented end-of-life.
- Drift detection reports zero access-plane drift for a defined period.

---

**Previous:** [Chapter 07 — Compute Transformation](07-compute-transformation.md)  
**Next:** [Chapter 09 — Migration Roadmap](09-migration-roadmap.md)
