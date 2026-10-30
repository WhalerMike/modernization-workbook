---
title: "Chapter 08 — Ansible Beside Arc"
description: "Onboarding servers to Azure Arc with Ansible while keeping one owning tool per setting: start from Microsoft's own azure_arc role (pinned in the repository), then add what it leaves to you: a CMDB-driven inventory that reads config_owner and the new patch_owner column, mirrors them to the ConfigOwner and PatchOwner tags, plans each wave before anything runs, gives the role a dry run it can't do itself, and keeps a GCC estate on commercial Azure, with labs offline and in a test subscription."
doc-type: workbook-chapter
audience: [Technical]
family: dw-attribute-driven-migration
part: How
series-order: 8
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 08 — Ansible Beside Arc

*Microsoft's role connects a server to Azure Arc. It doesn't know which tool owns the server's settings, which tool patches it, or which wave it belongs to. The CMDB knows, and the inventory has to carry that to every connect.*

::: {.callout-note}
## In this chapter
How Ansible onboards servers to Azure Arc without taking anything another tool owns. You start from Microsoft's own `azure.azcollection.azure_arc` role, which Learn documents and the repository keeps as a pinned copy, run it offline, and see what it leaves to you. Then you build on `examples/ansible`: a `patch_owner` column in the CMDB export, an inventory that reads both owners and turns them into the `ConfigOwner` and `PatchOwner` tags, a wave plan written before anything runs, a dry run the role can't do itself, and a guard that keeps a GCC estate on commercial Azure. Lab 1 runs on a laptop with no subscription; Lab 2 uses a test subscription and a disposable server.
:::

## Goal and audience

**Goal.** By the end of this chapter you can onboard one wave of servers to Arc with Microsoft's role, from a CMDB export, with every server tagged with the tool that owns its settings and the tool that patches it. You can show a reviewer the plan before the run and the result after it. For each rule in the code you can say whether it is Microsoft's contract, Microsoft's sample, or the program's own design.

**Audience.** Platform engineers who run Ansible beside Arc, and the developers who keep the inventory and playbooks. You should know Ansible playbooks, inventories and check mode. You don't need an Azure subscription until Lab 2.

## Where Ansible sits beside Arc

