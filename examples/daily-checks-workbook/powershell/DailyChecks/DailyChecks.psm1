#Requires -Version 7.1
<#
    DailyChecks: the kit behind the Daily Checks Dashboard implementation guide. It builds one Azure Monitor
    workbook ("Daily checks", one tab per daily check in Book 15, Chapter 12) from a manifest and the tabs'
    KQL files, validates any copy of the workbook's gallery template against the manifest, renders what each
    tab would show from fixture query results, plans the deployment (ARM parameters, the what-if and create
    commands, a SHA-256 to approve), deploys only with -Apply and that hash, checks each tab's tables answer,
    and records the template, the plan, the deployment and the checks as hashed, chained evidence tagged
    with NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs.

    The workbook is a view, not evidence. The kit refuses to record a rendered view as evidence: the
    evidence is the record each check writes and the task each finding opens. Commercial Azure only
    (Microsoft 365 GCC Moderate pairs with it). Illustrative: tested against fixtures, not run against a
    live workspace.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:Runner = $null
$script:Clouds = @{ AzureCloud = @{ Arm = 'https://management.azure.com'; Portal = 'https://portal.azure.com' } }
$script:Statuses = @('ATTENTION', 'STALE', 'NO DATA', 'CLEAR', 'LINK-OUT')

# ----------------------------------------------------------------------------- files and JSON

function Read-DcJson {
    <#
    .SYNOPSIS
        Reads a JSON file as hashtables and arrays, keeping date-like strings as strings where PowerShell allows it.
    .EXAMPLE
        Read-DcJson -Path config/manifest.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    ConvertFrom-DcJsonText -Text ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path))
}

function ConvertFrom-DcJsonText {
    <#
    .SYNOPSIS
        Parses JSON text as hashtables and arrays (DateKind String where the parser supports it).
    .EXAMPLE
        ConvertFrom-DcJsonText -Text '{"a":1}'
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    if (-not $Text.Trim()) { return $null }
    $p = @{ AsHashtable = $true; Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String' }
    , ($Text | ConvertFrom-Json @p)
}

function ConvertTo-DcSorted {
    <#
    .SYNOPSIS
        Returns a copy of a value with every dictionary's keys in ordinal order and dates as UTC ISO strings,
        so the JSON it becomes is the same on Windows and Linux PowerShell.
    .EXAMPLE
        ConvertTo-DcSorted @{ b = 1; a = 2 }
    #>
    param([AllowNull()]$Value)
    if ($null -eq $Value) { return $null }
    if ($Value -is [datetime]) { return $Value.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ', [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [datetimeoffset]) { return $Value.UtcDateTime.ToString('yyyy-MM-ddTHH:mm:ssZ', [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [string] -or $Value -is [ValueType]) { return $Value }
    if ($Value -is [Collections.IDictionary]) {
        $o = [ordered]@{}
        $keys = [string[]]@($Value.Keys)
        [Array]::Sort($keys, [StringComparer]::Ordinal)
        foreach ($k in $keys) { $o[$k] = ConvertTo-DcSorted $Value[$k] }
        return $o
    }
    if ($Value -is [Collections.IEnumerable]) { return , @(foreach ($x in $Value) { ConvertTo-DcSorted $x }) }
    if ($Value -is [psobject]) {
        $h = @{}
        foreach ($p in $Value.PSObject.Properties) { $h[$p.Name] = $p.Value }
        return ConvertTo-DcSorted $h
    }
    $Value
}

function ConvertTo-DcJson {
    <#
    .SYNOPSIS
        A value as JSON with sorted keys and LF line endings; -Compress for one line.
    .EXAMPLE
        ConvertTo-DcJson @{ b = 1; a = 2 } -Compress
    #>
    param([AllowNull()]$Value, [switch]$Compress)
    $json = ConvertTo-Json -InputObject (ConvertTo-DcSorted $Value) -Depth 100 -Compress:$Compress
    $json -replace "`r`n", "`n"
}

function Write-DcJson {
    <#
    .SYNOPSIS
        Writes a value as UTF-8 JSON (no byte order mark, sorted keys, LF), creating the folder.
    .EXAMPLE
        Write-DcJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()]$Value)
    Write-DcText -Path $Path -Text ((ConvertTo-DcJson $Value) + "`n")
}

function Write-DcText {
    <#
    .SYNOPSIS
        Writes text as UTF-8 without a byte order mark, with LF line endings, creating the folder.
    .EXAMPLE
        Write-DcText -Path out/x.txt -Text "one`n"
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), [Text.UTF8Encoding]::new($false))
}

function Get-DcFileHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a file.
    .EXAMPLE
        Get-DcFileHash -Path workbook/daily-checks.workbook.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-DcTextHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a string's UTF-8 bytes.
    .EXAMPLE
        Get-DcTextHash -Text 'daily checks'
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    ([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($Text)) | ForEach-Object { $_.ToString('x2') }) -join ''
}

function ConvertTo-DcUtc {
    <#
    .SYNOPSIS
        A timestamp (string or date) as a UTC [datetime]; throws on anything else. Culture-independent.
    .EXAMPLE
        ConvertTo-DcUtc '2026-11-16T07:30:00Z'
    #>
    param([Parameter(Mandatory)]$Value)
    if ($Value -is [datetime]) { return $Value.ToUniversalTime() }
    if ($Value -is [datetimeoffset]) { return $Value.UtcDateTime }
    $styles = [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal
    [datetime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture, $styles)
}

function Format-DcUtc {
    <#
    .SYNOPSIS
        A UTC timestamp as yyyy-MM-ddTHH:mm:ssZ.
    .EXAMPLE
        Format-DcUtc (Get-Date)
    #>
    param([Parameter(Mandatory)]$Value)
    (ConvertTo-DcUtc $Value).ToString('yyyy-MM-ddTHH:mm:ssZ', [Globalization.CultureInfo]::InvariantCulture)
}

function Get-DcOrdinal {
    <#
    .SYNOPSIS
        Strings in ordinal order, optionally unique: the same order on every platform and culture.
    .EXAMPLE
        Get-DcOrdinal -Value 'b', 'a', 'a' -Unique
    #>
    param([AllowNull()][AllowEmptyCollection()][object[]]$Value, [switch]$Unique)
    $a = [string[]]@($Value | Where-Object { $null -ne $_ } | ForEach-Object { "$_" })
    if ($Unique) { $a = [string[]]@([Collections.Generic.HashSet[string]]::new($a, [StringComparer]::Ordinal)) }
    [Array]::Sort($a, [StringComparer]::Ordinal)
    $a
}

function Get-DcRelativePath {
    param([Parameter(Mandatory)][string]$Root, [Parameter(Mandatory)][string]$Path)
    [IO.Path]::GetRelativePath($Root, $Path).Replace('\', '/')
}

function Write-DcManifest {
    <#
    .SYNOPSIS
        Writes manifest.json in a run folder: the task, its metadata and the SHA-256 of every other file.
    .EXAMPLE
        Write-DcManifest -Path out/validate -Task validate -Meta @{ mode = 'Fixture' }
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Task, [hashtable]$Meta = @{})
    $root = (Resolve-Path -LiteralPath $Path).Path
    $files = @{}
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'manifest.json')) {
        $files[(Get-DcRelativePath -Root $root -Path $f.FullName)] = Get-DcFileHash -Path $f.FullName
    }
    $m = @{ schema = 'fmp-dc-run/1'; task = $Task; files = $files }
    foreach ($k in $Meta.Keys) { $m[$k] = $Meta[$k] }
    Write-DcJson -Path (Join-Path $root 'manifest.json') -Value $m
}

