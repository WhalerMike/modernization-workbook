---
title: "Chapter 10 — Audit, Insider Risk and Communication Compliance"
description: "The tools that watch activity and behavior around the agency's data, and the governance they need first: Purview Audit Standard and Premium, retention and routing; Insider Risk Management and Communication Compliance under a charter that settles privacy, legal and labor-relations questions, role separation, pseudonymization, triage, retention and evidence; and the How sections that turn on, retain and test Purview Audit with searchable synthetic events, and stand up Insider Risk Management and Communication Compliance, with government-cloud availability, licensing, change safety, rollback, telemetry and evidence."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 10
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 10 — Audit, Insider Risk and Communication Compliance

*Audit records what happened to the data; insider risk tools look at what people do with it, and the second needs a charter before it needs a license.*

::: {.callout-note}
## In this chapter
Purview Audit as the floor every other data control stands on: what Audit (Standard) and Audit (Premium) keep and for how long, retention policies, and where audit data goes. Insider Risk Management and Communication Compliance, and the governance that has to exist before either is turned on: privacy, legal and labor-relations review, role separation, pseudonymization, triage, retention and evidence. Then two How sections: turning on, retaining and testing Purview Audit with searchable synthetic events, and standing up Insider Risk Management and Communication Compliance under a charter.
:::

Every chapter before this one produces audit records: a label applied by a user or a policy, a DLP match or override, a decrypted file, a changed container label. Those records are the operational evidence for the labeling, DLP and encryption controls, and they are what the security monitor detects on. If auditing is off, or its records age out before anyone reads them, the controls in Chapters 03 to 09 still act but nobody can show that they did. This chapter makes sure the records exist, are kept long enough and reach the people who use them. Book 20's share of the closure map's audit and visibility row is that: Purview audit turned on, retained, routed, detected on and tested with events an assessor can find.

Two neighbors own the rest. [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md) owns getting Microsoft 365 telemetry into the agency's log platform, and [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md) owns the evidence contract that says what each source must deliver and how long it is kept. [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) owns the detections, including FMP-DET-05 (mass label removal or decryption) and FMP-DET-06 (DLP override pattern). This chapter links them and doesn't repeat them.

