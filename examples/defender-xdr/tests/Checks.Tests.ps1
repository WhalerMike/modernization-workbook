#Requires -Version 7.1
# Pester 5: the gate checks (Chapters 01 to 07) against the fictional contoso.example fixtures.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/DefenderXdr/DefenderXdr.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:S = Read-XdrSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    $script:Graph = Join-Path $Kit 'tests/fixtures/graph'
    $script:AsOf = '2026-11-16T12:00:00Z'
    function script:Inv { New-XdrFixtureInvoker -Path $Graph }
    function script:Out([string]$n) { Join-Path $TestDrive $n }
}

Describe 'Chapter 01: access and the read path' {
    BeforeAll { $script:A = Invoke-XdrAccessCheck -Settings $S -Invoker (Inv) -OutputPath (Out access) -AsOf $AsOf }
    It 'reads incidents with no permission error' { @($A.Rows | Where-Object Id -EQ 'READ')[0].Status | Should -Be 'Pass' }
    It 'finds the extra permission on the detection-engineer role' {
        $r = @($A.Rows | Where-Object { $_.Id -eq 'ROLE' -and $_.Subject -eq 'XDR Detection Engineer' })[0]
        $r.Status | Should -Be 'Fail'; $r.Detail | Should -Match 'extra: Advanced live response'
    }
    It 'lets only the Tier 0 role hold Advanced live response' { @($A.Rows | Where-Object Id -EQ 'RESTRICTED')[0].Status | Should -Be 'Fail' }
    It 'finds a standing assignment to a group PIM does not govern' {
        $r = @($A.Rows | Where-Object { $_.Id -eq 'PIM' -and $_.Subject -eq 'XDR Responder' })[0]
        $r.Status | Should -Be 'Fail'; $r.Detail | Should -Match 'SG-SOC-Standing'
    }
    It 'warns on a role that is not in the design' { @($A.Rows | Where-Object { $_.Subject -eq 'Legacy SOC role' -and $_.Id -eq 'ROLE' })[0].Status | Should -Be 'Warn' }
    It 'fails when an emergency access group holds a Defender role' {
        $e = @(Read-XdrRoleExport -Path $S.inputs.roleExport)
        $e[0].Groups += 'SG-EmergencyAccess'
        @(Test-XdrRoleDesign -Export $e -Settings $S | Where-Object Id -EQ 'EMERGENCY')[0].Status | Should -Be 'Fail'
    }
    It 'counts three failures, and writes the permissions list' {
        $A.Failed | Should -Be 3
        (Import-Csv (Join-Path (Out access) 'permissions.csv')).Count | Should -Be 5
    }
    It 'reports a failed read instead of stopping' {
        $bad = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[string]]::new(); Script = { throw 'Forbidden: missing role' } }
        $r = Invoke-XdrAccessCheck -Settings $S -Invoker $bad -OutputPath (Out access2) -AsOf $AsOf
        @($r.Rows | Where-Object Id -EQ 'READ')[0].Status | Should -Be 'Fail'
    }
}

Describe 'Chapter 02: coverage and sensor health' {
    BeforeAll { $script:C = Invoke-XdrCoverageCheck -Settings $S -Invoker (Inv) -OutputPath (Out coverage) -AsOf $AsOf }
    It 'counts 9 of 14 in-scope devices protected' {
        $C.Summary.inScope | Should -Be 14; $C.Summary.protected | Should -Be 9; $C.Summary.protectedCoveragePercent | Should -Be 64.3
    }
    It 'classifies each fault' {
        $st = @{}; foreach ($r in $C.Rows) { $st[$r.DeviceName] = $r.Status }
        $st['WKS-R2-03'] | Should -Be 'NotActive'
        $st['WKS-R1-03'] | Should -Be 'NotActive'
        $st['WKS-R3-02'] | Should -Be 'NotOnboarded'
        $st['LAB-KIOSK01'] | Should -Be 'Excepted'
        $st['SRV-LEGACY01'] | Should -Be 'ExceptionExpired'
        $st['WKS-OLD-07'] | Should -Be 'NotInInventory'
        $st['WKS-TEST-99'] | Should -Be 'OutOfScope'
    }
    It 'raises a ticket for every device not protected and not excepted' { $C.Summary.tickets | Should -Be 5 }
    It 'matches Defender''s FQDN to the inventory''s short name' { @($C.Rows | Where-Object DeviceName -EQ 'WKS-R0-01')[0].Status | Should -Be 'Protected' }
    It 'flags a value it has never seen, without counting the device protected' {
        $inv = Read-XdrInventory -Path $S.inputs.inventory
        $rows = Get-XdrCoverage -Devices @(@{ DeviceName = 'wks-r0-01.contoso.example'; OnboardingStatus = 'Onboarded'; SensorHealthState = 'Partially active' }) -Inventory $inv -Exceptions @()
        $r = @($rows | Where-Object DeviceName -EQ 'WKS-R0-01')[0]
        $r.Status | Should -Be 'NotActive'; $r.Note | Should -Match 'unrecognized SensorHealthState'
    }
    It 'files the guide''s summary query beside the per-device one' { Test-Path (Join-Path (Out coverage) 'raw/coverage-summary.json') | Should -BeTrue }
}

