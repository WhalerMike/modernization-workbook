#Requires -Version 7.1
<#
McPipeline: the checks a machine configuration package and its policy definition pass before
anything is published. Learn's GuestConfiguration cmdlets build the package and the definition
(Invoke-McBuild.ps1 calls them); this module adds what they leave to you: a MOF free of build-host
data, a package that matches the release registry, a definition whose hash, URI, ID, version, mode
and owner filter agree with that package and registry, and a provenance manifest.

None of these functions needs the GuestConfiguration module, Azure or a network, so the tests run
on a laptop against fixtures.
#>

Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

# Learn: the package can't exceed 100 MB uncompressed.
$script:McMaxUncompressedBytes = 100MB
$script:McModes = @('Audit', 'ApplyAndMonitor', 'ApplyAndAutoCorrect')
# MOF property names and values that suggest a secret. Learn: don't put secrets in custom packages.
$script:McSecretNames = '(?i)^\s*(password|passphrase|secret|connectionstring|accountkey|sastoken|apikey|token|credential|psdscrunascredential)\s*='
$script:McSecretValues = '(?i)(sig=[A-Za-z0-9%]{10,}|AccountKey=|SharedAccessSignature|-----BEGIN [A-Z ]*PRIVATE KEY-----|instance of MSFT_Credential)'

function New-McFinding {
    param(
        [Parameter(Mandatory)][ValidateSet('Finding', 'Warn', 'Info')][string]$Severity,
        [Parameter(Mandatory)][string]$Rule,
        [Parameter(Mandatory)][string]$Issue,
        [string]$Detail = ''
    )
    [pscustomobject][ordered]@{ Severity = $Severity; Rule = $Rule; Issue = $Issue; Detail = $Detail }
}

function Get-McFileSha256 {
    <# SHA-256 of a file's bytes, lowercase hex, the form provenance.json uses. #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-McReleaseEntry {
    <#
    One configuration's row from the release registry (config/releases.json): its fixed policy ID,
    platform, mode, last published version, owner tag and identity. The registry is the reviewed
    record of what is in production; a build that disagrees with it stops.
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Name)
    $all = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    if (-not $all.ContainsKey('configurations') -or -not $all.configurations.ContainsKey($Name)) {
        throw "No release registry entry for '$Name' in $Path"
    }
    $e = $all.configurations[$Name]
    foreach ($k in 'policyId', 'platform', 'mode', 'published', 'identity') {
        if (-not $e.ContainsKey($k) -or [string]::IsNullOrWhiteSpace("$($e[$k])")) { throw "Release entry '$Name' has no $k" }
    }
    if ($script:McModes -cnotcontains $e.mode) { throw "Release entry '$Name' has mode '$($e.mode)'; expected one of $($script:McModes -join ', ') (case sensitive)" }
    if ("$($e.policyId)" -notmatch '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$') { throw "Release entry '$Name' policyId isn't a GUID" }
    $e['name'] = $Name
    $e
}

function Get-McPackageType {
    <# The package type New-GuestConfigurationPackage needs for a policy mode. #>
    param([Parameter(Mandatory)][string]$Mode)
    if ($Mode -ceq 'Audit') { 'Audit' } else { 'AuditAndSet' }
}

function Split-McMofTopLevel {
    <#
    Split MOF text at a delimiter character that sits outside string literals and braces.
    Returns the pieces, each without its delimiter. Strings are "..." with backslash escapes.
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text, [Parameter(Mandatory)][char]$Delimiter)
    $parts = [Collections.Generic.List[string]]::new()
    $sb = [Text.StringBuilder]::new()
    $depth = 0; $inString = $false
    for ($i = 0; $i -lt $Text.Length; $i++) {
        $c = $Text[$i]
        if ($inString) {
            [void]$sb.Append($c)
            if ($c -eq '\' -and $i + 1 -lt $Text.Length) { [void]$sb.Append($Text[++$i]) }
            elseif ($c -eq '"') { $inString = $false }
            continue
        }
        if ($c -eq '"') { $inString = $true }
        elseif ($c -eq '{') { $depth++ }
        elseif ($c -eq '}') { $depth-- }
        if ($c -eq $Delimiter -and $depth -eq 0) { $parts.Add($sb.ToString()); [void]$sb.Clear(); continue }
        [void]$sb.Append($c)
    }
    if ($sb.ToString().Trim()) { $parts.Add($sb.ToString()) }
    , $parts.ToArray()
}

