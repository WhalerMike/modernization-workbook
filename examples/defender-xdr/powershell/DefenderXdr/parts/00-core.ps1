# Core: clouds, files, hashes, settings, the declared calls, the invokers and the run folder's manifest.

# ----------------------------------------------------------------------------- clouds

# The clouds the kit reads. Microsoft Learn ("National cloud deployments"): GCC uses the worldwide Microsoft
# Graph endpoints. Case-sensitive on purpose: an unknown name throws, and there is no default.
$script:Clouds = @{
    gcc    = @{ Graph = 'https://graph.microsoft.com'; GraphEnvironment = 'Global'; Login = 'https://login.microsoftonline.com'; Portal = 'https://security.microsoft.com' }
    global = @{ Graph = 'https://graph.microsoft.com'; GraphEnvironment = 'Global'; Login = 'https://login.microsoftonline.com'; Portal = 'https://security.microsoft.com' }
}

function Get-XdrCloud {
    <#
    .SYNOPSIS
        Returns a cloud's endpoints: gcc or global. Any other name throws; there is no default.
    .EXAMPLE
        (Get-XdrCloud -Cloud gcc).Graph
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    if (-not ($script:Clouds.Keys -ccontains $Cloud)) { throw "Unknown cloud '$Cloud'. Use $(($script:Clouds.Keys | Sort-Object) -join ' or ')." }
    [pscustomobject]$script:Clouds[$Cloud]
}

# ----------------------------------------------------------------------------- files and values

function Read-XdrJson {
    <#
    .SYNOPSIS
        Reads a JSON file as hashtables and arrays; date-like strings stay strings.
    .EXAMPLE
        Read-XdrJson -Path config/asr-rules.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    ConvertFrom-XdrJsonText -Text ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path))
}

function ConvertFrom-XdrJsonText {
    <#
    .SYNOPSIS
        Parses JSON text as hashtables and arrays, keeping date-like strings as strings.
    .EXAMPLE
        ConvertFrom-XdrJsonText -Text '{"a":1}'
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    if (-not $Text.Trim()) { return $null }
    $p = @{ AsHashtable = $true; Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String'; return ($Text | ConvertFrom-Json @p) }
    , (ConvertTo-XdrStringDate -Value ($Text | ConvertFrom-Json @p))
}

function ConvertTo-XdrStringDate {
    <#
    .SYNOPSIS
        Turns DateTime values PowerShell before 7.5 made from JSON strings back into UTC strings.
    .EXAMPLE
        ConvertTo-XdrStringDate -Value (Get-Date)
    #>
    param([AllowNull()]$Value)
    if ($Value -is [DateTime]) { return $Value.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [Collections.IDictionary]) { foreach ($k in @($Value.Keys)) { $Value[$k] = ConvertTo-XdrStringDate -Value $Value[$k] }; return , $Value }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) { for ($i = 0; $i -lt $Value.Count; $i++) { $Value[$i] = ConvertTo-XdrStringDate -Value $Value[$i] }; return , $Value }
    $Value
}

function Write-XdrJson {
    <#
    .SYNOPSIS
        Writes a value as UTF-8 JSON without a byte order mark, with LF line endings.
    .EXAMPLE
        Write-XdrJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()]$Value)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = (ConvertTo-Json -InputObject $Value -Depth 50) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Path, $json + "`n", [Text.UTF8Encoding]::new($false))
}

function Write-XdrText {
    <#
    .SYNOPSIS
        Writes text as UTF-8 without a byte order mark, with LF line endings.
    .EXAMPLE
        Write-XdrText -Path out/x.txt -Text 'hello'
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), [Text.UTF8Encoding]::new($false))
}

function Write-XdrCsv {
    <#
    .SYNOPSIS
        Writes objects as CSV (every value quoted, LF line endings, UTF-8 without BOM). An empty list writes
        the header given by -Columns.
    .EXAMPLE
        Write-XdrCsv -Path out/x.csv -Rows $rows -Columns Name, Status
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()][AllowEmptyCollection()][object[]]$Rows, [Parameter(Mandatory)][string[]]$Columns)
    $q = { param($v) '"' + ("$v" -replace '"', '""') + '"' }
    $lines = [Collections.Generic.List[string]]::new()
    $lines.Add((($Columns | ForEach-Object { & $q $_ }) -join ','))
    foreach ($r in @($Rows)) {
        if ($null -eq $r) { continue }
        $lines.Add((($Columns | ForEach-Object { $v = Get-XdrV $r $_; if ($v -is [Collections.IList] -and $v -isnot [string]) { $v = ($v -join '; ') }; & $q $v }) -join ','))
    }
    Write-XdrText -Path $Path -Text (($lines -join "`n") + "`n")
}

