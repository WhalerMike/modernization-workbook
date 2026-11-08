---
title: "Distribution Point Consolidation: An Implementation Guide"
description: "A step-by-step guide to consolidating Configuration Manager distribution points, from the analysis of the existing estate to the last distribution point retired and its site roles cleaned up: inventory and analysis, sizing against Microsoft's limits, the decision gate on the funding ask, the hub tier of pull distribution points, boundary groups and fallback, peer cache, BranchCache and Delivery Optimization, a pilot wave and office waves that drain and remove each branch distribution point, packaging on PSAppDeployToolkit, the co-management workload shifts, Connected Cache at the hubs, and the five retirement gates. Every step has copy-paste commands from the Configuration Manager cmdlets documented on Microsoft Learn, its expected output, a rollback, its Learn source, and the federal requirements, KSIs and evidence it produces. A scripts kit with fixtures runs Lab 1 with no hierarchy."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 09"
last-reviewed: 2026-11-08
review-status: pending
---
# Distribution Point Consolidation: An Implementation Guide

*Read the estate first, change one office at a time, and keep every change one command away from undone.*

::: {.callout-note}
## In this guide
How to consolidate a Configuration Manager estate from a distribution point in every office to a small hub tier, and then retire the hub tier when the five gates close. Eleven steps, from Step 0, the analysis of the existing estate, to Step 10, the last distribution point retired and its site roles cleaned up. Each step gives copy-paste commands, what they print, how to roll them back, the Microsoft Learn page each command comes from, and the federal requirements, KSIs and evidence it produces. The [scripts kit](#the-kit) does the reading, sizing and planning; [Lab 1](#lab-1) runs it on a fictional estate with no hierarchy, and [Lab 2](#lab-2) on a test hierarchy. Whether to do this at all is the [decision guide](dp-consolidation.md)'s question; when, is the [Content Delivery Modernization](../../project-plans/content-delivery.md) plan's.
:::

::: {.callout-warning}
## Not run against a live hierarchy
The commands, cmdlet names and parameters in this guide were checked against their Microsoft Learn pages on November 8, 2026, and the kit was tested against fixtures. None of the steps has been run against a live Configuration Manager hierarchy. Run every step first in a test hierarchy (Stage 1), then in production (Stage 2), as [Stage 1, Stage 2 and go/no-go](#go-no-go) sets out.
:::

## How to use this guide {#how-to-use}

- **Two stages.** Stage 1 runs every step in a test hierarchy, with the kit's change scripts first as dry runs and then with `-Apply`. Stage 2 runs the same steps in production, office wave by office wave. The [go/no-go criteria](#go-no-go) sit between them.
- **Link, don't repeat.** The case for consolidation, the costs and the architecture are in [Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md) and the [decision guide](dp-consolidation.md). This guide says only how.
- **Commands.** Every command is in a block you can copy. Commands for the site run in Windows PowerShell 5.1 on a machine with the Configuration Manager console, because Learn says a few Configuration Manager cmdlets don't run on PowerShell 7.[^dpi-cm-ps] Values you supply are written as `<placeholders>`, listed once [below](#placeholders).
- **Labels.** *(Design guidance)* marks the program's recommendations. Facts cite Microsoft Learn, read on November 8, 2026 unless the note says otherwise, and are logged in this guide's [verification file](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/dp-consolidation-implementation.md).
- **Starting state.** A Configuration Manager hierarchy with a distribution point in most offices, co-management turned on but early, and a Microsoft 365 GCC (Moderate) tenant, as in the decision guide. The minimum server standard is Windows Server 2019, the workbook's planning assumption; a Windows Server 2016 host is allowed only as a recorded exception.

### The kit {#the-kit}

**Download:** [dp-consolidation.zip](../../../downloads/dp-consolidation.zip), from [`examples/dp-consolidation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/dp-consolidation) in the repository. Its README lists each script, what it writes and its known limits.

| Script | Step | Changes anything? |
|---|---|---|
| `Invoke-DpcInventory.ps1` | 0 | No |
| `Get-DpcSizing.ps1` | 1 | No |
| `New-DpcHubTier.ps1` | 3 | Only with `-Apply` |
| `Set-DpcBoundaryGroups.ps1` | 4 | Only with `-Apply` |
| `Set-DpcPeerCache.ps1` | 5 | Only with `-Apply` |
| `Invoke-DpcOfficeRetirement.ps1` | 6 and 10 | `-Step Check` never; `Drain` and `Remove` only with `-Apply` |
| `Test-DpcPackaging.ps1` | 7 | No |
| `Test-DpcRetirementGates.ps1` | 10 | No |

: The kit's scripts {.striped}

Every run writes a folder with one CSV and one JSON per table and `manifest.json`, which holds the SHA-256 of every file and the controls and KSIs each file is evidence for. The change scripts write `plan.csv`: every command they will run, or ran, and its rollback.

### Placeholders {#placeholders}

| Placeholder | What to put there |
|---|---|
| `<KitFolder>` | Where you unzipped the kit, for example `D:\dp-consolidation` |
| `<SiteCode>` | The primary site's three-character code |
| `<ProviderFqdn>` | The FQDN of the server with the SMS Provider (usually the site server) |
| `<PackageSourceShare>` | The UNC path that holds application source folders |
| `<ContentDrive>` | The drive letter of a distribution point's content library |
| `<AppName>` | An application's name as the console shows it |
| `<CollectionName>` | A device collection's name |
| `<DpFqdn>` | A distribution point's FQDN |
| `<Wave>` | A wave name from `waves.csv`: `Pilot`, `Wave 2` and so on |
| `<Hub>` | A hub name from `hub-design.csv`, for example `HUB-EAST` |
| `<BoundaryGroup>` | A boundary group's name |
| `<PeerSourceCollection>` | The collection of clients chosen as peer cache sources |
| `<OfficeClientCollection>` | The collection of office clients in the current wave |
| `<ClientSettingName>` | The custom client settings that hold the software updates setting |
| `<PsadtVersion>` | The PSAppDeployToolkit release the agency approved, for example `4.1.7` |
| `<PackageWorkFolder>` | A working folder for new packages |
| `<AppFolder>` | One application's package folder name |
| `<InstallerPath>` | The vendor installer for that application |
| `<CodeSigningThumbprint>` | The thumbprint of the agency's code-signing certificate |
| `<IntuneWinOut>` | The output folder for `.intunewin` files |
| `<RunTimeAccount>` | The account that runs Connected Cache on a hub cache host (Step 9) |

: Values you supply {.striped}

### Connect to the site {#connect}

The kit's live scripts connect for you. To run the cmdlets in this guide by hand, start each session with the commands from Learn's getting-started page.[^dpi-cm-ps]

```powershell
Import-Module ConfigurationManager
New-PSDrive -Name '<SiteCode>' -PSProvider CMSite -Root '<ProviderFqdn>'
Set-Location '<SiteCode>:'
Get-CMSite
```

**Expected output:** `Get-CMSite` lists the site with its code and server. `Import-Module ConfigurationManager` works from version 2111; on an older console, Learn's page gives the path to `ConfigurationManager.psd1` instead. `New-PSDrive` is needed only the first time on a machine. Return to the kit with `Set-Location '<KitFolder>'`.

## The path on one page {#path}

| Step | What it establishes | Kit | Plan phase |
|---|---|---|---|
| [0. Analyze the existing estate](#step-0) | Every DP, boundary group, site role and content source; clients per DP and group; distribution status; circuits; packaging; workloads; OS exceptions | `Invoke-DpcInventory.ps1` | 0 |
| [1. Size and design](#step-1) | DP count against 4,000 clients each; hubs; office waves | `Get-DpcSizing.ps1` | 0 |
| [2. The decision gate](#step-2) | The funding ask decided on the evidence | the decision guide | 1 |
| [3. Build the hub tier](#step-3) | Pull DPs at the hubs, a DP group per hub, content distributed | `New-DpcHubTier.ps1` | 2 |
| [4. Boundary groups and fallback](#step-4) | Office groups point at their hub; fallback to the other hubs | `Set-DpcBoundaryGroups.ps1` | 3 |
| [5. Peer cache, BranchCache, Delivery Optimization](#step-5) | Content stays in the office | `Set-DpcPeerCache.ps1` | 3 |
| [6. Office waves](#step-6) | Each office DP checked, drained, watched and removed | `Invoke-DpcOfficeRetirement.ps1` | 4 |
| [7. Packaging on PSAppDeployToolkit](#step-7) | One wrapper; the same package from either tool | `Test-DpcPackaging.ps1` | 5 |
| [8. Co-management workload shifts](#step-8) | Apps, updates and provisioning off Configuration Manager content | — | 6 |
| [9. Connected Cache at the hubs](#step-9) | Cloud content cached at the hubs, off DP hardware | — | 7 |
| [10. The five gates and the last DP](#step-10) | The hub tier retired and its site roles cleaned up | `Test-DpcRetirementGates.ps1`, `Invoke-DpcOfficeRetirement.ps1` | 8 |

: The steps, the kit and the plan {.striped .hover}

## Step 0: analyze the existing estate {#step-0}

Nothing changes in this step. It produces the numbers every later step and the [decision guide](dp-consolidation.md#worksheet)'s worksheet need.

### Step 0.1: fill in the inputs no cmdlet reads {#step-0-1}

Three facts come from people, not from the site: circuit data (network engineering), co-management workload states (endpoint engineering, from the console's **Cloud Attach** node, co-management properties, **Workloads** tab[^dpi-switch]) and where each control's evidence comes from (the ISSO).

```powershell
Set-Location '<KitFolder>'
Copy-Item .\config\offices.example.csv .\config\offices.csv
Copy-Item .\config\workloads.example.csv .\config\workloads.csv
Copy-Item .\config\evidence-sources.example.csv .\config\evidence-sources.csv
notepad .\config\offices.csv
```

Replace the example rows with your own, one file at a time. **Expected:** three CSVs with your offices, your workload slider positions (`ConfigurationManager`, `PilotIntune` or `Intune`) and your evidence sources. **Rollback:** none needed; these are local files. Keep them inside the boundary.

### Step 0.2: measure the content library {#step-0-2}

Run on one full distribution point, in an elevated session there. The content library is the single-instance store under `SCCMContentLib`.[^dpi-contentlib]

```powershell
(Get-ChildItem -LiteralPath '<ContentDrive>:\SCCMContentLib' -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB
```

**Expected:** one number, the library size in GB. Record it in the decision guide's worksheet (row I7). **Rollback:** none; read-only.

### Step 0.3: run the inventory {#step-0-3}

```powershell
Set-Location '<KitFolder>'
.\Invoke-DpcInventory.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -OfficesCsv .\config\offices.csv -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv -PackageSourceRoot '<PackageSourceShare>' -OutputPath .\out\inventory
```

What it reads, all read-only:

- Every distribution point, with `Get-CMDistributionPointInfo`: server, site, pull DP, PXE and operating system, from the `SMS_DistributionPointInfo` class.[^dpi-dpinfo] Each DP's OS build is read from the server with `Get-CimInstance Win32_OperatingSystem`.
- Every boundary group with `Get-CMBoundaryGroup`, its boundaries with `Get-CMBoundary -BoundaryGroupName`, and its site systems with `Get-CMBoundaryGroupSiteSystem -GroupName`.[^dpi-bg-read]
- Distribution status per DP from the SMS Provider's `SMS_DPStatusInfo` class: content installed, in error and in progress.[^dpi-dpstatus]
- Every site system role with `Get-CMSiteRole -AllSite`, so a DP that also holds another role is caught before removal.[^dpi-siterole]
- Active clients by subnet and Active Directory site from `SMS_R_System`, matched to IP subnet and AD site boundaries to count clients per boundary group and per DP.[^dpi-rsystem]
- Applications with `Get-CMApplication -Fast`, packages with `Get-CMPackage -Fast`, deployments with `Get-CMDeployment -FeatureType`, and task sequence deployments with `Get-CMTaskSequenceDeployment`.[^dpi-apps] Each application's source folder under `<PackageSourceShare>` is checked for a PSAppDeployToolkit wrapper.

**Expected output** (Lab 1's fictional estate; yours has your numbers):

```text
Distribution points: 14 (12 in offices); clients: 9835; boundary groups: 13
Applications: 10 (5 on PSAppDeployToolkit); packages: 4; task sequence deployments: 1
Findings: 4 Finding, 3 Warn, 3 Info
Written to <KitFolder>\out\inventory (manifest.json holds the SHA-256 of every file)
```

**Rollback:** none; the script calls only Get cmdlets and CIM reads.

### Step 0.4: read the findings {#step-0-4}

```powershell
Import-Csv .\out\inventory\findings.csv | Format-Table Id, Severity, Target, Finding -AutoSize
Import-Csv .\out\inventory\dp-inventory.csv | Format-Table Server, Region, OsRelease, OsStatus, ClientsServed, LoadPctOfLimit, ContentErrors -AutoSize
```

| Finding | Means | Do |
|---|---|---|
| DPC-INV-01 | A DP below Windows Server 2019 | Retire it in an early wave, or upgrade it in place; Learn supports in-place upgrade of a site system's OS to 2019, 2022 or 2025 from 2016 and from 2012 R2 to 2016, 2019 or 2025[^dpi-upgrade] |
| DPC-INV-02 | A Windows Server 2016 DP | A recorded exception to the 2019 minimum, with a date |
| DPC-INV-04 | Hardware out of vendor support (SA-22) | Retire it first; don't refresh it |
| DPC-INV-05 | A DP over 80% of the 4,000-client limit | Size the hub for it in Step 1 |
| DPC-INV-06 | Content distribution errors | Fix before the hub build copies the same content |
| DPC-INV-07, -08 | PXE or Connected Cache on a DP | Retirement gates 3 and 4 depend on them |
| DPC-INV-10 | Clients on a subnet no boundary covers | Add a boundary before Step 4, or those clients use fallback only |

: Inventory findings {.striped}

To see one application's distribution status in detail:

```powershell
Set-Location '<SiteCode>:'
Get-CMApplication -Name '<AppName>' -Fast | Get-CMDistributionStatus | Select-Object Targeted, NumberSuccess, NumberErrors, NumberInProgress
Set-Location '<KitFolder>'
```

**Expected:** one row; `NumberErrors` should be 0.[^dpi-diststatus]

::: {.callout-note}
## Validate Step 0
The inventory run exists with its manifest; every office has circuit data; every DP's OS status is known; the findings have owners. Check the manifest still matches its files:

```powershell
Import-Module .\powershell\DpConsolidation\DpConsolidation.psm1
Test-DpcManifest -Path .\out\inventory\manifest.json
```

**Expected:** `True`.
:::

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-8, system component inventory; M-22-09's device inventory goal | KSI-PIY-GIV | `dp-inventory`, `site-roles`, `clients-by-boundary-group` and `manifest.json` from the run |
| SA-22, unsupported system components | KSI-SCR-MIT | `findings.csv`: DPC-INV-01, -02 and -04 with their owners and dates |
| CM-6, configuration settings (boundary groups as configured) | KSI-CMT-LMC | `boundary-groups` from the run |

: Step 0 requirements and evidence {.striped}

## Step 1: size and design {#step-1}

Size the hub tier to client count, not office count, against Learn's size-and-scale numbers: 4,000 clients per distribution point, 250 standard DPs per site and 2,000 more as pull DPs.[^dpi-sizescale]

### Step 1.1: write the hub design {#step-1-1}

```powershell
Copy-Item .\config\hub-design.example.csv .\config\hub-design.csv
notepad .\config\hub-design.csv
```

One row per hub: its region (matching `offices.csv`), its boundary group, its two pull DP servers and its source DPs in rank order. The servers must run Windows Server 2019 or later; Learn supports the distribution point role on Windows Server 2019, 2022 and 2025.[^dpi-siteos]

### Step 1.2: run the sizing {#step-1-2}

```powershell
.\Get-DpcSizing.ps1 -InventoryPath .\out\inventory -HubDesignCsv .\config\hub-design.csv -TargetUtilization 0.75 -MinCircuitMbps 100 -MaxPeakUtilPct 70 -PilotOffices 2 -OutputPath .\out\sizing
```

**Expected output** (Lab 1):

```text
Clients: 9800. At 4000 per DP: 3 DPs at the limit, 4 at 75% utilization.
  HUB-EAST (East): 5 offices, 4030 clients, 2 pull DPs planned, 50.4% of the limit per DP
  HUB-CENTRAL (Central): 4 offices, 2780 clients, 2 pull DPs planned, 34.8% of the limit per DP
  HUB-WEST (West): 3 offices, 2390 clients, 2 pull DPs planned, 29.9% of the limit per DP
Planned tier: 6 pull DPs at hubs + 2 source DPs = 8; office DPs to retire: 12
Check: Standard DPs per site (limit 250): pass (2)
Check: Pull DPs per site (limit 2,000): pass (6)
Check: Every hub under 80% of the per-DP limit: pass (50.4)
Waves: Pilot=OFF08,OFF02; Wave 2=OFF06,OFF10,OFF04,OFF07; Wave 3=OFF01,OFF11,OFF12,OFF05; Wave 4=OFF03,OFF09
```

Offices whose circuit is ready go first, by renewal date; offices below the circuit threshold go last, with a note to upgrade the circuit or prove that peers carry the load *(design guidance)*. **Rollback:** none; read-only. Rerun with other values until the design holds.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-8; CM-3, a documented design decision | KSI-PIY-GIV; KSI-CMT-LMC | `sizing` and `waves` from the run; the hub design CSV under change control |

: Step 1 requirements and evidence {.striped}

## Step 2: the decision gate on the funding ask {#step-2}

Take Step 0 and Step 1 into the [decision guide](dp-consolidation.md): answer its five questions, fill its [worksheet](dp-consolidation.md#worksheet), and use its [decision table](dp-consolidation.md#options). Nothing below this step starts until the decision is recorded.

**Go** when the decision is filed in the program's decision register with the worksheet and the two kit runs attached, and the budget submission matches it. **No-go** keeps the estate as it is; nothing has changed, so there is nothing to roll back.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-3, configuration change control (decision documented and retained); SA-22 | KSI-CMT-LMC, KSI-CMT-RVP; KSI-SCR-MIT | The decision record with the worksheet and the inventory and sizing runs |

: Step 2 requirements and evidence {.striped}

## Step 3: build the hub tier {#step-3}

Each hub gets two pull distribution points that pull content from the data center DPs in rank order, so the site server doesn't distribute to every hub itself.[^dpi-install-dp]

### Step 3.1: plan the build (dry run) {#step-3-1}

```powershell
.\New-DpcHubTier.ps1 -InventoryPath .\out\inventory -HubDesignCsv .\config\hub-design.csv -SiteCode '<SiteCode>' -OutputPath .\out\hub-plan
Import-Csv .\out\hub-plan\plan.csv | Format-Table Step, Target, Command -Wrap
```

For each hub, the plan holds, in order: `New-CMSiteSystemServer` for each server; `Add-CMDistributionPoint -EnablePullDP -SourceDistributionPoint -SourceDPRank` for each; `New-CMDistributionPointGroup`; `Add-CMDistributionPointToGroup` for each DP; and `Start-CMContentDistribution -DistributionPointGroupName` for every deployed application and package.[^dpi-sitesystem][^dpi-add-dp][^dpi-dpg][^dpi-content] Every row has its rollback.

**Expected output** (Lab 1, first lines):

```text
DryRun: 27 changes for 3 hubs (dry-run=27)
  New-CMSiteSystemServer -SiteCode 'LAB' -SiteSystemServerName 'east-dp01.lab.example'
  Add-CMDistributionPoint -CertificateExpirationTimeUtc '2028-11-08' -EnablePullDP -SiteCode 'LAB' -SiteSystemServerName 'east-dp01.lab.example' -SourceDistributionPoint 'dc1-dp01.lab.example','dc2-dp01.lab.example' -SourceDPRank 1,2
```

The script adds the role with a self-signed certificate, the cmdlet's default parameter set. For HTTPS with a PKI certificate, add the role in the console or with `-CertificatePath` and `-CertificatePassword`, as the `Add-CMDistributionPoint` page describes.[^dpi-add-dp]

### Step 3.2: apply it {#step-3-2}

```powershell
.\New-DpcHubTier.ps1 -InventoryPath .\out\inventory -HubDesignCsv .\config\hub-design.csv -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -Apply -OutputPath .\out\hub-apply
```

**Expected:** `Apply: 27 changes for 3 hubs (applied=27)` for the Lab 1 design; the count is yours. The script stops at the first failure and marks the rest not applied. **Rollback:** run the `Rollback` column of `out\hub-apply\plan.csv` from the bottom up for every row marked `applied`. `Remove-CMDistributionPoint -Force` removes a DP role; `Remove-CMDistributionPointGroup -Name -Force` removes a group.[^dpi-remove-dp][^dpi-dpg]

### Step 3.3: validate the hub tier {#step-3-3}

```powershell
Set-Location '<SiteCode>:'
Get-CMDistributionPointInfo | Where-Object IsPullDP | Select-Object ServerName, IsPullDP, IsPXE, OperatingSystem
Invoke-CMContentValidation -ApplicationName '<AppName>' -DistributionPointGroupName 'DPG-<Hub>'
Get-CMApplication -Name '<AppName>' -Fast | Get-CMDistributionStatus | Select-Object Targeted, NumberSuccess, NumberErrors
Set-Location '<KitFolder>'
.\Invoke-DpcInventory.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -OfficesCsv .\config\offices.csv -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv -PackageSourceRoot '<PackageSourceShare>' -OutputPath .\out\inventory-hubs
```

**Expected:** every hub DP listed with `IsPullDP` true and no PXE; `NumberErrors` 0 for each application checked; the new inventory shows the hub DPs with their content installed and no errors.[^dpi-validate]

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-2 and CM-6, baseline and settings for each new server | KSI-CMT-RMV, KSI-MLA-EVC, KSI-SVC-ACM, KSI-CMT-LMC | The server baseline scan; `out\hub-apply\plan.csv` with every change and its status |
| CM-3, configuration change control | KSI-CMT-LMC, KSI-CMT-RVP | The change record that approved the plan, with the dry-run `plan.csv` attached |
| CM-8 | KSI-PIY-GIV | The SSP component entries; the `inventory-hubs` run |
| CP-10, recovery: two DPs per hub, content restorable from the source tier | KSI-RPL-ABO, KSI-RPL-ARP, KSI-RPL-RRO, KSI-RPL-TRC | The hub design; a tested redistribution to one hub DP |

: Step 3 requirements and evidence {.striped}

## Step 4: boundary groups and fallback {#step-4}

Each office's boundary group gets its hub's DPs as content sources, peer downloads allowed within the subnet, and the other hubs as neighbors with a fallback time. A client keeps trying sources in its current group until the fallback time, then widens its search to neighbors.[^dpi-bg-dp] The office DP stays in the group until Step 6 drains it.

### Step 4.1: plan one wave (dry run) {#step-4-1}

```powershell
.\Set-DpcBoundaryGroups.ps1 -SizingPath .\out\sizing -HubDesignCsv .\config\hub-design.csv -Wave '<Wave>' -SiteCode '<SiteCode>' -FallbackDPMinutes 120 -OutputPath .\out\bg-plan
```

The plan uses `Set-CMBoundaryGroup -AddSiteSystemServerName` for the hub DPs, `Set-CMBoundaryGroup -AllowPeerDownload $true -SubnetPeerDownloadOnly $true -PreferDPOverPeer $false` for the peer options, and `New-CMBoundaryGroupRelationship -FallbackDPMinutes` for each other hub.[^dpi-bg-set] **Expected output** (Lab 1, pilot wave):

```text
DryRun: 8 changes for wave Pilot (2 offices: OFF08, OFF02)
  Set-CMBoundaryGroup -AddSiteSystemServerName 'central-dp01.lab.example','central-dp02.lab.example' -Name 'BG-OFF08'
  Set-CMBoundaryGroup -AllowPeerDownload $true -Name 'BG-OFF08' -PreferDPOverPeer $false -SubnetPeerDownloadOnly $true
  New-CMBoundaryGroupRelationship -DestinationGroupName 'BG-HUB-EAST' -FallbackDPMinutes 120 -SourceGroupName 'BG-OFF08'
```

### Step 4.2: apply it {#step-4-2}

```powershell
.\Set-DpcBoundaryGroups.ps1 -SizingPath .\out\sizing -HubDesignCsv .\config\hub-design.csv -Wave '<Wave>' -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -FallbackDPMinutes 120 -Apply -OutputPath .\out\bg-apply
```

**Rollback:** the `Rollback` column of `out\bg-apply\plan.csv`: `Set-CMBoundaryGroup -RemoveSiteSystemServerName` takes the hub DPs out again; remove a relationship on the boundary group's **Relationships** tab.[^dpi-bg-procedures]

### Step 4.3: keep clients off the default site boundary group {#step-4-3}

In the console: **Administration** > **Hierarchy Configuration** > **Boundary Groups**, open each office group, **Relationships** tab, select the default site boundary group, and choose **Never fallback** for distribution points.[^dpi-bg-procedures] An office that falls back to the default site group can reach any DP in the site.

### Step 4.4: validate {#step-4-4}

```powershell
Set-Location '<SiteCode>:'
Get-CMBoundaryGroupSiteSystem -GroupName '<BoundaryGroup>' | Select-Object ServerNalPath
Get-CMBoundaryGroupRelationship -SourceGroupName '<BoundaryGroup>'
Set-Location '<KitFolder>'
```

**Expected:** the office DP and the two hub DPs; one relationship per other hub.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-6, configuration settings; CM-3 | KSI-CMT-LMC, KSI-MLA-EVC; KSI-CMT-RVP | `out\bg-apply\plan.csv`; the change record |

: Step 4 requirements and evidence {.striped}

## Step 5: peer cache, BranchCache and Delivery Optimization {#step-5}

Peer cache sources serve clients in their own current boundary group only, and can divide content into parts so each part crosses the WAN once.[^dpi-peercache] Peer cache uses TCP 8003 and, for the Windows PE broadcast, UDP 8004; Delivery Optimization peers on TCP 7680 ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#keeping-content-local-without-a-server)). The CISO decides first whether branch segments allow that traffic; peering is an optimization, so a no only means clients pull from the hub.

### Step 5.1: choose peer cache sources and collections {#step-5-1}

Choose two or more always-on desktop clients per office, with disk space and a wired connection, as Learn advises.[^dpi-peercache] Put them in `<PeerSourceCollection>`, and the wave's office clients in `<OfficeClientCollection>`, in the console. Turn on partial download: **Administration** > **Site Configuration** > **Sites** > **Hierarchy Settings** > **General** > **Configure client peer cache sources to divide content into parts**.[^dpi-peercache]

### Step 5.2: plan and apply the client settings {#step-5-2}

```powershell
.\Set-DpcPeerCache.ps1 -SiteCode '<SiteCode>' -PeerSourceCollection '<PeerSourceCollection>' -OfficeClientCollection '<OfficeClientCollection>' -PeerSourceCacheMB 51200 -OutputPath .\out\peer-plan
.\Set-DpcPeerCache.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -PeerSourceCollection '<PeerSourceCollection>' -OfficeClientCollection '<OfficeClientCollection>' -PeerSourceCacheMB 51200 -Apply -OutputPath .\out\peer-apply
```

The first command is the dry run; the second applies. The plan creates two custom device client settings with `New-CMClientSetting -Type Device`; sets peer cache on the sources with `Set-CMClientSettingClientCache -EnableSuperPeer $true -BroadcastPort 8004 -DownloadPort 8003 -ConfigureCacheSize $true -MaxCacheSize`; turns on BranchCache and Delivery Optimization for office clients with `Set-CMClientSettingClientCache -ConfigureBranchCache $true -EnableBranchCache $true` and `Set-CMClientSettingDeliveryOptimization -Enable $true`; and deploys each with `New-CMClientSettingDeployment -CollectionName`.[^dpi-client-settings]

**Expected:** `Apply: 7 changes (applied=7)`. **Rollback:** the plan's `Rollback` column: `-EnableSuperPeer $false`, `-EnableBranchCache $false`, `-Enable $false`, then delete the deployments and settings in **Administration** > **Client Settings**.

### Step 5.3: Delivery Optimization for Intune-managed content {#step-5-3}

While branch traffic still leaves the network at a hub, set Delivery Optimization to Group mode with a group per office, or restrict peers to the subnet; its default LAN mode treats every office behind one public address as one group ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#keeping-content-local-without-a-server)). In the Intune admin center, create a settings catalog profile for the wave's devices with **Delivery Optimization** > **DO Download Mode** set to **Group (2)** and **DO Group Id Source** set to the source your office design uses. These are the `DODownloadMode`, `DOGroupId` and `DOGroupIdSource` policies.[^dpi-do-csp] For co-managed clients, Learn recommends boundary groups to define peer groups.[^dpi-do-config]

### Step 5.4: watch where clients get content {#step-5-4}

Turn on the **Client Peer Cache** optional feature if it isn't on, then open **Monitoring** > **Distribution Status** > **Client Data Sources**, choose the office's boundary group and a report period.[^dpi-monitor] Data starts after clients download content and report, which can take up to 24 hours.

**Expected:** for each pilot office, a rising share of content from peer cache, BranchCache and Delivery Optimization, and from the hub DPs, and a falling share from the office DP.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-6; CM-7, least functionality (peer ports open only where the CISO decided) | KSI-CMT-LMC, KSI-MLA-EVC; KSI-CMT-RMV | `out\peer-apply\plan.csv`; the Intune profile export; the CISO's port decision and the firewall rules |
| CA-7, continuous monitoring | KSI-MLA-EVC | Client Data Sources dashboard exports for each pilot office |

: Step 5 requirements and evidence {.striped}

## Step 6: the pilot wave, then office waves {#step-6}

Each office DP goes through the same five moves: check, drain, watch, remove, decommission. The pilot wave is the first two offices in `waves.csv`; later waves start only after the [go/no-go](#go-no-go) for the pilot.

### Step 6.1: check {#step-6-1}

Rerun the inventory after Steps 4 and 5, then check the DP:

```powershell
.\Invoke-DpcInventory.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -OfficesCsv .\config\offices.csv -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv -PackageSourceRoot '<PackageSourceShare>' -OutputPath .\out\inventory-wave
.\Invoke-DpcOfficeRetirement.ps1 -InventoryPath .\out\inventory-wave -Server '<DpFqdn>' -Step Check -OutputPath .\out\retire-check
```

It passes when every boundary group the DP serves has another content source, PXE is off, no Connected Cache runs on it and no distribution is in progress. It also lists any other site system role on the server. **Expected output** for an office that is ready (Lab 1, `off08`):

```text
  [pass] Boundary group BG-OFF08 has another content source: central-dp01.lab.example, central-dp02.lab.example
  [pass] PXE off: IsPXE=False
  [pass] No Connected Cache on this DP: ConnectedCache=False
  [pass] No content distribution in progress: InProgress=0
  [pass] Other site system roles on the server: none
```

A PXE DP fails until Step 8 moves imaging to Autopilot or moves PXE to a hub. **Rollback:** none; read-only.

### Step 6.2: drain {#step-6-2}

Take the DP out of its boundary groups, so the management point stops offering it to clients:

```powershell
.\Invoke-DpcOfficeRetirement.ps1 -InventoryPath .\out\inventory-wave -Server '<DpFqdn>' -Step Drain -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -Apply -OutputPath .\out\retire-drain
```

The command is `Set-CMDistributionPoint -SiteSystemServerName -RemoveBoundaryGroupName`.[^dpi-set-dp] **Expected:** `Drain <DpFqdn>: GO` and one `applied` row. **Rollback:** `Set-CMDistributionPoint -SiteSystemServerName '<DpFqdn>' -SiteCode '<SiteCode>' -AddBoundaryGroupName '<BoundaryGroup>'`, as `plan.csv` records.

Learn's maintenance mode (`Set-CMDistributionPoint -EnableMaintenanceMode $true`) also stops clients being sent to a DP, but Learn says it shouldn't be a long-term state and the role shouldn't be removed while it's on.[^dpi-install-dp] For a 30-day watch, draining is the better tool *(design guidance)*.

### Step 6.3: watch for 30 days {#step-6-3}

Watch the office's boundary group in the Client Data Sources dashboard (Step 5.4). The DP is ready to remove after 30 days in which it served no content and no deployment failed for content location *(design guidance)*. **Rollback:** the drain's rollback above.

### Step 6.4: remove the role {#step-6-4}

```powershell
.\Invoke-DpcInventory.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -OfficesCsv .\config\offices.csv -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv -PackageSourceRoot '<PackageSourceShare>' -OutputPath .\out\inventory-day30
.\Invoke-DpcOfficeRetirement.ps1 -InventoryPath .\out\inventory-day30 -Server '<DpFqdn>' -Step Remove -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -Apply -OutputPath .\out\retire-remove
```

The script refuses unless the DP is in no boundary group. It removes the role with `Remove-CMDistributionPoint -Force`, then the site system server with `Remove-CMSiteSystemServer -Force` when the server holds no other role; Learn says that cmdlet fails while another role remains.[^dpi-remove-dp] Removing the role removes the DP's content shares and IIS configuration, and can take a long time with a large library.[^dpi-dp-removal]

**Expected:** `Remove <DpFqdn>: GO` and one or two `applied` rows. **Rollback:** add the role back with `Add-CMDistributionPoint` and redistribute its content (Step 3); the hardware still exists until Step 6.5.

### Step 6.5: decommission the server {#step-6-5}

Remove the server from the domain and the asset record, sanitize its disks under the agency's media sanitization procedure (MP-6), and close its inventory and SSP entries. Then rerun the inventory; the DP is gone and its office's clients are served by the hub and peers.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-3 for each drain and removal | KSI-CMT-LMC, KSI-CMT-RVP | `retire-check`, `retire-drain` and `retire-remove` runs per DP; the change records |
| CM-8, the inventory updated | KSI-PIY-GIV | The inventory run after removal; closed SSP entries |
| MP-6, media sanitization (no KSI cites it) | — | The sanitization record per server |
| SA-22 | KSI-SCR-MIT | Unsupported DPs retired first, shown by the wave order |

: Step 6 requirements and evidence {.striped}

## Step 7: packaging on PSAppDeployToolkit {#step-7}

The app content gate closes only when the catalog moves, and the catalog moves faster when every package behaves the same in both tools ([decision guide](dp-consolidation.md#packaging)). PSAppDeployToolkit is open source and not a Microsoft product; its commands below come from its project, not from Learn.[^dpi-psadt]

### Step 7.1: see what needs doing {#step-7-1}

```powershell
.\Test-DpcPackaging.ps1 -InventoryPath .\out\inventory -MinimumVersion '<PsadtVersion>' -OutputPath .\out\packaging
```

**Expected output** (Lab 1, with `4.1.0`):

```text
Applications: 10; to retire: 1; on the standard (PSAppDeployToolkit 4.1.0 or later): 3 of 9 kept
Actions: keep=3, migrate-v3=2, retire=1, wrap=4
Repackage in this order (most installed first):
  PDF Reader 24                9100 installs  migrate-v3
  Case Notes Client 11         8800 installs  wrap
```

Retire what nobody installs first; repackage the rest by install count. **Rollback:** none; read-only.

### Step 7.2: make a package from the template {#step-7-2}

On the packaging workstation:

```powershell
Install-Module -Name PSAppDeployToolkit -RequiredVersion '<PsadtVersion>' -Scope CurrentUser
Import-Module PSAppDeployToolkit
New-ADTTemplate -Destination '<PackageWorkFolder>' -Name '<AppFolder>'
Copy-Item -LiteralPath '<InstallerPath>' -Destination '<PackageWorkFolder>\<AppFolder>\Files\'
notepad '<PackageWorkFolder>\<AppFolder>\Invoke-AppDeployToolkit.ps1'
```

`New-ADTTemplate` creates a version 4 package folder with `Invoke-AppDeployToolkit.ps1`, its launcher and the `Files` folder.[^dpi-psadt] In the editor, fill in the `$adtSession` table (vendor, name, version) and the Install, Uninstall and Repair sections with the installer's silent command line. **Rollback:** delete the folder.

### Step 7.3: sign the script {#step-7-3}

```powershell
$cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert | Where-Object Thumbprint -EQ '<CodeSigningThumbprint>'
Set-AuthenticodeSignature -FilePath '<PackageWorkFolder>\<AppFolder>\Invoke-AppDeployToolkit.ps1' -Certificate $cert
```

**Expected:** `Status` `Valid`.[^dpi-sign] **Rollback:** restore the unsigned script from source control.

### Step 7.4: test it silently {#step-7-4}

On a test device, in an elevated session:

```powershell
& '<PackageWorkFolder>\<AppFolder>\Invoke-AppDeployToolkit.exe' -DeploymentType Install -DeployMode Silent
$LASTEXITCODE
& '<PackageWorkFolder>\<AppFolder>\Invoke-AppDeployToolkit.exe' -DeploymentType Uninstall -DeployMode Silent
$LASTEXITCODE
```

**Expected:** `0` (or `3010`, restart required) after each.[^dpi-psadt] Intune requires a Win32 app to install silently.[^dpi-win32-prep]

### Step 7.5: the same package in both tools {#step-7-5}

For Intune, wrap the folder with the Microsoft Win32 Content Prep Tool:[^dpi-win32-prep]

```powershell
IntuneWinAppUtil.exe -c '<PackageWorkFolder>\<AppFolder>' -s '<PackageWorkFolder>\<AppFolder>\Invoke-AppDeployToolkit.exe' -o '<IntuneWinOut>' -q
```

Add the `.intunewin` as a Win32 app with install command `Invoke-AppDeployToolkit.exe -DeploymentType Install -DeployMode Silent` and uninstall command `Invoke-AppDeployToolkit.exe -DeploymentType Uninstall -DeployMode Silent`, and a detection rule.[^dpi-win32] For Configuration Manager, copy the same folder to `<PackageSourceShare>\<AppFolder>` and give the application a script installer deployment type with the same two command lines and the same detection rule. Then rerun Step 7.1; the app shows `keep`.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-2, the template as a baseline; CM-3(2), changes tested and documented | KSI-CMT-RMV; KSI-CMT-LMC, KSI-CMT-VTD | The template in version control; per package, the signing record and the silent install and uninstall test |
| CM-8 | KSI-PIY-GIV | `packaging` runs showing each app's action and owner |

: Step 7 requirements and evidence {.striped}

## Step 8: co-management workload shifts {#step-8}

Four content paths have to leave Configuration Manager before the hub tier can retire: apps, updates, OS provisioning, and the evidence. The Endpoint & Device plan moves the compliance, Endpoint Protection, device configuration and Windows Update workloads ([plan](../../project-plans/endpoint-device.md)); this step moves the app workloads and closes the content side of each.

### Step 8.1: move the app workloads {#step-8-1}

In the console: **Administration** > **Cloud Services** > **Cloud Attach**, co-management **Properties**, **Workloads** tab. Move **Client apps** and **Office Click-to-Run apps** to **Pilot Intune**, with the pilot collection on the **Staging** tab, then to **Intune**.[^dpi-switch] Make sure each app is in Intune first. Record the new state in `config\workloads.csv`. **Rollback:** move the slider back; Learn notes there might be an impact, for example Office stays at a later version if Intune installed it.[^dpi-comanage]

### Step 8.2: withdraw each Configuration Manager deployment as its app moves {#step-8-2}

Apps deployed from Configuration Manager stay in Software Center after the slider moves, and still download from a DP.[^dpi-comanage] For each app now in Intune:

```powershell
Set-Location '<SiteCode>:'
Get-CMApplicationDeployment -Name '<AppName>' | Select-Object * | Export-Csv '<KitFolder>\out\deployments-<AppFolder>.csv' -NoTypeInformation
Get-CMApplicationDeployment -Name '<AppName>' -CollectionName '<CollectionName>' | Remove-CMApplicationDeployment -Force
Get-CMDeployment -SoftwareName '<AppName>' -FeatureType Application
Set-Location '<KitFolder>'
```

The export keeps the deployment settings for the rollback. **Expected:** the last command returns nothing.[^dpi-appdeploy] **Rollback:** recreate the deployment in the console from the exported settings.

### Step 8.3: turn off Configuration Manager software updates on clients {#step-8-3}

After the Windows Update workload is on Intune, the Configuration Manager client's update workflow has to be turned off by hand ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#when-to-retire-the-last-distribution-point)):

```powershell
Set-Location '<SiteCode>:'
Set-CMClientSettingSoftwareUpdate -Name '<ClientSettingName>' -Enable $false
Set-Location '<KitFolder>'
```

**Expected:** no output; the setting shows **Enable software updates on clients: No**.[^dpi-swupdate] Record `SoftwareUpdatesClientSetting,Disabled` in `config\workloads.csv`. **Rollback:** the same command with `-Enable $true`.

### Step 8.4: move OS provisioning and turn off PXE {#step-8-4}

Move bare-metal provisioning to Windows Autopilot ([Book 05, Chapter 04](../b05-devices/04-intune-first-onboarding.md#windows-autopilot-or-autopilot-device-preparation)), remove the task sequence deployments in the console, then turn PXE off on every DP:

```powershell
Set-Location '<SiteCode>:'
Set-CMDistributionPoint -SiteSystemServerName '<DpFqdn>' -EnablePxe $false
Get-CMDistributionPointInfo | Where-Object IsPXE | Select-Object ServerName
Set-Location '<KitFolder>'
```

**Expected:** the last command returns nothing.[^dpi-set-dp] **Rollback:** `-EnablePxe $true` on the same DP.

### Step 8.5: move the compliance evidence {#step-8-5}

With the ISSO, change each control whose evidence still comes from the Configuration Manager site database to its Intune or Defender source, and record it in `config\evidence-sources.csv`.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-6; SI-2, updates installed in a defined period; CA-7 | KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC | Workload states; the deployment exports and removals; the client setting; Intune update compliance |
| CM-7, least functionality (PXE off) | KSI-CMT-RMV | The DP list with no PXE |

: Step 8 requirements and evidence {.striped}

## Step 9: Connected Cache at the hubs {#step-9}

Connected Cache for Enterprise and Education is a stand-alone cache managed from Azure. Its host needs Windows 11 or Windows Server 2022 or later, nothing else on port 80, at least 4 GB of free memory and 100 GB of free disk, and its deployment scripts need Windows PowerShell 5.1.[^dpi-mcc-prereq] It can't share a server with a running DP, so each hub gets its own cache host. Place its Azure resource in the boundary analysis before production ([decision guide](dp-consolidation.md#gcc-availability)).

### Step 9.1: deploy a cache host at each hub {#step-9-1}

Create the cache node in the Azure portal. Then, on the hub's cache host, in an elevated Windows PowerShell 5.1 window, run the commands Learn's deployment page shows. The administrator running them can't be the runtime account, and the runtime account needs the local **Log on as a batch job** right. The four GUIDs come from the node's pages in the Azure portal, or from `az mcc ent node get-deployment-details`.[^dpi-mcc-deploy]

```powershell
Add-AppxPackage "https://aka.ms/do-mcc-ent-windows-x64"
Get-AppxPackage Microsoft.DeliveryOptimization
$User = '<RunTimeAccount>'
$myLocalAccountCredential = Get-Credential
Push-Location (deliveryoptimization-cli mcc-get-scripts-path); ./deploymcconwsl.ps1 -installationFolder c:\mccwsl01 -customerid <CustomerId> -cachenodeid <CacheNodeId> -customerkey <CustomerKey> -registrationkey <RegistrationKey> -cacheDrives "/var/mcc,<CacheSizeGB>" -mccRunTimeAccount $User -mccLocalAccountCredential $myLocalAccountCredential
Pop-Location
```

`<RunTimeAccount>` is `Domain\Username` for a domain or service account; for a group managed service account it is `Domain\Username$`, and you leave out `Get-Credential` and `-mccLocalAccountCredential`. `<CustomerId>`, `<CacheNodeId>`, `<CustomerKey>`, `<RegistrationKey>` and `<CacheSizeGB>` are the values in Learn's parameter table. Learn's page also has you set the host's execution policy so the deployment scripts can run; do that under the agency's script policy. **Expected:** the script reports a successful deployment and the node shows as healthy in the portal. **Rollback:** the uninstall script for a Windows host, `uninstallmcconwsl.ps1`, named on Learn's troubleshooting page.

### Step 9.2: point office clients at their hub's cache {#step-9-2}

In the Intune settings catalog profile from Step 5.3, set **DO Cache Host** to the hub cache host for that office's devices (the `DOCacheHost` policy).[^dpi-do-csp] **Rollback:** clear the setting; clients go back to the content delivery network and peers.

### Step 9.3: take any cache off DP hardware {#step-9-3}

If the inventory showed Connected Cache on a DP (finding DPC-INV-08), turn it off once the hub cache serves that office:

```powershell
Set-Location '<SiteCode>:'
Set-CMDistributionPoint -SiteSystemServerName '<DpFqdn>' -EnableDoinc $false
Set-Location '<KitFolder>'
```

**Expected:** no output.[^dpi-set-dp] Record `ConnectedCacheOnDP,No` in `config\workloads.csv`. **Rollback:** `-EnableDoinc $true`.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-8, the cache hosts inventoried; CM-6 | KSI-PIY-GIV; KSI-CMT-LMC | Cache host inventory and baseline; the boundary analysis entry for the Azure resource |

: Step 9 requirements and evidence {.striped}

## Step 10: the five retirement gates and the last distribution point {#step-10}

### Step 10.1: judge the gates {#step-10-1}

```powershell
.\Invoke-DpcInventory.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -OfficesCsv .\config\offices.csv -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv -PackageSourceRoot '<PackageSourceShare>' -OutputPath .\out\inventory-final
.\Test-DpcRetirementGates.ps1 -InventoryPath .\out\inventory-final -OutputPath .\out\gates-final
```

**Expected output** while gates are open (Lab 1):

```text
  1. App content           OPEN    ClientApps=PilotIntune; OfficeClickToRun=ConfigurationManager; application deployments=15; package deployments=2
  2. Update content        OPEN    WindowsUpdatePolicies=PilotIntune; DeviceConfiguration=ConfigurationManager; SoftwareUpdatesClientSetting=Enabled
  3. OS provisioning       OPEN    task sequence deployments=1; PXE DPs=2 off02-dp.lab.example, off07-dp.lab.example
  4. Caching role          OPEN    Connected Cache on DPs=1 off05-dp.lab.example; recorded=Yes
  5. Compliance evidence   OPEN    controls still evidenced from the site database: CM-6, SI-3
0 of 5 gates closed. Keep the hub tier.
```

The exit code is 0 only when all five are closed. Any open gate keeps the tier, in whatever month that is ([decision guide](dp-consolidation.md#retirement-gates)).

### Step 10.2: retire the hub and source DPs {#step-10-2}

With all five closed, drain and remove each remaining DP. `-GatesPath` lets the check pass for a DP that is the last content source in its groups:

```powershell
.\Invoke-DpcOfficeRetirement.ps1 -InventoryPath .\out\inventory-final -Server '<DpFqdn>' -Step Drain -GatesPath .\out\gates-final -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -Apply -OutputPath .\out\final-drain
.\Invoke-DpcInventory.ps1 -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -OfficesCsv .\config\offices.csv -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv -PackageSourceRoot '<PackageSourceShare>' -OutputPath .\out\inventory-drained
.\Invoke-DpcOfficeRetirement.ps1 -InventoryPath .\out\inventory-drained -Server '<DpFqdn>' -Step Remove -SiteCode '<SiteCode>' -ProviderMachineName '<ProviderFqdn>' -Apply -OutputPath .\out\final-remove
```

Repeat for each DP, then decommission each server as in Step 6.5. **Rollback:** as in Steps 6.2 and 6.4.

### Step 10.3: clean up what the DPs left {#step-10-3}

```powershell
Set-Location '<SiteCode>:'
Remove-CMDistributionPointGroup -Name 'DPG-<Hub>' -Force
Set-CMBoundaryGroup -Name '<BoundaryGroup>' -ClearSiteSystemServer
Set-CMClientSettingClientCache -Name 'DPC Peer Cache Sources' -EnableSuperPeer $false
Get-CMSiteRole -AllSite | Where-Object RoleName -EQ 'SMS Distribution Point'
Set-Location '<KitFolder>'
```

Run the first line for each hub and the second for each boundary group whose only site systems were DPs.[^dpi-dpg][^dpi-bg-set] Then delete the two kit client settings and their deployments in **Administration** > **Client Settings**. **Expected:** the last command returns nothing: no distribution point role left in the hierarchy. **Rollback:** none at this point; the gates were the rollback window.

What remains of Configuration Manager (management points, the site server, the database) is the Endpoint & Device program's to retire or keep; this guide stops at content.

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-8; CA-7 | KSI-PIY-GIV; KSI-MLA-EVC | `gates-final` with all five closed; the final inventory with no DP role |
| CM-3; MP-6; SA-22 | KSI-CMT-LMC; —; KSI-SCR-MIT | Decommission and sanitization records per server; the SSP change |

: Step 10 requirements and evidence {.striped}

## Lab 1: the fictional estate, no hierarchy {#lab-1}

Runs the kit's read-only and dry-run paths on the fixtures in `tests/fixtures`. Works in PowerShell 7.2 or later, or Windows PowerShell 5.1, on any machine; nothing connects to anything. Work in `examples/dp-consolidation/` (or the unzipped kit folder).

1. Inventory the starting estate and read the findings.

    ```powershell
    ./Invoke-DpcInventory.ps1 -FixturePath tests/fixtures/estate -PackageSourceRoot tests/fixtures/packages -OutputPath out/inventory -AsOf 2026-11-08
    Import-Csv out/inventory/findings.csv | Format-Table Id, Severity, Target -AutoSize
    ```

    ```text
    Distribution points: 14 (12 in offices); clients: 9835; boundary groups: 13
    Applications: 10 (5 on PSAppDeployToolkit); packages: 4; task sequence deployments: 1
    Findings: 4 Finding, 3 Warn, 3 Info

    Id         Severity Target
    --         -------- ------
    DPC-INV-07 Info     off02-dp.lab.example
    DPC-INV-04 Finding  off03-dp.lab.example
    DPC-INV-02 Warn     off04-dp.lab.example
    DPC-INV-04 Finding  off04-dp.lab.example
    DPC-INV-08 Info     off05-dp.lab.example
    DPC-INV-07 Info     off07-dp.lab.example
    DPC-INV-06 Warn     off08-dp.lab.example
    DPC-INV-01 Finding  off09-dp.lab.example
    DPC-INV-04 Finding  off09-dp.lab.example
    DPC-INV-10 Warn     10.99.0.0 (Unassigned)
    ```

2. Size the hub tier and order the waves.

    ```powershell
    ./Get-DpcSizing.ps1 -InventoryPath out/inventory -HubDesignCsv config/hub-design.example.csv -OutputPath out/sizing
    ```

    The output is the one in [Step 1.2](#step-1-2): 8 DPs in the planned tier against 14 today, and 12 office DPs to retire.

3. Plan the hub tier and the pilot wave's boundary groups (dry runs).

    ```powershell
    ./New-DpcHubTier.ps1 -InventoryPath out/inventory -HubDesignCsv config/hub-design.example.csv -SiteCode LAB -CertificateExpirationTimeUtc 2028-11-08 -OutputPath out/hub-plan
    ./Set-DpcBoundaryGroups.ps1 -SizingPath out/sizing -HubDesignCsv config/hub-design.example.csv -Wave Pilot -SiteCode LAB -OutputPath out/bg-pilot
    ```

    ```text
    DryRun: 27 changes for 3 hubs (dry-run=27)
    DryRun: 8 changes for wave Pilot (2 offices: OFF08, OFF02)
    ```

    Open `out/hub-plan/plan.csv`: every row has a command and a rollback, and every status is `dry-run`.

4. Take the estate after the hub build and the pilot's boundary changes, and try to drain both pilot DPs.

    ```powershell
    ./Invoke-DpcInventory.ps1 -FixturePath tests/fixtures/estate-pilot-ready -PackageSourceRoot tests/fixtures/packages -OutputPath out/inventory-pilot -AsOf 2026-11-08
    ./Invoke-DpcOfficeRetirement.ps1 -InventoryPath out/inventory-pilot -Server off08-dp.lab.example -Step Drain -OutputPath out/retire-off08-drain
    ./Invoke-DpcOfficeRetirement.ps1 -InventoryPath out/inventory-pilot -Server off02-dp.lab.example -Step Check -OutputPath out/retire-off02-check
    ```

    ```text
    Drain off08-dp.lab.example: GO
      dry-run: Set-CMDistributionPoint -RemoveBoundaryGroupName 'BG-OFF08' -SiteCode 'LAB' -SiteSystemServerName 'off08-dp.lab.example'
      [FAIL] PXE off: IsPXE=True
    Check off02-dp.lab.example: NO-GO
    ```

    `off02` serves PXE, so it waits for Step 8.4. That's the lesson of the pilot: one office in two has a reason to keep its DP that a slider doesn't show.

5. Check packaging and the gates.

    ```powershell
    ./Test-DpcPackaging.ps1 -InventoryPath out/inventory -OutputPath out/packaging
    ./Test-DpcRetirementGates.ps1 -InventoryPath out/inventory -OutputPath out/gates
    ```

    ```text
    Applications: 10; to retire: 1; on the standard (PSAppDeployToolkit 4.1.0 or later): 3 of 9 kept
    Actions: keep=3, migrate-v3=2, retire=1, wrap=4
    0 of 5 gates closed. Keep the hub tier.
    ```

6. Prove the evidence hasn't changed since it was written, and run the tests.

    ```powershell
    Import-Module ./powershell/DpConsolidation/DpConsolidation.psm1
    Test-DpcManifest -Path out/inventory/manifest.json
    Invoke-Pester -Path tests
    ```

    ```text
    True
    Tests Passed: 24, Failed: 0, Skipped: 0
    ```

The outputs above are what the kit printed on November 8, 2026, trimmed to the lines each step discusses.

## Lab 2: a test hierarchy (outline) {#lab-2}

Lab 2 is Stage 1 in miniature. It needs a test hierarchy you can rebuild: one primary site, two "data center" DPs, two "office" DPs on their own subnets with a few clients each, and two servers to become hub DPs. Every change has its rollback, and the last part backs everything out.

1. **Read.** [Step 0.3](#step-0-3) against the test site; then [Step 1.2](#step-1-2) with a one-hub design.
2. **Build one hub.** [Step 3.1](#step-3-1) dry run, read `plan.csv`, then [Step 3.2](#step-3-2) with `-Apply`; validate with [Step 3.3](#step-3-3).
3. **Point one office at it.** [Steps 4.1 and 4.2](#step-4-1) for that office; [Step 5.2](#step-5-2) for its clients; deploy an application and watch [Client Data Sources](#step-5-4).
4. **Drain and remove its DP.** [Steps 6.1, 6.2 and 6.4](#step-6-1), with a short watch instead of 30 days.
5. **Back it all out.** Run the `Rollback` column of each `plan.csv`, newest first: add the office DP back, remove the hub's boundary group entries and relationships, remove the hub DPs and group, and delete the client settings. Rerun Step 0.3 and compare it with the first inventory: they should match except for the run times.

## Stage 1, Stage 2 and go/no-go {#go-no-go}

| From | To | Go when |
|---|---|---|
| Lab 1 | Stage 1 (test hierarchy) | The tests pass; the team has read every `plan.csv` the dry runs wrote |
| Stage 1 | Stage 2 (production, pilot wave) | Lab 2 done end to end, including the full back-out; every cmdlet ran without a parameter error on the agency's Configuration Manager version; the inventory's numbers match the console; the change board approved the production plan |
| Pilot wave | Wave 2 | Both pilot offices drained for 30 days with no content from their DP and no failure traced to content location; any NO-GO (like PXE) has an owner and a date; the Client Data Sources export filed |
| Each wave | The next | The same, for every office in the wave; hub load per DP under 80% of the limit in the latest inventory |
| Last wave | Step 10 | All five gates closed in a `Test-DpcRetirementGates.ps1` run |

: Go/no-go criteria {.striped .hover}

## Government cloud availability {#gcc}

Configuration Manager, its PowerShell module and the kit run on premises; nothing here depends on the cloud until Steps 5.3, 7.5, 8 and 9. For those, the [decision guide's availability table](dp-consolidation.md#gcc-availability) applies: GCC tenants use the commercial Intune service, and Connected Cache for Enterprise and Education is listed as unavailable only in GCC High and DoD. In GCC High and DoD, the interim path for Step 9 is the Configuration Manager–integrated cache on a hub DP with no other roles, which keeps retirement gate 4 open until it goes.

## What couldn't be verified {#not-verified}

- **Nothing here ran against a live hierarchy.** Cmdlet names and parameters are from their Learn pages; behavior is from Learn's descriptions and the kit's fixture tests.
- **No Get cmdlet for co-management workloads.** Learn has `New-CMCoManagementPolicy` but no Get or Set cmdlet, so the workload states come from the console into `workloads.csv`.
- **Some property names.** `NumberOfDevicesWithApp` on an application and the `SoftwareName` and `CollectionName` properties of a deployment summary are used as the console shows them; confirm them in your release.
- **PSAppDeployToolkit** isn't documented on Learn. `New-ADTTemplate`, `Invoke-AppDeployToolkit.exe -DeploymentType -DeployMode` and the module name come from the project's documentation and repository.
- **The 30-day watch and the 120-minute fallback** are the program's choices, not Microsoft's.

::: {.callout-tip}
## Back to the books
- [Distribution Point Consolidation: A Decision Guide Before You Fund a Refresh](dp-consolidation.md): whether to do this, and the worksheet.
- [Book 09, Chapter 11 — Field Office WAN Transformation](../b09-network/11-field-office-wan-transformation.md): the worked case.
- [Book 05 — Devices](../b05-devices/index.md): Intune-first onboarding and the GPO-to-Intune migration.
- The [Content Delivery Modernization plan](../../project-plans/content-delivery.md), which schedules these steps, and the [Endpoint & Device Modernization plan](../../project-plans/endpoint-device.md).
:::

[^dpi-cm-ps]: Microsoft Learn, "Get started with Configuration Manager cmdlets" (`Import-Module ConfigurationManager` from version 2111; `New-PSDrive -PSProvider CMSite`; `Set-Location` to the site drive; `Get-CMSite`; a few cmdlets don't run on PowerShell 7), <https://learn.microsoft.com/powershell/sccm/overview> (read November 8, 2026).
[^dpi-switch]: Microsoft Learn, "How to switch Configuration Manager workloads to Intune" (Cloud Attach node; Workloads tab; Configuration Manager, Pilot Intune and Intune; Staging tab), <https://learn.microsoft.com/intune/configmgr/comanage/how-to-switch-workloads> (read November 8, 2026).
[^dpi-comanage]: Microsoft Learn, "Co-management workloads" (switching back can have an impact; apps deployed from Configuration Manager stay available in Software Center), <https://learn.microsoft.com/intune/configmgr/comanage/workloads> (read November 8, 2026).
[^dpi-contentlib]: Microsoft Learn, "The content library in Configuration Manager," <https://learn.microsoft.com/intune/configmgr/core/plan-design/hierarchy/the-content-library> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpi-dpinfo]: Microsoft Learn, "Get-CMDistributionPointInfo," <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmdistributionpointinfo>, and "SMS_DistributionPointInfo server WMI class" (`ServerName`, `SiteCode`, `IsPullDP`, `IsPXE`, `OperatingSystem`), <https://learn.microsoft.com/intune/configmgr/develop/reference/core/servers/configure/sms_distributionpointinfo-server-wmi-class> (both read November 8, 2026).
[^dpi-bg-read]: Microsoft Learn, "Get-CMBoundaryGroup," "Get-CMBoundary" (`-BoundaryGroupName`) and "Get-CMBoundaryGroupSiteSystem" (`-GroupName`), <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmboundarygroup>, <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmboundary>, <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmboundarygroupsitesystem>; and "SMS_Boundary server WMI class" (`BoundaryType` 0 IP subnet, 1 AD site, 2 IPv6 prefix, 3 IP range; `Value`), <https://learn.microsoft.com/intune/configmgr/develop/reference/core/servers/configure/sms_boundary-server-wmi-class> (all read November 8, 2026).
[^dpi-dpstatus]: Microsoft Learn, "SMS_DPStatusInfo server WMI class" (`NALPath`, `NumberInstalled`, `NumberErrors`, `NumberInProgress`), <https://learn.microsoft.com/intune/configmgr/develop/reference/core/servers/configure/sms_dpstatusinfo-server-wmi-class> (read November 8, 2026).
[^dpi-siterole]: Microsoft Learn, "Get-CMSiteRole" (`-AllSite`, `-RoleName`), <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmsiterole> (read November 8, 2026).
[^dpi-rsystem]: Microsoft Learn, "SMS_R_System server WMI class" (`Active`, `ADSiteName`, `Client`, `IPSubnets`), <https://learn.microsoft.com/intune/configmgr/develop/reference/core/clients/manage/sms_r_system-server-wmi-class> (read November 8, 2026).
[^dpi-apps]: Microsoft Learn, "Get-CMApplication" (`-Fast`), "Get-CMPackage," "Get-CMDeployment" (`-FeatureType`, `-SoftwareName`) and "Get-CMTaskSequenceDeployment," <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmapplication>, <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmpackage>, <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmdeployment>, <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmtasksequencedeployment> (all read November 8, 2026).
[^dpi-upgrade]: Microsoft Learn, "Upgrade on-premises infrastructure that supports Configuration Manager," Upgrade the OS of site systems, <https://learn.microsoft.com/intune/configmgr/core/servers/manage/upgrade-on-premises-infrastructure> (read November 8, 2026).
[^dpi-diststatus]: Microsoft Learn, "Get-CMDistributionStatus" (Targeted, NumberSuccess, NumberErrors, NumberInProgress; pipeline input), <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmdistributionstatus> (read November 8, 2026).
[^dpi-sizescale]: Microsoft Learn, "Size and scale numbers for Configuration Manager," <https://learn.microsoft.com/intune/configmgr/core/plan-design/configs/size-and-scale-numbers> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpi-siteos]: Microsoft Learn, "Supported operating systems for Configuration Manager site system servers," <https://learn.microsoft.com/intune/configmgr/core/plan-design/configs/supported-operating-systems-for-site-system-servers> (read November 8, 2026).
[^dpi-install-dp]: Microsoft Learn, "Install and configure distribution points in Configuration Manager," including pull distribution points and maintenance mode (no content sent; management points stop offering the DP; not a long-term state; don't remove the role while it's on), <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/configure/install-and-configure-distribution-points> (read November 8, 2026).
[^dpi-sitesystem]: Microsoft Learn, "New-CMSiteSystemServer" and "Remove-CMSiteSystemServer," <https://learn.microsoft.com/powershell/module/configurationmanager/new-cmsitesystemserver>, <https://learn.microsoft.com/powershell/module/configurationmanager/remove-cmsitesystemserver> (read November 8, 2026).
[^dpi-add-dp]: Microsoft Learn, "Add-CMDistributionPoint" (`-SiteSystemServerName`, `-SiteCode`, `-CertificateExpirationTimeUtc`, `-EnablePullDP`, `-SourceDistributionPoint`, `-SourceDPRank`, `-CertificatePath`, `-WhatIf`), <https://learn.microsoft.com/powershell/module/configurationmanager/add-cmdistributionpoint> (read November 8, 2026).
[^dpi-dpg]: Microsoft Learn, "New-CMDistributionPointGroup," "Add-CMDistributionPointToGroup" and "Remove-CMDistributionPointGroup" (`-Name`, `-Force`), <https://learn.microsoft.com/powershell/module/configurationmanager/new-cmdistributionpointgroup>, <https://learn.microsoft.com/powershell/module/configurationmanager/add-cmdistributionpointtogroup>, <https://learn.microsoft.com/powershell/module/configurationmanager/remove-cmdistributionpointgroup> (read November 8, 2026).
[^dpi-content]: Microsoft Learn, "Start-CMContentDistribution" and "Remove-CMContentDistribution" (`-ApplicationName`, `-PackageId`, `-DistributionPointGroupName`), <https://learn.microsoft.com/powershell/module/configurationmanager/start-cmcontentdistribution>, <https://learn.microsoft.com/powershell/module/configurationmanager/remove-cmcontentdistribution> (read November 8, 2026).
[^dpi-remove-dp]: Microsoft Learn, "Remove-CMDistributionPoint" (`-SiteSystemServerName`, `-SiteCode`, `-Force`) and "Remove-CMSiteSystemServer" (fails while the server has other roles), <https://learn.microsoft.com/powershell/module/configurationmanager/remove-cmdistributionpoint>, <https://learn.microsoft.com/powershell/module/configurationmanager/remove-cmsitesystemserver> (read November 8, 2026).
[^dpi-validate]: Microsoft Learn, "Invoke-CMContentValidation" (`-ApplicationName`, `-DistributionPointGroupName`), <https://learn.microsoft.com/powershell/module/configurationmanager/invoke-cmcontentvalidation> (read November 8, 2026).
[^dpi-bg-dp]: Microsoft Learn, "Boundary groups and distribution points" (current boundary group first; fallback to neighbor and default site groups), <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/configure/boundary-groups-distribution-points> (read November 8, 2026).
[^dpi-bg-set]: Microsoft Learn, "Set-CMBoundaryGroup" (`-AddSiteSystemServerName`, `-RemoveSiteSystemServerName`, `-ClearSiteSystemServer`, `-AllowPeerDownload`, `-PreferDPOverPeer`, `-SubnetPeerDownloadOnly`), "New-CMBoundaryGroupRelationship" (`-SourceGroupName`, `-DestinationGroupName`, `-FallbackDPMinutes`; -1 never falls back) and "Get-CMBoundaryGroupRelationship," <https://learn.microsoft.com/powershell/module/configurationmanager/set-cmboundarygroup>, <https://learn.microsoft.com/powershell/module/configurationmanager/new-cmboundarygrouprelationship>, <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmboundarygrouprelationship> (read November 8, 2026).
[^dpi-bg-procedures]: Microsoft Learn, "How to configure boundary groups for Configuration Manager" (Relationships tab; fallback times; Never fallback; boundary group options), <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/configure/boundary-group-procedures> (read November 8, 2026).
[^dpi-peercache]: Microsoft Learn, "Peer cache for Configuration Manager clients" (current boundary group only; choose sources by chassis, disk and network; partial download in Hierarchy Settings), <https://learn.microsoft.com/intune/configmgr/core/plan-design/hierarchy/client-peer-cache> (read November 8, 2026).
[^dpi-client-settings]: Microsoft Learn, "New-CMClientSetting" (`-Type Device`), "Set-CMClientSettingClientCache" (`-EnableSuperPeer`, `-BroadcastPort`, `-DownloadPort`, `-ConfigureBranchCache`, `-EnableBranchCache`, `-ConfigureCacheSize`, `-MaxCacheSize`), "Set-CMClientSettingDeliveryOptimization" (`-Enable`) and "New-CMClientSettingDeployment" (`-CollectionName`; it replaces the deprecated Start-CMClientSettingDeployment), <https://learn.microsoft.com/powershell/module/configurationmanager/set-cmclientsettingclientcache> and sibling pages; and "About client settings in Configuration Manager," Client cache settings, <https://learn.microsoft.com/intune/configmgr/core/clients/deploy/about-client-settings#client-cache-settings> (read November 8, 2026).
[^dpi-do-csp]: Microsoft Learn, "Policy CSP - DeliveryOptimization" (`DODownloadMode` 2 = peering across a private group; `DOGroupId`; `DOGroupIdSource`; `DOCacheHost`), <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-deliveryoptimization> (read November 8, 2026).
[^dpi-do-config]: Microsoft Learn, "Configure Delivery Optimization (DO) for Windows" (for Configuration Manager, use boundary groups to define peer groups), <https://learn.microsoft.com/windows/deployment/do/delivery-optimization-configure> (read November 8, 2026).
[^dpi-monitor]: Microsoft Learn, "Monitor content you distribute with Configuration Manager," Client data sources dashboard (Client Peer Cache optional feature; up to 24 hours for data), <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/configure/monitor-content-you-have-distributed#client-data-sources-dashboard> (read November 8, 2026).
[^dpi-set-dp]: Microsoft Learn, "Set-CMDistributionPoint" (`-RemoveBoundaryGroupName`, `-AddBoundaryGroupName`, `-EnableMaintenanceMode`, `-EnablePxe`, `-EnableDoinc`, `-WhatIf`), <https://learn.microsoft.com/powershell/module/configurationmanager/set-cmdistributionpoint> (read November 8, 2026).
[^dpi-dp-removal]: Microsoft Learn, "Remove a site system role" in "Uninstall sites and hierarchies," <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/install/uninstall-sites-and-hierarchies>, and "Troubleshoot distribution point installation, upgrade and configuration," DP removal (shares, IIS and registry removed; can take a long time with a large content library), <https://learn.microsoft.com/troubleshoot/mem/configmgr/content-management/dp-installation-upgrade-configuration#dp-removal> (read November 8, 2026).
[^dpi-psadt]: PSAppDeployToolkit, `Invoke-AppDeployToolkit.ps1` version 4 front end (`-DeploymentType` Install, Uninstall or Repair; `-DeployMode` Auto, Interactive, NonInteractive or Silent; the `.exe` launcher; reboot exit codes 1641 and 3010), <https://github.com/PSAppDeployToolkit/PSAppDeployToolkit/blob/main/modules/PSAppDeployToolkit/opt/Frontend/v4/Invoke-AppDeployToolkit.ps1>, and "New-ADTTemplate" (`-Destination`, `-Name`, `-Version`), <https://psappdeploytoolkit.com/docs/reference/functions/New-ADTTemplate> (read November 8, 2026). Not a Microsoft Learn source.
[^dpi-sign]: Microsoft Learn, "Set-AuthenticodeSignature," <https://learn.microsoft.com/powershell/module/microsoft.powershell.security/set-authenticodesignature> (read November 8, 2026).
[^dpi-win32-prep]: Microsoft Learn, "Prepare Win32 app content for upload" (`IntuneWinAppUtil -c -s -o -q`; silent installation required), <https://learn.microsoft.com/intune/app-management/deployment/create-win32-package> (read November 8, 2026).
[^dpi-win32]: Microsoft Learn, "Win32 app management in Microsoft Intune," <https://learn.microsoft.com/intune/app-management/deployment/win32> (read November 8, 2026).
[^dpi-appdeploy]: Microsoft Learn, "Get-CMApplicationDeployment" (`-Name`, `-CollectionName`) and "Remove-CMApplicationDeployment" (pipeline input; `-Force`), <https://learn.microsoft.com/powershell/module/configurationmanager/get-cmapplicationdeployment>, <https://learn.microsoft.com/powershell/module/configurationmanager/remove-cmapplicationdeployment> (read November 8, 2026).
[^dpi-swupdate]: Microsoft Learn, "Set-CMClientSettingSoftwareUpdate" (`-Enable`, alias `EnableSoftwareUpdatesOnClient`), <https://learn.microsoft.com/powershell/module/configurationmanager/set-cmclientsettingsoftwareupdate> (read November 8, 2026).
[^dpi-mcc-prereq]: Microsoft Learn, "Microsoft Connected Cache for Enterprise and Education requirements" (host OS; nothing else on port 80, for example a distribution point; 4 GB free memory and 100 GB free disk; PowerShell 5.1 for the deployment scripts), <https://learn.microsoft.com/windows/deployment/do/mcc-ent-prerequisites> (read November 8, 2026).
[^dpi-mcc-deploy]: Microsoft Learn, "Deploy Microsoft Connected Cache software to a Windows host machine" (`Add-AppxPackage`; `Get-AppxPackage Microsoft.DeliveryOptimization`; the `$User` runtime account and `$myLocalAccountCredential`; `deliveryoptimization-cli mcc-get-scripts-path`; `deploymcconwsl.ps1` and its parameter table; `DOCacheHost`), <https://learn.microsoft.com/windows/deployment/do/mcc-ent-deploy-to-windows>, and "Troubleshoot Microsoft Connected Cache for Enterprise and Education" (`uninstallmcconwsl.ps1`), <https://learn.microsoft.com/windows/deployment/do/mcc-ent-troubleshooting> (read November 8, 2026).
