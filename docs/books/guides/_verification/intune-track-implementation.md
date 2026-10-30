# Verification — Guide: Intune Track Implementation

New guide, first pass of 2026-10-29. The guide is a step-by-step route over Book 05 Ch 03, 04, 05, 06, 07, 08 and 10 and Appendix A, the Attribute-Driven Migration companion guide (Intune track, coverage matrix, four tiers, dynamic device group dangers, federal requirements), the Ansible guide, Book 04 Ch 07, Book 02 Ch 10, Book 00 Ch 09, Book 11 Appendix A, Book 12 Ch 01 and Book 14 Ch 03. Facts carried from those pages are cited by link to the section that states them and rely on those pages' own verification logs. New external facts are footnoted; each Microsoft Learn page marked "opened" below was fetched or searched on 2026-10-29 through the Microsoft Learn documentation service. Pages marked "carried" were verified on 2026-10-29 in the companion guide's log and are cited at the same URL. No personal name or email address was sent in any request.

## Claims log: new external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Intune Plan 1 is the base service; most organizations get Intune through a Microsoft 365 bundle; a licence is required for any user or device that benefits from the service, including through an API | Step 0.1 | verified (opened) | `iti-licensing` ("Microsoft Intune plans," "License requirements") |
| 2 | Device-only licences apply to self-deploying Autopilot, Apple enrollment without user affinity, Android Enterprise dedicated and DEM-account enrollment; devices on them don't support app protection policies or Conditional Access | Step 0.1 | verified (opened) | `iti-licensing` ("Device-only licenses," "Device-only license limitations") |
| 4 | Dynamic membership needs Entra ID P1 per unique user in a dynamic group; no licence for devices in device-based dynamic groups | Step 0.1 | verified (opened) | `iti-dyn-rules` ("License requirements") |
| 5 | Device rules reference only device attributes; group security depends on write permissions of referenced attributes | Gate 1 intro; Step 1.5 | verified (opened; also companion log #8) | `iti-dyn-rules` ("Considerations," "Security consideration") |
| 6 | Rule builder supports only user-based rules; device rules use the text box | Step 2.1 | verified (opened) | `iti-dyn-rules` ("Rule builder in the Azure portal") |
| 7 | Policy and Profile Manager manages compliance policy, configuration profiles, Apple enrollment, corporate device identifiers and security baselines; its permissions include Filters create/read/update/delete and Enrollment programs | Step 0.3 | verified (opened) | `iti-intune-roles` (overview "Built-in roles"; ref-built-in-roles "Policy and Profile manager") |
| 8 | Endpoint Security Manager manages security baselines, device compliance, Conditional Access and Defender for Endpoint features; Intune Role Administrator is the only Intune role that assigns permissions to administrators; Read Only Operator can't make changes | Step 0.3 | verified (opened) | `iti-intune-roles` |
| 9 | Rule validation needs at least Groups Administrator; up to 20 users or devices at a time | Step 0.3; Gate 2 Validate | verified (carried, companion `adm-dyn-validate`) | `iti-dyn-validate` |
| 10 | `PATCH /devices/{id}`: delegated least privilege `Directory.AccessAsUser.All` (no higher delegated option); application `Device.ReadWrite.All`, higher `Directory.ReadWrite.All`; app-only and non-Windows calls update only `extensionAttributes`; Intune Administrator least-privileged delegated role | Step 0.3; Step 1.4 | verified (opened) | `iti-device-update` |
| 11 | Device `extensionAttributes` are mastered in the cloud, set at creation or update; support `$filter` (`eq`, `not`, `startsWith`, `eq` on null) | Step 1.4 | verified (opened) | `iti-device-resource` (device resource type, Properties) |
| 12 | Autopilot `updateDeviceProperties` (v1.0) takes `groupTag`; needs `DeviceManagementServiceConfig.ReadWrite.All`, delegated or application | Step 1.2 | verified (opened) | `iti-ap-update` |
| 13 | `[ZTDid]` selects Autopilot devices; group tag maps to `[OrderID]` | Step 1.2 | verified (carried, companion #52) | `iti-autopilot` |
| 14 | `enrollmentProfileName` is readable by device rules and by assignment filters | Step 1.3 | verified (carried, companion #51 and #54) | `iti-dyn-rules`; `iti-filter-props` |
| 15 | Time-sensitive assignment: user group or All devices with a filter; prefer filters where the rule needs only filter-visible properties; no dynamic device groups as exclusions; user-owned settings to user groups, device-bound settings to device groups | Steps 2.2, 2.3 | verified (carried, companion #7 and #12) | `iti-intune-assign` |
| 16 | Assignment filters: up to 200 per tenant; 3,072 characters each; managed devices must be enrolled; evaluated at enrollment, check-in or policy evaluation; managed-app filters apply only to app protection and app configuration policies | Step 2.2 | verified (opened) | `iti-filters` ("How assignment filters work," "Restrictions") |
| 17 | Pausing dynamic processing for large changes; wait at least 24 hours | Gate 2 rollback; Gate 4 | verified (carried, companion #11) | `iti-dyn-processing` |
| 18 | Report-only CA policies requiring a compliant device can repeatedly prompt macOS, iOS and Android users to select a device certificate; Microsoft advises excluding those platforms | Step 3.3 | verified (opened) | `iti-ca-report-only` ("Overview," warning) |
| 19 | Stale devices: at least 21 days; disable before delete; retire MDM devices first; hybrid-joined devices cleaned up in AD; don't delete system-managed Autopilot devices; BitLocker keys deleted with the device | Step 6.1 | verified (carried, companion `adm-stale-devices`) | `iti-stale-devices` |
| 20 | Intune cleanup rules hide devices after 30 to 270 days; hidden devices aren't removed from Entra ID | Step 6.1 | verified (carried, companion `adm-intune-cleanup`) | `iti-intune-cleanup` |

## Facts carried from the books (linked, not footnoted)

| Fact | Linked source |
|---|---|
| Device slot numbering (1 region, 3 department, 11 tier, 12 role, 13 environment) | Book 05 Ch 08, the device attribute schema |
| GCC uses the commercial Intune instance and `graph.microsoft.com`; WUfB reports not GCC-compliant | Book 05 Ch 10, GCC (Moderate) boundary facts |
| Classic Autopilot default in GCC; device preparation has no group tag | Book 05 Ch 04, which one in a GCC tenant |
| Supplier registration needs one-time Global Administrator consent; personal Windows enrollment blocked | Book 05 Ch 04, registration and group tags; enrollment restrictions |
| Don't use Intune Administrator for day-to-day work | Book 05 Ch 05, prerequisites: licensing and roles |
| Seven phases, pilot at ~5%, 7-day grace, 72-hour watch, workload order, Endpoint Protection before device configuration | Book 05 Ch 08, Phases 1–5 |
| Freeze, back up, prove, disable link, watch; preference items persist | Book 05 Ch 07, freezing and unlinking GPOs |
| Pilot Intune doesn't remove settings on unassignment; moving back leaves state | Book 05 Ch 08, rollback |
| No precedence between configuration policies; one owning policy per setting | Book 05 Ch 08, policy types |
| Unassigned devices marked noncompliant by tenant setting | Book 05 Ch 10, tenant-wide compliance settings; Ch 08 schema |
| Log Analytics exports up to 48 hours; Tier 0 polled from Graph | Book 05 Ch 10, what Log Analytics receives; alerts |
| CM-2, CM-6, CM-7, CM-8 evidence | Book 05 Ch 10, reporting and the evidence an assessor reads |
| M-22-09 §III.A device-level signal; §III.B CDM inventory and EDR | Book 11 Appendix A, OMB M-22-09 objectives and actions |
| Coverage matrix and four tiers | Companion guide, Intune coverage; what neither tool reaches |

## Design guidance (labelled in the guide, not sourced as fact)

- The provisioning service as the single writer, app-only, certificate or managed identity; delegated writes break-fix only through PIM.
- Correcting group tags only from the procurement record, through Graph, not by hand.
- The report-only ring built from audit mode, extended grace, CA report-only on Windows and the `gpresult` comparison.
- Decision of which policies are time-sensitive.
- The drift cadence table and the rollback test on the pilot division.
- `Standard` as an example device-role value; `UNPOSITIONED` as the tier marker value.

## Validation kit IDs referenced

VK-INT-01 to VK-INT-06; VK-DG-01 to VK-DG-06 (VK-DG-01 and VK-DG-02 only for the user groups of Step 2.3; VK-DG-07 not used, since administrative units aren't part of this track's steps); VK-NPI-05 (cross-track, for Graph grants that can write device objects). No new IDs were added in the first pass. On 2026-10-30 VK-INT-07 was added to the kit and named in Step 3.1's Validate. It reads Group Policy analytics' beta `groupPolicyMigrationReports` (`DeviceManagementConfiguration.Read.All`; global service, US Government L4 and L5; [Learn](https://learn.microsoft.com/graph/api/intune-gpanalyticsservice-grouppolicymigrationreport-list?view=graph-rest-beta), read 2026-10-30). Its permission and stage are in the kit README.

## Not verified

- Which Microsoft 365 Government bundle carries Intune Plan 1 and Defender for Endpoint in a GCC tenant: the guide tells the reader to confirm with licensing; the Learn licensing page names only commercial bundles.
- Whether Microsoft Graph exposes dynamic-rule validation in v1.0: the guide cites the portal feature and leaves the kit to state the release stage of its Graph form (VK-DG-03).
- The illustrative app-only PowerShell sample hasn't been run against a tenant; it's labelled illustrative.
