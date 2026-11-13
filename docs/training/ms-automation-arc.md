---
title: "Microsoft Automation, Module 4: Azure Arc through Azure Resource Manager and Resource Graph"
subtitle: "Learn how Azure Resource Manager differs from Graph, how to page Resource Graph without losing rows, and what the Arc machine, extension, SQL Server and policy records hold, then run five Reader-only checks mapped to NIST SP 800-53 Moderate on fixtures and in your test subscription"
description: "Research draft: Module 4 of the Microsoft Automation learning path, for Books 05 and 06. You learn the Resource Manager host and token, why Azure RBAC replaces Graph's permission list, api-versions, Resource Graph's tables, paging with $skipToken and the truncated-result trap, throttling, the empty result that means no access, and the Arc machine, extension, SQL Server, policy assignment and policy state records. You check Windows Server and SQL Server support dates, including the Windows Server 2012 ESU end and the workbook's Windows Server 2019 minimum. Lab 1 runs five read-only checks, which complement the validation kit's VK-ARC checks, in Python and PowerShell against fixtures; Lab 2 runs them with the Reader role against your test subscription."
status: draft
research-status: draft
research-type: training module
research-book: "Books 05, 06"
series-order: 4
date-modified: 2026-11-11
review-status: pending
last-reviewed: 2026-11-11
---
# Microsoft Automation, Module 4: Azure Arc through Azure Resource Manager and Resource Graph {.unnumbered}

