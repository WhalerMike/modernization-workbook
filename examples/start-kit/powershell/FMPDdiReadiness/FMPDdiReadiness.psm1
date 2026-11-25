#Requires -Version 5.1
<#
.SYNOPSIS
    Read-only DNS, DHCP and IPAM readiness checks for the Start Kit (Book 08, DNS, DHCP & IPAM).

.DESCRIPTION
    The Start Kit's collectors read the naming plane: Get-FMPDNSAssessment writes
    <run>\<domain>\DNS\DNSInventory.json, DNSHealthReport.json and DNSRecordInventory.json, and
    Get-FMPDHCPInventory writes <run>\<domain>\DHCP\DHCPInventory.json. This module reads those
    files, never a server, and applies Book 08's rules to them:

      Read-FMPDdiRun               Loads one domain's DNS and DHCP files, and says which are missing.
      Get-FMPDnsDepartureRegister  Chapter 10's "Where each component goes": every zone, conditional
                                   forwarder, stub zone, the locator records and dynamic registration,
                                   each with its target, Azure-native equivalent, method and risk, and
                                   the findings Phase 1 says to clear before anything moves.

    Because it only reads files, it runs on a laptop against the kit's fixtures, or against a
    run copied from a test domain. Windows PowerShell 5.1 and PowerShell 7.

.NOTES
    Illustrative. Unit-tested against fixtures (tests/fixtures/ddi), not proven against a live
    estate. The rules quote Book 08; where the book and this code disagree, the book governs.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

# Book 08, Chapter 10, "Where each component goes": target under the policy plane, the
# Azure-native equivalent, the method and the risk, per AD DNS component.
$script:FMPDepartureRules = [ordered]@{
    'AD-integrated zone, internal'     = @('Authoritative zone on the DDI platform', 'Azure Private DNS zone linked to the VNets', 'Export records, create zone, import, validate', 'Medium')
    'AD-integrated zone, external'     = @('Public authoritative zone', 'Azure DNS public zone', 'Export, import, then change NS delegation at the registrar', 'High')
    'File-backed primary'              = @('Authoritative zone', 'Public or private zone', 'Export, transform, import; check who consumes its secondaries', 'Low')
    'Secondary zone'                   = @('Retired once its primary has moved', 'Retired', 'Confirm no client uses the secondary server as its resolver', 'Low')
    'Stub zone or conditional forwarder' = @('Forwarding rule in the policy plane', 'DNS forwarding ruleset rule on the Private Resolver', 'Recreate the rule; test the targets from the new resolver', 'Low')
    'GlobalNames zone'                 = @('Zone of CNAMEs plus a DNS suffix search list', 'Private zone plus suffix search list', 'Import CNAMEs; push the search list through policy', 'Medium')
    'AD locator records'               = @('Stay with a service that accepts domain controller registration until the last DC goes', 'None', 'Forward the AD namespaces to the domain controllers; monitor', 'High')
    'Dynamic registration'             = @('DHCP-driven DDNS on the DDI platform', 'Autoregistration for VMs only', 'Re-establish per client population', 'Medium')
    'Reverse lookup zone'              = @('Reverse zones aligned to IPAM', 'Private in-addr.arpa zones', 'Create per reverse zone, import PTRs', 'Medium')
    'DNSSEC-signed zone'               = @('Signed authoritative zone', 'Public zones only; Azure Private DNS does not sign', 'Move in Phase 3 by the signed-zone sequence; the new chain validates before the Phase 5 gate', 'High')
}
$script:FMPRiskOrder = @{ High = 0; Medium = 1; Low = 2 }

function Read-FMPDdiJson {
    # One collector file, or $null when it isn't there. Parenthesized so a JSON array is
    # enumerated in Windows PowerShell 5.1 too.
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    (Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json)
}

