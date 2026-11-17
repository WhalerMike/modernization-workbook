#Requires -Version 7.1
<#
    AzureSecurity: a read-only kit for the Azure Security Engineering guide. It reads an Azure estate
    through Azure Resource Graph and Azure Resource Manager GETs, checks it against the guide's steps
    (the landing-zone baseline, the public exposure register, DDoS protection, the web application
    firewall, Front Door and Application Gateway origins, Azure Firewall and egress, Private Link, DNS and
    Key Vault, and Azure Policy with its exemptions), writes findings, compares two runs, computes the
    guide's metrics, and records each run as hashed, chained evidence tagged with NIST SP 800-53 Rev 5
    controls and FedRAMP 20x KSIs.

    Every call is a read declared in config/calls.json with its least-privileged role and the Learn page
    it comes from. Fixture mode reads files and sends nothing; live mode runs az (graph query, rest
    --method get) against commercial Azure (management.azure.com) only. The checks never write: where a
    fix is a command, they write it to a plan file for a person to review and run. Illustrative: tested
    against fictional fixtures, not run against a live subscription.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:ConfigRoot = Join-Path $script:KitRoot 'config'
$script:Areas = @('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy')

# The one cloud the kit reads. Case-sensitive on purpose: an unknown name throws, and there is no default.
$script:Clouds = @{
    AzureCloud = @{ Arm = 'https://management.azure.com'; Login = 'https://login.microsoftonline.com'; Portal = 'https://portal.azure.com' }
}

# ----------------------------------------------------------------------------- clouds and files

function Get-AzsCloud {
    <#
    .SYNOPSIS
        Returns the cloud's hosts. Only AzureCloud (commercial Azure, which Microsoft 365 GCC pairs with)
        exists; any other name throws.
    .EXAMPLE
        (Get-AzsCloud -Cloud AzureCloud).Arm
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    if (-not ($script:Clouds.Keys -ccontains $Cloud)) { throw "Unknown cloud '$Cloud'. The kit reads commercial Azure only: use AzureCloud." }
    [pscustomobject]$script:Clouds[$Cloud]
}

function Read-AzsJson {
    <#
    .SYNOPSIS
        Reads a JSON file as hashtables and arrays, keeping date-like strings as strings where PowerShell
        allows it, so a record reads back exactly as it was written.
    .EXAMPLE
        Read-AzsJson -Path config/rules.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    ConvertFrom-AzsJsonText -Text ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path))
}

function ConvertFrom-AzsJsonText {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    if (-not $Text.Trim()) { return $null }
    $p = @{ AsHashtable = $true; Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String' }
    , ($Text | ConvertFrom-Json @p)
}

function Write-AzsJson {
    <#
    .SYNOPSIS
        Writes a value as UTF-8 JSON without a byte order mark, with LF line endings.
    .EXAMPLE
        Write-AzsJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()]$Value)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = (ConvertTo-Json -InputObject $Value -Depth 50) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Path, $json + "`n", [Text.UTF8Encoding]::new($false))
}

function Write-AzsText {
    <#
    .SYNOPSIS
        Writes text as UTF-8 without a byte order mark, with LF line endings, creating the folder.
    .EXAMPLE
        Write-AzsText -Path out/x.txt -Text "one`ntwo`n"
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), [Text.UTF8Encoding]::new($false))
}

function Get-AzsFileHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a file, the form every manifest and evidence record uses.
    .EXAMPLE
        Get-AzsFileHash -Path config/calls.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-AzsTextHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a string's UTF-8 bytes; the fingerprint of a finding uses it.
    .EXAMPLE
        Get-AzsTextHash -Text 'AZS-KV-02|/subscriptions/x/resourcegroups/rg/providers/microsoft.keyvault/vaults/kv'
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    ([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($Text)) | ForEach-Object { $_.ToString('x2') }) -join ''
}

function Get-AzsP {
    <#
    .SYNOPSIS
        A value at a dotted path in nested hashtables, matching keys case-insensitively, or $null.
    .EXAMPLE
        Get-AzsP $row 'properties.subnet.id'
    #>
    param([AllowNull()]$Object, [Parameter(Mandatory)][string]$Path)
    $cur = $Object
    foreach ($part in $Path.Split('.')) {
        if ($null -eq $cur -or $cur -isnot [Collections.IDictionary]) { return $null }
        $hit = $null; $found = $false
        if ($cur.Contains($part)) { $hit = $cur[$part]; $found = $true }
        else { foreach ($k in $cur.Keys) { if ("$k" -ieq $part) { $hit = $cur[$k]; $found = $true; break } } }
        if (-not $found) { return $null }
        $cur = $hit
    }
    , $cur
}

function ConvertTo-AzsList {
    <#
    .SYNOPSIS
        Emits a value's items one by one: nothing for $null, the value itself for a string or a hashtable,
        and each non-null item of a list. Wrap a call in @() for an array.
    .EXAMPLE
        @(ConvertTo-AzsList $row.subnets).Count
    #>
    param([AllowNull()]$Value)
    # Emits the items one by one: wrap a call in @() for an array.
    if ($null -eq $Value) { return }
    if ($Value -is [string] -or $Value -is [Collections.IDictionary]) { return $Value }
    foreach ($v in $Value) { if ($null -ne $v) { $v } }
}

function ConvertTo-AzsUtc {
    <#
    .SYNOPSIS
        A date and time as a UTC string, yyyy-MM-ddTHH:mm:ssZ, read with the invariant culture.
    .EXAMPLE
        ConvertTo-AzsUtc '2026-11-09T07:00:00-05:00'
    #>
    param([Parameter(Mandatory)][string]$Value)
    $d = [DateTimeOffset]::Parse($Value, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal)
    $d.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
}

function Get-AzsName {
    param([AllowNull()][string]$Id)
    if (-not $Id) { return '' }
    ($Id.TrimEnd('/') -split '/')[-1]
}

function Get-AzsSubscriptionOf {
    param([AllowNull()][string]$Id)
    if ($Id -match '^/subscriptions/([^/]+)') { return $Matches[1].ToLowerInvariant() }
    ''
}

function Get-AzsResourceGroupOf {
    param([AllowNull()][string]$Id)
    if ($Id -match '/resourceGroups/([^/]+)') { return $Matches[1] }
    ''
}

# ----------------------------------------------------------------------------- configuration

function Get-AzsCall {
    <#
    .SYNOPSIS
        The calls declared in config/calls.json, optionally one area's, or the one with -Id.
    .EXAMPLE
        Get-AzsCall -Area ddos | ForEach-Object id
    #>
    [CmdletBinding()]
    param([string]$Area, [string]$Id)
    $calls = @((Read-AzsJson -Path (Join-Path $script:ConfigRoot 'calls.json')).calls)
    foreach ($c in $calls) { foreach ($k in 'keyed', 'verified', 'unverified', 'path', 'apiVersion', 'query', 'note') { if (-not $c.Contains($k)) { $c[$k] = $null } } }
    if ($Area) { $calls = @($calls | Where-Object { $_.area -contains $Area }) }
    if ($Id) {
        $c = @($calls | Where-Object { $_.id -eq $Id })
        if (-not $c.Count) { throw "Call '$Id' isn't declared in config/calls.json." }
        return $c[0]
    }
    $calls
}

function Get-AzsRequiredRole {
    <#
    .SYNOPSIS
        What an area's reads need: each call, its least-privileged role, whether it is verified on Learn,
        and the page. Without -Area, every call.
    .EXAMPLE
        Get-AzsRequiredRole -Area private | Format-Table
    #>
    [CmdletBinding()]
    param([ValidateSet('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy')][string]$Area)
    $calls = if ($Area) { Get-AzsCall -Area $Area } else { Get-AzsCall }
    foreach ($c in $calls) {
        [pscustomobject][ordered]@{ Call = $c.id; Kind = $c.kind; Role = $c.role; Verified = [bool]$c.verified; Doc = $c.doc }
    }
}

function Get-AzsRules {
    <#
    .SYNOPSIS
        Reads config/rules.json: every rule's severity, guide step, title and source.
    .EXAMPLE
        (Get-AzsRules)['AZS-DD-01'].source
    #>
    param([string]$Path = (Join-Path $script:ConfigRoot 'rules.json'))
    (Read-AzsJson -Path $Path).rules
}

function Get-AzsBaseline {
    <#
    .SYNOPSIS
        Reads config/baseline.json: the posture the checks compare against (design guidance).
    .EXAMPLE
        (Get-AzsBaseline).minimumDefaultRuleSet
    #>
    param([string]$Path = (Join-Path $script:ConfigRoot 'baseline.json'))
    Read-AzsJson -Path $Path
}

function Get-AzsRequirements {
    <#
    .SYNOPSIS
        Reads config/requirements.json: each step's SP 800-53 controls and FedRAMP 20x KSIs, the steps each
        area's check covers, and the steps each stage's evidence must hold.
    .EXAMPLE
        (Get-AzsRequirements).steps.DDOS.ksis
    #>
    param([string]$Path = (Join-Path $script:ConfigRoot 'requirements.json'))
    Read-AzsJson -Path $Path
}

function Read-AzsSettings {
    <#
    .SYNOPSIS
        Reads a settings file and refuses one that is incomplete, names another cloud, or still holds a
        <placeholder>. The settings name the estate: tenant, management group, workspace, connectivity
        subscription, hub network, workload subscriptions and the policy assignments to look for.
    .EXAMPLE
        Read-AzsSettings -Path tests/fixtures/settings.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $s = Read-AzsJson -Path $Path
    foreach ($k in 'environment', 'cloud', 'tenantId', 'tenantRootGroupId', 'managementGroup', 'workspaceId', 'connectivitySubscriptionId', 'hubVnetId', 'workloadSubscriptionIds', 'requiredAssignments', 'securityInitiative') {
        if (-not $s.Contains($k) -or $null -eq $s[$k] -or "$($s[$k])" -eq '') { throw "Settings file $Path has no '$k'." }
    }
    $null = Get-AzsCloud -Cloud $s.cloud
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    if ($text -match '<[a-z][a-z0-9-]*>') { throw "Settings file $Path still has a placeholder: $($Matches[0])." }
    $s
}

# ----------------------------------------------------------------------------- invokers

function New-AzsFixtureInvoker {
    <#
    .SYNOPSIS
        The fixture invoker: each call reads its file (config/calls.json 'fixture') from -Path; a keyed
        call reads the entry for its lower-cased key. Sends nothing anywhere. Records every call it serves.
    .EXAMPLE
        $inv = New-AzsFixtureInvoker -Path tests/fixtures/week1
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    [pscustomobject]@{ Mode = 'Fixture'; Root = (Resolve-Path -LiteralPath $Path).Path; Calls = [Collections.Generic.List[object]]::new(); AllowUnverified = $true }
}

# The az runner: replaced in tests so no tool is started. Returns @{ ExitCode; Output }.
$script:AzRunner = {
    param([string[]]$Arguments)
    $out = & az @Arguments 2>&1
    @{ ExitCode = $LASTEXITCODE; Output = (@($out) -join "`n") }
}

function Set-AzsRunner {
    <#
    .SYNOPSIS
        Replaces the az runner (for tests). Returns the previous one.
    .EXAMPLE
        $old = Set-AzsRunner -Az { param($Arguments) @{ ExitCode = 0; Output = '{}' } }
    #>
    param([Parameter(Mandatory)][scriptblock]$Az)
    $old = $script:AzRunner
    $script:AzRunner = $Az
    $old
}

function Invoke-AzsAz {
    <#
    .SYNOPSIS
        Runs az through the runner (a stand-in in tests) and returns its JSON output parsed, or with -Raw
        its text. A non-zero exit code throws with az's message.
    .EXAMPLE
        Invoke-AzsAz -Arguments @('cloud', 'show', '--query', 'name', '--output', 'tsv') -Raw
    #>
    param([string[]]$Arguments = @(), [switch]$Raw)
    $r = & $script:AzRunner $Arguments
    if ($r.ExitCode -ne 0) { throw "az exited $($r.ExitCode): $("$($r.Output)".Trim())" }
    if ($Raw) { return "$($r.Output)".Trim() }
    ConvertFrom-AzsJsonText -Text "$($r.Output)"
}

