# Day 2 at work: the managed service account test script

The commands that produce the evidence behind the [production proposal](msa-production-proposal.docx). Part R reads production and changes nothing. Part T creates one gMSA in a **test domain**, installs and tests it on a test host, and backs it out. Each step names the evidence file it saves and the proposal placeholder it fills. Then [proposal-prompts.md](proposal-prompts.md) helps you fill the placeholders with Microsoft 365 Copilot Chat.

Neutral template from the Federal Modernization Workbook: every name below is a placeholder or the workbook's fictional `contoso.example`. Your results name your agency's servers and accounts, so they stay at work, in the agency's own storage. Nothing goes back to the public workbook.

## The rules for today

- **Part R first, and only reads.** Every Part R command is a `Get-` cmdlet, `Get-Acl` or `setspn -X`. Nothing writes to Active Directory, a host, SailPoint or ServiceNow.
- **Part T only in a test domain.** The program sends every production write for a managed service account through the approved Chapter 06 plan, the smoke-test account included ([WD-168](https://whalermike.github.io/modernization-workbook/docs/about/decision-register.html#wd-168)). A "test OU" inside the production domain is still production: don't create anything there by hand today. If you have no test domain, stop after Part R; the proposal's Phase 0 asks for one.
- **No secrets anywhere.** Don't run `Get-KdsRootKey` for this: it returns the root key's value as well as its ID. Step R1 reads the key's times only. Never paste a password, a key value or a token into Copilot, a ticket or an email.
- **Microsoft Learn first.** Each command is Learn's; the service accounts guide's [A1 and A2](https://whalermike.github.io/modernization-workbook/docs/books/guides/service-account-migration.html#migration-a) and [Module 15](https://whalermike.github.io/modernization-workbook/docs/training/non-person-identity/15-your-first-gmsa.html) say why.

## Before you start

You need a domain-joined Windows machine with the RSAT Active Directory module, signed in with your normal domain account (not a Domain Admin; R1 tells you if your account can't read the KDS key times). Unzip `msa-request-pack.zip` to `C:\FMWLabs\msa-request-pack`. Open **Windows PowerShell** and set the values you know; `<service-account-ou>` is the OU you plan to use, which may not exist yet:

```powershell
Set-Location C:\FMWLabs\msa-request-pack\proposal
$Day2 = 'C:\MsaDay2'
$ServiceAccountOu = '<service-account-ou>'
New-Item -ItemType Directory -Path $Day2 -Force | Out-Null
```

## Part R: production, read only (about 20 minutes)

### R0 to R8: one run

```powershell
.\Invoke-MsaDay2ReadOnly.ps1 -ServiceAccountOu $ServiceAccountOu -OutputPath $Day2
```

It prints one line per step and writes a folder `C:\MsaDay2\<run>` named for the UTC time. Expected shape (your values differ):

```text
R0  corp.contoso.example: results in C:\MsaDay2\2026-11-30T140501Z
R1  KDS root key: one key
R2  Domain controllers: 4 x Windows Server 2019 Datacenter
R3  Forest Windows2016Forest; domain Windows2016Domain
R4  User accounts used as services: 37, 52 SPNs, 3 with adminCount 1
R5  Duplicate SPNs: 0
R6  Managed service accounts: 2 msDS-GroupManagedServiceAccount
R7  Service-account OU: does not exist yet: part of the one-time setup
R8  Explicit create-child rights that would also create a dMSA: 6 ACE(s)
Done: C:\MsaDay2\2026-11-30T140501Z (summary.json holds every placeholder value; manifest.json the SHA-256 of each file)
```

| Step | What it reads | Evidence file | Fills |
|---|---|---|---|
| R0 | Who ran it, the domain and forest | `00-context.json` | `<domain-fqdn>` |
| R1 | The KDS root keys' creation and start times, never the value ([Learn: create the KDS root key](https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key)) | `01-kds-root-keys.json` | `<kds-key-count>`, `<kds-key-created>` |
| R2 | Each domain controller's operating system | `02-domain-controllers.csv` | `<dc-os-summary>`, `<ws2025-dc-count>` |
| R3 | Forest and domain functional levels | `03-functional-levels.json` | `<forest-functional-level>`, `<domain-functional-level>` |
| R4 | User accounts with an SPN or trusted for delegation, Learn's criteria ([Learn](https://learn.microsoft.com/entra/architecture/service-accounts-user-on-premises)) | `04-user-service-accounts.csv` | `<user-service-account-count>`, `<spn-count>`, `<privileged-service-account-count>`, candidates for `<pilot-workload>` |
| R5 | Duplicate SPNs in the forest (`setspn -X -F`) | `05-duplicate-spns.txt` | `<duplicate-spn-count>` |
| R6 | sMSAs, gMSAs and dMSAs already in the domain | `06-managed-service-accounts.csv` | `<existing-gmsa-count>` |
| R7 | Who may create objects in `<service-account-ou>` | `07-service-account-ou-acl.csv` | `<service-account-ou-status>` |
| R8 | Explicit create-child rights on every OU that would also create a dMSA (all child objects, or the dMSA class) | `08-ou-create-child-rights.csv` | `<create-child-holders>` |
| — | Every value above | `summary.json`, `manifest.json` | All of the above |

**Reading the results.**

- R1 `one key` is what you want. `none found, or not readable by this account` means either no key or no read right: ask a Domain Admin to run R1's read (below) rather than `Get-KdsRootKey`. More than one key is a finding: Learn says gMSAs fail after a password rotation when a forest has more than one.
- R2 decides the dMSA date: a dMSA needs at least one Windows Server 2025 domain controller the hosts can find, and every host that uses it on Windows Server 2025 ([Learn: dMSA FAQ](https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-faq)). With none, the proposal is gMSAs now.
- R8 lists explicit rights only; inherited ones show on the OU they come from. Once a Windows Server 2025 domain controller exists, any holder could create a dMSA, which is why the program keeps that right to Domain Admins ([Who may create a dMSA](https://whalermike.github.io/modernization-workbook/docs/books/guides/service-account-migration.html#sam-dmsa-create-right)).

R1's read alone, for a Domain Admin to run if your account can't read the key times:

```powershell
$cfg = (Get-ADRootDSE).configurationNamingContext
Get-ADObject -SearchBase "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,$cfg" -LDAPFilter '(objectClass=msKds-ProvRootKey)' -Properties 'msKds-CreateTime', 'msKds-UseStartTime' |
    Select-Object Name, @{ n = 'CreatedUtc'; e = { [datetime]::FromFileTimeUtc([int64]$_.'msKds-CreateTime') } }, @{ n = 'UsableFromUtc'; e = { [datetime]::FromFileTimeUtc([int64]$_.'msKds-UseStartTime') } } |
    Tee-Object -FilePath "$Day2\01b-kds-root-keys-admin.txt"
```

### R9: Chapter 12's read of the managed accounts (optional, PowerShell 7)

The Non-Person Identity kit's Chapter 12 reads every gMSA and dMSA and checks it against the standard. Its only Active Directory call is `Get-ADServiceAccount`. You need `non-person-identity-code.zip` unzipped to `C:\FMWLabs\non-person-identity-code` and PowerShell 7.1 or later. With no SailPoint export or register yet, its inputs are the kit's empty files, so every existing account shows as one nobody has explained: that is the backlog the proposal's waves work through.

```powershell
pwsh
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity
$Day2 = 'C:\MsaDay2'
$In = "$Day2\ch12-inputs"
New-Item -ItemType Directory -Path "$In\requests" -Force | Out-Null
Copy-Item tests\fixtures\m15\inputs\*.csv $In
@{ domain = '<domain-fqdn>'; serviceAccountOu = '<service-account-ou>'; groupOu = '<groups-ou>' } | ConvertTo-Json | Set-Content "$Day2\ch12-standard.json"
./Invoke-NpiGmsaStandard.ps1 -InputPath $In -StandardPath "$Day2\ch12-standard.json" -OutputPath "$Day2\09-ch12" -Server '<domain-fqdn>'
```

Evidence: `09-ch12\inputs\ad-managed-accounts.json`, `findings.json` and `manifest.json`. Fills: `<existing-gmsa-count>` (checked against R6) and the open items' backlog.

## Part T: one gMSA in the test domain (about 30 minutes, plus a restart)

Run it in a **test domain** only, as a Domain Admin of that domain, on its domain controller, with a member server for `<test-host>`. These are Module 15's Lab 2 steps 5 to 7 ([Module 15](https://whalermike.github.io/modernization-workbook/docs/training/non-person-identity/15-your-first-gmsa.html)), with each result saved. The values you supply: `<test-domain-dn>`, `<test-domain-fqdn>`, `<TESTDOMAIN>` (its NetBIOS name), `<test-ou>` (such as `OU=Service Accounts,<test-domain-dn>`), `<test-groups-ou>` and `<test-host>`.

```powershell
$T = 'C:\MsaDay2\test'
New-Item -ItemType Directory -Path $T -Force | Out-Null
```

### T1. The KDS root key in the test domain

```powershell
Get-KdsRootKey | Select-Object KeyId, EffectiveTime, CreationTime | Tee-Object -FilePath "$T\T1-kds.txt"
Get-KdsRootKey | Test-KdsRootKey | Tee-Object -FilePath "$T\T1-kds.txt" -Append
```

**Expected:** one key, and `True`. With none, follow Module 15's Lab 2 step 1: the backdated key is only for a test domain with one domain controller; anywhere else, `Add-KdsRootKey -EffectiveImmediately` and wait 10 hours. Fills: the proposal's Phase 0 exit.

### T2. Create the test gMSA

```powershell
New-ADGroup -Name "DL-gMSA-day2test-Hosts" -SamAccountName "DL-gMSA-day2test-Hosts" -GroupScope DomainLocal -Path "<test-groups-ou>"
Add-ADGroupMember -Identity "DL-gMSA-day2test-Hosts" -Members "<test-host>$"
New-ADServiceAccount -Name gmsa-day2test -DNSHostName gmsa-day2test.<test-domain-fqdn> -Path "<test-ou>" -RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 -PrincipalsAllowedToRetrieveManagedPassword "DL-gMSA-day2test-Hosts" -KerberosEncryptionType AES256 -Description "SystemId=TEST; Environment=test; Request=DAY2; Change=DAY2"
Get-ADServiceAccount -Identity gmsa-day2test -Properties PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval, Description |
    Select-Object Name, ObjectClass, PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval, Description | Tee-Object -FilePath "$T\T2-create.txt"
```

**Expected:** `ObjectClass` `msDS-GroupManagedServiceAccount`, the hosts' group as the retriever, `AES256`, `30`. The name `gmsa-day2test` is 13 characters, inside the standard's 15.

### T3. Install and test it on the test host

Restart `<test-host>` so it picks up its group membership. Then, in an elevated Windows PowerShell on `<test-host>` with the RSAT Active Directory module:

```powershell
$T = 'C:\MsaDay2\test'
New-Item -ItemType Directory -Path $T -Force | Out-Null
Install-ADServiceAccount -Identity gmsa-day2test
Test-ADServiceAccount -Identity gmsa-day2test | Tee-Object -FilePath "$T\T3-test-adserviceaccount.txt"
```

**Expected:** `True`. Fills: `<test-result>`.

### T4. Run a test service as it

```powershell
New-Service -Name MsaDay2Test -BinaryPathName "C:\Windows\System32\svchost.exe -k netsvcs" -StartupType Manual
sc.exe config MsaDay2Test obj= "<TESTDOMAIN>\gmsa-day2test$" password= ""
sc.exe qmanagedaccount MsaDay2Test | Tee-Object -FilePath "$T\T4-qmanagedaccount.txt"
```

**Expected:** `qmanagedaccount` reports `TRUE`. The service only takes the identity; it isn't meant to start. Fills: `<test-result>`.

### T5. Back it out

On `<test-host>`:

```powershell
sc.exe delete MsaDay2Test
Uninstall-ADServiceAccount -Identity gmsa-day2test
```

On the test domain controller:

```powershell
Remove-ADServiceAccount -Identity gmsa-day2test -Confirm:$false
Remove-ADGroup -Identity "DL-gMSA-day2test-Hosts" -Confirm:$false
Get-ADServiceAccount -Filter "Name -eq 'gmsa-day2test'" | Tee-Object -FilePath "$T\T5-backout.txt"
```

**Expected:** the last command returns nothing. Keep the test domain's KDS root key. Copy `T3` and `T4` from the host into `C:\MsaDay2\test` on the domain controller, then hash them:

```powershell
Get-ChildItem C:\MsaDay2\test -File | Get-FileHash -Algorithm SHA256 | Select-Object Hash, Path | Tee-Object -FilePath C:\MsaDay2\test\T-manifest.txt
```

## Fill the proposal

1. Open `summary.json` from Part R and the `T` files from Part T.
2. Use prompt 1 in [proposal-prompts.md](proposal-prompts.md) to map them to the placeholders, then prompt 2 to look for gaps, and prompt 3 for the change advisory board's summary.
3. Keep the evidence folder with the proposal in the agency's storage. The manifests' SHA-256 values show the files haven't changed since the run.
