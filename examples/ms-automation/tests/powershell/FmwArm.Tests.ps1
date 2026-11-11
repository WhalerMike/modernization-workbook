BeforeAll {
    $modulePath = Join-Path $PSScriptRoot '..' '..' 'powershell' 'FmwArm.psm1'
    Import-Module $modulePath -Force
    $fix = Join-Path $PSScriptRoot '..' 'fixtures'
    function Read-Fixture([string]$Name) {
        Get-Content -Raw -Path (Join-Path $fix "$Name.json") | ConvertFrom-Json -AsHashtable -DateKind String
    }
    function ConvertTo-Canonical($Value) {
        if ($Value -is [System.Collections.IDictionary]) {
            $o = [ordered]@{}
            foreach ($k in ($Value.Keys | Sort-Object { [string]$_ } -CaseSensitive)) { $o[[string]$k] = ConvertTo-Canonical $Value[$k] }
            return $o
        }
        if ($Value -is [System.Collections.IList]) { return , @($Value | ForEach-Object { ConvertTo-Canonical $_ }) }
        $Value
    }
    function Assert-SameJson($Actual, $Expected) {
        (ConvertTo-Canonical $Actual | ConvertTo-Json -Depth 20 -Compress) | Should -BeExactly (ConvertTo-Canonical $Expected | ConvertTo-Json -Depth 20 -Compress)
    }
    $arc = Read-Fixture 'arc'
    $expected = Read-Fixture 'expected-arc'
    $asOf = [datetimeoffset]::new(2026, 11, 3, 0, 0, 0, [timespan]::Zero)
}

Describe 'Arc checks match the Python results' {
    It 'arc-extensions' { Assert-SameJson (Test-FmwArcExtension -Machines $arc.machines -Extensions $arc.extensions) $expected.'arc-extensions' }
    It 'arc-private-link' { Assert-SameJson (Test-FmwArcPrivateLink -Machines $arc.machines) $expected.'arc-private-link' }
    It 'lifecycle' { Assert-SameJson (Test-FmwArcLifecycle -Machines $arc.machines -SqlInstances $arc.sqlInstances -AsOf $asOf) $expected.lifecycle }
    It 'sql-inventory' { Assert-SameJson (Test-FmwArcSql -Machines $arc.machines -SqlInstances $arc.sqlInstances) $expected.'sql-inventory' }
    It 'policy-summary' { Assert-SameJson (Test-FmwArcPolicy -Assignments $arc.assignments -PolicyStates $arc.policyStates) $expected.'policy-summary' }
}

Describe 'Rules' {
    It 'reports an empty scope instead of a clean result' {
        $r = Test-FmwArcPrivateLink -Machines @()
        $r.emptyScope | Should -BeTrue
        $r.publicEndpoint | Should -Be 0
    }
    It 'counts an ESU assignment only inside the ESU window' {
        $m = @(@{ id = 'x'; name = 'W12'; osSku = 'Windows Server 2012 R2 Standard'; esuAssignment = 'Assigned' })
        (Test-FmwArcLifecycle -Machines $m -AsOf '2026-10-01T00:00:00Z').findings[0].state | Should -Be 'esuCovered'
        (Test-FmwArcLifecycle -Machines $m -AsOf $asOf).findings[0].state | Should -Be 'unsupported'
    }
    It 'keeps ESUs open when they are offered with no end date' {
        $m = @(@{ id = 'x'; name = 'W16'; osSku = 'Windows Server 2016 Standard'; esuAssignment = 'NotAssigned' })
        $f = (Test-FmwArcLifecycle -Machines $m -AsOf '2027-03-01T00:00:00Z').findings[0]
        $f.state | Should -Be 'esuNotConfirmed'
        $f.date | Should -BeNullOrEmpty
    }
    It 'reads the lifecycle table longest product first' {
        (Get-FmwArcLifecycleTable)[0].product.Length | Should -BeGreaterOrEqual (Get-FmwArcLifecycleTable)[-1].product.Length
    }
}

Describe 'Read-only' {
    It 'calls no Az cmdlet that writes, and no REST method' {
        $ast = [System.Management.Automation.Language.Parser]::ParseFile($modulePath, [ref]$null, [ref]$null)
        $commands = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true) | ForEach-Object { $_.GetCommandName() } | Where-Object { $_ }
        $writes = $commands | Where-Object { $_ -match '^(Set|New|Remove|Update|Start|Stop|Restart|Register|Unregister|Enable|Disable|Invoke)-Az' }
        $writes | Should -BeNullOrEmpty
        $commands | Should -Contain 'Search-AzGraph'
    }
    It 'sorts every query by a unique column, and uses no take or limit' {
        InModuleScope FmwArm {
            foreach ($q in $script:Q.Values) {
                $q | Should -Match '\| order by (id|assignmentId) asc$'
                $q | Should -Not -Match '\b(take|limit|sample)\b'
            }
        }
    }
    It 'reads no extension settings' {
        (Get-Content -Raw $modulePath) | Should -Not -Match 'properties\.(protected)?settings'
    }
}