function Get-AzsLiveCommand {
    <#
    .SYNOPSIS
        The exact az arguments a live call runs. Pure: it runs nothing. A Resource Graph query is scoped to
        the settings' management group; a REST GET is refused unless it is on the cloud's own host.
    .EXAMPLE
        Get-AzsLiveCommand -CallId rest-diagnostic-settings -Settings $s -Key '/subscriptions/.../publicIPAddresses/pip-1'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CallId, [Parameter(Mandatory)][hashtable]$Settings, [string]$Key, [string]$SkipToken, [string]$NextLink)
    $call = Get-AzsCall -Id $CallId
    $arm = (Get-AzsCloud -Cloud $Settings.cloud).Arm
    if ($call.kind -eq 'arg') {
        $a = @('graph', 'query', '-q', ((@($call.query)) -join ' '), '--first', '1000', '--management-groups', "$($Settings.managementGroup)", '--output', 'json')
        if ($SkipToken) { $a += @('--skip-token', $SkipToken) }
        return , $a
    }
    $url = if ($NextLink) { $NextLink } else {
        if ($call.keyed -and -not $Key) { throw "Call $CallId needs a key." }
        $path = "$($call.path)".Replace('{key}', $Key)
        if (-not $path.StartsWith('/')) { $path = "/$path" }
        "$arm$($path)?api-version=$($call.apiVersion)"
    }
    if (-not $url.StartsWith("$arm/")) { throw "Refusing ${url}: it isn't on the $($Settings.cloud) Resource Manager host $arm." }
    , @('rest', '--method', 'get', '--url', $url, '--output', 'json')
}

function Assert-AzsLiveContext {
    <#
    .SYNOPSIS
        Refuses a live run whose Azure CLI is set to another cloud, or signed in to another tenant, than the
        settings name.
    .EXAMPLE
        Assert-AzsLiveContext -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings)
    $null = Get-AzsCloud -Cloud $Settings.cloud
    $name = Invoke-AzsAz -Arguments @('cloud', 'show', '--query', 'name', '--output', 'tsv') -Raw
    if ($name -ne $Settings.cloud) { throw "Azure CLI is set to cloud '$name', not '$($Settings.cloud)'. Run: az cloud set --name $($Settings.cloud)" }
    $tenant = Invoke-AzsAz -Arguments @('account', 'show', '--query', 'tenantId', '--output', 'tsv') -Raw
    if ($tenant -ne $Settings.tenantId) { throw "Azure CLI is signed in to tenant $tenant, not $($Settings.tenantId). Run: az login --tenant $($Settings.tenantId)" }
}

function New-AzsLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: each declared call runs az graph query or az rest --method get, after
        Assert-AzsLiveContext. It refuses an undeclared call, and one marked unverified unless
        -AllowUnverified. Paging follows Resource Graph skip tokens and Resource Manager nextLink (on the
        same host). Not run against a live subscription by the authors.
    .EXAMPLE
        $inv = New-AzsLiveInvoker -Settings (Read-AzsSettings -Path settings.test.json) -AllowUnverified
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [switch]$AllowUnverified, [switch]$SkipContextCheck)
    [pscustomobject]@{ Mode = 'Live'; Settings = $Settings; AllowUnverified = [bool]$AllowUnverified; SkipContextCheck = [bool]$SkipContextCheck
        Checked = $false; Calls = [Collections.Generic.List[object]]::new() }
}

function Invoke-AzsCall {
    <#
    .SYNOPSIS
        Sends one declared call through an invoker and returns its response: for a Resource Graph query
        @{ data = rows }, for a REST GET the body (a list's pages joined into @{ value = items }). A keyed
        call takes -Key. A call that isn't in config/calls.json throws.
    .EXAMPLE
        Invoke-AzsCall -Invoker (New-AzsFixtureInvoker -Path tests/fixtures/week1) -CallId arg-public-ips
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$CallId, [string]$Key)
    $call = Get-AzsCall -Id $CallId
    $resp = switch ($Invoker.Mode) {
        'Fixture' {
            $file = Join-Path $Invoker.Root $call.fixture
            if (-not (Test-Path -LiteralPath $file)) { throw "Fixture $file is missing for call $CallId." }
            $data = Read-AzsJson -Path $file
            if ($call.keyed) {
                $k = "$Key".ToLowerInvariant()
                if ($data.Contains($k)) { , $data[$k] } else { , @{ value = @() } }
            } else { , $data }
        }
        'Live' { , (Invoke-AzsLiveCall -Invoker $Invoker -Call $call -Key $Key) }
        'Script' { , (& $Invoker.Script $CallId $Key) }
        default { throw "Unknown invoker mode '$($Invoker.Mode)'." }
    }
    $Invoker.Calls.Add([ordered]@{ call = $CallId; key = "$Key"; response = $resp })
    , $resp
}

function Invoke-AzsLiveCall {
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)]$Call, [string]$Key)
    $s = $Invoker.Settings
    if (-not $Call.verified -and -not $Invoker.AllowUnverified) { throw "Call $($Call.id) isn't verified on Microsoft Learn ($($Call.unverified)). Pass -AllowUnverified to run it, and check its output in Lab 2." }
    if (-not $Invoker.SkipContextCheck -and -not $Invoker.Checked) { Assert-AzsLiveContext -Settings $s; $Invoker.Checked = $true }
    if ($Call.kind -eq 'arg') {
        $rows = [Collections.Generic.List[object]]::new(); $token = $null
        do {
            $page = Invoke-AzsAz -Arguments (Get-AzsLiveCommand -CallId $Call.id -Settings $s -SkipToken $token)
            foreach ($r in (ConvertTo-AzsList (Get-AzsP $page 'data'))) { $rows.Add($r) }
            $token = Get-AzsP $page 'skip_token'
            if (-not $token) { $token = Get-AzsP $page 'skipToken' }
        } while ($token)
        return , @{ data = $rows.ToArray() }
    }
    $first = Invoke-AzsAz -Arguments (Get-AzsLiveCommand -CallId $Call.id -Settings $s -Key $Key)
    if (-not ($first -is [Collections.IDictionary] -and $first.Contains('value'))) { return , $first }
    $items = [Collections.Generic.List[object]]::new()
    $page = $first
    while ($true) {
        foreach ($v in (ConvertTo-AzsList (Get-AzsP $page 'value'))) { $items.Add($v) }
        $next = Get-AzsP $page 'nextLink'
        if (-not $next) { break }
        $page = Invoke-AzsAz -Arguments (Get-AzsLiveCommand -CallId $Call.id -Settings $s -NextLink $next)
    }
    , @{ value = $items.ToArray() }
}

function Get-AzsRows {
    param([Parameter(Mandatory)]$Ctx, [Parameter(Mandatory)][string]$CallId)
    ConvertTo-AzsList (Get-AzsP (Invoke-AzsCall -Invoker $Ctx.Invoker -CallId $CallId) 'data')
}

function Get-AzsList {
    param([Parameter(Mandatory)]$Ctx, [Parameter(Mandatory)][string]$CallId, [Parameter(Mandatory)][string]$Key)
    ConvertTo-AzsList (Get-AzsP (Invoke-AzsCall -Invoker $Ctx.Invoker -CallId $CallId -Key $Key) 'value')
}

# ----------------------------------------------------------------------------- findings

function New-AzsFinding {
    <#
    .SYNOPSIS
        One finding, with the rule's severity, step, title and source from config/rules.json and a
        fingerprint (rule and lower-cased resource ID) that stays the same from run to run.
    .EXAMPLE
        New-AzsFinding -Rule AZS-KV-02 -ResourceId $vault.id -Detail 'enablePurgeProtection is not true'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Rule, [Parameter(Mandatory)][AllowEmptyString()][string]$ResourceId, [string]$Detail = '', [string]$Name)
    $r = (Get-AzsRules)[$Rule]
    if (-not $r) { throw "Rule $Rule isn't in config/rules.json." }
    [ordered]@{
        rule = $Rule; severity = $r.severity; step = $r.step; title = $r.title
        name = $(if ($Name) { $Name } else { Get-AzsName $ResourceId }); resourceId = $ResourceId; detail = $Detail; source = $r.source
        fingerprint = (Get-AzsTextHash -Text "$Rule|$($ResourceId.ToLowerInvariant())").Substring(0, 16)
    }
}

function Test-AzsDiag {
    <#
    .SYNOPSIS
        True when a resource's diagnostic settings send an enabled log to the workspace: a log whose
        categoryGroup is one of -Groups or whose category is one of -Categories (with neither, any enabled
        log counts).
    .EXAMPLE
        Test-AzsDiag -Settings $list -WorkspaceId $ws -Groups allLogs, audit -Categories AuditEvent
    #>
    param([AllowNull()]$Settings, [Parameter(Mandatory)][string]$WorkspaceId, [string[]]$Groups = @(), [string[]]$Categories = @())
    foreach ($d in (ConvertTo-AzsList $Settings)) {
        if ("$(Get-AzsP $d 'properties.workspaceId')" -ine $WorkspaceId) { continue }
        foreach ($l in (ConvertTo-AzsList (Get-AzsP $d 'properties.logs'))) {
            if (-not (Get-AzsP $l 'enabled')) { continue }
            if (-not $Groups.Count -and -not $Categories.Count) { return $true }
            if ("$(Get-AzsP $l 'categoryGroup')" -and ($Groups -icontains "$(Get-AzsP $l 'categoryGroup')")) { return $true }
            if ("$(Get-AzsP $l 'category')" -and ($Categories -icontains "$(Get-AzsP $l 'category')")) { return $true }
        }
    }
    $false
}

function Get-AzsPercent {
    param([int]$Part, [int]$Whole)
    if ($Whole -le 0) { return $null }
    [Math]::Round(100.0 * $Part / $Whole, 1)
}

# ----------------------------------------------------------------------------- Step 1: baseline

function Get-AzsBaselineCheck {
    <#
    .SYNOPSIS
        Step 1: the hierarchy settings (authorization to create management groups, a default group), the
        required initiative assignments at the intermediate root, diagnostic logs from every platform
        resource to the workspace, and the required Defender for Cloud plans on every subscription.
    .EXAMPLE
        Get-AzsBaselineCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings; $b = $Ctx.Baseline
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new()
    $mgId = "/providers/Microsoft.Management/managementGroups/$($s.managementGroup)"
    $h = Invoke-AzsCall -Invoker $Ctx.Invoker -CallId rest-hierarchy-settings -Key $s.tenantRootGroupId
    $hid = "/providers/Microsoft.Management/managementGroups/$($s.tenantRootGroupId)/settings/default"
    $auth = Get-AzsP $h 'properties.requireAuthorizationForGroupCreation'
    $def = "$(Get-AzsP $h 'properties.defaultManagementGroup')"
    if ($auth -ne $true) { $f.Add((New-AzsFinding -Rule AZS-BL-01 -ResourceId $hid -Name 'hierarchy settings' -Detail "requireAuthorizationForGroupCreation is $(if ($null -eq $auth) { 'not set' } else { "$auth".ToLowerInvariant() })")) }
    if (-not $def -or (Get-AzsName $def) -ieq "$($s.tenantRootGroupId)") { $f.Add((New-AzsFinding -Rule AZS-BL-02 -ResourceId $hid -Name 'hierarchy settings' -Detail "defaultManagementGroup is $(if ($def) { $def } else { 'not set' })")) }
    $rows.Add([ordered]@{ kind = 'hierarchy'; requireAuthorization = $auth; defaultManagementGroup = $def })

    $assignments = @(Get-AzsRows -Ctx $Ctx -CallId arg-policy-assignments)
    foreach ($name in @($s.requiredAssignments)) {
        $a = @($assignments | Where-Object { "$($_.name)" -ieq $name -and "$($_.scope)" -ieq $mgId })
        if (-not $a.Count) { $f.Add((New-AzsFinding -Rule AZS-BL-03 -ResourceId "$mgId/providers/Microsoft.Authorization/policyAssignments/$name" -Name $name -Detail "not assigned at $($s.managementGroup)")); continue }
        $rows.Add([ordered]@{ kind = 'assignment'; name = $name; enforcementMode = "$($a[0].enforcementMode)" })
        if ("$($a[0].enforcementMode)" -ieq 'DoNotEnforce') { $f.Add((New-AzsFinding -Rule AZS-BL-04 -ResourceId $a[0].id -Name $name -Detail 'enforcementMode DoNotEnforce (audit); Step 9 enforces')) }
    }

    $platform = @(Get-AzsRows -Ctx $Ctx -CallId arg-platform-resources)
    $logged = 0
    foreach ($r in $platform) {
        if (@($b.platformTypes) -inotcontains "$($r.type)") { continue }
        $ok = Test-AzsDiag -Settings (Get-AzsList -Ctx $Ctx -CallId rest-diagnostic-settings -Key $r.id) -WorkspaceId $s.workspaceId
        if ($ok) { $logged++ } else { $f.Add((New-AzsFinding -Rule AZS-BL-05 -ResourceId $r.id -Detail "$($r.type): no enabled log to the platform workspace")) }
        $rows.Add([ordered]@{ kind = 'platform-resource'; id = $r.id; type = $r.type; logsToWorkspace = $ok })
    }

    $subs = @(Get-AzsRows -Ctx $Ctx -CallId arg-subscriptions)
    $covered = 0
    foreach ($sub in $subs) {
        $plans = @(Get-AzsList -Ctx $Ctx -CallId rest-defender-pricings -Key "$($sub.subscriptionId)")
        $free = @()
        foreach ($p in @($b.requiredDefenderPlans)) {
            $hit = @($plans | Where-Object { "$($_.name)" -ieq $p })
            if (-not $hit.Count -or "$(Get-AzsP $hit[0] 'properties.pricingTier')" -ine 'Standard') { $free += $p }
        }
        if ($free.Count) { $f.Add((New-AzsFinding -Rule AZS-BL-06 -ResourceId "/subscriptions/$($sub.subscriptionId)" -Name "$($sub.name)" -Detail "Free or absent: $($free -join ', ')")) } else { $covered++ }
        $rows.Add([ordered]@{ kind = 'subscription'; subscriptionId = $sub.subscriptionId; name = $sub.name; plansNotOnStandard = $free })
    }
    $plat = @($platform | Where-Object { @($b.platformTypes) -icontains "$($_.type)" }).Count
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Summary = [ordered]@{
            platformResources = $plat; platformResourcesLogged = $logged; platformLoggingPercent = (Get-AzsPercent $logged $plat)
            subscriptions = @($subs).Count; subscriptionsWithRequiredPlans = $covered; requiredAssignments = @($s.requiredAssignments).Count }
        Line = "Read: hierarchy settings, $(@($assignments).Count) policy assignments, $plat platform resources, $(@($subs).Count) subscriptions" }
}

