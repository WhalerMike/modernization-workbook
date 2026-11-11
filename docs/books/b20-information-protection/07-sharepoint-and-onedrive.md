---
title: "Chapter 07 — SharePoint and OneDrive"
description: "How the agency makes labeled and encrypted files work where most of them live: why SharePoint and OneDrive can't search, scan, co-author or apply DLP to encrypted files until label integration is on; turning it on, with PDF support, and the encryption settings it can't process; inventorying legacy SharePoint IRM libraries and moving their protection to sensitivity labels, with the government-cloud gap in default library labels; turning on co-authoring for encrypted files only after the labeling-metadata change is safe for every app that reads labels; and the rollback, telemetry, evidence and ownership for each, with feature availability in GCC, GCC High and DoD."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 7
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 07 — SharePoint and OneDrive

*An encrypted file that the service can't read is invisible to search, to eDiscovery and to DLP; turning on label integration is what lets protection and oversight coexist.*

::: {.callout-note}
## In this chapter
What changes when SharePoint and OneDrive can read the files that sensitivity labels encrypt, and what stays broken until they can. How to turn label integration on, add PDF support, and avoid the label encryption settings the service can't process. How to find libraries still protected by SharePoint Information Rights Management (IRM), and how to move them to labels, including what to do in GCC, GCC High and DoD, where the default library label is still in development. How to turn on co-authoring for encrypted files without breaking the apps that read labels the old way. Each procedure follows the How template, with rollback, telemetry, evidence and ownership.
:::

[Chapter 04](04-teams-groups-and-sharepoint-containers.md) governed sites and teams as containers: privacy, guests, external sharing and unmanaged devices. This chapter is about the files inside them. A container label doesn't label the files in the container;[^c07-b12-containers] the files carry their own labels, applied by people ([Chapter 03](03-label-publication-and-defaults.md)) or by policy ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md)). When one of those labels encrypts, the file in SharePoint or OneDrive is ciphertext to the service unless the agency has told SharePoint and OneDrive to process labeled content.

