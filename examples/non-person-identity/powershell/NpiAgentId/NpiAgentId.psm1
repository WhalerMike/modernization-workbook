#Requires -Version 7.1
<#
    NpiAgentId: Chapter 09 of the developer workbook "Building Non-Person Identity".

    AI agent identities read with their blueprints, sponsors, technical owners and inventory
    records, and checked against the program's rules (Book 17, Chapters 04 to 07): creation closed
    (N6.1), the production handshake as a reviewed record (N6.2), no stored secret on a production
    blueprint (N6.3), least privilege and no standing privileged role (N6.4), the sponsor mover and
    leaver tasks with the ten-business-day confirmation rule (N6.5), agent Conditional Access in
    report-only (N6.6) and the AI drift checks (N6.7). Decision D-N6 is data
    (config/agent-id-capabilities-ch09.json): where agent identities aren't available, the same
    rules run on the service principals and managed identities the agents use.

    It builds on NpiCore and NpiOwnership, which it imports and never edits: the cloud table, the
    paged, host-checked reader (driven here with this chapter's own call list,
    config/calls-ch09.json), Chapter 01's register and Chapter 02's sponsor fields, each checked
    against its manifest. Writes happen only in Invoke-NpiAgentCaPlan with -Apply: report-only
    Block policies, never PATCH or DELETE.

    Illustrative: tested against fixtures and fakes, not against a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiOwnership/NpiOwnership.psm1') -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:MaxPlanAgeDays = 7
$script:ReportOnly = 'enabledForReportingButNotEnforced'
$script:DriftPriority = @{ 'NPI-AI-07' = 'P2'; 'NPI-AI-21' = 'P1'; 'NPI-AI-22' = 'P1'; 'NPI-AI-23' = 'P1' }

# ----------------------------------------------------------------------------- configuration

function Get-NpiAgentConfig {
    <# The call list, the program's rules and the D-N6 capability table, as hashtables. #>
    [CmdletBinding()]
    param([string]$ConfigRoot = $script:ConfigRoot)
    $read = { param($n) Get-Content -LiteralPath (Join-Path $ConfigRoot $n) -Raw | ConvertFrom-Json -AsHashtable -Depth 50 }
    [pscustomobject]@{ Calls = & $read 'calls-ch09.json'; Rules = & $read 'agent-rules-ch09.json'; Capabilities = & $read 'agent-id-capabilities-ch09.json'; Root = $ConfigRoot }
}

function Get-NpiAgentCall {
    <# The Chapter 09 calls, optionally for one task. #>
    [CmdletBinding()]
    param([ValidateSet('agent-id', 'agent-ca-apply')][string]$Task)
    $all = @((Get-NpiAgentConfig).Calls.calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    $all
}

function Get-NpiAgentRequiredPermission {
    <# The union of a Chapter 09 task's calls: Graph permissions and methods. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('agent-id', 'agent-ca-apply')][string]$Task)
    $calls = Get-NpiAgentCall -Task $Task
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
        Versions         = @($calls | ForEach-Object { $_.version } | Sort-Object -Unique)
    }
}

function Get-NpiAgentCapability {
    <#
    .SYNOPSIS
        D-N6 for one cloud: Mode 'AgentId' where agent identities are available, else 'Fallback'
        (service principals and managed identities under the same governance), with the stage and
        watch flag of each capability.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    $null = Get-NpiCloud -Cloud $Cloud
    $cap = (Get-NpiAgentConfig).Capabilities
    $c = $cap.clouds[$Cloud]
    [pscustomobject]@{
        Cloud = $Cloud; Decision = $cap.decision; Status = $cap.status
        Mode = $(if ($c.agentIdentities.available -eq $true) { 'AgentId' } else { 'Fallback' })
        AgentIdentities = $c.agentIdentities; AgentConditionalAccess = $c.agentConditionalAccess; AgentRisk = $c.agentRisk; SponsorWorkflows = $c.sponsorWorkflows
    }
}

function New-NpiAgentReader {
    <#
    .SYNOPSIS
        A read-only client for the agent-id task, shaped like NpiCore's reader so Invoke-NpiList and
        Invoke-NpiGetOne page and host-check its GETs, but holding this chapter's calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][scriptblock]$Invoke)
    $calls = Get-NpiAgentCall -Task 'agent-id'
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = 'agent-id'
        Calls    = @($calls | Where-Object { $_.method -eq 'GET' })
        Invoke   = $Invoke
        AdInvoke = $null
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

# ----------------------------------------------------------------------------- inputs

function Import-NpiAgentRuns {
    <#
    .SYNOPSIS
        Chapter 01's register and Chapter 02's sponsor fields, each checked against its own manifest,
        and the ownership run checked against the register it was made from.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RegisterRun, [Parameter(Mandatory)][string]$OwnershipRun)
    $register = Import-NpiRegister -RunPath $RegisterRun
    $man = Join-Path $OwnershipRun 'manifest.json'; $fields = Join-Path $OwnershipRun 'ai-sponsor-fields.json'
    foreach ($p in $man, $fields) { if (-not (Test-Path -LiteralPath $p)) { throw "Missing $p; run Chapter 02's Invoke-NpiOwnership.ps1 first." } }
    $m = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($m.task -ne 'ownership') { throw "$man isn't an ownership run." }
    $h = Get-NpiFileHash -Path $fields
    if ($h -ne $m.files['ai-sponsor-fields.json']) { throw "ai-sponsor-fields.json doesn't match its manifest (SHA-256 $h); refusing to read changed sponsor fields." }
    if ($m.registerSha256 -ne $register.Sha256) { throw "The ownership run was made from register $($m.registerSha256), not $($register.Sha256)." }
    [pscustomobject]@{ Register = $register; SponsorFields = @(Get-Content -LiteralPath $fields -Raw | ConvertFrom-Json); OwnershipSha256 = $h; TenantId = $register.Manifest.tenantId }
}

function Import-NpiAgentInputs {
    <# The reviewed input files kept with the records, and their SHA-256 for the manifest. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$InputPath)
    $files = [ordered]@{
        Inventory     = 'ai-use-case-inventory.csv'; Handshakes = 'handshakes.json'; CreationSetting = 'creation-setting.json'
        SponsorEvents = 'sponsor-events.csv'; Confirmations = 'sponsor-confirmations.csv'; Changes = 'pipeline-changes.csv'
    }
    $out = [ordered]@{}; $hashes = [ordered]@{}
    foreach ($k in $files.Keys) {
        $p = Join-Path $InputPath $files[$k]
        if (-not (Test-Path -LiteralPath $p)) { $out[$k] = $(if ($k -eq 'CreationSetting') { $null } else { @() }); continue }
        $hashes[$files[$k]] = Get-NpiFileHash -Path $p
        $out[$k] = if ($p.EndsWith('.csv')) { @(Import-Csv -LiteralPath $p) } elseif ($k -eq 'CreationSetting') { Get-Content -LiteralPath $p -Raw | ConvertFrom-Json } else { @(Get-Content -LiteralPath $p -Raw | ConvertFrom-Json) }
    }
    $out.Hashes = $hashes
    [pscustomobject]$out
}

# ----------------------------------------------------------------------------- reading the estate

function Get-NpiAgentValue {
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    if ($Object -is [Collections.IDictionary]) { if ($Object.Contains($Name)) { return $Object[$Name] } else { return $null } }
    $p = $Object.PSObject.Properties[$Name]; if ($p) { $p.Value } else { $null }
}

