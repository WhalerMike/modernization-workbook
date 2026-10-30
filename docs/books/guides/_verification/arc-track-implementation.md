# Verification — Guide: Azure Arc Track: Implementation Guide

New guide, first pass of 2026-10-29. The guide is an implementation view over Book 05 Ch 03, 06, 09 and 10, Book 06 R04, Book 12 Ch 07 and Appendix A, Book 14 Ch 03, the Attribute-Driven Migration guide (Arc track, coverage, tiers, non-person identity track, federal requirements) and the Ansible guide (Arc onboarding at scale, one owning tool per setting, Linux and Unix, VMware, cloud VMs, STIG content). Facts carried from those pages are cited by link to the section that states them and rely on those pages' own verification logs. Every Microsoft Learn page footnoted in the guide was opened on 2026-10-29 through the Microsoft Learn documentation service. No personal name or email address was sent in any request.

## Claims log: Microsoft Learn (footnoted, new to this guide)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Azure and Azure Government both assessed and authorized at FedRAMP High; Government adds US data-storage and screened-personnel commitments; no sensitive or restricted information in resource names | 1.1; 2.3 | verified | `arc-gov-compare` |
| 2 | Arc servers organized by management group, subscription and resource group; policies, RBAC and tags apply as for Azure VMs | 1.2 | verified (same page as companion `adm-arc-cloud-native`) | `arc-cloud-native` |
| 3 | Periodic assessment on Arc servers needs the subscription registered to `Microsoft.Compute` | 1.2 | verified | `arc-aum-assess` |
| 4 | Endpoint lists for Azure cloud and Azure Government (Entra, ARM, `*.his.arc.azure.*`, `*.guestconfiguration.azure.*`); private-link column; public endpoints still needed with private link | 1.3; 1.5 | verified (read both tabs) | `arc-network` |
| 5 | Government and 21Vianet: add public-cloud `AzureArcInfrastructure` ranges; required after October 28, 2025; Government tags no longer supported for this | 1.3 | verified (wording of the Important note) | `arc-network` |
| 6 | Allow the full `AzureArcInfrastructure` tag (regional ranges lack global components); allow regional Entra endpoints despite fallback | 1.3 | verified | `arc-network` |
| 7 | Arc gateway tip scoped to "the Azure public cloud platform" | 1.3; 1.5 | verified; the guide says "not documented" for Government rather than "not available" | `arc-network` |
| 8 | ESU-only endpoint subset exists for Azure Government | 1.5 | verified | `arc-network` |
| 9 | Private Link Scope: 800-instance per resource group limit | 1.3 | verified | `arc-overview` |
| 10 | Automatic agent upgrade: public cloud only; agent 1.67+; RemoteSigned; cron; `--enable-automatic-upgrade`; built-in policy; `automaticupgrade.blocklocally` | 1.5; 3.2; 4.1; 8.2 | verified | `arc-autoupgrade` |
| 11 | Agent overview links "enable automatic agent upgrades (preview)" while the feature page has no preview notice | 8.2 | verified as an inconsistency between Microsoft's pages; the guide treats the feature as preview | `arc-agent-overview`; `arc-autoupgrade` |
| 12 | Machine configuration regional endpoints for USGovArizona, USGovTexas, USGovVirginia | 1.5 | verified (used as evidence of availability; the page is a network table, not an availability statement) | `arc-mc-network` |
| 13 | Customizable security baselines: audit baselines, CIS Linux and Azure compute baselines, JSON export, all public regions, Government not supported during public preview; CIS Linux policy name carries [Preview] | 1.5; 4.2 | verified | `arc-baselines` |
| 14 | CIS for Windows Server preview: Windows Server 2025 only, benchmark 1.0.0, L1 member server and DC, audit only, 2022/2019 coming soon | 4.2 | verified | `arc-cis-win` |
| 15 | Update Manager Government regions: Virginia and Arizona for Arc; Texas Azure VMs only | 1.5; Step 5 | verified | `arc-aum-regions` |
| 16 | Windows Server Management activation unavailable in US Gov Virginia and US Gov Arizona | 1.5 | verified | `arc-wsm` |
| 17 | Defender for servers GA in Azure and Azure Government | 1.5; 4.4 | verified | `arc-dfc-gov` |
| 18 | Arc-enabled VMware vSphere regions: page defers to products-by-region; resource bridge lists US Gov Virginia, needs the private cloud supported in-region, no private link | 1.5 | verified; Government availability of Arc-enabled VMware itself **not confirmed** (products-by-region page not opened) | `arc-vmware-regions`; `arc-bridge` |
| 19 | Multicloud connector not available in national clouds, including Azure Government | 1.4; 1.5 | verified | `arc-mcc` |
| 20 | Tag policies: *Inherit a tag from the resource group if missing* (modify; leaves different existing value); *Require a tag on resources* and *Require a tag and its value on resources* (deny); remediation for existing resources; definition ID `871b6d14-10aa-478d-b590-94f262ecfa99` | 2.2; 2.4 | verified (ID read from the page's portal link) | `arc-tag-policies` |
| 21 | Tag Contributor can tag without resource access; Contributor can tag; resources don't inherit tags | 2.3 | verified | `arc-tags` |
| 22 | `enforcementMode` `DoNotEnforce`: evaluates without enforcing or Activity log entries; recommended for testing; remediation tasks still start for deployIfNotExists | 2.4; 4.3 | verified | `arc-enforcement` |
| 23 | RBAC scope levels: management group, subscription, resource group, resource; inheritance downward | 2.3 | verified | `arc-rbac-scope` |
| 24 | Defender for Servers support matrix, Arc columns: misconfiguration, endpoint protection and missing-patch assessments need Defender for Servers; system updates and patches need Plan 2 | 4.4 | verified | `arc-dfs-support` |
| 25 | Built-in *Configure periodic checking for missing system updates on azure Arc-enabled servers*: 24 hours, scope by subscription/RG/location/tag, modify | Step 5 | verified | `arc-aum-policy` |
| 26 | *Schedule recurring updates using Azure Update Manager* with tag parameters, applies to Arc; dynamic scoping by subscription, location, RG, tags | Step 5 | verified | `arc-aum-scheduled` |
| 27 | Resource Graph retention: `patchassessmentresources` 7 days, `patchinstallationresources` 30 days; Update Manager reports what WSUS or the local repository offers | Step 5; 8.4 | verified | `arc-aum-workflow` |
| 28 | ABAC conditions only on role assignments with blob or queue storage data actions | 6.3 | verified (same page as companion `adm-abac`) | `arc-abac` |
| 29 | Resource Health alert settings for disconnected Arc servers | 8.1 | verified | `arc-connectivity` |
| 30 | Advisor recommendation at 30–44 days disconnected; credential may expire; `azcmagent show/check/logs --full` | 8.1 | verified | `arc-advisor` |
| 31 | Only agent versions released within the last year supported; 1.69 is October 2026 | 8.2 | verified | `arc-release-notes` |
| 32 | Resource Graph sample queries on `microsoft.hybridcompute/machines`; outdated-agent query filters `properties.status` != Expired; Government portal links | 8.3 | verified | `arc-arg-samples` |
| 33 | Activity log: control-plane operations, 90-day retention, only record of a resource's creator, export via diagnostic settings | 8.4 | verified | `arc-activity-log` |

## Claims log: carried from the books and guides (linked, not footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 40 | GCC-Moderate tenant → commercial Azure subscription, `--cloud AzureCloud`; Azure Government SQL Server limits; resource providers; proxy and engine path; rollback re-grants after reconnect; token test | 1.1, 1.2, 1.3, 3.3, Gate 3 | carried | B06 R04 |
| 41 | Service tags incl. `AzureFrontDoor.Frontend`; `azcmagent check`; proxy adds no security; roles and indirect-administrator warning; onboarding SP command, certificate, scope; credential protection and GPO method; connect, naming, images; lockdown; day-one baseline; 14-day guest assignment retention; ESU dates; Entra sign-in requirements and no Conditional Access; rollback order; heartbeat/Disconnected/Expired | Throughout | carried | B05 Ch09 (each linked section) |
| 42 | Coverage matrix and tiers 1–4; CM-8 tie | 1.4 | carried | Companion guide Arc coverage and tiers; B05 Ch03 |
| 43 | CMDB as source of business facts, importing technical states; record correlation | 2.2; 8.3 | carried | B05 Ch03 |
| 44 | `azure.azcollection.azure_arc` role; managed identity of the control node recommended; `config_owner` rule; Linux end-of-agent dates and CIS-hardened note; STIG content | 3.1, 3.2, 4.2, Step 7 | carried | Ansible guide |
| 45 | Assignment types `Audit`, `ApplyAndMonitor`, `ApplyAndAutoCorrect`; no audit-then-remediate mode; baseline lifecycle; SI-2 scoping; CM-8 join key | 4.2, 4.3, Step 5, 8.4 | carried | B12 Ch07 |
| 46 | Control wording CM-2, CM-6, CM-8, SI-2; FedRAMP 20x KSIs | 8.4 | carried | B05 Ch10 |
| 47 | AU mapping | 8.4 | carried | B12 Appendix A |
| 48 | Owners and application management policies for service principals | 3.1; Step 7 | carried | Companion guide non-person track |

## Design guidance (labelled in the guide)

Management group, subscription and resource-group layout (1.2); the `CmdbId` and `ConfigOwner` tags and the CMDB-source column (2.1); the one-writer rule and the reconciliation identity (2.2); onboarding method by population (3.2); the wave plan (3.3); the assignment table (4.1); preview baselines as assessment aids (4.2); the export of Update Manager tables and the two-day assessment threshold (Step 5); the role table scopes (6.1); retired-server closure and agent upgrades on patch rings in Government (8.1, 8.2); Activity log export before the pilot (8.4); the check cadence (Gate 8).

## Discrepancies and corrections noted

| Item | Finding | Handling |
|---|---|---|
| vCenter versions | Arc-enabled VMware vSphere overview: "works with vCenter Server version 8"; Arc resource bridge overview: VMware vSphere 7.0 and 8.0 supported for the bridge | The guide carries Book 05 and the companion guide (vCenter 8) and doesn't restate a version |
| Automatic agent upgrade status | Preview per the agent overview; no preview notice on the feature page | Labelled preview in 8.2, with the inconsistency stated |
| `properties.agentVersion` | The Learn samples page names agent-version queries but the property name was read from Microsoft's Arc Jumpstart inventory example (GitHub), not a Learn page | Stated in 8.3; the kit's fixtures should confirm |
| SCVMM "no new onboardings by October 2026" | Today is October 29, 2026; carried from B05 | Phrased as "from October 2026" |

## Not verified

| Item | Status |
|---|---|
| Arc-enabled VMware vSphere and Arc-enabled SCVMM in Azure Government | Not stated on the Learn pages opened; Azure Products by Region not opened. Labelled "not stated" in 1.5 |
| Whether a deny-effect required-tag policy blocks Arc agent metadata updates on existing servers that lack the tag | Not documented on the pages opened; the guide stages deny behind `DoNotEnforce` and a pilot |
| `az policy assignment create` parameter quoting in PowerShell | Illustrative; not run |

## Validation kit checks referenced

Existing: VK-ARC-01 to VK-ARC-05; VK-NPI-01, VK-NPI-02, VK-NPI-03, VK-NPI-07.

**Proposed by this guide (next numbers in the Arc track; reported to the parent session):**

- **VK-ARC-06**: role assignments at the Arc management group, subscriptions and resource groups: Owner or Contributor outside break-glass; Azure Connected Machine Resource Administrator and the Virtual Machine login roles active rather than PIM-eligible; the Azure Connected Machine Onboarding role on any scope without an open wave; assignees that are individual users rather than groups or owned non-person identities.
- **VK-ARC-07**: servers whose `ConfigOwner` tag (or CMDB `config_owner`) isn't Arc machine configuration but that carry an `ApplyAndMonitor` or `ApplyAndAutoCorrect` guest assignment (two tools on one setting).

## Addition, October 30, 2026

| Claim | Where | Verdict |
|---|---|---|
| Optional `PatchOwner` tag mirroring the CMDB's patch owner; only `UpdateManager` servers get scheduled patching | Step 2 tag table | design guidance, labeled; links Book 05 Ch 09, Azure Update Manager, which carries the rule and its verification (G6) |
