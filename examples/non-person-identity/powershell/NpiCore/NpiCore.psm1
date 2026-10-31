#Requires -Version 7.1
<#
    NpiCore: the shared reader for the developer workbook "Building Non-Person Identity".

    One cloud table with no default, a declared call list (config/calls.json) with the
    least-privileged permission, Azure role or Active Directory right for each call, a reader that
    sends only declared GETs and runs only declared Get-AD* cmdlets, a fake Graph, Resource Manager
    and Active Directory served from a fixture, and a run manifest with a SHA-256 per file and the
    tenant ID. Writes live in NpiOwnership's separate writer, never here.

    Illustrative: tested against fixtures and fakes, not against a production tenant or domain.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'

# ----------------------------------------------------------------------------- clouds

# Case-sensitive on purpose: 'GCC' or 'GCCHigh' isn't a name this module knows, so it throws.
$script:Clouds = [hashtable]::new([StringComparer]::Ordinal)
$script:CloudRows = @{
    # Microsoft 365 GCC (Moderate) uses the worldwide endpoints; in this estate Azure is commercial.
    global  = @{ Name = 'global'; Graph = 'https://graph.microsoft.com'; Arm = 'https://management.azure.com'; Login = 'https://login.microsoftonline.com'; GraphEnvironment = 'Global'; AzureEnvironment = 'AzureCloud' }
    gcc     = @{ Name = 'gcc'; Graph = 'https://graph.microsoft.com'; Arm = 'https://management.azure.com'; Login = 'https://login.microsoftonline.com'; GraphEnvironment = 'Global'; AzureEnvironment = 'AzureCloud' }
    gcchigh = @{ Name = 'gcchigh'; Graph = 'https://graph.microsoft.us'; Arm = 'https://management.usgovcloudapi.net'; Login = 'https://login.microsoftonline.us'; GraphEnvironment = 'USGov'; AzureEnvironment = 'AzureUSGovernment' }
    dod     = @{ Name = 'dod'; Graph = 'https://dod-graph.microsoft.us'; Arm = 'https://management.usgovcloudapi.net'; Login = 'https://login.microsoftonline.us'; GraphEnvironment = 'USGovDoD'; AzureEnvironment = 'AzureUSGovernment' }
}
foreach ($k in $script:CloudRows.Keys) { $script:Clouds[$k] = $script:CloudRows[$k] }

function Get-NpiCloud {
    <# Endpoints for global, gcc, gcchigh or dod. Any other name throws: there is no default. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    if (-not $script:Clouds.ContainsKey($Cloud)) { throw "Unknown cloud '$Cloud'. Use global, gcc, gcchigh or dod." }
    [pscustomobject]$script:Clouds[$Cloud]
}

# ----------------------------------------------------------------------------- the call list

function Get-NpiCallList {
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'calls.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiCall {
    <# The declared calls, optionally for one task or one id. #>
    [CmdletBinding()]
    param([string]$Task, [string]$Id)
    $calls = @((Get-NpiCallList).calls)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    if ($Id) { $calls = @($calls | Where-Object { $_.id -eq $Id }) }
    , $calls
}

function Get-NpiTask {
    <# A task's declaration from calls.json: mode, permissions, Azure roles, AD rights. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $t = (Get-NpiCallList).tasks
    if (-not $t.ContainsKey($Task)) { throw "Unknown task '$Task'." }
    $t[$Task]
}

