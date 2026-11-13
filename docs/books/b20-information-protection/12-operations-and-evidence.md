---
title: "Chapter 12 — Operations and Evidence"
description: "Who runs information protection after it is built, and how the agency proves it keeps working: change control for labels, policies and keys with a dated configuration export; drift detection against that baseline; incident response for data events; reassessment on the closure chain; the assessor artifacts; and four of the book's required artifacts: the implementation checklist for every control in Chapters 03 to 11, the RACI separating policy owner, platform owner, operator, security monitor, help desk and assessor, the evidence catalog, and metrics that measure protected coverage and control effectiveness rather than configuration presence."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: Who
series-order: 12
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 12 — Operations and Evidence

*A label policy that nobody owns is configured on the day it ships and wrong a year later; information protection is an operation with an owner, a cadence and proof, not a project with an end date.*

::: {.callout-note}
## In this chapter
How the agency keeps Book 20's controls working after they are built. Change control for labels, label policies, DLP, auto-labeling, encryption and AI policies, with a dated configuration export that becomes the baseline. Drift detection against that baseline. Incident response for data events, from a DLP alert to a mass label removal. Reassessment on the closure chain, and the artifacts an assessor reads. Then four of the book's required artifacts: the implementation checklist for every control in Chapters 03 to 11, the RACI, the evidence catalog and the metrics.
:::

