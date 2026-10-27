# Shared setup for the Start Kit Pester tests. Dot-source it in BeforeAll.
#
# The RSAT cmdlets usually aren't installed where the tests run, and Pester can only mock a
# command that exists, so stubs are defined first. Every stub throws if it is ever called
# unmocked, so no test can reach a real directory, DNS server, DHCP server or SQL Server.

$script:KitRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:FixturePath = Join-Path (Join-Path $script:KitRoot 'tests') 'fixtures'

$stubNames = @(
    'Get-ADForest', 'Get-ADDomain', 'Get-ADDomainController', 'Get-ADRootDSE', 'Get-ADObject', 'Get-ADUser',
    'Get-ADComputer', 'Get-ADGroup', 'Get-ADGroupMember', 'Get-ADServiceAccount', 'Get-ADOrganizationalUnit',
    'Get-ADTrust', 'Get-ADReplicationSite', 'Get-ADReplicationSiteLink', 'Get-ADReplicationSubnet',
    'Get-GPO', 'Get-GPOReport', 'Get-GPPermission', 'Get-GPInheritance',
    'Get-DnsServerZone', 'Get-DnsServerResourceRecord', 'Get-DnsServerDnsSecZoneSetting', 'Get-DnsServerScavenging',
    'Get-DnsServerForwarder', 'Get-DhcpServerInDC', 'Get-DhcpServerv4Scope', 'Get-DhcpServerv4Reservation',
    'Get-DhcpServerv6Scope', 'Get-DhcpServerv4OptionValue', 'Get-DhcpServerv4Failover', 'Find-DbaInstance'
)
$stubBody = {
    [CmdletBinding()]
    param($Filter, $LDAPFilter, $Identity, $Server, $Properties, $SearchBase, $SearchScope, $Domain, $DomainName,
        [switch]$All, $Guid, $ReportType, $ComputerName, $ZoneName, [switch]$Recursive, $Target, $ResultSetSize,
        [switch]$IncludeDeletedObjects, $ScopeId, [switch]$Discover, $Type, $Name)
    throw "Stub $($MyInvocation.MyCommand.Name) was called without a mock."
}
foreach ($n in $stubNames) {
    if (-not (Get-Command -Name $n -ErrorAction SilentlyContinue)) {
        Set-Item -Path "function:global:$n" -Value $stubBody
    }
}

function global:Read-KitFixture([string]$Name) {
    Get-Content -Raw -Path (Join-Path $script:FixturePath $Name) | ConvertFrom-Json
}
$global:FMPFix = Read-KitFixture 'ad-forest.json'
$global:FMPSqlFix = Read-KitFixture 'sql-estate.json'
$global:FMPGpoPath = Join-Path $script:FixturePath 'gpo'
$global:FMPAsOf = [datetime]'2026-10-27T00:00:00'

function global:Get-FixDomain($Server) {
    if ($Server) { "$Server" } else { $global:FMPFix.forest.RootDomain }
}
function global:Get-FixList($Map, $Key) {
    $p = $Map.PSObject.Properties[$Key]
    if ($p) { @($p.Value) } else { @() }
}
function global:Get-ParentDN([string]$DN) {
    $i = $DN.IndexOf(',')
    if ($i -lt 0) { '' } else { $DN.Substring($i + 1) }
}
function global:Select-FixObjects($Objects, $Identity, $SearchBase, $SearchScope, $LDAPFilter, $ResultSetSize) {
    $o = @($Objects)
    if ($Identity) {
        return @($o | Where-Object { "$($_.SID)" -eq "$Identity" -or "$($_.DistinguishedName)" -eq "$Identity" -or "$($_.SamAccountName)" -eq "$Identity" }) | Select-Object -First 1
    }
    if ($SearchBase -and "$SearchScope" -eq 'OneLevel') { $o = @($o | Where-Object { (Get-ParentDN $_.DistinguishedName) -eq $SearchBase }) }
    if ($LDAPFilter -and $LDAPFilter -match '\(name=\*([^*]+)\*\)|\(sAMAccountName=\*([^*]+)\*\)') {
        $hint = if ($Matches[1]) { $Matches[1] } else { $Matches[2] }
        $o = @($o | Where-Object { "$($_.Name) $($_.SamAccountName) $($_.Description)" -match [regex]::Escape($hint) })
    } elseif ($LDAPFilter -match 'operatingSystem=\*Server\*') {
        $o = @($o | Where-Object { "$($_.OperatingSystem)" -match 'Server' -and $_.Enabled })
    }
    if ($ResultSetSize) { $o = @($o | Select-Object -First $ResultSetSize) }
    $o
}

