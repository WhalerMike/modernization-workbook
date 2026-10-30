#Requires -Version 7.1
<#
    PimGroups: Chapter 05 of the developer workbook "Building Privileged Access", PIM for Groups and
    the PRV groups as code.

    It reads the PRV groups, their PIM for Groups eligibility and assignment schedules (member and
    owner) and their two role management policies, checks them and the reviewed desired state
    (prv-groups.json) against Learn's limits and the program's design, and writes a plan: the exact
    Graph requests that would bring the tenant to the desired state, with a human-readable diff.
    The plan is a dry run. Invoke-PaPgPlan sends it only with -Apply, only after its guards pass,
    and only through calls declared in config/calls-ch05.json with their least-privileged
    permission. Illustrative: tested against fixtures and a fake, not a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Chapter 01's module supplies the cloud table (Get-PaCloud); this module never edits it.
Import-Module (Join-Path $PSScriptRoot '../PrivilegedAccess/PrivilegedAccess.psm1') -Scope Local -Force

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
$script:NamePattern = '^PRV-(T0|T1|T2|RO)-[A-Za-z0-9]+(-[A-Za-z0-9-]+)?$'
$script:Tiers = @('T0', 'T1', 'T2', 'RO')
$script:AccessIds = @('member', 'owner')
$script:ManagedRules = @('Expiration_Admin_Eligibility', 'Expiration_Admin_Assignment', 'Expiration_EndUser_Assignment', 'Enablement_EndUser_Assignment', 'Approval_EndUser_Assignment')
$script:RoleAssignableLimit = 500   # Learn: at most 500 role-assignable groups in a tenant.

# ----------------------------------------------------------------------------- calls and permissions