function Get-FMPDdiProperty {
    # A property's value, or $Default when the object doesn't have it (StrictMode-safe).
    param($Object, [Parameter(Mandatory)][string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { $p.Value } else { $Default }
}

function Read-FMPDdiRun {
    <#
    .SYNOPSIS
        Loads one domain's DNS and DHCP files from a Start Kit run, and says which are missing.
    .PARAMETER Path
        The domain folder of a run: <run>\<domain>, the folder that holds DNS\ and DHCP\.
    .OUTPUTS
        An object with Domain, Path, DnsInventory, DnsHealth, DnsRecords, DhcpInventory and Missing.
    .EXAMPLE
        Read-FMPDdiRun -Path tests/fixtures/ddi/run-2026-11-20/contoso.example
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "No run folder at $Path. Give the domain folder of a run, <run>\<domain>." }
    $full = ConvertTo-FMPFullPath -Path $Path
    $files = [ordered]@{
        DnsInventory  = 'DNS\DNSInventory.json'
        DnsHealth     = 'DNS\DNSHealthReport.json'
        DnsRecords    = 'DNS\DNSRecordInventory.json'
        DhcpInventory = 'DHCP\DHCPInventory.json'
    }
    $out = [ordered]@{ Domain = Split-Path -Leaf $full; Path = $full }
    $missing = @()
    foreach ($k in $files.Keys) {
        $rel = $files[$k] -replace '\\', [System.IO.Path]::DirectorySeparatorChar
        $data = Read-FMPDdiJson -Path (Join-Path $full $rel)
        if ($null -eq $data) { $missing += $files[$k] }
        $out[$k] = $data
    }
    $out.Missing = $missing
    [pscustomobject]$out
}

function Get-FMPDdiComponent {
    # Sorts one zone into Chapter 10's component rows.
    param([Parameter(Mandatory)]$Zone, [string[]]$ExternalZone)
    $type = "$(Get-FMPDdiProperty $Zone 'ZoneType')"
    $name = "$(Get-FMPDdiProperty $Zone 'ZoneName')"
    if ($type -eq 'Forwarder' -or $type -eq 'Stub') { return 'Stub zone or conditional forwarder' }
    if ($type -eq 'Secondary') { return 'Secondary zone' }
    if ($name -like '_msdcs.*') { return 'AD locator records' }
    if ($name -eq 'GlobalNames') { return 'GlobalNames zone' }
    if (Get-FMPDdiProperty $Zone 'IsSigned' $false) { return 'DNSSEC-signed zone' }
    if (Get-FMPDdiProperty $Zone 'IsReverseLookupZone' $false) { return 'Reverse lookup zone' }
    if (Get-FMPDdiProperty $Zone 'IsDsIntegrated' $false) {
        if ($ExternalZone -contains $name) { return 'AD-integrated zone, external' }
        return 'AD-integrated zone, internal'
    }
    'File-backed primary'
}

function Get-FMPDnsDepartureRegister {
    <#
    .SYNOPSIS
        Book 08, Chapter 10's departure register: every AD DNS component of one domain, with its
        target, Azure-native equivalent, method and risk, and the Phase 1 findings to clear first.
    .DESCRIPTION
        Reads the DNS files a Start Kit run wrote for one domain (Read-FMPDdiRun). One row per zone
        on the PDC emulator's DNS server, plus one row for dynamic registration when any zone takes
        dynamic updates. Each row says where the component goes, how, and at what risk, in the words
        of Chapter 10's table, with notes from the run: the zone's storage, its dynamic-update
        setting, its stale records, its forwarding targets, the DNS servers that don't hold it.

        The findings are what Chapter 10's Phase 1 says to clear before anything moves: locator
        records that don't resolve, DNS servers that couldn't be read, scavenging that is off or
        unknown, stale records, and the server-level forwarders to test over DNS.

        Nothing is decided here. The register is the starting list for the architects, who confirm
        or change every row.
    .PARAMETER Path
        The domain folder of a run: <run>\<domain>.
    .PARAMETER ExternalZone
        Zone names that also serve the public internet. AD can't say which zones those are, so
        every AD-integrated zone is internal unless it is named here.
    .PARAMETER OutputPath
        Where to write <OutputPath>\<domain>\DDI\DepartureRegister.csv and DepartureRegister.json.
        Without it, nothing is written and the result is only returned.
    .OUTPUTS
        An object with Domain, Rows (the register), Findings, and Written (the files, if any).
    .EXAMPLE
        Get-FMPDnsDepartureRegister -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -OutputPath out
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [string[]]$ExternalZone = @(),
        [string]$OutputPath
    )
    $run = Read-FMPDdiRun -Path $Path
    if ($null -eq $run.DnsInventory) { throw "No DNS\DNSInventory.json under $($run.Path). Run Get-FMPDNSAssessment for the domain first." }
    $inv = $run.DnsInventory
    $primary = "$(Get-FMPDdiProperty $inv 'DnsServer')"

    # Per-server zone lists: storage and dynamic update come from the PDC emulator's own list,
    # and a zone some other readable server lacks is noted.
    $byServer = @{}
    $unreadable = @()
    foreach ($z in @(Get-FMPDdiProperty $run.DnsHealth 'ZonesByServer' @())) {
        $server = "$(Get-FMPDdiProperty $z 'DnsServer')"
        $err = Get-FMPDdiProperty $z 'Error'
        if ($err) { $unreadable += [pscustomobject]@{ Server = $server; Error = "$err" }; continue }
        if (-not $byServer.ContainsKey($server)) { $byServer[$server] = @{} }
        $byServer[$server]["$($z.ZoneName)".ToLowerInvariant()] = $z
    }
    $stale = @{}
    $counts = @{}
    $dupes = @()
    foreach ($r in @($run.DnsRecords)) {
        if ($null -eq $r) { continue }
        $zoneName = "$(Get-FMPDdiProperty $r 'ZoneName')"
        $key = $zoneName.ToLowerInvariant()
        $old = @(Get-FMPDdiProperty $r 'StaleRecords' @())
        $stale[$key] = $old.Count
        $counts[$key] = Get-FMPDdiProperty $r 'RecordCount'
        # One host name with A records for more than one address: Chapter 04's case of a Kerberos
        # ticket for one computer delivered to another.
        foreach ($g in @($old | Where-Object { "$($_.RecordType)" -eq 'A' } | Group-Object HostName)) {
            $addresses = @($g.Group | ForEach-Object { "$($_.Data)" } | Sort-Object -Unique)
            if ($addresses.Count -gt 1) { $dupes += "$($g.Name).$zoneName ($($addresses -join ', '))" }
        }
    }

    $rows = @()
    $dynamic = @()
    foreach ($z in @(Get-FMPDdiProperty $inv 'Zones' @())) {
        $name = "$($z.ZoneName)"
        $key = $name.ToLowerInvariant()
        $component = Get-FMPDdiComponent -Zone $z -ExternalZone $ExternalZone
        $rule = $script:FMPDepartureRules[$component]
        $own = $null
        if ($byServer.ContainsKey($primary) -and $byServer[$primary].ContainsKey($key)) { $own = $byServer[$primary][$key] }
        $storage = "$(Get-FMPDdiProperty $own 'Partition' '')"
        $update = "$(Get-FMPDdiProperty $own 'DynamicUpdate' '')"
        if ($update -and $update -ne 'None') { $dynamic += "$name ($update)" }

        $notes = @()
        $masters = @(Get-FMPDdiProperty $z 'MasterServers' @() | Where-Object { $_ })
        if ($component -eq 'Stub zone or conditional forwarder') {
            $kind = if ("$($z.ZoneType)" -eq 'Stub') { 'Stub zone' } else { 'Conditional forwarder' }
            $notes += "$kind to $(@($masters) -join ', '); test each target over DNS"
        }
        if ($component -eq 'Secondary zone') { $notes += "Primary: $(@($masters) -join ', ')" }
        if ($stale.ContainsKey($key) -and $stale[$key] -gt 0) { $notes += "$($stale[$key]) stale records; clean up before migrating" }
        $absent = @($byServer.Keys | Where-Object { $_ -ne $primary -and -not $byServer[$_].ContainsKey($key) } | Sort-Object)
        if ($absent.Count -gt 0 -and $storage -ne 'File-backed') { $notes += "Not on $($absent -join ', ')" }

        $rows += [pscustomobject][ordered]@{
            Zone            = $name
            Component       = $component
            ZoneType        = "$($z.ZoneType)"
            Storage         = $storage
            DynamicUpdate   = $update
            Records         = if ($counts.ContainsKey($key)) { $counts[$key] } else { $null }
            Target          = $rule[0]
            AzureEquivalent = $rule[1]
            Method          = $rule[2]
            Risk            = $rule[3]
            Notes           = ($notes -join '; ')
        }
    }
    if ($dynamic.Count -gt 0) {
        $rule = $script:FMPDepartureRules['Dynamic registration']
        $rows += [pscustomobject][ordered]@{
            Zone = '(dynamic updates)'; Component = 'Dynamic registration'; ZoneType = ''; Storage = ''; DynamicUpdate = ''
            Records = $null; Target = $rule[0]; AzureEquivalent = $rule[1]; Method = $rule[2]; Risk = $rule[3]
            Notes = "Zones that take dynamic updates: $($dynamic -join ', ')"
        }
    }
    $rows = @($rows | Sort-Object @{ E = { $script:FMPRiskOrder[$_.Risk] } }, Component, Zone)

    # Phase 1's findings, in the order the chapter lists them.
    $findings = @()
    foreach ($c in @(Get-FMPDdiProperty $run.DnsHealth 'SRVChecks' @())) {
        if ("$($c.Status)" -ne 'PASS') {
            $findings += [pscustomobject][ordered]@{ Area = 'Locator records'; Item = "$($c.SRVRecord)"; Finding = 'Does not resolve on the PDC emulator''s DNS server'; Book08 = 'Chapter 04, The locator records; Chapter 10, Phase 5 gate' }
        }
    }
    foreach ($u in $unreadable) {
        $findings += [pscustomobject][ordered]@{ Area = 'DNS servers'; Item = $u.Server; Finding = "Not read: $($u.Error)"; Book08 = 'Chapter 10, Phase 1: every zone on every DNS server' }
    }
    $scav = Get-FMPDdiProperty $inv 'Scavenging'
    if ($null -eq $scav -or (Get-FMPDdiProperty $scav 'NotReadable' $false)) {
        $findings += [pscustomobject][ordered]@{ Area = 'Zone health'; Item = 'Aging and scavenging'; Finding = 'Not read; ask for an export of the server settings'; Book08 = 'Chapter 04, Secure dynamic updates and the DHCP server; Chapter 10, Phase 1' }
    } elseif (-not (Get-FMPDdiProperty $scav 'ScavengingState' $false)) {
        $findings += [pscustomobject][ordered]@{ Area = 'Zone health'; Item = 'Aging and scavenging'; Finding = 'Scavenging is off, so stale records stay'; Book08 = 'Chapter 04, Secure dynamic updates and the DHCP server; Chapter 10, Phase 1' }
    }
    $staleTotal = ($stale.Values | Measure-Object -Sum).Sum
    if ($staleTotal -gt 0) {
        $days = Get-FMPDdiProperty $run.DnsHealth 'StaleThresholdDays' 90
        $findings += [pscustomobject][ordered]@{ Area = 'Zone health'; Item = 'Stale records'; Finding = "$staleTotal records older than $days days"; Book08 = 'Chapter 10, Phase 1: clean up before migrating' }
    }
    foreach ($d in $dupes) {
        $findings += [pscustomobject][ordered]@{ Area = 'Zone health'; Item = 'Duplicate host name'; Finding = "Stale A records for one name, different addresses: $d"; Book08 = 'Chapter 04, What Kerberos needs from DNS on the way out' }
    }
    $fwd = Get-FMPDdiProperty $inv 'Forwarders'
    if ($fwd -and -not (Get-FMPDdiProperty $fwd 'NotReadable' $false)) {
        $ips = @(Get-FMPDdiProperty $fwd 'IPAddress' @())
        $hint = if (Get-FMPDdiProperty $fwd 'UseRootHint' $false) { '; root hints on' } else { '' }
        $findings += [pscustomobject][ordered]@{ Area = 'Forwarders'; Item = 'Server-level forwarders'; Finding = "$($ips -join ', ')$hint; test each over DNS, not just ICMP"; Book08 = 'Chapter 10, Phase 1' }
    }
    foreach ($s in @(Get-FMPDdiProperty $inv 'DNSSEC' @())) {
        if (Get-FMPDdiProperty $s 'NotReadable' $false) {
            $findings += [pscustomobject][ordered]@{ Area = 'DNSSEC'; Item = 'Signing settings'; Finding = "Not read: $(Get-FMPDdiProperty $s 'Error')"; Book08 = 'Chapter 06; Chapter 10, Phase 1' }
        }
    }

    $written = @()
    if ($OutputPath) {
        $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
        $dir = Get-FMPDomainPath -OutputPath $OutputPath -Domain $run.Domain -Area 'DDI'
        $csv = Join-Path $dir 'DepartureRegister.csv'
        $json = Join-Path $dir 'DepartureRegister.json'
        Write-FMPCsv -InputObject $rows -Path $csv
        Write-FMPJson -InputObject ([ordered]@{ Domain = $run.Domain; Source = $run.Path; DnsServer = $primary; Rows = $rows; Findings = @($findings) }) -Path $json -Depth 6
        $written = @($csv, $json)
    }
    [pscustomobject]@{ Domain = $run.Domain; Rows = $rows; Findings = @($findings); Written = $written }
}

