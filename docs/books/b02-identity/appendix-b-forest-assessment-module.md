---
title: "Appendix B — Forest Assessment Module"
description: "The complete FMPADAssessment PowerShell module that Chapter 08 describes, restored and corrected, with installation steps and the assessment output schema with JSON examples."
doc-type: workbook-chapter
audience: [Technical]
family: b02-identity
book: B02
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Forest Assessment Module

*The code behind Chapter 08: one module, one output tree, one manifest per run.*

::: {.callout-note}
## In this appendix
The `FMPADAssessment` module manifest and module file, function by function, followed by installation steps and the schema of every output file with JSON examples. The module is the source design restored from a damaged conversion, with the cmdlet, parameter and logic errors that review found corrected. Each correction is noted where it's made. [Chapter 08](08-assessing-the-forest.md) explains what each collector is for.
:::

::: {.callout-warning}
## Illustrative code
This module is illustrative. It hasn't been tested against a production forest. Review every function, sign the module, and run it first in a test forest under the narrow rights in Chapter 08. It reads the directory and writes only to the output path and, when you call the Gitea functions, to the repository you name. It changes nothing in Active Directory, DNS or AD CS.
:::

## Corrections to the source design

The source module was flattened onto single lines during conversion, and several functions didn't work as written. The table lists what changed and why.

| Area | Source | Corrected to | Reason |
|---|---|---|---|
| Syntax | `param` with no parentheses, `@` for empty arrays, `.ToString` and `::NewGuid` without `()` | Valid PowerShell | Conversion damage |
| Version check | String comparison of `Win32_OperatingSystem.Version` | `[version]` comparison | `"10.0.9" -ge "10.0.26100"` is true as strings |
| Required modules | `ADCSAdministration` required | Removed; PSPKI optional | Neither is needed; PSPKI is no longer actively supported by its publisher[^aB-pspki] |
| DNS servers | Global catalogs only | All DCs, or a list you pass | DNS servers and GCs are different sets |
| DNS record data | PowerShell 7 `??` operator | `switch` on record type | The module declares PowerShell 5.1 |
| GPO links | OUs and domain root only | Also sites | Site-linked GPOs were reported as unlinked |
| Empty GPO check | `$Report = \xml\` (damaged) | `[xml](Get-GPOReport ... -ReportType Xml)` | Conversion damage |
| CA discovery | `certutil -config - -ping` | Directory query of Enrollment Services | `-config -` prompts for a CA interactively |
| PSPKI calls | `Get-CACertificate`, `Get-CACrlDistributionPoint`, `Get-CAAuthorityInformationAccess` | `certutil -ca.cert`, directory CDP and AIA objects | The first doesn't exist; the PSPKI names are `Get-CRLDistributionPoint` and `Get-AuthorityInformationAccess`[^aB-pspki-gallery] |
| ESC1 check | Key usage contains Digital Signature | Authentication EKU present, enrollee supplies subject, no approval or signature, broad enroll right | Key usage isn't EKU; nearly every template has Digital Signature |
| Delegation | `TrustedToAuthForDelegation` alone labeled protocol transition; RBCD missing | Four-way classification, DCs excluded | See Chapter 08 |
| Trusts | `Test-ADTrust`; direction text reversed | `netdom trust /verify` in a separate function; corrected text | `Test-ADTrust` isn't an ActiveDirectory cmdlet[^aB-admodule] |
| Orphaned `adminCount` | Direct `MemberOf` name match | Recursive membership of protected groups | Nested members were reported as orphans |
| Collector scope | `-Domain` accepted but ignored | Passed to every cmdlet as `-Server` or `-Domain` | Multi-domain runs assessed only the current domain |
| Gitea | One commit per file; labels never resolved | One multi-file commit on a run branch; label IDs looked up | One run, one commit; the API takes label IDs[^aB-gitea] |
| Credentials | Token in a text file; user account with typed password | Token from the credential store; gMSA | No stored secrets |

## B.1 Module manifest (`FMPADAssessment.psd1`)

Generate a new GUID with `New-Guid` and paste it in; the source's placeholder GUID isn't unique.

```powershell
@{
    RootModule        = 'FMPADAssessment.psm1'
    ModuleVersion     = '1.1.0'
    GUID              = '<paste the output of New-Guid here>'
    Author            = 'Federal Modernization Program'
    CompanyName       = 'FMP'
    Copyright         = '(c) 2026 Federal Modernization Program'
    Description       = 'Active Directory forest assessment: discovery, assessment and evidence pipeline.'
    PowerShellVersion = '5.1'
    RequiredModules   = @('ActiveDirectory', 'GroupPolicy')
    FunctionsToExport = @(
        'Test-FMPPrerequisites'
        'Get-FMPForestTopology'
        'Get-FMPOUHierarchy'
        'Get-FMPGPOInventory'
        'Export-FMPGPOSettings'
        'Get-FMPDNSAssessment'
        'Get-FMPPKIAssessment'
        'Get-FMPComputerInventory'
        'Get-FMPUserInventory'
        'Get-FMPGroupInventory'
        'Get-FMPTrustMap'
        'Test-FMPTrust'
        'Invoke-FMPADAssessment'
        'Compare-FMPAssessments'
        'Push-FMPAssessmentToGitea'
        'New-FMPSecurityIssue'
        'Invoke-FMPFindingIssues'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{
        PSData = @{
            Tags = @('ActiveDirectory', 'Assessment', 'Governance', 'FMP')
        }
    }
}
```

## B.2 Module file (`FMPADAssessment.psm1`)

The module file is one script. It's shown here in sections, in file order.

### Header and helpers

```powershell
#Requires -Version 5.1
#Requires -Modules ActiveDirectory, GroupPolicy

<#
.SYNOPSIS
    Federal Modernization Program Active Directory assessment module.
.DESCRIPTION
    Forest discovery, infrastructure assessment and evidence extraction.
    Read-only against the directory. Writes only under -OutputPath.
#>

function Initialize-FMPPath {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -Path $Path)) {
        New-Item -Path $Path -ItemType Directory -Force | Out-Null
    }
    $Path
}

function Write-FMPJson {
    param(
        [Parameter(Mandatory)]$InputObject,
        [Parameter(Mandatory)][string]$Path,
        [int]$Depth = 8
    )
    $InputObject | ConvertTo-Json -Depth $Depth |
        Out-File -FilePath $Path -Encoding UTF8
}

