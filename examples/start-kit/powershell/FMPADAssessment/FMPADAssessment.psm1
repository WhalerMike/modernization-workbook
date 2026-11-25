#Requires -Version 5.1
<#
.SYNOPSIS
    Federal Modernization Workbook Start Kit: read-only Active Directory assessment.

.DESCRIPTION
    Book 02 Appendix B's FMPADAssessment module, packaged as real files and changed only
    where the kit's read-only rule or review required it (see README.md, "What changed from
    Appendix B"), plus the collectors Book 00 Chapter 08 adds to the master plan's twelve
    domains: schema extensions, DHCP, the Kerberos SPN map and LDAP binding events, a
    read-access pre-flight, and the one-page summary.

    Read-only against the directory, DNS, DHCP and AD CS. Writes only under -OutputPath,
    through the guarded writers in StartKit.Common.ps1. The RSAT modules (ActiveDirectory,
    GroupPolicy, DnsServer, DhcpServer) are checked when a collector runs, not at import, so
    a missing module fails that collector alone.

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

function Test-FMPPrerequisites {
    <#
    .SYNOPSIS
        Checks PowerShell, the RSAT modules, forest connectivity and the output root.
    .EXAMPLE
        Test-FMPPrerequisites -OutputPath D:\Assessment | Format-Table Check, Status, Detail -AutoSize

        One row per check. Resolve every FAIL row (no ActiveDirectory module, no forest
        connection) before running the assessment.
    #>
    [CmdletBinding()]
    param([string]$OutputPath)

    $results = @()
    $results += [pscustomobject]@{ Check = 'PowerShell'; Status = 'INFO'; Detail = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)" }
    $os = [Environment]::OSVersion.Version
    $results += [pscustomobject]@{ Check = 'Operating system build'; Status = 'INFO'; Detail = "$os (Windows Server 2025 and Windows 11 24H2 report build 26100)" }

    $modules = [ordered]@{
        ActiveDirectory = 'Required: every directory collector'
        GroupPolicy     = 'GPO inventory'
        DnsServer       = 'DNS assessment'
        DhcpServer      = 'DHCP inventory (Tier B)'
        dbatools        = 'Optional: Find-DbaInstance for the SQL network signal'
    }
    foreach ($name in $modules.Keys) {
        $mod = Get-Module -ListAvailable -Name $name | Sort-Object Version -Descending | Select-Object -First 1
        $status = if ($mod) { 'PASS' } elseif ($name -eq 'ActiveDirectory') { 'FAIL' } else { 'MISSING' }
        $results += [pscustomobject]@{
            Check  = "Module: $name"
            Status = $status
            Detail = if ($mod) { "Version $($mod.Version). $($modules[$name])" } else { "Not installed. $($modules[$name])" }
        }
    }
    try {
        $forest = Get-ADForest -ErrorAction Stop
        $results += [pscustomobject]@{ Check = 'Forest connectivity'; Status = 'PASS'; Detail = "Connected to $($forest.Name)" }
    } catch {
        $results += [pscustomobject]@{ Check = 'Forest connectivity'; Status = 'FAIL'; Detail = $_.Exception.Message }
    }
    if ($OutputPath) {
        $results += [pscustomobject]@{ Check = 'Output root'; Status = if (Test-Path $OutputPath) { 'PASS' } else { 'INFO' }; Detail = "$OutputPath (created on first write if absent)" }
    }
    $failed = @($results | Where-Object Status -eq 'FAIL').Count
    if ($failed -gt 0) { Write-Warning "$failed prerequisite(s) failed. Resolve before running the assessment." }
    $results
}

function Test-FMPReadAccess {
    <#
    .SYNOPSIS
        The permission pre-flight (Book 00 Chapter 08, step 1): records what this account can
        read, and writes the gaps as the draft delegation request.
    .DESCRIPTION
        Each probe makes one small read. Readable items need nothing; the rest are the Tier B
        list, each with the narrow right Book 01 Chapter 10 and Book 02 Chapters 07 and 08
        name. Writes Preflight\ReadAccess.json and Preflight\DelegationRequest.md.
    .EXAMPLE
        Test-FMPReadAccess -OutputPath D:\Assessment\run1 -Domain contoso.example

        Probes what this account can read and writes the gaps to Preflight\DelegationRequest.md.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $path = Initialize-FMPPath -Path (Join-Path $root 'Preflight')
    $d = Get-ADDomain -Server $Domain
    $dn = $d.DistinguishedName
    $pdc = $d.PDCEmulator
    $config = (Get-ADRootDSE -Server $Domain).configurationNamingContext
    $pks = "CN=Public Key Services,CN=Services,$config"

    $probe = {
        param($Area, $Item, $Command, $Run, $Ask)
        if (-not (Test-FMPCommand -Name $Command)) {
            return [pscustomobject]@{ Area = $Area; Item = $Item; Status = 'NotInstalled'; Detail = "$Command not available"; TierBRequest = $null }
        }
        try {
            $null = & $Run
            [pscustomobject]@{ Area = $Area; Item = $Item; Status = 'Readable'; Detail = $null; TierBRequest = $null }
        } catch {
            [pscustomobject]@{ Area = $Area; Item = $Item; Status = 'Denied'; Detail = $_.Exception.Message; TierBRequest = $Ask }
        }
    }
    $checks = @(
        & $probe 'Topology' 'Domain and forest metadata' 'Get-ADForest' { Get-ADForest -Server $Domain -ErrorAction Stop } 'None: readable by any authenticated user unless the forest is hardened'
        & $probe 'Objects' 'User objects' 'Get-ADUser' { Get-ADUser -Filter * -ResultSetSize 1 -Server $Domain -ErrorAction Stop } 'Read on the domain naming context'
        & $probe 'OUs' 'Security descriptor of the domain head' 'Get-Acl' { Get-Acl -Path "AD:\$dn" -ErrorAction Stop } 'Read permissions on OUs whose ACLs are not readable by default'
        & $probe 'Group Policy' 'GPO list' 'Get-GPO' { Get-GPO -All -Domain $Domain -ErrorAction Stop | Select-Object -First 1 } 'Read on GPOs that security filtering hides, through Group Policy Management delegation'
        & $probe 'DNS' "Zones on $pdc" 'Get-DnsServerZone' { Get-DnsServerZone -ComputerName $pdc -ErrorAction Stop | Select-Object -First 1 } "Read permission on the DNS server object on $pdc (never DnsAdmins)"
        & $probe 'DNS' "Aging and scavenging settings on $pdc" 'Get-DnsServerScavenging' { Get-DnsServerScavenging -ComputerName $pdc -ErrorAction Stop } "Read permission on the DNS server object on $pdc, or an administrator export of the server settings"
        & $probe 'AD CS' 'Certificate templates' 'Get-ADObject' { Get-ADObject -SearchBase "CN=Certificate Templates,$pks" -LDAPFilter '(objectClass=pKICertificateTemplate)' -ResultSetSize 1 -Server $Domain -ErrorAction Stop } 'Read on the Public Key Services container'
        & $probe 'DHCP' 'Authorized DHCP servers and their scopes' 'Get-DhcpServerInDC' {
            $s = @(Get-DhcpServerInDC -ErrorAction Stop) | Select-Object -First 1
            if ($s) { Get-DhcpServerv4Scope -ComputerName $s.DnsName -ErrorAction Stop | Select-Object -First 1 }
        } 'Membership of the DHCP Users group on each DHCP server (read-only access to the server)'
        & $probe 'Deleted objects' 'Deleted Objects container' 'Get-ADObject' { Get-ADObject -SearchBase "CN=Deleted Objects,$dn" -IncludeDeletedObjects -LDAPFilter '(isDeleted=TRUE)' -ResultSetSize 1 -Server $Domain -ErrorAction Stop } "List Children and Read Property on CN=Deleted Objects,$dn, delegated with dsacls"
        & $probe 'LDAP bindings' "Directory Service log on $pdc" 'Get-WinEvent' { Get-WinEvent -ComputerName $pdc -LogName 'Directory Service' -MaxEvents 1 -ErrorAction Stop } "Membership of Event Log Readers on each domain controller, or an administrator export of events 2887 and 2889"
    )
    $cas = @(Get-ADObject -SearchBase "CN=Enrollment Services,$pks" -LDAPFilter '(objectClass=pKIEnrollmentService)' -Properties cn, dNSHostName -Server $Domain -ErrorAction SilentlyContinue)
    foreach ($ca in $cas) {
        $cfg = "$($ca.dNSHostName)\$($ca.cn)"
        $ok = $null -ne (Get-FMPCAEditFlags -Config $cfg)
        $checks += [pscustomobject]@{
            Area = 'AD CS'; Item = "CA policy settings on $cfg"; Status = if ($ok) { 'Readable' } else { 'Denied' }
            Detail = if ($ok) { $null } else { 'certutil -getreg failed' }
            TierBRequest = if ($ok) { $null } else { "Read access to the CA $cfg, or an administrator-run export of its configuration and issued-certificate database (never the CA administrator role)" }
        }
    }

    $report = [ordered]@{ Domain = $Domain; ServedBy = $pdc; CheckedUtc = (Get-Date).ToUniversalTime().ToString('o'); Checks = @($checks) }
    Write-FMPJson -InputObject $report -Path (Join-Path $path 'ReadAccess.json') -Depth 5

    $gaps = @($checks | Where-Object Status -eq 'Denied')
    $md = @('# Draft delegation request', '',
        "Domain: $Domain. Generated by the Start Kit pre-flight; review before sending.", '',
        'Every line is read-only, names the object and the reason, and expires at the end of the assessment window (Book 02, Chapter 07). Where the directory team can run an export instead, prefer the export.', '')
    if ($gaps.Count -eq 0) { $md += 'No gaps: this account read everything the pre-flight probes.' }
    else {
        $md += '| Area | What could not be read | Narrow right requested |'
        $md += '|---|---|---|'
        foreach ($g in $gaps) { $md += "| $($g.Area) | $($g.Item) | $($g.TierBRequest) |" }
    }
    Write-FMPText -Value $md -Path (Join-Path $path 'DelegationRequest.md')
    $checks
}

function Get-FMPForestTopology {
    <#
    .SYNOPSIS
        Captures forest, domains, DCs, sites, site links, subnets and operations master roles.
    .OUTPUTS
        ForestTopology.json plus Domains\AllDomains.json and Domains\DomainControllers.json.
    .EXAMPLE
        Get-FMPForestTopology -OutputPath D:\Assessment\run1 -Domain contoso.example

        Run against the forest root domain, as Invoke-FMPADAssessment does.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
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

function Get-FMPParentDN {
    # The parent of a distinguished name, honoring escaped commas (CN=Smith\, Jo,OU=x -> OU=x).
    param([Parameter(Mandatory)][string]$DN)
    if ($DN -match $script:FMPParentDNPattern) { $DN.Substring($Matches[0].Length) } else { '' }
}
# The first RDN, with escaped characters (\, or \\) inside it, and its comma.
$script:FMPParentDNPattern = '^(?:\\.|[^,\\])*,'

function Build-OUTree {
    # Nested tree from the flat OU list, with direct object counts and links. No queries: the
    # OUs and the counts by parent are read once, in Get-FMPOUHierarchy.
    param(
        [Parameter(Mandatory)][string]$ParentDN,
        [Parameter(Mandatory)][hashtable]$ChildrenOf,
        [Parameter(Mandatory)][hashtable]$Counts,
        [int]$Depth = 0
    )
    if (-not $ChildrenOf.ContainsKey($ParentDN)) { return }
    foreach ($ou in @($ChildrenOf[$ParentDN] | Sort-Object Name)) {
        $dn = $ou.DistinguishedName
        $c = if ($Counts.ContainsKey($dn)) { $Counts[$dn] } else { @{ user = 0; computer = 0; group = 0 } }
        [pscustomobject]@{
            Name                            = $ou.Name
            DistinguishedName               = $dn
            Description                     = $ou.Description
            ManagedBy                       = $ou.ManagedBy
            ProtectedFromAccidentalDeletion = $ou.ProtectedFromAccidentalDeletion
            LinkedGPOs                      = @($ou.LinkedGroupPolicyObjects)
            Depth                           = $Depth
            ObjectCounts                    = [pscustomobject]@{ Users = $c.user; Computers = $c.computer; Groups = $c.group }
            Children = @(Build-OUTree -ParentDN $dn -ChildrenOf $ChildrenOf -Counts $Counts -Depth ($Depth + 1))
        }
    }
}

function Show-OUTree {
    # Indented text rendering for human review.
    param([Parameter(Mandatory)][AllowEmptyCollection()]$TreeNodes, [int]$IndentLevel = 0)
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

function Get-FMPObjectCountByParent {
    # Users, computers and groups per parent container: one light, paged read of each class
    # per partition (distinguished name only), retried on timeouts.
    param([Parameter(Mandatory)][string]$Domain)
    $counts = @{}
    $classes = [ordered]@{ user = '(&(objectCategory=person)(objectClass=user))'; computer = '(objectCategory=computer)'; group = '(objectCategory=group)' }
    $partitions = @(Get-FMPAdPartition -Domain $Domain)
    $tracker = Initialize-FMPProgress -Activity "OU object counts ($Domain)" -PartitionCount ($partitions.Count * $classes.Count) -Id 2
    foreach ($class in $classes.Keys) {
        foreach ($p in $partitions) {
            $tracker.Partition = "$class, $($p.Label)"
            $before = $tracker.Count
            $local = Invoke-FMPWithRetry -Activity "OU object counts ($Domain) $class $($p.Label)" -ScriptBlock {
                $tracker.Count = $before
                $m = @{}
                $rx = [regex]$script:FMPParentDNPattern
                $seen = @{ n = 0 }
                Get-ADObject -LDAPFilter $classes[$class] -SearchBase $p.SearchBase -SearchScope $p.SearchScope -Server $Domain -ResultPageSize (Get-FMPRunContext).PageSize -ErrorAction Stop |
                    & { process {
                            $dn = "$($_.DistinguishedName)"
                            $hit = $rx.Match($dn)
                            $parent = if ($hit.Success) { $dn.Substring($hit.Length) } else { '' }
                            $m[$parent] = 1 + $m[$parent]
                            if ((++$seen.n % 256) -eq 0) { Step-FMPProgress -Tracker $tracker -By 256 }
                        } }
                if ($seen.n % 256) { Step-FMPProgress -Tracker $tracker -By ($seen.n % 256) }
                $m
            }
            foreach ($k in $local.Keys) {
                if (-not $counts.ContainsKey($k)) { $counts[$k] = @{ user = 0; computer = 0; group = 0 } }
                $counts[$k][$class] += $local[$k]
            }
            $tracker.PartitionsDone++
        }
    }
    $null = Complete-FMPProgress -Tracker $tracker
    $counts
}

function Get-FMPOUHierarchy {
    <#
    .SYNOPSIS
        Extracts the OU tree, flat list, GPO links, delegations and a text rendering.
    .DESCRIPTION
        The OUs are read once, paged; the users, computers and groups under each are counted in
        one light read per class (Get-FMPObjectCountByParent), not three queries per OU. GPO
        links and ACLs are read per OU, with progress.
    .OUTPUTS
        OUHierarchy.json, OUFlatList.csv, OUFlatExport.json, OUGPOLinks.json, OUDelegations.json, OUTreeVisual.txt
    .EXAMPLE
        Get-FMPOUHierarchy -OutputPath D:\Assessment\run1 -Domain child.contoso.example
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $ouPath   = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'OUs'
    $domainDN = (Invoke-FMPWithRetry -Activity "Domain ($Domain)" -ScriptBlock { Get-ADDomain -Server $Domain -ErrorAction Stop }).DistinguishedName

    $all = @(Invoke-FMPWithRetry -Activity "OUs ($Domain)" -ScriptBlock {
            @(Get-ADOrganizationalUnit -Filter * -Server $Domain -Properties CanonicalName, Description, ManagedBy,
                Created, Modified, ProtectedFromAccidentalDeletion, LinkedGroupPolicyObjects, gPOptions -ResultPageSize (Get-FMPRunContext).PageSize -ErrorAction Stop)
        })
    Write-FMPLog -Message "OUs ($Domain): $($all.Count) organizational units"
    $childrenOf = @{}
    foreach ($ou in $all) {
        $parent = Get-FMPParentDN -DN "$($ou.DistinguishedName)"
        if (-not $childrenOf.ContainsKey($parent)) { $childrenOf[$parent] = [System.Collections.Generic.List[object]]::new() }
        $childrenOf[$parent].Add($ou)
    }
    $counts = Get-FMPObjectCountByParent -Domain $Domain
    $tree = @(Build-OUTree -ParentDN $domainDN -ChildrenOf $childrenOf -Counts $counts -Depth 0)
    Write-FMPJson -InputObject $tree -Path (Join-Path $ouPath 'OUHierarchy.json') -Depth 30

    $flat = foreach ($o in $all) {
        [pscustomobject][ordered]@{
            Name = $o.Name; DistinguishedName = $o.DistinguishedName; CanonicalName = $o.CanonicalName; Description = $o.Description
            ManagedBy = $o.ManagedBy; Created = $o.Created; Modified = $o.Modified; ProtectedFromAccidentalDeletion = $o.ProtectedFromAccidentalDeletion
            LinkedGPOs = @($o.LinkedGroupPolicyObjects); InheritanceBlocked = $o.gPOptions -eq 1
            Depth = ([regex]::Matches($o.DistinguishedName, '(?i)OU=')).Count
        }
    }
    Write-FMPJson -InputObject @($flat) -Path (Join-Path $ouPath 'OUFlatExport.json')
    Write-FMPCsv -InputObject @($flat | Select-Object Name, CanonicalName, Description, ManagedBy, ProtectedFromAccidentalDeletion, InheritanceBlocked, Depth) `
        -Path (Join-Path $ouPath 'OUFlatList.csv')

    if (Test-FMPCommand -Name 'Get-GPInheritance') {
        $tracker = Initialize-FMPProgress -Activity "OU GPO links ($Domain)" -Total ($all.Count + 1) -Id 2
        $links = @(Get-OUGPOLinks -DistinguishedName $domainDN -Domain $Domain)
        Step-FMPProgress -Tracker $tracker
        $links += foreach ($ou in $all) {
            Invoke-FMPWithRetry -Activity "GPO links $($ou.DistinguishedName)" -ScriptBlock { Get-OUGPOLinks -DistinguishedName $ou.DistinguishedName -Domain $Domain }
            Step-FMPProgress -Tracker $tracker
        }
        $null = Complete-FMPProgress -Tracker $tracker
        Write-FMPJson -InputObject $links -Path (Join-Path $ouPath 'OUGPOLinks.json')
    }

    # Non-inherited ACEs only, excluding built-in and well-known principals. The AD: drive
    # comes with the ActiveDirectory module.
    $tracker = Initialize-FMPProgress -Activity "OU delegations ($Domain)" -Total $all.Count -Id 2
    $delegations = foreach ($ou in $all) {
        Step-FMPProgress -Tracker $tracker
        try { $acl = Invoke-FMPWithRetry -Activity "ACL $($ou.DistinguishedName)" -ScriptBlock { Get-Acl -Path "AD:\$($ou.DistinguishedName)" -ErrorAction Stop } }
        catch { [pscustomobject]@{ OU = $ou.Name; DN = $ou.DistinguishedName; Delegations = @(); Error = $_.Exception.Message }; continue }
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
            Error       = $null
        }
    }
    $null = Complete-FMPProgress -Tracker $tracker
    Write-FMPJson -InputObject @($delegations) -Path (Join-Path $ouPath 'OUDelegations.json')

    Write-FMPText -Value @(Show-OUTree -TreeNodes $tree) -Path (Join-Path $ouPath 'OUTreeVisual.txt')
    Write-Verbose "OU hierarchy written to $ouPath"
    [pscustomobject]@{ ObjectCount = $all.Count }
}

function Get-FMPXmlChildText {
    # Text of a direct child element by local name, ignoring the namespace prefix; $null if absent.
    param($Node, [string]$LocalName)
    $c = $Node.SelectSingleNode("*[local-name()='$LocalName']")
    if ($c) { $c.InnerText } else { $null }
}

function Export-FMPGPOSettings {
    <#
    .SYNOPSIS
        Decomposes GPO XML reports into settings grouped by configuration area.
    .OUTPUTS
        GPOSettingsDecomposed.json
    .EXAMPLE
        Export-FMPGPOSettings -GPOSettingsPath D:\Assessment\run1\contoso.example\GPOs\GPOSettings `
                              -OutputPath D:\Assessment\run1\contoso.example\GPOs

        Decomposes the XML reports a GPO inventory already saved again, without contacting a
        domain controller.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$GPOSettingsPath,
        [Parameter(Mandatory)][string]$OutputPath
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
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
    # Settings that appear in more than one GPO, keyed by extension element and setting name.
    # Only nodes with their own <Name> child count; Appendix B's $node.Name fell back to the
    # element's tag name for unnamed nodes, which grouped unrelated settings together.
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
                    if ($node.NodeType -ne [System.Xml.XmlNodeType]::Element) { continue }
                    $settingName = Get-FMPXmlChildText -Node $node -LocalName 'Name'
                    if (-not $settingName) { continue }
                    $key = '{0}|{1}|{2}' -f $half, $node.LocalName, $settingName
                    if (-not $map.ContainsKey($key)) { $map[$key] = @() }
                    $map[$key] += [pscustomobject]@{
                        GPOName = $x.GPO.Name
                        State   = Get-FMPXmlChildText -Node $node -LocalName 'State'
                    }
                }
            }
        }
    }
    $map.GetEnumerator() | Where-Object { @($_.Value).Count -gt 1 } | Sort-Object Key | ForEach-Object {
        [pscustomobject]@{
            SettingKey     = $_.Key
            GPOCount       = @($_.Value).Count
            DifferentState = @($_.Value | ForEach-Object { $_.State } | Select-Object -Unique).Count -gt 1
            GPOs           = @($_.Value)
        }
    }
}

