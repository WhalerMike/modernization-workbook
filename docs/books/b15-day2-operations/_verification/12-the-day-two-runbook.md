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
