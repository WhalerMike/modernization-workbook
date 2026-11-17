#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
BeforeAll { . (Join-Path $PSScriptRoot 'TestHelpers.ps1') }

Describe 'Baseline (Step 1)' {
    It 'finds the hierarchy, logging and Defender gaps in the fixture estate' {
        $r = Get-AzsBaselineCheck -Ctx (New-TestContext (New-TestInvoker))
        Get-TestRules $r | Should -Be @('AZS-BL-01', 'AZS-BL-04', 'AZS-BL-05', 'AZS-BL-06')
        @($r.Findings | Where-Object rule -EQ 'AZS-BL-05').Count | Should -Be 10
        $r.Summary.platformResources | Should -Be 16
        ($r.Findings | Where-Object rule -EQ 'AZS-BL-06').detail | Should -Be 'Free or absent: KeyVaults'
    }
    It 'flags a default group that is the tenant root, and a required initiative that is missing' {
        $p = { param($c, $k, $r) if ($c -eq 'rest-hierarchy-settings') { $r.properties.defaultManagementGroup = "/providers/Microsoft.Management/managementGroups/$k" }
            if ($c -eq 'arg-policy-assignments') { $r.data = @($r.data | Where-Object name -NE 'azs-mcsb') }; , $r }
        $r = Get-AzsBaselineCheck -Ctx (New-TestContext (New-TestInvoker -Patch $p))
        Get-TestRules $r | Should -Contain 'AZS-BL-02'
        ($r.Findings | Where-Object rule -EQ 'AZS-BL-03').name | Should -Be 'azs-mcsb'
    }
}

Describe 'Exposure register (Step 2)' {
    It 'lists every public IP, Front Door profile, application gateway and public PaaS resource' {
        $r = Get-AzsExposureCheck -Ctx (New-TestContext (New-TestInvoker))
        $r.Register.Count | Should -Be 19
        @($r.Register | Group-Object { ($_.type -split ' ')[0] } | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Count)" }) | Should -Be @('ApplicationGateway=2', 'FrontDoor=3', 'PaaS=6', 'PublicIP=8')
        ($r.Register | Where-Object name -EQ 'pip-appgw-portal').waf | Should -Be 'wafp-portal'
        ($r.Register | Where-Object name -EQ 'pip-appgw-portal').wafMode | Should -Be 'Detection'
        ($r.Register | Where-Object name -EQ 'afd-portal').publicName | Should -Be 'portal.contoso.example'
        Get-TestRules $r | Should -Be @('AZS-EX-01', 'AZS-EX-02')
    }
    It 'reports new and gone exposures against the previous register, and Defender gaps' {
        $w1 = (Get-AzsExposureCheck -Ctx (New-TestContext (New-TestInvoker))).Register
        $def = @(Import-Csv (Join-Path $script:Fixtures 'defender-exposure.csv') | ForEach-Object { @{ resourceId = $_.resourceId; source = $_.source } })
        $r = Get-AzsExposureCheck -Ctx (New-TestContext (New-TestInvoker -Week week2) -AsOf 2026-11-16T12:00:00Z -PreviousRegister $w1 -DefenderExposure $def)
        ($r.Findings | Where-Object rule -EQ 'AZS-EX-03').name | Should -Be 'pip-new-api'
        ($r.Findings | Where-Object rule -EQ 'AZS-EX-04').name | Should -Be 'pip-orphan'
        ($r.Findings | Where-Object rule -EQ 'AZS-EX-05').name | Should -Be 'ci-batch-export'
        $r.Summary.newSincePrevious | Should -Be 1
    }
}

