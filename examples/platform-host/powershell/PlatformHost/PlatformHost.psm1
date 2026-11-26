#Requires -Version 5.1
<#
    PlatformHost: the read-only interface check for the platform host (Gitea behind IIS on Windows Server 2025).

    Pure functions only: nothing here reads the host. The collectors (Get-PhWindowsSnapshot.ps1 in Windows
    PowerShell 5.1, Get-PhGiteaSnapshot.ps1 in PowerShell 7.6) write snapshots; Test-PhSnapshot compares them with
    the settings file and returns one row per check; Write-PhEvidence records a run. The module runs unchanged in
    Windows PowerShell 5.1 and PowerShell 7, on Windows or Linux, so the tests run on fixtures anywhere.
#>
Set-StrictMode -Version 2.0

$script:SecretKeyPattern = '(?i)(SECRET|TOKEN|PASSWD|PASSWORD|_KEY$|^KEY$)'

function Get-PhKitRoot { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }

function Read-PhJson {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "File not found: $Path" }
    [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path) | ConvertFrom-Json
}

function Write-PhText {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $full = [IO.Path]::GetFullPath($Path)
    [IO.File]::WriteAllText($full, ($Text -replace "`r`n", "`n"), (New-Object Text.UTF8Encoding($false)))
}

function Write-PhJson {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)]$Value)
    Write-PhText -Path $Path -Text (($Value | ConvertTo-Json -Depth 12) + "`n")
}

function Get-PhFileHash {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Path).Path)
        (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '')
    } finally { $sha.Dispose() }
}

function Get-PhProp {
    # Reads a property that may be missing (StrictMode-safe); returns $Default when it isn't there.
    param($Object, [string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object -is [Collections.IDictionary]) { if ($Object.Contains($Name)) { return $Object[$Name] } else { return $Default } }
    $p = $Object.PSObject.Properties[$Name]
    if ($null -eq $p) { return $Default }
    $p.Value
}

function ConvertTo-PhUtc {
    <#
    .SYNOPSIS
        Returns a UTC DateTime from a snapshot's time, whether ConvertFrom-Json left it a string (Windows
        PowerShell 5.1) or already made it a DateTime (PowerShell 7).
    #>
    param([Parameter(Mandatory)]$Value)
    if ($Value -is [DateTime]) { if ($Value.Kind -eq [DateTimeKind]::Unspecified) { return [DateTime]::SpecifyKind($Value, [DateTimeKind]::Utc) } ; return $Value.ToUniversalTime() }
    [DateTime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Format-PhUtc { param([Parameter(Mandatory)]$Value) (ConvertTo-PhUtc $Value).ToString('yyyy-MM-ddTHH:mm:ssZ', [Globalization.CultureInfo]::InvariantCulture) }

function ConvertFrom-PhIni {
    <#
    .SYNOPSIS
        Parses Gitea's app.ini into an ordered dictionary of sections (the keys before any [section] go under '_root', since JSON can't carry an empty name to Windows PowerShell).
        Keys that hold secrets (SECRET, TOKEN, PASSWD, PASSWORD, KEY) keep only the fact that they're set: the
        value becomes '<set>' or '<empty>', so a snapshot never carries a secret.
    .EXAMPLE
        ConvertFrom-PhIni -Text (Get-Content -Raw D:\Gitea\custom\conf\app.ini)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $out = [ordered]@{ '_root' = [ordered]@{} }
    $section = '_root'
    foreach ($raw in ($Text -split "`r?`n")) {
        $line = $raw.Trim()
        if (-not $line -or $line.StartsWith(';') -or $line.StartsWith('#')) { continue }
        if ($line -match '^\[(.+)\]$') { $section = $Matches[1].Trim(); if (-not $out.Contains($section)) { $out[$section] = [ordered]@{} }; continue }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { continue }
        $key = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith('`') -and $value.EndsWith('`')))) { $value = $value.Substring(1, $value.Length - 2) }
        if ($key -match $script:SecretKeyPattern) { $value = $(if ($value) { '<set>' } else { '<empty>' }) }
        $out[$section][$key] = $value
    }
    $out
}