function Get-FMPDdiOption {
    # One option's values from a list of options, or $null when the list doesn't set it.
    param($Options, [int]$Id)
    if ($null -eq $Options -or (Get-FMPDdiProperty $Options 'NotReadable' $false)) { return $null }
    $o = @($Options | Where-Object { $_ -and [int](Get-FMPDdiProperty $_ 'OptionId' -1) -eq $Id }) | Select-Object -First 1
    if ($o) { @(Get-FMPDdiProperty $o 'Value' @() | ForEach-Object { "$_" }) } else { $null }
}

function Test-FMPDhcpEdge {
    <#
    .SYNOPSIS
        Book 08, Chapters 04 and 05, on a run's DHCP file: the resolvers each scope hands out, the
        options that move traffic, failover, the DNS registration account and name protection, and
        DHCP servers seen on the network that aren't authorized.
    .DESCRIPTION
        Reads <domain>\DHCP\DHCPInventory.json (Get-FMPDHCPInventory) and, for the zone list,
        DNS\DNSInventory.json. For each scope it takes the options set on the scope, then the
        server's, as a Windows DHCP server does, and checks:

          Option 6    every resolver is one of -ApprovedResolver (M-22-09's agency-designated
                      resolvers, and the Protective DNS path); a scope served by two servers hands
                      out the same resolvers from both.
          Option 15   the domain is a zone the agency's DNS holds, or short names resolve elsewhere.
          Option 252  WPAD set by DHCP: a security-relevant setting to confirm or remove.
          Failover    a scope only one server can lease from.
          Registration a server with no dedicated DNS registration account; failover partners
                      registering with different accounts; name protection off.
          Rogue       with -ObservedDhcpServerPath, every address seen answering DHCP that isn't
                      an authorized server's.

        Each finding names the Book 08 section that explains it. Nothing is decided here.
    .PARAMETER Path
        The domain folder of a run: <run>\<domain>.
    .PARAMETER ApprovedResolver
        The agency-designated resolvers' addresses: the only values option 6 may hold.
    .PARAMETER ObservedDhcpServerPath
        A CSV with an Address column (and optionally SeenOn and Where): the DHCP servers the
        network saw, from DHCP snooping bindings or a DHCP discovery scan.
    .PARAMETER OutputPath
        Where to write <OutputPath>\<domain>\DDI\DhcpEdge.csv. Without it, nothing is written.
    .OUTPUTS
        An object with Domain, Scopes (each scope's effective options) and Findings.
    .EXAMPLE
        Test-FMPDhcpEdge -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string[]]$ApprovedResolver,
        [string]$ObservedDhcpServerPath,
        [string]$OutputPath
    )
    $run = Read-FMPDdiRun -Path $Path
    if ($null -eq $run.DhcpInventory) { throw "No DHCP\DHCPInventory.json under $($run.Path). Run Get-FMPDHCPInventory for the domain first." }
    $zones = @{}
    foreach ($z in @(Get-FMPDdiProperty $run.DnsInventory 'Zones' @())) { $zones["$($z.ZoneName)".ToLowerInvariant()] = $true }
    $approved = @($ApprovedResolver | ForEach-Object { "$_".Trim() })

    $scopes = @()
    $findings = @()
    $servers = @(Get-FMPDdiProperty $run.DhcpInventory 'Servers' @())
    foreach ($s in $servers) {
        $name = "$($s.Server)"
        if (-not (Get-FMPDdiProperty $s 'Readable' $false)) {
            $findings += [pscustomobject][ordered]@{ Area = 'DHCP servers'; Server = $name; Scope = ''; Finding = "Not read: $(Get-FMPDdiProperty $s 'Error')"; Book08 = 'Chapter 10, Phase 1' }
            continue
        }
        $srvOpts = Get-FMPDdiProperty $s 'ServerOptions'
        foreach ($sc in @(Get-FMPDdiProperty $s 'Scopes' @())) {
            $scOpts = Get-FMPDdiProperty $sc 'Options'
            $eff = @{}
            foreach ($id in 6, 15, 252) {
                $v = Get-FMPDdiOption $scOpts $id
                $from = 'scope'
                if ($null -eq $v) { $v = Get-FMPDdiOption $srvOpts $id; $from = 'server' }
                if ($null -ne $v) { $eff[$id] = [pscustomobject]@{ Value = @($v); From = $from } }
            }
            $dns = if ($eff.ContainsKey(6)) { @($eff[6].Value) } else { @() }
            $scopes += [pscustomobject][ordered]@{
                Server = $name; ScopeId = "$($sc.ScopeId)"; Name = "$($sc.Name)"
                DnsServers = ($dns -join ', ')
                Domain = if ($eff.ContainsKey(15)) { @($eff[15].Value) -join ', ' } else { '' }
                Wpad = if ($eff.ContainsKey(252)) { @($eff[252].Value) -join ', ' } else { '' }
            }
            $bad = @($dns | Where-Object { $approved -notcontains $_ })
            if ($dns.Count -eq 0) {
                $findings += [pscustomobject][ordered]@{ Area = 'Option 6'; Server = $name; Scope = "$($sc.ScopeId)"; Finding = 'No DNS servers set: clients keep whatever they had'; Book08 = 'Chapter 05, DHCP option 6 and rogue DHCP' }
            } elseif ($bad.Count -gt 0) {
                $findings += [pscustomobject][ordered]@{ Area = 'Option 6'; Server = $name; Scope = "$($sc.ScopeId)"; Finding = "Hands out resolvers that aren't approved: $($bad -join ', ') (set on the $($eff[6].From))"; Book08 = 'Chapter 05, Encrypted DNS and bypass controls; Appendix B, M-22-09' }
            }
            if ($eff.ContainsKey(15)) {
                foreach ($d in @($eff[15].Value)) {
                    if (-not $zones.ContainsKey($d.ToLowerInvariant())) {
                        $findings += [pscustomobject][ordered]@{ Area = 'Option 15'; Server = $name; Scope = "$($sc.ScopeId)"; Finding = "Domain $d is not a zone on the agency's DNS servers"; Book08 = 'Chapter 05, DHCP option 6 and rogue DHCP' }
                    }
                }
            }
            if ($eff.ContainsKey(252)) {
                $findings += [pscustomobject][ordered]@{ Area = 'Option 252'; Server = $name; Scope = "$($sc.ScopeId)"; Finding = "WPAD set by DHCP: $(@($eff[252].Value) -join ', '); confirm or remove"; Book08 = 'Chapter 05, DHCP option 6 and rogue DHCP' }
            }
        }
        $cred = Get-FMPDdiProperty $s 'DnsCredential'
        if ($cred -and -not (Get-FMPDdiProperty $cred 'NotReadable' $false) -and -not "$(Get-FMPDdiProperty $cred 'UserName' '')") {
            $findings += [pscustomobject][ordered]@{ Area = 'Registration'; Server = $name; Scope = ''; Finding = 'No dedicated DNS registration account: it registers with its own computer account'; Book08 = 'Chapter 04, Secure dynamic updates and the DHCP server' }
        }
        $set = Get-FMPDdiProperty $s 'DnsSetting'
        if ($set -and -not (Get-FMPDdiProperty $set 'NotReadable' $false) -and -not (Get-FMPDdiProperty $set 'NameProtection' $false)) {
            $findings += [pscustomobject][ordered]@{ Area = 'Registration'; Server = $name; Scope = ''; Finding = 'Name protection off: an update can overwrite a name another client holds'; Book08 = 'Chapter 04, Secure dynamic updates and the DHCP server' }
        }
    }

    # A scope several servers serve: the same resolvers from each, and a failover relationship.
    $failover = @{}
    foreach ($s in $servers) {
        foreach ($f in @(Get-FMPDdiProperty $s 'Failover' @())) {
            if ($null -eq $f -or (Get-FMPDdiProperty $f 'NotReadable' $false)) { continue }
            foreach ($id in @(Get-FMPDdiProperty $f 'ScopeId' @())) { $failover["$id"] = $f }
        }
    }
    foreach ($g in @($scopes | Group-Object ScopeId)) {
        $sets = @($g.Group | ForEach-Object { $_.DnsServers } | Sort-Object -Unique)
        if ($g.Count -gt 1 -and $sets.Count -gt 1) {
            $findings += [pscustomobject][ordered]@{ Area = 'Option 6'; Server = (@($g.Group.Server) -join ', '); Scope = $g.Name; Finding = 'The servers of one scope hand out different resolvers'; Book08 = 'Chapter 05, DHCP option 6 and rogue DHCP' }
        }
        if (-not $failover.ContainsKey($g.Name)) {
            $findings += [pscustomobject][ordered]@{ Area = 'Failover'; Server = (@($g.Group.Server) -join ', '); Scope = $g.Name; Finding = 'In no failover relationship: one server leases it'; Book08 = 'Chapter 10, Phase 1; Appendix B, SC-22' }
        } else {
            $pair = @($g.Group.Server) + @("$(Get-FMPDdiProperty $failover[$g.Name] 'PartnerServer')") | Where-Object { $_ } | Sort-Object -Unique
            $accounts = @($servers | Where-Object { $pair -contains "$($_.Server)" } | ForEach-Object {
                    $c = Get-FMPDdiProperty $_ 'DnsCredential'; "$(Get-FMPDdiProperty $c 'DomainName' '')\$(Get-FMPDdiProperty $c 'UserName' '')" } | Sort-Object -Unique)
            if ($accounts.Count -gt 1) {
                $findings += [pscustomobject][ordered]@{ Area = 'Registration'; Server = ($pair -join ', '); Scope = $g.Name; Finding = 'Failover partners register with different accounts, so one can''t update the names the other registered'; Book08 = 'Chapter 04, Secure dynamic updates and the DHCP server' }
            }
        }
    }

    # DHCP servers the network saw that aren't authorized.
    if ($ObservedDhcpServerPath) {
        if (-not (Test-Path -LiteralPath $ObservedDhcpServerPath -PathType Leaf)) { throw "No file at $ObservedDhcpServerPath." }
        $authorized = @(Get-FMPDdiProperty $run.DhcpInventory 'AuthorizedServers' @() | ForEach-Object { "$(Get-FMPDdiProperty $_ 'IPAddress')" })
        foreach ($o in @(Import-Csv -LiteralPath $ObservedDhcpServerPath)) {
            $addr = "$(Get-FMPDdiProperty $o 'Address')".Trim()
            if ($addr -and $authorized -notcontains $addr) {
                $where = "$(Get-FMPDdiProperty $o 'Where' '')"
                $findings += [pscustomobject][ordered]@{ Area = 'Rogue DHCP'; Server = $addr; Scope = ''; Finding = "Answers DHCP but isn't authorized$(if ($where) { ": $where" })"; Book08 = 'Chapter 05, What the Windows controls do and don''t cover' }
            }
        }
    }

    $written = @()
    if ($OutputPath) {
        $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
        $dir = Get-FMPDomainPath -OutputPath $OutputPath -Domain $run.Domain -Area 'DDI'
        $csv = Join-Path $dir 'DhcpEdge.csv'
        Write-FMPCsv -InputObject $findings -Path $csv
        $written = @($csv)
    }
    [pscustomobject]@{ Domain = $run.Domain; Scopes = $scopes; Findings = @($findings); Written = $written }
}

