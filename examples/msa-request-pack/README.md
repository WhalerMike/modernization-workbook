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
    07-change-request.docx            one change to an existing account: a host, an SPN, the tier or the end date
  request_template.csv            one row per request (New, Migrate or Change), no rows yet
  examples.csv                    twelve fictional requests, all passing: five new or migration, seven changes
  Test-MsaRequest.ps1             the checker (PowerShell 7.1 or later)
  Get-MsaNameSuggestion.ps1       the name suggester (Windows PowerShell 5.1 or PowerShell 7)
  standard.json                   the domain and OUs the checker reads (fictional; copy and edit at work)
  copilot-prompts.md              prompts for Microsoft 365 Copilot Chat
  pack_schema.py, build_pack.py   the fields, values and forms in one place, and the build (needs python-docx to write the forms)
  proposal/                       the production proposal for the authorizing official and the change advisory board
    msa-production-proposal.docx      the proposal, with a technical appendix for engineers
    msa-production-proposal.pptx      its 12-slide deck, with speaker notes
    day2-test-script.md               Day 2 at work: read-only production checks, then one gMSA in a test domain
    Invoke-MsaDay2ReadOnly.ps1        the read-only checks, one evidence file per step
    proposal-prompts.md               Copilot prompts: fill the placeholders, review for gaps, draft the board's summary
    proposal_content.py, build_proposal.py   the content in one place, and the build (python-docx and python-pptx)
  tests/                          Pester and pytest; tests/fixtures/forest.json is what -CheckForest finds in the fictional forest
non-person-identity/powershell/   the Non-Person Identity kit's Chapter 12 module the checker calls
```

## Check your requests

From the `msa-request-pack` folder, in PowerShell 7.1 or later:

```powershell
./Test-MsaRequest.ps1 -Path examples.csv -OutputPath out/check -AsOf 2026-11-25
```

It prints one line per request (`Ready` `True` when nothing blocks it) and writes `out/check/<RequestId>/` with `request.json`, `ad-description.txt`, `entra-tags.json` and `entra-custom-security-attributes.json`, and `out/check/findings.json`. It exits 1 when any request has a finding. Copy `request_template.csv`, fill in your rows, and run it on your copy with `-StandardPath` pointing at your copy of `standard.json`.

| Check | What it finds |
|---|---|
| NPI-STD-03 to -09 | Chapter 12's request check: the name, two owners and a federal sponsor, the hosts, SPNs and outbound-only, the dMSA rules, the other fields. NPI-STD-01 and -02 (the approval and the change record) come after submission |
| MSA-REQ-01 | `Migrate` with no `Supersedes`, or `New` with one |
| MSA-REQ-02 | A role suffix that doesn't match the workload (a warning) |
| MSA-REQ-03 | Owner1 and Owner2 are the same person |
| MSA-REQ-04 | `EntraTarget` `KeepKerberos` with no end date |
| MSA-REQ-05 | A new dMSA: a dMSA migrates an existing account |
| MSA-REQ-06 | A tag that can't be written: a value outside its list, or one with `=` or `;` |
| MSA-REQ-07 | `Change` with no known `ChangeType`, or a `ChangeType` on a `New` or `Migrate` row |
| MSA-REQ-08 | Change items that don't fit the row: an added host missing from `Hosts`, a removed one still there, an SPN not in Learn's form or not in `Spns`, items on a `Tier` or `EndDate` change, an end date on an account that isn't kept on Kerberos |

When NPI-STD-03 refuses a name, its finding ends with the name `Get-MsaNameSuggestion.ps1` builds from the same fields (`expected name gmsa-payroll$`).

## Change an existing account

A `Change` row changes one thing: `ChangeType` is `AddHost`, `RemoveHost`, `AddSpn`, `RemoveSpn`, `Tier` or `EndDate`, `ChangeItems` names the hosts or SPNs added or removed, and `Hosts` and `Spns` are the full lists after the change. An owner or sponsor change is form 03, a retirement form 04. The Non-Person Identity kit's Chapter 06 plans the approved change (`Invoke-NpiKerberosChange.ps1`): a host change as a change to `DL-gMSA-<app>-Hosts` (a dMSA's retrievers are its hosts), an SPN change as `setspn -S` or `setspn -D`, a tier or end date change as a rewrite of the tags. A person sends the write while WD-185, a draft that proposes the rights for the pipeline, is undecided.

## Suggest the names

In Windows PowerShell 5.1 or PowerShell 7:

```powershell
./Get-MsaNameSuggestion.ps1 -SystemId SYS-0233 -AppShortName hrdb -Role sql -AccountType gMSA -Environment prod -Hosts HRSQL01 -ServiceClass MSSQLSvc -Port 1433
```

It prints the account name (WD-159, WD-173), its DNS host name, the retriever group (WD-160), the SPNs, the managed identity name it will move to (`id-<app>-<env>-<region>-001`) and the seven tags (WD-175), with a finding for anything that breaks a rule. `-CheckForest` adds read-only lookups (`Get-ADObject`; `-Server <dc>:3268` for the whole forest, or `-ForestFixturePath tests/fixtures/forest.json`) and reports a clash without renaming anything.

## The tags

Every account carries the same seven tags (WD-175): `SystemId`, `Owner1`, `Owner2`, `Sponsor`, `Environment` (`prod`, `test`, `dev`), `Tier` (`R1`, `R2`, `R3`) and `EntraTarget`. In AD they're `key=value` pairs in the account's description, with the request and change numbers. In Entra, until a tenant check confirms custom security attributes in GCC (WD-176), they're the service principal's `tags` (`npi:<Key>=<Value>`) and `notes`, or a managed identity's Azure resource tags (`entra-tags.json`); once confirmed, custom security attributes in the `NonPersonIdentity` attribute set (`entra-custom-security-attributes.json`). SailPoint is the source for owners; Chapter 12 flags an AD tag that disagrees (NPI-STD-30).

## Propose it for production

`proposal/` holds a neutral production proposal: the problem, the decided design (WD-123 to WD-176), the request flow, the lifecycle, the naming standard and its five enforcement layers, the rollout phases, the controls the evidence supports, the risks and guards, the prerequisites, open items and the decisions requested, with every agency value a placeholder. Run `day2-test-script.md` at work to collect the evidence (Part R reads production and changes nothing; Part T runs only in a test domain), then fill the placeholders with `proposal-prompts.md`. Rebuild with `python proposal/build_proposal.py` (needs python-docx and python-pptx); `--check` needs the standard library only.

## Where to store the filled requests

- Store them where your agency's access management tool and ServiceNow keep requests, or on agency OneDrive, SharePoint or Teams.
- Never in a personal or public repository or a personal cloud drive.

## Rebuild the forms

```powershell
python build_pack.py           # needs python-docx
python build_pack.py --check   # standard library only
```
