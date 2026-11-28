#Requires -Version 5.1
# The G5 "AD Retired" evidence packet (Book 01, Chapter 12; Book 00, Chapter 10, Phase 5). Read only: it reads
# Active Directory, DNS and the workspace, compares them with the island register and writes a hashed packet.
# Windows PowerShell 5.1 and PowerShell 7: no PowerShell 7-only syntax.
Set-StrictMode -Version Latest

$script:Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path

function Read-AreJson([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    (Get-Content -LiteralPath $Path -Raw -Encoding UTF8) | ConvertFrom-Json
}

function Get-AreSha256 {
    <#
    .SYNOPSIS
        The SHA-256 of a file, hashed with LF line endings so a hash recorded on one platform matches on another.
    .EXAMPLE
        Get-AreSha256 out/g5/findings.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = (Get-Content -LiteralPath $Path -Raw -Encoding UTF8) -replace "`r`n", "`n"
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $bytes = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($text)) } finally { $sha.Dispose() }
    -join ($bytes | ForEach-Object { $_.ToString('x2') })
}

function ConvertTo-AreJson([object]$Value, [int]$Level = 0) {
    # The packet's JSON, the same bytes in Windows PowerShell 5.1 and PowerShell 7: ConvertTo-Json indents and
    # escapes differently in the two editions, so the files, and the hashes the manifest records, would differ.
    # Two-space indent, keys in the order given, only the escapes JSON requires, dates as UTC yyyy-MM-ddTHH:mm:ssZ.
    $pad = '  ' * ($Level + 1); $end = '  ' * $Level
    if ($null -eq $Value) { return 'null' }
    if ($Value -is [bool]) { return $(if ($Value) { 'true' } else { 'false' }) }
    if ($Value -is [datetime]) { $Value = $Value.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ', [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [string] -or $Value -is [char] -or $Value -is [enum]) {
        $sb = New-Object Text.StringBuilder
        [void]$sb.Append('"')
        foreach ($c in "$Value".ToCharArray()) {
            switch ([int]$c) {
                34 { [void]$sb.Append('\"') } 92 { [void]$sb.Append('\\') } 10 { [void]$sb.Append('\n') } 13 { [void]$sb.Append('\r') } 9 { [void]$sb.Append('\t') }
                default { if ([int]$c -lt 32) { [void]$sb.Append(('\u{0:x4}' -f [int]$c)) } else { [void]$sb.Append($c) } }
            }
        }
        [void]$sb.Append('"')
        return $sb.ToString()
    }
    if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal] -or $Value -is [single]) { return ([IFormattable]$Value).ToString($null, [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [Collections.IDictionary]) {
        $pairs = @(foreach ($k in $Value.Keys) { "$pad$(ConvertTo-AreJson "$k"): $(ConvertTo-AreJson $Value[$k] ($Level + 1))" })
        if (-not $pairs.Count) { return '{}' }
        return "{`n$($pairs -join ",`n")`n$end}"
    }
    if ($Value -is [Collections.IEnumerable]) {
        $items = @(foreach ($v in $Value) { "$pad$(ConvertTo-AreJson $v ($Level + 1))" })
        if (-not $items.Count) { return '[]' }
        return "[`n$($items -join ",`n")`n$end]"
    }
    $props = @($Value.PSObject.Properties | Where-Object { $_.MemberType -match 'Property' })
    $pairs = @(foreach ($p in $props) { "$pad$(ConvertTo-AreJson $p.Name): $(ConvertTo-AreJson $p.Value ($Level + 1))" })
    if (-not $pairs.Count) { return '{}' }
    "{`n$($pairs -join ",`n")`n$end}"
}

function Write-AreJson([object]$Value, [string]$Path) {
    [IO.File]::WriteAllText($Path, ((ConvertTo-AreJson $Value) + "`n"), (New-Object Text.UTF8Encoding $false))
}

function Get-AreIslandRegister {
    <#
    .SYNOPSIS
        Reads the island register: the domain controllers, workloads, accounts, SPNs, trusts and hosts kept at G5, and the end-of-life date.
    .EXAMPLE
        Get-AreIslandRegister -Path config/island-register.json
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:Root 'config/island-register.json'))
    Read-AreJson $Path
}

