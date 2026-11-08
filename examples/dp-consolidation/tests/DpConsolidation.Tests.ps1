#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
# Tests for the distribution point consolidation kit, on the fictional estate in tests/fixtures.
# No Configuration Manager hierarchy is needed; the change scripts run as dry runs only.

BeforeAll {
    $kit = Split-Path -Parent $PSScriptRoot
    Import-Module (Join-Path $kit 'powershell/DpConsolidation/DpConsolidation.psm1') -Force
    $estate = Join-Path $PSScriptRoot 'fixtures/estate'
    $ready = Join-Path $PSScriptRoot 'fixtures/estate-pilot-ready'
    $packages = Join-Path $PSScriptRoot 'fixtures/packages'
    $hubCsv = Join-Path $kit 'config/hub-design.example.csv'
    $inv = Join-Path $TestDrive 'inventory'
    $null = & (Join-Path $kit 'Invoke-DpcInventory.ps1') -FixturePath $estate -PackageSourceRoot $packages -OutputPath $inv -AsOf '2026-11-08'
    $sizing = Join-Path $TestDrive 'sizing'
    $null = & (Join-Path $kit 'Get-DpcSizing.ps1') -InventoryPath $inv -HubDesignCsv $hubCsv -OutputPath $sizing
}

Describe 'Module helpers' {
    It 'judges server builds against the 2019 minimum' {
        (Get-DpcOsStandard -Build 17763).Status | Should -Be 'meets-standard'
        (Get-DpcOsStandard -Build 20348).Release | Should -Be 'Windows Server 2022'
        (Get-DpcOsStandard -Build 14393).Status | Should -Be 'exception'
        (Get-DpcOsStandard -Build 9600).Status | Should -Be 'below-standard'
        (Get-DpcOsStandard -Build $null).Status | Should -Be 'unknown'
    }
    It 'extracts the server from a NAL path' {
        Get-DpcServerName -Path '["Display=\\DP1.lab.example\"]MSWNET:["SMS_SITE=LAB"]\\DP1.lab.example\' | Should -Be 'dp1.lab.example'
    }
    It 'matches subnet IDs with or without a prefix length' {
        Test-DpcSubnetMatch -ClientSubnet '10.21.1.0' -BoundaryValue '10.21.1.0/24' | Should -BeTrue
        Test-DpcSubnetMatch -ClientSubnet '10.21.1.0' -BoundaryValue '10.22.1.0' | Should -BeFalse
    }
    It 'detects PSAppDeployToolkit 4, 3 and none' {
        (Get-DpcPsadtInfo -Path (Join-Path $packages 'LabViewer')).Version | Should -Be '4.1.7'
        (Get-DpcPsadtInfo -Path (Join-Path $packages 'PdfReader')).Major | Should -Be 3
        (Get-DpcPsadtInfo -Path (Join-Path $packages 'CaseNotes')).Wrapper | Should -Be 'msi-only'
        (Get-DpcPsadtInfo -Path (Join-Path $packages 'StatsDesktop')).Wrapper | Should -Be 'none'
    }
    It 'renders commands with typed values' {
        Format-DpcCommand -Cmdlet 'Set-CMBoundaryGroup' -Parameters @{ Name = 'BG-A'; AllowPeerDownload = $true; FallbackDPMinutes = 120 } |
            Should -Be "Set-CMBoundaryGroup -AllowPeerDownload `$true -FallbackDPMinutes 120 -Name 'BG-A'"
    }
}