function Get-FMPGPOInventory {
    <#
    .SYNOPSIS
        GPO inventory, XML and HTML reports, links (domain, OU and site), permissions,
        unlinked, empty and overlapping GPOs.
    .DESCRIPTION
        No native GPO backup: Backup-GPO needs delegated backup rights and writes a second
        copy of SYSVOL content, so the kit leaves it to the directory team as an
        administrator-run export. The XML reports carry every setting the classification needs.
    .EXAMPLE
        Get-FMPGPOInventory -OutputPath D:\Assessment\run1 -Domain contoso.example
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    Assert-FMPCommand -Name 'Get-GPO' -Module 'GroupPolicy'
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $gpoPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'GPOs'
    $setPath = Initialize-FMPPath -Path (Join-Path $gpoPath 'GPOSettings')

    $gpos = @(Get-GPO -All -Domain $Domain)

    $inventory = $gpos | Select-Object DisplayName,
        @{ N = 'Id';              E = { "$($_.Id)" } },
        @{ N = 'GpoStatus';       E = { "$($_.GpoStatus)" } },
        CreationTime, ModificationTime, Owner, Description,
        @{ N = 'WmiFilterName';   E = { if ($_.WmiFilter) { $_.WmiFilter.Name } } },
        @{ N = 'ComputerEnabled'; E = { "$($_.GpoStatus)" -notmatch 'ComputerSettingsDisabled|AllSettingsDisabled' } },
        @{ N = 'UserEnabled';     E = { "$($_.GpoStatus)" -notmatch 'UserSettingsDisabled|AllSettingsDisabled' } }
    Write-FMPJson -InputObject @($inventory) -Path (Join-Path $gpoPath 'GPOInventory.json')

    # Get-GPOReport without -Path returns the report as a string; the kit writes it itself.
    $reports = @{}
    foreach ($g in $gpos) {
        $id = "$($g.Id)"
        $reports[$id] = Get-GPOReport -Guid $g.Id -Domain $Domain -ReportType Xml
        Write-FMPText -Value $reports[$id] -Path (Join-Path $setPath "$id.xml")
        Write-FMPText -Value (Get-GPOReport -Guid $g.Id -Domain $Domain -ReportType Html) -Path (Join-Path $setPath "$id.html")
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
        [xml]$r = $reports["$($g.Id)"]
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
    Write-Verbose "GPO inventory written to $gpoPath"
}

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

function Get-FMPReadOrError {
    # Runs one read; returns its result, or an object that says it couldn't be read.
    param([Parameter(Mandatory)][scriptblock]$Read)
    try { & $Read }
    catch { [pscustomobject]@{ NotReadable = $true; Error = $_.Exception.Message } }
}

function Get-FMPDNSAssessment {
    <#
    .SYNOPSIS
        Zones, records, forwarders, stub zones, DNSSEC, scavenging, stale records and DC locator SRV checks.
    .DESCRIPTION
        Zone and record reads usually work at default rights. Scavenging, forwarders and
        DNSSEC settings are server settings (Tier B): each one that can't be read is recorded
        as NotReadable and the rest of the assessment still runs.
    .OUTPUTS
        DNSInventory.json, DNSHealthReport.json, DNSRecordInventory.json
    .EXAMPLE
        Get-FMPDNSAssessment -OutputPath D:\Assessment\run1 -Domain contoso.example -DnsServer dc01.contoso.example -StaleThresholdDays 90
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string[]]$DnsServer,
        [int]$StaleThresholdDays = 90,
        [datetime]$AsOf = (Get-Date)
    )
    Assert-FMPCommand -Name 'Get-DnsServerZone' -Module 'DnsServer'
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $dnsPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'DNS'
    if (-not $DnsServer) {
        # Every DC in the domain, not only global catalogs; unreachable servers are reported, not fatal.
        $DnsServer = Get-ADDomainController -Filter * -Server $Domain | Select-Object -ExpandProperty HostName
    }
    $primary   = (Get-ADDomain -Server $Domain).PDCEmulator
    $stale     = $AsOf.AddDays(-$StaleThresholdDays)

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

    $zones = @(Get-DnsServerZone -ComputerName $primary | Where-Object { -not $_.IsAutoCreated -and $_.ZoneName -ne 'TrustAnchors' })

    $records = foreach ($z in $zones) {
        $rr = @(Get-DnsServerResourceRecord -ZoneName $z.ZoneName -ComputerName $primary -ErrorAction SilentlyContinue)
        [pscustomobject]@{
            ZoneName      = $z.ZoneName
            RecordCount   = $rr.Count
            RecordsByType = @($rr | Group-Object RecordType | Select-Object Name, Count)
            StaleRecords  = @($rr | Where-Object { $_.Timestamp -and [datetime]$_.Timestamp -lt $stale } |
                Select-Object HostName, RecordType, Timestamp,
                    @{ N = 'Data';    E = { Get-FMPDnsRecordData -Record $_ } },
                    @{ N = 'AgeDays'; E = { ($AsOf - [datetime]$_.Timestamp).Days } })
        }
    }

    $dnssec = foreach ($z in ($zones | Where-Object IsSigned)) {
        Get-FMPReadOrError {
            Get-DnsServerDnsSecZoneSetting -ZoneName $z.ZoneName -ComputerName $primary -ErrorAction Stop |
                Select-Object ZoneName,
                    @{ N = 'DenialOfExistence'; E = { "$($_.DenialOfExistence)" } },
                    IsKeyMasterServer, KeyMasterServer,
                    @{ N = 'DSRecordGenerationAlgorithm'; E = { @($_.DSRecordGenerationAlgorithm | ForEach-Object { "$_" }) } }
        }
    }

    $srv = foreach ($prefix in '_ldap._tcp', '_kerberos._tcp', '_gc._tcp', '_kpasswd._tcp') {
        $name = "$prefix.$Domain"
        $r = @(Resolve-DnsName -Name $name -Type SRV -Server $primary -ErrorAction SilentlyContinue |
            Where-Object { $_.Type -eq 'SRV' })
        [pscustomobject]@{
            SRVRecord   = $name
            RecordCount = $r.Count
            Status      = if ($r.Count -gt 0) { 'PASS' } else { 'FAIL' }
            Targets     = (@($r | ForEach-Object { $_.NameTarget }) -join ', ')
        }
    }

    $scav = Get-FMPReadOrError {
        Get-DnsServerScavenging -ComputerName $primary -ErrorAction Stop | Select-Object ScavengingState,
            @{ N = 'ScavengingInterval'; E = { "$($_.ScavengingInterval)" } },
            @{ N = 'RefreshInterval';    E = { "$($_.RefreshInterval)" } },
            @{ N = 'NoRefreshInterval';  E = { "$($_.NoRefreshInterval)" } },
            LastScavengeTime
    }
    $fwd = Get-FMPReadOrError {
        Get-DnsServerForwarder -ComputerName $primary -ErrorAction Stop |
            Select-Object @{ N = 'IPAddress'; E = { @($_.IPAddress | ForEach-Object { "$_" }) } }, UseRootHint
    }

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
        -LDAPFilter '(objectClass=pKIEnrollmentService)' -Properties cn, displayName, dNSHostName, certificateTemplates, cACertificate, nTSecurityDescriptor

    $templates = Get-ADObject -SearchBase "CN=Certificate Templates,$pks" -Server $Server `
        -LDAPFilter '(objectClass=pKICertificateTemplate)' `
        -Properties cn, displayName, msPKI-Cert-Template-OID, msPKI-Template-Schema-Version,
                    msPKI-Certificate-Name-Flag, msPKI-Enrollment-Flag, msPKI-RA-Signature,
                    pKIExtendedKeyUsage, msPKI-Certificate-Application-Policy, nTSecurityDescriptor

    [pscustomobject]@{ CAs = @($cas); Templates = @($templates); PksDN = $pks }
}

function Get-FMPCAEditFlags {
    # The CA's policy EditFlags, read with certutil -getreg. Returns $null when unreadable.
    param([Parameter(Mandatory)][string]$Config)
    $out = & certutil.exe -config $Config -getreg 'policy\EditFlags' 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { return $null }
    $out
}

function Get-FMPCAAuditFilter {
    # The CA's audit filter (127 audits every category), read with certutil -getreg. Returns $null when unreadable.
    param([Parameter(Mandatory)][string]$Config)
    try { $out = & certutil.exe -config $Config -getreg 'CA\AuditFilter' 2>&1 | Out-String } catch { return $null }
    if ($LASTEXITCODE -ne 0) { return $null }
    ConvertFrom-FMPAuditFilter -Text $out
}

function ConvertFrom-FMPAuditFilter {
    # certutil prints the value as "AuditFilter REG_DWORD = 7f (127)", or "= 0" with no decimal for small values.
    param([AllowNull()][string]$Text)
    if ($Text -match 'AuditFilter REG_DWORD = ([0-9a-fA-F]+)(?: \((\d+)\))?') {
        if ($Matches[2]) { return [int]$Matches[2] }
        return [Convert]::ToInt32($Matches[1], 16)
    }
    $null
}

function Read-FMPPkiSnapshot {
    # A PKI snapshot file: the configuration partition's CAs, templates, CDP and AIA objects, and
    # each CA's certutil -getreg output, in the shape of tests\fixtures\pki-contoso.json.
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "PKI snapshot not found: $Path" }
    $s = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    if (-not $s.domain) { throw "PKI snapshot $Path has no 'domain'." }
    [pscustomobject]@{
        CAs = @($s.cas); Templates = @($s.templates); PksDN = "$($s.pksDN)"; Domain = "$($s.domain)"
        CDP = @($s.cdp); AIA = @($s.aia); Snapshot = $true
    }
}