function Get-XdrFileHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a file.
    .EXAMPLE
        Get-XdrFileHash -Path config/calls.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-XdrV {
    <#
    .SYNOPSIS
        A value by name from a hashtable or object, matching the name case-insensitively (advanced hunting
        results come back in PascalCase or camelCase), or $null.
    .EXAMPLE
        Get-XdrV @{ deviceName = 'a' } 'DeviceName'
    #>
    param([AllowNull()]$Item, [Parameter(Mandatory)][string]$Name)
    if ($null -eq $Item) { return $null }
    if ($Item -is [Collections.IDictionary]) {
        foreach ($k in $Item.Keys) { if ("$k" -ieq $Name) { return $Item[$k] } }
        return $null
    }
    $p = $Item.PSObject.Properties | Where-Object { $_.Name -ieq $Name } | Select-Object -First 1
    if ($p) { $p.Value } else { $null }
}

function ConvertTo-XdrUtc {
    <#
    .SYNOPSIS
        Parses a date (string or DateTime) as UTC and returns it as yyyy-MM-ddTHH:mm:ssZ.
    .EXAMPLE
        ConvertTo-XdrUtc '2026-11-16T12:00:00Z'
    #>
    param([Parameter(Mandatory)]$Value)
    $d = if ($Value -is [DateTime]) { $Value } else { [DateTime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) }
    $d.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
}

function Get-XdrDate {
    <#
    .SYNOPSIS
        Parses a date as a UTC DateTime.
    .EXAMPLE
        Get-XdrDate '2026-11-16T12:00:00Z'
    #>
    param([Parameter(Mandatory)]$Value)
    [DateTime]::Parse((ConvertTo-XdrUtc $Value), [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
}

function Read-XdrCsv {
    <#
    .SYNOPSIS
        Reads a CSV file the agency keeps (an inventory, a register, an export); a missing file throws with
        its path.
    .EXAMPLE
        Read-XdrCsv -Path tests/fixtures/inputs/inventory.csv
    #>
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "File not found: $Path" }
    @(Import-Csv -LiteralPath $Path)
}

# ----------------------------------------------------------------------------- settings

function Read-XdrSettings {
    <#
    .SYNOPSIS
        Reads an environment's settings file. Refuses an unknown cloud, a placeholder left in a value the
        run needs, and anything that looks like a secret. Input paths under 'inputs' are resolved against
        the settings file's folder, and so is outputRoot. Adds 'SettingsRoot'.
    .EXAMPLE
        $s = Read-XdrSettings -Path tests/fixtures/settings.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $full = (Resolve-Path -LiteralPath $Path).Path
    $raw = [IO.File]::ReadAllText($full)
    if ($raw -match '(?i)"(client_?secret|password|secret|token|apikey|api_key)"\s*:\s*"[^"]+"') { throw "The settings file $Path holds a secret-like value ($($Matches[1])). Keep secrets out of settings files." }
    $s = ConvertFrom-XdrJsonText -Text $raw
    foreach ($k in 'environment', 'cloud', 'tenantId') { if (-not $s.Contains($k) -or -not "$($s[$k])") { throw "The settings file $Path has no '$k'." } }
    $null = Get-XdrCloud -Cloud $s.cloud
    foreach ($k in 'environment', 'cloud', 'tenantId') { if ("$($s[$k])" -match '^<.*>$') { throw "The settings file $Path still has the placeholder $($s[$k]) in '$k'." } }
    $root = Split-Path -Parent $full
    if ($s.Contains('inputs')) {
        foreach ($k in @($s.inputs.Keys)) {
            $v = "$($s.inputs[$k])"
            if ($v -and $v -notmatch '^<.*>$' -and -not [IO.Path]::IsPathRooted($v)) { $s.inputs[$k] = [IO.Path]::GetFullPath((Join-Path $root $v)) }
        }
    }
    else { $s.inputs = @{} }
    if ($s.Contains('outputRoot') -and "$($s.outputRoot)" -and "$($s.outputRoot)" -notmatch '^<.*>$' -and -not [IO.Path]::IsPathRooted("$($s.outputRoot)")) { $s.outputRoot = [IO.Path]::GetFullPath((Join-Path $root $s.outputRoot)) }
    $s.SettingsRoot = $root
    $s
}

function Get-XdrInput {
    <#
    .SYNOPSIS
        One input file's path from the settings ('inputs'), or the override when one is given. Throws when
        neither names a file.
    .EXAMPLE
        Get-XdrInput -Settings $s -Name inventory
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$Name, [string]$Override)
    if ($Override) { return (Resolve-Path -LiteralPath $Override).Path }
    $v = if ($Settings.inputs.Contains($Name)) { "$($Settings.inputs[$Name])" } else { '' }
    if (-not $v -or $v -match '^<.*>$') { throw "The settings file names no '$Name' input (inputs.$Name)." }
    $v
}

