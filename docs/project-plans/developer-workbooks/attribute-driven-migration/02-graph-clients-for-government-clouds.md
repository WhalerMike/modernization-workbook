---
title: "Chapter 02 — Graph Clients for the Government Clouds"
description: "One Microsoft Graph client pattern for worldwide, GCC, GCC High and DoD, starting from Microsoft's own Graph SDK snippets for national clouds (pinned in the repository) and adding what they leave to you: a cloud table with the token authority, Graph host and Resource Manager host for each, least-privileged permissions declared per call and checked against the token, paging with @odata.nextLink, Retry-After, and beta calls the run doesn't depend on, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-attribute-driven-migration
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 02 — Graph Clients for the Government Clouds

*A Graph client has to know which cloud it is in, send its token nowhere else, ask for no more than each call needs, and keep working when Graph says "slow down" or a beta API changes under it.*

::: {.callout-note}
## In this chapter
The client pattern every Graph caller in this workbook should follow, for the worldwide service, GCC, GCC High and DoD. You start with Microsoft's own Graph SDK snippets for national clouds, which Learn renders and the repository keeps as a pinned copy, and run them against stand-ins to see what they would sign in to. Then you build on `examples/ms-automation` for what they leave to you: one table of endpoints per cloud, including Azure Resource Manager, a list of every call with its least-privileged permission, a token check before a live run, paging, `Retry-After`, and beta calls that can fail without failing the run. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can write a Graph client, in Python or PowerShell, that reaches the right cloud for the tenant, requests the right token, makes only the calls it declares, pages and retries the way Microsoft documents, and treats beta as optional. You can say, for each rule in the code, whether it is Microsoft's contract, Microsoft's sample, or the program's own design.

**Audience.** Developers who build any code in this workbook that calls Microsoft Graph or Azure Resource Manager, and the reviewers who approve it. You should read Python or PowerShell 7 and know what an access token is. You don't need a tenant until Lab 2.

## Which cloud is which

Get this right first, because every other rule depends on it.

**A GCC (Moderate) tenant uses the worldwide endpoints: `login.microsoftonline.com` for tokens and `graph.microsoft.com` for Graph.** Learn says so plainly: in a Microsoft 365 GCC environment, keep using the worldwide endpoints.[^c02-deployments] Office 365 GCC is paired with Microsoft Entra ID in Azure, the commercial cloud.[^c02-pairing] GCC was built when Microsoft had one cloud directory, and it still uses that directory.[^c02-identity-plan]

**GCC High and DoD are the clouds with separate hosts.** Both get tokens from `login.microsoftonline.us`. GCC High calls Graph at `graph.microsoft.us`, and DoD at `dod-graph.microsoft.us`.[^c02-deployments] They are paired with Microsoft Entra ID in Azure Government.[^c02-pairing] A token from one cloud doesn't work in another.[^c02-deployments]

| Program name | Microsoft 365 | Token authority | Graph host | Graph PowerShell `-Environment` | Azure Resource Manager | Azure PowerShell environment |
|---|---|---|---|---|---|---|
| `global` | Worldwide | `login.microsoftonline.com` | `graph.microsoft.com` | `Global` | `management.azure.com` | `AzureCloud` |
| `gcc` | GCC (Moderate) | `login.microsoftonline.com` | `graph.microsoft.com` | `Global` | `management.azure.com` | `AzureCloud` |
| `gcchigh` | GCC High | `login.microsoftonline.us` | `graph.microsoft.us` | `USGov` | `management.usgovcloudapi.net` | `AzureUSGovernment` |
| `dod` | DoD | `login.microsoftonline.us` | `dod-graph.microsoft.us` | `USGovDoD` | `management.usgovcloudapi.net` | `AzureUSGovernment` |

Sources: Graph and token hosts,[^c02-deployments] Graph PowerShell environments,[^c02-mgenv] Resource Manager hosts,[^c02-compare] [^c02-controlplane] Azure PowerShell environments.[^c02-azps]

### What GCC with commercial Azure means for the code

The target estate for this migration is Microsoft 365 GCC with commercial Azure. For the code, that means:

