---
title: "Chapter 08 — DLP and Endpoint Controls"
description: "How to design Microsoft Purview Data Loss Prevention from data outcomes rather than from templates: the outcome statement, the surface and the action for each one; simulation mode as the pilot; policy tips, overrides and business justification; false positives and tuning; exceptions that don't become holes; endpoint DLP on onboarded Windows devices; DLP incident handling; and the How sections, with GCC availability, licensing, change safety, rollback, telemetry and evidence."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 8
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 08 — DLP and Endpoint Controls

*A DLP policy that starts by blocking teaches the workforce to work around it; one that starts by watching teaches the program what the workforce actually does.*

::: {.callout-note}
## In this chapter
How to design data loss prevention (DLP) from the outcomes the agency wants for its data, not from the policy templates. Simulation mode as the pilot, and what it does and doesn't evaluate. Policy tips, overrides and business justification, and how they become tuning data. False positives, exceptions that stay narrow and expire, endpoint DLP on onboarded Windows devices, and how a DLP alert becomes a handled incident. Then two How sections, one for workload DLP and one for endpoint DLP, each with GCC availability, licensing, change safety, rollback, telemetry, evidence and day-two ownership.
:::

[Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) sets the program's minimum DLP baseline for a Moderate system: block external sharing and external send of CUI, block print and removable media for CUI Specified, audit copies to network shares, block CUI uploads to unapproved cloud apps, alert on bulk download and detect Social Security numbers in Teams. It also gives the PowerShell that creates those policies and corrects the parameters earlier program scripts got wrong. This chapter doesn't repeat that baseline. It covers what the baseline leaves to the implementer: how each policy is derived from a data outcome, how it moves from simulation to enforcement without stopping the agency's work, how overrides and false positives are handled, how exceptions are kept honest, and what the operator, the security monitor and the help desk do once it's on.