Describe 'Invoke-DpcInventory (fixtures)' {
    It 'counts the estate' {
        $m = Get-Content -Raw (Join-Path $inv 'manifest.json') | ConvertFrom-Json
        $m.summary.distributionPoints | Should -Be 14
        $m.summary.officeDistributionPoints | Should -Be 12
        $m.summary.clients | Should -Be 9835
        $m.summary.applicationsOnPsadt | Should -Be 5
        $m.readOnly | Should -BeTrue
    }
    It 'assigns clients to distribution points through boundary groups' {
        $dp = @(Read-DpcRows -RunPath $inv -Name 'dp-inventory') | Where-Object Server -EQ 'off10-dp.lab.example'
        $dp.ClientsServed | Should -Be 1300
        $dp.LoadPctOfLimit | Should -Be 32.5
    }
    It 'raises the OS, hardware, unmatched-subnet and gate findings' {
        $f = @(Read-DpcRows -RunPath $inv -Name 'findings')
        @($f | Where-Object Id -EQ 'DPC-INV-01').Target | Should -Be 'off09-dp.lab.example'
        @($f | Where-Object Id -EQ 'DPC-INV-02').Target | Should -Be 'off04-dp.lab.example'
        @($f | Where-Object Id -EQ 'DPC-INV-04').Count | Should -Be 3
        @($f | Where-Object Id -EQ 'DPC-INV-07').Count | Should -Be 2
        @($f | Where-Object Id -EQ 'DPC-INV-10').Count | Should -Be 1
    }
    It 'tags each evidence file with controls and KSIs' {
        $doc = Get-Content -Raw (Join-Path $inv 'dp-inventory.json') | ConvertFrom-Json
        $doc.controls | Should -Contain 'CM-8'
        $doc.ksi | Should -Contain 'KSI-PIY-GIV'
    }
    It 'writes a manifest whose hashes match, and notices tampering' {
        Test-DpcManifest -Path (Join-Path $inv 'manifest.json') | Should -BeTrue
        $copy = Join-Path $TestDrive 'tamper'
        Copy-Item $inv $copy -Recurse
        Add-Content (Join-Path $copy 'findings.csv') 'x'
        Test-DpcManifest -Path (Join-Path $copy 'manifest.json') -WarningAction SilentlyContinue | Should -BeFalse
    }
}

Describe 'Get-DpcSizing' {
    It 'sizes against 4,000 clients per DP with at least two per hub' {
        $rows = @(Read-DpcRows -RunPath $sizing -Name 'sizing')
        $total = $rows | Where-Object Hub -EQ 'TOTAL'
        $total.Clients | Should -Be 9800
        $total.DPsAtLimit | Should -Be 3
        $total.DPsAtTarget | Should -Be 4
        $total.DPsPlanned | Should -Be 8
        ($rows | Where-Object Hub -EQ 'HUB-EAST').DPsPlanned | Should -Be 2
        @($rows | Where-Object { $_.Hub -eq 'CHECK' -and $_.HubDPs -eq 'FAIL' }).Count | Should -Be 0
    }
    It 'adds DPs when a hub would exceed the target utilization' {
        $out = Join-Path $TestDrive 'sizing-tight'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Get-DpcSizing.ps1') -InventoryPath $inv -HubDesignCsv $hubCsv -ClientsPerDp 1000 -OutputPath $out
        (@(Read-DpcRows -RunPath $out -Name 'sizing') | Where-Object Hub -EQ 'HUB-EAST').DPsPlanned | Should -Be 6
    }
    It 'puts ready circuits first, by renewal date, and the slow ones last' {
        $w = @(Read-DpcRows -RunPath $sizing -Name 'waves')
        ($w | Where-Object Wave -EQ 'Pilot').Office | Should -Be @('OFF08', 'OFF02')
        ($w | Where-Object Office -EQ 'OFF09').CircuitReady | Should -BeFalse
        $w[-1].Office | Should -Be 'OFF09'
    }
}

