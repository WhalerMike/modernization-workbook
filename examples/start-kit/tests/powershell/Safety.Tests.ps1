# The read-only rule, enforced on the source. These tests parse every script and module in
# the kit (not the tests) and fail on:
#   - any command with a state-changing verb (Set-, New-, Remove-, Add-, Enable-, ...) or any
#     other command that writes, executes or calls out (Out-File, Export-Csv, Invoke-Command, ...);
#   - any native program except certutil.exe, and certutil without -getreg;
#   - file redirection (>, >>);
#   - .NET calls that write, delete or move files anywhere but the guarded writers;
#   - ExecuteNonQuery, or T-SQL sent from anywhere but Invoke-FMPSqlQuery;
#   - any T-SQL string in the SQL module that isn't a single SELECT.
# Then they check the runtime guards: writing outside -OutputPath throws, and so does T-SQL
# that isn't a SELECT.

BeforeDiscovery {
    $kit = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:SourceFiles = @(Get-ChildItem -Path $kit -Recurse -Include *.ps1, *.psm1, *.psd1 |
            Where-Object { $_.FullName -notmatch '[\\/]tests[\\/]' } |
            ForEach-Object { @{ Name = $_.FullName.Substring($kit.Length + 1); Path = $_.FullName } })
}

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    $script:ForbiddenVerbs = 'Set|New|Remove|Add|Enable|Disable|Clear|Rename|Move|Copy|Install|Uninstall|Register|Unregister|' +
        'Grant|Revoke|Reset|Restore|Backup|Start|Stop|Restart|Suspend|Resume|Update|Publish|Push|Write-EventLog|Unblock|Protect|Unprotect|Lock|Unlock|Mount|Dismount|Send|Sync|Undo|Approve|Deny|Submit|Initialize-Disk'
    $script:ForbiddenCommands = @('Out-File', 'Set-Content', 'Add-Content', 'Export-Csv', 'Export-Clixml', 'Tee-Object', 'Invoke-Command',
        'Invoke-Expression', 'Invoke-WebRequest', 'Invoke-RestMethod', 'Invoke-Item', 'Invoke-CimMethod', 'Invoke-WmiMethod', 'Invoke-Sqlcmd',
        'Import-GPO', 'Enter-PSSession', 'Start-Process', 'Start-Job', 'iex', 'ni', 'rm', 'del', 'mv', 'cp', 'sc', 'ac', 'Backup-GPO',
        'dsacls', 'setspn', 'netdom', 'ntdsutil', 'repadmin', 'dnscmd', 'netsh', 'reg', 'sqlcmd', 'bcp', 'icacls', 'wmic')
    # The only functions allowed to write files: the guarded writers in StartKit.Common.ps1.
    $script:Writers = 'Resolve-FMPOutputRoot', 'Initialize-FMPPath', 'Write-FMPJson', 'Write-FMPCsv', 'Write-FMPText', 'Write-FMPBytes'
    $script:WriteMembers = 'WriteAllText|WriteAllBytes|WriteAllLines|AppendAllText|AppendAllLines|AppendText|CreateText|Create|CreateDirectory|Delete|Move|Copy|Replace|Encrypt|Decrypt|SetAccessControl|SetAttributes|OpenWrite'

    function Get-Ast([string]$Path) {
        $tokens = $null; $errors = $null
        $ast = [System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$tokens, [ref]$errors)
        $errors | Should -BeNullOrEmpty
        $ast
    }
    function Get-SafetyViolation($Ast) {
        $commands = @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true))
        foreach ($c in $commands) {
            $name = $c.GetCommandName()
            if (-not $name) { continue }
            if ($name -match "^($ForbiddenVerbs)-" -or $ForbiddenCommands -contains $name -or $ForbiddenCommands -contains ($name -replace '\.exe$', '')) {
                "command: line $($c.Extent.StartLineNumber): $name"
            }
            if ($name -match '\.(exe|com|bat|cmd)$') {
                $elements = @($c.CommandElements | ForEach-Object { $_.Extent.Text })
                if ($name -ne 'certutil.exe' -or $elements -notcontains '-getreg' -or ($elements -match '^-(setreg|delreg|install|import|dsPublish|addstore|delstore|repairstore|shutdown|revoke|resubmit|deny)')) {
                    "native: line $($c.Extent.StartLineNumber): $($c.Extent.Text)"
                }
            }
        }
        foreach ($r in @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst] }, $true))) {
            "redirect: line $($r.Extent.StartLineNumber)"
        }
        $members = @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.InvokeMemberExpressionAst] }, $true))
        foreach ($m in $members) {
            $member = $m.Member.Extent.Text.Trim("'", '"')
            if ($member -match "^($WriteMembers)$" -and $m.Expression.Extent.Text -match '(?i)IO\.(File|Directory|FileInfo|DirectoryInfo)|\[System\.IO|\$') {
                $fn = Get-EnclosingFunction $m
                if ($Writers -notcontains $fn) { "file: line $($m.Extent.StartLineNumber) in ${fn}: $($m.Extent.Text)" }
            }
            if ($member -match '^(ExecuteNonQuery|ExecuteScalar|ExecuteXmlReader|BeginExecuteNonQuery)$') { "sql: line $($m.Extent.StartLineNumber): $member" }
            if ($member -eq 'ExecuteReader' -and (Get-EnclosingFunction $m) -ne 'Invoke-FMPSqlQuery') { "sql: line $($m.Extent.StartLineNumber): ExecuteReader outside Invoke-FMPSqlQuery" }
        }
        foreach ($a in @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.AssignmentStatementAst] -and $n.Left.Extent.Text -match 'CommandText$' }, $true))) {
            if ((Get-EnclosingFunction $a) -ne 'Invoke-FMPSqlQuery') { "sql: line $($a.Extent.StartLineNumber): CommandText set outside Invoke-FMPSqlQuery" }
        }
    }
    function Get-EnclosingFunction($Node) {
        $p = $Node.Parent
        while ($p -and $p -isnot [System.Management.Automation.Language.FunctionDefinitionAst]) { $p = $p.Parent }
        if ($p) { $p.Name } else { $null }
    }
}