function Get-FMPDomainPath {
    # Returns <OutputPath>\<domain>\<Area>, creating it if needed.
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][string]$Area
    )
    Initialize-FMPPath -Path (Join-Path (Join-Path $OutputPath $Domain) $Area)
}
```

### Prerequisites

```powershell
function Test-FMPPrerequisites {
    <#
    .SYNOPSIS
        Checks OS build, modules, forest connectivity and the output root.
    #>
    [CmdletBinding()]
    param([string]$OutputPath = 'D:\FMP\Assessment')

    $results = @()

    # Windows Server 2025 and Windows 11 24H2 report build 26100; 25H2 reports 26200.
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $osPass = ([version]$os.Version) -ge [version]'10.0.26100'
    $results += [pscustomobject]@{
        Check  = 'Operating system'
        Status = if ($osPass) { 'PASS' } else { 'FAIL' }
        Detail = "$($os.Caption) ($($os.Version))"
    }

    $required = 'ActiveDirectory', 'GroupPolicy', 'DnsServer'
    $optional = 'PSPKI'
    foreach ($name in ($required + $optional)) {
        $mod = Get-Module -ListAvailable -Name $name | Select-Object -First 1
        $status = if ($mod) { 'PASS' } elseif ($name -in $optional) { 'OPTIONAL' } else { 'FAIL' }
        $results += [pscustomobject]@{
            Check  = "Module: $name"
            Status = $status
            Detail = if ($mod) { "Version $($mod.Version)" } else { 'Not installed' }
        }
    }

    try {
        $forest = Get-ADForest -ErrorAction Stop
        $results += [pscustomobject]@{ Check = 'Forest connectivity'; Status = 'PASS'; Detail = "Connected to $($forest.Name)" }
    } catch {
        $results += [pscustomobject]@{ Check = 'Forest connectivity'; Status = 'FAIL'; Detail = $_.Exception.Message }
    }

    $results += [pscustomobject]@{
        Check  = 'Output root'
        Status = if (Test-Path $OutputPath) { 'PASS' } else { 'FAIL' }
        Detail = $OutputPath
    }

    $results | Format-Table -AutoSize | Out-Host
    $failed = @($results | Where-Object Status -eq 'FAIL').Count
    if ($failed -gt 0) { Write-Warning "$failed prerequisite(s) failed. Resolve before running the assessment." }
    $results
}
```

### Forest topology

```powershell
function Get-FMPForestTopology {
    <#
    .SYNOPSIS
        Captures forest, domains, DCs, sites, site links, subnets and operations master roles.
    .OUTPUTS
        ForestTopology.json plus Domains\AllDomains.json and Domains\DomainControllers.json.
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment'
    )

    $forest     = Get-ADForest -Server $Domain
    $forestPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Forest'
    $domainPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Domains'

    $forestInfo = $forest | Select-Object Name, RootDomain,
        @{ N = 'ForestMode';       E = { "$($_.ForestMode)" } },
        SchemaMaster, DomainNamingMaster,
        @{ N = 'Domains';          E = { @($_.Domains) } },
        @{ N = 'Sites';            E = { @($_.Sites) } },
        @{ N = 'GlobalCatalogs';   E = { @($_.GlobalCatalogs) } },
        @{ N = 'UPNSuffixes';      E = { @($_.UPNSuffixes) } },
        @{ N = 'SPNSuffixes';      E = { @($_.SPNSuffixes) } }

    $domains = foreach ($d in $forest.Domains) {
        Get-ADDomain -Server $d | Select-Object DNSRoot, NetBIOSName,
            @{ N = 'DomainMode'; E = { "$($_.DomainMode)" } },
            @{ N = 'DomainSID';  E = { "$($_.DomainSID)" } },
            PDCEmulator, RIDMaster, InfrastructureMaster,
            DistinguishedName, ParentDomain,
            @{ N = 'ChildDomains'; E = { @($_.ChildDomains) } }
    }

    $dcs = foreach ($d in $forest.Domains) {
        Get-ADDomainController -Filter * -Server $d | Select-Object HostName, Domain, Site,
            IPv4Address, OperatingSystem, OperatingSystemVersion,
            IsGlobalCatalog, IsReadOnly, Enabled,
            @{ N = 'OperationMasterRoles'; E = { @($_.OperationMasterRoles | ForEach-Object { "$_" }) } }
    }

    $sites = Get-ADReplicationSite -Filter * -Server $Domain -Properties Description, Location |
        Select-Object Name, Description, Location,
            @{ N = 'Subnets'; E = {
                $dn = $_.DistinguishedName
                @(Get-ADReplicationSubnet -Filter "Site -eq '$dn'" -Server $Domain |
                    Select-Object -ExpandProperty Name) } }

    $siteLinks = Get-ADReplicationSiteLink -Filter * -Server $Domain -Properties Description, Options |
        Select-Object Name, Cost, ReplicationFrequencyInMinutes, Options, Description,
            @{ N = 'Sites'; E = { @($_.SitesIncluded | ForEach-Object { ($_ -split ',')[0] -replace '^CN=', '' }) } }

    $subnets = Get-ADReplicationSubnet -Filter * -Server $Domain -Properties Description, Location |
        Select-Object Name, Location, Description,
            @{ N = 'Site'; E = { if ($_.Site) { ($_.Site -split ',')[0] -replace '^CN=', '' } } }

    # Two forest-wide roles plus three per domain.
    $fsmo = @(
        [pscustomobject]@{ Role = 'SchemaMaster';       Scope = 'Forest'; Domain = $forest.RootDomain; Holder = $forest.SchemaMaster }
        [pscustomobject]@{ Role = 'DomainNamingMaster'; Scope = 'Forest'; Domain = $forest.RootDomain; Holder = $forest.DomainNamingMaster }
    )
    foreach ($d in $domains) {
        $fsmo += [pscustomobject]@{ Role = 'PDCEmulator';          Scope = 'Domain'; Domain = $d.DNSRoot; Holder = $d.PDCEmulator }
        $fsmo += [pscustomobject]@{ Role = 'RIDMaster';            Scope = 'Domain'; Domain = $d.DNSRoot; Holder = $d.RIDMaster }
        $fsmo += [pscustomobject]@{ Role = 'InfrastructureMaster'; Scope = 'Domain'; Domain = $d.DNSRoot; Holder = $d.InfrastructureMaster }
    }

    $topology = [pscustomobject]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        Forest              = $forestInfo
        Domains             = @($domains)
        DomainControllers   = @($dcs)
        Sites               = @($sites)
        SiteLinks           = @($siteLinks)
        Subnets             = @($subnets)
        FSMORoles           = $fsmo
    }

    Write-FMPJson -InputObject $topology        -Path (Join-Path $forestPath 'ForestTopology.json') -Depth 10
    Write-FMPJson -InputObject $forestInfo      -Path (Join-Path $forestPath 'ForestInfo.json')
    Write-FMPJson -InputObject @($sites)        -Path (Join-Path $forestPath 'Sites.json')
    Write-FMPJson -InputObject @($siteLinks)    -Path (Join-Path $forestPath 'SiteLinks.json')
    Write-FMPJson -InputObject @($subnets)      -Path (Join-Path $forestPath 'Subnets.json')
    Write-FMPJson -InputObject $fsmo            -Path (Join-Path $forestPath 'FSMORoles.json')
    Write-FMPJson -InputObject @($domains)      -Path (Join-Path $domainPath 'AllDomains.json')
    Write-FMPJson -InputObject @($dcs)          -Path (Join-Path $domainPath 'DomainControllers.json')
    foreach ($d in $domains) {
        Write-FMPJson -InputObject $d -Path (Join-Path $domainPath "$($d.DNSRoot).json")
    }

    Write-Verbose "ForestTopology.json written to $forestPath"
    $topology
}
```

### OU hierarchy and delegation

```powershell
function Build-OUTree {
    # Recursive nested tree from a parent DN, with direct object counts and links.
    param(
        [Parameter(Mandatory)][string]$ParentDN,
        [Parameter(Mandatory)][string]$Server,
        [int]$Depth = 0
    )
    $children = Get-ADOrganizationalUnit -Filter * -SearchBase $ParentDN -SearchScope OneLevel `
        -Server $Server -Properties Description, ManagedBy, ProtectedFromAccidentalDeletion, LinkedGroupPolicyObjects

    foreach ($ou in $children) {
        $dn = $ou.DistinguishedName
        [pscustomobject]@{
            Name                            = $ou.Name
            DistinguishedName               = $dn
            Description                     = $ou.Description
            ManagedBy                       = $ou.ManagedBy
            ProtectedFromAccidentalDeletion = $ou.ProtectedFromAccidentalDeletion
            LinkedGPOs                      = @($ou.LinkedGroupPolicyObjects)
            Depth                           = $Depth
            ObjectCounts                    = [pscustomobject]@{
                Users     = @(Get-ADUser     -Filter * -SearchBase $dn -SearchScope OneLevel -Server $Server).Count
                Computers = @(Get-ADComputer -Filter * -SearchBase $dn -SearchScope OneLevel -Server $Server).Count
                Groups    = @(Get-ADGroup    -Filter * -SearchBase $dn -SearchScope OneLevel -Server $Server).Count
            }
            Children = @(Build-OUTree -ParentDN $dn -Server $Server -Depth ($Depth + 1))
        }
    }
}

function Show-OUTree {
    # Indented text rendering for human review.
    param([Parameter(Mandatory)]$TreeNodes, [int]$IndentLevel = 0)
    $indent = '    ' * $IndentLevel
    foreach ($node in $TreeNodes) {
        $c = $node.ObjectCounts
        "{0}+-- {1} [U:{2} C:{3} G:{4} GPO:{5}]" -f $indent, $node.Name, $c.Users, $c.Computers, $c.Groups, @($node.LinkedGPOs).Count
        if (@($node.Children).Count -gt 0) {
            Show-OUTree -TreeNodes $node.Children -IndentLevel ($IndentLevel + 1)
        }
    }
}

function Get-OUGPOLinks {
    # Links and inheritance for one domain or OU, from Get-GPInheritance.
    param(
        [Parameter(Mandatory)][string]$DistinguishedName,
        [Parameter(Mandatory)][string]$Domain
    )
    $som = Get-GPInheritance -Target $DistinguishedName -Domain $Domain
    [pscustomobject]@{
        Container          = $DistinguishedName
        InheritanceBlocked = "$($som.GpoInheritanceBlocked)"
        GPOLinks           = @($som.GpoLinks | ForEach-Object {
            [pscustomobject]@{
                GPOName   = $_.DisplayName
                GPOGUID   = "$($_.GpoId)"
                LinkOrder = $_.Order
                Enabled   = $_.Enabled
                Enforced  = $_.Enforced
            } })
    }
}

function Get-FMPOUHierarchy {
    <#
    .SYNOPSIS
        Extracts the OU tree, flat list, GPO links, delegations and a text rendering.
    .OUTPUTS
        OUHierarchy.json, OUFlatList.csv, OUFlatExport.json, OUGPOLinks.json, OUDelegations.json, OUTreeVisual.txt
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment'
    )
    Import-Module ActiveDirectory    # provides the AD: drive used for ACL reads
    $ouPath   = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'OUs'
    $domainDN = (Get-ADDomain -Server $Domain).DistinguishedName

    $tree = @(Build-OUTree -ParentDN $domainDN -Server $Domain -Depth 0)
    Write-FMPJson -InputObject $tree -Path (Join-Path $ouPath 'OUHierarchy.json') -Depth 30

    $all = Get-ADOrganizationalUnit -Filter * -Server $Domain -Properties CanonicalName, Description, ManagedBy,
        Created, Modified, ProtectedFromAccidentalDeletion, LinkedGroupPolicyObjects, gPOptions
    $flat = $all | Select-Object Name, DistinguishedName, CanonicalName, Description, ManagedBy,
        Created, Modified, ProtectedFromAccidentalDeletion,
        @{ N = 'LinkedGPOs';         E = { @($_.LinkedGroupPolicyObjects) } },
        @{ N = 'InheritanceBlocked'; E = { $_.gPOptions -eq 1 } },
        @{ N = 'Depth';              E = { ([regex]::Matches($_.DistinguishedName, '(?i)OU=')).Count } }
    Write-FMPJson -InputObject @($flat) -Path (Join-Path $ouPath 'OUFlatExport.json')
    $flat | Select-Object Name, CanonicalName, Description, ManagedBy, ProtectedFromAccidentalDeletion, InheritanceBlocked, Depth |
        Export-Csv -Path (Join-Path $ouPath 'OUFlatList.csv') -NoTypeInformation -Encoding UTF8

    $links = @(Get-OUGPOLinks -DistinguishedName $domainDN -Domain $Domain)
    $links += foreach ($ou in $all) { Get-OUGPOLinks -DistinguishedName $ou.DistinguishedName -Domain $Domain }
    Write-FMPJson -InputObject $links -Path (Join-Path $ouPath 'OUGPOLinks.json')

    # Non-inherited ACEs only, excluding built-in and well-known principals.
    $delegations = foreach ($ou in $all) {
        $acl = Get-Acl -Path "AD:\$($ou.DistinguishedName)"
        [pscustomobject]@{
            OU          = $ou.Name
            DN          = $ou.DistinguishedName
            Delegations = @($acl.Access | Where-Object {
                    -not $_.IsInherited -and
                    "$($_.IdentityReference)" -notmatch '^(NT AUTHORITY|BUILTIN)\\|^S-1-5-'
                } | ForEach-Object {
                    [pscustomobject]@{
                        IdentityReference     = "$($_.IdentityReference)"
                        ActiveDirectoryRights = "$($_.ActiveDirectoryRights)"
                        AccessControlType     = "$($_.AccessControlType)"
                        ObjectType            = "$($_.ObjectType)"
                        InheritedObjectType   = "$($_.InheritedObjectType)"
                        InheritanceType       = "$($_.InheritanceType)"
                    } })
        }
    }
    Write-FMPJson -InputObject @($delegations) -Path (Join-Path $ouPath 'OUDelegations.json')

    Show-OUTree -TreeNodes $tree | Out-File -FilePath (Join-Path $ouPath 'OUTreeVisual.txt') -Encoding UTF8
    Write-Verbose "OU hierarchy written to $ouPath"
}
```

### Group Policy

```powershell
function Export-FMPGPOSettings {
    <#
    .SYNOPSIS
        Decomposes GPO XML reports into settings grouped by configuration area.
    .OUTPUTS
        GPOSettingsDecomposed.json
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$GPOSettingsPath,
        [Parameter(Mandatory)][string]$OutputPath
    )
    $areas = 'Security', 'Administrative Templates', 'Preferences', 'Scripts',
             'Software Installation', 'Folder Redirection', 'Registry'

    $decomposed = foreach ($file in Get-ChildItem -Path $GPOSettingsPath -Filter '*.xml') {
        [xml]$x = Get-Content -Path $file.FullName -Raw
        $entry = [ordered]@{
            GPOName  = $x.GPO.Name
            GPOGUID  = $x.GPO.Identifier.Identifier.'#text'
            Computer = [ordered]@{}
            User     = [ordered]@{}
        }
        foreach ($half in 'Computer', 'User') {
            $ext = @($x.GPO.$half.ExtensionData)
            foreach ($area in $areas) {
                $entry[$half][$area] = @($ext | Where-Object { $_.Name -match [regex]::Escape($area) } |
                    Select-Object -ExpandProperty Name)
            }
        }
        [pscustomobject]$entry
    }
    Write-FMPJson -InputObject @($decomposed) -Path (Join-Path $OutputPath 'GPOSettingsDecomposed.json') -Depth 15
    Write-Verbose "Decomposed $(@($decomposed).Count) GPO reports."
}

function Find-GPOConflicts {
    # Settings that appear in more than one GPO, keyed by extension element and name.
    param(
        [Parameter(Mandatory)][string]$GPOSettingsPath
    )
    $map = @{}
    foreach ($file in Get-ChildItem -Path $GPOSettingsPath -Filter '*.xml') {
        [xml]$x = Get-Content -Path $file.FullName -Raw
        foreach ($half in 'Computer', 'User') {
            foreach ($ext in @($x.GPO.$half.ExtensionData)) {
                if (-not $ext.Extension) { continue }
                foreach ($node in $ext.Extension.ChildNodes) {
                    if (-not $node.Name) { continue }
                    $key = '{0}|{1}|{2}' -f $half, $node.LocalName, $node.Name
                    if (-not $map.ContainsKey($key)) { $map[$key] = @() }
                    $map[$key] += [pscustomobject]@{
                        GPOName = $x.GPO.Name
                        State   = $node.State
                    }
                }
            }
        }
    }
    $map.GetEnumerator() | Where-Object { @($_.Value).Count -gt 1 } | ForEach-Object {
        [pscustomobject]@{
            SettingKey     = $_.Key
            GPOCount       = @($_.Value).Count
            DifferentState = @($_.Value.State | Select-Object -Unique).Count -gt 1
            GPOs           = @($_.Value)
        }
    }
}

function Get-FMPGPOInventory {
    <#
    .SYNOPSIS
        GPO inventory, XML and HTML reports, links (domain, OU and site), permissions,
        unlinked, empty and overlapping GPOs, and a native backup.
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment',
        [switch]$SkipBackup
    )
    $gpoPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'GPOs'
    $setPath = Initialize-FMPPath -Path (Join-Path $gpoPath 'GPOSettings')
    $bakPath = Initialize-FMPPath -Path (Join-Path $gpoPath 'GPOBackups')

    $gpos = @(Get-GPO -All -Domain $Domain)

    $inventory = $gpos | Select-Object DisplayName,
        @{ N = 'Id';              E = { "$($_.Id)" } },
        @{ N = 'GpoStatus';       E = { "$($_.GpoStatus)" } },
        CreationTime, ModificationTime, Owner, Description,
        @{ N = 'WmiFilterName';   E = { if ($_.WmiFilter) { $_.WmiFilter.Name } } },
        @{ N = 'ComputerEnabled'; E = { "$($_.GpoStatus)" -notmatch 'ComputerSettingsDisabled|AllSettingsDisabled' } },
        @{ N = 'UserEnabled';     E = { "$($_.GpoStatus)" -notmatch 'UserSettingsDisabled|AllSettingsDisabled' } }
    Write-FMPJson -InputObject @($inventory) -Path (Join-Path $gpoPath 'GPOInventory.json')

    foreach ($g in $gpos) {
        $id = "$($g.Id)"
        Get-GPOReport -Guid $g.Id -Domain $Domain -ReportType Xml  -Path (Join-Path $setPath "$id.xml")
        Get-GPOReport -Guid $g.Id -Domain $Domain -ReportType Html -Path (Join-Path $setPath "$id.html")
    }

    # Every container with a gPLink: domain, OUs and sites (sites live in the configuration partition).
    $config = (Get-ADRootDSE -Server $Domain).configurationNamingContext
    $domainDN = (Get-ADDomain -Server $Domain).DistinguishedName
    $containers = @(Get-ADObject -Identity $domainDN -Server $Domain -Properties gPLink)
    $containers += @(Get-ADOrganizationalUnit -Filter * -Server $Domain -Properties gPLink)
    $containers += @(Get-ADObject -SearchBase "CN=Sites,$config" -Server $Domain `
        -LDAPFilter '(&(objectClass=site)(gPLink=*))' -Properties gPLink)

    $links = foreach ($g in $gpos) {
        $guid = [regex]::Escape("$($g.Id)")
        $where = @($containers | Where-Object { $_.gPLink -match "(?i)\{$guid\}" } |
            Select-Object -ExpandProperty DistinguishedName)
        [pscustomobject]@{
            GPOName     = $g.DisplayName
            GPOGUID     = "$($g.Id)"
            LinkedTo    = $where
            SiteLinked  = @($where | Where-Object { $_ -match '(?i),CN=Sites,' }).Count -gt 0
            TotalLinks  = $where.Count
            IsUnlinked  = $where.Count -eq 0
        }
    }
    Write-FMPJson -InputObject @($links) -Path (Join-Path $gpoPath 'GPOLinks.json')

    $empty = foreach ($g in $gpos) {
        [xml]$r = Get-Content -Path (Join-Path $setPath "$($g.Id).xml") -Raw
        if (-not $r.GPO.Computer.ExtensionData -and -not $r.GPO.User.ExtensionData) {
            [pscustomobject]@{ GPOName = $g.DisplayName; GPOGUID = "$($g.Id)"; CreationTime = $g.CreationTime; Owner = $g.Owner }
        }
    }
    Write-FMPJson -InputObject @($empty) -Path (Join-Path $gpoPath 'GPOEmpty.json')

    $perms = foreach ($g in $gpos) {
        [pscustomobject]@{
            GPOName     = $g.DisplayName
            GPOGUID     = "$($g.Id)"
            Permissions = @(Get-GPPermission -Guid $g.Id -DomainName $Domain -All | ForEach-Object {
                [pscustomobject]@{
                    Trustee     = $_.Trustee.Name
                    TrusteeType = "$($_.Trustee.SidType)"
                    Permission  = "$($_.Permission)"
                    Inherited   = $_.Inherited
                } })
        }
    }
    Write-FMPJson -InputObject @($perms) -Path (Join-Path $gpoPath 'GPOPermissions.json')

    Export-FMPGPOSettings -GPOSettingsPath $setPath -OutputPath $gpoPath
    Write-FMPJson -InputObject @(Find-GPOConflicts -GPOSettingsPath $setPath) -Path (Join-Path $gpoPath 'GPOConflicts.json') -Depth 6

    if (-not $SkipBackup) { Backup-GPO -All -Domain $Domain -Path $bakPath | Out-Null }
    Write-Verbose "GPO inventory written to $gpoPath"
}
```

`Get-GPPermission` returns `GPPermission` objects whose `Trustee` property identifies the principal; check the property names against `Get-GPPermission ... | Get-Member` on your GroupPolicy module version before relying on the `TrusteeType` column.[^aB-gppermission]

### DNS

```powershell
function Get-FMPDnsRecordData {
    # PowerShell 5.1-compatible replacement for the source's ?? chain.
    param([Parameter(Mandatory)]$Record)
    $d = $Record.RecordData
    switch ($Record.RecordType) {
        'A'     { "$($d.IPv4Address)" }
        'AAAA'  { "$($d.IPv6Address)" }
        'CNAME' { $d.HostNameAlias }
        'NS'    { $d.NameServer }
        'PTR'   { $d.PtrDomainName }
        'MX'    { "$($d.Preference) $($d.MailExchange)" }
        'SRV'   { "$($d.Priority) $($d.Weight) $($d.Port) $($d.DomainName)" }
        'TXT'   { $d.DescriptiveText }
        'SOA'   { $d.PrimaryServer }
        default { '' }
    }
}

