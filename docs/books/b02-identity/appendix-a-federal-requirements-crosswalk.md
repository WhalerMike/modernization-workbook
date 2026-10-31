---
title: "Appendix A — Federal Requirements Crosswalk"
description: "Microsoft's Entra security checklist scored for a federal agency with a long Active Directory history, crossed with the CISA BOD 25-01 required SCuBA policies, the identity modernization specification's contract requirements, and NIST SP 800-53 Rev. 5 controls."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b02-identity
book: B02
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Federal Requirements Crosswalk

*A baseline check is a ten-minute toggle in one tenant and a nine-month program in another; the difference is the Active Directory estate behind it.*

::: {.callout-note}
## In this appendix
Microsoft's Entra security checklist and the three filters that decide what a federal agency can do with it. How to read the crosswalk, and a scored set of identity controls tied to the CISA BOD 25-01 required configurations. The contract requirements of the program's identity modernization specification, and the NIST SP 800-53 Rev. 5 controls the identity work supports.
:::

## The assessment in one paragraph

An agency with twenty years of Active Directory behind its Entra ID tenant can put a meaningful part of Microsoft's baseline in place quickly. The consent, guest, logging, emergency-access, legacy-authentication, and privileged-identity checks are mostly covered by licenses the agency already holds, and most are configuration only. Three filters then remove or defer a large share of the checklist before any work starts. Much of the "Protect networks" theme depends on Global Secure Access, which isn't yet available in every government cloud. The AI theme is new, and its availability has to be confirmed cloud by cloud. And the heaviest identity checks (sign-in only from managed devices, token protection, phishing-resistant authentication for everyone, cloud authentication) are gated on device, device-management, and federation modernization that two decades of Active Directory turn into multi-quarter work. The agency's structural advantage is the PIV/CAC card it already issues: Entra certificate-based authentication turns that card into a phishing-resistant credential without a federation server, which speeds up several of the hardest checks.[^aA-cba]

## The baseline

Microsoft publishes a checklist, "Configure Microsoft Entra for increased security," that groups its Entra security recommendations into themes based on the Secure Future Initiative and lists a minimum license for each check. The page is labeled preview, covers workforce tenants, and says Microsoft will add controls over time.[^aA-configure-security] Its seven themes are:

1. Protect identities and secrets
2. Protect tenants and isolate production systems
3. Protect networks
4. Protect engineering systems
5. Monitor and detect cyberthreats
6. Accelerate response and remediation
7. AI

Microsoft's Zero Trust Assessment tool tests a tenant against these checks automatically, which is faster and less error-prone than checking by hand.[^aA-configure-security] The crosswalk below uses the checklist's own check names so that results from the assessment tool can be joined to it directly. Because the checklist changes, an agency should re-pull it before each planning cycle rather than treating this appendix as the current list.

## The three filters

### Filter 1: government-cloud availability

| Theme | What to expect |
|---|---|
| Protect identities and secrets | Available. Two checks for private applications need Entra Internet Access or Private Access licenses, so they follow the network row. |
| Protect tenants and isolate production systems | Available. |
| Protect networks | Mixed. Named locations and Tenant restrictions v2 need only Entra ID P1. Most of the remaining checks need Microsoft Entra Internet Access or Private Access, part of Global Secure Access, which is available in GCC but not yet in GCC High, the Department of Defense cloud, or other sovereign clouds.[^aA-gsa-limits] Treat these as an evaluation, not a quick win. |
| Protect engineering systems | Available. |
| Monitor and detect cyberthreats | Available, except the network-access log checks, which follow Global Secure Access availability. |
| Accelerate response and remediation | Available; needs Entra ID P2 or Microsoft Entra Workload ID, so confirm entitlement.[^aA-configure-security] |
| AI | New checks for agent identities. Confirm availability in the agency's cloud before planning; defer otherwise. |

: Filter 1 — availability by theme {.striped .hover}

