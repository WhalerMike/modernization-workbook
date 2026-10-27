# Verification — Chapter 03, Active Directory and Entra ID, Side by Side

File: `docs/books/b02-identity/03-ad-and-entra-side-by-side.md`
Diagram sources: `docs/images/diagrams/b02-identity/src/ch03-two-worlds.flow.yaml`, `ch03-protocol-mapping.flow.yaml`
Verified: 2026-10-20

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Conditional Access policies are enforced after first-factor authentication to Entra ID | Shift; CA section | verified | learn.microsoft.com/entra/identity/conditional-access/overview |
| 2 | Cloud-native devices reaching on-prem resources get a Kerberos TGT or NTLM token from the DC | Shift; CA section | verified | learn.microsoft.com/intune/solutions/cloud-native-endpoints/on-premises-resources |
| 3 | Source: "NTLM and Kerberos produce no token that a Conditional Access engine can observe" | CA section | corrected (restated as: Kerberos/NTLM settle at the DC and never reach CA; CA runs on sign-ins to Entra) | rows 1–2 |
| 4 | PHS: MD4 hash, per-user salt, PBKDF2 with 1,000 iterations of HMAC-SHA256; MD4 hash never sent | At a glance; Cryptography | verified | learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-password-hash-synchronization |
| 5 | Source: cloud hash "stored in HSM-backed boundary" | Cryptography | removed (not stated by Microsoft) | — |
| 6 | Source: Entra token signing "RS256, ES256, ES384" | Cryptography | corrected (Microsoft documents RS256 as the example/typical alg; ES256/ES384 dropped) | learn.microsoft.com/entra/identity-platform/access-tokens |
| 7 | Kerberos v5 is RFC 4120 | Protocol stack | verified | rfc-editor.org/rfc/rfc4120 |
| 8 | SPNEGO is RFC 4178 | Protocol stack | verified | rfc-editor.org/rfc/rfc4178 |
| 9 | OAuth 2.0 is RFC 6749 | Protocol stack | verified | rfc-editor.org/rfc/rfc6749 |
| 10 | OpenID Connect Core 1.0 (errata set 2) | Protocol stack | verified | openid.net/specs/openid-connect-core-1_0.html |
| 11 | SCIM 2.0 is RFC 7643 (schema) and RFC 7644 (protocol) | Protocol stack | verified | rfc-editor.org/rfc/rfc7643, rfc7644 |
| 12 | Entra is a SCIM client for app provisioning and can be a SCIM service provider | Protocol stack | verified | learn.microsoft.com/entra/identity/app-provisioning/scim-support-in-entra-id |
| 13 | Source: "DPoP, mTLS-bound tokens" are part of the Entra stack | Protocol stack; diagram 2 | corrected (Microsoft says Entra "aims to support" mTLS PoP and DPoP; SHR being phased out; Token Protection binds sign-in session tokens) | learn.microsoft.com/entra/msal/dotnet/advanced/proof-of-possession-tokens; .../conditional-access/concept-token-protection |
| 14 | RFC 8705 mTLS certificate-bound tokens; RFC 9449 DPoP | Protocol stack | verified | rfc-editor.org/rfc/rfc8705, rfc9449 |
| 15 | Entra CBA validates X.509 incl. PIV/CAC/derived PIV directly, no AD FS | Protocol stack; at a glance | verified | learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication; .../standards/memo-22-09-multi-factor-authentication |
| 16 | Kerberos-dependent apps can be bridged with application proxy + KCD | Mapping | verified | learn.microsoft.com/entra/architecture/auth-kcd |
| 17 | Legacy-auth clients don't support MFA or pass device state; blocked by MFA/compliance grant controls | CA section | verified | learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-conditions |
| 18 | NTLM (all versions) deprecated June 2024 | 2026 status table | verified | learn.microsoft.com/windows/whats-new/deprecated-features |
| 19 | NTLMv1 removed in Windows 11 24H2 and Windows Server 2025 | 2026 status table | verified | same as 18; windows-server removed features page |
| 20 | Oct 2026 security update restricts NTLMv1-derived SSO credentials by default on devices without Credential Guard (MS-CHAPv2 impact) | 2026 status table | verified | learn.microsoft.com/windows/release-health/windows-message-center (2026-10-14 entry; KB5066470) |
| 21 | NTLMv2/LANMAN deprecated in WS2025; NTLMv2 removal in a future release | 2026 status table | verified | learn.microsoft.com/windows-server/get-started/removed-deprecated-features-windows-server |
| 22 | Jan 29, 2026 plan: auditing now, IAKerb/local KDC 2H 2026, network NTLM disabled by default next major release, re-enable by policy | 2026 status table; prose | verified (via search result summary of the blog post; Learn message center links the same post) | techcommunity.microsoft.com/.../4489526 |
| 23 | Source: NTLM simply "legacy" | 2026 status | corrected (deprecation/removal schedule stated) | rows 18–22 |
| 24 | Kerberos RC4 deprecated in WS2025; DES removed | 2026 status; cryptography | verified | removed-deprecated-features-windows-server |
| 25 | LDAP signing required by default for new WS2025 deployments; upgrades preserve policy; no policy → required | 2026 status table | verified | learn.microsoft.com/windows-server/identity/ad-ds/ldap-signing |
| 26 | LDAP channel binding defaults: WS2025 new "When supported" + auditing; WS2022 and earlier "Never", auditing since 2023-03 | 2026 status table | verified | learn.microsoft.com/windows-server/identity/ad-ds/ldap-channel-binding |
| 27 | Provisioning service channel uses TLS 1.2 | Cryptography | verified | learn.microsoft.com/entra/identity/app-provisioning/how-provisioning-works |
| 28 | ActiveDirectory PowerShell module uses ADWS on the DC | Languages; diagram 2 | verified | learn.microsoft.com/services-hub/.../configure-the-active-directory-web-services-adws-... |
| 29 | Azure AD, Azure AD Preview, MSOnline modules deprecated; use Graph PowerShell (MSAL, PS 7) | Retired modules | verified | learn.microsoft.com/powershell/microsoftgraph/migration-steps |
| 30 | MSOnline stopped working early Apr–late May 2025; AzureAD retirement scheduled later in 2025 | Retired modules | verified (exact AzureAD end date not pinned; stated as "later in 2025") | learn.microsoft.com/entra/fundamentals/whats-new-archive (Jan 2025) |
| 31 | Microsoft checklist includes "Block legacy Azure AD PowerShell module" | Retired modules | verified | learn.microsoft.com/entra/fundamentals/configure-security |
| 32 | Entra PowerShell provides AzureAD backward compatibility; cmdlet maps exist | Retired modules | verified | learn.microsoft.com/powershell/entra-powershell/overview |
| 33 | MSAL libraries: .NET, Java, Python, JS/Node/React/Angular, Go, Android, iOS/macOS | Languages | verified | learn.microsoft.com/entra/msal/overview |
| 34 | VBScript deprecated; FoD in WS2025 before removal | Languages | verified | removed-deprecated-features-windows-server |
| 35 | Get-ADUser / Connect-MgGraph / Get-MgUser parameters used in the sample | Code | verified (existing cmdlets/parameters; no new cmdlets invented) | Graph PowerShell docs (migration-steps, cmdlet map) |
| 36 | Graph Bicep extension declares groups, apps, service principals; limited resource set | IaC | verified | learn.microsoft.com/graph/templates/bicep/overview-bicep-templates-for-graph |
| 37 | Role-assignable groups and app passwords not supported by Graph Bicep | IaC | verified | learn.microsoft.com/graph/templates/bicep/limitations |
| 38 | Source: Terraform, Pulumi, ARM for Entra | IaC | restated-as-design ("other declarative tools") | — |
| 39 | Source: OSCAL has seven models | IaC/compliance | corrected (NIST page lists eight, incl. Control Mapping) | pages.nist.gov/OSCAL/learn/concepts/layer/ |
| 40 | Kerberos default max clock skew 5 minutes | Adapter table (NTP) | verified | learn.microsoft.com/troubleshoot/windows-server/windows-security/kerberos-protocol-registry-kdc-configuration-keys |
| 41 | Entra Connect Sync default cycle 30 minutes | Eight concepts | verified | learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler |
| 42 | Eight core concepts and adapter alignment | Eight concepts | restated-as-design (program architecture principles) | — |
| 43 | Source: password hash "PBKDF2-HMAC-SHA256" for all Entra users | At a glance | corrected (applies to synced users with PHS) | row 4 |
| 44 | Source: "OIDC primary; WS-Fed legacy" federation row | At a glance | restated (SAML 2.0 and OIDC to the tenant; WS-Fed via AD FS on the AD side) | — |
| 45 | Source: crypto "MD4 / RC4 / SHA-1 with AES bolted on later"; "FIPS-validated HSM-backed keys" | Shift paragraph | removed (not verified as stated; replaced by sourced crypto table) | — |
| 46 | Diagnostic settings stream Entra logs to SIEM | At a glance | verified (checklist item "Diagnostic settings are configured for all Microsoft Entra logs") | learn.microsoft.com/entra/fundamentals/configure-security |
| 47 | An API calling another API as the user uses OAuth 2.0 OBO, with delegated scopes only, never roles | Protocol mapping | verified | c03-obo |
| 48 | Entra ID has no counterpart to unconstrained Kerberos delegation; findings are fixed in AD | Protocol mapping | restated-as-design (follows from the OBO model; Entra issues per-audience tokens) | c03-obo |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| `docs/learning/old-ad-vs-new-entra-reference.md` — title and subtitle | Chapter title, description | — |
| same — §1 The shift in one paragraph | "The shift in one paragraph" (rewritten; unverifiable crypto list moved to the sourced Cryptography table) | HSM and "MD4/RC4/SHA-1 bolted on" phrasing removed (claims 5, 45) |
| same — pull quote ("languages mostly carry over…") | Italic thesis (reworded) and "Why the shift matters" | — |
| same — §2 The world at a glance | "The two worlds at a glance" table (corrected rows) + diagram `ch03-two-worlds` | IaC row tools restated (claim 38) |
| same — §3 Languages: C++, Visual Basic, .NET, Python, PowerShell, YAML, TypeScript/JavaScript, Go/Java/Rust | "Languages and tooling" table; "The retired modules"; illustrative code | Rust dropped (no MSAL for Rust in Microsoft's library list) |
| same — §4 Old protocol stack | "The Active Directory protocol stack" | Kerberos FAST, MS-PAC, Group Policy Protocol not itemized (detail; covered by Kerberos/MS-RPC/SMB bullets) |
| same — §4 New protocol stack | "The Entra ID protocol stack" + diagram `ch03-protocol-mapping` | DPoP/mTLS corrected (claim 13) |
| same — §4 CA-observability sentence | "What Conditional Access can and can't see" | Corrected (claim 3) |
| same — §5 Why the shift matters | "Why the shift matters" | — |
| same — footer ("Full original contains additional … sections") | Not carried | Provenance note about an unavailable original; no content |
| `docs/architecture/directory-migration/eight-core-concepts.md` — intro | "The eight core concepts of directory migration" intro | — |
| same — Core concepts table | Eight core concepts table | — |
| same — Alignment to Directory Migration (eight adapters) | "How the concepts map to the migration adapters" table, with a why column; sync-retirement paragraph | — |
| same — footer | Not carried | Provenance boilerplate |
| `docs/learning/README.md` — title, intro, Contents table, How to use | Not carried | Navigation page for the two learning references; both references are consolidated into this chapter and Appendix A |
