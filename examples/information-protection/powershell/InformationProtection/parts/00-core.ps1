# Core: files, values, settings, the declared calls, the snapshot, the run folder and its manifest.

# ----------------------------------------------------------------------------- files and values

function Read-IpJson {
    <#
    .SYNOPSIS
        Reads a JSON file as hashtables and arrays; date-like strings stay strings.
    .EXAMPLE
        Read-IpJson -Path config/calls.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "File not found: $Path" }
    ConvertFrom-IpJsonText -Text ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path))
}

function ConvertFrom-IpJsonText {
    <#
    .SYNOPSIS
        Parses JSON text as hashtables and arrays, keeping date-like strings as strings.
    .EXAMPLE
        ConvertFrom-IpJsonText -Text '{"a":1}'
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $Text = $Text.TrimStart([char]0xFEFF)
    if (-not $Text.Trim()) { return $null }
    $p = @{ AsHashtable = $true; Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String' }
    , ($Text | ConvertFrom-Json @p)
}

function ConvertTo-IpStableOrder {
    <#
    .SYNOPSIS
        A value whose plain hashtables have their keys sorted, so JSON comes out the same on Windows and Linux.
    .EXAMPLE
        ConvertTo-IpStableOrder @{ b = 1; a = 2 }
    #>
    param([AllowNull()]$Value)
    if ($Value -is [Collections.Specialized.OrderedDictionary]) {
        $o = [ordered]@{}; foreach ($k in $Value.Keys) { $o[$k] = ConvertTo-IpStableOrder $Value[$k] }; return $o
    }
    if ($Value -is [Collections.IDictionary]) {
        $o = [ordered]@{}; foreach ($k in ($Value.Keys | Sort-Object { "$_" })) { $o["$k"] = ConvertTo-IpStableOrder $Value[$k] }; return $o
    }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) { return , @($Value | ForEach-Object { ConvertTo-IpStableOrder $_ }) }
    $Value
}

function Write-IpText {
    <#
    .SYNOPSIS
        Writes text as UTF-8 without a byte order mark, with LF line endings.
    .EXAMPLE
        Write-IpText -Path out/x.txt -Text 'hello'
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), [Text.UTF8Encoding]::new($false))
}

function Write-IpJson {
    <#
    .SYNOPSIS
        Writes a value as UTF-8 JSON without a byte order mark, with LF line endings and stable key order.
    .EXAMPLE
        Write-IpJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()]$Value)
    Write-IpText -Path $Path -Text ((ConvertTo-Json -InputObject (ConvertTo-IpStableOrder $Value) -Depth 50) + "`n")
}

function Write-IpCsv {
    <#
    .SYNOPSIS
        Writes rows as CSV (every value quoted, LF line endings, UTF-8 without BOM). An empty list writes the
        header given by -Columns.
    .EXAMPLE
        Write-IpCsv -Path out/x.csv -Rows $rows -Columns Id, Status
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()][AllowEmptyCollection()][object[]]$Rows, [Parameter(Mandatory)][string[]]$Columns)
    $q = { param($v) '"' + ("$v" -replace '"', '""') + '"' }
    $lines = [Collections.Generic.List[string]]::new()
    $lines.Add((($Columns | ForEach-Object { & $q $_ }) -join ','))
    foreach ($r in @($Rows)) {
        if ($null -eq $r) { continue }
        $lines.Add((($Columns | ForEach-Object { $v = Get-IpV $r $_; if ($v -is [Collections.IList] -and $v -isnot [string]) { $v = ($v -join '; ') }; & $q $v }) -join ','))
    }
    Write-IpText -Path $Path -Text (($lines -join "`n") + "`n")
}

function Read-IpCsv {
    <#
    .SYNOPSIS
        Reads a CSV the agency keeps (a register, a plan); a missing file throws with its path.
    .EXAMPLE
        Read-IpCsv -Path tests/fixtures/inputs/exceptions.csv
    #>
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "File not found: $Path" }
    @(Import-Csv -LiteralPath $Path)
}

