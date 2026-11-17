#Requires -Version 7.1
<#
    XdrDeploy: taking the Defender XDR kit from the labs to a test tenant, then production, with one settings
    file per environment. A read-only pre-flight; the scheduled run (every check, the metrics, the evidence);
    publishing custom detections from the repository's plan through Microsoft Graph, applied only with -Apply
    and the plan's approved SHA-256; and a rollback plan that disables what a stage published and steps each
    ASR ring back one stage. Each step writes a run folder with a manifest that Invoke-XdrEvidence.ps1 records.
    Fixture mode sends nothing anywhere. Nothing here has been run against a live tenant.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/DefenderXdr/DefenderXdr.psm1') -Force -Global

$script:FixtureModules = $null
$script:CreatesPerMinute = 10   # Learn, "Use the Microsoft Graph security API", Custom detections quotas

function New-XdrDeployResult {
    param([string]$Id, [string]$Status, [string]$Detail)
    [pscustomobject][ordered]@{ Id = $Id; Status = $Status; Detail = $Detail }
}

function Use-XdrDeployFixture {
    <#
    .SYNOPSIS
        Fixture mode for the deploy scripts: the installed modules and the Graph session (environment, tenant,
        granted scopes) come from a file, the reads from a fixture folder, and the writes are recorded, never
        sent. Returns the invoker.
    .EXAMPLE
        $inv = Use-XdrDeployFixture -Path deploy/tests/fixtures/environment-test.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $f = Read-XdrJson -Path $Path
    $script:FixtureModules = $f.modules
    $ctx = $f.graphContext
    $null = Set-XdrRunner -GraphContext { $ctx }.GetNewClosure()
    $root = if ([IO.Path]::IsPathRooted($f.readsFrom)) { $f.readsFrom } else { Join-Path (Split-Path -Parent (Resolve-Path $Path).Path) $f.readsFrom }
    New-XdrFixtureInvoker -Path $root
}

function Test-XdrModulePresent {
    param([Parameter(Mandatory)][string]$Name)
    if ($null -ne $script:FixtureModules) { return [bool]$script:FixtureModules[$Name] }
    [bool](Get-Module -ListAvailable -Name $Name)
}

