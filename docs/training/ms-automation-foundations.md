---
title: "Microsoft Automation, Module 1: Graph and Azure Foundations"
subtitle: "Learn which cloud's endpoints a script calls, how it signs in without a secret, which permissions it asks for, and the four request patterns every Graph script has to get right, then prove each one on fixtures"
description: "Module 1 of the Microsoft Automation learning path. You learn the endpoints a commercial or GCC tenant uses, app-only sign-in with managed identities, workload identity federation and certificates, Microsoft Graph permissions and consent, the current Python and PowerShell tools (and the retired modules), and paging, throttling, batching, delta and advanced queries. Lab 1 runs the example Graph client against fixtures with no tenant; Lab 2 registers a one-permission app in your test tenant."
research-status: draft
research-type: training module
research-book: "Books 02, 04, 05, 06, 10, 15"
series-order: 1
date-modified: 2026-11-01
aliases:
  - /docs/research/ms-automation-foundations.html
review-status: approved
reviewed-sha256: 57c8dabe687124710f085221a46a1c80d3c711ad4592852f0c9d7c6644294b2c
last-reviewed: 2026-11-25
---
# Microsoft Automation, Module 1: Graph and Azure Foundations {.unnumbered}

**Learning path:** [Microsoft Automation](index.md#microsoft-automation-learning-path) · Module 1 of 4 · 85 minutes · Code: [examples/ms-automation](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation) · Developer workbook: [Book 19, Chapter 02](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_MS_Automation_Module_1.pptx) · [Narrated deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_MS_Automation_Module_1_Narrated.pptx) (about 14 minutes, captions) · [▶ Watch](../presentations/watch.html?v=Training_MS_Automation_Module_1_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_MS_Automation_Module_1_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-1/Training_MS_Automation_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-1/Training_MS_Automation_Module_1_Narrated.vtt).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

The books keep asking for evidence a script collects and for changes a pipeline makes: Conditional Access exported as code ([Book 04, Chapter 10](../books/b04-access/10-access-as-code-and-evidence.md)), device compliance read back for the access decision ([Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md)), and control evidence gathered on a schedule ([Book 15, Chapter 08](../books/b15-day2-operations/08-control-automation-m365-and-azure.md)). Almost all of it goes through Microsoft Graph, and the Azure parts go through Azure Resource Manager.

Picture your first evidence collector. It works in a commercial test tenant, then fails, or sends its token to the wrong host, the day someone gives it a URL it didn't expect. It reads the first page of users and reports a 100-user tenant. It signs in with a client secret that nobody rotates. This module covers what every such script has to get right before it does anything useful. The modules after it apply this to one product each.

| Module | Covers | Status |
|---|---|---|
| **1. Foundations** (this page) | Clouds and endpoints, sign-in, permissions, tools, request patterns | Draft |
| [2. Microsoft Entra ID](ms-automation-entra.md) | Users, groups, Conditional Access, PIM, applications, logs, authentication methods | Draft |
| [3. Intune](ms-automation-intune.md) | Devices, compliance, configuration, Autopilot | Draft |
| [4. Azure Arc and Azure Resource Manager](ms-automation-arc.md) | Resource Manager versus Graph, Resource Graph, Arc machines and extensions, SQL Server, Azure Policy, product lifecycle | Draft |
| 5. Teams Phone and Teams administration | Calling, policies, the Teams PowerShell module | Planned |
| 6. Monitoring and evidence | Log Analytics and KQL, Defender, Sentinel | Planned |

**The federal requirement.** This module's subject is the collector itself, so its requirements are the ones the collector's identity has to meet. Least privilege (NIST SP 800-53 AC-6) means each script holds only the permissions its calls need. Authenticator management (IA-5) means no long-lived secret: ScubaGear's application-credential policies, MS.AAD.5.5v1 and 5.6v1, apply to the program's own automation too. And continuous monitoring (CA-7) depends on collectors that return complete results. BOD 25-01 requires the SCuBA assessment tools and continuous reporting for in-scope tenants. Don't restate those here: [Book 02, Appendix A](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#cisa-bod-25-01-and-the-scuba-baselines) has the directive and its mandatory policies, its [NIST SP 800-53 control mapping](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#nist-sp-800-53-rev.-5-control-mapping) has AC-6, IA-5 and CA-7, and the [federal framework crosswalk](../reference/federal-framework-crosswalk.md) lists every source.

### The answer in brief

- **Pick the cloud first.** A Microsoft 365 GCC tenant uses the worldwide endpoints. One wrong host and the script fails, or sends a token where it shouldn't.
- **Sign in as a workload, without a secret.** Use a managed identity where the script runs in Azure or on an Arc-enabled server, workload identity federation for pipelines such as GitHub Actions, and a CA-issued certificate otherwise. ScubaGear recommends blocking application passwords altogether (MS.AAD.5.5v1).
- **Ask for the least-privileged application permissions** each API page lists, and have an administrator with the right role consent to them.
- **Use the current tools.** These are the Microsoft Graph PowerShell SDK, the Python `msgraph-sdk` with `azure-identity`, Az PowerShell and the Azure CLI. The AzureAD and MSOnline modules are retired.
- **Every Graph script needs the same four patterns:**
  - follow `@odata.nextLink`;
  - wait for `Retry-After` on 429;
  - put at most 20 requests in a batch;
  - keep the delta link to track changes.

### Learning objectives

In this module, you'll:

- Choose the sign-in host, Graph host and PowerShell environment for a commercial or GCC tenant.
- Pick a credential for a scheduled script, in order of preference, and say who can consent to its permissions.
- Find the least-privileged application permission for a Graph call, and recognize what a narrow permission hides.
- Describe the four request patterns, and the advanced-query header, and what goes wrong without each.
- Run the example client's cloud, permission and host checks on a laptop, in Python and PowerShell.

### Prerequisites

- You can run commands in a terminal and read Python or PowerShell. You know what an access token is.
- For Lab 1: the [lab tools](index.md#what-you-need-for-the-microsoft-automation-labs). No tenant until Lab 2.
- Optional background: [Book 10, Chapter 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md) on what GCC is and isn't.

### Get the code {#get-the-code}

Download [microsoft-automation-code.zip](../../downloads/microsoft-automation-code.zip) to your Downloads folder and unzip it into `C:\FMWLabs\microsoft-automation-code` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\microsoft-automation-code\ms-automation`. Every lab command on this page runs from there, as it does from `examples/ms-automation` in a clone of the repository. [Get the Microsoft Automation code](index.md#get-the-microsoft-automation-code) says why each step is there, and [Set Up for the Labs](lab-setup.md) installs Python and PowerShell 7.5.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7 can unzip; the kit's PowerShell steps need 7.5):

```powershell
Expand-Archive -Path $HOME\Downloads\microsoft-automation-code.zip -DestinationPath C:\FMWLabs\microsoft-automation-code -Force
Set-Location C:\FMWLabs\microsoft-automation-code\ms-automation
Get-ChildItem C:\FMWLabs\microsoft-automation-code -Recurse -File | Unblock-File
```

In Git Bash on Windows:

```bash
mkdir -p /c/FMWLabs
unzip -o ~/Downloads/microsoft-automation-code.zip -d /c/FMWLabs/microsoft-automation-code
cd /c/FMWLabs/microsoft-automation-code/ms-automation
```

In Bash on Linux or macOS, which use `~/FMWLabs` in place of `C:\FMWLabs`:

```bash
mkdir -p ~/FMWLabs
unzip -o ~/Downloads/microsoft-automation-code.zip -d ~/FMWLabs/microsoft-automation-code
cd ~/FMWLabs/microsoft-automation-code/ms-automation
```

Check the code with Lab 1, Step 1 (it runs the same in PowerShell or Bash):

```bash
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints, scope_for; print(endpoints('gcc')); print(scope_for('gcc', 'arm')); print(scope_for('gcc'))"
```

It prints the GCC endpoints, `{'login': 'https://login.microsoftonline.com', 'graph': 'https://graph.microsoft.com', 'arm': 'https://management.azure.com', 'ps_env': 'Global', 'azure_env': 'AzureCloud'}`, then `https://management.azure.com/.default` and `https://graph.microsoft.com/.default`.

## Unit 2: Clouds and endpoints {#clouds-and-endpoints}

*10 minutes*

Microsoft Graph and Microsoft Entra ID run as separate *national cloud* deployments. A script has to call the sign-in and Graph hosts of the cloud its tenant lives in, and a Microsoft 365 GCC tenant lives in the worldwide service.[^m1-deploy][^m1-natcloud]

| Tenant | Sign-in (authority) | Microsoft Graph | Graph PowerShell `-Environment` | Az PowerShell / Azure CLI |
|---|---|---|---|---|
| Commercial | `https://login.microsoftonline.com` | `https://graph.microsoft.com` | `Global` | default |
| Microsoft 365 **GCC** | `https://login.microsoftonline.com` | `https://graph.microsoft.com` | `Global` | default |

Sources: Microsoft's Graph deployments page says a GCC environment should "continue using the worldwide endpoints".[^m1-deploy] The Graph PowerShell environment names come from `Get-MgEnvironment`.[^m1-mgauth] The Azure column is commercial Azure, which a GCC tenant's subscriptions use. Module 4 will cover Azure Resource Manager in detail.

What a script still has to get right, beyond the hosts:

- **The scope names the resource.** App-only tokens for Graph in worldwide and GCC tenants use `https://graph.microsoft.com/.default`, the form Microsoft's client-credentials guide uses.[^m1-authsvc]
- **Each API page lists the clouds it works in.** Every Graph API reference page has a national-cloud table. Most Entra APIs in Module 2 are available in the global service, which GCC uses.[^m1-authmethods] Check the table before relying on an API.

GCC uses the worldwide endpoints, but some features available in commercial tenants aren't available in GCC. That's a feature question, not an endpoint question; [Book 10, Chapter 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md) covers it, and [Unit 6](#unit-6-where-agencies-are) covers what it means for this module.

## Unit 3: Signing in as a workload {#signing-in-as-a-workload}

*10 minutes*

A scheduled script signs in as itself, not as a person: an **app registration** in Entra ID and its **service principal** in the tenant, with *application* permissions, using the OAuth 2.0 client-credentials flow.[^m1-authsvc] The question that matters is what the app proves its identity with. In order of preference *(design guidance, from the sources cited)*:

| Credential | Use it when | Notes |
|---|---|---|
| **Managed identity** | The script runs on an Azure resource, or on an Azure Arc-enabled server | No credential to store or rotate, at no extra cost. A system-assigned identity's service principal is created and deleted with the resource.[^m1-mi] Arc-enabled servers have one too.[^m1-arcmi] |
| **Workload identity federation** | The script runs in GitHub Actions, Kubernetes, or another platform that issues its own tokens | The app trusts the external platform's tokens, so no secret is stored.[^m1-wif][^m1-fic] |
| **Certificate** | Anywhere else, such as an on-premises scheduler | Microsoft recommends "a trusted certificate issued by a certificate authority" over an application secret.[^m1-appinst] The app signs a JWT assertion with it.[^m1-certcred] The certificate's lifetime follows [Book 04, Chapter 05](../books/b04-access/05-applications-and-workload-identities.md) (180 days), the app's owner rotates it, and the choice of CA follows [Book 07](../books/b07-pki/index.md). |
| Client secret | Avoid | ScubaGear: application password addition *should* be blocked (MS.AAD.5.5v1), and lifetimes kept to 180 days (MS.AAD.5.6v1).[^m1-scuba] |

**Consent.** Application permissions take effect only after tenant-wide admin consent. Microsoft Graph application permissions need a **Privileged Role Administrator**, the least privileged role listed; in practice this typically requires a Global Administrator, and it may not be enough ([Book 04, Chapter 05](../books/b04-access/05-applications-and-workload-identities.md)). Cloud Application Administrator and Application Administrator can consent to anything *except* Microsoft Graph app roles.[^m1-consent] Plan for that approval step in the change process: it's the moment someone with privilege decides what the script may read.

![The same order as the table above, as the Non-Person Identity guide draws it: managed identity, then federation, then a vaulted certificate; that guide goes further than avoiding client secrets and blocks new ones by app management policy, with documented exceptions only.](../images/diagrams/guides/svg/workload-credential-order.svg){#fig-workload-credential-order fig-alt="A decision diagram that reads from the top. An amber question asks: Does the workload run on Azure or an Arc-enabled server? A green arrow labeled yes leads right to a green box, First choice, managed identity: Azure manages and rotates the credential; nobody can read it. An arrow labeled no leads down to a second amber question: Does its platform issue tokens Entra ID can trust? A green arrow labeled yes leads right to a green box, Second choice, workload identity federation: no stored secret; issuer and subject recorded and approved. An amber arrow labeled no leads down to an amber box, Third choice, certificate: key in Key Vault or an HSM; new ones capped at 180 days by policy; rotated, then uploaded to the app. A dashed red arrow labeled exception only leads down to a red box, Client secret: new secrets blocked by the app management policy; documented exception only."}

## Unit 4: Permissions and tools

*8 minutes*

### Permissions

Graph has two kinds of permission. **Delegated** permissions act for a signed-in user and are limited by what that user can do. **Application** permissions act as the app, across the tenant.[^m1-perms] Every API reference page lists the permissions in order from least to most privileged. Ask for the least-privileged one that does the job.[^m1-perms][^m1-best] Two helpers in Graph PowerShell find them:

- `Find-MgGraphCommand -Uri '/users/{id}'` lists the cmdlets for an API path and their permissions.[^m1-findcmd]
- `Find-MgGraphPermission` searches permission names and shows their descriptions.[^m1-findperm]

**Reading with a narrow permission.** When a script lists members or other directory objects with a narrow permission, Graph still returns the objects it can't fully read, but with only `id` and `@odata.type` filled in.[^m1-perms] Treat a null property as possibly "not permitted", not "empty".

**Where a narrower permission exists, use it.** For example, `User.EnableDisableAccount.All` plus `User.Read.All` is the least-privileged combination for enabling and disabling accounts; `User.ReadWrite.All` isn't needed.[^m1-userlist] Module 2 lists the least-privileged permission for every task it covers.

The example code keeps every call and its permission in one file, `graph-calls.json`, and a task can make only the calls listed for it. You'll see that in Lab 1.

### Tools

| Tool | Install | Use it for |
|---|---|---|
| Microsoft Graph PowerShell SDK | `Install-Module Microsoft.Graph`[^m1-sdkinst] | Interactive and scheduled administration; `Invoke-MgGraphRequest` for any endpoint |
| Microsoft Graph Python SDK | `pip install msgraph-sdk`[^m1-sdkinst] | Services and pipelines; Learn's paging page shows a page iterator for the other SDK languages, not Python, so follow `@odata.nextLink` yourself[^m1-pypaging] |
| `azure-identity` (Python) | `pip install azure-identity` | Managed identity, certificate and federated credentials, for Graph and Azure alike[^m1-azid] |
| Az PowerShell, Azure CLI | (Module 4) | Azure Resource Manager: subscriptions, Arc, Policy |
| AzureAD, AzureAD Preview, MSOnline | **Don't** | Deprecated on March 30, 2024; Microsoft said they would work only until March 30, 2025, the announced date (the actual shut-off came later, as [Book 02, Chapter 03](../books/b02-identity/03-ad-and-entra-side-by-side.md) records), and recommends migrating to Microsoft Graph PowerShell[^m1-aadps][^m1-mgmig] |

The example client calls the REST API directly with the standard library. That isn't a recommendation against the SDKs, which handle paging and retries for you. It keeps every request visible, so the patterns below can be read and tested line by line *(design guidance)*. [Book 19, Chapter 02](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) starts from Microsoft's own SDK snippets and explains each rule the client adds.

## Unit 5: Four request patterns {#four-request-patterns}

*12 minutes*

**1. Paging.** Collections come back a page at a time. `GET /users` returns 100 users by default and up to 999 with `$top`, or 500 when `signInActivity` is selected.[^m1-userlist] When more remain, the response carries `@odata.nextLink`. Call that URL, unchanged, until it stops appearing.[^m1-paging] A script that reads only the first page reports a tenant of 100 users and looks correct.

**2. Throttling.** When a client goes over a limit, Graph answers **429 Too Many Requests** with a `Retry-After` header. Microsoft's guidance is to wait that many seconds and retry, because retrying immediately keeps counting against the limit.[^m1-throttle] The limits are layered, and the first one reached applies:

- **Every service:** 130,000 requests per 10 seconds per app, across all tenants.[^m1-limits]
- **Entra ID objects** (users, groups, applications, service principals and other directory objects) use cost-based *resource units* instead:[^m1-limits]
  - per app and tenant: 3,500, 5,000 or 8,000 resource units per 10 seconds, for tenants under 50, 50 to 500, and over 500 users;
  - writes: 3,000 per 2 minutes 30 seconds per app and tenant, and 18,000 per 5 minutes per tenant across all apps.
- **What changes a request's cost:**[^m1-limits]
  - `$select` lowers the cost by 1;
  - `$expand` raises it by 1;
  - `$top` under 20 lowers it by 1;
  - listing `groups/{id}/transitiveMembers` costs 5, against 3 for `members`.
- **Priority:** a background job can send `x-ms-throttle-priority: Low`. Microsoft recommends setting priority to High only for requests a user started.[^m1-limits]

**3. Batching.** `POST /$batch` takes **at most 20** requests. Each one is still evaluated, and throttled, on its own. `dependsOn` orders requests within the batch.[^m1-batch] A batch can succeed while some of its requests return 429, so check every response's status.

**4. Delta queries.** Instead of re-reading everything, call an entity's `/delta` function. Follow `@odata.nextLink` until the response carries `@odata.deltaLink`, then store that link. The next run calls it and gets only the changes.[^m1-delta] Users and groups also support `$deltatoken=latest` to start tracking from now without reading the full state first.[^m1-delta]

**Advanced queries.** Some Entra ID queries, such as `$count`, `$search`, and some `$filter` and `$orderby` forms, need the `ConsistencyLevel: eventual` header, and `$count` too except for `$search`.[^m1-advq] Without them the request fails or returns a different result. These queries read an index that can lag slightly behind the directory.

### What this means for the books

- **Every evidence script states its cloud and its permissions.** Book 15's control automation should record the endpoint and the exact permissions for each collector, so a change of tenant or host is a configuration change, not a rewrite *(design guidance)*.
- **No collector uses a client secret.** That puts ScubaGear's application-credential policies (MS.AAD.5.5v1 to 5.7v1) and Book 04's stricter rule (secrets blocked, certificates capped at 180 days) into practice for the program's own automation.
- **A collector that pages, retries and keeps delta links** produces complete evidence at a predictable cost. One that doesn't produces evidence that looks complete.

## Unit 6: Where agencies are

*7 minutes*

**The starting state this path assumes.** A civilian agency at FedRAMP Moderate, most often with a Microsoft 365 GCC tenant and commercial Azure, as the [developer workbook](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md#which-cloud-is-which) sets out. Its existing scripts are often older than the current tools: AzureAD or MSOnline cmdlets, a client secret in a scheduled task, and a host name written into the code.

**GCC availability for what this module relies on:**

| What the module relies on | Commercial and GCC | Source |
|---|---|---|
| Sign-in and Graph hosts | `login.microsoftonline.com`, `graph.microsoft.com` | [^m1-deploy] |
| App registration | Worldwide Microsoft Entra admin center | [^m1-deploy] |
| A managed identity as an app's federated credential | Audience `api://AzureADTokenExchange` | [^m1-ficaud] |
| Each Graph API | The global service column of the page's national cloud table: check it before relying on an API | [^m1-authmethods] |

GCC needs no endpoint change, but it can lack features that commercial tenants have; Book 10 keeps that list ([Chapter 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md#what-agencies-verifiably-lose)).

**Interim paths** *(design guidance)*:

- **Scripts still on AzureAD or MSOnline.** Those modules are past their retirement date.[^m1-aadps] Rewrite each one on Microsoft Graph PowerShell, using Microsoft's migration guide,[^m1-mgmig] and use the rewrite to move it to app-only sign-in with its own least-privileged permissions.
- **A collector that has to stay on premises for now.** Use a CA-issued certificate, not a secret,[^m1-appinst] and keep its lifetime to Book 04's 180-day policy ([Chapter 05](../books/b04-access/05-applications-and-workload-identities.md)), with the app's owner rotating it and the CA chosen per [Book 07](../books/b07-pki/index.md). Move it to a managed identity on an Arc-enabled server when the server is onboarded.[^m1-arcmi]

## Unit 7: Exercise: Lab 1 (fixtures, no tenant)

*25 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\microsoft-automation-code\ms-automation

$Run = "C:\FMWLabs\results\ms-automation-foundations\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints, scope_for; print(endpoints('gcc')); print(scope_for('gcc', 'arm')); print(scope_for('gcc'))"

# Step 2
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints; endpoints('usgov')" 2>&1 | Select-Object -Last 1 | ForEach-Object ToString

# Step 3
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import load_calls, permissions_for; print(permissions_for(load_calls('stale-users')))"

# Step 4
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient, load_calls; GraphClient('gcc', lambda s: 't', calls=load_calls('ca-export')).request('GET', '/users')" 2>&1 | Select-Object -Last 1 | ForEach-Object ToString
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient; GraphClient('gcc', lambda s: 't').request('GET', 'https://graph.example.invalid/v1.0/users')" 2>&1 | Select-Object -Last 1 | ForEach-Object ToString

# Step 5
python -m pytest -q -p no:cacheprovider tests/python/test_graphkit_and_tasks.py -k "paging or next_link or 429 or retries or retry_after or batch or delta or advanced"

# Step 5
python -c "import inspect, sys; sys.path[:0] = ['python', 'tests/python']; import test_graphkit_and_tasks as t; print(inspect.getsource(t.test_batch_chunks_of_20_and_retries_throttled_items)); print(inspect.getsource(t.test_delta_returns_items_and_new_link))"

# Step 6
Import-Module ./powershell/FmwGraph.psm1
(Get-FmwCloud gcc).Login
(Get-FmwCloud gcc).Graph
(Get-FmwCloud gcc).Arm
Get-FmwCallPermission -Task stale-users
try { Assert-FmwGraphCall -Method GET -Uri 'https://graph.example.invalid/v1.0/users' -Cloud gcc } catch { $_.Exception.Message }

# Step 6
(Get-FmwCloud GCC).Graph
try { Get-FmwCloud usgov } catch { $_.Exception.Message }

# Step 7
python -m pytest -q -p no:cacheprovider tests/python | Tee-Object "$Run\pytest.txt"
$r = Invoke-Pester -Path tests/powershell -Output None -PassThru
"Pester: $($r.PassedCount) passed, $($r.FailedCount) failed" | Tee-Object "$Run\pester.txt"

# Step 7
Get-ChildItem C:\FMWLabs\results\ms-automation-foundations\lab1 -Name
```

:::

<!-- labs:end -->

You prove, on a laptop, that the example client picks the right cloud, refuses the wrong one, asks only for what a task needs, and pages, retries, batches and tracks deltas the way Microsoft documents. The developer workbook's [Chapter 02, Lab 1](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md#lab-1-fixtures-no-tenant) runs the same client against Microsoft's own SDK snippets; do it after this lab if you build Graph clients.

Every step runs in PowerShell 7, the Python commands included, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](#get-the-code):

```powershell
Set-Location C:\FMWLabs\microsoft-automation-code\ms-automation
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\ms-automation-foundations\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\ms-automation-foundations\lab1\<run>
```

The run's date is only the folder's name. This lab reads only the kit's own code and tests, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/microsoft-automation-code/ms-automation`, make the run folder with `Run=/c/FMWLabs/results/ms-automation-foundations/lab1/$(date -u +%Y-%m-%dT%H%M%SZ); mkdir -p "$Run"`, and steps 1, 3 and 5 run the same there; steps 2, 4, 6 and 7 use PowerShell 7 commands (type `pwsh` to start it). In a clone of the repository, use the `examples` folder of the same name.

1. Print the endpoints for GCC, and the scopes for Resource Manager and Graph.

   ```powershell
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints, scope_for; print(endpoints('gcc')); print(scope_for('gcc', 'arm')); print(scope_for('gcc'))"
   ```

   Expected output:

   ```text
   {'login': 'https://login.microsoftonline.com', 'graph': 'https://graph.microsoft.com', 'arm': 'https://management.azure.com', 'ps_env': 'Global', 'azure_env': 'AzureCloud'}
   https://management.azure.com/.default
   https://graph.microsoft.com/.default
   ```

   Compare each value with the table in [Unit 2](#clouds-and-endpoints).

2. Ask for a cloud name the client doesn't know. Python stops with an error; `2>&1 | Select-Object -Last 1 | ForEach-Object ToString` keeps only the error's last line, as plain text.

   ```powershell
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints; endpoints('usgov')" 2>&1 | Select-Object -Last 1 | ForEach-Object ToString
   ```

   Expected output:

   ```text
   ValueError: unknown cloud 'usgov'; one of ['gcc', 'global']
   ```

   An unknown name is an error, never a default.

3. List the permissions a task needs, from the calls it declares.

   ```powershell
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import load_calls, permissions_for; print(permissions_for(load_calls('stale-users')))"
   ```

   Expected output:

   ```text
   ['AuditLog.Read.All', 'User.Read.All']
   ```

4. Make a call the task doesn't declare, then send the token to a host that isn't Graph. Both stop with an error; each command keeps the error's last line.

   ```powershell
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient, load_calls; GraphClient('gcc', lambda s: 't', calls=load_calls('ca-export')).request('GET', '/users')" 2>&1 | Select-Object -Last 1 | ForEach-Object ToString
   python -c "import sys; sys.path.insert(0, 'python'); from graphkit import GraphClient; GraphClient('gcc', lambda s: 't').request('GET', 'https://graph.example.invalid/v1.0/users')" 2>&1 | Select-Object -Last 1 | ForEach-Object ToString
   ```

   Expected output:

   ```text
   PermissionError: undeclared call: GET /v1.0/users; add it to graph-calls.json with its permission
   ValueError: refusing to send the token to https://graph.example.invalid/v1.0/users: not https://graph.microsoft.com
   ```

   Nothing was sent in either case: the token here is the fake string `t`.

5. Run the tests for the four request patterns and the advanced-query header.

   ```powershell
   python -m pytest -q -p no:cacheprovider tests/python/test_graphkit_and_tasks.py -k "paging or next_link or 429 or retries or retry_after or batch or delta or advanced"
   ```

   Expected output: a line of nine dots, then `9 passed, 10 deselected` and the time the run took. Now print two of those tests, `test_batch_chunks_of_20_and_retries_throttled_items` and `test_delta_returns_items_and_new_link`:

   ```powershell
   python -c "import inspect, sys; sys.path[:0] = ['python', 'tests/python']; import test_graphkit_and_tasks as t; print(inspect.getsource(t.test_batch_chunks_of_20_and_retries_throttled_items)); print(inspect.getsource(t.test_delta_returns_items_and_new_link))"
   ```

   Expected output:

   ```text
   def test_batch_chunks_of_20_and_retries_throttled_items():
       reqs = [{"id": str(i), "method": "GET", "url": f"/users/u{i}"} for i in range(45)]

       def ok(chunk, throttle=()):
           return (200, {}, {"responses": [
               {"id": r["id"], "status": 429 if r["id"] in throttle else 200, "headers": {"Retry-After": "3"} if r["id"] in throttle else {}, "body": {}}
               for r in chunk
           ]})

       responses = [ok(reqs[0:20], throttle={"5"}), ok(reqs[20:40]), ok(reqs[40:45]), ok([reqs[5]])]
       g, fake, sleeps = client(responses)
       out = g.batch(reqs)
       assert len(out) == 45 and all(r["status"] == 200 for r in out.values())
       assert [len(c["body"]["requests"]) for c in fake.calls] == [20, 20, 5, 1]
       assert all(len(c["body"]["requests"]) <= BATCH_LIMIT for c in fake.calls)
       assert sleeps == [3.0]

   def test_delta_returns_items_and_new_link():
       g, _, _ = client(
           [
               (200, {}, {"value": [{"id": "a"}], "@odata.nextLink": "https://graph.microsoft.com/v1.0/users/delta?$skiptoken=1"}),
               (200, {}, {"value": [{"id": "b"}], "@odata.deltaLink": "https://graph.microsoft.com/v1.0/users/delta?$deltatoken=Z"}),
           ]
       )
       items, link = g.delta("/users/delta?$select=id")
       assert [i["id"] for i in items] == ["a", "b"] and link.endswith("$deltatoken=Z")
   ```

   Each one feeds the client a fake transport and checks exactly what it sent.

6. The same rules in PowerShell, with the kit's PowerShell module. The last command refuses the call; `try` and `catch` print the refusal's message.

   ```powershell
   Import-Module ./powershell/FmwGraph.psm1
   (Get-FmwCloud gcc).Login
   (Get-FmwCloud gcc).Graph
   (Get-FmwCloud gcc).Arm
   Get-FmwCallPermission -Task stale-users
   try { Assert-FmwGraphCall -Method GET -Uri 'https://graph.example.invalid/v1.0/users' -Cloud gcc } catch { $_.Exception.Message }
   ```

   Expected output:

   ```text
   https://login.microsoftonline.com
   https://graph.microsoft.com
   https://management.azure.com
   AuditLog.Read.All
   User.Read.All
   Refusing to send the token to https://graph.example.invalid/v1.0/users: not https://graph.microsoft.com
   ```

   In PowerShell the cloud name is checked by `ValidateSet`, which ignores case, so the first of these works there and the second fails:

   ```powershell
   (Get-FmwCloud GCC).Graph
   try { Get-FmwCloud usgov } catch { $_.Exception.Message }
   ```

   Expected output:

   ```text
   https://graph.microsoft.com
   Cannot validate argument on parameter 'Cloud'. The argument "usgov" does not belong to the set "global,gcc" specified by the ValidateSet attribute. Supply an argument that is in the set and then try the command again.
   ```

7. Run the kit's full test suites. `Tee-Object` prints each result and saves a copy in this run's folder, the record that this copy of the kit passed.

   ```powershell
   python -m pytest -q -p no:cacheprovider tests/python | Tee-Object "$Run\pytest.txt"
   $r = Invoke-Pester -Path tests/powershell -Output None -PassThru
   "Pester: $($r.PassedCount) passed, $($r.FailedCount) failed" | Tee-Object "$Run\pester.txt"
   ```

   Expected output: pytest prints rows of dots, then `94 passed` and the time it took. Pester runs quietly and then prints its counts:

   ```text
   Pester: 57 passed, 0 failed
   ```

   The counts include Module 3's Intune tests (17 in Python) and Module 4's Arc tests (31 in Python, 17 in Pester).

   Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\ms-automation-foundations\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** for any tenant, you can name the hosts, the scope and the PowerShell environment, and show that the client refuses the wrong one.

## Unit 8: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```bash
pip install azure-identity
python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem ca-export --out ca

rm -rf ca
```

:::

<!-- labs:end -->

You register an app with one permission, run one read-only task, and remove the app. (The chapter's later steps, which show the token check and the wrong-cloud refusal, add a second permission and aren't part of this lab.) Follow the developer workbook's [Chapter 02, Lab 2](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md#lab-2-test-tenant), which uses the Conditional Access export because it needs one permission.

- **You need:** a test tenant in the worldwide or GCC cloud, never production, with fictional data; an administrator who can grant tenant-wide admin consent to a Microsoft Graph application permission, which is a Privileged Role Administrator, and in practice typically a Global Administrator ([Unit 3](#signing-in-as-a-workload)); Python with the `azure-identity` package (the run below installs it), or Microsoft Graph PowerShell.
- **You'll replace:** `<tenant-id>` (the test tenant's ID), `<app-id>` (the app's application (client) ID); `app.pem` is the PEM file with the app's certificate and private key.
- **The app registration:** a certificate credential, no secret, and the application permission `Policy.Read.All`, with admin consent. Nothing else.
- **The run**, from `examples/ms-automation`. It only reads:

  ```bash
  pip install azure-identity
  python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem ca-export --out ca
  ```

- **Back it out:** remove the permissions, delete the app registration and its certificate, and delete the `ca` folder, which holds the tenant's policies. Step 7 of the chapter's Lab 2 lists each one.

  ```bash
  rm -rf ca
  ```

## Unit 9: Knowledge check

*5 minutes*

1. Your agency's tenant is Microsoft 365 GCC. Which Graph host does your collector call?
   a. `https://management.azure.com`
   b. `https://graph.microsoft.com`
   c. `https://login.microsoftonline.com`

2. A collector runs nightly on an on-premises scheduler that isn't connected to Azure Arc. Which credential should it use?
   a. A client secret with a 180-day lifetime.
   b. A managed identity.
   c. A certificate issued by a certificate authority.

3. Which role can grant tenant-wide admin consent to a Microsoft Graph application permission?
   a. Application Administrator.
   b. Privileged Role Administrator.
   c. Cloud Application Administrator.

4. A script lists users with `$top=999` and gets 999 back. What must it do before it reports a count?
   a. Nothing: 999 is the maximum, so that's the tenant.
   b. Follow `@odata.nextLink` until the response no longer carries one.
   c. Repeat the request with `ConsistencyLevel: eventual`.

5. A batch returns 200, but two of its 20 requests returned 429. What should the client do?
   a. Treat the batch as successful.
   b. Retry the whole batch at once.
   c. Check each response's status and retry the throttled requests after their wait.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** A GCC tenant uses the worldwide endpoints. See [Unit 2: Clouds and endpoints](#clouds-and-endpoints).
2. **c.** Microsoft recommends a CA-issued certificate over a secret, and a managed identity needs an Azure resource or an Arc-enabled server. See [Unit 3: Signing in as a workload](#signing-in-as-a-workload).
3. **b.** The two application administrator roles can consent to anything except Microsoft Graph app roles. See [consent](#signing-in-as-a-workload) in Unit 3.
4. **b.** More pages may remain; a script that reads only the first page looks correct and isn't. See pattern 1 in [Unit 5](#four-request-patterns).
5. **c.** Each request in a batch is throttled on its own, so a batch can succeed while some of its requests return 429. See pattern 3 in [Unit 5](#four-request-patterns), and the batch test in Lab 1, step 5.
:::

## Unit 10: Summary

*3 minutes*

You learned which hosts a GCC tenant uses and why GCC is the worldwide service, how a script signs in without a secret and who consents to its permissions, how to find the least-privileged permission, and the four patterns that make a collector's results complete. In Lab 1 you saw the example client refuse an unknown cloud, an undeclared call and the wrong host, in Python and PowerShell.

**Evidence an ISSO keeps from this module:** for each collector, its cloud, its endpoint, its app registration, its credential type (never a secret) and the exact permissions with the admin-consent record; `graph-calls.json` and its tests in the repository, which tie every call to its permission; and the record that retired modules are gone. Those support AC-6, IA-5 and CA-7 as [Book 02, Appendix A](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#nist-sp-800-53-rev.-5-control-mapping) maps them; the agency's assessor decides whether a control is met. Before shipping a collector, work through the developer workbook's [Chapter 02 checklist](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md#checklist).

::: {.callout-tip}
## Continue the path
[Learning path](index.md#microsoft-automation-learning-path) · [Next: Module 2, Microsoft Entra ID through Microsoft Graph →](ms-automation-entra.md)
:::

## Status and review

**Draft.** Every claim was checked against Microsoft Learn and the ScubaGear baseline on October 25, 2026. The availability row for the federated-credential audience was added on November 1, 2026 and carries its own source. Inferences and design guidance are labeled. The example client is tested against fixtures only, and the Lab 1 commands were run on November 25, 2026; the output shown is what they printed. The [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/training/_verification/ms-automation-foundations.md) lists the November 1 additions.

To move this page to **In review**:
- a reviewer confirms the endpoint table;
- someone runs the example client against a GCC test tenant.

To move it to **Proved**: record a GCC run here. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 2: Microsoft Entra ID](ms-automation-entra.md), [Module 3: Intune](ms-automation-intune.md), [Module 4: Azure Arc](ms-automation-arc.md), the [Microsoft practice crosswalk](../reference/graph-practice-crosswalk.md), [Book 04 — Access & Privilege](../books/b04-access/index.md) and [Book 15 — Day-2 Operations](../books/b15-day2-operations/index.md).

[^m1-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments" (updated January 30, 2025), <https://learn.microsoft.com/en-us/graph/deployments>, accessed October 25, 2026.
[^m1-natcloud]: Microsoft Learn, "Microsoft Entra authentication & national clouds" (updated January 15, 2025), <https://learn.microsoft.com/en-us/entra/identity-platform/authentication-national-cloud>, accessed October 25, 2026.
[^m1-mgauth]: Microsoft Learn, "Use Microsoft Graph PowerShell authentication commands" (Get-MgEnvironment; updated July 10, 2025), <https://learn.microsoft.com/en-us/powershell/microsoftgraph/authentication-commands>, accessed October 25, 2026.
[^m1-authsvc]: Microsoft Learn, "Get access without a user" (updated August 29, 2025), <https://learn.microsoft.com/en-us/graph/auth-v2-service>, accessed October 25, 2026.
[^m1-azid]: Microsoft Learn, "Azure Identity client library for Python" (updated October 1, 2026), <https://learn.microsoft.com/en-us/python/api/overview/azure/identity-readme>, accessed October 25, 2026.
[^m1-authmethods]: Microsoft Learn, "List methods" (authentication methods; national cloud table; updated September 13, 2024), <https://learn.microsoft.com/en-us/graph/api/authentication-list-methods>, accessed October 25, 2026.
[^m1-mi]: Microsoft Learn, "Managed identities for Azure resources" (updated August 19, 2025), <https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview>, accessed October 25, 2026.
[^m1-arcmi]: Microsoft Learn, "Access Azure resources with managed identity on Azure Arc-enabled servers" (updated February 5, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication>, accessed October 25, 2026.
[^m1-wif]: Microsoft Learn, "Workload identity federation" (updated April 9, 2025), <https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation>, accessed October 25, 2026.
[^m1-fic]: Microsoft Learn, "Create a trust relationship between an app and an external identity provider" (updated December 13, 2024), <https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-create-trust>, accessed October 25, 2026.
[^m1-appinst]: Microsoft Learn, "Register a Microsoft Entra app and create a service principal" (updated May 26, 2025), <https://learn.microsoft.com/en-us/entra/identity-platform/howto-create-service-principal-portal>, accessed October 25, 2026.
[^m1-certcred]: Microsoft Learn, "Microsoft identity platform certificate credentials" (updated January 4, 2025), <https://learn.microsoft.com/en-us/entra/identity-platform/certificate-credentials>, accessed October 25, 2026.
[^m1-scuba]: CISA, ScubaGear Microsoft Entra ID baseline (`aad.md`, released with v2.0.0), policies MS.AAD.5.5v1 and MS.AAD.5.6v1, <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md>, accessed October 25, 2026.
[^m1-consent]: Microsoft Learn, "Grant tenant-wide admin consent to an application" (updated March 25, 2025), <https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent>, accessed October 25, 2026.
[^m1-perms]: Microsoft Learn, "Overview of Microsoft Graph permissions" (updated December 26, 2025), <https://learn.microsoft.com/en-us/graph/permissions-overview>, accessed October 25, 2026.
[^m1-best]: Microsoft Learn, "Best practices for working with Microsoft Graph" (updated November 7, 2024), <https://learn.microsoft.com/en-us/graph/best-practices-concept>, accessed October 25, 2026.
[^m1-findcmd]: Microsoft Learn, "Use Find-MgGraphCommand" (updated January 22, 2025), <https://learn.microsoft.com/en-us/powershell/microsoftgraph/find-mg-graph-command>, accessed October 25, 2026.
[^m1-findperm]: Microsoft Learn, "Use Find-MgGraphPermission" (updated January 22, 2025), <https://learn.microsoft.com/en-us/powershell/microsoftgraph/find-mg-graph-permission>, accessed October 25, 2026.
[^m1-userlist]: Microsoft Learn, "List users" (permissions, scenario permissions and page sizes; updated May 16, 2025), <https://learn.microsoft.com/en-us/graph/api/user-list>, accessed October 25, 2026.
[^m1-sdkinst]: Microsoft Learn, "Install a Microsoft Graph SDK" (updated November 7, 2024), <https://learn.microsoft.com/en-us/graph/sdks/sdk-installation>, accessed October 25, 2026.
[^m1-pypaging]: Microsoft Learn, "Page through a collection using the Microsoft Graph SDKs" (updated November 7, 2024), <https://learn.microsoft.com/en-us/graph/sdks/paging>, accessed October 25, 2026.
[^m1-aadps]: Microsoft Learn, "Azure AD PowerShell overview" (deprecation notice; updated April 25, 2024), <https://learn.microsoft.com/en-us/powershell/azure/active-directory/overview>, accessed October 25, 2026.
[^m1-mgmig]: Microsoft Learn, "Upgrade from Azure AD PowerShell to Microsoft Graph PowerShell" (updated October 28, 2024), <https://learn.microsoft.com/en-us/powershell/microsoftgraph/migration-steps>, accessed October 25, 2026.
[^m1-paging]: Microsoft Learn, "Paging Microsoft Graph data in your app" (updated April 2, 2025), <https://learn.microsoft.com/en-us/graph/paging>, accessed October 25, 2026.
[^m1-throttle]: Microsoft Learn, "Microsoft Graph throttling guidance" (updated January 14, 2025), <https://learn.microsoft.com/en-us/graph/throttling>, accessed October 25, 2026.
[^m1-limits]: Microsoft Learn, "Microsoft Graph service-specific throttling limits" (global limit, identity and access limits, request costs, `x-ms-throttle-priority`; updated January 14, 2025), <https://learn.microsoft.com/en-us/graph/throttling-limits>, accessed October 25, 2026.
[^m1-batch]: Microsoft Learn, "Combine multiple HTTP requests using JSON batching" (updated February 21, 2025), <https://learn.microsoft.com/en-us/graph/json-batching>, accessed October 25, 2026.
[^m1-delta]: Microsoft Learn, "Use delta query to track changes in Microsoft Graph data" (updated January 15, 2025), <https://learn.microsoft.com/en-us/graph/delta-query-overview>, accessed October 25, 2026.
[^m1-advq]: Microsoft Learn, "Advanced query capabilities on Microsoft Entra ID objects" (updated August 29, 2025), <https://learn.microsoft.com/en-us/graph/aad-advanced-queries>, accessed October 25, 2026.
[^m1-ficaud]: Microsoft Learn, "Configure an application to trust a managed identity" (audience value for the global service), <https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-config-app-trust-managed-identity>, read November 1, 2026.
