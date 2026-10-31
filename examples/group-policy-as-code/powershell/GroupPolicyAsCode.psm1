#Requires -Version 7.1
<#
.SYNOPSIS
    Group Policy as code: read Intune's Group Policy analytics into a move plan, keep settings
    catalog policies in Git as reviewed JSON, lint them, diff them against the tenant, and create
    only what is missing. Illustrative: tested against fixtures, not against a production tenant.

.DESCRIPTION
    Every Graph call goes through a script block, -Invoke, with the signature
    param($Method, $Uri, $Body, $Headers): Invoke-MgGraphRequest in a tenant, a fake in the tests
    (New-GpcFixtureInvoke). The read side (move plan, tenant read, diff) sends only GET. The write
    side sends only POST /beta/deviceManagement/configurationPolicies, and only with -Apply. Nothing
    here sends PATCH or DELETE.

    Sources: Microsoft Learn, "List groupPolicyMigrationReports", "List groupPolicySettingMappings",
    "Create deviceManagementConfigurationPolicy", "List deviceManagementConfigurationSettings"
    (all Microsoft Graph beta); "Microsoft Graph national cloud deployments". Microsoft's own sample,
    SettingsCatalog_Import_FromJSON.ps1 (examples/third_party/mggraph-intune-samples), is the model
    for the create call; this module adds what it leaves out (see the README).
#>

Set-StrictMode -Version 3.0

# Graph service roots per cloud (Learn, "Microsoft Graph national cloud deployments"). GCC uses
# the worldwide endpoint; GCC High and DoD have their own. Connect-MgGraph environment names are
# from Learn, "Get-MgEnvironment".
$script:GpcClouds = [ordered]@{
    gcc     = @{ GraphHost = 'https://graph.microsoft.com'; Environment = 'Global' }
    global  = @{ GraphHost = 'https://graph.microsoft.com'; Environment = 'Global' }
    gcchigh = @{ GraphHost = 'https://graph.microsoft.us'; Environment = 'USGov' }
    dod     = @{ GraphHost = 'https://dod-graph.microsoft.us'; Environment = 'USGovDoD' }
}

# Properties the service sets itself. Learn's Create page lists them in the object; Microsoft's
# import sample strips them silently. The library refuses them instead (GPC-03), so the file a
# reviewer approves is the body that is sent.
$script:GpcServerProperties = @('id', 'createdDateTime', 'creationDateTime', 'lastModifiedDateTime', 'version',
    'settingCount', 'creationSource', 'priorityMetaData', 'supportsScopeTags', 'isAssigned', '@odata.context')

# Group Policy setting types that Group Policy analytics' Migrate step won't take: Learn says
# AppLocker and firewall rule settings are configured in Endpoint security instead.
$script:GpcEndpointSecurityTypes = @('appLockerRuleCollection', 'windowsFirewallSettings')

function Get-GpcCloud {
    <#
    .SYNOPSIS
        Returns the Graph host and Connect-MgGraph environment name for a cloud: gcc, global, gcchigh
        or dod. An unknown name throws.
    .EXAMPLE
        Get-GpcCloud -Cloud gcchigh
    #>

    <# The Graph host and Connect-MgGraph environment for a cloud. Refuses a name it doesn't know. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    $key = $Cloud.ToLowerInvariant()
    if (-not $script:GpcClouds.Contains($key)) {
        throw "Unknown cloud '$Cloud'. Use one of: $($script:GpcClouds.Keys -join ', ')."
    }
    [pscustomobject]@{ Cloud = $key; GraphHost = $script:GpcClouds[$key].GraphHost; Environment = $script:GpcClouds[$key].Environment }
}

function Get-GpcRequiredScope {
    <#
    .SYNOPSIS
        Returns the least-privileged delegated Graph permission for an action:
        DeviceManagementConfiguration.Read.All for Plan and DryRun, ReadWrite.All for Apply.
    .EXAMPLE
        Get-GpcRequiredScope -Action DryRun
    #>

    <#
    The least-privileged delegated permission for each action, from Learn's API pages:
    reading reports, mappings, policies and their settings needs DeviceManagementConfiguration.Read.All;
    creating a policy needs DeviceManagementConfiguration.ReadWrite.All.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('Plan', 'DryRun', 'Apply')][string]$Action)
    if ($Action -eq 'Apply') { @('DeviceManagementConfiguration.ReadWrite.All') } else { @('DeviceManagementConfiguration.Read.All') }
}

