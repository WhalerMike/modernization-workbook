---
title: "Module 13: Run the managed service account standard"
description: "The managed service account standard in the companion guide Service Accounts, with the developer workbook's Chapter 12: how every gMSA and dMSA is requested in the agency's system access management tool, approved in SailPoint, recorded in ServiceNow, created by a pipeline through Chapter 06's approved plan, watched with Defender for Identity, certified by its owners on its risk tier's cadence and retired after 90 days disabled; why machines run every step they can; a lab on the kit's fixtures; and a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 13"
series-order: 13
review-status: approved
reviewed-sha256: 7f9d393ba7788fd2bf0de81129dd84e07fc720e647ae7b2ea7b2615c59364ba5
last-reviewed: 2026-11-21
---
# Module 13: Run the managed service account standard {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). The companion guide's [managed service account standard](../../books/guides/service-account-migration.md#msa-standard), with workbook [Chapter 12](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-npi-module-13) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_13_Narrated) (about 15 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_13_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-13/Training_NPI_Module_13_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-13/Training_NPI_Module_13_Narrated.vtt).

**Also:** the chapter's narrated tour, about 12 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_12_MSA_Standard_Narrated).

## Introduction (3 minutes)

Module 12 moved one account by hand. This module is about every account after that: how a gMSA is asked for, approved, created, watched, attested and retired the same way each time, with the same evidence. The standard splits the work three ways. SailPoint approves, reached through the agency's system access management tool. ServiceNow records the change and the findings. Microsoft's tools create and enforce: Active Directory PowerShell through Chapter 06's approved plan, Group Policy, Defender for Identity and, when the workload moves, Microsoft Entra.

Take it after Modules 8 and 12.

**The federal requirement.** The standard's [steps](../../books/guides/service-account-migration.md#msa-standard-steps) each name what they support; these are the rows this module's lab produces evidence for:

| Step | Requirement it supports | KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| S1 Request | AC-2 Account Management; IA-4 Identifier Management | KSI-IAM-SNU; KSI-IAM-ELP, IAM-JIT | `request-check.json`, the SailPoint approval, the ServiceNow change |
| S6 Register | CM-8 System Component Inventory; AC-6 Least Privilege | KSI-PIY-GIV; KSI-IAM-ELP, IAM-JIT | `reconciliation.json` |
| S8 Attest | AC-2; AC-6(7) Review of User Privileges | KSI-IAM-SNU; KSI-IAM-AAM, IAM-JIT | `certification.json`, `servicenow-findings.json` |
| S10 Retire | AC-2(3) Disable Accounts | KSI-IAM-AAM, IAM-JIT, IAM-SUS | `retirement-list.csv`, the decommission ticket |

: The rows this module practices {.striped .hover}

## Learning objectives (1 minute)

By the end of this module you can:

- name who does what in the standard: the access management tool, SailPoint, ServiceNow, the pipeline and a person;
- give the standard's settings: name, OU, retriever group, encryption, interval, outbound-only, owners, cadence and the 90-day window;
- explain why machines run every step they can, and where people still must;
- run Chapter 12's checks on fixtures and read the findings, the Chapter 06 inputs, the certifications, the ServiceNow findings and the retirement list.

## Prerequisites (1 minute)

Modules 8 and 12, and PowerShell 7.1 or later with Pester 5. No tenant or domain.

## Unit 1: Who does what, and the settings (8 minutes)

Read the standard's [Who does what](../../books/guides/service-account-migration.md#msa-standard-roles) and [settings](../../books/guides/service-account-migration.md#msa-standard-settings) tables. Notice three things. SailPoint approves every request, whatever the risk tier, and never writes a gMSA. ServiceNow never approves the account. The pipeline, as `gmsa-msapipe`, holds only the delegated rights it needs, and a person still runs the dMSA steps, the uninstall and every delete.

## Unit 2: Machines run the steps (6 minutes)