# ----------------------------------------------------------------------------- Step 2: exposure register

function Get-AzsExposureCheck {
    <#
    .SYNOPSIS
        Step 2: the public exposure register. One row per public IP, Front Door profile (Standard,
        Premium and classic), application gateway and PaaS resource with public network access on, with
        its owner, public name, DDoS state and WAF. Compares with the previous register (-PreviousRegister)
        and with Defender for Cloud's export (-DefenderExposure) when given.
    .EXAMPLE
        Get-AzsExposureCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings
    $f = [Collections.Generic.List[object]]::new(); $reg = [Collections.Generic.List[object]]::new()
    $date = $Ctx.AsOf.Substring(0, 10)
    $pips = @(Get-AzsRows -Ctx $Ctx -CallId arg-public-ips)
    $afd = @(Get-AzsRows -Ctx $Ctx -CallId arg-frontdoor-profiles)
    $classic = @(Get-AzsRows -Ctx $Ctx -CallId arg-classic-frontdoors)
    $gws = @(Get-AzsRows -Ctx $Ctx -CallId arg-app-gateways)
    $paas = @(Get-AzsRows -Ctx $Ctx -CallId arg-paas-public)
    $agwWaf = @{}; foreach ($w in (Get-AzsRows -Ctx $Ctx -CallId arg-appgw-waf-policies)) { $agwWaf["$($w.id)".ToLowerInvariant()] = $w }
    $afdWaf = @{}; foreach ($w in (Get-AzsRows -Ctx $Ctx -CallId arg-afd-waf-policies)) { $afdWaf["$($w.id)".ToLowerInvariant()] = $w }
    $pipById = @{}; foreach ($p in $pips) { $pipById["$($p.id)".ToLowerInvariant()] = $p }
    $gwOfPip = @{}
    foreach ($g in $gws) { foreach ($fe in (ConvertTo-AzsList $g.frontendIPConfigurations)) { $pid_ = "$(Get-AzsP $fe 'properties.publicIPAddress.id')"; if ($pid_) { $gwOfPip[$pid_.ToLowerInvariant()] = $g } } }
    $wafState = {
        param($policyId, $table)
        if (-not $policyId) { return @('none', '') }
        $w = $table["$policyId".ToLowerInvariant()]
        if (-not $w) { return @((Get-AzsName $policyId), 'unknown') }
        $mode = "$(Get-AzsP $w 'policySettings.mode')"
        @($w.name, $mode)
    }
    $row = { param($id, $type, $name, $sub, $public, $owner, $ddos, $waf, $wafMode)
        [ordered]@{ resourceId = $id; type = $type; name = $name; subscriptionId = $sub; publicName = $public; owner = $owner; ddos = $ddos; waf = $waf; wafMode = $wafMode; originLockdown = 'Step 5'; lastReviewed = $date } }
    foreach ($p in $pips) {
        $gw = $gwOfPip["$($p.id)".ToLowerInvariant()]
        $waf = if ($gw) { & $wafState $gw.wafPolicy $agwWaf } else { @('n/a', '') }
        $attached = if ("$($p.attachedTo)") { "$($p.attachedTo)" } elseif ("$($p.natGateway)") { "$($p.natGateway)" } else { '' }
        $reg.Add((& $row $p.id 'PublicIP' $p.name $p.subscriptionId $(if ("$($p.fqdn)") { "$($p.fqdn) ($($p.ip))" } else { "$($p.ip)" }) "$($p.owner)" "$($p.ddosMode)" $waf[0] $waf[1]))
        if (-not $attached) { $f.Add((New-AzsFinding -Rule AZS-EX-02 -ResourceId $p.id -Detail "$($p.ip) is attached to nothing")) }
    }
    foreach ($a in $afd) {
        $pols = @(Get-AzsList -Ctx $Ctx -CallId rest-afd-security-policies -Key $a.id)
        $wafs = @($pols | ForEach-Object { "$(Get-AzsP $_ 'properties.parameters.wafPolicy.id')" } | Where-Object { $_ })
        $names = @($wafs | ForEach-Object { Get-AzsName $_ }); $modes = @($wafs | ForEach-Object { (& $wafState $_ $afdWaf)[1] })
        $domains = @((Get-AzsList -Ctx $Ctx -CallId rest-afd-custom-domains -Key $a.id) | ForEach-Object { "$(Get-AzsP $_ 'properties.hostName')" })
        $reg.Add((& $row $a.id "FrontDoor $(("$($a.sku)" -split '_')[0])" $a.name $a.subscriptionId ($domains -join '; ') "$($a.owner)" 'Front Door edge' $(if ($names.Count) { $names -join '; ' } else { 'none' }) ($modes -join '; ')))
    }
    foreach ($c in $classic) { $reg.Add((& $row $c.id 'FrontDoor classic' $c.name $c.subscriptionId '' "$($c.owner)" 'Front Door edge' 'unknown (classic)' '')) }
    foreach ($g in $gws) {
        $pub = @((ConvertTo-AzsList $g.frontendIPConfigurations) | ForEach-Object { "$(Get-AzsP $_ 'properties.publicIPAddress.id')" } | Where-Object { $_ })
        $waf = & $wafState $g.wafPolicy $agwWaf
        $ddos = if ($pub.Count) { @($pub | ForEach-Object { "$($pipById[$_.ToLowerInvariant()].ddosMode)" }) -join '; ' } else { 'private frontend only' }
        $public = if ($pub.Count) { @($pub | ForEach-Object { $q = $pipById[$_.ToLowerInvariant()]; if ($q -and "$($q.fqdn)") { "$($q.fqdn)" } elseif ($q) { "$($q.ip)" } else { Get-AzsName $_ } }) -join '; ' } else { '' }
        $reg.Add((& $row $g.id "ApplicationGateway $($g.skuTier)" $g.name $g.subscriptionId $public "$($g.owner)" $ddos $waf[0] $waf[1]))
    }
    foreach ($p in $paas) { $reg.Add((& $row $p.id "PaaS $($p.type)" $p.name $p.subscriptionId "publicNetworkAccess $($p.publicNetworkAccess); private endpoints $($p.privateEndpoints)" "$($p.owner)" 'n/a' 'n/a' '')) }
    foreach ($r in $reg) { if (-not $r.owner) { $f.Add((New-AzsFinding -Rule AZS-EX-01 -ResourceId $r.resourceId -Detail "$($r.type) has no owner tag")) } }

    $new = 0; $gone = 0
    if ($Ctx.PreviousRegister) {
        $before = @{}; foreach ($r in $Ctx.PreviousRegister) { $before["$($r.resourceId)".ToLowerInvariant()] = $r }
        $now = @{}; foreach ($r in $reg) { $now["$($r.resourceId)".ToLowerInvariant()] = $r }
        foreach ($k in $now.Keys) { if (-not $before.Contains($k)) { $new++; $f.Add((New-AzsFinding -Rule AZS-EX-03 -ResourceId $now[$k].resourceId -Detail "new $($now[$k].type) $($now[$k].publicName)")) } }
        foreach ($k in $before.Keys) { if (-not $now.Contains($k)) { $gone++; $f.Add((New-AzsFinding -Rule AZS-EX-04 -ResourceId $before[$k].resourceId -Detail "was $($before[$k].type) $($before[$k].publicName); remove any DNS record that still points at it")) } }
    }
    $gap = 0
    if ($Ctx.DefenderExposure) {
        $ids = @{}; foreach ($r in $reg) { $ids["$($r.resourceId)".ToLowerInvariant()] = $true }
        foreach ($d in $Ctx.DefenderExposure) {
            if (-not $ids.Contains("$($d.resourceId)".ToLowerInvariant())) { $gap++; $f.Add((New-AzsFinding -Rule AZS-EX-05 -ResourceId $d.resourceId -Detail "in Defender for Cloud's export ($($d.source)), not in the register: a gap in the queries")) }
        }
    }
    $owned = @($reg | Where-Object { $_.owner }).Count
    @{ Rows = $reg.ToArray(); Findings = $f.ToArray(); Register = $reg.ToArray(); Summary = [ordered]@{
            exposures = $reg.Count; publicIps = @($pips).Count; frontDoorProfiles = @($afd).Count; classicFrontDoors = @($classic).Count; applicationGateways = @($gws).Count; publicPaas = @($paas).Count
            owned = $owned; ownershipPercent = (Get-AzsPercent $owned $reg.Count); newSincePrevious = $new; goneSincePrevious = $gone; defenderGaps = $gap }
        Line = "Register: $($reg.Count) exposures ($(@($pips).Count) public IPs, $(@($afd).Count + @($classic).Count) Front Door, $(@($gws).Count) application gateways, $(@($paas).Count) PaaS); $owned with an owner" }
}

# ----------------------------------------------------------------------------- Step 3: DDoS

