---
title: "Chapter 08 — AD CS Dependencies"
description: "Book 06 Chapter 22 and Runbook R10 as code: a read-only list of the certificates SQL Server depends on, by class (the TLS certificate, certificate-mapped logins and endpoints, and certificate-based sign-in held as the NTLM interim), with the ones an enterprise AD CS CA issued and the ones inside the expiry window. Book 07 owns the issuer decision and the lifecycle platform; this chapter feeds it. Labs on the kit's certificate fixture and on R10's reads of one test instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 8
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 08 — AD CS Dependencies

*Before anyone dates a change to the certificate authority, someone has to list what it still signs for SQL Server.*

::: {.callout-note}
## In this chapter
The code behind [Book 06, Chapter 22](../../../books/b06-data-platform/22-where-sql-server-touches-adcs.md) and [Runbook R10](../../../books/b06-data-platform/r10-certificate-discovery-for-adcs.md). [Book 07](../../../books/b07-pki/index.md) owns the decision: which issuer serves which certificate, and the lifecycle platform that renews them ([Chapter 04](../../../books/b07-pki/04-the-target-pki.md#the-issuer-decision-for-internal-server-certificates)). This chapter doesn't restate it. It reads R10's inventory and says, for each certificate, its class, whether an enterprise AD CS CA issued it, and how long it has left. Lab 1 runs on the kit's five fictional certificates. Lab 2 runs R10's reads on one test instance and its host, saves them in the fixture's shape by hand, and changes nothing.
:::

## Goal and audience

**Goal.** By the end of this chapter you can hand Book 07's owners a list of every certificate SQL Server depends on, with its class, issuer, expiry and the action each needs, before any CA date is set.

**Audience.** Developers who maintain the kit, DBAs, and the PKI owner. You don't need an instance until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Microsoft lists what a SQL Server TLS certificate must have: the Server Authentication enhanced key usage, a `KeySpec` of `AT_KEYEXCHANGE` from a legacy provider (a Key Storage Provider gives `KeySpec = 0`, which SQL Server can't use), and every client name in the Subject Alternative Name. SQL Server checks validity only when the certificate is configured, but clients that validate the certificate fail on an expired one.[^sq08-certreq] With no certificate configured, SQL Server loads one from the computer store whose subject holds the machine's FQDN, or else a self-generated one.[^sq08-encryption] The configured thumbprint is in the `SuperSocketNetLib` registry key, which `sys.dm_server_registry` returns.[^sq08-registry] `sys.server_principals` marks a login mapped to a certificate as type `C`,[^sq08-principals] and such logins are used only for code signing; they can't connect.[^sq08-create-login] `sys.certificates` gives each certificate's `issuer_name`, `expiry_date` and the login SID in `sid`.[^sq08-certificates] `CREATE CERTIFICATE` can make a self-signed certificate, and the built-in signing functions don't check expiry, though Service Broker and backup encryption do.[^sq08-create-cert] `sys.database_mirroring_endpoints` shows how each endpoint authenticates and the `certificate_id` it uses.[^sq08-endpoints] Microsoft Cloud PKI issues only to devices enrolled in Intune.[^sq08-cloudpki]

### What it leaves to you

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Each read is on its own page | The TLS certificate, `master` and the endpoints are three places to look | R10's reads, saved in one fixture shape (`tests/fixtures/certs/certs.json`) |
| Every certificate has an issuer name | Nobody has said which issuers are your enterprise CAs | `enterpriseCAs` in the inventory; the kit compares each issuer to it |
| Expiry matters differently by class | A TLS expiry breaks clients; a signing certificate's doesn't lock anyone out | The class on every row, and a warning window from `config/thresholds.json` (90 days) |
| The issuer decision isn't Learn's | SQL Server's TLS certificate comes from the retained AD CS hierarchy through the lifecycle platform | The action text points at Book 07, not at a product |

## The code

`Invoke-SqlCertDependency.ps1` reads the inventory and calls `Get-SqlCertificateDependency`. Each certificate's `use` becomes its class:

| `use` | Class | Action when an enterprise AD CS CA issued it |
|---|---|---|
| `tls` | TLS for client connections | "Retained AD CS issues it through the CLM platform (Book 07, Ch 04); move it before this CA is retired" |
| `login` | Certificate-mapped login | "Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)" |
| `endpoint` | Certificate-mapped endpoint | The same as `login` |
| `client-auth` | Certificate-based sign-in (NTLM interim) | "NTLM interim: it also depends on the domain controllers certificates; retire it with the interim posture" |

`ADCS` is `yes` when the issuer is one of `enterpriseCAs`. `ExpiresInDays` counts from the inventory's `asOf` date; `Warning` says `expired` or `expires within 90 days`. A certificate not issued by AD CS gets "Not AD CS: track it in the certificate lifecycle platform".

The action text follows [Book 06, Chapter 22](../../../books/b06-data-platform/22-where-sql-server-touches-adcs.md#certificates-and-the-clm-platform) and [Book 07, Chapter 04](../../../books/b07-pki/04-the-target-pki.md#the-issuer-decision-for-internal-server-certificates). Book 07 keeps a retained AD CS hierarchy as the issuer of internal server TLS certificates, so a TLS row stays on AD CS, issued and renewed through the lifecycle platform, and its deadline is the issuing CA it chains to being retired, not AD CS as a whole. A certificate-mapped login or endpoint isn't renewed by the platform, so it's replaced or re-mapped by hand before its CA is retired. The certificate-based sign-in row also depends on the domain controllers' certificates, which [Book 07, Chapter 07](../../../books/b07-pki/07-coexistence-and-migration.md) keeps on AD CS autoenrollment until the last domain controller retires, so it goes when the NTLM interim posture does. The entry script's last line still reads "Blocking an AD CS decommission: N of M": it counts the rows an enterprise AD CS CA issued, each of which needs its action before that CA is retired.

::: {.callout-important}
## Illustrative code
Lab 1 reads the kit's fictional certificate inventory. Tested against fixtures, not a live instance or CA.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\sql-server-identity-08\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: List the certificates
./Invoke-SqlCertDependency.ps1 -CertsPath tests/fixtures/certs/certs.json -OutputPath "$Run/certs"

# Step 2: Read the action for each
Import-Csv "$Run/certs/certificates.csv" | Select-Object Instance, Class, Issuer, Action | Format-List

# Step 3: Widen the window
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
Get-SqlCertificateDependency -Certs (Read-SqlJson tests/fixtures/certs/certs.json) -WarningDays 365 | Format-Table Instance, Class, ExpiresInDays, Warning -AutoSize

# Step 4: Open the manifest
Get-Content "$Run/certs/manifest.json"

# Step 5: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 08*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# After the steps
Get-ChildItem C:\FMWLabs\results\sql-server-identity-08\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped `sql-server-identity-code.zip` under the learning path's [Get the code](../../../training/data-platform/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

<!-- capture:begin 08-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-1.txt))](captures/08-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\sql-server-identity-08\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 08-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-2.txt))](captures/08-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\sql-server-identity-08\lab1\$(Get-Date -AsUTC -For… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\sql-server-identity-08\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **List the certificates.** Four of the five came from the fictional enterprise CA; two expire inside 90 days:

   ```powershell
   ./Invoke-SqlCertDependency.ps1 -CertsPath tests/fixtures/certs/certs.json -OutputPath "$Run/certs"
   ```

   ```text
   Instance Class                                    ADCS ExpiresInDays Warning
   -------- -----                                    ---- ------------- -------
   SQLPRD01 TLS for client connections               yes             72 expires within 90 days
   SQLPRD06 TLS for client connections               no             481
   SQLPRD02 Certificate-mapped login                 yes             41 expires within 90 days
   SQLPRD02 Certificate-mapped endpoint              yes            254
   SQLFCI04 Certificate-based sign-in (NTLM interim) yes            100

   Wrote 2 files and manifest.json to C:/FMWLabs/results/sql-server-identity-08/lab1/<run>/certs
   Evidence for CERTS (Find the AD CS certificates SQL Server depends on): SC-8, SC-12, SC-17; KSI-SVC-SIN, KSI-SVC-ASM
   Blocking an AD CS decommission: 4 of 5
   ```

   <!-- capture:begin 08-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-3.txt))](captures/08-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlCertDependency.ps1 -CertsPath tests/fixtures/certs/certs.json -Ou… and what it printed"}

   <!-- capture:end -->

   The SQLPRD01 TLS row matters most: in 72 days every client that validates the certificate refuses to connect, and Entra connections always validate. The SQLPRD02 login row expires sooner, but signing doesn't check expiry; the reason to replace it is its issuer.

2. **Read the action for each:**

   ```powershell
   Import-Csv "$Run/certs/certificates.csv" | Select-Object Instance, Class, Issuer, Action | Format-List
   ```

   ```text
   Instance : SQLPRD01
   Class    : TLS for client connections
   Issuer   : CONTOSO-ISSUING-CA01
   Action   : Retained AD CS issues it through the CLM platform (Book 07, Ch 04); move it before this CA is retired

   Instance : SQLPRD06
   Class    : TLS for client connections
   Issuer   : Federal Bridge Test Issuer (fictional)
   Action   : Not AD CS: track it in the certificate lifecycle platform

   Instance : SQLPRD02
   Class    : Certificate-mapped login
   Issuer   : CONTOSO-ISSUING-CA01
   Action   : Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)

   Instance : SQLPRD02
   Class    : Certificate-mapped endpoint
   Issuer   : CONTOSO-ISSUING-CA01
   Action   : Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)

   Instance : SQLFCI04
   Class    : Certificate-based sign-in (NTLM interim)
   Issuer   : CONTOSO-ISSUING-CA01
   Action   : NTLM interim: it also depends on the domain controllers certificates; retire it with the interim posture
   ```

   <!-- capture:begin 08-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-4.txt))](captures/08-4.png){.lightbox fig-alt="Terminal window showing Import-Csv '$Run/certs/certificates.csv' | Select-Object Instance, Class, Iss… and what it printed"}

   <!-- capture:end -->