function Get-PaPgCall {
    <# The calls declared for Chapter 05, optionally for one task. #>
    [CmdletBinding()]
    param([ValidateSet('pim-groups-read', 'pim-groups-apply')][string]$Task)
    $calls = @((Get-Content -LiteralPath (Join-Path $script:ConfigRoot 'calls-ch05.json') -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    $calls
}

function Get-PaPgRequiredPermission {
    <# The union of a task's Graph application permissions. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('pim-groups-read', 'pim-groups-apply')][string]$Task)
    [pscustomobject]@{ Task = $Task; GraphPermissions = @((Get-PaPgCall -Task $Task) | ForEach-Object { $_.permissions } | Sort-Object -Unique) }
}

function Get-PaPgPolicySetting {
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'prv-group-policy.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

# ----------------------------------------------------------------------------- the client

function New-PaPgClient {
    <#
    .SYNOPSIS
        A client for one Chapter 05 task in one cloud. -Invoke is { param($Method, $Uri, $Body) }
        returning the parsed body as a hashtable: New-PaPgFixtureInvoker's fake, or
        New-PaPgLiveInvoker. The read task can only GET.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][ValidateSet('pim-groups-read', 'pim-groups-apply')][string]$Task,
        [Parameter(Mandatory)][scriptblock]$Invoke
    )
    [pscustomobject]@{
        Cloud = Get-PaCloud -Cloud $Cloud; Task = $Task; Calls = @(Get-PaPgCall -Task $Task); Invoke = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-PaPgUri {
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch05.json with its permission." }
    $path = $call.path
    foreach ($k in $Bind.Keys) {
        $v = [string]$Bind[$k]
        if ($v -notmatch '^[A-Za-z0-9_-]+$') { throw "Refusing '$v' as {$k}: only IDs go in a path" }
        $path = $path.Replace("{$k}", $v)
    }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    $uri = "$($Client.Cloud.Graph)/$($call.version)$path"
    if ($Query) { $uri += "?$Query" }
    [pscustomobject]@{ Call = $call; Uri = $uri }
}

function Assert-PaPgHost {
    param([string]$Uri, [string]$Graph)
    if (-not $Uri.StartsWith("$Graph/", [StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to send the token to $Uri`: not $Graph" }
}

function Invoke-PaPgList {
    <# GET a declared collection, following @odata.nextLink on the cloud's own Graph host only. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $r = Resolve-PaPgUri -Client $Client -CallId $CallId -Bind $Bind -Query $Query
    if ($r.Call.method -ne 'GET') { throw "$CallId isn't a read" }
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri
    while ($uri) {
        Assert-PaPgHost -Uri $uri -Graph $Client.Cloud.Graph
        $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Uri = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Client.Invoke 'GET' $uri $null
        if ($null -eq $body) { throw "No response for $uri" }
        foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } else { $null }
    }
    , $items.ToArray()
}

function ConvertTo-PaPgODataString { param([string]$Value) $Value.Replace("'", "''") }

function New-PaPgFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Graph for PIM for Groups, served from a fixture tenant file. It answers the declared
        GETs (pages of -PageSize with a next link), and accepts the declared POST and PATCH calls,
        recording each in .Writes without changing the tenant. Schedule requests are checked the
        way Learn says PIM checks them: a known group and access ID, a documented action, and
        under an expiration rule an end date after the fake's clock and within the policy's
        maximum. Anything else gets the fake's 400. -Now is the fake's clock.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$Cloud = 'gcc', [int]$PageSize = 2, [datetime]$Now = [datetime]'2026-10-30T12:00:00Z')
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $state = [pscustomobject]@{ Tenant = $t; Graph = (Get-PaCloud -Cloud $Cloud).Graph; PageSize = $PageSize; Now = $Now.ToUniversalTime()
        Calls = [Collections.Generic.List[object]]::new(); Writes = [Collections.Generic.List[object]]::new(); Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body) Invoke-PaPgFake -State $s -Method $Method -Uri $Uri -Body $Body }.GetNewClosure()
    $state
}

function Invoke-PaPgFake {
    param($State, [string]$Method, [string]$Uri, $Body)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri })
    $u = [Uri]$Uri
    $base = "$($u.Scheme)://$($u.Host)"
    if ($base -ne $State.Graph) { throw "The fake refuses host $base" }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    $t = $State.Tenant
    $page = {
        param([object[]]$All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $resp = @{ value = @($All | Select-Object -Skip $skip -First $State.PageSize) }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $resp['@odata.nextLink'] = "$base$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
        }
        $resp
    }
    $groupFilter = {
        if (-not $q.ContainsKey('$filter') -or $q['$filter'] -notmatch "groupId eq '([^']+)'") { throw '400: this list requires $filter on groupId or principalId' }
        $Matches[1]
    }
    if ($Method -eq 'GET') {
        switch -Regex ($path) {
            '^/v1\.0/groups$' {
                $f = [string]$q['$filter']
                if ($f -eq 'isAssignableToRole eq true') { return & $page @($t.groups | Where-Object { $_.isAssignableToRole }) }
                if ($f -match "^startswith\(displayName,'([^']+)'\)$") { $p = $Matches[1]; return & $page @($t.groups | Where-Object { $_.displayName.StartsWith($p, [StringComparison]::OrdinalIgnoreCase) }) }
                throw "The fake has no answer for groups filter '$f'"
            }
            '^/v1\.0/identityGovernance/privilegedAccess/group/eligibilitySchedules$' { $g = & $groupFilter; return & $page @($t.eligibilitySchedules | Where-Object { $_.groupId -eq $g }) }
            '^/v1\.0/identityGovernance/privilegedAccess/group/assignmentSchedules$' { $g = & $groupFilter; return & $page @($t.assignmentSchedules | Where-Object { $_.groupId -eq $g }) }
            '^/v1\.0/policies/roleManagementPolicyAssignments$' {
                if ([string]$q['$filter'] -notmatch "^scopeId eq '([^']+)' and scopeType eq 'Group'$") { throw '400: scopeId and scopeType are required' }
                $g = $Matches[1]; return & $page @($t.policyAssignments | Where-Object { $_.scopeId -eq $g })
            }
        }
        throw "The fake has no GET route for $path"
    }
    $fail = { param($m) throw "400 Bad Request from the fake: $m" }
    switch -Regex ($path) {
        '^/v1\.0/identityGovernance/privilegedAccess/group/(eligibilityScheduleRequests|assignmentScheduleRequests)$' {
            if ($Method -ne 'POST') { & $fail "$Method isn't allowed here" }
            $kind = $Matches[1]
            if ($Body.accessId -notin $script:AccessIds) { & $fail "accessId '$($Body.accessId)'" }
            if (-not ($t.groups | Where-Object { $_.id -eq $Body.groupId })) { & $fail "no group $($Body.groupId)" }
            $actions = 'adminAssign', 'adminUpdate', 'adminRemove', 'selfActivate', 'selfDeactivate', 'adminExtend', 'adminRenew'
            if (-not ($actions | Where-Object { $_ -eq [string]$Body.action })) { & $fail "action '$($Body.action)' isn't one of Learn's documented values" }
            if ($Body.action -in 'adminAssign', 'adminUpdate', 'adminExtend', 'adminRenew') {
                $level = if ($kind -like 'eligibility*') { 'Eligibility' } else { 'Assignment' }
                $pa = $t.policyAssignments | Where-Object { $_.scopeId -eq $Body.groupId -and $_.roleDefinitionId -eq $Body.accessId } | Select-Object -First 1
                $rule = if ($pa) { $pa.policy.rules | Where-Object { $_.id -eq "Expiration_Admin_$level" } } else { $null }
                $si = Get-PaPgValue $Body 'scheduleInfo'
                $exp = Get-PaPgValue $si 'expiration'
                $sdt = Get-PaPgValue $si 'startDateTime'
                $start = if ($sdt) { ([datetime]$sdt).ToUniversalTime() } else { $State.Now }
                $type = [string](Get-PaPgValue $exp 'type')
                $end = if ($type -eq 'afterDateTime' -and (Get-PaPgValue $exp 'endDateTime')) { ([datetime]$exp['endDateTime']).ToUniversalTime() }
                elseif ($type -eq 'afterDuration' -and (Get-PaPgValue $exp 'duration')) { $start + [Xml.XmlConvert]::ToTimeSpan($exp['duration']) }
                else { $null }
                # The fake's own rule: a schedule that has already ended is refused (research gap 57).
                if ($end -and $end -le $State.Now) { & $fail "the schedule ended at $($end.ToString('o')), before the fake's clock" }
                if ($rule -and $rule.isExpirationRequired) {
                    if (-not $end) { & $fail 'ExpirationRule: an expiration is required' }
                    if ($end - $start -gt [Xml.XmlConvert]::ToTimeSpan($rule.maximumDuration)) { & $fail "ExpirationRule: longer than $($rule.maximumDuration)" }
                }
            }
            $State.Writes.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
            return @{ id = [guid]::NewGuid().ToString(); status = 'Provisioned'; action = $Body.action; accessId = $Body.accessId; groupId = $Body.groupId; principalId = $Body.principalId }
        }
        '^/v1\.0/policies/roleManagementPolicies/([^/]+)/rules/([^/]+)$' {
            if ($Method -ne 'PATCH') { & $fail "$Method isn't allowed here" }
            $pid_ = $Matches[1]; $rid = $Matches[2]
            if (-not ($t.policyAssignments | Where-Object { $_.policyId -eq $pid_ })) { & $fail "no policy $pid_" }
            if ($Body.id -ne $rid -or -not $Body['@odata.type']) { & $fail 'the rule body needs its id and @odata.type' }
            $State.Writes.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
            return @{}
        }
        '^/v1\.0/groups$' {
            if ($Method -ne 'POST') { & $fail "$Method isn't allowed here" }
            if ($Body.isAssignableToRole -and (-not $Body.securityEnabled -or @($Body.groupTypes) -contains 'DynamicMembership')) { & $fail 'a role-assignable group must be security-enabled and assigned' }
            $State.Writes.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
            return @{ id = [guid]::NewGuid().ToString(); displayName = $Body.displayName; isAssignableToRole = $Body.isAssignableToRole }
        }
    }
    throw "The fake has no $Method route for $path"
}

function New-PaPgLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker, through Invoke-MgGraphRequest. Refuses to start if the Graph session is in
        another cloud. Sign in first with Connect-MgGraph -Environment <GraphEnvironment> as an app
        holding only the permissions Get-PaPgRequiredPermission lists for the task.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    $c = Get-PaCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    {
        param($Method, $Uri, $Body)
        if ($Method -eq 'GET') { return Invoke-MgGraphRequest -Method GET -Uri $Uri -OutputType Hashtable }
        Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body ($Body | ConvertTo-Json -Depth 20) -ContentType 'application/json' -OutputType Hashtable
    }
}

# ----------------------------------------------------------------------------- the desired state

function Read-PaPrvGroupConfig {
    <#
    .SYNOPSIS
        prv-groups.json, the reviewed desired state: approverGroups by tier, and groups with
        displayName, id (absent for a group still to be created), tier, holds (entraRole,
        azureRole or other), and member and owner lists of active and eligible entries
        (principalId, principalName, principalType, endDateTime, ticket). Malformed input throws.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $c = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    if (-not $c.ContainsKey('groups') -or -not $c.groups) { throw 'prv-groups.json: groups is required' }
    if (-not $c.ContainsKey('approverGroups')) { $c.approverGroups = @{} }
    foreach ($k in @($c.approverGroups.Keys)) { if ($c.approverGroups[$k] -notmatch $script:Guid) { throw "prv-groups.json: approver group for $k must be an object ID" } }
    $names = @{}
    foreach ($g in $c.groups) {
        foreach ($k in 'displayName', 'tier', 'holds') { if (-not $g.ContainsKey($k) -or -not $g[$k]) { throw "prv-groups.json: '$k' is required on every group" } }
        if ($names.ContainsKey($g.displayName)) { throw "prv-groups.json: $($g.displayName) appears twice" }
        $names[$g.displayName] = $true
        if ($g.tier -notin $script:Tiers) { throw "prv-groups.json: $($g.displayName) has tier '$($g.tier)'; use T0, T1, T2 or RO" }
        if ($g.holds -notin 'entraRole', 'azureRole', 'other') { throw "prv-groups.json: $($g.displayName) holds '$($g.holds)'; use entraRole, azureRole or other" }
        if (-not $g.ContainsKey('id')) { $g.id = $null }
        if ($g.id -and $g.id -notmatch $script:Guid) { throw "prv-groups.json: $($g.displayName) id must be an object ID" }
        foreach ($a in $script:AccessIds) {
            if (-not $g.ContainsKey($a)) { $g[$a] = @{ active = @(); eligible = @() } }
            foreach ($kind in 'active', 'eligible') {
                if (-not $g[$a].ContainsKey($kind)) { $g[$a][$kind] = @() }
                foreach ($e in @($g[$a][$kind])) {
                    if ($e.principalId -notmatch $script:Guid) { throw "prv-groups.json: $($g.displayName) $a $kind principal '$($e.principalId)' isn't an object ID" }
                    if (-not $e.ContainsKey('principalType')) { $e.principalType = 'user' }
                    if (-not $e.ContainsKey('principalName')) { $e.principalName = $null }
                    if (-not $e.ContainsKey('endDateTime')) { $e.endDateTime = $null }
                    if (-not $e.ContainsKey('ticket')) { $e.ticket = $null }
                }
            }
        }
    }
    $c
}

function New-PaPgFinding {
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$Object, [string]$Issue)
    [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Object = $Object; Issue = $Issue }
}

function ConvertTo-PaPgDuration { param([string]$Iso) if (-not $Iso) { return $null } [Xml.XmlConvert]::ToTimeSpan($Iso) }

function Test-PaPrvGroupConfig {
    <#
    .SYNOPSIS
        Checks the desired state itself, before any tenant read: the pre-merge review of the file.
        PA-PG-01 naming, PA-PG-05 group or service principal holders, PA-PG-06 entries with no
        end, PA-PG-07 owners, PA-PG-08 the policy settings for each tier used.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Config, [Parameter(Mandatory)]$PolicySetting, [datetime]$AsOf = [datetime]::UtcNow)
    $f = [Collections.Generic.List[object]]::new()
    $max = ConvertTo-PaPgDuration $PolicySetting.maxActivation
    foreach ($g in $Config.groups) {
        $n = $g.displayName
        if ($n -cnotmatch $script:NamePattern) { $f.Add((New-PaPgFinding 'PA-PG-01' 'Finding' $n "Not named PRV-<tier>-<role>[-<scope>]")) }
        elseif ($n.Split('-')[1] -cne $g.tier) { $f.Add((New-PaPgFinding 'PA-PG-01' 'Finding' $n "Name says $($n.Split('-')[1]) but the tier is $($g.tier)")) }
        foreach ($a in $script:AccessIds) {
            foreach ($kind in 'active', 'eligible') {
                foreach ($e in @($g[$a][$kind])) {
                    $who = if ($e.principalName) { $e.principalName } else { $e.principalId }
                    if ($e.principalType -eq 'group') { $f.Add((New-PaPgFinding 'PA-PG-05' 'Finding' $n "$who is a group as $kind $a; the program puts only people in PRV groups")) }
                    if ($e.principalType -eq 'servicePrincipal' -and $kind -eq 'eligible') { $f.Add((New-PaPgFinding 'PA-PG-05' 'Finding' $n "$who is a service principal made eligible $a; Learn: service principals can't be eligible")) }
                    if (-not $e.endDateTime) { $f.Add((New-PaPgFinding 'PA-PG-06' 'Finding' $n "$who has a permanent $kind $a entry; every entry needs an end date")) }
                    elseif (([datetime]$e.endDateTime).ToUniversalTime() -le $AsOf.ToUniversalTime()) { $f.Add((New-PaPgFinding 'PA-PG-06' 'Finding' $n "$who has a $kind $a entry that ended on $($e.endDateTime)")) }
                    if (-not $e.ticket) { $f.Add((New-PaPgFinding 'PA-PG-06' 'Warn' $n "$who has a $kind $a entry with no ticket")) }
                }
            }
        }
        $owners = @($g.owner.active) + @($g.owner.eligible)
        if ($g.tier -eq 'T0' -and $owners.Count) { $f.Add((New-PaPgFinding 'PA-PG-07' 'Finding' $n 'A T0 PRV group has an owner; owners manage membership, so T0 groups have none')) }
        if (@($g.owner.eligible).Count -and -not @($g.owner.active).Count) { $f.Add((New-PaPgFinding 'PA-PG-07' 'Finding' $n "Eligible owners with no active owner: Learn says the last active owner can't be removed, so an activated owner would stay an owner")) }
        foreach ($a in $script:AccessIds) {
            $s = $PolicySetting[$a][$g.tier]
            if (-not $s) { $f.Add((New-PaPgFinding 'PA-PG-08' 'Finding' $n "No $a policy setting for tier $($g.tier)")); continue }
            if ((ConvertTo-PaPgDuration $s.activationMaxDuration) -gt $max) { $f.Add((New-PaPgFinding 'PA-PG-08' 'Finding' $n "$a activation $($s.activationMaxDuration) is longer than $($PolicySetting.maxActivation)")) }
            if ($s.approvalRequired -and -not ($Config.approverGroups.ContainsKey($g.tier))) { $f.Add((New-PaPgFinding 'PA-PG-08' 'Finding' $n "$a activation needs approval but no approver group is set for $($g.tier)")) }
            if ($s.approvalRequired -and $Config.approverGroups[$g.tier] -eq $g.id) { $f.Add((New-PaPgFinding 'PA-PG-08' 'Finding' $n "The group approves its own $a activations")) }
            if ($a -eq 'member' -and $g.holds -eq 'entraRole' -and -not $s.approvalRequired -and @($g.member.eligible).Count) {
                $f.Add((New-PaPgFinding 'PA-PG-08' 'Warn' $n 'Eligible members activate into an Entra role without approval; Learn recommends approval, so record the risk acceptance'))
            }
        }
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the tenant

function Get-PaPgTenantState {
    <#
    .SYNOPSIS
        Reads the role-assignable groups, the PRV-named groups, and for each managed group its
        eligibility and assignment schedules and its member and owner policy assignments with
        their rules. Only declared GETs.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)]$Config)
    $sel = '$select=id,displayName,isAssignableToRole,securityEnabled,groupTypes,membershipRule,onPremisesSyncEnabled'
    $rag = Invoke-PaPgList -Client $Client -CallId 'groups-list' -Query "`$filter=isAssignableToRole eq true&$sel"
    $prv = Invoke-PaPgList -Client $Client -CallId 'groups-list' -Query "`$filter=startswith(displayName,'PRV-')&$sel"
    $byId = @{}; foreach ($g in @($rag) + @($prv)) { $byId[$g.id] = $g }
    $groups = @{}
    foreach ($d in $Config.groups) {
        $g = if ($d.id -and $byId.ContainsKey($d.id)) { $byId[$d.id] } else { $null }
        if (-not $g) { $groups[$d.displayName] = $null; continue }
        $gid = ConvertTo-PaPgODataString $g.id
        $elig = Invoke-PaPgList -Client $Client -CallId 'pim-group-eligibility-schedules' -Query "`$filter=groupId eq '$gid'&`$expand=principal"
        $asg = Invoke-PaPgList -Client $Client -CallId 'pim-group-assignment-schedules' -Query "`$filter=groupId eq '$gid'&`$expand=principal"
        $pas = Invoke-PaPgList -Client $Client -CallId 'pim-group-policy-assignments' -Query "`$filter=scopeId eq '$gid' and scopeType eq 'Group'&`$expand=policy(`$expand=rules)"
        $groups[$d.displayName] = [pscustomobject]@{ Group = $g; Eligibility = @($elig); Assignment = @($asg); Policies = @($pas) }
    }
    [pscustomobject]@{ RoleAssignable = @($rag); PrvNamed = @($prv); Groups = $groups; Evidence = $Client.Evidence.ToArray() }
}

function Get-PaPgEnd { param($Schedule) $e = $Schedule.scheduleInfo.expiration; if ($e -and $e.type -ne 'noExpiration' -and $e.endDateTime) { ([datetime]$e.endDateTime).ToUniversalTime() } else { $null } }
function Get-PaPgPrincipalType {
    param($Schedule)
    $p = if ($Schedule.ContainsKey('principal')) { $Schedule.principal } else { $null }
    switch ($(if ($p -and $p.ContainsKey('@odata.type')) { $p['@odata.type'] } else { '' })) {
        '#microsoft.graph.user' { 'user' } '#microsoft.graph.group' { 'group' } '#microsoft.graph.servicePrincipal' { 'servicePrincipal' } default { 'unknown' }
    }
}
function Get-PaPgValue { param($Hash, [string]$Key) if ($Hash -is [Collections.IDictionary] -and $Hash.Contains($Key)) { $Hash[$Key] } else { $null } }
function Get-PaPgPrincipalName {
    param($Schedule)
    $p = Get-PaPgValue $Schedule 'principal'
    $upn = Get-PaPgValue $p 'userPrincipalName'; $dn = Get-PaPgValue $p 'displayName'
    if ($upn) { $upn } elseif ($dn) { $dn } else { $Schedule.principalId }
}

function Get-PaPgCurrent {
    # The tenant's schedules for one group as rows keyed like the desired state. Activations of an
    # eligible assignment (assignmentType 'activated') aren't standing state and are left out.
    param($State)
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($s in @($State.Eligibility)) { $rows.Add([pscustomobject]@{ Kind = 'eligible'; Access = $s.accessId; PrincipalId = $s.principalId; Name = (Get-PaPgPrincipalName $s); Type = (Get-PaPgPrincipalType $s); End = (Get-PaPgEnd $s) }) }
    foreach ($s in @($State.Assignment)) {
        if ($s.ContainsKey('assignmentType') -and $s.assignmentType -eq 'activated') { continue }
        $rows.Add([pscustomobject]@{ Kind = 'active'; Access = $s.accessId; PrincipalId = $s.principalId; Name = (Get-PaPgPrincipalName $s); Type = (Get-PaPgPrincipalType $s); End = (Get-PaPgEnd $s) })
    }
    $rows.ToArray()
}

function Test-PaPgTenant {
    <#
    .SYNOPSIS
        The tenant's findings: PA-PG-02 to PA-PG-09 against Learn's limits and the desired state.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$State, [Parameter(Mandatory)]$Config, [Parameter(Mandatory)]$PolicySetting, [int]$RoleAssignableWarnAt = 450)
    $f = [Collections.Generic.List[object]]::new()
    $n = @($State.RoleAssignable).Count
    if ($n -ge $script:RoleAssignableLimit) { $f.Add((New-PaPgFinding 'PA-PG-04' 'Finding' 'tenant' "$n role-assignable groups: Learn's limit is $script:RoleAssignableLimit")) }
    elseif ($n -ge $RoleAssignableWarnAt) { $f.Add((New-PaPgFinding 'PA-PG-04' 'Warn' 'tenant' "$n of Learn's $script:RoleAssignableLimit role-assignable groups used")) }
    $managed = @($Config.groups | Where-Object { $_.id } | ForEach-Object { $_.id })
    foreach ($g in @($State.RoleAssignable) + @($State.PrvNamed) | Sort-Object id -Unique) {
        if ($managed -notcontains $g.id) {
            $why = if ($g.displayName -like 'PRV-*') { 'is named as a PRV group' } else { 'is role-assignable' }
            $f.Add((New-PaPgFinding 'PA-PG-09' 'Warn' $g.displayName "$why but isn't in prv-groups.json; nothing reviews it"))
        }
    }
    foreach ($d in $Config.groups) {
        $name = $d.displayName
        $st = $State.Groups[$name]
        if (-not $st) { $f.Add((New-PaPgFinding 'PA-PG-02' 'Info' $name 'Not in the tenant yet; the plan creates it as role-assignable')); continue }
        $g = $st.Group
        if (-not $g.isAssignableToRole) {
            if ($d.holds -eq 'entraRole') { $f.Add((New-PaPgFinding 'PA-PG-02' 'Finding' $name "isAssignableToRole is false: it can't hold an Entra role, and Learn says it can't be changed after creation; create a new role-assignable group")) }
            else { $f.Add((New-PaPgFinding 'PA-PG-02' 'Warn' $name "Not role-assignable: Learn recommends role-assignable for groups that guard sensitive resources, for its extra protections")) }
        }
        $types = @($(if ($g.ContainsKey('groupTypes')) { $g.groupTypes } else { @() }))
        if ($types -contains 'DynamicMembership' -or ($g.ContainsKey('onPremisesSyncEnabled') -and $g.onPremisesSyncEnabled)) {
            $f.Add((New-PaPgFinding 'PA-PG-03' 'Finding' $name "Dynamic or synchronized from on-premises: Learn says PIM for Groups can't manage it"))
        }
        $cur = Get-PaPgCurrent $st
        foreach ($r in $cur) {
            if ($r.Type -eq 'group') { $f.Add((New-PaPgFinding 'PA-PG-05' 'Finding' $name "$($r.Name) is a group, $($r.Kind) $($r.Access); a nested group hides its people from the review")) }
            if ($r.Type -eq 'servicePrincipal' -and $r.Kind -eq 'eligible') { $f.Add((New-PaPgFinding 'PA-PG-05' 'Finding' $name "$($r.Name) is a service principal with eligible $($r.Access)")) }
            if (-not $r.End) { $f.Add((New-PaPgFinding 'PA-PG-06' 'Finding' $name "$($r.Name) has permanent $($r.Kind) $($r.Access)")) }
            $want = @($d[$r.Access][$r.Kind] | Where-Object { $_.principalId -eq $r.PrincipalId })
            if (-not $want.Count) { $f.Add((New-PaPgFinding 'PA-PG-09' 'Finding' $name "$($r.Name) has $($r.Kind) $($r.Access) that prv-groups.json doesn't grant")) }
        }
        $actOwners = @($cur | Where-Object { $_.Access -eq 'owner' -and $_.Kind -eq 'active' })
        $eligOwners = @($cur | Where-Object { $_.Access -eq 'owner' -and $_.Kind -eq 'eligible' })
        if ($eligOwners.Count -and -not $actOwners.Count) { $f.Add((New-PaPgFinding 'PA-PG-07' 'Finding' $name "Eligible owner $($eligOwners[0].Name) and no active owner: once activated, Learn says the ownership can't be deactivated")) }
        if ($d.tier -eq 'T0' -and $actOwners.Count) { $f.Add((New-PaPgFinding 'PA-PG-07' 'Finding' $name "Active owner $($actOwners[0].Name) on a T0 group")) }
        foreach ($a in $script:AccessIds) {
            $pa = @($st.Policies | Where-Object { $_.roleDefinitionId -eq $a }) | Select-Object -First 1
            if (-not $pa) { $f.Add((New-PaPgFinding 'PA-PG-08' 'Warn' $name "No $a policy read; PIM creates it when the group is first managed")); continue }
            foreach ($diff in Compare-PaPgPolicy -Current $pa.policy -Desired (New-PaPgRuleSet -Setting $PolicySetting[$a][$d.tier] -ApproverGroupId $Config.approverGroups[$d.tier])) {
                $sev = if ($d.tier -in 'T0', 'T1' -or $diff.RuleId -like 'Expiration_*') { 'Finding' } else { 'Warn' }
                $f.Add((New-PaPgFinding 'PA-PG-08' $sev $name "$a policy $($diff.RuleId): $($diff.Current) in the tenant, $($diff.Desired) reviewed"))
            }
        }
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- policy rules

function New-PaPgRuleTarget { param([string]$Caller, [string]$Level) [ordered]@{ caller = $Caller; operations = @('All'); level = $Level; inheritableSettings = @(); enforcedSettings = @() } }

function New-PaPgRuleSet {
    <#
    .SYNOPSIS
        The five rules the program sets on a PIM for Groups policy, in the shapes Learn's
        "Update rules in PIM" examples use, from one tier's settings.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Setting, [string]$ApproverGroupId)
    $approvers = @()
    if ($Setting.approvalRequired) {
        if (-not $ApproverGroupId) { throw 'Approval is required but no approver group is set' }
        $approvers = @([ordered]@{ '@odata.type' = '#microsoft.graph.groupMembers'; groupId = $ApproverGroupId })
    }
    @(
        [ordered]@{ '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyExpirationRule'; id = 'Expiration_Admin_Eligibility'; isExpirationRequired = $true; maximumDuration = $Setting.eligibilityMaxDuration; target = (New-PaPgRuleTarget 'Admin' 'Eligibility') }
        [ordered]@{ '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyExpirationRule'; id = 'Expiration_Admin_Assignment'; isExpirationRequired = $true; maximumDuration = $Setting.activeMaxDuration; target = (New-PaPgRuleTarget 'Admin' 'Assignment') }
        [ordered]@{ '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyExpirationRule'; id = 'Expiration_EndUser_Assignment'; isExpirationRequired = $true; maximumDuration = $Setting.activationMaxDuration; target = (New-PaPgRuleTarget 'EndUser' 'Assignment') }
        [ordered]@{ '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyEnablementRule'; id = 'Enablement_EndUser_Assignment'; enabledRules = @($Setting.enabledRules); target = (New-PaPgRuleTarget 'EndUser' 'Assignment') }
        [ordered]@{ '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyApprovalRule'; id = 'Approval_EndUser_Assignment'; target = (New-PaPgRuleTarget 'EndUser' 'Assignment')
            setting = [ordered]@{ isApprovalRequired = [bool]$Setting.approvalRequired; isApprovalRequiredForExtension = $false; isRequestorJustificationRequired = $true; approvalMode = 'SingleStage'
                approvalStages = @([ordered]@{ approvalStageTimeOutInDays = 1; isApproverJustificationRequired = $true; escalationTimeInMinutes = 0; primaryApprovers = $approvers; isEscalationEnabled = $false; escalationApprovers = @() }) } }
    )
}

function Get-PaPgRuleView {
    # One rule reduced to the settings the program reviews, as a comparable string.
    param($Rule)
    if ($null -eq $Rule) { return '(missing)' }
    switch ($Rule.id) {
        { $_ -like 'Expiration_*' } { return "required=$([bool]$Rule.isExpirationRequired) max=$($Rule.maximumDuration)" }
        'Enablement_EndUser_Assignment' { return 'enabled=' + ((@($Rule.enabledRules) | Sort-Object) -join ',') }
        'Approval_EndUser_Assignment' {
            $s = $Rule.setting
            $ids = @(foreach ($st in @($s.approvalStages)) { foreach ($p in @($st.primaryApprovers)) { if ($p) { "$($p['@odata.type'].Split('.')[-1]):$(if (Get-PaPgValue $p 'groupId') { $p['groupId'] } else { Get-PaPgValue $p 'userId' })" } } }) | Sort-Object
            return "approval=$([bool]$s.isApprovalRequired) approvers=$($ids -join ',')"
        }
    }
    throw "Unmanaged rule $($Rule.id)"
}

function Compare-PaPgPolicy {
    <# The managed rules whose reviewed settings differ between the tenant and the desired rule set. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Current, [Parameter(Mandatory)][object[]]$Desired)
    foreach ($want in $Desired) {
        $have = @($Current.rules) | Where-Object { $_.id -eq $want.id } | Select-Object -First 1
        $c = Get-PaPgRuleView $have; $d = Get-PaPgRuleView $want
        if ($c -ne $d) { [pscustomobject]@{ RuleId = $want.id; Current = $c; Desired = $d; Body = $want } }
    }
}

# ----------------------------------------------------------------------------- the plan

function New-PaPgScheduleBody {
    param([string]$GroupId, [string]$Access, [string]$PrincipalId, [string]$Action, $Entry, [datetime]$AsOf)
    $b = [ordered]@{ accessId = $Access; principalId = $PrincipalId; groupId = $GroupId; action = $Action }
    if ($Action -ne 'adminRemove') {
        # An entry with no end becomes noExpiration here so that guard PA-PG-G2 sees it and refuses.
        $exp = if ($Entry.endDateTime) { [ordered]@{ type = 'afterDateTime'; endDateTime = ([datetime]$Entry.endDateTime).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') } } else { [ordered]@{ type = 'noExpiration' } }
        $b.scheduleInfo = [ordered]@{ startDateTime = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); expiration = $exp }
        $b.justification = "PRV desired state, $($Entry.ticket)"
        if ($Entry.ticket) { $b.ticketInfo = [ordered]@{ ticketNumber = $Entry.ticket; ticketSystem = 'Change' } }
    } else { $b.justification = 'Not in the reviewed PRV desired state' }
    $b
}

function New-PaPimGroupPlan {
    <#
    .SYNOPSIS
        The requests that would bring the tenant to the desired state, in order: groups to create,
        then policy rules (so the rules are in force before anyone is granted), then schedule
        requests (adds and updates before removals). Each operation carries its call, method, URI,
        body and least-privileged permission, and a diff line. Nothing is sent.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$State, [Parameter(Mandatory)]$Config, [Parameter(Mandatory)]$PolicySetting, [Parameter(Mandatory)][string]$Cloud, [datetime]$AsOf = [datetime]::UtcNow)
    $client = New-PaPgClient -Cloud $Cloud -Task 'pim-groups-apply' -Invoke { throw 'A plan sends nothing' }
    $ops = [Collections.Generic.List[object]]::new()
    $add = {
        param([string]$Op, [string]$CallId, [hashtable]$Bind, $Body, [string]$Diff, [string]$Group, [string]$Access, [string]$Principal)
        $r = Resolve-PaPgUri -Client $client -CallId $CallId -Bind $Bind
        $ops.Add([pscustomobject][ordered]@{ Seq = 0; Op = $Op; Group = $Group; Access = $Access; Principal = $Principal; CallId = $CallId
                Method = $r.Call.method; Uri = $r.Uri; Permissions = @($r.Call.permissions); Body = $Body; Diff = $Diff })
    }
    $creates = [Collections.Generic.List[object]]::new(); $rules = [Collections.Generic.List[object]]::new()
    $grants = [Collections.Generic.List[object]]::new(); $removes = [Collections.Generic.List[object]]::new()
    foreach ($d in $Config.groups) {
        $name = $d.displayName; $st = $State.Groups[$name]
        if (-not $st) {
            $nick = ($name -replace '[^A-Za-z0-9]', '').ToLowerInvariant()
            $body = [ordered]@{ displayName = $name; description = "Program privileged group, tier $($d.tier)"; isAssignableToRole = $true; securityEnabled = $true; mailEnabled = $false; mailNickname = $nick; groupTypes = @() }
            $creates.Add(@('group-create', 'group-create', @{}, $body, "+ group $name (role-assignable, assigned membership); rerun the plan after it exists to add its schedules and policies", $name, '', ''))
            continue
        }
        $gid = $st.Group.id
        foreach ($a in $script:AccessIds) {
            $pa = @($st.Policies | Where-Object { $_.roleDefinitionId -eq $a }) | Select-Object -First 1
            if ($pa) {
                foreach ($diff in Compare-PaPgPolicy -Current $pa.policy -Desired (New-PaPgRuleSet -Setting $PolicySetting[$a][$d.tier] -ApproverGroupId $Config.approverGroups[$d.tier])) {
                    $rules.Add(@('policy-rule', 'pim-group-policy-rule-update', @{ policyId = $pa.policyId; ruleId = $diff.RuleId }, $diff.Body, "~ $name $a $($diff.RuleId): $($diff.Current) -> $($diff.Desired)", $name, $a, ''))
                }
            }
        }
        $cur = @(Get-PaPgCurrent $st)
        foreach ($a in $script:AccessIds) {
            foreach ($kind in 'eligible', 'active') {
                $callId = if ($kind -eq 'eligible') { 'pim-group-eligibility-request' } else { 'pim-group-assignment-request' }
                $opName = if ($kind -eq 'eligible') { 'eligibility' } else { 'assignment' }
                foreach ($e in @($d[$a][$kind])) {
                    $have = @($cur | Where-Object { $_.Kind -eq $kind -and $_.Access -eq $a -and $_.PrincipalId -eq $e.principalId }) | Select-Object -First 1
                    $who = if ($e.principalName) { $e.principalName } else { $e.principalId }
                    $end = if ($e.endDateTime) { ([datetime]$e.endDateTime).ToUniversalTime() } else { $null }
                    $endText = if ($end) { $end.ToString('yyyy-MM-dd') } else { 'permanent' }
                    if (-not $have) {
                        $grants.Add(@("$opName-adminAssign", $callId, @{}, (New-PaPgScheduleBody $gid $a $e.principalId 'adminAssign' $e $AsOf), "+ $kind $a $name $who until $endText ($($e.ticket))", $name, $a, $who))
                    } elseif ($have.End -ne $end) {
                        $was = if ($have.End) { $have.End.ToString('yyyy-MM-dd') } else { 'permanent' }
                        $grants.Add(@("$opName-adminUpdate", $callId, @{}, (New-PaPgScheduleBody $gid $a $e.principalId 'adminUpdate' $e $AsOf), "~ $kind $a $name $who end $was -> $endText ($($e.ticket))", $name, $a, $who))
                    }
                }
                foreach ($r in @($cur | Where-Object { $_.Kind -eq $kind -and $_.Access -eq $a })) {
                    if (-not @($d[$a][$kind] | Where-Object { $_.principalId -eq $r.PrincipalId }).Count) {
                        $removes.Add(@("$opName-adminRemove", $callId, @{}, (New-PaPgScheduleBody $gid $a $r.PrincipalId 'adminRemove' $null $AsOf), "- $kind $a $name $($r.Name)", $name, $a, $r.Name))
                    }
                }
            }
        }
    }
    foreach ($set in $creates, $rules, $grants, $removes) { foreach ($x in $set) { & $add @x } }
    $i = 0; foreach ($o in $ops) { $o.Seq = ++$i }
    [pscustomobject]@{ Cloud = $Cloud; AsOf = $AsOf.ToUniversalTime().ToString('o'); Operations = $ops.ToArray(); Permissions = @($ops | ForEach-Object { $_.Permissions } | Sort-Object -Unique) }
}

function Test-PaPgPlanGuard {
    <#
    .SYNOPSIS
        The plan's guards. Each returns a reason; any reason stops -Apply. PA-PG-G1 a T0 or T1
        policy losing approval or its approvers; G2 a permanent or open-ended grant; G3 a group
        approving itself; G4 an eligible owner left with no active owner; G5 a group or an eligible
        service principal as a holder; G6 more removals than -MaxRemovals; G7 a self-service action.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Plan, [Parameter(Mandatory)]$Config, [int]$MaxRemovals = 5)
    $why = [Collections.Generic.List[string]]::new()
    $tier = @{}; foreach ($g in $Config.groups) { $tier[$g.displayName] = $g.tier; $tier["id:$($g.id)"] = $g.tier }
    foreach ($o in $Plan.Operations) {
        if ($o.Op -eq 'policy-rule' -and $o.Body.id -eq 'Approval_EndUser_Assignment' -and $tier[$o.Group] -in 'T0', 'T1') {
            $s = $o.Body.setting
            $n = @(foreach ($st in @($s.approvalStages)) { @($st.primaryApprovers) | Where-Object { $_ } }).Count
            if (-not $s.isApprovalRequired -or $n -lt 1) { $why.Add("PA-PG-G1: $($o.Group) $($o.Access) would lose approval or its approvers") }
            foreach ($st in @($s.approvalStages)) { foreach ($p in @($st.primaryApprovers)) { if ($p -and $p.groupId -and $p.groupId -eq ($Config.groups | Where-Object displayName -EQ $o.Group).id) { $why.Add("PA-PG-G3: $($o.Group) would approve its own activations") } } }
        }
        if ($o.Op -eq 'policy-rule' -and $o.Body.id -like 'Expiration_*' -and -not $o.Body.isExpirationRequired) { $why.Add("PA-PG-G2: $($o.Group) $($o.Access) $($o.Body.id) would allow permanent grants") }
        if ($o.Op -like '*-adminAssign' -or $o.Op -like '*-adminUpdate') {
            $e = $o.Body.scheduleInfo.expiration
            if (-not $e -or $e['type'] -ne 'afterDateTime' -or -not (Get-PaPgValue $e 'endDateTime')) { $why.Add("PA-PG-G2: $($o.Op) for $($o.Principal) in $($o.Group) has no end date") }
        }
        if ($o.Body -and $o.Body.Contains('action') -and [string]$o.Body.action -like 'self*') { $why.Add("PA-PG-G7: $($o.Op) is a self-service action; the plan only makes admin requests") }
    }
    foreach ($g in $Config.groups) {
        if (@($g.owner.eligible).Count -and -not @($g.owner.active).Count) { $why.Add("PA-PG-G4: $($g.displayName) would have eligible owners and no active owner") }
        foreach ($a in $script:AccessIds) {
            foreach ($e in @($g[$a].active) + @($g[$a].eligible)) { if ($e.principalType -eq 'group') { $why.Add("PA-PG-G5: $($g.displayName) would hold the group $($e.principalId)") } }
            foreach ($e in @($g[$a].eligible)) { if ($e.principalType -eq 'servicePrincipal') { $why.Add("PA-PG-G5: $($g.displayName) would make a service principal eligible") } }
        }
    }
    $rm = @($Plan.Operations | Where-Object { $_.Op -like '*-adminRemove' }).Count
    if ($rm -gt $MaxRemovals) { $why.Add("PA-PG-G6: $rm removals is more than $MaxRemovals; review them and rerun with a higher -MaxRemovals") }
    , $why.ToArray()
}

function Invoke-PaPgPlan {
    <#
    .SYNOPSIS
        Without -Apply, a dry run: returns each operation as 'DryRun' and sends nothing. With
        -Apply, refuses if any guard fails, then sends each operation in order through declared
        write calls on the cloud's own host, and stops at the first error.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Plan, [Parameter(Mandatory)]$Config, [Parameter(Mandatory)]$Client, [switch]$Apply, [int]$MaxRemovals = 5)
    if ($Client.Task -ne 'pim-groups-apply') { throw "The client is for '$($Client.Task)'; writing needs 'pim-groups-apply'" }
    if ($Plan.Cloud -ne $Client.Cloud.Name) { throw "The plan is for '$($Plan.Cloud)', the client for '$($Client.Cloud.Name)'" }
    $guards = Test-PaPgPlanGuard -Plan $Plan -Config $Config -MaxRemovals $MaxRemovals
    $results = [Collections.Generic.List[object]]::new()
    if (-not $Apply) {
        foreach ($o in $Plan.Operations) { $results.Add([pscustomobject]@{ Seq = $o.Seq; Op = $o.Op; Status = 'DryRun'; Diff = $o.Diff }) }
        return [pscustomobject]@{ Applied = $false; Guards = $guards; Results = $results.ToArray() }
    }
    if ($guards.Count) { throw "Refusing to apply: $($guards -join '; ')" }
    foreach ($o in $Plan.Operations) {
        $call = $Client.Calls | Where-Object { $_.id -eq $o.CallId }
        if (-not $call -or $call.method -ne $o.Method -or $call.method -eq 'GET') { throw "Operation $($o.Seq) isn't a declared write: $($o.CallId)" }
        Assert-PaPgHost -Uri $o.Uri -Graph $Client.Cloud.Graph
        $Client.Evidence.Add([pscustomobject]@{ Call = $o.CallId; Method = $o.Method; Uri = $o.Uri; At = [DateTime]::UtcNow.ToString('o') })
        try { $null = & $Client.Invoke $o.Method $o.Uri $o.Body; $results.Add([pscustomobject]@{ Seq = $o.Seq; Op = $o.Op; Status = 'Sent'; Diff = $o.Diff }) }
        catch { $results.Add([pscustomobject]@{ Seq = $o.Seq; Op = $o.Op; Status = "Failed: $($_.Exception.Message)"; Diff = $o.Diff }); break }
    }
    [pscustomobject]@{ Applied = $true; Guards = $guards; Results = $results.ToArray() }
}

function Export-PaPgRun {
    <# Writes the run's files and a manifest with each file's SHA-256, the cloud, the mode and every request. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$Task, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [string]$TenantId)
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name; $v = $Files[$name]
        $text = if ($v -is [string]) { $v } else { ($v | ConvertTo-Json -Depth 30) + "`n" }
        [IO.File]::WriteAllText($p, $text, [Text.UTF8Encoding]::new($false))
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $manifest = [ordered]@{ task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = (Get-PaPgRequiredPermission -Task $Task).GraphPermissions
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; at = $_.At } }); files = $hashes }
    [IO.File]::WriteAllText((Join-Path $OutputPath 'manifest.json'), ($manifest | ConvertTo-Json -Depth 10) + "`n", [Text.UTF8Encoding]::new($false))
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-PaPgCall, Get-PaPgRequiredPermission, Get-PaPgPolicySetting, New-PaPgClient, Invoke-PaPgList, New-PaPgFixtureInvoker,
    Invoke-PaPgFake, New-PaPgLiveInvoker, Read-PaPrvGroupConfig, Test-PaPrvGroupConfig, Get-PaPgTenantState, Test-PaPgTenant, New-PaPgRuleSet,
    Compare-PaPgPolicy, New-PaPimGroupPlan, Test-PaPgPlanGuard, Invoke-PaPgPlan, Export-PaPgRun
