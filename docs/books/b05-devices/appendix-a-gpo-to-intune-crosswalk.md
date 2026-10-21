---
title: "Appendix A — GPO to Intune Crosswalk"
description: "The Group Policy to Intune crosswalk: each GPO area mapped to its Intune mechanism with notes and limits, the program's 50-row setting reference, the CSP paths behind key settings, and the workload-by-workload comparison."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b05-devices
book: B05
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — GPO to Intune Crosswalk

*A crosswalk tells you where a control lands in Intune; it doesn't tell you what the control should be.*

::: {.callout-note}
## In this appendix
The category crosswalk: each Group Policy area, the Intune mechanism that replaces it, and the notes and limits that apply. The program's 50-row setting reference for the most commonly deployed GPO settings, corrected against current Microsoft documentation. The CSP paths behind the program's key settings, and the workload-by-workload comparison of Group Policy, Configuration Manager and Intune.
:::

## How to use this appendix

This is a semantic translation reference. Engineers use it to answer "what is the closest Intune surface for this GPO setting?" It isn't a prescription to recreate every GPO setting, and it isn't authority for what a setting's value should be in the new system. The disposition of each setting comes first, through the four questions in [Chapter 07](07-the-gpo-sunset-program.md#step-2-classify-each-setting); the values come from current policy intent, under the regenerate-not-copy philosophy of [Policy Transformation](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/client-server-to-hybrid-cloud/05-policy-transformation.md). The step-by-step migration is in [Chapter 08](08-gpo-to-intune-policy-migration.md).

The mechanisms named in the tables are:

- **Settings catalog**: the Intune profile type that lists the Windows settings generated from the Windows configuration service providers (CSPs), including built-in Administrative Template (ADMX) settings.[^aA-settings-catalog]
- **Imported ADMX**: custom or third-party ADMX and ADML files imported into Intune (public preview).[^aA-admx-import]
- **Endpoint security**: the purpose-built Intune policies for antivirus, disk encryption, firewall, attack surface reduction, account protection and EDR.[^aA-es]
- **Remediations** and **platform scripts**: PowerShell delivered by the Intune management extension.[^aA-remediations][^aA-scripts]
- **Custom OMA-URI**: a custom profile that writes a CSP path directly, for a setting no other surface exposes.

## Category crosswalk