Chapters 03 to 11 each end with a day-two section that names an owner and a cadence for one control. This chapter puts them together. It doesn't restate how drift detection, change control or incident response work in general: [Book 13](../b13-governance/index.md) owns governance, drift and evidence; [Book 12](../b12-security-operations/index.md) owns telemetry and detection; [Book 15](../b15-day2-operations/index.md) owns the help desk; [Book 14](../b14-compliance/index.md) owns the authorization package; and [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md) owns the method for turning findings into a program. It gives each of them the Purview-specific piece they need.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data, with SecOps for monitoring and response
- **CISA ZTMM pillar:** Data; cross-cutting Visibility and Analytics, and Governance
- **Depends on:** every control in [Chapters 03](03-label-publication-and-defaults.md) to [11](11-ai-data-security.md); the evidence contract ([Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md)); the drift engine ([Book 13, Chapter 06](../b13-governance/06-the-drift-engine.md))
- **Attack chain interrupted:** Defense Evasion and Exfiltration: an attacker or insider who weakens a label, a DLP rule or an audit setting to move data out is seen as drift or as a data event, not discovered at the next audit
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [RACI](#raci) and the cadence in [Operating cadence](#operating-cadence) | The approved RACI and calendar |
| Configured | [The configuration baseline](#the-configuration-baseline) | The first dated export, committed |
| Enforced | Not applicable: this chapter operates the controls Chapters 03 to 11 enforce | — |
| Evidenced | [Drift detection](#drift-detection) and the synthetic tests in the [Metrics](#metrics) | Drift run results; the quarterly test records |
| Operated | The whole chapter | Review records, metrics history, incident records |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Change control for information protection

Purview configuration changes the agency's data, not only its settings. A label whose encryption rights change re-protects content as users next open it; an auto-labeling policy that goes from simulation to `Enable` stamps labels across sites; a DLP rule that goes to block stops mail. Each is a change under configuration change control, with the impact analysis SP 800-53 asks for before it is made ([Book 13, Chapter 04](../b13-governance/04-change-control-and-provenance.md) carries the process and its provenance).

Three rules are specific to Purview.

- **Every change has a ring and a way back.** The chapter that owns the control gives both. The [implementation checklist](#implementation-checklist) below is the one-page view.
- **Labels are never deleted to undo a change.** A label applied to content stays in the content's metadata. Rollback for a label is to unpublish it from a policy or change its settings, never to delete it, so content that carries it keeps a known meaning. [Chapter 02](02-sensitivity-label-architecture.md) and [Chapter 03](03-label-publication-and-defaults.md) give the label rules.
- **The decision record moves with the change.** A change to a label's rights, a DLP rule's scope or the list of labels excluded from Copilot is a change to a design decision; the decision record ([Chapter 01](01-data-inventory-and-classification.md#decision-record-template)) is updated in the same change.

**Authority:** Mandated in substance for systems under NIST SP 800-53 at Moderate: configuration change control (CM-3) and impact analysis (CM-4) are in the Moderate baseline; the Purview-specific rules above are Risk-based recommended (the program's position). This chapter supports those controls; the organization still sets their parameters, and the assessor decides whether each is satisfied.
**Applies:** all tenants.

## The configuration baseline

The baseline is a dated JSON export of every Purview setting the book's controls depend on, committed to the agency's configuration repository. The first export is the **Configured** evidence for the whole book; every later export is compared with it.

Placeholders: `<admin>@contoso.example` is the operator's account; `<repo>` is the local path of the configuration repository. Commands were checked against Learn on Nov 11, 2026; run them against a test tenant first.[^c12-get-label][^c12-get-autorule][^c12-aip]

```powershell
# Security & Compliance PowerShell. GCC: no extra parameters.
Connect-IPPSSession -UserPrincipalName <admin>@contoso.example

$stamp = Get-Date -Format "yyyy-MM-dd"
$out = "<repo>\purview-baseline\$stamp"
New-Item -ItemType Directory -Force -Path $out | Out-Null

Get-Label                    | ConvertTo-Json -Depth 10 | Out-File "$out\labels.json"         -Encoding utf8
Get-LabelPolicy              | ConvertTo-Json -Depth 10 | Out-File "$out\label-policies.json" -Encoding utf8
Get-AutoSensitivityLabelPolicy | ConvertTo-Json -Depth 10 | Out-File "$out\autolabel-policies.json" -Encoding utf8
Get-AutoSensitivityLabelRule | ConvertTo-Json -Depth 10 | Out-File "$out\autolabel-rules.json"  -Encoding utf8
Get-DlpCompliancePolicy      | ConvertTo-Json -Depth 10 | Out-File "$out\dlp-policies.json"   -Encoding utf8
Get-DlpComplianceRule        | ConvertTo-Json -Depth 10 | Out-File "$out\dlp-rules.json"      -Encoding utf8
Disconnect-ExchangeOnline -Confirm:$false
```

```powershell
# Exchange Online PowerShell: IRM and audit settings.
Connect-ExchangeOnline -UserPrincipalName <admin>@contoso.example
Get-IRMConfiguration   | ConvertTo-Json -Depth 5 | Out-File "$out\irm-configuration.json" -Encoding utf8
Get-AdminAuditLogConfig | Select-Object UnifiedAuditLogIngestionEnabled |
  ConvertTo-Json | Out-File "$out\audit-status.json" -Encoding utf8
Disconnect-ExchangeOnline -Confirm:$false
```

```powershell
# AIPService module: the Rights Management service configuration (Chapter 05).
Connect-AipService
Get-AipServiceConfiguration | ConvertTo-Json -Depth 5 | Out-File "$out\aipservice-configuration.json" -Encoding utf8
Disconnect-AipService
```

`Get-AipServiceConfiguration` returns the protection service's full configuration, including whether the super user feature is enabled and who the super users are, which can't be read from a portal.[^c12-aip] Run the export with a read-only role held through PIM ([Book 04](../b04-access/index.md)); for an unattended schedule, use app-only authentication with a certificate as Microsoft documents, and register that application as a workload identity with an owner.[^c12-app-only] Commit the folder with a message naming the change ticket.

The export holds tenant configuration, not content, but it names groups, label rights and super users. Keep it in a repository with the same access as the system security plan.

## Drift detection

Drift is any difference between today's export and the last approved one that no change ticket explains. [Book 13, Chapter 06](../b13-governance/06-the-drift-engine.md) runs the comparison and routes the result; Purview gives it these signals to watch first, because each one weakens protection quietly:

| Drift | Where it shows | Why it matters |
|---|---|---|
| A DLP or auto-labeling policy back in `TestWithNotifications`, `TestWithoutNotifications` or `Disable` | `dlp-policies.json`, `autolabel-policies.json` (`Mode`) | Enforcement silently off |
| A label's encryption rights widened, or `EncryptionEnabled` turned off | `labels.json` | Content re-protected more loosely as it is next opened |
| A label removed from a published policy, or a policy's scope narrowed | `label-policies.json` | Users can't apply it; defaults stop applying |
| Super user feature enabled or a super user added outside the recovery procedure | `aipservice-configuration.json` (`SuperUsersEnabled`, `SuperUsers`) | Standing ability to decrypt everything ([Chapter 05](05-rights-management-and-recovery.md)) |
| Unified audit ingestion off | `audit-status.json` | Every other Purview signal goes dark ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)) |
| A Copilot DLP policy out of `Enable`, or a label dropped from it | `dlp-policies.json`, `dlp-rules.json` | Labeled content back in Copilot responses ([Chapter 11](11-ai-data-security.md)) |

The audit log records changes to these settings as they happen, so a drift run is the backstop, not the first alarm: a change to audit ingestion is itself audited and searchable with `Search-UnifiedAuditLog -Operations Set-AdminAuditLogConfig`.[^c12-audit-on] [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) is where a detection for a policy-mode change belongs.

Drift goes to the platform owner to explain or reverse within one business day, and a drift that weakens a control on CUI goes to the authorizing official as a possible significant change, as [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain) sets out.

## Incident response for data events

A data event is a DLP alert, an insider risk alert, a communication compliance match, a mass label removal or decryption, or an unexplained super user decryption. The response ladder and playbooks are [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md)'s; the detections that start them include FMP-DET-05 (mass label removal or decryption) and FMP-DET-06 (DLP override pattern). Four things are specific to information protection.

- **Privacy before triage.** Insider risk and communication compliance cases are about people. Who may see user names and content is settled in [Chapter 10](10-audit-insider-risk-and-communication-compliance.md); the security monitor works pseudonymized cases until the escalation rule there allows otherwise.
- **The label is evidence.** A DLP alert records the label, the sensitive information types and the policy that matched. Keep the alert export with the incident record; it is what lets an investigator say what left, not only that something did.
- **Containment can be a label change.** Raising a document's label to one whose rights exclude the recipient, or revoking access, contains a disclosure of encrypted content after the fact; [Chapter 05](05-rights-management-and-recovery.md) and [Chapter 06](06-exchange-message-encryption.md) give what each protection allows.
- **A suspected CUI disclosure is reported, not only remediated.** The agency's CUI and incident reporting procedures decide who is told and when; the incident record shows that they were followed. [Book 14](../b14-compliance/index.md) carries the reporting controls.

The help desk ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md)) is often first to hear of a data event, as "I sent the wrong file" or "I can't open this attachment." Its script routes the first to security operations and the second to the label's owner, and never removes a label or decrypts a file to resolve a ticket.

## Reassessment and the assessor's package

Every Book 20 control enters the closure chain in [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain) as its own register entry: finding, attack path, owner, dependency, change, pilot, enforcement, test, evidence, residual risk and reassessment. Read Zero Trust Assessment and ScubaGear results on data controls with the normalized taxonomy ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)): a test skipped because the tenant doesn't hold the license for a Purview feature is a licensing decision, recorded with its compensating control in the decision record, not a failed control; and a feature Learn lists as "in development" or doesn't list for the agency's cloud is an environment fact, not a gap the agency can close. Weigh what remains by exploitability and blast radius, not pass rate ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#weigh-the-finding-not-the-pass-rate)).

Reassess on the [operating cadence](#operating-cadence), after any change that the drift run flags, and whenever Microsoft changes a feature's availability in the agency's cloud. A finding is ready for closure when every applicable control state has evidence in the [evidence catalog](#evidence-catalog); the authorizing official or assessor decides.

The assessor's package for the book is the evidence catalog's last column, assembled per [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md). The control crosswalk the package uses is [Book 14, Appendix A](../b14-compliance/appendix-a-control-crosswalk.md), and the book's own requirements mapping is [Appendix A](appendix-a-requirements-mapping.md). The package supports the controls it maps to; the organization still sets their parameters, and the assessor decides whether each is satisfied.

## Implementation checklist {#implementation-checklist}

One line per control, from the chapter that owns it. A box is ticked only with the evidence named in the [evidence catalog](#evidence-catalog). Pilot, enforcement and rollback follow each chapter's How section; exceptions go in the one exclusion register.

| # | Control (chapter) | Pilot | Enforcement | Rollback | Exception | Validation |
|---|---|---|---|---|---|---|
| 1 | Label taxonomy and publication ([03](03-label-publication-and-defaults.md)) | [ ] Label policy scoped to a pilot group | [ ] Policy widened to all users in rings | [ ] Remove the label from the policy or narrow its scope; never delete the label | [ ] Users outside the policy recorded with reason | [ ] Labeled sample file and email, with the label in the audit log |
| 2 | Default labels for files, email, meetings and containers ([03](03-label-publication-and-defaults.md)) | [ ] Defaults on for the pilot policy only | [ ] Defaults on in the production policy | [ ] Clear the default on the policy | [ ] Groups exempt from defaults, approved | [ ] New document, email and meeting carry the default |
| 3 | Container labels for Teams, groups and sites ([04](04-teams-groups-and-sharepoint-containers.md)) | [ ] Container labels on pilot teams and sites | [ ] Required for new sites; applied to existing CUI sites | [ ] Relabel the container; label settings unchanged | [ ] Sites without a label, with owner and date | [ ] Guest add and unmanaged-device access tested against the label |
| 4 | Rights Management activation and super user recovery ([05](05-rights-management-and-recovery.md)) | [ ] Super user procedure rehearsed in a test tenant | [ ] Super user feature off by default, enabled only through the PIM-gated procedure | [ ] Disable the super user feature; remove the super user | [ ] None standing | [ ] Quarterly decryption-recovery test passed |
| 5 | Message encryption and transport rules ([06](06-exchange-message-encryption.md)) | [ ] Rule scoped to a pilot sender group | [ ] Rule enforced for its scope | [ ] Disable the transport rule | [ ] Partner domains excluded, approved | [ ] Encrypted test message opened by an external test recipient; transport rule hit in the message trace |
| 6 | Labels in SharePoint and OneDrive, IRM migration, co-authoring ([07](07-sharepoint-and-onedrive.md)) | [ ] Pilot library migrated from IRM | [ ] Label integration on; IRM libraries retired | [ ] Per-library return to IRM until fixed | [ ] Libraries left on IRM, with date | [ ] Co-authoring an encrypted file; search finds labeled content |
| 7 | Workload and endpoint DLP ([08](08-dlp-and-endpoint-controls.md)) | [ ] Policies in simulation for the pilot | [ ] `Enable`, ring by ring | [ ] Back to `TestWithoutNotifications` | [ ] Rule exceptions with expiry | [ ] Synthetic sensitive content blocked on each surface; alert received |
| 8 | Auto-labeling and sensitive information types ([09](09-auto-labeling-and-sensitive-information-types.md)) | [ ] Simulation over pilot sites | [ ] `Enable` after false positives resolved | [ ] Back to simulation; relabel affected items | [ ] Sites excluded from auto-labeling | [ ] Simulation precision recorded; sample files labeled as designed |
| 9 | Audit, insider risk, communication compliance ([10](10-audit-insider-risk-and-communication-compliance.md)) | [ ] Policies scoped to a pilot, privacy review done | [ ] Policies on for their scope; audit retention set | [ ] Pause or narrow the policy | [ ] Users excluded with the privacy official's approval | [ ] Synthetic audit event found by search within the target time |
| 10 | AI data security ([11](11-ai-data-security.md)) | [ ] DSPM and Copilot DLP in simulation for the pilot | [ ] Copilot DLP `Enable`; AI-site DLP enforced | [ ] Back to `TestWithoutNotifications` | [ ] Approved AI sites and label exceptions | [ ] Labeled file cited but not summarized; AI-site paste blocked |
| 11 | Operations (this chapter) | [ ] First baseline export reviewed | [ ] Drift run scheduled | Not applicable | [ ] — | [ ] First drift run with no unexplained differences |

: Book 20 implementation checklist {.striped .hover}

## RACI {#raci}

The six roles are used by name in every chapter's day-two section.

- **Policy owner:** decides what the data is and how it must be handled: label meaning, who may hold CUI Specified, which AI apps are approved. Typically the CUI program manager, with the senior agency official for privacy for rules about personal data and the records officer for retention.
- **Platform owner:** the Microsoft 365 and Purview engineering lead, accountable for configuration and its baseline.
- **Operator:** the administrator who makes the change through change control.
- **Security monitor:** security operations ([Book 12, Chapter 10](../b12-security-operations/10-who-runs-security-operations.md)).
- **Help desk:** the service desk ([Book 15](../b15-day2-operations/index.md)).
- **Assessor:** the ISSO and the independent assessor ([Book 14, Chapter 10](../b14-compliance/10-who-owns-compliance.md)).

R is responsible (does the work), A accountable (one per row), C consulted, I informed.

| Activity | Policy owner | Platform owner | Operator | Security monitor | Help desk | Assessor |
|---|---|---|---|---|---|---|
| Classify data and set handling rules ([01](01-data-inventory-and-classification.md)) | A | C | I | C | I | C |
| Approve the decision record for each control | A | R | I | C | I | C |
| Design the label taxonomy and rights ([02](02-sensitivity-label-architecture.md)) | A | R | C | C | I | I |
| Publish labels and set defaults ([03](03-label-publication-and-defaults.md)) | C | A | R | I | I | I |
| Apply and govern container labels ([04](04-teams-groups-and-sharepoint-containers.md)) | C | A | R | I | C | I |
| Run super user recovery ([05](05-rights-management-and-recovery.md)) | A | R | C | I | I | I |
| Configure message encryption and transport rules ([06](06-exchange-message-encryption.md)) | C | A | R | I | C | I |
| Tune and enforce DLP and auto-labeling ([08](08-dlp-and-endpoint-controls.md), [09](09-auto-labeling-and-sensitive-information-types.md)) | C | A | R | C | C | I |
| Configure audit retention and routing ([10](10-audit-insider-risk-and-communication-compliance.md)) | I | A | R | C | I | C |
| Triage DLP, insider risk and AI alerts | I | C | I | A/R | I | I |
| Approve AI apps and Copilot label exclusions ([11](11-ai-data-security.md)) | A | R | C | C | I | I |
| Answer user questions on labels, encryption and blocks | I | C | I | I | A/R | I |
| Approve and review exceptions | A | R | I | C | I | C |
| Export the baseline and run drift detection | I | A | R | I | I | I |
| Run the quarterly synthetic tests | I | A | R | C | I | C |
| Assemble the assessor's package | C | R | I | C | I | A |
| Reassess and decide closure readiness | C | R | I | C | I | A |

: Book 20 RACI {.striped .hover}

The assessor is accountable for the package and for the readiness review, not for closure: closure is the authorizing official's decision, or the assessor's for an assessment finding. Super user recovery is accountable to the policy owner because every use of it reads content the policy owner governs; the platform owner runs it, and the security monitor is informed of every activation.

## Operating cadence {#operating-cadence}

| Cadence | Task | Owner |
|---|---|---|
| Daily | Triage DLP, insider risk, communication compliance and AI alerts | Security monitor |
| Weekly | Review DLP override and false-positive trends; review drift results | Platform owner |
| Monthly | Baseline export and drift run; data risk assessment review ([Chapter 11](11-ai-data-security.md)); metrics refresh | Platform owner |
| Quarterly | Synthetic tests (DLP block, encrypted mail, audit search, decryption recovery); exception review; approved AI app review | Platform owner, with the policy owner |
| Annually | Label taxonomy review against the CUI Registry and the agency's data classes; RACI review; full reassessment | Policy owner |

[Book 15, Chapter 12](../b15-day2-operations/12-the-day-two-runbook.md) holds the agency's day-two runbook; these rows go into it.

## Evidence catalog {#evidence-catalog}

Each control's evidence, by the five kinds in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#evidence-pattern) plus the reassessment record. **Kept** is where it lives; **Retain** is the program's retention for the evidence, set to outlast at least one authorization cycle, unless the agency's records schedule sets longer. Audit data itself is retained by Purview's own rules (below) and exported where the agency needs it longer.

| Control | Configuration | Test | Operational | Exception | Reassessment | Kept / Retain |
|---|---|---|---|---|---|---|
| Labels and policies ([02](02-sensitivity-label-architecture.md), [03](03-label-publication-and-defaults.md)) | `labels.json`, `label-policies.json` | Labeled sample file and email | Label activity in the activity explorer | Users outside the label policy | Annual taxonomy review | Config repository; evidence store / 3 years |
| Container labels ([04](04-teams-groups-and-sharepoint-containers.md)) | Container label settings in `labels.json`; site-label report | Guest add and unmanaged-device test | Sites created with and without labels | Unlabeled sites register | Quarterly site report | Config repository; evidence store / 3 years |
| Rights Management and recovery ([05](05-rights-management-and-recovery.md)) | `aipservice-configuration.json`, `irm-configuration.json` | Decryption-recovery test record | Super user activations, PIM activation history | None standing | Quarterly recovery test | Evidence store / 3 years |
| Message encryption ([06](06-exchange-message-encryption.md)) | Transport rule and OME configuration export | Encrypted message to external test recipient; message trace | Transport rule hits | Excluded partner domains | Quarterly test | Evidence store / 3 years |
| SharePoint and OneDrive ([07](07-sharepoint-and-onedrive.md)) | Tenant label-integration setting; IRM library list | Co-authoring and search test | — | Libraries left on IRM | At each migration wave | Evidence store / 3 years |
| DLP ([08](08-dlp-and-endpoint-controls.md)) | `dlp-policies.json`, `dlp-rules.json` | Synthetic content per surface | DLP alerts, overrides, activity explorer | Rule exceptions with expiry | Weekly tuning record | Config repository; evidence store / 3 years |
| Auto-labeling ([09](09-auto-labeling-and-sensitive-information-types.md)) | `autolabel-policies.json`, `autolabel-rules.json`, custom SIT packages | Simulation precision record | Items labeled per period | Excluded sites | Each tuning cycle | Config repository; evidence store / 3 years |
| Audit, insider risk, communication compliance ([10](10-audit-insider-risk-and-communication-compliance.md)) | `audit-status.json`, audit retention policies, policy exports | Synthetic event search record | Alert and case history (pseudonymized) | Users excluded, privacy approval | Quarterly test | Evidence store / 3 years; case records per the privacy official |
| AI data security ([11](11-ai-data-security.md)) | Copilot and AI-site DLP exports, DSPM policy list | Copilot and AI-site test record | AI activity export, data risk assessments | Approved AI sites, label exceptions | Monthly assessment review | Evidence store / 3 years |
| Operations (this chapter) | Baseline exports | Drift-run results | Metrics history | Exclusion register | Closure-chain entries | Config repository / life of the system |

: Book 20 evidence catalog {.striped .hover}

Audit retention sets how far back the operational evidence can reach. Audit (Standard) keeps records 180 days. Audit (Premium) keeps Microsoft Entra ID, Exchange, OneDrive and SharePoint records for one year by default for users with an E5-level license and lets audit log retention policies keep records up to one year, or ten years for users who also hold the 10-year retention add-on; audit records from non-user entities are kept for a fixed year.[^c12-audit-retention] Audit (Premium), its one-year and ten-year retention are listed as available in GCC.[^c12-gcc] Where the federal logging requirement asks for longer, the logs go to the agency's log platform under [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md); that is a licensing and architecture decision, recorded as such.

**Evidence checklist** (for this chapter's own controls)

- [ ] **Configuration:** the monthly baseline export, committed with the change ticket
- [ ] **Operational:** drift-run results and the metrics history
- [ ] **Test:** the quarterly synthetic test records, with expected and observed outcome, date and tester
- [ ] **Exception:** the exclusion register, each entry with approver and expiry
- [ ] **Assessor-ready artifact:** the evidence catalog rows above, assembled per [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md)

## Metrics {#metrics}

The metrics measure whether data is protected and whether the controls work, not whether a setting exists. A policy that is on and catches nothing scores no better than a policy that is off. Each metric has a formula, a source and a cadence; targets are the policy owner's to set in the decision record, and the program reports the trend.

| # | Metric | Formula | Data source | Cadence |
|---|---|---|---|---|
| M1 | Container label coverage of CUI-bearing sites | CUI-bearing sites and teams carrying a container label ÷ CUI-bearing sites and teams | Site inventory from [Chapter 01](01-data-inventory-and-classification.md) joined to the SharePoint site-label report | Monthly |
| M2 | Labeled share of sensitive content | Files with a sensitive information type match that carry a sensitivity label ÷ files with a sensitive information type match | Content explorer ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md)) | Monthly |
| M3 | Encrypted share of CUI | Items labeled CUI whose label applies encryption, and which are encrypted ÷ items labeled CUI | Content explorer by label; label definitions | Quarterly |
| M4 | DLP true-positive rate after tuning | Alerts confirmed as true positives on triage ÷ alerts triaged, per policy | DLP alert dispositions ([Chapter 08](08-dlp-and-endpoint-controls.md)) | Monthly |
| M5 | Override rate | Policy-tip overrides ÷ DLP matches that offered an override, per policy and per user | Activity explorer DLP events | Weekly |
| M6 | Mean time to triage | Mean of (triage time − alert time) for DLP, insider risk and AI alerts | Alert queue timestamps ([Book 12](../b12-security-operations/index.md)) | Monthly |
| M7 | Decryption-recovery test pass | Recovery tests that decrypted the test item within the target time ÷ recovery tests run | Quarterly test records ([Chapter 05](05-rights-management-and-recovery.md)) | Quarterly |
| M8 | Audit-search success for synthetic events | Synthetic events found by audit search within the target time ÷ synthetic events generated | Quarterly test records ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)) | Quarterly |
| M9 | Encrypted-mail test pass | External test recipients who opened an encrypted test message ÷ test messages sent | Quarterly test records ([Chapter 06](06-exchange-message-encryption.md)) | Quarterly |
| M10 | Oversharing trend | Items shared with anyone or the whole organization that contain sensitive data, this assessment ÷ last assessment | DSPM data risk assessment exports ([Chapter 11](11-ai-data-security.md)) | Monthly |
| M11 | Unexplained drift | Baseline differences with no change ticket | Drift-run results | Monthly |
| M12 | Expired exceptions | Exceptions past expiry and not renewed or removed | Exclusion register | Monthly |

