#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Unit tests for DynamicRules.psm1 against fixtures: the rule library, a fictional population
# (contoso.example), Book 03's rule pattern table as published, and a fake Graph for pause and resume.

BeforeDiscovery {
    $script:G = '(user.accountEnabled -eq true) -and (user.userType -eq "Member")'
}

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path $PSScriptRoot '..')
    Import-Module (Join-Path $script:Kit 'powershell/DynamicRules.psm1') -Force
    $script:Pop = @(Get-Content (Join-Path $script:Kit 'tests/fixtures/population.json') -Raw | ConvertFrom-Json)
    $script:Lib = @(Get-DrLibrary -Path (Join-Path $script:Kit 'rules'))
    $script:Book = @(Get-Content (Join-Path $script:Kit 'tests/fixtures/book03-patterns.json') -Raw | ConvertFrom-Json)
    $script:G = '(user.accountEnabled -eq true) -and (user.userType -eq "Member")'
    function Get-Rules($Rows) { @($Rows | ForEach-Object { "$($_.Severity):$($_.Rule)" }) }
    function Get-Obj([string]$Key) { $script:Pop | Where-Object key -EQ $Key }

    function New-FakeGraph {
        param([object[]]$Collections)
        $state = [ordered]@{}
        foreach ($c in $Collections) { $state[$c.id] = [pscustomobject]$c }
        $calls = [Collections.Generic.List[object]]::new()
        $invoke = {
            param($Method, $Uri, $Body, $Headers)
            $calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
            $u = [uri]::UnescapeDataString($Uri)
            if ($Method -eq 'PATCH') { $state[($u -split '/')[-1]].state = ($Body | ConvertFrom-Json).membershipRuleProcessingState; return }
            $kind = if ($u -match 'administrativeUnits') { 'au' } else { 'group' }
            @{ value = @($state.Values | Where-Object kind -EQ $kind | ForEach-Object { @{ id = $_.id; displayName = $_.displayName; membershipRuleProcessingState = $_.state } }) }
        }.GetNewClosure()
        [pscustomobject]@{ State = $state; Calls = $calls; Invoke = $invoke }
    }
    $script:Collections = @(
        @{ id = 'g1'; displayName = 'FIN-LED all members'; kind = 'group'; state = 'On' }
        @{ id = 'g2'; displayName = 'Held for review'; kind = 'group'; state = 'Paused' }
        @{ id = 'g3'; displayName = 'Windows company devices'; kind = 'group'; state = 'On' }
        @{ id = 'a1'; displayName = 'AU Finance'; kind = 'au'; state = 'On' }
    )
}

Describe 'Parser' {
    It 'parses <Case>' -ForEach @(
        @{ Case = 'a single expression without parentheses'; Rule = 'user.department -eq "Sales"' }
        @{ Case = 'operators without the hyphen'; Rule = 'user.department eq "Sales" and user.country eq "US"' }
        @{ Case = 'the en dash in Learn''s examples'; Rule = "user.mail $([char]0x2013)ne null" }
        @{ Case = 'an -in list'; Rule = 'user.extensionAttribute10 -in ["FIN-LED","FIN-AP"]' }
        @{ Case = '-any over a string collection'; Rule = '(user.proxyAddresses -any (_ -startsWith "smtp:"))' }
        @{ Case = 'system.now -plus'; Rule = 'user.employeeHireDate -ge system.now -plus p1d' }
        @{ Case = 'a direct reports rule'; Rule = 'Direct Reports for "00000000-0000-0000-0001-000000000009"' }
        @{ Case = 'escaped quotation marks'; Rule = 'user.department -eq "Sales `"East`""' }
    ) { { ConvertFrom-DrRule -Rule $Rule } | Should -Not -Throw }
    It 'refuses <Case>' -ForEach @(
        @{ Case = 'an unknown operator'; Rule = 'user.department -like "Sales"' }
        @{ Case = 'a missing parenthesis'; Rule = '(user.department -eq "Sales"' }
        @{ Case = 'an unterminated string'; Rule = 'user.department -eq "Sales' }
        @{ Case = 'trailing words'; Rule = 'user.department -eq "Sales" extra' }
        @{ Case = 'an empty rule'; Rule = '' }
    ) { { ConvertFrom-DrRule -Rule $Rule } | Should -Throw }
    It 'gives -and higher precedence than -or, as Learn lists' {
        $t = ConvertFrom-DrRule 'user.a -eq "1" -or user.b -eq "2" -and user.c -eq "3"'
        $t.Kind | Should -Be 'or'
        $t.Items[1].Kind | Should -Be 'and'
    }
    It 'classifies user, device and mixed rules' {
        Get-DrRuleObjectType (ConvertFrom-DrRule 'user.a -eq "1"') | Should -Be 'user'
        Get-DrRuleObjectType (ConvertFrom-DrRule 'device.deviceOSType -eq "Windows"') | Should -Be 'device'
        Get-DrRuleObjectType (ConvertFrom-DrRule 'user.a -eq "1" -and device.b -eq "2"') | Should -Be 'mixed'
    }
}

