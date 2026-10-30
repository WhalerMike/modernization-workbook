#Requires -Version 7.1
<#
    PaAccessReviews: Chapter 07 of the developer workbook "Building Privileged Access".

    Access reviews of privileged roles as code: reviewed JSON (config) is turned into Microsoft
    Graph accessReviewScheduleDefinition bodies (Microsoft Entra roles, PIM for Groups) and Azure
    Resource Manager accessReviewScheduleDefinitions bodies (Azure roles, preview API), checked
    against the program's rules, compared with what the tenant holds, and written only with an
    explicit -Apply. The review results are read back as evidence.

    Every call is declared in config/calls-ch07.json with its least-privileged permission and sent
    only to the cloud's own host. Reads are GET. Writes (POST and PUT) happen only in
    Invoke-PaArApply, only for actions the plan lists, and never delete anything.
    Illustrative: tested against fixtures and a fake, not a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../PrivilegedAccess/PrivilegedAccess.psm1') -Function Get-PaCloud -Force -Global:$false

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:Tasks = @('access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence')
$script:ArmApiVersion = '2021-12-01-preview'
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
$script:EmptyGuid = '00000000-0000-0000-0000-000000000000'

# ----------------------------------------------------------------------------- calls and permissions

function Get-PaArCall {
    <# The declared Chapter 07 calls, optionally for one task. #>
    [CmdletBinding()]
    param([ValidateSet('access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence')][string]$Task)
    $all = @((Get-Content -LiteralPath (Join-Path $script:ConfigRoot 'calls-ch07.json') -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    , $all
}

function Get-PaArRequiredPermission {
    <#
    .SYNOPSIS
        A task's Microsoft Graph permissions and Azure roles: the union of its calls, with a
        Read.All permission dropped when the task also holds the matching ReadWrite.All, which
        Learn lists as the higher-privileged permission for the same reads.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence')][string]$Task)
    $calls = Get-PaArCall -Task $Task
    $graph = @($calls | Where-Object { $_.api -eq 'graph' } | ForEach-Object { $_.permissions } | Sort-Object -Unique)
    $graph = @($graph | Where-Object { -not ($_ -like '*.Read.All' -and $graph -contains ($_ -replace '\.Read\.All$', '.ReadWrite.All')) })
    $azure = @($calls | Where-Object { $_.api -eq 'arm' } | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
    if ($azure -contains 'User Access Administrator') { $azure = @($azure | Where-Object { $_ -ne 'Reader' }) }
    [pscustomobject]@{ Task = $Task; GraphPermissions = $graph; AzureRoles = $azure }
}

# ----------------------------------------------------------------------------- the client

function New-PaArClient {
    <#
    .SYNOPSIS
        A client for one task in one cloud. -Invoke is { param($Method, $Uri, $Body) } returning
        the parsed JSON body as a hashtable: the fake's .Invoke, or New-PaArLiveInvoker.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][ValidateSet('access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence')][string]$Task,
        [Parameter(Mandatory)][scriptblock]$Invoke
    )
    [pscustomobject]@{
        Cloud    = Get-PaCloud -Cloud $Cloud
        Task     = $Task
        Calls    = Get-PaArCall -Task $Task
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-PaArUri {
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch07.json with its permission." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [Uri]::EscapeDataString([string]$Bind[$k])) }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    if ($call.api -eq 'graph') {
        $hostName = $Client.Cloud.Graph
        $uri = "$hostName/$($call.version)$path"
        if ($Query) { $uri += "?$Query" }
    } else {
        $hostName = $Client.Cloud.Arm
        $uri = "$hostName$path`?api-version=$($call.apiVersion)"
        if ($Query) { $uri += "&$Query" }
    }
    [pscustomobject]@{ Call = $call; Uri = $uri; Host = $hostName }
}

function Assert-PaArHost {
    param([string]$Uri, [string]$ExpectedHost)
    if (-not $Uri.StartsWith("$ExpectedHost/", [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to send the token to $Uri`: not $ExpectedHost"
    }
}

function Add-PaArEvidence {
    param($Client, [string]$CallId, [string]$Method, [string]$Uri)
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $Method; Uri = $Uri; At = [DateTime]::UtcNow.ToString('o') })
}

function Invoke-PaArList {
    <#
    .SYNOPSIS
        GET a declared collection and every page. Follows @odata.nextLink (Graph) or nextLink
        (Resource Manager) on the same host. For a Graph call with $top, a full page with no
        next link is followed with $skip, because Learn documents $skip and $top paging for the
        access reviews lists.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [int]$Top = 0)
    $r = Resolve-PaArUri -Client $Client -CallId $CallId -Bind $Bind -Query $(if ($Top -gt 0) { "`$top=$Top" } else { $null })
    if ($r.Call.method -ne 'GET') { throw "Invoke-PaArList only reads; '$CallId' is $($r.Call.method)" }
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri
    $skip = 0
    while ($uri) {
        Assert-PaArHost -Uri $uri -ExpectedHost $r.Host
        Add-PaArEvidence $Client $CallId 'GET' $uri
        $body = & $Client.Invoke 'GET' $uri $null
        if ($null -eq $body) { throw "No response for $uri" }
        $page = @(if ($body.ContainsKey('value')) { $body['value'] } else { , $body })
        foreach ($v in $page) { if ($null -ne $v) { $items.Add($v) } }
        if ($body.ContainsKey('@odata.nextLink')) { $uri = $body['@odata.nextLink'] }
        elseif ($body.ContainsKey('nextLink') -and $body['nextLink']) { $uri = $body['nextLink'] }
        elseif ($r.Call.api -eq 'graph' -and $Top -gt 0 -and $page.Count -ge $Top) {
            $skip += $Top
            $uri = (Resolve-PaArUri -Client $Client -CallId $CallId -Bind $Bind -Query "`$top=$Top&`$skip=$skip").Uri
        } else { $uri = $null }
    }
    $items.ToArray()
}

function Invoke-PaArWrite {
    <# One declared write (POST or PUT), recorded in the evidence. Only Invoke-PaArApply calls it. #>
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, $Body)
    $r = Resolve-PaArUri -Client $Client -CallId $CallId -Bind $Bind
    if ($r.Call.method -notin 'POST', 'PUT') { throw "Refusing $($r.Call.method) for '$CallId': this module never deletes." }
    Assert-PaArHost -Uri $r.Uri -ExpectedHost $r.Host
    Add-PaArEvidence $Client $CallId $r.Call.method $r.Uri
    & $Client.Invoke $r.Call.method $r.Uri $Body
}

function New-PaArLiveInvoker {
    <#
    .SYNOPSIS
        Graph through Invoke-MgGraphRequest, Resource Manager through Invoke-AzRestMethod. Refuses
        any write unless -AllowWrite, and refuses to run if a session is signed in to another
        cloud. Sign in first: Connect-MgGraph -Environment <GraphEnvironment>, and
        Connect-AzAccount -Environment <AzureEnvironment> unless -SkipAzure.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [switch]$AllowWrite, [switch]$SkipAzure)
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
    $write = [bool]$AllowWrite
    {
        param($Method, $Uri, $Body)
        if ($Method -ne 'GET' -and -not $write) { throw "Refusing $Method $Uri`: writes need -Apply" }
        if ($Method -notin 'GET', 'POST', 'PUT') { throw "Refusing $Method" }
        $json = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 30 -Compress } else { $null }
        if ($Uri.StartsWith("$graph/")) {
            if ($json) { Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body $json -ContentType 'application/json' -OutputType Hashtable }
            else { Invoke-MgGraphRequest -Method $Method -Uri $Uri -OutputType Hashtable }
        } else {
            $resp = if ($json) { Invoke-AzRestMethod -Method $Method -Uri $Uri -Payload $json } else { Invoke-AzRestMethod -Method $Method -Uri $Uri }
            if ($resp.StatusCode -ge 400) { throw "Resource Manager returned $($resp.StatusCode) for $Method $Uri" }
            if ($resp.Content) { $resp.Content | ConvertFrom-Json -AsHashtable -Depth 50 } else { @{} }
        }
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the fake

function New-PaArFake {
    <#
    .SYNOPSIS
        A fake Graph and Resource Manager for the access reviews APIs, served from a fixture file
        (or empty). GET pages collections by -PageSize with a next link; POST creates a definition
        with a new ID (it never refuses a duplicate name, as Learn documents no such check); PUT
        replaces one. DELETE and anything else throw. Every request is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([string]$Path, [int]$PageSize = 2, [string]$Cloud = 'gcc')
    $t = if ($Path) { Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50 } else { @{} }
    foreach ($k in 'graphDefinitions', 'graphInstances', 'graphDecisions', 'armDefinitions', 'armInstances', 'armDecisions') {
        if (-not $t.ContainsKey($k)) { $t[$k] = if ($k -eq 'graphDefinitions') { [Collections.Generic.List[object]]::new() } else { @{} } }
    }
    $t['graphDefinitions'] = [Collections.Generic.List[object]]@($t['graphDefinitions'])
    $c = Get-PaCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Tenant = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph; Arm = $c.Arm; Invoke = $null; NextId = 1 }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body) Invoke-PaArFake -State $s -Method $Method -Uri $Uri -Body $Body }.GetNewClosure()
    $state
}

function Invoke-PaArFake {
    param($State, [string]$Method, [string]$Uri, $Body)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
    $t = $State.Tenant
    $u = [Uri]$Uri
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    $base = "$($u.Scheme)://$($u.Host)"
    $page = {
        param([object[]]$All, [string]$LinkKey)
        $All = @($All | Where-Object { $null -ne $_ })
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $slice = @($All | Select-Object -Skip $skip -First $State.PageSize)
        $resp = @{ value = $slice }
        if ($skip + $State.PageSize -lt $All.Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $resp[$LinkKey] = "$base$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
        }
        $resp
    }
    $newId = {
        $n = $State.NextId; $State.NextId++
        '7a000000-0000-4000-8000-{0:d12}' -f (900000000000 + $n)
    }
    if ($base -eq $State.Graph) {
        switch -Regex ($path) {
            '^/v1\.0/identityGovernance/accessReviews/definitions$' {
                if ($Method -eq 'GET') { return & $page @($t.graphDefinitions) '@odata.nextLink' }
                if ($Method -eq 'POST') {
                    if ($null -eq $Body) { throw '400 no body' }
                    $d = ($Body | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30)
                    $d['id'] = & $newId; $d['status'] = 'NotStarted'
                    if (-not $d.ContainsKey('fallbackReviewers')) { $d['fallbackReviewers'] = @() }
                    $t.graphDefinitions.Add($d)
                    return $d
                }
            }
            '^/v1\.0/identityGovernance/accessReviews/definitions/([^/]+)$' {
                $id = $Matches[1]
                $i = -1; for ($n = 0; $n -lt $t.graphDefinitions.Count; $n++) { if ($t.graphDefinitions[$n].id -eq $id) { $i = $n } }
                if ($i -lt 0) { throw "404 definition $id" }
                if ($Method -eq 'GET') { return $t.graphDefinitions[$i] }
                if ($Method -eq 'PUT') {
                    $d = ($Body | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30)
                    $d['id'] = $id; $d['status'] = $t.graphDefinitions[$i].status
                    $t.graphDefinitions[$i] = $d
                    return @{}
                }
            }
            '^/v1\.0/identityGovernance/accessReviews/definitions/([^/]+)/instances$' {
                if ($Method -eq 'GET') { $id = $Matches[1]; return & $page @($(if ($t.graphInstances.ContainsKey($id)) { $t.graphInstances[$id] } else { @() })) '@odata.nextLink' }
            }
            '^/v1\.0/identityGovernance/accessReviews/definitions/([^/]+)/instances/([^/]+)/decisions$' {
                if ($Method -eq 'GET') { $id = $Matches[2]; return & $page @($(if ($t.graphDecisions.ContainsKey($id)) { $t.graphDecisions[$id] } else { @() })) '@odata.nextLink' }
            }
        }
        throw "The fake has no Graph route for $Method $path"
    }
    if ($base -eq $State.Arm) {
        if ($q['api-version'] -ne $script:ArmApiVersion) { throw "Unexpected api-version $($q['api-version'])" }
        switch -Regex ($path) {
            '^/subscriptions/([^/]+)/providers/Microsoft\.Authorization/accessReviewScheduleDefinitions$' {
                $sub = $Matches[1]
                if ($Method -eq 'GET') { return & $page @($(if ($t.armDefinitions.ContainsKey($sub)) { $t.armDefinitions[$sub] } else { @() })) 'nextLink' }
            }
            '^/subscriptions/([^/]+)/providers/Microsoft\.Authorization/accessReviewScheduleDefinitions/([^/]+)$' {
                $sub = $Matches[1]; $id = $Matches[2]
                if ($Method -eq 'PUT') {
                    $props = ($Body | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30)
                    $res = @{ id = "/subscriptions/$sub/providers/Microsoft.Authorization/accessReviewScheduleDefinitions/$id"; name = $id; type = 'Microsoft.Authorization/accessReviewScheduleDefinitions'; properties = $props }
                    if (-not $t.armDefinitions.ContainsKey($sub)) { $t.armDefinitions[$sub] = @() }
                    $t.armDefinitions[$sub] = @(@($t.armDefinitions[$sub] | Where-Object { $_.name -ne $id }) + $res)
                    return $res
                }
            }
            '^/subscriptions/([^/]+)/providers/Microsoft\.Authorization/accessReviewScheduleDefinitions/([^/]+)/instances$' {
                if ($Method -eq 'GET') { $id = $Matches[2]; return & $page @($(if ($t.armInstances.ContainsKey($id)) { $t.armInstances[$id] } else { @() })) 'nextLink' }
            }
            '^/subscriptions/([^/]+)/providers/Microsoft\.Authorization/accessReviewScheduleDefinitions/([^/]+)/instances/([^/]+)/decisions$' {
                if ($Method -eq 'GET') { $id = $Matches[3]; return & $page @($(if ($t.armDecisions.ContainsKey($id)) { $t.armDecisions[$id] } else { @() })) 'nextLink' }
            }
        }
        throw "The fake has no Resource Manager route for $Method $path"
    }
    throw "The fake refuses host $base"
}

# ----------------------------------------------------------------------------- the reviewed JSON

function Read-PaArConfig {
    <#
    .SYNOPSIS
        Read and check the reviewed JSON of review series. Names must be unique and start with the
        managed prefix; IDs must be object IDs; each review names exactly one role or group.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $c = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 30
    foreach ($k in 'namePrefix', 'defaults', 'reviews') { if (-not $c.ContainsKey($k)) { throw "Configuration is missing '$k'" } }
    if (-not $c.ContainsKey('protectedRoleTemplateIds')) { $c['protectedRoleTemplateIds'] = @('62e90394-69f5-4237-9190-012177145e10') }
    if (-not $c.ContainsKey('emergencyAccountIds')) { $c['emergencyAccountIds'] = @() }
    $names = @{}
    foreach ($r in @($c.reviews)) {
        foreach ($k in 'name', 'kind', 'tier', 'cadence', 'reviewers', 'descriptionForReviewers') { if (-not $r.ContainsKey($k)) { throw "Review '$($r['name'])' is missing '$k'" } }
        if (-not $r.name.StartsWith($c.namePrefix)) { throw "Review '$($r.name)' doesn't start with the managed prefix '$($c.namePrefix)'" }
        if ($names.ContainsKey($r.name)) { throw "Review name '$($r.name)' is used twice" }
        $names[$r.name] = $true
        if ($r.kind -notin 'entraRole', 'pimGroup', 'azureRole') { throw "Review '$($r.name)': unknown kind '$($r.kind)'" }
        if ($r.cadence -notin 'monthly', 'quarterly') { throw "Review '$($r.name)': cadence must be monthly or quarterly" }
        $ids = switch ($r.kind) {
            'entraRole' { @($r.roleTemplateId) }
            'pimGroup' { @($r.groupId) }
            'azureRole' { @($r.subscriptionId, $r.roleDefinitionId) }
        }
        foreach ($id in $ids) { if ([string]$id -notmatch $script:Guid) { throw "Review '$($r.name)': '$id' isn't an object ID" } }
        foreach ($rv in @($r.reviewers) + @($(if ($r.ContainsKey('fallbackReviewers')) { $r.fallbackReviewers } else { @() }))) {
            $v = if ($rv.ContainsKey('group')) { $rv.group } elseif ($rv.ContainsKey('user')) { $rv.user } else { throw "Review '$($r.name)': a reviewer must be { group } or { user }" }
            if ([string]$v -notmatch $script:Guid) { throw "Review '$($r.name)': reviewer '$v' isn't an object ID" }
        }
    }
    $c
}

function Get-PaArSetting {
    param($Review, $Config, [string]$Key)
    if ($Review.ContainsKey($Key)) { $Review[$Key] } elseif ($Config.defaults.ContainsKey($Key)) { $Config.defaults[$Key] } else { $null }
}

function ConvertTo-PaArReviewerScope {
    param($Entry)
    if ($Entry.ContainsKey('group')) { [ordered]@{ query = "/groups/$($Entry.group)/transitiveMembers"; queryType = 'MicrosoftGraph' } }
    else { [ordered]@{ query = "/users/$($Entry.user)"; queryType = 'MicrosoftGraph' } }
}

function Get-PaArScope {
    <#
    .SYNOPSIS
        The Graph scope for one review, from Learn's documented patterns only: the tutorial's
        principalResourceMembershipsScope (users and groups, active and eligible) for a role, the
        scope article's Example 12.2 queries (users only) for eligible-only or active-only, and
        Example 1 (transitive members) for a PIM for Groups group.
    #>
    param($Review)
    switch ($Review.kind) {
        'entraRole' {
            $assign = if ($Review.ContainsKey('assignments')) { $Review.assignments } else { 'activeAndEligible' }
            $rid = $Review.roleTemplateId
            switch ($assign) {
                'activeAndEligible' {
                    [ordered]@{
                        '@odata.type'   = '#microsoft.graph.principalResourceMembershipsScope'
                        principalScopes = @(
                            [ordered]@{ '@odata.type' = '#microsoft.graph.accessReviewQueryScope'; query = '/users'; queryType = 'MicrosoftGraph' },
                            [ordered]@{ '@odata.type' = '#microsoft.graph.accessReviewQueryScope'; query = '/groups'; queryType = 'MicrosoftGraph' })
                        resourceScopes  = @(
                            [ordered]@{ '@odata.type' = '#microsoft.graph.accessReviewQueryScope'; query = "/roleManagement/directory/roleDefinitions/$rid"; queryType = 'MicrosoftGraph' })
                    }
                }
                'eligible' {
                    [ordered]@{ '@odata.type' = '#microsoft.graph.accessReviewQueryScope'; query = "/roleManagement/directory/roleEligibilityScheduleInstances?`$expand=principal&`$filter=(isof(principal,'microsoft.graph.user') and roleDefinitionId eq '$rid')"; queryType = 'MicrosoftGraph' }
                }
                'active' {
                    [ordered]@{ '@odata.type' = '#microsoft.graph.accessReviewQueryScope'; query = "/roleManagement/directory/roleAssignmentScheduleInstances?`$expand=principal&`$filter=(assignmentType eq 'Assigned' and isof(principal,'microsoft.graph.user') and roleDefinitionId eq '$rid')"; queryType = 'MicrosoftGraph' }
                }
                default { throw "Review '$($Review.name)': assignments must be activeAndEligible, eligible or active" }
            }
        }
        'pimGroup' { [ordered]@{ '@odata.type' = '#microsoft.graph.accessReviewQueryScope'; query = "/groups/$($Review.groupId)/transitiveMembers"; queryType = 'MicrosoftGraph' } }
    }
}

function New-PaArDefinitionBody {
    <#
    .SYNOPSIS
        The request body for one review series: a Graph accessReviewScheduleDefinition for an Entra
        role or a PIM for Groups group, or the Resource Manager accessReviewScheduleDefinition
        properties for an Azure role (preview API). Returns @{ Api; Body; Name; Review }.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Review, [Parameter(Mandatory)]$Config)
    $dd = [string](Get-PaArSetting $Review $Config 'defaultDecision')
    $start = [datetime]::ParseExact([string](Get-PaArSetting $Review $Config 'startDate'), 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
    $interval = if ($Review.cadence -eq 'monthly') { 1 } else { 3 }
    $admins = "Managed by examples/privileged-access (Chapter 07). Tier $($Review.tier). Change it in the reviewed JSON, not here."
    $settings = [ordered]@{
        mailNotificationsEnabled        = [bool](Get-PaArSetting $Review $Config 'mailNotificationsEnabled')
        reminderNotificationsEnabled    = [bool](Get-PaArSetting $Review $Config 'reminderNotificationsEnabled')
        justificationRequiredOnApproval = [bool](Get-PaArSetting $Review $Config 'justificationRequiredOnApproval')
        defaultDecisionEnabled          = ($dd -ne 'None' -and $dd -ne '')
        defaultDecision                 = $(if ($dd) { $dd } else { 'None' })
        instanceDurationInDays          = [int](Get-PaArSetting $Review $Config 'instanceDurationInDays')
        autoApplyDecisionsEnabled       = [bool](Get-PaArSetting $Review $Config 'autoApplyDecisionsEnabled')
        recommendationsEnabled          = [bool](Get-PaArSetting $Review $Config 'recommendationsEnabled')
    }
    if ($Review.kind -ne 'azureRole') {
        $settings['recurrence'] = [ordered]@{
            pattern = [ordered]@{ type = 'absoluteMonthly'; interval = $interval; dayOfMonth = $start.Day }
            range   = [ordered]@{ type = 'noEnd'; startDate = $start.ToString('yyyy-MM-dd') }
        }
        $settings['applyActions'] = @([ordered]@{ '@odata.type' = '#microsoft.graph.removeAccessApplyAction' })
        $body = [ordered]@{
            displayName             = $Review.name
            descriptionForAdmins    = $admins
            descriptionForReviewers = $Review.descriptionForReviewers
            scope                   = Get-PaArScope -Review $Review
            reviewers               = @($Review.reviewers | ForEach-Object { ConvertTo-PaArReviewerScope $_ })
            fallbackReviewers       = @($(if ($Review.ContainsKey('fallbackReviewers')) { $Review.fallbackReviewers } else { @() }) | ForEach-Object { ConvertTo-PaArReviewerScope $_ })
            settings                = $settings
        }
        return [pscustomobject]@{ Api = 'graph'; Name = $Review.name; Body = $body; Review = $Review }
    }
    # Azure role, Resource Manager 2021-12-01-preview. Reviewers are principal IDs of users or
    # service principals; a group can't be a reviewer here.
    $settings['recurrence'] = [ordered]@{
        pattern = [ordered]@{ type = 'absoluteMonthly'; interval = $interval }
        range   = [ordered]@{ type = 'noEnd'; startDate = $start.ToString('yyyy-MM-ddT00:00:00Z') }
    }
    $sub = $Review.subscriptionId
    $toArm = { param($e) if ($e.ContainsKey('user')) { [ordered]@{ principalId = $e.user; principalType = 'user' } } else { [ordered]@{ principalId = $e.group; principalType = 'group' } } }
    $body = [ordered]@{
        displayName             = $Review.name
        descriptionForAdmins    = $admins
        descriptionForReviewers = $Review.descriptionForReviewers
        reviewers               = @($Review.reviewers | ForEach-Object { & $toArm $_ })
        backupReviewers         = @($(if ($Review.ContainsKey('fallbackReviewers')) { $Review.fallbackReviewers } else { @() }) | ForEach-Object { & $toArm $_ })
        reviewersType           = 'Assigned'
        scope                   = [ordered]@{
            resourceId       = "/subscriptions/$sub"
            roleDefinitionId = "/subscriptions/$sub/providers/Microsoft.Authorization/roleDefinitions/$($Review.roleDefinitionId)"
            principalType    = 'user'
            assignmentState  = $(if ($Review.ContainsKey('assignments') -and $Review.assignments -eq 'active') { 'active' } else { 'eligible' })
        }
        settings                = $settings
    }
    [pscustomobject]@{ Api = 'arm'; Name = $Review.name; Body = $body; Review = $Review; SubscriptionId = $sub; DefinitionId = (Get-PaArStableId $Review.name) }
}

function Get-PaArStableId {
    <# A stable GUID for a Resource Manager definition, from its name, so a rerun PUTs the same resource. #>
    param([Parameter(Mandatory)][string]$Name)
    $md5 = [Security.Cryptography.MD5]::Create()
    try { [guid]::new($md5.ComputeHash([Text.Encoding]::UTF8.GetBytes("pa-ch07:$Name"))).ToString() } finally { $md5.Dispose() }
}

# ----------------------------------------------------------------------------- the rules

function New-PaArFinding { param($Rule, $Severity, $Object, $Message) [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Object = $Object; Message = $Message } }

function Get-PaArScopeFacts {
    <# What a Graph or Resource Manager scope covers: the role or group, and whether active and eligible assignments are in it. #>
    param($Body, [string]$Api)
    if ($Api -eq 'arm') {
        $s = $Body.scope
        return [pscustomobject]@{ RoleTemplateId = ([string]$s.roleDefinitionId -replace '^.*/', ''); GroupId = $null; Active = ($s.assignmentState -eq 'active'); Eligible = ($s.assignmentState -eq 'eligible'); RoleCount = 1 }
    }
    $s = $Body.scope
    $queries = @(if ($s.Contains('resourceScopes')) { $s.resourceScopes | ForEach-Object { $_.query } } elseif ($s.Contains('query')) { $s.query })
    $role = $null; $group = $null; $active = $false; $eligible = $false
    foreach ($qq in $queries) {
        $qs = ([string]$qq -replace '^/(v1\.0|beta)', '')
        if ($qs -match '^/roleManagement/directory/roleDefinitions/([0-9a-fA-F-]{36})$') { $role = $Matches[1]; $active = $true; $eligible = $true }
        elseif ($qs -match "^/roleManagement/directory/roleEligibilityScheduleInstances.*roleDefinitionId eq '([0-9a-fA-F-]{36})'") { $role = $Matches[1]; $eligible = $true }
        elseif ($qs -match "^/roleManagement/directory/roleAssignmentScheduleInstances.*roleDefinitionId eq '([0-9a-fA-F-]{36})'") { $role = $Matches[1]; $active = $true }
        elseif ($qs -match '^/groups/([0-9a-fA-F-]{36})/(transitiveMembers|members)') { $group = $Matches[1]; $active = $true; $eligible = $true }
    }
    [pscustomobject]@{ RoleTemplateId = $role; GroupId = $group; Active = $active; Eligible = $eligible; RoleCount = $queries.Count }
}

function Test-PaArDefinition {
    <#
    .SYNOPSIS
        Check one definition body against Learn's rules and the program's (PA-AR-01 to PA-AR-11).
        Works on the bodies this module builds and on any Graph body, including Learn's sample.
        -Tier and -Cadence come from the reviewed JSON; without them the tier rules are skipped.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Body,
        [ValidateSet('graph', 'arm')][string]$Api = 'graph',
        [string]$Name,
        [string]$Tier,
        [string[]]$ProtectedRoleTemplateIds = @('62e90394-69f5-4237-9190-012177145e10'),
        [datetime]$AsOf = [datetime]::UtcNow
    )
    if (-not $Name) { $Name = [string]$Body.displayName }
    $f = [Collections.Generic.List[object]]::new()
    $get = { param($h, $k) if ($h -is [Collections.IDictionary] -and $h.Contains($k)) { $h[$k] } else { $null } }
    $s = & $get $Body 'settings'
    $reviewers = @(& $get $Body 'reviewers' | Where-Object { $null -ne $_ })
    $fallback = @($(if ($Api -eq 'arm') { & $get $Body 'backupReviewers' } else { & $get $Body 'fallbackReviewers' }) | Where-Object { $null -ne $_ })

    if ($reviewers.Count -eq 0) { $f.Add((New-PaArFinding 'PA-AR-01' 'Finding' $Name 'No reviewers: Graph treats an empty reviewers list as a self-review, and the program never lets assignees review themselves')) }
    if ($fallback.Count -eq 0) { $f.Add((New-PaArFinding 'PA-AR-02' 'Finding' $Name 'No fallback reviewers')) }
    $dfr = [string](& $get $Body 'descriptionForReviewers')
    if (-not $dfr) { $f.Add((New-PaArFinding 'PA-AR-03' 'Finding' $Name 'descriptionForReviewers is missing; the create API marks it required')) }
    elseif ($dfr.Length -gt 256) { $f.Add((New-PaArFinding 'PA-AR-03' 'Finding' $Name "descriptionForReviewers is $($dfr.Length) characters; email notifications support up to 256")) }

    $days = [int](& $get $s 'instanceDurationInDays')
    $pattern = & $get (& $get $s 'recurrence') 'pattern'
    $ptype = [string](& $get $pattern 'type'); $pint = [int](& $get $pattern 'interval')
    if ($days -lt 1) { $f.Add((New-PaArFinding 'PA-AR-04' 'Finding' $Name 'instanceDurationInDays must be at least 1')) }
    elseif ($ptype -eq 'absoluteMonthly' -and $pint -eq 1 -and $days -gt 27) { $f.Add((New-PaArFinding 'PA-AR-04' 'Finding' $Name "A monthly review can last at most 27 days; this one is $days")) }
    elseif ($ptype -eq 'weekly' -and $days -gt 7) { $f.Add((New-PaArFinding 'PA-AR-04' 'Finding' $Name "A weekly review can last at most 7 days; this one is $days")) }

    $auto = [bool](& $get $s 'autoApplyDecisionsEnabled')
    if (-not $auto) { $f.Add((New-PaArFinding 'PA-AR-05' 'Finding' $Name 'autoApplyDecisionsEnabled is off (the API default): denials stay in place until someone applies them by hand')) }

    $ddOn = [bool](& $get $s 'defaultDecisionEnabled'); $dd = [string](& $get $s 'defaultDecision')
    $facts = Get-PaArScopeFacts -Body $Body -Api $Api
    $protected = $facts.RoleTemplateId -and ($ProtectedRoleTemplateIds -contains $facts.RoleTemplateId)
    if ($protected -and $facts.Active -and $ddOn -and $dd -in 'Deny', 'Recommendation') {
        $f.Add((New-PaArFinding 'PA-AR-06' 'Finding' $Name "Lockout: no-response default '$dd' on a scope with active assignments of a role the emergency access accounts hold permanently; a silent review would remove them"))
    } elseif (-not ($ddOn -and $dd -eq 'Deny')) {
        if ($protected -and $facts.Active) { $f.Add((New-PaArFinding 'PA-AR-07' 'Info' $Name 'No-response default is not Deny, on purpose: this scope holds the emergency access accounts; unreviewed items are findings in the evidence')) }
        else { $f.Add((New-PaArFinding 'PA-AR-07' 'Warn' $Name "No-response default is '$(if ($ddOn) { $dd } else { 'None (no change)' })', not Deny (remove access), which the program's cadence sets for privileged access")) }
    }

    if (-not [bool](& $get $s 'justificationRequiredOnApproval')) { $f.Add((New-PaArFinding 'PA-AR-08' 'Finding' $Name 'justificationRequiredOnApproval is off')) }

    if ($Tier) {
        $want = if ($Tier -eq 'T0') { 1 } else { 3 }
        if (-not ($ptype -eq 'absoluteMonthly' -and $pint -eq $want)) {
            $f.Add((New-PaArFinding 'PA-AR-09' 'Finding' $Name "Tier $Tier is reviewed $(if ($want -eq 1) { 'monthly' } else { 'quarterly' }); this series recurs $ptype every $pint"))
        }
    }

    $sd = [string](& $get (& $get (& $get $s 'recurrence') 'range') 'startDate')
    if ($sd) {
        $start = [datetime]::Parse($sd.Substring(0, 10), [Globalization.CultureInfo]::InvariantCulture)
        if ($start -lt $AsOf.Date) { $f.Add((New-PaArFinding 'PA-AR-10' 'Warn' $Name "startDate $($start.ToString('yyyy-MM-dd')) is in the past: the first instance starts as soon as the definition is created")) }
    }

    if ($Api -eq 'arm') {
        foreach ($rv in @($reviewers) + @($fallback)) {
            if ([string]$rv.principalType -notin 'user', 'servicePrincipal') { $f.Add((New-PaArFinding 'PA-AR-11' 'Finding' $Name "Reviewer $($rv.principalId) is a $($rv.principalType): the Resource Manager API takes only users and service principals as reviewers")) }
        }
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the diff

function ConvertTo-PaArComparable {
    # Normalize for comparison: strip /v1.0 or /beta from queries, and JSON-round-trip.
    param($Value)
    if ($null -eq $Value) { return $null }
    $j = $Value | ConvertTo-Json -Depth 30 -Compress
    $j = [regex]::Replace($j, '"query":"/(v1\.0|beta)/', '"query":"/')
    $j | ConvertFrom-Json -AsHashtable -Depth 30
}

function Compare-PaArSubset {
    <# Paths where -Desired differs from -Live, looking only at what -Desired sets. #>
    param($Desired, $Live, [string]$Path = '')
    $out = [Collections.Generic.List[string]]::new()
    if ($Desired -is [Collections.IDictionary]) {
        if ($Live -isnot [Collections.IDictionary]) { return $Path.TrimStart('.') }
        foreach ($k in $Desired.Keys) {
            $lv = if ($Live.Contains($k)) { $Live[$k] } else { $null }
            foreach ($p in @(Compare-PaArSubset -Desired $Desired[$k] -Live $lv -Path "$Path.$k")) { $out.Add($p) }
        }
    } elseif ($Desired -is [Collections.IList] -and $Desired -isnot [string]) {
        $d = @($Desired | ForEach-Object { $_ | ConvertTo-Json -Depth 30 -Compress } | Sort-Object)
        $l = @(@($Live) | Where-Object { $null -ne $_ } | ForEach-Object { $_ | ConvertTo-Json -Depth 30 -Compress } | Sort-Object)
        if (($d -join "`n") -ne ($l -join "`n")) { $out.Add($Path.TrimStart('.')) }
    } else {
        if ([string]$Desired -ne [string]$Live) { $out.Add($Path.TrimStart('.')) }
    }
    $out.ToArray()
}

function Get-PaArPlan {
    <#
    .SYNOPSIS
        The dry run: build every body from the reviewed JSON, check it, read what the tenant holds
        (GET only) and say for each series what -Apply would do: Create, Update, Replace (scope or
        group reviewers changed, which the update API can't change), NoChange, or Unmanaged (in the
        tenant with the managed prefix but not in the JSON; never deleted). Writes nothing.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)]$Config, [datetime]$AsOf = [datetime]::UtcNow)
    $findings = [Collections.Generic.List[object]]::new()
    $items = [Collections.Generic.List[object]]::new()
    $built = @($Config.reviews | ForEach-Object { New-PaArDefinitionBody -Review $_ -Config $Config })
    foreach ($b in $built) {
        foreach ($x in (Test-PaArDefinition -Body $b.Body -Api $b.Api -Name $b.Name -Tier $b.Review.tier -ProtectedRoleTemplateIds $Config.protectedRoleTemplateIds -AsOf $AsOf)) { $findings.Add($x) }
    }

    $live = @(Invoke-PaArList -Client $Client -CallId 'ar-definitions-list')
    $byName = @{}
    foreach ($d in $live) { $n = [string]$d.displayName; if (-not $byName.ContainsKey($n)) { $byName[$n] = [Collections.Generic.List[object]]::new() }; $byName[$n].Add($d) }
    $armLive = @{}
    foreach ($sub in @($built | Where-Object Api -EQ 'arm' | ForEach-Object SubscriptionId | Sort-Object -Unique)) {
        $armLive[$sub] = @(Invoke-PaArList -Client $Client -CallId 'azure-ar-definitions-list' -Bind @{ subscriptionId = $sub })
    }

    foreach ($b in $built) {
        if ($b.Api -eq 'graph') {
            $m = @(if ($byName.ContainsKey($b.Name)) { $byName[$b.Name] })
            if ($m.Count -gt 1) {
                $findings.Add((New-PaArFinding 'PA-AR-12' 'Finding' $b.Name "$($m.Count) definitions in the tenant share this name; resolve by hand before -Apply"))
                $items.Add([pscustomobject]@{ Name = $b.Name; Api = 'graph'; Action = 'Conflict'; Id = $null; Changes = @(); Body = $b.Body }); continue
            }
            if ($m.Count -eq 0) { $items.Add([pscustomobject]@{ Name = $b.Name; Api = 'graph'; Action = 'Create'; Id = $null; Changes = @(); Body = $b.Body }); continue }
            $l = ConvertTo-PaArComparable $m[0]
            $changes = @(Compare-PaArSubset -Desired (ConvertTo-PaArComparable $b.Body) -Live $l)
            $liveGroupReviewers = @(@($l['reviewers']) | Where-Object { $_ -and $_['query'] -notmatch '^/users/' })
            $action = if ($changes.Count -eq 0) { 'NoChange' }
                elseif (@($changes | Where-Object { $_ -like 'scope*' }).Count -gt 0) { 'Replace' }
                elseif (@($changes | Where-Object { $_ -like 'reviewers*' }).Count -gt 0 -and $liveGroupReviewers.Count -gt 0) { 'Replace' }
                else { 'Update' }
            $items.Add([pscustomobject]@{ Name = $b.Name; Api = 'graph'; Action = $action; Id = $m[0].id; Changes = $changes; Body = $b.Body })
        } else {
            $m = @($armLive[$b.SubscriptionId] | Where-Object { $_.name -eq $b.DefinitionId -or ($_.ContainsKey('properties') -and $_.properties.displayName -eq $b.Name) })
            if ($m.Count -eq 0) { $items.Add([pscustomobject]@{ Name = $b.Name; Api = 'arm'; Action = 'Create'; Id = $b.DefinitionId; SubscriptionId = $b.SubscriptionId; Changes = @(); Body = $b.Body }); continue }
            $changes = @(Compare-PaArSubset -Desired (ConvertTo-PaArComparable $b.Body) -Live (ConvertTo-PaArComparable $m[0].properties))
            $items.Add([pscustomobject]@{ Name = $b.Name; Api = 'arm'; Action = $(if ($changes.Count) { 'Update' } else { 'NoChange' }); Id = $m[0].name; SubscriptionId = $b.SubscriptionId; Changes = $changes; Body = $b.Body })
        }
    }
    $wanted = @($built | ForEach-Object Name)
    foreach ($d in $live) {
        if (([string]$d.displayName).StartsWith($Config.namePrefix) -and $wanted -notcontains $d.displayName) {
            $items.Add([pscustomobject]@{ Name = $d.displayName; Api = 'graph'; Action = 'Unmanaged'; Id = $d.id; Changes = @(); Body = $null })
            $findings.Add((New-PaArFinding 'PA-AR-13' 'Warn' $d.displayName 'In the tenant with the managed prefix but not in the reviewed JSON; the code never deletes, so remove it by hand or add it to the JSON'))
        }
    }
    [pscustomobject]@{ Items = $items.ToArray(); Findings = $findings.ToArray(); Evidence = $Client.Evidence }
}

