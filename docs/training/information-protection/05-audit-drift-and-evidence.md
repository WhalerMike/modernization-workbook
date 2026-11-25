---
title: "Module 5: Audit, drift and evidence"
description: "Guide Steps 10 and 12: audit on, retained and routed, proved by synthetic events found in time; insider risk and communication compliance only under a charter; the monthly baseline export compared with the last approved one, with every difference explained by a change ticket or treated as drift; the metrics reported honestly; and the hashed evidence and go/no-go that take the kit from test to production. Lab 1 runs a month on the kit's fixtures; Lab 2 reads audit and searches the synthetic events in a test tenant."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 20"
series-order: 5
review-status: approved
reviewed-sha256: f39fca9f028fde4b921ddbc23d65ac1297b1e735c6e50456f5fe98aa5292dfbf
last-reviewed: 2026-11-25
---
# Module 5: Audit, drift and evidence {.unnumbered}

*Part of the [Information Protection learning path](index.md). Guide [Step 10](../../books/guides/information-protection-implementation.md#step-10-audit-insider-risk-and-communication-compliance) and [Step 12](../../books/guides/information-protection-implementation.md#step-12-operations-and-evidence), and the [synthetic events](../../books/guides/information-protection-implementation.md#synthetic-events). About 45 minutes, plus Lab 1 and Lab 2.*

## Introduction (3 minutes) {#ip-m5-introduction}

Everything in the earlier modules is proved through the audit log, and kept working by noticing when it changes. This module covers the audit floor and the test that shows it works, the charter that comes before anyone watches people, the monthly drift run, and the evidence an assessor reads.

## Learning objectives (1 minute) {#ip-m5-objectives}

By the end of this module, you'll be able to:

- confirm audit is on in the right shell, retained as the evidence contract needs, and routed to the log platform;
- run the synthetic-event test and show the events were found in time;
- explain why insider risk and communication compliance wait for a charter;
- find the month's drift, tell explained from unexplained, and file the evidence with its go/no-go.

## Prerequisites (1 minute) {#ip-m5-prerequisites}

[Module 4](04-dlp-auto-labeling-and-ai.md).

## Unit 1: The audit floor and the charter (10 minutes) {#ip-m5-unit-1}

Read [Book 20, Chapter 10](../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md): [audit is the floor](../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#audit-is-the-floor), [turning it on, retaining and testing it](../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#how-turn-on-retain-and-test-purview-audit), and [the charter comes first](../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#the-charter-comes-first). Audit (Standard) and Audit (Premium) with one-year and ten-year retention are available in GCC; audit search enhancements are on the engineering backlog, and several insider risk templates are in development. Learn gives no guaranteed latency for audit search, so the program sets a target and measures against it. The developer workbook's [Chapter 07](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md) records the search with its test.

## Unit 2: Drift and metrics (10 minutes) {#ip-m5-unit-2}

Read [Book 20, Chapter 12](../../books/b20-information-protection/12-operations-and-evidence.md): [change control](../../books/b20-information-protection/12-operations-and-evidence.md#change-control-for-information-protection), [drift detection](../../books/b20-information-protection/12-operations-and-evidence.md#drift-detection) and [metrics](../../books/b20-information-protection/12-operations-and-evidence.md#metrics). Drift is a difference no change ticket explains. The super user feature turning on and audit turning off are the two that can't wait. A metric that nothing measured is "not measured", never zero. The developer workbook's [Chapter 08](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md) runs both.

## Unit 3: Evidence and the go/no-go (6 minutes) {#ip-m5-unit-3}

Read the developer workbook's [Chapter 09](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md): the preflight, the scheduled run, and why production waits for the test stage's evidence. Each run becomes a record with its controls and KSIs, the hashes of its files and of the record before it. A run that found problems is evidence, but it isn't a go.

## Exercise: Lab 1, fixtures, no tenant (25 minutes) {#ip-m5-lab-1}

Run the developer workbook's [Chapter 07 Lab 1](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md#lab-1-fixtures-no-tenant), [Chapter 08 Lab 1](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md#lab-1-fixtures-no-tenant) and [Chapter 09 Lab 1](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md#lab-1-stand-ins-no-tenant). They have the exact commands and what each printed; this module doesn't repeat them.

- **What you'll see:** a label removal found 5.5 hours after the test started, past the four-hour target; eight differences between October and November, two explained by tickets and six not, two of them P1; a month's run with nine evidence records and a go/no-go that holds.
- **What to look for:** the metrics page names every metric the kit doesn't compute, and where its data comes from.
- **Back-out:** each lab ends by deleting `out`.

## Exercise: Lab 2, a test tenant {#ip-m5-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Read audit ingestion, in Exchange Online PowerShell
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
Get-AdminAuditLogConfig | Format-List UnifiedAuditLogIngestionEnabled

# Step 2: Search the synthetic events
Search-UnifiedAuditLog -StartDate (Get-Date).AddHours(-4) -EndDate (Get-Date) -UserIds '<pilot-user-upn>' -Operations FileSensitivityLabelApplied,FileSensitivityLabelRemoved,SensitivityLabelApplied,SensitivityLabelRemoved -ResultSize 5000 | Select-Object CreationDate,UserIds,Operations,RecordType | Format-Table -AutoSize

# Step 3: Check that changes to auditing are visible
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -Operations Set-AdminAuditLogConfig -ResultSize 5000 | Select-Object CreationDate,UserIds,Operations,AuditData
Disconnect-ExchangeOnline -Confirm:$false

# Step 4: Read the retention policies, in Security & Compliance PowerShell
Connect-IPPSSession -UserPrincipalName <admin-upn>
Get-UnifiedAuditLogRetentionPolicy | Sort-Object -Property Priority | Format-List Priority,Name,Description,RecordTypes,Operations,UserIds,RetentionDuration

# Step 5: Back it out
Disconnect-ExchangeOnline -Confirm:$false
```

:::

<!-- labs:end -->

You read audit and its retention, search the synthetic events and check that auditing itself hasn't been changed, as the guide's G10 and G12 Validate steps do. Every step reads.

- **You need:** a test tenant; an account with View-Only Audit Logs or Audit Logs, and Compliance Administrator, through PIM; a test user who ran the synthetic-event test (apply a label in Office for the web and remove it) in the last four hours.
- **You'll replace:** `<admin-upn>` and `<pilot-user-upn>` (the test user).

1. **Read audit ingestion, in Exchange Online PowerShell.**

    ```powershell
    Connect-ExchangeOnline -UserPrincipalName <admin-upn>
    Get-AdminAuditLogConfig | Format-List UnifiedAuditLogIngestionEnabled
    ```

    Expected result, as the guide states it: `True`.

2. **Search the synthetic events.**

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddHours(-4) -EndDate (Get-Date) -UserIds '<pilot-user-upn>' -Operations FileSensitivityLabelApplied,FileSensitivityLabelRemoved,SensitivityLabelApplied,SensitivityLabelRemoved -ResultSize 5000 | Select-Object CreationDate,UserIds,Operations,RecordType | Format-Table -AutoSize
    ```

    Expected result: the applied and removed events. If one is missing, search again later before you record a gap.

3. **Check that changes to auditing are visible.**

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -Operations Set-AdminAuditLogConfig -ResultSize 5000 | Select-Object CreationDate,UserIds,Operations,AuditData
    Disconnect-ExchangeOnline -Confirm:$false
    ```

    Expected result: every result has a change ticket.

4. **Read the retention policies, in Security & Compliance PowerShell.**

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    Get-UnifiedAuditLogRetentionPolicy | Sort-Object -Property Priority | Format-List Priority,Name,Description,RecordTypes,Operations,UserIds,RetentionDuration
    ```

    Expected result: each retention policy the decision record names, with its duration and priority.

5. **Back it out.** Nothing changed in the tenant. Disconnect:

    ```powershell
    Disconnect-ExchangeOnline -Confirm:$false
    ```

## Knowledge check (5 minutes) {#ip-m5-knowledge-check}

1. The label-applied event isn't found an hour after the test. What do you do?
    a. Record audit as failed.
    b. Search again later: Learn gives no guaranteed latency; record the time it was found against the target.
    c. Turn auditing off and on.

2. Can insider risk management be configured before the charter is signed?
    a. Yes, in simulation.
    b. No: the charter settles the privacy, legal and labor-relations questions first.
    c. Only for departing users.

3. A label's rights changed this month, and a change ticket approved it two weeks ago. How does the drift run report it?
    a. As drift.
    b. As explained, with the ticket.
    c. It ignores label changes.

4. The test stage's go/no-go fails because the labels check found problems. Can production start?
    a. Yes: the run completed.
    b. No: close the findings, run again, and ask again.
    c. Yes, if the ISSO signs.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** [Chapter 07 of the developer workbook](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md#what-it-leaves-to-you).
2. **b.** [Book 20, Chapter 10](../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#the-charter-comes-first).
3. **b.** [Chapter 08 of the developer workbook](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md#the-code).
4. **b.** [Chapter 09 of the developer workbook](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md#the-code).
:::

## Summary (2 minutes) {#ip-m5-summary}

Audit is the floor, proved by synthetic events found in time; people are watched only under a charter; drift is what no ticket explains; and production starts only from test evidence that passes. **Federal requirements:** G10 and G12 support AU-2, AU-12, AU-6, AU-11, SI-4, AC-5, PM-12, CM-3, CA-7 and IR-4, with KSI-MLA-LET, KSI-MLA-OSM, KSI-IAM-ELP, KSI-SVC-ACM, KSI-CMT-LMC and KSI-INR-RIR, as the guide's [Requirements and KSIs](../../books/guides/information-protection-implementation.md#requirements-and-ksis) table sets out; the agency's assessor decides whether a control is satisfied.

## Continue the path

[← Previous: Module 4 — DLP, auto-labeling and AI](04-dlp-auto-labeling-and-ai.md) · [Path index](index.md)
