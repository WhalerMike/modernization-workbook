#Requires -Version 7.1
<#
    PimEntraRoles: Chapter 04 of the developer workbook "Building Privileged Access".

    PIM role settings for Microsoft Entra roles as reviewed JSON, one file per role
    (config/pim-ch04/roles), compared with the tenant's role management policies and applied
    through roleManagementPolicies rules; eligibility for the PRV groups through
    roleEligibilityScheduleRequests; and the conversion of standing assignments, eligible first.

    Every call is declared in config/calls-ch04.json with its least-privileged permission. Reads
    and writes are separate tasks. The default is a dry run: a plan, a diff and a manifest, and no
    write. A write happens only through Invoke-PaPimPlan with a client built with -AllowWrite,
    which the entry script builds only with -Apply. Illustrative: tested against fixtures and a
    fake, not a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Chapter 01's module, for the cloud table (Get-PaCloud). Not -Force: a caller's copy stays loaded.
Import-Module (Join-Path $PSScriptRoot '../PrivilegedAccess/PrivilegedAccess.psm1')

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
$script:GlobalAdmin = '62e90394-69f5-4237-9190-012177145e10'
$script:PrivRoleAdmin = 'e8611ab8-c189-46e8-94e1-60213ab1f814'
$script:Tasks = @('pim-plan', 'pim-apply', 'pim-convert')

# The seven rules this chapter manages, with the target each one carries (Learn, Rules in PIM).
# The other ten (Enablement_Admin_Eligibility and the nine notification rules) are read and left alone.
$script:ManagedRules = [ordered]@{
    'Expiration_EndUser_Assignment'            = @{ Type = 'unifiedRoleManagementPolicyExpirationRule'; Caller = 'EndUser'; Level = 'Assignment' }
    'Enablement_EndUser_Assignment'            = @{ Type = 'unifiedRoleManagementPolicyEnablementRule'; Caller = 'EndUser'; Level = 'Assignment' }
    'AuthenticationContext_EndUser_Assignment' = @{ Type = 'unifiedRoleManagementPolicyAuthenticationContextRule'; Caller = 'EndUser'; Level = 'Assignment' }
    'Approval_EndUser_Assignment'              = @{ Type = 'unifiedRoleManagementPolicyApprovalRule'; Caller = 'EndUser'; Level = 'Assignment' }
    'Expiration_Admin_Eligibility'             = @{ Type = 'unifiedRoleManagementPolicyExpirationRule'; Caller = 'Admin'; Level = 'Eligibility' }
    'Expiration_Admin_Assignment'              = @{ Type = 'unifiedRoleManagementPolicyExpirationRule'; Caller = 'Admin'; Level = 'Assignment' }
    'Enablement_Admin_Assignment'              = @{ Type = 'unifiedRoleManagementPolicyEnablementRule'; Caller = 'Admin'; Level = 'Assignment' }
}

# ----------------------------------------------------------------------------- calls and permissions

