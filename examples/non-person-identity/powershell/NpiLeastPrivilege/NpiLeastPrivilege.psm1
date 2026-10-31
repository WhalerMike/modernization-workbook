#Requires -Version 7.1
<#
    NpiLeastPrivilege: Chapter 07 of the developer workbook "Building Non-Person Identity".

    The permission sweep over Chapter 01's register: every service principal's application
    permissions (appRoleAssignments, on every resource) and delegated grants
    (oauth2PermissionGrants), its directory roles, and each managed identity's Azure role
    assignments. Broad tenant-wide permissions are checked against a reviewed list with a recorded
    justification per exception, a narrower replacement is proposed from Learn, privileged service
    principals are handed to the Privileged Access plan (A3.4), and the quarterly owner review is
    written as a packet. The owners' decisions become a dry-run plan; the only writes are the
    removal of one app role assignment (through the resource service principal) and the narrowing
    of one delegated grant, applied by Invoke-NpiLpPlan with -Apply after a reviewer approves the
    plan's SHA-256. Nothing here deletes a service principal or an application.

    Illustrative: tested against fixtures and fakes, not against a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:MaxPlanAgeDays = 7
$script:InScopeTypes = @('AppRegistration', 'ExternalServicePrincipal', 'LegacyServicePrincipal', 'ManagedIdentitySystemAssigned', 'ManagedIdentityUserAssigned', 'UnknownServicePrincipal')
$script:Chapter09Types = @('AgentIdentity', 'AgentIdentityBlueprint')
$script:GuidRx = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

# ----------------------------------------------------------------------------- the call list (calls-ch07.json)

function Get-NpiLpCallList {
    <#
    .SYNOPSIS
        Reads Chapter 07's call list (config/calls-ch07.json unless -Path names another file) and
        returns it as a hashtable of tasks and calls.
    .EXAMPLE
        # List the IDs of the calls Chapter 07 declares.
        (Get-NpiLpCallList).calls | ForEach-Object { $_.id }
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'calls-ch07.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiLpTask {
    <#
    .SYNOPSIS
        Returns one task's declaration from Chapter 07's call list, such as its mode (read or
        write). Throws if the task isn't declared.
    .EXAMPLE
        # Confirm the apply task is declared as a write task.
        (Get-NpiLpTask -Task least-privilege-apply).mode
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $t = (Get-NpiLpCallList).tasks
    if (-not $t.ContainsKey($Task)) { throw "Unknown task '$Task'." }
    $t[$Task]
}

function Get-NpiLpCall {
    <#
    .SYNOPSIS
        Returns the calls in Chapter 07's call list, narrowed to those declared for -Task when it is
        given.
    .EXAMPLE
        # The methods and IDs of the write task's calls.
        Get-NpiLpCall -Task least-privilege-apply | Select-Object method, id
    #>
    [CmdletBinding()]
    param([string]$Task)
    $calls = @((Get-NpiLpCallList).calls)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    $calls
}

function Get-NpiLpRequiredPermission {
    <#
    .SYNOPSIS
        Returns the Microsoft Graph permissions, Azure roles and methods that a Chapter 07 task's
        declared calls need, combined into one object.
    .EXAMPLE
        # What the read-only sweep must be granted.
        Get-NpiLpRequiredPermission -Task least-privilege
    .DESCRIPTION
    #>
    <# The union of a Chapter 07 task's calls: Graph permissions, Azure roles, methods. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $null = Get-NpiLpTask -Task $Task
    $calls = Get-NpiLpCall -Task $Task
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AzureRoles       = @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

function Get-NpiLpConfig {
    <#
    .SYNOPSIS
        Reads the least-privilege settings (config/least-privilege.json unless -Path names another
        file): the reviewed list of broad permissions, their proposed replacements, directory role
        names and privileged Azure roles. Returns them as a hashtable.
    .EXAMPLE
        # Show the broad delegated scopes the check looks for.
        (Get-NpiLpConfig).broadDelegatedScopes
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'least-privilege.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function New-NpiLpReader {
    <#
    .SYNOPSIS
        A read-only client for the least-privilege task, shaped like NpiCore's reader so its
        Invoke-NpiList and Invoke-NpiGetOne send only these declared GETs, on the cloud's own hosts.
    .EXAMPLE
        # A reader over the Chapter 07 fake.
        $fake = New-NpiLpFixtureInvoker -Path tests/fixtures/ch07/estate-ch07.json
        $reader = New-NpiLpReader -Cloud gcc -Invoke $fake.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][scriptblock]$Invoke)
    $decl = Get-NpiLpTask -Task 'least-privilege'
    if ($decl.mode -ne 'read') { throw 'least-privilege must be declared as a read task.' }
    [pscustomobject]@{ Cloud = Get-NpiCloud -Cloud $Cloud; Task = 'least-privilege'; Calls = Get-NpiLpCall -Task 'least-privilege'; Invoke = $Invoke; AdInvoke = $null; Evidence = [Collections.Generic.List[object]]::new() }
}

# ----------------------------------------------------------------------------- inputs

function ConvertTo-NpiLpDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Import-NpiLpRegister {
    <#
    .SYNOPSIS
        Reads Chapter 01's register from a run folder and returns @{ Rows; Manifest; Sha256 }.
        Throws if register.json's SHA-256 isn't the one manifest.json records.
    .EXAMPLE
        # Load Chapter 01's fixture run from out/inventory.
        $register = Import-NpiLpRegister -RunPath out/inventory
    .DESCRIPTION
    #>
    <# Chapter 01's register, refused unless its SHA-256 is the one its manifest records. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath)
    $reg = Join-Path $RunPath 'register.json'; $man = Join-Path $RunPath 'manifest.json'
    foreach ($p in $reg, $man) { if (-not (Test-Path -LiteralPath $p)) { throw "Missing $p; run Chapter 01's Invoke-NpiInventory.ps1 first." } }
    $manifest = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($manifest.task -ne 'inventory') { throw "$man isn't an inventory run." }
    $hash = Get-NpiFileHash -Path $reg
    if ($hash -ne $manifest.files['register.json']) { throw "register.json doesn't match its manifest (SHA-256 $hash); refusing to sweep a changed register." }
    [pscustomobject]@{ Rows = @(Get-Content -LiteralPath $reg -Raw | ConvertFrom-Json); Manifest = $manifest; Sha256 = $hash }
}

function Import-NpiLpInput {
    <#
    .SYNOPSIS
        Reads a CSV input file and returns its rows. Returns an empty array when the path is empty
        or the file doesn't exist, so an optional input can be left out.
    .EXAMPLE
        # The Azure scopes to sweep, from the Chapter 07 fixture inputs.
        Import-NpiLpInput -Path tests/fixtures/ch07/inputs/azure-scopes.csv | ForEach-Object Scope
    #>
    param([string]$Path)
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return @() }
    @(Import-Csv -LiteralPath $Path)
}

# ----------------------------------------------------------------------------- the sweep (read only)

