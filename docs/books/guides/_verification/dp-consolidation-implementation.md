# Verification — Guide: Distribution Point Consolidation, implementation

New guide, first pass of 2026-11-08. The guide runs the decision guide's work as eleven steps over the scripts kit in `examples/dp-consolidation`. Every Configuration Manager cmdlet and parameter the guide or the kit uses was checked against its Microsoft Learn page on 2026-11-08 through the Microsoft Learn documentation service (pages at `https://learn.microsoft.com/powershell/module/configurationmanager/<cmdlet>`). The kit's tests passed on fixtures (24 Pester tests, PowerShell 7.6 and Windows PowerShell 5.1 for the read-only scripts). **No step was run against a live Configuration Manager hierarchy.**

## Cmdlets and parameters confirmed on Learn

| Cmdlet | Parameters used | Where | Notes |
|---|---|---|---|
| `Get-CMDistributionPointInfo` | (none) | Kit inventory; Steps 3.3, 8.4 | Properties `ServerName`, `SiteCode`, `IsPullDP`, `IsPXE`, `OperatingSystem` from the `SMS_DistributionPointInfo` class page |
| `Get-CMBoundaryGroup`, `Get-CMBoundary` | `-BoundaryGroupName` | Kit inventory | `BoundaryType` 0–3 and `Value` from the `SMS_Boundary` class page |
| `Get-CMBoundaryGroupSiteSystem` | `-GroupName` | Kit inventory; Step 4.4 | `ServerNalPath` as the page's example uses it |
| `Get-CMSiteRole` | `-AllSite` | Kit inventory; Step 10.3 | `NetworkOSPath`, `RoleName` |
| `Get-CMApplication`, `Get-CMPackage` | `-Fast`, `-Name` | Kit inventory; Steps 0.4, 3.3 | |
| `Get-CMDeployment` | `-FeatureType`, `-SoftwareName` | Kit inventory; Step 8.2 | |
| `Get-CMTaskSequenceDeployment` | `-Fast` | Kit inventory | |
| `Get-CMDistributionStatus` | pipeline input | Steps 0.4, 3.3 | Targeted, NumberSuccess, NumberErrors, NumberInProgress |
| `New-CMSiteSystemServer` | `-SiteSystemServerName`, `-SiteCode` | Kit hub tier; rollback in Step 6 | |
| `Add-CMDistributionPoint` | `-SiteSystemServerName`, `-SiteCode`, `-CertificateExpirationTimeUtc`, `-EnablePullDP`, `-SourceDistributionPoint`, `-SourceDPRank` | Kit hub tier | Default (self-signed) parameter set; PKI sets use `-CertificatePath` |
| `New-CMDistributionPointGroup`, `Add-CMDistributionPointToGroup`, `Remove-CMDistributionPointGroup` | `-Name`, `-Description`; `-DistributionPointName`, `-DistributionPointGroupName`; `-Name -Force` | Kit hub tier; Step 10.3 | |
| `Start-CMContentDistribution`, `Remove-CMContentDistribution` | `-ApplicationName`, `-PackageId`, `-DistributionPointGroupName` | Kit hub tier (and its rollback) | |
| `Invoke-CMContentValidation` | `-ApplicationName`, `-DistributionPointGroupName` | Step 3.3 | |
| `Set-CMBoundaryGroup` | `-Name`, `-AddSiteSystemServerName`, `-RemoveSiteSystemServerName`, `-AllowPeerDownload`, `-SubnetPeerDownloadOnly`, `-PreferDPOverPeer`, `-ClearSiteSystemServer` | Kit boundary groups; Step 10.3 | `-AddSiteSystemServerName` takes FQDNs |
| `New-CMBoundaryGroupRelationship`, `Get-CMBoundaryGroupRelationship` | `-SourceGroupName`, `-DestinationGroupName`, `-FallbackDPMinutes` | Kit boundary groups; Step 4.4 | -1 means never fall back |
| `New-CMClientSetting`, `Set-CMClientSettingClientCache`, `Set-CMClientSettingDeliveryOptimization`, `New-CMClientSettingDeployment` | `-Type Device`; `-EnableSuperPeer`, `-BroadcastPort`, `-DownloadPort`, `-ConfigureBranchCache`, `-EnableBranchCache`, `-ConfigureCacheSize`, `-MaxCacheSize`; `-Enable`; `-CollectionName` | Kit peer cache; Step 10.3 | `-MaxCacheSize` (alias `MaximumCacheSizeMb`), not `-MaxCacheSizeMB`; `New-CMClientSettingDeployment` replaces the deprecated `Start-CMClientSettingDeployment` |
| `Set-CMDistributionPoint` | `-SiteSystemServerName`, `-SiteCode`, `-RemoveBoundaryGroupName`, `-AddBoundaryGroupName`, `-EnableMaintenanceMode`, `-EnablePxe`, `-EnableDoinc` | Kit retirement; Steps 6.2, 8.4, 9.3 | |
| `Remove-CMDistributionPoint`, `Remove-CMSiteSystemServer` | `-SiteSystemServerName`, `-SiteCode`, `-Force` | Kit retirement | `Remove-CMSiteSystemServer` fails while other roles remain |
| `Get-CMApplicationDeployment`, `Remove-CMApplicationDeployment` | `-Name`, `-CollectionName`; pipeline input, `-Force` | Step 8.2 | |
| `Set-CMClientSettingSoftwareUpdate` | `-Name`, `-Enable` | Step 8.3 | |
| `Get-CMSite`, `New-PSDrive -PSProvider CMSite`, `Import-Module ConfigurationManager` | | Connect to the site | Learn's getting-started page; `Import-Module ConfigurationManager` from version 2111 |

