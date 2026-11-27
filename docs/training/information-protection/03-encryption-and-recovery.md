---
title: "Module 3: Encryption and recovery"
description: "Guide Steps 5, 6 and 7: the Azure Rights Management service activated and staged deliberately, a just-in-time super user recovery that ends with the feature off, message encryption for the approved scenarios by label or mail flow rule, and SharePoint and OneDrive label integration so encrypted files can be searched, scanned and co-authored. Lab 1 finds the super user feature left on in the kit's fixtures; Lab 2 reads the protection state and runs Test-IRMConfiguration in a test tenant."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 20"
series-order: 3
review-status: approved
reviewed-sha256: f0c35f709568c6510244bdc42c81c82dca190006fb5764633ce71cdaafb78958
last-reviewed: 2026-11-25
---
# Module 3: Encryption and recovery {.unnumbered}

*Part of the [Information Protection learning path](index.md). Guide [Step 5](../../books/guides/information-protection-implementation.md#step-5-rights-management-and-recovery), [Step 6](../../books/guides/information-protection-implementation.md#step-6-message-encryption) and [Step 7](../../books/guides/information-protection-implementation.md#step-7-sharepoint-and-onedrive). About 40 minutes, plus Lab 1 and Lab 2.*

## Introduction (3 minutes) {#ip-m3-introduction}

Encryption protects CUI wherever it goes, and it locks out the agency too if nobody can recover what an owner encrypted. This module covers the service that does the encrypting, the recovery that has to be tested before encrypting labels go wide, mail that leaves the agency, and the SharePoint setting without which encrypted files can't be searched or checked by DLP.

## Learning objectives (1 minute) {#ip-m3-objectives}

By the end of this module, you'll be able to:

- confirm the Rights Management service is active and staged, and explain why the super user feature is off at rest;
- run the decryption-continuity test, including a just-in-time recovery;
- name the approved message scenarios and check that each encrypts by rule or label;
- explain what SharePoint and OneDrive can't do with encrypted files until label integration is on.

## Prerequisites (1 minute) {#ip-m3-prerequisites}

[Module 2](02-labels-publication-and-containers.md).

## Unit 1: Rights Management and recovery (10 minutes) {#ip-m3-unit-1}

Read [Book 20, Chapter 05](../../books/b20-information-protection/05-rights-management-and-recovery.md): [the decisions](../../books/b20-information-protection/05-rights-management-and-recovery.md#b20-05-decide-activation-onboarding-and-recovery), [activating and staging the service](../../books/b20-information-protection/05-rights-management-and-recovery.md#how-activate-and-stage-the-rights-management-service), and [recovery through a super user, just in time](../../books/b20-information-protection/05-rights-management-and-recovery.md#how-recover-encrypted-content-through-a-super-user-just-in-time). The recovery's last step turns the feature off and removes the super user; disabling the feature alone doesn't remove users. The super user feature isn't listed on Learn's GCC page: confirm it in a test tenant before the recovery depends on it. The guide puts this gate before an encrypting label goes beyond ring 1.

## Unit 2: Message encryption (8 minutes) {#ip-m3-unit-2}

Read [Book 20, Chapter 06](../../books/b20-information-protection/06-exchange-message-encryption.md): [the approved message scenarios](../../books/b20-information-protection/06-exchange-message-encryption.md#decide-the-approved-message-scenarios) and [verifying, branding and staging](../../books/b20-information-protection/06-exchange-message-encryption.md#how-verify-brand-and-stage-message-encryption). A mail flow rule starts in `Audit` and moves to `Enforce` ring by ring; `Test-IRMConfiguration` proves the configuration end to end. Message Encryption, Advanced Message Encryption and revocation are available in GCC.

## Unit 3: SharePoint and OneDrive (8 minutes) {#ip-m3-unit-3}

Read [Book 20, Chapter 07](../../books/b20-information-protection/07-sharepoint-and-onedrive.md): [label integration](../../books/b20-information-protection/07-sharepoint-and-onedrive.md#how-turn-on-label-integration-for-sharepoint-and-onedrive), [legacy IRM libraries](../../books/b20-information-protection/07-sharepoint-and-onedrive.md#how-move-legacy-irm-libraries-to-sensitivity-labels) and [co-authoring](../../books/b20-information-protection/07-sharepoint-and-onedrive.md#how-turn-on-co-authoring-for-encrypted-files). Until integration is on, the services can't search, scan, co-author or apply DLP to encrypted files; the guide turns it on before auto-labeling scans SharePoint. The SharePoint module runs in PowerShell 7 only through Windows PowerShell 5.1 compatibility, so the kit leaves these settings to the guide's G7 step. The developer workbook's [Chapter 05](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md) checks the rest.

## Exercise: Lab 1, fixtures, no tenant (20 minutes) {#ip-m3-lab-1}

Run the developer workbook's [Chapter 05 Lab 1](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-1-fixtures-no-tenant). It has the exact commands and what each printed, and the commands are also listed below.

<!-- labs:begin module-lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-1-commands collapse="false" title="The Lab 1 commands, on the fixtures"}
Every command in [Chapter 05 Lab 1](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-1-fixtures-no-tenant), in order, on the kit's fixtures, with no tenant.

The chapter's steps say what each command does and what to look for.

```powershell
Set-Location C:\FMWLabs\information-protection-code\information-protection

$Run = "C:\FMWLabs\results\information-protection-05\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run the protection check
./Invoke-IpProtection.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath "$Run/protection" -AsOf 2026-11-24T12:00:00Z

# Step 2: Read the mail flow rule table
Import-Csv "$Run/protection/mail-flow-rules.csv" | Format-Table Rule, Stage, State, Mode, Template -AutoSize

# Step 3: Run the chapter's tests
Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch05 -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Get-ChildItem C:\FMWLabs\results\information-protection-05\lab1 -Name
```
:::

<!-- labs:end -->

- **What you'll see:** the super user feature on with a standing super user, social ID sign-in on, and a partner rule still in `Audit`.
- **What to look for:** the super user rows, which Module 5's drift run raises to P1.
- **Back-out:** nothing to delete. The lab leaves the kit's folder as you unzipped it and keeps its results in a dated run folder under `C:\FMWLabs\results`, so you can run it again and compare.

## Exercise: Lab 2, a test tenant {#ip-m3-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the Rights Management state
Connect-AipService
Get-AipService
Get-AipServiceSuperUserFeature
Get-AipServiceSuperUser
Disconnect-AipService

# Step 2: Read the IRM configuration and test it
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
Get-IRMConfiguration | Format-List AzureRMSLicensingEnabled, SimplifiedClientAccessEnabled, DecryptAttachmentForEncryptOnly, LicensingLocation
Test-IRMConfiguration -Sender <test-sender>@contoso.example -Recipient <test-recipient>@contoso.example

# Step 3: List the mail flow rules
Get-TransportRule | Format-Table Name, State, Mode, Priority
Disconnect-ExchangeOnline -Confirm:$false

# Step 4: Read co-authoring
Connect-IPPSSession -UserPrincipalName <admin-upn>
Get-PolicyConfig | Format-List EnableLabelCoauth

# Step 5: Back it out
Disconnect-ExchangeOnline -Confirm:$false
```

:::

<!-- labs:end -->

You read the Rights Management state, the message encryption configuration and co-authoring, as the guide's G5, G6 and G7 Validate steps do. Every step reads; `Test-IRMConfiguration` sends a test between two test mailboxes.

- **You need:** a test tenant, an account with the read roles through PIM, AIPService 3.1.0.0 or later, and two test mailboxes.
- **You'll replace:** `<admin-upn>`, `<test-sender>` and `<test-recipient>`.

1. **Read the Rights Management state.**

    ```powershell
    Connect-AipService
    Get-AipService
    Get-AipServiceSuperUserFeature
    Get-AipServiceSuperUser
    Disconnect-AipService
    ```

    Expected result, as the guide states it: `Enabled`; the super user feature `Disabled`; no super users listed.

2. **Read the IRM configuration and test it.**

    ```powershell
    Connect-ExchangeOnline -UserPrincipalName <admin-upn>
    Get-IRMConfiguration | Format-List AzureRMSLicensingEnabled, SimplifiedClientAccessEnabled, DecryptAttachmentForEncryptOnly, LicensingLocation
    Test-IRMConfiguration -Sender <test-sender>@contoso.example -Recipient <test-recipient>@contoso.example
    ```

    Expected result: `AzureRMSLicensingEnabled` is `True`, and `OVERALL RESULT: PASS`.

3. **List the mail flow rules.**

    ```powershell
    Get-TransportRule | Format-Table Name, State, Mode, Priority
    Disconnect-ExchangeOnline -Confirm:$false
    ```

    Expected result: each approved scenario's rule is `Enabled` and in `Enforce` mode for its ring.

4. **Read co-authoring.**

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    Get-PolicyConfig | Format-List EnableLabelCoauth
    ```

    Expected result: `True` once co-authoring is on.

5. **Back it out.** Nothing changed in the tenant. Disconnect:

    ```powershell
    Disconnect-ExchangeOnline -Confirm:$false
    ```

## Knowledge check (5 minutes) {#ip-m3-knowledge-check}

1. A recovery is finished. Which state should the export show?
    a. The super user feature `Enabled`, so the next recovery is faster.
    b. The super user feature `Disabled` and no super users.
    c. The super user feature `Disabled`, with the recovery operator still listed.

2. Why does the guide put the recovery test before an encrypting label goes beyond ring 1?
    a. So nothing is encrypted that the agency can't recover.
    b. Because the service needs it to activate.
    c. Because GCC requires it.

3. A mail flow rule for a partner scenario says `Mode: Audit` after its ring ended. What does that mean?
    a. It encrypts and reports.
    b. It's still testing: it reports matches but doesn't act.
    c. It's off.

4. Encrypted files in a SharePoint library can't be found by search or matched by DLP. What is the likely cause?
    a. The label is wrong.
    b. Label integration for SharePoint and OneDrive isn't on.
    c. Co-authoring is off.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** [Book 20, Chapter 05](../../books/b20-information-protection/05-rights-management-and-recovery.md#how-recover-encrypted-content-through-a-super-user-just-in-time); disabling doesn't remove users, so the procedure removes them too.
2. **a.** [The guide's gate order](../../books/guides/information-protection-implementation.md#the-path-on-one-page).
3. **b.** [Book 20, Chapter 06](../../books/b20-information-protection/06-exchange-message-encryption.md#how-verify-brand-and-stage-message-encryption).
4. **b.** [Book 20, Chapter 07](../../books/b20-information-protection/07-sharepoint-and-onedrive.md#what-label-integration-changes).
:::

## Summary (2 minutes) {#ip-m3-summary}

Activate and stage the service on purpose; prove recovery and end it with the feature off; encrypt the approved mail scenarios by rule or label; and turn on label integration before anything scans SharePoint. **Federal requirements:** G5 to G7 support SC-12, SC-13, SC-28, SC-8, AC-3, AC-4, AC-5, AC-6 and AC-21, with KSI-SVC-SIN, KSI-SVC-ASM and KSI-IAM-JIT, as the guide's [Requirements and KSIs](../../books/guides/information-protection-implementation.md#requirements-and-ksis) table sets out; the agency's assessor decides whether a control is satisfied.

## Continue the path

[← Previous: Module 2 — Labels, publication and containers](02-labels-publication-and-containers.md) · [Path index](index.md) · [Next: Module 4 — DLP, auto-labeling and AI →](04-dlp-auto-labeling-and-ai.md)