function Invoke-PaArApply {
    <#
    .SYNOPSIS
        Carry out a plan. Without -Apply, returns what would be sent and sends nothing. With
        -Apply: refuses if the plan has any Finding; POSTs Create and PUTs Update for Graph; PUTs
        Azure (preview) only with -IncludePreview; never deletes, so Replace and Conflict are left
        for a person. Each write is followed by a read-back.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)]$Plan, [switch]$Apply, [switch]$IncludePreview)
    $results = [Collections.Generic.List[object]]::new()
    $blocking = @($Plan.Findings | Where-Object Severity -EQ 'Finding')
    if ($Apply) {
        if ($Client.Task -ne 'access-reviews-apply') { throw "-Apply needs a client for task access-reviews-apply, not '$($Client.Task)'" }
        if ($blocking.Count -gt 0) { throw "Refusing -Apply: the plan has $($blocking.Count) Finding(s): $((@($blocking | ForEach-Object { "$($_.Rule) $($_.Object)" }) | Sort-Object -Unique) -join '; ')" }
    }
    foreach ($i in $Plan.Items) {
        $r = [pscustomobject]@{ Name = $i.Name; Api = $i.Api; Action = $i.Action; Result = 'NotSent'; Note = '' }
        switch ($i.Action) {
            { $_ -in 'NoChange' } { $r.Result = 'Skipped'; $r.Note = 'matches the tenant' }
            { $_ -in 'Unmanaged' } { $r.Result = 'Skipped'; $r.Note = 'not in the reviewed JSON; never deleted' }
            { $_ -in 'Replace', 'Conflict' } { $r.Result = 'Skipped'; $r.Note = 'needs a person: export its evidence, delete it in the portal, rerun' }
            { $_ -in 'Create', 'Update' } {
                if ($i.Api -eq 'arm' -and -not $IncludePreview) { $r.Result = 'Skipped'; $r.Note = 'Azure role reviews use a preview API; pass -IncludePreview'; break }
                if (-not $Apply) { $r.Result = 'DryRun'; $r.Note = 'would send'; break }
                if ($i.Api -eq 'graph' -and $i.Action -eq 'Create') { $null = Invoke-PaArWrite -Client $Client -CallId 'ar-definition-create' -Body $i.Body }
                elseif ($i.Api -eq 'graph') { $b = [ordered]@{ id = $i.Id }; foreach ($k in $i.Body.Keys) { $b[$k] = $i.Body[$k] }; $null = Invoke-PaArWrite -Client $Client -CallId 'ar-definition-update' -Bind @{ definitionId = $i.Id } -Body $b }
                else { $null = Invoke-PaArWrite -Client $Client -CallId 'azure-ar-definition-put' -Bind @{ subscriptionId = $i.SubscriptionId; definitionId = $i.Id } -Body $i.Body }
                $r.Result = 'Sent'
            }
        }
        $results.Add($r)
    }
    if ($Apply) {
        # Read back: every sent Graph series must now exist under its name.
        $after = @(Invoke-PaArList -Client $Client -CallId 'ar-definitions-list')
        foreach ($r in $results | Where-Object { $_.Result -eq 'Sent' -and $_.Api -eq 'graph' }) {
            $r.Note = if (@($after | Where-Object { $_.displayName -eq $r.Name }).Count -eq 1) { 'read back' } else { 'NOT found on read-back' }
        }
    }
    $results.ToArray()
}

