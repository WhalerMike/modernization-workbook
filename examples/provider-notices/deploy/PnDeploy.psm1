#Requires -Version 7.1
<#
    PnDeploy: taking the provider notices kit from the labs to a test environment, then production, with
    one settings file per environment. A read-only preflight; a plan for Azure Service Health alerts at scale
    with Azure Policy (the built-in definition Learn names), applied only with -Apply and the plan's approved
    SHA-256; the scheduled run (collect, route, digest, evidence); and a rollback plan. Each step writes a run
    folder with a manifest that Invoke-PnEvidence.ps1 records. Fixture mode sends nothing anywhere. Nothing
    here has been run against a live tenant, account, tenancy or project.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/ProviderNotices/ProviderNotices.psm1') -Force -Global

# Learn, "Deploy Service Health alerts at scale using Azure Policy": the built-in definition.
$script:ServiceHealthPolicyId = '98903777-a9f6-47f5-90a9-acaf62ab01a8'
$script:ServiceHealthPolicyName = 'Configure subscriptions to enable Service Health Monitoring Alert Rules'
$script:Tools = @{ azure = 'az'; m365 = 'Microsoft.Graph.Authentication'; oci = 'oci'; aws = 'aws'; google = 'gcloud' }
$script:FirstCall = @{ azure = 'azure-service-health-events'; m365 = 'm365-messages'; oci = 'oci-announcements-list'; aws = 'aws-describe-events'; google = 'google-events' }

function New-PnDeployResult {
    param([string]$Id, [string]$Status, [string]$Detail)
    [pscustomobject][ordered]@{ Id = $Id; Status = $Status; Detail = $Detail }
}