function Invoke-GpcGet {
    <# GET a collection and follow @odata.nextLink until the last page. #>
    param([Parameter(Mandatory)][scriptblock]$Invoke, [Parameter(Mandatory)][string]$Uri)
    $items = [Collections.Generic.List[object]]::new()
    $next = $Uri
    while ($next) {
        $page = & $Invoke 'GET' $next $null $null
        foreach ($v in @((Get-GpcProp $page 'value' @()))) { if ($null -ne $v) { $items.Add($v) } }
        $next = Get-GpcProp $page '@odata.nextLink' $null
    }
    $items.ToArray()
}

function Get-GpcProp {
    <# A property from a hashtable or an object, or a default. #>
    param($Object, [string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object -is [Collections.IDictionary]) { if ($Object.Contains($Name)) { return $Object[$Name] } else { return $Default } }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { $p.Value } else { $Default }
}

function Get-GpcMovePlan {
    <#
    .SYNOPSIS
        One row per imported Group Policy setting, from Intune's Group Policy analytics (beta),
        with a disposition: Candidate, Conflict, EndpointSecurity, NoCatalogSetting, NotSupported,
        Deprecated or Unknown. GET only.
    .DESCRIPTION
        Reads GET /beta/deviceManagement/groupPolicyMigrationReports, then each report's
        groupPolicySettingMappings. A supported setting with an Intune setting definition ID is a
        Candidate. Two GPOs that set the same definition ID to different values make every such
        row a Conflict, the case Learn's Migrate step refuses to continue on. AppLocker and
        firewall settings go to Endpoint security, as Learn says. The plan decides nothing: a
        person still decides, per setting, whether it moves (Book 05, Chapter 08, Phase 1).
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        Get-GpcMovePlan -Invoke $g.Invoke | Group-Object Disposition
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [string]$Cloud = 'gcc'
    )
    $root = (Get-GpcCloud -Cloud $Cloud).GraphHost + '/beta/deviceManagement/groupPolicyMigrationReports'
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($r in (Invoke-GpcGet -Invoke $Invoke -Uri $root)) {
        $rid = "$(Get-GpcProp $r 'id')"
        foreach ($m in (Invoke-GpcGet -Invoke $Invoke -Uri "$root/$rid/groupPolicySettingMappings")) {
            $state = "$(Get-GpcProp $m 'mdmSupportedState' 'unknown')"
            $type = "$(Get-GpcProp $m 'settingType' 'unknown')"
            $def = "$(Get-GpcProp $m 'intuneSettingDefinitionId' '')"
            $disp = if ($script:GpcEndpointSecurityTypes -contains $type) { 'EndpointSecurity' }
            elseif ($state -eq 'supported' -and $def) { 'Candidate' }
            elseif ($state -eq 'supported') { 'NoCatalogSetting' }
            elseif ($state -eq 'unsupported') { 'NotSupported' }
            elseif ($state -eq 'deprecated') { 'Deprecated' }
            else { 'Unknown' }
            $setting = "$(Get-GpcProp $m 'settingDisplayName' '')"
            if (-not $setting) { $setting = "$(Get-GpcProp $m 'settingName' '')" }
            $rows.Add([pscustomobject][ordered]@{
                    Gpo          = "$(Get-GpcProp $r 'displayName')"
                    GpoId        = "$(Get-GpcProp $r 'groupPolicyObjectId')"
                    TargetedInAD = [bool](Get-GpcProp $r 'targetedInActiveDirectory' $false)
                    Setting      = $setting
                    Value        = "$(Get-GpcProp $m 'settingValue' '')"
                    Scope        = "$(Get-GpcProp $m 'settingScope' 'unknown')"
                    SettingType  = $type
                    CspName      = "$(Get-GpcProp $m 'mdmCspName' '')"
                    DefinitionId = $def
                    Disposition  = $disp
                    Note         = ''
                })
        }
    }
    foreach ($g in ($rows | Where-Object Disposition -EQ 'Candidate' | Group-Object DefinitionId)) {
        $values = @($g.Group | ForEach-Object Value | Sort-Object -Unique)
        if ($values.Count -gt 1) {
            $note = ($g.Group | ForEach-Object { '{0}={1}' -f $_.Gpo, $_.Value }) -join '; '
            foreach ($row in $g.Group) { $row.Disposition = 'Conflict'; $row.Note = $note }
        }
    }
    $rows.ToArray()
}