# ----------------------------------------------------------------------------- the evidence

function ConvertTo-PaArDecisionRow {
    # One row per decision, the same columns for Graph and Resource Manager decisions.
    param($Review, [string]$Api, $Instance, $Decision)
    $g = { param($h, [string[]]$path) $v = $h; foreach ($p in $path) { if ($v -is [Collections.IDictionary] -and $v.Contains($p)) { $v = $v[$p] } else { return $null } }; $v }
    if ($Api -eq 'graph') {
        $inst = $Instance; $d = $Decision
        $principalType = [string](& $g $d 'principal', '@odata.type') -replace '^#microsoft\.graph\.', ''
        if (-not $principalType) { $principalType = [string](& $g $d 'principal', 'type') }
        [pscustomobject][ordered]@{
            Review = $Review.name; Tier = $Review.tier; Api = 'graph'
            InstanceId = $inst.id; InstanceStatus = $inst.status; InstanceStart = $inst.startDateTime; InstanceEnd = $inst.endDateTime
            DecisionId = $d.id; PrincipalId = (& $g $d 'principal', 'id'); PrincipalType = $principalType; PrincipalName = (& $g $d 'principal', 'displayName')
            Decision = $d.decision; Recommendation = (& $g $d 'recommendation'); Justification = (& $g $d 'justification')
            ReviewedById = (& $g $d 'reviewedBy', 'id'); ReviewedDateTime = (& $g $d 'reviewedDateTime')
            ApplyResult = (& $g $d 'applyResult'); AppliedDateTime = (& $g $d 'appliedDateTime')
        }
    } else {
        $ip = $Instance.properties; $dp = $Decision.properties
        [pscustomobject][ordered]@{
            Review = $Review.name; Tier = $Review.tier; Api = 'arm'
            InstanceId = $Instance.name; InstanceStatus = $ip.status; InstanceStart = $ip.startDateTime; InstanceEnd = $ip.endDateTime
            DecisionId = $Decision.name; PrincipalId = (& $g $dp 'principal', 'id'); PrincipalType = (& $g $dp 'principal', 'type'); PrincipalName = (& $g $dp 'principal', 'displayName')
            Decision = $dp.decision; Recommendation = (& $g $dp 'recommendation'); Justification = (& $g $dp 'justification')
            ReviewedById = (& $g $dp 'reviewedBy', 'principalId'); ReviewedDateTime = (& $g $dp 'reviewedDateTime')
            ApplyResult = (& $g $dp 'applyResult'); AppliedDateTime = (& $g $dp 'appliedDateTime')
        }
    }
}