function Get-FMPDNSAssessment {
    <#
    .SYNOPSIS
        Zones, records, forwarders, stub zones, DNSSEC, scavenging, stale records and DC locator SRV checks.
    .OUTPUTS
        DNSInventory.json, DNSHealthReport.json, DNSRecordInventory.json
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment',
        [string[]]$DnsServer,
        [int]$StaleThresholdDays = 90
    )
    $dnsPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'DNS'
    if (-not $DnsServer) {
        # Every DC in the domain, not only global catalogs; unreachable servers are reported, not fatal.
        $DnsServer = Get-ADDomainController -Filter * -Server $Domain | Select-Object -ExpandProperty HostName
    }
    $primary   = (Get-ADDomain -Server $Domain).PDCEmulator
    $stale     = (Get-Date).AddDays(-$StaleThresholdDays)

    $zonesByServer = foreach ($s in $DnsServer) {
        try {
            Get-DnsServerZone -ComputerName $s -ErrorAction Stop | Select-Object ZoneName,
                @{ N = 'ZoneType'; E = { "$($_.ZoneType)" } },
                IsAutoCreated, IsDsIntegrated, IsReverseLookupZone, IsSigned,
                @{ N = 'DynamicUpdate'; E = { "$($_.DynamicUpdate)" } },
                @{ N = 'DnsServer'; E = { $s } },
                @{ N = 'Partition'; E = {
                    if (-not $_.IsDsIntegrated) { 'File-backed' }
                    elseif ($_.DirectoryPartitionName -match '(?i)ForestDnsZones') { 'ForestDnsZones' }
                    elseif ($_.DirectoryPartitionName -match '(?i)DomainDnsZones') { 'DomainDnsZones' }
                    else { 'Domain' } } }
        } catch {
            [pscustomobject]@{ ZoneName = $null; DnsServer = $s; Error = $_.Exception.Message }
        }
    }

    $zones = Get-DnsServerZone -ComputerName $primary | Where-Object { -not $_.IsAutoCreated -and $_.ZoneName -ne 'TrustAnchors' }

    $records = foreach ($z in $zones) {
        $rr = @(Get-DnsServerResourceRecord -ZoneName $z.ZoneName -ComputerName $primary -ErrorAction SilentlyContinue)
        [pscustomobject]@{
            ZoneName      = $z.ZoneName
            RecordCount   = $rr.Count
            RecordsByType = @($rr | Group-Object RecordType | Select-Object Name, Count)
            StaleRecords  = @($rr | Where-Object { $_.Timestamp -and $_.Timestamp -lt $stale } |
                Select-Object HostName, RecordType, Timestamp,
                    @{ N = 'Data';    E = { Get-FMPDnsRecordData -Record $_ } },
                    @{ N = 'AgeDays'; E = { ((Get-Date) - $_.Timestamp).Days } })
        }
    }

    $dnssec = foreach ($z in ($zones | Where-Object IsSigned)) {
        Get-DnsServerDnsSecZoneSetting -ZoneName $z.ZoneName -ComputerName $primary |
            Select-Object ZoneName,
                @{ N = 'DenialOfExistence'; E = { "$($_.DenialOfExistence)" } },
                IsKeyMasterServer, KeyMasterServer,
                @{ N = 'DSRecordGenerationAlgorithm'; E = { @($_.DSRecordGenerationAlgorithm | ForEach-Object { "$_" }) } }
    }

    $srv = foreach ($prefix in '_ldap._tcp', '_kerberos._tcp', '_gc._tcp', '_kpasswd._tcp') {
        $name = "$prefix.$Domain"
        $r = @(Resolve-DnsName -Name $name -Type SRV -Server $primary -ErrorAction SilentlyContinue |
            Where-Object { $_.Type -eq 'SRV' })
        [pscustomobject]@{
            SRVRecord   = $name
            RecordCount = $r.Count
            Status      = if ($r.Count -gt 0) { 'PASS' } else { 'FAIL' }
            Targets     = ($r.NameTarget -join ', ')
        }
    }

    $scav = Get-DnsServerScavenging -ComputerName $primary | Select-Object ScavengingState,
        @{ N = 'ScavengingInterval'; E = { "$($_.ScavengingInterval)" } },
        @{ N = 'RefreshInterval';    E = { "$($_.RefreshInterval)" } },
        @{ N = 'NoRefreshInterval';  E = { "$($_.NoRefreshInterval)" } },
        LastScavengeTime

    $fwd = Get-DnsServerForwarder -ComputerName $primary | Select-Object @{ N = 'IPAddress'; E = { @($_.IPAddress | ForEach-Object { "$_" }) } }, UseRootHint

    $inventory = [pscustomobject]@{
        AssessmentTimestamp   = (Get-Date -Format 'o')
        DnsServer             = $primary
        Zones                 = @($zones | Select-Object ZoneName, @{ N = 'ZoneType'; E = { "$($_.ZoneType)" } },
                                    IsDsIntegrated, IsReverseLookupZone, IsSigned,
                                    @{ N = 'MasterServers'; E = { @($_.MasterServers | ForEach-Object { "$_" }) } })
        ConditionalForwarders = @($zones | Where-Object { "$($_.ZoneType)" -eq 'Forwarder' } | Select-Object -ExpandProperty ZoneName)
        StubZones             = @($zones | Where-Object { "$($_.ZoneType)" -eq 'Stub' } | Select-Object -ExpandProperty ZoneName)
        Forwarders            = $fwd
        Scavenging            = $scav
        DNSSEC                = @($dnssec)
    }
    $health = [pscustomobject]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        ZonesByServer       = @($zonesByServer)
        SRVChecks           = @($srv)
        StaleThresholdDays  = $StaleThresholdDays
    }

    Write-FMPJson -InputObject $inventory   -Path (Join-Path $dnsPath 'DNSInventory.json') -Depth 10
    Write-FMPJson -InputObject $health      -Path (Join-Path $dnsPath 'DNSHealthReport.json') -Depth 10
    Write-FMPJson -InputObject @($records)  -Path (Join-Path $dnsPath 'DNSRecordInventory.json') -Depth 6
    Write-Verbose "DNS assessment written to $dnsPath"
}
```

The DnsServer cmdlets used here are documented with these output fields: `Get-DnsServerDnsSecZoneSetting` for the DNSSEC fields and `Get-DnsServerScavenging` for the aging settings.[^aB-dnssec][^aB-scavenging] A record whose timestamp is empty is static and never scavenged, which is why the stale filter skips it.[^aB-scavenging]

### AD CS

The collector reads CA and template configuration from the directory, reads each CA certificate and policy flags with `certutil`, and evaluates the ESC patterns that Defender for Identity assesses.[^aB-mdi-cert] Constants come from Microsoft's published flag and right definitions: enrollee supplies subject is `0x1` in `msPKI-Certificate-Name-Flag`, pend all requests (manager approval) is `0x2` in `msPKI-Enrollment-Flag`, and the Enroll extended right is `0e10c968-78fb-11d2-90d4-00c04f79dc55`.[^aB-nameflag][^aB-enrollflag][^aB-enroll] The authentication EKUs are Client Authentication and Smart Card Logon, PKINIT client authentication, and Any Purpose.[^aB-scl-oids][^aB-rfc4556][^aB-rfc5280]

```powershell
$script:FMPAuthEku = @(
    '1.3.6.1.5.5.7.3.2'       # Client Authentication
    '1.3.6.1.4.1.311.20.2.2'  # Smart Card Logon
    '1.3.6.1.5.2.3.4'         # PKINIT client authentication
    '2.5.29.37.0'             # Any Purpose
)
$script:FMPEnrollRight  = [guid]'0e10c968-78fb-11d2-90d4-00c04f79dc55'
$script:FMPBroadPrincipal = '(?i)\\(Authenticated Users|Domain Users|Domain Computers|Everyone)$|^Everyone$'

