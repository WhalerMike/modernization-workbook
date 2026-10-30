# Verification — Chapter 05, Lifecycle Workflows Custom Extensions

New material; it replaces no workbook page. Code: `examples/lifecycle-extensions` (new): the reusable Logic App definition `logicapp/integration.workflow.json`, the registry `config/integrations.json`, `tools/wdl.py` (an offline interpreter for the Workflow Definition Language subset used), `tools/lcwext.py` (lint, run against fakes, build, read-back checks), three unittest files and four fictional `contoso.example` fixtures. Pinned sample: `examples/third_party/lifecycle-workflows-logic-app` (new), the Learn source pages "Configure a Logic App for Lifecycle Workflow use" and "Lifecycle Workflows custom task extension", from MicrosoftDocs/entra-docs at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026; code MIT). Every file's git blob hash matched the upstream tree at that commit (checked with `gh api` contents SHAs) before `snapshot.json` was written. Source-watch feed added: `lifecycle-workflows-logic-app-commits`.

Microsoft's own sample: the Logic App definition on the configure page is the only one Microsoft publishes. Code searches on GitHub on October 30, 2026 (`callbackUriPath` and `AzureADLifecycleWorkflowsAuthPOPAuthPolicy` in the `Azure-Samples`, `microsoft` and `MicrosoftDocs` organizations; repository searches for Lifecycle Workflows Logic App samples) found only the Learn source pages, a Learn training module that repeats the callback URI, and community repositories, which the chapter doesn't use.

Test results on October 30, 2026, Windows 11, Python 3.14.3: `test_wdl.py` 15 passed; `test_learn_sample.py` 9 passed; `test_extension.py` 30 passed (54 in all). `scripts/tests/test_third_party_snapshots.py` covers all four snapshots. Learn's definition was run only against the fakes in `tools/lcwext.py`: nothing signed in, and no request left the machine.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: Trigger Logic Apps based on custom task extensions; Configure a Logic App for Lifecycle Workflow use; Lifecycle Workflows custom task extension; Best practices for securing the custom extension extensibility to Azure Logic Apps; taskProcessingResult: resume (v1.0); customTaskExtension resource type; Create customTaskExtensions (v1.0 and beta); customExtensionClientConfiguration; customTaskExtensionCallbackConfiguration; customTaskExtensionCallbackData; azureAdPopTokenAuthentication (search result); Microsoft Entra ID Governance service limits; Plan a Lifecycle Workflow deployment; Microsoft Entra ID Governance licensing fundamentals; What are lifecycle workflows?; Microsoft Entra feature availability (its source page in MicrosoftDocs/entra-docs, read with `gh api`, is titled "Microsoft Entra feature availability in Azure for US Government"); Microsoft Graph national cloud deployments; Lifecycle Workflow built-in tasks; Configure the arguments for built-in Lifecycle Workflows tasks; Overview of Lifecycle Workflows APIs (search result); Handle workflow errors and exceptions in Azure Logic Apps; Limits and configuration reference for Azure Logic Apps (retry limits); Secure access and data for workflows in Azure Logic Apps; Reference guide to functions in expressions (startsWith, endsWith); Compare Azure Government and global Azure; Remove-MgIdentityGovernanceLifecycleWorkflowCustomTaskExtension.