# ----------------------------------------------------------------------------- calls

function Get-XdrCall {
    <#
    .SYNOPSIS
        The calls declared in config/calls.json, or the one with -Id. Each carries its method, path, least-
        privileged permission, the roles a delegated user needs and the Learn page that says so.
    .EXAMPLE
        Get-XdrCall | ForEach-Object id
    #>
    [CmdletBinding()]
    param([string]$Id, [string]$Path = (Join-Path $script:ConfigRoot 'calls.json'))
    $calls = @((Read-XdrJson -Path $Path).calls)
    if ($Id) {
        $c = @($calls | Where-Object { $_.id -eq $Id })
        if (-not $c.Count) { throw "Call '$Id' isn't declared in config/calls.json." }
        return $c[0]
    }
    $calls
}

function Get-XdrRequiredPermission {
    <#
    .SYNOPSIS
        What the kit's calls need: each call's least-privileged Graph permission, the roles a delegated user
        must also hold, whether it writes, and the page that says so. -Task limits it to one script's calls.
    .EXAMPLE
        Get-XdrRequiredPermission -Task coverage
    #>
    [CmdletBinding()]
    param([string]$Task)
    foreach ($c in Get-XdrCall) {
        if ($Task -and $Task -notin @($c.tasks)) { continue }
        [pscustomobject][ordered]@{ Call = $c.id; Method = $c.method; Permission = $c.permission; Roles = (@($c.roles) -join '; '); Writes = [bool]$c.writes; Doc = $c.doc }
    }
}

# ----------------------------------------------------------------------------- invokers

function New-XdrFixtureInvoker {
    <#
    .SYNOPSIS
        The fixture invoker: each call reads its file under -Path (config/calls.json 'fixture'; a hunting
        query reads hunting/<name>.json). Sends nothing anywhere. Records every call it serves.
    .EXAMPLE
        $inv = New-XdrFixtureInvoker -Path tests/fixtures/graph
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    [pscustomobject]@{ Mode = 'Fixture'; Root = (Resolve-Path -LiteralPath $Path).Path; Calls = [Collections.Generic.List[string]]::new() }
}

# The Graph runner: replaced in tests. Live, Invoke-MgGraphRequest (Microsoft.Graph.Authentication).
$script:GraphRunner = {
    param([string]$Method, [string]$Uri, $Body)
    if ($null -ne $Body) { Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body ($Body | ConvertTo-Json -Depth 30) -ContentType 'application/json' -OutputType Hashtable }
    else { Invoke-MgGraphRequest -Method $Method -Uri $Uri -OutputType Hashtable }
}
# The Graph session: replaced in tests. Live, Get-MgContext.
$script:GraphContext = { $ctx = Get-MgContext; if ($ctx) { @{ Environment = "$($ctx.Environment)"; TenantId = "$($ctx.TenantId)"; Scopes = @($ctx.Scopes) } } }

