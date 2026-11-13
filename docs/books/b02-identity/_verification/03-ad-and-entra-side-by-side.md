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

## Revision 2026-11-09 — Learn gap additions (security identifiers)

New section "Security identifiers, and what replaces them" (Learn coverage gap ws-10). Learn pages read Nov 9, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| G1 | A security principal is anything the OS can authenticate (user, computer, their security groups); access tokens hold SIDs compared with ACEs | §Security identifiers | verified | <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-security-principals> |
| G2 | Domain SID + RID; RID master hands out blocks; unique in scope, never reused; recreated user gets a new SID | §Security identifiers | verified | <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-security-identifiers> |
| G3 | Well-known SIDs: -500, -512, -513, -515, -518, -519, S-1-5-32-544, S-1-1-0, S-1-5-11 | Table | verified | understand-security-identifiers; <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-special-identities-groups> |
| G4 | Special identity group membership is computed by the OS and can't be viewed or modified | Table | verified | understand-special-identities-groups |
| G5 | "No Entra ID group to map to" for Everyone and Authenticated Users; built-in Administrator rights don't carry over | Table | restated-as-design (program reading of the migration impact) | — |
| G6 | SID changes across domains; old SID kept in multi-valued `sIDHistory`; all SIDs in the token | §Security identifiers | verified | understand-security-identifiers |
| G7 | SID history injection risk across a trust without SID filtering; `/quarantine` accepts only directly trusted domain SIDs | §Security identifiers | verified | <https://learn.microsoft.com/defender-for-identity/security-posture-assessments/accounts>; <https://learn.microsoft.com/windows-server/administration/windows-commands/netdom-trust> |
| G8 | `onPremisesSecurityIdentifier` on users and groups; group `securityIdentifier` for Windows scenarios | §Security identifiers | verified | Graph user and group resource types |
| G9 | Entra-joined device local admin by group SID of the form S-1-12-1 | §Security identifiers | verified | <https://learn.microsoft.com/entra/identity/devices/assign-local-admin>; <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-localusersandgroups> |

## Revision 2026-11-09 — Learn citation pass

Covered-but-uncited Learn pages cited where the chapter already says what they say. No wording changed.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | In the old world the domain controller is the trust root (AD DS integrates sign-in authentication and access control; DCs hold and replicate the directory) | The shift in one paragraph | verified (Learn read Nov 9, 2026) | <https://learn.microsoft.com/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview> |
| L2 | Group Policy configures domain-joined machines; device configuration moves to a device-management service | At a glance, caveat paragraph | verified (Learn read Nov 9, 2026) | <https://learn.microsoft.com/entra/fundamentals/compare> |
| L3 | SAML and WS-Federation reach SaaS applications through AD FS, a separate federation server | AD protocol stack | verified (Learn read Nov 9, 2026) | <https://learn.microsoft.com/windows-server/identity/ad-fs/ad-fs-overview>; <https://learn.microsoft.com/entra/fundamentals/compare> |

## Revision 2026-11-13 — Windows Server 2025 retirements