function Get-PaArEvidence {
    <#
    .SYNOPSIS
        Read back what the reviews decided (GET only): each configured series, its instances and
        every decision, as rows; and the findings an ISSO checks (PA-AR-E01 to PA-AR-E08).
    .OUTPUTS
        @{ Rows; Instances; Findings; Evidence }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client,
        [Parameter(Mandatory)]$Config,
        [datetime]$AsOf = [datetime]::UtcNow,
        [int]$BulkCount = 5,
        [int]$BulkMinutes = 5
    )
    $rows = [Collections.Generic.List[object]]::new()
    $instances = [Collections.Generic.List[object]]::new()
    $f = [Collections.Generic.List[object]]::new()
    $closed = @('Completed', 'Applied', 'AutoReviewed')
    $graphDefs = @(Invoke-PaArList -Client $Client -CallId 'ar-definitions-list')
    $armDefs = @{}
    foreach ($r in $Config.reviews) {
        $insts = @(); $api = if ($r.kind -eq 'azureRole') { 'arm' } else { 'graph' }
        if ($api -eq 'graph') {
            $d = @($graphDefs | Where-Object { $_.displayName -eq $r.name })
            if ($d.Count -eq 0) { $f.Add((New-PaArFinding 'PA-AR-E01' 'Finding' $r.name 'Configured review series not found in the tenant')); continue }
            $insts = @(Invoke-PaArList -Client $Client -CallId 'ar-instances-list' -Bind @{ definitionId = $d[0].id })
            foreach ($i in $insts) {
                $instances.Add([pscustomobject]@{ Review = $r.name; Api = 'graph'; Id = $i.id; Status = $i.status; Start = $i.startDateTime; End = $i.endDateTime })
                foreach ($x in (Invoke-PaArList -Client $Client -CallId 'ar-decisions-list' -Bind @{ definitionId = $d[0].id; instanceId = $i.id } -Top 100)) { $rows.Add((ConvertTo-PaArDecisionRow $r 'graph' $i $x)) }
            }
        } else {
            $sub = $r.subscriptionId
            if (-not $armDefs.ContainsKey($sub)) { $armDefs[$sub] = @(Invoke-PaArList -Client $Client -CallId 'azure-ar-definitions-list' -Bind @{ subscriptionId = $sub }) }
            $id = Get-PaArStableId $r.name
            $d = @($armDefs[$sub] | Where-Object { $_.name -eq $id -or $_.properties.displayName -eq $r.name })
            if ($d.Count -eq 0) { $f.Add((New-PaArFinding 'PA-AR-E01' 'Finding' $r.name 'Configured review series not found in the subscription')); continue }
            $insts = @(Invoke-PaArList -Client $Client -CallId 'azure-ar-instances-list' -Bind @{ subscriptionId = $sub; definitionId = $d[0].name })
            foreach ($i in $insts) {
                $instances.Add([pscustomobject]@{ Review = $r.name; Api = 'arm'; Id = $i.name; Status = $i.properties.status; Start = $i.properties.startDateTime; End = $i.properties.endDateTime })
                foreach ($x in (Invoke-PaArList -Client $Client -CallId 'azure-ar-decisions-list' -Bind @{ subscriptionId = $sub; definitionId = $d[0].name; instanceId = $i.name })) { $rows.Add((ConvertTo-PaArDecisionRow $r 'arm' $i $x)) }
            }
        }
        # PA-AR-E02: a closed instance within the cadence window.
        $window = if ($r.cadence -eq 'monthly') { 35 } else { 100 }
        $ends = @($instances | Where-Object { $_.Review -eq $r.name -and $_.Status -in $closed -and $_.End } | ForEach-Object { [datetime]::Parse([string]$_.End, [Globalization.CultureInfo]::InvariantCulture).ToUniversalTime() } | Sort-Object -Descending)
        if ($ends.Count -eq 0) { $f.Add((New-PaArFinding 'PA-AR-E02' 'Finding' $r.name 'No closed instance yet: no review of this series has finished')) }
        elseif (($AsOf - $ends[0]).TotalDays -gt $window) { $f.Add((New-PaArFinding 'PA-AR-E02' 'Finding' $r.name "Last closed instance ended $($ends[0].ToString('yyyy-MM-dd')), more than $window days before $($AsOf.ToString('yyyy-MM-dd')) for a $($r.cadence) series")) }
    }

    $emergency = @($Config.emergencyAccountIds)
    foreach ($x in $rows) {
        $isClosed = $x.InstanceStatus -in $closed
        $who = "$($x.Review) / $(if ($x.PrincipalName) { $x.PrincipalName } else { $x.PrincipalId })"
        if ($x.Decision -eq 'Deny' -and $isClosed -and $x.ApplyResult -notin 'AppliedSuccessfully', 'AppliedSuccessfullyButObjectNotFound') {
            $f.Add((New-PaArFinding 'PA-AR-E03' 'Finding' $who "Denied, but the apply result is '$($x.ApplyResult)': the access may still be in place"))
        }
        if ($x.Decision -eq 'NotReviewed' -and $isClosed) {
            $f.Add((New-PaArFinding 'PA-AR-E04' $(if ($x.Tier -eq 'T0') { 'Finding' } else { 'Warn' }) $who 'Not reviewed: the no-response default decided it'))
        }
        if ($x.Decision -eq 'Approve' -and -not $x.Justification) { $f.Add((New-PaArFinding 'PA-AR-E05' 'Finding' $who 'Approved without a justification')) }
        if ($x.ReviewedById -and $x.ReviewedById -ne $script:EmptyGuid -and $x.ReviewedById -eq $x.PrincipalId) { $f.Add((New-PaArFinding 'PA-AR-E06' 'Finding' $who 'The principal reviewed their own access')) }
        if ($x.Decision -eq 'Deny' -and $emergency -contains $x.PrincipalId) { $f.Add((New-PaArFinding 'PA-AR-E08' 'Finding' $who 'An emergency access account was denied: check it still holds Global Administrator (Chapter 02, PA-EA-05) now')) }
    }
    # PA-AR-E07: one reviewer, many identical decisions within a few minutes (Design guidance).
    $reviewed = @($rows | Where-Object { $_.ReviewedById -and $_.ReviewedById -ne $script:EmptyGuid -and $_.ReviewedDateTime -and $_.Decision -in 'Approve', 'Deny' })
    foreach ($grp in ($reviewed | Group-Object Review, InstanceId, ReviewedById, Decision)) {
        $times = @($grp.Group | ForEach-Object { [datetime]::Parse([string]$_.ReviewedDateTime, [Globalization.CultureInfo]::InvariantCulture).ToUniversalTime() } | Sort-Object)
        for ($i = 0; $i + $BulkCount - 1 -lt $times.Count; $i++) {
            if (($times[$i + $BulkCount - 1] - $times[$i]).TotalMinutes -le $BulkMinutes) {
                $g0 = $grp.Group[0]
                $f.Add((New-PaArFinding 'PA-AR-E07' 'Warn' "$($g0.Review) / reviewer $($g0.ReviewedById)" "$($times.Count) '$($g0.Decision)' decisions, $BulkCount of them within $BulkMinutes minutes: check they were read one by one"))
                break
            }
        }
    }
    [pscustomobject]@{ Rows = $rows.ToArray(); Instances = $instances.ToArray(); Findings = $f.ToArray(); Evidence = $Client.Evidence }
}