function Set-XdrRunner {
    <#
    .SYNOPSIS
        Replaces the Graph runner or the Graph-context reader (for tests and fixture mode). Returns the
        previous pair.
    .EXAMPLE
        $old = Set-XdrRunner -Graph { param($Method, $Uri, $Body) @{ value = @() } }
    #>
    param([scriptblock]$Graph, [scriptblock]$GraphContext)
    $old = @{ Graph = $script:GraphRunner; GraphContext = $script:GraphContext }
    if ($Graph) { $script:GraphRunner = $Graph }
    if ($GraphContext) { $script:GraphContext = $GraphContext }
    $old
}

function Assert-XdrGraphContext {
    <#
    .SYNOPSIS
        Refuses a live run when no Graph session exists, or when it is signed in to another environment or
        tenant than the settings name.
    .EXAMPLE
        Assert-XdrGraphContext -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings)
    $want = (Get-XdrCloud -Cloud $Settings.cloud).GraphEnvironment
    $ctx = & $script:GraphContext
    if (-not $ctx) { throw "No Microsoft Graph session. Run: Connect-MgGraph -Environment $want -TenantId $($Settings.tenantId) -Scopes <the scopes Get-XdrRequiredPermission lists>" }
    if ("$($ctx.Environment)" -ne $want) { throw "The Graph session is in '$($ctx.Environment)', not '$want'." }
    if ("$($ctx.TenantId)" -ne "$($Settings.tenantId)") { throw "The Graph session is in tenant $($ctx.TenantId), not $($Settings.tenantId)." }
}

function New-XdrLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: each declared read goes through Invoke-MgGraphRequest after the Graph session is
        checked against the settings. A call that writes is refused here (writes go through
        Invoke-XdrWrite in deploy/). Not run against a live tenant by the authors.
    .EXAMPLE
        $inv = New-XdrLiveInvoker -Settings (Read-XdrSettings -Path deploy/settings.test.json)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [switch]$SkipContextCheck)
    if (-not $SkipContextCheck) { Assert-XdrGraphContext -Settings $Settings }
    [pscustomobject]@{ Mode = 'Live'; Settings = $Settings; Calls = [Collections.Generic.List[string]]::new() }
}

function Get-XdrCallUri {
    <#
    .SYNOPSIS
        A declared call's path with its id and its $filter, $expand, $top and $select arguments.
    .EXAMPLE
        Get-XdrCallUri -Call (Get-XdrCall -Id incidents-list) -Arguments @{ top = 5 }
    #>
    param([Parameter(Mandatory)]$Call, [hashtable]$Arguments = @{})
    $uri = "$($Call.path)"
    if ($Arguments.Contains('id')) { $uri = $uri.Replace('{id}', [Uri]::EscapeDataString("$($Arguments.id)")) }
    $q = @()
    foreach ($k in 'filter', 'expand', 'top', 'select') {
        if ($Arguments.Contains($k) -and "$($Arguments[$k])") { $q += ('${0}={1}' -f $k, [Uri]::EscapeDataString("$($Arguments[$k])")) }
    }
    if ($q.Count) { $uri += '?' + ($q -join '&') }
    $uri
}

function Invoke-XdrCall {
    <#
    .SYNOPSIS
        Sends one declared read through an invoker. A fixture invoker reads the call's file; a live invoker
        calls Microsoft Graph, following @odata.nextLink; a test invoker (Mode 'Script') runs its script
        block. Hunting queries take -Arguments @{ name; query; timespan }. A call not in config/calls.json,
        or one that writes, throws.
    .EXAMPLE
        Invoke-XdrCall -Invoker (New-XdrFixtureInvoker -Path tests/fixtures/graph) -CallId incidents-list
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$CallId, [hashtable]$Arguments = @{})
    $call = Get-XdrCall -Id $CallId
    if ($call.writes) { throw "Call $CallId writes; reads only here. Writes go through Invoke-XdrWrite with -Apply." }
    $Invoker.Calls.Add($CallId)
    switch ($Invoker.Mode) {
        'Fixture' {
            $file = if ($call.id -eq 'hunting-query') { Join-Path $Invoker.Root "hunting/$($Arguments.name).json" } else { Join-Path $Invoker.Root $call.fixture }
            if (-not (Test-Path -LiteralPath $file)) { throw "Fixture $file is missing for call $CallId." }
            return , (Read-XdrJson -Path $file)
        }
        'Live' {
            $graph = (Get-XdrCloud -Cloud $Invoker.Settings.cloud).Graph
            if ($call.id -eq 'hunting-query') {
                $body = @{ Query = "$($Arguments.query)" }
                if ($Arguments.Contains('timespan') -and $Arguments.timespan) { $body.Timespan = "$($Arguments.timespan)" }
                return , (& $script:GraphRunner 'POST' "$graph/$($call.version)$($call.path)" $body)
            }
            $items = [Collections.Generic.List[object]]::new()
            $uri = "$graph/$($call.version)$(Get-XdrCallUri -Call $call -Arguments $Arguments)"
            while ($uri) {
                $page = & $script:GraphRunner 'GET' $uri $null
                if ($null -ne $page -and $page.Contains('value')) { foreach ($v in @($page['value'])) { if ($null -ne $v) { $items.Add($v) } } }
                else { return , $page }
                $uri = $page['@odata.nextLink']
                if ($uri -and -not "$uri".StartsWith($graph)) { throw "nextLink $uri isn't on $graph." }
            }
            return , @{ value = $items.ToArray() }
        }
        'Script' { return , (& $Invoker.Script $CallId $Arguments) }
        default { throw "Unknown invoker mode '$($Invoker.Mode)'." }
    }
}