function global:Register-KitAdMocks([string]$ModuleName) {
    $m = @{ ModuleName = $ModuleName }
    Mock @m Get-ADForest { $global:FMPFix.forest }
    Mock @m Get-ADDomain { $global:FMPFix.domains.(Get-FixDomain $Server) }
    Mock @m Get-ADDomainController {
        if ($Discover) { return @(Get-FixList $global:FMPFix.dcs $DomainName)[0] }
        Get-FixList $global:FMPFix.dcs (Get-FixDomain $Server)
    }
    Mock @m Get-ADRootDSE { $global:FMPFix.rootDse }
    Mock @m Get-ADReplicationSite { $global:FMPFix.sites }
    Mock @m Get-ADReplicationSiteLink { $global:FMPFix.siteLinks }
    Mock @m Get-ADReplicationSubnet {
        if ($Filter -match "Site -eq '(.+)'") { $dn = $Matches[1]; return @($global:FMPFix.subnets | Where-Object Site -eq $dn) }
        $global:FMPFix.subnets
    }
    Mock @m Get-ADOrganizationalUnit { Select-FixObjects (Get-FixList $global:FMPFix.ous (Get-FixDomain $Server)) -SearchBase $SearchBase -SearchScope $SearchScope }
    Mock @m Get-ADUser { Select-FixObjects (Get-FixList $global:FMPFix.users (Get-FixDomain $Server)) $Identity $SearchBase $SearchScope $LDAPFilter $ResultSetSize }
    Mock @m Get-ADComputer { Select-FixObjects (Get-FixList $global:FMPFix.computers (Get-FixDomain $Server)) $Identity $SearchBase $SearchScope $LDAPFilter $ResultSetSize }
    Mock @m Get-ADGroup { Select-FixObjects (Get-FixList $global:FMPFix.groups (Get-FixDomain $Server)) $Identity $SearchBase $SearchScope $LDAPFilter $ResultSetSize }
    Mock @m Get-ADGroupMember {
        $map = $global:FMPFix.groupMembers.(Get-FixDomain $Server)
        if ($map -and $map.PSObject.Properties[$Identity]) { @($map.$Identity) } else { @() }
    }
    Mock @m Get-ADServiceAccount { Get-FixList $global:FMPFix.serviceAccounts (Get-FixDomain $Server) }
    Mock @m Get-ADTrust { Get-FixList $global:FMPFix.trusts (Get-FixDomain $Server) }
    Mock @m Get-ADObject {
        $d = Get-FixDomain $Server
        $schemaNC = $global:FMPFix.rootDse.schemaNamingContext
        if ($Identity) {
            if ($Identity -eq $schemaNC) { return $global:FMPFix.schema.head }
            return $global:FMPFix.domainHeads.$d
        }
        if ($SearchBase) {
            if ($SearchBase -like 'CN=Sites,*') { return @($global:FMPFix.sites | Where-Object gPLink) }
            if ($SearchBase -like 'CN=Enrollment Services,*') { return $global:FMPFix.pki.cas }
            if ($SearchBase -like 'CN=Certificate Templates,*') { if ($ResultSetSize) { return @($global:FMPFix.pki.templates)[0] }; return $global:FMPFix.pki.templates }
            if ($SearchBase -like 'CN=CDP,*' -or $SearchBase -like 'CN=AIA,*') { return @() }
            if ($SearchBase -like 'CN=Deleted Objects,*') { throw 'Access is denied.' }
            if ($SearchBase -eq $schemaNC) { return $global:FMPFix.schema.objects }
        }
        $objs = Get-FixList $global:FMPFix.spnObjects $d
        if ($LDAPFilter -eq '(servicePrincipalName=MSSQLSvc/*)') { return @($objs | Where-Object { @($_.servicePrincipalName | Where-Object { $_ -like 'MSSQLSvc/*' }).Count -gt 0 }) }
        if ($LDAPFilter -eq '(servicePrincipalName=*)') { return $objs }
        throw "Unmocked Get-ADObject call: $LDAPFilter $SearchBase"
    }
    Mock @m Get-Acl {
        [pscustomobject]@{ Access = @(
                [pscustomobject]@{ IdentityReference = 'CONTOSO\Helpdesk'; ActiveDirectoryRights = 'ReadProperty, WriteProperty'; AccessControlType = 'Allow'; ObjectType = [guid]::Empty; InheritedObjectType = [guid]::Empty; InheritanceType = 'All'; IsInherited = $false }
                [pscustomobject]@{ IdentityReference = 'NT AUTHORITY\SYSTEM'; ActiveDirectoryRights = 'GenericAll'; AccessControlType = 'Allow'; ObjectType = [guid]::Empty; InheritedObjectType = [guid]::Empty; InheritanceType = 'None'; IsInherited = $false }
            ) }
    }
    Mock @m Get-GPO { Get-FixList $global:FMPFix.gpos (Get-FixDomain $Domain) }
    Mock @m Get-GPOReport {
        if ("$ReportType" -eq 'Html') { return '<html><body>report</body></html>' }
        Get-Content -Raw -Path (Join-Path (Join-Path $global:FMPGpoPath (Get-FixDomain $Domain)) "$Guid.xml")
    }
    Mock @m Get-GPPermission { @([pscustomobject]@{ Trustee = [pscustomobject]@{ Name = 'Domain Admins'; SidType = 'Group' }; Permission = 'GpoEditDeleteModifySecurity'; Inherited = $false }) }
    Mock @m Get-GPInheritance { [pscustomobject]@{ GpoInheritanceBlocked = 'No'; GpoLinks = @() } }
    Mock @m Get-DnsServerZone {
        $z = $global:FMPFix.dnsZones.PSObject.Properties["$ComputerName"]
        if (-not $z) { throw 'The RPC server is unavailable.' }
        @($z.Value)
    }
    Mock @m Get-DnsServerResourceRecord { if ($ZoneName -eq 'contoso.example') { $global:FMPFix.dnsRecords } else { @() } }
    Mock @m Get-DnsServerScavenging { throw 'Access is denied.' }
    Mock @m Get-DnsServerForwarder { [pscustomobject]@{ IPAddress = @('192.0.2.1'); UseRootHint = $true } }
    Mock @m Get-DnsServerDnsSecZoneSetting { @() }
    Mock @m Resolve-DnsName { @([pscustomobject]@{ Type = 'SRV'; NameTarget = 'dc01.contoso.example' }) }
    Mock @m Get-DhcpServerInDC { $global:FMPFix.dhcp.authorized }
    Mock @m Get-DhcpServerv4Scope {
        $s = $global:FMPFix.dhcp.scopes.PSObject.Properties["$ComputerName"]
        if (-not $s) { throw 'Access is denied.' }
        @($s.Value)
    }
    Mock @m Get-DhcpServerv4Reservation { Get-FixList $global:FMPFix.dhcp.reservations "$ScopeId" }
    Mock @m Get-DhcpServerv6Scope { @() }
    Mock @m Get-DhcpServerv4OptionValue { @([pscustomobject]@{ OptionId = 6; Name = 'DNS Servers'; Value = @('10.0.0.10') }) }
    Mock @m Get-DhcpServerv4Failover { @() }
    Mock @m Get-WinEvent {
        switch -Wildcard ("$ComputerName") {
            'dc01.*' {
                @(
                    [pscustomobject]@{ Id = 2889; TimeCreated = [datetime]'2026-10-25T10:00:00'; Properties = @([pscustomobject]@{ Value = '10.0.5.40:51234' }, [pscustomobject]@{ Value = 'CONTOSO\svc-legacy' }, [pscustomobject]@{ Value = '1' }) }
                    [pscustomobject]@{ Id = 2889; TimeCreated = [datetime]'2026-10-26T10:00:00'; Properties = @([pscustomobject]@{ Value = '10.0.5.40:51299' }, [pscustomobject]@{ Value = 'CONTOSO\svc-legacy' }, [pscustomobject]@{ Value = '1' }) }
                    [pscustomobject]@{ Id = 2889; TimeCreated = [datetime]'2026-10-26T11:00:00'; Properties = @([pscustomobject]@{ Value = '[fe80::1]:50000' }, [pscustomobject]@{ Value = 'CONTOSO\jdoe' }, [pscustomobject]@{ Value = '0' }) }
                    [pscustomobject]@{ Id = 2887; TimeCreated = [datetime]'2026-10-26T00:00:00'; Properties = @([pscustomobject]@{ Value = 2 }, [pscustomobject]@{ Value = 1 }) }
                )
            }
            'cdc01.*' { throw 'No events were found that match the specified selection criteria.' }
            default { throw 'Access is denied.' }
        }
    }
}

