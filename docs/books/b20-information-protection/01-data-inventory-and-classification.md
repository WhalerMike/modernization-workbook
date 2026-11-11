---
title: "Chapter 01 — Data Inventory and Classification"
description: "Why protection has to travel with the data, and the decisions that come before any label: the agency's authoritative data classes and the handling outcome each one needs, who owns each class, the federal overlay decisions (CUI categories, Privacy Act records, federal records, the FIPS 199 impact level) that set the classes, how to inventory where sensitive data already sits with Microsoft Purview's data classification tools, licensing and government-cloud availability as stated dependencies, and the decision record template every later chapter uses."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: Why
series-order: 1
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 01 — Data Inventory and Classification

*Identity, device and network controls decide who reaches a file; only a classification decided in advance can say what the file is, and that decision has to be written down before a single label is published.*

::: {.callout-note}
## In this chapter
Why the data pillar needs its own engineering book, and why it starts with decisions, not settings. The agency's authoritative data classes and the handling outcome each one needs; the owner who answers for each class; and the federal overlay decisions (CUI categories, Privacy Act records, federal records, the FIPS 199 impact level) that shape the classes. How to find where sensitive data already sits, with Microsoft Purview's data classification tools and the exact export commands. Licensing and government-cloud availability as dependencies, not findings. And the decision record template that every later chapter fills in.
:::

A Zero Trust program usually builds the identity, device and network pillars first, because they are where the attacks it hears about begin. [Book 04](../b04-access/index.md) decides who may sign in and to what, [Book 05](../b05-devices/index.md) whether the device is healthy, and [Book 09](../b09-network/index.md) which paths the traffic may take. Each of those controls passes a legitimate user on a compliant device sending a file to an approved destination, whatever the file holds. [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#the-classification-gap) calls this the classification gap: nothing upstream said what the payload was. CISA's Zero Trust Maturity Model makes the same point from the other side, with a Data pillar whose functions are data inventory management, data categorization, data availability, data access and data encryption.[^c01-ztmm]

Book 20 is the workbook's home for that pillar: classification, sensitivity labels, encryption, data loss prevention (DLP), audit, insider risk and AI data security, engineered with Microsoft Purview. It links instead of repeating where another book already owns a subject. [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) explains the federal CUI framework and maps it to a label taxonomy; [Book 06](../b06-data-platform/index.md) owns the data platform, the SQL Server estate and its identities; [Book 14](../b14-compliance/index.md) owns authorization, privacy controls and the control crosswalk; and [Book 12](../b12-security-operations/index.md) owns telemetry, detection and the evidence contract. Book 20 turns those into a deployed, tested and operated set of controls, chapter by chapter, using the workbook's implementation conventions ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)).