function Read-NpiAgentEstate {
    <#
    .SYNOPSIS
        Read what the checks need. In AgentId mode: blueprints with sponsors, owners, federated
        credentials and inheritable permissions; agent identities with sponsors (expanded), owners,
        custom security attributes, app role assignments and directory roles. In both modes: the
        authorization policy, the agent Conditional Access policies (beta), the Lifecycle Workflows
        and their tasks, the credential audit events, and the directory roles of each fallback
        service principal named in the inventory.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)]$Capability, [Parameter(Mandatory)][datetime]$AsOf, [object[]]$Inventory = @(), [int]$AuditLookbackDays = 30)
    $e = [ordered]@{ Mode = $Capability.Mode; Blueprints = @(); Identities = @(); Fallback = @(); AuthorizationPolicy = $null; CaPolicies = @(); Workflows = @(); Audits = @() }
    $roles = { param($id) @(Invoke-NpiList -Reader $Reader -CallId 'agid-role-assignments' -Query ("`$filter=principalId eq '{0}'&`$expand=roleDefinition(`$select=displayName)" -f $id)) }

    $e.AuthorizationPolicy = Invoke-NpiGetOne -Reader $Reader -CallId 'agid-authorization-policy'
    if ($Capability.Mode -eq 'AgentId') {
        $e.Blueprints = @(foreach ($b in @(Invoke-NpiList -Reader $Reader -CallId 'agid-blueprints')) {
                $bind = @{ id = $b.id }
                [pscustomobject]@{
                    Object      = $b
                    Sponsors    = @(Invoke-NpiList -Reader $Reader -CallId 'agid-blueprint-sponsors' -Bind $bind)
                    Owners      = @(Invoke-NpiList -Reader $Reader -CallId 'agid-blueprint-owners' -Bind $bind)
                    Federated   = @(Invoke-NpiList -Reader $Reader -CallId 'agid-blueprint-fics' -Bind $bind)
                    Inheritable = @(Invoke-NpiList -Reader $Reader -CallId 'agid-blueprint-inheritable' -Bind $bind)
                }
            })
        $e.Identities = @(foreach ($a in @(Invoke-NpiList -Reader $Reader -CallId 'agid-identities' -Query '$expand=sponsors($select=id)')) {
                $bind = @{ id = $a.id }
                $attr = Invoke-NpiGetOne -Reader $Reader -CallId 'agid-identity-attributes' -Bind $bind -Query '$select=id,customSecurityAttributes'
                [pscustomobject]@{
                    Object     = $a
                    Sponsors   = @(Get-NpiAgentValue $a 'sponsors' | Where-Object { $null -ne $_ })
                    Owners     = @(Invoke-NpiList -Reader $Reader -CallId 'agid-identity-owners' -Bind $bind)
                    Attributes = Get-NpiAgentValue $attr 'customSecurityAttributes'
                    AppRoles   = @(Invoke-NpiList -Reader $Reader -CallId 'agid-identity-app-roles' -Bind $bind)
                    Roles      = @(& $roles $a.id | Where-Object { $null -ne $_ })
                }
            })
    }
    $e.Fallback = @(foreach ($row in @($Inventory | Where-Object { $_.IdentityType -in 'ServicePrincipal', 'ManagedIdentity' -and $_.IdentityObjectId })) {
            [pscustomobject]@{ Inventory = $row; Roles = @(& $roles $row.IdentityObjectId | Where-Object { $null -ne $_ }) }
        })
    $e.CaPolicies = @(Invoke-NpiList -Reader $Reader -CallId 'agid-ca-policies')
    $e.Workflows = @(foreach ($w in @(Invoke-NpiList -Reader $Reader -CallId 'agid-lcw-workflows')) {
            [pscustomobject]@{ Object = $w; Tasks = @(Invoke-NpiList -Reader $Reader -CallId 'agid-lcw-workflow-tasks' -Bind @{ id = $w.id }) }
        })
    $since = $AsOf.AddDays(-$AuditLookbackDays).ToString('yyyy-MM-ddTHH:mm:ssZ')
    $e.Audits = @(Invoke-NpiList -Reader $Reader -CallId 'agid-directory-audits' -Query ("`$filter=category eq 'ApplicationManagement' and activityDateTime ge {0}" -f $since))
    [pscustomobject]$e
}

# ----------------------------------------------------------------------------- helpers for the rules

function Get-NpiBusinessDayDeadline {
    <# The date N business days after Start, skipping Saturdays, Sundays and the listed holidays. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][datetime]$Start, [Parameter(Mandatory)][int]$Days, [string[]]$Holidays = @())
    $h = @{}; foreach ($d in $Holidays) { $h[$d] = $true }
    $cur = $Start.Date; $n = 0
    while ($n -lt $Days) {
        $cur = $cur.AddDays(1)
        if ($cur.DayOfWeek -in 'Saturday', 'Sunday' -or $h.ContainsKey($cur.ToString('yyyy-MM-dd'))) { continue }
        $n++
    }
    $cur
}

function ConvertTo-NpiAgentDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Get-NpiAgentPersonCache {
    # Read each sponsor or owner once, by object ID or UPN.
    param($Reader)
    $cache = @{}
    {
        param([string]$Key)
        if (-not $Key) { return $null }
        if (-not $cache.ContainsKey($Key)) {
            try { $cache[$Key] = Invoke-NpiGetOne -Reader $Reader -CallId 'agid-user' -Bind @{ id = [Uri]::EscapeDataString($Key) } -Query '$select=id,userPrincipalName,userType,accountEnabled,employeeType' }
            catch { if ("$_" -match '404|Request_ResourceNotFound') { $cache[$Key] = $null } else { throw } }
        }
        $cache[$Key]
    }.GetNewClosure()
}

function Test-NpiAgentSponsor {
    # Design guidance: a sponsor counts if it is an enabled member whose employeeType is the HR employee value.
    param($Person, [string]$EmployeeType)
    if (-not $Person) { return 'not found' }
    if ($Person.userType -ne 'Member') { return 'a guest' }
    if (-not $Person.accountEnabled) { return 'disabled (has left or is suspended)' }
    if ("$(Get-NpiAgentValue $Person 'employeeType')" -ne $EmployeeType) { return "not an employee (employeeType '$(Get-NpiAgentValue $Person 'employeeType')')" }
    $null
}

function Test-NpiAgentApproved {
    # Does the identity carry the approval value in the configured custom security attribute?
    param($Attributes, $Rule)
    $set = Get-NpiAgentValue $Attributes $Rule.set
    if (-not $set) { return $false }
    @(Get-NpiAgentValue $set $Rule.name) -contains $Rule.value
}

function Get-NpiAgentCredentialKind {
    <#
    The blueprint's credential, in the program's order: ManagedIdentity (a federated credential
    whose issuer is this tenant's own login endpoint), Federation (any other issuer), Certificate,
    Secret, or None. Every kind present is returned; the first is the best.
    #>
    param($Blueprint, [string]$TenantId, [string]$LoginHost)
    $kinds = [Collections.Generic.List[string]]::new()
    foreach ($f in @($Blueprint.Federated)) {
        if ("$($f.issuer)".TrimEnd('/') -eq "$LoginHost/$TenantId/v2.0") { $kinds.Add('ManagedIdentity') } else { $kinds.Add('Federation') }
    }
    if (@($Blueprint.Object.keyCredentials).Count) { $kinds.Add('Certificate') }
    if (@($Blueprint.Object.passwordCredentials).Count) { $kinds.Add('Secret') }
    if (-not $kinds.Count) { $kinds.Add('None') }
    @($kinds | Select-Object -Unique)
}

function Test-NpiAgentCaPolicyShape {
    <#
    .SYNOPSIS
        Check one agent Conditional Access policy body against the program's design. Kind
        'Unapproved': all agent identities, all resources, Block, report-only, and approved agents
        excluded only by the custom security attribute filter. Kind 'HighRisk': all agent
        identities, all resources, Block, report-only, agent risk high. Returns the problems.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Policy, [Parameter(Mandatory)][ValidateSet('Unapproved', 'HighRisk')][string]$Kind, $ApprovalRule)
    $p = [Collections.Generic.List[string]]::new()
    $cond = Get-NpiAgentValue $Policy 'conditions'
    $ca = Get-NpiAgentValue $cond 'clientApplications'
    $apps = Get-NpiAgentValue $cond 'applications'
    $grant = Get-NpiAgentValue $Policy 'grantControls'
    if ("$(Get-NpiAgentValue $Policy 'state')" -ne $script:ReportOnly) { $p.Add("state is '$(Get-NpiAgentValue $Policy 'state')', not report-only") }
    if (@(Get-NpiAgentValue $ca 'includeAgentIdServicePrincipals') -notcontains 'All') { $p.Add("doesn't include All agent identities") }
    if (@(Get-NpiAgentValue $apps 'includeApplications') -notcontains 'All') { $p.Add("doesn't target All resources") }
    $controls = @(Get-NpiAgentValue $grant 'builtInControls')
    if ($controls.Count -ne 1 -or $controls[0] -ne 'block') { $p.Add('grant is not Block alone') }
    if (@(Get-NpiAgentValue $ca 'excludeAgentIdServicePrincipals').Count) { $p.Add('excludes agent identities one by one, outside the handshake') }
    $filter = Get-NpiAgentValue $ca 'agentIdServicePrincipalFilter'
    if ($Kind -eq 'Unapproved') {
        $want = 'CustomSecurityAttribute.{0}_{1} -contains "{2}"' -f $ApprovalRule.set, $ApprovalRule.name, $ApprovalRule.value
        if (-not $filter) { $p.Add('no exclusion for approved agents: every approved agent would be blocked when enforced') }
        elseif ("$(Get-NpiAgentValue $filter 'mode')" -ne 'exclude' -or "$(Get-NpiAgentValue $filter 'rule')" -ne $want) { $p.Add("the exclusion isn't the approval attribute ($want)") }
    } else {
        if ("$(Get-NpiAgentValue $cond 'agentIdRiskLevels')" -notmatch '\bhigh\b') { $p.Add('no agent risk condition set to high') }
        if ($filter) { $p.Add('the risk policy excludes agents by filter') }
    }
    @($p)
}

