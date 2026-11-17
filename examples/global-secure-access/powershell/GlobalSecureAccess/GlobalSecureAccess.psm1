#Requires -Version 7.1
<#
    GlobalSecureAccess: the code behind the Global Secure Access implementation guide. It reads a tenant's
    Global Secure Access configuration through Microsoft Graph (mostly the beta network access API), Azure
    Resource Manager and the Log Analytics workspace, checks it against the guide's steps, plans the changes a
    ring needs as a file a reviewer approves by its SHA-256, computes the guide's metrics and ring exit criteria,
    and records every run as hashed, chained evidence tagged with NIST SP 800-53 Rev 5 controls and FedRAMP 20x
    KSIs.

    Every call is declared in config/calls.json with its least-privileged permission and the Learn page that
    states it. Fixture mode reads files and sends nothing; live mode uses Microsoft Graph PowerShell
    (Invoke-MgGraphRequest) in a delegated session and the Azure CLI. Writes run only from a plan, with -Apply
    and the plan's approved SHA-256, in live mode. Microsoft 365 GCC (Moderate) uses the worldwide endpoints:
    graph.microsoft.com, login.microsoftonline.com and management.azure.com. Illustrative: tested against
    fictional fixtures and stand-in runners, not run against a live tenant.
#>

# Version 1.0: uninitialized variables are errors; a key a record leaves out reads as $null.
Set-StrictMode -Version 1.0
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:ConfigRoot = Join-Path $script:KitRoot 'config'
$script:Areas = @('decision', 'baseline', 'client', 'traffic', 'compliant-network', 'tenant-restrictions', 'private-access', 'internet-access', 'tls', 'telemetry')
$script:InternetApp = '5dc48733-b5df-475c-a49b-fa307ef00853'   # Learn: All internet resources with Global Secure Access
$script:PhishStrength = '00000000-0000-0000-0000-000000000004'  # Learn: built-in phishing-resistant MFA strength
$script:AdminPorts = @(22, 3389)
$script:ReportOnly = 'enabledForReportingButNotEnforced'

# ----------------------------------------------------------------------------- clouds

# Learn, "Microsoft Graph national cloud deployments": GCC uses the worldwide endpoints. Case-sensitive on
# purpose: any other name throws, and there is no default.
$script:Clouds = @{
    global = @{ Graph = 'https://graph.microsoft.com'; GraphEnvironment = 'Global'; Login = 'https://login.microsoftonline.com'; Arm = 'https://management.azure.com'; AzCloud = 'AzureCloud' }
    gcc    = @{ Graph = 'https://graph.microsoft.com'; GraphEnvironment = 'Global'; Login = 'https://login.microsoftonline.com'; Arm = 'https://management.azure.com'; AzCloud = 'AzureCloud' }
}

function Get-GsaCloud {
    <#
    .SYNOPSIS
        Returns the endpoints for a cloud name: gcc (Microsoft 365 GCC Moderate) or global. Any other name throws.
    .EXAMPLE
        (Get-GsaCloud -Cloud gcc).Graph      # https://graph.microsoft.com
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    if (-not ($script:Clouds.Keys -ccontains $Cloud)) { throw "Unknown cloud '$Cloud'. Use gcc or global." }
    [pscustomobject]$script:Clouds[$Cloud]
}

# ----------------------------------------------------------------------------- files and values

function Read-GsaJson {
    <#
    .SYNOPSIS
        Reads a JSON file as hashtables and arrays, keeping date-like strings as strings where PowerShell allows it.
    .EXAMPLE
        Read-GsaJson -Path config/availability.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    ConvertFrom-GsaJsonText -Text $text
}

function ConvertFrom-GsaJsonText {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    if (-not $Text.Trim()) { return $null }
    $p = @{ AsHashtable = $true; Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String'; return ($Text | ConvertFrom-Json @p) }
    , (ConvertTo-GsaStringDate -Value ($Text | ConvertFrom-Json @p))
}

function ConvertTo-GsaStringDate {
    param([AllowNull()]$Value)
    if ($Value -is [DateTime]) { return $Value.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [Collections.IDictionary]) { foreach ($k in @($Value.Keys)) { $Value[$k] = ConvertTo-GsaStringDate -Value $Value[$k] }; return , $Value }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) { for ($i = 0; $i -lt $Value.Count; $i++) { $Value[$i] = ConvertTo-GsaStringDate -Value $Value[$i] }; return , $Value }
    $Value
}

function Write-GsaJson {
    <#
    .SYNOPSIS
        Writes a value as UTF-8 JSON without a byte order mark, with LF line endings.
    .EXAMPLE
        Write-GsaJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()]$Value)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = (ConvertTo-Json -InputObject $Value -Depth 50) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Path, $json + "`n", [Text.UTF8Encoding]::new($false))
}

function Write-GsaText {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), [Text.UTF8Encoding]::new($false))
}

function Get-GsaFileHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a file, the form every manifest, plan and evidence record uses.
    .EXAMPLE
        Get-GsaFileHash -Path config/calls.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function ConvertTo-GsaUtc {
    <#
    .SYNOPSIS
        A time as 'yyyy-MM-ddTHH:mm:ssZ'. Takes a DateTime or an ISO 8601 string (a date alone is midnight UTC).
    .EXAMPLE
        ConvertTo-GsaUtc '2026-11-16'      # 2026-11-16T00:00:00Z
    #>
    param([AllowNull()]$Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    $o = [DateTimeOffset]::MinValue
    if ($Value -is [DateTime]) { $dt = $Value.ToUniversalTime() }
    elseif ([DateTimeOffset]::TryParse("$Value", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal, [ref]$o)) { $dt = $o.UtcDateTime }
    else { throw "Not a time: '$Value'" }
    $dt.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
}

function Get-GsaDate {
    param([AllowNull()]$Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    [DateTime]::Parse((ConvertTo-GsaUtc $Value), [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
}

function Get-GsaBusinessDays {
    <#
    .SYNOPSIS
        The number of weekdays (Monday to Friday) from one date to another, not counting the first day. Holidays aren't known to the kit.
    .EXAMPLE
        Get-GsaBusinessDays -From 2026-11-02 -To 2026-11-16      # 10
    #>
    param([Parameter(Mandatory)]$From, [Parameter(Mandatory)]$To)
    $a = (Get-GsaDate $From).Date; $b = (Get-GsaDate $To).Date; $n = 0
    while ($a -lt $b) { $a = $a.AddDays(1); if ($a.DayOfWeek -notin 'Saturday', 'Sunday') { $n++ } }
    $n
}

function Get-GsaList {
    param($Value)
    # The items of a Graph collection ({ value: [...] }) or of a list, one by one down the pipeline.
    if ($null -eq $Value) { return }
    if ($Value -is [Collections.IDictionary] -and $Value.Contains('value')) { foreach ($v in @($Value['value'])) { $v }; return }
    foreach ($v in @($Value)) { $v }
}

function Get-GsaSum {
    param($Rows, [string]$Name)
    $t = 0.0
    foreach ($r in @($Rows)) { if ($r -is [Collections.IDictionary] -and $r.Contains($Name)) { $t += [double]$r[$Name] } elseif ($null -ne $r -and $r.PSObject.Properties[$Name]) { $t += [double]$r.$Name } }
    $t
}

function Compare-GsaVersion {
    # -1, 0 or 1; a version that doesn't parse sorts lowest.
    param([string]$A, [string]$B)
    $va = $null; $vb = $null
    $null = [version]::TryParse($A, [ref]$va); $null = [version]::TryParse($B, [ref]$vb)
    if (-not $va) { $va = [version]'0.0' }; if (-not $vb) { $vb = [version]'0.0' }
    $va.CompareTo($vb)
}

# ----------------------------------------------------------------------------- calls

function Get-GsaCall {
    <#
    .SYNOPSIS
        The calls declared in config/calls.json: all of them, one area's, or the one with -Id. Each carries its
        method, URI, least-privileged permission, roles, Learn page, beta flag and whether it was verified.
    .EXAMPLE
        Get-GsaCall -Area private-access | ForEach-Object id
    #>
    [CmdletBinding()]
    param([string]$Area, [string]$Id, [switch]$Writes)
    $calls = @((Read-GsaJson -Path (Join-Path $script:ConfigRoot 'calls.json')).calls)
    if ($Id) {
        $c = @($calls | Where-Object { $_.id -eq $Id })
        if (-not $c.Count) { throw "Call '$Id' isn't declared in config/calls.json." }
        return $c[0]
    }
    if ($Writes) { return @($calls | Where-Object { $_.Contains('write') -and $_.write }) }
    $calls = @($calls | Where-Object { -not ($_.Contains('write') -and $_.write) })
    if ($Area) { $calls = @($calls | Where-Object { $Area -in @($_.area) }) }
    $calls
}

function Get-GsaRequiredPermission {
    <#
    .SYNOPSIS
        What an area's reads need, call by call: the least-privileged permission, the roles, whether the call is
        beta and whether it was verified against its Learn page. -Writes lists the plan's writes instead.
    .EXAMPLE
        Get-GsaRequiredPermission -Area decision | Format-Table
    #>
    [CmdletBinding()]
    param([string]$Area, [switch]$Writes)
    $calls = if ($Writes) { Get-GsaCall -Writes } else { Get-GsaCall -Area $Area }
    foreach ($c in $calls) {
        [pscustomobject][ordered]@{ Call = $c.id; Method = $c.method; Permission = (@($c.permissions) -join '; '); Beta = [bool]$c.beta; Verified = [bool]$c.verified }
    }
}

function Get-GsaAvailability {
    <#
    .SYNOPSIS
        The guide's GCC availability table (config/availability.json): each feature's GCC state, license, release
        stage, guide step, and the interim path the kit expects where GCC availability is not yet specified.
    .EXAMPLE
        Get-GsaAvailability -NotAvailable | Format-Table id, status, interim
    #>
    [CmdletBinding()]
    param([switch]$NotAvailable)
    $rows = @((Read-GsaJson -Path (Join-Path $script:ConfigRoot 'availability.json')).features)
    if ($NotAvailable) { $rows = @($rows | Where-Object { $_.gcc -ne 'available' }) }
    foreach ($r in $rows) {
        [pscustomobject][ordered]@{ id = $r.id; gcc = $r.gcc; status = $r.status; step = $r.step; license = $r.license; interim = $(if ($r.Contains('interim')) { $r.interim } else { '' }) }
    }
}

# ----------------------------------------------------------------------------- settings

function Read-GsaSettings {
    <#
    .SYNOPSIS
        Reads one environment's settings file. Refuses a secret-like value anywhere, an unknown cloud, and, for the
        test and production environments, any <placeholder> left in it.
    .EXAMPLE
        $s = Read-GsaSettings -Path tests/fixtures/settings.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $s = Read-GsaJson -Path $Path
    $raw = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    if ($raw -match '(?i)"(client_?secret|password|secret|token|apikey|api_key)"\s*:\s*"[^"<]') { throw "Settings $Path holds a secret-like value; settings hold names and IDs only." }
    foreach ($k in 'environment', 'cloud', 'tenantId', 'ring', 'groups') { if (-not $s.Contains($k)) { throw "Settings $Path has no '$k'." } }
    $null = Get-GsaCloud -Cloud $s.cloud
    if ($s.environment -in 'test', 'production') {
        $body = ($raw -split "`n" | Where-Object { $_ -notmatch '"_comment"' }) -join "`n"
        $left = [regex]::Matches($body, '<[a-z][a-z0-9:-]*>') | ForEach-Object Value | Sort-Object -Unique
        if ($left) { throw "Settings $Path still has placeholders: $($left -join ', ')." }
    }
    $s
}

# ----------------------------------------------------------------------------- invokers

# The runners: replaced in tests so nothing is sent. Live, Invoke-MgGraphRequest and the Azure CLI.
$script:GraphRunner = { param([string]$Method, [string]$Uri, $Body) if ($null -ne $Body) { Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body ($Body | ConvertTo-Json -Depth 30) -ContentType 'application/json' -OutputType Hashtable } else { Invoke-MgGraphRequest -Method $Method -Uri $Uri -OutputType Hashtable } }
$script:GraphContext = { $c = Get-MgContext; if ($c) { @{ Environment = "$($c.Environment)"; TenantId = "$($c.TenantId)"; AuthType = "$($c.AuthType)"; Scopes = @($c.Scopes) } } }
$script:NativeRunner = { param([string]$Tool, [string[]]$Arguments) $out = & $Tool @Arguments 2>&1; @{ ExitCode = $LASTEXITCODE; Output = (@($out) -join "`n") } }

function Set-GsaRunner {
    <#
    .SYNOPSIS
        Replaces the Graph, Graph-context or native (Azure CLI) runner, for tests. Returns the previous runners.
    .EXAMPLE
        $old = Set-GsaRunner -Graph { param($Method, $Uri, $Body) @{ value = @() } }
    #>
    param([scriptblock]$Graph, [scriptblock]$GraphContext, [scriptblock]$Native)
    $old = @{ Graph = $script:GraphRunner; GraphContext = $script:GraphContext; Native = $script:NativeRunner }
    if ($Graph) { $script:GraphRunner = $Graph }
    if ($GraphContext) { $script:GraphContext = $GraphContext }
    if ($Native) { $script:NativeRunner = $Native }
    $old
}

function New-GsaFixtureInvoker {
    <#
    .SYNOPSIS
        The fixture invoker: each read returns its file (config/calls.json 'fixture') from <Path>/tenant. Sends
        nothing anywhere, and refuses every write.
    .EXAMPLE
        $inv = New-GsaFixtureInvoker -Path tests/fixtures/pilot
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    [pscustomobject]@{ Mode = 'Fixture'; Root = (Resolve-Path -LiteralPath $Path).Path; Calls = [Collections.Generic.List[string]]::new() }
}

function New-GsaLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: reads through Invoke-MgGraphRequest and the Azure CLI after Assert-GsaLiveContext. Refuses
        a call that isn't declared, an unverified one unless -AllowUnverified, and a beta call in an app-only
        session (the guide runs the beta API interactively). Not run against a live tenant by the authors.
    .EXAMPLE
        $inv = New-GsaLiveInvoker -Settings (Read-GsaSettings -Path <settings-file>)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [switch]$AllowUnverified)
    [pscustomobject]@{ Mode = 'Live'; Settings = $Settings; AllowUnverified = [bool]$AllowUnverified; Checked = $false; Calls = [Collections.Generic.List[string]]::new() }
}

function Assert-GsaLiveContext {
    <#
    .SYNOPSIS
        Refuses a live run whose Microsoft Graph session is missing, in another environment than the settings'
        cloud, in another tenant, or app-only (the beta network access API is run interactively, by a person).
    .EXAMPLE
        Assert-GsaLiveContext -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings)
    $want = (Get-GsaCloud -Cloud $Settings.cloud).GraphEnvironment
    $ctx = & $script:GraphContext
    if (-not $ctx) { throw "No Microsoft Graph session. Run: Connect-MgGraph -Environment $want -TenantId $($Settings.tenantId) -Scopes <the scopes Get-GsaRequiredPermission lists>" }
    if ($ctx.Environment -ne $want) { throw "The Graph session is in '$($ctx.Environment)', not '$want'." }
    if ($ctx.TenantId -and $ctx.TenantId -ne $Settings.tenantId) { throw "The Graph session is in tenant $($ctx.TenantId), not $($Settings.tenantId)." }
    if ($ctx.AuthType -and $ctx.AuthType -ne 'Delegated') { throw "The Graph session is $($ctx.AuthType). The beta network access API is run interactively, signed in as a person (Delegated)." }
}

function Resolve-GsaUri {
    param([Parameter(Mandatory)][string]$Uri, [hashtable]$Arguments = @{})
    $u = $Uri
    foreach ($k in $Arguments.Keys) { $u = $u.Replace("{$k}", "$($Arguments[$k])") }
    $u
}

function Invoke-GsaCall {
    <#
    .SYNOPSIS
        Sends one declared read through an invoker: a fixture invoker reads its file, a live invoker sends the
        request (following @odata.nextLink), and a test's invoker (Mode 'Script') runs its own script block.
    .EXAMPLE
        Invoke-GsaCall -Invoker (New-GsaFixtureInvoker -Path tests/fixtures/pilot) -CallId forwarding-profiles
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$CallId, [hashtable]$Arguments = @{})
    $call = Get-GsaCall -Id $CallId
    if ($call.Contains('write') -and $call.write) { throw "Call $CallId writes; writes run only from an approved plan (Invoke-GsaPlanSteps)." }
    $Invoker.Calls.Add($CallId)
    switch ($Invoker.Mode) {
        'Fixture' {
            $file = Join-Path (Join-Path $Invoker.Root 'tenant') $call.fixture
            if (-not (Test-Path -LiteralPath $file)) { throw "Fixture $file is missing for call $CallId." }
            $data = Read-GsaJson -Path $file
            if ($call.Contains('key')) {
                $k = "$($Arguments[$call.key])"
                if ($data.Contains($k)) { return , $data[$k] }
                return , @{ value = @() }
            }
            return , $data
        }
        'Script' { return , (& $Invoker.Script $CallId $Arguments) }
        'Live' {
            if (-not $call.verified -and -not $Invoker.AllowUnverified) { throw "Call $CallId isn't verified against its Learn page ($($call.unverified)). Pass -AllowUnverified to send it." }
            if ($call.tool -eq 'graph') {
                if (-not $Invoker.Checked) { Assert-GsaLiveContext -Settings $Invoker.Settings; $Invoker.Checked = $true }
                $uri = Resolve-GsaUri -Uri $call.uri -Arguments $Arguments
                $first = & $script:GraphRunner 'GET' $uri $null
                if (-not ($first -is [Collections.IDictionary] -and $first.Contains('value'))) { return , $first }
                $items = [Collections.Generic.List[object]]::new()
                $page = $first
                while ($true) {
                    foreach ($v in @($page['value'])) { if ($null -ne $v) { $items.Add($v) } }
                    if (-not ($page.Contains('@odata.nextLink') -and $page['@odata.nextLink'])) { break }
                    $page = & $script:GraphRunner 'GET' $page['@odata.nextLink'] $null
                }
                return , @{ value = $items.ToArray() }
            }
            if ($CallId -eq 'diagnostic-settings') {
                $r = & $script:NativeRunner 'az' @('rest', '--method', 'GET', '--uri', $call.uri)
                if ($r.ExitCode) { throw "az exited $($r.ExitCode): $($r.Output)" }
                return , (ConvertFrom-GsaJsonText -Text "$($r.Output)")
            }
            if ($CallId -eq 'law-query') {
                $q = (Read-GsaJson -Path (Join-Path $script:ConfigRoot 'queries.json')).queries[$Arguments.query]
                $r = & $script:NativeRunner 'az' @('monitor', 'log-analytics', 'query', '--workspace', "$($Invoker.Settings.workspace.guid)", '--analytics-query', $q.kql, '--output', 'json')
                if ($r.ExitCode) { throw "az exited $($r.ExitCode): $($r.Output)" }
                return , @(ConvertFrom-GsaJsonText -Text "$($r.Output)")
            }
            throw "No live sender for call $CallId."
        }
        default { throw "Unknown invoker mode '$($Invoker.Mode)'." }
    }
}