function Format-McMofValue {
    <# Collapse whitespace outside string literals, so a value prints the same however it was laid out. #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Value)
    $sb = [Text.StringBuilder]::new(); $inString = $false; $space = $false
    for ($i = 0; $i -lt $Value.Length; $i++) {
        $c = $Value[$i]
        if ($inString) {
            [void]$sb.Append($c)
            if ($c -eq '\' -and $i + 1 -lt $Value.Length) { [void]$sb.Append($Value[++$i]) }
            elseif ($c -eq '"') { $inString = $false }
            continue
        }
        if ([char]::IsWhiteSpace($c)) { $space = $true; continue }
        if ($space -and $sb.Length -gt 0 -and $c -notin '}', ',' -and $sb[$sb.Length - 1] -notin '{', ',') { [void]$sb.Append(' ') }
        $space = $false
        if ($c -eq '"') { $inString = $true }
        [void]$sb.Append($c)
    }
    $sb.ToString()
}

function ConvertTo-McCleanMof {
    <#
    Rewrite a compiled MOF into a canonical form with nothing about the build host:
      - drop the header comment (@GeneratedBy, @GenerationDate, @GenerationHost);
      - drop the Author, GenerationDate and GenerationHost properties of the configuration document;
      - keep SourceInfo as ::line::column::resource, without the absolute script path (the form
        Microsoft's own sample MOFs use);
      - sort each instance's properties by name and print them one per line, LF endings, UTF-8.
    Compiling writes the properties in a different order each run, so sorting is what makes the same
    configuration source give the same bytes on any host. Instance order, values and aliases are kept.
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Destination)
    $text = [IO.File]::ReadAllText($Path).TrimStart([char]0xFEFF) -replace "`r`n", "`n"
    $text = $text -replace '(?s)\A\s*/\*.*?\*/\s*', ''
    $out = [Text.StringBuilder]::new()
    foreach ($stmt in (Split-McMofTopLevel -Text $text -Delimiter ';')) {
        $open = $stmt.IndexOf('{')
        if ($open -lt 0) {
            if ($stmt.Trim()) { throw "Unexpected MOF statement outside an instance: $($stmt.Trim())" }
            continue
        }
        $header = ($stmt.Substring(0, $open) -replace '\s+', ' ').Trim()
        $close = $stmt.LastIndexOf('}')
        $body = $stmt.Substring($open + 1, $close - $open - 1)
        $props = foreach ($p in (Split-McMofTopLevel -Text $body -Delimiter ';')) {
            $eq = $p.IndexOf('=')
            if ($eq -lt 0) { if ($p.Trim()) { throw "Unexpected MOF property: $($p.Trim())" }; continue }
            $name = $p.Substring(0, $eq).Trim()
            $value = Format-McMofValue -Value $p.Substring($eq + 1).Trim()
            if ($header -eq 'instance of OMI_ConfigurationDocument' -and $name -in 'Author', 'GenerationDate', 'GenerationHost') { continue }
            if ($name -eq 'SourceInfo') { $value = $value -replace '^"[^"]*?(::\d+::\d+::[^"]*")$', '"$1' }
            [pscustomobject]@{ Name = $name; Value = $value }
        }
        [void]$out.Append($header).Append("`n{`n")
        foreach ($p in ($props | Sort-Object { $_.Name.ToLowerInvariant() } -CaseSensitive)) {
            [void]$out.Append('    ').Append($p.Name).Append(' = ').Append($p.Value).Append(";`n")
        }
        [void]$out.Append("};`n`n")
    }
    $text = $out.ToString().TrimEnd("`n") + "`n"
    $dir = Split-Path -Parent $Destination
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllBytes($Destination, [Text.UTF8Encoding]::new($false).GetBytes($text))
    Get-Item -LiteralPath $Destination
}

function Test-McMofText {
    <# Rules on a MOF's text: build-host data (MC-PKG-04) and anything that looks like a secret (MC-PKG-05). #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text, [string]$Where = 'MOF')
    if ($Text -match '@Generat(edBy|ionHost|ionDate)=' -or $Text -match '(?m)^\s*(Author|GenerationHost|GenerationDate)\s*=') {
        New-McFinding -Severity Finding -Rule 'MC-PKG-04' -Issue 'MOF carries build-host data (user, host or date); clean it with ConvertTo-McCleanMof' -Detail $Where
    }
    $abs = [regex]::Matches($Text, 'SourceInfo\s*=\s*"([A-Za-z]:\\\\|/)[^"]*"')
    if ($abs.Count -gt 0) {
        New-McFinding -Severity Finding -Rule 'MC-PKG-04' -Issue 'MOF SourceInfo holds an absolute build path' -Detail $abs[0].Value
    }
    foreach ($line in ($Text -split "`n")) {
        if ($line -match $script:McSecretNames -or $line -match $script:McSecretValues) {
            New-McFinding -Severity Finding -Rule 'MC-PKG-05' -Issue 'MOF looks like it holds a secret; Learn says not to put secrets in custom packages' -Detail $line.Trim()
        }
    }
}

function Get-McMofModules {
    <# ModuleName and ModuleVersion pairs a MOF imports, excluding the configuration document. #>
    param([Parameter(Mandatory)][string]$Text)
    $seen = @{}
    $text = ($Text -replace "`r`n", "`n") -replace '(?s)\A\s*/\*.*?\*/\s*', ''
    foreach ($stmt in (Split-McMofTopLevel -Text $text -Delimiter ';')) {
        $open = $stmt.IndexOf('{')
        if ($open -lt 0 -or $stmt.Substring(0, $open) -match 'OMI_ConfigurationDocument') { continue }
        $body = $stmt.Substring($open)
        $n = [regex]::Match($body, 'ModuleName\s*=\s*"([^"]+)"')
        $v = [regex]::Match($body, 'ModuleVersion\s*=\s*"([^"]+)"')
        if ($n.Success) { $seen["$($n.Groups[1].Value)|$($v.Groups[1].Value)"] = [pscustomobject]@{ Name = $n.Groups[1].Value; Version = $v.Groups[1].Value } }
    }
    @($seen.Values | Sort-Object Name, Version)
}

function Test-McPackage {
    <#
    Inspect a package .zip without expanding it to disk. Rules:
      MC-PKG-01 <Name>.mof and <Name>.metaconfig.json at the root
      MC-PKG-02 metaconfig Type is the type the release mode needs
      MC-PKG-03 uncompressed size within Learn's 100 MB limit
      MC-PKG-04 no build-host data in the MOF
      MC-PKG-05 nothing in the MOF that looks like a secret
      MC-PKG-06 every module the MOF imports is in Modules/ at the same version
      MC-PKG-07 the package name carries a version (Learn's lifecycle guidance)
    Returns finding rows; an empty result means the package passed.
    #>
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][ValidateSet('Audit', 'AuditAndSet')][string]$ExpectedType
    )
    $zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Path).Path)
    try {
        $entries = @($zip.Entries)
        $byName = @{}
        foreach ($e in $entries) { $byName[($e.FullName -replace '\\', '/')] = $e }
        $total = ($entries | Measure-Object -Property Length -Sum).Sum
        if ($total -gt $script:McMaxUncompressedBytes) {
            New-McFinding -Severity Finding -Rule 'MC-PKG-03' -Issue 'Package exceeds 100 MB uncompressed' -Detail "$total bytes"
        }
        if ($Name -notmatch '_\d+\.\d+\.\d+$') {
            New-McFinding -Severity Warn -Rule 'MC-PKG-07' -Issue 'Package name carries no version; Learn advises a version in the name, such as Name_1.0.0' -Detail $Name
        }
        $mofEntry = $byName["$Name.mof"]
        $metaEntry = $byName["$Name.metaconfig.json"]
        if (-not $mofEntry) { New-McFinding -Severity Finding -Rule 'MC-PKG-01' -Issue "No $Name.mof at the package root" }
        if (-not $metaEntry) { New-McFinding -Severity Finding -Rule 'MC-PKG-01' -Issue "No $Name.metaconfig.json at the package root" }
        if ($metaEntry) {
            $r = [IO.StreamReader]::new($metaEntry.Open()); $meta = $r.ReadToEnd() | ConvertFrom-Json; $r.Dispose()
            $type = "$($meta.Type)"
            if ($type -ne $ExpectedType) {
                New-McFinding -Severity Finding -Rule 'MC-PKG-02' -Issue "Package type is '$type'; the release mode needs '$ExpectedType'"
            }
        }
        if ($mofEntry) {
            $r = [IO.StreamReader]::new($mofEntry.Open()); $mof = $r.ReadToEnd(); $r.Dispose()
            Test-McMofText -Text $mof -Where "$Name.mof"
            foreach ($m in (Get-McMofModules -Text $mof)) {
                $psd1 = $byName["Modules/$($m.Name)/$($m.Name).psd1"]
                if (-not $psd1) {
                    New-McFinding -Severity Finding -Rule 'MC-PKG-06' -Issue "Module $($m.Name) is imported by the MOF but not in the package"
                    continue
                }
                $r = [IO.StreamReader]::new($psd1.Open()); $manifest = $r.ReadToEnd(); $r.Dispose()
                $mv = [regex]::Match($manifest, "(?im)^\s*ModuleVersion\s*=\s*['""]([^'""]+)['""]").Groups[1].Value
                if ($m.Version -and $mv -ne $m.Version) {
                    New-McFinding -Severity Finding -Rule 'MC-PKG-06' -Issue "Module $($m.Name) is $mv in the package; the MOF was compiled against $($m.Version)"
                }
            }
        }
    } finally { $zip.Dispose() }
}

