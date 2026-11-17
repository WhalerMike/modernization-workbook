#Requires -Version 7.1
<#
    AzsDeploy: the scripts the deployment runbook ("Deploying to test and production") runs. Preflight
    checks, the weekly scheduled run, the plan for the security initiative's assignment in DoNotEnforce,
    and its rollback. The one write the kit makes (the assignment, and its rollback) is a plan by default:
    it runs only with -Apply and the plan's approved SHA-256. Illustrative: tested against fixtures and a
    stand-in az, not run against a live subscription.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Reuses the AzureSecurity module if it is already loaded (so a test's stand-in az reaches it).
Import-Module (Join-Path $PSScriptRoot '../powershell/AzureSecurity/AzureSecurity.psm1')

$script:Repo = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path

function Read-AzsDeploySettings {
    <#
    .SYNOPSIS
        Reads one environment's settings file (deploy/settings.template.json, filled): the kit's settings plus
        outputRoot, evidencePath, changeRecord, the initiative's definition name, the identity's role and
        location, and for production the test stage's evidence path. Refuses a placeholder or a secret.
    .EXAMPLE
        Read-AzsDeploySettings -Path settings.test.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $s = Read-AzsSettings -Path $Path
    foreach ($k in 'outputRoot', 'evidencePath', 'changeRecord', 'location') { if (-not $s.Contains($k) -or -not "$($s[$k])") { throw "Settings file $Path has no '$k'." } }
    foreach ($k in 'definitionName', 'identityRole') { if (-not $s.securityInitiative.Contains($k) -or -not "$($s.securityInitiative[$k])") { throw "Settings file $Path has no 'securityInitiative.$k'." } }
    if ($s.environment -notin 'test', 'production') { throw "environment must be test or production, not '$($s.environment)'." }
    if ($s.environment -eq 'production' -and -not ($s.Contains('testEvidencePath') -and "$($s.testEvidencePath)")) { throw "A production settings file needs 'testEvidencePath', the test stage's evidence." }
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    if ($text -match '(?i)"[^"]*(secret|password|clientkey|token|connectionstring)[^"]*"\s*:') { throw "Settings file $Path names a secret ($($Matches[1])); the kit signs in with az and holds no secret." }
    $s
}

function Test-AzsInRepository {
    <#
    .SYNOPSIS
        The top folder of the git repository a path is inside (the nearest folder with a .git), or $null.
    .EXAMPLE
        Test-AzsInRepository -Path C:/azs/test/runs
    #>
    param([Parameter(Mandatory)][string]$Path)
    $full = [IO.Path]::GetFullPath($Path)
    $d = [IO.DirectoryInfo]::new($full)
    while ($d) { if (Test-Path -LiteralPath (Join-Path $d.FullName '.git')) { return $d.FullName }; $d = $d.Parent }
    $null
}

function Test-AzsPreflight {
    <#
    .SYNOPSIS
        PF-01 to PF-07 before a stage: the settings, no secret, an output root outside any git repository
        (the register maps the attack surface), the Azure CLI's cloud and tenant, the reader's first query,
        the unverified calls, and for production the test stage's evidence. Live checks run only with -Live.
        Writes results.json and a manifest; returns the rows.
    .EXAMPLE
        Test-AzsPreflight -SettingsPath tests/fixtures/settings.test.json -OutputPath out/pre -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Live, [switch]$AllowUnverified)
    $AsOf = ConvertTo-AzsUtc $AsOf
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $status, $detail) $rows.Add([ordered]@{ check = $id; status = $status; detail = $detail }) }
    $s = $null
    try { $s = Read-AzsDeploySettings -Path $SettingsPath; & $add 'PF-01' 'Pass' "settings complete for $($s.environment), cloud $($s.cloud), no placeholder" } catch { & $add 'PF-01' 'Fail' "$($_.Exception.Message)" }
    if ($s) {
        & $add 'PF-02' 'Pass' 'no secret in the settings file'
        $repo = Test-AzsInRepository -Path $s.outputRoot
        $kitRepo = Test-AzsInRepository -Path $PSScriptRoot
        if ($repo -and $kitRepo -and $repo -eq $kitRepo) { & $add 'PF-03' 'Fail' "outputRoot is inside the repository the kit runs from ($repo); the register must never be committed" }
        elseif ($repo) { & $add 'PF-03' 'Warn' "outputRoot is inside the git repository at $repo; make sure nothing there is pushed outside the boundary" }
        else { & $add 'PF-03' 'Pass' 'outputRoot is outside any git repository' }
        if ($Live) {
            try { Assert-AzsLiveContext -Settings $s; & $add 'PF-04' 'Pass' "az is on $($s.cloud), tenant $($s.tenantId)" } catch { & $add 'PF-04' 'Fail' "$($_.Exception.Message)" }
            try {
                $inv = New-AzsLiveInvoker -Settings $s -SkipContextCheck
                $n = @((Invoke-AzsCall -Invoker $inv -CallId arg-subscriptions).data).Count
                if ($n) { & $add 'PF-05' 'Pass' "Resource Graph returned $n subscriptions under $($s.managementGroup)" } else { & $add 'PF-05' 'Fail' "Resource Graph returned no subscription under $($s.managementGroup): check Reader there" }
            } catch { & $add 'PF-05' 'Fail' "$($_.Exception.Message)" }
        } else {
            & $add 'PF-04' 'Skipped' 'not run without -Live'
            & $add 'PF-05' 'Skipped' 'not run without -Live'
        }
        $unv = @(Get-AzsCall | Where-Object { -not $_.verified } | ForEach-Object id)
        if ($AllowUnverified) { & $add 'PF-06' 'Pass' "$($unv.Count) unverified calls allowed for this stage; check their output against the portal" }
        else { & $add 'PF-06' 'Warn' "$($unv.Count) calls aren't verified on Learn; without -AllowUnverified the areas that use them stop" }
        if ($s.environment -eq 'production') {
            if (-not (Test-Path -LiteralPath $s.testEvidencePath)) { & $add 'PF-07' 'Fail' "no test-stage evidence at $($s.testEvidencePath)" }
            else {
                $ev = @(Test-AzsEvidence -EvidencePath $s.testEvidencePath -Stage test)
                $bad = @($ev | Where-Object Status -NE 'Pass')
                if ($bad.Count) { & $add 'PF-07' 'Fail' "test-stage evidence: $(@($bad | ForEach-Object Check) -join ', ') not passing" } else { & $add 'PF-07' 'Pass' "test-stage evidence complete ($($ev.Count) checks)" }
            }
        } else { & $add 'PF-07' 'Skipped' 'test stage: no earlier stage to check' }
    }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-AzsJson -Path (Join-Path $OutputPath 'results.json') -Value @($rows)
    $null = Write-AzsManifest -OutputPath $OutputPath -Task preflight -AsOf $AsOf -Mode $(if ($Live) { 'Live' } else { 'Fixture' }) -Environment $(if ($s) { "$($s.environment)" } else { '' }) -TenantId $(if ($s) { "$($s.tenantId)" } else { '' })
    $rows | ForEach-Object { [pscustomobject]$_ }
}