function Get-AreEstate {
    <#
    .SYNOPSIS
        Reads what G5 checks: the domain controllers, their NTDS Settings objects, the trusts, the SPNs, the enabled computers, the DC locator SRV records and the authentication still reaching the domain controllers.
    .DESCRIPTION
        With -FixturePath, reads saved JSON in the same shapes (dcs.json, ntds.json, trusts.json, spns.json,
        computers.json, srv.json, auth.json), so Lab 1 runs with no forest. Live, it uses the ActiveDirectory
        module's Get-* cmdlets and Resolve-DnsName, all at default read, and reads the authentication rows from
        -AuthPath, the CSV export of queries/dc-authentication.kql (or, with -WorkspaceId, runs the query through
        Az.OperationalInsights as a Log Analytics Data Reader). With -NoDomain (full retirement, after the last
        domain controller is gone) it reads only DNS and the authentication rows.
    .EXAMPLE
        Get-AreEstate -Domain corp.contoso.example -FixturePath tests/fixtures/island
    .EXAMPLE
        Get-AreEstate -Domain corp.example.gov -AuthPath .\dc-auth.csv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Domain, [string]$FixturePath, [string]$AuthPath, [string]$WorkspaceId, [switch]$NoDomain)
    if ($FixturePath) {
        $get = { param($n) $v = Read-AreJson (Join-Path $FixturePath "$n.json"); if ($null -eq $v) { @() } else { @($v) } }
        return [pscustomobject]@{
            Dcs = & $get 'dcs'; Ntds = & $get 'ntds'; Trusts = & $get 'trusts'; Spns = & $get 'spns'
            Computers = & $get 'computers'; Srv = & $get 'srv'; Auth = & $get 'auth'
        }
    }
    $srv = @()
    try { $srv = @(Resolve-DnsName -Type SRV -Name "_ldap._tcp.dc._msdcs.$Domain" -ErrorAction Stop | Where-Object { $_.Type -eq 'SRV' } | ForEach-Object { [pscustomobject]@{ NameTarget = $_.NameTarget; Port = $_.Port } }) } catch { $srv = @() }
    $auth = @()
    if ($AuthPath) { $auth = @(Import-Csv -LiteralPath $AuthPath) }
    elseif ($WorkspaceId) {
        $kql = Get-Content -LiteralPath (Join-Path $script:Root 'queries/dc-authentication.kql') -Raw
        $auth = @((Invoke-AzOperationalInsightsQuery -WorkspaceId $WorkspaceId -Query $kql).Results)
    }
    if ($NoDomain) {
        return [pscustomobject]@{ Dcs = @(); Ntds = @(); Trusts = @(); Spns = @(); Computers = @(); Srv = $srv; Auth = $auth }
    }
    Import-Module ActiveDirectory -ErrorAction Stop
    $config = (Get-ADRootDSE -Server $Domain).configurationNamingContext
    [pscustomobject]@{
        Dcs = @(Get-ADDomainController -Filter * -Server $Domain | ForEach-Object { [pscustomobject]@{ Name = $_.Name; HostName = $_.HostName; Site = $_.Site; OperatingSystem = $_.OperatingSystem } })
        Ntds = @(Get-ADObject -Server $Domain -SearchBase $config -LDAPFilter '(objectClass=nTDSDSA)' | ForEach-Object { [pscustomobject]@{ Server = ($_.DistinguishedName -split ',')[1] -replace '^CN=', ''; DistinguishedName = $_.DistinguishedName } })
        Trusts = @(Get-ADTrust -Filter * -Server $Domain | ForEach-Object { [pscustomobject]@{ Name = $_.Name; Direction = "$($_.Direction)"; TrustType = "$($_.TrustType)" } })
        Spns = @(Get-ADObject -Server $Domain -LDAPFilter '(servicePrincipalName=*)' -Properties servicePrincipalName, sAMAccountName | ForEach-Object { $o = $_; foreach ($s in $o.servicePrincipalName) { [pscustomobject]@{ Account = $o.sAMAccountName; ObjectClass = $o.ObjectClass; Spn = $s } } })
        Computers = @(Get-ADComputer -Server $Domain -Filter 'Enabled -eq $true' -Properties lastLogonTimestamp, operatingSystem | ForEach-Object { [pscustomobject]@{ Name = $_.Name; OperatingSystem = $_.operatingSystem; LastLogonUtc = $(if ($_.lastLogonTimestamp) { [DateTime]::FromFileTimeUtc($_.lastLogonTimestamp).ToString('yyyy-MM-ddTHH:mm:ssZ') } else { $null }) } })
        Srv = $srv; Auth = $auth
    }
}