function global:Register-KitSqlMocks {
    $m = @{ ModuleName = 'FMPSqlEstate' }
    Mock @m Invoke-FMPUdpQuery {
        $p = $global:FMPSqlFix.browser.PSObject.Properties["$ComputerName"]
        if (-not $p) { return $null }
        $text = [System.Text.Encoding]::ASCII.GetBytes($p.Value)
        $n = $text.Length
        , ([byte[]](@(0x05, ($n % 256), [math]::Floor($n / 256)) + $text))
    }
    Mock @m Invoke-FMPSqlQuery {
        if ($ConnectionString -notmatch 'Server=tcp:([^;]+)') { throw 'A network-related or instance-specific error occurred.' }
        $target = $global:FMPSqlFix.tsql.PSObject.Properties[$Matches[1]]
        if (-not $target) { throw 'A network-related or instance-specific error occurred.' }
        $name = switch -Regex ($Query) {
            'SERVERPROPERTY' { 'Properties'; break }
            'dm_os_sys_info' { 'EngineStart'; break }
            'server_principals' { 'Logins'; break }
            'dm_db_index_usage_stats' { 'LastUse'; break }
            'sys\.databases' { 'Databases'; break }
            'sys\.servers' { 'LinkedServers'; break }
        }
        @($target.Value.$name)
    }
}