function Get-PhIniValue {
    param($Ini, [string]$Section, [string]$Key)
    $s = Get-PhProp -Object $Ini -Name $Section
    if ($null -eq $s) { return $null }
    Get-PhProp -Object $s -Name $Key
}

function Test-PhWebhookSignature {
    <#
    .SYNOPSIS
        Verifies a Gitea webhook delivery: X-Gitea-Signature is the hex HMAC-SHA256 of the raw request body,
        keyed with the webhook's secret. Returns $true only when the signature matches, compared in constant time.
        A receiver calls this before it acts on a delivery.
    .EXAMPLE
        Test-PhWebhookSignature -Body $rawBody -Secret $secret -Signature $headers['X-Gitea-Signature']
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Body, [Parameter(Mandatory)][string]$Secret, [Parameter(Mandatory)][AllowEmptyString()][string]$Signature)
    $hmac = New-Object Security.Cryptography.HMACSHA256 -ArgumentList (, [Text.Encoding]::UTF8.GetBytes($Secret))
    try { $expected = (($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Body)) | ForEach-Object { $_.ToString('x2') }) -join '') } finally { $hmac.Dispose() }
    $given = ($Signature -replace '^sha256=', '').Trim().ToLowerInvariant()
    if ($given.Length -ne $expected.Length) { return $false }
    $diff = 0
    for ($i = 0; $i -lt $expected.Length; $i++) { $diff = $diff -bor ([int][char]$expected[$i] -bxor [int][char]$given[$i]) }
    $diff -eq 0
}

function Get-PhRequirements {
    [CmdletBinding()]
    param([string]$Path = (Join-Path (Get-PhKitRoot) 'config/requirements.json'))
    Read-PhJson -Path $Path
}

function New-PhRow {
    param([string]$Id, [string]$Status, [string]$Detail, [string]$Interface)
    [pscustomobject][ordered]@{ Check = $Id; Status = $Status; Interface = $Interface; Detail = $Detail }
}

