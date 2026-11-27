# Estate inventory: one unattended, read-only run of four kits

> **Status: illustrative. Tested on the kits' fixtures and a stand-in Start Kit, not run against a live forest or tenant.**
> Review every line, run it first against a test forest and a test tenant, and never give its account a write right.

`Invoke-EstateInventory.ps1` inventories an AD forest and the Entra ID tenant and Azure estate beside it in one scheduled run. It doesn't read anything itself: it runs four kits' own scripts, unchanged, and puts what they write in one dated run folder with one manifest.

| Step | Kit and script | Reads | Edition |
|---|---|---|---|
| `start-kit` | [`start-kit`](../start-kit/README.md), `Invoke-FMPStartKit.ps1` | The whole forest: every domain, its topology, accounts and service accounts, SPNs, the services on each server, AD CS, DNS, DHCP, NPS, attribute fill | Windows PowerShell 5.1, a child process |
| `non-person-identity` | [`non-person-identity`](../non-person-identity/README.md), `Invoke-NpiInventory.ps1`, once per domain | Service accounts, MSAs, gMSAs and dMSAs in AD; app registrations, service principals, managed identities, federated credentials and Graph permissions in Entra ID; Azure role assignments | PowerShell 7, a child process |
| `privileged-access` | [`privileged-access`](../privileged-access/README.md), `Invoke-PaInventory.ps1` | Entra role assignments (active and eligible), role-assignable groups and their members, Azure role assignments and PIM eligibility | PowerShell 7, a child process |
| `validation-kit` | [`validation-kit`](../validation-kit/README.md), `Invoke-ValidationKit.ps1` | The track implementation guides' read-only checks, for the tracks the settings name | PowerShell 7, a child process |

The Start Kit runs first. When it writes the server-to-service inventory (`ServerServices\ServerServices.csv`, at Tier B or with `-ServerServices`), the non-person identity inventory reads it to fill the hosts and services of AD accounts used as service accounts.

Each cloud step runs in its own PowerShell 7 process, which signs in app-only (a certificate or a managed identity, never a secret) and checks that the session is in the settings' tenant. A step that fails, a failed sign-in included, is recorded as `Error` and the other steps still run. Microsoft 365 GCC (Moderate) uses the global Graph endpoint and commercial Azure, so `gcc` and `global` both sign in to `Global` and `AzureCloud`.

## What a run writes

```
<outputRoot>\<UTC yyyy-MM-ddTHHmmssZ>\
  start-kit\<run-id>\                 the Start Kit's run, with its AssessmentManifest.json
  non-person-identity\<domain>\       one register per domain, each with its manifest.json
  privileged-access\                  inventory.csv, findings.json, manifest.json
  validation-kit\<run-id>\            the checks' results and ValidationManifest.json
  logs\                               each step's log, and the output of each child process
  EstateInventoryManifest.json        the settings' SHA-256, the host, the account, each step's status,
                                      controls and KSIs, each kit's manifest and its SHA-256
  Summary.md                          one table: step, status, output, controls, KSIs
  SHA256SUMS                          every file in the run folder
```

Exit code 0: every step passed (or, in a fixture run, was recorded). 2: a step ended in `Error`, or the validation kit in `Partial` (some checks ended in `Error`). 1: the settings were refused, and nothing ran.

`Test-EiRun -Path <run>` (in `powershell/EstateInventory`) rechecks `SHA256SUMS` and each kit manifest's hash, and lists what changed.

## Requirements and KSIs

[`config/requirements.json`](config/requirements.json) gives each step its NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs; the run copies them into the manifest and `Summary.md`. Every pairing is one the workbook's kits already record.

| Step | Controls | KSIs |
|---|---|---|
| `start-kit` | CM-8, AC-2 | KSI-PIY-GIV, KSI-IAM-AAM |
| `non-person-identity` | AC-2, CM-8, IA-4, IA-5 | KSI-PIY-GIV, KSI-IAM-SNU |
| `privileged-access` | AC-2, AC-6 | KSI-IAM-AAM, KSI-IAM-ELP |
| `validation-kit` | CA-7 | KSI-MLA-EVC |
| the manifest | AU-9, CA-7 | KSI-MLA-OSM, KSI-MLA-EVC |

KSIs are FedRAMP's indicators for cloud service providers: the agency lines its own evidence up with what its providers report against them, and doesn't report KSIs itself.

## Lab 1: every kit on its fixtures, no forest and no tenant