function Invoke-XdrPreflight {
    <#
    .SYNOPSIS
        The pre-flight before a stage. Reads only. PF-01 the settings (the environment is the stage, every
        input the run reads is named and exists, detections.deployVia is set); PF-02 the Graph modules; PF-03
        the Graph session is in the cloud and tenant the settings name; PF-04 the session's granted scopes
        cover every read the run makes, and CustomDetection.ReadWrite.All when detections deploy through Graph;
        PF-05 a first read of incidents; PF-06 the output root is writable; PF-07 in production, the test
        stage's evidence passes its go/no-go. Returns the results.
    .EXAMPLE
        Invoke-XdrPreflight -Settings $s -Stage test -Invoker $inv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
        [Parameter(Mandatory)]$Invoker, [string]$TestEvidencePath)
    $r = [Collections.Generic.List[object]]::new()
    $why = @()
    if ($Settings.environment -ne $Stage) { $why += "environment is '$($Settings.environment)', not '$Stage'" }
    foreach ($k in 'inventory', 'exceptions', 'roleExport', 'deviceStates', 'prevention', 'asrPlan', 'asrExclusions', 'owners', 'rules', 'deviceGroups', 'automationExclusions') {
        $v = if ($Settings.inputs.Contains($k)) { "$($Settings.inputs[$k])" } else { '' }
        if (-not $v -or $v -match '^<.*>$') { $why += "inputs.$k is not named" } elseif (-not (Test-Path -LiteralPath $v)) { $why += "inputs.$k ($v) doesn't exist" }
    }
    $via = if ($Settings.Contains('detections') -and $Settings.detections.Contains('deployVia')) { "$($Settings.detections.deployVia)" } else { '' }
    if ($via -notin 'graph', 'portal') { $why += 'detections.deployVia is not graph or portal' }
    $r.Add((New-XdrDeployResult 'PF-01' $(if ($why.Count) { 'Fail' } else { 'Pass' }) $(if ($why.Count) { $why -join '; ' } else { "settings for $Stage read; cloud $($Settings.cloud); detections deploy via $via" })))
    $mods = @('Microsoft.Graph.Authentication')
    $missing = @($mods | Where-Object { -not (Test-XdrModulePresent -Name $_) })
    $r.Add((New-XdrDeployResult 'PF-02' $(if ($missing.Count) { 'Fail' } else { 'Pass' }) $(if ($missing.Count) { "not installed: $($missing -join ', ')" } else { "$($mods -join ', ') installed" })))
    $ctxOk = $true
    try { Assert-XdrGraphContext -Settings $Settings; $r.Add((New-XdrDeployResult 'PF-03' 'Pass' "Graph session in $((Get-XdrCloud -Cloud $Settings.cloud).GraphEnvironment), tenant $($Settings.tenantId)")) }
    catch { $ctxOk = $false; $r.Add((New-XdrDeployResult 'PF-03' 'Fail' $_.Exception.Message)) }
    $need = @(Get-XdrCall | Where-Object { -not $_.writes } | ForEach-Object permission | Sort-Object -Unique)
    if ($via -eq 'graph') { $need += 'CustomDetection.ReadWrite.All' }
    $granted = if ($ctxOk) { @((& { $c = Get-XdrGraphContext; if ($c) { $c.Scopes } })) } else { @() }
    $lack = @($need | Where-Object { $_ -notin $granted -and -not ($_ -like '*.Read.All' -and ($_ -replace '\.Read\.All$', '.ReadWrite.All') -in $granted) })
    $r.Add((New-XdrDeployResult 'PF-04' $(if ($ctxOk -and -not $lack.Count) { 'Pass' } else { 'Fail' }) $(if (-not $ctxOk) { 'no Graph session to read scopes from' } elseif ($lack.Count) { "not granted: $($lack -join ', ')" } else { "granted: $($need -join ', ')" })))
    try { $x = Invoke-XdrCall -Invoker $Invoker -CallId incidents-list -Arguments @{ top = 1 }; $r.Add((New-XdrDeployResult 'PF-05' 'Pass' 'incidents-list answered with the reader''s permissions')) }
    catch { $r.Add((New-XdrDeployResult 'PF-05' 'Fail' $_.Exception.Message)) }
    $root = if ($Settings.Contains('outputRoot')) { "$($Settings.outputRoot)" } else { '' }
    if (-not $root -or $root -match '^<.*>$') { $r.Add((New-XdrDeployResult 'PF-06' 'Fail' 'no outputRoot')) }
    else {
        try { New-Item -ItemType Directory -Force -Path $root | Out-Null; $probe = Join-Path $root 'xdr-write-probe.tmp'; Set-Content -LiteralPath $probe -Value x; Remove-Item -LiteralPath $probe -Force; $r.Add((New-XdrDeployResult 'PF-06' 'Pass' 'output root writable')) }
        catch { $r.Add((New-XdrDeployResult 'PF-06' 'Fail' $_.Exception.Message)) }
    }
    if ($Stage -eq 'production') {
        if (-not $TestEvidencePath) { $r.Add((New-XdrDeployResult 'PF-07' 'Fail' 'production needs -TestEvidencePath: the test stage''s evidence folder')) }
        else {
            $bad = @(Test-XdrEvidence -EvidencePath $TestEvidencePath -Stage test | Where-Object Status -NE 'Pass')
            $r.Add((New-XdrDeployResult 'PF-07' $(if ($bad.Count) { 'Fail' } else { 'Pass' }) $(if ($bad.Count) { "the test stage's go/no-go fails: $(($bad | ForEach-Object Check) -join ', ')" } else { 'the test stage''s evidence passes' })))
        }
    }
    $r.ToArray()
}

