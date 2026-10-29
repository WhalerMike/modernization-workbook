# The read-only rule, enforced on the source. These tests parse every script and module in the
# kit (not the tests) and fail the build on:
#   - any command with a state-changing verb (Set-, New-, Remove-, Update-, Add- and the rest),
#     or a command that writes, executes or calls out (Out-File, Export-Csv, Invoke-RestMethod,
#     Invoke-AzRestMethod, Invoke-Command, ...); Start-Sleep is the one Start- allowed;
#   - Invoke-MgGraphRequest without a literal -Method GET, except one explicit, read-only call:
#     the beta evaluateDynamicMembership action for VK-DG-03, inside Invoke-VkRuleValidation;
#   - any native program, and any file redirection;
#   - .NET calls that write, delete or move files anywhere but the guarded writers;
#   - a Graph beta path that isn't on the declared list of beta reads.
# Then the runtime guards: a write outside -OutputPath throws.

BeforeDiscovery {
    $kit = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:SourceFiles = @(Get-ChildItem -Path $kit -Recurse -Include *.ps1, *.psm1, *.psd1 |
            Where-Object { $_.FullName -notmatch '[\\/]tests[\\/]' } |
            ForEach-Object { @{ Name = $_.FullName.Substring($kit.Length + 1); Path = $_.FullName } })
}

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    $script:ForbiddenVerbs = 'Set|New|Remove|Update|Add|Enable|Disable|Clear|Rename|Move|Copy|Install|Uninstall|Register|Unregister|Grant|Revoke|' +
        'Reset|Restore|Backup|Start|Stop|Restart|Suspend|Resume|Publish|Push|Send|Sync|Submit|Approve|Deny|Lock|Unlock|Mount|Dismount|Protect|Unprotect|Undo|Save|Edit|Merge'
    $script:AllowedVerbCommands = @('Start-Sleep')
    $script:ForbiddenCommands = @('Out-File', 'Set-Content', 'Add-Content', 'Export-Csv', 'Export-Clixml', 'Tee-Object', 'Invoke-Command', 'Invoke-Expression',
        'Invoke-WebRequest', 'Invoke-RestMethod', 'Invoke-AzRestMethod', 'Invoke-Item', 'Invoke-CimMethod', 'Invoke-WmiMethod', 'Invoke-AzResourceAction',
        'Invoke-AzVMRunCommand', 'Invoke-AzConnectedMachineRunCommand', 'Start-Process', 'Start-Job', 'iex', 'ni', 'rm', 'del', 'mv', 'cp', 'sc', 'ac',
        'azcmagent', 'az', 'curl', 'wget', 'reg', 'netsh', 'dsacls', 'setspn')
    $script:Writers = 'Resolve-VkOutputRoot', 'Assert-VkWritePath', 'Write-VkJson', 'Write-VkCsv', 'Write-VkText'
    $script:WriteMembers = 'WriteAllText|WriteAllBytes|WriteAllLines|AppendAllText|AppendAllLines|AppendText|CreateText|Create|CreateDirectory|Delete|Move|Copy|Replace|Encrypt|Decrypt|SetAccessControl|SetAttributes|OpenWrite'
    # The only Graph beta reads the kit makes, each marked beta in the catalog and the README.
    $script:AllowedBeta = @('/beta/groups/evaluateDynamicMembership', '/beta/groups', '/beta/deviceManagement/configurationPolicies', '/beta/reports/servicePrincipalSignInActivities')

    function Get-Ast([string]$Path) {
        $tokens = $null; $errors = $null
        $ast = [System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$tokens, [ref]$errors)
        $errors | Should -BeNullOrEmpty
        $ast
    }
    function Get-EnclosingFunction($Node) {
        $p = $Node.Parent
        while ($p -and $p -isnot [System.Management.Automation.Language.FunctionDefinitionAst]) { $p = $p.Parent }
        if ($p) { $p.Name } else { $null }
    }
    function Get-NamedArgument($Command, [string]$Name) {
        # The AST node after -Name, or $null; -Name:value is handled too.
        $els = @($Command.CommandElements)
        for ($i = 0; $i -lt $els.Count; $i++) {
            $e = $els[$i]
            if ($e -is [System.Management.Automation.Language.CommandParameterAst] -and $e.ParameterName -ieq $Name) {
                if ($e.Argument) { return $e.Argument }
                if ($i + 1 -lt $els.Count) { return $els[$i + 1] }
            }
        }
        $null
    }
    function Get-SafetyViolation($Ast) {
        foreach ($c in @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true))) {
            $name = $c.GetCommandName()
            if (-not $name) {
                # Only the kit's own scriptblocks and check functions may be invoked indirectly.
                if ($c.InvocationOperator -eq 'Ampersand' -and $c.CommandElements[0].Extent.Text -in '$Body', '$Reader', '$fn') { continue }
                # The module dot-sources its own files, by paths under its own folder.
                if ($c.InvocationOperator -eq 'Dot' -and $c.CommandElements[0].Extent.Text -match '^\(Join-Path \(Join-Path \$here ') { continue }
                "command: line $($c.Extent.StartLineNumber): dynamic command $($c.Extent.Text)"; continue
            }
            $bare = $name -replace '\.exe$', ''
            if (($name -match "^($ForbiddenVerbs)-" -and $AllowedVerbCommands -notcontains $name) -or $ForbiddenCommands -contains $bare) {
                "command: line $($c.Extent.StartLineNumber): $name"
            }
            if ($name -match '\.(exe|com|bat|cmd)$') { "native: line $($c.Extent.StartLineNumber): $name" }
            if ($name -eq 'Invoke-MgGraphRequest') {
                $m = Get-NamedArgument $c 'Method'
                $method = if ($m -is [System.Management.Automation.Language.StringConstantExpressionAst]) { $m.Value } else { $null }
                $fn = Get-EnclosingFunction $c
                if ($method -eq 'GET') { continue }
                if ($method -eq 'POST' -and $fn -eq 'Invoke-VkRuleValidation') { continue }
                "graph: line $($c.Extent.StartLineNumber) in ${fn}: Invoke-MgGraphRequest -Method $(if ($m) { $m.Extent.Text } else { '(none)' })"
            }
        }
        foreach ($r in @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst] }, $true))) {
            "redirect: line $($r.Extent.StartLineNumber)"
        }
        foreach ($m in @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.InvokeMemberExpressionAst] }, $true))) {
            $member = $m.Member.Extent.Text.Trim("'", '"')
            if ($member -match "^($WriteMembers)$" -and $m.Expression.Extent.Text -match '(?i)IO\.(File|Directory|FileInfo|DirectoryInfo)|\[System\.IO') {
                $fn = Get-EnclosingFunction $m
                if ($Writers -notcontains $fn) { "file: line $($m.Extent.StartLineNumber) in ${fn}: $($m.Extent.Text)" }
            }
        }
        foreach ($s in @($Ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.StringConstantExpressionAst] -or $n -is [System.Management.Automation.Language.ExpandableStringExpressionAst] }, $true))) {
            foreach ($hit in [regex]::Matches("$($s.Value)", '/beta/[A-Za-z]+(/[A-Za-z]+)?')) {
                if ($AllowedBeta -notcontains $hit.Value) { "beta: line $($s.Extent.StartLineNumber): $($hit.Value)" }
            }
        }
    }
}

