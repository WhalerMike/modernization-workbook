# Shared by the kit's Pester files: dot-source in BeforeAll.
$script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Import-Module (Join-Path $script:Kit 'powershell/AzureSecurity/AzureSecurity.psm1') -Force
$script:Fixtures = Join-Path $script:Kit 'tests/fixtures'
$script:Settings = Read-AzsSettings -Path (Join-Path $script:Fixtures 'settings.lab.json')

function New-TestInvoker {
    # A fixture invoker whose responses a test can change: -Patch gets (callId, key, response) and returns
    # the response to serve. The fixture files are never modified.
    param([string]$Week = 'week1', [scriptblock]$Patch)
    $fix = New-AzsFixtureInvoker -Path (Join-Path $script:Fixtures $Week)
    $inv = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[object]]::new(); Fixture = $fix; Patch = $Patch; Script = $null }
    $inv.Script = {
        param($CallId, $Key)
        $r = Invoke-AzsCall -Invoker $fix -CallId $CallId -Key $Key
        if ($Patch) { $r = & $Patch $CallId $Key $r }
        , $r
    }.GetNewClosure()
    $inv
}

function Get-TestRules {
    # The rules a check reports, sorted and unique.
    param([Parameter(Mandatory)]$Result)
    @($Result.Findings | ForEach-Object { $_.rule } | Sort-Object -Unique)
}

function New-TestContext {
    param($Invoker, [string]$AsOf = '2026-11-09T12:00:00Z', [object[]]$PreviousRegister, [object[]]$DefenderExposure)
    @{ Settings = $script:Settings; Baseline = (Get-AzsBaseline); Invoker = $Invoker; AsOf = $AsOf; PreviousRegister = $PreviousRegister; DefenderExposure = $DefenderExposure }
}
