#Requires -Version 7.1
<#
.SYNOPSIS
    Lab 2. Reads one or more SQL Server instances, read-only, and writes an audit snapshot in the shape the
    kit's other scripts read (the same shape as the fixtures). Not run by the workbook's authors.
.DESCRIPTION
    Runs SELECT statements only: SERVERPROPERTY, sys.server_principals with CONNECT SQL and server roles,
    sys.dm_server_services, each database's users and role memberships, and sys.dm_exec_connections joined to
    sys.dm_exec_sessions. It needs the SqlServer module (with Invoke-Sqlcmd -Encrypt) and a login with
    VIEW SERVER STATE (VIEW SERVER PERFORMANCE STATE and VIEW SERVER SECURITY STATE on SQL Server 2022 and
    later), VIEW ANY DEFINITION (VIEW ANY SECURITY DEFINITION on 2022 and later) and CONNECT ANY DATABASE for
    the per-database reads; never sysadmin. A database it can't read is skipped with a warning. The
    registry LoginMode needs host access and is left null. A named instance keeps its name (HOST\INSTANCE).
    On an instance already closed to Windows logins, sign in with an Entra token (-AccessToken), or the
    reader's own Windows login fails the closure record's condition 1 unless the registry dates it.
.PARAMETER SqlInstance
    The instances to read, as host,port.
.PARAMETER OutputPath
    The snapshot file to write.
.PARAMETER AsOf
    The date of the snapshot (yyyy-MM-dd).
.PARAMETER AccessToken
    Optional: a Microsoft Entra access token for https://database.windows.net/ (string or SecureString).
    Without it, Invoke-Sqlcmd uses the caller's Windows sign-in.
.EXAMPLE
    ./Export-SqlAuditSnapshot.ps1 -SqlInstance 'sqltest01.contoso.example,1433' -OutputPath lab2/audit.json -AsOf 2026-11-20
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string[]]$SqlInstance, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf,
      [object]$AccessToken)
$ErrorActionPreference = 'Stop'
$OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
Import-Module SqlServer
if ($AccessToken -is [securestring]) { $AccessToken = ConvertFrom-SecureString -SecureString $AccessToken -AsPlainText }
$auth = if ($AccessToken) { @{ AccessToken = $AccessToken } } else { @{} }
$q = @{
    props = "SELECT CAST(SERVERPROPERTY('ServerName') AS nvarchar(256)) AS name, CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(64)) AS productVersion, CAST(SERVERPROPERTY('IsIntegratedSecurityOnly') AS int) AS isIntegratedSecurityOnly, CAST(SERVERPROPERTY('IsClustered') AS int) AS isClustered, CAST(SERVERPROPERTY('IsExternalAuthenticationOnly') AS int) AS isExternalAuthenticationOnly;"
    logins = "SELECT p.name, p.type, p.is_disabled AS isDisabled, CASE WHEN EXISTS (SELECT 1 FROM sys.server_permissions sp WHERE sp.grantee_principal_id = p.principal_id AND sp.permission_name = 'CONNECT SQL' AND sp.state IN ('G','W')) THEN 1 ELSE 0 END AS hasConnectSql, CASE WHEN p.sid = 0x01 THEN 1 ELSE 0 END AS isSa, (SELECT STRING_AGG(r.name, ',') FROM sys.server_role_members m JOIN sys.server_principals r ON r.principal_id = m.role_principal_id WHERE m.member_principal_id = p.principal_id) AS serverRoles FROM sys.server_principals p WHERE p.type IN ('U','G','S','C','K','E','X');"
    service = "SELECT TOP (1) service_account FROM sys.dm_server_services WHERE servicename LIKE 'SQL Server (%';"
    dbs = "SELECT name FROM sys.databases WHERE database_id > 4 AND state = 0;"
    users = "SELECT u.name, sp.name AS login, (SELECT STRING_AGG(r.name, ',') FROM sys.database_role_members m JOIN sys.database_principals r ON r.principal_id = m.role_principal_id WHERE m.member_principal_id = u.principal_id) AS roles FROM sys.database_principals u LEFT JOIN sys.server_principals sp ON sp.sid = u.sid WHERE u.type IN ('U','G','S','E','X') AND u.principal_id > 4;"
    conns = "SELECT s.original_login_name AS principal, c.auth_scheme AS authScheme, CASE WHEN c.client_net_address = '<local machine>' THEN 1 ELSE 0 END AS isLocal, COUNT(*) AS sessions FROM sys.dm_exec_connections c JOIN sys.dm_exec_sessions s ON s.session_id = c.session_id GROUP BY s.original_login_name, c.auth_scheme, CASE WHEN c.client_net_address = '<local machine>' THEN 1 ELSE 0 END;"
}
$split = { param($v) if ("$v") { @("$v".Split(',')) } else { @() } }
$instances = foreach ($si in $SqlInstance) {
    $run = { param($sql, $db = 'master') Invoke-Sqlcmd -ServerInstance $si -Database $db -Query $sql -Encrypt Mandatory -ApplicationIntent ReadOnly @auth -ErrorAction Stop }
    $p = & $run $q.props
    $port = if ($si -match ',(\d+)$') { [int]$Matches[1] } else { 1433 }
    [ordered]@{
        name = $p.name; productVersion = $p.productVersion; isIntegratedSecurityOnly = $p.isIntegratedSecurityOnly
        registryLoginMode = $null; isClustered = $p.isClustered
        isExternalAuthenticationOnly = if ($p.isExternalAuthenticationOnly -is [DBNull]) { $null } else { $p.isExternalAuthenticationOnly }
        serviceAccount = (& $run $q.service).service_account; port = $port
        logins = @(& $run $q.logins | ForEach-Object { [ordered]@{ name = $_.name; type = "$($_.type)".Trim(); isDisabled = [bool]$_.isDisabled; hasConnectSql = [bool]$_.hasConnectSql; serverRoles = & $split $_.serverRoles; isSa = [bool]$_.isSa } })
        databases = @(& $run $q.dbs | ForEach-Object { $d = $_.name
            try { $u = @(& $run $q.users $d) } catch { Write-Warning "Skipped database $d on $($si): $($_.Exception.Message)"; return }
            [ordered]@{ name = $d; users = @($u | ForEach-Object { [ordered]@{ name = $_.name; login = "$($_.login)"; roles = & $split $_.roles } }) } })
        connections = @(& $run $q.conns | ForEach-Object { [ordered]@{ principal = $_.principal; authScheme = $_.authScheme; local = [bool]$_.isLocal; sessions = [int]$_.sessions } })
    }
}
New-Item -ItemType Directory -Force -Path (Split-Path $OutputPath -Parent) | Out-Null
[IO.File]::WriteAllText($OutputPath, (ConvertTo-Json -Depth 8 -InputObject ([ordered]@{ asOf = $AsOf; instances = @($instances) })) + "`n")
Write-Host "Wrote $OutputPath ($(@($instances).Count) instances). Run Invoke-SqlAuthAudit.ps1 on it."
