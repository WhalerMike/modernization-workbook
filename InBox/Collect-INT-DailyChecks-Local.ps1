[CmdletBinding()]
param(
    [string]$OutputRoot = 'C:\Ops\DailyChecks\Output\Current\Integration',
    [int]$NumberRequested = 100,
    [int]$ExportErrorWarning = 1
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $Message) -ForegroundColor Cyan
}

if ($env:COMPUTERNAME -ne 'NS-SYN-NF-01') {
    throw "This collector must run locally on NS-SYN-NF-01. Current computer: $env:COMPUTERNAME"
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = Join-Path $OutputRoot $runId
New-Item -Path $runDirectory -ItemType Directory -Force | Out-Null

Write-Step 'Importing ADSync module'
Import-Module ADSync -Force

Write-Step 'Collecting ADSync service and scheduler status'
$service = Get-Service ADSync
$scheduler = Get-ADSyncScheduler

$adSyncStatus = [pscustomobject][ordered]@{
    CheckId             = 'ADSYNC-001'
    CheckType           = 'ADSYNC-001'
    Category            = 'ADSync'
    Environment         = 'Integration'
    Target              = $env:COMPUTERNAME
    Status              = if ($service.Status -eq 'Running' -and $scheduler.SyncCycleEnabled -and -not $scheduler.SchedulerSuspended) { 'Green' } else { 'Red' }
    Severity            = if ($service.Status -eq 'Running' -and $scheduler.SyncCycleEnabled -and -not $scheduler.SchedulerSuspended) { 'Info' } else { 'Critical' }
    Summary             = if ($service.Status -eq 'Running' -and $scheduler.SyncCycleEnabled -and -not $scheduler.SchedulerSuspended) { 'ADSync service and scheduler are healthy.' } else { 'ADSync service or scheduler requires attention.' }
    ADSyncService       = [string]$service.Status
    SyncCycleEnabled    = [bool]$scheduler.SyncCycleEnabled
    SyncCycleInProgress = [bool]$scheduler.SyncCycleInProgress
    SchedulerSuspended  = [bool]$scheduler.SchedulerSuspended
    NextSyncCycleUTC    = if ($scheduler.NextSyncCycleStartTimeInUTC) { ([datetime]$scheduler.NextSyncCycleStartTimeInUTC).ToString('o') } else { $null }
    Timestamp           = (Get-Date).ToString('o')
}

Write-Step 'Collecting ADSync run history locally'
$recentRuns = @(Get-ADSyncRunProfileResult -NumberRequested $NumberRequested)
$latestRuns = @(
    $recentRuns |
        Where-Object IsRunComplete |
        Group-Object ConnectorName,RunProfileName |
        ForEach-Object {
            $_.Group | Sort-Object StartDate -Descending | Select-Object -First 1
        }
)

$runHistory = foreach ($run in $latestRuns) {
    $detailed = Get-ADSyncRunProfileResult -RunHistoryId $run.RunHistoryId -RunStepDetails
    $steps = @($detailed.RunStepResults)

    $stageFailure = [int](($steps | Measure-Object -Property StageFailure -Sum).Sum)
    $flowFailure = [int](($steps | Measure-Object -Property FlowFailure -Sum).Sum)
    $exportFailure = [int](($steps | Measure-Object -Property ExportFailure -Sum).Sum)
    $totalFailure = $stageFailure + $flowFailure + $exportFailure
    $isWarning = ($run.Result -ne 'success') -or ($totalFailure -ge $ExportErrorWarning)

    [pscustomobject][ordered]@{
        CheckId        = 'ADSYNC-002|{0}|{1}' -f (($run.ConnectorName -replace ' ','_')),(($run.RunProfileName -replace ' ','_'))
        CheckType      = 'ADSYNC-002'
        Category       = 'ADSyncRunHistory'
        Environment    = 'Integration'
        Target         = [string]$run.ConnectorName
        Status         = if ($isWarning) { 'Yellow' } else { 'Green' }
        Severity       = if ($isWarning) { 'Warning' } else { 'Info' }
        Summary        = '{0} result: {1}; failures: {2}.' -f $run.RunProfileName,$run.Result,$totalFailure
        ConnectorName  = [string]$run.ConnectorName
        RunProfileName = [string]$run.RunProfileName
        RunResult      = [string]$run.Result
        RunHistoryId   = [string]$run.RunHistoryId
        StartDate      = ([datetime]$run.StartDate).ToString('o')
        EndDate        = ([datetime]$run.EndDate).ToString('o')
        StageFailure   = $stageFailure
        FlowFailure    = $flowFailure
        ExportAdd      = [int](($steps | Measure-Object -Property ExportAdd -Sum).Sum)
        ExportUpdate   = [int](($steps | Measure-Object -Property ExportUpdate -Sum).Sum)
        ExportDelete   = [int](($steps | Measure-Object -Property ExportDelete -Sum).Sum)
        ExportFailure  = $exportFailure
        TotalFailure   = $totalFailure
        Timestamp      = (Get-Date).ToString('o')
    }
}

$results = @($adSyncStatus) + @($runHistory)
$exportRows = @($runHistory | Where-Object RunProfileName -eq 'Export')
$exportFailures = 0
if ($exportRows.Count -gt 0) {
    $measurement = $exportRows | Measure-Object -Property ExportFailure -Sum
    if ($measurement.PSObject.Properties['Sum'] -and $null -ne $measurement.Sum) {
        $exportFailures = [int]$measurement.Sum
    }
}

$summary = [pscustomobject][ordered]@{
    Environment      = 'Integration'
    SourceServer     = $env:COMPUTERNAME
    CollectedAt      = (Get-Date).ToString('o')
    TotalResults     = $results.Count
    Green            = @($results | Where-Object Status -eq 'Green').Count
    Yellow           = @($results | Where-Object Status -eq 'Yellow').Count
    Red              = @($results | Where-Object Status -eq 'Red').Count
    ExportFailures   = $exportFailures
    OutputDirectory  = $runDirectory
}

$results | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $runDirectory 'INT-DailyChecks.json') -Encoding UTF8
$results | Export-Csv (Join-Path $runDirectory 'INT-DailyChecks.csv') -NoTypeInformation -Encoding UTF8
$summary | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $runDirectory 'INT-DailyChecks-Summary.json') -Encoding UTF8
$summary | Export-Csv (Join-Path $runDirectory 'INT-DailyChecks-Summary.csv') -NoTypeInformation -Encoding UTF8

Get-ChildItem $runDirectory -File | ForEach-Object {
    [pscustomobject]@{
        FileName         = $_.Name
        LengthBytes      = $_.Length
        SHA256           = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
        LastWriteTimeUtc = $_.LastWriteTimeUtc.ToString('o')
    }
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $runDirectory 'INT-DailyChecks-Manifest.json') -Encoding UTF8

Write-Step 'Integration local collection completed'
$summary | Format-List
$results | Select-Object CheckType,Status,Target,Summary | Format-Table -AutoSize -Wrap
Write-Host "Output: $runDirectory" -ForegroundColor Green
