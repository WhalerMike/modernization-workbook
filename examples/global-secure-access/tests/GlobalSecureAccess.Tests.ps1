#Requires -Version 7.1
# Pester 5. Run from examples/global-secure-access: Invoke-Pester -Path tests
BeforeAll {
    $script:Kit = Split-Path -Parent $PSScriptRoot
    Import-Module (Join-Path $Kit 'powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    $script:S = Read-GsaSettings -Path (Join-Path $Fx 'settings.lab.json')
    $script:S1 = Read-GsaSettings -Path (Join-Path $Fx 'settings.lab-ring1.json')
    $script:Pilot = Join-Path $TestDrive 'pilot'
    $script:Ring1 = Join-Path $TestDrive 'ring1'
    $null = Invoke-GsaCollection -Invoker (New-GsaFixtureInvoker -Path (Join-Path $Fx 'pilot')) -Settings $S -OutputPath $Pilot -AsOf 2026-11-16T12:00:00Z
    $null = Invoke-GsaCollection -Invoker (New-GsaFixtureInvoker -Path (Join-Path $Fx 'ring1')) -Settings $S1 -OutputPath $Ring1 -AsOf 2026-11-30T12:00:00Z
    $script:C = Read-GsaCollection -Path $Pilot
    $script:C1 = Read-GsaCollection -Path $Ring1
    $script:I = Read-GsaInputs -Path (Join-Path $Fx 'pilot/inputs')
    $script:I1 = Read-GsaInputs -Path (Join-Path $Fx 'ring1/inputs')
    function script:Ids($rows, $status) { @($rows | Where-Object Status -EQ $status | ForEach-Object Id) }
}

Describe 'Calls and availability' {
    It 'declares every call with a method, a permission and a Learn page' {
        foreach ($c in @(Get-GsaCall) + @(Get-GsaCall -Writes)) {
            $c.method | Should -Not -BeNullOrEmpty
            @($c.permissions).Count | Should -BeGreaterThan 0
            $c.doc | Should -Match '^https://learn\.microsoft\.com/'
        }
    }
    It 'reads only from graph.microsoft.com and management.azure.com, the endpoints GCC uses' {
        foreach ($c in Get-GsaCall | Where-Object { $_.uri -like 'https://*' }) { $c.uri | Should -Match '^https://(graph\.microsoft\.com|management\.azure\.com)/' }
    }
    It 'gives an unverified call its reason' {
        foreach ($c in Get-GsaCall | Where-Object { -not $_.verified }) { $c.unverified | Should -Not -BeNullOrEmpty }
    }
    It 'names Learn''s least-privileged permissions for the network access reads' {
        (Get-GsaCall -Id forwarding-profiles).permissions | Should -Be 'NetworkAccess.Read.All'
        (Get-GsaCall -Id tenant-status).permissions | Should -Be 'NetworkAccessPolicy.Read.All'
        (Get-GsaCall -Id device-usage).permissions | Should -Be 'NetworkAccessPolicy.Read.All'
        (Get-GsaCall -Id licenses).permissions | Should -Be 'LicenseAssignment.Read.All'
        (Get-GsaCall -Id connector-groups).permissions | Should -Be 'Directory.ReadWrite.All'
    }
    It 'gives every feature whose GCC availability is not yet specified an interim path' {
        foreach ($f in Get-GsaAvailability -NotAvailable) { $f.interim | Should -Not -BeNullOrEmpty }
        (Get-GsaAvailability | Where-Object id -EQ 'compliant-network').gcc | Should -Be 'available'
    }
    It 'knows only the gcc and global clouds, with the worldwide endpoints' {
        (Get-GsaCloud -Cloud gcc).Graph | Should -Be 'https://graph.microsoft.com'
        (Get-GsaCloud -Cloud gcc).GraphEnvironment | Should -Be 'Global'
        { Get-GsaCloud -Cloud usgov } | Should -Throw
        { Get-GsaCloud -Cloud GCC } | Should -Throw
    }
}

Describe 'Settings' {
    It 'refuses a secret-like value' {
        $p = Join-Path $TestDrive 'bad.json'
        (Get-Content -Raw (Join-Path $Fx 'settings.lab.json')).Replace('"changeRecord": "LAB-0001"', '"changeRecord": "LAB-0001", "clientSecret": "abc123"') | Set-Content $p
        { Read-GsaSettings -Path $p } | Should -Throw '*secret*'
    }
    It 'refuses a placeholder left in a test or production file' {
        $p = Join-Path $TestDrive 'ph.json'
        (Get-Content -Raw (Join-Path $Fx 'settings.test.json')).Replace('"CHG-0101"', '"<change-record>"') | Set-Content $p
        { Read-GsaSettings -Path $p } | Should -Throw '*placeholders*'
    }
    It 'reads the template only as the lab would fill it' {
        { Read-GsaSettings -Path (Join-Path $Kit 'deploy/settings.template.json') } | Should -Not -Throw
    }
}

Describe 'Collection' {
    It 'reads every declared call, connector members per group and every query' {
        $m = Read-GsaJson -Path (Join-Path $Pilot 'manifest.json')
        @($m.calls).Count | Should -Be @(Get-GsaCall).Count
        @($C['connector-group-members'].Keys).Count | Should -Be 2
        @($C['law-query'].Keys).Count | Should -Be 7
        @($C['law-query']['signin-share']).Count | Should -Be 7
    }
    It 'records the tenant, cloud, ring and a hash of every file' {
        $m = Read-GsaJson -Path (Join-Path $Pilot 'manifest.json')
        $m.tenantId | Should -Be $S.tenantId
        $m.cloud | Should -Be 'gcc'
        (Test-GsaRunFolder -Path $Pilot).Ok | Should -BeTrue
    }
    It 'refuses a collection that changed after its manifest' {
        $p = Join-Path $TestDrive 'tampered'
        Copy-Item -Recurse $Pilot $p
        Add-Content -Path (Join-Path $p 'raw/licenses.json') -Value ' '
        { Read-GsaCollection -Path $p } | Should -Throw '*manifest*'
    }
    It 'collects one area only' {
        $p = Join-Path $TestDrive 'one'
        $r = Invoke-GsaCollection -Invoker (New-GsaFixtureInvoker -Path (Join-Path $Fx 'pilot')) -Settings $S -OutputPath $p -AsOf 2026-11-16T12:00:00Z -Area decision
        @($r.Calls) | Should -Be @('licenses', 'tenant-status')
    }
    It 'refuses a write through Invoke-GsaCall' {
        { Invoke-GsaCall -Invoker (New-GsaFixtureInvoker -Path (Join-Path $Fx 'pilot')) -CallId signaling } | Should -Throw '*approved plan*'
    }
}

Describe 'Chapter 01: decision and licensing' {
    BeforeAll { $script:D = @(Test-GsaDecision -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z) }
    It 'passes the onboarded tenant and the four records' { Ids $D 'Pass' | Should -Contain 'GSA-DEC-01'; Ids $D 'Pass' | Should -Contain 'GSA-DEC-02' }
    It 'fails a stale availability quote, short licenses, a preview feature without an exception and a defer without compensating controls' {
        (Ids $D 'Fail' | Sort-Object) | Should -Be @('GSA-DEC-03', 'GSA-DEC-04', 'GSA-DEC-06', 'GSA-DEC-07')
    }
    It 'names the interim path for the preview feature' {
        ($D | Where-Object Id -EQ 'GSA-DEC-07').Fix | Should -Match 'Intune-delivered Windows Firewall rule'
    }
    It 'passes ring 1''s records' { Ids (Test-GsaDecision -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30T12:00:00Z) 'Fail' | Should -BeNullOrEmpty }
}

Describe 'Chapter 02: baseline and logging first' {
    It 'fails the setting that leaves a category out, and passes the architecture record' {
        $b = @(Test-GsaBaseline -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z)
        Ids $b 'Fail' | Should -Be @('GSA-LOG-01')
        ($b | Where-Object Id -EQ 'GSA-LOG-01').Detail | Should -Match 'RemoteNetworkHealthLogs'
    }
    It 'fails a connector group the architecture record doesn''t name' {
        $i = Read-GsaInputs -Path (Join-Path $Fx 'pilot/inputs')
        $i.architecture.connectorGroups = @($i.architecture.connectorGroups[0])
        Ids (Test-GsaBaseline -Collection $C -Inputs $i -Settings $S -AsOf 2026-11-16) 'Fail' | Should -Contain 'GSA-ARC-01'
    }
    It 'passes at ring 1' { Ids (Test-GsaBaseline -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30) 'Fail' | Should -BeNullOrEmpty }
}

Describe 'Chapter 03: the client' {
    BeforeAll { $script:K = @(Test-GsaClient -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z) }
    It 'computes coverage from the device usage summary and the in-scope count' { ($K | Where-Object Id -EQ 'GSA-CLI-01').Detail | Should -Match '15 active of 18' }
    It 'fails the old client, IPv6 preferred, DNS over HTTPS on and a disconnected device' {
        @($K | Where-Object Status -EQ 'Fail' | ForEach-Object { "$($_.Id) $($_.Object)" }) | Should -Be @('GSA-CLI-01 client coverage', 'GSA-CLI-02 device PC-PILOT-03', 'GSA-CLI-03 device PC-PILOT-03', 'GSA-CLI-04 device PC-PILOT-03', 'GSA-CLI-05 device PC-PILOT-04')
    }
    It 'reports hardening as information in the pilot and requires it from ring 2' {
        @($K | Where-Object Id -EQ 'GSA-CLI-06' | ForEach-Object Status | Sort-Object -Unique) | Should -Be 'Info'
        $s2 = Read-GsaSettings -Path (Join-Path $Fx 'settings.lab.json'); $s2.ring = 'ring2'
        @(Test-GsaClient -Collection $C -Inputs $I -Settings $s2 -AsOf 2026-11-16 | Where-Object { $_.Id -eq 'GSA-CLI-06' -and $_.Status -eq 'Fail' }).Count | Should -Be 3
    }
}

Describe 'Chapter 04: Microsoft traffic' {
    It 'fails the sign-in share under target and passes profiles with decisions' {
        $t = @(Test-GsaTraffic -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16)
        Ids $t 'Fail' | Should -Be @('GSA-MS-03')
        ($t | Where-Object Id -EQ 'GSA-MS-03').Detail | Should -Match '2555 of 2800'
    }
    It 'fails a profile enabled without an approved decision' {
        $i = Read-GsaInputs -Path (Join-Path $Fx 'pilot/inputs')
        $i.decisions = @($i.decisions | Where-Object { $_.function -ne 'internet' })
        Ids (Test-GsaTraffic -Collection $C -Inputs $i -Settings $S -AsOf 2026-11-16) 'Fail' | Should -Contain 'GSA-MS-04'
    }
}

Describe 'Chapter 05: compliant network and tenant restrictions' {
    It 'keeps the policy in report-only while the service carries failures' {
        $n = @(Test-GsaCompliantNetwork -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z)
        Ids $n 'Fail' | Should -BeNullOrEmpty
        ($n | Where-Object Id -EQ 'GSA-CN-06').Detail | Should -Match '3 failures carried by the service: not ready'
    }
    It 'fails a policy that doesn''t exclude the emergency group or the Intune applications' {
        $c = Read-GsaJson -Path (Join-Path $Pilot 'collection.json')
        $p = @($c['ca-policies'].value | Where-Object { $_.displayName -like 'NET-CN-*' })[0]
        $p.conditions.users.excludeGroups = @(); $p.conditions.applications.excludeApplications = @()
        (Ids (Test-GsaCompliantNetwork -Collection $c -Inputs $I -Settings $S -AsOf 2026-11-16) 'Fail' | Sort-Object) | Should -Be @('GSA-CN-03', 'GSA-CN-04')
    }
    It 'fails an enforced policy while signaling is off' {
        $c = Read-GsaJson -Path (Join-Path $Ring1 'collection.json'); $c['ca-signaling'].signalingStatus = 'disabled'
        Ids (Test-GsaCompliantNetwork -Collection $c -Inputs $I1 -Settings $S1 -AsOf 2026-11-30) 'Fail' | Should -Contain 'GSA-CN-07'
    }
    It 'fails a partner allowance missing from the register' {
        $t = @(Test-GsaTenantRestrictions -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16)
        @($t | Where-Object Status -EQ 'Fail' | ForEach-Object Object) | Should -Be @('partner 66666666-6666-4666-8666-666666666602')
    }
    It 'fails tagging that would enforce a default that doesn''t block' {
        $c = Read-GsaJson -Path (Join-Path $Pilot 'collection.json'); $c['trv2-default'].tenantRestrictions.usersAndGroups.accessType = 'allowed'
        (Ids (Test-GsaTenantRestrictions -Collection $c -Inputs $I -Settings $S -AsOf 2026-11-16) 'Fail' | Sort-Object -Unique) | Should -Be @('GSA-TR-01', 'GSA-TR-02', 'GSA-TR-03')
    }
}

Describe 'Chapter 06: private applications and administrative paths' {
    BeforeAll { $script:P = @(Test-GsaPrivateAccess -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16) }
    It 'fails a group with one active connector and an old connector' { @($P | Where-Object { $_.Status -eq 'Fail' -and $_.Object -eq 'connector group CG-Cloud-East' }).Count | Should -Be 2 }
    It 'fails the wide segment, the direct assignment and the missing emergency exclusion' {
        @($P | Where-Object { $_.Status -eq 'Fail' -and $_.Object -eq 'app PA-Finance' } | ForEach-Object Id) | Should -Be @('GSA-PA-04', 'GSA-PA-06', 'GSA-PA-07', 'GSA-PA-08')
    }
    It 'fails an RDP app without the phishing-resistant strength and passes it with one' {
        @($P | Where-Object { $_.Object -eq 'app PA-AdminRDP-Tier1' -and $_.Id -eq 'GSA-PA-08' }).Status | Should -Be 'Fail'
        @(Test-GsaPrivateAccess -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30 | Where-Object { $_.Object -eq 'app PA-AdminRDP-Tier1' -and $_.Id -eq 'GSA-PA-08' }).Status | Should -Be 'Pass'
    }
    It 'warns while Quick Access has segments, and passes ring 1' {
        ($P | Where-Object Id -EQ 'GSA-PA-03').Status | Should -Be 'Warn'
        Ids (Test-GsaPrivateAccess -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30) 'Fail' | Should -BeNullOrEmpty
    }
}

Describe 'Chapter 07: Internet Access and TLS inspection' {
    It 'fails an expired bypass and one without an approver' {
        @(Test-GsaInternetAccess -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16 | Where-Object Status -EQ 'Fail' | ForEach-Object Object) | Should -Be @('bypass EX-03 *.payroll-partner.example', 'bypass EX-04 updates.vendor.example')
    }
    It 'requires the interim QUIC block while the cloud firewall for clients is not specified for GCC' {
        $i = Read-GsaInputs -Path (Join-Path $Fx 'pilot/inputs'); $i.architecture.Remove('quicBlock')
        $f = @(Test-GsaInternetAccess -Collection $C -Inputs $i -Settings $S -AsOf 2026-11-16 | Where-Object Id -EQ 'GSA-IA-05')
        $f.Status | Should -Be 'Fail'
        $f.Fix | Should -Match 'UDP 443'
    }
    It 'fails a missing high-risk category' {
        $s = Read-GsaSettings -Path (Join-Path $Fx 'settings.lab.json'); $s.highRiskCategories = @('ArtificialIntelligence', 'CriminalActivity')
        (Test-GsaInternetAccess -Collection $C -Inputs $I -Settings $s -AsOf 2026-11-16 | Where-Object Id -EQ 'GSA-IA-02').Detail | Should -Match 'CriminalActivity'
    }
    It 'fails a certificate near expiry, an expired bypass and a failure share over 1%' {
        (Ids (Test-GsaTls -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16) 'Fail' | Sort-Object) | Should -Be @('GSA-TLS-01', 'GSA-TLS-05', 'GSA-TLS-06')
    }
    It 'fails a certificate from an authentication CA and a link to the baseline profile before ring 3' {
        $i = Read-GsaInputs -Path (Join-Path $Fx 'ring1/inputs')
        $i.tls.certificate.issuer = 'Contoso Issuing CA 01'; $i.tls.policies[0].linkedProfiles = @('Baseline profile')
        (Ids (Test-GsaTls -Collection $C1 -Inputs $i -Settings $S1 -AsOf 2026-11-30) 'Fail' | Sort-Object) | Should -Be @('GSA-TLS-02', 'GSA-TLS-03')
    }
    It 'passes ring 1' { Ids (Test-GsaTls -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30) 'Fail' | Should -BeNullOrEmpty }
}

Describe 'Chapter 08: telemetry, metrics and ring exit' {
    It 'warns about tables with no rows and the CISA telemetry agreement' {
        $t = @(Test-GsaTelemetry -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z)
        @($t | Where-Object Status -EQ 'Warn' | ForEach-Object Object) | Should -Be @('table RemoteNetworkHealthLogs', 'table NetworkAccessAlerts', 'CISA telemetry')
    }
    It 'computes the eight metrics, none met at the pilot and all met at ring 1' {
        $m = @(Get-GsaMetrics -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z)
        $m.Count | Should -Be 8
        @($m | Where-Object Met).Count | Should -Be 0
        @(Get-GsaMetrics -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30T12:00:00Z | Where-Object { -not $_.Met }).Count | Should -Be 0
    }
    It 'says no-go for the pilot, naming each failed criterion, and go for ring 1' {
        @(Test-GsaRingExit -Collection $C -Inputs $I -Settings $S -AsOf 2026-11-16T12:00:00Z | Where-Object Status -EQ 'Fail' | ForEach-Object { $_.Criterion.Substring(0, 5) }) | Should -Be @('RX-01', 'RX-02', 'RX-04', 'RX-05', 'RX-06')
        @(Test-GsaRingExit -Collection $C1 -Inputs $I1 -Settings $S1 -AsOf 2026-11-30T12:00:00Z | Where-Object Status -EQ 'Fail').Count | Should -Be 0
    }
    It 'counts business days, not calendar days' { Get-GsaBusinessDays -From 2026-11-16 -To 2026-11-30 | Should -Be 10 }
}

Describe 'Plans' {
    It 'plans the pilot: the internet profile off and the administrative policy brought back to its reviewed file' {
        $f = New-GsaPlan -CollectionPath $Pilot -DesiredPath (Join-Path $Kit 'config/desired.lab.json') -Settings $S -OutputPath (Join-Path $TestDrive 'plan') -AsOf 2026-11-16
        $p = Read-GsaJson -Path $f.FullName
        @($p.steps | ForEach-Object call) | Should -Be @('profile-state', 'ca-update')
        $p.steps[1].body.grantControls.authenticationStrength.id | Should -Be '00000000-0000-0000-0000-000000000004'
        @($p.manual | Where-Object { $_.id -eq 'MAN-ASSIGN' }).Count | Should -Be 2
    }
    It 'won''t enforce a report-only policy without -AllowEnforce' {
        $d = Join-Path $Kit 'config/desired.ring1.json'
        $a = Read-GsaJson -Path (New-GsaPlan -CollectionPath $Pilot -DesiredPath $d -Settings $S -OutputPath (Join-Path $TestDrive 'p1') -AsOf 2026-11-16).FullName
        @($a.manual | Where-Object id -EQ 'MAN-ENF').Count | Should -Be 1
        $b = Read-GsaJson -Path (New-GsaPlan -CollectionPath $Pilot -DesiredPath $d -Settings $S -OutputPath (Join-Path $TestDrive 'p2') -AsOf 2026-11-16 -AllowEnforce).FullName
        @($b.steps | Where-Object { $_.body.Contains('state') -and $_.body.state -eq 'enabled' }).Count | Should -Be 1
    }
    It 'creates a missing policy in report-only' {
        $c = Join-Path $TestDrive 'nocn'
        Copy-Item -Recurse $Pilot $c
        $j = Read-GsaJson -Path (Join-Path $c 'collection.json'); $j['ca-policies'].value = @($j['ca-policies'].value | Where-Object { $_.displayName -notlike 'NET-CN-*' })
        Write-GsaJson -Path (Join-Path $c 'collection.json') -Value $j
        $null = Write-GsaManifest -OutputPath $c -Task collect -AsOf 2026-11-16 -Settings $S
        $p = Read-GsaJson -Path (New-GsaPlan -CollectionPath $c -DesiredPath (Join-Path $Kit 'config/desired.ring1.json') -Settings $S -OutputPath (Join-Path $TestDrive 'p3') -AsOf 2026-11-16).FullName
        $cr = @($p.steps | Where-Object call -EQ 'ca-create')[0]
        $cr.body.state | Should -Be 'enabledForReportingButNotEnforced'
        $cr.body.conditions.locations.excludeLocations | Should -Be '44444444-4444-4444-8444-444444444401'
    }
    It 'refuses a policy file that doesn''t exclude the emergency group' {
        $dir = Join-Path $TestDrive 'desired'; New-Item -ItemType Directory -Force (Join-Path $dir 'policies') | Out-Null
        (Get-Content -Raw (Join-Path $Kit 'config/policies/NET-PA-PA-HR-Portal-Device-MFA.json')).Replace('"excludeGroups": [ "<emergency-group-id>" ]', '"excludeGroups": [ ]') | Set-Content (Join-Path $dir 'policies/x.json')
        '{ "ring": "pilot", "forwardingProfiles": {}, "conditionalAccess": ["policies/x.json"] }' | Set-Content (Join-Path $dir 'd.json')
        { New-GsaPlan -CollectionPath $Pilot -DesiredPath (Join-Path $dir 'd.json') -Settings $S -OutputPath (Join-Path $TestDrive 'p4') -AsOf 2026-11-16 } | Should -Throw '*emergency*'
    }
    It 'lists steps without -Apply, and refuses -Apply in fixture mode or with another hash' {
        $f = New-GsaPlan -CollectionPath $Pilot -DesiredPath (Join-Path $Kit 'config/desired.lab.json') -Settings $S -OutputPath (Join-Path $TestDrive 'p5') -AsOf 2026-11-16
        @(Invoke-GsaPlanSteps -PlanPath $f.FullName | Where-Object Status -EQ 'WouldApply').Count | Should -Be 2
        { Invoke-GsaPlanSteps -PlanPath $f.FullName -Invoker (New-GsaFixtureInvoker -Path (Join-Path $Fx 'pilot')) -Apply -ApprovedSha256 (Get-GsaFileHash $f.FullName) } | Should -Throw '*live invoker*'
        { Invoke-GsaPlanSteps -PlanPath $f.FullName -Invoker (New-GsaLiveInvoker -Settings $S) -Apply -ApprovedSha256 ('0' * 64) } | Should -Throw '*approved SHA-256*'
    }
    It 'applies the approved plan through the Graph runner, in order' {
        $f = New-GsaPlan -CollectionPath $Pilot -DesiredPath (Join-Path $Kit 'config/desired.lab.json') -Settings $S -OutputPath (Join-Path $TestDrive 'p6') -AsOf 2026-11-16
        $script:sent = [Collections.Generic.List[string]]::new()
        $old = Set-GsaRunner -Graph { param($Method, $Uri, $Body) $script:sent.Add("$Method $Uri"); @{} } -GraphContext { @{ Environment = 'Global'; TenantId = '11111111-1111-4111-8111-111111111111'; AuthType = 'Delegated' } }
        try {
            $r = @(Invoke-GsaPlanSteps -PlanPath $f.FullName -Invoker (New-GsaLiveInvoker -Settings $S) -Apply -ApprovedSha256 (Get-GsaFileHash $f.FullName))
            @($r | Where-Object Status -EQ 'Applied').Count | Should -Be 2
            $script:sent[0] | Should -Match '^PATCH https://graph\.microsoft\.com/beta/networkAccess/forwardingProfiles/'
        } finally { $null = Set-GsaRunner -Graph $old.Graph -GraphContext $old.GraphContext }
    }
    It 'rolls back in the guide''s order and keeps signaling while a compliant network policy is on' {
        $p = Read-GsaJson -Path (New-GsaRollbackPlan -CollectionPath $Ring1 -Settings $S1 -OutputPath (Join-Path $TestDrive 'rb') -AsOf 2026-11-30).FullName
        @($p.steps | ForEach-Object { $_.why.Substring(0, 6) }) | Should -Be @('Step 7', 'Step 6', 'Step 5', 'Step 8')
        @($p.steps | Where-Object call -EQ 'signaling').Count | Should -Be 0
        $q = Read-GsaJson -Path (New-GsaRollbackPlan -CollectionPath $Ring1 -Settings $S1 -OutputPath (Join-Path $TestDrive 'rb2') -AsOf 2026-11-30 -DisableSignaling).FullName
        $q.steps[-1].call | Should -Be 'signaling'
    }
}

Describe 'Live mode' {
    AfterEach { if ($script:oldR) { $null = Set-GsaRunner -Graph $script:oldR.Graph -GraphContext $script:oldR.GraphContext -Native $script:oldR.Native } }
    It 'refuses no session, another tenant, and an app-only session' {
        $script:oldR = Set-GsaRunner -GraphContext { $null }
        { Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S) -CallId licenses } | Should -Throw '*No Microsoft Graph session*'
        $null = Set-GsaRunner -GraphContext { @{ Environment = 'Global'; TenantId = '99999999-9999-4999-8999-999999999999'; AuthType = 'Delegated' } }
        { Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S) -CallId licenses } | Should -Throw '*not 11111111*'
        $null = Set-GsaRunner -GraphContext { @{ Environment = 'Global'; TenantId = '11111111-1111-4111-8111-111111111111'; AuthType = 'AppOnly' } }
        { Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S) -CallId licenses } | Should -Throw '*interactively*'
    }
    It 'refuses an unverified call unless -AllowUnverified' {
        $script:oldR = Set-GsaRunner -GraphContext { @{ Environment = 'Global'; TenantId = '11111111-1111-4111-8111-111111111111'; AuthType = 'Delegated' } } -Graph { param($m, $u, $b) @{ value = @() } }
        { Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S) -CallId trv2-partners } | Should -Throw '*AllowUnverified*'
        { Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S -AllowUnverified) -CallId trv2-partners } | Should -Not -Throw
    }
    It 'follows @odata.nextLink' {
        $script:oldR = Set-GsaRunner -GraphContext { @{ Environment = 'Global'; TenantId = '11111111-1111-4111-8111-111111111111'; AuthType = 'Delegated' } } -Graph {
            param($m, $u, $b) if ($u -like '*skip*') { @{ value = @(@{ id = 2 }) } } else { @{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://graph.microsoft.com/v1.0/subscribedSkus?skip=1' } } }
        @((Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S) -CallId licenses).value).Count | Should -Be 2
    }
    It 'runs the guide''s query through az monitor log-analytics query with the workspace GUID' {
        $script:args = $null
        $script:oldR = Set-GsaRunner -Native { param($Tool, $Arguments) $script:args = $Arguments; @{ ExitCode = 0; Output = '[{"Table":"NetworkAccessTraffic","Rows":1}]' } }
        $r = Invoke-GsaCall -Invoker (New-GsaLiveInvoker -Settings $S) -CallId law-query -Arguments @{ query = 'freshness' }
        @($r).Count | Should -Be 1
        $script:args[0..3] -join ' ' | Should -Be 'monitor log-analytics query --workspace'
        $script:args[4] | Should -Be $S.workspace.guid
    }
}

Describe 'Evidence' {
    BeforeAll {
        $script:E = Join-Path $TestDrive 'evidence'
        $script:chk = Join-Path $TestDrive 'chk'
        $null = Invoke-GsaChecks -Area tls -CollectionPath $Pilot -InputsPath (Join-Path $Fx 'pilot/inputs') -Settings $S -OutputPath $chk -AsOf 2026-11-16
        $script:r1 = Write-GsaEvidence -EvidencePath $E -RunPath $Pilot -AsOf 2026-11-16T12:01:00Z
        $script:r2 = Write-GsaEvidence -EvidencePath $E -RunPath $chk -AsOf 2026-11-16T12:02:00Z
    }
    It 'tags each record with the guide''s controls and KSIs for the step' {
        $r1.Steps | Should -Be @('BASELINE', 'EVIDENCE')
        $r2.Controls | Should -Contain 'SC-17'
        $r2.Ksis | Should -Contain 'KSI-SVC-SIN'
    }
    It 'records a check with failing findings as Findings, not Pass' { $r2.Result | Should -Be 'Findings' }
    It 'chains the records and lists every file in SHA256SUMS' {
        @(Test-GsaEvidence -EvidencePath $E | Where-Object Status -EQ 'Fail').Count | Should -Be 0
        (Read-GsaJson -Path $r2.Record).previousRecordSha256 | Should -Be (Get-GsaFileHash $r1.Record)
    }
    It 'notices a changed file and a broken chain' {
        $e2 = Join-Path $TestDrive 'ev2'; Copy-Item -Recurse $E $e2
        Add-Content -Path (Get-ChildItem (Join-Path $e2 'runs') -Recurse -Filter findings.csv)[0].FullName -Value 'x'
        @(Test-GsaEvidence -EvidencePath $e2 | Where-Object Status -EQ 'Fail' | ForEach-Object Check) | Should -Be @('SUMS', 'CHAIN')
    }
    It 'says which steps a stage still lacks' {
        @(Test-GsaEvidence -EvidencePath $E -Stage test | Where-Object Status -EQ 'Fail' | ForEach-Object Check) | Should -Be @('STEP-PRE', 'STEP-PLAN', 'STEP-SMOKE', 'STEP-RB')
    }
    It 'never says a record satisfies a control' { (Get-Content -Raw $r1.Record) | Should -Not -Match 'satisf(y|ies) the' }
}
