# The attribute survey and wave lists against the fictional two-tree forest in
# attribute-survey.json: what the Global Catalog holds and what it doesn't, fill rates, value
# quality, extension slots, and waves with their exclusions.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPAttributeSurvey') -Force
    Register-KitSurveyMocks

    $run = Join-Path $TestDrive 'run'
    $survey = Get-FMPAttributeSurvey -OutputPath $run -KeyPattern '^MP\d{7}$' -UpnSuffix 'contoso.example', 'research.example' `
        -CodeListPath (Join-Path $FMPAttrPath 'code-lists.csv') -AsOf $FMPAsOf 3>$null
    $dir = Join-Path $run 'AttributeSurvey'
    $export = @(Import-Csv (Join-Path $dir 'ad-user-export.csv'))
    $fill = @(Import-Csv (Join-Path $dir 'FillRate.csv'))
    $quality = @(Import-Csv (Join-Path $dir 'ValueQuality.csv'))
    $slots = @(Import-Csv (Join-Path $dir 'SlotUsage.csv'))
    $coverage = @(Import-Csv (Join-Path $dir 'GcCoverage.csv'))
    function Get-Row($Sam) { @($export | Where-Object SamAccountName -eq $Sam)[0] }
    function Get-Fill($Domain, $Attribute) { @($fill | Where-Object { $_.Domain -eq $Domain -and $_.Attribute -eq $Attribute })[0] }
    function Get-Rule($Rule) { @($quality | Where-Object Rule -eq $Rule) }
}

Describe 'Reading the forest' {
    BeforeAll {
        # A run of its own, so the calls it makes are counted in this block.
        $null = Get-FMPAttributeSurvey -OutputPath (Join-Path $TestDrive 'calls') -AsOf $FMPAsOf 3>$null
    }
    It 'reads every domain of both trees once' {
        $export.Count | Should -Be 14
        @($export | Group-Object ObjectGUID | Where-Object Count -gt 1) | Should -BeNullOrEmpty
        @($export | Where-Object Domain -eq 'child.contoso.example').Count | Should -Be 3
    }
    It 'reads the Global Catalog on port 3268, once per domain naming context' {
        Should -Invoke -Scope Describe -ModuleName FMPAttributeSurvey Get-ADUser -Times 3 -Exactly -ParameterFilter { $Server -eq 'gc01.contoso.example:3268' }
        Should -Invoke -Scope Describe -ModuleName FMPAttributeSurvey Get-ADUser -Times 1 -Exactly -ParameterFilter { $Server -eq 'gc01.contoso.example:3268' -and $SearchBase -eq 'DC=research,DC=example' }
    }
    It 'reads from a domain controller only what the Global Catalog does not hold' {
        Should -Invoke -Scope Describe -ModuleName FMPAttributeSurvey Get-ADUser -ParameterFilter {
            $Server -eq 'contoso.example' -and @($Properties | Where-Object { $_ -like 'extensionAttribute*' }).Count -eq 0 -and $Properties -contains 'employeeID'
        }
    }
    It 'records where each attribute came from' {
        $c = @($coverage | Where-Object Attribute -eq 'employeeID')[0]
        $c.InGlobalCatalog | Should -Be 'False'
        $c.ReadFrom | Should -Match 'Domain controller'
        $c.ReadFrom | Should -Match 'not collected'
        @($coverage | Where-Object Attribute -eq 'extensionAttribute10')[0].ReadFrom | Should -Be 'Global Catalog'
    }
    It 'keeps what the Global Catalog gave for a domain whose domain controllers refused the read' {
        (Get-Row 'res.one').extensionAttribute10 | Should -Be 'RES-LAB'
        (Get-Row 'res.one').EmployeeId | Should -Be ''
        $survey.DomainsNotCollected | Should -BeNullOrEmpty
    }
    It 'joins the two reads on objectGUID' {
        $r = Get-Row 'ana.lyst'
        $r.EmployeeId | Should -Be 'MP0042137'
        $r.extensionAttribute10 | Should -Be 'FIN-LED'
        $r.Mail | Should -Be 'ana.lyst@contoso.example'
    }
    It 'resolves each manager to the manager''s key, across domains' {
        (Get-Row 'ana.lyst').ManagerEmployeeId | Should -Be 'MP0040001'
        (Get-Row 'field.one').ManagerEmployeeId | Should -Be 'MP0040001'
    }
}

Describe 'Fill rate' {
    It 'measures enabled users that are not service accounts' {
        (Get-Fill 'contoso.example' 'EmployeeId').Population | Should -Be 7
        (Get-Fill 'contoso.example' 'EmployeeId').Populated | Should -Be 6
    }
    It 'says not collected, never zero, where no read reached the attribute' {
        (Get-Fill 'research.example' 'EmployeeId').Populated | Should -Be 'not collected'
        (Get-Fill 'research.example' 'extensionAttribute10').Populated | Should -Be 2
    }
    It 'names the domains it could not collect in the forest row' {
        (Get-Fill '(forest)' 'EmployeeId').FillPercent | Should -Match 'not collected in research\.example'
    }
}

Describe 'Value quality' {
    It 'finds keys held twice, in any account state' {
        @(Get-Rule 'DuplicateKey' | ForEach-Object SamAccountName | Sort-Object) | Should -Be @('ana.lyst', 'test.old')
        $survey.DuplicateKeys | Should -Be 1
    }
    It 'finds <Rule> on <Sam>' -ForEach @(
        @{ Rule = 'KeyFormat'; Sam = 'field.three' }
        @{ Rule = 'Whitespace'; Sam = 'space.key' }
        @{ Rule = 'CodeNotInList'; Sam = 'field.three' }
        @{ Rule = 'DisplayStringInCodeSlot'; Sam = 'no.key' }
        @{ Rule = 'ManagerDisabled'; Sam = 'no.key' }
        @{ Rule = 'ManagerHasNoKey'; Sam = 'space.key' }
        @{ Rule = 'UpnSuffixNotListed'; Sam = 'field.three' }
    ) {
        @(Get-Rule $Rule | Where-Object SamAccountName -eq $Sam) | Should -Not -BeNullOrEmpty
    }
    It 'finds mail held twice across domain trees' {
        @(Get-Rule 'DuplicateMail').Count | Should -Be 2
    }
    It 'finds a manager outside the surveyed domains' {
        @(Get-Rule 'ManagerNotFound' | ForEach-Object SamAccountName) | Should -Be @('res.two')
    }
    It 'doesn''t flag the code-list value on a code that is on the list' {
        @(Get-Rule 'CodeNotInList' | Where-Object Value -eq 'FIN-LED') | Should -BeNullOrEmpty
    }
}

Describe 'Extension slots' {
    It 'marks the coded slots, the free ones and those already in use' {
        @($slots | Where-Object Slot -eq 'extensionAttribute10')[0].Status | Should -Be 'Coded'
        @($slots | Where-Object Slot -eq 'extensionAttribute5')[0].Status | Should -Be 'InUse'
        @($slots | Where-Object Slot -eq 'extensionAttribute1')[0].Status | Should -Be 'Free'
        $survey.FreeSlots | Should -Contain 'extensionAttribute2'
        $survey.FreeSlots | Should -Not -Contain 'extensionAttribute15'
    }
}

Describe 'The Global Catalog fallback' {
    It 'reads every attribute from the domain controllers when no Global Catalog answers' {
        Mock -ModuleName FMPAttributeSurvey Get-ADUser -ParameterFilter { $Server -like '*:3268' } { throw 'The server is not operational.' }
        $out = Join-Path $TestDrive 'nogc'
        $s = Get-FMPAttributeSurvey -OutputPath $out -Domain 'contoso.example' -AsOf $FMPAsOf 3>$null
        $s.Users | Should -Be 9
        $r = @(Import-Csv (Join-Path (Join-Path $out 'AttributeSurvey') 'ad-user-export.csv') | Where-Object SamAccountName -eq 'ana.lyst')[0]
        $r.extensionAttribute10 | Should -Be 'FIN-LED'
        $r.EmployeeId | Should -Be 'MP0042137'
    }
}

Describe 'Wave lists' {
    BeforeAll {
        $w = Get-FMPWaveList -OutputPath $run -WavePlanPath (Join-Path $FMPAttrPath 'wave-plan.csv') -OwnershipPath (Join-Path $FMPAttrPath 'asset-ownership.csv') -AsOf $FMPAsOf
        $wdir = Join-Path $run 'Waves'
        $waves = @(Import-Csv (Join-Path $wdir 'waves.csv'))
        $excl = @(Import-Csv (Join-Path $wdir 'wave-exclusions.csv'))
        $sum = @(Import-Csv (Join-Path $wdir 'wave-summary.csv'))
        function Get-Exclusion($Name) { @($excl | Where-Object Name -eq $Name)[0] }
    }
    It 'puts each user in the wave its attributes select' {
        @($waves | Where-Object { $_.ObjectType -eq 'User' -and $_.WaveId -eq 'W1-pilot' } | ForEach-Object Name | Sort-Object) | Should -Be @('mgr.one')
        @($waves | Where-Object { $_.WaveId -eq 'W3' -and $_.ObjectType -eq 'User' }).Count | Should -Be 2
    }
    It 'excludes <Name> as <Reason>' -ForEach @(
        @{ Name = 'ana.lyst'; Reason = 'DuplicateKey' }
        @{ Name = 'test.old'; Reason = 'DuplicateKey' }
        @{ Name = 'no.key'; Reason = 'NoKey' }
        @{ Name = 'left.user'; Reason = 'Disabled' }
        @{ Name = 'svc-app'; Reason = 'ServiceAccount' }
        @{ Name = 'admin.x'; Reason = 'Privileged' }
        @{ Name = 'dns.user'; Reason = 'DoNotSync' }
        @{ Name = 'field.three'; Reason = 'NotInPlan' }
        @{ Name = 'res.one'; Reason = 'NoKey' }
    ) {
        (Get-Exclusion $Name).Reason | Should -Be $Reason
    }
    It 'sends devices and servers with their owner' {
        @($waves | Where-Object Name -eq 'SRV-FIN01')[0].WaveId | Should -Be 'W1-pilot'
        @($waves | Where-Object Name -eq 'LT-0002')[0].WaveId | Should -Be 'W3'
    }
    It 'holds back an asset whose owners are in different waves, excluded, or unknown' {
        (Get-Exclusion 'SRV-SHARED').Reason | Should -Be 'OwnersInMoreThanOneWave'
        (Get-Exclusion 'LT-0001').Reason | Should -Be 'OwnerExcluded'
        (Get-Exclusion 'LT-0003').Reason | Should -Be 'OwnerExcluded'
        (Get-Exclusion 'LT-0004').Reason | Should -Be 'OwnerNotFound'
    }
    It 'counts each wave and records its definition' {
        $s = @($sum | Where-Object WaveId -eq 'W2')[0]
        $s.Definition | Should -Be 'extensionAttribute10=FIN-BUD or extensionAttribute10=HR-OPS'
        $s.Users | Should -Be 1
        $w.Waves | Should -Be 3
        $w.Excluded | Should -Be $excl.Count
    }
    It 'builds one wave per organization code without a plan' {
        $out = Join-Path $TestDrive 'byorg'
        $g = Get-FMPWaveList -OutputPath $out -SurveyPath (Join-Path $dir 'ad-user-export.csv') -AsOf $FMPAsOf
        $ids = @(Import-Csv (Join-Path (Join-Path $out 'Waves') 'wave-summary.csv') | ForEach-Object WaveId)
        $ids | Should -Contain 'FLD-NE'
        $ids | Should -Contain 'RES-LAB'
        $g.Source | Should -Be 'one wave per extensionAttribute10 value'
    }
}

Describe 'Read-only' {
    It 'writes nowhere but -OutputPath' {
        @(Get-ChildItem -Path $run -Recurse -File | Where-Object { $_.FullName -notlike "$run*" }) | Should -BeNullOrEmpty
        Get-Command -Module FMPAttributeSurvey | ForEach-Object Verb | Sort-Object -Unique | Should -Be @('Get')
    }
}