function Test-PnToolPresent {
    # Replaced in fixture mode. Live: the CLI on PATH, or the Graph module installed.
    param([string]$Name)
    if ($Name -like 'Microsoft.*') { return [bool](Get-Module -ListAvailable -Name $Name) }
    [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Use-PnDeployFixture {
    <#
    .SYNOPSIS
        Fixture mode for the deploy scripts: tool presence and the signed-in clouds come from a file, the
        reads from a fixture folder, and the planned writes are recorded, never run. Returns the invoker.
    .EXAMPLE
        $inv = Use-PnDeployFixture -Path deploy/tests/fixtures/environment-test.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $f = Read-PnJson -Path $Path
    $script:FixtureTools = $f.tools
    $ctx = $f.contexts
    $null = Set-PnRunner -GraphContext { $ctx.m365 }.GetNewClosure() -Native {
        param($Tool, $Arguments)
        $line = "$Tool $($Arguments -join ' ')"
        if ($line -like 'az cloud show*') { return @{ ExitCode = 0; Output = "$($ctx.azure)" } }
        if ($line -like 'aws sts get-caller-identity*') { return @{ ExitCode = 0; Output = "$($ctx.aws)" } }
        if ($line -like 'az policy definition show*') { return @{ ExitCode = 0; Output = (ConvertTo-Json $f.policyDefinition -Depth 10) } }
        @{ ExitCode = 1; Output = "fixture mode doesn't run: $line" }
    }.GetNewClosure()
    $root = if ([IO.Path]::IsPathRooted($f.readsFrom)) { $f.readsFrom } else { Join-Path (Split-Path -Parent (Resolve-Path $Path).Path) $f.readsFrom }
    New-PnFixtureInvoker -Path $root
}

function Invoke-PnPreflight {
    <#
    .SYNOPSIS
        The preflight before a stage. Reads only. PF-01 the settings and routing files; PF-02 each enabled
        provider's tool; PF-03 the signed-in cloud matches the settings; PF-04 the reader can make its first
        call (for AWS, this is also the support-plan check); PF-05 each provider's notice contacts are named
        (the notification agreement, SR-8); PF-06 the output root is writable; PF-07 in production, the test
        stage's evidence passes. Returns the results.
    .EXAMPLE
        Invoke-PnPreflight -Settings $s -Stage test -Invoker $inv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
        [Parameter(Mandatory)]$Invoker, [string]$TestEvidencePath, [string]$KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)
    $r = [Collections.Generic.List[object]]::new()
    $enabled = @('azure', 'm365', 'oci', 'aws', 'google' | Where-Object { $Settings.providers.Contains($_) -and $Settings.providers[$_].enabled })
    $ok = $true; $why = @()
    if ($Settings.environment -ne $Stage) { $ok = $false; $why += "environment is '$($Settings.environment)', not '$Stage'" }
    if (-not $enabled.Count) { $ok = $false; $why += 'no provider is enabled' }
    try { $rp = $Settings.routing.path; if (-not [IO.Path]::IsPathRooted($rp)) { $rp = Join-Path $KitRoot $rp }; $null = Read-PnRouting -Path $rp } catch { $ok = $false; $why += "routing: $($_.Exception.Message)" }
    if ($Settings.routing.send -and -not ($Settings.routing.endpoint -and $Settings.routing.tokenVariable)) { $ok = $false; $why += 'routing.send is true but no endpoint or token variable is named' }
    $r.Add((New-PnDeployResult 'PF-01' $(if ($ok) { 'Pass' } else { 'Fail' }) $(if ($ok) { "settings and routing read; providers: $($enabled -join ', ')" } else { $why -join '; ' })))
    foreach ($p in $enabled) {
        $tool = $script:Tools[$p]
        $present = if ($Invoker.Mode -eq 'Fixture') { [bool]$script:FixtureTools[$tool] } else { Test-PnToolPresent -Name $tool }
        $r.Add((New-PnDeployResult "PF-02-$p" $(if ($present) { 'Pass' } else { 'Fail' }) "$tool $(if ($present) { 'found' } else { 'not found' })"))
        try { Assert-PnLiveContext -Provider $p -Settings $Settings; $r.Add((New-PnDeployResult "PF-03-$p" 'Pass' 'signed in to the cloud the settings name')) }
        catch { $r.Add((New-PnDeployResult "PF-03-$p" 'Fail' $_.Exception.Message)) }
        try { $null = Invoke-PnCall -Invoker $Invoker -CallId $script:FirstCall[$p]; $r.Add((New-PnDeployResult "PF-04-$p" 'Pass' "$($script:FirstCall[$p]) answered with the reader's permissions")) }
        catch { $r.Add((New-PnDeployResult "PF-04-$p" 'Fail' $_.Exception.Message)) }
        $contacts = @($Settings.providers[$p]['noticeContacts'] | Where-Object { $_ })
        $r.Add((New-PnDeployResult "PF-05-$p" $(if ($contacts.Count) { 'Pass' } else { 'Fail' }) $(if ($contacts.Count) { "$($contacts.Count) notice contact(s) named" } else { 'no noticeContacts: name who receives the provider''s notices (SR-8)' })))
    }
    $root = "$($Settings['outputRoot'])"
    if (-not $root) { $r.Add((New-PnDeployResult 'PF-06' 'Fail' 'no outputRoot')) }
    else {
        try { New-Item -ItemType Directory -Force -Path $root | Out-Null; $probe = Join-Path $root '.pn-write-probe'; Set-Content -Path $probe -Value x; Remove-Item $probe; $r.Add((New-PnDeployResult 'PF-06' 'Pass' 'output root writable')) }
        catch { $r.Add((New-PnDeployResult 'PF-06' 'Fail' $_.Exception.Message)) }
    }
    if ($Stage -eq 'production') {
        if (-not $TestEvidencePath) { $r.Add((New-PnDeployResult 'PF-07' 'Fail' 'production needs -TestEvidencePath: the test stage''s evidence folder')) }
        else {
            $t = @(Test-PnEvidence -EvidencePath $TestEvidencePath -Stage test)
            $bad = @($t | Where-Object { $_.Status -ne 'Pass' })
            $r.Add((New-PnDeployResult 'PF-07' $(if ($bad.Count) { 'Fail' } else { 'Pass' }) $(if ($bad.Count) { ($bad | ForEach-Object { "$($_.Check): $($_.Detail)" }) -join '; ' } else { 'the test stage''s evidence passes' })))
        }
    }
    $r.ToArray()
}

function New-PnAlertPlan {
    <#
    .SYNOPSIS
        The plan for Azure Service Health alerts at scale: read the built-in definition and confirm its
        name, assign it at the settings scope with a system-assigned managed identity holding the
        definition's role, and start a remediation task so existing subscriptions get the alert rule and
        action group (Learn: without remediation the policy only applies to new subscriptions). Writes
        plan.json. Nothing is changed.
    .EXAMPLE
        New-PnAlertPlan -Settings $s -OutputPath out/alerts
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath)
    $ap = $Settings['azurePolicy']
    if (-not ($ap -and $ap.enabled)) { throw 'azurePolicy.enabled is false in the settings file.' }
    foreach ($k in 'scope', 'location', 'assignmentName') { if (-not $ap[$k] -or "$($ap[$k])" -match '^<') { throw "azurePolicy.$k isn't set." } }
    if ($ap.scope -notmatch '^/providers/Microsoft\.Management/managementGroups/[^/]+$|^/subscriptions/[^/]+$') { throw "azurePolicy.scope must be a management group or a subscription (Learn: the policy doesn't support a resource group scope)." }
    $def = Invoke-PnNative -Tool az -Arguments @('policy', 'definition', 'show', '--name', $script:ServiceHealthPolicyId, '--output', 'json')
    if ("$($def.displayName)" -ne $script:ServiceHealthPolicyName) { throw "Definition $($script:ServiceHealthPolicyId) is '$($def.displayName)', not '$($script:ServiceHealthPolicyName)'." }
    $roles = @($def.policyRule.then.details.roleDefinitionIds)
    if ($roles.Count -ne 1) { throw "The definition names $($roles.Count) roles for its managed identity; the plan handles one. Assign it in the portal, which grants every role (Learn, Remediate non-compliant resources)." }
    $assign = @('policy', 'assignment', 'create', '--name', $ap.assignmentName, '--display-name', $script:ServiceHealthPolicyName, '--policy', $script:ServiceHealthPolicyId,
        '--scope', $ap.scope, '--mi-system-assigned', '--location', $ap.location, '--role', "$($roles[0])", '--identity-scope', $ap.scope)
    if ($ap.parametersPath) { $assign += @('--params', "@$($ap.parametersPath)") }
    $remediate = @('policy', 'remediation', 'create', '--name', "$($ap.assignmentName)-remediation", '--policy-assignment', "$($ap.scope)/providers/Microsoft.Authorization/policyAssignments/$($ap.assignmentName)")
    if ($ap.scope -match 'managementGroups/([^/]+)$') { $remediate += @('--management-group', $Matches[1]) } else { $remediate += @('--subscription', ($ap.scope -replace '^/subscriptions/', '')) }
    $plan = [ordered]@{
        schema = 'fmp-pn-alert-plan/1'; environment = $Settings.environment; changeRecord = "$($Settings['changeRecord'])"
        definition = [ordered]@{ id = $script:ServiceHealthPolicyId; displayName = "$($def.displayName)"; roleDefinitionId = "$($roles[0])" }
        steps = @(
            [ordered]@{ id = 'AL-01'; kind = 'write'; tool = 'az'; arguments = $assign; why = 'Assign the built-in policy; its managed identity gets the definition''s role at the scope' }
            [ordered]@{ id = 'AL-02'; kind = 'write'; tool = 'az'; arguments = $remediate; why = 'Remediate existing subscriptions; without it the policy applies to new subscriptions only' }
        )
        defaults = 'With no parameters file the policy creates rg-serviceHealthAlert, the alert rule ServiceHealthSubscriptionAlertRule and the action group ag-ServiceHealthAlertActionGroup in each noncompliant subscription, emailing subscription owners for every Service Health event type (Learn).'
    }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    Write-PnJson -Path (Join-Path $OutputPath 'plan.json') -Value $plan
    $plan
}

