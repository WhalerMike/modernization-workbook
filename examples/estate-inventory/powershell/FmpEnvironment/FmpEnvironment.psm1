<#
    The environment profile loader: hands a lab the names and IDs the estate inventory found, so
    the reader doesn't type them. Windows PowerShell 5.1 and PowerShell 7.

      Import-FmpEnvironment -Path <run folder>     checks the profile, then keeps it for this session
      Get-FmpEnvironmentValue <field or placeholder>   one value: ad.forestRootDomain, or <test-domain>
      Get-FmpEnvironmentPlaceholder                 every placeholder it can fill, with its value
      Expand-FmpPlaceholder '<command>'             a lab command with the placeholders it can fill filled

    Import-FmpEnvironment refuses (throws) a profile that is older than -MaxAgeDays, whose
    EstateInventoryManifest.json no longer has the SHA-256 the profile recorded, that changed after
    the run (SHA256SUMS), or whose label isn't the one the lab expects (-Expect, default test).
    Get-FmpEnvironmentValue throws for a field the kits disagree on or didn't collect. It reads
    files only: no call to Active Directory, Entra ID or Azure.
#>
Set-StrictMode -Version 2.0

$script:Current = $null

# The placeholders the workbook's Lab 2s use most that a profile can fill. Single: the placeholder
# takes one value, so a list field fills it only when the run saw exactly one.
$script:PlaceholderMap = @(
    [pscustomobject]@{ Placeholder = '<tenant-id>'; Field = 'tenantId'; Single = $true; Note = 'The tenant every cloud kit read' }
    [pscustomobject]@{ Placeholder = '<test-tenant-id>'; Field = 'tenantId'; Single = $true; Note = 'The test tenant every cloud kit read' }
    [pscustomobject]@{ Placeholder = '<graph-tenant-id>'; Field = 'tenantId'; Single = $true; Note = 'The tenant Graph signs in to' }
    [pscustomobject]@{ Placeholder = '<subscription-id>'; Field = 'azure.subscriptionIds'; Single = $true; Note = 'Only when the run read one subscription' }
    [pscustomobject]@{ Placeholder = '<test-subscription-id>'; Field = 'azure.subscriptionIds'; Single = $true; Note = 'Only when the run read one subscription' }
    [pscustomobject]@{ Placeholder = '<mg-id>'; Field = 'azure.managementGroupIds'; Single = $true; Note = 'Only when the run read one management group' }
    [pscustomobject]@{ Placeholder = '<test-mg-id>'; Field = 'azure.managementGroupIds'; Single = $true; Note = 'Only when the run read one management group' }
    [pscustomobject]@{ Placeholder = '<management-group-id>'; Field = 'azure.managementGroupIds'; Single = $true; Note = 'Only when the run read one management group' }
    [pscustomobject]@{ Placeholder = '<cloud>'; Field = 'cloud'; Single = $true; Note = 'gcc or global, as the kits take -Cloud' }
    [pscustomobject]@{ Placeholder = '<test-domain>'; Field = 'ad.forestRootDomain'; Single = $true; Note = 'The forest root domain''s DNS name' }
    [pscustomobject]@{ Placeholder = '<domain-fqdn>'; Field = 'ad.forestRootDomain'; Single = $true; Note = 'The forest root domain''s DNS name' }
    [pscustomobject]@{ Placeholder = '<domain-dn>'; Field = 'ad.rootDomain.distinguishedName'; Single = $true; Note = 'The forest root domain''s distinguished name' }
    [pscustomobject]@{ Placeholder = '<test-dc>'; Field = 'ad.rootDomain.pdcEmulator'; Single = $true; Note = 'The root domain''s PDC emulator, a writable domain controller' }
    [pscustomobject]@{ Placeholder = '<dc>'; Field = 'ad.rootDomain.pdcEmulator'; Single = $true; Note = 'The root domain''s PDC emulator, a writable domain controller' }
)