function Get-XdrGraphContext {
    <#
    .SYNOPSIS
        The Graph session as the kit sees it: Get-MgContext live, the environment file in fixture mode.
    .EXAMPLE
        Get-XdrGraphContext
    #>
    # The Graph session as the runner reports it (Get-MgContext live; the fixture file in fixture mode).
    $old = Set-XdrRunner
    & $old.GraphContext
}

function Invoke-XdrPublish {
    <#
    .SYNOPSIS
        Publishes the custom detections a plan (Invoke-XdrDetections.ps1's plan.json) lists, through Microsoft
        Graph: POST for a create, PATCH with only the changed properties for an update. Refuses a plan for
        another tenant, a plan whose SHA-256 isn't the approved one, and a plan made for the portal path.
        Without -Apply it writes what it would send. Live, it pauses after every 10 creates (Learn's quota of
        10 creates a minute per application). Writes results.json and the manifest.
    .EXAMPLE
        Invoke-XdrPublish -Settings $s -Invoker $inv -PlanPath out/detections/plan.json -OutputPath out/publish -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [switch]$Apply, [string]$ApprovedSha256, [string]$ChangeRecord = '')
    $plan = Read-XdrJson -Path $PlanPath
    $sha = Get-XdrFileHash -Path $PlanPath
    if ("$($plan.tenantId)" -ne "$($Settings.tenantId)") { throw "The plan is for tenant $($plan.tenantId), not $($Settings.tenantId)." }
    if ("$($plan.deployVia)" -eq 'portal') { throw "The plan was made for the portal path (detections.deployVia 'portal'): make the changes in its portal-sheet.md." }
    if ($Apply -and $ApprovedSha256 -ne $sha) { throw "The plan's SHA-256 is $sha; -ApprovedSha256 is '$ApprovedSha256'. Review the plan and approve its hash." }
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $res = [Collections.Generic.List[object]]::new(); $creates = 0
    foreach ($a in @($plan.actions)) {
        if (-not $Apply) { $res.Add([ordered]@{ ruleId = $a.ruleId; action = $a.action; method = $a.method; path = $a.path; changed = @($a.changed); status = 'planned (dry run)' }); continue }
        if ($a.action -eq 'create' -and $Invoker.Mode -eq 'Live' -and $creates -gt 0 -and $creates % $script:CreatesPerMinute -eq 0) { Start-Sleep -Seconds 61 }
        try {
            $args2 = if ($a.action -eq 'update') { @{ id = $a.ruleId } } else { @{} }
            $null = Invoke-XdrWrite -Invoker $Invoker -CallId $a.callId -Arguments $args2 -Body $a.body
            if ($a.action -eq 'create') { $creates++ }
            $res.Add([ordered]@{ ruleId = $a.ruleId; action = $a.action; method = $a.method; path = $a.path; changed = @($a.changed); status = $(if ($Invoker.Mode -eq 'Fixture') { 'recorded (fixture mode: nothing sent)' } else { 'sent' }); statusAfter = "$(Get-XdrV $a.body 'status')" })
        }
        catch { $res.Add([ordered]@{ ruleId = $a.ruleId; action = $a.action; method = $a.method; path = $a.path; changed = @($a.changed); status = "failed: $($_.Exception.Message)" }) }
    }
    Write-XdrJson -Path (Join-Path $out 'results.json') -Value @{ planSha256 = $sha; applied = [bool]$Apply; changeRecord = $ChangeRecord; results = $res.ToArray(); held = @($plan.held); orphans = @($plan.orphans) }
    Copy-Item -LiteralPath $PlanPath -Destination (Join-Path $out 'plan.json')
    $failed = @($res | Where-Object { "$($_.status)" -like 'failed*' }).Count
    $null = Write-XdrManifest -OutputPath $out -Task publish -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($failed -or -not $Apply) { 'Fail' } else { 'Pass' }); applied = [bool]$Apply; planSha256 = $sha }
    [pscustomobject]@{ Results = $res.ToArray(); PlanSha256 = $sha; Applied = [bool]$Apply; OutputPath = $out }
}