# ----------------------------------------------------------------------------- collection

function Invoke-GsaCollection {
    <#
    .SYNOPSIS
        Reads the tenant for the areas named (all by default): each declared read once (connector group members
        once per group, the guide's queries once each), written to raw/<call>.json and one collection.json, with a
        manifest of the calls, their permissions and the SHA-256 of every file. Learn's operations guidance is to
        export the configuration as Graph JSON weekly and before every change; this is that export.
    .EXAMPLE
        Invoke-GsaCollection -Invoker $inv -Settings $s -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string[]]$Area = $script:Areas)
    $AsOf = ConvertTo-GsaUtc $AsOf
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path (Join-Path $OutputPath 'raw') | Out-Null
    $ids = @(Get-GsaCall | Where-Object { @($_.area | Where-Object { $_ -in $Area }).Count } | ForEach-Object id)
    $col = [ordered]@{}
    foreach ($id in $ids) {
        switch ($id) {
            'connector-group-members' {
                $groups = if ($col.Contains('connector-groups')) { $col['connector-groups'] } else { Invoke-GsaCall -Invoker $Invoker -CallId connector-groups }
                $m = [ordered]@{}
                foreach ($g in (Get-GsaList $groups)) { $m[$g.id] = Invoke-GsaCall -Invoker $Invoker -CallId $id -Arguments @{ id = $g.id } }
                $col[$id] = $m
            }
            'law-query' {
                $m = [ordered]@{}
                $qs = (Read-GsaJson -Path (Join-Path $script:ConfigRoot 'queries.json')).queries
                foreach ($q in ($qs.Keys | Sort-Object)) { $m[$q] = Invoke-GsaCall -Invoker $Invoker -CallId $id -Arguments @{ query = $q } }
                $col[$id] = $m
            }
            'device-usage' {
                $end = Get-GsaDate $AsOf; $f = "yyyy-MM-dd'T'HH:mm:ss'Z'"
                $col[$id] = Invoke-GsaCall -Invoker $Invoker -CallId $id -Arguments @{ start = $end.AddDays(-7).ToString($f); end = $end.ToString($f); pivot = $end.AddDays(-1).ToString($f) }
            }
            default { $col[$id] = Invoke-GsaCall -Invoker $Invoker -CallId $id }
        }
        Write-GsaJson -Path (Join-Path $OutputPath "raw/$id.json") -Value $col[$id]
    }
    Write-GsaJson -Path (Join-Path $OutputPath 'collection.json') -Value $col
    $null = Write-GsaManifest -OutputPath $OutputPath -Task collect -AsOf $AsOf -Mode $Invoker.Mode -Settings $Settings -CallIds @($Invoker.Calls) -Extra @{ areas = @($Area) }
    [pscustomobject]@{ Path = $OutputPath; Calls = @($ids); Mode = $Invoker.Mode }
}

function Read-GsaCollection {
    <#
    .SYNOPSIS
        Reads a collection folder's collection.json (as Invoke-GsaCollection wrote it) after checking its manifest.
    .EXAMPLE
        $c = Read-GsaCollection -Path out/pilot
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $t = Test-GsaRunFolder -Path $Path
    if (-not $t.Ok) { throw "Collection $Path doesn't match its manifest: $($t.Detail)" }
    Read-GsaJson -Path (Join-Path $Path 'collection.json')
}

function Read-GsaInputs {
    <#
    .SYNOPSIS
        Reads the agency's own records from an inputs folder: decisions/*.json, architecture.json, exceptions.csv,
        client-records.json, tls.json and ring-record.json. A missing file reads as empty.
    .EXAMPLE
        $i = Read-GsaInputs -Path tests/fixtures/pilot/inputs
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $i = @{ decisions = @(); architecture = @{}; exceptions = @(); clients = @(); tls = @{}; ring = @{} }
    $d = Join-Path $Path 'decisions'
    if (Test-Path -LiteralPath $d) { $i.decisions = @(Get-ChildItem -LiteralPath $d -Filter *.json | Sort-Object Name | ForEach-Object { Read-GsaJson -Path $_.FullName }) }
    foreach ($pair in @(@('architecture', 'architecture.json'), @('tls', 'tls.json'), @('ring', 'ring-record.json'))) {
        $f = Join-Path $Path $pair[1]
        if (Test-Path -LiteralPath $f) { $i[$pair[0]] = Read-GsaJson -Path $f }
    }
    $f = Join-Path $Path 'client-records.json'
    if (Test-Path -LiteralPath $f) { $i.clients = @((Read-GsaJson -Path $f).devices) }
    $f = Join-Path $Path 'exceptions.csv'
    if (Test-Path -LiteralPath $f) { $i.exceptions = @(Import-Csv -LiteralPath $f) }
    $i
}

# ----------------------------------------------------------------------------- findings

function New-GsaFinding {
    param([string]$Id, [string]$Area, [ValidateSet('Pass', 'Fail', 'Warn', 'Info')][string]$Status, [string]$Object, [string]$Detail, [int]$GuideStep, [string]$Fix = '')
    [pscustomobject][ordered]@{ Id = $Id; Area = $Area; Status = $Status; Object = $Object; Detail = $Detail; GuideStep = $GuideStep; Fix = $Fix }
}

function Get-GsaPolicies {
    param([hashtable]$Collection, [string]$Prefix = 'NET-')
    @(Get-GsaList $Collection['ca-policies'] | Where-Object { "$($_.displayName)".StartsWith($Prefix) })
}

function Get-GsaPolicyValue {
    param($Policy, [string[]]$Path)
    $v = $Policy
    foreach ($p in $Path) { if ($null -eq $v -or $v -isnot [Collections.IDictionary] -or -not $v.Contains($p)) { return $null }; $v = $v[$p] }
    $v
}

function Test-GsaExclusion {
    param($Policy, [string]$GroupId)
    $GroupId -in @(Get-GsaPolicyValue $Policy @('conditions', 'users', 'excludeGroups'))
}

