#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Baseline: what Learn's GuestConfiguration cmdlets and Microsoft's pinned sample do on their own,
# pinned so a module update that changes any of it fails here first. Every test is offline: nothing
# signs in, uploads or installs the agent. Needs the module versions in ../RequiredModules.psd1;
# point MC_MODULE_PATH at a Save-Module folder, or the whole file is skipped.
#
#   Save-Module GuestConfiguration -RequiredVersion 4.12.0 -Path ./mcmods
#   Save-Module PSDesiredStateConfiguration -RequiredVersion 2.0.7 -Path ./mcmods
#   Save-Module PSDscResources -RequiredVersion 2.12.0.0 -Path ./mcmods
#   $env:MC_MODULE_PATH = (Resolve-Path ./mcmods).Path

BeforeDiscovery {
    $kit = Resolve-Path (Join-Path $PSScriptRoot '..')
    $required = Import-PowerShellDataFile (Join-Path $kit 'RequiredModules.psd1')
    $paths = @($env:MC_MODULE_PATH) + ($env:PSModulePath -split [IO.Path]::PathSeparator) | Where-Object { $_ }
    $script:HasModules = $true
    foreach ($m in $required.Keys) {
        $found = $paths | Where-Object { Test-Path (Join-Path $_ "$m/$($required[$m])") }
        if (-not $found) { $script:HasModules = $false }
    }
}

