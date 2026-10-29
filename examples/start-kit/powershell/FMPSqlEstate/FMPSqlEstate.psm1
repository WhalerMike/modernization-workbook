#Requires -Version 5.1
<#
.SYNOPSIS
    Read-only SQL Server estate discovery for the Start Kit: counts and inventories SQL Server
    instances from three independent signals, optionally reads each one with SELECT-only
    T-SQL, and fuses the results into one deduplicated inventory with counts.

.DESCRIPTION
    The three signals (Book 06, Runbook R02, Step 1):
      SPN        MSSQLSvc service principal names, read from every domain in the forest.
      Directory  Computer objects and service accounts whose name or description suggests
                 SQL Server, and the hosts allowed to use a SQL-named gMSA.
      Network    The SQL Server Browser service on UDP 1434 ([MC-SQLR] CLNT_UCAST_EX), or
                 dbatools' Find-DbaInstance when it's installed and -UseDbatools is set.
    Each instance records which signals saw it and whether they agree.

    The optional T-SQL pass (-QueryInstances) connects with Windows integrated
    authentication and ApplicationIntent=ReadOnly and runs only the SELECT statements in
    Get-FMPSqlQueryCatalog; Invoke-FMPSqlQuery refuses anything else.

    Field names follow Runbook R03's audit output (ServerName, InstanceName, Port,
    DiscoveryMethod, SQLVersion, SQLVersionMajor, SQLEdition, AuthenticationMode, SQLLogins,
    WindowsLogins, LinkedServers) and Runbook R02's first-pass gate (retain, consolidate,
    retire, review), so the output can be read beside the program's scripts.

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

# SQL Server major version to product name (Microsoft Learn, "Determine which version and
# edition of SQL Server Database Engine is running"). 10.50 is 2008 R2.
$script:FMPSqlVersionNames = @{
    8 = '2000'; 9 = '2005'; 10 = '2008'; 11 = '2012'; 12 = '2014'; 13 = '2016'
    14 = '2017'; 15 = '2019'; 16 = '2022'; 17 = '2025'
}

# Every statement the kit sends to SQL Server. All SELECT; see Test-FMPSelectOnly.
# Permissions: SQL Server 2019 and earlier need VIEW SERVER STATE for the two DMVs; 2022 and
# later need VIEW SERVER PERFORMANCE STATE. Seeing every login needs ALTER ANY LOGIN or
# VIEW ANY DEFINITION (2022 and later: VIEW ANY SECURITY DEFINITION); without it the login
# list is silently partial. sys.linked_logins needs VIEW SERVER SECURITY STATE on 2022+.
$script:FMPSqlQueries = [ordered]@{
    Properties   = @'
SELECT CAST(SERVERPROPERTY('MachineName') AS nvarchar(256))   AS machine_name,
       CAST(SERVERPROPERTY('ServerName') AS nvarchar(256))    AS server_name,
       CAST(SERVERPROPERTY('InstanceName') AS nvarchar(256))  AS instance_name,
       CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(64)) AS product_version,
       CAST(SERVERPROPERTY('ProductLevel') AS nvarchar(64))   AS product_level,
       CAST(SERVERPROPERTY('Edition') AS nvarchar(128))       AS edition,
       CAST(SERVERPROPERTY('IsIntegratedSecurityOnly') AS int) AS is_integrated_security_only,
       CAST(SERVERPROPERTY('IsClustered') AS int)             AS is_clustered,
       CAST(SERVERPROPERTY('IsHadrEnabled') AS int)           AS is_hadr_enabled
'@
    EngineStart  = 'SELECT sqlserver_start_time FROM sys.dm_os_sys_info'
    Logins       = @'
SELECT p.name, p.type_desc, p.is_disabled, p.create_date,
       CASE WHEN p.sid = 0x01 THEN 1 ELSE 0 END AS is_sa,
       CAST(LOGINPROPERTY(p.name, 'PasswordLastSetTime') AS datetime) AS password_last_set
FROM sys.server_principals AS p
WHERE p.type IN ('S', 'U', 'G', 'E', 'X') AND p.name NOT LIKE '##%'
'@
    Databases    = @'
SELECT d.database_id, d.name, d.state_desc, d.recovery_model_desc, d.compatibility_level, d.create_date
FROM sys.databases AS d
'@
    LastUse      = @'
SELECT database_id, DB_NAME(database_id) AS database_name,
       MAX(last_user_seek) AS last_seek, MAX(last_user_scan) AS last_scan,
       MAX(last_user_lookup) AS last_lookup, MAX(last_user_update) AS last_update
FROM sys.dm_db_index_usage_stats
GROUP BY database_id
'@
    LinkedServers = @'
SELECT s.name AS linked_server, s.data_source, s.product, s.provider,
       ll.uses_self_credential, ll.remote_name
FROM sys.servers AS s
LEFT JOIN sys.linked_logins AS ll ON ll.server_id = s.server_id
WHERE s.is_linked = 1
'@
    # For Measure-FMPSqlRoundTrip (FMPTransactionProfile): one row per user connection, with
    # the server's own clock. The constant row keeps the server time when nothing else is
    # connected; the poller's own session is left out.
    Sessions     = @'
SELECT SYSDATETIME() AS server_time, c.connection_id, c.session_id, c.connect_time,
       c.num_reads, c.num_writes, c.net_packet_size, c.client_net_address,
       s.host_name, s.program_name, s.login_name, DB_NAME(s.database_id) AS database_name
FROM (SELECT 1 AS one) AS k
LEFT JOIN sys.dm_exec_connections AS c
     INNER JOIN sys.dm_exec_sessions AS s ON s.session_id = c.session_id
     ON s.is_user_process = 1 AND c.session_id <> @@SPID
'@
}

function Get-FMPSqlQueryCatalog {
    <#
    .SYNOPSIS
        Returns the T-SQL the kit can send, for review. Every statement is a SELECT.
    #>
    [CmdletBinding()]
    param()
    $script:FMPSqlQueries
}