function Test-GsaDecision {
    <#
    .SYNOPSIS
        The guide's Step 1 checks (GSA-DEC-01 to -09): the tenant is onboarded; each function has a decision record
        with a dated availability quote (30 days), enough licenses, an approver, exit criteria and a review date;
        a retain or defer decision has compensating controls; and no preview feature whose GCC availability is not
        yet specified is used without an approved exception (the finding names the interim path).
    .EXAMPLE
        Test-GsaDecision -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'decision'; $now = Get-GsaDate $AsOf
    $st = "$(Get-GsaPolicyValue $Collection['tenant-status'] @('onboardingStatus'))"
    New-GsaFinding 'GSA-DEC-01' $a $(if ($st -eq 'onboarded') { 'Pass' } else { 'Fail' }) 'tenant' "onboardingStatus is '$st'" 1 'Onboard the tenant to Global Secure Access before any step.'
    $have = @($Inputs.decisions | ForEach-Object { $_.function })
    $missing = @('microsoft-traffic', 'internet', 'private', 'branch' | Where-Object { $_ -notin $have })
    New-GsaFinding 'GSA-DEC-02' $a $(if ($missing.Count) { 'Fail' } else { 'Pass' }) 'decision records' $(if ($missing.Count) { "no record for: $($missing -join ', ')" } else { 'one record per function: microsoft-traffic, internet, private, branch' }) 1 'Write one decision record per function (templates/decision-record.template.json).'
    $skus = @{}
    foreach ($s in (Get-GsaList $Collection['licenses'])) { $skus["$($s.skuPartNumber)"] = [int](Get-GsaPolicyValue $s @('prepaidUnits', 'enabled')) }
    $avail = @{}; foreach ($f in (Read-GsaJson -Path (Join-Path $script:ConfigRoot 'availability.json')).features) { $avail[$f.id] = $f }
    foreach ($d in $Inputs.decisions) {
        $o = "$($d.decision_id) ($($d.function), $($d.decision))"
        $read = Get-GsaDate $d.availability_read_on
        $age = if ($read) { [int]($now - $read).TotalDays } else { -1 }
        New-GsaFinding 'GSA-DEC-03' $a $(if ($read -and $age -le 30) { 'Pass' } else { 'Fail' }) $o $(if ($read) { "availability quote read $($d.availability_read_on), $age days before the run" } else { 'no availability quote date' }) 1 "Re-read Learn's Known limitations page and update the quote."
        if ($d.decision -in 'adopt', 'coexist') {
            $held = if ($d.license_sku -and $skus.Contains($d.license_sku)) { $skus[$d.license_sku] } else { 0 }
            New-GsaFinding 'GSA-DEC-04' $a $(if ($held -ge [int]$d.license_needed) { 'Pass' } else { 'Fail' }) $o "$($d.license_sku): $held enabled, $($d.license_needed) needed for the pilot and first ring" 1 'Buy or assign the licenses before the pilot.'
        }
        $appr = ($d.approver -and $d.approved_on)
        New-GsaFinding 'GSA-DEC-05' $a $(if ($appr) { 'Pass' } else { 'Fail' }) $o $(if ($appr) { "approved by $($d.approver) on $($d.approved_on)" } else { 'no approver or approval date' }) 1 'Have the approver sign the record.'
        if ($d.decision -in 'retain-current', 'defer') {
            $cc = @($d.compensating_controls | Where-Object { $_ })
            New-GsaFinding 'GSA-DEC-06' $a $(if ($cc.Count) { 'Pass' } else { 'Fail' }) $o $(if ($cc.Count) { "$($cc.Count) compensating controls" } else { 'a retain or defer decision names no compensating controls' }) 1 'Name what protects this function until it is adopted.'
        }
        foreach ($p in @($d.preview_features_used)) {
            $f = $avail[$p]
            $exc = @($d.exceptions | Where-Object { $_.feature -eq $p -and $_.approved_on })
            $interim = if ($f -and $f.Contains('interim')) { $f.interim } else { '' }
            $gcc = if ($f) { $f.gcc } else { 'not in the availability table' }
            New-GsaFinding 'GSA-DEC-07' $a $(if ($exc.Count -or ($f -and $f.gcc -eq 'available' -and $f.status -eq 'ga')) { 'Pass' } else { 'Fail' }) $o "uses '$p' (GCC: $gcc; $(if ($f) { $f.status } else { '?' })) with $(if ($exc.Count) { 'an approved exception' } else { 'no approved exception' })" 1 $(if ($interim) { "Interim path: $interim" } else { 'Remove the feature or approve an exception.' })
        }
        $ex = @($d.exit_criteria | Where-Object { $_ })
        New-GsaFinding 'GSA-DEC-08' $a $(if ($ex.Count) { 'Pass' } else { 'Fail' }) $o "$($ex.Count) exit criteria" 1 'Say when the agency would reverse or revisit the decision.'
        $rev = Get-GsaDate $d.review_on
        New-GsaFinding 'GSA-DEC-09' $a $(if ($rev -and $rev -gt $now -and ($rev - $now).TotalDays -le 366) { 'Pass' } else { 'Fail' }) $o "review on $($d.review_on)" 1 'Review the record within 12 months.'
    }
}

function Test-GsaBaseline {
    <#
    .SYNOPSIS
        The guide's Steps 2 and 12.1 checks (GSA-ARC-01 to -04, GSA-LOG-01): every connector group is in the
        architecture record with at least two hosts; the private DNS suffixes include the forest; the workspace is
        named; and the gsa-network-telemetry diagnostic setting sends all four network categories, before the pilot.
    .EXAMPLE
        Test-GsaBaseline -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'baseline'; $arch = $Inputs.architecture
    $recorded = @{}; foreach ($g in @($arch.connectorGroups)) { if ($g) { $recorded[$g.name] = $g } }
    foreach ($g in (Get-GsaList $Collection['connector-groups'])) {
        $r = $recorded[$g.name]
        $n = if ($r) { @($r.hosts).Count } else { 0 }
        New-GsaFinding 'GSA-ARC-01' $a $(if ($r -and $n -ge 2) { 'Pass' } else { 'Fail' }) "connector group $($g.name)" $(if ($r) { "in the architecture record with $n hosts" } else { 'not in the architecture record' }) 2 'Record every connector group, its site, its hosts (two or more) and its applications.'
    }
    $sfx = @($arch.privateDnsSuffixes)
    $forestOk = $arch.forest -and @($sfx | Where-Object { "$($arch.forest)" -eq $_ -or "$($arch.forest)".EndsWith(".$_") }).Count
    New-GsaFinding 'GSA-ARC-02' $a $(if ($forestOk) { 'Pass' } else { 'Fail' }) 'private DNS' "suffixes: $($sfx -join ', '); forest: $($arch.forest)" 2 'Add the Active Directory forest name to the private DNS suffixes.'
    New-GsaFinding 'GSA-ARC-03' $a $(if ($arch.workspace) { 'Pass' } else { 'Fail' }) 'telemetry' "workspace: $($arch.workspace)" 2 'Name where telemetry lands.'
    $want = @('NetworkAccessTrafficLogs', 'NetworkAccessConnectionEvents', 'RemoteNetworkHealthLogs', 'NetworkAccessAlerts')
    $ds = @(Get-GsaList $Collection['diagnostic-settings'] | Where-Object { $_.name -eq 'gsa-network-telemetry' })
    if (-not $ds.Count) {
        New-GsaFinding 'GSA-LOG-01' $a 'Fail' 'diagnostic setting gsa-network-telemetry' 'not present' 12 "Run the guide's Step 12.1 before the pilot."
    } else {
        $on = @($ds[0].properties.logs | Where-Object { $_.enabled } | ForEach-Object { $_.category })
        $off = @($want | Where-Object { $_ -notin $on })
        $ws = "$($ds[0].properties.workspaceId)"
        $wsOk = (-not $arch.workspace) -or $ws.EndsWith("/$($arch.workspace)", [StringComparison]::OrdinalIgnoreCase)
        New-GsaFinding 'GSA-LOG-01' $a $(if (-not $off.Count -and $wsOk) { 'Pass' } else { 'Fail' }) 'diagnostic setting gsa-network-telemetry' $(if ($off.Count) { "not sent: $($off -join ', ')" } elseif (-not $wsOk) { "sends to $ws, not $($arch.workspace)" } else { 'all four categories sent to the workspace' }) 12 'Enable every network category in the setting.'
    }
    $got = @($Collection.Keys)
    $base = @(Get-GsaCall -Area baseline | ForEach-Object id | Where-Object { $_ -notin $got })
    New-GsaFinding 'GSA-ARC-04' $a $(if ($base.Count) { 'Fail' } else { 'Pass' }) 'configuration export' $(if ($base.Count) { "missing: $($base -join ', ')" } else { "all $(@(Get-GsaCall -Area baseline).Count) baseline reads present" }) 2 'Collect with -Area baseline (or all areas) before every change.'
}

function Test-GsaClient {
    <#
    .SYNOPSIS
        The guide's Step 3 checks (GSA-CLI-01 to -06), from the device usage summary and the client records the
        device-side script writes: coverage against the in-scope device count, version, IPv4 preferred, DNS over
        HTTPS off, health Connected, and the hardening values from ring 2 on; client exclusions have an owner and
        an expiry.
    .EXAMPLE
        Test-GsaClient -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'client'; $u = $Collection['device-usage']
    $active = [int](Get-GsaPolicyValue $u @('activeDeviceCount')); $scope = [int]$Settings.inScopeDevices
    $ratio = if ($scope) { [math]::Round($active / $scope, 3) } else { 0 }
    $target = [double]$Settings.targets.clientCoverage
    New-GsaFinding 'GSA-CLI-01' $a $(if ($ratio -ge $target) { 'Pass' } else { 'Fail' }) 'client coverage' "$active active of $scope in-scope devices ($([math]::Round($ratio * 100, 1))%), target $([math]::Round($target * 100))%" 3 'Find the in-scope devices without an active client (Intune install status).'
    $hard = @('HideSignOutButton', 'HideDisablePrivateAccessButton', 'HideDisableButton', 'RestrictNonPrivilegedUsers')
    $ringNo = if ("$($Settings.ring)" -match '(\d+)') { [int]$Matches[1] } else { 1 }
    foreach ($d in $Inputs.clients) {
        $o = "device $($d.device)"
        $v = Compare-GsaVersion $d.clientVersion $Settings.minClientVersion
        New-GsaFinding 'GSA-CLI-02' $a $(if ($v -ge 0) { 'Pass' } else { 'Fail' }) $o "client $($d.clientVersion), minimum $($Settings.minClientVersion)" 3 'Upgrade in rings: a new Intune app for the new version.'
        New-GsaFinding 'GSA-CLI-03' $a $(if ([int]$d.ipv6DisabledComponents -eq 32) { 'Pass' } else { 'Fail' }) $o "DisabledComponents = 0x$('{0:X}' -f [int]$d.ipv6DisabledComponents) (0x20 is IPv4 preferred)" 3 "Reinstall with Learn's installation script, which sets IPv4 preferred."
        $doh = @($d.dohPolicy.Keys | Where-Object { $d.dohPolicy[$_] -ne 'off' })
        New-GsaFinding 'GSA-CLI-04' $a $(if (-not $doh.Count) { 'Pass' } else { 'Fail' }) $o $(if ($doh.Count) { "DNS over HTTPS not off in: $($doh -join ', ')" } else { 'DNS over HTTPS off in Edge and Chrome' }) 3 'Assign the settings catalog profile that sets DNS over HTTPS to Disabled.'
        New-GsaFinding 'GSA-CLI-05' $a $(if ($d.health -eq 'Connected') { 'Pass' } else { 'Fail' }) $o "health: $($d.health)" 3 'Run Advanced diagnostics > Health check and keep the export.'
        $set = @($hard | Where-Object { $d.hardening -and $d.hardening.Contains($_) -and [int]$d.hardening[$_] -eq 1 })
        $st = if ($ringNo -ge 2) { if ($set.Count -eq $hard.Count) { 'Pass' } else { 'Fail' } } else { 'Info' }
        New-GsaFinding 'GSA-CLI-06' $a $st $o "$($set.Count) of 4 hardening values set$(if ($ringNo -lt 2) { '; the guide deploys the remediation from ring 2, not in the pilot' })" 3 "Deploy Learn's remediation script from ring 2."
    }
    foreach ($e in @($Inputs.exceptions | Where-Object { $_.kind -eq 'client-exclusion' })) {
        $ok = $e.owner -and $e.approver -and (Get-GsaDate $e.expires) -gt (Get-GsaDate $AsOf)
        New-GsaFinding 'GSA-CLI-07' $a $(if ($ok) { 'Pass' } else { 'Fail' }) "exclusion $($e.id) $($e.target)" "owner $($e.owner), approver $($e.approver), expires $($e.expires)" 3 'Every client exclusion has an owner, an approver and a review date.'
    }
}

function Get-GsaProfile { param([hashtable]$Collection, [string]$Type) @(Get-GsaList $Collection['forwarding-profiles'] | Where-Object { $_.trafficForwardingType -eq $Type }) | Select-Object -First 1 }