Describe 'Learn baseline (GuestConfiguration 4.12.0)' -Skip:(-not $script:HasModules) {
    BeforeAll {
        $script:Kit = Resolve-Path (Join-Path $PSScriptRoot '..')
        $script:Pinned = Join-Path $script:Kit '../third_party/guest-configuration-samples/package-samples/.example-project'
        if ($env:MC_MODULE_PATH) { $env:PSModulePath = $env:MC_MODULE_PATH + [IO.Path]::PathSeparator + $env:PSModulePath }
        $required = Import-PowerShellDataFile (Join-Path $script:Kit 'RequiredModules.psd1')
        Import-Module PSDesiredStateConfiguration -RequiredVersion $required.PSDesiredStateConfiguration -Force
        Import-Module GuestConfiguration -RequiredVersion $required.GuestConfiguration -Force
        Import-Module (Join-Path $script:Kit 'powershell/McPipeline.psm1') -Force
        $script:Release = Get-McReleaseEntry -Path (Join-Path $script:Kit 'config/releases.json') -Name 'TlsServerProtocols'

        . (Join-Path $script:Kit 'configurations/TlsServerProtocols.ps1')
        TlsServerProtocols -OutputPath (Join-Path $TestDrive 'c1') | Out-Null
        TlsServerProtocols -OutputPath (Join-Path $TestDrive 'c2') | Out-Null
        $script:Compiled = Join-Path $TestDrive 'c1/localhost.mof'
        $script:Clean = ConvertTo-McCleanMof -Path $script:Compiled -Destination (Join-Path $TestDrive 'TlsServerProtocols_1.0.0.mof')
        $script:Pkg1 = New-GuestConfigurationPackage -Name 'TlsServerProtocols_1.0.0' -Configuration $script:Clean.FullName -Type Audit -Path (Join-Path $TestDrive 'p1') -Force
        Start-Sleep -Seconds 2
        $script:Pkg2 = New-GuestConfigurationPackage -Name 'TlsServerProtocols_1.0.0' -Configuration $script:Clean.FullName -Type Audit -Path (Join-Path $TestDrive 'p2') -Force
        $script:Uri = 'https://stcontosomc.blob.core.windows.net/machine-configuration/TlsServerProtocols_1.0.0.zip'
        $script:PolicyParams = @{
            PolicyId = $script:Release.policyId; ContentUri = $script:Uri; DisplayName = 'baseline'; Description = 'baseline'
            Platform = 'Windows'; PolicyVersion = '1.0.0'; LocalContentPath = $script:Pkg1.Path; UseSystemAssignedIdentity = $true
        }
        $script:Policy = New-GuestConfigurationPolicy @script:PolicyParams -Path (Join-Path $TestDrive 'pol')
        $script:Def = Get-Content $script:Policy.Path -Raw | ConvertFrom-Json
    }

    Context 'Compiling' {
        It 'records the user, host and absolute script path in the MOF' {
            $f = Test-McMofText -Text (Get-Content $script:Compiled -Raw)
            @($f | Where-Object Rule -EQ 'MC-PKG-04').Count | Should -Be 2
        }
        It 'writes MOFs that clean to the same bytes' {
            $b = ConvertTo-McCleanMof -Path (Join-Path $TestDrive 'c2/localhost.mof') -Destination (Join-Path $TestDrive 'c2/clean.mof')
            Get-McFileSha256 $b.FullName | Should -Be (Get-McFileSha256 $script:Clean.FullName)
        }
        It "parses the cleaned MOF, with DSC's own deserializer, to the same resources" {
            $cache = [Microsoft.PowerShell.DesiredStateConfiguration.Internal.DscClassCache]
            $cache::Initialize()
            $cache::ImportClassResourcesFromModule((Get-Module -ListAvailable PSDscResources | Select-Object -First 1), [string[]]@('*'), $null) | Out-Null
            $show = {
                param($Path)
                @($cache::ImportInstances($Path, 0) | ForEach-Object {
                        $_.CimClass.CimClassName + ' ' + (($_.CimInstanceProperties | Where-Object Name -NotIn 'SourceInfo', 'Author', 'GenerationDate', 'GenerationHost' |
                                    Sort-Object Name | ForEach-Object { $_.Name + '=' + ($_.Value -join ',') }) -join ';')
                    })
            }
            $before = & $show $script:Compiled
            $after = & $show $script:Clean.FullName
            $before.Count | Should -Be 3
            $after | Should -Be $before
        }
    }

    Context 'Packaging (New-GuestConfigurationPackage)' {
        It 'writes a different .zip each run from the same MOF' {
            Get-McFileSha256 $script:Pkg1.Path | Should -Not -Be (Get-McFileSha256 $script:Pkg2.Path)
        }
        It 'passes Test-McPackage when built from the cleaned MOF' {
            Test-McPackage -Path $script:Pkg1.Path -Name 'TlsServerProtocols_1.0.0' -ExpectedType Audit | Should -BeNullOrEmpty
        }
        It 'packs only the resource module: no GuestConfiguration or DscNativeResources folder, though Learn lists both' {
            $zip = [IO.Compression.ZipFile]::OpenRead($script:Pkg1.Path)
            try { $tops = @($zip.Entries | ForEach-Object { ($_.FullName -replace '\\', '/') } | Where-Object { $_ -like 'Modules/*' } | ForEach-Object { ($_ -split '/')[1] } | Select-Object -Unique) }
            finally { $zip.Dispose() }
            $tops | Should -Be @('PSDscResources')
        }
        It "packages Microsoft's pinned example project" {
            $old = $env:PSModulePath
            try {
                $env:PSModulePath = (Join-Path $script:Pinned 'Modules') + [IO.Path]::PathSeparator + $env:PSModulePath
                $p = New-GuestConfigurationPackage -Name 'AdministratorsGroupMembers' -Configuration (Join-Path $script:Pinned 'AdministratorsGroupMembers.mof') -Path (Join-Path $TestDrive 'ms') -Force
                Test-Path $p.Path | Should -BeTrue
            } finally { $env:PSModulePath = $old }
        }
    }

    Context "Microsoft's pinned createPackage.ps1" {
        BeforeAll {
            $script:Ast = [Management.Automation.Language.Parser]::ParseFile((Join-Path $script:Pinned 'createPackage.ps1'), [ref]$null, [ref]$null)
            $script:Calls = @($script:Ast.FindAll({ $args[0] -is [Management.Automation.Language.CommandAst] }, $true) | ForEach-Object { $_.GetCommandName() })
        }
        It 'calls Test-GuestConfigurationPackage, which 4.12.0 no longer exports' {
            $script:Calls | Should -Contain 'Test-GuestConfigurationPackage'
            (Get-Command -Module GuestConfiguration).Name | Should -Not -Contain 'Test-GuestConfigurationPackage'
            (Get-Command -Module GuestConfiguration).Name | Should -Contain 'Get-GuestConfigurationPackageComplianceStatus'
        }
        It 'appends to PSModulePath with ":", the Linux separator' {
            (Get-Content (Join-Path $script:Pinned 'createPackage.ps1') -Raw) | Should -Match ([regex]::Escape('$env:PSModulePath+":$pwd/Modules"'))
        }
    }

    Context 'Policy definitions (New-GuestConfigurationPolicy)' {
        It 'names the file <package>_AuditIfNotExists.json, not auditIfNotExists.json as Learn says' {
            Split-Path -Leaf $script:Policy.Path | Should -Be 'TlsServerProtocols_1.0.0_AuditIfNotExists.json'
        }
        It "writes the package's SHA-256 as contentHash" {
            $script:Def.properties.metadata.guestConfiguration.contentHash | Should -Be (Get-McFileSha256 $script:Pkg1.Path).ToUpperInvariant()
        }
        It 'defaults IncludeArcMachines to "false", leaving Arc-enabled servers out of scope' {
            $script:Def.properties.parameters.IncludeArcMachines.defaultValue | Should -Be 'false'
        }
        It 'passes Test-McPolicy apart from the Arc reminder' {
            @(Test-McPolicy -Path $script:Policy.Path -PackagePath $script:Pkg1.Path -Release $script:Release | ForEach-Object { "$($_.Severity):$($_.Rule)" }) | Should -Be @('Info:MC-POL-09')
        }
        It 'refuses an apply mode for an audit-only package' {
            { New-GuestConfigurationPolicy @script:PolicyParams -Mode 'ApplyAndAutoCorrect' -Path (Join-Path $TestDrive 'pol2') } | Should -Throw '*Audit-only*'
        }
        It 'takes -Tag as one hashtable; the array of hashtables Learn describes fails to bind' {
            { New-GuestConfigurationPolicy @script:PolicyParams -Tag @(@{ ConfigOwner = 'ArcMachineConfiguration' }) -Path (Join-Path $TestDrive 'pol3') } | Should -Throw '*Hashtable*'
            $t = New-GuestConfigurationPolicy @script:PolicyParams -Tag @{ ConfigOwner = 'ArcMachineConfiguration' } -Path (Join-Path $TestDrive 'pol4')
            (Get-Content $t.Path -Raw) | Should -Match ([regex]::Escape("tags['ConfigOwner']"))
        }
    }

    Context 'Invoke-McBuild.ps1, end to end' {
        It 'exits 0 and writes provenance.json with the same MOF hash as this run' {
            $out = Join-Path $TestDrive 'build'
            $cmd = @('-NoProfile', '-File', (Join-Path $script:Kit 'powershell/Invoke-McBuild.ps1'), '-Name', 'TlsServerProtocols', '-Version', '1.0.0',
                '-ContentUri', 'https://stcontosomc.blob.core.windows.net/machine-configuration', '-OutputPath', $out, '-BuiltAt', '2026-10-30T00:00:00Z')
            if ($env:MC_MODULE_PATH) { $cmd += @('-ModulePath', $env:MC_MODULE_PATH) }
            & pwsh @cmd | Out-Null
            $LASTEXITCODE | Should -Be 0
            $prov = Get-Content (Join-Path $out 'TlsServerProtocols_1.0.0/provenance.json') -Raw | ConvertFrom-Json
            $prov.mof.sha256 | Should -Be (Get-McFileSha256 $script:Clean.FullName)
            $prov.modules.GuestConfiguration | Should -Be '4.12.0'
            $prov.findings.Finding | Should -Be 0
        }
    }
}