The source material said the network theme was "gated or non-FIPS in government clouds." Microsoft's current limitation is narrower and more useful for planning: Global Secure Access runs in GCC, whose tenants use the commercial Entra ID service, and isn't yet supported in GCC High or DoD.[^aA-gsa-limits][^aA-gcc-entra] The FIPS claim couldn't be verified and is dropped.

### Filter 2: licensing

Each check in the checklist names a minimum license: none (included with Entra ID), Entra ID P1, Entra ID P2 or Microsoft Entra ID Governance, Entra Internet Access, Entra Private Access, the Microsoft Entra Suite, or Workload ID.[^aA-configure-security] Most identity, tenant, and engineering checks need P1 or P2, which many federal enterprise agreements already include. In the program's experience the constraint for the majority of checks is operational, not entitlement. The exception is the network theme, where the Internet Access and Private Access licenses are separate purchases and run into Filter 1 as well.

### Filter 3: Active Directory friction

The same check can be a ten-minute toggle or a nine-month program depending on the hybrid estate behind it: directory synchronization, federation through AD FS, applications that still use basic authentication, decades of service accounts, domain-joined devices, and password policy set by on-premises Group Policy. The friction column in the crosswalk names that entanglement and the effort tier prices it. Both are the program's assessment, not Microsoft's.

## How to read the crosswalk

Government-cloud availability:

- **Available**: works in the agency's cloud today.
- **Caveated**: works, with a license, preview, or feature limit noted.
- **Not available**: not supported in the agency's cloud yet.

Active Directory friction:

- **Cloud-only**: no on-premises entanglement.
- **Hybrid-touching**: needs coordination with sync, devices, or users.
- **Legacy-blocking**: gated on retiring or modernizing a long-standing Active Directory dependency.

Effort tier:

- **T0, this week**: a tenant setting with no legacy dependency.
- **T1, days**: the setting is fast; discovery, coordination, and rollout are the work.
- **T2, weeks**: inventory and remediation, or a staged rollout.
- **T3, multi-quarter**: gated on device, identity, or federation modernization.

## The crosswalk: identity controls

The first three columns come from Microsoft's checklist.[^aA-configure-security] The SCuBA column gives the matching mandatory policy from the CISA BOD 25-01 required configurations, where one exists.[^aA-bod-required] The NIST column is the program's mapping to SP 800-53 Rev. 5 controls; the control titles are in the last section. Friction and tier are the program's assessment.

| Check (Microsoft name) | Theme | Minimum license | Friction | Tier | SCuBA mandatory policy | NIST SP 800-53 Rev. 5 |
|---|---|---|---|---|---|---|
| User consent settings are restricted | Identities | None | Cloud-only | T0 | MS.AAD.5.2v1 | AC-6, CM-6 |
| Admin consent workflow is enabled | Identities | None | Cloud-only | T0 | MS.AAD.5.3v1 | AC-6 |
| Creating new applications and service principals is restricted to privileged users | Engineering | P1 | Cloud-only | T0 | MS.AAD.5.1v1 | AC-6, CM-7 |
| Emergency access accounts are configured appropriately | Engineering | P1 | Cloud-only | T0 | — | AC-2 |
| Diagnostic settings are configured for all Microsoft Entra logs | Monitor | P1 | Cloud-only | T0 | — | AU-2, AU-12 |
| Guests can't invite other guests | Tenants | Free | Cloud-only | T0 | — | IA-8, AC-2 |
| Block legacy authentication policy is configured | Identities | P1 | Legacy-blocking | T1, report-only first | MS.AAD.1.1v1 | IA-2, AC-3 |
| Restrict high risk sign-ins | Response | P2 | Cloud-only | T1 | MS.AAD.2.3v1 | SI-4, AC-3 |
| Restrict access to high risk users | Response | P2 | Cloud-only | T1 | MS.AAD.2.1v1 | SI-4, AC-2 |
| Password expiration is disabled | Identities | P1 | Hybrid-touching | T1 | MS.AAD.6.1v1 | IA-5(1) |
| Global Administrator role activation triggers an approval workflow | Engineering | P2 | Cloud-only | T1 | MS.AAD.7.6v1 | AC-6(5) |
| Privileged accounts have phishing-resistant methods registered | Identities | P1 | Hybrid-touching; CBA accelerates | T1 to T2 | MS.AAD.3.6v1 | IA-2(1), IA-2(8), IA-2(12) |
| All privileged role assignments are activated just in time and not permanently active | Identities | P2 | Hybrid-touching | T2 | MS.AAD.7.4v1 | AC-2(7), AC-6(5) |
| Privileged accounts are cloud native identities | Identities | None | Legacy-blocking | T2 to T3 | MS.AAD.7.3v1 | AC-2(7), AC-6(5) |
| All user sign-in activity uses phishing-resistant authentication methods | Identities | P1 | Legacy-blocking; CBA accelerates | T2 to T3 | MS.AAD.3.1v1 | IA-2(1), IA-2(2), IA-2(8), IA-2(12) |
| Use cloud authentication | Identities | P1 | Legacy-blocking (federation migration) | T3 | — | IA-2, IA-5 |
| All sign-in activity comes from managed devices | Identities | P1 | Legacy-blocking (device-management maturity) | T3 | — | AC-3, IA-3 |
| Token protection policies are configured | Identities | P1 | Legacy-blocking (device-join maturity) | T3 | — | SC-23, IA-3 |

