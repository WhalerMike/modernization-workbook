# Large directories: paged and partitioned reads, retry with backoff, streamed output,
# checkpoints and -Resume, the run log, progress and heartbeats. Unit tests with fakes; the
# timings against a synthetic 500,000-user domain come from tests/perf/Measure-FMPScale.ps1.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
    $script:M = Get-Module FMPADAssessment
}
AfterAll { Remove-Variable -Name FMPRunContext -Scope Global -ErrorAction SilentlyContinue }

Describe 'Retry' {
    It 'treats timeouts, busy and unavailable servers and expired enumerations as transient' {
        & $M {
            Test-FMPTransientError ([System.TimeoutException]::new('x')) | Should -BeTrue
            Test-FMPTransientError ([System.Exception]::new('The server has returned the following error: invalid enumeration context.')) | Should -BeTrue
            Test-FMPTransientError ([System.Exception]::new('outer', [System.TimeoutException]::new('inner'))) | Should -BeTrue
            Test-FMPTransientError ([System.Exception]::new('Access is denied.')) | Should -BeFalse
            Test-FMPTransientError ([System.ArgumentException]::new('Cannot find an object with identity')) | Should -BeFalse
        }
    }
    It 'retries a transient failure and returns the result' {
        & $M {
            $script:n = 0
            $r = Invoke-FMPWithRetry -Activity 't' -BaseSeconds 0 -MaxRetries 3 -ScriptBlock { $script:n++; if ($script:n -lt 3) { throw [System.TimeoutException]::new('slow') }; 'ok' }
            $r | Should -Be 'ok'
            $script:n | Should -Be 3
        }
    }
    It 'throws a permanent failure at once, and a transient one after the last attempt' {
        & $M {
            $script:n = 0
            { Invoke-FMPWithRetry -Activity 't' -BaseSeconds 0 -ScriptBlock { $script:n++; throw 'Access is denied.' } } | Should -Throw '*denied*'
            $script:n | Should -Be 1
            $script:n = 0
            { Invoke-FMPWithRetry -Activity 't' -BaseSeconds 0 -MaxRetries 2 -ScriptBlock { $script:n++; throw [System.TimeoutException]::new('slow') } } | Should -Throw '*slow*'
            $script:n | Should -Be 3
        }
    }
}

Describe 'Partitioned reads' {
    BeforeEach {
        $run = Join-Path $TestDrive ([guid]::NewGuid().ToString('N'))
        & $M { param($r) $null = Initialize-FMPRunContext -RunPath $r -Quiet -RetryBaseSeconds 0 } $run
        $parts = @(
            [pscustomobject]@{ Id = 'head'; Label = 'DC=x'; SearchBase = 'DC=x'; SearchScope = 'OneLevel' }
            [pscustomobject]@{ Id = 'p1'; Label = 'OU=A,DC=x'; SearchBase = 'OU=A,DC=x'; SearchScope = 'Subtree' }
            [pscustomobject]@{ Id = 'p2'; Label = 'OU=B,DC=x'; SearchBase = 'OU=B,DC=x'; SearchScope = 'Subtree' }
        )
    }
    It 'retries a partition that fails halfway without counting any object twice' {
        $result = & $M {
            param($run, $parts)
            $script:failed = $false
            $read = {
                param($p, $pageSize)
                foreach ($i in 1..5) {
                    if ($p.Id -eq 'p1' -and $i -eq 3 -and -not $script:failed) { $script:failed = $true; throw [System.TimeoutException]::new('ADWS timeout') }
                    [pscustomobject]@{ Name = "$($p.Id)-$i"; Enabled = ($i % 2) -eq 0; Page = $pageSize }
                }
            }
            $project = { param($o) [pscustomobject]@{ Name = $o.Name; Enabled = $o.Enabled; Page = $o.Page } }
            $derive = { param($r, $acc) if ($r.Enabled) { Measure-FMPDerived -Acc $acc -Key 'Enabled' } }
            $parts2 = @(Invoke-FMPPartitionedRead -Name 'Things' -Domain 'x.example' -WorkPath $run -Read $read -Project $project -Derive $derive -Partition $parts)
            Join-FMPJsonParts -Path (Join-Path $run 'Things.json') -PartPath @($parts2 | ForEach-Object { $_.PartFile })
            [pscustomobject]@{ Rows = @(Read-FMPJsonArray -Path (Join-Path $run 'Things.json')); Enabled = (Get-FMPDerivedSum -Parts $parts2 -Key 'Enabled'); Count = (Get-FMPDerivedSum -Parts $parts2 -Key 'Count') }
        } $run $parts
        $result.Rows.Count | Should -Be 15
        @($result.Rows.Name | Sort-Object -Unique).Count | Should -Be 15
        $result.Count | Should -Be 15
        $result.Enabled | Should -Be 6
        @($result.Rows.Page | Sort-Object -Unique) | Should -Be @(256)
        Get-Content (Join-Path $run 'RunLog.txt') -Raw | Should -Match 'attempt 1 of 5 failed \(ADWS timeout\)'
    }
    It 'with -Resume, skips the partitions a stopped run finished' {
        $calls = & $M {
            param($run, $parts)
            $script:calls = @()
            $script:stopAt = 'p2'
            $read = { param($p, $s) $script:calls += $p.Id; if ($p.Id -eq $script:stopAt) { throw 'Access is denied.' }; [pscustomobject]@{ Name = $p.Id } }
            $project = { param($o) $o }
            { Invoke-FMPPartitionedRead -Name 'Things' -Domain 'x.example' -WorkPath $run -Read $read -Project $project -Partition $parts } | Should -Throw
            $first = $script:calls
            $null = Initialize-FMPRunContext -RunPath $run -Quiet -RetryBaseSeconds 0 -Resume
            $script:calls = @(); $script:stopAt = 'none'
            $p2 = @(Invoke-FMPPartitionedRead -Name 'Things' -Domain 'x.example' -WorkPath $run -Read $read -Project $project -Partition $parts)
            [pscustomobject]@{ First = $first; Second = $script:calls; Total = (Get-FMPDerivedSum -Parts $p2 -Key 'Count') }
        } $run $parts
        $calls.First | Should -Be @('head', 'p1', 'p2')
        $calls.Second | Should -Be @('p2')
        $calls.Total | Should -Be 3
    }
    It 'reads back both the streamed format and an ordinary JSON array' {
        & $M {
            param($run)
            Write-FMPJson -InputObject @([pscustomobject]@{ a = 1 }, [pscustomobject]@{ a = 2 }) -Path (Join-Path $run 'plain.json')
            @(Read-FMPJsonArray -Path (Join-Path $run 'plain.json')).a | Should -Be @(1, 2)
            Write-FMPText -Value @('{"a":3}', '{"a":4}') -Path (Join-Path $run 'p.jsonl')
            Join-FMPJsonParts -Path (Join-Path $run 'joined.json') -PartPath @((Join-Path $run 'p.jsonl'))
            @(Read-FMPJsonArray -Path (Join-Path $run 'joined.json')).a | Should -Be @(3, 4)
            @((Get-Content (Join-Path $run 'joined.json') -Raw | ConvertFrom-Json)).a | Should -Be @(3, 4)
        } $run
    }
    It 'splits a domain into the head and its OUs and containers, leaving out leaf objects' {
        Register-KitAdMocks -ModuleName FMPADAssessment
        $p = @(& $M { Get-FMPAdPartition -Domain 'contoso.example' })
        $p[0].Id | Should -Be 'head'
        $p[0].SearchScope | Should -Be 'OneLevel'
        @($p | Where-Object SearchScope -eq 'Subtree').SearchBase | Should -Contain 'CN=Users,DC=contoso,DC=example'
    }
}

