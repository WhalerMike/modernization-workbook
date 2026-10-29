---
title: "Azure Arc Track: Implementation Guide"
description: "The step-by-step implementation of the companion guide's Azure Arc track: bringing servers on premises and in other clouds under Azure Resource Manager with attribute- and tag-driven governance. Prerequisites (the Azure cloud, management group and subscription layout, the Connected Machine agent's network, the coverage matrix and what Microsoft states for Azure Government versus commercial Azure), the tag taxonomy with the CMDB as its source and one writer, onboarding at scale with a resource-group-scoped onboarding identity and waves, Azure Policy and machine configuration baselines, Update Manager and SI-2 evidence, access through Azure RBAC and Entra sign-in, the dangers and their mitigations, and operating the estate, with a Validate step at every gate that names the validation kit check that proves it."
doc-type: workbook-guide
audience: [Executive, Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Azure Arc Track: Implementation Guide

*Arc gives each server an address in Azure; the work of this track is making sure that what the address says about the server is true, written by one hand, and read by every policy that governs it.*

::: {.callout-note}
## In this guide
The [Azure Arc track](attribute-driven-migration.md#arc-track) of the Attribute-Driven Migration guide, done step by step. Eight steps, each ending in a gate: the prerequisites (the Azure cloud, the management group and subscription layout, the agent's network, the coverage matrix, and Azure Government versus commercial availability as Microsoft states it), the tag taxonomy and resource groups, onboarding at scale in waves, Azure Policy and machine configuration, Update Manager and patch evidence, access, the dangers and how to avoid them, and operating the estate with its evidence for CM-2, CM-6, CM-8, SI-2 and AU. Every gate has a **Validate** step that names the read-only validation kit check (`VK-ARC-*`) that proves it. The depth is in [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) and [Book 06, Runbook R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md); this guide links to them rather than repeating them.
:::

## How to use this guide

[Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) is the server how-to. [Book 06, Runbook R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md) applies it to SQL Server hosts and adds the cloud decision for a GCC-Moderate tenant, the resource providers and the proxy paths. The [Ansible guide](ansible-configuration-automation.md#arc-onboarding-at-scale) covers onboarding through Ansible and the tier-2 populations. This guide puts them in order, adds the tag and inventory discipline that makes the track attribute-driven, and gives each step a gate.

Conventions, as in the rest of the series:

- **Design guidance** marks the program's recommendations. Everything else is cited: to a chapter section, or to a primary source footnoted with the date it was checked. Microsoft Learn pages new to this guide were opened on October 29, 2026.
- **Preview** features carry their stage. Anything that couldn't be verified says so.
- **Validate** steps name checks from the program's read-only validation kit (`VK-<TRACK>-NN`), which read Azure Resource Manager, Resource Graph or a CMDB export fixture and change nothing.
- **Commands** are illustrative, not tested against a production estate; run each first in a test scope.

The audience is a civilian agency at FedRAMP Moderate. Baselines come from CIS Benchmarks, the National Checklist Program and vendor guides; DISA STIGs appear only as *(High only)* references.

## The gates at a glance

| Step | Gate: done when | Validate |
|---|---|---|
| [1. Prerequisites](#step-1-prerequisites) | Cloud chosen; management groups, subscriptions and resource providers in place; network check passes at each site; every server in the CMDB assigned to Arc or to a tier 2–4 | `azcmagent check` per site; **VK-ARC-04** |
| [2. Tag taxonomy](#step-2-the-tag-taxonomy-and-resource-groups) | Taxonomy signed with its CMDB source per tag and one writer; resource groups per owning team; tag policies assigned in evaluation mode | **VK-ARC-01** against the pilot set |
| [3. Onboarding](#step-3-onboarding-at-scale) | Each wave connected with its tags, its credential removed, its rollback tested | **VK-ARC-02**, **VK-ARC-01**, **VK-ARC-04**; **VK-NPI-01**, **VK-NPI-02**, **VK-NPI-07** |
| [4. Policy and configuration](#step-4-policy-and-configuration) | Baseline assigned and evaluated on every connected server; Defender for Servers on | **VK-ARC-03** |
| [5. Update Manager](#step-5-update-manager-and-patch-evidence) | Every server periodically assessed and on a schedule | **VK-ARC-05** |
| [6. Access](#step-6-access) | Roles at resource-group scope, held through PIM; sign-in roles only where Entra sign-in is used | **VK-ARC-06** |
| [7. Dangers](#step-7-dangers-and-mitigations) | Each mitigation in place | The checks named per danger |
| [8. Operating it](#step-8-operating-it) | Checks scheduled; evidence exported and retained | All `VK-ARC-*` on the ConMon cadence |

: The Arc track's gates and the checks that prove them {.striped .hover}

## Step 1: Prerequisites {#step-1-prerequisites}

### 1.1 Choose the Azure cloud

Decide this first, because every endpoint, region and feature below depends on it.

- **A GCC-Moderate tenant uses a commercial Azure subscription.** Microsoft 365 GCC uses Entra ID in the commercial cloud, and an Azure Government subscription can't be associated with a directory there, so the Arc resources live in a commercial subscription in the same tenant and the agent connects with `--cloud AzureCloud` ([Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#the-right-azure-cloud)). Book 05 makes the same assumption ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#network)).
- **Both are authorized at FedRAMP High.** Microsoft states that Azure and Azure Government are both assessed and authorized at the FedRAMP High impact level; Azure Government adds contractual commitments on US data storage and screened US persons.[^arc-gov-compare] A Moderate system can sit in either. The choice is made by the tenant's cloud and the features the estate needs ([availability table](#azure-government-versus-commercial)), and it's recorded in the authorization package ([Book 14, Chapter 03](../b14-compliance/03-the-baseline-and-the-crosswalk.md#two-facts-not-one)).
- **An estate already onboarded to Azure Government** keeps its servers there only if every capability it needs is listed below; SQL Server hosts that need Entra authentication need a commercial registration plan ([Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#the-right-azure-cloud)).

### 1.2 Lay out management groups, subscriptions and resource groups

An Arc server is organized by management group, subscription and resource group like an Azure VM, and policies, role assignments and tags apply to it the same way.[^arc-cloud-native] The layout is therefore the governance design. *(Design guidance:)*

| Level | What it holds | What attaches there |
|---|---|---|
| Platform management group | The subscriptions holding Arc servers and native Azure workloads | The baseline, tag policies, Defender for Servers and periodic assessment, so no subscription opts out |
| Subscription per environment | Arc resource groups for that environment | Exemptions, each with a reason and an expiry |
| Resource group per owning team, per environment (`rg-arc-<team>-<env>`) | That team's Arc servers | The onboarding role for the wave; the team's operator roles; Update Manager schedules |

Book 05 sets the resource-group rule: a dedicated group for Arc servers, or one per owning team, so RBAC and policy can be scoped without touching other resources ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#resource-groups-and-tags)). It matters because a resource group is a role-assignment scope and a tag isn't ([Step 6](#step-6-access)).

Register the resource providers in each subscription before the first wave: `Microsoft.HybridCompute`, `Microsoft.GuestConfiguration`, `Microsoft.HybridConnectivity` and, for SQL Server hosts, `Microsoft.AzureArcData` ([Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#roles-and-permissions)). Update Manager's periodic assessment on Arc servers also needs the subscription registered to `Microsoft.Compute`.[^arc-aum-assess]

### 1.3 Open the agent's network

The Connected Machine agent talks outbound over TCP 443 and needs no inbound rule. Book 05 lists the service tags, including `AzureFrontDoor.Frontend` from April 2026, and the `azcmagent check` pre-flight ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#network)). What this step adds:

| Item | Commercial Azure | Azure Government |
|---|---|---|
| Entra ID | `login.microsoftonline.com`, regional `*.login.microsoft.com`, `pas.windows.net` | `login.microsoftonline.us`, `pasff.usgovcloudapi.net` |
| Resource Manager (connect and disconnect only) | `management.azure.com` | `management.usgovcloudapi.net` |
| Metadata and hybrid identity (private-link capable) | `*.his.arc.azure.com` | `*.his.arc.azure.us` |
| Extensions and machine configuration (private-link capable) | `*.guestconfiguration.azure.com` | `*.guestconfiguration.azure.us` |
| Service tags | The list in Book 05 | Add the **public-cloud** `AzureArcInfrastructure` ranges as well; Microsoft says the public tag is required after October 28, 2025 and the Government tags are no longer supported for this |
| Arc gateway (fewer endpoints) | Documented for the public cloud | Not documented |

: Connected Machine agent endpoints that differ by cloud[^arc-network] {.striped .hover}

From the same page: allow the whole `AzureArcInfrastructure` tag, not one region's ranges, which lack the global components; allow the regional Entra endpoints even though the agent can fall back to the global one; and with a private link scope, the endpoints marked public must still be reachable.[^arc-network] The private link scope is what keeps the agent's own traffic off public networks; a proxy adds no security because the traffic is already encrypted ([Book 05](../b05-devices/09-servers-under-azure-arc.md#network)). Set a proxy with `azcmagent config set proxy.url`, because `azcmagent connect` has no proxy flag, and on SQL Server hosts mind the engine's separate path to Entra ID ([Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#network)). A private link scope is limited to 800 instances per resource group.[^arc-overview]

### 1.4 Read the coverage matrix and place every server

The full matrix, with what Microsoft documents and what is the program's reading, is in the companion guide ([Which servers Arc covers](attribute-driven-migration.md#arc-coverage)) and at working level in [Book 05](../b05-devices/09-servers-under-azure-arc.md#which-servers-arc-reaches). The decisions it drives:

| Population | Arc coverage | Implementation decision |
|---|---|---|
| Windows Server 2016, 2019, 2022, 2025 (Desktop and Core) | Supported; 2016 gets new agent versions until February 2030 | Tier 1. Windows Server 2016 reaches end of support January 12, 2027: enroll it in ESUs through Arc first if it won't be upgraded in time ([Book 05](../b05-devices/09-servers-under-azure-arc.md#extended-security-updates)) |
| Windows Server 2012 and 2012 R2 | Listed, but no new agent versions after November 2026; ESUs ended October 13, 2026, and Arc support doesn't extend them | Tier 4: migrate, upgrade or isolate with a recorded risk acceptance. Arc still gives inventory, not patches |
| Linux: RHEL 7–10, Rocky and AlmaLinux 8–9, Oracle Linux 7–10, SLES 12 SP5 and 15, Ubuntu 18.04–26.04, Debian 11–13, Amazon Linux 2 and 2023, Azure Linux 3.0 | Supported, with several releases losing new agent versions after November 2026; not tested on CIS-hardened systems | Tier 1, with a pilot on hardened builds. Releases past their agent end date go on a retirement date or to tier 2 under [Ansible](ansible-configuration-automation.md#linux-and-unix) |
| VMware vSphere VMs | Arc-enabled VMware vSphere through the resource bridge, then guest management (the agent) | Tier 1 for the guests; ESXi hosts are tier 2 under vCenter ([Ansible guide](ansible-configuration-automation.md#vmware)) |
| SCVMM-managed VMs | Retiring: no new onboardings from October 2026, service ends September 2029 | Onboard as Arc-enabled servers with the agent, not through SCVMM |
| AWS EC2 and Google Cloud VMs | Agent per VM, or the multicloud connector (AWS; Google Cloud in preview); the connector isn't in Azure Government | Connector in commercial Azure; the agent per VM otherwise. Instances also stay governed in their own cloud ([Ansible guide](ansible-configuration-automation.md#cloud-vms)) |
| Azure VMs | Not Arc; native resources | Same policies and tags, assigned at the same management group |
| AIX, Solaris, HP-UX, mainframe, network devices, sealed appliances | Not supported | Tiers 2–4 |

: Coverage decisions (Arc facts as of October 29, 2026, from the companion guide's sources) {.striped .hover}

The four tiers are the companion guide's ([What neither tool reaches](attribute-driven-migration.md#what-neither-tool-reaches)): 1, managed by Arc; 2, managed by the platform's own tool with an evidence feed to the CMDB; 3, discovered and monitored only; 4, segmented and isolated, or retired. Every server the CMDB lists gets a tier before onboarding starts, because a server in no tier is a CM-8 finding ([Book 05, Chapter 03](../b05-devices/03-where-device-and-server-data-lives.md#what-intune-and-arc-dont-reach-design-guidance)).

### 1.5 Azure Government versus commercial availability {#azure-government-versus-commercial}

What Microsoft Learn states for each capability this track uses, as of October 29, 2026. "Not stated" means the pages opened didn't say, and the product-by-region page should be checked before relying on it.

| Capability | Commercial Azure | Azure Government | Source |
|---|---|---|---|
| Arc-enabled servers (the agent, `--cloud AzureUSGovernment`) | Available | Available, with its own endpoints | [^arc-network] |
| Private link scope | Available | Available (the Government endpoint table carries a private-link column) | [^arc-network] |
| Arc gateway | Documented for the public cloud | Not stated | [^arc-network] |
| Automatic agent upgrade | Available on agent 1.67 and later | "Currently available only on Azure public cloud" | [^arc-autoupgrade] |
| Machine configuration | Available | Available: regional service endpoints for US Gov Arizona, Texas and Virginia | [^arc-mc-network] |
| Customizable security baselines and the built-in CIS baselines | Public preview, all public regions | Not supported during the public preview | [^arc-baselines] |
| Update Manager for Arc servers | The listed commercial regions | US Gov Virginia and US Gov Arizona; US Gov Texas for Azure VMs only | [^arc-aum-regions] |
| Windows Server Management enabled by Azure Arc (the Software Assurance benefit) | Activation available | Not in US Gov Virginia or US Gov Arizona | [^arc-wsm] |
| Defender for Servers | GA | GA | [^arc-dfc-gov] |
| Entra ID sign-in (Windows Server 2025; Linux SSH) | Available | Available | [Book 05](../b05-devices/09-servers-under-azure-arc.md#microsoft-entra-id-sign-in) |
| Extended Security Updates through Arc | Available | Available, with an ESU-only endpoint subset | [^arc-network] |
| Arc-enabled VMware vSphere | Available | Not stated on the VMware page, which defers to the product-by-region page. The Arc resource bridge it needs lists US Gov Virginia among its regions | [^arc-vmware-regions][^arc-bridge] |
| Arc-enabled SCVMM | Retiring | Not stated | [Book 05](../b05-devices/09-servers-under-azure-arc.md#which-servers-arc-reaches) |
| Multicloud connector (AWS, Google Cloud) | Listed regions | Not available in national clouds, including Azure Government | [^arc-mcc] |
| SQL Server enabled by Azure Arc | Full feature set | US Gov Virginia only, a subset: onboarding, inventory, licensing, FCIs and ESUs; no Entra authentication | [Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#the-right-azure-cloud) |

: Azure Government versus commercial availability for this track (Microsoft Learn, October 29, 2026) {.striped .hover}

A GCC-Moderate estate is in commercial Azure already ([1.1](#choose-the-azure-cloud)). An Azure Government estate plans without the multicloud connector, automatic agent upgrade, the customizable baselines and the Windows Server Management benefit in its two main regions, and confirms Arc-enabled VMware vSphere on the product-by-region page before designing around it.

### 1.6 Assign the setup roles

Book 05 names the roles: Azure Connected Machine Onboarding for the onboarding identity only, Azure Connected Machine Resource Administrator for the server operations team, and the two Virtual Machine login roles for Entra sign-in, with the warning that any Contributor on an Arc resource is an indirect administrator of the server ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#roles)). Creating the onboarding service principal needs application registration rights, and assigning its role needs Owner or User Access Administrator on the scope ([same chapter](../b05-devices/09-servers-under-azure-arc.md#create-the-onboarding-service-principal)). Hold the last two through PIM and record the setup as a change. Who owns which role is mapped in [Book 05, Chapter 06](../b05-devices/06-who-owns-the-endpoint.md).

::: {.callout-tip}
## Validate: Gate 1
- **Network.** `azcmagent check --location <region>` (add `--cloud AzureUSGovernment` where it applies, and `--extensions sql` on SQL Server hosts) passes from a representative server at every site ([Book 05](../b05-devices/09-servers-under-azure-arc.md#network)). File the output with the change.
- **Coverage.** **VK-ARC-04** runs against the CMDB export fixture before any server is connected. Every in-scope server is either planned for an Arc wave or assigned a tier 2–4 with its owner. The count it reports is the denominator every later gate closes against.
:::

## Step 2: The tag taxonomy and resource groups {#step-2-the-tag-taxonomy-and-resource-groups}

On this track the tags are the attributes. They're applied at connection with `azcmagent connect --tags`, read by Azure Policy, Update Manager's dynamic scoping, Resource Graph and cost reporting, and kept by Azure Policy afterward ([companion guide](attribute-driven-migration.md#arc-track); [Book 05](../b05-devices/09-servers-under-azure-arc.md#resource-groups-and-tags)).

### 2.1 Which attributes become tags

Book 05 sets the program's taxonomy. This guide adds the CMDB column, which says where each value comes from, and two optional tags that tie the resource back to its record.

| Tag | Example | Source in the CMDB *(design guidance)* | What reads it |
|---|---|---|---|
| `Environment` | `Production` | The configuration item's environment | Policy assignment scope through resource groups and subscriptions; queries |
| `Workload` | `FileServices` | The business service the item supports | Inventory; cost |
| `Criticality` | `High` | The service's criticality rating | Patch schedule choice; alert severity |
| `Owner` | `infra-team` | The owning team (a team, never a person's name) | Ownership follow-up; access reviews |
| `CostCenter` | `CC1234` | The item's funding line | Cost reporting |
| `PatchGroup` | `Wave2` | The maintenance window assigned in change management | Update Manager dynamic scope |
| `ArcOnboardedDate` | `2026-10-20` | Written by the onboarding run, not the CMDB | Wave tracking |
| `CmdbId` *(optional, design guidance)* | `CI0012345` | The configuration item number | The join key to the CMDB and to Book 12's evidence contract ([Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md#cm-8-is-the-precondition-for-si-2-at-scale)) |
| `ConfigOwner` *(optional, design guidance)* | `ArcMachineConfiguration` | The CMDB's `config_owner` ([Ansible guide](ansible-configuration-automation.md#one-owning-tool-per-setting)) | The two-tools check in [Step 7](#step-7-dangers-and-mitigations) |
| `ArcSQLServerExtensionDeployment` | `Disabled` | Set only where SQL Server must not be auto-connected | The Arc SQL Server auto-onboarding ([Book 05](../b05-devices/09-servers-under-azure-arc.md#resource-groups-and-tags)) |

: The tag taxonomy and its source {.striped .hover}

Values are coded, from controlled lists the CMDB owns, as on the HR track ([companion guide](attribute-driven-migration.md#stage-1-source-the-attributes)). A free-text value breaks every policy and schedule that matches on it.

### 2.2 One writer per tag

*(Design guidance.)* The CMDB is the source; the onboarding run is the first writer; a scheduled reconciliation is the only writer after that. The CMDB already owns the business facts for servers and imports the technical states from Arc and Defender rather than deciding them ([Book 05, Chapter 03](../b05-devices/03-where-device-and-server-data-lives.md#the-procurement-record-and-the-cmdb)). So:

- **Onboarding writes the tags** from the CMDB record on the same change that connects the server, which is why Ansible's CMDB-generated inventory suits it ([Ansible guide](ansible-configuration-automation.md#arc-onboarding-at-scale)).
- **Reconciliation keeps them.** A scheduled job, running as its own non-person identity with a tag-writing role on the Arc resource groups, compares each server's tags with its CMDB record and writes the CMDB value. Nobody edits a tag in the portal; a wrong tag is fixed in the CMDB.
- **Policy fills only what's derivable.** *Inherit a tag from the resource group if missing* (modify effect) copies a resource group's tag onto new or updated resources and, with a remediation task, existing ones; if the tag exists with a different value, it isn't changed.[^arc-tag-policies] Use it for values that truly belong to the group, such as `Environment` where groups are per environment. Don't use the "add or replace" variants for anything the CMDB owns, or Policy becomes a second writer.

### 2.3 Tags are non-security metadata

Treat every tag as descriptive, never as an access control:

- **Anyone with write access can change them.** Tag Contributor can tag a resource without any access to the resource itself, and Contributor on the resource can too.[^arc-tags] That's the population Book 05 already treats as indirect administrators.
- **They're plain text.** Don't put sensitive information in them ([Book 05](../b05-devices/09-servers-under-azure-arc.md#resource-groups-and-tags)). Microsoft also warns against putting restricted information in Azure resource names in Azure Government.[^arc-gov-compare]
- **They aren't a role-assignment scope.** Azure RBAC scopes are management groups, subscriptions, resource groups and resources, and lower levels inherit from higher ones;[^arc-rbac-scope] access follows the resource group, not the tag ([Step 6](#step-6-access)).
- **They aren't inherited.** Resources don't inherit tags from their resource group or subscription; only a tag policy copies them.[^arc-tags]

Tags do steer operations, though: a changed `PatchGroup` moves a server to another maintenance window or out of every schedule. That's why tag drift is a danger in [Step 7](#step-7-dangers-and-mitigations), not a cosmetic issue.

### 2.4 Assign the tag policies in evaluation mode first

The built-in *Require a tag on resources* and *Require a tag and its value on resources* use the deny effect.[^arc-tag-policies] Assign them at the platform management group with `enforcementMode` set to `DoNotEnforce`, which evaluates compliance without enforcing the effect or writing deny entries; Microsoft recommends that mode for testing a new assignment before enforcement.[^arc-enforcement] Switch to `Default` after the pilot wave shows no false positives, so later connects without the required tags fail at the source.

```powershell
# Illustrative. Require the PatchGroup tag on resources under the platform management group,
# evaluated but not enforced until the pilot wave proves it. 871b6d14-... is the built-in
# "Require a tag on resources" definition.
az policy assignment create `
    --name "require-tag-patchgroup" `
    --policy "871b6d14-10aa-478d-b590-94f262ecfa99" `
    --scope "/providers/Microsoft.Management/managementGroups/<platform-mg>" `
    --params '{\"tagName\": {\"value\": \"PatchGroup\"}}' `
    --enforcement-mode DoNotEnforce
```

::: {.callout-tip}
## Validate: Gate 2
- The taxonomy table is signed by the CMDB owner and the server platform owner, with one writer named per tag.
- Resource groups exist per owning team and environment, each with its owner recorded.
- **VK-ARC-01** runs with the taxonomy as its input against the pilot servers after Gate 3's first wave, and reports none missing a required tag. Before that, run it against the tag policies' compliance results in `DoNotEnforce` mode to see what enforcement would deny.
:::

## Step 3: Onboarding at scale {#step-3-onboarding-at-scale}

### 3.1 The onboarding identity

The onboarding identity exists only to connect machines, and the credential is needed only while `azcmagent connect` runs; if it expires afterward, the server stays connected ([Book 05](../b05-devices/09-servers-under-azure-arc.md#create-the-onboarding-service-principal)). Choose it in this order:

1. **A service principal with a certificate**, holding *Azure Connected Machine Onboarding* on the target resource group and nothing else, created per wave and removed when the wave closes. Book 05 has the `az ad sp create-for-rbac --create-cert` command and the reasons: a certificate can be controlled with Conditional Access, and a stolen onboarding credential lets an attacker connect outside servers into the subscription ([same section](../b05-devices/09-servers-under-azure-arc.md#create-the-onboarding-service-principal)).
2. **A managed identity, where the automation runs on an Azure VM or an Arc-enabled server.** Microsoft's Ansible role recommends the control node's managed identity for production because it removes stored secrets; it has no Azure permissions until granted the same onboarding role ([Ansible guide](ansible-configuration-automation.md#arc-onboarding-at-scale)). The managed identity removes the secret, not the scope rule: grant it on the wave's resource group, and remove the grant when the wave closes.
3. **Interactive sign-in**, for a pilot of a handful of servers only.

Never a client secret in a startup script ([Book 05](../b05-devices/09-servers-under-azure-arc.md#protect-the-credential-in-the-deployment)). The onboarding service principal is a non-person identity like any other, with two human owners and a recorded expiry ([companion guide](attribute-driven-migration.md#service-principals-managed-identities-and-workload-identities)).

### 3.2 Pick the method per population

Microsoft's methods, and which tool fits which part of the estate, are tabled in [Book 05](../b05-devices/09-servers-under-azure-arc.md#choose-a-method). The program's rule is a certificate-based service principal deployed through the tool the server team already runs ([same section](../b05-devices/09-servers-under-azure-arc.md#choose-a-method)). In practice *(design guidance)*:

| Population | Method | Notes |
|---|---|---|
| Windows Server under Configuration Manager | Script or custom task sequence | Collections scoped to the wave |
| Domain-joined Windows Server without Configuration Manager | Microsoft's Group Policy onboarding method | Encrypted configuration on a share; scope the GPO to the wave's OU, rotate the credential after the wave, disable the GPO once connected ([Book 05](../b05-devices/09-servers-under-azure-arc.md#protect-the-credential-in-the-deployment)) |
| Linux, and Windows where Ansible is the automation | Microsoft's `azure.azcollection.azure_arc` role, inventory generated from the CMDB | The [Ansible guide's Arc section](ansible-configuration-automation.md#arc-onboarding-at-scale) and its gated example `02_arc_onboarding.yml` |
| Any OS, scripted batches | `azcmagent connect --config`, keeping the credential off the command line | [Ansible guide](ansible-configuration-automation.md#arc-onboarding-at-scale) |
| VMware vSphere VMs | Arc-enabled VMware vSphere guest management at scale | Needs VMware Tools; the resource bridge comes first |
| AWS (and Google Cloud, in preview) | The multicloud connector, commercial Azure only | Or the agent per VM in Azure Government |
| SQL Server hosts | As above, then [Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#step-1-enroll-the-host) | Decide `ArcSQLServerExtensionDeployment` before the connect |

: Onboarding method by population {.striped .hover}

Whatever the method, the connect carries the full tag set from the CMDB, the resource group from the server's owning team, and the cloud from [1.1](#choose-the-azure-cloud). Settle resource names first: the name defaults to the host name and can't be changed without disconnecting ([Book 05](../b05-devices/09-servers-under-azure-arc.md#connect)). Agents in golden images are installed, never connected ([Book 05](../b05-devices/09-servers-under-azure-arc.md#images-and-cloning)). In commercial Azure, add `--enable-automatic-upgrade` to the connect on agent 1.67 or later if the program has chosen automatic upgrades ([Step 8](#step-8-operating-it)).[^arc-autoupgrade]

### 3.3 Run it in waves

Each wave follows Book 05's five steps: prepare, connect, attest and baseline, verify, close ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#onboarding)). The wave plan *(design guidance)*:

| Wave | Population | Why in this order |
|---|---|---|
| 0, pilot | 10 to 20 non-production servers per OS family, including one CIS-hardened Linux build and one SQL Server host | Proves the network, the tags, the policies in `DoNotEnforce`, the hardened-build behavior and the rollback |
| 1 | Non-production, all OS families | Turns tag enforcement on; first Update Manager schedules |
| 2 | Production servers of low criticality | Production change control, maintenance windows |
| 3 | Production, high criticality; sensitive servers with local agent lockdown | Extension allowlists and `incomingconnections.enabled false` decided per server class first ([Book 05](../b05-devices/09-servers-under-azure-arc.md#lock-down-what-the-agent-will-accept)) |
| 4 | Windows Server 2016 not upgrading before January 12, 2027 | ESU enrollment in the same change ([Book 05](../b05-devices/09-servers-under-azure-arc.md#extended-security-updates)) |
| Other clouds and VMware | In parallel, by their own owners | Connector or bridge prerequisites |

: Onboarding waves {.striped .hover}

Three things happen on the same change as each connect: the license attestation for the Windows Server Management benefit where it applies ([Book 05](../b05-devices/09-servers-under-azure-arc.md#plan-cost-by-service-not-by-connection)), the day-one baseline from [Step 4](#step-4-policy-and-configuration), and the CMDB update that records the server as Arc-managed. The wave closes by deleting certificate files from the servers, removing the onboarding credential or its role grant, and disabling any onboarding GPO.

**Rollback** follows Book 05's order: remove the extensions, then `azcmagent disconnect` with the Resource Administrator role (the onboarding role can't delete), then uninstall the agent ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#rollback)). Disconnecting deletes the machine's managed identity, so anything granted to it, such as Graph permissions or Key Vault access for SQL Server, must be granted again after a reconnect ([Book 06, R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#rollback)). Test the rollback on the pilot wave.

::: {.callout-tip}
## Validate: Gate 3 (each wave)
- **VK-ARC-02** reports every server in the wave **Connected**, none disconnected or expired, and every agent on a version within Microsoft's one-year support window.
- **VK-ARC-01** reports no server in the wave missing a required tag, and the tag values equal the CMDB fixture's.
- **VK-ARC-04** shows the wave's servers moved from "not Arc-enabled" to Arc, and no server left without a tier.
- **VK-NPI-02** shows the wave's onboarding credential removed or expired; **VK-NPI-01** shows it had two owners while it existed; **VK-NPI-07** lists each new machine's system-assigned managed identity for the inventory.
- On SQL Server hosts, R04's managed-identity token test passes ([Step 2 of R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md#step-2-validate-the-managed-identity-token)).
- The rollback was exercised on the pilot wave and its record filed.
:::

## Step 4: Policy and configuration {#step-4-policy-and-configuration}

A connected server is addressable, not governed, until its baseline is attached and evaluated ([Book 05](../b05-devices/09-servers-under-azure-arc.md#the-day-one-baseline)). This step attaches it at scale, by scope rather than by OU.

### 4.1 The assignments

*(Design guidance.)* Assign at the platform management group so new subscriptions and resource groups inherit them, with exemptions only as dated records.

| Assignment | Effect | Scope |
|---|---|---|
| Machine configuration prerequisite initiative | Deploys what guest assignments need | Platform management group, first ([Book 05](../b05-devices/09-servers-under-azure-arc.md#azure-policy-and-machine-configuration)) |
| Windows and Linux security baselines ([4.2](#the-baselines)) | Audit | Platform management group |
| Agency CM-6 settings as custom machine configuration packages | Audit or `ApplyAndMonitor` | The resource groups whose servers machine configuration owns |
| Tag policies, including tag inheritance for derivable values ([2.2](#one-writer-per-tag)) | Deny, after `DoNotEnforce`; modify for derivable tags | Platform management group |
| *Configure periodic checking for missing system updates on azure Arc-enabled servers* | Modify | Platform management group ([Step 5](#step-5-update-manager-and-patch-evidence)) |
| Defender for Servers Plan 2 | DeployIfNotExists, or the plan set on the subscription | Each subscription holding Arc servers |
| *Configure Azure Arc-enabled Servers to enable automatic upgrades* | Enables the agent setting | Commercial Azure only, if chosen[^arc-autoupgrade] |

: Policy assignments for the Arc estate {.striped .hover}

### 4.2 The baselines {#the-baselines}

- **Microsoft's built-in Azure compute security baselines** for Windows and Linux are the starting point on Azure and Arc ([Book 05](../b05-devices/09-servers-under-azure-arc.md#azure-policy-and-machine-configuration); [Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md#the-baseline-lifecycle)).
- **CIS-aligned content is in preview.** The customizable security baselines, which let you enable, exclude or adjust rules and download the result as a JSON file for policy-as-code, are a public preview; they cover the official CIS Benchmarks for Linux and the Azure compute baselines for Windows and Linux, and they support all public regions but not Azure Government during the preview.[^arc-baselines] CIS Benchmarks for Windows Server are a separate preview: Windows Server 2025 only, Level 1 member server and domain controller profiles, audit only, with 2022 and 2019 "coming soon."[^arc-cis-win] Microsoft also states the agent isn't tested on CIS-hardened systems ([companion guide](attribute-driven-migration.md#arc-coverage)), which is why the pilot includes a hardened build.
- **Agency CM-6 settings** are what the agency's configuration management plan requires beyond those, built as custom machine configuration packages and versioned in the governance repository, with their source (CIS Benchmark, the National Checklist Program or a vendor guide) recorded per setting ([Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md#the-baseline-lifecycle)).
- **DISA STIGs are *(High only)*.** Where a High system shares the estate, its STIG content is a separate baseline for that system; the [Ansible guide's STIG section](ansible-configuration-automation.md#stig-content) lists what Red Hat and Broadcom publish.

Treat a preview baseline as an assessment aid, not as the CM-2 baseline of record, until it's generally available or the authorizing official accepts it *(design guidance)*.

### 4.3 Assignment types and remediation

Machine configuration has three assignment types, `Audit`, `ApplyAndMonitor` and `ApplyAndAutoCorrect`, and no "audit then remediate" mode; auto-correct repairs drift without recording that it happened ([Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md#azure-machine-configuration-and-the-drift-export)). The program's rule is Book 12's: `Audit` or `ApplyAndMonitor` for every setting whose drift must be evidenced, `ApplyAndAutoCorrect` only for idempotent, low-risk settings, and the choice written in the baseline file. Remediation of `modify` and `deployIfNotExists` assignments on existing servers runs as a remediation task, which can be started even while the assignment is in `DoNotEnforce`.[^arc-enforcement] Treat noncompliance as a finding with an owner, not a failed deployment ([Book 05](../b05-devices/09-servers-under-azure-arc.md#azure-policy-and-machine-configuration)).

A server disconnected for more than 14 days loses its guest assignments locally and isn't reassigned ([Book 05](../b05-devices/09-servers-under-azure-arc.md#azure-policy-and-machine-configuration)), so the connection check in [Step 8](#step-8-operating-it) is part of the baseline's evidence.

### 4.4 Defender for Servers

Book 05 sets Plan 2 for the program's Moderate scope, explains why servers onboard through Arc rather than a direct Defender for Endpoint install, and records the security-settings-management limits ([Chapter 09](../b05-devices/09-servers-under-azure-arc.md#defender-for-servers)). On Arc-enabled servers, Defender's security misconfigurations assessment, endpoint protection assessment and missing OS patches assessment require Defender for Servers, and system updates and patches require Plan 2.[^arc-dfs-support] Defender for Servers is generally available in Azure Government as well as commercial Azure.[^arc-dfc-gov]

::: {.callout-tip}
## Validate: Gate 4
- **VK-ARC-03** reports, per server, a compliance state for the baseline assignment: every connected server evaluated, none "not started" more than a day after its wave, and every noncompliant result assigned to an owner or covered by a dated exemption.
- The baseline JSON, its version and its source per setting are committed, and the assignment type per setting is recorded.
- Defender for Cloud shows each wave's servers covered by Plan 2.
:::

## Step 5: Update Manager and patch evidence {#step-5-update-manager-and-patch-evidence}

Update Manager assesses and deploys OS updates for Arc servers, supports maintenance windows, and groups machines by subscription, location, resource group or tags through dynamic scoping; its billing exemptions (ESUs through Arc, Defender for Servers Plan 2, Software Assurance or pay-as-you-go licensing) are in [Book 05](../b05-devices/09-servers-under-azure-arc.md#azure-update-manager). The steps:

1. **Turn on periodic assessment everywhere.** Assign *Configure periodic checking for missing system updates on azure Arc-enabled servers*, a modify policy that sets assessment every 24 hours and can be scoped by subscription, resource group, location or tag.[^arc-aum-policy] Run a remediation task for servers connected before the assignment.
2. **Schedule by `PatchGroup`.** One maintenance configuration per patch group, attached by a dynamic scope or the *Schedule recurring updates using Azure Update Manager* policy filtered on the tag.[^arc-aum-scheduled] The ring logic (test first, then broad, with deferrals) follows the agency's SI-2 parameter, as the workstation rings do ([Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads)).
3. **Check the region.** In Azure Government, Arc servers can use Update Manager in US Gov Virginia and US Gov Arizona only ([availability](#azure-government-versus-commercial)).[^arc-aum-regions]
4. **Export the results.** Update Manager stores pending updates in Resource Graph's `patchassessmentresources` table for 7 days and installation results in `patchinstallationresources` for 30 days.[^arc-aum-workflow] That's shorter than any assessment cycle, so a scheduled job exports both tables to the evidence store *(design guidance)*.
5. **Know what it sees.** Update Manager finds only what the machine's own update source offers: a Windows server pointed at WSUS reports WSUS's view, and a Linux server reports its configured repository.[^arc-aum-workflow] Record each server's update source with its patch group.

SI-2 applies to every layer the agency operates; for an on-premises or IaaS server that is the whole guest ([Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md#the-shared-responsibility-line-is-the-si-2-scoping-rule)).

::: {.callout-tip}
## Validate: Gate 5
- **VK-ARC-05** reports every connected server within an Update Manager schedule's scope (none with an empty or unknown `PatchGroup`) and none without a patch assessment in the last *N* days, where *N* is the agency's parameter (two days is a reasonable start against a 24-hour cycle, *design guidance*).
- The export job has run at least once and the evidence store holds both tables.
:::

## Step 6: Access {#step-6-access}

### 6.1 Azure RBAC at scope

| Role | Holder | Scope *(design guidance)* | How held |
|---|---|---|---|
| Azure Connected Machine Onboarding | The wave's onboarding identity | The wave's resource group | Granted at wave start, removed at close |
| Azure Connected Machine Resource Administrator | The owning team's server operators | Their team's resource groups | PIM-eligible |
| Virtual Machine Administrator Login; Virtual Machine User Login | People who sign in with Entra ID | Resource group or higher, to stay under assignment limits ([Book 05](../b05-devices/09-servers-under-azure-arc.md#linux)) | PIM-eligible, through groups |
| Reader | Auditors, the CMDB reconciliation reader | Platform management group | Standing |
| A tag-writing role for the reconciliation identity | The CMDB reconciliation job | Arc resource groups | Standing, non-person identity with owners |
| Contributor, Owner | Nobody, on Arc scopes, beyond break-glass | — | — |

: Roles on the Arc estate {.striped .hover}

Contributor, Owner and Resource Administrator can push extensions that run as Local System or root, so they're effectively server administrator rights ([Book 05](../b05-devices/09-servers-under-azure-arc.md#roles)). Keep them off subscription scope, and remember that the resource group is the boundary: a team that shares a group with another team shares that power over its servers.

### 6.2 Entra sign-in where supported

Entra ID sign-in is available on Arc-enabled Windows Server 2025 with Desktop Experience (and Windows 11 24H2) through the `AADLoginForWindows` extension, which Entra-joins the server, and on supported Linux distributions through `AADSSHLoginForLinux`. Windows Server 2019 and 2022 aren't supported. Conditional Access isn't supported with the Entra join extension on Arc servers, so the control is RBAC on the login roles plus PIM ([Book 05](../b05-devices/09-servers-under-azure-arc.md#microsoft-entra-id-sign-in)). Because the Windows extension Entra-joins the machine, install it only on servers that won't stay domain-joined; that's a per-workload decision sequenced after the authentication work ([Book 05](../b05-devices/09-servers-under-azure-arc.md#what-arc-changes-and-what-it-doesnt)).

### 6.3 Why tag-based ABAC isn't the access model

Granting access by tag ("operators of `Workload=FileServices`") isn't supported for Arc. Azure ABAC conditions can currently be added only to role assignments with blob storage or queue storage data actions, and Microsoft documents no ABAC conditions for managing Arc-enabled servers ([companion guide](attribute-driven-migration.md#arc-track)).[^arc-abac] Access is therefore structural: the resource group per owning team is the attribute that access follows, and the tags stay descriptive ([2.3](#tags-are-non-security-metadata)). That's also safer: a tag that Tag Contributor can change would be a poor access boundary.

::: {.callout-tip}
## Validate: Gate 6
- **VK-ARC-06** lists role assignments on the Arc management group, subscriptions and resource groups: no Owner or Contributor outside break-glass, Resource Administrator and the login roles eligible rather than active, the onboarding role present only on a resource group with an open wave, and every assignee a group or a non-person identity with owners.
- On Windows Server 2025 servers with Entra sign-in, `dsregcmd /status` shows `AzureAdJoined : YES`, and a test member of the login group signs in ([Book 05](../b05-devices/09-servers-under-azure-arc.md#windows-server-2025)).
:::

## Step 7: Dangers and mitigations {#step-7-dangers-and-mitigations}

| Danger | How it fails | Mitigation | Validate |
|---|---|---|---|
| **Onboarding credential sprawl** | Each team creates its own onboarding service principal with a year-long secret and subscription scope; the secrets end up in scripts, GPO shares and wikis, and any one of them lets an attacker register outside servers into the subscription | One onboarding identity per wave, certificate or managed identity, scoped to the wave's resource group, removed at close ([Step 3](#step-3-onboarding-at-scale)); application management policies that block new password secrets ([companion guide](attribute-driven-migration.md#service-principals-managed-identities-and-workload-identities)); a private link scope so a stolen credential can't be used from outside ([Book 05](../b05-devices/09-servers-under-azure-arc.md#create-the-onboarding-service-principal)) | **VK-NPI-02**, **VK-NPI-03**, **VK-NPI-01**; **VK-ARC-06** for stray onboarding grants |
| **Tag drift** | Someone edits a tag in the portal; a server leaves its patch group or gets the wrong environment, and nothing in Azure flags it because the new value is valid | One writer, the CMDB reconciliation ([2.2](#one-writer-per-tag)); deny policies for required tags; Contributor and Tag Contributor kept off Arc scopes; the Activity log's tag writes reviewed ([Step 8](#step-8-operating-it)) | **VK-ARC-01** against the CMDB fixture, reporting values that differ, not only values missing |
| **Two tools on one setting** | Ansible, Configuration Manager or a leftover GPO sets a value that machine configuration also sets; under auto-correct the two flip it back and forth while both report success | One owning tool per setting as the CMDB's `config_owner` ([Ansible guide](ansible-configuration-automation.md#one-owning-tool-per-setting)), mirrored in the `ConfigOwner` tag; `ApplyAnd*` assignments only on resource groups whose servers machine configuration owns; computer-side GPO links disabled as servers move ([companion guide](attribute-driven-migration.md#arc-track)) | **VK-ARC-07**: servers whose `ConfigOwner` isn't machine configuration but that carry an `ApplyAndMonitor` or `ApplyAndAutoCorrect` assignment |
| **Silent baseline loss** | A server stays disconnected past 14 days and loses its guest assignments; compliance reports stop including it rather than reporting it noncompliant | Disconnection alerts and the Advisor 30-day recommendation ([Step 8](#step-8-operating-it)) | **VK-ARC-02** |
| **Wrong cloud** | Servers onboarded to Azure Government when the tenant is GCC-Moderate, or the reverse, and a needed feature isn't there | The cloud decision recorded before Gate 1 ([1.1](#choose-the-azure-cloud)) | Gate 1 record |

: Dangers on the Arc track and their mitigations {.striped .hover}

## Step 8: Operating it {#step-8-operating-it}

### 8.1 Disconnected agents

The agent heartbeats every five minutes; a server shows **Disconnected** within 15 to 30 minutes and can become **Expired** after 45 days, after which it must be disconnected and reconnected ([Book 05](../b05-devices/09-servers-under-azure-arc.md#what-arc-changes-and-what-it-doesnt)). Operate it in three layers:

- **Alert.** A Resource Health alert on Azure Arc-enabled servers, with current status *Unavailable* and previous status *Available*, notifies on disconnection.[^arc-connectivity]
- **Escalate.** Azure Advisor raises a recommendation for a server disconnected 30 to 44 days, warning that its managed identity credential may expire. The fix is `azcmagent show`, `azcmagent check`, the network and proxy checks, and `azcmagent logs --full` if that fails.[^arc-advisor]
- **Close.** A server disconnected because it was retired is disconnected in Azure and closed in the CMDB the same week, so it doesn't count twice *(design guidance)*.

### 8.2 Agent upgrades

Microsoft supports only Connected Machine agent versions released within the last year; version 1.69 is the October 2026 release.[^arc-release-notes] In commercial Azure, automatic agent upgrade (agent 1.67 or later, PowerShell execution policy RemoteSigned on Windows, cron on Linux) can be enabled at connect, per server or by policy, and blocked locally on a server with `azcmagent config set automaticupgrade.blocklocally true`.[^arc-autoupgrade] Microsoft's agent overview still labels automatic upgrade a preview, while its own page carries no preview notice; treat it as preview until the two agree.[^arc-agent-overview] In Azure Government it isn't available, so agent upgrades go through the deployment tool on the same rings as patches *(design guidance)*.

### 8.3 Resource Graph inventory

Resource Graph is where the estate is counted. Microsoft publishes sample queries for the `microsoft.hybridcompute/machines` type, including one that lists servers not on the latest agent and excludes expired ones by `properties.status`.[^arc-arg-samples] The checks are read-only queries of the same shape:

```kusto
// Illustrative, read-only. Arc servers with their status, agent version and the tags
// the taxonomy requires; VK-ARC-01 and VK-ARC-02 read the same columns.
resources
| where type =~ 'microsoft.hybridcompute/machines'
| extend status = tostring(properties.status),
         agentVersion = tostring(properties.agentVersion),
         owner = tostring(tags['Owner']),
         patchGroup = tostring(tags['PatchGroup']),
         cmdbId = tostring(tags['CmdbId'])
| project name, resourceGroup, subscriptionId, status, agentVersion, owner, patchGroup, cmdbId
| order by status asc, name asc
```

The `agentVersion` property name is taken from Microsoft's Arc Jumpstart inventory example rather than a Learn page; check it against the kit's fixtures. The join to the CMDB on `CmdbId` (or on host name and BIOS UUID where the tag is absent) produces **VK-ARC-04**, and the correlation keys between Arc, Entra ID and Defender are in [Book 05, Chapter 03](../b05-devices/03-where-device-and-server-data-lives.md#how-the-records-correlate).

### 8.4 Evidence

The control wording is from SP 800-53 Rev. 5 as [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads) quotes it. The mapping is the program's: the architecture contributes evidence, and the assessor decides ([companion guide](attribute-driven-migration.md#federal-requirements)).

| Control | Evidence the Arc track hands over | Produced by |
|---|---|---|
| CM-2 Baseline Configuration | The baseline JSON and custom packages, versioned with review history; the assignment list exported from Azure Policy | Governance repository; Policy export |
| CM-6 Configuration Settings | Per-server, per-setting machine configuration results; exemptions with approvals and expiries; the assignment type per setting | **VK-ARC-03**; Resource Graph `guestconfigurationresources` ([Book 12](../b12-security-operations/07-patch-configuration-and-baselines.md#azure-machine-configuration-and-the-drift-export)) |
| CM-8 System Component Inventory | Arc inventory reconciled with the CMDB and the tiers, with findings and their closure; tag completeness | **VK-ARC-04**, **VK-ARC-01**, **VK-ARC-02** |
| SI-2 Flaw Remediation | Periodic assessment coverage, schedules per patch group, installation results exported past Resource Graph's 7- and 30-day windows, ESU coverage | **VK-ARC-05**; the export job |
| AU-2, AU-6, AU-12 | The Activity log for every Arc resource, policy and role change, routed out of Azure | Diagnostic settings to the SIEM ([Book 12, Appendix A](../b12-security-operations/appendix-a-requirements-mapping.md#audit-and-accountability-au)) |
| AC-6, AC-6(5) (supporting) | Role assignments at Arc scopes; PIM activations | **VK-ARC-06** |

: Evidence for the Arc track {.striped .hover}

On AU: the Activity log records control-plane operations, keeps them for 90 days, and is the only record of who created a resource, so Microsoft says to export it to keep it longer.[^arc-activity-log] Route it from each subscription before the pilot wave, so every connect and tag change is on record *(design guidance)*. The FedRAMP 20x indicators the same evidence supports are mapped for the fleet in [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#fedramp-20x-key-security-indicators).

::: {.callout-tip}
## Validate: Gate 8 (standing)
All `VK-ARC-*` checks scheduled on the continuous monitoring cadence, with results filed: **VK-ARC-01** and **VK-ARC-02** daily, **VK-ARC-03** and **VK-ARC-05** weekly, **VK-ARC-04** with the CMDB's weekly reconciliation, **VK-ARC-06** and **VK-ARC-07** monthly *(design guidance)*. The Activity log export is confirmed in the SIEM, and the Resource Graph exports are present for the period.
:::

::: {.callout-tip}
## Back to the books
[Book 05, Chapter 09 — Servers Under Azure Arc](../b05-devices/09-servers-under-azure-arc.md) · [Book 05, Chapter 03 — Where Device and Server Data Lives](../b05-devices/03-where-device-and-server-data-lives.md) · [Book 05, Chapter 10 — Operating and Evidencing the Fleet](../b05-devices/10-operating-and-evidencing-the-fleet.md) · [Book 06, Runbook R04 — Arc Deployment & the Managed Identity](../b06-data-platform/r04-arc-deployment-and-managed-identity.md) · [Book 12, Chapter 07 — Patch, Configuration and Hardening Baselines](../b12-security-operations/07-patch-configuration-and-baselines.md) · [Attribute-Driven Migration: the Arc track](attribute-driven-migration.md#arc-track) · [Ansible for Configuration Automation](ansible-configuration-automation.md#arc-onboarding-at-scale)
:::

[^arc-gov-compare]: Microsoft Learn, "Compare Azure Government and global Azure" (both clouds assessed and authorized at the FedRAMP High impact level; Azure Government's data-storage and screened-personnel commitments; don't put sensitive or restricted information in Azure resource names), <https://learn.microsoft.com/azure/azure-government/compare-azure-government-global-azure> (accessed Oct 29, 2026).
[^arc-cloud-native]: Microsoft Learn, "Cloud-native server management with Azure Arc-enabled servers" (connected machines are organized by management group, subscription and resource group and governed like Azure VMs), <https://learn.microsoft.com/azure/azure-arc/servers/cloud-native/overview> (accessed Oct 29, 2026).
[^arc-aum-assess]: Microsoft Learn, "Assessment options in Update Manager," Periodic assessment (the Arc server's subscription must be registered to `Microsoft.Compute`), <https://learn.microsoft.com/azure/update-manager/assessment-options> (accessed Oct 29, 2026).
[^arc-network]: Microsoft Learn, "Connected Machine agent network requirements," Service tags (the Azure Government and 21Vianet note on the public `AzureArcInfrastructure` ranges after October 28, 2025), URLs (Azure cloud and Azure Government tabs, private-link column), the Arc gateway tip for the Azure public cloud, and "Subset of endpoints for ESU only," <https://learn.microsoft.com/azure/azure-arc/servers/network-requirements> (accessed Oct 29, 2026).
[^arc-overview]: Microsoft Learn, "What is Azure Arc-enabled servers?," Service limits (the 800-instance per resource group limit applies to the Azure Arc Private Link Scope resource type), <https://learn.microsoft.com/azure/azure-arc/servers/overview> (accessed Oct 29, 2026).
[^arc-autoupgrade]: Microsoft Learn, "Automatically upgrade the Azure Connected Machine agent" (available only on Azure public cloud; agent 1.67 or later; RemoteSigned execution policy on Windows; cron on Linux; `--enable-automatic-upgrade`; the *Configure Azure Arc-enabled Servers to enable automatic upgrades* policy; `automaticupgrade.blocklocally`), <https://learn.microsoft.com/azure/azure-arc/servers/automatic-agent-upgrade> (accessed Oct 29, 2026).
[^arc-mc-network]: Microsoft Learn, "Azure Machine Configuration network requirements" (regional endpoints for USGovArizona, USGovTexas and USGovVirginia), <https://learn.microsoft.com/azure/governance/machine-configuration/overview/03-network-requirements> (accessed Oct 29, 2026).
[^arc-baselines]: Microsoft Learn, "Security Baselines Overview" (customizable audit baselines; CIS Linux Benchmarks and the Azure compute security baselines; JSON export; all public Azure regions; "Support for Azure Government and Sovereign Clouds is not supported for Public Preview"), <https://learn.microsoft.com/azure/governance/machine-configuration/how-to/assign-security-baselines/overview-page>; and "Deploy a Security Baseline Policy Assignment" (*[Preview] Official CIS Security Benchmarks for Linux Workloads*), <https://learn.microsoft.com/azure/governance/machine-configuration/how-to/assign-security-baselines/deploy-a-baseline-policy-assignment> (both accessed Oct 29, 2026).
[^arc-cis-win]: Microsoft Learn, "CIS Security Benchmarks for Windows Server (Preview)," Supported benchmarks and versions (Windows Server 2025, benchmark 1.0.0, L1 Member Server and L1 Domain Controller, audit only; 2022 and 2019 coming soon), <https://learn.microsoft.com/azure/osconfig/overview-cis-benchmarks-windows-server> (accessed Oct 29, 2026).
[^arc-aum-regions]: Microsoft Learn, "Supported regions for Azure Update Manager" (Azure for US Government: USGovVirginia and USGovArizona for Azure VMs and Arc-enabled servers; USGovTexas for Azure VMs only), <https://learn.microsoft.com/azure/update-manager/supported-regions> (accessed Oct 29, 2026).
[^arc-wsm]: Microsoft Learn, "Windows Server Management enabled by Azure Arc," Requirements (activation in all regions with Arc-enabled servers availability except US Gov Virginia, US Gov Arizona and three China regions), <https://learn.microsoft.com/azure/azure-arc/servers/windows-server-management-overview> (accessed Oct 29, 2026).
[^arc-dfc-gov]: Microsoft Learn, "Cloud feature availability for US Government customers," Microsoft Defender for Cloud (Microsoft Defender for servers: GA in Azure and Azure Government), <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> (accessed Oct 29, 2026).
[^arc-vmware-regions]: Microsoft Learn, "What is Azure Arc-enabled VMware vSphere?," Supported regions (refers to Azure Products by Region), <https://learn.microsoft.com/azure/azure-arc/vmware-vsphere/overview> (accessed Oct 29, 2026).
[^arc-bridge]: Microsoft Learn, "What is Azure Arc resource bridge?," Supported regions (includes US Gov Virginia; the private cloud must also be supported in the region) and Private link support (not supported), <https://learn.microsoft.com/azure/azure-arc/resource-bridge/overview> (accessed Oct 29, 2026).
[^arc-mcc]: Microsoft Learn, "What is Multicloud connector enabled by Azure Arc?," Supported regions ("isn't available in national clouds (Azure Government, Microsoft Azure operated by 21Vianet)"), <https://learn.microsoft.com/azure/azure-arc/multicloud-connector/overview> (accessed Oct 29, 2026).
[^arc-tag-policies]: Microsoft Learn, "Assign policy definitions for tag compliance" (*Inherit a tag from the resource group if missing*, modify, leaves a different existing value unchanged; *Require a tag on resources* and *Require a tag and its value on resources*, deny; remediation tasks for existing resources), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-policies> (accessed Oct 29, 2026).
[^arc-tags]: Microsoft Learn, "Use tags to organize your Azure resources and management hierarchy," Required access (Tag Contributor can tag any resource without access to the resource; Contributor can tag) and Inherit tags (resources don't inherit tags from resource groups or subscriptions), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources> (accessed Oct 29, 2026).
[^arc-enforcement]: Microsoft Learn, "Azure Policy assignment structure," Enforcement mode (`DoNotEnforce` evaluates without enforcing the effect or writing Activity log entries; recommended for testing a new assignment; remediation tasks can start for deployIfNotExists policies in `DoNotEnforce`), <https://learn.microsoft.com/azure/governance/policy/concepts/assignment-structure> (accessed Oct 29, 2026).
[^arc-dfs-support]: Microsoft Learn, "Defender for Servers support," Windows machine support and Linux machine support (Azure Arc-enabled columns: security misconfigurations, endpoint protection and missing OS patches assessments require Defender for Servers; system updates and patches require Plan 2), <https://learn.microsoft.com/azure/defender-for-cloud/support-matrix-defender-for-servers> (accessed Oct 29, 2026).
[^arc-aum-policy]: Microsoft Learn, "Azure Policy built-in policy definitions," Azure Update Manager (*Configure periodic checking for missing system updates on azure Arc-enabled servers*: every 24 hours, scope by subscription, resource group, location or tag, modify), <https://learn.microsoft.com/azure/governance/policy/samples/built-in-policies> (accessed Oct 29, 2026).
[^arc-aum-scheduled]: Microsoft Learn, "Tutorial: Enable periodic assessment and scheduled patching on Azure VMs by using a policy" (applies to Arc-enabled servers; *Schedule recurring updates using Azure Update Manager* with tag and tag-operator parameters), <https://learn.microsoft.com/azure/update-manager/tutorial-assessment-deployment-using-policy>; and "Azure Update Manager frequently asked questions," Fundamentals (dynamic scoping by subscription, location, resource group and tags), <https://learn.microsoft.com/azure/update-manager/update-manager-faq> (both accessed Oct 29, 2026).
[^arc-aum-workflow]: Microsoft Learn, "How Update Manager works," Update process (reports what the configured update source offers, including WSUS and local Linux repositories) and Update-related data stored in Azure Resource Graph (`patchassessmentresources` 7 days; `patchinstallationresources` 30 days), <https://learn.microsoft.com/azure/update-manager/workflow-update-manager> (accessed Oct 29, 2026).
[^arc-rbac-scope]: Microsoft Learn, "Understand scope for Azure RBAC," Scope levels (four levels: management group, subscription, resource group and resource; lower levels inherit role permissions from higher levels), <https://learn.microsoft.com/azure/role-based-access-control/scope-overview> (accessed Oct 29, 2026).
[^arc-abac]: Microsoft Learn, "What is Azure attribute-based access control (Azure ABAC)?," Where can conditions be added? (role assignments with blob storage or queue storage data actions), <https://learn.microsoft.com/azure/role-based-access-control/conditions-overview> (accessed Oct 29, 2026).
[^arc-connectivity]: Microsoft Learn, "Troubleshoot Azure Arc-enabled servers in disconnected scenarios," Disconnected server alerts (Resource Health alert: resource type Azure Arc-enabled servers, current status Unavailable, previous status Available), <https://learn.microsoft.com/azure/azure-arc/servers/troubleshoot-connectivity> (accessed Oct 29, 2026).
[^arc-advisor]: Microsoft Learn, "Resolve Azure Advisor recommendations for Azure Arc-enabled servers," Restore connectivity for 30+ day disconnected Arc-enabled server (30 through 44 days; managed identity credential may expire; `azcmagent show`, `azcmagent check`, `azcmagent logs --full`), <https://learn.microsoft.com/azure/azure-arc/servers/resolve-azure-advisor-recommendations> (accessed Oct 29, 2026).
[^arc-release-notes]: Microsoft Learn, "What's new with Azure Connected Machine agent" (only versions released within the last year are officially supported; version 1.69, October 2026), <https://learn.microsoft.com/azure/azure-arc/servers/agent-release-notes> (accessed Oct 29, 2026).
[^arc-agent-overview]: Microsoft Learn, "Overview of Azure Connected Machine agent" (the one-year support warning links "enable automatic agent upgrades (preview)"), <https://learn.microsoft.com/azure/azure-arc/servers/agent-overview> (accessed Oct 29, 2026).
[^arc-arg-samples]: Microsoft Learn, "Azure Resource Graph sample queries for Azure Arc-enabled servers" (queries on `microsoft.hybridcompute/machines`; the outdated-agent query excludes `properties.status` Expired; Azure and Azure Government portal links), <https://learn.microsoft.com/azure/azure-arc/servers/resource-graph-samples> (accessed Oct 29, 2026).
[^arc-activity-log]: Microsoft Learn, "Activity log in Azure Monitor" (control-plane operations; 90-day retention; the only place that stores a resource's creator; export through a diagnostic setting to a Log Analytics workspace, storage or Event Hubs), <https://learn.microsoft.com/azure/azure-monitor/fundamentals/activity-log> (accessed Oct 29, 2026).