function Test-GsaTraffic {
    <#
    .SYNOPSIS
        The guide's Step 4 checks (GSA-MS-01 to -04): the Microsoft traffic profile is enabled, signaling (source IP
        restoration) is on, the share of sign-ins through the service meets the target, and a profile is enabled
        only for a function the decision records adopt.
    .EXAMPLE
        Test-GsaTraffic -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'traffic'
    $m = Get-GsaProfile $Collection 'm365'
    New-GsaFinding 'GSA-MS-01' $a $(if ($m -and $m.state -eq 'enabled') { 'Pass' } else { 'Fail' }) 'Microsoft traffic profile' "state: $(if ($m) { $m.state } else { 'not found' })" 4 'Enable it (a plan step) and assign the ring group in the portal.'
    $sig = "$(Get-GsaPolicyValue $Collection['ca-signaling'] @('signalingStatus'))"
    New-GsaFinding 'GSA-MS-02' $a $(if ($sig -eq 'enabled') { 'Pass' } else { 'Fail' }) 'signaling' "signalingStatus: $sig" 4 'Enable signaling (a plan step); it is also the compliant network check''s prerequisite.'
    $rows = @(Get-GsaPolicyValue $Collection['law-query'] @('signin-share'))
    $tot = (Get-GsaSum $rows 'Total'); $thr = (Get-GsaSum $rows 'ThroughGSA')
    $share = if ($tot) { [math]::Round($thr / $tot, 3) } else { 0 }
    $target = [double]$Settings.targets.signinShare
    New-GsaFinding 'GSA-MS-03' $a $(if ($share -ge $target) { 'Pass' } else { 'Fail' }) 'sign-ins through the service' "$thr of $tot sign-ins in $($rows.Count) days ($([math]::Round($share * 100, 1))%), target $([math]::Round($target * 100))%" 4 'Find the ring members whose sign-ins aren''t carried (client off, not assigned).'
    $fn = @{ m365 = 'microsoft-traffic'; internet = 'internet'; private = 'private' }
    foreach ($t in 'internet', 'private') {
        $p = Get-GsaProfile $Collection $t
        if (-not $p -or $p.state -ne 'enabled') { continue }
        $d = @($Inputs.decisions | Where-Object { $_.function -eq $fn[$t] -and $_.decision -in 'adopt', 'coexist' -and $_.approved_on })
        New-GsaFinding 'GSA-MS-04' $a $(if ($d.Count) { 'Pass' } else { 'Fail' }) "$t profile" "enabled; approved decision: $(if ($d.Count) { $d[0].decision_id } else { 'none' })" 1 'Disable the profile until its function is decided.'
    }
}

function Test-GsaCompliantNetwork {
    <#
    .SYNOPSIS
        The guide's Step 7 checks (GSA-CN-01 to -07): the compliant network named location exists; the NET-CN policy
        blocks everything outside it, excludes the emergency group and the two Intune applications, doesn't target
        a Private Access app, stays in report-only for 10 business days with no failure carried by the service
        before it is enforced, and signaling is on whenever it is enforced.
    .EXAMPLE
        Test-GsaCompliantNetwork -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'compliant-network'
    $loc = @(Get-GsaList $Collection['named-locations'] | Where-Object { $_['@odata.type'] -eq '#microsoft.graph.compliantNetworkNamedLocation' })
    New-GsaFinding 'GSA-CN-01' $a $(if ($loc.Count) { 'Pass' } else { 'Fail' }) 'named location' $(if ($loc.Count) { "$($loc[0].displayName)" } else { 'no compliant network named location: signaling has never been on' }) 7 'Enable signaling; the location appears when it is turned on.'
    $pols = @(Get-GsaPolicies $Collection 'NET-CN-')
    if (-not $pols.Count) { New-GsaFinding 'GSA-CN-02' $a 'Fail' 'NET-CN policy' 'none' 7 "Create the guide's Step 7.3 policy (a plan step), in report-only."; return }
    $paApps = @(Get-GsaList $Collection['private-apps'] | ForEach-Object { $_.appId })
    $rows = @(Get-GsaPolicyValue $Collection['law-query'] @('cn-report-only'))
    foreach ($p in $pols) {
        $o = $p.displayName
        $block = 'block' -in @(Get-GsaPolicyValue $p @('grantControls', 'builtInControls'))
        $exLoc = @($loc | Where-Object { $_.id -in @(Get-GsaPolicyValue $p @('conditions', 'locations', 'excludeLocations')) }).Count
        New-GsaFinding 'GSA-CN-02' $a $(if ($block -and $exLoc) { 'Pass' } else { 'Fail' }) $o "block: $block; compliant location excluded: $([bool]$exLoc)" 7 'Block all locations except the compliant network location.'
        New-GsaFinding 'GSA-CN-03' $a $(if (Test-GsaExclusion $p $Settings.groups.emergency) { 'Pass' } else { 'Fail' }) $o 'emergency access group excluded' 7 'Exclude the emergency access group.'
        $exApps = @(Get-GsaPolicyValue $p @('conditions', 'applications', 'excludeApplications'))
        $intune = @($Settings.apps.intuneEnrollment, $Settings.apps.intune | Where-Object { $_ -notin $exApps })
        New-GsaFinding 'GSA-CN-04' $a $(if (-not $intune.Count) { 'Pass' } else { 'Fail' }) $o $(if ($intune.Count) { 'Microsoft Intune Enrollment or Microsoft Intune not excluded' } else { 'both Intune applications excluded' }) 7 'Exclude both, as Learn says, to avoid a circular dependency at enrollment.'
        $inc = @(Get-GsaPolicyValue $p @('conditions', 'applications', 'includeApplications') | Where-Object { $_ -in $paApps })
        New-GsaFinding 'GSA-CN-05' $a $(if (-not $inc.Count) { 'Pass' } else { 'Fail' }) $o $(if ($inc.Count) { 'targets a Private Access app; the check isn''t supported there' } else { 'no Private Access app targeted' }) 7 'Target Private Access apps with Step 6''s per-app policies.'
        $since = if ($p.Contains('createdDateTime') -and $p.createdDateTime) { $p.createdDateTime } else { $null }
        $days = if ($since) { Get-GsaBusinessDays -From $since -To $AsOf } else { 0 }
        $defects = [int]((Get-GsaSum @($rows | Where-Object { "$($_.Result)" -eq 'reportOnlyFailure' -and "$($_.Through)" -eq 'true' }) 'count_'))
        if ($p.state -eq $script:ReportOnly) {
            $ready = $days -ge 10 -and -not $defects
            New-GsaFinding 'GSA-CN-06' $a $(if ($ready) { 'Pass' } else { 'Info' }) $o "report-only for $days business days; $defects failures carried by the service$(if (-not $ready) { ': not ready to enforce' } else { ': ready to enforce' })" 7 'A failure with Through == true is a defect to fix before enforcement.'
        } elseif ($p.state -eq 'enabled') {
            $sig = "$(Get-GsaPolicyValue $Collection['ca-signaling'] @('signalingStatus'))"
            New-GsaFinding 'GSA-CN-07' $a $(if ($sig -eq 'enabled') { 'Pass' } else { 'Fail' }) $o "enforced; signaling $sig" 7 'Signaling off with the policy on blocks users: report-only first, signaling last.'
        }
    }
}

function Test-GsaTenantRestrictions {
    <#
    .SYNOPSIS
        The guide's Step 8 checks (GSA-TR-01 to -04): the TRv2 default blocks all users and applications; each
        partner allowance is in the exception register with an owner and a review date; tagging is on only with
        a blocking default; and the block query's resource tenants are listed for review.
    .EXAMPLE
        Test-GsaTenantRestrictions -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'tenant-restrictions'
    $tr = Get-GsaPolicyValue $Collection['trv2-default'] @('tenantRestrictions')
    $ub = Get-GsaPolicyValue $tr @('usersAndGroups', 'accessType'); $ab = Get-GsaPolicyValue $tr @('applications', 'accessType')
    $blocked = $ub -eq 'blocked' -and $ab -eq 'blocked'
    New-GsaFinding 'GSA-TR-01' $a $(if ($blocked) { 'Pass' } else { 'Fail' }) 'TRv2 default' "users: $ub; applications: $ab" 8 'Set the default to block, with partner policies for allowed tenants (Book 04, Appendix C).'
    $reg = @($Inputs.exceptions | Where-Object { $_.kind -eq 'trv2-partner' })
    foreach ($pt in (Get-GsaList $Collection['trv2-partners'])) {
        if (-not (Get-GsaPolicyValue $pt @('tenantRestrictions'))) { continue }
        $e = @($reg | Where-Object { $_.target -eq $pt.tenantId })
        $ok = $e.Count -and $e[0].owner -and (Get-GsaDate $e[0].expires) -gt (Get-GsaDate $AsOf)
        New-GsaFinding 'GSA-TR-02' $a $(if ($ok) { 'Pass' } else { 'Fail' }) "partner $($pt.tenantId)" $(if ($e.Count) { "register $($e[0].id), owner $($e[0].owner), review $($e[0].expires)" } else { 'allowed by TRv2 but not in the exception register' }) 8 'Record the allowance with an owner and a review date, or remove it.'
    }
    $tag = "$(Get-GsaPolicyValue $Collection['tenant-tagging'] @('networkPacketTaggingStatus'))"
    New-GsaFinding 'GSA-TR-03' $a $(if ($tag -ne 'enabled' -or $blocked) { 'Pass' } else { 'Fail' }) 'tagging' "networkPacketTaggingStatus: $tag; TRv2 default blocking: $blocked" 8 'Tagging enforces the TRv2 policy: set the policy first.'
    $blocks = @(Get-GsaPolicyValue $Collection['law-query'] @('trv2-blocks'))
    $known = @($reg | ForEach-Object target)
    foreach ($b in $blocks) {
        New-GsaFinding 'GSA-TR-04' $a 'Info' "resource tenant $($b.ResourceTenantId)" "$($b.Blocked) blocks ($($b.AppDisplayName))$(if ($b.ResourceTenantId -notin $known) { '; not a registered partner: review weekly' })" 8 'Review new tenants with the partner register.'
    }
}

function Get-GsaSegmentHost {
    param($Segment)
    "$($Segment.destinationHost)"
}

function Test-GsaPortRange {
    param([string[]]$Ports, [int]$Port)
    foreach ($r in $Ports) { $p = "$r" -split '-'; $lo = [int]$p[0]; $hi = if ($p.Count -gt 1) { [int]$p[1] } else { $lo }; if ($Port -ge $lo -and $Port -le $hi) { return $true } }
    $false
}

function Test-GsaPrivateAccess {
    <#
    .SYNOPSIS
        The guide's Steps 6 and 10 checks (GSA-PA-01 to -09): two or more active connectors on a current version
        per group; segments that are one host and its ports, not a range of addresses or every port, and don't
        overlap; Quick Access shrinking to nothing; each app assigned to a group; each app under a NET-PA
        Conditional Access policy that excludes the emergency group; and administrative apps (RDP, SSH) requiring
        the phishing-resistant strength and a compliant device.
    .EXAMPLE
        Test-GsaPrivateAccess -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'private-access'
    $members = $Collection['connector-group-members']
    foreach ($g in (Get-GsaList $Collection['connector-groups'])) {
        $cs = @(Get-GsaList $members[$g.id])
        $act = @($cs | Where-Object { $_.status -eq 'active' })
        New-GsaFinding 'GSA-PA-01' $a $(if ($act.Count -ge 2) { 'Pass' } else { 'Fail' }) "connector group $($g.name)" "$($act.Count) of $($cs.Count) connectors active" 6 'Keep at least two healthy connectors per group.'
        $old = @($cs | Where-Object { (Compare-GsaVersion $_.version $Settings.minConnectorVersion) -lt 0 })
        New-GsaFinding 'GSA-PA-02' $a $(if (-not $old.Count) { 'Pass' } else { 'Fail' }) "connector group $($g.name)" $(if ($old.Count) { "below $($Settings.minConnectorVersion): $(@($old | ForEach-Object { "$($_.machineName) $($_.version)" }) -join ', ')" } else { "every connector at $($Settings.minConnectorVersion) or later" }) 6 'Update the connector (a maintenance group keeps the apps up while one host patches).'
    }
    $apps = @(Get-GsaList $Collection['private-apps'])
    $seen = @{}
    foreach ($app in $apps) {
        $o = "app $($app.displayName)"
        if ($app.kind -eq 'quickAccess') {
            $n = @($app.segments).Count
            New-GsaFinding 'GSA-PA-03' $a $(if ($n -eq 0) { 'Pass' } else { 'Warn' }) 'Quick Access' "$n segments left in Quick Access" 6 'Move each into its own app from application discovery; the residual target is zero.'
            continue
        }
        foreach ($s in @($app.segments)) {
            $h = Get-GsaSegmentHost $s
            $wide = ($s.destinationType -ne 'fqdn' -and $h -match '/(\d+)$' -and [int]$Matches[1] -lt 24) -or (@($s.ports) -contains '1-65535')
            New-GsaFinding 'GSA-PA-04' $a $(if (-not $wide) { 'Pass' } else { 'Fail' }) $o "segment $h ports $(@($s.ports) -join ',')" 6 'Publish only the hosts and ports the application uses.'
            $key = "$h|$(@($s.ports) -join ',')"
            if ($seen.Contains($key)) { New-GsaFinding 'GSA-PA-05' $a 'Fail' $o "segment $h overlaps $($seen[$key])" 6 'Segments may not overlap between per-app applications.' } else { $seen[$key] = $app.displayName }
        }
        $grp = @($app.assignments | Where-Object { $_.principalType -eq 'Group' })
        $usr = @($app.assignments | Where-Object { $_.principalType -ne 'Group' })
        New-GsaFinding 'GSA-PA-06' $a $(if ($grp.Count -and -not $usr.Count) { 'Pass' } else { 'Fail' }) $o "$($grp.Count) group and $($usr.Count) direct assignments" 6 'Assign a group, not individuals (nested groups aren''t supported).'
        $pols = @(Get-GsaPolicies $Collection 'NET-PA-' | Where-Object { $app.appId -in @(Get-GsaPolicyValue $_ @('conditions', 'applications', 'includeApplications')) })
        if (-not $pols.Count) { New-GsaFinding 'GSA-PA-07' $a 'Fail' $o 'no NET-PA Conditional Access policy targets it' 6 "Create the guide's Step 6.5 policy, in report-only."; continue }
        foreach ($p in $pols) {
            New-GsaFinding 'GSA-PA-07' $a $(if (Test-GsaExclusion $p $Settings.groups.emergency) { 'Pass' } else { 'Fail' }) $o "$($p.displayName) ($($p.state)): emergency group $(if (Test-GsaExclusion $p $Settings.groups.emergency) { 'excluded' } else { 'NOT excluded' })" 6 'Exclude the emergency access group from every policy.'
            $admin = @($app.segments | Where-Object { $s = $_; @($script:AdminPorts | Where-Object { Test-GsaPortRange -Ports @($s.ports) -Port $_ }).Count }).Count
            if ($admin) {
                $str = Get-GsaPolicyValue $p @('grantControls', 'authenticationStrength', 'id')
                $dev = 'compliantDevice' -in @(Get-GsaPolicyValue $p @('grantControls', 'builtInControls'))
                New-GsaFinding 'GSA-PA-08' $a $(if ($str -eq $script:PhishStrength -and $dev) { 'Pass' } else { 'Fail' }) $o "administrative path: phishing-resistant strength $(if ($str -eq $script:PhishStrength) { 'required' } else { 'NOT required' }); compliant device $(if ($dev) { 'required' } else { 'NOT required' })" 10 "Require strength $($script:PhishStrength) and a compliant device (the guide's Step 10.2)."
            }
        }
    }
    $sess = @(Get-GsaPolicyValue $Collection['law-query'] @('private-sessions'))
    New-GsaFinding 'GSA-PA-09' $a 'Info' 'private traffic' "$((Get-GsaSum $sess 'Sessions')) sessions to $(@($sess | ForEach-Object DestinationFqdn | Sort-Object -Unique).Count) destinations in 24 hours" 6 'Compare with each application''s assignment; an unexpected destination is a segment to review.'
}

