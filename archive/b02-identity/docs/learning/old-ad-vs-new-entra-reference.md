# Old AD vs New Entra ID — A Foundational Reference

**Languages, protocols, cryptography, APIs, IaC, CI/CD, governance, and hybrid bridges across the AD-to-Entra transition**

## 1. The shift in one paragraph

Microsoft identity moved from a **directory-and-tickets** world to a **token-and-API** world. In the old world, an on-premises Active Directory domain controller was the trust root: it issued Kerberos tickets, answered LDAP queries, and replicated SYSVOL over SMB. Clients spoke proprietary or directory-specific protocols (Kerberos, NTLM, LDAP, MS-RPC) directly against domain controllers; cryptography was MD4 / RC4 / SHA-1 with AES bolted on later; admins automated against COM objects and ActiveDirectory PowerShell cmdlets. In the new world, the cloud identity platform is the trust root: it issues OAuth 2.0 access tokens and OpenID Connect ID tokens, exposes everything through a REST API, and federates with SaaS via SAML and OIDC. Cryptography is JWS signatures (RS256, ES256, ES384), TLS 1.2+, FIPS-validated HSM-backed keys, FIDO2 / WebAuthn for users, and certificate-based auth for privileged personnel. Admins automate against modern SDKs, and the operating environment around identity is Infrastructure-as-Code plus CI-as-Code plus Compliance-as-Code — three layers that essentially did not exist around old Active Directory.

> The languages mostly carry over; the protocols change wholesale, the cryptography modernizes, and new layers stack on top.

## 2. The world at a glance

| Dimension | Old Active Directory | New cloud identity platform |
|-----------|----------------------|-----------------------------|
| Trust root | On-prem domain controllers + KDC | Cloud identity tenant |
| Primary auth protocol | Kerberos v5; NTLM (legacy) | OAuth 2.0 + OpenID Connect |
| Directory wire protocol | LDAP / LDAPS | REST API over HTTPS |
| Federation | WS-Federation, WS-Trust, SAML (via federation service) | OIDC primary; SAML 2.0 supported; WS-Fed legacy |
| Multi-factor auth | Smartcard via certificate services; hardware tokens | FIDO2/WebAuthn, Certificate-Based Auth, Authenticator app, OATH-TOTP |
| Password hash | NT hash (MD4) | PBKDF2-HMAC-SHA256, stored in HSM-backed boundary |
| Session unit | Kerberos TGT + Service Tickets | JWT access tokens + ID tokens + refresh tokens |
| Policy plane | Group Policy Objects | Conditional Access; device-management policy; Authentication Methods Policy |
| Account lifecycle | Manual directory tools | Identity governance; lifecycle workflows; access reviews |
| Provisioning to apps | LDAP binds; custom connectors | SCIM 2.0 (outbound) |
| Audit pipeline | Windows Security Event Log; SIEM forwarding | Sign-in and audit logs; SIEM integration |
| Infrastructure-as-Code | Essentially none native | Bicep, ARM templates, Terraform, Pulumi |
| CI-as-Code | Essentially none | YAML pipelines |
| Compliance authoring | Word + Excel SSP documents | OSCAL (Catalog, Profile, Component Definition, SSP, AP, AR, POA&M) |

## 3. Languages and where they fit

### C++
Native server tier for Active Directory itself. Client-side ADSI, LDAP, Kerberos SSPI, NTLM. Almost no greenfield cloud apps start in C++.

### Visual Basic family
Massive historical footprint for directory administration (VBScript logon scripts, Office macros). Effectively retired for new identity work; use PowerShell or C#.

### .NET
Dominant in both worlds. Old: System.DirectoryServices, System.DirectoryServices.AccountManagement. New: MSAL.NET, Microsoft.Identity.Web, Graph SDK, Azure.Identity.

### Python
Growing for governance and automation. Old: python-ldap, ldap3, pywin32. New: MSAL for Python, Graph SDK, azure-identity.

### PowerShell
Remained the primary Microsoft admin language through the transition. Same scripts, different modules (ActiveDirectory → Microsoft.Graph, Az).

### YAML
Edge use only in the old world. Native to the new stack (pipelines, Bicep parameter files, Conditional Access as Code, desired-state configurations).

### TypeScript / JavaScript
Rare in old Active Directory. First-class in the new world (MSAL.js, Graph client, SPA apps using PKCE).

### Go, Java, Rust
Java had a large enterprise footprint via JNDI + LDAP. All three have growing cloud SDKs; C# and PowerShell remain the most common Microsoft-stack paths.

## 4. Authentication and federation protocols

### Old protocol stack
Kerberos v5 (RFC 4120), Kerberos FAST, SPNEGO, NTLMv1/v2, MS-PAC, LDAP/LDAPS, LDAP + SASL/GSSAPI, MS-RPC, SMB, WS-Trust / WS-Federation, SAML 1.1/2.0, Group Policy Protocol.

### New protocol stack
OAuth 2.0 (RFC 6749), OpenID Connect, SCIM 2.0, SAML 2.0 (still supported), DPoP, mTLS-bound tokens, FIDO2/WebAuthn, Certificate-Based Authentication.

NTLM and Kerberos produce no token that a Conditional Access engine can observe. OAuth/OIDC tokens are the unit that Conditional Access evaluates.

## 5. Why the shift matters

The languages mostly carry over. The protocols, the cryptography, the session unit, and the policy plane do not. Any modernization program that treats the transition as a tooling swap rather than a protocol and governance shift will preserve the silent-failure modes of the old world (NTLM fallback, missing service principal names, opaque SQL Authentication) inside the new one.

---

*Cleaned extraction for project use. No internal branding or document identifiers. Full original contains additional protocol, cryptography, API, and hybrid-bridge sections.*