function Test-DcRunFolder {
    <#
    .SYNOPSIS
        Re-hashes every file a run folder's manifest.json lists. Returns @{ Ok; Detail; Manifest }.
    .EXAMPLE
        Test-DcRunFolder -Path out/validate
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-DcJson -Path $mp
    $bad = @()
    foreach ($k in (Get-DcOrdinal -Value @($m.files.Keys))) {
        $fp = Join-Path $Path $k
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$k missing" } elseif ((Get-DcFileHash -Path $fp) -ne $m.files[$k]) { $bad += "$k changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) $(if ($m.files.Count -eq 1) { 'file matches' } else { 'files match' }) the manifest" }); Manifest = $m }
}

# ----------------------------------------------------------------------------- manifest and settings

function Get-DcManifest {
    <#
    .SYNOPSIS
        The kit's manifest (config/manifest.json): the tabs, their daily checks, tables, queries, link-outs,
        GCC notes and render rules.
    .EXAMPLE
        (Get-DcManifest).tabs.Count
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:KitRoot 'config/manifest.json'))
    Read-DcJson -Path $Path
}

function Get-DcRequirements {
    <#
    .SYNOPSIS
        The steps, their SP 800-53 controls and KSIs, and each stage's required steps (config/requirements.json).
    .EXAMPLE
        (Get-DcRequirements).steps.PLAN.controls
    #>
    Read-DcJson -Path (Join-Path $script:KitRoot 'config/requirements.json')
}

function Get-DcTab {
    <#
    .SYNOPSIS
        One row per tab: id, title, kind, fit, the daily check it shows, its tables and link-outs.
    .EXAMPLE
        Get-DcTab | Format-Table Id, Kind, Fit, Tables
    #>
    [CmdletBinding()]
    param([string]$Id, [string]$ManifestPath = (Join-Path $script:KitRoot 'config/manifest.json'))
    $m = Get-DcManifest -Path $ManifestPath
    foreach ($t in $m.tabs) {
        if ($Id -and $t.id -ne $Id) { continue }
        [pscustomobject][ordered]@{
            Id = $t.id; Title = $t.title; Kind = $t.kind; Fit = $t.fit; Check = $t.check
            Tables = (@($t.tables) -join ', '); Queries = @($t.queries).Count
            LinkOuts = (@($t.linkOuts | ForEach-Object { $_.name }) -join '; '); Gcc = $t.gcc
        }
    }
}

function Read-DcSettings {
    <#
    .SYNOPSIS
        Reads an environment's settings file and checks it: no <placeholder> left, commercial Azure
        (AzureCloud) named explicitly, and IDs in the expected shapes. Throws on the first problem.
    .EXAMPLE
        Read-DcSettings -Path tests/fixtures/settings.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $raw = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    $s = ConvertFrom-DcJsonText -Text $raw
    $vals = foreach ($k in $s.Keys) {
        if ($k -eq '_comment') { continue }
        if ($k -eq 'testEvidencePath' -and $s['environment'] -ne 'production') { continue }
        @($s[$k]) | ForEach-Object { "$_" }
    }
    $left = @(Get-DcOrdinal -Value @([regex]::Matches(($vals -join "`n"), '<[a-z][a-z0-9-]*>') | ForEach-Object Value) -Unique)
    if ($left.Count) { throw "Settings file $Path still has placeholders: $($left -join ', ')" }
    foreach ($k in 'environment', 'cloud', 'tenantId', 'subscriptionId', 'resourceGroup', 'location', 'workspaceResourceId', 'workspaceCustomerId', 'workbookDisplayName', 'emergencyAccessObjectIds', 'compliantStateValue', 'dlpProductNames', 'itsmQueueUrl', 'outputRoot', 'evidencePath') {
        if (-not $s.Contains($k)) { throw "Settings file $Path has no '$k'." }
    }
    if (-not ($script:Clouds.Keys -ccontains $s.cloud)) { throw "Unknown cloud '$($s.cloud)'. The kit deploys to commercial Azure only: use AzureCloud." }
    if ($s.environment -notin 'lab', 'test', 'production') { throw "environment must be lab, test or production, not '$($s.environment)'." }
    if ($s.workspaceResourceId -notmatch '^/subscriptions/[^/]+/resourceGroups/[^/]+/providers/Microsoft\.OperationalInsights/workspaces/[^/]+$') { throw "workspaceResourceId isn't a Log Analytics workspace resource ID." }
    if (@($s.emergencyAccessObjectIds).Count -lt 2) { throw 'emergencyAccessObjectIds needs the two or more emergency access accounts Microsoft recommends.' }
    $s
}

# ----------------------------------------------------------------------------- the template

function Get-DcQueryText {
    param([Parameter(Mandatory)][string]$File)
    ([IO.File]::ReadAllText((Join-Path $script:KitRoot "queries/$File")) -replace "`r`n", "`n").TrimEnd("`n")
}

function Get-DcTabText {
    param([Parameter(Mandatory)][Collections.IDictionary]$Tab, [Parameter(Mandatory)][string]$Banner)
    $lines = @("## $($Tab.title)", '', "**$Banner**", '', "**Daily check:** $($Tab.check).", '', "**What to do:** $($Tab.action)", '')
    if (@($Tab.linkOuts).Count) {
        $lines += '**Where else to look:**'
        foreach ($l in $Tab.linkOuts) { $lines += "- [$($l.name)]($($l.url)): $($l.path)" }
        $lines += ''
    }
    $lines += "**GCC:** $($Tab.gcc)"
    $lines -join "`n"
}

