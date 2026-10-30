#Requires -Version 7.1
<#
    PrivilegedAccess: read-only code for the developer workbook "Building Privileged Access".

    Chapter 01: the privileged inventory (Entra roles, PIM eligibility and Azure RBAC) as code.
    Chapter 02: the emergency access accounts and their monitoring as code.

    Every call is a GET declared in config/calls.json with its least-privileged permission, sent
    only to the cloud's own Graph or Resource Manager host. Nothing here writes to a tenant. The
    alert rule in Chapter 02 is produced as an ARM template for a reviewed deployment; this module
    never deploys it. Illustrative: tested against fixtures and a fake, not a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:GlobalAdminTemplateId = '62e90394-69f5-4237-9190-012177145e10'

# ----------------------------------------------------------------------------- clouds and calls

# Case-sensitive on purpose: 'GCCHigh' isn't a name this module knows, so it throws.
$script:Clouds = [hashtable]::new([StringComparer]::Ordinal)
$script:CloudRows = @{
    # GCC (Moderate) uses the worldwide endpoints and, in this program's estate, commercial Azure.
    global  = @{ Name = 'global'; Graph = 'https://graph.microsoft.com'; Arm = 'https://management.azure.com'; GraphEnvironment = 'Global'; AzureEnvironment = 'AzureCloud' }
    gcc     = @{ Name = 'gcc'; Graph = 'https://graph.microsoft.com'; Arm = 'https://management.azure.com'; GraphEnvironment = 'Global'; AzureEnvironment = 'AzureCloud' }
    gcchigh = @{ Name = 'gcchigh'; Graph = 'https://graph.microsoft.us'; Arm = 'https://management.usgovcloudapi.net'; GraphEnvironment = 'USGov'; AzureEnvironment = 'AzureUSGovernment' }
    dod     = @{ Name = 'dod'; Graph = 'https://dod-graph.microsoft.us'; Arm = 'https://management.usgovcloudapi.net'; GraphEnvironment = 'USGovDoD'; AzureEnvironment = 'AzureUSGovernment' }
}
foreach ($k in $script:CloudRows.Keys) { $script:Clouds[$k] = $script:CloudRows[$k] }

function Get-PaCloud {
    <# Endpoints for global, gcc, gcchigh or dod. Any other name throws: there is no default. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    if (-not $script:Clouds.ContainsKey($Cloud)) {
        throw "Unknown cloud '$Cloud'. Use global, gcc, gcchigh or dod."
    }
    [pscustomobject]$script:Clouds[$Cloud]
}

function Get-PaCall {
    <# The declared calls, optionally for one task or one id. #>
    [CmdletBinding()]
    param([string]$Task, [string]$Id)
    $all = (Get-Content -LiteralPath (Join-Path $script:ConfigRoot 'calls.json') -Raw | ConvertFrom-Json -AsHashtable).calls
    $calls = @($all)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    if ($Id) { $calls = @($calls | Where-Object { $_.id -eq $Id }) }
    , $calls
}

function Get-PaRequiredPermission {
    <# The union of a task's Graph permissions, and the Azure role its ARM calls need. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('inventory', 'emergency-access')][string]$Task)
    $calls = Get-PaCall -Task $Task
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AzureRoles       = @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
    }
}

function Get-PaTierMap {
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'tiers.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

# ----------------------------------------------------------------------------- the reader

function New-PaReader {
    <#
    .SYNOPSIS
        A read-only client for one task in one cloud. -Invoke is a script block
        { param($Method, $Uri) } that returns the parsed JSON body as a hashtable: the fake from
        New-PaFixtureInvoker, or New-PaLiveInvoker for a real run.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][ValidateSet('inventory', 'emergency-access')][string]$Task,
        [Parameter(Mandatory)][scriptblock]$Invoke
    )
    $c = Get-PaCloud -Cloud $Cloud
    [pscustomobject]@{
        Cloud    = $c
        Task     = $Task
        Calls    = Get-PaCall -Task $Task
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-PaUri {
    # Build the URL for a declared call, and refuse any call the task doesn't declare.
    param($Reader, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $call = $Reader.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Reader.Task)'; add it to config/calls.json with its permission." }
    if ($call.method -ne 'GET') { throw "Refusing $($call.method): this module only reads." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [string]$Bind[$k]) }
    if ($path -match '\{[a-z]+\}') { throw "Unbound placeholder in $path" }
    if ($call.api -eq 'graph') {
        $uri = "$($Reader.Cloud.Graph)/$($call.version)$path"
        if ($Query) { $uri += "?$Query" }
    } else {
        $uri = "$($Reader.Cloud.Arm)$path`?api-version=$($call.apiVersion)"
        if ($Query) { $uri += "&$Query" }
    }
    [pscustomobject]@{ Call = $call; Uri = $uri; Host = if ($call.api -eq 'graph') { $Reader.Cloud.Graph } else { $Reader.Cloud.Arm } }
}