Read the callout [Machines run the steps; people decide](../../books/guides/service-account-migration.md#msa-standard). Automation lines up with the federal requirements better than the same work done by hand in a console or portal: NIST SP 800-53 has AC-2(1), AC-2(3) and AC-2(4) for automated account management, disabling and auditing, FedRAMP's KSI-IAM-AAM is *Automating Account Management*, and CISA's Zero Trust Maturity Model makes automation and orchestration a cross-cutting capability. It still has limits: designated people approve, separation of duties keeps the approver, the pipeline's owner and the person who deletes apart, the authorizing official accepts the pipeline, and the pipeline's own identity is governed.

## Unit 3: The steps from request to retirement (8 minutes)

Read the standard's [steps](../../books/guides/service-account-migration.md#msa-standard-steps), S1 to S11. Follow one gMSA through them: requested and checked (S1), decided (S2), approved and recorded (S3), created by the plan (S4), installed and restricted (S5), aggregated and closed on a re-read (S6), watched (S7), certified (S8), handed over when an owner leaves (S9), and retired (S10).

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

Work in `examples/non-person-identity`. These are Chapter 12's [Lab 1](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md#lab-1-fixtures-no-domain) steps; the chapter shows each one's expected output.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/ch12/inputs -StandardPath tests/fixtures/ch12/standard.json -OutputPath out/msa-standard -AsOf 2026-11-20

Get-Content out/msa-standard/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, ObjectKey

Get-Content out/msa-standard/kerberos-replatform.csv
Get-Content out/msa-standard/password-retrievers.json

Get-Content out/msa-standard/certification.json -Raw | ConvertFrom-Json | Format-Table Account, RiskTier, LastCertifiedOn, DueOn, Status
Get-Content out/msa-standard/servicenow-findings.json -Raw | ConvertFrom-Json | Format-Table drift_class, severity, account_name, attribute, observed_value

Import-Csv out/msa-standard/retirement-list.csv | Format-Table SamAccountName, DisabledOn, LastLogon, DaysDisabled, Status

Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

**Step 1: Run the standard's checks.**

```powershell
./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/ch12/inputs -StandardPath tests/fixtures/ch12/standard.json -OutputPath out/msa-standard -AsOf 2026-11-20
```

Look for `Requests: 2 passed (REQ-2026-0201, REQ-2026-0202); 3 held`.

**Step 2: Read the findings.**

```powershell
Get-Content out/msa-standard/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, ObjectKey
```

Find the three findings on `gmsa-ops$`: what does each one mean?

**Step 3: Read what goes to Chapter 06.**

```powershell
Get-Content out/msa-standard/kerberos-replatform.csv
Get-Content out/msa-standard/password-retrievers.json
```

Check that both rows carry a `RequestId` and a `ChangeRecord`, and that only the gMSA has a retriever group.

**Step 4: Read the certifications and the ServiceNow findings.**

```powershell
Get-Content out/msa-standard/certification.json -Raw | ConvertFrom-Json | Format-Table Account, RiskTier, LastCertifiedOn, DueOn, Status
Get-Content out/msa-standard/servicenow-findings.json -Raw | ConvertFrom-Json | Format-Table drift_class, severity, account_name, attribute, observed_value
```

**Step 5: Read the retirement list.**

```powershell
Import-Csv out/msa-standard/retirement-list.csv | Format-Table SamAccountName, DisabledOn, LastLogon, DaysDisabled, Status
```

Only one account is a `DeleteCandidate`. Who deletes it, and through what?

**Step 6: Clean up.**

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test domain (5 minutes to read)

Read Chapter 12's [Lab 2](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md#lab-2-test-domain-and-exports). It runs the same checks on a test domain's exports from SailPoint and Defender for Identity, with a live read of the gMSAs. Run it only in a test domain, after Chapter 06's Lab 2.

## Knowledge check (5 minutes)

1. Which system approves a request for a new gMSA?
    a. ServiceNow, for low-risk requests
    b. SailPoint, for every request, reached through the agency's system access management tool
    c. The pipeline, once the plan's hash matches
    d. Domain Admins
2. Who creates a gMSA in production under the standard?
    a. A Domain Admin, by hand
    b. The pipeline, as `gmsa-msapipe`, running Chapter 06's approved plan with only the delegated rights
    c. SailPoint's Active Directory connector
    d. ServiceNow's Active Directory spoke
3. A gMSA's retrievers are `HOST01$` and `HOST02$`. What does the standard say?
    a. That's fine for two hosts
    b. Retrievers are always one domain local group, `DL-gMSA-<app>-Hosts`
    c. Add Domain Computers instead
    d. Retrievers don't matter once the gMSA exists
4. Why does the standard have machines run every step they can?
    a. Because people may not approve accounts
    b. Because automated account management, disabling and auditing are what NIST's AC-2 enhancements and FedRAMP's KSI-IAM-AAM describe, and a script leaves a complete record; people still decide, approve and accept risk
    c. Because the portals are retired
    d. Because automation is enough for an assessor on its own
5. An R2 gMSA was last certified seven months ago. What does Chapter 12 report?
    a. Nothing: R2 is certified once a year
    b. NPI-STD-20, certification overdue: R2 is certified every six months
    c. A delete candidate
    d. A drift finding

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [Who does what](../../books/guides/service-account-migration.md#msa-standard-roles) ([WD-162](../../about/decision-register.md#wd-162)).
2. **b.** Taught in [Who does what](../../books/guides/service-account-migration.md#msa-standard-roles) ([WD-163](../../about/decision-register.md#wd-163)); SailPoint never writes a gMSA, and ServiceNow's Active Directory spoke isn't used.
3. **b.** Taught in [the settings](../../books/guides/service-account-migration.md#msa-standard-settings) ([WD-160](../../about/decision-register.md#wd-160)).
4. **b.** Automation supports the requirements and provides evidence for them; the assessor decides. Taught in [Machines run the steps; people decide](../../books/guides/service-account-migration.md#msa-standard).
5. **b.** Taught in [the settings](../../books/guides/service-account-migration.md#msa-standard-settings) ([WD-166](../../about/decision-register.md#wd-166)) and Chapter 12's [checks](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md#the-code-what-examplesnon-person-identity-adds).
:::

## Summary (2 minutes)

The standard makes every managed service account the same: asked for in the agency's system access management tool, approved in SailPoint, recorded in ServiceNow, created by the pipeline, restricted with Group Policy, watched with Defender for Identity, certified by its two owners on its risk tier's cadence, and retired after 90 days disabled by a person. Chapter 12 checks each of those steps on every run and writes the evidence. Next: [the learning path's index](index.md).