function Get-FMPCARegistryText {
    # From a snapshot, the recorded certutil -getreg output; live, certutil itself.
    param([Parameter(Mandatory)]$CA, [Parameter(Mandatory)][ValidateSet('EditFlags', 'AuditFilter')][string]$Value, [switch]$Snapshot)
    $config = "$($CA.dNSHostName)\$($CA.cn)"
    if ($Snapshot) {
        $p = $CA.PSObject.Properties[$(if ($Value -eq 'EditFlags') { 'editFlags' } else { 'auditFilter' })]
        if (-not $p -or $null -eq $p.Value) { return $null }
        if ($Value -eq 'AuditFilter') { return ConvertFrom-FMPAuditFilter -Text "$($p.Value)" }
        return "$($p.Value)"
    }
    if ($Value -eq 'EditFlags') { Get-FMPCAEditFlags -Config $config } else { Get-FMPCAAuditFilter -Config $config }
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
        $eku     = @(@($t.pKIExtendedKeyUsage) + @($t.'msPKI-Certificate-Application-Policy') | Where-Object { $_ })
        $authEku = ($eku.Count -eq 0) -or @($eku | Where-Object { $_ -in $script:FMPAuthEku }).Count -gt 0
        $supplies = ([int64]$t.'msPKI-Certificate-Name-Flag' -band 0x1) -eq 0x1
        $approval = ([int64]$t.'msPKI-Enrollment-Flag' -band 0x2) -eq 0x2
        $sigs     = [int]$t.'msPKI-RA-Signature'
        $aces     = @($t.nTSecurityDescriptor.Access | Where-Object { "$($_.AccessControlType)" -eq 'Allow' })
        $broadEnroll = @($aces | Where-Object {
                "$($_.IdentityReference)" -match $script:FMPBroadPrincipal -and (
                    ("$($_.ActiveDirectoryRights)" -match 'GenericAll') -or
                    (("$($_.ActiveDirectoryRights)" -match 'ExtendedRight') -and
                     ("$($_.ObjectType)" -eq "$script:FMPEnrollRight" -or "$($_.ObjectType)" -eq "$([guid]::Empty)")))
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
        $anyOrNone = ($eku.Count -eq 0) -or ('2.5.29.37.0' -in $eku)
        if ($isPub -and $anyOrNone -and $broadEnroll) {
            $findings += [pscustomobject]@{ Finding = 'ESC2'; Severity = 'Critical'; Template = $name
                Description = 'Published template with Any Purpose or no EKU is enrollable by broad groups.'
                Remediation = 'Restrict the EKUs to the intended purposes or restrict enrollment.' }
        }
        if ($broadWrite) {
            $findings += [pscustomobject]@{ Finding = 'ESC4'; Severity = 'High'; Template = $name
                Description = 'Template ACL grants write or control rights to broad groups.'
                Remediation = 'Remove the entries; limit template write rights to PKI administrators.' }
        }
    }

    foreach ($ca in $PkiData.CAs) {
        $config = "$($ca.dNSHostName)\$($ca.cn)"
        $out = Get-FMPCARegistryText -CA $ca -Value EditFlags -Snapshot:([bool]$PkiData.PSObject.Properties['Snapshot'])
        if ($null -eq $out) {
            $findings += [pscustomobject]@{ Finding = 'CA-UNREADABLE'; Severity = 'Info'; Template = "N/A ($config)"
                Description = 'Could not read policy EditFlags.'; Remediation = 'Check RPC reachability and rights on the CA (Tier B).' }
        } elseif ($out -match 'EDITF_ATTRIBUTESUBJECTALTNAME2') {
            $findings += [pscustomobject]@{ Finding = 'ESC6'; Severity = 'Critical'; Template = "N/A ($config)"
                Description = 'CA has EDITF_ATTRIBUTESUBJECTALTNAME2 set; requesters can add a SAN to any request.'
                Remediation = 'For the PKI owner, under change control: clear EDITF_ATTRIBUTESUBJECTALTNAME2 and restart the CA service.' }
        }
    }
    $findings
}

function Get-FMPRsaKeySize {
    # The modulus length in bits of an RSA certificate's public key, parsed from its DER
    # RSAPublicKey (SEQUENCE { INTEGER modulus, INTEGER exponent }). $null for other key types.
    param([Parameter(Mandatory)]$Certificate)
    if ("$($Certificate.PublicKey.Oid.Value)" -ne '1.2.840.113549.1.1.1') { return $null }
    $b = [byte[]]$Certificate.PublicKey.EncodedKeyValue.RawData
    $i = 0
    $readLength = {
        $first = [int]$b[$script:pos]; $script:pos++
        if ($first -lt 0x80) { return $first }
        $n = $first -band 0x7f; $len = 0
        for ($k = 0; $k -lt $n; $k++) { $len = ($len * 256) + [int]$b[$script:pos]; $script:pos++ }
        $len
    }
    $script:pos = $i
    if ($b[$script:pos] -ne 0x30) { return $null }
    $script:pos++; $null = & $readLength
    if ($b[$script:pos] -ne 0x02) { return $null }
    $script:pos++; $len = & $readLength
    $start = $script:pos
    while ($len -gt 0 -and $b[$start] -eq 0) { $start++; $len-- }
    if ($len -le 0) { return $null }
    $bits = $len * 8; $top = [int]$b[$start]
    while ($top -lt 0x80) { $bits--; $top = $top * 2 }
    $bits
}

function Get-FMPPKIAssessment {
    <#
    .SYNOPSIS
        CA and template inventory, CA certificate details, CDP and AIA objects, and ESC findings.
    .DESCRIPTION
        Each CA's certificate comes from the cACertificate attribute of its Enrollment
        Services object, a directory read, rather than certutil -ca.cert, which writes a file.
        Each CA's policy EditFlags and audit filter are read with certutil -getreg.

        With -PkiDataPath, nothing is read from a directory or a CA: the same objects and the
        certutil output come from a snapshot file, such as the fictional
        tests\fixtures\pki-contoso.json the learning path's labs use.
    .OUTPUTS
        PKIInventory.json, PKISecurityReport.json, <CA name>.cer
    .EXAMPLE
        Get-FMPPKIAssessment -OutputPath D:\Assessment\run1 -Domain contoso.example

        Run against the forest root domain, as Invoke-FMPADAssessment does.
    .EXAMPLE
        Get-FMPPKIAssessment -OutputPath .\out\run1 -PkiDataPath .\tests\fixtures\pki-contoso.json

        Run on a snapshot, with no directory.
    #>
    [CmdletBinding(DefaultParameterSetName = 'Directory')]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(ParameterSetName = 'Directory')][string]$Domain,
        [Parameter(Mandatory, ParameterSetName = 'Snapshot')][string]$PkiDataPath
    )
    if ($PSCmdlet.ParameterSetName -eq 'Snapshot') {
        $pki = Read-FMPPkiSnapshot -Path $PkiDataPath
        $Domain = $pki.Domain
    } else {
        if (-not $Domain) { $Domain = (Get-ADDomain).DNSRoot }
        $pki = Get-FMPPkiData -Server $Domain
    }
    $snapshot = $PSCmdlet.ParameterSetName -eq 'Snapshot'
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $pkiPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'PKI'

    $caInventory = foreach ($ca in $pki.CAs) {
        $config = "$($ca.dNSHostName)\$($ca.cn)"
        $cert = $null
        $raw = @($ca.cACertificate) | Select-Object -First 1
        if ($raw) {
            try {
                [byte[]]$bytes = if ($raw -is [string]) { [Convert]::FromBase64String($raw) } else { [byte[]]$raw }
                $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($bytes)
                Write-FMPBytes -Bytes $bytes -Path (Join-Path $pkiPath ("{0}.cer" -f ($ca.cn -replace '[^\w\-]', '_')))
            } catch { $cert = $null }
        }
        $keySize = $null
        # Read from the encoded public key, so no crypto provider is needed: PublicKey.Key
        # returns nothing on .NET outside Windows. Non-RSA keys fall back to the provider.
        if ($cert) {
            $keySize = Get-FMPRsaKeySize -Certificate $cert
            if ($null -eq $keySize) { try { $keySize = $cert.PublicKey.Key.KeySize } catch { $keySize = $null } }
        }
        [pscustomobject]@{
            CAName             = $ca.cn
            DisplayName        = $ca.displayName
            ComputerName       = $ca.dNSHostName
            ConfigString       = $config
            PublishedTemplates = @($ca.certificateTemplates)
            AuditFilter        = Get-FMPCARegistryText -CA $ca -Value AuditFilter -Snapshot:$snapshot
            CertSubject        = $(if ($cert) { $cert.Subject })
            CertIssuer         = $(if ($cert) { $cert.Issuer })
            NotBefore          = $(if ($cert) { $cert.NotBefore.ToUniversalTime().ToString('o') })
            NotAfter           = $(if ($cert) { $cert.NotAfter.ToUniversalTime().ToString('o') })
            KeySize            = $keySize
            SignatureAlgorithm = $(if ($cert) { $cert.SignatureAlgorithm.FriendlyName })
        }
    }

    # Built as objects, not with Select-Object's calculated properties, so the EKU list stays an
    # array in Windows PowerShell 5.1's JSON instead of a {value, Count} wrapper.
    $templates = foreach ($t in $pki.Templates) {
        $n = $t.cn
        [pscustomobject]@{
            Name           = $n
            DisplayName    = $t.displayName
            OID            = $t.'msPKI-Cert-Template-OID'
            SchemaVersion  = $t.'msPKI-Template-Schema-Version'
            NameFlag       = $t.'msPKI-Certificate-Name-Flag'
            EnrollmentFlag = $t.'msPKI-Enrollment-Flag'
            RASignatures   = $t.'msPKI-RA-Signature'
            EKU            = [string[]]@(@($t.pKIExtendedKeyUsage) + @($t.'msPKI-Certificate-Application-Policy') | Where-Object { $_ } | Select-Object -Unique)
            Published      = @($pki.CAs | Where-Object { @($_.certificateTemplates) -contains $n }).Count -gt 0
        }
    }

    # CRL and AIA publication objects in the directory; HTTP and file locations are in each CA's registry.
    if ($snapshot) {
        $cdp = $pki.CDP | Select-Object Name, DistinguishedName
        $aia = $pki.AIA | Select-Object Name, DistinguishedName
    } else {
        $cdp = Get-ADObject -SearchBase "CN=CDP,$($pki.PksDN)" -Server $Domain -LDAPFilter '(objectClass=cRLDistributionPoint)' |
            Select-Object Name, DistinguishedName
        $aia = Get-ADObject -SearchBase "CN=AIA,$($pki.PksDN)" -Server $Domain -LDAPFilter '(objectClass=certificationAuthority)' |
            Select-Object Name, DistinguishedName
    }

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

function Get-FMPTemplateClassification {
    <#
    .SYNOPSIS
        Each template in a PKI inventory with its starting class from Book 07, Appendix B.
    .DESCRIPTION
        Reads <OutputPath>\<Domain>\PKI\PKIInventory.json, which Get-FMPPKIAssessment wrote, and
        matches each template's name (cn) against TemplateMatrix.csv, Appendix B's rows for the
        AD CS default templates. A matched template gets the row's class and target as a starting
        point, with Status 'Owner confirms'; a custom template, or a default the matrix splits by
        use, gets Status 'Owner classifies'. The template's owner makes every call (Chapter 02).
        Writes TemplateClassification.csv beside the inventory, and returns the rows.
    .EXAMPLE
        Get-FMPTemplateClassification -OutputPath .\out\run1 -Domain contoso.example
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$Domain,
        [string]$MatrixPath = (Join-Path $PSScriptRoot 'TemplateMatrix.csv')
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $pkiPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'PKI'
    $inv = Read-FMPJsonFile -Path (Join-Path $pkiPath 'PKIInventory.json')
    if ($null -eq $inv) { throw "No PKIInventory.json under $pkiPath. Run Get-FMPPKIAssessment first." }
    $matrix = @{}
    foreach ($r in (Read-FMPCsvFile -Path $MatrixPath)) { $matrix[$r.Template] = $r }

    $rows = foreach ($t in @($inv.CertificateTemplates | Sort-Object Name)) {
        $m = $matrix["$($t.Name)"]
        [pscustomobject]@{
            Template      = $t.Name
            DisplayName   = $t.DisplayName
            Published     = [bool]$t.Published
            StartingClass = $(if ($m) { $m.Class } else { '' })
            Target        = $(if ($m) { $m.Target } else { '' })
            Owner         = ''
            Status        = $(if ($m -and $m.Class) { 'Owner confirms' } else { 'Owner classifies' })
        }
    }
    Write-FMPCsv -InputObject @($rows) -Path (Join-Path $pkiPath 'TemplateClassification.csv')
    $rows
}

function Get-FMPDerivedBuckets {
    # Sums one bucket map (name -> count) across every partition's derived data.
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Parts, [Parameter(Mandatory)][string]$Key)
    $t = @{}
    foreach ($p in $Parts) {
        if (-not ($p.Derived -and $p.Derived.PSObject.Properties[$Key])) { continue }
        foreach ($b in $p.Derived.$Key.PSObject.Properties) {
            if (-not $t.ContainsKey($b.Name)) { $t[$b.Name] = [long]0 }
            $t[$b.Name] += [long]$b.Value
        }
    }
    $t
}

$script:FMPComputerProperties = @('DNSHostName', 'OperatingSystem', 'OperatingSystemVersion', 'Enabled', 'LastLogonDate', 'PasswordLastSet',
    'Created', 'Modified', 'MemberOf', 'ServicePrincipalName', 'TrustedForDelegation', 'TrustedToAuthForDelegation',
    'msDS-AllowedToDelegateTo', 'PrincipalsAllowedToDelegateToAccount', 'msDS-SupportedEncryptionTypes', 'Description')

function Get-FMPComputerInventory {
    <#
    .SYNOPSIS
        Computer objects, OS classification, staleness and Kerberos delegation.
    .DESCRIPTION
        Reads the domain one partition at a time (Get-FMPAdPartition), paged, and streams each
        computer to disk, so a domain of any size is read in bounded memory. A partition that
        hits an ADWS or LDAP timeout is retried; with -Resume, finished partitions are skipped.
        IPv4Address is filled only with -ResolveIPv4: the ActiveDirectory module resolves it
        in DNS one computer at a time, which on a large domain takes hours.
    .OUTPUTS
        ComputerInventory.json, ComputersByOS.csv, StaleComputers.csv, DelegationReport.csv,
        ComputerCounts.json
    .EXAMPLE
        Get-FMPComputerInventory -OutputPath D:\Assessment\run1 -Domain contoso.example -StaleThresholdDays 90
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [int]$StaleThresholdDays = 90,
        [datetime]$AsOf = (Get-Date),
        [switch]$ResolveIPv4
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $objPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Objects'
    $staleDate = $AsOf.AddDays(-$StaleThresholdDays)
    $dcNames = @{}
    foreach ($dc in @(Invoke-FMPWithRetry -Activity "Domain controllers ($Domain)" -ScriptBlock { @(Get-ADDomainController -Filter * -Server $Domain) })) { $dcNames["$($dc.Name)"] = $true }
    $props = @($script:FMPComputerProperties)
    if ($ResolveIPv4) { $props += 'IPv4Address' }

    $read = { param($p, $pageSize) Get-ADComputer -Filter * -SearchBase $p.SearchBase -SearchScope $p.SearchScope -Server $Domain -Properties $props -ResultPageSize $pageSize -ErrorAction Stop }
    $project = {
        param($c, $acc)
        $os = "$($c.OperatingSystem)"
        $r = [ordered]@{
            Name = $c.Name; DNSHostName = $c.DNSHostName; OperatingSystem = $c.OperatingSystem; OperatingSystemVersion = $c.OperatingSystemVersion
            Enabled = $c.Enabled; LastLogonDate = $c.LastLogonDate; PasswordLastSet = $c.PasswordLastSet; Created = $c.Created; Modified = $c.Modified
            DistinguishedName = $c.DistinguishedName; IPv4Address = if ($ResolveIPv4) { $c.IPv4Address } else { $null }; Description = $c.Description
            SID = "$($c.SID)"; IsDomainController = $dcNames.ContainsKey("$($c.Name)"); IsServer = $os -match '(?i)server'
            MemberOfCount = @($c.MemberOf).Count; SPNs = @($c.ServicePrincipalName)
            TrustedForDelegation = $c.TrustedForDelegation; TrustedToAuthForDelegation = $c.TrustedToAuthForDelegation
            AllowedToDelegateTo = @($c.'msDS-AllowedToDelegateTo'); RBCDPrincipals = @($c.PrincipalsAllowedToDelegateToAccount)
            SupportedEncryptionTypes = $c.'msDS-SupportedEncryptionTypes'
        }

        # Inline counters, not Measure-FMPDerived: this runs once per computer.
        $osName = if ("$($r.OperatingSystem)") { "$($r.OperatingSystem)" } else { 'Unknown' }
        if (-not $acc.OS) { $acc.OS = @{}; $acc.OSEnabled = @{}; $acc.Servers = 0; $acc.EnabledServers = 0; $acc.UnconstrainedHosts = 0 }
        $acc.OS[$osName] = 1 + $acc.OS[$osName]
        if ($r.Enabled) { $acc.OSEnabled[$osName] = 1 + $acc.OSEnabled[$osName] }
        if ($r.IsServer) { $acc.Servers++; if ($r.Enabled) { $acc.EnabledServers++ } }
        if ($r.TrustedForDelegation -and -not $r.IsDomainController) { $acc.UnconstrainedHosts++ }
        # Stale only when both lastLogonTimestamp and the machine password are old.
        if (((-not $r.LastLogonDate) -or [datetime]$r.LastLogonDate -lt $staleDate) -and ((-not $r.PasswordLastSet) -or [datetime]$r.PasswordLastSet -lt $staleDate)) {
            Join-FMPDerived -Acc $acc -Key 'Stale' -Row ([pscustomobject][ordered]@{
                    Name = $r.Name; DNSHostName = $r.DNSHostName; OperatingSystem = $r.OperatingSystem; Enabled = $r.Enabled
                    LastLogonDate = $r.LastLogonDate; PasswordLastSet = $r.PasswordLastSet; DistinguishedName = $r.DistinguishedName
                    DaysSinceLogon = if ($r.LastLogonDate) { ($AsOf - [datetime]$r.LastLogonDate).Days } else { 'Never' }
                })
        }
        if ($r.TrustedForDelegation -or @($r.AllowedToDelegateTo).Count -gt 0 -or @($r.RBCDPrincipals).Count -gt 0) {
            Join-FMPDerived -Acc $acc -Key 'Delegation' -Row ([pscustomobject][ordered]@{
                    Name = $r.Name; DNSHostName = $r.DNSHostName; OperatingSystem = $r.OperatingSystem; IsDomainController = $r.IsDomainController
                    DelegationType = if ($r.TrustedForDelegation) { 'Unconstrained' }
                        elseif (@($r.AllowedToDelegateTo).Count -gt 0 -and $r.TrustedToAuthForDelegation) { 'Constrained (protocol transition)' }
                        elseif (@($r.AllowedToDelegateTo).Count -gt 0) { 'Constrained (Kerberos only)' }
                        else { 'Resource-based (inbound)' }
                    DelegationTargets = @($r.AllowedToDelegateTo) -join '; '; RBCDPrincipals = @($r.RBCDPrincipals) -join '; '
                    DistinguishedName = $r.DistinguishedName
                })
        }
        $r
    }
    $parts = @(Invoke-FMPPartitionedRead -Name 'Computers' -Domain $Domain -WorkPath $objPath -Read $read -Project $project)
    Join-FMPJsonParts -Path (Join-Path $objPath 'ComputerInventory.json') -PartPath @($parts | ForEach-Object { $_.PartFile })

    $os = Get-FMPDerivedBuckets -Parts $parts -Key 'OS'
    $osEnabled = Get-FMPDerivedBuckets -Parts $parts -Key 'OSEnabled'
    Write-FMPCsv -InputObject @($os.Keys | ForEach-Object {
            $en = if ($osEnabled.ContainsKey($_)) { $osEnabled[$_] } else { 0 }
            [pscustomobject][ordered]@{ OperatingSystem = $_; Count = $os[$_]; EnabledCount = $en; DisabledCount = $os[$_] - $en }
        } | Sort-Object @{ E = 'Count'; Descending = $true }, OperatingSystem) -Path (Join-Path $objPath 'ComputersByOS.csv')
    Write-FMPCsv -InputObject @(Get-FMPDerivedRows -Parts $parts -Key 'Stale') -Path (Join-Path $objPath 'StaleComputers.csv')
    Write-FMPCsv -InputObject @(Get-FMPDerivedRows -Parts $parts -Key 'Delegation') -Path (Join-Path $objPath 'DelegationReport.csv')
    $counts = [ordered]@{
        Computers = Get-FMPDerivedSum -Parts $parts -Key 'Count'; Servers = Get-FMPDerivedSum -Parts $parts -Key 'Servers'
        EnabledServers = Get-FMPDerivedSum -Parts $parts -Key 'EnabledServers'; UnconstrainedHosts = Get-FMPDerivedSum -Parts $parts -Key 'UnconstrainedHosts'
    }
    Write-FMPJson -InputObject $counts -Path (Join-Path $objPath 'ComputerCounts.json')
    Write-Verbose "Computer inventory: $($counts.Computers) objects."
    [pscustomobject]@{ ObjectCount = $counts.Computers }
}