function Read-GpcLibrary {
    <#
    .SYNOPSIS
        Reads every *.json file in the policy library folder, in name order, and returns each with its
        file name, path, SHA-256, data and policy body. Throws on a missing folder or invalid JSON.
    .EXAMPLE
        Read-GpcLibrary -Path ./policies
    #>

    <# Read every *.json file in the library folder, in name order. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "No library folder at $Path" }
    $files = @(Get-ChildItem -LiteralPath $Path -Filter '*.json' -File | Sort-Object Name)
    @(foreach ($f in $files) {
            $raw = [IO.File]::ReadAllText($f.FullName)
            try { $data = $raw | ConvertFrom-Json -AsHashtable -Depth 100 } catch { throw "$($f.Name) is not valid JSON: $($_.Exception.Message)" }
            [pscustomobject]@{
                File   = $f.Name
                Path   = $f.FullName
                Sha256 = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
                Data   = $data
                Policy = (Get-GpcProp $data 'policy' $null)
            }
        })
}

function Get-GpcSettingIds {
    <# The top-level setting definition IDs of a policy body. #>
    param($Policy)
    @(foreach ($s in @(Get-GpcProp $Policy 'settings' @())) {
            $id = Get-GpcProp (Get-GpcProp $s 'settingInstance' $null) 'settingDefinitionId' $null
            if ($id) { "$id" }
        })
}

function Find-GpcODataType {
    <# Every '@odata.type' value in a body, at any depth. #>
    param($Node)
    if ($Node -is [Collections.IDictionary]) {
        foreach ($k in $Node.Keys) {
            if ($k -eq '@odata.type' -and $Node[$k] -is [string]) { $Node[$k] }
            Find-GpcODataType $Node[$k]
        }
    } elseif ($Node -is [Collections.IEnumerable] -and $Node -isnot [string]) {
        foreach ($i in $Node) { Find-GpcODataType $i }
    }
}

function Find-GpcSimpleString {
    <# Simple string setting values: @{ Id; Value }, at any depth. #>
    param($Node)
    if ($Node -is [Collections.IDictionary]) {
        if ($Node.Contains('settingDefinitionId') -and $Node.Contains('simpleSettingValue')) {
            $v = $Node['simpleSettingValue']
            if ($v -is [Collections.IDictionary] -and "$($v['@odata.type'])" -like '*StringSettingValue') {
                [pscustomobject]@{ Id = "$($Node['settingDefinitionId'])"; Value = "$($v['value'])" }
            }
        }
        foreach ($k in $Node.Keys) { Find-GpcSimpleString $Node[$k] }
    } elseif ($Node -is [Collections.IEnumerable] -and $Node -isnot [string]) {
        foreach ($i in $Node) { Find-GpcSimpleString $i }
    }
}

