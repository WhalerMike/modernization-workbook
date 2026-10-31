# Verification — Chapter 02, Ownership and the Orphan Rule

New material; it replaces no workbook page. Code: `examples/non-person-identity` (new with Chapter 01): `powershell/NpiOwnership/NpiOwnership.psm1` (`Import-NpiRegister`, `Test-NpiOwnership`, `New-NpiOrphanPlan`, `New-NpiWriter`, `Assert-NpiPlannedWrite`, `Invoke-NpiOrphanPlan`), `Invoke-NpiOwnership.ps1`, `Invoke-NpiOrphanAction.ps1`, the `ownership` and `orphan-apply` tasks and their calls in `config/calls.json`, `tests/fixtures/inputs/` (`application-owners.csv`, `service-records.csv`, `igo-confirmations.csv`, `owner-claims.csv`), the fake's write routes in `NpiCore`, the HTTP sample parser in `tests/LearnSampleHarness.ps1`, `tests/MicrosoftSamples.Tests.ps1` (Chapter 02 block) and `tests/NpiOwnership.Tests.ps1`. Pinned sample: `examples/third_party/graph-applications-tutorial-page` (new), Learn's page source `concepts/tutorial-applications-basics.md` from microsoftgraph/microsoft-graph-docs-contrib at commit `a69303123e9701eecbf56568d152ece936a97f1e` (October 30, 2026), with the repository's `LICENSE` (CC BY 4.0) and `LICENSE-CODE` (MIT). Every file's git blob hash matched the upstream tree at that commit (checked with `gh api`, recomputed locally from the bytes) before `snapshot.json` was written. Source-watch feed added: `graph-applications-tutorial-page-commits` (books `DW`).

Test results on October 30, 2026, Windows 11, PowerShell 7 with Pester 5.5.0: 97 passed across the example; this chapter's are 10 in `MicrosoftSamples.Tests.ps1` and 31 in `NpiOwnership.Tests.ps1`. The pinned samples ran only against the fake Graph; nothing signed in and no request left the machine.