function ConvertTo-FmpUtc {
    # PowerShell 7's ConvertFrom-Json turns an ISO 8601 string into a DateTime; 5.1 leaves a string.
    param($Value)
    if ($Value -is [datetime]) {
        if ($Value.Kind -eq [DateTimeKind]::Unspecified) { return [datetime]::SpecifyKind($Value, [DateTimeKind]::Utc) }
        return $Value.ToUniversalTime()
    }
    [datetime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Get-FmpFileSha256 {
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Test-FmpProperty {
    param($Object, [string]$Name)
    $null -ne $Object -and $null -ne $Object.PSObject.Properties[$Name]
}

function Import-FmpEnvironment {
    <#
    .SYNOPSIS
        Reads an estate inventory run's EnvironmentProfile.json, checks it, and keeps it for this
        session's Get-FmpEnvironmentValue, Get-FmpEnvironmentPlaceholder and Expand-FmpPlaceholder.

    .DESCRIPTION
        Throws, and keeps nothing, when:
          - the profile is older than -MaxAgeDays (default 8: a weekly run and a day);
          - EstateInventoryManifest.json's SHA-256 isn't the one the profile recorded;
          - SHA256SUMS is missing, or names a different SHA-256 for the profile;
          - the profile's label isn't -Expect (test, production or fixture; default test).
        Returns a summary: the run, its label, its age and how many fields are filled.

    .EXAMPLE
        Import-FmpEnvironment -Path D:\EstateInventory\runs\2026-11-29T020000Z

    .EXAMPLE
        # Lab 1: the profile of a fixture run, whose values are fictional.
        Import-FmpEnvironment -Path C:\FMWLabs\results\estate-inventory\<run> -Expect fixture
    #>
    [CmdletBinding()]
    param(
        # The run folder, or its EnvironmentProfile.json.
        [Parameter(Mandatory, Position = 0)][string]$Path,
        [ValidateRange(0, 3650)][double]$MaxAgeDays = 8,
        [ValidateSet('test', 'production', 'fixture')][string]$Expect = 'test',
        [datetime]$Now = [datetime]::UtcNow
    )
    $item = Get-Item -LiteralPath $Path -ErrorAction Stop
    $run = if ($item.PSIsContainer) { $item.FullName } else { Split-Path -Parent $item.FullName }
    $file = Join-Path $run 'EnvironmentProfile.json'
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "No EnvironmentProfile.json in $run. Run the estate inventory (Invoke-EstateInventory.ps1) first." }
    $doc = Get-Content -LiteralPath $file -Raw | ConvertFrom-Json
    if (-not (Test-FmpProperty $doc 'schema') -or $doc.schema -ne 'fmw-environment-profile/1') { throw "$file isn't an environment profile (schema fmw-environment-profile/1)." }
    $p = $doc.provenance

    $manifest = Join-Path $run $p.manifest
    if (-not (Test-Path -LiteralPath $manifest -PathType Leaf)) { throw "The profile's manifest, $($p.manifest), isn't in $run." }
    $actual = Get-FmpFileSha256 -Path $manifest
    if ($actual -ne $p.manifestSha256) { throw "$($p.manifest) has SHA-256 $actual, not the $($p.manifestSha256) the profile recorded: the run changed after the profile was written. Run the estate inventory again." }

    $sums = Join-Path $run 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums -PathType Leaf)) { throw "No SHA256SUMS in $run, so the profile can't be checked." }
    $line = @(Get-Content -LiteralPath $sums | Where-Object { $_ -match '^[0-9a-f]{64}  EnvironmentProfile\.json$' })
    if ($line.Count -ne 1) { throw "SHA256SUMS has no line for EnvironmentProfile.json." }
    $own = Get-FmpFileSha256 -Path $file
    if ($line[0].Substring(0, 64) -ne $own) { throw "EnvironmentProfile.json changed after the run: SHA256SUMS records $($line[0].Substring(0, 64)), the file is $own." }

    $generated = ConvertTo-FmpUtc $p.generatedUtc
    $age = ($Now.ToUniversalTime() - $generated).TotalDays
    if ($age -gt $MaxAgeDays) { throw ("The profile is {0:N1} days old (run {1}); the limit is {2} days. Run the estate inventory again, or pass a larger -MaxAgeDays." -f $age, $p.runId, $MaxAgeDays) }
    if ($age -lt -0.01) { throw "The profile's time, $($p.generatedUtc), is in the future." }

    if ($p.label -ne $Expect) {
        $why = switch ($p.label) {
            'unlabelled' { 'Set environmentLabel (test or production) in the estate inventory settings and run it again.' }
            'fixture' { 'Its values are fictional; pass -Expect fixture only in Lab 1.' }
            'production' { 'Lab 2s run against a test forest and a test tenant, never production.' }
            default { '' }
        }
        throw "The profile of run $($p.runId) is labelled '$($p.label)', not '$Expect'. $why"
    }

    $fields = @($doc.fields.PSObject.Properties)
    $script:Current = [pscustomobject]@{ Run = $run; Profile = $doc }
    [pscustomobject][ordered]@{
        RunId        = $p.runId
        Label        = $p.label
        GeneratedUtc = $generated.ToString('yyyy-MM-ddTHH:mm:ssZ')
        AgeDays      = [math]::Round($age, 1)
        Filled       = @($fields | Where-Object { $_.Value.status -eq 'ok' }).Count
        Conflict     = @($fields | Where-Object { $_.Value.status -eq 'conflict' } | ForEach-Object Name)
        NotCollected = @($fields | Where-Object { $_.Value.status -eq 'notCollected' } | ForEach-Object Name)
    }
}

function Get-FmpEnvironmentCurrent {
    if (-not $script:Current) { throw 'No environment profile is loaded. Run Import-FmpEnvironment -Path <run folder> first.' }
    $script:Current
}