function Assert-PaHost {
    param([string]$Uri, [string]$ExpectedHost)
    if (-not $Uri.StartsWith("$ExpectedHost/", [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to send the token to $Uri`: not $ExpectedHost"
    }
}

function Invoke-PaList {
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
        [string]$Query
    )
    $r = Resolve-PaUri -Reader $Reader -CallId $CallId -Bind $Bind -Query $Query
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri
    while ($uri) {
        Assert-PaHost -Uri $uri -ExpectedHost $r.Host
        $Reader.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Uri = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Reader.Invoke 'GET' $uri
        if ($null -eq $body) { throw "No response for $uri" }
        if ($body.ContainsKey('value')) { foreach ($v in @($body['value'])) { $items.Add($v) } }
        else { $items.Add($body) }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } elseif ($body.ContainsKey('nextLink')) { $body['nextLink'] } else { $null }
    }
    $items.ToArray()
}

function Invoke-PaGetOne {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $r = Resolve-PaUri -Reader $Reader -CallId $CallId -Bind $Bind -Query $Query
    Assert-PaHost -Uri $r.Uri -ExpectedHost $r.Host
    $Reader.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Uri = $r.Uri; At = [DateTime]::UtcNow.ToString('o') })
    & $Reader.Invoke 'GET' $r.Uri
}

function New-PaLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: Graph through Invoke-MgGraphRequest, Resource Manager through
        Invoke-AzRestMethod. It refuses to run if either session is signed in to another cloud.
        Sign in first: Connect-MgGraph -Environment <GraphEnvironment> with the task's scopes,
        and Connect-AzAccount -Environment <AzureEnvironment> for the inventory's Azure reads.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [switch]$SkipAzure)
    $c = Get-PaCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    if (-not $SkipAzure) {
        $az = Get-AzContext
        if (-not $az) { throw 'Not signed in to Azure.' }
        if ($az.Environment.Name -ne $c.AzureEnvironment) { throw "Azure session is in '$($az.Environment.Name)', not '$($c.AzureEnvironment)'." }
    }
    $graph = $c.Graph
    {
        param($Method, $Uri)
        if ($Method -ne 'GET') { throw "Refusing $Method" }
        if ($Uri.StartsWith("$graph/")) {
            Invoke-MgGraphRequest -Method GET -Uri $Uri -OutputType Hashtable -Headers @{ 'x-ms-throttle-priority' = 'Low' }
        } else {
            $resp = Invoke-AzRestMethod -Method GET -Uri $Uri
            if ($resp.StatusCode -ge 400) { throw "Resource Manager returned $($resp.StatusCode) for $Uri" }
            $resp.Content | ConvertFrom-Json -AsHashtable -Depth 50
        }
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the fake

function New-PaFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Graph and Resource Manager served from a fixture tenant file, for labs and tests.
        GET only; any other method throws. Collections are served in pages of -PageSize with a
        next link on the same host, so paging is exercised. Every call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [int]$PageSize = 2, [string]$Cloud = 'gcc')
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-PaCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Tenant = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph; Arm = $c.Arm; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri) Invoke-PaFake -State $s -Method $Method -Uri $Uri }.GetNewClosure()
    $state
}

function Invoke-PaFake {
    param($State, [string]$Method, [string]$Uri)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri })
    if ($Method -ne 'GET') { throw "The fake refuses $Method" }
    $t = $State.Tenant
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
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $link = "$base$($u.AbsolutePath)?" + ($(if ($rest) { "$rest&" } else { '' })) + "`$skiptoken=$($skip + $State.PageSize)"
            if ($base -eq $State.Arm) { $resp['nextLink'] = $link } else { $resp['@odata.nextLink'] = $link }
        }
        $resp
    }
    if ($base -eq $State.Graph) {
        switch -Regex ($path) {
            '^/v1\.0/roleManagement/directory/roleDefinitions$' { return & $page @($t.roleDefinitions) }
            '^/v1\.0/roleManagement/directory/roleAssignmentScheduleInstances$' {
                $rows = @($t.roleAssignmentScheduleInstances)
                if ($q.ContainsKey('$filter') -and $q['$filter'] -match "principalId eq '([^']+)'") { $id = $Matches[1]; $rows = @($rows | Where-Object { $_.principalId -eq $id }) }
                return & $page $rows
            }
            '^/v1\.0/roleManagement/directory/roleEligibilitySchedules$' { return & $page @($t.roleEligibilitySchedules) }
            '^/v1\.0/groups/([^/]+)/members$' {
                $gid = $Matches[1]; if (-not $t.groupMembers.ContainsKey($gid)) { throw "404 group $gid" }
                return & $page @($t.groupMembers[$gid])
            }
            '^/v1\.0/users/([^/]+)/authentication/methods$' {
                $id = $Matches[1]; return & $page @($(if ($t.authMethods.ContainsKey($id)) { $t.authMethods[$id] } else { @() }))
            }
            '^/v1\.0/users/([^/]+)$' {
                $id = $Matches[1]; if (-not $t.users.ContainsKey($id)) { throw "404 user $id" }
                return $t.users[$id]
            }
            '^/v1\.0/identity/conditionalAccess/policies$' { return & $page @($t.conditionalAccessPolicies) }
        }
        throw "The fake has no Graph route for $path"
    }
    if ($base -eq $State.Arm) {
        if ($q['api-version'] -ne '2020-10-01') { throw "Unexpected api-version $($q['api-version'])" }
        if ($path -match '^(.*)/providers/Microsoft\.Authorization/(roleAssignmentSchedules|roleEligibilitySchedules)$') {
            $scope = $Matches[1]; $kind = $Matches[2]
            if (-not $t.azure.ContainsKey($scope)) { throw "404 scope $scope" }
            return & $page @($t.azure[$scope][$kind])
        }
        throw "The fake has no Resource Manager route for $path"
    }
    throw "The fake refuses host $base"
}

# ----------------------------------------------------------------------------- Chapter 01: inventory

function Get-PaPrincipalType {
    param($Principal)
    if ($null -eq $Principal) { return 'unknown' }
    $type = if ($Principal -is [hashtable] -and $Principal.ContainsKey('@odata.type')) { $Principal['@odata.type'] } else { $null }
    switch ($type) {
        '#microsoft.graph.user' { 'user' }
        '#microsoft.graph.group' { 'group' }
        '#microsoft.graph.servicePrincipal' { 'servicePrincipal' }
        default { 'unknown' }
    }
}

function Get-PaValue { param($Hash, [string]$Key) if ($Hash -is [hashtable] -and $Hash.ContainsKey($Key)) { $Hash[$Key] } else { $null } }

function Get-PaAzureTier {
    <# Design guidance: Book 04, Chapter 04's placement of an Azure assignment by role and scope. #>
    param([string]$RoleId, [string]$Scope, $TierMap)
    $role = $TierMap.azure[$RoleId]
    $cpSubs = @($TierMap.azureControlPlaneSubscriptions.ids)
    if (-not $role) { return 'T2' }  # a job-function or custom role
    if (-not $role.privilegedAdministrator) { return 'RO' }
    $sub = if ($Scope -match '^/subscriptions/([^/]+)') { $Matches[1] } else { $null }
    if ($Scope -eq '/' -or $Scope -match '^/providers/Microsoft\.Management/managementGroups/') { if ($role.canAssignRoles) { return 'T0' } else { return 'T1' } }
    if ($sub -and $cpSubs -contains $sub) { return 'T0' }
    'T1'
}

function Get-PaPrivilegedInventory {
    <#
    .SYNOPSIS
        One row per privileged assignment: Entra roles (active and eligible, through Graph) and
        Azure roles (active and eligible, through Resource Manager), with groups expanded to their
        members and every row given a tier from config/tiers.json.
    .OUTPUTS
        @{ Rows; Unreadable; Evidence; Cloud }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [string[]]$AzureScope = @(),
        $TierMap = (Get-PaTierMap)
    )
    $defs = @(Invoke-PaList -Reader $Reader -CallId 'entra-role-definitions' -Query '$select=id,templateId,displayName,isBuiltIn')
    $defName = @{}
    $defTemplate = @{}
    foreach ($d in $defs) { $defName[$d.id] = $d.displayName; $defTemplate[$d.id] = if ($d.templateId) { $d.templateId } else { $d.id } }

    $active = @(Invoke-PaList -Reader $Reader -CallId 'entra-active-assignments' -Query '$expand=principal')
    $eligible = @(Invoke-PaList -Reader $Reader -CallId 'entra-eligibility-schedules' -Query '$expand=principal')

    $rows = [Collections.Generic.List[object]]::new()
    $unreadable = [Collections.Generic.List[object]]::new()
    $groupCache = @{}

    $addEntra = {
        param($a, [string]$State, $End)
        $tid = $defTemplate[$a.roleDefinitionId]; if (-not $tid) { $tid = $a.roleDefinitionId }
        $tier = if ($TierMap.entra.ContainsKey($tid)) { $TierMap.entra[$tid].tier } else { 'Unclassified' }
        $p = Get-PaValue $a 'principal'
        $ptype = Get-PaPrincipalType $p
        $pname = Get-PaValue $p 'displayName'
        $upn = Get-PaValue $p 'userPrincipalName'
        $roleName = if ($defName.ContainsKey($a.roleDefinitionId)) { $defName[$a.roleDefinitionId] } elseif ($TierMap.entra.ContainsKey($tid)) { $TierMap.entra[$tid].name } else { $a.roleDefinitionId }
        $row = [pscustomobject]@{
            Plane = 'Entra'; RoleId = $tid; RoleName = $roleName; Tier = $tier
            Scope = (Get-PaValue $a 'directoryScopeId'); State = $State; EndDateTime = $End
            PrincipalId = $a.principalId; PrincipalType = $ptype; PrincipalName = $pname; UserPrincipalName = $upn
            Via = 'Direct'; ViaGroupId = $null
        }
        $rows.Add($row)
        if ($ptype -eq 'group') {
            if (-not $groupCache.ContainsKey($a.principalId)) {
                $groupCache[$a.principalId] = @(Invoke-PaList -Reader $Reader -CallId 'group-members' -Bind @{ id = $a.principalId } -Query '$select=id,displayName,userPrincipalName')
            }
            foreach ($m in $groupCache[$a.principalId]) {
                $mtype = Get-PaPrincipalType $m
                $mname = Get-PaValue $m 'displayName'
                if (-not $mname) { $unreadable.Add([pscustomobject]@{ GroupId = $a.principalId; GroupName = $pname; MemberId = $m.id; MemberType = $mtype }) }
                $rows.Add([pscustomobject]@{
                    Plane = 'Entra'; RoleId = $tid; RoleName = $roleName; Tier = $tier
                    Scope = $row.Scope; State = $State; EndDateTime = $End
                    PrincipalId = $m.id; PrincipalType = $mtype; PrincipalName = $mname; UserPrincipalName = (Get-PaValue $m 'userPrincipalName')
                    Via = 'Group'; ViaGroupId = $a.principalId
                })
            }
        }
    }

    foreach ($a in $active) {
        $end = Get-PaValue $a 'endDateTime'
        $state = if ($a.assignmentType -eq 'Activated') { 'Activated' } elseif ($end) { 'ActiveTimeBound' } else { 'ActivePermanent' }
        # An activation through a group eligibility is reported once, on the eligibility; memberType Group rows repeat the group's own.
        if ((Get-PaValue $a 'memberType') -eq 'Group') { continue }
        & $addEntra $a $state $end
    }
    foreach ($e in $eligible) {
        if ((Get-PaValue $e 'memberType') -eq 'Group') { continue }
        $exp = Get-PaValue (Get-PaValue $e 'scheduleInfo') 'expiration'
        $end = Get-PaValue $exp 'endDateTime'
        $state = if ((Get-PaValue $exp 'type') -eq 'noExpiration') { 'EligiblePermanent' } else { 'Eligible' }
        & $addEntra $e $state $end
    }

    # Azure: each configured scope, de-duplicated by schedule id, because a list at one scope also
    # returns schedules above and below it.
    $seen = @{}
    foreach ($scope in $AzureScope) {
        foreach ($kind in @('azure-assignment-schedules', 'azure-eligibility-schedules')) {
            foreach ($s in @(Invoke-PaList -Reader $Reader -CallId $kind -Bind @{ scope = $scope.TrimEnd('/') })) {
                if ($seen.ContainsKey($s.id)) { continue }
                $seen[$s.id] = $true
                $p = $s.properties
                if ((Get-PaValue $p 'memberType') -eq 'Inherited') { continue }
                $roleGuid = ($p.roleDefinitionId -split '/')[-1]
                $roleName = if ($TierMap.azure.ContainsKey($roleGuid)) { $TierMap.azure[$roleGuid].name } else { $roleGuid }
                $end = Get-PaValue $p 'endDateTime'
                $state = if ($kind -eq 'azure-eligibility-schedules') { if ($end) { 'Eligible' } else { 'EligiblePermanent' } }
                elseif ((Get-PaValue $p 'assignmentType') -eq 'Activated') { 'Activated' }
                elseif ($end) { 'ActiveTimeBound' } else { 'ActivePermanent' }
                $ptype = switch (Get-PaValue $p 'principalType') { 'User' { 'user' } 'Group' { 'group' } 'ServicePrincipal' { 'servicePrincipal' } default { 'unknown' } }
                $rows.Add([pscustomobject]@{
                    Plane = 'Azure'; RoleId = $roleGuid; RoleName = $roleName; Tier = (Get-PaAzureTier -RoleId $roleGuid -Scope $p.scope -TierMap $TierMap)
                    Scope = $p.scope; State = $state; EndDateTime = $end
                    PrincipalId = $p.principalId; PrincipalType = $ptype; PrincipalName = $null; UserPrincipalName = $null
                    Via = 'Direct'; ViaGroupId = $null
                })
            }
        }
    }

    [pscustomobject]@{ Cloud = $Reader.Cloud.Name; Rows = $rows.ToArray(); Unreadable = $unreadable.ToArray(); Evidence = $Reader.Evidence.ToArray() }
}

