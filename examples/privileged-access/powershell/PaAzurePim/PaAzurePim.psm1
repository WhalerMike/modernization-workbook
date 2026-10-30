#Requires -Version 7.1
<#
    PaAzurePim: Chapter 06 of the developer workbook "Building Privileged Access".

    PIM for Azure resources through the Resource Manager API (Microsoft.Authorization, 2020-10-01):
    read the role assignment and eligibility schedules and the role management policies at each
    management group, subscription and resource group scope; compare them with a reviewed desired
    state; find standing Owner, Contributor and User Access Administrator; and plan the requests
    that make them eligible and set each role's PIM policy. A plan is a dry run. Nothing is sent
    to a tenant unless Invoke-PaAzPlan is called with -Apply.

    It builds on Chapter 01's module, PrivilegedAccess, which it imports and never edits: the cloud
    table (Get-PaCloud), the tier map and Azure placements (Get-PaTierMap, Get-PaAzureTier), and the
    paged, host-checked reader (Invoke-PaList), which this module drives with its own call list,
    config/calls-ch06.json. Illustrative: tested against fixtures and a fake, not a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../PrivilegedAccess/PrivilegedAccess.psm1') -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:ApiVersion = '2020-10-01'
$script:Tasks = @('azure-pim-read', 'azure-pim-apply')
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
$script:Owner = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635'
$script:Contributor = 'b24988ac-6180-42a0-ab88-20f7382dd24c'
$script:UserAccessAdmin = '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9'

# ----------------------------------------------------------------------------- calls and client

function Get-PaAzCall {
    <# The Chapter 06 call list, optionally for one task. #>
    [CmdletBinding()]
    param([ValidateSet('azure-pim-read', 'azure-pim-apply')][string]$Task)
    $all = @((Get-Content -LiteralPath (Join-Path $script:ConfigRoot 'calls-ch06.json') -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    , $all
}

function Get-PaAzRequiredRole {
    <# The union of the Azure roles a task's calls need, and the calls that need each. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('azure-pim-read', 'azure-pim-apply')][string]$Task)
    $calls = Get-PaAzCall -Task $Task
    [pscustomobject]@{
        Task       = $Task
        AzureRoles = @($calls | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
        Writes     = @($calls | Where-Object { $_.method -ne 'GET' } | ForEach-Object { "$($_.method) $($_.id)" })
    }
}

function New-PaAzClient {
    <#
    .SYNOPSIS
        A Resource Manager client for one Chapter 06 task in one cloud. Its shape is Chapter 01's
        reader, so Invoke-PaList pages and host-checks its GETs; Invoke-PaAzWrite sends its writes.
        -Invoke is { param($Method, $Uri, $Body) } returning the parsed body as a hashtable:
        New-PaAzFixtureInvoker for labs and tests, New-PaAzLiveInvoker for a real run.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][ValidateSet('azure-pim-read', 'azure-pim-apply')][string]$Task,
        [Parameter(Mandatory)][scriptblock]$Invoke
    )
    [pscustomobject]@{
        Cloud    = Get-PaCloud -Cloud $Cloud
        Task     = $Task
        Calls    = Get-PaAzCall -Task $Task
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function ConvertTo-PaAzScope {
    <# '/subscriptions/x/' -> '/subscriptions/x'. Refuses anything that isn't an ARM scope. #>
    param([Parameter(Mandatory)][string]$Scope)
    $s = $Scope.Trim()
    if ($s -ne '/') { $s = $s.TrimEnd('/') }
    if ($s -ne '/' -and $s -notmatch '^/(subscriptions/[^/]+(/resourceGroups/[^/]+)?|providers/Microsoft\.Management/managementGroups/[^/]+)$') {
        throw "'$Scope' isn't a management group, subscription or resource group scope"
    }
    $s
}

function Test-PaAzSameScope { param([string]$A, [string]$B) [string]::Equals($A.TrimEnd('/'), $B.TrimEnd('/'), [StringComparison]::OrdinalIgnoreCase) }

function Invoke-PaAzWrite {
    <#
    .SYNOPSIS
        Build one write (PUT or PATCH) for a declared call. Without -Apply it only returns the
        request. With -Apply it checks the host and sends it through the client's invoker.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client,
        [Parameter(Mandatory)][string]$CallId,
        [Parameter(Mandatory)][hashtable]$Bind,
        [Parameter(Mandatory)]$Body,
        [switch]$Apply
    )
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch06.json with its role." }
    if ($call.method -notin 'PUT', 'PATCH') { throw "'$CallId' isn't a write." }
    if ($Bind.ContainsKey('name') -and $Bind['name'] -notmatch $script:Guid) { throw "Request name '$($Bind['name'])' isn't a GUID" }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [string]$Bind[$k]) }
    if ($path -match '\{[a-z]+\}') { throw "Unbound placeholder in $path" }
    $uri = "$($Client.Cloud.Arm)$path`?api-version=$($call.apiVersion)"
    $request = [pscustomobject]@{ Call = $CallId; Method = $call.method; Uri = $uri; Body = $Body; Sent = $false; Response = $null }
    if ($Apply) {
        if (-not $uri.StartsWith("$($Client.Cloud.Arm)/", [StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to send the token to $uri" }
        $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $call.method; Uri = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $request.Response = & $Client.Invoke $call.method $uri $Body
        $request.Sent = $true
    }
    $request
}

# ----------------------------------------------------------------------------- invokers

function New-PaAzLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: Invoke-AzRestMethod for GET, PUT and PATCH. It refuses to run if the Az
        session is signed in to another cloud. Sign in first: Connect-AzAccount -Environment
        <AzureEnvironment>, as an identity holding the task's roles (Get-PaAzRequiredRole).
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    $c = Get-PaCloud -Cloud $Cloud
    $az = Get-AzContext
    if (-not $az) { throw 'Not signed in to Azure.' }
    if ($az.Environment.Name -ne $c.AzureEnvironment) { throw "Azure session is in '$($az.Environment.Name)', not '$($c.AzureEnvironment)'." }
    $arm = $c.Arm
    {
        param($Method, $Uri, $Body)
        if ($Method -notin 'GET', 'PUT', 'PATCH') { throw "Refusing $Method" }
        if (-not $Uri.StartsWith("$arm/")) { throw "Refusing $Uri" }
        $a = @{ Method = $Method; Uri = $Uri }
        if ($null -ne $Body) { $a.Payload = ($Body | ConvertTo-Json -Depth 30 -Compress) }
        $resp = Invoke-AzRestMethod @a
        if ($resp.StatusCode -ge 400) { throw "Resource Manager returned $($resp.StatusCode) for $Method $Uri`: $($resp.Content)" }
        if ($resp.Content) { $resp.Content | ConvertFrom-Json -AsHashtable -Depth 50 } else { @{} }
    }.GetNewClosure()
}

function New-PaAzFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Resource Manager for PIM, served from a fixture estate file. GET pages through
        schedules and policies (pages of -PageSize, nextLink on the same host). PUT and PATCH apply
        to the in-memory estate the way Learn describes: AdminAssign adds an eligibility, AdminRemove
        removes an eligibility or a standing assignment, PATCH merges policy rules by id. A request
        longer than the policy's maximum fails with ExpirationRule. Every call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [int]$PageSize = 2, [string]$Cloud = 'gcc')
    $estate = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-PaCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Estate = $estate; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Arm = $c.Arm; Invoke = $null; Now = [datetime]'2026-10-30T12:00:00Z' }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body) Invoke-PaAzFake -State $s -Method $Method -Uri $Uri -Body $Body }.GetNewClosure()
    $state
}

