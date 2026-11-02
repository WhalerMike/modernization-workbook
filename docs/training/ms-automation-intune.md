---
title: "Microsoft Automation, Module 3: Intune through Microsoft Graph"
subtitle: "Learn the Graph APIs, least-privileged permissions and v1.0-versus-beta status behind managed devices, compliance, configuration, assignment filters, Autopilot, apps and remote actions, then run five read-only checks mapped to NIST SP 800-53 Moderate, ScubaGear and M-22-09 on fixtures and in your test tenant"
description: "Research draft: Module 3 of the Microsoft Automation learning path, for Book 05. You learn managed devices, compliance policies and per-device compliance status, configuration profiles and the beta-only Settings Catalog, assignment filters, Windows Autopilot device identities and profiles, apps, remote actions and their privileged permission, which endpoints are beta-only, Intune's throttling limits and the reports export-jobs API, and what differs in US Government clouds. Lab 1 runs five read-only checks, which complement the validation kit's VK-INT checks, in Python and PowerShell against fixtures; Lab 2 runs them read-only against your test tenant."
research-status: draft
research-type: training module
research-book: "Book 05"
series-order: 3
date-modified: 2026-11-01
last-reviewed: 2026-11-01
aliases:
  - /docs/research/ms-automation-intune.html
---

# Microsoft Automation, Module 3: Intune through Microsoft Graph {.unnumbered}