Describe 'DDoS (Step 3)' {
    It 'resolves each public IP to its protection' {
        $r = Get-AzsDdosCheck -Ctx (New-TestContext (New-TestInvoker))
        $st = @{}; foreach ($x in $r.Rows) { $st[$x.name] = $x.status }
        $st['pip-afw-hub'] | Should -Be 'Inherited'
        $st['pip-appgw-portal'] | Should -Be 'Inherited'
        $st['pip-test-app'] | Should -Be 'IpProtection'
        $st['pip-jump'] | Should -Be 'Unprotected'
        $st['pip-lb-portal'] | Should -Be 'Unknown'
        $st['pip-nat-egress'] | Should -Be 'NatGateway'
        $st['pip-orphan'] | Should -Be 'Unattached'
        $r.Summary.coveragePercent | Should -Be 66.7
    }
    It 'needs logs to the platform workspace and an enabled alert on each protected IP' {
        $r = Get-AzsDdosCheck -Ctx (New-TestContext (New-TestInvoker))
        @($r.Findings | Where-Object rule -EQ 'AZS-DD-04' | ForEach-Object name | Sort-Object) | Should -Be @('pip-afw-hub', 'pip-vpngw')
        @($r.Findings | Where-Object rule -EQ 'AZS-DD-05' | ForEach-Object name | Sort-Object) | Should -Be @('pip-afw-hub', 'pip-test-app', 'pip-vpngw')
        Get-TestRules $r | Should -Be @('AZS-DD-01', 'AZS-DD-02', 'AZS-DD-03', 'AZS-DD-04', 'AZS-DD-05', 'AZS-DD-06')
    }
    It 'treats protectionMode Disabled as unprotected even in a protected network' {
        $p = { param($c, $k, $r) if ($c -eq 'arg-public-ips') { foreach ($x in $r.data) { if ($x.name -eq 'pip-vpngw') { $x.ddosMode = 'Disabled' } } }; , $r }
        $r = Get-AzsDdosCheck -Ctx (New-TestContext (New-TestInvoker -Patch $p))
        ($r.Rows | Where-Object name -EQ 'pip-vpngw').status | Should -Be 'Unprotected'
    }
}

Describe 'WAF (Step 4)' {
    It 'checks mode, body inspection, rule sets and rate limits, and writes a plan it does not run' {
        $r = Get-AzsWafCheck -Ctx (New-TestContext (New-TestInvoker))
        Get-TestRules $r | Should -Be @('AZS-WAF-01', 'AZS-WAF-03', 'AZS-WAF-04', 'AZS-WAF-06', 'AZS-WAF-07')
        @($r.Plan).Count | Should -Be 1
        $r.Plan[0] | Should -Be 'az network application-gateway waf-policy policy-setting update --policy-name wafp-portal --resource-group rg-hub --subscription 11111111-1111-4111-8111-111111111111 --mode Prevention --state Enabled --request-body-check true'
        $r.Summary.preventionCoveragePercent | Should -Be 33.3
    }
    It 'flags a policy without body inspection or a rate limit, a gateway without WAF, and a Standard Front Door WAF' {
        $p = { param($c, $k, $r)
            if ($c -eq 'arg-appgw-waf-policies') { $r.data[0].policySettings.requestBodyCheck = $false; $r.data[0].customRules = @() }
            if ($c -eq 'arg-afd-waf-policies') { $r.data[0].sku = 'Standard_AzureFrontDoor' }
            if ($c -eq 'arg-app-gateways') { foreach ($g in $r.data) { if ($g.name -eq 'appgw-portal') { $g.skuTier = 'Standard_v2'; $g.wafPolicy = '' } } }
            , $r }
        $r = Get-AzsWafCheck -Ctx (New-TestContext (New-TestInvoker -Patch $p))
        Get-TestRules $r | Should -Contain 'AZS-WAF-02'
        Get-TestRules $r | Should -Contain 'AZS-WAF-05'
        Get-TestRules $r | Should -Contain 'AZS-WAF-08'
        ($r.Findings | Where-Object { $_.rule -eq 'AZS-WAF-06' -and $_.name -eq 'appgw-portal' }) | Should -Not -BeNullOrEmpty
    }
}

Describe 'Edge (Step 5)' {
    It 'checks each origin''s lock-down, origin groups, TLS and classic profiles' {
        $r = Get-AzsEdgeCheck -Ctx (New-TestContext (New-TestInvoker))
        $lock = @{}; foreach ($x in @($r.Rows | Where-Object kind -EQ 'origin')) { $lock[$x.name] = $x.lockdown }
        $lock['origin-east'] | Should -Be 'ServiceTag+FDID'
        $lock['origin-west'] | Should -Be 'TagOnly'
        $lock['api-private'] | Should -Be 'PrivateLink'
        $lock['api-public'] | Should -Be 'Unchecked'
        Get-TestRules $r | Should -Be @('AZS-EDGE-01', 'AZS-EDGE-03', 'AZS-EDGE-04', 'AZS-EDGE-05', 'AZS-EDGE-06', 'AZS-EDGE-07', 'AZS-EDGE-08')
    }
    It 'refuses another profile''s X-Azure-FDID, an open rule and a default Allow' {
        $p = { param($c, $k, $r)
            if ($c -eq 'rest-webapp-config' -and $k -like '*app-portal-east') { $r.properties.ipSecurityRestrictions[0].headers.'x-azure-fdid' = @('00000000-0000-4000-8000-000000000000') }
            if ($c -eq 'rest-webapp-config' -and $k -like '*app-portal-west') { $r.properties.ipSecurityRestrictionsDefaultAction = 'Allow' }
            , $r }
        $r = Get-AzsEdgeCheck -Ctx (New-TestContext (New-TestInvoker -Patch $p))
        @($r.Findings | Where-Object rule -EQ 'AZS-EDGE-02' | ForEach-Object { ($_.name -split '/')[-1] } | Sort-Object) | Should -Be @('origin-east', 'origin-west')
    }
}

