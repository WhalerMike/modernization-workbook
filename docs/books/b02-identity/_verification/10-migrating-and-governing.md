# Verification — Chapter 10, Migrating and Governing

Source: `docs/operational-guides/identity/identity-modernization.md` (§9–§15 and the Compliance Amendment). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Access review schedule | Access reviews | restated-as-design | program design |
| 2 | PIM for Groups reviews and inactive-user reviews need Governance | Access reviews | verified (added) | id-governance/licensing-fundamentals |
| 3 | Access package categories | Entitlement management | restated-as-design | program design |
| 4 | Expiration and separation of duties with P2; auto-assignment, custom extensions, Verified ID need Governance | Entitlement management | verified (added) | Entra licensing |
| 5 | `memberOf` preview ends Nov 3, 2026, affects auto-assignment policies | Entitlement management | verified (added) | groups-dynamic-rule-member-of |
| 6 | Access packages can include Cloud Sync–provisioned groups for AD apps | Entitlement management | verified (added) | group-writeback-cloud-sync |
| 7 | LCW requires Governance; acts on existing accounts | Lifecycle Workflows | verified | licensing-fundamentals; lifecycle-workflow-templates |
| 8 | Trigger types: time-based, attribute change, group membership, sign-in inactivity, on-demand | Lifecycle Workflows | verified (source: "custom attributes preview" only) | lifecycle-workflow-execution-conditions |
| 9 | Offset 0–180 days; V2 preview 0–365 | Lifecycle Workflows | verified (added) | lifecycle-workflow-execution-conditions |
| 10 | Custom attribute triggers preview | Lifecycle Workflows | verified | lifecycle-workflow-execution-conditions |
| 11 | Synced users: date attributes must be synced; triggers wait for sync | Lifecycle Workflows | verified (added) | lifecycle-workflow-on-premises |
| 12 | Scope rules support extensionAttribute1–15, department, jobTitle | Lifecycle Workflows | verified (added) | identitygovernance-rulebasedsubjectset |
| 13 | 50 workflows, 100 custom task extensions | Lifecycle Workflows | superseded 2026-10-29 (now 100 workflows; see G1) | licensing-fundamentals |
| 14 | Pre-hire tasks; "Generate TAP and send email" goes to manager | Pre-hire | corrected (TAP task emails manager; access package via "Request user access package assignment") | lifecycle-workflow-tasks; lifecycle-workflows-deployment |
| 15 | Joiner tasks incl. "trigger MFA registration campaign" | Joiner | corrected (registration campaign isn't a workflow task; license task is preview) | lifecycle-workflow-tasks; task arguments |
| 16 | Enable task can enable synced on-prem account | Joiner | verified (added) | identitygovernance-lifecycleworkflows-task-arguments |
| 17 | Mover trigger on extensionAttribute2/3/4 | Mover | corrected (department/extension attrs; confirm trigger support) | rulebasedsubjectset |
| 18 | Mover "trigger immediate access review", "update AU", "commit to Gitea" | Mover | corrected (marked custom / dynamic AU) | lifecycle-workflow-tasks |
| 19 | Leaver tasks; mailbox convert to shared | Leaver | corrected (mailbox step custom; built-in task names used) | lifecycle-workflow-templates; lifecycle-workflow-tasks |
| 20 | Delete user unsupported for users with role assignments / role-assignable groups | Leaver | verified (added) | lifecycle-workflow-tasks |
| 21 | Revoke-MgUserSignInSession / "Revoke all refresh tokens" task | Leaver | verified | lifecycle-workflow-tasks |
| 22 | Synced user deleted only in cloud returns on sync | Leaver | restated-as-design (inferred from sync behavior; Microsoft on-prem LCW guidance cited) | lifecycle-workflow-on-premises |
| 23 | Terms of use enforced via CA; P1 | Terms of use | verified (licensing added) | Entra licensing |
| 24 | ToU cadences | Terms of use | restated-as-design | program design |
| 25 | Guest lifecycle; EM removes guests at expiry | B2B | verified (EM removal) | identity-governance-overview |
| 26 | Guest Inviter role; allowlist "in GCC-Moderate environments" | B2B | corrected (allowlist is a program choice; B2B supports allow/block lists) | external-id/faq |
| 27 | Cross-cloud invitations must use UPN | B2B | verified (added) | external-id/faq |
| 28 | CTAS defaults: B2B collaboration allowed, direct connect blocked | CTAS | verified (source said default "all", correct) | cross-tenant-access-overview |
| 29 | Trust MFA/compliant/hybrid joined claims | CTAS | verified | cross-tenant-access-overview |
| 30 | Automatic redemption setting | CTAS | verified (added) | cross-tenant-access-overview |
| 31 | Cross-tenant sync licensing | CTAS | verified (added) | Entra licensing |
| 32 | B2B direct connect: Teams shared channels only; mutual; needs inbound MFA trust | Direct connect | verified | b2b-direct-connect-overview |
| 33 | Direct connect "relies on home tenant policies" | Direct connect | corrected (resource tenant CA applies; needs MFA trust) | b2b-direct-connect-overview |
| 34 | External IdPs: MSA, Google, SAML/WS-Fed, email OTP | External IdPs | verified | external-id/identity-providers |
| 35 | Email OTP on by default; no auth strengths for OTP guests | External IdPs | verified (added) | external-id/one-time-passcode |
| 36 | AD trust mapping | Trusts | restated-as-design | program design |
| 37 | Leaked credential detection "P2 feature" | PHS foundation | corrected (nonpremium detection; P2 reports/policies; needs PHS) | concept-identity-protection-risks; choose-ad-authn |
| 38 | PHS "automatic fallback" | PHS foundation | corrected (manual switch) | choose-ad-authn |
| 39 | Smart lockout benefit | PHS foundation | unverifiable (carried as general statement; not separately cited) | — |
| 40 | M-22-09: phishing-resistant MFA for staff/contractors/partners; option for public; discontinue SMS/voice/OTP/push for routine self-service; PIV simplest; FIDO2/WebAuthn allowed; M-19-17 PIV primary; end of FY2024 | Roadmap | verified (primary source) | OMB M-22-09 PDF |
| 41 | CBA supports PIV/CAC/derived PIV without federation | Roadmap | verified | memo-22-09-multi-factor-authentication |
| 42 | Roadmap ordering (CBA last, "high-security users") | Roadmap | corrected (CBA moved to phase 2 for PIV/CAC holders) | M-22-09 |
| 43 | Authenticator passkeys need Android 14 / iOS 17 | Roadmap | verified (added) | how-to-enable-authenticator-passkey |
| 44 | All four methods meet phishing-resistant strength | Roadmap | verified | concept-authentication-strengths |
| 45 | Passkey profiles; device-bound vs synced; attestation | Methods policy | verified (added) | how-to-authentication-passkeys-fido2 |
| 46 | MFA within 5 minutes before passkey registration | Methods policy | verified (added) | how-to-authentication-passkeys-fido2 |
| 47 | Number matching "required" (configurable) | Methods policy | corrected (always on; can't opt out) | how-to-mfa-number-match |
| 48 | TAP 1-hour lifetime, one-time use | Methods policy | verified/corrected (defaults: 1h default, multi-use allowed; range 10 min–30 days; 10-minute registration window for one-time) | howto-authentication-temporary-access-pass |
| 49 | SMS/voice disabled | Methods policy | verified as required for staff | M-22-09 |
| 50 | Registration campaign snooze limit 3 | Methods policy | restated-as-design | program design |
| 51 | Legacy protocols list; Exchange basic auth status | Legacy auth | corrected (Basic auth already removed for EAS, POP, IMAP, RPS, EWS, OAB, Autodiscover, Outlook; SMTP AUTH retirement timeline updated, no date asserted) | deprecation-of-basic-authentication-exchange-online |
| 52 | KQL legacy discovery | Legacy auth | corrected (restored; `count()` fixed; meaningless dcount removed) | — (illustrative) |
| 53 | Graph legacy discovery | Legacy auth | corrected (restored; `-Top` with `-All` removed; UTC date) | Get-MgAuditLogSignIn |
| 54 | IA-2(6) = "hardware-based authenticator for privileged accounts" | Compliance amendment | corrected (actual text: separate device + strength of mechanism; FedRAMP params; PIV = separate device) | FedRAMP IA controls (NIST SP 800-53 Rev. 5, 5.2.0) |
| 55 | IA-2(1)/(2) FedRAMP guidance: phishing-resistant | Compliance amendment | verified (added) | FedRAMP IA controls |
| 56 | Hardware security keys with certificates meet separate-device MFA | Compliance amendment | verified | concept-certificate-based-authentication-mobile-ios |
| 57 | WHfB not counted toward IA-2(6) for privileged accounts | Compliance amendment | restated-as-design | program design |
| 58 | AC-6(7) = PAW guidance | Compliance amendment | corrected (AC-6(7) is Review of User Privileges; mapped to PIM access reviews) | FedRAMP AC controls |
| 59 | PAW design (Intune, Autopilot, dynamic device group, CA device filters) | PAW | verified | security/zero-trust/adopt/implement-privileged-access-devices |
| 60 | KSI-IAM-APM wording | Compliance amendment | verified | fedramp.gov 20x IAM KSIs |
| 61 | Log retention table (30 days P1/P2; risk 90 days) | Logs | corrected (Free 7 days; risky sign-ins 7/30/90; risky users until remediated; Graph activity logs not retained) | reference-reports-data-retention |
| 62 | Provisioning log retention 30 days | Logs | removed (not confirmed; pointed to Microsoft's reference) | — |
| 63 | Upgrading licenses doesn't recover data | Logs | verified (added) | reference-reports-data-retention |
| 64 | Diagnostic settings need Security Administrator; Sentinel connector enabled | Log Analytics | verified (added) | howto-integrate-activity-logs-with-azure-monitor-logs |
| 65 | Detection KQL patterns | Detections | corrected (PIM operation name; CA "notApplied" uses ConditionalAccessStatus; stale accounts via signInActivity; SP credential filter client-side) | reference-audit-activities; Graph user resource |
| 66 | Alert on elevations outside normal pattern | Detections | verified (added) | security-operations-privileged-accounts |
| 67 | Workbook list ("built-in templates") | Workbooks | corrected (actual public templates listed; need Log Analytics) | overview-workbooks; CA insights |
| 68 | Compliance Manager templates (NIST 800-53, FedRAMP Moderate, CMMC L2) | Compliance Manager | corrected (Rev. 5, FedRAMP Moderate, CMMC available; CMMC included for GCC; others premium) | compliance-manager-regulations-list |
| 69 | AU-2 "Audit Events" | Compliance Manager | corrected (Rev. 5 title Event Logging) | NIST SP 800-53 Rev. 5 (FedRAMP catalog) |
| 70 | KSI IDs AAM, ELP, JIT, APM, MLA-LET, MLA-RVL; CR26 launched June 24, 2026 | 20x table | verified; KSI-IAM-SNU added | fedramp.gov 20x IAM and MLA KSI pages |
| 71 | Control-to-KSI mapping | 20x table | restated-as-design | program design |
| 72 | Playbook phases, durations, thresholds, 40–70 weeks | Playbook | restated-as-design | program design |
| 73 | Phase 1: "Install Entra Connect Sync" | Playbook | corrected (Cloud Sync default) | connect-to-cloud-sync-decision-guide |
| 74 | Phase 1 rollback: soft delete → hard delete | Playbook | corrected (don't hard-delete; 30-day recovery) | protected-actions-overview (soft-delete 30 days) |
| 75 | Phase 2: Seamless SSO for PHS/PTA | Playbook | corrected (only for non-joined domain devices) | choose-ad-authn |
| 76 | Phase 8: "disable basic auth at Exchange org level" | Playbook | corrected (already removed for most protocols; SMTP AUTH remains) | deprecation-of-basic-authentication-exchange-online |
| 77 | Phase 9: `Convert-MsolDomainToStandard` | Playbook | corrected (retired; `Update-MgDomain -AuthenticationType Managed`; up to 60 minutes; rollback `New-MgDomainFederationConfiguration`) | migrate-from-federation-to-cloud-authentication |
| 78 | Staged rollout doesn't convert domains | Playbook | verified (added) | how-to-connect-staged-rollout |
| 79 | Gitea drift pipeline | Drift detection | restated-as-design | program design |
| 80 | Scheduled task commands | Drift detection | corrected (planned functions marked as not yet in module; parameter usage fixed) | Appendix D module |
| 81 | Gitea API: `/api/v1/`, `Authorization: token`, label IDs int64 | Drift detection | verified | docs.gitea.com/development/api-usage; gitea.com/swagger.v1.json |
| 82 | InvalidSoftMatch cause and fix | Troubleshooting | corrected (cause: existing different immutableId or duplicates; fix: align mS-DS-ConsistencyGuid) | tshoot-connect-sync-errors; existing-tenant |
| 83 | InvalidHardMatch (2026 hardening) | Troubleshooting | verified (added) | tshoot-connect-sync-errors |
| 84 | Group writeback failure row | Troubleshooting | corrected (GWB v2 discontinued; replaced with Cloud Sync group provisioning row) | how-to-connect-group-writeback-disable |
| 85 | Password writeback permissions | Troubleshooting | corrected (adds Write lockoutTime, pwdLastSet, Unexpire Password; Set-ADSyncPasswordWritebackPermissions) | tutorial-enable-sspr-writeback; how-to-connect-configure-ad-ds-connector-account |
| 86 | `Get-ADSyncServerConfiguration -Path` | Troubleshooting | unverifiable (cmdlet carried from source; not opened on Learn) | — |
| 87 | Dynamic group check command | Troubleshooting | corrected (`-Property` alone returns nested object; expanded) | Graph user resource |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| 9.1 Access reviews | Ch10 "Access reviews" | |
| 9.2 Entitlement management / access packages | Ch10 "Entitlement management and access packages" | |
| 9.3 Lifecycle Workflows (intro) | Ch10 "Lifecycle Workflows" | Link to HR-Driven Identity Ch 6 kept |
| 9.3.1 Pre-hire workflow + Diagram 3 placeholder | Ch10 "Pre-hire workflow"; loop figure `ch10-joiner-mover-leaver-loop` | Per-workflow diagrams consolidated into one loop figure |
| 9.3.2 Joiner workflow + Diagram 4 placeholder | Ch10 "Joiner workflow" | Diagram consolidated |
| 9.3.3 Mover workflow + Diagram 5 placeholder | Ch10 "Mover workflow" | Diagram consolidated |
| 9.3.4 Leaver workflow + Diagram 6 placeholder | Ch10 "Leaver workflow" | Diagram consolidated |
| 9.4 Terms of use | Ch10 "Terms of use" | |
| 10.1 B2B collaboration + invitation policies | Ch10 "B2B collaboration" | |
| 10.2 Cross-tenant access settings | Ch10 "Cross-tenant access settings" | |
| 10.3 B2B direct connect vs collaboration | Ch10 "B2B direct connect and B2B collaboration compared" | |
| 10.4 External identity providers | Ch10 "External identity providers" | |
| 10.5 AD trust mapping | Ch10 "Mapping AD trusts to cross-tenant access" | AD Interaction Guide reference replaced by Chapter 08 link |
| 11.1 PHS as foundation | Ch10 "Password hash sync as the foundation" | |
| 11.2 Passwordless roadmap | Ch10 "The phishing-resistant authentication roadmap" | Reordered for M-22-09 |
| 11.3 Authentication methods policy | Ch10 "Authentication methods policy" | |
| 11.4 Legacy authentication blocking | Ch10 "Blocking legacy authentication" | |
| 11.5 Legacy auth discovery (KQL and PowerShell) | Ch10 "Blocking legacy authentication" code blocks | Restored and fixed |
| 12.1 Log architecture | Ch10 "The Entra ID logs" | |
| 12.2 Log Analytics integration | Ch10 "Log Analytics integration" | |
| 12.3 Key detection rules | Ch10 "Detection rules" | |
| 12.4 Workbooks | Ch10 "Workbooks" | |
| 12.5 Compliance Manager + FedRAMP 20x table | Ch10 "Compliance Manager and the FedRAMP 20x indicators" | |
| 13 (intro) | Ch10 "The migration execution playbook"; figure `ch10-migration-waves` | |
| 13.1–13.11 Phases 0–10 | Ch10 "Phase 0" … "Phase 10" | |
| 13 Diagram 7 placeholder (Gantt) | Ch10 figure `ch10-migration-waves` | Replaced by wave diagram; durations stay in tables |
| 14.1 Assessment output pipeline | Ch10 "The assessment pipeline" | Gitea generalized to Git host |
| 14.2 Scheduled PowerShell tasks | Ch10 "Scheduled tasks" | Status column added |
| 14.3 Gitea API integration (New-FMPGiteaDriftIssue) | Ch10 "Raising drift issues…" (description); code in Appendix D module | Code consolidated into the module |
| 15 Troubleshooting reference | Ch10 "Troubleshooting reference" | |
| Closing document footer (version, classification, Gitea commit rule) | — | Not carried: governance boilerplate |
| Compliance Amendment: FIDO2 / PIV / CAC mapping (IA-2(6)) | Ch10 "Multifactor authentication and separate devices (IA-2)" | Control text corrected |
| Compliance Amendment: PAW guidance (AC-6(7)) | Ch10 "Reviewing privileged access (AC-6(7))" and "Privileged access workstations" | Control mapping corrected |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: mover trigger carriers `extensionAttribute3`/`4` -> `extensionAttribute6` (division code)/`extensionAttribute12` (position category), linked to the program attribute map. FedRAMP date fixed: Consolidated Rules for 2026 launched June 25, 2026 (was June 24), per FedRAMP's announcement post dated June 25, 2026 (new footnote `c10-fedramp-launch`, verified Oct 21, 2026). |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Privileged-role review cadence aligned across Books 02 and 04: Tier 0 monthly, other privileged roles quarterly, never self-review alone. The cadence is the program's design; AC-2(j) and AC-6(7) leave the frequency organization-defined; PIM row now monthly Tier 0 / quarterly others; security team, never assignees alone (Members (self) leaves role-assignable groups out of Entra role reviews) | Access reviews table | corrected | c10-pim-review <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review#create-access-reviews> |
| R2 | AC-6(7) evidence paragraphs and Phase 5 step 4 now say monthly (Tier 0) and quarterly reviews; frequency is organization-defined | Access reviews; Reviewing privileged access (AC-6(7)); Phase 5 | corrected | c10-fedramp-ac <https://fedramp.gov/2026/reference/controls/access-control/> |

## Revision 2026-10-21 — consistency round 2

Internal-consistency fixes from the Book 02 deck review. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| K1 | Roadmap sequencing stated: phase 1 first, phases 2-4 in parallel, 12-18 weeks end to end (rows would sum to 28-42 in sequence). Playbook Phase 7 duration 8-16 -> 12-18 weeks to match | Phishing-resistant roadmap (line 209); Phase 7 (line 476) | design consistency; no new note | Program estimates |
| K2 | Playbook total "40 to 70 weeks" -> "43 to 68 weeks, counting Phase 10's initial setup"; the sum of the eleven phase estimates (2-4, 2-3, 3-4, 4-6, 6-8, 2-3, 4-6, 12-18, 2-4, 4-8, 2-4) | Playbook intro (line 394) | arithmetic consistency; no new note | Program estimates |
| K3 | Cross-reference labels fixed: "HR-Driven Identity, Chapter 6" -> "Book 03, Chapter 08" (target 08-joiner-mover-leaver.md); "HR-Driven Identity, Chapter 9" -> "Book 03, Chapter 11" (target 11-drift-metrics-and-evidence.md). Targets unchanged; labels now match the Book 03 chapter titles and the workbook's "Book NN, Chapter NN" convention | Lifecycle Workflows (line 62); drift (line 519) | wording only | Book 03 chapter front matter |
| K4 | Phase 1 prerequisite added: any Connect Sync server on 2.6.84.0+ with application-based authentication, required by April 7, 2027 | Phase 1 (line 412) | factual; new note | c10-connect-hardening <https://learn.microsoft.com/entra/identity/hybrid/connect/harden-update-ad-fs-pingfederate> |

## Revision 2026-10-29 — companion-guide reconciliation

The attribute-driven migration guide (`docs/books/guides/attribute-driven-migration.md`, finding D1 in its verification log) found the workflow limit out of date. Sources opened on Oct 29, 2026 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim | Source (accessed 2026-10-29) | Old text | New text |
|---|---|---|---|---|
| G1 | Lifecycle Workflows tenant limits | c10-lcw-limits <https://learn.microsoft.com/entra/id-governance/governance-service-limits#lifecycle-workflows> (100 workflows, 25 tasks per workflow, 100 custom task extensions, 10 users per on-demand run); also "What are lifecycle workflows?" and "Plan a Lifecycle Workflow deployment" (100 workflows). "Licensing fundamentals" still says 50, so Learn is internally inconsistent; the service-limits page is cited as the limits authority | "A tenant can have up to 50 workflows and 100 custom task extensions.[^c10-governance-licensing]" | "A tenant can have up to 100 workflows and 100 custom task extensions, a workflow up to 25 tasks, and an on-demand run covers at most 10 users.[^c10-lcw-limits]" |
| G2 | Other Lifecycle Workflows limits in the section: triggers (time-based, attribute change, group membership, sign-in inactivity, on-demand); offset 0–180 days; V2 preview 0–365 days; custom attribute triggers in preview | c10-lcw-execution <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-conditions> | unchanged | unchanged (re-verified) |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Lifecycle Workflows: the one-sentence limits list was replaced with a pointer to a new "Limits, guardrails and design at scale" subsection (full limits table, five behaviors, and the design response, linking the companion guide's #lifecycle-workflows-at-scale). The 100-workflow figure and note c10-lcw-limits were kept and the note extended. Phase 4 gained a non-person identity track signpost. "What still needs AD after Phase 10" was added, with only the items the playbook and Chapter 04 don't already carry. All sources fetched on Oct 29, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| W1 | 100 workflows; 25 tasks per workflow; 100 custom task extensions; offsetInDays -180 to +180 (API); schedule 1-24 hours; 10 users on demand; 5 administrative scopes per workflow | Limits table | verified | c10-lcw-limits <https://learn.microsoft.com/entra/id-governance/governance-service-limits#lifecycle-workflows> |
| W2 | Schedule default every 3 hours | Limits table | verified | c10-lcw-deployment <https://learn.microsoft.com/entra/id-governance/lifecycle-workflows-deployment>; c10-lcw-understanding ("default of three hours") |
| W3 | Custom task extension timeout: service limits page 30 minutes-3 hours (`durationBeforeTimeout`); deployment page 3 minutes-5 hours (callback timeout) | Limits table | conflict on Learn; both published, neither picked. The extensibility page <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-extensibility> gives no range | c10-lcw-limits; c10-lcw-deployment |
| W4 | New workflows are enabled but scheduling must be switched on; real-time leaver and mover can't be scheduled | Behaviors | verified | c10-lcw-understanding; c10-lcw-deployment |
| W5 | On-demand ignores execution conditions | Behaviors | verified | c10-lcw-understanding <https://learn.microsoft.com/entra/id-governance/understanding-lifecycle-workflows> |
| W6 | On-demand runs aren't subject to execution limits; tenant or per-workflow thresholds by percentage, number or both (OR logic); quarantine with admin notification; no automatic clearing; updating limits creates a new version | Behaviors | verified | c10-lcw-exec-limits <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-limits> |
| W7 | Three-day catch-up for the standard time-based trigger; not for "Time based attribute V2 (Preview)" | Behaviors | verified | c10-lcw-understanding (Scheduling note) |
| W8 | Changes to tasks and executionConditions create a new version; basic properties (displayName, description, isEnabled, isSchedulingEnabled, task name and description) don't | Behaviors | verified | c10-lcw-versioning <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-versioning> |
| W9 | Design response: general workflows; 12 x 3 x 3 = 108; parameterized extensions; split leavers; on-demand as a change; thresholds from normal volume; out-of-band urgent terminations; late-HR monitoring; version change control | Design at scale | restated-as-design | series limits content; companion guide |
| W10 | Phase 4 is the non-person identity track | Phase 4 | restated-as-design | series framing |
| W11 | What still needs AD: synced attributes; Kerberos apps and written-back groups; DNS, DHCP and legacy apps; SQL Windows logins (IA-2 gap, Book 06); domain GPOs for hybrid-joined devices; SOA entry checks; GCC SOA availability open | What still needs AD after Phase 10 | restated-as-design; links Ch04, Book 03 Ch05, Book 05 Ch07, Book 06, Book 08. Learn's "Configure user Source of Authority (SOA)" page (fetched Oct 29) states no cloud availability, so GCC availability stays an open question, not a Microsoft fact | <https://learn.microsoft.com/entra/identity/hybrid/how-to-user-source-of-authority-configure> |
| H1 | HISG: support passkeys (synced or device-bound) in public-facing apps; weigh synced passkeys case by case; advises against synced authenticators for AAL3, "which require resident keys" | Phishing-resistant roadmap | verified (added Oct 31, 2026) | c10-hisg, HISG §3.4 <https://www.cisa.gov/resources-tools/services/hybrid-identity-solutions-guidance-hisg> |
| H2 | Privileged users and AAL3 systems use device-bound passkeys or PIV, never synced passkeys | Same | restated-as-design | program position, consistent with HISG §3.4 and the passkey profiles above |
| H3 | HISG puts SSO and passwordless first, password managers as the bridge, SSO preferred over password managers | Passwords that remain | verified (added) | HISG §3.5 and its footnote 39 |
| H4 | Entra password-based SSO stores credentials encrypted in the directory and fills them through the My Apps Secure Sign-in Extension; works for on-premises apps through Application Proxy | Same | verified (added) | c10-pwd-sso; auth-password-based-sso; configure-password-single-sign-on-non-gallery-applications |
| H5 | Shared accounts: Entra ID holds the password and supplies it to group members | Same | verified (added) | c10-shared-accounts <https://learn.microsoft.com/entra/identity/users/users-sharing-accounts> |
| H6 | HISG password manager selection points: end-to-end encryption, zero-knowledge, MFA, role-based permissions, policy enforcement, SSO integration, US-located servers for non-on-premises products; vault as single point of failure mitigated by encryption at rest and cached vaults | Same | verified (added) | HISG §3.5 |
| H7 | Vault MFA is phishing-resistant; vaulted passwords are debt to federate at upgrade or re-procurement | Same | restated-as-design | program position |

## Revision 2026-11-08 — consistency read before the baseline edition

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| C1 | Access review table rows for application assignments use the risk-tier notation R1 (quarterly, two stages) and R2 (semi-annually) | §Access reviews | corrected (Old: "application risk Tier 1" and "Tier 2". New: R1 and R2) | Book 04 Chapter 04 §Three different tiers; Chapter 09 §Cadence |
| C2 | Lifecycle Workflows tenant ceiling: service limits page says 100, licensing page says 50; the program budgets to 50 | §Limits, guardrails and design at scale | corrected (Old: 100 only) | Book 03 Chapter 08 §Tenant ceilings; Book 04 Chapter 09 |

## Revision 2026-11-09 — Learn gap additions (password protection, mandatory MFA, AD FS applications)

New subsections "Banned passwords in the cloud and on the domain controllers," "Mandatory MFA for Azure and the admin portals" and "Applications that still sign in through AD FS"; the Phase 9 prerequisite and step 7 now point to Appendix D. Learn pages read Nov 9, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| G1 | Global banned list automatic, can't be disabled, not published | §Banned passwords | verified | <https://learn.microsoft.com/entra/identity/authentication/concept-password-ban-bad> |
| G2 | Custom list: 1,000 terms, 4-16 characters; Authentication Policy Administrator; several hours to apply | §Banned passwords | verified | <https://learn.microsoft.com/entra/identity/authentication/tutorial-configure-custom-password-protection> |
| G3 | Normalization and fuzzy matching | §Banned passwords | verified | concept-password-ban-bad |
| G4 | Licensing: cloud-only global free, custom P1/P2; synced users P1/P2 for both | §Banned passwords | verified | concept-password-ban-bad |
| G5 | Proxy and DC agent; DCs never contact the internet; no new DC ports; no schema change; SYSVOL; RPC 135 and the RPC port | §Banned passwords | verified | concept-password-ban-bad-on-premises; howto-password-ban-bad-on-premises-deploy |
| G6 | DC agent 2012 R2+, .NET 4.7.2, DFSR; reboot; not on RODCs; proxy 2012 R2+, TLS 1.2, required; two per forest; not with the Application Proxy connector | §Banned passwords | verified | howto-password-ban-bad-on-premises-deploy |
| G7 | Proxies as Tier 0, 2019 baseline | §Banned passwords | restated-as-design (program assumption) | — |
| G8 | Audit first; test promotion and demotion in audit; existing passwords checked at next change; never-expires accounts not checked | §Banned passwords | verified | howto-password-ban-bad-on-premises-deploy |
| G9 | Install and registration commands; device code on Server Core; forest registration needs Enterprise Admin | §Banned passwords | verified | howto-password-ban-bad-on-premises-deploy |
| G10 | Portal path to enable on premises; audit mode | §Banned passwords | verified | <https://learn.microsoft.com/entra/identity/authentication/howto-password-ban-bad-on-premises-operations> |
| G11 | Log path and events 10014-10017, 10024-10025 | §Banned passwords | verified | <https://learn.microsoft.com/entra/identity/authentication/howto-password-ban-bad-on-premises-monitor> |
| G12 | Supported in Azure Government; lists available in Azure Government; Azure Government proxy endpoints not yet specified on the deploy page | §Banned passwords | verified | <https://learn.microsoft.com/entra/identity/authentication/howto-password-ban-bad-on-premises-faq>; feature-availability; deploy page |
| G13 | Mandatory MFA phases and dates; read operations exempt in Phase 2; postponement to July 1, 2026; no opt-out | §Mandatory MFA | verified | <https://learn.microsoft.com/entra/identity/authentication/concept-mandatory-multifactor-authentication> |
| G14 | "As of November 2026 both phases apply" | §Mandatory MFA | restated-as-design (inferred from the latest postponement date) | — |
| G15 | Break-glass in scope (passkey or CBA); workload identities out, user service accounts in; federated IdP must send `multipleauthn` | §Mandatory MFA | verified | concept-mandatory-multifactor-authentication |
| G16 | Prepare: sign-in logs by app ID; CA on Microsoft Admin Portals and Windows Azure Service Management API, report-only; CLI 2.76+, PowerShell 14.3+ | §Mandatory MFA | verified | concept-mandatory-multifactor-authentication; <https://learn.microsoft.com/entra/identity/authentication/how-to-mandatory-multifactor-authentication> |
| G17 | Enforced only in the public Azure cloud; not currently in Azure for US Government | §Mandatory MFA | verified | concept-mandatory-multifactor-authentication |
| G18 | Domain conversion leaves other relying parties on AD FS; Appendix D | §AD FS applications; Phase 9 | restated-as-design; Appendix D claims log | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-apps-phases-overview> |

## Revision 2026-11-09 — Learn citation pass

Learn pages the coverage map listed as covered but uncited were read on Nov 9, 2026 and added as footnotes where they support the sentence. No text was reworded or removed.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | Verified ID checks in access packages need Entra ID Governance | §Entitlement management | verified (Learn read Nov 9, 2026) | c10-verified-id <https://learn.microsoft.com/entra/id-governance/entitlement-management-verified-id-settings> |
| L2 | An access package for a Kerberos app includes a cloud security group that Cloud Sync provisions to AD | §Entitlement management | verified (Learn read Nov 9, 2026) | c10-gov-kerberos <https://learn.microsoft.com/entra/id-governance/scenarios/provision-entra-to-active-directory-groups> |
| L3 | Changing tasks or execution conditions creates a new workflow version | §Limits, guardrails and design at scale | verified (Learn read Nov 9, 2026) | c10-lcw-manage-versions <https://learn.microsoft.com/entra/id-governance/manage-workflow-tasks> |
| L4 | B2B collaboration gives external users guest access to resources in your tenant | §B2B collaboration | verified (Learn read Nov 9, 2026) | c10-b2b-plan <https://learn.microsoft.com/entra/architecture/secure-external-access-resources> |
| L5 | Guest lifecycle: invitation | §B2B collaboration | verified (Learn read Nov 9, 2026) | c10-b2b-add-users <https://learn.microsoft.com/entra/external-id/add-users-administrator> |
| L6 | Guest lifecycle: redemption with home credentials or another identity provider | §B2B collaboration | verified (Learn read Nov 9, 2026) | c10-b2b-redemption <https://learn.microsoft.com/entra/external-id/redemption-experience> |
| L7 | Guest access governed by group memberships | §B2B collaboration | verified (Learn read Nov 9, 2026) | c10-external-groups <https://learn.microsoft.com/entra/architecture/4-secure-access-groups> |
| L8 | Guest access governed by Conditional Access | §B2B collaboration | verified (Learn read Nov 9, 2026) | c10-external-ca <https://learn.microsoft.com/entra/architecture/7-secure-access-conditional-access> |
| L9 | Guest Inviter role can invite guests | §B2B collaboration, invitation policies | verified (Learn read Nov 9, 2026) | c10-guest-quickstart <https://learn.microsoft.com/entra/external-id/b2b-quickstart-add-guest-users-portal> |
| L10 | Invitations can be limited to certain roles | §B2B collaboration, invitation policies | verified (Learn read Nov 9, 2026) | c10-b2b-best-practices <https://learn.microsoft.com/entra/external-id/b2b-fundamentals> |
| L11 | B2B direct connect blocked by default; organization-specific settings override the defaults | §Cross-tenant access settings | verified (Learn read Nov 9, 2026) | c10-b2b-direct-setup <https://learn.microsoft.com/entra/external-id/cross-tenant-access-settings-b2b-direct-connect> |
| L12 | Cross-tenant synchronization creates and maintains B2B users across an organization's own tenants | §Cross-tenant access settings | verified (Learn read Nov 9, 2026) | c10-cts-topology <https://learn.microsoft.com/entra/identity/multi-tenant-organizations/cross-tenant-synchronization-topology> |
| L13 | Microsoft accounts are a built-in identity provider for guests | §External identity providers | verified (Learn read Nov 9, 2026) | c10-msa <https://learn.microsoft.com/entra/external-id/microsoft-account> |
| L14 | PHS stays on whatever the sign-in method | §Password hash sync as the foundation | verified (Learn read Nov 9, 2026; Microsoft strongly recommends PHS) | c10-road-establish <https://learn.microsoft.com/entra/architecture/road-to-the-cloud-establish> |
| L15 | Privileged accounts: FIDO2 security keys and smart cards (PIV/CAC through CBA) | Roadmap table, phase 1 | verified (Learn read Nov 9, 2026) | c10-admin-personas <https://learn.microsoft.com/entra/identity/authentication/how-to-plan-persona-phishing-resistant-passwordless-authentication> |
| L16 | Passkey profile with attestation enforced (keys must meet attestation requirements) | Roadmap table, phase 1 | verified (Learn read Nov 9, 2026) | c10-fido2-attestation <https://learn.microsoft.com/entra/identity/authentication/concept-fido2-hardware-vendor> |
| L17 | Passkeys in Authenticator need Android 14 or iOS 17 or later | Roadmap table, phase 4 | verified (Learn read Nov 9, 2026) | c10-authenticator-passkey-register <https://learn.microsoft.com/entra/identity/authentication/how-to-register-passkey-authenticator> |
| L18 | Synced passkeys can be allowed for some populations through a passkey profile | §Phishing-resistant roadmap | verified (Learn read Nov 9, 2026) | c10-synced-passkeys <https://learn.microsoft.com/entra/identity/authentication/how-to-synced-passkeys> |
| L19 | The Authentication methods policy decides which methods are available to which users | §Authentication methods policy | verified (Learn read Nov 9, 2026) | c10-auth-methods-manage <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-methods-manage> |
| L20 | Additional context (application name and location) in Authenticator notifications | §Authentication methods policy | verified (Learn read Nov 9, 2026) | c10-additional-context <https://learn.microsoft.com/entra/identity/authentication/how-to-mfa-additional-context> |
| L21 | Registration campaign with a limit of three snoozes | §Authentication methods policy | verified (Learn read Nov 9, 2026) | c10-registration-campaign <https://learn.microsoft.com/entra/identity/authentication/how-to-mfa-registration-campaign> |
| L22 | A federated IdP must send the `multipleauthn` claim for Entra ID to accept its MFA | §Mandatory MFA | verified (Learn read Nov 9, 2026) | c10-federated-mfa-claims <https://learn.microsoft.com/entra/identity/authentication/how-to-mfa-expected-inbound-assertions> |
| L23 | Monitor for successful legacy sign-ins after enforcement | §Blocking legacy authentication | verified (Learn read Nov 9, 2026) | c10-secops-users <https://learn.microsoft.com/entra/architecture/security-operations-user-accounts> |
| L24 | Windows Hello for Business keys are tied to the device gaining access | §Compliance amendment, IA-2 | verified (Learn read Nov 9, 2026) | c10-whfb <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-windows-hello> |
| L25 | Platform passkeys on Windows live in the device's Windows Hello container | §Compliance amendment, IA-2 | verified (Learn read Nov 9, 2026) | c10-entra-passkey-windows <https://learn.microsoft.com/entra/identity/authentication/how-to-authentication-entra-passkeys-on-windows> |
| L26 | Entra ID logs go to Azure Monitor / Log Analytics for monitoring and detection | §Log Analytics integration | verified (Learn read Nov 9, 2026) | c10-secops-guide <https://learn.microsoft.com/entra/architecture/security-operations-introduction> |
| L27 | Seamless SSO only for domain-joined devices that aren't hybrid or Entra joined; staged rollout validates cloud authentication while the domain stays federated | Phase 2 step 3; Phase 9 step 1 | verified (Learn read Nov 9, 2026) | c10-adfs-faq <https://learn.microsoft.com/windows-server/identity/ad-fs/decommission/ad-fs-to-azure-ad-faq> |
| L28 | Register every administrator for a phishing-resistant method | Phase 5 step 1 | verified (Learn read Nov 9, 2026) | c10-admin-coverage <https://learn.microsoft.com/entra/identity/authentication/how-to-authentication-find-coverage-gaps> |
| L29 | Retiring AD means removing named dependencies, not reaching a date | §What still needs AD after Phase 10 | verified (Learn read Nov 9, 2026) | c10-road-intro <https://learn.microsoft.com/entra/architecture/road-to-the-cloud-introduction> |
| L30 | Verify the UPN suffix domain in the admin center | Troubleshooting, "Unable to update userPrincipalName" | verified (Learn read Nov 9, 2026) | c10-custom-domain <https://learn.microsoft.com/entra/fundamentals/add-custom-domain> |
| L31 | Writeback fails when the connector account lacks Reset password permission | Troubleshooting, password writeback | verified (Learn read Nov 9, 2026) | c10-sspr-writeback-tshoot <https://learn.microsoft.com/entra/identity/authentication/troubleshoot-sspr-writeback> |
| L32 | Writeback permissions (Reset password, `lockoutTime`, `pwdLastSet`, Unexpire Password) also apply to the cloud sync gMSA | Troubleshooting, password writeback | verified (Learn read Nov 9, 2026) | c10-cloud-sync-writeback <https://learn.microsoft.com/entra/identity/authentication/tutorial-enable-cloud-sync-sspr-writeback> |
| L33 | Check redemption when a guest can't reach resources | Troubleshooting, B2B guest | verified (Learn read Nov 9, 2026) | c10-b2b-troubleshoot <https://learn.microsoft.com/entra/external-id/troubleshoot> |
| L34 | A workflow doesn't fire when `employeeHireDate` isn't populated | Troubleshooting, Lifecycle workflow | verified (Learn read Nov 9, 2026) | c10-lcw-prepare-users <https://learn.microsoft.com/entra/id-governance/tutorial-prepare-user-accounts> |

## Revision 2026-11-09 — pointer to the forest recovery runbook

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| F1 | Phase rollbacks assume a healthy forest; a lost forest is recovered first, with synchronization paused, using Book 14 Appendix H; rehearse before Phase 1 | §The migration execution playbook | restated-as-design (cross-reference; the runbook's own claims log carries the Microsoft sources) | Book 14, Appendix H |

## Zero Trust closure update, Phase 4 (Nov 11, 2026)

Conventions from [Book 00, Appendix D](../../b00-orientation/appendix-d-control-states-and-evidence.md) applied to this page's procedure sections: control states, How-template gaps, authority labels, evidence checklist, change safety and assessment mapping. Product claims below were re-read on Microsoft Learn on Nov 11, 2026.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| P4-1 | Book 04 Appendix D runs the roadmap: runbooks, readiness gate, evidence, control states; government-cloud table there (passkey profiles, synced passkeys not yet specified) | Phishing-resistant roadmap | restated-as-design (cross-reference) | Book 04, Appendix D | Nov 11, 2026 |
| P4-2 | Each method in the authentication methods policy targets included and excluded groups | Turning a method off | verified | Learn, "Manage authentication methods" | Nov 11, 2026 |
| P4-3 | userRegistrationDetails `methodsRegistered` lists registered methods, e.g. `mobilePhone`, `email`, `passKeyDeviceBound`; the full value list isn't enumerated, so the code says to confirm values | Turning a method off | verified | Learn, userRegistrationDetails resource type | Nov 11, 2026 |
| P4-4 | Rings, triggers and the phone-only read for turning a method off | Turning a method off | restated-as-design (program position) | — | Nov 11, 2026 |
| P4-5 | Microsoft recommends starting in audit mode and at least one DC promotion and one demotion during audit | Rolling out Password Protection | verified | Learn, "Plan and deploy on-premises Microsoft Entra Password Protection" | Nov 11, 2026 |
| P4-6 | Enable toggle set to No puts DC agents in quiescent mode (all passwords accepted, no audit events); Mode Audit or Enforced on one settings page | Rolling out Password Protection | verified | Learn, "Enable on-premises Microsoft Entra Password Protection" | Nov 11, 2026 |
| P4-7 | Restarting the DC agent service forces a policy download (event 30006); Entra ID is always in enforce mode, audit is on-premises only | Rolling out Password Protection | verified | Learn, on-premises Password Protection FAQ | Nov 11, 2026 |
| P4-8 | Ordered removal (proxies, DC agents with reboot, SCPs, config container, SYSVOL); DSRM and demotion local Administrator passwords are validated | Rolling out Password Protection | verified | Learn, "Troubleshoot: On-premises Microsoft Entra Password Protection" | Nov 11, 2026 |
| P4-9 | HeartbeatUTC stale when an agent stops, is uninstalled or the DC is demoted; event 30034 for a newer version; no autoupgrade | Rolling out Password Protection | verified | Learn, "Monitor and review logs for on-premises Microsoft Entra Password Protection" | Nov 11, 2026 |
| P4-10 | 30-day and one-expiry-cycle audit period; rings; backout triggers | Rolling out Password Protection | restated-as-design (program position) | — | Nov 11, 2026 |
| P4-11 | MS.AAD.1.1v1 "Legacy authentication SHALL be blocked" is a BOD 25-01 required configuration | Blocking legacy authentication | verified | CISA, BOD 25-01 Required Configurations | Nov 11, 2026 |
| P4-12 | Microsoft highly recommends disabling SMTP AUTH organization-wide and enabling per mailbox; Set-TransportConfig and Set-CASMailbox settings | Blocking legacy authentication | verified | Learn, "Enable or disable authenticated client SMTP submission (SMTP AUTH)" | Nov 11, 2026 |
| P4-13 | SMTP AUTH Clients report: TlsAuthLogin (Basic) and XOAUTH2 (Modern), up to 90 days | Blocking legacy authentication | verified | Learn, "SMTP AUTH Clients report" | Nov 11, 2026 |
| P4-14 | Basic authentication retirement for SMTP AUTH: Learn still points to the latest Exchange announcement for the timeline; text unchanged ("check the current announcement") | Blocking legacy authentication | verified (no change) | Learn, "Deprecation of Basic authentication in Exchange Online" | Nov 11, 2026 |
| P4-15 | Playbook change window, emergency access test, backout triggers; phase-to-control-state table | Change safety and control states across the playbook | restated-as-design | — | Nov 11, 2026 |
| P4-16 | "must be met" and "must not be used" relabeled: the phase-order rule as risk-based recommended; Convert-MsolDomainToStandard as a retired module's cmdlet | Playbook intro; Phase 9 | restated-as-design (authority label) | — | Nov 11, 2026 |