Non-Learn sources: the MicrosoftDocs/entra-docs commit history (GitHub API), used only to show when the `appid` row changed (claim 9). No blog, community or Q&A source is used.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Custom task extension calls a Consumption Logic App; launch and continue, launch and wait; failed if no response in the duration; a third party can respond | Where the extensions sit; Verified facts | verified | Learn, extensibility page |
| 2 | Callback wait 30 minutes to 3 hours; planning page says 3 minutes to 5 hours | Where the extensions sit; Verified facts | verified; Learn pages differ (research-gaps.md) | Learn, callback configuration; service limits; deployment plan |
| 3 | Resume: path, v1.0, 204, global, L4, L5; `operationStatus` completed or failed | Where the extensions sit; Verified facts | verified | Learn, resume; callback data |
| 4 | New extensions use PoP; bearer extensions can't be migrated | Where the extensions sit; Verified facts | verified | Learn, configure page; security page |
| 5 | 100 custom task extensions, 25 tasks per workflow; 100 or 50 workflows | Where the extensions sit; Verified facts | verified; Learn pages differ | Learn, service limits; what are lifecycle workflows; licensing fundamentals |
| 6 | ID Governance or Entra Suite licenses; ID Governance in GCC, GCC High, DoD; Lifecycle Workflows listed for Azure for US Government | Where the extensions sit; Verified facts | verified | Learn, licensing fundamentals; feature availability |
| 7 | GCC uses graph.microsoft.com; GCC High graph.microsoft.us; DoD dod-graph.microsoft.us; tokens not interchangeable | Where the extensions sit; code; Verified facts | verified | Learn, national cloud deployments |
| 8 | What Learn's definition contains (trigger schema, one HTTP callback to /beta with MSI, Completed) and its PoP policy claims | What Learn gives you; Authorization | verified by reading and parsing the pinned page | pinned page |
| 9 | The page's `appid` is a placeholder; `azp` prints ce79fdc4-…; commit b7e8790 (May 15, 2024) replaced ce79fdc4-… in both `appid` rows | What it leaves to you | verified (diff of that commit read with `gh api`) | entra-docs history; research-gaps.md row 10 |
| 10 | No Microsoft GitHub sample, ARM template or Bicep file for this integration | What Learn gives you | verified by search on October 30, 2026 (searches listed above) | GitHub code and repository search |
| 11 | Hard-coded worldwide host fails a GCC High tenant; /beta; path unchecked; always Completed; no callback after a failure; repeat delivery repeats work; run history shows the subject; implicit retry | What it leaves to you | verified by running the pinned definition against the fakes; each pinned in `test_learn_sample.py` | local run |
| 12 | Beta APIs aren't supported in production | What it leaves to you | verified | Learn, Create customTaskExtensions (beta) |
| 13 | Logic Apps retries 408, 429, 5xx; Default policy up to 4 retries capped between 5 and 45 seconds; exponential maximum interval defaults to 1 day | The code; Verified facts | verified | Learn, error and exception handling |
| 14 | `maximumRetries` 0 or 1; `timeoutInMilliseconds` 200 to 2,000, default 1,000 | The code; Verified facts | verified | Learn, customExtensionClientConfiguration |
| 15 | Authorization policy in ARM `accessControl`; SAS disabled with `sasAuthenticationPolicy.state`; policies readable through ARM; secureData in run history | Authorization; Lab 2 | verified | Learn, Secure access and data for workflows |
| 16 | Lifecycle Workflows doesn't need SAS; disable it; MI enabled and authorized automatically for launch and wait | Authorization; Dangers | verified | Learn, security page |
| 17 | Azure Government ARM endpoint management.usgovcloudapi.net; no PoP policy values on Learn for it | Authorization | verified (absence rechecked October 30, 2026) | Learn, compare Azure Government; research-gaps.md row 12 |
| 18 | v1.0 create example shows bearer; security page says v1.0 defaults to PoP | Authorization; Verified facts | verified; Learn pages differ | Learn, create page; security page |
| 19 | `authorizedApps` described but no request sets it | Authorization | verified | Learn, callback configuration; create pages; research-gaps.md row 13 |
| 20 | Apps in `authorizedApps` resume without permission; `LifecycleWorkflows.ReadWrite.All` otherwise; "No authorization" not recommended | Authorization; Verified facts | verified | Learn, resume; extensibility page |
| 21 | Create: `LifecycleWorkflows-CustomExt.ReadWrite.All`; Lifecycle Workflows Administrator; Logic App Contributor, Contributor or Owner; Logic App Operator not enough | Lab 2; Verified facts | verified | Learn, create page; extensibility page |
| 22 | Task definition IDs 4262b724 (and d79d1fcc on the same page), 1dfdfcc7 (disable), 509589a4 (revoke refresh tokens); argument name | Leaver order; Verified facts | verified; Learn pages differ | Learn, built-in tasks; task arguments |
| 23 | An extension can be deleted only if no task references it | Lab 2 | verified | Learn, Remove-MgIdentityGovernanceLifecycleWorkflowCustomTaskExtension |
| 24 | startsWith and endsWith aren't case-sensitive | `tools/wdl.py` | verified | Learn, expression functions reference |
| 25 | `callbackUriPath` shape | One Logic App per integration | not documented; built to the resume path; research-gaps.md row 11 | Learn, configure page; resume |
| 26 | One Logic App per integration; block first; idempotent bounded retries; rerun resumes from first incomplete step | Where the extensions sit; code | verified against Book 03 | Book 03, Chapters 08 and 09, Appendix A |
| 27 | Object ID only downstream; Idempotency-Key contract; continueOnError true in leavers; one-hour wait and one retry; plan for 50 workflows | Code; Dangers | restated-as-design (labeled where stated) | — |
| 28 | Lab 1 outputs (8 results and exit 2 for Learn's definition; GCC High task failed; 0 results for ours; 960 seconds at PT15M; graph.microsoft.us callback with 3 calls and 1 effect; 5 calls and failed; 2 calls and 1 effect; build files; exit 1 for AzureUSGovernment; 0 results for both read-backs; WX-03 twice; 54 tests) | Lab 1 | verified by running the commands as written | local run, October 30, 2026 |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Book 03, Chapter 08, guardrails ("one parameterized Logic App per integration"; 100 extensions, 25 tasks) | The registry and the single definition; Verified facts | — |
| Book 03, Chapter 09, "Running it from Lifecycle Workflows" (launch and wait, managed identity, order, idempotent bounded retries) | `check-workflow` (WX-03, WX-04), `Resume` on failure, `Idempotency-Key`, LX-11 | The exception path to the security and operations teams stays an operations process; the failed callback is its input |
| Book 03, Appendix A, partial leavers | The idempotency contract | — |
| Index outline row 05 | The chapter | — |