function Get-NpiLpScopeLevel {
    <#
    .SYNOPSIS
        Returns the level of an Azure role assignment scope as text: Root, ManagementGroup,
        Subscription, ResourceGroup, Resource, or Unknown when the string matches none of them.
    .EXAMPLE
        # A key vault's scope is at the Resource level.
        Get-NpiLpScopeLevel -Scope '/subscriptions/1/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv'
    .DESCRIPTION
    #>
    <# Root, ManagementGroup, Subscription, ResourceGroup or Resource, from an Azure scope string. #>
    param([Parameter(Mandatory)][string]$Scope)
    $s = $Scope.TrimEnd('/')
    if ($s -eq '') { return 'Root' }
    if ($s -match '^/providers/Microsoft\.Management/managementGroups/[^/]+$') { return 'ManagementGroup' }
    if ($s -match '^/subscriptions/[^/]+$') { return 'Subscription' }
    if ($s -match '^/subscriptions/[^/]+/resourceGroups/[^/]+$') { return 'ResourceGroup' }
    if ($s -match '^/subscriptions/[^/]+/resourceGroups/[^/]+/providers/.+') { return 'Resource' }
    'Unknown'
}

function Get-NpiLpSweep {
    <#
    .SYNOPSIS
        Read every in-scope service principal's permissions: app role assignments on every
        resource, delegated grants, directory roles, and for managed identities their Azure role
        assignments at the scopes listed. Returns @{ Identities; Grants; Skipped; Evidence }.
    .EXAMPLE
        # Sweep the fixture register through the Chapter 07 fake.
        $register = Import-NpiLpRegister -RunPath out/inventory
        $fake = New-NpiLpFixtureInvoker -Path tests/fixtures/ch07/estate-ch07.json
        $reader = New-NpiLpReader -Cloud gcc -Invoke $fake.Invoke
        $scopes = @(Import-NpiLpInput tests/fixtures/ch07/inputs/azure-scopes.csv | ForEach-Object Scope)
        $sweep = Get-NpiLpSweep -Reader $reader -Rows $register.Rows -AzureScopes $scopes
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][object[]]$Rows,
        [string[]]$AzureScopes = @(),
        $Config = (Get-NpiLpConfig),
        [switch]$SkipAzure
    )
    $spOfApp = @{}; foreach ($r in $Rows) { if ($r.Type -eq 'ServicePrincipal' -and $r.AppId) { $spOfApp[$r.AppId] = $r.ObjectId } }
    $resourceCache = @{}
    $resource = {
        param([string]$Id)
        if (-not $resourceCache.ContainsKey($Id)) {
            $resourceCache[$Id] = Invoke-NpiGetOne -Reader $Reader -CallId 'graph-lp-resource-sp' -Bind @{ id = $Id } -Query '$select=id,appId,displayName,appRoles,oauth2PermissionScopes'
        }
        $resourceCache[$Id]
    }
    $roleDefCache = @{}
    $roleName = {
        param([string]$RoleDefinitionId)
        if (-not $roleDefCache.ContainsKey($RoleDefinitionId)) {
            $d = Invoke-NpiGetOne -Reader $Reader -CallId 'arm-lp-role-definition' -Bind @{ roleDefinitionId = $RoleDefinitionId }
            $roleDefCache[$RoleDefinitionId] = "$($d.properties.roleName)"
        }
        $roleDefCache[$RoleDefinitionId]
    }

    $identities = [Collections.Generic.List[object]]::new()
    $grants = [Collections.Generic.List[object]]::new()
    $skipped = [Collections.Generic.List[object]]::new()
    foreach ($r in @($Rows | Sort-Object IdentityId)) {
        if ($r.Source -ne 'Entra') { continue }
        if ($r.Type -eq 'ServicePrincipal') { continue }   # covered by its app registration's row
        if ($r.Type -in $script:Chapter09Types) { $skipped.Add([pscustomobject]@{ IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; Reason = 'AI agent identity: Chapter 09' }); continue }
        if ($r.Type -notin $script:InScopeTypes) { $skipped.Add([pscustomobject]@{ IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; Reason = "Type $($r.Type) isn't swept" }); continue }
        $spId = if ($r.Type -eq 'AppRegistration') { if ($spOfApp.ContainsKey($r.AppId)) { $spOfApp[$r.AppId] } else { $null } } else { $r.ObjectId }
        if (-not $spId) { $skipped.Add([pscustomobject]@{ IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; Reason = 'No service principal in this tenant: nothing is granted' }); continue }

        $assignments = @(Invoke-NpiList -Reader $Reader -CallId 'graph-lp-app-role-assignments' -Bind @{ id = $spId })
        foreach ($a in @($assignments | Where-Object { $_.principalType -eq 'ServicePrincipal' -and $_.principalId -eq $spId } | Sort-Object id)) {
            $res = & $resource $a.resourceId
            $role = @(@($res.appRoles) | Where-Object { $_.id -eq $a.appRoleId })
            $grants.Add([pscustomobject][ordered]@{
                    Key = "app:$spId`:$($a.id)"; IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; ServicePrincipalId = $spId; Kind = 'Application'
                    ResourceId = $a.resourceId; ResourceAppId = "$($res.appId)"; Resource = "$($res.displayName)"
                    Permission = if ($role.Count) { "$($role[0].value)" } else { "unknown:$($a.appRoleId)" }
                    AppRoleId = $a.appRoleId; AssignmentId = $a.id; ConsentType = ''; Scope = ''; ScopeLevel = ''; RoleDefinitionId = ''
                })
        }
        foreach ($g in @(Invoke-NpiList -Reader $Reader -CallId 'graph-lp-oauth2-grants' -Bind @{ id = $spId } | Sort-Object id)) {
            $res = & $resource $g.resourceId
            $grants.Add([pscustomobject][ordered]@{
                    Key = "grant:$($g.id)"; IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; ServicePrincipalId = $spId; Kind = 'Delegated'
                    ResourceId = $g.resourceId; ResourceAppId = "$($res.appId)"; Resource = "$($res.displayName)"
                    Permission = (@("$($g.scope)" -split '\s+' | Where-Object { $_ }) -join ' ')
                    AppRoleId = ''; AssignmentId = $g.id; ConsentType = "$($g.consentType)"; Scope = ''; ScopeLevel = ''; RoleDefinitionId = ''
                })
        }
        $dirRoles = @(Invoke-NpiList -Reader $Reader -CallId 'graph-lp-directory-role-assignments' -Query ('$filter=' + [Uri]::EscapeDataString("principalId eq '$spId'")))
        $dirRoleNames = @($dirRoles | ForEach-Object { if ($Config.directoryRoleNames.ContainsKey($_.roleDefinitionId)) { $Config.directoryRoleNames[$_.roleDefinitionId] } else { "role $($_.roleDefinitionId)" } } | Sort-Object -Unique)

        $isMi = $r.Type -like 'ManagedIdentity*'
        $azureNote = ''
        if ($isMi -and $SkipAzure) { $azureNote = 'Azure role assignments not read (-SkipAzure)' }
        elseif ($isMi) {
            $seen = @{}
            foreach ($scope in $AzureScopes) {
                if ($scope -notmatch '^/(subscriptions/[^/]+|providers/Microsoft\.Management/managementGroups/[^/]+)$') { throw "Unexpected Azure scope '$scope': list subscriptions and management groups." }
                $q = '$filter=' + [Uri]::EscapeDataString("assignedTo('$spId')")
                foreach ($ra in @(Invoke-NpiList -Reader $Reader -CallId 'arm-lp-role-assignments' -Bind @{ scope = $scope } -Query $q)) {
                    if ($ra.properties.principalId -ne $spId -or $seen.ContainsKey($ra.id)) { continue }
                    $seen[$ra.id] = $true
                    $grants.Add([pscustomobject][ordered]@{
                            Key = "azure:$($ra.name)"; IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; ServicePrincipalId = $spId; Kind = 'AzureRole'
                            ResourceId = ''; ResourceAppId = ''; Resource = 'Azure Resource Manager'; Permission = (& $roleName $ra.properties.roleDefinitionId)
                            AppRoleId = ''; AssignmentId = $ra.id; ConsentType = ''; Scope = $ra.properties.scope; ScopeLevel = (Get-NpiLpScopeLevel -Scope $ra.properties.scope); RoleDefinitionId = $ra.properties.roleDefinitionId
                        })
                }
            }
        }
        $identities.Add([pscustomobject][ordered]@{
                IdentityId = $r.IdentityId; Name = $r.Name; Type = $r.Type; ServicePrincipalId = $spId; OwnerIds = "$($r.OwnerIds)"
                DirectoryRoles = ($dirRoleNames -join '; '); AzureNote = $azureNote
            })
    }
    [pscustomobject]@{ Identities = $identities.ToArray(); Grants = @($grants | Sort-Object Key); Skipped = $skipped.ToArray(); Evidence = $Reader.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- the check

function Get-NpiLpBroadClass {
    <# The reviewed list's class for a grant (Directory, Escalation, Mail, Sites), or $null. #>
    param($Grant, $Config)
    if ($Grant.Kind -eq 'Application') {
        $hit = @($Config.broadApplicationPermissions | Where-Object { $_.resourceAppId -eq $Grant.ResourceAppId -and $_.value -eq $Grant.Permission })
        if ($hit.Count) { return $hit[0].class }
        return $null
    }
    if ($Grant.Kind -eq 'Delegated' -and $Grant.ConsentType -eq 'AllPrincipals') {
        $broad = @("$($Grant.Permission)" -split ' ' | Where-Object { $_ -in $Config.broadDelegatedScopes })
        if ($broad.Count) { return 'DelegatedAllPrincipals' }
    }
    if ($Grant.Kind -eq 'AzureRole' -and $Grant.ScopeLevel -in 'Root', 'ManagementGroup', 'Subscription', 'Unknown') { return 'AzureScope' }
    $null
}

function Get-NpiLpScopeWords {
    param([string]$Level)
    switch ($Level) { 'ManagementGroup' { 'management group' } 'ResourceGroup' { 'resource group' } 'Unknown' { 'an unrecognized' } default { $Level.ToLowerInvariant() } }
}

function Find-NpiLpException {
    param($Grant, [object[]]$Exceptions, [string]$Permission)
    $p = if ($Permission) { $Permission } else { $Grant.Permission }
    @($Exceptions | Where-Object { $_.IdentityId -eq $Grant.IdentityId -and $_.Kind -eq $Grant.Kind -and $_.Permission -eq $p -and (-not $_.ResourceAppId -or $_.ResourceAppId -eq $Grant.ResourceAppId) }) | Select-Object -First 1
}

function Test-NpiLpException {
    <# '' when the exception is current and complete; otherwise why not. #>
    param($Exception, [datetime]$AsOf)
    if (-not $Exception) { return 'no recorded exception' }
    foreach ($f in 'Justification', 'ApprovedBy', 'ApprovedOn', 'ExpiresOn') { if (-not "$($Exception.$f)".Trim()) { return "the exception has no $f" } }
    $ends = ConvertTo-NpiLpDate $Exception.ExpiresOn
    if ($ends -lt $AsOf) { return "the exception ended $($Exception.ExpiresOn)" }
    ''
}

function Test-NpiLeastPrivilege {
    <#
    .SYNOPSIS
        Findings NPI-LP-01 to NPI-LP-09 over a sweep, the privileged service principals handed to
        the Privileged Access plan, and a proposal for each broad grant. Returns
        @{ Grants (each with Broad, Class, Proposal, Exception); Findings; Handoff }.
    .EXAMPLE
        # Check a sweep against the fixture exceptions.
        $check = Test-NpiLeastPrivilege -Sweep $sweep -Exceptions (Import-NpiLpInput tests/fixtures/ch07/inputs/permission-exceptions.csv) -AsOf '2026-10-30T12:00:00Z'
        $check.Findings | Group-Object Rule
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Sweep, [object[]]$Exceptions = @(), [Parameter(Mandatory)][datetime]$AsOf, $Config = (Get-NpiLpConfig))
    $f = [Collections.Generic.List[object]]::new()
    $handoff = [Collections.Generic.List[object]]::new()
    $privAzure = @($Config.privilegedAzureRoles)

    # Privileged non-human identities: a directory role, a permission that can grant itself more, or a privileged Azure administrator role.
    $handedOff = @{}
    foreach ($id in $Sweep.Identities) {
        $mine = @($Sweep.Grants | Where-Object ServicePrincipalId -EQ $id.ServicePrincipalId)
        $why = [Collections.Generic.List[string]]::new()
        if ($id.DirectoryRoles) { $why.Add("directory role: $($id.DirectoryRoles)") }
        foreach ($g in $mine) {
            if ($g.Kind -eq 'Application' -and (Get-NpiLpBroadClass $g $Config) -eq 'Escalation') { $why.Add("$($g.Permission) (can grant itself more)") }
            if ($g.Kind -eq 'AzureRole' -and $g.Permission -in $privAzure) { $why.Add("$($g.Permission) at $(Get-NpiLpScopeWords $g.ScopeLevel) scope (a privileged administrator role)") }
        }
        if ($why.Count) {
            $handedOff[$id.ServicePrincipalId] = $true
            $handoff.Add([pscustomobject][ordered]@{
                    IdentityId = $id.IdentityId; Name = $id.Name; Type = $id.Type; ServicePrincipalId = $id.ServicePrincipalId; Reasons = ($why -join '; ')
                    Grants = @($mine | ForEach-Object { "$($_.Kind) $($_.Resource) $($_.Permission)$(if ($_.Scope) { " at $($_.Scope)" })" })
                    To = 'Privileged Access plan, A3.4 (non-human privileged identities); access reviews for service principals in privileged roles run there'
                })
            $f.Add((New-NpiFinding 'NPI-LP-08' 'Info' $id.IdentityId "$($id.Name) ($($id.Type))" "Privileged non-human identity, handed to the Privileged Access plan (A3.4): $($why -join '; ')"))
        }
    }

    $out = [Collections.Generic.List[object]]::new()
    foreach ($g in $Sweep.Grants) {
        $class = Get-NpiLpBroadClass $g $Config
        $ex = $null; $exWhy = ''; $proposal = ''
        $obj = "$($g.Name) ($($g.Type))"
        $isHanded = $handedOff.ContainsKey($g.ServicePrincipalId)
        if ($class) {
            $proposal = switch ($class) {
                'DelegatedAllPrincipals' { 'Narrow the grant to the scopes the app needs, or consent per user' }
                'AzureScope' { 'Assign the role at the resource the workload uses (Learn: the narrowest scope)' }
                default { $Config.replacements[$class].proposal }
            }
            if ($class -eq 'DelegatedAllPrincipals') {
                $wide = @("$($g.Permission)" -split ' ' | Where-Object { $_ -in $Config.broadDelegatedScopes })
                $missing = @($wide | Where-Object { Test-NpiLpException (Find-NpiLpException $g $Exceptions $_) $AsOf })
                $exWhy = if ($missing.Count) { "no current exception for $($missing -join ', ')" } else { '' }
            } else {
                $ex = Find-NpiLpException $g $Exceptions
                $exWhy = Test-NpiLpException $ex $AsOf
            }
            if (-not $isHanded) {
                if ($class -eq 'DelegatedAllPrincipals') {
                    if ($exWhy) { $f.Add((New-NpiFinding 'NPI-LP-03' 'Finding' $g.Key $obj "Delegated $($g.Permission) on $($g.Resource) consented for all users; $exWhy. Proposed: $proposal")) }
                } elseif ($class -eq 'AzureScope') {
                    # NPI-LP-06, below
                } elseif (-not $ex) {
                    $f.Add((New-NpiFinding 'NPI-LP-01' 'Finding' $g.Key $obj "Broad application permission $($g.Permission) on $($g.Resource) with no recorded exception. Proposed: $proposal"))
                } elseif ($exWhy) {
                    $f.Add((New-NpiFinding 'NPI-LP-02' 'Finding' $g.Key $obj "$($g.Permission) on $($g.Resource): $exWhy. Proposed: $proposal"))
                }
                if ($class -eq 'Mail') {
                    $control = if ($ex) { "$($ex.Control)" } else { '' }
                    if ($control -eq 'ExchangeRbacScope') {
                        $f.Add((New-NpiFinding 'NPI-LP-04' 'Finding' $g.Key $obj "$($g.Permission) is still granted in Microsoft Entra ID, so the Exchange RBAC for Applications scope the exception names has no effect: the two grants are a union. Remove this grant once the scoped Exchange assignment is tested"))
                    } elseif ($control -eq 'ApplicationAccessPolicy') {
                        $f.Add((New-NpiFinding 'NPI-LP-05' 'Warn' $g.Key $obj "$($g.Permission) is limited by an application access policy, which Learn calls legacy and replaced by RBAC for Applications; plan the move"))
                    } elseif ($ex) {
                        $f.Add((New-NpiFinding 'NPI-LP-05' 'Warn' $g.Key $obj "$($g.Permission) reaches every mailbox: the exception names no mailbox control"))
                    }
                }
            }
        }
        if ($g.Kind -eq 'Application' -and "$($g.Permission)" -like 'unknown:*' -and -not $isHanded) {
            $f.Add((New-NpiFinding 'NPI-LP-09' 'Warn' $g.Key $obj "App role $($g.AppRoleId) isn't among $($g.Resource)'s appRoles: name it by hand before the review"))
        }
        if ($g.Kind -eq 'AzureRole' -and -not $isHanded) {
            if ($class -eq 'AzureScope') {
                if ($exWhy) { $f.Add((New-NpiFinding 'NPI-LP-06' 'Finding' $g.Key $obj "$($g.Permission) at $(Get-NpiLpScopeWords $g.ScopeLevel) scope ($($g.Scope)); $exWhy. Proposed: $proposal")) }
            } elseif ($g.ScopeLevel -eq 'ResourceGroup') {
                $f.Add((New-NpiFinding 'NPI-LP-07' 'Warn' $g.Key $obj "$($g.Permission) at resource group scope ($($g.Scope)): every resource in the group is reachable; scope it to the resource if the workload uses one"))
            }
        }
        $row = [ordered]@{}; foreach ($p in $g.PSObject.Properties) { $row[$p.Name] = $p.Value }
        $row.Broad = [bool]$class; $row.Class = "$class"; $row.Proposal = $proposal; $row.HandedOff = $isHanded
        $row.Exception = if ($ex) { "$($ex.Justification) (approved by $($ex.ApprovedBy) to $($ex.ExpiresOn)$(if ($ex.Control) { "; control $($ex.Control)" }))" } else { '' }
        $row.ExceptionValid = [bool]($class -and -not $exWhy)
        $out.Add([pscustomobject]$row)
    }
    [pscustomobject]@{ Grants = $out.ToArray(); Findings = @($f | Sort-Object Id); Handoff = $handoff.ToArray() }
}

