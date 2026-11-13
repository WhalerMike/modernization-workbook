---
title: "Attribute-Driven Migration, Module 6: Onboard Servers with Ansible beside Arc"
subtitle: "Onboard one wave of servers to Azure Arc with Microsoft's role, from a CMDB export, with every server tagged with the tool that owns its settings and the tool that patches it, and a plan a reviewer reads before anything runs"
description: "Research draft: Module 6 of the Attribute-Driven Migration learning path. You learn why each server has one configuration owner and one patch owner, what Microsoft's azure_arc role leaves to you, the CMDB inventory that turns owners into groups and tags, the wave plan and the dry run the role can't do, then run the inventory, the role in check mode, the plan and the dry run offline, and break the CMDB on purpose. Guide Gates 5 and 8; Book 19, Chapter 08."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 6
date-modified: 2026-11-02
review-status: approved
reviewed-sha256: 0af4a0aaa57b01039ef392607ee1365427c2dea15173beb7fcdc88f3afa4584a
last-reviewed: 2026-11-07
---
# Attribute-Driven Migration, Module 6: Onboard Servers with Ansible beside Arc {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 6 of 9 · 45 minutes · Guide [Gate 5](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) and [Gate 8](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) · Workbook [Chapter 08](../../books/b19-developer-workbook/08-ansible-beside-arc.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_ADM_Module_6.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_6_Narrated) (about 16 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_6_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-6/Training_ADM_Module_6_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-6/Training_ADM_Module_6_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_08_Ansible_Beside_Arc_Narrated).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Gate 5's server convention says an Arc server's tags are its attributes, drawn from the asset record at onboarding. Gate 8 writes each wave as a query: servers by resource group and tag. Microsoft's `azure_arc` role connects whatever hosts the inventory names, with no waves and no dry run on a server without the agent. In this module you read the CMDB into groups and tags, plan a wave, and see what each server would get before anything is contacted.

