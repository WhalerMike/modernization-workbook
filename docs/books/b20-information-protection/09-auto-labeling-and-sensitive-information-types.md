---
title: "Chapter 09 — Auto-Labeling and Sensitive Information Types"
description: "How the agency detects sensitive content it never labeled: the classifier ladder from built-in sensitive information types to custom types, exact data match and trainable classifiers; confidence, count and proximity; custom types and rule packages as code; exact data match with the two-computer hash and upload; client-side and service-side auto-labeling; and the How section that takes a service-side auto-labeling policy from simulation to rollout, with GCC availability, licensing, limits, rollback, telemetry and evidence."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 9
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 09 — Auto-Labeling and Sensitive Information Types

*People label what they recognize as sensitive; detection is for everything they don't.*

::: {.callout-note}
## In this chapter
The classifier ladder: built-in sensitive information types, custom types, exact data match and trainable classifiers, and when each is the right tool. How confidence, count and proximity trade false positives for false negatives. Custom types and their rule packages kept as code, and exact data match with the two-computer hash-and-upload method. Client-side and service-side auto-labeling. Then a How section that takes a service-side auto-labeling policy from simulation to rollout, with GCC availability, licensing, limits, rollback, telemetry and evidence.
:::

[Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#automatic-labeling) introduces sensitive information types, trainable classifiers and auto-labeling, gives a first service-side policy in simulation, and notes that there's no built-in U.S. employer identification number type, so agency identifiers need custom types. This chapter is the engineering behind that: how to choose a classifier, how to tune it, how to keep it in source control, how to use exact data match for the agency's own records, and how to roll auto-labeling out without stamping CUI on the wrong ten thousand files.

The labels themselves come from [Chapter 02](02-sensitivity-label-architecture.md) and are published in [Chapter 03](03-label-publication-and-defaults.md). The DLP rules that act on the same sensitive information types are [Chapter 08](08-dlp-and-endpoint-controls.md). The implementation conventions are in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md).

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Inventory Management, Data Categorization)
- **Depends on:** the label taxonomy ([Chapter 02](02-sensitivity-label-architecture.md)); sensitivity labels enabled for Office files in SharePoint and OneDrive ([Chapter 07](07-sharepoint-and-onedrive.md)); auditing on ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md))
- **Attack chain interrupted:** Collection and Exfiltration, by making unlabeled sensitive content visible to DLP, encryption and the security monitor before it moves
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [The classifier ladder](#the-classifier-ladder), with the classifier register | The classifier register (each classifier, its owner, its target label, its tuning record) and a decision record ([Chapter 01](01-data-inventory-and-classification.md#decision-record-template)) |
| Configured | [Custom types as code](#custom-types-as-code), [Report-only or audit phase](#report-only-or-audit-phase) | The rule-package XML in source control; the auto-labeling policy export in simulation |
| Enforced | [Enforcement](#enforcement) | The policy export with `Mode` `Enable`; the location scope and exclusions |
| Evidenced | [Evidence](#evidence) | Simulation export; `Test-DataClassification` results; labeled test files and their audit records |
| Operated | [Day-two ownership](#day-two-ownership) | Monthly coverage and failure review; classifier re-tuning records |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## The classifier ladder

Purview offers four kinds of classifier. Each climbs a rung in precision and in effort.

| Classifier | What it matches | Use it for | False positives | Effort |
|---|---|---|---|---|
| Built-in sensitive information type | Microsoft's patterns (regular expressions, checksums, keywords) for common identifiers such as U.S. Social Security, passport and bank account numbers | Common identifiers where Microsoft's definition fits | Moderate; tunable by confidence and count | None to create; tuning only |
| Custom sensitive information type | The agency's own pattern: a case number, a claim number, an employer identification number | Agency identifiers with a recognizable format | Depends on how distinctive the format is | A rule package or portal definition, tested |
| Exact data match (EDM) | Values from the agency's own table (hashed), confirmed by supporting fields nearby | Records the agency holds a list of: employee IDs with names, beneficiary or case numbers with dates of birth | Lowest: a match must be an actual row | Schema, hashed upload, refresh schedule |
| Trainable classifier | Documents that resemble a category (case notes, budget working papers) | Categories with no pattern | Variable; needs real samples | Seed samples, train, test |

: The classifier ladder (program design) {.striped .hover}

**Authority:** Risk-based recommended (the program's position: climb only as far as the false-positive rate requires). EDM is the rung to reach for when a pattern-based type produces more false positives than the policy owner accepts and the agency holds the source table: an EDM match has to be a real value from the agency's data, so a nine-digit number that isn't in the table doesn't match.[^c09-edm]
**Applies:** EDM and trainable classifiers are License-dependent; check the plan in the Purview service description.[^c09-licensing] Environment-dependent as shown in [Prerequisites](#prerequisites).

The program keeps a **classifier register**, one row per classifier: what it detects, which label or DLP rule uses it, the policy owner, the confidence and count used, the last tuning date and the false-positive rate at that date. A classifier that nobody owns is a source of false positives nobody will fix.

## Confidence, count and proximity

A sensitive information type has a **primary element** (the thing it looks for), optional **supporting elements** (corroborating evidence such as a keyword), a **confidence level** and a **proximity**, the number of characters between the primary and supporting elements.[^c09-sit] The three settings trade false positives against false negatives:

- **Confidence.** Purview has three levels: low (65), medium (75) and high (85). High returns the fewest false positives and the most false negatives; low returns the reverse, and a low-confidence condition also returns medium and high matches.[^c09-sit] Each pattern in a custom type carries a `confidenceLevel`, and each entity a mandatory `recommendedConfidence` that applies when a rule doesn't set one.[^c09-custom-ps]
- **Count.** Microsoft's guidance pairs high-confidence patterns with low instance counts (five to ten) and low-confidence patterns with higher counts (20 or more).[^c09-sit] A single high-confidence Social Security number is worth acting on; a single low-confidence nine-digit number isn't.
- **Proximity.** Microsoft's deployment guidance sets 300 characters for a new custom type and warns against unlimited proximity ("anywhere in the document"), which produces many false positives.[^c09-fp-step1]

**Authority:** Microsoft-recommended (the count pairing and the 300-character proximity, from the Learn pages cited, read Nov 11, 2026).
**Applies:** All tenants.

The program's starting points, to be tuned against each simulation:

| Use | Confidence | Count | Why |
|---|---|---|---|
| Auto-label CUI Basic on a built-in identifier | High | 1 | Labeling is reversible, but a wrong label still shows the user a CUI banner |
| DLP block on an unlabeled built-in identifier | High | 5 or more | Blocking is disruptive; require several strong matches |
| Alert only (security monitor) | Medium | 10 or more | Visibility, not action |
| EDM-based type | High (EDM's generated rule) | 1 | An EDM match is already a real record |

: Starting confidence and count (program design) {.striped .hover}

## Custom types as code

A custom sensitive information type can be built in the portal, but a type that drives labels on federal records belongs in source control, reviewed like any other configuration ([Book 13](../b13-governance/index.md)). In PowerShell, custom types are defined in an XML **rule package**, saved with Unicode encoding and imported with `New-DlpSensitiveInformationTypeRulePackage`; a tenant supports up to 10 rule packages, each holding several types, and Microsoft suggests keeping an uploaded file under about 770 KB.[^c09-custom-ps] Each entity needs a `recommendedConfidence`; regular expressions with multiple capturing groups, lookaround assertions and greedy generic quantifiers fail validation.[^c09-custom-ps]

The block below writes a rule package for a fictitious agency case number (`CN-` followed by eight digits) with a high-confidence pattern that requires a keyword nearby and a low-confidence pattern that doesn't. It generates fresh GUIDs, so nothing from another tenant is reused. Placeholders: `<rule-package-dir>` is a folder in the repository that holds rule packages; replace the regular expression and keywords with the agency's own.

Checked against Learn on Nov 11, 2026; run against a test tenant first.[^c09-custom-ps]

```powershell
$packId   = [guid]::NewGuid().Guid
$pubId    = [guid]::NewGuid().Guid
$entityId = [guid]::NewGuid().Guid
$xml = @"
<?xml version="1.0" encoding="utf-16"?>
<RulePackage xmlns="http://schemas.microsoft.com/office/2011/mce">
  <RulePack id="$packId">
    <Version major="1" minor="0" build="0" revision="0"/>
    <Publisher id="$pubId"/>
    <Details defaultLangCode="en-us">
      <LocalizedDetails langcode="en-us">
        <PublisherName>Contoso Information Protection</PublisherName>
        <Name>Contoso Case Number Rule Package</Name>
        <Description>Custom sensitive information types for Contoso case records.</Description>
      </LocalizedDetails>
    </Details>
  </RulePack>
  <Rules>
    <Entity id="$entityId" patternsProximity="300" recommendedConfidence="85">
      <Pattern confidenceLevel="85">
        <IdMatch idRef="Regex_contoso_case_number"/>
        <Match idRef="Keyword_contoso_case_number"/>
      </Pattern>
      <Pattern confidenceLevel="65">
        <IdMatch idRef="Regex_contoso_case_number"/>
      </Pattern>
    </Entity>
    <Regex id="Regex_contoso_case_number">\bCN-\d{8}\b</Regex>
    <Keyword id="Keyword_contoso_case_number">
      <Group matchStyle="word">
        <Term>case number</Term>
        <Term>case no</Term>
        <Term>docket</Term>
      </Group>
    </Keyword>
    <LocalizedStrings>
      <Resource idRef="$entityId">
        <Name default="true" langcode="en-us">Contoso Case Number</Name>
        <Description default="true" langcode="en-us">CN- followed by eight digits, near a case keyword.</Description>
      </Resource>
    </LocalizedStrings>
  </Rules>
</RulePackage>
"@
$path = Join-Path '<rule-package-dir>' 'contoso-case-number.xml'
[System.IO.File]::WriteAllText($path, $xml, [System.Text.Encoding]::Unicode)
```

Import it, confirm it, and test it against sample text before any policy uses it:[^c09-custom-ps][^c09-edm-schema]

```powershell
New-DlpSensitiveInformationTypeRulePackage -FileData ([System.IO.File]::ReadAllBytes($path))
Get-DlpSensitiveInformationTypeRulePackage
Get-DlpSensitiveInformationType -Identity 'Contoso Case Number' | Format-List Name,Publisher,RecommendedConfidence

Test-DataClassification -ClassificationNames 'Contoso Case Number' -TextToClassify 'Docket entry: case number CN-12345678 filed.'
Test-DataClassification -ClassificationNames 'Contoso Case Number' -TextToClassify 'Reference CN-12345678 only.'
```

The first test should return the high-confidence pattern and the second the low one. Keep both results with the rule package's commit. To change a type later, edit the XML in source control and import it with `Set-DlpSensitiveInformationTypeRulePackage`.[^c09-modify] New or changed types don't reclassify content that hasn't changed; to apply them to existing SharePoint and OneDrive content, use on-demand classification.[^c09-custom-ps]

## Exact data match

EDM matches content against the agency's own table of values. The schema and the values are sensitive, so the EDM Upload Agent hashes them with a salt before upload and only hashes leave the agency.[^c09-edm] EDM supports DLP (SharePoint, OneDrive, Teams chat, Exchange, devices), service-side auto-labeling (SharePoint, OneDrive, Exchange), client-side auto-labeling, Insider Risk Management and eDiscovery.[^c09-edm]

The program uses the **two-computer method** Microsoft names as best practice: one computer, in a secured enclave with no direct connection to the tenant, hashes the clear-text table; a second computer uploads only the hash and salt files, so the clear-text values are never on a computer connected to the tenant.[^c09-edm-upload] Both computers must run the same version of the EDM Upload Agent.[^c09-edm-upload]

Microsoft publishes the EDM Upload Agent for Commercial and GCC as one download.[^c09-edm-upload] Install that agent.

Preparation, once:

1. Create a security group named `EDM_DataUploaders` and add the accounts that upload data; creating it takes Groups Administrator (the least-privileged option Microsoft names) or User Administrator.[^c09-edm-upload]
2. Create the EDM schema and sensitive information type in the Purview portal. Wait at least an hour after creating or editing a schema before downloading it.[^c09-edm-schema]
3. Export the source table from the system of record as a `.csv`, `.tsv` or pipe-delimited file, with the columns the schema names.

Commands (Command Prompt, from the folder where the agent is installed; `<datastore>` is the schema's data store name; paths are examples). Checked against Learn on Nov 11, 2026.[^c09-edm-upload]

On the hashing computer:

```bat
EdmUploadAgent.exe /ValidateData /DataFile C:\Edm\Data\<datastore>.csv /Schema C:\Edm\Schema\<datastore>.xml
EdmUploadAgent.exe /CreateHash /DataFile C:\Edm\Data\<datastore>.csv /HashLocation C:\Edm\Hash /Schema C:\Edm\Schema\<datastore>.xml /AllowedBadLinesPercentage 5
```

Copy the `.EdmHash` and `.EdmSalt` files to the upload computer by the agency's approved transfer method, then on the upload computer:

```bat
EdmUploadAgent.exe /Authorize
EdmUploadAgent.exe /SaveSchema /DataStoreName <datastore> /OutputDir C:\Edm\Schema
EdmUploadAgent.exe /UploadHash /DataStoreName <datastore> /HashFile C:\Edm\Hash\<datastore>.EdmHash
EdmUploadAgent.exe /GetDataStore
EdmUploadAgent.exe /GetSession /DataStoreName <datastore>
```

After the upload, test the EDM type with `Test-DataClassification` and wait 24 hours before testing it in a DLP policy, as Microsoft advises.[^c09-edm-schema] Delete the clear-text export from the hashing computer when the hash is made; the data owner, not the platform owner, decides how long the hashing computer keeps anything.

**Authority:** Microsoft-recommended (the two-computer method and the 24-hour wait). Risk-based recommended (the program's position): the refresh schedule follows the source system's change rate, and the data owner signs off each refresh, because a stale table produces false negatives silently.
**Applies:** License-dependent; Environment-dependent: EDM is listed as Available in GCC, with the Commercial and GCC upload agent.[^c09-gcc]

## Trainable classifiers

Trainable classifiers recognize categories that have no pattern. [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#trainable-classifiers) gives the sample requirements for a custom classifier and warns that samples must come from the real document population. Two GCC points shape the decision. Machine-learning classifiers used for client-side auto-labeling in Office apps are listed as Available in GCC.[^c09-gcc] Applying retention or record policies automatically with trainable classifiers is listed as In development, and the GCC page doesn't list custom trainable-classifier creation as a separate row, so its status there is **not yet specified**.

## Client-side and service-side auto-labeling

Purview applies labels automatically in two places, and they complement each other.

| | Client-side (in Office apps) | Service-side (auto-labeling policies) |
|---|---|---|
| When | While the user works in Word, Excel, PowerPoint or Outlook | On content at rest in SharePoint and OneDrive, and on mail in transit in Exchange |
| Behavior | Recommends a label or applies it, per the label's settings | Applies the label without user interaction |
| Conditions | Sensitive information types, trainable classifiers | The same, plus contextual conditions such as sharing state, file extension, document name, property, size and creator[^c09-depmod3] |
| Scale | Each open document | A tenant-wide throughput ceiling of 500,000 files a day across all policies (not a guaranteed rate); 100 policies; 1,000 explicitly selected sites; 20,000,000 matched files per simulation[^c09-autolabel] |
| GCC | Available (Office apps across platforms; mobile clients on engineering backlog) | Available for Exchange, SharePoint and OneDrive[^c09-gcc] |

: Two places labels are applied automatically {.striped .hover}

The program uses both: client-side **recommendation** for CUI Basic, so the author learns the rule; service-side **application** for content at rest and in mail, so the label doesn't depend on the author. A service-side policy that matches the same content as the default library label from [Chapter 07](07-sharepoint-and-onedrive.md) is checked for conflict in simulation, because simulation shows one policy's result and the enforced result is resolved only when all policies run.[^c09-autolabel]

## How: service-side auto-labeling from simulation to rollout

This procedure takes one auto-labeling outcome (for example, "an unlabeled file in SharePoint or OneDrive holding a Social Security number at high confidence is labeled `CUI Basic`") from simulation to enforcement in batches of sites. Placeholders: `<label-name>` is the label to apply; `<site-url>` is a SharePoint site URL in `contoso.example` form; `<policy-name>` follows `FMP-Auto-<label>-<scope>-v<n>`.

### Prerequisites

- **Auditing on** for simulation, and sensitivity labels enabled for Office files in SharePoint and OneDrive for auto-labeling files there.[^c09-autolabel] See [Chapter 10](10-audit-insider-risk-and-communication-compliance.md#how-turn-on-retain-and-test-purview-audit) and [Chapter 07](07-sharepoint-and-onedrive.md).
- **Roles.** Turning a policy from **Ready to turn on** to **On** requires Compliance Administrator or Compliance Data Administrator; viewing file contents in simulation requires the Data Classification Content Viewer role, which global admins don't have by default.[^c09-autolabel] Activate through PIM ([Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md)).
- **Licensing (License-dependent).** Automatic labeling is a premium Information Protection capability; Microsoft also requires the standard (Plan 1) license to be assigned alongside the premium one for labeling to be available.[^c09-licensing] An unlicensed population is a licensing decision, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

| Feature | Commercial | GCC | Source |
|---|---|---|---|
| Auto-labeling for Exchange, SharePoint, OneDrive | Available | Available | Learn GCC Purview page[^c09-gcc] |
| Enhanced simulations and location support (SharePoint, OneDrive) | Available | Available | Same |
| Overwriting manual labels; encrypting mail from any organization | Available | Available | Same |
| New conditions for auto-labeling in Exchange | Not yet specified | In development | Same |
| Client-side auto-labeling in Office apps | Available | Available | Same |
| Client-side auto-labeling in Office mobile clients | Available | On engineering backlog | Same |
| Exact data match sensitive information types | Available | Available | Same |
| Named entity sensitive information types | Available | In development | Same |
| Machine-learning classifiers, client-side | Available | Available | Same |
| Content explorer including Teams data | Not yet specified | In development | Same |
| Custom trainable classifier creation | Available | Not yet specified | Not listed on the GCC page |

: GCC availability for auto-labeling and classification (read Nov 11, 2026; Microsoft states the GCC status is subject to change) {.striped .hover}

Connect to Security & Compliance PowerShell as in [Chapter 08](08-dlp-and-endpoint-controls.md#prerequisites).

### Pilot

The pilot is a simulation over a first batch of sites chosen by the policy owner: high-sensitivity sites first, where a missed label costs most, then broader sites, as Microsoft's deployment guidance suggests for batch rollout.[^c09-depmod3] Success criteria: matched files are what the outcome means; the false-positive rate is at or below the policy owner's number; no conflict with another auto-labeling policy or a library default label.

### Report-only or audit phase

Create the policy in simulation (checked against Learn on Nov 11, 2026; run against a test tenant first):[^c09-new-policy][^c09-set-policy]

```powershell
New-AutoSensitivityLabelPolicy -Name 'FMP-Auto-CUIBasic-Batch1-v1' `
  -Comment 'Outcome: unlabeled files with a high-confidence SSN are labeled CUI Basic.' `
  -ApplySensitivityLabel '<label-name>' `
  -SharePointLocation '<site-url>' -Mode TestWithoutNotifications

New-AutoSensitivityLabelRule -Policy 'FMP-Auto-CUIBasic-Batch1-v1' -Name 'SSN high confidence in SharePoint' `
  -Workload SharePoint `
  -ContentContainsSensitiveInformation @(@{ Name = 'U.S. Social Security Number (SSN)'; minCount = '1'; minConfidence = '85' })
```

Simulation targets completion within 12 hours, and its results can be partial: **Not available** for a workload is not a zero-match result.[^c09-autolabel][^c09-sim-results] Export the matched items before you edit or restart the simulation, because results from earlier runs aren't guaranteed to remain available.[^c09-sim-results] To rerun after a change:

```powershell
Set-AutoSensitivityLabelPolicy -Identity 'FMP-Auto-CUIBasic-Batch1-v1' -StartSimulation $true
```

The portal's policy wizard offers to **turn the policy on automatically** if it isn't edited for seven days after simulation.[^c09-autolabel] The program leaves that option unselected, so no policy moves from simulation to labeling without the policy owner's approval in the change record. Check after each simulation that the policy is still in simulation:

```powershell
Get-AutoSensitivityLabelPolicy -Identity 'FMP-Auto-CUIBasic-Batch1-v1' | Format-List Name,Mode,Enabled,SharePointLocation
```

### Enforcement

```powershell
Set-AutoSensitivityLabelPolicy -Identity 'FMP-Auto-CUIBasic-Batch1-v1' -Mode Enable
```

Then the next batch, as a new policy version or by adding sites (`-AddSharePointLocation`), each batch simulated before it is enabled.[^c09-set-policy] Simulation supports up to 20,000,000 matched files; a policy that matches more can't be turned on and must be narrowed.[^c09-autolabel]

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | A test site with seeded files | Every seeded file matches as expected; no unseeded file matches |
| 1 | Batch 1: the policy owner's highest-sensitivity sites, simulation then enabled | False-positive rate at or below the owner's number; labeling failures reviewed |
| 2 | Batch 2: the business unit's other sites | Help-desk calls about unexpected labels within the agreed level |
| 3 | All sites and OneDrive accounts in scope | Coverage report reviewed; no unresolved failure reason |

- **Emergency access:** Not applicable: auto-labeling doesn't affect sign-in. Labels that apply encryption can affect access to content; emergency access to encrypted content is the super-user path in [Chapter 05](05-rights-management-and-recovery.md).
- **Change window:** Business hours; the help desk briefed on the new banner users will see.
- **Backout triggers:** Labels landing on content the outcome doesn't mean; an encryption label applied to content a business process must read unencrypted; labeling failures above the agreed level.
- **Post-change validation:** Seed a test file with a known match in each new batch; confirm the label and the `FileSensitivityLabelApplied` audit record ([Telemetry](#telemetry)).

### Rollback

Stop further labeling at once (run by the operator; takes effect when the service next evaluates):

```powershell
Set-AutoSensitivityLabelPolicy -Identity 'FMP-Auto-CUIBasic-Batch1-v1' -Mode Disable
```

Disabling stops new labeling; it doesn't remove labels already applied. To remove a label that was applied wrongly, use an auto-labeling policy configured to remove that label, which Learn documents (in PowerShell, `-RemoveLabel` with the empty GUID as `-ApplySensitivityLabel` and a rule that names the label to remove).[^c09-new-policy][^c09-autolabel] If the label applied encryption, the removal policy removes the encryption too, without the policy creator needing Export or Full Control rights.[^c09-autolabel] Run the removal policy in simulation first, scoped to the affected sites.

### Exclusions

Exclude sites or OneDrive accounts with `-SharePointLocationException` and `-OneDriveLocationException` (or `-ExceptIfOneDriveSharedByMemberOf` with a mail-enabled security group), each with an exception-register row ([Chapter 12](12-operations-and-evidence.md#evidence-catalog)). Typical exclusions: a records repository whose labels are set by the records officer, or a site holding test data that looks like real identifiers.

### Telemetry

- **Audit records** `FileSensitivityLabelApplied`, `FileSensitivityLabelChanged` and `FileSensitivityLabelRemoved` for labels applied by an auto-labeling policy, and `FileSensitivityLabelAppliedFailed` for failures, with a `FailureReason`.[^c09-audit-activities]
- **The policy's review pages** (labeled items, labeling failures, top sites) and the **coverage report** after simulation, which is available for 30 days.[^c09-autolabel]
- Routed to the SIEM with the other Purview events ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)); mass label removal is FMP-DET-05 in [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md).

```powershell
# Exchange Online PowerShell: labels applied by service-side policies in the last day
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) `
  -Operations FileSensitivityLabelApplied,FileSensitivityLabelAppliedFailed -ResultSize 5000 |
  Select-Object CreationDate,UserIds,Operations,AuditData | Export-Csv .\autolabel-last-day.csv -NoTypeInformation
```

### Evidence

**Evidence checklist**

- [ ] **Configuration:** the rule-package XML and its commit; `Get-AutoSensitivityLabelPolicy | Format-List Name,Mode,ApplySensitivityLabel,SharePointLocation,OneDriveLocation,ExchangeLocation,Comment` and `Get-AutoSensitivityLabelRule` exports per batch
- [ ] **Operational:** labeled-item and failure counts per month from the review pages; audit records retained per [Chapter 10](10-audit-insider-risk-and-communication-compliance.md)
- [ ] **Test:** `Test-DataClassification` results for each custom type; the seeded test file per batch with expected and observed label, date and tester, and its audit record
- [ ] **Exception:** exception-register rows for excluded sites and accounts
- [ ] **Assessor-ready artifact:** the classifier register row, the simulation export, the enforcing export and the test record, under the control IDs in [Appendix A](appendix-a-requirements-mapping.md)

### Day-two ownership

Policy owner: the outcome and the target label; signs off every batch. Data owner (for EDM): the source table and each refresh. Platform owner: rule packages in source control, the classifier register, EDM refresh automation and the drift check ([Book 13](../b13-governance/index.md)). Operator: batches, simulations and exclusions as approved. Security monitor: FMP-DET-05 and labeling-failure spikes. Help desk: the script for "a banner appeared on my file", routing disputes to the operator ([Book 15](../b15-day2-operations/index.md)). Assessor: samples labeled files against the classifier register. Cadence: monthly failure and coverage review, quarterly re-tuning of each classifier against fresh false-positive data, EDM refresh on the data owner's schedule. Roles are set out in [Chapter 12](12-operations-and-evidence.md#raci). Drift looks like a policy turned on outside a change record, a classifier with no register row, or an EDM data store whose last session is older than the refresh schedule.

## Requirements this chapter supports

| Requirement | What this chapter contributes |
|---|---|
| NIST SP 800-53 Rev. 5 RA-2 (Security Categorization) | Detection that applies the agency's categorization to content nobody categorized by hand |
| NIST SP 800-53 Rev. 5 AC-16 (Security and Privacy Attributes) | Labels bound to content automatically, as attributes other controls act on |
| NIST SP 800-53 Rev. 5 CM-3 (Configuration Change Control) | Rule packages and policies versioned, simulated and approved |
| CISA Zero Trust Maturity Model, Data pillar | Data inventory and categorization with automated labeling |

: Requirements this chapter supports (the full mapping, with FedRAMP 20x KSIs, is [Appendix A](appendix-a-requirements-mapping.md)) {.striped .hover}

These rows say what the chapter contributes. The agency still sets each control's parameters, policy and procedures, and the assessor decides whether each is satisfied.[^c09-53] <!-- claims-ok: states that the assessor decides -->

## Key takeaways

- Climb the classifier ladder only as far as false positives require; exact data match is the rung where a match has to be a real record.
- Pair high confidence with low counts and low confidence with high counts, and keep proximity at about 300 characters.
- Keep custom types in source control as rule packages, test them with `Test-DataClassification`, and remember that a changed type doesn't reclassify unchanged content.
- Hash EDM data on a computer that never touches the tenant, with the upload agent for the right cloud.
- Roll service-side auto-labeling out in simulated batches, never let a policy turn itself on, and know that disabling a policy doesn't remove the labels it applied.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 08 — DLP and Endpoint Controls](08-dlp-and-endpoint-controls.md) · [Book index](index.md) · [Next: Chapter 10 — Audit, Insider Risk and Communication Compliance →](10-audit-insider-risk-and-communication-compliance.md)
:::

[^c09-edm]: Microsoft Learn, "Learn about exact data match based sensitive information types" (agency supplies schema and data; values hashed with a salt; services EDM supports), <https://learn.microsoft.com/purview/sit-learn-about-exact-data-match-based-sits> (accessed Nov 11, 2026).
[^c09-licensing]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Information Protection sensitivity labeling" (a standard/Plan 1 license must be assigned in addition to the premium/Plan 2 license for labeling to be available; plan coverage per feature), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c09-sit]: Microsoft Learn, "Learn about sensitive information types," sections "Fundamental parts of a sensitive information type" and "More on confidence levels" (primary and supporting elements, proximity; low 65, medium 75, high 85; high confidence with low counts of five to 10, low confidence with counts of 20 or more), <https://learn.microsoft.com/purview/sit-sensitive-information-type-learn-about> (accessed Nov 11, 2026).
[^c09-custom-ps]: Microsoft Learn, "Create a custom sensitive information type using PowerShell" (confidenceLevel and mandatory recommendedConfidence; Unicode XML; `New-DlpSensitiveInformationTypeRulePackage -FileData`; maximum 10 rule packages; suggested 770 KB; validation issues; recrawl and on-demand classification), <https://learn.microsoft.com/purview/sit-create-a-custom-sensitive-information-type-in-scc-powershell> (accessed Nov 11, 2026).
[^c09-fp-step1]: Microsoft Learn, "Step 1: Configure pattern-based sensitive data detection," section "Refine using proximity elements, confidence level, and exclusions" (300-character proximity for new custom types; avoid unlimited proximity), <https://learn.microsoft.com/purview/deploymentmodels/depmod-reduce-false-positives-step1> (accessed Nov 11, 2026).
[^c09-modify]: Microsoft Learn, "Modify a custom sensitive information type using PowerShell" (`Set-DlpSensitiveInformationTypeRulePackage`), <https://learn.microsoft.com/purview/sit-modify-a-custom-sensitive-information-type-in-powershell> (accessed Nov 11, 2026).
[^c09-edm-schema]: Microsoft Learn, "Create an EDM SIT schema and rule package (New experience)," section "Recommendations" (wait an hour after creating or editing a schema; `Test-DataClassification`; wait 24 hours before testing in DLP), <https://learn.microsoft.com/purview/sit-create-edm-sit-unified-ux-schema-rule-package> (accessed Nov 11, 2026).
[^c09-edm-upload]: Microsoft Learn, "Hash and upload the sensitive information source table for exact data match sensitive information types" (EDM_DataUploaders group; least-privilege roles; agent version for Commercial + GCC; two-computer method with the same agent version; `/ValidateData`, `/CreateHash`, `/Authorize`, `/UploadHash`, `/GetDataStore`, `/GetSession`; `/SaveSchema`), <https://learn.microsoft.com/purview/sit-get-started-exact-data-match-hash-upload> (accessed Nov 11, 2026).
[^c09-depmod3]: Microsoft Learn, "Step 3: Expand to your entire Microsoft 365 data estate," section "Simulate auto-labeling sensitive files at rest" (service-side contextual conditions; batch rollout by sites, higher sensitivity first), <https://learn.microsoft.com/purview/deploymentmodels/depmod-secure-by-default-step3> (accessed Nov 11, 2026).
[^c09-autolabel]: Microsoft Learn, "Automatically apply a sensitivity label to Microsoft 365 data" (limits: 500,000 files a day ceiling, 100 policies, 1,000 sites, 20,000,000 matched files per simulation; 12-hour simulation target; single-policy simulation versus enforced result; auto-turn-on after seven days; prerequisites including auditing and roles; label removal policies remove encryption; review pages and 30-day coverage report), <https://learn.microsoft.com/purview/apply-sensitivity-label-automatically> (accessed Nov 11, 2026).
[^c09-sim-results]: Microsoft Learn, "Review simulation results for auto-labeling policies in Microsoft Purview," sections "Failed simulations and partial results" and "Preserve results before editing or rerunning," <https://learn.microsoft.com/purview/auto-label-simulation-results> (accessed Nov 11, 2026).
[^c09-new-policy]: Microsoft Learn, "New-AutoSensitivityLabelPolicy" (Mode values Enable, TestWithNotifications, TestWithoutNotifications, Disable, PendingDeletion; simulation example; label-removal example with `-RemoveLabel` and the empty GUID), <https://learn.microsoft.com/powershell/module/exchangepowershell/new-autosensitivitylabelpolicy> (accessed Nov 11, 2026).
[^c09-set-policy]: Microsoft Learn, "Set-AutoSensitivityLabelPolicy" (`StartSimulation`, `Mode`, `AddSharePointLocation`, `AutoEnableAfter`), <https://learn.microsoft.com/powershell/module/exchangepowershell/set-autosensitivitylabelpolicy> (accessed Nov 11, 2026).
[^c09-audit-activities]: Microsoft Learn, "Audit log activities," section "Sensitivity label activities" (FileSensitivityLabelApplied, FileSensitivityLabelChanged, FileSensitivityLabelRemoved, FileSensitivityLabelAppliedFailed and FailureReason), <https://learn.microsoft.com/purview/audit-log-activities> (accessed Nov 11, 2026).
[^c09-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (status subject to change), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c09-53]: NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls RA-2, AC-16 and CM-3, checked against the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026).
