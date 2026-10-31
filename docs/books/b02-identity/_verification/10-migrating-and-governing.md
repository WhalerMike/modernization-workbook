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
