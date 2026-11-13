---
title: "Chapter 04 — Intune-First Onboarding"
description: "How net-new devices enter governance from day zero: the doctrine, the five-phase procure-to-validate process, Windows Autopilot and Autopilot device preparation, enrollment restrictions, naming, group tags, the Enrollment Status Page, compliance and configuration baselines, other platforms, exceptions and drift."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b05-devices
book: B05
part: What
series-order: 4
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 04 — Intune-First Onboarding

*Migration brings an existing device under governance; Intune-first refuses to let an ungoverned device exist in the first place.*

::: {.callout-note}
## In this chapter
The doctrine for devices that have never been on the network: what Intune-first means, its five pillars and four exception paths, and the five-phase process that carries an organizational assignment from the purchase order to a validated, compliant device. The Windows mechanics in detail (Windows Autopilot versus Autopilot device preparation, registration and group tags, enrollment restrictions, naming, the Enrollment Status Page, and the compliance and configuration baseline), then the other platforms, and the drift checks that catch a device that slipped through.
:::

::: {.callout-important}
## Scope: net-new devices only
This chapter covers devices the organization buys after the modernization decision. Replacing Group Policy on the existing fleet is a different program, with different stakeholders and a different timeline: the GPO Sunset Program in [Chapter 07](07-the-gpo-sunset-program.md) and [Chapter 08](08-gpo-to-intune-policy-migration.md). The program reserves the phrase "Intune-first" for this net-new doctrine and doesn't use it for the GPO replacement work. Servers follow the same doctrine through Azure Arc, and their mechanics are in [Chapter 09](09-servers-under-azure-arc.md).
:::

## What Intune-first means

A net-new asset (a laptop just unboxed, a phone just issued, a server just racked) is governed from the moment it first powers on: by Intune for endpoints, and by Azure Arc into the same governance plane for servers. There is no intermediate state where the device:

- joins on-premises Active Directory and waits for a future migration;
- is provisioned by Configuration Manager and co-managed later;
- runs without an organizational assignment;
- enters production without a compliance evaluation; or
- skips the procurement-side step that records its organizational position.

That's the inverse of the directory migration path in Book 02 ([Chapter 04 of Book 02](../b02-identity/04-the-hidden-migration-surface.md)). Migration takes a device that already exists and brings it under governance. Intune-first refuses the existence of an ungoverned device.

It's also where Microsoft points new hardware. Microsoft describes hybrid join as an interim step on the road to Entra join,[^c04-device-identity] and its join guidance makes Entra join the default for new, refurbished or reset Windows devices ([Chapter 02](02-the-hybrid-join-trap.md)).

## Why the doctrine exists

The program already had a mature canon for migrating AD-joined endpoints into Entra ID and Intune. It had no operating doctrine for devices bought new. Without one, net-new acquisition followed an implicit pattern with three failure modes:

1. **Organizational assignment was missed at procurement.** Devices ended up wherever a runtime script that derived position from the user placed them, not where procurement intended.
2. **Platforms were handled inconsistently.** Windows had Autopilot; macOS, iOS, Android and servers each had bespoke handling.
3. **Co-management crept in.** Net-new Windows endpoints sometimes went into Configuration Manager co-management because it was convenient. Each one was a future migration ticket and a present compliance gap.

## The five pillars

These are the program's doctrine, not Microsoft requirements.

| # | Pillar | What it asserts |
|---|---|---|
| 1 | No ungoverned device, ever | Every asset is governance-enrolled before it moves to production use. Quarantine (`/UNPOSITIONED`) is the safety valve, not the steady state. |
| 2 | Procurement is the first governance step | The organizational assignment is set when the purchase order is issued, not when the device arrives. Procurement systems feed the governance pipeline the way HR systems feed user provisioning. |
| 3 | Zero-touch only | Manual enrollment is a controlled exception that needs written justification, compensating controls, a finite duration and an audit entry. |
| 4 | One management plane per asset; no co-management for new assets | Intune for endpoints. Azure Arc with Azure Policy machine configuration for servers. No greenfield Configuration Manager, no greenfield Group Policy, no greenfield hybrid join. |
| 5 | Quarantine on failure; never silently degrade | An onboarding failure produces a quarantine entry and a governance ticket, never a production device running in a degraded state. |

Pillar 4 also governs the existing Configuration Manager footprint: it gets no new infrastructure for new assets, so a distribution point refresh shrinks the content tier rather than renewing it. The [Distribution Point Consolidation decision guide](../guides/dp-consolidation.md) sets out the questions to answer before funding one, the [implementation guide](../guides/dp-consolidation-implementation.md) runs the consolidation alongside the co-management workload shifts, and the [Content Delivery Modernization plan](../../project-plans/content-delivery.md) schedules it.

Pillar 4 keeps servers out of the Intune Settings Catalog. Intune's supported platforms don't include Windows Server,[^c04-platforms] so the Settings Catalog doesn't reach a server. Server configuration is set by Azure Policy machine configuration, and Intune endpoint security policies reach servers only through Defender for Endpoint security settings management ([Chapter 09](09-servers-under-azure-arc.md)).[^c04-mde-ssm]

## Where the organizational assignment comes from

Every enrolled device carries a governance attribute. The program fills it from the first source that can supply one, in this order:

1. **The procurement record.** The organization decided to buy the asset for a specific purpose and place.
2. **The vendor or program carrier.** The supplier or enrollment program carries the intended attributes, such as an Autopilot group tag or an Apple Business Manager assignment.
3. **User derivation.** The fallback when no procurement record exists, such as personally owned devices or historical inventory.
4. **Unpositioned.** An explicit marker when nothing can supply a value. No enrolled device carries an empty governance attribute.

Procurement-first ordering gives three properties. It's deterministic: the attribute reflects the purchase decision, not the technician who powered the device on. It's auditable: there's a chain of custody from purchase order to production. And it covers devices with no user: shared and self-deploying devices are stamped correctly before anyone signs in. The unpositioned marker keeps dynamic group membership and drift detection deterministic from day zero, because a known "nowhere" is still a value a rule can match.

## The five-phase process

Every net-new asset follows the same five phases, whatever the platform. What changes per platform is the vendor program used in phase 2 and the enrollment vector used in phase 4.

