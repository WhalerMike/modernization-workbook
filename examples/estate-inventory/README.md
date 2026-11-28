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
  EnvironmentProfile.json             the forest, domains, domain controllers, sites, trusts, tenant,
                                      cloud and Azure scopes the kits read, each with its source file,
                                      and the manifest's SHA-256 (see "The environment profile")
  Summary.md                          one table: step, status, output, controls, KSIs
  SHA256SUMS                          every file in the run folder
```

Exit code 0: every step passed (or, in a fixture run, was recorded). 2: a step ended in `Error`, the validation kit in `Partial` (some checks ended in `Error`), or the environment profile couldn't be written (`logs/environment-profile.log` says why). 1: the settings were refused, and nothing ran.

`Test-EiRun -Path <run>` (in `powershell/EstateInventory`) rechecks `SHA256SUMS` and each kit manifest's hash, and lists what changed.

## Requirements and KSIs

[`config/requirements.json`](config/requirements.json) gives each step its NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs; the run copies them into the manifest and `Summary.md`. Every pairing is one the workbook's kits already record.

| Step | Controls | KSIs |
|---|---|---|
| `start-kit` | CM-8, AC-2 | KSI-PIY-GIV, KSI-IAM-AAM |
| `non-person-identity` | AC-2, CM-8, IA-4, IA-5 | KSI-PIY-GIV, KSI-IAM-SNU |
| `privileged-access` | AC-2, AC-6 | KSI-IAM-AAM, KSI-IAM-ELP |
| `validation-kit` | CA-7 | KSI-MLA-EVC |
| the environment profile | CM-8 | KSI-PIY-GIV |
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
  environment-profile  fixture   EnvironmentProfile.json: 18 filled, 1 in conflict, 0 not collected
Written to C:\FMWLabs\results\estate-inventory\<run> (EstateInventoryManifest.json, EnvironmentProfile.json, Summary.md, SHA256SUMS)
```

The Start Kit reads only a live forest, so a fixture run copies its recorded run (`start-kit/tests/fixtures/result-assessment/run-nov`) and marks the step `Recorded`. Each run keeps its own folder; list them with:

```powershell
Get-ChildItem C:\FMWLabs\results\estate-inventory -Name
```

The tests: `Invoke-Pester -Path tests` (Pester 5, PowerShell 7 on Windows; 44 tests, about a minute). `EstateInventory.Tests.ps1` runs the fixture run twice, checks its environment profile against the schema, refuses a secret, a placeholder and an unknown label, catches a changed file, and runs the live path with a stand-in Start Kit in Windows PowerShell 5.1 and no certificate, so each cloud step fails on its own. `FmpEnvironment.Tests.ps1`, the loader's tests, also pass in Windows PowerShell 5.1 with Pester 5.

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

Copy [`config/settings.template.json`](config/settings.template.json) outside the kit's folder and fill in every `<placeholder>`. A live run refuses a placeholder, and any run refuses a secret-like setting (`secret`, `password`, `apikey`, `privatekey` in a key's name). Leave `kits` out when the kits sit side by side, as they do in the zip. Set `environmentLabel` to `test` for a run against the test forest and test tenant, and to `production` for the platform host's weekly run: it goes into the environment profile, and the labs fill their placeholders only from a profile labelled `test`.

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

## The environment profile

`EnvironmentProfile.json` (schema: [`config/environment-profile.schema.json`](config/environment-profile.schema.json)) holds the names and IDs the workbook's Lab 2s ask you to type. The run writes it after the manifest, from files the kits wrote in the run folder and nothing else: it makes no call of its own to Active Directory, Entra ID or Azure. It holds no secret and no list of users, groups or accounts, and it leaves out the domain controllers' addresses and the domains' SIDs.