function Test-AreG5 {
    <#
    .SYNOPSIS
        Checks the estate against gate G5 and the island register, and returns the findings. Changes nothing.
    .DESCRIPTION
        G5 (Book 01, Chapter 12): domain controllers decommissioned, or retained as a documented Kerberos
        island with an end-of-life date; no live production dependency on AD authentication.
          AD-G5-01  a domain controller that isn't in the island register
          AD-G5-02  the island has no end-of-life date, or it has passed; a workload past its own date
          AD-G5-03  an NTDS Settings object for a server that is no longer a domain controller (metadata cleanup)
          AD-G5-04  a DC locator SRV record pointing at a host that isn't an island domain controller
          AD-G5-05  a trust the register doesn't list
          AD-G5-06  an SPN on a user or managed service account the register doesn't list
          AD-G5-07  authentication reaching a domain controller from an account the register doesn't list
          AD-G5-08  (a warning) an enabled computer that signed in to the domain in the window and isn't a listed host
          AD-G5-09  no authentication rows at all while domain controllers still run: the export is broken, not clean
    .EXAMPLE
        $e = Get-AreEstate -Domain corp.contoso.example -FixturePath tests/fixtures/island; Test-AreG5 -Estate $e -Register (Get-AreIslandRegister) -AsOf 2026-11-27
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object]$Estate, [Parameter(Mandatory)][object]$Register, [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $f = New-Object System.Collections.Generic.List[object]
    $add = { param($rule, $sev, $obj, $issue) $f.Add([pscustomobject]@{ Rule = $rule; Severity = $sev; Object = $obj; Issue = $issue }) }
    $keptDcs = @($Register.domainControllers)
    $accounts = @($Register.workloads | ForEach-Object { $_.accounts }) | ForEach-Object { "$_".ToLowerInvariant().TrimEnd('$') }
    $spns = @($Register.workloads | ForEach-Object { $_.spns }) | ForEach-Object { "$_".ToLowerInvariant() }
    $hosts = @($Register.allowedHosts) | ForEach-Object { "$_".ToUpperInvariant() }
    $dcNames = @($Estate.Dcs | ForEach-Object { "$($_.Name)".ToUpperInvariant() })

    foreach ($dc in $Estate.Dcs) { if ($keptDcs -notcontains $dc.Name) { & $add 'AD-G5-01' 'Finding' $dc.Name 'A domain controller that is neither decommissioned nor in the island register' } }
    if ($keptDcs.Count) {
        if (-not $Register.endOfLife) { & $add 'AD-G5-02' 'Finding' $Register.domain 'The island has no end-of-life date' }
        elseif ([datetime]$Register.endOfLife -lt $AsOf) { & $add 'AD-G5-02' 'Finding' $Register.domain "The island's end of life, $($Register.endOfLife), has passed" }
        foreach ($w in $Register.workloads) { if ($w.endOfLife -and [datetime]$w.endOfLife -lt $AsOf) { & $add 'AD-G5-02' 'Finding' $w.name "The workload's end of life, $($w.endOfLife), has passed" } }
    }
    foreach ($n in $Estate.Ntds) { if ($dcNames -notcontains "$($n.Server)".ToUpperInvariant()) { & $add 'AD-G5-03' 'Finding' $n.Server 'An NTDS Settings object for a server that is no longer a domain controller: clean up its metadata' } }
    foreach ($s in $Estate.Srv) {
        $h = ("$($s.NameTarget)".TrimEnd('.') -split '\.')[0].ToUpperInvariant()
        if (@($keptDcs | ForEach-Object { "$_".ToUpperInvariant() }) -notcontains $h) { & $add 'AD-G5-04' 'Finding' $s.NameTarget 'A DC locator SRV record pointing at a host that is not an island domain controller' }
    }
    $listedTrusts = @($Register.trusts)
    foreach ($t in $Estate.Trusts) { if ($listedTrusts -notcontains $t.Name) { & $add 'AD-G5-05' 'Finding' $t.Name "A trust the register doesn't list (direction: $($t.Direction))" } }
    foreach ($s in $Estate.Spns) {
        if ("$($s.ObjectClass)" -eq 'computer') { continue }
        if ($spns -notcontains "$($s.Spn)".ToLowerInvariant() -and $accounts -notcontains "$($s.Account)".ToLowerInvariant().TrimEnd('$')) { & $add 'AD-G5-06' 'Finding' "$($s.Account) $($s.Spn)" 'An SPN on an account the register does not list: a service still depends on Kerberos from the domain' }
    }
    $authByAccount = @{}
    foreach ($a in $Estate.Auth) {
        $acct = "$($a.TargetUserName)".ToLowerInvariant().TrimEnd('$')
        if (-not $acct -or $accounts -contains $acct -or $hosts -contains $acct.ToUpperInvariant()) { continue }
        if (-not $authByAccount.ContainsKey($acct)) { $authByAccount[$acct] = 0 }
        $authByAccount[$acct] += [int]$a.Count
    }
    foreach ($k in ($authByAccount.Keys | Sort-Object)) { & $add 'AD-G5-07' 'Finding' $k "$($authByAccount[$k]) authentication events on the domain controllers in the window from an account the register does not list" }
    # No rows at all while domain controllers still run means the events aren't reaching the workspace (auditing off,
    # forwarding broken, the wrong workspace), not that nothing signs in, so AD-G5-07's silence can't be read as clean.
    $dcCount = @($Estate.Dcs).Count
    if ($dcCount -gt 0 -and @($Estate.Auth).Count -eq 0) { & $add 'AD-G5-09' 'Finding' $Register.domain "No authentication rows were read while $dcCount domain controller(s) still run: check auditing and forwarding to the workspace, then export again" }
    $since = $AsOf.AddDays(-[int]$Register.authWindowDays)
    foreach ($c in $Estate.Computers) {
        if (-not $c.LastLogonUtc -or [datetime]$c.LastLogonUtc -lt $since) { continue }
        if ($hosts -notcontains "$($c.Name)".ToUpperInvariant() -and $dcNames -notcontains "$($c.Name)".ToUpperInvariant()) { & $add 'AD-G5-08' 'Warn' $c.Name 'An enabled computer that signed in to the domain in the window and is not a listed host' }
    }
    $f.ToArray()
}