function ConvertTo-FMPDdiPrefix {
    # "10.2.0.0/22" or "fd00:10::/48" -> address bytes and length; $null if it isn't a prefix.
    param([string]$Text)
    $parts = "$Text".Trim().Split('/')
    if ($parts.Count -ne 2) { return $null }
    $ip = $null
    if (-not [System.Net.IPAddress]::TryParse($parts[0], [ref]$ip)) { return $null }
    $len = 0
    if (-not [int]::TryParse($parts[1], [ref]$len)) { return $null }
    $bytes = $ip.GetAddressBytes()
    if ($len -lt 0 -or $len -gt $bytes.Length * 8) { return $null }
    [pscustomobject]@{ Text = "$Text".Trim(); Bytes = $bytes; Length = $len }
}

function Test-FMPDdiContains {
    # True when prefix $Outer contains prefix $Inner (same address family).
    param($Outer, $Inner)
    if ($Outer.Bytes.Length -ne $Inner.Bytes.Length -or $Outer.Length -gt $Inner.Length) { return $false }
    for ($bit = 0; $bit -lt $Outer.Length; $bit++) {
        $i = [math]::Floor($bit / 8); $mask = 0x80 -shr ($bit % 8)
        if (($Outer.Bytes[$i] -band $mask) -ne ($Inner.Bytes[$i] -band $mask)) { return $false }
    }
    $true
}

function ConvertFrom-FMPDdiMask {
    # 255.255.255.0 -> 24
    param([string]$Mask)
    $n = 0
    foreach ($b in ([System.Net.IPAddress]::Parse($Mask)).GetAddressBytes()) { for ($i = 7; $i -ge 0; $i--) { if ($b -band (1 -shl $i)) { $n++ } } }
    $n
}

