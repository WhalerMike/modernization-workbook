---
title: "Chapter 06 — Exchange Message Encryption"
description: "How the agency encrypts the mail that leaves it without asking every sender to remember: when to use a sensitivity label and when a mail flow rule, the approved message scenarios, verifying Microsoft Purview Message Encryption with Test-IRMConfiguration, branding, one-time passcodes and social sign-in, the Encrypt button in Outlook on the web, Advanced Message Encryption's custom templates, expiry and revocation, mail flow rules staged from audit to enforcement by ring, rollback, exclusions, telemetry, and the encrypted test and transport-rule evidence that closure-map row CM-13 asks for, with each feature's availability in GCC, GCC High and DoD."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 6
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 06 — Exchange Message Encryption

*A sender who has to remember to encrypt will forget on the day it matters; the agency decides which messages leave encrypted, writes that decision as a rule, and proves the rule fires.*

::: {.callout-note}
## In this chapter
The two ways mail gets encrypted, a sensitivity label the sender or an auto-labeling policy applies and a mail flow rule the service applies, and which scenarios each one carries. Verifying that Microsoft Purview Message Encryption is working, and setting the recipient experience: branding, one-time passcodes, social sign-in and the Encrypt button. Advanced Message Encryption's custom templates, expiry and revocation, where licensed and available. Then mail flow rules for the approved scenarios, staged from audit through enforcement by ring, with rollback, exclusions and telemetry, and the encrypted test and transport-rule evidence for closure-map row CM-13.
:::

[Chapter 05](05-rights-management-and-recovery.md) turned on the Azure Rights Management service and made sure the agency can recover what it encrypts. Message encryption runs on that service: Microsoft Purview Message Encryption's only prerequisite is that Rights Management is active in the tenant, and if it is, Microsoft 365 activates message encryption automatically.[^c06-setup] This chapter decides which messages get encrypted and how, and proves it.