# Privileged groups by well-known SID, so a renamed group or a non-English domain controller
# still resolves: <domain SID>-512 Domain Admins, <root SID>-519 Enterprise Admins, <root SID>-518
# Schema Admins, and the BUILTIN groups Administrators, Account Operators, Server Operators,
# Print Operators and Backup Operators. Protected Users is <domain SID>-525.
$script:FMPPrivilegedGroups = 'Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Administrators',
                              'Account Operators', 'Server Operators', 'Backup Operators', 'Print Operators'
$script:FMPPrivilegedSids = [ordered]@{
    'Domain Admins' = @{ Rid = '512'; Scope = 'Domain' }; 'Enterprise Admins' = @{ Rid = '519'; Scope = 'Root' }
    'Schema Admins' = @{ Rid = '518'; Scope = 'Root' }; 'Administrators' = @{ Sid = 'S-1-5-32-544' }
    'Account Operators' = @{ Sid = 'S-1-5-32-548' }; 'Server Operators' = @{ Sid = 'S-1-5-32-549' }
    'Backup Operators' = @{ Sid = 'S-1-5-32-551' }; 'Print Operators' = @{ Sid = 'S-1-5-32-550' }
}

function Get-FMPPrivilegedGroupSid {
    # Each privileged group's SID and the domain to ask for it.
    param([Parameter(Mandatory)][string]$Domain, [string]$RootDomain)
    if (-not $RootDomain) { $RootDomain = try { (Get-ADForest -Server $Domain -ErrorAction Stop).RootDomain } catch { $Domain } }
    $sid = "$((Get-ADDomain -Server $Domain -ErrorAction Stop).DomainSID)"
    $rootSid = if ($RootDomain -eq $Domain) { $sid } else { "$((Get-ADDomain -Server $RootDomain -ErrorAction Stop).DomainSID)" }
    foreach ($name in $script:FMPPrivilegedSids.Keys) {
        $g = $script:FMPPrivilegedSids[$name]
        if ($g.Sid) { [pscustomobject]@{ Name = $name; Sid = $g.Sid; Server = $Domain } }
        elseif ($g.Scope -eq 'Root') { [pscustomobject]@{ Name = $name; Sid = "$rootSid-$($g.Rid)"; Server = $RootDomain } }
        else { [pscustomobject]@{ Name = $name; Sid = "$sid-$($g.Rid)"; Server = $Domain } }
    }
}

function Find-CircularGroupNesting {
    # Groups that are members of themselves through nesting. -Parents maps each group's DN to
    # the DNs of the groups it is a member of; without it, the domain's groups are read.
    param([string]$Server, [hashtable]$Parents, [hashtable]$Names = @{})
    if (-not $Parents) {
        $Parents = @{}
        foreach ($g in @(Get-ADGroup -Filter * -Server $Server -Properties MemberOf -ResultPageSize (Get-FMPRunContext).PageSize)) {
            $Parents[$g.DistinguishedName] = @($g.MemberOf); $Names[$g.DistinguishedName] = $g.SamAccountName
        }
    }
    foreach ($start in @($Parents.Keys)) {
        $seen  = @{}
        $queue = [System.Collections.Queue]::new()
        foreach ($p in $Parents[$start]) { $queue.Enqueue($p) }
        while ($queue.Count -gt 0) {
            $current = $queue.Dequeue()
            if ($current -eq $start) {
                [pscustomobject]@{ Group = $Names[$start]; DN = $start }
                break
            }
            if ($seen.ContainsKey($current)) { continue }
            $seen[$current] = $true
            if ($Parents.ContainsKey($current)) {
                foreach ($p in $Parents[$current]) { $queue.Enqueue($p) }
            }
        }
    }
}

$script:FMPUserProperties = @('UserPrincipalName', 'DisplayName', 'Enabled', 'LastLogonDate', 'PasswordLastSet', 'PasswordNeverExpires',
    'PasswordExpired', 'LockedOut', 'AccountExpirationDate', 'MemberOf', 'AdminCount', 'TrustedForDelegation', 'TrustedToAuthForDelegation',
    'AccountNotDelegated', 'msDS-AllowedToDelegateTo', 'ServicePrincipalName', 'Created', 'Modified', 'Description', 'Department', 'Title')

function ConvertTo-FMPIdentityEvidence {
    <#
    .SYNOPSIS
        One directory evidence record for one identity: the attributes exactly as the
        collector read them, where and when from, with which query, and a SHA-256 of the
        attributes so the record can be checked later.
    .EXAMPLE
        ConvertTo-FMPIdentityEvidence -Row $row -ObjectClass user -Domain contoso.example -Query 'Get-ADUser -Filter *'
    #>
    param([Parameter(Mandatory)]$Row, [string]$ObjectClass, [Parameter(Mandatory)][string]$Domain, [string]$Query)
    $names = 'SamAccountName', 'SID', 'DistinguishedName', 'Enabled', 'Created', 'Modified', 'PasswordLastSet', 'PasswordNeverExpires',
        'LastLogonDate', 'AdminCount', 'TrustedForDelegation', 'TrustedToAuthForDelegation', 'AccountNotDelegated', 'AllowedToDelegateTo',
        'SPNs', 'MemberOf', 'PrincipalsAllowedToRetrieveManagedPassword', 'HostComputers', 'Description'
    $attrs = [ordered]@{}
    foreach ($n in $names) {
        $v = if ($Row -is [System.Collections.IDictionary]) { if ($Row.Contains($n)) { $Row[$n] } else { $null } } elseif ($Row.PSObject.Properties[$n]) { $Row.$n } else { $null }
        if ($null -eq $v) { continue }
        if ($v -is [datetime]) { $v = $v.ToUniversalTime().ToString('o') }
        elseif ($v -is [System.Collections.IEnumerable] -and $v -isnot [string]) { $v = @($v | ForEach-Object { "$_" } | Sort-Object) }
        $attrs[$n] = $v
    }
    $canonical = ConvertTo-Json -InputObject $attrs -Depth 4 -Compress
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { $hash = -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonical)) | ForEach-Object { $_.ToString('x2') }) } finally { $sha.Dispose() }
    [pscustomobject][ordered]@{
        IdentityId = "$($attrs['SID'])"; SamAccountName = $attrs['SamAccountName']; ObjectClass = $ObjectClass; Domain = $Domain
        ReadAtUtc = [DateTime]::UtcNow.ToString('o'); Query = $Query; Attributes = $attrs
        # The exact text hashed: check a record with SHA-256 over AttributesJson as UTF-8.
        AttributesJson = $canonical; AttributesSha256 = $hash
    }
}

function Get-FMPUserInventory {
    <#
    .SYNOPSIS
        Users, privileged membership, AdminSDHolder-protected and orphaned accounts, and service accounts.
    .DESCRIPTION
        Privileged groups are found by well-known SID, not by name. Users are read one
        partition at a time, paged, and streamed to disk (see Get-FMPComputerInventory).
    .OUTPUTS
        UserInventory.json, PrivilegedUsers.csv, AdminCountReport.csv, ServiceAccounts.csv,
        UserDelegationReport.csv, PrivilegedDelegable.csv, UserCounts.json,
        ServiceAccounts\MSAInventory.json, ServiceAccounts\gMSAInventory.json,
        ServiceAccounts\IdentityEvidence.json (one directory evidence record per service identity)
    .EXAMPLE
        Get-FMPUserInventory -OutputPath D:\Assessment\run1 -Domain contoso.example -StaleThresholdDays 90
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [int]$StaleThresholdDays = 90,
        [datetime]$AsOf = (Get-Date),
        [string]$RootDomain
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $objPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Objects'
    $saPath  = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'ServiceAccounts'
    $staleDate = $AsOf.AddDays(-$StaleThresholdDays)
    $domainSid = "$((Invoke-FMPWithRetry -Activity "Domain ($Domain)" -ScriptBlock { Get-ADDomain -Server $Domain -ErrorAction Stop }).DomainSID)"

    # Recursive membership of each privileged group, this domain's users only.
    $privileged = @{}
    $privRows = foreach ($g in @(Get-FMPPrivilegedGroupSid -Domain $Domain -RootDomain $RootDomain)) {
        try {
            $members = @(Invoke-FMPWithRetry -Activity "Privileged group $($g.Name) ($Domain)" -ScriptBlock { @(Get-ADGroupMember -Identity $g.Sid -Recursive -Server $g.Server -ErrorAction Stop) })
            foreach ($m in $members) {
                if ("$($m.objectClass)" -ne 'user' -or -not "$($m.SID)".StartsWith("$domainSid-")) { continue }
                $privileged["$($m.SID)"] = $true
                $u = Get-ADUser -Identity "$($m.SID)" -Server $Domain -Properties LastLogonDate, PasswordLastSet, Enabled, AdminCount
                [pscustomobject]@{
                    PrivilegedGroup = $g.Name
                    SamAccountName  = $u.SamAccountName
                    Enabled         = $u.Enabled
                    LastLogonDate   = $u.LastLogonDate
                    PasswordLastSet = $u.PasswordLastSet
                    AdminCount      = $u.AdminCount
                }
            }
        } catch {
            Write-FMPLog -Level WARN -Message "Unable to enumerate $($g.Name) ($($g.Sid)): $($_.Exception.Message)"
        }
    }
    Write-FMPCsv -InputObject @($privRows) -Path (Join-Path $objPath 'PrivilegedUsers.csv')

    $protected = @{}
    $protectedRead = $true
    try {
        Invoke-FMPWithRetry -Activity "Protected Users ($Domain)" -ScriptBlock { @(Get-ADGroupMember -Identity "$domainSid-525" -Recursive -Server $Domain -ErrorAction Stop) } |
            ForEach-Object { $protected["$($_.SID)"] = $true }
    } catch {
        $protectedRead = $false
        Write-FMPLog -Level WARN -Message "Unable to enumerate Protected Users: $($_.Exception.Message)"
    }

    $read = { param($p, $pageSize) Get-ADUser -Filter * -SearchBase $p.SearchBase -SearchScope $p.SearchScope -Server $Domain -Properties $script:FMPUserProperties -ResultPageSize $pageSize -ErrorAction Stop }
    $project = {
        param($u, $acc)
        $r = [ordered]@{
            SamAccountName = $u.SamAccountName; UserPrincipalName = $u.UserPrincipalName; DisplayName = $u.DisplayName; Enabled = $u.Enabled
            LastLogonDate = $u.LastLogonDate; PasswordLastSet = $u.PasswordLastSet; PasswordNeverExpires = $u.PasswordNeverExpires
            PasswordExpired = $u.PasswordExpired; LockedOut = $u.LockedOut; AccountExpirationDate = $u.AccountExpirationDate; AdminCount = $u.AdminCount
            TrustedForDelegation = $u.TrustedForDelegation; TrustedToAuthForDelegation = $u.TrustedToAuthForDelegation; AccountNotDelegated = $u.AccountNotDelegated
            AllowedToDelegateTo = @(foreach ($x in $u.'msDS-AllowedToDelegateTo') { if ($x) { $x } })
            Created = $u.Created; Modified = $u.Modified; DistinguishedName = $u.DistinguishedName; Description = $u.Description
            Department = $u.Department; Title = $u.Title; SID = "$($u.SID)"
            IsStale = (-not $u.LastLogonDate) -or [datetime]$u.LastLogonDate -lt $staleDate
            MemberOfCount = @($u.MemberOf).Count; MemberOf = @($u.MemberOf); SPNs = @($u.ServicePrincipalName)
        }

        if ($r.Enabled) { $acc.Enabled = 1 + $acc.Enabled }
        if ($r.TrustedForDelegation) { $acc.UnconstrainedAccounts = 1 + $acc.UnconstrainedAccounts }
        # Kerberos delegation on user (service) accounts. Unconstrained delegation on an account
        # lets any service running as it impersonate every user who connects, to any service.
        if ($r.TrustedForDelegation -or @($r.AllowedToDelegateTo).Count -gt 0) {
            Join-FMPDerived -Acc $acc -Key 'Delegation' -Row ([pscustomobject][ordered]@{
                    SamAccountName = $r.SamAccountName; Enabled = $r.Enabled
                    DelegationType = if ($r.TrustedForDelegation) { 'Unconstrained' } elseif ($r.TrustedToAuthForDelegation) { 'Constrained (protocol transition)' } else { 'Constrained (Kerberos only)' }
                    DelegationTargets = @($r.AllowedToDelegateTo) -join '; '
                    IsSqlServiceAccount = @($r.SPNs | Where-Object { "$_" -like 'MSSQLSvc/*' }).Count -gt 0
                    SPNs = $r.SPNs -join '; '; DistinguishedName = $r.DistinguishedName
                })
        }
        # Privileged users whose credentials can still be delegated: neither "Account is sensitive
        # and cannot be delegated" nor a member of Protected Users.
        if ($privileged.ContainsKey($r.SID) -and $r.Enabled -and -not $r.AccountNotDelegated -and -not $protected.ContainsKey($r.SID)) {
            Join-FMPDerived -Acc $acc -Key 'PrivDelegable' -Row ([pscustomobject][ordered]@{
                    SamAccountName = $r.SamAccountName; Enabled = $r.Enabled; AdminCount = $r.AdminCount; AccountNotDelegated = [bool]$r.AccountNotDelegated
                    InProtectedUsers = if ($protectedRead) { $false } else { 'not collected' }; DistinguishedName = $r.DistinguishedName
                })
        }
        # adminCount=1 but no longer in any protected group (recursively) = orphaned.
        if ($r.AdminCount -eq 1) {
            Join-FMPDerived -Acc $acc -Key 'AdminCount' -Row ([pscustomobject][ordered]@{
                    SamAccountName = $r.SamAccountName; Enabled = $r.Enabled; LastLogonDate = $r.LastLogonDate
                    InPrivilegedGroup = $privileged.ContainsKey($r.SID); OrphanedAdminCount = -not $privileged.ContainsKey($r.SID)
                })
        }
        # One directory evidence record per service identity: a user with an SPN or delegation.
        if (@($r.SPNs).Count -gt 0 -or $r.TrustedForDelegation -or @($r.AllowedToDelegateTo).Count -gt 0) {
            Join-FMPDerived -Acc $acc -Key 'Evidence' -Row (ConvertTo-FMPIdentityEvidence -Row $r -ObjectClass 'user' -Domain $Domain -Query "Get-ADUser -Filter * -Properties $($script:FMPUserProperties -join ',')")
        }
        if (@($r.SPNs).Count -gt 0) {
            Join-FMPDerived -Acc $acc -Key 'Service' -Row ([pscustomobject][ordered]@{
                    SamAccountName = $r.SamAccountName; Enabled = $r.Enabled; PasswordNeverExpires = $r.PasswordNeverExpires
                    LastLogonDate = $r.LastLogonDate; Type = 'User with SPN'; SPNs = $r.SPNs -join '; '
                })
        }
        $r
    }
    $parts = @(Invoke-FMPPartitionedRead -Name 'Users' -Domain $Domain -WorkPath $objPath -Read $read -Project $project)
    Join-FMPJsonParts -Path (Join-Path $objPath 'UserInventory.json') -PartPath @($parts | ForEach-Object { $_.PartFile })
    Write-FMPCsv -InputObject @(Get-FMPDerivedRows -Parts $parts -Key 'Delegation') -Path (Join-Path $objPath 'UserDelegationReport.csv')
    Write-FMPCsv -InputObject @(Get-FMPDerivedRows -Parts $parts -Key 'PrivDelegable') -Path (Join-Path $objPath 'PrivilegedDelegable.csv')
    Write-FMPCsv -InputObject @(Get-FMPDerivedRows -Parts $parts -Key 'AdminCount') -Path (Join-Path $objPath 'AdminCountReport.csv')

    $managed = @(Invoke-FMPWithRetry -Activity "Managed service accounts ($Domain)" -ScriptBlock {
            @(Get-ADServiceAccount -Filter * -Server $Domain -Properties Enabled, Created, PasswordLastSet, ServicePrincipalName, PrincipalsAllowedToRetrieveManagedPassword, HostComputers -ResultPageSize (Get-FMPRunContext).PageSize -ErrorAction Stop)
        } | ForEach-Object {
            [pscustomobject][ordered]@{
                SamAccountName = $_.SamAccountName; SID = "$($_.SID)"; Enabled = $_.Enabled; Created = $_.Created; PasswordLastSet = $_.PasswordLastSet
                DistinguishedName = $_.DistinguishedName; ObjectClass = "$($_.ObjectClass)"; SPNs = @($_.ServicePrincipalName)
                PrincipalsAllowedToRetrieveManagedPassword = @($_.PrincipalsAllowedToRetrieveManagedPassword | Where-Object { $_ })
                HostComputers = @($_.HostComputers | Where-Object { $_ })
            }
        })
    $evidence = @(Get-FMPDerivedRows -Parts $parts -Key 'Evidence')
    $evidence += @($managed | ForEach-Object { ConvertTo-FMPIdentityEvidence -Row $_ -ObjectClass $_.ObjectClass -Domain $Domain -Query 'Get-ADServiceAccount -Filter * -Properties Enabled,Created,PasswordLastSet,ServicePrincipalName,PrincipalsAllowedToRetrieveManagedPassword,HostComputers' })
    Write-FMPJson -InputObject ([ordered]@{
            Schema = 'fmp-start-kit/identity-evidence/1'; Domain = $Domain; GeneratedUtc = (Get-Date).ToUniversalTime().ToString('o')
            RecordCount = $evidence.Count; Records = $evidence
        }) -Path (Join-Path $saPath 'IdentityEvidence.json') -Depth 6
    Write-FMPJson -InputObject @($managed | Where-Object ObjectClass -eq 'msDS-ManagedServiceAccount')      -Path (Join-Path $saPath 'MSAInventory.json')
    Write-FMPJson -InputObject @($managed | Where-Object ObjectClass -eq 'msDS-GroupManagedServiceAccount') -Path (Join-Path $saPath 'gMSAInventory.json')

    $service = @(Get-FMPDerivedRows -Parts $parts -Key 'Service')
    $service += @($managed | ForEach-Object {
            [pscustomobject][ordered]@{ SamAccountName = $_.SamAccountName; Enabled = $_.Enabled; PasswordNeverExpires = $null; LastLogonDate = $null; Type = $_.ObjectClass; SPNs = $_.SPNs -join '; ' }
        })
    Write-FMPCsv -InputObject $service -Path (Join-Path $objPath 'ServiceAccounts.csv')
    $counts = [ordered]@{
        Users = Get-FMPDerivedSum -Parts $parts -Key 'Count'; EnabledUsers = Get-FMPDerivedSum -Parts $parts -Key 'Enabled'
        UnconstrainedAccounts = Get-FMPDerivedSum -Parts $parts -Key 'UnconstrainedAccounts'; ServiceAccounts = $service.Count
        PrivilegedMemberships = @($privRows).Count
    }
    Write-FMPJson -InputObject $counts -Path (Join-Path $objPath 'UserCounts.json')
    Write-Verbose "User inventory: $($counts.Users) users, $(@($privRows).Count) privileged memberships."
    [pscustomobject]@{ ObjectCount = $counts.Users }
}