function Read-FMPDdiCloudNetworks {
    # Each network in a cloud CLI export: Azure (az network vnet list), AWS (aws ec2 describe-vpcs),
    # OCI (oci network vcn list).
    param([Parameter(Mandatory)][ValidateSet('Azure', 'AWS', 'OCI')][string]$Platform, [Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "No file at $Path." }
    $j = (Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json)
    switch ($Platform) {
        'Azure' {
            foreach ($v in @($j)) {
                foreach ($p in @(Get-FMPDdiProperty (Get-FMPDdiProperty $v 'addressSpace') 'addressPrefixes' @())) {
                    [pscustomobject]@{ Platform = 'Azure'; Name = "$($v.name)"; Prefix = "$p" }
                }
            }
        }
        'AWS' {
            foreach ($v in @(Get-FMPDdiProperty $j 'Vpcs' @())) {
                $tag = @(Get-FMPDdiProperty $v 'Tags' @() | Where-Object { $_.Key -eq 'Name' }) | Select-Object -First 1
                $name = if ($tag) { "$($tag.Value)" } else { "$($v.VpcId)" }
                foreach ($a in @(Get-FMPDdiProperty $v 'CidrBlockAssociationSet' @())) {
                    if ("$(Get-FMPDdiProperty (Get-FMPDdiProperty $a 'CidrBlockState') 'State' 'associated')" -eq 'associated') {
                        [pscustomobject]@{ Platform = 'AWS'; Name = $name; Prefix = "$($a.CidrBlock)" }
                    }
                }
                foreach ($a in @(Get-FMPDdiProperty $v 'Ipv6CidrBlockAssociationSet' @())) {
                    [pscustomobject]@{ Platform = 'AWS'; Name = $name; Prefix = "$($a.Ipv6CidrBlock)" }
                }
            }
        }
        'OCI' {
            foreach ($v in @(Get-FMPDdiProperty $j 'data' @())) {
                $blocks = @(Get-FMPDdiProperty $v 'cidr-blocks' @())
                if ($blocks.Count -eq 0) { $blocks = @(Get-FMPDdiProperty $v 'cidr-block' @()) }
                foreach ($p in @($blocks) + @(Get-FMPDdiProperty $v 'ipv6-cidr-blocks' @())) {
                    if ($p) { [pscustomobject]@{ Platform = 'OCI'; Name = "$(Get-FMPDdiProperty $v 'display-name')"; Prefix = "$p" } }
                }
            }
        }
    }
}

function Test-FMPAddressPlan {
    <#
    .SYNOPSIS
        Book 08, Chapter 07 and Book 10, Chapter 06: every network the agency runs, on premises and
        in Azure, AWS and OCI, checked against the IPAM address plan, and against each other.
    .DESCRIPTION
        The enterprise IPAM is the authority for the address plan; each cloud's networks mirror it.
        This reads the plan (an IPAM export) and the networks that actually exist (the DHCP scopes of
        a run, and the Azure, AWS and OCI CLI exports) and reports:

          Outside the plan     a network no IPAM allocation contains.
          Wrong allocation     a network inside an allocation for another platform.
          Overlap              two networks that share addresses (a route or a private DNS answer
                               to one can land in the other).
          Forwarders           with -Path, where each conditional forwarder's target address sits:
                               the hybrid resolution path Chapter 07 describes.

        IPv4 and IPv6. Reads files only.
    .PARAMETER IpamPath
        A CSV export of the plan's allocations with the columns Prefix, Name and Use (On-premises,
        Azure, AWS or OCI), and optionally Owner.
    .PARAMETER Path
        The domain folder of a run, for its DHCP scopes (On-premises) and its conditional forwarders.
    .PARAMETER AzureVnetPath
        The JSON of az network vnet list.
    .PARAMETER AwsVpcPath
        The JSON of aws ec2 describe-vpcs.
    .PARAMETER OciVcnPath
        The JSON of oci network vcn list.
    .PARAMETER OutputPath
        Where to write <OutputPath>\address-plan\AddressPlan.csv (every network, with its allocation)
        and AddressPlanFindings.csv. Without it, nothing is written.
    .OUTPUTS
        An object with Networks, Findings and ForwarderTargets.
    .EXAMPLE
        Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$IpamPath,
        [string]$Path,
        [string]$AzureVnetPath,
        [string]$AwsVpcPath,
        [string]$OciVcnPath,
        [string]$OutputPath
    )
    if (-not (Test-Path -LiteralPath $IpamPath -PathType Leaf)) { throw "No IPAM export at $IpamPath." }
    $plan = @()
    foreach ($a in @(Import-Csv -LiteralPath $IpamPath)) {
        $p = ConvertTo-FMPDdiPrefix "$($a.Prefix)"
        if (-not $p) { throw "Not a prefix in ${IpamPath}: $($a.Prefix)" }
        $plan += [pscustomobject]@{ Name = "$($a.Name)"; Use = "$($a.Use)"; Prefix = $p }
    }

    $nets = @()
    $run = $null
    if ($Path) {
        $run = Read-FMPDdiRun -Path $Path
        foreach ($s in @(Get-FMPDdiProperty $run.DhcpInventory 'Servers' @())) {
            foreach ($sc in @(Get-FMPDdiProperty $s 'Scopes' @())) {
                $nets += [pscustomobject]@{ Platform = 'On-premises'; Name = "DHCP scope $($sc.Name)"; Prefix = "$($sc.ScopeId)/$(ConvertFrom-FMPDdiMask "$($sc.SubnetMask)")" }
            }
        }
    }
    if ($AzureVnetPath) { $nets += @(Read-FMPDdiCloudNetworks -Platform Azure -Path $AzureVnetPath) }
    if ($AwsVpcPath) { $nets += @(Read-FMPDdiCloudNetworks -Platform AWS -Path $AwsVpcPath) }
    if ($OciVcnPath) { $nets += @(Read-FMPDdiCloudNetworks -Platform OCI -Path $OciVcnPath) }
    # A scope two failover partners both serve is one network.
    $nets = @($nets | Sort-Object Platform, Name, Prefix -Unique)

    $rows = @()
    $findings = @()
    foreach ($n in $nets) {
        $p = ConvertTo-FMPDdiPrefix $n.Prefix
        if (-not $p) { $findings += [pscustomobject][ordered]@{ Check = 'Unreadable'; Network = "$($n.Platform) $($n.Name)"; Prefix = $n.Prefix; Finding = 'Not a prefix' }; continue }
        $alloc = @($plan | Where-Object { Test-FMPDdiContains $_.Prefix $p } | Sort-Object { $_.Prefix.Length } -Descending) | Select-Object -First 1
        $rows += [pscustomobject][ordered]@{
            Platform = $n.Platform; Name = $n.Name; Prefix = $p.Text
            Allocation = if ($alloc) { "$($alloc.Prefix.Text) $($alloc.Name)" } else { '' }
            Use = if ($alloc) { $alloc.Use } else { '' }
            PrefixObject = $p
        }
        if (-not $alloc) {
            $findings += [pscustomobject][ordered]@{ Check = 'Outside the plan'; Network = "$($n.Platform) $($n.Name)"; Prefix = $p.Text; Finding = 'No IPAM allocation contains it' }
        } elseif ($alloc.Use -ne $n.Platform) {
            $findings += [pscustomobject][ordered]@{ Check = 'Wrong allocation'; Network = "$($n.Platform) $($n.Name)"; Prefix = $p.Text; Finding = "Inside $($alloc.Prefix.Text), allocated to $($alloc.Use) ($($alloc.Name))" }
        }
    }
    for ($i = 0; $i -lt $rows.Count; $i++) {
        for ($k = $i + 1; $k -lt $rows.Count; $k++) {
            $a = $rows[$i]; $b = $rows[$k]
            if ((Test-FMPDdiContains $a.PrefixObject $b.PrefixObject) -or (Test-FMPDdiContains $b.PrefixObject $a.PrefixObject)) {
                $findings += [pscustomobject][ordered]@{ Check = 'Overlap'; Network = "$($a.Platform) $($a.Name)"; Prefix = $a.Prefix; Finding = "Overlaps $($b.Platform) $($b.Name), $($b.Prefix)" }
            }
        }
    }

    $targets = @()
    if ($run) {
        foreach ($z in @(Get-FMPDdiProperty $run.DnsInventory 'Zones' @() | Where-Object { "$($_.ZoneType)" -in 'Forwarder', 'Stub' })) {
            foreach ($m in @(Get-FMPDdiProperty $z 'MasterServers' @())) {
                $host32 = ConvertTo-FMPDdiPrefix "$m/$(if ("$m" -match ':') { 128 } else { 32 })"
                $in = if ($host32) { @($rows | Where-Object { Test-FMPDdiContains $_.PrefixObject $host32 }) | Select-Object -First 1 } else { $null }
                $alloc = if ($host32) { @($plan | Where-Object { Test-FMPDdiContains $_.Prefix $host32 } | Sort-Object { $_.Prefix.Length } -Descending) | Select-Object -First 1 } else { $null }
                $targets += [pscustomobject][ordered]@{
                    Zone = "$($z.ZoneName)"; Target = "$m"
                    Network = if ($in) { "$($in.Platform) $($in.Name)" } elseif ($alloc) { "$($alloc.Use) allocation $($alloc.Prefix.Text)" } else { 'Outside the address plan' }
                }
            }
        }
    }

    $out = @($rows | Select-Object Platform, Name, Prefix, Allocation, Use)
    if ($OutputPath) {
        $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
        $dir = Initialize-FMPPath -Path (Join-Path $root 'address-plan')
        Write-FMPCsv -InputObject $out -Path (Join-Path $dir 'AddressPlan.csv')
        Write-FMPCsv -InputObject $findings -Path (Join-Path $dir 'AddressPlanFindings.csv')
    }
    [pscustomobject]@{ Networks = $out; Findings = @($findings); ForwarderTargets = $targets }
}

