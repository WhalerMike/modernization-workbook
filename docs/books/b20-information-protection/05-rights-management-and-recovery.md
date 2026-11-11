---
title: "Chapter 05 — Rights Management and Recovery"
description: "How the agency turns on the encryption service behind every protecting sensitivity label and every encrypted message, and how it keeps the ability to read what it encrypted: confirming and activating the Azure Rights Management service, onboarding controls for a phased start, the government-cloud connection and DNS steps, licensing as a stated dependency, the super user feature held off by default and enabled just in time through Privileged Identity Management, and a decryption-continuity test that proves a holder can open, a non-holder can't and a recovery operator can, with the evidence each step leaves."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 5
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 05 — Rights Management and Recovery

*Encryption that the agency can't undo is a data-loss event waiting for a resignation; the service that protects content has to be switched on deliberately, and the way back into it has to be tested before anyone needs it.*

::: {.callout-note}
## In this chapter
What the Azure Rights Management service is for, and why activation is a decision even though most tenants arrive with it on. How to confirm and activate it, stage who can apply encryption, and connect to it from GCC High and DoD, where clients also need DNS records to find the right instance. Licensing as a dependency, not a finding. The super user feature: what it can do, why Microsoft advises keeping it off, and how the program enables it only for a named recovery, approved through Privileged Identity Management. A decryption-continuity test the agency runs on a schedule, and the evidence the whole chapter leaves for the Rights Management part of closure-map row CM-13.
:::