**Why this sample.** Searched on October 30, 2026 with the Learn MCP tools. The API reference pages for List owners and Add owner each hold one request; the Graph tutorial *Manage Microsoft Entra applications using Microsoft Graph* holds the ownerless query, both owner assignments and the `serviceManagementReference` sample on one page, so it's pinned and the reference pages are cited. Learn's *Deactivate an app registration* and *Disable user sign-in for an application* are procedures with one request each, cited rather than pinned; the code uses the v1.0 one.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: List owners of an application; Add owner; Manage Microsoft Entra applications using Microsoft Graph (source); List applications (example 5); Update servicePrincipal (search excerpts); Upsert servicePrincipal (search excerpt); Deactivate an app registration (search excerpts); Disable user sign-in for an application (search excerpts); Properties of an enterprise application (search excerpt); Overview of enterprise application ownership (search excerpt); Security best practices for application properties (search excerpt); Remove application owner and Remove-MgServicePrincipalOwnerByRef (search excerpts); Get-MgServicePrincipalOwner (search excerpts); Governing Microsoft Entra service accounts (search excerpts); Govern on-premises service accounts (search excerpts); Get a user and Get-MgUser (search excerpts); Microsoft Graph permissions reference (search excerpts); Disable-ADAccount (search excerpts).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Monitor for at least two owners where possible; use `serviceManagementReference` for the team contact from the service or asset management database | The rule; NPI-OWN-01, -06 | verified | Learn, Overview of enterprise application ownership |
| 2 | Service principal owners are users or service principals | The rule; Verified facts | verified | Learn, Get-MgServicePrincipalOwner |
| 3 | Keep ownership minimal; review owners every few months | The rule | verified | Learn, Security best practices for application properties |
| 4 | Owners can add a credential and act as the app | The rule | carried forward from Book 04, Chapter 05 | Book 04 |
| 5 | Two human owners, never service accounts; not service principals or guests | The rule; NPI-OWN-03, -04 | restated-as-design (labeled) from Book 02, Chapter 09 and the project plan's N1.1 | Book 02; project plan |
| 6 | Orphan rule D-N2; Book 04, Chapter 06's order; Book 17's order | The rule; research gaps | recorded (row 11) | project plan; Book 04; Book 17 |
| 7 | Disable, don't delete, until the review is complete; delete after a defined period and warning | The rule; Verified facts | verified | Learn, Governing Microsoft Entra service accounts; Govern on-premises service accounts |
| 8 | Deactivate: `isDisabled` on beta; reactivation on v1.0; tokens stay valid until expiry; remove owners to prevent reactivation; delete leaves a 30-day recycle bin | The rule; Verified facts; Dangers | verified | Learn, Deactivate an app registration |
| 9 | Disable sign-in: `accountEnabled` false blocks tokens in this tenant only; roles; restore with `true` | The rule; Verified facts; Lab 2 | verified | Learn, Disable user sign-in for an application |
| 10 | Activation status shows Deactivated for `accountEnabled` false, `isDisabled` true or Microsoft's disablement | Lab 2; Verified facts | verified | Learn, Properties of an enterprise application |
| 11 | `Disable-ADAccount` disables a user, computer or service account; not against a read-only DC | The rule; Verified facts | verified | Learn, Disable-ADAccount |
| 12 | The tutorial's ownerless query, `ConsistencyLevel: eventual`; owner assignment to app and service principal; free-text `serviceManagementReference`; the `Application.ReadWrite.All` label | Sample section; gap table | verified in the pinned source and by sending the samples to the fake | pinned tutorial |
| 13 | List applications has the same `owners/$count` query | Sample section; Verified facts | verified | Learn, List applications |
| 14 | List owners: `Application.Read.All`; L4 and L5 | Which cloud; Verified facts | verified | Learn, List owners of an application |
| 15 | Add owner: delegated `Application.ReadWrite.All` and `Directory.Read.All`; `OwnedBy` not sufficient; admin roles; L4 and L5 | Write path; Verified facts | verified; table and note differ (row 14) | Learn, Add owner |
| 16 | Update servicePrincipal: delegated `Application.ReadWrite.All`, application `Application.ReadWrite.OwnedBy`; L4 and L5 | Write path; Verified facts | verified | Learn, Update servicePrincipal |
| 17 | Get a user: application `User.Read.All`; non-default properties need `$select`; encode `#` as `%23` | The check; Verified facts | verified | Learn, Get a user; Get-MgUser |
| 18 | `Application.ReadWrite.All` lets an app act as other entities | Write path | verified | Learn, Microsoft Graph permissions reference |
| 19 | Sample behavior: noise in the ownerless list; service principal owners, not registration owners; guests and service principals counted; any directory object added; hard-coded host; free-text reference; no disable step | Gap table | verified by sending the pinned samples to the fake; pinned in `MicrosoftSamples.Tests.ps1` | local run |
| 20 | AI sponsor fields (federal sponsor, sponsoring group, technical owner, inventory record) | The check | restated from Book 17, Chapter 05 and N1.2; recorded, not checked (row 18) | Book 17; project plan |
| 21 | The writer's guards (approved hash, tenant, cloud, seven days, bodies, delegated only, prechecks) | Write path; Dangers | restated-as-design (labeled) | — |
| 22 | Lab 1 outputs (10 passed; permissions; 22 identities, 7 candidates, 20/3/1, 2 AI rows; the plan table and its hash; dry run; apply; the refusal; 14 user reads; 97 tests) | Lab 1 | verified by running the commands as written | local run, October 30, 2026 |
| 23 | Lab 2 behavior (guest `userType`; the AD right for the disable; activation status after the disable) | Lab 2 | not run against a tenant or domain; rows 15 and 16 | — |
| 24 | Lab 1 rerun after NpiCore's JSON writer switched to LF on every platform: the plan hash | Lab 1 | updated by running the commands as written; the counts and findings didn't change | local run, October 31, 2026 |
| 25 | Owners of a service principal are users or service principals | Context | corrected: the cmdlet page names users and service principals as owners and doesn't say groups can't own one, so that clause is dropped | [^np02-sp-owners-cmdlet], accessed October 31, 2026 |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Project plan N1.1, N1.3, D-N2, Gate 1 | Goal; the rule; the plan | N1.2 is recorded only; built in Chapter 09 |
| Book 04, Chapter 05 (ownership) and Chapter 06 (orphan policy, owner transfer) | The rule; research gaps, row 11 | The ten-business-day owner transfer belongs with the mover and leaver workflows (Chapter 09 for sponsors) |
| Book 02, Chapters 09 and 10 (two human owners; owner before touching) | The rule; NPI-OWN-08 | — |
| Book 17, Chapter 05 (two named humans and a record; the orphaned agent; disabling never automatic) | AI sponsor fields; delegated write path | The orphan rule for agents is Chapter 09's |
| The implementation guide, Step 6 (disable first, then delete, per type) | Disable, never delete | Deletion is the reviewed decommission process, not this code |
| Chapter 01's register and manifest | `Import-NpiRegister` | — |