function Get-PaPimCall {
    <# The declared calls, optionally for one task or one id. #>
    [CmdletBinding()]
    param([string]$Task, [string]$Id)
    $all = @((Get-Content -LiteralPath (Join-Path $script:ConfigRoot 'calls-ch04.json') -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    if ($Id) { $all = @($all | Where-Object { $_.id -eq $Id }) }
    , $all
}

function Get-PaPimRequiredPermission {
    <# The union of a task's Graph permissions, split into reads and writes. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('pim-plan', 'pim-apply', 'pim-convert')][string]$Task)
    $calls = Get-PaPimCall -Task $Task
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        Read             = @($calls | Where-Object method -EQ 'GET' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        Write            = @($calls | Where-Object method -NE 'GET' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        DelegatedRole    = if (@($calls | Where-Object method -NE 'GET').Count) { 'Privileged Role Administrator' } else { 'Global Reader' }
    }
}

# ----------------------------------------------------------------------------- configuration

function ConvertTo-PaPimDuration {
    <# An ISO 8601 duration (PT4H, P90D) as a TimeSpan. Anything else throws. #>
    param([Parameter(Mandatory)][string]$Value)
    try { [System.Xml.XmlConvert]::ToTimeSpan($Value) } catch { throw "'$Value' isn't an ISO 8601 duration" }
}

function Read-PaPimTierConfig {
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'pim-ch04/tiers.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Read-PaPimRoleSetting {
    <#
    .SYNOPSIS
        Read the role files (one file, or every *.json in a folder). A file with a missing key,
        an ID that isn't a GUID, an unknown tier or a duration that isn't ISO 8601 throws: a
        malformed file never reaches the tenant.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $files = if (Test-Path -LiteralPath $Path -PathType Container) { @(Get-ChildItem -LiteralPath $Path -Filter *.json | Sort-Object Name) } else { @(Get-Item -LiteralPath $Path) }
    $seen = @{}
    foreach ($f in $files) {
        $s = Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json -AsHashtable
        $where = $f.Name
        foreach ($k in 'role', 'roleTemplateId', 'tier', 'activation', 'approval', 'assignment', 'eligibleTo') {
            if (-not $s.ContainsKey($k)) { throw "${where}: '$k' is required" }
        }
        if ($s.roleTemplateId -notmatch $script:Guid) { throw "${where}: roleTemplateId must be the role's template ID" }
        if ($s.tier -notin @('T0', 'T1', 'T2', 'RO')) { throw "${where}: unknown tier '$($s.tier)'" }
        foreach ($k in 'maximumDuration', 'requireMfa', 'requireJustification', 'requireTicket') { if (-not $s.activation.ContainsKey($k)) { throw "${where}: activation.$k is required" } }
        foreach ($k in 'required', 'approvers') { if (-not $s.approval.ContainsKey($k)) { throw "${where}: approval.$k is required" } }
        foreach ($k in 'allowPermanentEligible', 'eligibleMaximumDuration', 'allowPermanentActive', 'activeMaximumDuration', 'requireMfaOnActive', 'requireJustificationOnActive') {
            if (-not $s.assignment.ContainsKey($k)) { throw "${where}: assignment.$k is required" }
        }
        foreach ($d in $s.activation.maximumDuration, $s.assignment.eligibleMaximumDuration, $s.assignment.activeMaximumDuration) { $null = ConvertTo-PaPimDuration $d }
        if (-not $s.activation.ContainsKey('authenticationContext')) { $s.activation.authenticationContext = $null }
        if ($s.activation.authenticationContext -and $s.activation.authenticationContext -notmatch '^c([1-9]|[1-9][0-9])$') { throw "${where}: authenticationContext must be c1 to c99" }
        if ($seen.ContainsKey($s.roleTemplateId)) { throw "${where}: $($s.role) is also defined in $($seen[$s.roleTemplateId])" }
        $seen[$s.roleTemplateId] = $where
        $s['file'] = $where
        $s
    }
}

function Read-PaPimBinding {
    <# The tenant's object IDs for the role files' names: approver groups and PRV eligibility. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $b = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    foreach ($k in 'approverGroups', 'eligibility') { if (-not $b.ContainsKey($k)) { throw "bindings: '$k' is required" } }
    foreach ($alias in @($b.approverGroups.Keys)) { if ($b.approverGroups[$alias] -notmatch $script:Guid) { throw "bindings: approver group '$alias' must be an object ID" } }
    foreach ($e in $b.eligibility) {
        if ($e.groupId -notmatch $script:Guid -or $e.roleTemplateId -notmatch $script:Guid) { throw "bindings: eligibility for '$($e.role)' needs a groupId and roleTemplateId" }
        if (-not $e.directoryScopeId) { throw "bindings: eligibility for '$($e.role)' needs a directoryScopeId" }
    }
    $b
}

function Get-PaPimWaveRole {
    <# The role files in one rollout wave, or in every wave before it with -Before. #>
    param([object[]]$Settings, $Tiers, [int]$Wave, [switch]$Before)
    $waves = @($Tiers.rollout | Where-Object { if ($Before) { $_.wave -lt $Wave } else { $_.wave -eq $Wave } })
    if (-not $Before -and -not $waves) { throw "No rollout wave $Wave in tiers.json" }
    $tiers = @($waves | ForEach-Object { $_.tiers })
    @($Settings | Where-Object { $tiers -contains $_.tier })
}

# ----------------------------------------------------------------------------- the desired rules

function New-PaPimRuleTarget {
    param([string]$Caller, [string]$Level)
    [ordered]@{ '@odata.type' = 'microsoft.graph.unifiedRoleManagementPolicyRuleTarget'; caller = $Caller; operations = @('All'); level = $Level; inheritableSettings = @(); enforcedSettings = @() }
}

function ConvertTo-PaPimRule {
    <#
    .SYNOPSIS
        One role file as the seven PATCH bodies for its policy's rules, in Learn's shapes (Update
        rules in PIM): each body carries the derived @odata.type, the rule id and its target.
        Approver aliases are resolved through the bindings; an alias with no group throws.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Setting, [Parameter(Mandatory)]$Binding)
    $a = $Setting.activation; $p = $Setting.approval; $s = $Setting.assignment
    $t = { param($id) New-PaPimRuleTarget -Caller $script:ManagedRules[$id].Caller -Level $script:ManagedRules[$id].Level }
    $odata = { param($id) "#microsoft.graph.$($script:ManagedRules[$id].Type)" }

    $endUser = @()
    if ($a.requireJustification) { $endUser += 'Justification' }
    if ($a.requireMfa) { $endUser += 'MultiFactorAuthentication' }
    if ($a.requireTicket) { $endUser += 'Ticketing' }
    $admin = @()
    if ($s.requireJustificationOnActive) { $admin += 'Justification' }
    if ($s.requireMfaOnActive) { $admin += 'MultiFactorAuthentication' }

    $approvers = @(foreach ($alias in @($p.approvers)) {
            if (-not $Binding.approverGroups.ContainsKey($alias)) { throw "$($Setting.role): approver '$alias' has no group in the bindings" }
            [ordered]@{ '@odata.type' = '#microsoft.graph.groupMembers'; groupId = $Binding.approverGroups[$alias] }
        })

    $rules = [ordered]@{}
    $id = 'Expiration_EndUser_Assignment'
    $rules[$id] = [ordered]@{ '@odata.type' = (& $odata $id); id = $id; isExpirationRequired = $true; maximumDuration = $a.maximumDuration; target = (& $t $id) }
    $id = 'Enablement_EndUser_Assignment'
    $rules[$id] = [ordered]@{ '@odata.type' = (& $odata $id); id = $id; enabledRules = @($endUser); target = (& $t $id) }
    $id = 'AuthenticationContext_EndUser_Assignment'
    $rules[$id] = [ordered]@{ '@odata.type' = (& $odata $id); id = $id; isEnabled = [bool]$a.authenticationContext; claimValue = $a.authenticationContext; target = (& $t $id) }
    $id = 'Approval_EndUser_Assignment'
    $rules[$id] = [ordered]@{
        '@odata.type' = (& $odata $id); id = $id; target = (& $t $id)
        setting       = [ordered]@{
            '@odata.type'                    = 'microsoft.graph.approvalSettings'
            isApprovalRequired               = [bool]$p.required
            isApprovalRequiredForExtension   = $false
            isRequestorJustificationRequired = $true
            approvalMode                     = 'SingleStage'
            approvalStages                   = @([ordered]@{
                    approvalStageTimeOutInDays = 1; isApproverJustificationRequired = $true; escalationTimeInMinutes = 0
                    isEscalationEnabled = $false; primaryApprovers = @($approvers); escalationApprovers = @()
                })
        }
    }
    $id = 'Expiration_Admin_Eligibility'
    $rules[$id] = [ordered]@{ '@odata.type' = (& $odata $id); id = $id; isExpirationRequired = -not $s.allowPermanentEligible; maximumDuration = $s.eligibleMaximumDuration; target = (& $t $id) }
    $id = 'Expiration_Admin_Assignment'
    $rules[$id] = [ordered]@{ '@odata.type' = (& $odata $id); id = $id; isExpirationRequired = -not $s.allowPermanentActive; maximumDuration = $s.activeMaximumDuration; target = (& $t $id) }
    $id = 'Enablement_Admin_Assignment'
    $rules[$id] = [ordered]@{ '@odata.type' = (& $odata $id); id = $id; enabledRules = @($admin); target = (& $t $id) }
    $rules
}

# ----------------------------------------------------------------------------- the config checks

function New-PaPimFinding {
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$Object, [string]$Issue)
    [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Object = $Object; Issue = $Issue }
}

function Test-PaPimSetting {
    <#
    .SYNOPSIS
        Check the role files before anything is read from the tenant: PA-PIM-01 (approval with no
        approver: half of Learn's documented lockout), PA-PIM-03 (approvers who are the eligible
        group), PA-PIM-04 (outside Learn's bounds or the tier's cap) and PA-PIM-05 (an
        authentication context, whose Conditional Access policy must be On first).
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Settings, [Parameter(Mandatory)]$Binding, [Parameter(Mandatory)]$Tiers)
    $f = [Collections.Generic.List[object]]::new()
    $lb = $Tiers.learnBounds
    foreach ($s in $Settings) {
        $cap = $Tiers.tierCaps[$s.tier]
        $act = ConvertTo-PaPimDuration $s.activation.maximumDuration
        if ($s.approval.required -and -not @($s.approval.approvers).Count) {
            $f.Add((New-PaPimFinding 'PA-PIM-01' 'Finding' $s.role 'Approval required with no approver: the active Privileged Role and Global Administrators become the approvers, which is how Learn''s documented lockout happens'))
        }
        foreach ($alias in @($s.approval.approvers)) {
            $gid = $Binding.approverGroups[$alias]
            if ($gid -and @($Binding.eligibility | Where-Object { $_.roleTemplateId -eq $s.roleTemplateId -and $_.groupId -eq $gid }).Count) {
                $f.Add((New-PaPimFinding 'PA-PIM-03' 'Finding' $s.role "Approver group $alias is also the group eligible for the role: approval becomes sign-off by peers"))
            }
        }
        if ($act -lt (ConvertTo-PaPimDuration $lb.minimumActivation) -or $act -gt (ConvertTo-PaPimDuration $lb.maximumActivation)) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role "Activation $($s.activation.maximumDuration) is outside $($lb.minimumActivation) to $($lb.maximumActivation)"))
        } elseif ($act -gt (ConvertTo-PaPimDuration $cap.maximumActivation)) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role "Activation $($s.activation.maximumDuration) exceeds the $($s.tier) cap of $($cap.maximumActivation)"))
        }
        if ($s.assignment.allowPermanentEligible) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role 'Permanent eligible assignment allowed; every tier bounds eligibility'))
        } elseif ((ConvertTo-PaPimDuration $s.assignment.eligibleMaximumDuration) -gt (ConvertTo-PaPimDuration $cap.maximumEligibility)) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role "Eligibility $($s.assignment.eligibleMaximumDuration) exceeds the $($s.tier) cap of $($cap.maximumEligibility)"))
        }
        if ($Tiers.ContainsKey('maximumActive') -and (ConvertTo-PaPimDuration $s.assignment.activeMaximumDuration) -gt (ConvertTo-PaPimDuration $Tiers.maximumActive)) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role "Active assignments of $($s.assignment.activeMaximumDuration) exceed the decided maximum of $($Tiers.maximumActive)"))
        }
        if ($s.assignment.allowPermanentActive -and $s.roleTemplateId -ne $script:GlobalAdmin) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role 'Permanent active assignment allowed; only Global Administrator allows it, for the emergency accounts'))
        }
        if ($cap.approvalRequired -and -not $s.approval.required) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role "$($s.tier) requires approval"))
        }
        if ($cap.ticketRequired -and -not $s.activation.requireTicket) {
            $f.Add((New-PaPimFinding 'PA-PIM-04' 'Finding' $s.role "$($s.tier) requires ticket information on activation"))
        }
        if ($s.activation.authenticationContext) {
            $f.Add((New-PaPimFinding 'PA-PIM-05' 'Warn' $s.role "Requires authentication context $($s.activation.authenticationContext): its Conditional Access policy must be On before the rule is set (Chapter 03); confirm it, then pass -ActivationGateChecked"))
        }
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the client

