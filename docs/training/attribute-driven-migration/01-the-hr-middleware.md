---
title: "Attribute-Driven Migration, Module 1: Send HR Records through a Middleware that Fails Closed"
subtitle: "Start from Microsoft's CSV2SCIM sample, then run the hardened client that refuses bad rows, orders leavers first, holds a mass disable and ties every batch to its inputs by hash"
description: "Module 1 of the Attribute-Driven Migration learning path. You learn what the HR-to-Entra middleware owns and what the provisioning service owns, why every record is sent whole, and how quarantine, ordering, the mass-disable hold and the provenance manifest work, then run the hardened client on the HR fixture with no tenant. Guide Gates 2 and 3; Book 19, Chapter 01."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 1
date-modified: 2026-11-02
review-status: approved
reviewed-sha256: f412a77d9b38c3ef89a71755d5b2e2720c2ce61b9a8bfcf2f4fcb2d154e29d04
last-reviewed: 2026-11-25
---
# Attribute-Driven Migration, Module 1: Send HR Records through a Middleware that Fails Closed {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 1 of 9 · 55 minutes · Guide [Gate 2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes) and [Gate 3](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) · Workbook [Chapter 01](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_ADM_Module_1.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_1_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_1_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-1/Training_ADM_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-1/Training_ADM_Module_1_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_01_HR_Entra_Middleware_Narrated).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Every later gate trusts the attributes HR sends. A bad HR record becomes bad access faster than any ticket queue, so the guide proves the values true at Gate 2 and maps them through sync at Gate 3. The middleware between the HR extract and Entra ID is where a record is first checked. Microsoft's CSV2SCIM sample sends every row it reads. In this module you see what a federal deployment has to add, and you run the client that adds it.