function New-GpcFinding {
    param([ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$Rule, [string]$File, [string]$Issue)
    [pscustomobject][ordered]@{ Severity = $Severity; Rule = $Rule; File = $File; Issue = $Issue }
}

function Test-GpcLibrary {
    <#
    .SYNOPSIS
        Lint the policy library. Rules GPC-01 to GPC-10; the README lists them.
    .PARAMETER Plan
        The move plan from Get-GpcMovePlan (or its CSV). When given, each setting is traced to it.
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        Test-GpcLibrary -Library (Read-GpcLibrary -Path ./policies) -Plan (Get-GpcMovePlan -Invoke $g.Invoke)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Library, [object[]]$Plan)
    $out = [Collections.Generic.List[object]]::new()
    $owners = @{}
    $names = @{}
    foreach ($e in $Library) {
        $d = $e.Data; $p = $e.Policy; $f = $e.File
        $missing = @()
        foreach ($k in 'owner', 'configOwner', 'sourceGpos', 'decisions', 'policy') { if ($null -eq (Get-GpcProp $d $k $null) -or "$(Get-GpcProp $d $k '')" -eq '') { $missing += $k } }
        if (@(Get-GpcProp $d 'sourceGpos' @()).Count -eq 0 -and $missing -notcontains 'sourceGpos') { $missing += 'sourceGpos' }
        if ($p -is [Collections.IDictionary]) {
            foreach ($k in 'name', 'platforms', 'technologies') { if (-not "$(Get-GpcProp $p $k '')") { $missing += "policy.$k" } }
            if (@(Get-GpcProp $p 'settings' @()).Count -eq 0) { $missing += 'policy.settings' }
        }
        if ($missing.Count) { $out.Add((New-GpcFinding Finding 'GPC-01' $f ('Missing: ' + ($missing -join ', ')))) }
        if (-not ($p -is [Collections.IDictionary])) { continue }

        $co = "$(Get-GpcProp $d 'configOwner' '')"
        if ($co -and $co -cne 'Intune') {
            $out.Add((New-GpcFinding Finding 'GPC-02' $f "configOwner is '$co': the library holds only settings Intune owns; another tool's settings stay with that tool"))
        }
        $server = @($script:GpcServerProperties | Where-Object { $p.Contains($_) })
        if ($server.Count) { $out.Add((New-GpcFinding Finding 'GPC-03' $f ('Service-set properties in the body: ' + ($server -join ', ') + '; remove them so the reviewed file is the body sent'))) }
        if ($p.Contains('assignments')) { $out.Add((New-GpcFinding Finding 'GPC-04' $f 'The body carries assignments: policies are created unassigned, and assignment is a separate reviewed step')) }

        $name = "$(Get-GpcProp $p 'name' '')"
        if ($name) {
            if ($names.ContainsKey($name)) { $out.Add((New-GpcFinding Finding 'GPC-05' $f "Policy name '$name' is also used by $($names[$name])")) } else { $names[$name] = $f }
        }
        foreach ($id in (Get-GpcSettingIds $p)) {
            if ($owners.ContainsKey($id) -and $owners[$id] -ne $f) { $out.Add((New-GpcFinding Finding 'GPC-06' $f "Setting $id is also set by $($owners[$id]): one owning policy per setting")) }
            elseif (-not $owners.ContainsKey($id)) { $owners[$id] = $f }
        }
        $bare = @(Find-GpcODataType $p | Where-Object { $_ -notlike '#*' } | Sort-Object -Unique)
        if ($bare.Count) { $out.Add((New-GpcFinding Finding 'GPC-07' $f ('@odata.type without the leading #: ' + ($bare -join ', ')))) }

        $decisions = Get-GpcProp $d 'decisions' @{}
        foreach ($id in (Get-GpcSettingIds $p)) {
            if (-not ($decisions -is [Collections.IDictionary]) -or -not "$(Get-GpcProp $decisions $id '')") {
                $out.Add((New-GpcFinding Finding 'GPC-09' $f "Setting $id has no decision record"))
            }
        }
        foreach ($s in @(Find-GpcSimpleString $p)) {
            if ($s.Id -match 'password|secret|psk|presharedkey|token' -and $s.Value) {
                $out.Add((New-GpcFinding Warn 'GPC-10' $f "Setting $($s.Id) holds a string that may be a secret: anyone with read access to device configuration can read it"))
            }
        }
        if ($Plan) {
            foreach ($id in (Get-GpcSettingIds $p)) {
                $rows = @($Plan | Where-Object { $_.DefinitionId -eq $id })
                $moving = @($rows | Where-Object { $_.Disposition -in 'Candidate', 'Conflict' })
                if ($moving.Count -eq 0) {
                    $out.Add((New-GpcFinding Warn 'GPC-08' $f "Setting $id isn't a Candidate in the move plan: confirm it is meant to be new, not moved from a GPO"))
                } elseif (@($moving | Where-Object Disposition -EQ 'Conflict').Count) {
                    $out.Add((New-GpcFinding Info 'GPC-08' $f "Setting $id has conflicting GPO values ($($moving[0].Note)); decision $(Get-GpcProp $decisions $id '') picks the value"))
                }
            }
        }
    }
    $out.ToArray()
}