Describe 'Device state' {
    It 'reads the device through the replaceable reader and stamps the time' {
        $old = Set-XdrDeviceReader -Reader { @{ deviceName = 'WKS-T-01'; preference = @{ EnableNetworkProtection = 1 } } }
        try { $st = Get-XdrDeviceState; $st.deviceName | Should -Be 'WKS-T-01'; $st.collectedAt | Should -Match '^\d{4}-\d\d-\d\dT' }
        finally { $null = Set-XdrDeviceReader -Reader $old }
    }
    It 'keys device states by short name' { (Read-XdrDeviceStates -Path $S.inputs.deviceStates).Keys | Should -Contain 'SRV-FILE01' }
}

Describe 'Chapter 03: prevention' {
    BeforeAll { $script:P = Invoke-XdrPreventionCheck -Settings $S -Invoker (Inv) -OutputPath (Out prevention) -AsOf $AsOf }
    It 'finds the three drifts' {
        $P.Summary.drift | Should -Be 3
        @($P.Drift | ForEach-Object { "$($_.DeviceName)/$($_.Check)" }) | Should -Be @('WKS-R1-02/TamperProtection', 'WKS-R2-01/NetworkProtection', 'SRV-FILE01/DatagramProcessing (file role)')
    }
    It 'names devices with no state file' { @($P.Summary.noStateFile) | Should -Be @('WKS-R3-02', 'LAB-KIOSK01', 'SRV-LEGACY01') }
    It 'sums the blocked and audited events' { $P.Summary.blocked | Should -Be 4; $P.Summary.audited | Should -Be 19; $P.Summary.tamperingAttempts | Should -Be 1 }
    It 'checks network protection on servers only on servers' {
        @($P.Rows | Where-Object { $_.Check -eq 'NetworkProtectionOnServer' } | ForEach-Object DeviceName | Sort-Object) | Should -Be @('SRV-APP01', 'SRV-FILE01')
    }
    It 'refuses a ring the plan has no stage for' {
        $st = (Read-XdrDeviceStates -Path $S.inputs.deviceStates)['WKS-R0-01']
        { Get-XdrPreventionFinding -State $st -Device ([pscustomobject]@{ Ring = 'ring9'; Kind = 'workstation'; Role = '' }) -Plan @{ rings = @{} } } | Should -Throw '*no stage for ring9*'
    }
}