Describe 'No write path in <Name>' -ForEach $SourceFiles {
    BeforeAll { $v = @(Get-SafetyViolation (Get-Ast $Path)) }

    It 'calls no command with a state-changing verb, or that writes, executes or calls out' {
        @($v | Where-Object { $_ -like 'command:*' }) | Should -BeNullOrEmpty
    }
    It 'calls Microsoft Graph with GET only, apart from the explicit read-only rule validation' {
        @($v | Where-Object { $_ -like 'graph:*' }) | Should -BeNullOrEmpty
    }
    It 'runs no native program and uses no file redirection' {
        @($v | Where-Object { $_ -like 'native:*' -or $_ -like 'redirect:*' }) | Should -BeNullOrEmpty
    }
    It 'writes, deletes or moves files only inside the guarded writers' {
        @($v | Where-Object { $_ -like 'file:*' }) | Should -BeNullOrEmpty
    }
    It 'reads only the declared Graph beta endpoints' {
        @($v | Where-Object { $_ -like 'beta:*' }) | Should -BeNullOrEmpty
    }
}

Describe 'The read-only exception' {
    It 'is exactly one non-GET Graph call in the whole kit, a POST to evaluateDynamicMembership' {
        $calls = foreach ($f in $SourceFiles) {
            $ast = Get-Ast $f.Path
            foreach ($c in @($ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] -and $n.GetCommandName() -eq 'Invoke-MgGraphRequest' }, $true))) {
                $m = Get-NamedArgument $c 'Method'
                if ($m.Value -ne 'GET') { [pscustomobject]@{ Method = $m.Value; Function = (Get-EnclosingFunction $c); Node = $c } }
            }
        }
        @($calls).Count | Should -Be 1
        $calls[0].Method | Should -Be 'POST'
        $calls[0].Function | Should -Be 'Invoke-VkRuleValidation'
        $fn = $calls[0].Node.Parent
        while ($fn -isnot [System.Management.Automation.Language.FunctionDefinitionAst]) { $fn = $fn.Parent }
        $paths = @($fn.FindAll({ param($n) $n -is [System.Management.Automation.Language.StringConstantExpressionAst] -and $n.Value -like '/beta/*' }, $true) | ForEach-Object { $_.Value })
        $paths | Should -Not -BeNullOrEmpty
        foreach ($p in $paths) { $p | Should -Match '^/beta/groups/(evaluateDynamicMembership)?$' }
        $fn.Body.Extent.Text | Should -Match "'/evaluateDynamicMembership'"
    }
}

