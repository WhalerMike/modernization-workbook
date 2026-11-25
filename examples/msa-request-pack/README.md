# Managed service account request pack

> **Status: illustrative.** Forms, a CSV template and a checker, tested; every example is fictional. The rules are the program's managed service account standard (WD-159 to WD-175), which is program design, not a federal requirement.

## What this pack is

The documents an owner uses to ask for a group managed service account (gMSA) or a delegated managed service account (dMSA), and the documents the people who approve and record the request use. A checker runs the same rules SailPoint's pre-approval workflow runs, so a request that breaks a rule is caught before it's submitted. It also writes each account's tags: the AD description now, and the Entra custom security attributes for when the workload moves to Entra.

It is the work-side half of the guide [Requesting a managed service account](../../docs/books/guides/msa-request-pack.md).

## One way only: download it at work, nothing comes back

1. Download the pack at work, from the workbook's [Downloads](../../docs/downloads.md) page.
2. Fill it in inside your agency, with your agency's tools.
3. Nothing you write goes back to the public workbook. Don't open an issue or a pull request with your requests, and don't paste them anywhere outside your agency.

The pack itself is neutral. Every name in it (contoso.example, the systems, the people) is invented.

## What's in it

```
msa-request-pack/
  README.md                       this file
  forms/
    01-new-account-request.docx       a new account for a new workload
    02-migration-request.docx         replace an existing service account with a gMSA or dMSA
    03-owner-change-request.docx      change an owner or the sponsor
    04-retirement-request.docx        retire an account
    05-approver-checklist.docx        what the SailPoint approver decides
    06-servicenow-change-template.docx the change record's required fields
  request_template.csv            one row per new or migration request, no rows yet
  examples.csv                    five fictional requests, all passing
  Test-MsaRequest.ps1             the checker (PowerShell 7.1 or later)
  standard.json                   the domain and OUs the checker reads (fictional; copy and edit at work)
  copilot-prompts.md              prompts for Microsoft 365 Copilot Chat
  pack_schema.py, build_pack.py   the fields, values and forms in one place, and the build (needs python-docx to write the forms)
  tests/                          Pester and pytest
non-person-identity/powershell/   the Non-Person Identity kit's Chapter 12 module the checker calls
```

## Check your requests

From the `msa-request-pack` folder, in PowerShell 7.1 or later:

```powershell
./Test-MsaRequest.ps1 -Path examples.csv -OutputPath out/check -AsOf 2026-11-25
```

It prints one line per request (`Ready` `True` when nothing blocks it) and writes `out/check/<RequestId>/` with `request.json`, `ad-description.txt` and `entra-custom-security-attributes.json`, and `out/check/findings.json`. It exits 1 when any request has a finding. Copy `request_template.csv`, fill in your rows, and run it on your copy with `-StandardPath` pointing at your copy of `standard.json`.

| Check | What it finds |
|---|---|
| NPI-STD-03 to -09 | Chapter 12's request check: the name, two owners and a federal sponsor, the hosts, SPNs and outbound-only, the dMSA rules, the other fields. NPI-STD-01 and -02 (the approval and the change record) come after submission |
| MSA-REQ-01 | `Migrate` with no `Supersedes`, or `New` with one |
| MSA-REQ-02 | A role suffix that doesn't match the workload (a warning) |
| MSA-REQ-03 | Owner1 and Owner2 are the same person |
| MSA-REQ-04 | `EntraTarget` `KeepKerberos` with no end date |
| MSA-REQ-05 | A new dMSA: a dMSA migrates an existing account |
| MSA-REQ-06 | A tag that can't be written: a value outside its list, or one with `=` or `;` |

## The tags

Every account carries the same seven tags (WD-175): `SystemId`, `Owner1`, `Owner2`, `Sponsor`, `Environment` (`prod`, `test`, `dev`), `Tier` (`R1`, `R2`, `R3`) and `EntraTarget`. In AD they're `key=value` pairs in the account's description, with the request and change numbers. In Entra they're custom security attributes in the `NonPersonIdentity` attribute set, on the service principal or managed identity the workload moves to. SailPoint is the source for owners; Chapter 12 flags an AD tag that disagrees (NPI-STD-30).

## Where to store the filled requests

- Store them where your agency's access management tool and ServiceNow keep requests, or on agency OneDrive, SharePoint or Teams.
- Never in a personal or public repository or a personal cloud drive.

## Rebuild the forms

```powershell
python build_pack.py           # needs python-docx
python build_pack.py --check   # standard library only
```