function Test-GsaException {
    param($Row, [string]$AsOf)
    $exp = Get-GsaDate $Row.expires
    @{ Ok = ($Row.owner -and $Row.approver -and $exp -and $exp -gt (Get-GsaDate $AsOf)); Expired = ($exp -and $exp -le (Get-GsaDate $AsOf)) }
}

function Test-GsaInternetAccess {
    <#
    .SYNOPSIS
        The guide's Step 5 checks (GSA-IA-01 to -06): each NET-IA policy links an existing security profile and
        excludes the emergency group; the high-risk categories the settings name are blocked; every custom bypass
        is in the exception register with an owner, an approver and an unexpired date; QUIC is blocked by the
        interim path while the cloud firewall for clients is a preview whose GCC availability isn't specified; and
        the tenant is inside Learn's limits.
    .EXAMPLE
        Test-GsaInternetAccess -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'internet-access'
    $profiles = @(Get-GsaList $Collection['filtering-profiles'])
    foreach ($p in (Get-GsaPolicies $Collection 'NET-IA-')) {
        $pid_ = Get-GsaPolicyValue $p @('sessionControls', 'globalSecureAccessFilteringProfile', 'profileId')
        $sp = @($profiles | Where-Object { $_.id -eq $pid_ })
        $ok = $sp.Count -and (Test-GsaExclusion $p $Settings.groups.emergency)
        New-GsaFinding 'GSA-IA-01' $a $(if ($ok) { 'Pass' } else { 'Fail' }) $p.displayName "security profile: $(if ($sp.Count) { $sp[0].name } else { 'not found' }); emergency group excluded: $(Test-GsaExclusion $p $Settings.groups.emergency)" 5 'Link an existing profile and exclude the emergency group.'
    }
    $blockedCats = @(Get-GsaList $Collection['filtering-policies'] | Where-Object { $_.action -eq 'block' } | ForEach-Object { @($_.policyRules) } | ForEach-Object { @($_.destinations) } | ForEach-Object { $_.name })
    $miss = @($Settings.highRiskCategories | Where-Object { $_ -notin $blockedCats })
    New-GsaFinding 'GSA-IA-02' $a $(if (-not $miss.Count) { 'Pass' } else { 'Fail' }) 'web content filtering' $(if ($miss.Count) { "not blocked: $($miss -join ', ')" } else { "blocked: $(@($Settings.highRiskCategories) -join ', ')" }) 5 'Block the categories the acceptable-use policy names.'
    $ti = @(Get-GsaList $Collection['filtering-policies'] | Where-Object { @($_.policyRules | Where-Object { $_.ruleType -eq 'threatIntelligence' }).Count })
    New-GsaFinding 'GSA-IA-03' $a $(if ($ti.Count) { 'Pass' } else { 'Fail' }) 'threat intelligence' $(if ($ti.Count) { "policy $($ti[0].name)" } else { 'no threat intelligence filtering policy' }) 5 'Turn on threat intelligence filtering; move it to the baseline profile at ring 1.'
    foreach ($e in @($Inputs.exceptions | Where-Object { $_.kind -eq 'custom-bypass' })) {
        $t = Test-GsaException $e $AsOf
        New-GsaFinding 'GSA-IA-04' $a $(if ($t.Ok) { 'Pass' } else { 'Fail' }) "bypass $($e.id) $($e.target)" "owner $($e.owner), approver $(if ($e.approver) { $e.approver } else { 'none' }), expires $($e.expires)$(if ($t.Expired) { ' (expired)' })" 5 'Every bypass has an owner approval, a reason and an expiry.'
    }
    $cf = @((Read-GsaJson -Path (Join-Path $script:ConfigRoot 'availability.json')).features | Where-Object { $_.id -eq 'cloud-firewall-clients' })[0]
    $q = $Inputs.architecture.quicBlock
    $ok = $q -and $q.method
    New-GsaFinding 'GSA-IA-05' $a $(if ($ok) { 'Pass' } else { 'Fail' }) 'QUIC' "cloud firewall for clients: GCC $($cf.gcc) ($($cf.status)); interim block: $(if ($ok) { "$($q.method) $($q.profile), assigned to $($q.assignedTo)" } else { 'none recorded' })" 5 "Interim path: $($cf.interim)"
    $np = $profiles.Count; $npol = @(Get-GsaList $Collection['filtering-policies']).Count
    New-GsaFinding 'GSA-IA-06' $a $(if ($np -le 256 -and $npol -le 1000) { 'Pass' } else { 'Fail' }) 'limits' "$np security profiles (limit 256), $npol filtering policies (limit 1,000)" 5 'Learn''s limits per tenant.'
}

function Test-GsaTls {
    <#
    .SYNOPSIS
        The guide's Step 9 checks (GSA-TLS-01 to -06), from the TLS record the platform owner exports and the
        traffic query: the certificate has more than 90 days left and was valid for at least six months; it isn't
        from an authentication CA; the policy is linked only to non-baseline profiles before ring 3; the privacy
        approval and user notice precede it; every custom bypass is registered; and the failure share is under 1%.
    .EXAMPLE
        Test-GsaTls -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'tls'; $t = $Inputs.tls; $now = Get-GsaDate $AsOf
    if (-not $t -or -not $t.Contains('certificate')) { New-GsaFinding 'GSA-TLS-01' $a 'Info' 'TLS inspection' 'no TLS record: inspection not configured' 9 'Step 9 comes after Step 5 works on server names.'; return }
    $c = $t.certificate; $nb = Get-GsaDate $c.notBefore; $na = Get-GsaDate $c.notAfter
    $left = [int]($na - $now).TotalDays; $life = [int]($na - $nb).TotalDays
    New-GsaFinding 'GSA-TLS-01' $a $(if ($left -gt 90 -and $life -ge 182) { 'Pass' } else { 'Fail' }) "certificate $($c.name)" "$left days left (renew 90 days ahead); valid for $life days in all (Learn: at least six months)" 9 'Roll the certificate: deploy trust, then upload and enable the new one.'
    New-GsaFinding 'GSA-TLS-02' $a $(if ("$($c.issuer)" -notin @($Settings.authenticationCas)) { 'Pass' } else { 'Fail' }) "certificate $($c.name)" "issuer: $($c.issuer)" 9 'Issue from a dedicated CA, never the CA that issues authentication certificates.'
    $ringNo = if ("$($Settings.ring)" -match '(\d+)') { [int]$Matches[1] } else { 1 }
    $baseline = @(Get-GsaList $Collection['filtering-profiles'] | Where-Object { $_.priority -ge 65000 } | ForEach-Object name)
    foreach ($p in @($t.policies)) {
        $onBase = @(@($p.linkedProfiles) | Where-Object { $_ -in $baseline })
        New-GsaFinding 'GSA-TLS-03' $a $(if (-not $onBase.Count -or $ringNo -ge 3) { 'Pass' } else { 'Fail' }) "policy $($p.name)" "linked to: $(@($p.linkedProfiles) -join ', ')" 9 'Link to the ring''s security profile; never the baseline profile before ring 3.'
        foreach ($b in @($p.customBypass)) {
            $e = @($Inputs.exceptions | Where-Object { $_.kind -eq 'custom-bypass' -and $_.target -eq $b })
            $ok = $e.Count -and (Test-GsaException $e[0] $AsOf).Ok
            New-GsaFinding 'GSA-TLS-05' $a $(if ($ok) { 'Pass' } else { 'Fail' }) "policy $($p.name)" "custom bypass $b $(if ($e.Count) { "is $($e[0].id), expires $($e[0].expires)" } else { 'is not in the register' })" 9 'Register each custom bypass with an expiry; don''t duplicate the system bypass.'
        }
    }
    $pv = $t.privacy
    $ok = $pv -and $pv.approvedOn -and $pv.userNoticeSentOn
    New-GsaFinding 'GSA-TLS-04' $a $(if ($ok) { 'Pass' } else { 'Fail' }) 'privacy' "approved $($pv.approvedOn) by $($pv.approver); user notice $($pv.userNoticeSentOn)" 9 'The privacy officer approves the scope, and users are told, before inspection is on.'
    $rows = @(Get-GsaPolicyValue $Collection['law-query'] @('tls-outcomes'))
    $tot = (Get-GsaSum $rows 'Count')
    $fail = (Get-GsaSum @($rows | Where-Object { "$($_.TlsStatus)" -eq 'Failure' }) 'Count')
    $share = if ($tot) { [math]::Round(100.0 * $fail / $tot, 2) } else { 0 }
    New-GsaFinding 'GSA-TLS-06' $a $(if ($share -lt 1) { 'Pass' } else { 'Fail' }) 'TLS outcomes' "failure share $share% of $tot inspected or bypassed sessions (threshold 1%)" 9 'Find the failing destinations; pinned applications get a registered bypass.'
}

function Test-GsaTelemetry {
    <#
    .SYNOPSIS
        The guide's Step 12 checks (GSA-LOG-01 to -03): the diagnostic setting sends all four categories, every
        network table has rows from the last 24 hours, and the CISA telemetry path is agreed with the TIC
        delegates before the VPN's web path is retired.
    .EXAMPLE
        Test-GsaTelemetry -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $a = 'telemetry'; $now = Get-GsaDate $AsOf
    @(Test-GsaBaseline -Collection $Collection -Inputs $Inputs -Settings $Settings -AsOf $AsOf | Where-Object Id -EQ 'GSA-LOG-01') | ForEach-Object { $_.Area = $a; $_ }
    $rows = @(Get-GsaPolicyValue $Collection['law-query'] @('freshness'))
    foreach ($tb in 'NetworkAccessTraffic', 'NetworkAccessConnectionEvents', 'RemoteNetworkHealthLogs', 'NetworkAccessAlerts') {
        $r = @($rows | Where-Object { $_.Table -eq $tb })
        $age = if ($r.Count) { [math]::Round(($now - (Get-GsaDate $r[0].Last)).TotalHours, 1) } else { -1 }
        $st = if ($r.Count -and $age -le 24) { 'Pass' } elseif ($tb -in 'NetworkAccessAlerts', 'RemoteNetworkHealthLogs') { 'Warn' } else { 'Fail' }
        New-GsaFinding 'GSA-LOG-02' $a $st "table $tb" $(if ($r.Count) { "$($r[0].Rows) rows; last $($r[0].Last) ($age hours before the run)" } else { 'no rows in the last day' }) 12 'A table with no rows is an alert: offboarding, a disabled profile or an outage (Learn).'
    }
    $c = $Inputs.architecture.cisaTelemetry
    New-GsaFinding 'GSA-LOG-03' $a $(if ($c -and $c.agreedOn) { 'Pass' } else { 'Warn' }) 'CISA telemetry' $(if ($c -and $c.agreedOn) { "agreed $($c.agreedOn): $($c.path)" } else { 'not yet agreed with the TIC delegates: required before the VPN''s web path is retired (ring 3)' }) 12 "Record the path with the TIC delegates (the guide's Step 12.3)."
}