function Get-NpiRequiredPermission {
    <# The union of a task's calls: Graph permissions, Azure roles and Active Directory rights. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $null = Get-NpiTask -Task $Task
    $calls = Get-NpiCall -Task $Task
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AzureRoles       = @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
        AdRights         = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

# ----------------------------------------------------------------------------- the reader

function New-NpiReader {
    <#
    .SYNOPSIS
        A read-only client for one read task in one cloud. -Invoke is { param($Method, $Uri, $Body, $Headers) }
        and returns the parsed JSON body as a hashtable; -AdInvoke is { param($Cmdlet, [hashtable]$Params) }
        and returns Active Directory objects. A write task can't have a reader.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$Task,
        [scriptblock]$Invoke,
        [scriptblock]$AdInvoke
    )
    $decl = Get-NpiTask -Task $Task
    if ($decl.mode -ne 'read') { throw "Task '$Task' writes; use New-NpiWriter in NpiOwnership, never a reader." }
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = $Task
        Calls    = Get-NpiCall -Task $Task
        Invoke   = $Invoke
        AdInvoke = $AdInvoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-NpiUri {
    # Build the URL for a declared call; refuse an undeclared call, a non-GET, or an unbound placeholder.
    param($Reader, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query, [string[]]$AllowedMethods = @('GET'))
    $call = $Reader.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Reader.Task)'; add it to config/calls.json with its permission." }
    if ($call.method -notin $AllowedMethods) { throw "Refusing $($call.method) for '$CallId': not allowed here." }
    if ($call.api -eq 'ad') { throw "'$CallId' is an Active Directory call; use Invoke-NpiAdRead." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [string]$Bind[$k]) }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    if ($call.api -eq 'graph') {
        $uri = "$($Reader.Cloud.Graph)/$($call.version)$path"
        if ($Query) { $uri += "?$Query" }
        $hostName = $Reader.Cloud.Graph
    } else {
        $uri = "$($Reader.Cloud.Arm)$path`?api-version=$($call.apiVersion)"
        if ($Query) { $uri += "&$Query" }
        $hostName = $Reader.Cloud.Arm
    }
    [pscustomobject]@{ Call = $call; Uri = $uri; Host = $hostName }
}

