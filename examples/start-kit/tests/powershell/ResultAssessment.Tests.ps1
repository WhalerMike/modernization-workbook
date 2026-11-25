# The result assessment: reads two fictional finished runs (October and November) and a
# Non-Person Identity kit run's findings and ownership, and checks the findings, counts, top
# risks and the comparison. Files only: no mocks needed.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPResultAssessment') -Force
    $script:Fx = Join-Path $FixturePath 'result-assessment'
    $script:Out = Join-Path $TestDrive 'review'
    $script:Doc = Invoke-FMPResultAssessment -RunPath (Join-Path $Fx 'run-nov') -BaselineRunPath (Join-Path $Fx 'run-oct') `
        -NpiPath (Join-Path $Fx 'npi-inventory') -NpiOwnershipPath (Join-Path $Fx 'npi-ownership') -OutputPath $Out 6>$null 3>$null
    $script:Ids = @($Doc.Findings.Id)
}

Describe 'Get-FMPRunAssessment' {
    It 'raises one finding per problem, each with a stable ID, a severity, a requirement and a KSI' {
        $Ids | Should -Contain 'RUN-INCOMPLETE:DNS (contoso.example)'
        $Ids | Should -Contain 'RUN-INPUT-CHANGED:C:\FMWLabs\inputs\wave-plan.csv'
        $Ids | Should -Contain 'SPN-ORPHAN-HOST:contoso.example\svc-legacyapp'
        $Ids | Should -Contain 'SPN-ORPHAN-ACCOUNT:contoso.example\krbtgt'
        $Ids | Should -Contain 'DELEG-UNCONSTRAINED-HOST:contoso.example\APP01'
        $Ids | Should -Not -Contain 'DELEG-UNCONSTRAINED-HOST:contoso.example\DC01'
        $Ids | Should -Contain 'PRIV-DELEGABLE:contoso.example\Administrator'
        $Ids | Should -Contain 'PRIV-ADMINCOUNT-ORPHAN:contoso.example\old-admin'
        $Ids | Should -Contain 'SVC-NO-HOST:contoso.example\svc-web'
        $Ids | Should -Contain 'SVC-NO-OWNER:svc-web'
        $Ids | Should -Contain 'SVC-SERVER-UNREACHABLE:old01.contoso.example'
        $Ids | Should -Contain 'NPI-FINDING:NPI-INV-01:ad:ad000000-0000-4000-8000-000000000011'
        foreach ($f in $Doc.Findings) { $f.Controls | Should -Not -BeNullOrEmpty; $f.Ksi | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' }
    }
    It 'counts duplicate and orphan SPNs by reason, and service accounts without a host or an owner' {
        $c = $Doc.Counts
        $c.DuplicateSpns | Should -Be 0
        $c.OrphanSpns | Should -Be 2
        $c.OrphanSpnsHostNotFound | Should -Be 1
        $c.OrphanSpnsDisabled | Should -Be 1
        $c.ServiceAccountsWithoutHost | Should -Be 1
        $c.ServiceAccountsWithoutOwner | Should -Be 1
        $c.High | Should -Be @($Doc.Findings | Where-Object Severity -eq 'High').Count
    }
    It 'says not collected, never zero, for what a run didn''t collect' {
        $a = Get-FMPRunAssessment -RunPath (Join-Path $Fx 'run-oct')
        $a.Counts.ServiceAccountsWithoutOwner | Should -Be 'not collected'
    }
    It 'sorts the findings by severity, High first' {
        $order = @{ High = 0; Medium = 1; Low = 2; Info = 3 }
        $s = @($Doc.Findings | ForEach-Object { $order[$_.Severity] })
        ($s -join ',') | Should -Be (($s | Sort-Object) -join ',')
    }
}

Describe 'Top risks and the comparison' {
    It 'lists the top risks by severity, then by how many findings each rule has, and no Info' {
        @($Doc.TopRisks).Count | Should -BeLessOrEqual 10
        $Doc.TopRisks[0].Severity | Should -Be 'High'
        @($Doc.TopRisks | Where-Object Severity -eq 'Info').Count | Should -Be 0
    }
    It 'finds what is new and what was resolved between the two runs, by ID' {
        $c = $Doc.Comparison
        @($c.Findings | Where-Object Change -eq 'Resolved').Id | Should -Contain 'SPN-DUPLICATE:HTTP/web.contoso.example'
        @($c.Findings | Where-Object Change -eq 'Resolved').Id | Should -Contain 'SPN-ORPHAN-ACCOUNT:contoso.example\OLD01$'
        @($c.Findings | Where-Object Change -eq 'New').Id | Should -Contain 'SPN-ORPHAN-HOST:contoso.example\svc-legacyapp'
        ($c.Counts | Where-Object Measure -eq 'DuplicateSpns').Change | Should -Be -1
    }
}

Describe 'Invoke-FMPResultAssessment output' {
    It 'writes Markdown, CSV and JSON, and the delta with a baseline' {
        foreach ($n in 'ResultAssessment.md', 'ResultFindings.csv', 'ResultAssessment.json', 'ResultDelta.csv') { Join-Path $Out $n | Should -Exist }
        @(Import-Csv (Join-Path $Out 'ResultFindings.csv')).Count | Should -Be @($Doc.Findings).Count
        $md = Get-Content (Join-Path $Out 'ResultAssessment.md') -Raw
        $md | Should -Match '## Top risks'
        $md | Should -Match '## Changes since 2026-10-28-0200-assess01-tierB'
        (Get-Content (Join-Path $Out 'ResultAssessment.json') -Raw | ConvertFrom-Json).Schema | Should -Be 'fmp-start-kit/result-assessment/1'
    }
    It 'refuses to write inside the run it reads, whose manifest hashes every file' {
        $copy = Join-Path $TestDrive 'runcopy'
        Copy-Item -Recurse (Join-Path $Fx 'run-nov') $copy
        { Invoke-FMPResultAssessment -RunPath $copy -OutputPath (Join-Path $copy 'review') 6>$null } | Should -Throw '*outside the run*'
    }
    It 'maps every rule to requirements and a KSI' {
        foreach ($r in @(Get-FMPAssessmentRule)) { $r.Controls | Should -Not -BeNullOrEmpty; $r.Ksi | Should -Match '^KSI-' }
    }
}
