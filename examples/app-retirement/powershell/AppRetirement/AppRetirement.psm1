#Requires -Version 7.1
# Retiring an application (Book 18, Appendix B): checks a retired or replaced application's footprint against the
# six shutdown gates and writes the decommission plan, with the commands each owning team runs. Read only.
Set-StrictMode -Version Latest

$script:Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path

function Get-ArtSha256 {
    <#
    .SYNOPSIS
        The SHA-256 of a file, hashed with LF line endings so a hash recorded on one platform matches on another.
    .EXAMPLE
        Get-ArtSha256 out/retire/plan.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = (Get-Content -LiteralPath $Path -Raw) -replace "`r`n", "`n"
    -join ([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($text)) | ForEach-Object { $_.ToString('x2') })
}

# A relative path is resolved against PowerShell's current location, not the process's, so a plan written after Set-Location lands where New-Item made its folder.
function Write-ArtFile([string]$Path, [string]$Text) {
    $full = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
    [IO.File]::WriteAllText($full, ($Text -replace "`r`n", "`n"))
}

function Get-ArtFootprint {
    <#
    .SYNOPSIS
        Reads an application's retirement footprint (the decision, the records disposition, the schedule and everything it left behind), and with -ReadEntra refreshes its Entra ID sign-in state and last sign-in.
    .DESCRIPTION
        The footprint is a JSON file assembled from the CMDB, DNS, the certificate inventory, Active Directory,
        Entra ID, the firewall, the SIEM and license exports (tests/fixtures/footprint.json shows the shape).
        With -ReadEntra, for each entra app it reads the service principal's accountEnabled (Application.Read.All)
        and the last sign-in from servicePrincipalSignInActivities (beta, AuditLog.Read.All) after Connect-MgGraph.
    .EXAMPLE
        Get-ArtFootprint -Path tests/fixtures/footprint.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [switch]$ReadEntra)
    $f = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    if ($ReadEntra) {
        foreach ($a in $f.entraApps) {
            $sp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/servicePrincipals(appId='$($a.appId)')?`$select=id,accountEnabled" -OutputType Hashtable
            $a.accountEnabled = [bool]$sp.accountEnabled
            $q = [uri]::EscapeDataString("appId eq '$($a.appId)'")
            $act = @((Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/reports/servicePrincipalSignInActivities?`$filter=$q" -OutputType Hashtable).value)
            if ($act -and $act[0].lastSignInActivity) { $a.lastSignIn = $act[0].lastSignInActivity.lastSignInDateTime }
        }
    }
    $f
}