function Test-FMPSelectOnly {
    <#
    .SYNOPSIS
        True when a T-SQL batch is a single SELECT (or WITH ... SELECT) that can't change
        anything: no DML, DDL, EXEC, SELECT INTO, procedures, OPENROWSET or second statement.
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Query)
    # Strip comments and string literals so neither can hide or fake a keyword.
    $s = $Query -replace '(?s)/\*.*?\*/', ' '
    $s = $s -replace '--[^\r\n]*', ' '
    $s = $s -replace "N?'(?:[^']|'')*'", "''"
    $s = $s.Trim().TrimEnd(';').Trim()
    if ($s -notmatch '^(?i)(SELECT|WITH)\b') { return $false }
    if ($s.Contains(';')) { return $false }
    $forbidden = 'INSERT|UPDATE|DELETE|MERGE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE|DENY|' +
                 'BACKUP|RESTORE|DBCC|SHUTDOWN|KILL|RECONFIGURE|OPENROWSET|OPENQUERY|OPENDATASOURCE|OPENXML|' +
                 'INTO|USE|BULK|WAITFOR|SETUSER|DISABLE|ENABLE|DECLARE|SET'
    if ($s -match "(?i)\b($forbidden)\b") { return $false }
    if ($s -match '(?i)\b(sp|xp)_\w+') { return $false }
    $true
}

function Invoke-FMPSqlQuery {
    # The only place the kit sends T-SQL. Refuses anything Test-FMPSelectOnly rejects.
    param(
        [Parameter(Mandatory)][string]$ConnectionString,
        [Parameter(Mandatory)][string]$Query
    )
    if (-not (Test-FMPSelectOnly -Query $Query)) { throw 'Refusing to run T-SQL that is not a single SELECT.' }
    $conn = [System.Data.SqlClient.SqlConnection]::new($ConnectionString)
    try {
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $Query
        $cmd.CommandTimeout = 60
        $reader = $cmd.ExecuteReader()
        while ($reader.Read()) {
            $row = [ordered]@{}
            for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                $v = $reader.GetValue($i)
                if ($v -is [System.DBNull]) { $v = $null }
                $row[$reader.GetName($i)] = $v
            }
            [pscustomobject]$row
        }
        $reader.Close()
    } finally {
        $conn.Dispose()
    }
}

function Get-FMPSqlSessionCounter {
    <#
    .SYNOPSIS
        One snapshot of the instance's user connections and their network read and write
        counters, with the server's clock. SELECT-only; needs VIEW SERVER STATE (2022 and
        later: VIEW SERVER PERFORMANCE STATE). Filtering is left to the caller, so no
        caller-supplied text is ever put into the T-SQL.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$ConnectionString)
    $rows = @(Invoke-FMPSqlQuery -ConnectionString $ConnectionString -Query $script:FMPSqlQueries.Sessions)
    [pscustomobject]@{
        ServerTime  = if ($rows.Count) { $rows[0].server_time } else { $null }
        Connections = @($rows | Where-Object { $null -ne $_.connection_id })
    }
}

function Get-FMPSqlConnectionString {
    <#
    .SYNOPSIS
        A read-intent, Windows-integrated connection string for one instance.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$ServerName,
        [string]$InstanceName,
        [int]$Port,
        [switch]$TrustServerCertificate
    )
    $target = if ($Port -gt 0) { "tcp:$ServerName,$Port" }
              elseif ($InstanceName -and $InstanceName -ne 'MSSQLSERVER') { "$ServerName\$InstanceName" }
              else { $ServerName }
    $trust = if ($TrustServerCertificate) { 'True' } else { 'False' }
    "Server=$target;Database=master;Integrated Security=SSPI;ApplicationIntent=ReadOnly;Application Name=FMP Start Kit (read-only);Connect Timeout=15;Encrypt=True;TrustServerCertificate=$trust"
}

function Get-FMPSqlVersionName {
    [CmdletBinding()]
    param([AllowNull()][string]$Version)
    if (-not $Version) { return 'Unknown' }
    $parts = $Version.Split('.')
    $major = 0
    if (-not [int]::TryParse($parts[0], [ref]$major)) { return 'Unknown' }
    if ($major -eq 10 -and $parts.Count -gt 1 -and $parts[1] -eq '50') { return '2008 R2' }
    if ($script:FMPSqlVersionNames.ContainsKey($major)) { return $script:FMPSqlVersionNames[$major] }
    "Unknown ($major)"
}

function ConvertFrom-FMPSqlSpn {
    <#
    .SYNOPSIS
        Parses one MSSQLSvc SPN. MSSQLSvc/<host>:<port> is a TCP registration,
        MSSQLSvc/<host>:<instance> a named instance, and MSSQLSvc/<host> the default instance.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Spn)
    if ($Spn -notmatch '^(?i)MSSQLSvc/([^:/]+)(?::([^/]+))?$') { return $null }
    $hostName = $Matches[1].ToLowerInvariant()
    $suffix = $Matches[2]
    $port = $null
    $instance = $null
    if (-not $suffix) { $instance = 'MSSQLSERVER' }
    elseif ($suffix -match '^\d+$') { $port = [int]$suffix }
    else { $instance = $suffix.ToUpperInvariant() }
    [pscustomobject]@{ Host = $hostName; Port = $port; InstanceName = $instance; Spn = $Spn }
}

function ConvertFrom-FMPUac {
    param($Value)
    if ($null -eq $Value) { return $null }
    -not (([int64]$Value -band 0x2) -eq 0x2)
}

function ConvertFrom-FMPFileTime {
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '' -or [int64]$Value -le 0) { return $null }
    [datetime]::FromFileTimeUtc([int64]$Value)
}

function Get-FMPForestDomainList {
    # The domains to read: -Domain if given, else every domain in the forest. -Forest names a
    # forest other than the one this host is joined to (it must trust this account).
    param([string[]]$Domain, [string]$Forest)
    if ($Domain) { return $Domain }
    if ($Forest) { return @((Get-ADForest -Server $Forest -ErrorAction Stop).Domains) }
    @((Get-ADForest -ErrorAction Stop).Domains)
}