function Resolve-FmpPlaceholder {
    param([string]$Name)
    $key = if ($Name -match '^<.+>$') { $Name } else { "<$Name>" }
    @($script:PlaceholderMap | Where-Object Placeholder -EQ $key) | Select-Object -First 1
}

function Get-FmpEnvironmentValue {
    <#
    .SYNOPSIS
        One value from the loaded profile, by field name (ad.forestRootDomain) or by the
        placeholder a lab uses (<test-domain>, or test-domain). Throws for a field the kits
        disagree on or didn't collect, and for a placeholder that takes one value when the run
        saw several.

    .EXAMPLE
        Get-FmpEnvironmentValue '<test-domain>'

    .EXAMPLE
        (Get-FmpEnvironmentValue ad.domainControllers) | Where-Object site -EQ 'HQ'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory, Position = 0)][string]$Name)
    $doc = (Get-FmpEnvironmentCurrent).Profile
    $map = Resolve-FmpPlaceholder $Name
    $field = if ($map) { $map.Field } else { $Name }
    if ($field -match '^<' -or -not (Test-FmpProperty $doc.fields $field)) {
        $known = @($doc.fields.PSObject.Properties.Name) + @($script:PlaceholderMap.Placeholder)
        throw "The profile can't fill '$Name'. It fills: $($known -join ', ')."
    }
    $f = $doc.fields.$field
    $reason = if (Test-FmpProperty $f 'reason') { $f.reason } else { '' }
    switch ($f.status) {
        'conflict' {
            $seen = @($f.sources | ForEach-Object { "$($_.file): $($_.value)" }) -join '; '
            throw "The kits disagree on $field ($seen). Check which tenant or forest each kit read before you fill $Name."
        }
        'notCollected' { throw "No kit collected $field in run $($doc.provenance.runId). $reason" }
    }
    $value = $f.value
    if ($map -and $map.Single) {
        $all = @($value)
        if ($all.Count -ne 1) { throw "$Name takes one value, and the run saw $($all.Count) in ${field}: $($all -join ', '). Pick one: Get-FmpEnvironmentValue $field" }
        return $all[0]
    }
    # A list comes out one item at a time: wrap the call in @() to keep a list of one a list.
    $value
}

function Get-FmpEnvironmentPlaceholder {
    <#
    .SYNOPSIS
        Every placeholder the loaded profile can fill: the field it comes from, its value (or why
        it can't be filled) and the file the value came from. With no profile loaded, the mapping.

    .EXAMPLE
        Get-FmpEnvironmentPlaceholder | Format-Table Placeholder, Value, Status
    #>
    [CmdletBinding()]
    param()
    foreach ($m in $script:PlaceholderMap) {
        $value = $null; $status = 'no profile loaded'; $from = $null; $reason = $null
        if ($script:Current) {
            $f = $script:Current.Profile.fields.($m.Field)
            $from = @($f.sources | ForEach-Object { if (Test-FmpProperty $_ 'file') { $_.file } } | Where-Object { $_ } | Select-Object -Unique) -join '; '
            try {
                $value = Get-FmpEnvironmentValue $m.Placeholder
                $status = 'ok'
            } catch {
                $reason = "$($_.Exception.Message)"
                $status = switch ($f.status) { 'conflict' { 'conflict' } 'notCollected' { 'not collected' } default { 'several values' } }
            }
        }
        [pscustomobject][ordered]@{ Placeholder = $m.Placeholder; Field = $m.Field; Value = $value; Status = $status; From = $from; Reason = $reason; Note = $m.Note }
    }
}

function Expand-FmpPlaceholder {
    <#
    .SYNOPSIS
        A lab command with every placeholder the profile can fill filled in. Throws when a
        placeholder it knows can't be filled (a conflict, or several values); warns about the
        placeholders it doesn't know, which stay for you to fill.

    .EXAMPLE
        Expand-FmpPlaceholder 'Get-ADDomainController -Filter * -Server <test-domain> | Select-Object Name, Site'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory, Position = 0, ValueFromPipeline)][string]$Text)
    process {
        $null = Get-FmpEnvironmentCurrent
        $fill = @{}
        $left = [System.Collections.Generic.List[string]]::new()
        foreach ($m in [regex]::Matches($Text, '<[a-z][a-z0-9-]*>')) {
            if ($fill.ContainsKey($m.Value) -or $left.Contains($m.Value)) { continue }
            if (Resolve-FmpPlaceholder $m.Value) { $fill[$m.Value] = "$(Get-FmpEnvironmentValue $m.Value)" }
            else { $left.Add($m.Value) }
        }
        $out = $Text
        foreach ($k in $fill.Keys) { $out = $out.Replace($k, $fill[$k]) }
        if ($left.Count) { Write-Warning "Still to fill by hand: $($left -join ', ')" }
        $out
    }
}

Export-ModuleMember -Function Import-FmpEnvironment, Get-FmpEnvironmentValue, Get-FmpEnvironmentPlaceholder, Expand-FmpPlaceholder