function Get-AzsDdosCheck {
    <#
    .SYNOPSIS
        Step 3: each public IP's DDoS state (IP Protection, inherited from a virtual network linked to a
        plan, unprotected, on a NAT gateway, or unattached), its diagnostic logs and its IfUnderDDoSAttack
        alert, and the number of plans.
    .EXAMPLE
        Get-AzsDdosCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings; $b = $Ctx.Baseline
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new()
    $pips = @(Get-AzsRows -Ctx $Ctx -CallId arg-public-ips)
    $vnets = @{}; foreach ($v in (Get-AzsRows -Ctx $Ctx -CallId arg-vnets)) { $vnets["$($v.id)".ToLowerInvariant()] = $v }
    $plans = @(Get-AzsRows -Ctx $Ctx -CallId arg-ddos-plans)
    $natIps = @{}; foreach ($n in (Get-AzsRows -Ctx $Ctx -CallId arg-nat-gateways)) { foreach ($p in (ConvertTo-AzsList $n.publicIpAddresses)) { $natIps["$(Get-AzsP $p 'id')".ToLowerInvariant()] = $n.id } }
    $alerts = @(Get-AzsRows -Ctx $Ctx -CallId arg-metric-alerts)
    # ip configuration ID -> subnet ID, from the resources that own public IPs.
    $subnetOf = @{}; $unresolvable = @{}
    foreach ($o in (Get-AzsRows -Ctx $Ctx -CallId arg-network-owners)) {
        $t = "$($o.type)".ToLowerInvariant()
        if ($t -eq 'microsoft.network/applicationgateways') {
            $gsub = "$(Get-AzsP (@(ConvertTo-AzsList $o.gatewayIPConfigurations) | Select-Object -First 1) 'properties.subnet.id')"
            foreach ($fe in (ConvertTo-AzsList $o.frontendIPConfigurations)) { $subnetOf["$($fe.id)".ToLowerInvariant()] = $gsub }
        } elseif ($t -eq 'microsoft.network/loadbalancers') {
            foreach ($fe in (ConvertTo-AzsList $o.frontendIPConfigurations)) { $unresolvable["$($fe.id)".ToLowerInvariant()] = 'a load balancer frontend: protection depends on the backend virtual network' }
        } else {
            foreach ($ic in (ConvertTo-AzsList $o.ipConfigurations)) { $subnetOf["$($ic.id)".ToLowerInvariant()] = "$(Get-AzsP $ic 'properties.subnet.id')" }
        }
    }
    $protected = 0; $inScope = 0; $counts = [ordered]@{ IpProtection = 0; Inherited = 0; Unprotected = 0; Unknown = 0; NatGateway = 0; Unattached = 0 }
    foreach ($p in $pips) {
        $key = "$($p.id)".ToLowerInvariant(); $att = "$($p.attachedTo)".ToLowerInvariant()
        $status = ''; $detail = ''; $vnetId = ''
        if ($natIps.Contains($key) -or "$($p.natGateway)") { $status = 'NatGateway'; $f.Add((New-AzsFinding -Rule AZS-DD-03 -ResourceId $p.id -Detail "on $(Get-AzsName $(if ("$($p.natGateway)") { "$($p.natGateway)" } else { $natIps[$key] }))")) }
        elseif (-not $att) { $status = 'Unattached' }
        elseif ("$($p.ddosMode)" -ieq 'Enabled') { $status = 'IpProtection' }
        elseif ("$($p.ddosMode)" -ieq 'Disabled') { $status = 'Unprotected'; $detail = 'protectionMode Disabled' }
        elseif ($unresolvable.Contains($att)) { $status = 'Unknown'; $detail = $unresolvable[$att] }
        elseif ($subnetOf.Contains($att) -and $subnetOf[$att]) {
            $vnetId = ($subnetOf[$att] -split '/subnets/')[0]; $v = $vnets[$vnetId.ToLowerInvariant()]
            if ($v -and $v.ddosEnabled -eq $true -and "$($v.ddosPlan)") { $status = 'Inherited' } else { $status = 'Unprotected'; $detail = "inherits from $(Get-AzsName $vnetId), which has no DDoS protection plan" }
        } else { $status = 'Unknown'; $detail = "the kit can't find the virtual network behind $(Get-AzsName ($att -split '/(ipconfigurations|frontendipconfigurations|azurefirewallipconfigurations)/')[0])" }
        $counts[$status]++
        if ($status -eq 'Unprotected') { $f.Add((New-AzsFinding -Rule AZS-DD-01 -ResourceId $p.id -Detail $detail)) }
        if ($status -eq 'Unknown') { $f.Add((New-AzsFinding -Rule AZS-DD-02 -ResourceId $p.id -Detail $detail)) }
        $isProtected = $status -in 'IpProtection', 'Inherited'
        if ($status -notin 'NatGateway', 'Unattached') { $inScope++ }
        $logs = $null; $alert = $null
        if ($isProtected) {
            $protected++
            $logs = Test-AzsDiag -Settings (Get-AzsList -Ctx $Ctx -CallId rest-diagnostic-settings -Key $p.id) -WorkspaceId $s.workspaceId -Groups allLogs -Categories @($b.ddosLogCategories)
            if (-not $logs) { $f.Add((New-AzsFinding -Rule AZS-DD-04 -ResourceId $p.id -Detail 'no DDoS log category or allLogs to the platform workspace')) }
            $rg = "/subscriptions/$($p.subscriptionId)/resourceGroups/$($p.resourceGroup)".ToLowerInvariant(); $subScope = "/subscriptions/$($p.subscriptionId)".ToLowerInvariant()
            $alert = @($alerts | Where-Object {
                    $_.enabled -eq $true -and
                    @((ConvertTo-AzsList $_.criteria) | Where-Object { "$(Get-AzsP $_ 'metricName')" -ieq $b.ddosMetric }).Count -and
                    @((ConvertTo-AzsList $_.scopes) | Where-Object { "$_".ToLowerInvariant() -in @($key, $rg, $subScope) }).Count }).Count -gt 0
            if (-not $alert) { $f.Add((New-AzsFinding -Rule AZS-DD-05 -ResourceId $p.id -Detail "no enabled metric alert on $($b.ddosMetric) whose scope includes it")) }
        }
        $rows.Add([ordered]@{ resourceId = $p.id; name = $p.name; ip = $p.ip; ddosMode = $p.ddosMode; status = $status; virtualNetwork = $(if ($vnetId) { Get-AzsName $vnetId } else { '' }); logsToWorkspace = $logs; alert = $alert; detail = $detail })
    }
    if (@($plans).Count -gt 1) { $f.Add((New-AzsFinding -Rule AZS-DD-06 -ResourceId '/providers/Microsoft.Network/ddosProtectionPlans' -Name 'DDoS protection plans' -Detail "$(@($plans).Count) plans: $(@($plans | ForEach-Object name) -join ', '); the guide keeps one plan for the agency")) }
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Summary = [ordered]@{
            publicIps = @($pips).Count; inScope = $inScope; protected = $protected; coveragePercent = (Get-AzsPercent $protected $inScope)
            byStatus = $counts; plans = @($plans).Count }
        Line = "Read: $(@($pips).Count) public IPs, $($vnets.Count) virtual networks, $(@($plans).Count) DDoS plans, $(@($alerts).Count) metric alerts. Protected: $protected of $inScope in scope ($((Get-AzsPercent $protected $inScope))%)" }
}

# ----------------------------------------------------------------------------- Step 4: WAF

function Get-AzsVersion {
    param([AllowNull()][string]$Value)
    $v = $null
    if ([version]::TryParse("$Value", [ref]$v)) { return $v }
    [version]'0.0'
}

function Get-AzsWafCheck {
    <#
    .SYNOPSIS
        Step 4: each WAF policy on Application Gateway and Front Door (mode, request body inspection,
        Default Rule Set version, bot rules, a rate-limit rule), every internet-facing application gateway
        and every Front Door profile with a WAF and logs. Writes the reviewed commands that would switch a
        Detection policy to Prevention to plan-prevention.txt; runs none of them.
    .EXAMPLE
        Get-AzsWafCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings; $b = $Ctx.Baseline
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new(); $plan = [Collections.Generic.List[string]]::new()
    $min = Get-AzsVersion $b.minimumDefaultRuleSet
    $policies = @{}
    $check = {
        param($w, $kind)
        $ps = $w.policySettings
        $mode = "$(Get-AzsP $ps 'mode')"
        $enabled = if ($kind -eq 'appgw') { "$(Get-AzsP $ps 'state')" -ieq 'Enabled' } else { "$(Get-AzsP $ps 'enabledState')" -ieq 'Enabled' }
        $body = if ($kind -eq 'appgw') { (Get-AzsP $ps 'requestBodyCheck') -eq $true } else { "$(Get-AzsP $ps 'requestBodyCheck')" -ieq 'Enabled' }
        $sets = @(ConvertTo-AzsList $w.managedRuleSets)
        $drs = @($sets | Where-Object { "$(Get-AzsP $_ 'ruleSetType')" -ieq 'Microsoft_DefaultRuleSet' })
        $bot = @($sets | Where-Object { "$(Get-AzsP $_ 'ruleSetType')" -ieq 'Microsoft_BotManagerRuleSet' }).Count -gt 0
        $rate = @((ConvertTo-AzsList $w.customRules) | Where-Object { "$(Get-AzsP $_ 'ruleType')" -ieq 'RateLimitRule' }).Count -gt 0
        $ver = if ($drs.Count) { "$(Get-AzsP $drs[0] 'ruleSetVersion')" } else { '' }
        if (-not $enabled -or $mode -ine 'Prevention') {
            $f.Add((New-AzsFinding -Rule AZS-WAF-01 -ResourceId $w.id -Detail "mode $mode, $(if ($enabled) { 'enabled' } else { 'disabled' })"))
            if ($kind -eq 'appgw') { $plan.Add("az network application-gateway waf-policy policy-setting update --policy-name $($w.name) --resource-group $(Get-AzsResourceGroupOf $w.id) --subscription $($w.subscriptionId) --mode Prevention --state Enabled --request-body-check true") }
            else { $plan.Add("# $($w.name) (Front Door): switch to Prevention in a reviewed change after the false-positive review; see the guide's Step 4") }
        }
        if (-not $body) { $f.Add((New-AzsFinding -Rule AZS-WAF-02 -ResourceId $w.id -Detail 'request body inspection is off')) }
        if (-not $drs.Count) { $f.Add((New-AzsFinding -Rule AZS-WAF-03 -ResourceId $w.id -Detail 'no Microsoft_DefaultRuleSet')) }
        elseif ((Get-AzsVersion $ver) -lt $min) { $f.Add((New-AzsFinding -Rule AZS-WAF-03 -ResourceId $w.id -Detail "Default Rule Set $ver; the baseline is $($b.minimumDefaultRuleSet), validated in Detection first")) }
        if (-not $bot) { $f.Add((New-AzsFinding -Rule AZS-WAF-04 -ResourceId $w.id -Detail 'no Microsoft_BotManagerRuleSet')) }
        if (-not $rate) { $f.Add((New-AzsFinding -Rule AZS-WAF-05 -ResourceId $w.id -Detail 'no RateLimitRule custom rule')) }
        if ($kind -eq 'afd' -and "$($w.sku)" -ine 'Premium_AzureFrontDoor') { $f.Add((New-AzsFinding -Rule AZS-WAF-08 -ResourceId $w.id -Detail "sku $($w.sku)")) }
        $prevention = $enabled -and $mode -ieq 'Prevention' -and $body
        $rows.Add([ordered]@{ resourceId = $w.id; name = $w.name; kind = $kind; mode = $mode; enabled = $enabled; requestBodyCheck = $body; defaultRuleSet = $ver; botRules = $bot; rateLimit = $rate; prevention = $prevention })
        $policies["$($w.id)".ToLowerInvariant()] = $prevention
    }
    foreach ($w in (Get-AzsRows -Ctx $Ctx -CallId arg-appgw-waf-policies)) { & $check $w 'appgw' }
    foreach ($w in (Get-AzsRows -Ctx $Ctx -CallId arg-afd-waf-policies)) { & $check $w 'afd' }
    $endpoints = 0; $covered = 0
    foreach ($g in (Get-AzsRows -Ctx $Ctx -CallId arg-app-gateways)) {
        $public = @((ConvertTo-AzsList $g.frontendIPConfigurations) | Where-Object { Get-AzsP $_ 'properties.publicIPAddress.id' }).Count -gt 0
        if (-not $public) { continue }
        $endpoints++
        if (-not "$($g.wafPolicy)" -or "$($g.skuTier)" -notlike 'WAF*') { $f.Add((New-AzsFinding -Rule AZS-WAF-06 -ResourceId $g.id -Detail "sku tier $($g.skuTier), WAF policy $(if ("$($g.wafPolicy)") { Get-AzsName $g.wafPolicy } else { 'none' })")) }
        elseif ($policies["$($g.wafPolicy)".ToLowerInvariant()]) { $covered++ }
        if (-not (Test-AzsDiag -Settings (Get-AzsList -Ctx $Ctx -CallId rest-diagnostic-settings -Key $g.id) -WorkspaceId $s.workspaceId)) { $f.Add((New-AzsFinding -Rule AZS-WAF-07 -ResourceId $g.id -Detail 'no access or firewall log to the platform workspace')) }
    }
    foreach ($a in (Get-AzsRows -Ctx $Ctx -CallId arg-frontdoor-profiles)) {
        $endpoints++
        $wafs = @((Get-AzsList -Ctx $Ctx -CallId rest-afd-security-policies -Key $a.id) | ForEach-Object { "$(Get-AzsP $_ 'properties.parameters.wafPolicy.id')" } | Where-Object { $_ })
        if (-not $wafs.Count) { $f.Add((New-AzsFinding -Rule AZS-WAF-06 -ResourceId $a.id -Detail 'no security policy with a WAF policy')) }
        elseif (@($wafs | Where-Object { $policies["$_".ToLowerInvariant()] }).Count -eq $wafs.Count) { $covered++ }
        if (-not (Test-AzsDiag -Settings (Get-AzsList -Ctx $Ctx -CallId rest-diagnostic-settings -Key $a.id) -WorkspaceId $s.workspaceId)) { $f.Add((New-AzsFinding -Rule AZS-WAF-07 -ResourceId $a.id -Detail 'no access, health probe or WAF log to the platform workspace')) }
    }
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Plan = $plan.ToArray(); Summary = [ordered]@{
            wafPolicies = $rows.Count; inPrevention = @($rows | Where-Object { $_.prevention }).Count; internetFacingEndpoints = $endpoints; behindPreventionWaf = $covered; preventionCoveragePercent = (Get-AzsPercent $covered $endpoints) }
        Line = "Read: $($rows.Count) WAF policies, $endpoints internet-facing endpoints. Behind a WAF in Prevention: $covered of $endpoints" }
}