function Get-FMPSqlSpnInstance {
    <#
    .SYNOPSIS
        Signal 1: every MSSQLSvc SPN in every domain of the forest, one row per SPN.
    .DESCRIPTION
        Default read rights: servicePrincipalName is readable by authenticated users. The
        query runs against each domain in turn, the same coverage as setspn -T * -F -Q.
    #>
    [CmdletBinding()]
    param([string[]]$Domain)
    Assert-FMPCommand -Name 'Get-ADObject' -Module 'ActiveDirectory'
    foreach ($d in (Get-FMPForestDomainList -Domain $Domain)) {
        $objects = Get-ADObject -LDAPFilter '(servicePrincipalName=MSSQLSvc/*)' -Server $d -ErrorAction Stop `
            -Properties servicePrincipalName, sAMAccountName, objectClass, userAccountControl, lastLogonTimestamp
        foreach ($o in @($objects)) {
            foreach ($spn in @($o.servicePrincipalName | Where-Object { $_ -match '^(?i)MSSQLSvc/' })) {
                $p = ConvertFrom-FMPSqlSpn -Spn $spn
                if (-not $p) { continue }
                [pscustomobject]@{
                    Source         = 'SPN'
                    Host           = $p.Host
                    InstanceName   = $p.InstanceName
                    Port           = $p.Port
                    Spn            = $spn
                    ServiceAccount = $o.sAMAccountName
                    AccountClass   = "$($o.objectClass)"
                    AccountEnabled = ConvertFrom-FMPUac -Value $o.userAccountControl
                    LastLogonUtc   = ConvertFrom-FMPFileTime -Value $o.lastLogonTimestamp
                    AccountDomain  = $d
                }
            }
        }
    }
}

function Get-FMPSqlDirectoryCandidate {
    <#
    .SYNOPSIS
        Signal 2: hosts and service accounts the directory suggests run SQL Server.
    .DESCRIPTION
        Computer objects whose name or description contains -NameHint; user accounts and
        managed service accounts whose sAMAccountName or description contains it; and the
        computers allowed to retrieve a matching gMSA's password. Default read rights.
        Returns @{ Hosts; ServiceAccounts }. Host-level only: the directory doesn't say
        which instances a host runs.
    #>
    [CmdletBinding()]
    param(
        [string[]]$Domain,
        [string]$NameHint = 'sql'
    )
    Assert-FMPCommand -Name 'Get-ADComputer' -Module 'ActiveDirectory'
    $hint = $NameHint -replace '[\*\(\)\\]', ''
    $hosts = @()
    $accounts = @()
    foreach ($d in (Get-FMPForestDomainList -Domain $Domain)) {
        foreach ($c in @(Get-ADComputer -LDAPFilter "(|(name=*$hint*)(description=*$hint*))" -Server $d -ErrorAction Stop `
                    -Properties DNSHostName, Description, OperatingSystem, Enabled)) {
            $name = if ($c.DNSHostName) { "$($c.DNSHostName)".ToLowerInvariant() } else { "$($c.Name)".ToLowerInvariant() }
            $hosts += [pscustomobject]@{ Source = 'Directory'; Host = $name; Reason = 'Computer name or description'; Enabled = $c.Enabled; OperatingSystem = $c.OperatingSystem; Domain = $d }
        }
        foreach ($u in @(Get-ADUser -LDAPFilter "(|(sAMAccountName=*$hint*)(description=*$hint*))" -Server $d -ErrorAction Stop `
                    -Properties Description, Enabled, ServicePrincipalName, PasswordLastSet, LastLogonDate)) {
            $accounts += [pscustomobject]@{
                SamAccountName = $u.SamAccountName; Domain = $d; Type = 'User'; Enabled = $u.Enabled
                HasMSSQLSvcSpn = @($u.ServicePrincipalName | Where-Object { $_ -match '^(?i)MSSQLSvc/' }).Count -gt 0
                PasswordLastSet = $u.PasswordLastSet; LastLogonDate = $u.LastLogonDate; Description = $u.Description
            }
        }
        foreach ($m in @(Get-ADServiceAccount -Filter * -Server $d -ErrorAction Stop `
                    -Properties Description, Enabled, ServicePrincipalName, PrincipalsAllowedToRetrieveManagedPassword, ObjectClass |
                Where-Object { "$($_.SamAccountName) $($_.Description)" -match [regex]::Escape($hint) })) {
            $accounts += [pscustomobject]@{
                SamAccountName = $m.SamAccountName; Domain = $d; Type = "$($m.ObjectClass)"; Enabled = $m.Enabled
                HasMSSQLSvcSpn = @($m.ServicePrincipalName | Where-Object { $_ -match '^(?i)MSSQLSvc/' }).Count -gt 0
                PasswordLastSet = $null; LastLogonDate = $null; Description = $m.Description
            }
            foreach ($dn in @($m.PrincipalsAllowedToRetrieveManagedPassword)) {
                try {
                    $pc = Get-ADComputer -Identity $dn -Server $d -Properties DNSHostName -ErrorAction Stop
                    $hosts += [pscustomobject]@{ Source = 'Directory'; Host = "$($pc.DNSHostName)".ToLowerInvariant(); Reason = "May retrieve gMSA $($m.SamAccountName)"; Enabled = $pc.Enabled; OperatingSystem = $null; Domain = $d }
                } catch {
                    Write-Verbose "gMSA principal $dn is not a computer (a group is not expanded): $($_.Exception.Message)"
                }
            }
        }
    }
    @{
        Hosts           = @($hosts | Where-Object { $_.Host } | Sort-Object Host -Unique)
        ServiceAccounts = @($accounts | Sort-Object Domain, SamAccountName)
    }
}

