#Requires -Version 7.1
# The decommission plan on a fictional application replaced by a shared service, at three points in its retirement.
BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/AppRetirement/AppRetirement.psm1') -Force
    $script:Fp = Join-Path $script:Kit 'tests/fixtures/footprint.json'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("art-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force $script:Tmp | Out-Null
    function Get-Fp { Get-ArtFootprint -Path $script:Fp }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'After the removal date' {
    BeforeAll {
        $script:Out = Join-Path $script:Tmp 'after'
        $script:R = New-ArtDecommissionPlan -FootprintPath $script:Fp -OutputPath $script:Out -AsOf '2026-12-10'
        $script:F = @(Get-Content (Join-Path $script:Out 'findings.json') -Raw | ConvertFrom-Json)
    }
    It 'R1, R3 and R4 are met; R2 and R5 are blocked; R6 is pending' {
        $p = Get-Content (Join-Path $script:Out 'plan.json') -Raw | ConvertFrom-Json
        $p.gates.R1 | Should -Be 'met'; $p.gates.R3 | Should -Be 'met'; $p.gates.R4 | Should -Be 'met'
        $p.gates.R2 | Should -Be 'blocked'; $p.gates.R5 | Should -Be 'blocked'; $p.gates.R6 | Should -Be 'pending'
    }
    It 'ART-03: a dependent still calling after the quiet date' { ($script:F | Where-Object Rule -eq 'ART-03').Object | Should -Be 'Payments Gateway (fictional)' }
    It 'ART-07: six items left past the removal date' { @($script:F | Where-Object Rule -eq 'ART-07').Count | Should -Be 6 }
    It 'ART-06: a firewall rule removed during the reversible window is a warning' {
        ($script:F | Where-Object Rule -eq 'ART-06').Object | Should -Match 'FW-2291'
        $script:R.Warnings | Should -Be 1
    }
    It 'the plan carries the commands for the owning teams, from Learn''s syntax' {
        $md = Get-Content (Join-Path $script:Out 'plan.md') -Raw
        $md | Should -Match 'Update-MgServicePrincipal -ServicePrincipalId \$sp.Id -AccountEnabled:\$false'
        $md | Should -Match 'Remove-DnsServerResourceRecord -ComputerName DNS01 -ZoneName "corp.contoso.example" -RRType "A" -Name "grants" -RecordData "10.40.2.17"'
        $md | Should -Match "Disable-ADAccount -Identity 'gmsa-grantsjob\$'"
        $md | Should -Not -Match "Disable-ADAccount -Identity 'svc-grants'"
    }
    It 'the manifest hashes the plan and the footprint, with the controls and KSIs' {
        $m = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json
        foreach ($f in $m.files) { $f.sha256 | Should -Be (Get-ArtSha256 (Join-Path $script:Out $f.path)) }
        $m.footprint.sha256 | Should -Be (Get-ArtSha256 $script:Fp)
        $m.controls | Should -Contain 'CM-8'
        $m.controls | Should -Contain 'CM-3'
        $m.controls | Should -Contain 'AC-2(3)'
        $m.ksis | Should -Contain 'KSI-CMT-LMC'
    }
    It 'a date with no time zone is the manifest''s UTC date, on any machine' {
        Get-Content (Join-Path $script:Out 'manifest.json') -Raw | Should -Match '"asOfUtc": "2026-12-10T00:00:00Z"'
    }
}

Describe 'A relative output path' {
    It 'is written under PowerShell''s current location, after Set-Location' {
        Push-Location $script:Tmp
        try { New-ArtDecommissionPlan -FootprintPath $script:Fp -OutputPath 'rel/plan' -AsOf '2026-12-10' | Out-Null }
        finally { Pop-Location }
        foreach ($n in 'plan.md', 'plan.json', 'findings.json', 'manifest.json') { Join-Path $script:Tmp "rel/plan/$n" | Should -Exist }
    }
}

Describe 'Before the switch-off' {
    It 'R4 and R5 are pending, and nothing is overdue yet' {
        $t = Test-ArtRetirement -Footprint (Get-Fp) -AsOf '2026-10-30'
        $t.Gates.R4 | Should -Be 'pending'; $t.Gates.R5 | Should -Be 'pending'
        @($t.Findings | Where-Object Rule -eq 'ART-07').Count | Should -Be 0
    }
}

Describe 'The other checks' {
    It 'ART-01: a replace with no replacement named' {
        $fp = Get-Fp; $fp.application.replacement = $null
        (Test-ArtRetirement -Footprint $fp -AsOf '2026-12-10').Findings.Rule | Should -Contain 'ART-01'
    }
    It 'ART-02: records not confirmed by the records officer' {
        $fp = Get-Fp; $fp.records.officerSignoff = $null
        (Test-ArtRetirement -Footprint $fp -AsOf '2026-12-10').Findings.Rule | Should -Contain 'ART-02'
    }
    It 'ART-04: a sign-in after the quiet date' {
        $fp = Get-Fp; $fp.entraApps[0].lastSignIn = '2026-10-25T09:00:00Z'
        (Test-ArtRetirement -Footprint $fp -AsOf '2026-12-10').Findings.Rule | Should -Contain 'ART-04'
    }
    It 'ART-05: sign-in still enabled after the switch-off date' {
        $fp = Get-Fp; $fp.entraApps[0].accountEnabled = $true
        (Test-ArtRetirement -Footprint $fp -AsOf '2026-12-10').Findings.Rule | Should -Contain 'ART-05'
    }
    It 'R6 is ready only when every other gate is met' {
        $fp = Get-Fp
        $fp.dependents = @(); foreach ($k in 'dns', 'firewallRules', 'monitoring') { foreach ($i in $fp[$k]) { $i.removedOn = '2026-12-05' } }
        foreach ($i in $fp.certificates) { $i.revokedOn = '2026-12-05' }; foreach ($i in $fp.licenses) { $i.releasedOn = '2026-12-05' }
        foreach ($i in $fp.accounts) { $i.disabledOn = '2026-11-03'; $i.deletedOn = '2026-12-05' }
        (Test-ArtRetirement -Footprint $fp -AsOf '2026-12-10').Gates.R6 | Should -Be 'ready'
    }
}

Describe 'Read only' {
    It 'the module runs no command that changes Entra ID, DNS or Active Directory' {
        $src = Get-Content (Join-Path $script:Kit 'powershell/AppRetirement/AppRetirement.psm1') -Raw
        $src | Should -Not -Match "Invoke-MgGraphRequest -Method (PATCH|POST|DELETE|PUT)"
        # The removal cmdlets appear only inside the strings the plan prints.
        ($src -split "`n" | Where-Object { $_ -match '^\s*(Update-Mg|Remove-Mg|Remove-Dns|Disable-AD)' }).Count | Should -Be 0
    }
}