Classification comes first. A DLP rule that matches a label depends on the labels [Chapter 03](03-label-publication-and-defaults.md) publishes and [Chapter 09](09-auto-labeling-and-sensitive-information-types.md) applies automatically; a rule that matches content depends on the sensitive information types Chapter 09 tunes. Device onboarding belongs to [Book 05](../b05-devices/index.md), and the detections built on DLP overrides and label removals belong to [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md). The implementation conventions (control states, the How-section template, authority labels, evidence and change safety) are defined once in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md).

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data
- **Depends on:** labels and auto-labeling ([Chapter 03](03-label-publication-and-defaults.md), [Chapter 09](09-auto-labeling-and-sensitive-information-types.md)); device onboarding and compliance ([Book 05](../b05-devices/index.md)); identity and groups for scoping ([Book 02](../b02-identity/index.md)); the audit pipeline ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md))
- **Attack chain interrupted:** Exfiltration, by a legitimately signed-in user or a compromised account moving labeled or sensitive content to an external recipient, an unapproved cloud app, removable media or a printer
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Design from data outcomes](#design-from-data-outcomes) | The DLP outcome register, approved by the policy owner, and a decision record ([Chapter 01](01-data-inventory-and-classification.md#decision-record-template)) |
| Configured | [Report-only or audit phase](#report-only-or-audit-phase) | `Get-DlpCompliancePolicy` and `Get-DlpComplianceRule` exports with `Mode` in a simulation value |
| Enforced | [Enforcement](#enforcement) | The same exports with `Mode` `Enable`, the location scope, and the exception register |
| Evidenced | [Evidence](#evidence) | A test record per surface (blocked share, blocked send, blocked copy to USB) and the DLP audit record it produced |
| Operated | [Day-two ownership](#day-two-ownership) | Owner and cadence in the run book, the weekly override and false-positive review, and the drift check |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Design from data outcomes

Microsoft's DLP templates are a convenient start and a poor design. A template describes a regulation's data types in the abstract; the agency needs a policy that says what may happen to its own data. The program writes each DLP policy from an **outcome statement**, owned by the policy owner, before anyone opens the portal:

> *Content labeled* `CUI` *(any sublabel) is not shared with, or sent to, anyone outside the agency's tenant, except through the approved partner path; an attempt is blocked, the user is told why, and the security monitor is alerted.*

An outcome statement names five things: the data (a label, a sensitive information type or both), the boundary it must not cross, the surface where the boundary is enforced, the action, and who learns about it. Each outcome becomes one DLP rule, or one policy with a rule per surface, and the outcome statement goes into the rule's `-Comment` so the configuration export carries its own design.

| Outcome (the policy owner's words) | Surface | Condition | Final action | Starts as |
|---|---|---|---|---|
| CUI doesn't leave the tenant by sharing | SharePoint, OneDrive | Any CUI sublabel; access scope outside the organization | Block for external users, policy tip, incident report | Simulation, then simulation with tips |
| CUI doesn't leave the tenant by email | Exchange | Any CUI sublabel; recipient outside the organization | Block, policy tip | Simulation, then simulation with tips |
| Taxpayer and other CUI Specified data doesn't reach removable media or paper | Endpoint (Windows) | A CUI Specified sublabel | Block; audit event; alert | Audit only on devices |
| Unlabeled files holding Social Security numbers are found and labeled, not just blocked | SharePoint, OneDrive, Exchange | U.S. SSN sensitive information type, high confidence | Auto-label ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md)); DLP block with override while the label catches up | Simulation |
| Bulk movement of CUI is seen within the hour | SharePoint, endpoint | Volume of matches by one user in a window | Alert to the security monitor | Simulation |

: Outcome statements become DLP rules (program design; the baseline set is Book 12, Chapter 09) {.striped .hover}

**Authority:** Risk-based recommended (the program's position: a DLP rule that can't be traced to an owner's outcome is a rule nobody can tune or defend). Microsoft-recommended for the staging itself: Microsoft's DLP planning guidance moves a policy through simulation without policy tips, simulation with policy tips, and full enforcement, in that order.[^c08-plan]
**Applies:** All tenants. Teams and device locations are License-dependent (below).

Two design rules keep the set manageable:

- **Label first, content second.** A rule that matches a sensitivity label acts on a decision someone already made and an auditor can trace. A rule that matches content directly (a Social Security number pattern, for example) is a safety net for content nobody labeled, and it produces most of the false positives. The program prefers label conditions and treats content conditions as the trigger for auto-labeling in [Chapter 09](09-auto-labeling-and-sensitive-information-types.md).
- **One outcome, one owner.** A policy that serves three owners can't be tuned without a meeting. Separate policies per outcome cost little and make the rollback in [Rollback](#rollback) a single command.

## Simulation is the pilot

DLP simulation mode runs a policy as if it were enforced, without enforcing it, and reports its matches on a separate dashboard so its results don't mix with policies already enforcing.[^c08-sim] It replaced the older **Test** and **Test with policy tips** states in the portal; in PowerShell the same states are the `-Mode` values `TestWithoutNotifications` (no actions, no notifications) and `TestWithNotifications` (no actions, notifications sent), with `Enable` for enforcement and `Disable` to turn the policy off.[^c08-policy]

Four facts about simulation decide how long a pilot runs and what it proves:

- **A simulation runs for up to 15 days**, so its result isn't a point-in-time snapshot.[^c08-sim]
- **SharePoint and OneDrive are evaluated in full**: existing items as well as new and changed ones. **Exchange, Teams and devices are evaluated only for new items** during the simulation.[^c08-sim] A mail or Teams policy therefore needs to run across a normal business cycle (a pay period, a month-end close) before its numbers mean anything; a SharePoint policy shows its reach in days.
- **Simulation data is kept for 30 days.**[^c08-sim] Export the matched-item list before it ages out; it is the pilot's evidence.
- **Simulation policy tips count.** Only the policy tip from the most restrictive, highest-priority matching rule is shown, and that includes policies in simulation mode.[^c08-tips] A simulation with tips can therefore change what users see from an enforcing policy; check the priority order before turning tips on.

Microsoft's own example of tuning shows the pattern the program follows for changes as well as new policies: copy the production policy, make the change in the copy, run the copy in simulation, and switch from the old policy to the new one only when the copy behaves.[^c08-sim] The program names copies with a version suffix (`FMP-DLP-CUI-ExternalShare-v2`) so the export shows which version enforces.

## Policy tips, overrides and justification

A policy tip tells the user, in the app, that the content conflicts with a policy, and it can let the user override the rule, optionally with a business justification or by reporting a false positive. Every override and every false-positive report is logged and appears in DLP reporting.[^c08-tips] For mail, the justification travels in a message header (`msip_justification`), whose values are stored in a fixed order and whose free text is limited to 500 characters, so an automated process can read it.[^c08-ref]

Overrides are configured per rule and override all of the rule's actions; overriding the most restrictive matching rule also overrides the other rules the content matched.[^c08-tips] In PowerShell, `-NotifyAllowOverride` takes `WithoutJustification`, `WithJustification` or `FalsePositive`, and Microsoft notes that the override option appears only when the rule also sets `-BlockAccess $true` with an appropriate `-BlockAccessScope`.[^c08-tips]

The program's position on overrides:

| Data | Override | Why |
|---|---|---|
| CUI Specified, any surface | None | The authority behind the category sets the handling rule; a user can't waive it |
| CUI Basic, external send or share | With justification, during the first enforcement ring only; then none | Justifications from the first ring show the legitimate external flows the approved partner path ([Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md)) has to carry |
| Content-only matches (no label), internal | With justification or false positive | The rule is a safety net; the user may know the content better than the pattern does |

**Authority:** Risk-based recommended (the program's position). Microsoft documents the mechanisms and gives a comparable example: a rule that lets internal sharing of personal data proceed with a business justification and a rule that allows no override for external sharing.[^c08-tips]
**Applies:** All tenants with DLP. Endpoint override text is a global setting ([Endpoint DLP on Windows](#endpoint-dlp-on-windows)).

An override is not a failure of the control. It is the control working as designed, with a record. The failure is an override nobody reads. The weekly review in [Day-two ownership](#day-two-ownership) reads every override and false-positive report, and repeated overrides by one user feed the detection in [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) (FMP-DET-06) and, where licensed, Insider Risk Management ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)).

## False positives and tuning

A false positive is a match on content that isn't what the rule meant. Each one costs a user's time and some of the workforce's trust in the program. The tuning loop:

1. **Collect.** False-positive reports from policy tips, the simulation matched-item list and DLP alerts the security monitor dismisses.
2. **Classify the cause.** A pattern too broad (a nine-digit number that isn't a Social Security number), a confidence level too low, a count threshold too low, a label applied wrongly, or a legitimate flow the outcome statement didn't anticipate.
3. **Fix at the right layer.** Pattern and confidence problems are fixed in the sensitive information type or the rule's confidence and count ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md#confidence-count-and-proximity)). Wrong labels are fixed in labeling. A legitimate flow is an outcome change, which goes back to the policy owner, not an exception the operator grants.
4. **Re-simulate.** Copy, change, simulate, compare, switch ([Simulation is the pilot](#simulation-is-the-pilot)).

The program treats a rule as ready for the next ring when the false-positive rate in its matched items is low enough that the policy owner accepts the user impact, and records that number in the ring's exit criteria. The number is the policy owner's decision, not a Microsoft threshold.

## Exceptions without holes

There are two kinds of DLP exception, and they belong in different places.

- **Scope exceptions** take a population or location out of a policy: `-ExchangeSenderMemberOfException`, `-ExceptIfOneDriveSharedByMemberOf`, `-SharePointLocationException`, `-TeamsLocationException` or `-EndpointDlpLocationException`.[^c08-policy] A policy can't specify inclusions and exclusions for the same location in the same policy, and the Exchange and OneDrive group parameters don't accept Microsoft 365 Groups.[^c08-policy]
- **Condition exceptions** take content or a context out of one rule: the `ExceptIf*` parameters of `New-DlpComplianceRule`, such as `-ExceptIfRecipientDomainIs` for a partner domain the agency has an agreement with.[^c08-rule]

The program's rules for both:

- **Group-based, never named users.** An exception names a mail-enabled security group whose membership the identity lifecycle maintains ([Book 03](../b03-hr-identity/index.md)), so a person who changes jobs leaves the exception automatically.
- **Registered and expiring.** Every exception has a row in the exception register with the outcome it departs from, the policy owner's approval, the compensating control and an expiry no later than one year out ([Chapter 12](12-operations-and-evidence.md#evidence-catalog)). An exception without a row is drift.
- **Domain exceptions are agreements, not conveniences.** `-ExceptIfRecipientDomainIs` lets labeled content reach that domain unblocked, so it is granted only for a partner with an interconnection or data-sharing agreement on file.

## Endpoint DLP on Windows

Endpoint DLP extends DLP to sensitive items on devices: copies to removable media and network shares, printing, uploads to cloud services, copy and paste, and similar actions. For this program it covers Windows 10 and Windows 11 devices and Windows Server 2019 and later; other device platforms are out of the program's scope.

Onboarding is shared with Microsoft Defender for Endpoint. A device already onboarded to Defender for Endpoint appears in the Purview device list and needs no further step, and onboarding a device in Purview also onboards it to Defender for Endpoint.[^c08-onboard] Microsoft names Intune as the preferred onboarding method, followed by Configuration Manager, another MDM tool, a local script, a VDI package and Group Policy.[^c08-zt-intune] Two server details matter. Endpoint DLP isn't enabled for Windows servers when they're first onboarded; it has to be turned on for onboarded servers before server events appear in Activity explorer. And installing the supported Windows Server updates turns off classification on the server, so files on a server are protected only if they were classified before; Microsoft directs the Defender version that keeps that protection.[^c08-onboard]

The business-justification options an endpoint user sees are a global endpoint DLP setting: default options and a free-text box, default options only, or free text only, with up to five customizable options, one of which can be the false-positive option.[^c08-endpoint-settings] The program uses default options plus free text, and customizes the false-positive option to name the help-desk route.

Endpoint actions start at **Allow** (audit only, no user notification), which exists only for the devices location, then **Audit only** with notifications, then **Block with override**, then **Block**.[^c08-deploy] The ring plan in [How: endpoint DLP on Windows devices](#how-endpoint-dlp-on-windows-devices) follows that ladder.

## DLP incidents: from alert to handled

When a rule matches, it can send an alert, with the matched item, the content that matched and the user, to the DLP **Alerts** dashboard and to the Microsoft Defender XDR portal.[^c08-ref] An alert is the start of an incident record, not the end of one. The program's handling:

| Step | Who | What |
|---|---|---|
| Triage | Security monitor | Confirm the match in the alert; check whether the user overrode, and whether the content was labeled. Close as false positive (feeds [tuning](#false-positives-and-tuning)) or open an incident |
| Contain | Security monitor, with the platform owner | Revoke sharing links, recall or quarantine where the surface allows, remove access; for a device, isolate through Defender for Endpoint ([Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md)) |
| Assess | Policy owner; privacy officer when personal data is involved | Decide whether the event is a breach or an incident under the agency's incident and breach procedures ([Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md)) |
| Support | Help desk | Answer the user's "why was I blocked" call with the approved script, never by removing the label or the rule ([Book 15](../b15-day2-operations/index.md)) |
| Close | Security monitor | Record outcome, root cause and any tuning change; link the incident to the alert and the audit record |

Microsoft notes that DLP feeds incident information to Insider Risk Management, and that the incident report severity must be **High** for that signal to reach it.[^c08-ref] The program sets High on the CUI rules so that, where Insider Risk Management is licensed, its data-leak policies see them ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)).

## How: workload DLP from simulation to enforcement

This procedure takes one outcome from the register through simulation to enforcement in Exchange, SharePoint, OneDrive and Teams. It uses Security & Compliance PowerShell. Placeholders are explained once: `<admin-upn>` is the operator's account; `<policy-name>` follows `FMP-DLP-<outcome>-v<n>`; `<pilot-group>@contoso.example` and `<dlp-exceptions>@contoso.example` are mail-enabled security groups; `<secops-mailbox>@contoso.example` is the security monitor's alert mailbox; `<label-name>` is a published sensitivity label's name.

### Prerequisites

- **Roles.** The operator holds a Purview role that can manage DLP policies (Compliance Administrator, Compliance Data Administrator or a custom role with DLP Compliance Management), activated through PIM ([Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md)).
- **Auditing on.** DLP events reach Activity explorer and the audit log only while unified audit log ingestion is on ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md#how-turn-on-retain-and-test-purview-audit)).
- **Labels published** to the users in scope ([Chapter 03](03-label-publication-and-defaults.md)).
- **Licensing (License-dependent).** DLP for Exchange, SharePoint and OneDrive is in a broader set of plans than DLP for Teams and devices; Microsoft's trial guidance lists Teams and device coverage among the capabilities a trial adds, and states that when a trial ends existing policies stay on but Teams and Devices locations can't be added or edited.[^c08-trial] Confirm each location against the Purview service description before scoping it.[^c08-licensing] An unlicensed location is a licensing decision recorded in the decision record, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

| Feature | Commercial | GCC | Source |
|---|---|---|---|
| DLP for files (SharePoint, OneDrive) and email | Available | Available | Learn GCC Purview page[^c08-gcc] |
| DLP for Teams chat and channel messages | Available | Available | Same |
| Endpoint DLP | Available | Available | Same |
| DLP alerts dashboard; data in Activity explorer | Available | Available | Same |
| Defender for Cloud Apps integration | Available | Available | Same |
| On-premises scanner (DLP) | Available | Available | Same |
| DLP simulation mode (dashboard experience) | Available | Not yet specified | Learn, simulation mode[^c08-sim]; the GCC page doesn't list it separately |

: GCC availability for workload DLP (read Nov 11, 2026; Microsoft states the GCC status is subject to change) {.striped .hover}

Connect (checked against Learn on Nov 11, 2026; run against a test tenant first):[^c08-connect]

```powershell
# Commercial and GCC
Connect-IPPSSession -UserPrincipalName <admin-upn>
```

### Pilot

The pilot is the simulation itself, run first against the pilot group's mail and Teams and against the sites the pilot group owns, then against everyone. Success criteria, set by the policy owner before the run: the matched items are the content the outcome statement means; the false-positive rate is at or below the owner's number; no legitimate business flow appears that the outcome doesn't account for.

### Report-only or audit phase

Create the policy in simulation without notifications, scoped to the pilot group. The rule carries the outcome statement in `-Comment`. This example is the CUI external-email outcome; the label group syntax is the one [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) documents.

```powershell
$cui = @(@{
  operator = 'And'
  groups   = @(@{
    operator = 'Or'; name = 'CUI labels'
    labels   = @(@{ name = '<label-name>'; type = 'Sensitivity' })
  })
})

New-DlpCompliancePolicy -Name 'FMP-DLP-CUI-ExternalEmail-v1' `
  -Comment 'Outcome: CUI is not sent outside the tenant except through the approved partner path.' `
  -ExchangeLocation All -ExchangeSenderMemberOf '<pilot-group>@contoso.example' `
  -Mode TestWithoutNotifications

New-DlpComplianceRule -Policy 'FMP-DLP-CUI-ExternalEmail-v1' -Name 'Block external send of CUI' `
  -ContentContainsSensitiveInformation $cui -AccessScope NotInOrganization `
  -BlockAccess $true -NotifyUser Owner `
  -NotifyPolicyTipCustomText 'This message is labeled CUI and can''t be sent outside the agency. Use the approved partner path.' `
  -GenerateIncidentReport '<secops-mailbox>@contoso.example' -ReportSeverityLevel High
```

Run it for at least a full business cycle (simulation evaluates new mail only). Then switch to simulation with tips, and ask the pilot group to report false positives:

```powershell
Set-DlpCompliancePolicy -Identity 'FMP-DLP-CUI-ExternalEmail-v1' -Mode TestWithNotifications
```

Export the matched items from the simulation dashboard before the 30-day retention ends, and file them with the pilot's test record.

### Enforcement

Widen the scope ring by ring while the ring policy is scoped by group, then create the production policy without a sender scope and retire the ring policy. This is the copy-and-switch pattern from [Simulation is the pilot](#simulation-is-the-pilot), and it leaves both versions in the export.

```powershell
# Ring 2: point the ring policy at the early-adopter group and enforce for that ring
Set-DlpCompliancePolicy -Identity 'FMP-DLP-CUI-ExternalEmail-v1' `
  -ExchangeSenderMemberOf '<early-adopters>@contoso.example' -Mode Enable

# Ring 3: everyone in scope. Create the production version with no sender scope...
New-DlpCompliancePolicy -Name 'FMP-DLP-CUI-ExternalEmail-v2' `
  -Comment 'Outcome: CUI is not sent outside the tenant except through the approved partner path.' `
  -ExchangeLocation All -Mode Enable
New-DlpComplianceRule -Policy 'FMP-DLP-CUI-ExternalEmail-v2' -Name 'Block external send of CUI v2' `
  -ContentContainsSensitiveInformation $cui -AccessScope NotInOrganization `
  -BlockAccess $true -NotifyUser Owner `
  -NotifyPolicyTipCustomText 'This message is labeled CUI and can''t be sent outside the agency. Use the approved partner path.' `
  -GenerateIncidentReport '<secops-mailbox>@contoso.example' -ReportSeverityLevel High

# ...then turn the ring version off
Set-DlpCompliancePolicy -Identity 'FMP-DLP-CUI-ExternalEmail-v1' -Mode Disable
```

During the first enforcement ring the CUI Basic rule allows override with justification, per the program's [override position](#policy-tips-overrides-and-justification); remove it when the ring exits:

```powershell
# Ring 2 (the ring policy): allow override with justification
Set-DlpComplianceRule -Identity 'Block external send of CUI' -NotifyAllowOverride WithJustification
```

The production rule (`v2`) is created without `-NotifyAllowOverride`, so no override is offered in ring 3.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The implementing team's mailboxes and sites, simulation | Policy matches the test messages and files; nothing else |
| 1 | Pilot group, simulation then simulation with tips | False-positive rate at or below the policy owner's number; no unaccounted business flow |
| 2 | Early adopters, enforcing with override and justification | Justifications reviewed; help-desk call volume within the agreed level |
| 3 | Everyone in scope, enforcing, no override for CUI | Post-change validation passes; the weekly review shows no new class of false positive |

- **Emergency access:** DLP doesn't block sign-in, so emergency access accounts need no exclusion; they stay in scope like any mailbox.
- **Change window:** Business hours, with the help desk briefed and the security monitor on hand; approved through the agency's change process (CM-3).
- **Backout triggers:** Help-desk calls about the policy above the agreed level in a day; a mission-critical external flow blocked with no approved path; an alert volume the security monitor can't triage.
- **Post-change validation:** Send a labeled test message to an external test mailbox from a ring member and confirm the block, the policy tip and the alert.

### Rollback

Return the policy to simulation (keeps the evidence and the scope; stops blocking) or turn it off. Either takes one command, run by the operator or the platform owner:

```powershell
# <policy-name> is the enforcing version, for example FMP-DLP-CUI-ExternalEmail-v2
Set-DlpCompliancePolicy -Identity '<policy-name>' -Mode TestWithNotifications
# or, to stop evaluation entirely
Set-DlpCompliancePolicy -Identity '<policy-name>' -Mode Disable
```

For a tuned replacement, switch back to the previous version and disable the new one. Record the rollback, its trigger and the time in the change record.

### Exclusions

Scope exceptions use a mail-enabled security group, never named users:

```powershell
Set-DlpCompliancePolicy -Identity '<policy-name>' `
  -ExchangeSenderMemberOfException '<dlp-exceptions>@contoso.example'
```

A partner domain with an agreement on file is a rule-level exception:

```powershell
Set-DlpComplianceRule -Identity 'Block external send of CUI v2' -ExceptIfRecipientDomainIs 'partner.example'
```

Each exception has an exception-register row: outcome departed from, approver, compensating control and expiry.

### Telemetry

- **DLP alerts** in the Purview DLP alerts dashboard and Microsoft Defender XDR.[^c08-ref]
- **Activity explorer** for matches, overrides and false-positive reports.
- **Audit records** with record types `ComplianceDLPExchange`, `ComplianceDLPSharePoint` and `DLPEndpoint`,[^c08-audit-types] routed to the agency's SIEM ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)).

```powershell
# Exchange Online PowerShell: the last day's Exchange DLP matches
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) -RecordType ComplianceDLPExchange -ResultSize 5000 |
  Select-Object CreationDate,UserIds,Operations,AuditData | Export-Csv .\dlp-exchange-last-day.csv -NoTypeInformation
```

### Evidence

**Evidence checklist**

- [ ] **Configuration:** `Get-DlpCompliancePolicy | Format-List Name,Mode,ExchangeLocation,SharePointLocation,OneDriveLocation,TeamsLocation,Comment` and `Get-DlpComplianceRule | Format-List Name,Policy,ContentContainsSensitiveInformation,BlockAccess,NotifyAllowOverride,ReportSeverityLevel`, exported to the evidence store after each ring
- [ ] **Operational:** the weekly DLP alert, override and false-positive summary; DLP audit records retained per [Chapter 10](10-audit-insider-risk-and-communication-compliance.md)
- [ ] **Test:** per surface, the test message or file, the expected and observed outcome (blocked, tip shown, alert raised), date and tester, and the audit record it produced
- [ ] **Exception:** the exception register rows for this policy, with approver and expiry
- [ ] **Assessor-ready artifact:** the outcome statement, the simulation export, the enforcing export and the test record, filed together under the control IDs in [Appendix A](appendix-a-requirements-mapping.md)

### Day-two ownership

Policy owner: the outcome statements and every change to them. Platform owner: the policy set, its versions and the drift check (export compared with the approved baseline, [Book 13](../b13-governance/index.md)). Operator: ring changes and exceptions as approved. Security monitor: alert triage, the weekly override and false-positive review, and FMP-DET-06. Help desk: the "why was I blocked" script and routing a false-positive report to the operator ([Book 15](../b15-day2-operations/index.md)). Assessor: samples alerts and exceptions at each assessment. Cadence: weekly review, quarterly outcome review with the policy owner, annual exception recertification. Roles are set out in [Chapter 12](12-operations-and-evidence.md#raci). Drift looks like a policy in `Disable` that should enforce, a mode change outside a change record, or an exception without a register row.

## How: endpoint DLP on Windows devices

This procedure turns endpoint DLP on for onboarded Windows devices and takes the CUI Specified device rule from audit to block. Placeholders as above; `<device-pilot-group>@contoso.example` holds the pilot users (endpoint policies are scoped to users signed in to onboarded devices).[^c08-policy]

### Prerequisites {#b20-08-prerequisites-endpoint}

- **Devices onboarded** to Defender for Endpoint (and so to Purview) through Intune, the method Microsoft prefers; onboarding coverage reported by device group ([Book 05](../b05-devices/index.md)).[^c08-zt-intune]
- **Servers:** endpoint DLP support for onboarded servers turned on in endpoint DLP settings, where servers are in scope.[^c08-onboard]
- **Roles:** the `-EndpointDlpLocation` parameter requires membership in the Compliance Administrator or Compliance Data Administrator role in Microsoft Entra ID.[^c08-policy]
- **Licensing (License-dependent):** endpoint DLP is included in Microsoft 365 E5/A5/G5, the Microsoft Purview Suite and the E5/A5/F5/G5 Information Protection & Governance plans, per the Purview service description.[^c08-licensing]
- **GCC:** endpoint DLP is listed as Available in GCC.[^c08-gcc]

### Pilot {#b20-08-pilot-endpoint}

Pilot users on a small set of managed Windows devices, including one device of each build in use and, where servers are in scope, one test server. Success: the expected device events appear in Activity explorer for each restricted action, and no line-of-business application breaks.

### Report-only or audit phase {#b20-08-audit-endpoint}

```powershell
$cuiSpecified = @(@{
  operator = 'And'
  groups   = @(@{ operator = 'Or'; name = 'CUI Specified'
                  labels = @(@{ name = '<cui-specified-label>'; type = 'Sensitivity' }) })
})

New-DlpCompliancePolicy -Name 'FMP-DLP-Endpoint-CUI-SP-v1' `
  -Comment 'Outcome: CUI Specified does not reach removable media or paper.' `
  -EndpointDlpLocation '<device-pilot-group>@contoso.example' -Mode Enable

New-DlpComplianceRule -Policy 'FMP-DLP-Endpoint-CUI-SP-v1' -Name 'Audit CUI Specified on devices' `
  -ContentContainsSensitiveInformation $cuiSpecified `
  -EndpointDlpRestrictions @(
    @{ Setting = 'Print';          Value = 'Audit' },
    @{ Setting = 'RemovableMedia'; Value = 'Audit' },
    @{ Setting = 'NetworkShare';   Value = 'Audit' }
  ) -ReportSeverityLevel High -GenerateAlert '<secops-mailbox>@contoso.example'
```

The policy is enabled but the rule's restrictions are `Audit`, so nothing is blocked: this is the endpoint equivalent of report-only. Run it for two weeks and read the device events in Activity explorer.

### Enforcement {#b20-08-enforcement-endpoint}

```powershell
Set-DlpComplianceRule -Identity 'Audit CUI Specified on devices' `
  -EndpointDlpRestrictions @(
    @{ Setting = 'Print';          Value = 'Block' },
    @{ Setting = 'RemovableMedia'; Value = 'Block' },
    @{ Setting = 'NetworkShare';   Value = 'Audit' }
  ) -NotifyUser Owner
```

`Block` and `Warn` need `-NotifyUser`, as [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) notes. Widen `-EndpointDlpLocation` ring by ring as in the workload procedure.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Implementing team's devices, audit | Each restricted action produces its device event |
| 1 | Device pilot group, audit then block | No line-of-business break; justification text understood by users |
| 2 | One business unit, block | Help-desk volume within the agreed level |
| 3 | All users in scope, block | Post-change validation passes on each device build |

- **Emergency access:** Not applicable: endpoint DLP doesn't affect sign-in.
- **Change window:** Business hours with desk-side support available.
- **Backout triggers:** A blocked print or copy that stops a mission process with no approved alternative; device events failing to arrive.
- **Post-change validation:** On a ring device, copy a CUI Specified test file to removable media and print it; confirm both are blocked and the events appear.

### Rollback {#b20-08-rollback-endpoint}

Set the restrictions back to `Audit` with the same `Set-DlpComplianceRule` command as the audit phase, or `Set-DlpCompliancePolicy -Identity 'FMP-DLP-Endpoint-CUI-SP-v1' -Mode Disable`. Device policy changes reach devices on the service's schedule; record the time of the command and the time the first device shows the old behavior.

### Exclusions {#b20-08-exclusions-endpoint}

`-EndpointDlpLocationException '<dlp-exceptions>@contoso.example'` for users with an approved need (for example, a records unit that prints CUI Specified for a court), each with an exception-register row. Device-level allowances (approved USB devices, approved printers) are endpoint DLP settings groups, owned by the platform owner and listed in the register.

### Telemetry {#b20-08-telemetry-endpoint}

Device events in Activity explorer and audit record type `DLPEndpoint`, forwarded to the SIEM; Defender for Endpoint device health for onboarding coverage ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)).

### Evidence {#b20-08-evidence-endpoint}

**Evidence checklist**

- [ ] **Configuration:** the policy and rule exports, and the endpoint DLP settings (server support, justification options, device groups)
- [ ] **Operational:** device-event volume by action and ring; onboarding coverage report
- [ ] **Test:** per device build, the print and removable-media test with expected and observed outcome, date and tester, and the `DLPEndpoint` record
- [ ] **Exception:** register rows for user and device exceptions
- [ ] **Assessor-ready artifact:** the package above, filed under the control IDs in [Appendix A](appendix-a-requirements-mapping.md)

### Day-two ownership {#b20-08-day-two-endpoint}

As for workload DLP, with Book 05's device owner for onboarding coverage. A device that drops out of onboarding drops out of endpoint DLP silently, so the platform owner reviews onboarding coverage monthly ([Chapter 12](12-operations-and-evidence.md#metrics)).

## Requirements this chapter supports

| Requirement | What this chapter contributes |
|---|---|
| NIST SP 800-53 Rev. 5 AC-4 (Information Flow Enforcement) | Rules that enforce where labeled data may flow, by surface |
| NIST SP 800-53 Rev. 5 SI-4 (System Monitoring) | DLP alerts and device events routed to the security monitor |
| NIST SP 800-53 Rev. 5 MP-7 (Media Use) | Removable-media restriction for CUI Specified on Windows devices |
| NIST SP 800-53 Rev. 5 CM-3 (Configuration Change Control) | Versioned policies, ring changes and rollback in change records |
| CISA Zero Trust Maturity Model, Data pillar | Data access and data loss controls driven by categorization |

: Requirements this chapter supports (the full mapping, with FedRAMP 20x KSIs, is [Appendix A](appendix-a-requirements-mapping.md)) {.striped .hover}

These rows say what the chapter contributes. The agency still sets each control's parameters, policy and procedures, and the assessor decides whether each is satisfied.[^c08-53] <!-- claims-ok: states that the assessor decides -->

## Key takeaways

- Write every DLP policy from an owner's outcome statement and keep that statement in the rule's comment, so the export explains itself.
- Simulation is the pilot: it runs up to 15 days, evaluates existing SharePoint and OneDrive content but only new mail, Teams and device activity, and keeps its data for 30 days.
- Overrides and false-positive reports are tuning data; an override nobody reviews is the real gap.
- Exceptions are group-based, registered and expiring; a legitimate flow the outcome didn't foresee goes back to the policy owner.
- Endpoint DLP rides on Defender for Endpoint onboarding; coverage is a monthly metric, and servers need endpoint DLP turned on explicitly.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — SharePoint and OneDrive](07-sharepoint-and-onedrive.md) · [Book index](index.md) · [Next: Chapter 09 — Auto-Labeling and Sensitive Information Types →](09-auto-labeling-and-sensitive-information-types.md)
:::

[^c08-plan]: Microsoft Learn, "Plan for data loss prevention (DLP)," section "Overview of planning process" (simulation without policy tips, simulation with notifications and policy tips, then full enforcement), <https://learn.microsoft.com/purview/dlp-overview-plan-for-dlp> (accessed Nov 11, 2026).
[^c08-sim]: Microsoft Learn, "Learn about data loss prevention simulation mode" (simulation runs as if enforced without enforcement, separate dashboard; up to 15 days; SharePoint and OneDrive existing and new items, Exchange, Teams and devices new items only; data kept 30 days; copy-and-tune example), <https://learn.microsoft.com/purview/dlp-simulation-mode-learn> (accessed Nov 11, 2026).
[^c08-policy]: Microsoft Learn, "New-DlpCompliancePolicy," parameters `Mode` (Enable, Disable, TestWithNotifications, TestWithoutNotifications), `ExchangeLocation`, `ExchangeSenderMemberOfException`, `OneDriveLocation`, `EndpointDlpLocation` (requires Compliance Administrator or Compliance Data Administrator in Microsoft Entra ID; users signed in to onboarded devices) and the rule that inclusions and exclusions can't be combined in one policy, <https://learn.microsoft.com/powershell/module/exchangepowershell/new-dlpcompliancepolicy> (accessed Nov 11, 2026).
[^c08-tips]: Microsoft Learn, "Send email notifications and show policy tips for DLP policies," section "Options for configuring policy tips" (override with business justification or false-positive report, logged for reporting; override is per rule; only the most restrictive, highest-priority rule's tip is shown, including simulation-mode policies; `NotifyAllowOverride` needs `BlockAccess` and `BlockAccessScope`), <https://learn.microsoft.com/purview/dlp-use-notifications-and-policy-tips> (accessed Nov 11, 2026).
[^c08-ref]: Microsoft Learn, "Data Loss Prevention policy reference," sections "Business justification X-header" (`msip_justification` order, 500-character free text) and "Incident reports" (alerts to the DLP Alerts dashboard and Defender XDR; incident severity High to feed Insider Risk Management), <https://learn.microsoft.com/purview/dlp-policy-reference> (accessed Nov 11, 2026).
[^c08-rule]: Microsoft Learn, "New-DlpComplianceRule," syntax (`ExceptIfRecipientDomainIs`, `NotifyAllowOverride`, `BlockAccessScope`, `EndpointDlpRestrictions`, `ReportSeverityLevel`), <https://learn.microsoft.com/powershell/module/exchangepowershell/new-dlpcompliancerule> (accessed Nov 11, 2026).
[^c08-onboard]: Microsoft Learn, "Onboard Windows devices into Microsoft 365 overview" (Windows 10 and 11 onboarding; Windows Server 2019 and later; endpoint DLP not enabled for servers until turned on; classification disabled by supported server updates; onboarding shared with Defender for Endpoint), <https://learn.microsoft.com/purview/device-onboarding-overview> (accessed Nov 11, 2026).
[^c08-zt-intune]: Microsoft Learn, "Manage devices with Intune Overview," section "Enrolling devices vs. onboarding devices" (Intune preferred for onboarding; other methods in recommended order), <https://learn.microsoft.com/security/zero-trust/manage-devices-with-intune-overview> (accessed Nov 11, 2026).
[^c08-endpoint-settings]: Microsoft Learn, "Configure endpoint data loss prevention settings," section "Business justification in policy tips" (global setting; three display options; up to five customized options including the false-positive option), <https://learn.microsoft.com/purview/dlp-configure-endpoint-settings> (accessed Nov 11, 2026).
[^c08-deploy]: Microsoft Learn, "Create and deploy data loss prevention policies," section "Policy actions" (Allow for devices only; Audit only; Block with override; Block), <https://learn.microsoft.com/purview/dlp-create-deploy-policy> (accessed Nov 11, 2026).
[^c08-trial]: Microsoft Learn, "Learn about the Microsoft Purview Suite trial," section "Data Loss Prevention" (trial extends DLP to Teams and devices; after the trial, Teams and Devices locations can't be edited or added), <https://learn.microsoft.com/purview/purview-trial> (accessed Nov 11, 2026).
[^c08-licensing]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Data Loss Prevention Endpoint Data Loss Protection (DLP)" (included plans), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c08-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (Data Loss Prevention rows; status subject to change), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c08-connect]: Microsoft Learn, "Connect to Security & Compliance PowerShell," Step 2 (connecting in Microsoft 365 and GCC), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 11, 2026).
[^c08-audit-types]: Microsoft Learn, "Microsoft services that support auditing" (DLP record types ComplianceDLPSharePoint, ComplianceDLPExchange, DLPEndpoint), <https://learn.microsoft.com/purview/audit-supported-services> (accessed Nov 11, 2026).
[^c08-53]: NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls AC-4, SI-4, MP-7 and CM-3, checked against the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026).