Insider Risk Management and Communication Compliance are different in kind. They don't record what happened to data; they score and review what particular people do. That makes them privacy, legal and labor-relations decisions before they are technical ones. [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) owns the agency's privacy program and its processing of personally identifiable information; this chapter says where that program has to sign off. The implementation conventions are in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md).

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data; SecOps
- **CISA ZTMM pillar:** Data, with the Visibility and Analytics cross-cutting capability
- **Depends on:** identity and licensing ([Book 02](../b02-identity/index.md)); device onboarding for endpoint indicators ([Book 05](../b05-devices/index.md)); DLP alerts at High severity ([Chapter 08](08-dlp-and-endpoint-controls.md)); the log platform and evidence contract ([Book 12](../b12-security-operations/index.md)); the privacy program ([Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md)); an HR data feed for departure dates ([Book 03](../b03-hr-identity/index.md))
- **Attack chain interrupted:** Defense Evasion and Exfiltration are exposed rather than stopped: audit makes label removal, decryption, mass download and sharing visible; Insider Risk Management correlates them by person and raises the ones that matter
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Audit is the floor](#audit-is-the-floor); [The charter comes first](#the-charter-comes-first) | Audit retention design in the evidence contract; the insider risk charter, signed by the privacy officer, general counsel, labor relations and the CISO |
| Configured | [Enforcement](#enforcement); [Pilot](#b20-10-pilot-irm) | `Get-AdminAuditLogConfig` and `Get-UnifiedAuditLogRetentionPolicy` exports; IRM and Communication Compliance settings and policy screenshots or exports; role-group membership |
| Enforced | [Enforcement](#enforcement) | Unified audit log ingestion `True`; retention policies at the designed durations. For IRM and Communication Compliance: not applicable as blocking controls; their Adaptive Protection effects follow [Chapter 08](08-dlp-and-endpoint-controls.md) and [Book 04](../b04-access/index.md) |
| Evidenced | [Evidence](#evidence); [Evidence](#b20-10-evidence-irm) | The synthetic-event test record and the audit records it found; a test alert worked through triage |
| Operated | [Day-two ownership](#day-two-ownership); [Day-two ownership](#b20-10-day-two-irm) | Monthly synthetic-event test, retention review, IRM case metrics and the investigators' own audit trail |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Audit is the floor

Purview Audit comes in two tiers. Audit (Standard) is on by default for enterprise organizations, keeps records for 180 days, and offers search in the Purview portal, the `Search-UnifiedAuditLog` cmdlet, the Audit Search Graph API, CSV export and the Office 365 Management Activity API.[^c10-audit-overview] Audit (Premium) adds audit log retention policies, longer retention, intelligent insights and higher-bandwidth access to the Management Activity API.[^c10-audit-overview]

| | Audit (Standard) | Audit (Premium) |
|---|---|---|
| Default retention | 180 days (records from Oct 17, 2023 on) | One year for Microsoft Entra ID, Exchange, OneDrive and SharePoint records of users with the qualifying license; 180 days for other services unless a retention policy says otherwise[^c10-retention] |
| Longest retention | 180 days | Up to one year by policy; 10 years for users who also hold the 10-Year Audit Log Retention add-on[^c10-audit-overview] |
| Retention policies | No | Up to 50 per organization, by service, activity and user, with a priority from 1 (highest) to 10,000[^c10-retention] |
| Non-user records | 180 days | Service principal, system and application records are kept for a fixed one year; custom retention policies don't apply to them[^c10-audit-overview] |
| Management Activity API | Baseline bandwidth | About twice the baseline bandwidth[^c10-audit-overview] |
| High-value events | Standard events | Adds events such as `MailItemsAccessed`, with properties such as the sensitivity label of the mail item accessed[^c10-audit-overview] |

: Audit (Standard) and Audit (Premium) (read Nov 11, 2026) {.striped .hover}

Three facts shape the design:

- **Retention follows the user who acted.** To keep a record longer than 180 days, the user who performed the activity must hold an Office 365 or Microsoft 365 E5 license or a Microsoft Purview Suite or E5 eDiscovery and Audit add-on; for 10 years, the 10-year add-on too. A user without the license gets the default retention for their license, whatever the policy says.[^c10-retention] Guests and non-E5 users stay at 180 days. That is a licensing gap the agency records in the decision record, not a failure of the audit control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).
- **Search isn't real time.** Microsoft doesn't guarantee when a record appears; for Exchange, SharePoint, OneDrive and Teams it is typically 60 to 90 minutes after the event, and longer for other services.[^c10-search] Detection that needs minutes uses the services' own alerts; the audit log is the record.
- **Turning auditing off is a blind spot everywhere.** With auditing off, the Management Activity API and Microsoft Sentinel can't read audit data, Purview audit search returns nothing, and `Search-UnifiedAuditLog` returns nothing.[^c10-enable] An event that changes the auditing state is itself audited, and the program detects it.

**Authority:** Mandated for the agency's logging obligations, which [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md) sets out with their sources. Microsoft-recommended for verifying the auditing status of a new organization.[^c10-enable] Risk-based recommended (the program's position): retain Purview audit records in the tenant for one year through Audit (Premium) where licensed, and in the agency's log platform for the period the evidence contract sets, because the tenant copy is limited by license and the log platform's isn't.
**Applies:** License-dependent (Audit Premium, 10-year add-on). Environment-dependent: Audit (Standard) and Audit (Premium), including one-year and 10-year retention and increased Management Activity API bandwidth, are listed as Available in GCC, GCC High and DoD.[^c10-gcc][^c10-gcch][^c10-dod]

### Routing audit data out of the tenant

The log platform, not the tenant, is where audit data is kept for the evidence contract's full period and correlated with everything else. [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md) builds that path. Two Purview facts bear on it. The Management Activity API serves only the last seven days of content, so a collector that stops for longer than that loses data the tenant still holds but the API won't return; and it has no guaranteed latency.[^c10-api-faq] And each cloud has its own API endpoint: `manage.office.com` (commercial), `manage-gcc.office.com` (GCC), `manage.office365.us` (GCC High) and `manage.protection.apps.mil` (DoD).[^c10-api-ref] A collector pointed at the commercial endpoint from a GCC High tenant collects nothing.

## The charter comes first

Insider Risk Management correlates signals (Microsoft 365 activity, device activity, HR events such as a resignation date, DLP alerts) to identify potentially risky activity by a person, and lets analysts and investigators open cases and escalate them.[^c10-irm] Communication Compliance reviews messages in Teams, Exchange, Viva Engage and other channels for policy violations such as sharing sensitive information or harassing language, and lets investigators act on them.[^c10-cc-sd] Both are built with privacy by design: pseudonymization, role-based access, admin opt-in and audit logs.[^c10-privacy]

Those safeguards are necessary and not sufficient. Both tools monitor named people's behavior, so before either is configured the agency settles, in writing, a **charter** that answers:

| Question | Who decides | Where it's recorded |
|---|---|---|
| What is the program for, and which policy templates are in scope? | CISO with the insider threat program lead | Charter |
| What notice do employees receive, and does a privacy impact assessment or system of records notice apply? | Senior agency official for privacy ([Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md)) | Charter; privacy documentation |
| Are there bargaining or notice obligations for represented employees? | Labor relations office | Charter |
| What may an investigator view, export or escalate, and to whom (HR, inspector general, law enforcement)? | General counsel | Charter; escalation procedure |
| Who holds which role, and who reviews the reviewers? | CISO, with the privacy officer | Role register; the investigators' audit trail |
| How long are alerts, cases and evidence kept? | Records officer | Records schedule entry |

: The insider risk charter: questions settled before configuration (program design) {.striped .hover}

**Authority:** Risk-based recommended (the program's position: a monitoring tool turned on without these answers creates legal and labor risk that outweighs its detection value). NIST SP 800-53 Rev. 5 PM-12 describes an insider threat program with a cross-discipline incident handling team; this charter is how the program connects the tools to that team.[^c10-53]
**Applies:** All agencies that turn on either tool.

The workbook doesn't decide any of those questions and doesn't describe what any agency decided. It requires that the decisions exist before the tool does.

### Role separation

Insider Risk Management has six role groups with distinct permissions: **Insider Risk Management** (all permissions), **Admins** (policies and settings, but no alerts or cases), **Analysts** (alerts and cases, but not content explorer or forensic evidence), **Investigators** (alerts, cases, content explorer and forensic evidence), **Auditors** (the insider risk audit log only) and **Approvers** (forensic evidence capture approval).[^c10-irm-perms] Communication Compliance has Administrators, Analysts (message metadata), Investigators (message content) and Viewers (reports).[^c10-roles]

The program's assignment:

- **No one administers and investigates.** Admins configure policies and can't see the cases those policies produce; Investigators see cases and can't change the policies. The combined *Insider Risk Management* role group isn't used for named staff.
- **Analysts before Investigators.** Triage happens with metadata and pseudonyms; content is opened by an Investigator only after an analyst escalates.
- **The reviewers are reviewed.** The Auditors role group belongs to someone outside the investigation team (the privacy office or the inspector general's liaison), who reviews the insider risk audit trail on a set cadence.
- **Never zero administrators.** Microsoft warns to keep at least one user in *Insider Risk Management* or *Insider Risk Management Admins* so the configuration isn't orphaned when people leave.[^c10-irm-perms] The program keeps two named Admins, assigned through PIM-for-Groups or recorded in the role register where groups aren't supported.

Microsoft notes that adding **security groups** to Purview role groups is supported only in Microsoft 365 commercial cloud organizations.[^c10-purview-perms] GCC High and DoD aren't commercial cloud organizations, and Learn's wording doesn't settle GCC, so in all three government clouds the program assigns individual users and keeps the role register as the record of who holds each role and why.

### Pseudonymization

Pseudonyms are on by default for analyst and investigator roles.[^c10-privacy] With **Show anonymized versions of usernames** on, names in alerts and cases appear as pseudonyms, and user profile details aren't shown; names inside activity metadata, file metadata and file content in content explorer aren't anonymized, and anonymization isn't preserved in exports through the API or to eDiscovery, though CSV exports from alerts or cases keep it.[^c10-irm-privacy] The data risk graph doesn't work with anonymization on, and Microsoft is retiring it on November 24, 2026.[^c10-irm-privacy][^c10-risk-graph]

The program keeps anonymization on. De-anonymizing a case is an escalation step in the charter, approved by general counsel, and the approval is filed with the case.

### Triage, retention and evidence

| Stage | Who | Output |
|---|---|---|
| Alert | Analyst | Confirm or dismiss with a reason; dismissed alerts feed threshold tuning |
| Case | Analyst escalates; Investigator works | Activity timeline, content reviewed (logged), notices sent through approved templates |
| Escalation | Investigator, with general counsel's approval | Referral to HR, the inspector general or law enforcement, as the charter allows; or escalation to eDiscovery (Premium) |
| Closure | Investigator | Resolution (confirmed violation, benign, insufficient evidence), filed with the case record under the records schedule |

: Insider risk triage (program design) {.striped .hover}

Communication Compliance's ability to set a retention period on a policy is listed as on engineering backlog in GCC, GCC High and DoD,[^c10-gcc][^c10-gcch][^c10-dod] so retention of its review data follows the product default there, and the records officer records that as a known limit.

## How: turn on, retain and test Purview Audit

This procedure turns auditing on (or confirms it is on), sets retention to the evidence contract's tenant period, and proves the pipeline with **searchable synthetic events**: a deliberate label applied and removed on a test file, found in the audit log and in the log platform. Placeholders: `<admin-upn>` is the operator's account; `<test-user-upn>` is a dedicated, licensed test account; `<test-site-url>` is a SharePoint site in `contoso.example` reserved for tests; `<label-name>` is a published label without encryption.

### Prerequisites

- **Roles.** Turning auditing on or off needs the **Audit Logs** role in Exchange Online (in the Compliance Management and Organization Management role groups); creating retention policies needs the **Organization Configuration** role in Purview; searching needs **View-Only Audit Logs** or **Audit Logs** (for example the Audit Reader role group).[^c10-enable][^c10-retention][^c10-best-practice] Activate through PIM ([Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md)).
- **Licensing (License-dependent).** Audit (Premium) retention for each user whose actions must be kept beyond 180 days; the 10-year add-on where the evidence contract requires it.[^c10-retention]
- **Modules.** The Exchange Online PowerShell module, for `Connect-ExchangeOnline` and `Connect-IPPSSession`.

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Audit (Standard) | Available | Available | Available | Available | Learn government Purview pages[^c10-gcc][^c10-gcch][^c10-dod] |
| Audit (Premium): crucial events such as MailItemsAccessed | Available | Available | Available | Available | Same |
| Audit (Premium): one-year retention | Available | Available | Available | Available | Same |
| Audit (Premium): 10-year retention | Available | Available | Available | Available | Same |
| Increased Management Activity API bandwidth | Available | Available | Available | Available | Same |
| Audit search enhancements | Available | On engineering backlog | On engineering backlog | On engineering backlog | Same |
| Management Activity API endpoint | `manage.office.com` | `manage-gcc.office.com` | `manage.office365.us` | `manage.protection.apps.mil` | Management Activity API reference[^c10-api-ref] |

: Government-cloud availability for Purview Audit (read Nov 11, 2026; Microsoft states the government status is subject to change) {.striped .hover}

Connect (checked against Learn on Nov 11, 2026; run against a test tenant first):[^c10-connect][^c10-apponly]

```powershell
# Commercial and GCC
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
Connect-IPPSSession -UserPrincipalName <admin-upn>

# GCC High
Connect-ExchangeOnline -UserPrincipalName <admin-upn> -ExchangeEnvironmentName O365USGovGCCHigh
Connect-IPPSSession -UserPrincipalName <admin-upn> -ConnectionUri https://ps.compliance.protection.office365.us/powershell-liveid/ -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations

# DoD
Connect-ExchangeOnline -UserPrincipalName <admin-upn> -ExchangeEnvironmentName O365USGovDoD
Connect-IPPSSession -UserPrincipalName <admin-upn> -ConnectionUri https://l5.ps.compliance.protection.office365.us/powershell-liveid/ -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations
```

### Pilot

Auditing is tenant-wide, so there is no pilot population for turning it on. Retention policies are piloted: the first custom policy is scoped to `<test-user-upn>` and checked before policies for all users are created.

### Report-only or audit phase

Not applicable as a mode: auditing is a detective control with nothing to enforce. The equivalent step is reading the current state before changing anything. In **Exchange Online PowerShell** (in Security & Compliance PowerShell this property always reads `False`):[^c10-enable]

```powershell
Get-AdminAuditLogConfig | Format-List UnifiedAuditLogIngestionEnabled
Get-UnifiedAuditLogRetentionPolicy | Sort-Object -Property Priority | Format-List Priority,Name,Description,RecordTypes,Operations,UserIds,RetentionDuration
```

The second command runs in Security & Compliance PowerShell.[^c10-retention] Save both outputs as the before-state.

### Enforcement

Turn auditing on if the first command returned `False` (Exchange Online PowerShell; it can take up to 60 minutes to take effect):[^c10-enable]

```powershell
Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true
```

Create the retention policies the evidence contract calls for (Security & Compliance PowerShell). `-RetentionDuration` accepts `ThreeMonths`, `SixMonths`, `NineMonths`, `TwelveMonths` and `TenYears`; a lower `-Priority` number wins.[^c10-new-retention] The pilot first, then the label and DLP record types for everyone:

```powershell
# Pilot: everything the test user does, one year
New-UnifiedAuditLogRetentionPolicy -Name 'FMP-Audit-Pilot-TestUser' -Description 'Pilot: one year for the test account' `
  -UserIds '<test-user-upn>' -RetentionDuration TwelveMonths -Priority 100

# Information protection and DLP records, one year, all users
New-UnifiedAuditLogRetentionPolicy -Name 'FMP-Audit-InfoProtection-1y' -Description 'Label, protection and DLP records, one year' `
  -RecordTypes SensitivityLabelAction,MipLabel,AipSensitivityLabelAction,AipProtectionAction,ComplianceDLPExchange,ComplianceDLPSharePoint,DLPEndpoint `
  -RetentionDuration TwelveMonths -Priority 200
```

Where users hold the 10-year add-on and the evidence contract requires it, a further policy with `-RetentionDuration TenYears` for those record types. Record types are listed on Learn's supported-services and Management Activity API schema pages; confirm each name there before adding it.[^c10-supported][^c10-sentinel-types]

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Read-only: current state captured | Before-state saved |
| 1 | Auditing on (if it was off); pilot retention policy for the test account | Synthetic events for the test account searchable within the documented latency |
| 2 | Retention policies for all users | `Get-UnifiedAuditLogRetentionPolicy` matches the design |
| 3 | Routing confirmed in the log platform ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)) | The synthetic events appear in the log platform |

- **Emergency access:** Not applicable to sign-in. Emergency access account activity is audited like any other and is never excluded from retention.
- **Change window:** Any time; the change is non-disruptive. Approved through the change process because retention changes alter evidence lifetimes.
- **Backout triggers:** A retention policy that shortens retention below the evidence contract (a custom policy outranks the default, so a short one can cut retention for Exchange, SharePoint or Entra records).[^c10-retention]
- **Post-change validation:** The synthetic-event test below.

**The synthetic-event test.** Run it after ring 1, after ring 3 and monthly afterward. As `<test-user-upn>`, in Office for the web, open a test document in `<test-site-url>`, apply `<label-name>`, save, then remove the label and save. Office for the web records `FileSensitivityLabelApplied` and `FileSensitivityLabelRemoved`; Microsoft 365 desktop apps record `SensitivityLabelApplied` and `SensitivityLabelRemoved` instead.[^c10-activities] Wait at least 90 minutes,[^c10-search] then in Exchange Online PowerShell:

```powershell
$start = (Get-Date).AddHours(-4)
$end   = Get-Date
$hits  = Search-UnifiedAuditLog -StartDate $start -EndDate $end -UserIds '<test-user-upn>' `
          -Operations FileSensitivityLabelApplied,FileSensitivityLabelRemoved,SensitivityLabelApplied,SensitivityLabelRemoved `
          -ResultSize 5000
$hits | Select-Object CreationDate,UserIds,Operations,RecordType | Format-Table -AutoSize
$hits | Select-Object CreationDate,UserIds,Operations,RecordType,AuditData |
  Export-Csv ".\synthetic-label-test-$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation
```

Pass: one applied and one removed record for the test account, with the label's ID in `AuditData`. Then run the same search in the log platform (the query belongs to [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)) and record both results. Add a synthetic DLP match (send a labeled test message to an external test mailbox, [Chapter 08](08-dlp-and-endpoint-controls.md#enforcement)) and search `-RecordType ComplianceDLPExchange` the same way.

### Rollback

The rollback for auditing is never turning it off. A retention policy that was wrong is changed or removed (Security & Compliance PowerShell; removal can take up to 30 minutes to apply):[^c10-retention]

```powershell
Set-UnifiedAuditLogRetentionPolicy -Identity 'FMP-Audit-InfoProtection-1y' -RetentionDuration TwelveMonths
Remove-UnifiedAuditLogRetentionPolicy -Identity 'FMP-Audit-Pilot-TestUser'
```

A retention change alters the expiry of records already in the log, so a shortening is approved by the records officer before it is made.[^c10-audit-overview]

### Exclusions

No user, including emergency access accounts and service accounts, is excluded from auditing. The only accepted narrowing is shorter retention for very noisy, low-value events, as Microsoft's example for a SharePoint service account's search queries shows, approved by the records officer and recorded in the exception register:[^c10-new-retention]

```powershell
New-UnifiedAuditLogRetentionPolicy -Name 'FMP-Audit-Noisy-SearchQuery' -Description 'Approved: 90 days for app search queries' `
  -RecordTypes SharePoint -Operations SearchQueryPerformed -UserIds 'app@sharepoint' -RetentionDuration ThreeMonths -Priority 10000
```

### Telemetry

The audit of the audit: changes to auditing state are themselves audited.[^c10-enable] The security monitor alerts on them in the log platform, and the operator can check directly:

```powershell
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -Operations Set-AdminAuditLogConfig -ResultSize 5000 |
  Select-Object CreationDate,UserIds,Operations,AuditData
```

Retention policy changes, collector health and the monthly synthetic-event results are the other signals ([Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) holds the detection for auditing turned off).

### Evidence

**Evidence checklist**

- [ ] **Configuration:** `Get-AdminAuditLogConfig | Format-List UnifiedAuditLogIngestionEnabled` (Exchange Online PowerShell) and `Get-UnifiedAuditLogRetentionPolicy` exports, dated, after each ring and monthly
- [ ] **Operational:** the collector's health and the record counts per day in the log platform; the 30-day `Set-AdminAuditLogConfig` search
- [ ] **Test:** the synthetic-event CSV, expected and observed records, the log-platform result, date and tester (minimum evidence for the audit closure-map row: searchable synthetic events)
- [ ] **Exception:** register rows for shortened retention, and the licensing gap for users without Audit (Premium)
- [ ] **Assessor-ready artifact:** the configuration exports, the latest three monthly synthetic-event records and the retention design, filed under the AU-family entries in [Appendix A](appendix-a-requirements-mapping.md)

### Day-two ownership

Policy owner: the records officer for retention durations. Platform owner: auditing state, retention policies and the drift check ([Book 13](../b13-governance/index.md)). Operator: the monthly synthetic-event test. Security monitor: the alert on auditing-state changes and collector gaps, and investigations that use the log ([Book 12](../b12-security-operations/index.md)). Help desk: none directly; routes "I can't find an audit record" to the operator. Assessor: re-runs or samples the synthetic test. Cadence: monthly test, quarterly retention review against the evidence contract, annual licensing review for retention coverage. Roles are set out in [Chapter 12](12-operations-and-evidence.md#raci). Drift looks like `UnifiedAuditLogIngestionEnabled` `False`, a retention policy outside the design, or a month with no synthetic-test record.

## How: Insider Risk Management and Communication Compliance under a charter

This procedure stands up both tools only after the [charter](#the-charter-comes-first) is signed. Most configuration is in the Purview portal; role assignment and verification use Security & Compliance PowerShell. Placeholders: `<irm-admin-upn>`, `<irm-analyst-upn>`, `<irm-investigator-upn>`, `<irm-auditor-upn>` and the matching Communication Compliance accounts are named staff in the role register.

### Prerequisites {#b20-10-prerequisites-irm}

- **The charter**, signed by the CISO, the senior agency official for privacy, general counsel and the labor relations office, with the records schedule entry.
- **Licensing (License-dependent).** Insider Risk Management is included in Microsoft 365 E5/A5/G5, the Microsoft Purview Suite and the E5/A5/F5/G5 Insider Risk Management add-on; Communication Compliance in those and Office 365 E5/A5/G5.[^c10-licensing] Microsoft offers Insider Risk Management only in tenants hosted where its Azure service dependencies are available.[^c10-irm-plan]
- **Policy template prerequisites.** *Data theft by departing users* needs the HR connector importing resignation and termination dates; *Data leaks* needs at least one DLP policy with High-severity incident reports ([Chapter 08](08-dlp-and-endpoint-controls.md#dlp-incidents-from-alert-to-handled)); *Security policy violations* needs the Defender for Endpoint integration.[^c10-irm-plan] The HR feed comes from the authoritative HR source ([Book 03](../b03-hr-identity/index.md)).
- **Devices** onboarded for endpoint indicators ([Chapter 08](08-dlp-and-endpoint-controls.md#endpoint-dlp-on-windows)).[^c10-onboard]
- **Auditing on** ([How: turn on, retain and test Purview Audit](#how-turn-on-retain-and-test-purview-audit)).

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| IRM: data theft by departing users; general data leaks | Available | Available | Available | Available | Learn government Purview pages[^c10-gcc][^c10-gcch][^c10-dod] |
| IRM: forensic evidence; case dashboard; "watch the watchers" audit trail | Available | Available | Available | Available | Same |
| IRM: Office and Windows 10 endpoint indicators; Entra account-deletion trigger | Available | Available | Available | Available | Same |
| IRM: analytics; priority user groups; Teams integration | Available | Public Preview | Public Preview | Public Preview | Same |
| IRM: Defender for Endpoint alert indicators; security policy violation templates | Available | In development | In development | In development | Same |
| HR data connector | Available | Available | Available | Available | Same |
| Communication Compliance: Exchange and Teams; templates; remove Teams message | Available | Available | Available | Available | Same |
| Communication Compliance: policy retention period setting | Not yet specified | On engineering backlog | On engineering backlog | On engineering backlog | Same |
| Security groups as Purview role-group members | Available | Not yet specified | Not supported | Not supported | Permissions in the Microsoft Purview portal[^c10-purview-perms] |

: Government-cloud availability for Insider Risk Management and Communication Compliance (read Nov 11, 2026; status subject to change) {.striped .hover}

### Pilot {#b20-10-pilot-irm}

Assign roles first, by name, per the role register (Security & Compliance PowerShell; checked against Learn on Nov 11, 2026). List the role groups to get their exact names, then add members:[^c10-roles][^c10-ediscovery-perms]

```powershell
Get-RoleGroup | Where-Object { $_.DisplayName -like 'Insider Risk Management*' -or $_.DisplayName -like 'Communication Compliance*' } |
  Select-Object Name,DisplayName

Add-RoleGroupMember -Identity '<irm-admins-role-group-name>' -Member '<irm-admin-upn>'
Add-RoleGroupMember -Identity '<irm-analysts-role-group-name>' -Member '<irm-analyst-upn>'
Add-RoleGroupMember -Identity '<irm-investigators-role-group-name>' -Member '<irm-investigator-upn>'
Add-RoleGroupMember -Identity '<irm-auditors-role-group-name>' -Member '<irm-auditor-upn>'

Get-RoleGroupMember -Identity '<irm-investigators-role-group-name>'
```

Role assignments can take up to 30 minutes to apply.[^c10-irm-perms] Then, as an Admin, in the Purview portal: **Settings** > **Insider Risk Management** > **Privacy**, confirm **Show anonymized versions of usernames** is selected.[^c10-irm-privacy] Create one policy from the charter's first template, scoped to the pilot population the charter names.

### Report-only or audit phase {#b20-10-audit-irm}

Insider Risk Management policies raise alerts; they don't block. The audit phase is the first 30 days, in which Analysts triage alerts and record the outcome but no case is escalated except for an imminent threat the charter defines. The output is a tuning record: alert volume, the share confirmed, and threshold or indicator changes made. Communication Compliance policies are treated the same way.

### Enforcement {#b20-10-enforcement-irm}

Not applicable as a blocking control. Moving out of the audit phase means widening policy scope to the charter's full population and starting the case workflow. If the agency later turns on **Adaptive Protection**, which applies insider risk levels to DLP and Conditional Access, those effects are enforcement controls and follow [Chapter 08](08-dlp-and-endpoint-controls.md) and [Book 04](../b04-access/index.md) rings, with emergency access accounts excluded from any Conditional Access policy it drives.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Roles assigned; anonymization confirmed; no policy | Role register matches `Get-RoleGroupMember` output |
| 1 | One policy, pilot population, 30-day audit phase | Tuning record approved by the CISO and the privacy officer |
| 2 | Charter's full population for that template | Case workflow tested end to end with a synthetic case |
| 3 | Further templates, each through rings 1 and 2 | Charter amended to name each template |

- **Emergency access:** No effect on sign-in unless Adaptive Protection drives Conditional Access; then excluded as in [Book 04](../b04-access/index.md).
- **Change window:** Any time after the charter's notice period has run.
- **Backout triggers:** A charter question found unanswered; alert volume Analysts can't triage; a privacy complaint the privacy officer upholds.
- **Post-change validation:** A synthetic case (a test account's departure date imported through the HR connector, followed by staged downloads of test files) produces an alert that an Analyst triages under a pseudonym.

### Rollback {#b20-10-rollback-irm}

In the Purview portal, **Insider Risk Management** > **Policies**: select the policy and turn it off; in **Communication Compliance** > **Policies**, the same. Existing alerts and cases remain under the records schedule. Remove role assignments that are no longer needed with `Remove-RoleGroupMember -Identity '<role-group-name>' -Member '<upn>'`.

### Exclusions {#b20-10-exclusions-irm}

Exclusions are charter decisions, not operator ones: populations the charter puts out of scope (for example, staff whose communications are privileged by law) are excluded from policy scope, and the exclusion is listed in the charter. Priority user groups, where used, are a charter decision too, with review restricted to named reviewers.[^c10-priority]

### Telemetry {#b20-10-telemetry-irm}

- The insider risk audit trail ("watch the watchers"), read by the Auditors role group.[^c10-irm-perms]
- Communication Compliance records (`ComplianceSupervisionExchange`) and other Purview records in the unified audit log.[^c10-supported]
- Insider risk alerts shared with Microsoft Defender XDR and exported to the SIEM where the charter allows, using the data-sharing settings.[^c10-share]

```powershell
# Exchange Online PowerShell: Communication Compliance activity in the last 30 days
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -RecordType ComplianceSupervisionExchange -ResultSize 5000 |
  Select-Object CreationDate,UserIds,Operations | Export-Csv .\cc-activity-30d.csv -NoTypeInformation
```

### Evidence {#b20-10-evidence-irm}

**Evidence checklist**

- [ ] **Configuration:** the signed charter; `Get-RoleGroupMember` output for each insider risk and Communication Compliance role group; screenshots or exports of the privacy setting and each policy's scope and template
- [ ] **Operational:** monthly alert, case and closure counts by outcome; the Auditors' review record
- [ ] **Test:** the synthetic case, expected and observed alert, triage record under a pseudonym, date and tester
- [ ] **Exception:** charter exclusions and every de-anonymization approval
- [ ] **Assessor-ready artifact:** the charter, role register, test record and the last quarter's metrics, under PM-12 and AC-5 in [Appendix A](appendix-a-requirements-mapping.md)

### Day-two ownership {#b20-10-day-two-irm}

Policy owner: the insider threat program lead, under the charter. Platform owner: settings, connectors and role assignments. Operator: the IRM Admins, who don't see cases. Security monitor: receives escalated alerts that are security incidents ([Book 12](../b12-security-operations/index.md)). Help desk: not involved in cases; routes any employee question about monitoring to the privacy office ([Book 15](../b15-day2-operations/index.md)). Assessor: reviews the charter, the role separation and the Auditors' records. Cadence: weekly triage, monthly metrics, quarterly Auditors' review, annual charter review. Roles are set out in [Chapter 12](12-operations-and-evidence.md#raci). Drift looks like a named person in both an Admin and an Investigator role, anonymization turned off without a recorded approval, or a policy whose template the charter doesn't name.

## Requirements this chapter supports

| Requirement | What this chapter contributes |
|---|---|
| NIST SP 800-53 Rev. 5 AU-2 (Event Logging), AU-12 (Audit Record Generation) | Unified audit logging on and verified |
| NIST SP 800-53 Rev. 5 AU-6 (Audit Record Review, Analysis, and Reporting) | Routing to the log platform and the security monitor's review |
| NIST SP 800-53 Rev. 5 AU-11 (Audit Record Retention) | Retention policies at the evidence contract's tenant period |
| NIST SP 800-53 Rev. 5 PM-12 (Insider Threat Program) | Insider Risk Management and Communication Compliance under a charter, with cross-discipline review |
| NIST SP 800-53 Rev. 5 AC-5 (Separation of Duties) | Distinct admin, analyst, investigator and auditor roles |
| CISA Zero Trust Maturity Model, Visibility and Analytics | Purview activity in the enterprise log platform |

: Requirements this chapter supports (the full mapping, with FedRAMP 20x KSIs, is [Appendix A](appendix-a-requirements-mapping.md)) {.striped .hover}

These rows say what the chapter contributes. The agency still sets each control's parameters, policy and procedures, and the assessor decides whether each is satisfied.[^c10-53] <!-- claims-ok: states that the assessor decides -->

## Key takeaways

- Check that auditing is on in Exchange Online PowerShell, never in Security & Compliance PowerShell, and treat any change to it as an alert.
- Audit retention follows the license of the user who acted; the log platform, not the tenant, holds the evidence contract's full period.
- Prove the audit pipeline monthly with a synthetic label event that is searchable in the tenant and in the log platform.
- Insider Risk Management and Communication Compliance start with a signed charter: privacy, legal, labor relations, roles, retention.
- Keep pseudonymization on, separate administrators from investigators, and make sure someone reviews the reviewers.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 09 — Auto-Labeling and Sensitive Information Types](09-auto-labeling-and-sensitive-information-types.md) · [Book index](index.md) · [Next: Chapter 11 — AI Data Security →](11-ai-data-security.md)
:::

[^c10-audit-overview]: Microsoft Learn, "Learn about auditing solutions in Microsoft Purview," sections "Comparison of key capabilities," "Audit (Standard)" and "Audit (Premium)" (180-day default; one-year and 10-year retention; retention policies; non-user records fixed at one year; about twice the API bandwidth; MailItemsAccessed with SensitivityLabel; license and policy changes alter expiry of later-committed items), <https://learn.microsoft.com/purview/audit-solutions-overview> (accessed Nov 11, 2026).
[^c10-retention]: Microsoft Learn, "Manage audit log retention policies" (default policy keeps Entra ID, Exchange, OneDrive and SharePoint records one year for E5 or add-on users; up to 50 policies; Organization Configuration role; licensing for more than 180 days and for 10 years; custom policies take priority; priority 1 to 10,000; deletion can take 30 minutes; PowerShell examples), <https://learn.microsoft.com/purview/audit-log-retention-policies> (accessed Nov 11, 2026).
[^c10-search]: Microsoft Learn, "Search the audit log," section "Before you search the audit log" (no guaranteed latency; typically 60 to 90 minutes for core services), <https://learn.microsoft.com/purview/audit-search> (accessed Nov 11, 2026).
[^c10-enable]: Microsoft Learn, "Turn auditing on or off" (verify with `Get-AdminAuditLogConfig` in Exchange Online PowerShell, always False in Security & Compliance PowerShell; `Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true`, up to 60 minutes; Audit Logs role; with auditing off the API, Sentinel and searches return nothing; changes to auditing status are audited), <https://learn.microsoft.com/purview/audit-log-enable-disable> (accessed Nov 11, 2026).
[^c10-api-faq]: Microsoft Learn, "Office 365 Management Activity API FAQs and troubleshooting" (API returns the last seven days; no guaranteed latency; auditing must be on), <https://learn.microsoft.com/office/office-365-management-api/troubleshooting-the-office-365-management-activity-api> (accessed Nov 11, 2026).
[^c10-api-ref]: Microsoft Learn, "Office 365 Management Activity API reference," section "Activity API operations" (endpoints for enterprise, GCC, GCC High and DoD plans), <https://learn.microsoft.com/office/office-365-management-api/office-365-management-activity-api-reference> (accessed Nov 11, 2026).
[^c10-irm]: Microsoft Learn, "Learn about Insider Risk Management," <https://learn.microsoft.com/purview/insider-risk-management> (accessed Nov 11, 2026).
[^c10-cc-sd]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Communications Compliance" (channels, investigator actions, pseudonymization, included plans), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c10-privacy]: Microsoft Learn, "Microsoft Purview Insider Risk Management and Communication Compliance privacy guide" (pseudonymization, role-based access, admin opt-in, audit logs; pseudonyms on by default for analyst and investigator roles), <https://learn.microsoft.com/purview/insider-risk-solution-privacy> (accessed Nov 11, 2026).
[^c10-53]: NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls AU-2, AU-6, AU-11, AU-12, PM-12 and AC-5, checked against the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026).
[^c10-irm-perms]: Microsoft Learn, "Assign permissions in Insider Risk Management" (six role groups and their actions; keep at least one user in Insider Risk Management or Insider Risk Management Admins; up to 30 minutes to apply), <https://learn.microsoft.com/purview/insider-risk-management-permissions> (accessed Nov 11, 2026).
[^c10-roles]: Microsoft Learn, "Roles and role groups in Microsoft Defender for Office 365 and Microsoft Purview" (Insider Risk Management and Communication Compliance role groups and their roles), <https://learn.microsoft.com/defender-office-365/scc-permissions> (accessed Nov 11, 2026).
[^c10-purview-perms]: Microsoft Learn, "Permissions in the Microsoft Purview portal," section "Add users or groups to a Microsoft Purview built-in role group" (security groups are supported only in Microsoft 365 commercial cloud organizations), <https://learn.microsoft.com/purview/purview-permissions> (accessed Nov 11, 2026).
[^c10-irm-privacy]: Microsoft Learn, "Manage username privacy in Insider Risk Management" (anonymized usernames; what isn't anonymized; exports; data risk graph unavailable with anonymization; portal path), <https://learn.microsoft.com/purview/insider-risk-management-settings-privacy> (accessed Nov 11, 2026).
[^c10-risk-graph]: Microsoft Learn, "Data risk graph in Insider Risk Management" (retirement on November 24, 2026), <https://learn.microsoft.com/purview/insider-risk-management-data-risk-graph> (accessed Nov 11, 2026).
[^c10-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (status subject to change), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c10-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c10-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
[^c10-best-practice]: Microsoft Learn, "Best Practices using the Search-UnifiedAuditLog cmdlet tool" (View-Only Audit Logs or Audit Logs role; 100 records by default, up to 5,000 per request), <https://learn.microsoft.com/office/office-365-management-api/aip-unified-audit-logs-best-practices> (accessed Nov 11, 2026).
[^c10-connect]: Microsoft Learn, "Connect to Security & Compliance PowerShell," Step 2 (ConnectionUri and AzureADAuthorizationEndpointUri for GCC High and DoD), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 11, 2026).
[^c10-apponly]: Microsoft Learn, "App-only authentication for unattended scripts in Exchange Online PowerShell and Security & Compliance PowerShell," section "Connection examples" (`ExchangeEnvironmentName` O365USGovGCCHigh and O365USGovDoD), <https://learn.microsoft.com/powershell/exchange/app-only-auth-powershell-v2> (accessed Nov 11, 2026).
[^c10-new-retention]: Microsoft Learn, "New-UnifiedAuditLogRetentionPolicy" (RetentionDuration accepted values ThreeMonths, SixMonths, NineMonths, TwelveMonths, TenYears; examples including the 90-day SearchQueryPerformed policy), <https://learn.microsoft.com/powershell/module/exchangepowershell/new-unifiedauditlogretentionpolicy> (accessed Nov 11, 2026).
[^c10-supported]: Microsoft Learn, "Microsoft services that support auditing" (record types, including DLP and Communication Compliance), <https://learn.microsoft.com/purview/audit-supported-services> (accessed Nov 11, 2026).
[^c10-sentinel-types]: Microsoft Learn, "Microsoft Purview Information Protection connector reference - audit log record types and activities support" (SensitivityLabelAction, MipLabel, AipSensitivityLabelAction, AipProtectionAction and related record types), <https://learn.microsoft.com/azure/sentinel/microsoft-purview-record-types-activities> (accessed Nov 11, 2026).
[^c10-activities]: Microsoft Learn, "Audit log activities," section "Sensitivity label activities" (FileSensitivityLabelApplied/Removed from Office for the web, SharePoint and auto-labeling; SensitivityLabelApplied/Removed from Microsoft 365 apps), <https://learn.microsoft.com/purview/audit-log-activities> (accessed Nov 11, 2026).
[^c10-licensing]: Microsoft Learn, "Microsoft Purview service description," sections "Microsoft Purview Insider Risk Management" and "Microsoft Purview Communications Compliance" (included plans), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c10-irm-plan]: Microsoft Learn, "Plan for Insider Risk Management," section "Understand requirements and dependencies" (licensing; Azure dependency availability; HR connector, DLP High severity and Defender for Endpoint prerequisites by template), <https://learn.microsoft.com/purview/insider-risk-management-plan> (accessed Nov 11, 2026).
[^c10-onboard]: Microsoft Learn, "Onboard Windows devices into Microsoft 365 overview" (onboarding applies to endpoint DLP and insider risk management), <https://learn.microsoft.com/purview/device-onboarding-overview> (accessed Nov 11, 2026).
[^c10-ediscovery-perms]: Microsoft Learn, "Assign permissions in eDiscovery" (`Add-RoleGroupMember` in Security & Compliance PowerShell), <https://learn.microsoft.com/purview/edisc-permissions> (accessed Nov 11, 2026).
[^c10-priority]: Microsoft Learn, "Prioritize user groups for Insider Risk Management policies" (restricting review of priority user groups to named users or role groups), <https://learn.microsoft.com/purview/insider-risk-management-settings-priority-user-groups> (accessed Nov 11, 2026).
[^c10-share]: Microsoft Learn, "Share Insider Risk Management data with other solutions" (export to SIEM; share with Defender XDR; share user risk with DLP alerts), <https://learn.microsoft.com/purview/insider-risk-management-settings-share-data> (accessed Nov 11, 2026).