function New-AreEvidencePacket {
    <#
    .SYNOPSIS
        Writes the G5 evidence packet: what was read, the findings, a summary and a manifest with each file's SHA-256, the controls and the KSIs.
    .DESCRIPTION
        Book 01, Chapter 12 asks for the G5 evidence packet "in the repository and the SIEM". This writes the
        packet for the repository; the summary's hash is what the SIEM record carries. Ready is true only when
        there is no Finding (warnings are listed for the gate owner). Read only: it writes files.
    .EXAMPLE
        New-AreEvidencePacket -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5 -AsOf 2026-11-27
    .EXAMPLE
        New-AreEvidencePacket -Domain corp.example.gov -AuthPath .\dc-auth.csv -RegisterPath .\island-register.json -OutputPath .\g5-packet
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Domain, [Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$AuthPath,
          [string]$WorkspaceId, [string]$RegisterPath = (Join-Path $script:Root 'config/island-register.json'), [switch]$NoDomain,
          [datetime]$AsOf = (Get-Date).ToUniversalTime())
    # The date the packet records, in UTC: a local time is converted, a date with no zone (-AsOf 2026-11-27) is taken as UTC,
    # so the packet is the same on every machine whatever its time zone.
    $asOfUtc = if ($AsOf.Kind -eq [DateTimeKind]::Local) { $AsOf.ToUniversalTime() } else { [datetime]::SpecifyKind($AsOf, [DateTimeKind]::Utc) }
    $register = Get-AreIslandRegister -Path $RegisterPath
    $estate = Get-AreEstate -Domain $Domain -FixturePath $FixturePath -AuthPath $AuthPath -WorkspaceId $WorkspaceId -NoDomain:$NoDomain
    $findings = @(Test-AreG5 -Estate $estate -Register $register -AsOf $AsOf)
    if (-not (Test-Path -LiteralPath $OutputPath)) { New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null }
    $files = [ordered]@{ 'dcs.json' = $estate.Dcs; 'ntds.json' = $estate.Ntds; 'trusts.json' = $estate.Trusts; 'spns.json' = $estate.Spns
                         'computers.json' = $estate.Computers; 'srv.json' = $estate.Srv; 'auth.json' = $estate.Auth; 'findings.json' = $findings }
    foreach ($k in $files.Keys) { Write-AreJson @($files[$k]) (Join-Path $OutputPath $k) }
    $real = @($findings | Where-Object { $_.Severity -eq 'Finding' })
    $warn = @($findings | Where-Object { $_.Severity -eq 'Warn' })
    $mode = if (@($register.domainControllers).Count) { "Kerberos island ($(@($register.domainControllers) -join ', '), end of life $($register.endOfLife))" } else { 'Full retirement' }
    $lines = @("# G5 evidence packet: $Domain, $($asOfUtc.ToString('yyyy-MM-dd'))", '',
        "- Mode: $mode",
        "- Domain controllers read: $(@($estate.Dcs).Count); DC locator SRV records: $(@($estate.Srv).Count); trusts: $(@($estate.Trusts).Count)",
        "- Authentication rows read: $(@($estate.Auth).Count) over $($register.authWindowDays) days",
        "- Findings: $($real.Count); warnings: $($warn.Count)",
        "- Ready for the gate owner: $(if ($real.Count -eq 0) { 'yes' } else { 'no' })", '', '## Findings', '')
    $lines += $(if ($findings.Count) { $findings | ForEach-Object { "- $($_.Rule) ($($_.Severity)) $($_.Object): $($_.Issue)" } } else { '- None.' })
    $lines += @('', 'The packet supports CM-8, AC-2, IA-2, AU-6, CA-7 and SA-22; the gate owner checks it and the assessor decides each control.')
    [IO.File]::WriteAllText((Join-Path $OutputPath 'summary.md'), (($lines -join "`n") + "`n"), (New-Object Text.UTF8Encoding $false))
    $req = (Read-AreJson (Join-Path $script:Root 'config/requirements.json')).steps.'g5-evidence'
    $hashes = foreach ($k in (@($files.Keys) + 'summary.md' | Sort-Object)) { [ordered]@{ path = $k; sha256 = (Get-AreSha256 (Join-Path $OutputPath $k)) } }
    $manifest = [ordered]@{ step = 'g5-evidence'; mode = 'read'; domain = $Domain; asOfUtc = $asOfUtc.ToString('yyyy-MM-ddTHH:mm:ssZ'); ready = ($real.Count -eq 0)
                            register = [ordered]@{ path = (Split-Path -Leaf $RegisterPath); sha256 = (Get-AreSha256 $RegisterPath) }; controls = $req.controls; ksis = $req.ksis; files = @($hashes) }
    Write-AreJson $manifest (Join-Path $OutputPath 'manifest.json')
    [pscustomobject]@{ Domain = $Domain; Ready = ($real.Count -eq 0); Findings = $real.Count; Warnings = $warn.Count; ManifestSha256 = (Get-AreSha256 (Join-Path $OutputPath 'manifest.json')); OutputPath = $OutputPath }
}

Export-ModuleMember -Function Get-AreSha256, Get-AreIslandRegister, Get-AreEstate, Test-AreG5, New-AreEvidencePacket