: Book 20 metrics {.striped .hover}

Three cautions in reading them. A rising labeled share (M2) can mean better labeling or a looser sensitive information type; read it with M4. A low override rate (M5) is good only if M4 is high; a policy nobody overrides because it never fires is not working. And a metric that depends on a feature the tenant isn't licensed for, or that Learn doesn't list for its cloud, is reported as "not measured: licensing" or "not measured: environment", not as zero.

### Day-two ownership {#b20-12-day-two-ownership-ops}

The platform owner owns the baseline, the drift run, the metrics and the evidence catalog, and reports the metrics monthly to the policy owner and quarterly to the authorizing official. The policy owner reviews the RACI and the cadence each year. The assessor reads the evidence catalog and the closure-chain entries at each reassessment. Drift in this chapter's own controls looks like a missed monthly export, a metric that stops updating, or an exception register with entries past expiry.

## Key takeaways

- One dated export of labels, label policies, auto-labeling, DLP, IRM, audit status and the Rights Management configuration is the baseline; drift is any difference no change ticket explains.
- Data events follow Book 12's response ladder, with privacy rules first, the label as evidence and a label change as a containment option.
- Six roles separate who decides, who builds, who runs, who watches, who answers users and who assesses; the assessor is accountable for the package, and closure stays with the authorizing official or assessor.
- Metrics measure protected coverage and effectiveness: labeled share of sensitive content, container coverage, true-positive and override rates, recovery and audit-search test passes.
- A license or a GCC gap is a recorded decision or environment fact, never a failed control.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 11 — AI Data Security](11-ai-data-security.md) · [Book index](index.md) · [Next: Appendix A — Requirements Mapping: Controls, KSIs and Chapters →](appendix-a-requirements-mapping.md)
:::