function Get-PaAzFakeScope {
    param($State, [string]$Scope)
    foreach ($k in @($State.Estate.scopes.Keys)) { if (Test-PaAzSameScope $k $Scope) { return $State.Estate.scopes[$k] } }
    throw "404 scope $Scope"
}

function Invoke-PaAzFake {
    param($State, [string]$Method, [string]$Uri, $Body)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
    $u = [Uri]$Uri
    $base = "$($u.Scheme)://$($u.Host)"
    if ($base -ne $State.Arm) { throw "The fake refuses host $base" }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    if ($q['api-version'] -ne $script:ApiVersion) { throw "Unexpected api-version $($q['api-version'])" }
    if ($path -notmatch '^(.*)/providers/Microsoft\.Authorization/(roleAssignmentSchedules|roleEligibilitySchedules|roleManagementPolicies|roleEligibilityScheduleRequests|roleAssignmentScheduleRequests)(/([^/]+))?$') {
        throw "The fake has no route for $path"
    }
    $scope = if ($Matches[1]) { $Matches[1] } else { '/' }
    $kind = $Matches[2]; $name = if ($Matches.ContainsKey(4)) { $Matches[4] } else { $null }
    $node = Get-PaAzFakeScope -State $State -Scope $scope

    $page = {
        param([object[]]$All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $resp = @{ value = @($All | Select-Object -Skip $skip -First $State.PageSize) }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$([Uri]::EscapeDataString($_.Key))=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $resp['nextLink'] = "$base$($u.AbsolutePath)?$rest&`$skiptoken=$($skip + $State.PageSize)"
        }
        $resp
    }

    switch ($Method) {
        'GET' {
            if ($name) { throw 'The fake lists only' }
            if ($kind -eq 'roleManagementPolicies') {
                $all = @($node.roleManagementPolicies)
                if ($q.ContainsKey('$filter')) {
                    if ($q['$filter'] -notmatch "^roleDefinitionId eq '(.+)/providers/Microsoft\.Authorization/roleDefinitions/([0-9a-fA-F-]{36})'$") { throw "The fake can't parse filter $($q['$filter'])" }
                    $pName = $node.policyFor[$Matches[2]]
                    $all = @($all | Where-Object { $_.name -eq $pName })
                }
                return & $page $all
            }
            if ($kind -in 'roleAssignmentSchedules', 'roleEligibilitySchedules') { return & $page @($node[$kind]) }
            throw "The fake doesn't list $kind"
        }
        'PUT' {
            if ($kind -notin 'roleEligibilityScheduleRequests', 'roleAssignmentScheduleRequests' -or $name -notmatch $script:Guid) { throw "The fake refuses PUT $path" }
            $p = $Body.properties
            foreach ($k in 'principalId', 'roleDefinitionId', 'requestType') { if (-not $p.Contains($k)) { throw "400 missing properties.$k" } }
            $roleGuid = ($p.roleDefinitionId -split '/')[-1]
            $match = { param($r) $r.properties.principalId -eq $p.principalId -and (($r.properties.roleDefinitionId -split '/')[-1]) -eq $roleGuid -and (Test-PaAzSameScope $r.properties.scope $scope) }
            $list = if ($kind -eq 'roleEligibilityScheduleRequests') { 'roleEligibilitySchedules' } else { 'roleAssignmentSchedules' }
            switch ($p.requestType) {
                'AdminAssign' {
                    if ($kind -ne 'roleEligibilityScheduleRequests') { throw 'The fake only assigns eligibility' }
                    $ptype = if ($State.Estate.principals.ContainsKey($p.principalId)) { $State.Estate.principals[$p.principalId] } else { 'User' }
                    if ($ptype -eq 'ServicePrincipal') { throw '400 an eligible assignment can''t be created for a service principal' }
                    if (@($node[$list] | Where-Object { & $match $_ }).Count) { throw '409 RoleAssignmentExists: The Role assignment already exists.' }
                    $exp = $p.scheduleInfo.expiration
                    $max = Get-PaAzFakeMaxEligibility -Node $node -RoleGuid $roleGuid
                    if ($max -and ($exp.type -eq 'NoExpiration' -or [Xml.XmlConvert]::ToTimeSpan($exp.duration) -gt [Xml.XmlConvert]::ToTimeSpan($max))) {
                        throw '400 RoleAssignmentRequestPolicyValidationFailed: The following policy rules failed: ["ExpirationRule"]'
                    }
                    $end = $State.Now.Add([Xml.XmlConvert]::ToTimeSpan($exp.duration)).ToString('o')
                    $node[$list] = @($node[$list]) + @(@{
                            id = "$scope/providers/Microsoft.Authorization/roleEligibilitySchedules/$name"; name = $name
                            properties = @{ scope = $scope; roleDefinitionId = $p.roleDefinitionId; principalId = $p.principalId; principalType = $ptype; memberType = 'Direct'; status = 'Provisioned'; startDateTime = $State.Now.ToString('o'); endDateTime = $end }
                        })
                }
                'AdminRemove' {
                    $before = @($node[$list]).Count
                    $node[$list] = @($node[$list] | Where-Object { -not (& $match $_) })
                    if (@($node[$list]).Count -eq $before) { throw "404 nothing to remove for $($p.principalId) at $scope" }
                }
                default { throw "The fake doesn't handle requestType $($p.requestType)" }
            }
            return @{ name = $name; properties = @{ requestType = $p.requestType; status = 'Provisioned'; scope = $scope; principalId = $p.principalId; roleDefinitionId = $p.roleDefinitionId } }
        }
        'PATCH' {
            if ($kind -ne 'roleManagementPolicies') { throw "The fake refuses PATCH $path" }
            $pol = @($node.roleManagementPolicies | Where-Object { $_.name -eq $name })
            if (-not $pol) { throw "404 policy $name" }
            foreach ($r in @($Body.properties.rules)) {
                $i = [Array]::FindIndex([object[]]$pol[0].properties.rules, [Predicate[object]] { param($x) $x.id -eq $r.id })
                if ($i -lt 0) { throw "400 unknown rule $($r.id)" }
                $pol[0].properties.rules[$i] = $r
            }
            return $pol[0]
        }
    }
    throw "The fake refuses $Method"
}