Two other chapters own adjacent decisions. Sensitivity labels for email, including labels that encrypt, are designed in [Chapter 02](02-sensitivity-label-architecture.md) and published in [Chapter 03](03-label-publication-and-defaults.md); DLP rules that act on message content are [Chapter 08](08-dlp-and-endpoint-controls.md). [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#dlp-on-three-enforcement-surfaces) sets the program's minimum DLP baseline, which blocks external send of CUI rather than encrypting it. This chapter covers what is left: encrypting mail that *should* go outside, to the people who need it, without relying on the sender.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (Data Encryption)
- **Depends on:** Rights Management active and recoverable ([Chapter 05](05-rights-management-and-recovery.md)); the label taxonomy ([Chapter 02](02-sensitivity-label-architecture.md)); Exchange Online as the mail path, including for hybrid on-premises senders
- **Attack chain interrupted:** Collection and Exfiltration (a message read by anyone other than its intended recipients, in transit, at rest in a recipient's mailbox, or after forwarding)
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Decide: the approved message scenarios](#decide-the-approved-message-scenarios) | Decision record ([template](01-data-inventory-and-classification.md#decision-record-template)) listing each scenario, its mechanism and its template |
| Configured | [Prerequisites](#prerequisites) and [Pilot](#pilot) | `Get-IRMConfiguration`, `Get-OMEConfiguration` and `Get-TransportRule` exports |
| Enforced | [Enforcement](#enforcement) | Each approved rule in `Enforce` mode with its full scope; the exception register |
| Evidenced | [Validate](#validate-the-encrypted-test) | `Test-IRMConfiguration` output, the test messages, message trace and the transport rule report |
| Operated | [Day-two ownership](#day-two-ownership) | Monthly rule review, alert on rule changes, quarterly encrypted test |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Two mechanisms, one service

Mail can be encrypted in three ways that all end at Rights Management: a sender applies an encrypting sensitivity label or the **Encrypt** option in Outlook; an auto-labeling policy applies an encrypting label to mail in transit ([Chapter 09](09-auto-labeling-and-sensitive-information-types.md)); or an Exchange mail flow rule (also called a transport rule) encrypts messages that match its conditions. Mail flow rules are flexible: they combine conditions such as keywords and external recipients in one rule, and Message Encryption also encrypts the recipients' replies.[^c06-ome-overview]

| | Sensitivity label on the message | Mail flow rule |
|---|---|---|
| Who decides | The sender, or an auto-labeling policy | The agency, once, in the rule |
| What it carries | The label's classification, markings and encryption settings, which travel with the message and its Office attachments | Encryption with the **Encrypt** (Encrypt-Only) or **Do Not Forward** option, or a custom template, and optionally a branding template |
| Best for | Content whose classification is the point (CUI sublabels in [Chapter 02](02-sensitivity-label-architecture.md)) | Scenarios defined by who sends to whom (a partner domain, an office that always sends privacy data externally, a sender's opt-in keyword) |
| What it can't do | Rely on the sender to remember | Encrypt inbound mail from outside the organization; such mail is delivered unencrypted[^c06-rules] |

The program uses labels for classification and rules for scenarios. A message can match both; a rule that encrypts a message already encrypted by its label doesn't remove the label's protection.

**Authority:** Risk-based recommended (the program's position, so that encryption of approved scenarios doesn't depend on the sender), built on Microsoft's documented mail flow rule mechanism.[^c06-rules]
**Applies:** License-dependent: Message Encryption for every sender ([Prerequisites](#prerequisites)); Advanced Message Encryption for custom templates, expiry and revocation. Environment-dependent: see the availability table.

## Decide: the approved message scenarios

Each scenario is a row in the decision record, with the policy owner's approval. The table is a starting set; the agency's own scenarios come from the data classes in [Chapter 01](01-data-inventory-and-classification.md).

| Scenario | Condition | Option | Why that option |
|---|---|---|---|
| Sender opt-in for external mail | From inside the organization, to outside, subject contains the agency's chosen keyword (for example `[secure]`) | **Encrypt** | Recipients can read, reply and forward; attachments are protected; replies stay encrypted |
| Named offices that routinely send privacy data externally (for example HR or benefits) | From members of the office's mail-enabled group, to outside | **Encrypt**, with the agency's branding | The office doesn't have to remember; recipients see a recognizable wrapper |
| Mail to a partner whose recipients must not forward it | To the partner's domain | **Do Not Forward** | Recipients can't forward, print or copy |
| External mail that must expire or be revocable | From inside, to outside, subject keyword or group condition | **Encrypt** with a custom branding template that sets an expiry | Only the portal experience supports expiry and revocation (Advanced Message Encryption) |

Learn describes the **Encrypt-Only** and **Do Not Forward** options in the usage-rights reference that the mail flow rule page links.[^c06-rules]

Three recipient-experience decisions go in the same record:

- **One-time passcodes.** A recipient who doesn't use Outlook gets a limited-time link with a one-time passcode; administrators can turn passcodes off.[^c06-manage] The program keeps them on, because many external recipients (a member of the public, a small contractor) have no work account.
- **Social IDs.** Recipients with a Google, Yahoo or Microsoft account can sign in to the encrypted message portal with it unless the agency turns that off.[^c06-manage] The program turns it off where the authorizing official wants every portal sign-in to be either a work account or a one-time passcode.
- **Service-side decryption for unenlightened clients.** Both settings are off by default: decrypting messages for the iOS mail app, and decrypting Encrypt-Only attachments when downloaded from a browser. Microsoft notes that a user who receives a decrypted copy can copy or print it even without that right, and can work around Do Not Forward from another account in the iOS mail app.[^c06-manage] The program leaves both off.

**Authority:** Risk-based recommended for the three recipient decisions; Microsoft documents each setting and its default.[^c06-manage]

## How: verify, brand and stage message encryption

### Prerequisites

- **Rights Management active**, and the recovery path tested ([Chapter 05](05-rights-management-and-recovery.md)). Message Encryption isn't compatible with AD RMS.[^c06-setup]
- **License.** Message Encryption is included in Office 365 and Microsoft 365 E3 and E5, Microsoft 365 Business Premium and Office 365 Government G3 and G5, and each user who benefits needs a license.[^c06-faq] Advanced Message Encryption (custom branding templates, expiry, revocation, portal activity log) is included in Microsoft 365 E5, G5, the Microsoft 365 E5 and G5 Information Protection and Governance add-ons and Office 365 E5 and G5.[^c06-sd-ame] A sender without the license is recorded in the decision record; it isn't a failed control, and an assessment test skipped for licensing is classified as such ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)). **Applies:** License-dependent.
- **Roles.** Compliance Administrator is the role Learn's procedures use; Exchange Administrator can also manage mail flow rules and revocation.[^c06-setup][^c06-revoke]
- **Hybrid.** On-premises senders get Message Encryption only if their mail routes through Exchange Online, which needs the Hybrid Configuration wizard and connectors in both directions.[^c06-rules]
- **Government-cloud availability.**

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Microsoft Purview Message Encryption (E3) | Available | Available | Available | Available | Purview planning pages, Encryption rows[^c06-gcc][^c06-gcch][^c06-dod] |
| Advanced Message Encryption (E5): custom templates, expiry, revocation | Available | Available | Available | not yet specified (not listed on the DoD page) | Same pages[^c06-gcc][^c06-gcch][^c06-dod] |
| Advanced Message Encryption: extension of email revocation | Available | Available | Available | not yet specified (not listed on the DoD page) | Same pages[^c06-gcc][^c06-gcch][^c06-dod] |
| Exchange Online mail flow rules | Available | Available | Available | Available | Exchange Online for US government environments[^c06-exo-gov] |
| One-time passcodes and social ID sign-in to the portal | Available | not yet specified | not yet specified | not yet specified | The government pages don't list them separately[^c06-manage] |
| Encrypt button in Outlook on the web (`SimplifiedClientAccessEnabled`) | Available | not yet specified | not yet specified | not yet specified | As above |

In DoD, until Learn lists Advanced Message Encryption, the expiry and revocation scenario in the table above is designed but not configured; the compensating control is the **Do Not Forward** option and the DLP block on external send of CUI ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#the-minimum-policy-baseline)). Government feature status "is subject to change"; read the pages again at each reassessment.

Connect to Exchange Online PowerShell. Placeholders used in this chapter: `<admin-upn>`; `<test-sender>@contoso.example` and `<test-recipient>@contoso.example` (two licensed test mailboxes); `<external-test>@<external-domain>` (a mailbox the agency controls outside the tenant); `<pilot-group>` (the ring 1 mail-enabled group); `<ring2-group>`; `<rule-name>`; `<incident-mailbox>@contoso.example` (where incident reports go); `<partner-domain>`; `<branding-template>`. Commands were checked against Microsoft Learn on Nov 11, 2026; run them against a test tenant first.

```powershell
# Commercial and GCC:
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
# GCC High:
Connect-ExchangeOnline -UserPrincipalName <admin-upn> -ExchangeEnvironmentName O365USGovGCCHigh
# DoD:
Connect-ExchangeOnline -UserPrincipalName <admin-upn> -ExchangeEnvironmentName O365USGovDoD
```

The environment names are Learn's.[^c06-connect-exo]

Verify the tenant is configured for Message Encryption, then run Microsoft's end-to-end test, which acquires the templates and verifies encryption, decryption and IRM:[^c06-setup]

```powershell
# AzureRMSLicensingEnabled should be True.
Get-IRMConfiguration | Format-List AzureRMSLicensingEnabled, SimplifiedClientAccessEnabled, DecryptAttachmentForEncryptOnly, LicensingLocation

# Only if AzureRMSLicensingEnabled is False:
Set-IRMConfiguration -AzureRMSLicensingEnabled $true

# Expect "OVERALL RESULT: PASS".
Test-IRMConfiguration -Sender <test-sender>@contoso.example -Recipient <test-recipient>@contoso.example
```

If the test fails with "Failed to acquire RMS templates," Learn's fix sets the licensing location from the Rights Management configuration (run after `Connect-AipService`, as in [Chapter 05](05-rights-management-and-recovery.md#prerequisites)):[^c06-setup]

```powershell
$RMSConfig = Get-AipServiceConfiguration
$LicenseUri = $RMSConfig.LicensingIntranetDistributionPointUrl
Set-IRMConfiguration -LicensingLocation $LicenseUri
Set-IRMConfiguration -InternalLicensingEnabled $true
Test-IRMConfiguration -Sender <test-sender>@contoso.example -Recipient <test-recipient>@contoso.example
```

Set the recipient experience on the default branding template (named `OME Configuration`), using the decisions above. Every organization can modify the default template; creating more templates needs Advanced Message Encryption.[^c06-brand]

```powershell
# Branding text on the default template, and the passcode and social ID decisions.
Set-OMEConfiguration -Identity "OME Configuration" -DisclaimerText "<agency disclaimer>" -EmailText "<intro text recipients see>" -PortalText "<text on the portal page>"
Set-OMEConfiguration -Identity "OME Configuration" -OTPEnabled $true
Set-OMEConfiguration -Identity "OME Configuration" -SocialIdSignIn $false

# Show the Encrypt button in Outlook on the web; keep service-side decryption off.
Set-IRMConfiguration -SimplifiedClientAccessEnabled $true
Set-IRMConfiguration -DecryptAttachmentForEncryptOnly $false
Set-ActiveSyncOrganizationSettings -AllowRMSSupportForUnenlightenedApps $false

Get-OMEConfiguration -Identity "OME Configuration" | Format-List
```

The `OTPEnabled`, `SocialIdSignIn`, `SimplifiedClientAccessEnabled`, `DecryptAttachmentForEncryptOnly` and `AllowRMSSupportForUnenlightenedApps` settings are Learn's.[^c06-manage]

Where Advanced Message Encryption is licensed and available, create the expiring template. Expiry is set in days, from 1 to 730, works only for external recipients, and only when custom branding is applied:[^c06-expire]

```powershell
New-OMEConfiguration -Identity "<branding-template>" -ExternalMailExpiryInDays 30
Get-OMEConfiguration -Identity "<branding-template>" | Format-List
```

### Pilot

Create each approved scenario's rule scoped to the ring 1 group, in a test mode, with an incident report so every match is visible. Learn's test-mode guidance: use **Test without Policy Tips** with a **Generate incident report** action, and wait at least 30 minutes after creating a rule before testing it.[^c06-test-rules] In PowerShell the rule modes are `Audit`, `AuditAndNotify` and `Enforce`,[^c06-utcm] and `-SetAuditSeverity` puts matches in the transport rule report.[^c06-test-rules]

```powershell
# Scenario: sender opt-in for external mail, ring 1 only, audit mode.
New-TransportRule -Name "<rule-name>" `
  -FromScope InOrganization -SentToScope NotInOrganization `
  -FromMemberOf "<pilot-group>" `
  -SubjectContainsWords "[secure]" `
  -ApplyRightsProtectionTemplate "Encrypt" `
  -GenerateIncidentReport "<incident-mailbox>@contoso.example" `
  -SetAuditSeverity Medium `
  -Mode Audit

# Scenario: Do Not Forward to a partner domain, ring 1 only, audit mode.
New-TransportRule -Name "<rule-name> partner DNF" `
  -FromScope InOrganization -RecipientDomainIs "<partner-domain>" `
  -FromMemberOf "<pilot-group>" `
  -ApplyRightsProtectionTemplate "Do Not Forward" `
  -GenerateIncidentReport "<incident-mailbox>@contoso.example" `
  -SetAuditSeverity Medium `
  -Mode Audit

# Scenario: external mail that expires (Advanced Message Encryption only).
New-TransportRule -Name "<rule-name> expiring" `
  -FromScope InOrganization -SentToScope NotInOrganization `
  -FromMemberOf "<pilot-group>" `
  -SubjectContainsWords "[secure-expire]" `
  -ApplyRightsProtectionTemplate "Encrypt" `
  -ApplyRightsProtectionCustomizationTemplate "<branding-template>" `
  -GenerateIncidentReport "<incident-mailbox>@contoso.example" `
  -SetAuditSeverity Medium `
  -Mode Audit

Get-TransportRule | Format-Table Name, State, Mode, Priority
```

`-ApplyRightsProtectionTemplate` with `Encrypt` or `Do Not Forward`, and `-ApplyRightsProtectionCustomizationTemplate` with a branding template name, are Learn's syntax for forcing recipients to the encrypted message portal.[^c06-manage] The pilot succeeds when, over two weeks, every incident report matches a message the rule was meant to catch, no expected message is missing, and the ring 1 users have sent at least one message per scenario to `<external-test>@<external-domain>`.

### Report-only or audit phase

`-Mode Audit` is this control's report-only phase: the rule evaluates and reports but takes no delivery action.[^c06-test-rules] Read three things for at least two weeks:

- the incident reports in `<incident-mailbox>`, for false positives (a subject keyword used in ordinary mail) and false negatives;
- the transport rule report, which counts matches per rule once the severity is set (most data within 24 hours, some up to five days);[^c06-test-rules]
- the message trace for the test messages.

Optionally move ring 1 to `AuditAndNotify` (test with policy tips) for a week so senders see what will happen; this needs a **Notify the sender with a Policy Tip** action on the rule.[^c06-test-rules]

### Enforcement

Move each rule to `Enforce`, remove the incident report, then widen the sender scope ring by ring.

```powershell
# Ring 1 enforced.
Set-TransportRule -Identity "<rule-name>" -Mode Enforce -GenerateIncidentReport $null

# Ring 2: widen to the early-adopter group.
Set-TransportRule -Identity "<rule-name>" -FromMemberOf "<ring2-group>"

# Ring 3: everyone in the organization (remove the group condition).
Set-TransportRule -Identity "<rule-name>" -FromMemberOf $null

Get-TransportRule -Identity "<rule-name>" | Format-List Name, State, Mode, FromScope, SentToScope, FromMemberOf, SubjectContainsWords, ApplyRightsProtectionTemplate, ApplyRightsProtectionCustomizationTemplate
```

For the office-scoped scenario, ring 3 is the office's own group rather than the whole organization.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The platform owner's test mailboxes | `Test-IRMConfiguration` passes; each rule encrypts a test message to `<external-test>` |
| 1 | `<pilot-group>` | Two weeks in `Audit` with no unexplained matches or misses; ring 1 enforced for one week with no delivery failures |
| 2 | `<ring2-group>` (records, legal, HR, the help desk) | Help-desk tickets from external recipients within the threshold the policy owner set; one revocation drill (where licensed) |
| 3 | Everyone in scope for the scenario | Post-change validation passed |

- **Emergency access:** not applicable: mail flow rules don't block sign-in. Emergency access mailboxes, if any, aren't in a rule's sender groups.
- **Change window:** a standard change window approved by the platform owner; external partners named in a Do Not Forward rule are told in advance by the business owner.
- **Backout triggers:** encrypted mail undeliverable or unreadable to a partner that depends on it; an encryption rule firing on internal-only mail; external-recipient help requests above the threshold set before the change.
- **Post-change validation:** the [encrypted test](#validate-the-encrypted-test), run after each ring.

### Rollback

A rule is rolled back by disabling it, which keeps its settings for later:[^c06-mailflow]

```powershell
Disable-TransportRule -Identity "<rule-name>" -Confirm:$false
Get-TransportRule -Identity "<rule-name>" | Format-List Name, State
```

To return a rule to observation instead, set `-Mode Audit`. Messages already encrypted stay encrypted; recovering one is [Chapter 05](05-rights-management-and-recovery.md#how-recover-encrypted-content-through-a-super-user-just-in-time). Microsoft's steps to turn Message Encryption off entirely (remove the rules, set `SimplifiedClientAccessEnabled` and then `AzureRMSLicensingEnabled` to `$false`) are a decommissioning decision, not a backout.[^c06-manage] An operator with Exchange or Compliance Administrator active can disable a rule in under a minute; Learn notes that a rule change can take more than 15 minutes to apply.[^c06-test-rules]

### Exclusions

- Partners with whom the agency has an agreed alternative (for example enforced TLS on a dedicated connector) are excepted with `-ExceptIfRecipientDomainIs`, recorded in the exception register with the agreement and review date.
- Journaling, archiving and automated system senders that can't handle encrypted mail are excepted by sender with `-ExceptIfFrom`, each with an owner and review date.
- Inbound mail from outside the organization can't be encrypted by a rule; it isn't an exclusion but a limit, stated in the decision record.[^c06-rules]

### Telemetry

| Signal | Where it comes from | Where it goes |
|---|---|---|
| Rule created, changed, enabled, disabled or removed | Microsoft Purview audit, operations `New-TransportRule`, `Set-TransportRule`, `Enable-TransportRule`, `Disable-TransportRule`, `Remove-TransportRule`[^c06-audit-rules] | Workspace ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md)); an alert to the security monitor on any change outside an approved change |
| Rule matches | Transport rule report (severity set on each rule); message trace | Monthly review by the operator |
| Encryption and decryption of each message | Rights Management usage log ([Chapter 05](05-rights-management-and-recovery.md#report-only-or-audit-phase)) | Evidence store |
| Portal access, expiry and revocation (Advanced Message Encryption) | Encryption report and encrypted message portal activity log in the Microsoft Purview portal;[^c06-ame] `Get-OMEMessageStatus` for one message[^c06-revoke] | Evidence store |

### Evidence

This is the minimum evidence for the mail-encryption part of CM-13: an encrypted test, and the transport rules that automate the approved scenarios.

**Evidence checklist**

- [ ] **Configuration:** `Get-IRMConfiguration`, `Get-OMEConfiguration` and `Get-TransportRule | Format-List` exports, dated, with each rule's mode, conditions, template and branding template, matched to the decision record
- [ ] **Operational:** the transport rule report and the audit-log record of rule changes for the period, kept as [Book 13, Chapter 13](../b13-governance/13-records-evidence-and-retention.md) sets
- [ ] **Test:** the `Test-IRMConfiguration` output showing PASS, and the [encrypted test](#validate-the-encrypted-test) record with each test message's message trace
- [ ] **Exception:** the exception register (excepted domains and senders, unlicensed senders, DoD scenarios held for Advanced Message Encryption), each with approver and review date
- [ ] **Assessor-ready artifact:** the CM-13 register entry ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)) linking the four items above and the Rights Management evidence in [Chapter 05](05-rights-management-and-recovery.md#evidence)

### Day-two ownership

The **policy owner** approves each scenario and every change to a rule's conditions. The **platform owner** owns the rules, the branding and the quarterly encrypted test. The **operator** reviews the transport rule report monthly and handles revocations. The **security monitor** alerts on rule changes outside approved changes. The **help desk** handles external recipients who can't open a message with the portal and passcode steps ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md)); user training on the Encrypt button and the opt-in keyword is [Book 16](../b16-people/index.md). The **assessor** reads the evidence above. Drift looks like: a rule left in `Audit`, a rule disabled without a change record, a new rule with no decision-record row, or `AzureRMSLicensingEnabled` false. Roles are in [Chapter 12](12-operations-and-evidence.md#raci).

## Validate: the encrypted test

Run after each ring and then every quarter.

| Step | Expected outcome | Evidence |
|---|---|---|
| 1. `Test-IRMConfiguration` with two test mailboxes | `OVERALL RESULT: PASS` | Command output |
| 2. A ring member sends a message matching each scenario to `<external-test>@<external-domain>` | Arrives encrypted with the scenario's option and branding; opens with a one-time passcode or a work account, not a social ID where turned off | Screenshot of the wrapper and portal; message trace |
| 3. The external tester replies | Reply is encrypted | Message trace |
| 4. A message that shouldn't match (internal recipient, or no keyword) | Not encrypted by the rule | Message trace; no incident report |
| 5. The external tester tries to forward a Do Not Forward message | Forwarding isn't permitted | Tester's record |
| 6. Where licensed: revoke one expiring message | `Get-OMEMessageStatus` shows `Revoked: True`; the portal shows the message as revoked | Command output[^c06-revoke] |

Revocation works only for messages delivered through the portal (custom branding); a message read inline in a supported Outlook client can't be revoked.[^c06-revoke-cmd]

```powershell
# Step 6, with the message ID from message trace:
Get-OMEMessageStatus -MessageId "<message-id>" | Format-Table -AutoSize Subject, IsRevocable
Set-OMEMessageRevocation -Revoke $true -MessageId "<message-id>"
Get-OMEMessageStatus -MessageId "<message-id>" | Format-Table -AutoSize Subject, Revoked
```

## Key takeaways

- Labels carry classification; mail flow rules carry approved scenarios. The program uses both, and neither depends on a sender remembering.
- `Test-IRMConfiguration` and an encrypted test to a mailbox the agency controls outside the tenant are the test evidence; the `Get-TransportRule` export is the configuration evidence. Together they are CM-13's minimum for mail.
- Stage each rule in `Audit` with an incident report, then enforce by ring; disabling a rule is the rollback.
- Advanced Message Encryption adds expiry and revocation but is license-dependent and not yet listed for DoD; plan a compensating control there.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 05 — Rights Management and Recovery](05-rights-management-and-recovery.md) · [Book index](index.md) · [Next: Chapter 07 — SharePoint and OneDrive →](07-sharepoint-and-onedrive.md)
:::

[^c06-setup]: Microsoft Learn, "Set up Message Encryption," sections "Verify that Azure Rights Management is active" (only prerequisite; activated automatically; not compatible with AD RMS) and "Verify Microsoft Purview Message Encryption configuration in Exchange Online PowerShell" (`Get-IRMConfiguration` AzureRMSLicensingEnabled; `Test-IRMConfiguration`; fix for "Failed to acquire RMS templates"; Compliance Administrator), <https://learn.microsoft.com/purview/set-up-new-message-encryption-capabilities> (accessed Nov 11, 2026).
[^c06-ome-overview]: Microsoft Learn, "Message encryption," section "Defining rules for Microsoft Purview Message Encryption" (rules combine conditions; Message Encryption also encrypts replies) and "How Microsoft Purview Advanced Message Encryption works on top of Microsoft Purview Message Encryption," <https://learn.microsoft.com/purview/ome> (accessed Nov 11, 2026).
[^c06-rules]: Microsoft Learn, "Define mail flow rules to encrypt email messages" (can't encrypt inbound mail from outside the organization; hybrid senders need mail routed through Exchange Online; Do Not Forward and Encrypt-Only options; Compliance Administrator), <https://learn.microsoft.com/purview/define-mail-flow-rules-to-encrypt-email> (accessed Nov 11, 2026).
[^c06-manage]: Microsoft Learn, "Manage message encryption," sections on social ID sign-in (`SocialIdSignIn`), one-time passcodes (`OTPEnabled`), the Encrypt button (`SimplifiedClientAccessEnabled`), service-side decryption for the iOS mail app (`AllowRMSSupportForUnenlightenedApps`, off by default; Do Not Forward workaround) and for browser attachment downloads (`DecryptAttachmentForEncryptOnly`, off by default), "Ensure all external recipients use the encrypted message portal" (`New-TransportRule` with `-ApplyRightsProtectionTemplate` and `-ApplyRightsProtectionCustomizationTemplate`) and "Disable Microsoft Purview Message Encryption," <https://learn.microsoft.com/purview/manage-office-365-message-encryption> (accessed Nov 11, 2026).
[^c06-faq]: Microsoft Learn, "Message encryption FAQ," section "What subscriptions do I need to use Microsoft Purview Message Encryption?," <https://learn.microsoft.com/purview/ome-faq> (accessed Nov 11, 2026).
[^c06-sd-ame]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Information Protection Advanced Message Encryption," Feature availability table, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c06-revoke]: Microsoft Learn, "Revoke email encrypted by Advanced Message Encryption," section "How to revoke an encrypted message as an administrator" (`Get-OMEMessageStatus`, `Set-OMEMessageRevocation`; Compliance or Exchange Administrator), <https://learn.microsoft.com/purview/revoke-ome-encrypted-mail> (accessed Nov 11, 2026).
[^c06-revoke-cmd]: Microsoft Learn, "Set-OMEMessageRevocation," Description (revocation works for link-based, branded messages; not for messages read in the native inline experience of a supported Outlook client), <https://learn.microsoft.com/powershell/module/exchangepowershell/set-omemessagerevocation> (accessed Nov 11, 2026).
[^c06-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 table, Encryption rows (status "subject to change"), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c06-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4 table, Encryption rows, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c06-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4 table, Encryption rows (Message Encryption (E3) listed; Advanced Message Encryption and the revocation extension not listed), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
[^c06-exo-gov]: Microsoft Learn, "Exchange Online for US government environments," Exchange Online features table (Mail flow rules: GCC, GCC High and DoD Yes), <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/exchange-online-for-us-government-environments> (accessed Nov 11, 2026).
[^c06-connect-exo]: Microsoft Learn, "Connect to Exchange Online PowerShell," section "Step 2: Connect and authenticate" (`-ExchangeEnvironmentName` values `O365USGovGCCHigh` and `O365USGovDoD`; none needed for commercial and GCC), <https://learn.microsoft.com/powershell/exchange/connect-to-exchange-online-powershell> (accessed Nov 11, 2026).
[^c06-brand]: Microsoft Learn, "Add your organization's brand to your Microsoft Purview Message Encryption encrypted messages," sections "Work with branding templates" (modify the default template; create and remove custom templates with Advanced Message Encryption only) and "Modify a branding template," <https://learn.microsoft.com/purview/add-your-organization-brand-to-encrypted-messages> (accessed Nov 11, 2026).
[^c06-expire]: Microsoft Learn, "Set an expiration date for email encrypted by Microsoft Purview Advanced Message Encryption" (external recipients only; custom branding required; `New-OMEConfiguration -ExternalMailExpiryInDays`, 1 to 730 days), <https://learn.microsoft.com/purview/ome-advanced-expiration> (accessed Nov 11, 2026).
[^c06-test-rules]: Microsoft Learn, "Test mail flow rules in Exchange Online," steps 1 to 3 (test modes with incident report or policy tip; wait at least 30 minutes; set to Enforce) and "Troubleshooting suggestions" and "Other testing options" (rules can take longer than 15 minutes; transport rule report needs a severity; data within 24 hours, some up to five days), <https://learn.microsoft.com/exchange/security-and-compliance/mail-flow-rules/test-mail-flow-rules> (accessed Nov 11, 2026).
[^c06-utcm]: Microsoft Learn, "Supported Microsoft Exchange resources for Tenant Configuration Management," transportRule resource type (`Mode` allowed values `Audit`, `AuditAndNotify`, `Enforce`; `SentToScope`; `SetAuditSeverity`), <https://learn.microsoft.com/graph/utcm-exchange-resources> (accessed Nov 11, 2026).
[^c06-mailflow]: Microsoft Learn, "Mail flow rules (transport rules) in Exchange Online," section "Mail flow rule components" (`Enable-TransportRule` and `Disable-TransportRule`; disable a rule without deleting it to keep its settings), <https://learn.microsoft.com/exchange/security-and-compliance/mail-flow-rules/mail-flow-rules> (accessed Nov 11, 2026).
[^c06-audit-rules]: Microsoft Learn, "Use the audit log to identify Exchange transport rule activities," section "Search the audit log for rule activities" (operation names; default 180-day retention without Audit (Premium) or a retention policy), <https://learn.microsoft.com/purview/audit-log-search-mailbox-rules> (accessed Nov 11, 2026).
[^c06-ame]: Microsoft Learn, "Advanced Message Encryption," section "Get started with Microsoft Purview Advanced Message Encryption" (multiple templates, expiry, revocation, encrypted message portal activity log; only for messages received through the portal), <https://learn.microsoft.com/purview/ome-advanced-message-encryption> (accessed Nov 11, 2026).