function Test-PhSnapshot {
    <#
    .SYNOPSIS
        Compares the host's snapshots with the settings file and returns one row per check, PH-01 to PH-12:
        Pass, Finding, or NotChecked (with the reason). Reads nothing from the host.
    .EXAMPLE
        Test-PhSnapshot -Settings (Read-PhJson config/settings.lab.json) -Windows (Read-PhJson out/snapshot-windows.json) -Gitea (Read-PhJson out/snapshot-gitea.json) -AsOf 2026-11-26T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Settings, [Parameter(Mandatory)]$Windows, $Gitea, $Manifest, [Parameter(Mandatory)][string]$AsOf)
    $now = ConvertTo-PhUtc $AsOf
    $rows = New-Object Collections.Generic.List[object]
    $exp = $Settings.expected

    # PH-01 Listeners: Gitea on loopback HTTP and its SSH port only; IIS on 443; nothing on 80 unless allowed.
    $listen = @(Get-PhProp $Windows 'listeners' @())
    $problems = @()
    $giteaPids = @($listen | Where-Object { "$($_.process)" -match '^gitea' } | ForEach-Object { $_.pid } | Select-Object -Unique)
    $giteaPorts = @($listen | Where-Object { "$($_.process)" -match '^gitea' })
    # A loopback listener in Windows' dynamic port range (49152 to 65535) isn't reachable from the network; the lab's Gitea
    # opened one. It's reported in the detail, not as a finding.
    $loopbackDynamic = @()
    foreach ($l in $giteaPorts) {
        $okHttp = ([int]$l.port -eq [int]$exp.giteaHttpPort -and "$($l.address)" -eq '127.0.0.1')
        $okSsh = ([int]$l.port -eq [int]$exp.giteaSshPort)
        if ("$($l.address)" -in @('127.0.0.1', '::1') -and [int]$l.port -ge 49152 -and -not ($okHttp -or $okSsh)) { $loopbackDynamic += "$($l.address):$($l.port)"; continue }
        if (-not ($okHttp -or $okSsh)) { $problems += "gitea listens on $($l.address):$($l.port)" }
    }
    if (-not @($giteaPorts | Where-Object { [int]$_.port -eq [int]$exp.giteaHttpPort -and "$($_.address)" -eq '127.0.0.1' }).Count) { $problems += "nothing from gitea on 127.0.0.1:$($exp.giteaHttpPort)" }
    if (-not @($giteaPorts | Where-Object { [int]$_.port -eq [int]$exp.giteaSshPort }).Count) { $problems += "nothing from gitea on port $($exp.giteaSshPort)" }
    if (-not @($listen | Where-Object { [int]$_.port -eq 443 }).Count) { $problems += 'nothing listens on 443' }
    if (-not [bool](Get-PhProp $exp 'allowPort80' $false) -and @($listen | Where-Object { [int]$_.port -eq 80 }).Count) { $problems += 'something listens on port 80' }
    foreach ($p in @(Get-PhProp $exp 'forbiddenPorts' @())) { if (@($listen | Where-Object { [int]$_.port -eq [int]$p }).Count) { $problems += "something listens on port $p" } }
    $rows.Add((New-PhRow 'PH-01' $(if ($problems.Count) { 'Finding' } else { 'Pass' }) $(if ($problems.Count) { $problems -join '; ' } else { "gitea on 127.0.0.1:$($exp.giteaHttpPort) and port $($exp.giteaSshPort)$(if ($loopbackDynamic.Count) { " (and loopback only: $($loopbackDynamic -join ', '))" }); 443 answers; nothing on 80 or $(@($exp.forbiddenPorts) -join ', ')" }) 'A.1, A.2'))

    # PH-02 Firewall: every profile on, inbound blocked by default, and allow rules only for the published ports.
    $profiles = @(Get-PhProp $Windows 'firewallProfiles' @())
    $fw = @()
    foreach ($fp in $profiles) {
        if (-not [bool]$fp.enabled) { $fw += "$($fp.name) profile off" }
        elseif ("$($fp.defaultInboundAction)" -notin @('Block', 'NotConfigured')) { $fw += "$($fp.name) profile inbound $($fp.defaultInboundAction)" }
    }
    if (-not $profiles.Count) { $fw += 'no firewall profiles in the snapshot' }
    $rules = @(Get-PhProp $Windows 'firewallRules' @())
    foreach ($port in @(443, [int]$exp.giteaSshPort)) { if (-not @($rules | Where-Object { "$($_.localPort)" -eq "$port" }).Count) { $fw += "no inbound allow rule for $port" } }
    $rows.Add((New-PhRow 'PH-02' $(if ($fw.Count) { 'Finding' } else { 'Pass' }) $(if ($fw.Count) { $fw -join '; ' } else { "$($profiles.Count) profiles on, inbound blocked by default; allow rules for 443 and $($exp.giteaSshPort)" }) 'Inbound posture'))

    # PH-03 TLS: the 443 binding's certificate, its key, its expiry, and the old protocols off.
    $tls = Get-PhProp $Windows 'tls'
    $t = @()
    if ($null -eq $tls -or -not (Get-PhProp $tls 'thumbprint')) { $t += 'no certificate bound to 443' }
    else {
        $days = [math]::Floor(((ConvertTo-PhUtc $tls.notAfter) - $now).TotalDays)
        if ($days -lt [int]$exp.minCertificateDays) { $t += "certificate expires in $days days (limit $($exp.minCertificateDays))" }
        if ([int]$tls.keySize -lt [int]$exp.minKeySize) { $t += "key is $($tls.keySize) bits (minimum $($exp.minKeySize))" }
        if ([bool]$tls.selfSigned -and -not [bool](Get-PhProp $exp 'allowSelfSigned' $false)) { $t += 'certificate is self-signed' }
        if ($exp.hostName -and @($tls.dnsNames) -notcontains $exp.hostName) { $t += "certificate doesn't name $($exp.hostName)" }
        # Windows Server 2025 (build 26100) turns TLS 1.0 and 1.1 off by default; an Enabled value of 1 turns one back on.
        $build = [int](Get-PhProp (Get-PhProp $Windows 'os') 'build' 0)
        foreach ($proto in @('TLS 1.0', 'TLS 1.1')) {
            $state = "$(Get-PhProp (Get-PhProp $tls 'protocols') $proto 'default')"
            if ($state -eq 'enabled') { $t += "$proto is enabled for the server" }
            elseif ($state -eq 'default' -and $build -lt 26100) { $t += "$proto isn't set and this build ($build) predates Windows Server 2025's default; set Enabled=0" }
        }
    }
    $rows.Add((New-PhRow 'PH-03' $(if ($t.Count) { 'Finding' } else { 'Pass' }) $(if ($t.Count) { $t -join '; ' } else { "$($tls.subject), $($tls.keyAlgorithm) $($tls.keySize), expires $((Format-PhUtc $tls.notAfter).Substring(0,10)); TLS 1.0 and 1.1 off" }) 'A.1'))

    # PH-04 Reverse proxy: one catch-all rule to loopback, ARR on without host rewrite, request size, HSTS, WebSockets.
    $iis = Get-PhProp $Windows 'iis'
    $r = @()
    if ($null -eq $iis) { $r += 'no IIS facts in the snapshot' }
    else {
        $ruleList = @(Get-PhProp $iis 'rewriteRules' @())
        $target = "http://127.0.0.1:$($exp.giteaHttpPort)"
        if ($ruleList.Count -ne 1) { $r += "$($ruleList.Count) rewrite rules (expected one)" }
        foreach ($rr in $ruleList) {
            if (-not [bool]$rr.stopProcessing) { $r += "rule $($rr.name) doesn't stop processing" }
            if ("$($rr.actionType)" -ne 'Rewrite' -or -not "$($rr.actionUrl)".StartsWith($target)) { $r += "rule $($rr.name) goes to $($rr.actionUrl)" }
            if ("$($rr.matchUrl)" -ne '(.*)') { $r += "rule $($rr.name) matches $($rr.matchUrl), not everything" }
        }
        if (-not [bool](Get-PhProp $iis 'proxyEnabled' $false)) { $r += 'ARR proxy is off' }
        if ([bool](Get-PhProp $iis 'reverseRewriteHostInResponseHeaders' $true)) { $r += 'ARR rewrites the host in response headers' }
        if ([bool](Get-PhProp $iis 'useOriginalURLEncoding' $true)) { $r += 'the rewrite rules re-encode the URL (useOriginalURLEncoding is not false)' }
        if ([long](Get-PhProp $iis 'maxAllowedContentLength' 0) -lt [long]$exp.maxAllowedContentLength) { $r += "maxAllowedContentLength is $($iis.maxAllowedContentLength)" }
        if (-not [bool](Get-PhProp $iis 'hstsEnabled' $false)) { $r += 'HSTS is off' }
        elseif ([long](Get-PhProp $iis 'hstsMaxAge' 0) -lt 31536000) { $r += "HSTS max-age is $($iis.hstsMaxAge)" }
        if (-not [bool](Get-PhProp $iis 'webSockets' $false)) { $r += 'the WebSocket Protocol feature is missing' }
    }
    $rows.Add((New-PhRow 'PH-04' $(if ($r.Count) { 'Finding' } else { 'Pass' }) $(if ($r.Count) { $r -join '; ' } else { "one stop-processing rule to $target; ARR on, no host rewrite; $($iis.maxAllowedContentLength) bytes; HSTS on; WebSockets" }) 'A.1'))

    # PH-05 IIS log: W3C on a local drive, hourly, with the fields the evidence needs.
    $lg = Get-PhProp $iis 'log'
    $g = @()
    if ($null -eq $lg) { $g += 'no IIS log facts' }
    else {
        if ("$($lg.format)" -ne 'W3c') { $g += "format $($lg.format)" }
        if ("$($lg.period)" -ne 'Hourly') { $g += "rollover $($lg.period) (hourly expected)" }
        if ("$($lg.directory)" -match '^\\\\') { $g += "directory $($lg.directory) isn't local" }
        $fields = @("$($lg.fields)" -split '\s*,\s*' | Where-Object { $_ })
        $missing = @($exp.logFields | Where-Object { $fields -notcontains $_ })
        if ($missing.Count) { $g += "missing fields: $($missing -join ', ')" }
    }
    $rows.Add((New-PhRow 'PH-05' $(if ($g.Count) { 'Finding' } else { 'Pass' }) $(if ($g.Count) { $g -join '; ' } else { "W3C, hourly, $(@($exp.logFields).Count) required fields, $($lg.directory)" }) 'D.5'))

    # PH-06 app.ini: each expected setting, compared as text, case-insensitive.
    $ini = Get-PhProp $Windows 'appIni'
    $a = @()
    if ($null -eq $ini) { $a += 'no app.ini in the snapshot' }
    else {
        foreach ($e in @($exp.appIni)) {
            $v = Get-PhIniValue -Ini $ini -Section "$($e.section)" -Key "$($e.key)"
            if ($null -eq $v) { $a += "[$($e.section)] $($e.key) not set (expected $($e.value))" }
            elseif ("$v" -ne "$($e.value)") { $a += "[$($e.section)] $($e.key) = $v (expected $($e.value))" }
        }
    }
    $rows.Add((New-PhRow 'PH-06' $(if ($a.Count) { 'Finding' } else { 'Pass' }) $(if ($a.Count) { $a -join '; ' } else { "$(@($exp.appIni).Count) settings as expected" }) 'A.2, A.3, A.5'))

    # PH-07 Service identity: the gitea service runs as the expected account, starts automatically, and RUN_USER agrees.
    $svc = Get-PhProp $Windows 'service'
    $s = @()
    if ($null -eq $svc) { $s += 'no gitea service' }
    else {
        if ("$($svc.startName)" -ne "$($exp.serviceAccount)") { $s += "runs as $($svc.startName) (expected $($exp.serviceAccount))" }
        if ("$($svc.state)" -ne 'Running') { $s += "state $($svc.state)" }
        if ("$($svc.startMode)" -ne 'Auto') { $s += "start mode $($svc.startMode)" }
        if (-not [bool](Get-PhProp $svc 'delayedAutoStart' $false)) { $s += 'not delayed start' }
        # Gitea doesn't compare RUN_USER with the account on Windows, so the check does: the two must agree.
        $runUser = Get-PhIniValue -Ini $ini -Section '_root' -Key 'RUN_USER'
        $runUserExp = "$($exp.runUser)".Replace('{COMPUTERNAME}', "$(Get-PhProp $Windows 'computer' '')")
        if ("$runUser" -ne $runUserExp) { $s += "RUN_USER is $runUser (expected $runUserExp)" }
    }
    $rows.Add((New-PhRow 'PH-07' $(if ($s.Count) { 'Finding' } else { 'Pass' }) $(if ($s.Count) { $s -join '; ' } else { "$($svc.startName), running, automatic (delayed); RUN_USER $runUserExp" }) 'B.4, E.2'))

    # PH-08 Storage: no broad principal can write to the data, repository or backup folders.
    $acls = @(Get-PhProp $Windows 'acls' @())
    $broad = @($exp.broadPrincipals)
    $writeRights = 'FullControl|Modify|Write|CreateFiles|AppendData|ChangePermissions|TakeOwnership|Delete'
    $n = @()
    foreach ($p in @($exp.governedPaths)) {
        $entry = @($acls | Where-Object { "$($_.path)" -eq "$p" })
        if (-not $entry.Count) { $n += "$p not in the snapshot"; continue }
        foreach ($ace in @($entry[0].access)) {
            if ("$($ace.type)" -eq 'Allow' -and $broad -contains "$($ace.identity)" -and "$($ace.rights)" -match $writeRights) { $n += "$p gives $($ace.identity) $($ace.rights)" }
        }
        $svcAce = @($entry[0].access | Where-Object { "$($_.identity)" -eq "$($exp.serviceAccountAcl)" -and "$($_.type)" -eq 'Allow' -and "$($_.rights)" -match 'FullControl|Modify' })
        if (-not $svcAce.Count) { $n += "$p doesn't give $($exp.serviceAccountAcl) Modify" }
    }
    $rows.Add((New-PhRow 'PH-08' $(if ($n.Count) { 'Finding' } else { 'Pass' }) $(if ($n.Count) { $n -join '; ' } else { "$(@($exp.governedPaths).Count) folders: no write for $($broad -join ', '); $($exp.serviceAccountAcl) has Modify" }) 'E.4'))

    # PH-09 Release manifest: gitea.exe's hash and the running version match the pinned release.
    $m = @()
    if ($null -eq $Manifest) { $m += 'no release manifest' }
    else {
        $pin = @($Manifest.components | Where-Object { $_.id -eq 'gitea' })[0]
        $hash = "$(Get-PhProp (Get-PhProp $Windows 'binaries') 'giteaSha256')"
        if (-not $hash) { $m += 'gitea.exe not hashed' } elseif ($hash -ne "$($pin.sha256)") { $m += "gitea.exe hash $($hash.Substring(0,12))... isn't the pinned $($pin.version)" }
        $ver = "$(Get-PhProp $Gitea 'version')"
        if ($null -ne $Gitea -and $ver -and $ver -ne "$($pin.version)") { $m += "Gitea reports $ver, pinned $($pin.version)" }
    }
    $rows.Add((New-PhRow 'PH-09' $(if ($m.Count) { 'Finding' } else { 'Pass' }) $(if ($m.Count) { $m -join '; ' } else { "gitea.exe is the pinned $($pin.version) (SHA-256 $($pin.sha256.Substring(0,12))...)" }) 'F.3'))

    # PH-10 Gitea API: sign-in required, webhooks only to listed receivers, mirrors fresh.
    if ($null -eq $Gitea) { $rows.Add((New-PhRow 'PH-10' 'NotChecked' 'no Gitea snapshot (run Get-PhGiteaSnapshot.ps1 in PowerShell 7.6)' 'A.4, D.2, F.1')) }
    else {
        $q = @()
        if ([int](Get-PhProp $Gitea 'anonymousStatus' 0) -notin @(401, 403)) { $q += "an anonymous API read answered $($Gitea.anonymousStatus)" }
        $allowed = @($exp.webhookHosts)
        foreach ($h in @(Get-PhProp $Gitea 'webhooks' @())) {
            $hostName = ([Uri]"$($h.url)").Host
            if ($allowed -notcontains $hostName) { $q += "webhook $($h.scope) $($h.id) sends to $hostName" }
            if ("$($h.url)" -notmatch '^https://') { $q += "webhook $($h.scope) $($h.id) isn't HTTPS" }
        }
        foreach ($mr in @(Get-PhProp $Gitea 'mirrors' @())) {
            if (-not "$($mr.mirrorUpdated)") { $q += "mirror $($mr.fullName) has never synced"; continue }
            $lastUtc = ConvertTo-PhUtc $mr.mirrorUpdated
            if ($lastUtc.Year -lt 2000) { $q += "mirror $($mr.fullName) has never synced"; continue }
            $age = ($now - $lastUtc).TotalHours
            if ($age -gt [double]$exp.maxMirrorAgeHours) { $q += ("mirror {0} last synced {1:n1} hours ago" -f $mr.fullName, $age) }
        }
        $admins = @(Get-PhProp $Gitea 'admins' @())
        if ($admins.Count -gt [int]$exp.maxLocalAdmins) { $q += "$($admins.Count) Gitea administrators (limit $($exp.maxLocalAdmins))" }
        $sum = "anonymous read refused ($($Gitea.anonymousStatus)); $(@($Gitea.webhooks).Count) webhooks to listed hosts; $(@($Gitea.mirrors).Count) mirrors under $($exp.maxMirrorAgeHours) h; $($admins.Count) administrators"
        $rows.Add((New-PhRow 'PH-10' $(if ($q.Count) { 'Finding' } else { 'Pass' }) $(if ($q.Count) { $q -join '; ' } else { $sum }) 'A.4, D.2, F.1'))
    }

    # PH-11 Backup: the newest dump is inside the recovery point (24 hours by default, WD-178).
    $bk = Get-PhProp $Windows 'backup'
    if ($null -eq $bk -or -not (Get-PhProp $bk 'newest')) { $rows.Add((New-PhRow 'PH-11' 'Finding' "no backup in $($exp.backupPath)" 'C.4')) }
    else {
        $age = ($now - (ConvertTo-PhUtc $bk.newestTime)).TotalHours
        $st = $(if ($age -gt [double]$exp.recoveryPointHours) { 'Finding' } else { 'Pass' })
        $rows.Add((New-PhRow 'PH-11' $st ("{0}, {1:n1} hours old (recovery point {2} h)" -f $bk.newest, $age, $exp.recoveryPointHours) 'C.4'))
    }

    # PH-12 Azure Arc: the Connected Machine agent is connected, when the settings require it.
    $arc = Get-PhProp $Windows 'arc'
    $need = [bool](Get-PhProp $exp 'requireArc' $true)
    if ($null -eq $arc -or -not [bool](Get-PhProp $arc 'installed' $false)) {
        $rows.Add((New-PhRow 'PH-12' $(if ($need) { 'Finding' } else { 'NotChecked' }) $(if ($need) { 'the Connected Machine agent is not installed' } else { 'the Connected Machine agent is not installed; this settings file does not require it (M-007 may finish in Phase 1)' }) 'C.1'))
    } else {
        $ok = ("$($arc.status)" -eq 'Connected')
        $rows.Add((New-PhRow 'PH-12' $(if ($ok) { 'Pass' } else { 'Finding' }) "agent $($arc.status), resource $($arc.resourceName), last heartbeat $($arc.lastHeartbeat)" 'C.1'))
    }
    $rows.ToArray()
}