# ----------------------------------------------------------------------------- output

function Write-PaArJson {
    param([string]$Path, $Value)
    $json = $Value | ConvertTo-Json -Depth 30
    [IO.File]::WriteAllText($Path, ($json -replace "`r`n", "`n") + "`n", [Text.UTF8Encoding]::new($false))
}

function Export-PaArRun {
    <#
    .SYNOPSIS
        Write a run's files and a manifest: the SHA-256 of each file, the cloud, the mode, the
        task's permissions and every request sent (method and URI), for the ISSO.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][ValidateSet('access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence')][string]$Task,
        [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud,
        [object[]]$Evidence = @(),
        [string]$Mode = 'Fixture',
        [string]$TenantId
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        New-Item -ItemType Directory -Force -Path (Split-Path $p) | Out-Null
        $v = $Files[$name]
        if ($name.EndsWith('.csv')) {
            $csv = (@($v) | ConvertTo-Csv -NoTypeInformation) -join "`n"
            [IO.File]::WriteAllText($p, $csv + "`n", [Text.UTF8Encoding]::new($false))
        } else { Write-PaArJson -Path $p -Value $v }
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $perm = Get-PaArRequiredPermission -Task $Task
    Write-PaArJson -Path (Join-Path $OutputPath 'manifest.json') -Value ([ordered]@{
            task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId
            generated = [DateTime]::UtcNow.ToString('o')
            graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles
            requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; at = $_.At } })
            files = $hashes
        })
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-PaArCall, Get-PaArRequiredPermission, New-PaArClient, Invoke-PaArList, New-PaArLiveInvoker,
    New-PaArFake, Invoke-PaArFake, Read-PaArConfig, Get-PaArScope, New-PaArDefinitionBody, Get-PaArStableId, Get-PaArScopeFacts,
    Test-PaArDefinition, Compare-PaArSubset, ConvertTo-PaArComparable, Get-PaArPlan, Invoke-PaArApply, Get-PaArEvidence, Export-PaArRun
