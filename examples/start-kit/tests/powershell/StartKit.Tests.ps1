# Runs Invoke-FMPStartKit.ps1 end to end against the fixture forest: every step, the summary
# and the provenance manifest, with no live calls.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') -Force
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPNpsInventory') -Force
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPTransactionProfile') -Force
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPAttributeSurvey') -Force
    Register-KitAdMocks -ModuleName FMPADAssessment
    Register-KitAdMocks -ModuleName FMPSqlEstate
    Register-KitSqlMocks
    Register-KitNpsMocks
    Register-KitSurveyMocks
    Mock -ModuleName FMPADAssessment Get-FMPCAEditFlags { 'EditFlags REG_DWORD = 1' }
    # The run script itself reads the forest and the DC that serves each domain.
    Mock Get-ADForest { $global:FMPFix.forest }
    Mock Get-ADDomainController { @(Get-FixList $global:FMPFix.dcs $DomainName)[0] }

    $script:Started = Get-Date
    $out = Join-Path $TestDrive 'assess'
    & (Join-Path $KitRoot 'Invoke-FMPStartKit.ps1') -OutputPath $out -Tier B -ProbeNetwork -QueryInstances -TargetServers 'app01.contoso.example' `
        -TransactionCatalog (Join-Path $FMPTxPath 'TransactionCatalog.csv') -TransactionMeasurementPath (Join-Path $FMPTxPath 'measurements') 6>$null 3>$null
    $runDir = @(Get-ChildItem -Path $out -Directory)[0]
    $manifest = Get-Content -Raw (Join-Path $runDir.FullName 'AssessmentManifest.json') | ConvertFrom-Json
}

Describe 'Invoke-FMPStartKit.ps1' {
    It 'names the run folder with Book 01''s run identifier' {
        $runDir.Name | Should -Match '^\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9\-]+-tierB$'
    }
    It 'completes every step' {
        @($manifest.Steps | Where-Object Status -ne 'Completed' | ForEach-Object { "$($_.Step): $($_.Error)" }) | Should -BeNullOrEmpty
        @($manifest.Steps).Count | Should -Be 28
    }
    It 'records provenance: who, when, where, with what' {
        $manifest.ReadOnly | Should -BeTrue
        $manifest.Forest | Should -Be 'contoso.example'
        $manifest.ExecutedBy | Should -Not -BeNullOrEmpty
        $manifest.ComputerName | Should -Not -BeNullOrEmpty
        $manifest.StartTimeUtc | Should -Not -BeNullOrEmpty
        $manifest.ServedBy.'child.contoso.example' | Should -Be 'cdc01.child.contoso.example'
        $manifest.ModuleVersions.FMPADAssessment | Should -Be '1.4.0'
        $manifest.Parameters.QueryInstances | Should -BeTrue
        $manifest.ModuleVersions.FMPNpsInventory | Should -Be '1.0.0'
        $manifest.ModuleVersions.FMPTransactionProfile | Should -Be '1.0.0'
        $manifest.ModuleVersions.FMPSqlEstate | Should -Be '1.1.0'
        $manifest.Parameters.TransactionCatalog | Should -BeTrue
        $manifest.KitVersion | Should -Be '1.3.0'
    }
    It 'hashes every file in the run, and the hashes match' {
        $files = @(Get-ChildItem -Path $runDir.FullName -Recurse -File | Where-Object Name -ne 'AssessmentManifest.json')
        $manifest.FileCount | Should -Be $files.Count
        foreach ($f in @($manifest.Files)) {
            (Get-FileHash -Path (Join-Path $runDir.FullName $f.RelativePath) -Algorithm SHA256).Hash | Should -Be $f.SHA256
        }
    }
    It 'writes the summary, the SQL estate, the NPS inventory and the pre-flight' {
        Join-Path $runDir.FullName 'Summary\StartKitSummary.md' | Should -Exist
        Join-Path $runDir.FullName 'SQL\SqlEstate.csv' | Should -Exist
        Join-Path $runDir.FullName 'NPS\RadiusClients.csv' | Should -Exist
        Join-Path $runDir.FullName 'Preflight\DelegationRequest.md' | Should -Exist
        Join-Path $runDir.FullName 'transaction-profiles\SeparationGate.csv' | Should -Exist
    }
    It 'carries the NPS counts into the one-page summary' {
        $s = Get-Content -Raw (Join-Path $runDir.FullName 'Summary\StartKitSummary.json') | ConvertFrom-Json
        $s.Counts.NPSServers | Should -Be 3
        $s.Counts.NPSServersRead | Should -Be 2
        $s.Counts.RADIUSClients | Should -Be 3
        $s.Counts.NPSPolicyGroups | Should -Be 5
        Get-Content -Raw (Join-Path $runDir.FullName 'Summary\StartKitSummary.md') | Should -Match 'RADIUS and NPS findings by severity'
    }
    It 'carries the separation gate into the one-page summary' {
        $s = Get-Content -Raw (Join-Path $runDir.FullName 'Summary\StartKitSummary.json') | ConvertFrom-Json
        $s.Counts.ProfiledApplications | Should -Be 3
        $s.Counts.ProfiledTransactions | Should -Be 5
        $s.Counts.SeparationGatePassing | Should -Be 1
        $s.Counts.SeparationGateBlocked | Should -Be 2
        Get-Content -Raw (Join-Path $runDir.FullName 'Summary\StartKitSummary.md') | Should -Match 'Transaction profiles by status'
    }
    It 'carries the attribute survey and the waves into the one-page summary' {
        $s = Get-Content -Raw (Join-Path $runDir.FullName 'Summary\StartKitSummary.json') | ConvertFrom-Json
        $s.Counts.SurveyedUsers | Should -Be 10
        $s.Counts.DuplicatePersonKeys | Should -Be 1
        $s.Counts.Waves | Should -BeGreaterThan 0
        Join-Path $runDir.FullName 'AttributeSurvey\ad-user-export.csv' | Should -Exist
        Join-Path $runDir.FullName 'Waves\waves.csv' | Should -Exist
        Get-Content -Raw (Join-Path $runDir.FullName 'Summary\StartKitSummary.md') | Should -Match 'Enterprise person key \(employeeID\) fill rate'
    }
    It 'writes nothing outside -OutputPath' {
        @(Get-ChildItem -Path $TestDrive -Force | Where-Object Name -ne 'assess') | Should -BeNullOrEmpty
        # Nothing lands in the kit folder or the current directory either.
        @(Get-ChildItem -Path $KitRoot -Force | Where-Object { $_.Name -notin 'Invoke-FMPStartKit.ps1', 'README.md', 'powershell', 'tests' }).Name | Should -BeNullOrEmpty
        @(Get-ChildItem -Path $KitRoot -Recurse -File -Force | Where-Object { $_.LastWriteTime -gt $script:Started }).FullName | Should -BeNullOrEmpty
    }
}
