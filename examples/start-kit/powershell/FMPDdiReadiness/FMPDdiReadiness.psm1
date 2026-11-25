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

Export-ModuleMember -Function Read-FMPDdiRun, Get-FMPDnsDepartureRegister