| Fields | Read from | What |
|---|---|---|
| `ad.forestName`, `ad.forestRootDomain`, `ad.forestMode`, `ad.domains`, `ad.sites`, `ad.upnSuffixes` | The Start Kit's `<root-domain>/Forest/ForestTopology.json` | The forest |
| `ad.domainDetails`, `ad.rootDomain.netBiosName`, `ad.rootDomain.distinguishedName`, `ad.rootDomain.domainMode`, `ad.rootDomain.pdcEmulator` | The same file | Each domain's DNS and NetBIOS names, functional level, distinguished name, parent and PDC emulator |
| `ad.domainControllers` | The same file | Each domain controller's host name, domain, site and operating system, and whether it is a global catalog or read-only |
| `ad.trusts` | Each domain's `Trusts/TrustMap.json` | Each trust's name, direction and type, and whether it is within the forest or forest-transitive |
| `cloud`, `tenantId` | Each cloud kit's own manifest: `non-person-identity/<domain>/manifest.json`, `privileged-access/manifest.json`, `validation-kit/<run>/ValidationManifest.json` | The cloud setting and the tenant each kit read |
| `azure.subscriptionIds`, `azure.managementGroupIds` | The same manifests' Azure Resource Manager requests, and the Azure scopes in `privileged-access/inventory.csv` | The subscriptions and management groups the run read |
| `graphEnvironment`, `azureEnvironment` | `cloud` | `Global` and `AzureCloud`: Microsoft 365 GCC (Moderate) uses the global Graph endpoint and commercial Azure, as the run itself signs in |

Each field has a status. `ok`: the sources agree, and the value is there with the file and key each source gave. `conflict`: two sources disagree, and there is no value. In a fixture run `tenantId` is a conflict, because the kits' fixtures are separate fictional tenants; in a live run it means one kit read a different tenant from the others. `notCollected`: no step that finished wrote the file, and `reason` says which. The provenance records the run, its label (`test`, `production`, `fixture`, or `unlabelled` when the settings have no `environmentLabel`), the time in UTC, `EstateInventoryManifest.json`'s SHA-256 and each source file's SHA-256; `SHA256SUMS` covers the profile.

### Reading it in a lab

[`powershell/FmpEnvironment`](powershell/FmpEnvironment/FmpEnvironment.psm1) reads the profile in Windows PowerShell 5.1 and PowerShell 7, and reads files only. `Import-FmpEnvironment -Path <run>` refuses a profile older than `-MaxAgeDays` (8 by default: a weekly run and a day), one whose manifest no longer has the SHA-256 it recorded, one that changed after the run (`SHA256SUMS`), and one whose label isn't `-Expect` (`test` by default; `fixture` for Lab 1's run). `Get-FmpEnvironmentValue` gives one field, by its name or by a lab's placeholder, and refuses a conflict, a field not collected, and a one-value placeholder when the run saw several values. `Get-FmpEnvironmentPlaceholder` lists the placeholders it fills, and `Expand-FmpPlaceholder '<command>'` prints a lab command with them filled in. On Lab 1's run, from this folder:

```powershell
Import-Module ./powershell/FmpEnvironment/FmpEnvironment.psd1
$run = Get-ChildItem C:\FMWLabs\results\estate-inventory -Directory | Sort-Object Name | Select-Object -Last 1
Import-FmpEnvironment -Path $run.FullName -Expect fixture
Expand-FmpPlaceholder 'Get-ADDomainController -Filter * -Server <test-domain> | Select-Object Name, Site'
```

The last line prints `Get-ADDomainController -Filter * -Server contoso.example | Select-Object Name, Site`. [Set Up for the Labs](../../docs/training/lab-setup.md#environment-profile) lists the placeholders it fills and the commands for a test environment.

## Where it runs

On a domain-joined Windows Server member server, not a domain controller and not a person's workstation, with RSAT's ActiveDirectory module, Windows PowerShell 5.1, PowerShell 7, Microsoft Graph PowerShell and Az.Accounts. It needs ADWS (TCP 9389) to the domain controllers for the Start Kit and the AD reads, and outbound HTTPS to `login.microsoftonline.com`, `graph.microsoft.com` and `management.azure.com`.

On the platform host ([Book 10, Appendix B, D.6](../../docs/books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md#d.6-estate-inventory)), as [WD-180](../../docs/about/decision-register.md#wd-180) sets out: a weekly scheduled task under the assessment gMSA `gmsa-fmpassess$` at Tier A, the reader app's certificate in `D:\EstateInventory\credentials\`, and the kits, settings and runs under `D:\EstateInventory\`. Appendix B lists each plane this adds: the identities, the storage, ADWS to the domain controllers and the egress host names.

## Not covered

- It doesn't compare a run with the last one. The kits' own drift runs do that (`Invoke-NpiDriftRun.ps1`, `Invoke-PaEvidenceRun.ps1`, the drift pipeline's `compare`), from the folders this run writes.
- No kit here lists every Entra user, group and device; the Start Kit's counts cover AD only.
- No kit here reads the tenant's domains, so the environment profile has no tenant domain (`<tenant>.onmicrosoft.com`) and no test user or account.
- It doesn't sign the run folder. `SHA256SUMS` shows nothing changed after the run; an immutable store keeps it from changing afterwards.
