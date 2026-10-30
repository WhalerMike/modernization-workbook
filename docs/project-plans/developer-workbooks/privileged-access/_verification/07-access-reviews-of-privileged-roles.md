# Verification — Chapter 07, Access Reviews of Privileged Roles

New material; it replaces no workbook page. Code: `examples/privileged-access`, in files of this chapter's own: `powershell/PaAccessReviews/PaAccessReviews.psm1` (imports `Get-PaCloud` from Chapter 01's module and changes nothing there), `Invoke-PaAccessReviews.ps1`, `config/calls-ch07.json`, `docs/ch07.md`, `tests/AccessReviews.Tests.ps1`, `tests/AccessReviewsSampleHarness.ps1`, `tests/fixtures/ch07/access-reviews.json` and `tests/fixtures/ch07/tenant.json`. Pinned sample: `examples/third_party/graph-access-reviews-roles-tutorial` (new), Learn's tutorial source `concepts/tutorial-accessreviews-roleassignments.md` from microsoftgraph/microsoft-graph-docs-contrib at commit `a69303123e9701eecbf56568d152ece936a97f1e` (October 30, 2026; the page last changed July 3, 2026; CC BY 4.0 documentation, MIT code), with the repository's `LICENSE` and `LICENSE-CODE`. Every file's git blob hash matched the upstream tree at that commit (`gh api` contents, October 30, 2026) before `snapshot.json` was written. Source-watch feed added: `graph-access-reviews-roles-tutorial-commits` (path to the page, books `DW`).

Test results on October 30, 2026, Windows 11, PowerShell 7.6.9 with Pester 5.5.0: 208 passed across the example, Chapters 03 and 06 included after merging main; this chapter's are the 57 in `AccessReviews.Tests.ps1`, of which 11 run Learn's tutorial as published. The tutorial's create request was sent only to the example's fake; nothing was sent to a tenant.

