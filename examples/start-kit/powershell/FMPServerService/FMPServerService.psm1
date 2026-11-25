#Requires -Version 5.1
<#
.SYNOPSIS
    Federal Modernization Workbook Start Kit: read-only server-to-service inventory.

.DESCRIPTION
    Which account runs each Windows service on each server: Win32_Service read over CIM, by
    WS-Management first and DCOM when WS-Management doesn't answer. The crosswalk from servers
    to the service accounts they depend on, which the directory can't give: an account's SPNs
    say where Kerberos expects it, not where it actually logs on.

    Read-only: Get-CimInstance with -Property, never Invoke-CimMethod. The CIM sessions it
    opens for the DCOM fallback are client-side connections, closed when the read ends. A
    server that doesn't answer is recorded with the reason, never fatal. Writes only under
    -OutputPath, through the guarded writers in StartKit.Common.ps1.

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

$script:FMPServiceProperties = @('Name', 'DisplayName', 'StartName', 'StartMode', 'State', 'PathName')
$script:FMPBuiltInAccounts = @{
    'localsystem' = 'LocalSystem'; 'nt authority\system' = 'LocalSystem'
    'nt authority\localservice' = 'LocalService'; 'nt authority\local service' = 'LocalService'
    'nt authority\networkservice' = 'NetworkService'; 'nt authority\network service' = 'NetworkService'
}

function ConvertTo-FMPServiceAccount {
    <#
    .SYNOPSIS
        Classifies a service's logon account (Win32_Service.StartName) and returns the account
        name a directory lookup can match.
    .DESCRIPTION
        AccountType is LocalSystem, LocalService, NetworkService, Virtual (NT SERVICE\<name>),
        ManagedServiceAccount (a domain account ending in $: an MSA, gMSA or dMSA), Domain,
        Local (.\name or <server>\name) or None. SamAccountName is filled for Domain and
        ManagedServiceAccount, from DOMAIN\name or name@domain.
    .EXAMPLE
        ConvertTo-FMPServiceAccount -StartName 'CONTOSO\svc-sql' -Server sql01
    #>
    param([AllowEmptyString()][AllowNull()][string]$StartName, [string]$Server)
    $n = "$StartName".Trim()
    $type = 'Domain'; $domain = $null; $sam = $null
    if (-not $n) { $type = 'None' }
    elseif ($script:FMPBuiltInAccounts.ContainsKey($n.ToLowerInvariant())) { $type = $script:FMPBuiltInAccounts[$n.ToLowerInvariant()] }
    elseif ($n -match '^(?i)NT SERVICE\\') { $type = 'Virtual' }
    elseif ($n -match '^(?i)NT AUTHORITY\\') { $type = 'BuiltIn' }
    elseif ($n -match '^\.\\') { $type = 'Local' }
    elseif ($n -match '^(?<d>[^\\]+)\\(?<u>.+)$') {
        $domain = $Matches['d']; $sam = $Matches['u']
        $short = if ($Server) { ($Server -split '\.')[0] } else { '' }
        if ($short -and $domain -ieq $short) { $type = 'Local'; $sam = $null }
    } elseif ($n -match '^(?<u>[^@]+)@(?<d>.+)$') { $domain = $Matches['d']; $sam = $Matches['u'] }
    else { $sam = $n }
    if ($type -eq 'Domain' -and $sam -and $sam.EndsWith('$')) { $type = 'ManagedServiceAccount' }
    [pscustomobject]@{ AccountType = $type; AccountDomain = $domain; SamAccountName = $sam }
}