function New-PaPimClient {
    <#
    .SYNOPSIS
        A client for one task in one cloud. -Invoke is { param($Method, $Uri, $Body) } returning
        the parsed body as a hashtable (or $null for 204): the fake from New-PaPimFixtureInvoker
        or New-PaPimLiveInvoker. Without -AllowWrite every method but GET throws, whatever the task.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][ValidateSet('pim-plan', 'pim-apply', 'pim-convert')][string]$Task,
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [switch]$AllowWrite
    )
    if ($AllowWrite -and $Task -eq 'pim-plan') { throw 'pim-plan only reads; -AllowWrite needs pim-apply or pim-convert' }
    [pscustomobject]@{
        Cloud      = Get-PaCloud -Cloud $Cloud
        Task       = $Task
        Calls      = Get-PaPimCall -Task $Task
        Invoke     = $Invoke
        AllowWrite = [bool]$AllowWrite
        Evidence   = [Collections.Generic.List[object]]::new()
    }
}

function Invoke-PaPimRequest {
    <#
    .SYNOPSIS
        Send one declared call. GET follows every @odata.nextLink on the cloud's own host. PATCH and
        POST need a client built with -AllowWrite. Every request is recorded, writes with the
        SHA-256 of their body.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query, $Body)
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch04.json with its permission" }
    if ($call.method -ne 'GET' -and -not $Client.AllowWrite) { throw "Refusing $($call.method) $CallId`: this is a dry run (no -Apply)" }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [Uri]::EscapeDataString([string]$Bind[$k])) }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    $graph = $Client.Cloud.Graph
    $uri = "$graph/$($call.version)$path"
    if ($Query) { $uri += "?$Query" }
    $record = { param($u, $h) $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $call.method; Uri = $u; BodySha256 = $h; At = [DateTime]::UtcNow.ToString('o') }) }
    if ($call.method -ne 'GET') {
        if (-not $uri.StartsWith("$graph/", [StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to send the token to $uri" }
        $json = $Body | ConvertTo-Json -Depth 20 -Compress
        $hash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($json))).ToLowerInvariant()
        & $record $uri $hash
        return & $Client.Invoke $call.method $uri $Body
    }
    $items = [Collections.Generic.List[object]]::new()
    while ($uri) {
        if (-not $uri.StartsWith("$graph/", [StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to send the token to $uri`: not $graph" }
        & $record $uri $null
        $resp = & $Client.Invoke 'GET' $uri $null
        if ($null -eq $resp) { throw "No response for $uri" }
        if ($resp.ContainsKey('value')) { foreach ($v in @($resp['value'])) { $items.Add($v) } } else { $items.Add($resp) }
        $uri = if ($resp.ContainsKey('@odata.nextLink')) { $resp['@odata.nextLink'] } else { $null }
    }
    $items.ToArray()
}

function New-PaPimLiveInvoker {
    <#
    .SYNOPSIS
        Graph through Invoke-MgGraphRequest. Refuses to start if the session is in another cloud.
        Sign in first: Connect-MgGraph -Environment <GraphEnvironment> with the task's permissions.
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
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the tenant

function Get-PaPimTenantState {
    <#
    .SYNOPSIS
        Read what the plan needs: for each role, its policy and rules (Learn's Example 2, one call
        per role), every eligibility schedule, and every active assignment instance with its
        principal. GET only.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][object[]]$Settings)
    $policies = @{}
    foreach ($s in $Settings) {
        $q = "`$filter=" + [Uri]::EscapeDataString("scopeId eq '/' and scopeType eq 'DirectoryRole' and roleDefinitionId eq '$($s.roleTemplateId)'") + "&`$expand=" + [Uri]::EscapeDataString('policy($expand=rules)')
        $rows = @(Invoke-PaPimRequest -Client $Client -CallId 'pim-policy-assignment' -Query $q)
        if ($rows.Count -eq 1 -and $rows[0].ContainsKey('policy') -and $rows[0].policy) {
            $rules = @{}; foreach ($r in @($rows[0].policy.rules)) { $rules[$r.id] = $r }
            $policies[$s.roleTemplateId] = [pscustomobject]@{ PolicyId = $rows[0].policyId; Rules = $rules }
        }
    }
    [pscustomobject]@{
        Policies    = $policies
        Eligibility = @(Invoke-PaPimRequest -Client $Client -CallId 'pim-eligibility-schedules' -Query "`$expand=principal")
        Active      = @(Invoke-PaPimRequest -Client $Client -CallId 'pim-active-instances' -Query "`$expand=principal")
    }
}

# ----------------------------------------------------------------------------- the diff

function Get-PaPimRuleView {
    # The properties of a rule this chapter owns, normalized so the tenant and the file compare:
    # durations as TimeSpans, enabled rules and approvers sorted, nothing that doesn't apply.
    param([string]$RuleId, $Rule)
    $v = [ordered]@{}
    if ($null -eq $Rule) { $v['present'] = 'missing'; return $v }
    $g = { param($h, $k) if ($h -is [System.Collections.IDictionary] -and $h.Contains($k)) { $h[$k] } else { $null } }
    switch -Wildcard ($RuleId) {
        'Expiration_*' {
            $req = [bool](& $g $Rule 'isExpirationRequired')
            $v['isExpirationRequired'] = $req
            if ($req) { $d = & $g $Rule 'maximumDuration'; $v['maximumDuration'] = if ($d) { (ConvertTo-PaPimDuration $d).ToString() } else { $null } }
        }
        'Enablement_*' { $v['enabledRules'] = (@(& $g $Rule 'enabledRules') | Where-Object { $_ } | Sort-Object) -join ',' }
        'AuthenticationContext_*' {
            $on = [bool](& $g $Rule 'isEnabled')
            $v['isEnabled'] = $on
            if ($on) { $v['claimValue'] = & $g $Rule 'claimValue' }
        }
        'Approval_*' {
            $st = & $g $Rule 'setting'
            $req = [bool](& $g $st 'isApprovalRequired')
            $v['isApprovalRequired'] = $req
            if ($req) {
                $stages = @(& $g $st 'approvalStages')
                $v['approvalMode'] = & $g $st 'approvalMode'
                $v['isRequestorJustificationRequired'] = [bool](& $g $st 'isRequestorJustificationRequired')
                $v['stages'] = $stages.Count
                $first = if ($stages.Count) { $stages[0] } else { @{} }
                $v['approvalStageTimeOutInDays'] = & $g $first 'approvalStageTimeOutInDays'
                $v['isApproverJustificationRequired'] = [bool](& $g $first 'isApproverJustificationRequired')
                $v['primaryApprovers'] = (@(& $g $first 'primaryApprovers') | Where-Object { $_ } | ForEach-Object {
                        $t = & $g $_ '@odata.type'
                        if ($t -like '*groupMembers') { "group:$(& $g $_ 'groupId')" } elseif ($t -like '*singleUser') { "user:$(& $g $_ 'userId')" } else { "$t" }
                    } | Sort-Object) -join ','
            }
        }
    }
    $v
}

function Compare-PaPimPolicy {
    <#
    .SYNOPSIS
        The differences between one role file and its policy in the tenant, one row per property
        of the seven managed rules. No rows means the tenant matches the file.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Setting, [Parameter(Mandatory)]$Binding, $Policy)
    $desired = ConvertTo-PaPimRule -Setting $Setting -Binding $Binding
    foreach ($id in $script:ManagedRules.Keys) {
        $want = Get-PaPimRuleView -RuleId $id -Rule $desired[$id]
        $have = Get-PaPimRuleView -RuleId $id -Rule $(if ($Policy -and $Policy.Rules.ContainsKey($id)) { $Policy.Rules[$id] } else { $null })
        $keys = @(@($want.Keys) + @($have.Keys) | Select-Object -Unique)
        foreach ($k in $keys) {
            $w = if ($want.Contains($k)) { $want[$k] } else { $null }
            $h = if ($have.Contains($k)) { $have[$k] } else { $null }
            if ("$w" -ne "$h") { [pscustomobject]@{ Role = $Setting.role; Tier = $Setting.tier; RuleId = $id; Property = $k; Tenant = "$h"; Desired = "$w" } }
        }
    }
}

# ----------------------------------------------------------------------------- eligibility

function New-PaPimEligibilityRequest {
    <#
    .SYNOPSIS
        An adminAssign roleEligibilityScheduleRequest body for a PRV group, starting -Start and
        lasting -Duration. A request longer than the role file's eligibility maximum, or with no
        end when the file doesn't allow permanent eligibility, throws before anything is sent:
        PIM would reject it with 400 for the expiration rule, or, if the tenant's rule is still
        looser, accept what the file forbids.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Setting, [Parameter(Mandatory)][string]$PrincipalId, [string]$DirectoryScopeId = '/',
        [Parameter(Mandatory)][datetime]$Start, [string]$Duration, [datetime]$End, [string]$Justification, [switch]$NoExpiration)
    if ($PrincipalId -notmatch $script:Guid) { throw "principalId '$PrincipalId' isn't an object ID" }
    # A date with no zone (2026-10-30) is UTC, so a plan reads the same on every machine.
    if ($Start.Kind -eq 'Unspecified') { $Start = [datetime]::SpecifyKind($Start, 'Utc') }
    $max = ConvertTo-PaPimDuration $Setting.assignment.eligibleMaximumDuration
    if ($NoExpiration) {
        if (-not $Setting.assignment.allowPermanentEligible) { throw "$($Setting.role): permanent eligibility isn't allowed (maximum $($Setting.assignment.eligibleMaximumDuration))" }
        $exp = [ordered]@{ type = 'noExpiration' }
    } elseif ($Duration) {
        if ((ConvertTo-PaPimDuration $Duration) -gt $max) { throw "$($Setting.role): eligibility of $Duration exceeds the maximum of $($Setting.assignment.eligibleMaximumDuration)" }
        $exp = [ordered]@{ type = 'afterDuration'; duration = $Duration }
    } elseif ($PSBoundParameters.ContainsKey('End')) {
        if (($End - $Start) -gt $max) { throw "$($Setting.role): eligibility to $($End.ToString('yyyy-MM-dd')) exceeds the maximum of $($Setting.assignment.eligibleMaximumDuration)" }
        $exp = [ordered]@{ type = 'afterDateTime'; endDateTime = $End.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'") }
    } else { throw 'Give -Duration, -End or -NoExpiration' }
    [ordered]@{
        action           = 'adminAssign'
        justification    = if ($Justification) { $Justification } else { "PIM as code: $($Setting.role) eligibility for its PRV group ($($Setting.file))" }
        roleDefinitionId = $Setting.roleTemplateId
        directoryScopeId = $DirectoryScopeId
        principalId      = $PrincipalId
        scheduleInfo     = [ordered]@{ startDateTime = $Start.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"); expiration = $exp }
    }
}

# ----------------------------------------------------------------------------- the plan

function Test-PaPimEmergencyAccess {
    # PA-PIM-02: the other half of the documented lockout. Each emergency account must hold Global
    # Administrator active, permanent and direct before any role setting changes.
    param($State, $Emergency)
    $ok = @(foreach ($a in @($Emergency.accounts)) {
            $hit = @($State.Active | Where-Object { $_.principalId -eq $a.id -and $_.roleDefinitionId -eq $script:GlobalAdmin -and $_.assignmentType -eq 'Assigned' -and $_.memberType -eq 'Direct' -and -not $_.endDateTime })
            if ($hit) { $a.id }
        })
    $min = if ($Emergency.ContainsKey('minimumAccounts')) { [int]$Emergency.minimumAccounts } else { 2 }
    if ($ok.Count -lt $min) {
        New-PaPimFinding 'PA-PIM-02' 'Finding' 'Emergency access' "$($ok.Count) of $(@($Emergency.accounts).Count) emergency accounts hold permanent active Global Administrator (need $min): run Chapter 02's check before any role setting changes"
    }
}

function New-PaPimPlan {
    <#
    .SYNOPSIS
        The plan for one rollout wave: the config checks, the lockout guard, the wave guard
        (PA-PIM-07: every earlier wave must match its files), the rule diff, the eligibility
        requests, and the standing assignments to convert. Writes nothing. Any Finding blocks.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Settings, [Parameter(Mandatory)]$Binding, [Parameter(Mandatory)]$Tiers,
        [Parameter(Mandatory)]$State, [Parameter(Mandatory)][int]$Wave, [Parameter(Mandatory)]$Emergency,
        [object[]]$Exceptions = @(), [object[]]$Confirmed = @(), [datetime]$AsOf = [datetime]::UtcNow, [string]$Cloud = 'gcc'
    )
    $graph = (Get-PaCloud -Cloud $Cloud).Graph
    $roles = Get-PaPimWaveRole -Settings $Settings -Tiers $Tiers -Wave $Wave
    $earlier = Get-PaPimWaveRole -Settings $Settings -Tiers $Tiers -Wave $Wave -Before
    $findings = [Collections.Generic.List[object]]::new()
    foreach ($x in @(Test-PaPimSetting -Settings $roles -Binding $Binding -Tiers $Tiers)) { $findings.Add($x) }
    $ea = Test-PaPimEmergencyAccess -State $State -Emergency $Emergency
    if ($ea) { $findings.Add($ea) }
    $exc = @{}; foreach ($e in $Exceptions) { $exc[$e.PrincipalId] = $e }
    $emergencyIds = @($Emergency.accounts | ForEach-Object { $_.id })

    # PA-PIM-07: the plan's order. A wave runs only when every earlier wave matches its files.
    foreach ($s in $earlier) {
        $pol = $State.Policies[$s.roleTemplateId]
        $d = @(if ($pol) { Compare-PaPimPolicy -Setting $s -Binding $Binding -Policy $pol })
        $missing = @($Binding.eligibility | Where-Object { $_.roleTemplateId -eq $s.roleTemplateId } | Where-Object {
                $b = $_; -not @($State.Eligibility | Where-Object { $_.principalId -eq $b.groupId -and $_.roleDefinitionId -eq $b.roleTemplateId -and $_.directoryScopeId -eq $b.directoryScopeId }).Count })
        if (-not $pol -or $d.Count -or $missing.Count) {
            $findings.Add((New-PaPimFinding 'PA-PIM-07' 'Finding' $s.role "Earlier wave ($($s.tier)) doesn't match its file yet: $($d.Count) rule difference(s), $($missing.Count) missing eligibility; finish it before wave $Wave"))
        }
    }

    $changes = [Collections.Generic.List[object]]::new()
    $actions = [Collections.Generic.List[object]]::new()
    foreach ($s in $roles) {
        $pol = $State.Policies[$s.roleTemplateId]
        if (-not $pol) { $findings.Add((New-PaPimFinding 'PA-PIM-06' 'Finding' $s.role 'No role management policy found for the role at tenant scope')); continue }
        $diff = @(Compare-PaPimPolicy -Setting $s -Binding $Binding -Policy $pol)
        foreach ($d in $diff) { $changes.Add($d) }
        $bodies = ConvertTo-PaPimRule -Setting $s -Binding $Binding
        foreach ($rid in @($diff | ForEach-Object { $_.RuleId } | Select-Object -Unique)) {
            $actions.Add([pscustomobject]@{
                    Kind = 'PatchRule'; Role = $s.role; Tier = $s.tier; Call = 'pim-policy-rule-update'; Method = 'PATCH'
                    Uri = "$graph/v1.0/policies/roleManagementPolicies/$($pol.PolicyId)/rules/$rid"; Bind = @{ policyId = $pol.PolicyId; ruleId = $rid }
                    Body = $bodies[$rid]; Status = 'Planned'; Detail = (@($diff | Where-Object RuleId -EQ $rid | ForEach-Object { "$($_.Property): $($_.Tenant) -> $($_.Desired)" }) -join '; ')
                })
        }
        # Eligibility for the bound PRV groups: create what's missing, report what isn't bound.
        $bound = @($Binding.eligibility | Where-Object { $_.roleTemplateId -eq $s.roleTemplateId })
        foreach ($b in $bound) {
            $has = @($State.Eligibility | Where-Object { $_.principalId -eq $b.groupId -and $_.roleDefinitionId -eq $s.roleTemplateId -and $_.directoryScopeId -eq $b.directoryScopeId })
            if (-not $has) {
                $body = New-PaPimEligibilityRequest -Setting $s -PrincipalId $b.groupId -DirectoryScopeId $b.directoryScopeId -Start $AsOf -Duration $s.assignment.eligibleMaximumDuration
                $actions.Add([pscustomobject]@{ Kind = 'AssignEligibility'; Role = $s.role; Tier = $s.tier; Call = 'pim-eligibility-request'; Method = 'POST'
                        Uri = "$graph/v1.0/roleManagement/directory/roleEligibilityScheduleRequests"; Bind = @{}; Body = $body; Status = 'Planned'
                        Detail = "$($b.groupName) eligible at $($b.directoryScopeId) for $($s.assignment.eligibleMaximumDuration)" })
            }
        }
        foreach ($e in @($State.Eligibility | Where-Object { $_.roleDefinitionId -eq $s.roleTemplateId })) {
            if (-not @($bound | Where-Object { $_.groupId -eq $e.principalId -and $_.directoryScopeId -eq $e.directoryScopeId }).Count) {
                $who = if ($e.principal -and $e.principal.displayName) { $e.principal.displayName } else { $e.principalId }
                $findings.Add((New-PaPimFinding 'PA-PIM-08' 'Warn' $s.role "$who is eligible outside the PRV group (schedule $($e.id)); the access review removes it (Chapter 07), this code doesn't"))
            }
        }
        # Standing assignments: eligible first, activation confirmed, then removed (Book 04, Chapter 08, Step 5).
        foreach ($i in @($State.Active | Where-Object { $_.roleDefinitionId -eq $s.roleTemplateId -and $_.assignmentType -eq 'Assigned' -and $_.memberType -eq 'Direct' })) {
            $ptype = if ($i.principal) { $i.principal['@odata.type'] } else { $null }
            $who = if ($i.principal -and $i.principal.displayName) { $i.principal.displayName } else { $i.principalId }
            if ($emergencyIds -contains $i.principalId) { $findings.Add((New-PaPimFinding 'PA-PIM-09' 'Info' $s.role "$who`: emergency access account, kept permanent active")); continue }
            if ($exc.ContainsKey($i.principalId)) { $findings.Add((New-PaPimFinding 'PA-PIM-09' 'Info' $s.role "$who`: documented exception ($($exc[$i.principalId].Reason))")); continue }
            if ($ptype -ne '#microsoft.graph.user') { $findings.Add((New-PaPimFinding 'PA-PIM-09' 'Warn' $s.role "$who ($ptype) holds the role standing: document it as an exception or replace it; this code removes users only")); continue }
            $findings.Add((New-PaPimFinding 'PA-PIM-09' 'Warn' $s.role "$who holds the role standing: convert to eligibility through the PRV group"))
            $ok = @($Confirmed | Where-Object { $_.PrincipalId -eq $i.principalId -and $_.RoleTemplateId -eq $s.roleTemplateId -and $_.Ticket })
            $eligibleNow = @($bound | Where-Object { $b = $_; @($State.Eligibility | Where-Object { $_.principalId -eq $b.groupId -and $_.roleDefinitionId -eq $s.roleTemplateId }).Count })
            $status = if (-not $eligibleNow) { 'WaitingForEligibility' } elseif (-not $ok) { 'WaitingForConfirmedActivation' } else { 'Confirmed' }
            $actions.Add([pscustomobject]@{ Kind = 'RemoveStanding'; Role = $s.role; Tier = $s.tier; Call = 'pim-assignment-request'; Method = 'POST'
                    Uri = "$graph/v1.0/roleManagement/directory/roleAssignmentScheduleRequests"; Bind = @{}
                    Body = [ordered]@{ action = 'adminRemove'; principalId = $i.principalId; roleDefinitionId = $s.roleTemplateId; directoryScopeId = $i.directoryScopeId
                        justification = "Converted to eligibility through the PRV group; activation confirmed ($(if ($ok) { $ok[0].Ticket } else { 'pending' }))" }
                    Status = $status; Detail = "$who standing $($s.role)" })
        }
    }
    $blocked = @($findings | Where-Object Severity -EQ 'Finding').Count -gt 0
    [pscustomobject]@{
        Wave = $Wave; Cloud = $Cloud; Roles = @($roles.role); Blocked = $blocked
        NeedsActivationGate = @($findings | Where-Object Rule -EQ 'PA-PIM-05').Count -gt 0
        Findings = $findings.ToArray(); Changes = $changes.ToArray(); Actions = $actions.ToArray()
    }
}

function Invoke-PaPimPlan {
    <#
    .SYNOPSIS
        Carry out a plan through a client built with -AllowWrite. -Kind Settings sends the rule
        PATCHes, then the eligibility requests (task pim-apply). -Kind Convert sends only the
        removals whose status is Confirmed (task pim-convert). A blocked plan, or one that sets an
        authentication context without -ActivationGateChecked, is refused before any request.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Plan, [Parameter(Mandatory)]$Client, [ValidateSet('Settings', 'Convert')][string]$Kind = 'Settings', [switch]$ActivationGateChecked)
    if (-not $Client.AllowWrite) { throw 'The client is read-only; build it with -AllowWrite (the entry script does so only with -Apply)' }
    if ($Plan.Blocked) { throw "The plan is blocked by $(@($Plan.Findings | Where-Object Severity -EQ 'Finding').Count) Finding(s); fix them and plan again" }
    $want = if ($Kind -eq 'Settings') { 'pim-apply' } else { 'pim-convert' }
    if ($Client.Task -ne $want) { throw "-Kind $Kind needs a $want client, not $($Client.Task)" }
    if ($Kind -eq 'Settings' -and $Plan.NeedsActivationGate -and -not $ActivationGateChecked) {
        throw 'The plan sets an authentication context: confirm its Conditional Access policy is On (Chapter 03), then pass -ActivationGateChecked'
    }
    $todo = if ($Kind -eq 'Settings') {
        @($Plan.Actions | Where-Object Kind -EQ 'PatchRule') + @($Plan.Actions | Where-Object Kind -EQ 'AssignEligibility') + @($Plan.Actions | Where-Object Kind -EQ 'RemoveEligibility')
    } else { @($Plan.Actions | Where-Object { $_.Kind -eq 'RemoveStanding' -and $_.Status -eq 'Confirmed' }) }
    foreach ($a in $todo) {
        $null = Invoke-PaPimRequest -Client $Client -CallId $a.Call -Bind $a.Bind -Body $a.Body
        $a.Status = 'Sent'
    }
    $todo
}

# ----------------------------------------------------------------------------- the back-out

function Get-PaPimBefore {
    <# The managed rules of each role in a wave as the tenant holds them now: the back-out record. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$State, [Parameter(Mandatory)][object[]]$Roles)
    $rows = @(foreach ($s in $Roles) {
            $pol = $State.Policies[$s.roleTemplateId]
            if (-not $pol) { continue }
            [ordered]@{ role = $s.role; roleTemplateId = $s.roleTemplateId; policyId = $pol.PolicyId
                rules = @(foreach ($id in $script:ManagedRules.Keys) { if ($pol.Rules.ContainsKey($id)) { $pol.Rules[$id] } }) }
        })
    # A deep copy, taken now: the record must not change when the tenant does.
    if (-not $rows.Count) { return }
    ConvertTo-Json -InputObject $rows -Depth 20 | ConvertFrom-Json -AsHashtable
}

function New-PaPimRestorePlan {
    <#
    .SYNOPSIS
        A plan that puts the managed rules back as before.json recorded them, and removes the
        eligibility a run created (the AssignEligibility actions in its plan.json, sent with
        adminRemove). Carried out by Invoke-PaPimPlan like any plan, with the same guards.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Before, [object[]]$AppliedActions = @(), [string]$Cloud = 'gcc')
    $graph = (Get-PaCloud -Cloud $Cloud).Graph
    $actions = [Collections.Generic.List[object]]::new()
    foreach ($b in $Before) {
        foreach ($r in @($b.rules)) {
            $body = [ordered]@{}; foreach ($k in @($r.Keys)) { if ($null -ne $r[$k]) { $body[$k] = $r[$k] } }
            $actions.Add([pscustomobject]@{ Kind = 'PatchRule'; Role = $b.role; Tier = $null; Call = 'pim-policy-rule-update'; Method = 'PATCH'
                    Uri = "$graph/v1.0/policies/roleManagementPolicies/$($b.policyId)/rules/$($r.id)"; Bind = @{ policyId = $b.policyId; ruleId = $r.id }
                    Body = $body; Status = 'Planned'; Detail = 'Restore as recorded in before.json' })
        }
    }
    foreach ($a in @($AppliedActions | Where-Object { $_.Kind -eq 'AssignEligibility' })) {
        $actions.Add([pscustomobject]@{ Kind = 'RemoveEligibility'; Role = $a.Role; Tier = $a.Tier; Call = 'pim-eligibility-request'; Method = 'POST'
                Uri = "$graph/v1.0/roleManagement/directory/roleEligibilityScheduleRequests"; Bind = @{}
                Body = [ordered]@{ action = 'adminRemove'; principalId = $a.Body.principalId; roleDefinitionId = $a.Body.roleDefinitionId; directoryScopeId = $a.Body.directoryScopeId; justification = 'Back-out of a PIM as code run' }
                Status = 'Planned'; Detail = 'Remove the eligibility the run created' })
    }
    [pscustomobject]@{ Wave = 0; Cloud = $Cloud; Roles = @($Before | ForEach-Object { $_.role }); Blocked = $false; NeedsActivationGate = $false; Findings = @(); Changes = @(); Actions = $actions.ToArray() }
}