**Why this sample.** The Graph tutorial is Microsoft's own walk-through for reviewing administrative role assignments through the access reviews API, and the only Microsoft sample found for creating such a review as code. Searched on October 30, 2026 with the Learn MCP tools (docs search and code sample search for access review definitions, privileged roles, PIM for Groups and Azure resource roles). No Microsoft sample was found for Azure resource role reviews through an API, or for PIM for Groups reviews through Graph: Learn documents both in the admin center, and the Azure one in the Resource Manager REST reference only. `microsoftgraph/*` and `Azure-Samples/*` weren't searched separately; the Learn sample search returns their Learn-published snippets, and the tutorial covers the task.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: Review access to administrative roles using access reviews APIs (full page, and its source); Configure access review scope by using Microsoft Graph APIs; Configure access reviewers using access reviews APIs; Create definitions; Update accessReviewScheduleDefinition; List definitions; List instances; List decisions; accessReviewInstanceDecisionItem resource type; accessReviewScheduleSettings resource type; Overview of access reviews APIs; Create an access review of Azure resource and Microsoft Entra roles in PIM; Create an access review of PIM for Groups in Microsoft Entra ID (preview); Plan a Microsoft Entra access reviews deployment; Microsoft Entra ID Governance licensing fundamentals; Microsoft Entra feature availability; Access Review Schedule Definitions - Create Or Update By Id, List; Access Review Instances - List; Access Review Instance Decisions - List (all 2021-12-01-preview); Microsoft.Authorization accessReviewScheduleDefinitions 2021-12-01-preview (ARM template reference); Azure built-in roles (General, Privileged); List eligibilityScheduleInstances (PIM for Groups). Microsoft Graph national cloud deployments was carried forward from the workbook index.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Tutorial: one role per review; users and groups, active and eligible; one user reviewer; justification; default `None`; auto-apply unset (false); quarterly, one day, start 2024-03-25; apply by hand; history report with a 24-hour download link; delete removes instances and decisions | Sample section; gap table | verified in the pinned source and the rendered page; pinned by 11 tests | Learn, tutorial; pinned copy |
| 2 | Tutorial prerequisites: P2 or Governance; at least Identity Governance Administrator; `AccessReview.ReadWrite.All` | Cost; differences | verified | Learn, tutorial |
| 3 | Scope examples: Example 1 group transitive members; Example 11 service principals; Example 12.1 active or eligible; 12.2 eligible-only and active-only for users; examples are the only valid combinations | The bodies; gaps 73, 75 | verified | Learn, Configure access review scope |
| 4 | Reviewers: empty is a self-review; group members via `/groups/{id}/transitiveMembers`; PIM for Groups owner reviews need a fallback | The bodies; PA-AR-01, 02 | verified | Learn, Configure access reviewers |
| 5 | Create: `POST`, `AccessReview.ReadWrite.All` (no lower), `descriptionForReviewers` required, 256 characters in email; L4 and L5 | Verified facts; PA-AR-03 | verified | Learn, Create definitions |
| 6 | Update: PUT full object; future instances only; reviewers updatable only if individual users; scope not in the updatable list | The plan; gap 79 | verified | Learn, Update accessReviewScheduleDefinition |
| 7 | List definitions, instances, decisions: `AccessReview.Read.All`; role-review readers; default page 100; `$skip`/`$top`; `$filter` not supported on `principalResourceMembershipsScope` | Permissions; evidence; gaps 76, 77 | verified | Learn, List definitions; List instances; List decisions |
| 8 | Settings: auto-apply default false; default decision values; caution on auto-apply with default decision; recurrence supports `type`, `interval`, `dayOfMonth` only; `removeAccessApplyAction` default | The bodies; PA-AR-06 | verified | Learn, accessReviewScheduleSettings |
| 9 | Decision item fields and `applyResult` values | Evidence; PA-AR-E03 | verified | Learn, accessReviewInstanceDecisionItem |
| 10 | Overview: read roles include Global Reader; create, update, delete need User Administrator; access reviews are a feature of ID Governance | Differences | verified | Learn, Overview of access reviews APIs |
| 11 | PIM page: one review per role; monthly duration at most 27 days; Entra role reviews need Privileged Role Administrator, Azure Owner or User Access Administrator; self-review drops role-assignable groups; groups unexpanded on Entra roles, expanded on Azure roles and denied members stay in the group; service principal reviews need Workload ID Premium | PA-AR-04; permissions; dangers | verified | Learn, Create an access review ... in PIM |
| 12 | PIM for Groups reviews are preview, need Governance, cover eligible and active members; owners need a fallback | The bodies; licensing; gap 75 | verified | Learn, Create an access review of PIM for Groups (preview); licensing fundamentals |
| 13 | Licensing: Governance for member users who review or are reviewed; some capabilities on P2 | Cost; differences | verified | Learn, ID Governance licensing fundamentals |
| 14 | ID Governance available in GCC, GCC High and DoD | Cost | verified | Learn, feature availability |
| 15 | Deployment plan: roles to review regularly; `AccessReview.Read.All` for query scripts | Why reviews; permissions | verified | Learn, Plan an access reviews deployment |
| 16 | Azure review definitions: PUT by ID at a subscription, `2021-12-01-preview`; reviewers users or service principals; scope fields in the response model; instances and decisions lists; every listed version is a preview | The bodies; facts; gaps 71, 72 | verified (reference pages); writability of scope fields open (row 71) | Learn, REST reference; ARM template reference |
| 17 | Reader holds `*/read`; User Access Administrator holds `Microsoft.Authorization/*` | Permissions | verified | Learn, Azure built-in roles |
| 18 | Graph hosts per cloud | Cost | carried forward from the workbook index | Learn, national cloud deployments |
| 19 | Book 04 settings: Step 8 eligible scope, monthly T0, quarterly others, auto-apply, remove access; Chapter 09 schedule and fallbacks; Appendix B pairing of role and `PRV-*` reviews; Chapter 10 review definitions as code | Why reviews; fixture | verified by reading the chapters on October 30, 2026 | Book 04, Chapters 08, 09, 10, Appendix B |
| 20 | Sample behavior offline: duplicate on rerun; Step 6 filter string absent from Step 1; no Azure or PIM for Groups; checks flag PA-AR-02, 03, 05, 07, 10 on the tutorial body | Gap table; Lab 1 | verified by running the pinned requests against the fake | local run |
| 21 | The rules' thresholds (35 and 100 days; five decisions in five minutes; 256 characters; managed prefix; never delete; Replace for scope and group reviewers) | The code | restated-as-design (labeled) except where a row above cites Learn | — |
| 22 | Lab 1 outputs (11 passed; permissions; plan counts; diff; tutorial findings; apply results; evidence counts and findings; refusal text; 208 tests) | Lab 1 | verified by running the commands as written | local run, October 30, 2026 |
| 23 | Lab 2 behavior | Lab 2 | not run against a tenant; research gaps, rows 71, 75, 77, 79 | — |
| 24 | Owner's decision on row 73: eligible groups reviewed through their own `PRV-*` membership series; role series cover users (tutorial scope without `/groups`); PA-AR-14 | The bodies; checks; fixture; dangers | recorded as the owner's decision, October 30, 2026; code, fixture and tests changed to match | owner, through the coordinator |
| 25 | Owner's decision on row 74: a review covering the emergency accounts' permanent Global Administrator uses "no change" on silence and raises a finding; every other privileged review removes access | PA-AR-06 paragraph; checklist | recorded as the owner's decision, October 30, 2026; Book 04, Chapter 08's Step 8 notes the exception, with a correction line in its verification log | owner, through the coordinator |