The program gives every setting one owning tool. The CMDB records it for each asset as `config_owner`, and the [Arc track](../../../books/guides/arc-track-implementation.md#step-2-the-tag-taxonomy-and-resource-groups) mirrors it to the Arc `ConfigOwner` tag. Patching has one owner too: the [Ansible guide's rule 5](../../../books/guides/ansible-configuration-automation.md#one-owning-tool-per-setting) names a `patch_owner` field, mirrored to the `PatchOwner` tag. Where Ansible already patches a fleet, Update Manager only assesses those servers and schedules nothing on them (*design guidance*).

Arc doesn't change who owns what. It makes the server an Azure resource, and the tags tell the Azure tools which servers are theirs. [Chapter 07](07-machine-configuration-packages.md)'s enforcing definitions filter on `ConfigOwner`, so machine configuration changes only the servers it owns. Update Manager's dynamic scopes group machines by tags, among other criteria, and are evaluated at each scheduled run, so a scope on `PatchOwner` follows the tag.[^c08-dynscope] The built-in policy for periodic assessment on Arc servers can be scoped by tag too.[^c08-policyref] After the fact, VK-ARC-07 in the [validation kit](03-writing-a-validation-kit-check.md) reports a server whose owner isn't machine configuration but which carries an enforcing machine configuration assignment.

So the tags are written once, at the connect, from the CMDB. That makes the onboarding run the place where owners are read, checked and carried. A server connected without them is open to whichever tool reaches it first.

**Which Azure.** The program's estate is a Microsoft 365 GCC tenant. Learn says Office 365 GCC uses Microsoft Entra Public, and an Azure Government subscription can't be associated with a directory there.[^c08-govident] So a GCC estate's Arc servers go to a commercial subscription, and the agent connects with `--cloud AzureCloud`, the default.[^c08-connect] The agent then needs the commercial endpoints: `login.microsoftonline.com`, `*.login.microsoft.com`, `pas.windows.net`, `management.azure.com` (only to connect or disconnect), `*.his.arc.azure.com` and `*.guestconfiguration.azure.com`, among others.[^c08-network] GCC High and DoD tenants use Microsoft Entra Government and Azure Government: `AzureUSGovernment`, US Gov regions, and the `.us` endpoints.[^c08-govident] [^c08-network]

## Start with Microsoft's sample

### What Learn gives you

Learn documents Arc onboarding with Ansible through the Azure Arc onboarding role in the `azure.azcollection` collection.[^c08-ansible] The role installs the Connected Machine agent and registers each host in the resource group and subscription you give it. It is idempotent: a machine that's already connected is skipped. It doesn't discover machines.

| What Learn's page covers | What it says |
|---|---|
| Permissions | The identity Ansible uses needs **Azure Connected Machine Onboarding** at subscription or resource group scope; `Microsoft.HybridCompute` and `Microsoft.GuestConfiguration` registered[^c08-ansible] |
| Variables | `azure_arc_resource_group`, `azure_arc_subscription_id`, `azure_arc_tenant_id`, `azure_arc_location`, `azure_arc_cloud` (default `AzureCloud`), `azure_arc_tags`, `proxy`[^c08-ansible] |
| Authentication | `auth_source: cli` for development; `auth_source: msi`, the control node's managed identity, recommended for production because it removes stored secrets; in Ansible Automation Platform, a managed identity or a service principal through `auth_source: env`[^c08-ansible] |
| Inventory | Static groups such as `arc_linux`, or dynamic inventories; in Automation Platform, a constructed inventory, including from a CMDB[^c08-ansible] |
| Scale | Run the same playbook across groups; in Automation Platform, schedule the job nightly so new machines are onboarded as they appear[^c08-ansible] |

Learn's planning page adds what the role page doesn't: pilot first, on a representative set of machines that aren't business critical, for at least 30 days, with a written plan that includes rollback.[^c08-plan]

### The pinned copy

The repository keeps an unmodified copy of the role in [`examples/third_party/azure-arc-role`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/azure-arc-role), from [ansible-collections/azure](https://github.com/ansible-collections/azure) at the `v4.2.0` release (commit `afa62c3`, October 30, 2026), with its GPL-3.0-or-later license.[^c08-rolecode] It holds the role's README, defaults, metadata and tasks. Each file's git blob hash was checked against the upstream tree, and the role files in the 4.2.0 package on Ansible Galaxy match them byte for byte.

`snapshot.json` records the commit and the SHA-256 of every file, and a unit test fails if one changes. `examples/ansible/requirements.yml` pins `azure.azcollection` to 4.2.0, and `tests/test_microsoft_role.py` fails if the installed role isn't the pinned copy. The weekly source watch reports new upstream commits to the role. Updating either is a reviewed pull request, the same pattern as [Chapter 01](01-the-hr-to-entra-middleware.md#the-pinned-copy).

Reading the role shows two things Learn's page doesn't say. Its default tag is `ArcSQLServerExtensionDeployment: Disabled`, where Learn's variable table gives `{ archost: "true" }`.[^c08-ansible] And unless `azure_arc_log_enabled` is false, it sends a success or failure signal with the subscription, resource group, tenant and region to the Arc hybrid identity service (`gbl.his.arc.azure.com` in commercial Azure). The chapter follows the code, because the code is what runs. Both are recorded in the verification log.

### What it leaves to you

Running the role offline against a control node with no agent, and reading the pinned copy, shows what it doesn't do. Each row is pinned by a test.

| Microsoft's role, on its own | Why it matters here | What `examples/ansible` adds | Pinned by |
|---|---|---|---|
| Connects whatever hosts the inventory names | A server goes into Azure without the tags that tell machine configuration and Update Manager whether it's theirs | The inventory reads `config_owner` and `patch_owner`, refuses a tool it doesn't know, blocks a candidate without either, and writes `ConfigOwner` and `PatchOwner` into the tags | `test_inventory.py` |
| No waves or batches; Learn's Automation Platform option onboards every new machine on a schedule | A wrong tag, rule or network setting reaches the whole estate in one run; Learn says pilot first[^c08-plan] | `arc_wave` in the CMDB; `-e onboarding_wave=N`; one canary server, then 5, then 25 percent, stopping at the first failure; waves 0 and 1 refuse production servers (*design guidance*) | `test_read_only.py`, `test_local_runs.py` |
| Can't run in check mode on a server without the agent: the install check is skipped, so it decides the agent is installed, then its status read fails | No dry run of what a wave would send | `06_arc_onboarding_role.yml` doesn't call the role without `confirm_change=true`, and prints what each server would get; the wave plan is written first | `test_microsoft_role.py`, `test_local_runs.py` |
| Passing your own tags replaces its default `ArcSQLServerExtensionDeployment: Disabled` | A SQL Server host is auto-onboarded to Arc-enabled SQL Server, which the Arc track says to decide before the connect | The playbook adds the tag back from `arc_sql_extension_deployment` | `test_read_only.py`, `test_local_runs.py` |
| Sends a signal with the subscription, resource group, tenant and region by default; Learn's page doesn't mention it | What leaves the estate should be a decision on record | `arc_role_log_enabled: false` (*design guidance*: on only for a support case) | `test_read_only.py`, `test_microsoft_role.py` |
| Requests its token for `https://management.azure.com/.default` | Right for a GCC estate on commercial Azure; not the Azure Government Resource Manager | `06` refuses any cloud but `AzureCloud`; `02_arc_onboarding.yml` handles Azure Government | `test_microsoft_role.py`, `test_local_runs.py` |
| Passes the access token on the `azcmagent connect` command line, hidden from Ansible's output by `no_log` | The token is visible to other processes on the server while the connect runs; Learn says access tokens are short-lived[^c08-connect] | Accepted for the role; `02` keeps a service principal secret in a root-only `--config` file, as Learn recommends[^c08-connect] | `test_microsoft_role.py` |
| Takes the region and cloud it's given | A US Gov region with `AzureCloud` fails halfway through a wave | The wave plan stops a region from the other cloud | `test_local_runs.py` |
| Leaves no record of what was planned or connected | Gate 3 of the Arc track asks for each wave's evidence | A plan (JSON and CSV) before the run; a result with each server's Arc resource ID after it | `test_local_runs.py` |
| Learn's `requirements.yml` installs the latest collection from Galaxy[^c08-ansible] | A rerun a month later runs a different role | `requirements.yml` pins 4.2.0; the installed role must match the pinned copy | `test_microsoft_role.py` |

**The verdict.** Use Microsoft's role. It does the install and connect, it is the role Learn documents, and the kit calls it unchanged. What the kit adds sits around it: what goes in (owners, wave, tags, cloud), what a dry run shows, how many servers at a time, and what is written down.

## The code: what `examples/ansible` adds

[`examples/ansible`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ansible) already had the CMDB inventory, an assessment, a gated `azcmagent` onboarding playbook and a baseline check. This chapter adds a column, two playbooks and the tests.

### First, the `patch_owner` column

The Ansible guide named `patch_owner`, but the sample CMDB export didn't carry it. It does now, beside `config_owner`, with `arc_wave` after the region:

```text
name,...,management_tier,config_owner,patch_owner,arc_status,arc_resource_group,arc_location,arc_wave,patch_group
app02.contoso.example,...,tier1,arc_machine_configuration,update_manager,not_onboarded,rg-arc-claims-prod,eastus,2,PG-WED-0200
aws01.contoso.example,...,tier1,ansible,ansible,not_onboarded,rg-arc-portal-dev,eastus,1,PG-THU-0100
aix01.contoso.example,...,tier2,ansible,ansible,not_supported,,,,PG-SUN-0300
gm01.contoso.example,...,tier2,ansible,platform,not_supported,,,,PG-NET-0400
```

`aws01` is the guide's case: a Red Hat server on AWS that Ansible configures and patches. It still goes to Arc, for inventory, assessment and Defender, with `PatchOwner=Ansible`, so Update Manager assesses it and schedules nothing. The sample also moved to commercial regions (`eastus`, `westus2`) and `arc_cloud: AzureCloud`, because it is a GCC estate. Resource groups follow the Arc track's `rg-arc-<team>-<env>` pattern.

### The inventory

`inventory/cmdb_inventory.py` turns each owner into a group and a tag:

| CMDB value | Group | Tag value |
|---|---|---|
| `config_owner` = `arc_machine_configuration`, `ansible`, `intune`, `configuration_manager`, `platform` | `config_owner_<value>` | `ConfigOwner` = `ArcMachineConfiguration`, `Ansible`, `Intune`, `ConfigurationManager`, `Platform` |
| `patch_owner` = `update_manager`, `ansible`, `configuration_manager`, `intune`, `platform` | `patch_owner_<value>` | `PatchOwner` = `UpdateManager`, `Ansible`, ... |
| Either empty, or `none`, on a tier 1 or 2 record | `config_owner_missing`, `patch_owner_missing` | none: a CM-8 finding, never a target |
| `arc_wave` = `0`, `1`, ... | `arc_wave_<n>` | none |

The tag values are the Arc track's spellings. VK-ARC-07 compares owners without case or punctuation, so `ArcMachineConfiguration` and `arc_machine_configuration` match.

Three rules fail closed. An owner value the script doesn't know stops it: `updatemanager` would otherwise create a group nothing reads and drop the server out of `patch_owner_update_manager`. A wave that isn't a number stops it. And a tier 1 Linux or Windows server not yet onboarded is a candidate only if its record has both owners, a resource group, a region, a wave, and tag values Arc accepts. Otherwise it goes to `arc_onboarding_blocked`, with `arc_blocked_reasons` saying why. Arc's tag limits are 50 tags per resource and 256 characters per value,[^c08-tags] and `azcmagent connect --tags` is comma-delimited,[^c08-connect] so a comma in a value would split it into a wrong tag.

### The wave plan

`playbooks/05_arc_wave_plan.yml` runs only on the control node. It takes `-e onboarding_wave=N`, lists the wave's ready servers and the ones the CMDB blocked, and writes `arc-wave-N-plan-<time>.json` and `.csv` under `reports/`: host, configuration item, environment, resource group, region, cloud, both owners, the exact tag string, and a state. It stops when:

- no wave is given, or the wave has no ready server;
- `arc_cloud` isn't `AzureCloud` or `AzureUSGovernment`, or a server's region belongs to the other cloud (a `usgov` or `usdod` region needs `AzureUSGovernment`, and no other region does);
- a production server is planned in wave 0 or 1, which the Arc track keeps for non-production (*design guidance*);
- a server has no `config_owner` or `patch_owner`.

Both onboarding playbooks import it as their first play. If the plan stops, no server is contacted.

### Onboarding with Microsoft's role

`playbooks/06_arc_onboarding_role.yml` targets `arc_onboarding_candidates:&arc_wave_{{ onboarding_wave }}`, one canary server, then 5, then 25 percent at a time, with `max_fail_percentage: 0`.[^c08-ans-strategy] Each server is checked again before anything happens: both owners, a resource group, a region, this wave, and `AzureCloud`. Then:

- **Without `confirm_change=true`** the play is in check mode and the role isn't called. Each server prints what it would get, for example `Would connect web01.contoso.example to AzureCloud, resource group rg-arc-portal-dev, region westus2, with tags {...}`. No connection is made to the server.
- **With `confirm_change=true`** the role runs with the CMDB's values, the CMDB tags plus `ArcSQLServerExtensionDeployment`, `azure_arc_log_enabled` from `arc_role_log_enabled` (false by default), and `auth_source` from `arc_auth_source` (`msi` by default). The playbook reads no secret. A last play writes `arc-wave-N-result-<time>.json` with each server's Arc resource ID.

### What changed in the `azcmagent` playbook

`02_arc_onboarding.yml` stays the version that spells the steps out, and the one to use for Azure Government. It now imports the wave plan, targets one wave, and checks both owners on each server. Its dry run also makes no network request any more: `get_url` requested the installer URL even in check mode, which the test found by sending every request to a dead local proxy.

### The tests

| Test file | Tests | What it adds for this chapter |
|---|---|---|
| `test_inventory.py` | 29 | The new column: owner groups and tags, waves, blocked candidates and their reasons, unknown owners and waves fail, the sample is commercial Azure |
| `test_read_only.py` | 39 | Both onboarding playbooks start with the plan, target one wave, check both owners, run in batches and are gated; Microsoft's role only with `confirm_change`, with the CMDB's values |
| `test_local_runs.py` | 14 | The plan is written, and stops on an empty wave, a production server in the pilot, a region from the other cloud and a missing patch owner; both dry runs leave nothing behind and make no network request; 06 refuses Azure Government |
| `test_microsoft_role.py` | 8 | What the pinned role does (token scope, default tag, signal, token on the command line, no owners or waves); the installed role is the pinned copy; the role can't dry-run |

`run_all.sh` runs `yamllint --strict`, `ansible-lint --strict` with the production profile, a syntax check of all six playbooks, and the tests.

::: {.callout-important}
## Illustrative code
The kit calls Microsoft's role unchanged, and its own checks are tested against the sample CMDB, fixtures and offline runs on a control node. The connect itself, with a managed identity, is shown only in Lab 2. Review the code, and run Lab 2, before it onboards a production wave.
:::

## Lab 1: offline, no subscription

You need a Linux control node, or WSL, with Python 3.10 or later, `ansible-core`, `ansible-lint`, `yamllint` and `pytest`. Step 3 runs Microsoft's role as root against the control node itself, so use a disposable one with no Connected Machine agent. Nothing in this lab signs in to Azure or contacts a server: step 1 points every outbound request at a dead local proxy after the collections are installed.

1. **Set up**, from `examples/ansible`:

   ```bash
   ansible-galaxy collection install -r requirements.yml      # from a reviewed source; includes azure.azcollection 4.2.0
   export ANSIBLE_CONFIG="$PWD/ansible.cfg"
   export HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 https_proxy=$HTTPS_PROXY http_proxy=$HTTP_PROXY
   ```

2. **See what the CMDB becomes:**

   ```bash
   ansible-inventory --graph arc_onboarding_candidates
   ansible-inventory --graph patch_owner_ansible
   ansible-inventory --host aws01.contoso.example
   ```

   Four candidates: `app02`, `aws01`, `web01`, `win01`. `patch_owner_ansible` holds `aix01`, `aws01`, `lab01`, `rtr01` and `sol01`. `aws01`'s `arc_tags` carry `ConfigOwner: Ansible` and `PatchOwner: Ansible`.

3. **Run Microsoft's role, unchanged, in check mode:**

   ```bash
   ansible-playbook -i localhost, -c local --check tests/fixtures/microsoft_role_check.yml
   ```

   The fixture gives the region, so the role doesn't look up the resource group, and turns its signal off. The run fails at `Get azcmagent status` with `No such file or directory: b'azcmagent'` (`ok=8`, `failed=1`, `skipped=19`, exit `2`). Add `-v` and look at `Set azcmagent installed fact`: `azure_arc_azcmagent_installed: true`, because check mode skipped the version check with `rc` 0. That is the dry run the role can't do.

4. **Plan wave 0:**

   ```bash
   ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0
   ```

   `Wave 0 is ready: 1 to connect, 0 blocked in the CMDB.` Open the CSV in `reports/`: one row, `web01.contoso.example`, `rg-arc-portal-dev`, `westus2`, `AzureCloud`, state `ready`, and the tag string `CmdbCi=CI0001003,ConfigOwner=ArcMachineConfiguration,Environment=nonproduction,Location=dc-west,Owner=team-portal,PatchGroup=PG-TUE-2200,PatchOwner=UpdateManager`.

5. **Dry-run the wave with Microsoft's role:**

   ```bash
   ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0
   ```

   Exit `0`. `web01` reports `Would connect web01.contoso.example to AzureCloud, resource group rg-arc-portal-dev, region westus2`, with the tags above plus `"ArcSQLServerExtensionDeployment": "Disabled"`, authenticating with `msi`. `Connect with Microsoft's role` is skipped. `web01` doesn't exist, and nothing tried to reach it.

6. **Break the CMDB on purpose**, in copies of the export:

   ```bash
   sed 's/^web01\(.*\),nonproduction,/web01\1,production,/' inventory/sample/cmdb_export.csv > /tmp/prod-in-pilot.csv
   CMDB_CSV=/tmp/prod-in-pilot.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0

   sed 's/,update_manager,not_onboarded,rg-arc-claims-prod/,updatemanager,not_onboarded,rg-arc-claims-prod/' \
       inventory/sample/cmdb_export.csv > /tmp/typo.csv
   CMDB_CSV=/tmp/typo.csv python3 inventory/cmdb_inventory.py --list
   ```

   The first stops with `Wave 0 isn't ready: web01.contoso.example.`, exit `2`; the plan says `production server in non-production wave 0`. The second exits `1` with `line 3: unknown patch_owner 'updatemanager'`. Now clear `app02`'s `patch_owner` in a copy and plan wave 2: `Wave 2 is ready: 1 to connect, 1 blocked in the CMDB.` The plan lists `win01` as `ready` and `app02` as `blocked`, `no patch_owner`.

7. **Run the tests:**

   ```bash
   bash tests/run_all.sh
   ```

**Expected result:** yamllint and ansible-lint pass (`Profile 'production' was required, and it passed`), six playbooks pass the syntax check, and 90 tests pass as root. On Windows with Python and PyYAML, `python -m pytest examples/ansible/tests` gives 74 passed and 16 skipped.

## Lab 2: test subscription and a disposable server

Use a commercial test subscription in the GCC tenant and a Linux server you can rebuild, never production. Run the control node on an Azure VM or an Arc-enabled server, so it has a managed identity.

1. **Prepare the subscription.** Create `rg-arc-test-dev` in a commercial region. Register `Microsoft.HybridCompute` and `Microsoft.GuestConfiguration`.[^c08-ansible] Check the server can reach the commercial Arc endpoints, or run `azcmagent check` from it.[^c08-network]
2. **Grant the control node the onboarding role, and only that.** Assign **Azure Connected Machine Onboarding** to its managed identity on `rg-arc-test-dev`, with Learn's `az role assignment create` command at resource group scope.[^c08-ansible] The role can read and create Arc servers; it can't delete them.[^c08-security] Learn's role reference also lists `addExtensions` in it, so treat it as able to add extensions and remove the assignment when the wave closes.
3. **Install the role's requirements** on the control node: the pinned collections, then the collection's Python requirements, as Learn's Ansible setup page shows.[^c08-ansiblevm]
4. **Write a one-server CMDB export** for the disposable server: tier 1, `config_owner` `ansible`, `patch_owner` `ansible`, `arc_status` `not_onboarded`, `rg-arc-test-dev`, the region, `nonproduction`, wave `0`. Point `CMDB_CSV` at it and set the test tenant and subscription IDs in a copy of `group_vars/all.yml`.
5. **Plan, dry-run, then connect:**

   ```bash
   ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0
   ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0
   ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0 -e confirm_change=true
   ```

6. **Check the result.** On the server, `azcmagent show` reports Connected. In Azure, the machine carries `ConfigOwner=Ansible`, `PatchOwner=Ansible` and `ArcSQLServerExtensionDeployment=Disabled`, and its resource ID matches the result file. Run VK-ARC-01 with the test export: tag values equal the CMDB's. Run VK-ARC-07: no finding, because nothing enforcing is assigned.
7. **Back it out**, in Learn's order: remove any extensions, then `azcmagent disconnect` with an identity that may delete the resource (Azure Connected Machine Resource Administrator; the onboarding role can't), then uninstall the agent (`apt purge azcmagent` or `yum remove azcmagent`).[^c08-uninstall] [^c08-disconnect] [^c08-security] Remove the role assignment, delete `rg-arc-test-dev`, and rebuild the server. File the plan, result and back-out record with the change.

## Verified facts

| Item | Value | Source |
|---|---|---|
| Microsoft's Ansible path | The Azure Arc onboarding role in `azure.azcollection`, for Ansible Core or Ansible Automation Platform; idempotent; doesn't discover machines | [^c08-ansible] |
| Least-privileged role to onboard | Azure Connected Machine Onboarding at subscription or resource group scope; it can read and create Arc servers, not delete them. Learn's security page says it can't manage extensions, but the built-in roles page lists `Microsoft.HybridCompute/machines/addExtensions/action` in it: the stricter reading is that it can add extensions | [^c08-ansible] [^c08-security] |
| To disconnect | An identity with permission to delete the resource, such as Azure Connected Machine Resource Administrator | [^c08-security] [^c08-uninstall] |
| Resource providers | `Microsoft.HybridCompute`, `Microsoft.GuestConfiguration` | [^c08-ansible] |
| Authentication | `msi` recommended for production; `cli` for development; service principal through Automation Platform | [^c08-ansible] |
| Cloud for a GCC tenant | Commercial: Office 365 GCC uses Microsoft Entra Public, and an Azure Government subscription can't be associated with it; `--cloud` defaults to `AzureCloud` | [^c08-govident] [^c08-connect] |
| Commercial endpoints | `login.microsoftonline.com`, `*.login.microsoft.com`, `pas.windows.net`, `management.azure.com` (connect and disconnect only), `*.his.arc.azure.com`, `*.guestconfiguration.azure.com`, notification service endpoints | [^c08-network] |
| Azure Government (GCC High, DoD) | `AzureUSGovernment`; `login.microsoftonline.us`, `management.usgovcloudapi.net`, `*.his.arc.azure.us`, `*.guestconfiguration.azure.us` | [^c08-connect] [^c08-network] |
| Tags at connect | `--tags`, comma-delimited `Name=Value` pairs; at most 50 tags per resource, values up to 256 characters | [^c08-connect] [^c08-tags] |
| Secrets at connect | Microsoft recommends a configuration file (`--config`) for a service principal secret; access tokens are short-lived | [^c08-connect] |
| Pilot | A representative, non-critical set, at least 30 days, with a rollback plan | [^c08-plan] |
| Update Manager dynamic scope | Groups machines by subscription, resource group, location, resource type, OS type and tags, evaluated at run time; Arc servers have no patch orchestration prerequisite | [^c08-dynscope] |
| Release stage | Generally available: Learn's role page and the role carry no preview label. `--enable-automatic-upgrade` on `azcmagent connect` is in public preview, and the kit doesn't use it | [^c08-ansible] [^c08-connect] |

`serial` and `max_fail_percentage` are Ansible's, and Learn has no page on them.[^c08-ans-strategy] The role's behavior in check mode, its token scope, its default tag and its signal come from the pinned code and from running it, not from Learn.[^c08-rolecode]

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A server connected without its owner tags | Machine configuration or Update Manager treats it as theirs, or as nobody's | Candidates need both owners; `ConfigOwner` and `PatchOwner` in every connect; VK-ARC-07 after |
| A typo in an owner value | The server falls out of the group that protects it and into one nothing reads | The inventory refuses an unknown owner tool |
| Two tools patching one server | Update Manager schedules updates on a server Ansible also patches | `PatchOwner` tag; scope Update Manager schedules on `UpdateManager` only (*design guidance*) |
| The whole estate in one run | A wrong tag, rule or network setting reaches every server | CMDB waves; the plan first; one canary, then 5, then 25 percent; stop at the first failure |
| Production in the pilot | The wave meant to find problems finds them in production | Waves 0 and 1 refuse production servers |
| A dry run that isn't one | The role fails in check mode, so people skip the dry run, or a dry run reaches the network | 06 doesn't call the role without `confirm_change`; 02's download is skipped in a dry run; both tested behind a dead proxy |
| The wrong cloud | A GCC estate's servers in Azure Government, or the role's commercial token used for Azure Government | `arc_cloud: AzureCloud` in the sample; the plan stops a region from the other cloud; 06 refuses `AzureUSGovernment` |
| SQL Server auto-onboarded by accident | Passing the CMDB tags drops the role's `ArcSQLServerExtensionDeployment` default | The playbook adds it back from `arc_sql_extension_deployment` |
| Data sent without a decision | The role's signal carries subscription, resource group, tenant and region | Off by default (*design guidance*) |
| A stored onboarding secret | A stolen credential connects outside servers into the subscription | Managed identity (`msi`), as Learn recommends; the onboarding role only, on the wave's resource group, removed when the wave closes |
| A floating role | A rerun installs a newer role that behaves differently | `requirements.yml` pins 4.2.0; the installed role must match the pinned copy |
| A tag value Arc splits or refuses | A comma makes a second, wrong tag; a long value fails the connect | The inventory blocks the server with the reason |

## Checklist

- [ ] The CMDB export carries `config_owner`, `patch_owner` and `arc_wave` for every tier 1 server; `config_owner_missing` and `patch_owner_missing` are empty, or each entry has a ticket.
- [ ] `arc_cloud` matches the tenant: `AzureCloud` for GCC, `AzureUSGovernment` for GCC High and DoD (and `02_arc_onboarding.yml` there).
- [ ] The wave plan for this wave was reviewed and filed before the run, and its blocked list is understood.
- [ ] The dry run was run, and its output matches the plan.
- [ ] The onboarding identity holds only Azure Connected Machine Onboarding, on the wave's resource groups; a managed identity where the control node can have one.
- [ ] `arc_role_log_enabled` and `arc_sql_extension_deployment` are decisions on record.
- [ ] Wave 0 ran on non-production servers for at least 30 days before production waves.
- [ ] After the run: the result file's resource IDs match Azure, VK-ARC-01 shows the CMDB's tag values, and VK-ARC-07 is clean.
- [ ] The installed role matches the pinned copy, and every upstream commit to the role since the pin has been reviewed.
- [ ] `bash tests/run_all.sh` passes on the control node.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — Machine Configuration Packages](07-machine-configuration-packages.md) · [Book index](index.md)
:::

