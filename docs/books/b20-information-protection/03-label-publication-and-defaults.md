---
title: "Chapter 03 — Label Publication and Defaults"
description: "How the agency publishes its sensitivity labels and sets defaults it can justify: a pilot label policy before the tenant-wide one, a default label for documents, email, meetings, new groups and sites, and Power BI content, each with its reason and the label it should not be; mandatory labeling and downgrade justification; the exact portal steps and Security & Compliance PowerShell commands, the rings, rollback and exclusions; the telemetry and evidence that show labels are being applied; and each feature's licensing and government-cloud availability, including the SharePoint library default label that is still in development in GCC."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 3
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 03 — Label Publication and Defaults

*A label nobody sees protects nothing, and a default nobody chose labels everything wrongly; publication is where the taxonomy meets people, so it moves in rings and every default has a written reason.*

::: {.callout-note}
## In this chapter
The publishing step that turns the labels of [Chapter 02](02-sensitivity-label-architecture.md) into something users see. A pilot label policy first, then the tenant-wide policies. Defaults for documents, email, meetings, new groups and sites, and Power BI, each with the reason it was chosen and the label it should never be. Mandatory labeling and the downgrade justification. The exact steps, in the Purview portal where only the portal offers a setting and in Security & Compliance PowerShell where it can be scripted, with rings, rollback, exclusions, telemetry and evidence. This chapter and the next carry closure-map row CM-12 (no labels, defaults or containers): its minimum evidence is a policy export and a labeled sample.
:::

Creating labels changes nothing for users; a label policy does. It decides who sees which labels and sets the defaults and prompts that shape how they label. That makes publication the point where the program's taxonomy either becomes routine or becomes a help-desk queue. Microsoft's own guidance is careful here: a default label raises labeling coverage but, without training and other controls, also inaccurate labeling, and mandatory labeling without a matching default frustrates users with frequent prompts.[^c03-labels] The program therefore publishes to a pilot ring first, chooses each default for a stated reason, and measures what users do with it before widening.

