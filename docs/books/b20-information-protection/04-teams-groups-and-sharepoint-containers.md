---
title: "Chapter 04 — Teams, Groups and SharePoint Containers"
description: "How container sensitivity labels govern the places content lives: privacy, guest access, external sharing, access from unmanaged devices, authentication contexts, private-team discovery and shared channels, the default sharing link and members' sharing rights; who may create new teams, groups and sites; labeling existing sites in bulk; the Conditional Access dependency for unmanaged devices; the document-to-site mismatch signal; and the exact commands, rings, rollback, exclusions, telemetry, evidence and government-cloud availability for each."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 4
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 04 — Teams, Groups and SharePoint Containers

*Sharing is decided per site, not per document, so the site has to carry the classification; a container label sets who can join, who can share and from which devices, and an owner can't quietly loosen it.*

::: {.callout-note}
## In this chapter
What a container label does and what it doesn't: it governs the team, group or site, and the files inside don't inherit it. The settings it controls (privacy, guest access, external sharing, unmanaged devices, authentication contexts, private-team discovery and shared channels, the default sharing link and who may share) and the program's settings for each container class. Who may create new teams, groups and sites. How to turn on container labels, create the labels, put the Conditional Access dependency in place, label existing sites in bulk and test it, with rings, rollback and exclusions. With [Chapter 03](03-label-publication-and-defaults.md), this chapter carries closure-map row CM-12 (no labels, defaults or containers).
:::

[Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites) introduced container labels as the answer to a gap assessments find again and again: SharePoint external sharing is set per site, so a CUI document and a public one in the same library get the same policy. It gave the Graph commands that turn on label support for Microsoft 365 groups and noted the tenant-level external collaboration settings above them. This chapter doesn't repeat those. It designs the labels per container class, adds the settings Book 12 didn't cover, governs who creates containers in the first place, and gives the procedure and evidence.