function Get-PaAzFakeMaxEligibility {
    param($Node, [string]$RoleGuid)
    $pName = $Node.policyFor[$RoleGuid]
    $pol = @($Node.roleManagementPolicies | Where-Object { $_.name -eq $pName })
    if (-not $pol) { return $null }
    $rule = @($pol[0].properties.rules | Where-Object { $_.id -eq 'Expiration_Admin_Eligibility' })
    if ($rule -and $rule[0].isExpirationRequired) { $rule[0].maximumDuration } else { $null }
}

# ----------------------------------------------------------------------------- the read

function Get-PaAzValue { param($Hash, [string]$Key) if ($Hash -is [System.Collections.IDictionary] -and $Hash.Contains($Key)) { $Hash[$Key] } else { $null } }

function ConvertTo-PaAzRow {
    <# One schedule from Resource Manager as a row. Keys on properties.roleDefinitionId, never on display names. #>
    param($Schedule, [ValidateSet('Assignment', 'Eligibility')][string]$Kind, $TierMap)
    $p = $Schedule.properties
    $roleGuid = (([string]$p.roleDefinitionId) -split '/')[-1].ToLowerInvariant()
    $end = Get-PaAzValue $p 'endDateTime'
    $linked = Get-PaAzValue $p 'linkedRoleEligibilityScheduleId'
    $state = if ($Kind -eq 'Eligibility') { if ($end) { 'Eligible' } else { 'EligiblePermanent' } }
    elseif ((Get-PaAzValue $p 'assignmentType') -eq 'Activated' -or $linked) { 'Activated' }
    elseif ($end) { 'ActiveTimeBound' } else { 'ActivePermanent' }
    $scope = ([string]$p.scope).Trim(); if ($scope -ne '/') { $scope = $scope.TrimEnd('/') }
    [pscustomobject]@{
        Kind = $Kind; Id = $Schedule.id; Scope = $scope; RoleId = $roleGuid
        RoleName = if ($TierMap.azure.ContainsKey($roleGuid)) { $TierMap.azure[$roleGuid].name } else { $roleGuid }
        Tier = Get-PaAzureTier -RoleId $roleGuid -Scope $scope -TierMap $TierMap
        State = $state; EndDateTime = $end
        PrincipalId = [string]$p.principalId; PrincipalType = [string](Get-PaAzValue $p 'principalType')
        MemberType = [string](Get-PaAzValue $p 'memberType')
    }
}