**Learning path:** [Microsoft Automation](index.md#microsoft-automation-learning-path) · Module 3 of 3 · 85 minutes · Code: [examples/ms-automation](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation) (`intune_tasks.py`, `FmwGraph.psm1`) · Guide: [Intune track, Gate 6](../books/guides/intune-track-implementation.md#gate-6-operating-it)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.1/Training_MS_Automation_Module_3.pptx) · [Narrated deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.1/Training_MS_Automation_Module_3_Narrated.pptx) (about 14 minutes, captions) · [▶ Watch](../presentations/watch.html?v=Training_MS_Automation_Module_3_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_MS_Automation_Module_3_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-3/Training_MS_Automation_Module_3_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-3/Training_MS_Automation_Module_3_Narrated.vtt).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

[Book 05](../books/b05-devices/index.md) moves the fleet from Group Policy to Intune and then has to prove, continuously, what each device is. Its [Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md) asks for evidence a script can collect: which devices are failing which compliance policy, which devices no policy reaches, which have stopped checking in, which aren't encrypted or are below the OS floor, and which Autopilot registrations won't get a profile.

Your Conditional Access policies already require a compliant device. That's only as good as Intune's compliance records, and by default a device with no policy assigned counts as compliant. In this module you map each of Book 05's questions to the Graph API that answers it, the least-privileged permission, and whether the API is in v1.0 or only in beta. Five of them are built as tested, read-only checks, in Python and PowerShell, which you run in the labs. They're **illustrative: unit-tested against fixtures, not proven against live tenants**.

**How this relates to the validation kit.** The [validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) already has six Intune-track checks, VK-INT-01 to VK-INT-06:

- missing provisioning-written extension attributes (VK-INT-01);
- stale and duplicate devices, from the Entra ID device object (VK-INT-02);
- Autopilot group tags (VK-INT-03);
- assignment through dynamic groups versus filters (VK-INT-04);
- conflict candidates (VK-INT-05);
- platform inventory against the coverage matrix (VK-INT-06).

This module doesn't repeat them. Its checks read Intune's own records instead: compliance status per policy, compliance coverage, the Intune sync time, encryption and OS posture, and Autopilot profile assignment.

**The federal requirement.** Each check evidences NIST SP 800-53 Rev. 5 controls in the Moderate baseline: configuration settings and the baseline (CM-6, CM-2), the component inventory (CM-8, CM-8(1)), protection of information at rest and encryption on mobile devices (SC-28(1), AC-19(5)), and flaw remediation for the OS floor (SI-2). Through Entra ID, compliance is the device-level signal that OMB M-22-09 asks agencies to consider, and that ScubaGear MS.AAD.3.7v1 relies on. [Unit 7](#the-five-checks) maps each check to its controls. Don't restate the requirements: the M-22-09 mapping is [Book 11, Appendix A](../books/b11-zero-trust/appendix-a-requirements-mapping.md#omb-m-22-09-objectives-and-actions), and what an assessor reads is [Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads).

### Learning objectives

In this module, you'll:

- Name the Graph API, least-privileged application permission and stage (v1.0 or beta) for each of Book 05's evidence questions.
- Explain which three things the program relies on are beta-only, and what that means for evidence.
- Read managed devices and per-policy compliance status, and the traps in each, including the join on device name.
- Explain why remote actions and report export jobs don't belong in a read-only collector.
- Say what differs in GCC High and DoD, why Windows Autopilot is a GCC and commercial check, and why GCC follows commercial Intune.
- Run the five checks on fixtures in Python and PowerShell, and read each finding against its control.

### Prerequisites

- [Module 1](ms-automation-foundations.md): the right cloud's endpoints, app-only sign-in without a secret, paging, throttling and batching. [Module 2](ms-automation-entra.md) covers the Entra ID side, including the Conditional Access policies that consume device compliance.
- For Lab 1: the [lab tools](index.md#what-you-need-for-the-microsoft-automation-labs). No tenant until Lab 2.

## Unit 2: The APIs, and v1.0 versus beta

*10 minutes*

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

The last two rows aren't read-only, and the example code doesn't use them. [Unit 5](#unit-5-remote-actions-limits-and-large-exports) explains both.

### v1.0 versus beta

Microsoft supports the Intune beta APIs but says they "are subject to more frequent change", and recommends v1.0 where it can be used.[^m3-sclist] Three things the program relies on are beta-only today:

- **The Settings Catalog** (`configurationPolicies`). Book 05's [policy library](../books/b05-devices/08-gpo-to-intune-policy-migration.md#configuration-profiles-settings-catalog) is mostly Settings Catalog profiles, so exporting the library as code (CM-2) depends on beta. The resource also carries endpoint security policies: its `templateReference.templateFamily` can be, for example, `endpointSecurityAntivirus`.[^m3-sclist]
- **Assignment filters.** The filter list is beta-only.[^m3-filters] So is the filter on an assignment: beta documents `deviceAndAppManagementAssignmentFilterId` and `deviceAndAppManagementAssignmentFilterType` (`none`, `include` or `exclude`) on the assignment target.[^m3-exclbeta] The v1.0 base target type documents no properties,[^m3-targetv1] so v1.0 can't tell you which filter an assignment uses. This is why VK-INT-04 reads the Settings Catalog only with `-IncludeBeta`.
- **Autopilot profiles.** v1.0 lists Autopilot device identities with their group tag, enrollment state and last contact. It doesn't have `deploymentProfileAssignmentStatus` or the deployment profiles themselves; both are beta.[^m3-apv1][^m3-apbeta][^m3-approfiles]

The example code calls v1.0 for everything except the Autopilot profile check, which reads the beta endpoint on the same Graph host. A beta-dependent check should be re-run after each Graph beta change, before its result is used as evidence *(design guidance)*.

## Unit 3: Managed devices and compliance

*10 minutes*

### Managed devices

`managedDevice` is Intune's record of an enrolled device. The properties the checks read are:[^m3-mdres]

- `complianceState`: one of `unknown`, `compliant`, `noncompliant`, `conflict`, `error`, `inGracePeriod` or `configManager`. It supports `$filter` with `eq` and `or`.
- `lastSyncDateTime`: the last successful sync with Intune. It supports `$filter` with `lt` and `gt`.
- `complianceGracePeriodExpirationDateTime`: when the device's grace period ends.
- `operatingSystem`, `osVersion` and `isEncrypted` ("Device encryption status").
- `managedDeviceOwnerType`: `unknown`, `company` or `personal`.
- `azureADDeviceId`: the Entra device ID, which is the join key to the Entra device object ([Book 05, Chapter 03](../books/b05-devices/03-where-device-and-server-data-lives.md#how-the-records-correlate)).

The same resource also returns `userPrincipalName`, `emailAddress`, `userDisplayName` and `phoneNumber`.[^m3-mdres] The checks name the properties they need in `$select` and leave those out, so a check's output never carries a person's name or address *(design guidance)*.

Some properties, such as `ethernetMacAddress`, `physicalMemoryInBytes`, `iccid` and `udid`, return a default value when the device is listed. Their real values come only from a GET of one device that names them in `$select`.[^m3-mdres] A script that reads them from the list sees blanks or zeros that look like data.

### Compliance policies and compliance status

A compliance policy's `assignments` list its targets. In v1.0 a group target is `groupAssignmentTarget` with a `groupId`.[^m3-grouptarget] Beta documents `exclusionGroupAssignmentTarget`, a group excluded from the assignment.[^m3-exclbeta] A policy with no assignments, or with only exclusions, applies to no device.

`deviceStatuses` gives one row per device for a policy. Its `status` is one of `unknown`, `notApplicable`, `compliant`, `remediated`, `nonCompliant`, `error`, `conflict` or `notAssigned`. Each row carries `deviceDisplayName`, `deviceModel`, `lastReportedDateTime` and `complianceGracePeriodExpirationDateTime`, as well as `userName` and `userPrincipalName`.[^m3-cpstatusres] The resource doesn't document a managed-device ID. Its `id` is described only as "Key of the entity". So the checks join a status row to a managed device on the device name, and flag names used by more than one device *(inference: the key's relationship to the managed device isn't documented)*.

Two tenant-wide settings sit above every policy ([Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#tenant-wide-compliance-settings)). By default, Intune marks a device with no compliance policy assigned as *Compliant*. Microsoft recommends changing that setting to *Not compliant*, and recommends that every device be targeted by a compliance policy.[^m3-reports] In Graph the two settings are `deviceManagementSettings.secureByDefault` (the device is noncompliant when no policy targets it) and `deviceComplianceCheckinThresholdDays` (how many days a device may go without checking in and remain compliant).[^m3-dmsettings] The permission for reading them, through the `deviceManagement` singleton, wasn't confirmed on Learn on October 30, 2026, so the checks don't read them.

## Unit 4: Configuration, filters, Autopilot and apps

*8 minutes*

### Configuration profiles and the Settings Catalog

Template-based profiles are `deviceConfigurations`, in v1.0, read with `DeviceManagementConfiguration.Read.All`.[^m3-dclist] Settings Catalog and endpoint security policies are `configurationPolicies`, in beta. They're read with `DeviceManagementConfiguration.Read.All`, and the page also lists `DeviceManagementEndpointSecurity.Read.All`.[^m3-sclist] A complete export of the policy library, for CM-2, needs both lists, so it depends on beta *(inference)*. Per-setting conflict detection is VK-INT-05's job, and the conflict rules are in [Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#configuration-status-and-conflicts).

### Assignment filters

Filters let a policy reach part of a group by device properties, without changing group membership. Book 05 uses them for time-sensitive assignment ([Chapter 08](../books/b05-devices/08-gpo-to-intune-policy-migration.md#assignment-filter-examples)), and VK-INT-04 checks the design. The filter list (`/deviceManagement/assignmentFilters`, `DeviceManagementConfiguration.Read.All`) is **beta**. Each filter has a `platform`, a `rule` and `payloads` that say which policies and groups use it.[^m3-filters]

### Windows Autopilot

`windowsAutopilotDeviceIdentities` is the registration record: serial number, group tag, purchase order, enrollment state, last contact and the managed device ID. It's in v1.0 and needs `DeviceManagementServiceConfig.Read.All`.[^m3-aplist][^m3-apv1] The v1.0 resource has no profile assignment status. Beta adds:[^m3-apbeta]

- `deploymentProfileAssignmentStatus`: `unknown`, `assignedInSync`, `assignedOutOfSync`, `assignedUnkownSyncState` (Microsoft's spelling), `notAssigned`, `pending` or `failed`;
- `deploymentProfileAssignmentDetailedStatus`, such as `hardwareRequirementsNotMet`;
- the `deploymentProfile` and `intendedDeploymentProfile` relationships.

The deployment profiles themselves (`windowsAutopilotDeploymentProfiles`) are listed only in beta, with the same permission.[^m3-approfiles] Both resources also return `userPrincipalName` and `addressableUserName`,[^m3-apbeta] so the check leaves them out of `$select`. Group tags, and the vocabulary they draw on, are VK-INT-03's job ([Book 05, Chapter 04](../books/b05-devices/04-intune-first-onboarding.md#registration-and-group-tags)).

### Apps

`GET /deviceAppManagement/mobileApps` lists the apps Intune manages, with `publishingState` among their properties. The page lists `DeviceManagementConfiguration.Read.All` first, then `DeviceManagementApps.Read.All`, as read permissions.[^m3-apps] A script that reads only apps should still ask for `DeviceManagementApps.Read.All`. It's the permission named for apps, and it doesn't also grant configuration reads *(design guidance)*. None of the five checks reads apps.

## Unit 5: Remote actions, limits and large exports

*8 minutes*

### Remote actions

Graph exposes Intune's device actions on `managedDevice`, including `retire`, `wipe`, `syncDevice`, `remoteLock`, `rebootNow`, `shutDown`, `locateDevice`, `windowsDefenderScan` and `cleanWindowsDevice`.[^m3-mdres] The ones checked for this page all need **`DeviceManagementManagedDevices.PrivilegedOperations.All`**, delegated or application. Each returns `204 No Content`:

- `retire`;[^m3-retire]
- `wipe`, whose body sets `keepEnrollmentData`, `keepUserData` and the macOS options;[^m3-wipe]
- `syncDevice`, even though a sync changes nothing on the device.[^m3-sync]

That makes the permission an operator's permission, not a reader's. A collector that holds it could wipe the fleet. The example code never asks for it. Keep it in a separate pipeline with its own approval step and Book 05's retirement order ([Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#retirement-and-wipe)): keys exported first, and the tenant's daily retire and delete limits planned for *(design guidance)*.

### Paging and limits

**Paging.** Follow `@odata.nextLink` until it stops, as in Module 1. Microsoft notes that "different APIs might have different default and maximum page sizes".[^m3-paging] The `managedDevices` page doesn't state its page size or a `$top` maximum.[^m3-mdlist] The example code doesn't set `$top`, and doesn't assume a page size *(unverified: Intune's page size for `managedDevices`)*.

**Throttling.** Intune has its own limits in Graph. For the compliance and configuration resources, including `deviceCompliancePolicy`, its assignments, `deviceComplianceDeviceStatus` and `deviceConfiguration`, the limits are:[^m3-throttle]

- any request: 2,000 per 20 seconds per tenant across all apps, and 1,000 per 20 seconds per app per tenant;
- writes (`POST`, `PUT`, `PATCH` and `DELETE`): 200 per 20 seconds per tenant, and 100 per app.

The coverage and noncompliance checks make one request for the policy list and two for each policy, so 100 policies cost about 201 requests. That's well under the limit. The Retry-After handling from Module 1 covers the rest.

### Reports export jobs

For data sets too large to page comfortably, Intune exports its reports through `deviceManagement/reports/exportJobs`. The export page lists both the beta and the v1.0 endpoint.[^m3-export] The flow:

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

## Unit 6: Where agencies are

*7 minutes*

**The starting state.** Book 05's agency manages Windows with Group Policy and, often, Configuration Manager, and is moving the fleet to Intune in a Microsoft 365 GCC tenant. During the move some devices have no compliance policy, the tenant-wide default may still mark them compliant, and stale records pile up.

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

One discrepancy to note. The Graph reference pages for Autopilot device identities list the API as available in US Government L4 and L5,[^m3-aplist] while the service description lists Windows Autopilot as not available in GCC High and DoD.[^m3-govsvc] The service description decides whether the feature can be used. That an endpoint answers doesn't mean the feature is supported *(inference)*. The `autopilot-profiles` check is therefore for GCC and commercial tenants: in `gcchigh` and `dod` it reports "not evaluated" without calling Graph, as Lab 1 shows.

**Interim paths** *(design guidance)*:

- **Devices with no compliance policy yet.** Run `compliance-coverage` until it lists none, then change the tenant-wide setting to *Not compliant*, as Microsoft recommends;[^m3-reports] until then, Conditional Access treats an unassigned device as compliant.
- **Devices still managed by Group Policy or Configuration Manager.** Their records aren't in Intune yet, so these checks don't see them; VK-INT-06's platform inventory and Book 05's coverage matrix track what's left.
- **A GCC High or DoD tenant.** Classic Autopilot isn't available; [Book 05, Chapter 04](../books/b05-devices/04-intune-first-onboarding.md#windows-autopilot-or-autopilot-device-preparation) compares it with Autopilot device preparation, which its table lists for GCC High and DoD. Evidence the enrollment with the other four checks.
- **Settings Catalog export depends on beta.** Keep the export, label it beta in the evidence, and re-run it after a beta change before relying on it.

## Unit 7: The five checks {#the-five-checks}

*5 minutes*

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

## Unit 8: Exercise: Lab 1 (fixtures, no tenant)

*25 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/ms-automation`. Each step below says what it does and what to look for.

In a POSIX shell (Git Bash on Windows):

```bash
# Step 1
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z noncompliant-devices

# Step 2
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z compliance-coverage

# Step 3
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z stale-checkin

# Step 3
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z stale-checkin --validity-days 30

# Step 4
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z device-posture

# Step 5
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z autopilot-profiles

# Step 6
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient, try_beta; print(try_beta(GraphClient('gcchigh', lambda s: 't'), '/deviceManagement/windowsAutopilotDeviceIdentities'))"
```

In PowerShell 7:

```powershell
# Step 7
Import-Module ./powershell/FmwGraph.psm1
$intune = Get-Content -Raw tests/fixtures/intune.json | ConvertFrom-Json -AsHashtable -DateKind String
Test-FmwIntuneStaleCheckin -Devices $intune.managedDevices -AsOf '2026-10-30T00:00:00Z' | ConvertTo-Json
(Test-FmwIntunePosture -Devices $intune.managedDevices).findings.deviceName
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 8
python -m pytest -q -p no:cacheprovider tests/python/test_intune_tasks.py
```

:::

<!-- labs:end -->

You run each check against the kit's fictional fleet of nine devices and six Autopilot registrations. Work in `examples/ms-automation`. `--from-json` evaluates a saved Graph response instead of calling Graph, and `--as-of` fixes the evaluation time so your output matches this page. Every result starts with the task's name and the controls it evidences.

1. Find the devices that need attention.

   ```bash
   python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z noncompliant-devices
   ```

   Expected: four devices, `IPH-0001`, `WS-0002`, `WS-0003` and `WS-0005`, each with its failing policy, ending with:

   ```text
       "counts": {
         "noncompliant": 2,
         "inGracePeriod": 1,
         "error": 1,
         "conflict": 0
       }
   ```

   `WS-0003`'s grace period ends `2026-10-31T00:00:00Z`. `WS-0002` has `"nameNotUnique": true`: two devices share that name, so its policy status may belong to the other one.

2. Find what no policy reaches.

   ```bash
   python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z compliance-coverage
   ```

   Expected: `"policyFindings": 2`. `CP-005 Kiosk and shared devices` is `exclusionOnly` and `CP-099 Old macOS pilot` is `unassigned`. `KSK-0001` and `MAC-0001` are in `devicesWithNoPolicyReported`, and `"ambiguousNames"` lists `WS-0002`. With the tenant's default setting, those two devices count as compliant.

3. Find devices that stopped checking in.

   ```bash
   python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z stale-checkin
   ```

   Expected result:

   ```text
     "result": [
       {
         "id": "md9",
         "deviceName": "KSK-0001",
         "operatingSystem": "Windows",
         "lastSync": null,
         "daysSinceSync": null,
         "band": "noSync"
       },
       {
         "id": "md5",
         "deviceName": "WS-0005",
         "operatingSystem": "Windows",
         "lastSync": "2026-07-01T00:00:00Z",
         "daysSinceSync": 121,
         "band": "beyondCleanup"
       },
       {
         "id": "md4",
         "deviceName": "WS-0004",
         "operatingSystem": "Windows",
         "lastSync": "2026-10-10T00:00:00Z",
         "daysSinceSync": 20,
         "band": "beyondValidity"
       }
     ]
   ```

   `KSK-0001`'s fixture date is a placeholder before 1971, so it counts as no sync. Run it again with `--validity-days 30` after `stale-checkin`:

   ```bash
   python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z stale-checkin --validity-days 30
   ```

   `WS-0004`, at 20 days, drops out.

4. Check encryption and the OS floor.

   ```bash
   python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z device-posture
   ```

   Expected: `"devices": 9`, `"notEncrypted": 3` and `"belowOsFloor": 1`. `KSK-0001` reports no encryption state (`null`), `MAC-0001` reports `false`, and `WS-0002`, on `10.0.22631.4317`, is both unencrypted and below the Windows floor of `10.0.26100`.

5. Read Autopilot profile assignment, on beta.

   ```bash
   python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z autopilot-profiles
   ```

   Expected: `"stage": "beta"`, `"evaluated": true`, `"total": 6`, with two `assignedInSync` and four in `notInSync`: `SN-1004` (`assignedOutOfSync`), `SN-1003` (`failed`, `hardwareRequirementsNotMet`), `SN-1002` (`notAssigned`) and `SN-1005` (`pending`, with no group tag).

6. See why the Autopilot check is for GCC and commercial tenants. Ask the client to read the beta collection as a GCC High run would:

   ```bash
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient, try_beta; print(try_beta(GraphClient('gcchigh', lambda s: 't'), '/deviceManagement/windowsAutopilotDeviceIdentities'))"
   ```

   Expected output:

   ```text
   {'stage': 'beta', 'available': False, 'items': [], 'reason': "autopilot-device-identities isn't offered in gcchigh (graph-calls.json not_in_clouds)"}
   ```

   No request was made: `graph-calls.json` follows the service description, not the API page.

7. Run two of the same checks in PowerShell. Start `pwsh` in `examples/ms-automation`, then:

   ```powershell
   Import-Module ./powershell/FmwGraph.psm1
   $intune = Get-Content -Raw tests/fixtures/intune.json | ConvertFrom-Json -AsHashtable -DateKind String
   Test-FmwIntuneStaleCheckin -Devices $intune.managedDevices -AsOf '2026-10-30T00:00:00Z' | ConvertTo-Json
   (Test-FmwIntunePosture -Devices $intune.managedDevices).findings.deviceName
   ```

   Expected: the same three stale devices as step 3, then `KSK-0001`, `MAC-0001` and `WS-0002` on three lines.

8. Run the Intune tests.

   ```bash
   python -m pytest -q -p no:cacheprovider tests/python/test_intune_tasks.py
   ```

   Expected: `17 passed`. Two of them, `test_permissions_are_read_only` and `test_fetch_devices_selects_no_personal_fields`, prove the checks ask for no write permission and select no person's name or address.

**Check your work:** for each finding, you can name the Graph property it came from, the control it evidences, and whether it depends on beta.

## Unit 9: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/ms-automation`. Each step below says what it does and what to look for.

In a POSIX shell (Git Bash on Windows):

```bash
# Step 3: Run the checks
pip install azure-identity
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem noncompliant-devices
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem compliance-coverage
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem stale-checkin
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem device-posture
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem autopilot-profiles
```

In PowerShell 7:

```powershell
# Step 3: Run the checks
Import-Module ./powershell/FmwGraph.psm1
Connect-FmwGraph -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
Invoke-FmwIntuneTask -Task device-posture
```

:::

<!-- labs:end -->

You run the checks read-only against a test tenant and compare them with the Intune admin center.

- **You need:** a test tenant in the worldwide or GCC cloud, never production, with an active Intune license and a few enrolled test devices; a Privileged Role Administrator to grant admin consent ([Module 1](ms-automation-foundations.md#signing-in-as-a-workload)); Python with the `azure-identity` package (step 3 installs it), or Microsoft Graph PowerShell.
- **You'll replace:** `<tenant-id>` (the test tenant's ID), `<app-id>` (the app's application (client) ID), `<thumbprint>` (its certificate's thumbprint, for PowerShell); `app.pem` is the PEM file with the certificate and its private key. Work in `examples/ms-automation`.

1. **Register one app** in the tenant's own cloud, with a certificate credential and no secret.
2. **Grant only the application permissions for the checks you run**, and admin consent:

   | Check | Permissions |
   |---|---|
   | `noncompliant-devices`, `compliance-coverage` | `DeviceManagementManagedDevices.Read.All`, `DeviceManagementConfiguration.Read.All` |
   | `stale-checkin`, `device-posture` | `DeviceManagementManagedDevices.Read.All` |
   | `autopilot-profiles` (beta) | `DeviceManagementServiceConfig.Read.All` |

   Never grant `DeviceManagementManagedDevices.PrivilegedOperations.All` to this app ([Unit 5](#remote-actions)).
3. **Run the checks.** In Python, one command per task:

   ```bash
   pip install azure-identity
   python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem noncompliant-devices
   python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem compliance-coverage
   python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem stale-checkin
   python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem device-posture
   python python/intune_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem autopilot-profiles
   ```

   In PowerShell:

   ```powershell
   Import-Module ./powershell/FmwGraph.psm1
   Connect-FmwGraph -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
   Invoke-FmwIntuneTask -Task device-posture
   ```

   A missing permission stops the run before any Graph call.
4. **Compare** each result with the Intune admin center's compliance, device and Autopilot views, and record the open review items: whether a status row's `id` matches a managed device's, and whether `$select` returns every selected property ([Status and review](#status-and-review)).
5. **Back it out.** Remove the permissions, delete the app registration and its certificate, and delete the saved results: they hold device names and serial numbers.

## Unit 10: Knowledge check

*5 minutes*

1. Which of these is beta-only today?
   a. Listing managed devices.
   b. Listing compliance policies' device statuses.
   c. Reading an Autopilot registration's `deploymentProfileAssignmentStatus`.

2. A compliance policy's only assignment is an exclusion group. Which check reports it, and why does it matter?
   a. `stale-checkin`, because its devices stop syncing.
   b. `compliance-coverage`, because the policy applies to no device and, by default, an unassigned device counts as compliant.
   c. `device-posture`, because its devices aren't encrypted.

3. Why doesn't the example code start a report export job?
   a. Creating a job needs a write permission, and the download is on a host the client won't send its token to.
   b. Export jobs aren't available in v1.0.
   c. Export jobs can't return JSON.

4. What does `autopilot-profiles` report in a GCC High tenant?
   a. Every registration as `notAssigned`.
   b. An error from Graph.
   c. "Not evaluated," without calling Graph, because the service description lists Windows Autopilot as not available there.

5. Why do both compliance checks flag device names held by more than one device?
   a. Intune rejects duplicate names.
   b. Status rows are joined to devices on the name, because the status row's `id` isn't documented as the managed device ID.
   c. M-22-09 forbids duplicate device names.

::: {.callout-tip collapse="true"}
## Check your answers
1. **c.** The profile assignment status, the profiles, the Settings Catalog and assignment filters are beta-only. See [v1.0 versus beta](#v1.0-versus-beta).
2. **b.** A policy with only exclusions reaches no device. See [Compliance policies and compliance status](#compliance-policies-and-compliance-status), and `CP-005` in Lab 1, step 2.
3. **a.** See [Reports export jobs](#reports-export-jobs).
4. **c.** See [Unit 6: Where agencies are](#unit-6-where-agencies-are), and Lab 1, step 6.
5. **b.** See [Compliance policies and compliance status](#compliance-policies-and-compliance-status), and `WS-0002` in Lab 1, step 1.
:::

## Unit 11: Summary

*3 minutes*

You mapped Book 05's evidence questions to Graph APIs, their least-privileged permissions and their stage, learned the traps in managed devices and compliance status, kept remote actions and export jobs out of the collector, and saw why Autopilot is a GCC and commercial check. In Lab 1 you ran the five checks on fixtures in Python and PowerShell and read each finding against its control.

**Evidence an ISSO keeps from this module:** each check's dated output, with its `evidences` list, the app's permissions and consent record, and the beta label on `autopilot-profiles`; the coverage result showing every device under a policy, and the record of the tenant-wide setting changed to *Not compliant*; the encryption findings confirmed in Intune's encryption report; and the validation kit's VK-INT results beside them. [Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads) lists what an assessor reads, and the [Intune track guide's Gate 6](../books/guides/intune-track-implementation.md#gate-6-operating-it) puts it on a schedule.

::: {.callout-tip}
## You've finished the path
[Previous: Module 2](ms-automation-entra.md) · [Learning path](index.md#microsoft-automation-learning-path). Modules 4 to 6 are planned ([Module 1](ms-automation-foundations.md#unit-1-introduction) lists them).
:::

## Status and review

**Draft.** Every API, permission, property, limit and cloud difference was checked against Microsoft Learn on October 30, 2026. The ScubaGear baseline and the NIST SP 800-53 Moderate baseline were checked the same day. Inferences, design guidance and unverified points are labeled, and the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/training/_verification/ms-automation-intune.md) lists each claim with its source. The checks are tested against fixtures only, and the Lab 1 commands were run on November 1, 2026; the output shown is what they printed.

To move this page to **In review**:
- a reviewer confirms the permissions table and the beta list;
- someone confirms that `deviceComplianceDeviceStatus.id` can't be joined to the managed device ID;
- someone confirms the permission for reading `deviceManagement/settings`.

To move it to **Proved**: run the five checks against a test tenant and compare the results with the Intune admin center's compliance, device and Autopilot views. Record that comparison here. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 1: Foundations](ms-automation-foundations.md), [Module 2: Microsoft Entra ID](ms-automation-entra.md), the [Microsoft practice crosswalk](../reference/graph-practice-crosswalk.md), [Book 05 — Devices](../books/b05-devices/index.md) and the [Intune track implementation guide](../books/guides/intune-track-implementation.md#gate-6-operating-it).

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
