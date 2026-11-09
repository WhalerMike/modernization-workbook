# Verification — Chapter 03, The Conditional Access Model

Sources: `docs/libraries/conditional-access-principles.md` (all sections); `docs/operational-guides/conditional-access-policy-library.md` (architecture, deployment, GPO mapping); `docs/operational-guides/access-plane/conditional-access-library.md` §1–§2. All sources accessed Oct 20, 2026. The rest of the main library is ledgered in `07-the-conditional-access-policy-library.md` and `appendix-a-conditional-access-templates.md` in this folder.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A policy is an if-then of assignments and access controls | Opening | verified | concept-conditional-access-policies |
| 2 | Access tokens are issued by default when no policy triggers a control | Opening; Policies come in pairs | verified (added) | plan-conditional-access |
| 3 | Minimum enforceable policy: name, users, target resources, grant or block | What a policy is made of | verified | concept-conditional-access-policies |
| 4 | CA needs P1; risk needs P2; workload identities need Workload ID Premium | What a policy is made of | verified | overview#license-requirements; workload-identity |
| 5 | Expired licenses: policies keep enforcing, can't be updated | What a policy is made of | verified | overview#license-requirements; workload-identity |
| 6 | CA runs after first-factor authentication; not a DoS front line | What a policy is made of | verified | concept-assignment-network |
| 7 | Policies re-evaluated at token refresh, about hourly | What a policy is made of | verified | concept-assignment-network ("When is a location evaluated") |
| 8 | CAE critical events list; up to 15 minutes; IP enforcement instant | What a policy is made of | verified | concept-continuous-access-evaluation |
| 9 | User assignment options; six guest/external types; All users includes guests | Users, groups | verified | concept-conditional-access-users-groups |
| 10 | Exclusion overrides inclusion | Users, groups; How policies combine | verified (source principle 5) | concept-conditional-access-users-groups |
| 11 | Role targeting: built-in roles only; no AU-scoped or custom roles | Users, groups | verified | concept-conditional-access-users-groups |
| 12 | Role/group targeting evaluated at token issuance; PIM activation recommendation | Users, groups | verified | concept-conditional-access-policies |
| 13 | Nested groups apply; direct-user limit; 2,048-group membership limit | Users, groups | verified | concept-conditional-access-users-groups |
| 14 | Workload identity scope, direct assignment, block-only | Users, groups | verified | workload-identity |
| 15 | Agent targets in preview; agent identities block only | Users, groups | verified | concept-conditional-access-grant |
| 16 | Baseline MFA for all users/all resources without exclusions; Graph can't be targeted | Target resources | verified | concept-conditional-access-cloud-apps |
| 17 | Low-privilege scope exemption change rolling out from March 2026 | Target resources | verified | concept-conditional-access-cloud-apps |
| 18 | Office 365, Windows Azure Service Management API, Microsoft Admin Portals contents | Target resources | verified | concept-conditional-access-cloud-apps |
| 19 | Filter for applications: custom security attributes, string only, roles, token-time evaluation | Target resources | verified | concept-filter-for-applications |
| 20 | User actions; device action allows only MFA/auth strength | Target resources | verified | concept-conditional-access-cloud-apps |
| 21 | Authentication context c1–c99 | Target resources | verified | concept-conditional-access-cloud-apps |
| 22 | Named location limits 195 / 2,000 / mask > /8; trusted improves ID Protection | Network | verified | concept-assignment-network |
| 23 | Country by IP or GPS; unknown countries option | Network | verified | concept-assignment-network |
| 24 | Proxy/VPN: XFF ignored; IP list "nearly impossible" | Network | verified | concept-assignment-network |
| 25 | Conditions table (risk P2, insider risk P2 + Purview, platform from unverified sources, client apps default all, legacy auth can't MFA) | Conditions | verified | conditions; recommendation-insider-risk-condition; concept-conditional-access-policies |
| 26 | Device state condition deprecated; use filter for devices | Conditions | verified | concept-conditional-access-conditions |
| 27 | Device filter: unregistered = null; negative operators; extension attributes need Intune/compliant/hybrid; 3,072-char rule; set through Graph | Conditions | verified | concept-condition-filters-for-devices |
| 28 | Device code flow: block where possible; protocol tracking; Device Registration Service enforcement from Sept 2024 | Conditions | verified | concept-authentication-flows |
| 29 | Grant control list; AND default, OR optional | Grant controls | verified | concept-conditional-access-grant |
| 30 | MFA and auth strength can't be combined | Grant controls | verified | concept-authentication-strengths |
| 31 | Compliant device platforms; InPrivate noncompliant; hybrid join Windows only; device code flow unsupported | Grant controls | verified | concept-conditional-access-grant |
| 32 | Approved client app retired; read-only since June 30, 2026 | Grant controls | corrected (source library uses it in CA-020/CA-040; grant page still says "early March 2026", migration page dated May 2026 gives June 30, 2026) | migrate-approved-client-app |
| 33 | Password change constraints; paired with MFA | Grant controls | verified | concept-conditional-access-grant; Graph conditionalAccessGrantControls |
| 34 | Risk remediation: auto auth strength + SIF every time; not for guests; precedence block > remediation > password change | Grant controls | verified | concept-conditional-access-grant; managed-policies |
| 35 | Built-in strength contents and Graph IDs …0002/…0003/…0004 | Authentication strengths | corrected (source said Passwordless MFA = FIDO2/WHfB/CBA only; it also includes Authenticator phone sign-in) | concept-authentication-strengths; Graph list authenticationStrengthPolicies |
| 36 | Custom strengths can restrict FIDO2 by AAGUID | Authentication strengths | verified | Graph list authenticationStrengthPolicies (combinationConfigurations); New-MgPolicyAuthenticationStrengthPolicy |
| 37 | Strength limits: doesn't restrict first factor; email OTP unsupported; SIF known issue; WHfB as primary only | Authentication strengths | verified | concept-authentication-strengths |
| 38 | Session controls table (app-enforced EXO/SPO only; MDCA; SIF default 90 days, every time scope; persistent browser needs all resources; CAE disable conditions; resilience defaults; token protection) | Session controls | verified | concept-conditional-access-session; concept-session-lifetime; Graph session/SIF resources |
| 39 | Frequent reauthentication trains users to approve prompts | Session controls | verified | concept-session-lifetime |
| 40 | "Session controls are additive; shortest SIF wins" | How policies combine | restated-as-design (stated as a consequence of "all policies must be satisfied"; no Microsoft precedence statement found) | — |
| 41 | No priority/ordering; all applicable policies satisfied; block wins; two phases | How policies combine | verified (source principles 1–2) | concept-conditional-access-policies |
| 42 | Source principle 3 "grant controls combine as AND by default" | How policies combine | corrected (AND is the default *within* a policy; *across* policies every policy must be satisfied, which is not an operator) | concept-conditional-access-policies; grant |
| 43 | Prompt order and its sign-in log pattern | How policies combine | verified | concept-conditional-access-policies; concept-conditional-access-grant |
| 44 | Payroll example: grant policy plus block policy | Policies come in pairs | verified | plan-conditional-access |
| 45 | Assignment required limits tokens to assigned principals; Global Administrators bypass | Policies come in pairs | verified | application-properties |
| 46 | Microsoft-managed policies: list, report-only first, enabled ≥30 days later, can't rename/delete, audit initiator | Microsoft-managed policies | verified (added) | managed-policies |
| 47 | Adopt/supersede decision for managed policies | Microsoft-managed policies | restated-as-design | program |
| 48 | Report-only results and Graph enum values incl. reportOnlyInterrupted | Report-only mode | verified | concept-conditional-access-report-only; Graph appliedConditionalAccessPolicy |
| 49 | User actions can't be report-only; compliance cert prompts on macOS/iOS/Android; GPS prompts | Report-only mode | verified | concept-conditional-access-report-only; concept-assignment-network |
| 50 | Policy impact (Security Reader); workbook needs P1 + Log Analytics; copy-and-compare | Report-only mode | verified | concept-conditional-access-report-only |
| 51 | Source: "monitor 7 days minimum" | Report-only mode | verified (Microsoft: at least one week) | plan-conditional-access |
| 52 | Exclude emergency access and sync/service accounts; service principals unaffected by user policies | Exclusions | verified | plan-conditional-access |
| 53 | Report-only policies don't need the emergency exclusion | Exclusions | verified (via Book 02 Ch09) | Book 02 Ch09 [^c09-emergency-access] |
| 54 | Test exclusions; other policies may still prompt | Exclusions | verified | plan-conditional-access |
| 55 | Unpopulated attributes cause policy bypass | Exclusions | restated-as-design (logical consequence; carried from source "Important" note) | — |
| 56 | BOD 25-01 makes PR MFA for all users and for highly privileged roles mandatory; alternative MFA only interim | Principles | verified | cisa.gov BOD 25-01; required configurations (MS.AAD.3.1, 3.2, 3.6) |
| 57 | 240-policy tenant limit (all states); JSON size limit | Principles | corrected (source implied no limit; older figure 195 is the named-location limit) | plan-conditional-access |
| 58 | Protected actions for policy changes; policy as code via Graph | Principles | verified | plan-conditional-access |
| 59 | 30-day soft delete for policies and named locations | Principles | corrected (source said deletion makes restoration impossible) | plan-conditional-access; concept-assignment-network |
| 60 | Microsoft naming guidance and EM01 emergency pattern | Naming | verified | plan-conditional-access |
| 61 | `CA{NNN}-…` convention, number ranges, group prefixes | Naming | restated-as-design | program (Book 02 Ch09) |
| 62 | Persona table | Personas | verified against Book 02 Ch09 (consistent); group names restated-as-design | Book 02 Ch09, App C |
| 63 | Device `extensionAttribute1` = PAW / Shared | Personas | restated-as-design (source used device extensionAttribute4/11/12 inconsistently and conflated them with user attributes) | concept-condition-filters-for-devices (mechanism) |
| 64 | Source extension attribute schema (ext1 Region … ext6 DeviceRole) | — | corrected / not carried (conflicts with the program's user attribute layout in Book 02 App C; device attributes are separate objects) | Book 02 App C |
| 65 | "Hybrid Azure AD joined" naming | Throughout | corrected (Microsoft Entra hybrid joined) | concept-conditional-access-grant |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| principles: Purpose | Ch03 opening; Ch01 (other writer) | — |
| principles: Policy evaluation model (5 rules) | Ch03 How policies combine | Rule 3 corrected (claim 42) |
| principles: Deployment methodology | Ch03 Report-only mode; principle 6 | — |
| principles: Break-glass procedure | Ch03 Exclusions (links Book 02 Ch09) | Detail owned by Book 02 Ch09 and Ch02/Vol III |
| principles: GPO-to-CA transformation table | Ch01 (already carried by its writer); working list in Ch07 Retiring Group Policy | Not duplicated in Ch03 |
| principles: Targeting (dynamic groups from attributes; bypass warning) | Ch03 Exclusions, Personas | — |
| principles: Full library pointer | Ch07, Appendix A | — |
| twin: Purpose | Ch03 opening | — |
| twin: Policy architecture (tiers table) | Ch07 wave structure | Tier taxonomy replaced by personas and waves |
| twin: Deployment methodology (6 steps) | Ch07 Rollout | — |
| twin: GPO-to-CA mapping (incl. time-of-day row) | Ch07 Retiring Group Policy | Time-of-day row not carried: Conditional Access has no time condition, and the twin's "custom control (limited)" suggestion is unsupported |
| twin: Break-glass accounts | Ch03 Exclusions; Book 02 Ch09 link | — |
| twin: Monitoring | Ch07 Monitoring | — |
| main: cover block, classification/boundary banner, version table | Not carried | Classification stamps and document metadata are excluded by the style rules |
| main: Table of contents | Not carried | Navigation only |
| main §1.1 Purpose | Ch03 opening; Ch07 opening | "40+ policies" restated as the actual library |
| main §1.2 GPO-to-CA transformation | Ch01; Ch07 Retiring Group Policy | — |
| main §1.3 Relationship to modules | Ch07 Monitoring (drift) and Prerequisites | Module names generalized |
| main §1.4 Extension attribute schema + Important note | Ch03 Personas (device labels), Exclusions (bypass note) | Schema corrected (claim 64) |
| main §2.1 Evaluation order and conflict resolution + Design Principle box | Ch03 How policies combine; Naming (numbers are labels) | — |
| main §2.2 Named locations strategy | Ch03 Network; Ch07 Prerequisites | "Compliance Boundaries … Azure Government endpoints" not carried: GCC uses the commercial service |
| main §2.3 Authentication strength definitions | Ch03 Authentication strengths; Ch07 Prerequisites | Corrected (claim 35); custom FIDO2-only strength widened to include CBA (Appendix A) |
| main §2.4 Grant vs. session controls | Ch03 Grant controls, Session controls | Updated names and retired grant |
| main §2.5 Report-only methodology | Ch03 Report-only mode; Ch07 Rollout | — |
| main §2.6 Break-glass exclusion group + Warning | Ch03 Exclusions; Ch07 Conventions | Account UPNs `BreakGlass-Admin0x` not carried (Book 02 naming rule) |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: Internals persona `extensionAttribute6` {Employee, Contractor} -> `extensionAttribute11` {`EMP`, `CTR`}; Admins `extensionAttribute10` -> `extensionAttribute7`; layout link now the program attribute map; device label moved from device `extensionAttribute1` (Book 05's region) to device `extensionAttribute12` (device role) with values `PAW`, `Kiosk`, `SharedDevice`. |

## Revision 2026-10-21 — consistency round 2

Book-internal consistency fixes. Factual changes were checked against sources opened on Oct 21, 2026; design-consistency changes carry no new note.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| C1 | Naming convention: authentication-context policies named `{Purpose}-c{N}` with no library number (`PIM-Activation-c1`, `ProtectedActions-c2`) | Naming convention | design-consistency (Ch07 conventions, Ch08 Steps 2 and 6) | — |

## Editor update, October 22, 2026

| Claim | Result | Source |
|---|---|---|
| Agent targets are preview; agent identities support only Block | updated: Agent ID platform GA April 2026; agent targeting still labeled preview; agent identities Block only, agent risk (preview) only condition; agent users can be granted on a compliant device (Windows 365 Cloud PC for Agents); licensing Microsoft 365 E7 or Agent 365 with Entra ID P1 or Microsoft 365 E3 | Microsoft Learn: howto-target-agent-identities, policy-agent-user, concept-conditional-access-grant, Entra whats-new (April 2026) |

## Additions, October 29, 2026 (contractors and the PIV path)

Added at the author's request: paragraph "Contractors and the PIV path" at the end of "Authentication strengths". Research page: `docs/evaluations/oracle-contingent-worker-contractor-source.md` (its log: `docs/evaluations/_verification/oracle-contingent-worker-contractor-source.md`).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Contractors are in the Internals persona (`CTR`) | Contractors and the PIV path | verified (this chapter's persona table) | internal |
| 2 | TAP satisfies the Multifactor authentication strength, not Phishing-resistant MFA | Before the card | verified (this chapter's built-in strength table) | c03-auth-strengths |
| 3 | A TAP lets users "onboard other passwordless authentication methods" | Before the card | verified (raw page text); footnote c03-tap added | Microsoft Learn, Temporary Access Pass |
| 4 | Only internal guest accounts can be issued a TAP | Before the card | verified (raw page text) | c03-tap |
| 5 | PIV revocation reaches Entra only when the CRL refreshes; the leaver's disable stops sign-in | After the card | restated from Book 03 Ch09 (linked) | — |
| 6 | Register FIDO2 with the TAP; decide member or guest on purpose | Before the card | design (labelled) | — |

## Additions, October 30, 2026 (contractor PIV path marked pending proof)

Added at the author's request during the independent verification pass (`docs/about/_verification/verification-pass-2026-10.md`). No content removed.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Pending proof": the contractor PIV path is the program's design and hasn't yet been validated in practice; links to the Proved criteria | Authentication strengths, after "Contractors and the PIV path" | restated-as-design (status statement; nothing external claimed) | `docs/evaluations/oracle-contingent-worker-contractor-source.md#status-and-review` |

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language): the page now says what the mechanism supports or provides evidence for, not that it satisfies a control or requirement. No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| uses that rule to meet the CISA requirement to block high-risk users. | uses that rule in the policy that carries out the CISA requirement to block high-risk users. | no source change |

## Decision of Nov 8, 2026

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| N8-4 | Entra Connect Sync account handling stays "not yet specified" and is now listed in an "Open items in this chapter" callout | Exclusions section | decision of Nov 8; labelling only | Mike's decision of Nov 8, 2026, item 4 |

## Learn coverage pass, November 9, 2026

Citations added from the Learn coverage map (covered-uncited pages). No content removed or changed in meaning.

| Learn page | Where cited | Date read | Supports |
|---|---|---|---|
| [Build resilience by using Continuous Access Evaluation](https://learn.microsoft.com/entra/architecture/resilience-with-continuous-access-evaluation) | Where Conditional Access sits (CAE sentence), c03-cae-resilience | Nov 9, 2026 | CAE critical events: account disabled or deleted, password change, MFA enabled, token revocation, elevated user risk |
| [Enforcement for baseline scopes](https://learn.microsoft.com/entra/identity/conditional-access/concept-enforcement-resource-exclusions) | Target resources, All resources bullet, c03-baseline-scopes | Nov 9, 2026 | Excluded apps requesting baseline scopes now receive Conditional Access challenges |
| [Office 365 App in Conditional Access reference](https://learn.microsoft.com/entra/identity/conditional-access/reference-office-365-application-contents) | Target resources, Suites bullet, c03-o365 | Nov 9, 2026 | Office 365 grouping targets the suite together to avoid service-dependency issues |
| [Conditional Access service dependencies](https://learn.microsoft.com/entra/identity/conditional-access/service-dependencies) | Same, c03-o365 | Nov 9, 2026 | Early- and late-bound enforcement; use the Office 365 app for common policy |
| [Enable Source IP Restoration with Global Secure Access](https://learn.microsoft.com/entra/global-secure-access/how-to-source-ip-restoration) | Network, c03-source-ip | Nov 9, 2026 | Source IP restoration as the alternative to tracking cloud-proxy IPs |
| [Tutorial: Enable source IP restoration](https://learn.microsoft.com/entra/global-secure-access/tutorial-microsoft-traffic-source-ip-restoration) | Same, c03-source-ip | Nov 9, 2026 | Keeps IP-based location policies and risk detections accurate behind a proxy |
| [Risk detection types and levels](https://learn.microsoft.com/entra/id-protection/concept-risk-detection-types) | Conditions table, sign-in and user risk row, c03-risk-detections | Nov 9, 2026 | Real-time and calculated (offline) risk detections |
| [Authentication transfer as a condition](https://learn.microsoft.com/entra/identity/conditional-access/concept-authentication-transfer) | Conditions table, authentication flows row, c03-auth-transfer | Nov 9, 2026 | Authentication transfer is an authentication-flows condition |
| [The Conditional Access What If tool](https://learn.microsoft.com/entra/identity/conditional-access/what-if-tool) | Grant controls (Block access) and Report-only mode, c03-what-if | Nov 9, 2026 | What If simulates which policies apply to a sign-in |
| [Set Up Microsoft Entra Terms of Use with Conditional Access](https://learn.microsoft.com/entra/identity/conditional-access/terms-of-use) | Grant controls list, c03-terms | Nov 9, 2026 | Terms of use as a grant control |
| [How Authentication Strengths Work in a Conditional Access Policy](https://learn.microsoft.com/entra/identity/authentication/concept-authentication-strength-how-it-works) | Authentication strengths intro, c03-auth-strength-how | Nov 9, 2026 | How built-in strengths are evaluated in policy |
| [How Conditional Access Authentication Strengths Work for External Users](https://learn.microsoft.com/entra/identity/authentication/concept-authentication-strength-external-users) | Authentication strengths, email OTP guests bullet, c03-auth-strength-external | Nov 9, 2026 | Strengths apply to external users who authenticate with Entra ID; others use require MFA |
| [Get started with a phishing-resistant passwordless authentication deployment](https://learn.microsoft.com/entra/identity/authentication/how-to-plan-prerequisites-phishing-resistant-passwordless-authentication) | Authentication strengths, end-state sentence, c03-passwordless-plan | Nov 9, 2026 | Phishing-resistant passwordless deployment as the end state |
| [Configure adaptive session lifetime policies](https://learn.microsoft.com/entra/identity/conditional-access/howto-conditional-access-session-lifetime) | Session controls, sign-in frequency row, c03-sif-howto | Nov 9, 2026 | Sign-in frequency configuration including "every time" |
| [Resilience defaults for Microsoft Entra Conditional Access](https://learn.microsoft.com/entra/identity/conditional-access/resilience-defaults) | Session controls, disable resilience defaults row, c03-resilience-defaults | Nov 9, 2026 | Sessions extended during an outage; disabling denies access when sessions expire |
| [Token Protection Deployment Guide - Windows](https://learn.microsoft.com/entra/identity/conditional-access/deployment-guide-token-protection-windows) | Session controls, token protection row, c03-token-protection | Nov 9, 2026 | Token binding to the device |
| [Conditional Access insights and reporting workbook](https://learn.microsoft.com/entra/identity/conditional-access/howto-conditional-access-insights-reporting) | Report-only mode, tools paragraph, c03-insights | Nov 9, 2026 | Workbook needs P1 and a Log Analytics workspace with sign-in logs |
| [Create a resilient access control management strategy](https://learn.microsoft.com/entra/identity/authentication/concept-resilient-controls) | Naming convention, contingency policies, c03-resilient-controls | Nov 9, 2026 | ENABLE IN EMERGENCY contingency policy naming |

Note for the reviewer: the All resources bullet says the baseline-scope change is phased "from March 2026," which matches "Targeting resources in Conditional Access policies." The newly cited enforcement page says the rollout of the enforcement model began on June 15, 2026. Wording left unchanged; flagged for a later decision.

## Additions, November 9, 2026 (Learn gaps)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| G1 | Custom controls are deprecated; adding and editing blocked from September 2026; full retirement early 2027 | Grant controls, "External MFA replaces custom controls" | verified (new) | c03-custom-controls <https://learn.microsoft.com/entra/identity/conditional-access/controls> |
| G2 | External MFA (formerly external authentication methods): provider registered in the authentication methods policy through OIDC; users choose it at MFA prompts; Entra ID still makes the access decision | Same | verified (new) | c03-external-mfa <https://learn.microsoft.com/entra/identity/authentication/how-to-authentication-external-method-manage> |
| G3 | External MFA satisfies the require-MFA grant, shows as MFA in sign-in logs, works with PIM and risk-based Conditional Access; custom controls don't | Same | verified (new) | c03-custom-migrate <https://learn.microsoft.com/entra/identity/conditional-access/how-to-migrate-custom-controls-external-mfa> |
| G4 | External MFA doesn't satisfy any authentication strength, including the built-in MFA strength; use require MFA | Same | verified (new) | c03-external-mfa-provider <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-external-method-provider> |
| G5 | A third-party PIV/CAC or MFA route can't reach the Phishing-resistant MFA strength, so it's transitional; PIV reaches it through Entra CBA | Same, second paragraph | restated-as-design (from G4 and the strengths table) | c03-external-mfa-provider; c03-auth-strengths |
| G6 | Migration steps: register provider for a test group, report-only require-MFA policy, exclude test group from the custom-control policy, check logs, phase out, keep old policy Off at least two weeks | Same | verified (new) | c03-custom-migrate |
| G7 | Read-only Graph PowerShell to list policies that use custom controls (`grantControls.customAuthenticationFactors`) | Same, code block | command (read-only) | conditionalAccessGrantControls resource type, c03-graph-grant |
| G8 | Each cloud, including Azure for US Government, needs its own provider application; the US Government feature-availability list doesn't name external MFA, so GCC High and DoD availability is not yet specified | Same, last paragraph | verified (new); availability not yet specified | c03-external-mfa-provider; c03-gov-availability <https://learn.microsoft.com/entra/identity/authentication/feature-availability> |