function Get-McSasExpiry {
    <# The se= (signed expiry) of a SAS URI, or $null. #>
    param([string]$Uri)
    $m = [regex]::Match($Uri, '[?&]se=([^&]+)')
    if (-not $m.Success) { return $null }
    [datetimeoffset]::Parse([uri]::UnescapeDataString($m.Groups[1].Value), [Globalization.CultureInfo]::InvariantCulture)
}

function Get-McDeployments {
    <# The guestConfiguration blocks inside a deployIfNotExists template, one per machine type. #>
    param($Definition)
    $d = $Definition.properties.policyRule.then.details
    if (-not $d.PSObject.Properties['deployment']) { return @() }
    @($d.deployment.properties.template.resources | ForEach-Object { $_.properties.guestConfiguration })
}

function Test-McPolicy {
    <#
    Check a definition New-GuestConfigurationPolicy wrote against the package it was built from and
    the release registry entry. Rules:
      MC-POL-01 category is Guest Configuration
      MC-POL-02 contentHash, in the metadata and every deployment block, is the package's SHA-256
      MC-POL-03 contentUri is HTTPS; a SAS token is a warning, and one that outlives MaxSasDays a finding
      MC-POL-04 contentUri names the package file this build produced
      MC-POL-05 the definition name is the registry's fixed policy ID
      MC-POL-06 the version is greater than the one the registry says is published
      MC-POL-07 effect and assignment type match the registry mode
      MC-POL-08 a definition that changes machines filters on the owner tag
      MC-POL-09 Arc: IncludeArcMachines defaults to false; a user-assigned identity can't serve Arc
    #>
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$PackagePath,
        [Parameter(Mandatory)][hashtable]$Release,
        [string]$Version,
        [int]$MaxSasDays = 90,
        [datetimeoffset]$Now = [datetimeoffset]::UtcNow
    )
    $def = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    $p = $def.properties
    $gc = $p.metadata.guestConfiguration
    $hash = (Get-McFileSha256 -Path $PackagePath).ToUpperInvariant()
    $pkgFile = Split-Path -Leaf $PackagePath

    if ("$($p.metadata.category)" -ne 'Guest Configuration') {
        New-McFinding -Severity Finding -Rule 'MC-POL-01' -Issue "metadata.category is '$($p.metadata.category)', not 'Guest Configuration'"
    }
    $blocks = @($gc) + @(Get-McDeployments -Definition $def)
    foreach ($b in $blocks) {
        if ("$($b.contentHash)".ToUpperInvariant() -ne $hash) {
            New-McFinding -Severity Finding -Rule 'MC-POL-02' -Issue 'contentHash does not match the package; the extension rejects the package' -Detail "definition $($b.contentHash); package $hash"
            break
        }
    }
    $uris = @($blocks | ForEach-Object { "$($_.contentUri)" } | Select-Object -Unique)
    foreach ($u in $uris) {
        $parsed = $null
        if (-not [uri]::TryCreate($u, [UriKind]::Absolute, [ref]$parsed) -or $parsed.Scheme -ne 'https') {
            New-McFinding -Severity Finding -Rule 'MC-POL-03' -Issue 'contentUri is not an HTTPS URI' -Detail $u
            continue
        }
        if ($u -match '[?&]sig=') {
            $exp = Get-McSasExpiry -Uri $u
            if ($exp -and $exp -gt $Now.AddDays($MaxSasDays)) {
                New-McFinding -Severity Finding -Rule 'MC-POL-03' -Issue "contentUri carries a SAS token valid past $MaxSasDays days" -Detail "expires $($exp.ToString('yyyy-MM-dd'))"
            } else {
                New-McFinding -Severity Warn -Rule 'MC-POL-03' -Issue 'contentUri carries a SAS token; prefer a managed identity with Storage Blob Data Reader'
            }
        }
        if ([uri]::UnescapeDataString(($parsed.AbsolutePath -split '/')[-1]) -ne $pkgFile) {
            New-McFinding -Severity Finding -Rule 'MC-POL-04' -Issue "contentUri doesn't name this build's package ($pkgFile)" -Detail $u
        }
    }
    if ("$($def.name)" -ne "$($Release.policyId)") {
        New-McFinding -Severity Finding -Rule 'MC-POL-05' -Issue "Definition name is '$($def.name)'; the registry's policy ID is $($Release.policyId). A new ID creates a second definition instead of updating the first"
    }
    $v = if ($Version) { $Version } else { "$($p.metadata.version)" }
    if ([version]$v -le [version]"$($Release.published)") {
        New-McFinding -Severity Finding -Rule 'MC-POL-06' -Issue "Version $v is not greater than the published $($Release.published)"
    }
    $effect = "$($p.policyRule.then.effect)"
    if ($Release.mode -ceq 'Audit') {
        if ($effect -ine 'auditIfNotExists') {
            New-McFinding -Severity Finding -Rule 'MC-POL-07' -Issue "Registry mode is Audit but the effect is $effect"
        }
    } else {
        $types = @(Get-McDeployments -Definition $def | ForEach-Object { "$($_.assignmentType)" } | Select-Object -Unique)
        if ($effect -ine 'deployIfNotExists' -or $types.Count -ne 1 -or $types[0] -cne $Release.mode) {
            New-McFinding -Severity Finding -Rule 'MC-POL-07' -Issue "Registry mode is $($Release.mode) but the definition has effect $effect and assignment type $($types -join ', ')"
        }
        $owner = $Release['owner_tag']
        $filtered = $false
        if ($owner) {
            foreach ($k in $owner.Keys) {
                $json = $p.policyRule.if | ConvertTo-Json -Depth 50 -Compress
                if ($json -match [regex]::Escape("""field"":""tags['$k']"",""equals"":""$($owner[$k])""")) { $filtered = $true }
            }
        }
        if (-not $filtered) {
            New-McFinding -Severity Finding -Rule 'MC-POL-08' -Issue 'Definition changes machines but has no owner tag filter; it would also reach servers another tool owns (VK-ARC-07)'
        }
    }
    $includeArc = $p.parameters.PSObject.Properties['IncludeArcMachines']
    if ($Release['include_arc'] -and $includeArc -and "$($includeArc.Value.defaultValue)" -eq 'false') {
        New-McFinding -Severity Info -Rule 'MC-POL-09' -Issue 'IncludeArcMachines defaults to false: set it to true in the assignment or Arc-enabled servers are out of scope'
    }
    $mi = "$($gc.PSObject.Properties['contentManagedIdentity'] | ForEach-Object Value)"
    if ($Release['include_arc'] -and $mi -and $mi -ne 'system') {
        New-McFinding -Severity Finding -Rule 'MC-POL-09' -Issue 'User-assigned identity in a definition meant for Arc; Learn says Arc-connected machines do not support user-assigned identities'
    }
}