: Identity controls scored for a long-standing Active Directory estate {.striped .hover}

Notes on the rows that the Active Directory estate changes most:

- **Password expiration is disabled.** For users in scope of password hash synchronization, the cloud password is set to never expire by default, and the on-premises password policy still governs the password itself.[^aA-phs] Meeting the SCuBA policy for synced users means changing the on-premises policy too, which is why this row is hybrid-touching.
- **Use cloud authentication.** Microsoft's reasoning is that an on-premises federation server is a central point an attacker can use to forge tokens and pivot into the cloud; the remediation is migrating from federation to password hash synchronization or another cloud method.[^aA-zt-identities] For a federated agency, that is a domain-by-domain migration, not a toggle.
- **Phishing-resistant authentication.** OMB M-22-09 requires agency staff to use phishing-resistant multifactor authentication.[^aA-m2209] SCuBA makes it mandatory for all users (MS.AAD.3.1v1), with an alternative MFA method required in the meantime (MS.AAD.3.2v1).[^aA-bod-required] Entra certificate-based authentication with PIV/CAC, FIDO2 security keys, and Windows Hello for Business are the qualifying methods Microsoft lists for M-22-09; Microsoft Authenticator alone isn't phishing-resistant.[^aA-ms-m2209]
- **The source's control names.** Several names in the source material were shortened ("All privileged role assignments are just-in-time"). The table uses Microsoft's current wording so assessment output joins cleanly.

## Sequencing

Start with the T0 and T1 cloud-only checks: consent, application registration, guests, emergency access, logging, risk policies, and legacy authentication in report-only mode. Several of these are also SCuBA mandatory policies, so they close BOD 25-01 findings at the same time. Treat the network and AI themes as gated evaluations, decided by Filter 1. Treat the device-dependent and federation-dependent checks as multi-quarter programs that depend on the attribute and device modernization work in [Chapter 09](09-building-the-entra-target.md) and the cutover sequencing in [Chapter 10](10-migrating-and-governing.md).

## Federal mandates behind the baseline

### CISA BOD 25-01 and the SCuBA baselines

CISA issued Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, on December 17, 2024. It applies to Federal Civilian Executive Branch agencies and covers production cloud tenants for products that have a final SCuBA Secure Configuration Baseline.[^aA-bod2501] Its deadlines were:

| Action | Deadline |
|---|---|
| Report an inventory of in-scope cloud tenants (name and owning agency or component), then update it annually | February 21, 2025 |
| Deploy the SCuBA assessment tools (ScubaGear for Microsoft 365) and begin continuous reporting to CISA, or submit results quarterly | April 25, 2025 |
| Implement all mandatory SCuBA policies on the Required Configurations list | June 20, 2025 |
| Implement future mandatory policy updates | On the timeline CISA posts |
| New in-scope tenants | Mandatory policies and continuous monitoring in place before an Authorization to Operate is granted |

: BOD 25-01 required actions {.striped .hover}

The directive distinguishes mandatory "shall" policies from recommended "should" policies, which are left to the agency.[^aA-bod2501] For Microsoft Entra ID, the Required Configurations page lists twenty mandatory policies, from blocking legacy authentication (MS.AAD.1.1v1) through alerting on Global Administrator activation (MS.AAD.7.8v1).[^aA-bod-required] Policies the crosswalk table doesn't already show:

| SCuBA policy | Requirement (paraphrased) |
|---|---|
| MS.AAD.3.2v1 | If phishing-resistant MFA isn't yet enforced, enforce an alternative MFA method for all users. ScubaGear 2.0.0 checks this as MS.AAD.3.2v2, "MFA shall be enforced for all users"[^aA-scuba-32v2] |
| MS.AAD.3.3v2 | If Microsoft Authenticator is enabled, show login context information |
| MS.AAD.3.4v1 | Set the Authentication Methods Manage Migration feature to Migration Complete |
| MS.AAD.7.1v1 | Assign the Global Administrator role to between two and eight users |
| MS.AAD.7.2v1 | Give privileged users finer-grained roles instead of Global Administrator |
| MS.AAD.7.5v1 | Don't provision highly privileged roles outside a privileged access management system |
| MS.AAD.7.7v1 | Alert on eligible and active highly privileged role assignments |
| MS.AAD.7.8v1 | Alert when a user activates the Global Administrator role |

: Remaining BOD 25-01 mandatory Entra ID policies {.striped .hover}

Two of these interact with Active Directory directly. MS.AAD.7.3v1, cloud-only privileged accounts, means every synced on-premises admin account that holds an Entra role is a finding. MS.AAD.3.4v1 retires the legacy per-user MFA and self-service password reset policies, which many hybrid tenants still carry. The required list changes; CISA notifies agencies of changes to mandatory policies, so the list on cisa.gov, not this table, is authoritative.[^aA-bod2501]

### OMB M-22-09

OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, sets the identity goals that the phishing-resistant rows serve: enterprise-managed identities for agency staff, protected by phishing-resistant multifactor authentication.[^aA-m2209][^aA-ms-m2209]

### CISA Hybrid Identity Solutions Guidance

CISA's Hybrid Identity Solutions Guidance (HISG), written under the SCuBA project, is the federal guidance closest to this book's subject: how on-premises and cloud identity services work together, and what each sign-in architecture costs. It's vendor-neutral and, in its own words, not prescriptive or a source of requirements, so it adds no mandatory rows. It's guidance the crosswalk rows already serve.[^aA-hisg]

