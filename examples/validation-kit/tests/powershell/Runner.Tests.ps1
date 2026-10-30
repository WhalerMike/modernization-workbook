# Runs Invoke-ValidationKit.ps1 end to end against the fail fixture: every default check, the
# CSV and JSON results, the per-check details, the one-page summary, the snapshot and the
# provenance manifest, with no live calls.

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    $script:Started = Get-Date
    $script:Out = Join-Path $TestDrive 'validation'
    $script:Results = @(& (Join-Path $KitRoot 'Invoke-ValidationKit.ps1') -OutputPath $Out -FixturePath (Join-Path $global:VkTestFixtureRoot 'fail') `
            -AsOf '2026-10-29T00:00:00Z' -Option @{ BaselineAssignmentName = 'server-baseline' } 6>$null)
    $script:RunDir = @(Get-ChildItem -Path $Out -Directory)[0].FullName
    $script:Manifest = Get-Content -Raw (Join-Path $RunDir 'ValidationManifest.json') | ConvertFrom-Json
}

Describe 'Invoke-ValidationKit.ps1' {
    It 'runs every default check (the optional preview check stays off)' {
        $Results.Count | Should -Be 38
        @($Results.CheckId) | Should -Not -Contain 'VK-NPI-09'
        @($Results | Where-Object Status -eq 'Error' | ForEach-Object { "$($_.CheckId): $($_.Message)" }) | Should -BeNullOrEmpty
    }
    It 'names the run folder with the date, host and mode' {
        Split-Path -Leaf $RunDir | Should -Match '^\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9\-]+-fixture$'
    }
    It 'writes CSV and JSON results, per-check details and the one-page summary' {
        $csv = @(Import-Csv (Join-Path $RunDir 'Results\ValidationResults.csv'))
        $csv.Count | Should -Be 38
        @($csv[0].PSObject.Properties.Name) | Should -Contain 'Queries'
        @($csv[0].PSObject.Properties.Name) | Should -Contain 'CollectedAtUtc'
        $json = Get-Content -Raw (Join-Path $RunDir 'Results\ValidationResults.json') | ConvertFrom-Json
        @($json).Count | Should -Be 38
        Join-Path $RunDir 'Details\VK-HR-01.csv' | Should -Exist
        @(Import-Csv (Join-Path $RunDir 'Details\VK-HR-01.csv')).Count | Should -Be 3
        $md = Get-Content -Raw (Join-Path $RunDir 'Summary\ValidationSummary.md')
        foreach ($r in $Results) { $md | Should -Match ([regex]::Escape("| $($r.CheckId) |")) }
        $md | Should -Match 'not proven against a live tenant'
    }
    It 'writes the membership snapshot for the next VK-DG-05 run' {
        $snap = Get-Content -Raw (Join-Path $RunDir 'Snapshot\membership-snapshot.json') | ConvertFrom-Json
        @($snap.groups.PSObject.Properties).Count | Should -BeGreaterThan 0
    }
    It 'records provenance and hashes every other file' {
        $Manifest.ReadOnly | Should -BeTrue
        $Manifest.Mode | Should -Be 'Fixture'
        $Manifest.ExecutedBy | Should -Not -BeNullOrEmpty
        Get-Content -Raw (Join-Path $RunDir 'ValidationManifest.json') | Should -Match '"AsOfUtc":\s*"2026-10-29T00:00:00Z"'
        @($Manifest.Checks).Count | Should -Be 38
        $files = @(Get-ChildItem -Path $RunDir -Recurse -File | Where-Object Name -ne 'ValidationManifest.json')
        $Manifest.FileCount | Should -Be $files.Count
        foreach ($f in @($Manifest.Files)) { (Get-FileHash -Path (Join-Path $RunDir $f.RelativePath) -Algorithm SHA256).Hash | Should -Be $f.SHA256 }
    }
    It 'selects by -Track and by -CheckId, and runs the preview check only with -IncludePreview' {
        $fx = Join-Path $global:VkTestFixtureRoot 'fail'
        @(& (Join-Path $KitRoot 'Invoke-ValidationKit.ps1') -OutputPath (Join-Path $TestDrive 't') -FixturePath $fx -AsOf '2026-10-29T00:00:00Z' -Track HR 6>$null).Count | Should -Be 6
        @(& (Join-Path $KitRoot 'Invoke-ValidationKit.ps1') -OutputPath (Join-Path $TestDrive 'c') -FixturePath $fx -AsOf '2026-10-29T00:00:00Z' -CheckId VK-INT-01, VK-ARC-06 6>$null).CheckId | Should -Be @('VK-INT-01', 'VK-ARC-06')
        $p = @(& (Join-Path $KitRoot 'Invoke-ValidationKit.ps1') -OutputPath (Join-Path $TestDrive 'p') -FixturePath $fx -AsOf '2026-10-29T00:00:00Z' -Track NPI -IncludePreview 6>$null)
        ($p | Where-Object CheckId -eq 'VK-NPI-09').Status | Should -Be 'Fail'
    }
    It 'writes nothing outside -OutputPath, and nothing into the kit' {
        @(Get-ChildItem -Path $TestDrive -Force | Where-Object { $_.Name -notin 'validation', 't', 'c', 'p' }) | Should -BeNullOrEmpty
        @(Get-ChildItem -Path $KitRoot -Recurse -File -Force | Where-Object { $_.LastWriteTime -gt $script:Started }).FullName | Should -BeNullOrEmpty
    }
}