function Invoke-PnPlanSteps {
    <#
    .SYNOPSIS
        Runs a plan's write steps, in order, only when -Apply and the plan file's SHA-256 matches
        -ApprovedSha256 (the hash the change record approved). Otherwise lists what would run. Returns one
        result per step.
    .EXAMPLE
        Invoke-PnPlanSteps -PlanPath out/alerts/plan.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [switch]$Apply, [string]$ApprovedSha256)
    $plan = Read-PnJson -Path $PlanPath
    $sha = Get-PnFileHash -Path $PlanPath
    if ($Apply -and $ApprovedSha256 -ne $sha) { throw "The plan's SHA-256 is $sha; -ApprovedSha256 must match it before -Apply runs anything." }
    foreach ($s in @($plan.steps)) {
        $line = "$($s.tool) $(@($s.arguments) -join ' ')"
        if (-not $Apply -or $s.kind -eq 'manual') { New-PnDeployResult $s.id $(if ($s.kind -eq 'manual') { 'Manual' } else { 'WouldApply' }) $line; continue }
        try {
            if ($s.tool -eq 'pwsh') { $null = & ([scriptblock]::Create(@($s.arguments) -join ' ')) } else { $null = Invoke-PnNative -Tool $s.tool -Arguments @($s.arguments) -Raw }
            New-PnDeployResult $s.id 'Applied' $line
        } catch { New-PnDeployResult $s.id 'Error' "$line : $($_.Exception.Message)"; break }
    }
}

