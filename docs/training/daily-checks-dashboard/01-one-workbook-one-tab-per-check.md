---
title: "Module 1: One workbook, one tab per daily check"
description: "Guide Steps 1 and 2: what Azure and Microsoft 365 offer for dashboards and why the design is one Azure Monitor workbook in the Sentinel workspace; the ten daily checks of the operator runbook and the table or portal each one lives in; GCC availability source by source; and the workbook's template kept as reviewed code, with a validator that catches portal edits and embedded IDs. Lab 1 runs the manifest and the validator on fixtures; Lab 2 lists a test workspace's tables and round-trips the template through the portal. About 40 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 1
review-status: approved
reviewed-sha256: a5a03ca975066838db37c80647b62efe60454e1658c5532afe4fec6ec04d6cd2
last-reviewed: 2026-11-19
---
# Module 1: One workbook, one tab per daily check {.unnumbered}

*Part of the [Daily Checks Dashboard learning path](index.md). Guide [Step 1](../../books/guides/daily-checks-dashboard-implementation.md#step-1) and [Step 2](../../books/guides/daily-checks-dashboard-implementation.md#step-2). About 40 minutes, plus Lab 2.*

**Watch:** the narrated deck for this module (about 5 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_DC_Module_1_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_DC_Module_1_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-dc-module-1) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dc-module-1/Training_DC_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dc-module-1/Training_DC_Module_1_Narrated.vtt). The deck files join the next edition.

## Introduction (3 minutes) {#dc-m1-intro}

Each morning the operator runbook asks for ten checks: synchronization, telemetry completeness, Entra Health, risky users and sign-ins, emergency access sign-ins, noncompliant devices, ungoverned grants, DLP and label alerts, catalog tasks, and the log review queue. Most of their data is already in the Sentinel workspace. In this module you see which checks a workbook can show and from which table, which ones it can only link to, and how the workbook is kept as a reviewed file rather than something edited in the portal.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/daily-checks-dashboard-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| CA-7, SI-4: the monitoring each check does is visible, and each tab's tables answer | KSI-MLA-EVC, KSI-MLA-LET | The reachability record (Module 2) |
| CM-2, CM-3: the template is the reviewed build and carries no IDs | KSI-SVC-ACM, KSI-CMT-LMC | The validation record and the template's SHA-256 |

The steps support these controls and provide evidence for them; the assessor decides whether each is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself.

## Learning objectives (1 minute) {#dc-m1-objectives}

After this module, you'll be able to:

- name the dashboard options in Azure and say why the design is one workbook;
- say, for each daily check, its table or its link-out, and how well it fits;
- give each source's GCC availability;
- build the template from the manifest and validate a portal export.

## Unit 1: Dashboards in Azure and Microsoft 365 (6 minutes) {#dc-m1-options}

Read the guide's [Dashboards in Azure and Microsoft 365](../../books/guides/daily-checks-dashboard-implementation.md#options). Microsoft's guidance compares workbooks, portal dashboards, Dashboards with Grafana (a preview), Azure Managed Grafana and Power BI; workbooks read the widest set of Azure data and can be managed as ARM templates. Microsoft 365 has built-in views in each admin center, but no single custom dashboard: a view across them needs their logs in Log Analytics. So the design is one workbook in the Sentinel workspace, and a link out where a check's data stays in another portal.

## Unit 2: The ten tabs and where each lives (10 minutes) {#dc-m1-tabs}

Read the guide's [What each daily check can show, and from where](../../books/guides/daily-checks-dashboard-implementation.md#tabs) and [GCC availability](../../books/guides/daily-checks-dashboard-implementation.md#availability). Eight tabs query tables; two (Entra Health and the ITSM task queue) link out. Two of the eight are partial: the grants tab lists grants but the match to a ticket stays in the ITSM tool, and the log review tab shows the queue while the review stays a recorded procedure. Each source's GCC availability is from Learn; Entra Health monitoring and Connect Health are *not yet specified*, so their tabs are link-outs.