function Format-PhRows {
    param([Parameter(Mandatory)][object[]]$Rows)
    foreach ($r in $Rows) { '{0}  {1,-10}  {2}' -f $r.Check, $r.Status, $r.Detail }
    $f = @($Rows | Where-Object Status -EQ 'Finding').Count
    $nc = @($Rows | Where-Object Status -EQ 'NotChecked').Count
    $p = @($Rows | Where-Object Status -EQ 'Pass').Count
    "{0} pass, {1} findings, {2} not checked" -f $p, $f, $nc
}

function Write-PhEvidence {
    <#
    .SYNOPSIS
        Records one check run as evidence: copies the snapshots and results into runs/<n>-check, writes a record with
        the time, environment, the checks with their SP 800-53 controls and FedRAMP 20x KSIs (config/requirements.json),
        every file's SHA-256 and the SHA-256 of the record before it, then refreshes SHA256SUMS. Secrets never reach
        a snapshot (ConvertFrom-PhIni keeps only '<set>').
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf, [Parameter(Mandatory)][string]$Environment, [string]$ChangeRecord = '', $Requirements = (Get-PhRequirements))
    $results = Read-PhJson -Path (Join-Path $RunPath 'results.json')
    $recDir = Join-Path $EvidencePath 'records'
    if (-not (Test-Path -LiteralPath $recDir)) { New-Item -ItemType Directory -Force -Path $recDir | Out-Null }
    $prior = @(Get-ChildItem -LiteralPath $recDir -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = $(if ($prior.Count) { Get-PhFileHash -Path $prior[-1].FullName } else { $null })
    $name = '{0:d4}-check' -f $seq
    $dest = Join-Path $EvidencePath "runs/$name"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    $files = @()
    foreach ($f in @(Get-ChildItem -LiteralPath $RunPath -File | Sort-Object Name)) {
        Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $dest $f.Name) -Force
        $files += [ordered]@{ path = "runs/$name/$($f.Name)"; sha256 = (Get-PhFileHash -Path $f.FullName) }
    }
    $checks = @()
    $controls = @(); $ksis = @()
    foreach ($row in @($results.rows)) {
        $req = Get-PhProp $Requirements.checks $row.Check
        $c = @(Get-PhProp $req 'controls' @()); $k = @(Get-PhProp $req 'ksis' @())
        $controls += $c; $ksis += $k
        $checks += [ordered]@{ id = $row.Check; title = "$(Get-PhProp $req 'title' '')"; status = $row.Status; detail = $row.Detail; controls = $c; ksis = $k }
    }
    $controls = @($controls | Sort-Object -Unique); $ksis = @($ksis | Sort-Object -Unique)
    $findings = @($results.rows | Where-Object Status -EQ 'Finding').Count
    $rec = [ordered]@{
        schema = 'fmp-ph-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = 'interface-check'; environment = $Environment
        changeRecord = $ChangeRecord; result = $(if ($findings) { 'Findings' } else { 'Pass' }); findings = $findings
        checks = $checks
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = "$(Get-PhProp (Get-PhProp $Requirements.controls $_) 'title' '')" } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $recDir "$name.json"
    Write-PhJson -Path $recPath -Value $rec
    # SHA256SUMS: every file under the evidence folder except itself, sorted, with forward slashes.
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path
    $lines = foreach ($fi in @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $fi.FullName.Substring($root.Length).TrimStart('\', '/') -replace '\\', '/'
        '{0}  {1}' -f (Get-PhFileHash -Path $fi.FullName), $rel
    }
    Write-PhText -Path (Join-Path $root 'SHA256SUMS') -Text ((@($lines | Sort-Object { $_.Substring(66) }) -join "`n") + "`n")
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $rec.result; Findings = $findings; Controls = $controls; Ksis = $ksis }
}