Describe 'No write commands in <Name>' -ForEach $SourceFiles {
    BeforeAll { $v = @(Get-SafetyViolation (Get-Ast $Path)) }

    It 'calls no command with a state-changing verb or a write, execute or remote command' {
        @($v | Where-Object { $_ -like 'command:*' }) | Should -BeNullOrEmpty
    }
    It 'runs no native program but certutil, and certutil only with -getreg' {
        @($v | Where-Object { $_ -like 'native:*' }) | Should -BeNullOrEmpty
    }
    It 'uses no file redirection' {
        @($v | Where-Object { $_ -like 'redirect:*' }) | Should -BeNullOrEmpty
    }
    It 'writes, deletes or moves files only inside the guarded writers' {
        @($v | Where-Object { $_ -like 'file:*' }) | Should -BeNullOrEmpty
    }
    It 'never calls ExecuteNonQuery, and sends T-SQL only from Invoke-FMPSqlQuery' {
        @($v | Where-Object { $_ -like 'sql:*' }) | Should -BeNullOrEmpty
    }
}

Describe 'The checks themselves' {
    It 'catch every kind of planted violation' {
        $planted = @'
function Get-Thing {
    Set-ADUser -Identity x -Description y
    New-Object System.IO.FileInfo 'x'
    Export-Csv -Path C:\x.csv
    Invoke-Command -ComputerName dc01 -ScriptBlock { }
    setspn.exe -A HTTP/x y
    certutil.exe -setreg policy\EditFlags +1
    'x' > C:\out.txt
    [System.IO.File]::WriteAllText('C:\x', 'y')
    $cmd.ExecuteNonQuery()
    $cmd.CommandText = 'DELETE FROM t'
}
'@
        $ast = [System.Management.Automation.Language.Parser]::ParseInput($planted, [ref]$null, [ref]$null)
        $v = @(Get-SafetyViolation $ast)
        foreach ($kind in 'command', 'native', 'redirect', 'file', 'sql') { @($v | Where-Object { $_ -like "${kind}:*" }).Count | Should -BeGreaterThan 0 -Because $kind }
        @($v | Where-Object { $_ -like 'command:*' }).Count | Should -BeGreaterOrEqual 4
    }
}