**The federal requirement.** Onboarding to Arc writes each server's owners into Azure from the CMDB, so the plan, the result and the tags are inventory and change evidence. From [Chapter 08's table](../../books/b19-developer-workbook/08-ansible-beside-arc.md#federal-requirements-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| CM-8 System Component Inventory: each server's configuration and patch owner become groups and tags | KSI-PIY-GIV | The CMDB export |
| CM-3; CM-4: the wave is planned and written before anything runs | KSI-CMT-LMC | `reports/arc-wave-0-plan-<time>.json` and `.csv`, with the change record |
| CM-3(2): the dry run shows what each server would get, without contacting it | KSI-CMT-VTD | The change record |
| CM-8; CM-3: production in the pilot, an unknown owner and a missing owner each stop or block | KSI-PIY-GIV; KSI-CMT-VTD | The plan, and the CMDB ticket for the missing owner |
| SR-3; SA-10: the collections are the pinned versions | KSI-SCR-MIT | `requirements.yml` and `snapshot.json` |
| AC-6; IA-5: the onboarding identity holds one role, on one resource group, with a managed identity (Lab 2) | KSI-IAM-ELP; KSI-IAM-SNU | The Azure role assignment record |
| CM-8(1) Updates During Installation and Removal; CA-7: the server is connected and its tags equal the CMDB's (Lab 2) | KSI-PIY-GIV; KSI-MLA-EVC | `arc-wave-0-result-<time>.json`, VK-ARC-01 and VK-ARC-07 |

: Chapter 08's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Explain why each server records one configuration owner and one patch owner, and where each tag is read.
- Describe what Microsoft's `azure_arc` role leaves to you.
- Run the CMDB inventory, and say what makes it stop.
- Plan a wave and read the plan, before anything runs.
- Explain why the role can't dry-run a server without the agent, and what the playbook does instead.

### Prerequisites

- [Module 5](05-machine-configuration.md): its enforcing definitions filter on the `ConfigOwner` tag this module writes.
- A disposable Linux control node, or WSL, with Python 3.10 or later, `ansible-core`, `ansible-lint`, `yamllint` and `pytest`. Step 3 runs Microsoft's role as root against the control node itself.

## Unit 2: One owner for configuration, one for patching

*8 minutes*

The CMDB records `config_owner` and `patch_owner` for each asset, and the Arc track mirrors them to the `ConfigOwner` and `PatchOwner` tags. Machine configuration changes only the servers it owns; Update Manager's dynamic scopes follow the patch tag. Microsoft's role connects hosts but writes neither owner. Read:

- The guide's [Gate 5, step 7](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) and [Gate 8, step 1](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree).
- [Chapter 08: where Ansible sits beside Arc](../../books/b19-developer-workbook/08-ansible-beside-arc.md#where-ansible-sits-beside-arc).
- [Chapter 08: what Microsoft's role leaves to you](../../books/b19-developer-workbook/08-ansible-beside-arc.md#what-it-leaves-to-you).

## Unit 3: The inventory and the wave plan

*8 minutes*

The inventory turns each owner into a group and a tag, and fails closed on an owner value it doesn't know. The wave plan runs only on the control node, lists the wave's ready and blocked servers, and stops on a production server in wave 0 or 1 or a region in the wrong cloud. A missing owner blocks that server in the inventory, and the plan lists it as blocked. The onboarding playbook is in check mode unless you confirm the change. Read:

- [First, the `patch_owner` column](../../books/b19-developer-workbook/08-ansible-beside-arc.md#first-the-patch_owner-column).
- [The inventory](../../books/b19-developer-workbook/08-ansible-beside-arc.md#the-inventory).
- [The wave plan](../../books/b19-developer-workbook/08-ansible-beside-arc.md#the-wave-plan) and [onboarding with Microsoft's role](../../books/b19-developer-workbook/08-ansible-beside-arc.md#onboarding-with-microsofts-role).

## Unit 4: Exercise: Lab 1 (offline, no subscription)

*17 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/ansible`. Each step below says what it does and what to look for.

```bash
# Step 1: Set up
ansible-galaxy collection install -r requirements.yml      # from a reviewed source; includes azure.azcollection 4.2.0
export ANSIBLE_CONFIG="$PWD/ansible.cfg"
export HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 https_proxy=$HTTPS_PROXY http_proxy=$HTTP_PROXY

# Step 2: See what the CMDB becomes
ansible-inventory --graph arc_onboarding_candidates
ansible-inventory --graph patch_owner_ansible
ansible-inventory --host aws01.contoso.example

# Step 3: Run Microsoft's role, unchanged, in check mode
ansible-playbook -i localhost, -c local --check tests/fixtures/microsoft_role_check.yml

# Step 3: Run Microsoft's role, unchanged, in check mode
ansible-playbook -i localhost, -c local --check -v tests/fixtures/microsoft_role_check.yml

# Step 4: Plan wave 0
ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0

# Step 4: Plan wave 0
cat "$(ls -t reports/arc-wave-0-plan-*.csv | head -n 1)"

# Step 5: Dry-run the wave with Microsoft's role
ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0

# Step 6: Break the CMDB on purpose
sed 's/^web01\(.*\),nonproduction,/web01\1,production,/' inventory/sample/cmdb_export.csv > /tmp/prod-in-pilot.csv
CMDB_CSV=/tmp/prod-in-pilot.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0
sed 's/,update_manager,not_onboarded,rg-arc-claims-prod/,updatemanager,not_onboarded,rg-arc-claims-prod/' \
    inventory/sample/cmdb_export.csv > /tmp/typo.csv
CMDB_CSV=/tmp/typo.csv python3 inventory/cmdb_inventory.py --list

# Step 6: Break the CMDB on purpose
sed '/^app02/s/,update_manager,not_onboarded,/,,not_onboarded,/' inventory/sample/cmdb_export.csv > /tmp/no-owner.csv
CMDB_CSV=/tmp/no-owner.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=2
cat "$(ls -t reports/arc-wave-2-plan-*.csv | head -n 1)"

# Step 7: Run the tests
bash tests/run_all.sh
```

:::

<!-- labs:end -->

You read the CMDB, run Microsoft's role in check mode, plan wave 0, dry-run it, and break the CMDB on purpose. Work in `examples/ansible`, on a disposable Linux control node. Nothing signs in to Azure or contacts a server: step 1 points every outbound request at a dead local proxy after the collections are installed. These are the steps of [Chapter 08, Lab 1](../../books/b19-developer-workbook/08-ansible-beside-arc.md#lab-1-offline-no-subscription), which explains each result. The expected results below are the chapter's.

1. **Set up.** Install the pinned collections from a reviewed source, then cut off the network:

   ```bash
   ansible-galaxy collection install -r requirements.yml      # from a reviewed source; includes azure.azcollection 4.2.0
   export ANSIBLE_CONFIG="$PWD/ansible.cfg"
   export HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 https_proxy=$HTTPS_PROXY http_proxy=$HTTP_PROXY
   ```

2. **See what the CMDB becomes.**

   ```bash
   ansible-inventory --graph arc_onboarding_candidates
   ansible-inventory --graph patch_owner_ansible
   ansible-inventory --host aws01.contoso.example
   ```

   Expected: four candidates, `app02`, `aws01`, `web01` and `win01`. `patch_owner_ansible` holds `aix01`, `aws01`, `lab01`, `rtr01` and `sol01`. `aws01`'s `arc_tags` carry `ConfigOwner: Ansible` and `PatchOwner: Ansible`.

3. **Run Microsoft's role, unchanged, in check mode.**

   ```bash
   ansible-playbook -i localhost, -c local --check tests/fixtures/microsoft_role_check.yml
   ```

   Expected: the run fails at `Get azcmagent status` with `No such file or directory: b'azcmagent'` (`ok=8`, `failed=1`, `skipped=19`, exit 2). Run it again with `-v`:

   ```bash
   ansible-playbook -i localhost, -c local --check -v tests/fixtures/microsoft_role_check.yml
   ```

   Expected: `Set azcmagent installed fact` shows `azure_arc_azcmagent_installed: true`, because check mode skipped the version check. That is the dry run the role can't do.

4. **Plan wave 0.**

   ```bash
   ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0
   ```

   Expected: `Wave 0 is ready: 1 to connect, 0 blocked in the CMDB.` Show the newest wave 0 plan:

   ```bash
   cat "$(ls -t reports/arc-wave-0-plan-*.csv | head -n 1)"
   ```

   Expected: one row, `web01.contoso.example`, in `rg-arc-portal-dev`, `westus2`, `AzureCloud`, state `ready`, with the tag string `CmdbCi=CI0001003,ConfigOwner=ArcMachineConfiguration,Environment=nonproduction,Location=dc-west,Owner=team-portal,PatchGroup=PG-TUE-2200,PatchOwner=UpdateManager`.

5. **Dry-run the wave with Microsoft's role.**

   ```bash
   ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0
   ```

   Expected: exit 0. `web01` reports `Would connect web01.contoso.example to AzureCloud, resource group rg-arc-portal-dev, region westus2`, authenticating with `msi`, and `Connect with Microsoft's role` is skipped. Nothing tried to reach the server.

6. **Break the CMDB on purpose**, in copies of the export:

   ```bash
   sed 's/^web01\(.*\),nonproduction,/web01\1,production,/' inventory/sample/cmdb_export.csv > /tmp/prod-in-pilot.csv
   CMDB_CSV=/tmp/prod-in-pilot.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0
   sed 's/,update_manager,not_onboarded,rg-arc-claims-prod/,updatemanager,not_onboarded,rg-arc-claims-prod/' \
       inventory/sample/cmdb_export.csv > /tmp/typo.csv
   CMDB_CSV=/tmp/typo.csv python3 inventory/cmdb_inventory.py --list
   ```

   Expected: the first stops with `Wave 0 isn't ready: web01.contoso.example.`, exit 2, and the plan says `production server in non-production wave 0`. The second exits 1 with `line 3: unknown patch_owner 'updatemanager'`. Now clear `app02`'s `patch_owner` in a copy, and plan wave 2:

   ```bash
   sed '/^app02/s/,update_manager,not_onboarded,/,,not_onboarded,/' inventory/sample/cmdb_export.csv > /tmp/no-owner.csv
   CMDB_CSV=/tmp/no-owner.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=2
   cat "$(ls -t reports/arc-wave-2-plan-*.csv | head -n 1)"
   ```

   Expected: `Wave 2 is ready: 1 to connect, 1 blocked in the CMDB.` The plan lists `win01` as `ready`, and `app02` as `blocked`, `no patch_owner`.

7. **Run the tests.**

   ```bash
   bash tests/run_all.sh
   ```

   Expected: yamllint and ansible-lint pass (`Profile 'production' was required, and it passed`), six playbooks pass the syntax check, and 88 tests pass as root. On Windows with Python and PyYAML, `python -m pytest examples/ansible/tests` from the repository root gives 74 passed and 14 skipped.

**Check your work:** for any server in the CMDB, you can say whether it's a candidate, which wave it's in, which tags it would get, and what would stop or block it.

## Unit 5: Exercise: Lab 2 (your test subscription)

*Not timed. Not run by the authors.*

Create a test resource group, grant the control node's managed identity the Azure Connected Machine Onboarding role on it and nothing else, write a one-server CMDB export for a disposable server, then plan, dry-run and connect it, and check that its tags equal the CMDB's. Follow [Chapter 08, Lab 2](../../books/b19-developer-workbook/08-ansible-beside-arc.md#lab-2-test-subscription-and-a-disposable-server).

- **You need:** a commercial test subscription in the GCC tenant, a Linux server you can rebuild, never production, and a control node with a managed identity.
- **Back it out:** step 7, in Learn's order: remove extensions, disconnect with an identity that may delete the resource, uninstall the agent, and remove the role assignment.

## Unit 6: Knowledge check

*5 minutes*

1. Why does the inventory stop on `patch_owner` `updatemanager`?
   a. The value is too long.
   b. An owner value it doesn't know would create a group nothing reads and drop the server out of `patch_owner_update_manager`.
   c. Update Manager can't patch Linux.

2. Microsoft's role runs in check mode on a host without the agent. What happens?
   a. It reports exactly what it would change.
   b. It fails at `Get azcmagent status`, and with the version check skipped it decides the agent is installed.
   c. It installs the agent.

3. The wave 0 plan finds a production server. What happens?
   a. The server is connected with a warning.
   b. The plan stops, and no server is contacted: waves 0 and 1 are for non-production.
   c. The server moves to wave 2.

4. You run the onboarding playbook without `confirm_change=true`. What does it do?
   a. It connects the wave.
   b. It runs in check mode: each server prints what it would get, and the role isn't called.
   c. It refuses to start.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [the inventory](../../books/b19-developer-workbook/08-ansible-beside-arc.md#the-inventory) and step 6 of the lab.
2. **b.** See [what Microsoft's role leaves to you](../../books/b19-developer-workbook/08-ansible-beside-arc.md#what-it-leaves-to-you) and step 3 of the lab.
3. **b.** See [the wave plan](../../books/b19-developer-workbook/08-ansible-beside-arc.md#the-wave-plan) and step 6 of the lab.
4. **b.** See [onboarding with Microsoft's role](../../books/b19-developer-workbook/08-ansible-beside-arc.md#onboarding-with-microsofts-role) and step 5 of the lab.
:::

## Unit 7: Summary

*2 minutes*

You read the CMDB into groups and tags with both owners, planned a wave a reviewer can read before anything runs, and saw the dry run Microsoft's role can't do.

**Evidence an ISSO keeps from this module:** the CMDB export, each wave's plan and result files with the change record, `requirements.yml` and `snapshot.json`, and in Lab 2 the role assignment record, VK-ARC-01 and VK-ARC-07, and the back-out record. Gate 8's per-wave evidence is in the guide's [Gate 8](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree). Before shipping, work through the [Chapter 08 checklist](../../books/b19-developer-workbook/08-ansible-beside-arc.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 5](05-machine-configuration.md) · [Learning path](index.md) · [Next: Module 7, Extend Lifecycle Workflows →](07-lifecycle-workflows-extensions.md)
:::
