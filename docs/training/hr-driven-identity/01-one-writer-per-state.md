---
title: "Module 1: Name one writer for every account state"
description: "Gate G1 and workbook Chapter 01: keep the lifecycle rows of the writer register as reviewed JSON, check its shape, and scan the directory audit log for writes by anyone but the named writer. About 50 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 03"
last-reviewed: 2026-11-01
series-order: 1
---

# Module 1: Name one writer for every account state {.unnumbered}

*Part of the [HR-Driven Identity learning path](index.md). Gate G1 Writers. Workbook [Chapter 01](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md). About 50 minutes.*

## Introduction (3 minutes)

Your agency's HR feed sets an account's `active` value. A Lifecycle Workflows leaver can disable the same account. A help desk technician can still edit a user's organization code. Each of those is a writer, and when two of them write the same value, the later one wins. A late `active` true from the pipeline undoes the workflow's disable; a help desk edit moves a person's access without HR knowing.

In this module you fix that before any other gate: you name one writer, and a backstop, for every account-state transition and HR-mastered value, and you test the directory audit log against that list.

**The federal requirement.** This gate meets NIST SP 800-53 AC-2 and IA-4 for the register, and AU-6 for reviewing writes outside the named writer. The requirements and the evidence are in the [Gate 1 requirements table](../../books/guides/hr-driven-identity-implementation.md#step-1-name-one-writer-for-every-state-and-attribute) (under **Federal requirements and evidence** in Step 1) and in the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#federal-requirements-and-evidence).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain why one writer per account state comes before every other gate;
- read the lifecycle rows of the writer register and say which writer and backstop each names;
- run the register check (WR-01 to WR-09) and the audit-log scan (WS-01 to WS-04), and read their findings;
- say what the scan can't see, and what covers it.

## Prerequisites (1 minute)

- The [learning path's prerequisites](index.md#prerequisites).
- Python 3.10 or later and pytest, and a clone of the repository ([What you need for the labs](index.md#what-you-need-for-the-labs)).

## Unit 1: Why one writer comes first (8 minutes)

Read the guide's [Step 1](../../books/guides/hr-driven-identity-implementation.md#step-1-name-one-writer-for-every-state-and-attribute). Its table of lifecycle rows is the register you'll check in the lab: who creates the account, who enables it at hire, who disables it at separation, who deletes it, and who writes the hire date, the leave date, the manager and the certificate binding.

Then read why Book 03 treats a writer as an access decision:

- [Book 03, Chapter 06, Writers](../../books/b03-hr-identity/06-canonical-attribute-schema.md#writers): whoever can write a slot decides what a rule on it grants.
- [Book 03, Chapter 04, Operating rules](../../books/b03-hr-identity/04-attribute-authority.md#operating-rules): the pipeline's `active` value and Lifecycle Workflows' tasks can both write account state.
- The workbook's [Why this gate comes first](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#why-this-gate-comes-first), which ties the two together.

As you read, notice the row for deletion: the post-separation workflow writes it, and inbound provisioning never does.

## Unit 2: The register and the scan (6 minutes)

Read three sections of workbook Chapter 01:

- [What it leaves to you](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#what-it-leaves-to-you): what Learn's directoryAudits API gives you, and what you build yourself.
- [The checks](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#the-checks): the WR rules that check the register's shape, and the WS rules that test each audit record against it.
- [What the scan doesn't see](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#what-the-scan-doesnt-see): writes made in Active Directory for synced users.

Keep the rule table open during the lab; you'll match each finding to its rule.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#lab-1-fixtures-no-tenant). Work in `examples/hr-lifecycle`. The audit records are fictional.

1. List what the scan reads, and with what permission:

    ```bash
    python python/graph_export.py --task writers-scan --list
    ```

    ```text
    Task writers-scan: AuditLog.Read.All, Directory.Read.All
      GET /auditLogs/directoryAudits  [AuditLog.Read.All]
      GET /auditLogs/provisioning  [AuditLog.Read.All, Directory.Read.All]
    ```

2. Check the register:

    ```bash
    python python/writer_register.py check --register config/writer-register.json
    ```

    Expect `Register: 0 Finding, 0 Warn, 0 Info` and exit code 0.

3. Scan October's audit records:

    ```bash
    python python/writer_register.py scan --register config/writer-register.json --audit tests/fixtures/ch01/directory-audits.json --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01
    ```

    ```text
    Protected writes: 11 (writer 5, backstop 1, second writer 4, forbidden 1)
    Writers: 5 Finding, 1 Warn, 0 Info
    Written to out/ch01 (manifest.json lists every file's SHA-256)
    ```

    The exit code is 2, because the fixture holds findings.

4. Read the findings:

    ```bash
    python -c "import json; [print(r['Rule'], r['Severity'], r['Object'], '|', r['Issue']) for r in json.load(open('out/ch01/findings.json'))]"
    ```

    Expect four WS-01 Findings (a help desk disable, an Exchange administrator's leave-date edit, a help desk manager change and a fix-up script's organization code), one WS-04 Finding (a delete by inbound provisioning, which the register forbids) and one WS-02 Warn (the backstop enabled a hire). The workbook lists the six lines verbatim.

5. Read one saved query:

    ```bash
    python -c "import json; print(json.load(open('out/ch01/queries.json'))[2])"
    ```

    The third query is the `directoryAudits` filter for the `disabled-at-separation` row: `activityDisplayName eq 'Disable account'` within the window, allowed for `inbound-provisioning` and `lifecycle-workflows`. Module 7 runs these queries.

6. Run the tests:

    ```bash
    python -m pytest tests -q
    ```

    Expect `57 passed`. Delete `out` when you're done.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#lab-2-test-tenant) in a worldwide or GCC test tenant, never production.

- **What you do:** make two known writes in the admin center, export the audit window, confirm the `modifiedProperties` names the register expects, put your tenant's service principal IDs in a copy of the register, and scan. Both admin center changes should appear as WS-01.
- **Permissions:** a reader app with a certificate, holding `AuditLog.Read.All` and `Directory.Read.All` as application permissions with admin consent, and nothing else.
- **Back-out:** restore the test users' values, remove the two permissions, delete the reader app and its certificate, and delete the export and output folders.

Lab 2 matters more here than in most modules: the property names in the register aren't documented on Learn, and a wrong name makes the scan report silence that looks clean ([Dangers](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#dangers)).

## Knowledge check (5 minutes)

1. Your HR feed and the leaver workflow can both disable an account. What does the register record for the `disabled-at-separation` row?
    a. Both, as equal writers, so either can act first
    b. One writer, with the other recorded as its backstop
    c. Neither; account state is left to the help desk
    d. Whichever wrote it most recently in the audit log
2. The scan reports a WS-04 Finding for a deleted account. What happened?
    a. A writer the row forbids, inbound provisioning, deleted the account
    b. The backstop deleted the account before the writer did
    c. The delete failed and was retried
    d. The delete fell outside the scan's window
3. Which writes does the Entra audit-log scan not see?
    a. Writes by Lifecycle Workflows
    b. Writes by the HR provisioning app
    c. Writes made in Active Directory for synced users
    d. Writes by a help desk administrator in the admin center
4. Why must Lab 2 confirm each `auditProperty` name against a real record before the scan counts as evidence?
    a. Graph rejects a filter with an unknown property name
    b. Learn doesn't document the names, and a wrong one makes the scan report nothing for that value
    c. The names change every 30 days
    d. The register check fails until the names are confirmed

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** One writer per row, with a backstop that isn't the writer itself (WR-01, WR-06). Taught in [Step 1's lifecycle rows](../../books/guides/hr-driven-identity-implementation.md#step-1-name-one-writer-for-every-state-and-attribute) and [The checks](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#the-checks).
2. **a.** WS-04 flags a write by a writer the row forbids; the register forbids deletion by inbound provisioning. Taught in [The checks](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#the-checks).
3. **c.** AD writes are seen only by AD change auditing; the guide's interim path names the sync agent as a writer and reviews the OU ACLs. Taught in [What the scan doesn't see](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#what-the-scan-doesnt-see).
4. **b.** The property names are the program's reading, not Learn's, and silence looks clean. Taught in [Verified facts](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#verified-facts) and [Dangers](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#dangers).
:::

## Summary (2 minutes)

You checked a writer register's shape, scanned a month of audit records against it, and read the saved query Gate 7 runs. You saw four second writers, one forbidden delete and one backstop that acted first.

**The evidence an ISSO keeps** for Gate 1: the signed register with its lifecycle rows and the versioned scope filter; the `check` output; the scan's output folder with its manifest and the saved `queries.json`; and the AD auditing settings, which this code doesn't read. The full list is in the workbook's [Federal requirements and evidence](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md#federal-requirements-and-evidence).

**Next:** [Module 2: Run contractors from their own source](02-contractor-sources.md).