function Get-FMPGroupInventory {
    <#
    .SYNOPSIS
        Groups with category, scope, member counts, empty flag and circular nesting.
    .DESCRIPTION
        Read one partition at a time, paged, and streamed to disk. The nesting check uses the
        memberOf values collected on the way, so groups are read once.
    .OUTPUTS
        GroupInventory.json, CircularGroups.json, GroupCounts.json
    .EXAMPLE
        Get-FMPGroupInventory -OutputPath D:\Assessment\run1 -Domain contoso.example
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $objPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Objects'
    $read = { param($p, $pageSize) Get-ADGroup -Filter * -SearchBase $p.SearchBase -SearchScope $p.SearchScope -Server $Domain -Properties DisplayName, Description, Members, MemberOf, ManagedBy, Created, Modified, AdminCount -ResultPageSize $pageSize -ErrorAction Stop }
    $project = {
        param($g, $acc)
        $n = @($g.Members).Count
        $r = [ordered]@{
            SamAccountName = $g.SamAccountName; DisplayName = $g.DisplayName; Description = $g.Description
            Category = "$($g.GroupCategory)"; Scope = "$($g.GroupScope)"; ManagedBy = $g.ManagedBy; Created = $g.Created; Modified = $g.Modified
            DistinguishedName = $g.DistinguishedName; AdminCount = $g.AdminCount; SID = "$($g.SID)"
            DirectMemberCount = $n; IsEmpty = $n -eq 0; CountMayBeCapped = $n -ge 5000
            MemberOf = @($g.MemberOf)
        }

        if ($r.IsEmpty) { $acc.Empty = 1 + $acc.Empty }
        if (@($r.MemberOf).Count -gt 0) { Join-FMPDerived -Acc $acc -Key 'Nesting' -Row ([pscustomobject]@{ DN = $r.DistinguishedName; Name = $r.SamAccountName; Parents = @($r.MemberOf) }) }
        $r
    }
    $parts = @(Invoke-FMPPartitionedRead -Name 'Groups' -Domain $Domain -WorkPath $objPath -Read $read -Project $project)
    Join-FMPJsonParts -Path (Join-Path $objPath 'GroupInventory.json') -PartPath @($parts | ForEach-Object { $_.PartFile })
    $parents = @{}; $names = @{}
    foreach ($n in @(Get-FMPDerivedRows -Parts $parts -Key 'Nesting')) { $parents["$($n.DN)"] = @($n.Parents); $names["$($n.DN)"] = $n.Name }
    Write-FMPJson -InputObject @(Find-CircularGroupNesting -Parents $parents -Names $names) -Path (Join-Path $objPath 'CircularGroups.json')
    $counts = [ordered]@{ Groups = Get-FMPDerivedSum -Parts $parts -Key 'Count'; EmptyGroups = Get-FMPDerivedSum -Parts $parts -Key 'Empty' }
    Write-FMPJson -InputObject $counts -Path (Join-Path $objPath 'GroupCounts.json')
    Write-Verbose "Group inventory: $($counts.Groups) groups."
    [pscustomobject]@{ ObjectCount = $counts.Groups }
}

# A plain hashtable: an [ordered] dictionary indexed with an integer reads by position, not
# by key, which is how Appendix B's version decoded 0x8 as UsesAESKeys.
$script:FMPTrustBits = @{
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
    0x1000 = 'DisableAuthTargetValidation'
}