function Get-McProvenance {
    <#
    The provenance manifest for one build: what was built (configuration, version, policy ID,
    mode), from what (MOF hash after cleaning, module versions), what shipped (package and
    definition hashes and sizes), and what the checks said. Same inputs, same manifest, except the
    package hash: Learn's packager writes a different .zip each run, so the pipeline publishes the
    bytes it built and checked, never a rebuild.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Release,
        [Parameter(Mandatory)][string]$Version,
        [Parameter(Mandatory)][string]$MofPath,
        [Parameter(Mandatory)][string]$PackagePath,
        [Parameter(Mandatory)][string]$PolicyPath,
        [Parameter(Mandatory)][hashtable]$Modules,
        [Parameter(Mandatory)][string]$BuiltAt,
        [object[]]$Findings = @()
    )
    $counts = [ordered]@{ Finding = 0; Warn = 0; Info = 0 }
    foreach ($f in $Findings) { $counts[$f.Severity]++ }
    $mods = [ordered]@{}
    foreach ($k in ($Modules.Keys | Sort-Object)) { $mods[$k] = "$($Modules[$k])" }
    [ordered]@{
        schema         = 'fmp-mc-provenance/1'
        built_at       = $BuiltAt
        configuration  = $Release.name
        version        = $Version
        policy_id      = $Release.policyId
        platform       = $Release.platform
        mode           = $Release.mode
        mof            = [ordered]@{ file = Split-Path -Leaf $MofPath; sha256 = Get-McFileSha256 -Path $MofPath }
        package        = [ordered]@{ file = Split-Path -Leaf $PackagePath; sha256 = Get-McFileSha256 -Path $PackagePath; bytes = (Get-Item -LiteralPath $PackagePath).Length }
        policy         = [ordered]@{ file = Split-Path -Leaf $PolicyPath; sha256 = Get-McFileSha256 -Path $PolicyPath }
        modules        = $mods
        findings       = $counts
        finding_rules  = @($Findings | ForEach-Object { "$($_.Severity):$($_.Rule)" })
    }
}

Export-ModuleMember -Function Get-McFileSha256, Get-McReleaseEntry, Get-McPackageType, ConvertTo-McCleanMof, Test-McMofText, Get-McMofModules, Test-McPackage, Get-McSasExpiry, Test-McPolicy, Get-McProvenance, New-McFinding