function Invoke-AzsScheduledRun {
    <#
    .SYNOPSIS
        The weekly run: every area's check into <outputRoot>/<date>/, with the previous run's register for new
        and gone exposures, a comparison with the previous run, the metrics, one manifest, and an evidence
        record. Fixture mode with -FixturePath.
    .EXAMPLE
        Invoke-AzsScheduledRun -SettingsPath tests/fixtures/settings.test.json -FixturePath ../tests/fixtures/week1 -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [string]$FixturePath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$AllowUnverified, [string]$DefenderExposurePath)
    $AsOf = ConvertTo-AzsUtc $AsOf
    $s = Read-AzsDeploySettings -Path $SettingsPath
    $inv = if ($FixturePath) { New-AzsFixtureInvoker -Path $FixturePath } else { New-AzsLiveInvoker -Settings $s -AllowUnverified:$AllowUnverified }
    New-Item -ItemType Directory -Force -Path $s.outputRoot | Out-Null
    $runName = 'run-' + $AsOf.Substring(0, 10)
    $prior = @(Get-ChildItem -LiteralPath $s.outputRoot -Directory -Filter 'run-*' | Where-Object Name -LT $runName | Sort-Object Name)
    $previous = if ($prior.Count) { $prior[-1].FullName } else { $null }
    $run = Join-Path $s.outputRoot $runName
    if (Test-Path -LiteralPath $run) { Remove-Item -Recurse -Force -LiteralPath $run }
    $prevReg = if ($previous -and (Test-Path -LiteralPath (Join-Path $previous 'exposure/register.json'))) { Read-AzsJson -Path (Join-Path $previous 'exposure/register.json') } else { $null }
    $def = if ($DefenderExposurePath) { @(Import-Csv -LiteralPath $DefenderExposurePath | ForEach-Object { @{ resourceId = $_.resourceId; source = $_.source } }) } else { $null }
    $areas = @('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy')
    $counts = [ordered]@{ Finding = 0; Warn = 0; Info = 0 }
    foreach ($a in $areas) {
        $r = Invoke-AzsCheck -Area $a -Settings $s -Invoker $inv -AsOf $AsOf -OutputPath (Join-Path $run $a) -PreviousRegister $prevReg -DefenderExposure $def
        foreach ($k in @($counts.Keys)) { $counts[$k] += $r.Counts[$k] }
    }
    $drift = $null
    if ($previous) { $drift = Compare-AzsRun -Before $previous -After $run -OutputPath (Join-Path $run 'drift') -AsOf $AsOf }
    $null = Get-AzsMetric -RunPath $run -OutputPath (Join-Path $run 'metrics') -AsOf $AsOf
    $null = Write-AzsManifest -OutputPath $run -Task scheduled-run -AsOf $AsOf -Mode $inv.Mode -Environment "$($s.environment)" -TenantId "$($s.tenantId)" -Extra @{ areas = $areas; compared = [bool]$previous; previous = $(if ($previous) { Split-Path -Leaf $previous } else { '' }) }
    $e = Write-AzsEvidence -EvidencePath $s.evidencePath -RunPath $run -AsOf $AsOf -ChangeRecord "$($s.changeRecord)" -Command 'deploy/Invoke-AzsScheduledRun.ps1'
    [pscustomobject]@{ Run = $run; Previous = $previous; Counts = $counts; Drift = $(if ($drift) { $drift.Totals } else { $null }); Evidence = $e }
}

