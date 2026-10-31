# Chapter 10's input contract for Chapters 03 to 09

Chapter 10's drift run (`Invoke-NpiDriftRun.ps1`) reads Chapter 01's register and Chapter 02's ownership check directly. Everything else it learns from the other chapters comes through three small JSON files they write into one folder, passed as `-ContractPath`. `Read-NpiContractFile` in `powershell/NpiDrift/NpiDrift.psm1` checks each file; a file that fails is refused whole (finding NPI-DRF-09) and never half-read. Samples are in `tests/fixtures/ch10/contract/`; `NPI-SAMPLE-*` rules there are fixture rules, not any chapter's. Illustrative: the chapters writing these files may refine them, in a reviewed change to this page, the reader and its tests.

Every file is a JSON object with:

| Field | Value |
|---|---|
| `schema` | `fmp-npi-findings/1`, `fmp-npi-review/1` or `fmp-npi-credential-log/1` |
| `chapter` | `"03"` to `"09"`, the chapter that wrote it |
| `tenantId` | the tenant the chapter read; it must be the drift run's (compared without regard to case) |

## Findings: `fmp-npi-findings/1`

```json
{
  "schema": "fmp-npi-findings/1", "chapter": "07", "tenantId": "<tenant-id>", "producedAt": "2026-10-28T06:00:00Z",
  "findings": [
    { "id": "NPI-AREA-01:app:<appId>", "rule": "NPI-AREA-01", "severity": "Finding", "chapter": "07",
      "objectKey": "app:<appId>", "fingerprint": "<16 hex>", "issue": "free text, may be omitted" }
  ]
}
```

- `rule` is `NPI-<AREA>-<NN>`; `severity` is `Finding`, `Warn` or `Info`; `chapter` matches the file's.
- `objectKey` is the register's `IdentityId` (`ad:<objectGUID>`, `app:<appId>`, `sp:<objectId>`, `mi:<objectId>`), with a suffix after `/` when one identity can have several findings under one rule.
- `id` is `<rule>:<objectKey>`, the stable ID Chapters 01 and 02 use.
- `fingerprint` is the first 16 hex characters of SHA-256 over the UTF-8 bytes of `<rule>|<objectKey>|`: the first workbook's `fingerprint(check, object, issue)` with an empty issue, so the value stays the same however the issue text changes. In PowerShell, `Get-NpiFingerprint -Rule <rule> -ObjectKey <key>`; in Python, `drift_pipeline.fingerprint(rule, key, "")`.
- `issue` can name a person. It goes to the evidence store, never to the period summary or an issue title.

`examples/drift-pipeline/python/npi_evidence.py` maps a chapter's findings to controls by chapter: 03 to AC-2 and Gate 7's "a reason and a target", 04 and 06 to IA-5, 05 and 08 to IA-9, 06 to Gate 7's Kerberos island criterion, 07 to AC-6(5), 09 to M-25-21 (*Design guidance*).

## Review records: `fmp-npi-review/1`

```json
{
  "schema": "fmp-npi-review/1", "chapter": "07", "kind": "owner-permission-review", "tenantId": "<tenant-id>",
  "records": [ { "identityKey": "app:<appId>", "reviewedOn": "2026-09-15", "decision": "Approved", "reviewerId": "<object id>" } ]
}
```

| `kind` | Written by | Record fields | Chapter 10's rule |
|---|---|---|---|
| `owner-permission-review` | Chapter 07 | `identityKey`, `reviewedOn`, `decision`, `reviewerId` | NPI-REV-01: an app registration holding Graph permissions with no review in the last 92 days |
| `sponsor-attestation` | Chapter 09 | `identityKey`, `reviewedOn`, `decision`, `reviewerId` | NPI-REV-02: an agent identity or blueprint with no attestation in the last 365 days |
| `agent-access-recertification` | Chapter 09 | `identityKey`, `assignmentId`, `expires` (date or `null`), `decision` (`Active`, `Extended`, `Expired`, `Removed`) | NPI-REV-03: no end date, an end more than 365 days away, or `Active` after the end |

A kind not received at all is NPI-REV-04 (Warn): the cycle can't be shown, which isn't the same as passing. Reviewer IDs are object IDs, not names.

## Credential log: `fmp-npi-credential-log/1`

```json
{
  "schema": "fmp-npi-credential-log/1", "chapter": "04", "tenantId": "<tenant-id>",
  "changes": [ { "objectId": "<application or service principal object id>", "keyId": "<key id>", "changeId": "CHG-...", "at": "2026-10-29T22:00:00Z" } ]
}
```

Each credential the reviewed rotation pipeline added. A credential event in the audit log counts as inside the pipeline only when its initiator is a service principal listed in `-PipelineIdentitiesPath` (`ServicePrincipalId,Name,Record`) **and** its target object and key ID are in this log; anything else is NPI-DRF-07.