# ----------------------------------------------------------------------------- the run

function Export-PaPimRun {
    <# Write a run's files and a manifest with each file's SHA-256, the permissions and every request. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud, [object[]]$Evidence = @(), [string]$TenantId, [string]$Mode = 'Fixture', [int]$Wave, [bool]$Applied)
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        $v = $Files[$name]
        $text = if ($name.EndsWith('.csv')) { ((@($v) | ConvertTo-Csv -NoTypeInformation) -join "`n") } else { ConvertTo-Json -InputObject $v -Depth 20 }
        [IO.File]::WriteAllText($p, $text + "`n", [Text.UTF8Encoding]::new($false))
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $perm = Get-PaPimRequiredPermission -Task $Task
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; wave = $Wave; applied = $Applied
        generated = [DateTime]::UtcNow.ToString('o'); graphPermissions = $perm.GraphPermissions; delegatedRole = $perm.DelegatedRole
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; bodySha256 = $_.BodySha256; at = $_.At } })
        files = $hashes
    }
    [IO.File]::WriteAllText((Join-Path $OutputPath 'manifest.json'), (ConvertTo-Json -InputObject $manifest -Depth 10) + "`n", [Text.UTF8Encoding]::new($false))
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

# ----------------------------------------------------------------------------- the fake