Describe 'Offline evaluator' {
    It 'is case-insensitive for values, as Learn says: fin-led matches FIN-LED' {
        Test-DrMember -Rule "$script:G -and (user.extensionAttribute10 -eq ""FIN-LED"")" -Object (Get-Obj 'u08') | Should -BeTrue
    }
    It 'keeps disabled accounts and guests out through the guards' {
        $r = "$script:G -and (user.extensionAttribute10 -eq ""FIN-LED"")"
        Test-DrMember -Rule $r -Object (Get-Obj 'u04') | Should -BeFalse
        Test-DrMember -Rule $r -Object (Get-Obj 'u05') | Should -BeFalse
    }
    It 'treats an empty slot as null' {
        Test-DrMember -Rule 'user.extensionAttribute11 -eq null' -Object (Get-Obj 'u06') | Should -BeTrue
        Test-DrMember -Rule 'user.extensionAttribute11 -ne "CTR"' -Object (Get-Obj 'u06') | Should -BeTrue
    }
    It 'evaluates <Op>' -ForEach @(
        @{ Op = '-startsWith'; Rule = 'user.extensionAttribute10 -startsWith "FIN"'; Key = 'u03'; Want = $true }
        @{ Op = '-notStartsWith'; Rule = 'user.extensionAttribute10 -notStartsWith "FIN"'; Key = 'u07'; Want = $true }
        @{ Op = '-endsWith'; Rule = 'user.extensionAttribute10 -endsWith "-AP"'; Key = 'u03'; Want = $true }
        @{ Op = '-contains'; Rule = 'user.extensionAttribute10 -contains "N-L"'; Key = 'u01'; Want = $true }
        @{ Op = '-match'; Rule = 'user.extensionAttribute10 -match "^FIN-(LED|AP)$"'; Key = 'u03'; Want = $true }
        @{ Op = '-notIn'; Rule = 'user.extensionAttribute10 -notIn ["FIN-LED","FIN-AP"]'; Key = 'u07'; Want = $true }
        @{ Op = '-not'; Rule = '-not (user.extensionAttribute11 -eq "CTR")'; Key = 'u02'; Want = $false }
    ) { Test-DrMember -Rule $Rule -Object (Get-Obj $Key) | Should -Be $Want }
    It 'evaluates a direct reports rule, including the manager, as Learn says' {
        Get-DrMembers -Rule 'Direct Reports for "00000000-0000-0000-0001-000000000009"' -Population $script:Pop | Should -Be @('u01', 'u09', 'u10')
    }
    It 'never puts a device in a user rule or a user in a device rule' {
        Test-DrMember -Rule '(device.deviceOSType -eq "Windows")' -Object (Get-Obj 'u01') | Should -BeFalse
    }
    It 'refuses to guess at memberOf' {
        { Test-DrMember -Rule 'user.memberOf -any (group.objectId -in ["x"])' -Object (Get-Obj 'u01') } | Should -Throw
    }
}

Describe 'Rule library' {
    It 'has one file per group, each with an owner and tests' {
        $script:Lib.Count | Should -Be 6
        foreach ($r in $script:Lib) { $r.owner | Should -Not -BeNullOrEmpty; @($r.tests).Count | Should -BeGreaterThan 0 }
    }
    It 'passes the linter and every membership test' {
        Invoke-DrLibraryTest -Library $script:Lib -Population $script:Pop | Should -BeNullOrEmpty
    }
    It 'fails a test that expects the wrong membership' {
        $bad = $script:Lib[0].Clone(); $bad.tests = @(@{ member = 'u04'; expected = $true })
        (Get-Rules (Invoke-DrLibraryTest -Library @($bad) -Population $script:Pop)) | Should -Contain 'Finding:DR-11'
    }
}