| GPO area | Intune mechanism | Notes and limits |
|---|---|---|
| Account policies: password | Settings catalog (Device Lock); compliance policy to evaluate | Compliance evaluates the resulting state; it doesn't configure it.[^aA-es] For Entra ID accounts the password policy lives in Entra ID, not on the device. |
| Account policies: lockout | Settings catalog (Device Lock, `AccountLockoutPolicy`) | Needs Windows 11, version 22H2 with KB5053657, or version 24H2 and later.[^aA-devicelock] Applies to local accounts on the device. Entra ID sign-ins are governed by smart lockout, which by default locks after ten failed attempts in Azure Public tenants and three in Azure US Government tenants; customizing it needs Entra ID P1.[^aA-smart-lockout] |
| Advanced audit policy | Settings catalog (Audit) | One Policy CSP setting per subcategory, for example `AccountLogonLogoff_AuditLogon`.[^aA-audit] |
| User rights assignment | Settings catalog (User Rights) | Policy CSP UserRights, for example `DenyLocalLogOn` and `DenyRemoteDesktopServicesLogOn`.[^aA-userrights] |
| Security options | Settings catalog (Local Policies Security Options) | A logon message title or text breaks Windows Autopilot pre-provisioning.[^aA-secopts] Plan the legal banner around the provisioning method. |
| Windows Defender Firewall | Endpoint security: firewall | Group Policy analytics can't migrate firewall rules; it directs them to Endpoint security.[^aA-gpa-migrate] |
| BitLocker | Endpoint security: disk encryption (BitLocker CSP) | Managing BitLocker through the CSP beyond enabling it with `RequireDeviceEncryption` needs Windows Enterprise E3 or E5 (or A3 or A5) licenses. Settings are enforced only when encryption starts. Recovery passwords go to Entra ID for Entra-joined devices, and to both AD and Entra ID for hybrid-joined devices.[^aA-bitlocker] |
| Microsoft Defender Antivirus | Endpoint security: antivirus | `MDMWinsOverGP` doesn't apply to the Defender CSP; remove the Defender GPO settings rather than overriding them.[^aA-defender-csp] Exclusion settings merge across antivirus policies; most other settings conflict.[^aA-av-merge] |
| Exploit Guard and attack surface reduction rules | Endpoint security: attack surface reduction | ASR rules use the Policy CSP. Group Policy wins over MDM by default unless `MDMWinsOverGP` is set to 1, so don't configure the same rule in both.[^aA-asr] |
| AppLocker and application control | Endpoint security: application control | Group Policy analytics can't migrate AppLocker settings; it directs them to Endpoint security.[^aA-gpa-migrate] |
| Device Guard and Credential Guard | Settings catalog or Endpoint security: account protection | Credential Guard is a Windows Enterprise feature, not available on Windows Pro.[^aA-licensing] |
| Windows Hello for Business | Endpoint security: account protection, or settings catalog | PassportForWork CSP. Configure it through Group Policy or CSP, never both; `MDMWinsOverGP` doesn't cover it.[^aA-whfb] See [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md). |
| Microsoft LAPS and Windows LAPS | Endpoint security: account protection (Windows LAPS) | Backs up to Entra ID or AD, not both. Entra-joined devices need LAPS enabled in Entra ID device settings. The CSP-based policy takes precedence over legacy LAPS.[^aA-laps] |
| Windows Update and WSUS targeting | Update rings, feature update and quality update policies | WSUS is deprecated: no new features, still supported.[^aA-wsus] Update rings use the Update Policy CSP.[^aA-update-rings] If you use feature update policies, Microsoft recommends removing feature update deferrals from update rings.[^aA-feature-updates] |
| Delivery Optimization | Settings catalog (Delivery Optimization) | Policy CSP DeliveryOptimization. |
| Diagnostic data | Settings catalog (System, `AllowTelemetry`) | Windows Update for Business reports need at least Required (Basic) diagnostic data, and don't meet US Government Community (GCC) compliance requirements.[^aA-wufb-reports] Plan update reporting for a GCC tenant on Intune's own Windows Update reports. |
| Microsoft Edge | Settings catalog (Microsoft Edge) | Edge and Google Chrome settings are built in; no ADMX import needed.[^aA-common-tasks] |
| Internet Explorer | Retire; Edge IE mode where a site still needs it | The IE11 desktop application is retired and permanently disabled on many Windows 10 versions; IE mode is supported through at least 2029.[^aA-ie] |
| Folder redirection | Replace: OneDrive Known Folder Move (settings catalog, OneDrive) | Moves Desktop, Documents and Pictures. Microsoft recommends pacing silent moves on existing devices at no more than 1,000 devices a day and 4,000 a week.[^aA-kfm] |
| Drive maps (Group Policy preferences) | Replace: OneDrive, SharePoint and Teams; scripts only if needed | Cloud-native Windows has no built-in mapped-drive solution.[^aA-cloud-native] |
| Printers (Group Policy preferences) | Replace: Universal Print printer provisioning (settings catalog) | Uses the UniversalPrint CSP.[^aA-universal-print] |
| Point and Print restrictions | Settings catalog (Printers) | Policy CSP Printers `PointAndPrintRestrictions`, ADMX-backed.[^aA-printers] |
| Desktop wallpaper and lock screen image | Settings catalog (Personalization) | Personalization CSP. Microsoft's pages differ on edition support: the configuration guide lists Windows Pro support through Intune, while the CSP reference lists Enterprise and Education. Test on your editions.[^aA-background][^aA-personalization] |
| Start layout | Settings catalog (Start, `ConfigureStartPins`) | Windows 11 takes a `LayoutModification.json` pin list.[^aA-start] |
| Consumer experiences and Windows experience customization | Settings catalog (Experience) | Windows experience customization is an Enterprise feature, not available on Windows Pro.[^aA-licensing] |
| Remote Desktop Services | Settings catalog (Remote Desktop Services ADMX) | Check each setting's MDM support in Group Policy analytics. |
| Power management | Settings catalog (Power) | Device-type dependent. |
| Startup, shutdown, logon and logoff scripts | Platform scripts or Remediations; Win32 apps for installs | Platform scripts run once per assignment and time out after 30 minutes.[^aA-scripts] Remediations need Windows Enterprise E3 or E5, Education A3 or A5, or VDA licenses.[^aA-remediations] |
| Software installation | Win32, MSI, MSIX, Microsoft Store and WinGet apps | The client apps co-management workload moves application management. |
| Group Policy preferences: registry, files, local users and groups, scheduled tasks | Settings catalog where a CSP exists; otherwise Remediations | Preferences don't remove their settings when the GPO stops applying, unless configured to.[^aA-gpp] Plan explicit cleanup. |
| Wi-Fi, VPN and certificates | Intune configuration profiles; certificate profiles with a SCEP or PKCS connector | Managed by Intune once the device configuration workload moves.[^aA-comanage] For the PKI side, see [Book 02, Chapter 04](../b02-identity/04-the-hidden-migration-surface.md). |
| Group Policy infrastructure: slow-link detection, "always wait for the network" | Retire | Exist only to manage Group Policy processing on a domain network. |
| Third-party and custom ADMX | Imported ADMX | At most 20 ADMX files of 1 MB or less, one `en-us` ADML per ADMX, dependencies imported first.[^aA-admx-import] |
| Anything else with no MDM support | Custom OMA-URI, Remediation, or dated exception | Group Policy analytics shows the OMA-URI path where one exists.[^aA-gpa] |