[^c08-ansible]: Microsoft Learn, "Connect machines to Azure Arc at scale with Ansible," <https://learn.microsoft.com/azure/azure-arc/servers/onboard-ansible-playbooks> (accessed Oct 30, 2026).
[^c08-connect]: Microsoft Learn, "azcmagent connect," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-connect> (accessed Oct 30, 2026).
[^c08-network]: Microsoft Learn, "Connected Machine agent network requirements," <https://learn.microsoft.com/azure/azure-arc/servers/network-requirements> (accessed Oct 30, 2026).
[^c08-govident]: Microsoft Learn, "Planning identity for Azure Government applications," <https://learn.microsoft.com/azure/azure-government/documentation-government-plan-identity> (accessed Oct 30, 2026).
[^c08-security]: Microsoft Learn, "Identity and authorization" (Azure Arc-enabled servers security), <https://learn.microsoft.com/azure/azure-arc/servers/security-identity-authorization> (accessed Oct 30, 2026); Microsoft Learn, "Azure built-in roles for Management and governance," <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/management-and-governance> (accessed Oct 30, 2026).
[^c08-plan]: Microsoft Learn, "Plan and deploy Azure Arc-enabled servers," <https://learn.microsoft.com/azure/azure-arc/servers/plan-at-scale-deployment> (accessed Oct 30, 2026).
[^c08-tags]: Microsoft Learn, "Use tags to organize your Azure resources and management hierarchy," <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources> (accessed Oct 30, 2026).
[^c08-dynscope]: Microsoft Learn, "About dynamic scoping" (Azure Update Manager), <https://learn.microsoft.com/azure/update-manager/dynamic-scope-overview> (accessed Oct 30, 2026).
[^c08-policyref]: Microsoft Learn, "Azure Policy built-in definitions for Azure Arc-enabled servers," <https://learn.microsoft.com/azure/azure-arc/servers/policy-reference> (accessed Oct 30, 2026).
[^c08-uninstall]: Microsoft Learn, "Uninstall the Azure Connected Machine agent from Arc-enabled servers," <https://learn.microsoft.com/azure/azure-arc/servers/uninstall-agent> (accessed Oct 30, 2026).
[^c08-disconnect]: Microsoft Learn, "azcmagent disconnect," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-disconnect> (accessed Oct 30, 2026).
[^c08-ansiblevm]: Microsoft Learn, "Get Started: Configure Ansible on an Azure VM," <https://learn.microsoft.com/azure/developer/ansible/install-on-linux-vm> (accessed Oct 30, 2026).
[^c08-rolecode]: Microsoft and the Ansible community, `azure.azcollection` `azure_arc` role, ansible-collections/azure, `roles/azure_arc` at commit `afa62c3bcf3e283645336039e13c8e3019b8fcdd` (release v4.2.0, October 30, 2026), GPL-3.0-or-later, <https://github.com/ansible-collections/azure/tree/afa62c3bcf3e283645336039e13c8e3019b8fcdd/roles/azure_arc> (accessed Oct 30, 2026); pinned copy in `examples/third_party/azure-arc-role`. Not a Learn page: Learn's role page links the role's Galaxy listing.
[^c08-ans-strategy]: Ansible documentation, "Controlling playbook execution: strategies and more," <https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html> (accessed Oct 30, 2026). Not a Learn page: Learn has no page on Ansible's batch keywords.