Describe 'Linter' {
    It 'flags <Case>' -ForEach @(
        @{ Case = 'a missing accountEnabled guard'; Rule = '(user.userType -eq "Member") -and (user.extensionAttribute10 -eq "X")'; Want = 'Finding:DR-03' }
        @{ Case = 'a missing userType guard'; Rule = '(user.accountEnabled -eq true) -and (user.extensionAttribute10 -eq "X")'; Want = 'Finding:DR-04' }
        @{ Case = 'a guard that sits under -or'; Rule = '(user.accountEnabled -eq true) -or (user.userType -eq "Member") -or (user.extensionAttribute10 -eq "X")'; Want = 'Finding:DR-03' }
        @{ Case = 'a display-name attribute'; Rule = "$script:G -and (user.department -eq ""Sales"")"; Want = 'Finding:DR-05' }
        @{ Case = 'memberOf'; Rule = 'user.memberOf -any (group.objectId -in [''x''])'; Want = 'Finding:DR-06' }
        @{ Case = '-match'; Rule = "$script:G -and (user.extensionAttribute10 -match ""^FIN"")"; Want = 'Warn:DR-07' }
        @{ Case = 'three -or tests of one property'; Rule = "$script:G -and ((user.extensionAttribute10 -eq ""A"") -or (user.extensionAttribute10 -eq ""B"") -or (user.extensionAttribute10 -eq ""C""))"; Want = 'Warn:DR-08' }
        @{ Case = 'user and device properties together'; Rule = "$script:G -and (device.deviceOSType -eq ""Windows"")"; Want = 'Finding:DR-09' }
        @{ Case = 'a rule that does not parse'; Rule = 'user.department -like "Sales"'; Want = 'Finding:DR-01' }
    ) { (Get-Rules (Test-DrRule -Rule $Rule -Kind 'user')) | Should -Contain $Want }
    It 'flags a rule over 3,072 characters' {
        $long = $script:G + ' -and (user.extensionAttribute10 -in [' + ((1..400 | ForEach-Object { '"ORG-' + $_.ToString('0000') + '"' }) -join ',') + '])'
        (Get-Rules (Test-DrRule -Rule $long -Kind user)) | Should -Contain 'Finding:DR-02'
    }
    It 'flags a device rule filed as a user group' {
        (Get-Rules (Test-DrRule -Rule '(device.deviceOSType -eq "Windows")' -Kind user)) | Should -Contain 'Finding:DR-09'
    }
    It 'accepts a guarded rule written with unhyphenated operators and an unquoted Member' {
        Test-DrRule -Rule 'user.accountEnabled eq true and user.userType eq Member and user.extensionAttribute10 eq "X"' -Kind user | Should -BeNullOrEmpty
    }
    It 'notes that -ne on a coded slot admits an empty slot, and stops noting it once the rule says -ne null' {
        (Get-Rules (Test-DrRule -Rule "$script:G -and (user.extensionAttribute11 -ne ""CTR"")" -Kind user)) | Should -Be @('Info:DR-10')
        Test-DrRule -Rule "$script:G -and (user.extensionAttribute11 -ne ""CTR"") -and (user.extensionAttribute11 -ne null)" -Kind user | Should -BeNullOrEmpty
    }
}

Describe "Book 03, Chapter 10's rule pattern table" {
    BeforeAll {
        $script:BookRows = @(foreach ($b in $script:Book) { Test-DrRule -Rule $b.membershipRule -Kind $b.kind -Group $b.pattern })
    }
    It 'parses every pattern' {
        @($script:BookRows | Where-Object Rule -EQ 'DR-01') | Should -BeNullOrEmpty
    }
    It 'matches the table in Book 03, Chapter 10, row for row' {
        # The book writes the direct reports rule with a placeholder; the fixture uses a fictional manager ID.
        $md = (Get-Content (Join-Path $script:Kit '../../docs/books/b03-hr-identity/10-from-attributes-to-access.md') -Raw).Replace('<manager object ID>', '00000000-0000-0000-0001-000000000009')
        $published = @([regex]::Matches($md, '(?m)^\| ([^|]+?) \| `([^`]+)` \|') | ForEach-Object { "$($_.Groups[1].Value)=$($_.Groups[2].Value)" })
        @($script:Book | ForEach-Object { "$($_.pattern)=$($_.membershipRule)" }) | Should -Be $published
    }
    It 'finds the Legal employer pattern reading companyName, now with both guards' {
        @($script:BookRows | Where-Object Group -EQ 'Legal employer' | ForEach-Object Rule) | Should -Be @('DR-05')
    }
    It 'finds nothing in the Exclusion pattern, which now refuses a blank worker type (owner decision; research gap 9)' {
        @($script:BookRows | Where-Object Group -EQ 'Exclusion' | ForEach-Object Rule) | Should -BeNullOrEmpty
    }
    It 'passes the other patterns, with the direct reports note' {
        @($script:BookRows | Where-Object { $_.Group -notin 'Legal employer', 'Exclusion' } | ForEach-Object { "$($_.Group):$($_.Rule)" }) | Should -Be @('Direct reports:DR-03')
    }
}