- **Nothing is a `.us` host.** Tokens come from `login.microsoftonline.com`, Graph is `graph.microsoft.com`, and Azure Resource Manager is the commercial `management.azure.com`.[^c02-compare] [^c02-controlplane] Azure PowerShell connects with its default environment, `AzureCloud`.[^c02-azps]
- **One token per resource.** A client-credentials token request names one resource's `.default` scope; Learn says scopes for several resources in one request give an error.[^c02-clientcreds] A run that reads Graph and Resource Manager gets two tokens, `https://graph.microsoft.com/.default` and `https://management.azure.com/.default`, from the same tenant.
- **The cloud name is still explicit.** GCC and worldwide resolve to the same endpoints today, but the code takes `gcc` as its own name. The run's evidence then says which cloud it was meant for, and a GCC High build changes one argument, not the code. *Design guidance.*
- **Beware a second tenant.** Learn notes that many GCC customers also hold an Azure Government subscription, with its own Microsoft Entra tenant and identities.[^c02-identity-plan] If a workload ever lands there, its Resource Manager host is `management.usgovcloudapi.net` and its tokens come from `login.microsoftonline.us`, even though Microsoft 365 stays in GCC. The cloud table can't guess that; the run has to be told. *Design guidance:* give each tenant its own configuration entry, never a fallback.

### The clients this chapter is the reference for

Chapters 01, 03 and 04 were written first, because their code already existed. Each has its own Graph client, and each already follows part of this pattern:

| Example | Chapter | How it picks the cloud | What it already guards |
|---|---|---|---|
| `examples/hcm-entra` | [01](01-the-hr-to-entra-middleware.md) | The provisioning endpoint in its settings file | The endpoint must be one of the three Graph hosts, v1.0 or beta |
| `examples/validation-kit` | [03](03-writing-a-validation-kit-check.md) | `global`, `gcc`, `gcchigh`, `dod`, each with its Graph environment, Azure environment and Graph host | GET only; one data path; beta paths limited to a declared list; a `nextLink` to another host is refused |
| `examples/dynamic-rules` | [04](04-dynamic-rules-as-code.md) | Learn's environment names, `Global`, `USGov`, `USGovDoD` | `Get-DrGraphEndpoint` refuses a name it doesn't know |
| `examples/ms-automation` | this chapter | `global`, `gcc`, `gcchigh`, `dod` | Everything in this chapter's checklist |

Two naming schemes are in use: the program's (`gcc`, `gcchigh`, `dod`) and Learn's PowerShell environment names (`Global`, `USGov`, `USGovDoD`). Both are fine; the table above maps one to the other. What isn't fine is a default. A cloud name a client doesn't recognize must stop the run. Learn's own dynamic membership samples fall back to the worldwide endpoint on an unknown answer, which Chapter 04 shows and guards against. When you build a new client, use the checklist at the end of this chapter.

## Start with Microsoft's sample

### What Microsoft gives you

Learn's page on national clouds for the Graph SDKs gives, for each SDK language, the three things a client has to change: the token authority, the Graph service root, and any scope that names the Graph host. Its example connects to US Government L4, which is GCC High.[^c02-sdk-clouds] It also says the shortened scope names (`User.Read`) and the cloud's own form (`https://graph.microsoft.us/User.Read`) are equivalent for consent, and that app-only clients use the cloud's `.default` scope, such as `https://graph.microsoft.us/.default`.[^c02-sdk-clouds]

For PowerShell, the same page gives one line: `Connect-MgGraph -Environment USGov` with the tenant, client and the cloud's `.default` scope.[^c02-sdk-clouds] `Get-MgEnvironment` lists the environments, and `Connect-MgGraph` targets the worldwide cloud unless told otherwise.[^c02-mgenv]

Other Learn pages cover the rest of the pattern. The SDKs have a page iterator and follow `@odata.nextLink`; headers on the first request aren't carried to later pages by default.[^c02-paging] The SDKs retry throttled requests using `Retry-After`, or exponential backoff when it's missing, but they don't retry requests inside a JSON batch.[^c02-throttling]

### The pinned copy