function New-DcTemplate {
    <#
    .SYNOPSIS
        Builds the workbook's gallery template (Notebook/1.0) from the manifest and queries/*.kql: a header,
        the parameters, one tab link per daily check, and one group per tab with its banner, link-outs and
        queries, every query scoped to the {Workspace} parameter. No IDs: the deployment plan fills them.
    .EXAMPLE
        New-DcTemplate | ConvertTo-DcJson | Set-Content out/template.json
    #>
    [CmdletBinding()]
    param([string]$ManifestPath = (Join-Path $script:KitRoot 'config/manifest.json'))
    $m = Get-DcManifest -Path $ManifestPath
    $rt = $m.workbook.resourceType
    $params = @(foreach ($p in $m.parameters) {
            $x = [ordered]@{ id = "param-$($p.name.ToLowerInvariant())"; version = 'KqlParameterItem/1.0'; name = $p.name; label = $p.name; description = $p.purpose; isRequired = $true; value = $null }
            if ($p.type -eq 'workspace') { $x.type = 5; $x.typeSettings = [ordered]@{ resourceTypeFilter = [ordered]@{ $rt = $true }; additionalResourceOptions = @() } }
            else { $x.type = 1; $x.isHiddenWhenLocked = $true }
            $x
        })
    $items = [Collections.Generic.List[object]]::new()
    $items.Add([ordered]@{ type = 1; name = 'header'; content = [ordered]@{ json = "# $($m.workbook.displayName)`n`n**$($m.banner)**`n`nOne tab per daily check in the operator runbook. A tab that reads CLEAR only means its query returned nothing: check the Telemetry completeness tab first." } })
    $items.Add([ordered]@{ type = 9; name = 'parameters'; content = [ordered]@{ version = 'KqlParameterItem/1.0'; parameters = $params; style = 'pills'; queryType = 0; resourceType = $rt } })
    $links = @(foreach ($t in $m.tabs) { [ordered]@{ id = "link-$($t.id)"; cellValue = 'selectedTab'; linkTarget = 'parameter'; linkLabel = $t.title; subTarget = $t.id; style = 'link' } })
    $items.Add([ordered]@{ type = 11; name = 'tabs'; content = [ordered]@{ version = 'LinkItem/1.0'; style = 'tabs'; links = $links } })
    foreach ($t in $m.tabs) {
        $g = [Collections.Generic.List[object]]::new()
        $g.Add([ordered]@{ type = 1; name = "$($t.id)-text"; content = [ordered]@{ json = (Get-DcTabText -Tab $t -Banner $m.banner) } })
        foreach ($q in $t.queries) {
            $g.Add([ordered]@{ type = 3; name = $q.id; content = [ordered]@{
                        version = 'KqlItem/1.0'; query = (Get-DcQueryText -File $q.file); size = 0; title = $q.title
                        queryType = 0; resourceType = $rt; crossComponentResources = @('{Workspace}'); visualization = 'table'
                    }
                })
        }
        $items.Add([ordered]@{ type = 12; name = "tab-$($t.id)"; conditionalVisibility = [ordered]@{ parameterName = 'selectedTab'; comparison = 'isEqualTo'; value = $t.id }; content = [ordered]@{ version = 'NotebookGroup/1.0'; groupType = 'editable'; items = $g.ToArray() } })
    }
    [ordered]@{ version = $m.workbook.schema; items = $items.ToArray(); isLocked = $false; fallbackResourceIds = @() }
}

# ----------------------------------------------------------------------------- the validator

function Get-DcItems {
    param([AllowNull()]$Items)
    foreach ($i in @($Items)) {
        if ($i -isnot [Collections.IDictionary]) { continue }
        $i
        if ($i.Contains('content') -and $i.content -is [Collections.IDictionary] -and $i.content.Contains('items')) { Get-DcItems $i.content.items }
    }
}

function Get-DcLookbackHours {
    param([Parameter(Mandatory)][string]$Query)
    $max = 0
    foreach ($x in [regex]::Matches($Query, 'ago\(\s*(\d+)\s*([dhm])\s*\)')) {
        $n = [int]$x.Groups[1].Value
        $h = switch ($x.Groups[2].Value) { 'd' { $n * 24 } 'h' { $n } 'm' { [math]::Ceiling($n / 60) } }
        if ($h -gt $max) { $max = $h }
    }
    $max
}