Describe 'Chapter 04: Attack Surface Reduction' {
    BeforeAll {
        $script:R = Invoke-XdrAsrCheck -Settings $S -Invoker (Inv) -OutputPath (Out asr) -AsOf $AsOf
        function script:Row($ring, $prefix) { $id = @((Get-XdrAsrRules).rules | Where-Object actionTypePrefix -EQ $prefix)[0].id; @($R.Readiness | Where-Object { $_.Ring -eq $ring -and $_.RuleId -eq $id })[0] }
    }
    It 'carries the fourteen ES-005 rules, two without warn' {
        (Get-XdrAsrRules).rules.Count | Should -Be 14
        @((Get-XdrAsrRules).rules | Where-Object { -not $_.supportsWarn } | ForEach-Object id) | Should -Be @('9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2', '75668c1f-73b5-4cf0-bb93-3ecf5cb7cc84')
    }
    It 'moves a warn rule to block after 14 days' { (Row ring1 AsrVulnerableSignedDriver).Status | Should -Be 'Ready'; (Row ring1 AsrVulnerableSignedDriver).Next | Should -Be 'block' }
    It 'holds a warn rule short of 14 days' { (Row ring1 AsrOfficeChildProcess).Status | Should -Be 'Hold' }
    It 'sends a rule without warn from audit straight to block' { (Row ring1 AsrOfficeProcessInjection).Next | Should -Be 'block'; (Row ring2 AsrLsassCredentialTheft).Next | Should -Be 'block' }
    It 'holds a rule with an audit hit that has no exclusion or decision' { (Row ring2 AsrOfficeChildProcess).OpenHits | Should -Be 1; (Row ring2 AsrOfficeChildProcess).Status | Should -Be 'Hold' }
    It 'counts a hit covered by a folder decision as dispositioned' { (Row ring2 AsrObfuscatedScript).OpenHits | Should -Be 0; (Row ring2 AsrObfuscatedScript).Status | Should -Be 'Ready' }
    It 'fails a plan that puts a rule without warn in warn' { (Row ring3 AsrLsassCredentialTheft).Status | Should -Be 'Fail' }
    It 'warns about the PSExec and WMI rule on a ring Configuration Manager manages' { (Row ring2 AsrPsexecWmiChildProcess).Status | Should -Be 'Warn' }
    It 'marks a rule Windows Server doesn''t support as not applicable on a server ring' { (Row servers AsrOfficeMacroWin32ApiCalls).Status | Should -Be 'NotApplicable' }
    It 'catches the server that enforces nothing the plan says' {
        $R.Summary.deviceMismatches | Should -Be 13
        @($R.Devices | Where-Object Status -EQ 'Fail' | ForEach-Object DeviceName | Sort-Object -Unique) | Should -Be @('SRV-APP01')
    }
    It 'lists the expired exclusion' { $R.Summary.expiredExclusions | Should -Be 1 }
    It 'writes Learn''s OMA-URI value: one GUID=code line per configured rule' {
        $v = Get-Content (Join-Path (Out asr) 'oma-uri/ring1-next.txt')
        $v.Count | Should -Be 14
        $v | Should -Contain 'd4f940ab-401b-4efc-aadc-ad5f3c50688a=6'
        $v | Should -Contain '75668c1f-73b5-4cf0-bb93-3ecf5cb7cc84=1'
        $v | Should -Contain '56a863a9-875e-4185-98a7-b882c64b5ce5=1'
    }
    It 'leaves a not-configured rule out of the OMA-URI value' {
        ConvertTo-XdrOmaUriValue -Modes @{ 'd4f940ab-401b-4efc-aadc-ad5f3c50688a' = 'notConfigured'; '9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2' = 'block' } | Should -Be "9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2=1`n"
    }
    It 'counts the ring 0 devices as fully in block' { @($R.Summary.devicesAllBlock) | Should -Be @('WKS-R0-01', 'WKS-R0-02') }
}

Describe 'Chapter 05: exposure and incidents' {
    BeforeAll {
        $script:E = Invoke-XdrExposureCheck -Settings $S -Invoker (Inv) -OutputPath (Out exposure) -AsOf $AsOf
        $script:I = Invoke-XdrIncidentCheck -Settings $S -Invoker (Inv) -OutputPath (Out incidents) -AsOf $AsOf
    }
    It 'records Security Exposure Management as not available in GCC, a disposition and not a failure' {
        $E.Disposition.availability | Should -Be 'not available'
        $E.Disposition.normalizedResult | Should -Be 'Skipped-Not-Applicable'
    }
    It 'uses a normalized result the Zero Trust Assessment results kit knows' {
        $tax = Get-Content (Join-Path $Kit '../zta-results/config/taxonomy.json') -Raw
        $tax | Should -Match 'Skipped-Not-Applicable'
    }
    It 'finds the exposed device with no owner' { @($E.Exposed | Where-Object Status -EQ 'NoOwner' | ForEach-Object DeviceName) | Should -Be @('WKS-OLD-07') }
    It 'sums the vulnerabilities' { $E.Summary.cves | Should -Be 9 }
    It 'reads each incident against the severity table' {
        $f = @{}; foreach ($r in $I.Rows) { $f[$r.Id] = $r.Finding }
        $f['1001'] | Should -Be 'Triaged'; $f['1002'] | Should -Be 'OverdueTriage'; $f['1003'] | Should -Be 'Untriaged'
        $f['1004'] | Should -Be 'Closed'; $f['1005'] | Should -Be 'ClosedWithoutClassification'; $f['1006'] | Should -Be 'Closed'; $f['1007'] | Should -Be 'Triaged'
    }
    It 'counts each incident once though two filters return it' { $I.Summary.incidents | Should -Be 7 }
    It 'carries the alerts' { @($I.Rows | Where-Object Id -EQ '1002')[0].Alerts | Should -Be 3 }
}