Describe 'Shadow diff' {
    It 'shows who a change adds and removes before it ships' {
        $d = Compare-DrRule -Current "$script:G -and (user.extensionAttribute10 -eq ""FIN-LED"") -and (user.extensionAttribute11 -ne ""CTR"")" `
            -Proposed "$script:G -and (user.extensionAttribute10 -eq ""FIN-LED"") -and (user.extensionAttribute11 -ne ""CTR"") -and (user.extensionAttribute11 -ne null)" -Population $script:Pop
        $d.Removes | Should -Be @('u06')
        $d.Adds | Should -BeNullOrEmpty
        $d.CurrentCount | Should -Be 4
    }
}

Describe 'Pause manifest and resume' {
    BeforeEach { $script:Fake = New-FakeGraph -Collections $script:Collections }
    It 'refuses an unknown cloud instead of defaulting to the worldwide endpoint' {
        { Get-DrGraphEndpoint -Cloud 'GCCHigh' } | Should -Throw '*Unknown cloud*'
        Get-DrGraphEndpoint -Cloud 'usgov' | Should -Be 'https://graph.microsoft.us'
        Get-DrGraphEndpoint -Cloud 'USGovDoD' | Should -Be 'https://dod-graph.microsoft.us'
    }
    It 'records every collection''s state before pausing' {
        $m = New-DrPauseManifest -Invoke $script:Fake.Invoke -Cloud USGov -Reason 'test' -TakenAt '2026-10-30T00:00:00Z'
        @($m.collections).Count | Should -Be 4
        ($m.collections | Where-Object id -EQ 'g2').state_before | Should -Be 'Paused'
        $script:Fake.Calls[0].Uri | Should -BeLike 'https://graph.microsoft.us/v1.0/groups*'
    }
    It 'reports without -Apply and changes nothing' {
        $m = New-DrPauseManifest -Invoke $script:Fake.Invoke -Cloud Global -Reason 'test'
        @(Invoke-DrPause -Manifest $m -Invoke $script:Fake.Invoke).id | Should -Be @('g1', 'g3', 'a1')
        @($script:Fake.Calls | Where-Object Method -EQ 'PATCH') | Should -BeNullOrEmpty
    }
    It 'pauses only what was On, minus the exceptions, and records it' {
        $m = New-DrPauseManifest -Invoke $script:Fake.Invoke -Cloud Global -Reason 'test'
        Invoke-DrPause -Manifest $m -Invoke $script:Fake.Invoke -Except 'g3' -Apply -Now '2026-10-30T00:00:00Z' | Out-Null
        @($m.paused) | Should -Be @('g1', 'a1')
        $script:Fake.State['g3'].state | Should -Be 'On'
        $script:Fake.State['a1'].state | Should -Be 'Paused'
    }
    It 'resumes a critical group at once, and refuses one it did not pause' {
        $m = New-DrPauseManifest -Invoke $script:Fake.Invoke -Cloud Global -Reason 'test'
        Invoke-DrPause -Manifest $m -Invoke $script:Fake.Invoke -Apply -Now '2026-10-30T00:00:00Z' | Out-Null
        Invoke-DrResume -Manifest $m -Invoke $script:Fake.Invoke -Ids 'g1' -Apply | Out-Null
        $script:Fake.State['g1'].state | Should -Be 'On'
        { Invoke-DrResume -Manifest $m -Invoke $script:Fake.Invoke -Ids 'g2' -Apply } | Should -Throw '*Not paused by this manifest*'
    }
    It 'holds noncritical resumes for 24 hours, then resumes only what it paused' {
        $m = New-DrPauseManifest -Invoke $script:Fake.Invoke -Cloud Global -Reason 'test'
        Invoke-DrPause -Manifest $m -Invoke $script:Fake.Invoke -Apply -Now '2026-10-30T00:00:00Z' | Out-Null
        { Invoke-DrResume -Manifest $m -Invoke $script:Fake.Invoke -Apply -Now ([datetimeoffset]'2026-10-30T12:00:00Z') } | Should -Throw '*Too early*'
        Invoke-DrResume -Manifest $m -Invoke $script:Fake.Invoke -Apply -Now ([datetimeoffset]'2026-10-31T00:00:01Z') | Out-Null
        $script:Fake.State['g1'].state | Should -Be 'On'
        $script:Fake.State['a1'].state | Should -Be 'On'
        $script:Fake.State['g2'].state | Should -Be 'Paused'
    }
    It 'resumes in batches' {
        $m = New-DrPauseManifest -Invoke $script:Fake.Invoke -Cloud Global -Reason 'test'
        Invoke-DrPause -Manifest $m -Invoke $script:Fake.Invoke -Apply -Now '2026-10-30T00:00:00Z' | Out-Null
        @(Invoke-DrResume -Manifest $m -Invoke $script:Fake.Invoke -BatchSize 2 -Apply -Now ([datetimeoffset]'2026-11-01T00:00:00Z')).Count | Should -Be 2
        @(Invoke-DrResume -Manifest $m -Invoke $script:Fake.Invoke -BatchSize 2 -Apply -Now ([datetimeoffset]'2026-11-01T00:00:00Z')).Count | Should -Be 1
    }
}