function Get-FMPPkiData {
    # Enterprise CAs and templates straight from the configuration partition.
    param([Parameter(Mandatory)][string]$Server)
    $config = (Get-ADRootDSE -Server $Server).configurationNamingContext
    $pks    = "CN=Public Key Services,CN=Services,$config"

    $cas = Get-ADObject -SearchBase "CN=Enrollment Services,$pks" -Server $Server `
        -LDAPFilter '(objectClass=pKIEnrollmentService)' -Properties cn, displayName, dNSHostName, certificateTemplates, nTSecurityDescriptor

    $templates = Get-ADObject -SearchBase "CN=Certificate Templates,$pks" -Server $Server `
        -LDAPFilter '(objectClass=pKICertificateTemplate)' `
        -Properties cn, displayName, msPKI-Cert-Template-OID, msPKI-Template-Schema-Version,
                    msPKI-Certificate-Name-Flag, msPKI-Enrollment-Flag, msPKI-RA-Signature,
                    pKIExtendedKeyUsage, msPKI-Certificate-Application-Policy, nTSecurityDescriptor

    [pscustomobject]@{ CAs = @($cas); Templates = @($templates); PksDN = $pks }
}

function Get-PKISecurityFindings {
    <#
    .SYNOPSIS
        Flags ESC1, ESC2, ESC4 template patterns and the ESC6 CA flag. Report only.
    #>
    param([Parameter(Mandatory)]$PkiData)

    $published = @($PkiData.CAs | ForEach-Object { $_.certificateTemplates }) | Select-Object -Unique
    $findings = @()

    foreach ($t in $PkiData.Templates) {
        $name    = $t.displayName
        $isPub   = $t.cn -in $published
        $eku     = @($t.pKIExtendedKeyUsage) + @($t.'msPKI-Certificate-Application-Policy') | Where-Object { $_ }
        $authEku = (@($eku).Count -eq 0) -or @($eku | Where-Object { $_ -in $script:FMPAuthEku }).Count -gt 0
        $supplies = ([int]$t.'msPKI-Certificate-Name-Flag' -band 0x1) -eq 0x1
        $approval = ([int]$t.'msPKI-Enrollment-Flag' -band 0x2) -eq 0x2
        $sigs     = [int]$t.'msPKI-RA-Signature'
        $aces     = @($t.nTSecurityDescriptor.Access | Where-Object { $_.AccessControlType -eq 'Allow' })
        $broadEnroll = @($aces | Where-Object {
                "$($_.IdentityReference)" -match $script:FMPBroadPrincipal -and (
                    ("$($_.ActiveDirectoryRights)" -match 'GenericAll') -or
                    (("$($_.ActiveDirectoryRights)" -match 'ExtendedRight') -and
                     ($_.ObjectType -eq $script:FMPEnrollRight -or $_.ObjectType -eq [guid]::Empty)))
            }).Count -gt 0
        $broadWrite = @($aces | Where-Object {
                "$($_.IdentityReference)" -match $script:FMPBroadPrincipal -and
                "$($_.ActiveDirectoryRights)" -match 'GenericAll|GenericWrite|WriteDacl|WriteOwner|WriteProperty'
            }).Count -gt 0

        if ($isPub -and $supplies -and $authEku -and -not $approval -and $sigs -eq 0 -and $broadEnroll) {
            $findings += [pscustomobject]@{ Finding = 'ESC1'; Severity = 'Critical'; Template = $name
                Description = 'Published template lets broad groups enroll, supply the subject, and obtain an authentication certificate without approval.'
                Remediation = 'Turn off Supply in the request, remove authentication EKUs, restrict enrollment, require manager approval, or unpublish.' }
        }
        $anyOrNone = (@($eku).Count -eq 0) -or ('2.5.29.37.0' -in $eku)
        if ($isPub -and $anyOrNone -and $broadEnroll) {
            $findings += [pscustomobject]@{ Finding = 'ESC2'; Severity = 'High'; Template = $name
                Description = 'Published template with Any Purpose or no EKU is enrollable by broad groups.'
                Remediation = 'Restrict the EKUs to the intended purposes or restrict enrollment.' }
        }
        if ($broadWrite) {
            $findings += [pscustomobject]@{ Finding = 'ESC4'; Severity = 'Critical'; Template = $name
                Description = 'Template ACL grants write or control rights to broad groups.'
                Remediation = 'Remove the entries; limit template write rights to PKI administrators.' }
        }
    }

    foreach ($ca in $PkiData.CAs) {
        $config = "$($ca.dNSHostName)\$($ca.cn)"
        $out = & certutil.exe -config $config -getreg 'policy\EditFlags' 2>&1 | Out-String
        if ($LASTEXITCODE -ne 0) {
            $findings += [pscustomobject]@{ Finding = 'CA-UNREADABLE'; Severity = 'Info'; Template = "N/A ($config)"
                Description = 'Could not read policy EditFlags.'; Remediation = 'Check RPC reachability and rights on the CA.' }
        } elseif ($out -match 'EDITF_ATTRIBUTESUBJECTALTNAME2') {
            $findings += [pscustomobject]@{ Finding = 'ESC6'; Severity = 'Critical'; Template = "N/A ($config)"
                Description = 'CA has EDITF_ATTRIBUTESUBJECTALTNAME2 set; requesters can add a SAN to any request.'
                Remediation = 'certutil -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2, then restart the CA service.' }
        }
    }
    $findings
}

function Get-FMPPKIAssessment {
    <#
    .SYNOPSIS
        CA and template inventory, CA certificate details, CDP and AIA objects, and ESC findings.
    .OUTPUTS
        PKIInventory.json, PKISecurityReport.json
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment'
    )
    $pkiPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'PKI'
    $pki = Get-FMPPkiData -Server $Domain

    $caInventory = foreach ($ca in $pki.CAs) {
        $config = "$($ca.dNSHostName)\$($ca.cn)"
        $certFile = Join-Path $pkiPath ("{0}.cer" -f ($ca.cn -replace '[^\w\-]', '_'))
        $cert = $null
        & certutil.exe -config $config -ca.cert $certFile 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $certFile)) {
            $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 -ArgumentList $certFile
        }
        $keySize = $null
        if ($cert) { try { $keySize = $cert.PublicKey.Key.KeySize } catch { $keySize = $null } }
        [pscustomobject]@{
            CAName             = $ca.cn
            DisplayName        = $ca.displayName
            ComputerName       = $ca.dNSHostName
            ConfigString       = $config
            PublishedTemplates = @($ca.certificateTemplates)
            CertSubject        = if ($cert) { $cert.Subject }
            NotBefore          = if ($cert) { $cert.NotBefore.ToString('o') }
            NotAfter           = if ($cert) { $cert.NotAfter.ToString('o') }
            KeySize            = $keySize
            SignatureAlgorithm = if ($cert) { $cert.SignatureAlgorithm.FriendlyName }
        }
    }

    $templates = $pki.Templates | Select-Object @{ N = 'Name'; E = { $_.cn } }, @{ N = 'DisplayName'; E = { $_.displayName } },
        @{ N = 'OID';            E = { $_.'msPKI-Cert-Template-OID' } },
        @{ N = 'SchemaVersion';  E = { $_.'msPKI-Template-Schema-Version' } },
        @{ N = 'NameFlag';       E = { $_.'msPKI-Certificate-Name-Flag' } },
        @{ N = 'EnrollmentFlag'; E = { $_.'msPKI-Enrollment-Flag' } },
        @{ N = 'RASignatures';   E = { $_.'msPKI-RA-Signature' } },
        @{ N = 'EKU';            E = { @($_.pKIExtendedKeyUsage) + @($_.'msPKI-Certificate-Application-Policy') | Where-Object { $_ } } }

    # CRL and AIA publication objects in the directory; HTTP and file locations are in each CA's registry.
    $cdp = Get-ADObject -SearchBase "CN=CDP,$($pki.PksDN)" -Server $Domain -LDAPFilter '(objectClass=cRLDistributionPoint)' |
        Select-Object Name, DistinguishedName
    $aia = Get-ADObject -SearchBase "CN=AIA,$($pki.PksDN)" -Server $Domain -LDAPFilter '(objectClass=certificationAuthority)' |
        Select-Object Name, DistinguishedName

    $inventory = [pscustomobject]@{
        AssessmentTimestamp      = (Get-Date -Format 'o')
        CertificationAuthorities = @($caInventory)
        CertificateTemplates     = @($templates)
        CDPObjects               = @($cdp)
        AIAObjects               = @($aia)
    }
    $findings = @(Get-PKISecurityFindings -PkiData $pki)

    Write-FMPJson -InputObject $inventory -Path (Join-Path $pkiPath 'PKIInventory.json') -Depth 8
    Write-FMPJson -InputObject $findings  -Path (Join-Path $pkiPath 'PKISecurityReport.json')
    Write-Verbose "PKI assessment written to $pkiPath with $($findings.Count) findings."
}
```

The directory locations are the Public Key Services containers Microsoft documents: Enrollment Services for enterprise CAs, Certificate Templates, AIA and CDP.[^aB-pkicontainers] The `certutil` verbs (`-config`, `-ca.cert`, `-getreg`) are as documented.[^aB-certutil] The ESC4 check above treats any broad write-type right as a finding; the ESC1 and ESC2 checks require the template to be published by at least one CA, because an unpublished template can't be requested.[^aB-mdi-cert] ESC7 (CA ACLs) needs the CA's own security settings and isn't collected here; Defender for Identity assesses it where a sensor is installed on the CA.[^aB-mdi-cert]

### Computers

```powershell
function Get-FMPComputerInventory {
    <#
    .SYNOPSIS
        Computer objects, OS classification, staleness and Kerberos delegation.
    .OUTPUTS
        ComputerInventory.json, ComputersByOS.csv, StaleComputers.csv, DelegationReport.csv
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment',
        [int]$StaleThresholdDays = 90
    )
    $objPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Objects'
    $staleDate = (Get-Date).AddDays(-$StaleThresholdDays)
    $dcNames = @(Get-ADDomainController -Filter * -Server $Domain | ForEach-Object { $_.Name })

    $computers = Get-ADComputer -Filter * -Server $Domain -Properties DNSHostName, OperatingSystem,
        OperatingSystemVersion, Enabled, LastLogonDate, PasswordLastSet, Created, Modified,
        MemberOf, IPv4Address, ServicePrincipalName, TrustedForDelegation, TrustedToAuthForDelegation,
        'msDS-AllowedToDelegateTo', PrincipalsAllowedToDelegateToAccount, 'msDS-SupportedEncryptionTypes', Description |
        Select-Object Name, DNSHostName, OperatingSystem, OperatingSystemVersion, Enabled,
            LastLogonDate, PasswordLastSet, Created, Modified, DistinguishedName, IPv4Address, Description,
            @{ N = 'SID';                      E = { "$($_.SID)" } },
            @{ N = 'IsDomainController';       E = { $_.Name -in $dcNames } },
            @{ N = 'MemberOfCount';            E = { @($_.MemberOf).Count } },
            @{ N = 'SPNs';                     E = { @($_.ServicePrincipalName) } },
            TrustedForDelegation, TrustedToAuthForDelegation,
            @{ N = 'AllowedToDelegateTo';      E = { @($_.'msDS-AllowedToDelegateTo') } },
            @{ N = 'RBCDPrincipals';           E = { @($_.PrincipalsAllowedToDelegateToAccount) } },
            @{ N = 'SupportedEncryptionTypes'; E = { $_.'msDS-SupportedEncryptionTypes' } }

    Write-FMPJson -InputObject @($computers) -Path (Join-Path $objPath 'ComputerInventory.json')

    $computers | Group-Object OperatingSystem | Select-Object @{ N = 'OperatingSystem'; E = { $_.Name } }, Count,
        @{ N = 'EnabledCount';  E = { @($_.Group | Where-Object Enabled).Count } },
        @{ N = 'DisabledCount'; E = { @($_.Group | Where-Object { -not $_.Enabled }).Count } } |
        Sort-Object Count -Descending |
        Export-Csv -Path (Join-Path $objPath 'ComputersByOS.csv') -NoTypeInformation -Encoding UTF8

    # Stale only when both lastLogonTimestamp and the machine password are old.
    $computers | Where-Object {
            ((-not $_.LastLogonDate) -or $_.LastLogonDate -lt $staleDate) -and
            ((-not $_.PasswordLastSet) -or $_.PasswordLastSet -lt $staleDate)
        } | Select-Object Name, DNSHostName, OperatingSystem, Enabled, LastLogonDate, PasswordLastSet, DistinguishedName,
            @{ N = 'DaysSinceLogon'; E = { if ($_.LastLogonDate) { ((Get-Date) - $_.LastLogonDate).Days } else { 'Never' } } } |
        Export-Csv -Path (Join-Path $objPath 'StaleComputers.csv') -NoTypeInformation -Encoding UTF8

    $computers | Where-Object {
            $_.TrustedForDelegation -or @($_.AllowedToDelegateTo).Count -gt 0 -or @($_.RBCDPrincipals).Count -gt 0
        } | Select-Object Name, DNSHostName, OperatingSystem, IsDomainController,
            @{ N = 'DelegationType'; E = {
                if ($_.TrustedForDelegation) { 'Unconstrained' }
                elseif (@($_.AllowedToDelegateTo).Count -gt 0 -and $_.TrustedToAuthForDelegation) { 'Constrained (protocol transition)' }
                elseif (@($_.AllowedToDelegateTo).Count -gt 0) { 'Constrained (Kerberos only)' }
                else { 'Resource-based (inbound)' } } },
            @{ N = 'DelegationTargets'; E = { @($_.AllowedToDelegateTo) -join '; ' } },
            @{ N = 'RBCDPrincipals';    E = { @($_.RBCDPrincipals) -join '; ' } },
            DistinguishedName |
        Export-Csv -Path (Join-Path $objPath 'DelegationReport.csv') -NoTypeInformation -Encoding UTF8

    Write-Verbose "Computer inventory: $(@($computers).Count) objects."
}
```

`PrincipalsAllowedToDelegateToAccount` is the ActiveDirectory module's name for the resource-based delegation attribute, `msDS-AllowedToActOnBehalfOfOtherIdentity`.[^aB-kcd] Domain controllers carry `TrustedForDelegation` by design, so `IsDomainController` lets the finding step exclude them.

### Users, groups and service accounts

```powershell
$script:FMPPrivilegedGroups = 'Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Administrators',
                              'Account Operators', 'Server Operators', 'Backup Operators', 'Print Operators'

function Find-CircularGroupNesting {
    # Groups that are members of themselves through nesting.
    param([Parameter(Mandatory)][string]$Server)
    $groups = @(Get-ADGroup -Filter * -Server $Server -Properties MemberOf)
    $parents = @{}
    foreach ($g in $groups) { $parents[$g.DistinguishedName] = @($g.MemberOf) }

    foreach ($g in $groups) {
        $start = $g.DistinguishedName
        $seen  = @{}
        $queue = New-Object System.Collections.Queue
        foreach ($p in $parents[$start]) { $queue.Enqueue($p) }
        while ($queue.Count -gt 0) {
            $current = $queue.Dequeue()
            if ($current -eq $start) {
                [pscustomobject]@{ Group = $g.SamAccountName; DN = $start }
                break
            }
            if ($seen.ContainsKey($current)) { continue }
            $seen[$current] = $true
            if ($parents.ContainsKey($current)) {
                foreach ($p in $parents[$current]) { $queue.Enqueue($p) }
            }
        }
    }
}

function Get-FMPUserInventory {
    <#
    .SYNOPSIS
        Users, privileged membership, AdminSDHolder-protected and orphaned accounts, and service accounts.
    .OUTPUTS
        UserInventory.json, PrivilegedUsers.csv, AdminCountReport.csv, ServiceAccounts.csv,
        ServiceAccounts\MSAInventory.json, ServiceAccounts\gMSAInventory.json
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment',
        [int]$StaleThresholdDays = 90
    )
    $objPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Objects'
    $saPath  = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'ServiceAccounts'
    $staleDate = (Get-Date).AddDays(-$StaleThresholdDays)

    $users = Get-ADUser -Filter * -Server $Domain -Properties UserPrincipalName, DisplayName, Enabled,
        LastLogonDate, PasswordLastSet, PasswordNeverExpires, PasswordExpired, LockedOut, AccountExpirationDate,
        MemberOf, AdminCount, TrustedForDelegation, ServicePrincipalName, Created, Modified, Description, Department, Title |
        Select-Object SamAccountName, UserPrincipalName, DisplayName, Enabled, LastLogonDate, PasswordLastSet,
            PasswordNeverExpires, PasswordExpired, LockedOut, AccountExpirationDate, AdminCount, TrustedForDelegation,
            Created, Modified, DistinguishedName, Description, Department, Title,
            @{ N = 'SID';           E = { "$($_.SID)" } },
            @{ N = 'IsStale';       E = { (-not $_.LastLogonDate) -or $_.LastLogonDate -lt $staleDate } },
            @{ N = 'MemberOfCount'; E = { @($_.MemberOf).Count } },
            @{ N = 'MemberOf';      E = { @($_.MemberOf) } },
            @{ N = 'SPNs';          E = { @($_.ServicePrincipalName) } }
    Write-FMPJson -InputObject @($users) -Path (Join-Path $objPath 'UserInventory.json')

    # Recursive membership of each privileged group.
    $privileged = @{}
    $privRows = foreach ($groupName in $script:FMPPrivilegedGroups) {
        try {
            Get-ADGroupMember -Identity $groupName -Recursive -Server $Domain -ErrorAction Stop |
                Where-Object objectClass -eq 'user' | ForEach-Object {
                    $privileged["$($_.SID)"] = $true
                    $u = Get-ADUser -Identity $_.SID -Server $Domain -Properties LastLogonDate, PasswordLastSet, Enabled, AdminCount
                    [pscustomobject]@{
                        PrivilegedGroup = $groupName
                        SamAccountName  = $u.SamAccountName
                        Enabled         = $u.Enabled
                        LastLogonDate   = $u.LastLogonDate
                        PasswordLastSet = $u.PasswordLastSet
                        AdminCount      = $u.AdminCount
                    }
                }
        } catch {
            Write-Warning "Unable to enumerate ${groupName}: $($_.Exception.Message)"
        }
    }
    $privRows | Export-Csv -Path (Join-Path $objPath 'PrivilegedUsers.csv') -NoTypeInformation -Encoding UTF8

    # adminCount=1 but no longer in any protected group (recursively) = orphaned.
    $users | Where-Object { $_.AdminCount -eq 1 } | Select-Object SamAccountName, Enabled, LastLogonDate,
            @{ N = 'InPrivilegedGroup';  E = { $privileged.ContainsKey($_.SID) } },
            @{ N = 'OrphanedAdminCount'; E = { -not $privileged.ContainsKey($_.SID) } } |
        Export-Csv -Path (Join-Path $objPath 'AdminCountReport.csv') -NoTypeInformation -Encoding UTF8

    $managed = @(Get-ADServiceAccount -Filter * -Server $Domain -Properties Enabled, Created, PasswordLastSet, ServicePrincipalName |
        Select-Object SamAccountName, Enabled, Created, PasswordLastSet, DistinguishedName,
            @{ N = 'ObjectClass'; E = { $_.ObjectClass } },
            @{ N = 'SPNs';        E = { @($_.ServicePrincipalName) } })
    Write-FMPJson -InputObject @($managed | Where-Object ObjectClass -eq 'msDS-ManagedServiceAccount')      -Path (Join-Path $saPath 'MSAInventory.json')
    Write-FMPJson -InputObject @($managed | Where-Object ObjectClass -eq 'msDS-GroupManagedServiceAccount') -Path (Join-Path $saPath 'gMSAInventory.json')

    $service = @()
    $service += $users | Where-Object { @($_.SPNs).Count -gt 0 } |
        Select-Object SamAccountName, Enabled, PasswordNeverExpires, LastLogonDate,
            @{ N = 'Type'; E = { 'User with SPN' } }, @{ N = 'SPNs'; E = { $_.SPNs -join '; ' } }
    $service += $managed | Select-Object SamAccountName, Enabled,
            @{ N = 'PasswordNeverExpires'; E = { $null } }, @{ N = 'LastLogonDate'; E = { $null } },
            @{ N = 'Type'; E = { $_.ObjectClass } }, @{ N = 'SPNs'; E = { $_.SPNs -join '; ' } }
    $service | Export-Csv -Path (Join-Path $objPath 'ServiceAccounts.csv') -NoTypeInformation -Encoding UTF8

    Write-Verbose "User inventory: $(@($users).Count) users, $(@($privRows).Count) privileged memberships."
}

function Get-FMPGroupInventory {
    <#
    .SYNOPSIS
        Groups with category, scope, member counts, empty flag and circular nesting.
    .OUTPUTS
        GroupInventory.json, CircularGroups.json
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment'
    )
    $objPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Objects'
    $groups = Get-ADGroup -Filter * -Server $Domain -Properties DisplayName, Description, Members, MemberOf,
        ManagedBy, Created, Modified, AdminCount |
        Select-Object SamAccountName, DisplayName, Description,
            @{ N = 'Category'; E = { "$($_.GroupCategory)" } },
            @{ N = 'Scope';    E = { "$($_.GroupScope)" } },
            ManagedBy, Created, Modified, DistinguishedName, AdminCount,
            @{ N = 'SID';               E = { "$($_.SID)" } },
            @{ N = 'DirectMemberCount'; E = { @($_.Members).Count } },
            @{ N = 'IsEmpty';           E = { @($_.Members).Count -eq 0 } },
            @{ N = 'CountMayBeCapped';  E = { @($_.Members).Count -ge 5000 } }
    Write-FMPJson -InputObject @($groups) -Path (Join-Path $objPath 'GroupInventory.json')
    Write-FMPJson -InputObject @(Find-CircularGroupNesting -Server $Domain) -Path (Join-Path $objPath 'CircularGroups.json')
    Write-Verbose "Group inventory: $(@($groups).Count) groups."
}
```

The privileged group list is Microsoft's list of on-premises groups whose members are privileged.[^aB-privlevels] SDProp doesn't clear `adminCount` when an account leaves a protected group, which is what the orphan report finds.[^aB-reducing] `CountMayBeCapped` marks groups at the 5,000-value LDAP response limit, whose direct count should be checked another way.[^aB-maxval] The `ObjectClass` filters for the MSA and gMSA files use the schema class names, such as `msDS-GroupManagedServiceAccount` for a gMSA;[^aB-gmsaclass] a dMSA on a Windows Server 2025 domain appears in `ServiceAccounts.csv` with its own class name.[^aB-dmsa]

### Trusts

```powershell
$script:FMPTrustBits = [ordered]@{
    0x1  = 'NonTransitive'
    0x2  = 'UplevelOnly'
    0x4  = 'QuarantinedDomain'
    0x8  = 'ForestTransitive'
    0x10 = 'CrossOrganization'
    0x20 = 'WithinForest'
    0x40 = 'TreatAsExternal'
    0x80 = 'UsesRC4Encryption'
    0x100 = 'UsesAESKeys'
    0x200 = 'CrossOrganizationNoTGTDelegation'
    0x400 = 'PIMTrust'
    0x800 = 'CrossOrganizationEnableTGTDelegation'
}

function Get-FMPTrustMap {
    <#
    .SYNOPSIS
        Trusts with decoded attributes, access direction and posture. Enumeration only.
    .OUTPUTS
        TrustMap.json
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment'
    )
    $trustPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Trusts'
    $trusts = foreach ($t in Get-ADTrust -Filter * -Server $Domain -Properties *) {
        $attr = [int]$t.TrustAttributes
        $decoded = @($script:FMPTrustBits.Keys | Where-Object { $attr -band $_ } | ForEach-Object { $script:FMPTrustBits[$_] })
        $direction = "$($t.Direction)"
        [pscustomobject]@{
            Name                    = $t.Name
            Source                  = $t.Source
            Target                  = $t.Target
            Direction               = $direction
            TrustType               = "$($t.TrustType)"
            TrustAttributesRaw      = $attr
            TrustAttributes         = $decoded
            IntraForest             = $t.IntraForest
            ForestTransitive        = $t.ForestTransitive
            SelectiveAuthentication = $t.SelectiveAuthentication
            SIDFilteringQuarantined = $t.SIDFilteringQuarantined
            SIDFilteringForestAware = $t.SIDFilteringForestAware
            # Members of the trusted domain reach resources in the trusting domain.
            Access = switch ($direction) {
                'Inbound'       { "Users in $Domain can reach resources in $($t.Name)" }
                'Outbound'      { "Users in $($t.Name) can reach resources in $Domain" }
                'BiDirectional' { 'Users in each domain can reach resources in the other' }
                default         { 'Disabled' }
            }
            Posture = if ($t.IntraForest) { 'Intra-forest' }
                      elseif ($t.SelectiveAuthentication) { 'Hardened' }
                      elseif ($t.SIDFilteringQuarantined -or ($attr -band 0x8)) { 'Standard' }
                      else { 'Review required' }
            Created  = $t.Created
            Modified = $t.Modified
        }
    }
    $map = [pscustomobject]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        Domain              = $Domain
        TrustCount          = @($trusts).Count
        Trusts              = @($trusts)
    }
    Write-FMPJson -InputObject $map -Path (Join-Path $trustPath 'TrustMap.json') -Depth 6
    $map
}

function Test-FMPTrust {
    <#
    .SYNOPSIS
        Verifies each outbound trust's secure channel with netdom. Run separately, elevated.
    #>
    [CmdletBinding()]
    param([string]$Domain = (Get-ADDomain).DNSRoot)
    foreach ($t in Get-ADTrust -Filter * -Server $Domain) {
        $out = & netdom.exe trust $Domain "/domain:$($t.Name)" /verify 2>&1 | Out-String
        [pscustomobject]@{
            TrustPartner = $t.Name
            Direction    = "$($t.Direction)"
            Status       = if ($LASTEXITCODE -eq 0) { 'Verified' } else { 'Failed' }
            Output       = $out.Trim()
        }
    }
}
```

The bit values are from the Active Directory technical specification.[^aB-trustattrs] `netdom trust <trusting> /domain:<trusted> /verify` verifies the secure channel secrets for one trust; Microsoft notes that accurate verification needs domain administrator credentials.[^aB-netdom]

### Orchestrator and manifest

```powershell
function Invoke-FMPADAssessment {
    <#
    .SYNOPSIS
        Runs every collector and writes AssessmentManifest.json with a SHA-256 hash per file.
    .EXAMPLE
        Invoke-FMPADAssessment -Domain 'contoso.com' -OutputPath 'D:\FMP\Assessment' -StaleThresholdDays 90
    #>
    [CmdletBinding()]
    param(
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string]$OutputPath = 'D:\FMP\Assessment',
        [int]$StaleThresholdDays = 90,
        [switch]$SkipGpoBackup
    )
    $start = Get-Date
    Write-Host "FMP Active Directory assessment: $Domain, started $($start.ToString('o'))"

    $steps = @(
        @{ Name = 'Forest topology';      Run = { Get-FMPForestTopology   -Domain $Domain -OutputPath $OutputPath | Out-Null } }
        @{ Name = 'OU hierarchy';         Run = { Get-FMPOUHierarchy      -Domain $Domain -OutputPath $OutputPath } }
        @{ Name = 'Group Policy';         Run = { Get-FMPGPOInventory     -Domain $Domain -OutputPath $OutputPath -SkipBackup:$SkipGpoBackup } }
        @{ Name = 'DNS';                  Run = { Get-FMPDNSAssessment    -Domain $Domain -OutputPath $OutputPath -StaleThresholdDays $StaleThresholdDays } }
        @{ Name = 'Certificate Services'; Run = { Get-FMPPKIAssessment    -Domain $Domain -OutputPath $OutputPath } }
        @{ Name = 'Computers';            Run = { Get-FMPComputerInventory -Domain $Domain -OutputPath $OutputPath -StaleThresholdDays $StaleThresholdDays } }
        @{ Name = 'Users and groups';     Run = { Get-FMPUserInventory    -Domain $Domain -OutputPath $OutputPath -StaleThresholdDays $StaleThresholdDays
                                                  Get-FMPGroupInventory   -Domain $Domain -OutputPath $OutputPath } }
        @{ Name = 'Trusts';               Run = { Get-FMPTrustMap         -Domain $Domain -OutputPath $OutputPath | Out-Null } }
    )
    $stepResults = @()
    $i = 0
    foreach ($s in $steps) {
        $i++
        Write-Host ("[{0}/{1}] {2}" -f $i, $steps.Count, $s.Name)
        try {
            & $s.Run
            $stepResults += [pscustomobject]@{ Step = $s.Name; Status = 'Completed'; Error = $null }
        } catch {
            Write-Warning "$($s.Name) failed: $($_.Exception.Message)"
            $stepResults += [pscustomobject]@{ Step = $s.Name; Status = 'Failed'; Error = $_.Exception.Message }
        }
    }

    $end      = Get-Date
    $basePath = Join-Path $OutputPath $Domain
    $files = Get-ChildItem -Path $basePath -Recurse -File |
        Where-Object { $_.Name -ne 'AssessmentManifest.json' } | ForEach-Object {
            [pscustomobject]@{
                RelativePath = $_.FullName.Substring($basePath.Length).TrimStart('\')
                SizeBytes    = $_.Length
                LastModified = $_.LastWriteTime.ToString('o')
                SHA256       = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
            }
        }

    $manifest = [pscustomobject]@{
        AssessmentId       = [guid]::NewGuid().ToString()
        Domain             = $Domain
        StartTime          = $start.ToString('o')
        EndTime            = $end.ToString('o')
        DurationMinutes    = [math]::Round(($end - $start).TotalMinutes, 2)
        ExecutedBy         = "$env:USERDOMAIN\$env:USERNAME"
        ComputerName       = $env:COMPUTERNAME
        StaleThresholdDays = $StaleThresholdDays
        Steps              = $stepResults
        FileCount          = @($files).Count
        Files              = @($files)
    }
    Write-FMPJson -InputObject $manifest -Path (Join-Path $basePath 'AssessmentManifest.json') -Depth 5
    Write-Host ("Assessment complete: {0} files in {1} minutes. Output: {2}" -f $manifest.FileCount, $manifest.DurationMinutes, $basePath)
    $manifest
}
```

A failed step is recorded in the manifest rather than stopping the run, so a partial run is visible as partial.

### Drift comparison

```powershell
function Compare-FMPAssessments {
    <#
    .SYNOPSIS
        Compares two assessment runs: file hashes, then added and removed objects by stable key.
    .EXAMPLE
        Compare-FMPAssessments -BaselinePath 'E:\Repo\assessments\contoso.com\20261013-020000' `
                               -CurrentPath  'E:\Repo\assessments\contoso.com\20261020-020000'
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$BaselinePath,
        [Parameter(Mandatory)][string]$CurrentPath
    )
    $keyed = [ordered]@{
        'Objects\ComputerInventory.json' = 'SID'
        'Objects\UserInventory.json'     = 'SID'
        'Objects\GroupInventory.json'    = 'SID'
        'GPOs\GPOInventory.json'         = 'Id'
    }
    $hashOnly = 'Forest\ForestTopology.json', 'Trusts\TrustMap.json', 'PKI\PKISecurityReport.json'

    $drift = @()
    foreach ($file in @($keyed.Keys) + $hashOnly) {
        $b = Join-Path $BaselinePath $file
        $c = Join-Path $CurrentPath $file
        if (-not (Test-Path $b) -or -not (Test-Path $c)) {
            $drift += [pscustomobject]@{ File = $file; Status = 'Missing in one run'; Added = $null; Removed = $null }
            continue
        }
        if ((Get-FileHash $b -Algorithm SHA256).Hash -eq (Get-FileHash $c -Algorithm SHA256).Hash) { continue }

        if ($keyed.Contains($file)) {
            $key = $keyed[$file]
            $bKeys = @((Get-Content $b -Raw | ConvertFrom-Json) | ForEach-Object { $_.$key })
            $cKeys = @((Get-Content $c -Raw | ConvertFrom-Json) | ForEach-Object { $_.$key })
            $drift += [pscustomobject]@{
                File    = $file
                Status  = 'Changed'
                Added   = @($cKeys | Where-Object { $_ -notin $bKeys })
                Removed = @($bKeys | Where-Object { $_ -notin $cKeys })
            }
        } else {
            # Files with an embedded timestamp always differ by hash; review their content.
            $drift += [pscustomobject]@{ File = $file; Status = 'Changed (review content)'; Added = $null; Removed = $null }
        }
    }
    $drift
}
```

For large inventories, replace the `-notin` comparisons with hash sets; the version above favors readability.

### Gitea integration

```powershell
function Get-FMPGiteaHeaders {
    # The token comes from the Windows credential store or a vault; never from a text file.
    param([Parameter(Mandatory)][securestring]$Token)
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token))
    @{ Authorization = "token $plain"; 'Content-Type' = 'application/json' }
}