function Get-FMPLocatorRecordName {
    # Book 08, Chapter 04's critical locator records for a domain (and its forest's global catalog).
    param([Parameter(Mandatory)][string]$Domain, [string]$Forest = $Domain, [string[]]$Site = @())
    $names = @(
        "_ldap._tcp.dc._msdcs.$Domain", "_kerberos._tcp.dc._msdcs.$Domain", "_kerberos._tcp.$Domain",
        "_ldap._tcp.pdc._msdcs.$Domain", "_kpasswd._tcp.$Domain", "_ldap._tcp.gc._msdcs.$Forest", "_gc._tcp.$Forest"
    )
    foreach ($s in $Site) { $names += "_ldap._tcp.$s._sites.dc._msdcs.$Domain" }
    $names
}

function Test-FMPLocatorResolution {
    <#
    .SYNOPSIS
        One check of Book 08's critical locator records against each resolver a location uses: the
        record Chapter 10's Phase 5 gate needs, every 15 minutes, from every site and network.
    .DESCRIPTION
        Resolves each SRV record of Chapter 04's table (and each site's, with -Site) against each
        -Resolver with Resolve-DnsName -DnsOnly, and returns one row per resolver: the time (UTC),
        the location, how many records resolved and which didn't. With -OutputPath it writes the rows
        to <OutputPath>\srv-checks\<time>-<location>.csv, one file per check, so a scheduled task
        run every 15 minutes from each location builds the history Test-FMPDdiDecommissionGate reads.
        Read-only: it sends DNS queries and nothing else.
    .EXAMPLE
        Test-FMPLocatorResolution -Domain lab.contoso.example -Resolver 10.50.0.10 -Location lab-dc -OutputPath C:\fmp-lab\gate
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Domain,
        [string]$Forest,
        [Parameter(Mandatory)][string[]]$Resolver,
        [Parameter(Mandatory)][string]$Location,
        [string[]]$Site = @(),
        [string]$OutputPath
    )
    Assert-FMPCommand -Name 'Resolve-DnsName' -Module 'DnsClient'
    if (-not $Forest) { $Forest = $Domain }
    $records = @(Get-FMPLocatorRecordName -Domain $Domain -Forest $Forest -Site $Site)
    $now = (Get-Date).ToUniversalTime()
    $rows = foreach ($r in $Resolver) {
        $failed = @()
        foreach ($name in $records) {
            $ok = $false
            try { $ok = @(Resolve-DnsName -Name $name -Type SRV -Server $r -DnsOnly -QuickTimeout -ErrorAction Stop | Where-Object { "$($_.Type)" -eq 'SRV' }).Count -gt 0 }
            catch { $ok = $false }
            if (-not $ok) { $failed += $name }
        }
        [pscustomobject][ordered]@{
            Timestamp = $now.ToString('yyyy-MM-ddTHH:mm:ssZ'); Location = $Location; Resolver = $r
            Records = $records.Count; Failed = ($failed -join ';'); Result = if ($failed.Count -eq 0) { 'PASS' } else { 'FAIL' }
        }
    }
    if ($OutputPath) {
        $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
        $dir = Initialize-FMPPath -Path (Join-Path $root 'srv-checks')
        $safe = ($Location -replace '[^\w.-]', '_')
        Write-FMPCsv -InputObject @($rows) -Path (Join-Path $dir ("{0}-{1}.csv" -f $now.ToString('yyyyMMddTHHmmssZ'), $safe))
    }
    @($rows)
}

function Read-FMPDdiCsv {
    # A CSV the gate reads, or $null when no path was given.
    param([string]$Path, [string]$What)
    if (-not $Path) { return $null }
    if (-not (Test-Path -LiteralPath $Path)) { throw "No $What at $Path." }
    @(Import-Csv -LiteralPath $Path)
}

