# Verification — Microsoft Automation, Module 3: Intune through Microsoft Graph (research)

File: `docs/training/ms-automation-intune.md`
Example code: `examples/ms-automation/python/intune_tasks.py`, the Intune functions in `examples/ms-automation/powershell/FmwGraph.psm1`, and `examples/ms-automation/tests/fixtures/intune.json`
Verified: 2026-10-30

Method:
- Microsoft Learn pages were read on 2026-10-30 with the Microsoft Learn tools (`microsoft_docs_fetch` for full pages, `microsoft_docs_search` for section text). Where a search returned two versions of one page, the full page was fetched and the fetched text used.
- For each API, the permissions table, the national cloud table, the HTTP request and the documented properties were read. "Least privileged" means the first application permission in the page's "from least to most privileged" list.
- v1.0 versus beta: the v1.0 page or resource was read, and the property or API is called beta-only when it's absent from the v1.0 page and present on the beta page. A v1.0 URL that returns the beta page and banner counts as beta-only.
- ScubaGear: `aad.md` was downloaded from the `cisagov/ScubaGear` main branch and searched; the baselines folder was listed through the GitHub contents API.
- NIST: the SP 800-53 Rev. 5 Moderate baseline profile and the catalog (OSCAL content, version 5.2.0) were downloaded from `usnistgov/oscal-content`. Baseline membership and control titles were read from the JSON.
- Book 05 and the validation kit were read in the repository for the links and the VK-INT checks.
- No request carried a name, email address or other personal data.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **not verified** (labelled on the page as unverified, or not stated as fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Intune Graph APIs need an active Intune license for the tenant | APIs at a glance | verified | m3-mdlist (note on every Intune page) |
| 2 | List managedDevices: `GET /deviceManagement/managedDevices`; least-privileged application permission `DeviceManagementManagedDevices.Read.All`; v1.0; global, L4, L5 | APIs table | verified | m3-mdlist |
| 3 | List deviceCompliancePolicies: `DeviceManagementConfiguration.Read.All`; v1.0; global, L4, L5 | APIs table | verified | m3-cplist |
| 4 | List deviceCompliancePolicyAssignments: `.../{id}/assignments`; `DeviceManagementConfiguration.Read.All`; v1.0 | APIs table | verified | m3-cpassign |
| 5 | List deviceComplianceDeviceStatuses: `.../{id}/deviceStatuses`; `DeviceManagementConfiguration.Read.All`; v1.0 | APIs table | verified | m3-cpstatus |
| 6 | List deviceConfigurations: `DeviceManagementConfiguration.Read.All`; v1.0 | APIs table; configuration profiles | verified | m3-dclist |
| 7 | configurationPolicies (Settings Catalog): beta page; `DeviceManagementConfiguration.Read.All` first, `DeviceManagementEndpointSecurity.Read.All` also listed | APIs table; v1.0 versus beta | verified | m3-sclist |
| 8 | configurationPolicies example shows `templateReference.templateFamily` = `endpointSecurityAntivirus` | v1.0 versus beta | verified (example response) | m3-sclist |
| 9 | Beta banner: "subject to more frequent change"; Microsoft recommends v1.0 when possible | v1.0 versus beta | verified | m3-sclist |
| 10 | assignmentFilters: `GET /deviceManagement/assignmentFilters`; `DeviceManagementConfiguration.Read.All`; the v1.0 URL returns the beta page and example; properties `platform`, `rule`, `payloads` | APIs table; assignment filters | verified | m3-filters |
| 11 | Beta exclusionGroupAssignmentTarget has `deviceAndAppManagementAssignmentFilterId` and `...FilterType` (`none`, `include`, `exclude`) | v1.0 versus beta; compliance policies | verified | m3-exclbeta |
| 12 | v1.0 deviceAndAppManagementAssignmentTarget: "Properties: None" | v1.0 versus beta | verified | m3-targetv1 |
| 13 | v1.0 groupAssignmentTarget has `groupId` | Compliance policies | verified | m3-grouptarget |
| 14 | Exclusion target type exists in v1.0 responses | Code (EXCLUSION_TARGET) | not verified for v1.0 (documented in beta only); the code treats any non-exclusion type as an include | m3-exclbeta |
| 15 | List windowsAutopilotDeviceIdentities: `DeviceManagementServiceConfig.Read.All`; v1.0; global, L4, L5 | APIs table; Autopilot | verified | m3-aplist |
| 16 | v1.0 Autopilot identity properties: groupTag, purchaseOrderIdentifier, serialNumber, enrollmentState, lastContactedDateTime, managedDeviceId, userPrincipalName, addressableUserName; no deploymentProfileAssignmentStatus | Autopilot; v1.0 versus beta | verified | m3-apv1 |
| 17 | Beta adds deploymentProfileAssignmentStatus (seven values, including Microsoft's spelling `assignedUnkownSyncState`), deploymentProfileAssignmentDetailedStatus (e.g. `hardwareRequirementsNotMet`), deploymentProfile and intendedDeploymentProfile | Autopilot | verified | m3-apbeta |
| 18 | windowsAutopilotDeploymentProfiles list: beta; `DeviceManagementServiceConfig.Read.All` | APIs table; Autopilot | verified (azureAD profile list page) | m3-approfiles |
| 19 | List mobileApps: `DeviceManagementConfiguration.Read.All` first, then `DeviceManagementApps.Read.All`; v1.0; `publishingState` property | APIs table; apps | verified | m3-apps |
| 20 | Ask for `DeviceManagementApps.Read.All` for an apps-only script | Apps | design (labelled) | — |
| 21 | managedDevice complianceState values (seven) and `$filter` eq/or | Managed devices | verified | m3-mdres |
| 22 | lastSyncDateTime "last completed a successful sync"; `$filter` lt/gt | Managed devices | verified | m3-mdres |
| 23 | isEncrypted "Device encryption status"; managedDeviceOwnerType values; azureADDeviceId; complianceGracePeriodExpirationDateTime | Managed devices | verified | m3-mdres |
| 24 | managedDevice returns userPrincipalName, emailAddress, userDisplayName, phoneNumber | Managed devices | verified | m3-mdres |
| 25 | ethernetMacAddress, physicalMemoryInBytes, iccid, udid return defaults on list; need a single GET with `$select` | Managed devices | verified | m3-mdres |
| 26 | `$select` on the managedDevices list call is honoured for the properties the code selects | Code | not verified against a tenant; the resource page documents `$select` for some properties only | m3-mdres |
| 27 | deviceComplianceDeviceStatus status values (eight); properties incl. userName, userPrincipalName; `id` "Key of the entity" | Compliance policies | verified | m3-cpstatusres |
| 28 | Status id can't be joined to the managed device ID; join on device name | Compliance policies; checks | inference (labelled); open review item | m3-cpstatusres |
| 29 | Default "Mark devices with no compliance policy assigned as" is Compliant; Microsoft recommends Not compliant and targeting every device | Compliance policies; checks table | verified | m3-reports |
| 30 | deviceManagementSettings: secureByDefault, deviceComplianceCheckinThresholdDays definitions | Compliance policies | verified | m3-dmsettings |
| 31 | Permission for `GET /deviceManagement` (settings) | Compliance policies | not verified (the v1.0 get page didn't load); stated as unconfirmed, and the code doesn't read it | — |
| 32 | Managed device action list (retire, wipe, syncDevice, remoteLock, rebootNow, shutDown, locateDevice, windowsDefenderScan, cleanWindowsDevice) | Remote actions | verified | m3-mdres |
| 33 | retire, wipe, syncDevice need `DeviceManagementManagedDevices.PrivilegedOperations.All` (delegated and application); 204 No Content; wipe body parameters | Remote actions | verified | m3-retire, m3-wipe, m3-sync |
| 34 | Keep the privileged permission in a separate approved pipeline | Remote actions | design (labelled) | — |
| 35 | "Different APIs might have different default and maximum page sizes" | Paging | verified | m3-paging |
| 36 | managedDevices page size and `$top` maximum | Paging | not verified (not documented on the API page); labelled unverified | m3-mdlist |
| 37 | Intune limits: any request 2,000 per 20 s per tenant, 1,000 per app per tenant; writes 200 and 100; listed resources include deviceCompliancePolicy, deviceCompliancePolicyAssignment, deviceComplianceDeviceStatus, deviceConfiguration | Paging and limits | verified | m3-throttle |
| 38 | Whether the same Intune limit table lists managedDevice | — | not verified; the page doesn't claim it | — |
| 39 | Export jobs: beta and v1.0 endpoints; POST with reportName, filter, select, format (csv default, json), localizationType; poll by id until completed; download from url | Large exports | verified | m3-export |
| 40 | Export example URL is blob storage with a signed query string; "Don't build automation around default columns" | Large exports | verified | m3-export |
| 41 | Export API throttle: 100 per tenant per minute; 48 per app; 8 per user | Large exports | verified | m3-export |
| 42 | Devices and DevicesWithInventory don't honour localizationType | Large exports | verified | m3-export |
| 43 | Create deviceManagementExportJob least-privileged application permission is `DeviceManagementConfiguration.ReadWrite.All`; no read permission listed; url "Temporary location"; expirationDateTime | APIs table; large exports | verified | m3-exportcreate |
| 44 | Report names DeviceNonCompliance, DevicesWithoutCompliancePolicy (and V3), Devices, DevicesWithInventory, TpmAttestationStatus, AutopilotV1DeploymentStatus | Large exports | verified | m3-reportnames |
| 45 | Don't send the Graph token to the download host; graphkit refuses other hosts | Large exports | design (labelled); graphkit behaviour is tested in the existing suite | — |
| 46 | GCC is the same Intune instance as commercial; no separate GCC instance | US Government clouds | verified (quote) | m3-govsvc |
| 47 | GCC uses `https://graph.microsoft.com`; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us` | US Government clouds | verified | m3-deploy |
| 48 | Government instance shared by GCC High and DoD; moving needs unenroll and re-enroll | US Government clouds | verified | m3-govsvc |
| 49 | Not available, no plans: Windows Autopilot, Remediations, feature update reports, app and driver compatibility reports, ServiceNow connector, Windows Subscription Activation | US Government clouds | verified (full page fetched; an older search snippet differed and wasn't used) | m3-govsvc |
| 50 | Planned: Autopatch and feature, quality, expedite and driver updates; DHA; BIOS and DFCI; some device preparation features | US Government clouds | verified | m3-govsvc |
| 51 | Available: standard MDM, Log Analytics, Defender security settings management, EPM and other add-ons; Cloud PKI and Remote Help GCC High only | US Government clouds | verified | m3-govsvc |
| 52 | Graph Autopilot page lists L4/L5 while the service description lists Autopilot unavailable; the service description governs | US Government clouds | verified (both sources); conclusion is inference (labelled) | m3-aplist, m3-govsvc |
| 53 | Windows Update for Business reports don't meet GCC requirements | US Government clouds | verified in Book 05 Ch 10 (linked, not re-checked) | Book 05 Ch 10 |
| 54 | ScubaGear has no Intune baseline (folder lists aad, exo, powerbi, powerplatform, removedpolicies, securitysuite, sharepoint, teams) | The five checks | verified | m3-scubalist |
| 55 | MS.AAD.3.7v1 "Managed devices SHOULD be required for authentication"; rationale quotes M-22-09 "at least one device-level signal" | The five checks | verified | m3-scuba |
| 56 | AC-19(5), CM-2, CM-6, CM-8, CM-8(1), SC-28, SC-28(1), SI-2 are in the Moderate baseline; titles | The five checks | verified (OSCAL 5.2.0) | m3-nistmod |
| 57 | The check-to-control mapping | The five checks | design (the program's mapping, labelled as such) | — |
| 58 | Book 05 CP-001 floor 10.0.26100; compliance validity 14 days; cleanup 90 days | The five checks; code defaults | verified (Book 05 Ch 08 and Ch 10 in the repository) | internal |
| 59 | VK-INT-01 to VK-INT-06 scope; VK-INT-04 reads the Settings Catalog only with `-IncludeBeta` | Intro; v1.0 versus beta | verified (validation kit README and catalog in the repository) | internal |
| 60 | Book 05 naming builds Autopilot names from the serial number | The five checks | verified (Book 05 Ch 04); "duplicates rare" is inference (labelled) | internal |
| 61 | isEncrypted doesn't say method or volumes; BitLocker measured at boot via DHA | The five checks | inference (labelled); the DHA statement is Book 05 Ch 08's | m3-mdres, internal |
| 62 | A sync date before 1971 is a placeholder | The five checks; code | design (labelled); the placeholder isn't documented | — |
| 63 | 100 policies cost about 201 requests | Paging and limits | arithmetic from the code (1 + 2 per policy) | — |

## What couldn't be verified

- The permission for reading `deviceManagement` settings (claim 31).
- How `deviceComplianceDeviceStatus.id` relates to the managed device (claim 28).
- The `managedDevices` page size and `$top` maximum (claim 36).
- Whether v1.0 responses use `exclusionGroupAssignmentTarget` (claim 14), and whether `$select` is honoured for every selected property (claim 26). Both are for a test-tenant run.
- None of the five checks has been run against a live tenant.

## Not carried

- Pages for `managedDeviceEncryptionState` and the device encryption report weren't read, so the page names the `TpmAttestationStatus` export only by its report name.
- No DISA STIG content is used. The Intune government page's STIG link isn't cited.