function Get-FMPTrustMap {
    <#
    .SYNOPSIS
        Trusts with decoded attributes, access direction and posture. Enumeration only.
    .DESCRIPTION
        Appendix B's Test-FMPTrust (netdom trust /verify) isn't in the kit: verification needs
        domain administrator credentials, so it runs separately under just-in-time elevation.
    .OUTPUTS
        TrustMap.json
    .EXAMPLE
        Get-FMPTrustMap -OutputPath D:\Assessment\run1 -Domain contoso.example
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $trustPath = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Trusts'
    $trusts = foreach ($t in @(Get-ADTrust -Filter * -Server $Domain -Properties TrustAttributes, Direction, TrustType, IntraForest, ForestTransitive, SelectiveAuthentication, SIDFilteringQuarantined, SIDFilteringForestAware, Source, Target, Created, Modified)) {
        $attr = [int]$t.TrustAttributes
        $decoded = @($script:FMPTrustBits.Keys | Sort-Object | Where-Object { $attr -band $_ } | ForEach-Object { $script:FMPTrustBits[$_] })
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

# Microsoft Learn, "Find the current Active Directory schema version."
$script:FMPSchemaVersions = @{
    13 = 'Windows 2000 Server'; 30 = 'Windows Server 2003'; 31 = 'Windows Server 2003 R2'; 44 = 'Windows Server 2008'
    47 = 'Windows Server 2008 R2'; 56 = 'Windows Server 2012'; 69 = 'Windows Server 2012 R2'; 87 = 'Windows Server 2016'
    88 = 'Windows Server 2019 or 2022'; 91 = 'Windows Server 2025'
}
$script:FMPKnownExtensions = [ordered]@{
    'Exchange'            = '^msExch'
    'Windows LAPS'        = '^msLAPS-'
    'Legacy LAPS'         = '^ms-Mcs-AdmPwd'
    'Configuration Manager' = '^mSSMS'
    'Skype for Business or Lync' = '^msRTCSIP-'
}

function Get-FMPSchemaExtensions {
    <#
    .SYNOPSIS
        Schema version and the attributes and classes added to the base schema (domain 12).
    .DESCRIPTION
        Reads the schema partition, which any authenticated user can read. Flags objects
        created after the forest (Microsoft upgrades and product extensions alike), those of
        them whose OID is outside Microsoft's 1.2.840.113556 arc (third-party), and names
        the common product extensions it recognizes.
    .OUTPUTS
        Schema\SchemaExtensions.json
    .EXAMPLE
        Get-FMPSchemaExtensions -OutputPath D:\Assessment\run1 -Domain contoso.example
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $path = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Schema'
    $schemaNC = (Get-ADRootDSE -Server $Domain).schemaNamingContext
    $head = Get-ADObject -Identity $schemaNC -Server $Domain -Properties objectVersion, whenCreated
    $created = [datetime]$head.whenCreated
    $objects = @(Get-ADObject -SearchBase $schemaNC -Server $Domain -LDAPFilter '(|(objectClass=attributeSchema)(objectClass=classSchema))' `
        -Properties lDAPDisplayName, attributeID, governsID, whenCreated, objectClass, isDefunct)
    $rows = foreach ($o in $objects) {
        $isClass = @($o.objectClass) -contains 'classSchema'
        $oid = if ($isClass) { "$($o.governsID)" } else { "$($o.attributeID)" }
        $name = "$($o.lDAPDisplayName)"
        $product = $null
        foreach ($k in $script:FMPKnownExtensions.Keys) { if ($name -match $script:FMPKnownExtensions[$k]) { $product = $k; break } }
        $added = ([datetime]$o.whenCreated -gt $created.AddDays(1))
        [pscustomobject]@{
            Name                     = $name
            Kind                     = if ($isClass) { 'Class' } else { 'Attribute' }
            OID                      = $oid
            Created                  = $o.whenCreated
            # The base schema includes X.500 and RFC attributes (2.5.4.3 is cn), so an OID
            # outside Microsoft's arc marks an extension only when it arrived after the forest.
            NonMicrosoftOid          = $added -and -not $oid.StartsWith('1.2.840.113556.')
            AddedAfterForestCreation = $added
            KnownProduct             = $product
            IsDefunct                = [bool]$o.isDefunct
        }
    }
    $version = [int]$head.objectVersion
    $doc = [ordered]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        SchemaVersion       = $version
        SchemaVersionName   = if ($script:FMPSchemaVersions.ContainsKey($version)) { $script:FMPSchemaVersions[$version] } else { 'Unknown' }
        SchemaCreated       = $created.ToString('o')
        AttributeCount      = @($rows | Where-Object Kind -eq 'Attribute').Count
        ClassCount          = @($rows | Where-Object Kind -eq 'Class').Count
        NonMicrosoftCount   = @($rows | Where-Object NonMicrosoftOid).Count
        KnownProducts       = Get-FMPCountTable -Rows @($rows | Where-Object KnownProduct) -Property KnownProduct
        NonMicrosoft        = @($rows | Where-Object NonMicrosoftOid | Sort-Object Name)
        AddedAfterForest    = @($rows | Where-Object AddedAfterForestCreation | Sort-Object Created, Name | Select-Object Name, Kind, OID, Created, KnownProduct)
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $path 'SchemaExtensions.json') -Depth 6
    [pscustomobject]$doc
}

function Get-FMPDHCPInventory {
    <#
    .SYNOPSIS
        DHCP servers authorized in the forest, with their scopes, reservations, server and scope options,
        failover relationships, DNS registration settings and the registration account's name
        (Book 01 stream 9, Tier B; Book 08, Chapters 04 and 05).
    .DESCRIPTION
        The authorized-server list comes from the configuration partition (default read).
        Each server's own data needs membership of its DHCP Users group; a server that can't
        be read is recorded with the error and the run continues.
    .OUTPUTS
        DHCP\DHCPInventory.json, DHCP\DHCPScopes.csv, DHCP\DHCPReservations.csv
    .EXAMPLE
        Get-FMPDHCPInventory -OutputPath D:\Assessment\run1 -Domain contoso.example -DhcpServer dhcp01.contoso.example

        Tier B. Reads only the named server; without -DhcpServer it reads every server authorized
        in the forest.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [string[]]$DhcpServer
    )
    Assert-FMPCommand -Name 'Get-DhcpServerInDC' -Module 'DhcpServer'
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $path = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'DHCP'
    $authorized = @(Get-DhcpServerInDC | Select-Object DnsName, IPAddress)
    if (-not $DhcpServer) { $DhcpServer = @($authorized | ForEach-Object { $_.DnsName }) }

    $servers = foreach ($s in $DhcpServer) {
        try {
            $scopes = @(Get-DhcpServerv4Scope -ComputerName $s -ErrorAction Stop)
            $scopeRows = foreach ($sc in $scopes) {
                $res = @(Get-DhcpServerv4Reservation -ComputerName $s -ScopeId $sc.ScopeId -ErrorAction SilentlyContinue)
                $scopeId = $sc.ScopeId
                # Options set on the scope itself (they override the server's), and the scope's DNS
                # registration settings (Book 08, Chapters 04 and 05).
                $scOpts = Get-FMPReadOrError { @(Get-DhcpServerv4OptionValue -ComputerName $s -ScopeId $scopeId -ErrorAction Stop | Select-Object OptionId, Name, @{ N = 'Value'; E = { @($_.Value) } }) }
                $scDns = Get-FMPReadOrError { Get-DhcpServerv4DnsSetting -ComputerName $s -ScopeId $scopeId -ErrorAction Stop | Select-Object DynamicUpdates, DeleteDnsRROnLeaseExpiry, NameProtection }
                [pscustomobject]@{
                    Server = $s; ScopeId = "$($sc.ScopeId)"; Name = $sc.Name; SubnetMask = "$($sc.SubnetMask)"
                    StartRange = "$($sc.StartRange)"; EndRange = "$($sc.EndRange)"; State = "$($sc.State)"
                    LeaseDuration = "$($sc.LeaseDuration)"; ReservationCount = $res.Count
                    Reservations = @($res | ForEach-Object { [pscustomobject]@{ IPAddress = "$($_.IPAddress)"; ClientId = $_.ClientId; Name = $_.Name; Description = $_.Description } })
                    Options = $scOpts; DnsSetting = $scDns
                }
            }
            $v6 = Get-FMPReadOrError { @(Get-DhcpServerv6Scope -ComputerName $s -ErrorAction Stop | Select-Object @{ N = 'Prefix'; E = { "$($_.Prefix)" } }, Name, State) }
            $opts = Get-FMPReadOrError { @(Get-DhcpServerv4OptionValue -ComputerName $s -ErrorAction Stop | Select-Object OptionId, Name, @{ N = 'Value'; E = { @($_.Value) } }) }
            $fo = Get-FMPReadOrError { @(Get-DhcpServerv4Failover -ComputerName $s -ErrorAction Stop | Select-Object Name, PartnerServer, Mode, State, @{ N = 'ScopeId'; E = { @($_.ScopeId | ForEach-Object { "$_" }) } }) }
            $dnsSet = Get-FMPReadOrError { Get-DhcpServerv4DnsSetting -ComputerName $s -ErrorAction Stop | Select-Object DynamicUpdates, DeleteDnsRROnLeaseExpiry, NameProtection }
            # The account the server registers DNS records with: its name only, never a secret.
            $cred = Get-FMPReadOrError { Get-DhcpServerDnsCredential -ComputerName $s -ErrorAction Stop | Select-Object UserName, DomainName }
            [pscustomobject]@{ Server = $s; Readable = $true; Error = $null; ScopeCount = @($scopeRows).Count; Scopes = @($scopeRows); V6Scopes = $v6; ServerOptions = $opts; Failover = $fo; DnsSetting = $dnsSet; DnsCredential = $cred }
        } catch {
            [pscustomobject]@{ Server = $s; Readable = $false; Error = $_.Exception.Message; ScopeCount = $null; Scopes = @(); V6Scopes = $null; ServerOptions = $null; Failover = $null; DnsSetting = $null; DnsCredential = $null }
        }
    }
    $allScopes = @($servers | ForEach-Object { $_.Scopes })
    $doc = [ordered]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        AuthorizedServers   = $authorized
        ServerCount         = @($servers).Count
        ReadableServerCount = @($servers | Where-Object Readable).Count
        ScopeCount          = $allScopes.Count
        ReservationCount    = (@($allScopes | ForEach-Object { $_.ReservationCount }) | Measure-Object -Sum).Sum
        Servers             = @($servers)
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $path 'DHCPInventory.json') -Depth 8
    Write-FMPCsv -InputObject @($allScopes | Select-Object Server, ScopeId, Name, SubnetMask, StartRange, EndRange, State, LeaseDuration, ReservationCount) -Path (Join-Path $path 'DHCPScopes.csv')
    Write-FMPCsv -InputObject @($allScopes | ForEach-Object { $sc = $_; $sc.Reservations | Select-Object @{ N = 'Server'; E = { $sc.Server } }, @{ N = 'ScopeId'; E = { $sc.ScopeId } }, * }) -Path (Join-Path $path 'DHCPReservations.csv')
    [pscustomobject]$doc
}

function Get-FMPKerberosSpnMap {
    <#
    .SYNOPSIS
        The Kerberos SPN map (Book 01 stream 11): every SPN in every domain of the forest, by
        service class, with duplicates and orphans.
    .DESCRIPTION
        A duplicate SPN (on more than one object, case-insensitive) breaks Kerberos and pushes
        clients to NTLM. An orphan is an SPN with any of these reasons, each in the Reason
        column: Disabled (the account is disabled), NoRecentLogon (no logon in -OrphanDays,
        default 180, or never), the same definitions as the program's Spec1-D1.5 script in
        Book 06 Runbook R02; and HostNotFound (no computer object in the forest has the SPN's
        host as its name or DNS host name, and DNS has no record of it either), usually a
        decommissioned host or a retired alias. Hosts that aren't host names (kadmin/changepw,
        the replication SPNs' GUIDs, IP addresses) aren't checked. DNS is asked with
        Resolve-DnsName -DnsOnly, once per host, only for hosts the directory doesn't know;
        -SkipDnsCheck leaves DNS out, and then a host missing from the directory is reported
        with HostInDns 'not checked', not as an orphan; so is every host past -MaxDnsLookups
        (10,000). The lookups run after each partition's directory read, never inside it, so a
        slow resolver can't hold the ADWS enumeration open. Default read rights.

        Each domain is read one partition at a time, paged and retried, and every SPN row is
        streamed to disk; duplicates and counts are kept in hash tables, so memory grows with
        the number of distinct SPNs, not with the size of each row.
    .OUTPUTS
        Kerberos\KerberosSpnMap.json, KerberosSpnSummary.json, SpnByServiceClass.csv,
        SpnDuplicates.csv, SpnOrphans.csv
    .EXAMPLE
        Get-FMPKerberosSpnMap -OutputPath D:\Assessment\run1 -Domain contoso.example, child.contoso.example -RootDomain contoso.example -OrphanDays 180
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string[]]$Domain,
        [string]$RootDomain,
        [int]$OrphanDays = 180,
        [datetime]$AsOf = (Get-Date),
        [switch]$SkipDnsCheck,
        [string]$DnsServer,
        # At most this many DNS lookups (one per distinct host the directory doesn't know).
        [int]$MaxDnsLookups = 10000
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    if (-not $Domain) { $Domain = @((Get-ADForest).Domains) }
    if (-not $RootDomain) { $RootDomain = $Domain[0] }
    $path = Get-FMPDomainPath -OutputPath $OutputPath -Domain $RootDomain -Area 'Kerberos'

    # Every computer's name and DNS host name in the domains read: a light, paged read.
    $knownHosts = @{}
    foreach ($d in $Domain) {
        foreach ($p in @(Get-FMPAdPartition -Domain $d)) {
            $names = Invoke-FMPWithRetry -Activity "SPN hosts ($d) $($p.Label)" -ScriptBlock {
                @(Get-ADObject -LDAPFilter '(objectCategory=computer)' -SearchBase $p.SearchBase -SearchScope $p.SearchScope -Server $d -Properties dNSHostName -ResultPageSize (Get-FMPRunContext).PageSize -ErrorAction Stop |
                        & { process { "$($_.Name)"; "$($_.dNSHostName)" } })
            }
            foreach ($n in $names) { if ($n) { $knownHosts[$n.ToLowerInvariant()] = $true } }
        }
    }
    $dnsAvailable = (-not $SkipDnsCheck) -and (Test-FMPCommand -Name 'Resolve-DnsName')
    $dnsCache = @{}
    $dnsCapped = [ref]$false
    $dnsTracker = Initialize-FMPProgress -Activity 'SPN map: DNS lookups for hosts with no computer object' -Id 3
    $hostState = {
        # 'Directory', 'Dns', 'NotFound', 'NotInDirectory' (DNS not asked) or $null (not a host name).
        param([string]$h)
        if (-not $h -or $h -eq 'changepw' -or $h -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' -or $h -match '^\d{1,3}(\.\d{1,3}){3}$' -or $h.Contains(':')) { return $null }
        $short = $h.Split('.')[0]
        if ($knownHosts.ContainsKey($h) -or $knownHosts.ContainsKey($short)) { return 'Directory' }
        if (-not $dnsAvailable) { return 'NotInDirectory' }
        if (-not $dnsCache.ContainsKey($h)) {
            if ($dnsCache.Count -ge $MaxDnsLookups) {
                if (-not $dnsCapped.Value) { $dnsCapped.Value = $true; Write-FMPLog -Level WARN -Message "SPN map: -MaxDnsLookups ($MaxDnsLookups) reached; further hosts missing from the directory are 'not checked'" }
                return 'NotInDirectory'
            }
            Step-FMPProgress -Tracker $dnsTracker
            $dnsArgs = @{ Name = $h; DnsOnly = $true; QuickTimeout = $true; ErrorAction = 'Stop' }
            if ($DnsServer) { $dnsArgs.Server = $DnsServer }
            $found = $false
            try { $found = @(Resolve-DnsName @dnsArgs | Where-Object { $_.Type -in 'A', 'AAAA', 'CNAME' }).Count -gt 0 } catch { $found = $false }
            $dnsCache[$h] = $found
        }
        if ($dnsCache[$h]) { 'Dns' } else { 'NotFound' }
    }

    $partsDir = Initialize-FMPPath -Path (Join-Path $path '_parts\Spns')
    $cutoff = $AsOf.ToUniversalTime().AddDays(-$OrphanDays)

    $holders = @{}      # spn (lower case) -> first holder, or a list once a second holder appears
    $firstSpelling = @{}
    $byClass = @{}      # class -> @{ SpnCount; Accounts }
    $accounts = @{}
    $userSpns = [long]0
    $orphans = [System.Collections.Generic.List[object]]::new()
    $partFiles = [System.Collections.Generic.List[string]]::new()
    $spnCount = [long]0
    $js = Get-FMPFastJson

    foreach ($d in $Domain) {
        $partitions = @(Get-FMPAdPartition -Domain $d)
        $tracker = Initialize-FMPProgress -Activity "SPN map ($d)" -PartitionCount $partitions.Count
        $i = 0
        foreach ($p in $partitions) {
            $i++
            $tracker.Partition = $p.Label
            $partFile = Join-Path $partsDir ('{0}-{1:D4}.jsonl' -f ($d -replace '[^A-Za-z0-9.-]', '_'), $i)
            $before = $tracker.Count
            # The directory read comes first, with nothing slow inside it: a DNS lookup per row
            # would hold the ADWS enumeration open. Hosts are checked once the partition is read.
            $raw = Invoke-FMPWithRetry -Activity "SPN map ($d) $($p.Label)" -ScriptBlock {
                $tracker.Count = $before
                $r = [System.Collections.Generic.List[object]]::new()
                $seen = @{ n = 0 }
                Get-ADObject -LDAPFilter '(servicePrincipalName=*)' -SearchBase $p.SearchBase -SearchScope $p.SearchScope -Server $d -ErrorAction Stop `
                    -Properties servicePrincipalName, sAMAccountName, objectClass, userAccountControl, lastLogonTimestamp, dNSHostName -ResultPageSize (Get-FMPRunContext).PageSize |
                    & { process {
                            $o = $_
                            $r.Add([pscustomobject]@{ Spns = @($o.servicePrincipalName); Account = $o.sAMAccountName; AccountClass = "$(@($o.objectClass)[-1])"; Uac = $o.userAccountControl; Llt = $o.lastLogonTimestamp })
                            $seen.n += @($o.servicePrincipalName).Count
                            if ($seen.n -ge 256) { Step-FMPProgress -Tracker $tracker -By $seen.n; $seen.n = 0 }
                        } }
                if ($seen.n) { Step-FMPProgress -Tracker $tracker -By $seen.n }
                $r
            }
            $local = @{ Rows = [System.Collections.Generic.List[object]]::new() }
            $w = Open-FMPStream -Path $partFile
            try {
                foreach ($o in $raw) {
                    $enabled = if ($null -ne $o.Uac) { -not (([int64]$o.Uac -band 0x2) -eq 0x2) } else { $null }
                    $last = if ($o.Llt -and [int64]$o.Llt -gt 0) { [datetime]::FromFileTimeUtc([int64]$o.Llt) } else { $null }
                    foreach ($spn in $o.Spns) {
                        $class, $rest = "$spn".Split('/', 2)
                        $hostPart = if ($rest) { ($rest.Split('/')[0]).Split(':')[0].ToLowerInvariant() } else { $null }
                        $state = & $hostState $hostPart
                        $reasons = @()
                        if ($enabled -eq $false) { $reasons += 'Disabled' }
                        if ((-not $last) -or ($last -lt $cutoff)) { $reasons += 'NoRecentLogon' }
                        if ($state -eq 'NotFound') { $reasons += 'HostNotFound' }
                        $row = [ordered]@{
                            Spn          = "$spn"
                            ServiceClass = $class
                            Host         = $hostPart
                            Account      = $o.Account
                            AccountClass = $o.AccountClass
                            Domain       = $d
                            Enabled      = $enabled
                            LastLogonUtc = if ($last) { $last.ToString('o') } else { $null }
                            HostInDirectory = if ($null -eq $state) { $null } else { $state -eq 'Directory' }
                            HostInDns    = switch ($state) { 'Dns' { $true } 'NotFound' { $false } 'NotInDirectory' { 'not checked' } default { $null } }
                            Orphan       = $reasons.Count -gt 0
                            Reason       = $reasons -join '; '
                        }
                        if ($js) { $w.WriteLine($js.Serialize($row)) } else { $w.WriteLine((ConvertTo-Json -InputObject $row -Compress)) }
                        $local.Rows.Add($row)
                    }
                }
            } finally { Close-FMPStream $w }
            # Merged only once the partition has succeeded, so a retry never counts twice.
            foreach ($row in $local.Rows) {
                $spnCount++
                $holder = "$($row.Domain)\$($row.Account)"
                $key = $row.Spn.ToLowerInvariant()
                if (-not $holders.ContainsKey($key)) { $holders[$key] = $holder; $firstSpelling[$key] = $row.Spn }
                else {
                    $h = $holders[$key]
                    if ($h -is [string]) { if ($h -ne $holder) { $list = [System.Collections.Generic.List[string]]::new(); $list.Add($h); $list.Add($holder); $holders[$key] = $list } }
                    else { $h.Add($holder) }
                }
                if (-not $byClass.ContainsKey($row.ServiceClass)) { $byClass[$row.ServiceClass] = @{ SpnCount = [long]0; Accounts = @{} } }
                $byClass[$row.ServiceClass].SpnCount++
                $byClass[$row.ServiceClass].Accounts[$holder] = $true
                $accounts[$holder] = $true
                if ($row.AccountClass -ne 'computer') { $userSpns++ }
                if ($row.Orphan) { $orphans.Add([pscustomobject]$row) }
            }
            $partFiles.Add($partFile)
            $tracker.PartitionsDone++
        }
        $null = Complete-FMPProgress -Tracker $tracker
    }

    if ($dnsCache.Count) { $null = Complete-FMPProgress -Tracker $dnsTracker -Note "$(@($dnsCache.Values | Where-Object { -not $_ }).Count) not found" }
    $dupes = @(foreach ($k in ($holders.Keys | Sort-Object)) {
            $h = $holders[$k]
            if ($h -isnot [string]) {
                [pscustomobject][ordered]@{ Spn = $firstSpelling[$k]; Holders = (@($h | Sort-Object -Unique) -join '; '); Count = $h.Count }
            }
        })
    $classRows = @($byClass.Keys | ForEach-Object { [pscustomobject][ordered]@{ ServiceClass = $_; SpnCount = $byClass[$_].SpnCount; AccountCount = $byClass[$_].Accounts.Count } } |
            Sort-Object @{ E = 'SpnCount'; Descending = $true }, ServiceClass)
    $doc = [ordered]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        Domains             = @($Domain)
        OrphanDays          = $OrphanDays
        SpnCount            = $spnCount
        AccountCount        = $accounts.Count
        UserAccountSpnCount = $userSpns
        DuplicateCount      = $dupes.Count
        OrphanCount         = $orphans.Count
        OrphansByReason     = [ordered]@{
            Disabled      = @($orphans | Where-Object { $_.Reason -match 'Disabled' }).Count
            NoRecentLogon = @($orphans | Where-Object { $_.Reason -match 'NoRecentLogon' }).Count
            HostNotFound  = @($orphans | Where-Object { $_.Reason -match 'HostNotFound' }).Count
        }
        HostsCheckedInDns   = $dnsCache.Count
        DnsLookupsCapped    = $dnsCapped.Value
        DnsChecked          = $dnsAvailable
        ByServiceClass      = $classRows
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $path 'KerberosSpnSummary.json') -Depth 5
    # KerberosSpnMap.json keeps its shape (the summary fields and every row under Spns), written
    # as a stream: the rows are copied from the part files, never held as one string.
    $rowsFile = Join-Path $partsDir 'Spns.json'
    Join-FMPJsonParts -Path $rowsFile -PartPath $partFiles.ToArray()
    Join-FMPJsonDocument -Path (Join-Path $path 'KerberosSpnMap.json') -Header $doc -ArrayName 'Spns' -ArrayPath $rowsFile -Depth 5
    Write-FMPCsv -InputObject $classRows -Path (Join-Path $path 'SpnByServiceClass.csv')
    Write-FMPCsv -InputObject $dupes -Path (Join-Path $path 'SpnDuplicates.csv')
    Write-FMPCsv -InputObject $orphans.ToArray() -Path (Join-Path $path 'SpnOrphans.csv')
    $doc['ObjectCount'] = $spnCount
    [pscustomobject]$doc
}