function Invoke-XdrWrite {
    <#
    .SYNOPSIS
        Sends one declared write (a custom detection rule create or update) to Microsoft Graph. Used only by
        deploy/Publish-XdrDetections.ps1 after -Apply and the plan's SHA-256 are checked. Fixture mode
        records the write and sends nothing.
    .EXAMPLE
        Invoke-XdrWrite -Invoker $inv -CallId detection-rule-update -Arguments @{ id = 'x' } -Body @{ status = 'disabled' }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$CallId, [hashtable]$Arguments = @{}, $Body)
    $call = Get-XdrCall -Id $CallId
    if (-not $call.writes) { throw "Call $CallId doesn't write." }
    $Invoker.Calls.Add($CallId)
    switch ($Invoker.Mode) {
        'Fixture' { return @{ fixture = $true; method = $call.method; path = (Get-XdrCallUri -Call $call -Arguments $Arguments) } }
        'Live' {
            $graph = (Get-XdrCloud -Cloud $Invoker.Settings.cloud).Graph
            return (& $script:GraphRunner $call.method "$graph/$($call.version)$(Get-XdrCallUri -Call $call -Arguments $Arguments)" $Body)
        }
        'Script' { return (& $Invoker.Script $CallId $Arguments $Body) }
    }
}

# ----------------------------------------------------------------------------- hunting

function Get-XdrQuery {
    <#
    .SYNOPSIS
        The kit's advanced hunting queries (config/queries.json): each with its KQL, where it comes from
        (the guide's gate or a Learn page) and the columns the kit reads. -Name returns one.
    .EXAMPLE
        (Get-XdrQuery -Name coverage-summary).kql
    #>
    param([string]$Name)
    $q = (Read-XdrJson -Path (Join-Path $script:ConfigRoot 'queries.json')).queries
    if ($Name) {
        if (-not $q.Contains($Name)) { throw "Query '$Name' isn't in config/queries.json." }
        $r = $q[$Name]; $r.name = $Name; return $r
    }
    foreach ($k in $q.Keys) { $r = $q[$k]; $r.name = $k; $r }
}

function Invoke-XdrHunting {
    <#
    .SYNOPSIS
        Runs one advanced hunting query through runHuntingQuery (or reads its fixture) and returns the rows.
        Saves the raw response under <OutputPath>/raw/<name>.json when -OutputPath is given. Throws when a
        column the kit reads is missing from the response's schema.
    .EXAMPLE
        Invoke-XdrHunting -Invoker $inv -Name coverage-devices -OutputPath out/coverage
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$Name, [string]$Query, [string]$Timespan, [string]$OutputPath, [string[]]$Columns)
    if (-not $Query) { $q = Get-XdrQuery -Name $Name; $Query = $q.kql; if (-not $Timespan -and $q.Contains('timespan')) { $Timespan = $q.timespan }; if (-not $Columns) { $Columns = @($q.columns) } }
    $resp = Invoke-XdrCall -Invoker $Invoker -CallId hunting-query -Arguments @{ name = $Name; query = $Query; timespan = $Timespan }
    if ($OutputPath) { Write-XdrJson -Path (Join-Path $OutputPath "raw/$Name.json") -Value $resp }
    $schema = @(Get-XdrV $resp 'schema' | ForEach-Object { "$(Get-XdrV $_ 'name')" })
    foreach ($c in @($Columns)) { if ($c -and $schema.Count -and -not ($schema | Where-Object { $_ -ieq $c })) { throw "Query $Name returned no column $c (it returned $($schema -join ', '))." } }
    @(Get-XdrV $resp 'results') | Where-Object { $null -ne $_ }
}