function ConvertTo-GpcCanonical {
    <#
    .SYNOPSIS
        Returns one canonical JSON string for a setting instance, so a library file and the tenant's
        copy compare equal when they mean the same thing.
    .EXAMPLE
        $lib = Read-GpcLibrary -Path ./policies
        ConvertTo-GpcCanonical -Node $lib[0].Policy.settings[0].settingInstance
    #>

    <#
    One canonical JSON string for a setting instance, so a file and the tenant's copy compare equal
    when they mean the same thing: keys sorted, nulls and empty arrays dropped, '@odata.type'
    without its leading '#', and ids dropped. Graph's responses omit the '#' and add nulls.
    #>
    param($Node)
    function Norm($n) {
        if ($null -eq $n) { return $null }
        if ($n -is [Collections.IDictionary] -or $n -is [Management.Automation.PSCustomObject]) {
            $h = [ordered]@{}
            $keys = if ($n -is [Collections.IDictionary]) { @($n.Keys) } else { @($n.PSObject.Properties.Name) }
            foreach ($k in ($keys | Sort-Object { "$_" } -CaseSensitive)) {
                if ($k -eq 'id') { continue }
                $v = if ($n -is [Collections.IDictionary]) { $n[$k] } else { $n.$k }
                if ($k -eq '@odata.type' -and $v -is [string]) { $v = $v.TrimStart('#') }
                $nv = Norm $v
                if ($null -eq $nv) { continue }
                if ($nv -is [array] -and $nv.Count -eq 0) { continue }
                $h["$k"] = $nv
            }
            return $h
        }
        if ($n -is [Collections.IEnumerable] -and $n -isnot [string]) {
            return , @(foreach ($i in $n) { Norm $i })
        }
        return $n
    }
    (Norm $Node) | ConvertTo-Json -Depth 100 -Compress
}

function Get-GpcTenantPolicy {
    <#
    .SYNOPSIS
        The tenant's settings catalog policies whose names are in -Name, with their settings. GET only.
    .DESCRIPTION
        GET /beta/deviceManagement/configurationPolicies?$filter=technologies has 'mdm' (the filter
        Microsoft's export sample uses), then GET /configurationPolicies/{id}/settings for each
        policy named in the library. Both need DeviceManagementConfiguration.Read.All.
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        Get-GpcTenantPolicy -Invoke $g.Invoke -Name 'FMP-SC-202-Sign-in-and-power'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][scriptblock]$Invoke, [Parameter(Mandatory)][string[]]$Name, [string]$Cloud = 'gcc')
    $root = (Get-GpcCloud -Cloud $Cloud).GraphHost + '/beta/deviceManagement/configurationPolicies'
    $all = Invoke-GpcGet -Invoke $Invoke -Uri "$root`?`$filter=technologies has 'mdm'"
    @(foreach ($p in $all) {
            $n = "$(Get-GpcProp $p 'name' '')"
            if ($Name -notcontains $n) { continue }
            $id = "$(Get-GpcProp $p 'id')"
            [pscustomobject]@{
                Id           = $id
                Name         = $n
                Description  = "$(Get-GpcProp $p 'description' '')"
                Platforms    = "$(Get-GpcProp $p 'platforms' '')"
                Technologies = "$(Get-GpcProp $p 'technologies' '')"
                ScopeTags    = ((@(Get-GpcProp $p 'roleScopeTagIds' @()) | ForEach-Object { "$_" } | Sort-Object) -join ',')
                Settings     = @(Invoke-GpcGet -Invoke $Invoke -Uri "$root/$id/settings")
            }
        })
}