function Assert-NpiHost {
    param([string]$Uri, [string]$ExpectedHost)
    if (-not $Uri.StartsWith("$ExpectedHost/", [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to send the token to $Uri`: not $ExpectedHost"
    }
}

function Invoke-NpiList {
    <#
    .SYNOPSIS
        GET a declared collection and follow every page (@odata.nextLink for Graph, nextLink for
        Resource Manager), only on the cloud's own host. Records each request in the evidence.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][string]$CallId,
        [hashtable]$Bind = @{},
        [string]$Query,
        [hashtable]$Headers
    )
    $r = Resolve-NpiUri -Reader $Reader -CallId $CallId -Bind $Bind -Query $Query
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri
    while ($uri) {
        Assert-NpiHost -Uri $uri -ExpectedHost $r.Host
        $Reader.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Reader.Invoke 'GET' $uri $null $Headers
        if ($null -eq $body) { throw "No response for $uri" }
        if ($body.ContainsKey('value')) { foreach ($v in @($body['value'])) { $items.Add($v) } }
        else { $items.Add($body) }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } elseif ($body.ContainsKey('nextLink')) { $body['nextLink'] } else { $null }
    }
    $items.ToArray()
}

function Invoke-NpiGetOne {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $r = Resolve-NpiUri -Reader $Reader -CallId $CallId -Bind $Bind -Query $Query
    Assert-NpiHost -Uri $r.Uri -ExpectedHost $r.Host
    $Reader.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $r.Uri; At = [DateTime]::UtcNow.ToString('o') })
    & $Reader.Invoke 'GET' $r.Uri $null $null
}

function Invoke-NpiAdRead {
    <#
    .SYNOPSIS
        Run a declared Active Directory read. The cmdlet comes from the call list, never from the
        caller, and must be a Get-AD* cmdlet; the parameters are recorded in the evidence.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][string]$CallId, [hashtable]$Params = @{})
    $call = $Reader.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Reader.Task)'; add it to config/calls.json with its right." }
    if ($call.api -ne 'ad' -or $call.method -ne 'READ' -or $call.cmdlet -notmatch '^Get-AD[A-Za-z]+$') { throw "Refusing '$CallId': only declared Get-AD* reads run here." }
    if (-not $Reader.AdInvoke) { throw 'No Active Directory invoker: pass -AdInvoke, or skip the AD reads.' }
    $shown = ($Params.Keys | Sort-Object | ForEach-Object { "-$_ $(@($Params[$_]) -join ',')" }) -join ' '
    $Reader.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'READ'; Target = "$($call.cmdlet) $shown".Trim(); At = [DateTime]::UtcNow.ToString('o') })
    @(& $Reader.AdInvoke $call.cmdlet $Params)
}

# ----------------------------------------------------------------------------- live invokers

function New-NpiLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: Graph through Invoke-MgGraphRequest, Resource Manager through
        Invoke-AzRestMethod. It refuses to start if either session is in another cloud, or signed in
        to a tenant other than -TenantId. -AllowWrite is for NpiOwnership's writer only.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [switch]$SkipAzure, [switch]$AllowWrite)
    $c = Get-NpiCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    if ($mg.TenantId -ne $TenantId) { throw "Graph session is signed in to tenant '$($mg.TenantId)', not '$TenantId'." }
    if (-not $SkipAzure) {
        $az = Get-AzContext
        if (-not $az) { throw 'Not signed in to Azure.' }
        if ($az.Environment.Name -ne $c.AzureEnvironment) { throw "Azure session is in '$($az.Environment.Name)', not '$($c.AzureEnvironment)'." }
        if ($az.Tenant.Id -ne $TenantId) { throw "Azure session is signed in to tenant '$($az.Tenant.Id)', not '$TenantId'." }
    }
    $graph = $c.Graph
    $write = [bool]$AllowWrite
    {
        param($Method, $Uri, $Body, $Headers)
        if ($Method -ne 'GET' -and -not $write) { throw "Refusing $Method" }
        if ($Uri.StartsWith("$graph/")) {
            $p = @{ Method = $Method; Uri = $Uri; OutputType = 'Hashtable' }
            if ($Headers) { $p.Headers = $Headers }
            if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 10 -Compress); $p.ContentType = 'application/json' }
            $resp = Invoke-MgGraphRequest @p
            if ($null -eq $resp) { @{} } else { $resp }
        } else {
            if ($Method -ne 'GET') { throw "Refusing $Method to Resource Manager" }
            $resp = Invoke-AzRestMethod -Method GET -Uri $Uri
            if ($resp.StatusCode -ge 400) { throw "Resource Manager returned $($resp.StatusCode) for $Uri" }
            $resp.Content | ConvertFrom-Json -AsHashtable -Depth 50
        }
    }.GetNewClosure()
}

function New-NpiLiveAdInvoker {
    <#
    .SYNOPSIS
        The live Active Directory invoker. It runs only the Get-AD* cmdlets the call list declares
        (and Disable-ADAccount when -AllowWrite), against -Server, with the ActiveDirectory module.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Server, [switch]$AllowWrite)
    Import-Module ActiveDirectory -ErrorAction Stop
    $allowed = @('Get-ADUser', 'Get-ADServiceAccount')
    if ($AllowWrite) { $allowed += 'Disable-ADAccount' }
    $srv = $Server
    {
        param($Cmdlet, [hashtable]$Params)
        if ($Cmdlet -notin $allowed) { throw "Refusing $Cmdlet" }
        $p = @{} + $Params; $p.Server = $srv
        & $Cmdlet @p
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the fakes

function New-NpiFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Microsoft Graph and Resource Manager served from a fixture estate file, for labs and
        tests. GET only unless -AllowWrite, which accepts only the two writes Chapter 02 declares.
        Collections come in pages of -PageSize with a next link on the same host. Every call is
        recorded in .Calls, and writes change .Estate so a test can read the result back.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [int]$PageSize = 2, [string]$Cloud = 'gcc', [switch]$AllowWrite)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-NpiCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph; Arm = $c.Arm; AllowWrite = [bool]$AllowWrite; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-NpiFake -State $s -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state
}

function Get-NpiFakeOwners {
    param($Estate, [string]$Kind, [string]$Id)
    $map = $Estate.graph[$Kind]
    if ($map.ContainsKey($Id)) { @($map[$Id]) } else { @() }
}

function Invoke-NpiFake {
    param($State, [string]$Method, [string]$Uri, $Body, $Headers)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body; Headers = $Headers })
    $g = $State.Estate.graph
    $u = [Uri]$Uri
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    $base = "$($u.Scheme)://$($u.Host)"
    $page = {
        param([object[]]$All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $slice = @($All | Select-Object -Skip $skip -First $State.PageSize)
        $resp = @{ value = $slice }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $link = "$base$($u.AbsolutePath)?" + ($(if ($rest) { "$rest&" } else { '' })) + "`$skiptoken=$($skip + $State.PageSize)"
            if ($base -eq $State.Arm) { $resp['nextLink'] = $link } else { $resp['@odata.nextLink'] = $link }
        }
        if ($q.ContainsKey('$count') -and $q['$count'] -eq 'true') { $resp['@odata.count'] = @($All).Count }
        $resp
    }

    if ($base -eq $State.Graph) {
        if ($Method -eq 'GET') {
            switch -Regex ($path) {
                '^/v1\.0/applications$' { return & $page @($g.applications) }
                '^/v1\.0/applications/([^/]+)/owners$' { return & $page @(Get-NpiFakeOwners $State.Estate 'applicationOwners' $Matches[1]) }
                '^/v1\.0/applications/([^/]+)/federatedIdentityCredentials$' {
                    $id = $Matches[1]; return & $page @($(if ($g.federatedIdentityCredentials.ContainsKey($id)) { $g.federatedIdentityCredentials[$id] } else { @() }))
                }
                "^/v1\.0/servicePrincipals\(appId='([^']+)'\)$" {
                    $appId = $Matches[1]; $sp = @($g.servicePrincipals | Where-Object { $_.appId -eq $appId })
                    if ($sp.Count -ne 1) { throw "404 servicePrincipal appId $appId" }
                    return $sp[0]
                }
                '^/v1\.0/servicePrincipals$' {
                    $rows = @($g.servicePrincipals)
                    if ($q.ContainsKey('$filter')) {
                        $f = $q['$filter']
                        if ($f -notmatch '^owners/\$count eq \d+( or owners/\$count eq \d+)*$') { throw "The fake supports only owners/`$count filters, not: $f" }
                        # Learn: $count on directory objects is an advanced query, which needs ConsistencyLevel: eventual and $count=true.
                        if (-not $Headers -or $Headers['ConsistencyLevel'] -ne 'eventual' -or $q['$count'] -ne 'true') { throw '400 Bad Request: this query needs the ConsistencyLevel: eventual header and $count=true' }
                        $wanted = @([regex]::Matches($f, 'eq (\d+)') | ForEach-Object { [int]$_.Groups[1].Value })
                        $rows = @($rows | Where-Object { @(Get-NpiFakeOwners $State.Estate 'servicePrincipalOwners' $_.id).Count -in $wanted })
                    }
                    return & $page $rows
                }
                '^/v1\.0/servicePrincipals/([^/]+)/owners$' { return & $page @(Get-NpiFakeOwners $State.Estate 'servicePrincipalOwners' $Matches[1]) }
                '^/v1\.0/servicePrincipals/([^/]+)/appRoleAssignedTo$' {
                    $id = $Matches[1]; return & $page @($g.appRoleAssignedTo | Where-Object { $_.resourceId -eq $id })
                }
                '^/v1\.0/oauth2PermissionGrants$' { return & $page @($g.oauth2PermissionGrants) }
                '^/v1\.0/users/([^/]+)$' {
                    $key = $Matches[1]
                    $user = @($g.users | Where-Object { $_.id -eq $key -or $_.userPrincipalName -eq $key })
                    if ($user.Count -ne 1) { throw "404 user $key" }
                    return $user[0]
                }
            }
            throw "The fake has no Graph route for GET $path"
        }
        if (-not $State.AllowWrite) { throw "The fake refuses $Method" }
        switch -Regex ($path) {
            '^/v1\.0/servicePrincipals/([^/]+)$' {
                if ($Method -ne 'PATCH') { break }
                $id = $Matches[1]; $sp = @($g.servicePrincipals | Where-Object { $_.id -eq $id })
                if ($sp.Count -ne 1) { throw "404 servicePrincipal $id" }
                foreach ($k in $Body.Keys) { $sp[0][$k] = $Body[$k] }
                return @{}
            }
            '^/v1\.0/applications/([^/]+)/owners/\$ref$' {
                if ($Method -ne 'POST') { break }
                $id = $Matches[1]
                if ($Body['@odata.id'] -notmatch '/directoryObjects/([0-9a-f-]{36})$') { throw '400 Bad Request: @odata.id must reference a directory object' }
                $oid = $Matches[1]
                $u2 = @($g.users | Where-Object { $_.id -eq $oid }); $sp2 = @($g.servicePrincipals | Where-Object { $_.id -eq $oid })
                $type = if ($u2.Count) { '#microsoft.graph.user' } elseif ($sp2.Count) { '#microsoft.graph.servicePrincipal' } else { throw "404 directoryObject $oid" }
                if (-not $g.applicationOwners.ContainsKey($id)) { $g.applicationOwners[$id] = @() }
                if (@($g.applicationOwners[$id] | Where-Object { $_.id -eq $oid }).Count) { throw '400 Bad Request: one or more added object references already exist' }
                $g.applicationOwners[$id] = @($g.applicationOwners[$id]) + @(@{ '@odata.type' = $type; id = $oid })
                return @{}
            }
        }
        throw "The fake has no Graph route for $Method $path"
    }
    if ($base -eq $State.Arm) {
        if ($Method -ne 'GET') { throw "The fake refuses $Method to Resource Manager" }
        if ($path -match '^(/subscriptions/.+/providers/Microsoft\.ManagedIdentity/userAssignedIdentities/[^/]+)/federatedIdentityCredentials$') {
            if ($q['api-version'] -ne '2024-11-30') { throw "Unexpected api-version $($q['api-version'])" }
            $rid = $Matches[1]
            $key = @($State.Estate.azure.Keys | Where-Object { $_ -ieq $rid })
            if (-not $key) { throw "404 $rid" }
            return & $page @($State.Estate.azure[$key[0]].federatedIdentityCredentials)
        }
        throw "The fake has no Resource Manager route for $path"
    }
    throw "The fake refuses host $base"
}

# Bits of userAccountControl the fake turns into the properties Get-ADUser computes.
$script:Uac = @{ Disabled = 0x2; DontExpirePassword = 0x10000; TrustedForDelegation = 0x80000; TrustedToAuthForDelegation = 0x1000000 }
$script:AdAttributeMap = @{
    serviceprincipalname = 'ServicePrincipalName'; samaccountname = 'SamAccountName'; description = 'Description'
    'msds-allowedtodelegateto' = 'AllowedToDelegateTo'; useraccountcontrol = 'UserAccountControl'
    objectcategory = 'ObjectCategory'; objectclass = 'ObjectClass'
}

function Test-NpiLdapFilter {
    <#
    The fake's LDAP evaluator: (&...), (|...), (attr=*), (attr=value) with * wildcards, and the
    bitwise-AND matching rule 1.2.840.113556.1.4.803. Anything else throws, so a query the fake
    can't evaluate fails a test instead of returning a wrong answer.
    #>
    param([Parameter(Mandatory)][string]$Filter, [Parameter(Mandatory)]$Object)
    $f = $Filter.Trim()
    if (-not ($f.StartsWith('(') -and $f.EndsWith(')'))) { throw "Unexpected LDAP filter: $f" }
    $inner = $f.Substring(1, $f.Length - 2)
    if ($inner[0] -in '&', '|') {
        $parts = [Collections.Generic.List[string]]::new(); $depth = 0; $start = -1
        for ($i = 1; $i -lt $inner.Length; $i++) {
            if ($inner[$i] -eq '(') { if ($depth -eq 0) { $start = $i }; $depth++ }
            elseif ($inner[$i] -eq ')') { $depth--; if ($depth -eq 0) { $parts.Add($inner.Substring($start, $i - $start + 1)) } }
        }
        $results = @($parts | ForEach-Object { Test-NpiLdapFilter -Filter $_ -Object $Object })
        if ($inner[0] -eq '&') { return -not ($results -contains $false) } else { return $results -contains $true }
    }
    if ($inner -match '^([A-Za-z-]+):1\.2\.840\.113556\.1\.4\.803:=(\d+)$') {
        $bit = [int64]$Matches[2]
        return (([int64]$Object.UserAccountControl) -band $bit) -eq $bit
    }
    if ($inner -notmatch '^([A-Za-z-]+)=(.*)$') { throw "Unexpected LDAP term: $inner" }
    $attr = $Matches[1]; $val = $Matches[2]
    $prop = $script:AdAttributeMap[$attr.ToLowerInvariant()]
    if (-not $prop) { throw "The fake doesn't know the attribute $attr" }
    $values = @($(if ($Object.ContainsKey($prop)) { $Object[$prop] } else { $null }) | Where-Object { $null -ne $_ -and "$_" -ne '' })
    if ($val -eq '*') { return $values.Count -gt 0 }
    $like = $val
    foreach ($v in $values) { if ("$v" -like $like) { return $true } }
    $false
}

function ConvertTo-NpiFakeAdObject {
    # Shape a fixture object the way the AD cmdlets return it, with the computed properties.
    param([hashtable]$Source)
    $O = @{ PasswordLastSet = $null; LastLogonDate = $null; ServicePrincipalName = @(); MemberOf = @(); Description = $null; UserPrincipalName = $null; AllowedToDelegateTo = @() }
    foreach ($k in $Source.Keys) { $O[$k] = $Source[$k] }
    $uac = [int64]$O.UserAccountControl
    $out = [ordered]@{
        SamAccountName             = $O.SamAccountName
        ObjectGUID                 = [guid]$O.ObjectGUID
        ObjectClass                = $O.ObjectClass
        DistinguishedName          = $O.DistinguishedName
        Enabled                    = -not ($uac -band $script:Uac.Disabled)
        PasswordNeverExpires       = [bool]($uac -band $script:Uac.DontExpirePassword)
        TrustedForDelegation       = [bool]($uac -band $script:Uac.TrustedForDelegation)
        TrustedToAuthForDelegation = [bool]($uac -band $script:Uac.TrustedToAuthForDelegation)
        userAccountControl         = $uac
        PasswordLastSet            = if ($O.PasswordLastSet) { [datetime]::Parse($O.PasswordLastSet, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { $null }
        LastLogonDate              = if ($O.LastLogonDate) { [datetime]::Parse($O.LastLogonDate, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { $null }
        ServicePrincipalName       = @($O.ServicePrincipalName)
        MemberOf                   = @($O.MemberOf)
        Description                = $O.Description
        UserPrincipalName          = $O.UserPrincipalName
        'msDS-AllowedToDelegateTo' = @($O.AllowedToDelegateTo)
    }
    if ($O.ContainsKey('PrincipalsAllowedToRetrieveManagedPassword')) { $out.PrincipalsAllowedToRetrieveManagedPassword = @($O.PrincipalsAllowedToRetrieveManagedPassword) }
    if ($O.ContainsKey('HostComputers')) { $out.HostComputers = @($O.HostComputers) }
    [pscustomobject]$out
}

function New-NpiFixtureAdInvoker {
    <#
    .SYNOPSIS
        A fake Active Directory served from the fixture's "ad" section: Get-ADUser with -LDAPFilter
        or -Identity, Get-ADServiceAccount with -Filter * or -Identity, and Disable-ADAccount only
        with -AllowWrite. Every call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [switch]$AllowWrite)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $state = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); AllowWrite = [bool]$AllowWrite; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Cmdlet, [hashtable]$Params) Invoke-NpiFakeAd -State $s -Cmdlet $Cmdlet -Params $Params }.GetNewClosure()
    $state
}

function Invoke-NpiFakeAd {
    param($State, [string]$Cmdlet, [hashtable]$Params)
    $State.Calls.Add([pscustomobject]@{ Cmdlet = $Cmdlet; Params = $Params })
    $ad = $State.Estate.ad
    $find = {
        param([object[]]$Pool, [string]$Identity)
        $hit = @($Pool | Where-Object { $_.SamAccountName -eq $Identity -or $_.ObjectGUID -eq $Identity -or $_.DistinguishedName -eq $Identity })
        if ($hit.Count -ne 1) { throw "Cannot find an object with identity: '$Identity'" }
        $hit[0]
    }
    switch ($Cmdlet) {
        'Get-ADUser' {
            $pool = @($ad.objects | Where-Object { $_.ObjectClass -eq 'user' })
            if ($Params.ContainsKey('Identity')) { return ConvertTo-NpiFakeAdObject (& $find $pool $Params.Identity) }
            if (-not $Params.ContainsKey('LDAPFilter')) { throw 'The fake Get-ADUser supports -LDAPFilter or -Identity only' }
            return @($pool | Where-Object { Test-NpiLdapFilter -Filter $Params.LDAPFilter -Object $_ } | ForEach-Object { ConvertTo-NpiFakeAdObject $_ })
        }
        'Get-ADServiceAccount' {
            $pool = @($ad.serviceAccounts)
            if ($Params.ContainsKey('Identity')) { return ConvertTo-NpiFakeAdObject (& $find $pool $Params.Identity) }
            if ($Params.Filter -ne '*') { throw 'The fake Get-ADServiceAccount supports -Filter * or -Identity only' }
            return @($pool | ForEach-Object { ConvertTo-NpiFakeAdObject $_ })
        }
        'Disable-ADAccount' {
            if (-not $State.AllowWrite) { throw 'The fake refuses Disable-ADAccount' }
            $o = & $find (@($ad.objects) + @($ad.serviceAccounts)) $Params.Identity
            $o.UserAccountControl = [int64]$o.UserAccountControl -bor $script:Uac.Disabled
            return
        }
    }
    throw "The fake refuses $Cmdlet"
}

# ----------------------------------------------------------------------------- findings and the run

function New-NpiFinding {
    <# A finding with a stable ID, Rule:ObjectKey, so the same gap keeps its ID from run to run. #>
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$ObjectKey, [string]$Object, [string]$Issue)
    [pscustomobject]@{ Id = "$Rule`:$ObjectKey"; Rule = $Rule; Severity = $Severity; ObjectKey = $ObjectKey; Object = $Object; Issue = $Issue }
}

