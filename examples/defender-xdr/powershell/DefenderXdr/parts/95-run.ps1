# The monthly evidence run (guide G10): every check into one folder, the metrics, and each run recorded.

$script:AllTasks = @('access', 'coverage', 'prevention', 'asr', 'exposure', 'incidents', 'detections', 'signals', 'automation')

function Invoke-XdrRunAll {
    <#
    .SYNOPSIS
        The guide's monthly evidence run as one command: runs each check into <RunRoot>/<task>, computes the
        metrics into <RunRoot>/metrics, and, with -EvidencePath, records every run folder as evidence. A check
        that throws is recorded as an error row and the run goes on. Returns one row per task.
    .EXAMPLE
        Invoke-XdrRunAll -Settings $s -Invoker $inv -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$RunRoot, [Parameter(Mandatory)][string]$AsOf,
        [string]$EvidencePath, [string]$ChangeRecord = '', [string[]]$Tasks = $script:AllTasks)
    New-Item -ItemType Directory -Force -Path $RunRoot | Out-Null
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($t in $Tasks) {
        $o = Join-Path $RunRoot $t
        try {
            $null = switch ($t) {
                'access' { Invoke-XdrAccessCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'coverage' { Invoke-XdrCoverageCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'prevention' { Invoke-XdrPreventionCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'asr' { Invoke-XdrAsrCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'exposure' { Invoke-XdrExposureCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'incidents' { Invoke-XdrIncidentCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'detections' { Invoke-XdrDetectionCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'signals' { Invoke-XdrSignalsCheck -Settings $Settings -Invoker $Invoker -OutputPath $o -AsOf $AsOf }
                'automation' { Invoke-XdrAutomationCheck -Settings $Settings -OutputPath $o -AsOf $AsOf }
                default { throw "Unknown task '$t'." }
            }
            $m = Read-XdrJson -Path (Join-Path $o 'manifest.json')
            $rows.Add([pscustomobject][ordered]@{ Task = $t; Result = "$($m.result)"; Record = ''; Detail = '' })
        }
        catch { $rows.Add([pscustomobject][ordered]@{ Task = $t; Result = 'Error'; Record = ''; Detail = $_.Exception.Message }) }
    }
    $ex = if ($Settings.inputs.Contains('exercise')) { "$($Settings.inputs.exercise)" } else { '' }
    $null = Invoke-XdrMetrics -Settings $Settings -RunRoot $RunRoot -OutputPath (Join-Path $RunRoot 'metrics') -AsOf $AsOf -ExercisePath $ex
    $rows.Add([pscustomobject][ordered]@{ Task = 'metrics'; Result = 'Pass'; Record = ''; Detail = '' })
    if ($EvidencePath) {
        foreach ($r in $rows) {
            if ($r.Result -eq 'Error') { continue }
            $e = Write-XdrEvidence -EvidencePath $EvidencePath -RunPath (Join-Path $RunRoot $r.Task) -AsOf $AsOf -ChangeRecord $ChangeRecord -Command "Invoke-XdrRunAll ($($r.Task))"
            $r.Record = '{0:d4}' -f $e.Sequence
        }
    }
    $rows.ToArray()
}