function Invoke-GsaChecks {
    <#
    .SYNOPSIS
        Runs the checks for one or more areas on a collection and an inputs folder, and writes findings.json,
        findings.csv and a manifest. Returns the findings.
    .EXAMPLE
        Invoke-GsaChecks -Area decision -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -Settings $s -OutputPath out/check-decision -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('decision', 'baseline', 'client', 'traffic', 'compliant-network', 'tenant-restrictions', 'private-access', 'internet-access', 'tls', 'telemetry')][string[]]$Area,
        [Parameter(Mandatory)][string]$CollectionPath, [Parameter(Mandatory)][string]$InputsPath, [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
    $AsOf = ConvertTo-GsaUtc $AsOf
    $c = Read-GsaCollection -Path $CollectionPath
    $i = Read-GsaInputs -Path $InputsPath
    $fn = @{ decision = 'Test-GsaDecision'; baseline = 'Test-GsaBaseline'; client = 'Test-GsaClient'; traffic = 'Test-GsaTraffic'; 'compliant-network' = 'Test-GsaCompliantNetwork'
        'tenant-restrictions' = 'Test-GsaTenantRestrictions'; 'private-access' = 'Test-GsaPrivateAccess'; 'internet-access' = 'Test-GsaInternetAccess'; tls = 'Test-GsaTls'; telemetry = 'Test-GsaTelemetry' }
    $all = @(foreach ($ar in $Area) { & $fn[$ar] -Collection $c -Inputs $i -Settings $Settings -AsOf $AsOf })
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-GsaJson -Path (Join-Path $OutputPath 'findings.json') -Value @{ asOf = $AsOf; areas = @($Area); collection = (Get-GsaFileHash -Path (Join-Path $CollectionPath 'manifest.json')); findings = $all }
    $csv = ($all | ConvertTo-Csv -NoTypeInformation) -join "`n"
    Write-GsaText -Path (Join-Path $OutputPath 'findings.csv') -Text ($csv + "`n")
    $cm = Read-GsaJson -Path (Join-Path $CollectionPath 'manifest.json')
    $null = Write-GsaManifest -OutputPath $OutputPath -Task 'check' -AsOf $AsOf -Mode $cm.mode -Settings $Settings -Extra @{ areas = @($Area); collectionManifestSha256 = (Get-GsaFileHash -Path (Join-Path $CollectionPath 'manifest.json')); failed = @($all | Where-Object Status -EQ 'Fail').Count }
    $all
}

# ----------------------------------------------------------------------------- plans

function Resolve-GsaPlaceholder {
    param([Parameter(Mandatory)][string]$Text, [hashtable]$Settings, [hashtable]$Collection)
    $map = @{ '<pilot-group-id>' = $Settings.groups.pilot; '<emergency-group-id>' = $Settings.groups.emergency; '<admin-group-id>' = $Settings.groups.admins
        '<intune-enrollment-app-id>' = $Settings.apps.intuneEnrollment; '<intune-app-id>' = $Settings.apps.intune }
    $loc = @(Get-GsaList $Collection['named-locations'] | Where-Object { $_['@odata.type'] -eq '#microsoft.graph.compliantNetworkNamedLocation' })
    if ($loc.Count) { $map['<compliant-location-id>'] = $loc[0].id }
    $sp = @(Get-GsaList $Collection['filtering-profiles'] | Where-Object { $_.name -eq $Settings.securityProfile })
    if ($sp.Count) { $map['<security-profile-id>'] = $sp[0].id }
    foreach ($k in $map.Keys) { if ($map[$k]) { $Text = $Text.Replace($k, "$($map[$k])") } }
    foreach ($m in [regex]::Matches($Text, '<app-id:([^>]+)>')) {
        $app = @(Get-GsaList $Collection['private-apps'] | Where-Object { $_.displayName -eq $m.Groups[1].Value })
        if ($app.Count) { $Text = $Text.Replace($m.Value, $app[0].appId) }
    }
    $Text
}

function ConvertTo-GsaPolicyShape {
    # The parts of a Conditional Access policy the plan compares, as sorted, compact JSON.
    param($Policy)
    $g = { param($p) @(Get-GsaPolicyValue $Policy $p | Where-Object { $_ } | ForEach-Object { "$_" } | Sort-Object) }
    [ordered]@{
        includeGroups = & $g @('conditions', 'users', 'includeGroups'); excludeGroups = & $g @('conditions', 'users', 'excludeGroups')
        includeApplications = & $g @('conditions', 'applications', 'includeApplications'); excludeApplications = & $g @('conditions', 'applications', 'excludeApplications')
        includeLocations = & $g @('conditions', 'locations', 'includeLocations'); excludeLocations = & $g @('conditions', 'locations', 'excludeLocations')
        operator = "$(Get-GsaPolicyValue $Policy @('grantControls', 'operator'))"; builtInControls = & $g @('grantControls', 'builtInControls')
        strength = "$(Get-GsaPolicyValue $Policy @('grantControls', 'authenticationStrength', 'id'))"
        profile = "$(Get-GsaPolicyValue $Policy @('sessionControls', 'globalSecureAccessFilteringProfile', 'profileId'))"
    } | ConvertTo-Json -Compress -Depth 5
}

function New-GsaPlan {
    <#
    .SYNOPSIS
        Compares a desired-state file (config/desired.*.json) with a collection and writes plan.json: the Graph
        requests that would close the gap, in a safe order (signaling and profiles before the policies that need
        them; tagging after the TRv2 default blocks), each with its call ID, method, URI and body. A new
        Conditional Access policy is created report-only unless it carries a Global Secure Access security
        profile (the guide pilots those with a group-scoped On policy); enforcing an existing report-only policy
        needs -AllowEnforce. Unresolved placeholders, and a policy that doesn't exclude the emergency group,
        stop the plan. Portal-only steps are listed as manual. Prints nothing and changes nothing.
    .EXAMPLE
        New-GsaPlan -CollectionPath out/pilot -DesiredPath config/desired.lab.json -Settings $s -OutputPath out/plan -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CollectionPath, [Parameter(Mandatory)][string]$DesiredPath, [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [switch]$AllowEnforce)
    $AsOf = ConvertTo-GsaUtc $AsOf
    $c = Read-GsaCollection -Path $CollectionPath
    $d = Read-GsaJson -Path $DesiredPath
    $root = Split-Path -Parent (Resolve-Path -LiteralPath $DesiredPath).Path
    $steps = [Collections.Generic.List[object]]::new(); $manual = [Collections.Generic.List[object]]::new()
    $add = { param($call, $method, $uri, $body, $why) $steps.Add([ordered]@{ id = ('PL-{0:d2}' -f ($steps.Count + 1)); call = $call; method = $method; uri = $uri; body = $body; why = $why }) }
    $graph = (Get-GsaCloud -Cloud $Settings.cloud).Graph
    $sig = "$(Get-GsaPolicyValue $c['ca-signaling'] @('signalingStatus'))"
    if ($d.signalingStatus -and $d.signalingStatus -ne $sig) { & $add 'signaling' 'PATCH' "$graph/beta/networkAccess/settings/conditionalAccess" @{ signalingStatus = $d.signalingStatus } "signalingStatus $sig -> $($d.signalingStatus)" }
    foreach ($t in 'm365', 'private', 'internet') {
        if (-not $d.forwardingProfiles.Contains($t)) { continue }
        $p = Get-GsaProfile $c $t
        if (-not $p) { throw "No $t forwarding profile in the collection." }
        if ($p.state -ne $d.forwardingProfiles[$t]) { & $add 'profile-state' 'PATCH' "$graph/beta/networkAccess/forwardingProfiles/$($p.id)" @{ state = $d.forwardingProfiles[$t] } "$t profile $($p.state) -> $($d.forwardingProfiles[$t])" }
    }
    $existing = @{}; foreach ($p in (Get-GsaList $c['ca-policies'])) { $existing[$p.displayName] = $p }
    foreach ($rel in @($d.conditionalAccess)) {
        $text = Resolve-GsaPlaceholder -Text ([IO.File]::ReadAllText((Join-Path $root $rel))) -Settings $Settings -Collection $c
        $left = @([regex]::Matches($text, '<[a-z][a-z0-9:-]*[^>]*>') | ForEach-Object Value)
        if ($left.Count) { throw "$rel has unresolved placeholders: $($left -join ', ')" }
        $pol = ConvertFrom-GsaJsonText -Text $text
        if (-not (Test-GsaExclusion $pol $Settings.groups.emergency)) { throw "$rel doesn't exclude the emergency access group; the kit won't plan it." }
        $session = [bool](Get-GsaPolicyValue $pol @('sessionControls', 'globalSecureAccessFilteringProfile'))
        $cur = $existing[$pol.displayName]
        if (-not $cur) {
            if (-not $session -and $pol.state -ne $script:ReportOnly -and -not $AllowEnforce) { $pol.state = $script:ReportOnly }
            $uri = if ($session) { "$graph/beta/identity/conditionalAccess/policies" } else { "$graph/v1.0/identity/conditionalAccess/policies" }
            & $add 'ca-create' 'POST' $uri $pol "create $($pol.displayName) ($($pol.state))"
        } else {
            $want = ConvertTo-GsaPolicyShape $pol; $have = ConvertTo-GsaPolicyShape $cur
            if ($want -ne $have) {
                $body = [ordered]@{ conditions = $pol.conditions }
                foreach ($k in 'grantControls', 'sessionControls') { if ($pol.Contains($k)) { $body[$k] = $pol[$k] } }
                $base = if ($session) { "$graph/beta" } else { "$graph/v1.0" }
                & $add 'ca-update' 'PATCH' "$base/identity/conditionalAccess/policies/$($cur.id)" $body "$($pol.displayName): conditions or controls differ from the reviewed file"
            }
            if ($cur.state -ne $pol.state) {
                if ($pol.state -eq 'enabled' -and $cur.state -eq $script:ReportOnly -and -not $AllowEnforce) {
                    $manual.Add([ordered]@{ id = 'MAN-ENF'; what = "$($pol.displayName) stays report-only: enforcing it needs -AllowEnforce after its report-only results are clean" })
                } else { & $add 'ca-update' 'PATCH' "$graph/v1.0/identity/conditionalAccess/policies/$($cur.id)" @{ state = $pol.state } "$($pol.displayName) $($cur.state) -> $($pol.state)" }
            }
        }
    }
    $tag = "$(Get-GsaPolicyValue $c['tenant-tagging'] @('networkPacketTaggingStatus'))"
    if ($d.networkPacketTaggingStatus -and $d.networkPacketTaggingStatus -ne $tag) {
        $tr = Get-GsaPolicyValue $c['trv2-default'] @('tenantRestrictions', 'usersAndGroups', 'accessType')
        if ($d.networkPacketTaggingStatus -eq 'enabled' -and $tr -ne 'blocked') { throw 'Tagging would enforce a TRv2 default that does not block: set the TRv2 policy first (the guide''s Step 8.1).' }
        & $add 'tagging' 'PATCH' "$graph/beta/networkAccess/settings/crossTenantAccess" @{ networkPacketTaggingStatus = $d.networkPacketTaggingStatus } "networkPacketTaggingStatus $tag -> $($d.networkPacketTaggingStatus)"
    }
    foreach ($as in @($d.profileAssignments)) {
        $grp = Resolve-GsaPlaceholder -Text $as.group -Settings $Settings -Collection $c
        $manual.Add([ordered]@{ id = 'MAN-ASSIGN'; what = "Portal: Global Secure Access > Connect > Traffic forwarding > $($as.profile) profile > User and group assignments: add $grp (no Graph request on the pages read)" })
    }
    $plan = [ordered]@{ schema = 'fmp-gsa-plan/1'; asOf = $AsOf; environment = $Settings.environment; tenantId = $Settings.tenantId; ring = $d.ring
        desired = (Get-GsaFileHash -Path $DesiredPath); collectionManifestSha256 = (Get-GsaFileHash -Path (Join-Path $CollectionPath 'manifest.json'))
        allowEnforce = [bool]$AllowEnforce; steps = $steps.ToArray(); manual = $manual.ToArray() }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    Write-GsaJson -Path (Join-Path $OutputPath 'plan.json') -Value $plan
    Get-Item -LiteralPath (Join-Path $OutputPath 'plan.json')
}