function New-PaPimFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Graph for Chapter 04, served from a fixture tenant file: GET of policy assignments
        (with Learn's $filter and $expand), eligibility schedules and active instances, in pages;
        PATCH of a rule (the @odata.type must match the rule's, as Learn requires; 204); POST of
        eligibility requests (checked against the policy's Expiration_Admin_Eligibility rule, as
        PIM does; 201) and of adminRemove assignment requests. Every call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [int]$PageSize = 2, [string]$Cloud = 'gcc')
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $state = [pscustomobject]@{ Tenant = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = (Get-PaCloud -Cloud $Cloud).Graph; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body) Invoke-PaPimFake -State $s -Method $Method -Uri $Uri -Body $Body }.GetNewClosure()
    $state
}

function Invoke-PaPimFake {
    param($State, [string]$Method, [string]$Uri, $Body)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
    $t = $State.Tenant
    $u = [Uri]$Uri
    if ("$($u.Scheme)://$($u.Host)" -ne $State.Graph) { throw "The fake refuses host $($u.Host)" }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    $page = {
        param([object[]]$All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $resp = @{ value = @($All | Select-Object -Skip $skip -First $State.PageSize) }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $resp['@odata.nextLink'] = "$($State.Graph)$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
        }
        $resp
    }
    $findPolicy = { param($id) @($t.policyAssignments | Where-Object { $_.policy.id -eq $id }) }
    switch ($Method) {
        'GET' {
            switch -Regex ($path) {
                '^/v1\.0/policies/roleManagementPolicyAssignments$' {
                    $f = $q['$filter']
                    if (-not $f -or $f -notmatch "scopeId eq '/' and scopeType eq '(Directory|DirectoryRole)'") { throw "400 the request needs `$filter on scopeId and scopeType" }
                    $rows = @($t.policyAssignments)
                    if ($f -match "roleDefinitionId eq '([^']+)'") { $rid = $Matches[1]; $rows = @($rows | Where-Object { $_.roleDefinitionId -eq $rid }) }
                    $expand = $q['$expand'] -eq 'policy($expand=rules)'
                    $out = @(foreach ($r in $rows) {
                            $o = @{ id = "$($r.policy.id)_$($r.roleDefinitionId)"; policyId = $r.policy.id; scopeId = '/'; scopeType = 'DirectoryRole'; roleDefinitionId = $r.roleDefinitionId }
                            if ($expand) { $o['policy'] = $r.policy }
                            $o
                        })
                    return & $page $out
                }
                '^/v1\.0/roleManagement/directory/roleEligibilitySchedules$' { return & $page @($t.roleEligibilitySchedules) }
                '^/v1\.0/roleManagement/directory/roleAssignmentScheduleInstances$' { return & $page @($t.roleAssignmentScheduleInstances) }
            }
            throw "The fake has no GET route for $path"
        }
        'PATCH' {
            if ($path -notmatch '^/v1\.0/policies/roleManagementPolicies/([^/]+)/rules/([^/]+)$') { throw "The fake has no PATCH route for $path" }
            $pid_ = $Matches[1]; $rid = $Matches[2]
            $pa = @(& $findPolicy $pid_)
            if (-not $pa) { throw "404 policy $pid_ not found" }
            $rule = @($pa[0].policy.rules | Where-Object { $_.id -eq $rid })
            if (-not $rule) { throw "404 rule $rid not found" }
            if (-not $Body.Contains('@odata.type') -or $Body['@odata.type'] -ne $rule[0]['@odata.type']) { throw "400 the body must carry @odata.type $($rule[0]['@odata.type'])" }
            foreach ($k in @($Body.Keys)) { if ($k -ne '@odata.type' -and $k -ne 'id') { $rule[0][$k] = $Body[$k] } }
            return $null
        }
        'POST' {
            if ($path -eq '/v1.0/roleManagement/directory/roleEligibilityScheduleRequests') {
                $act = "$($Body.action)".ToLowerInvariant()
                if ($act -eq 'adminremove') {
                    $t.roleEligibilitySchedules = @($t.roleEligibilitySchedules | Where-Object { -not ($_.principalId -eq $Body.principalId -and $_.roleDefinitionId -eq $Body.roleDefinitionId -and $_.directoryScopeId -eq $Body.directoryScopeId) })
                    return @{ status = 'Revoked'; action = 'adminRemove' }
                }
                if ($act -ne 'adminassign') { throw "The fake handles adminAssign and adminRemove, not $($Body.action)" }
                $pa = @($t.policyAssignments | Where-Object roleDefinitionId -EQ $Body.roleDefinitionId)
                if (-not $pa) { throw "404 role $($Body.roleDefinitionId)" }
                $rule = @($pa[0].policy.rules | Where-Object id -EQ 'Expiration_Admin_Eligibility')[0]
                $exp = $Body.scheduleInfo.expiration
                $start = [datetime]::Parse($Body.scheduleInfo.startDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
                $len = switch ("$($exp.type)".ToLowerInvariant()) {
                    'noexpiration' { [TimeSpan]::MaxValue }
                    'afterduration' { [System.Xml.XmlConvert]::ToTimeSpan($exp.duration) }
                    'afterdatetime' { [datetime]::Parse($exp.endDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) - $start }
                    default { throw "400 unknown expiration type $($exp.type)" }
                }
                if ($rule.isExpirationRequired -and $len -gt [System.Xml.XmlConvert]::ToTimeSpan($rule.maximumDuration)) { throw "400 ExpirationRule: the eligibility exceeds the role's maximum of $($rule.maximumDuration)" }
                $end = if ($len -eq [TimeSpan]::MaxValue) { $null } else { $start.Add($len).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'") }
                $id = "res-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
                $t.roleEligibilitySchedules = @($t.roleEligibilitySchedules) + @(@{ id = $id; principalId = $Body.principalId; roleDefinitionId = $Body.roleDefinitionId; directoryScopeId = $Body.directoryScopeId
                        memberType = 'Direct'; status = 'Provisioned'; scheduleInfo = @{ startDateTime = $Body.scheduleInfo.startDateTime; expiration = @{ type = $(if ($end) { 'afterDateTime' } else { 'noExpiration' }); endDateTime = $end } }
                        principal = @{ '@odata.type' = '#microsoft.graph.group'; id = $Body.principalId } })
                return @{ id = $id; status = 'Provisioned'; action = 'adminAssign' }
            }
            if ($path -eq '/v1.0/roleManagement/directory/roleAssignmentScheduleRequests') {
                if ("$($Body.action)" -ne 'adminRemove') { throw "The fake handles adminRemove only, not $($Body.action)" }
                $before = @($t.roleAssignmentScheduleInstances).Count
                $t.roleAssignmentScheduleInstances = @($t.roleAssignmentScheduleInstances | Where-Object { -not ($_.principalId -eq $Body.principalId -and $_.roleDefinitionId -eq $Body.roleDefinitionId -and $_.assignmentType -eq 'Assigned') })
                if (@($t.roleAssignmentScheduleInstances).Count -eq $before) { throw '404 no active assignment to remove' }
                return @{ status = 'Revoked'; action = 'adminRemove' }
            }
            throw "The fake has no POST route for $path"
        }
    }
    throw "The fake refuses $Method"
}

Export-ModuleMember -Function Get-PaPimCall, Get-PaPimRequiredPermission, ConvertTo-PaPimDuration, Read-PaPimTierConfig, Read-PaPimRoleSetting,
    Read-PaPimBinding, Get-PaPimWaveRole, ConvertTo-PaPimRule, Test-PaPimSetting, New-PaPimClient, Invoke-PaPimRequest, New-PaPimLiveInvoker,
    Get-PaPimTenantState, Get-PaPimRuleView, Compare-PaPimPolicy, New-PaPimEligibilityRequest, New-PaPimPlan, Invoke-PaPimPlan, Export-PaPimRun,
    Get-PaPimBefore, New-PaPimRestorePlan,
    New-PaPimFixtureInvoker, Invoke-PaPimFake