function New-XdrRollbackPlan {
    <#
    .SYNOPSIS
        The rollback plan for a stage: disable every custom detection the stage's publish runs created or
        enabled (PATCH status disabled: the guide's rollback for G7), and, from the ASR run made before the
        stage's change, each ring's OMA-URI value as it was, which steps every rule the change moved back one
        stage (the guide's rollback for G4). Writes plan.json, plan.sha256 and oma-uri/<ring>-back.txt.
        Nothing is changed.
    .EXAMPLE
        New-XdrRollbackPlan -Settings $s -PublishPath out/publish -AsrRunPath out/asr -OutputPath out/rollback-plan -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [string[]]$PublishPath = @(), [string]$AsrRunPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $actions = [Collections.Generic.List[object]]::new()
    foreach ($p in $PublishPath) {
        $j = Read-XdrJson -Path (Join-Path $p 'results.json')
        foreach ($x in @($j.results)) {
            if ("$($x.status)" -notmatch '^(sent|recorded)') { continue }
            if ($x.action -eq 'create' -or "$($x.statusAfter)" -eq 'enabled') {
                if (@($actions | Where-Object { $_.ruleId -eq $x.ruleId }).Count) { continue }
                $actions.Add([ordered]@{ ruleId = $x.ruleId; action = 'disable'; method = 'PATCH'; callId = 'detection-rule-update'; path = "/security/rules/detectionRules/$($x.ruleId)"; body = [ordered]@{ status = 'disabled' } })
            }
        }
    }
    $rings = @()
    if ($AsrRunPath) {
        # The ASR run made before the change holds each ring's value as it was (oma-uri/<ring>.txt): putting it
        # back steps every rule the change moved back one stage, and leaves the others as they were.
        foreach ($f in (Get-ChildItem -LiteralPath (Join-Path $AsrRunPath 'oma-uri') -Filter '*.txt' | Where-Object { $_.BaseName -notlike '*-next' } | Sort-Object Name)) {
            Write-XdrText -Path (Join-Path $out "oma-uri/$($f.BaseName)-back.txt") -Text ([IO.File]::ReadAllText($f.FullName))
            $rings += $f.BaseName
        }
    }
    $plan = [ordered]@{ schema = 'fmp-xdr-rollback-plan/1'; asOf = (ConvertTo-XdrUtc $AsOf); environment = $Settings.environment; tenantId = $Settings.tenantId; actions = $actions.ToArray(); asrRings = $rings
        note = 'The ASR values are for a person to put in the same Intune policy under the change record; Microsoft prefers an exclusion to a step back.' }
    Write-XdrJson -Path (Join-Path $out 'plan.json') -Value $plan
    $sha = Get-XdrFileHash -Path (Join-Path $out 'plan.json')
    Write-XdrText -Path (Join-Path $out 'plan.sha256') -Text "$sha  plan.json`n"
    [pscustomobject]@{ Plan = $plan; PlanSha256 = $sha; OutputPath = $out }
}

function Invoke-XdrRollback {
    <#
    .SYNOPSIS
        Applies a rollback plan's detection actions (PATCH status disabled) only with -Apply and the plan's
        approved SHA-256; without -Apply, writes what it would send. The ASR step-back values stay for a
        person to apply in Intune. Writes results.json and the manifest.
    .EXAMPLE
        Invoke-XdrRollback -Settings $s -Invoker $inv -PlanPath out/rollback-plan/plan.json -OutputPath out/rollback -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [switch]$Apply, [string]$ApprovedSha256, [string]$ChangeRecord = '')
    $plan = Read-XdrJson -Path $PlanPath
    $sha = Get-XdrFileHash -Path $PlanPath
    if ("$($plan.tenantId)" -ne "$($Settings.tenantId)") { throw "The plan is for tenant $($plan.tenantId), not $($Settings.tenantId)." }
    if ($Apply -and $ApprovedSha256 -ne $sha) { throw "The plan's SHA-256 is $sha; -ApprovedSha256 is '$ApprovedSha256'. Review the plan and approve its hash." }
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $res = foreach ($a in @($plan.actions)) {
        if (-not $Apply) { [ordered]@{ ruleId = $a.ruleId; action = $a.action; status = 'planned (dry run)' }; continue }
        try { $null = Invoke-XdrWrite -Invoker $Invoker -CallId $a.callId -Arguments @{ id = $a.ruleId } -Body $a.body; [ordered]@{ ruleId = $a.ruleId; action = $a.action; status = $(if ($Invoker.Mode -eq 'Fixture') { 'recorded (fixture mode: nothing sent)' } else { 'sent' }) } }
        catch { [ordered]@{ ruleId = $a.ruleId; action = $a.action; status = "failed: $($_.Exception.Message)" } }
    }
    $res = @($res)
    Write-XdrJson -Path (Join-Path $out 'results.json') -Value @{ planSha256 = $sha; applied = [bool]$Apply; changeRecord = $ChangeRecord; results = $res; asrRings = @($plan.asrRings) }
    Copy-Item -LiteralPath $PlanPath -Destination (Join-Path $out 'plan.json')
    $planDir = Split-Path -Parent (Resolve-Path -LiteralPath $PlanPath).Path
    if (Test-Path -LiteralPath (Join-Path $planDir 'oma-uri')) { Copy-Item -LiteralPath (Join-Path $planDir 'oma-uri') -Destination (Join-Path $out 'oma-uri') -Recurse }
    $failed = @($res | Where-Object { "$($_.status)" -like 'failed*' }).Count
    $null = Write-XdrManifest -OutputPath $out -Task rollback -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($failed -or -not $Apply) { 'Fail' } else { 'Pass' }); applied = [bool]$Apply; planSha256 = $sha }
    [pscustomobject]@{ Results = $res; PlanSha256 = $sha; Applied = [bool]$Apply; OutputPath = $out }
}