Describe 'Firewall (Step 6)' {
    It 'checks policy modes and each workload subnet''s declared default route, and writes the draft plan' {
        $r = Get-AzsFirewallCheck -Ctx (New-TestContext (New-TestInvoker))
        Get-TestRules $r | Should -Be @('AZS-FW-01', 'AZS-FW-02', 'AZS-FW-03', 'AZS-FW-04', 'AZS-FW-05', 'AZS-FW-07')
        $r.Summary.workloadSubnets | Should -Be 5
        $r.Summary.routedToFirewall | Should -Be 2
        @($r.Plan).Count | Should -Be 4
        $r.Plan[1] | Should -Match '--threat-intel-mode Deny --idps-mode Deny$'
    }
    It 'says a Standard policy needs Premium for IDPS, and flags a firewall with no policy' {
        $p = { param($c, $k, $r)
            if ($c -eq 'arg-firewall-policies') { $r.data[0].tier = 'Standard'; $r.data[0].threatIntelMode = 'Deny' }
            if ($c -eq 'arg-firewalls') { $r.data[0].policy = '' }
            , $r }
        $r = Get-AzsFirewallCheck -Ctx (New-TestContext (New-TestInvoker -Patch $p))
        ($r.Findings | Where-Object rule -EQ 'AZS-FW-02').detail | Should -Be 'tier Standard: IDPS needs Premium'
        Get-TestRules $r | Should -Contain 'AZS-FW-06'
        @($r.Plan).Count | Should -Be 0
    }
}

Describe 'Private Link, DNS and Key Vault (Steps 7 and 8)' {
    It 'checks zones, endpoints, zone groups and public access' {
        $r = Get-AzsPrivateCheck -Ctx (New-TestContext (New-TestInvoker))
        @(Get-TestRules $r | Where-Object { $_ -like 'AZS-PL-*' }) | Should -Be @('AZS-PL-01', 'AZS-PL-02', 'AZS-PL-03', 'AZS-PL-04', 'AZS-PL-05', 'AZS-PL-06')
        ($r.Findings | Where-Object rule -EQ 'AZS-PL-03').name | Should -Be 'pe-st-payroll-queue'
    }
    It 'checks each vault''s RBAC, purge protection, firewall, private endpoint and audit log' {
        $r = Get-AzsPrivateCheck -Ctx (New-TestContext (New-TestInvoker))
        @($r.Findings | Where-Object { $_.name -eq 'kv-portal' } | ForEach-Object rule | Sort-Object) | Should -Be @('AZS-KV-01', 'AZS-KV-02', 'AZS-KV-03', 'AZS-KV-04', 'AZS-KV-05', 'AZS-KV-06')
        @($r.Findings | Where-Object { $_.name -eq 'kv-payroll' }).Count | Should -Be 0
        $r.Summary.vaultPosturePercent | Should -Be 33.3
    }
}

Describe 'Policy (Step 9)' {
    It 'checks the initiative, notScopes and every exemption''s expiry' {
        $r = Get-AzsPolicyCheck -Ctx (New-TestContext (New-TestInvoker))
        Get-TestRules $r | Should -Be @('AZS-POL-02', 'AZS-POL-03', 'AZS-POL-04', 'AZS-POL-05', 'AZS-POL-06')
        $r.Summary.exemptions.expired | Should -Be 1
        $r.Summary.securityInitiativeCompliancePercent | Should -Be 52.6
    }
    It 'flags a missing security initiative, and stops warning once it is enforced' {
        $p = { param($c, $k, $r) if ($c -eq 'arg-policy-assignments') { $r.data = @($r.data | Where-Object name -NE 'azs-security') }; , $r }
        Get-TestRules (Get-AzsPolicyCheck -Ctx (New-TestContext (New-TestInvoker -Patch $p))) | Should -Contain 'AZS-POL-01'
        Get-TestRules (Get-AzsPolicyCheck -Ctx (New-TestContext (New-TestInvoker -Week week2) -AsOf 2026-11-16T12:00:00Z)) | Should -Not -Contain 'AZS-POL-02'
    }
}