function Get-FMPServerList {
    # Enabled Windows Server computers in each domain, from the directory (paged, retried).
    param([Parameter(Mandatory)][string[]]$Domain)
    foreach ($d in $Domain) {
        Invoke-FMPWithRetry -Activity "Servers ($d)" -ScriptBlock {
            @(Get-ADComputer -LDAPFilter '(&(operatingSystem=*Server*)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))' -Server $d `
                    -Properties DNSHostName -ResultPageSize (Get-FMPRunContext).PageSize -ErrorAction Stop)
        } | ForEach-Object { if ($_.DNSHostName) { "$($_.DNSHostName)" } else { "$($_.Name)" } }
    }
}

function Read-FMPServerService {
    <#
    .SYNOPSIS
        Reads Win32_Service from one server: WS-Management first, then DCOM. Returns the
        protocol that answered, the services, and the errors of each attempt.
    .EXAMPLE
        Read-FMPServerService -ComputerName sql01.contoso.example -OperationTimeoutSec 60
    #>
    param([Parameter(Mandatory)][string]$ComputerName, [int]$OperationTimeoutSec = 60, [switch]$NoDcom)
    $errors = @()
    try {
        $svc = @(Get-CimInstance -ComputerName $ComputerName -ClassName Win32_Service -Property $script:FMPServiceProperties -OperationTimeoutSec $OperationTimeoutSec -ErrorAction Stop)
        return [pscustomobject]@{ Protocol = 'WSMan'; Services = $svc; Errors = @() }
    } catch { $errors += "WSMan: $($_.Exception.Message)" }
    if (-not $NoDcom) {
        $session = $null
        try {
            $opt = New-CimSessionOption -Protocol Dcom
            $session = New-CimSession -ComputerName $ComputerName -SessionOption $opt -OperationTimeoutSec $OperationTimeoutSec -ErrorAction Stop
            $svc = @(Get-CimInstance -CimSession $session -ClassName Win32_Service -Property $script:FMPServiceProperties -OperationTimeoutSec $OperationTimeoutSec -ErrorAction Stop)
            return [pscustomobject]@{ Protocol = 'DCOM'; Services = $svc; Errors = $errors }
        } catch { $errors += "DCOM: $($_.Exception.Message)" }
        finally { if ($session) { Remove-CimSession -CimSession $session -ErrorAction SilentlyContinue } }
    }
    [pscustomobject]@{ Protocol = $null; Services = @(); Errors = $errors }
}

function Get-FMPServerServiceInventory {
    <#
    .SYNOPSIS
        The server-to-service crosswalk: every Windows service on every server, with the account
        it logs on as, its start mode, state and path, and the servers that couldn't be read.
    .DESCRIPTION
        Servers come from -ComputerName, from -ComputerListPath (a text file, one name per line,
        or a CSV with a ComputerName, DNSHostName or Name column), or from the directory: every
        enabled computer whose operating system names a server, in -Domain or every domain of
        the forest. Each server is read with Win32_Service over CIM, WS-Management first and DCOM
        when WS-Management doesn't answer (-NoDcom to skip it), each try limited by
        -OperationTimeoutSec. A server neither answers is listed in ServerServiceErrors.csv with
        both errors, and the run carries on. Progress and a heartbeat as the other collectors.
    .OUTPUTS
        ServerServices\ServerServices.csv      Server, ServiceName, DisplayName, LogonAccount,
                                               AccountType, SamAccountName, StartMode, State, PathName, Protocol
        ServerServices\ServiceAccountHosts.csv one row per domain or managed service account: its servers and services
        ServerServices\ServerServiceErrors.csv the servers that couldn't be read, and why
        ServerServices\ServerServiceSummary.json counts
    .EXAMPLE
        Get-FMPServerServiceInventory -OutputPath D:\Assessment\run1 -Domain contoso.example

        Every enabled Windows Server in contoso.example.
    .EXAMPLE
        Get-FMPServerServiceInventory -OutputPath D:\Assessment\run1 -ComputerListPath D:\Inputs\servers.txt -NoDcom
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string[]]$ComputerName = @(),
        [string]$ComputerListPath,
        [string[]]$Domain,
        [string]$Forest,
        [ValidateRange(5, 600)][int]$OperationTimeoutSec = 60,
        [switch]$NoDcom,
        [switch]$ExcludeBuiltIn
    )
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $path = Initialize-FMPPath -Path (Join-Path $root 'ServerServices')
    $servers = @($ComputerName)
    $source = 'ComputerName'
    if ($ComputerListPath) {
        $source = 'ComputerListPath'
        $first = @(Get-Content -LiteralPath $ComputerListPath -TotalCount 1)
        if ($first.Count -and $first[0] -match '(?i)^"?(ComputerName|DNSHostName|Name)"?(,|$)') {
            foreach ($r in @(Import-Csv -LiteralPath $ComputerListPath)) {
                $n = @($r.ComputerName, $r.DNSHostName, $r.Name | Where-Object { $_ }) | Select-Object -First 1
                if ($n) { $servers += "$n" }
            }
        } else { $servers += @(Get-Content -LiteralPath $ComputerListPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }) }
    }
    if ($servers.Count -eq 0) {
        Assert-FMPCommand -Name 'Get-ADComputer' -Module 'ActiveDirectory'
        if (-not $Domain) { $Domain = @((Invoke-FMPWithRetry -Activity 'Forest' -ScriptBlock { if ($Forest) { Get-ADForest -Server $Forest -ErrorAction Stop } else { Get-ADForest -ErrorAction Stop } }).Domains) }
        $servers = @(Get-FMPServerList -Domain $Domain)
        $source = 'Directory'
    }
    $seen = @{}
    $servers = @($servers | Where-Object { $k = "$_".ToLowerInvariant(); if ($seen.ContainsKey($k)) { $false } else { $seen[$k] = $true; $true } })
    Write-FMPLog -Message "Server services: $($servers.Count) servers from $source"

    $rows = [System.Collections.Generic.List[object]]::new()
    $failures = [System.Collections.Generic.List[object]]::new()
    $protocols = @{ WSMan = 0; DCOM = 0 }
    $tracker = Initialize-FMPProgress -Activity 'Server services' -Total $servers.Count
    foreach ($s in $servers) {
        $tracker.Partition = $s
        $r = Read-FMPServerService -ComputerName $s -OperationTimeoutSec $OperationTimeoutSec -NoDcom:$NoDcom
        if ($r.Protocol) {
            $protocols[$r.Protocol]++
            foreach ($svc in $r.Services) {
                $acct = ConvertTo-FMPServiceAccount -StartName $svc.StartName -Server $s
                if ($ExcludeBuiltIn -and $acct.AccountType -notin 'Domain', 'ManagedServiceAccount', 'Local') { continue }
                $rows.Add([pscustomobject][ordered]@{
                        Server = $s; ServiceName = $svc.Name; DisplayName = $svc.DisplayName; LogonAccount = $svc.StartName
                        AccountType = $acct.AccountType; AccountDomain = $acct.AccountDomain; SamAccountName = $acct.SamAccountName
                        StartMode = $svc.StartMode; State = $svc.State; PathName = $svc.PathName; Protocol = $r.Protocol
                    })
            }
        } else {
            $failures.Add([pscustomobject][ordered]@{ Server = $s; Reason = 'Unreachable'; Errors = ($r.Errors -join ' | ') })
            Write-FMPLog -Level WARN -Message "Server services: $s not read ($($r.Errors -join ' | '))"
        }
        Step-FMPProgress -Tracker $tracker
    }
    $null = Complete-FMPProgress -Tracker $tracker -Note "$($servers.Count - $failures.Count) read, $($failures.Count) unreachable"

    $byAccount = @{}
    foreach ($row in $rows) {
        if ($row.AccountType -notin 'Domain', 'ManagedServiceAccount' -or -not $row.SamAccountName) { continue }
        $key = "$($row.AccountDomain)\$($row.SamAccountName)".ToLowerInvariant()
        if (-not $byAccount.ContainsKey($key)) { $byAccount[$key] = @{ Domain = $row.AccountDomain; Sam = $row.SamAccountName; Type = $row.AccountType; Servers = @{}; Services = @{} } }
        $byAccount[$key].Servers[$row.Server.ToLowerInvariant()] = $row.Server
        $byAccount[$key].Services["$($row.Server.ToLowerInvariant())/$($row.ServiceName)"] = "$($row.Server)/$($row.ServiceName)"
    }
    $hosts = @($byAccount.Keys | Sort-Object | ForEach-Object {
            $a = $byAccount[$_]
            [pscustomobject][ordered]@{
                AccountDomain = $a.Domain; SamAccountName = $a.Sam; AccountType = $a.Type
                ServerCount = $a.Servers.Count; Servers = (@($a.Servers.Values | Sort-Object) -join '; ')
                ServiceCount = $a.Services.Count; Services = (@($a.Services.Values | Sort-Object) -join '; ')
            }
        })
    Write-FMPCsv -InputObject $rows.ToArray() -Path (Join-Path $path 'ServerServices.csv')
    Write-FMPCsv -InputObject $hosts -Path (Join-Path $path 'ServiceAccountHosts.csv')
    Write-FMPCsv -InputObject $failures.ToArray() -Path (Join-Path $path 'ServerServiceErrors.csv')
    $summary = [ordered]@{
        Schema = 'fmp-start-kit/server-services/1'; ServerSource = $source; Servers = $servers.Count
        ServersRead = $servers.Count - $failures.Count; ServersUnreachable = $failures.Count
        ReadByWSMan = $protocols.WSMan; ReadByDcom = $protocols.DCOM; Services = $rows.Count
        DomainServiceAccounts = $hosts.Count
        ByAccountType = [ordered]@{}
    }
    foreach ($g in ($rows | Group-Object AccountType | Sort-Object Name)) { $summary.ByAccountType[$g.Name] = $g.Count }
    Write-FMPJson -InputObject $summary -Path (Join-Path $path 'ServerServiceSummary.json')
    $summary['ObjectCount'] = $rows.Count
    [pscustomobject]$summary
}

Export-ModuleMember -Function ConvertTo-FMPServiceAccount, Get-FMPServerList, Read-FMPServerService, Get-FMPServerServiceInventory
