# Ansible examples: CMDB-driven inventory, assessment, Arc onboarding and drift

> **Status: illustrative. Tested with ansible-core and against the control node, not proven against a live estate.**
> These playbooks go with the companion guide [Ansible for Configuration Automation](../../docs/books/guides/ansible-configuration-automation.md). They show the patterns the guide recommends: the CMDB as the inventory's attribute source, read-only by default, one owning tool per setting, a gate on the one playbook that changes servers, and reports the program can keep as evidence. Review every task, pin the collections from a source you've reviewed, and run them first in a test environment. They aren't an endorsement by any agency, and no agency has adopted them.

**Download:** [ansible-examples.zip](https://whalermike.github.io/modernization-workbook/downloads/ansible-examples.zip), rebuilt from this folder on every site deploy. **Source:** [examples/ansible](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ansible). The relative links to the books work in the repository; from the zip, open them on the [workbook site](https://whalermike.github.io/modernization-workbook/). The zip also holds a plain-text copy of every playbook, script and data file, named with `.txt` added (`02_arc_onboarding.yml.txt`), for tools such as Microsoft 365 Copilot and mail systems that refuse some file types. The copies are identical to the originals; run the originals.

## What's here

| Playbook | What it does | Changes targets? |
|---|---|---|
| `01_inventory_assessment.yml` | Gathers the minimal facts from every managed Linux, Unix and Windows server, checks for the Azure Connected Machine agent and reads its status, and writes a CSV and a JSON file with the CMDB's record and what was observed side by side: the CM-8 feed. Every CMDB record gets a row; one nothing reached says `not_collected`. | No |
| `02_arc_onboarding.yml` | Installs and connects the Connected Machine agent with `azcmagent`, one CMDB wave at a time, on the tier 1 servers the CMDB says aren't connected and are ready, with tags from the CMDB record. Runs the wave plan (05) first. Runs in check mode, with no network request, unless `-e confirm_change=true`; one canary host first, then 5, then 25 percent at a time, stopping at the first failure. Commercial Azure or Azure Government. | Only with `confirm_change=true` |
| `03_linux_baseline_check.yml` | Compares a handful of example settings (SSH, password age, auditd, two packages that should be absent) on the Linux hosts whose CMDB record names Ansible as the configuration owner, and reports drift. Pinned to check mode by the play itself. | No |
| `04_network_and_ddi_facts.yml` | Reads Cisco IOS facts and the Infoblox Grid's members through the NIOS WAPI, and writes a CSV feed. | No |
| `05_arc_wave_plan.yml` | Plans one Arc onboarding wave (`-e onboarding_wave=N`) from the CMDB: the ready servers, their resource group, region and tags (`ConfigOwner` and `PatchOwner` included), and the servers the CMDB blocked, written as a plan on the control node. Stops on an empty wave, a region from the other cloud, a production server in a non-production wave, or a missing owner. | No |
| `06_arc_onboarding_role.yml` | The same waves with Microsoft's own `azure.azcollection.azure_arc` role, which Learn documents. Runs the wave plan first; without `confirm_change=true` it doesn't call the role (the role can't dry-run a server that has no agent) and reports what it would send. Commercial Azure only. | Only with `confirm_change=true` |

The inventory is `inventory/cmdb_inventory.py`, a dynamic inventory script that reads a CSV export from the CMDB (`CMDB_CSV`, or the fictional `inventory/sample/cmdb_export.csv`). The CMDB stays the origin of every business fact ([Book 05, Chapter 03](../../docs/books/b05-devices/03-where-device-and-server-data-lives.md#the-procurement-record-and-the-cmdb)); the script only reads it. It builds groups from the record's attributes:

| Group | From the CMDB column | Used by |
|---|---|---|
| `managed`, `unmanaged`, `tier_1` to `tier_4` | `management_tier`: 1 Intune or Arc, 2 the platform's own tool with an evidence feed, 3 discovered only, 4 segmented or retired | All: no playbook targets `unmanaged` |
| `os_linux`, `os_unix`, `os_windows`, `os_network_ios`, `os_infoblox_nios`, `os_vmware_vcenter` | `os_family` | Each play's `hosts:` |
| `config_owner_ansible`, `config_owner_arc_machine_configuration` | `config_owner`: the one tool that owns the asset's settings | `03_linux_baseline_check.yml` runs only on `config_owner_ansible`; mirrored to the Arc `ConfigOwner` tag |
| `patch_owner_update_manager`, `patch_owner_ansible`, `patch_owner_platform` | `patch_owner`: the one tool that patches the asset | Mirrored to the Arc `PatchOwner` tag, which Update Manager's dynamic scopes can filter on; Update Manager only assesses servers it doesn't own |
| `config_owner_missing`, `patch_owner_missing` | Either column empty, or `none`, on a tier 1 or 2 record | A CM-8 finding to fix in the CMDB, never a target |
| `arc_onboarding_candidates` | Tier 1, Linux or Windows, `arc_status` = `not_onboarded`, and a record with both owners, a resource group, a region, a wave and tag values Arc accepts | `02_arc_onboarding.yml`, `06_arc_onboarding_role.yml` |
| `arc_onboarding_blocked` | The same servers when something is missing; `arc_blocked_reasons` says what | Listed in the wave plan, never targeted |
| `arc_wave_0`, `arc_wave_1`, ... | `arc_wave`: the onboarding wave the CMDB plans the server for (0 is the pilot) | `-e onboarding_wave=N` in 02, 05 and 06 |
| `env_production`, `env_nonproduction` | `environment` | `--limit env_nonproduction` for a first run |
| `owner_missing` | `owner` empty | A CM-8 finding to fix in the CMDB, never a target |

A duplicate record, a missing column, an unknown tier, an owner tool the script doesn't know (a typo such as `updatemanager`) or a wave that isn't a number stops the script with an error instead of producing a partial inventory. The sample estate is a GCC tenant's: its Arc servers go to a commercial Azure subscription (`arc_cloud: AzureCloud`, commercial regions), because a Microsoft 365 GCC tenant uses commercial Microsoft Entra ID and an Azure Government subscription can't be associated with it. For GCC High or DoD, set `arc_cloud: AzureUSGovernment` and US Gov regions, and use `02_arc_onboarding.yml`. Ansible recommends inventory plugins over scripts for dynamic inventory; a script is used here because it needs nothing but Python and shows the whole mapping in one file. In production, read the CMDB through its own inventory plugin if it has one, or through the [`constructed`](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/constructed_inventory.html) plugin over its export.

## Prerequisites

- A Linux control node (or WSL on Windows) with Python 3.10 or later and `ansible-core`. Tested with ansible-core 2.21.5, ansible-lint 26.10.1 and yamllint 1.38.0 on Ubuntu 24.04 under WSL, on October 29, 2026.
- The collections in `requirements.yml`, pinned: `ansible-galaxy collection install -r requirements.yml`. Install them from a private automation hub or after reviewing them; don't let a run pull the latest version from the internet.
- For `04_network_and_ddi_facts.yml`: the `infoblox-client` Python package on the control node, and `NIOS_USERNAME` and `NIOS_PASSWORD` in the environment for a NIOS admin group with read-only permissions.
- For `02_arc_onboarding.yml`: an onboarding service principal holding only the *Azure Connected Machine Onboarding* role on the target resource group ([Book 05, Chapter 09](../../docs/books/b05-devices/09-servers-under-azure-arc.md#create-the-onboarding-service-principal)), its application ID in `inventory/group_vars/all.yml`, and its secret in Ansible Vault (`arc_sp_secret`, see `inventory/vault.yml.example`) or the `ARC_SP_SECRET` environment variable.
- For `06_arc_onboarding_role.yml`: `azure.azcollection` (pinned in `requirements.yml`) and its Python requirements on the control node (`pip install -r` the collection's `requirements.txt`, as Learn's Ansible setup page shows), and an identity holding only *Azure Connected Machine Onboarding* on the wave's resource groups: the control node's managed identity (`arc_auth_source: msi`, Learn's recommendation for production), a service principal injected by Ansible Automation Platform (`env`), or an Azure CLI sign-in (`cli`).

## Run it

```bash
# From this folder. If it sits on a Windows drive mounted in WSL, Ansible ignores ansible.cfg
# there (world-writable directory), so point at it:
export ANSIBLE_CONFIG="$PWD/ansible.cfg"

ansible-inventory --graph                               # what the CMDB export becomes
ansible-playbook playbooks/01_inventory_assessment.yml  # the CM-8 feed, in reports/
ansible-playbook playbooks/03_linux_baseline_check.yml  # drift, in reports/
ansible-playbook playbooks/04_network_and_ddi_facts.yml # network and DDI facts, in reports/

# Onboarding, one CMDB wave at a time: the plan, a dry run, then the real run.
ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0
ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0
ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0 -e confirm_change=true
# Or with azcmagent spelled out (and for Azure Government):
ansible-playbook playbooks/02_arc_onboarding.yml -e onboarding_wave=0
ansible-playbook playbooks/02_arc_onboarding.yml -e onboarding_wave=0 -e confirm_change=true

# Your own CMDB export instead of the sample:
CMDB_CSV=/secure/exports/cmdb-servers.csv ansible-playbook playbooks/01_inventory_assessment.yml
```

Reports are written only on the control node, under `reports/` (change it with `-e report_dir=...`), with a UTC timestamp in the file name. Post them to the program's evidence store from there; [Book 12, Chapter 07](../../docs/books/b12-security-operations/07-patch-configuration-and-baselines.md#extending-the-contract-to-a-second-cloud-red-hat-on-aws) has the record shape.

## How read-only is enforced

- **The read-only playbooks** (01, 03, 04) gather facts, read state, assert and report. The only command they run is the agent's own `azcmagent show --json`, which Microsoft says needs no administrator rights, marked `changed_when: false`.
- **The baseline check** sets `check_mode: true` on the play, so `lineinfile` compares and never writes, even when the playbook is run without `--check`. A "changed" result is drift.
- **Report writers** (`file`, `copy`, `template`) appear only in plays on `localhost` with `connection: local`, and write only under `report_dir`.
- **The wave plan** (05) runs only on the control node and writes only the plan under `report_dir`. Both onboarding playbooks import it as their first play, so a wave that isn't ready stops them before any server is contacted.
- **The onboarding playbooks** set `check_mode: "{{ not (confirm_change | bool) }}"` on each play that reaches a server, with `confirm_change: false` as the play default, so nothing installs or connects unless the operator says so on the command line. Every task that handles the secret has `no_log: true`; the secret is written to a root-only parameter file for `azcmagent connect --config` and deleted in an `always:` block, because Microsoft recommends a configuration file to keep the secret out of console logs. The installer download is skipped in a dry run too, because `get_url` requests the URL even in check mode. `06_arc_onboarding_role.yml` calls Microsoft's role only when `confirm_change` is true, and reads no secret itself.
- **`tests/test_read_only.py`** parses every playbook and fails on any task that could change a target outside those rules, and its negative tests prove it catches a `copy` to `/etc`, an unpinned `lineinfile`, a `shell`, a service restart, an arbitrary `azcmagent` command and a package install.

## The onboarding playbooks and Microsoft's role

Microsoft documents Arc onboarding with Ansible through the `azure.azcollection.azure_arc` role, which installs the agent, connects the machine, skips machines that are already connected, and can authenticate with the control node's managed identity, which Microsoft recommends for production because it removes the stored secret ([Microsoft Learn](https://learn.microsoft.com/azure/azure-arc/servers/onboard-ansible-playbooks)). Use it where you can: `06_arc_onboarding_role.yml` calls it unchanged and adds only what it leaves out (the wave plan, a dry run that works, batches, the CMDB's owner tags, the role's signal off by default, commercial Azure only). A pinned copy of the role is in [`examples/third_party/azure-arc-role`](../third_party/azure-arc-role), and `tests/test_microsoft_role.py` pins what it does. `02_arc_onboarding.yml` spells the same steps out with `azcmagent`, for Azure Government (the role requests its token for commercial Azure's Resource Manager) and so the secret handling is visible; the [developer workbook's Chapter 08](../../docs/project-plans/developer-workbooks/attribute-driven-migration/08-ansible-beside-arc.md) walks through both.

## Tests

```bash
# On a Linux or WSL control node with ansible-core, ansible-lint, yamllint and pytest,
# and the collections installed:
bash tests/run_all.sh
```

`run_all.sh` prints the tool versions, then runs `yamllint --strict`, `ansible-lint --strict` with the `production` profile, `ansible-playbook --syntax-check` on every playbook, and the Python tests:

| Test file | What it proves |
|---|---|
| `test_read_only.py` | The read-only rules above; both onboarding playbooks start with the wave plan, target one wave, check both owners, run in batches and are gated; Microsoft's role only with `confirm_change`, with the CMDB's values; secret handling; no secret value committed; the checker rejects writes |
| `test_inventory.py` | Every CMDB record becomes a host; tiers, configuration and patch owners, their tags, waves, Arc candidates, blocked servers and the missing-owner findings; the sample is commercial Azure; a duplicate, a missing column, an unknown tier, an unknown owner tool or a wave that isn't a number fails; the script writes nothing |
| `test_local_runs.py` | Playbooks 01 and 03 run against the control node and write their reports; the baseline check changes no file and refuses a host another tool owns; the wave plan writes the plan and stops on an empty wave, a production server in the pilot, a region from the other cloud or a missing patch owner; the onboarding playbooks without `confirm_change` leave no agent, parameter file or installer behind and make no network request; 02 stops when the secret is missing or the plan fails; 06 refuses Azure Government |
| `test_microsoft_role.py` | What Microsoft's pinned role does and leaves out (its token scope, default tag, signal, token on the command line, no owners or waves); the installed role is the pinned copy; the role, unchanged, can't run in check mode on a server without the agent |

The static tests and the inventory tests also run on Windows with Python and PyYAML; `test_local_runs.py` skips where `ansible-playbook` isn't installed, and the tests that run Microsoft's role or install nothing as root skip without root, the collection or a clean control node. Molecule isn't used: the playbooks are small, the local runs cover them, and Molecule needs a container runtime the kit shouldn't assume.

## Known limits

- **Not proven live.** The Arc, Windows, Cisco and Infoblox tasks pass syntax checks and lint but haven't run against those platforms here. The local runs cover the Linux paths only.
- **`azcmagent show --json` field names.** Microsoft documents `-j` for JSON output and the `status` property, not a full sample of the output; the playbooks read `status` and report `unknown` if it's absent.
- **The baseline is an example.** Seven settings that show the pattern, not a CIS Benchmark profile or an agency's CM-6 baseline. `sshd_config` files that include drop-in directories (`Include /etc/ssh/sshd_config.d/*.conf`) can override the main file; check the effective value with `sshd -T` in your own baseline.
- **Windows connection.** `group_vars/os_windows.yml` uses WinRM over HTTPS with Kerberos. Ansible also supports PSRP, and SSH on Windows Server versions with a recent enough OpenSSH.
- **No VMware playbook.** The guide covers vSphere; read VM inventory with the `vmware.vmware.vms` inventory plugin or `vmware.vmware_rest` modules, not the removed `community.vmware.vmware_vm_inventory`.

```
examples/ansible/
  README.md
  ansible.cfg                          inventory script, no retry files, no escalation by default
  requirements.yml                     collections, pinned
  inventory/cmdb_inventory.py          CMDB export -> inventory groups and host variables
  inventory/sample/cmdb_export.csv     the fictional estate: tiers 1 to 4, Linux, AIX, Solaris, Windows, IOS, NIOS, vCenter,
                                       with configuration and patch owners and Arc waves
  inventory/group_vars/                program settings and per-platform connection settings
  inventory/vault.yml.example          where the onboarding secret goes, encrypted
  playbooks/                           01 to 06, and the CSV template
  tests/                               run_all.sh, pytest files, localhost fixtures, the check-mode run of Microsoft's role
```
