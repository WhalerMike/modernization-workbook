# Non-person identity as code

Code for the [developer workbook *Building Non-Person Identity*](../../docs/project-plans/developer-workbooks/non-person-identity/index.md), the code-first companion to the [Non-Person Identity Modernization project plan](../../docs/project-plans/non-person-identity.md).

- **Chapter 01, the register:** Active Directory user accounts used as service accounts, MSAs, gMSAs and dMSAs; app registrations, service principals, managed identities and federated credentials; Microsoft Graph application permissions and delegated consent grants. Each row gets an owner count, its credential kind, a risk (HIGH = password never expires or over-privileged), a candidate target and, for SQL Server accounts, a hand-off to the Data Platform plan. Findings NPI-INV-01 to NPI-INV-09. Read only.
- **Chapter 02, ownership and the orphan rule:** the register checked against the ownership rule (two enabled human members as owners, a service-management reference that names an active record, an application owner for every AD account), findings NPI-OWN-01 to NPI-OWN-09, and the orphan rule (D-N2) as a dry-run plan. The plan is applied only by `Invoke-NpiOrphanAction.ps1 -Apply`, a separate, delegated write path that checks the plan's approved SHA-256.

Illustrative: tested against fixtures and fakes of Microsoft Graph, Resource Manager and Active Directory, not against a production tenant or domain.

## Start with Microsoft's samples

The chapters start from Learn's own procedures and scripts, pinned unmodified in [`../third_party/entra-service-account-pages`](../third_party/entra-service-account-pages/SNAPSHOT.md), [`../third_party/entra-app-credentials-export-page`](../third_party/entra-app-credentials-export-page/SNAPSHOT.md) and [`../third_party/graph-applications-tutorial-page`](../third_party/graph-applications-tutorial-page/SNAPSHOT.md). `tests/MicrosoftSamples.Tests.ps1` runs them offline against stand-ins and pins what they do and leave out. The chapters' gap tables cite those tests.

## Layout

```
Invoke-NpiInventory.ps1                 Chapter 01: read, classify, find, write the register with a manifest
Invoke-NpiOwnership.ps1                 Chapter 02: check ownership, write the findings and the orphan plan (no writes)
Invoke-NpiOrphanAction.ps1              Chapter 02: the separate write path; dry run unless -Apply, delegated only
config/calls.json                       every call and task: method, path or cmdlet, least-privileged permission, Azure role or AD right, Learn page
config/register.json                    the program's classification rules (Design guidance)
powershell/NpiCore/                     clouds, the reader, the fakes, findings, the run manifest
powershell/NpiInventory/                Chapter 01
powershell/NpiOwnership/                Chapter 02, including the writer
tests/MicrosoftSamples.Tests.ps1        Pester 5: Learn's samples, run as published
tests/NpiInventory.Tests.ps1            Pester 5: Chapter 01
tests/NpiOwnership.Tests.ps1            Pester 5: Chapter 02
tests/LearnSampleHarness.ps1            extracts and runs the pinned samples against stand-ins
tests/fixtures/estate.json              a fictional estate (contoso.example, corp.contoso.example)
tests/fixtures/inputs/                  owners file, service records, the identity governance officer's confirmations, owner claims
```

## Permissions

`Get-NpiRequiredPermission -Task <task>` prints a task's needs; a test keeps each task's declaration in `config/calls.json` equal to the union of its calls. The Learn page for each call is in `config/calls.json`; the pages were read on October 30, 2026.

| Task | Microsoft Graph | Azure | Active Directory |
|---|---|---|---|
| `inventory` (read) | `Application.Read.All`, `Directory.Read.All` (delegated permission grants only) | Reader on the user-assigned identities | default read |
| `ownership` (read) | `User.Read.All` | none | none |
| `orphan-apply` (write, delegated only, Cloud Application Administrator) | `Application.Read.All`, `Application.ReadWrite.All`, `Directory.Read.All`, `User.Read.All` | none | a delegated right to disable accounts in the account's OU |

## Clouds

`-Cloud` is required: `gcc` (and `global`) use the worldwide endpoints, `graph.microsoft.com`, `login.microsoftonline.com` and commercial `management.azure.com`, as Microsoft 365 GCC with commercial Azure does. `gcchigh` and `dod` use `graph.microsoft.us` and `dod-graph.microsoft.us` with Azure Government's `management.usgovcloudapi.net`. Any other name throws. The live invoker refuses to run if the Graph or Azure session is in another cloud or another tenant.

## Run the tests

```powershell
Invoke-Pester -Path tests
```

PowerShell 7.1 or later and Pester 5. No module, tenant, domain or network is needed.