# ----------------------------------------------------------------------------- the quarterly owner review

function Get-NpiLpQuarter {
    <#
    .SYNOPSIS
        Returns the calendar quarter that contains -AsOf: its name (for example 2026-Q4) and its
        start and end as UTC dates. The owner review uses it to tell this quarter's decisions from
        older ones.
    .EXAMPLE
        # The quarter for 30 October 2026 is 2026-Q4.
        Get-NpiLpQuarter -AsOf '2026-10-30'
    #>
    param([datetime]$AsOf)
    $q = [int][Math]::Ceiling($AsOf.Month / 3)
    $start = [datetime]::new($AsOf.Year, ($q - 1) * 3 + 1, 1, 0, 0, 0, [DateTimeKind]::Utc)
    [pscustomobject]@{ Name = "$($AsOf.Year)-Q$q"; Start = $start; End = $start.AddMonths(3) }
}

function New-NpiLpOwnerReview {
    <#
    .SYNOPSIS
        The quarterly owner review (N4.3): one row per grant of every service principal this chapter
        sweeps, with its owners, whether it's broad, its exception and the proposal, and the
        owner's decision this quarter if there is one. Privileged service principals aren't in it:
        their review is the Privileged Access plan's. Returns @{ Rows; Status }.
    .EXAMPLE
        # Build this quarter's review packet with the fixture owner decisions.
        $review = New-NpiLpOwnerReview -Check $check -Sweep $sweep -Decisions (Import-NpiLpInput tests/fixtures/ch07/inputs/owner-decisions.csv) -AsOf '2026-10-30T12:00:00Z'
        $review.Status
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Check, [Parameter(Mandatory)]$Sweep, [object[]]$Decisions = @(), [Parameter(Mandatory)][datetime]$AsOf)
    $quarter = Get-NpiLpQuarter $AsOf
    $owners = @{}; foreach ($i in $Sweep.Identities) { $owners[$i.IdentityId] = $i.OwnerIds }
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($g in @($Check.Grants | Where-Object { -not $_.HandedOff })) {
        $d = @($Decisions | Where-Object Key -EQ $g.Key | Sort-Object { ConvertTo-NpiLpDate $_.DecidedOn } -Descending | Select-Object -First 1)
        $inQuarter = $d.Count -and (ConvertTo-NpiLpDate $d[0].DecidedOn) -ge $quarter.Start -and (ConvertTo-NpiLpDate $d[0].DecidedOn) -lt $quarter.End
        $rows.Add([pscustomobject][ordered]@{
                Quarter = $quarter.Name; Key = $g.Key; IdentityId = $g.IdentityId; Name = $g.Name; Owners = $(if ($owners[$g.IdentityId]) { $owners[$g.IdentityId] } else { 'none in the tenant: Chapter 02' })
                Kind = $g.Kind; Resource = $g.Resource; Permission = $g.Permission; Scope = $g.Scope; Broad = $g.Broad; Exception = $g.Exception; Proposal = $g.Proposal
                Decision = if ($inQuarter) { $d[0].Decision } else { '' }; NewScope = if ($inQuarter) { $d[0].NewScope } else { '' }; Replacement = if ($inQuarter) { $d[0].Replacement } else { '' }
                DecidedBy = if ($inQuarter) { $d[0].DecidedBy } else { '' }; DecidedOn = if ($inQuarter) { $d[0].DecidedOn } else { '' }
                LastDecision = if ($d.Count -and -not $inQuarter) { "$($d[0].Decision) on $($d[0].DecidedOn), an earlier quarter" } else { '' }
            })
    }
    $open = @($rows | Where-Object { -not $_.Decision })
    $pending = @($rows | Where-Object { $_.Decision -in 'Remove', 'Narrow' })
    [pscustomobject]@{
        Rows   = $rows.ToArray()
        Status = [pscustomobject][ordered]@{
            Quarter = $quarter.Name; Rows = $rows.Count; Decided = $rows.Count - $open.Count; Open = $open.Count; ChangesPending = $pending.Count
            Closed = ($open.Count -eq 0 -and $pending.Count -eq 0)
            Note = 'Closed when every row has a decision this quarter and no Remove or Narrow decision is still granted: the next sweep, after the plan is applied, shows the change.'
        }
    }
}