function New-PnRollbackPlan {
    <#
    .SYNOPSIS
        The rollback plan, in reverse order of the deployment: unregister the scheduled task, then delete the
        Service Health policy assignment. The alert rules, action groups and resource groups the policy's
        remediation created stay (Learn: changing the assignment doesn't delete them); the plan lists them as
        a manual step for the change record to decide. The kit's own state, runs and evidence are kept.
    .EXAMPLE
        New-PnRollbackPlan -Settings $s -OutputPath out/rollback
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath)
    $steps = [Collections.Generic.List[object]]::new()
    $task = if ($Settings['schedule']) { "$($Settings.schedule['taskName'])" } else { '' }
    if ($task) { $steps.Add([ordered]@{ id = 'RB-01'; kind = 'write'; tool = 'pwsh'; arguments = @('Unregister-ScheduledTask', '-TaskName', "'$task'", '-Confirm:$false'); why = 'Stop the weekly run' }) }
    $ap = $Settings['azurePolicy']
    if ($ap -and $ap.enabled) {
        $steps.Add([ordered]@{ id = 'RB-02'; kind = 'write'; tool = 'az'; arguments = @('policy', 'assignment', 'delete', '--name', $ap.assignmentName, '--scope', $ap.scope); why = 'Remove the Service Health alert policy assignment' })
        $steps.Add([ordered]@{ id = 'RB-03'; kind = 'manual'; tool = 'az'; arguments = @('group', 'list', '--query', "[?name=='rg-serviceHealthAlert']"); why = 'The resource group, alert rule and action group the remediation created in each subscription stay; the change record decides whether to delete them, subscription by subscription' })
    }
    $plan = [ordered]@{ schema = 'fmp-pn-rollback-plan/1'; environment = $Settings.environment; changeRecord = "$($Settings['changeRecord'])"; steps = $steps.ToArray()
        keeps = 'The routing state, run folders and evidence are kept: they are the record of what the kit read and routed.' }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    Write-PnJson -Path (Join-Path $OutputPath 'plan.json') -Value $plan
    $plan
}

function New-PnServiceNowSender {
    <#
    .SYNOPSIS
        A sender for Invoke-PnRouting -Send: POSTs each payload as JSON to the settings' endpoint with a bearer
        token read from the environment variable the settings name. The endpoint is the agency's own (a Scripted
        REST resource or an import set); its shape is not yet specified here. Not run against a live instance.
    .EXAMPLE
        $send = New-PnServiceNowSender -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [scriptblock]$Post = { param($Uri, $Headers, $Body) Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -Body $Body -ContentType 'application/json' })
    $uri = "$($Settings.routing.endpoint)"; $var = "$($Settings.routing.tokenVariable)"
    if ($uri -notmatch '^https://') { throw 'routing.endpoint must be an https URL.' }
    {
        param($Payload)
        $token = [Environment]::GetEnvironmentVariable($var)
        if (-not $token) { throw "Environment variable $var holds no token." }
        $res = & $Post $uri @{ Authorization = "Bearer $token" } (ConvertTo-Json $Payload -Depth 10 -Compress)
        if ($res -and $res.PSObject.Properties['result'] -and $res.result.PSObject.Properties['sys_id']) { "$($res.result.sys_id)" } else { 'sent' }
    }.GetNewClosure()
}

function Write-PnDeployRun {
    <#
    .SYNOPSIS
        Writes a deploy step's run folder: results.json (and the plan, when there is one) and a manifest,
        so Invoke-PnEvidence.ps1 can record it.
    .EXAMPLE
        Write-PnDeployRun -OutputPath out/preflight -Task preflight -Results $r -Settings $s -Mode Fixture -AsOf 2026-11-09T12:00:00Z
    #>
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [object[]]$Results = @(), [Parameter(Mandatory)][hashtable]$Settings,
        [string]$Mode = 'Live', [Parameter(Mandatory)][string]$AsOf, [string[]]$CallIds = @())
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    Write-PnJson -Path (Join-Path $OutputPath 'results.json') -Value ([ordered]@{ task = $Task; environment = $Settings.environment; changeRecord = "$($Settings['changeRecord'])"
            settingsSha256 = $Settings._sha256; results = @($Results | ForEach-Object { [ordered]@{ id = $_.Id; status = $_.Status; detail = $_.Detail } }) })
    $null = Write-PnManifest -OutputPath $OutputPath -Task $Task -AsOf (ConvertTo-PnUtc $AsOf) -Mode $Mode -Environment $Settings.environment -CallIds $CallIds
}

Export-ModuleMember -Function Invoke-PnPreflight, New-PnAlertPlan, Invoke-PnPlanSteps, New-PnRollbackPlan, New-PnServiceNowSender, Write-PnDeployRun, Use-PnDeployFixture, Test-PnToolPresent
