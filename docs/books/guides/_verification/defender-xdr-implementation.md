# Verification — Guide: Defender XDR Engineering & Operations

New guide, first pass of 2026-11-11, written for the Zero Trust Assessment closure update (instruction IDs XDR-01 to XDR-10, and the guide's part of closure-map rows CM-09 and CM-14). Owner approval of the work: Nov 11, 2026 ("run all phases"; the trimmed plan makes the instructions' Book 21 this guide). Every Microsoft fact was read on Microsoft Learn through the Microsoft Learn documentation service on 2026-11-11, except the Graph national-cloud hosts, read 2026-11-09 for the Provider Notices guide. No personal name, email address or agency detail was sent in any request. Nothing was run in a tenant.

Facts carried from the books (the ES-001 to ES-005 values, the response ladder, the KSI mappings, M-22-09's device actions, M-26-14's retention floor, the Sentinel connector's DoD conflict) are cited by link and rely on those pages' own verification logs.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Defender for US Government built in Azure US Government; GCC, GCC High, DoD; portals `security.microsoft.com`, `security.microsoft.us`, `security.apps.mil` | Architecture, availability | verified | Microsoft Defender for US Government, <https://learn.microsoft.com/defender-xdr/usgov> | Nov 11, 2026 |
| 2 | Defender XDR API hosts `api-gcc.security.microsoft.us`, `api-gov.security.microsoft.us`; login hosts | Availability | verified | same | Nov 11, 2026 |
| 3 | Threat Experts and Defender for IoT enterprise IoT security not available in GCC, GCC High, DoD | Availability | verified | same | Nov 11, 2026 |
| 4 | GCC customers transition Endpoint, Cloud Apps, Identity to GCC versions | Availability | verified | same | Nov 11, 2026 |
| 5 | Defender for Endpoint government licensing offers; G3 includes Plan 1 | Prerequisites | verified | Defender for Endpoint for US Government customers, <https://learn.microsoft.com/defender-endpoint/gov> | Nov 11, 2026 |
| 6 | MDE API hosts `api-gcc.securitycenter.microsoft.us`, `api-gov.securitycenter.microsoft.us` | Availability | verified | same | Nov 11, 2026 |
| 7 | Supported OS in all three clouds; Server 2019 needs KB4586839 before onboarding | Gate 2 | verified | same | Nov 11, 2026 |
| 8 | Standard and streamlined (preview) government URL lists | Gate 2, availability | verified | same | Nov 11, 2026 |
| 9 | Secure Score available with some recommendations missing; security configuration management available | Availability, Gate 5 | verified | same | Nov 11, 2026 |
| 10 | DVM core and premium available in GCC, GCC High, DoD, without report inaccuracy and request CVE support | Availability, Gate 5 | verified | same | Nov 11, 2026 |
| 11 | Web content filtering report listed only in the mobile table | Availability, couldn't verify | verified (as an absence) | same | Nov 11, 2026 |
| 12 | Intune recommended; endpoint security policy; device objects only, not users | Architecture, Gate 4, Dangers | verified | Configure ASR rules and exclusions, <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-rules-configure> | Nov 11, 2026 |
| 13 | ASR precedence: local lowest; Group Policy wins over MDM unless MDMWinsOverGP; don't configure in both | Architecture, Dangers | verified | same | Nov 11, 2026 |
| 14 | Rule modes 0, 1, 2, 5, 6; OMA-URI `./Vendor/MSFT/Policy/Config/Defender/AttackSurfaceReductionRules`; Intune one-per-line syntax | Gate 4 | verified; example lines use ES-005 GUIDs | same | Nov 11, 2026 |
| 15 | Per-rule and global exclusions; Disable Local Admin Merge stops local exclusions | Gate 4 | verified | same | Nov 11, 2026 |
| 16 | Known issue: ASR on Server OS marked compliant without enforcement | Gate 4, Dangers | verified | same | Nov 11, 2026 |
| 17 | `Get-MpPreference` listing command and `Add-MpPreference` syntax; Intune overwrites local settings | Gate 4 | verified; command quoted verbatim | same | Nov 11, 2026 |
| 18 | Warn: Windows 10 1809+, platform 4.18.2008.9, engine 1.1.17400.5; not in Configuration Manager; acts as block on unsupported Windows | Gate 4 | verified | ASR rules overview, <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-rules-overview> | Nov 11, 2026 |
| 19 | LSASS and Office-injection rules don't support warn | Gate 4 | verified | same; also the rules reference | Nov 11, 2026 |
| 20 | Unblock needs administrator approval from platform 4.18.26060; persistent need = per-rule exclusion | Gate 4, Dangers | verified | same | Nov 11, 2026 |
| 21 | Standard protection rules to block without extensive testing; other rules audited first | Gate 4 | verified | same | Nov 11, 2026 |
| 22 | Per-rule hunting action types; WMI rule unsupported via Intune on 2012 R2/2016 unified | Gate 4 | verified | ASR rules reference, <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-rules-reference> | Nov 11, 2026 |
| 23 | Disable related rules before audit; all rules in audit on ring 1; User impact; Plan 2 for report, timeline, hunting; event 1122; Windows Event Forwarding; exclusion better than rollback | Gates 2 and 4, prerequisites | verified | Test your ASR rules deployment, <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-rules-deployment-test> | Nov 11, 2026 |
| 24 | Advanced hunting 30 days; ASR events throttled hourly; two sample queries | Gates 4, 7, 10, Dangers | verified; queries verbatim | Monitor ASR rule activity, <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-rules-monitor> | Nov 11, 2026 |
| 25 | ASR events 1121, 1122; CFA and NP event IDs | Synthetic events | verified | ASR events in Windows Event Viewer, <https://learn.microsoft.com/defender-endpoint/attack-surface-reduction-windows-events> | Nov 11, 2026 |
| 26 | Intune onboarding prerequisites; Endpoint Security Manager; Intune licensed separately; offboarding package 7-day expiry; don't deploy onboarding and offboarding together; 180-day profile | Gate 2, Dangers | verified | Onboard Windows devices by using Intune, <https://learn.microsoft.com/defender-endpoint/configure-endpoints-mdm> | Nov 11, 2026 |
| 27 | `sc query sense`; `OnboardingState` = 1 under `...\Windows Advanced Threat Protection\Status` | Gate 2 | verified; the PowerShell `Get-ItemProperty` form is the guide's wrapper of Learn's path and value | Troubleshoot onboarding; Configuration Manager onboarding page | Nov 11, 2026 |
| 28 | Detection test command; alert in about 10 minutes; supported OS list shows servers and Azure Stack HCI only | Gate 2, couldn't verify | verified; command verbatim | Run a detection test, <https://learn.microsoft.com/defender-endpoint/run-detection-test> | Nov 11, 2026 |
| 29 | `DeviceInfo` columns OnboardingStatus, SensorHealthState, ExposureLevel, IsInternetFacing, AssetValue, MachineGroup | Gates 2, 5 | verified | DeviceInfo, <https://learn.microsoft.com/defender-xdr/advanced-hunting-deviceinfo-table> | Nov 11, 2026 |
| 30 | Sensor health values Active, Inactive (typically 7+ days), No sensor data, Impaired communications, Misconfigured | Gate 2 | verified | Device inventory field reference | Nov 11, 2026 |
| 31 | Tamper protection not configurable by PowerShell normally; troubleshooting mode only; `Get-MpComputerStatus` status command | Gate 3 | verified | Configure tamper protection on Windows | Nov 11, 2026 |
| 32 | `TamperingAttempt` in DeviceEvents | Gate 3 | verified | Tamper protection overview | Nov 11, 2026 |
| 33 | Network protection PowerShell modes; Server parameters; datagram processing off on high-UDP roles; verification command | Gate 3 | verified | Configure network protection, <https://learn.microsoft.com/defender-endpoint/enable-network-protection> | Nov 11, 2026 |
| 34 | NP test site `smartscreentestratings2.net`; NP prerequisites (active mode, behavior monitoring, cloud protection); events 1125, 1126 | Gate 3 | verified | Evaluate network protection | Nov 11, 2026 |
| 35 | NP action types `ExploitGuardNetworkProtectionAudited`/`Blocked` | Gate 3, Gate 10 | verified | Network protection, section Advanced hunting | Nov 11, 2026 |
| 36 | CFA modes 0–4; Intune ASR policy holds CFA settings | Gate 3 | verified | Configure controlled folder access | Nov 11, 2026 |
| 37 | CFA events 1123/1124; action types `ControlledFolderAccessViolationAudited`/`Blocked` | Gate 3 | verified | Monitor controlled folder access | Nov 11, 2026 |
| 38 | `Get-NetFirewallProfile -PolicyStore ActiveStore` | Gate 3 | verified (code sample from the NetSecurity reference) | NetSecurity module reference | Nov 11, 2026 |
| 39 | Security Exposure Management: Public Cloud only; not in national or sovereign clouds (US Gov) | Gate 5, availability, Dangers | verified | What is Microsoft Security Exposure Management? | Nov 11, 2026 |
| 40 | `DeviceTvmSoftwareVulnerabilities` columns; not ingested into Sentinel | Gate 5 | verified | DeviceTvmSoftwareVulnerabilities | Nov 11, 2026 |
| 41 | List incidents: v1.0, Global/L4/L5; `SecurityIncident.Read.All`; four Entra roles; filterable properties; `Get-MgSecurityIncident`, `-ExpandProperty alerts`; correlation | Gates 1, 6, 10 | verified | List incidents, <https://learn.microsoft.com/graph/api/security-list-incidents?view=graph-rest-1.0> | Nov 11, 2026 |
| 42 | `Get-MgSecurityIncident -IncidentId` | Gate 6 | partly verified: `-IncidentId` is in Learn's Update-MgSecurityIncident sample; for Get it is inferred from the same SDK key | Microsoft.Graph.Security reference | Nov 11, 2026 |
| 43 | runHuntingQuery: Global/L4/L5; `ThreatHunting.Read.All`; `Timespan` default 30 days, ISO 8601; `Start-MgSecurityHuntingQuery` | Gates 1, 2, 7, 10 | verified | security: runHuntingQuery | Nov 11, 2026 |
| 44 | Create detectionRule: `POST /security/rules/detectionRules`; `CustomDetection.ReadWrite.All`; Detection tuning (Manage), Security Administrator, Security Operator conditions; example body; status values; no national-cloud table | Gate 7, availability | verified; guide's example is Learn's, trimmed, status set to disabled, automated actions removed | Create detectionRule | Nov 11, 2026 |
| 45 | Custom detection quotas (create 10 per minute per application) | Gate 7 | verified | Graph security API overview, Custom detections | Nov 11, 2026 |
| 46 | Unified RBAC: permission groups; create role; activation needs Security Administrator; default for new MDE/MDI tenants since 2025; permission names (Security data basics, Alerts, Response, live response) | Gate 1 | verified | Create custom roles; Permissions; Activate unified RBAC | Nov 11, 2026 |
| 47 | Defender for Identity government: Azure Government; sensor endpoints; service tag; no data migrated; 90-day feature lag; previews may not be supported | Gate 8, availability | verified | Defender for Identity for US Government offerings | Nov 11, 2026 |
| 48 | Defender for Cloud Apps government: parity except App Governance alerts (roadmap for GCC, GCC High, DoD); three-month lag | Gate 8, availability | verified | Defender for Cloud Apps for US Government offerings | Nov 11, 2026 |
| 49 | BehaviorInfo/BehaviorEntities: Cloud Apps behaviors not available for GCC | Gate 8, availability | verified | Advanced hunting schema | Nov 11, 2026 |
| 50 | Identity tables available only in Microsoft Defender; AlertInfo–AlertEvidence join | Gate 8 | verified | Migrate advanced hunting queries | Nov 11, 2026 |
| 51 | AlertEvidence and AlertInfo columns (EntityType, AccountObjectId, AccountUpn, ServiceSource, Severity) | Gate 8 | verified | AlertEvidence; AlertInfo; Azure Monitor table reference | Nov 11, 2026 |
| 52 | Detection source value "Custom detection" | Gate 7 | verified | Advanced hunting schema naming changes | Nov 11, 2026 |
| 53 | Attack disruption: roles; device group remediation levels, Full recommended; Semi allows disruption without approval; Contain User needs Sense v10.8470 and the registry command; MDI auditing and action accounts | Gates 8, 9 | verified | Configure automatic attack disruption | Nov 11, 2026 |
| 54 | Exclusions: users, device groups, IPs; five automation levels; device-group exclusion also affects AIR; caution | Gate 9 | verified | Exclude assets from automated responses | Nov 11, 2026 |
| 55 | All attack disruption actions can be undone | Gate 9 | verified | Automatic attack disruption | Nov 11, 2026 |
| 56 | Severity table, response windows, ring exit criteria, metrics, evidence retention, RACI, decision record | Throughout | restated-as-design | Program design, labeled risk-based recommended | Nov 11, 2026 |
| 57 | Audit, warn, block sequence for every rule that supports warn | Gate 4 | restated-as-design | Owner's instruction (Nov 11) and Microsoft's modes; Microsoft itself allows block directly for standard protection rules | Nov 11, 2026 |
| 58 | Windows Server 2016 gone by Jan 12, 2027; 2019 minimum | How to read | restated-as-design | Program assumption (owner decision, Nov 5) | Nov 11, 2026 |

## Not specified on Learn (gov-cloud and other gaps)

| # | Item | Learn says | Guide does |
|---|---|---|---|
| N1 | Graph `detectionRules` in GCC High and DoD | No national-cloud table | Not yet specified; portal creation from the same file |
| N2 | Automatic attack disruption in GCC, GCC High, DoD | Not mentioned on the government pages | Not yet specified |
| N3 | Automated investigation and response in government clouds | Not listed as a gap; no explicit statement | Says so |
| N4 | Web content filtering on Windows in government clouds | Report listed only for mobile | Not yet specified |
| N5 | Exposure Management in GCC specifically | "US Gov" not available; GCC not named | Treated as not available; flagged |
| N6 | Detection test on Windows 10/11 | Supported list shows servers only | Missing alert on a client treated as inconclusive |
| N7 | `OnboardingStatus` and `VulnerabilitySeverityLevel` value strings | Not enumerated | Group by OnboardingStatus; check severity strings in tenant |
| N8 | Cloud Apps behaviors in GCC High and DoD | Only GCC stated | Not yet specified |

## Review gate

`review-status: pending`. The guide waits for the owner's review; it isn't approved here.

## Known difference with Book 05

Book 05 Chapter 08 (ES-005) and Chapter 10 describe Attack Surface Reduction as audit then block. This guide adds a warn stage between them, per the owner's instruction for this guide and Learn's modes. Book 05 wasn't edited here; the owner of the B05-02 update may align ES-005.