function Invoke-GsaPlanSteps {
    <#
    .SYNOPSIS
        Runs a plan's steps, or (without -Apply) lists them as WouldApply. With -Apply it refuses unless the
        invoker is live and -ApprovedSha256 equals the plan file's SHA-256, then sends each step in order and
        stops at the first error. Returns one result per step.
    .EXAMPLE
        Invoke-GsaPlanSteps -PlanPath out/plan/plan.json -Invoker $inv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, $Invoker, [switch]$Apply, [string]$ApprovedSha256)
    $plan = Read-GsaJson -Path $PlanPath
    $sha = Get-GsaFileHash -Path $PlanPath
    if ($Apply) {
        if (-not $Invoker -or $Invoker.Mode -ne 'Live') { throw 'Refused: -Apply runs only with a live invoker; fixture mode never changes anything.' }
        if ($ApprovedSha256 -ne $sha) { throw "Refused: the approved SHA-256 doesn't match the plan ($sha)." }
        if (-not $Invoker.Checked) { Assert-GsaLiveContext -Settings $Invoker.Settings; $Invoker.Checked = $true }
    }
    $results = [Collections.Generic.List[object]]::new(); $stop = $false
    foreach ($s in @($plan.steps)) {
        $null = Get-GsaCall -Id $s.call
        if (-not $Apply) { $results.Add([pscustomobject][ordered]@{ Id = $s.id; Status = 'WouldApply'; Detail = "$($s.method) $($s.why)" }); continue }
        if ($stop) { $results.Add([pscustomobject][ordered]@{ Id = $s.id; Status = 'Skipped'; Detail = 'an earlier step failed' }); continue }
        try { $null = & $script:GraphRunner $s.method $s.uri $s.body; $results.Add([pscustomobject][ordered]@{ Id = $s.id; Status = 'Applied'; Detail = $s.why }) }
        catch { $stop = $true; $results.Add([pscustomobject][ordered]@{ Id = $s.id; Status = 'Error'; Detail = $_.Exception.Message }) }
    }
    foreach ($m in @($plan.manual)) { $results.Add([pscustomobject][ordered]@{ Id = $m.id; Status = 'Manual'; Detail = $m.what }) }
    $results.ToArray()
}

function New-GsaRollbackPlan {
    <#
    .SYNOPSIS
        Writes the rollback plan in the guide's order, from a collection: the NET- Conditional Access policies
        that are enforced go to report-only (Steps 10, 7, 6 and 5's policies, in that order); the security
        profile links are removed (a portal step: no request on the pages read); tagging is disabled; the ring's
        groups come off the profile assignments (portal); the VPN route is restored (the agency's own change);
        and signaling is disabled last, only with -DisableSignaling, and only when no policy still depends on it.
    .EXAMPLE
        New-GsaRollbackPlan -CollectionPath out/pilot -Settings $s -OutputPath out/rollback -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CollectionPath, [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [switch]$DisableSignaling)
    $AsOf = ConvertTo-GsaUtc $AsOf
    $c = Read-GsaCollection -Path $CollectionPath
    $graph = (Get-GsaCloud -Cloud $Settings.cloud).Graph
    $steps = [Collections.Generic.List[object]]::new(); $manual = [Collections.Generic.List[object]]::new()
    $order = @(@{ p = 'NET-PA-Admin'; step = 10 }, @{ p = 'NET-CN-'; step = 7 }, @{ p = 'NET-PA-'; step = 6 }, @{ p = 'NET-IA-'; step = 5 })
    $done = @{}
    foreach ($o in $order) {
        foreach ($p in (Get-GsaPolicies $c $o.p | Sort-Object { $_.displayName })) {
            if ($done.Contains($p.id) -or $p.state -ne 'enabled') { continue }
            $done[$p.id] = $true
            $steps.Add([ordered]@{ id = ('RB-{0:d2}' -f ($steps.Count + 1)); call = 'ca-update'; method = 'PATCH'; uri = "$graph/v1.0/identity/conditionalAccess/policies/$($p.id)"; body = @{ state = $script:ReportOnly }; why = "Step $($o.step): $($p.displayName) enabled -> report-only" })
        }
    }
    foreach ($sp in (Get-GsaList $c['filtering-profiles'])) {
        foreach ($l in @($sp.policies)) { $manual.Add([ordered]@{ id = 'MAN-LINK'; what = "Portal: remove link $($l.id) from security profile $($sp.name) (Steps 5 and 9; TLS: unlink, delete the policy, then remove the certificate)" }) }
    }
    if ("$(Get-GsaPolicyValue $c['tenant-tagging'] @('networkPacketTaggingStatus'))" -eq 'enabled') {
        $steps.Add([ordered]@{ id = ('RB-{0:d2}' -f ($steps.Count + 1)); call = 'tagging'; method = 'PATCH'; uri = "$graph/beta/networkAccess/settings/crossTenantAccess"; body = @{ networkPacketTaggingStatus = 'disabled' }; why = 'Step 8: universal tenant restrictions tagging disabled (the TRv2 policy stays)' })
    }
    $manual.Add([ordered]@{ id = 'MAN-GROUPS'; what = "Portal: remove the ring's groups from the traffic profiles' user and group assignments" })
    $manual.Add([ordered]@{ id = 'MAN-VPN'; what = 'Agency change: restore the VPN route for the affected applications' })
    $still = @(Get-GsaPolicies $c 'NET-CN-' | Where-Object { $_.state -eq 'enabled' -and -not $done.Contains($_.id) })
    if ($DisableSignaling) {
        if ($still.Count) { throw 'Signaling can''t be disabled while a compliant network policy is enforced.' }
        $steps.Add([ordered]@{ id = ('RB-{0:d2}' -f ($steps.Count + 1)); call = 'signaling'; method = 'PATCH'; uri = "$graph/beta/networkAccess/settings/conditionalAccess"; body = @{ signalingStatus = 'disabled' }; why = 'Last: signaling disabled, after no policy depends on it' })
    }
    $plan = [ordered]@{ schema = 'fmp-gsa-plan/1'; kind = 'rollback'; asOf = $AsOf; environment = $Settings.environment; tenantId = $Settings.tenantId
        collectionManifestSha256 = (Get-GsaFileHash -Path (Join-Path $CollectionPath 'manifest.json')); steps = $steps.ToArray(); manual = $manual.ToArray() }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    Write-GsaJson -Path (Join-Path $OutputPath 'plan.json') -Value $plan
    Get-Item -LiteralPath (Join-Path $OutputPath 'plan.json')
}

# ----------------------------------------------------------------------------- metrics and rings

function Get-GsaMetrics {
    <#
    .SYNOPSIS
        The guide's coverage and effectiveness metrics, from a collection, the inputs and the settings' targets:
        client coverage, sign-ins through the service, compliant network enforcement, Private Access least
        privilege, connector resilience, bypass exposure, TLS health and telemetry freshness. Each row has its
        value, target and whether it meets it.
    .EXAMPLE
        Get-GsaMetrics -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-16 | Format-Table
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $now = Get-GsaDate $AsOf
    $row = { param($m, $v, $t, $ok) [pscustomobject][ordered]@{ Metric = $m; Value = $v; Target = $t; Met = [bool]$ok } }
    $act = [int](Get-GsaPolicyValue $Collection['device-usage'] @('activeDeviceCount')); $scope = [int]$Settings.inScopeDevices
    $cov = if ($scope) { $act / $scope } else { 0 }
    & $row 'Client coverage' ('{0:P1}' -f $cov) ('{0:P0}' -f [double]$Settings.targets.clientCoverage) ($cov -ge [double]$Settings.targets.clientCoverage)
    $rows = @(Get-GsaPolicyValue $Collection['law-query'] @('signin-share'))
    $tot = (Get-GsaSum $rows 'Total'); $thr = (Get-GsaSum $rows 'ThroughGSA')
    $sh = if ($tot) { $thr / $tot } else { 0 }
    & $row 'Sign-ins through the service' ('{0:P1}' -f $sh) ('{0:P0}' -f [double]$Settings.targets.signinShare) ($sh -ge [double]$Settings.targets.signinShare)
    $cn = @(Get-GsaPolicies $Collection 'NET-CN-' | Where-Object { $_.state -eq 'enabled' })
    & $row 'Compliant network enforcement' $(if ($cn.Count) { 'On for the ring' } else { 'Report-only or none' }) 'On by ring' ($cn.Count -gt 0)
    $apps = @(Get-GsaList $Collection['private-apps'])
    $qa = @($apps | Where-Object { $_.kind -eq 'quickAccess' } | ForEach-Object { @($_.segments) }).Count
    $per = @($apps | Where-Object { $_.kind -ne 'quickAccess' })
    $noAssign = @($per | Where-Object { -not @($_.assignments | Where-Object { $_.principalType -eq 'Group' }).Count }).Count
    $pols = @(Get-GsaPolicies $Collection 'NET-PA-')
    $noPol = @($per | Where-Object { $a = $_.appId; -not @($pols | Where-Object { $a -in @(Get-GsaPolicyValue $_ @('conditions', 'applications', 'includeApplications')) }).Count }).Count
    & $row 'Private Access least privilege' "$qa Quick Access segments; $noAssign apps without a group; $noPol without a policy" '0; 0; 0' ($qa -eq 0 -and $noAssign -eq 0 -and $noPol -eq 0)
    $groups = @(Get-GsaList $Collection['connector-groups']); $good = 0
    foreach ($g in $groups) { $cs = @(Get-GsaList $Collection['connector-group-members'][$g.id] | Where-Object { $_.status -eq 'active' -and (Compare-GsaVersion $_.version $Settings.minConnectorVersion) -ge 0 }); if ($cs.Count -ge 2) { $good++ } }
    $res = if ($groups.Count) { $good / $groups.Count } else { 1 }
    & $row 'Connector resilience' ('{0:P0}' -f $res) '100%' ($res -ge 1)
    $byp = @($Inputs.exceptions | Where-Object { $_.kind -eq 'custom-bypass' -and (Test-GsaException $_ $AsOf).Expired }).Count
    $unappr = @($Inputs.exceptions | Where-Object { -not $_.approver }).Count
    & $row 'Bypass exposure' "$byp bypasses past expiry; $unappr exceptions without an approver" '0; 0' ($byp -eq 0 -and $unappr -eq 0)
    $tl = @(Get-GsaPolicyValue $Collection['law-query'] @('tls-outcomes'))
    $tt = (Get-GsaSum $tl 'Count'); $tf = (Get-GsaSum @($tl | Where-Object { "$($_.TlsStatus)" -eq 'Failure' }) 'Count')
    $fs = if ($tt) { 100.0 * $tf / $tt } else { 0 }
    $days = if ($Inputs.tls -and $Inputs.tls.Contains('certificate')) { [int]((Get-GsaDate $Inputs.tls.certificate.notAfter) - $now).TotalDays } else { 0 }
    & $row 'TLS inspection health' ('{0:N2}% failures; {1} days to expiry' -f $fs, $days) 'Under 1%; over 90' ($fs -lt 1 -and $days -gt 90)
    $fr = @(Get-GsaPolicyValue $Collection['law-query'] @('freshness'))
    $stale = @('NetworkAccessTraffic', 'NetworkAccessConnectionEvents', 'RemoteNetworkHealthLogs', 'NetworkAccessAlerts' | Where-Object { $t = $_; $r = @($fr | Where-Object { $_.Table -eq $t }); -not $r.Count -or ($now - (Get-GsaDate $r[0].Last)).TotalHours -gt 24 }).Count
    & $row 'Telemetry freshness' "$stale tables with no rows in 24 hours" '0' ($stale -eq 0)
}

function Test-GsaRingExit {
    <#
    .SYNOPSIS
        The guide's ring exit criteria (Step 11.1) for the ring in the settings, from the metrics, the checks and
        the ring record: business days in the ring, open Sev-2 tickets, help desk volume, the client on every
        device in scope, clean report-only results, the TLS failure share, the emergency access exclusion tested
        on the ring's start date, and break-glass rehearsed. Returns one row per criterion; the ring exits only if
        every row passes.
    .EXAMPLE
        Test-GsaRingExit -Collection $c -Inputs $i -Settings $s -AsOf 2026-11-30
    #>
    param([hashtable]$Collection, [hashtable]$Inputs, [hashtable]$Settings, [string]$AsOf)
    $r = $Inputs.ring; $ring = "$($Settings.ring)"
    $need = @{ pilot = 10; ring1 = 10; ring2 = 20; ring3 = 20 }[$ring]; if (-not $need) { $need = 10 }
    $row = { param($id, $ok, $d) [pscustomobject][ordered]@{ Criterion = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $d } }
    $days = if ($r.started) { Get-GsaBusinessDays -From $r.started -To $AsOf } else { 0 }
    & $row 'RX-01 time in ring' ($days -ge $need) "$days business days since $($r.started) (needs $need)"
    & $row 'RX-02 Sev-2 tickets' ([int]$r.sev2Open -eq 0) "$([int]$r.sev2Open) unresolved"
    & $row 'RX-03 help desk volume' ([int]$r.helpDeskTickets -le [int]$r.helpDeskThreshold) "$($r.helpDeskTickets) tickets (threshold $($r.helpDeskThreshold))"
    $m = @(Get-GsaMetrics -Collection $Collection -Inputs $Inputs -Settings $Settings -AsOf $AsOf)
    $cov = $m | Where-Object Metric -EQ 'Client coverage'
    & $row 'RX-04 client active on every in-scope device' ($cov.Value -eq '100.0%') "$($cov.Value) of in-scope devices"
    $cn = @(Test-GsaCompliantNetwork -Collection $Collection -Inputs $Inputs -Settings $Settings -AsOf $AsOf | Where-Object Status -EQ 'Fail')
    $ro = @(Get-GsaPolicyValue $Collection['law-query'] @('cn-report-only'))
    $defects = [int](Get-GsaSum @($ro | Where-Object { "$($_.Result)" -eq 'reportOnlyFailure' -and "$($_.Through)" -eq 'true' }) 'count_')
    & $row 'RX-05 report-only results clean' (-not $cn.Count -and -not $defects) "$defects report-only failures carried by the service; $($cn.Count) compliant network checks fail"
    $tls = $m | Where-Object Metric -EQ 'TLS inspection health'
    & $row 'RX-06 TLS failure share under 1%' $tls.Met "$($tls.Value)"
    $em = Get-GsaDate $r.emergencyExclusionTestedOn
    & $row 'RX-07 emergency exclusion tested at ring start' ($em -and $r.started -and $em -ge (Get-GsaDate $r.started).Date) "tested $($r.emergencyExclusionTestedOn); ring started $($r.started)"
    & $row 'RX-08 break-glass rehearsed' ([bool]$r.breakGlassRehearsedOn) "rehearsed $($r.breakGlassRehearsedOn)"
}

# ----------------------------------------------------------------------------- preflight

function Invoke-GsaPreflight {
    <#
    .SYNOPSIS
        The preflight before a stage, read only. PF-01 the settings name this stage and every placeholder is
        filled; PF-02 the collection matches its manifest and was read in this tenant; PF-03 the emergency access
        group is excluded from every NET- Conditional Access policy; PF-04 the network diagnostic setting exists
        (logs before the pilot); PF-05 every function the desired state enables has an approved decision; PF-06
        in production, the test stage's evidence passes. Returns the results.
    .EXAMPLE
        Invoke-GsaPreflight -Settings $s -Stage test -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -DesiredPath config/desired.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
        [Parameter(Mandatory)][string]$CollectionPath, [Parameter(Mandatory)][string]$InputsPath, [Parameter(Mandatory)][string]$DesiredPath, [string]$TestEvidencePath)
    $r = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $d) $r.Add([pscustomobject][ordered]@{ Id = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $d }) }
    & $add 'PF-01' ($Settings.environment -eq $Stage) "settings environment '$($Settings.environment)', stage '$Stage'; ring $($Settings.ring)"
    $t = Test-GsaRunFolder -Path $CollectionPath
    $m = $t.Manifest
    & $add 'PF-02' ($t.Ok -and $m -and $m.tenantId -eq $Settings.tenantId) "$($t.Detail); tenant $(if ($m) { $m.tenantId })"
    $c = Read-GsaJson -Path (Join-Path $CollectionPath 'collection.json')
    $bad = @(Get-GsaPolicies $c 'NET-' | Where-Object { -not (Test-GsaExclusion $_ $Settings.groups.emergency) } | ForEach-Object displayName)
    & $add 'PF-03' (-not $bad.Count) $(if ($bad.Count) { "emergency group not excluded from: $($bad -join ', ')" } else { "emergency group excluded from all $(@(Get-GsaPolicies $c 'NET-').Count) NET- policies" })
    $ds = @(Get-GsaList $c['diagnostic-settings'] | Where-Object { $_.name -eq 'gsa-network-telemetry' })
    & $add 'PF-04' ($ds.Count -gt 0) $(if ($ds.Count) { 'gsa-network-telemetry exists' } else { 'no network diagnostic setting: logs come before the pilot' })
    $i = Read-GsaInputs -Path $InputsPath
    $d = Read-GsaJson -Path $DesiredPath
    $fn = @{ m365 = 'microsoft-traffic'; internet = 'internet'; private = 'private' }
    $missing = @($d.forwardingProfiles.Keys | Where-Object { $d.forwardingProfiles[$_] -eq 'enabled' } | Where-Object { $f = $fn[$_]; -not @($i.decisions | Where-Object { $_.function -eq $f -and $_.decision -in 'adopt', 'coexist' -and $_.approved_on }).Count })
    & $add 'PF-05' (-not $missing.Count) $(if ($missing.Count) { "no approved decision for: $($missing -join ', ')" } else { 'every enabled function has an approved decision' })
    if ($Stage -eq 'production') {
        $ok = $TestEvidencePath -and (Test-Path -LiteralPath $TestEvidencePath) -and -not @(Test-GsaEvidence -EvidencePath $TestEvidencePath -Stage test | Where-Object Status -EQ 'Fail').Count
        & $add 'PF-06' $ok $(if ($ok) { 'the test stage''s evidence passes' } else { 'the test stage''s evidence is missing or fails' })
    }
    $r.ToArray()
}