function Get-IpFileHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a file.
    .EXAMPLE
        Get-IpFileHash -Path config/calls.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-IpV {
    <#
    .SYNOPSIS
        A value by name from a hashtable or object, matching the name case-insensitively, or $null. With
        several names, the first one present wins (an export's property names can differ by module version).
    .EXAMPLE
        Get-IpV @{ mode = 'Enable' } 'Mode'
    #>
    param([AllowNull()]$Item, [Parameter(Mandatory)][string[]]$Name)
    if ($null -eq $Item) { return $null }
    foreach ($n in $Name) {
        if ($Item -is [Collections.IDictionary]) {
            foreach ($k in $Item.Keys) { if ("$k" -ieq $n) { return $Item[$k] } }
            continue
        }
        $p = $Item.PSObject.Properties | Where-Object { $_.Name -ieq $n } | Select-Object -First 1
        if ($p) { return $p.Value }
    }
    $null
}

function ConvertTo-IpList {
    <#
    .SYNOPSIS
        Always a list: $null is empty, one object is a list of one (ConvertTo-Json writes one result as an
        object, not an array).
    .EXAMPLE
        ConvertTo-IpList (Read-IpJson -Path labels.json)
    #>
    param([AllowNull()]$Value)
    if ($null -eq $Value) { return , @() }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) { return , @($Value) }
    , @($Value)
}

function ConvertTo-IpUtc {
    <#
    .SYNOPSIS
        Parses a date (string or DateTime) as UTC and returns it as yyyy-MM-ddTHH:mm:ssZ.
    .EXAMPLE
        ConvertTo-IpUtc '2026-11-24T12:00:00Z'
    #>
    param([Parameter(Mandatory)]$Value)
    $d = if ($Value -is [DateTime]) { $Value } else { [DateTime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) }
    $d.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
}