# ----------------------------------------------------------------------------- Step 5: the edge

function Get-AzsEdgeCheck {
    <#
    .SYNOPSIS
        Step 5: classic Front Door profiles; each Standard or Premium origin's lock-down (Private Link, or
        an App Service access restriction that allows only the AzureFrontDoor.Backend tag with this
        profile's X-Azure-FDID); origin groups that mix private and public origins or can't fail over;
        TLS on custom domains and application gateways.
    .EXAMPLE
        Get-AzsEdgeCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $b = $Ctx.Baseline
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new()
    $classic = @(Get-AzsRows -Ctx $Ctx -CallId arg-classic-frontdoors)
    foreach ($c in $classic) { $f.Add((New-AzsFinding -Rule AZS-EDGE-01 -ResourceId $c.id -Detail 'migrate to Standard or Premium before March 31, 2027')) }
    $origins = 0; $locked = 0
    foreach ($a in (Get-AzsRows -Ctx $Ctx -CallId arg-frontdoor-profiles)) {
        foreach ($og in (Get-AzsList -Ctx $Ctx -CallId rest-afd-origin-groups -Key $a.id)) {
            $list = @(Get-AzsList -Ctx $Ctx -CallId rest-afd-origins -Key $og.id)
            $kinds = @()
            foreach ($o in $list) {
                $origins++
                $pl = Get-AzsP $o 'properties.sharedPrivateLinkResource'
                $azure = "$(Get-AzsP $o 'properties.azureOrigin.id')"
                $lock = ''; $detail = ''
                if ($pl -and "$(Get-AzsP $pl 'status')" -ieq 'Approved') { $lock = 'PrivateLink'; $kinds += 'private' }
                else {
                    $kinds += 'public'
                    if ($azure -match '/providers/Microsoft\.Web/sites/') {
                        $cfg = Invoke-AzsCall -Invoker $Ctx.Invoker -CallId rest-webapp-config -Key $azure
                        $rules = @(ConvertTo-AzsList (Get-AzsP $cfg 'properties.ipSecurityRestrictions'))
                        $default = "$(Get-AzsP $cfg 'properties.ipSecurityRestrictionsDefaultAction')"
                        $tagRules = @($rules | Where-Object { "$(Get-AzsP $_ 'action')" -ieq 'Allow' -and "$(Get-AzsP $_ 'tag')" -ieq 'ServiceTag' -and "$(Get-AzsP $_ 'ipAddress')" -ieq 'AzureFrontDoor.Backend' })
                        $openRules = @($rules | Where-Object { "$(Get-AzsP $_ 'action')" -ieq 'Allow' -and "$(Get-AzsP $_ 'ipAddress')" -in 'Any', '0.0.0.0/0' })
                        $fdids = @($tagRules | ForEach-Object { $h = Get-AzsP $_ 'headers'; if ($h) { foreach ($k in $h.Keys) { if ("$k" -ieq 'x-azure-fdid') { ConvertTo-AzsList $h[$k] } } } })
                        if (-not $tagRules.Count -or $openRules.Count -or $default -ieq 'Allow') {
                            $lock = 'Open'; $detail = "access restrictions: $(if (-not $tagRules.Count) { 'no AzureFrontDoor.Backend rule' } elseif ($openRules.Count) { 'an Allow rule for any address' } else { 'default action Allow' })"
                            $f.Add((New-AzsFinding -Rule AZS-EDGE-02 -ResourceId $o.id -Name "$($a.name)/$($og.name)/$($o.name)" -Detail $detail))
                        } elseif (-not $fdids.Count) {
                            $lock = 'TagOnly'; $detail = "the AzureFrontDoor.Backend rule on $(Get-AzsName $azure) has no X-Azure-FDID header"
                            $f.Add((New-AzsFinding -Rule AZS-EDGE-03 -ResourceId $o.id -Name "$($a.name)/$($og.name)/$($o.name)" -Detail $detail))
                        } elseif ($fdids -inotcontains "$($a.frontDoorId)") {
                            $lock = 'OtherFrontDoor'; $detail = "X-Azure-FDID $($fdids -join ', ') isn't this profile's $($a.frontDoorId)"
                            $f.Add((New-AzsFinding -Rule AZS-EDGE-02 -ResourceId $o.id -Name "$($a.name)/$($og.name)/$($o.name)" -Detail $detail))
                        } else { $lock = 'ServiceTag+FDID' }
                    } else {
                        $lock = 'Unchecked'; $detail = "$(if ($azure) { "$((($azure -split '/providers/')[1] -split '/')[0..1] -join '/')" } else { "$(Get-AzsP $o 'properties.hostName')" }): test a direct request by hand"
                        $f.Add((New-AzsFinding -Rule AZS-EDGE-04 -ResourceId $o.id -Name "$($a.name)/$($og.name)/$($o.name)" -Detail $detail))
                    }
                }
                if ($lock -in 'PrivateLink', 'ServiceTag+FDID') { $locked++ }
                $rows.Add([ordered]@{ kind = 'origin'; profile = $a.name; originGroup = $og.name; name = $o.name; hostName = "$(Get-AzsP $o 'properties.hostName')"; lockdown = $lock; detail = $detail })
            }
            if (($kinds -contains 'private') -and ($kinds -contains 'public')) { $f.Add((New-AzsFinding -Rule AZS-EDGE-05 -ResourceId $og.id -Name "$($a.name)/$($og.name)" -Detail 'Private Link and public origins in one origin group')) }
            $enabled = @($list | Where-Object { "$(Get-AzsP $_ 'properties.enabledState')" -ine 'Disabled' }).Count
            if ($enabled -lt 2) { $f.Add((New-AzsFinding -Rule AZS-EDGE-08 -ResourceId $og.id -Name "$($a.name)/$($og.name)" -Detail "$enabled enabled origin")) }
        }
        foreach ($d in (Get-AzsList -Ctx $Ctx -CallId rest-afd-custom-domains -Key $a.id)) {
            $tls = "$(Get-AzsP $d 'properties.tlsSettings.minimumTlsVersion')"
            $rows.Add([ordered]@{ kind = 'custom-domain'; profile = $a.name; name = "$(Get-AzsP $d 'properties.hostName')"; minimumTls = $tls })
            if ($tls -and $tls -lt $b.minimumFrontDoorTls) { $f.Add((New-AzsFinding -Rule AZS-EDGE-06 -ResourceId $d.id -Name "$(Get-AzsP $d 'properties.hostName')" -Detail "minimumTlsVersion $tls")) }
        }
    }
    foreach ($g in (Get-AzsRows -Ctx $Ctx -CallId arg-app-gateways)) {
        $pol = "$(Get-AzsP $g.sslPolicy 'policyName')"; $type = "$(Get-AzsP $g.sslPolicy 'policyType')"
        $rows.Add([ordered]@{ kind = 'application-gateway'; name = $g.name; tlsPolicyType = $type; tlsPolicy = $pol })
        if (@($b.allowedAppGwSslPolicies) -inotcontains $pol) { $f.Add((New-AzsFinding -Rule AZS-EDGE-07 -ResourceId $g.id -Detail "TLS policy $(if ($pol) { "$type $pol" } else { 'not set (the API version decides the default)' })")) }
    }
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Summary = [ordered]@{
            classicProfiles = @($classic).Count; origins = $origins; lockedByConfiguration = $locked; lockdownPercent = (Get-AzsPercent $locked $origins) }
        Line = "Read: $origins origins, $(@($rows | Where-Object { $_.kind -eq 'custom-domain' }).Count) custom domains, $(@($rows | Where-Object { $_.kind -eq 'application-gateway' }).Count) application gateways, classic Front Door: $(@($classic).Count). Origins locked by configuration: $locked of $origins" }
}

# ----------------------------------------------------------------------------- Step 6: firewall and egress

function Get-AzsFirewallCheck {
    <#
    .SYNOPSIS
        Step 6: each firewall policy's threat intelligence and IDPS modes, tier and TLS inspection; each
        firewall's policy and logs; and each workload subnet's declared default route (0.0.0.0/0 to a
        firewall's private IP). Writes the guide's Draft + Deployment commands for policies not yet in Deny
        to plan-deny.txt; runs none of them. Declared routes only: Lab 2 checks the effective routes.
    .EXAMPLE
        Get-AzsFirewallCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings; $b = $Ctx.Baseline
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new(); $plan = [Collections.Generic.List[string]]::new()
    foreach ($p in (Get-AzsRows -Ctx $Ctx -CallId arg-firewall-policies)) {
        $rg = Get-AzsResourceGroupOf $p.id
        if ("$($p.threatIntelMode)" -ine 'Deny') { $f.Add((New-AzsFinding -Rule AZS-FW-01 -ResourceId $p.id -Detail "threatIntelMode $($p.threatIntelMode)")) }
        if ("$($p.tier)" -ine 'Premium') { $f.Add((New-AzsFinding -Rule AZS-FW-02 -ResourceId $p.id -Detail "tier $($p.tier): IDPS needs Premium")) }
        elseif ("$($p.idpsMode)" -ine 'Deny') { $f.Add((New-AzsFinding -Rule AZS-FW-02 -ResourceId $p.id -Detail "intrusionDetection.mode $(if ("$($p.idpsMode)") { $p.idpsMode } else { 'not set' })")) }
        if ("$($p.tier)" -ieq 'Premium' -and -not $p.tlsInspection) { $f.Add((New-AzsFinding -Rule AZS-FW-07 -ResourceId $p.id -Detail 'no transportSecurity (TLS inspection) configured')) }
        if ("$($p.threatIntelMode)" -ine 'Deny' -or ("$($p.tier)" -ieq 'Premium' -and "$($p.idpsMode)" -ine 'Deny')) {
            $plan.Add("az network firewall policy draft create --policy-name $($p.name) --resource-group $rg --subscription $($p.subscriptionId)")
            $plan.Add("az network firewall policy draft update --policy-name $($p.name) --resource-group $rg --subscription $($p.subscriptionId) --threat-intel-mode Deny$(if ("$($p.tier)" -ieq 'Premium') { ' --idps-mode Deny' })")
            $plan.Add("az network firewall policy draft show --policy-name $($p.name) --resource-group $rg --subscription $($p.subscriptionId)")
            $plan.Add("az network firewall policy deploy --name $($p.name) --resource-group $rg --subscription $($p.subscriptionId)")
        }
        $rows.Add([ordered]@{ kind = 'policy'; name = $p.name; tier = $p.tier; threatIntelMode = $p.threatIntelMode; idpsMode = $p.idpsMode; tlsInspection = [bool]$p.tlsInspection })
    }
    $fwIps = @{}
    foreach ($w in (Get-AzsRows -Ctx $Ctx -CallId arg-firewalls)) {
        foreach ($ic in (ConvertTo-AzsList $w.ipConfigurations)) { $ip = "$(Get-AzsP $ic 'properties.privateIPAddress')"; if ($ip) { $fwIps[$ip] = $w.name } }
        if (-not "$($w.policy)") { $f.Add((New-AzsFinding -Rule AZS-FW-06 -ResourceId $w.id -Detail 'no firewallPolicy')) }
        if (-not (Test-AzsDiag -Settings (Get-AzsList -Ctx $Ctx -CallId rest-diagnostic-settings -Key $w.id) -WorkspaceId $s.workspaceId)) { $f.Add((New-AzsFinding -Rule AZS-FW-05 -ResourceId $w.id -Detail 'no enabled log to the platform workspace')) }
        $rows.Add([ordered]@{ kind = 'firewall'; name = $w.name; tier = $w.tier; policy = (Get-AzsName $w.policy) })
    }
    $tables = @{}; foreach ($t in (Get-AzsRows -Ctx $Ctx -CallId arg-route-tables)) { $tables["$($t.id)".ToLowerInvariant()] = $t }
    $workload = @($s.workloadSubscriptionIds | ForEach-Object { "$_".ToLowerInvariant() })
    $subnets = 0; $routed = 0
    foreach ($v in (Get-AzsRows -Ctx $Ctx -CallId arg-vnets)) {
        if ($workload -notcontains "$($v.subscriptionId)".ToLowerInvariant()) { continue }
        foreach ($sn in (ConvertTo-AzsList $v.subnets)) {
            if (@($b.reservedSubnets) -icontains "$($sn.name)") { continue }
            $subnets++
            $rtId = "$(Get-AzsP $sn 'properties.routeTable.id')"; $state = ''; $detail = ''
            $sid = "$($sn.id)"
            if (-not $rtId) { $state = 'NoRouteTable'; $f.Add((New-AzsFinding -Rule AZS-FW-03 -ResourceId $sid -Name "$($v.name)/$($sn.name)" -Detail 'no route table')) }
            else {
                $rt = $tables[$rtId.ToLowerInvariant()]
                $def = @((ConvertTo-AzsList $(if ($rt) { $rt.routes } else { $null })) | Where-Object { "$(Get-AzsP $_ 'properties.addressPrefix')" -eq '0.0.0.0/0' })
                if (-not $def.Count) { $state = 'NoDefaultRoute'; $f.Add((New-AzsFinding -Rule AZS-FW-03 -ResourceId $sid -Name "$($v.name)/$($sn.name)" -Detail "$(Get-AzsName $rtId) has no 0.0.0.0/0 route")) }
                else {
                    $hop = "$(Get-AzsP $def[0] 'properties.nextHopType')"; $ip = "$(Get-AzsP $def[0] 'properties.nextHopIpAddress')"
                    if ($hop -ieq 'VirtualAppliance' -and $fwIps.Contains($ip)) { $state = 'Firewall'; $routed++; $detail = "$ip ($($fwIps[$ip]))" }
                    elseif ($hop -ieq 'VirtualAppliance') { $state = 'OtherAppliance'; $detail = $ip; $f.Add((New-AzsFinding -Rule AZS-FW-04 -ResourceId $sid -Name "$($v.name)/$($sn.name)" -Detail "0.0.0.0/0 to $ip, which isn't an Azure Firewall the kit read")) }
                    else { $state = $hop; $f.Add((New-AzsFinding -Rule AZS-FW-03 -ResourceId $sid -Name "$($v.name)/$($sn.name)" -Detail "0.0.0.0/0 next hop $hop")) }
                }
            }
            $rows.Add([ordered]@{ kind = 'subnet'; name = "$($v.name)/$($sn.name)"; routeTable = (Get-AzsName $rtId); defaultRoute = $state; detail = $detail })
        }
    }
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Plan = $plan.ToArray(); Summary = [ordered]@{
            firewallPolicies = @($rows | Where-Object { $_.kind -eq 'policy' }).Count; firewalls = @($rows | Where-Object { $_.kind -eq 'firewall' }).Count
            workloadSubnets = $subnets; routedToFirewall = $routed; egressPercent = (Get-AzsPercent $routed $subnets) }
        Line = "Read: $(@($rows | Where-Object { $_.kind -eq 'policy' }).Count) firewall policies, $(@($rows | Where-Object { $_.kind -eq 'firewall' }).Count) firewalls, $subnets workload subnets. Routed to the firewall (declared): $routed of $subnets" }
}

