# Chapter 09: the runbook for test and production. Preflight, then the scheduled monthly run.

function Test-IpPreflight {
    <#
    .SYNOPSIS
        The checks before a run in test or production: PF-01 settings and inputs; PF-02 the
        ExchangeOnlineManagement module, at a version this PowerShell can load (3.10.0 and later need 7.6);
        PF-03 the AIPService module at 3.1.0.0 or later when the Rights Management read is on; PF-04 the
        app-only certificate, when the settings use one; PF-05 the output folder is writable; PF-06 production
        only: the test stage's evidence passes its go/no-go. Writes a run folder; returns the run.
    .EXAMPLE
        Test-IpPreflight -Settings $s -OutputPath out/preflight -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf,
        [object[]]$Modules = @(Get-Module -ListAvailable ExchangeOnlineManagement, AIPService | ForEach-Object { [pscustomobject]@{ Name = $_.Name; Version = $_.Version } }),
        [version]$PowerShellVersion = $PSVersionTable.PSVersion,
        [scriptblock]$FindCertificate = { param($Thumbprint) [bool](Get-ChildItem -Path Cert:\CurrentUser\My, Cert:\LocalMachine\My -ErrorAction SilentlyContinue | Where-Object Thumbprint -EQ $Thumbprint) },
        [string]$TestEvidencePath)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $rows = [Collections.Generic.List[object]]::new()
    $miss = @(foreach ($k in 'plan', 'roleRegister', 'exceptions', 'changes') { if (-not $Settings.inputs.Contains($k) -or (Test-IpPlaceholder "$($Settings.inputs[$k])") -or -not (Test-Path -LiteralPath $Settings.inputs[$k])) { $k } })
    if ($Settings.reads.inventory -and ((Test-IpPlaceholder "$($Settings.inputs.classRegister)") -or -not (Test-Path -LiteralPath "$($Settings.inputs.classRegister)"))) { $miss += 'classRegister' }
    if (Test-IpPlaceholder "$($Settings.adminUpn)" -and -not ($Settings.Contains('app') -and -not (Test-IpPlaceholder "$($Settings.app.appId)"))) { $miss += 'adminUpn (or app)' }
    $rows.Add((New-IpCheck -Id 'PF-01' -Status $(if ($miss.Count) { 'Fail' } else { 'Pass' }) -Subject 'Settings and inputs' -Detail $(if ($miss.Count) { "missing or a placeholder: $($miss -join ', ')" } else { "$($Settings.environment), $($Settings.cloud), tenant $($Settings.tenantDomain); every input found" })))
    $exo = $Modules | Where-Object Name -EQ 'ExchangeOnlineManagement' | Sort-Object { [version]"$($_.Version)" } -Descending | Select-Object -First 1
    $d = if (-not $exo) { 'not installed: Install-Module ExchangeOnlineManagement' }
    elseif ([version]"$($exo.Version)" -lt [version]'3.0.0') { "$($exo.Version): 3.0.0 or later is needed (Get-ConnectionInformation, app-only Security & Compliance)" }
    elseif ([version]"$($exo.Version)" -ge [version]'3.10.0' -and $PowerShellVersion -lt [version]'7.6.0') { "$($exo.Version) needs PowerShell 7.6 or later; this is $PowerShellVersion" }
    else { '' }
    $rows.Add((New-IpCheck -Id 'PF-02' -Status $(if ($d) { 'Fail' } else { 'Pass' }) -Subject 'ExchangeOnlineManagement' -Detail $(if ($d) { $d } else { "$($exo.Version) on PowerShell $PowerShellVersion" })))
    if ($Settings.reads.rightsManagement) {
        $aip = $Modules | Where-Object Name -EQ 'AIPService' | Sort-Object { [version]"$($_.Version)" } -Descending | Select-Object -First 1
        $d = if (-not $aip) { 'not installed: Install-Module AIPService' } elseif ([version]"$($aip.Version)" -lt [version]'3.1.0.0') { "$($aip.Version): PowerShell 7 needs 3.1.0.0 or later" } else { '' }
        $rows.Add((New-IpCheck -Id 'PF-03' -Status $(if ($d) { 'Fail' } else { 'Pass' }) -Subject 'AIPService' -Detail $(if ($d) { $d } else { "$($aip.Version)" })))
    } else { $rows.Add((New-IpCheck -Id 'PF-03' -Status Info -Subject 'AIPService' -Detail 'not needed: reads.rightsManagement is off')) }
    if ($Settings.Contains('app') -and -not (Test-IpPlaceholder "$($Settings.app.appId)")) {
        $ok = & $FindCertificate "$($Settings.app.certificateThumbprint)"
        $orgOk = "$($Settings.app.organization)" -like '*.onmicrosoft.com'
        $rows.Add((New-IpCheck -Id 'PF-04' -Status $(if ($ok -and $orgOk) { 'Pass' } else { 'Fail' }) -Subject 'App-only certificate' -Detail $(if (-not $ok) { 'the certificate isn''t in the CurrentUser or LocalMachine store' } elseif (-not $orgOk) { 'app.organization must be the primary .onmicrosoft.com domain' } else { 'certificate found; organization set' })))
    } else { $rows.Add((New-IpCheck -Id 'PF-04' -Status Info -Subject 'App-only certificate' -Detail 'not used: delegated sign-in')) }
    $root = if ($Settings.Contains('outputRoot') -and -not (Test-IpPlaceholder "$($Settings.outputRoot)")) { "$($Settings.outputRoot)" } else { $out }
    $probe = Join-Path $root "write-test-$([guid]::NewGuid().ToString('N')).tmp"
    $w = try { New-Item -ItemType Directory -Force -Path $root | Out-Null; Write-IpText -Path $probe -Text 'x'; Remove-Item -LiteralPath $probe -Force; $true } catch { $false }
    $rows.Add((New-IpCheck -Id 'PF-05' -Status $(if ($w) { 'Pass' } else { 'Fail' }) -Subject 'Output folder' -Detail $(if ($w) { 'writable' } else { "can't write to the output root" })))
    if ($Settings.environment -eq 'production') {
        $g = @(if ($TestEvidencePath -and (Test-Path -LiteralPath $TestEvidencePath)) { Test-IpEvidence -EvidencePath $TestEvidencePath -Stage test })
        $bad = @($g | Where-Object Status -EQ 'Fail')
        $rows.Add((New-IpCheck -Id 'PF-06' -Status $(if ($g.Count -and -not $bad.Count) { 'Pass' } else { 'Fail' }) -Subject 'Test stage go/no-go' -Detail $(if (-not $g.Count) { 'no test-stage evidence given (-TestEvidencePath)' } elseif ($bad.Count) { "not ready: $(@($bad | ForEach-Object Check) -join ', ')" } else { 'every test-stage step has a passing record' })))
    }
    Complete-IpRun -Task preflight -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -Mode 'Preflight'
}