Describe 'Run log, progress and step lines' {
    It 'writes heartbeats and a summary line with the count and duration' {
        $run = Join-Path $TestDrive 'beat'
        & $M {
            param($run)
            $null = Initialize-FMPRunContext -RunPath $run -Quiet -HeartbeatObjects 2
            $t = Initialize-FMPProgress -Activity 'Widgets (x.example)' -Total 4
            1..4 | ForEach-Object { Step-FMPProgress -Tracker $t }
            $null = Complete-FMPProgress -Tracker $t
            $step = Invoke-FMPStep 'Widgets' { [pscustomobject]@{ ObjectCount = 4 } }
            $step.ObjectCount | Should -Be 4
        } $run
        $log = Get-Content (Join-Path $run 'RunLog.txt')
        @($log | Where-Object { $_ -match 'HEARTBEAT\s+Widgets \(x\.example\): \d+ objects' }).Count | Should -BeGreaterOrEqual 2
        $log | Should -Contain ($log | Where-Object { $_ -match 'STEP\s+Widgets \(x\.example\): 4 objects in \d\d:\d\d:\d\d' })
        @($log | Where-Object { $_ -match 'STEP\s+Widgets: Completed, 4 objects in' }).Count | Should -Be 1
        (Get-Content (Join-Path $run 'RunState.json') -Raw | ConvertFrom-Json).Steps[0].Status | Should -Be 'Completed'
    }
    It 'skips a completed step on -Resume' {
        $run = Join-Path $TestDrive 'resume'
        & $M {
            param($run)
            $null = Initialize-FMPRunContext -RunPath $run -Quiet
            $null = Invoke-FMPStep 'Once' { 1 }
            $null = Initialize-FMPRunContext -RunPath $run -Quiet -Resume
            $script:ran = $false
            $r = Invoke-FMPStep 'Once' { $script:ran = $true }
            $r.Resumed | Should -BeTrue
            $script:ran | Should -BeFalse
        } $run
    }
    It 'gives a percentage and time left from the partitions done when no total is known' {
        & $M {
            $t = Initialize-FMPProgress -Activity 'x' -PartitionCount 4
            $t.PartitionsDone = 1; $t.Count = 10
            (Get-FMPProgressText -Tracker $t).Text | Should -Match 'partition 2 of 4, 25%'
        }
    }
}

Describe 'Distinguished names and privileged groups' {
    It 'finds the parent of a DN with an escaped comma' {
        & $M { Get-FMPParentDN -DN 'CN=Smith\, Jo,OU=Staff,DC=contoso,DC=example' } | Should -Be 'OU=Staff,DC=contoso,DC=example'
    }
    It 'looks up privileged groups by well-known SID, Enterprise and Schema Admins in the root domain' {
        Register-KitAdMocks -ModuleName FMPADAssessment
        $g = @(& $M { Get-FMPPrivilegedGroupSid -Domain 'child.contoso.example' -RootDomain 'contoso.example' })
        ($g | Where-Object Name -eq 'Domain Admins').Sid | Should -Be 'S-1-5-21-2000-2000-2000-512'
        ($g | Where-Object Name -eq 'Enterprise Admins').Sid | Should -Be 'S-1-5-21-1000-1000-1000-519'
        ($g | Where-Object Name -eq 'Enterprise Admins').Server | Should -Be 'contoso.example'
        ($g | Where-Object Name -eq 'Administrators').Sid | Should -Be 'S-1-5-32-544'
    }
}