function Test-DcTemplate {
    <#
    .SYNOPSIS
        Checks a workbook gallery template (the kit's, or one exported from the portal's Advanced Editor)
        against the manifest, DC-V-01 to DC-V-10. One row per check and tab: Check, Tab, Status, Detail.
    .EXAMPLE
        Test-DcTemplate -Path workbook/daily-checks.workbook.json | Where-Object Status -EQ 'Fail'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$ManifestPath = (Join-Path $script:KitRoot 'config/manifest.json'))
    $m = Get-DcManifest -Path $ManifestPath
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $tab, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Tab = $tab; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $raw = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    try { $wb = ConvertFrom-DcJsonText -Text $raw } catch { & $add 'DC-V-01' '' $false "not JSON: $($_.Exception.Message)"; return $rows.ToArray() }
    $okVer = ($wb -is [Collections.IDictionary]) -and $wb.Contains('version') -and $wb.version -eq $m.workbook.schema -and $wb.Contains('items')
    & $add 'DC-V-01' '' $okVer $(if ($okVer) { "$($m.workbook.schema), $(@($wb.items).Count) top-level items" } else { "not a $($m.workbook.schema) gallery template" })
    if (-not $okVer) { return $rows.ToArray() }

    $all = @(Get-DcItems $wb.items)
    $tabsItem = @($all | Where-Object { $_.type -eq 11 })
    $linked = @(if ($tabsItem.Count) { @($tabsItem[0].content.links) | ForEach-Object { $_.subTarget } })
    $want = @($m.tabs | ForEach-Object { $_.id })
    $okTabs = (($linked -join '|') -eq ($want -join '|'))
    & $add 'DC-V-02' '' $okTabs $(if ($okTabs) { "$($want.Count) tabs, one per daily check, in the manifest's order" } else { "tabs [$($linked -join ', ')] don't match the manifest [$($want -join ', ')]" })

    $known = @($m.tabs | ForEach-Object { $_.tables } | Sort-Object -Unique)
    foreach ($t in $m.tabs) {
        $groups = @($all | Where-Object { $_.type -eq 12 -and $_.Contains('conditionalVisibility') -and $_.conditionalVisibility.value -eq $t.id })
        if ($groups.Count -ne 1) { & $add 'DC-V-02' $t.id $false "$($groups.Count) groups show when selectedTab is '$($t.id)'"; continue }
        $inner = @(Get-DcItems $groups[0].content.items)
        $queries = @($inner | Where-Object { $_.type -eq 3 })
        $texts = (@($inner | Where-Object { $_.type -eq 1 } | ForEach-Object { "$($_.content.json)" }) -join "`n")
        $qtext = (@($queries | ForEach-Object { "$($_.content.query)" }) -join "`n")

        # DC-V-03: the tab's queries read its declared tables, and no other known table.
        if ($t.kind -eq 'workbook') {
            $missing = @($t.tables | Where-Object { $qtext -notmatch "\b$([regex]::Escape($_))\b" })
            $extra = @($known | Where-Object { $_ -notin $t.tables -and $qtext -match "\b$([regex]::Escape($_))\b" })
            & $add 'DC-V-03' $t.id (-not $missing.Count -and -not $extra.Count) $(if ($missing.Count -or $extra.Count) { (@($(if ($missing.Count) { "doesn't read $($missing -join ', ')" }), $(if ($extra.Count) { "reads undeclared $($extra -join ', ')" })) | Where-Object { $_ }) -join '; ' } else { "reads $($t.tables -join ', ')" })
        }
        # DC-V-04: every query has a look-back within the manifest's limit.
        foreach ($q in $queries) {
            $spec = @($t.queries | Where-Object { $_.id -eq $q.name })
            $lb = Get-DcLookbackHours -Query "$($q.content.query)"
            $limit = if ($spec.Count) { [int]$spec[0].lookbackHours } else { 0 }
            & $add 'DC-V-04' $t.id ($lb -gt 0 -and $spec.Count -and $lb -le $limit) $(if (-not $spec.Count) { "query '$($q.name)' isn't in the manifest" } elseif ($lb -eq 0) { "query '$($q.name)' has no ago() look-back" } elseif ($lb -gt $limit) { "query '$($q.name)' looks back $lb h, more than $limit h" } else { "$($q.name): $lb h of $limit h" })
            # DC-V-05: every query reads the workspace parameter, as a Logs query.
            $c = $q.content
            $okWs = ($c.Contains('crossComponentResources') -and (@($c.crossComponentResources) -join '|') -eq '{Workspace}' -and "$($c.resourceType)" -eq $m.workbook.resourceType -and "$($c.queryType)" -eq '0')
            & $add 'DC-V-05' $t.id $okWs $(if ($okWs) { "$($q.name) reads {Workspace}" } else { "$($q.name) isn't scoped to the {Workspace} parameter as a Logs query" })
        }
        # DC-V-06: the banner.
        & $add 'DC-V-06' $t.id ($texts.Contains($m.banner)) $(if ($texts.Contains($m.banner)) { 'not-evidence banner present' } else { 'the not-evidence banner is missing' })
        # DC-V-07: each manifest link-out is on the tab.
        $lo = @($t.linkOuts | Where-Object { -not $texts.Contains("]($($_.url))") } | ForEach-Object { $_.name })
        & $add 'DC-V-07' $t.id (-not $lo.Count) $(if ($lo.Count) { "link-outs missing: $($lo -join ', ')" } else { "$(@($t.linkOuts).Count) link-outs present" })
        # DC-V-08: link-out tabs have no query; workbook tabs have at least one.
        $okKind = if ($t.kind -eq 'link-out') { $queries.Count -eq 0 } else { $queries.Count -ge 1 -and $queries.Count -eq @($t.queries).Count }
        & $add 'DC-V-08' $t.id $okKind "$($t.kind) tab with $($queries.Count) queries (manifest: $(@($t.queries).Count))"
        # DC-V-09: the telemetry tab's expected list equals the manifest's.
        if ($t.id -eq 'telemetry') {
            $dt = [regex]::Match($qtext, 'datatable\([^)]*\)\s*\[(.*?)\]', 'Singleline')
            $pairs = @(if ($dt.Success) { [regex]::Matches($dt.Groups[1].Value, '"([A-Za-z0-9_]+)"\s*,\s*(\d+)') | ForEach-Object { "$($_.Groups[1].Value)=$($_.Groups[2].Value)" } })
            $exp = @($m.expectedTables | ForEach-Object { "$($_.table)=$($_.slaMinutes)" })
            $same = (($pairs | Sort-Object) -join '|') -eq (($exp | Sort-Object) -join '|')
            & $add 'DC-V-09' $t.id $same $(if ($same) { "$($exp.Count) expected tables with their limits" } else { "expected list [$($pairs -join ', ')] doesn't match the manifest [$($exp -join ', ')]" })
        }
    }

    # DC-V-07 (hosts) and DC-V-10 (no identifiers or secrets), over the whole file.
    $badHosts = @([regex]::Matches($raw, 'https?://([A-Za-z0-9.-]+)') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -notin $m.allowedHosts } | Sort-Object -Unique)
    & $add 'DC-V-07' '' (-not $badHosts.Count) $(if ($badHosts.Count) { "links to hosts not allowed: $($badHosts -join ', ')" } else { 'every link goes to an allowed host or a parameter' })
    $found = @()
    if ($raw -match '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}') { $found += 'a GUID' }
    if ($raw -match '(?i)/subscriptions/') { $found += 'a subscription path' }
    if ($raw -match '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}') { $found += 'an e-mail address' }
    if ($raw -match '(?i)(bearer\s+[A-Za-z0-9._-]{10,}|sharedkey|client_secret|"password"|accountkey=)') { $found += 'a credential' }
    if (@($wb.fallbackResourceIds).Count) { $found += 'fallbackResourceIds set' }
    $vals = @($all | Where-Object { $_.type -eq 9 } | ForEach-Object { @($_.content.parameters) } | Where-Object { $_.Contains('value') -and $null -ne $_.value -and "$($_.value)" -ne '' } | ForEach-Object { $_.name })
    if ($vals.Count) { $found += "parameter values set ($($vals -join ', '))" }
    & $add 'DC-V-10' '' (-not $found.Count) $(if ($found.Count) { "the template carries $($found -join ', '): the deployment plan fills IDs, never the template" } else { 'no IDs, addresses or secrets in the template' })
    $rows.ToArray()
}

function Invoke-DcValidate {
    <#
    .SYNOPSIS
        Validates a template, writes results.json and a hashed manifest.json (task validate) to OutputPath,
        and returns the rows. A validation for the test or production stage (-Environment) is recorded as a
        live record; a lab validation as a fixture record.
    .EXAMPLE
        Invoke-DcValidate -TemplatePath workbook/daily-checks.workbook.json -OutputPath out/validate -AsOf 2026-11-16T07:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$TemplatePath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [string]$Environment = 'lab')
    $rows = @(Test-DcTemplate -Path $TemplatePath)
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-DcJson -Path (Join-Path $OutputPath 'results.json') -Value @($rows | ForEach-Object { @{ check = $_.Check; tab = $_.Tab; status = $_.Status; detail = $_.Detail } })
    $fail = @($rows | Where-Object Status -EQ 'Fail').Count
    Write-DcManifest -Path $OutputPath -Task 'validate' -Meta @{ recordedAt = (Format-DcUtc $AsOf); environment = $Environment; mode = $(if ($Environment -eq 'lab') { 'Fixture' } else { 'Live' }); templateSha256 = (Get-DcFileHash -Path $TemplatePath); result = $(if ($fail) { 'Fail' } else { 'Pass' }); failed = $fail }
    $rows
}

# ----------------------------------------------------------------------------- the renderer

function Test-DcFlag {
    param([Parameter(Mandatory)][Collections.IDictionary]$Row, [Parameter(Mandatory)][Collections.IDictionary]$Rule, [Parameter(Mandatory)][datetime]$AsOf)
    if ($Rule.Contains('query') -and $Rule.query -and "$($Row['query'])" -ne $Rule.query) { return $false }
    switch ($Rule.op) {
        'any' { return $true }
        'eq' { return "$($Row[$Rule.column])" -eq "$($Rule.value)" }
        'older-than-column' {
            $v = $Row[$Rule.column]
            if ($null -eq $v -or "$v" -eq '') { return $true }
            return (($AsOf - (ConvertTo-DcUtc $v)).TotalMinutes -gt [double]$Row[$Rule.limitColumn])
        }
        default { throw "Unknown render op '$($Rule.op)'." }
    }
}