The code behind Learn's Python examples lives in Microsoft's `msgraph-snippets-python` repository, and Learn's pages pull it in when they publish.[^c02-snippets-code] The repository pins an unmodified copy of the two files this chapter uses, `national_clouds.py` (the US Government L4 client) and `create_clients.py` (the credential snippets, including the certificate one an app-only job uses), in [`examples/third_party/msgraph-snippets-python`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/msgraph-snippets-python), from commit `3ef4381` (October 20, 2026), retrieved October 30, 2026. `snapshot.json` records each file's SHA-256, and a unit test checks them. The weekly source watch reports new commits to the snippets folder. Updating the copy is a reviewed pull request, as in [Chapter 01](01-the-hr-to-entra-middleware.md#the-pinned-copy).

`tests/python/test_learn_sample.py` loads both files unmodified and runs them against stand-ins for the SDK packages. The stand-ins record each constructor's arguments, so the test sees what the snippet would sign in to and call. Nothing is installed and nothing signs in.

### What it leaves to you

Running the snippets against the stand-ins shows what they do and what they leave to you. Each row is pinned by a test: in `test_learn_sample.py` for the sample's behavior, and in `test_graph_clients.py` and `GraphClients.Tests.ps1` for ours.

| Microsoft's sample, as published | Why it matters | What `examples/ms-automation` adds |
|---|---|---|
| The US Government client sets the scope to `https://graph.microsoft.us/.default` and the Graph host to `NationalClouds.US_GOV` | — | Kept as the model: the scope is built from the cloud's Graph host |
| The Python credential in that snippet names no authority. The C#, Go, Java and TypeScript tabs of the same Learn page set the US Government authority[^c02-sdk-clouds] | An `azure-identity` credential uses the public cloud authority, `login.microsoftonline.com`, unless told otherwise,[^c02-authority] so a GCC High app would sign in to the wrong cloud | `azure_identity_provider` sets `AZURE_GOVERNMENT` for `gcchigh` and `dod`, tested for every cloud. A managed identity ignores the authority, because it lives in one cloud[^c02-authority-mi] |
| One national cloud function, for GCC High; nothing for DoD | DoD has its own Graph host | One table for all four clouds; an unknown name is an error |
| The certificate snippet hard-codes `https://graph.microsoft.com/.default` and names no authority | Right for worldwide and GCC, wrong for GCC High and DoD | `scope_for(cloud)` and the authority both follow the cloud |
| The client-credentials snippet also shows a client secret | A secret is a password in a file | The examples accept a certificate or a managed identity, never a secret |
| No Resource Manager endpoints | GCC with commercial Azure needs `management.azure.com`; GCC High and DoD need `management.usgovcloudapi.net` | `endpoints(cloud)` and `scope_for(cloud, "arm")` |
| Nothing ties a call to a permission | Learn asks for the least-privileged permission for each call;[^c02-leastpriv] an unused permission is still exposure[^c02-overpriv] | `graph-calls.json` lists every call with its permission; a task can make only its own calls; the token's `roles` are checked before a live run |
| No paging in the Python snippets; Learn's paging page shows a page iterator for the other SDK languages[^c02-paging] | A `nextLink` is a full URL from a response, and later pages lose the first request's headers | The client refuses a `nextLink` on any host but the cloud's Graph host, and sends the same headers on every page |
| The SDK retries on `Retry-After` but not inside a batch[^c02-throttling] | A batch hides throttled items | `batch()` retries throttled items after the longest `Retry-After`, and checks each request inside against the call list |
| Nothing about beta | Beta APIs can change without notice and aren't supported in production[^c02-versioning] | A beta call must be declared; `try_beta` turns a missing beta shape, or a cloud that doesn't offer the feature, into "not evaluated" |

**The verdict.** Use Learn's page as the model for the three things that change per cloud, and keep the pinned snippets to compare against. Don't copy the Python national cloud snippet as written for GCC High or DoD: add the authority. For app-only background jobs, use the hardened client, because the questions a reviewer asks ("which calls, with which permissions, in which cloud?") need answers the snippets don't carry.

## The code: what `examples/ms-automation` adds

[`examples/ms-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation) already had a small Graph client, `python/graphkit.py` (standard library only), and a PowerShell module, `powershell/FmwGraph.psm1`, that runs ten read-only Entra ID and Intune checks. This chapter adds a call list both read, the Resource Manager endpoints, a token check, beta handling and the tests. The two clients stay in step: both read `graph-calls.json`, and both are tested against `tests/fixtures/clouds.json`.

### One table of endpoints

`endpoints(cloud)` returns the token authority, Graph host, Resource Manager host and the PowerShell environment names for `global`, `gcc`, `gcchigh` or `dod`, and raises on anything else. `scope_for(cloud, "graph")` and `scope_for(cloud, "arm")` build the `.default` scopes. In PowerShell, `Get-FmwCloud` returns the same values, and `Connect-FmwGraph` passes the environment to `Connect-MgGraph`. The client refuses to send its token to any host but the cloud's Graph host. In GCC High, a URL on `graph.microsoft.com` is refused, and so is a DoD client's call to `graph.microsoft.us`.

### Least privilege, per call

`graph-calls.json` lists every Graph call the tasks make: method, version, path, the least-privileged application permission from the API page, the release stage, the tasks that use it, and the clouds where Learn says the feature isn't offered. For example:

```json
{
  "id": "role-eligibility-schedules",
  "method": "GET",
  "version": "v1.0",
  "path": "/roleManagement/directory/roleEligibilitySchedules",
  "permissions": ["RoleEligibilitySchedule.Read.Directory"],
  "stage": "v1.0",
  "tasks": ["pim-report"]
}
```

Three rules follow from the file.

- **A task makes only its calls.** The command lines build the client with `load_calls(task)`. Any other call raises `PermissionError` before it is sent. In PowerShell, `Invoke-FmwEntraTask` and `Invoke-FmwIntuneTask` pass the task to `Get-FmwGraphCollection`, which checks every page with `Assert-FmwGraphCall`.
- **A task's permissions are the union of its calls.** A test checks that this union equals each task's published permission list, in both languages. Adding a call without its permission, or a permission without a call, fails the build.
- **The token is checked before a live run.** An app-only token carries its application permissions in the `roles` claim.[^c02-claims] `preflight` reads that claim from the run's own token. A missing permission stops the run before any call; a permission the task doesn't use is printed as a warning, because an unused permission is exposure even if the code never calls it.[^c02-overpriv] The check reads the claim; it doesn't validate the token, and nothing uses it to authorize anything. In PowerShell, `Test-FmwTokenRole` does the same for a token you pass it. The module doesn't call it on its own, because Graph PowerShell signs in for you and never hands the module the token.

### Paging

`get_all` follows `@odata.nextLink` until it stops, and sends the same headers on every page. Learn says headers on the first request aren't carried to later pages by default;[^c02-paging] the advanced-query header `ConsistencyLevel: eventual` is the one that matters here. A page that is throttled is retried with the same link. Learn warns not to use a page token from a retried request for the next page, which can cause `DirectoryPageTokenNotFoundException`;[^c02-paging] the client only ever follows a link from a successful response.

### Throttling

On `429`, `503` or `504`, the client waits and retries, up to `max_retries`. The wait is the `Retry-After` header, as Learn asks,[^c02-throttling] read as seconds or as an HTTP date.[^c02-retryafter] When the header is missing it backs off exponentially, as Learn recommends:[^c02-throttling] 1, 2, 4 seconds and on, capped at 60 (*design guidance* for the cap). That case is real for this example: Learn's limits page says the conditional access resources don't return `Retry-After` on `429`.[^c02-limits] Every request also sends `x-ms-throttle-priority: Low`, which tells Graph to throttle these background reads before interactive users; it doesn't change the limits.[^c02-limits] JSON batches hold at most 20 requests,[^c02-batching] and `batch()` retries throttled items inside a batch itself, after the longest `Retry-After`, because the SDKs don't.[^c02-throttling]

PowerShell relies on the Graph PowerShell SDK's own retry handling for single requests, as the README says.

### Beta without depending on it

Beta APIs can change or disappear, and Learn says not to use them in production applications.[^c02-versioning] Sometimes the only place a property lives is beta: the Autopilot check needs `deploymentProfileAssignmentStatus`, which v1.0 doesn't have. The rules:

- **A beta call must be declared.** Even a client built without a call list refuses any `/beta` path no entry in `graph-calls.json` names. v1.0 calls are allowed without a list; beta calls never are.
- **Beta is read through `try_beta`** (`Get-FmwBetaCollection` in PowerShell). A refused call, or a `400`, `404` or `501` from Graph, returns `available: false` with the reason, and the task reports `"evaluated": false` with stage `beta`. A `403` or throttling that outlasts the retries still raises, because those aren't beta problems.
- **The stage is in the output.** The Autopilot task's result carries `"stage": "beta"` whether it ran or not.

The file also records where a feature isn't offered. The beta Autopilot API page's national cloud table shows the endpoint in US Government L4 and L5,[^c02-autopilot-api] but Intune's government service description lists Windows Autopilot as not available in GCC High and DoD.[^c02-intune-gov] An API that answers isn't a feature you can use. The file follows the stricter statement: in `gcchigh` and `dod`, the task makes no call and reports "not evaluated".

### The tests

The Python suite has 70 tests (pytest) and the Pester suite 40. Chapter 02 added 35 and 23 of them:

- `tests/python/test_learn_sample.py`, 9 tests: Microsoft's pinned snippets against stand-ins, and our provider's authority for each cloud.
- `tests/python/test_graph_clients.py`, 24 tests: endpoints against the shared fixture, refused cloud names, the call list against each task's permissions, refused calls, the token audit, headers on every page, retrying a page with the last good link, `Retry-After` as an HTTP date, backoff with no header, and beta.
- `tests/python/test_intune_tasks.py`, 2 new tests: Autopilot in GCC High makes no call, and a beta `404` is "not evaluated".
- `tests/powershell/GraphClients.Tests.ps1`, 23 tests: the same rules in PowerShell, with `Connect-MgGraph` and `Invoke-MgGraphRequest` mocked.

None needs a module, a tenant or a network.

::: {.callout-important}
## Illustrative code
The commands below run Microsoft's pinned snippets against stand-ins, and the example as published in the repository against fixtures and fakes. They show what the code does, not that a tenant returns the same shapes. Review the code, and run Lab 2 in a test tenant, before it reads a real one.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later with pytest, and PowerShell 7.5 or later with Pester 5. Work in `examples/ms-automation`.

1. **Run Microsoft's sample against the stand-ins:**

   ```text
   python -m pytest -q -p no:cacheprovider tests/python/test_learn_sample.py
   ```

   `9 passed`. Open the test and read `test_sample_us_gov_credential_names_no_authority`: the snippet's credential gets `tenant_id`, `client_id` and `redirect_uri`, and nothing else.

2. **Print the endpoints for the target estate:**

   ```text
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints, scope_for; print(endpoints('gcc')); print(scope_for('gcc', 'arm')); print(scope_for('dod'))"
   ```

   ```text
   {'login': 'https://login.microsoftonline.com', 'graph': 'https://graph.microsoft.com', 'arm': 'https://management.azure.com', 'ps_env': 'Global', 'azure_env': 'AzureCloud'}
   https://management.azure.com/.default
   https://dod-graph.microsoft.us/.default
   ```

   No `.us` host for GCC. Try `endpoints('GCCHigh')`: `ValueError: unknown cloud 'GCCHigh'`.

3. **List a task's permissions from its calls:**

   ```text
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import load_calls, permissions_for; print(permissions_for(load_calls('pim-report')))"
   ```

   `['RoleAssignmentSchedule.Read.Directory', 'RoleEligibilitySchedule.Read.Directory', 'RoleManagement.Read.Directory']`, the three in the README's table.

4. **Make a call the task doesn't declare:**

   ```text
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient, load_calls; GraphClient('gcc', lambda s: 't', calls=load_calls('ca-export')).request('GET', '/users')"
   ```

   It ends `PermissionError: undeclared call: GET /v1.0/users; add it to graph-calls.json with its permission`. Nothing was sent.

5. **Read beta where the feature isn't offered:**

   ```text
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient, try_beta; print(try_beta(GraphClient('gcchigh', lambda s: 't'), '/deviceManagement/windowsAutopilotDeviceIdentities'))"
   ```

   `{'stage': 'beta', 'available': False, 'items': [], 'reason': "autopilot-device-identities isn't offered in gcchigh (graph-calls.json not_in_clouds)"}`.

6. **The same rules in PowerShell:**

   ```powershell
   Import-Module ./powershell/FmwGraph.psm1
   (Get-FmwCloud gcc).Arm
   Get-FmwCallPermission -Task pim-report
   Assert-FmwGraphCall -Method GET -Uri '/beta/users' -Cloud gcc
   Assert-FmwGraphCall -Method GET -Uri 'https://graph.microsoft.com/v1.0/users' -Cloud gcchigh
   ```

   `https://management.azure.com`, the same three permissions, then two errors: `Undeclared beta call: GET /beta/users; ...` and `Refusing to send the token to https://graph.microsoft.com/v1.0/users: not https://graph.microsoft.us`.

7. **Run the tests:**

   ```text
   python -m pytest -q -p no:cacheprovider tests/python
   pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
   ```

**Expected result:** 70 Python and 40 Pester tests passing, and each row of the gap table seen with your own eyes.

## Lab 2: test tenant

Use a test tenant in the worldwide or GCC cloud, never production, with fictional data. The steps use the Conditional Access export because it needs one permission.

1. **Register the app in the tenant's own cloud.** An app for a GCC tenant is registered in the worldwide Microsoft Entra admin center; an app for GCC High or DoD must be registered in the national cloud's.[^c02-sdk-clouds] Add a certificate credential. Don't add a secret.
2. **Grant one permission.** Add the application permission `Policy.Read.All`, the one `ca-export` declares, and grant admin consent. Nothing else.
3. **Run the task:**

   ```text
   python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem ca-export --out ca
   ```

   `pip install azure-identity` first. Expect no warning, one JSON file per policy in `ca`, and a summary on screen.
4. **See the token check work.** Add `Application.Read.All` to the app, grant consent, and run step 3 again: the run continues and prints `warning: token also holds Application.Read.All, which this task doesn't use`. Then run `app-credentials` with only `Policy.Read.All` granted: it stops with `token lacks Application.Read.All` before any Graph call.
5. **See the wrong cloud fail closed.** Run step 3 with `--cloud gcchigh`. Sign-in goes to `login.microsoftonline.us`, the Azure Government authority, which doesn't hold a GCC tenant,[^c02-identity-plan] and the run stops before anything reaches Graph. Learn says tokens aren't interchangeable between clouds.[^c02-deployments]
6. **Optional: PowerShell.** `Connect-FmwGraph -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>`, then `Invoke-FmwEntraTask -Task ca-export -OutDirectory ca-ps`. Compare `ca` and `ca-ps`.
7. **Back it out.** Remove `Application.Read.All` and `Policy.Read.All` from the app, delete the app registration and its certificate, and delete the `ca` and `ca-ps` folders. They hold the tenant's policies.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Token authority | `login.microsoftonline.com` (worldwide and GCC); `login.microsoftonline.us` (Azure US Government) | Separate authority for GCC High and DoD | — | [^c02-deployments] |
| Graph host | `graph.microsoft.com` (worldwide and Microsoft 365 GCC); `graph.microsoft.us` (L4, GCC High); `dod-graph.microsoft.us` (L5, DoD) | Tokens aren't interchangeable between clouds | — | [^c02-deployments] |
| GCC's directory | Office 365 GCC is paired with Microsoft Entra ID in Azure; GCC High and DoD with Microsoft Entra ID in Azure Government | — | — | [^c02-pairing] [^c02-identity-plan] |
| Azure Resource Manager | `management.azure.com` (Azure public); `management.usgovcloudapi.net` (Azure Government) | Azure Government host for GCC High and DoD | — | [^c02-compare] [^c02-controlplane] |
| Graph PowerShell environments | `Global`, `USGov`, `USGovDoD`; `Connect-MgGraph` defaults to the worldwide cloud | — | — | [^c02-mgenv] |
| Azure PowerShell environments | `AzureCloud` (default), `AzureUSGovernment` | — | — | [^c02-azps] |
| Scope in a national cloud | A scope naming the Graph host uses the cloud's host; app-only uses the cloud's `.default`, such as `https://graph.microsoft.us/.default` | — | — | [^c02-sdk-clouds] |
| One resource per token request | All scopes in a client-credentials request must be for one resource | — | — | [^c02-clientcreds] |
| `azure-identity` authority | Defaults to the public cloud; managed identities ignore it | — | — | [^c02-authority] [^c02-authority-mi] |
| Application permissions in a token | The `roles` claim | — | — | [^c02-claims] |
| Paging | Follow `@odata.nextLink`; headers aren't carried to later pages by default; don't use a page token from a retry | — | — | [^c02-paging] |
| Throttling | `429` with `Retry-After`; back off exponentially when it's missing; SDKs don't retry inside a batch | — | — | [^c02-throttling] |
| No `Retry-After` | Conditional access and identity protection resources | — | — | [^c02-limits] |
| `x-ms-throttle-priority` | `Low`, `Normal` (default), `High`; low is throttled first; the limits don't change | — | — | [^c02-limits] |
| JSON batch | At most 20 requests | — | — | [^c02-batching] |
| Beta | Subject to change; not supported in production applications | — | Beta | [^c02-versioning] |
| Autopilot device identities | `GET /deviceManagement/windowsAutopilotDeviceIdentities`; `DeviceManagementServiceConfig.Read.All` | API table lists L4 and L5; Intune lists Windows Autopilot as not available in GCC High and DoD | v1.0; assignment status in beta only | [^c02-autopilot-api] [^c02-intune-gov] |

Two places where Learn's pages differ, recorded so a later edit doesn't loosen the code:

- **Autopilot in the US Government clouds.** The API page's national cloud table shows the Autopilot device identity endpoint in L4 and L5;[^c02-autopilot-api] Intune's government service description lists Windows Autopilot as not available in GCC High and DoD.[^c02-intune-gov] The call list follows the stricter.
- **The Python snippet and the other languages.** On the same national cloud page, the C#, Go, Java and TypeScript examples set the US Government authority; the Python example doesn't.[^c02-sdk-clouds] The code follows the other languages, and `azure-identity`'s own reference, which says the default is the public cloud.[^c02-authority]

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Treating GCC as a `.us` cloud | Sign-in fails, or someone "fixes" it by hard-coding hosts | `gcc` resolves to the worldwide endpoints; a test pins it |
| A Python credential with no authority in GCC High or DoD | It signs in to the public cloud | `azure_identity_provider` sets the authority for every cloud; tested |
| An unknown cloud name with a default | A GCC High run talks to the worldwide service | Unknown names raise, in both languages |
| A token sent to the wrong host | A `nextLink` or a typo hands the token to another host or cloud | Every URL, every page, is checked against the cloud's Graph host |
| One token for Graph and Resource Manager | The second call fails, or code asks for broad scopes to make it work | One `.default` scope per resource; `scope_for(cloud, "arm")` |
| An identity with more than the task needs | A compromised job can do more than read | `graph-calls.json` per task; `preflight` warns on extra roles and stops on missing ones |
| A new call added without its permission | The README and the app registration drift from the code | A task makes only declared calls; the union test fails the build |
| Headers dropped after page one | An advanced query fails or changes on page two | Same headers on every page; tested |
| Retrying too fast, or forever | Throttling gets longer; the job never ends | `Retry-After` or backoff, capped at 60 seconds, with a retry limit |
| A beta change breaks the run | A nightly evidence job fails on a property rename | Declared beta calls only; `try_beta` reports "not evaluated" with the stage |
| An API that answers where the feature isn't offered | A check reports an empty, "clean" result in GCC High | `not_in_clouds` in the call list; no call, "not evaluated" |

## Checklist

- [ ] The client takes an explicit cloud name and raises on any name it doesn't know.
- [ ] GCC uses `login.microsoftonline.com`, `graph.microsoft.com` and, for Azure, `management.azure.com`; nothing in the GCC configuration is a `.us` host.
- [ ] Every credential names the cloud's authority (or is a managed identity), and every scope names the cloud's host.
- [ ] One token per resource: Graph and Resource Manager are never asked for in one request.
- [ ] No URL, including a `nextLink`, is sent to a host other than the cloud's Graph host.
- [ ] Every call is in `graph-calls.json` with its least-privileged permission, and the task's permission list is the union of its calls.
- [ ] The app registration holds exactly the task's permissions, with a certificate or managed identity, never a secret.
- [ ] Paging sends the same headers on every page and retries with the last good link.
- [ ] Throttling waits for `Retry-After`, backs off when it's missing, and stops after a limit.
- [ ] Every beta call is declared, read through `try_beta` or `Get-FmwBetaCollection`, and labeled in the output.
- [ ] The pinned Microsoft snippets match their manifest, and every upstream commit since the pin has been reviewed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 01 — The HR-to-Entra Middleware](01-the-hr-to-entra-middleware.md) · [Workbook index](index.md) · [Next: Chapter 03 — Writing a Validation Kit Check →](03-writing-a-validation-kit-check.md)
:::

[^c02-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^c02-pairing]: Microsoft Learn, "Cloud feature availability for US Government customers," Microsoft 365 integration, <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> (accessed Oct 30, 2026).
[^c02-identity-plan]: Microsoft Learn, "Planning identity for Azure Government applications," frequently asked questions, <https://learn.microsoft.com/azure/azure-government/documentation-government-plan-identity> (accessed Oct 30, 2026).
[^c02-compare]: Microsoft Learn, "Compare Azure Government and global Azure," guidance for developers, <https://learn.microsoft.com/azure/azure-government/compare-azure-government-global-azure> (accessed Oct 30, 2026).
[^c02-controlplane]: Microsoft Learn, "Azure control plane and data plane," <https://learn.microsoft.com/azure/azure-resource-manager/management/control-plane-and-data-plane> (accessed Oct 30, 2026).
[^c02-mgenv]: Microsoft Learn, "Get-MgEnvironment," <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/get-mgenvironment?view=graph-powershell-1.0>, and "Authentication module cmdlets in Microsoft Graph PowerShell," <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands?view=graph-powershell-1.0> (accessed Oct 30, 2026).
[^c02-azps]: Microsoft Learn, "Quickstart: Connect to Azure Government with PowerShell," <https://learn.microsoft.com/azure/azure-government/documentation-government-get-started-connect-with-ps>, and "Manage Azure Redis with Azure PowerShell," how to connect to other clouds (`AzureCloud` is the default), <https://learn.microsoft.com/azure/azure-cache-for-redis/how-to-manage-redis-cache-powershell> (accessed Oct 30, 2026).
[^c02-clientcreds]: Microsoft Learn, "Microsoft identity platform and the OAuth 2.0 client credentials flow," get a token, <https://learn.microsoft.com/entra/identity-platform/v2-oauth2-client-creds-grant-flow> (accessed Oct 30, 2026).
[^c02-sdk-clouds]: Microsoft Learn, "Access national cloud deployments with the Microsoft Graph SDKs," <https://learn.microsoft.com/graph/sdks/national-clouds> (accessed Oct 30, 2026).
[^c02-snippets-code]: Microsoft, microsoftgraph/msgraph-snippets-python, `src/snippets/national_clouds.py` and `src/snippets/create_clients.py` at commit `3ef43818c946ef595e8d90fa6ec63edec1fb3628` (October 20, 2026), MIT License, <https://github.com/microsoftgraph/msgraph-snippets-python/tree/3ef43818c946ef595e8d90fa6ec63edec1fb3628/src/snippets> (accessed Oct 30, 2026); rendered on Learn's national cloud page and on "Choose a Microsoft Graph authentication provider," <https://learn.microsoft.com/graph/sdks/choose-authentication-providers>; pinned copy in `examples/third_party/msgraph-snippets-python`.
[^c02-authority]: Microsoft Learn, "InteractiveBrowserCredential Class" (azure-identity for Python), keyword-only parameter `authority`, <https://learn.microsoft.com/python/api/azure-identity/azure.identity.interactivebrowsercredential?view=azure-python> (accessed Oct 30, 2026).
[^c02-authority-mi]: Microsoft Learn, "DefaultAzureCredential Class" (azure-identity for Python), keyword-only parameter `authority`, <https://learn.microsoft.com/python/api/azure-identity/azure.identity.defaultazurecredential?view=azure-python> (accessed Oct 30, 2026).
[^c02-claims]: Microsoft Learn, "Access token claims reference," payload claims, <https://learn.microsoft.com/entra/identity-platform/access-token-claims-reference> (accessed Oct 30, 2026).
[^c02-leastpriv]: Microsoft Learn, "Overview of Microsoft Graph permissions," best practices for using Microsoft Graph permissions, <https://learn.microsoft.com/graph/permissions-overview> (accessed Oct 30, 2026).
[^c02-overpriv]: Microsoft Learn, "Enhance security with the principle of least privilege," overprivileged applications, <https://learn.microsoft.com/entra/identity-platform/secure-least-privileged-access> (accessed Oct 30, 2026).
[^c02-paging]: Microsoft Learn, "Page through a collection using the Microsoft Graph SDKs," <https://learn.microsoft.com/graph/sdks/paging> (accessed Oct 30, 2026).
[^c02-throttling]: Microsoft Learn, "Microsoft Graph throttling guidance," <https://learn.microsoft.com/graph/throttling> (accessed Oct 30, 2026).
[^c02-limits]: Microsoft Learn, "Microsoft Graph service-specific throttling limits," identity and access service limits, <https://learn.microsoft.com/graph/throttling-limits> (accessed Oct 30, 2026).
[^c02-retryafter]: Microsoft Learn, "The Retry-After header: how long to wait before you retry," <https://learn.microsoft.com/microsoft-cloud/dev/dev-proxy/concepts/retry-after-header> (accessed Oct 30, 2026).
[^c02-batching]: Microsoft Learn, "Combine multiple HTTP requests using JSON batching," batch size limitations, <https://learn.microsoft.com/graph/json-batching> (accessed Oct 30, 2026).
[^c02-versioning]: Microsoft Learn, "Versioning, support, and breaking change policies for Microsoft Graph," <https://learn.microsoft.com/graph/versioning-and-support> (accessed Oct 30, 2026).
[^c02-autopilot-api]: Microsoft Learn, "List windowsAutopilotDeviceIdentities," <https://learn.microsoft.com/graph/api/intune-enrollment-windowsautopilotdeviceidentity-list?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c02-intune-gov]: Microsoft Learn, "Microsoft Intune for US Government GCC High and DoD service description," Intune features not available in GCC High and DoD, <https://learn.microsoft.com/intune/fundamentals/government-service> (accessed Oct 30, 2026).