function Get-PaAzPimState {
    <#
    .SYNOPSIS
        Read, at each scope: role assignment schedules, role eligibility schedules, and the role
        management policy of each governed role ($filter=roleDefinitionId eq '{scope}/providers/
        Microsoft.Authorization/roleDefinitions/{id}', as Learn's walkthrough lists them). Schedules
        are de-duplicated by id and Inherited rows skipped, as in Chapter 01.
    .OUTPUTS
        @{ Assignments; Eligibilities; Policies; Evidence }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client,
        [Parameter(Mandatory)][string[]]$Scope,
        [string[]]$RoleId = @($script:Owner, $script:Contributor, $script:UserAccessAdmin),
        $TierMap = (Get-PaTierMap)
    )
    $seen = @{}
    $assign = [Collections.Generic.List[object]]::new()
    $elig = [Collections.Generic.List[object]]::new()
    $policies = [Collections.Generic.List[object]]::new()
    foreach ($raw in $Scope) {
        $s = ConvertTo-PaAzScope $raw
        foreach ($pair in @(@('azpim-assignment-schedules', 'Assignment', $assign), @('azpim-eligibility-schedules', 'Eligibility', $elig))) {
            foreach ($item in @(Invoke-PaList -Reader $Client -CallId $pair[0] -Bind @{ scope = $s.TrimEnd('/') })) {
                if ($seen.ContainsKey($item.id)) { continue }
                $seen[$item.id] = $true
                if ((Get-PaAzValue $item.properties 'memberType') -eq 'Inherited') { continue }
                $pair[2].Add((ConvertTo-PaAzRow -Schedule $item -Kind $pair[1] -TierMap $TierMap))
            }
        }
        foreach ($r in $RoleId) {
            $filter = "roleDefinitionId eq '$($s.TrimEnd('/'))/providers/Microsoft.Authorization/roleDefinitions/$r'"
            $found = @(Invoke-PaList -Reader $Client -CallId 'azpim-policies' -Bind @{ scope = $s.TrimEnd('/') } -Query "`$filter=$([Uri]::EscapeDataString($filter))")
            if ($found.Count -ne 1) { throw "Expected one role management policy for $r at $s, got $($found.Count)" }
            $policies.Add([pscustomobject]@{ Scope = $s; RoleId = $r; Name = $found[0].name; Id = $found[0].id; Rules = @($found[0].properties.rules) })
        }
    }
    [pscustomobject]@{ Assignments = $assign.ToArray(); Eligibilities = $elig.ToArray(); Policies = $policies.ToArray(); Evidence = $Client.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- desired state

function Read-PaAzDesiredState {
    <#
    .SYNOPSIS
        The reviewed desired state (JSON): scopes, governed roles, the control-plane subscriptions,
        per-tier PIM settings, the eligible assignments, and the standing exceptions with an owner.
        Malformed input throws; nothing is assumed.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $d = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    foreach ($k in 'scopes', 'governedRoles', 'settings', 'eligible') { if (-not $d.ContainsKey($k)) { throw "desired state: '$k' is required" } }
    $d.scopes = @($d.scopes | ForEach-Object { ConvertTo-PaAzScope $_ })
    if ($d.scopes -contains '/') { throw "desired state: root scope '/' isn't managed here; elevate access is removed, not converted" }
    foreach ($r in $d.governedRoles) { if ($r -notmatch $script:Guid) { throw "desired state: role '$r' must be a role definition ID" } }
    foreach ($t in @($d.settings.Keys)) {
        $st = $d.settings[$t]
        foreach ($k in 'maxActivation', 'eligibilityMaxDuration', 'activeAssignmentMaxDuration', 'approval', 'endUserEnabledRules') { if (-not $st.ContainsKey($k)) { throw "desired state: settings.$t.$k is required" } }
        foreach ($k in 'maxActivation', 'eligibilityMaxDuration', 'activeAssignmentMaxDuration') { $null = [Xml.XmlConvert]::ToTimeSpan($st[$k]) }
        $h = [Xml.XmlConvert]::ToTimeSpan($st.maxActivation).TotalHours
        if ($h -lt 1 -or $h -gt 24) { throw "desired state: settings.$t.maxActivation must be 1 to 24 hours (Learn)" }
        if ($st.approval -and (-not $st.ContainsKey('approverGroupId') -or $st.approverGroupId -notmatch $script:Guid)) { throw "desired state: settings.$t needs approverGroupId when approval is required" }
        if ($st.ContainsKey('authenticationContext') -and $st.authenticationContext -and -not ($d.ContainsKey('authenticationContextPolicyConfirmed') -and $d.authenticationContextPolicyConfirmed)) {
            throw "desired state: settings.$t requires authentication context '$($st.authenticationContext)', but authenticationContextPolicyConfirmed isn't true. Build and enable its Conditional Access policy first (Learn; Chapter 03)."
        }
    }
    foreach ($e in $d.eligible) {
        foreach ($k in 'scope', 'roleDefinitionId', 'principalId', 'principalType', 'justification') { if (-not $e.ContainsKey($k) -or -not $e[$k]) { throw "desired state: eligible entries need '$k'" } }
        if ($e.principalType -notin 'User', 'Group') { throw "desired state: '$($e.principalId)' is a $($e.principalType); only users and groups can be eligible (Learn)" }
        $e.scope = ConvertTo-PaAzScope $e.scope
    }
    if (-not $d.ContainsKey('standingExceptions')) { $d.standingExceptions = @() }
    $d.standingExceptions = @($d.standingExceptions | Where-Object { $_.owner -and $_.reason })
    if (-not $d.ContainsKey('controlPlaneSubscriptionIds')) { $d.controlPlaneSubscriptionIds = @() }
    if (-not $d.ContainsKey('convertStanding')) { $d.convertStanding = $false }
    $d
}

function Get-PaAzTierMap {
    <# Chapter 01's tier map, with the desired state's control-plane subscriptions (any privileged role there is T0). #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Desired, [string]$Path)
    $map = if ($Path) { Get-PaTierMap -Path $Path } else { Get-PaTierMap }
    $map.azureControlPlaneSubscriptions.ids = @($Desired.controlPlaneSubscriptionIds)
    $map
}

function Get-PaAzTierSettings {
    param($Desired, [string]$Tier)
    if (-not $Desired.settings.ContainsKey($Tier)) { throw "desired state has no settings for tier $Tier" }
    $Desired.settings[$Tier]
}

# ----------------------------------------------------------------------------- policy rules

function Get-PaAzRuleWant {
    <# The managed fields of each policy rule for one tier's settings. Design guidance: Book 04, Appendix B. #>
    param($Settings)
    $endUser = @($Settings.endUserEnabledRules)
    $want = [ordered]@{
        Expiration_Admin_Eligibility             = @{ isExpirationRequired = $true; maximumDuration = $Settings.eligibilityMaxDuration }
        Expiration_Admin_Assignment              = @{ isExpirationRequired = $true; maximumDuration = $Settings.activeAssignmentMaxDuration }
        Expiration_EndUser_Assignment            = @{ isExpirationRequired = $true; maximumDuration = $Settings.maxActivation }
        Enablement_Admin_Assignment              = @{ enabledRules = @('MultiFactorAuthentication', 'Justification') }
        Enablement_EndUser_Assignment            = @{ enabledRules = $endUser }
        AuthenticationContext_EndUser_Assignment = @{ isEnabled = [bool]$Settings.authenticationContext; claimValue = $(if ($Settings.authenticationContext) { $Settings.authenticationContext } else { '' }) }
        Approval_EndUser_Assignment              = @{ isApprovalRequired = [bool]$Settings.approval; approvers = [object[]]@($Settings.approval ? $Settings.approverGroupId : @()) }
    }
    $want
}

function Get-PaAzRuleHave {
    <# The same managed fields, read from a rule as Resource Manager returns it. #>
    param($Rule)
    switch ($Rule.ruleType) {
        'RoleManagementPolicyExpirationRule' { @{ isExpirationRequired = [bool]$Rule.isExpirationRequired; maximumDuration = [string]$Rule.maximumDuration } }
        'RoleManagementPolicyEnablementRule' { @{ enabledRules = @($Rule.enabledRules) } }
        'RoleManagementPolicyAuthenticationContextRule' { @{ isEnabled = [bool]$Rule.isEnabled; claimValue = [string](Get-PaAzValue $Rule 'claimValue') } }
        'RoleManagementPolicyApprovalRule' {
            $stages = @(Get-PaAzValue (Get-PaAzValue $Rule 'setting') 'approvalStages')
            $ids = @($stages | ForEach-Object { @(Get-PaAzValue $_ 'primaryApprovers') } | Where-Object { $_ } | ForEach-Object { $_.id })
            $required = [bool]$Rule.setting.isApprovalRequired
            @{ isApprovalRequired = $required; approvers = $(if ($required) { $ids } else { @() }) }
        }
        default { @{} }
    }
}

function Test-PaAzRuleEqual {
    param([hashtable]$Want, [hashtable]$Have)
    foreach ($k in $Want.Keys) {
        if (-not $Have.ContainsKey($k)) { return $false }
        $w = $Want[$k]; $h = $Have[$k]
        if ($w -is [array] -or $h -is [array]) {
            if ((@($w | Sort-Object) -join '|') -ne (@($h | Sort-Object) -join '|')) { return $false }
        } elseif ($w -is [string] -and $k -eq 'maximumDuration') {
            if ([Xml.XmlConvert]::ToTimeSpan($w) -ne [Xml.XmlConvert]::ToTimeSpan([string]$h)) { return $false }
        } elseif ([string]$w -ne [string]$h) { return $false }
    }
    $true
}

function Set-PaAzRuleFields {
    <# A copy of the rule as read, with the managed fields set: id, ruleType and target are kept. #>
    param($Rule, [hashtable]$Want, $Settings)
    $r = [ordered]@{}
    foreach ($k in $Rule.Keys) { $r[$k] = $Rule[$k] }
    switch ($Rule.ruleType) {
        'RoleManagementPolicyApprovalRule' {
            $stage = [ordered]@{
                approvalStageTimeOutInDays = 1; isApproverJustificationRequired = $true; escalationTimeInMinutes = 0
                primaryApprovers = @($Want.approvers | ForEach-Object { [ordered]@{ id = $_; description = [string]$Settings.approverGroupName; isBackup = $false; userType = 'Group' } })
                isEscalationEnabled = $false; escalationApprovers = $null
            }
            [object[]]$stages = @()
            if ($Want.isApprovalRequired) { $stages = @($stage) }
            $r['setting'] = [ordered]@{
                isApprovalRequired = $Want.isApprovalRequired; isApprovalRequiredForExtension = $false; isRequestorJustificationRequired = $true
                approvalMode = 'SingleStage'; approvalStages = $stages
            }
        }
        default { foreach ($k in $Want.Keys) { $r[$k] = $Want[$k] } }
    }
    $r
}

# ----------------------------------------------------------------------------- the plan

function New-PaAzRequestName {
    <# A GUID derived from the run id and the operation, so a dry run and its apply send the same names. #>
    param([string]$RunId, [string]$Key)
    $b = [byte[]]([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes("$RunId|$Key"))[0..15])
    ([guid]::new($b)).ToString()
}

function Get-PaAzRoleDefinitionId { param([string]$Scope, [string]$RoleId) "$($Scope.TrimEnd('/'))/providers/Microsoft.Authorization/roleDefinitions/$RoleId" }

function New-PaAzFinding {
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, $Row, [string]$Issue)
    [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Scope = $Row.Scope; Role = $Row.RoleName; PrincipalId = $Row.PrincipalId; PrincipalType = $Row.PrincipalType; Issue = $Issue }
}