## Other Learn procedures and classes

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A few CM cmdlets don't run on PowerShell 7 | How to use | verified (opened) | `dpi-cm-ps` |
| 2 | Workloads tab; Pilot Intune; Staging tab | Steps 0.1, 8.1 | verified (opened) | `dpi-switch` |
| 3 | Switching back can have an impact; CM-deployed apps stay in Software Center | Steps 8.1, 8.2 | verified (opened) | `dpi-comanage` |
| 4 | `SMS_R_System` `Client`, `Active`, `IPSubnets`, `ADSiteName` | Step 0.3 | verified (opened) | `dpi-rsystem` |
| 5 | `SMS_DPStatusInfo` counts | Step 0.3 | verified (opened) | `dpi-dpstatus` |
| 6 | In-place OS upgrade paths for site systems | Step 0.4 | verified (opened) | `dpi-upgrade` |
| 7 | Maintenance mode: no content sent, MPs stop offering the DP, not long term, don't remove the role while on | Step 6.2 | verified (opened) | `dpi-install-dp` |
| 8 | Remove-role procedure; DP removal removes shares and IIS configuration and can take long | Step 6.4 | verified (opened) | `dpi-dp-removal` |
| 9 | Boundary group Relationships tab and Never fallback | Steps 4.2, 4.3 | verified (opened) | `dpi-bg-procedures` |
| 10 | Peer cache source selection; partial download in Hierarchy Settings | Step 5.1 | verified (opened) | `dpi-peercache` |
| 11 | DO CSP: `DODownloadMode` 2 = group; `DOGroupId`, `DOGroupIdSource`, `DOCacheHost` | Steps 5.3, 9.2 | verified (opened) | `dpi-do-csp` |
| 12 | For CM, use boundary groups to define DO peer groups | Step 5.3 | verified (opened) | `dpi-do-config` |
| 13 | Client Data Sources dashboard; Client Peer Cache optional feature; up to 24 hours | Step 5.4 | verified (opened) | `dpi-monitor` |
| 14 | `IntuneWinAppUtil -c -s -o -q`; silent install required | Step 7.5 | verified (opened) | `dpi-win32-prep` |
| 15 | `Set-AuthenticodeSignature` | Step 7.3 | verified (Learn PowerShell reference, cited by URL) | `dpi-sign` |
| 16 | Connected Cache host requirements (OS, port 80, 4 GB, 100 GB, PowerShell 5.1) | Step 9 | verified (opened) | `dpi-mcc-prereq` |
| 17 | Connected Cache deploy commands: `Add-AppxPackage`, `Get-AppxPackage`, `$User`, `$myLocalAccountCredential`, `deploymcconwsl.ps1` and its parameters | Step 9.1 | verified (opened, page dated 2026-05-20) | `dpi-mcc-deploy` |
| 18 | `uninstallmcconwsl.ps1` | Step 9.1 rollback | verified (searched; troubleshooting page) | `dpi-mcc-deploy` |