![Five phases carry the organizational assignment from the purchase order to a validated device; a failure at any gate quarantines the device instead of degrading it.](../../images/diagrams/b05-devices/svg/ch04-five-phases.svg){#fig-ch04-five-phases fig-alt="A top-to-bottom flow of five cards. Phase 1, Procure, owned by procurement: approved purchase order with the organizational assignment, gated on validation against the organizational registry. Phase 2, Pre-stage, owned by procurement and the vendor: vendor program record such as an Autopilot registration with group tag or an Apple Business Manager assignment, gated on the record carrying the assignment. Phase 3, Position, owned by the governance pipeline: mapping committed to the governance repository and reviewed. Phase 4, Provision, by the end user or IT with zero-touch: enrolled, assigned, compliant device, gated on compliance returning Compliant and Conditional Access granting access. Phase 5, Validate, owned by the governance pipeline: validation record in the audit log. Phases 1 to 4 are blue and phase 5 is green. A red card on the right labeled Quarantine, UNPOSITIONED plus a governance ticket, receives dashed red arrows labeled gate fails from phase 3, phase 4 and phase 5."}

| Phase | Owner | Trigger | Output | Gate to the next phase |
|---|---|---|---|---|
| 1. Procure | Procurement | Business request for an asset | Approved purchase order with the organizational assignment | Assignment validated against the organizational registry |
| 2. Pre-stage | Procurement and vendor | Purchase order sent to the vendor | Vendor program record (Autopilot registration, Apple Business Manager assignment and so on) | The vendor record carries the organizational assignment |
| 3. Position | Governance pipeline | Vendor confirms registration | Procurement-side mapping table entry, keyed on serial number | Mapping committed to the governance repository and reviewed |
| 4. Provision | End user (zero-touch) or IT (assisted zero-touch) | Asset arrives at the recipient's location | Enrolled, assigned, compliant device | Compliance policy returns *Compliant*; Conditional Access grants access |
| 5. Validate | Governance pipeline | The device's first compliance evaluation completes | Validation record in the governance audit log | All phase 5 checks pass; device leaves quarantine if it was in it |

The program's latency target is 14 calendar days from purchase order to production-governed for standard hardware, and 5 calendar days for expedited orders.

Phase 3 doesn't pre-stage an Entra ID device object. For classic Autopilot that object isn't something the pipeline creates: Autopilot creates it automatically when the device is registered.[^c04-ap-registration] Phase 3's job is to confirm that the registration exists, carries the right group tag, and matches the procurement record.

### Procurement intake fields

Phase 1 is where the doctrine departs most from past practice. The organizational assignment is captured at purchase order time in structured fields:

- `recipient_upn` and `recipient_org_attributes`, resolved from Entra ID;
- `asset_class` (Windows endpoint, macOS endpoint, iOS tablet and so on);
- `asset_assignment_type` (personal, shared, kiosk, lab or service);
- `asset_org_attributes` and `asset_orgnodeid`, validated against the organizational registry; and
- `vendor` and `vendor_program` (Autopilot through the OEM or reseller, Apple Business Manager, Android zero-touch, Samsung Knox Mobile Enrollment, or Arc for servers).

The procurement system commits the order as a structured record in the governance repository and writes the organizational assignment to the vendor program in phase 2.

## Windows: Autopilot or Autopilot device preparation

Microsoft now ships two Windows provisioning solutions. Windows Autopilot device preparation is a re-architecture of Windows Autopilot with a simpler configuration and near real-time reporting. Classic Windows Autopilot remains more feature-rich.[^c04-ap-faq] The differences that matter for this doctrine:[^c04-ap-compare]

| Requirement | Autopilot device preparation | Windows Autopilot |
|---|---|---|
| Device registration required | No | Yes |
| Bind devices to the tenant before enrollment | Yes, through device association | Yes, through registration |
| Group tag on the registration | Not applicable (no registration) | Yes |
| Microsoft Entra join | Yes | Yes |
| Microsoft Entra hybrid join | No | Yes |
| User-driven | Yes | Yes |
| Pre-provisioned and self-deploying | No | Yes |
| Windows 10 | No | Yes |
| More than 25 apps or 10 PowerShell scripts during setup | No | Yes |
| Block the desktop until user-based configuration is applied | No | Yes |
| What admins configure | Device preparation policy, plus a device security group owned by the Intune Provisioning Client | Deployment profile, plus the Enrollment Status Page |

### Which one, in a GCC tenant

The workbook assumes a Microsoft 365 GCC tenant. Intune doesn't have a separate GCC instance; GCC uses the commercial Intune service, so both solutions are available.[^c04-intune-gov]

The program's recommendation for a GCC tenant is **classic Windows Autopilot, user-driven, with Microsoft Entra join, and OEM or reseller registration carrying a group tag**, as the default for standard hardware. The reason is pillar 2. Classic Autopilot's registration carries the procurement attribute (group tag and purchase order ID) from the vendor to the Entra ID device object before the device is powered on. Device preparation has no registration and no group tag. Since August 2026 it offers *device association*, which binds a device to the tenant before enrollment, marks it corporate-owned, and can assign it a device-targeted policy and a name template; but association starts from device information exported on the device itself during setup and uploaded one device per file, so it's an administrator-side binding, not a vendor-side carrier.[^c04-ap-assoc] Without a vendor carrier, devices are added to a device group at enrollment time,[^c04-ap-overview] and the organizational assignment has to come from the procurement mapping table after enrollment.

Use device preparation where its advantages matter (a simpler policy, faster provisioning, or mixing Win32 and line-of-business apps in one deployment), and carry the attribute from the serial-number mapping table in phase 3. Don't use either solution with hybrid join for new devices; that's what pillar 4 forbids.

Device preparation requires Windows 11 version 24H2 or later, or version 23H2 or 22H2 with KB5035942 or later. Installation media dated April 2024 or later includes that update. It needs Microsoft Entra automatic enrollment configured, and the first user who signs in must be allowed to join devices to Entra ID.[^c04-ap-dp-req] That last requirement is a governance point: on the device preparation path, the user's own join permission is what brings the device in.

### Registration and group tags

Registration binds the hardware hash to the tenant. The OEM, reseller or distributor should do it at purchase, which is also what makes it zero-touch. An OEM or reseller can register devices only after the organization's Global Administrator authorizes it. Microsoft calls out that this one feature needs the Global Administrator role and recommends least-privileged roles everywhere else.[^c04-ap-oem] Plan that consent as a one-time, recorded approval per supplier. Manual registration, harvesting the hash from a running device, is intended mainly for testing and evaluation.[^c04-ap-manual]

![Classic Autopilot carries the procurement decision to the device's configuration: the group tag on the registration becomes an OrderID on the Entra ID device, which a dynamic group matches.](../../images/diagrams/b05-devices/svg/ch04-assignment-carrier.svg){#fig-ch04-assignment-carrier fig-alt="Four cards left to right. A violet card tagged procurement, purchase order, holding the organizational node code and serial number. An arrow labeled phase 2 leads to a blue card tagged OEM or reseller, Autopilot registration, whose group tag holds the node code. An arrow labeled registration creates object leads to a blue card tagged Entra ID, device object, with the node code as an OrderID entry in its physical IDs. A green arrow labeled membership rule leads to a green card tagged Entra ID, dynamic device group, where the Autopilot profile, compliance and configuration are assigned."}

The group tag Intune stores on the registration appears on the Entra ID device as an `[OrderID]` physical ID, and the purchase order ID appears as `[PurchaseOrderId]`.[^c04-ap-hololens] Dynamic groups match on them.

The group tag vocabulary, the single writer for device attributes and the checks that prove both are [Gate 1 of the Intune track implementation guide](../guides/intune-track-implementation.md#gate-1-device-sources-and-the-single-writer).

::: {.callout-warning}
## Illustrative, not tested against a production tenant
The rules and commands in this chapter are examples. Test each one in a non-production scope and check the resulting group membership before you assign policy to it.
:::

```text
All Windows Autopilot devices
(device.devicePhysicalIDs -any (_ -startsWith "[ZTDid]"))

Devices whose group tag is a given organizational node
(device.devicePhysicalIds -any _ -eq "[OrderID]:ORG-0420")

Devices bought on a given purchase order
(device.devicePhysicalIds -any _ -eq "[PurchaseOrderId]:76222342342")
```

The rule syntax is Microsoft's;[^c04-dynamic-rules] the `ORG-0420` value is an example of an organizational node code. The program's convention is that the group tag carries the organizational node identifier from the procurement record, never a free-text department name, so a reorganization changes the mapping table, not thousands of registrations. The Autopilot profile, compliance policies and configuration profiles are then assigned to those groups, which is how the procurement decision reaches the device's configuration without anyone touching it.

### Enrollment restrictions

Enrollment restrictions decide which devices may enroll at all. For Intune-first, the important one is the device platform restriction that blocks personally owned Windows devices. With it in place, Intune authorizes a Windows enrollment as corporate only through approved paths, and Windows Autopilot is one of them.[^c04-restrictions] Devices provisioned through device preparation are treated as corporate but blocked by a personal-device restriction unless they're defined by corporate identifiers (serial number, manufacturer and model uploaded in advance) or bound to the tenant by device association.[^c04-corp-ids]

That gives the doctrine its enforcement point. With personal Windows enrollment blocked, a device that wasn't registered or pre-identified by procurement can't enroll as corporate. It fails with an enrollment restriction error, which is exactly the pillar 5 behavior: quarantine, not silent degradation. Allow personal Windows enrollment only for the specific user groups that need it, which is also Microsoft's advice.[^c04-unblock]

### Naming

Classic Autopilot profiles can apply a device name template. Names must be 15 characters or fewer, use letters, numbers and hyphens, and can't be all numbers. The `%SERIAL%` macro inserts the hardware serial number and `%RAND:x%` inserts x random digits.[^c04-ap-profile] The program's convention is a short, fixed prefix for the asset class followed by `%SERIAL%`, truncated to fit 15 characters, because the serial number is the procurement join key ([Chapter 03](03-where-device-and-server-data-lives.md)). Device preparation can also apply a name template, up to 63 characters with the same macros, but only to devices bound through device association; it has no effect on devices onboarded with corporate identifiers only.[^c04-ap-dp-name] Organizational position doesn't go in the name. It goes in the group tag, where it can change without renaming the device.

### The Enrollment Status Page

The Enrollment Status Page (ESP) shows provisioning progress and can block the device until required policies and apps are installed. It runs in two phases: device setup during the out-of-box experience, then account setup for the first user. The default ESP assigned to all devices doesn't show app and profile progress; Microsoft recommends a custom ESP that does, because a user who signs in before the device is fully provisioned can cause problems.[^c04-ap-esp] A tenant can hold up to 51 ESP profiles (the default plus 50).[^c04-esp]

For Intune-first, configure the ESP to block device use until the security-critical items are installed: the compliance-relevant configuration, Defender, BitLocker and any agent the validation phase checks for. Use the **Selected** blocking-apps list rather than **All**, so that a non-critical app's failure doesn't strand a device, and don't let users bypass the ESP on an installation error for the security-critical list. The ESP list filters which assigned apps are tracked; it doesn't itself assign them.[^c04-esp]

Device preparation doesn't use the ESP. It applies only the apps and scripts selected in its policy during setup (up to 25 apps and 10 PowerShell scripts) and syncs policies assigned to the device group without tracking whether they've applied by the time the desktop appears.[^c04-ap-overview][^c04-ap-compare] On that path, the validation phase, not the setup screen, is what confirms the device reached its baseline.

## The compliance and configuration baseline

A net-new device should arrive at a known baseline before it's used. The baseline has two halves.

**Compliance**, which decides access. Set the tenant-wide **Mark devices with no compliance policy assigned as** to *Not compliant*, so an unassigned device can't pass Conditional Access by default; Microsoft recommends this whenever compliance feeds Conditional Access.[^c04-compliance] A Windows compliance policy for net-new devices typically requires BitLocker, Secure Boot and code integrity under device health; firewall, TPM, antivirus and antispyware under system security; Microsoft Defender Antimalware with current security intelligence and real-time protection; and a minimum OS version.[^c04-bp-compliance] With Defender for Endpoint connected, add **Require the device to be at or under the machine risk score**.[^c04-mde-risk] The access-policy side, Conditional Access requiring a compliant device, is in [Book 04](../b04-access/index.md).

**Configuration**, which sets the device up. Start from Microsoft's security baselines in Intune: the Security Baseline for Windows 10 and later (version 25H2 is the latest Windows baseline) and the Microsoft Defender for Endpoint baseline. Existing baseline profiles don't update to a new version automatically, and different baselines can set the same setting to different defaults, so review overlaps before you deploy more than one.[^c04-baselines] Then add BitLocker with recovery-key escrow to Entra ID, Windows Hello for Business ([Chapter 10 of Book 02](../b02-identity/10-migrating-and-governing.md)), firewall profiles and Windows LAPS. Because these devices never had Group Policy, there's no GPO conflict to resolve; that's the payoff of Intune-first, and [Chapter 08](08-gpo-to-intune-policy-migration.md) covers the existing fleet where there is one.

## Other platforms

The five-phase process is platform-neutral. Each platform has its own vendor program and its own carrier for the organizational assignment.

| Platform | Vendor program | Assignment carrier | Management state |
|---|---|---|---|
| Windows endpoint | Windows Autopilot (OEM or reseller registration) or Autopilot device preparation | Group tag; or the mapping table for device preparation | Microsoft Entra joined, Intune enrolled |
| Microsoft Surface | Surface registration through Microsoft or an authorized partner | Group tag; DFCI profile for firmware settings | Entra joined; firmware managed through DFCI |
| macOS | Apple Business Manager or Apple School Manager, Automated Device Enrollment | Assignment to the Intune enrollment profile | Supervised, ADE-enrolled |
| iOS and iPadOS | Apple Business Manager or Apple School Manager, Automated Device Enrollment | Assignment to the Intune enrollment profile | Supervised |
| Android | Android Enterprise zero-touch or Samsung Knox Mobile Enrollment | Enrollment profile or managed configuration | Fully managed (corporate-owned) |
| Linux workstation | Intune enrollment through the Microsoft Intune app | Mapping table | Intune managed |
| Server (Windows Server 2025, Linux) | Azure Arc onboarding | Azure resource tag on the Arc machine | Workgroup plus Arc; Entra ID sign-in on Windows Server 2025 ([Chapter 09](09-servers-under-azure-arc.md)) |

A few facts behind the table, current as of October 2026:

- Devices enrolled through an Apple device enrollment program, Windows Autopilot, Knox Mobile Enrollment, Android Enterprise corporate-owned methods and Google zero-touch are marked corporate-owned automatically.[^c04-corp-ids]
- Intune supports Linux on Ubuntu Desktop 24.04 and 26.04 LTS and Red Hat Enterprise Linux 9 and 10.[^c04-platforms]
- DFCI management for Surface works only with classic Autopilot; device preparation doesn't support it.[^c04-ap-compare]

## The four exception paths

Doctrine carve-outs for cases that can't follow the main path. Each needs written justification, a compensating control and an audit entry.

| Path | Applies to | Why it's permissible |
|---|---|---|
| A. User-driven enrollment for personal devices | Personally owned devices enrolled into a work profile or partition (iOS user enrollment, Android work profile, Windows registered) | Refusing to govern personal devices pushes users to unmanaged access through personal browsers. Governed at a lower assurance level is better than ungoverned. |
| B. Linux endpoint with an Arc fallback | Linux endpoints that can't use Intune's Linux management (developer workstations that need root, embedded Linux, air-gapped hosts) | Intune's Linux support covers a limited set of distributions and desktop configurations;[^c04-platforms] Arc with Azure Policy machine configuration is the substitute governance plane. |
| C. Pre-2025 Windows servers | Windows Server 2019 and 2022 hosts whose OS upgrade isn't yet feasible | Entra ID sign-in for Arc-enabled Windows servers requires Windows Server 2025 or later with Desktop Experience.[^c04-arc-login] Arc-managed without Entra ID sign-in is an acceptable interim state. |
| D. Windows endpoints that can't enroll | Instrument and laboratory PCs locked to a vendor's validated image, operational technology workstations, and hosts in disconnected enclaves | Some devices can't take MDM without breaking a vendor certification, and some can't reach the cloud at all. Recording them as governed exceptions is better than leaving them outside the inventory. |

Exception C rests on Microsoft's support boundary, footnoted above, not on a program decision.

### Path D under the compliant-device policies

A Windows device that isn't enrolled in Intune can't pass a Conditional Access policy that requires a compliant device. Microsoft's **Require device to be marked as compliant** control supports only devices registered with Microsoft Entra ID and enrolled in Intune (on Windows, a supported partner MDM can also report compliance).[^c04-ca-grant] So every path D device is blocked from the resources behind CA004, CA016 and the other compliant-device policies in [Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md), and the program handles it in this order:

1. **Isolate it on the network first.** A disconnected or OT host stays on a segmented network with no route to cloud resources ([Book 09, Chapter 07](../b09-network/07-network-access-control.md)). With no sign-in to Microsoft Entra ID, Conditional Access isn't involved; the segment boundary is the control.
2. **Manage its Defender settings where it has connectivity.** Onboard the device to Microsoft Defender for Endpoint and apply Intune endpoint security policies through Defender for Endpoint security settings management, which is built for devices that can't enroll in Intune and registers the device in Microsoft Entra ID if it isn't already. It doesn't support non-persistent VDI or 32-bit Windows.[^c04-mde-ssm] It manages security settings; it doesn't make the device compliant for Conditional Access.[^c04-ca-grant]
3. **If its users must reach a protected cloud resource, record a named exclusion.** Put the accounts that use the device in an exclusion group. The group and the paired block policy below are this chapter's local design, not rows in Book 04's exclusion list or policy library, and a name such as `CA-Exclude-NonEnrollable-<device class>` is only an example. Give the group a named owner, a written justification, a review date no more than 90 days out, and the authorizing official's risk acceptance ([Chapter 06](06-who-owns-the-endpoint.md)). Pair the exclusion with a policy that blocks that group from every device not on the approved list, using a device filter on `deviceId` with the `NotIn` operator. That is Microsoft's pattern for letting specific accounts work only from specific devices, and a negative operator also catches unregistered devices.[^c04-ca-filter] Microsoft advises using exclusions sparingly and removing them as soon as possible.[^c04-ca-plan]
4. **Keep the compensating controls on.** The exclusion lifts only the device requirement: the authentication-strength and MFA policies still apply to the group, local administrator rights stay removed, and the device is recorded in the CMDB with its owner and review date.

The isolation-first order, the group name and the 90-day review are the program's design; the Conditional Access and Defender behavior is Microsoft's.

## Devices without a procurement record

Devices that predate the process, or arrive outside normal procurement, fall through to user derivation or the unpositioned marker. They surface as findings for governance review, with three possible outcomes: file a procurement record retroactively, reclassify the asset, or quarantine it for disposition.

## Enrollment controls, from automatic enrollment to decommissioning {#enrollment-controls}

The sections above describe the doctrine one mechanism at a time. This section is the procedure that puts the enrollment controls in place together and proves them: automatic enrollment, Windows Autopilot, ownership classification, enrollment restrictions, corporate identifiers, stale-device cleanup and decommissioning. Its acceptance test is simple to state and hard to fake: **the enrollment and cleanup reports match the procurement inventory**. A device in Intune with no procurement record, a procurement record with no enrolled device, or a corporate device marked personal is a finding. The conventions it follows (control states, the How-section template, authority labels and the evidence checklist) are defined once in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md).

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Devices
- **CISA ZTMM pillar:** Devices (asset and supply chain risk management; policy enforcement and compliance monitoring)
- **Depends on:** Identity: automatic enrollment and Autopilot run on the user's or device's Microsoft Entra identity ([Book 02](../b02-identity/index.md)); access decisions that read the enrolled state ([Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md))
- **Attack chain interrupted:** an unmanaged or unknown device reaching organizational data (Initial Access through a valid account on an unmanaged device); a lost or retired device still holding live credentials or keys (Credential Access)
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This section | Evidence |
|---|---|---|
| Designed | The ownership table and the restriction design below, recorded as decisions | Decision record per control, approved by the endpoint owner ([Chapter 06](06-who-owns-the-endpoint.md)) |
| Configured | Automatic enrollment scoped to a pilot group; restrictions and identifiers created | Export of the enrollment configurations and the corporate identifier list |
| Enforced | MDM user scope **All**; the personal-Windows block assigned to every user | The same export showing scope and assignments, and the exception register |
| Evidenced | The reconciliation run in [Evidence](#enrollment-evidence) below | The run's CSV files, dated, with the expected and observed counts |
| Operated | Weekly reconciliation, cleanup rules and the retirement sequence in [Chapter 10](10-operating-and-evidencing-the-fleet.md#device-inventory-reconciliation) | The run history and the closed findings |

A finding this section addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

### What each control does, and whose recommendation it is

| Control | What it does | Authority and applicability |
|---|---|---|
| Automatic enrollment (MDM user scope) | Enrolls a Windows device in Intune when a user in scope joins it to Microsoft Entra ID or adds a work account. **Some** scopes it to named groups, **All** to every user.[^c04-z-automdm] | Microsoft-recommended for Intune-managed Windows; **license-dependent**: automatic MDM enrollment is a Microsoft Entra ID P1 feature.[^c04-z-automdm-quick] |
| Windows Autopilot | Registers the hardware before first boot and marks the device corporate; [above](#windows-autopilot-or-autopilot-device-preparation) | Risk-based recommended (pillar 2); available in GCC, which uses the commercial Intune instance[^c04-intune-gov] |
| Ownership classification | Records each device as corporate or personal, which decides what Intune collects and which restrictions apply[^c04-corp-ids] | Microsoft-documented behavior; the classification table below is the program's design |
| Corporate identifiers | Pre-registers serial numbers (or, for Windows, manufacturer, model and serial) so that a device enrolling outside Autopilot is treated as corporate[^c04-corp-ids] | Optional where Autopilot or Automated Device Enrollment already marks the device corporate; risk-based recommended for device preparation |
| Platform restriction | Blocks personally owned Windows enrollment and sets OS floors per platform[^c04-z-platform] | Risk-based recommended. Microsoft states enrollment restrictions aren't security features: a compromised device can misrepresent itself, so they are a best-effort barrier for non-malicious users[^c04-restrictions] |
| Device limit restriction | Caps how many devices one user can enroll; the default policy's limit can be raised to at most 15[^c04-z-limit][^c04-z-limit-max] | Optional; set to the program's per-user allowance |
| Stale-device cleanup and decommissioning | Hides, retires, wipes and deletes records in a fixed order | Program design over Microsoft's mechanics, in [Chapter 10](10-operating-and-evidencing-the-fleet.md#stale-records) |

The ownership classification the program uses, from Microsoft's rules for how each enrollment path sets ownership:[^c04-corp-ids]

| Enrollment path | Ownership Intune records | Program use |
|---|---|---|
| Windows Autopilot, Apple Automated Device Enrollment, Android Enterprise fully managed or corporate-owned work profile, Knox Mobile Enrollment | Corporate, automatically | Every corporate device |
| Windows automatic enrollment with Entra join during setup, or Autopilot device preparation | Corporate, but blocked by a personal-device platform restriction unless the device matches a corporate identifier | Device preparation path only, with identifiers uploaded in phase 2 |
| **Add work account** in Windows Settings, the Company Portal app, or **Allow my organization to manage my device** in a Microsoft 365 app | Personal, unless it matches a corporate identifier | Blocked for Windows by the platform restriction; personal devices use app protection instead ([Chapter 08](08-gpo-to-intune-policy-migration.md#app-protection-policies)) |
| Apple account-driven User Enrollment, Android Enterprise personally owned work profile | Personal | The personally owned mobile path in [Chapter 10](10-operating-and-evidencing-the-fleet.md#compliance-architecture) |

Two facts about identifiers shape the design. Windows corporate identifiers apply only at enrollment time: after enrollment, the device's ownership follows the enrollment path in the table, and changing it means editing the device's ownership in the admin center. And account-driven User Enrollment on Apple devices can't use corporate identifiers, because the MDM never sees the serial number or IMEI.[^c04-corp-ids]

### Prerequisites

- **Licenses:** Intune Plan 1 for every user who enrolls; Microsoft Entra ID P1 for automatic MDM enrollment.[^c04-z-automdm-quick]
- **Roles:** Intune Administrator for platform restrictions and Intune Service Administrator for device limit restrictions (other built-in Intune roles are read-only for them);[^c04-z-platform][^c04-z-limit] Policy and Profile Manager or Intune Administrator for corporate identifiers.[^c04-corp-ids]
- **In place first:** the procurement intake fields from phase 1, so that every identifier upload has a purchase order behind it; the emergency access design in [Book 04](../b04-access/index.md), although nothing in this section blocks sign-in.
- **GCC availability**, from the Intune service description for US Government (read Nov 11, 2026):[^c04-intune-gov] automatic enrollment, enrollment restrictions, corporate identifiers and Windows Autopilot are available in GCC, which uses the commercial Intune instance. The Graph endpoint for corporate identifiers is documented for the global service.[^c04-z-graph-ids]

### Pilot

Set **MDM user scope** to **Some** and select a pilot user group (the endpoint engineering team, then a representative 5% of one division) before **All**.[^c04-z-automdm] Assign the personal-Windows block and the device limit to the same group first. Success is three things: every pilot device enrolls with the ownership the table above predicts, every enrollment failure in **Devices** > **Enrollment failures** has an explained reason (for a blocked personal device the reason reads **Enrollment restriction not met**),[^c04-corp-ids] and the reconciliation run below finds no unexplained mismatch.

### Report-only or audit phase

Enrollment controls have no report-only mode. The audit phase is the reconciliation run itself: run it against the pilot group daily for two weeks before widening scope, and read the enrollment failures report alongside it. Restrictions can be created and left assigned to an empty group, so their configuration can be reviewed before they act on anyone.

### Enforcement

Widen in the rings from [Change safety](../b00-orientation/appendix-d-control-states-and-evidence.md#change-safety): pilot group, then one division, then **All**. The exact enforcing steps are in the Intune admin center:

1. **Devices** > **Enrollment** > **Windows** > **Automatic Enrollment** > **Microsoft Intune**: **MDM user scope** to **All**; **WIP user scope** to **None** (a user in both scopes is enrolled on a corporate device and not on a personal one, which defeats the design).[^c04-z-automdm]
2. **Devices** > **Enrollment** > **Windows** > **Device platform restriction**: on the restriction assigned to all users, **Personally owned devices** to **Block** for Windows (MDM).[^c04-z-platform] Repeat for the iOS/iPadOS and Android tabs with the program's OS floor.
3. **Devices** > **Enrollment** > **Corporate device identifiers** > **Add** > **Upload CSV file**: upload the purchase order's identifiers before the devices ship. A Windows file has one `manufacturer,model,serial` line per device and no header; a mobile file has one serial number (or IMEI) per line; up to 5,000 rows or 5 MB per file, one identifier type per file.[^c04-corp-ids]

Run this on each new Windows device during the procurement pilot to capture the exact identifier string Intune will match (Microsoft's own command):[^c04-corp-ids]

```powershell
Get-CimInstance -ClassName Win32_ComputerSystem | ForEach-Object {$_.Manufacturer, $_.Model, (Get-CimInstance -ClassName Win32_BIOS).SerialNumber -join ','}
```

### Rollback

- Automatic enrollment: set **MDM user scope** back to **Some** (or **None**). Devices already enrolled stay enrolled; only new enrollments stop.
- Restrictions: edits apply to new enrollments only and don't affect devices already enrolled;[^c04-z-limit] remove the assignment, or lower the restriction's priority, to restore the previous behavior.
- Corporate identifiers: deleting an identifier for an enrolled device doesn't change that device's ownership.[^c04-corp-ids] A device marked corporate in error is changed to **Personal** in its properties, after which Intune deletes the app inventory it collected within seven days.[^c04-corp-ids]

Each step takes minutes and is run by an Intune Administrator under the change record.

### Exclusions

Not applicable to emergency access: enrollment controls don't block sign-in, and emergency access accounts don't enroll devices. The exclusions that do apply are recorded in the exception register with an owner and a review date of no more than 90 days: users allowed to enroll a personal Windows device (Microsoft's advice is to allow it only for the specific groups that need it),[^c04-unblock] device enrollment manager accounts (which bypass the per-user device cap),[^c04-z-limit-max] and path D devices from [the four exception paths](#the-four-exception-paths).

### Telemetry

- **Devices** > **Enrollment failures**, with the failure reason per attempt.[^c04-corp-ids]
- The status column on **Corporate device identifiers**: *Enrolled*, *Not contacted*, *Not applicable* or *Failed*.[^c04-corp-ids]
- `IntuneOperationalLogs` in Log Analytics, which records enrollment events ([Chapter 10](10-operating-and-evidencing-the-fleet.md#what-log-analytics-receives-and-when)).
- The weekly reconciliation in [Chapter 10](10-operating-and-evidencing-the-fleet.md#device-inventory-reconciliation) and the five drift checks [below](#validation-drift-checks-and-evidence).

### Evidence {#enrollment-evidence}

::: {.callout-warning}
## Illustrative, not tested against a production tenant
The script below is read-only and illustrative. Run it first against a test tenant.
:::

Replace `<procurement-export.csv>` with the procurement system's export of open and delivered orders; it needs a `SerialNumber` column. The corporate identifier call uses the beta endpoint, which Microsoft supports but changes more often.[^c04-z-graph-ids]

```powershell
# Read-only. Enrollment and cleanup evidence, matched to the procurement inventory.
Connect-MgGraph -Scopes 'DeviceManagementServiceConfig.Read.All', 'DeviceManagementManagedDevices.Read.All'

function Get-GraphAll([string]$Uri) {
    $out = @()
    while ($Uri) {
        $page = Invoke-MgGraphRequest -Method GET -Uri $Uri -OutputType PSObject
        $out += $page.value
        $Uri = $page.'@odata.nextLink'
    }
    $out
}

$stamp = Get-Date -Format 'yyyy-MM-dd'

# 1. Enrollment configurations: restrictions, limits, ESP and their assignments
Get-GraphAll 'https://graph.microsoft.com/v1.0/deviceManagement/deviceEnrollmentConfigurations?$expand=assignments' |
    Select-Object displayName, '@odata.type', priority, @{ n = 'AssignedGroups'; e = { $_.assignments.Count } } |
    Export-Csv ".\enrollment-configurations-$stamp.csv" -NoTypeInformation

# 2. Inventories: managed devices, Autopilot registrations, corporate identifiers, procurement
$managed = Get-MgDeviceManagementManagedDevice -All -Property 'deviceName,serialNumber,operatingSystem,managedDeviceOwnerType,lastSyncDateTime'
$autopilot = Get-GraphAll 'https://graph.microsoft.com/v1.0/deviceManagement/windowsAutopilotDeviceIdentities'
$corpIds = Get-GraphAll 'https://graph.microsoft.com/beta/deviceManagement/importedDeviceIdentities'
$procured = Import-Csv '<procurement-export.csv>'

$procuredSerials = $procured.SerialNumber
$registeredSerials = @($autopilot.serialNumber) + @($corpIds | ForEach-Object { ($_.importedDeviceIdentifier -split ',')[-1] })

# 3. Findings: each row is something the reports and the inventory disagree on
$findings = @()
$findings += $managed | Where-Object { $_.ManagedDeviceOwnerType -eq 'company' -and $_.SerialNumber -notin $procuredSerials } |
    ForEach-Object { [pscustomobject]@{ Serial = $_.SerialNumber; Finding = 'Corporate device, no procurement record' } }
$findings += $managed | Where-Object { $_.ManagedDeviceOwnerType -eq 'personal' -and $_.SerialNumber -in $procuredSerials } |
    ForEach-Object { [pscustomobject]@{ Serial = $_.SerialNumber; Finding = 'Procured device recorded as personal' } }
$findings += $procured | Where-Object { $_.SerialNumber -notin $registeredSerials } |
    ForEach-Object { [pscustomobject]@{ Serial = $_.SerialNumber; Finding = 'Procured, not registered in Autopilot or as a corporate identifier' } }
$findings += $managed | Where-Object { $_.LastSyncDateTime -lt (Get-Date).AddDays(-90) } |
    ForEach-Object { [pscustomobject]@{ Serial = $_.SerialNumber; Finding = 'No check-in for 90 days: cleanup or retirement due' } }

$findings | Sort-Object Finding, Serial | Export-Csv ".\enrollment-findings-$stamp.csv" -NoTypeInformation
"{0} managed, {1} procured, {2} findings" -f $managed.Count, $procured.Count, $findings.Count
```

`Get-MgDeviceManagementManagedDevice` and the `managedDeviceOwnerType` values (`company`, `personal`) are Microsoft Graph's;[^c04-z-graph-managed] the Autopilot and corporate identifier lists come from their Graph resources.[^c04-z-graph-autopilot][^c04-z-graph-ids] The 90-day line matches the program's Windows cleanup rule in [Chapter 10](10-operating-and-evidencing-the-fleet.md#stale-records).

**Evidence checklist**

- [ ] **Configuration:** `enrollment-configurations-<date>.csv` and a screenshot or export of the MDM user scope, kept with the change record
- [ ] **Operational:** the enrollment failures report and `IntuneOperationalLogs` enrollment events, retained with the workspace's retention
- [ ] **Test:** one enrollment attempt per path in the ownership table, with the expected and observed ownership and the date and tester; a personal Windows enrollment that fails with **Enrollment restriction not met**
- [ ] **Exception:** the register of users allowed personal Windows enrollment, device enrollment manager accounts and path D devices, with approver and expiry
- [ ] **Assessor-ready artifact:** `enrollment-findings-<date>.csv` with zero unexplained findings, or each finding linked to its ticket, filed as CM-8 inventory evidence ([Chapter 10](10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads))

### Day-two ownership

The endpoint engineering lead owns the enrollment controls ([Chapter 06](06-who-owns-the-endpoint.md)); procurement owns the identifier uploads. The reconciliation runs weekly with the inventory reconciliation in [Chapter 10](10-operating-and-evidencing-the-fleet.md#device-inventory-reconciliation), and a device leaves through the [retirement sequence](10-operating-and-evidencing-the-fleet.md#retirement-and-wipe), which deregisters it from Autopilot before its records are deleted. Drift looks like a rising count in any of the four finding rows, an MDM user scope that isn't **All**, or a restriction whose assignments changed outside a change record. The help desk path for a user whose device won't enroll is in [Book 15](../b15-day2-operations/index.md).

## Validation, drift checks and evidence

Phase 5 runs platform-neutral and platform-specific checks. Failures quarantine the device under pillar 5. The doctrine adds five domain checks for onboarding. Each book owns the detail of its own domain's checks, and [Book 13, Chapter 06](../b13-governance/06-the-drift-engine.md) classifies every drift finding into one of its five classes:

| Domain check | What it detects |
|---|---|
| `DRIFT-PROCUREMENT-MISMATCH` | The device's organizational assignment differs from the procurement record |
| `DRIFT-VENDOR-PROGRAM-CARRIER` | The assignment in the vendor program record (Autopilot group tag, Apple assignment and so on) differs from the procurement record, or is missing |
| `DRIFT-ENROLLMENT-VECTOR` | The device enrolled through a non-zero-touch path without an exception grant |
| `DRIFT-CO-MANAGEMENT-NEW` | A net-new Windows endpoint landed in Configuration Manager co-management instead of Intune-first |
| `DRIFT-PROCUREMENT-RECORD-ABSENT` | A device enrolled in Intune with no matching procurement record |

The keys these checks join on, and a read-only script that finds three of the five, are in [Chapter 03](03-where-device-and-server-data-lives.md). Each detection produces a signed evidence artifact in the governance repository. The program maps the evidence to the NIST SP 800-53 controls AC-2, AC-19, CM-2, CM-7, CM-8, IA-3, MA-2 and SC-15 for its FedRAMP Moderate boundary.[^c04-sp800-53] That mapping is the program's assertion for its own assessors, not a statement that these artifacts satisfy the controls by themselves. How the evidence is produced and presented for Intune is covered in [Chapter 10](10-operating-and-evidencing-the-fleet.md).

## What this chapter establishes

1. A net-new device is governed from first power-on. There's no domain join, co-management or unassigned state on the way.
2. The organizational assignment is set at the purchase order and carried by the vendor program, with an explicit unpositioned marker when nothing can supply it.
3. In a GCC tenant, classic Autopilot with Entra join and OEM or reseller registration is the default, because its registration carries the procurement attribute; device preparation needs the attribute carried by the mapping table.
4. Blocking personal Windows enrollment turns an unregistered device into an enrollment failure, which is the doctrine's quarantine in practice.
5. Five drift checks catch the devices that slipped through, and they join on the keys from [Chapter 03](03-where-device-and-server-data-lives.md).

[Chapter 05](05-the-governed-manual-and-retrofit-paths.md) takes up how the existing fleet reaches the same end state.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 03 — Where Device and Server Data Lives](03-where-device-and-server-data-lives.md) · [Book index](index.md) · [Next: Chapter 05 — The Governed, Manual and Retrofit Paths →](05-the-governed-manual-and-retrofit-paths.md)
:::

[^c04-device-identity]: Microsoft Learn, "What is a device identity?," <https://learn.microsoft.com/entra/identity/devices/overview> (accessed Oct 20, 2026).
[^c04-platforms]: Microsoft Learn, "Supported operating systems and browsers in Intune," <https://learn.microsoft.com/intune/fundamentals/ref-supported-platforms> (accessed Oct 20, 2026).
[^c04-mde-ssm]: Microsoft Learn, "Learn how to use Intune endpoint security policies to manage Microsoft Defender for Endpoint on devices that are not enrolled with Intune," <https://learn.microsoft.com/intune/device-security/microsoft-defender/security-settings-management> (accessed Oct 21, 2026).
[^c04-ap-registration]: Microsoft Learn, "Windows Autopilot registration overview," <https://learn.microsoft.com/autopilot/registration-overview> (accessed Oct 20, 2026).
[^c04-ap-faq]: Microsoft Learn, "Windows Autopilot device preparation FAQ," <https://learn.microsoft.com/autopilot/device-preparation/faq> (accessed Oct 20, 2026).
[^c04-ap-compare]: Microsoft Learn, "Compare Windows Autopilot device preparation and Windows Autopilot," <https://learn.microsoft.com/autopilot/device-preparation/compare> (accessed Nov 9, 2026).
[^c04-intune-gov]: Microsoft Learn, "Microsoft Intune Government Service overview," <https://learn.microsoft.com/intune/fundamentals/government-service> (accessed Oct 20, 2026; rechecked Nov 11, 2026).
[^c04-ap-overview]: Microsoft Learn, "Overview of Windows Autopilot device preparation," including section "Cloud environments," <https://learn.microsoft.com/autopilot/device-preparation/overview> (accessed Nov 9, 2026).
[^c04-ap-assoc]: Microsoft Learn, "Overview of Windows Autopilot device association" (how device association works; key capabilities) and "Windows Autopilot device preparation: What's new" (device association, added August 27, 2026), <https://learn.microsoft.com/autopilot/device-preparation/device-association/overview>, <https://learn.microsoft.com/autopilot/device-preparation/whats-new> (accessed Oct 22, 2026).
[^c04-ap-dp-name]: Microsoft Learn, "Windows Autopilot device preparation user-driven Microsoft Entra join: Create a Windows Autopilot device preparation policy," Configuration settings (Apply device name template; settings only available to associated devices), <https://learn.microsoft.com/autopilot/device-preparation/tutorial/user-driven/entra-join-autopilot-policy> (accessed Oct 22, 2026).
[^c04-ap-dp-req]: Microsoft Learn, "Windows Autopilot device preparation requirements," <https://learn.microsoft.com/autopilot/device-preparation/requirements> (accessed Oct 20, 2026).
[^c04-ap-oem]: Microsoft Learn, "OEM registration," <https://learn.microsoft.com/autopilot/oem-registration> (accessed Oct 20, 2026).
[^c04-ap-manual]: Microsoft Learn, "Manual registration overview," <https://learn.microsoft.com/autopilot/manual-registration> (accessed Oct 20, 2026).
[^c04-ap-hololens]: Microsoft Learn, "Windows Autopilot for HoloLens 2," create a device group (group tag maps to the OrderID attribute), <https://learn.microsoft.com/hololens/hololens2-autopilot#configuring-autopilot-for-hololens-2> (accessed Oct 20, 2026).
[^c04-dynamic-rules]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," rules for devices, <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership#rules-for-devices> (accessed Oct 20, 2026).
[^c04-restrictions]: Microsoft Learn, "What are enrollment restrictions?," <https://learn.microsoft.com/intune/device-enrollment/restrictions> (accessed Oct 20, 2026; rechecked Nov 11, 2026, including the note that enrollment restrictions aren't security features).
[^c04-corp-ids]: Microsoft Learn, "Identify devices as corporate-owned," <https://learn.microsoft.com/intune/device-enrollment/add-corporate-identifiers> (accessed Oct 20, 2026; rechecked Nov 11, 2026, sections "Supported corporate identifiers," "Add Windows corporate identifiers," "Check enrollment status," "Change device ownership," "Block personal devices" and "Known issues and limitations").
[^c04-unblock]: Microsoft Learn, "Unblock Windows 'Set up for work or school' enrollment," <https://learn.microsoft.com/troubleshoot/mem/intune/device-enrollment/troubleshoot-windows-work-school> (accessed Oct 20, 2026).
[^c04-ap-profile]: Microsoft Learn, "User-driven Microsoft Entra join: Create and assign user-driven Microsoft Entra join Windows Autopilot profile," <https://learn.microsoft.com/autopilot/tutorial/user-driven/azure-ad-join-autopilot-profile> (accessed Oct 20, 2026).
[^c04-ap-esp]: Microsoft Learn, "User-driven Microsoft Entra join: Configure and assign the Enrollment Status Page (ESP)," <https://learn.microsoft.com/autopilot/tutorial/user-driven/azure-ad-join-esp> (accessed Oct 20, 2026).
[^c04-esp]: Microsoft Learn, "Set up the Enrollment Status Page," <https://learn.microsoft.com/intune/device-enrollment/windows/setup-status-page> (accessed Oct 20, 2026).
[^c04-compliance]: Microsoft Learn, "Use compliance policies to set rules for devices you manage with Intune," compliance policy settings, <https://learn.microsoft.com/intune/device-security/compliance/overview#compliance-policy-settings> (accessed Oct 20, 2026).
[^c04-bp-compliance]: Microsoft Learn, "Device management and application management in Microsoft 365 Business Premium," create device compliance policies, <https://learn.microsoft.com/microsoft-365/admin/security-and-compliance/m365bp-devices-enrollment?view=o365-worldwide> (accessed Oct 20, 2026).
[^c04-mde-risk]: Microsoft Learn, "Device compliance settings for Windows in Intune," Microsoft Defender for Endpoint rules, <https://learn.microsoft.com/intune/device-security/compliance/ref-windows-settings#microsoft-defender-for-endpoint> (accessed Oct 20, 2026).
[^c04-baselines]: Microsoft Learn, "Use security baselines to help secure Windows devices you manage with Microsoft Intune," <https://learn.microsoft.com/intune/device-security/security-baselines/overview> (accessed Oct 20, 2026).
[^c04-arc-login]: Microsoft Learn, "Sign in to an Azure Arc-enabled server using Microsoft Entra ID and Azure Roles Based Access Control," <https://learn.microsoft.com/entra/identity/devices/howto-arc-sign-in-windows> (accessed Oct 20, 2026).
[^c04-sp800-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020 (updated December 10, 2020), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026).
[^c04-ca-grant]: Microsoft Learn, "Conditional Access: Grant," section "Require device to be marked as compliant," <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-grant#require-device-to-be-marked-as-compliant> (accessed Oct 21, 2026).
[^c04-ca-filter]: Microsoft Learn, "Conditional Access: Filter for devices," sections "Common scenarios" and "Policy behavior with filter for devices," <https://learn.microsoft.com/entra/identity/conditional-access/concept-condition-filters-for-devices> (accessed Oct 21, 2026).
[^c04-ca-plan]: Microsoft Learn, "Plan a Conditional Access deployment," section "Roll back policies," <https://learn.microsoft.com/entra/identity/conditional-access/plan-conditional-access#roll-back-policies> (accessed Oct 21, 2026).
[^c04-z-automdm]: Microsoft Learn, "Set up automatic enrollment for Windows devices," section "Enable Windows automatic enrollment" (MDM and WIP user scope; precedence when a user is in both), <https://learn.microsoft.com/intune/device-enrollment/windows/enable-automatic-mdm> (accessed Nov 11, 2026).
[^c04-z-automdm-quick]: Microsoft Learn, "Step 4 - Set up automatic enrollment for Windows devices," section "Set up automatic enrollment" (automatic MDM enrollment is a premium Microsoft Entra feature), <https://learn.microsoft.com/intune/device-enrollment/windows/quickstart-automatic-mdm> (accessed Nov 11, 2026).
[^c04-z-platform]: Microsoft Learn, "Create device platform restrictions," sections "Requirements" (roles) and "Default policy," <https://learn.microsoft.com/intune/device-enrollment/create-platform-restrictions> (accessed Nov 11, 2026).
[^c04-z-limit]: Microsoft Learn, "Create device limit restrictions in Intune," sections "Requirements," "Edit enrollment restrictions" (edits apply to new enrollments only) and "Change restriction priority," <https://learn.microsoft.com/intune/device-enrollment/create-device-limit-restrictions> (accessed Nov 11, 2026).
[^c04-z-limit-max]: Microsoft Learn, "Windows user is not authorized to enroll," Solution 2 (device limit, maximum 15); and "Troubleshooting device enrollment in Intune," section "Device cap reached" (device enrollment manager accounts and the cap), <https://learn.microsoft.com/troubleshoot/mem/intune/device-enrollment/windows-user-cannot-enroll>, <https://learn.microsoft.com/troubleshoot/mem/intune/device-enrollment/troubleshoot-device-enrollment-in-intune> (both accessed Nov 11, 2026).
[^c04-z-graph-ids]: Microsoft Graph beta reference, "List importedDeviceIdentities" (national cloud availability; DeviceManagementServiceConfig.Read.All) and "importedDeviceIdentity resource type" (`importedDeviceIdentifier`, `importedDeviceIdentityType`, `enrollmentState`), <https://learn.microsoft.com/graph/api/intune-enrollment-importeddeviceidentity-list?view=graph-rest-beta>, <https://learn.microsoft.com/graph/api/resources/intune-enrollment-importeddeviceidentity?view=graph-rest-beta> (both accessed Nov 11, 2026).
[^c04-z-graph-managed]: Microsoft Graph v1.0 reference, "managedDevice resource type" (`managedDeviceOwnerType`: `unknown`, `company`, `personal`; `serialNumber`; `lastSyncDateTime`), <https://learn.microsoft.com/graph/api/resources/intune-devices-manageddevice?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^c04-z-graph-autopilot]: Microsoft Graph v1.0 reference, "List windowsAutopilotDeviceIdentities," <https://learn.microsoft.com/graph/api/intune-enrollment-windowsautopilotdeviceidentity-list?view=graph-rest-1.0> (accessed Nov 11, 2026).