function Test-FMPDdiDecommissionGate {
    <#
    .SYNOPSIS
        Book 08, Chapter 10's Phase 5 gates, from the evidence: AD DNS and DHCP are decommissioned only
        when all five pass.
    .DESCRIPTION
        Each gate reads its own evidence and is Pass, Fail, or Not evidenced (no input given, so the
        gate holds):

          1 Inventory reconciles   The Phase 1 run's zones against -TargetInventoryPath (Zone,
                                   Disposition of Moved, Retired, StaysOnAdDns or New, Reason,
                                   ChainValidates for signed zones), in both directions. A signed zone
                                   counts as moved only when its new chain validates; the _msdcs zone
                                   stays where domain controllers register.
          2 SRV resolution holds   The srv-checks history (Test-FMPLocatorResolution) for -SrvDays
                                   (30): every location, every check passing, no gap longer than twice
                                   -IntervalMinutes (15). After a failure or a gap the clock restarts.
          3 Parallel operation     -ParallelStart at least -ParallelDays (90) before -AsOf.
          4 Failover tested        -FailoverTestPath (Component, Date, Result): a passing test for the
                                   DNS resolvers and one for DHCP, none failing.
          5 Old servers idle       -LegacyQueryPath (Server, Date, DirectQueries): no direct queries in
                                   the last 7 days to the legacy servers that don't host locator zones.
    .EXAMPLE
        Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -AsOf 2026-11-20
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [string]$TargetInventoryPath,
        [string]$SrvCheckPath,
        [Nullable[datetime]]$ParallelStart,
        [string]$FailoverTestPath,
        [string]$LegacyQueryPath,
        [int]$SrvDays = 30,
        [int]$IntervalMinutes = 15,
        [int]$ParallelDays = 90,
        [datetime]$AsOf = (Get-Date),
        [string]$OutputPath
    )
    $run = Read-FMPDdiRun -Path $Path
    if ($null -eq $run.DnsInventory) { throw "No DNS\DNSInventory.json under $($run.Path): the gate reconciles against the Phase 1 run." }
    # A date given without a zone (-AsOf 2026-11-20) is UTC, so the result doesn't depend on the host's zone.
    $asOfUtc = if ($AsOf.Kind -eq [DateTimeKind]::Local) { $AsOf.ToUniversalTime() } else { [datetime]::SpecifyKind($AsOf, [DateTimeKind]::Utc) }
    $gates = @()
    function ConvertTo-FMPGateRow($n, $name, $status, $detail) { [pscustomobject][ordered]@{ Gate = $n; Name = $name; Status = $status; Detail = $detail } }

    # Gate 1
    $target = Read-FMPDdiCsv -Path $TargetInventoryPath -What 'target inventory'
    if ($null -eq $target) { $gates += ConvertTo-FMPGateRow 1 'Inventory reconciles' 'Not evidenced' 'No target inventory given' }
    else {
        $problems = @()
        $byZone = @{}
        foreach ($t in $target) { $byZone["$($t.Zone)".ToLowerInvariant()] = $t }
        $baseline = @(Get-FMPDdiProperty $run.DnsInventory 'Zones' @())
        foreach ($z in $baseline) {
            $key = "$($z.ZoneName)".ToLowerInvariant()
            if (-not $byZone.ContainsKey($key)) { $problems += "$($z.ZoneName): missing from the target"; continue }
            $t = $byZone[$key]; $d = "$($t.Disposition)"
            if ($d -notin 'Moved', 'Retired', 'StaysOnAdDns') { $problems += "$($z.ZoneName): disposition '$d' isn't Moved, Retired or StaysOnAdDns" }
            if ($key -like '_msdcs.*' -and $d -ne 'StaysOnAdDns') { $problems += "$($z.ZoneName): the locator zone stays where domain controllers register" }
            if ((Get-FMPDdiProperty $z 'IsSigned' $false) -and $d -eq 'Moved' -and "$(Get-FMPDdiProperty $t 'ChainValidates' '')" -ne 'Yes') { $problems += "$($z.ZoneName): signed, and the new chain of trust doesn't validate yet" }
        }
        $known = @($baseline | ForEach-Object { "$($_.ZoneName)".ToLowerInvariant() })
        foreach ($t in $target) {
            if ($known -notcontains "$($t.Zone)".ToLowerInvariant() -and -not ("$($t.Disposition)" -eq 'New' -and "$(Get-FMPDdiProperty $t 'Reason' '')")) {
                $problems += "$($t.Zone): in the target, not in the Phase 1 inventory, and not explained"
            }
        }
        $gates += if ($problems.Count) { ConvertTo-FMPGateRow 1 'Inventory reconciles' 'Fail' ($problems -join '; ') } else { ConvertTo-FMPGateRow 1 'Inventory reconciles' 'Pass' "$($baseline.Count) zones accounted for" }
    }

    # Gate 2
    if (-not $SrvCheckPath) { $gates += ConvertTo-FMPGateRow 2 'SRV resolution holds' 'Not evidenced' 'No SRV check history given' }
    else {
        if (-not (Test-Path -LiteralPath $SrvCheckPath)) { throw "No SRV check history at $SrvCheckPath." }
        $checks = @(Get-ChildItem -LiteralPath $SrvCheckPath -Filter *.csv -Recurse -File | ForEach-Object { Import-Csv -LiteralPath $_.FullName } |
            ForEach-Object { [pscustomobject]@{ Time = ([datetime]::Parse("$($_.Timestamp)", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)); Location = "$($_.Location)"; Result = "$($_.Result)"; Failed = "$($_.Failed)" } } |
            Where-Object { $_.Time -le $asOfUtc })
        $need = $asOfUtc.AddDays(-$SrvDays)
        $maxGap = [timespan]::FromMinutes(2 * $IntervalMinutes)
        $notes = @(); $ok = $checks.Count -gt 0
        foreach ($g in @($checks | Group-Object Location | Sort-Object Name)) {
            $series = @($g.Group | Sort-Object Time)
            # The clean streak: from the last failure or gap, forward to the last check.
            $start = $series[0].Time; $why = 'since the first check'
            for ($i = 0; $i -lt $series.Count; $i++) {
                if ($series[$i].Result -ne 'PASS') { $start = if ($i + 1 -lt $series.Count) { $series[$i + 1].Time } else { $asOfUtc }; $why = "since a failure at $($series[$i].Time.ToString('yyyy-MM-dd HH:mm'))Z ($($series[$i].Failed))" }
                elseif ($i -gt 0 -and ($series[$i].Time - $series[$i - 1].Time) -gt $maxGap) { $start = $series[$i].Time; $why = "since a $([math]::Round(($series[$i].Time - $series[$i - 1].Time).TotalHours, 1))-hour gap ending $($series[$i].Time.ToString('yyyy-MM-dd HH:mm'))Z" }
            }
            if (($asOfUtc - $series[-1].Time) -gt $maxGap) { $start = $asOfUtc; $why = "no check since $($series[-1].Time.ToString('yyyy-MM-dd HH:mm'))Z" }
            $days = [math]::Floor(($asOfUtc - $start).TotalDays)
            if ($start -gt $need) { $ok = $false; $notes += "$($g.Name): $days clean days $why" } else { $notes += "$($g.Name): clean for $SrvDays days" }
        }
        $gates += ConvertTo-FMPGateRow 2 'SRV resolution holds' $(if ($ok) { 'Pass' } else { 'Fail' }) ($notes -join '; ')
    }

    # Gate 3
    if ($null -eq $ParallelStart) { $gates += ConvertTo-FMPGateRow 3 'Parallel operation' 'Not evidenced' 'No start of parallel operation given' }
    else {
        $parallel = [math]::Floor(($AsOf.Date - ([datetime]$ParallelStart).Date).TotalDays)
        $gates += ConvertTo-FMPGateRow 3 'Parallel operation' $(if ($parallel -ge $ParallelDays) { 'Pass' } else { 'Fail' }) "$parallel days of $ParallelDays, since $(([datetime]$ParallelStart).ToString('yyyy-MM-dd'))"
    }

    # Gate 4
    $fo = Read-FMPDdiCsv -Path $FailoverTestPath -What 'failover test record'
    if ($null -eq $fo) { $gates += ConvertTo-FMPGateRow 4 'Failover tested' 'Not evidenced' 'No failover test record given' }
    else {
        $bad = @($fo | Where-Object { "$($_.Result)" -ne 'PASS' } | ForEach-Object { "$($_.Component) on $($_.Date): $($_.Result)" })
        $missing = @('DNS resolvers', 'DHCP' | Where-Object { $c = $_; -not @($fo | Where-Object { "$($_.Component)" -eq $c -and "$($_.Result)" -eq 'PASS' }).Count })
        $detail = @($bad) + @($missing | ForEach-Object { "no passing test for $_" })
        $gates += if ($detail.Count) { ConvertTo-FMPGateRow 4 'Failover tested' 'Fail' ($detail -join '; ') } else { ConvertTo-FMPGateRow 4 'Failover tested' 'Pass' "$(@($fo).Count) tests passed" }
    }

    # Gate 5
    $lq = Read-FMPDdiCsv -Path $LegacyQueryPath -What 'legacy query summary'
    if ($null -eq $lq) { $gates += ConvertTo-FMPGateRow 5 'Old servers idle' 'Not evidenced' 'No legacy query summary given' }
    else {
        $since = $AsOf.Date.AddDays(-7)
        $busy = @($lq | Where-Object { [datetime]::Parse("$($_.Date)", [Globalization.CultureInfo]::InvariantCulture) -gt $since -and [int]"$($_.DirectQueries)" -gt 0 } |
            Group-Object Server | ForEach-Object { "$($_.Name): $((($_.Group | ForEach-Object { [int]"$($_.DirectQueries)" }) | Measure-Object -Sum).Sum) direct queries in the last 7 days" })
        $gates += if ($busy.Count) { ConvertTo-FMPGateRow 5 'Old servers idle' 'Fail' ($busy -join '; ') } else { ConvertTo-FMPGateRow 5 'Old servers idle' 'Pass' 'No direct queries in the last 7 days' }
    }

    $passed = @($gates | Where-Object Status -ne 'Pass').Count -eq 0
    if ($OutputPath) {
        $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
        $dir = Get-FMPDomainPath -OutputPath $root -Domain $run.Domain -Area 'DDI'
        Write-FMPCsv -InputObject $gates -Path (Join-Path $dir 'DecommissionGate.csv')
    }
    [pscustomobject]@{ Domain = $run.Domain; AsOf = $AsOf; Passed = $passed; Gates = $gates }
}

