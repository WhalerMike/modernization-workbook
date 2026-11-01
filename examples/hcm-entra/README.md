# Oracle Fusion Cloud HCM to Microsoft Entra ID: extract-to-SCIM converter and validator

> **Status: illustrative. Unit-tested against fixtures, not proven against live tenants.**
> This is one way to build the middleware's validate and normalize duties from [Book 03, Chapter 05](../../docs/books/b03-hr-identity/05-the-provisioning-pipeline.md), using the canonical schema and program attribute map in [Chapter 06](../../docs/books/b03-hr-identity/06-canonical-attribute-schema.md). It isn't an endorsement of any product by any agency, and no agency has adopted it. Product and API facts were checked against Microsoft Learn and Oracle's documentation on October 25, 2026. The explanation, with sources, is the research page [Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID](../../docs/books/guides/hcm-entra-implementation.md).

## Start with Microsoft's sample

Microsoft publishes a PowerShell sample for this integration, CSV2SCIM, documented on Learn in [API-driven inbound provisioning with PowerShell script](https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-powershell). A pinned, unmodified copy is in [`../third_party/csv2scim`](../third_party/csv2scim/SNAPSHOT.md), and `config/csv2scim/AttributeMapping.psd1` maps this example's extract columns for it. Use the sample to validate a mapping, extend the provisioning app's schema (`-UpdateSchema`) and read cycle logs in a worldwide or GCC tenant. This example adds what the sample leaves to you: record validation and quarantine, ordering, the mass-disable hold, pacing and the call budget, the US Government clouds, a single least-privileged permission, a repeatable `bulkId` and the provenance manifest. `tests/powershell/Csv2ScimBaseline.Tests.ps1` runs the sample offline on the same fixture and pins the differences. The [developer workbook *Building the Attribute-Driven Migration*, Chapter 01](../../docs/project-plans/developer-workbooks/attribute-driven-migration/01-the-hr-to-entra-middleware.md) walks through both.

## What it does

Two equivalent clients, `python/hcm_to_scim.py` and `powershell/Invoke-HcmToScim.ps1` (with `HcmToScim.psm1`), read an HCM Extract CSV, validate each row, and turn it into a SCIM bulk request for the API-driven inbound provisioning app. By default they only write files:

| Output | Contents | Book 03 use |
|---|---|---|
| `bulk-request-NNN.json` | SCIM `BulkRequest` payloads, at most 50 operations each, leavers first, managers before their reports | The `/bulkUpload` contract (Chapter 05) |
| `validation-report.json` | Counts, and per record: person key, status, leaver flag, payload SHA-256, reasons and warnings. **No names or payloads** | Operational log (Appendix B: person key and payload hash only) |
| `quarantine.json` | Each refused record: reasons, the unchanged HR row and the attempted payload. **Contains personal data**: keep it in the access-controlled audit store | The quarantine contract (Appendix A) |
| `provenance.json` | The run's manifest: the sha256 of the extract and mapping files, the run date, counts, and per batch its SHA-256 and the person keys it carries. **No names or payloads** | Provenance: ties each sent batch to the exact inputs that produced it ([developer workbook *Building the Attribute-Driven Migration*, Chapter 01](../../docs/project-plans/developer-workbooks/attribute-driven-migration/01-the-hr-to-entra-middleware.md)) |
| `apply-results.json` | Only with `--apply` / `-Apply`: per batch, the HTTP status, attempts, the `Location` header that points at the provisioning logs, and the batch hash | Reconcile duty (Chapter 05) |

Both clients produce the same operations, the same payload hashes and the same provenance manifest for the same input; the tests assert that against shared fixtures.

## The mapping it applies

`config/mapping.json` holds the mapping, the code lists and the validation rules; both clients read it. The column names are this example's extract layout, not Oracle field names: build your HCM Extract to emit them, or change the file.