function New-PaFinding {
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$Object, [string]$ObjectId, [string]$Issue)
    [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Object = $Object; ObjectId = $ObjectId; Issue = $Issue }
}

function Import-PaExceptions {
    <# exceptions.csv: PrincipalId, Name, Reason, Owner. A row with no Owner doesn't count. #>
    param([string]$Path)
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return @() }
    @(Import-Csv -LiteralPath $Path | Where-Object { $_.PrincipalId -and $_.Owner })
}

function Test-PaInventory {
    <#
    .SYNOPSIS
        The inventory's findings, PA-INV-01 to PA-INV-09. Thresholds follow Learn where Learn
        gives one (fewer than five Global Administrators; at most three subscription owners) and
        the program's design elsewhere.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Inventory, [object[]]$Exceptions = @(), [int]$MaxGlobalAdmins = 4, [int]$MaxSubscriptionOwners = 3)
    $f = [Collections.Generic.List[object]]::new()
    $exc = @{}; foreach ($e in $Exceptions) { $exc[$e.PrincipalId] = $e }
    $rows = @($Inventory.Rows)
    $label = { param($r) if ($r.UserPrincipalName) { $r.UserPrincipalName } elseif ($r.PrincipalName) { $r.PrincipalName } else { $r.PrincipalId } }

    foreach ($r in $rows) {
        $who = & $label $r
        # PA-INV-01: standing active privilege in T0 or T1 outside the documented exceptions.
        if ($r.State -eq 'ActivePermanent' -and $r.Tier -in @('T0', 'T1')) {
            if ($exc.ContainsKey($r.PrincipalId)) {
                $f.Add((New-PaFinding 'PA-INV-01' 'Info' $who $r.PrincipalId "Standing $($r.RoleName) ($($r.Tier)) on the exceptions list: $($exc[$r.PrincipalId].Reason)"))
            } else {
                $f.Add((New-PaFinding 'PA-INV-01' 'Finding' $who $r.PrincipalId "Standing active $($r.RoleName) ($($r.Tier), $($r.Plane), scope $($r.Scope)) outside the documented exceptions"))
            }
        }
        # PA-INV-02: an Entra role assigned straight to a user, not through a PRV group.
        if ($r.Plane -eq 'Entra' -and $r.Via -eq 'Direct' -and $r.PrincipalType -eq 'user' -and $r.State -ne 'Activated' -and -not $exc.ContainsKey($r.PrincipalId) -and $r.Tier -ne 'Unclassified') {
            $f.Add((New-PaFinding 'PA-INV-02' 'Warn' $who $r.PrincipalId "$($r.RoleName) is assigned directly to the user ($($r.State)); the program assigns roles to a PRV role-assignable group"))
        }
        # PA-INV-03: a group that holds a role but isn't named PRV-<tier>-..., or names the wrong tier.
        if ($r.Plane -eq 'Entra' -and $r.Via -eq 'Direct' -and $r.PrincipalType -eq 'group') {
            $expected = "PRV-$($r.Tier)-"
            if (-not $r.PrincipalName -or -not $r.PrincipalName.StartsWith($expected, [StringComparison]::Ordinal)) {
                $f.Add((New-PaFinding 'PA-INV-03' 'Warn' $who $r.PrincipalId "Group holds $($r.RoleName) ($($r.Tier)) but isn't named $expected<role>[-<scope>]"))
            }
        }
        # PA-INV-05: a role with no tier.
        if ($r.Tier -eq 'Unclassified' -and $r.Via -eq 'Direct') {
            $f.Add((New-PaFinding 'PA-INV-05' 'Warn' $r.RoleName $r.RoleId "Role isn't in the tier map; classify it before it's treated as safe ($who holds it)"))
        }
        # PA-INV-06: eligibility that never expires.
        if ($r.State -eq 'EligiblePermanent' -and $r.Via -eq 'Direct') {
            $f.Add((New-PaFinding 'PA-INV-06' 'Warn' $who $r.PrincipalId "$($r.RoleName) eligibility has no end date; Appendix B bounds eligibility by tier"))
        }
        # PA-INV-07: User Access Administrator at root scope, which is what elevate access grants.
        if ($r.Plane -eq 'Azure' -and $r.Scope -eq '/' -and $r.RoleId -eq '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9' -and $r.State -notlike 'Eligible*') {
            $f.Add((New-PaFinding 'PA-INV-07' 'Finding' $who $r.PrincipalId 'User Access Administrator at root scope (/): elevated access over every subscription and management group; remove it when the task is done'))
        }
    }

    # PA-INV-04: Global Administrators, counted as distinct principals with any assignment.
    $ga = @($rows | Where-Object { $_.Plane -eq 'Entra' -and $_.RoleId -eq $script:GlobalAdminTemplateId -and $_.PrincipalType -ne 'group' } | Select-Object -ExpandProperty PrincipalId -Unique)
    if ($ga.Count -gt $MaxGlobalAdmins) {
        $f.Add((New-PaFinding 'PA-INV-04' 'Finding' 'Global Administrator' $script:GlobalAdminTemplateId "$($ga.Count) principals hold or are eligible for Global Administrator; Learn advises fewer than five"))
    }

    # PA-INV-08: more than three owners on a subscription (direct, active or eligible).
    $owners = $rows | Where-Object { $_.Plane -eq 'Azure' -and $_.RoleName -eq 'Owner' -and $_.Scope -match '^/subscriptions/[^/]+$' } | Group-Object Scope
    foreach ($g in $owners) {
        $n = @($g.Group | Select-Object -ExpandProperty PrincipalId -Unique).Count
        if ($n -gt $MaxSubscriptionOwners) {
            $f.Add((New-PaFinding 'PA-INV-08' 'Finding' $g.Name $g.Name "$n Owner assignments on the subscription; Learn's best practice is at most $MaxSubscriptionOwners"))
        }
    }

    # PA-INV-09: group members whose names the run couldn't read.
    foreach ($u in @($Inventory.Unreadable)) {
        $f.Add((New-PaFinding 'PA-INV-09' 'Warn' $u.MemberId $u.MemberId "Member of $($u.GroupName) returned with id and type only; grant User.ReadBasic.All, or the review sees an unnamed holder"))
    }
    $f.ToArray()
}