# Book 08, Chapter 11's evidence, by the file each check writes: the kind of evidence (Book 00,
# Appendix D's five), what it supports, its KSI where the workbook has a verified pairing, and where
# Book 08 asks for it.
$script:FMPEvidenceMap = @(
    [pscustomobject]@{ Pattern = 'DNSInventory.json|DNSHealthReport.json|DNSRecordInventory.json'; Kind = 'Configuration'; Supports = 'CM-8, SC-22: zones, servers, locator records'; KSI = 'KSI-PIY-GIV'; Book08 = 'Chapter 10, Phase 1' }
    [pscustomobject]@{ Pattern = 'DHCPInventory.json|DHCPScopes.csv|DHCPReservations.csv'; Kind = 'Configuration'; Supports = 'CM-8: DHCP servers, scopes and options'; KSI = 'KSI-PIY-GIV'; Book08 = 'Chapter 10, Phase 1' }
    [pscustomobject]@{ Pattern = 'DepartureRegister.csv|DepartureRegister.json'; Kind = 'Configuration'; Supports = 'CM-3, CM-8: each component''s target, method and risk'; KSI = 'KSI-CMT-LMC, KSI-PIY-GIV'; Book08 = 'Chapter 10, Where each component goes' }
    [pscustomobject]@{ Pattern = 'DhcpEdge.csv'; Kind = 'Configuration'; Supports = 'M-22-09 and Protective DNS: option 6; CM-8: unauthorized DHCP servers'; KSI = 'KSI-PIY-GIV'; Book08 = 'Chapter 05; Chapter 11 checklist, option 6 and rogue DHCP' }
    [pscustomobject]@{ Pattern = 'AddressPlan.csv|AddressPlanFindings.csv'; Kind = 'Operational'; Supports = 'CM-8, BOD 23-01: the address plan reconciled'; KSI = 'KSI-PIY-GIV'; Book08 = 'Chapter 07; Chapter 11 checklist, IPAM inventory' }
    [pscustomobject]@{ Pattern = 'srv-checks'; Kind = 'Operational'; Supports = 'SC-22: locator resolution history'; KSI = 'None'; Book08 = 'Chapter 10, Phase 5 gate 2; Chapter 11, SRV check history' }
    [pscustomobject]@{ Pattern = 'DecommissionGate.csv'; Kind = 'Test'; Supports = 'CM-3, CP-2: the Phase 5 gates'; KSI = 'KSI-CMT-LMC, KSI-RPL-ARP'; Book08 = 'Chapter 10, Phase 5' }
)
# What Chapter 11's checklist asks for that the kit doesn't produce: the platform's and the SOC's.
$script:FMPEvidenceElsewhere = @(
    @('Configuration', 'Decisions 1 to 5 as running configuration; Protective DNS and encrypted DNS settings; delegated roles and scopes'),
    @('Operational', 'Query, lease and change logs at M-26-14 retention; anomaly reports with their tickets'),
    @('Test', 'The Phase 4 validation matrix from every origin; the resolution-path consistency test'),
    @('Exception', 'Unsigned internal zones, retired zones and privileged memberships kept by justification, each with its approver'),
    @('Assessor-ready artifact', 'The control mapping in Chapter 03 and Appendix B, each row pointing at the evidence')
)

function Get-FMPDdiEvidenceIndex {
    <#
    .SYNOPSIS
        An index of the evidence the Start Kit's DNS, DHCP and IPAM checks wrote, for the ISSO: each
        file's kind, what it supports, its KSI, its size and its SHA-256, and what Book 08, Chapter 11's
        checklist asks for that has to come from somewhere else.
    .DESCRIPTION
        Walks -Path (an evidence folder holding the runs and the checks' output), recognizes each file
        the kit writes, and hashes it. Files the kit didn't write are listed as Unrecognized, never
        dropped. With -OutputPath it writes EvidenceIndex.csv and EvidenceIndex.json there.
    .EXAMPLE
        Get-FMPDdiEvidenceIndex -Path D:\Evidence\ddi -OutputPath D:\Evidence\ddi-index
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$OutputPath)
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "No evidence folder at $Path." }
    $root = (ConvertTo-FMPFullPath -Path $Path).TrimEnd('\', '/')
    $files = @(Get-ChildItem -LiteralPath $root -Recurse -File | Sort-Object FullName)
    $rows = foreach ($f in $files) {
        $rel = $f.FullName.Substring($root.Length + 1) -replace '\\', '/'
        $entry = $null
        foreach ($m in $script:FMPEvidenceMap) {
            if ($f.Name -match "^($($m.Pattern -replace '\.', '\.'))$" -or ($m.Pattern -eq 'srv-checks' -and $rel -match '(^|/)srv-checks/')) { $entry = $m; break }
        }
        [pscustomobject][ordered]@{
            File = $rel
            Kind = if ($entry) { $entry.Kind } else { 'Unrecognized' }
            Supports = if ($entry) { $entry.Supports } else { '' }
            KSI = if ($entry) { $entry.KSI } else { '' }
            Book08 = if ($entry) { $entry.Book08 } else { '' }
            Bytes = $f.Length
            SHA256 = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }
    $elsewhere = @($script:FMPEvidenceElsewhere | ForEach-Object { [pscustomobject][ordered]@{ Kind = $_[0]; NotFromTheKit = $_[1] } })
    if ($OutputPath) {
        $out = Resolve-FMPOutputRoot -OutputPath $OutputPath
        Write-FMPCsv -InputObject @($rows) -Path (Join-Path $out 'EvidenceIndex.csv')
        Write-FMPJson -InputObject ([ordered]@{ Source = $root; Files = @($rows); NotFromTheKit = $elsewhere }) -Path (Join-Path $out 'EvidenceIndex.json') -Depth 5
    }
    [pscustomobject]@{ Files = @($rows); NotFromTheKit = $elsewhere }
}

Export-ModuleMember -Function Read-FMPDdiRun, Get-FMPDnsDepartureRegister, Test-FMPDhcpEdge, Test-FMPAddressPlan,
    Test-FMPLocatorResolution, Test-FMPDdiDecommissionGate, Get-FMPDdiEvidenceIndex