[^c12-get-label]: Microsoft Learn, "Get-Label" (Security & Compliance PowerShell; view sensitivity labels), <https://learn.microsoft.com/powershell/module/exchangepowershell/get-label> (accessed Nov 11, 2026). The companion cmdlets `Get-LabelPolicy`, `Get-AutoSensitivityLabelPolicy`, `Get-DlpCompliancePolicy` and `Get-DlpComplianceRule` are in the same module reference.
[^c12-get-autorule]: Microsoft Learn, "Get-AutoSensitivityLabelRule" (available only in Security & Compliance PowerShell; views auto-labeling policy rules), <https://learn.microsoft.com/powershell/module/exchangepowershell/get-autosensitivitylabelrule> (accessed Nov 11, 2026).
[^c12-aip]: Microsoft Learn, "Get-AipServiceConfiguration" (gets the tenant's protection service configuration; "You must use PowerShell to see a full list of protection configuration values for your tenant"; output includes SuperUsersEnabled and SuperUsers) and "Connect-AipService", <https://learn.microsoft.com/powershell/module/aipservice/get-aipserviceconfiguration> and <https://learn.microsoft.com/powershell/module/aipservice/connect-aipservice> (accessed Nov 11, 2026).
[^c12-app-only]: Microsoft Learn, "App-only authentication for unattended scripts in Exchange Online PowerShell and Security & Compliance PowerShell," section "Connection examples," <https://learn.microsoft.com/powershell/exchange/app-only-auth-powershell-v2> (accessed Nov 11, 2026).
[^c12-audit-on]: Microsoft Learn, "Turn auditing on or off," section "Audit records when auditing status is changed" (`Search-UnifiedAuditLog -Operations Set-AdminAuditLogConfig`), <https://learn.microsoft.com/purview/audit-log-enable-disable> (accessed Nov 11, 2026).
[^c12-audit-retention]: Microsoft Learn, "Learn about auditing solutions in Microsoft Purview," sections "Comparison of key capabilities" and "Audit (Premium)" (180-day retention in Audit Standard; one-year default for Entra ID, Exchange, OneDrive and SharePoint records in Audit Premium; up to ten years with the add-on; non-user records retained one year), <https://learn.microsoft.com/purview/audit-solutions-overview>; and "Manage audit log retention policies" (licensing for longer retention), <https://learn.microsoft.com/purview/audit-log-retention-policies> (both accessed Nov 11, 2026).
[^c12-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (Audit Standard and Audit Premium rows, including log retention of one year and ten years), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