## PSAppDeployToolkit (not Learn)

| Claim | Verdict | Source |
|---|---|---|
| v4 front end `Invoke-AppDeployToolkit.ps1` with `.exe` launcher; `-DeploymentType` Install/Uninstall/Repair; `-DeployMode` Auto/Interactive/NonInteractive/Silent; reboot codes 1641 and 3010 | verified (read from the project's repository) | `dpi-psadt` |
| `New-ADTTemplate -Destination -Name -Version` | verified (project documentation) | `dpi-psadt` |
| Module name `PSAppDeployToolkit` on the PowerShell Gallery | verified from the project README's Gallery link; `Install-Module` itself is standard PowerShellGet | — |
| v3 package layout (`AppDeployToolkit\AppDeployToolkitMain.ps1`, `Deploy-Application.ps1`) used by the kit's detection | `AppDeployToolkitMain.ps1` named in the README as the v3 compatibility layer; `Deploy-Application.ps1` is from v3's documentation, not re-read | Kit only |

## Could not be confirmed on Learn

- **A Get or Set cmdlet for co-management workloads.** Learn has `New-CMCoManagementPolicy` and no Get or Set page, so the kit reads workload states from a CSV recorded from the console.
- **`NumberOfDevicesWithApp`** on the object `Get-CMApplication` returns, used for install counts in live mode; flagged in the kit README.
- **`SoftwareName` and `CollectionName`** on `Get-CMDeployment` output are used as the console shows them; the cmdlet page doesn't list properties.
- **A cmdlet to add a script installer deployment type** wasn't checked, so Step 7.5 gives the console route for Configuration Manager.
- **The default site boundary group's name**, so Step 4.3 gives the console route.

## Design guidance (labeled in the page)

The 30-day watch after draining; draining rather than maintenance mode for that watch; the 120-minute fallback; the 75% target utilization and two DPs per hub; the wave order by circuit readiness; the Stage 1 and Stage 2 go/no-go criteria.

## Zero Trust closure, Phase 4 (November 11, 2026)

Applied the conventions of Book 00, Appendix D to the guide's steps (conventions on procedure sections; a "must" relabeled only where it is a recommendation).

- **Added** `#dpc-control-states`: the five control states mapped to Steps 0 to 10; a How-template coverage table that points at existing sections; a change-safety block whose rings are the guide's own Stage 1, pilot wave, later waves and Step 10; the five-kind evidence checklist (the guide had per-step requirement tables and no evidence section). No assessment-mapping block: the guide consolidates infrastructure and addresses no Zero Trust Assessment test family; the section says so.
- **Authority labels:** one relabel. Step 1.1's "The servers must run Windows Server 2019 or later" is the program's server standard, not a product requirement (Learn supports the role on 2019, 2022 and 2025, as `dpi-siteos` records); it now reads "run Windows Server 2019 or later, the workbook's minimum *(risk-based recommended: the program's server standard)*". "Restart required" (exit code 3010) and Intune's silent-install requirement are product behavior and stay.
- **Sources:** the additions make no new product, licensing or government-cloud claim; the 4,000-client limit and the 80% threshold are the guide's existing sizing and go/no-go figures. Every Learn claim above carries its November 8, 2026 read, so nothing was re-read.
