# The G5 evidence packet on two fictional estates: a Kerberos island with leftovers, and a full retirement.
# Runs in Windows PowerShell 5.1 and PowerShell 7.
BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/AdRetirementEvidence/AdRetirementEvidence.psm1') -Force
    $script:Fx = Join-Path $script:Kit 'tests/fixtures'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("g5-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $script:Tmp | Out-Null
    $script:AsOf = [datetime]'2026-11-27T12:00:00Z'
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'A Kerberos island with leftovers' {
    BeforeAll {
        $script:Out = Join-Path $script:Tmp 'island'
        $script:R = New-AreEvidencePacket -Domain corp.contoso.example -FixturePath (Join-Path $script:Fx 'island') -OutputPath $script:Out -AsOf $script:AsOf
        $script:F = @(Get-Content (Join-Path $script:Out 'findings.json') -Raw | ConvertFrom-Json)
        function Get-Rule($r) { @($script:F | Where-Object { $_.Rule -eq $r }) }
    }
    It 'is not ready: seven findings and one warning' {
        $script:R.Ready | Should -BeFalse
        $script:R.Findings | Should -Be 7
        $script:R.Warnings | Should -Be 1
    }
    It 'AD-G5-01: a domain controller not in the island register' { (Get-Rule 'AD-G5-01').Object | Should -Be 'DC02' }
    It 'AD-G5-03: NTDS Settings left for a removed domain controller' { (Get-Rule 'AD-G5-03').Object | Should -Be 'DC03' }
    It 'AD-G5-04: a DC locator record still pointing at the removed one' { (Get-Rule 'AD-G5-04').Object | Should -Be 'DC03.corp.contoso.example' }
    It 'AD-G5-05: a trust the register does not list' { (Get-Rule 'AD-G5-05').Object | Should -Be 'partner.fabrikam.example' }
    It 'AD-G5-06: an SPN outside the island, and none for the listed workload or a domain controller' {
        @(Get-Rule 'AD-G5-06').Count | Should -Be 1
        (Get-Rule 'AD-G5-06').Object | Should -Match 'svc-reports'
    }
    It 'AD-G5-07: authentication from accounts outside the island, summed per account' {
        @(Get-Rule 'AD-G5-07').Object | Sort-Object | Should -Be @('jlee', 'svc-reports')
        (Get-Rule 'AD-G5-07' | Where-Object { $_.Object -eq 'svc-reports' }).Issue | Should -Match '^96 '
    }
    It 'AD-G5-08: a computer that signed in during the window, but not one that has been silent' {
        (Get-Rule 'AD-G5-08').Object | Should -Be 'FIN-PC-0442'
    }
    It 'the manifest hashes every file, the register, and carries the controls and KSIs' {
        $m = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json
        @($m.files).Count | Should -Be 9
        foreach ($f in $m.files) { $f.sha256 | Should -Be (Get-AreSha256 (Join-Path $script:Out $f.path)) }
        $m.register.sha256 | Should -Match '^[0-9a-f]{64}$'
        $m.ksis | Should -Contain 'KSI-PIY-GIV'
        $m.ready | Should -BeFalse
    }
    It 'AD-G5-02: an island past its end of life' {
        $reg = Get-Content (Join-Path $script:Kit 'config/island-register.json') -Raw | ConvertFrom-Json
        $reg.endOfLife = '2026-01-01'
        $p = Join-Path $script:Tmp 'expired.json'; $reg | ConvertTo-Json -Depth 5 | Set-Content -Path $p -Encoding UTF8
        $e = Get-AreEstate -Domain corp.contoso.example -FixturePath (Join-Path $script:Fx 'island')
        @(Test-AreG5 -Estate $e -Register (Get-AreIslandRegister -Path $p) -AsOf $script:AsOf | Where-Object { $_.Rule -eq 'AD-G5-02' }).Count | Should -Be 1
    }
}

Describe 'A full retirement' {
    It 'with no domain controller, no SRV record and no authentication, the packet is ready' {
        $fx = Join-Path $script:Fx 'retired'
        $r = New-AreEvidencePacket -Domain corp.contoso.example -FixturePath $fx -RegisterPath (Join-Path $fx 'island-register.json') -OutputPath (Join-Path $script:Tmp 'retired') -AsOf $script:AsOf
        $r.Ready | Should -BeTrue
        $r.Findings | Should -Be 0
        Get-Content (Join-Path $script:Tmp 'retired/summary.md') -Raw | Should -Match 'Mode: Full retirement'
    }
}

Describe 'Read only' {
    It 'the module calls no cmdlet that changes Active Directory, DNS or the workspace' {
        $src = Get-Content (Join-Path $script:Kit 'powershell/AdRetirementEvidence/AdRetirementEvidence.psm1') -Raw
        $src | Should -Not -Match '\b(Set|New|Remove|Add|Move|Rename|Uninstall|Disable|Enable)-AD'
        $src | Should -Not -Match '\b(Add|Remove|Set)-Dns'
    }
    It 'every cmdlet it reads with is declared in config/calls.json' {
        $calls = (Get-Content (Join-Path $script:Kit 'config/calls.json') -Raw | ConvertFrom-Json).calls.cmdlet -join ' '
        foreach ($c in 'Get-ADDomainController', 'Get-ADTrust', 'Get-ADComputer', 'Get-ADObject', 'Resolve-DnsName') { $calls | Should -Match $c }
    }
}
