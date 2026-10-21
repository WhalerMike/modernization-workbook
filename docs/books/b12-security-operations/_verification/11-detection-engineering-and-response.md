# Verification — Chapter 11, Detection Engineering and Response Automation

Writer W3. Sources: `docs/compliance/Vol_VI_Book_03_Detection_Engineering.md`, `docs/compliance/Vol_VI_Book_04_Response_Automation_SOAR.md`, and the detection-rule, UEBA-response, playbook and incident-response sections of `docs/compliance/Vol_III_Book_06_SIEM_XDR_Detection.md` (that volume's full ledger is in `05-from-log-warehouse-to-detection.md`). All external sources opened October 21, 2026: Microsoft Learn through the Learn MCP tools; Microsoft's Azure-Sentinel rule templates read raw from GitHub; NIST SP 800-53 Rev. 5 from the OSCAL catalog; NIST SP 800-61r3, CISA and FedRAMP pages by fetch. No personal data sent to any site. Nothing executed against a tenant or workspace; all KQL and PowerShell are illustrative and untested.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ID Protection draws on trillions of anonymized signals daily | In-boundary principle | verified | Learn: risk-based SSPR/MFA tutorial |
| 2 | Not in Azure Government: peer/blast-radius UEBA, MDTI matching analytics, SOC optimization, Repositories | In-boundary; rule library | verified | Learn: Sentinel feature availability |
| 3 | Source: commercial ML "frequently out of scope" inside a federal boundary | In-boundary principle | restated-as-design (two cases: unavailable in the cloud, or excluded by the authorization decision; Book 10 linked) | — |
| 4 | In-boundary principle (destination, not data) | In-boundary principle | restated-as-design | — |
| 5 | Microsoft rule YAML fields (id, name, severity, requiredDataConnectors, queryFrequency, queryPeriod, triggerOperator, triggerThreshold, tactics, relevantTechniques, query, entityMappings, version) | Rule library as code | verified | Azure-Sentinel GitHub, PIMElevationRequestRejected.yaml |
| 6 | Repositories: GitHub/Azure DevOps; content types incl. custom detections (preview); overwrites portal edits; ARM export format | Rule library as code | verified | Learn: Manage content as code; Deploy content as code |
| 7 | Source: library deploys "through the SIEM's repository connection" | Rule library as code | corrected (Repositories is preview and not in Azure Government; own pipeline with ARM templates as fallback) | Learn: feature availability; repositories |
| 8 | Seven-rule in-boundary set and priority set | Library table | restated-as-design | Source volumes |
| 9 | Microsoft ships templates: MFA spamming, privileged role outside PIM, CA changes, new SP credential | Library; examples | verified | Azure-Sentinel GitHub, Entra ID solution rules list |
| 10 | Source KEV rule on `DeviceVulnerabilityAssessmentEvent` with `EventType == "Exploit"` | Library | corrected (table not streamed; exploitation handled as Defender alert) | Learn: streaming event types (Ch05 claim 26) |
| 11 | `ResultType` string "0"; `LocationDetails` dynamic; `MfaDetail` deprecated | DET-01, DET-10 | verified | Learn: SigninLogs |
| 12 | `geo_distance_2points(lon1, lat1, lon2, lat2)` returns meters | DET-01 | verified | Learn: Kusto geo_distance_2points |
| 13 | Source impossible-travel used numeric ResultType and an all-pairs self-join | DET-01 | corrected | — |
| 14 | `_GetWatchlist` with `SearchKey` | DET-01, 15, 17 | verified | Learn: watchlists queries |
| 15 | `authenticationStepResultDetail` in AuthenticationDetails | DET-10 | verified | Learn: Graph authenticationDetail |
| 16 | Result strings "MFA denied; user declined the authentication", "MFA denied; user did not respond to mobile app notification", "MFA successfully completed" | DET-10 | verified | Azure-Sentinel GitHub, MFASpammingfollowedbySuccessfullogin.yaml |
| 17 | Source: CISA advisory AA22-119A documents MFA fatigue against federal agencies | DET-10 | corrected (not verified as such; replaced with CISA Oct 31, 2022 guidance: phishing-resistant MFA, number matching interim) | CISA alert, Oct 31, 2022 |
| 18 | Source: playbook "disables MFA push notifications for the user" | DET-10 | removed (no verified API action; replaced by risk-event rule and gated revocation) | — |
| 19 | Report suspicious activity sets user high risk; `userReportedSuspiciousActivity`; P2 | DET-10b | verified | Learn: MFA settings; risk detections |
| 20 | `AADUserRiskEvents` columns RiskEventType, RiskLevel, RiskState, IpAddress, Location | DET-10b | verified | Learn: AADUserRiskEvents table |
| 21 | "Add member to role completed (PIM activation)" activity; alert on elevations outside pattern | DET-11 | verified | Learn: security operations for privileged accounts; audit activities reference |
| 22 | Source: fixed `-5h` offset and `dayofweek == 0` | DET-11 | corrected (`datetime_utc_to_local`, 'US/Eastern'; `dayofweek` returns timespan, 0d/6d) | Learn: datetime_utc_to_local; dayofweek |
| 23 | Role name from TargetResources type Role displayName; RoleManagement / modifiedProperties Role.DisplayName pattern | DET-11, DET-12 | verified | Azure-Sentinel templates (PIMElevationRequestRejected, UserAssignedPrivilegedRole) |
| 24 | "Add member to role outside of PIM (permanent)" activity | DET-12 | verified | Learn: audit activities reference |
| 25 | Source DNS beacon rule claimed timing regularity but only counted | DET-15 | corrected (gap standard deviation computed; ASIM parser instead of vendor table) | Learn: ASIM DNS schema |
| 26 | `AzureDiagnostics` SQL audit fields `client_ip_s`, `server_principal_name_s`, `action_name_s`, `succeeded_s`, `database_name_s`, `application_name_s`, `statement_s` | DET-17 | verified | Learn: SQL Database audit log format |
| 27 | `action_name_s` value "DATABASE AUTHENTICATION SUCCEEDED" | DET-17 | unverifiable (value not listed on Learn; chapter says confirm on a test instance) | — |
| 28 | `ipv4_lookup` with `return_unmatched` for subnet allowlists | DET-17 | verified | Learn: Handle false positives |
| 29 | Source: SA rule on `event_class_s == "AUDIT_LOGIN_FAILED"` in AzureDiagnostics; STIG V-79075; CIS benchmark | DET-18 | corrected/removed (field not in Azure SQL schema; rule moved to SQL Server `SecurityEvent`; STIG ID and CIS reference not verified, dropped) | — |
| 30 | NTLM rule: source used `DeviceLogonEvents` with `AuthenticationPackage`; "Phase C" | DET-19 | not carried (linked to Book 06 R09, which holds the verified SecurityEvent 4624/8004 query per brief) | Brief settled facts |
| 31 | Results simulation over last 50 runs | Lifecycle | verified | Learn: Scheduled analytics rules |
| 32 | Incident creation can be disabled per rule; alert-trigger automation for rules without incidents; Defender-portal incident setting caution | Lifecycle | verified | Learn: Scheduled analytics rules; automation rules |
| 33 | Source: "tuning window is operationally mandatory ... two weeks"; `createIncident: false` | Lifecycle | restated-as-design (minimum two weeks, until false-positive patterns documented) | — |
| 34 | Source: Sentinel "test rule" fires a simulated alert through the full automation chain | IR plan / lifecycle | corrected (no such feature found; results simulation and Defender for SQL alert simulation documented instead) | Learn: Scheduled rules; Simulate alerts for SQL servers on machines |
| 35 | AUTO DISABLED after repeated permanent failures; check regularly | Lifecycle | verified | Learn: Troubleshooting analytics rules |
| 36 | Analytics rules health: public preview, both clouds | Lifecycle | verified | Learn: feature availability |
| 37 | 512 enabled scheduled rules; 50 enabled NRT | Lifecycle | verified | Learn: Sentinel service limits |
| 38 | Quarterly review | Lifecycle | restated-as-design | — |
| 39 | Book 01 ladder L0–L4; L3 default; permanent-L3 classes | Response ladder | verified against Book 01 Ch11 (internal) | Book 01 Ch11 |
| 40 | SI-4(7) "least-disruptive actions"; IR-3, IR-4, IR-8, AC-12, AC-2(13) text | Ladder; IR plan; controls | verified | NIST OSCAL catalog |
| 41 | Response ladder mapping and permanent-L3 additions (server isolation, privileged/emergency accounts) | Response ladder | restated-as-design | — |
| 42 | Attack disruption actions, logging, undo, exclusions | Response ladder | verified | Learn: Automatic attack disruption; exclusions |
| 43 | Attack disruption availability in GCC/GCC High | Response ladder | unverifiable (not found on the US Government pages; chapter says confirm) | — |
| 44 | Automation rules: triggers, actions, order, expiration, Sentinel service account permission on resource group; playbooks are Logic Apps (Standard or Consumption) | Playbooks | verified | Learn: Automate threat response with automation rules |
| 45 | `revokeSignInSessions`: what it invalidates, few-minute delay, not external users, `User.RevokeSessions.All`, US Gov L4/L5 | Session revocation | verified | Learn: Graph user revokeSignInSessions |
| 46 | Source: confirmCompromised as `PATCH` | Session revocation | corrected (`POST /identityProtection/riskyUsers/confirmCompromised`; `IdentityRiskyUser.ReadWrite.All`; P2; sets risk high) | Learn: Graph riskyUser confirmCompromised |
| 47 | Source: CAE is "sub-second" revocation | Session revocation; limits | corrected (near real time, latency up to 15 minutes; admin refresh-token revocation is a critical event) | Learn: Continuous access evaluation |
| 48 | Default access token 60–90 min; CAE tokens up to 28 h | Session revocation | verified | Learn: Access tokens; Configurable token lifetimes |
| 49 | Source standing control "bound token lifetime to 60–90 min" | Session revocation | corrected (that is the default; Microsoft recommends CA session controls over CTL; reduced lifetimes degrade experience without eliminating risk) | Learn: CAE overview; session lifetime |
| 50 | `accountEnabled` least privilege `User.EnableDisableAccount.All` + `User.Read.All` | Account disablement | verified | Learn: Graph Update user |
| 51 | Hybrid revoke: disable in AD, reset password twice, then Entra disable, revoke tokens, disable devices; cmdlets `Update-MgUser -AccountEnabled:$false`, `Revoke-MgUserSignInSession`, `Get-MgUserRegisteredDevice`, `Update-MgDevice` | Account disablement | verified | Learn: Revoke user access in Microsoft Entra ID |
| 52 | Synced user's cloud-only disable is undone by sync | Account disablement; limits | restated-as-design (inference from Microsoft's hybrid procedure; not quoted as Microsoft text) | Learn: Revoke user access |
| 53 | `Connect-MgGraph -Identity -NoWelcome` | Account disablement | verified | Learn: Connect-MgGraph |
| 54 | Isolate API: Comment required; IsolationType Full/Selective/UnManagedDevice; `Machine.Isolate`; 100/min, 1,500/h; full-VPN caveat; `api.security.microsoft.com` | Device isolation | verified (source used `api.securitycenter.microsoft.com` and client secret) | Learn: Isolate machine API |
| 55 | MDE API hosts GCC `api-gcc.securitycenter.microsoft.us`, GCC High/DoD `api-gov.securitycenter.microsoft.us`, login `login.microsoftonline.us` | Device isolation | verified | Learn: Defender for Endpoint for US Government |
| 56 | Isolate only on active-exploitation alert; never servers in playbook | Device isolation | restated-as-design | — |
| 57 | NIST SP 800-61r3, April 2025, supersedes Rev 2, CSF 2.0 Community Profile | IR plan | verified | csrc.nist.gov |
| 58 | Seven IR artifacts | IR plan | restated-as-design | — |
| 59 | FedRAMP 2026 KSI-INR-RIR, RPI, AAR | IR plan | verified | fedramp.gov 2026 Incident Response page |
| 60 | CISA notification within one hour of identification by top-level CSIRT/SOC/IT; effective April 1, 2017 | IR plan | verified | CISA Federal Incident Notification Guidelines |
| 61 | Source: OMB M-24-04 carries forward the one-hour major-incident requirement | IR plan | not carried (not verified in this pass; chapter cites the CISA guidelines and tells readers to check current FISMA guidance) | — |
| 62 | Defender for SQL on machines alert simulation | IR plan | verified | Learn: Simulate alerts for SQL servers on machines |
| 63 | Honest limits (minutes-to-hours, one tenant, cadence + approval + propagation, rot) | Honest limits | restated-as-design, with verified facts from items 31, 45, 47 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol VI-03 front matter, FOUO banner, Draft Proposal box, Date Code | — | Stamps dropped |
| Vol VI-03 Series Context | Ch11 opening paragraph | — |
| Vol VI-03 What This Document Addresses | Ch11 In-boundary principle | Restated (claim 3) |
| Vol VI-03 Deployed example note (Sentinel format; portable to Splunk SPL, Elastic) | Ch11 Rule library as code (format) | Portability claim to other SIEMs not carried: README referenced is not a page in this book |
| Vol VI-03 The In-Boundary Principle | Ch11 The in-boundary principle | — |
| Vol VI-03 The Rule Library (seven rules table) | Ch11 library table, DET-01 to DET-07 | — |
| Vol VI-03 Illustrative rule shape (impossible travel KQL) | Ch11 FMP-DET-01 | Corrected (claims 11–13) |
| Vol VI-03 Deployment (YAML, repo connection, `// TUNE:`, prerequisites) | Ch11 Rule library as code; lifecycle; warning callout | Corrected (claim 7); "Book VI-00 pipeline" internal reference replaced with program's change-controlled pipeline |
| Vol VI-03 Closure Necessity | Ch05 evidence standard; Ch11 opening | — |
| Vol VI-03 Honest Limits | Ch11 Honest limits | — |
| Vol VI-03 Cross-References; `impl/detection-rules/` catalog | Ch11 links to Vol VI-03/04 and Vol III-06 on GitHub | `impl/` path not linked (not part of the workbook site) |
| Vol VI-03 Provenance | Footnotes | — |
| Vol VI-04 front matter, banners, Date Code | — | Stamps dropped |
| Vol VI-04 What This Document Addresses (confidence-gated action) | Ch11 The response ladder (opening) | "sub-second CAE" corrected (claim 47) |
| Vol VI-04 The Response Ladder table | Ch11 response ladder table and figure | Mapped onto Book 01 L0–L4 (claims 39–41) |
| Vol VI-04 Deployable Artifacts table | Ch11 Playbooks subsections | `short-token-lifetime` corrected (claim 49) |
| Vol VI-04 Illustrative playbook (jsonc) | Ch11 Session revocation pseudocode | Corrected (claims 45–46); L3 approval and permanent-L3 guard added |
| Vol VI-04 short-token-lifetime paragraph | Ch11 Session revocation, last paragraph | Corrected (claim 49) |
| Vol VI-04 Deployment steps (least-privilege identity, alert-only start, token bound) | Ch11 Playbooks (four rules) | Token step corrected; "Vol I Book 03" internal reference replaced with Book 04 link |
| Vol VI-04 Closure Necessity | Ch11 The response ladder (opening sentence) | — |
| Vol VI-04 Controls Operationalized | Ch11 controls table | Merged |
| Vol VI-04 Honest Limits | Ch11 Honest limits | — |
| Vol VI-04 Cross-References, Provenance | Links and footnotes | — |
| Vol III-06 Detection Engineering Lifecycle | Ch11 Rule lifecycle and testing | Claim 33 |
| Vol III-06 DNS C2 Beacon rule | Ch11 FMP-DET-15 | Claim 25 |
| Vol III-06 Impossible Travel rule | Ch11 FMP-DET-01 | Merged with VI-03 version |
| Vol III-06 PIM Activation Outside Business Hours | Ch11 FMP-DET-11 | Claim 22 |
| Vol III-06 New Global Administrator Added | Ch11 FMP-DET-12 | Broadened to sensitive roles |
| Vol III-06 MFA Fatigue | Ch11 FMP-DET-10 / 10b | Claims 15–18 |
| Vol III-06 SQL SA Re-Enabled | Ch11 FMP-DET-18 (described) | Claim 29 |
| Vol III-06 SQL Login from Unexpected Source IP | Ch11 FMP-DET-17 | Claims 26–28 |
| Vol III-06 NTLM post-block | Ch11 FMP-DET-19 (link to Book 06 R09) | Claim 30 |
| Vol III-06 KEV CVE Actively Exploited | Ch11 library note; Device isolation trigger | Claim 10 |
| Vol III-06 SASE Unusual Upload | Ch11 FMP-DET-20 | Logic kept as described, no query |
| Vol III-06 Additional Priority Rules 11–20 | Ch11 library table (DET-13, 14, 16, 21; bulk deletion, process injection, LOLBin, newly registered domain left to Defender detections or templates) | Endpoint rules (15, 19) are Defender XDR detections per Ch05 division of labor; bulk deletion and NRD not carried as separate rows |
| Vol III-06 Automation architecture (7-step sequence) | Ch11 Playbooks intro | Condensed |
| Vol III-06 Auto-suppress playbook | Ch11 Suppression of known-benign incidents | JSON not carried (see Ch05 ledger) |
| Vol III-06 Auto-enrich playbook | Ch11 Enrich and ticket | — |
| Vol III-06 Auto-isolate playbook and warning | Ch11 Device isolation | Claims 54–56 |
| Vol III-06 Auto-disable on impossible travel + risky sign-in | Ch11 Account disablement | Claims 50–53; compound trigger kept as L3, not fully automated |
| Vol III-06 IR plan 800-61 mapping | Ch11 The incident response plan | Claim 57 |
| Vol III-06 Seven IR artifacts | Ch11 The incident response plan | Claim 58 |
| Vol III-06 CISA Reporting Threshold | Ch11 The incident response plan | Claims 60–61 |
| Vol III-06 FedRAMP 20x KSI-INR | Ch11 IR plan | Claim 59 |