# ----------------------------------------------------------------------------- the plan (no writes)

function New-NpiLpPlan {
    <#
    .SYNOPSIS
        Turn the owners' decisions into one action per broad grant and per decided change. Only two
        actions write: RemoveAppRole (DELETE the assignment through the resource service principal)
        and NarrowGrant (PATCH a delegated grant's scope to a non-empty subset). Nothing in it writes.
    .EXAMPLE
        # Turn the review into a dry-run plan for the fixture tenant.
        $plan = New-NpiLpPlan -Check $check -Review $review -AsOf '2026-10-30T12:00:00Z' -Cloud gcc -TenantId $register.Manifest.tenantId -RegisterSha256 $register.Sha256
        $plan.actions | Where-Object Write
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Check,
        [Parameter(Mandatory)]$Review,
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [Parameter(Mandatory)][string]$RegisterSha256
    )
    $graph = (Get-NpiCloud -Cloud $Cloud).Graph
    $actions = [Collections.Generic.List[object]]::new()
    $add = { param([hashtable]$a) $o = [ordered]@{ ActionId = ''; Key = ''; IdentityId = ''; Name = ''; Action = ''; Write = $false; Call = ''; Method = ''; Target = ''; Body = $null; Precheck = $null; Reason = '' }; foreach ($k in $a.Keys) { $o[$k] = $a[$k] }; $o.ActionId = "$($o.Action):$($o.Key)"; $actions.Add([pscustomobject]$o) }
    foreach ($h in $Check.Handoff) { & $add @{ Key = $h.IdentityId; IdentityId = $h.IdentityId; Name = $h.Name; Action = 'HandedOff'; Reason = "Privileged Access plan (A3.4): $($h.Reasons)" } }
    $byKey = @{}; foreach ($g in $Check.Grants) { $byKey[$g.Key] = $g }
    foreach ($row in $Review.Rows) {
        $g = $byKey[$row.Key]
        $common = @{ Key = $row.Key; IdentityId = $row.IdentityId; Name = $row.Name }
        $what = "$($g.Kind) $($g.Permission) on $($g.Resource)"
        if (-not $row.Decision) {
            if ($g.Broad) { & $add ($common + @{ Action = 'AwaitOwnerDecision'; Reason = "$what is broad; the owner decides Keep (with a current exception), Remove or Narrow this quarter" }) }
            continue
        }
        switch ($row.Decision) {
            'Keep' {
                if ($g.Broad -and -not $g.ExceptionValid) { & $add ($common + @{ Action = 'KeepNeedsException'; Reason = "Kept by $($row.DecidedBy), but $what has no current exception: record one with a justification, approver and end date" }) }
                elseif ($g.Broad) { & $add ($common + @{ Action = 'Kept'; Reason = "Kept by $($row.DecidedBy) under its recorded exception" }) }
            }
            'Remove' {
                if ($g.Kind -eq 'AzureRole') { & $add ($common + @{ Action = 'RescopeByOwner'; Reason = "Re-scope $($g.Permission) from $($g.Scope) to the resource in the subscription's reviewed infrastructure code; this example doesn't write to Azure" }); break }
                if ($g.Kind -eq 'Delegated') { & $add ($common + @{ Action = 'RevokeByOwner'; Reason = 'Removing every scope deletes the grant; this example only narrows grants. Revoke it in a reviewed change' }); break }
                $pre = [ordered]@{ ClientId = $g.ServicePrincipalId; AssignmentId = $g.AssignmentId; ResourceId = $g.ResourceId; AppRoleId = $g.AppRoleId; ReplacementPermission = ''; ReplacementAppRoleId = '' }
                if ($row.Replacement) {
                    $rep = @($Check.Grants | Where-Object { $_.ServicePrincipalId -eq $g.ServicePrincipalId -and $_.Kind -eq 'Application' -and $_.ResourceId -eq $g.ResourceId -and $_.Permission -eq $row.Replacement })
                    if (-not $rep.Count) { & $add ($common + @{ Action = 'AwaitReplacement'; Reason = "Grant $($row.Replacement) first and test it; then $($g.Permission) is removed" }); break }
                    $pre.ReplacementPermission = $row.Replacement; $pre.ReplacementAppRoleId = $rep[0].AppRoleId
                }
                & $add ($common + @{ Action = 'RemoveAppRole'; Write = $true; Call = 'graph-lp-app-role-remove'; Method = 'DELETE'; Target = "$graph/v1.0/servicePrincipals/$($g.ResourceId)/appRoleAssignedTo/$($g.AssignmentId)"; Precheck = $pre
                        Reason = "Owner $($row.DecidedBy) decided on $($row.DecidedOn) to remove $what$(if ($row.Replacement) { "; $($row.Replacement) is already granted" }). The app and its service principal stay" })
            }
            'Narrow' {
                if ($g.Kind -ne 'Delegated') { & $add ($common + @{ Action = 'DecisionRefused'; Reason = "Only a delegated grant can be narrowed; for $what decide Remove and grant the narrower permission" }); break }
                $from = @("$($g.Permission)" -split ' ' | Where-Object { $_ })
                $to = @("$($row.NewScope)" -split '\s+' | Where-Object { $_ } | Select-Object -Unique)
                if (-not $to.Count) { & $add ($common + @{ Action = 'RevokeByOwner'; Reason = 'An empty scope deletes the grant in effect; revoke it in a reviewed change' }); break }
                $extra = @($to | Where-Object { $_ -notin $from })
                if ($extra.Count -or $to.Count -ge $from.Count) { & $add ($common + @{ Action = 'DecisionRefused'; Reason = "NewScope must be a smaller subset of '$($g.Permission)'$(if ($extra.Count) { "; $($extra -join ', ') isn't granted now" })" }); break }
                & $add ($common + @{ Action = 'NarrowGrant'; Write = $true; Call = 'graph-lp-grant-narrow'; Method = 'PATCH'; Target = "$graph/v1.0/oauth2PermissionGrants/$($g.AssignmentId)"; Body = [ordered]@{ scope = ($to -join ' ') }
                        Precheck = [ordered]@{ ClientId = $g.ServicePrincipalId; GrantId = $g.AssignmentId; FromScope = ($from -join ' ') }
                        Reason = "Owner $($row.DecidedBy) decided on $($row.DecidedOn) to narrow '$($g.Permission)' to '$($to -join ' ')'" })
            }
            default { & $add ($common + @{ Action = 'DecisionRefused'; Reason = "Unknown decision '$($row.Decision)'; the file accepts Keep, Remove or Narrow" }) }
        }
    }
    [pscustomobject][ordered]@{
        planVersion = 1; task = 'least-privilege-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId
        registerSha256 = $RegisterSha256; quarter = $Review.Status.Quarter
        actions = $actions.ToArray()
    }
}

# ----------------------------------------------------------------------------- the reviewed write path

function New-NpiLpWriter {
    <#
    .SYNOPSIS
        The writer for least-privilege-apply: the only object in this chapter that can send a
        DELETE or a PATCH, and only the two calls calls-ch07.json declares for that task.
    .EXAMPLE
        # A writer over the Chapter 07 fake, which accepts writes only with -AllowWrite.
        $fake = New-NpiLpFixtureInvoker -Path tests/fixtures/ch07/estate-ch07.json -AllowWrite
        $writer = New-NpiLpWriter -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][scriptblock]$Invoke)
    $decl = Get-NpiLpTask -Task 'least-privilege-apply'
    if ($decl.mode -ne 'write') { throw 'least-privilege-apply must be declared as a write task.' }
    [pscustomobject]@{ Cloud = Get-NpiCloud -Cloud $Cloud; TenantId = $TenantId; Task = 'least-privilege-apply'; Calls = Get-NpiLpCall -Task 'least-privilege-apply'; Invoke = $Invoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function Assert-NpiLpPlannedWrite {
    <#
    .SYNOPSIS
        Throws unless a plan action is a write declared for least-privilege-apply, with the declared
        method, the expected target shape and an allowed body. Returns nothing when the action
        passes.
    .EXAMPLE
        # Check every write in a saved plan before anything is sent.
        $plan = Get-Content -LiteralPath out/least-privilege/lp-plan.json -Raw | ConvertFrom-Json
        foreach ($a in @($plan.actions | Where-Object Write)) { Assert-NpiLpPlannedWrite -Writer $writer -Action $a }
    .DESCRIPTION
    #>
    <# Every write must be a declared least-privilege-apply call, with its method, target shape and body. #>
    param($Writer, $Action)
    $call = $Writer.Calls | Where-Object { $_.id -eq $Action.Call }
    if (-not $call) { throw "Action $($Action.ActionId): '$($Action.Call)' isn't declared for least-privilege-apply." }
    if ($call.method -ne $Action.Method) { throw "Action $($Action.ActionId): $($Action.Method) doesn't match the declared $($call.method)." }
    $g = [regex]::Escape($Writer.Cloud.Graph)
    switch ($call.id) {
        'graph-lp-app-role-remove' {
            if ($Action.Target -notmatch "^$g/v1\.0/servicePrincipals/($script:GuidRx)/appRoleAssignedTo/([A-Za-z0-9_-]+)$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target); only an app role assignment is ever deleted, never a service principal or an application." }
            $rid = $Matches[1]; $aid = $Matches[2]
            if (-not $Action.Precheck -or $Action.Precheck.ResourceId -ne $rid -or $Action.Precheck.AssignmentId -ne $aid) { throw "Action $($Action.ActionId): the target must name the assignment's resource service principal and the assignment the plan read." }
            if ($null -ne $Action.Body) { throw "Action $($Action.ActionId): a DELETE has no body." }
        }
        'graph-lp-grant-narrow' {
            if ($Action.Target -notmatch "^$g/v1\.0/oauth2PermissionGrants/([A-Za-z0-9_-]+)$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = if ($Action.Body -is [Collections.IDictionary]) { [pscustomobject]$Action.Body } else { $Action.Body }
            $keys = @($b.PSObject.Properties.Name)
            if ($keys.Count -ne 1 -or $keys[0] -ne 'scope' -or "$($b.scope)" -notmatch '\S') { throw "Action $($Action.ActionId): the only body allowed is {""scope"": ""<the kept scopes>""}." }
            $from = @("$($Action.Precheck.FromScope)" -split ' ' | Where-Object { $_ }); $to = @("$($b.scope)" -split ' ' | Where-Object { $_ })
            if (@($to | Where-Object { $_ -notin $from }).Count -or $to.Count -ge $from.Count) { throw "Action $($Action.ActionId): the new scope must be a smaller subset of '$($Action.Precheck.FromScope)'." }
        }
        default { throw "Action $($Action.ActionId): no rule for $($call.id)." }
    }
}

function Invoke-NpiLpWriterGet {
    param($Writer, [string]$CallId, [string]$Uri)
    $call = $Writer.Calls | Where-Object { $_.id -eq $CallId -and $_.method -eq 'GET' }
    if (-not $call) { throw "'$CallId' isn't a declared least-privilege-apply read." }
    $items = [Collections.Generic.List[object]]::new()
    while ($Uri) {
        Assert-NpiHost -Uri $Uri -ExpectedHost $Writer.Cloud.Graph
        $Writer.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $Uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Writer.Invoke 'GET' $Uri $null $null
        foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } }
        $Uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } else { $null }
    }
    $items.ToArray()
}

function Invoke-NpiLpPlan {
    <#
    .SYNOPSIS
        Apply a reviewed least-privilege plan. Without -Apply it is a dry run: it checks the plan and
        runs every precheck, and sends nothing. With -Apply it sends only the plan's writes, only if
        the plan file's SHA-256 is the one the reviewer approved, the plan is for this tenant and
        cloud and no older than seven days, and each precheck still holds.
    .EXAMPLE
        # A dry run of the reviewed plan against the fake; add -Apply to send the writes.
        $sha = (Get-FileHash -Algorithm SHA256 -LiteralPath out/least-privilege/lp-plan.json).Hash
        $run = Invoke-NpiLpPlan -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 $sha -Writer $writer -AsOf '2026-10-30T12:00:00Z'
        $run.Results | Format-Table Outcome, Action, Target
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$PlanPath,
        [Parameter(Mandatory)][string]$ApprovedSha256,
        [Parameter(Mandatory)]$Writer,
        [Parameter(Mandatory)][datetime]$AsOf,
        [switch]$Apply
    )
    $hash = Get-NpiFileHash -Path $PlanPath
    if ($hash -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $hash, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if ($plan.task -ne 'least-privilege-apply') { throw 'Not a least-privilege plan.' }
    if ($plan.tenantId -ne $Writer.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Writer.TenantId)." }
    if ($plan.cloud -ne $Writer.Cloud.Name) { throw "The plan is for cloud $($plan.cloud), not $($Writer.Cloud.Name)." }
    $generated = ConvertTo-NpiLpDate $plan.generated
    if (($AsOf - $generated).TotalDays -gt $script:MaxPlanAgeDays) { throw "The plan is $([int]($AsOf - $generated).TotalDays) days old; build and review a new one (the limit is $($script:MaxPlanAgeDays))." }
    $graph = $Writer.Cloud.Graph
    $results = [Collections.Generic.List[object]]::new()
    foreach ($a in @($plan.actions | Where-Object Write)) {
        Assert-NpiLpPlannedWrite -Writer $Writer -Action $a
        $outcome = $null; $detail = ''
        switch ($a.Call) {
            'graph-lp-app-role-remove' {
                $p = $a.Precheck
                $now = Invoke-NpiLpWriterGet $Writer 'graph-lp-app-role-assignments' "$graph/v1.0/servicePrincipals/$($p.ClientId)/appRoleAssignments"
                $hit = @($now | Where-Object { $_.id -eq $p.AssignmentId })
                if (-not $hit.Count) { $outcome = 'Skipped'; $detail = 'Already removed' }
                elseif ($hit[0].resourceId -ne $p.ResourceId -or $hit[0].appRoleId -ne $p.AppRoleId -or $hit[0].principalId -ne $p.ClientId) { $outcome = 'Skipped'; $detail = 'The assignment changed since the plan was reviewed' }
                elseif ($p.ReplacementAppRoleId -and -not @($now | Where-Object { $_.resourceId -eq $p.ResourceId -and $_.appRoleId -eq $p.ReplacementAppRoleId }).Count) { $outcome = 'Skipped'; $detail = "The replacement $($p.ReplacementPermission) is no longer granted" }
            }
            'graph-lp-grant-narrow' {
                $p = $a.Precheck
                $now = @(Invoke-NpiLpWriterGet $Writer 'graph-lp-oauth2-grants' "$graph/v1.0/servicePrincipals/$($p.ClientId)/oauth2PermissionGrants" | Where-Object { $_.id -eq $p.GrantId })
                if (-not $now.Count) { $outcome = 'Skipped'; $detail = 'The grant is gone' }
                elseif ((@("$($now[0].scope)" -split '\s+' | Where-Object { $_ }) -join ' ') -ne $p.FromScope) { $outcome = 'Skipped'; $detail = "The grant's scope changed since the plan was reviewed" }
            }
        }
        if (-not $outcome) {
            if (-not $Apply) { $outcome = 'WouldSend' }
            else {
                Assert-NpiHost -Uri $a.Target -ExpectedHost $graph
                $Writer.Evidence.Add([pscustomobject]@{ Call = $a.Call; Method = $a.Method; Target = $a.Target; At = [DateTime]::UtcNow.ToString('o') })
                $body = $null
                if ($null -ne $a.Body) { $body = @{}; foreach ($pp in $a.Body.PSObject.Properties) { $body[$pp.Name] = $pp.Value } }
                $null = & $Writer.Invoke $a.Method $a.Target $body $null
                $outcome = 'Sent'
                $detail = if ($a.Action -eq 'RemoveAppRole') { 'Removed the app role assignment; Learn: allow for replication delay before the next sweep. To restore, grant it again (Lab 2, step 6)' } else { 'Narrowed the delegated grant' }
            }
        }
        $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Action = $a.Action; Name = $a.Name; Method = $a.Method; Target = $a.Target; Outcome = $outcome; Detail = $detail })
    }
    [pscustomobject]@{ PlanSha256 = $hash; Mode = $(if ($Apply) { 'Apply' } else { 'DryRun' }); Results = $results.ToArray(); Evidence = $Writer.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- the run manifest

function Export-NpiLpRun {
    <#
    .SYNOPSIS
        Writes each entry of -Files into -OutputPath (CSV for a .csv name, JSON otherwise) plus a
        manifest.json with the task's permissions, every request and each file's SHA-256, and
        returns the manifest file.
    .EXAMPLE
        # Write the findings and the owner review with a manifest.
        Export-NpiLpRun -OutputPath out/least-privilege -Task least-privilege -Cloud gcc -TenantId $register.Manifest.tenantId -AsOf '2026-10-30' -Evidence $reader.Evidence -Files @{ 'findings.json' = @($check.Findings); 'owner-review.csv' = @($review.Rows) }
    .DESCRIPTION
    #>
    <# Write a run's files and a manifest: task, mode, cloud, tenant, permissions held, every request, a SHA-256 per file. #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [string]$AsOf, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [hashtable]$Extra = @{}
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        if ($name.EndsWith('.csv')) {
            $csv = (@($Files[$name]) | ConvertTo-Csv -NoTypeInformation) -join "`n"
            [IO.File]::WriteAllText($p, $csv + "`n", [Text.UTF8Encoding]::new($false))
        } else { Write-NpiJson -Path $p -Value $Files[$name] }
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $perm = Get-NpiLpRequiredPermission -Task $Task
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; asOf = $AsOf; generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $manifest[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

# ----------------------------------------------------------------------------- the fake

function New-NpiLpFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Microsoft Graph and Resource Manager for this chapter, served from the Chapter 07
        fixture: app role assignments by principal, delegated grants by client, resource service
        principals, directory role assignments by principal, Azure role assignments by scope and
        assignedTo, and role definitions. GET only unless -AllowWrite, which accepts the DELETE of
        an app role assignment through its resource service principal (404 through any other),
        the DELETE of a delegated grant (Learn's sample) and a PATCH of a grant's scope. Collections
        come in pages of -PageSize; every call is recorded in .Calls.
    .EXAMPLE
        # The fake with one item per page, then the calls it received after a run.
        $fake = New-NpiLpFixtureInvoker -Path tests/fixtures/ch07/estate-ch07.json -PageSize 1
        $fake.Calls | Select-Object Method, Uri
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [int]$PageSize = 2, [string]$Cloud = 'gcc', [switch]$AllowWrite)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-NpiCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph; Arm = $c.Arm; AllowWrite = [bool]$AllowWrite; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-NpiLpFake -State $s -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state
}

function Invoke-NpiLpFake {
    <#
    .SYNOPSIS
        The Chapter 07 fake's dispatcher: records the request in the state's Calls, then answers it
        from the fixture by host, method and path (paging collections), or throws for a request it
        doesn't serve and for a write when the state doesn't allow writes. New-NpiLpFixtureInvoker's
        Invoke calls it.
    .EXAMPLE
        # Ask the fake directly for one service principal's delegated grants.
        $fake = New-NpiLpFixtureInvoker -Path tests/fixtures/ch07/estate-ch07.json
        Invoke-NpiLpFake -State $fake -Method GET -Uri 'https://graph.microsoft.com/v1.0/servicePrincipals/00000000-0000-0000-0000-000000000000/oauth2PermissionGrants'
    #>
    param($State, [string]$Method, [string]$Uri, $Body, $Headers)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
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
        $resp = @{ value = @($All | Select-Object -Skip $skip -First $State.PageSize) }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $link = "$base$($u.AbsolutePath)?" + ($(if ($rest) { "$rest&" } else { '' })) + "`$skiptoken=$($skip + $State.PageSize)"
            if ($base -eq $State.Arm) { $resp['nextLink'] = $link } else { $resp['@odata.nextLink'] = $link }
        }
        $resp
    }
    if ($base -eq $State.Graph) {
        if ($Method -eq 'GET') {
            switch -Regex ($path) {
                '^/v1\.0/servicePrincipals/([^/]+)/appRoleAssignments$' { $id = $Matches[1]; return & $page @($g.appRoleAssignments | Where-Object { $_.principalId -eq $id }) }
                '^/v1\.0/servicePrincipals/([^/]+)/oauth2PermissionGrants$' { $id = $Matches[1]; return & $page @($g.oauth2PermissionGrants | Where-Object { $_.clientId -eq $id }) }
                '^/v1\.0/servicePrincipals/([^/()]+)$' {
                    $id = $Matches[1]; $sp = @($g.resourceServicePrincipals | Where-Object { $_.id -eq $id })
                    if ($sp.Count -ne 1) { throw "404 servicePrincipal $id" }
                    return $sp[0]
                }
                '^/v1\.0/roleManagement/directory/roleAssignments$' {
                    if ("$($q['$filter'])" -notmatch "^principalId eq '([0-9a-f-]{36})'$") { throw "The fake serves directory role assignments filtered on principalId only, not: $($q['$filter'])" }
                    $pid2 = $Matches[1]; return & $page @($g.directoryRoleAssignments | Where-Object { $_.principalId -eq $pid2 })
                }
            }
            throw "The fake has no Graph route for GET $path"
        }
        if (-not $State.AllowWrite) { throw "The fake refuses $Method" }
        if ($Method -eq 'DELETE' -and $path -match '^/v1\.0/servicePrincipals/([^/]+)/appRoleAssignedTo/([^/]+)$') {
            $rid = $Matches[1]; $aid = $Matches[2]
            # Learn's Delete appRoleAssignedTo addresses the RESOURCE service principal.
            $hit = @($g.appRoleAssignments | Where-Object { $_.id -eq $aid -and $_.resourceId -eq $rid })
            if (-not $hit.Count) { throw "404 Not Found: no app role assignment $aid on resource service principal $rid" }
            $g.appRoleAssignments = @($g.appRoleAssignments | Where-Object { $_.id -ne $aid })
            return @{}
        }
        if ($Method -eq 'DELETE' -and $path -match '^/v1\.0/oauth2PermissionGrants/([^/]+)$') {
            $id = $Matches[1]
            if (-not @($g.oauth2PermissionGrants | Where-Object { $_.id -eq $id }).Count) { throw "404 Not Found: oauth2PermissionGrant $id" }
            $g.oauth2PermissionGrants = @($g.oauth2PermissionGrants | Where-Object { $_.id -ne $id })
            return @{}
        }
        if ($Method -eq 'PATCH' -and $path -match '^/v1\.0/oauth2PermissionGrants/([^/]+)$') {
            $id = $Matches[1]; $hit = @($g.oauth2PermissionGrants | Where-Object { $_.id -eq $id })
            if (-not $hit.Count) { throw "404 Not Found: oauth2PermissionGrant $id" }
            foreach ($k in $Body.Keys) { if ($k -ne 'scope') { throw "400 Bad Request: $k can't be updated" } }
            $hit[0].scope = $Body['scope']
            return @{}
        }
        throw "The fake has no Graph route for $Method $path"
    }
    if ($base -eq $State.Arm) {
        if ($Method -ne 'GET') { throw "The fake refuses $Method to Resource Manager" }
        if ($q['api-version'] -ne '2022-04-01') { throw "Unexpected api-version $($q['api-version'])" }
        if ($path -match '^(.*)/providers/Microsoft\.Authorization/roleAssignments$') {
            $scope = $Matches[1]
            if ("$($q['$filter'])" -notmatch "^assignedTo\('([0-9a-f-]{36})'\)$") { throw "The fake serves role assignments filtered on assignedTo only, not: $($q['$filter'])" }
            $pid2 = $Matches[1]
            return & $page @($State.Estate.azure.roleAssignments | Where-Object { $_.properties.principalId -eq $pid2 -and ($_.properties.scope -eq $scope -or $_.properties.scope.StartsWith("$scope/", [StringComparison]::OrdinalIgnoreCase)) })
        }
        if ($path -match '/providers/Microsoft\.Authorization/roleDefinitions/([0-9a-f-]{36})$') {
            $id = $Matches[1]
            if (-not $State.Estate.azure.roleDefinitions.ContainsKey($id)) { throw "404 roleDefinition $id" }
            return @{ id = $path; name = $id; properties = $State.Estate.azure.roleDefinitions[$id] }
        }
        throw "The fake has no Resource Manager route for $path"
    }
    throw "The fake refuses host $base"
}

Export-ModuleMember -Function Get-NpiLpCallList, Get-NpiLpTask, Get-NpiLpCall, Get-NpiLpRequiredPermission, Get-NpiLpConfig, New-NpiLpReader,
    Import-NpiLpRegister, Import-NpiLpInput, Get-NpiLpScopeLevel, Get-NpiLpSweep, Test-NpiLeastPrivilege, Get-NpiLpQuarter, New-NpiLpOwnerReview,
    New-NpiLpPlan, New-NpiLpWriter, Assert-NpiLpPlannedWrite, Invoke-NpiLpPlan, Export-NpiLpRun, New-NpiLpFixtureInvoker, Invoke-NpiLpFake