function Test-PhEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: SHA256SUMS lists every file unchanged, each record's files match it, and the
        chain of records is unbroken. One row per check.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path
    $rows = @()
    $sums = Join-Path $root 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) { return , (New-PhRow 'SUMS' 'Finding' 'no SHA256SUMS' 'Evidence') }
    $listed = @{}; $bad = @()
    foreach ($l in (Get-Content -LiteralPath $sums)) { if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] } }
    foreach ($fi in @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $fi.FullName.Substring($root.Length).TrimStart('\', '/') -replace '\\', '/'
        if (-not $listed.ContainsKey($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-PhFileHash -Path $fi.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in @($listed.Keys)) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    $rows += New-PhRow 'SUMS' $(if ($bad.Count) { 'Finding' } else { 'Pass' }) $(if ($bad.Count) { (@($bad | Sort-Object)) -join '; ' } else { "$($listed.Count) files match SHA256SUMS" }) 'Evidence'
    $prev = $null; $chain = @(); $n = 0
    foreach ($r in @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)) {
        $n++
        $j = Read-PhJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($fx in @($j.files)) { $fp = Join-Path $root $fx.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-PhFileHash -Path $fp) -ne $fx.sha256) { $chain += "$($fx.path) doesn't match $($r.Name)" } }
        $prev = Get-PhFileHash -Path $r.FullName
    }
    $rows += New-PhRow 'CHAIN' $(if ($chain.Count) { 'Finding' } else { 'Pass' }) $(if ($chain.Count) { $chain -join '; ' } else { "$n records, chain unbroken" }) 'Evidence'
    $rows
}

Export-ModuleMember -Function ConvertTo-PhUtc, Format-PhUtc, Read-PhJson, Write-PhJson, Write-PhText, Get-PhFileHash, ConvertFrom-PhIni, Test-PhWebhookSignature, Get-PhRequirements, Test-PhSnapshot, Format-PhRows, Write-PhEvidence, Test-PhEvidence