Unzip `estate-inventory-code.zip` as the [Downloads page](https://whalermike.github.io/modernization-workbook/docs/downloads.html#unzip-kits) shows, then, in PowerShell 7:

```powershell
Set-Location C:\FMWLabs\estate-inventory-code\estate-inventory
./Invoke-EstateInventory.ps1 -SettingsPath config/settings.fixture.json -Fixture
```

It prints, with `<run>` the date and time you ran it and `<vk-run>` the validation kit's own run name:

```text
Estate inventory (Fixture, read-only): C:\FMWLabs\results\estate-inventory\<run>
  start-kit            Recorded  start-kit/recorded-run-nov
  non-person-identity  Pass      non-person-identity/fixture
  privileged-access    Pass      privileged-access
  validation-kit       Pass      validation-kit/<vk-run>
Written to C:\FMWLabs\results\estate-inventory\<run> (EstateInventoryManifest.json, Summary.md, SHA256SUMS)
```

The Start Kit reads only a live forest, so a fixture run copies its recorded run (`start-kit/tests/fixtures/result-assessment/run-nov`) and marks the step `Recorded`. Each run keeps its own folder; list them with:

```powershell
Get-ChildItem C:\FMWLabs\results\estate-inventory -Name
```

The tests: `Invoke-Pester -Path tests` (Pester 5, PowerShell 7 on Windows; 13 tests, about a minute). They run the fixture run twice, refuse a secret and a placeholder, catch a changed file, and run the live path with a stand-in Start Kit in Windows PowerShell 5.1 and no certificate, so each cloud step fails on its own.

## A live run

### The identities

- **The run account:** a group managed service account for the scheduled task, as the Start Kit's [Book 02, Chapter 08](../../docs/books/b02-identity/08-assessing-the-forest.md) run uses. It holds the Start Kit's Tier A rights: a standard account with no added rights. Tier B's delegations are time-bound and for the first full assessment ([Book 02, Chapter 07](../../docs/books/b02-identity/07-read-only-discovery.md)); a scheduled run stays at Tier A.
- **The reader app:** one Entra app with a certificate, granted the union of the three cloud kits' read permissions as application permissions with admin consent, and Reader at the management group the settings name. It holds no write permission. These commands print what each kit needs:

  ```powershell
  Set-Location C:\FMWLabs\estate-inventory-code
  Import-Module ./privileged-access/powershell/PrivilegedAccess/PrivilegedAccess.psm1
  (Get-PaRequiredPermission -Task inventory).GraphPermissions
  Import-Module ./validation-kit/powershell/ValidationKit/ValidationKit.psd1
  Get-VkRequiredScope -Checks (Get-VkCheckCatalog -Track NPI, CA, DG)
  ```

  The non-person identity inventory's are in its README's permission table, row `inventory`: `Application.Read.All` and `Directory.Read.All`, and Azure `Reader`.
- **The certificate:** the reader app's certificate as a `.pfx` in a credential folder that only the run account and the server's administrators can open, named by `auth.certificatePath`, as the Provider Notices run keeps its readers' files ([WD-179](../../docs/about/decision-register.md#wd-179)). Learn documents both sign-ins it uses: `Connect-AzAccount -ServicePrincipal -CertificatePath` takes a PKCS#12 file, and `Connect-MgGraph -Certificate` takes the certificate object. `-CertificatePassword` is optional in `Connect-AzAccount`'s syntax, but Learn doesn't say a file without one signs in: prove it in the test stage. `auth.certificateThumbprint` instead finds the certificate in `CurrentUser\My` or `LocalMachine\My`; Learn says `Connect-MgGraph -CertificateThumbprint` reads the current user's store and names no store for `Connect-AzAccount`'s, so the run loads the certificate itself for Graph. `"method": "managedIdentity"` uses the host's managed identity, but Learn shows an Arc-enabled server's identity only through its local token endpoint, not through `Connect-AzAccount -Identity` or `Connect-MgGraph -Identity`.

### The settings

Copy [`config/settings.template.json`](config/settings.template.json) outside the kit's folder and fill in every `<placeholder>`. A live run refuses a placeholder, and any run refuses a secret-like setting (`secret`, `password`, `apikey`, `privatekey` in a key's name). Leave `kits` out when the kits sit side by side, as they do in the zip.

### Run it once by hand, as the run account

```powershell
Set-Location D:\EstateInventory\estate-inventory-code\estate-inventory
./Invoke-EstateInventory.ps1 -SettingsPath D:\EstateInventory\settings.json
```

### Schedule it

Windows Task Scheduler's own cmdlets, as the [Provider Notices deployment runbook](../../docs/project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md) registers its weekly run under a gMSA. Not yet run by the authors.

```powershell
$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument '-NoProfile -NonInteractive -File "D:\EstateInventory\estate-inventory-code\estate-inventory\Invoke-EstateInventory.ps1" -SettingsPath "D:\EstateInventory\settings.json"'
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2am
$principal = New-ScheduledTaskPrincipal -UserId '<domain>\<run-as-gmsa>$' -LogonType Password
Register-ScheduledTask -TaskName 'FMW Estate Inventory' -Action $action -Trigger $trigger -Principal $principal
Start-ScheduledTask -TaskName 'FMW Estate Inventory'
```

## Where it runs

On a domain-joined Windows Server member server, not a domain controller and not a person's workstation, with RSAT's ActiveDirectory module, Windows PowerShell 5.1, PowerShell 7, Microsoft Graph PowerShell and Az.Accounts. It needs ADWS (TCP 9389) to the domain controllers for the Start Kit and the AD reads, and outbound HTTPS to `login.microsoftonline.com`, `graph.microsoft.com` and `management.azure.com`.

Whether that server can be the platform host (Book 10, Appendix B) isn't decided: the host's closed list of interfaces doesn't yet include this run's account, its app certificate, ADWS to the domain controllers or `management.azure.com` for reads, and the list says anything outside it is a drift finding or a decision to record.

## Not covered

- It doesn't compare a run with the last one. The kits' own drift runs do that (`Invoke-NpiDriftRun.ps1`, `Invoke-PaEvidenceRun.ps1`, the drift pipeline's `compare`), from the folders this run writes.
- No kit here lists every Entra user, group and device; the Start Kit's counts cover AD only.
- It doesn't sign the run folder. `SHA256SUMS` shows nothing changed after the run; an immutable store keeps it from changing afterwards.