| HISG recommendation | Crosswalk row or SCuBA policy | Where the workbook builds it |
|---|---|---|
| Migrate to cloud-based, passwordless authentication with PKI and PIV or CAC, or with FIDO2 and WebAuthn | All user sign-in activity uses phishing-resistant authentication methods (MS.AAD.3.1v1) | [Chapter 10](10-migrating-and-governing.md#the-phishing-resistant-authentication-roadmap), phishing-resistant roadmap |
| Move from on-premises federation to cloud primary authentication; treat federation, pass-through authentication and password sync as transitional | Use cloud authentication | [Chapter 09](09-building-the-entra-target.md#choosing-the-sign-in-method), sign-in method; [Chapter 10](10-migrating-and-governing.md#authentication-modernization) |
| Check that password sync doesn't fall back to a weaker hash | — | [Chapter 09](09-building-the-entra-target.md#choosing-the-sign-in-method): PHS runs the AD hash through PBKDF2 with HMAC-SHA256 before it leaves the server[^aA-phs] |
| Keep privileged accounts cloud-only, not trusting on-premises federation | Privileged accounts are cloud native identities (MS.AAD.7.3v1) | [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md); [Chapter 01](01-why-identity-matters.md#what-a-lift-and-shift-puts-at-risk) |
| Use phishing-resistant MFA | Privileged accounts have phishing-resistant methods registered (MS.AAD.3.6v1) | [Chapter 10](10-migrating-and-governing.md#authentication-methods-policy) |
| Support passkeys in public-facing applications; weigh synced passkeys case by case; no synced authenticators for AAL3 | — | [Chapter 10](10-migrating-and-governing.md#the-phishing-resistant-authentication-roadmap), passkey profiles |
| Prefer SSO over open standards such as OpenID Connect and OAuth 2.0; reach applications that can't modernize through a proxy | Block legacy authentication policy is configured (MS.AAD.1.1v1) | [Chapter 10](10-migrating-and-governing.md#passwords-that-remain-sso-first-then-a-password-manager); [Book 04](../b04-access/index.md) |
| Where passwords remain, prefer SSO, then an enterprise password manager | — | [Chapter 10](10-migrating-and-governing.md#passwords-that-remain-sso-first-then-a-password-manager) |
| Make access decisions on context per request | Restrict high risk sign-ins (MS.AAD.2.3v1); All sign-in activity comes from managed devices | [Chapter 09](09-building-the-entra-target.md#the-policy-set), the Conditional Access policy set |

: HISG recommendations and where the workbook meets them {.striped .hover}

The HISG grounds its case in five sources. Their status on October 31, 2026:

| HISG source | Status | Where the workbook uses it |
|---|---|---|
| CISA Emergency Directive 21-01, SolarWinds Orion | Closed January 8, 2026; CISA judged its purpose met[^aA-ed2101] | [Chapter 01](01-why-identity-matters.md#what-a-lift-and-shift-puts-at-risk); [Book 14, Chapter 02](../b14-compliance/02-the-federal-clock.md) |
| CISA Emergency Directive 21-02, on-premises Exchange | Closed January 8, 2026; remaining actions moved to BOD 22-01[^aA-ed2102] | [Chapter 01](01-why-identity-matters.md#what-a-lift-and-shift-puts-at-risk); [Book 14, Chapter 02](../b14-compliance/02-the-federal-clock.md) |
| OMB M-22-09 | Not rescinded; its FY 2024 deadlines have passed, and the program treats it as in force | This appendix; [Book 11, Chapter 03](../b11-zero-trust/03-what-the-mandates-require.md) |
| CISA Zero Trust Maturity Model, June 2021 draft | Superseded by Version 2.0, April 2023; the HISG's link to the draft no longer resolves[^aA-ztmm] | [Book 11](../b11-zero-trust/index.md) cites Version 2.0 |
| NIST SP 800-207, *Zero Trust Architecture*, August 2020 | Current[^aA-sp800207] | [Book 11](../b11-zero-trust/index.md) |

: The HISG's background sources today {.striped .hover}

## The identity modernization specification

The program's identity modernization specification is the cross-adapter contract for modernizing identity without building any vendor's quirks into the authoritative source. It's the program's design, not an external requirement, and it's what the crosswalk's evidence rests on.

### Contract requirements

1. Dynamic groups are defined by rules over directory attributes.
2. Administrative units and scoped roles replace delegation through organizational units.
3. Access is computed from attributes, not assigned by hand.
4. The rule set that turns attributes into access is itself the audit evidence.

### Integration shape

- Attribute writes for synced users are mastered in the directory, so the directory sync interval is the provisioning floor. With Microsoft Entra Connect Sync, that interval is 30 minutes by default.[^aA-sync-scheduler]
- Device attributes are mastered in the cloud and written through the cloud API.
- Downstream systems reference or synchronize from the authoritative origin; they don't keep independent copies.

[Chapter 05](05-delegation-without-ous.md) describes how requirement 2 is built, and [Chapter 09](09-building-the-entra-target.md) describes the target the requirements produce.

## NIST SP 800-53 Rev. 5 control mapping

The specification supports account management, access enforcement, and continuous monitoring controls by making access a computed property that can be regenerated from the authoritative attributes. The table maps the specification and the crosswalk to SP 800-53 Rev. 5 controls. Control identifiers and titles are checked against Release 5.2.0 of the catalog, issued August 27, 2025.[^aA-sp80053][^aA-oscal-catalog] The mapping itself is the program's: it shows where identity evidence supports a control, not a claim that any configuration satisfies a control by itself. The agency's authorizing official and assessors decide that.

| Control | Title | What the identity work contributes |
|---|---|---|
| AC-2 | Account Management | Lifecycle workflows driven by HR attributes; emergency access accounts defined and monitored |
| AC-2(1) | Automated System Account Management | Provisioning and dynamic group membership computed from attributes |
| AC-2(3) | Disable Accounts | Inactive and departed identities disabled by workflow, not by ticket |
| AC-2(7) | Privileged User Accounts | Cloud-only privileged accounts with just-in-time activation |
| AC-3 | Access Enforcement | Conditional Access evaluates every sign-in to Entra ID |
| AC-3(13) | Attribute-based Access Control | The attribute-to-access rule set (contract requirements 1, 3, and 4) |
| AC-6 | Least Privilege | Restricted consent and app registration; administrative units and scoped roles |
| AC-6(5) | Privileged Accounts | Privileged roles limited, managed in PIM, approval-gated |
| AC-6(7) | Review of User Privileges | Access reviews over groups, roles, and access packages |
| AU-2 | Event Logging | Entra sign-in and audit logs exported through diagnostic settings |
| AU-6 | Audit Record Review, Analysis, and Reporting | Sign-in and audit logs reviewed in the SIEM |
| AU-12 | Audit Record Generation | Every token issuance and directory change produces a record |
| CA-7 | Continuous Monitoring | ScubaGear reporting to CISA and the Zero Trust Assessment run on a schedule against the tenant |
| CM-6 | Configuration Settings | The baseline held as code and compared with the live tenant |
| IA-2 | Identification and Authentication (Organizational Users) | Cloud authentication to Entra ID for all workforce users |
| IA-2(1) | Multi-factor Authentication to Privileged Accounts | Phishing-resistant methods required for privileged roles |
| IA-2(2) | Multi-factor Authentication to Non-privileged Accounts | Phishing-resistant or alternative MFA for all users |
| IA-2(8) | Access to Accounts — Replay Resistant | Certificate-based authentication and FIDO2 credentials |
| IA-2(12) | Acceptance of PIV Credentials | Entra certificate-based authentication with PIV/CAC |
| IA-3 | Device Identification and Authentication | Managed-device and token-protection requirements |
| IA-5 | Authenticator Management | Authentication methods policy; legacy methods retired |
| IA-5(1) | Password-based Authentication | Banned-password list, smart lockout, no forced expiration |
| IA-8 | Identification and Authentication (Non-organizational Users) | Guest restrictions, sponsors, and inactive-guest removal |
| SC-23 | Session Authenticity | Device-bound sign-in session tokens |
| SI-4 | System Monitoring | Risky user and sign-in detection with blocking policies |

: NIST SP 800-53 Rev. 5 controls the identity work supports {.striped .hover}

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 11 — Reference Deployment](11-reference-deployment.md) · [Book index](index.md) · [Next: Appendix B — Forest Assessment Module →](appendix-b-forest-assessment-module.md)
:::

[^aA-cba]: Microsoft Learn, "What is Microsoft Entra certificate-based authentication?," <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication> (accessed Oct 20, 2026).
[^aA-configure-security]: Microsoft Learn, "Configure Microsoft Entra for increased security (Preview)," <https://learn.microsoft.com/entra/fundamentals/configure-security> (accessed Oct 20, 2026).
[^aA-gsa-limits]: Microsoft Learn, "Known limitations for Global Secure Access," section "Global Secure Access In Government Cloud limitations," <https://learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations> (accessed Oct 20, 2026).
[^aA-gcc-entra]: Microsoft Learn, "Dynamics 365 US Government," <https://learn.microsoft.com/power-platform/admin/microsoft-dynamics-365-government> (accessed Oct 20, 2026). The page contrasts GCC High and DoD, which use Microsoft Entra Government, with GCC, which uses the public Microsoft Entra ID service.
[^aA-scuba-32v2]: Cybersecurity and Infrastructure Security Agency, ScubaGear Microsoft Entra ID secure configuration baseline (`aad.md`, released with ScubaGear v2.0.0 on October 22, 2026), policy MS.AAD.3.2v2, last modified February 2026, <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md> (accessed Oct 25, 2026). The BOD 25-01 Required Configurations page still lists MS.AAD.3.2v1 on that date.
[^aA-bod-required]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (accessed Oct 20, 2026).
[^aA-phs]: Microsoft Learn, "Implement password hash synchronization with Microsoft Entra Connect Sync," <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-password-hash-synchronization> (accessed Oct 20, 2026).
[^aA-zt-identities]: Microsoft Learn, "Configure Microsoft Entra for Zero Trust: Protect identities and secrets," <https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-identities> (accessed Oct 20, 2026).
[^aA-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, <https://bidenwhitehouse.archives.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026).
[^aA-ms-m2209]: Microsoft Learn, "Meet multifactor authentication requirements of memorandum 22-09," <https://learn.microsoft.com/entra/standards/memo-22-09-multi-factor-authentication> (accessed Oct 20, 2026).
[^aA-hisg]: Cybersecurity and Infrastructure Security Agency, *Hybrid Identity Solutions Guidance*, §1.3 (vendor-neutral; not prescriptive and sets no requirements), §1.4 (primary recommendation), §3.1–3.6, <https://www.cisa.gov/resources-tools/services/hybrid-identity-solutions-guidance-hisg> (accessed Oct 31, 2026).
[^aA-ed2101]: Cybersecurity and Infrastructure Security Agency, Emergency Directive 21-01, "Mitigate SolarWinds Orion Code Compromise" (closed January 8, 2026), <https://www.cisa.gov/emergency-directive-21-01> (accessed Oct 31, 2026).
[^aA-ed2102]: Cybersecurity and Infrastructure Security Agency, Emergency Directive 21-02, "Mitigate Microsoft Exchange On-Premises Product Vulnerabilities" (closed January 8, 2026; required actions transitioned to BOD 22-01), <https://www.cisa.gov/emergency-directive-21-02> (accessed Oct 31, 2026).
[^aA-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, <https://www.cisa.gov/sites/default/files/2023-04/CISA_Zero_Trust_Maturity_Model_Version_2_508c.pdf> (accessed Oct 31, 2026). The HISG cites the June 2021 draft at <https://www.cisa.gov/sites/default/files/publications/CISA%20Zero%20Trust%20Maturity%20Model_Draft.pdf>, which returned HTTP 404 on October 31, 2026.
[^aA-sp800207]: National Institute of Standards and Technology, SP 800-207, *Zero Trust Architecture*, August 2020, <https://doi.org/10.6028/NIST.SP.800-207> (accessed Oct 31, 2026).
[^aA-bod2501]: Cybersecurity and Infrastructure Security Agency, BOD 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Oct 20, 2026).
[^aA-sync-scheduler]: Microsoft Learn, "Microsoft Entra Connect Sync: Scheduler," <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler> (accessed Oct 20, 2026).
[^aA-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020 (updated December 10, 2020; Release 5.2.0, August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026).
[^aA-oscal-catalog]: National Institute of Standards and Technology, *NIST SP 800-53 Rev. 5 catalog* (OSCAL JSON, Release 5.2.0), usnistgov/oscal-content, <https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Oct 20, 2026).