**Learning path:** [Microsoft Automation](index.md#microsoft-automation-learning-path) · Module 4 of 4 · 95 minutes · Code: [examples/ms-automation](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation) (`armkit.py`, `arc_tasks.py`, `FmwArm.psm1`) · Guide: [Arc track, Step 8](../books/guides/arc-track-implementation.md#step-8-operating-it)

**Watch:** the narrated deck for this module (about 16 minutes, captions): [▶ Watch](../presentations/watch.html?v=Training_MS_Automation_Module_4_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_MS_Automation_Module_4_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-ms-automation-module-4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-4/Training_MS_Automation_Module_4_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-4/Training_MS_Automation_Module_4_Narrated.vtt). The deck files join the next edition.

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

[Book 05, Chapter 09](../books/b05-devices/09-servers-under-azure-arc.md) puts the agency's servers under Azure Arc, and [Book 06](../books/b06-data-platform/index.md) uses Arc to bring SQL Server under Entra ID. After onboarding, the question becomes evidence. Which servers lack the monitoring and endpoint protection agents? Which still reach Azure over the public internet? Which run an operating system or SQL Server version past the end of support? Is each SQL Server instance's host still connected? Which policy assignments are failing, and which aren't enforcing anything?

None of that is in Microsoft Graph. Arc servers, their extensions, SQL Server instances and Azure Policy are Azure resources, managed through **Azure Resource Manager** (Resource Manager, or ARM) and read in bulk through **Azure Resource Graph**. In this module you learn what changes when a script leaves Graph for Resource Manager, and how to read Resource Graph without silently losing rows. Five of Book 05's and Book 06's questions are built as tested, read-only checks in Python and PowerShell, which you run in the labs. They're **illustrative: unit-tested against fixtures, not proven against live subscriptions**.

**How this relates to the validation kit.** The [validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) already has seven Arc-track checks, VK-ARC-01 to VK-ARC-07, also on Resource Graph:

- required tags (VK-ARC-01);
- agent status and version (VK-ARC-02);
- baseline policy compliance per server (VK-ARC-03);
- CMDB servers not under Arc (VK-ARC-04);
- Update Manager scoping and patch assessment (VK-ARC-05);
- role assignments on Arc scopes (VK-ARC-06);
- two tools on one setting (VK-ARC-07).

This module doesn't repeat them. Its checks read other records: extension health, the network path, product lifecycle, SQL Server inventory, and policy assignments' enforcement and compliance across the subscription.

**The federal requirement.** Each check evidences NIST SP 800-53 Rev. 5 controls in the Moderate baseline:[^m4-nistmod]

- system monitoring and malicious code protection, through the agents (SI-4, SI-3), and audit record generation (AU-12);
- boundary protection, through the network path (SC-7);
- unsupported system components and flaw remediation (SA-22, SI-2);
- the component inventory (CM-8, CM-8(1));
- continuous monitoring and configuration settings (CA-7, CM-6, CM-2).

[Unit 7](#the-five-checks) maps each check to its controls. What an assessor reads for the server estate is in [Book 05, Chapter 09](../books/b05-devices/09-servers-under-azure-arc.md#the-day-one-baseline) and the Arc track guide's [evidence step](../books/guides/arc-track-implementation.md#evidence).

**The workbook's server standard.** The workbook plans on Windows Server 2016 being gone from production by its January 12, 2027 end of support, with Windows Server 2019 as the minimum ([Book 00, Chapter 01](../books/b00-orientation/01-why-modernize-now.md#the-workbooks-server-standard)). That is the program's planning assumption, not a federal requirement and not a count of where agencies stand. Any 2016 server that remains is an exception, with Extended Security Updates through Azure Arc, a signed risk acceptance and a retirement date. The `lifecycle` check is how you find those exceptions, and the ones on older versions, before the date.

### Learning objectives

In this module, you'll:

- Explain the four ways Resource Manager differs from Graph for a script: host, token, Azure RBAC and api-versions.
- Page a Resource Graph query to the end, and say when Resource Graph can't page and why that must stop the run.
- Explain why an empty Resource Graph result can mean no access, not a clean estate.
- Read the Arc machine, extension, SQL Server instance, policy assignment and policy state records, and the traps in each.
- Say which Windows Server and SQL Server versions are past support on November 3, 2026, the date the lab fixtures are evaluated at, what ESUs do and don't cover, and how the workbook's Windows Server 2019 minimum turns a 2016 server into an exception.
- Run the five checks on fixtures in Python and PowerShell, and read each finding against its control.

### Prerequisites

- [Module 1](ms-automation-foundations.md): the right cloud's endpoints, app-only sign-in without a secret, paging and throttling. This module applies them to Resource Manager.
- For Lab 1: the [lab tools](index.md#what-you-need-for-the-microsoft-automation-labs). No subscription until Lab 2.

## Unit 2: Resource Manager isn't Graph

*10 minutes*

A script that already calls Graph correctly has four things to change for Resource Manager.

**1. Another host, and another token.** Resource Manager is `https://management.azure.com` in commercial Azure.[^m4-govcompare] A Microsoft 365 GCC tenant's Azure subscriptions are commercial Azure, so a GCC script calls `management.azure.com` ([Module 1](ms-automation-foundations.md)). A token is issued for one resource: ask for `https://management.azure.com/.default`, not the Graph scope. A Graph token can't call Resource Manager *(design guidance, following Module 1's one-token-per-resource rule)*.

**2. Azure RBAC, not a permission list on the token.** A Graph app-only token carries its application permissions in its `roles` claim, and Module 2's client checks them before a run. A Resource Manager token carries no such list: Azure role-based access control (Azure RBAC) decides at each call, from the roles assigned to the identity at the subscription, resource group or management group. Every call in this module needs only the built-in **Reader** role, whose only action is `*/read`.[^m4-reader] That's why the client can't check permissions before a run. Lab 2 has you assign Reader and nothing else.

**3. An api-version on every call.** Resource Manager has no v1.0 or beta. Each resource provider versions its own API, and every request names the version as a query parameter. Listing subscriptions is `api-version=2022-12-01`,[^m4-sublist] Resource Graph is `2024-04-01`,[^m4-argrest] and the Arc machine API is `2026-09-01`.[^m4-hcmachine] `arm-calls.json` records the version for each call the tasks make. As with Graph, the client refuses a call that isn't listed.

**4. Different paging.** A Resource Manager list returns `nextLink`, not `@odata.nextLink`.[^m4-sublist] Resource Graph pages differently again: see [Unit 3](#unit-3-resource-graph).

| Question | Call | Azure RBAC action | api-version |
|---|---|---|---|
| Which subscriptions can this identity see? | `GET /subscriptions` | None checked: the list holds the subscriptions where the caller has any role[^m4-sublist] | `2022-12-01` |
| Query Arc machines, extensions, SQL Server instances, policy assignments and policy states | `POST /providers/Microsoft.ResourceGraph/resources` | `Microsoft.ResourceGraph/resources/read`[^m4-permgov] | `2024-04-01` |

Those two calls are all the five checks make. Resource Graph answers each question with one query over many subscriptions. Calling each resource provider instead, such as one `GET` per machine for its extensions, would cost a request per server.

**A POST that's a read.** Resource Graph queries are `POST`s because the query travels in the body, but they only read. Policy Insights' summarize call is a `POST` as well. Microsoft's permissions list names both `Microsoft.PolicyInsights/policyStates/summarize/action` and `.../summarize/read` for it.[^m4-permgov] Reader holds `*/read` but no `*/action`, so whether Reader alone can call summarize should be confirmed in your tenant *(unverified)*; [Lab 2](#unit-9-exercise-lab-2-your-test-subscription) makes that call once, as the Reader-only app, and records the answer. The `policy-summary` check avoids the question: it reads policy states through Resource Graph, which Reader covers.

## Unit 3: Resource Graph

*14 minutes*

Resource Graph holds a copy of the properties of every resource Resource Manager knows about, organized in tables that you query with the Kusto Query Language (KQL). This module's checks use two tables:[^m4-argtables]

- `resources`: Arc machines (`microsoft.hybridcompute/machines`), their extensions (`microsoft.hybridcompute/machines/extensions`) and SQL Server instances enabled by Arc (`microsoft.azurearcdata/sqlserverinstances`);
- `policyresources`: policy assignments (`microsoft.authorization/policyassignments`) and policy states (`microsoft.policyinsights/policystates`).

A request names the query and its scope, `subscriptions` or `managementGroups`, and `options`, including `$top`, `$skipToken` and `resultFormat`.[^m4-argrest]

### Four traps

**An empty result can mean no access.** "No results are returned if you don't have at least read permissions to the Azure object or object group."[^m4-argov] A query run by an identity that lacks Reader on a subscription returns nothing for that subscription, without an error. A check that reads "zero servers without the agent" might mean zero servers it was allowed to see. So:

- every check reports `machinesInScope` and `emptyScope`;
- the client refuses a query with no scope at all;
- the command line stops when the identity can see no subscriptions.

**Paging is a token in the body.** By default a query returns at most 1,000 records, and `$top` can't be more than 1,000.[^m4-argpaging][^m4-argrest] When there's more, the response carries `$skipToken`. You repeat the same query, with the same scopes, with the token in `options`, until there's no token.[^m4-argrest]

**Some queries can't be paged at all.** The response says `resultTruncated` when it holds less than the full result. Resource Graph can't page, and so returns no `$skipToken`, when:[^m4-argpaging]

- the query uses `limit`, `sample` or `take`;
- all its output columns are dynamic or null.

That second case is easy to hit: `project properties` returns a single dynamic column. Every query in this module projects `id` as a string and uses none of those operators, and the client raises `IncompleteResult` rather than return part of a result. Lab 1 shows it.

**Sort by a unique column.** Microsoft's pagination guidance adds two more ways to lose rows. Records that share a sort value have no guaranteed order, so pages sorted on a non-unique column can repeat some records and skip others; the fix is to include a unique column such as `id` in the sort. And resources created or deleted between page requests can still shift the pages, even with a unique sort.[^m4-argpagelimits] So every query here ends with `order by id asc` (or, for the policy-state summary, `order by assignmentId asc`), and a test fails in each language if one doesn't. For an estate that changes during a run, Learn's own alternatives are to partition the query by `hash(tolower(id))` or to fetch the IDs first and then the records in batches; the checks don't do that, so treat a run as a snapshot and rerun it if the counts look wrong *(design guidance)*.

**Data isn't strongly consistent.** Resource Manager notifies Resource Graph of each change, and Resource Graph also runs regular full scans. Even so, Microsoft says its data "isn't strongly consistent" and is "indexed with a short latency".[^m4-argov] Policy compliance has its own timing: assignments are reevaluated automatically once every 24 hours.[^m4-polcompliance] A check run minutes after a change may not see it.

### Throttling

Resource Graph sets a quota per user over a time window. For example, Microsoft says a user "can send at most 15 queries within every 5-second window". Each response carries `x-ms-user-quota-remaining` and `x-ms-user-quota-resets-after` (`hh:mm:ss`). An identity that can see more than 10,000 subscriptions gets results from the first 10,000 only, with `x-ms-tenant-subscription-limit-hit` set.[^m4-argthrottle]

Resource Manager's own limits use a token bucket per region.[^m4-armthrottle] Subscription reads have a bucket of 250 that refills at 25 per second, per subscription, per service principal and per operation type, with a global limit 15 times that across all service principals. Writes and deletes have a bucket of 200 that refills at 10 per second. A throttled call gets **429** with a `Retry-After` value in seconds, and remaining quota shows in headers such as `x-ms-ratelimit-remaining-subscription-reads`.[^m4-armthrottle]

The client waits for `Retry-After`. When Resource Graph throttles without one, it waits for `x-ms-user-quota-resets-after` instead. Each check makes one query per table plus one per extra page, so a few thousand servers cost a few dozen queries.

### The same queries in PowerShell

In Az PowerShell, `Search-AzGraph` runs a query with `-Subscription` or `-ManagementGroup`, `-First` (at most 1,000) and `-SkipToken`.[^m4-azps][^m4-argpaging] `Get-FmwArgRows` loops on the skip token in the same way. `Invoke-AzRestMethod` sends any other Resource Manager call. It's documented as "to Azure resource management endpoint only", and it accepts any method, including writes,[^m4-azrest] so the module doesn't use it. A test fails if `FmwArm.psm1` ever calls an Az cmdlet that writes.

## Unit 4: Machines, extensions and SQL Server

*10 minutes*

### The Arc machine

The `microsoft.hybridcompute/machines` record has these properties that the checks read:[^m4-hcmachine]

- `status`: `Connected`, `Disconnected`, `Error` or `AwaitingConnection`;
- `osType` (`windows` or `linux`), `osName`, `osSku` ("the Operating System product SKU") and `osVersion`;
- `privateLinkScopeResourceId`: "the resource id of the private link scope this machine is assigned to, if any";
- `licenseProfile.esuProfile`: `esuEligibility` (`Eligible`, `Ineligible`, `Unknown`) and `licenseAssignmentState` (`Assigned`, `NotAssigned`).

Microsoft's own Resource Graph sample names the operating system as `osSku` when it's present and `osName` otherwise.[^m4-argarcsamples] The `lifecycle` check matches products the same way.

### Extensions

Each extension on an Arc machine is its own resource, `microsoft.hybridcompute/machines/extensions`. Its ID begins with the machine's ID, and Microsoft's sample joins the two that way.[^m4-argarcsamples] Its properties include:[^m4-hcext]

- `publisher` and `type`, for example `Microsoft.Azure.Monitor` and `AzureMonitorWindowsAgent`;
- `typeHandlerVersion` and `provisioningState`;
- `settings` and `protectedSettings`.

**Never read the settings.** An extension's `settings` are "JSON formatted public settings", and Microsoft's own example is a command line.[^m4-hcext] A collector that projects `properties` or `properties.settings` would copy commands and configuration into the evidence. Every query here names the properties it needs, and a test fails if one reads settings.

The two extensions the check requires by default, per OS type:

- **Azure Monitor Agent**, for log and performance collection (AU-12, SI-4): publisher `Microsoft.Azure.Monitor`, type `AzureMonitorWindowsAgent` or `AzureMonitorLinuxAgent`.[^m4-amaov][^m4-extlist]
- **Microsoft Defender for Endpoint**, which Defender for Servers deploys (SI-3, SI-4): publisher `Microsoft.Azure.AzureDefenderForServers`, type `MDE.Windows` or `MDE.Linux`.[^m4-extlist] Microsoft's troubleshooting guide names an extension stuck in **Creating** or reporting **Provisioning failed** as a deployment problem to investigate before retrying.[^m4-mdetroubleshoot]

Change the required list to match your baseline. [Book 05](../books/b05-devices/09-servers-under-azure-arc.md#lock-down-what-the-agent-will-accept) also restricts which extensions the agent will accept at all.

### SQL Server enabled by Arc

A SQL Server instance discovered on an Arc machine becomes a `microsoft.azurearcdata/sqlServerInstances` resource. Its properties include:[^m4-sqltpl]

- `version`, such as `SQL Server 2016` (the documented values run from `SQL Server 2012` to `SQL Server 2022`, and `Unknown`);
- `edition`;
- `status`, the "cloud connectivity status": `Connected`, `Disconnected` or `Unknown`;
- `containerResourceId`, the Resource Manager ID of the Arc machine that hosts the instance;
- `licenseType`, `currentVersion` and `patchLevel`.

The `sql-inventory` check joins each instance to its host through `containerResourceId`. An instance whose host isn't in the result is either on a machine the identity can't read or left behind by a deleted machine. Either way it needs a look *(inference)*.

## Unit 5: Policy and lifecycle

*10 minutes*

### Policy assignments and states

A policy assignment's `enforcementMode` decides whether its effect applies:[^m4-polassign]

- `Default`: the effect is enforced when resources are created or updated.
- `DoNotEnforce`: the effect isn't enforced, but compliance is still evaluated and reported.
- `Enroll`: enforced only for resources enrolled in the assignment.

An assignment with no `enforcementMode` uses `Default`.[^m4-polassign] In `Enroll` mode, a scope that has no enrollment resource is evaluated as if the assignment used `DoNotEnforce`, by default;[^m4-polassign] `policy-summary` reports each assignment's mode, so read an `Enroll` assignment as enforcing only where scopes have enrolled *(inference)*. `DoNotEnforce` is the right way to stage a `deny` policy. But one left in that mode reports noncompliance while preventing nothing. `policy-summary` lists every assignment in that mode, so each has a dated decision behind it *(design guidance)*.

Policy states carry a `complianceState`, such as `NonCompliant`, `Compliant`, `Conflict` or `Exempt`, and the ID of the assignment that produced them.[^m4-argpolsamples] The check summarizes states by assignment in Resource Graph and joins them to the assignments. That puts each assignment's display name and enforcement mode beside its counts. States whose assignment isn't in the result usually come from an assignment above the subscription, at a management group *(inference)*. They're listed under `statesForUnknownAssignments`, not dropped.

### Product lifecycle

Running an operating system or database version past its end of support is NIST SP 800-53 SA-22's subject, "unsupported system components". The dates the `lifecycle` check uses come from Microsoft's lifecycle pages. They're recorded in `arc-lifecycle.json` exactly as listed, except where two Learn pages disagree, when the earlier date is used and the row's `esuNote` says so:[^m4-lifecycle][^m4-ws2012esu][^m4-arcesu][^m4-sqlesufaq]

| Product | Extended support ends | ESUs | State on November 3, 2026 (the labs' date) |
|---|---|---|---|
| Windows Server 2012 and 2012 R2 | October 10, 2023 | Ended October 13, 2026. Arc ESU licenses were deactivated at midnight UTC on October 14, 2026. | **Unsupported** |
| Windows Server 2016 | January 12, 2027 | Through Arc, "for up to three years, through 2030"; configurable in the Azure portal since August 3, 2026, with billing from January 13, 2027 | Ending within 180 days; under the workbook's server standard, an exception if it remains past January 12, 2027 |
| Windows Server 2019, 2022, 2025 | January 9, 2029; October 14, 2031; November 14, 2034 | — | Supported; 2019 is the workbook's minimum |
| SQL Server 2012 | July 12, 2022 | Ended July 8, 2025 | **Unsupported** |
| SQL Server 2014 | July 9, 2024 | Through July 8, 2027 (the ESU FAQ; the lifecycle page lists July 12, 2027, and the kit uses the earlier date) | ESU years |
| SQL Server 2016 | July 14, 2026 | Through July 17, 2029 | ESU years |
| SQL Server 2017, 2019, 2022 | October 12, 2027; January 8, 2030; January 11, 2033 | — | Supported |

: Support dates (Microsoft's lifecycle pages, checked November 3, 2026 and rechecked November 11, 2026). The table shows the last day of support; the JSON keeps the instant the page lists, at 06:59:59 UTC the next day. {.striped .hover}

An ESU subscription is a purchase, not a property of the product, so the check can say only what it can read:

- **Windows Server.** The machine's `licenseProfile.esuProfile.licenseAssignmentState` says whether an Arc ESU license is assigned. The check counts it only inside the ESU years. After October 13, 2026, a Windows Server 2012 machine is `unsupported` even with a license assigned, because no more updates come through any channel ([Book 05](../books/b05-devices/09-servers-under-azure-arc.md#extended-security-updates)).
- **SQL Server.** SQL Server instances enabled by Arc can subscribe to ESUs,[^m4-sqlesu] but the subscription isn't among the instance properties the query reads. An instance in its ESU years is `esuNotConfirmed` until someone confirms the subscription *(inference: the subscription may be readable from the Azure extension for SQL Server's settings, which the checks deliberately don't read)*.
- **Windows Server 2016 after January 12, 2027.** Microsoft gives no exact ESU end date, so the table marks ESUs as available with no end, and the check reports `esuNotConfirmed` or `esuCovered` from the license assignment. Under the workbook's server standard, either state is an exception: `esuCovered` shows the ESU half of it, and the signed risk acceptance and retirement date are records the check can't read.

A product that isn't in the table, such as a Linux distribution or an instance whose version is `Unknown`, is listed under `notInTable`, never counted as supported. Add a row for it from the vendor's lifecycle page *(design guidance)*.

## Unit 6: Where agencies are

*8 minutes*

**The starting state.** Book 05's agency is onboarding Windows and Linux servers to Arc in waves ([Arc track guide, Step 3](../books/guides/arc-track-implementation.md#step-3-onboarding-at-scale)). During the move, some servers are onboarded but missing an agent, some connect over the public endpoints before the private link scope is ready, and Arc makes end-of-support Windows Server and SQL Server versions visible. The workbook's planning assumption is that Windows Server 2016 is gone from production by January 12, 2027, with Windows Server 2019 the minimum, so any 2016 server Arc still shows after that date is an exception to handle, not the normal state ([Book 00, Chapter 01](../books/b00-orientation/01-why-modernize-now.md#the-workbooks-server-standard)).

**GCC.** A GCC-Moderate estate's subscriptions are in commercial Azure ([guide, 1.1](../books/guides/arc-track-implementation.md#choose-the-azure-cloud)), so its scripts call `management.azure.com` and the commercial sign-in endpoint. Use `--cloud gcc`, as in every module.

**Interim paths** *(design guidance)*:

- **Servers onboarded before the private link scope exists.** Record them as `arc-private-link` findings with a target date. Assign the policy that requires the scope in `DoNotEnforce` first, then enforce it, and `policy-summary` shows the change.
- **Windows Server 2012 servers still running.** Book 05 treats them as a red finding: migrate or upgrade them, or isolate them and record the risk acceptance. `lifecycle` lists them as `unsupported`.
- **Windows Server 2016.** Under the workbook's server standard, upgrade or replace each one before January 12, 2027, to Windows Server 2019 or later. A server that can't make the date becomes an exception: enrolled in ESUs through Arc before the date, with a signed risk acceptance and a retirement date in the same change ([Arc track guide, Step 3](../books/guides/arc-track-implementation.md#step-3-onboarding-at-scale), [Book 05](../books/b05-devices/09-servers-under-azure-arc.md#extended-security-updates)). `lifecycle` lists them now as ending soon, and after the date as `esuCovered` or `esuNotConfirmed`.
- **SQL Server 2014 and 2016 in their ESU years.** Record each instance's ESU subscription beside the `esuNotConfirmed` finding.

## Unit 7: The five checks {#the-five-checks}

*5 minutes*

Each check is read-only, needs only Reader, and is tied to the federal requirement it evidences. The mapping is the program's reading; the agency's assessor decides whether a control is satisfied. Every control named below is in the NIST SP 800-53 Rev. 5 Moderate baseline.[^m4-nistmod]

| Check | What it reports | Evidences | Complements |
|---|---|---|---|
| `arc-extensions` | Servers missing Azure Monitor Agent or Defender for Endpoint, and extensions not `Succeeded`, with their state and version | SI-4, SI-3, AU-12, CM-8 | VK-ARC-02 (agent status and version) |
| `arc-private-link` | Servers with no Azure Arc private link scope, and how many use each scope | SC-7 | Book 05's [network design](../books/b05-devices/09-servers-under-azure-arc.md#network) |
| `lifecycle` | Servers and SQL Server instances by support state: `unsupported`, `esuNotConfirmed`, `esuCovered`, `endingSoon` (within 180 days by default); products not in the table | SA-22, SI-2 | VK-ARC-05 (patch assessment) |
| `sql-inventory` | SQL Server instances by version and edition; instances disconnected, or whose host is disconnected or not in scope | CM-8, CM-8(1) | VK-ARC-04 (CMDB coverage) and Book 06's [Arc deployment](../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md) |
| `policy-summary` | Every assignment's enforcement mode and compliance counts; `DoNotEnforce` assignments; assignments with no states; states from assignments outside the scope | CA-7, CM-6, CM-2 | VK-ARC-03 (baseline compliance per server) |

The role for all five is Reader on the subscriptions or management group in scope. That's a reader's role: none of the five can change a resource. Every result that reads machines starts with `machinesInScope` and `emptyScope`.

Some notes on what the checks can and can't say:

- **Private link isn't the whole network path.** `privateLinkScopeResourceId` says the machine is assigned to a scope. Private Link also needs the private endpoint and DNS that send the agent's traffic over ExpressRoute or a site-to-site VPN instead of public networks.[^m4-arcpl] Confirm the path for a sample of servers *(inference)*.
- **Extension state isn't agent health.** `Succeeded` means the extension deployed, not that the agent reports. Confirm Defender for Endpoint onboarding in the Defender portal and Azure Monitor data in the workspace *(inference)*.
- **The OS is matched on text.** If your servers report an `osSku` the table doesn't name, they appear under `notInTable`.

## Unit 8: Exercise: Lab 1 (fixtures, no subscription)

*25 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/ms-automation`. Each step below says what it does and what to look for.

In a POSIX shell (Git Bash on Windows):

```bash
# Step 1
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z arc-extensions

# Step 2
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z arc-private-link

# Step 3
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle

# Step 4
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle --window-days 60

# Step 5
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z sql-inventory

# Step 6
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z policy-summary

# Step 7
python -c "import sys; sys.path.insert(0, 'python'); from armkit import ArmClient; ArmClient('gcc', lambda s: 't').resource_graph('resources | project id')"
```

In PowerShell 7:

```powershell
# Step 8
Import-Module ./powershell/FmwArm.psm1
$arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable -DateKind String
(Test-FmwArcLifecycle -Machines $arc.machines -SqlInstances $arc.sqlInstances -AsOf '2026-11-03T00:00:00Z').counts | ConvertTo-Json
(Test-FmwArcPrivateLink -Machines $arc.machines).findings.name
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 9
python -m pytest -q -p no:cacheprovider tests/python/test_arc_tasks.py
```

:::

<!-- labs:end -->

You run each check against the kit's fictional estate. It's one subscription holding:

- seven Arc servers (Windows Server 2012 R2 to 2025, and two Linux);
- five SQL Server instances;
- four policy assignments.

Work in `examples/ms-automation`. `--from-json` evaluates saved Resource Graph rows instead of calling Azure, and `--as-of` fixes the evaluation time so your output matches this page. Every result starts with the task's name and the controls it evidences.

1. Find servers missing an agent, or with an extension that didn't deploy.

   ```bash
   python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z arc-extensions
   ```

   Expected: `"machinesInScope": 7`, `"machinesWithFindings": 4`, `"missingRequired": 2` and `"extensionsNotSucceeded": 2`. `lnx-web-02` is missing both Linux extensions. `SRV-LEG-01`, which is also `Disconnected`, is missing `Microsoft.Azure.AzureDefenderForServers/MDE.Windows`. `SRV-APP-02`'s `MDE.Windows` is `Failed`, and `lnx-web-01`'s `MDE.Linux` is still `Creating`.

2. Find servers reaching Azure over public endpoints.

   ```bash
   python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z arc-private-link
   ```

   Expected: `"publicEndpoint": 3`, with `lnx-web-02`, `SRV-APP-02` and `SRV-LEG-01`. The other four use one scope, `pls-arc-east`.

3. Check support dates.

   ```bash
   python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle
   ```

   Expected counts:

   ```text
       "counts": {
         "unsupported": 2,
         "esuNotConfirmed": 2,
         "esuCovered": 0,
         "endingSoon": 1,
         "supported": 4
       },
   ```

   The findings, in order:
   - `SRV-LEG-01`, Windows Server 2012 R2: `unsupported`. Its ESU license is `Assigned`, but the ESU years ended on October 13, 2026.
   - `OLD-SQL-07_MSSQLSERVER`, SQL Server 2012: `unsupported`.
   - `SRV-DB-01_MSSQLSERVER`, SQL Server 2016, and `SRV-LEG-01_MSSQLSERVER`, SQL Server 2014: `esuNotConfirmed`.
   - `SRV-APP-02`, Windows Server 2016: `endingSoon`, with the date `2027-01-13T06:59:59Z`.

   `notInTable` lists the two Linux servers and `SRV-APP-01_SQLEXPRESS`, whose version is `Unknown`. `SRV-APP-02` is the case the workbook's server standard is about: a Windows Server 2016 server that has to be upgraded before January 12, 2027 or become a documented exception.

4. Check support dates with a 60-day window instead of the default 180.

   ```bash
   python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle --window-days 60
   ```

   Expected: `SRV-APP-02` drops out (its support ends in 71 days), so `"endingSoon": 0` and `"supported": 5`. The window decides how early a server shows up as a finding, not whether it's supported.

5. Inventory SQL Server.

   ```bash
   python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z sql-inventory
   ```

   Expected: `"instances": 5`, with `"byEdition"` of `Enterprise` 1, `Express` 1 and `Standard` 3, and two findings:
   - `OLD-SQL-07_MSSQLSERVER`: `"host not found among the Arc machines in scope"`;
   - `SRV-LEG-01_MSSQLSERVER`: `"instance status Disconnected"` and `"host status Disconnected"`.

6. Summarize policy.

   ```bash
   python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z policy-summary
   ```

   Expected:
   - `"notEnforced": ["Require Arc private link scope"]`;
   - `"withNonCompliant"` with `Arc server baseline` and `Require Arc private link scope`, each with 3 noncompliant of 7;
   - `"noStates": ["Tag taxonomy"]`;
   - one ID under `"statesForUnknownAssignments"`, from a management group's initiative.

   The private link assignment reports the same three servers as step 2, but its `DoNotEnforce` mode means it blocks nothing.

7. See why a query needs a scope. Ask the client for a Resource Graph query with none:

   ```bash
   python -c "import sys; sys.path.insert(0, 'python'); from armkit import ArmClient; ArmClient('gcc', lambda s: 't').resource_graph('resources | project id')"
   ```

   Expected: the run stops before any request, ending with:

   ```text
   ValueError: give the subscriptions or management groups to query; an empty scope can't be told from no access
   ```

8. Run two of the same checks in PowerShell. Start `pwsh` in `examples/ms-automation`, then:

   ```powershell
   Import-Module ./powershell/FmwArm.psm1
   $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable -DateKind String
   (Test-FmwArcLifecycle -Machines $arc.machines -SqlInstances $arc.sqlInstances -AsOf '2026-11-03T00:00:00Z').counts | ConvertTo-Json
   (Test-FmwArcPrivateLink -Machines $arc.machines).findings.name
   ```

   Expected: the same counts as step 3, then `lnx-web-02`, `SRV-APP-02` and `SRV-LEG-01` on three lines.

9. Run the Arc tests.

   ```bash
   python -m pytest -q -p no:cacheprovider tests/python/test_arc_tasks.py
   ```

   Expected: `24 passed`. Three of them prove the read-only and paging claims:
   - `test_calls_need_only_reader`: every declared call is a read;
   - `test_queries_page_safely_and_read_no_settings`: every query projects a string `id`, uses no `take` or `limit`, ends sorted by a unique column, and reads no settings;
   - `test_truncated_result_without_token_raises`: a truncated result stops the run.

**Check your work:** for each finding, you can name the Resource Graph table and property it came from, the control it evidences, and what the check can't see.

## Unit 9: Exercise: Lab 2 (your test subscription)

*Not timed. Not run by the authors.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/ms-automation`. Each step below says what it does and what to look for.

In a POSIX shell (Git Bash on Windows):

```bash
# Step 1: Sign in as yourself and select the test subscription
export MSYS_NO_PATHCONV=1
az login --tenant <tenant-id>
az account set --subscription <subscription-id>

# Step 2: Register one app
az ad sp create-for-rbac --name "fmw-arc-reader-lab-$(date +%Y%m%d%H%M%S)" --role Reader --scopes /subscriptions/<subscription-id> --create-cert

# Step 3: Copy the certificate into the lab folder, and confirm the app holds Reader and nothing else
cp "<pem-path>" app.pem
az role assignment list --assignee <app-id> --all --output table
```

In PowerShell 7:

```powershell
# Step 4: PowerShell only: put the certificate in your Windows certificate store
$pem = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPemFile("$PWD/app.pem")
$cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($pem.Export('Pkcs12'), [string]$null, 'UserKeySet,PersistKeySet')
$store = [System.Security.Cryptography.X509Certificates.X509Store]::new('My', 'CurrentUser'); $store.Open('ReadWrite'); $store.Add($cert); $store.Close()
$cert.Thumbprint
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 5: Run the checks
pip install azure-identity
mkdir -p out-arc
python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> arc-extensions | tee out-arc/arc-extensions.json
python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> arc-private-link | tee out-arc/arc-private-link.json
python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> lifecycle | tee out-arc/lifecycle.json
python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> sql-inventory | tee out-arc/sql-inventory.json
python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> policy-summary | tee out-arc/policy-summary.json
```

In PowerShell 7:

```powershell
# Step 5: Run the checks
Install-Module Az.Accounts, Az.ResourceGraph -Scope CurrentUser
Import-Module ./powershell/FmwArm.psm1
Connect-FmwAzure -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
Invoke-FmwArcTask -Task lifecycle -Subscription <subscription-id> | ConvertTo-Json -Depth 8
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 6: Record the open review items
az rest --method post --url "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2024-04-01" --body "{\"subscriptions\": [\"<subscription-id>\"], \"query\": \"resources | where type =~ 'microsoft.hybridcompute/machines' | project id = tolower(id), osName = tostring(properties.osName), osSku = tostring(properties.osSku) | order by id asc\"}"

# Step 6: Record the open review items
az login --service-principal --username <app-id> --certificate app.pem --tenant <tenant-id>
az rest --method post --url "https://management.azure.com/subscriptions/<subscription-id>/providers/Microsoft.PolicyInsights/policyStates/latest/summarize?api-version=2024-10-01"
az login --tenant <tenant-id>

# Step 8: Back it out
az role assignment delete --assignee <app-id> --role Reader --scope /subscriptions/<subscription-id>
az ad app delete --id <app-id>
rm -f app.pem "<pem-path>"
rm -rf out-arc
```

In PowerShell 7:

```powershell
# Step 8: Back it out
Remove-Item Cert:\CurrentUser\My\<thumbprint>
```

:::

<!-- labs:end -->

You run the checks read-only against a test subscription and compare them with the Azure portal.

- **You need:**
  - a test subscription in commercial Azure, never production, with a few Arc-enabled servers;
  - someone allowed to assign Azure roles on it, and to register an app in the tenant, signed in to the Azure CLI (`az`);
  - Python with the `azure-identity` package (step 5 installs it), or PowerShell 7.5 with `Az.Accounts` and `Az.ResourceGraph` on Windows (step 4 uses the Windows certificate store).
- **You'll replace:**
  - `<tenant-id>`: the tenant's ID;
  - `<subscription-id>`: the test subscription's ID;
  - `<app-id>`: the app's application (client) ID, the `appId` that step 2 prints;
  - `<pem-path>`: the `fileWithCertAndPrivateKey` path that step 2 prints;
  - `<thumbprint>`: the certificate's thumbprint, for PowerShell, which step 4 prints.

  `app.pem` is the PEM file with the certificate and its private key. Work in `examples/ms-automation`, in Git Bash on Windows or another POSIX shell for the `bash` blocks and in `pwsh` for the `powershell` blocks. Git Bash rewrites arguments that start with `/`, such as `/subscriptions/...`, into Windows paths; step 1 turns that off for the session, and it changes nothing in other shells.

1. **Sign in as yourself and select the test subscription.**

   ```bash
   export MSYS_NO_PATHCONV=1
   az login --tenant <tenant-id>
   az account set --subscription <subscription-id>
   ```

2. **Register one app** in the tenant, with a certificate credential and no secret ([Module 1](ms-automation-foundations.md#signing-in-as-a-workload)), **and assign it Reader on the test subscription, and nothing else.** One Azure CLI command does both: `--create-cert` makes a self-signed certificate and no password, and `--role Reader --scopes` assigns the role.[^m4-clisp] The name carries a timestamp because the command matches an existing app by display name and would change that app instead of creating one.[^m4-clisp] No Graph permission is needed. Never assign Contributor or Owner to this app: those can change every resource in scope.

   ```bash
   az ad sp create-for-rbac --name "fmw-arc-reader-lab-$(date +%Y%m%d%H%M%S)" --role Reader --scopes /subscriptions/<subscription-id> --create-cert
   ```

   Expected: JSON with `"appId"` (your `<app-id>`), `"password": null` and `"fileWithCertAndPrivateKey"` (your `<pem-path>`).

3. **Copy the certificate into the lab folder, and confirm the app holds Reader and nothing else.**

   ```bash
   cp "<pem-path>" app.pem
   az role assignment list --assignee <app-id> --all --output table
   ```

   Expected: one row, role `Reader`, scope `/subscriptions/<subscription-id>`.

4. **PowerShell only: put the certificate in your Windows certificate store.** `Connect-AzAccount` signs in with a certificate by its thumbprint in the store,[^m4-azpsauth] so these lines load `app.pem`, add it to `CurrentUser\My` with its private key, and print the thumbprint.

   ```powershell
   $pem = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPemFile("$PWD/app.pem")
   $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($pem.Export('Pkcs12'), [string]$null, 'UserKeySet,PersistKeySet')
   $store = [System.Security.Cryptography.X509Certificates.X509Store]::new('My', 'CurrentUser'); $store.Open('ReadWrite'); $store.Add($cert); $store.Close()
   $cert.Thumbprint
   ```

5. **Run the checks.** In Python, one command per task; `tee` shows each result and saves it under `out-arc`:

   ```bash
   pip install azure-identity
   mkdir -p out-arc
   python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> arc-extensions | tee out-arc/arc-extensions.json
   python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> arc-private-link | tee out-arc/arc-private-link.json
   python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> lifecycle | tee out-arc/lifecycle.json
   python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> sql-inventory | tee out-arc/sql-inventory.json
   python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> policy-summary | tee out-arc/policy-summary.json
   ```

   In PowerShell:

   ```powershell
   Install-Module Az.Accounts, Az.ResourceGraph -Scope CurrentUser
   Import-Module ./powershell/FmwArm.psm1
   Connect-FmwAzure -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
   Invoke-FmwArcTask -Task lifecycle -Subscription <subscription-id> | ConvertTo-Json -Depth 8
   ```

   If `machinesInScope` is 0 and you know the subscription has Arc servers, the role assignment hasn't taken effect yet, or it's on the wrong scope.

6. **Record the open review items** ([Status and review](#status-and-review)) with two reads. The first, as you, shows the raw Resource Graph response: what `osSku` your servers report, and whether `resultTruncated` comes back as a string (`"false"`) or a boolean (`false`).

   ```bash
   az rest --method post --url "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2024-04-01" --body "{\"subscriptions\": [\"<subscription-id>\"], \"query\": \"resources | where type =~ 'microsoft.hybridcompute/machines' | project id = tolower(id), osName = tostring(properties.osName), osSku = tostring(properties.osSku) | order by id asc\"}"
   ```

   The second signs in as the Reader-only app[^m4-clilogin] and calls Policy Insights' summarize for the subscription,[^m4-polsummarize] then signs you back in. A summary means Reader can call it; a 403 `AuthorizationFailed` naming `Microsoft.PolicyInsights/policyStates/summarize/action` means it can't. Record which.

   ```bash
   az login --service-principal --username <app-id> --certificate app.pem --tenant <tenant-id>
   az rest --method post --url "https://management.azure.com/subscriptions/<subscription-id>/providers/Microsoft.PolicyInsights/policyStates/latest/summarize?api-version=2024-10-01"
   az login --tenant <tenant-id>
   ```

7. **Compare** each result with the portal. In the Azure portal:
   1. Open **Azure Arc**, then **Machines**: compare the list, each machine's status and operating system with `machinesInScope`, `arc-private-link` and `lifecycle`.
   2. Open each machine with a finding, then **Extensions**: compare with `arc-extensions`.
   3. Open **Azure Arc**, then **SQL Server instances**: compare with `sql-inventory`.
   4. Open **Policy**, then **Compliance**: compare each assignment's counts and enforcement with `policy-summary`.

8. **Back it out.** Remove the role assignment, delete the app registration and its certificate, and delete the saved results: they hold server names and resource IDs. Deleting the app registration also deletes its service principal.

   ```bash
   az role assignment delete --assignee <app-id> --role Reader --scope /subscriptions/<subscription-id>
   az ad app delete --id <app-id>
   rm -f app.pem "<pem-path>"
   rm -rf out-arc
   ```

   If you did step 4, remove the certificate from your store:

   ```powershell
   Remove-Item Cert:\CurrentUser\My\<thumbprint>
   ```

## Unit 10: Knowledge check

*5 minutes*

1. A Resource Graph query returns no Arc servers. What's the first thing to check?
   a. Whether Resource Graph is available in the region.
   b. Whether the identity has Reader on the scope, because Resource Graph returns nothing for resources the caller can't read.
   c. Whether the query used `$top`.

2. Why does every query in this module project `id` as a string?
   a. Resource Graph can't page a result whose output columns are all dynamic or null.
   b. Resource Manager rejects queries without an `id`.
   c. To keep the output small.

3. A Windows Server 2012 R2 machine has an Arc ESU license `Assigned`. What does `lifecycle` report on November 3, 2026, and why?
   a. `esuCovered`, because the license is assigned.
   b. `unsupported`, because the ESU years ended on October 13, 2026, so no updates come through any channel.
   c. `endingSoon`.

4. Why doesn't the PowerShell module use `Invoke-AzRestMethod`?
   a. It isn't available in PowerShell 7.
   b. It can't page.
   c. It sends any method, including writes, and the module is read-only; a test fails if the module calls an Az cmdlet that writes.

5. Which role does the Lab 2 app need?
   a. Reader on the subscriptions in scope, and no Graph permission.
   b. Contributor, to read extensions.
   c. Reader plus `Directory.Read.All`.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Four traps](#four-traps), and Lab 1, step 7.
2. **a.** See [Four traps](#four-traps).
3. **b.** See [Product lifecycle](#product-lifecycle), and `SRV-LEG-01` in Lab 1, step 3.
4. **c.** See [The same queries in PowerShell](#the-same-queries-in-powershell).
5. **a.** See [Unit 2](#unit-2-resource-manager-isnt-graph), and Lab 2, step 2.
:::

## Unit 11: Summary

*3 minutes*

You learned what changes when a script leaves Graph for Resource Manager: another host and token, Azure RBAC instead of a permission list, api-versions, and `nextLink`. You paged Resource Graph without losing rows, and saw when it can't page and why an empty result can mean no access. You read the Arc machine, extension, SQL Server, policy assignment and policy state records, and checked support dates against Microsoft's lifecycle pages. In Lab 1 you ran the five checks on fixtures in Python and PowerShell and read each finding against its control.

**Evidence an ISSO keeps from this module:**
- each check's dated output, with its `evidences` list and `machinesInScope`;
- the app's Reader role assignment and its scope;
- the `lifecycle` findings, with the decision for each `unsupported` server (migrate, upgrade, or isolate and accept the risk) and the ESU subscription record for each `esuNotConfirmed` instance;
- for each Windows Server 2016 server still in production after January 12, 2027, the exception record the workbook's server standard asks for: ESU enrollment through Arc, a signed risk acceptance and a retirement date;
- the dated decision behind each `DoNotEnforce` assignment;
- the validation kit's VK-ARC results beside them.

The [Arc track guide's Step 8](../books/guides/arc-track-implementation.md#step-8-operating-it) puts this on a schedule, and [Gate 8](../books/guides/arc-track-implementation.md#validate-gate-8-standing) checks it.

::: {.callout-tip}
## You've finished the path
[Previous: Module 3](ms-automation-intune.md) · [Learning path](index.md#microsoft-automation-learning-path). Modules 5 and 6 are planned ([Module 1](ms-automation-foundations.md#unit-1-introduction) lists them).
:::

## Status and review

**Draft.** Every API, property, role, limit and date was checked against Microsoft Learn on November 3, 2026, and the NIST SP 800-53 Moderate baseline the same day. The lifecycle and ESU dates, Resource Graph paging and throttling, Resource Manager throttling, the Arc machine API version, policy enforcement modes and the Lab 2 commands were rechecked on November 11, 2026; that pass added the unique-sort rule, the `Enroll` note and the earlier SQL Server 2014 ESU end date. Inferences, design guidance and unverified points are labeled, and the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/training/_verification/ms-automation-arc.md) lists each claim with its source. The checks are tested against fixtures only. The Lab 1 commands were run on November 3, 2026, and again on November 11, 2026, and the output shown is what they printed.

To move this page to **In review**:
- a reviewer confirms the queries, the lifecycle dates and the control mapping;
- someone confirms whether Reader can call Policy Insights' summarize (`summarize/read` or `summarize/action`), with Lab 2, step 6;
- someone records what `osSku` real Arc servers report, and whether `resultTruncated` arrives as a string or a boolean, with the same step.

To move it to **Proved**: run the five checks against a test subscription and compare the results with the Azure portal's Arc, extension, SQL Server and Policy views. Record that comparison here. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 1: Foundations](ms-automation-foundations.md), [Module 3: Intune](ms-automation-intune.md), the [Microsoft practice crosswalk](../reference/graph-practice-crosswalk.md), [Book 05, Chapter 09](../books/b05-devices/09-servers-under-azure-arc.md), [Book 06](../books/b06-data-platform/index.md) and the [Arc track implementation guide](../books/guides/arc-track-implementation.md).

[^m4-nistmod]: NIST, SP 800-53 Rev. 5 Moderate baseline, OSCAL profile version 5.2.0 (includes AU-12, CA-7, CM-2, CM-6, CM-8, CM-8(1), SA-22, SC-7, SI-2, SI-3 and SI-4), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json>, accessed November 3, 2026.
[^m4-govcompare]: Microsoft Learn, "Compare Azure Government and global Azure" (Azure Resource Manager endpoints; updated August 21, 2025), <https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-reader]: Microsoft Learn, "Azure built-in roles for General" (Reader, `acdd72a7-3385-48ef-bd42-f606fba81ae7`, actions `*/read`; updated July 1, 2026), <https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/general>, accessed November 3, 2026.
[^m4-sublist]: Microsoft Learn, "Subscriptions - List" (Resource Management, 2022-12-01; updated October 23, 2026), <https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/list>, accessed November 3, 2026.
[^m4-argrest]: Microsoft Learn, "Resources" (Azure Resource Graph REST API, 2024-04-01: request body, QueryRequestOptions, `$skipToken`, `$top` maximum 1000; updated October 23, 2026), <https://learn.microsoft.com/en-us/rest/api/azureresourcegraph/resourcegraph/resources/resources>, accessed November 3, 2026.
[^m4-hcmachine]: Microsoft Learn, "Machines - Get" (Microsoft.HybridCompute, 2026-09-01: `status`, `osSku`, `privateLinkScopeResourceId`, `licenseProfile.esuProfile`; updated October 23, 2026), <https://learn.microsoft.com/en-us/rest/api/hybridcompute/machines/get>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-permgov]: Microsoft Learn, "Azure permissions for Management and governance" (`Microsoft.ResourceGraph/resources/read`; `Microsoft.PolicyInsights/policyStates/summarize/action` and `/summarize/read`; updated July 1, 2026), <https://learn.microsoft.com/en-us/azure/role-based-access-control/permissions/management-and-governance>, accessed November 3, 2026.
[^m4-argtables]: Microsoft Learn, "Azure Resource Graph table and resource type reference" (the `resources` and `policyresources` tables), <https://learn.microsoft.com/en-us/azure/governance/resource-graph/reference/supported-tables-resources>, accessed November 3, 2026.
[^m4-argov]: Microsoft Learn, "Overview of Azure Resource Graph" (permissions; how Resource Graph is kept current; updated June 18, 2024), <https://learn.microsoft.com/en-us/azure/governance/resource-graph/overview>, accessed November 3, 2026.
[^m4-argpaging]: Microsoft Learn, "Work with large data sets" (1,000-record default; paging; `resultTruncated`; updated June 3, 2024), <https://learn.microsoft.com/en-us/azure/governance/resource-graph/concepts/work-with-data>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-polcompliance]: Microsoft Learn, "Get policy compliance data" (evaluation triggers; updated February 10, 2025), <https://learn.microsoft.com/en-us/azure/governance/policy/how-to/get-compliance-data>, accessed November 3, 2026.
[^m4-argthrottle]: Microsoft Learn, "Guidance for throttled requests in Azure Resource Graph" (updated January 4, 2024), <https://learn.microsoft.com/en-us/azure/governance/resource-graph/concepts/guidance-for-throttled-requests>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-armthrottle]: Microsoft Learn, "Understand how Azure Resource Manager throttles requests" (regional token bucket limits; updated February 27, 2026), <https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/request-limits-and-throttling>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-azps]: Microsoft Learn, "Search-AzGraph" (Az.ResourceGraph; updated October 1, 2026), <https://learn.microsoft.com/en-us/powershell/module/az.resourcegraph/search-azgraph>, accessed November 3, 2026.
[^m4-azrest]: Microsoft Learn, "Invoke-AzRestMethod" (Az.Accounts; updated October 1, 2026), <https://learn.microsoft.com/en-us/powershell/module/az.accounts/invoke-azrestmethod>, accessed November 3, 2026.
[^m4-argarcsamples]: Microsoft Learn, "Azure Resource Graph sample queries for Azure Arc-enabled servers" (updated May 14, 2025), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/resource-graph-samples>, accessed November 3, 2026.
[^m4-hcext]: Microsoft Learn, "Machine Extensions - Get" (Microsoft.HybridCompute, 2026-09-01: `publisher`, `type`, `typeHandlerVersion`, `provisioningState`, `settings`; updated October 23, 2026), <https://learn.microsoft.com/en-us/rest/api/hybridcompute/machine-extensions/get>, accessed November 3, 2026.
[^m4-amaov]: Microsoft Learn, "Install and manage the Azure Monitor Agent" (updated July 8, 2026), <https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-manage>, accessed November 3, 2026.
[^m4-extlist]: Microsoft Learn, "Virtual machine extension management with Azure Arc-enabled servers" (extension publishers and types), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/manage-vm-extensions>, accessed November 3, 2026.
[^m4-mdetroubleshoot]: Microsoft Learn, "Enable Defender for Endpoint integration in Microsoft Defender for Cloud" (troubleshoot extension deployment), <https://learn.microsoft.com/en-us/azure/defender-for-cloud/enable-defender-for-endpoint>, accessed November 3, 2026.
[^m4-sqltpl]: Microsoft Learn, "Microsoft.AzureArcData sqlServerInstances" template reference (properties, including `version`, `status` and `containerResourceId`; updated December 9, 2024), <https://learn.microsoft.com/en-us/azure/templates/microsoft.azurearcdata/sqlserverinstances>, accessed November 3, 2026.
[^m4-polassign]: Microsoft Learn, "Details of the policy assignment structure" (enforcement mode; updated July 30, 2026), <https://learn.microsoft.com/en-us/azure/governance/policy/concepts/assignment-structure>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-argpolsamples]: Microsoft Learn, "Azure Resource Graph sample queries for Azure Policy" (updated March 19, 2025), <https://learn.microsoft.com/en-us/azure/governance/policy/samples/resource-graph-samples>, and the samples-by-table page (policy states by assignment), <https://learn.microsoft.com/en-us/previous-versions/azure/governance/resource-graph/samples/samples-by-table>, accessed November 3, 2026.
[^m4-lifecycle]: Microsoft Learn, lifecycle pages for Windows Server 2012 R2, 2016, 2019, 2022 and 2025, and SQL Server 2012, 2014, 2016, 2017, 2019 and 2022, under <https://learn.microsoft.com/en-us/lifecycle/products/> (each page's Extended End Date and Extended Security Update years), accessed November 3, 2026; rechecked November 11, 2026. `examples/ms-automation/arc-lifecycle.json` names each page.
[^m4-ws2012esu]: Microsoft Learn, "Overview of Extended Security Updates for Windows Server 2012 and 2012 R2" (ESU end date October 13, 2026; updated June 5, 2025), <https://learn.microsoft.com/en-us/windows-server/get-started/extended-security-updates-overview>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-arcesu]: Microsoft Learn, "Prepare to deliver Extended Security Updates for Windows Server through Azure Arc" (Windows Server 2012 license deactivation; Windows Server 2016 ESUs; updated September 11, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/prepare-extended-security-updates>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-sqlesu]: Microsoft Learn, "What are Extended Security Updates?" (SQL Server; updated June 22, 2026), <https://learn.microsoft.com/en-us/sql/sql-server/end-of-support/sql-server-extended-security-updates>, accessed November 3, 2026; rechecked November 11, 2026.
[^m4-arcpl]: Microsoft Learn, "Use Azure Private Link to connect servers to Azure Arc by using a private endpoint" (updated May 4, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/private-link-security>, accessed November 3, 2026.
[^m4-argpagelimits]: Microsoft Learn, "Guidance for pagination" (Azure Resource Graph: pagination limitations, sorting by a unique column, dynamic environments, hash-based partitioning and batching by resource ID), <https://learn.microsoft.com/en-us/azure/governance/resource-graph/concepts/paging-results>, accessed November 11, 2026.
[^m4-sqlesufaq]: Microsoft Learn, "Extended Security Updates: Frequently asked questions" (SQL Server 2014 ESUs "available until July 8, 2027"; SQL Server 2016 ESUs until July 17, 2029), <https://learn.microsoft.com/en-us/sql/sql-server/end-of-support/extended-security-updates-frequently-asked-questions>, and the SQL Server 2014 lifecycle page (Extended Security Updates Year 3 ending 7/13/2027 6:59:59 AM PT), <https://learn.microsoft.com/en-us/lifecycle/products/sql-server-2014>, accessed November 11, 2026.
[^m4-clisp]: Microsoft Learn, "Use an Azure service principal with certificate-based authentication" (`az ad sp create-for-rbac --create-cert` and the `fileWithCertAndPrivateKey` output), <https://learn.microsoft.com/en-us/cli/azure/azure-cli-sp-tutorial-3>, and "Troubleshooting Azure CLI" (`create-for-rbac` matches an existing app by display name), <https://learn.microsoft.com/en-us/cli/azure/use-azure-cli-successfully-troubleshooting>, accessed November 11, 2026.
[^m4-azpsauth]: Microsoft Learn, "Sign in to Azure PowerShell non-interactively for automation scenarios" (certificate sign-in by thumbprint from the local certificate store), <https://learn.microsoft.com/en-us/powershell/azure/authenticate-noninteractive>, accessed November 11, 2026.
[^m4-clilogin]: Microsoft Learn, "Sign into Azure with a service principal using the Azure CLI" (`az login --service-principal --certificate` with a PEM file holding the private key and certificate), <https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli-service-principal>, accessed November 11, 2026.
[^m4-polsummarize]: Microsoft Learn, "Get compliance data of Azure resources" (Summarize For Subscription, `POST .../providers/Microsoft.PolicyInsights/policyStates/latest/summarize`), <https://learn.microsoft.com/en-us/azure/governance/policy/how-to/get-compliance-data>, and the Azure SDK for .NET reference for `SummarizePolicyStates` (default api-version 2024-10-01), <https://learn.microsoft.com/en-us/dotnet/api/azure.resourcemanager.policyinsights.mocking.mockablepolicyinsightssubscriptionresource.summarizepolicystates>, accessed November 11, 2026.