function Write-PaJson {
    param([string]$Path, $Value)
    [IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 20) + "`n", [Text.UTF8Encoding]::new($false))
}

function Export-PaRun {
    <#
    .SYNOPSIS
        Write a run's outputs and a manifest with the SHA-256 of each file, the cloud, the calls
        sent and their permissions, so the ISSO can check what the evidence is and how it was read.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][ValidateSet('inventory', 'emergency-access')][string]$Task,
        [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud,
        [object[]]$Evidence = @(),
        [string]$TenantId,
        [string]$Mode = 'Fixture'
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
        } else { Write-PaJson -Path $p -Value $v }
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $perm = Get-PaRequiredPermission -Task $Task
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId
        generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; at = $_.At } })
        files = $hashes
    }
    Write-PaJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

# ----------------------------------------------------------------------------- Chapter 02: emergency access

$script:NotPhishingResistant = @(
    '#microsoft.graph.phoneAuthenticationMethod',
    '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod',
    '#microsoft.graph.softwareOathAuthenticationMethod',
    '#microsoft.graph.emailAuthenticationMethod',
    '#microsoft.graph.temporaryAccessPassAuthenticationMethod'
)

function Read-PaEmergencyConfig {
    <#
    .SYNOPSIS
        emergency-access.json: accounts (id, userPrincipalName), exclusionGroupId, and optional
        minimumAccounts (2) and maxValidationAgeDays (90). Malformed input throws.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $c = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    foreach ($k in 'accounts', 'exclusionGroupId') { if (-not $c.ContainsKey($k) -or -not $c[$k]) { throw "emergency-access.json: '$k' is required" } }
    $guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    foreach ($a in $c.accounts) {
        if ($a.id -notmatch $guid) { throw "emergency-access.json: account id '$($a.id)' isn't an object ID; the alert keys on object IDs, never names" }
    }
    if ($c.exclusionGroupId -notmatch $guid) { throw 'emergency-access.json: exclusionGroupId must be an object ID' }
    if (-not $c.ContainsKey('minimumAccounts')) { $c.minimumAccounts = 2 }
    if (-not $c.ContainsKey('maxValidationAgeDays')) { $c.maxValidationAgeDays = 90 }
    $c
}