Describe 'Change scripts are dry runs by default' {
    BeforeAll {
        Mock -ModuleName DpConsolidation Connect-DpcSite { throw 'should not connect' }
    }
    It 'plans the hub tier with rollbacks and changes nothing' {
        $out = Join-Path $TestDrive 'hub'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'New-DpcHubTier.ps1') -InventoryPath $inv -HubDesignCsv $hubCsv -SiteCode LAB -OutputPath $out
        $plan = Import-Csv (Join-Path $out 'plan.csv')
        $plan.Count | Should -Be 27
        @($plan | Where-Object Status -NE 'dry-run').Count | Should -Be 0
        @($plan | Where-Object { -not $_.Rollback }).Count | Should -Be 0
        ($plan | Where-Object Cmdlet -EQ 'Add-CMDistributionPoint')[0].Command | Should -Match '-EnablePullDP'
    }
    It 'plans boundary group changes for one wave' {
        $out = Join-Path $TestDrive 'bg'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Set-DpcBoundaryGroups.ps1') -SizingPath $sizing -HubDesignCsv $hubCsv -Wave Pilot -SiteCode LAB -OutputPath $out
        $plan = Import-Csv (Join-Path $out 'plan.csv')
        $plan.Count | Should -Be 8
        @($plan | Where-Object Cmdlet -EQ 'New-CMBoundaryGroupRelationship').Count | Should -Be 4
    }
    It 'plans the peer cache client settings' {
        $out = Join-Path $TestDrive 'peer'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Set-DpcPeerCache.ps1') -SiteCode LAB -PeerSourceCollection 'P' -OfficeClientCollection 'O' -OutputPath $out
        (Import-Csv (Join-Path $out 'plan.csv')).Command | Should -Contain "Set-CMClientSettingDeliveryOptimization -Enable `$true -Name 'DPC Office Clients'"
    }
}

Describe 'Invoke-DpcOfficeRetirement' {
    BeforeAll {
        $invReady = Join-Path $TestDrive 'inventory-ready'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Invoke-DpcInventory.ps1') -FixturePath $ready -PackageSourceRoot $packages -OutputPath $invReady -AsOf '2026-11-08'
        $script = Join-Path (Split-Path -Parent $PSScriptRoot) 'Invoke-DpcOfficeRetirement.ps1'
    }
    It 'says NO-GO when the office group has no hub DP' {
        $null = & $script -InventoryPath $inv -Server 'off08-dp.lab.example' -Step Check -OutputPath (Join-Path $TestDrive 'r1')
        $LASTEXITCODE | Should -Be 2
    }
    It 'says NO-GO for a PXE distribution point even with hub DPs' {
        $null = & $script -InventoryPath $invReady -Server 'off02-dp.lab.example' -Step Check -OutputPath (Join-Path $TestDrive 'r2')
        $LASTEXITCODE | Should -Be 2
    }
    It 'plans the drain once the office group has hub DPs' {
        $out = Join-Path $TestDrive 'r3'
        $null = & $script -InventoryPath $invReady -Server 'off08-dp.lab.example' -Step Drain -OutputPath $out
        (Import-Csv (Join-Path $out 'plan.csv')).Command | Should -Be "Set-CMDistributionPoint -RemoveBoundaryGroupName 'BG-OFF08' -SiteCode 'LAB' -SiteSystemServerName 'off08-dp.lab.example'"
    }
    It 'refuses Remove until the DP is drained' {
        $null = & $script -InventoryPath $invReady -Server 'off08-dp.lab.example' -Step Remove -OutputPath (Join-Path $TestDrive 'r4')
        $LASTEXITCODE | Should -Be 2
    }
    It 'plans role and site system removal for a drained DP, keeping a server with other roles' {
        $drained = Join-Path $TestDrive 'inventory-drained'
        Copy-Item $invReady $drained -Recurse
        $p = Join-Path $drained 'boundary-groups.json'
        $doc = Get-Content -Raw $p | ConvertFrom-Json
        foreach ($r in $doc.rows) { $r.SiteSystems = (($r.SiteSystems -split '; ') | Where-Object { $_ -notin @('off08-dp.lab.example', 'off06-dp.lab.example') }) -join '; ' }
        $doc | ConvertTo-Json -Depth 8 | Set-Content $p
        $out = Join-Path $TestDrive 'r5'
        $null = & $script -InventoryPath $drained -Server 'off08-dp.lab.example' -Step Remove -OutputPath $out
        (Import-Csv (Join-Path $out 'plan.csv')).Cmdlet | Should -Be @('Remove-CMDistributionPoint', 'Remove-CMSiteSystemServer')
        $out6 = Join-Path $TestDrive 'r6'
        $null = & $script -InventoryPath $drained -Server 'off06-dp.lab.example' -Step Remove -OutputPath $out6
        @(Import-Csv (Join-Path $out6 'plan.csv')).Cmdlet | Should -Be @('Remove-CMDistributionPoint')
    }
}