3. **Widen the window.** The 90 days is a default in `config/thresholds.json`; a parameter changes it for one run:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   Get-SqlCertificateDependency -Certs (Read-SqlJson tests/fixtures/certs/certs.json) -WarningDays 365 | Format-Table Instance, Class, ExpiresInDays, Warning -AutoSize
   ```

   ```text
   Instance Class                                    ExpiresInDays Warning
   -------- -----                                    ------------- -------
   SQLPRD01 TLS for client connections                          72 expires within 365 days
   SQLPRD06 TLS for client connections                         481
   SQLPRD02 Certificate-mapped login                            41 expires within 365 days
   SQLPRD02 Certificate-mapped endpoint                        254 expires within 365 days
   SQLFCI04 Certificate-based sign-in (NTLM interim)           100 expires within 365 days
   ```

   <!-- capture:begin 08-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-5.txt))](captures/08-5.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

4. **Open the manifest:**

   ```powershell
   Get-Content "$Run/certs/manifest.json"
   ```

   ```text
   {
     "step": "CERTS",
     "title": "Find the AD CS certificates SQL Server depends on",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "SC-8",
       "SC-12",
       "SC-17"
     ],
     "ksis": [
       "KSI-SVC-SIN",
       "KSI-SVC-ASM"
     ],
     "files": [
       {
         "file": "certificates.csv",
         "sha256": "daeb5397c44c213e7b106f47eb57416578a4b27e28e3a71e49c17a50b5f622b1"
       },
       {
         "file": "certificates.json",
         "sha256": "e44433e5c534443c6bcffeaad45ce0acda5fa343613b791dd35eccd2bda34a84"
       }
     ]
   }
   ```

   <!-- capture:begin 08-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-6.txt))](captures/08-6.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/certs/manifest.json' and what it printed"}

   <!-- capture:end -->

5. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 08*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             3           0
   ```

   <!-- capture:begin 08-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-7.txt))](captures/08-7.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 08*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\sql-server-identity-08\lab1 -Name
```

<!-- capture:begin 08-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/08-8.txt))](captures/08-8.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\sql-server-identity-08\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test instance

**The authors haven't run this lab.** Every step reads; nothing is issued, bound, changed or restarted. Use one test instance and its host, never production. Work in `examples/sql-server-identity` on the instance's host, in PowerShell 7 with the SqlServer module, signed in to Windows as a test reader whose login holds `VIEW SERVER PERFORMANCE STATE`, `VIEW SERVER SECURITY STATE` and `VIEW ANY DEFINITION` (SQL Server 2022 and later; `VIEW SERVER STATE` on earlier versions), never `sysadmin`.[^sq08-registry][^sq08-endpoints] You'll replace: `<test-instance>` (host,port), `<instance-name>` (as the audit names it), `<enterprise-ca>` (each issuing CA name of your enterprise AD CS), and, in step 5, the values you read in steps 1 to 4.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: The configured TLS thumbprint
Invoke-Sqlcmd -ServerInstance '<test-instance>' -Encrypt Mandatory -Query "SELECT registry_key, value_name, value_data FROM sys.dm_server_registry WHERE registry_key LIKE N'%SuperSocketNetLib%' AND value_name = N'Certificate';"

# Step 2: The host's certificates
Get-ChildItem Cert:\LocalMachine\My | Select-Object Thumbprint, Subject, Issuer, NotAfter, @{ n = 'Eku'; e = { $_.EnhancedKeyUsageList.FriendlyName -join ',' } } | Format-List

# Step 3: Certificate-mapped logins and their certificates
Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -Encrypt Mandatory -Query "SELECT sp.name AS login_name, c.name AS cert_name, c.issuer_name, c.subject, c.expiry_date, CONVERT(varchar(64), c.thumbprint, 2) AS thumbprint FROM sys.server_principals sp JOIN sys.certificates c ON c.sid = sp.sid WHERE sp.type = 'C';"

# Step 4: Endpoints and the certificates behind them
Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -Encrypt Mandatory -Query "SELECT e.name, e.connection_auth_desc, c.name AS cert_name, c.issuer_name, c.expiry_date FROM sys.database_mirroring_endpoints e LEFT JOIN sys.certificates c ON c.certificate_id = e.certificate_id;"

# Step 5: Save the reads in the fixture's shape, by hand
New-Item -ItemType Directory -Force lab2 | Out-Null
@{
  asOf = (Get-Date -Format yyyy-MM-dd)
  enterpriseCAs = @('<enterprise-ca>')
  certificates = @(
    @{ instance = '<instance-name>'; use = 'tls'; subject = '<tls-subject>'; issuer = '<tls-issuer>'; thumbprint = '<tls-thumbprint>'; notAfter = '<tls-notafter>' }
    @{ instance = '<instance-name>'; use = 'login'; login = '<login-name>'; subject = '<login-cert-subject>'; issuer = '<login-cert-issuer>'; thumbprint = '<login-cert-thumbprint>'; notAfter = '<login-cert-expiry>' }
    @{ instance = '<instance-name>'; use = 'endpoint'; endpoint = '<endpoint-name>'; subject = '<endpoint-cert-subject>'; issuer = '<endpoint-cert-issuer>'; thumbprint = '<endpoint-cert-thumbprint>'; notAfter = '<endpoint-cert-expiry>' }
  )
} | ConvertTo-Json -Depth 4 | Set-Content lab2/certs.json

# Step 6: Run the dependency list on your reads
./Invoke-SqlCertDependency.ps1 -CertsPath lab2/certs.json -OutputPath lab2/out/certs

# Step 7: Back it out
Remove-Item -Recurse -Force lab2
```

:::

<!-- labs:end -->

1. **The configured TLS thumbprint.** An empty value means SQL Server picked a certificate itself:

   ```powershell
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -Encrypt Mandatory -Query "SELECT registry_key, value_name, value_data FROM sys.dm_server_registry WHERE registry_key LIKE N'%SuperSocketNetLib%' AND value_name = N'Certificate';"
   ```

2. **The host's certificates.** Find the thumbprint from step 1, or the one with the machine's FQDN:

   ```powershell
   Get-ChildItem Cert:\LocalMachine\My | Select-Object Thumbprint, Subject, Issuer, NotAfter, @{ n = 'Eku'; e = { $_.EnhancedKeyUsageList.FriendlyName -join ',' } } | Format-List
   ```

3. **Certificate-mapped logins and their certificates**, joined on `sid` as R10 corrects:

   ```powershell
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -Encrypt Mandatory -Query "SELECT sp.name AS login_name, c.name AS cert_name, c.issuer_name, c.subject, c.expiry_date, CONVERT(varchar(64), c.thumbprint, 2) AS thumbprint FROM sys.server_principals sp JOIN sys.certificates c ON c.sid = sp.sid WHERE sp.type = 'C';"
   ```

4. **Endpoints and the certificates behind them:**

   ```powershell
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -Encrypt Mandatory -Query "SELECT e.name, e.connection_auth_desc, c.name AS cert_name, c.issuer_name, c.expiry_date FROM sys.database_mirroring_endpoints e LEFT JOIN sys.certificates c ON c.certificate_id = e.certificate_id;"
   ```

   An endpoint that shows `NTLM` or `NEGOTIATE` is also an NTLM source for [Chapter 06](06-ntlm-and-the-spns.md).

5. **Save the reads in the fixture's shape, by hand.** One entry per certificate found in steps 1 to 4; add or remove entries to match. Dates are `yyyy-MM-dd`:

   ```powershell
   New-Item -ItemType Directory -Force lab2 | Out-Null
   @{
     asOf = (Get-Date -Format yyyy-MM-dd)
     enterpriseCAs = @('<enterprise-ca>')
     certificates = @(
       @{ instance = '<instance-name>'; use = 'tls'; subject = '<tls-subject>'; issuer = '<tls-issuer>'; thumbprint = '<tls-thumbprint>'; notAfter = '<tls-notafter>' }
       @{ instance = '<instance-name>'; use = 'login'; login = '<login-name>'; subject = '<login-cert-subject>'; issuer = '<login-cert-issuer>'; thumbprint = '<login-cert-thumbprint>'; notAfter = '<login-cert-expiry>' }
       @{ instance = '<instance-name>'; use = 'endpoint'; endpoint = '<endpoint-name>'; subject = '<endpoint-cert-subject>'; issuer = '<endpoint-cert-issuer>'; thumbprint = '<endpoint-cert-thumbprint>'; notAfter = '<endpoint-cert-expiry>' }
     )
   } | ConvertTo-Json -Depth 4 | Set-Content lab2/certs.json
   ```

6. **Run the dependency list on your reads:**

   ```powershell
   ./Invoke-SqlCertDependency.ps1 -CertsPath lab2/certs.json -OutputPath lab2/out/certs
   ```

   Compare the issuer of each `yes` row with Book 07's issuer for that class, and give the list to the PKI owner.

7. **Back it out.** Nothing on the instance or host changed. Delete the saved reads, or keep them inside your boundary as the R10 evidence:

   ```powershell
   Remove-Item -Recurse -Force lab2
   ```

## Verified facts

| Item | Value | GCC | Source |
|---|---|---|---|
| TLS certificate requirements | Server Authentication EKU; `KeySpec` `AT_KEYEXCHANGE` (KSP gives 0, not usable); SAN with every client name; clients that validate fail on an expired certificate | — | [^sq08-certreq] |
| Certificate precedence | Configured one; else the store certificate with the FQDN the service account can read; else self-generated | — | [^sq08-encryption] |
| `sys.dm_server_registry` | Includes `SuperSocketNetLib`; `VIEW SERVER PERFORMANCE STATE` on 2022 and later | — | [^sq08-registry] |
| Type C logins | Code signing only; can't connect | — | [^sq08-principals] [^sq08-create-login] |
| `sys.certificates` | `issuer_name`, `expiry_date`, `sid` (login SID), `thumbprint` | — | [^sq08-certificates] |
| Certificate expiry | Signing functions don't check it; Service Broker and backup encryption do | — | [^sq08-create-cert] |
| Endpoints | `connection_auth_desc` (NTLM to CERTIFICATE combinations), `certificate_id`; `VIEW SERVER SECURITY STATE` on 2022 and later | — | [^sq08-endpoints] |
| Microsoft Cloud PKI | Issues through SCEP to Intune-enrolled devices only | — | [^sq08-cloudpki] |

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| CERTS: the dependency list (Lab 1; Lab 2 step 6) | SC-8, SC-12, SC-17 | KSI-SVC-SIN, KSI-SVC-ASM | `certificates.csv` and the manifest, per instance |
| CERTS: R10's reads (Lab 2 steps 1 to 5) | SC-8, SC-12, SC-17 | KSI-SVC-SIN, KSI-SVC-ASM | The saved reads (`certs.json`) with the date and the reader |

The list supports SC-8 (the certificate that protects connections is known and dated), SC-12 (key and certificate lifecycle) and SC-17 (which PKI issued each certificate). It provides evidence; the agency's assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers, framed as in [Chapter 07](07-the-application-chain.md).

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| The TLS certificate expires after its CA goes | Clients that validate refuse to connect; every Entra connection validates | The class and window on every row; the lifecycle platform renews it from the retained AD CS hierarchy before its issuing CA is retired |
| An empty registry value read as "no certificate" | A store certificate or a self-generated one is in use, unseen | Lab 2 step 2, and R10's error-log check |
| A replacement certificate from a Key Storage Provider | `KeySpec = 0`; SQL Server can't use it | Check `KeySpec` before renewal ([Book 06, Chapter 22](../../../books/b06-data-platform/22-where-sql-server-touches-adcs.md#certificates-and-the-clm-platform)) |
| Type C logins treated as connection logins | Effort spent moving them to Entra logins, which they never needed | They sign code; replace only a certificate whose issuer is AD CS |
| An issuer missing from `enterpriseCAs` | An AD CS certificate reads `no` | The PKI owner supplies the list of enterprise CA names |

## Checklist

- [ ] Every instance in scope has R10's reads saved, with the date.
- [ ] `enterpriseCAs` lists every enterprise issuing CA, from the PKI owner.
- [ ] Every `yes` row has an owner and a date before its issuing CA changes.
- [ ] Every TLS certificate inside the window has a renewal in Book 07's lifecycle platform.
- [ ] The list went to Book 07's owners before any CA date was set.

::: {.callout-tip}
## Continue the book
[← Chapter 07 — The Application Chain](07-the-application-chain.md) · [Workbook index](index.md) · [Next: Chapter 09 — Closure, Drift and Evidence →](09-closure-drift-and-evidence.md)
:::

[^sq08-certreq]: Microsoft Learn, "Certificate Requirements for SQL Server," sections "Certificate requirements for SQL Server encryption," "Create a certificate using AD CS" and "Expired certificates," <https://learn.microsoft.com/sql/database-engine/configure-windows/certificate-requirements> (accessed Nov 24, 2026).
[^sq08-encryption]: Microsoft Learn, "Encrypt Connections by Importing a Certificate," sections "SQL Server certificate behavior with permissions" and "Certificate precedence," <https://learn.microsoft.com/sql/database-engine/configure-windows/configure-sql-server-encryption> (accessed Nov 24, 2026).
[^sq08-registry]: Microsoft Learn, "sys.dm_server_registry (Transact-SQL)," permissions and example E, <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-server-registry-transact-sql> (accessed Nov 24, 2026).
[^sq08-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)" (C = login mapped to a certificate), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Nov 24, 2026).
[^sq08-create-login]: Microsoft Learn, "CREATE LOGIN (Transact-SQL)," Remarks, <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> (accessed Nov 24, 2026).
[^sq08-certificates]: Microsoft Learn, "sys.certificates (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-certificates-transact-sql> (accessed Nov 24, 2026).
[^sq08-create-cert]: Microsoft Learn, "CREATE CERTIFICATE (Transact-SQL)," Arguments (EXPIRY_DATE) and Remarks, <https://learn.microsoft.com/sql/t-sql/statements/create-certificate-transact-sql> (accessed Nov 24, 2026).
[^sq08-endpoints]: Microsoft Learn, "sys.database_mirroring_endpoints (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-database-mirroring-endpoints-transact-sql> (accessed Nov 24, 2026).
[^sq08-cloudpki]: Microsoft Learn, "Microsoft Cloud PKI for Microsoft Intune," Prerequisites and Overview of features, <https://learn.microsoft.com/intune/cloud-pki/> (accessed Nov 24, 2026).