# ----------------------------------------------------------------------------- Steps 7 and 8: private access

function Get-AzsPrivateCheck {
    <#
    .SYNOPSIS
        Steps 7 and 8: privatelink zones in the connectivity subscription and linked to the hub; every
        private endpoint with a zone group in those zones; resources with a private endpoint that are still
        public; and every vault on RBAC with purge protection, a closed firewall, an approved private
        endpoint and AuditEvent logs.
    .EXAMPLE
        Get-AzsPrivateCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new()
    $conn = "$($s.connectivitySubscriptionId)".ToLowerInvariant()
    $links = @(Get-AzsRows -Ctx $Ctx -CallId arg-private-dns-links)
    $zones = @(Get-AzsRows -Ctx $Ctx -CallId arg-private-dns-zones)
    foreach ($z in $zones) {
        if ("$($z.name)" -notlike 'privatelink.*') { continue }
        $central = "$($z.subscriptionId)".ToLowerInvariant() -eq $conn
        $hub = @($links | Where-Object { "$($_.zone)" -ieq $z.id -and "$($_.vnet)" -ieq $s.hubVnetId }).Count -gt 0
        if (-not $central) { $f.Add((New-AzsFinding -Rule AZS-PL-01 -ResourceId $z.id -Detail "in subscription $($z.subscriptionId)")) }
        if (-not $hub) { $f.Add((New-AzsFinding -Rule AZS-PL-02 -ResourceId $z.id -Detail "not linked to $(Get-AzsName $s.hubVnetId)")) }
        $rows.Add([ordered]@{ kind = 'zone'; name = $z.name; central = $central; linkedToHub = $hub })
    }
    foreach ($pe in (Get-AzsRows -Ctx $Ctx -CallId arg-private-endpoints)) {
        $groups = @(Get-AzsList -Ctx $Ctx -CallId rest-pe-zone-groups -Key $pe.id)
        $zoneIds = @($groups | ForEach-Object { ConvertTo-AzsList (Get-AzsP $_ 'properties.privateDnsZoneConfigs') } | ForEach-Object { "$(Get-AzsP $_ 'properties.privateDnsZoneId')" } | Where-Object { $_ })
        $target = @((ConvertTo-AzsList $pe.connections) | ForEach-Object { "$(Get-AzsName (Get-AzsP $_ 'properties.privateLinkServiceId'))/$(@(ConvertTo-AzsList (Get-AzsP $_ 'properties.groupIds')) -join ',')" }) -join '; '
        if (-not $zoneIds.Count) { $f.Add((New-AzsFinding -Rule AZS-PL-03 -ResourceId $pe.id -Detail "to $target")) }
        foreach ($zid in $zoneIds) { if ((Get-AzsSubscriptionOf $zid) -ne $conn) { $f.Add((New-AzsFinding -Rule AZS-PL-04 -ResourceId $pe.id -Detail "registers in $(Get-AzsName $zid) in subscription $(Get-AzsSubscriptionOf $zid)")) } }
        $rows.Add([ordered]@{ kind = 'private-endpoint'; name = $pe.name; target = $target; zones = @($zoneIds | ForEach-Object { Get-AzsName $_ }) })
    }
    $paas = @(Get-AzsRows -Ctx $Ctx -CallId arg-paas-public)
    foreach ($p in $paas) {
        if ([int]"0$($p.privateEndpoints)" -gt 0) { $f.Add((New-AzsFinding -Rule AZS-PL-05 -ResourceId $p.id -Detail "publicNetworkAccess $($p.publicNetworkAccess) with $($p.privateEndpoints) private endpoints")) }
        elseif ("$($p.type)" -ine 'microsoft.keyvault/vaults') { $f.Add((New-AzsFinding -Rule AZS-PL-06 -ResourceId $p.id -Detail "$($p.type), publicNetworkAccess $($p.publicNetworkAccess)")) }
    }
    $vaults = @(Get-AzsRows -Ctx $Ctx -CallId arg-key-vaults)
    $good = 0
    foreach ($v in $vaults) {
        $pe = @((ConvertTo-AzsList $v.privateEndpointConnections) | Where-Object { "$(Get-AzsP $_ 'properties.privateLinkServiceConnectionState.status')" -ieq 'Approved' }).Count
        $audit = Test-AzsDiag -Settings (Get-AzsList -Ctx $Ctx -CallId rest-diagnostic-settings -Key $v.id) -WorkspaceId $s.workspaceId -Groups audit, allLogs -Categories AuditEvent
        if ($v.rbac -ne $true) { $f.Add((New-AzsFinding -Rule AZS-KV-01 -ResourceId $v.id -Detail 'enableRbacAuthorization is not true')) }
        if ($v.purgeProtection -ne $true) { $f.Add((New-AzsFinding -Rule AZS-KV-02 -ResourceId $v.id -Detail 'enablePurgeProtection is not true')) }
        if ("$($v.defaultAction)" -ine 'Deny') { $f.Add((New-AzsFinding -Rule AZS-KV-03 -ResourceId $v.id -Detail "networkAcls.defaultAction $(if ("$($v.defaultAction)") { $v.defaultAction } else { 'not set' })")) }
        if ("$($v.publicNetworkAccess)" -ine 'Disabled') { $f.Add((New-AzsFinding -Rule AZS-KV-04 -ResourceId $v.id -Detail "publicNetworkAccess $($v.publicNetworkAccess)")) }
        if (-not $pe) { $f.Add((New-AzsFinding -Rule AZS-KV-05 -ResourceId $v.id -Detail 'no approved private endpoint connection')) }
        if (-not $audit) { $f.Add((New-AzsFinding -Rule AZS-KV-06 -ResourceId $v.id -Detail 'no AuditEvent (or audit, allLogs) to the platform workspace')) }
        $ok = ($v.rbac -eq $true) -and ($v.purgeProtection -eq $true) -and $pe -and $audit
        if ($ok) { $good++ }
        $rows.Add([ordered]@{ kind = 'vault'; name = $v.name; rbac = ($v.rbac -eq $true); purgeProtection = ($v.purgeProtection -eq $true); defaultAction = $v.defaultAction; publicNetworkAccess = $v.publicNetworkAccess; privateEndpoints = $pe; auditToWorkspace = $audit; posture = $ok })
    }
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Summary = [ordered]@{
            privatelinkZones = @($rows | Where-Object { $_.kind -eq 'zone' }).Count; privateEndpoints = @($rows | Where-Object { $_.kind -eq 'private-endpoint' }).Count
            publicPaas = @($paas).Count; vaults = @($vaults).Count; vaultsWithFullPosture = $good; vaultPosturePercent = (Get-AzsPercent $good @($vaults).Count) }
        Line = "Read: $(@($zones).Count) private DNS zones, $(@($rows | Where-Object { $_.kind -eq 'private-endpoint' }).Count) private endpoints, $(@($paas).Count) public PaaS resources, $(@($vaults).Count) vaults. Vaults with the full posture: $good of $(@($vaults).Count)" }
}

# ----------------------------------------------------------------------------- Step 9: policy