function Get-IpDate {
    <#
    .SYNOPSIS
        Parses a date as a UTC DateTime.
    .EXAMPLE
        Get-IpDate '2026-11-24'
    #>
    param([Parameter(Mandatory)]$Value)
    [DateTime]::Parse((ConvertTo-IpUtc $Value), [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
}

function Test-IpPlaceholder {
    <#
    .SYNOPSIS
        True when a value is empty or still a template placeholder such as <tenant-id>.
    .EXAMPLE
        Test-IpPlaceholder '<tenant-id>'
    #>
    param([AllowNull()][AllowEmptyString()][string]$Value)
    (-not $Value) -or ($Value -match '^<.*>$')
}

# ----------------------------------------------------------------------------- settings

# The clouds the kit runs in. The program's tenant is Microsoft 365 GCC (Moderate); 'commercial' is for a
# commercial test tenant. Learn ("Connect to Security & Compliance PowerShell"): Microsoft 365 and Microsoft
# 365 GCC need no ConnectionUri or AzureADAuthorizationEndpointUri, so both connect the same way. Any other
# name throws; there is no default.
$script:Clouds = @('gcc', 'commercial')

function Read-IpSettings {
    <#
    .SYNOPSIS
        Reads a settings file and checks it: environment lab, test or production; cloud gcc or commercial;
        the tenant; the inputs, resolved against the settings file's own folder. Throws on anything missing.
    .EXAMPLE
        Read-IpSettings -Path tests/fixtures/settings.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $s = Read-IpJson -Path $Path
    $dir = Split-Path -Parent (Resolve-Path -LiteralPath $Path).Path
    if ("$($s.environment)" -cnotin @('lab', 'test', 'production')) { throw "settings.environment must be lab, test or production, not '$($s.environment)'." }
    if ("$($s.cloud)" -cnotin $script:Clouds) { throw "Unknown cloud '$($s.cloud)'. Use gcc or commercial." }
    foreach ($k in 'tenantId', 'tenantDomain') { if (Test-IpPlaceholder "$($s[$k])") { throw "The settings file has no $k." } }
    if (-not $s.Contains('inputs')) { $s.inputs = @{} }
    foreach ($k in @($s.inputs.Keys)) {
        $v = "$($s.inputs[$k])"
        if ((Test-IpPlaceholder $v) -or [IO.Path]::IsPathRooted($v)) { continue }
        $s.inputs[$k] = [IO.Path]::GetFullPath((Join-Path $dir $v))
    }
    if (-not $s.Contains('reads')) { $s.reads = @{} }
    foreach ($k in 'rightsManagement', 'inventory') { if (-not $s.reads.Contains($k)) { $s.reads[$k] = $false } }
    $s._path = (Resolve-Path -LiteralPath $Path).Path
    $s
}

function Get-IpInput {
    <#
    .SYNOPSIS
        One input file's path from the settings (inputs.<name>). Throws when the settings name none.
    .EXAMPLE
        Get-IpInput -Settings $s -Name plan
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$Name)
    $v = if ($Settings.inputs.Contains($Name)) { "$($Settings.inputs[$Name])" } else { '' }
    if (Test-IpPlaceholder $v) { throw "The settings file names no '$Name' input (inputs.$Name)." }
    $v
}

function Get-IpPlan {
    <#
    .SYNOPSIS
        The agency's protection plan (inputs.plan): labels, label policies, Rights Management, message
        encryption, DLP and auto-labeling stages, audit and the synthetic events.
    .EXAMPLE
        Get-IpPlan -Settings $s
    #>
    param([Parameter(Mandatory)][hashtable]$Settings)
    Read-IpJson -Path (Get-IpInput -Settings $Settings -Name plan)
}

# ----------------------------------------------------------------------------- calls and the snapshot

function Get-IpCall {
    <#
    .SYNOPSIS
        The reads declared in config/calls.json, or the one with -Id. Each names its cmdlet, the shell it runs
        in, the file it writes, the role it needs and the Learn page that documents it.
    .EXAMPLE
        Get-IpCall | ForEach-Object id
    #>
    [CmdletBinding()]
    param([string]$Id)
    $calls = @((Read-IpJson -Path (Join-Path $script:ConfigRoot 'calls.json')).calls)
    if ($Id) {
        $c = @($calls | Where-Object { $_.id -eq $Id })
        if (-not $c.Count) { throw "Read '$Id' isn't declared in config/calls.json." }
        return $c[0]
    }
    $calls
}

function Get-IpRequiredPermission {
    <#
    .SYNOPSIS
        What the export needs: each read's cmdlet, shell, role and Learn page. -Task limits it to the reads one
        check uses.
    .EXAMPLE
        Get-IpRequiredPermission -Task labels
    #>
    [CmdletBinding()]
    param([string]$Task)
    foreach ($c in Get-IpCall) {
        if ($Task -and $Task -notin @($c.tasks)) { continue }
        [pscustomobject][ordered]@{ Read = $c.id; Cmdlet = $c.cmdlet; Shell = $c.shell; Role = $c.role; File = $c.file; Doc = $c.doc }
    }
}

function Read-IpSnapshot {
    <#
    .SYNOPSIS
        Reads a baseline export folder: one entry per declared read, keyed by its id, each a list (or $null
        when its file isn't there).
    .EXAMPLE
        (Read-IpSnapshot -Path tests/fixtures/snapshots/2026-11-24).labels.Count
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "Snapshot folder not found: $Path" }
    $snap = @{}
    foreach ($c in Get-IpCall) {
        $f = Join-Path $Path $c.file
        $snap[$c.id] = if (Test-Path -LiteralPath $f) { ConvertTo-IpList (Read-IpJson -Path $f) } else { $null }
    }
    $snap
}

function ConvertFrom-IpSettingList {
    <#
    .SYNOPSIS
        A label or label policy's Settings as a hashtable with lowercase keys. Accepts the "[key, value]"
        strings the cmdlets return, or a dictionary.
    .EXAMPLE
        ConvertFrom-IpSettingList @('[mandatory, true]')
    #>
    param([AllowNull()]$Settings)
    $h = @{}
    if ($null -eq $Settings) { return $h }
    if ($Settings -is [Collections.IDictionary]) { foreach ($k in $Settings.Keys) { $h["$k".ToLowerInvariant()] = "$($Settings[$k])" }; return $h }
    foreach ($s in @($Settings)) {
        if ("$s" -match '^\s*\[\s*([^,\]]+?)\s*,\s*(.*?)\s*\]\s*$') { $h[$Matches[1].ToLowerInvariant()] = $Matches[2] }
    }
    $h
}

# ----------------------------------------------------------------------------- the run folder

function New-IpRunFolder {
    <#
    .SYNOPSIS
        Empties or creates a run folder and returns its full path.
    .EXAMPLE
        New-IpRunFolder -OutputPath out/labels
    #>
    param([Parameter(Mandatory)][string]$OutputPath)
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    (Resolve-Path -LiteralPath $OutputPath).Path
}

function New-IpCheck {
    <#
    .SYNOPSIS
        One check result: Id, Status (Pass, Fail, Warn, Info), Subject and Detail.
    .EXAMPLE
        New-IpCheck -Id LBL-01 -Status Pass -Subject 'CUI Basic' -Detail 'matches the plan'
    #>
    param([Parameter(Mandatory)][string]$Id, [Parameter(Mandatory)][ValidateSet('Pass', 'Fail', 'Warn', 'Info')][string]$Status, [string]$Subject = '', [string]$Detail = '')
    [pscustomobject][ordered]@{ Id = $Id; Status = $Status; Subject = $Subject; Detail = $Detail }
}

function Write-IpManifest {
    <#
    .SYNOPSIS
        Writes manifest.json in a run folder: the task, time, mode, environment, cloud, the result, the
        snapshot it read with that snapshot's manifest hash, and the SHA-256 of every other file.
    .EXAMPLE
        Write-IpManifest -OutputPath out/labels -Task labels -AsOf 2026-11-24T12:00:00Z -Settings $s -Result Fail
    #>
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][string]$AsOf,
        [Parameter(Mandatory)][hashtable]$Settings, [string]$Result = 'Pass', [string]$Mode = 'Fixture', [string]$SnapshotPath = '', [hashtable]$Extra = @{})
    $root = (Resolve-Path -LiteralPath $OutputPath).Path.TrimEnd('\', '/')
    $files = [ordered]@{}
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'manifest.json' | Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') })) {
        $files[$f.FullName.Substring($root.Length + 1).Replace('\', '/')] = Get-IpFileHash -Path $f.FullName
    }
    $snap = $null
    if ($SnapshotPath) {
        $sm = Join-Path $SnapshotPath 'manifest.json'
        $snap = [ordered]@{ path = (Split-Path -Leaf (Resolve-Path -LiteralPath $SnapshotPath).Path); manifestSha256 = $(if (Test-Path -LiteralPath $sm) { Get-IpFileHash -Path $sm } else { $null }) }
    }
    $m = [ordered]@{
        schema = 'fmp-ip-manifest/1'; task = $Task; asOf = (ConvertTo-IpUtc $AsOf); mode = $Mode; environment = "$($Settings.environment)"
        cloud = "$($Settings.cloud)"; kit = 'examples/information-protection'; result = $Result; snapshot = $snap; files = $files
    }
    foreach ($k in ($Extra.Keys | Sort-Object)) { $m[$k] = $Extra[$k] }
    Write-IpJson -Path (Join-Path $root 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $root 'manifest.json')
}

function Complete-IpRun {
    <#
    .SYNOPSIS
        Ends a check's run: writes results.csv, the manifest (Fail when any row failed), and returns the run.
    .EXAMPLE
        Complete-IpRun -Task labels -Rows $rows -OutputPath $out -AsOf $AsOf -Settings $s -SnapshotPath $snap
    #>
    param([Parameter(Mandatory)][string]$Task, [AllowEmptyCollection()][object[]]$Rows, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [Parameter(Mandatory)][hashtable]$Settings, [string]$SnapshotPath = '', [string]$Mode = 'Fixture')
    $Rows = @($Rows | Where-Object { $null -ne $_ })
    Write-IpCsv -Path (Join-Path $OutputPath 'results.csv') -Rows $Rows -Columns Id, Status, Subject, Detail
    $result = if (@($Rows | Where-Object Status -EQ 'Fail').Count) { 'Fail' } else { 'Pass' }
    $null = Write-IpManifest -OutputPath $OutputPath -Task $Task -AsOf $AsOf -Settings $Settings -Result $result -Mode $Mode -SnapshotPath $SnapshotPath
    [pscustomobject]@{ Task = $Task; Result = $result; Rows = $Rows; OutputPath = $OutputPath }
}

function Get-IpRequirements {
    <#
    .SYNOPSIS
        config/requirements.json: each step's NIST SP 800-53 Rev 5 controls and KSIs, and the steps each stage
        must have evidence for.
    .EXAMPLE
        (Get-IpRequirements).steps.LABELS.controls
    #>
    Read-IpJson -Path (Join-Path $script:ConfigRoot 'requirements.json')
}