function Test-PaEmergencyAccess {
    <#
    .SYNOPSIS
        Check the emergency access accounts against Learn's standard and Book 04's: PA-EA-01 to
        PA-EA-10. Reads users, their methods, their Global Administrator assignment, the exclusion
        group and every Conditional Access policy. Changes nothing.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][hashtable]$Config,
        [object[]]$Validations = @(),
        [datetime]$AsOf = [datetime]::UtcNow
    )
    $f = [Collections.Generic.List[object]]::new()
    $ids = @($Config.accounts | ForEach-Object { $_.id })

    if ($ids.Count -lt $Config.minimumAccounts) {
        $f.Add((New-PaFinding 'PA-EA-01' 'Finding' 'emergency-access.json' '' "$($ids.Count) emergency access account(s) configured; at least $($Config.minimumAccounts) are required"))
    }

    $groupMembers = @(Invoke-PaList -Reader $Reader -CallId 'group-members' -Bind @{ id = $Config.exclusionGroupId } -Query '$select=id,displayName,userPrincipalName')
    $memberIds = @($groupMembers | ForEach-Object { $_.id })
    $policies = @(Invoke-PaList -Reader $Reader -CallId 'ca-policies')

    foreach ($id in $ids) {
        $u = Invoke-PaGetOne -Reader $Reader -CallId 'user' -Bind @{ id = $id } -Query '$select=id,userPrincipalName,accountEnabled,onPremisesSyncEnabled'
        $upn = $u.userPrincipalName
        if ($upn -notmatch '@[A-Za-z0-9-]+\.onmicrosoft\.com$') {
            $f.Add((New-PaFinding 'PA-EA-02' 'Finding' $upn $id 'Not on the tenant''s *.onmicrosoft.com domain'))
        }
        if ((Get-PaValue $u 'onPremisesSyncEnabled') -eq $true) {
            $f.Add((New-PaFinding 'PA-EA-03' 'Finding' $upn $id 'Synchronized from on-premises; emergency accounts are cloud-only'))
        }
        if ((Get-PaValue $u 'accountEnabled') -ne $true) {
            $f.Add((New-PaFinding 'PA-EA-04' 'Finding' $upn $id 'Account is disabled'))
        }

        $asg = @(Invoke-PaList -Reader $Reader -CallId 'entra-active-assignments' -Query "`$filter=principalId eq '$id'")
        $ga = @($asg | Where-Object { $_.roleDefinitionId -eq $script:GlobalAdminTemplateId -and (Get-PaValue $_ 'directoryScopeId') -eq '/' })
        $permanent = @($ga | Where-Object { $_.assignmentType -eq 'Assigned' -and -not (Get-PaValue $_ 'endDateTime') -and (Get-PaValue $_ 'memberType') -eq 'Direct' })
        if ($permanent.Count -eq 0) {
            $why = if ($ga.Count -eq 0) { 'no active Global Administrator assignment (eligible only, or none)' } else { 'Global Administrator is active but time-bound, activated or inherited' }
            $f.Add((New-PaFinding 'PA-EA-05' 'Finding' $upn $id "Not permanent active Global Administrator: $why"))
        }

        $methods = @(Invoke-PaList -Reader $Reader -CallId 'user-auth-methods' -Bind @{ id = $id })
        $types = @($methods | ForEach-Object { $_['@odata.type'] })
        $weak = @($types | Where-Object { $script:NotPhishingResistant -contains $_ } | ForEach-Object { $_ -replace '^#microsoft\.graph\.', '' })
        if ($weak.Count -gt 0) {
            $f.Add((New-PaFinding 'PA-EA-06' 'Finding' $upn $id "Registered methods that aren't phishing-resistant: $($weak -join ', ')"))
        }
        if ($types -notcontains '#microsoft.graph.fido2AuthenticationMethod') {
            $f.Add((New-PaFinding 'PA-EA-06' 'Warn' $upn $id 'No passkey (FIDO2) registered; confirm certificate-based authentication is configured for this account'))
        }

        if ($memberIds -notcontains $id) {
            $f.Add((New-PaFinding 'PA-EA-07' 'Finding' $upn $id 'Not a member of the emergency access exclusion group'))
        }

        $last = @($Validations | Where-Object { $_.AccountId -eq $id -and $_.Result -eq 'Pass' } | ForEach-Object { [datetime]::Parse($_.Date, [Globalization.CultureInfo]::InvariantCulture) } | Sort-Object -Descending | Select-Object -First 1)
        if ($last.Count -eq 0) {
            $f.Add((New-PaFinding 'PA-EA-09' 'Finding' $upn $id 'No passing validation recorded'))
        } elseif (($AsOf - $last[0]).TotalDays -gt $Config.maxValidationAgeDays) {
            $f.Add((New-PaFinding 'PA-EA-09' 'Finding' $upn $id "Last passing validation $($last[0].ToString('yyyy-MM-dd')) is older than $($Config.maxValidationAgeDays) days"))
        }
    }

    # PA-EA-08: every enforced policy excludes the group (or each account). Report-only needs no exclusion.
    foreach ($p in $policies) {
        $users = Get-PaValue (Get-PaValue $p 'conditions') 'users'
        $exG = @(Get-PaValue $users 'excludeGroups')
        $exU = @(Get-PaValue $users 'excludeUsers')
        switch ($p.state) {
            'enabled' {
                $missing = @($ids | Where-Object { $exU -notcontains $_ -and -not ($exG -contains $Config.exclusionGroupId -and $memberIds -contains $_) })
                if ($missing.Count -gt 0) {
                    $f.Add((New-PaFinding 'PA-EA-08' 'Finding' $p.displayName $p.id "Enforced policy doesn't exclude $($missing.Count) emergency account(s) through the exclusion group or directly"))
                }
            }
            'enabledForReportingButNotEnforced' {
                if ($exG -notcontains $Config.exclusionGroupId) {
                    $f.Add((New-PaFinding 'PA-EA-08' 'Info' $p.displayName $p.id 'Report-only and not excluding the group: allowed (it records emergency sign-ins), but excluding it before enforcement is required'))
                }
            }
        }
    }

    # PA-EA-10: the exclusion group holds only the emergency accounts.
    foreach ($m in $groupMembers) {
        if ($ids -notcontains $m.id) {
            $n = if (Get-PaValue $m 'userPrincipalName') { $m.userPrincipalName } else { $m.id }
            $f.Add((New-PaFinding 'PA-EA-10' 'Finding' $n $m.id 'Member of the emergency access exclusion group but not a configured emergency account: every policy that excludes the group excludes it too'))
        }
    }
    $f.ToArray()
}