# ----------------------------------------------------------------------------- manifests and evidence

function Write-GsaManifest {
    <#
    .SYNOPSIS
        Writes manifest.json in a run folder: the task, time, mode, environment, tenant, the calls sent with their
        permissions and beta flag, and the SHA-256 of every other file in the folder.
    .EXAMPLE
        Write-GsaManifest -OutputPath out/pilot -Task collect -AsOf 2026-11-16T12:00:00Z -Mode Fixture -Settings $s
    #>
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][string]$AsOf,
        [string]$Mode = 'Fixture', [hashtable]$Settings = @{}, [string[]]$CallIds = @(), [hashtable]$Extra = @{})
    $root = (Resolve-Path -LiteralPath $OutputPath).Path.TrimEnd('\', '/')
    $files = [ordered]@{}
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'manifest.json' | Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') })) {
        $files[$f.FullName.Substring($root.Length + 1).Replace('\', '/')] = Get-GsaFileHash -Path $f.FullName
    }
    $calls = @($CallIds | Sort-Object -Unique | ForEach-Object { $c = Get-GsaCall -Id $_; [ordered]@{ id = $c.id; method = $c.method; permissions = @($c.permissions); beta = [bool]$c.beta; verified = [bool]$c.verified; doc = $c.doc } })
    $m = [ordered]@{ schema = 'fmp-gsa-manifest/1'; task = $Task; asOf = (ConvertTo-GsaUtc $AsOf); mode = $Mode; environment = "$($Settings.environment)"; tenantId = "$($Settings.tenantId)"
        cloud = "$($Settings.cloud)"; ring = "$($Settings.ring)"; kit = 'examples/global-secure-access'; calls = $calls; files = $files }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-GsaJson -Path (Join-Path $root 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $root 'manifest.json')
}

function Test-GsaRunFolder {
    <#
    .SYNOPSIS
        Re-hashes every file a run folder's manifest.json lists. Returns @{ Ok; Detail; Manifest }.
    .EXAMPLE
        Test-GsaRunFolder -Path out/pilot
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-GsaJson -Path $mp
    $bad = @()
    foreach ($f in $m.files.Keys) {
        $fp = Join-Path $Path $f
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$f missing" } elseif ((Get-GsaFileHash -Path $fp) -ne $m.files[$f]) { $bad += "$f changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) files match the manifest" }); Manifest = $m }
}

function Get-GsaRequirements {
    <#
    .SYNOPSIS
        Reads config/requirements.json: each step's SP 800-53 controls and FedRAMP 20x KSIs, the steps each task
        or check area covers, and the steps each deployment stage needs.
    .EXAMPLE
        (Get-GsaRequirements).steps.COMPLIANT.ksis
    #>
    Read-GsaJson -Path (Join-Path $script:ConfigRoot 'requirements.json')
}

function Get-GsaStepsForRun {
    param([Parameter(Mandatory)][hashtable]$Manifest)
    $req = Get-GsaRequirements
    $keys = switch ($Manifest.task) {
        'check' { @($Manifest.areas) }
        'collect' { @('collect') }
        default { @($Manifest.task) }
    }
    $steps = @(foreach ($k in $keys) { if (-not $req.areas.Contains($k)) { throw "No evidence step for '$k'." }; $req.areas[$k] })
    @($steps | Select-Object -Unique)
}

function Update-GsaEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder, one "sha256  relative/path" line per file, so the ISSO can check
        it with sha256sum -c SHA256SUMS. Returns the line count.
    .EXAMPLE
        Update-GsaEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
            ForEach-Object { '{0}  {1}' -f (Get-GsaFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    $lines.Count
}

function Write-GsaEvidence {
    <#
    .SYNOPSIS
        Records one run folder as evidence: checks its manifest, copies it under runs/, and writes a record with
        the time, environment, tenant, ring, command, result, the steps it covers with their SP 800-53 controls and
        FedRAMP 20x KSIs, every file's SHA-256 and the SHA-256 of the record before it, so the records form a
        chain. A check run whose findings include a Fail is recorded with result Findings, not Pass. Appends
        records.csv and rewrites SHA256SUMS.
    .EXAMPLE
        Write-GsaEvidence -EvidencePath out/evidence -RunPath out/check-decision -AsOf 2026-11-16T12:05:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$Command = '', [string]$ChangeRecord = '')
    $AsOf = ConvertTo-GsaUtc $AsOf
    $req = Get-GsaRequirements
    $t = Test-GsaRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $steps = @(Get-GsaStepsForRun -Manifest $t.Manifest) + @('EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-GsaFileHash -Path $prior[-1].FullName } else { $null }
    $label = if ($t.Manifest.task -eq 'check') { "check-$(@($t.Manifest.areas) -join '+')" } else { $t.Manifest.task }
    $name = '{0:d4}-{1}' -f $seq, $label
    $dest = Join-Path $EvidencePath "runs/$name"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in $t.Manifest.files.Keys) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-GsaFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @($steps | ForEach-Object { $req.steps[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req.steps[$_].ksis } | Where-Object { $_ } | Sort-Object -Unique)
    $failed = if ($t.Manifest.Contains('failed')) { [int]$t.Manifest.failed } else { 0 }
    $result = if (-not $t.Ok) { 'Fail' } elseif ($failed) { 'Findings' } else { 'Pass' }
    $rec = [ordered]@{
        schema = 'fmp-gsa-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = $t.Manifest.task; label = $label; environment = "$($t.Manifest.environment)"; tenantId = "$($t.Manifest.tenantId)"
        ring = "$($t.Manifest.ring)"; mode = "$($t.Manifest.mode)"; changeRecord = $ChangeRecord; command = $Command.Trim(); result = $result
        detail = "$($t.Detail)$(if ($failed) { "; $failed findings fail" })"
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_] } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-GsaJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-GsaText -Path $csv -Text "sequence,recordedAt,label,environment,ring,result,steps,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $AsOf, $label, "$($t.Manifest.environment)", "$($t.Manifest.ring)", $result, ($steps -join ' '), ($controls -join ' '), ($ksis -join ' '), (Get-GsaFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", [Text.UTF8Encoding]::new($false))
    $null = Update-GsaEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $result; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-GsaEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: every file SHA256SUMS lists is unchanged and every file is listed; each record's
        files match their hashes; the chain is unbroken; and, with -Stage, every step the stage needs has a record
        whose result is Pass. Returns one row per check.
    .EXAMPLE
        Test-GsaEvidence -EvidencePath out/evidence -Stage test
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
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-GsaFileHash -Path $f.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { $bad -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}
    foreach ($r in $recs) {
        $j = Read-GsaJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($f in @($j.files)) { $fp = Join-Path $root $f.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-GsaFileHash -Path $fp) -ne $f.sha256) { $chain += "$($f.path) doesn't match $($r.Name)" } }
        if ($j.result -eq 'Pass') { foreach ($s in @($j.steps)) { $passed[$s.id] = $true } }
        $prev = Get-GsaFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Stage) {
        foreach ($s in (Get-GsaRequirements).stages[$Stage]) { & $add "STEP-$s" $passed.Contains($s) $(if ($passed.Contains($s)) { 'a passing record covers it' } else { 'no passing record' }) }
    }
    $rows.ToArray()
}

Export-ModuleMember -Function Get-GsaCloud, Read-GsaJson, Write-GsaJson, Get-GsaFileHash, ConvertTo-GsaUtc, Get-GsaBusinessDays, Get-GsaCall, Get-GsaRequiredPermission, Get-GsaAvailability, Read-GsaSettings, Set-GsaRunner, New-GsaFixtureInvoker, New-GsaLiveInvoker, Assert-GsaLiveContext, Invoke-GsaCall, Invoke-GsaCollection, Read-GsaCollection, Read-GsaInputs, Test-GsaDecision, Test-GsaBaseline, Test-GsaClient, Test-GsaTraffic, Test-GsaCompliantNetwork, Test-GsaTenantRestrictions, Test-GsaPrivateAccess, Test-GsaInternetAccess, Test-GsaTls, Test-GsaTelemetry, Invoke-GsaChecks, New-GsaPlan, Invoke-GsaPlanSteps, New-GsaRollbackPlan, Get-GsaMetrics, Test-GsaRingExit, Invoke-GsaPreflight, Write-GsaManifest, Test-GsaRunFolder, Get-GsaRequirements, Update-GsaEvidenceSums, Write-GsaEvidence, Test-GsaEvidence