# ----------------------------------------------------------------------------- the checks

function Test-NpiAgentId {
    <#
    .SYNOPSIS
        Check the AI identities against the program's rules and return @{ Identities (the sponsor
        fields Chapter 02 recorded, filled); Findings NPI-AI-01 to NPI-AI-23 with stable IDs;
        OrphanCandidates for Chapter 02's orphan rule; Capability }.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)]$Estate,
        [Parameter(Mandatory)]$Inputs,
        [Parameter(Mandatory)]$Runs,
        [Parameter(Mandatory)]$Capability,
        [Parameter(Mandatory)][datetime]$AsOf
    )
    $rules = (Get-NpiAgentConfig).Rules
    $person = Get-NpiAgentPersonCache -Reader $Reader
    $f = [Collections.Generic.List[object]]::new()
    $ids = [Collections.Generic.List[object]]::new()
    $orphans = [Collections.Generic.List[object]]::new()
    $add = {
        param([string]$Rule, [string]$Severity, [string]$Key, [string]$Label, [string]$Issue)
        $x = New-NpiFinding $Rule $Severity $Key $Label $Issue
        $x | Add-Member -NotePropertyName Priority -NotePropertyValue $(if ($script:DriftPriority.ContainsKey($Rule) -and $Severity -eq 'Finding') { $script:DriftPriority[$Rule] } else { '' })
        $f.Add($x)
    }
    $loginHost = (Get-NpiCloud -Cloud $Reader.Cloud.Name).Login
    $tenantId = $Runs.TenantId
    $inv = @($Inputs.Inventory)
    $hs = @($Inputs.Handshakes)
    $invById = @{}; foreach ($r in $inv) { if ($r.IdentityObjectId) { $invById[$r.IdentityObjectId] = $r } }
    $hsById = @{}; foreach ($h in $hs) { if ($h.IdentityObjectId) { $hsById[$h.IdentityObjectId] = $h } }
    $policyNames = @{}; foreach ($p in @($Estate.CaPolicies)) { $policyNames["$($p.displayName)"] = $p }
    $holidays = @($rules.federalHolidays)
    $empType = $rules.sponsor.employeeType

    # --- N6.1 creation closed --------------------------------------------------------------
    $cs = $Inputs.CreationSetting
    if (-not $cs) { & $add 'NPI-AI-01' 'Finding' 'tenant:creation' 'Users can create agent blueprints' 'No dated reading of the setting: Learn documents it only in the admin center, so a person records it (creation-setting.json)' }
    else {
        $age = ($AsOf.Date - (ConvertTo-NpiAgentDate $cs.readOn).Date).TotalDays
        if ("$($cs.value)" -ne 'No') { & $add 'NPI-AI-01' 'Finding' 'tenant:creation' 'Users can create agent blueprints' "Set to '$($cs.value)': any user can create a blueprint and its principal. Set it to No" }
        elseif ($age -gt $rules.creationSettingMaxAgeDays) { & $add 'NPI-AI-01' 'Finding' 'tenant:creation' 'Users can create agent blueprints' "Read as No on $($cs.readOn), $age days ago; read it again (limit $($rules.creationSettingMaxAgeDays) days)" }
    }
    $dur = Get-NpiAgentValue $Estate.AuthorizationPolicy 'defaultUserRolePermissions'
    if ((Get-NpiAgentValue $dur 'allowedToCreateApps') -ne $false) { & $add 'NPI-AI-02' 'Finding' 'tenant:app-registration' 'Users can register applications' 'allowedToCreateApps is true: an agent can still arrive as an ordinary app registration' }
    $extra = @(@(Get-NpiAgentValue $dur 'permissionGrantPoliciesAssigned') | Where-Object { $_ -notin $rules.allowedUserConsentPolicies })
    if ($extra.Count) { & $add 'NPI-AI-02' 'Finding' 'tenant:user-consent' 'User consent' ("User consent beyond the baseline: {0}" -f ($extra -join ', ')) }

    # --- per agent identity ----------------------------------------------------------------
    $checkHandshake = {
        param($key, $label, $h, $invRow, [string]$blueprintAppId)
        $missing = @(foreach ($k in $rules.handshakeFields) {
                if ($k -eq 'BlueprintAppId' -and -not $blueprintAppId) { continue }
                $v = Get-NpiAgentValue $h $k
                if ($null -eq $v -or "$v" -eq '' -or ($v -is [array] -and $v.Count -eq 0)) { $k }
            })
        $problems = [Collections.Generic.List[string]]::new()
        if ($missing.Count) { $problems.Add("missing $($missing -join ', ')") }
        if ($blueprintAppId -and $h.BlueprintAppId -and $h.BlueprintAppId -ne $blueprintAppId) { $problems.Add("names blueprint $($h.BlueprintAppId), but the directory says $blueprintAppId") }
        if ($h.SponsorUpn -and $h.SponsorUpn -eq $h.TechnicalOwnerUpn) { $problems.Add('the technical owner is the sponsor') }
        if ($invRow) {
            if ($h.Placement -and $invRow.Placement -and $h.Placement -ne $invRow.Placement) { $problems.Add("placement $($h.Placement) differs from the record's $($invRow.Placement)") }
            if ($h.UseCaseId -and $h.UseCaseId -ne $invRow.UseCaseId) { $problems.Add("use case $($h.UseCaseId) isn't the record's $($invRow.UseCaseId)") }
        }
        if ($problems.Count) { & $add 'NPI-AI-05' 'Finding' $key $label ("Handshake {0} incomplete: {1}" -f $h.HandshakeId, ($problems -join '; ')) }
        if ($h.AccessMode -notin $rules.accessModes) { & $add 'NPI-AI-12' 'Finding' $key $label "No access mode chosen ('$($h.AccessMode)'): choose on-behalf-of, app-only or agent user before any permission is granted" }
        -not $problems.Count -and $h.AccessMode -in $rules.accessModes
    }
    $checkRoles = {
        param($key, $label, [object[]]$roles, $h)
        foreach ($ra in @($roles | Where-Object { $null -ne $_ })) {
            $tb = @(if ($h) { @($h.TimeBoundRoles) | Where-Object { $_.RoleDefinitionId -eq $ra.roleDefinitionId } })
            $ok = $tb.Count -and (ConvertTo-NpiAgentDate $tb[0].ExpiresOn) -ge $AsOf.Date
            $rd = Get-NpiAgentValue $ra 'roleDefinition'; $name = if ($rd -and (Get-NpiAgentValue $rd 'displayName')) { "$(Get-NpiAgentValue $rd 'displayName') ($($ra.roleDefinitionId))" } elseif ($tb.Count) { $tb[0].Role } else { $ra.roleDefinitionId }
            if ($ok) { & $add 'NPI-AI-14' 'Info' "$key/$($ra.roleDefinitionId)" $label "Holds $name until $($tb[0].ExpiresOn) under $($tb[0].Approval): time-bound, recorded in the handshake" }
            else { & $add 'NPI-AI-14' 'Finding' "$key/$($ra.roleDefinitionId)" $label "Holds directory role $name with no recorded end date: no AI identity holds a standing privileged role" }
        }
    }
    $sponsorEvents = {
        # The ten-business-day rule over the HR mover and leaver events of anyone who sponsors this identity.
        param($key, $label, [string[]]$sponsorUpns, [string[]]$recordUpns)
        $state = 'None'
        foreach ($ev in @($Inputs.SponsorEvents)) {
            if ($ev.SponsorUpn -notin @($sponsorUpns + $recordUpns)) { continue }
            $start = ConvertTo-NpiAgentDate $ev.EffectiveDate
            $due = Get-NpiBusinessDayDeadline -Start $start -Days $rules.confirmationBusinessDays -Holidays $holidays
            $conf = @($Inputs.Confirmations | Where-Object { $_.AgentIdentityId -eq $key -and $_.EventSponsorUpn -eq $ev.SponsorUpn -and (ConvertTo-NpiAgentDate $_.ConfirmedOn) -ge $start -and (ConvertTo-NpiAgentDate $_.ConfirmedOn) -le $due })
            if ($conf.Count) { continue }
            if ($AsOf.Date -gt $due) {
                & $add 'NPI-AI-16' 'Finding' "$key/$($ev.SponsorUpn)" $label ("Sponsor {0} ({1} {2}): no confirmation by {3}, ten business days later. An orphaned agent: the identity governance officer confirms, then the orphan rule (D-N2) applies" -f $ev.SponsorUpn, $ev.Event, $ev.EffectiveDate, $due.ToString('yyyy-MM-dd'))
                $state = 'Orphaned'
            } else {
                & $add 'NPI-AI-16' 'Info' "$key/$($ev.SponsorUpn)" $label ("Sponsor {0} ({1} {2}): {3} or a successor confirms by {4}" -f $ev.SponsorUpn, $ev.Event, $ev.EffectiveDate, $ev.NewSponsorUpn, $due.ToString('yyyy-MM-dd'))
                if ($state -ne 'Orphaned') { $state = "AwaitingConfirmation until $($due.ToString('yyyy-MM-dd'))" }
            }
        }
        $state
    }

    foreach ($a in @($Estate.Identities)) {
        $o = $a.Object; $key = "sp:$($o.id)"; $label = "$($o.displayName) (AgentIdentity)"
        $invRow = if ($invById.ContainsKey($o.id)) { $invById[$o.id] } else { $null }
        $h = if ($hsById.ContainsKey($o.id)) { $hsById[$o.id] } else { $null }
        $handshakeOk = $false
        if (-not $invRow -and -not $h) { & $add 'NPI-AI-22' 'Finding' $key $label 'A shadow AI identity: no inventory record and no handshake. Security operations first, then the owner once found' }
        elseif (-not $h) { & $add 'NPI-AI-04' 'Finding' $key $label 'No production handshake record: created without the reviewed record' }
        else {
            $handshakeOk = & $checkHandshake $key $label $h $invRow $o.agentIdentityBlueprintId
            $created = ConvertTo-NpiAgentDate $o.createdDateTime
            if ($created -and $created.Date -lt (ConvertTo-NpiAgentDate $h.ReviewedOn).Date) { & $add 'NPI-AI-06' 'Finding' $key $label "Created $($created.ToString('yyyy-MM-dd')), before its handshake was reviewed on $($h.ReviewedOn)" }
        }

        # Sponsors and owners, from the directory, against the record.
        $userSponsors = @(foreach ($s in @($a.Sponsors | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.user' })) { & $person $s.id })
        $groupSponsors = @($a.Sponsors | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.group' } | ForEach-Object id)
        $valid = @($userSponsors | Where-Object { $_ -and -not (Test-NpiAgentSponsor $_ $empType) })
        $why = @($userSponsors | ForEach-Object { if ($_) { $w = Test-NpiAgentSponsor $_ $empType; if ($w) { "$($_.userPrincipalName) is $w" } } })
        if (-not $valid.Count) { & $add 'NPI-AI-07' 'Finding' $key $label ("No accountable human: no sponsor who is an enabled employee{0}" -f $(if ($why) { " ($($why -join '; '))" } else { '' })) }
        if ($rules.sponsor.requireGroup -and -not $groupSponsors.Count) { & $add 'NPI-AI-07' 'Warn' "$key/group" $label 'No sponsoring group: accountability rests on one person' }
        $sponsorUpns = @($userSponsors | Where-Object { $_ } | ForEach-Object userPrincipalName)
        if ($invRow) {
            if ($invRow.FederalSponsorUpn -notin $sponsorUpns) { & $add 'NPI-AI-08' 'Finding' $key $label ("The record ({0}) names sponsor {1}; the directory has {2}" -f $invRow.UseCaseId, $invRow.FederalSponsorUpn, $(if ($sponsorUpns) { $sponsorUpns -join ', ' } else { 'none' })) }
            if ($invRow.SponsoringGroupId -and $invRow.SponsoringGroupId -notin $groupSponsors) { & $add 'NPI-AI-08' 'Finding' "$key/group" $label "The record's sponsoring group $($invRow.SponsoringGroupId) isn't a sponsor in the directory" }
        }
        $ownerIds = @($a.Owners | ForEach-Object id)
        $sponsorIds = @($a.Sponsors | ForEach-Object id)
        if (-not $ownerIds.Count) { & $add 'NPI-AI-09' 'Finding' $key $label 'No technical owner' }
        elseif (@($ownerIds | Where-Object { $_ -in $sponsorIds }).Count) { & $add 'NPI-AI-09' 'Finding' $key $label 'The sponsor is also the technical owner: the person who decides the agent should exist holds its keys' }

        # Least privilege.
        & $checkRoles $key $label $a.Roles $h
        $consented = @(if ($h) { @($h.Consent) | Where-Object { $_.AppRoleId } | ForEach-Object AppRoleId })
        foreach ($ar in @($a.AppRoles)) {
            if ($h -and $h.AccessMode -eq 'OnBehalfOf') { & $add 'NPI-AI-15' 'Warn' "$key/$($ar.appRoleId)" $label "An application permission ($($ar.appRoleId) on $($ar.resourceDisplayName)) on an on-behalf-of agent" }
            elseif ($ar.appRoleId -notin $consented) { & $add 'NPI-AI-15' 'Warn' "$key/$($ar.appRoleId)" $label "Application permission $($ar.appRoleId) on $($ar.resourceDisplayName) isn't in the handshake's consent list" }
        }

        # Approval attribute: set only by the handshake.
        $approved = Test-NpiAgentApproved $a.Attributes $rules.approvalAttribute
        if ($approved -and -not $handshakeOk) { & $add 'NPI-AI-20' 'Finding' $key $label 'Carries the approval attribute without a complete handshake: the block policy would let it through' }
        elseif ($handshakeOk -and -not $approved) { & $add 'NPI-AI-20' 'Warn' $key $label 'Approved in the handshake but the approval attribute is missing: blocked once the policy is enforced' }

        $state = & $sponsorEvents $key $label $sponsorUpns @($(if ($invRow) { $invRow.FederalSponsorUpn }))
        if ($state -eq 'Orphaned' -or -not $valid.Count) { $orphans.Add([pscustomobject]@{ IdentityId = $key; Name = $o.displayName; Type = 'AgentIdentity'; Reason = $(if ($state -eq 'Orphaned') { 'Sponsor transfer unconfirmed after ten business days' } else { 'No accountable human' }); Rule = 'D-N2: the identity governance officer confirms, then a person disables; never automatic' }) }
        $ids.Add([pscustomobject]@{
                IdentityId = $key; Name = $o.displayName; Type = 'AgentIdentity'; Blueprint = $o.agentIdentityBlueprintId
                FederalSponsor = ($valid | Select-Object -First 1 | ForEach-Object userPrincipalName); SponsoringGroup = ($groupSponsors -join '; ')
                TechnicalOwner = (@($a.Owners | ForEach-Object { $p = & $person $_.id; if ($p) { $p.userPrincipalName } else { $_.id } }) -join '; ')
                InventoryRecord = "$(if ($invRow) { $invRow.RecordId })"; UseCaseId = "$(if ($invRow) { $invRow.UseCaseId })"; Handshake = "$(if ($h) { $h.HandshakeId })"
                AccessMode = "$(if ($h) { $h.AccessMode })"; Approved = $approved; SponsorState = $state; Governance = 'Agent ID'
            })
    }

    # --- per blueprint ---------------------------------------------------------------------
    foreach ($b in @($Estate.Blueprints)) {
        $o = $b.Object; $key = "app:$($o.appId)"; $label = "$($o.displayName) (AgentIdentityBlueprint)"
        $prod = -not (@($o.tags) | Where-Object { $_ -in 'Development', 'Test' })
        $kinds = @(Get-NpiAgentCredentialKind -Blueprint $b -TenantId $tenantId -LoginHost $loginHost)
        $hsFor = @($hs | Where-Object { $_.BlueprintAppId -eq $o.appId })
        if ('Secret' -in $kinds) {
            if ($prod) { & $add 'NPI-AI-10' 'Finding' $key $label 'A client secret on a production blueprint: every agent identity created from it shares the secret. Managed identity, else federation, else certificate' }
            else { & $add 'NPI-AI-10' 'Info' $key $label "A client secret on a non-production blueprint (tags: $(@($o.tags) -join ', ')): Learn allows it for development and test; it never goes to production" }
        }
        if ($prod -and $kinds[0] -eq 'Certificate') { & $add 'NPI-AI-11' 'Warn' $key $label 'A certificate where a managed identity or federation would do: record why in the handshake (CredentialPlan)' }
        foreach ($ip in @($b.Inheritable)) {
            $rk = "$(Get-NpiAgentValue (Get-NpiAgentValue $ip 'inheritableRoles') 'kind')"; $sk = "$(Get-NpiAgentValue (Get-NpiAgentValue $ip 'inheritableScopes') 'kind')"
            if ($rk -eq 'allAllowed') { & $add 'NPI-AI-13' 'Finding' "$key/$($ip.resourceAppId)/roles" $label "Inherits all application roles of $($ip.resourceAppId) (allAllowed): any future grant to the blueprint becomes a grant to every agent" }
            if ($sk -eq 'allAllowed') { & $add 'NPI-AI-13' 'Warn' "$key/$($ip.resourceAppId)/scopes" $label "Inherits all delegated scopes of $($ip.resourceAppId) (allAllowed): enumerate the shared baseline instead" }
        }
        $inInventory = @($inv | Where-Object { $_.BlueprintAppId -eq $o.appId }).Count
        if (-not $hsFor.Count -and -not $inInventory) { & $add 'NPI-AI-22' 'Finding' $key $label 'A shadow AI blueprint: no inventory record or handshake names it' }
        $userSponsors = @(foreach ($s in @($b.Sponsors | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.user' })) { & $person $s.id })
        $valid = @($userSponsors | Where-Object { $_ -and -not (Test-NpiAgentSponsor $_ $empType) })
        if (-not $valid.Count) { & $add 'NPI-AI-07' 'Finding' $key $label 'No sponsor who is an enabled employee' }
        $ownerIds = @($b.Owners | ForEach-Object id); $sponsorIds = @($b.Sponsors | ForEach-Object id)
        if (@($ownerIds | Where-Object { $_ -in $sponsorIds }).Count) { & $add 'NPI-AI-09' 'Finding' $key $label 'The sponsor is also the blueprint owner, who holds the credentials of every agent made from it' }
        $ids.Add([pscustomobject]@{
                IdentityId = $key; Name = $o.displayName; Type = 'AgentIdentityBlueprint'; Blueprint = $o.appId
                FederalSponsor = ($valid | Select-Object -First 1 | ForEach-Object userPrincipalName); SponsoringGroup = (@($b.Sponsors | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.group' } | ForEach-Object id) -join '; ')
                TechnicalOwner = (@($b.Owners | ForEach-Object { $p = & $person $_.id; if ($p) { $p.userPrincipalName } else { $_.id } }) -join '; ')
                InventoryRecord = "$($o.serviceManagementReference)"; UseCaseId = ''; Handshake = (@($hsFor | ForEach-Object HandshakeId) -join '; ')
                AccessMode = ''; Approved = $null; SponsorState = ''; Governance = "Agent ID; credential $($kinds -join ', ')"
            })
    }

    # --- AI systems on service principals and managed identities (D-N6 fallback) ------------
    $regByObject = @{}; foreach ($r in @($Runs.Register.Rows)) { if ($r.ObjectId) { $regByObject[$r.ObjectId] = $r } }
    $regByApp = @{}; foreach ($r in @($Runs.Register.Rows | Where-Object Type -EQ 'AppRegistration')) { $regByApp[$r.AppId] = $r }
    foreach ($fb in @($Estate.Fallback)) {
        $row = $fb.Inventory; $key = "sp:$($row.IdentityObjectId)"; $label = "$($row.Name) ($($row.IdentityType))"
        $h = if ($hsById.ContainsKey($row.IdentityObjectId)) { $hsById[$row.IdentityObjectId] } else { $null }
        if ($Capability.Mode -eq 'AgentId' -and -not ($h -and $h.FallbackReason)) { & $add 'NPI-AI-03' 'Warn' $key $label 'An agent on an ordinary service principal where agent identities are available: route it to the blueprint path, or record the D-N6 fallback reason in its handshake' }
        elseif ($Capability.Mode -eq 'Fallback') { & $add 'NPI-AI-03' 'Info' $key $label "Governed under the D-N6 fallback: agent identities aren't available in cloud '$($Capability.Cloud)'" }
        if (-not $h) { & $add 'NPI-AI-04' 'Finding' $key $label 'No production handshake record' } else { $null = & $checkHandshake $key $label $h $row '' }
        $sp = if ($regByObject.ContainsKey($row.IdentityObjectId)) { $regByObject[$row.IdentityObjectId] } else { $null }
        $app = if ($row.BlueprintAppId -and $regByApp.ContainsKey($row.BlueprintAppId)) { $regByApp[$row.BlueprintAppId] } elseif ($sp -and $regByApp.ContainsKey($sp.AppId)) { $regByApp[$sp.AppId] } else { $null }
        if ($app -and $app.CredentialKind -eq 'Secret') { & $add 'NPI-AI-10' 'Finding' $key $label "A client secret on the app registration ($($app.Name)): the same rule as a production blueprint" }
        if ($app -and $app.HighPrivilegeAppRoles) { & $add 'NPI-AI-15' 'Finding' $key $label "Holds high-privilege Graph permission $($app.HighPrivilegeAppRoles), which Agent ID would block outright for an agent" }
        & $checkRoles $key $label $fb.Roles $h
        $s = & $person $row.FederalSponsorUpn
        $w = Test-NpiAgentSponsor $s $empType
        if ($w) { & $add 'NPI-AI-07' 'Finding' $key $label "No accountable human: the record's sponsor $($row.FederalSponsorUpn) is $w" }
        if ($row.TechnicalOwnerUpn -eq $row.FederalSponsorUpn) { & $add 'NPI-AI-09' 'Finding' $key $label 'The sponsor is also the technical owner' }
        $state = & $sponsorEvents $key $label @($row.FederalSponsorUpn) @()
        $ids.Add([pscustomobject]@{
                IdentityId = $key; Name = $row.Name; Type = $row.IdentityType; Blueprint = ''
                FederalSponsor = $(if (-not $w) { $row.FederalSponsorUpn } else { '' }); SponsoringGroup = "$($row.SponsoringGroupId)"; TechnicalOwner = "$($row.TechnicalOwnerUpn)"
                InventoryRecord = "$($row.RecordId)"; UseCaseId = "$($row.UseCaseId)"; Handshake = "$(if ($h) { $h.HandshakeId })"
                AccessMode = "$(if ($h) { $h.AccessMode })"; Approved = $null; SponsorState = $state; Governance = "D-N6 fallback ($(if ($sp) { $sp.Type } else { 'not in the register' }))"
            })
    }

    # --- inventory entries the directory can't match: N6.7 ------------------------------------
    $known = @{}; foreach ($i in $ids) { $known[($i.IdentityId -replace '^(sp|app):', '')] = $true }
    foreach ($row in $inv) {
        $agentic = $row.Classification -eq 'Agentic AI' -and $row.Stage -in 'Deployed', 'Piloted'
        if (-not $agentic) { continue }
        if ($row.IdentityType -eq 'None' -or -not $row.IdentityObjectId) { & $add 'NPI-AI-21' 'Finding' "uc:$($row.UseCaseId)" "$($row.Name) (use case)" "An agentic AI system ($($row.Stage)) with no governed identity: issue one through the handshake, or correct the inventory" }
        elseif (-not $known.ContainsKey($row.IdentityObjectId)) {
            if ($Capability.Mode -eq 'Fallback' -and $row.IdentityType -eq 'AgentIdentity') { & $add 'NPI-AI-03' 'Finding' "uc:$($row.UseCaseId)" "$($row.Name) (use case)" "The record names an agent identity, but D-N6 says agent identities aren't available in cloud '$($Capability.Cloud)'" }
            else { & $add 'NPI-AI-21' 'Finding' "uc:$($row.UseCaseId)" "$($row.Name) (use case)" "The record names identity $($row.IdentityObjectId), which the directory doesn't return" }
        }
    }

    # --- N6.5 sponsor workflows -------------------------------------------------------------
    $td = $rules.sponsorTaskDefinitions
    foreach ($cat in 'leaver', 'mover') {
        $ok = @($Estate.Workflows | Where-Object {
                $_.Object.category -eq $cat -and $_.Object.isEnabled -and
                (@($_.Tasks | Where-Object { $_.isEnabled } | ForEach-Object taskDefinitionId) -contains $td.transferToManager) -and
                (@($_.Tasks | Where-Object { $_.isEnabled } | ForEach-Object taskDefinitionId) -contains $td.emailManager)
            })
        if (-not $ok.Count) {
            $sev = if ($Capability.SponsorWorkflows.available -eq $true) { 'Finding' } else { 'Warn' }
            & $add 'NPI-AI-17' $sev "tenant:lcw-$cat" "Lifecycle Workflows ($cat)" ("No enabled {0} workflow with 'Transfer agent identity sponsorships to manager' and 'Send email to manager about sponsorship changes'{1}" -f $cat, $(if ($sev -eq 'Warn') { '; in this cloud the native tasks are not published: use a custom task extension that opens a ticket per agent' } else { '' }))
        }
    }

    # --- N6.6 agent Conditional Access ------------------------------------------------------
    $cfg = Get-NpiAgentConfig
    if ($Capability.AgentConditionalAccess.available -eq $false) {
        & $add 'NPI-AI-18' 'Info' 'ca:not-available' 'Agent Conditional Access' "Not published for cloud '$($Capability.Cloud)' (D-N6): the fallback service principals are covered by Conditional Access for workload identities (Chapter 08)"
    }
    foreach ($rel in @($(if ($Capability.AgentConditionalAccess.available -ne $false) { $rules.desiredCaPolicies }))) {
        $want = Get-Content -LiteralPath (Join-Path $cfg.Root $rel) -Raw | ConvertFrom-Json -AsHashtable
        $kind = if ($rel -match 'high-risk') { 'HighRisk' } else { 'Unapproved' }
        $rule = if ($kind -eq 'HighRisk') { 'NPI-AI-19' } else { 'NPI-AI-18' }
        $sev = if ($kind -eq 'HighRisk') { 'Warn' } else { 'Finding' }
        $have = if ($policyNames.ContainsKey($want.displayName)) { $policyNames[$want.displayName] } else { $null }
        $watch = "preview watch item: $($Capability.AgentConditionalAccess.stage)"
        if (-not $have) { & $add $rule $sev "ca:$kind" $want.displayName "Not in the tenant ($watch): create it report-only through the reviewed plan" ; continue }
        $problems = @(Test-NpiAgentCaPolicyShape -Policy $have -Kind $kind -ApprovalRule $rules.approvalAttribute)
        if ($have.state -eq 'enabled') { & $add $rule 'Warn' "ca:$kind" $want.displayName "Enforced while agent targeting is a $watch; D-N6 keeps it report-only until the label is removed in this cloud" }
        elseif ($problems.Count) { & $add $rule $sev "ca:$kind" $want.displayName ("Differs from the reviewed policy: {0}" -f ($problems -join '; ')) }
    }

    # --- N6.7 credentials added outside the pipeline ------------------------------------------
    $aiObjects = @{}; foreach ($b in @($Estate.Blueprints)) { $aiObjects[$b.Object.id] = $b.Object.displayName }
    foreach ($a in @($Estate.Identities)) { $aiObjects[$a.Object.id] = $a.Object.displayName }
    foreach ($fb in @($Estate.Fallback)) { $aiObjects[$fb.Inventory.IdentityObjectId] = $fb.Inventory.Name; $r = $regByApp["$($fb.Inventory.BlueprintAppId)"]; if ($r) { $aiObjects[$r.ObjectId] = $fb.Inventory.Name } }
    foreach ($au in @($Estate.Audits | Where-Object { $_.activityDisplayName -in $rules.credentialAuditActivities -and $_.result -eq 'success' })) {
        foreach ($t in @($au.targetResources)) {
            $agentic = "$(Get-NpiAgentValue $t 'agentType')" -notin '', 'notAgentic'
            if (-not ($agentic -or $aiObjects.ContainsKey($t.id))) { continue }
            $when = ConvertTo-NpiAgentDate $au.activityDateTime
            $match = @($Inputs.Changes | Where-Object { $_.ObjectId -eq $t.id -and $when -ge (ConvertTo-NpiAgentDate $_.WindowStart) -and $when -le (ConvertTo-NpiAgentDate $_.WindowEnd) })
            if ($match.Count) { continue }
            $by = Get-NpiAgentValue (Get-NpiAgentValue $au.initiatedBy 'user') 'userPrincipalName'
            if (-not $by) { $by = Get-NpiAgentValue (Get-NpiAgentValue $au.initiatedBy 'app') 'displayName' }
            & $add 'NPI-AI-23' 'Finding' "audit:$($au.id)" "$($t.displayName) ($(Get-NpiAgentValue $t 'agentType'))" ("'{0}' at {1} by {2} matches no change record: a credential added outside the pipeline" -f $au.activityDisplayName, $when.ToString('yyyy-MM-ddTHH:mm:ssZ'), $by)
        }
    }

    [pscustomobject]@{ Identities = $ids.ToArray(); Findings = $f.ToArray(); OrphanCandidates = $orphans.ToArray(); Capability = $Capability; Evidence = $Reader.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- the CA plan and its writer

function New-NpiAgentCaPlan {
    <#
    .SYNOPSIS
        A dry-run plan for the two agent policies: Create (report-only) where the tenant has no
        policy of that name, InPlace or Differs where it has one. Nothing here writes. Refuses a
        reviewed policy file that isn't report-only Block, and a cloud where D-N6 says agent
        Conditional Access isn't available.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Estate, [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][datetime]$AsOf)
    $cfg = Get-NpiAgentConfig; $cap = Get-NpiAgentCapability -Cloud $Cloud
    $graph = (Get-NpiCloud -Cloud $Cloud).Graph
    $actions = [Collections.Generic.List[object]]::new()
    foreach ($rel in @($cfg.Rules.desiredCaPolicies)) {
        $want = Get-Content -LiteralPath (Join-Path $cfg.Root $rel) -Raw | ConvertFrom-Json -AsHashtable
        $kind = if ($rel -match 'high-risk') { 'HighRisk' } else { 'Unapproved' }
        $bad = @(Test-NpiAgentCaPolicyShape -Policy $want -Kind $kind -ApprovalRule $cfg.Rules.approvalAttribute)
        if ($bad.Count) { throw "The reviewed policy $rel doesn't meet the design: $($bad -join '; ')" }
        $have = @($Estate.CaPolicies | Where-Object { $_.displayName -eq $want.displayName })
        $a = [ordered]@{ ActionId = "$kind"; Policy = $want.displayName; Kind = $kind; Action = ''; Write = $false; Call = ''; Method = ''; Target = ''; Body = $null; Reason = '' }
        if ($cap.AgentConditionalAccess.available -eq $false) { $a.Action = 'NotAvailable'; $a.Reason = "D-N6: agent Conditional Access isn't published for cloud '$Cloud'" }
        elseif (-not $have.Count) { $a.Action = 'Create'; $a.Write = $true; $a.Call = 'agid-ca-create'; $a.Method = 'POST'; $a.Target = "$graph/beta/identity/conditionalAccess/policies"; $a.Body = $want; $a.Reason = "Report-only; $($cap.AgentConditionalAccess.stage), a watch item" }
        else {
            $diff = @(Test-NpiAgentCaPolicyShape -Policy $have[0] -Kind $kind -ApprovalRule $cfg.Rules.approvalAttribute)
            if ($diff.Count) { $a.Action = 'Differs'; $a.Reason = ($diff -join '; ') } else { $a.Action = 'InPlace'; $a.Reason = "Policy $($have[0].id) is report-only and matches" }
        }
        $actions.Add([pscustomobject]$a)
    }
    [ordered]@{ kind = 'agent-ca-plan'; tenantId = $TenantId; cloud = $Cloud; created = $AsOf.ToString('yyyy-MM-dd'); decision = $cap.Decision; actions = $actions.ToArray() }
}

function New-NpiAgentCaWriter {
    <#
    .SYNOPSIS
        The only code in this chapter that can write. Its calls are the agent-ca-apply task's: re-read
        the policies, then POST a report-only Block policy. A live run is a person, delegated, with
        Conditional Access Administrator.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][scriptblock]$Invoke)
    [pscustomobject]@{ Cloud = Get-NpiCloud -Cloud $Cloud; TenantId = $TenantId; Task = 'agent-ca-apply'; Calls = @(Get-NpiAgentCall -Task 'agent-ca-apply'); Invoke = $Invoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function Invoke-NpiAgentCaPlan {
    <#
    .SYNOPSIS
        Apply an approved plan. Refuses a plan whose SHA-256 isn't the approved one, for another
        tenant or cloud, older than seven days, or with a body that isn't report-only Block. Before
        each POST it re-reads the policies and skips if one with that name now exists. Without
        -Apply it reports WouldSend.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Writer, [Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)][datetime]$AsOf, [switch]$Apply)
    $sha = Get-NpiFileHash -Path $PlanPath
    if ($sha -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $sha, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    if ($plan.kind -ne 'agent-ca-plan') { throw "$PlanPath isn't an agent Conditional Access plan." }
    if ($plan.tenantId -ne $Writer.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Writer.TenantId)." }
    if ($plan.cloud -ne $Writer.Cloud.Name) { throw "The plan is for cloud '$($plan.cloud)', not '$($Writer.Cloud.Name)'." }
    $age = ($AsOf.Date - (ConvertTo-NpiAgentDate $plan.created).Date).TotalDays
    if ($age -gt $script:MaxPlanAgeDays) { throw "The plan is $age days old; the limit is $($script:MaxPlanAgeDays). Make and review a new one." }
    $create = $Writer.Calls | Where-Object { $_.id -eq 'agid-ca-create' }
    $url = "$($Writer.Cloud.Graph)/$($create.version)$($create.path)"
    $results = [Collections.Generic.List[object]]::new()
    foreach ($a in @($plan.actions | Where-Object { $_.Write })) {
        if ($a.Method -ne 'POST' -or $a.Call -ne 'agid-ca-create' -or $a.Target -ne $url) { throw "Refusing action $($a.ActionId): only a POST to $url is allowed." }
        $b = $a.Body
        if ($b.state -ne $script:ReportOnly) { throw "Refusing action $($a.ActionId): state '$($b.state)' isn't report-only." }
        if (@($b.grantControls.builtInControls).Count -ne 1 -or $b.grantControls.builtInControls[0] -ne 'block') { throw "Refusing action $($a.ActionId): the grant isn't Block alone." }
        $now = @(Invoke-NpiList -Reader $Writer -CallId 'agid-ca-policies')
        if (@($now | Where-Object { $_.displayName -eq $b.displayName }).Count) { $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Status = 'Skipped'; Detail = 'A policy with this name exists now; re-run the check' }); continue }
        if (-not $Apply) { $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Status = 'WouldSend'; Detail = "POST $url" }); continue }
        Assert-NpiHost -Uri $url -ExpectedHost $Writer.Cloud.Graph
        $Writer.Evidence.Add([pscustomobject]@{ Call = 'agid-ca-create'; Method = 'POST'; Target = $url; At = [DateTime]::UtcNow.ToString('o') })
        $resp = & $Writer.Invoke 'POST' $url $b $null
        $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Status = 'Sent'; Detail = "Created $($resp.id) report-only; review its report-only results before any change of state" })
    }
    [pscustomobject]@{ PlanSha256 = $sha; Results = $results.ToArray(); Evidence = $Writer.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- the run

function Export-NpiAgentRun {
    <#
    .SYNOPSIS
        Write a run's files and a manifest with the task, cloud, tenant, D-N6 mode, the permissions
        the task holds, every request, the SHA-256 of each file, and of each input.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][ValidateSet('agent-id', 'agent-ca-apply')][string]$Task, [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [string]$AsOf, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [hashtable]$Extra = @{})
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) { $p = Join-Path $OutputPath $name; Write-NpiJson -Path $p -Value $Files[$name]; $hashes[$name] = Get-NpiFileHash -Path $p }
    $perm = Get-NpiAgentRequiredPermission -Task $Task
    $m = [ordered]@{ task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; asOf = $AsOf; generated = [DateTime]::UtcNow.ToString('o'); graphPermissions = $perm.GraphPermissions
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } }); files = $hashes }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

# ----------------------------------------------------------------------------- the fake

function New-NpiAgentFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Microsoft Graph for Chapter 09, served from tests/fixtures/ch09/agent-estate.json.
        GET only unless -AllowWrite, which accepts the POSTs Learn's samples send (create a
        blueprint, add a federated credential or a password, add inheritable permissions, create a
        Conditional Access policy) and changes the estate so a test can check the result. Every
        call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$Cloud = 'gcc', [int]$PageSize = 2, [switch]$AllowWrite)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-NpiCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); Graph = $c.Graph; PageSize = $PageSize; AllowWrite = [bool]$AllowWrite; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-NpiAgentFake -State $s -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state
}