## Owner's decisions

- **Row 73 (closed).** Groups that hold a privileged role are reviewed through their own PIM for Groups membership series, not through the role review. Role series now leave the tutorial's `/groups` principal scope out; the fixture has a `PRV-*` series for each group that holds a reviewed role; PA-AR-14 flags a missing one; two tests pin it.
- **Row 74 (closed).** The code's behavior stands: "no change" on silence only for a review covering the emergency accounts' permanent Global Administrator, with unreviewed items as findings; "remove access" everywhere else. Book 04, Chapter 08's Step 8 has a note recording the exception.

## Learn conflicts

- Role to create a role review: tutorial (Identity Governance Administrator), overview (User Administrator), PIM page (Privileged Role Administrator). Followed the PIM page (row 78).
- Role to read a role review: overview lists Global Reader; the list pages don't for Entra role reviews. The code names Security Reader.
- License: tutorial (P2 or Governance) against the licensing page (Governance for everyone reviewing or reviewed). Followed the licensing page.
- Monthly duration: the PIM page caps it at 27 days; the Graph settings page has no cap. PA-AR-04 applies the cap.
- Default decision: the tutorial sends `None` with the default decision off; the settings page lists `Approve`, `Deny`, `Recommendation`. The code sends `None` only with the default decision off, as the tutorial and the update example do.

## Non-Learn sources

None. Every external claim cites Microsoft Learn or a workbook chapter.

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Project plan tasks A2.7, A3.7, decision D-A6 | In this chapter; PA-AR-09; checklist | — |
| Book 04, Chapter 08, Step 8 (review settings) | Fixture settings; gap table; rows 73, 74 | Scope: groups are reviewed through their own membership series (row 73, owner's decision); the Global Administrator exception is noted in Step 8 (row 74) |
| Book 04, Chapter 09 (cadence, fallbacks, bulk decisions, evidence) | Fixture; PA-AR-E07; evidence | Review history reports aren't used; decisions are read per instance |
| Book 04, Chapter 10 (review definitions as code; the Graph PowerShell example) | Why reviews as code | Its example reviews an application group; this chapter covers privileged roles |
| Book 04, Appendix B (review cadence by tier; pairing with `PRV-*` reviews) | Fixture; dangers | Tier 2 and read-only reviewers (role owner, security office) are the agency's to fill in |
| Chapter 02 (emergency accounts) | PA-AR-06; PA-AR-E08 | — |