# ----------------------------------------------------------------------------- the run folder

function Write-XdrManifest {
    <#
    .SYNOPSIS
        Writes manifest.json in a run folder: the task, time, mode, environment, the calls sent with their
        permissions, and the SHA-256 of every other file in the folder.
    .EXAMPLE
        Write-XdrManifest -OutputPath out/coverage -Task coverage -AsOf 2026-11-16T12:00:00Z -Mode Fixture -Environment lab
    #>
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][string]$AsOf,
        [string]$Mode = 'Fixture', [string]$Environment = '', [string[]]$CallIds = @(), [hashtable]$Extra = @{})
    $root = (Resolve-Path -LiteralPath $OutputPath).Path.TrimEnd('\', '/')
    $files = [ordered]@{}
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'manifest.json' | Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') })) {
        $files[$f.FullName.Substring($root.Length + 1).Replace('\', '/')] = Get-XdrFileHash -Path $f.FullName
    }
    $calls = @($CallIds | Sort-Object -Unique | ForEach-Object { $c = Get-XdrCall -Id $_; [ordered]@{ id = $c.id; method = $c.method; path = $c.path; permission = $c.permission; doc = $c.doc } })
    $m = [ordered]@{ schema = 'fmp-xdr-manifest/1'; task = $Task; asOf = (ConvertTo-XdrUtc $AsOf); mode = $Mode; environment = $Environment; kit = 'examples/defender-xdr'; calls = $calls; files = $files }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-XdrJson -Path (Join-Path $root 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $root 'manifest.json')
}

function New-XdrRunFolder {
    <#
    .SYNOPSIS
        Empties or creates a run folder and returns its full path.
    .EXAMPLE
        New-XdrRunFolder -OutputPath out/coverage
    #>
    param([Parameter(Mandatory)][string]$OutputPath)
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    (Resolve-Path -LiteralPath $OutputPath).Path
}

function New-XdrCheck {
    <#
    .SYNOPSIS
        One check result row: Id, Status (Pass, Fail, Warn, Info), Subject and Detail.
    .EXAMPLE
        New-XdrCheck -Id ROLE-01 -Status Pass -Subject 'XDR Read' -Detail 'permissions match'
    #>
    param([Parameter(Mandatory)][string]$Id, [Parameter(Mandatory)][ValidateSet('Pass', 'Fail', 'Warn', 'Info')][string]$Status, [string]$Subject = '', [string]$Detail = '')
    [pscustomobject][ordered]@{ Id = $Id; Status = $Status; Subject = $Subject; Detail = $Detail }
}

function Resolve-XdrInvoker {
    <#
    .SYNOPSIS
        The invoker a script uses: fixture mode when -FixturePath is given, otherwise live (Graph session
        checked against the settings).
    .EXAMPLE
        $inv = Resolve-XdrInvoker -Settings $s -FixturePath tests/fixtures/graph
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [string]$FixturePath)
    if ($FixturePath) { return New-XdrFixtureInvoker -Path $FixturePath }
    New-XdrLiveInvoker -Settings $Settings
}

function Get-XdrShortName {
    <#
    .SYNOPSIS
        A device name without its DNS suffix, in capitals, as the kit compares names.
    .EXAMPLE
        Get-XdrShortName 'wks-r0-01.contoso.example'
    #>
    # Device names compare without the DNS suffix and case: Defender reports the FQDN, inventories often don't.
    param([AllowNull()][AllowEmptyString()][string]$Name)
    if (-not $Name) { return '' }
    ($Name.Split('.')[0]).ToUpperInvariant()
}