function Get-AzsPolicyCheck {
    <#
    .SYNOPSIS
        Step 9: the security initiative's assignment and its enforce-by date, assignments that use
        notScopes, every exemption's expiry (none, expired, or due within the warning window), and each
        assignment's compliance from Learn's 'Compliance by policy assignment' query.
    .EXAMPLE
        Get-AzsPolicyCheck -Ctx $ctx
    #>
    param([Parameter(Mandatory)]$Ctx)
    $s = $Ctx.Settings; $b = $Ctx.Baseline
    $f = [Collections.Generic.List[object]]::new(); $rows = [Collections.Generic.List[object]]::new()
    $asOf = [DateTimeOffset]::Parse($Ctx.AsOf, [Globalization.CultureInfo]::InvariantCulture)
    $mgId = "/providers/Microsoft.Management/managementGroups/$($s.managementGroup)"
    $assignments = @(Get-AzsRows -Ctx $Ctx -CallId arg-policy-assignments)
    $si = $s.securityInitiative
    $sec = @($assignments | Where-Object { "$($_.name)" -ieq $si.assignmentName -and "$($_.scope)" -ieq $mgId })
    if (-not $sec.Count) { $f.Add((New-AzsFinding -Rule AZS-POL-01 -ResourceId "$mgId/providers/Microsoft.Authorization/policyAssignments/$($si.assignmentName)" -Name $si.assignmentName -Detail "not assigned at $($s.managementGroup)")) }
    elseif ("$($sec[0].enforcementMode)" -ieq 'DoNotEnforce' -and $si.Contains('enforceBy') -and $si.enforceBy -and $asOf -gt [DateTimeOffset]::Parse("$($si.enforceBy)T00:00:00Z", [Globalization.CultureInfo]::InvariantCulture)) {
        $f.Add((New-AzsFinding -Rule AZS-POL-02 -ResourceId $sec[0].id -Detail "DoNotEnforce; the settings' enforce-by date was $($si.enforceBy)"))
    }
    foreach ($a in $assignments) {
        if (@(ConvertTo-AzsList $a.notScopes).Count) { $f.Add((New-AzsFinding -Rule AZS-POL-06 -ResourceId $a.id -Detail "notScopes: $(@(ConvertTo-AzsList $a.notScopes | ForEach-Object { Get-AzsName $_ }) -join ', ')")) }
        $rows.Add([ordered]@{ kind = 'assignment'; name = $a.name; displayName = $a.displayName; scope = $a.scope; enforcementMode = $a.enforcementMode })
    }
    $ex = @(Get-AzsRows -Ctx $Ctx -CallId arg-policy-exemptions)
    $counts = [ordered]@{ current = 0; dueSoon = 0; expired = 0; noExpiry = 0 }
    foreach ($e in $ex) {
        $state = 'current'
        if (-not "$($e.expiresOn)") { $state = 'noExpiry'; $f.Add((New-AzsFinding -Rule AZS-POL-03 -ResourceId $e.id -Detail "$($e.category); $($e.description)")) }
        else {
            $exp = [DateTimeOffset]::Parse("$($e.expiresOn)", [Globalization.CultureInfo]::InvariantCulture)
            if ($exp -le $asOf) { $state = 'expired'; $f.Add((New-AzsFinding -Rule AZS-POL-04 -ResourceId $e.id -Detail "$($e.category), expired $($exp.UtcDateTime.ToString('yyyy-MM-dd')); $($e.description)")) }
            elseif ($exp -le $asOf.AddDays([int]$b.exemptionWarnDays)) { $state = 'dueSoon'; $f.Add((New-AzsFinding -Rule AZS-POL-05 -ResourceId $e.id -Detail "$($e.category), expires $($exp.UtcDateTime.ToString('yyyy-MM-dd')); $($e.description)")) }
        }
        $counts[$state]++
        $rows.Add([ordered]@{ kind = 'exemption'; name = $e.name; category = $e.category; expiresOn = $e.expiresOn; state = $state; description = $e.description })
    }
    $comp = @(Get-AzsRows -Ctx $Ctx -CallId arg-policy-compliance)
    foreach ($c in $comp) { $rows.Add([ordered]@{ kind = 'compliance'; name = $c.policyAssignmentName; complianceState = $c.complianceState; compliancePercentage = $c.compliancePercentage; compliant = $c.compliantCount; nonCompliant = $c.nonCompliantCount; exempt = $c.exemptCount }) }
    $secComp = @($comp | Where-Object { "$($_.policyAssignmentName)" -ieq $si.assignmentName })
    @{ Rows = $rows.ToArray(); Findings = $f.ToArray(); Summary = [ordered]@{
            assignments = @($assignments).Count; securityInitiativeMode = $(if ($sec.Count) { "$($sec[0].enforcementMode)" } else { 'missing' })
            securityInitiativeCompliancePercent = $(if ($secComp.Count) { $secComp[0].compliancePercentage } else { $null }); exemptions = $counts }
        Line = "Read: $(@($assignments).Count) assignments, $(@($ex).Count) exemptions, compliance for $(@($comp).Count) assignments" }
}

# ----------------------------------------------------------------------------- running a check

function ConvertTo-AzsCsvText {
    <#
    .SYNOPSIS
        Rows (hashtables) as CSV text with the named columns, every value quoted; a list is joined with '; '.
    .EXAMPLE
        ConvertTo-AzsCsvText -Rows @(@{ rule = 'AZS-KV-02'; name = 'kv' }) -Columns rule, name
    #>
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Rows, [Parameter(Mandatory)][string[]]$Columns)
    $q = { param($v) $t = if ($v -is [Collections.IEnumerable] -and $v -isnot [string] -and $v -isnot [Collections.IDictionary]) { @($v) -join '; ' } else { "$v" }; '"' + ($t -replace '"', '""') + '"' }
    $lines = @(($Columns | ForEach-Object { & $q $_ }) -join ',')
    foreach ($r in $Rows) { $lines += (($Columns | ForEach-Object { & $q $r[$_] }) -join ',') }
    ($lines -join "`n") + "`n"
}

