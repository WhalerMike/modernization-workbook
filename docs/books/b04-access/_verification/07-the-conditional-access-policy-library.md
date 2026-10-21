# Verification — Chapter 07, The Conditional Access Policy Library

Sources: `docs/operational-guides/access-plane/conditional-access-library.md` §3–§12, Appendix D, Compliance Amendment; `docs/operational-guides/conditional-access-policy-library.md` (policy architecture, deployment, monitoring). Reconciled against Book 02 Chapter 09 (`09-building-the-entra-target.md`, "The Conditional Access framework") and Chapter 10. All sources accessed Oct 20, 2026. Sections §1–§2 are ledgered in `03-the-conditional-access-model.md`; Appendices A–C in `appendix-a-conditional-access-templates.md`.

## Reconciliation with Book 02 Chapter 09

| Book 02 policy | Book 04 treatment | Reason |
|---|---|---|
| Numbering CA001–CA017, CA002 retired | Kept; Book 04 adds CA018–CA038 and CA090 | Brief: stay consistent with Book 02 IDs. Source library's `CA-0xx` scheme collided (CA-001 = MFA vs. Book 02 CA001 = legacy block) and is retired; mapping table in chapter |
| CA003 targets Admins with built-in phishing-resistant strength | Adds highly privileged directory roles; uses custom strength `FMP-Privileged-SeparateDevice` (subset of the built-in phishing-resistant methods) | SCuBA MS.AAD.3.6 implementation targets roles; Book 02 Ch10 excludes WHfB from IA-2(6) for privileged accounts |
| CA004 "device filter limits it to the PAW group" (Book 02 Ch10) | Device filter moved to a separate block policy CA025 | A filter-scoped grant policy would simply not apply on non-PAW devices; Microsoft's SAW pattern is a block with an exclude filter |
| CA008 Internals only | Kept, plus travel exclusion group | Source CA-030 targeted all users; Book 02 scope retained |
| CA011 "Selected apps only" | Kept; CA038 block added | A grant policy doesn't restrict other apps (plan-conditional-access "combining policies") |
| CA012 guest high sign-in risk block | Kept until CA019 is enforced, then retired | CA019 (all users) supersedes it |
| CA013 require risk remediation | Two forms: Block for BOD 25-01 tenants (MS.AAD.2.1), remediation (Members only) elsewhere | BOD 25-01 mandatory list says "blocked"; block overrides remediation (managed-policies) |
| CA014 medium-or-high sign-in risk → MFA | Kept; CA019 blocks high | MS.AAD.2.3 requires block for high sign-in risk |
| CA016 "All users" | Scope narrowed to Members; name kept | Guest devices aren't managed in this tenant |
| CA017 approved client app OR app protection | App protection only | Approved-app grant read-only since June 30, 2026 |
| No all-users MFA baseline | CA018 added | Persona-scoped policies miss users with empty attributes; Microsoft baseline recommendation |
| Rollout: report-only 2–4 weeks, pilot 2 weeks, waves 4–8 weeks | Kept as the gates; source's six phases regrouped into five waves | — |

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Licensing: P1 for all; P2 risk/insider; WID for workload identities | Conventions | verified | overview; workload-identity; recommendation-insider-risk-condition |
| 2 | Approved client app grant read-only since June 30, 2026 | Conventions; CA017 | corrected (source CA-020, CA-040 used it) | migrate-approved-client-app |
| 3 | AAGUID restriction via combination configuration | Prerequisites | verified | New-MgPolicyAuthenticationStrengthPolicy |
| 4 | Readiness gates 95% MFA / 90% devices | Prerequisites | restated-as-design (carried from source §9 table) | — |
| 5 | Legacy clients can't satisfy MFA or present device state | CA001 | verified | concept-conditional-access-conditions |
| 6 | Microsoft legacy-auth template: exclude at least one account | CA001 | verified | policy-block-legacy-authentication |
| 7 | MS.AAD.1.1 mandatory under BOD 25-01 | CA001 | verified | BOD 25-01 required configurations |
| 8 | Source GPO equivalent for CA-002 (LAN Manager auth level) | Mapping table | corrected (NTLM setting doesn't govern cloud protocols) | — (design correction) |
| 9 | MS.AAD.3.8 managed devices to register MFA is a SHOULD | CA020 | verified | ScubaGear aad.md |
| 10 | Register-security-info behavior for MSA and other-provider guests | CA020 | verified | concept-conditional-access-cloud-apps |
| 11 | Device code flow: block where possible; protocol tracking | CA021 | verified | concept-authentication-flows |
| 12 | Device Registration Service app ID 01cb2876-… | CA021 / App A | verified | concept-authentication-flows |
| 13 | Report-only policies don't need emergency exclusion | CA090 | verified via Book 02 Ch09 | security-emergency-access (Book 02 footnote) |
| 14 | MS.AAD.3.6 PR MFA for highly privileged roles; implementation targets roles | CA003 | verified | BOD required configurations; ScubaGear aad.md |
| 15 | Role targeting built-in only | CA003 | verified | concept-conditional-access-users-groups |
| 16 | Microsoft-managed admin portal MFA policy superseded | CA003 | verified (policy exists) / restated-as-design (supersede) | managed-policies |
| 17 | PAW pattern: exclude filter + block; positive operators never match unregistered; ext attrs need managed/compliant/hybrid | CA025 | verified | concept-condition-filters-for-devices |
| 18 | Source CA-010/011/012: users targeted via "DG-Devices-Tier*" device-attribute groups | CA025/026 | corrected (CA user assignments target users; device groups don't scope users; device filter is the mechanism) | concept-condition-filters-for-devices; users-groups |
| 19 | Source: extensionAttribute4 vs 11/12/13 used interchangeably | CA025, CA028, CA030 | corrected (inconsistent in source; replaced by device ext1 labels and app filters) | — |
| 20 | Azure Arc-enabled servers as a "cloud app" | CA026 | removed | concept-conditional-access-cloud-apps (no such target) |
| 21 | Windows Azure Service Management API covers portal, Entra admin center, CLI, PowerShell, M365 admin center | CA027 | verified | concept-conditional-access-cloud-apps |
| 22 | Email OTP guests can't satisfy auth strength → CA018 uses "require MFA" | CA018 | verified | concept-authentication-strengths |
| 23 | Microsoft-managed "MFA for all users" superseded | CA018 | verified (exists) | managed-policies |
| 24 | Teams/SharePoint depend on other M365 services; use Office 365 suite | CA038 | verified | concept-conditional-access-cloud-apps |
| 25 | Apps that don't support app protection are blocked | CA017 | verified | concept-conditional-access-grant; migrate-approved-client-app |
| 26 | MS.AAD.2.1 "Users detected as high risk SHALL be blocked" | CA013 | verified | BOD required configurations |
| 27 | Remediation adds strength + every-time SIF; block overrides remediation | CA013 | verified | concept-conditional-access-grant; managed-policies |
| 28 | Microsoft-managed "Block access for high-risk users" and "Require remediation" exist | CA013 | verified | managed-policies |
| 29 | MS.AAD.2.3 high-risk sign-ins blocked | CA019 | verified | BOD required configurations |
| 30 | Source CA-062: MFA AND password change on medium sign-in risk | Mapping table | corrected (password change requires user-risk condition and can't combine with other conditions) | Graph conditionalAccessGrantControls; grant |
| 31 | Source CA-063: user risk → password change; SSPR required | CA013 | corrected (Microsoft-recommended remediation; password change flow doesn't use SSPR) | concept-conditional-access-grant |
| 32 | Insider risk condition: Purview Adaptive Protection, P2 | CA036 | verified | recommendation-insider-risk-condition |
| 33 | Quick setup creates report-only block for elevated on Office 365, excluding some external types; CA integration labeled preview | CA036 | verified | insider-risk-management-adaptive-protection |
| 34 | Source: "E5 or E5 Compliance license required" | CA036 | removed (licensing per Microsoft's subscription guide not verified; stated as P2 + Purview Insider Risk Management) | — |
| 35 | Workload policies: WID, direct assignment, block only | CA015, CA037 | verified | workload-identity |
| 36 | Leaked credential detection needs PHS | Wave 4 rollout | verified via Book 02 Ch09/10 | Book 02 footnotes |
| 37 | Source CA-061: "calibrate risk detection 14 days" | Wave 4 rollout | restated-as-design (two weeks report-only) | — |
| 38 | MS.AAD.3.1 / 3.2 | CA022 | verified | BOD required configurations |
| 39 | Create PR policy in report-only early; enforce per platform-ready groups | CA022 | verified | how-to-deploy-phishing-resistant-passwordless-authentication |
| 40 | App-enforced restrictions only EXO/SPO; persistent browser needs all resources | CA023/024 | verified | concept-conditional-access-session; Graph session controls |
| 41 | Source CA-013 kiosk "app enforced restrictions" | CA028 | corrected (only affects EXO/SPO) | concept-conditional-access-session |
| 42 | Source CA-031 site-based trust (12 h on trusted sites) | Not carried | restated-as-design reason (location never relaxes controls) | — |
| 43 | Filter for applications: string CSA only; token-time; attribute roles | CA030–032 | verified | concept-filter-for-applications |
| 44 | Assignment required; Global Administrators bypass | CA034/035 | verified | application-properties |
| 45 | Source CA-044 included Power BI | CA033 | restated-as-design (removed from scope, reason given) | — |
| 46 | Microsoft: at least one week report-only | Rollout | verified | plan-conditional-access |
| 47 | Report-only compliance cert prompts → exclude macOS/iOS/Android | Rollout | verified | concept-conditional-access-report-only |
| 48 | 30-day soft delete | Rollback | corrected (source said deletion makes restoring impossible) | plan-conditional-access |
| 49 | Microsoft support can update blocking policies when locked out | Rollback | verified | troubleshoot-conditional-access |
| 50 | SigninLogs columns; ResultType is a string; ConditionalAccessStatus values | Monitoring | corrected (source compared ResultType to a number and used `count` without parentheses) | Azure Monitor SigninLogs reference |
| 51 | Per-policy result values incl. reportOnlyInterrupted | Monitoring | corrected (source omitted user-action-required results) | Graph appliedConditionalAccessPolicy |
| 52 | 53003 = BlockedByConditionalAccess | Monitoring | verified | troubleshoot-conditional-access |
| 53 | ClientAppUsed legacy names | Monitoring | unverifiable in full (documented examples verified; other names from source flagged in text) | SigninLogs reference |
| 54 | Source break-glass alert on UPN containing "BreakGlass" | Monitoring | corrected (object IDs; Book 02 naming rule) | Book 02 Ch09 |
| 55 | Source break-glass: password in sealed envelope; YubiKey model; "cancel after sign-in page loads" monthly test | Monitoring (link) | corrected/not carried (current guidance: phishing-resistant auth for both accounts, 90-day full validation; vendor model not named) | Book 02 Ch09 [^c09-emergency-access]; Ch02 |
| 56 | Workbook metrics; insights workbook needs P1 + Log Analytics; policy impact Security Reader | Monitoring | verified | concept-conditional-access-report-only |
| 57 | Protected actions cover CA policies and named locations | Drift | verified | plan-conditional-access; Book 02 Ch09 |
| 58 | BOD 25-01 issued Dec 17, 2024; mandatory policies by June 20, 2025 | Federal requirements | verified | cisa.gov BOD 25-01 |
| 59 | BOD MS.AAD mapping table | Federal requirements | verified | BOD required configurations |
| 60 | MS.AAD.3.7 / 3.8 are SHOULD | Federal requirements | verified | ScubaGear aad.md |
| 61 | Source D.1 AC-11 mapped to sign-in frequency | NIST table | corrected (AC-11 is device lock; mapped to AC-12 and IA-11) | FedRAMP Access Control; Identification and Authentication |
| 62 | Source D.1 AC-7 mapped to risk policies | NIST table / GPO list | corrected (AC-7 is a lockout threshold; met by smart lockout) | FedRAMP Access Control; howto-password-smart-lockout |
| 63 | Smart lockout always on; default 3 attempts US Gov, 10 elsewhere; customizing needs P1 | Retiring Group Policy | verified (added) | howto-password-smart-lockout |
| 64 | IA-2(1)/(2) FedRAMP guidance: phishing-resistant | NIST table | verified | FedRAMP Identification and Authentication |
| 65 | KSI-IAM indicator names and statements | FedRAMP 20x | verified | fedramp.gov KSI IAM |
| 66 | Source D.2: KSI-IAM-SNU ← CA-005 + App C; KSI-IAM-JIT ← CA-010 + "PIM (Section 11)" | FedRAMP 20x | corrected (SNU is non-user authentication → CA015/CA037; JIT is PIM's) | fedramp.gov KSI IAM |
| 67 | Source D.2: KSI-MLA-RVL, KSI-CMT-LMC | FedRAMP 20x | removed (not verified in this pass; evidence mapping deferred to Ch10) | — |
| 68 | GCC uses graph.microsoft.com / portal.azure.com; GCC High graph.microsoft.us | Government cloud notes | verified | graph/deployments |
| 69 | Azure Government: target Azure Government Cloud Management API | Government cloud notes | verified | concept-conditional-access-cloud-apps |
| 70 | Source D.3: named locations must reflect Azure Government IP ranges | Not carried | removed (GCC runs on the commercial service) | graph/deployments |
| 71 | Source D.3: FIDO2 keys must be FIPS 140-2 Level 2 in GCC-Moderate | Government cloud notes | restated-as-design (program procurement standard; not a stated Microsoft or FedRAMP rule) | — |
| 72 | Source D.2a "GCC-Moderate tenant enforces US data residency; CA-030 blocks…" | Not carried | removed (residency is a service property, location blocking a program choice; covered by Book 02 Ch09) | — |
| 73 | Source §8 intro: "Microsoft Entra ID Protection P2 license" | Wave 4 | corrected (Entra ID P2) | overview |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| main §3 intro (baseline policies) | Ch07 Waves 1–3 | — |
| main §3 CA-001 MFA all users | CA018; CA006, CA009 (Book 02); CA022 | Registration-campaign dependency → readiness gate |
| main §3 CA-002 legacy auth | CA001 | GPO equivalent corrected |
| main §3 CA-003 compliant device for apps | CA007, CA016 | — |
| main §3 CA-004 admin portals | CA003, CA004, CA025 | Role list → CA003 roles (App A); 4 h SIF kept |
| main §3 CA-005 guest terms of use | CA010, CA011 | — |
| main §4 intro (device tiers) | Ch07 Wave 2; Ch04 for tiers | Tier model itself owned by Ch04 |
| main §4 CA-010 Tier 0 PAW | CA025 (+ CA004, CA003) | 1 h SIF not carried: CA003 sets 4 h per Book 02; PAW sessions governed by PIM activation (Ch08) |
| main §4 CA-011 Tier 1 servers | CA026 | Arc as cloud app removed |
| main §4 CA-012 Tier 2 workstations | CA007 | — |
| main §4 CA-013 kiosk | CA028 | — |
| main §4 CA-014 unmanaged browser only | CA023, CA024 | — |
| main §4 CA-015 non-corporate network | CA029 | — |
| main §5 intro (environments) | Ch07 Wave 5 CA030–CA032 | Mechanism changed to app filters |
| main §5 CA-020 production | CA030, CA031 | Approved client app removed |
| main §5 CA-021 staging | CA032 | — |
| main §5 CA-022 development | Covered by CA006/CA007/CA018 | No separate policy needed |
| main §5 CA-023a/b cross-environment block | CA030 (023b) | 023a not carried, reason in chapter |
| main §6 intro (region/site) | Ch07 Wave 3 | Region/site attributes not used |
| main §6 CA-030 geographic + travel exception | CA008 | 14-day PIM-for-Groups exception kept |
| main §6 CA-031 site trust | Not carried | Lengthens sessions on location |
| main §6 CA-032 remote work | CA029 (+ CA007) | — |
| main §7 intro (application policies) | Ch07 Waves 3 and 5 | — |
| main §7 CA-040 Exchange | CA016, CA017 | Malformed AND/OR, retired grant |
| main §7 CA-041 SharePoint downloads | CA024 | — |
| main §7 CA-042 Teams | CA016, CA017 | — |
| main §7 CA-043 Azure portal + companion | CA027, CA025, CA026 | — |
| main §7 CA-044 Power Platform | CA033 | Power BI removed |
| main §7 CA-045 GitHub + companion block | CA034/CA035 template | — |
| main §7 CA-046 LOB template + examples | CA034/CA035 with suffix examples | — |
| main §8 intro (governance/risk) | Ch07 Wave 4 | — |
| main §8 CA-060 audit mode | CA090 | Grant changed from MFA to phishing-resistant to measure end state |
| main §8 CA-061 | CA019 | — |
| main §8 CA-062 | CA014 | Corrected (claim 30) |
| main §8 CA-063 | CA013 | Corrected (claim 31) |
| main §8 CA-064 | CA036 | — |
| main §9 deployment methodology (six phases table) | Ch07 waves (five) and readiness gates | Phases regrouped; durations aligned to Book 02 |
| main §9.1 phase validation cycle | Ch07 Rollout (7-step cycle) | — |
| main §9.2 rollback + Warning | Ch07 Rollback | Warning corrected (soft delete) |
| main §10 GPO-to-CA migration matrix + Note | Ch07 Retiring Group Policy | Corrected rows (lockout, LM level, logon rights) |
| main §11 break-glass intro | Book 02 Ch09 (link); Ch02 | Owned by Book 02 / Ch02 |
| main §11.1 account configuration | Not carried | Superseded by Book 02 Ch09 standard (claim 55) |
| main §11.2 physical security | Not carried here | Procedure in Vol III Book 01 (linked) |
| main §11.3 monthly validation | Not carried | Superseded: 90-day full validation (Book 02 Ch09) |
| main §11.4 monitoring alerts + Important | Ch07 Monitoring (emergency query) | UPN match corrected |
| main §12.1 KQL queries 1–4 | Ch07 Monitoring | Rewritten (claims 50–53) |
| main §12.2 coverage gap query | Ch07 Monitoring | ResultType string fix |
| main §12.3 workbook templates | Ch07 Workbooks and views | — |
| main §12.4 drift detection | Ch07 Drift; Ch10 | — |
| main App D.1 NIST mapping | Ch07 NIST table | AC-11, AC-7, AC-2 rows corrected or dropped (AC-2 lifecycle is Book 03's) |
| main App D.2 FedRAMP 20x/CR26 | Ch07 FedRAMP 20x paragraph | Corrected (claims 66–67) |
| main App D.2a deployment/residency | Ch07 Government cloud notes | Rows not carried (claim 72) |
| main App D.3 GCC-Moderate notes | Ch07 Government cloud notes | Corrected/removed (claims 68–71) |
| main closing footer (version/classification) | Not carried | Classification stamps excluded |
| main Compliance Amendment: AC-3 device compliance | Ch07 NIST table (AC-3, AC-19) | — |
| main Compliance Amendment: CM-3 change tracking | Ch07 Drift; Rollout step 5; Ch10 | — |
| twin: Policy architecture tiers | Ch07 waves | See Ch03 ledger |
| twin: Monitoring list (hit rates, report-only impact, failures, break-glass, exclusion residual risk) | Ch07 Monitoring | — |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: persona groups from `extensionAttribute11`/`7`; device labels on device `extensionAttribute12`; CA025 filter `device.extensionAttribute12 -eq "PAW"`; CA028 filter `device.extensionAttribute12 -in ["Kiosk","SharedDevice"]` (the population the old `Shared` label covered); user-attribute link now the program attribute map. |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | "Microsoft's minimum is a week in report-only" restated as a recommendation (a deployment tip, not a requirement) | Rollout gates | corrected | c07-plan-tip <https://learn.microsoft.com/entra/identity/conditional-access/plan-conditional-access#deploy-conditional-access-policies> |
| R2 | c07-plan footnote title updated to the page's current title, "Plan a Conditional Access deployment" | Footnotes | corrected | c07-plan |
| R3 | Source-correction narration trimmed; the CA-0nn mapping table kept as a mapping for tenants that deployed the earlier numbering | Policy notes CA018–CA036; mapping section (renamed "Mapping the earlier CA-0nn numbering"); rollout; emergency alert; control mapping | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- CA026: the source targeted users through a device-attribute group and listed Arc-enabled servers as a cloud app.
- CA027, CA023/CA024, CA028, CA029, CA030–CA035, CA036 and CA090 were described as carrying or replacing named source-library policies (kiosk app-enforced restrictions, site-based trust, "block production users from development", GitHub Enterprise, insider-risk session policy).
- CA018 was described as the source library's CA-001, restored.
- The rollout cycle was consolidated from two versions in the source library; the legacy-auth client list added names the source library used.
- The source's emergency-access alert matched user names containing "BreakGlass".
- The source mapped sign-in frequency to AC-11 and risk policies to AC-7.
- Mapping table: the source's Group Policy equivalent for CA-002 (LAN Manager level) was wrong; CA-040 combined AND and OR and used the retired approved-app grant.

## Revision 2026-10-21 — consistency round 2

Book-internal consistency fixes. Factual changes were checked against sources opened on Oct 21, 2026; design-consistency changes carry no new note.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| C1 | New conventions bullet: authentication-context policies (`PIM-Activation-c1`, `ProtectedActions-c2`) aren't numbered, are named for their context, defined in Ch08, held as code with the library, and turned On before their context is selected instead of following the report-only waves | Conventions used in every policy | design-consistency (Ch08 Steps 2 and 6; Ch03 naming) | — |