function New-PaAzPlan {
    <#
    .SYNOPSIS
        Compare the estate with the desired state and plan the requests, in the order they must be
        sent: policy updates, then new eligible assignments, then removal of standing assignments
        whose eligible replacement is in the plan or already exists. Returns the operations, the
        diff and the findings. Sends nothing.
    .PARAMETER CallerPrincipalId
        The object ID the apply runs as. Its own standing assignments are never planned for removal.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$State,
        [Parameter(Mandatory)]$Desired,
        [Parameter(Mandatory)][string]$CallerPrincipalId,
        [string]$RunId = ([DateTime]::UtcNow.ToString('yyyyMMdd')),
        $TierMap = (Get-PaTierMap)
    )
    if ($CallerPrincipalId -notmatch $script:Guid) { throw 'CallerPrincipalId must be an object ID' }
    $ops = [Collections.Generic.List[object]]::new()
    $findings = [Collections.Generic.List[object]]::new()
    $governed = @($Desired.governedRoles | ForEach-Object { $_.ToLowerInvariant() })
    $roleName = { param($id) if ($TierMap.azure.ContainsKey($id)) { $TierMap.azure[$id].name } else { $id } }
    $key = { param($scope, $role, $principal) "$($scope.ToLowerInvariant())|$($role.ToLowerInvariant())|$($principal.ToLowerInvariant())" }

    # 1. Policies: one PATCH per scope and role whose managed rules differ, carrying only those rules.
    foreach ($pol in @($State.Policies)) {
        if ($governed -notcontains $pol.RoleId) { continue }
        $tier = Get-PaAzureTier -RoleId $pol.RoleId -Scope $pol.Scope -TierMap $TierMap
        $settings = Get-PaAzTierSettings -Desired $Desired -Tier $tier
        $want = Get-PaAzRuleWant -Settings $settings
        $changed = [Collections.Generic.List[object]]::new()
        $diff = [Collections.Generic.List[string]]::new()
        foreach ($id in $want.Keys) {
            $rule = @($pol.Rules | Where-Object { $_.id -eq $id })
            if (-not $rule) { throw "Policy $($pol.Name) at $($pol.Scope) has no rule $id" }
            $have = Get-PaAzRuleHave -Rule $rule[0]
            if (-not (Test-PaAzRuleEqual -Want $want[$id] -Have $have)) {
                $changed.Add((Set-PaAzRuleFields -Rule $rule[0] -Want $want[$id] -Settings $settings))
                $fmt = { param($h) ($h.Keys | Sort-Object | ForEach-Object { "$_=$(@($h[$_]) -join ',')" }) -join '; ' }
                $diff.Add("$id`: $(& $fmt $have) -> $(& $fmt $want[$id])")
            }
        }
        if ($changed.Count) {
            $ops.Add([pscustomobject]@{
                    Order = 1; Kind = 'PolicyUpdate'; Scope = $pol.Scope; RoleId = $pol.RoleId; RoleName = (& $roleName $pol.RoleId); Tier = $tier; PrincipalId = $null
                    CallId = 'azpim-policy-update'; Bind = @{ scope = $pol.Scope; name = $pol.Name }
                    Body = [ordered]@{ properties = [ordered]@{ rules = $changed.ToArray() } }
                    Diff = @($diff | ForEach-Object { "~ policy $(& $roleName $pol.RoleId) at $($pol.Scope) ($tier): $_" })
                })
        }
    }

    # 2. Eligible assignments the desired state declares and the estate doesn't hold.
    $haveElig = @{}; foreach ($e in @($State.Eligibilities)) { $haveElig[(& $key $e.Scope $e.RoleId $e.PrincipalId)] = $e }
    $planned = @{}
    $addEligible = {
        param([string]$Scope, [string]$RoleId, [string]$PrincipalId, [string]$Justification, [string]$Why)
        $k = & $key $Scope $RoleId $PrincipalId
        if ($haveElig.ContainsKey($k) -or $planned.ContainsKey($k)) { return }
        $tier = Get-PaAzureTier -RoleId $RoleId -Scope $Scope -TierMap $TierMap
        $settings = Get-PaAzTierSettings -Desired $Desired -Tier $tier
        $planned[$k] = $true
        $ops.Add([pscustomobject]@{
                Order = 2; Kind = 'EligibilityAdd'; Scope = $Scope; RoleId = $RoleId; RoleName = (& $roleName $RoleId); Tier = $tier; PrincipalId = $PrincipalId
                CallId = 'azpim-eligibility-request'; Bind = @{ scope = $Scope; name = (New-PaAzRequestName $RunId "EligibilityAdd|$k") }
                Body = [ordered]@{ properties = [ordered]@{
                        principalId = $PrincipalId; roleDefinitionId = (Get-PaAzRoleDefinitionId $Scope $RoleId); requestType = 'AdminAssign'
                        justification = $Justification
                        scheduleInfo = [ordered]@{ expiration = [ordered]@{ type = 'AfterDuration'; endDateTime = $null; duration = $settings.eligibilityMaxDuration } }
                    } }
                Diff = @("+ eligible $(& $roleName $RoleId) at $Scope ($tier) for $PrincipalId, $($settings.eligibilityMaxDuration)$Why")
            })
    }
    foreach ($e in @($Desired.eligible)) { & $addEligible $e.scope $e.roleDefinitionId.ToLowerInvariant() $e.principalId $e.justification '' }

    # Eligibility the estate holds on a governed role that the desired state doesn't declare: reported, never removed here.
    $declared = @{}; foreach ($e in @($Desired.eligible)) { $declared[(& $key $e.scope $e.roleDefinitionId $e.principalId)] = $true }
    foreach ($e in @($State.Eligibilities)) {
        if ($governed -notcontains $e.RoleId) { continue }
        if (-not $declared.ContainsKey((& $key $e.Scope $e.RoleId $e.PrincipalId))) {
            $findings.Add((New-PaAzFinding 'PA-AZ-04' 'Warn' $e "Eligible $($e.RoleName) isn't in the desired state; add it after review, or remove it in its own change"))
        }
        if ($e.State -eq 'EligiblePermanent') {
            $findings.Add((New-PaAzFinding 'PA-AZ-04' 'Warn' $e "Eligible $($e.RoleName) has no end date; renew it under the tier's maximum"))
        }
    }

    # 3. Standing (permanent active) privileged assignments.
    $exc = @{}; foreach ($x in @($Desired.standingExceptions)) { $exc[(& $key (ConvertTo-PaAzScope $x.scope) $x.roleDefinitionId $x.principalId)] = $x }
    foreach ($a in @($State.Assignments)) {
        if ($a.State -ne 'ActivePermanent' -or $governed -notcontains $a.RoleId) { continue }
        $k = & $key $a.Scope $a.RoleId $a.PrincipalId
        if ($exc.ContainsKey($k)) {
            $findings.Add((New-PaAzFinding 'PA-AZ-01' 'Info' $a "Standing $($a.RoleName) on the exceptions list: $($exc[$k].reason) (owner $($exc[$k].owner))"))
            continue
        }
        if ($a.Scope -eq '/') {
            $findings.Add((New-PaAzFinding 'PA-AZ-03' 'Finding' $a 'User Access Administrator at root scope: elevated access. Remove the elevation; it isn''t converted to eligible'))
            continue
        }
        if ($a.PrincipalId -eq $CallerPrincipalId) {
            $findings.Add((New-PaAzFinding 'PA-AZ-05' 'Finding' $a "Standing $($a.RoleName) held by the identity this plan runs as: never removed by the plan. Decide it last, from another session"))
            continue
        }
        if ($a.PrincipalType -notin 'User', 'Group') {
            $findings.Add((New-PaAzFinding 'PA-AZ-02' 'Finding' $a "Standing $($a.RoleName) held by a $($a.PrincipalType): it can't be made eligible. Narrow the role or scope, or add an exception with an owner"))
            continue
        }
        $findings.Add((New-PaAzFinding 'PA-AZ-01' 'Finding' $a "Standing $($a.RoleName) ($($a.Tier)) outside the exceptions"))
        if (-not $Desired.convertStanding) { continue }
        & $addEligible $a.Scope $a.RoleId $a.PrincipalId "Converted from a standing assignment ($($a.Id))" ' (converted)'
        $ops.Add([pscustomobject]@{
                Order = 3; Kind = 'ActiveRemove'; Scope = $a.Scope; RoleId = $a.RoleId; RoleName = $a.RoleName; Tier = $a.Tier; PrincipalId = $a.PrincipalId
                CallId = 'azpim-assignment-request'; Bind = @{ scope = $a.Scope; name = (New-PaAzRequestName $RunId "ActiveRemove|$k") }
                Body = [ordered]@{ properties = [ordered]@{ principalId = $a.PrincipalId; roleDefinitionId = (Get-PaAzRoleDefinitionId $a.Scope $a.RoleId); requestType = 'AdminRemove'; justification = 'Standing assignment replaced by an eligible assignment (Chapter 06 plan)' } }
                Diff = @("- active $($a.RoleName) at $($a.Scope) ($($a.Tier)) for $($a.PrincipalId) (standing; eligible replacement first)")
            })
    }

    # 4. At most three Owners on a subscription, eligible or active, after the plan (Learn).
    $owners = @{}
    $count = { param($scope, $principal) if ($scope -match '^/subscriptions/[^/]+$') { if (-not $owners.ContainsKey($scope)) { $owners[$scope] = @{} }; $owners[$scope][$principal] = $true } }
    foreach ($r in @($State.Assignments) + @($State.Eligibilities)) { if ($r.RoleId -eq $script:Owner -and $r.State -ne 'Activated') { & $count $r.Scope $r.PrincipalId } }
    foreach ($o in $ops) { if ($o.Kind -eq 'EligibilityAdd' -and $o.RoleId -eq $script:Owner) { & $count $o.Scope $o.PrincipalId } }
    foreach ($s in $owners.Keys) {
        if ($owners[$s].Count -gt 3) { $findings.Add([pscustomobject]@{ Rule = 'PA-AZ-06'; Severity = 'Finding'; Scope = $s; Role = 'Owner'; PrincipalId = $null; PrincipalType = $null; Issue = "$($owners[$s].Count) Owners (eligible or active) after the plan; Learn's best practice is at most three" }) }
    }

    $sorted = @($ops | Sort-Object Order, Scope, RoleName, PrincipalId)
    [pscustomobject]@{
        RunId = $RunId; Operations = $sorted; Findings = $findings.ToArray()
        Diff = @($sorted | ForEach-Object { $_.Diff })
        Summary = [ordered]@{
            PolicyUpdate = @($sorted | Where-Object Kind -EQ 'PolicyUpdate').Count
            EligibilityAdd = @($sorted | Where-Object Kind -EQ 'EligibilityAdd').Count
            ActiveRemove = @($sorted | Where-Object Kind -EQ 'ActiveRemove').Count
        }
    }
}