function Get-DcRender {
    <#
    .SYNOPSIS
        What each tab would show, from fixture query results: ATTENTION (rows that need work), CLEAR (the
        query returned nothing to do and its sources are fresh), STALE (a source the tab depends on is past
        its freshness limit, so an empty queue proves nothing), NO DATA (no result where one is expected), or
        LINK-OUT (the check lives in another portal). A stale source never renders CLEAR.
    .EXAMPLE
        Get-DcRender -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z | Format-Table Tab, Status, Flagged, Detail
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$FixturePath, [Parameter(Mandatory)][string]$AsOf, [string]$ManifestPath = (Join-Path $script:KitRoot 'config/manifest.json'))
    $m = Get-DcManifest -Path $ManifestPath
    $now = ConvertTo-DcUtc $AsOf
    foreach ($t in $m.tabs) {
        $out = [ordered]@{ Tab = $t.id; Title = $t.title; Status = ''; Flagged = 0; Rows = 0; Stale = ''; Detail = '' }
        if ($t.kind -eq 'link-out') {
            $out.Status = 'LINK-OUT'; $out.Detail = "Open $(@($t.linkOuts | ForEach-Object { $_.name }) -join '; ')"
            [pscustomobject]$out; continue
        }
        $fp = Join-Path $FixturePath "$($t.id).json"
        if (-not (Test-Path -LiteralPath $fp)) { $out.Status = 'NO DATA'; $out.Detail = 'no query result'; [pscustomobject]$out; continue }
        $f = Read-DcJson -Path $fp
        $rows = @(if ($f.Contains('rows')) { $f.rows })
        $out.Rows = $rows.Count
        $stale = @()
        foreach ($src in (Get-DcOrdinal -Value @($t.render.freshness.Keys))) {
            $limit = [double]$t.render.freshness[$src]
            $seen = if ($f.Contains('sources') -and $f.sources.Contains($src)) { $f.sources[$src] } else { $null }
            if ($null -eq $seen -or "$seen" -eq '') { $stale += "$src never seen" ; continue }
            $age = [math]::Floor(($now - (ConvertTo-DcUtc $seen)).TotalMinutes)
            if ($age -gt $limit) { $stale += "$src $age min old (limit $limit)" }
        }
        $flagged = @($rows | Where-Object { $r = $_; @($t.render.flag | Where-Object { Test-DcFlag -Row $r -Rule $_ -AsOf $now }).Count -gt 0 })
        $out.Flagged = $flagged.Count
        $out.Stale = $stale -join '; '
        if ($stale.Count) { $out.Status = 'STALE'; $out.Detail = "Not current: $($stale -join '; ')$(if ($rows.Count) { "; the $($rows.Count) rows shown may be incomplete" })" }
        elseif ($flagged.Count) { $out.Status = 'ATTENTION'; $out.Detail = "$($flagged.Count) of $($rows.Count) rows need work" }
        elseif (-not $rows.Count -and $t.render.emptyMeans -eq 'no-data') { $out.Status = 'NO DATA'; $out.Detail = 'the query returned nothing where a row is expected' }
        else { $out.Status = 'CLEAR'; $out.Detail = $(if ($rows.Count) { "$($rows.Count) rows, none flagged" } else { 'nothing to work, sources fresh' }) }
        [pscustomobject]$out
    }
}

function Invoke-DcRender {
    <#
    .SYNOPSIS
        Renders every tab from a fixture folder and writes render.json, render.md and manifest.json (task
        render) to OutputPath. The output is a picture for the lab, never evidence: Write-DcEvidence refuses it.
    .EXAMPLE
        Invoke-DcRender -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z -OutputPath out/day1
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$FixturePath, [Parameter(Mandatory)][string]$AsOf, [Parameter(Mandatory)][string]$OutputPath)
    $m = Get-DcManifest
    $r = @(Get-DcRender -FixturePath $FixturePath -AsOf $AsOf)
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-DcJson -Path (Join-Path $OutputPath 'render.json') -Value @{ asOf = (Format-DcUtc $AsOf); notEvidence = $m.banner; tabs = @($r | ForEach-Object { @{ tab = $_.Tab; title = $_.Title; status = $_.Status; flagged = $_.Flagged; rows = $_.Rows; stale = $_.Stale; detail = $_.Detail } }) }
    $md = @("# Daily checks, as of $(Format-DcUtc $AsOf)", '', "**$($m.banner)**", '', '| Tab | Shows | Detail |', '|---|---|---|')
    $md += @($r | ForEach-Object { "| $($_.Title) | $($_.Status) | $($_.Detail) |" })
    Write-DcText -Path (Join-Path $OutputPath 'render.md') -Text (($md -join "`n") + "`n")
    Write-DcManifest -Path $OutputPath -Task 'render' -Meta @{ recordedAt = (Format-DcUtc $AsOf); mode = 'Fixture'; notEvidence = $true }
    $r
}

# ----------------------------------------------------------------------------- runner (az), stand-in for tests

function Set-DcRunner {
    <#
    .SYNOPSIS
        Replaces the az runner with a scriptblock (tests use it so no az starts); $null restores the real one.
    .EXAMPLE
        Set-DcRunner { param($Arguments) '{}' }
    #>
    param([AllowNull()][scriptblock]$Runner)
    $script:Runner = $Runner
}

function Invoke-DcAz {
    <#
    .SYNOPSIS
        Runs az with the arguments given (or the stand-in runner) and returns its standard output; throws on a
        non-zero exit.
    .EXAMPLE
        Invoke-DcAz -Arguments @('account', 'show', '-o', 'json')
    #>
    param([Parameter(Mandatory)][string[]]$Arguments)
    if ($script:Runner) { return (& $script:Runner $Arguments) }
    $out = & az @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "az $($Arguments[0..1] -join ' ') failed: $($out -join ' ')" }
    ($out | Where-Object { $_ -is [string] }) -join "`n"
}

# ----------------------------------------------------------------------------- deployment

function New-DcSerializedData {
    <#
    .SYNOPSIS
        The workbook's serializedData for one environment: the template with fallbackResourceIds set to the
        workspace and each parameter's value from the settings file. Compact, sorted JSON.
    .EXAMPLE
        New-DcSerializedData -Settings (Read-DcSettings tests/fixtures/settings.lab.json)
    #>
    param([Parameter(Mandatory)][Collections.IDictionary]$Settings, [string]$TemplatePath = (Join-Path $script:KitRoot 'workbook/daily-checks.workbook.json'))
    $m = Get-DcManifest
    $wb = Read-DcJson -Path $TemplatePath
    $wb.fallbackResourceIds = @($Settings.workspaceResourceId)
    $quote = { param($list) (@($list) | ForEach-Object { '"' + ("$_" -replace '"', '') + '"' }) -join ', ' }
    foreach ($i in (Get-DcItems $wb.items)) {
        if ($i.type -ne 9) { continue }
        foreach ($p in $i.content.parameters) {
            $spec = @($m.parameters | Where-Object { $_.name -eq $p.name })[0]
            $v = $Settings[$spec.source]
            $p.value = if ($v -is [string]) { $v } else { & $quote $v }
        }
    }
    ConvertTo-DcJson $wb -Compress
}