function Get-FMPServerComputer {
    # Every enabled Windows Server computer object: the sweep list for -ProbeAllServers,
    # the same population as Find-DbaInstance -DiscoveryType DomainServer.
    param([string[]]$Domain)
    foreach ($d in (Get-FMPForestDomainList -Domain $Domain)) {
        Get-ADComputer -LDAPFilter '(&(operatingSystem=*Server*)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))' -Server $d `
            -Properties DNSHostName -ErrorAction Stop |
            Where-Object { $_.DNSHostName } | ForEach-Object { "$($_.DNSHostName)".ToLowerInvariant() }
    }
}

function ConvertFrom-FMPSqlBrowserResponse {
    <#
    .SYNOPSIS
        Parses an [MC-SQLR] SVR_RESP: 0x05, a two-byte little-endian length, then
        "ServerName;X;InstanceName;Y;IsClustered;No;Version;15.0.2000.5;tcp;1433;;" per instance.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][byte[]]$Bytes,
        [Parameter(Mandatory)][string]$QueriedHost
    )
    if ($Bytes.Length -lt 3 -or $Bytes[0] -ne 0x05) { return }
    $size = [int]$Bytes[1] + 256 * [int]$Bytes[2]
    $size = [math]::Min($size, $Bytes.Length - 3)
    $text = [System.Text.Encoding]::ASCII.GetString($Bytes, 3, $size)
    foreach ($chunk in ($text -split ';;')) {
        if (-not $chunk.Trim()) { continue }
        $parts = $chunk.Split(';')
        $kv = @{}
        for ($i = 0; $i + 1 -lt $parts.Count; $i += 2) { $kv[$parts[$i].ToLowerInvariant()] = $parts[$i + 1] }
        if (-not $kv.ContainsKey('instancename')) { continue }
        $port = $null
        if ($kv.ContainsKey('tcp') -and $kv['tcp'] -match '^\d+$') { $port = [int]$kv['tcp'] }
        [pscustomobject]@{
            Source       = 'Network'
            Host         = $QueriedHost.ToLowerInvariant()
            InstanceName = $kv['instancename'].ToUpperInvariant()
            Port         = $port
            Version      = $kv['version']
            IsClustered  = ($kv['isclustered'] -eq 'Yes')
            Method       = 'SQL Browser'
        }
    }
}

function Invoke-FMPUdpQuery {
    # One UDP request and one reply; $null on timeout or refusal.
    param(
        [Parameter(Mandatory)][string]$ComputerName,
        [int]$Port = 1434,
        [Parameter(Mandatory)][byte[]]$Payload,
        [int]$TimeoutMs = 1500
    )
    $client = [System.Net.Sockets.UdpClient]::new()
    try {
        $client.Client.ReceiveTimeout = $TimeoutMs
        $client.Connect($ComputerName, $Port)
        [void]$client.Send($Payload, $Payload.Length)
        $remote = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
        , $client.Receive([ref]$remote)
    } catch {
        $null
    } finally {
        $client.Close()
    }
}

function Find-FMPSqlBrowserInstance {
    <#
    .SYNOPSIS
        Signal 3: asks each host's SQL Server Browser (UDP 1434) which instances it runs.
    .DESCRIPTION
        Sends [MC-SQLR] CLNT_UCAST_EX (one byte, 0x03) to each host and parses the reply.
        A host with the Browser stopped, a hidden instance or UDP 1434 blocked returns
        nothing, which is why this is one signal of three. With -UseDbatools and dbatools
        installed, Find-DbaInstance runs instead (it adds TCP-port, SPN and DNS probes).
        Neither logs in to SQL Server. Probe traffic can trip intrusion detection: tell
        security operations the window first.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$ComputerName,
        [int]$TimeoutMs = 1500,
        [switch]$UseDbatools
    )
    $targets = @($ComputerName | Where-Object { $_ } | ForEach-Object { $_.ToLowerInvariant() } | Sort-Object -Unique)
    if ($targets.Count -eq 0) { return }
    if ($UseDbatools -and (Test-FMPCommand -Name 'Find-DbaInstance')) {
        foreach ($r in @(Find-DbaInstance -ComputerName $targets)) {
            [pscustomobject]@{
                Source       = 'Network'
                Host         = "$($r.ComputerName)".ToLowerInvariant()
                InstanceName = "$($r.InstanceName)".ToUpperInvariant()
                Port         = if ($r.Port) { [int]$r.Port } else { $null }
                Version      = $null
                IsClustered  = $null
                Method       = 'dbatools Find-DbaInstance'
            }
        }
        return
    }
    if ($UseDbatools) { Write-Warning 'dbatools is not installed; using the SQL Browser probe instead.' }
    foreach ($t in $targets) {
        $reply = Invoke-FMPUdpQuery -ComputerName $t -Payload ([byte[]](0x03)) -TimeoutMs $TimeoutMs
        if ($reply) { ConvertFrom-FMPSqlBrowserResponse -Bytes $reply -QueriedHost $t }
    }
}

function Get-FMPSqlInstanceDetail {
    <#
    .SYNOPSIS
        The optional read-only T-SQL pass for one instance: version, edition, authentication
        mode, logins by type, databases, last use and linked servers.
    .DESCRIPTION
        Each query runs on its own; a query the login can't run is recorded in QueryErrors and
        the rest still run. If the connection fails, QueryStatus is 'Query Failed'.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$ServerName,
        [string]$InstanceName,
        [int]$Port,
        [datetime]$AsOf = (Get-Date),
        [switch]$TrustServerCertificate
    )
    $cs = Get-FMPSqlConnectionString -ServerName $ServerName -InstanceName $InstanceName -Port $Port -TrustServerCertificate:$TrustServerCertificate
    $results = @{}
    $errors = @()
    foreach ($name in $script:FMPSqlQueries.Keys) {
        try {
            $results[$name] = @(Invoke-FMPSqlQuery -ConnectionString $cs -Query $script:FMPSqlQueries[$name])
        } catch {
            $errors += [pscustomobject]@{ Query = $name; Error = $_.Exception.Message }
            if ($name -eq 'Properties') { break }
        }
    }
    if (-not $results.ContainsKey('Properties') -or $results['Properties'].Count -eq 0) {
        return [pscustomobject]@{
            ServerName = $ServerName; InstanceName = $InstanceName; Port = $Port
            QueryStatus = 'Query Failed'; AuthenticationMode = 'Query Failed'; QueryErrors = $errors
        }
    }
    $get = { param($n) if ($results.ContainsKey($n)) { $results[$n] } else { @() } }
    $p = $results['Properties'][0]
    $logins = @(& $get 'Logins')
    $dbs = @(& $get 'Databases')
    $use = @(& $get 'LastUse')
    $linked = @(& $get 'LinkedServers')
    $start = $null
    $es = @(& $get 'EngineStart')
    if ($es.Count -gt 0 -and $es[0].sqlserver_start_time) { $start = [datetime]$es[0].sqlserver_start_time }

    $userUse = @($use | Where-Object { [int]$_.database_id -gt 4 })
    $times = @($userUse | ForEach-Object { $_.last_seek; $_.last_scan; $_.last_lookup; $_.last_update } | Where-Object { $_ } | ForEach-Object { [datetime]$_ })
    $lastAccess = if ($times.Count -gt 0) { ($times | Measure-Object -Maximum).Maximum } else { $null }
    $major = $null
    if ($p.product_version) { $major = [int]("$($p.product_version)".Split('.')[0]) }
    $auth = switch ("$($p.is_integrated_security_only)") { '1' { 'Windows' } '0' { 'Mixed' } default { 'Unknown' } }
    $sa = @($logins | Where-Object { "$($_.is_sa)" -eq '1' }) | Select-Object -First 1

    [pscustomobject]@{
        ServerName           = $ServerName
        InstanceName         = if ($p.instance_name) { "$($p.instance_name)".ToUpperInvariant() } else { 'MSSQLSERVER' }
        Port                 = $Port
        QueryStatus          = if ($errors.Count -gt 0) { 'Partial' } else { 'OK' }
        QueryErrors          = $errors
        SQLVersion           = "$($p.product_version)"
        SQLVersionMajor      = $major
        SQLVersionName       = Get-FMPSqlVersionName -Version "$($p.product_version)"
        ProductLevel         = "$($p.product_level)"
        SQLEdition           = "$($p.edition)"
        AuthenticationMode   = $auth
        IsClustered          = ("$($p.is_clustered)" -eq '1')
        IsHadrEnabled        = ("$($p.is_hadr_enabled)" -eq '1')
        EngineStartTime      = $start
        SaEnabled            = if ($sa) { -not [bool]$sa.is_disabled } else { $null }
        SQLLogins            = @($logins | Where-Object type_desc -eq 'SQL_LOGIN' | ForEach-Object { $_.name })
        WindowsLogins        = @($logins | Where-Object type_desc -eq 'WINDOWS_LOGIN' | ForEach-Object { $_.name })
        WindowsGroups        = @($logins | Where-Object type_desc -eq 'WINDOWS_GROUP' | ForEach-Object { $_.name })
        ExternalLogins       = @($logins | Where-Object { $_.type_desc -match '^EXTERNAL_' } | ForEach-Object { $_.name })
        Logins               = @($logins | ForEach-Object {
                [pscustomobject]@{
                    LoginName = $_.name; LoginType = $_.type_desc; IsDisabled = [bool]$_.is_disabled
                    IsSA = ("$($_.is_sa)" -eq '1'); CreatedDate = $_.create_date
                    PasswordLastSet = if ($_.type_desc -eq 'SQL_LOGIN') { $_.password_last_set } else { $null }
                } })
        Databases            = @($dbs | ForEach-Object {
                $id = [int]$_.database_id
                $u = @($use | Where-Object { [int]$_.database_id -eq $id }) | Select-Object -First 1
                $dt = @(if ($u) { $u.last_seek; $u.last_scan; $u.last_lookup; $u.last_update }) | Where-Object { $_ } | ForEach-Object { [datetime]$_ }
                [pscustomobject]@{
                    DatabaseName = $_.name; DatabaseId = $id; IsSystem = ($id -le 4); State = $_.state_desc
                    RecoveryModel = $_.recovery_model_desc; CompatibilityLevel = $_.compatibility_level; CreateDate = $_.create_date
                    LastUserAccess = if ($dt.Count -gt 0) { ($dt | Measure-Object -Maximum).Maximum } else { $null }
                } })
        LastUserAccess       = $lastAccess
        LinkedServers        = @($linked | ForEach-Object {
                [pscustomobject]@{
                    LinkedServer = $_.linked_server; DataSource = $_.data_source; Product = $_.product; Provider = $_.provider
                    UsesSelfCredential = $_.uses_self_credential; RemoteName = $_.remote_name
                } })
    }
}

function Get-FMPSqlClassification {
    <#
    .SYNOPSIS
        Runbook R02's first-pass gate: retire, consolidate, retain or review.
    .DESCRIPTION
        Retire when no user database has been touched for -ZombieThresholdDays and the engine
        has been up at least that long (the usage DMV is cleared at every restart, so a short
        uptime can't prove disuse). Otherwise SQL Server 2022 (16) or later is retain and an
        earlier engine is consolidate. No version, review. Human judgment confirms or
        overrides every row; the dependency lens isn't automated.
    #>
    [CmdletBinding()]
    param(
        $Major,
        $LastUserAccess,
        $EngineStartTime,
        [datetime]$AsOf = (Get-Date),
        [int]$ZombieThresholdDays = 400
    )
    if ($EngineStartTime) {
        $uptime = ($AsOf - [datetime]$EngineStartTime).TotalDays
        $idle = if ($LastUserAccess) { ($AsOf - [datetime]$LastUserAccess).TotalDays } else { $uptime }
        if ($idle -ge $ZombieThresholdDays -and $uptime -ge $ZombieThresholdDays) {
            return [pscustomobject]@{ Classification = 'retire'; Reason = "No user-database access in $([int]$idle) days, engine up $([int]$uptime) days" }
        }
    }
    if ($null -eq $Major -or "$Major" -eq '') { return [pscustomobject]@{ Classification = 'review'; Reason = 'Version unknown; run the T-SQL pass or the R03 audit' } }
    if ([int]$Major -ge 16) { return [pscustomobject]@{ Classification = 'retain'; Reason = 'SQL Server 2022 or later' } }
    [pscustomobject]@{ Classification = 'consolidate'; Reason = 'Engine earlier than SQL Server 2022' }
}

function Merge-FMPSqlEstate {
    <#
    .SYNOPSIS
        Fuses the three signals and the optional T-SQL detail into one row per instance.
    .DESCRIPTION
        Keys on host and instance name, so an instance seen by several signals counts once.
        A port-only SPN (MSSQLSvc/host:port) joins the instance on that host with that port;
        failing that, port 1433 is taken as the default instance, and any other port is kept
        as PORT-<n>. SourcesAgree is 'Yes' when every signal that ran saw the instance and
        they report the same port; SourceNotes says what differs. Directory candidates are
        host-level: they confirm a host, and a candidate host no other signal confirms is
        returned in CandidateHosts, not counted as an instance.
    #>
    [CmdletBinding()]
    param(
        [object[]]$SpnRecords = @(),
        [object[]]$DirectoryHosts = @(),
        [object[]]$NetworkRecords = @(),
        [object[]]$InstanceDetails = @(),
        [string[]]$SignalsRun = @('SPN', 'Directory', 'Network'),
        [datetime]$AsOf = (Get-Date),
        [int]$ZombieThresholdDays = 400
    )
    $byKey = [ordered]@{}
    $key = { param($h, $i) '{0}\{1}' -f $h.ToLowerInvariant(), $i.ToUpperInvariant() }
    $getRow = {
        param($h, $i)
        $k = & $key $h $i
        if (-not $byKey.Contains($k)) {
            $byKey[$k] = [ordered]@{ Host = $h.ToLowerInvariant(); InstanceName = $i.ToUpperInvariant(); Ports = @{}; Seen = @{}; Spns = @(); Accounts = @(); BrowserVersion = $null; IsClustered = $null; NetworkMethod = $null }
        }
        $byKey[$k]
    }

    # Named instances first, from the network and from instance-named SPNs.
    foreach ($n in @($NetworkRecords)) {
        $r = & $getRow $n.Host $n.InstanceName
        $r.Seen['Network'] = $true
        if ($n.Port) { $r.Ports["Network:$($n.Port)"] = [int]$n.Port }
        if ($n.Version) { $r.BrowserVersion = $n.Version }
        if ($null -ne $n.IsClustered) { $r.IsClustered = $n.IsClustered }
        $r.NetworkMethod = $n.Method
    }
    $portOnly = @()
    foreach ($s in @($SpnRecords)) {
        if ($s.InstanceName) {
            $r = & $getRow $s.Host $s.InstanceName
            $r.Seen['SPN'] = $true
            $r.Spns += $s.Spn
            if ($s.ServiceAccount) { $r.Accounts += $s.ServiceAccount }
        } else { $portOnly += $s }
    }
    foreach ($s in $portOnly) {
        $match = @($byKey.Values | Where-Object { $_.Host -eq $s.Host -and @($_.Ports.Values) -contains [int]$s.Port }) | Select-Object -First 1
        if (-not $match) {
            $inst = if ([int]$s.Port -eq 1433) { 'MSSQLSERVER' } else { "PORT-$($s.Port)" }
            $match = & $getRow $s.Host $inst
        }
        $match.Seen['SPN'] = $true
        $match.Spns += $s.Spn
        $match.Ports["SPN:$($s.Port)"] = [int]$s.Port
        if ($s.ServiceAccount) { $match.Accounts += $s.ServiceAccount }
    }
    $dirHosts = @{}
    foreach ($d in @($DirectoryHosts)) { if ($d.Host) { $dirHosts[$d.Host.ToLowerInvariant()] = $d } }
    foreach ($r in $byKey.Values) { if ($dirHosts.ContainsKey($r.Host)) { $r.Seen['Directory'] = $true } }

    $details = @{}
    foreach ($x in @($InstanceDetails)) { if ($x) { $details[(& $key $x.ServerName $x.InstanceName)] = $x } }

    $rows = foreach ($r in $byKey.Values) {
        $k = & $key $r.Host $r.InstanceName
        $x = if ($details.ContainsKey($k)) { $details[$k] } else { $null }
        $seen = @('SPN', 'Directory', 'Network' | Where-Object { $r.Seen.ContainsKey($_) })
        $missing = @($SignalsRun | Where-Object { $seen -notcontains $_ })
        $ports = @($r.Ports.Values | Sort-Object -Unique)
        $notes = @()
        if ($missing.Count -gt 0) { $notes += 'Not found by ' + ($missing -join ', ') }
        if ($ports.Count -gt 1) { $notes += 'Port differs: ' + (($r.Ports.Keys | Sort-Object) -join ', ') }
        $hasDetail = $x -and $x.QueryStatus -ne 'Query Failed'
        $version = if ($hasDetail) { $x.SQLVersion } elseif ($r.BrowserVersion) { $r.BrowserVersion } else { $null }
        if ($hasDetail -and $r.BrowserVersion -and $x.SQLVersion -and ($r.BrowserVersion.Split('.')[0] -ne $x.SQLVersion.Split('.')[0])) {
            $notes += "Version differs: Browser $($r.BrowserVersion), T-SQL $($x.SQLVersion)"
        }
        $major = $null
        if ($version) { $tmp = 0; if ([int]::TryParse($version.Split('.')[0], [ref]$tmp)) { $major = $tmp } }
        $gate = Get-FMPSqlClassification -Major $major -LastUserAccess $(if ($hasDetail) { $x.LastUserAccess }) `
            -EngineStartTime $(if ($hasDetail) { $x.EngineStartTime }) -AsOf $AsOf -ZombieThresholdDays $ZombieThresholdDays
        $domain = if ($r.Host.Contains('.')) { $r.Host.Substring($r.Host.IndexOf('.') + 1) } else { 'Unknown' }
        $lastAccess = if ($hasDetail -and $x.LastUserAccess) { [datetime]$x.LastUserAccess } else { $null }
        [pscustomobject][ordered]@{
            ServerName          = $r.Host
            InstanceName        = $r.InstanceName
            Port                = if ($ports.Count -gt 0) { $ports[0] } else { $null }
            Domain              = $domain
            DiscoveryMethod     = ($seen -join ';')
            SpnSeen             = $r.Seen.ContainsKey('SPN')
            DirectorySeen       = $r.Seen.ContainsKey('Directory')
            NetworkSeen         = $r.Seen.ContainsKey('Network')
            SourcesAgree        = if ($notes.Count -eq 0) { 'Yes' } else { 'No' }
            SourceNotes         = ($notes -join '; ')
            SQLVersion          = if ($version) { $version } else { 'Unknown' }
            SQLVersionMajor     = $major
            SQLVersionName      = Get-FMPSqlVersionName -Version $version
            SQLEdition          = if ($hasDetail -and $x.SQLEdition) { $x.SQLEdition } else { 'Unknown' }
            AuthenticationMode  = if ($x) { $x.AuthenticationMode } else { 'Unknown' }
            IsClustered         = if ($hasDetail) { $x.IsClustered } else { $r.IsClustered }
            ServiceAccount      = (@($r.Accounts | Sort-Object -Unique) -join ';')
            SPNRegistration     = @($r.Spns | Sort-Object -Unique)
            SqlLoginCount       = if ($hasDetail) { @($x.SQLLogins).Count } else { $null }
            WindowsLoginCount   = if ($hasDetail) { @($x.WindowsLogins).Count } else { $null }
            WindowsGroupCount   = if ($hasDetail) { @($x.WindowsGroups).Count } else { $null }
            ExternalLoginCount  = if ($hasDetail) { @($x.ExternalLogins).Count } else { $null }
            SaEnabled           = if ($hasDetail) { $x.SaEnabled } else { $null }
            DatabaseCount       = if ($hasDetail) { @($x.Databases).Count } else { $null }
            UserDatabaseCount   = if ($hasDetail) { @($x.Databases | Where-Object { -not $_.IsSystem }).Count } else { $null }
            LastUserAccess      = if ($lastAccess) { $lastAccess.ToString('o') } else { $null }
            LastAccessAgeDays   = if ($lastAccess) { [int]($AsOf - $lastAccess).TotalDays } else { $null }
            EngineStartTime     = if ($hasDetail -and $x.EngineStartTime) { ([datetime]$x.EngineStartTime).ToString('o') } else { $null }
            LinkedServerCount   = if ($hasDetail) { @($x.LinkedServers | ForEach-Object { $_.LinkedServer } | Sort-Object -Unique).Count } else { $null }
            QueryStatus         = if ($x) { $x.QueryStatus } else { 'Not queried' }
            Classification      = $gate.Classification
            ClassificationReason = $gate.Reason
        }
    }
    $confirmed = @{}
    foreach ($r in $byKey.Values) { $confirmed[$r.Host] = $true }
    $candidates = @($dirHosts.Values | Where-Object { -not $confirmed.ContainsKey($_.Host.ToLowerInvariant()) } |
            Select-Object Host, Reason, Domain | Sort-Object Host)
    [pscustomobject]@{
        Instances      = @($rows | Sort-Object ServerName, InstanceName)
        CandidateHosts = $candidates
    }
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

function Get-FMPSqlEstateSummary {
    <#
    .SYNOPSIS
        Counts over the fused inventory: total, by version, edition, domain, authentication
        mode, source agreement, signal and first-pass classification.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Instances,
        [object[]]$CandidateHosts = @(),
        [object[]]$ServiceAccounts = @()
    )
    [ordered]@{
        InstanceCount                 = @($Instances).Count
        HostCount                     = @($Instances | ForEach-Object { $_.ServerName } | Sort-Object -Unique).Count
        ByVersion                     = Get-FMPCountTable -Rows $Instances -Property SQLVersionName
        ByEdition                     = Get-FMPCountTable -Rows $Instances -Property SQLEdition
        ByDomain                      = Get-FMPCountTable -Rows $Instances -Property Domain
        ByAuthenticationMode          = Get-FMPCountTable -Rows $Instances -Property AuthenticationMode
        BySourcesAgree                = Get-FMPCountTable -Rows $Instances -Property SourcesAgree
        ByClassification              = Get-FMPCountTable -Rows $Instances -Property Classification
        BySignal                      = [ordered]@{
            SPN       = @($Instances | Where-Object SpnSeen).Count
            Directory = @($Instances | Where-Object DirectorySeen).Count
            Network   = @($Instances | Where-Object NetworkSeen).Count
        }
        CandidateHostsWithoutInstance = @($CandidateHosts).Count
        SqlServiceAccounts            = @($ServiceAccounts).Count
    }
}