Describe 'Test-DpcPackaging and Test-DpcRetirementGates' {
    It 'assigns one packaging action per application' {
        $out = Join-Path $TestDrive 'pkg'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Test-DpcPackaging.ps1') -InventoryPath $inv -OutputPath $out
        $rows = Import-Csv (Join-Path $out 'packaging.csv')
        ($rows | Where-Object Application -EQ 'Legacy Scheduler 3.1').Action | Should -Be 'retire'
        ($rows | Where-Object Application -EQ 'PDF Reader 24').Action | Should -Be 'migrate-v3'
        ($rows | Where-Object Application -EQ 'Lab Viewer 5.2').Action | Should -Be 'keep'
        @($rows | Where-Object Action -EQ 'wrap').Count | Should -Be 4
    }
    It 'reports all five gates open for the starting estate' {
        $out = Join-Path $TestDrive 'gates'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Test-DpcRetirementGates.ps1') -InventoryPath $inv -OutputPath $out
        $LASTEXITCODE | Should -Be 2
        @(Import-Csv (Join-Path $out 'gates.csv') | Where-Object Status -EQ 'open').Count | Should -Be 5
    }
    It 'reports all five gates closed when the evidence says so' {
        $done = Join-Path $TestDrive 'inventory-done'
        Copy-Item $inv $done -Recurse
        $set = {
            param($name, $fix)
            $p = Join-Path $done "$name.json"; $doc = Get-Content -Raw $p | ConvertFrom-Json
            foreach ($r in $doc.rows) { & $fix $r }
            $doc | ConvertTo-Json -Depth 8 | Set-Content $p
        }
        & $set 'applications' { param($r) $r.Deployments = 0 }
        & $set 'packages' { param($r) $r.Deployments = 0 }
        & $set 'dp-inventory' { param($r) $r.IsPXE = $false; $r.ConnectedCache = $false }
        & $set 'workloads' { param($r)
            if ($r.Setting -in @('ClientApps', 'OfficeClickToRun', 'WindowsUpdatePolicies', 'DeviceConfiguration')) { $r.State = 'Intune' }
            if ($r.Setting -eq 'SoftwareUpdatesClientSetting') { $r.State = 'Disabled' }
            if ($r.Setting -eq 'ConnectedCacheOnDP') { $r.State = 'No' }
            if ($r.Setting -like 'Evidence:*') { $r.State = 'Intune' } }
        $m = Get-Content -Raw (Join-Path $done 'manifest.json') | ConvertFrom-Json
        $m.summary.taskSequenceDeployments = 0
        $m | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $done 'manifest.json')
        $out = Join-Path $TestDrive 'gates-done'
        $null = & (Join-Path (Split-Path -Parent $PSScriptRoot) 'Test-DpcRetirementGates.ps1') -InventoryPath $done -OutputPath $out
        $LASTEXITCODE | Should -Be 0
        @(Import-Csv (Join-Path $out 'gates.csv') | Where-Object Status -EQ 'closed').Count | Should -Be 5
        # With all five gates closed, the last DP in a group may be drained.
        $retire = Join-Path (Split-Path -Parent $PSScriptRoot) 'Invoke-DpcOfficeRetirement.ps1'
        $null = & $retire -InventoryPath $done -Server 'off10-dp.lab.example' -Step Drain -GatesPath $out -OutputPath (Join-Path $TestDrive 'last')
        $LASTEXITCODE | Should -Be 0
        $null = & $retire -InventoryPath $done -Server 'off10-dp.lab.example' -Step Drain -OutputPath (Join-Path $TestDrive 'last-nogates')
        $LASTEXITCODE | Should -Be 2
    }
}