function New-DcDeploymentPlan {
    <#
    .SYNOPSIS
        Plans the workbook's deployment for one environment: validates the template, writes the ARM parameters
        (parameters.json), the what-if and create commands, and plan.json with the SHA-256 of the ARM template,
        the parameters and the workbook template. With -RunWhatIf it runs az deployment group what-if
        (read-only) and summarizes the change types; with -WhatIfResultPath it reads a saved result instead.
        Nothing is created. Returns the plan and the SHA-256 to approve.
    .EXAMPLE
        New-DcDeploymentPlan -SettingsPath tests/fixtures/settings.lab.json -OutputPath out/plan -AsOf 2026-11-16T08:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf,
        [switch]$RunWhatIf, [string]$WhatIfResultPath, [string]$ChangeRecord = '')
    $s = Read-DcSettings -Path $SettingsPath
    $tpl = Join-Path $script:KitRoot 'workbook/daily-checks.workbook.json'
    $arm = Join-Path $script:KitRoot 'deploy/main.json'
    $fails = @(Test-DcTemplate -Path $tpl | Where-Object Status -EQ 'Fail')
    if ($fails.Count) { throw "The template fails validation ($($fails[0].Check) $($fails[0].Tab): $($fails[0].Detail)); fix it before planning." }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $params = [ordered]@{
        '$schema' = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'; contentVersion = '1.0.0.0'
        parameters = [ordered]@{
            workbookDisplayName = @{ value = $s.workbookDisplayName }; workbookSourceId = @{ value = $s.workspaceResourceId }
            serializedData = @{ value = (New-DcSerializedData -Settings $s -TemplatePath $tpl) }; location = @{ value = $s.location }
        }
    }
    $pPath = Join-Path $OutputPath 'parameters.json'
    Write-DcJson -Path $pPath -Value $params
    $common = @('--resource-group', $s.resourceGroup, '--subscription', $s.subscriptionId, '--template-file', 'deploy/main.json', '--parameters', "@$($pPath.Replace('\', '/'))")
    $whatIfArgs = @('deployment', 'group', 'what-if') + $common + @('--no-pretty-print')
    $createArgs = @('deployment', 'group', 'create', '--name', "daily-checks-$($s.environment)") + $common
    $whatIf = $null; $mode = 'DryRun'
    if ($WhatIfResultPath) { $whatIf = Read-DcJson -Path $WhatIfResultPath; $mode = 'Fixture' }
    elseif ($RunWhatIf) {
        Push-Location $script:KitRoot
        try { $whatIf = ConvertFrom-DcJsonText -Text (Invoke-DcAz -Arguments $whatIfArgs) } finally { Pop-Location }
        $mode = 'Live'
    }
    $changes = @()
    if ($whatIf) {
        Write-DcJson -Path (Join-Path $OutputPath 'whatif.json') -Value $whatIf
        $changes = @(@($whatIf.changes) | ForEach-Object { [ordered]@{ changeType = $_.changeType; resourceId = ("$($_.resourceId)" -replace '^.*/providers/', '') } })
    }
    $plan = [ordered]@{
        schema = 'fmp-dc-plan/1'; environment = $s.environment; recordedAt = (Format-DcUtc $AsOf); changeRecord = $ChangeRecord; mode = $mode
        subscriptionId = $s.subscriptionId; resourceGroup = $s.resourceGroup; workbookDisplayName = $s.workbookDisplayName
        armTemplateSha256 = (Get-DcFileHash -Path $arm); workbookTemplateSha256 = (Get-DcFileHash -Path $tpl); parametersSha256 = (Get-DcFileHash -Path $pPath)
        whatIfCommand = 'az ' + ($whatIfArgs -join ' '); createCommand = 'az ' + ($createArgs -join ' ')
        createArguments = $createArgs; whatIfRun = [bool]$whatIf; changes = $changes
        deletes = @($changes | Where-Object { $_.changeType -eq 'Delete' }).Count
    }
    $planPath = Join-Path $OutputPath 'plan.json'
    Write-DcJson -Path $planPath -Value $plan
    Write-DcManifest -Path $OutputPath -Task 'plan' -Meta @{ recordedAt = (Format-DcUtc $AsOf); environment = $s.environment; mode = $mode; tenantId = $s.tenantId }
    [pscustomobject]@{ Plan = $planPath; Sha256 = (Get-DcFileHash -Path $planPath); Mode = $mode; Changes = $changes; Deletes = $plan.deletes; CreateCommand = $plan.createCommand }
}

function Invoke-DcDeploy {
    <#
    .SYNOPSIS
        Deploys an approved plan. Checks the plan folder against its manifest and plan.json against the
        approved SHA-256, and refuses a plan whose what-if wasn't run or shows a Delete. Without -Apply it
        prints the create command and changes nothing. With -Apply it runs az deployment group create and
        writes the result and a hashed manifest (task deploy) to OutputPath.
    .EXAMPLE
        Invoke-DcDeploy -PlanPath out/plan -ApprovedSha256 <sha256> -OutputPath out/deploy -AsOf 2026-11-16T08:10:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [switch]$Apply)
    $t = Test-DcRunFolder -Path $PlanPath
    if (-not $t.Ok) { throw "The plan folder doesn't match its manifest: $($t.Detail)" }
    $pp = Join-Path $PlanPath 'plan.json'
    $actual = Get-DcFileHash -Path $pp
    if ($actual -ne $ApprovedSha256.ToLowerInvariant()) { throw "plan.json's SHA-256 is $actual, not the approved $ApprovedSha256. Re-plan and re-approve." }
    $plan = Read-DcJson -Path $pp
    if (-not $plan.whatIfRun) { throw 'The plan has no what-if result. Run New-DcDeploymentPlan with -RunWhatIf and review it first.' }
    if ([int]$plan.deletes -gt 0) { throw "The what-if shows $($plan.deletes) Delete change(s). The workbook deployment never deletes; review the template." }
    if ((Get-DcFileHash -Path (Join-Path $script:KitRoot 'deploy/main.json')) -ne $plan.armTemplateSha256) { throw 'deploy/main.json changed after the plan was written. Re-plan.' }
    if (-not $Apply) { return [pscustomobject]@{ Applied = $false; Command = $plan.createCommand; Detail = 'Dry run: nothing created. Add -Apply to run the command.' } }
    if ($plan.mode -ne 'Live') { throw "A $($plan.mode) plan can't be applied: plan against the live environment with -RunWhatIf." }
    Push-Location $script:KitRoot
    try { $res = Invoke-DcAz -Arguments (@($plan.createArguments) + @('-o', 'json')) } finally { Pop-Location }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-DcText -Path (Join-Path $OutputPath 'result.json') -Text ($res + "`n")
    Copy-Item -LiteralPath $pp -Destination (Join-Path $OutputPath 'plan.json')
    Write-DcManifest -Path $OutputPath -Task 'deploy' -Meta @{ recordedAt = (Format-DcUtc $AsOf); environment = $plan.environment; mode = 'Live'; planSha256 = $actual }
    [pscustomobject]@{ Applied = $true; Command = $plan.createCommand; Detail = "Deployed; recorded in $OutputPath" }
}