Every sensitivity label that encrypts, and every encrypted message in [Chapter 06](06-exchange-message-encryption.md), depends on one tenant service: Azure Rights Management, the encryption technology that Microsoft Purview Information Protection uses. [Chapter 02](02-sensitivity-label-architecture.md) decides which labels encrypt and for whom; [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#keys-the-agency-controls) explains the three meanings of "customer-managed key" and which one the program uses for the tenant root key. This chapter doesn't repeat either. It covers the service those decisions run on: whether it is on, who may use it to encrypt, and who can get content back out when the person who encrypted it is gone.

That last question is the reason the chapter exists. Rights Management grants usage rights to the people and groups a label names. When a file's only authorized holder leaves, when a label granted rights to a group that was later deleted, or when an investigator needs to read what a departing employee encrypted, somebody has to be able to open it. Microsoft's answer is the super user feature, which gives its holders full control of everything the tenant encrypted.[^c05-superuser] A permanent super user is a standing key to every protected record in the agency. A super user that nobody can enable when needed is an availability gap. The design below avoids both.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Encryption; Data Access)
- **Depends on:** Identity, for the groups that labels grant rights to and for Privileged Identity Management ([Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md)); the label design in [Chapter 02](02-sensitivity-label-architecture.md); the tenant key choice in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#keys-the-agency-controls)
- **Attack chain interrupted:** Collection and Exfiltration (encrypted content stays unreadable outside the rights it grants); the recovery design limits Privilege Escalation and Persistence through a standing super user
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Decide](#decide-activation-onboarding-and-recovery) | Decision record ([template](01-data-inventory-and-classification.md#decision-record-template)) naming the onboarding scope, the recovery operators and the approvers |
| Configured | [Prerequisites](#prerequisites) to [Report-only or audit phase](#report-only-or-audit-phase) | `Get-AipService`, `Get-AipServiceConfiguration` and `Get-AipServiceOnboardingControlPolicy` output; the PIM group settings export |
| Enforced | [Enforcement](#enforcement) | Onboarding control removed (all licensed users can encrypt); super user feature state **Disabled** outside an approved recovery |
| Evidenced | [Validate: the decryption-continuity test](#validate-the-decryption-continuity-test) | The test record, the usage log lines for each open and denial, and the admin log lines for the recovery |
| Operated | [Day-two ownership](#day-two-ownership) | Quarterly test record, monthly super user review, alert on super user enablement |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## What the service does, and why activation is a decision

When the Azure Rights Management service is active, all users in the organization can apply encryption to documents and email, and all users can open content that the service encrypted for them.[^c05-activate] Tenants whose subscription was obtained from late February 2018 onward have the service activated automatically, and Microsoft activated it for most earlier subscriptions that use Exchange Online; an administrator has to activate it only if neither applies or someone deactivated it.[^c05-activate] So in most agencies the question isn't "is it on" but "did anyone decide it should be, and who may encrypt with it". Three things make that a decision rather than a default:

- **It can't coexist with AD RMS.** Microsoft says not to activate the service where Active Directory Rights Management Services is deployed, and Message Encryption isn't compatible with AD RMS; an agency still running AD RMS migrates first.[^c05-activate][^c05-ome-setup] [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#ad-rms-has-to-leave-before-the-domain-does) explains why AD RMS has to leave before the domain does.
- **Encryption is irreversible without a recovery path.** Content encrypted to a person or group that no longer exists can be opened only by its owner, someone with Full Control, or a super user.[^c05-superuser]
- **Deactivation isn't an undo.** Microsoft's decommissioning guidance tells an organization that has encrypted production content to keep a copy of its root key and trusted publishing domain before deactivating; turning the service off doesn't decrypt anything.[^c05-deactivate]

**Authority:** Microsoft-recommended (Microsoft Learn, "Activate the Azure Rights Management service," accessed Nov 11, 2026) for confirming the service state and for onboarding controls in a phased deployment.
**Applies:** License-dependent: a service plan that includes Azure Rights Management ([Prerequisites](#prerequisites)). Environment-dependent: GCC High and DoD clients need DNS records to reach the government instance.

## Decide: activation, onboarding and recovery {#decide-activation-onboarding-and-recovery}

Record these in the decision record before anything changes. The [decision record template](01-data-inventory-and-classification.md#decision-record-template) has the license, cloud-availability, prerequisite and compensating-control fields.

| Decision | The program's position | Authority |
|---|---|---|
| Who may apply encryption during rollout | An onboarding group of the label pilot users ([Chapter 03](03-label-publication-and-defaults.md)), widened to all licensed users at enforcement; everyone can always open content encrypted for them | Microsoft-recommended for a phased deployment[^c05-activate] |
| Tenant root key | Microsoft-managed or BYOK, per [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#keys-the-agency-controls); decided before the first encrypting label is published, because Microsoft recommends completing BYOK before setting up Message Encryption[^c05-ome-setup] | Risk-based recommended |
| Super user feature at rest | **Disabled**, with no standing members | Microsoft-recommended: enable it as needed and disable it during standard operations, unless a trusted application needs it[^c05-enable-su] |
| Who may recover | Two or more named recovery operators, each eligible (never active) for the role that can enable the feature, with approval by the policy owner or the records officer | Risk-based recommended |
| How a recovery operator becomes a super user | Added individually with `Add-AipServiceSuperUser` for the duration of the recovery, then removed | Microsoft-recommended for immediate access, because group membership is cached[^c05-superuser] |
| Standing super users for services | Only a trusted application that has to inspect encrypted content (for example a content-scanning service), by its service principal, recorded as an exception | Microsoft-recommended exception[^c05-enable-su] |

### Why the super user is added individually, not through a PIM-managed group

The obvious design is a super user group whose membership is governed by PIM for Groups, so that a recovery operator activates membership just in time. Two documented behaviors make that unreliable for recovery.

- The Rights Management service caches group membership, and a change in Microsoft Entra ID "can take up to three hours to take effect" for groups the service uses; Microsoft says the period is subject to change.[^c05-groups-cache] A PIM activation would take effect hours later, and a deactivation would leave the operator a super user for hours after PIM removed them.
- Microsoft's own super user guidance says that to make a user a super user who can decrypt immediately, add them with `Add-AipServiceSuperUser` rather than to the configured super user group.[^c05-superuser]

PIM still governs the recovery, one level up. The recovery operator is *eligible* for a Microsoft Entra role that can manage the Rights Management service (Compliance Administrator or Compliance Data Administrator are the roles Learn names for its administration).[^c05-activate] Activating that role requires approval, justification and a ticket number, configured in PIM as [Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md) and [Appendix B](../b04-access/appendix-b-pim-role-settings.md) describe. While the role is active, the operator enables the feature, adds the named super user, does the recovery, removes the super user and disables the feature. Microsoft notes that PIM for Microsoft Entra roles, not PIM for Groups, avoids activation delays for administration in Microsoft Purview.[^c05-pim-groups] Every step is in the Rights Management admin log, and every decryption in the usage log ([Telemetry](#telemetry)).

**Authority:** Risk-based recommended (the program's position, for the risk of a standing key to all encrypted content), built on Microsoft's recommendations to enable the feature only as needed and to add immediate super users individually.

## How: activate and stage the Rights Management service

The procedure below is the Rights Management part of CM-13: activate protection, and prove it works. [Chapter 06](06-exchange-message-encryption.md) carries the message-encryption part.

### Prerequisites

- **License.** Activating the service needs a service plan that includes Azure Rights Management from Microsoft Purview Information Protection; Learn points to the Microsoft 365 licensing guidance for which plans those are.[^c05-activate] Message Encryption is included in Office 365 and Microsoft 365 E3 and E5 and in Office 365 Government G3 and G5.[^c05-ome-license] A user without a qualifying plan is a licensing decision recorded in the decision record, not a failed control; an assessment test skipped for licensing is classified as such, not counted as a failure ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)). **Applies:** License-dependent.
- **Roles.** Compliance Administrator or Compliance Data Administrator, activated through PIM, to manage the service; Learn's `Connect-AipService` reference also accepts the Azure Information Protection administrator role.[^c05-activate][^c05-connect]
- **Module.** The AIPService PowerShell module from the PowerShell Gallery, version 3.1.0.0 or later for PowerShell 7.4; Windows PowerShell 5.1 needs .NET Framework 4.8.[^c05-install]
- **No AD RMS in use.** Confirm before activating ([What the service does](#what-the-service-does-and-why-activation-is-a-decision)).
- **Government-cloud availability.**

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Azure Rights Management service (encryption for labels and Message Encryption) | Available | Available (Message Encryption E3 row) | Available; connect with `-EnvironmentName AzureUSGovernment` and publish DNS SRV records | Available; same connection and DNS steps as GCC High | GCC, GCC High and DoD Purview planning pages, Encryption rows; AIP Premium Government service description[^c05-gcc][^c05-gcch][^c05-dod][^c05-aip-gov] |
| Co-authoring on encrypted documents | Available | Available | Available | Available | Same pages, Sensitivity labeling rows[^c05-gcc][^c05-gcch][^c05-dod] |
| BYOK for the tenant key; Double Key Encryption | Available | Available | Available | Available | Same pages, Encryption rows[^c05-gcc][^c05-gcch][^c05-dod] |
| Super user feature | Available | not yet specified | not yet specified | not yet specified | The government pages don't list it; `Connect-AipService` accepts `AzureUSGovernment`, so the cmdlets run there[^c05-connect] |
| Rights Management usage logging (`Get-AipServiceUserLog`) | Available | not yet specified | not yet specified | not yet specified | The government pages don't list it[^c05-usage] |
| eDiscovery decryption of encrypted content ("RMS decryption") | Available | Available | Available | Available | Same pages, eDiscovery (Standard) rows[^c05-gcc][^c05-gcch][^c05-dod] |

The government pages say feature status "is subject to change as project plans and priorities are reevaluated." Read them again at each reassessment ([Chapter 12](12-operations-and-evidence.md)).

Connect to the service. The placeholders in this chapter are `<admin-upn>` (the operator's sign-in name), `<pilot-group>` (the onboarding group's display name), `<recovery-operator>@contoso.example` (the named recovery operator's primary email address or UPN) and `<log-folder>` (a local folder for exported logs). Commands were checked against Microsoft Learn on Nov 11, 2026; run them against a test tenant first.

```powershell
# Install or update the module (run PowerShell as administrator).
Install-Module -Name AIPService
Update-Module -Name AIPService

# Commercial and GCC:
Connect-AipService

# GCC High and DoD:
Connect-AipService -EnvironmentName AzureUSGovernment
```

In GCC High and DoD, Office clients bootstrap to the commercial instance unless DNS redirects them. Learn's government service description gives two SRV records per user domain: `_rmsredir._http._tcp` pointing to `<service-id>.rms.aadrm.us` on port 80 for Windows clients, and `_rmsdisco._http._tcp` pointing to `api.aadrm.us` on port 80 for other platforms, where `<service-id>` is the tenant's Rights Management service ID.[^c05-aip-gov] Read the ID, then ask the DNS owner ([Book 08](../b08-ddi/index.md)) to publish the records:

```powershell
# GCC High and DoD only: the value for the _rmsredir SRV target.
(Get-AipServiceConfiguration).RightsManagementServiceId
```

The same page says not to terminate TLS to the `rms.aadrm.us` endpoint at a proxy or firewall, and gives a check that the certificate the client sees was issued by a Microsoft CA.[^c05-aip-gov] Run it from a pilot workstation:

```powershell
# GCC High and DoD: the issuer should be a Microsoft CA, not an inspection proxy.
$request = [System.Net.HttpWebRequest]::Create("https://admin.aadrm.us/admin/admin.svc")
$request.GetResponse()
$request.ServicePoint.Certificate.Issuer
```

### Pilot

Restrict who can *apply* encryption to the onboarding group while the encrypting labels are piloted. Learn's onboarding control takes a group object ID, not individual users; everyone can still open content the pilot encrypts.[^c05-activate]

```powershell
# Find the onboarding group's object ID (Microsoft Graph PowerShell).
# GCC High and DoD: Connect-MgGraph -Environment USGov (GCC High) or USGovDoD (DoD).
Connect-MgGraph -Scopes "Group.Read.All"
$groupId = (Get-MgGroup -Filter "displayName eq '<pilot-group>'").Id

# Only members of the pilot group can apply encryption.
Set-AipServiceOnboardingControlPolicy -UseRmsUserLicense $False -SecurityGroupObjectId $groupId
Get-AipServiceOnboardingControlPolicy
```

The pilot succeeds when every encrypting label in [Chapter 02](02-sensitivity-label-architecture.md) has been applied by a pilot user, opened by an intended holder on each client the agency supports, and refused to a non-holder, and when the decryption-continuity test below passes once.

### Report-only or audit phase

Rights Management has no report-only mode: a label either encrypts or it doesn't. The observation phase is the usage log. Usage logging is on by default, writes to a storage account the service creates for the tenant, and makes most entries available within 15 minutes, but only for previous dates (UTC); Microsoft calls the logs a definitive source for forensic analysis because every open of encrypted content needs a use license.[^c05-usage] During the pilot, download a day's log each morning and read it for `AcquireLicense` denials and unexpected users:

```powershell
# Yesterday's usage log, to a local folder.
Get-AipServiceUserLog -Path "<log-folder>" -ForDate (Get-Date).AddDays(-1)

# The service's own administrative actions (activation, onboarding, super user changes).
Get-AipServiceAdminLog -Path "<log-folder>\admin.log" -FromTime (Get-Date).AddDays(-7) -ToTime (Get-Date)
```

File access and denial events in the usage log don't carry the file name and aren't in the Microsoft Purview unified audit log;[^c05-usage] keep the usage log itself as the record.

### Enforcement

Confirm the service is active, and activate it only if it isn't. Then widen the onboarding control. Learn's steps:[^c05-activate]

```powershell
# Enabled = active. Disabled = deactivated.
Get-AipService

# Only if the status is Disabled and the decision record approves activation:
Enable-AipService
Get-AipService

# Enforcement: every licensed user can apply encryption.
Set-AipServiceOnboardingControlPolicy -UseRmsUserLicense $True
Get-AipServiceOnboardingControlPolicy
```

`-UseRmsUserLicense $True` limits encryption to correctly licensed users; `$False` with no group removes the onboarding control altogether.[^c05-activate] The program uses `$True`, so the license dependency is visible in the configuration.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The platform owner's test accounts | Each encrypting label encrypts and opens on every supported client; GCC High and DoD DNS records resolve |
| 1 | `<pilot-group>` (label pilot users) | Two weeks with no unexplained denials in the usage log; decryption-continuity test passed |
| 2 | Early adopters: records, legal and the help desk | Help-desk tickets about opening protected content within the agreed threshold; recovery drill done once |
| 3 | All licensed users (`-UseRmsUserLicense $True`) | Post-change validation passed |

- **Emergency access:** not applicable to activation: Rights Management doesn't block sign-in. Emergency access accounts are never added as super users.
- **Change window:** a standard change window approved by the platform owner; the help desk is told the day before.
- **Backout triggers:** any encrypting label that a holder can't open on a supported client; a usage-log denial rate above the threshold the policy owner set before the change.
- **Post-change validation:** the [decryption-continuity test](#validate-the-decryption-continuity-test), run after rings 1 and 3.

### Rollback

Rolling back the onboarding widening is one command and takes effect at the next license request: set the onboarding control back to the pilot group with the [Pilot](#pilot) command. The platform owner or an operator with the active role can run it.

Deactivating the service is not a rollback. It stops new encryption, but content already encrypted stays encrypted, and Microsoft's decommissioning guidance requires a copy of the root key and trusted publishing domain before deactivation if production content was encrypted.[^c05-deactivate] The program treats `Disable-AipService` as a decommissioning decision for the authorizing official, never as a backout step.

### Exclusions

- **Onboarding exclusions:** none at enforcement; during the pilot, everyone outside `<pilot-group>` is excluded from *applying* encryption but not from opening it.
- **Standing super users:** none, except a trusted service principal recorded in the exception register with its approver and review date.[^c05-enable-su]
- **Emergency access accounts:** never granted super user, never members of the onboarding group, and never named in label permissions.

### Telemetry

| Signal | Where it comes from | Where it goes |
|---|---|---|
| Service state, onboarding changes, super user feature on or off, super users added or removed | Rights Management admin log (`Get-AipServiceAdminLog`); Microsoft documents that enabling the feature and adding super users are logged there[^c05-superuser] | Exported daily to the evidence store; the enablement is an alert to the security monitor ([Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md)) |
| Every open, denial and decryption of encrypted content | Rights Management usage log (`Get-AipServiceUserLog`); super user decryptions appear here but aren't marked as super user actions, so the review cross-references `Get-AipServiceSuperUser`[^c05-superuser] | Downloaded daily and kept with the evidence store |
| Label applied, changed or removed on files in SharePoint and OneDrive | Microsoft Purview audit ([Chapter 07](07-sharepoint-and-onedrive.md)) | Workspace ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)) |
| PIM activation of the recovery role | Microsoft Entra audit log | Workspace ([Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md)) |

### Evidence

**Evidence checklist**

- [ ] **Configuration:** `Get-AipService`, `Get-AipServiceConfiguration`, `Get-AipServiceOnboardingControlPolicy`, `Get-AipServiceSuperUserFeature` and `Get-AipServiceSuperUser` output, dated, in the evidence store; in GCC High and DoD, the two DNS SRV records
- [ ] **Operational:** daily usage log and weekly admin log exports, kept for the period [Book 13, Chapter 13](../b13-governance/13-records-evidence-and-retention.md) sets
- [ ] **Test:** the decryption-continuity test record, with the usage-log lines for each open, denial and recovery
- [ ] **Exception:** the super user exception register (service principals only) and any user without a qualifying license, each with approver and review date
- [ ] **Assessor-ready artifact:** the CM-13 register entry ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)) linking the four items above

### Day-two ownership

The **platform owner** owns the service configuration and the quarterly decryption-continuity test. The **policy owner** (with the records officer) approves every recovery. The **operator** runs recoveries only through the procedure below. The **security monitor** alerts on super user enablement outside an approved change and reviews the super user list monthly. The **help desk** routes "I can't open this protected file" through [Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md) and never as a recovery request by itself. The **assessor** reads the evidence above. Drift looks like: the super user feature left **Enabled**, a standing super user, or an onboarding control reverted to a group. Roles are in [Chapter 12](12-operations-and-evidence.md#raci).

## How: recover encrypted content through a super user, just in time

### Prerequisites {#prerequisites-recovery}

- An approved recovery request naming the content, the reason (a departed employee's files, a legal or records request, a group that no longer exists) and the approver.
- The recovery operator is eligible for Compliance Administrator or Compliance Data Administrator in PIM, with approval required; Microsoft recommends at least two approvers for redundancy.[^c05-pim-settings]
- For files outside SharePoint and Exchange, the Microsoft Purview Information Protection client, whose PowerShell module provides `Set-FileLabel` and `Remove-FileLabel`.[^c05-superuser][^c05-remove-filelabel] For mail, eDiscovery decrypts on export, because the super user ability is integrated with Exchange Online.[^c05-superuser]

### Pilot {#pilot-recovery}

Run the procedure once in ring 2 against a test file encrypted to a test account that has then been disabled. The pilot passes when the file opens only after the steps below and the admin log shows each step.

### Report-only or audit phase {#audit-recovery}

Not applicable: a recovery acts on a named item and has nothing to observe beforehand. The audit trail is the admin log before and after, checked in the last step.

### Enforcement {#enforcement-recovery}

After the recovery role is activated and approved in PIM:

```powershell
Connect-AipService            # GCC High and DoD: -EnvironmentName AzureUSGovernment

# 1. Record the starting state: expect Disabled and no super users.
Get-AipServiceSuperUserFeature
Get-AipServiceSuperUser

# 2. Add the named operator individually (takes effect immediately), then enable the feature.
Add-AipServiceSuperUser -EmailAddress "<recovery-operator>@contoso.example"
Enable-AipServiceSuperUserFeature

# 3. Recover. For a file, the operator removes the label and its protection, or relabels it:
#    Remove-FileLabel -Path "<file-path>" -RemoveLabel -RemoveProtection -JustificationMessage "<ticket-number>"
#    For mail, use eDiscovery export, which decrypts with the super user ability.

# 4. Put it back: remove the operator, disable the feature, confirm.
Remove-AipServiceSuperUser -EmailAddress "<recovery-operator>@contoso.example"
Disable-AipServiceSuperUserFeature
Get-AipServiceSuperUserFeature
Get-AipServiceSuperUser
```

A super user has the Full Control usage right on all content the tenant encrypted, and can decrypt and remove protection even when an expiry date has passed; the time a user is added doesn't matter, so a super user added today can open content protected last week.[^c05-superuser][^c05-enable-su] That is why step 4 isn't optional, and why it removes the operator before disabling the feature: disabling the feature doesn't remove anyone from the super user list, so whoever is left on it becomes a super user again the next time the feature is enabled.[^c05-disable-su] The `Set-FileLabel` and `Remove-FileLabel` cmdlets remove a template-based label together with its protection; for custom permissions, `-RemoveProtection` is needed as well.[^c05-remove-filelabel]

### Rollback {#rollback-recovery}

Step 4 is the rollback, and it takes seconds. If the session ends before step 4, any operator with the active role runs step 4 alone. The security monitor's alert on an enabled feature older than the change window is the safety net.

### Exclusions {#exclusions-recovery}

Recovery operators can't approve their own PIM activation (PIM doesn't allow it) and can't recover their own content.[^c05-pim-approve] Emergency access accounts are never used to run a recovery.

### Telemetry {#telemetry-recovery}

The admin log records `AddSuperUser`, `SetSuperUserFeatureState` and their removal; the usage log records each decryption.[^c05-superuser] The PIM activation, approval and justification are in the Microsoft Entra audit log.

### Evidence {#evidence-recovery}

**Evidence checklist**

- [ ] **Configuration:** the before-and-after `Get-AipServiceSuperUserFeature` and `Get-AipServiceSuperUser` output
- [ ] **Operational:** the admin-log extract for the recovery window and the usage-log lines for the decrypted items
- [ ] **Test:** the ring-2 drill record
- [ ] **Exception:** the approved recovery request (approver, ticket number, items)
- [ ] **Assessor-ready artifact:** the recovery record filed with the request, traceable to the PIM activation

### Day-two ownership {#day-two-recovery}

The policy owner approves; the operator runs; the security monitor reviews every recovery within one business day against the request. Recoveries are counted in the [metrics](12-operations-and-evidence.md#metrics).

## Validate: the decryption-continuity test

The test proves that encryption works and that the agency can still read what it encrypted. Run it after rings 1 and 3, then every quarter.

| Step | Expected outcome | Evidence |
|---|---|---|
| 1. A test user applies each encrypting label to a test document | Document encrypted; label shown | Usage log `Certify` and publishing lines |
| 2. An intended holder opens it on each supported client | Opens with the rights the label grants | Usage log `AcquireLicense` success |
| 3. A user outside the label's permissions tries to open it | Refused | Usage log `AcquireLicense` failure |
| 4. The test user's account is disabled; a recovery operator follows the [recovery procedure](#how-recover-encrypted-content-through-a-super-user-just-in-time) | Document opens and its protection is removed | Admin log `AddSuperUser`, `SetSuperUserFeatureState`, then removal; usage log decryption |
| 5. After step 4 of the recovery | Feature **Disabled**, no super users | `Get-AipServiceSuperUserFeature`, `Get-AipServiceSuperUser` |
| 6. A message encrypted under [Chapter 06](06-exchange-message-encryption.md) is found and exported decrypted through eDiscovery | Exported readable | eDiscovery export record |

A failure at step 3 is a design error in the label; a failure at step 4 is a recovery gap and is treated as an incident under [Chapter 12](12-operations-and-evidence.md).

## Key takeaways

- Rights Management is usually already on; the decisions are who may encrypt during rollout, which tenant key, and who can recover.
- In GCC High and DoD, connect with `-EnvironmentName AzureUSGovernment` and publish the two SRV records, or Office clients look for the commercial instance.
- Keep the super user feature off. Enable it for a named recovery through a PIM-approved role, add the operator individually, and remove both when done; a PIM-managed super user group lags by up to three hours.
- The decryption-continuity test, with its usage-log and admin-log lines, is the Rights Management evidence for CM-13.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 04 — Teams, Groups and SharePoint Containers](04-teams-groups-and-sharepoint-containers.md) · [Book index](index.md) · [Next: Chapter 06 — Exchange Message Encryption →](06-exchange-message-encryption.md)
:::

[^c05-superuser]: Microsoft Learn, "Configure Azure Rights Management super users for discovery services or data recovery," sections "Configuration for the super user feature" (off by default; add users with `Add-AipServiceSuperUser` or `Set-AipServiceSuperUserGroup`; group membership is cached, so add individually for immediate access; adding time doesn't matter), "Security best practices for the super user feature" (admin log, usage logging, super user decryptions not marked as such, disable when not needed) and "Removing encryption from PST files" (super user ability integrated with Exchange Online eDiscovery), <https://learn.microsoft.com/purview/encryption-super-users> (accessed Nov 11, 2026).
[^c05-activate]: Microsoft Learn, "Activate the Azure Rights Management service," sections "Automatic activation for the Azure Rights Management service," "How to activate or confirm the status of the encryption service" (don't activate with AD RMS; service plan required; roles; `Get-AipService`, `Enable-AipService`) and "Configuring onboarding controls for a phased deployment" (`Set-AipServiceOnboardingControlPolicy`, group only, everyone can still consume), <https://learn.microsoft.com/purview/activate-rights-management-service> (accessed Nov 11, 2026).
[^c05-ome-setup]: Microsoft Learn, "Set up Message Encryption," sections "Verify that Azure Rights Management is active" (Message Encryption not compatible with AD RMS) and "Configure management of your Azure Rights Management tenant key" (complete BYOK before setting up Message Encryption), <https://learn.microsoft.com/purview/set-up-new-message-encryption-capabilities> (accessed Nov 11, 2026).
[^c05-deactivate]: Microsoft Learn, "Decommission and deactivate the Azure Rights Management service" (keep a copy of the root key and trusted publishing domain before deactivating if production content was encrypted; `Disable-AipService`), <https://learn.microsoft.com/purview/deactivate-rights-management-service> (accessed Nov 11, 2026).
[^c05-enable-su]: Microsoft Learn, "Enable-AipServiceSuperUserFeature," Description and Caution ("enable the super user feature on an as-needed basis"; disable it during standard operations unless a trusted application needs it), <https://learn.microsoft.com/powershell/module/aipservice/enable-aipservicesuperuserfeature> (accessed Nov 11, 2026).
[^c05-disable-su]: Microsoft Learn, "Disable-AipServiceSuperUserFeature," Description (disabling doesn't remove users or the group from the super user list; they are super users again if the feature is re-enabled; remove them first with `Remove-AipServiceSuperUser` or `Clear-AipServiceSuperUserGroup`); "Get-AipServiceSuperUserFeature" (disabled by default), <https://learn.microsoft.com/powershell/module/aipservice/disable-aipservicesuperuserfeature> (accessed Nov 11, 2026).
[^c05-groups-cache]: Microsoft Learn, "Learn how user accounts and groups use the Azure Rights Management service," section "Group membership caching" (changes "can take up to three hours to take effect"; subject to change), <https://learn.microsoft.com/purview/rights-management-users-groups> (accessed Nov 11, 2026).
[^c05-pim-groups]: Microsoft Learn, "Privileged Identity Management (PIM) for Groups," section "Make a group of users eligible for a Microsoft Entra role" (to avoid activation delays, use PIM for Microsoft Entra roles rather than PIM for Groups for just-in-time access to SharePoint, Exchange or the Microsoft Purview portal), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups> (accessed Nov 11, 2026).
[^c05-pim-settings]: Microsoft Learn, "Configure PIM for Groups settings," section "Require approval to activate" ("Select at least two approvers for redundancy"); justification and ticket information on activation, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/groups-role-settings> (accessed Nov 11, 2026).
[^c05-pim-approve]: Microsoft Learn, "Approve activation requests for group members and owners," section "Approve requests" ("Approvers can't approve their own role activation requests"), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/groups-approval-workflow> (accessed Nov 11, 2026).
[^c05-ome-license]: Microsoft Learn, "Message encryption FAQ," section "What subscriptions do I need to use Microsoft Purview Message Encryption?" (Office 365 and Microsoft 365 E3 and E5, Office 365 Government G3 and G5, among others; each user needs a license), <https://learn.microsoft.com/purview/ome-faq> (accessed Nov 11, 2026).
[^c05-connect]: Microsoft Learn, "Connect-AipService" (roles that can connect; `-EnvironmentName` accepts `AzureCloud`, `AzureChinaCloud`, `AzureUSGovernment`), <https://learn.microsoft.com/powershell/module/aipservice/connect-aipservice> (accessed Nov 11, 2026).
[^c05-install]: Microsoft Learn, "Install the AIPService PowerShell module for the Azure Rights Management service," sections "Prerequisites" and "PowerShell editions," <https://learn.microsoft.com/purview/install-aipservice-powershell> (accessed Nov 11, 2026).
[^c05-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 table (Encryption, Sensitivity labeling and eDiscovery rows; status "subject to change"), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c05-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4 table, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c05-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4 table, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
[^c05-aip-gov]: Microsoft Learn, "Azure Information Protection Premium Government Service Description," sections "Enable Rights Management for the tenant" (`Connect-AIPService -EnvironmentName AzureUSGovernment`), "DNS configuration for encryption (Windows)" and "(Mac, iOS, Android)" (SRV records) and "Firewalls and network infrastructure" (don't terminate TLS to rms.aadrm.us; issuer check), <https://learn.microsoft.com/enterprise-mobility-security/solutions/ems-aip-premium-govt-service-description> (accessed Nov 11, 2026).
[^c05-usage]: Microsoft Learn, "Usage logging for the Azure Rights Management service" (on by default; most logs within 15 minutes; previous dates only; definitive source for forensic analysis; file access and denied events don't include the file name and aren't in the unified audit log; admin log), <https://learn.microsoft.com/purview/rights-management-usage-logging> (accessed Nov 11, 2026).
[^c05-remove-filelabel]: Microsoft Learn, "Remove-FileLabel" (PurviewInformationProtection module; `-RemoveLabel` removes a template-based label and its protection; `-RemoveProtection` for custom permissions; `-JustificationMessage`), <https://learn.microsoft.com/powershell/module/purviewinformationprotection/remove-filelabel> (accessed Nov 11, 2026).
