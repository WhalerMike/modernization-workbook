# Distribution point consolidation kit

> **Status: illustrative. Tested against fixtures of a fictional estate, not run against a live Configuration Manager hierarchy.**
> These scripts go with [Distribution Point Consolidation: An Implementation Guide](../../docs/books/guides/dp-consolidation-implementation.md), which runs them step by step, and the decision guide [Distribution Point Consolidation: A Decision Guide Before You Fund a Refresh](../../docs/books/guides/dp-consolidation.md). The schedule is the [Content Delivery Modernization](../../docs/project-plans/content-delivery.md) project plan. Every Configuration Manager cmdlet the scripts call was checked against its page on Microsoft Learn on November 8, 2026; the guide's verification log lists them. No agency has adopted this kit.

## What it does

| Script | Guide step | Changes anything? | Writes |
|---|---|---|---|
| `Invoke-DpcInventory.ps1` | Step 0: analyze the estate | No | `dp-inventory`, `boundary-groups`, `clients-by-boundary-group`, `site-roles`, `distribution-status`, `applications`, `packages`, `offices`, `workloads`, `findings` (CSV and JSON each) |
| `Get-DpcSizing.ps1` | Step 1: size and design | No | `sizing`, `waves` |
| `New-DpcHubTier.ps1` | Step 3: build the hub tier | Only with `-Apply` | `plan` (every command and its rollback) |
| `Set-DpcBoundaryGroups.ps1` | Step 4: boundary groups and fallback | Only with `-Apply` | `plan` |
| `Set-DpcPeerCache.ps1` | Step 5: peer cache, BranchCache, Delivery Optimization | Only with `-Apply` | `plan` |
| `Invoke-DpcOfficeRetirement.ps1` | Step 6: drain and remove an office DP; Step 10: the last DPs | `-Step Check` never; `Drain` and `Remove` only with `-Apply` | `retirement-check`, `plan` |
| `Test-DpcPackaging.ps1` | Step 7: packaging | No | `packaging` |
| `Test-DpcRetirementGates.ps1` | Step 10: the five gates | No | `gates` |

Every run writes `manifest.json`: the task, the mode, the time, and for every file its SHA-256 and the NIST SP 800-53 controls and FedRAMP 20x KSIs it is evidence for. `Test-DpcManifest` (in the module) re-hashes a run and reports any file that changed. KSIs are provider-side indicators; the agency lines its evidence up with them and doesn't report them.

The change scripts are dry runs unless you pass `-Apply`. With `-Apply` they run each planned cmdlet in order, stop at the first failure, and record each row's status; add `-WhatIf` to see each change without making it.

## Requirements

- **Fixtures (Lab 1):** PowerShell 7.2 or later, or Windows PowerShell 5.1. Nothing else. Pester 5 for the tests.
- **Live (Lab 2, Stage 1 and Stage 2):** Windows PowerShell 5.1 on a machine with the Configuration Manager console, so the `ConfigurationManager` module is installed; an account with a Configuration Manager role that can read the site (Read-only Analyst is enough for the read-only scripts) and, for `-Apply`, one that can change distribution points, boundary groups and client settings. Run from the kit folder; the scripts change to the site drive and back.

## Run it on the fixtures

```powershell
./Invoke-DpcInventory.ps1 -FixturePath tests/fixtures/estate -PackageSourceRoot tests/fixtures/packages -OutputPath out/inventory -AsOf 2026-11-08
./Get-DpcSizing.ps1 -InventoryPath out/inventory -HubDesignCsv config/hub-design.example.csv -OutputPath out/sizing
./Test-DpcRetirementGates.ps1 -InventoryPath out/inventory -OutputPath out/gates
```

The fictional estate has two data center DPs, twelve office DPs in three regions, 9,835 clients, ten applications (five on PSAppDeployToolkit) and one task sequence. It includes a Windows Server 2016 DP (a recorded exception to the 2019 minimum), a Windows Server 2012 R2 DP, three DPs with expired hardware support, two PXE DPs, one with Connected Cache, a DP with distribution errors and a subnet no boundary covers. `tests/fixtures/estate-pilot-ready` is the same estate after the hub tier is built and the two pilot offices point at their hubs.

## Inputs you keep

Three things no cmdlet reads. Copy each template and fill it in at work; keep the filled files inside your boundary.

| Template | What it holds | Who fills it |
|---|---|---|
| `config/offices.example.csv` | Office, region, boundary group, office DP, circuit Mbps, peak use, monthly cost, renewal date | Network engineering |
| `config/workloads.example.csv` | Each co-management workload's slider position, the software updates client setting, and whether Connected Cache runs on a DP | Endpoint engineering, from the console |
| `config/evidence-sources.example.csv` | For each control, where its evidence comes from | ISSO |
| `config/hub-design.example.csv` | Each hub's region, boundary group, hub DPs and source DPs | Endpoint lead, from Step 1 |

## Test it

```powershell
Invoke-Pester -Path tests
```

24 tests: the OS standard, NAL path parsing, subnet matching, PSAppDeployToolkit detection, the inventory counts and findings, the manifest and tamper check, the sizing arithmetic and wave order, the three change scripts as dry runs, the retirement check's go and no-go cases, the packaging actions, and the five gates open and closed. They prove the scripts do what they say on the fixtures. They don't prove the fixtures match your hierarchy.

## Known limits

- **Clients per boundary group** are matched on IP subnet and Active Directory site boundaries from `SMS_R_System` discovery data. IP range and IPv6 prefix boundaries aren't matched; the inventory flags groups that have them.
- **Content library size and hardware support dates** aren't read live. Measure the library on one DP (guide Step 0.2) and take support dates from the asset record.
- **Co-management workload state** has no Get cmdlet on Learn, so it comes from `workloads.csv`, recorded from the console.
- **Application install counts** in live mode come from the `NumberOfDevicesWithApp` property of the application object; confirm it against the console in your release.
- **The DP role is added with a self-signed certificate** (the cmdlet's default parameter set). For HTTPS with a PKI certificate, use the console or `-CertificatePath`.

```
examples/dp-consolidation/
  README.md
  Invoke-DpcInventory.ps1, Get-DpcSizing.ps1, New-DpcHubTier.ps1, Set-DpcBoundaryGroups.ps1,
  Set-DpcPeerCache.ps1, Invoke-DpcOfficeRetirement.ps1, Test-DpcPackaging.ps1, Test-DpcRetirementGates.ps1
  powershell/DpConsolidation/DpConsolidation.psm1   shared functions: evidence, manifest, checks, plan runner
  config/*.example.csv                              input templates
  tests/DpConsolidation.Tests.ps1                   Pester 5
  tests/fixtures/estate/                            the fictional estate
  tests/fixtures/estate-pilot-ready/                the same estate after the hub tier and the pilot boundary changes
  tests/fixtures/packages/                          package source folders: PSAppDeployToolkit 4 and 3, MSI, other
```