function Compare-GpcPolicy {
    <#
    .SYNOPSIS
        Compares one library policy body with one tenant policy from Get-GpcTenantPolicy. Returns the
        settings added, removed and changed, the differing properties, and Same.
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        $lib = Read-GpcLibrary -Path ./policies
        $tenant = Get-GpcTenantPolicy -Invoke $g.Invoke -Name 'FMP-SC-202-Sign-in-and-power'
        Compare-GpcPolicy -Desired $lib[1].Policy -Actual $tenant[0]
    #>

    <# Compare one library policy body with one tenant policy. Returns the differences. #>
    param([Parameter(Mandatory)]$Desired, [Parameter(Mandatory)]$Actual)
    $want = @{}; foreach ($s in @(Get-GpcProp $Desired 'settings' @())) { $i = Get-GpcProp $s 'settingInstance'; $want["$(Get-GpcProp $i 'settingDefinitionId')"] = ConvertTo-GpcCanonical $i }
    $have = @{}; foreach ($s in @($Actual.Settings)) { $i = Get-GpcProp $s 'settingInstance'; $have["$(Get-GpcProp $i 'settingDefinitionId')"] = ConvertTo-GpcCanonical $i }
    $added = @($want.Keys | Where-Object { -not $have.ContainsKey($_) } | Sort-Object)
    $removed = @($have.Keys | Where-Object { -not $want.ContainsKey($_) } | Sort-Object)
    $changed = @($want.Keys | Where-Object { $have.ContainsKey($_) -and $have[$_] -cne $want[$_] } | Sort-Object)
    $map = [ordered]@{ description = 'Description'; platforms = 'Platforms'; technologies = 'Technologies' }
    $props = @(foreach ($k in $map.Keys) { if ("$(Get-GpcProp $Desired $k '')" -cne "$($Actual.($map[$k]))") { $k } })
    # Scope tags decide which administrators see the policy; a missing list means the Default tag, "0".
    $wantTags = @(Get-GpcProp $Desired 'roleScopeTagIds' @('0')) | ForEach-Object { "$_" } | Sort-Object
    $haveTags = if ("$(Get-GpcProp $Actual 'ScopeTags' '')") { $Actual.ScopeTags } else { '0' }
    if ((@($wantTags) -join ',') -cne $haveTags) { $props += 'roleScopeTagIds' }
    [pscustomobject]@{ Added = $added; Removed = $removed; Changed = $changed; Properties = $props; Same = ($added.Count + $removed.Count + $changed.Count + $props.Count) -eq 0 }
}

function Compare-GpcLibrary {
    <#
    .SYNOPSIS
        The diff between the library and the tenant: Create, NoChange, Drift or Duplicate per policy.
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        $lib = Read-GpcLibrary -Path ./policies
        $names = $lib | ForEach-Object { $_.Policy['name'] }
        Compare-GpcLibrary -Library $lib -Tenant @(Get-GpcTenantPolicy -Invoke $g.Invoke -Name $names)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Library, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Tenant)
    @(foreach ($e in $Library) {
            $name = "$(Get-GpcProp $e.Policy 'name' '')"
            $match = @($Tenant | Where-Object Name -CEQ $name)
            $row = [ordered]@{ Name = $name; File = $e.File; Action = ''; TenantId = ''; Added = @(); Removed = @(); Changed = @(); Properties = @() }
            if ($match.Count -eq 0) { $row.Action = 'Create' }
            elseif ($match.Count -gt 1) { $row.Action = 'Duplicate'; $row.TenantId = ($match.Id -join ',') }
            else {
                $c = Compare-GpcPolicy -Desired $e.Policy -Actual $match[0]
                $row.TenantId = $match[0].Id
                $row.Action = if ($c.Same) { 'NoChange' } else { 'Drift' }
                $row.Added = $c.Added; $row.Removed = $c.Removed; $row.Changed = $c.Changed; $row.Properties = $c.Properties
            }
            [pscustomobject]$row
        })
}