| Extract column | SCIM attribute | AD (provisioning agent) | Entra ID |
|---|---|---|---|
| `PersonNumber` | `externalId` (matching attribute) and enterprise `employeeNumber` | `employeeID` | `employeeId` |
| `AssignmentStatusType` | `active` (`ACTIVE` and `SUSPENDED` true, `INACTIVE` false) | `accountDisabled` | `accountEnabled` |
| `FirstName`, `LastName`, `DisplayName` | `name.givenName`, `name.familyName`, `displayName` | `givenName`, `sn`, `cn` | `givenName`, `surname`, `displayName` |
| `JobName` | `title` | `title` | `jobTitle` |
| `DepartmentName`, `BusinessUnit`, `CostCenter`, `LegalEmployer` | enterprise `department`, `division`, `costCenter`, `organization` | `department`, `division`, —, `company` | `department`, `employeeOrgData.division`, `employeeOrgData.costCenter`, `companyName` |
| `ManagerPersonNumber` | enterprise `manager.value` (the manager's `externalId`) | `manager` (DN) | `manager` |
| `WorkCountry` | `addresses[type eq "work"].country` | `co` | `country` |
| `WorkerType` | extension `workerType` and `workerTypeCode` | `employeeType`, `extensionAttribute11` | `employeeType`, `extensionAttribute11` |
| `JobCode` | extension `JobCode` | `extensionAttribute1` | `extensionAttribute1` |
| `HireDate`, `TerminationDate` | extension `HireDate`, `TermDate` (UTC, ISO 8601) | `extensionAttribute2`, `extensionAttribute3` | `employeeHireDate`, `employeeLeaveDateTime` |
| `DepartmentCode` | extension `orgCode` | `extensionAttribute10` | `extensionAttribute10` |
| `PositionCategory` | extension `positionCategory` | `extensionAttribute12` | `extensionAttribute12` |

The extension namespace is `urn:ietf:params:scim:schemas:extension:contoso:1.0:User`, a placeholder. Use one namespace string everywhere: in this file, in the provisioning app's attribute list and in its mappings. A typo in any of the three silently drops the attribute.

The provisioning app, not this client, owns the target-side mapping. In particular:

- **Dates for AD-landed users.** Microsoft's guidance is that a custom import to an AD string attribute must use the format `yyyyMMddHHmmss.fZ`. This client sends `2026-11-02T10:00:00Z`; convert it in the AD app's mapping with an expression such as `FormatDateTime([urn:ietf:params:scim:schemas:extension:contoso:1.0:User:HireDate], , "yyyy-MM-ddTHH:mm:ssZ", "yyyyMMddHHmmss.fZ")` *(inference: test the format string in your tenant)*.
- **UPN and `samAccountName`.** Generate them in the app's mapping (for AD, `SelectUniqueValue` on object creation only), or add a `UserName` column. The provisioning service doesn't resolve UPN conflicts for you.
- **Email.** Not sent. The directory generates it, as Book 03's crosswalk says.

## The rules it enforces (fail closed)

| Rule | Source in Book 03 |
|---|---|
| Required columns present; `PersonNumber` fits `employeeId` (at most 16 characters) | Chapter 04, Chapter 06 |
| Worker type known; pending workers and nonworkers refused | Chapter 06 worker-type taxonomy (*design guidance*: provision from the hire, not the pending record) |
| `SUSPENDED` keeps the account active, with a warning | Appendix A, "leave is not a leaver" |
| A record whose hire date is after the run date is sent with `active` false (setting `prestart_disabled`), so the account exists disabled before day one; it isn't counted as a leaver. Enable it on the hire date with one writer: a scheduled re-send from the pipeline, or the Lifecycle Workflows day-one *Enable user account* task (which can enable synced AD users through the provisioning agent), not both unplanned | Appendix C, first acceptance row |
| `INACTIVE` needs a termination date, so the leave date can be set | Chapter 08, Chapter 09 |
| Codes match the code list; `department` and `companyName` at most 64 characters, `jobTitle` 128, `displayName` 256 | Chapter 06 design rule 3; the Graph user property limits |
| One person, several rows: a separation wins; otherwise refuse both | Appendix A, precedence |
| A worker can't be their own manager; a manager separating in this run is a warning, never a block | Appendix A, manager links |
| A separation older than the catch-up window (3 days) is flagged for the on-demand leaver workflow | Chapter 08 |
| More disables than `max_disables_per_run` holds the whole run (exit 3) until `--confirm-large-delta` | Appendix B, pause switch |

Every record is sent complete, for full and delta runs alike, because an omitted attribute can clear the target value when attribute clearing is turned on.

## Run it

Requires Python 3.10 or later (standard library only), or PowerShell 7.2 or later.

```text
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out
pwsh -File powershell/Invoke-HcmToScim.ps1 -Extract tests/fixtures/hcm_extract_sample.csv -AsOf 2026-10-25 -Out out
```

Exit codes: `0` everything ready (or sent), `1` error, `2` some records quarantined, `3` run held.

To send, copy `config/settings.example.json` to `config/settings.json`, put your provisioning app's **Provisioning API Endpoint** in `endpoint`, put a bearer token for Microsoft Graph in the `HCM_ENTRA_BEARER_TOKEN` environment variable, and add `--apply` (`-Apply`). Obtain the token outside the script, from a managed identity or a certificate credential; the settings loader refuses any key that looks like a secret. Grant the identity only `SynchronizationData-User.Upload` (or `SynchronizationData-User.Upload.OwnedBy`, if it owns the provisioning app) and, for the separate log reader, provisioning-log read. The endpoint must be an `https` Graph `/bulkUpload` URL on `graph.microsoft.com` (also used by Microsoft 365 GCC), `graph.microsoft.us` or `dod-graph.microsoft.us`. The sender paces calls at least 0.125 seconds apart (40 calls in any 5 seconds), honors `Retry-After` on 429 and 503, and stops at the first failed batch.

Before the first real run, start the provisioning job (it must be listening), set the notification email (without it the job quarantines), turn on accidental-deletions prevention, and send five to ten records first, as Microsoft's Oracle HCM guide advises.

## Correlate HR with the directories

Before the first full sync, every enabled account has to match exactly one worker record, and each matched record has to agree with what the directories hold: the [Attribute-Driven Migration implementation guide's Gate 2](../../docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.md#gate-2-prove-the-attributes) and [Book 03, Chapter 05](../../docs/books/b03-hr-identity/05-the-provisioning-pipeline.md#the-source-oracle-fusion-cloud-hcm). The validation kit's VK-HR-03 compares counts per organization code. The correlation tool compares record by record. It's read-only: it reads three files and writes two, and sends nothing.

| Input | What it is |
|---|---|
| `--extract` / `-Extract` | The HCM extract, the layout the converter reads |
| `--ad` / `-Ad` | The Start Kit's `ad-user-export.csv`, from `Get-FMPAttributeSurvey`: every user of every domain tree, with `EmployeeId`, `Enabled`, `EmployeeType`, `extensionAttribute10` to `12` and `ManagerEmployeeId` |
| `--entra` / `-Entra` (optional) | An Entra ID users export: a JSON array of Graph user objects, or a saved `{"value": [...]}` page, with `employeeId`, `accountEnabled`, `employeeType`, `onPremisesExtensionAttributes` and, if you expanded it, `manager` (`GET /v1.0/users?$select=id,userType,accountEnabled,employeeId,employeeType,onPremisesExtensionAttributes&$expand=manager($select=id,employeeId)`). Guests are left out |

It joins them on the person key (`PersonNumber` to `employeeID` and `employeeId`, trimmed and case-folded) and gives every key one status:

| Status | Means | Quarantined |
|---|---|---|
| `matched` | One HR record, at most one account in each directory, and they agree | No |
| `matched_with_conflicts` | Matched, but a directory disagrees with HR: the account's state (an `INACTIVE` worker with an enabled account, or an active one disabled), the organization code (`extensionAttribute10`), the worker type and its code (`employeeType`, `extensionAttribute11`), the position category (`extensionAttribute12`) or the manager's key. The codes come from `config/mapping.json`; a manager not in the Entra export isn't compared | Yes |
| `hr_only` | An active worker with no account in either directory: a missing identity | Yes |
| `hr_only_inactive` | A separated worker with no account | No |
| `directory_only` | An enabled account no worker record holds: an orphan candidate, which gets an owner or goes on a dated exception list | Yes |
| `directory_only_disabled` | A disabled account no worker record holds | No |
| `duplicate_key` | A key held by more than one HR record, AD account or Entra account | Yes |
| `no_key`, `hr_no_key` | An enabled account, or an HR record, with no key at all | Yes |

AD accounts with an SPN are service accounts; they're counted and left to the non-person track. `correlation-report.json` holds the counts, two rates (active workers matched, enabled accounts matched: the figures the correlation threshold, decision D-A3, is set against), conflicts by field, and per key its status, how many records each side holds and the names of the conflicting fields. **No names and no values**, so it can go to the evidence store. `correlation-quarantine.json` holds each record that needs a decision, with the HR rows and directory rows as read. **It contains personal data**: keep it in the access-controlled audit store, as with `quarantine.json`.

```text
python python/hcm_correlate.py --extract tests/fixtures/hcm_extract_sample.csv --ad tests/fixtures/correlation/ad-user-export.csv --entra tests/fixtures/correlation/entra-users.json --as-of 2026-10-25 --out out
pwsh -File powershell/Invoke-HcmCorrelation.ps1 -Extract tests/fixtures/hcm_extract_sample.csv -Ad tests/fixtures/correlation/ad-user-export.csv -Entra tests/fixtures/correlation/entra-users.json -AsOf 2026-10-25 -Out out
```

Exit codes: `0` nothing needs a decision, `1` error, `2` the quarantine has entries. Both clients give the same report and quarantine for the same input; both test suites assert that against `tests/fixtures/correlation/expected_correlation_report.json` and `expected_correlation_quarantine.json`. Fix every finding at the source, in the HR record, never in the directory copy: the next sync or provisioning cycle overwrites the copy.

## Test it

```text
python -m pytest -q -p no:cacheprovider tests/python
pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
```

The tests use `tests/fixtures/hcm_extract_sample.csv` (fictional workers at a placeholder employer) and never call the network; sending is tested with a fake poster. They prove the code does what this README says against the fixtures. They don't prove that your extract, your provisioning app's schema or Microsoft's service behave the same way.

## Known limits

- **Not the whole middleware.** This covers validate and normalize, the start of sequence (ordering within a run) and the send. It doesn't read Atom feeds, hold future-dated events, ship `provenance.json` to an evidence store (it only writes it), or read the provisioning logs back per record; the research page describes those duties.
- **Fixed UTC offsets.** Hire and leave times are converted with a fixed offset per row (or the default). Emit the offset in force on each date from the extract; daylight saving time isn't computed here.
- **Assignment status values are this example's.** Oracle's assignment status types and your extract's values may differ; map them in `assignment_status_types`.
- **Pending workers are refused.** If your design provisions from the pending worker record, change `refused_worker_types` and the scoping rules together.
- **Correlation is by key only.** A person whose key is wrong in one directory shows as `hr_only` plus `directory_only`, not as one mismatch; read the two together. Names aren't used to guess a match, because a guessed match is how two people end up sharing one identity. Values are compared exactly, case included.
- **The `Location` header** is recorded as returned. Reading per-record results from the provisioning logs is a separate component with its own permission.

```
examples/hcm-entra/
  README.md
  config/mapping.json            mapping, code lists, validation rules (shared)
  config/settings.example.json   non-secret settings; placeholders only
  config/csv2scim/               the same columns as a CSV2SCIM AttributeMapping.psd1
  python/hcm_to_scim.py          converter, validator, dry-run-first sender
  powershell/HcmToScim.psm1      the same in PowerShell 7
  powershell/Invoke-HcmToScim.ps1  wrapper script
  python/hcm_correlate.py        HR-to-directory correlation, read-only
  powershell/HcmCorrelation.psm1, Invoke-HcmCorrelation.ps1  the same in PowerShell 7
  tests/fixtures/                sample extract, expected payload, hashes, provenance hash
  tests/fixtures/correlation/    AD and Entra exports, and the expected correlation report and quarantine
  tests/python/                  pytest
  tests/powershell/              Pester 5, including the CSV2SCIM baseline comparison
```