The 2026 status table became the workbook's single status list (Mike's approval, Nov 13, 2026), gained a "Find it" column, and a second table for platform features. Points where Microsoft's own pages disagree were left out and are tracked as open research outside the workbook: the TLS 1.0/1.1 default on Windows Server 2025, inbound SMB signing on member servers, the 0x18 versus 0x24 KDC default, AES on trusts after November 2022, and the WSUS driver-sync date.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Enhanced NTLM auditing events 4020–4023 and 4030–4033 with a reason code; on by default in WS2025 and 24H2; WS2019/2022 from Oct 13, 2026 updates | Status table, NTLM | verified (read Nov 13, 2026) | KB5064479 |
| R2 | NTLMv1 SSO events 4024/4025; `BlockNtlmv1SSO` 0 audit, 1 enforce | Status table, NTLMv1 | verified (read Nov 13, 2026) | KB5066470 |
| R3 | WS2025 removes the "Do not store LAN Manager hash value" policy | Status table, NTLMv2/LANMAN | verified (read Nov 13, 2026) | What's new in Windows Server 2025 |
| R4 | WS2025 KDCs don't issue RC4 TGTs | Status table, RC4 | verified (read Nov 13, 2026) | What's new in Windows Server 2025 |
| R5 | KB5073381 phases: Jan 13, 2026 audit events; Apr 14, 2026 AES-only assumed default with rollback; July 2026 rollback setting no longer read | Status table, RC4 | verified with a note: the KB's Take Action text says enforcement comes "on or after April 2026" and a Note says "July 2026"; read together, April enforces with rollback and July removes rollback. Day in July not given | KB5073381 (read Nov 13, 2026) |
| R6 | Accounts without AES keys, RC4-only clients and RC4-only keytabs break; a password change creates AES keys; allow RC4 per account, not domain-wide | Status table, RC4 | verified (read Nov 13, 2026) | Detect and remediate RC4 usage in Kerberos; KB5073381 |
| R7 | Events 201–209 (System, Kdcsvc); 4768/4769 type 0x17 = RC4; Kerberos-Crypto scripts | Status table, RC4 | verified (read Nov 13, 2026) | KB5073381; Detect and remediate RC4 |
| R8 | DES disabled since 2008 R2, removed from WS2025 and 24H2; types 0x1/0x3 | Status table, DES | verified (read Nov 13, 2026) | Features removed (Windows Server); Detect and remediate RC4 |
| R9 | Trust referrals use the trust's encryption types; trust supports RC4 not AES by default; fix with the AES checkbox on both sides or `ksetup /setenctypeattr` | Status table, trusts | verified as Microsoft's statement (article updated Feb 2026). A non-Microsoft analysis says AES is used since Nov 2022; the row says to set and test, not which default applies | Kerberos unsupported etype error (read Nov 13, 2026) |
| R10 | KB5014754 Full Enforcement Feb 11, 2025; Compatibility mode ended Sep 9, 2025; events 39/40/41 | Status table, certificate sign-in | verified (read Nov 13, 2026); matches Book 07 | KB5014754 |
| R11 | LDAP signing: set the policy explicitly before the first WS2025 DC (follows from "no policy set → required" on upgrade); events 2887/2889 | Status table, LDAP signing | verified (read Nov 13, 2026) | LDAP signing overview |
| R12 | Channel binding events 3039–3041, 3074, 3075 | Status table, channel binding | verified (read Nov 13, 2026) | LDAP channel binding overview |
| R13 | WS2025 requires outbound SMB signing; DCs require inbound; STATUS_INVALID_SIGNATURE; guest access stops; audit events 31998/31999 and 3021/3022 | Status table, SMB signing | verified (read Nov 13, 2026). The hardening page says inbound too on all WS2025; two pages say outbound only, so the row says outbound and DCs | Control SMB signing behavior; Overview of SMB signing |
| R14 | SMB1 not installed by default since WS2019; events 32000/32002 | Status table, SMB1 | verified (read Nov 13, 2026) | SMBv1 isn't installed by default |
| R15 | TLS 1.0/1.1 deprecated in WS2025; RSA ≥ 2,048 for TLS server auth; Schannel 36871 / 10013 | Status table, TLS | verified (read Nov 13, 2026). The default state on WS2025 is disputed between Learn pages and is not stated | Features removed; What's new WS2025; TLS 1.0/1.1 deprecation |
| R16 | Credential Guard on by default on domain-joined WS2025 non-DC machines meeting requirements; blocks unconstrained delegation, DES, NTLMv1 | Status table, Credential Guard | verified (read Nov 13, 2026) | Credential Guard overview |
| R17 | WS2025 DC: confidential attributes only over encrypted LDAP; legacy remote SAM password-change methods blocked; default machine password refused; legacy SupportedEncryptionTypes registry value ignored | Status table, other DC changes | verified (read Nov 13, 2026) | What's new in Windows Server 2025 |
| R18 | PowerShell 2.0 removed from WS2025 from the September 2025 update; `-version 2` starts 5.1 | Platform table | verified (read Nov 13, 2026) | Features removed; KB5065506 |
| R19 | WordPad, IIS 6 Management Console, SMTP Server, Internet Explorer removed in WS2025; SMTP Server has no in-box replacement | Platform table | verified (read Nov 13, 2026) | Features removed |
| R20 | VBScript FOD preinstalled in WS2025; not enabled by default around 2027 (blog); removal date not yet specified | Platform table | verified (read Nov 13, 2026) | Features removed; VBScript deprecation blog (May 22, 2024) |
| R21 | WMIC FOD in WS2025; removed from 24H2+ in August 2026; server removal not yet specified | Platform table | verified (read Nov 13, 2026) | Features removed; Features removed in Windows client |
| R22 | WSUS deprecated, supported, still updated; no current plans to remove from WS2025; Azure Update Manager, Intune, Autopatch named | Platform table | verified (read Nov 13, 2026) | Features removed; WSUS overview; WSUS deprecation blog (Sep 20, 2024) |
| R23 | Windows Internal Database deprecated; used by AD FS, IPAM, RD Connection Broker, WSUS | Platform table | verified (read Nov 13, 2026) | Features removed |
| R24 | Remote Mailslots disabled by default in WS2025; Computer Browser deprecated | Platform table | verified (read Nov 13, 2026) | Features removed; What's new WS2025 |
| R25 | WS2025 FL and 32k pages need every DC on WS2025; 32k is irreversible | Platform table | verified (read Nov 13, 2026) | What's new WS2025; 32k pages optional feature |