## Unit 3: The template as code (8 minutes) {#dc-m1-template}

Read the guide's [Step 2](../../books/guides/daily-checks-dashboard-implementation.md#step-2) and [Chapter 02](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md)'s *The code*. The template is built from the manifest and one KQL file per query. Its validator runs ten checks; the ones that matter most in practice are DC-V-04 (a widened look-back), DC-V-05 (a query on another workspace), DC-V-06 (the banner) and DC-V-10 (IDs an export embeds, which Learn says to mask).

## Exercise: Lab 1, fixtures, no tenant {#dc-m1-lab-1}
*About 15 minutes per chapter. No tenant: it runs on a laptop.*

Follow these as written; they aren't repeated here:

- [Chapter 01, Lab 1](../../project-plans/developer-workbooks/daily-checks/01-the-daily-checks-and-where-each-lives.md#lab-1-fixtures-no-tenant): the ten tabs, a link-out tab, a partial tab, the emergency access query and the freshness limits.
- [Chapter 02, Lab 1](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md#lab-1-fixtures-no-tenant): the template is the build, it validates, and an edited export fails four checks.

## Exercise: Lab 2, a test workspace {#dc-m1-lab-2}
*Not timed. Not run by the authors. Never production.*

- [Chapter 01, Lab 2](../../project-plans/developer-workbooks/daily-checks/01-the-daily-checks-and-where-each-lives.md#lab-2-a-test-workspace): list which of the manifest's tables the test workspace has.
- [Chapter 02, Lab 2](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md#lab-2-a-test-workspace): open the template in the portal, save a test copy, edit it, export it and validate the export; then delete the copy.

## Knowledge check (5 minutes) {#dc-m1-check}

1. Why is the design one Azure Monitor workbook rather than Dashboards with Grafana?
    a. Grafana can't read Log Analytics.
    b. Dashboards with Grafana is a preview, and the workbook reads the same data and can be kept as an ARM template.
    c. Workbooks are the only option in commercial Azure.

2. Entra Health monitoring alerts are a daily check. What does their tab show?
    a. A query over `SigninLogs`.
    b. A link out to the Microsoft Entra admin center, because the alerts aren't in Log Analytics and their GCC availability is not yet specified.
    c. Nothing; the check is dropped.

3. The grants tab lists a consent from yesterday. Is the grant governed?
    a. Yes, because it appears on the tab.
    b. Not known from the tab: the match to a ticket happens in the ITSM tool, and a grant with no ticket opens a finding.
    c. No, every listed grant is ungoverned.

4. An export from the portal has the workspace's path in `fallbackResourceIds`. Which check fails?
    a. DC-V-10: the template carries a subscription path; the deployment plan fills IDs per environment.
    b. DC-V-02.
    c. None; the portal adds it.

5. Why is the devices tab's freshness limit 48 hours?
    a. To hide late data.
    b. Intune exports compliance once every 24 hours, and it can take up to 48 hours to arrive.
    c. Because devices check in every two days.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [options table](../../books/guides/daily-checks-dashboard-implementation.md#options).
2. **b.** See Unit 2 and the guide's [availability table](../../books/guides/daily-checks-dashboard-implementation.md#availability).
3. **b.** See Unit 2 and the guide's [tab table](../../books/guides/daily-checks-dashboard-implementation.md#tabs).
4. **a.** See Unit 3 and [Chapter 02](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md).
5. **b.** See Unit 2 and the guide's [Step 1](../../books/guides/daily-checks-dashboard-implementation.md#step-1).
:::

## Summary (2 minutes) {#dc-m1-summary}

You placed every daily check on a tab or a link-out, gave each source its GCC availability, and kept the workbook as a reviewed template that a validator checks. **Evidence an ISSO keeps from this module:** the validation record (`results.json` and the template's SHA-256), recorded in Module 2.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, Reading it, deploying it and keeping the evidence →](02-reading-deploying-and-the-evidence.md)
:::