Describe 'T-SQL in the SQL module' {
    BeforeAll {
        Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') -Force
        $ast = Get-Ast (Join-Path (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') 'FMPSqlEstate.psm1')
        $sqlStrings = @($ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.StringConstantExpressionAst] -or $n -is [System.Management.Automation.Language.ExpandableStringExpressionAst] }, $true) |
                Where-Object { $_.Value -match '(?is)^\s*(SELECT|WITH)\b.*\bFROM\b|SERVERPROPERTY\(' })
    }
    It 'finds the catalog queries in the source' {
        $sqlStrings.Count | Should -BeGreaterOrEqual 6
    }
    It 'has only single SELECT statements' {
        @($sqlStrings | Where-Object { -not (Test-FMPSelectOnly -Query $_.Value) } | ForEach-Object { "line $($_.Extent.StartLineNumber)" }) | Should -BeNullOrEmpty
    }
    It 'checks every statement before it is sent' {
        $fn = $ast.Find({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Invoke-FMPSqlQuery' }, $true)
        $fn.Body.Extent.Text | Should -Match 'Test-FMPSelectOnly'
        $first = $fn.Body.EndBlock.Statements[0].Extent.Text
        $first | Should -Match 'Test-FMPSelectOnly'
    }
}

Describe 'Runtime guards' {
    BeforeAll {
        Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
        Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') -Force
    }
    It 'refuses to write outside a registered -OutputPath' {
        $inside = Join-Path $TestDrive 'out'
        $outside = Join-Path $TestDrive 'elsewhere.json'
        & (Get-Module FMPADAssessment) {
            param($in, $out)
            $root = Resolve-FMPOutputRoot -OutputPath $in
            Write-FMPJson -InputObject @{ a = 1 } -Path (Join-Path $root 'ok.json')
            { Write-FMPJson -InputObject @{ a = 1 } -Path $out } | Should -Throw '*outside -OutputPath*'
            { Write-FMPText -Value 'x' -Path (Join-Path $root '..\escape.txt') } | Should -Throw '*outside -OutputPath*'
            { Write-FMPJson -InputObject 1 -Path ($root + 'sibling\x.json') } | Should -Throw '*outside -OutputPath*'
        } $inside $outside
        Join-Path $inside 'ok.json' | Should -Exist
        $outside | Should -Not -Exist
    }
    It 'refuses T-SQL that is not a single SELECT, before connecting' {
        & (Get-Module FMPSqlEstate) {
            { Invoke-FMPSqlQuery -ConnectionString 'Server=tcp:192.0.2.1,1;Connect Timeout=1' -Query 'DROP DATABASE x' } | Should -Throw '*not a single SELECT*'
        }
    }
    It 'writes a provenance manifest with a hash of every file' {
        $run = Join-Path $TestDrive 'prov'
        & (Get-Module FMPADAssessment) {
            param($run)
            $root = Resolve-FMPOutputRoot -OutputPath $run
            Write-FMPText -Value 'hello' -Path (Join-Path $root 'a.txt')
            $m = Write-FMPManifest -RunPath $root -RunId 'test' -StartTime ([datetime]'2026-10-27') -Tier 'A' -Forest 'contoso.example' -Domains 'contoso.example' -Steps @()
            $m.FileCount | Should -Be 1
            $m.Files[0].RelativePath | Should -Be 'a.txt'
            $m.Files[0].SHA256 | Should -Be '2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824'
            $m.ReadOnly | Should -BeTrue
            $m.ExecutedBy | Should -Not -BeNullOrEmpty
            $m.ModuleVersions.PSObject.Properties.Name | Should -Contain 'ActiveDirectory'
        } $run
        (Get-Content -Raw (Join-Path $run 'AssessmentManifest.json') | ConvertFrom-Json).Files.RelativePath | Should -Be @('a.txt')
    }
    It 'builds Book 01''s run identifier' {
        & (Get-Module FMPADAssessment) {
            ConvertTo-FMPRunId -AsOf ([datetime]::SpecifyKind([datetime]'2026-04-24T10:30:00', 'Utc')) -HostName 'ASSESS-01' -Tier B | Should -Be '2026-04-24-1030-assess-01-tierB'
        }
    }
}