function Invoke-XdrScheduledRun {
    <#
    .SYNOPSIS
        The scheduled run of a stage: the monthly run (every check and the metrics) under
        <outputRoot>/<run-name>, each run folder recorded in <outputRoot>/evidence with the change record, and a
        run record of its own (task scheduled-run) listing what ran. Reads only.
    .EXAMPLE
        Invoke-XdrScheduledRun -Settings $s -Invoker $inv -RunName 2026-11 -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$RunName, [Parameter(Mandatory)][string]$AsOf)
    $root = "$($Settings.outputRoot)"
    $runRoot = Join-Path $root $RunName
    $ev = Join-Path $root 'evidence'
    $cr = if ($Settings.Contains('changeRecord')) { "$($Settings.changeRecord)" } else { '' }
    $rows = @(Invoke-XdrRunAll -Settings $Settings -Invoker $Invoker -RunRoot $runRoot -AsOf $AsOf -EvidencePath $ev -ChangeRecord $cr)
    $o = New-XdrRunFolder -OutputPath (Join-Path $runRoot 'scheduled-run')
    Write-XdrCsv -Path (Join-Path $o 'runs.csv') -Rows $rows -Columns Task, Result, Record, Detail
    $err = @($rows | Where-Object Result -EQ 'Error').Count
    $null = Write-XdrManifest -OutputPath $o -Task scheduled-run -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($err) { 'Fail' } else { 'Pass' }); tasks = @($rows | ForEach-Object Task) }
    $e = Write-XdrEvidence -EvidencePath $ev -RunPath $o -AsOf $AsOf -ChangeRecord $cr -Command 'Invoke-XdrScheduledRun'
    [pscustomobject]@{ Rows = $rows; RunRoot = $runRoot; EvidencePath = $ev; Record = $e.Sequence }
}

Export-ModuleMember -Function Use-XdrDeployFixture, Invoke-XdrPreflight, Invoke-XdrPublish, New-XdrRollbackPlan, Invoke-XdrRollback, Invoke-XdrScheduledRun, Get-XdrGraphContext
