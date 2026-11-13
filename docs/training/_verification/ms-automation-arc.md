# Verification — Microsoft Automation, Module 4: Azure Arc through Azure Resource Manager and Resource Graph (research)

File: `docs/training/ms-automation-arc.md`
Example code: `examples/ms-automation/python/armkit.py`, `examples/ms-automation/python/arc_tasks.py`, `examples/ms-automation/powershell/FmwArm.psm1`, `examples/ms-automation/arm-calls.json`, `examples/ms-automation/arc-lifecycle.json` and `examples/ms-automation/tests/fixtures/arc.json`
Verified: 2026-11-03, with Lab 1 run the same day
Rechecked: 2026-11-11, when the module was brought up to date on current main; Lab 1 run again the same day (see [Recheck, November 11, 2026](#recheck-november-11-2026))

Method:
- Microsoft Learn pages were fetched on 2026-11-03 as text and searched for each claim; where a page was found through `microsoft_docs_search`, the result's text was used and the page cited. REST reference pages were read for the request, the documented properties and their enumerations.
- Lifecycle dates were read from each product's Microsoft Learn lifecycle page (Support Dates and Releases tables) and recorded exactly as listed.
- NIST: the SP 800-53 Rev. 5 Moderate baseline profile (OSCAL content, version 5.2.0) was downloaded from `usnistgov/oscal-content`, and baseline membership read from the JSON.
- Book 05, Book 06, the Arc track implementation guide and the validation kit were read in the repository for the links and the VK-ARC checks.
- Requests carried a generic User-Agent and no name, email address or other personal data.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **not verified** (labelled on the page as unverified, or not stated as fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Resource Manager host: `management.azure.com` (commercial) | Unit 2 | verified | m4-govcompare |
| 2 | A GCC tenant's subscriptions are commercial Azure | Unit 2; Unit 6 | verified via the Arc track guide 1.1 and Module 1 | guide 1.1; Module 1 |
| 3 | Graph tokens can't call Resource Manager (one token per resource) | Unit 2 | design (Module 1 rule) | Module 1 |
| 4 | Reader role: ID `acdd72a7-3385-48ef-bd42-f606fba81ae7`, actions `*/read` only | Unit 2; Lab 2 | verified | m4-reader |
| 5 | Subscriptions list: `GET /subscriptions?api-version=2022-12-01`; returns `nextLink` | Unit 2 | verified | m4-sublist |
| 6 | Subscriptions list holds the subscriptions where the caller has a role | Unit 2 table | inference from "Gets all subscriptions for a tenant" with RBAC-scoped results; the table says "none checked" | m4-sublist |
| 7 | Resource Graph: `POST /providers/Microsoft.ResourceGraph/resources?api-version=2024-04-01`; body `query`, `subscriptions`, `managementGroups`, `options` | Unit 2; Unit 3 | verified | m4-argrest |
| 8 | Arc machine API version 2026-09-01 | Unit 2 | verified | m4-hcmachine |
| 9 | RBAC action `Microsoft.ResourceGraph/resources/read` | Unit 2 table | verified | m4-permgov |
| 10 | Policy Insights lists `policyStates/summarize/action` and `/summarize/read` | Unit 2 | verified | m4-permgov |
| 11 | Whether Reader alone can call summarize | Unit 2 | not verified (labelled) | — |
| 12 | Tables: `resources` holds hybridcompute machines, machine extensions, azurearcdata sqlserverinstances; `policyresources` holds policyassignments and policystates | Unit 3 | verified | m4-argtables; m4-argarcsamples; m4-argpolsamples |
| 13 | "No results are returned if you don't have at least read permissions" | Unit 3 | verified (quoted) | m4-argov |
| 14 | Default 1,000 records; `$top` maximum 1000; `$skipToken` continuation with the same query and scopes | Unit 3 | verified | m4-argpaging; m4-argrest |
| 15 | No `$skipToken` when the query uses limit, sample or take, or all output columns are dynamic or null; `resultTruncated` | Unit 3 | verified | m4-argpaging |
| 16 | Resource Graph "isn't strongly consistent", "indexed with a short latency"; notifications plus full scans | Unit 3 | verified (quoted) | m4-argov |
| 17 | Policy assignments reevaluated once every 24 hours | Unit 3 | verified | m4-polcompliance |
| 18 | Resource Graph quota example: 15 queries per 5 seconds; headers `x-ms-user-quota-remaining`, `x-ms-user-quota-resets-after` (hh:mm:ss); 10,000-subscription limit and `x-ms-tenant-subscription-limit-hit` | Unit 3 | verified | m4-argthrottle |
| 19 | Resource Manager token bucket: subscription reads 250 / 25 per second; writes and deletes 200 / 10; per subscription, service principal and operation type; global 15 times; 429 with Retry-After; `x-ms-ratelimit-remaining-subscription-reads` | Unit 3 | verified | m4-armthrottle |
| 20 | Search-AzGraph parameters `-Subscription`, `-ManagementGroup`, `-First`, `-Skip`, `-SkipToken`, `-UseTenantScope` | Unit 3 | verified | m4-azps |
| 21 | Invoke-AzRestMethod: "Construct and perform HTTP request to Azure resource management endpoint only"; takes `-Method` and `-Payload` | Unit 3 | verified | m4-azrest |
| 22 | Machine `status` values Connected, Disconnected, Error, AwaitingConnection | Unit 4 | verified | m4-hcmachine (StatusTypes) |
| 23 | Machine `osType`, `osName`, `osSku` ("the Operating System product SKU"), `osVersion` | Unit 4 | verified | m4-hcmachine |
| 24 | `privateLinkScopeResourceId`: "the resource id of the private link scope this machine is assigned to, if any" | Unit 4 | verified (quoted) | m4-hcmachine |
| 25 | `licenseProfile.esuProfile.esuEligibility` (Eligible, Ineligible, Unknown) and `licenseAssignmentState` (Assigned, NotAssigned) | Unit 4 | verified | m4-hcmachine |
| 26 | Microsoft's sample uses `iif(isnotnull(osSku), osSku, osName)` | Unit 4 | verified | m4-argarcsamples |
| 27 | Extension ID begins with the machine ID; the sample joins on `substring(id, 0, indexof(id, '/extensions'))` | Unit 4 | verified | m4-argarcsamples |
| 28 | Extension properties `publisher`, `type`, `typeHandlerVersion`, `provisioningState`, `settings` ("Json formatted public settings"), `protectedSettings`; the example's settings are a command line | Unit 4 | verified | m4-hcext |
| 29 | Azure Monitor Agent: publisher `Microsoft.Azure.Monitor`, types `AzureMonitorWindowsAgent`, `AzureMonitorLinuxAgent` | Unit 4 | verified | m4-amaov; m4-extlist |
| 30 | Defender for Endpoint: publisher `Microsoft.Azure.AzureDefenderForServers`, types `MDE.Windows`, `MDE.Linux` | Unit 4 | verified | m4-extlist |
| 31 | Extension stuck in Creating or Provisioning failed: investigate before retrying | Unit 4 | verified | m4-mdetroubleshoot |
| 32 | SQL Server instance properties `version` (2012 to 2022, Unknown), `edition`, `status` (Connected, Disconnected, Unknown), `containerResourceId`, `licenseType`, `currentVersion`, `patchLevel` | Unit 4 | verified across the template reference's API versions | m4-sqltpl |
| 33 | An instance whose host isn't in the result needs a look | Unit 4 | inference (labelled) | — |
| 34 | enforcementMode `Default`, `DoNotEnforce`, `Enroll`; default when unspecified is `Default`; DoNotEnforce still evaluates | Unit 5 | verified | m4-polassign |
| 35 | complianceState values NonCompliant, Compliant, Conflict, Exempt; states carry the assignment ID | Unit 5 | verified (sample query) | m4-argpolsamples |
| 36 | States from an assignment outside the result are usually from a management group | Unit 5 | inference (labelled) | — |
| 37 | Windows Server 2012 R2: extended end 10/11/2023 06:59:59; ESU Year 3 ends 10/14/2026 06:59:59 | Unit 5 table; arc-lifecycle.json | verified | m4-lifecycle (2012 R2 page) |
| 38 | Windows Server 2012 and 2012 R2 ESUs end October 13, 2026 | Unit 5 | verified | m4-ws2012esu |
| 39 | Arc ESU licenses for Windows Server 2012 deactivated at midnight UTC October 14, 2026 | Unit 5 table | verified | m4-arcesu |
| 40 | Windows Server 2016: extended end 1/13/2027 06:59:59; ESUs through Arc "for up to three years, through 2030"; billing begins January 13, 2027; no exact ESU end date published | Unit 5 | verified | m4-lifecycle; m4-arcesu |
| 41 | Windows Server 2019 1/10/2029; 2022 10/15/2031; 2025 11/15/2034 (extended end, 06:59:59) | Unit 5 table | verified | m4-lifecycle |
| 42 | SQL Server 2012: extended 7/13/2022; ESU Year 3 ends 7/9/2025 | Unit 5 table | verified | m4-lifecycle |
| 43 | SQL Server 2014: extended 7/10/2024; ESU Year 3 ends 7/13/2027 | Unit 5 table | verified; superseded on 2026-11-11 by row 57, which uses the earlier date | m4-lifecycle |
| 44 | SQL Server 2016: extended 7/15/2026; ESU Year 3 ends 7/17/2029 | Unit 5 table | verified | m4-lifecycle |
| 45 | SQL Server 2017 10/13/2027; 2019 1/9/2030; 2022 1/12/2033 | Unit 5 table | verified | m4-lifecycle |
| 46 | SQL Server instances connected to Azure Arc can subscribe to ESUs | Unit 5 | verified | m4-sqlesu |
| 47 | The ESU subscription may be readable from the extension's settings | Unit 5 | inference (labelled) | — |
| 48 | Windows Server 2012 hosts receive no further updates; treat as red finding | Unit 5; Unit 6 | verified via Book 05 Ch 09 | Book 05 |
| 49 | Private Link sends traffic over ExpressRoute or site-to-site VPN instead of public networks; one private endpoint for many servers | Unit 7 notes | verified | m4-arcpl |
| 50 | Controls AU-12, CA-7, CM-2, CM-6, CM-8, CM-8(1), SA-22, SC-7, SI-2, SI-3, SI-4 in the Moderate baseline | Unit 1; Unit 7 | verified | m4-nistmod |
| 51 | Each check's control mapping | Unit 7 | design (the program's mapping) | — |
| 52 | Lab 1 output | Unit 8 | verified (run on 2026-11-03; output pasted) | the kit |
| 53 | `SRV-APP-02` support ends in 71 days from 2026-11-03 | Unit 8 step 4 (step 3 before 2026-11-11) | verified (computed: 2027-01-13T06:59:59Z minus 2026-11-03T00:00:00Z) | arc-lifecycle.json |
| 54 | Lab 2 | Unit 9 | not run by the authors (labelled) | — |

## Recheck, November 11, 2026

The module was written on November 3, 2026 and not merged then. Before it was merged, every Learn fact the page states was searched again on Microsoft Learn on 2026-11-11, the module was re-applied to current main, and Lab 1 was run again. What the recheck found or changed:

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 55 | Unchanged on 2026-11-11: Arc machine API version 2026-09-01; Resource Graph paging (1,000 records, no `$skipToken` with limit, sample or take or all-dynamic columns); Resource Graph quota example and headers; Resource Manager token bucket (250 / 25, 200 / 10, global 15 times); `enforcementMode` values | Units 2, 3, 5 | verified | m4-hcmachine; m4-argpaging; m4-argthrottle; m4-armthrottle; m4-polassign |
| 56 | Pagination guidance: records sharing a sort value can repeat or go missing across pages; sort by a unique column such as `id`; changes between requests can still shift pages; hash partitioning and ID batching as client-side alternatives | Unit 3; both kits' queries and tests | verified (new Learn page); the kit now ends every query with `order by id asc` or `order by assignmentId asc` | m4-argpagelimits |
| 57 | SQL Server 2014 ESUs: the ESU FAQ says "available until July 8, 2027"; the lifecycle page lists ESU Year 3 ending 7/13/2027 06:59:59 PT. The two Learn pages disagree; the kit and page use the earlier date (`arc-lifecycle.json` `esuEnd` 2027-07-09T06:59:59Z, with an `esuNote`) | Unit 5 table; arc-lifecycle.json; expected-arc.json | verified (both pages); the earlier date followed | m4-sqlesufaq; m4-lifecycle |
| 58 | SQL Server 2016 ESUs until July 17, 2029 (ESU FAQ; lifecycle page Year 3 ends 7/17/2029) | Unit 5 table | verified | m4-sqlesufaq; m4-lifecycle |
| 59 | Windows Server 2016 end of support January 12, 2027 (lifecycle page 1/13/2027 06:59:59); Arc ESUs "for up to three years, through 2030"; configurable in the portal from August 3, 2026; billing from January 13, 2027; agent 1.62 or later | Unit 5 table | verified | m4-lifecycle; m4-arcesu |
| 60 | `Enroll` mode: with no enrollment resource, evaluation is the same as `DoNotEnforce` by default | Unit 5 | verified; reading an `Enroll` assignment as enforcing only where enrolled is an inference (labelled) | m4-polassign |
| 61 | The workbook's server standard: Windows Server 2016 gone from production by January 12, 2027, with 2019 the minimum; a remaining 2016 server is an exception with ESUs through Arc, a signed risk acceptance and a retirement date | Units 1, 5, 6, 8, 11 | the program's planning assumption, stated as such, not a federal requirement | Book 00, Chapter 01 |
| 62 | Lab 2 commands: `az ad sp create-for-rbac --role --scopes --create-cert` (prints `fileWithCertAndPrivateKey`, `password: null`); display-name matching changes an existing app; `az login --service-principal --certificate` with a PEM holding key and certificate; `Connect-AzAccount` signs in by thumbprint from the certificate store | Unit 9 | verified | m4-clisp; m4-clilogin; m4-azpsauth |
| 63 | Policy Insights Summarize For Subscription: `POST .../policyStates/latest/summarize`; api-version 2024-10-01 | Unit 9 step 6 | verified (Learn how-to shows the path with 2019-10-01; the Azure SDK reference gives 2024-10-01 as the default) | m4-polsummarize |
| 64 | Git Bash rewrites arguments that start with `/`; `MSYS_NO_PATHCONV=1` turns it off | Unit 9 | verified locally on 2026-11-11 (an `openssl -subj "/CN=..."` argument was rewritten without it) | — |
| 65 | The PowerShell step that loads `app.pem` and exports it as PKCS#12 | Unit 9 step 4 | verified locally on 2026-11-11 with a throwaway self-signed PEM and an ephemeral key (the private key loads; the thumbprint prints); adding it to the store wasn't run | — |
| 66 | Lab 1 output on 2026-11-11 | Unit 8 | verified (run; same counts and findings as 2026-11-03, with the SQL Server 2014 date now 2027-07-09T06:59:59Z) | the kit |
| 67 | Book 05 Chapter 09 link: the `#monitoring-the-server-estate` anchor no longer exists on main; Unit 1 now links `#the-day-one-baseline` | Unit 1 | verified in the repository | Book 05 |