function Get-AzsPlanHash {
    param([Parameter(Mandatory)][string]$PlanPath)
    Get-AzsFileHash -Path $PlanPath
}

function Invoke-AzsPlanApply {
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$ApprovedSha256)
    $plan = Join-Path $OutputPath 'plan.json'
    $sha = Get-AzsPlanHash -PlanPath $plan
    if ($sha -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $sha, not the approved $ApprovedSha256. Review the new plan and approve its hash." }
    $p = Read-AzsJson -Path $plan
    $results = @()
    foreach ($c in @($p.commands)) {
        $out = Invoke-AzsAz -Arguments @($c.args) -Raw
        $results += [ordered]@{ command = ('az ' + (@($c.args) -join ' ')); status = 'Sent'; output = $out }
    }
    , $results
}

function New-AzsPolicyPlan {
    <#
    .SYNOPSIS
        Plans the security initiative's assignment at the intermediate root in DoNotEnforce, with a
        system-assigned identity and the role the settings name: the guide's Step 9 command. Reads the
        estate first; plans nothing if the assignment exists. Writes plan.json and plan.txt and prints the
        plan's SHA-256; sends the commands only with -Apply and that SHA-256.
    .EXAMPLE
        New-AzsPolicyPlan -SettingsPath settings.test.json -FixturePath ../tests/fixtures/week1 -OutputPath out/plan
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
        [switch]$Apply, [string]$ApprovedSha256)
    $AsOf = ConvertTo-AzsUtc $AsOf
    $s = Read-AzsDeploySettings -Path $SettingsPath
    $inv = if ($FixturePath) { New-AzsFixtureInvoker -Path $FixturePath } else { New-AzsLiveInvoker -Settings $s }
    $mg = "/providers/Microsoft.Management/managementGroups/$($s.managementGroup)"
    $si = $s.securityInitiative
    $exists = @(@((Invoke-AzsCall -Invoker $inv -CallId arg-policy-assignments).data) | Where-Object { "$($_.name)" -ieq $si.assignmentName -and "$($_.scope)" -ieq $mg })
    $commands = @()
    if (-not $exists.Count) {
        $commands += [ordered]@{ why = 'Assign the security initiative at the intermediate root in DoNotEnforce, with a system-assigned identity for its deployIfNotExists and modify policies (guide Step 9)'
            args = @('policy', 'assignment', 'create', '--name', $si.assignmentName, '--policy-set-definition', $si.definitionName, '--scope', $mg, '--enforcement-mode', 'DoNotEnforce',
                '--mi-system-assigned', '--location', $s.location, '--role', $si.identityRole, '--identity-scope', $mg) }
    }
    if ($Apply -and -not (Test-Path -LiteralPath (Join-Path $OutputPath 'plan.json'))) { throw 'No plan to apply: run without -Apply first, review plan.txt, then rerun with -Apply and its SHA-256.' }
    if (-not $Apply) {
        if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
        New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
        Write-AzsJson -Path (Join-Path $OutputPath 'plan.json') -Value ([ordered]@{ schema = 'fmp-azs-plan/1'; kind = 'policy-assignment'; environment = $s.environment; changeRecord = $s.changeRecord; createdAt = $AsOf; existing = [bool]$exists.Count; commands = $commands })
        Write-AzsText -Path (Join-Path $OutputPath 'plan.txt') -Text (((@("# $(if ($commands.Count) { 'The command -Apply would send' } else { "Nothing to do: $($si.assignmentName) is already assigned at $($s.managementGroup)" })") + @($commands | ForEach-Object { "# $($_.why)"; 'az ' + (@($_.args) -join ' ') })) -join "`n") + "`n")
        $sha = Get-AzsPlanHash -PlanPath (Join-Path $OutputPath 'plan.json')
        $null = Write-AzsManifest -OutputPath $OutputPath -Task policy-plan -AsOf $AsOf -Mode $inv.Mode -Environment "$($s.environment)" -TenantId "$($s.tenantId)" -CallIds @('arg-policy-assignments') -Extra @{ planSha256 = $sha; applied = $false }
        return [pscustomobject]@{ Commands = $commands.Count; Sha256 = $sha; Applied = $false; Path = $OutputPath }
    }
    if ($inv.Mode -eq 'Fixture') { throw 'Refusing -Apply in fixture mode: apply only against a signed-in test or production subscription.' }
    $results = Invoke-AzsPlanApply -OutputPath $OutputPath -ApprovedSha256 $ApprovedSha256
    Write-AzsJson -Path (Join-Path $OutputPath 'results.json') -Value @($results)
    $null = Write-AzsManifest -OutputPath $OutputPath -Task policy-plan -AsOf $AsOf -Mode $inv.Mode -Environment "$($s.environment)" -TenantId "$($s.tenantId)" -Extra @{ planSha256 = $ApprovedSha256.ToLowerInvariant(); applied = $true }
    [pscustomobject]@{ Commands = @($results).Count; Sha256 = $ApprovedSha256.ToLowerInvariant(); Applied = $true; Path = $OutputPath }
}

