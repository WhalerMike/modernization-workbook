# Group Policy as code

Moving Group Policy settings to Intune settings catalog policies from reviewed JSON in Git: a move plan read from Intune's Group Policy analytics, a policy library with a linter, a diff against the tenant, and a sync that creates only what is missing. It is the code for the [developer workbook *Building the Attribute-Driven Migration*, Chapter 06](../../docs/books/b19-developer-workbook/06-group-policy-as-code.md). The gate check on whole GPOs stays in the validation kit (VK-INT-07). The operator procedure is [Book 05, Chapter 08](../../docs/books/b05-devices/08-gpo-to-intune-policy-migration.md).

Illustrative: tested against fixtures and a fake Graph, not proven against a production tenant. The Group Policy analytics and settings catalog APIs it calls are Microsoft Graph **beta**.

## Start with Microsoft's sample

Microsoft publishes settings catalog export and import scripts in [microsoft/mggraph-intune-samples](https://github.com/microsoft/mggraph-intune-samples/tree/main/SettingsCatalog), the repository Learn's Intune migration guide points to. A pinned, unmodified copy is in [`../third_party/mggraph-intune-samples`](../third_party/mggraph-intune-samples/SNAPSHOT.md). `tests/MicrosoftSamples.Tests.ps1` runs both scripts, unmodified, against a fake Graph and pins what they do:

| Microsoft's samples, on their own | What this example adds |
|---|---|
| Import creates the policy with one POST to `/beta/deviceManagement/configurationPolicies`; export follows `@odata.nextLink` and filters on `technologies has 'mdm'`; the two round-trip | Kept as the model: the same call, filter and paging |
| Import drops `assignments`, so the policy is created unassigned | Kept; GPC-04 refuses assignments in a library file |
| Import always sends to `graph.microsoft.com` | `Get-GpcCloud` per cloud, and it refuses a name it doesn't know |
| Import doesn't sign in or choose a permission | `Get-GpcRequiredScope`: `Read.All` for the plan and the dry run, `ReadWrite.All` only for `-Apply` |
| Import asks only for the file and creates at once | A dry run by default; `-Apply` to write |
| Run twice, import creates a second policy with the same name | The sync reads the tenant first, creates only what is missing, and refuses on a duplicate name |
| Import silently strips service-set properties and adds `#` to `@odata.type` | GPC-03 and GPC-07 refuse them, so the file reviewed is the body sent |
| Import records nothing beyond the screen | `out/sync-record.json`: cloud, scopes, file hashes, results and the IDs created |
| Export names each file with the time of the run | Library files have fixed names, and the diff with the tenant is computed |
| Export drops the scope tags | The library carries `roleScopeTagIds`, and the diff compares them |
| Neither reads Group Policy analytics or checks who owns a setting | The move plan, and GPC-02, GPC-06, GPC-08 and GPC-09 |

## Layout

```
policies/*.json                       the library: one settings catalog policy per file, with its owner and decisions
powershell/GroupPolicyAsCode.psm1     move plan, lint, tenant read, diff, sync, and the fake Graph for labs and tests
powershell/Invoke-GpcSync.ps1         the pull request and release step: lint, diff, and create with -Apply
tests/GroupPolicyAsCode.Tests.ps1     Pester 5: the module and the script against the fixture tenant
tests/MicrosoftSamples.Tests.ps1      Pester 5: Microsoft's two samples against the fake Graph
tests/MicrosoftSampleHarness.ps1      runs a pinned sample with fakes for Read-Host, Write-Host and Graph
tests/fixtures/tenant.json            a fictional tenant: Group Policy analytics reports and mappings, two policies
```

## A library file

```json
{
  "owner": "Workstation baseline owner (Intune track)",
  "configOwner": "Intune",
  "sourceGpos": ["FMP-Workstation-Baseline"],
  "decisions": { "<settingDefinitionId>": "DR-0101" },
  "policy": { "name": "...", "description": "...", "platforms": "windows10", "technologies": "mdm", "roleScopeTagIds": ["0"], "settings": [ ... ] }
}
```

`policy` is the body sent to Graph, exactly as reviewed. The rest is the record: who approves changes, which tool owns the settings, which GPOs they came from, and the decision record for each setting.

## Run

PowerShell 7.1 or later and Pester 5. No module, tenant or network:

```powershell
pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan
Invoke-Pester ./tests
```

In a test tenant, sign-in is by `Connect-MgGraph` (Microsoft Graph PowerShell) with the least permission the run needs:

```powershell
pwsh ./powershell/Invoke-GpcSync.ps1 -Cloud gcc -TenantId <test-tenant-id> -WithPlan   # DeviceManagementConfiguration.Read.All
pwsh ./powershell/Invoke-GpcSync.ps1 -Cloud gcc -TenantId <test-tenant-id> -Apply      # DeviceManagementConfiguration.ReadWrite.All
```

`-Cloud gcc` and `global` use `https://graph.microsoft.com`, as GCC does; `gcchigh` uses `https://graph.microsoft.us` and `dod` uses `https://dod-graph.microsoft.us`. Exit codes: 0 clean, 2 something needs a person (a finding, `Drift`, `Duplicate`, or a created policy that reads back different), 1 error. The sync sends GET and, with `-Apply`, POST to `configurationPolicies`. It never sends PATCH or DELETE: a policy that differs from Git is reported, not overwritten.

## Linter rules

| Rule | Severity | Checks |
|---|---|---|
| GPC-01 | Finding | The file has `owner`, `configOwner`, `sourceGpos`, `decisions` and a policy with `name`, `platforms`, `technologies` and settings |
| GPC-02 | Finding | `configOwner` is `Intune`: the library holds only settings Intune owns |
| GPC-03 | Finding | No service-set properties in the body (`id`, `settingCount`, `createdDateTime` and the rest) |
| GPC-04 | Finding | No `assignments` in the body: policies are created unassigned |
| GPC-05 | Finding | Each policy name is used by one file |
| GPC-06 | Finding | Each setting definition ID is set by one policy |
| GPC-07 | Finding | Every `@odata.type` starts with `#` |
| GPC-08 | Warn / Info | With the move plan: a setting that isn't a Candidate is a warning; a setting with conflicting GPO values is shown with its decision |
| GPC-09 | Finding | Every setting has a decision record |
| GPC-10 | Warn | A string value whose setting name suggests a secret |