function Write-NpiJson {
    param([string]$Path, $Value)
    # LF on every platform: ConvertTo-Json uses the platform newline, and the manifest hashes these files.
    [IO.File]::WriteAllText($Path, (ConvertTo-Json -InputObject $Value -Depth 20).Replace("`r`n", "`n") + "`n", [Text.UTF8Encoding]::new($false))
}

function Get-NpiFileHash {
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Export-NpiRun {
    <#
    .SYNOPSIS
        Write a run's outputs and a manifest: the task, mode, cloud, tenant ID, domain, as-of date,
        the permissions and rights the task holds, every request or AD read, and the SHA-256 of each
        file, so the ISSO can check what the evidence is and how it was read.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$Task,
        [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [string]$Domain,
        [string]$AsOf,
        [object[]]$Evidence = @(),
        [string]$Mode = 'Fixture',
        [hashtable]$Extra = @{}
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        $v = $Files[$name]
        if ($name.EndsWith('.csv')) {
            $csv = (@($v) | ConvertTo-Csv -NoTypeInformation) -join "`n"
            [IO.File]::WriteAllText($p, $csv + "`n", [Text.UTF8Encoding]::new($false))
        } else { Write-NpiJson -Path $p -Value $v }
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $perm = Get-NpiRequiredPermission -Task $Task
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; domain = $Domain; asOf = $AsOf
        generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles; adRights = $perm.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $manifest[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-NpiCloud, Get-NpiCallList, Get-NpiCall, Get-NpiTask, Get-NpiRequiredPermission, New-NpiReader, Resolve-NpiUri,
    Assert-NpiHost, Invoke-NpiList, Invoke-NpiGetOne, Invoke-NpiAdRead, New-NpiLiveInvoker, New-NpiLiveAdInvoker, New-NpiFixtureInvoker,
    Invoke-NpiFake, Test-NpiLdapFilter, New-NpiFixtureAdInvoker, Invoke-NpiFakeAd, New-NpiFinding, Write-NpiJson, Get-NpiFileHash, Export-NpiRun