function Invoke-FMPSqlEstateDiscovery {
    <#
    .SYNOPSIS
        Counts and inventories the SQL Server estate. Read-only; writes only under -OutputPath.
    .DESCRIPTION
        Runs the SPN and directory signals, then the network signal over every host they
        found plus -TargetServers (and every enabled Windows Server with -ProbeAllServers),
        then, with -QueryInstances, the read-only T-SQL pass. Writes, under <OutputPath>\SQL:
          SqlEstate.csv            one row per instance, with SourcesAgree and SourceNotes
          SqlEstate.json           { Metadata, Summary, InstanceAudits[], CandidateHosts[] }
          SqlEstateSummary.json    the counts
          SqlSignals.json          what each signal returned, unfused
          SqlServiceAccounts.csv   SQL-named service accounts from the directory
          SqlLogins.csv, SqlDatabases.csv, SqlLinkedServers.csv   with -QueryInstances
    .EXAMPLE
        Invoke-FMPSqlEstateDiscovery -OutputPath D:\Assessment\run1 -ProbeNetwork -QueryInstances
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string[]]$Domain,
        [string]$Forest,
        [string[]]$TargetServers = @(),
        [switch]$ProbeNetwork,
        [switch]$ProbeAllServers,
        [switch]$UseDbatools,
        [switch]$QueryInstances,
        [switch]$TrustServerCertificate,
        [string]$NameHint = 'sql',
        [int]$ZombieThresholdDays = 400,
        [datetime]$AsOf = (Get-Date)
    )
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $sqlPath = Initialize-FMPPath -Path (Join-Path $root 'SQL')
    $domains = Get-FMPForestDomainList -Domain $Domain -Forest $Forest
    $signals = @('SPN', 'Directory')

    $spn = @(Get-FMPSqlSpnInstance -Domain $domains)
    $dir = Get-FMPSqlDirectoryCandidate -Domain $domains -NameHint $NameHint
    $net = @()
    if ($ProbeNetwork -or $ProbeAllServers -or $UseDbatools) {
        $signals += 'Network'
        $targets = @($spn | ForEach-Object { $_.Host }) + @($dir.Hosts | ForEach-Object { $_.Host }) + @($TargetServers)
        if ($ProbeAllServers) { $targets += @(Get-FMPServerComputer -Domain $domains) }
        $net = @(Find-FMPSqlBrowserInstance -ComputerName $targets -UseDbatools:$UseDbatools)
    }

    $first = Merge-FMPSqlEstate -SpnRecords $spn -DirectoryHosts $dir.Hosts -NetworkRecords $net -SignalsRun $signals -AsOf $AsOf -ZombieThresholdDays $ZombieThresholdDays
    $details = @()
    if ($QueryInstances) {
        foreach ($i in $first.Instances) {
            $port = if ($i.Port) { [int]$i.Port } else { 0 }
            $inst = if ($i.InstanceName -like 'PORT-*') { $null } else { $i.InstanceName }
            $d = Get-FMPSqlInstanceDetail -ServerName $i.ServerName -InstanceName $inst -Port $port -AsOf $AsOf -TrustServerCertificate:$TrustServerCertificate
            # Key the detail on the inventory's name, so a port-keyed row still joins.
            $d.InstanceName = $i.InstanceName
            $details += $d
        }
    }
    $merged = Merge-FMPSqlEstate -SpnRecords $spn -DirectoryHosts $dir.Hosts -NetworkRecords $net -InstanceDetails $details `
        -SignalsRun $signals -AsOf $AsOf -ZombieThresholdDays $ZombieThresholdDays
    $summary = Get-FMPSqlEstateSummary -Instances $merged.Instances -CandidateHosts $merged.CandidateHosts -ServiceAccounts $dir.ServiceAccounts

    $flat = foreach ($i in $merged.Instances) {
        $o = [ordered]@{}
        foreach ($p in $i.PSObject.Properties) {
            $o[$p.Name] = if ($p.Name -eq 'SPNRegistration') { @($p.Value) -join ';' } else { $p.Value }
        }
        [pscustomobject]$o
    }
    Write-FMPCsv -InputObject $flat -Path (Join-Path $sqlPath 'SqlEstate.csv')

    $audits = foreach ($i in $merged.Instances) {
        $x = @($details | Where-Object { $_.ServerName -eq $i.ServerName -and $_.InstanceName -eq $i.InstanceName }) | Select-Object -First 1
        $o = [ordered]@{}
        foreach ($p in $i.PSObject.Properties) { $o[$p.Name] = $p.Value }
        $o['SQLLogins']     = if ($x -and $x.QueryStatus -ne 'Query Failed') { @($x.SQLLogins) } else { @() }
        $o['WindowsLogins'] = if ($x -and $x.QueryStatus -ne 'Query Failed') { @($x.WindowsLogins) + @($x.WindowsGroups) } else { @() }
        $o['LinkedServers'] = if ($x -and $x.QueryStatus -ne 'Query Failed') { @($x.LinkedServers) } else { @() }
        $o['QueryErrors']   = if ($x) { @($x.QueryErrors) } else { @() }
        [pscustomobject]$o
    }
    $doc = [ordered]@{
        Metadata       = [ordered]@{
            Schema = 'fmp-start-kit/sql-estate/1'; KitVersion = $script:FMPKitVersion; GeneratedUtc = $AsOf.ToUniversalTime().ToString('o')
            Domains = @($domains); SignalsRun = @($signals); QueryInstances = [bool]$QueryInstances; ZombieThresholdDays = $ZombieThresholdDays
        }
        Summary        = $summary
        InstanceAudits = @($audits)
        CandidateHosts = @($merged.CandidateHosts)
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $sqlPath 'SqlEstate.json') -Depth 8
    Write-FMPJson -InputObject $summary -Path (Join-Path $sqlPath 'SqlEstateSummary.json') -Depth 5
    Write-FMPJson -InputObject ([ordered]@{ SPN = $spn; Directory = $dir.Hosts; Network = $net }) -Path (Join-Path $sqlPath 'SqlSignals.json') -Depth 5
    Write-FMPCsv -InputObject $dir.ServiceAccounts -Path (Join-Path $sqlPath 'SqlServiceAccounts.csv')

    if ($QueryInstances) {
        $ok = @($details | Where-Object { $_.QueryStatus -ne 'Query Failed' })
        Write-FMPCsv -InputObject @($ok | ForEach-Object { $d = $_; $d.Logins | Select-Object @{ N = 'ServerName'; E = { $d.ServerName } }, @{ N = 'InstanceName'; E = { $d.InstanceName } }, * }) -Path (Join-Path $sqlPath 'SqlLogins.csv')
        Write-FMPCsv -InputObject @($ok | ForEach-Object { $d = $_; $d.Databases | Select-Object @{ N = 'ServerName'; E = { $d.ServerName } }, @{ N = 'InstanceName'; E = { $d.InstanceName } }, * }) -Path (Join-Path $sqlPath 'SqlDatabases.csv')
        Write-FMPCsv -InputObject @($ok | ForEach-Object { $d = $_; $d.LinkedServers | Select-Object @{ N = 'ServerName'; E = { $d.ServerName } }, @{ N = 'InstanceName'; E = { $d.InstanceName } }, * }) -Path (Join-Path $sqlPath 'SqlLinkedServers.csv')
    }
    Write-Verbose "SQL estate: $($summary.InstanceCount) instances on $($summary.HostCount) hosts."
    [pscustomobject]@{ Instances = $merged.Instances; CandidateHosts = $merged.CandidateHosts; Summary = $summary }
}

Export-ModuleMember -Function @(
    'Get-FMPSqlQueryCatalog', 'Test-FMPSelectOnly', 'Get-FMPSqlConnectionString', 'Get-FMPSqlSessionCounter', 'Get-FMPSqlVersionName',
    'ConvertFrom-FMPSqlSpn', 'Get-FMPSqlSpnInstance', 'Get-FMPSqlDirectoryCandidate', 'ConvertFrom-FMPSqlBrowserResponse',
    'Find-FMPSqlBrowserInstance', 'Get-FMPSqlInstanceDetail', 'Get-FMPSqlClassification', 'Merge-FMPSqlEstate',
    'Get-FMPSqlEstateSummary', 'Invoke-FMPSqlEstateDiscovery'
)
