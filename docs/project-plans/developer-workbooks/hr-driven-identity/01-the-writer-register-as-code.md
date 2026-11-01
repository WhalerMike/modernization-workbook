---
title: "Chapter 01 — The Writer Register as Code"
description: "Keep the lifecycle rows of the writer register as reviewed JSON, one writer and a backstop for every account-state transition and HR-mastered value, check the register's shape, then scan the Microsoft Entra directory audit log for second writers and write the saved audit queries Gate 7 runs, starting from Learn's directoryAudits API and its audit activity list and adding what they leave to you: who is allowed to write what, the test that says so for every record, and evidence the ISSO can file, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 74df3b51e38f08c0f68f68a69a639770b3e14b1c9e1d9a1960973a6efdeb2ac4
last-reviewed: 2026-11-01
---
# Chapter 01 — The Writer Register as Code

*A rule that reads an attribute hands the decision to whoever can write it. The register names that writer; the audit log says whether anyone else did.*

::: {.callout-note}
## In this chapter
The code behind the guide's Gate 1 and the plan's tasks I1.2 and I1.4: one recorded writer for every account-state transition and every HR-mastered value, the other write paths removed, and an audit query saved for each protected value. You start with Learn's directoryAudits API and its list of audit activities, which tell you what the log records and how to read it. Then you use `examples/hr-lifecycle` for what they leave to you: the register as reviewed JSON, a check of its shape, a scan that tests every protected write against the register, and the saved queries. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can keep the lifecycle rows of the writer register as a reviewed file, prove the file is well formed, and show, from the directory audit log, every write to a protected value that didn't come from the named writer or its backstop. For each rule you can say whether it is Learn's contract, Book 03's design or the program's own guidance.

**Audience.** Developers who build the HR lifecycle's checks, the data architect who owns the register, and the identity engineers who remove the other write paths. You should read Python and JSON. You don't need a tenant until Lab 2.

## Why this gate comes first

The guide's [Step 1](../../../books/guides/hr-driven-identity-implementation.md#step-1-name-one-writer-for-every-state-and-attribute) names one writer for every state and value, and every later gate leans on it: a late `active` true from the pipeline undoes a workflow's disable, and a help desk edit to an organization code moves a person's access without HR knowing. Book 03 explains why: the pipeline's `active` value and Lifecycle Workflows' enable, disable and delete tasks can both write account state ([Book 03, Chapter 04](../../../books/b03-hr-identity/04-attribute-authority.md#operating-rules)), and whoever can write a slot decides what a rule on it grants ([Book 03, Chapter 06](../../../books/b03-hr-identity/06-canonical-attribute-schema.md#writers)). The unauthorized-write drift class reads the audit log for exactly this ([Book 03, Chapter 11](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory)). This chapter doesn't restate the design; it makes it checkable.

### Which cloud, for this read