This chapter is the Why. It argues that the first deliverable is a set of written decisions, not a label policy, and it ends with the template that records them.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Inventory Management; Data Categorization)
- **Depends on:** Identity, for the owners and the groups each class names ([Book 03](../b03-hr-identity/index.md), [Book 04](../b04-access/index.md)); the authorization boundary and the system's FIPS 199 categorization ([Book 14, Appendix F](../b14-compliance/appendix-f-categorization-walkthrough.md))
- **Attack chain interrupted:** Collection and Exfiltration, indirectly: nothing downstream can block or encrypt a class of data nobody defined
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [The authoritative data classes](#the-authoritative-data-classes), [The federal overlay decisions](#the-federal-overlay-decisions) | The class register and a signed decision record for each class ([template](#decision-record-template)) |
| Configured | Not applicable: this chapter configures nothing; the classes become labels in [Chapter 02](02-sensitivity-label-architecture.md) | — |
| Enforced | Not applicable: enforcement is in Chapters 03 to 11 | — |
| Evidenced | [Inventory: find where the data already is](#inventory-find-where-the-data-already-is) | The dated inventory export and its summary by class and location |
| Operated | [Keeping the classes current](#keeping-the-classes-current) | The annual class review record and the inventory re-run |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Why protection has to travel with the data

Three properties of the agency's data make perimeter thinking fail for it.

- **The data moves more than the people.** A record leaves the system of record as an export, becomes an attachment, lands in a OneDrive folder, is pasted into a chat and summarized by an AI assistant. Each copy is a new object that inherits none of the original system's access controls.
- **Access is granted to containers, not to content.** Read access to a site is read access to everything in it ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#the-classification-gap)). A Privacy Act record and a cafeteria menu in the same library get the same policy.
- **The agency can't protect what it hasn't named.** A DLP rule needs a condition, an auto-labeling policy needs a target label, and an encryption setting needs to know whom to grant rights to. Every one of those inputs is a decision about a class of data.

Microsoft's sensitivity label is the mechanism that lets protection travel. It is stored in clear text in the file's or message's metadata, so other services can read it, and it is persistent: it stays with the content wherever it is saved or stored.[^c01-labels] Encryption applied by a label goes with the content as well. But the label is only as good as the class it stands for. A taxonomy built from product defaults ("General", "Confidential", "Highly Confidential") without a federal class behind each label gives users a choice they can't make correctly and gives DLP a condition that means nothing to an assessor.

NIST's control catalog draws the same line between knowing and protecting. AC-16 associates security and privacy attributes with information; MP-3 marks media with its distribution limitations and handling caveats; CM-12 asks the organization to identify and document where specified information is processed and stored; and RA-2 has it categorize the system and the information it processes, with the result documented and approved.[^c01-53] None of those is satisfied by a product setting. They begin with the agency deciding what its classes are. <!-- claims-ok: argues that settings alone don't satisfy the controls -->

## The authoritative data classes {#the-authoritative-data-classes}

A data class is the agency's name for a kind of information that needs one handling outcome. It is narrower than a FIPS 199 impact level, which applies to a whole information type or system, and broader than a sensitive information type, which is a pattern a classifier detects. The class register is the authoritative list. It has one row per class, and every later artifact (a label, a DLP rule, an auto-labeling policy, a retention label) cites the class it serves.

| Field | What it records | Example (illustrative) |
|---|---|---|
| Class ID | A stable identifier used by every artifact | `DC-03` |
| Name | The name users will see as the label | CUI Basic |
| Definition | What belongs in the class, in the words of the authority | Information the CUI Registry lists under a basic authority |
| Authority | The law, regulation, policy or program decision that creates the class | 32 CFR Part 2002; the CUI Registry entry |
| Handling outcome | What must happen to it: who may open it, whether it may leave, how it is marked, how long it is kept | Encrypted to the agency's tenant; banner `CUI`; no external send without an approved exception |
| Data owner | The accountable official who decides handling questions for the class | The CUI program manager (policy owner) |
| Detection | How the class is recognized: user choice, a sensitive information type, a trainable classifier, a system of record | User choice, plus auto-labeling for Social Security numbers |
| Locations | Where the class is known or expected to live | HR sites, case-management exports |
| Review date | When the owner last confirmed the row | 2026-11-11 |

: The class register (design) {.striped .hover}

Keep the register small. Microsoft's guidance is to keep the number of labels to a minimum, and it reports that effectiveness drops noticeably when users see more than five main labels or more than five sublabels under one.[^c01-labels] The program's starting set follows the CUI-based taxonomy in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#mapping-cui-to-sensitivity-labels): **Public**, **Internal** (uncontrolled, not cleared for release), **CUI Basic**, a CUI Basic sublabel with a category marking where agency policy requires one, and one **CUI Specified** sublabel per specified authority the agency actually holds. [Chapter 02](02-sensitivity-label-architecture.md) turns those classes into labels.

Each class needs a handling outcome that a control can enforce. "Sensitive" isn't an outcome; "encrypted so that only the named authorized-holder group can open it, never sent outside the tenant, printed only from a managed device" is. Write the outcome as the sentence an assessor would test.

**Authority:** Risk-based recommended (the program's position, for the risk that labels and DLP rules are built on classes nobody defined). The small-taxonomy guidance is Microsoft-recommended (Microsoft Learn, "Learn about sensitivity labels," accessed Nov 11, 2026).
**Applies:** All tenants.

### Who owns a class

Every class has a data owner: an official, not an administrator, who decides its handling and approves exceptions. The owner is the RACI's **policy owner** for that class ([Chapter 12](12-operations-and-evidence.md#raci)). The Purview administrators are the **platform owner** and **operator**; they configure what the owner decides and never decide it themselves. Typical owners are the CUI program manager for the CUI classes, the senior agency official for privacy for classes built on Privacy Act records ([Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md)), and the agency records officer for retention outcomes. A class whose owner has left is a class nobody can approve an exception for; the annual review below catches it.

## The federal overlay decisions {#the-federal-overlay-decisions}

A commercial tenant can choose any taxonomy. A federal agency inherits several decisions from law and policy, and the class register has to record each one explicitly, with its source, before Chapter 02 builds labels on it.

| Decision | What decides it | What the register records | Where the workbook covers it |
|---|---|---|---|
| Which CUI categories the agency holds, and whether each authority is Basic or Specified | 32 CFR Part 2002 and the CUI Registry, applied by the agency's CUI program[^c01-cfr2002] | One row per category held, with its banner marking | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#the-federal-cui-framework) |
| Whether category markings are used for CUI Basic | Agency policy: optional for Basic, mandatory for Specified[^c01-cfr2002] | Whether the CUI Basic class has category sublabels | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#mapping-cui-to-sensitivity-labels) |
| Which records are Privacy Act records, and the systems of records they belong to | The Privacy Act and the agency's system of records notices | Which classes carry PII and which owner answers for them | [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) |
| How long each class is kept | The agency's records schedules under the Federal Records Act | The retention outcome, owned by the records officer; a label never expires federal records by default ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#mapping-cui-to-sensitivity-labels)) | This book, [Chapter 12](12-operations-and-evidence.md) |
| The impact level of the system that holds each class | FIPS 199 categorization, with NIST SP 800-60 for information types; CUI Basic sets a confidentiality floor of moderate[^c01-fips199][^c01-cfr2002] | The system each class lives in, and its categorization | [Book 14, Appendix F](../b14-compliance/appendix-f-categorization-walkthrough.md) |
| Which cloud the class may live in | The authorization boundary and the tenant's cloud (commercial, GCC, GCC High or DoD) | Whether any class needs a cloud the agency doesn't have | [Book 10](../b10-cloud-boundary/index.md) |

: The federal overlay decisions each class records {.striped .hover}

Two rules follow from 32 CFR Part 2002 and are worth stating where the classes are designed. Agencies may not create their own controls for unclassified information outside the CUI program, so an "Internal" class carries no dissemination legend of its own; and authorized holders who designate CUI may not use alternative markings.[^c01-cfr2002] The label names in Chapter 02 therefore use the CUI Registry's markings, not house terms such as "For Official Use Only", for anything that is CUI.

**Authority:** Mandated for CUI marking and handling (32 CFR Part 2002, §2002.20(b)); Mandated for categorization (FIPS 199, applied through RA-2). The way the register records them is the program's design.
**Applies:** All federal tenants. Environment-dependent: a class whose authority requires a higher-impact environment (for example GCC High) can't be held in a tenant that lacks it, whatever the label says.

## Inventory: find where the data already is {#inventory-find-where-the-data-already-is}

Classes are decided from authority; the inventory shows where the data already sits, so the rollout can start where the risk is. Microsoft Purview's data classification tools index Exchange, SharePoint, OneDrive and Teams content for sensitive information types, trainable classifier matches, sensitivity labels and retention labels. Content explorer (now also called data explorer) shows a snapshot of the items that carry a label or match a classifier, and the activity explorer shows what users did with them.[^c01-content-explorer][^c01-purview-sd] The structured data estate (SQL Server and other databases) is out of this inventory's reach; [Book 06](../b06-data-platform/index.md) carries the data platform's own inventory.

Read access to content explorer is deliberately narrow. Two role groups grant it: **Content Explorer List Viewer** (data explorer: Data Explorer List viewer) shows each item and its location, and **Content Explorer Content Viewer** also shows the item's contents and file names, which can themselves be sensitive. They are independent and not cumulative, and they supersede the permissions on the items themselves.[^c01-content-explorer] Every use is audited (`LabelContentExplorerAccessedItem` and related operations).[^c01-audit-ce] The program grants List Viewer to the operator who runs the inventory and keeps Content Viewer as an eligible, approved assignment for investigations.

The procedure exports a dated inventory, one sensitive information type or label at a time, which is how Microsoft recommends scripting the export.[^c01-export]

1. Connect to Security & Compliance PowerShell with an account in the Content Explorer List Viewer role group. Placeholders used in this book: `<admin-upn>` is the operator's sign-in name; `<label-name>` a label's name; `contoso.example` the agency's domain. Commands were checked against Microsoft Learn on Nov 11, 2026; run them against a test tenant first.

    ```powershell
    # Commercial or GCC:
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    # GCC High:
    Connect-IPPSSession -UserPrincipalName <admin-upn> -ConnectionUri https://ps.compliance.protection.office365.us/powershell-liveid/ -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations
    # DoD:
    Connect-IPPSSession -UserPrincipalName <admin-upn> -ConnectionUri https://l5.ps.compliance.protection.office365.us/powershell-liveid/ -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations
    ```

    The GCC High and DoD values are the ones Learn gives for an interactive sign-in.[^c01-connect]

2. List the sensitive information types the tenant can detect, and save the list with the date.

    ```powershell
    $stamp = Get-Date -Format 'yyyy-MM-dd'
    New-Item -ItemType Directory -Force -Path ".\inventory-$stamp" | Out-Null
    Get-DlpSensitiveInformationType | Select-Object Name, Id, Publisher |
      Export-Csv ".\inventory-$stamp\sit-catalog.csv" -NoTypeInformation -Encoding UTF8
    ```

3. Export every item that matches one sensitive information type at high confidence, workload by workload. The example uses the built-in Social Security number type; repeat the block for each type the class register names in its Detection column, and for each workload value Learn's examples use: `EXO` (Exchange), `ODB` (OneDrive) and `SharePoint`. Content explorer coverage of Teams data is still in development in the government clouds (table below).

    ```powershell
    $tag      = 'U.S. Social Security Number (SSN)'
    $workload = 'SharePoint'
    $report   = @()
    $page     = Export-ContentExplorerData -TagType SensitiveInformationType -TagName $tag -ConfidenceLevel high -Workload $workload -PageSize 1000
    $report  += $page[1..$page[0].RecordsReturned]
    while ($page[0].MorePagesAvailable) {
      $page    = Export-ContentExplorerData -TagType SensitiveInformationType -TagName $tag -ConfidenceLevel high -Workload $workload -PageSize 1000 -PageCookie $page[0].PageCookie
      $report += $page[1..$page[0].RecordsReturned]
    }
    $report | Export-Csv ".\inventory-$stamp\$($workload)-$($tag -replace '[^\w]','_').csv" -NoTypeInformation -Encoding UTF8
    ```

    The first array element carries `TotalCount`, `MorePagesAvailable`, `RecordsReturned` and `PageCookie`; records start at element 1. The session token expires after about an hour, so reconnect and restart from the last page cookie if a long export fails.[^c01-export]

4. Export what already carries each label, so the rollout can see what users have labeled by hand. Learn's reference page shows only the `SensitiveInformationType` tag type in its examples and doesn't list the accepted values, so confirm the `Sensitivity` value used below on a test tenant before relying on the count.

    ```powershell
    Get-Label | Select-Object Name, DisplayName, Guid, Priority |
      Export-Csv ".\inventory-$stamp\labels.csv" -NoTypeInformation -Encoding UTF8
    $label = '<label-name>'
    $page  = Export-ContentExplorerData -TagType Sensitivity -TagName $label -PageSize 1000
    $page[0] | Select-Object TotalCount
    ```

5. Summarize the exports by class and location (site, mailbox, team) in the class register's Locations column. The summary, not the raw export, goes to the data owners: the raw files list sensitive item names and are themselves sensitive. Store the raw export where only the operator and the investigators can read it, and keep it as evidence for the period [Chapter 12](12-operations-and-evidence.md#evidence-catalog) sets.

Counts in content explorer can take up to seven days to update, and up to 14 days for files in SharePoint, so a label applied today won't show in today's export.[^c01-content-explorer] Treat the inventory as a snapshot with a date, not a live measure.

**Authority:** Microsoft-recommended for the one-type-per-script export pattern (Microsoft Learn, "Export-ContentExplorerData," accessed Nov 11, 2026). The inventory itself is risk-based recommended, and it supports CM-12 (information location) and PM-5(1) (inventory of personally identifiable information) as evidence; the agency still sets their parameters.
**Applies:** License-dependent: content explorer and activity explorer require E5/A5/G5-level licensing (Microsoft 365 E5/A5/G5, the E5 Compliance or Information Protection & Governance add-ons, or Office 365 E5); E3/A3/G3 tenants keep the underlying data aggregation but not the explorer interfaces.[^c01-purview-sd] A tenant without the license runs the inventory with the inventory tools it has (for example the Information Protection scanner for file shares, which Learn lists for E3) and records the gap as a licensing decision, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

### Government-cloud availability for the inventory

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Data classification analytics: overview and content explorer | Available | Available | Available | Available | Learn government Purview planning pages[^c01-gcc][^c01-gcch][^c01-dod] |
| Content explorer includes Teams data | Not yet specified | In development | In development | In development | Same pages |
| Activity explorer | Available | Available | Available | Available | Same pages |
| Exact data match sensitive information types | Available | Available | Available | Available | Same pages |
| Named entity sensitive information types | Not yet specified | In development | On engineering backlog | In development | Same pages |
| Unified labeling client and scanner (file shares) | Available | Available | Available | Available | Same pages |

: Inventory features by cloud, read Nov 11, 2026 {.striped .hover}

Microsoft notes that the status on the government pages is subject to change.[^c01-gcc] Where the government pages list a feature as in development, the inventory for that workload uses the methods that are available and the decision record says so.

## Keeping the classes current {#keeping-the-classes-current}

The classes change when the agency's authorities change: a new CUI category is added to the registry or adopted by the agency, a system of records notice is published, a records schedule is revised, or a mission adds a kind of data the register doesn't cover. Three practices keep the register honest.

- **An annual review by each data owner**, recorded in the register's Review date column, with the inventory re-run beforehand so the owner sees where the class lives now.
- **A change trigger** on any new CUI category, system of records notice or records schedule, routed to the platform owner through change control ([Chapter 12](12-operations-and-evidence.md)).
- **No orphan artifacts.** Every label, DLP rule and auto-labeling policy cites a class ID; an artifact whose class was retired is removed through change control, and a class with no artifact is either not yet built or no longer needed.

## Decision record template {#decision-record-template}

Every enforceable control in this book starts with a decision record. The template carries the fields the closure update asks for (license, cloud availability, prerequisite and compensating control) and the ones an assessor needs to trace the decision to its evidence. Keep one record per decision in the agency's document repository; the Designed state of each control points to it.

```markdown
# Decision record: <DR-ID> — <short title>

| Field | Entry |
|---|---|
| Decision | <what is decided, in one sentence> |
| Class(es) served | <class IDs from the class register> |
| Chapter | <Book 20 chapter that implements it> |
| Authority label | <Mandated / Microsoft-recommended / Risk-based recommended / Optional>, with the source and passage or the stated risk |
| Applicability | <all tenants / License-dependent: … / Environment-dependent: …> |
| License required | <the plan or add-on, from the Learn service description, with the date read; who holds it; how many users it must cover> |
| Cloud availability | Commercial: <status> · GCC: <status> · GCC High: <status> · DoD: <status> — source page and date read; "not yet specified" where Learn is silent |
| Preview or GA | <GA / preview, and the date checked> |
| Prerequisites | <what must exist first, with links: services activated, groups, roles, client versions> |
| Options considered | <the alternatives, and why each was or wasn't chosen> |
| Compensating control | <what stands in where the license, the cloud or a prerequisite is missing; its owner; when it is reviewed> |
| Exclusions | <who or what is excluded, why, and the approver; emergency access accounts where the control can block access> |
| Residual risk | <what remains, and who accepts it> |
| Rollback | <the step back and who can run it> |
| Evidence | <the configuration, test, operational, exception and reassessment artifacts, from Chapter 12's evidence catalog> |
| Owner | Policy owner: <role> · Platform owner: <role> |
| Approved by | <name or role, date> |
| Review date | <when it is revisited> |
```

A license the tenant doesn't hold, or a feature that isn't available in its cloud, is recorded in this template as a dependency with a compensating control. It isn't a failed control, and an assessment tool that skips the corresponding test hasn't found a gap ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)). It does belong in the closure chain for the finding, with the residual risk it leaves ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)).

