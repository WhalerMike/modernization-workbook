#Requires -Version 7.4
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
# Book 18, Appendix A's WP4 to WP6 and the kit's evidence records, against the fictional fixtures.
# Run from examples/app-modernization:  Invoke-Pester -Path tests

BeforeAll {
    $kit = Split-Path -Parent $PSScriptRoot
    Import-Module (Join-Path $kit 'powershell/AppModernization/AppModernization.psm1') -Force
    $script:fx = Join-Path $kit 'tests/fixtures/identity'
    $script:app = '00001111-aaaa-2222-bbbb-3333cccc4444'
    $script:apply = Join-Path $kit 'Invoke-AmIdentityApply.ps1'
    function New-Pack {
        $d = Join-Path $TestDrive ([guid]::NewGuid().ToString('n'))
        Get-AmAppSnapshot -AppId $script:app -OutDir $d -Stage before -FixturePath $script:fx | Out-Null
        $d
    }
    function Get-Check($d) { Test-AmRedirectUri -SnapshotDir $d -OwnedDomainsPath "$script:fx/owned-domains.txt" -DnsPath "$script:fx/dns.json" -OutDir $d }
}

Describe 'The snapshot' {
    It 'writes the six before files and summarizes them' {
        $d = Join-Path $TestDrive 'snap'
        $s = Get-AmAppSnapshot -AppId $app -OutDir $d -Stage before -FixturePath $fx
        @(Get-ChildItem $d -Filter 'before-*.json').Count | Should -Be 6
        $s.Owners | Should -Be 1
        $s.RedirectUris | Should -Be 7
        $s.AssignmentRequired | Should -BeFalse
    }
    It 'refuses a fixture for another application' {
        { Get-AmAppSnapshot -AppId 'a0000000-0000-4000-8000-000000000999' -OutDir (Join-Path $TestDrive 'x') -FixturePath $fx } | Should -Throw '*not a0000000*'
    }
    It 'refuses to read Graph without a sign-in' {
        Mock -ModuleName AppModernization Get-Command { $null } -ParameterFilter { $Name -eq 'Get-MgContext' }
        { Get-AmAppSnapshot -AppId $app -OutDir (Join-Path $TestDrive 'y') } | Should -Throw '*Connect-MgGraph*'
    }
    It 'says which work packages apply and where each is built' {
        $d = New-Pack
        $wp = Get-AmWorkPackage -SnapshotDir $d -OwnedDomainsPath "$fx/owned-domains.txt" -DnsPath "$fx/dns.json"
        ($wp | Where-Object Needed).WorkPackage | Should -Be @('WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'WP6')
        ($wp | Where-Object WorkPackage -eq 'WP3').BuiltIn | Should -BeLike 'Non-Person Identity*Chapter 05'
    }
}

Describe 'WP4 redirect URIs' {
    BeforeAll { $script:d = New-Pack; $script:check = Get-Check $script:d }
    It 'flags <uri> with <codes>' -ForEach @(
        @{ uri = 'https://cases.contoso.example/signin-oidc'; codes = '' }
        @{ uri = 'https://*.contoso.example/signin-oidc'; codes = 'AM-RU-01' }
        @{ uri = 'http://cases-test.contoso.example/signin-oidc'; codes = 'AM-RU-02' }
        @{ uri = 'https://cases-old.contoso.example/signin-oidc'; codes = 'AM-RU-04 AM-RU-05' }
        @{ uri = 'https://cases.fabrikam.example/signin-oidc'; codes = 'AM-RU-03' }
        @{ uri = 'http://localhost:5173/'; codes = 'AM-RU-06' }
    ) {
        ($check | Where-Object Uri -ceq $uri).Findings | Should -Be $codes
    }
    It 'treats a look-alike host as not owned' {
        $d2 = New-Pack
        $a = Get-Content "$d2/before-application.json" -Raw | ConvertFrom-Json
        $a.web.redirectUris = @('https://cases.notcontoso.example/x')
        $a | ConvertTo-Json -Depth 10 | Set-Content "$d2/before-application.json"
        (Get-Check $d2 | Where-Object Platform -eq web).OwnedDomain | Should -BeFalse
    }
    It 'writes wp4-redirect-check.csv' {
        @(Import-Csv "$d/wp4-redirect-check.csv").Count | Should -Be 7
    }
    It 'refuses to keep a URI with a blocking finding' {
        { New-AmRedirectPlan -SnapshotDir $d -CheckPath "$d/wp4-redirect-check.csv" -Keep 'https://cases.fabrikam.example/signin-oidc' -ChangeId C1 -OutDir $d } | Should -Throw '*AM-RU-03*'
    }
    It 'refuses to keep a URI the application does not have' {
        { New-AmRedirectPlan -SnapshotDir $d -CheckPath "$d/wp4-redirect-check.csv" -Keep 'https://new.contoso.example/' -ChangeId C1 -OutDir $d } | Should -Throw "*isn't on the application*"
    }
    It 'plans the kept URIs per platform and lists the removed ones' {
        $r = New-AmRedirectPlan -SnapshotDir $d -CheckPath "$d/wp4-redirect-check.csv" -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId C1 -OutDir $d
        $p = Read-AmJson -Path "$d/wp4-redirect-plan.json"
        @($p.after.web) | Should -Be @('https://cases.contoso.example/signin-oidc')
        @($p.after.spa) | Should -Be @('https://cases.contoso.example/')
        @($p.removed).Count | Should -Be 5
        $r.PlanSha256 | Should -Be (Get-AmSha256 -Path "$d/wp4-redirect-plan.json")
    }
    It 'runs the regression test: kept accepted, removed refused, wildcard not tried' {
        $rows = Test-AmOAuthRegression -PlanPath "$d/wp4-redirect-plan.json" -TenantId 'aaaabbbb-0000-cccc-1111-dddd2222eeee' -FixturePath "$fx/oauth-responses.json" -OutDir $d
        @($rows).Count | Should -Be 6
        @($rows | Where-Object { -not $_.Pass }).Count | Should -Be 0
        $rows.Uri | Should -Not -Contain 'https://*.contoso.example/signin-oidc'
    }
    It 'fails the regression when a removed URI is still accepted' {
        $resp = Get-Content "$fx/oauth-responses.json" -Raw | ConvertFrom-Json
        $resp.'https://cases.fabrikam.example/signin-oidc' = '<html>Sign in</html>'
        $resp | ConvertTo-Json | Set-Content "$TestDrive/resp.json"
        $rows = Test-AmOAuthRegression -PlanPath "$d/wp4-redirect-plan.json" -TenantId t -FixturePath "$TestDrive/resp.json" -OutDir $d
        ($rows | Where-Object Uri -eq 'https://cases.fabrikam.example/signin-oidc').Pass | Should -BeFalse
    }
}

Describe 'WP5 assignment' {
    BeforeAll { $script:d = New-Pack }
    It 'refuses to require assignment with nobody assigned (AM-AS-01)' {
        { New-AmAssignmentPlan -SnapshotDir $d -AssignmentsPath "$fx/no-assignments.json" -ChangeId C1 -OutDir $d } | Should -Throw '*AM-AS-01*'
    }
    It 'refuses while user consent grants exist (AM-AS-02)' {
        $d2 = New-Pack
        $g = @(Get-Content "$d2/before-delegated-grants.json" -Raw | ConvertFrom-Json)
        $g += [pscustomobject]@{ id = 'g2'; clientId = 'x'; consentType = 'Principal'; principalId = 'u'; resourceId = 'r'; scope = 'User.Read' }
        ConvertTo-Json @($g) -Depth 5 | Set-Content "$d2/before-delegated-grants.json"
        { New-AmAssignmentPlan -SnapshotDir $d2 -AssignmentsPath "$fx/reviewed-assignments.json" -ChangeId C1 -OutDir $d2 } | Should -Throw '*AM-AS-02*'
    }
    It 'refuses a single user' {
        '[{"principalId":"u1","principalType":"User","appRoleId":"r","reason":"x"}]' | Set-Content "$TestDrive/user.json"
        { New-AmAssignmentPlan -SnapshotDir $d -AssignmentsPath "$TestDrive/user.json" -ChangeId C1 -OutDir $d } | Should -Throw '*not single users*'
    }
    It 'assigns first, then requires assignment' {
        New-AmAssignmentPlan -SnapshotDir $d -AssignmentsPath "$fx/reviewed-assignments.json" -ChangeId C1 -OutDir $d | Out-Null
        $c = @(Get-AmPlanCommand -PlanPath "$d/wp5-assignment-plan.json")
        $c.Cmdlet | Should -Be @('New-MgServicePrincipalAppRoleAssignedTo', 'New-MgServicePrincipalAppRoleAssignedTo', 'Update-MgServicePrincipal')
        $c[2].Parameters.AppRoleAssignmentRequired | Should -BeTrue
    }
}

Describe 'The write path' {
    BeforeAll {
        $script:d = New-Pack
        Get-Check $script:d | Out-Null
        New-AmRedirectPlan -SnapshotDir $d -CheckPath "$d/wp4-redirect-check.csv" -Keep 'https://cases.contoso.example/signin-oidc' -ChangeId C1 -OutDir $d | Out-Null
    }
    It 'dry-runs without -Apply and changes nothing' {
        $out = & $apply -PlanPath "$d/wp4-redirect-plan.json"
        $out -join "`n" | Should -BeLike '*Nothing was changed*Update-MgApplication*'
    }
    It 'refuses -Apply without the approved hash' {
        { & $apply -PlanPath "$d/wp4-redirect-plan.json" -Apply } | Should -Throw '*AM-APPLY-01*'
    }
    It 'refuses -Apply when the plan changed after approval' {
        $h = Get-AmPlanHash -Path "$d/wp4-redirect-plan.json"
        Add-Content "$d/wp4-redirect-plan.json" ' '
        { & $apply -PlanPath "$d/wp4-redirect-plan.json" -ApprovedSha256 $h -Apply } | Should -Throw '*AM-APPLY-02*'
    }
    It 'quotes a value with an apostrophe in the printed command' {
        $p = Get-Content "$d/wp4-redirect-plan.json" -Raw | ConvertFrom-Json
        $p.after.web = @("https://cases.contoso.example/o'brien")
        $p | ConvertTo-Json -Depth 10 | Set-Content "$TestDrive/q.json"
        (Get-AmPlanCommand -PlanPath "$TestDrive/q.json").Text | Should -BeLike "*o''brien*"
    }
    It 'rolls back without re-adding a URI that failed ownership or dangles' {
        $r = New-AmRollbackPlan -SnapshotDir $d -CheckPath "$d/wp4-redirect-check.csv" -ChangeId C1 -OutDir $d
        $p = Read-AmJson -Path "$d/rollback-plan.json"
        @($p.restoreRedirectUris.web) | Should -Not -Contain 'https://cases.fabrikam.example/signin-oidc'
        @($p.restoreRedirectUris.web) | Should -Not -Contain 'https://cases-old.contoso.example/signin-oidc'
        @($p.restoreRedirectUris.web).Count | Should -Be 3
        $p.appRoleAssignmentRequired | Should -BeFalse
        $r.Commands | Should -Be 2
    }
}

Describe 'WP6 sign-ins and the sealed pack' {
    BeforeAll {
        $script:d = New-Pack
        Get-AmAppSnapshot -AppId $app -OutDir $d -Stage after -FixturePath $fx | Out-Null
    }
    It 'flags an error code that began with the change' {
        $r = Get-AmSignInCheck -AppId $app -ChangeTime '2026-11-18T14:00:00Z' -OutDir $d -FixturePath "$fx/signins.json"
        $r.Triggers | Should -Be '50105'
        $r.SignInsAfter | Should -Be 5
    }
    It 'does not flag a code the change was meant to produce' {
        (Get-AmSignInCheck -AppId $app -ChangeTime '2026-11-18T14:00:00Z' -OutDir $d -FixturePath "$fx/signins.json" -Explained 50105).Triggers | Should -Be ''
    }
    It 'does not flag a code that was already failing before the change' {
        $s = @(Get-Content "$fx/signins.json" -Raw | ConvertFrom-Json)
        $s += [pscustomobject]@{ createdDateTime = '2026-11-12T10:00:00Z'; appId = $app; errorCode = 50105; clientCredentialType = ''; principal = 'p' }
        ConvertTo-Json @($s) | Set-Content "$TestDrive/s.json"
        (Get-AmSignInCheck -AppId $app -ChangeTime '2026-11-18T14:00:00Z' -OutDir $d -FixturePath "$TestDrive/s.json").Triggers | Should -Be ''
    }
    It 'refuses to seal a pack without the test record' {
        { Protect-AmEvidencePack -OutDir $d } | Should -Throw '*AM-PACK-01*test-record.csv*'
    }
    It 'seals the pack and finds a changed file' {
        New-AmTestRecord -AppId $app -ChangeId C1 -WorkPackages WP4, WP5, WP6 -Expected e -Observed o -Tester t -Date 2026-11-19 -OutDir $d | Out-Null
        (Protect-AmEvidencePack -OutDir $d).Files | Should -Be 15
        @(Test-AmEvidencePack -OutDir $d | Where-Object State -ne 'ok').Count | Should -Be 0
        Add-Content "$d/test-record.csv" 'tampered'
        Set-Content "$d/extra.txt" 'x'
        $bad = Test-AmEvidencePack -OutDir $d | Where-Object State -ne 'ok'
        ($bad | Where-Object File -eq 'test-record.csv').State | Should -Be 'changed'
        ($bad | Where-Object File -eq 'extra.txt').State | Should -Be 'unlisted'
    }
}

Describe 'Evidence records' {
    It 'maps every step to at least one control and one KSI' {
        foreach ($r in Get-AmRequirement) {
            $r.Controls | Should -Not -BeNullOrEmpty -Because $r.Step
            $r.KSIs | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}' -Because $r.Step
        }
    }
    It 'names only controls the config defines' {
        $c = Read-AmJson -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'config/requirements.json')
        $known = $c.controls.PSObject.Properties.Name
        foreach ($s in $c.steps.PSObject.Properties) { foreach ($x in $s.Value.controls) { $known | Should -Contain $x } }
    }
    It 'refuses an unknown step and a missing file' {
        { Write-AmEvidenceRecord -Step NOPE -Path $PSCommandPath -OutputPath "$TestDrive/ev0" } | Should -Throw '*AM-EV-01*'
        { Write-AmEvidenceRecord -Step WP6 -Path "$TestDrive/none.txt" -OutputPath "$TestDrive/ev0" } | Should -Throw '*AM-EV-02*'
    }
    It 'chains records and finds a changed file' {
        Set-Content "$TestDrive/a.txt" 'a'; Set-Content "$TestDrive/b.txt" 'b'
        Push-Location $TestDrive
        try {
            Write-AmEvidenceRecord -Step CONTRACT -Path a.txt -OutputPath ev -AsOf 2026-11-24T00:00:00Z | Out-Null
            Write-AmEvidenceRecord -Step LOAD -Path b.txt -OutputPath ev -AsOf 2026-11-24T00:00:00Z | Out-Null
            $chain = Test-AmEvidenceChain -Path ev
            @($chain | Where-Object { $_.ChainOk -and $_.FilesOk }).Count | Should -Be 2
            (Read-AmJson -Path (Get-ChildItem ev -Filter 'record-002-*').FullName).previous | Should -Be (Get-AmSha256 -Path (Get-ChildItem ev -Filter 'record-001-*').FullName)
            Set-Content b.txt 'changed'
            (Test-AmEvidenceChain -Path ev | Where-Object Step -eq LOAD).FilesOk | Should -BeFalse
        } finally { Pop-Location }
    }
}

Describe 'Lab helpers' {
    It 'lists the five operations the contract documents' {
        $ops = Get-AmContractOperation -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'service/src/main/resources/static/openapi.yaml')
        $ops.OperationId | Should -Be @('listCases', 'getCase', 'triageCase', 'listProposals', 'decideProposal')
    }
    It 'reads Surefire results' {
        $dir = Join-Path $TestDrive 'sf'; New-Item -ItemType Directory $dir | Out-Null
        '<testsuite name="gov.example.X.FooTest" tests="3" failures="1" errors="0" skipped="0"/>' | Set-Content "$dir/TEST-gov.example.X.FooTest.xml"
        $r = Get-AmTestResult -Path $dir
        $r.Class | Should -Be 'FooTest'; $r.Tests | Should -Be 3; $r.Failures | Should -Be 1
    }
}