## Setting reference: 50 common GPO settings

The program's lookup card for the most commonly deployed GPO settings in enterprise environments. The program policy IDs refer to the Federal Modernization Program's Intune policy template library (CP compliance, SC settings catalog, ES Endpoint security), covered in [Chapter 08](08-gpo-to-intune-policy-migration.md). The surfaces are corrected against current Microsoft documentation; where a correction changes the source row, the note says so.

| # | GPO path | GPO setting | Intune surface | Intune setting | Program ID | Notes |
|---|---|---|---|---|---|---|
| 1 | Computer > Windows Settings > Security Settings > Account Policies | Minimum password length | Settings catalog; compliance to evaluate | Device Lock: minimum password length | CP-001 | Compliance evaluates; configuration sets |
| 2 | Computer > Windows Settings > Security Settings > Account Policies | Password must meet complexity requirements | Settings catalog; compliance to evaluate | Device Lock: password complexity | CP-001 | — |
| 3 | Computer > Windows Settings > Security Settings > Account Policies | Account lockout threshold | Settings catalog | Device Lock: Account Lockout Policy | SC-001 | Windows 11 22H2 with KB5053657, or 24H2+ |
| 4 | Computer > Windows Settings > Security Settings > Account Policies | Account lockout duration | Settings catalog | Device Lock: Account Lockout Policy | SC-001 | Same setting as row 3 |
| 5 | Computer > Admin Templates > Windows Components > BitLocker | Choose drive encryption method | Endpoint security: disk encryption | Encryption method by drive type | ES-002 | Licensed per user beyond enabling encryption |
| 6 | Computer > Admin Templates > Windows Components > BitLocker > OS Drives | Require additional authentication at startup | Endpoint security: disk encryption | System drives require startup authentication (TPM+PIN) | ES-002 | Source mapped to SC-006 |
| 7 | Computer > Admin Templates > Windows Components > Defender | Turn on real-time protection | Endpoint security: antivirus; compliance to evaluate | Real-time protection | CP-001 / ES-001 | — |
| 8 | Computer > Admin Templates > Windows Components > Defender > MAPS | Cloud-delivered protection level | Endpoint security: antivirus | Cloud block level | ES-001 | Requires MAPS enabled |
| 9 | Computer > Admin Templates > Windows Components > Defender > Exploit Guard | Attack surface reduction rules | Endpoint security: attack surface reduction | ASR rules | ES-005 | Program set: 12 rules |
| 10 | Computer > Windows Settings > Security Settings > Windows Firewall | Domain profile: firewall state | Endpoint security: firewall | Enable firewall (domain) | ES-003 | Firewall rules can't be migrated by Group Policy analytics |
| 11 | Computer > Windows Settings > Security Settings > Windows Firewall | Public profile: firewall state | Endpoint security: firewall | Enable firewall (public) | ES-003 | — |
| 12 | Computer > Admin Templates > Windows Components > Windows Update | Configure Automatic Updates | Update ring | Automatic update behavior | SC-005 | Replaces WSUS targeting |
| 13 | Computer > Admin Templates > Windows Components > Windows Update | Defer feature updates | Update ring, or feature update policy | Feature update deferral (days) | SC-005 | Set to 0 when a feature update policy controls the version |
| 14 | Computer > Admin Templates > Windows Components > Windows Update | Defer quality updates | Update ring | Quality update deferral (days) | SC-005 | 0 to 30 days |
| 15 | Computer > Admin Templates > Windows Components > Windows Update | Specify intranet Microsoft update service location | Retire | None: devices update from Windows Update | SC-005 | WSUS is deprecated |
| 16 | User > Windows Settings > Folder Redirection > Desktop | Redirect Desktop | Replace: settings catalog (OneDrive) | Silently move Windows known folders: Desktop | SC-004 | Known Folder Move |
| 17 | User > Windows Settings > Folder Redirection > Documents | Redirect Documents | Replace: settings catalog (OneDrive) | Silently move Windows known folders: Documents | SC-004 | Known Folder Move |
| 18 | Computer > Admin Templates > Microsoft Edge | Configure the home page URL | Settings catalog | Home page URL | SC-003 | — |
| 19 | Computer > Admin Templates > Microsoft Edge > SmartScreen | Configure Microsoft Defender SmartScreen | Settings catalog | SmartScreen enabled | SC-003 | — |
| 20 | Computer > Admin Templates > Microsoft Edge > Extensions | Control which extensions cannot be installed | Settings catalog | Extension install blocklist | SC-003 | — |
| 21 | Computer > Admin Templates > OneDrive | Silently move Windows known folders to OneDrive | Settings catalog (OneDrive) | Silently move Windows known folders to OneDrive | SC-004 | Pace existing devices |
| 22 | Computer > Admin Templates > OneDrive | Prevent users from syncing personal OneDrive accounts | Settings catalog (OneDrive) | Prevent users from syncing personal OneDrive accounts | SC-004 | User-scoped setting |
| 23 | Computer > Admin Templates > System > Device Guard | Turn on Virtualization Based Security | Settings catalog or Endpoint security: account protection | Credential Guard | ES-006 | Enterprise edition; Tier 0 only. Source mapped to compliance |
| 24 | Computer > Admin Templates > Remote Desktop Services | Allow users to connect remotely | Settings catalog | Allow users to connect remotely | SC-009 | — |
| 25 | Computer > Admin Templates > Remote Desktop Services | Require Network Level Authentication | Settings catalog | Require user authentication by using NLA | SC-009 | — |
| 26 | Computer > Admin Templates > Remote Desktop Services | Set time limit for idle sessions | Settings catalog | Idle session time limit | SC-009 | — |
| 27 | Computer > Windows Settings > Security Settings > Local Policies | Interactive logon: Do not display last user name | Settings catalog | Interactive Logon Do Not Display Last Signed In | SC-001 | — |
| 28 | Computer > Windows Settings > Security Settings > Local Policies | Interactive logon: Message text | Settings catalog | Interactive Logon Message Text For Users Attempting To Log On | SC-001 | Legal banner; breaks Autopilot pre-provisioning |
| 29 | Computer > Windows Settings > Security Settings > Advanced Audit | Audit Logon | Settings catalog (Audit) | Account Logon Logoff: Audit Logon | SC-001 | — |
| 30 | Computer > Windows Settings > Security Settings > Advanced Audit | Audit Policy Change | Settings catalog (Audit) | Policy Change: Audit Policy Change | SC-001 | — |
| 31 | Computer > Windows Settings > Security Settings > User Rights | Deny log on locally | Settings catalog (User Rights) | Deny Local Log On | SC-001 | — |
| 32 | Computer > Windows Settings > Security Settings > User Rights | Deny log on through Remote Desktop Services | Settings catalog (User Rights) | Deny Remote Desktop Services Log On | SC-001 | — |
| 33 | User > Admin Templates > Desktop | Desktop wallpaper | Settings catalog (Personalization) | Desktop Image Url | SC-010 | Test edition support |
| 34 | Computer > Admin Templates > Control Panel > Personalization | Force a specific default lock screen image | Settings catalog (Personalization) | Lock Screen Image Url | SC-010 | Test edition support |
| 35 | Computer > Admin Templates > Start Menu and Taskbar | Start layout | Settings catalog (Start) | Configure Start Pins | SC-010 | Windows 11 JSON pin list |
| 36 | Computer > Admin Templates > Windows Components > Cloud Content | Turn off Microsoft consumer experiences | Settings catalog (Experience) | Allow Windows consumer features | SC-010 | Enterprise and Education |
| 37 | Computer > Admin Templates > Windows Components > Defender > Network Inspection System | Turn on protocol recognition | Endpoint security: antivirus | Allow intrusion prevention system | ES-001 | Source mapped to compliance |
| 38 | Computer > Admin Templates > Network > DNS Client | DNS suffix search list | Check Group Policy analytics | DNS suffix search list | — | Custom OMA-URI or script if no MDM support |
| 39 | Computer > Admin Templates > System > Logon | Always wait for the network at computer startup and logon | Retire | — | — | Exists for domain logon processing |
| 40 | Computer > Admin Templates > System > Group Policy | Configure Group Policy slow link detection | Retire | — | — | No Group Policy processing on cloud-native devices |
| 41 | Computer > Admin Templates > Windows Components > Internet Explorer | All Internet Explorer settings | Retire; Edge IE mode if needed | Edge IE mode site list | SC-003 | IE11 desktop app retired |
| 42 | Computer > Admin Templates > Printers | Point and Print Restrictions | Settings catalog (Printers) | Point and Print Restrictions | — | PrintNightmare mitigation |
| 43 | Computer > Admin Templates > System > Power Management | Sleep and hibernate settings | Settings catalog (Power) | Various | — | Device-type dependent |
| 44 | Computer > Windows Settings > Scripts | Startup and shutdown scripts | Platform scripts, Remediations or Win32 apps | — | — | Scripts and remediations node |
| 45 | User > Windows Settings > Scripts | Logon scripts (drive mappings) | Replace: OneDrive, SharePoint, Teams | Known Folder Move; SharePoint library sync | SC-004 | No built-in mapped-drive solution |
| 46 | Computer > Admin Templates > Windows Components > Delivery Optimization | Download mode | Settings catalog (Delivery Optimization) | DO Download Mode | SC-005 | — |
| 47 | Computer > Admin Templates > Windows Components > Data Collection | Allow diagnostic data | Settings catalog (System) | Allow Telemetry | — | Required (Basic) minimum for update reports |
| 48 | Computer > Admin Templates > Windows Components > Microsoft Defender Exploit Guard > Network Protection | Prevent users and apps from accessing dangerous websites | Endpoint security: antivirus or attack surface reduction | Enable network protection | ES-001 | Source mapped to SC-002 |
| 49 | Computer > Admin Templates > Windows Components > Microsoft Defender Antivirus | Configure detection for potentially unwanted applications | Endpoint security: antivirus | PUA protection | ES-001 | Source mapped to SC-002 |
| 50 | Computer > Admin Templates > System > LAPS | Windows LAPS password settings | Endpoint security: account protection | Windows LAPS | ES-006 | Back up to Entra ID; source mapped to SC-008 |