function Invoke-NpiAgentFake {
    param($State, [string]$Method, [string]$Uri, $Body, $Headers)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
    $g = $State.Estate
    $u = [Uri]$Uri
    if ("$($u.Scheme)://$($u.Host)" -ne $State.Graph) { throw "The fake refuses host $($u.Host)" }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) { $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0]).Trim()] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]).Trim() } else { '' } }
    $page = {
        param([object[]]$All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $resp = @{ value = @($All | Select-Object -Skip $skip -First $State.PageSize) }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $resp['@odata.nextLink'] = "$($State.Graph)$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
        }
        $resp
    }
    $map = { param([string]$Name, [string]$Id) $m = $g[$Name]; if ($m -and $m.ContainsKey($Id)) { @($m[$Id]) } else { @() } }
    $bp = { param([string]$Id) $x = @($g.blueprints | Where-Object { $_.id -eq $Id -or $_.appId -eq $Id }); if ($x.Count -ne 1) { throw "404 Request_ResourceNotFound application $Id" }; $x[0] }
    $v = '^/(v1\.0|beta)'

    if ($Method -eq 'GET') {
        switch -Regex ($path) {
            "$v/policies/authorizationPolicy$" { return $g.authorizationPolicy }
            "$v/applications/microsoft\.graph\.agentIdentityBlueprint$" { return & $page @($g.blueprints) }
            "$v/applications/([^/]+)/microsoft\.graph\.agentIdentityBlueprint/sponsors$" { return & $page (& $map 'blueprintSponsors' (& $bp $Matches[2]).id) }
            "$v/applications/([^/]+)/microsoft\.graph\.agentIdentityBlueprint/owners$" { return & $page (& $map 'blueprintOwners' (& $bp $Matches[2]).id) }
            "$v/applications/([^/]+)/microsoft\.graph\.agentIdentityBlueprint/inheritablePermissions$" { return & $page (& $map 'inheritablePermissions' (& $bp $Matches[2]).id) }
            "$v/applications/([^/]+)/federatedIdentityCredentials$" { return & $page (& $map 'federatedIdentityCredentials' (& $bp $Matches[2]).id) }
            "$v/servicePrincipals/microsoft\.graph\.agentIdentity$" {
                $rows = @(foreach ($a in @($g.agentIdentities)) {
                        $copy = @{} + $a
                        if ("$($q['$expand'])" -match '^sponsors') { $copy['sponsors'] = @(& $map 'agentSponsors' $a.id) }
                        $copy
                    })
                return & $page $rows
            }
            "$v/servicePrincipals/([^/]+)/microsoft\.graph\.agentIdentity/sponsors$" { return & $page (& $map 'agentSponsors' $Matches[2]) }
            "$v/servicePrincipals/([^/]+)/microsoft\.graph\.agentIdentity/owners$" { return & $page (& $map 'agentOwners' $Matches[2]) }
            "$v/servicePrincipals/([^/]+)/appRoleAssignments$" { return & $page (& $map 'appRoleAssignments' $Matches[2]) }
            "$v/servicePrincipals/([^/]+)$" {
                $id = $Matches[2]
                if ("$($q['$select'])" -notmatch 'customSecurityAttributes') { throw 'The fake serves servicePrincipals/{id} only with $select=id,customSecurityAttributes' }
                $csa = if ($g.customSecurityAttributes.ContainsKey($id)) { $g.customSecurityAttributes[$id] } else { $null }
                return @{ id = $id; customSecurityAttributes = $csa }
            }
            "$v/roleManagement/directory/roleAssignments$" {
                if ("$($q['$filter'])" -notmatch "^principalId eq '([0-9a-f-]{36})'$") { throw "The fake supports only `$filter=principalId eq '<id>', not: $($q['$filter'])" }
                $pid_ = $Matches[1]
                $rows = @(foreach ($ra in @($g.roleAssignments | Where-Object { $_.principalId -eq $pid_ })) { $c2 = @{} + $ra; if ("$($q['$expand'])" -match '^roleDefinition') { $c2['roleDefinition'] = @{ id = $ra.roleDefinitionId; displayName = $g.roleNames[$ra.roleDefinitionId] } }; $c2 })
                return & $page $rows
            }
            "$v/users/([^/]+)$" {
                $key = $Matches[2]; $x = @($g.users | Where-Object { $_.id -eq $key -or $_.userPrincipalName -eq $key })
                if ($x.Count -ne 1) { throw "404 Request_ResourceNotFound user $key" }
                return $x[0]
            }
            '^/beta/identity/conditionalAccess/policies$' { return & $page @($g.conditionalAccessPolicies) }
            '^/v1\.0/identity/conditionalAccess/policies$' {
                # v1.0 doesn't return the agent properties: strip them, as Graph would.
                $rows = @(foreach ($p in @($g.conditionalAccessPolicies)) { $c2 = $p | ConvertTo-Json -Depth 20 | ConvertFrom-Json -AsHashtable; if ($c2.conditions.ContainsKey('clientApplications')) { $c2.conditions.Remove('clientApplications') }; $c2.conditions.Remove('agentIdRiskLevels'); $c2 })
                return & $page $rows
            }
            '^/v1\.0/identityGovernance/lifecycleWorkflows/workflows$' { return & $page @($g.workflows) }
            '^/v1\.0/identityGovernance/lifecycleWorkflows/workflows/([^/]+)/tasks$' { return & $page (& $map 'workflowTasks' $Matches[1]) }
            '^/v1\.0/auditLogs/directoryAudits$' {
                $flt = "$($q['$filter'])"
                if ($flt -notmatch "^category eq '([A-Za-z]+)' and activityDateTime ge (\S+)$") { throw "The fake supports only category eq '<c>' and activityDateTime ge <date>, not: $flt" }
                $cat = $Matches[1]; $since = [datetime]::Parse($Matches[2], [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
                return & $page @($g.directoryAudits | Where-Object { $_.category -eq $cat -and [datetime]::Parse($_.activityDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) -ge $since })
            }
        }
        throw "The fake has no route for GET $path"
    }
    if (-not $State.AllowWrite) { throw "The fake refuses $Method" }
    if ($Method -ne 'POST') { throw "The fake refuses $Method; this chapter never sends it" }
    switch -Regex ($path) {
        '^/v1\.0/applications/?$' {
            # Learn's create sample posts to /applications with an @odata.type of the blueprint.
            if ("$($Body['@odata.type'])" -notmatch '(?i)^#?microsoft\.graph\.agentIdentityBlueprint$') { throw '400 Bad Request: the fake creates agent identity blueprints only' }
            if (-not @($Body['sponsors@odata.bind']).Count) { throw '400 Bad Request: a sponsor is required' }
            $n = @($g.blueprints).Count + 1; $id = '0a000000-0000-4000-8000-0000000001{0:d2}' -f $n; $appId = '1a000000-0000-4000-8000-0000000001{0:d2}' -f $n
            $g.blueprints = @($g.blueprints) + @(@{ '@odata.type' = '#microsoft.graph.agentIdentityBlueprint'; id = $id; appId = $appId; displayName = $Body.displayName; createdDateTime = '2026-10-30T12:00:00Z'; tags = @(); passwordCredentials = @(); keyCredentials = @(); serviceManagementReference = $null })
            $ref = { param($x) @($x | ForEach-Object { $o = "$_" -replace '^.*/users/', ''; @{ '@odata.type' = '#microsoft.graph.user'; id = $o } }) }
            $g.blueprintSponsors[$id] = & $ref $Body['sponsors@odata.bind']
            $g.blueprintOwners[$id] = & $ref $Body['owners@odata.bind']
            return @{ id = $id; appId = $appId }
        }
        "$v/applications/([^/]+)/federatedIdentityCredentials$" {
            $b = & $bp $Matches[2]
            if (-not $g.federatedIdentityCredentials.ContainsKey($b.id)) { $g.federatedIdentityCredentials[$b.id] = @() }
            $g.federatedIdentityCredentials[$b.id] = @($g.federatedIdentityCredentials[$b.id]) + @($Body)
            return $Body
        }
        "$v/applications/([^/]+)/addPassword$" {
            $b = & $bp $Matches[2]
            $b.passwordCredentials = @($b.passwordCredentials) + @(@{ displayName = $Body.passwordCredential.displayName; endDateTime = $Body.passwordCredential.endDateTime; keyId = [guid]::NewGuid().ToString() })
            return @{ secretText = 'fake-secret-not-real' }
        }
        "$v/applications/(?:microsoft\.graph\.agentIdentityBlueprint/([^/]+)|([^/]+)/microsoft\.graph\.agentIdentityBlueprint)/inheritablePermissions$" {
            $key = if ($Matches[2]) { $Matches[2] } else { $Matches[3] }
            $b = & $bp $key
            if (-not $g.inheritablePermissions.ContainsKey($b.id)) { $g.inheritablePermissions[$b.id] = @() }
            if (@($g.inheritablePermissions[$b.id] | Where-Object { $_.resourceAppId -eq $Body.resourceAppId }).Count) { throw '409 Conflict: an entry for this resourceAppId exists; PATCH it' }
            $g.inheritablePermissions[$b.id] = @($g.inheritablePermissions[$b.id]) + @($Body)
            return $Body
        }
        '^/beta/identity/conditionalAccess/policies$' {
            $id = 'ca000000-0000-4000-8000-0000000001{0:d2}' -f (@($g.conditionalAccessPolicies).Count + 1)
            $p = @{} + $Body; $p['id'] = $id
            $g.conditionalAccessPolicies = @($g.conditionalAccessPolicies) + @($p)
            return @{ id = $id; displayName = $Body.displayName; state = $Body.state }
        }
    }
    throw "The fake has no route for POST $path"
}

Export-ModuleMember -Function Get-NpiAgentConfig, Get-NpiAgentCall, Get-NpiAgentRequiredPermission, Get-NpiAgentCapability, New-NpiAgentReader,
    Import-NpiAgentRuns, Import-NpiAgentInputs, Read-NpiAgentEstate, Get-NpiBusinessDayDeadline, Test-NpiAgentCaPolicyShape, Get-NpiAgentCredentialKind,
    Test-NpiAgentId, New-NpiAgentCaPlan, New-NpiAgentCaWriter, Invoke-NpiAgentCaPlan, Export-NpiAgentRun, New-NpiAgentFixtureInvoker, Invoke-NpiAgentFake
