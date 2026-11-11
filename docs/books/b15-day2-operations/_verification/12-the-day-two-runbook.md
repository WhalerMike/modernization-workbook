# Verification — Chapter 12, The Day-Two Operator Runbook and Validation

Writer W7. Sources: `docs/compliance/Operator_Runbook_Day2_Compliant.md`, `docs/compliance/Vol_VI_Book_08_Validation_Test_Harnesses.md` (archived after the build; not linked). Primary sources opened October 21, 2026: SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog and Low/Moderate/High profiles (read with Python; AU-9, AC-2 j, AC-6(7), CA-2, CA-7, CA-7(3), SI-6 text and baseline membership); FedRAMP 20x Security Decision Record rules page; Microsoft Learn: Temporary Access Pass, Connect Health for sync, Connect Health alert catalog, Connect Sync scheduler, Graph organization resource and Get organization permissions, Graph user resource, onPremisesProvisioningError resource, advanced query capabilities, Get-MgUser, Get-MgOrganization and Connect-MgGraph syntax pages, KQL union operator, Log Analytics Delete Data API, Sentinel data connector health; ServiceNow "Test your apps with the ATF" (Xanadu). Scripts were not executed against any tenant or workspace (no test tenant available to this writer); cmdlets, parameters, filter syntax and KQL operators were checked against the Learn pages above.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Runbook cadences and owners | Runbook at a glance | restated-as-design | Program design; aligned with Book 14 Ch11 and Book 04 |
| 2 | CA-7 and AC-6(7) frequencies organization-defined | Runbook at a glance | verified | 5.2.0 catalog parameters |
| 3 | Tier 0 monthly, other privileged quarterly, never self-review | Runbook at a glance | verified as settled program design | Book 04 Ch08/Ch09 |
| 4 | CA-7(3) in no baseline | Runbook; harnesses | verified | Baseline profiles |
| 5 | TAP is a time-limited passcode, single or multiple use | Task 1 | verified | MS Learn TAP |
| 6 | Identity proofing against the held record; second approver for high-risk | Tasks 1–2 | verified via Chapter 04 (linked) | Ch04 |
| 7 | MFA reset = account-takeover primitive; alert on every reset | Task 2 | restated-as-design | Source |
| 8 | Consent restriction ≠ service authorization; verdict before consent | Task 3 | restated-as-design | Source; Ch06 |
| 9 | Joiner from HR event, derived entitlements, TAP delivery | Task 4 | restated-as-design | Source; Book 03 |
| 10 | Parameters not commands; before/after state | Task 5 | restated-as-design | Source |
| 11 | Connect Health for sync shows server health, alerts, sync errors, data freshness; alert catalog items | Task 6 | verified | MS Learn Connect Health pages |
| 12 | Graph exposes onPremisesLastSyncDateTime and user onPremisesProvisioningErrors | Task 6 | verified | Graph organization and user resource pages |
| 13 | Default sync cycle 30 minutes; at least every 7 days if modified | Task 6 | verified | MS Learn scheduler |
| 14 | Organization.Read.All needed to read all organization properties | Script | verified | Get organization permissions |
| 15 | `onPremisesProvisioningErrors/any(o:o/category)` advanced filter; PropertyConflict the only category | Script | verified | Advanced queries page; onPremisesProvisioningError page |
| 16 | Get-MgUser `-Filter -ConsistencyLevel -CountVariable -Property -All`; Connect-MgGraph `-NoWelcome`; Get-MgOrganization `-Property` | Script | verified | Cmdlet syntax pages |
| 17 | 90-minute lateness threshold | Script | restated-as-design (two missed default cycles) | — |
| 18 | AU-9 text: protect audit information from unauthorized access, modification, deletion | Task 7 | verified | 5.2.0 catalog |
| 19 | Log Analytics deletion is a permissioned operation logged in Activity Log | Task 7 | verified | Delete Data API page |
| 20 | Source: "Review Monday to see if this is enough" | Task 7 | verified as quoted from source (the as-found document) | Source |
| 21 | AC-6(7) review "to validate the need for such privileges" | Task 8 | verified | 5.2.0 catalog |
| 22 | Source cited AC-2(7) for privileged-role review | Task 8 | corrected — AC-2(7) is in no baseline and is about role-based admin of privileged accounts; review is AC-6(7) (Moderate, High) | 5.2.0 catalog and profiles |
| 23 | Source cited "KSI-CM" for the morning check | Task 6 | removed (no such theme; KSI tags not used in this chapter) | FedRAMP KSI page (see Ch11 log) |
| 24 | Human-only closures counted and reviewed weekly | Weekly | restated-as-design | Source (Ch11 provenance callout) |
| 25 | Three harnesses + baseline re-check (+ workflow tests added) | Harnesses | restated-as-design | Source (Vol VI Book 08); workflow tests from Vol VII Book 05 |
| 26 | CA-2 text "implemented correctly, operating as intended…" | Harnesses | verified | 5.2.0 catalog |
| 27 | SI-6 text: verify correct operation; alert on failed verification tests | Harnesses | verified | 5.2.0 catalog |
| 28 | SI-6 in High only | Harnesses | verified; harnesses presented as CA-2/CA-7 at Moderate | Baseline profiles |
| 29 | Source tied telemetry completeness to CA-7(3) | Harnesses | corrected — completeness is CA-7/SI-4 monitoring; CA-7(3) is trend analysis and in no baseline | 5.2.0 catalog and profiles |
| 30 | FedRAMP SDR: verification that automation is accurate and sufficient; validation measures work as intended | Harnesses | verified (provider-only rule) | SDR-CSX-KSI |
| 31 | Source KQL used `now` without parentheses | KQL | corrected to `now()` | KQL syntax |
| 32 | `union` without `isfuzzy=true` fails on a missing table; with it, proceeds with a warning | KQL | verified; `isfuzzy=true` and a 2-day look-back added | MS Learn union operator |
| 33 | Detection-efficacy replay of benign known-bad events | Harnesses | restated-as-design | Source |
| 34 | ATF: run only on non-production instances | Workflow tests | verified | ServiceNow ATF doc |
| 35 | Sentinel data collection health workbook; SentinelHealth limited to selected connectors; Azure Monitor alert rules recommended | Native coverage | verified | MS Learn data connector health |
| 36 | Connect Health full alert evaluation needs default sync configuration | Honest limits | verified ("Limited Evaluation of Alerts") | MS Learn Connect Health for sync |
| 37 | Efficacy tests bound regression, not coverage; library ages; smoke tests assert only what written | Harness limits | restated-as-design | Source honest limits |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Runbook — banner, Date Code, "What this is" | Opening | Draft stamp, internal book references dropped |
| Runbook — The One Rule Every Task Obeys | Opening (link to Ch02 operating rules) | Already stated in Ch02; not repeated |
| Runbook — Task 1 Password Reset | Daily task 1 | |
| Runbook — Task 2 MFA Reset (incl. warning) | Daily task 2 (important callout) | |
| Runbook — Task 3 Admin Consent (incl. note) | Daily task 3 | "Book 05 Lane F" translated to Ch06 SaaS integration request |
| Runbook — Task 4 Tenant Account | Daily task 4 | |
| Runbook — Task 5 Scripted Command (incl. warning) | Daily task 5 (warning callout) | "Script Include" generalized |
| Runbook — Task 6 Morning Sync Check | Daily task 6 + illustrative probe | KSI tags dropped; probe script added (read-only) |
| Runbook — Task 7 Event-Log Handling | Daily task 7 | Admin-share path example generalized |
| Runbook — Task 8 Custom Roles | Daily task 8 | AC-2(7) corrected to AC-6(7) |
| Runbook — What Changes, in One Table | — | Already carried in Ch02 "What changes for everyday tasks"; Ch12 has a different closing table |
| Runbook — Cross-References | Links to Ch02–Ch07, Book 03/04/12/13 | Internal volume references dropped |
| Harnesses — banners, Series Context | — | Internal framing |
| Harnesses — What This Document Addresses | Opening; Validation and test harnesses intro | |
| Harnesses — The Three Harnesses table | Harness table | Extended with baseline re-check and workflow tests |
| Harnesses — Deployable Artifacts table | Harness table; controls list | CA-7(3) mapping corrected |
| Harnesses — Illustrative KQL | Telemetry-completeness check | Fixed `now()`, added `isfuzzy`, look-back |
| Harnesses — detection-efficacy paragraph | Detection efficacy subsection | |
| Harnesses — Deployment (5 steps) | Runbook table (weekly/monthly); harness subsections | |
| Harnesses — Closure Necessity | Opening ("silent failure") | Doctrine name dropped |
| Harnesses — Controls Operationalized | Which controls this supports | SI-6 added per assignment with High-only caveat |
| Harnesses — Honest Limits | What the harnesses can't prove | Added "harnesses are automation too" |
| Harnesses — Cross-References, Provenance | Links to Book 12 Ch11, Book 13 Ch06 | |

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Web self-service support documentation to WCAG 2.0 A and AA; scan intranets at a set frequency; manual testing | Validation harnesses | verified (quoted) | 36 CFR 1194 App. C 602.3; M-24-08 §III.E, n.30 |

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language): the page now says what the mechanism supports or provides evidence for, not that it satisfies a control or requirement. No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| Did the infrastructure-as-code change actually close the control? | Did the infrastructure-as-code change actually make the control test pass? | no source change |