That is the setting this chapter turns on first, because without it the rest of the book quietly fails. Until it is enabled, SharePoint and OneDrive can't process encrypted files, "which means that coauthoring, eDiscovery, data loss prevention, search, and other collaborative features won't work for these files."[^c07-spo-labels] An agency that publishes encrypting labels before enabling it ends up with its most sensitive documents being the ones its DLP can't see and its records team can't find.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Encryption; Data Access; Data Inventory Management)
- **Depends on:** Rights Management active ([Chapter 05](05-rights-management-and-recovery.md)); the label design and publication ([Chapter 02](02-sensitivity-label-architecture.md), [Chapter 03](03-label-publication-and-defaults.md)); container labels ([Chapter 04](04-teams-groups-and-sharepoint-containers.md)); for DLP and search on encrypted content, [Chapter 08](08-dlp-and-endpoint-controls.md) and [Chapter 10](10-audit-insider-risk-and-communication-compliance.md)
- **Attack chain interrupted:** Collection and Exfiltration (encrypted content stays inspectable by DLP and eDiscovery inside the tenant, and protected when downloaded)
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Decide](#decide-integration-legacy-irm-and-co-authoring) | Decision record ([template](01-data-inventory-and-classification.md#decision-record-template)) for integration, PDF support, each IRM library's disposition and co-authoring |
| Configured | [Label integration](#how-turn-on-label-integration-for-sharepoint-and-onedrive); [IRM inventory](#how-move-legacy-irm-libraries-to-sensitivity-labels) | `Get-SPOTenant` export; IRM library inventory |
| Enforced | [Enforcement](#enforcement); [IRM enforcement](#enforcement-irm); [co-authoring](#enforcement-coauth) | Integration and PDF settings **True**; IRM disabled on migrated libraries; co-authoring on |
| Evidenced | [Validate](#validate-labeled-files-behave) | Test record with audit events for label applied, changed and removed |
| Operated | [Day-two ownership](#day-two-ownership) | Monthly IRM library reconciliation; drift check on the tenant settings |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## What label integration changes

After integration is enabled, for new and changed files whose label encrypts with a cloud-based key (not Double Key Encryption), Microsoft documents that:[^c07-spo-labels]

- SharePoint and OneDrive recognize the label on Word, Excel, PowerPoint and uploaded PDF files and can process their contents;
- users can open and edit those files in Office for the web, with the label's permissions enforced, and apply labels from the ribbon or the details pane, including from the **Files** tab in Teams;
- eDiscovery supports full-text search, and DLP policies support the content;
- the label and its encryption stay with the file when it is downloaded;
- three audit events become available: **Applied sensitivity label to file**, **Changed sensitivity label applied to file** and **Removed sensitivity label from file**.

What it doesn't change matters as much, because each item below is a way a protected file can drop out of view:[^c07-spo-labels]

| Limit | Consequence | The program's response |
|---|---|---|
| Files already in SharePoint, labeled with encryption before integration was turned on | Not processed until they are edited, or downloaded and uploaded again | Count them in the [Validate](#validate-labeled-files-behave) step; touch them through the owners' review in [Chapter 12](12-operations-and-evidence.md) |
| Labels whose encryption sets **User access to content expires** to anything but **Never**, or uses **Double Key Encryption** | The service can't process them; the labels aren't shown in Office for the web, and nor are their sublabels if they are parents | Don't set expiry on labels used in SharePoint ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#mapping-cui-to-sensitivity-labels) already rules out default expiry); keep DKE to the narrowest set and store it outside the collaboration path |
| Password-protected documents | Labels can't be read or applied | DLP condition on password-protected attachments where needed ([Chapter 08](08-dlp-and-endpoint-controls.md)) |
| Encrypted Office files over 12 MB copied or moved to a different site | No longer processed; label not shown | Move large protected files within the site, or relabel after the move |
| Files with Power Query data, custom XML parts, a bibliography or a Document ID added on upload, labeled and encrypted in desktop apps | Not processed | Label without encryption where these features are needed, or open in desktop apps |
| A label deleted rather than removed from its policy | Files downloaded from SharePoint are no longer labeled or encrypted | Never delete a production label; retire it through the label policy ([Chapter 03](03-label-publication-and-defaults.md)) |
| Printing, downloading, exporting or copying an encrypted file from Office for the web | Not supported | Users open the desktop app; the help desk script says so |

**Authority:** Microsoft-recommended. Microsoft's guidance is to enable sensitivity labels for Office files in SharePoint and OneDrive so that the services can process encrypted files, and to tell users to protect documents with labels only.[^c07-spo-labels]
**Applies:** License-dependent: encrypting labels need a Rights Management service plan ([Chapter 05](05-rights-management-and-recovery.md#prerequisites)). Environment-dependent: see the availability table.

## Decide: integration, legacy IRM and co-authoring

| Decision | The program's position | Authority |
|---|---|---|
| Label integration for Office files | On, before the first encrypting label reaches users beyond the pilot | Microsoft-recommended[^c07-spo-labels] |
| PDF support | On, after the auto-labeling policies in [Chapter 09](09-auto-labeling-and-sensitive-information-types.md) have been simulated with PDFs in scope, because enabling PDFs can increase how many files existing auto-labeling policies label[^c07-spo-labels] | Microsoft-recommended, with the program's staging |
| OneNote labeling (section level) | Optional; decided with the records officer | Optional |
| Legacy SharePoint IRM libraries | Each one migrated to labels, then IRM disabled on it; in GCC, GCC High and DoD, IRM stays on a library until its files are labeled, because the default library label isn't available there yet | Risk-based recommended |
| Co-authoring for encrypted files | On, only after every app, service and tool that reads labels supports the new metadata location | Microsoft-recommended, with Microsoft's own caution[^c07-coauth] |

## How: turn on label integration for SharePoint and OneDrive

### Prerequisites

- **Roles and module.** SharePoint Administrator, through PIM. SharePoint Online Management Shell 16.0.19418.12000 or later (16.0.26914.12004 for OneNote; 16.0.24211.12000 for the PDF setting).[^c07-spo-labels]
- **Labels replicated.** Microsoft's safeguard: publish new labels to a few test users, wait at least an hour, verify behavior in SharePoint and OneDrive, and wait at least a day before widening the policy, so labels have synchronized to the service before standard users apply them.[^c07-spo-labels]
- **OneDrive sync app** 19.002.0121.0008 or later on Windows; older clients are prompted to update.[^c07-spo-labels]
- **License.** As for encrypting labels ([Chapter 05](05-rights-management-and-recovery.md#prerequisites)). A missing license is a licensing decision, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).
- **Government-cloud availability.**

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Sensitivity labels for Office files in SharePoint and OneDrive (`EnableAIPIntegration`) | Available | not yet specified (not listed separately; auto-labeling for SharePoint and OneDrive and co-authoring, which depend on it, are listed Available) | not yet specified (as GCC) | not yet specified (as GCC) | Purview planning pages, Sensitivity labeling rows[^c07-gcc][^c07-gcch][^c07-dod] |
| Co-authoring on encrypted documents | Available | Available | Available | Available | Same pages[^c07-gcc][^c07-gcch][^c07-dod] |
| Default label for an unlabeled file uploaded to a SharePoint library | Available | In development | In development | In development | Same pages[^c07-gcc][^c07-gcch][^c07-dod] |
| Encrypted labeled PDFs searchable and eDiscoverable | Available | not yet specified (row not on the GCC page) | On engineering backlog | On engineering backlog | Same pages[^c07-gcc][^c07-gcch][^c07-dod] |
| SharePoint IRM | Available | not yet specified | not yet specified | not yet specified | Not on the government pages |
| `Unlock-SPOSensitivityLabelEncryptedFile` | Available | not yet specified | not yet specified | not yet specified | Not on the government pages |

Government feature status "is subject to change"; read the pages again at each reassessment.

Connect to SharePoint Online. Placeholders in this chapter: `<tenant>` (the tenant's SharePoint name), `<site-url>`, `<library-name>`, `<file-url>`, `<ticket-number>`, `<app-id>` (an app registration for the inventory script) and `<inventory-file>`. Commands were checked against Microsoft Learn on Nov 11, 2026; run them against a test tenant first.

```powershell
Install-Module -Name Microsoft.Online.SharePoint.PowerShell
Update-Module -Name Microsoft.Online.SharePoint.PowerShell

# Commercial and GCC:
Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
# GCC High and DoD (SharePoint is under sharepoint.us; authenticate in the ITAR region):
Connect-SPOService -Url https://<tenant>-admin.sharepoint.us -Region ITAR
```

`-Region ITAR` is the authentication region parameter Learn's `Connect-SPOService` examples show, and `*.sharepoint.us` is the GCC High SharePoint endpoint.[^c07-connect-spo][^c07-gcch-endpoints]

Read the current state:

```powershell
Get-SPOTenant | Format-List EnableAIPIntegration, EnableSensitivityLabelforPDF, EnableSensitivityLabelforOneNote
```

### Pilot

Integration is a tenant setting, so the pilot is on labels, not on sites: before enabling, publish the encrypting labels only to the label pilot ([Chapter 03](03-label-publication-and-defaults.md)) and keep them there until the [Validate](#validate-labeled-files-behave) step passes in a pilot site.

### Report-only or audit phase

Not applicable to the switch itself: SharePoint has no audit mode for label processing. The observation phase is the label pilot: watch the three label audit events and the **Sensitivity** column in a pilot library for a week after enabling.

### Enforcement

Microsoft's steps; the change takes about 15 minutes to take effect, and Multi-Geo tenants run it in each geo:[^c07-spo-labels]

```powershell
Set-SPOTenant -EnableAIPIntegration $true

# After the Chapter 09 auto-labeling simulations include PDFs:
Set-SPOTenant -EnableSensitivityLabelforPDF $true

Get-SPOTenant | Format-List EnableAIPIntegration, EnableSensitivityLabelforPDF
```

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | A test site with the platform owner's test accounts, encrypting labels published to them only | Labeled files open in Office for the web; search and a DLP test policy find their content |
| 1 | The label pilot group, in their own sites | One week of label audit events with no unexplained failures |
| 2 | Encrypting labels published to early adopters | Help-desk tickets within threshold |
| 3 | Encrypting labels published to everyone in scope | Post-change validation passed |

- **Emergency access:** not applicable: the setting doesn't affect sign-in.
- **Change window:** a standard change window; the SharePoint and Purview platform owners both approve.
- **Backout triggers:** labeled files failing to open in Office for the web for users who hold rights; sync clients reporting upload failures on labeled files.
- **Post-change validation:** [Validate](#validate-labeled-files-behave), after each ring.

### Rollback

`Set-SPOTenant -EnableAIPIntegration $false` turns integration off, but Microsoft warns that the result is a mixed state: files labeled before opting out keep working, files labeled after don't (no label shown, no Office for the web, no search, eDiscovery, DLP or co-authoring), and restoring consistency means turning it back on and re-uploading or relabeling the affected files.[^c07-spo-labels] The program treats opting out as a last resort for a service-wide fault, decided by the platform owner with the policy owner, and prefers to roll back the label publication instead ([Chapter 03](03-label-publication-and-defaults.md)).

### Exclusions

None at tenant level. Libraries that still use IRM are handled in the next procedure; DKE-labeled content is kept out of SharePoint collaboration by design.

### Telemetry

| Signal | Where it comes from | Where it goes |
|---|---|---|
| Label applied, changed or removed on a file | Microsoft Purview audit, sensitivity label activities[^c07-spo-labels] | Workspace ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)); mass removal is detection FMP-DET-05 in [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) |
| Tenant setting changed | `Get-SPOTenant` drift check against the recorded export ([Book 13](../b13-governance/index.md)) | Drift report |
| Opens and denials of encrypted files | Rights Management usage log ([Chapter 05](05-rights-management-and-recovery.md#report-only-or-audit-phase)) | Evidence store |

### Evidence

**Evidence checklist**

- [ ] **Configuration:** dated `Get-SPOTenant` export showing `EnableAIPIntegration` and `EnableSensitivityLabelforPDF`
- [ ] **Operational:** label audit events for the period, kept as [Book 13, Chapter 13](../b13-governance/13-records-evidence-and-retention.md) sets
- [ ] **Test:** the [Validate](#validate-labeled-files-behave) record
- [ ] **Exception:** sites or files excluded from collaboration by design (DKE content), with owner and review date
- [ ] **Assessor-ready artifact:** the register entry for the finding, linking the four items above

### Day-two ownership

The **platform owner** (SharePoint) owns the tenant settings and runs the drift check monthly. The **policy owner** decides which labels may encrypt content stored in SharePoint. The **operator** handles the re-upload or relabel of files labeled before integration. The **security monitor** watches label-removal patterns. The **help desk** handles "can't open in the browser" with the desktop-app answer ([Book 15](../b15-day2-operations/index.md)). The **assessor** reads the evidence above. Drift looks like: `EnableAIPIntegration` false, or a published label with expiry or DKE appearing in SharePoint libraries. Roles are in [Chapter 12](12-operations-and-evidence.md#raci).

## How: move legacy IRM libraries to sensitivity labels

SharePoint IRM is the older protection: it applies encryption and restrictions to files at the list or library level when they are downloaded, so that a downloaded file stays protected outside SharePoint.[^c07-irm] Learn describes three costs: documents in an IRM-enabled library can't be created or edited in Office in a browser, one person at a time downloads and edits, and collaboration falls back to check-in and check-out.[^c07-irm-setup] It also interacts badly with labels: a file uploaded with an encrypting label into an IRM library isn't processed, so co-authoring, eDiscovery, DLP and search don't work for it.[^c07-spo-labels] Labels carry the same protection, plus markings and the full set of usage rights, and travel with the file wherever it is stored.

### Prerequisites {#prerequisites-irm}

- Label integration on (previous procedure).
- For each library, an owner and a target label from [Chapter 02](02-sensitivity-label-architecture.md) whose permissions match what the IRM policy allowed (who can open, print, copy, and for how long).
- **Inventory tooling.** No SharePoint Online Management Shell cmdlet reports IRM per library. The `IrmEnabled` property is on each list in the SharePoint client object model.[^c07-csom] The script below reads it with PnP PowerShell, a community-maintained module that isn't a Microsoft-supported product; the agency's change board approves its use, and it needs an app registration (`<app-id>`) with read access to the sites.

### Pilot {#pilot-irm}

Inventory every site, then migrate one library whose owner volunteers. Run the inventory first (read-only):

```powershell
# 1. List sites with the SharePoint Online Management Shell (connected above).
$sites = Get-SPOSite -Limit All | Select-Object -ExpandProperty Url

# 2. For each site, read IrmEnabled on every list (PnP PowerShell, read-only).
#    GCC High and DoD: add -AzureEnvironment USGovernmentHigh or USGovernmentDoD to Connect-PnPOnline.
Install-Module -Name PnP.PowerShell -Scope CurrentUser
$rows = foreach ($site in $sites) {
  Connect-PnPOnline -Url $site -Interactive -ClientId <app-id>
  foreach ($list in Get-PnPList) {
    $null = Get-PnPProperty -ClientObject $list -Property IrmEnabled
    if ($list.IrmEnabled) { [pscustomobject]@{ Site = $site; Library = $list.Title; IrmEnabled = $true } }
  }
}
$rows | Export-Csv -Path "<inventory-file>" -NoTypeInformation
```

The pilot succeeds when the pilot library's files all carry the target label, owners can co-author them in the browser and desktop apps, and a downloaded file opens only for holders.

### Report-only or audit phase {#audit-irm}

The inventory is the report-only phase: nothing changes until each library's owner signs its row. For each IRM library, record the IRM policy settings from **Library Settings > Information Rights Management** (the restriction on download, the policy title and the extra options), which Learn documents per library.[^c07-irm-apply]

### Enforcement {#enforcement-irm}

Per library, in this order:

1. **Label the files.**
   - *Commercial:* set the library's default sensitivity label (Library settings in SharePoint) so new and unlabeled uploads take the target label, then have owners label existing files from the details pane, which supports labeling without opening each file.[^c07-spo-labels]
   - *GCC, GCC High and DoD:* the default library label is **In development** on all three government pages,[^c07-gcc][^c07-gcch][^c07-dod] so owners apply the target label to existing files from the details pane or in Office for the web, and a service-side auto-labeling policy scoped to the site ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md)) catches files that match its conditions. IRM stays on the library during this step, so downloads remain protected.
2. **Check coverage.** Search the library for files without the target label. The managed property `InformationProtectionLabelId:<label-guid>` finds files that carry a label; `Get-Label | Format-Table Name, Guid` in Security & Compliance PowerShell gives the GUID.[^c07-spo-labels]
3. **Turn IRM off on the library**, in **Library Settings > Information Rights Management**, by clearing **Restrict permission to documents in this library on download**.[^c07-irm-apply] From then on, downloads carry the label's protection rather than IRM's.
4. **Edit or re-upload** any file that was labeled and encrypted before integration was turned on, so the service processes it.[^c07-spo-labels]

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | A test library with IRM on | Labeled files remain protected on download after IRM is turned off |
| 1 | The volunteer library | Owner sign-off; no access complaints for two weeks |
| 2 | Libraries holding CUI Basic | Coverage check 100 percent before IRM is turned off |
| 3 | Remaining IRM libraries | Inventory shows no IRM library without a signed disposition |

- **Emergency access:** not applicable.
- **Change window:** agreed with each library owner.
- **Backout triggers:** files found unlabeled after IRM was turned off; owners unable to open their own files.
- **Post-change validation:** [Validate](#validate-labeled-files-behave), plus a download test from the migrated library.

### Rollback {#rollback-irm}

Turn IRM back on for the library in **Library Settings > Information Rights Management**; the labels already applied stay on the files. Learn's coexistence rules then apply: files labeled with encryption keep the label's settings on download, and unencrypted Office and PDF files get the IRM restriction.[^c07-spo-labels] A site owner or SharePoint administrator can do it in minutes.

### Exclusions {#exclusions-irm}

Libraries whose content the records officer says can't be relabeled (for example a closed records library under a hold) keep IRM, recorded in the exception register with the reason and a review date.

### Telemetry {#telemetry-irm}

The inventory, rerun monthly, is the drift signal for IRM. Label audit events show the labeling progress per library.

### Evidence {#evidence-irm}

**Evidence checklist**

- [ ] **Configuration:** the IRM inventory before and after, and each library's recorded IRM policy settings
- [ ] **Operational:** label audit events per migrated library; the monthly inventory rerun
- [ ] **Test:** the download test and the coverage check for each library
- [ ] **Exception:** libraries left on IRM, with reason, approver and review date
- [ ] **Assessor-ready artifact:** the migration register (library, owner, target label, date IRM turned off), linked to the four items above

### Day-two ownership {#day-two-irm}

The **policy owner** approves each library's target label; the **platform owner** runs the monthly inventory; site owners label their files. The program's metrics in [Chapter 12](12-operations-and-evidence.md#metrics) count IRM libraries remaining, not libraries migrated.

## How: turn on co-authoring for encrypted files

Without this setting, users must check out an encrypted document stored in SharePoint or OneDrive to edit it in a desktop app, or use Office for the web; with it, several people can edit the same encrypted document at once, and AutoSave works.[^c07-coauth]

### Prerequisites {#prerequisites-coauth}

The setting changes where Office saves labeling metadata for Word, Excel and PowerPoint files, and after it is on, labeling information for unencrypted files is no longer saved in custom properties.[^c07-coauth] Microsoft says not to enable it if any app, service, script or tool reads or writes labels in the old location, and lists the consequences: labeled documents appearing unlabeled or with an out-of-date label, co-authoring failing when another user has the file open in an app that doesn't support the new metadata, and Exchange mail flow rules that identify labels as custom properties of Office attachments failing or encrypting wrongly.[^c07-coauth] Check, and record in the decision record, each of these minimums from Learn:[^c07-coauth]

| Component | Minimum |
|---|---|
| Microsoft 365 Apps for Windows | 2107 (Current Channel or Monthly Enterprise Channel); 2202 (Semi-Annual Enterprise Channel) |
| Microsoft 365 Apps for iOS and Android | 2.58 (iOS); 16.0.14931 (Android) |
| Microsoft Purview Information Protection client and scanner | 3.0 (or 2.12.62.0 for the older unified labeling client) |
| OneDrive sync app | 19.002.0121.0008 |
| Endpoint DLP | Windows 10 2004 with KB 4601382, or any later Windows version |
| Apps and services built on the MIP SDK | 1.7 |
| Exchange mail flow rules | None that read label custom properties on attachments (the rules in [Chapter 06](06-exchange-message-encryption.md) don't) |

Roles: at least DLP Compliance Management or Information Protection Admin; Security Administrator or Compliance Administrator also work.[^c07-coauth] Availability: co-authoring on encrypted documents is Available in GCC, GCC High and DoD.[^c07-gcc][^c07-gcch][^c07-dod] Co-authoring isn't supported for labels with expiry or Double Key Encryption, which the program keeps out of SharePoint anyway.[^c07-coauth]

### Pilot {#pilot-coauth}

The setting is tenant-wide, so the pilot is the inventory above: every row confirmed, with the owner of each third-party app or script that reads labels signing that it supports the new metadata.

### Report-only or audit phase {#audit-coauth}

Not applicable: there is no audit mode. The inventory replaces it.

### Enforcement {#enforcement-coauth}

Turn the setting on in the Microsoft Purview portal: **Settings > Solution settings > Information Protection > Co-authoring for files with sensitivity labels > Turn on co-authoring for files with sensitivity labels > Apply**, then wait 24 hours for it to replicate before relying on it.[^c07-coauth] Record the state from Security & Compliance PowerShell:

```powershell
# Commercial and GCC:
Connect-IPPSSession -UserPrincipalName <admin-upn>
# GCC High:
Connect-IPPSSession -UserPrincipalName <admin-upn> -ConnectionUri https://ps.compliance.protection.office365.us/powershell-liveid/ -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations
# DoD:
Connect-IPPSSession -UserPrincipalName <admin-upn> -ConnectionUri https://l5.ps.compliance.protection.office365.us/powershell-liveid/ -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations

Get-PolicyConfig | Format-List EnableLabelCoauth
```

The connection URIs are the ones Learn gives for GCC High and DoD.[^c07-connect-scc] `EnableLabelCoauth` is the `Set-PolicyConfig` parameter that controls the setting.[^c07-policyconfig]

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Inventory complete; all minimums met | Signed inventory |
| 1 | Tenant-wide switch (the setting has no narrower scope) | After 24 hours, two pilot users co-author an encrypted document in desktop apps |
| 2 | Watch period | Two weeks with no reports of labels disappearing from files |
| 3 | Announce to users | Post-change validation passed |

- **Emergency access:** not applicable.
- **Change window:** a planned change with the platform owner, the policy owner and the owners of every label-reading app on hand.
- **Backout triggers:** labeled documents showing as unlabeled; a label-reading app failing after the switch.
- **Post-change validation:** the co-authoring row of [Validate](#validate-labeled-files-behave).

### Rollback {#rollback-coauth}

The portal can't turn the setting off; only `Set-PolicyConfig -EnableLabelCoauth:$false` can, and it isn't clean: labeling information saved in the new location for unencrypted Word, Excel and PowerPoint files while the setting was on isn't copied back, so it is lost, and co-authoring for encrypted documents stops.[^c07-coauth] The program therefore treats this as a one-way change whose safety comes from the prerequisites, and keeps the rollback command for a service-wide failure only, decided by the policy owner:

```powershell
Set-PolicyConfig -EnableLabelCoauth:$false
```

### Exclusions {#exclusions-coauth}

None; the setting is tenant-wide. An app that can't be updated is a reason to delay the switch, recorded in the decision record, not an exclusion.

### Telemetry {#telemetry-coauth}

Label audit events (a rise in **Removed sensitivity label from file** after the switch is the warning sign) and help-desk tickets tagged for labels.

### Evidence {#evidence-coauth}

**Evidence checklist**

- [ ] **Configuration:** `Get-PolicyConfig` output showing `EnableLabelCoauth`, dated
- [ ] **Operational:** label audit events for the two weeks after the switch
- [ ] **Test:** the co-authoring test record
- [ ] **Exception:** apps delayed or retired because they can't read the new metadata
- [ ] **Assessor-ready artifact:** the signed prerequisite inventory with the four items above

### Day-two ownership {#day-two-coauth}

The **platform owner** keeps the label-reading app inventory current; any new tool that reads labels is checked against the MIP SDK minimum before it is approved.

## Validate: labeled files behave

| Test | Expected outcome | Evidence |
|---|---|---|
| A holder applies an encrypting label in Office for the web in a pilot library | Label shown in the **Sensitivity** column; **Applied sensitivity label to file** in audit | Audit record |
| A second holder opens the same file in Office for the web | Opens and edits with the label's rights | Tester's record |
| Search for a unique phrase in the encrypted file | Found by a holder | Screenshot |
| A DLP test policy matching the phrase ([Chapter 08](08-dlp-and-endpoint-controls.md)) | Matches the encrypted file | DLP activity record |
| Download the file and open it as a non-holder | Refused | Usage log denial ([Chapter 05](05-rights-management-and-recovery.md)) |
| Two holders co-author in desktop apps (after co-authoring is on) | Both edit at once; AutoSave works | Tester's record |
| A file labeled before integration was turned on | Not processed until edited; processed after editing | Before-and-after record |
| An administrator removes a label and encryption from a test file for recovery | Label and encryption removed; **Removed sensitivity label from file** carries the justification | Audit record |

For the last test, a SharePoint administrator can remove both the label and the encryption even without access to the site or file, provided the encryption came from a label with admin-defined permissions; the justification goes into the audit event and the Rights Management usage log:[^c07-spo-labels]

```powershell
Unlock-SPOSensitivityLabelEncryptedFile -FileUrl "<file-url>" -JustificationText "<ticket-number>"
```

Because that cmdlet bypasses the file's permissions, the program holds it to the same approval as a super user recovery ([Chapter 05](05-rights-management-and-recovery.md#how-recover-encrypted-content-through-a-super-user-just-in-time)) and alerts on its use.

## Key takeaways

- Turn label integration on before encrypting labels go wide; until it is on, encrypted files are invisible to search, eDiscovery and DLP and can't be co-authored.
- Labels with expiry or Double Key Encryption can't be processed in SharePoint; keep them out of collaboration.
- Move IRM libraries to labels library by library. In the government clouds, where default library labels are still in development, keep IRM on until the files are labeled.
- Co-authoring for encrypted files changes labeling metadata and can't be cleanly reversed; inventory every label-reading app first.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 06 — Exchange Message Encryption](06-exchange-message-encryption.md) · [Book index](index.md) · [Next: Chapter 08 — DLP and Endpoint Controls →](08-dlp-and-endpoint-controls.md)
:::

[^c07-b12-containers]: Book 12, Chapter 09, "Labels on Teams, groups and sites," which cites Microsoft Learn, "Use sensitivity labels to protect content in Microsoft Teams, Microsoft 365 groups, and SharePoint sites" (files in a labeled container don't inherit the container label), [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites).
[^c07-spo-labels]: Microsoft Learn, "Enable sensitivity labels for files in SharePoint and OneDrive" (until enabled, the services can't process encrypted files; what changes for new and changed files; three audit events; existing files must be edited or re-uploaded; PDF support and its effect on auto-labeling; Limitations; the opt-in steps with `Set-SPOTenant -EnableAIPIntegration $true`, about 15 minutes, per geo; module versions; the publishing safeguard; "SharePoint Information Rights Management (IRM) and sensitivity labels"; `InformationProtectionLabelId`; `Unlock-SPOSensitivityLabelEncryptedFile`; opt-out behavior), <https://learn.microsoft.com/purview/sensitivity-labels-sharepoint-onedrive-files> (accessed Nov 11, 2026).
[^c07-coauth]: Microsoft Learn, "Enable co-authoring for files encrypted with sensitivity labels," sections "Metadata changes for sensitivity labels," "Prerequisites," "Limitations," "How to enable co-authoring for files with sensitivity labels" (portal steps; wait 24 hours) and "If you need to disable this feature" (`Set-PolicyConfig -EnableLabelCoauth:$false`; labeling information lost), <https://learn.microsoft.com/purview/sensitivity-labels-coauthoring> (accessed Nov 11, 2026).
[^c07-irm]: Microsoft Learn, "Enable sensitivity labels for files in SharePoint and OneDrive," section "SharePoint Information Rights Management (IRM) and sensitivity labels" (IRM protects files at list and library level on download), <https://learn.microsoft.com/purview/sensitivity-labels-sharepoint-onedrive-files> (accessed Nov 11, 2026).
[^c07-irm-setup]: Microsoft Learn, "Set up Information Rights Management (IRM) in SharePoint admin center," section "IRM-enable SharePoint document libraries and lists" (can't create or edit in Office in a browser; one person at a time; check-in and check-out), <https://learn.microsoft.com/purview/set-up-irm-in-sp-admin-center> (accessed Nov 11, 2026).
[^c07-irm-apply]: Microsoft Learn, "Apply Information Rights Management (IRM) to a list or library," section "Apply IRM to a list or library" (Library Settings > Information Rights Management; "Restrict permission to documents in this library on download"), <https://learn.microsoft.com/purview/apply-irm-to-a-list-or-library> (accessed Nov 11, 2026).
[^c07-csom]: Microsoft Learn, ".NET API reference, List.IrmEnabled Property (Microsoft.SharePoint.Client)," <https://learn.microsoft.com/dotnet/api/microsoft.sharepoint.client.list.irmenabled> (accessed Nov 11, 2026).
[^c07-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 table, Sensitivity labeling rows (status "subject to change"), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c07-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4 table, Sensitivity labeling rows, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c07-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4 table, Sensitivity labeling rows, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
[^c07-connect-spo]: Microsoft Learn, "Connect-SPOService," Example 4 (`-Region ITAR`, the authentication region) and Description (SharePoint Administrator required), <https://learn.microsoft.com/powershell/module/microsoft.online.sharepoint.powershell/connect-sposervice> (accessed Nov 11, 2026).
[^c07-gcch-endpoints]: Microsoft Learn, "Microsoft 365 U.S. Government GCC High endpoints," section "SharePoint Online and OneDrive for Business" (`*.sharepoint.us`), <https://learn.microsoft.com/microsoft-365/enterprise/microsoft-365-u-s-government-gcc-high-endpoints> (accessed Nov 11, 2026).
[^c07-connect-scc]: Microsoft Learn, "Connect to Security & Compliance PowerShell," section "Step 2: Connect and authenticate" (GCC High and DoD *ConnectionUri* and *AzureADAuthorizationEndpointUri* values for an interactive sign-in; the app-only page gives a different DoD address, `https://compliance.dod.microsoft.com/powershell-liveid`, for unattended scripts), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 11, 2026).
[^c07-policyconfig]: Microsoft Learn, "Set-PolicyConfig" (Security & Compliance PowerShell; `-EnableLabelCoauth` parameter) and "Get-PolicyConfig," <https://learn.microsoft.com/powershell/module/exchangepowershell/set-policyconfig> (accessed Nov 11, 2026).