[Chapter 04](04-teams-groups-and-sharepoint-containers.md) applies labels to containers; [Chapter 09](09-auto-labeling-and-sensitive-information-types.md) applies them automatically. User training on what each label means is [Book 16](../b16-people/index.md)'s; the help-desk path for "I can't open this" is [Book 15](../b15-day2-operations/index.md)'s.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Categorization)
- **Depends on:** the labels in [Chapter 02](02-sensitivity-label-architecture.md); groups for policy scoping ([Book 03](../b03-hr-identity/index.md)); Office clients that support built-in labeling on managed devices ([Book 05](../b05-devices/index.md)); user training ([Book 16](../b16-people/index.md))
- **Attack chain interrupted:** Collection and Exfiltration: unlabeled content is invisible to label-based DLP and encryption; a justified default and a mandatory prompt make "unlabeled" the exception
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Defaults the agency can justify](#b20-03-defaults-the-agency-can-justify) | Decision record for each default and for mandatory labeling ([template](01-data-inventory-and-classification.md#decision-record-template)) |
| Configured | [Enforcement](#b20-03-enforcement), ring 1 | `Get-LabelPolicy` export of the pilot policy and its settings |
| Enforced | [Enforcement](#b20-03-enforcement), ring 3 | `Get-LabelPolicy` export of the production policies, scoped to everyone in scope, with the exclusion list |
| Evidenced | [Validate: a labeled sample](#b20-03-validate-a-labeled-sample) | The labeled sample record and the audit events it produced |
| Operated | [Day-two ownership](#b20-03-day-two-ownership) | Monthly label-activity review, downgrade review, policy drift check |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Defaults the agency can justify {#b20-03-defaults-the-agency-can-justify}

A label policy can set a default label separately for five kinds of item: documents (and Loop components and pages), emails, meetings and calendar events, new groups and sites, and Power BI content. Users can change the default to match the content.[^c03-labels] The program's defaults, and the reason for each:

| Item | Default | Why this one | Never default to |
|---|---|---|---|
| Documents | `Internal` | Most agency working documents are uncontrolled but not for release; it doesn't encrypt, so external collaboration keeps working | Any encrypting label: external recipients may not be able to open it[^c03-labels] |
| Email | `Internal` (Outlook's own email default) | Same as documents; mail to the public stays readable | An encrypting label, for the same reason |
| Meetings and calendar events | `Internal` | Invites inherit the meeting's sensitivity; a default makes meetings labelable without a prompt | A label with Teams-specific meeting restrictions the organizer didn't choose |
| New groups and sites | `Internal site` | New containers start private-to-the-agency, not public; owners raise the label for CUI work | `Public` container settings, or a label that blocks guests where a team needs them |
| Power BI | `Internal`, with mandatory labeling | Reports are built from extracts of systems of record; a label travels with exports to Excel, PowerPoint and PDF | A CUI label: Power BI's default applies to every new item, CUI or not |

: Default labels (program's design; every default has a decision record) {.striped .hover}

Behaviors to know before choosing:

- **Defaults don't override a user's choice, and auto-labeling can override a default.** Client-side auto-labeling doesn't replace a manually applied label but can replace a default label, which is why Microsoft suggests a default label where mandatory labeling and client-side auto-labeling are both used.[^c03-office-apps]
- **Outlook has its own default.** Where the Outlook client supports it, the email default is set independently of the document default; where it doesn't, Outlook uses the document default.[^c03-office-apps] Meeting defaults are independent of the email default.[^c03-meetings]
- **Teams applies the meeting default only to new events.** Outlook applies it to new events and to existing unlabeled events when they are updated; Teams applies it to new events only.[^c03-meetings]
- **Power BI's default isn't retroactive and doesn't apply to service principals, APIs or B2B guests.** A new default applies to content created or edited after it is published.[^c03-pbi-default]
- **The SharePoint document library default label is a separate, licensed feature** (E5/G5-level) and is still in development in GCC;[^c03-purview-sd][^c03-gcc] [Chapter 07](07-sharepoint-and-onedrive.md) covers it for commercial tenants and the interim path for government ones.

**Authority:** Microsoft-recommended for the cautions (don't default to an encrypting label; pair mandatory labeling with a default) (Microsoft Learn, "Learn about sensitivity labels," accessed Nov 11, 2026). The choice of defaults is risk-based recommended, the program's position, for the risk that content stays unlabeled and invisible to DLP.
**Applies:** License-dependent: manual labeling and label policies from Microsoft 365 E3/G3; Power BI labels with E3/G3 or EMS E3; the SharePoint library default with E5/G5-level plans.[^c03-purview-sd] Environment-dependent: see the availability table below.

### Mandatory labeling and the downgrade justification

Mandatory labeling ("require users to apply a label") makes users label a document before saving, an email or invite before sending, and a new group or site when creating it. With mandatory labeling in effect, users can't remove a label (only change it), and print-to-PDF is unavailable for labeled or encrypted documents.[^c03-office-apps] The program turns it on for documents, email, meetings, groups and sites, and Power BI, because every one of them has a non-encrypting default, so users are rarely prompted.

The downgrade justification makes a user explain why they removed a label or replaced it with a lower-priority one; the reason appears in activity explorer.[^c03-labels] It applies to files, emails and meetings, not to groups and sites, and not between sublabels of the same group ([Chapter 02](02-sensitivity-label-architecture.md#b20-02-priority-label-groups-and-the-modern-label-scheme)). The program turns it on everywhere it applies and reviews the justifications monthly.

A help link ("Learn more") points users from the label menu to the agency's own page explaining the labels. Set it to the [Book 16](../b16-people/index.md) training page the agency publishes, not to Microsoft's generic article.

## How: publish labels and set defaults

### Prerequisites {#b20-03-prerequisites}

| Feature | Commercial | GCC | Source |
|---|---|---|---|
| Manual labels and label policies | Available | Available | Government Purview planning pages[^c03-gcc] |
| Mandatory labels | Available | Available | Same pages |
| Default label for unlabeled file uploaded to a SharePoint library | Available | In development | Same pages |
| "Apply default label policies to ensure documents being edited" | Not yet specified | In development | Same pages |
| Sensitivity labels for Teams, Microsoft 365 groups and SharePoint sites (container default) | Available | Available | Same pages |
| Labels for meetings and calendar events | Available | Not yet specified | "Use sensitivity labels to protect calendar items, Teams meetings, and chat"[^c03-meetings]; not listed on the government pages |
| Teams Premium meeting protections in labels | License-dependent (Teams Premium) | Not yet specified | Same page |
| Power BI default and mandatory label | Available | Not yet specified | Fabric "Default label policy" and "Mandatory label policy"[^c03-pbi-default][^c03-pbi-mandatory]; Activity explorer's Power BI label data is listed as available in GCC |

: Publication features by cloud, read Nov 11, 2026 {.striped .hover}

- **Licenses:** as in the authority block above. Record the plan in each decision record.
- **Roles:** Information Protection Admin (or Compliance Administrator) for the operator who changes label policies.
- **Clients:** Microsoft 365 Apps for enterprise with built-in labeling on managed Windows devices; Outlook versions that support separate email defaults (Current Channel 2105+, Semi-Annual Enterprise Channel 2108+) where the email default differs from the document default.[^c03-versions]
- **Labels created and validated** ([Chapter 02](02-sensitivity-label-architecture.md#b20-02-validate)).
- **Groups:** a pilot group (`b20-label-pilot@contoso.example`), the authorized-holder groups, and an exclusion group for service accounts that run unattended Office automation.
- **Training and help desk ready:** the Book 16 page live, the help-desk script from [Book 15](../b15-day2-operations/index.md) published, before ring 2.

### Pilot

The pilot is ring 1: the implementing team plus 25 to 50 users from the help desk, records, legal and two mission offices that handle CUI. Success criteria, set before the pilot starts:

- Every pilot user sees the labels in Word, Excel, PowerPoint and Outlook on Windows and on the web within 24 hours.
- Fewer than one help-desk ticket per ten pilot users per week after the first week.
- The labeled sample ([Validate](#b20-03-validate-a-labeled-sample)) passes.
- The share of documents saved with a label other than the default is reviewed with the data owners: a high share of downgrades means the default is wrong; a near-zero share of CUI labels where CUI is known to be handled means training is needed.

### Report-only or audit phase

Label policies have no report-only mode. The pilot ring is the observation phase: run it for at least two weeks and read activity explorer's label events and the downgrade justifications ([Telemetry](#b20-03-telemetry)).

### Enforcement {#b20-03-enforcement}

Connect to Security & Compliance PowerShell for the tenant's cloud (commands in [Chapter 01](01-data-inventory-and-classification.md#b20-01-inventory-find-where-the-data-already-is)). Commands were checked against Microsoft Learn on Nov 11, 2026; run them against a test tenant first. `-WhatIf` doesn't work in Security & Compliance PowerShell.[^c03-setlabelpolicy]

1. **Create the pilot policy**, scoped to the pilot group, with the labels from Chapter 02's design table:

    ```powershell
    New-LabelPolicy -Name 'B20-Labels-Pilot' `
      -Labels 'Public','Internal','CUI Basic','Internal site','CUI site' `
      -ExchangeLocation 'b20-label-pilot@contoso.example' `
      -Comment 'Book 20 ring 1. Decision record DR-B20-03.'
    ```

2. **Set the document, group-and-site and mandatory settings in the portal.** These settings have no supported PowerShell parameter: `Set-LabelPolicy -Settings` is reserved for internal Microsoft use.[^c03-setlabelpolicy] In the Microsoft Purview portal: **Solutions** > **Information Protection** > **Publishing policies** > select `B20-Labels-Pilot` > **Edit policy**.[^c03-create] On the policy settings pages:
    - **Documents:** select **Users must provide a justification to remove a label or lower its classification**; select **Require users to apply a label to their files and emails**; set **Apply this label by default to documents** to `Internal`; set the **Provide users with a link to a custom help page** URL to the agency's training page.
    - **Emails:** keep mandatory labeling for email selected; set **Apply a default label to emails** to `Internal`.
    - **Meetings and calendar events:** set the default to `Internal`; select **Require users to apply a label to their meetings and calendar events**.
    - **Groups and sites:** set **Apply this label by default to groups and sites** to `Internal site`; select **Require users to apply a label to their groups and sites**.
    - **Power BI:** set the default to `Internal`; select **Require users to apply a label to their Fabric and Power BI content**.
    - Finish the configuration; it publishes on save.

3. **Set the Outlook, meeting and Power BI settings that PowerShell supports**, so they are held as code. Use label GUIDs for the label values, as Microsoft recommends for advanced settings:[^c03-create]

    ```powershell
    $internal = (Get-Label -Identity 'Internal').Guid
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{OutlookDefaultLabel = "$internal"}
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{teamworkdefaultlabelid = "$internal"}
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{TeamworkMandatory = "True"}
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{powerbidefaultlabelid = "$internal"}
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{powerbimandatory = "true"}
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{AttachmentAction = "Recommended"}
    ```

    `AttachmentAction` makes Outlook recommend (or, with `Automatic`, apply) the highest-priority label among a message's attachments to an unlabeled message.[^c03-setlabelpolicy] The program starts at `Recommended` and moves to `Automatic` after the pilot.

4. **Export the policy** and compare it with the design:

    ```powershell
    $stamp = Get-Date -Format 'yyyy-MM-dd'
    Get-LabelPolicy | Select-Object Name, Priority, Labels, ExchangeLocation, ExchangeLocationException, Settings |
      ConvertTo-Json -Depth 6 | Out-File ".\label-policies-$stamp.json" -Encoding utf8
    (Get-LabelPolicy -Identity 'B20-Labels-Pilot').Settings
    ```

5. **Widen by ring.** For ring 2, add the early-adopter group to the pilot policy; for ring 3, create the production policies from Chapter 02's design and remove the pilot policy:

    ```powershell
    # Ring 2
    Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AddExchangeLocation 'b20-label-ring2@contoso.example'

    # Ring 3: production policies (repeat step 2's portal settings and step 3's advanced settings for B20-Labels-All)
    New-LabelPolicy -Name 'B20-Labels-All' `
      -Labels 'Public','Internal','CUI Basic','Internal site','CUI site','CUI Specified site' `
      -ExchangeLocation 'All' -ExchangeLocationException 'b20-label-exclusions@contoso.example' `
      -Comment 'Book 20 production. Decision record DR-B20-03.'
    New-LabelPolicy -Name 'B20-Labels-CUI-SP' `
      -Labels 'CUI//SP-<category>' `
      -ExchangeLocation '<authorized-holders>@contoso.example' `
      -Comment 'Book 20 CUI Specified, holders only.'
    ```

    Replace `CUI//SP-<category>` with the Specified sublabel names the agency holds and `<authorized-holders>` with each holder group. A label policy is scoped to users through `-ExchangeLocation`; its SharePoint location parameter is reserved for internal use and there is no Teams location on a label policy ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#the-label-taxonomy-as-code)). Check the policy order afterward: for conflicting settings the policy with the highest order number wins.[^c03-labels]

    ```powershell
    Get-LabelPolicy | Sort-Object Priority | Format-Table Name, Priority
    ```

Allow 24 hours after each change before judging it; label and label-policy changes can take that long to reach every service.[^c03-create]

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Implementing team (test tenant, then production pilot policy with the team only) | Labels and defaults appear in every supported client; export matches design |
| 1 | Pilot group, 25 to 50 users | Two weeks; pilot success criteria met; labeled sample passes |
| 2 | Early adopters, one or two offices per CUI program | Two weeks; ticket rate within the pilot threshold; data owners accept the downgrade review |
| 3 | Everyone in scope | Production policies exported; pilot policy removed; labeled sample re-run |

- **Emergency access:** not applicable to sign-in; label policies don't restrict sign-in. Emergency access accounts are in the exclusion group anyway, so a mandatory-label prompt can't interrupt break-glass work in Office.
- **Change window:** each ring is a normal change approved by the platform owner, announced to the help desk two business days ahead.
- **Backout triggers:** help-desk tickets above two per ten users in a ring in a week; a line-of-business process that saves documents through Office automation failing on the mandatory prompt; a data owner reporting a default that mislabels a class.
- **Post-change validation:** the labeled sample, run by a user in the new ring, 24 hours after each change.

### Rollback

Remove the newest ring's group from the policy, or remove the setting that caused the backout trigger:

```powershell
# Remove a ring
Set-LabelPolicy -Identity 'B20-Labels-Pilot' -RemoveExchangeLocation 'b20-label-ring2@contoso.example'
# Clear an advanced setting (null string removes it)
Set-LabelPolicy -Identity 'B20-Labels-Pilot' -AdvancedSettings @{powerbimandatory = ""}
# Withdraw the whole policy (labels already applied to content stay applied)
Remove-LabelPolicy -Identity 'B20-Labels-Pilot'
```

To remove an advanced setting, Microsoft documents specifying the same setting with a null string.[^c03-setlabelpolicy] Clearing a portal-only setting (mandatory labeling, the document default) is done in the same portal pages as step 2. The operator can run any of these in minutes; the effect reaches clients within 24 hours. Labels already applied to content stay applied after a rollback, which is the intended behavior.

### Exclusions

| Who | Why | Approver | Review |
|---|---|---|---|
| Emergency access accounts | Break-glass work must never wait on a prompt | Platform owner | Quarterly, with the emergency access test ([Book 04](../b04-access/index.md)) |
| Service accounts running unattended Office automation | A mandatory prompt can't be answered by a script | The application's owner and the platform owner | Each quarter; replaced by service-side labeling where possible ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md)) |
| Users without a supported Office client | They can't see built-in labels | Platform owner | Until the client is upgraded ([Book 05](../b05-devices/index.md)) |

: Label policy exclusions {.striped .hover}

Exclusions go in `b20-label-exclusions@contoso.example`, never as individual names in the policy, so the exclusion register and the policy can't drift apart.

### Telemetry {#b20-03-telemetry}

- **Activity explorer** shows label applied, changed and removed events, with the downgrade justifications.[^c03-labels]
- **The audit log** records sensitivity label activities from Office apps and services, and label-policy changes; [Chapter 10](10-audit-insider-risk-and-communication-compliance.md) has the search commands. The `EnableAudit` advanced setting can stop Office apps from sending label data to auditing; the program never sets it to `False`.[^c03-setlabelpolicy]
- **The log platform** receives both through the routing in [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md), and [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) alerts on mass label removal.

### Validate: a labeled sample {#b20-03-validate-a-labeled-sample}

This test is CM-12's "labeled sample". A pilot user, on a managed Windows device:

1. Creates a new Word document and saves it without choosing a label. Expected: `Internal` is applied by default.
2. Changes it to `CUI Basic`. Expected: the `CUI` header appears; the file is encrypted to the tenant.
3. Changes it back to `Internal`. Expected: a justification prompt; the reason appears in activity explorer.
4. Sends a new email without choosing a label. Expected: `Internal` by default.
5. Creates a team or SharePoint site. Expected: a label is required, `Internal site` is preselected.
6. The operator confirms each event in the audit log:

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) `
      -UserIds '<pilot-user-upn>' -RecordType SensitivityLabelAction -ResultSize 100 |
      Select-Object CreationDate, Operations, UserIds
    ```

Record the expected and observed result for each step, the date and the tester. Keep the sample document (it is a labeled sample an assessor can open) and the audit export. If `SensitivityLabelAction` returns nothing in the tenant, search without `-RecordType` and filter on the operation names in Learn's sensitivity label activities list ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)).

### Evidence

**Evidence checklist**

- [ ] **Configuration:** the dated `Get-LabelPolicy` JSON export of every policy, with its `Settings`, kept in source control (CM-12's policy export)
- [ ] **Operational:** monthly activity explorer summary of labels applied, changed and removed, with the downgrade justifications reviewed
- [ ] **Test:** the labeled-sample record and its audit export, per ring (CM-12's labeled sample)
- [ ] **Exception:** the exclusion group's membership export and each member's approval and review date
- [ ] **Assessor-ready artifact:** the policy export, the labeled sample and the decision records, cited from the AC-16 and MP-3 implementation statements and from the finding's closure-chain entry ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain))

### Day-two ownership {#b20-03-day-two-ownership}

The **platform owner** owns the label policies and their settings; each class's **policy owner** owns its default and reviews the downgrade justifications for it monthly; the **operator** runs the ring changes; the **help desk** handles "which label?" and "I can't open this" calls with the [Book 15](../b15-day2-operations/index.md) script; the **security monitor** watches for mass removal; the **assessor** samples the export and the labeled sample at each assessment. Drift is any difference between the export and source control, or a policy whose order changed ([Chapter 12](12-operations-and-evidence.md)). The full RACI is in [Chapter 12](12-operations-and-evidence.md#raci).

## Key takeaways

- Publish in rings: the pilot policy first, then early adopters, then production policies with exclusions held in a group.
- Default every item type to a non-encrypting label such as `Internal`, and pair mandatory labeling with that default.
- Some settings are portal-only; hold the rest as code and export every policy with its `Settings` as CM-12's policy export.
- The labeled sample, with its audit events, is CM-12's test evidence; repeat it after every ring.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 02 — Sensitivity Label Architecture](02-sensitivity-label-architecture.md) · [Book index](index.md) · [Next: Chapter 04 — Teams, Groups and SharePoint Containers →](04-teams-groups-and-sharepoint-containers.md)
:::

[^c03-labels]: Microsoft Learn, "Learn about sensitivity labels," sections "What label policies can do" (default label for five item types; avoid an encrypting default for documents; justification prompt and activity explorer; mandatory labeling with a default) and "Label policy priority (order matters)," <https://learn.microsoft.com/purview/sensitivity-labels> (accessed Nov 11, 2026).
[^c03-office-apps]: Microsoft Learn, "Manage sensitivity labels in Office apps," sections "Require users to apply a label to their email and documents" (users can't remove labels; print to PDF unavailable; default label suggested with auto-labeling) and "Outlook-specific options for default label and mandatory labeling," <https://learn.microsoft.com/purview/sensitivity-labels-office-apps> (accessed Nov 11, 2026).
[^c03-meetings]: Microsoft Learn, "Use sensitivity labels to protect calendar items, Teams meetings, and chat," sections "Requirements" and "Configure a corresponding sensitivity label publishing policy" (meeting default independent of email default; Teams applies it to new events only; some options need Teams Premium), <https://learn.microsoft.com/purview/sensitivity-labels-meetings> (accessed Nov 11, 2026).
[^c03-pbi-default]: Microsoft Learn (Fabric), "Default label policy for Fabric and Power BI" (PowerShell `powerbidefaultlabelid`; not supported for service principals, APIs or B2B guests), <https://learn.microsoft.com/fabric/governance/sensitivity-label-default-label-policy> (accessed Nov 11, 2026).
[^c03-pbi-mandatory]: Microsoft Learn (Fabric), "Mandatory label policy for Fabric and Power BI" (PowerShell `powerbimandatory`), <https://learn.microsoft.com/fabric/governance/mandatory-label-policy> (accessed Nov 11, 2026).
[^c03-purview-sd]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Information Protection sensitivity labeling" (manual labeling from E3/G3; Power BI labels with E3/G3 and EMS E3/E5; SharePoint document library default label with E5/G5-level plans), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c03-setlabelpolicy]: Microsoft Learn, "Set-LabelPolicy," parameter `-AdvancedSettings` (supported settings for built-in labeling: AttachmentAction, EnableAudit, DisableMandatoryInOutlook, OutlookDefaultLabel, TeamworkMandatory, teamworkdefaultlabelid, powerbimandatory, powerbidefaultlabelid; a null string removes a setting), `-Settings` (reserved for internal Microsoft use) and `-WhatIf` (doesn't work in Security & Compliance PowerShell), <https://learn.microsoft.com/powershell/module/exchangepowershell/set-labelpolicy> (accessed Nov 11, 2026).
[^c03-create]: Microsoft Learn, "Create and configure sensitivity labels and their policies," sections "Publish sensitivity labels by creating a label policy" (portal path; publishing on completion), "Additional label policy settings with Security & Compliance PowerShell," "PowerShell tips for specifying the advanced settings" (use the label GUID) and "When to expect new labels and changes to take effect" (allow 24 hours), <https://learn.microsoft.com/purview/create-sensitivity-labels> (accessed Nov 11, 2026).
[^c03-versions]: Microsoft Learn, "Minimum versions for sensitivity labels in Office apps," section "Sensitivity label capabilities in Outlook" (row "Different settings for default label and mandatory labeling"), <https://learn.microsoft.com/purview/sensitivity-labels-versions> (accessed Nov 11, 2026).
[^c03-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
