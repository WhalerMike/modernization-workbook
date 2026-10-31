---
title: "Intune Track Implementation: Attribute-Driven Management of End-User Devices"
description: "A step-by-step guide to the Intune track of the attribute-driven migration: the prerequisites (licensing, the GCC tenant, roles and the coverage matrix), the device sources and their single writer (Autopilot registration and group tags, enrollment profiles, and Microsoft Graph writes of device extension attributes by the device provisioning service), the targeting design (dynamic device groups, assignment filters, user groups and one owning policy per setting), the computer half of Group Policy moved through Book 05's GPO-to-Intune migration, the dangers and their mitigations, cut-over waves with rollback, and operating the result: stale-device cleanup, drift, and evidence for CM-2, CM-6, CM-7, CM-8 and the M-22-09 device signals. Every gate names the validation kit checks that prove it."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Intune Track Implementation: Attribute-Driven Management of End-User Devices

*A device gets the right policy because of what it says about itself, so the work is making one service say it, making nothing else able to, and proving both every week.*

::: {.callout-note}
## In this guide
The working path for the [Intune track](attribute-driven-migration.md#intune-track) of the attribute-driven migration: end-user devices moving from OU-linked Group Policy to Intune policy targeted by device attributes. Seven gates, each with its steps, a **Validate** step that names the validation kit checks proving it, and its rollback: prerequisites; device sources and the single writer; the targeting design; the computer half of Group Policy, moved through Book 05's migration; dangers and mitigations; cut-over waves; and operating the result, with stale-device cleanup, drift and the evidence an assessor reads. The depth is in [Book 05](../b05-devices/index.md), and this guide links to it rather than repeating it.
:::

## How to use this guide

The [companion guide](attribute-driven-migration.md) is the map of all four tracks; this guide is the route for one, end-user devices. Servers take the Arc track ([Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md)), and the user-configuration half of Group Policy moves with people on the HR track ([Stage 6](attribute-driven-migration.md#stage-6-replace-gpo-inheritance-with-conditional-access-and-intune-targeting)).

- **Link, don't repeat.** Each step says what to do and links to the Book 05 section that holds the procedure, script or table.
- **Labels.** *(Design guidance)* marks the program's recommendations. Facts cite a chapter or a primary source opened on October 29, 2026 and logged in this guide's verification file.
- **Validation kit checks.** Each **Validate** step names read-only checks: `VK-INT-nn` for this track, `VK-DG-nn` for dynamic groups. A gate passes when its checks come back clean, or every finding has an owner and a date.

The slot numbering is Book 05's device attribute schema: region in `extensionAttribute1`, department in `extensionAttribute3`, security tier in `extensionAttribute11`, device role in `extensionAttribute12` and environment in `extensionAttribute13` ([Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#the-device-attribute-schema)). These are device slots, separate from the user slots in the [program attribute map](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map).

## The path on one page

| Gate | What it establishes | Validate with | Book 05 detail |
|---|---|---|---|
| 0. Prerequisites | Licences, cloud, least-privileged roles; every platform placed in the coverage matrix or a tier | VK-INT-06 | [Ch 05 licensing and roles](../b05-devices/05-the-governed-manual-and-retrofit-paths.md#prerequisites-licensing-and-roles); [coverage](attribute-driven-migration.md#intune-coverage) |
| 1. Device sources | Procurement as the authority; Autopilot group tags as a controlled vocabulary; one writer for device extension attributes | VK-INT-01, VK-INT-03, VK-DG-05 (baseline snapshot) | [Ch 03](../b05-devices/03-where-device-and-server-data-lives.md#which-system-owns-which-fact); [Ch 04](../b05-devices/04-intune-first-onboarding.md#registration-and-group-tags) |
| 2. Targeting design | Dynamic device groups for attribute rules, filters for time-sensitive assignment, user groups for user settings, one owning policy per setting | VK-DG-03, VK-DG-04, VK-DG-06, VK-INT-04, VK-INT-05 | [Ch 08 policy architecture](../b05-devices/08-gpo-to-intune-policy-migration.md#policy-architecture) |
| 3. The computer half of Group Policy | Settings analysed, the library built, report-only and pilot rings run, GPO links disabled population by population | VK-INT-04, VK-INT-05 | [Ch 07](../b05-devices/07-the-gpo-sunset-program.md); [Ch 08 phases](../b05-devices/08-gpo-to-intune-policy-migration.md#the-seven-phases-at-working-level) |
| 4. Dangers covered | Each dynamic device group danger has its mitigation in place | VK-INT-01 to VK-INT-05; VK-DG-03 to VK-DG-06 | [Companion guide table](attribute-driven-migration.md#dynamic-device-groups-intune-track) |
| 5. Cut-over waves | Division by division, each wave watched and drift-clean before the next; rollback tested | VK-DG-05, VK-INT-01, VK-INT-05 | [Ch 08 Phase 5](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-5-workload-cutover-in-waves); [rollback](../b05-devices/08-gpo-to-intune-policy-migration.md#rollback) |
| 6. Operating it | Stale devices cleaned up, drift caught at the source, evidence on a schedule | VK-INT-02, every check on a schedule | [Ch 10](../b05-devices/10-operating-and-evidencing-the-fleet.md) |

: The Intune track's gates and the checks that prove them {.striped .hover}

The [Endpoint & Device Modernization project plan](../../project-plans/endpoint-device.md) schedules the same work as a 44-week network with its own gates; use its dates and this guide's checks together.

## Gate 0: prerequisites

### Step 0.1: licensing

Confirm entitlements against the agency's own agreements; Book 05 carries the program's licensing table ([Chapter 05](../b05-devices/05-the-governed-manual-and-retrofit-paths.md#prerequisites-licensing-and-roles)). Three facts shape this track:

- **Intune Plan 1** is the base service, usually obtained through a Microsoft 365 bundle, and a licence is required for every user or device that benefits from the service.[^iti-licensing] For a GCC tenant, confirm which Government bundle carries Plan 1 and Defender for Endpoint.
- **Device-only licences** cover userless kiosks and dedicated devices enrolled through self-deploying Autopilot, Apple enrollment without user affinity, Android Enterprise dedicated or a device enrollment manager account, but such a device doesn't support app protection or Conditional Access.[^iti-licensing] For them, CP-005 ([Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#cp-005-kiosk-and-shared-devices)) is a configuration and evidence control, not an access control.
- **Dynamic groups** need an Entra ID P1 licence per unique user in a dynamic group, and none for devices in device-based groups.[^iti-dyn-rules]

### Step 0.2: the tenant's cloud

The workbook assumes a Microsoft 365 GCC tenant at FedRAMP Moderate ([Book 14, Chapter 03](../b14-compliance/03-the-baseline-and-the-crosswalk.md#two-facts-not-one)). GCC uses the commercial Intune instance, so the admin center is `intune.microsoft.com` and Graph is `graph.microsoft.com`; GCC High and DoD differ ([Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#gcc-moderate-boundary-facts)). Classic Windows Autopilot is available in GCC and is the program's default because its registration carries the group tag ([Chapter 04](../b05-devices/04-intune-first-onboarding.md#which-one-in-a-gcc-tenant)). Windows Update for Business reports don't meet GCC requirements, so update evidence comes from Intune and Autopatch reports ([Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads)).

### Step 0.3: roles

Assign least-privileged roles before anyone builds anything, and record them in the responsibility matrix ([Book 05, Chapter 06](../b05-devices/06-who-owns-the-endpoint.md#the-responsibility-matrix)).

| Work | Role | Why this one |
|---|---|---|
| Compliance policies, configuration profiles, enrollment profiles, corporate identifiers, assignment filters | Intune **Policy and Profile Manager** (Intune RBAC), scoped with scope tags | Microsoft's built-in role for exactly this work; it includes filter and enrollment-program permissions[^iti-intune-roles] |
| Endpoint security policies and baselines | Intune **Endpoint Security Manager** | Security and compliance features, including Defender for Endpoint[^iti-intune-roles] |
| Assigning Intune roles | Intune **Role Administrator** | The only Intune role that can assign permissions to administrators[^iti-intune-roles] |
| Read-only checks (the validation kit) | Intune **Read Only Operator** for people; read-only Graph application permissions for the kit | Views without change[^iti-intune-roles] |
| Dynamic device group rules | Groups Administrator, PIM-eligible | Rule validation needs at least Groups Administrator[^iti-dyn-validate] |
| Writing device extension attributes | The device provisioning service's application identity, app-only (Gate 1) | Keeps the writer a service, not a person |
| Break-fix writes to device attributes | Intune Administrator, PIM-eligible only, with an approval | The least-privileged Entra role for delegated device updates[^iti-device-update] |

Microsoft advises against Intune Administrator for day-to-day work because it grants read and write across Intune ([Book 05, Chapter 05](../b05-devices/05-the-governed-manual-and-retrofit-paths.md#prerequisites-licensing-and-roles)), so the program uses it only for break-fix, through PIM, and never as the endpoint team's working role *(design guidance)*.

### Step 0.4: the coverage matrix and the tiers

Place every end-user platform in the fleet against the [coverage matrix](attribute-driven-migration.md#intune-coverage) before any design work, because a platform's row decides whether the rest of this guide applies to it.

1. **Export the platform inventory** from Intune, Entra ID, Defender for Endpoint device discovery and the CMDB, by OS, version and ownership.
2. **Mark each population's row** as managed, limited (Windows 10, Linux desktop, ChromeOS) or not an Intune platform.
3. **Put every device outside tier 1 in a tier** of the [four-tier strategy](attribute-driven-migration.md#what-neither-tool-reaches): the platform's own tool feeding the CMDB (with [Ansible](ansible-configuration-automation.md#where-it-fits) where it's the tool), discovered and monitored only, or segmented and retired with a risk acceptance.
4. **Record Windows 10** as an exception with an upgrade date; Book 05 sets Windows 11 as the floor ([Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md)). Record devices that can't enroll as path D exceptions, isolated first ([Chapter 04](../b05-devices/04-intune-first-onboarding.md#path-d-under-the-compliant-device-policies)).

**Validate Gate 0.** Run **VK-INT-06** (platform inventory by OS, version and ownership against the coverage matrix, out-of-support platforms flagged). The gate passes when every flagged population has a tier, an owner and, for tier 4 and Windows 10, a date. A device in no tier is a CM-8 finding ([companion guide](attribute-driven-migration.md#what-neither-tool-reaches)).

**Rollback.** Nothing to roll back; this gate only reads.

## Gate 1: device sources and the single writer

The rule for this gate comes from Book 05: each fact has one authoritative origin, every derived value must be explainable from it, and a device with no source value carries an explicit unpositioned marker, never an empty attribute ([Chapter 03, the rule](../b05-devices/03-where-device-and-server-data-lives.md#the-rule)). Business facts (ownership, purpose, location, organizational assignment) come from procurement and the asset record; technical state comes from Microsoft's services ([which system owns which fact](../b05-devices/03-where-device-and-server-data-lives.md#which-system-owns-which-fact)). The primary user's department is never a source, and a device rule can't read it anyway.[^iti-dyn-rules]

### Step 1.1: fix the vocabulary

1. **Publish the value list** for each device slot, one spelling per value and an unpositioned value, used by provisioning, rules and reports alike ([Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#environment-role-region-and-department-groups)).
2. **Publish the group-tag vocabulary**: the organizational node code from the procurement record, never a free-text department name, so a reorganization changes a mapping table rather than thousands of registrations ([Chapter 04](../b05-devices/04-intune-first-onboarding.md#registration-and-group-tags)).
3. **Keep both lists under change control** in the governance repository; a new value is a change, because a rule will match it.

### Step 1.2: Autopilot registration and group tags

For new hardware, follow the Intune-first doctrine: the organizational assignment is set at the purchase order and carried by the vendor program ([Chapter 04, the five-phase process](../b05-devices/04-intune-first-onboarding.md#the-five-phase-process)).

1. **Capture the procurement intake fields** at purchase order time ([procurement intake fields](../b05-devices/04-intune-first-onboarding.md#procurement-intake-fields)).
2. **Have the OEM or reseller register the device** with its group tag. Supplier registration needs a one-time Global Administrator consent per supplier; record it ([registration and group tags](../b05-devices/04-intune-first-onboarding.md#registration-and-group-tags)).
3. **Correct a tag only from the procurement record.** Group tags can also be set through Microsoft Graph's `updateDeviceProperties` action on the Autopilot device identity (v1.0), which takes `groupTag` and needs `DeviceManagementServiceConfig.ReadWrite.All`.[^iti-ap-update] If the provisioning service corrects tags, it holds that permission too; nobody edits tags by hand in the portal *(design guidance)*.
4. **Block personal Windows enrollment** so an unregistered device fails as an enrollment error instead of entering production ungoverned ([enrollment restrictions](../b05-devices/04-intune-first-onboarding.md#enrollment-restrictions)).

The tag becomes the device's `[OrderID]` physical ID, which dynamic rules can match; `[ZTDid]` marks every Autopilot device.[^iti-autopilot] Where device preparation is used instead of classic Autopilot, there's no registration and no tag, so the attribute comes from the serial-number mapping table after enrollment ([which one, in a GCC tenant](../b05-devices/04-intune-first-onboarding.md#which-one-in-a-gcc-tenant)).

**The existing fleet** has no registration. Hybrid-joined devices enroll through Group Policy–triggered automatic enrollment ([Chapter 05](../b05-devices/05-the-governed-manual-and-retrofit-paths.md#phase-2-enroll-the-existing-workstation-fleet-in-intune)), and their attributes are derived once from existing structure and confirmed by an owner ([the retrofit path](../b05-devices/05-the-governed-manual-and-retrofit-paths.md#the-retrofit-path)); treat each derived value as provisional until reconciled with the CMDB.

### Step 1.3: enrollment profiles

Enrollment profile names are a second carrier: a dynamic rule can read `enrollmentProfileName`, and so can an assignment filter.[^iti-dyn-rules][^iti-filter-props]

1. **Name profiles from the same vocabulary**, with a fixed prefix per device role, such as the kiosk profile in [Chapter 08's filter examples](../b05-devices/08-gpo-to-intune-policy-migration.md#assignment-filter-examples).
2. **Use each platform's vendor program and carrier**: Apple Business Manager assignment to the enrollment profile, Android zero-touch or Knox profiles, the mapping table for Linux ([other platforms](../b05-devices/04-intune-first-onboarding.md#other-platforms)).
3. **Never reuse a profile name for a different role.** A reused name moves devices between policy sets ([companion guide](attribute-driven-migration.md#dynamic-device-groups-intune-track)).

### Step 1.4: the device provisioning service writes the extension attributes

Device extension attributes are set on the Entra device object through Microsoft Graph, `PATCH /devices/{id}` with an `extensionAttributes` body. Microsoft documents two ways to call it:[^iti-device-update]

| Mode | Permission | Who | What it can update |
|---|---|---|---|
| Application (app-only) | `Device.ReadWrite.All` (least privileged; `Directory.ReadWrite.All` is the higher option) | The device provisioning service | Only `extensionAttributes`, which is all this track needs |
| Delegated | `Directory.AccessAsUser.All` (the only delegated permission) | A signed-in administrator with at least Intune Administrator | More properties on Windows devices; only `extensionAttributes` on non-Windows devices |

The device resource describes the extension attributes as mastered in the cloud and settable when a device object is created or updated, and they support `$filter` with `eq`, `not`, `startsWith` and `eq` on null values.[^iti-device-resource] So they aren't overwritten by directory synchronization, and a read-only check can find empty slots directly.

**The program's design** *(design guidance)*:

1. **Exactly one writer.** The device provisioning service, app-only, is the only principal that writes device slots. It holds `Device.ReadWrite.All` and nothing broader, signs in with a certificate or managed identity, never a secret, and is an owned workload identity on the [non-person identity track](attribute-driven-migration.md#non-person-identity-track).
2. **Write from the source, at registration and on change.** Values come from the asset record keyed on serial number; the service writes when enrollment completes and when the record changes, and logs the source record and change reference. Reconciliation corrects at the source ([Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#device-inventory-reconciliation)).
3. **Use the house Graph pattern**: per-cloud connection, paging, `Retry-After` on 429 and 503, batches of at most 20 ([automation reference](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation); [Module 1](../../research/ms-automation-foundations.md)).
4. **Delegated writes are break-fix only**, by an Intune Administrator activated through PIM with an approval, using [Chapter 08's delegated sample](../b05-devices/08-gpo-to-intune-policy-migration.md#writing-a-device-attribute).

::: {.callout-warning}
## Illustrative, not tested against a production tenant
The sample below is illustrative. Review every name and value, and run it first against a test tenant.
:::

```powershell
# App-only, as the device provisioning service. GCC (Moderate) uses the default global environment.
# Device.ReadWrite.All application permission, consented by an administrator; certificate credential, no secret.
Connect-MgGraph -TenantId $tenantId -ClientId $provisioningAppId -CertificateThumbprint $thumbprint -NoWelcome

# $deviceObjectId is the Entra device object ID, not the deviceId. Values come from the asset record.
$body = @{
    extensionAttributes = @{
        extensionAttribute1  = $asset.Region          # e.g. EAST
        extensionAttribute3  = $asset.Department      # e.g. Finance
        extensionAttribute11 = $asset.Tier            # Tier0 | Tier1 | Tier2 | UNPOSITIONED
        extensionAttribute12 = $asset.Role            # PAW | Kiosk | SharedDevice | Dedicated | Standard
        extensionAttribute13 = $asset.Environment     # Production | Staging | Dev
    }
} | ConvertTo-Json -Depth 3

Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/devices/$deviceObjectId" -Body $body -ContentType 'application/json'

# Read back what was written, for the provenance record.
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/devices/$deviceObjectId`?`$select=id,deviceId,displayName,extensionAttributes"
```

`Standard` as a device-role value is an example; use the agency's published list. The `UNPOSITIONED` tier value is the explicit marker for a device the source can't place, and it lands in no tier group, so the tenant-wide compliance setting treats it as noncompliant ([Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#tenant-wide-compliance-settings)).

### Step 1.5: close every other write path

A dynamic group is only as secure as the write permissions on the attributes its rule reads.[^iti-dyn-rules] So:

1. **List every principal that can write device objects**: holders of `Device.ReadWrite.All` or `Directory.ReadWrite.All` application permissions (the non-person track's VK-NPI-05 lists them) and standing holders of Intune Administrator or higher.
2. **Remove or record each one** that isn't the provisioning service; make Intune Administrator PIM-eligible and alert on activation.
3. **Audit device updates** in the Entra audit log; any actor other than the provisioning service is a finding.

**Validate Gate 1.** Run **VK-INT-01** (managed devices missing provisioning-written tier, role or environment) and **VK-INT-03** (Autopilot devices with no group tag, or one outside the vocabulary); both should be empty for the pilot population, or carry the unpositioned marker with an open finding. Take the first **VK-DG-05** snapshot of device group membership, which every later wave compares with. Then review the writer list from Step 1.5 and sign it.

**Rollback.** Attribute writes are reversible by rewriting the previous value from the provenance record. Until Gate 2 assigns policy to groups that read these slots, a wrong value changes no device's configuration.

## Gate 2: the targeting design

Book 05 sets the architecture: include groups, exclude groups and assignment filters, with one owning policy per setting ([Chapter 08, policy architecture](../b05-devices/08-gpo-to-intune-policy-migration.md#policy-architecture); [Chapter 07, assignment strategy](../b05-devices/07-the-gpo-sunset-program.md#assignment-strategy)). The steps below turn it into a design an engineer can build and a reviewer can check.

### Step 2.1: dynamic device groups for extension-attribute rules

Use a dynamic device group wherever the rule has to read a device extension attribute (tier, role, environment, region, department), because filters can't read them ([assignment strategy](../b05-devices/08-gpo-to-intune-policy-migration.md#assignment-strategy)).

1. **Build from [Chapter 08's templates](../b05-devices/08-gpo-to-intune-policy-migration.md#tier-groups)**, one group per value.
2. **Guard every rule** with `device.accountEnabled -eq true` so disabled stale objects drop out:[^iti-dyn-rules] `(device.accountEnabled -eq true) -and (device.extensionAttribute11 -eq "Tier0")`.
3. **Make tier groups mutually exclusive**: one tier value per device, and an unpositioned value that matches no tier group.
4. **Use each tool's vocabulary**: `Company`, `Personal` or `Unknown` ownership in Entra rules, `Corporate` in Intune filters, and different trust-type strings in each ([companion guide](attribute-driven-migration.md#dynamic-device-groups-intune-track)). Device rules are written in the rule text box; the rule builder handles only user rules.[^iti-dyn-rules]
5. **Keep rules in Git** and deploy them from the repository, so the nightly comparison finds any rule that differs ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#git-based-drift-detection)). Don't use `memberOf` ([limits](attribute-driven-migration.md#limits)).

### Step 2.2: assignment filters for time-sensitive assignment

Dynamic device groups take processing time before a new device appears in them. For a policy that has to land as the device enrolls, Microsoft's guidance is to assign to a user group, or to **All devices** for userless devices, with an assignment filter that selects the devices at check-in; to prefer a filter where the rule needs only properties a filter can see; and not to use dynamic device groups as exclusions.[^iti-intune-assign]

1. **Decide per policy whether it's time-sensitive.** Enrollment-time security settings (BitLocker, Defender, firewall, compliance) usually are; regional variants usually aren't *(design guidance)*.
2. **Assign time-sensitive policies** to the user group or All devices with an include filter on Intune properties such as ownership, join type, enrollment profile name, OS SKU or version ([filter examples](../b05-devices/08-gpo-to-intune-policy-migration.md#assignment-filter-examples)).[^iti-filter-props]
3. **Exclude with a filter** in exclude mode or an assigned break-glass group, never a dynamic device group.
4. **Mind the limits**: 200 filters per tenant, 3,072 characters each, enrolled devices only, evaluated at enrollment and check-in; managed-app filters apply only to app protection and app configuration policies.[^iti-filters] Conditional Access and licensing still need Entra groups ([Chapter 07](../b05-devices/07-the-gpo-sunset-program.md#assignment-strategy)).

### Step 2.3: user groups for user settings

Microsoft's guidance is that settings belonging to the user, such as email profiles and user certificates, go to user groups, and settings that must stay on the device go to device groups.[^iti-intune-assign] On this track:

- **User-scope settings** go to user groups built on the HR track's coded attributes, with that track's guards on `accountEnabled` and `userType` ([dynamic user groups](attribute-driven-migration.md#dynamic-user-groups-hr-track)). These are the user-configuration half of Group Policy, and they move with people.
- **Device-scope settings** go to the dynamic device groups from Step 2.1, or to All devices with a filter from Step 2.2.
- **A device rule never stands in for a user attribute.** Where a device setting depends on the department, the provisioning service writes the device's own department from the asset record (Gate 1).

### Step 2.4: one owning policy per setting

Between configuration policies of any kind (settings catalog, endpoint security, security baselines) there's no precedence: a conflict is reported and the setting may not apply until it's resolved ([Chapter 08, policy types](../b05-devices/08-gpo-to-intune-policy-migration.md#policy-types)). The program's rule is that each setting has exactly one owning policy, and the same rule applies across tools ([Ansible guide](ansible-configuration-automation.md#one-owning-tool-per-setting)).

1. **Keep a setting register** in the repository: setting, owning policy ID (CP-, SC-, ES-, AP-), groups and filters, the GPO setting it replaces and the evidence method. It's [Chapter 07's decision record](../b05-devices/07-the-gpo-sunset-program.md#step-4-decide-and-record) plus the assignment.
2. **Reject a policy at review** if any of its settings already has an owner, and keep compliance thresholds aligned with configured values ([coexistence](../b05-devices/07-the-gpo-sunset-program.md#coexistence-who-wins)).
3. **Tag every policy** with the program's scope tags so delegated administrators see only their own ([scope tags](../b05-devices/08-gpo-to-intune-policy-migration.md#scope-tags)).

**Validate Gate 2.**

- **VK-DG-03**: test each new device rule against named devices before it's saved. The portal's validation takes up to 20 users or devices at a time and needs at least Groups Administrator.[^iti-dyn-validate] The kit marks the Graph form of the test with its release stage if it isn't generally available.
- **VK-DG-04**: shadow-diff each dynamic group against the group or OU population it replaces; every add and remove explained.
- **VK-DG-06**: no rule uses the `memberOf` preview, and no device group is left paused.
- **VK-INT-04**: policy assignment coverage, separating policies on dynamic device groups from those on filters, and listing any exclusion that uses a dynamic device group (which should be none).
- **VK-INT-05**: devices in more than one group that assigns the same setting; the target is zero, with tier groups mutually exclusive.
- For the user groups in Step 2.3, the HR track's **VK-DG-01** (guards present) and **VK-DG-02** (no display-name attributes) apply.

**Rollback.** Groups and filters with no assignments change nothing. If a group is wrong, fix the rule in Git and redeploy it; if processing must be stopped for a bulk change, pause it and record the pause so VK-DG-06 finds it afterwards.[^iti-dyn-processing]

## Gate 3: the computer half of Group Policy

This gate is Book 05's GPO sunset, run at the working level of [Chapter 08's seven phases](../b05-devices/08-gpo-to-intune-policy-migration.md#the-seven-phases-at-working-level) inside the program rules of [Chapter 07](../b05-devices/07-the-gpo-sunset-program.md#the-program-at-a-glance): inventory before anything moves, one authority per setting, evidence before a link is disabled, and disable before delete. It covers the computer-configuration settings that reached workstations through OU links; servers go to [Chapter 09](../b05-devices/09-servers-under-azure-arc.md).

### Step 3.1: analyse (Phase 1)

1. **Export every GPO as XML** with its links, filtering and settings ([Chapter 07, Step 1](../b05-devices/07-the-gpo-sunset-program.md#step-1-inventory-and-parse)), and decide each GPO-on-GPO conflict the OU precedence hid.
2. **Import into Group Policy analytics** to find each setting's landing zone, never to decide whether it's still needed ([Phase 1](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-1-inventory-and-classify)).
3. **Tag and dispose** of every setting with the four tags and four questions ([Chapter 07, Step 2](../b05-devices/07-the-gpo-sunset-program.md#step-2-classify-each-setting); [Appendix A](../b05-devices/appendix-a-gpo-to-intune-crosswalk.md)). User-configuration settings go to the HR track's user groups (Step 2.3); this gate carries the computer half.
4. **Capture the effective-policy baseline** per tier with `gpresult` on a sample.

**Validate.** Every in-scope GPO imported and every setting tagged with a disposition and an owner in the setting register ([testing at each gate](../b05-devices/08-gpo-to-intune-policy-migration.md#testing-at-each-gate), Phase 1). **VK-INT-07** (*Graph beta*, with `-IncludeBeta`) reads the Group Policy analytics reports. It shows every GPO in `gpo-scope.csv` imported, and lists every GPO targeted in AD that isn't *complete*, with its unsupported extensions.

### Step 3.2: build the policy library (Phases 2 and 3)

1. **Where Configuration Manager manages the fleet**, enable co-management for a pilot collection and decide `MDMWinsOverGP` per population ([Phase 2](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-2-coexistence-planning); [coexistence rules](../b05-devices/07-the-gpo-sunset-program.md#coexistence-who-wins)). Never configure the settings that sit outside the Policy CSP, such as Defender and Windows Hello for Business, in both channels.
2. **Build the library unassigned**: compliance policies CP-001 to CP-005, configuration profiles, endpoint security ES-001 to ES-006 and app protection AP-001 and AP-002, with attack surface reduction in audit mode ([Phase 3](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-3-baseline-authoring); [compliance policies](../b05-devices/08-gpo-to-intune-policy-migration.md#compliance-policies)).
3. **Create them as code** from the repository with the [Graph templates](../b05-devices/08-gpo-to-intune-policy-migration.md#microsoft-graph-templates), noting which resources are beta only.
4. **Peer review** each policy: every setting traces to a decision record, and no setting appears in two policies.

**Validate.** Run **VK-INT-05** against the planned assignments (from the setting register, before anything is assigned) and confirm a lab ring reports **Succeeded** for every setting (Phase 3 in [testing at each gate](../b05-devices/08-gpo-to-intune-policy-migration.md#testing-at-each-gate)).

### Step 3.3: report-only and pilot rings (Phase 4)

The pilot cohort is about 5% of the fleet, representative across tiers, regions and departments, with the GPOs still linked ([Phase 4](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-4-pilot)). Intune has no tenant-wide report-only switch, so the program builds the report-only ring from four parts *(design guidance)*:

1. **Audit mode** for attack surface reduction rules and controlled folder access, and a 7-day compliance grace period instead of 1 for the pilot groups.
2. **Conditional Access in report-only** for the compliant-device policies, owned by Book 04 ([rollout](../b04-access/07-the-conditional-access-policy-library.md#rollout-from-report-only-to-enforcement)). Report-only compliance policies can repeatedly prompt macOS, iOS and Android users to pick a device certificate, and Microsoft advises excluding those platforms,[^iti-ca-report-only] so scope report-only to Windows and pilot Apple and Android in a small enforced ring.
3. **The comparison**: each device's `gpresult` against Intune's per-setting status, where a **Conflict**, an **Error** or a differing value is a finding; then application and user tests against the Phase 1 baseline.

**Validate.** No unexplained **Conflict** or **Error**; no application regressions; **VK-INT-05** clean on the pilot groups; **VK-INT-01** clean on the pilot devices, since a pilot device with a missing tier proves nothing about its tier's policy.

### Step 3.4: workload waves (Phase 5)

Move one workload at a time for each ring: compliance, then Endpoint Protection, then device configuration, then Windows Update ([Phase 5](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-5-workload-cutover-in-waves)). Endpoint Protection moves before device configuration on co-managed devices, because switching device configuration also moves Endpoint Protection and resource access. The program's division waves are the rings (Gate 5), and each ring is watched for 72 hours before the next.

### Step 3.5: disable GPO links population by population

For each population, once the owning Intune policy reports success on it, freeze the GPO, back it up with `Backup-GPO`, prove the replacement, disable that population's link with `Set-GPLink -LinkEnabled No` (not the GPO), and watch before the next population. The procedure and script are [Chapter 07, freezing and unlinking](../b05-devices/07-the-gpo-sunset-program.md#freezing-and-unlinking-gpos). Don't block inheritance on migrated OUs; it stops domain-level policy that hybrid-joined devices still need ([Phase 6](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-6-verification-and-residual-cleanup)).

**Rollback for this step.** Re-enable the link for the affected population (`-LinkEnabled Yes`), and, for co-managed devices, move the affected workload's slider back. Two facts shape it: in **Pilot Intune**, unassigning a policy doesn't remove its settings, so a rollback reassigns a policy carrying the old value; and moving a workload back to Configuration Manager can leave some state behind ([rollback](../b05-devices/08-gpo-to-intune-policy-migration.md#rollback)).

### Step 3.6: residual cleanup and retirement (Phases 6 and 7)

1. **Clear what unlinking leaves**: Group Policy preference items stay on the device unless configured to remove themselves, so each one gets an Intune setting that takes over the value or a Remediation that clears it ([Chapter 07](../b05-devices/07-the-gpo-sunset-program.md#freezing-and-unlinking-gpos)).
2. **Disable GPO objects** and keep them 90 days; then back up, archive and delete ([Phase 7](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-7-formal-retirement)). Deletion is the only destructive step and needs approval per GPO.
3. **Close the exception register**: every remaining link is a dated exception with an owner and a review date ([the end state](../b05-devices/07-the-gpo-sunset-program.md#the-end-state)).

**Validate Gate 3.** No migrated device processes an in-scope GPO (a device-side check); every preference item cleared or owned; **VK-INT-04** shows every library policy assigned as the setting register says; **VK-INT-05** is clean fleet-wide for migrated populations; backups restore in a test domain before any deletion ([testing at each gate](../b05-devices/08-gpo-to-intune-policy-migration.md#testing-at-each-gate), Phases 6 and 7).

## Gate 4: dangers and mitigations

The companion guide lists the ways a dynamic device group goes wrong and how to avoid each ([Dynamic device groups (Intune track)](attribute-driven-migration.md#dynamic-device-groups-intune-track)). Its table is the reference; this one says where each mitigation sits in this guide and which check proves it's in place.

| Danger (companion table) | Mitigation, and where in this guide | Proved by |
|---|---|---|
| Who can write device extension attributes | One app-only writer; every other write path closed; Intune Administrator PIM-eligible ([Steps 1.4 and 1.5](#step-1.4-the-device-provisioning-service-writes-the-extension-attributes)) | VK-INT-01; the signed writer list; VK-NPI-05 for Graph grants |
| Autopilot group tag and enrollment profile rules | Controlled vocabularies; tags corrected only from procurement ([Steps 1.1 to 1.3](#step-1.1-fix-the-vocabulary)) | VK-INT-03 |
| Device rules can't read the owner's attributes | Device's own department written from the asset record; user settings to user groups ([Step 2.3](#step-2.3-user-groups-for-user-settings)) | VK-DG-04 shadow diff |
| Stale and duplicate device objects | `accountEnabled` guard; stale-device cleanup ([Step 6.1](#step-6.1-stale-device-cleanup)) | VK-INT-02 |
| Evaluation delay | Filters for time-sensitive assignment; no dynamic device group exclusions ([Step 2.2](#step-2.2-assignment-filters-for-time-sensitive-assignment)) | VK-INT-04 |
| Blast radius | Validate and shadow each rule; rings; rule changes under change control ([Gate 5](#gate-5-cut-over-waves-and-rollback)) | VK-DG-03, VK-DG-04, VK-DG-05 |
| Conflicts and overlap | One owning policy per setting; mutually exclusive tiers ([Step 2.4](#step-2.4-one-owning-policy-per-setting)) | VK-INT-05 |
| Ownership values and enrollment edge cases | Each tool's vocabulary; `Unknown` ownership and enrollment without registration as findings ([Step 2.1](#step-2.1-dynamic-device-groups-for-extension-attribute-rules)) | VK-INT-03, VK-INT-06 |

: Where each dynamic device group danger is mitigated, and the check that proves it {.striped .hover}

A device that falls out of every tier group gets no compliance policy, and the tenant setting then marks it noncompliant, so Conditional Access blocks it ([Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#the-device-attribute-schema)). That fails closed, as intended, but a rule edit that empties a tier group blocks the whole tier; VK-DG-05's delta threshold is the alarm. Before a bulk write, such as a reorganization rewriting a division's department slot, consider pausing the affected groups on Microsoft's guidance,[^iti-dyn-processing] and confirm with VK-DG-06 afterwards that none stayed paused.

**Validate Gate 4.** Every row above has its mitigation in place for the populations in the next wave, and its check is scheduled. The [monitoring](attribute-driven-migration.md#monitoring-both) the companion guide describes (membership-delta alerts, rule change history, emergency-access exclusions) is on.

## Gate 5: cut-over waves and rollback

Waves select devices by attribute value, so each wave's scope is a query and its groups already exist ([Book 00, Chapter 09](../b00-orientation/09-design-pilot-and-rollout.md#waves-defined-by-attribute-values)). The program moves a pilot division first, then two or three divisions at a time, each drift-clean before the next ([Stage 7](attribute-driven-migration.md#stage-7-cut-over-in-phases)). Book 05's workload waves run inside those division waves: the division waves decide which devices move, and the workload waves decide which workload Intune takes over on them ([Phase 5](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-5-workload-cutover-in-waves)).

### Step 5.1: the runbook for one wave

**Entry criteria.**

**Entry criteria.** Gates 0 to 4 passed for the wave's divisions; **VK-INT-01** and **VK-INT-03** clean for its devices; a fresh **VK-DG-05** snapshot from the day before; the wave's rollback written, GPO backups taken and re-enable owners named; the help desk briefed.

**Steps.**

1. **Add the wave's divisions** to the workload's pilot collection (co-managed devices), or confirm the wave's cloud-only devices are in the target groups.
2. **Assign or widen** the workload's policies to the wave's groups.
3. **Watch for 72 hours**: per-setting status, compliance, Tier 0 compliance polled hourly from Graph, and ticket volume ([alerts](../b05-devices/10-operating-and-evidencing-the-fleet.md#alerts)).
4. **Disable the matching GPO links** for the wave's OUs, population by population (Step 3.5), and watch again before the next workload or wave.

**Validate (exit criteria).** Success on the wave's population for every policy in the workload; no rise in attributable tickets; **VK-DG-05** shows only the planned membership changes; **VK-INT-05** shows no new conflict candidates; **VK-INT-01** still clean. When every division is in, set the workload's slider to **Intune** ([Phase 5](../b05-devices/08-gpo-to-intune-policy-migration.md#phase-5-workload-cutover-in-waves)).

### Step 5.2: rollback

Rollback is defined before each wave starts ([rollback](../b05-devices/08-gpo-to-intune-policy-migration.md#rollback)):

| What went wrong | Roll back by | Notes |
|---|---|---|
| A policy setting breaks an application or the user experience | Reassign a policy that sets the previous value to the affected groups; re-enable the GPO link for the population if it was disabled | In Pilot Intune, unassigning doesn't remove settings |
| A workload misbehaves on co-managed devices | Move that workload's slider back to Configuration Manager | Some state, such as Windows and Office versions, stays |
| A rule change or bulk write moved devices into the wrong groups | Restore the previous rule from Git, or rewrite the previous attribute values from the provenance record; pause processing first for a large change | VK-DG-05 against the pre-wave snapshot shows what to reverse |
| Compliant-device enforcement blocks a population | Book 04's Conditional Access rollback: return the policy to report-only ([rollback](../b04-access/07-the-conditional-access-policy-library.md#rollback)) | Fix the compliance signal, not the access policy |
| GPO already deleted | Restore from backup and re-link | Why Phase 7 waits 90 days |

: Rollback per failure, by wave {.striped .hover}

**Test rollback once** on the pilot division before the first production wave: re-enable one link, reassign one prior-value policy, move one slider back, and record the time each took *(design guidance)*.

## Gate 6: operating it

Once a population is cut over, the track runs as a loop: snapshot, compare, classify, alert, remediate, verify ([Chapter 10, drift detection](../b05-devices/10-operating-and-evidencing-the-fleet.md#drift-detection-and-alerting)). The validation kit runs the read-only side of it on a schedule.

### Step 6.1: stale-device cleanup

Stale objects still match dynamic rules and inflate the inventory, so clean them up on Microsoft's guidance, in this order ([Chapter 10, stale records](../b05-devices/10-operating-and-evidencing-the-fleet.md#stale-records)):

1. **Find candidates** with **VK-INT-02**: no sign-in or check-in beyond the threshold, and hybrid-joined devices that also have a registered or joined record. Microsoft advises at least 21 days, because the activity timestamp isn't updated on every sign-in;[^iti-stale-devices] the program uses 90 days for Windows in Intune.
2. **Retire in Intune first**, export BitLocker recovery keys (deleting the device deletes them), then disable the Entra object for a grace period before deleting it.[^iti-stale-devices]
3. **Clean hybrid-joined devices in Active Directory** and let sync carry it, and don't delete system-managed Autopilot devices from Entra ID.[^iti-stale-devices]
4. **Don't count on Intune cleanup rules**: they only hide records after 30 to 270 days and leave the Entra object.[^iti-intune-cleanup] Prevent the hybrid dual state at its source ([companion guide](attribute-driven-migration.md#dynamic-device-groups-intune-track)).

A device leaving the fleet follows Book 05's retirement sequence, with the Entra object deleted last ([Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#device-inventory-reconciliation)).

### Step 6.2: drift

Run the checks on a schedule and route findings to the owner of the source, because a finding is closed at the origin, not in the copy ([Chapter 03](../b05-devices/03-where-device-and-server-data-lives.md#the-rule)).

| Cadence | Check | What a finding usually means | Fix at |
|---|---|---|---|
| Daily | VK-INT-01 | An asset-record change the provisioning service didn't write, or a device enrolled outside the path | Provisioning service or the asset record |
| Daily | VK-DG-05 | A rule edit, a bulk write or a writer that shouldn't exist | Git rule history; the writer list |
| Weekly | VK-INT-02 | Reimaging duplicates, broken hybrid trust, devices in drawers | The stale-device procedure |
| Weekly | VK-INT-03 | A tag outside the vocabulary or a supplier registering without one | Procurement intake; the supplier |
| Weekly | VK-INT-04, VK-INT-05 | A policy assigned outside the register, or two policies owning a setting | The setting register and the library |
| Weekly | VK-DG-06 | A group left paused, or a `memberOf` rule | Group owner |
| Monthly | VK-INT-06 | A platform reaching end of support, or a new device class | The coverage matrix and tiers |

: The track's drift checks and where each finding is fixed (design guidance) {.striped .hover}

The weekly reconciliation of Intune, Entra ID and Defender inventories is the core of the loop ([device inventory reconciliation](../b05-devices/10-operating-and-evidencing-the-fleet.md#device-inventory-reconciliation)). Log Analytics exports can take up to 48 hours, so Tier 0 and per-setting status come from Graph ([what Log Analytics receives](../b05-devices/10-operating-and-evidencing-the-fleet.md#what-log-analytics-receives-and-when)). Book 05's drift classes for net-new devices ([Chapter 04](../b05-devices/04-intune-first-onboarding.md#validation-drift-classes-and-evidence)) mostly surface through VK-INT-01 and VK-INT-03.

### Step 6.3: evidence

The program's evidence is the records the services keep, exported on a schedule and retained. The control wording and the full evidence table are in [Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads); the mapping is the program's reading, and the agency's authorizing official and assessors decide whether a control is satisfied ([federal requirements](attribute-driven-migration.md#federal-requirements)).

| Requirement | Evidence this track produces | Checks that feed it |
|---|---|---|
| CM-2 Baseline Configuration | The policy library exported as JSON from Graph, under version control with its review history; the setting register | VK-INT-04, VK-INT-05 |
| CM-6 Configuration Settings | Per-setting status reports; the exception register with approvals, including every GPO link that remains; Intune audit logs of every policy change | VK-INT-05; `IntuneAuditLogs` |
| CM-7 Least Functionality | Attack surface reduction in block mode with its audit-to-block decisions, firewall rules, the Edge extension allow list | Policy status for ES-003, ES-005, SC-003, SC-010 |
| CM-8 System Component Inventory | The weekly reconciliation with findings and their closure; the tier assignment for every device outside Intune; provisioning-written attributes on every managed device | VK-INT-01, VK-INT-02, VK-INT-06 |
| CM-3 Configuration Change Control (supporting) | Rule and policy changes through the repository and change record; the provisioning service's provenance records | VK-DG-05; Git history |
| OMB M-22-09, devices (§III.B): a reliable asset inventory through CDM, and EDR | The reconciled inventory, fed to CDM; Defender for Endpoint onboarding on every managed device | VK-INT-02, VK-INT-06; reconciliation |
| OMB M-22-09, identity (§III.A): at least one device-level signal in authorization | Device compliance read by Conditional Access; compliance records | Compliance export; Book 04's sign-in reports |

: Evidence for the track's controls (the program's mapping, from Book 05 Chapter 10 and Book 11 Appendix A) {.striped .hover}

The M-22-09 rows follow [Book 11, Appendix A](../b11-zero-trust/appendix-a-requirements-mapping.md#omb-m-22-09-objectives-and-actions), and CDM's role follows [Book 12, Chapter 01](../b12-security-operations/01-you-cant-defend-what-you-cant-see.md#bod-23-01-and-cdm-the-asset-denominator). IA-3 is evidenced by the same compliance records ([federal requirements](attribute-driven-migration.md#federal-requirements)), and Book 05 maps the evidence to FedRAMP 20x indicators ([Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#fedramp-20x-key-security-indicators)).

**Validate Gate 6.** The checks run on their cadence with results retained; each evidence row has a named producer and a retention location; the first monthly evidence package has been assembled from them once, end to end.

## Checklist

| Gate | Check |
|---|---|
| 0 | Intune and Entra ID P1 entitlements confirmed for the tenant's cloud · Device-only licensing decided for userless devices, knowing it excludes Conditional Access · Least-privileged Intune roles assigned; Intune Administrator PIM-eligible, break-fix only · Every platform in the coverage matrix or a tier (VK-INT-06) · Windows 10 and path D devices as dated exceptions |
| 1 | Value lists and group-tag vocabulary published under change control · Suppliers register with tags · Personal Windows enrollment blocked · Provisioning service is the only writer, app-only with `Device.ReadWrite.All` and a certificate · Other write paths removed or recorded · VK-INT-01 and VK-INT-03 clean on the pilot · First VK-DG-05 snapshot |
| 2 | Device rules on device attributes only, with the `accountEnabled` guard · Tiers mutually exclusive, unpositioned matches none · Filters for time-sensitive assignment; no dynamic device group exclusions · User settings to user groups · Setting register with one owner per setting · VK-DG-03, VK-DG-04, VK-DG-06, VK-INT-04, VK-INT-05 clean |
| 3 | Every GPO exported, analysed, tagged and disposed · User and computer halves split · Library built unassigned and peer reviewed · Report-only ring on Windows; Apple and Android excluded from report-only compliance policies · Pilot conflicts explained · Links disabled, not GPOs deleted · Preference items cleared or owned |
| 4 | Every danger in the companion table mitigated and checked · Membership-delta alerts on · Bulk-change pause procedure written |
| 5 | Entry criteria met per wave · 72-hour watch per ring · Rollback written per wave and tested once on the pilot · Sliders at Intune when every division is in |
| 6 | Stale-device procedure on Microsoft's guidance, keys exported before deletes · Drift checks scheduled and routed to source owners · Evidence for CM-2, CM-6, CM-7, CM-8 and M-22-09 produced and retained |

: Intune track checklist {.striped .hover}

::: {.callout-tip}
## Back to the books
- [Book 05 — Devices](../b05-devices/index.md): [Chapter 03](../b05-devices/03-where-device-and-server-data-lives.md) for where device data lives, [Chapter 04](../b05-devices/04-intune-first-onboarding.md) for Intune-first onboarding, [Chapter 07](../b05-devices/07-the-gpo-sunset-program.md) and [Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md) for the GPO sunset, [Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md) for operations and evidence.
- [Book 04 — Access & Privilege](../b04-access/index.md) for the Conditional Access policies that consume device compliance.
- The [Attribute-Driven Migration companion guide](attribute-driven-migration.md) for the map of all four tracks, and the [Ansible guide](ansible-configuration-automation.md) for tier-2 configuration outside Intune.
- The [Endpoint & Device Modernization project plan](../../project-plans/endpoint-device.md) for the schedule.
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.0**, in [edition 2026.10](../../about/archive.md#edition-2026-10) (October 31, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/intune-track-implementation.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (3 merged changes since the guide began) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->

[^iti-licensing]: Microsoft Learn, "Microsoft Intune licensing" (Plans 1, 2 and the Suite; licence required for any user or device that benefits from the service; device-only licences and their limitations, no app protection policies or Conditional Access; unlicensed admin access for tenants created after July 2021), <https://learn.microsoft.com/intune/fundamentals/licensing> (accessed Oct 29, 2026).
[^iti-dyn-rules]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," sections "Rules for devices" and "Considerations for dynamic membership groups" (device rules reference only device attributes; attribute write permissions; Entra ID P1 per unique user, no licence for devices in device-based groups; rule builder for user rules only), <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 29, 2026).
[^iti-intune-roles]: Microsoft Learn, "Role-based access control (RBAC) with Microsoft Intune," "Built-in roles," <https://learn.microsoft.com/intune/fundamentals/role-based-access-control/overview>, and "Built-in role permissions for Microsoft Intune," "Policy and Profile manager," <https://learn.microsoft.com/intune/fundamentals/role-based-access-control/ref-built-in-roles> (both accessed Oct 29, 2026).
[^iti-dyn-validate]: Microsoft Learn, "Validate rules for dynamic membership groups in Microsoft Entra ID" (at least Groups Administrator; up to 20 users or devices at a time), <https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-validation> (accessed Oct 29, 2026).
[^iti-device-update]: Microsoft Learn, "Update device," Microsoft Graph v1.0, "Permissions" (delegated `Directory.AccessAsUser.All`; application `Device.ReadWrite.All`, higher `Directory.ReadWrite.All`; app-only and non-Windows calls update only `extensionAttributes`; Intune Administrator the least-privileged delegated role) and Example 2, <https://learn.microsoft.com/graph/api/device-update?view=graph-rest-1.0> (accessed Oct 29, 2026).
[^iti-device-resource]: Microsoft Learn, "device resource type," Microsoft Graph v1.0, property `extensionAttributes` (mastered in the cloud; set on creation or update; supports `$filter` with `eq`, `not`, `startsWith` and `eq` on null), <https://learn.microsoft.com/graph/api/resources/device?view=graph-rest-1.0> (accessed Oct 29, 2026).
[^iti-ap-update]: Microsoft Learn, "updateDeviceProperties action," Microsoft Graph v1.0 (Autopilot device identity; `groupTag` parameter; `DeviceManagementServiceConfig.ReadWrite.All`, delegated and application), <https://learn.microsoft.com/graph/api/intune-enrollment-windowsautopilotdeviceidentity-updatedeviceproperties?view=graph-rest-1.0> (accessed Oct 29, 2026).
[^iti-autopilot]: Microsoft Learn, "Create device groups for Windows Autopilot" (`[ZTDid]` rule for all Autopilot devices; the group tag maps to the Entra device `OrderID`), <https://learn.microsoft.com/autopilot/enrollment-autopilot> (accessed Oct 29, 2026, as verified in the companion guide).
[^iti-filter-props]: Microsoft Learn, "App and device properties, operators, and rule editing when creating assignment filters in Microsoft Intune," "Managed device properties," <https://learn.microsoft.com/intune/fundamentals/filters/ref-device-properties> (accessed Oct 29, 2026, as verified in the companion guide).
[^iti-intune-assign]: Microsoft Learn, "Assign policies in Microsoft Intune" (user groups versus device groups; dynamic device group processing time; assignment filters on user groups or All devices for time-sensitive scenarios; dynamic device groups not recommended as exclusions), <https://learn.microsoft.com/intune/device-configuration/assign-device-profile> (accessed Oct 29, 2026, as verified in the companion guide).
[^iti-filters]: Microsoft Learn, "Use assignment filters to assign your apps, policies, and profiles in Microsoft Intune," "How assignment filters work" and "Restrictions" (up to 200 filters per tenant; 3,072 characters each; managed devices must be enrolled; managed-app filters apply to app protection and app configuration policies only), <https://learn.microsoft.com/intune/fundamentals/filters/overview> (accessed Oct 29, 2026).
[^iti-dyn-processing]: Microsoft Learn, "Understand and manage dynamic group processing in Microsoft Entra ID" (pausing groups for large changes; wait at least 24 hours), <https://learn.microsoft.com/entra/identity/users/manage-dynamic-group> (accessed Oct 29, 2026, as verified in the companion guide).
[^iti-ca-report-only]: Microsoft Learn, "Analyze Conditional Access policy impact," "Overview" (report-only policies requiring a compliant device can prompt macOS, iOS and Android users to select a device certificate; exclude those platforms), <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-report-only> (accessed Oct 29, 2026).
[^iti-stale-devices]: Microsoft Learn, "How To: Manage stale devices in Microsoft Entra ID" (activity timestamp and the 21-day caution; disable before delete; retire MDM-controlled devices first; hybrid-joined devices cleaned up in AD and synced; don't delete system-managed Autopilot devices; BitLocker keys deleted with the device), <https://learn.microsoft.com/entra/identity/devices/manage-stale-devices> (accessed Oct 29, 2026, as verified in the companion guide).
[^iti-intune-cleanup]: Microsoft Learn, "Device cleanup rules" (hide devices that haven't checked in for 30 to 270 days; hidden devices aren't removed from Microsoft Entra ID), <https://learn.microsoft.com/intune/governance/configure-cleanup-rules> (accessed Oct 29, 2026, as verified in the companion guide).