function ConvertFrom-FMPLdapEvent {
    # Event 2889 (one unsigned or clear-text bind, logged when "16 LDAP Interface Events" is 2)
    # and event 2887 (the 24-hour summary). Field order as these events are commonly parsed:
    # 2889 is client address, identity, bind type (0 unsigned SASL, 1 simple bind without TLS).
    param([Parameter(Mandatory)]$Event, [Parameter(Mandatory)][string]$DomainController)
    $p = @($Event.Properties | ForEach-Object { $_.Value })
    if ($Event.Id -eq 2889) {
        $addr = "$($p[0])"
        $ip = if ($addr -match '^\[?([0-9a-fA-F:\.]+?)\]?:\d+$') { $Matches[1] } else { $addr }
        [pscustomobject]@{
            EventId = 2889; DomainController = $DomainController; TimeCreated = $Event.TimeCreated
            ClientAddress = $ip; Identity = "$($p[1])"
            BindType = switch ("$($p[2])") { '0' { 'Unsigned SASL' } '1' { 'Simple bind without TLS' } default { "Unknown ($($p[2]))" } }
        }
    } elseif ($Event.Id -eq 2887) {
        [pscustomobject]@{
            EventId = 2887; DomainController = $DomainController; TimeCreated = $Event.TimeCreated
            SimpleBindsWithoutTls = $p[0]; UnsignedSaslBinds = $p[1]
        }
    }
}

function Get-FMPLdapBindingEvent {
    <#
    .SYNOPSIS
        LDAP binding evidence from domain controller logs (Book 01 stream 11, Tier B): who
        still binds without signing or in clear text.
    .DESCRIPTION
        Reads events 2887 and 2889 from each DC's Directory Service log. Needs Event Log
        Readers on the DCs. Event 2889 appears only after the directory team sets the
        "16 LDAP Interface Events" diagnostic level to 2; the kit never changes it.
    .OUTPUTS
        Ldap\LdapBindings.json, Ldap\LdapBindingClients.csv
    .EXAMPLE
        Get-FMPLdapBindingEvent -OutputPath D:\Assessment\run1 -Domain contoso.example -Days 7

        Tier B: needs Event Log Readers on the domain controllers.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Domain = (Get-ADDomain).DNSRoot,
        [int]$Days = 7,
        [int]$MaxEvents = 5000,
        [datetime]$AsOf = (Get-Date)
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $path = Get-FMPDomainPath -OutputPath $OutputPath -Domain $Domain -Area 'Ldap'
    $dcs = @(Get-ADDomainController -Filter * -Server $Domain | ForEach-Object { $_.HostName })
    $events = @()
    $perDc = foreach ($dc in $dcs) {
        try {
            $raw = @(Get-WinEvent -ComputerName $dc -MaxEvents $MaxEvents -ErrorAction Stop -FilterHashtable @{
                    LogName = 'Directory Service'; Id = 2887, 2889; StartTime = $AsOf.AddDays(-$Days) })
            $parsed = @($raw | ForEach-Object { ConvertFrom-FMPLdapEvent -Event $_ -DomainController $dc })
            $events += $parsed
            [pscustomobject]@{ DomainController = $dc; Readable = $true; EventCount = $parsed.Count; Error = $null }
        } catch {
            $msg = $_.Exception.Message
            # "No events were found" is a readable log with nothing in the window.
            $none = $msg -match '(?i)no events were found'
            [pscustomobject]@{ DomainController = $dc; Readable = $none; EventCount = 0; Error = if ($none) { $null } else { $msg } }
        }
    }
    $binds = @($events | Where-Object EventId -eq 2889)
    $clients = @($binds | Group-Object ClientAddress, Identity, BindType | ForEach-Object {
            $g = $_.Group
            [pscustomobject]@{
                ClientAddress = $g[0].ClientAddress; Identity = $g[0].Identity; BindType = $g[0].BindType; Count = $g.Count
                FirstSeen = ($g | Measure-Object TimeCreated -Minimum).Minimum; LastSeen = ($g | Measure-Object TimeCreated -Maximum).Maximum
                DomainControllers = (@($g | ForEach-Object { $_.DomainController } | Sort-Object -Unique) -join '; ')
            } } | Sort-Object Count -Descending)
    $doc = [ordered]@{
        AssessmentTimestamp = (Get-Date -Format 'o')
        Domain              = $Domain
        WindowDays          = $Days
        DomainControllers   = @($perDc)
        Summaries           = @($events | Where-Object EventId -eq 2887)
        ClientCount         = $clients.Count
        Clients             = $clients
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $path 'LdapBindings.json') -Depth 6
    Write-FMPCsv -InputObject $clients -Path (Join-Path $path 'LdapBindingClients.csv')
    [pscustomobject]$doc
}

function Invoke-FMPADAssessment {
    <#
    .SYNOPSIS
        Runs every directory collector for the forest and returns one step record per collector.
    .DESCRIPTION
        Forest-wide collectors (topology, PKI, schema, the SPN map and, at Tier B, DHCP) run
        once against the forest root and write under its folder. Per-domain collectors (OUs,
        GPOs, DNS, computers, users and groups, trusts and, at Tier B, LDAP binding events)
        run for each domain. A failed step is recorded, not fatal. Invoke-FMPStartKit.ps1
        writes the run's manifest after this returns.
    .EXAMPLE
        Invoke-FMPADAssessment -OutputPath D:\Assessment\run1 -Tier A
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string[]]$Domain,
        [string]$Forest,
        [ValidateSet('A', 'B')][string]$Tier = 'A',
        [int]$StaleThresholdDays = 90,
        [datetime]$AsOf = (Get-Date),
        [switch]$ResolveIPv4
    )
    Assert-FMPCommand -Name 'Get-ADForest' -Module 'ActiveDirectory'
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $adForest = if ($Forest) { Get-ADForest -Server $Forest } else { Get-ADForest }
    $rootDomain = $adForest.RootDomain
    if (-not $Domain) { $Domain = @($adForest.Domains) }

    $steps = @()
    $steps += Invoke-FMPStep 'Forest topology' { Get-FMPForestTopology -Domain $rootDomain -OutputPath $root }
    $steps += Invoke-FMPStep 'Schema extensions' { Get-FMPSchemaExtensions -Domain $rootDomain -OutputPath $root }
    $steps += Invoke-FMPStep 'Certificate Services' { Get-FMPPKIAssessment -Domain $rootDomain -OutputPath $root }
    $steps += Invoke-FMPStep 'Kerberos SPN map' { Get-FMPKerberosSpnMap -Domain $Domain -RootDomain $rootDomain -OutputPath $root -AsOf $AsOf }
    if ($Tier -eq 'B') { $steps += Invoke-FMPStep 'DHCP' { Get-FMPDHCPInventory -Domain $rootDomain -OutputPath $root } }
    foreach ($d in $Domain) {
        $steps += Invoke-FMPStep "OU hierarchy ($d)" { Get-FMPOUHierarchy -Domain $d -OutputPath $root }
        $steps += Invoke-FMPStep "Group Policy ($d)" { Get-FMPGPOInventory -Domain $d -OutputPath $root }
        $steps += Invoke-FMPStep "DNS ($d)" { Get-FMPDNSAssessment -Domain $d -OutputPath $root -StaleThresholdDays $StaleThresholdDays -AsOf $AsOf }
        $steps += Invoke-FMPStep "Computers ($d)" { Get-FMPComputerInventory -Domain $d -OutputPath $root -StaleThresholdDays $StaleThresholdDays -AsOf $AsOf -ResolveIPv4:$ResolveIPv4 }
        $steps += Invoke-FMPStep "Users ($d)" { Get-FMPUserInventory -Domain $d -RootDomain $rootDomain -OutputPath $root -StaleThresholdDays $StaleThresholdDays -AsOf $AsOf }
        $steps += Invoke-FMPStep "Groups ($d)" { Get-FMPGroupInventory -Domain $d -OutputPath $root }
        $steps += Invoke-FMPStep "Trusts ($d)" { Get-FMPTrustMap -Domain $d -OutputPath $root }
        if ($Tier -eq 'B') { $steps += Invoke-FMPStep "LDAP binding events ($d)" { Get-FMPLdapBindingEvent -Domain $d -OutputPath $root -AsOf $AsOf } }
    }
    $steps
}