function Invoke-PaAzPlan {
    <#
    .SYNOPSIS
        Turn a plan into requests. A dry run by default: the requests are returned and nothing is
        sent. With -Apply, each is sent in order through an azure-pim-apply client, and the run
        stops at the first error.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Plan, [Parameter(Mandatory)]$Client, [switch]$Apply)
    if ($Apply -and $Client.Task -ne 'azure-pim-apply') { throw "Applying needs an azure-pim-apply client; this one is '$($Client.Task)'." }
    foreach ($op in $Plan.Operations) {
        if ($Apply) {
            Invoke-PaAzWrite -Client $Client -CallId $op.CallId -Bind $op.Bind -Body $op.Body -Apply
        } else {
            $c = if ($Client.Task -eq 'azure-pim-apply') { $Client } else { [pscustomobject]@{ Cloud = $Client.Cloud; Task = 'azure-pim-apply'; Calls = (Get-PaAzCall -Task 'azure-pim-apply'); Invoke = $null; Evidence = $null } }
            Invoke-PaAzWrite -Client $c -CallId $op.CallId -Bind $op.Bind -Body $op.Body
        }
    }
}

function Export-PaAzRun {
    <# Write the run's files and a manifest with the SHA-256 of each, the mode, the cloud and every request sent. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)]$Client, [string]$Mode = 'Fixture', [bool]$Applied = $false, [string]$TenantId)
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $utf8 = [Text.UTF8Encoding]::new($false)
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        $text = if ($name.EndsWith('.txt')) { (@($Files[$name]) -join "`n") } else { ConvertTo-Json -InputObject $Files[$name] -Depth 30 }
        [IO.File]::WriteAllText($p, $text + "`n", $utf8)
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $manifest = [ordered]@{
        task = $Client.Task; mode = $Mode; applied = $Applied; cloud = $Client.Cloud.Name; arm = $Client.Cloud.Arm; tenantId = $TenantId
        generated = [DateTime]::UtcNow.ToString('o'); azureRoles = (Get-PaAzRequiredRole -Task $Client.Task).AzureRoles
        requests = @($Client.Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; at = $_.At } })
        files = $hashes
    }
    [IO.File]::WriteAllText((Join-Path $OutputPath 'manifest.json'), (ConvertTo-Json -InputObject $manifest -Depth 10) + "`n", $utf8)
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-PaAzCall, Get-PaAzRequiredRole, New-PaAzClient, ConvertTo-PaAzScope, Invoke-PaAzWrite, New-PaAzLiveInvoker,
    New-PaAzFixtureInvoker, Invoke-PaAzFake, Get-PaAzPimState, ConvertTo-PaAzRow, Read-PaAzDesiredState, Get-PaAzTierMap, Get-PaAzRuleWant, Get-PaAzRuleHave,
    New-PaAzRequestName, New-PaAzPlan, Invoke-PaAzPlan, Export-PaAzRun