Describe 'Chapter 06: detections as code' {
    BeforeAll { $script:D = Invoke-XdrDetectionCheck -Settings $S -Invoker (Inv) -OutputPath (Out detections) -AsOf $AsOf }
    It 'refuses automated actions in a rule' {
        @($D.Validation | Where-Object Status -EQ 'Fail' | ForEach-Object { "$($_.Subject)/$($_.Id)" }) | Should -Be @('contoso-admin-share-copy/NO-AUTOMATION')
    }
    It 'fails a rule that fires in its known-good window' {
        @($D.Tests | Where-Object Status -EQ 'Fail' | ForEach-Object { "$($_.RuleId)/$($_.Window)" }) | Should -Be @('contoso-admin-share-copy/knownGood')
    }
    It 'plans a create, an update of only the changed property, a hold and an orphan' {
        $p = $D.Plan
        @($p.actions | ForEach-Object { "$($_.ruleId)/$($_.action)" }) | Should -Be @('contoso-lsass-dump-tool/create', 'contoso-office-encoded-powershell/update')
        @(@($p.actions)[1].changed) | Should -Be @('status')
        @(@($p.actions)[1].body.Keys) | Should -Be @('status')
        @($p.held | ForEach-Object { $_.ruleId }) | Should -Be @('contoso-admin-share-copy')
        @($p.orphans | ForEach-Object { $_.ruleId }) | Should -Be @('contoso-legacy-rdp-rule')
    }
    It 'writes the plan''s SHA-256 beside it' {
        (Get-Content (Join-Path (Out detections) 'plan.sha256')) | Should -Match ('^' + (Get-XdrFileHash -Path (Join-Path (Out detections) 'plan.json')) + '  plan.json$')
    }
    It 'holds a rule enabled in its file whose test fails' {
        $e = @(Read-XdrRuleRepository -Path $S.inputs.rules | Where-Object FileId -EQ 'contoso-office-encoded-powershell')
        $t = @([pscustomobject]@{ RuleId = 'contoso-office-encoded-powershell'; Window = 'knownBad'; Status = 'Fail' })
        $p = New-XdrDetectionPlan -Entries $e -Validation @() -Tests $t -Deployed @() -DeployVia graph
        @($p.held)[0].reason | Should -Match 'enabled in the file'
    }
    It 'writes a portal sheet instead of Graph requests on the interim path' {
        $s2 = Read-XdrSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $s2.detections.deployVia = 'portal'
        $null = Invoke-XdrDetectionCheck -Settings $s2 -Invoker (Inv) -OutputPath (Out detections-portal) -AsOf $AsOf
        Get-Content (Join-Path (Out detections-portal) 'portal-sheet.md') -Raw | Should -Match 'contoso-lsass-dump-tool'
    }
    It 'checks the query starts from a declared table' {
        $e = @(Read-XdrRuleRepository -Path $S.inputs.rules)[0]
        $e.Test.tables = @('DeviceEvents')
        @(Test-XdrDetectionRule -Entry $e | Where-Object Id -EQ 'TABLES')[0].Status | Should -Be 'Fail'
    }
}

Describe 'Chapter 07: signals and automation' {
    BeforeAll {
        $script:G = Invoke-XdrSignalsCheck -Settings $S -Invoker (Inv) -OutputPath (Out signals) -AsOf $AsOf
        $script:U = Invoke-XdrAutomationCheck -Settings $S -OutputPath (Out automation) -AsOf $AsOf
    }
    It 'puts the emergency access account first' { $G.Rows[0].AccountUpn | Should -Match '^breakglass01@'; $G.Rows[0].EmergencyAccess | Should -BeTrue }
    It 'sees identity and cloud-app sources feeding alerts' { $G.Summary.feeding | Should -Match 'are feeding' }
    It 'fails when only the endpoint feeds alerts' {
        $inv = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[string]]::new(); Script = { param($id, $a) @{ schema = @(); results = @(@{ AccountUpn = 'x@contoso.example'; AccountObjectId = '1'; Sources = 2; SourceList = @('Microsoft Defender for Endpoint'); Alerts = 2 }) } } }
        $r = Invoke-XdrSignalsCheck -Settings $S -Invoker $inv -OutputPath (Out signals2) -AsOf $AsOf
        (Read-XdrJson -Path (Join-Path (Out signals2) 'manifest.json')).result | Should -Be 'Fail'
    }
    It 'finds the workstation group off the ladder' { @($U.Groups | Where-Object Status -EQ 'Fail' | ForEach-Object Name) | Should -Be @('Ring3-Workstations') }
    It 'finds the lapsed exclusion and the emergency account not excluded' {
        $U.Summary.exclusionsLapsed | Should -Be 1
        $U.Summary.emergencyAccessNotExcluded | Should -Be 1
    }
    It 'finds the device below the Contain User sensor version' { @($U.Summary.devicesBelowContainUserSensor) | Should -Be @('WKS-R3-01') }
}