function Invoke-GpcSync {
    <#
    .SYNOPSIS
        Lint, read the tenant, diff, and (with -Apply) create the policies that are missing.
    .DESCRIPTION
        Without -Apply this is a dry run: GET only, and it says what it would create. With -Apply it
        refuses to write anything if the lint has a finding, or if any policy is Drift or Duplicate:
        a policy that differs from Git is a decision for a person, not for the pipeline. It then
        POSTs each policy to create, reads it back and compares it with the file. It never sends
        PATCH or DELETE. Returns a record for the evidence store, with an ExitCode: 0 clean, 2 when
        something needs a person, 1 when a call failed.
    .EXAMPLE
        # Dry run against the fixture tenant: GET only
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        Invoke-GpcSync -Library (Read-GpcLibrary -Path ./policies) -Invoke $g.Invoke
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Library,
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [string]$Cloud = 'gcc',
        [object[]]$Plan,
        [switch]$Apply
    )
    $c = Get-GpcCloud -Cloud $Cloud
    $findings = @(Test-GpcLibrary -Library $Library -Plan $Plan)
    $names = @($Library | ForEach-Object { "$(Get-GpcProp $_.Policy 'name' '')" } | Where-Object { $_ })
    $exit = 0
    $results = @()
    $created = [Collections.Generic.List[object]]::new()
    try {
        $tenant = @(Get-GpcTenantPolicy -Invoke $Invoke -Name $names -Cloud $c.Cloud)
        $results = @(Compare-GpcLibrary -Library $Library -Tenant $tenant)
        $blocking = @($findings | Where-Object Severity -EQ 'Finding').Count + @($results | Where-Object Action -In 'Drift', 'Duplicate').Count
        if ($blocking -gt 0) { $exit = 2 }
        if ($Apply -and $blocking -eq 0) {
            $uri = "$($c.GraphHost)/beta/deviceManagement/configurationPolicies"
            foreach ($r in @($results | Where-Object Action -EQ 'Create')) {
                $e = $Library | Where-Object File -EQ $r.File
                $body = $e.Policy | ConvertTo-Json -Depth 100 -Compress
                $resp = & $Invoke 'POST' $uri $body @{ 'Content-Type' = 'application/json' }
                $newId = "$(Get-GpcProp $resp 'id')"
                $back = @(Get-GpcTenantPolicy -Invoke $Invoke -Name @($r.Name) -Cloud $c.Cloud | Where-Object Id -EQ $newId)
                $same = $back.Count -eq 1 -and (Compare-GpcPolicy -Desired $e.Policy -Actual $back[0]).Same
                $r.Action = if ($same) { 'Created' } else { 'CreatedDiffers' }
                $r.TenantId = $newId
                if (-not $same) { $exit = 2 }
                $created.Add($newId)
            }
        }
    } catch {
        $exit = 1
        $findings += New-GpcFinding Finding 'GPC-ERR' '' "Graph call failed: $($_.Exception.Message)"
    }
    [pscustomobject][ordered]@{
        Schema    = 'fmp-gpc-sync/1'
        Mode      = $(if ($Apply) { 'Apply' } else { 'DryRun' })
        Cloud     = $c.Cloud
        GraphHost = $c.GraphHost
        Scopes    = @(Get-GpcRequiredScope -Action $(if ($Apply) { 'Apply' } else { 'DryRun' }))
        At        = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        Files     = @($Library | ForEach-Object { [ordered]@{ file = $_.File; sha256 = $_.Sha256 } })
        Findings  = $findings
        Results   = $results
        Created   = $created.ToArray()
        ExitCode  = $exit
    }
}

function Get-GpcFakePage {
    param($State, [object[]]$Items, [string]$Uri)
    $skip = 0; $m = [regex]::Match($Uri, '[?&]\$skiptoken=(\d+)'); if ($m.Success) { $skip = [int]$m.Groups[1].Value }
    $clean = [regex]::Replace($Uri, '[?&]\$skiptoken=\d+', '')
    $slice = @($Items | Select-Object -Skip $skip -First $State.PageSize)
    $next = if ($skip + $State.PageSize -lt $Items.Count) { '{0}{1}$skiptoken={2}' -f $clean, $(if ($clean -match '\?') { '&' } else { '?' }), ($skip + $State.PageSize) } else { $null }
    @{ value = $slice; '@odata.nextLink' = $next }
}