Rows 7, 8, 48 and 49 were mapped in the source to a settings catalog Defender profile (SC-002). The program keeps antivirus settings in one Endpoint security antivirus policy, because Microsoft's best practice is to manage a given setting through one method, and duplicate settings across policy types conflict.[^aA-es] Where the program's library still holds an SC-002 profile, retire its overlapping settings when ES-001 is assigned.

## CSP paths behind key settings

The OMA-URI paths behind the program's key settings, for verification on a device and for any custom profile. Group Policy analytics shows the same mapping per setting.[^aA-gpa]

| Area | Setting | CSP path |
|---|---|---|
| Device Lock | Account lockout (threshold, duration, reset counter) | `./Device/Vendor/MSFT/Policy/Config/DeviceLock/AccountLockoutPolicy`[^aA-devicelock] |
| Audit | Audit Logon | `./Device/Vendor/MSFT/Policy/Config/Audit/AccountLogonLogoff_AuditLogon`[^aA-audit] |
| Audit | Audit File System | `./Device/Vendor/MSFT/Policy/Config/Audit/ObjectAccess_AuditFileSystem`[^aA-audit] |
| Audit | Audit Policy Change | `./Device/Vendor/MSFT/Policy/Config/Audit/PolicyChange_AuditPolicyChange`[^aA-audit] |
| Audit | Audit Sensitive Privilege Use | `./Device/Vendor/MSFT/Policy/Config/Audit/PrivilegeUse_AuditSensitivePrivilegeUse`[^aA-audit] |
| Security options | Do not display last signed-in user | `./Device/Vendor/MSFT/Policy/Config/LocalPoliciesSecurityOptions/InteractiveLogon_DoNotDisplayLastSignedIn` |
| Security options | Logon message text | `./Device/Vendor/MSFT/Policy/Config/LocalPoliciesSecurityOptions/InteractiveLogon_MessageTextForUsersAttemptingToLogOn`[^aA-secopts] |
| User rights | Deny log on through Remote Desktop Services | `./Device/Vendor/MSFT/Policy/Config/UserRights/DenyRemoteDesktopServicesLogOn`[^aA-userrights] |
| Defender | Real-time protection | `./Device/Vendor/MSFT/Policy/Config/Defender/AllowRealtimeMonitoring`[^aA-defender-gp] |
| Defender | Cloud protection level | `./Device/Vendor/MSFT/Policy/Config/Defender/CloudBlockLevel`[^aA-cloudblock] |
| Defender | Extended cloud check | `./Device/Vendor/MSFT/Policy/Config/Defender/CloudExtendedTimeout`[^aA-cloudblock] |
| Defender | Sample submission | `./Device/Vendor/MSFT/Policy/Config/Defender/SubmitSamplesConsent`[^aA-defender-gp] |
| Defender | PUA protection | `./Device/Vendor/MSFT/Policy/Config/Defender/PUAProtection`[^aA-defender-gp] |
| Defender | Network protection | `./Device/Vendor/MSFT/Policy/Config/Defender/EnableNetworkProtection`[^aA-defender-gp] |
| Defender | Controlled folder access | `./Device/Vendor/MSFT/Policy/Config/Defender/EnableControlledFolderAccess`[^aA-defender-gp] |
| Defender | ASR rules | `./Device/Vendor/MSFT/Policy/Config/Defender/AttackSurfaceReductionRules`[^aA-defender-gp] |
| Update | Feature update deferral | `./Device/Vendor/MSFT/Policy/Config/Update/DeferFeatureUpdatesPeriodInDays`[^aA-update-csp] |
| Update | Quality update deferral | `./Device/Vendor/MSFT/Policy/Config/Update/DeferQualityUpdatesPeriodInDays`[^aA-update-csp] |
| Update | Ignore Windows Update Group Policies | `./Device/Vendor/MSFT/Policy/Config/Update/IgnoreWindowsUpdateGroupPolicies`[^aA-update-csp] |
| Delivery Optimization | Download mode | `./Device/Vendor/MSFT/Policy/Config/DeliveryOptimization/DODownloadMode` |
| System | Diagnostic data level | `./Vendor/MSFT/Policy/Config/System/AllowTelemetry`[^aA-wufb-reports] |
| BitLocker | Require encryption | `./Device/Vendor/MSFT/BitLocker/RequireDeviceEncryption`[^aA-bitlocker] |
| BitLocker | Encryption method by drive type | `./Device/Vendor/MSFT/BitLocker/EncryptionMethodByDriveType`[^aA-bitlocker] |
| BitLocker | OS drive recovery options | `./Device/Vendor/MSFT/BitLocker/SystemDrivesRecoveryOptions`[^aA-bitlocker] |
| Windows LAPS | Backup directory, password age, complexity, length, post-authentication actions | `./Device/Vendor/MSFT/LAPS/Policies/` followed by `BackupDirectory`, `PasswordAgeDays`, `PasswordComplexity`, `PasswordLength`, `PostAuthenticationActions`[^aA-laps-entra] |
| Policy conflict | MDM wins over Group Policy | `./Device/Vendor/MSFT/Policy/Config/ControlPolicyConflict/MDMWinsOverGP`[^aA-mdmwins] |
| Start | Start pins | `./Device/Vendor/MSFT/Policy/Config/Start/ConfigureStartPins`[^aA-start] |
| Personalization | Lock screen and desktop images | `./Vendor/MSFT/Personalization/LockScreenImageUrl`, `./Vendor/MSFT/Personalization/DesktopImageUrl`[^aA-personalization] |