The scan reads two Graph collections: `GET /auditLogs/directoryAudits` and `GET /auditLogs/provisioning`. Both are listed for the global service, US Government L4 (GCC High) and US Government L5 (DoD).[^hw01-audits][^hw01-prov] GCC uses `graph.microsoft.com`; GCC High uses `graph.microsoft.us` and DoD `dod-graph.microsoft.us`.[^hw01-deployments] `graph_export.py` takes the cloud as an argument and has no default. Entra keeps audit records for 30 days with P1 or P2, so the export has to run on a schedule well inside that window, and the logs should already be leaving Entra for the agency's store, as the guide's prerequisites require ([Book 03, Chapter 11](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

## Start with Microsoft's procedure

### What Microsoft gives you

Learn's *List directoryAudits* page gives the read: `GET /auditLogs/directoryAudits`, least-privileged permission `AuditLog.Read.All` for delegated and application access, Reports Reader, Security Reader or Security Administrator for a delegated caller, and `$filter` with `eq`, `ge`, `le` and `startswith`.[^hw01-audits] Its example shows the record: `activityDisplayName`, `activityDateTime`, `result`, `initiatedBy` with either an `app` (with `servicePrincipalId`) or a `user`, and `targetResources` with `modifiedProperties`. Learn's audit activity reference names the Core Directory user activities this chapter watches: `Add user`, `Update user`, `Enable account`, `Disable account`, `Delete user` and `Set user manager`.[^hw01-activities] *List provisioningObjectSummary* gives the provisioning log, with `AuditLog.Read.All` and `Directory.Read.All`.[^hw01-prov]

There is no Microsoft sample for this task: Learn gives the API and the activity names, not a test of who may write what. None is pinned.

### What it leaves to you

Each row is pinned by a test in `tests/test_writers_and_contractors.py` or `tests/test_core.py`.

| Learn gives | What it leaves to you | What `examples/hr-lifecycle` adds | Test |
|---|---|---|---|
| Every write, with its initiator | Which identity may write which value | `config/writer-register.json`: one writer and a backstop per row, writers as groups of service principal IDs | `test_the_shipped_register_is_clean`, `test_register_shape_rules` |
| One `Enable account` activity | Two lifecycle rows (enable at hire, re-enable on cancellation) that must agree on one writer | WR-07, and a record counted once | `test_rows_for_one_audited_change_must_agree_on_the_writer`, `test_one_enable_record_counts_once` |
| Records for every change, successful or not | The test of each successful protected write against the register | WS-01 (second writer), WS-02 (backstop acted), WS-04 (forbidden writer) | `test_scan_finds_second_writers_and_the_forbidden_delete` |
| `Update user` for any property | Which property changes are protected | Rows matched on `modifiedProperties`; failures, unprotected properties and records outside the window ignored | `test_scan_ignores_failures_unprotected_changes_and_the_window` |
| `$filter` operators | The saved audit query per protected value, for Gate 7 | `queries.json`, one `directoryAudits` filter per row | `test_saved_queries_use_the_filters_learn_lists` |
| A permission per API page | Least privilege per task, GET only | `config/calls.json`, checked against each task's declaration | `test_every_call_is_a_get_and_every_task_declares_exactly_its_calls` |
| A response | Evidence nobody edited | An output folder with a SHA-256 per file, written once | `test_output_is_written_once_with_a_hash_per_file` |

**The verdict.** Use Learn's API and activity names as they are; build the register and the test of each record against it.

## The code: what `examples/hr-lifecycle` adds

What exists already isn't rebuilt. The feed that sets `active` and the date carriers is the middleware of [Book 19, Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md) in [`examples/hcm-entra`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra). The values themselves are measured by the validation kit: **VK-HR-04** (duplicate `employeeId`) and **VK-HR-07** (fill rate of the key, worker type, manager and coded slots), whose anatomy is [Book 19, Chapter 03](../../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md). Neither says who wrote a value, which is what this chapter adds: `config/writer-register.json`, `python/writer_register.py` and the `writers-scan` task in `config/calls.json`. The client pattern, one cloud table and a declared call list with no default cloud, is [Book 19, Chapter 02](../../../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md).

### The register

The file holds the guide's lifecycle rows. Each row has an `id`, the audited `activity`, an optional `auditProperty` (the `modifiedProperties` name for an `Update user` record), one `writer`, an optional `backstop`, and, for deletion, a `forbidden` list. Writers are named groups: `inbound-provisioning` (the HR app and the contractor-source app, through one middleware), `lifecycle-workflows`, `cms-integration` (Gate 5's binding writer) and the interim `ad-sync`. The file also records the register's version, who signed it and when, and the versioned scope filter, as the guide's step 2 asks.

The `auditProperty` names (`EmployeeHireDate`, `EmployeeLeaveDateTime`, `ExtensionAttribute10`, `ExtensionAttribute11`, `CertificateUserIds`) aren't documented on Learn. They are the program's best reading, and Lab 2 confirms them against real records before the scan is trusted (verification log, row 9).

### The checks

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| WR-01 | Finding | A row with no single writer (a list or nothing), or a row twice | Book 03, Chapter 06: one writer per value |
| WR-02 | Finding | A writer or backstop not defined under `writers` | *Design guidance* |
| WR-03 | Warn | A writer with no identities, so its writes can't be attributed | *Design guidance* |
| WR-04 | Finding | A required account-state transition with no row | The guide's Step 1 table |
| WR-05 | Finding | Deletion written by inbound provisioning | The guide: delete through the post-separation workflow, never `/bulkUpload` |
| WR-06 | Finding | A backstop that is the writer itself | *Design guidance* |
| WR-07 | Finding | Rows for the same audited change that name different writers | *Design guidance* |
| WR-08 | Warn | The register isn't recorded as signed | The guide: the ISSO keeps the signed register |
| WR-09 | Warn | The scope filter has no version | The guide's step 2 |
| WS-01 | Finding | A protected write by an identity that is neither writer nor backstop | Book 03, Chapter 11: unauthorized write |
| WS-02 | Warn | A protected write by the backstop | *Design guidance*: the writer should have acted first |
| WS-04 | Finding | A write by a writer the row forbids | The guide's Step 1 table |

The scan reads only successful records inside the window, takes the first `app.servicePrincipalId` or `user.id` as the initiator, and matches an activity-only row (enable, disable, delete, manager) once per record, so an enable isn't counted against both the hire and the cancellation rows.

The `writers-scan` task needs two permissions, each the least-privileged for its call:

| Call | Least-privileged permission | Delegated role |
|---|---|---|
| `GET /auditLogs/directoryAudits` | `AuditLog.Read.All`[^hw01-audits] | Reports Reader, Security Reader or Security Administrator |
| `GET /auditLogs/provisioning` | `AuditLog.Read.All` and `Directory.Read.All`[^hw01-prov] | Reports Reader, Security Reader, Global Reader and others Learn lists |

### What the scan doesn't see

The Entra audit log records writes made in Entra ID. For synced users, the slots are mastered in Active Directory, and AD writes are seen only by AD change auditing; the register names the provisioning agent's gMSA as `ad-sync` and the guide's interim path reviews the OU ACLs every quarter. This scan doesn't read AD. *Design guidance.*

### The tests

This chapter's tests are the nine Chapter 01 tests in `tests/test_writers_and_contractors.py`, with the ten shared tests in `tests/test_core.py` (the call list, the cloud table, the output folder and the GET-only export). All 57 tests in the kit pass under Python 3.10 or later, with no package, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below run the example against fictional audit records shaped like Learn's example. They show what the code does, not that a tenant writes the same property names. Review the code and the register, and run Lab 2 in a test tenant, before the scan is trusted as evidence.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later. Work in `examples/hr-lifecycle`.

1. **List what the scan reads, and with what permission:**

   ```bash
   python python/graph_export.py --task writers-scan --list
   ```

   ```text
   Task writers-scan: AuditLog.Read.All, Directory.Read.All
     GET /auditLogs/directoryAudits  [AuditLog.Read.All]
     GET /auditLogs/provisioning  [AuditLog.Read.All, Directory.Read.All]
   ```

2. **Check the register:**

   ```bash
   python python/writer_register.py check --register config/writer-register.json
   ```

   `Register: 0 Finding, 0 Warn, 0 Info`, exit code 0.

3. **Scan October's audit records:**

   ```bash
   python python/writer_register.py scan --register config/writer-register.json --audit tests/fixtures/ch01/directory-audits.json \
       --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01
   ```

   ```text
   Protected writes: 11 (writer 5, backstop 1, second writer 4, forbidden 1)
   Writers: 5 Finding, 1 Warn, 0 Info
   Written to out/ch01 (manifest.json lists every file's SHA-256)
   ```

   The exit code is 2. The folder holds `findings.json`, `writes.json` (every protected write with its verdict) and `queries.json`.

4. **Read the findings:**

   ```bash
   python -c "import json; [print(r['Rule'], r['Severity'], r['Object'], '|', r['Issue']) for r in json.load(open('out/ch01/findings.json'))]"
   ```

   ```text
   WS-01 Finding casey.ng@contoso.example | disabled-at-separation written by pat.helpdesk@contoso.example, not by inbound-provisioning
   WS-01 Finding morgan.lee@contoso.example | employeeLeaveDateTime written by sam.exchange@contoso.example, not by inbound-provisioning
   WS-01 Finding drew.park@contoso.example | manager written by pat.helpdesk@contoso.example, not by inbound-provisioning
   WS-01 Finding quinn.ross@contoso.example | orgCode written by OrgCode fix-up script, not by inbound-provisioning
   WS-04 Finding blake.ito@contoso.example | deleted-at-disposition written by inbound-provisioning, which the register forbids
   WS-02 Warn jordan.diaz@contoso.example | enabled-at-hire written by the backstop (lifecycle-workflows); confirm the writer (inbound-provisioning) acted or was late
   ```

   Three records in the fixture aren't counted: a help desk `Update user` that changed only the department and job title (not protected in this register), a failed disable, and a November disable outside the window.

5. **Read one saved query:**

   ```bash
   python -c "import json; print(json.load(open('out/ch01/queries.json'))[2])"
   ```

   ```text
   {'allowed': ['inbound-provisioning', 'lifecycle-workflows'], 'graphFilter': "activityDateTime ge 2026-10-01T00:00:00Z and activityDateTime le 2026-10-31T23:59:59Z and activityDisplayName eq 'Disable account'", 'matchProperty': None, 'row': 'disabled-at-separation'}
   ```

6. **Run the tests:**

   ```bash
   python -m pytest tests -q
   ```

**Expected result:** `57 passed`. Delete `out` when you're done.

## Lab 2: test tenant

*Not run by the authors.* Use a test tenant in the worldwide or GCC cloud, never production.

1. **Register the reader app** with a certificate, and grant `AuditLog.Read.All` and `Directory.Read.All` as application permissions with admin consent, and nothing else.
2. **Make a known write.** In the admin center, as a test administrator, change a test user's employee hire date and disable another test user. Wait for both records to appear in the audit log.
3. **Export the window,** with a token for `graph.microsoft.com` in `HRLC_GRAPH_TOKEN`:

   ```bash
   python python/graph_export.py --task writers-scan --cloud gcc --param since=2026-11-01T00:00:00Z --param until=2026-11-02T00:00:00Z --out exports/ch01
   ```

4. **Confirm the property names.** Open `exports/ch01/directory-audits.json`, find the hire-date change and read its `modifiedProperties` `displayName`. If it isn't `EmployeeHireDate`, correct `auditProperty` in your copy of the register by a reviewed change. Do the same for the other protected values before relying on the scan.
5. **Put the test tenant's identities in your register copy** (the provisioning apps' and Lifecycle Workflows' service principal IDs, read from the records), then scan:

   ```bash
   python python/writer_register.py scan --register my-register.json --audit exports/ch01/directory-audits.json --since 2026-11-01 --until 2026-11-02 --cloud gcc --out out/ch01-test
   ```

   Both admin center changes should appear as WS-01.
6. **Back it out.** Restore the test users' values, remove the two permissions, delete the reader app and its certificate, and delete `exports/ch01` and `out/ch01-test`.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| List directoryAudits | `GET /auditLogs/directoryAudits`; `AuditLog.Read.All` (delegated and application); `$filter` with `eq`, `ge`, `le`, `startswith` | L4 and L5 | v1.0 | [^hw01-audits] |
| Record shape | `activityDisplayName`, `activityDateTime`, `result`, `initiatedBy.app.servicePrincipalId` or `initiatedBy.user.id`, `targetResources[].modifiedProperties` | — | v1.0 | [^hw01-audits] |
| User activities | `Add user`, `Update user`, `Enable account`, `Disable account`, `Delete user`, `Set user manager` (Core Directory, UserManagement) | — | — | [^hw01-activities] |
| List provisioningObjectSummary | `GET /auditLogs/provisioning`; `AuditLog.Read.All` and `Directory.Read.All` | L4 and L5 | v1.0 | [^hw01-prov] |
| Graph hosts | GCC `graph.microsoft.com`; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us` | — | — | [^hw01-deployments] |
| Audit retention | 30 days with P1 or P2; not retroactive | — | — | Book 03, Chapter 11 |
| Directory synchronization | Available in Azure Government; commercial service in GCC | Available | GA | [^hw01-feat] |

Places Learn's pages say nothing, recorded so a later edit doesn't loosen the code:

- **Property names in `modifiedProperties`.** Learn's example shows the shape but doesn't list the display name each user property gets. The register's names are confirmed in Lab 2.
- **The initiator for Lifecycle Workflows and provisioning.** Learn doesn't document the service principal each service writes as. The register takes them from the tenant's own records, never from a published list.

## Federal requirements and evidence

This chapter helps prove the guide's [Gate 1](../../../books/guides/hr-driven-identity-implementation.md#step-1-name-one-writer-for-every-state-and-attribute); its requirements table is the source, and the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) lists every federal source.

| Requirement | What this code gives | What the ISSO keeps |
|---|---|---|
| NIST SP 800-53 AC-2 and IA-4, Moderate | The register's rows, version, signature and scope filter, checked by WR-01 to WR-09 | The signed register file and the `check` output |
| AU-6, for writes outside the named writer | The scan's findings and `writes.json` for the window | The scan's output folder with its manifest, the saved `queries.json`, and the AD auditing settings, which this code doesn't read |

The privacy basis for the feed is the privacy office's determination; no code produces it.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Two writers of account state | A late `active` true undoes a workflow's disable | One writer per row (WR-01), agreement across rows (WR-07), WS-02 when the backstop acts |
| A property name that doesn't match | The scan reports no writes for that value, and silence looks clean | Lab 2 confirms each `auditProperty` before the scan is evidence |
| Logs expire before the scan runs | Entra keeps 30 days; nothing before can be recovered | Scheduled export; logs routed to the agency's store from day one |
| AD writes for synced users | The Entra log doesn't see them | `ad-sync` named as the interim writer; AD change auditing and quarterly OU ACL reviews |
| Deletion by the provisioning app | An object disposed of before devices and evidence are handled | WR-05 in the register, WS-04 in the log |
| Names in the evidence | Findings name users and administrators | The output folder is evidence under access control; delete lab copies |

## Checklist

- [ ] `config/writer-register.json` matches the signed register's lifecycle rows, and `check` reports nothing.
- [ ] Every writer group lists the tenant's real service principal IDs, read from audit records.
- [ ] Every `auditProperty` was confirmed against a real record in a test tenant.
- [ ] The reader app holds exactly `AuditLog.Read.All` and `Directory.Read.All`.
- [ ] The scan runs on a schedule inside the 30-day retention, and its output goes to the evidence store.
- [ ] Every WS-01 and WS-04 has an owner and closes by removing the write path, not by editing the value.
- [ ] AD change auditing covers the slots and `altSecurityIdentities` for every population still synced.

::: {.callout-tip}
## Continue the book
[Workbook index](index.md) · [Next: Chapter 02 — Contractor Sources and Enforced End Dates →](02-contractor-sources-and-end-dates.md)
:::

[^hw01-audits]: Microsoft Learn, "List directoryAudits," permissions, HTTP request, query parameters and examples, <https://learn.microsoft.com/graph/api/directoryaudit-list?view=graph-rest-1.0> (read November 1, 2026).
[^hw01-activities]: Microsoft Learn, "Microsoft Entra audit log categories and activities," Core Directory, <https://learn.microsoft.com/entra/identity/monitoring-health/reference-audit-activities> (read November 1, 2026).
[^hw01-prov]: Microsoft Learn, "List provisioningObjectSummary," permissions, <https://learn.microsoft.com/graph/api/provisioningobjectsummary-list?view=graph-rest-1.0> (read November 1, 2026).
[^hw01-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 1, 2026; carried from Book 19, Chapter 02).
[^hw01-feat]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