function Write-AzsManifest {
    <#
    .SYNOPSIS
        Writes manifest.json in a run folder: the task, area, time, mode, environment, the calls sent with
        their roles, and the SHA-256 of every other file in the folder (subfolders included).
    .EXAMPLE
        Write-AzsManifest -OutputPath out/week1/ddos -Task check -Area ddos -AsOf 2026-11-09T12:00:00Z -Mode Fixture -Environment lab
    #>
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][string]$AsOf,
        [string]$Area = '', [string]$Mode = 'Fixture', [string]$Environment = '', [string]$TenantId = '', [string[]]$CallIds = @(), [hashtable]$Extra = @{})
    $root = (Resolve-Path -LiteralPath $OutputPath).Path.TrimEnd('\', '/')
    $files = [ordered]@{}
    foreach ($fi in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object { $_.FullName -ne (Join-Path $root 'manifest.json') } | Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') })) {
        $files[$fi.FullName.Substring($root.Length + 1).Replace('\', '/')] = Get-AzsFileHash -Path $fi.FullName
    }
    $calls = @($CallIds | Sort-Object -Unique | ForEach-Object { $c = Get-AzsCall -Id $_; [ordered]@{ id = $c.id; kind = $c.kind; role = $c.role; verified = [bool]$c.verified; doc = $c.doc } })
    $m = [ordered]@{ schema = 'fmp-azs-manifest/1'; task = $Task; area = $Area; asOf = $AsOf; mode = $Mode; environment = $Environment; tenantId = $TenantId; kit = 'examples/azure-security'; calls = $calls; files = $files }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-AzsJson -Path (Join-Path $root 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $root 'manifest.json')
}

function Invoke-AzsCheck {
    <#
    .SYNOPSIS
        Runs one area's check and writes its run folder: <area>.json (the rows), findings.json and
        findings.csv, summary.json, raw/ (every response read), a plan file where the area writes one,
        register.json and register.csv for the exposure area, and manifest.json. Returns the result.
    .EXAMPLE
        Invoke-AzsCheck -Area ddos -Settings $s -Invoker (New-AzsFixtureInvoker -Path tests/fixtures/week1) -AsOf 2026-11-09T12:00:00Z -OutputPath out/w1/ddos
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy')][string]$Area,
        [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$AsOf, [Parameter(Mandatory)][string]$OutputPath,
        [object[]]$PreviousRegister, [object[]]$DefenderExposure)
    $AsOf = ConvertTo-AzsUtc $AsOf
    $Invoker.Calls.Clear()
    $ctx = @{ Settings = $Settings; Baseline = (Get-AzsBaseline); Invoker = $Invoker; AsOf = $AsOf; PreviousRegister = $PreviousRegister; DefenderExposure = $DefenderExposure }
    $r = switch ($Area) {
        'baseline' { Get-AzsBaselineCheck -Ctx $ctx }
        'exposure' { Get-AzsExposureCheck -Ctx $ctx }
        'ddos' { Get-AzsDdosCheck -Ctx $ctx }
        'waf' { Get-AzsWafCheck -Ctx $ctx }
        'edge' { Get-AzsEdgeCheck -Ctx $ctx }
        'firewall' { Get-AzsFirewallCheck -Ctx $ctx }
        'private' { Get-AzsPrivateCheck -Ctx $ctx }
        'policy' { Get-AzsPolicyCheck -Ctx $ctx }
    }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $findings = @($r.Findings | Sort-Object @{ e = { @{ Finding = 0; Warn = 1; Info = 2 }[$_.severity] } }, rule, resourceId)
    Write-AzsJson -Path (Join-Path $OutputPath "$Area.json") -Value @($r.Rows)
    Write-AzsJson -Path (Join-Path $OutputPath 'findings.json') -Value @($findings)
    Write-AzsText -Path (Join-Path $OutputPath 'findings.csv') -Text (ConvertTo-AzsCsvText -Rows $findings -Columns rule, severity, step, name, detail, resourceId, source, fingerprint)
    $counts = [ordered]@{ Finding = @($findings | Where-Object severity -EQ 'Finding').Count; Warn = @($findings | Where-Object severity -EQ 'Warn').Count; Info = @($findings | Where-Object severity -EQ 'Info').Count }
    $summary = [ordered]@{ area = $Area; asOf = $AsOf; environment = "$($Settings.environment)"; findings = $counts }
    foreach ($k in $r.Summary.Keys) { $summary[$k] = $r.Summary[$k] }
    Write-AzsJson -Path (Join-Path $OutputPath 'summary.json') -Value $summary
    if ($r.Contains('Register')) {
        Write-AzsJson -Path (Join-Path $OutputPath 'register.json') -Value @($r.Register)
        Write-AzsText -Path (Join-Path $OutputPath 'register.csv') -Text (ConvertTo-AzsCsvText -Rows @($r.Register) -Columns resourceId, type, name, subscriptionId, publicName, owner, ddos, waf, wafMode, originLockdown, lastReviewed)
    }
    $planFile = @{ waf = 'plan-prevention.txt'; firewall = 'plan-deny.txt' }[$Area]
    if ($planFile -and $r.Contains('Plan') -and @($r.Plan).Count) {
        $head = @("# Reviewed commands the kit did NOT run. Read the guide's Step $(@{ waf = 4; firewall = 6 }[$Area]) first; run each in a change window, from a session signed in to $($Settings.cloud).", "")
        Write-AzsText -Path (Join-Path $OutputPath $planFile) -Text (((@($head) + @($r.Plan)) -join "`n") + "`n")
    }
    $raw = @{}
    foreach ($c in $Invoker.Calls) {
        if ("$($c.key)") { if (-not $raw.Contains($c.call)) { $raw[$c.call] = [ordered]@{} }; $raw[$c.call]["$($c.key)".ToLowerInvariant()] = $c.response }
        else { $raw[$c.call] = $c.response }
    }
    foreach ($k in ($raw.Keys | Sort-Object)) { Write-AzsJson -Path (Join-Path $OutputPath "raw/$k.json") -Value $raw[$k] }
    $null = Write-AzsManifest -OutputPath $OutputPath -Task check -Area $Area -AsOf $AsOf -Mode $Invoker.Mode -Environment "$($Settings.environment)" -TenantId "$($Settings.tenantId)" -CallIds @($raw.Keys)
    [pscustomobject]@{ Area = $Area; Line = $r.Line; Counts = $counts; Findings = $findings; Summary = $summary; Path = $OutputPath; Calls = @($raw.Keys).Count }
}

# ----------------------------------------------------------------------------- compare and metrics

function Compare-AzsRun {
    <#
    .SYNOPSIS
        Compares two runs (each a folder of area folders, or one area folder) by finding fingerprint: new,
        fixed and still open, per area. Writes drift.json and drift.md, and a manifest.
    .EXAMPLE
        Compare-AzsRun -Before out/week1 -After out/week2 -OutputPath out/drift
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Before, [Parameter(Mandatory)][string]$After, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')))
    $AsOf = ConvertTo-AzsUtc $AsOf
    $folders = { param($p) if (Test-Path -LiteralPath (Join-Path $p 'findings.json')) { @{ (Split-Path -Leaf $p) = $p } } else { $h = @{}; foreach ($d in (Get-ChildItem -LiteralPath $p -Directory)) { if (Test-Path -LiteralPath (Join-Path $d.FullName 'findings.json')) { $h[$d.Name] = $d.FullName } }; $h } }
    $b = & $folders $Before; $a = & $folders $After
    $areas = [ordered]@{}; $md = @("# Drift: $(Split-Path -Leaf $Before) to $(Split-Path -Leaf $After)", "", "| Area | New | Fixed | Still open |", "|---|---|---|---|")
    $details = @()
    foreach ($area in ($script:Areas | Where-Object { $b.Contains($_) -and $a.Contains($_) })) {
        $fb = @{}; foreach ($x in (Read-AzsJson -Path (Join-Path $b[$area] 'findings.json'))) { if ($x.severity -ne 'Info') { $fb[$x.fingerprint] = $x } }
        $fa = @{}; foreach ($x in (Read-AzsJson -Path (Join-Path $a[$area] 'findings.json'))) { if ($x.severity -ne 'Info') { $fa[$x.fingerprint] = $x } }
        $new = @($fa.Keys | Where-Object { -not $fb.Contains($_) } | ForEach-Object { $fa[$_] } | Sort-Object rule, name)
        $fixed = @($fb.Keys | Where-Object { -not $fa.Contains($_) } | ForEach-Object { $fb[$_] } | Sort-Object rule, name)
        $open = @($fa.Keys | Where-Object { $fb.Contains($_) } | ForEach-Object { $fa[$_] } | Sort-Object rule, name)
        $areas[$area] = [ordered]@{ new = @($new | ForEach-Object { [ordered]@{ rule = $_.rule; severity = $_.severity; name = $_.name; fingerprint = $_.fingerprint } })
            fixed = @($fixed | ForEach-Object { [ordered]@{ rule = $_.rule; severity = $_.severity; name = $_.name; fingerprint = $_.fingerprint } }); stillOpen = $open.Count }
        $md += "| $area | $($new.Count) | $($fixed.Count) | $($open.Count) |"
        foreach ($x in $new) { $details += "- **New** $area $($x.rule) $($x.name): $($x.detail)" }
        foreach ($x in $fixed) { $details += "- **Fixed** $area $($x.rule) $($x.name)" }
    }
    $md += @("", "Findings and warnings by area; Info rows are left out.", "") + $details
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-AzsJson -Path (Join-Path $OutputPath 'drift.json') -Value ([ordered]@{ before = (Split-Path -Leaf $Before); after = (Split-Path -Leaf $After); asOf = $AsOf; areas = $areas })
    Write-AzsText -Path (Join-Path $OutputPath 'drift.md') -Text (($md -join "`n") + "`n")
    $null = Write-AzsManifest -OutputPath $OutputPath -Task compare -AsOf $AsOf
    $tot = [ordered]@{ new = 0; fixed = 0; stillOpen = 0 }
    foreach ($k in $areas.Keys) { $tot.new += @($areas[$k].new).Count; $tot.fixed += @($areas[$k].fixed).Count; $tot.stillOpen += $areas[$k].stillOpen }
    [pscustomobject]@{ Areas = $areas; Totals = $tot; Path = $OutputPath }
}

function Get-AzsMetric {
    <#
    .SYNOPSIS
        The guide's metrics from one run (a folder of area folders): the ones the kit can compute, with the
        numbers behind each, and the ones that come from exercise records or the workspace, marked so.
        Writes metrics.json, metrics.csv and a manifest with -OutputPath.
    .EXAMPLE
        Get-AzsMetric -RunPath out/week2 -OutputPath out/metrics
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath, [string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')))
    $sum = @{}
    foreach ($area in $script:Areas) { $p = Join-Path $RunPath "$area/summary.json"; if (Test-Path -LiteralPath $p) { $sum[$area] = Read-AzsJson -Path $p } }
    $m = { param($name, $area, $value, $basis, $target) [ordered]@{ metric = $name; value = $(if ($null -eq $value) { 'not computed' } elseif ($value -is [string]) { $value } else { "$value%" }); basis = $basis; target = $target; source = $area } }
    $v = { param($area, $key) if ($sum.Contains($area)) { $sum[$area][$key] } else { $null } }
    $rows = @(
        (& $m 'Exposure ownership' 'exposure' (& $v exposure ownershipPercent) "$(& $v exposure owned) of $(& $v exposure exposures) register rows have an owner" '100%')
        (& $m 'DDoS coverage' 'ddos' (& $v ddos coveragePercent) "$(& $v ddos protected) of $(& $v ddos inScope) public IPs (NAT gateway and unattached IPs left out)" '100%')
        (& $m 'WAF prevention coverage' 'waf' (& $v waf preventionCoveragePercent) "$(& $v waf behindPreventionWaf) of $(& $v waf internetFacingEndpoints) internet-facing endpoints" '100%')
        (& $m 'Origin lock-down' 'edge' (& $v edge lockdownPercent) "$(& $v edge lockedByConfiguration) of $(& $v edge origins) origins, by configuration; the guide counts tested origins (Lab 2)" '100%')
        (& $m 'Egress inspection' 'firewall' (& $v firewall egressPercent) "$(& $v firewall routedToFirewall) of $(& $v firewall workloadSubnets) workload subnets, declared routes; effective routes in Lab 2" '100%')
        (& $m 'Private PaaS' 'private' "$(& $v private publicPaas) public" 'Resource Graph lists only public resources; the denominator is the agency''s in-scope list' 'Agency target, rising')
        (& $m 'Vault posture' 'private' (& $v private vaultPosturePercent) "$(& $v private vaultsWithFullPosture) of $(& $v private vaults) vaults with RBAC, purge protection, an approved private endpoint and AuditEvent" '100%')
        (& $m 'Policy compliance' 'policy' (& $v policy securityInitiativeCompliancePercent) 'the security initiative, from Learn''s compliance-by-assignment query' 'Rising each month')
        (& $m 'Exemption hygiene' 'policy' $(if ($sum.Contains('policy')) { "$($sum.policy.exemptions.expired) expired" } else { $null }) "$(if ($sum.Contains('policy')) { "$($sum.policy.exemptions.noExpiry) with no expiry, $($sum.policy.exemptions.dueSoon) due soon" })" '0')
        (& $m 'Detection to page' '' 'from the exercise record' 'minutes from mitigation start to acknowledgment, in the DDoS exercise' 'Agency target')
        (& $m 'Exercise currency' '' 'from the exercise records' 'days since the last DDoS simulation and failover test' 'Under 365 and 183')
        (& $m 'WAF effectiveness' '' 'from the workspace' 'blocked attack requests and reported false positives per month' 'Trend')
    )
    if ($OutputPath) {
        $AsOf = ConvertTo-AzsUtc $AsOf
        if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
        New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
        Write-AzsJson -Path (Join-Path $OutputPath 'metrics.json') -Value ([ordered]@{ run = (Split-Path -Leaf $RunPath); asOf = $AsOf; metrics = $rows })
        Write-AzsText -Path (Join-Path $OutputPath 'metrics.csv') -Text (ConvertTo-AzsCsvText -Rows $rows -Columns metric, value, basis, target, source)
        $null = Write-AzsManifest -OutputPath $OutputPath -Task metrics -AsOf $AsOf
    }
    $rows | ForEach-Object { [pscustomobject]$_ }
}

# ----------------------------------------------------------------------------- evidence

function Test-AzsRunFolder {
    <#
    .SYNOPSIS
        Re-hashes every file a run folder's manifest.json lists. Returns @{ Ok; Detail; Manifest }.
    .EXAMPLE
        Test-AzsRunFolder -Path out/week1/ddos
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-AzsJson -Path $mp
    $bad = @()
    foreach ($k in $m.files.Keys) {
        $fp = Join-Path $Path $k
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$k missing" } elseif ((Get-AzsFileHash -Path $fp) -ne $m.files[$k]) { $bad += "$k changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) files match the manifest" }); Manifest = $m }
}

function Get-AzsStepsForRun {
    param([Parameter(Mandatory)][Collections.IDictionary]$Manifest)
    $req = Get-AzsRequirements
    switch ($Manifest.task) {
        'check' { @($req.areas[$Manifest.area]) }
        'check-all' { @(@($Manifest.areas) | ForEach-Object { $req.areas[$_] }) }
        'compare' { @('DRIFT') }
        'metrics' { @('METRICS') }
        'preflight' { @('PRE') }
        'scheduled-run' { @('RUN') + @(@($Manifest.areas) | ForEach-Object { $req.areas[$_] }) + @('METRICS') + $(if ($Manifest.Contains('compared') -and $Manifest.compared) { @('DRIFT') } else { @() }) }
        'policy-plan' { @('PLAN') }
        'rollback' { @('RB') }
        default { throw "No evidence step for task '$($Manifest.task)'." }
    }
}

function Update-AzsEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder: one "sha256  relative/path" line per file, so the ISSO can
        check it with sha256sum -c SHA256SUMS. Returns the line count.
    .EXAMPLE
        Update-AzsEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
            ForEach-Object { '{0}  {1}' -f (Get-AzsFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    $lines.Count
}

function Write-AzsEvidence {
    <#
    .SYNOPSIS
        Records one run folder as evidence: checks its manifest, copies it under runs/, and writes a record
        with the time, environment, command, result, the steps it covers with their SP 800-53 controls and
        FedRAMP 20x KSIs, every file's SHA-256 and the SHA-256 of the record before it, so the records form
        a chain. Appends records.csv and rewrites SHA256SUMS. A fixture run is recorded as mode Fixture and
        can never pass a stage check.
    .EXAMPLE
        Write-AzsEvidence -EvidencePath out/evidence -RunPath out/week1/ddos -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$Command = '', [string]$ChangeRecord = '', [string]$Note = '')
    $AsOf = ConvertTo-AzsUtc $AsOf
    $req = Get-AzsRequirements
    $t = Test-AzsRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $steps = @(@(Get-AzsStepsForRun -Manifest $t.Manifest) | Select-Object -Unique) + @('EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-AzsFileHash -Path $prior[-1].FullName } else { $null }
    $label = if ($t.Manifest.area) { "$($t.Manifest.task)-$($t.Manifest.area)" } else { "$($t.Manifest.task)" }
    $name = '{0:d4}-{1}' -f $seq, $label
    $dest = Join-Path $EvidencePath "runs/$name"
    if (Test-Path -LiteralPath $dest) { Remove-Item -Recurse -Force -LiteralPath $dest }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in $t.Manifest.files.Keys) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-AzsFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @($steps | ForEach-Object { $req.steps[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req.steps[$_].ksis } | Sort-Object -Unique)
    $rec = [ordered]@{
        schema = 'fmp-azs-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = $t.Manifest.task; area = "$($t.Manifest.area)"; environment = "$($t.Manifest.environment)"; mode = "$($t.Manifest.mode)"
        tenantId = "$($t.Manifest.tenantId)"; changeRecord = $ChangeRecord; command = $Command.Trim(); result = $(if ($t.Ok) { 'Pass' } else { 'Fail' }); detail = $t.Detail; note = $Note
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_].title } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-AzsJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-AzsText -Path $csv -Text "sequence,recordedAt,task,area,environment,mode,result,steps,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $AsOf, $t.Manifest.task, "$($t.Manifest.area)", "$($t.Manifest.environment)", "$($t.Manifest.mode)", $rec.result, ($steps -join ' '), ($controls -join ' '), ($ksis -join ' '), (Get-AzsFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", [Text.UTF8Encoding]::new($false))
    $null = Update-AzsEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $rec.result; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-AzsEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: every file SHA256SUMS lists is unchanged and every file is listed; each
        record's files match their hashes; the chain is unbroken; and, with -Stage, every step the stage
        needs has a passing record from a live run (fixture records don't count). One row per check.
    .EXAMPLE
        Test-AzsEvidence -EvidencePath out/evidence -Stage test
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [ValidateSet('test', 'production')][string]$Stage)
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $sums = Join-Path $root 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) { & $add 'SUMS' $false 'no SHA256SUMS'; return $rows.ToArray() }
    $listed = @{}; $bad = @()
    foreach ($l in (Get-Content -LiteralPath $sums)) { if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] } }
    foreach ($fi in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $fi.FullName.Substring($root.Length + 1).Replace('\', '/')
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-AzsFileHash -Path $fi.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { $bad -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}
    foreach ($r in $recs) {
        $j = Read-AzsJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($fx in @($j.files)) { $fp = Join-Path $root $fx.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-AzsFileHash -Path $fp) -ne $fx.sha256) { $chain += "$($fx.path) doesn't match $($r.Name)" } }
        if ($j.result -eq 'Pass' -and $j.mode -ne 'Fixture') { foreach ($st in @($j.steps)) { $passed[$st.id] = $true } }
        $prev = Get-AzsFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Stage) {
        foreach ($st in (Get-AzsRequirements).stages[$Stage]) { & $add "STEP-$st" $passed.Contains($st) $(if ($passed.Contains($st)) { 'a passing live record covers it' } else { 'no passing live record' }) }
    }
    $rows.ToArray()
}

Export-ModuleMember -Function Get-AzsCloud, Read-AzsJson, Write-AzsJson, Write-AzsText, Get-AzsFileHash, Get-AzsTextHash, Get-AzsP, ConvertTo-AzsList, ConvertTo-AzsUtc,
    Get-AzsCall, Get-AzsRequiredRole, Get-AzsRules, Get-AzsBaseline, Get-AzsRequirements, Read-AzsSettings,
    New-AzsFixtureInvoker, Set-AzsRunner, Invoke-AzsAz, Get-AzsLiveCommand, Assert-AzsLiveContext, New-AzsLiveInvoker, Invoke-AzsCall,
    New-AzsFinding, Test-AzsDiag, Get-AzsBaselineCheck, Get-AzsExposureCheck, Get-AzsDdosCheck, Get-AzsWafCheck, Get-AzsEdgeCheck, Get-AzsFirewallCheck,
    Get-AzsPrivateCheck, Get-AzsPolicyCheck, ConvertTo-AzsCsvText, Write-AzsManifest, Invoke-AzsCheck, Compare-AzsRun, Get-AzsMetric,
    Test-AzsRunFolder, Update-AzsEvidenceSums, Write-AzsEvidence, Test-AzsEvidence