function Invoke-GpcFakeGraph {
    <#
    .SYNOPSIS
        Answers one Graph call from the fixture tenant behind New-GpcFixtureInvoke and records it in
        the state's Calls. Serves only the routes this example reads and the one POST it sends.
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
        Invoke-GpcFakeGraph -State $g -Method GET -Uri 'https://graph.microsoft.com/beta/deviceManagement/groupPolicyMigrationReports'
    #>

    <# The fake Graph behind New-GpcFixtureInvoke. Serves only the routes this example reads and the one POST it sends. #>
    param([Parameter(Mandatory)]$State, $Method, $Uri, $Body, $Headers)
    $s = $State
    $s.Calls.Add([pscustomobject]@{ Method = "$Method"; Uri = "$Uri"; Body = $Body })
    $u = [uri]::UnescapeDataString("$Uri")
    if ($Method -eq 'GET') {
        $mm = [regex]::Match($u, '/groupPolicyMigrationReports/([^/?]+)/groupPolicySettingMappings')
        if ($mm.Success) { return Get-GpcFakePage $s @(Get-GpcProp $s.Mappings $mm.Groups[1].Value @()) $u }
        if ($u -match '/groupPolicyMigrationReports(\?|$)') { return Get-GpcFakePage $s $s.Reports $u }
        $sm = [regex]::Match($u, "/configurationPolicies(?:/|\(')([0-9a-zA-Z-]+)(?:'\))?/settings")
        if ($sm.Success) {
            $p = $s.Policies | Where-Object { "$($_['id'])" -eq $sm.Groups[1].Value } | Select-Object -First 1
            if (-not $p) { throw "404 configurationPolicies/$($sm.Groups[1].Value)" }
            return Get-GpcFakePage $s @(Get-GpcProp $p 'settings' @()) $u
        }
        if ($u -match '/configurationPolicies(\?|$)') {
            $list = @($s.Policies | ForEach-Object { $h = [ordered]@{}; foreach ($k in $_.Keys) { if ($k -ne 'settings') { $h[$k] = $_[$k] } }; $h })
            return Get-GpcFakePage $s $list $u
        }
        if ($u -match '/(resourceAccessProfiles|hardwareConfigurations)(\?|$)') { return @{ value = @() } }
        throw "Fake Graph: no GET route for $u"
    }
    if ($Method -eq 'POST' -and $u -match '/configurationPolicies$') {
        $b = if ($Body -is [string]) { $Body | ConvertFrom-Json -AsHashtable -Depth 100 } else { $Body }
        $id = '00000000-0000-4000-9000-{0:d12}' -f $s.NextId; $s.NextId++
        $stored = [ordered]@{ id = $id }
        foreach ($k in $b.Keys) { $stored[$k] = $b[$k] }
        $stored['settings'] = @(@(Get-GpcProp $b 'settings' @()) | ForEach-Object { $x = [ordered]@{ id = [guid]::NewGuid().Guid }; foreach ($k in $_.Keys) { $x[$k] = $_[$k] }; $x })
        $s.Policies.Add($stored)
        return @{ id = $id; name = (Get-GpcProp $b 'name') }
    }
    throw "Fake Graph: $Method $u is not served"
}

function New-GpcFixtureInvoke {
    <#
    .SYNOPSIS
        A fake Graph for labs and tests, served from a fixture tenant file. Nothing leaves the machine.
    .DESCRIPTION
        Serves GET for Group Policy analytics reports and setting mappings, settings catalog
        policies and their settings, and POST to configurationPolicies (stored in memory). Any other
        method throws, so a test fails if code sends PATCH or DELETE. Every call is recorded in the
        returned object's Calls property; its Invoke property is the script block to pass as -Invoke.
    .EXAMPLE
        $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json -PageSize 2
        Get-GpcMovePlan -Invoke $g.Invoke | Out-Null
        $g.Calls | Select-Object Method, Uri
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [int]$PageSize = 50)
    $t = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path) | ConvertFrom-Json -AsHashtable -Depth 100
    $state = [pscustomobject]@{
        Reports  = @(Get-GpcProp $t 'groupPolicyMigrationReports' @())
        Mappings = (Get-GpcProp $t 'groupPolicySettingMappings' @{})
        Policies = [Collections.Generic.List[object]]::new()
        Calls    = [Collections.Generic.List[object]]::new()
        PageSize = $PageSize
        NextId   = 1
        Invoke   = $null
    }
    foreach ($p in @(Get-GpcProp $t 'configurationPolicies' @())) { $state.Policies.Add($p) }
    $fake = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-GpcFakeGraph -State $fake -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state
}

Export-ModuleMember -Function Get-GpcCloud, Get-GpcRequiredScope, Get-GpcMovePlan, Read-GpcLibrary, Test-GpcLibrary,
    ConvertTo-GpcCanonical, Get-GpcTenantPolicy, Compare-GpcPolicy, Compare-GpcLibrary, Invoke-GpcSync, New-GpcFixtureInvoke, Invoke-GpcFakeGraph