The source mapped account lockout threshold to `DeviceLock/MaxDevicePasswordFailedAttempts`, which is a device-lock password setting, not the account lockout policy; and it mapped Audit Logon to an `Audit/AccountLogon_` path, where the Logon subcategory sits under `AccountLogonLogoff_`. Both are corrected above.

A custom OMA-URI profile, for a setting no other surface exposes, takes a name, a description naming the GPO setting it replaces, the OMA-URI (`./Device/Vendor/MSFT/Policy/Config/<Area>/<Setting>` for Policy CSP settings), a data type (integer, string, Boolean or Base64), and the value. ADMX-backed Policy CSP settings need the SyncML string format with `<enabled/>` and `<data id=… value=…/>` elements rather than a plain value.[^aA-bitlocker]

## Workload comparison: Group Policy, Configuration Manager and Intune

| Workload | Group Policy (on-premises) | Configuration Manager | Intune | Program recommendation |
|---|---|---|---|---|
| Compliance policies | No native equivalent; scripts and configuration baselines | Compliance settings (configuration baselines) | Device compliance policies, consumed by Conditional Access | Intune |
| Device configuration | ADMX-backed GPO settings | Configuration items and baselines | Settings catalog (including ADMX), imported ADMX, custom OMA-URI | Intune |
| Endpoint Protection | Defender, firewall and BitLocker GPO settings | Endpoint Protection workload | Endpoint security policies | Intune |
| Windows Update | WSUS targeting through GPO | Software update point with WSUS | Update rings, feature and quality update policies | Intune; retire WSUS for migrated devices |
| Resource access (Wi-Fi, VPN, certificates) | GPO with NPS and AD CS templates | No longer supported from version 2203 | Configuration profiles; certificate profiles with a SCEP or PKCS connector | Intune; moves with device configuration |
| Client apps | GPO software installation | Application management, task sequences | Win32, MSI, MSIX, Microsoft Store and WinGet apps | Phased; complex packages may stay in Configuration Manager at first |
| Office Click-to-Run apps | Not applicable | Microsoft 365 Apps deployment | Microsoft 365 Apps assignment | Intune; a common first workload |