Describe 'The checks themselves' {
    It 'catch every kind of planted violation' {
        $planted = @'
function Get-Thing {
    Set-MgUser -UserId x -Department y
    New-AzRoleAssignment -ObjectId x
    Remove-MgGroup -GroupId x
    Update-MgDevice -DeviceId x
    Add-MgGroupMember -GroupId x
    Invoke-MgGraphRequest -Method PATCH -Uri '/v1.0/devices/x'
    Invoke-MgGraphRequest -Method $m -Uri '/v1.0/users'
    Invoke-MgGraphRequest -Uri '/v1.0/users'
    Invoke-AzRestMethod -Method PUT -Path '/subscriptions/x'
    azcmagent.exe connect
    'x' > C:\out.txt
    [System.IO.File]::WriteAllText('C:\x', 'y')
    $u = '/beta/users/x/authentication'
}
'@
        $ast = [System.Management.Automation.Language.Parser]::ParseInput($planted, [ref]$null, [ref]$null)
        $v = @(Get-SafetyViolation $ast)
        foreach ($kind in 'command', 'graph', 'native', 'redirect', 'file', 'beta') { @($v | Where-Object { $_ -like "${kind}:*" }).Count | Should -BeGreaterThan 0 -Because $kind }
        @($v | Where-Object { $_ -like 'command:*' }).Count | Should -BeGreaterOrEqual 6
        @($v | Where-Object { $_ -like 'graph:*' }).Count | Should -Be 3
    }
    It 'allow a POST only inside Invoke-VkRuleValidation' {
        $ok = [System.Management.Automation.Language.Parser]::ParseInput("function Invoke-VkRuleValidation { Invoke-MgGraphRequest -Method POST -Uri '/beta/groups/evaluateDynamicMembership' }", [ref]$null, [ref]$null)
        @(Get-SafetyViolation $ok) | Should -BeNullOrEmpty
        $bad = [System.Management.Automation.Language.Parser]::ParseInput("function Get-Other { Invoke-MgGraphRequest -Method POST -Uri '/beta/groups/evaluateDynamicMembership' }", [ref]$null, [ref]$null)
        @(Get-SafetyViolation $bad | Where-Object { $_ -like 'graph:*' }).Count | Should -Be 1
    }
}

Describe 'Runtime guards' {
    It 'refuses to write outside a registered -OutputPath' {
        $inside = Join-Path $TestDrive 'out'
        $outside = Join-Path $TestDrive 'elsewhere.json'
        & (Get-Module ValidationKit) {
            param($in, $out)
            $root = Resolve-VkOutputRoot -OutputPath $in
            Write-VkJson -InputObject @{ a = 1 } -Path (Join-Path $root 'ok.json')
            { Write-VkJson -InputObject @{ a = 1 } -Path $out } | Should -Throw '*outside -OutputPath*'
            { Write-VkText -Value 'x' -Path (Join-Path $root '..\escape.txt') } | Should -Throw '*outside -OutputPath*'
            { Write-VkJson -InputObject 1 -Path ($root + 'sibling\x.json') } | Should -Throw '*outside -OutputPath*'
        } $inside $outside
        Join-Path $inside 'ok.json' | Should -Exist
        $outside | Should -Not -Exist
    }
}