function Get-ArtDate($Value) {
    if (-not $Value) { return $null }
    [datetime]::Parse([string]$Value, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
}

function Test-ArtRetirement {
    <#
    .SYNOPSIS
        Checks an application's footprint against the six shutdown gates and returns the gates and the findings. Changes nothing.
    .DESCRIPTION
        Gates (Book 18, Appendix B): R1 Decide, R2 Quiet, R3 Records, R4 Switch off, R5 Remove, R6 Close.
          ART-01  the decision is incomplete: disposition, owner, decision record, or the replacement for a replace
          ART-02  the records officer hasn't confirmed the records disposition
          ART-03  a dependent system called the application after the quiet date
          ART-04  the application was signed in to after the quiet date
          ART-05  after the switch-off date, sign-in is still enabled
          ART-06  (a warning) an item removed before the reversible window ended
          ART-07  past the removal date, an item not yet removed (DNS, certificate, account, rule, monitoring, license)
    .EXAMPLE
        Test-ArtRetirement -Footprint (Get-ArtFootprint tests/fixtures/footprint.json) -AsOf 2026-12-10
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Footprint, [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $f = [Collections.Generic.List[object]]::new()
    $add = { param($rule, $sev, $gate, $obj, $issue) $f.Add([pscustomobject]@{ Rule = $rule; Severity = $sev; Gate = $gate; Object = $obj; Issue = $issue }) }
    $app = $Footprint.application; $s = $Footprint.schedule
    $quiet = Get-ArtDate $s.quietFrom; $off = Get-ArtDate $s.switchOff
    $removeBy = if ($off) { $off.AddDays([int]$s.removeAfterDays) } else { $null }

    $missing = @('disposition', 'owner', 'decisionRecord' | Where-Object { -not $app[$_] })
    if ($app.disposition -eq 'Replace' -and -not $app.replacement) { $missing += 'replacement' }
    if ($missing) { & $add 'ART-01' 'Finding' 'R1' $app.name "The decision is missing: $($missing -join ', ')" }
    if (-not $Footprint.records.officerSignoff -or -not $Footprint.records.confirmedDate) { & $add 'ART-02' 'Finding' 'R3' $app.name "The records officer hasn't confirmed the disposition (signed off and confirmed)" }
    foreach ($d in @($Footprint.dependents)) { if ($quiet -and (Get-ArtDate $d.lastSeen) -ge $quiet) { & $add 'ART-03' 'Finding' 'R2' $d.system "Called the application on $($d.lastSeen), after the quiet date $($s.quietFrom)" } }
    foreach ($a in @($Footprint.entraApps)) {
        if ($quiet -and $a.lastSignIn -and (Get-ArtDate $a.lastSignIn) -ge $quiet) { & $add 'ART-04' 'Finding' 'R2' $a.displayName "Signed in to on $($a.lastSignIn), after the quiet date" }
        if ($off -and $AsOf -ge $off -and $a.accountEnabled) { & $add 'ART-05' 'Finding' 'R4' $a.displayName 'Sign-in is still enabled after the switch-off date' }
    }
    $items = @(
        @($Footprint.dns | ForEach-Object { @{ kind = 'DNS record'; name = "$($_.name).$($_.zone) $($_.type)"; done = $_.removedOn } })
        @($Footprint.certificates | ForEach-Object { @{ kind = 'Certificate'; name = $_.subject; done = $_.revokedOn } })
        @($Footprint.accounts | ForEach-Object { @{ kind = "Account ($($_.kind))"; name = $_.sam; done = $_.deletedOn; disabled = $_.disabledOn } })
        @($Footprint.firewallRules | ForEach-Object { @{ kind = 'Firewall rule'; name = "$($_.id) $($_.description)"; done = $_.removedOn } })
        @($Footprint.monitoring | ForEach-Object { @{ kind = 'Monitoring source'; name = $_.source; done = $_.removedOn } })
        @($Footprint.licenses | ForEach-Object { @{ kind = 'License'; name = "$($_.sku) x$($_.count)"; done = $_.releasedOn } })
    )
    foreach ($i in $items) {
        if ($i.done -and $removeBy -and (Get-ArtDate $i.done) -lt $removeBy) { & $add 'ART-06' 'Warn' 'R5' "$($i.kind): $($i.name)" "Removed on $($i.done), before the reversible window ended on $($removeBy.ToString('yyyy-MM-dd'))" }
        if (-not $i.done -and $removeBy -and $AsOf -ge $removeBy) { & $add 'ART-07' 'Finding' 'R5' "$($i.kind): $($i.name)" "Not yet removed; the removal date was $($removeBy.ToString('yyyy-MM-dd'))" }
    }
    $blocked = { param($g) [bool]@($f | Where-Object { $_.Gate -eq $g -and $_.Severity -eq 'Finding' }) }
    $gates = [ordered]@{
        R1 = $(if (& $blocked 'R1') { 'blocked' } else { 'met' })
        R2 = $(if (& $blocked 'R2') { 'blocked' } elseif ($quiet -and $AsOf -ge $quiet) { 'met' } else { 'pending' })
        R3 = $(if (& $blocked 'R3') { 'blocked' } else { 'met' })
        R4 = $(if (& $blocked 'R4') { 'blocked' } elseif ($off -and $AsOf -ge $off) { 'met' } else { 'pending' })
        R5 = $(if (& $blocked 'R5') { 'blocked' } elseif ($removeBy -and $AsOf -ge $removeBy) { 'met' } else { 'pending' })
        R6 = 'pending'
    }
    if (-not @(@($gates.R1, $gates.R2, $gates.R3, $gates.R4, $gates.R5) | Where-Object { $_ -ne 'met' })) { $gates.R6 = 'ready' }
    [pscustomobject]@{ Gates = $gates; Findings = $f.ToArray(); RemoveBy = $removeBy }
}

function Get-ArtCommand([hashtable]$Footprint) {
    # The removal commands, for the owning teams to run in their own change; the kit runs none of them.
    # Syntax from Microsoft Learn: Update-MgServicePrincipal -AccountEnabled, Remove-MgApplication,
    # Remove-DnsServerResourceRecord, Disable-ADAccount.
    $c = [Collections.Generic.List[string]]::new()
    foreach ($a in @($Footprint.entraApps)) {
        $c.Add("# R4 switch off: $($a.displayName) (reversible: set it back to `$true)")
        $c.Add("`$sp = Get-MgServicePrincipal -Filter `"appId eq '$($a.appId)'`"")
        $c.Add('Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$false')
        $c.Add("# R5 remove, after the reversible window: restorable for 30 days from the deleted items")
        $c.Add("Remove-MgApplication -ApplicationId (Get-MgApplication -Filter `"appId eq '$($a.appId)'`").Id")
    }
    foreach ($d in @($Footprint.dns)) { $c.Add("Remove-DnsServerResourceRecord -ComputerName $($d.dnsServer) -ZoneName `"$($d.zone)`" -RRType `"$($d.type)`" -Name `"$($d.name)`" -RecordData `"$($d.data)`"") }
    foreach ($a in @($Footprint.accounts)) { if (-not $a.disabledOn) { $c.Add("Disable-ADAccount -Identity '$($a.sam)'") } }
    $c.ToArray()
}

function New-ArtDecommissionPlan {
    <#
    .SYNOPSIS
        Writes the decommission plan for a retired or replaced application: the six gates with their state, the findings, every item left to remove with its owner team, and the commands, with a manifest of SHA-256 hashes.
    .DESCRIPTION
        Read only. Run it at each gate; plan.md is what the change board and the owning teams work from, and the
        manifest's hash goes with the authorization closure (Book 14, Appendix I). Exits through
        Invoke-ArtPlan.ps1 with 2 when there is a finding.
    .EXAMPLE
        New-ArtDecommissionPlan -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire -AsOf 2026-12-10
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$FootprintPath, [Parameter(Mandatory)][string]$OutputPath, [switch]$ReadEntra, [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fp = Get-ArtFootprint -Path $FootprintPath -ReadEntra:$ReadEntra
    $t = Test-ArtRetirement -Footprint $fp -AsOf $AsOf
    New-Item -ItemType Directory -Force $OutputPath | Out-Null
    $findings = @($t.Findings)
    $names = @{ R1 = 'Decide'; R2 = 'Quiet'; R3 = 'Records'; R4 = 'Switch off'; R5 = 'Remove'; R6 = 'Close' }
    $md = [Collections.Generic.List[string]]::new()
    $md.Add("# Decommission plan: $($fp.application.name), $($AsOf.ToString('yyyy-MM-dd'))"); $md.Add('')
    $md.Add("Disposition: $($fp.application.disposition)$(if ($fp.application.replacement) { " by $($fp.application.replacement)" }). Decision $($fp.application.decisionRecord). Quiet from $($fp.schedule.quietFrom); switch off $($fp.schedule.switchOff); remove from $(if ($t.RemoveBy) { $t.RemoveBy.ToString('yyyy-MM-dd') })."); $md.Add('')
    $md.Add('| Gate | State |'); $md.Add('|---|---|')
    foreach ($g in $t.Gates.Keys) { $md.Add("| $g $($names[$g]) | $($t.Gates[$g]) |") }
    $md.Add(''); $md.Add('## Findings'); $md.Add('')
    if ($findings) { foreach ($x in $findings) { $md.Add("- $($x.Rule) ($($x.Severity), $($x.Gate)) $($x.Object): $($x.Issue)") } } else { $md.Add('- None.') }
    $md.Add(''); $md.Add('## Commands for the owning teams'); $md.Add(''); $md.Add('Run each in its own change, at its gate. Certificates, firewall rules, monitoring sources, licenses and the CMDB item are removed by their owning teams in their own tools.'); $md.Add('')
    $md.Add('```powershell'); foreach ($c in (Get-ArtCommand $fp)) { $md.Add($c) }; $md.Add('```')
    $md.Add(''); $md.Add('R6 Close: the authorization closure (Book 14, Appendix I), the CMDB item retired, and this plan''s manifest filed with it.')
    Write-ArtFile (Join-Path $OutputPath 'plan.md') (($md -join "`n") + "`n")
    Write-ArtFile (Join-Path $OutputPath 'findings.json') ((ConvertTo-Json -InputObject $findings -Depth 5) + "`n")
    Write-ArtFile (Join-Path $OutputPath 'plan.json') ((ConvertTo-Json -InputObject ([ordered]@{ application = $fp.application.name; cmdbId = $fp.application.cmdbId; gates = $t.Gates; removeBy = $(if ($t.RemoveBy) { $t.RemoveBy.ToString('yyyy-MM-dd') }) }) -Depth 5) + "`n")
    $req = (Get-Content (Join-Path $script:Root 'config/requirements.json') -Raw | ConvertFrom-Json).steps.'retirement-plan'
    $files = foreach ($n in 'findings.json', 'plan.json', 'plan.md') { [ordered]@{ path = $n; sha256 = Get-ArtSha256 (Join-Path $OutputPath $n) } }
    # A date given with no time zone (-AsOf 2026-12-10) is read as UTC, so the manifest is the same on every machine.
    $asOfUtc = if ($AsOf.Kind -eq [DateTimeKind]::Unspecified) { [datetime]::SpecifyKind($AsOf, [DateTimeKind]::Utc) } else { $AsOf.ToUniversalTime() }
    $manifest = [ordered]@{ step = 'retirement-plan'; mode = 'read'; asOfUtc = $asOfUtc.ToString('yyyy-MM-ddTHH:mm:ssZ'); footprint = [ordered]@{ path = (Split-Path -Leaf $FootprintPath); sha256 = Get-ArtSha256 $FootprintPath }; controls = $req.controls; ksis = $req.ksis; files = @($files) }
    Write-ArtFile (Join-Path $OutputPath 'manifest.json') ((ConvertTo-Json -InputObject $manifest -Depth 5) + "`n")
    [pscustomobject]@{ Application = $fp.application.name; Gates = ($t.Gates.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ' '; Findings = @($findings | Where-Object Severity -eq 'Finding').Count; Warnings = @($findings | Where-Object Severity -eq 'Warn').Count; OutputPath = $OutputPath }
}

Export-ModuleMember -Function Get-ArtSha256, Get-ArtFootprint, Test-ArtRetirement, New-ArtDecommissionPlan