function Push-FMPAssessmentToGitea {
    <#
    .SYNOPSIS
        Commits a whole run, manifest included, as one commit on a new branch.
    .EXAMPLE
        Push-FMPAssessmentToGitea -BaseUrl 'https://gitea.example.internal/api/v1' -Owner 'fmp' -Repo 'fmp' `
            -Token $token -RunPath 'D:\FMP\Assessment\contoso.com' -Domain 'contoso.com'
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$BaseUrl,
        [Parameter(Mandatory)][string]$Owner,
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][securestring]$Token,
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][string]$Domain,
        [string]$BaseBranch = 'main'
    )
    $headers   = Get-FMPGiteaHeaders -Token $Token
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $prefix    = "assessments/$Domain/$timestamp"
    $branch    = "assessment/$Domain/$timestamp"

    # Every path is new under a timestamped folder, so each operation is a create.
    $files = Get-ChildItem -Path $RunPath -Recurse -File | ForEach-Object {
        @{
            operation = 'create'
            path      = "$prefix/" + ($_.FullName.Substring($RunPath.Length).TrimStart('\') -replace '\\', '/')
            content   = [Convert]::ToBase64String([IO.File]::ReadAllBytes($_.FullName))
        }
    }
    $body = @{
        branch     = $BaseBranch
        new_branch = $branch
        message    = "Assessment: $Domain @ $timestamp"
        files      = @($files)
    } | ConvertTo-Json -Depth 5

    Invoke-RestMethod -Uri "$BaseUrl/repos/$Owner/$Repo/contents" -Method Post -Headers $headers -Body $body
}

function New-FMPSecurityIssue {
    <#
    .SYNOPSIS
        Creates an issue for a critical finding. Label names are resolved to IDs first.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$BaseUrl,
        [Parameter(Mandatory)][string]$Owner,
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][securestring]$Token,
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$Body,
        [string[]]$Labels = @('security')
    )
    $headers = Get-FMPGiteaHeaders -Token $Token
    $all = Invoke-RestMethod -Uri "$BaseUrl/repos/$Owner/$Repo/labels" -Method Get -Headers $headers
    $ids = @($all | Where-Object { $_.name -in $Labels } | ForEach-Object { [int64]$_.id })
    $missing = @($Labels | Where-Object { $_ -notin $all.name })
    if ($missing) { Write-Warning "Labels not found in ${Repo}: $($missing -join ', ')" }

    $payload = @{ title = $Title; body = $Body; labels = $ids } | ConvertTo-Json -Depth 3
    $resp = Invoke-RestMethod -Uri "$BaseUrl/repos/$Owner/$Repo/issues" -Method Post -Headers $headers -Body $payload
    Write-Host "Issue created: $($resp.html_url)"
    $resp
}

function Invoke-FMPFindingIssues {
    <#
    .SYNOPSIS
        Raises issues for critical PKI findings and non-DC unconstrained delegation.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$BaseUrl,
        [Parameter(Mandatory)][string]$Owner,
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][securestring]$Token,
        [Parameter(Mandatory)][string]$RunPath
    )
    $common = @{ BaseUrl = $BaseUrl; Owner = $Owner; Repo = $Repo; Token = $Token }

    $pkiReport = Join-Path $RunPath 'PKI\PKISecurityReport.json'
    if (Test-Path $pkiReport) {
        foreach ($f in @(Get-Content $pkiReport -Raw | ConvertFrom-Json) | Where-Object Severity -eq 'Critical') {
            New-FMPSecurityIssue @common -Title "$($f.Finding): $($f.Template)" `
                -Body ("**Severity:** {0}`n`n{1}`n`n**Remediation:** {2}" -f $f.Severity, $f.Description, $f.Remediation) `
                -Labels @('security', 'critical', 'pki') | Out-Null
        }
    }

    $delegation = Join-Path $RunPath 'Objects\DelegationReport.csv'
    if (Test-Path $delegation) {
        $hits = @(Import-Csv $delegation | Where-Object { $_.DelegationType -eq 'Unconstrained' -and $_.IsDomainController -ne 'True' })
        if ($hits.Count -gt 0) {
            $lines = $hits | ForEach-Object { "- ``$($_.Name)`` ($($_.OperatingSystem))" }
            New-FMPSecurityIssue @common -Title "Unconstrained delegation: $($hits.Count) non-DC computer(s)" `
                -Body ("The following computers are trusted for unconstrained delegation:`n`n" + ($lines -join "`n")) `
                -Labels @('security', 'critical', 'delegation') | Out-Null
        }
    }
}

Export-ModuleMember -Function @(
    'Test-FMPPrerequisites', 'Get-FMPForestTopology', 'Get-FMPOUHierarchy', 'Get-FMPGPOInventory',
    'Export-FMPGPOSettings', 'Get-FMPDNSAssessment', 'Get-FMPPKIAssessment', 'Get-FMPComputerInventory',
    'Get-FMPUserInventory', 'Get-FMPGroupInventory', 'Get-FMPTrustMap', 'Test-FMPTrust',
    'Invoke-FMPADAssessment', 'Compare-FMPAssessments', 'Push-FMPAssessmentToGitea',
    'New-FMPSecurityIssue', 'Invoke-FMPFindingIssues'
)
```

The endpoints and fields are from Gitea's API specification: the multi-file `POST /repos/{owner}/{repo}/contents` with `branch`, `new_branch`, `message` and a `files` list whose `content` is base64; label IDs from `GET /repos/{owner}/{repo}/labels`; and `labels` on a new issue as a list of IDs.[^aB-gitea] The `Authorization: token` header form is Gitea's documented API token format.[^aB-gitea-usage] A very large run may exceed your instance's request size limit; if it does, commit in batches to the same branch.

### Optional: webhook and schedule

Create the webhook once, not per run. The webhook `type` for a generic JSON receiver is `gitea`; `config` needs `url` and `content_type`.[^aB-gitea]

```powershell
$hook = @{
    type          = 'gitea'
    active        = $true
    events        = @('push')
    branch_filter = 'assessment/*'
    config        = @{
        url          = 'https://automation.example.internal/api/webhook/assessment'
        content_type = 'json'
        secret       = '<shared secret held by the receiver>'
    }
} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri "$BaseUrl/repos/fmp/fmp/hooks" -Method Post -Headers (Get-FMPGiteaHeaders -Token $token) -Body $hook
```

Schedule the run under the gMSA. Install and test the account on the host first; `Install-ADServiceAccount` caches it and proves the host can retrieve the password.[^aB-msa-assess] `Password` is a documented value of `-LogonType`, and Task Scheduler is one of the services that can run under a gMSA.[^aB-taskprincipal] Pairing the two with the account name ending in `$` is the program's configuration; confirm in a test task that it runs without any stored password before relying on it.

```powershell
Install-ADServiceAccount -Identity 'svc-fmp-assess$'
Test-ADServiceAccount   -Identity 'svc-fmp-assess$'

$action    = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument '-NoProfile -Command "Import-Module FMPADAssessment; Invoke-FMPADAssessment"'
$trigger   = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At '02:00'
$principal = New-ScheduledTaskPrincipal -UserId 'CONTOSO\svc-fmp-assess$' -LogonType Password
Register-ScheduledTask -TaskName 'FMP-AD-Assessment' -Action $action -Trigger $trigger -Principal $principal `
    -Description 'Weekly Federal Modernization Program Active Directory assessment'
```

The source passed `-ExecutionPolicy Bypass`. Sign the module and rely on the host's `AllSigned` or `RemoteSigned` policy instead.

## B.3 Installation

```powershell
# Copy the module to a program-owned path.
$modulePath = 'D:\FMP\Modules\FMPADAssessment'
New-Item -Path $modulePath -ItemType Directory -Force | Out-Null
Copy-Item -Path '.\FMPADAssessment.psm1', '.\FMPADAssessment.psd1' -Destination $modulePath

# Add the parent folder to the machine module path once.
$current = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine')
if ($current -notmatch [regex]::Escape('D:\FMP\Modules')) {
    [Environment]::SetEnvironmentVariable('PSModulePath', "$current;D:\FMP\Modules", 'Machine')
}

# In a new session:
Import-Module FMPADAssessment -Verbose
Get-Command -Module FMPADAssessment
Test-FMPPrerequisites
```

## B.4 Output schema reference

Every file is UTF-8 JSON (or CSV, XML, HTML or text where noted). Timestamps are ISO 8601 with offset. Enumerations are written as strings.

### ForestTopology.json

| Field | Type | Description |
|---|---|---|
| `AssessmentTimestamp` | string (ISO 8601) | When the collector ran |
| `Forest` | object | `Name`, `RootDomain`, `ForestMode`, `SchemaMaster`, `DomainNamingMaster`, `Domains[]`, `Sites[]`, `GlobalCatalogs[]`, `UPNSuffixes[]`, `SPNSuffixes[]` |
| `Domains` | array | `DNSRoot`, `NetBIOSName`, `DomainMode`, `DomainSID`, `PDCEmulator`, `RIDMaster`, `InfrastructureMaster`, `DistinguishedName`, `ParentDomain`, `ChildDomains[]` |
| `DomainControllers` | array | `HostName`, `Domain`, `Site`, `IPv4Address`, `OperatingSystem`, `OperatingSystemVersion`, `IsGlobalCatalog`, `IsReadOnly`, `Enabled`, `OperationMasterRoles[]` |
| `Sites` | array | `Name`, `Description`, `Location`, `Subnets[]` |
| `SiteLinks` | array | `Name`, `Cost`, `ReplicationFrequencyInMinutes`, `Options`, `Description`, `Sites[]` |
| `Subnets` | array | `Name`, `Site`, `Location`, `Description` |
| `FSMORoles` | array | `Role`, `Scope` (`Forest` or `Domain`), `Domain`, `Holder` |

```json
{
  "AssessmentTimestamp": "2026-10-19T02:00:12.0000000-04:00",
  "Forest": {
    "Name": "contoso.com",
    "RootDomain": "contoso.com",
    "ForestMode": "Windows2016Forest",
    "SchemaMaster": "DC01.contoso.com",
    "DomainNamingMaster": "DC01.contoso.com",
    "Domains": ["contoso.com", "child.contoso.com"],
    "Sites": ["Default-First-Site-Name", "BranchOffice"],
    "GlobalCatalogs": ["DC01.contoso.com", "DC02.contoso.com"],
    "UPNSuffixes": ["contoso.gov"],
    "SPNSuffixes": []
  },
  "FSMORoles": [
    { "Role": "SchemaMaster", "Scope": "Forest", "Domain": "contoso.com", "Holder": "DC01.contoso.com" },
    { "Role": "PDCEmulator", "Scope": "Domain", "Domain": "child.contoso.com", "Holder": "CDC01.child.contoso.com" }
  ]
}
```

`ForestMode` and `DomainMode` take the ActiveDirectory module's enumeration names, which now include `Windows2025Forest` and `Windows2025Domain`.[^aB-forestmode][^aB-domainmode]

### GPOInventory.json and related GPO files

| Field | Type | Description |
|---|---|---|
| `DisplayName` | string | GPO display name |
| `Id` | string (GUID) | GPO identifier; also the file name of its XML and HTML reports |
| `GpoStatus` | string | `AllSettingsEnabled`, `UserSettingsDisabled`, `ComputerSettingsDisabled` or `AllSettingsDisabled` |
| `CreationTime`, `ModificationTime` | datetime | Created and last modified |
| `Owner` | string | Owner, typically `DOMAIN\group` |
| `WmiFilterName` | string or null | WMI filter, if any |
| `ComputerEnabled`, `UserEnabled` | boolean | Whether each half is enabled |

`GPOLinks.json` holds `GPOName`, `GPOGUID`, `LinkedTo[]` (domain, OU and site DNs), `SiteLinked`, `TotalLinks` and `IsUnlinked`. `GPOEmpty.json`, `GPOConflicts.json`, `GPOPermissions.json` and `GPOSettingsDecomposed.json` follow the shapes in the functions above. `GPOSettings\<GUID>.xml` is the input to Intune Group Policy analytics.

```json
[
  {
    "DisplayName": "Workstation Baseline",
    "Id": "31b2f340-016d-11d2-945f-00c04fb984f9",
    "GpoStatus": "UserSettingsDisabled",
    "CreationTime": "2019-03-04T10:15:00",
    "ModificationTime": "2026-08-30T16:41:22",
    "Owner": "CONTOSO\\Domain Admins",
    "Description": "",
    "WmiFilterName": null,
    "ComputerEnabled": true,
    "UserEnabled": false
  }
]
```

### PKISecurityReport.json

| Field | Type | Description |
|---|---|---|
| `Finding` | string | `ESC1`, `ESC2`, `ESC4`, `ESC6` or `CA-UNREADABLE` |
| `Severity` | string | `Critical`, `High` or `Info` |
| `Template` | string | Template display name, or `N/A (<CA config string>)` for CA-level findings |
| `Description` | string | What was found |
| `Remediation` | string | The documented fix, for the PKI owner to apply |

```json
[
  {
    "Finding": "ESC1",
    "Severity": "Critical",
    "Template": "Web Server Legacy",
    "Description": "Published template lets broad groups enroll, supply the subject, and obtain an authentication certificate without approval.",
    "Remediation": "Turn off Supply in the request, remove authentication EKUs, restrict enrollment, require manager approval, or unpublish."
  }
]
```

### TrustMap.json

```json
{
  "AssessmentTimestamp": "2026-10-19T02:41:03.0000000-04:00",
  "Domain": "contoso.com",
  "TrustCount": 1,
  "Trusts": [
    {
      "Name": "partner.example",
      "Direction": "Outbound",
      "TrustType": "Uplevel",
      "TrustAttributesRaw": 8,
      "TrustAttributes": ["ForestTransitive"],
      "IntraForest": false,
      "SelectiveAuthentication": false,
      "SIDFilteringQuarantined": false,
      "Access": "Users in partner.example can reach resources in contoso.com",
      "Posture": "Standard"
    }
  ]
}
```

### AssessmentManifest.json

| Field | Type | Description |
|---|---|---|
| `AssessmentId` | string (GUID) | Unique identifier for the run |
| `Domain` | string | DNS name of the assessed domain |
| `StartTime`, `EndTime` | string (ISO 8601) | Execution window |
| `DurationMinutes` | number | Total duration |
| `ExecutedBy`, `ComputerName` | string | Account and host |
| `StaleThresholdDays` | integer | Threshold used by the run |
| `Steps` | array | `Step`, `Status` (`Completed` or `Failed`), `Error` |
| `FileCount` | integer | Number of files hashed |
| `Files` | array | `RelativePath`, `SizeBytes`, `LastModified`, `SHA256` |

```json
{
  "AssessmentId": "6f0c5a1e-9b8d-4e33-a2f1-0d7c3b9e4a12",
  "Domain": "contoso.com",
  "StartTime": "2026-10-19T02:00:00.0000000-04:00",
  "EndTime": "2026-10-19T02:47:31.0000000-04:00",
  "DurationMinutes": 47.52,
  "ExecutedBy": "CONTOSO\\svc-fmp-assess$",
  "ComputerName": "FMP-ASSESS01",
  "StaleThresholdDays": 90,
  "Steps": [
    { "Step": "Forest topology", "Status": "Completed", "Error": null },
    { "Step": "Certificate Services", "Status": "Failed", "Error": "The RPC server is unavailable." }
  ],
  "FileCount": 412,
  "Files": [
    {
      "RelativePath": "Forest\\ForestTopology.json",
      "SizeBytes": 48211,
      "LastModified": "2026-10-19T02:01:09.0000000-04:00",
      "SHA256": "<64 hexadecimal characters>"
    }
  ]
}
```

### Other files

| File | Root | Primary contents |
|---|---|---|
| `OUHierarchy.json` | Array of nodes | `Name`, `DistinguishedName`, `Description`, `ManagedBy`, `LinkedGPOs[]`, `Depth`, `ObjectCounts`, `Children[]` |
| `OUDelegations.json` | Array | `OU`, `DN`, `Delegations[]` (non-inherited ACEs) |
| `DNSInventory.json` | Object | `AssessmentTimestamp`, `DnsServer`, `Zones[]`, `ConditionalForwarders[]`, `StubZones[]`, `Forwarders`, `Scavenging`, `DNSSEC[]` |
| `DNSHealthReport.json` | Object | `ZonesByServer[]`, `SRVChecks[]`, `StaleThresholdDays` |
| `PKIInventory.json` | Object | `CertificationAuthorities[]`, `CertificateTemplates[]`, `CDPObjects[]`, `AIAObjects[]` |
| `ComputerInventory.json` | Array | `Name`, `DNSHostName`, `OperatingSystem`, `Enabled`, `LastLogonDate`, `SPNs[]`, delegation fields, `IsDomainController` |
| `UserInventory.json` | Array | `SamAccountName`, `UserPrincipalName`, `Enabled`, `LastLogonDate`, `AdminCount`, `IsStale`, `MemberOf[]`, `SPNs[]` |
| `GroupInventory.json` | Array | `SamAccountName`, `Category`, `Scope`, `DirectMemberCount`, `IsEmpty`, `CountMayBeCapped` |
| `*.csv` | CSV | Flat views for review: `OUFlatList`, `ComputersByOS`, `StaleComputers`, `DelegationReport`, `PrivilegedUsers`, `AdminCountReport`, `ServiceAccounts` |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Federal Requirements Crosswalk](appendix-a-federal-requirements-crosswalk.md) · [Book index](index.md) · [Next: Appendix C — Identity Assessment Module →](appendix-c-identity-assessment-module.md)
:::

[^aB-pspki]: PKI Solutions, "PowerShell PKI (PSPKI) Module," <https://www.pkisolutions.com/tools/pspki/> (accessed Oct 20, 2026).
[^aB-pspki-gallery]: PowerShell Gallery, "PSPKI 4.4.1," function list, <https://www.powershellgallery.com/packages/PSPKI> (accessed Oct 20, 2026).
[^aB-admodule]: Microsoft Learn, "ActiveDirectory Module," cmdlet index, <https://learn.microsoft.com/powershell/module/activedirectory/?view=windowsserver2025-ps> (accessed Oct 20, 2026).
[^aB-gitea]: Gitea, API specification (OpenAPI 2.0), <https://gitea.com/swagger.v1.json> (accessed Oct 20, 2026). Confirm field names against `/api/swagger` on your own instance; they vary by Gitea version.
[^aB-gitea-usage]: Gitea, "API Usage," <https://docs.gitea.com/development/api-usage> (accessed Oct 20, 2026).
[^aB-gppermission]: Microsoft Learn, "Get-GPPermission," <https://learn.microsoft.com/powershell/module/grouppolicy/get-gppermission?view=windowsserver2025-ps> (accessed Oct 20, 2026).
[^aB-dnssec]: Microsoft Learn, "Get-DnsServerDnsSecZoneSetting," <https://learn.microsoft.com/powershell/module/dnsserver/get-dnsserverdnsseczonesetting?view=windowsserver2025-ps> (accessed Oct 20, 2026).
[^aB-scavenging]: Microsoft Learn, "Configure DNS aging and scavenging," <https://learn.microsoft.com/windows-server/networking/dns/configure-aging-scavenging> (accessed Oct 20, 2026).
[^aB-mdi-cert]: Microsoft Learn, "Security assessment: Certificates," Microsoft Defender for Identity, <https://learn.microsoft.com/defender-for-identity/security-posture-assessments/certificates> (accessed Oct 20, 2026).
[^aB-nameflag]: Microsoft Learn, "X509CertificateTemplateSubjectNameFlag enumeration (certenroll.h)," <https://learn.microsoft.com/windows/win32/api/certenroll/ne-certenroll-x509certificatetemplatesubjectnameflag> (accessed Oct 20, 2026).
[^aB-enrollflag]: Microsoft Learn, "X509CertificateTemplateEnrollmentFlag enumeration (certenroll.h)," <https://learn.microsoft.com/windows/win32/api/certenroll/ne-certenroll-x509certificatetemplateenrollmentflag> (accessed Oct 20, 2026).
[^aB-enroll]: Microsoft Learn, "Certificate-Enrollment extended right," <https://learn.microsoft.com/windows/win32/adschema/r-certificate-enrollment> (accessed Oct 20, 2026).
[^aB-scl-oids]: Microsoft Learn, "Guidelines for enabling smart card logon with third-party certification authorities," <https://learn.microsoft.com/troubleshoot/windows-server/certificates-and-public-key-infrastructure-pki/enabling-smart-card-logon-third-party-certification-authorities> (accessed Oct 20, 2026).
[^aB-rfc4556]: Internet Engineering Task Force, RFC 4556, *Public Key Cryptography for Initial Authentication in Kerberos (PKINIT)*, June 2006, <https://www.rfc-editor.org/rfc/rfc4556> (accessed Oct 20, 2026).
[^aB-rfc5280]: Internet Engineering Task Force, RFC 5280, *Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile*, section 4.2.1.12, May 2008, <https://www.rfc-editor.org/rfc/rfc5280> (accessed Oct 20, 2026).
[^aB-pkicontainers]: Microsoft Learn, "Monitor AD CS publication health with Enterprise PKI," section "Understand Public Key Services data," <https://learn.microsoft.com/windows-server/identity/ad-cs/monitor-ad-cs-health-enterprise-pki> (accessed Oct 20, 2026).
[^aB-certutil]: Microsoft Learn, "certutil," <https://learn.microsoft.com/windows-server/administration/windows-commands/certutil> (accessed Oct 20, 2026).
[^aB-kcd]: Microsoft Learn, "Kerberos Constrained Delegation Overview," <https://learn.microsoft.com/windows-server/security/kerberos/kerberos-constrained-delegation-overview>, and "Making the second hop in PowerShell Remoting," <https://learn.microsoft.com/powershell/scripting/security/remoting/ps-remoting-second-hop> (accessed Oct 20, 2026).
[^aB-privlevels]: Microsoft Learn, "Privileged access security levels," <https://learn.microsoft.com/security/privileged-access-workstations/privileged-access-security-levels> (accessed Oct 20, 2026).
[^aB-reducing]: Microsoft Learn, "Reducing the Active Directory Attack Surface," <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/reducing-the-active-directory-attack-surface> (accessed Oct 20, 2026).
[^aB-maxval]: Microsoft Learn, "Windows Server 2008 and newer domain controller returns only 5000 values in an LDAP response," <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/domain-controller-returns-500-values-ldap-response> (accessed Oct 20, 2026).
[^aB-dmsa]: Microsoft Learn, "Delegated Managed Service Accounts overview," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-overview> (accessed Oct 20, 2026).
[^aB-trustattrs]: Microsoft, [MS-ADTS] *Active Directory Technical Specification*, "trustAttributes," <https://learn.microsoft.com/openspecs/windows_protocols/ms-adts/e9a2d23c-c31e-4a6f-88a0-6646fdb51a3c> (accessed Oct 20, 2026).
[^aB-netdom]: Microsoft Learn, "netdom trust," <https://learn.microsoft.com/windows-server/administration/windows-commands/netdom-trust> (accessed Oct 20, 2026).
[^aB-msa-assess]: Microsoft Learn, "Run assessments with Managed Service Accounts," Microsoft Engage Center, <https://learn.microsoft.com/services-hub/microsoft-engage-center/health/kb/kb-running-assessments-with-msas> (accessed Oct 20, 2026).
[^aB-taskprincipal]: Microsoft Learn, "New-ScheduledTaskPrincipal," parameter `-LogonType`, <https://learn.microsoft.com/powershell/module/scheduledtasks/new-scheduledtaskprincipal?view=windowsserver2025-ps>, and "Manage group Managed Service Accounts," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts> (accessed Oct 20, 2026).
[^aB-domainmode]: Microsoft Learn, "Set-ADDomainMode," parameter `-DomainMode`, <https://learn.microsoft.com/powershell/module/activedirectory/set-addomainmode?view=windowsserver2025-ps> (accessed Oct 20, 2026).
[^aB-gmsaclass]: Microsoft Learn, "ms-DS-Group-Managed-Service-Account class," <https://learn.microsoft.com/windows/win32/adschema/c-msds-groupmanagedserviceaccount> (accessed Oct 20, 2026).
[^aB-forestmode]: Microsoft Learn, "Set-ADForestMode," parameter `-ForestMode`, <https://learn.microsoft.com/powershell/module/activedirectory/set-adforestmode?view=windowsserver2025-ps> (accessed Oct 20, 2026).
