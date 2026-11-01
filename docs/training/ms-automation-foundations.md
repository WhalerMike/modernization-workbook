---
title: "Microsoft Automation, Module 1: Graph and Azure Foundations"
subtitle: "An explainer: which cloud's endpoints to call, how a script signs in without a secret, which permissions it needs, and the four request patterns every Graph script has to get right"
description: "Research draft: the foundations for scripting Microsoft Entra ID, Intune, Azure Arc and the rest of the Microsoft cloud in federal tenants. It covers commercial, GCC, GCC High and DoD endpoints, app-only sign-in with managed identities, workload identity federation and certificates, Microsoft Graph permissions and consent, the Python and PowerShell tools (and the retired modules), and paging, batching, delta queries, advanced queries and throttling, with a tested example client."
research-status: draft
research-type: training module
research-book: "Books 02, 04, 05, 06, 10, 15"
date-modified: 2026-10-30
last-reviewed: 2026-10-25
aliases:
  - /docs/research/ms-automation-foundations.html
---

# Microsoft Automation, Module 1: Graph and Azure Foundations {.unnumbered}

The books keep asking for evidence a script collects and for changes a pipeline makes: Conditional Access exported as code ([Book 04, Chapter 10](../books/b04-access/10-access-as-code-and-evidence.md)), device compliance read back for the access decision ([Book 05, Chapter 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md)), and control evidence gathered on a schedule ([Book 15, Chapter 08](../books/b15-day2-operations/08-control-automation-m365-and-azure.md)). Almost all of it goes through Microsoft Graph, and the Azure parts go through Azure Resource Manager. This module covers what every such script has to get right before it does anything useful. The modules after it apply this to one product each.

| Module | Covers | Status |
|---|---|---|
| **1. Foundations** (this page) | Clouds and endpoints, sign-in, permissions, tools, request patterns | Draft |
| [2. Microsoft Entra ID](ms-automation-entra.md) | Users, groups, Conditional Access, PIM, applications, logs, authentication methods | Draft |
| [3. Intune](ms-automation-intune.md) | Devices, compliance, configuration, Autopilot | Draft |
| 4. Azure Arc and Azure Resource Manager | Resource Graph, Azure Policy, Update Manager, SQL Server | Planned |
| 5. Teams Phone and Teams administration | Calling, policies, the Teams PowerShell module | Planned |
| 6. Monitoring and evidence | Log Analytics and KQL, Defender, Sentinel | Planned |

**The example code:** [examples/ms-automation on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation). A Graph client written with only the standard library, `graphkit.py`, does everything this page describes: picking the cloud, refusing other hosts, paging, retrying on throttling, batching and delta queries. Modules 2 and 3 build their checks on it. Equivalent Python and PowerShell are included. Both are **illustrative: unit-tested against fixtures, not proven against live tenants**.

## The answer in brief

- **Pick the cloud first.** A Microsoft 365 GCC tenant uses the worldwide endpoints. GCC High and DoD use their own sign-in and Graph hosts, and an app has to be registered in the government tenant itself. One wrong host and the script fails, or sends a token where it shouldn't.
- **Sign in as a workload, without a secret.** Use a managed identity where the script runs in Azure or on an Arc-enabled server, workload identity federation for pipelines such as GitHub Actions, and a CA-issued certificate otherwise. ScubaGear recommends blocking application passwords altogether (MS.AAD.5.5v1).
- **Ask for the least-privileged application permissions** each API page lists, and have an administrator with the right role consent to them.
- **Use the current tools.** These are the Microsoft Graph PowerShell SDK, the Python `msgraph-sdk` with `azure-identity`, Az PowerShell and the Azure CLI. The AzureAD and MSOnline modules are retired.
- **Every Graph script needs the same four patterns:**
  - follow `@odata.nextLink`;
  - wait for `Retry-After` on 429;
  - put at most 20 requests in a batch;
  - keep the delta link to track changes.

## Clouds and endpoints

Microsoft Graph and Microsoft Entra ID run as separate *national cloud* deployments. A script has to call the sign-in and Graph hosts of the cloud its tenant lives in.[^m1-deploy][^m1-natcloud]

