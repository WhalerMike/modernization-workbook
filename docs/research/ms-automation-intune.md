---
title: "Microsoft Automation, Module 3: Intune through Microsoft Graph"
subtitle: "An implementation guide: the Graph APIs, least-privileged permissions and v1.0-versus-beta status behind managed devices, compliance, configuration, assignment filters, Autopilot, apps and remote actions, with five tested read-only checks mapped to NIST SP 800-53 Moderate, ScubaGear and M-22-09"
description: "Research draft: how to read and evidence Microsoft Intune through Microsoft Graph for Book 05. It covers managed devices, compliance policies and per-device compliance status, configuration profiles and the beta-only Settings Catalog, assignment filters, Windows Autopilot device identities and profiles, apps, remote actions and their privileged permission, which endpoints are beta-only, Intune's throttling limits and the reports export-jobs API, what differs in US Government clouds, and five read-only checks in Python and PowerShell that complement the validation kit's VK-INT checks."
research-status: draft
research-type: implementation guide
research-book: "Book 05"
date-modified: 2026-10-30
last-reviewed: 2026-10-30
---

# Microsoft Automation, Module 3: Intune through Microsoft Graph {.unnumbered}

[Book 05](../books/b05-devices/index.md) moves the fleet from Group Policy to Intune and then has to prove, continuously, what each device is. Its [Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md) asks for evidence a script can collect: which devices are failing which compliance policy, which devices no policy reaches, which have stopped checking in, which aren't encrypted or are below the OS floor, and which Autopilot registrations won't get a profile. This module maps each of those questions to the Graph API that answers it, the least-privileged permission, and whether the API is in v1.0 or only in beta. Five of them are built as tested, read-only checks.

It assumes [Module 1](ms-automation-foundations.md): the right cloud's endpoints, app-only sign-in without a secret, paging, throttling and batching. [Module 2](ms-automation-entra.md) covers the Entra ID side, including the Conditional Access policies that consume device compliance.