function Invoke-IpScheduledRun {
    <#
    .SYNOPSIS
        The scheduled monthly run in test or production: preflight (stops on a failure), the baseline export
        with the given runner, every check against it with drift against the last approved export
        (settings.baselinePath), the metrics, and every run folder recorded as evidence with the change record.
    .EXAMPLE
        Invoke-IpScheduledRun -Settings $s -Runner (New-IpLiveRunner -Settings $s) -RunRoot out/2026-11 -EvidencePath out/evidence -ChangeRecord CHG-2001
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Runner, [Parameter(Mandatory)][string]$RunRoot,
        [Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$ChangeRecord, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
        [hashtable]$PreflightOverrides = @{})
    if ($Settings.environment -notin 'test', 'production') { throw "A scheduled run is for test or production, not '$($Settings.environment)'." }
    New-Item -ItemType Directory -Force -Path $RunRoot | Out-Null
    $pf = Test-IpPreflight -Settings $Settings -OutputPath (Join-Path $RunRoot 'preflight') -AsOf $AsOf @PreflightOverrides
    $null = Write-IpEvidence -EvidencePath $EvidencePath -RunPath $pf.OutputPath -AsOf $AsOf -ChangeRecord $ChangeRecord -Command 'scheduled run: preflight'
    if ($pf.Result -ne 'Pass') { return [pscustomobject]@{ Task = 'scheduled-run'; Result = 'Stopped'; Detail = 'preflight failed: ' + (@($pf.Rows | Where-Object Status -EQ 'Fail' | ForEach-Object Id) -join ', ') } }
    $snap = Join-Path $RunRoot 'snapshot'
    $ex = Export-IpBaseline -Settings $Settings -Runner $Runner -OutputPath $snap -AsOf $AsOf
    $null = Write-IpEvidence -EvidencePath $EvidencePath -RunPath $ex.OutputPath -AsOf $AsOf -ChangeRecord $ChangeRecord -Command 'scheduled run: export'
    $p = @{ Settings = $Settings; SnapshotPath = $snap; RunRoot = (Join-Path $RunRoot 'checks'); AsOf = $AsOf; EvidencePath = $EvidencePath; ChangeRecord = $ChangeRecord }
    if ($Settings.Contains('baselinePath') -and -not (Test-IpPlaceholder "$($Settings.baselinePath)")) { $p.BaselinePath = "$($Settings.baselinePath)" }
    $rows = @(Invoke-IpRunAll @p)
    $sum = Join-Path $RunRoot 'scheduled-run'
    $null = New-IpRunFolder -OutputPath $sum
    Write-IpCsv -Path (Join-Path $sum 'checks.csv') -Rows $rows -Columns Task, Result, Fails, Record, Detail
    $res = if (@($rows | Where-Object Result -EQ 'Error').Count) { 'Fail' } else { 'Pass' }
    $null = Write-IpManifest -OutputPath $sum -Task 'scheduled-run' -AsOf $AsOf -Settings $Settings -Result $res -Mode $Runner.Mode -SnapshotPath $snap -Extra @{ changeRecord = $ChangeRecord }
    $null = Write-IpEvidence -EvidencePath $EvidencePath -RunPath $sum -AsOf $AsOf -ChangeRecord $ChangeRecord -Command 'scheduled run: summary'
    [pscustomobject]@{ Task = 'scheduled-run'; Result = $res; Detail = "$($rows.Count) check(s); $(@($rows | Where-Object Fails -GT 0).Count) with findings"; Checks = $rows }
}
