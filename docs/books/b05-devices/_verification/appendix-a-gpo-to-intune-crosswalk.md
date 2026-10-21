# Verification — Appendix A, GPO to Intune Crosswalk

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch). Only the crosswalk tables of `docs/operational-guides/target-surface/intune-policy-templates.md` were taken; the 7-phase migration and policy library belong to Chapter 08.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Settings catalog built from Windows CSPs incl. ADMX | Mechanisms | verified | aA-settings-catalog |
| 2 | Compliance evaluates; configuration sets | Password row; rows 1–2 | verified | aA-es |
| 3 | `AccountLockoutPolicy` CSP; Windows 11 22H2 + KB5053657, 24H2+ | Lockout row; row 3–4; CSP table | verified; source CSP `MaxDevicePasswordFailedAttempts` corrected | aA-devicelock |
| 4 | Smart lockout defaults 10 (Azure Public) / 3 (US Gov); P1 to customize | Lockout row | verified (added) | aA-smart-lockout |
| 5 | Audit CSP names (`AccountLogonLogoff_AuditLogon`, `ObjectAccess_AuditFileSystem`, `PolicyChange_AuditPolicyChange`, `PrivilegeUse_AuditSensitivePrivilegeUse`) | Audit row; CSP table | verified; source path `Audit/AccountLogon_AuditLogon` corrected | aA-audit |
| 6 | UserRights `DenyLocalLogOn`, `DenyRemoteDesktopServicesLogOn` | User rights row; CSP table | verified | aA-userrights |
| 7 | Logon message title/text breaks Autopilot pre-provisioning | Security options row; row 28 | verified (added) | aA-secopts |
| 8 | GPA migrate can't do firewall rules or AppLocker | Firewall, AppLocker rows; limits | verified | aA-gpa-migrate |
| 9 | BitLocker CSP: licensing beyond RequireDeviceEncryption; settings enforced at encryption start; recovery escrow by join type | BitLocker row; limits | verified (added) | aA-bitlocker |
| 10 | MDMWinsOverGP not applicable to Defender CSP | Defender row | verified | aA-defender-csp |
| 11 | Antivirus exclusion settings merge | Defender row | verified (added) | aA-av-merge |
| 12 | ASR: GP wins by default unless MDMWinsOverGP=1 | ASR row | verified | aA-asr |
| 13 | Credential Guard and Windows experience customization not on Pro | Device Guard, consumer rows; limits | verified | aA-licensing |
| 14 | Source row 23: Credential Guard via compliance (CP-002) | Row 23 | corrected: configuration (settings catalog/account protection); compliance doesn't configure it | aA-licensing, aA-es |
| 15 | WHfB: GPO or CSP not both; MDMWinsOverGP n/a | WHfB row | verified | aA-whfb |
| 16 | Windows LAPS via Endpoint security account protection; Entra or AD not both; Entra enablement; CSP precedence over legacy LAPS | LAPS row; row 50 | verified; source mapping to settings catalog SC-008 corrected | aA-laps |
| 17 | LAPS CSP settings applicable in Entra mode | CSP table | verified | aA-laps-entra |
| 18 | WSUS deprecated, still supported | Update row; row 15 | verified | aA-wsus |
| 19 | Update rings use Update Policy CSP | Update row | verified | aA-update-rings |
| 20 | Remove feature update deferrals when using feature update policies | Update row; row 13 | verified (added) | aA-feature-updates |
| 21 | Quality deferral 0–30 days | Row 14 | verified | aA-update-csp (and update ring settings page via search) |
| 22 | WUfB reports need Required diagnostic data; not GCC compliant | Diagnostic row; row 47; limits | verified (added) | aA-wufb-reports |
| 23 | "Use Intune's Windows Update reports in a GCC tenant" | Diagnostic row; limits | restated-as-design | — |
| 24 | Edge and Chrome built into settings catalog | Edge row | verified | aA-common-tasks |
| 25 | IE11 retired/permanently disabled on certain Windows 10; IE mode through at least 2029 | IE row; row 41 | verified | aA-ie |
| 26 | KFM moves Desktop, Documents, Pictures; silent pacing 1,000/day, 4,000/week | Folder redirection row | verified (added) | aA-kfm |
| 27 | No built-in mapped-drive solution | Drive maps row; row 45 | verified | aA-cloud-native |
| 28 | Universal Print via settings catalog, UniversalPrint CSP | Printers row | verified | aA-universal-print |
| 29 | Point and Print Restrictions in Printers CSP, ADMX-backed | Row 42; Point and Print row | verified | aA-printers |
| 30 | Personalization edition support differs between pages | Wallpaper row; rows 33–34 | verified (both pages read; discrepancy stated) | aA-background, aA-personalization |
| 31 | ConfigureStartPins takes LayoutModification.json (Windows 11) | Start row; row 35 | verified | aA-start |
| 32 | Platform scripts and Remediations limits/licensing | Scripts row | verified | aA-scripts, aA-remediations |
| 33 | GPP don't remove settings unless configured | GPP row | verified | aA-gpp |
| 34 | Resource access managed by Intune with device configuration; unsupported from 2203 | Wi-Fi/VPN row; workload table | verified | aA-comanage |
| 35 | ADMX import limits | ADMX row; limits | verified | aA-admx-import |
| 36 | GPA shows OMA-URI path; 4 MB; English non-ADMX | Last row; limits | verified | aA-gpa |
| 37 | Defender Policy CSP names | CSP table | verified | aA-defender-gp, aA-cloudblock |
| 38 | Cloud block level requires MAPS | Row 8 | verified | aA-cloudblock |
| 39 | Update CSP paths incl. IgnoreWindowsUpdateGroupPolicies | CSP table | verified | aA-update-csp |
| 40 | BitLocker CSP paths | CSP table | verified | aA-bitlocker |
| 41 | `AllowTelemetry` path | CSP table | verified | aA-wufb-reports |
| 42 | `DeliveryOptimization/DODownloadMode`, `InteractiveLogon_DoNotDisplayLastSignedIn` paths | CSP table | unverifiable on a fetched page in this session (names match Policy CSP conventions and the source) — left without footnote; flag for spot check | — |
| 43 | ADMX-backed policies need SyncML `<enabled/>`/`<data>` format | Custom OMA-URI paragraph | verified | aA-bitlocker |
| 44 | Rows 7, 8, 48, 49 moved from SC-002 to ES-001 | Setting reference | restated-as-design, justified by one-method best practice | aA-es |
| 45 | Rows 5–6 moved from SC-006 to ES-002 | Setting reference | restated-as-design | aA-es |
| 46 | Row 37 "Network Inspection System" via compliance | Row 37 | corrected: antivirus setting (`AllowIntrusionPreventionSystem`) | Graph API to CSP mapping (search result, learn.microsoft.com/intune/device-configuration/ref-graph-api-csp-windows) |
| 47 | Program IDs (CP/SC/ES) | Setting reference | restated-as-design | Source templates library |
| 48 | Workload comparison (C.1) recommendations | Workload table | restated-as-design; resource access row corrected | aA-comanage |
| 49 | Source C.1 "Settings Catalog parity achieved" | Workload table | removed (unverifiable marketing claim) | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| intune-policy-templates.md §7 callout "Reference, not prescription" | "How to use this appendix" | — |
| intune-policy-templates.md §7 50-row semantic translation reference | "Setting reference: 50 common GPO settings" | Surfaces corrected (rows 3–6, 7–8, 13, 15, 23, 37, 48–50) |
| intune-policy-templates.md §4 per-profile GPO-path tables (SC-001 lockout, audit, user rights, security options) | Category crosswalk rows and CSP table | Values (10 attempts, banner text) are Ch08's policy library, not crosswalk |
| intune-policy-templates.md Appendix A Settings Catalog CSP references (A.1–A.5) | "CSP paths behind key settings" | Two incorrect paths corrected |
| intune-policy-templates.md Appendix A.6 custom OMA-URI template | Paragraph after CSP table | — |
| intune-policy-templates.md Appendix C.1 workload-by-workload comparison | "Workload comparison" table | — |
| intune-policy-templates.md Appendix C.2 decision criteria, C.3 timeline | Not carried | Planning and timeline material for Ch08 |
| intune-policy-templates.md §9 phase 1 categorization (direct/partial/none/deprecated) | Not carried here | Chapter 07 Step 2 and GPA readiness statuses cover it; phase mechanics are Ch08's |
| intune-policy-templates.md §§1–6, 8–10, Appendices B, D | Not carried here | Policy library, groups, deployment, monitoring, JSON and compliance mapping belong to Ch08/Ch10 |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed | In this appendix; setting reference intro; rows 7/8/48/49 note; row 50; CSP notes | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- Rows 7, 8, 48 and 49 were mapped in the source to SC-002; row 50 to SC-008.
- The source mapped account lockout threshold to `MaxDevicePasswordFailedAttempts` and Audit Logon to an `Audit/AccountLogon_` path.