Guest access itself, the partner route into the tenant and cross-tenant settings are [Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md) and [Book 04](../b04-access/index.md); Conditional Access policy design is [Book 04](../b04-access/index.md). This chapter uses them; it doesn't redesign them.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Access); Applications and Workloads (Application Access)
- **Depends on:** Identity: group label support in Microsoft Entra ID, guest and external collaboration settings ([Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md)), Conditional Access with app-enforced restrictions and authentication contexts ([Book 04](../b04-access/index.md)); Devices: device compliance to tell managed from unmanaged ([Book 05](../b05-devices/index.md)); the container labels designed in [Chapter 02](02-sensitivity-label-architecture.md)
- **Attack chain interrupted:** Collection and Exfiltration through oversharing (anonymous links, guest sprawl, downloads to unmanaged devices); Persistence through guests added to sensitive teams by owners
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Container classes and their settings](#b20-04-container-classes-and-their-settings), [Who may create containers](#b20-04-who-may-create-containers) | Decision records for the container labels and for creation governance ([template](01-data-inventory-and-classification.md#decision-record-template)) |
| Configured | [Enforcement](#b20-04-enforcement), steps 1 to 4 | `Get-Label` export of each container label's settings; the directory setting export; the Conditional Access policy export |
| Enforced | [Enforcement](#b20-04-enforcement), steps 5 and 6 | Every site and team in scope carries a container label; the SharePoint site list export with the Sensitivity column |
| Evidenced | [Validate](#b20-04-validate) | Test record: guest add blocked, external share blocked, unmanaged device limited, mismatch event raised |
| Operated | [Day-two ownership](#b20-04-day-two-ownership) | Monthly unlabeled-container report, mismatch-event review, quarterly owner attestation |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## What a container label does, and what it doesn't

A sensitivity label applied to a team, Microsoft 365 group, SharePoint site, Viva Engage community or Loop workspace sets the container's protection settings. The items inside **don't** inherit the label and get none of its item settings: no marking, no encryption. Content taken out of a labeled site is unprotected unless it carries its own label.[^c04-containers] Container labels and file labels therefore work together: the container label limits who gets in and how content can be shared; the file label (applied by default, by users, or by auto-labeling in [Chapter 09](09-auto-labeling-and-sensitive-information-types.md)) protects each item wherever it goes. Users can label files in SharePoint only once labels are enabled for Office files in SharePoint and OneDrive ([Chapter 07](07-sharepoint-and-onedrive.md)).

Two behaviors make container labels a governance tool rather than a suggestion:

- **The privacy setting locks.** A label set to Public or Private sets and locks the container's privacy; it can be changed only by removing the label.[^c04-containers]
- **Owners act through the label.** Some label options extend to site owners settings otherwise reserved for administrators: when a label carries external-sharing or authentication-context settings, an owner changes them by changing the label. Microsoft says not to configure those settings if site owners shouldn't be able to make such changes.[^c04-containers] The program keeps owners on a short, ordered list of container labels, so "changing the label" means moving to another approved set of settings, and a move to a less restrictive label is a monitored event.

## Container classes and their settings {#b20-04-container-classes-and-their-settings}

| Setting | `Internal site` | `CUI site` | `CUI Specified site` | Source of the setting |
|---|---|---|---|---|
| Privacy | Private | Private | Private | Label: privacy |
| Owners can add guests | Yes, under [Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md) rules | Yes, existing guests only | No | Label: external user access |
| External sharing from the site | New and existing guests | Existing guests | Only people in the organization | Label: external sharing |
| Unmanaged devices | Limited, web-only access | Limited, web-only access | Block | Label: Conditional Access (needs app-enforced restrictions) |
| Authentication context | None | None | Phishing-resistant MFA context, where licensed and available | Label: authentication context |
| Private-team discovery | Allowed | Allowed | Not discoverable | Label: private teams discoverability |
| Shared channels | Internal only | Internal only | Same label only | Label: shared channel controls |
| Default sharing link | People in the organization, view | Specific people, view | Specific people, view | Label advanced settings `DefaultSharingScope`, `DefaultShareLinkPermission` |
| Who may share | Owners and members | Owners and members share files; only owners share the site | Only owners | Label advanced setting `MembersCanShare` |

: Container labels (program's design; illustrative values) {.striped .hover}

What each setting does, from Learn:

- **External sharing** offers anyone, new and existing guests, existing guests, or only people in the organization, the same choices as a site's own external-sharing setting.[^c04-containers] It can only tighten what the tenant allows: the tenant's SharePoint and Entra settings sit above it ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites)).
- **Unmanaged devices** uses SharePoint's app-enforced restrictions with Conditional Access. Without the Conditional Access policy the label setting has no effect, and it also has no effect if it is less restrictive than the tenant-level unmanaged-device setting; choose a label setting equal to or stricter than the tenant's.[^c04-containers]
- **Authentication context** requires a Conditional Access authentication context already created and published; users of apps that don't support authentication contexts are denied access.[^c04-containers] It is listed with E5/G5-level plans and is on the engineering backlog in GCC, GCC High and DoD ([Prerequisites](#b20-04-prerequisites)), so the program's design uses it only in a commercial tenant and leaves the setting off elsewhere, with the block on unmanaged devices as the compensating control.
- **Default sharing link** sets the scope and permission preselected when a user shares; users can override it, but typically don't. Where a site and a document both have a default, the more restrictive scope applies.[^c04-sharing-link]
- **Members can share** is the label equivalent of the site-sharing permission setting in the SharePoint admin center (`MemberShareAll`, `MemberShareFileAndFolder`, `MemberShareNone`).[^c04-containers]

**Authority:** Risk-based recommended (the program's position, for the risk of oversharing from containers whose sharing is set per site). Microsoft-recommended for the change-control cautions: test a new container label with a few users before publishing it to everyone, and don't change a published label's site and group settings after it has been applied (Microsoft Learn, "Use sensitivity labels to protect collaborative workspaces (groups and sites)," accessed Nov 11, 2026).
**Applies:** License-dependent: container labels need group label support in Microsoft Entra ID, which needs at least one Microsoft Entra ID P1 license ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites)); authentication contexts on labeled sites need E5/G5-level plans.[^c04-purview-sd] Environment-dependent: see the availability table.

## Who may create containers {#b20-04-who-may-create-containers}

Every team, Microsoft 365 group and group-connected site starts as a group. By default every user can create one, and Microsoft calls that the recommended approach, because people can start collaborating without waiting for IT.[^c04-creation] The program keeps self-service creation and governs it with labels instead: mandatory labeling for groups and sites ([Chapter 03](03-label-publication-and-defaults.md#mandatory-labeling-and-the-downgrade-justification)) means nothing is created without a label, and the default `Internal site` label means a new container starts private, guest-limited and shared by default only inside the agency.

Where an agency's risk assessment calls for it, creation can be limited to members of one group (nested groups are allowed), for example people who completed a short owner's course. Some administrator roles can still create groups through their own admin centers.[^c04-creation] The program treats the restriction as **optional**, and if used, ties membership of the creators group to the owner training in [Book 16](../b16-people/index.md).

## How: label the agency's containers

### Prerequisites {#b20-04-prerequisites}

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Sensitivity labels for Teams, Microsoft 365 groups and SharePoint sites | Available | Available | Available | Available | Government Purview planning pages[^c04-gcc][^c04-gcch][^c04-dod] |
| Conditional Access via authentication context for labeled SharePoint sites | Available (E5/G5-level) | On engineering backlog | On engineering backlog | On engineering backlog | Same pages ("Granular conditional access policies via Sensitivity labels for SharePoint Online sites") |
| Default sharing link and `MembersCanShare` advanced settings | Available | Not yet specified | Not yet specified | Not yet specified | "Use sensitivity labels to configure the default sharing link type"[^c04-sharing-link]; not listed on the government pages |
| App-enforced restrictions for unmanaged devices | Available | Not yet specified | Not yet specified | Not yet specified | "Use app-enforced restrictions"[^c04-aer]; not listed on the government pages |
| Restricting Microsoft 365 group creation | Available (Entra ID P1 for the admin and the creators) | Not yet specified | Not yet specified | Not yet specified | "Manage who can create Microsoft 365 Groups"[^c04-creation] |

: Container features by cloud, read Nov 11, 2026 {.striped .hover}

Where a cloud's status is "not yet specified", test the setting in that cloud's test tenant before relying on it, and record the result in the decision record.

- **Licenses:** Microsoft Entra ID P1 for group label support and for group-creation restriction; E5/G5-level for authentication contexts. A missing license is a dependency to record with its compensating control, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).
- **Roles:** Information Protection Admin for labels; SharePoint Administrator for site commands; Groups Administrator for the directory setting; Conditional Access Administrator for the policy. Each through PIM ([Book 04](../b04-access/index.md)).
- **Modules:** ExchangeOnlineManagement (Security & Compliance), Microsoft.Online.SharePoint.PowerShell version 16.0.19418.12000 or later for bulk labeling,[^c04-containers] Microsoft.Graph.Beta.
- **Done before this chapter:** container labels designed and created ([Chapter 02](02-sensitivity-label-architecture.md)); label policies published with a groups-and-sites default ([Chapter 03](03-label-publication-and-defaults.md)); the tenant-level SharePoint sharing and unmanaged-device settings decided.

### Pilot

The pilot is three new test sites and teams, one per container label, owned by the implementing team, plus five existing low-risk team sites whose owners volunteer. Success: each test case in [Validate](#b20-04-validate) behaves as designed, and no owner of a pilot site reports a broken workflow in two weeks.

### Report-only or audit phase

Container labels have no audit mode. Two observation steps stand in for one. Before labeling existing sites, export each site's current sharing setting so the change in ring 3 is known in advance (step 5 below). The Conditional Access policy for unmanaged devices starts in **report-only** for the pilot users, and its report-only result is read in the sign-in log before it is turned on ([Book 04](../b04-access/index.md); [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#how-section-template)).

### Enforcement {#b20-04-enforcement}

Commands were checked against Microsoft Learn on Nov 11, 2026; run them against a test tenant first. Placeholders: `<label-guid>` is a label's GUID from `Get-Label`; `<site-url>` a site's URL; `<tenant>` the tenant's SharePoint name.

1. **Turn on label support for groups and synchronize labels.** Use the Graph commands in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites), connecting with `Connect-MgGraph -Environment USGov` in GCC High or `-Environment USGovDoD` in DoD ([environments](https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands)), then run `Execute-AzureAdLabelSync` in Security & Compliance PowerShell.[^c04-containers][^c04-graph-env] Allow up to 24 hours before the labels appear for groups.

2. **Set each container label's site and group settings** in the Microsoft Purview portal (**Information Protection** > **Sensitivity labels** > the label > **Edit label**, scope **Groups & sites**, then **Privacy and external user access settings**, **External sharing and Conditional Access settings**, and **Private teams discoverability and shared channel controls**), using the values in the design table.[^c04-containers] Then set the PowerShell-only settings, by GUID:

    ```powershell
    $internalSite = (Get-Label -Identity 'Internal site').Guid
    $cuiSite      = (Get-Label -Identity 'CUI site').Guid
    $cuiSpSite    = (Get-Label -Identity 'CUI Specified site').Guid

    Set-Label -Identity $internalSite -AdvancedSettings @{DefaultSharingScope = "Organization"; DefaultShareLinkPermission = "View"}
    Set-Label -Identity $cuiSite      -AdvancedSettings @{DefaultSharingScope = "SpecificPeople"; DefaultShareLinkPermission = "View"}
    Set-Label -Identity $cuiSpSite    -AdvancedSettings @{DefaultSharingScope = "SpecificPeople"; DefaultShareLinkPermission = "View"}

    Set-Label -Identity $cuiSite   -AdvancedSettings @{MembersCanShare = "MemberShareFileAndFolder"}
    Set-Label -Identity $cuiSpSite -AdvancedSettings @{MembersCanShare = "MemberShareNone"}
    ```

    The setting names and values are Learn's.[^c04-sharing-link][^c04-containers] Export the result:

    ```powershell
    $stamp = Get-Date -Format 'yyyy-MM-dd'
    'Internal site','CUI site','CUI Specified site' | ForEach-Object { Get-Label -Identity $_ } |
      ConvertTo-Json -Depth 8 | Out-File ".\container-labels-$stamp.json" -Encoding utf8
    ```

3. **Put the unmanaged-device dependency in place.** In the Microsoft Entra admin center, create a Conditional Access policy for the pilot users: **Target resources** = Office 365 SharePoint Online; **Conditions** > **Client apps** = all; **Session** = **Use app enforced restrictions**; state **Report-only** for the pilot, **On** in ring 3.[^c04-aer] Follow [Book 04](../b04-access/index.md)'s naming, exclusion and rollout rules for the policy, with emergency access accounts excluded. Then make sure the tenant-level setting is no more restrictive than the labels, in SharePoint Online PowerShell:

    ```powershell
    # Commercial and GCC
    Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
    # GCC High and DoD
    Connect-SPOService -Url https://<tenant>-admin.sharepoint.us -Region ITAR

    Get-SPOTenant | Select-Object ConditionalAccessPolicy
    Set-SPOTenant -ConditionalAccessPolicy AllowLimitedAccess
    ```

4. **Point the mismatch email at the agency's help page.** When a file with a higher-priority label lands in a lower-labeled site, SharePoint emails the uploader and the owners; the message has a help link only the tenant can set:[^c04-containers]

    ```powershell
    Set-SPOTenant -LabelMismatchEmailHelpLink "https://intranet.contoso.example/labels/help"
    ```

5. **Inventory existing sites before labeling them**, so the effect of each label on each site is known:

    ```powershell
    $stamp = Get-Date -Format 'yyyy-MM-dd'
    Get-SPOSite -Limit All |
      Select-Object Url, Template, Owner, SharingCapability, SensitivityLabel, ConditionalAccessPolicy |
      Export-Csv ".\sites-before-$stamp.csv" -NoTypeInformation -Encoding UTF8
    ```

    Data owners and site owners decide each site's container label from this list and the inventory in [Chapter 01](01-data-inventory-and-classification.md#b20-01-inventory-find-where-the-data-already-is). A site with CUI and an `Anyone` sharing setting is a ring-3 priority.

6. **Label existing sites**, one site or a batch from a reviewed CSV of `Url,Label` pairs:

    ```powershell
    # One site
    Set-SPOSite -Identity <site-url> -SensitivityLabel "<label-guid>"

    # A reviewed batch
    Import-Csv .\ring3-sites.csv | ForEach-Object {
      $guid = (Get-Label -Identity $_.Label).Guid   # run in a Security & Compliance session, or prefill the GUID column
      Set-SPOSite -Identity $_.Url -SensitivityLabel "$guid"
    }
    ```

    Learn documents `Set-SPOSite -SensitivityLabel` for per-site labeling and `Set-SPOTenant <url> -SensitivityLabel` for labeling many sites with one label.[^c04-containers] A group-connected site's label is applied through its Microsoft 365 group, and the service applies the same label to the group and the connected site.[^c04-containers]

7. **Optional: restrict who can create groups.** Use Learn's script ("Manage who can create Microsoft 365 Groups"), which sets `EnableGroupCreation` to `False` and `GroupCreationAllowedGroupId` to the creators group in the `Group.Unified` directory setting, after connecting to Graph for the tenant's cloud.[^c04-creation] Verify with a non-member account: creating a plan in Planner reports that group creation is disabled. Changes can take 30 minutes or more.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Implementing team's three test sites | Every [Validate](#b20-04-validate) case passes |
| 1 | Pilot sites; Conditional Access policy in report-only for pilot users | Two weeks; report-only results read; no broken owner workflow |
| 2 | New containers tenant-wide (the default label and mandatory labeling from Chapter 03 already apply); CUI-bearing existing sites | Two weeks; mismatch events triaged; help-desk volume within threshold |
| 3 | All existing sites and teams; Conditional Access policy **On** | Unlabeled-container report at zero, or each remaining site on the exception list |

- **Emergency access:** emergency access accounts are excluded from the app-enforced-restrictions Conditional Access policy, and the exclusion is tested with the quarterly emergency access test ([Book 04](../b04-access/index.md)).
- **Change window:** labeling existing sites is a normal change, batched by office and announced to site owners five business days ahead with the label each site will get.
- **Backout triggers:** a mission team loses access it needs to an approved external partner; an approved workflow (for example a records transfer) fails on the sharing restriction; more than two help-desk tickets per labeled site in the first week.
- **Post-change validation:** re-export the site list (step 5) and compare the Sensitivity column and sharing setting with the plan; run the validation cases on one site per batch.

### Rollback

- **A site's label:** set the previous label with the same command (`Set-SPOSite -Identity <site-url> -SensitivityLabel "<previous-label-guid>"`); where the site had no label, move it to `Internal site`, the least restrictive container label, rather than removing labels in bulk. A label's privacy setting stays on the container even after the label is removed,[^c04-containers] so restore the site's prior sharing setting from the step-5 export where the plan calls for it: `Set-SPOSite -Identity <site-url> -SharingCapability <value-from-export>`.
- **A label's settings:** don't edit a published container label's site and group settings to roll back; changes take up to 24 hours to reach containers, and a cleared **External user access** setting doesn't remove guests who already have access.[^c04-containers] Move the affected sites to another label instead.
- **The Conditional Access policy:** set it back to report-only or off ([Book 04](../b04-access/index.md)).
- **Group creation:** rerun Learn's script with `$GroupName = ""` and `$AllowGroupCreation = "$true"`.[^c04-creation]
- **Turning container labels off entirely** reverts containers to the old Classification property and stops enforcing every container label setting;[^c04-containers] it is a decision for the platform owner and the data owners, never an operator's backout step.

The operator can roll back a batch of sites in under an hour from the export; Conditional Access changes take effect at the next sign-in.

### Exclusions

| What | Why | Approver | Review |
|---|---|---|---|
| Emergency access accounts | From the Conditional Access policy, never from labels | Platform owner | Quarterly |
| Sites that must share with the public (for example a public-information hub) | Their class is `Public`; they get no container label that restricts sharing, or a dedicated public-site label | Data owner of the content | Annually |
| Sites a migration or records transfer still writes to | A sharing change would break the transfer | Records officer | Until the transfer ends |

: Container exclusions {.striped .hover}

Each excluded site is listed in the exception register with its approver and review date.

### Telemetry

- **Audit:** applying, changing and removing a label on a site or group, and **Detected document sensitivity mismatch** (File and page activities), are in the audit log's sensitivity label activities.[^c04-containers] [Chapter 10](10-audit-insider-risk-and-communication-compliance.md) has the searches.
- **SharePoint admin center:** **Active sites** with the **Sensitivity** column shows each site's label.[^c04-containers]
- **Sign-in logs:** the Conditional Access policy's report-only and enforced results for unmanaged-device sessions.
- **Detection:** [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) alerts when a CUI-labeled site is relabeled to a less restrictive label, and on repeated mismatch events in one site.

### Validate {#b20-04-validate}

This is the container half of CM-12's "labeled sample". On a `CUI site` and a `CUI Specified site`:

1. The owner tries to add a new guest. Expected: allowed on `CUI site` only for existing guests; blocked on `CUI Specified site`.
2. A member shares a file. Expected: the share dialog preselects **Specific people**, view; sharing to an external address fails on `CUI Specified site`.
3. A user opens the site from an unmanaged browser. Expected: web-only, no download, on `CUI site`; blocked on `CUI Specified site`.
4. A user uploads a file labeled `CUI//SP-<category>` to a `CUI site`. Expected: upload succeeds, the uploader and owners receive the "Incompatible sensitivity label detected" email, and the audit log shows **Detected document sensitivity mismatch**.
5. A user without the label policy tries to create a team without a label. Expected: a label is required; `Internal site` is preselected.

Record the expected and observed result, the date and the tester for each case, with the audit records.

### Evidence

**Evidence checklist**

- [ ] **Configuration:** the dated `Get-Label` JSON export of the container labels; the `Group.Unified` directory setting values; the Conditional Access policy export; the `Get-SPOTenant` sharing and unmanaged-device settings (CM-12's policy export, for containers)
- [ ] **Operational:** the monthly site list export with the Sensitivity column, and the unlabeled-container count; mismatch events and their triage
- [ ] **Test:** the validation record, with the audit events it produced (CM-12's labeled sample, for containers)
- [ ] **Exception:** the excluded sites and accounts with approver and review date
- [ ] **Assessor-ready artifact:** the site list showing each CUI-bearing site's label, tied to the class register and the decision records, cited from the AC-3, AC-4 and AC-21 implementation statements

### Day-two ownership {#b20-04-day-two-ownership}

The **platform owner** owns the container labels and the tenant sharing settings; **policy owners** decide which class each site holds; **site owners** keep their membership and guests current and attest quarterly, prompted by an access review ([Book 04](../b04-access/index.md)); the **operator** labels new batches and runs the monthly unlabeled-site report; the **security monitor** watches relabels and mismatch events; the **help desk** handles blocked-share and unmanaged-device calls with the [Book 15](../b15-day2-operations/index.md) script. Drift is a site without a label, a site whose sharing setting is looser than its label allows, or a container label whose settings differ from the export ([Chapter 12](12-operations-and-evidence.md)). The full RACI is in [Chapter 12](12-operations-and-evidence.md#raci).

## Key takeaways

- A container label governs the site, not the files in it; pair it with file labels and SharePoint label integration.
- Three container labels, ordered with the file labels, carry privacy, guest, sharing, unmanaged-device and sharing-link settings for each class.
- The unmanaged-device setting does nothing without its Conditional Access policy; authentication contexts are still on the engineering backlog in the government clouds.
- Label existing sites from an inventory, in batches, with the prior sharing settings exported for rollback.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 03 — Label Publication and Defaults](03-label-publication-and-defaults.md) · [Book index](index.md) · [Next: Chapter 05 — Rights Management and Recovery →](05-rights-management-and-recovery.md)
:::

[^c04-containers]: Microsoft Learn, "Use sensitivity labels to protect collaborative workspaces (groups and sites)," sections on the list of container settings, site owners acting through the label, items not inheriting the label, "How to enable sensitivity labels for containers and synchronize labels," "How to configure groups and site settings for containers" (privacy lock; external sharing options; unmanaged devices and authentication context dependencies), "Configure site sharing permissions by using PowerShell advanced settings" (`MembersCanShare`), "Sensitivity label management" (publish to test users first; don't change published settings; External users access change doesn't remove existing guests), "Use PowerShell to apply a sensitivity label to multiple sites" (module version 16.0.19418.12000+), "View and manage sensitivity labels in the SharePoint admin center," "Auditing sensitivity label activities" (Detected document sensitivity mismatch; `LabelMismatchEmailHelpLink`) and "How to disable sensitivity labels for containers," <https://learn.microsoft.com/purview/sensitivity-labels-teams-groups-sites> (accessed Nov 11, 2026).
[^c04-sharing-link]: Microsoft Learn, "Use sensitivity labels to configure the default sharing link type for sites and documents in SharePoint and OneDrive" (`DefaultSharingScope`: SpecificPeople, Organization, Anyone; `DefaultShareLinkPermission`: View, Edit; the more restrictive scope applies), <https://learn.microsoft.com/purview/sensitivity-labels-default-sharing-link> (accessed Nov 11, 2026).
[^c04-aer]: Microsoft Learn (SharePoint), "Use app-enforced restrictions" (Conditional Access policy for Office 365 SharePoint Online with the session control Use app enforced restrictions), <https://learn.microsoft.com/sharepoint/app-enforced-restrictions> (accessed Nov 11, 2026).
[^c04-creation]: Microsoft Learn, "Manage who can create Microsoft 365 Groups" (all users by default, the recommended approach; one group controls creation; roles that can still create groups; Entra ID P1 for the admin and creators; the Graph script with `EnableGroupCreation` and `GroupCreationAllowedGroupId`; verification and the 30-minute delay), <https://learn.microsoft.com/microsoft-365/enterprise/manage-creation-of-groups> (accessed Nov 11, 2026).
[^c04-graph-env]: Microsoft Learn, "Authentication module cmdlets in Microsoft Graph PowerShell," section "Use Get-MgEnvironment" (`-Environment` values include USGov and USGovDoD), <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands> (accessed Nov 11, 2026).
[^c04-purview-sd]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Information Protection sensitivity labeling" (authentication contexts on SharePoint sites through sensitivity labels with E5/G5-level plans), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c04-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c04-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c04-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
