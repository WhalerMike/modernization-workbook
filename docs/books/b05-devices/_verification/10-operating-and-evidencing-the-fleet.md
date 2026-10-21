# Verification — Chapter 10, Operating and Evidencing the Fleet

Checked October 20, 2026. Sources: `docs/operational-guides/target-surface/intune-policy-templates.md` §10 (monitoring and drift) and Appendix D (compliance mapping, GCC boundary); `docs/operational-guides/target-surface/index.md`; the operating sections of `docs/operational-guides/intune-arc-modernization/governed-path.md` (§4, §7, §8, §9 including the FedRAMP 20x indicator table, routed here by the coordinator); `docs/projects/endpoint-device-plan.md` (stays in place; linked). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Require device to be marked as compliant" grant; needs Entra-registered, Intune-enrolled device | Compliance hand-off | verified | CA grant concept page |
| 2 | Mark devices with no policy as (default Compliant); validity period default 30, range 1–120 | Tenant settings | verified | compliance overview |
| 3 | Program values Not compliant / 14 days | Tenant settings | restated-as-design | program design |
| 4 | Compliance states Compliant / In grace period / Not evaluated / Not compliant | Reading status | verified | monitor-policy |
| 5 | Setting in Error keeps status up to 7 days | Reading status | verified (added) | monitor-policy |
| 6 | Machine risk score compliance setting | Defender risk | verified | ref-windows-settings (compliance) |
| 7 | Per-setting states Succeeded / Error / Conflict | Config status | corrected (source's separate Pending state folded into Conflict per Microsoft) | monitor-baselines |
| 8 | Conflict resolution table | Config status | corrected (ES doesn't win; config conflicts manual) | troubleshoot-device-profiles |
| 9 | Update policy types (rings, feature, quality incl. expedite and hotpatch, driver) | Windows updates | verified | update management overview |
| 10 | Autopatch ring names Test, First, Fast, Broad | Rings | verified | Essential Eight patch OS |
| 11 | Ring values | Rings | restated-as-design | program design |
| 12 | Ranges: deferral 0–30, deadlines 2–30, grace 0–7 | Rings | verified | ref-update-ring-settings |
| 13 | Autopatch licensing (E3/E5, A3/A5, VDA, Business Premium); co-management workloads | Autopatch | verified | Autopatch prerequisites |
| 14 | Autopatch included for GCC with M365 G3/G5 GCC; not GCC High/DoD | Autopatch | verified | Autopatch FAQ |
| 15 | Autopatch-managed devices shouldn't get custom rings | Autopatch | verified | manage-update-rings |
| 16 | Windows 11 version builds and end dates; 26H1 new devices only | Version currency | verified | windows11-release-information (last updated 2026-09-29/10-13) |
| 17 | EDR onboarding status report | Defender | verified | deploy-edr |
| 18 | MDE for US Government in Azure US Gov; GCC portal; GCC licensing offers | Defender | verified | defender-endpoint/gov |
| 19 | Security settings management supported in GCC | Defender | verified | intune government-service |
| 20 | AIR, live response, web content filtering configured in Defender portal | Defender | restated-as-design (portal locations not individually footnoted) | — |
| 21 | Tamper protection needs onboarding | Defender | verified | antivirus prerequisites |
| 22 | Intune doesn't manage Windows Server (Ch 09 consistency) | Defender | verified | ref-supported-platforms (in Ch 08); Ch 09 |
| 23 | Cleanup rules 30–270 days; hide only; reappear; not removed from Entra | Stale records | verified | configure-cleanup-rules |
| 24 | approximateLastSignIn not updated every sign-in; ~21 days; disable before delete; hybrid via AD | Stale records | verified | manage-stale-devices |
| 25 | Deleting Entra device deletes BitLocker keys; unrecoverable | Stale records | verified | manage-stale-devices |
| 26 | Reconciliation script cmdlets/properties | Inventory | verified (Get-MgDevice, Get-MgDeviceManagementManagedDevice; ApproximateLastSignInDateTime used on Learn) | manage-stale-devices; Graph SDK |
| 27 | Retire effects on Windows; Entra record removed unless Autopilot | Retirement | verified | device action retire |
| 28 | Retire/delete of BitLocker Entra-joined device suspends BitLocker | Retirement | verified | device action retire |
| 29 | Wipe options; power-loss option may leave device unbootable | Retirement | verified | device action wipe |
| 30 | Delete on Windows triggers retire | Retirement | verified | device action delete |
| 31 | 1,000 retire and 1,000 delete actions/day | Retirement | verified | retire; delete |
| 32 | Autopilot devices can't be deleted from Entra before Intune | Retirement | verified | Entra PowerShell manage-devices |
| 33 | Drift loop (snapshot→verify) | Drift | restated-as-design (program; Ch 05) | governed-path §4 |
| 34 | Diagnostic settings categories; audit/operational immediate; compliance org and IntuneDevices every 24 h, up to 48 h | Log Analytics | verified | integrate-azure-monitor |
| 35 | IntuneOperationalLogs has no DeviceId; covers enrollment/noncompliance | KQL | corrected (source queries) | IntuneOperationalLogs table ref |
| 36 | Table columns used in queries | KQL | verified | IntuneDeviceComplianceOrg, IntuneDevices, IntuneAuditLogs table refs |
| 37 | Alert thresholds | Alerts | restated-as-design; Tier 0 alert source corrected for latency | program design |
| 38 | NIST control text CM-2, CM-6, CM-7, CM-8, SI-2 (summarized) | Evidence | verified | NIST OSCAL 5.2.0 catalog; CSRC SP 800-53 r5 page |
| 39 | Release 5.2.0 dated Aug 27, 2025 | Evidence | verified | CSRC page |
| 40 | FedRAMP adds no parameter values to CM-2/6/7/8 and SI-2 | Evidence | verified | fedramp.gov 2026 CM and SI control pages |
| 41 | WUfB reports don't meet GCC compliance requirements | Evidence; boundary | verified; corrected (source required telemetry for WUfB reporting) | wufb-reports-overview |
| 42 | Wider NIST mapping (AC-7…SI-4) | Evidence | restated-as-design (program's claim) | source App D.1 |
| 43 | SI-16 and AU-3 mappings | Evidence | removed (held as candidates pending assessor agreement) | — |
| 44 | 46 KSIs in 10 themes | KSI | verified (count of entries; page doesn't state total) | fedramp.gov KSI page |
| 45 | Initial certification 2026-07-04; ongoing 2027-01-01 | KSI | verified | fedramp.gov FedRAMP Certification rule |
| 46 | KSI IDs/names IAM-APM, IAM-ELP, SVC-ACM, CNA-EIS, CMT-LMC, MLA-EVC, PIY-GIV | KSI | verified | fedramp.gov theme pages |
| 47 | KSI-CNA-EIS optional for Class B and C | KSI | verified (added) | CNA theme page |
| 48 | KSI-to-evidence mapping | KSI | restated-as-design (program's claim, labeled) | governed-path §9 |
| 49 | Intune GCC = commercial instance | Boundary | verified; corrected (source: separate government instance, US sovereign residency) | intune government-service |
| 50 | Graph endpoints per cloud | Boundary | verified | graph deployments |
| 51 | "Entra ID gov" for GCC CA; BitLocker keys in "sovereign cloud Entra" | Boundary | corrected (keys on device object in the tenant's Entra ID) | manage-stale-devices; government-service |
| 52 | Defender for Servers Plan 2 / Defender for SQL at Moderate (governed-path §9) | — | not carried here (Ch 05 covers kit scope) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| templates §10.1 compliance dashboard | Reading compliance status | — |
| templates §10.2 configuration status | Configuration status and conflicts | — |
| templates §10.3 conflict identification table | Configuration status and conflicts (corrected) | — |
| templates §10.4 drift detection integration | Drift detection and alerting | — |
| templates §10.5 KQL queries (3) | Log Analytics queries (rewritten; third replaced with audit query) | Originals invalid against table schemas |
| templates §10.6 alerting table | Alerts (corrected) | Vendor product names generalized |
| templates App D.1 NIST mapping | Evidence tables (CM-2/6/7/8, SI-2 + wider mapping) | SI-16, AU-3 held back |
| templates App D.2 CIS benchmark mapping | — | Not carried: CIS section numbers unverifiable without the licensed benchmark; the controls are covered by the NIST mapping |
| templates App D.3 GCC-Moderate boundary table | GCC (Moderate) boundary facts (corrected) | — |
| templates GCC feature parity box | Boundary table, last row | — |
| target-surface index — intro and leaves E.1–E.7 | Chapter framing; E.3 Intune here, E.4 Arc → Ch 09, E.2 AUs → Book 02 Ch 05, E.6 CA → Book 04, E.7 PIM → Book 04 | Download-bundle callout not carried (section archived) |
| governed-path §1 control plane governs | Ch 05 | Owned by Ch 05 |
| governed-path §2 providers incorporated | Ch 05 | Owned by Ch 05 |
| governed-path §3 actuation ladder | Ch 05 | Owned by Ch 05 |
| governed-path §4 reconciliation loop | Drift detection and alerting (applied to Intune/Defender) | — |
| governed-path §5 draft-term mapping | Ch 05 | Owned by Ch 05 |
| governed-path §6 running the governed path | Ch 05 | Owned by Ch 05 |
| governed-path §7 outcomes | Drift detection intro; evidence section | — |
| governed-path §8 rollback | Ch 05 | Owned by Ch 05 |
| governed-path §9 L3 ceiling callout | Ch 05 | Owned by Ch 05 |
| governed-path §9 FedRAMP Moderate scope callout | Ch 05 | Owned by Ch 05 |
| governed-path §9 FedRAMP 20x KSI table and exclusions | FedRAMP 20x Key Security Indicators (verified; mapping labeled as program claim; KSI-PIY-GIV added for inventory) | Also summarized in Ch 05 |
| endpoint-device-plan (all) | Where to go next (linked; this chapter is its Watch phase) | Stays in place |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed; Endpoint-security precedence and GCC instance kept as common beliefs | Conflict table; Defender settings; queries; Tier 0 alert; control mapping; boundary | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- The source claimed Endpoint security wins over configuration profiles.
- The source put Defender-portal settings in the EDR policy; its three KQL queries hard-coded states, joined on a nonexistent `DeviceId` and queried the wrong table.
- The source alerted on Tier 0 noncompliance from the daily export; mapped a wider control set, including SI-16 and AU-3.
- The source's boundary table described Intune in GCC (Moderate) as a separate government instance.