**The example code:** [examples/ms-automation on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation). Equivalent Python (`intune_tasks.py`) and PowerShell (`FmwGraph.psm1`) implement the five checks under [The five checks](#the-five-checks). They're **illustrative: unit-tested against fixtures, not proven against live tenants**.

**How this relates to the validation kit.** The [validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) already has six Intune-track checks, VK-INT-01 to VK-INT-06:

- missing provisioning-written extension attributes (VK-INT-01);
- stale and duplicate devices, from the Entra ID device object (VK-INT-02);
- Autopilot group tags (VK-INT-03);
- assignment through dynamic groups versus filters (VK-INT-04);
- conflict candidates (VK-INT-05);
- platform inventory against the coverage matrix (VK-INT-06).

This module doesn't repeat them. Its checks read Intune's own records instead: compliance status per policy, compliance coverage, the Intune sync time, encryption and OS posture, and Autopilot profile assignment.

## The APIs at a glance

Every Intune API in Graph needs an active Intune license for the tenant.[^m3-mdlist] The permission is the least-privileged *application* permission the API's reference page lists. Each page's national cloud table lists the API in the global service (which GCC uses) and in US Government L4 and L5.[^m3-cloudtables] The Stage column says whether the API is in v1.0 or only in beta. The Book column is where the workbook uses it.

| Question | Graph API | Least-privileged application permission | Stage | Book |
|---|---|---|---|---|
| Which devices are enrolled, with what OS, compliance state, encryption and last sync? | `GET /deviceManagement/managedDevices` | `DeviceManagementManagedDevices.Read.All`[^m3-mdlist] | v1.0 | B05 Ch 10 |
| Which compliance policies exist? | `GET /deviceManagement/deviceCompliancePolicies` | `DeviceManagementConfiguration.Read.All`[^m3-cplist] | v1.0 | B05 Ch 08 |
| Whom is a compliance policy assigned to? | `GET .../deviceCompliancePolicies/{id}/assignments` | `DeviceManagementConfiguration.Read.All`[^m3-cpassign] | v1.0 | B05 Ch 08 |
| What does a compliance policy report for each device? | `GET .../deviceCompliancePolicies/{id}/deviceStatuses` | `DeviceManagementConfiguration.Read.All`[^m3-cpstatus] | v1.0 | B05 Ch 10 |
| Which configuration profiles exist (templates)? | `GET /deviceManagement/deviceConfigurations` | `DeviceManagementConfiguration.Read.All`[^m3-dclist] | v1.0 | B05 Ch 08 |
| Which Settings Catalog and endpoint security policies exist? | `GET /deviceManagement/configurationPolicies` | `DeviceManagementConfiguration.Read.All`[^m3-sclist] | **beta only** | B05 Ch 08 |
| Which assignment filters exist? | `GET /deviceManagement/assignmentFilters` | `DeviceManagementConfiguration.Read.All`[^m3-filters] | **beta only** | B05 Ch 08 |
| Which devices are registered in Windows Autopilot? | `GET /deviceManagement/windowsAutopilotDeviceIdentities` | `DeviceManagementServiceConfig.Read.All`[^m3-aplist] | v1.0 | B05 Ch 04 |
| Has each registration been given a deployment profile? | The same, with `deploymentProfileAssignmentStatus` | `DeviceManagementServiceConfig.Read.All`[^m3-apbeta] | **beta only** | B05 Ch 04 |
| Which Autopilot deployment profiles exist? | `GET /deviceManagement/windowsAutopilotDeploymentProfiles` | `DeviceManagementServiceConfig.Read.All`[^m3-approfiles] | **beta only** | B05 Ch 04 |
| Which apps does Intune deploy? | `GET /deviceAppManagement/mobileApps` | `DeviceManagementConfiguration.Read.All` (or `DeviceManagementApps.Read.All`)[^m3-apps] | v1.0 | B05 Ch 08 |
| Export a large report | `POST /deviceManagement/reports/exportJobs` | `DeviceManagementConfiguration.ReadWrite.All` (a write permission)[^m3-exportcreate] | v1.0 and beta | B05 Ch 10 |
| Sync, retire or wipe a device | `POST .../managedDevices/{id}/syncDevice`, `/retire`, `/wipe` | `DeviceManagementManagedDevices.PrivilegedOperations.All`[^m3-sync][^m3-retire][^m3-wipe] | v1.0 | B05 Ch 10 |

The last two rows aren't read-only, and the example code doesn't use them. Both are explained below.

## v1.0 versus beta

Microsoft supports the Intune beta APIs but says they "are subject to more frequent change", and recommends v1.0 where it can be used.[^m3-sclist] Three things the program relies on are beta-only today:

- **The Settings Catalog** (`configurationPolicies`). Book 05's [policy library](../books/b05-devices/08-gpo-to-intune-policy-migration.md#configuration-profiles-settings-catalog) is mostly Settings Catalog profiles, so exporting the library as code (CM-2) depends on beta. The resource also carries endpoint security policies: its `templateReference.templateFamily` can be, for example, `endpointSecurityAntivirus`.[^m3-sclist]
- **Assignment filters.** The filter list is beta-only.[^m3-filters] So is the filter on an assignment: beta documents `deviceAndAppManagementAssignmentFilterId` and `deviceAndAppManagementAssignmentFilterType` (`none`, `include` or `exclude`) on the assignment target.[^m3-exclbeta] The v1.0 base target type documents no properties,[^m3-targetv1] so v1.0 can't tell you which filter an assignment uses. This is why VK-INT-04 reads the Settings Catalog only with `-IncludeBeta`.
- **Autopilot profiles.** v1.0 lists Autopilot device identities with their group tag, enrollment state and last contact. It doesn't have `deploymentProfileAssignmentStatus` or the deployment profiles themselves; both are beta.[^m3-apv1][^m3-apbeta][^m3-approfiles]

The example code calls v1.0 for everything except the Autopilot profile check, which reads the beta endpoint on the same Graph host. A beta-dependent check should be re-run after each Graph beta change, before its result is used as evidence *(design guidance)*.

## Managed devices

`managedDevice` is Intune's record of an enrolled device. The properties the checks read are:[^m3-mdres]

- `complianceState`: one of `unknown`, `compliant`, `noncompliant`, `conflict`, `error`, `inGracePeriod` or `configManager`. It supports `$filter` with `eq` and `or`.
- `lastSyncDateTime`: the last successful sync with Intune. It supports `$filter` with `lt` and `gt`.
- `complianceGracePeriodExpirationDateTime`: when the device's grace period ends.
- `operatingSystem`, `osVersion` and `isEncrypted` ("Device encryption status").
- `managedDeviceOwnerType`: `unknown`, `company` or `personal`.
- `azureADDeviceId`: the Entra device ID, which is the join key to the Entra device object ([Book 05, Chapter 03](../books/b05-devices/03-where-device-and-server-data-lives.md#how-the-records-correlate)).

The same resource also returns `userPrincipalName`, `emailAddress`, `userDisplayName` and `phoneNumber`.[^m3-mdres] The checks name the properties they need in `$select` and leave those out, so a check's output never carries a person's name or address *(design guidance)*.

Some properties, such as `ethernetMacAddress`, `physicalMemoryInBytes`, `iccid` and `udid`, return a default value when the device is listed. Their real values come only from a GET of one device that names them in `$select`.[^m3-mdres] A script that reads them from the list sees blanks or zeros that look like data.

## Compliance policies and compliance status

A compliance policy's `assignments` list its targets. In v1.0 a group target is `groupAssignmentTarget` with a `groupId`.[^m3-grouptarget] Beta documents `exclusionGroupAssignmentTarget`, a group excluded from the assignment.[^m3-exclbeta] A policy with no assignments, or with only exclusions, applies to no device.

`deviceStatuses` gives one row per device for a policy. Its `status` is one of `unknown`, `notApplicable`, `compliant`, `remediated`, `nonCompliant`, `error`, `conflict` or `notAssigned`. Each row carries `deviceDisplayName`, `deviceModel`, `lastReportedDateTime` and `complianceGracePeriodExpirationDateTime`, as well as `userName` and `userPrincipalName`.[^m3-cpstatusres] The resource doesn't document a managed-device ID. Its `id` is described only as "Key of the entity". So the checks join a status row to a managed device on the device name, and flag names used by more than one device *(inference: the key's relationship to the managed device isn't documented)*.

Two tenant-wide settings sit above every policy ([Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#tenant-wide-compliance-settings)). By default, Intune marks a device with no compliance policy assigned as *Compliant*. Microsoft recommends changing that setting to *Not compliant*, and recommends that every device be targeted by a compliance policy.[^m3-reports] In Graph the two settings are `deviceManagementSettings.secureByDefault` (the device is noncompliant when no policy targets it) and `deviceComplianceCheckinThresholdDays` (how many days a device may go without checking in and remain compliant).[^m3-dmsettings] The permission for reading them, through the `deviceManagement` singleton, wasn't confirmed on Learn on October 30, 2026, so the checks don't read them.

## Configuration profiles and the Settings Catalog

Template-based profiles are `deviceConfigurations`, in v1.0, read with `DeviceManagementConfiguration.Read.All`.[^m3-dclist] Settings Catalog and endpoint security policies are `configurationPolicies`, in beta. They're read with `DeviceManagementConfiguration.Read.All`, and the page also lists `DeviceManagementEndpointSecurity.Read.All`.[^m3-sclist] A complete export of the policy library, for CM-2, needs both lists, so it depends on beta *(inference)*. Per-setting conflict detection is VK-INT-05's job, and the conflict rules are in [Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#configuration-status-and-conflicts).

## Assignment filters

Filters let a policy reach part of a group by device properties, without changing group membership. Book 05 uses them for time-sensitive assignment ([Chapter 08](../books/b05-devices/08-gpo-to-intune-policy-migration.md#assignment-filter-examples)), and VK-INT-04 checks the design. The filter list (`/deviceManagement/assignmentFilters`, `DeviceManagementConfiguration.Read.All`) is **beta**. Each filter has a `platform`, a `rule` and `payloads` that say which policies and groups use it.[^m3-filters]

## Windows Autopilot

`windowsAutopilotDeviceIdentities` is the registration record: serial number, group tag, purchase order, enrollment state, last contact and the managed device ID. It's in v1.0 and needs `DeviceManagementServiceConfig.Read.All`.[^m3-aplist][^m3-apv1] The v1.0 resource has no profile assignment status. Beta adds:[^m3-apbeta]

- `deploymentProfileAssignmentStatus`: `unknown`, `assignedInSync`, `assignedOutOfSync`, `assignedUnkownSyncState` (Microsoft's spelling), `notAssigned`, `pending` or `failed`;
- `deploymentProfileAssignmentDetailedStatus`, such as `hardwareRequirementsNotMet`;
- the `deploymentProfile` and `intendedDeploymentProfile` relationships.

The deployment profiles themselves (`windowsAutopilotDeploymentProfiles`) are listed only in beta, with the same permission.[^m3-approfiles] Both resources also return `userPrincipalName` and `addressableUserName`,[^m3-apbeta] so the check leaves them out of `$select`. Group tags, and the vocabulary they draw on, are VK-INT-03's job ([Book 05, Chapter 04](../books/b05-devices/04-intune-first-onboarding.md#registration-and-group-tags)).

## Apps

`GET /deviceAppManagement/mobileApps` lists the apps Intune manages, with `publishingState` among their properties. The page lists `DeviceManagementConfiguration.Read.All` first, then `DeviceManagementApps.Read.All`, as read permissions.[^m3-apps] A script that reads only apps should still ask for `DeviceManagementApps.Read.All`. It's the permission named for apps, and it doesn't also grant configuration reads *(design guidance)*. None of the five checks reads apps.

## Remote actions

Graph exposes Intune's device actions on `managedDevice`, including `retire`, `wipe`, `syncDevice`, `remoteLock`, `rebootNow`, `shutDown`, `locateDevice`, `windowsDefenderScan` and `cleanWindowsDevice`.[^m3-mdres] The ones checked for this page all need **`DeviceManagementManagedDevices.PrivilegedOperations.All`**, delegated or application. Each returns `204 No Content`:

- `retire`;[^m3-retire]
- `wipe`, whose body sets `keepEnrollmentData`, `keepUserData` and the macOS options;[^m3-wipe]
- `syncDevice`, even though a sync changes nothing on the device.[^m3-sync]

That makes the permission an operator's permission, not a reader's. A collector that holds it could wipe the fleet. The example code never asks for it. Keep it in a separate pipeline with its own approval step and Book 05's retirement order ([Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#retirement-and-wipe)): keys exported first, and the tenant's daily retire and delete limits planned for *(design guidance)*.

## Paging, limits and large exports

**Paging.** Follow `@odata.nextLink` until it stops, as in Module 1. Microsoft notes that "different APIs might have different default and maximum page sizes".[^m3-paging] The `managedDevices` page doesn't state its page size or a `$top` maximum.[^m3-mdlist] The example code doesn't set `$top`, and doesn't assume a page size *(unverified: Intune's page size for `managedDevices`)*.

**Throttling.** Intune has its own limits in Graph. For the compliance and configuration resources, including `deviceCompliancePolicy`, its assignments, `deviceComplianceDeviceStatus` and `deviceConfiguration`, the limits are:[^m3-throttle]

- any request: 2,000 per 20 seconds per tenant across all apps, and 1,000 per 20 seconds per app per tenant;
- writes (`POST`, `PUT`, `PATCH` and `DELETE`): 200 per 20 seconds per tenant, and 100 per app.

The coverage and noncompliance checks make one request for the policy list and two for each policy, so 100 policies cost about 201 requests. That's well under the limit. The Retry-After handling from Module 1 covers the rest.

**Reports export jobs.** For data sets too large to page comfortably, Intune exports its reports through `deviceManagement/reports/exportJobs`. The export page lists both the beta and the v1.0 endpoint.[^m3-export] The flow:

1. `POST` a job with a `reportName`, an optional `filter`, the `select` columns and `format` (`csv` by default, or `json`).
2. Poll the job by its `id` until `status` is `completed`.
3. Download the compressed file from the `url` the job returns. It's a temporary location, and `expirationDateTime` says when it ends.[^m3-export][^m3-exportcreate]

Three cautions:

- **Creating a job needs a write permission.** The v1.0 page lists `DeviceManagementConfiguration.ReadWrite.All` as the least privileged, then `DeviceManagementApps.ReadWrite.All` and `DeviceManagementManagedDevices.ReadWrite.All`. It lists no read-only permission.[^m3-exportcreate] A read-only collector can't start an export job, which is why the example checks page through the list APIs instead.
- **The download isn't on the Graph host.** Microsoft's example URL is a blob storage address with a signed query string.[^m3-export] Fetch it without the Graph token. `graphkit.py` refuses to send its token to any host but the cloud's Graph host, so it can't download the file *(design guidance)*.
- **Name the columns.** Microsoft says not to build automation on a report's default columns, and to select columns explicitly. The export API takes up to 100 requests per tenant per minute: 48 per app, and 8 per user.[^m3-export]

The report names include:[^m3-reportnames]

- `DeviceNonCompliance` and `DevicesWithoutCompliancePolicy` (with V3 variants);
- `Devices` and `DevicesWithInventory`;
- `TpmAttestationStatus`, under the device encryption status report;
- `AutopilotV1DeploymentStatus`.

The `Devices` and `DevicesWithInventory` exports ignore the `localizationType` parameter.[^m3-export]

## What differs in US Government clouds

**GCC.** Intune has no separate GCC instance. "GCC is the same instance as Microsoft Intune in the commercial space," and Intune's government feature table doesn't apply to GCC.[^m3-govsvc] GCC uses the worldwide Graph endpoint, `https://graph.microsoft.com`, as Module 1 sets out.[^m3-deploy] The Intune feature gaps a GCC tenant does have are Book 05's subject ([Chapter 10, GCC (Moderate) boundary facts](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#gcc-moderate-boundary-facts)). For example, Windows Update for Business reports don't meet GCC requirements.

**GCC High and DoD (High only).** These tenants use their own Graph hosts, `https://graph.microsoft.us` and `https://dod-graph.microsoft.us`.[^m3-deploy] Intune runs a separate government instance shared by GCC High and DoD tenants, and moving between the commercial and government instances means unenrolling and re-enrolling every device.[^m3-govsvc] Microsoft's service description, read on October 30, 2026, lists these differences that affect the APIs on this page:[^m3-govsvc]

- **Not available, with no plans to add them:**
  - Windows Autopilot;
  - Remediations;
  - reports for feature update policies;
  - app and driver compatibility reports;
  - the ServiceNow connector;
  - Windows Subscription Activation.
- **Not available yet, with planning started:**
  - Windows Autopatch and feature, quality, expedite and driver updates;
  - Windows Device Health Attestation;
  - BIOS configuration and DFCI;
  - some Windows Autopilot device preparation features.
- **Available:**
  - standard MDM features (compliance, configuration profiles and app policies);
  - Log Analytics export;
  - Defender for Endpoint security settings management;
  - Endpoint Privilege Management and some other add-ons.
  - Cloud PKI and Remote Help are listed for GCC High only, not DoD.

One discrepancy to note. The Graph reference pages for Autopilot device identities list the API as available in US Government L4 and L5,[^m3-aplist] while the service description lists Windows Autopilot as not available in GCC High and DoD.[^m3-govsvc] The service description decides whether the feature can be used. That an endpoint answers doesn't mean the feature is supported *(inference)*. The `autopilot-profiles` check is therefore for GCC and commercial tenants.

## The five checks

Each check is read-only, and each is tied to the federal requirement it evidences. The mapping is the program's reading; the agency's assessor decides whether a control is satisfied ([Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads)). Every control named below is in the NIST SP 800-53 Rev. 5 Moderate baseline.[^m3-nistmod] ScubaGear has no Intune baseline. Its baselines cover Entra ID, Exchange Online, Power BI, Power Platform, SharePoint, the security suite and Teams.[^m3-scubalist] The ScubaGear tie is through Entra ID: MS.AAD.3.7v1, "Managed devices SHOULD be required for authentication", rests on M-22-09's requirement that agencies "consider at least one device-level signal" when authorizing users.[^m3-scuba] Intune compliance is that signal. The M-22-09 mapping is [Book 11, Appendix A](../books/b11-zero-trust/appendix-a-requirements-mapping.md#omb-m-22-09-objectives-and-actions).

| Check | What it reports | Evidences | Complements |
|---|---|---|---|
| `noncompliant-devices` | Devices in `noncompliant`, `inGracePeriod`, `error` or `conflict`, each with the policies reporting `nonCompliant`, `error` or `conflict`, and the grace-period end | CM-6; M-22-09's device-level signal; supports ScubaGear MS.AAD.3.7v1 | Book 05's [compliance status review](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#reading-compliance-status) |
| `compliance-coverage` | Compliance policies with no assignment or only exclusions; managed devices that no policy reports on | CM-2, CM-6; supports MS.AAD.3.7v1, because by default an unassigned device counts as compliant | VK-INT-04 (assignment design) |
| `stale-checkin` | Devices whose last Intune sync is older than the compliance validity period (default 14 days) or the cleanup age (default 90), and devices with no sync | CM-8; M-22-09's device inventory | VK-INT-02, which reads the Entra device's sign-in instead |
| `device-posture` | Windows and macOS devices not reporting encryption, and devices below the OS floor for their platform (default Windows 10.0.26100, Book 05's [CP-001 floor](../books/b05-devices/08-gpo-to-intune-policy-migration.md#cp-001-windows-workstation-baseline)) | SC-28(1) and AC-19(5) for encryption; SI-2 and CM-6 for the OS floor | VK-INT-06 (platform inventory) |
| `autopilot-profiles` **(beta)** | Autopilot registrations by profile assignment status; every one not `assignedInSync`, with the detailed status | CM-8(1); CM-2 (devices provisioned to the baseline) | VK-INT-03 (group tags) |

The permissions for all five together are `DeviceManagementManagedDevices.Read.All`, `DeviceManagementConfiguration.Read.All` and `DeviceManagementServiceConfig.Read.All`. That's a reader's set: none of them can change a device or a policy. Grant only the ones for the checks you run. `autopilot-profiles` is the only one that needs `DeviceManagementServiceConfig.Read.All`, and the only one on beta.

Some notes on what the checks can and can't say:

- **Joined on device name.** Compliance status rows carry a device name, not a documented managed-device ID, so both compliance checks join on the name. They flag names held by more than one device, because a finding on one of those may belong to the other. [Book 05's naming convention](../books/b05-devices/04-intune-first-onboarding.md#naming) builds Autopilot names from the serial number, which makes duplicates rare on that path *(inference)*.
- **`isEncrypted` is what Intune reports.** It doesn't say which method or which volumes. BitLocker's own state is a compliance setting measured at boot through Device Health Attestation ([Book 05, Chapter 08](../books/b05-devices/08-gpo-to-intune-policy-migration.md#compliance-policies)). Treat `notEncrypted` as a lead to confirm in the encryption report, not as proof *(inference)*.
- **Personal iOS and Android devices** aren't held to the encryption rule by default. The platforms are a parameter.
- **A placeholder date counts as no sync.** A `lastSyncDateTime` before 1971 is treated as no sync. That guards against a default date, which wasn't confirmed in Microsoft's documentation *(design guidance)*.

## Status and review

**Draft.** Every API, permission, property, limit and cloud difference was checked against Microsoft Learn on October 30, 2026. The ScubaGear baseline and the NIST SP 800-53 Moderate baseline were checked the same day. Inferences, design guidance and unverified points are labeled, and the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/research/_verification/ms-automation-intune.md) lists each claim with its source. The checks are tested against fixtures only.

To move this page to **In review**:
- a reviewer confirms the permissions table and the beta list;
- someone confirms that `deviceComplianceDeviceStatus.id` can't be joined to the managed device ID;
- someone confirms the permission for reading `deviceManagement/settings`.

To move it to **Proved**: run the five checks against a test tenant and compare the results with the Intune admin center's compliance, device and Autopilot views. Record that comparison here. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 1: Foundations](ms-automation-foundations.md), [Module 2: Microsoft Entra ID](ms-automation-entra.md), the [Microsoft practice crosswalk](graph-practice-crosswalk.md), [Book 05 — Devices](../books/b05-devices/index.md) and the [Intune track implementation guide](../books/guides/intune-track-implementation.md#gate-6-operating-it).

[^m3-cloudtables]: The national cloud deployment table on each API's Microsoft Graph reference page, cited for each API below, accessed October 30, 2026.
[^m3-mdlist]: Microsoft Learn, "List managedDevices" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-devices-manageddevice-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-mdres]: Microsoft Learn, "managedDevice resource type" (v1.0), <https://learn.microsoft.com/en-us/graph/api/resources/intune-devices-manageddevice?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-cplist]: Microsoft Learn, "List deviceCompliancePolicies" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-deviceconfig-devicecompliancepolicy-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-cpassign]: Microsoft Learn, "List deviceCompliancePolicyAssignments" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-deviceconfig-devicecompliancepolicyassignment-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-cpstatus]: Microsoft Learn, "List deviceComplianceDeviceStatuses" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-deviceconfig-devicecompliancedevicestatus-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-cpstatusres]: Microsoft Learn, "deviceComplianceDeviceStatus resource type" (v1.0), <https://learn.microsoft.com/en-us/graph/api/resources/intune-deviceconfig-devicecompliancedevicestatus?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-grouptarget]: Microsoft Learn, "groupAssignmentTarget resource type" (v1.0), <https://learn.microsoft.com/en-us/graph/api/resources/intune-shared-groupassignmenttarget?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-targetv1]: Microsoft Learn, "deviceAndAppManagementAssignmentTarget resource type" (v1.0; "Properties: None"), <https://learn.microsoft.com/en-us/graph/api/resources/intune-shared-deviceandappmanagementassignmenttarget?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-exclbeta]: Microsoft Learn, "exclusionGroupAssignmentTarget resource type" (beta), <https://learn.microsoft.com/en-us/graph/api/resources/intune-deviceconfig-exclusiongroupassignmenttarget?view=graph-rest-beta>, accessed October 30, 2026.
[^m3-dmsettings]: Microsoft Learn, "deviceManagementSettings resource type" (v1.0), <https://learn.microsoft.com/en-us/graph/api/resources/intune-deviceconfig-devicemanagementsettings?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-dclist]: Microsoft Learn, "List deviceConfigurations" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-deviceconfig-deviceconfiguration-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-sclist]: Microsoft Learn, "List deviceManagementConfigurationPolicies" (beta), <https://learn.microsoft.com/en-us/graph/api/intune-deviceconfigv2-devicemanagementconfigurationpolicy-list?view=graph-rest-beta>, accessed October 30, 2026.
[^m3-filters]: Microsoft Learn, "List deviceAndAppManagementAssignmentFilters" (beta; the v1.0 selector returns the beta page), <https://learn.microsoft.com/en-us/graph/api/intune-policyset-deviceandappmanagementassignmentfilter-list?view=graph-rest-beta>, accessed October 30, 2026.
[^m3-aplist]: Microsoft Learn, "List windowsAutopilotDeviceIdentities" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-enrollment-windowsautopilotdeviceidentity-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-apv1]: Microsoft Learn, "windowsAutopilotDeviceIdentity resource type" (v1.0), <https://learn.microsoft.com/en-us/graph/api/resources/intune-enrollment-windowsautopilotdeviceidentity?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-apbeta]: Microsoft Learn, "windowsAutopilotDeviceIdentity resource type" (beta), <https://learn.microsoft.com/en-us/graph/api/resources/intune-enrollment-windowsautopilotdeviceidentity?view=graph-rest-beta>, accessed October 30, 2026.
[^m3-approfiles]: Microsoft Learn, "List azureADWindowsAutopilotDeploymentProfiles" (beta), <https://learn.microsoft.com/en-us/graph/api/intune-enrollment-azureadwindowsautopilotdeploymentprofile-list?view=graph-rest-beta>, accessed October 30, 2026.
[^m3-apps]: Microsoft Learn, "List mobileApps" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-apps-mobileapp-list?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-retire]: Microsoft Learn, "retire action" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-devices-manageddevice-retire?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-wipe]: Microsoft Learn, "wipe action" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-devices-manageddevice-wipe?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-sync]: Microsoft Learn, "syncDevice action" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-devices-manageddevice-syncdevice?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-paging]: Microsoft Learn, "Paging Microsoft Graph data in your app", <https://learn.microsoft.com/en-us/graph/paging>, accessed October 30, 2026.
[^m3-throttle]: Microsoft Learn, "Microsoft Graph service-specific throttling limits", section "Intune service limits", <https://learn.microsoft.com/en-us/graph/throttling-limits#intune-service-limits>, accessed October 30, 2026.
[^m3-export]: Microsoft Learn, "Export Intune reports using Graph APIs", <https://learn.microsoft.com/en-us/intune/intune-service/fundamentals/reports-export-graph-apis>, accessed October 30, 2026.
[^m3-exportcreate]: Microsoft Learn, "Create deviceManagementExportJob" (v1.0), <https://learn.microsoft.com/en-us/graph/api/intune-reporting-devicemanagementexportjob-create?view=graph-rest-1.0>, accessed October 30, 2026.
[^m3-reportnames]: Microsoft Learn, "Intune reports and properties available using Graph API", <https://learn.microsoft.com/en-us/intune/device-management/reports/ref-graph-available-reports>, accessed October 30, 2026.
[^m3-reports]: Microsoft Learn, "Intune reports", section "Devices without compliance policy (Organizational)", <https://learn.microsoft.com/en-us/intune/device-management/reports/overview#device-compliance-reports>, accessed October 30, 2026.
[^m3-govsvc]: Microsoft Learn, "Microsoft Intune for US Government GCC High and DoD service description", <https://learn.microsoft.com/en-us/intune/fundamentals/government-service>, accessed October 30, 2026.
[^m3-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments", <https://learn.microsoft.com/en-us/graph/deployments>, accessed October 30, 2026.
[^m3-nistmod]: NIST, SP 800-53 Rev. 5 Moderate baseline, OSCAL profile version 5.2.0 (includes AC-19(5), CM-2, CM-6, CM-8, CM-8(1), SC-28, SC-28(1) and SI-2), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json>, accessed October 30, 2026.
[^m3-scubalist]: CISA, ScubaGear baselines folder (`aad.md`, `exo.md`, `powerbi.md`, `powerplatform.md`, `securitysuite.md`, `sharepoint.md`, `teams.md`, plus `removedpolicies.md`), <https://github.com/cisagov/ScubaGear/tree/main/PowerShell/ScubaGear/baselines>, accessed October 30, 2026.
[^m3-scuba]: CISA, ScubaGear Microsoft Entra ID baseline (`aad.md`), policies MS.AAD.3.7v1 and 3.8v1 and the M-22-09 quotation in their rationale, <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md>, accessed October 30, 2026.