## Learn coverage pass, November 9, 2026

Citations added from the Learn coverage map (covered-uncited pages). No content removed or changed in meaning.

| Learn page | Where cited | Date read | Supports |
|---|---|---|---|
| [Microsoft Entra operations reference guide](https://learn.microsoft.com/entra/architecture/ops-guide-intro) | The synchronization servers that stay | Nov 9, 2026 | Microsoft's operations guide as the frame for recurring identity checks |
| [Microsoft Entra identity and access management operations reference guide](https://learn.microsoft.com/entra/architecture/ops-guide-iam) | The synchronization servers that stay | Nov 9, 2026 | 30-minute delta baseline; clean up sync errors unresolved for more than 100 days |
| [Microsoft Entra authentication management operations reference guide](https://learn.microsoft.com/entra/architecture/ops-guide-auth) | 7. Event-log handling, step 1 | Nov 9, 2026 | Archiving sign-in activity in a SIEM owned by security operations |
| [Install the Microsoft Entra Connect Health agents](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-agent-install) | Entra Connect Sync server checks, step 8; Government clouds | Nov 9, 2026 | Agent installed with Connect; P1/P2; `Test-MicrosoftEntraConnectHealthConnectivity -Role Sync`; Azure Government endpoints; Hybrid Identity Administrator install not supported in Azure Government |
| [Microsoft Entra Connect Health - Health service data isn't up to date alert](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-data-freshness) | Entra Connect Sync server checks, step 8 | Nov 9, 2026 | Two-hour freshness alert; only the error state sends email |
| [Microsoft Entra Connect Health operations](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-operations) | Entra Connect Sync server checks, step 8 | Nov 9, 2026 | Email notifications on by default; recipients in notification settings |
| [Microsoft Entra Connect Health - Diagnose duplicated attribute synchronization errors](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-diagnose-sync-errors) | Entra Connect Sync server checks, step 8 | Nov 9, 2026 | Diagnose feature; cloud-side fix for orphaned objects only |

## Additions, November 9, 2026 (Learn gaps)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Default delta cycle 30 minutes; investigate consistently longer cycles; clean up sync errors unresolved over 100 days | The synchronization servers that stay | supported | [IAM operations guide](https://learn.microsoft.com/entra/architecture/ops-guide-iam) |
| 2 | OS change on a sync server: new server and swing migration recommended | The synchronization servers that stay | supported; Windows Server 2019 minimum stated as the program's baseline assumption | [Upgrade from a previous version](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-upgrade-previous-version) |
| 3 | Mandatory upgrade to 2.6.84.0 with application-based authentication by April 7, 2027; 1.x versions unsupported and non-functional | Connect Sync server checks, step 1 | supported | [Upgrade from a previous version](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-upgrade-previous-version); [Version release history](https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-version-history) |
| 4 | Automatic upgrade eligibility (express, LocalDB, under 100,000 objects); blocked at LocalDB 8 GB or more; `Get-ADSyncAutoUpgrade` states and `-Detail` | Steps 1 and 6 | supported | [Automatic upgrade](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-automatic-upgrade) |
| 5 | Swing migration suggested if not upgraded in 12 to 18 months | Step 1 | supported | [Upgrade from a previous version](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-upgrade-previous-version) |
| 6 | One active server; staging runs import and sync, no export, PHS or writeback; keep staging sync running | Step 2 | supported | [Staging server and disaster recovery](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-staging-server) |
| 7 | `Get-ADSyncScheduler` fields; `SchedulerSuspended` set by Connect during upgrade, not supported manually; an open wizard suspends the scheduler; `Get-ADSyncConnectorRunStatus` empty when idle | Step 3 | supported | [Scheduler](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler) |
| 8 | ADSync service account: 127-character non-expiring password; account can't be changed after install; a password change outside the procedure can break start or key access | Step 4 | supported | [Best practices for changing the default configuration](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-best-practices-changing-default-configuration); [Changing the ADSync service account password](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-change-serviceacct-pass); [ADSync service account](https://learn.microsoft.com/entra/identity/hybrid/connect/concept-adsync-service-account) |
| 9 | AD DS Connector account password updated in connector properties, then restart | Step 4 | supported | [Using connectors with the Sync Service Manager](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-service-manager-ui-connectors) |
| 10 | Wizard writes `Applied-SynchronizationPolicy-*.json` to `%ProgramData%\AADConnect`; other changes need an on-demand export; keep a protected copy | Step 5 | supported | [Import and export configuration settings](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-import-export-config) |
| 11 | LocalDB 10 GB limit (about 100,000 objects); at the limit the service can't start or sync; long-term fix is full SQL Server through a swing migration | Step 6 | supported | [Prerequisites](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-prerequisites); [Recover from LocalDB 10-GB limit](https://learn.microsoft.com/entra/identity/hybrid/connect/tshoot-connect-recover-from-localdb-10gb-limit) |
| 12 | Required ports to domain controllers and to Entra ID; Health agent 443 (5671 on older agents) | Step 7 | supported | [Hybrid identity required ports and protocols](https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-ports) |
| 13 | `Confirm-NetworkConnectivity` tests 53, 88 and 389; module path | Step 7 and port-check block | supported | [ADConnectivityTools reference](https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-adconnectivitytools); [ADConnectivityTool module](https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-adconnectivitytools) |
| 14 | `Get-ADSyncAutoUpgrade` and `Get-ADSyncDatabaseConfiguration` exist; server configuration version read from `Get-ADSyncGlobalSettings` | Server check block | supported | [ADSync PowerShell reference](https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-adsync); [Not working after an automatic upgrade](https://learn.microsoft.com/troubleshoot/entra/entra-id/user-prov-sync/cannot-work-automatic-upgrade) |
| 15 | Connect sync and Connect Health reporting available in Azure for US Government; US-only endpoints; `AzureInstance` = 4 without internet; latest release for Azure Government | Government clouds (Connect) | supported | [Feature availability](https://learn.microsoft.com/entra/identity/authentication/feature-availability); [Special considerations for instances](https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-instances); [Azure Government hybrid considerations](https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-government-cloud) |
| 16 | Entra Health monitoring (preview): four signal scenarios, alerts including the CA block policy scenario, four weeks of data, email to chosen recipients | Entra Health monitoring and recommendations, step 1 | supported | [What is Microsoft Entra Health monitoring?](https://learn.microsoft.com/entra/identity/monitoring-health/concept-microsoft-entra-health) |
| 17 | Licensing (P1/P2 for signals; non-trial P1/P2 and 100 MAU for alerts); Reports Reader to view, Helpdesk Administrator to update | Step 1 | supported | [Sign-ins requiring MFA scenario](https://learn.microsoft.com/entra/identity/monitoring-health/scenario-health-sign-ins-mfa); [Investigate health alerts](https://learn.microsoft.com/entra/identity/monitoring-health/howto-investigate-health-scenario-alerts) |
| 18 | Recommendations refresh every 24 hours with a one-day lag; four statuses; completed set by the service; dismissal needs a reason; Connect-related recommendations listed | Step 2 | supported | [How to use recommendations](https://learn.microsoft.com/entra/identity/monitoring-health/howto-use-recommendations); [Recommendations overview](https://learn.microsoft.com/entra/identity/monitoring-health/overview-recommendations) |
| 19 | `Get-MgBetaReportHealthMonitoringAlert` and `Get-MgBetaDirectoryRecommendation` with read-only permissions; beta APIs | Health and recommendations block | supported | [List alerts](https://learn.microsoft.com/graph/api/healthmonitoring-healthmonitoringroot-list-alerts?view=graph-rest-beta); [List recommendations](https://learn.microsoft.com/graph/api/directory-list-recommendation?view=graph-rest-beta) |
| 20 | Health alerts API: global service only; recommendations API: global, L4 and L5; GCC availability of Entra Health "not yet specified" | Government clouds (Health) | supported (national-cloud tables on the Graph pages; no GCC statement found) | as row 19 |

## Additions, November 11, 2026 (Zero Trust closure: operating cadence, B15-02)

New section "The cadence by control family" with an annual column, authority per cell and a six-role table mapped to Chapter 10's roles.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 21 | Emergency access: alert on every use; validate at least every 90 days | Cadence, identity | verified | [Manage emergency access accounts](https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access) | Nov 11, 2026 |
| 22 | BOD 25-01: report in-scope tenants annually; SCuBA results continuously or quarterly | Cadence, identity | carried from Book 13, Appendix A | CISA BOD 25-01 | Oct 21, 2026 |
| 23 | BOD 23-01: asset discovery every 7 days; vulnerability enumeration every 14 days | Cadence, devices | carried from Book 12, Chapter 06 | CISA BOD 23-01 | Oct 21, 2026 |
| 24 | Intune BitLocker encryption report | Cadence, devices | verified | [Encrypt Windows devices with BitLocker using Intune](https://learn.microsoft.com/intune/device-configuration/endpoint-security/encrypt-bitlocker-windows#monitor-and-manage-bitlocker) | Nov 11, 2026 |
| 25 | BOD 26-04: attest to publicly exposed IP addresses and domains quarterly | Cadence, network | carried from Book 12, Chapter 06 | CISA BOD 26-04 | Oct 21, 2026 |
| 26 | CP-4 and IR-3 frequencies organization-defined | Cross-family cycles | verified | SP 800-53 Rev. 5 release 5.2.0 catalog (parameters), as in row 2 | Nov 11, 2026 |
| 27 | Every other frequency, the six-role table and its mapping to Chapter 10 | Cadence; Who does it | restated-as-design (labeled P) | Program design | Nov 11, 2026 |

## Zero Trust closure, Phase 4, November 11, 2026 (implementation conventions)

Section added: Moving the desk onto the governed tasks (control states, How-template map, authority labels, change safety, evidence checklist, assessment mapping). No new product fact.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Rings by task type, audit phase using the no-ticket rule, backout triggers and control-state evidence | Moving the desk onto the governed tasks | restated-as-design | Program design under Book 00, Appendix D | Nov 11, 2026 |