**The federal requirement.** The middleware is where an HR record becomes an account, so its outputs are account-management evidence. [Chapter 01's table](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#federal-requirements-and-evidence) maps every lab step to a requirement. These are the rows Lab 1 produces, and the two Lab 2 adds:

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| SI-10 Information Input Validation; AC-2 Account Management | KSI-IAM-AAM | `validation-report.json`, keys and hashes only |
| SI-10; IA-4 Identifier Management | KSI-IAM-AAM | `quarantine.json`, in the access-controlled audit store, because it holds personal data |
| CM-3 Configuration Change Control; AU-3 Content of Audit Records | KSI-CMT-LMC | `provenance.json`: every batch tied by hash to its extract and mapping |
| AC-2; CM-3, for a mass disable | KSI-IAM-AAM | The change record that carries the `--confirm-large-delta` confirmation |
| SA-11 Developer Testing and Evaluation; SR-3 Supply Chain Controls and Processes | KSI-CMT-VTD; KSI-SCR-MIT | The test results, and the pinned sample's `snapshot.json` |
| AC-6 Least Privilege; IA-5 Authenticator Management (Lab 2) | KSI-IAM-ELP; KSI-IAM-SNU | The app registration and its consent record |
| AU-6 Audit Record Review; AC-2 (Lab 2) | KSI-MLA-RVL | The findings queue, and the reconciliation report |

: Chapter 01's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system: it lines this evidence up with what its providers report against the indicators, and doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Explain what the middleware owns and what the provisioning service owns, and what a `202 Accepted` means.
- Describe what Microsoft's CSV2SCIM sample leaves to you.
- Run the hardened client and read its counts, its quarantine and its exit codes.
- Verify a run's provenance by hash, and show that a rerun gives identical bytes.
- Explain why the client sends every record whole and holds a mass disable.

### Prerequisites

- [Microsoft Automation, Module 1](../ms-automation-foundations.md), for the clouds, sign-in and least privilege.
- Python 3.10 or later with pytest, and PowerShell 7, which runs the lab. Pester 5 is optional: it runs the PowerShell client and Microsoft's sample, which the full chapter lab compares.

## Unit 2: Where the middleware sits

*10 minutes*

The provisioning service maps attributes, matches records to users, and writes. The middleware owns everything before the POST: what is sent, in what order, how fast, and what record is kept. The endpoint is asynchronous. A `202 Accepted` means the batch was staged, not that any user was written: Learn's [cURL quickstart for API-driven inbound provisioning](https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-curl-tutorial) shows the 202 on upload, then each record's processing in the provisioning logs. Read:

- [Chapter 01: where the middleware sits](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#where-the-middleware-sits).
- [Chapter 01: what CSV2SCIM leaves to you](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#what-it-leaves-to-you), the table of gaps the hardened client closes.
- The guide's [Gate 2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), for why the values are proved before anything reads them, and [Gate 3, step 5](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync), *send the whole record every time*.

![Where the middleware sits, from Book 03, Chapter 05: HR records cross a replaceable boundary transformation into the middleware, which validates, sequences, normalizes to SCIM, records provenance and reconciles results before Graph /bulkUpload hands them to the provisioning service.](../../images/diagrams/b03-hr-identity/svg/ch05-provisioning-services.svg){#fig-ch05-provisioning-services fig-alt="Left to right: Core HCM (extracts, ATOM feeds, REST, SCIM); boundary transformation (source-specific, replaceable); an amber middleware box with five duties: validate (fail closed), sequence, normalize to SCIM, write provenance, reconcile results; Graph /bulkUpload (Entra provisioning service), which writes to Active Directory (hybrid users, via the provisioning agent) and Entra ID (cloud-managed users). A dashed green line from the middleware goes to an evidence store (provenance and provisioning logs)."}

## Unit 3: Fail closed, send it whole, and keep the record

*10 minutes*

The client takes each row and either builds a SCIM operation or refuses it with reasons. Refused rows go to `quarantine.json`. Leavers go first, then managers before their reports. Two guards hold the whole run until someone confirms it: too many disables, or too many calls. Every batch is tied to its inputs by hash, and that works only because `bulkId` is the person key. Read:

- [Validate and fail closed](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#validate-and-fail-closed).
- [Send the complete record every time](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#send-the-complete-record-every-time).
- [Order, batch and hold](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#order-batch-and-hold).
- [The provenance manifest](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#the-provenance-manifest).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*23 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\attribute-driven-migration-code\hcm-entra

$Run = "C:\FMWLabs\results\attribute-driven-migration-01-the-hr-middleware\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run the hardened client
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out "$Run\out"
$LASTEXITCODE

# Step 2: Read the quarantine
python -c "import json,sys; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open(sys.argv[1] + '/quarantine.json', encoding='utf-8'))]" "$Run\out"

# Step 3: Check the provenance
Get-Content "$Run\out\provenance.json"
python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" tests/fixtures/hcm_extract_sample.csv

# Step 4: Run it again, and compare the bytes
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out "$Run\out-2"
if ((Get-FileHash "$Run\out\bulk-request-001.json").Hash -eq (Get-FileHash "$Run\out-2\bulk-request-001.json").Hash -and (Get-FileHash "$Run\out\provenance.json").Hash -eq (Get-FileHash "$Run\out-2\provenance.json").Hash) { 'identical' } else { 'different' }

# Step 5: Break a row on purpose
(Get-Content tests/fixtures/hcm_extract_sample.csv) -replace '^(100005,.*?)ORG-100', '${1}org-100' | Set-Content "$Run\extract-broken.csv"
python python/hcm_to_scim.py --extract "$Run\extract-broken.csv" --as-of 2026-10-25 --out "$Run\out-broken"
python -c "import json,sys; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open(sys.argv[1] + '/quarantine.json', encoding='utf-8')) if q['person_key'] == '100005']" "$Run\out-broken"

# Step 6: Hold a run
Set-Content "$Run\settings-hold.json" '{"max_disables_per_run": 1}'
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --settings "$Run\settings-hold.json" --out "$Run\out-hold"
$LASTEXITCODE

# Step 7: Run the tests
python -m pytest -q -p no:cacheprovider tests/python

# Step 8: List your runs
Get-ChildItem C:\FMWLabs\results\attribute-driven-migration-01-the-hr-middleware\lab1 -Name
```

:::

<!-- labs:end -->

You run the hardened client on the fictional HR extract, check its record, break a row and hold a run. Nothing here sends a request. These are steps 2 to 7 of [Chapter 01, Lab 1](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#lab-1-fixtures-no-tenant), without the comparisons with Microsoft's sample; that lab explains each result.

Every step runs in PowerShell 7, the Python commands included, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\attribute-driven-migration-code\hcm-entra
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\attribute-driven-migration-01-the-hr-middleware\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\attribute-driven-migration-01-the-hr-middleware\lab1\<run>
```

The run's date is only the folder's name. The data's date is `--as-of`, which stays the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/attribute-driven-migration-code/hcm-entra`, make the run folder with `Run=/c/FMWLabs/results/attribute-driven-migration-01-the-hr-middleware/lab1/$(date -u +%Y-%m-%dT%H%M%SZ); mkdir -p "$Run"`, and steps 1, 2 and 7 run the same there; the others use PowerShell commands (type `pwsh` to start PowerShell 7). In a clone of the repository, use the `examples` folder of the same name.

1. **Run the hardened client.** The second command prints the exit code.

   ```powershell
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out "$Run\out"
   $LASTEXITCODE
   ```

   Expected output:

   ```text
   {"counts": {"ready": 9, "quarantined": 9, "superseded": 1}, "batches": 1, "disables": 3, "held": false, "hold_reason": ""}
   2
   ```

   The command exits 2, because rows were quarantined.

2. **Read the quarantine.**

   ```powershell
   python -c "import json,sys; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open(sys.argv[1] + '/quarantine.json', encoding='utf-8'))]" "$Run\out"
   ```

   Expected output:

   ```text
   100006 | worker type P refused: pending worker: provision from the hire record, not the pending record
   100007 | unknown worker type X
   (missing) | required column PersonNumber is empty
   12345678901234567 | PersonNumber doesn't fit employeeId (letters, digits and hyphens, at most 16 characters)
   100009 | worker is recorded as their own manager
   100010 | inactive assignment with no termination date: the leave date can't be set
   100014 | DepartmentName is longer than 64 characters
   100015 | PositionCategory 'ZZZ' isn't in the approved code list
   100016 | DepartmentCode 'org 300' isn't a code (A-Z, 0-9, hyphen)
   ```

3. **Check the provenance.** Show the manifest, then hash the extract yourself.

   ```powershell
   Get-Content "$Run\out\provenance.json"
   python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" tests/fixtures/hcm_extract_sample.csv
   ```

   Expected output:

   ```text
   {
     "schema": "fmp-hcm-provenance/1",
     "as_of": "2026-10-25",
     "extract_sha256": "ca06b111d5fdd45b8355952d0a9beb403eb442af61a6f4a5dc0f0ef9bb643344",
     "mapping_sha256": "b5d313c3ba039bfe4e7778fdbe24019225d004ec62842f73b73094c42fcf6fbb",
     "counts": {
       "ready": 9,
       "quarantined": 9,
       "superseded": 1
     },
     "held": false,
     "batches": [
       {
         "batch": 1,
         "batch_sha256": "ab8f211ec83923783587b701459178f7d3782bedb9881395ecf7d643bc3cdf06",
         "person_keys": [
           "100003",
           "100008",
           "100013",
           "100000",
           "100001",
           "100004",
           "100005",
           "100002",
           "100011"
         ]
       }
     ],
     "quarantined": [
       "100006",
       "100007",
       "(missing)",
       "12345678901234567",
       "100009",
       "100010",
       "100014",
       "100015",
       "100016"
     ]
   }
   ca06b111d5fdd45b8355952d0a9beb403eb442af61a6f4a5dc0f0ef9bb643344
   ```

   The hash on the last line is the same as `extract_sha256` in the manifest. The batch's `person_keys` start with the leaver, `100003`.

4. **Run it again, and compare the bytes.** The second command prints `identical` when both files of the second run hash the same as the first run's.

   ```powershell
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out "$Run\out-2"
   if ((Get-FileHash "$Run\out\bulk-request-001.json").Hash -eq (Get-FileHash "$Run\out-2\bulk-request-001.json").Hash -and (Get-FileHash "$Run\out\provenance.json").Hash -eq (Get-FileHash "$Run\out-2\provenance.json").Hash) { 'identical' } else { 'different' }
   ```

   Expected output:

   ```text
   {"counts": {"ready": 9, "quarantined": 9, "superseded": 1}, "batches": 1, "disables": 3, "held": false, "hold_reason": ""}
   identical
   ```

   Microsoft's sample gives a new `bulkId` on every run, so its hashes never repeat.

5. **Break a row on purpose.** The first command writes a copy of the extract with worker 100005's `DepartmentCode` in lower case.

   ```powershell
   (Get-Content tests/fixtures/hcm_extract_sample.csv) -replace '^(100005,.*?)ORG-100', '${1}org-100' | Set-Content "$Run\extract-broken.csv"
   python python/hcm_to_scim.py --extract "$Run\extract-broken.csv" --as-of 2026-10-25 --out "$Run\out-broken"
   python -c "import json,sys; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open(sys.argv[1] + '/quarantine.json', encoding='utf-8')) if q['person_key'] == '100005']" "$Run\out-broken"
   ```

   Expected output:

   ```text
   {"counts": {"ready": 8, "quarantined": 10, "superseded": 1}, "batches": 1, "disables": 3, "held": false, "hold_reason": ""}
   100005 | DepartmentCode 'org-100' isn't a code (A-Z, 0-9, hyphen)
   ```

6. **Hold a run.** The first command writes a settings file that allows one disable per run; the last prints the exit code.

   ```powershell
   Set-Content "$Run\settings-hold.json" '{"max_disables_per_run": 1}'
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --settings "$Run\settings-hold.json" --out "$Run\out-hold"
   $LASTEXITCODE
   ```

   Expected output:

   ```text
   {"counts": {"ready": 9, "quarantined": 9, "superseded": 1}, "batches": 1, "disables": 3, "held": true, "hold_reason": "3 disables exceed max_disables_per_run (1): held for confirmation (Book 03, Appendix B pause switch)"}
   3
   ```

7. **Run the tests.**

   ```powershell
   python -m pytest -q -p no:cacheprovider tests/python
   ```

   Expected: the last line is `71 passed` and the time it took.

8. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\attribute-driven-migration-01-the-hr-middleware\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** for any row in an extract, you can say whether the client sends it, quarantines it or supersedes it, and where the record of that decision is kept.

## Unit 5: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

Create an API-driven inbound provisioning app in a test tenant, extend its schema with CSV2SCIM, grant the sender one permission, send five fictional records with the hardened client, and reconcile them against the provisioning logs. Follow [Chapter 01, Lab 2](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#lab-2-test-tenant).

<!-- labs:begin module-lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-2-commands collapse="false" title="The Lab 2 commands, against your test environment"}
Every command in [Chapter 01, Lab 2](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#lab-2-test-tenant), in order, against your test environment, never production.

Replace each `<placeholder>` with your test environment's value.

The chapter's steps say what each command does and what to look for.

In PowerShell 7:

```powershell
# Step 1: Create the provisioning app
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'Application.ReadWrite.All', 'Synchronization.ReadWrite.All' -NoWelcome
$template = (Invoke-MgGraphRequest -Method GET -Uri "/v1.0/applicationTemplates?`$filter=displayName eq 'API-driven provisioning to Microsoft Entra ID'").value[0]
$created = Invoke-MgGraphRequest -Method POST -Uri "/v1.0/applicationTemplates/$($template.id)/instantiate" -Body @{ displayName = 'Lab - HR inbound provisioning' }
$spId = $created.servicePrincipal.id
Start-Sleep -Seconds 30
$jobTemplate = (Invoke-MgGraphRequest -Method GET -Uri "/v1.0/servicePrincipals/$spId/synchronization/templates").value[0].id
$job = Invoke-MgGraphRequest -Method POST -Uri "/v1.0/servicePrincipals/$spId/synchronization/jobs" -Body @{ templateId = $jobTemplate }
"provisioning-app-object-id: $spId"
"provisioning-api-endpoint:  https://graph.microsoft.com/v1.0/servicePrincipals/$spId/synchronization/jobs/$($job.id)/bulkUpload"

# Step 2: Extend its schema with Microsoft's sample
./third_party/csv2scim/src/CSV2SCIM.ps1 -Path ./hcm-entra/tests/fixtures/hcm_extract_sample.csv `
    -ScimSchemaNamespace 'urn:ietf:params:scim:schemas:extension:contoso:1.0:User' `
    -TenantId <tenant-id> -ServicePrincipalId <provisioning-app-object-id> -UpdateSchema

# Step 3: Grant the least privilege to the sender
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'Application.ReadWrite.All', 'AppRoleAssignment.ReadWrite.All', 'Directory.Read.All' -NoWelcome
$cert = New-SelfSignedCertificate -Subject 'CN=lab-hcm-entra-sender' -CertStoreLocation Cert:\CurrentUser\My -KeyExportPolicy NonExportable -KeySpec Signature -NotAfter (Get-Date).AddDays(30)
$app = New-MgApplication -DisplayName 'lab-hcm-entra-sender' -SignInAudience AzureADMyOrg -KeyCredentials @(@{ Type = 'AsymmetricX509Cert'; Usage = 'Verify'; Key = $cert.RawData })
$sp = New-MgServicePrincipal -AppId $app.AppId
New-MgServicePrincipalOwnerByRef -ServicePrincipalId <provisioning-app-object-id> -OdataId "https://graph.microsoft.com/v1.0/directoryObjects/$($sp.Id)"
$graph = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
$role = $graph.AppRoles | Where-Object { $_.Value -eq 'SynchronizationData-User.Upload.OwnedBy' -and $_.AllowedMemberTypes -contains 'Application' }
New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -PrincipalId $sp.Id -ResourceId $graph.Id -AppRoleId $role.Id
"sender client ID: $($app.AppId)  certificate thumbprint: $($cert.Thumbprint)"

# Step 4: Start the job and set its safety nets
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'Synchronization.ReadWrite.All' -NoWelcome
$spId = '<provisioning-app-object-id>'
$jobId = (Invoke-MgGraphRequest -Method GET -Uri "/v1.0/servicePrincipals/$spId/synchronization/jobs").value[0].id
$notify = @{ Enabled = $true; Recipients = '<notification-email>'; DeleteThresholdEnabled = $true; DeleteThresholdValue = 10 } | ConvertTo-Json -Compress
$secrets = @((Invoke-MgGraphRequest -Method GET -Uri "/beta/servicePrincipals/$spId/synchronization/secrets").value | Where-Object { $_.key -ne 'SyncNotificationSettings' }) + @(@{ key = 'SyncNotificationSettings'; value = $notify })
Invoke-MgGraphRequest -Method PUT -Uri "/beta/servicePrincipals/$spId/synchronization/secrets" -Body (@{ value = $secrets } | ConvertTo-Json -Depth 5) -ContentType 'application/json'
Start-MgServicePrincipalSynchronizationJob -ServicePrincipalId $spId -SynchronizationJobId $jobId
(Invoke-MgGraphRequest -Method GET -Uri "/v1.0/servicePrincipals/$spId/synchronization/jobs/$jobId").schedule.state
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 5: Send five records with the hardened client
cd hcm-entra
cp config/settings.example.json config/settings.json
python -c "import json; p = 'config/settings.json'; s = json.load(open(p)); s['endpoint'] = '<provisioning-api-endpoint>'; json.dump(s, open(p, 'w'), indent=2)"
export HCM_ENTRA_BEARER_TOKEN='<graph-access-token>'
head -n 6 tests/fixtures/hcm_extract_sample.csv > five.csv
python python/hcm_to_scim.py --extract five.csv --as-of 2026-10-25 --settings config/settings.json --out out-apply --apply
cat out-apply/apply-results.json
```

In PowerShell 7:

```powershell
# Step 6: Reconcile
../third_party/csv2scim/src/CSV2SCIM.ps1 -TenantId <tenant-id> -ServicePrincipalId <provisioning-app-object-id> -GetPreviousCycleLogs
(Get-Content out-apply/provenance.json -Raw | ConvertFrom-Json).batches.person_keys
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 7: Back it out
python -c "import csv; rows = list(csv.DictReader(open('five.csv', encoding='utf-8', newline=''))); [r.update(AssignmentStatusType='INACTIVE', TerminationDate='2026-10-25') for r in rows]; w = csv.DictWriter(open('five-leavers.csv', 'w', encoding='utf-8', newline=''), fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)"
python python/hcm_to_scim.py --extract five-leavers.csv --as-of 2026-10-25 --settings config/settings.json --out out-backout --apply
unset HCM_ENTRA_BEARER_TOKEN
```
:::

<!-- labs:end -->

- **You need:** a test tenant, never production, with Microsoft Entra ID P1, P2 or ID Governance, and a sender identity with a certificate or managed identity, never a secret.
- **Back it out:** step 7 sends the five records again as inactive, with a termination date, and unsets the token variable; then delete the test users and the app, as the chapter's clean-up does.

## Unit 6: Knowledge check

*5 minutes*

1. The `/bulkUpload` endpoint answers `202 Accepted`. What does that tell you?
   a. Every user in the batch was written to the directory.
   b. The batch was staged for the provisioning job; each record's result appears in the provisioning logs.
   c. The batch was validated against the code lists.

2. Why does the client use the person key as each operation's `bulkId`?
   a. The provisioning service requires it.
   b. So the same input produces the same batch hash, and an auditor can trace a log line back to the extract.
   c. So the batch is smaller.

3. A run would disable more accounts than `max_disables_per_run` allows. What happens?
   a. The client sends the first batch and stops.
   b. The client drops the extra disables.
   c. The whole run is held, with exit code 3, until someone confirms it with `--confirm-large-delta`.

4. Why does the client never send a partial record?
   a. Partial records are slower.
   b. When the job's clearing feature is on, an omitted attribute can clear the value in the directory.
   c. SCIM doesn't allow partial records.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Chapter 01: where the middleware sits](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#where-the-middleware-sits).
2. **b.** With a random `bulkId`, as in the sample, the same input never gives the same hash. See [the provenance manifest](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#the-provenance-manifest) and step 4 of the lab.
3. **c.** See [order, batch and hold](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#order-batch-and-hold) and step 6 of the lab.
4. **b.** See [send the complete record every time](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#send-the-complete-record-every-time) and the guide's [Gate 3, step 5](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync).
:::

## Unit 7: Summary

*2 minutes*

You learned where the middleware's job ends and the provisioning service's begins, and you ran the client that refuses bad rows, orders leavers first, holds a mass disable and keeps a record an auditor can follow by hash.

**Evidence an ISSO keeps from this module:** `validation-report.json`, `provenance.json` and, in Lab 2, `apply-results.json` in the evidence store; `quarantine.json` in the access-controlled audit store; the change record for any confirmed hold; the sender's app registration and consent record; and the reconciliation against the provisioning logs. Gate 2's own evidence, the correlation report and the threshold decision, is in the guide's [Gate 2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes). Before shipping, work through the [Chapter 01 checklist](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#checklist).

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, Write a validation kit check →](02-a-validation-kit-check.md)
:::