function New-AzsRollbackPlan {
    <#
    .SYNOPSIS
        Plans the rollback of the security initiative: -Mode DoNotEnforce sets an enforcing assignment back to
        audit (the guide's Step 9 rollback); -Mode Delete removes the assignment (Step 1's). Same rules as the
        plan: written first, sent only with -Apply and its approved SHA-256. Resources a remediation created
        stay until removed.
    .EXAMPLE
        New-AzsRollbackPlan -SettingsPath settings.test.json -Mode DoNotEnforce -OutputPath out/rollback
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][ValidateSet('DoNotEnforce', 'Delete')][string]$Mode,
        [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Apply, [string]$ApprovedSha256, [switch]$Fixture)
    $AsOf = ConvertTo-AzsUtc $AsOf
    $s = Read-AzsDeploySettings -Path $SettingsPath
    $mg = "/providers/Microsoft.Management/managementGroups/$($s.managementGroup)"
    $n = $s.securityInitiative.assignmentName
    $args_ = if ($Mode -eq 'DoNotEnforce') { @('policy', 'assignment', 'update', '--name', $n, '--scope', $mg, '--enforcement-mode', 'DoNotEnforce') } else { @('policy', 'assignment', 'delete', '--name', $n, '--scope', $mg) }
    $commands = @([ordered]@{ why = $(if ($Mode -eq 'DoNotEnforce') { 'Back to audit: evaluate, don''t enforce (guide Step 9 rollback)' } else { 'Remove the assignment (guide Step 1 rollback)' }); args = $args_ })
    if (-not $Apply) {
        if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
        New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
        Write-AzsJson -Path (Join-Path $OutputPath 'plan.json') -Value ([ordered]@{ schema = 'fmp-azs-plan/1'; kind = "rollback-$($Mode.ToLowerInvariant())"; environment = $s.environment; changeRecord = $s.changeRecord; createdAt = $AsOf; commands = $commands })
        Write-AzsText -Path (Join-Path $OutputPath 'plan.txt') -Text (((@('# The command -Apply would send') + @($commands | ForEach-Object { "# $($_.why)"; 'az ' + (@($_.args) -join ' ') })) -join "`n") + "`n")
        $sha = Get-AzsPlanHash -PlanPath (Join-Path $OutputPath 'plan.json')
        $null = Write-AzsManifest -OutputPath $OutputPath -Task rollback -AsOf $AsOf -Mode $(if ($Fixture) { 'Fixture' } else { 'Live' }) -Environment "$($s.environment)" -TenantId "$($s.tenantId)" -Extra @{ planSha256 = $sha; applied = $false }
        return [pscustomobject]@{ Commands = 1; Sha256 = $sha; Applied = $false; Path = $OutputPath }
    }
    if ($Fixture) { throw 'Refusing -Apply in fixture mode.' }
    $results = Invoke-AzsPlanApply -OutputPath $OutputPath -ApprovedSha256 $ApprovedSha256
    Write-AzsJson -Path (Join-Path $OutputPath 'results.json') -Value @($results)
    $null = Write-AzsManifest -OutputPath $OutputPath -Task rollback -AsOf $AsOf -Mode Live -Environment "$($s.environment)" -TenantId "$($s.tenantId)" -Extra @{ planSha256 = $ApprovedSha256.ToLowerInvariant(); applied = $true }
    [pscustomobject]@{ Commands = @($results).Count; Sha256 = $ApprovedSha256.ToLowerInvariant(); Applied = $true; Path = $OutputPath }
}

Export-ModuleMember -Function Read-AzsDeploySettings, Test-AzsInRepository, Test-AzsPreflight, Invoke-AzsScheduledRun, New-AzsPolicyPlan, New-AzsRollbackPlan