function New-DcRollbackPlan {
    <#
    .SYNOPSIS
        Plans the rollback: find the workbook by its display name in the resource group (read-only), then
        delete it, or redeploy the previous approved plan. Writes rollback.json and a hashed manifest (task
        rollback). Runs nothing.
    .EXAMPLE
        New-DcRollbackPlan -SettingsPath tests/fixtures/settings.lab.json -OutputPath out/rollback -AsOf 2026-11-16T09:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [string]$PreviousPlanPath = '')
    $s = Read-DcSettings -Path $SettingsPath
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $find = "az resource list --resource-group $($s.resourceGroup) --subscription $($s.subscriptionId) --resource-type Microsoft.Insights/workbooks --query `"[?properties.displayName=='$($s.workbookDisplayName)'].id`" -o tsv"
    $rb = [ordered]@{
        schema = 'fmp-dc-rollback/1'; environment = $s.environment; recordedAt = (Format-DcUtc $AsOf)
        find = $find; delete = 'az resource delete --ids <workbook-resource-id-from-find>'
        redeployPrevious = $(if ($PreviousPlanPath) { "Invoke-DcDeploy.ps1 -PlanPath $PreviousPlanPath -ApprovedSha256 <its-approved-sha256> -Apply" } else { '' })
        note = 'Deleting the workbook removes a view only: no log data, alert rule or task changes. Prefer redeploying the previous approved plan when the content, not the workbook, is wrong.'
    }
    Write-DcJson -Path (Join-Path $OutputPath 'rollback.json') -Value $rb
    Write-DcManifest -Path $OutputPath -Task 'rollback' -Meta @{ recordedAt = (Format-DcUtc $AsOf); environment = $s.environment; mode = 'DryRun' }
    [pscustomobject]$rb
}

function Test-DcReachability {
    <#
    .SYNOPSIS
        For every table a tab reads, asks the workspace (read-only, az monitor log-analytics query) for its
        newest record and count over the tab's look-back, and compares the age with the freshness limit:
        Delivering, Late, or Missing (no rows, or the table doesn't exist). With -FixturePath it reads saved
        answers instead. Writes reach.json and a hashed manifest (task reachability).
    .EXAMPLE
        Test-DcReachability -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/reach-day1.json -OutputPath out/reach -AsOf 2026-11-16T07:30:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [string]$FixturePath)
    $s = Read-DcSettings -Path $SettingsPath
    $m = Get-DcManifest
    $now = ConvertTo-DcUtc $AsOf
    $limits = @{}
    foreach ($e in $m.expectedTables) { $limits[$e.table] = [int]$e.slaMinutes }
    $tables = @(Get-DcOrdinal -Value @($m.tabs | ForEach-Object { $_.tables }) -Unique)
    $answers = if ($FixturePath) { Read-DcJson -Path $FixturePath } else { $null }
    $rows = foreach ($tb in $tables) {
        $q = "$tb | where TimeGenerated > ago(3d) | summarize LastSeen = max(TimeGenerated), Records = count()"
        $ans = $null; $err = ''
        if ($answers) { if ($answers.Contains($tb)) { $ans = $answers[$tb] } else { $err = 'table not found' } }
        else {
            try { $r = ConvertFrom-DcJsonText -Text (Invoke-DcAz -Arguments @('monitor', 'log-analytics', 'query', '--workspace', $s.workspaceCustomerId, '--analytics-query', $q, '-o', 'json')); $ans = @($r)[0] }
            catch { $err = $_.Exception.Message }
        }
        $limit = if ($limits.Contains($tb)) { $limits[$tb] } else { $null }
        $state = 'Missing'; $age = $null
        if ($ans -and $ans.LastSeen -and [int]$ans.Records -gt 0) {
            $age = [int][math]::Floor(($now - (ConvertTo-DcUtc $ans.LastSeen)).TotalMinutes)
            $state = if ($null -ne $limit -and $age -gt $limit) { 'Late' } else { 'Delivering' }
        }
        [pscustomobject][ordered]@{ Table = $tb; State = $state; AgeMinutes = $age; LimitMinutes = $limit; Records = $(if ($ans) { [int]$ans.Records } else { 0 }); Detail = $(if ($err) { $err } elseif ($null -eq $limit) { 'no freshness limit (event-driven table)' } else { '' }) }
    }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-DcJson -Path (Join-Path $OutputPath 'reach.json') -Value @{ asOf = (Format-DcUtc $AsOf); tables = @($rows | ForEach-Object { @{ table = $_.Table; state = $_.State; ageMinutes = $_.AgeMinutes; limitMinutes = $_.LimitMinutes; records = $_.Records; detail = $_.Detail } }) }
    $bad = @($rows | Where-Object State -NE 'Delivering').Count
    Write-DcManifest -Path $OutputPath -Task 'reachability' -Meta @{ recordedAt = (Format-DcUtc $AsOf); environment = $s.environment; mode = $(if ($FixturePath) { 'Fixture' } else { 'Live' }); tenantId = $s.tenantId; result = $(if ($bad) { 'Fail' } else { 'Pass' }) }
    $rows
}

function Test-DcInRepository {
    param([Parameter(Mandatory)][string]$Path)
    $full = [IO.Path]::GetFullPath($Path)
    $dir = $full
    while ($dir) {
        if (Test-Path -LiteralPath (Join-Path $dir '.git')) { return $true }
        $parent = Split-Path -Parent $dir
        if ($parent -eq $dir) { break }
        $dir = $parent
    }
    $false
}

function Test-DcPreflight {
    <#
    .SYNOPSIS
        PF-01 to PF-06 before a stage: the settings file is complete; it holds no secret; output and evidence
        folders are outside any repository; the cloud is AzureCloud and (with -Live) az is signed in to the
        settings' tenant and subscription; the template validates; and in production the test stage's evidence
        passes. Writes results.json and a hashed manifest (task preflight) when OutputPath is given.
    .EXAMPLE
        Test-DcPreflight -SettingsPath deploy/tests/fixtures/settings.test.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Live)
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $s = $null
    try { $s = Read-DcSettings -Path $SettingsPath; & $add 'PF-01' $true "$($s.environment) settings complete" } catch { & $add 'PF-01' $false $_.Exception.Message; return $rows.ToArray() }
    $raw = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $SettingsPath).Path)
    $secret = $raw -match '(?i)"(client_?secret|password|sharedkey|accountkey|token)"\s*:'
    & $add 'PF-02' (-not $secret) $(if ($secret) { 'the settings file holds a secret; the kit signs in with az login only' } else { 'no secret in the settings file' })
    $inRepo = @(@($s.outputRoot, $s.evidencePath) | Where-Object { Test-DcInRepository -Path $_ })
    & $add 'PF-03' (-not $inRepo.Count) $(if ($inRepo.Count) { "inside a repository: $($inRepo -join ', ')" } else { 'output and evidence are outside any repository' })
    if ($Live) {
        try {
            $acct = ConvertFrom-DcJsonText -Text (Invoke-DcAz -Arguments @('account', 'show', '-o', 'json'))
            $cloud = ConvertFrom-DcJsonText -Text (Invoke-DcAz -Arguments @('cloud', 'show', '-o', 'json'))
            $ok = ($cloud.name -ceq 'AzureCloud' -and $acct.tenantId -eq $s.tenantId -and $acct.id -eq $s.subscriptionId)
            & $add 'PF-04' $ok $(if ($ok) { 'az is on AzureCloud, in the settings tenant and subscription' } else { "az is on $($cloud.name), tenant $($acct.tenantId), subscription $($acct.id)" })
        } catch { & $add 'PF-04' $false $_.Exception.Message }
    } else { & $add 'PF-04' ($s.cloud -ceq 'AzureCloud') 'AzureCloud named; sign-in not checked (no -Live)' }
    $fails = @(Test-DcTemplate -Path (Join-Path $script:KitRoot 'workbook/daily-checks.workbook.json') | Where-Object Status -EQ 'Fail')
    & $add 'PF-05' (-not $fails.Count) $(if ($fails.Count) { "$($fails.Count) template checks fail" } else { 'the template passes DC-V-01 to -10' })
    if ($s.environment -eq 'production') {
        $tp = if ($s.Contains('testEvidencePath')) { $s.testEvidencePath } else { '' }
        if (-not $tp -or -not (Test-Path -LiteralPath $tp)) { & $add 'PF-06' $false 'no test-stage evidence folder (testEvidencePath)' }
        else { $ev = @(Test-DcEvidence -EvidencePath $tp -Stage test | Where-Object Status -EQ 'Fail'); & $add 'PF-06' (-not $ev.Count) $(if ($ev.Count) { "test-stage evidence fails: $(@($ev | ForEach-Object Check) -join ', ')" } else { 'the test stage evidence passes' }) }
    } else { & $add 'PF-06' $true "not production ($($s.environment))" }
    if ($OutputPath) {
        if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
        New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
        Write-DcJson -Path (Join-Path $OutputPath 'results.json') -Value @($rows | ForEach-Object { @{ check = $_.Check; status = $_.Status; detail = $_.Detail } })
        Write-DcManifest -Path $OutputPath -Task 'preflight' -Meta @{ recordedAt = (Format-DcUtc $AsOf); environment = $s.environment; mode = $(if ($Live) { 'Live' } else { 'Fixture' }); tenantId = $s.tenantId; result = $(if (@($rows | Where-Object Status -EQ 'Fail').Count) { 'Fail' } else { 'Pass' }) }
    }
    $rows.ToArray()
}

# ----------------------------------------------------------------------------- evidence

function Update-DcEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder ("sha256  relative/path" per file) for sha256sum -c.
    .EXAMPLE
        Update-DcEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            ForEach-Object { Get-DcRelativePath -Root $root -Path $_.FullName })
    $lines = @((Get-DcOrdinal -Value $lines) | ForEach-Object { '{0}  {1}' -f (Get-DcFileHash -Path (Join-Path $root $_)), $_ })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    $lines.Count
}

function Write-DcEvidence {
    <#
    .SYNOPSIS
        Records one run folder (validate, preflight, plan, deploy, reachability or rollback) as evidence: checks
        its manifest, copies it under runs/, and writes a record with the time, environment, mode, the steps it
        covers with their SP 800-53 controls and FedRAMP 20x KSIs, every file's SHA-256 and the SHA-256 of the
        record before it. A render folder is refused: the view is not evidence.
    .EXAMPLE
        Write-DcEvidence -EvidencePath out/evidence -RunPath out/validate -AsOf 2026-11-16T07:05:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf, [string]$ChangeRecord = '')
    $req = Get-DcRequirements
    $t = Test-DcRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $task = "$($t.Manifest.task)"
    if ($task -eq 'render') { throw 'A rendered view is not evidence. Record the check''s own output instead (the probe''s result, the alert, the closed task), or the kit''s validate, plan, deploy and reachability runs.' }
    if (-not $req.tasks.Contains($task)) { throw "No evidence step for task '$task'." }
    $steps = @($req.tasks[$task]) + @('EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-DcFileHash -Path $prior[-1].FullName } else { $null }
    $name = '{0:d4}-{1}' -f $seq, $task
    $dest = Join-Path $EvidencePath "runs/$name"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in (Get-DcOrdinal -Value @($t.Manifest.files.Keys))) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-DcFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @(Get-DcOrdinal -Value @($steps | ForEach-Object { $req.steps[$_].controls }) -Unique)
    $ksis = @(Get-DcOrdinal -Value @($steps | ForEach-Object { $req.steps[$_].ksis }) -Unique)
    $result = if (-not $t.Ok) { 'Fail' } elseif ($t.Manifest.Contains('result') -and $t.Manifest.result -eq 'Fail') { 'Fail' } else { 'Pass' }
    $rec = [ordered]@{
        schema = 'fmp-dc-evidence/1'; sequence = $seq; recordedAt = (Format-DcUtc $AsOf); task = $task
        environment = "$(if ($t.Manifest.Contains('environment')) { $t.Manifest.environment })"; mode = "$(if ($t.Manifest.Contains('mode')) { $t.Manifest.mode })"
        changeRecord = $ChangeRecord; result = $result; detail = $t.Detail
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_].title } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them. The workbook itself is a view and is never recorded.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-DcJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-DcText -Path $csv -Text "sequence,recordedAt,task,environment,mode,result,steps,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $rec.recordedAt, $task, $rec.environment, $rec.mode, $result, ($steps -join ' '), ($controls -join ' '), ($ksis -join ' '), (Get-DcFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", [Text.UTF8Encoding]::new($false))
    $null = Update-DcEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Task = $task; Result = $result; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-DcEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: SHA256SUMS lists every file unchanged; each record's files match; the chain is
        unbroken; and, with -Stage, every step the stage needs has a passing record from a live run (fixture and
        dry-run records never count). One row per check.
    .EXAMPLE
        Test-DcEvidence -EvidencePath out/evidence -Stage test
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [ValidateSet('test', 'production')][string]$Stage)
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path
    $sums = Join-Path $root 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) { & $add 'SUMS' $false 'no SHA256SUMS'; return $rows.ToArray() }
    $listed = @{}; $bad = @()
    foreach ($l in (Get-Content -LiteralPath $sums)) { if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] } }
    foreach ($fi in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = Get-DcRelativePath -Root $root -Path $fi.FullName
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-DcFileHash -Path $fi.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { ($bad | Sort-Object) -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}
    foreach ($r in $recs) {
        $j = Read-DcJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($fx in @($j.files)) { $fp = Join-Path $root $fx.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-DcFileHash -Path $fp) -ne $fx.sha256) { $chain += "$($fx.path) doesn't match $($r.Name)" } }
        if ($j.result -eq 'Pass' -and $j.mode -eq 'Live') { foreach ($st in @($j.steps)) { $passed[$st.id] = $true } }
        $prev = Get-DcFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Stage) {
        foreach ($st in (Get-DcRequirements).stages[$Stage]) { & $add "STEP-$st" $passed.Contains($st) $(if ($passed.Contains($st)) { 'a passing live record covers it' } else { 'no passing live record' }) }
    }
    $rows.ToArray()
}

Export-ModuleMember -Function Read-DcJson, ConvertFrom-DcJsonText, Get-DcOrdinal, ConvertTo-DcSorted, ConvertTo-DcJson, Write-DcJson, Write-DcText, Get-DcFileHash, Get-DcTextHash,
    ConvertTo-DcUtc, Format-DcUtc, Write-DcManifest, Test-DcRunFolder, Get-DcManifest, Get-DcRequirements, Get-DcTab, Read-DcSettings,
    New-DcTemplate, Test-DcTemplate, Invoke-DcValidate, Get-DcRender, Invoke-DcRender, Set-DcRunner, Invoke-DcAz,
    New-DcSerializedData, New-DcDeploymentPlan, Invoke-DcDeploy, New-DcRollbackPlan, Test-DcReachability, Test-DcPreflight,
    Update-DcEvidenceSums, Write-DcEvidence, Test-DcEvidence