function Compare-FMPAssessments {
    <#
    .SYNOPSIS
        Compares two runs of one domain folder: file hashes, then added and removed objects by stable key.
    .EXAMPLE
        Compare-FMPAssessments -BaselinePath 'D:\Assessment\2026-10-13-0200-host-tierA\contoso.example' `
                               -CurrentPath  'D:\Assessment\2026-10-20-0200-host-tierA\contoso.example'
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
        'PKI\PKISecurityReport.json'     = 'Finding', 'Template'
    }
    $hashOnly = 'Forest\ForestTopology.json', 'Trusts\TrustMap.json'

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
            # A key of several properties (a finding and its template) is joined with ' | '.
            $keyOf = { param($o) (@($key | ForEach-Object { "$($o.$_)" }) -join ' | ') }
            $bKeys = [System.Collections.Generic.HashSet[string]]::new([string[]]@((Get-Content $b -Raw | ConvertFrom-Json) | ForEach-Object { & $keyOf $_ }))
            $cKeys = [System.Collections.Generic.HashSet[string]]::new([string[]]@((Get-Content $c -Raw | ConvertFrom-Json) | ForEach-Object { & $keyOf $_ }))
            $drift += [pscustomobject]@{
                File    = $file
                Status  = 'Changed'
                Added   = @($cKeys | Where-Object { -not $bKeys.Contains($_) } | Sort-Object)
                Removed = @($bKeys | Where-Object { -not $cKeys.Contains($_) } | Sort-Object)
            }
        } else {
            # Files with an embedded timestamp always differ by hash; review their content.
            $drift += [pscustomobject]@{ File = $file; Status = 'Changed (review content)'; Added = $null; Removed = $null }
        }
    }
    $drift
}

function Get-FMPCountTable {
    param([object[]]$Rows, [string]$Property)
    $o = [ordered]@{}
    foreach ($g in (@($Rows) | Group-Object -Property $Property | Sort-Object Name)) {
        $name = if ("$($g.Name)" -eq '') { 'Unknown' } else { "$($g.Name)" }
        $o[$name] = $g.Count
    }
    $o
}

function Read-FMPJsonFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

function Read-FMPCsvFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return @() }
    @(Import-Csv -LiteralPath $Path)
}

function Get-FMPStartKitSummary {
    <#
    .SYNOPSIS
        The one-page summary: the headline counts for a run, from the files it wrote.
    .DESCRIPTION
        Reads only the run's own output, so it can be re-run offline. A count whose source
        file is missing is reported as 'not collected', never as zero. Writes
        Summary\StartKitSummary.json and Summary\StartKitSummary.md.
    .EXAMPLE
        Get-FMPStartKitSummary -RunPath D:\Assessment\2026-10-13-0200-host-tierA

        Rebuilds Summary\StartKitSummary.md and .json for an earlier run, from its files alone.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath)
    $root = Resolve-FMPOutputRoot -OutputPath $RunPath
    $domainDirs = @(Get-ChildItem -LiteralPath $root -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'Objects') -PathType Container -ErrorAction SilentlyContinue })
    $forestDir = @(Get-ChildItem -LiteralPath $root -Directory | Where-Object { Test-Path -LiteralPath (Join-Path (Join-Path $_.FullName 'Forest') 'ForestTopology.json') }) | Select-Object -First 1

    $nc = 'not collected'
    $sumOrNc = {
        param($values)
        $v = @($values | Where-Object { $null -ne $_ })
        if ($v.Count -eq 0) { $nc } else { ($v | Measure-Object -Sum).Sum }
    }
    $topo = if ($forestDir) { Read-FMPJsonFile (Join-Path (Join-Path $forestDir.FullName 'Forest') 'ForestTopology.json') } else { $null }
    # Counts come from the small *Counts.json files the collectors write; a run from an older
    # kit without them is counted from its inventories, read one object at a time.
    $objFile = { param($dd, $name) Join-Path (Join-Path $dd.FullName 'Objects') $name }
    $countOf = {
        param($dd, $countsFile, $inventoryFile, $field, $filter)
        $cf = & $objFile $dd $countsFile
        if (Test-Path -LiteralPath $cf) { $c = Read-FMPJsonFile $cf; if ($c.PSObject.Properties[$field]) { return [long]$c.$field } }
        $inv = & $objFile $dd $inventoryFile
        if (-not (Test-Path -LiteralPath $inv)) { return $null }
        $n = [long]0
        foreach ($o in (Read-FMPJsonArray -Path $inv)) { if (-not $filter -or (& $filter $o)) { $n++ } }
        $n
    }
    $haveComputers = @($domainDirs | Where-Object { Test-Path -LiteralPath (& $objFile $_ 'ComputerInventory.json') }).Count -gt 0
    $isServer = { param($o) "$($o.OperatingSystem)" -match '(?i)server' }

    $trustPairs = @{}
    $haveTrusts = $false
    foreach ($dd in $domainDirs) {
        $tm = Read-FMPJsonFile (Join-Path (Join-Path $dd.FullName 'Trusts') 'TrustMap.json')
        if ($tm) {
            $haveTrusts = $true
            foreach ($t in @($tm.Trusts)) {
                $pair = @("$($tm.Domain)".ToLowerInvariant(), "$($t.Name)".ToLowerInvariant()) | Sort-Object
                $trustPairs[($pair -join '|')] = $t.IntraForest
            }
        }
    }
    $zones = @{}
    $haveDns = $false
    foreach ($dd in $domainDirs) {
        $dns = Read-FMPJsonFile (Join-Path (Join-Path $dd.FullName 'DNS') 'DNSInventory.json')
        if ($dns) { $haveDns = $true; foreach ($z in @($dns.Zones)) { $zones["$($z.ZoneName)".ToLowerInvariant()] = $true } }
    }
    $pki = if ($forestDir) { Read-FMPJsonFile (Join-Path (Join-Path $forestDir.FullName 'PKI') 'PKIInventory.json') } else { $null }
    $spn = if ($forestDir) {
        $sf = Join-Path (Join-Path $forestDir.FullName 'Kerberos') 'KerberosSpnSummary.json'
        if (Test-Path -LiteralPath $sf) { Read-FMPJsonFile $sf } else { Read-FMPJsonFile (Join-Path (Join-Path $forestDir.FullName 'Kerberos') 'KerberosSpnMap.json') }
    } else { $null }
    $dhcp = if ($forestDir) { Read-FMPJsonFile (Join-Path (Join-Path $forestDir.FullName 'DHCP') 'DHCPInventory.json') } else { $null }
    $schema = if ($forestDir) { Read-FMPJsonFile (Join-Path (Join-Path $forestDir.FullName 'Schema') 'SchemaExtensions.json') } else { $null }
    $sql = Read-FMPJsonFile (Join-Path (Join-Path $root 'SQL') 'SqlEstateSummary.json')
    $svc = Read-FMPJsonFile (Join-Path (Join-Path $root 'ServerServices') 'ServerServiceSummary.json')
    $nps = Read-FMPJsonFile (Join-Path (Join-Path $root 'NPS') 'NpsSummary.json')
    $tx = Read-FMPJsonFile (Join-Path (Join-Path $root 'transaction-profiles') 'TransactionSummary.json')
    $txRead = $tx -and $tx.Status -eq 'Read'
    $attr = Read-FMPJsonFile (Join-Path (Join-Path $root 'AttributeSurvey') 'AttributeSurvey.json')
    $waves = Read-FMPJsonFile (Join-Path (Join-Path $root 'Waves') 'WaveSummary.json')

    # Unconstrained delegation outside the domain controllers, which are expected to have it.
    # Both come from the delegation reports, which hold only delegating objects.
    $haveUsers = @($domainDirs | Where-Object { Test-Path -LiteralPath (& $objFile $_ 'UserInventory.json') }).Count -gt 0
    $ucHosts = @($domainDirs | ForEach-Object { Read-FMPCsvFile (& $objFile $_ 'DelegationReport.csv') } |
            Where-Object { $_.DelegationType -eq 'Unconstrained' -and "$($_.IsDomainController)" -ne 'True' })
    $ucAccounts = @($domainDirs | ForEach-Object { Read-FMPCsvFile (& $objFile $_ 'UserDelegationReport.csv') } | Where-Object DelegationType -eq 'Unconstrained')
    $sqlCsv = Join-Path (Join-Path $root 'SQL') 'SqlEstate.csv'
    $sqlRows = if (Test-Path -LiteralPath $sqlCsv) { @(Read-FMPCsvFile $sqlCsv) } else { $null }
    $sqlUc = @()
    if ($null -ne $sqlRows) {
        $ucHostNames = @{}
        foreach ($c in $ucHosts) { foreach ($n in @($c.Name, $c.DNSHostName)) { if ($n) { $ucHostNames["$n".ToLowerInvariant()] = $true } } }
        $ucAccountNames = @{}
        foreach ($u in $ucAccounts) { $ucAccountNames["$($u.SamAccountName)".ToLowerInvariant()] = $true }
        $sqlUc = @($sqlRows | ForEach-Object {
                $row = $_
                $server = "$($row.ServerName)".ToLowerInvariant()
                $short = ($server -split '\.')[0]
                $accts = @("$($row.ServiceAccount)" -split ';' | Where-Object { $_ } | ForEach-Object { ($_ -split '\\')[-1].ToLowerInvariant() })
                $why = @()
                if ($ucHostNames.ContainsKey($server) -or $ucHostNames.ContainsKey($short)) { $why += 'host' }
                if (@($accts | Where-Object { $ucAccountNames.ContainsKey($_) }).Count -gt 0) { $why += 'service account' }
                if ($why) {
                    [pscustomobject]@{ ServerName = $row.ServerName; InstanceName = $row.InstanceName; ServiceAccount = $row.ServiceAccount; UnconstrainedOn = $why -join ' and ' }
                }
            })
        Write-FMPCsv -InputObject $sqlUc -Path (Join-Path (Join-Path $root 'SQL') 'SqlUnconstrainedDelegation.csv')
    }

    $counts = [ordered]@{
        Domains            = if ($topo) { @($topo.Domains).Count } else { $nc }
        DomainControllers  = if ($topo) { @($topo.DomainControllers).Count } else { $nc }
        Sites              = if ($topo) { @($topo.Sites).Count } else { $nc }
        Trusts             = if ($haveTrusts) { $trustPairs.Count } else { $nc }
        ExternalTrusts     = if ($haveTrusts) { @($trustPairs.Values | Where-Object { -not $_ }).Count } else { $nc }
        OUs                = & $sumOrNc @($domainDirs | ForEach-Object { $f = Read-FMPJsonFile (Join-Path (Join-Path $_.FullName 'OUs') 'OUFlatExport.json'); if ($null -ne $f) { @($f).Count } })
        GPOs               = & $sumOrNc @($domainDirs | ForEach-Object { $f = Read-FMPJsonFile (Join-Path (Join-Path $_.FullName 'GPOs') 'GPOInventory.json'); if ($null -ne $f) { @($f).Count } })
        Users              = & $sumOrNc @($domainDirs | ForEach-Object { & $countOf $_ 'UserCounts.json' 'UserInventory.json' 'Users' $null })
        EnabledUsers       = & $sumOrNc @($domainDirs | ForEach-Object { & $countOf $_ 'UserCounts.json' 'UserInventory.json' 'EnabledUsers' { param($o) $o.Enabled } })
        Groups             = & $sumOrNc @($domainDirs | ForEach-Object { & $countOf $_ 'GroupCounts.json' 'GroupInventory.json' 'Groups' $null })
        Computers          = & $sumOrNc @($domainDirs | ForEach-Object { & $countOf $_ 'ComputerCounts.json' 'ComputerInventory.json' 'Computers' $null })
        Servers            = & $sumOrNc @($domainDirs | ForEach-Object { & $countOf $_ 'ComputerCounts.json' 'ComputerInventory.json' 'Servers' $isServer })
        EnabledServers     = & $sumOrNc @($domainDirs | ForEach-Object { & $countOf $_ 'ComputerCounts.json' 'ComputerInventory.json' 'EnabledServers' { param($o) (& $isServer $o) -and $o.Enabled } })
        ServiceAccounts    = & $sumOrNc @($domainDirs | ForEach-Object { $p = Join-Path (Join-Path $_.FullName 'Objects') 'ServiceAccounts.csv'; if (Test-Path -LiteralPath $p) { @(Read-FMPCsvFile $p).Count } })
        SPNs               = if ($spn) { $spn.SpnCount } else { $nc }
        DuplicateSPNs      = if ($spn) { $spn.DuplicateCount } else { $nc }
        DNSZones           = if ($haveDns) { $zones.Count } else { $nc }
        DHCPServers        = if ($dhcp) { $dhcp.ServerCount } else { $nc }
        DHCPScopes         = if ($dhcp) { $dhcp.ScopeCount } else { $nc }
        CertificationAuthorities = if ($pki) { @($pki.CertificationAuthorities).Count } else { $nc }
        CertificateTemplates     = if ($pki) { @($pki.CertificateTemplates).Count } else { $nc }
        PublishedTemplates       = if ($pki) { @($pki.CertificateTemplates | Where-Object Published).Count } else { $nc }
        SchemaVersion      = if ($schema) { "$($schema.SchemaVersion) ($($schema.SchemaVersionName))" } else { $nc }
        UnconstrainedDelegationHosts    = if ($haveComputers) { @($ucHosts).Count } else { $nc }
        UnconstrainedDelegationAccounts = if ($haveUsers) { @($ucAccounts).Count } else { $nc }
        PrivilegedDelegable = & $sumOrNc @($domainDirs | ForEach-Object { $p = Join-Path (Join-Path $_.FullName 'Objects') 'PrivilegedDelegable.csv'; if (Test-Path -LiteralPath $p) { @(Read-FMPCsvFile $p).Count } })
        SQLInstances       = if ($sql) { $sql.InstanceCount } else { $nc }
        SQLHosts           = if ($sql) { $sql.HostCount } else { $nc }
        ServiceInventoryServers     = if ($svc) { $svc.ServersRead } else { $nc }
        ServiceInventoryUnreachable = if ($svc) { $svc.ServersUnreachable } else { $nc }
        DomainAccountsRunningServices = if ($svc) { $svc.DomainServiceAccounts } else { $nc }
        SQLUnconstrainedDelegation = if ($null -ne $sqlRows -and $haveComputers -and $haveUsers) { @($sqlUc).Count } else { $nc }
        NPSServers         = if ($nps) { $nps.NpsServers } else { $nc }
        NPSServersRead     = if ($nps) { $nps.NpsServersRead } else { $nc }
        RADIUSClients      = if ($nps) { $nps.UniqueRadiusClientAddresses } else { $nc }
        NetworkPolicies    = if ($nps) { $nps.NetworkPolicies } else { $nc }
        ConnectionRequestPolicies = if ($nps) { $nps.ConnectionRequestPolicies } else { $nc }
        NPSPolicyGroups    = if ($nps) { $nps.AdGroupsReferenced } else { $nc }
        ProfiledApplications = if ($txRead) { $tx.Applications } elseif ($tx) { 'no catalog' } else { $nc }
        ProfiledTransactions = if ($txRead) { $tx.Transactions } elseif ($tx) { 'no catalog' } else { $nc }
        SeparationGatePassing = if ($txRead) { $tx.ApplicationsPassing } elseif ($tx) { 'no catalog' } else { $nc }
        SeparationGateBlocked = if ($txRead) { $tx.ApplicationsBlocked } elseif ($tx) { 'no catalog' } else { $nc }
        SurveyedUsers      = if ($attr) { $attr.Population } else { $nc }
        PersonKeyFill      = if ($attr) { "$($attr.KeyFillPercent)%" } else { $nc }
        DuplicatePersonKeys = if ($attr) { $attr.DuplicateKeys } else { $nc }
        AttributeQualityFindings = if ($attr) { $attr.QualityFindings } else { $nc }
        FreeExtensionSlots = if ($attr) { @($attr.FreeSlots).Count } else { $nc }
        Waves              = if ($waves) { $waves.Waves } else { $nc }
        WaveUsers          = if ($waves) { $waves.Users } else { $nc }
        WaveExclusions     = if ($waves) { $waves.Excluded } else { $nc }
    }
    $byOs = $null
    if ($haveComputers) {
        $osTotals = @{}
        foreach ($r in @($domainDirs | ForEach-Object { Read-FMPCsvFile (& $objFile $_ 'ComputersByOS.csv') })) {
            $name = if ("$($r.OperatingSystem)" -eq '') { 'Unknown' } else { "$($r.OperatingSystem)" }
            if (-not $osTotals.ContainsKey($name)) { $osTotals[$name] = 0 }
            $osTotals[$name] += [int]$r.Count
        }
        $byOs = [ordered]@{}
        foreach ($k in ($osTotals.Keys | Sort-Object)) { $byOs[$k] = $osTotals[$k] }
    }
    $summary = [ordered]@{
        Schema       = 'fmp-start-kit/summary/1'
        GeneratedUtc = (Get-Date).ToUniversalTime().ToString('o')
        Forest       = if ($topo) { $topo.Forest.Name } else { $null }
        Counts       = $counts
        ComputersByOS = $byOs
        SqlByVersion = if ($sql) { $sql.ByVersion } else { $null }
        SqlByEdition = if ($sql) { $sql.ByEdition } else { $null }
        SqlByDomain  = if ($sql) { $sql.ByDomain } else { $null }
        SqlByAuthenticationMode = if ($sql) { $sql.ByAuthenticationMode } else { $null }
        SqlBySourcesAgree = if ($sql) { $sql.BySourcesAgree } else { $null }
        NpsFindingsBySeverity = if ($nps) { $nps.FindingsBySeverity } else { $null }
        TransactionsByStatus = if ($txRead) { $tx.ByStatus } else { $null }
        AttributeFindingsByRule = if ($attr) { $attr.FindingsByRule } else { $null }
        WaveExclusionsByReason = if ($waves) { $waves.ExcludedByReason } else { $null }
    }
    $path = Initialize-FMPPath -Path (Join-Path $root 'Summary')
    Write-FMPJson -InputObject $summary -Path (Join-Path $path 'StartKitSummary.json') -Depth 5

    $label = [ordered]@{
        Domains = 'Domains'; DomainControllers = 'Domain controllers'; Sites = 'Sites'; Trusts = 'Trusts (unique pairs)'; ExternalTrusts = 'External and forest trusts'
        OUs = 'Organizational units'; GPOs = 'Group Policy Objects'; Users = 'Users'; EnabledUsers = 'Enabled users'; Groups = 'Groups'
        Computers = 'Computers'; Servers = 'Servers'; EnabledServers = 'Enabled servers'; ServiceAccounts = 'Service accounts (users with SPNs, MSAs, gMSAs)'
        SPNs = 'Service principal names'; DuplicateSPNs = 'Duplicate SPNs'; DNSZones = 'DNS zones'; DHCPServers = 'DHCP servers (authorized)'; DHCPScopes = 'DHCP scopes'
        CertificationAuthorities = 'Enterprise CAs'; CertificateTemplates = 'Certificate templates'; PublishedTemplates = 'Published templates'
        UnconstrainedDelegationHosts = 'Computers with unconstrained delegation (domain controllers excluded)'
        UnconstrainedDelegationAccounts = 'User and service accounts with unconstrained delegation'
        PrivilegedDelegable = 'Privileged users whose credentials can be delegated (not sensitive, not in Protected Users)'
        SchemaVersion = 'Schema version'; SQLInstances = 'SQL Server instances'; SQLHosts = 'SQL Server hosts'
        ServiceInventoryServers = 'Servers whose services were read'; ServiceInventoryUnreachable = 'Servers whose services could not be read'
        DomainAccountsRunningServices = 'Domain and managed service accounts running a service on a server read'
        SQLUnconstrainedDelegation = 'SQL Server instances whose host or service account has unconstrained delegation'
        NPSServers = 'NPS servers (RAS and IAS Servers members and named)'; NPSServersRead = 'NPS servers whose configuration was read'
        RADIUSClients = 'RADIUS clients (unique addresses)'; NetworkPolicies = 'NPS network policies (all servers)'
        ConnectionRequestPolicies = 'NPS connection request policies (all servers)'; NPSPolicyGroups = 'AD groups NPS policies authorize against'
        ProfiledApplications = 'Applications with transaction profiles'; ProfiledTransactions = 'Transactions profiled'
        SeparationGatePassing = 'Applications clear to leave their data (every transaction profiled and within budget)'
        SeparationGateBlocked = 'Applications that must stay with their data for now'
        SurveyedUsers = 'Users surveyed for attributes (enabled, not service accounts)'
        PersonKeyFill = 'Enterprise person key (employeeID) fill rate'
        DuplicatePersonKeys = 'Person keys held by more than one account'
        AttributeQualityFindings = 'Attribute value-quality findings'
        FreeExtensionSlots = 'Free extension attribute slots (of 15)'
        Waves = 'Migration waves'; WaveUsers = 'Users placed in a wave'; WaveExclusions = 'Users and assets left out of every wave'
    }
    $md = @('# Start Kit summary', '', "Forest: $($summary.Forest). Generated $($summary.GeneratedUtc) UTC. Read-only run; counts come from this run's own files.", '',
        '| Item | Count |', '|---|---|')
    foreach ($k in $counts.Keys) { $md += "| $($label[$k]) | $($counts[$k]) |" }
    $table = {
        param($title, $map)
        $lines = @('', "## $title", '', '| | Count |', '|---|---|')
        if (-not $map) { return $lines + '| not collected | |' }
        foreach ($p in $map.PSObject.Properties) { if ($p.MemberType -eq 'NoteProperty') { $lines += "| $($p.Name) | $($p.Value) |" } }
        if ($map -is [System.Collections.IDictionary]) { foreach ($k in $map.Keys) { $lines += "| $k | $($map[$k]) |" } }
        $lines
    }
    $md += & $table 'Computers by operating system' $byOs
    $md += & $table 'SQL Server instances by version' $summary.SqlByVersion
    $md += & $table 'SQL Server instances by edition' $summary.SqlByEdition
    $md += & $table 'SQL Server instances by domain' $summary.SqlByDomain
    $md += & $table 'SQL Server instances by authentication mode' $summary.SqlByAuthenticationMode
    $md += & $table 'Do the discovery signals agree?' $summary.SqlBySourcesAgree
    $md += & $table 'RADIUS and NPS findings by severity' $summary.NpsFindingsBySeverity
    $md += & $table 'Transaction profiles by status' $summary.TransactionsByStatus
    $md += & $table 'Attribute value-quality findings by rule' $summary.AttributeFindingsByRule
    $md += & $table 'Wave exclusions by reason' $summary.WaveExclusionsByReason
    $md += @('', '## Unconstrained delegation (domain controllers excluded)', '',
        'Each one can impersonate any user who authenticates to it, to any service. Move it to constrained or resource-based constrained delegation (Book 02 Chapter 08; Book 06 Runbook R06).', '',
        '| Name | Kind | Runs SQL Server |', '|---|---|---|')
    if (-not ($haveComputers -or $haveUsers)) { $md += '| not collected | | |' }
    elseif (($ucHosts.Count + $ucAccounts.Count) -eq 0) { $md += '| none found | | |' }
    $sqlHit = {
        param($n, $kind)
        if ($null -eq $sqlRows) { return 'not collected' }
        $hit = if ($kind -eq 'Computer') { @($sqlUc | Where-Object { $_.UnconstrainedOn -match 'host' -and ("$($_.ServerName)" -split '\.')[0] -eq $n }) }
               else { @($sqlUc | Where-Object { @("$($_.ServiceAccount)" -split ';' | ForEach-Object { ($_ -split '\\')[-1] }) -contains $n }) }
        if (@($hit).Count) { 'yes' } else { 'no' }
    }
    foreach ($c in $ucHosts)    { $md += "| $($c.Name) | Computer | $(& $sqlHit $c.Name 'Computer') |" }
    foreach ($u in $ucAccounts) { $md += "| $($u.SamAccountName) | Account | $(& $sqlHit $u.SamAccountName 'Account') |" }
    Write-FMPText -Value $md -Path (Join-Path $path 'StartKitSummary.md')
    [pscustomobject]$summary
}

Export-ModuleMember -Function @(
    'Test-FMPPrerequisites', 'Test-FMPReadAccess', 'Get-FMPForestTopology', 'Get-FMPOUHierarchy', 'Get-FMPGPOInventory',
    'Export-FMPGPOSettings', 'Get-FMPDNSAssessment', 'Get-FMPPKIAssessment', 'Get-FMPComputerInventory',
    'Get-FMPUserInventory', 'Get-FMPGroupInventory', 'Get-FMPTrustMap', 'Get-FMPSchemaExtensions', 'Get-FMPDHCPInventory',
    'Get-FMPKerberosSpnMap', 'Get-FMPLdapBindingEvent', 'Invoke-FMPADAssessment', 'Compare-FMPAssessments',
    'Get-FMPTemplateClassification', 'Get-FMPStartKitSummary'
)
