---
title: "Module 2: Running the assessment safely"
description: "Guide Steps 2 to 5: a clean host with the pinned version and a protected report folder; consent once, with the sources' different role lists side by side, then a dedicated reader account; reviewing the delegated grant consent leaves behind; connecting in Commercial, GCC, GCC High and DoD with the parameters from the tool's source; running it and hashing the export before anyone opens it. Lab 2 runs the real tool in your test tenant. About 35 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 11"
series-order: 2
review-status: pending
last-reviewed: 2026-11-11
---
# Module 2: Running the assessment safely {.unnumbered}

*Part of the [Zero Trust Assessment learning path](index.md). Guide [Steps 2 to 5](../../books/guides/zero-trust-assessment-implementation.md#zta-step-2). About 35 minutes, plus Lab 2.*

## Introduction (3 minutes)

The assessment is read-only, but running it takes more privilege than that suggests, and its output is a map of where the tenant is weak. Microsoft says to share the report and export folder only with authorized personnel, store the report securely and delete the local folder once the assessment is complete. In this module you prepare a host, consent once, run as a reader, connect in the tenant's own cloud, and hash the output before anyone opens it.

**The federal requirement.** The full tables are in the guide's Steps 2 to 5.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-6: the host's pinned versions | KSI-SVC-ACM, KSI-MLA-EVC | Module and PowerShell versions for each run |
| AC-6: read roles only, activated just in time; consent separate from the run | KSI-IAM-ELP, KSI-IAM-JIT | Role assignments, PIM activations, the grant review |
| CA-2 and CA-7: the assessment run, in the tenant's own cloud | KSI-PIY-RIS, KSI-MLA-EVC | The connection context; the export's SHA-256 |
| AU-9: output protected from modification | KSI-MLA-OSM | Hashes taken before anyone opened the files |

## Learning objectives (1 minute)

After this module, you'll be able to:

- prepare a clean host with PowerShell 7.6 and the pinned module, and a restricted report folder;
- explain who consents, who runs, and why the two sources' role lists differ;
- review the delegated grant the consent left behind, and say when not to revoke it;
- connect in Commercial, GCC, GCC High or DoD, and confirm the session's tenant and cloud;
- run the assessment and hash its export.

## Prerequisites (1 minute)

- [Module 1](01-evidence-not-a-verdict.md).
- The [Privileged Access implementation guide](../../books/guides/privileged-access-implementation.md)'s PIM model, for the run account's eligible roles. Skim it.

## Unit 1: The host and the output (6 minutes)

Read the guide's [Step 2](../../books/guides/zero-trust-assessment-implementation.md#zta-step-2). Learn asks for PowerShell 7; release 3.1.0's guide asks for 7.6 or later, because its pinned Exchange module needs it, and recommends a dedicated, clean Windows virtual machine: SharePoint Online and Azure Information Protection checks are skipped on other platforms. Every run gets a new, empty folder that only the run account and the evidence custodians can read. Deleting the folder doesn't remove PowerShell's separate logging folder, which can also hold tenant data.

## Unit 2: Consent and roles (8 minutes)

Read the guide's [Step 3](../../books/guides/zero-trust-assessment-implementation.md#zta-step-3), and its table of the sources side by side. Learn's page says the first connection needs a Global Administrator and lists four roles for later runs, and the same page says a Global Reader is enough. The tool's 3.1.0 guide says a Cloud Application Administrator or Application Administrator can grant the delegated consent, that the module validates Global Reader for the Graph context, and that SharePoint tenant commands need SharePoint Administrator. Learn lists 21 Graph permissions; `Get-ZtGraphScope` in 3.1.0 prints 34. The program follows the tool's guide, because it describes the version being run.

Consent leaves a delegated permission grant on the application the tool signs in through, by default the Microsoft Graph PowerShell application that other scripts in the tenant share. Learn recommends a custom application for Microsoft Graph PowerShell when you need to isolate the consent it holds, and the tool accepts one with `-ClientId`. Review the grant after every version change; revoke a dedicated application's grant when the tool is retired, never the shared one without asking who else relies on it.

## Unit 3: Connecting in each cloud (6 minutes)

Read the guide's [Step 4](../../books/guides/zero-trust-assessment-implementation.md#zta-step-4) and its [availability table](../../books/guides/zero-trust-assessment-implementation.md#zta-gov-availability). Learn's Zero Trust Assessment pages don't mention government clouds; the tool's source does. GCC uses the worldwide endpoints and the default `Global` environment; GCC High uses `-Environment USGov` with `-ExchangeEnvironmentName O365USGovGCCHigh`; DoD uses `USGovDoD` with `O365USGovDoD`. Pass `-SharePointAdminUrl` in every cloud. In DoD, Learn and the tool give different Security & Compliance addresses: if the Data pillar's tests come back disconnected there, check that first.

## Unit 4: The run (4 minutes)

Read the guide's [Step 5](../../books/guides/zero-trust-assessment-implementation.md#zta-step-5). A large tenant can take more than 24 hours; Microsoft says not to stop it. `-DisableTelemetry` suppresses the one telemetry event, which carries the tenant ID; using it is the CISO's decision. Hash the export as soon as the run ends. If the run fails, capture a support package in the same session before closing it.

## Exercise: Lab 2, a test tenant {#zta-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Prepare the host
$PSVersionTable.PSVersion
Install-PSResource -Name ZeroTrustAssessment -Version 3.1.0 -Scope CurrentUser
New-Item -ItemType Directory -Path <report-folder>
icacls <report-folder> /inheritance:r /grant:r "${env:USERDOMAIN}\${env:USERNAME}:(OI)(CI)F" "BUILTIN\Administrators:(OI)(CI)F"

# Step 2: Consent once, as the consent administrator
Import-Module ZeroTrustAssessment
Get-ZtGraphScope
Connect-ZtAssessment -Tenant <tenant> -Service Graph

# Step 3: Review the grant
$clientId = (Get-MgContext).ClientId
Connect-MgGraph -Scopes Application.Read.All, DelegatedPermissionGrant.Read.All
$sp = Get-MgServicePrincipal -Filter "appId eq '$clientId'"
Get-MgOauth2PermissionGrant -Filter "clientId eq '$($sp.Id)'" | Format-List Id, ConsentType, PrincipalId, Scope
Disconnect-MgGraph

# Step 4: Connect as the reader
Connect-ZtAssessment -Tenant <tenant> -Environment Global -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>
Get-MgContext | Format-List TenantId, Environment, Account

# Step 5: Run it and hash the export
Invoke-ZtAssessment -Path <report-folder> -DisableTelemetry -NoBrowser
Get-FileHash -Algorithm SHA256 -LiteralPath <report-folder>\zt-export\ZeroTrustAssessmentReport.json

# Step 6: Back it out
Disconnect-ZtAssessment
Connect-MgGraph -Scopes DelegatedPermissionGrant.ReadWrite.All
Remove-MgOauth2PermissionGrant -OAuth2PermissionGrantId <grant-id>
Remove-Item -Recurse -Force <report-folder>
```

:::

<!-- labs:end -->

You run the real Zero Trust Assessment in a test tenant, as a reader, after a consent administrator consents once.

- **You need:** a test tenant in the cloud you'll assess, with fictional users; a consent administrator (Cloud Application Administrator, or as your tenant requires); a reader account with Global Reader, Security Reader and SharePoint Administrator, eligible through PIM; a Windows host with PowerShell 7.6 or later and the Visual C++ Redistributable (x64); for the Infrastructure pillar, Reader on a test subscription tagged as the guide's [Step 1](../../books/guides/zero-trust-assessment-implementation.md#zta-step-1) shows.
- **You'll replace:** `<tenant>` (the test tenant's initial domain), `<report-folder>` (a new folder, for example `D:\Assessments\ZTA\lab`), `<spo-admin-url>` (the tenant's SharePoint admin URL), `<upn>` (the reader account) and `<grant-id>` (from step 3's output). For GCC High or DoD, use the connection commands of the guide's [Step 4](../../books/guides/zero-trust-assessment-implementation.md#zta-step-4) instead of step 4's.

1. **Prepare the host.** In a fresh PowerShell 7 session:

    ```powershell
    $PSVersionTable.PSVersion
    Install-PSResource -Name ZeroTrustAssessment -Version 3.1.0 -Scope CurrentUser
    New-Item -ItemType Directory -Path <report-folder>
    icacls <report-folder> /inheritance:r /grant:r "${env:USERDOMAIN}\${env:USERNAME}:(OI)(CI)F" "BUILTIN\Administrators:(OI)(CI)F"
    ```

2. **Consent once, as the consent administrator.** Accept the prompt for the permissions `Get-ZtGraphScope` prints.

    ```powershell
    Import-Module ZeroTrustAssessment
    Get-ZtGraphScope
    Connect-ZtAssessment -Tenant <tenant> -Service Graph
    ```

3. **Review the grant** while still signed in as the consent administrator:

    ```powershell
    $clientId = (Get-MgContext).ClientId
    Connect-MgGraph -Scopes Application.Read.All, DelegatedPermissionGrant.Read.All
    $sp = Get-MgServicePrincipal -Filter "appId eq '$clientId'"
    Get-MgOauth2PermissionGrant -Filter "clientId eq '$($sp.Id)'" | Format-List Id, ConsentType, PrincipalId, Scope
    Disconnect-MgGraph
    ```

    `Scope` lists every permission the tool's application holds in the tenant. Compare it with `Get-ZtGraphScope`'s list.

4. **Connect as the reader**, after activating the reader's roles in PIM, in a new PowerShell 7 session:

    ```powershell
    Connect-ZtAssessment -Tenant <tenant> -Environment Global -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>
    Get-MgContext | Format-List TenantId, Environment, Account
    ```

5. **Run it and hash the export.**

    ```powershell
    Invoke-ZtAssessment -Path <report-folder> -DisableTelemetry -NoBrowser
    Get-FileHash -Algorithm SHA256 -LiteralPath <report-folder>\zt-export\ZeroTrustAssessmentReport.json
    ```

    Keep `<report-folder>`: Modules 3 and 4 read it.

6. **Back it out** when you finish the path. Disconnect, and remove the reader's role assignments in the test tenant. If you consented on a dedicated application, remove its grant as a Cloud Application Administrator with the ID from step 3; don't revoke the shared Microsoft Graph PowerShell grant if anything else in the tenant uses it. Then delete the report folder.

    ```powershell
    Disconnect-ZtAssessment
    Connect-MgGraph -Scopes DelegatedPermissionGrant.ReadWrite.All
    Remove-MgOauth2PermissionGrant -OAuth2PermissionGrantId <grant-id>
    Remove-Item -Recurse -Force <report-folder>
    ```

## Knowledge check (5 minutes)

1. Learn's page lists 21 Graph permissions; `Get-ZtGraphScope` in 3.1.0 prints 34. Which list does the consent review compare against?
    a. Learn's, because Learn is the primary source.
    b. `Get-ZtGraphScope`'s, because it is what the version you're running requests.
    c. Neither; consent is all or nothing.

2. Why does the program use a dedicated application for the assessment's consent?
    a. The default application doesn't work in GCC.
    b. The default Microsoft Graph PowerShell application is shared, so every script that uses it inherits the consent; Learn recommends a custom application to isolate it.
    c. A dedicated application removes the need for a reader role.

3. A GCC tenant connects with which `-Environment` value?
    a. `Global`, because GCC uses the worldwide Graph and Azure endpoints.
    b. `USGov`.
    c. `USGovDoD`.

4. When do you hash the export?
    a. When the assessor asks for it.
    b. As soon as the run ends, before anyone opens or copies the files.
    c. Only if the run failed.

5. Which role does the run account need for the SharePoint tenant commands, according to both sources?
    a. Global Reader alone.
    b. SharePoint Administrator.
    c. Global Administrator.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 2 and the guide's [Step 3](../../books/guides/zero-trust-assessment-implementation.md#zta-step-3).
2. **b.** See Unit 2.
3. **a.** See Unit 3 and the [availability table](../../books/guides/zero-trust-assessment-implementation.md#zta-gov-availability).
4. **b.** See Unit 4 and the guide's [Step 5](../../books/guides/zero-trust-assessment-implementation.md#zta-step-5).
5. **b.** Global Reader alone can't run the SharePoint tenant commands. See Unit 2.
:::

## Summary (2 minutes)

You prepared a host, consented once and reviewed the grant, connected in the tenant's own cloud, ran the assessment as a reader and hashed its export. **Evidence an ISSO keeps from this module:** the module and PowerShell versions, the grant review, the reader's role assignments and PIM activations, the connection context, and the export's SHA-256.

::: {.callout-tip}
## Continue the path
[← Previous: Module 1](01-evidence-not-a-verdict.md) · [Learning path](index.md) · [Next: Module 3, From results to a closure register →](03-from-results-to-a-closure-register.md)
:::