| Tenant | Sign-in (authority) | Microsoft Graph | Graph PowerShell `-Environment` | Az PowerShell / Azure CLI |
|---|---|---|---|---|
| Commercial | `https://login.microsoftonline.com` | `https://graph.microsoft.com` | `Global` | default |
| Microsoft 365 **GCC** | `https://login.microsoftonline.com` | `https://graph.microsoft.com` | `Global` | default |
| Microsoft 365 **GCC High** | `https://login.microsoftonline.us` | `https://graph.microsoft.us` | `USGov` | `-Environment AzureUSGovernment` / `az cloud set --name AzureUSGovernment` |
| Microsoft 365 **DoD** | `https://login.microsoftonline.us` | `https://dod-graph.microsoft.us` | `USGovDoD` | as GCC High |

Sources: Microsoft's Graph deployments page says a GCC environment should "continue using the worldwide endpoints".[^m1-deploy] The Graph PowerShell environment names come from `Get-MgEnvironment`.[^m1-mgauth] The Azure switches are Microsoft's Azure Government connection guides.[^m1-govps][^m1-govcli] The Azure column applies to the Azure subscriptions paired with a GCC High or DoD tenant. Module 4 covers Azure Resource Manager in detail.

What changes in a government cloud, beyond the hosts:

- **The scope names the cloud.** App-only tokens for GCC High use `https://graph.microsoft.us/.default`. Elsewhere it is `https://graph.microsoft.com/.default`, the form Microsoft's client-credentials guide uses.[^m1-sdknat][^m1-authsvc]
- **The Python credential needs the government authority.** `azure-identity` signs in to the public cloud unless it's given `authority=AzureAuthorityHosts.AZURE_GOVERNMENT`.[^m1-azid] The Graph SDK then needs the national-cloud host (`NationalClouds.US_GOV`).[^m1-sdknat]
- **Apps are registered per cloud.** "Apps can only access organizational data through the national cloud endpoints": an app registered in a commercial tenant can't read a GCC High tenant's data.[^m1-deploy]
- **Graph Explorer isn't supported** on the GCC High, DoD or China endpoints.[^m1-deploy] A query proved in Graph Explorer has to be retested against the government endpoint *(design guidance)*.
- **Each API page lists the clouds it works in.** Every Graph API reference page has a national-cloud table. Most Entra APIs in Module 2 are available in the global service, US Government L4 and L5. Some, such as listing a user's authentication methods, aren't available in the China cloud.[^m1-authmethods] Check the table before relying on an API in a new cloud.

GCC uses the worldwide endpoints, but some features available in commercial tenants aren't available in GCC. That's a feature question, not an endpoint question; [Book 10, Chapter 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md) covers it.

## Signing in as a workload

A scheduled script signs in as itself, not as a person: an **app registration** in Entra ID and its **service principal** in the tenant, with *application* permissions, using the OAuth 2.0 client-credentials flow.[^m1-authsvc] The question that matters is what the app proves its identity with. In order of preference *(design guidance, from the sources cited)*:

| Credential | Use it when | Notes |
|---|---|---|
| **Managed identity** | The script runs on an Azure resource, or on an Azure Arc-enabled server | No credential to store or rotate, at no extra cost. A system-assigned identity's service principal is created and deleted with the resource.[^m1-mi] Arc-enabled servers have one too.[^m1-arcmi] |
| **Workload identity federation** | The script runs in GitHub Actions, Kubernetes, or another platform that issues its own tokens | The app trusts the external platform's tokens, so no secret is stored.[^m1-wif][^m1-fic] |
| **Certificate** | Anywhere else, such as an on-premises scheduler | Microsoft recommends "a trusted certificate issued by a certificate authority" over an application secret.[^m1-appinst] The app signs a JWT assertion with it.[^m1-certcred] The certificate's lifecycle belongs to the program's certificate manager ([Book 07](../books/b07-pki/index.md)). |
| Client secret | Avoid | ScubaGear: application password addition *should* be blocked (MS.AAD.5.5v1), and lifetimes kept to 180 days (MS.AAD.5.6v1).[^m1-scuba] |

**Consent.** Application permissions take effect only after tenant-wide admin consent. Microsoft Graph application permissions need a **Privileged Role Administrator**. Cloud Application Administrator and Application Administrator can consent to anything *except* Microsoft Graph app roles.[^m1-consent] Plan for that approval step in the change process: it's the moment someone with privilege decides what the script may read.

## Permissions

Graph has two kinds of permission. **Delegated** permissions act for a signed-in user and are limited by what that user can do. **Application** permissions act as the app, across the tenant.[^m1-perms] Every API reference page lists the permissions in order from least to most privileged. Ask for the least-privileged one that does the job.[^m1-perms][^m1-best] Two helpers in Graph PowerShell find them:

- `Find-MgGraphCommand -Uri '/users/{id}'` lists the cmdlets for an API path and their permissions.[^m1-findcmd]
- `Find-MgGraphPermission` searches permission names and shows their descriptions.[^m1-findperm]

**Reading with a narrow permission.** When a script lists members or other directory objects with a narrow permission, Graph still returns the objects it can't fully read, but with only `id` and `@odata.type` filled in.[^m1-perms] Treat a null property as possibly "not permitted", not "empty".

**Where a narrower permission exists, use it.** For example, `User.EnableDisableAccount.All` plus `User.Read.All` is the least-privileged combination for enabling and disabling accounts; `User.ReadWrite.All` isn't needed.[^m1-userlist] Module 2 lists the least-privileged permission for every task it covers.

## Tools

| Tool | Install | Use it for |
|---|---|---|
| Microsoft Graph PowerShell SDK | `Install-Module Microsoft.Graph`[^m1-sdkinst] | Interactive and scheduled administration; `Invoke-MgGraphRequest` for any endpoint |
| Microsoft Graph Python SDK | `pip install msgraph-sdk`[^m1-sdkinst] | Services and pipelines; `PageIterator` follows pages for you[^m1-pypaging] |
| `azure-identity` (Python) | `pip install azure-identity` | Managed identity, certificate and federated credentials, for Graph and Azure alike[^m1-azid] |
| Az PowerShell, Azure CLI | (Module 4) | Azure Resource Manager: subscriptions, Arc, Policy |
| AzureAD, AzureAD Preview, MSOnline | **Don't** | Deprecated on March 30, 2024; Microsoft said they would work only until March 30, 2025, and recommends migrating to Microsoft Graph PowerShell[^m1-aadps][^m1-mgmig] |

The example client calls the REST API directly with the standard library. That isn't a recommendation against the SDKs, which handle paging and retries for you. It keeps every request visible, so the patterns below can be read and tested line by line *(design guidance)*.

## Four request patterns

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

## What this means for the books

- **Every evidence script states its cloud and its permissions.** Book 15's control automation should record the endpoint and the exact permissions for each collector, so a GCC High move ([Book 10](../books/b10-cloud-boundary/index.md)) is a configuration change, not a rewrite *(design guidance)*.
- **No collector uses a client secret.** That puts Book 04's application-credential rules (MS.AAD.5.5v1 to 5.7v1) into practice for the program's own automation.
- **A collector that pages, retries and keeps delta links** produces complete evidence at a predictable cost. One that doesn't produces evidence that looks complete.

## Status and review

**Draft.** Every claim was checked against Microsoft Learn and the ScubaGear baseline on October 25, 2026. Inferences and design guidance are labeled. The example client is tested against fixtures only.

To move this page to **In review**:
- a reviewer confirms the endpoint table;
- someone runs the example client against a test tenant in each cloud the program uses.

To move it to **Proved**: record a GCC run and, if the program has one, a GCC High run here. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 2: Microsoft Entra ID](ms-automation-entra.md), [Module 3: Intune](ms-automation-intune.md), the [Microsoft practice crosswalk](../reference/graph-practice-crosswalk.md), [Book 04 — Access & Privilege](../books/b04-access/index.md) and [Book 15 — Day-2 Operations](../books/b15-day2-operations/index.md).

[^m1-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments" (updated January 30, 2025), <https://learn.microsoft.com/en-us/graph/deployments>, accessed October 25, 2026.
[^m1-natcloud]: Microsoft Learn, "Microsoft Entra authentication & national clouds" (updated January 15, 2025), <https://learn.microsoft.com/en-us/entra/identity-platform/authentication-national-cloud>, accessed October 25, 2026.
[^m1-mgauth]: Microsoft Learn, "Use Microsoft Graph PowerShell authentication commands" (Get-MgEnvironment; updated July 10, 2025), <https://learn.microsoft.com/en-us/powershell/microsoftgraph/authentication-commands>, accessed October 25, 2026.
[^m1-govps]: Microsoft Learn, "Connect to Azure Government with PowerShell" (updated January 18, 2023), <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-get-started-connect-with-ps>, accessed October 25, 2026.
[^m1-govcli]: Microsoft Learn, "Connect to Azure Government with Azure CLI" (updated March 9, 2021), <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-get-started-connect-with-cli>, accessed October 25, 2026.
[^m1-sdknat]: Microsoft Learn, "Access national cloud deployments with the Microsoft Graph SDKs" (updated November 7, 2024), <https://learn.microsoft.com/en-us/graph/sdks/national-clouds>, accessed October 25, 2026.
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