Co-management supports these seven workloads; the resource access workload is no longer supported from Configuration Manager version 2203, and its policies are managed by Intune when the device configuration workload moves.[^aA-comanage]

## Limits that shape the crosswalk

| Limit | Effect on the plan |
|---|---|
| Group Policy analytics imports GPO exports of 4 MB or less with proper Unicode encoding, and reads only non-ADMX settings in English accurately.[^aA-gpa] | Split oversized GPOs before import; treat non-English results as unreliable |
| Group Policy analytics migration is best effort, and can't migrate firewall rules or AppLocker.[^aA-gpa-migrate] | Review every migrated setting; build firewall and application control in Endpoint security |
| ADMX import is in preview: 20 files, 1 MB each, `en-us` only.[^aA-admx-import] | Prefer built-in settings catalog ADMX; import only what's missing |
| `MDMWinsOverGP` covers only the Policy CSP.[^aA-mdmwins] | Defender, Windows Hello for Business and other CSPs need the GPO removed, not overridden |
| Configuration policies of every type have equal priority; conflicts may leave a setting unapplied.[^aA-es] | Each setting has one owning policy |
| Remediations need Windows Enterprise E3 or E5, Education A3 or A5, or VDA licenses.[^aA-remediations] | Confirm licensing before relying on Remediations for exceptions |
| BitLocker CSP management beyond `RequireDeviceEncryption` needs Enterprise E3 or E5 (or A3 or A5) licenses.[^aA-bitlocker] | Confirm licensing for the disk encryption policy |
| Some settings depend on edition: Credential Guard and Windows experience customization need Enterprise.[^aA-licensing] | Edition is part of the device's target state |
| Windows Update for Business reports don't meet GCC compliance requirements.[^aA-wufb-reports] | Use Intune's Windows Update reports in a GCC tenant |

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Operating and Evidencing the Fleet](10-operating-and-evidencing-the-fleet.md) · [Book index](index.md)
:::

