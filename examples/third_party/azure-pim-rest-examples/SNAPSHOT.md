# PIM for Azure resources: a pinned copy of Microsoft's REST examples

This folder is an unmodified copy of six request and response examples for the Azure Resource Manager API that manages PIM for Azure resources (`Microsoft.Authorization`, API version `2020-10-01`), with the repository's MIT license. They come from [Azure/azure-rest-api-specs](https://github.com/Azure/azure-rest-api-specs/tree/411fb227a905864f972d26ab88b21ef69e1f67b2/specification/authorization/resource-manager/Microsoft.Authorization/Authorization/stable/2020-10-01/examples) at commit `411fb227a905864f972d26ab88b21ef69e1f67b2` (October 30, 2026); the files last changed on February 12, 2026, when the folder moved to the unified structure. They are the examples the Learn REST reference renders for these operations:

| File | Operation |
|---|---|
| `examples/GetRoleAssignmentSchedulesByScope.json` | Role Assignment Schedules - List For Scope |
| `examples/GetRoleEligibilitySchedulesByScope.json` | Role Eligibility Schedules - List For Scope |
| `examples/GetRoleManagementPolicyByScope.json` | Role Management Policies - List For Scope |
| `examples/PutRoleEligibilityScheduleRequest.json` | Role Eligibility Schedule Requests - Create |
| `examples/PutRoleAssignmentScheduleRequest.json` | Role Assignment Schedule Requests - Create |
| `examples/PatchPartialRoleManagementPolicy.json` | Role Management Policies - Update (two rules) |

**Why these and not Learn's how-to page.** Learn's [Use Azure PIM to manage eligible access with the REST API](https://learn.microsoft.com/rest/api/authorization/privileged-role-eligibility-rest-sample), and its companions for active access and role management policies, are Microsoft's walkthrough for this API. Their source isn't in a public MicrosoftDocs repository, so it can't be pinned and checked. These examples are Microsoft's published request and response bodies for the same calls. `examples/privileged-access/tests/AzurePim.Tests.ps1` replays them, unmodified, through the [developer workbook *Building Privileged Access*, Chapter 06](../../../docs/project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md) code against a fake Resource Manager. Nothing signs in and nothing leaves the machine.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, license and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit with `gh api` and recomputed locally with `git hash-object` before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream folder (`azure-pim-rest-examples-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the six files from that commit, regenerate `snapshot.json`, rerun `examples/privileged-access/tests/AzurePim.Tests.ps1` and the Chapter 06 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/privileged-access`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