function Get-PaEmergencyQuery {
    <#
    .SYNOPSIS
        The KQL for the emergency access alert: interactive and non-interactive sign-ins, and
        audit events the accounts initiate or are the target of, matched by object ID.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string[]]$AccountId)
    $guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    foreach ($a in $AccountId) { if ($a -notmatch $guid) { throw "'$a' isn't an object ID" } }
    if ($AccountId -contains '00aa00aa-bb11-cc22-dd33-44ee44ee44ee' -or $AccountId -contains '11bb11bb-cc22-dd33-ee44-55ff55ff55ff') {
        throw "Learn's placeholder IDs aren't emergency accounts"
    }
    $list = ($AccountId | ForEach-Object { "`"$($_.ToLowerInvariant())`"" }) -join ', '
    @"
let EmergencyIds = dynamic([$list]);
union
    (SigninLogs | where UserId in~ (EmergencyIds) | extend Source = "SigninLogs", AccountId = UserId),
    (AADNonInteractiveUserSignInLogs | where UserId in~ (EmergencyIds) | extend Source = "AADNonInteractiveUserSignInLogs", AccountId = UserId),
    (AuditLogs
        | extend Initiator = tostring(InitiatedBy.user.id)
        | mv-expand Target = TargetResources
        | extend TargetId = tostring(Target.id)
        | where Initiator in~ (EmergencyIds) or TargetId in~ (EmergencyIds)
        | extend Source = "AuditLogs", AccountId = iff(Initiator in~ (EmergencyIds), Initiator, TargetId))
| project TimeGenerated, Source, AccountId, OperationName, ResultType
"@
}

function New-PaEmergencyAlertRule {
    <#
    .SYNOPSIS
        An ARM template for the alert: Microsoft.Insights/scheduledQueryRules (2023-12-01), a log
        search alert over the workspace that receives the Entra logs, severity 0, any result
        fires, every 5 minutes. Returned as an ordered hashtable for review and a deployment the
        operator runs; this function deploys nothing.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string[]]$AccountId,
        [Parameter(Mandatory)][string]$WorkspaceResourceId,
        [Parameter(Mandatory)][string]$ActionGroupResourceId,
        [Parameter(Mandatory)][string]$Location,
        [string]$Name = 'FMP-EmergencyAccess-AnyUse'
    )
    foreach ($r in $WorkspaceResourceId, $ActionGroupResourceId) {
        if ($r -notmatch '^/subscriptions/[^/]+/resourceGroups/[^/]+/providers/') { throw "'$r' isn't a resource ID" }
    }
    if ($WorkspaceResourceId -notmatch '/providers/Microsoft\.OperationalInsights/workspaces/[^/]+$') { throw 'WorkspaceResourceId must be a Log Analytics workspace' }
    if ($ActionGroupResourceId -notmatch '/providers/Microsoft\.Insights/actionGroups/[^/]+$') { throw 'ActionGroupResourceId must be an action group' }
    [ordered]@{
        '$schema'      = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
        contentVersion = '1.0.0.0'
        resources      = @(
            [ordered]@{
                type       = 'Microsoft.Insights/scheduledQueryRules'
                apiVersion = '2023-12-01'
                name       = $Name
                location   = $Location
                kind       = 'LogAlert'
                properties = [ordered]@{
                    displayName         = $Name
                    description         = 'Any sign-in or audit event by or on an emergency access account. Treat as an incident until the post-use review closes it.'
                    severity            = 0
                    enabled             = $true
                    scopes              = @($WorkspaceResourceId)
                    evaluationFrequency = 'PT5M'
                    windowSize          = 'PT5M'
                    criteria            = [ordered]@{
                        allOf = @(
                            [ordered]@{
                                query           = (Get-PaEmergencyQuery -AccountId $AccountId)
                                timeAggregation = 'Count'
                                operator        = 'GreaterThan'
                                threshold       = 0
                                failingPeriods  = [ordered]@{ numberOfEvaluationPeriods = 1; minFailingPeriodsToAlert = 1 }
                            }
                        )
                    }
                    autoMitigate        = $false
                    actions             = [ordered]@{ actionGroups = @($ActionGroupResourceId) }
                }
            }
        )
    }
}

function Find-PaEmergencyActivity {
    <#
    .SYNOPSIS
        Offline, the same match as Get-PaEmergencyQuery over exported log rows (each with a Table
        field): for a lab, a drill review, or to compare with another query. Not a KQL engine.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Rows, [Parameter(Mandatory)][string[]]$AccountId)
    $ids = @($AccountId | ForEach-Object { $_.ToLowerInvariant() })
    foreach ($r in $Rows) {
        $hit = $null
        switch ($r.Table) {
            { $_ -in 'SigninLogs', 'AADNonInteractiveUserSignInLogs' } {
                if ($r.UserId -and $ids -contains ([string]$r.UserId).ToLowerInvariant()) { $hit = [string]$r.UserId }
            }
            'AuditLogs' {
                $init = $null
                if ($r.InitiatedBy -and $r.InitiatedBy.user) { $init = [string]$r.InitiatedBy.user.id }
                if ($init -and $ids -contains $init.ToLowerInvariant()) { $hit = $init }
                else {
                    foreach ($t in @($r.TargetResources)) { if ($t -and $t.id -and $ids -contains ([string]$t.id).ToLowerInvariant()) { $hit = [string]$t.id; break } }
                }
            }
        }
        if ($hit) { [pscustomobject]@{ TimeGenerated = $r.TimeGenerated; Source = $r.Table; AccountId = $hit; OperationName = $r.OperationName; ResultType = $r.ResultType } }
    }
}

Export-ModuleMember -Function Get-PaCloud, Get-PaCall, Get-PaRequiredPermission, Get-PaTierMap, New-PaReader, Invoke-PaList, Invoke-PaGetOne,
    New-PaLiveInvoker, New-PaFixtureInvoker, Invoke-PaFake, Get-PaAzureTier, Get-PaPrivilegedInventory, Import-PaExceptions, Test-PaInventory,
    Export-PaRun, Read-PaEmergencyConfig, Test-PaEmergencyAccess, Get-PaEmergencyQuery, New-PaEmergencyAlertRule, Find-PaEmergencyActivity