**Evidence checklist**

- [ ] **Configuration:** the class register, version-controlled, with each class's authority and owner
- [ ] **Operational:** the dated inventory summary by class and location, and the audit log of content explorer access
- [ ] **Test:** a sample of inventory hits reviewed by the data owner, with the share confirmed as true matches
- [ ] **Exception:** classes whose detection or protection depends on a license or cloud feature the tenant lacks, each with a decision record and compensating control
- [ ] **Assessor-ready artifact:** the class register and the signed decision records, cited from the system security plan's AC-16, MP-3, CM-12 and RA-2 implementation statements

## Key takeaways

- The data pillar starts with written decisions: the classes, their handling outcomes, their owners and the federal authority behind each.
- Keep the class register small and federal: CUI Basic and Specified from the CUI Registry, Privacy Act and records decisions from their owners, not product defaults.
- Inventory where sensitive data already sits with content explorer exports, one type at a time, and treat the result as a dated snapshot.
- Licensing and cloud availability are dependencies to record with a compensating control, never evidence that a control failed.

::: {.callout-tip}
## Continue the book
[Book index](index.md) · [Next: Chapter 02 — Sensitivity Label Architecture →](02-sensitivity-label-architecture.md)
:::

[^c01-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §5.5 (Data pillar functions: data inventory management, data categorization, data availability, data access, data encryption), <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Nov 11, 2026).
[^c01-labels]: Microsoft Learn, "Learn about sensitivity labels," sections "What a sensitivity label is" (stored in clear text in metadata; persistent) and "Sensitivity label limitations per tenant" (keep the number of labels to a minimum; effectiveness drops beyond five main labels or five sublabels), <https://learn.microsoft.com/purview/sensitivity-labels> (accessed Nov 11, 2026).
[^c01-53]: NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls AC-16 (Security and Privacy Attributes), MP-3 (Media Marking), CM-12 (Information Location), PM-5(1) (Inventory of Personally Identifiable Information) and RA-2 (Security Categorization), checked against the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Nov 11, 2026).
[^c01-cfr2002]: 32 CFR Part 2002, *Controlled Unclassified Information*, §2002.1(c) and §2002.12(a) (all unclassified information needing safeguarding or dissemination controls is CUI; agencies may not implement other controls), §2002.4(j) and (r) (CUI Basic and CUI Specified), §2002.14(g) (CUI Basic categorized at no less than the moderate confidentiality impact level) and §2002.20(b) (control marking; no alternative markings; category markings mandatory for CUI Specified), as in effect October 1, 2026, retrieved through the eCFR versioner API, <https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-32.xml?part=2002> (accessed Nov 11, 2026).
[^c01-fips199]: NIST FIPS 199, *Standards for Security Categorization of Federal Information and Information Systems*, February 2004, <https://doi.org/10.6028/NIST.FIPS.199>; NIST SP 800-60 Vol. 1 Rev. 1, *Guide for Mapping Types of Information and Information Systems to Security Categories*, August 2008, <https://doi.org/10.6028/NIST.SP.800-60v1r1> (both accessed Nov 11, 2026).
[^c01-content-explorer]: Microsoft Learn, "Get started with Content Explorer (classic)," sections "Prerequisites" (Content Explorer List viewer and Content viewer role groups, independent and not cumulative; they supersede item permissions) and "Export" (counts can take up to seven days to update, 14 days for SharePoint files), <https://learn.microsoft.com/purview/data-classification-content-explorer>; "Get started with data explorer," <https://learn.microsoft.com/purview/data-classification-data-explorer> (both accessed Nov 11, 2026).
[^c01-purview-sd]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Information Protection: Data classification analytics: Overview Content & Activity Explorer" (E5/A5/G5 licensing for the explorer interfaces; data aggregation continues for E3/A3/G3) and section "Microsoft Purview Information Protection sensitivity labeling" (scanner-based discovery with E3), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c01-audit-ce]: Microsoft Learn, "Audit log activities," section "Content explorer activities" (`LabelContentExplorerAccessedItem` and related operations), <https://learn.microsoft.com/purview/audit-log-activities> (accessed Nov 11, 2026).
[^c01-export]: Microsoft Learn, "Export-ContentExplorerData" (output structure: TotalCount, MorePagesAvailable, RecordsReturned, PageCookie; one SIT or label per script; reconnect after about an hour and restart from the last page cookie), <https://learn.microsoft.com/powershell/module/exchangepowershell/export-contentexplorerdata> (accessed Nov 11, 2026).
[^c01-connect]: Microsoft Learn, "Connect to Security & Compliance PowerShell," section "Step 2: Connect and authenticate" (ConnectionUri and AzureADAuthorizationEndpointUri values for GCC High and DoD), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 11, 2026).
[^c01-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (feature status table; "identified status is subject to change"), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c01-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c01-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