[^aA-settings-catalog]: Microsoft Learn, "Use the Intune settings catalog to configure settings," <https://learn.microsoft.com/intune/device-configuration/settings-catalog/> (accessed Oct 20, 2026).
[^aA-admx-import]: Microsoft Learn, "Import custom ADMX and ADML administrative templates into Microsoft Intune (public preview)," section "What you need to know," <https://learn.microsoft.com/intune/device-configuration/settings-catalog/import-custom-admx-templates> (accessed Oct 20, 2026).
[^aA-es]: Microsoft Learn, "Manage endpoint security in Microsoft Intune," sections "Choose the right policy type" and "Avoid policy conflicts," <https://learn.microsoft.com/intune/device-security/endpoint-security-policies> (accessed Oct 20, 2026).
[^aA-remediations]: Microsoft Learn, "Remediations," section "Prerequisites," <https://learn.microsoft.com/intune/device-management/tools/deploy-remediations> (accessed Oct 20, 2026).
[^aA-scripts]: Microsoft Learn, "Use PowerShell Scripts on Windows Devices in Intune," <https://learn.microsoft.com/intune/device-management/tools/run-powershell-scripts-windows> (accessed Oct 20, 2026).
[^aA-devicelock]: Microsoft Learn, "Policy CSP - DeviceLock," section "AccountLockoutPolicy," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-devicelock> (accessed Oct 20, 2026).
[^aA-smart-lockout]: Microsoft Learn, "Protect user accounts from attacks with Microsoft Entra smart lockout," <https://learn.microsoft.com/entra/identity/authentication/howto-password-smart-lockout> (accessed Oct 20, 2026).
[^aA-audit]: Microsoft Learn, "Policy CSP - Audit," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-audit> (accessed Oct 20, 2026).
[^aA-userrights]: Microsoft Learn, "Policy CSP - UserRights," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-userrights> (accessed Oct 20, 2026).
[^aA-secopts]: Microsoft Learn, "Policy CSP - LocalPoliciesSecurityOptions," sections "InteractiveLogon_MessageTextForUsersAttemptingToLogOn" and "InteractiveLogon_MessageTitleForUsersAttemptingToLogOn," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-localpoliciessecurityoptions> (accessed Oct 20, 2026).
[^aA-gpa-migrate]: Microsoft Learn, "Create a Settings Catalog policy using your imported GPOs in Microsoft Intune," section "What you need to know," <https://learn.microsoft.com/intune/device-configuration/migrate-group-policy> (accessed Oct 20, 2026).
[^aA-bitlocker]: Microsoft Learn, "BitLocker CSP," <https://learn.microsoft.com/windows/client-management/mdm/bitlocker-csp> (accessed Oct 20, 2026).
[^aA-defender-csp]: Microsoft Learn, "Defender CSP," <https://learn.microsoft.com/windows/client-management/mdm/defender-csp> (accessed Oct 20, 2026).
[^aA-av-merge]: Microsoft Learn, "Antivirus policy for endpoint security in Microsoft Intune," section "Policy merge for settings," <https://learn.microsoft.com/intune/device-configuration/endpoint-security/antivirus> (accessed Oct 20, 2026).
[^aA-asr]: Microsoft Learn, "Configure attack surface reduction (ASR) rules and exclusions," section "How policy conflicts are handled," <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-rules-configure> (accessed Oct 20, 2026).
[^aA-licensing]: Microsoft Learn, "Windows Commercial Licensing overview," section "Use a Windows Pro device with the Windows Enterprise user subscription license," <https://learn.microsoft.com/windows/whats-new/windows-licensing> (accessed Oct 20, 2026).
[^aA-whfb]: Microsoft Learn, "Configure Windows Hello for Business," section "Policy conflicts from multiple policy sources," <https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/configure> (accessed Oct 20, 2026).
[^aA-laps]: Microsoft Learn, "Microsoft Intune support for Windows LAPS," <https://learn.microsoft.com/intune/device-security/laps/overview> (accessed Oct 20, 2026).
[^aA-wsus]: Microsoft Learn, "Windows Server Update Services (WSUS) overview," <https://learn.microsoft.com/windows-server/administration/windows-server-update-services/get-started/windows-server-update-services-wsus> (accessed Oct 20, 2026).
[^aA-update-rings]: Microsoft Learn, "Troubleshoot Update rings for Windows 10 and Windows 11 in Microsoft Intune," section "What Windows Update ring policies do," <https://learn.microsoft.com/troubleshoot/mem/intune/device-protection/troubleshoot-update-rings> (accessed Oct 20, 2026).
[^aA-feature-updates]: Microsoft Learn, "Configure Windows feature update policies," section "Move from update ring deferrals to feature update policies," <https://learn.microsoft.com/intune/device-updates/windows/configure-feature-update-policy> (accessed Oct 20, 2026).
[^aA-wufb-reports]: Microsoft Learn, "Configuring Microsoft Intune devices for Windows Update for Business reports," <https://learn.microsoft.com/windows/deployment/update/wufb-reports-configuration-intune>; and "Enable Windows Update for Business reports," <https://learn.microsoft.com/windows/deployment/update/wufb-reports-enable> (both accessed Oct 20, 2026).
[^aA-common-tasks]: Microsoft Learn, "Tasks you can complete using the Settings Catalog in Intune," section "Configure Microsoft Edge and Google Chrome," <https://learn.microsoft.com/intune/device-configuration/settings-catalog/common-tasks> (accessed Oct 20, 2026).
[^aA-ie]: Microsoft Learn, "Lifecycle FAQ - Internet Explorer and Microsoft Edge," <https://learn.microsoft.com/lifecycle/faq/internet-explorer-microsoft-edge> (accessed Oct 20, 2026).
[^aA-kfm]: Microsoft Learn, "Redirect and move Windows known folders to OneDrive," section "About the Known Folder Move policies," <https://learn.microsoft.com/sharepoint/redirect-known-folders> (accessed Oct 20, 2026).
[^aA-cloud-native]: Microsoft Learn, "Tutorial: Set up cloud-native Windows endpoints with Microsoft Intune," section "Mapping Network Drives and Printers," <https://learn.microsoft.com/intune/solutions/cloud-native-endpoints/tutorial-cloud-native-setup> (accessed Oct 20, 2026).
[^aA-universal-print]: Microsoft Learn, "Create a Universal Print policy in Microsoft Intune," <https://learn.microsoft.com/intune/device-configuration/settings-catalog/configure-universal-print> (accessed Oct 20, 2026).
[^aA-printers]: Microsoft Learn, "Policy CSP - Printers," section "PointAndPrintRestrictions," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-printers> (accessed Oct 20, 2026).
[^aA-background]: Microsoft Learn, "Configure the desktop and lock screen backgrounds," <https://learn.microsoft.com/windows/configuration/background/> (accessed Oct 20, 2026).
[^aA-personalization]: Microsoft Learn, "Personalization CSP," <https://learn.microsoft.com/windows/client-management/mdm/personalization-csp> (accessed Oct 20, 2026).
[^aA-start]: Microsoft Learn, "Policy CSP - Start," section "ConfigureStartPins," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-start> (accessed Oct 20, 2026).
[^aA-gpp]: Microsoft Learn, "Group Policy preferences," section "Common configurations," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-policy/group-policy-preferences> (accessed Oct 20, 2026).
[^aA-comanage]: Microsoft Learn, "Co-management workloads," sections "Resource access policies" and "Device configuration," <https://learn.microsoft.com/intune/configmgr/comanage/workloads> (accessed Oct 20, 2026).
[^aA-gpa]: Microsoft Learn, "Import and analyze your on-premises GPOs using Group Policy analytics in Microsoft Intune," <https://learn.microsoft.com/intune/device-configuration/import-group-policy-analytics> (accessed Oct 20, 2026).
[^aA-defender-gp]: Microsoft Learn, "Policies in Policy CSP supported by group policy," section "Defender," <https://learn.microsoft.com/windows/client-management/mdm/policies-in-policy-csp-supported-by-group-policy> (accessed Oct 20, 2026).
[^aA-cloudblock]: Microsoft Learn, "Policy CSP - Defender," sections "CloudBlockLevel" and "CloudExtendedTimeout," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-defender> (accessed Oct 20, 2026).
[^aA-update-csp]: Microsoft Learn, "Policy CSP - Update," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-update> (accessed Oct 20, 2026).
[^aA-laps-entra]: Microsoft Learn, "Get started with Windows LAPS and Microsoft Entra ID," section "Policies that apply to Microsoft Entra mode," <https://learn.microsoft.com/windows-server/identity/laps/laps-scenarios-azure-active-directory> (accessed Oct 20, 2026).
[^aA-mdmwins]: Microsoft Learn, "Policy CSP - ControlPolicyConflict," section "MDMWinsOverGP," <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-controlpolicyconflict> (accessed Oct 20, 2026).
