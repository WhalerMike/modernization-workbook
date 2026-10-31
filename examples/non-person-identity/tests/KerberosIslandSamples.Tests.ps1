#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 06 baseline: Microsoft Learn's gMSA, dMSA and KDS root key procedures, pinned unmodified in
# examples/third_party/windows-server-msa-pages and run offline against stand-ins
# (tests/KerberosIslandSampleHarness.ps1). Each test pins one thing a procedure does or leaves out,
# so a new upstream version that changes it fails here first. Chapter 06's gap table cites these.

BeforeAll {
    . (Join-Path $PSScriptRoot 'KerberosIslandSampleHarness.ps1')
    function Get-Bound($Run, [string]$Cmdlet) { @($Run.Calls | Where-Object Cmdlet -EQ $Cmdlet) }
}

Describe 'Chapter 06: "Setting up delegated Managed Service Accounts" (Learn), run as published' {
    It 'creates a dMSA with New-ADServiceAccount -CreateDelegatedServiceAccount and AES256: the model for CreateDmsa' {
        $run = Invoke-KrbLearnCode (Get-KrbDmsaSample CreateDmsa)
        $run.Error | Should -BeNullOrEmpty
        $b = (Get-Bound $run 'New-ADServiceAccount')[0].Bound
        $b.CreateDelegatedServiceAccount | Should -BeTrue
        $b.KerberosEncryptionType | Should -Be 'AES256'
    }
    It 'runs with placeholder names, and names the account differently in each step' {
        (Get-Bound (Invoke-KrbLearnCode (Get-KrbDmsaSample CreateDmsa)) 'New-ADServiceAccount')[0].Bound.Name | Should -Be 'ServiceAccountName'
        (Get-Bound (Invoke-KrbLearnCode (Get-KrbDmsaSample GrantRetriever)) 'Set-ADServiceAccount')[0].Bound.Identity | Should -Be 'DMSA Name'
        (Get-Bound (Invoke-KrbLearnCode (Get-KrbDmsaSample ViewState)) 'Get-ADServiceAccount')[0].Bound.Identity | Should -Be 'dMSAsnmp'
    }
    It 'grants password retrieval to one machine typed by hand' {
        (Get-Bound (Invoke-KrbLearnCode (Get-KrbDmsaSample GrantRetriever)) 'Set-ADServiceAccount')[0].Bound.PrincipalsAllowedToRetrieveManagedPassword | Should -Be 'Machine$'
    }
    It 'sets msDS-DelegatedMSAState with -Properties, which Set-ADServiceAccount doesn''t take: it fails as published' {
        $run = Invoke-KrbLearnCode (Get-KrbDmsaSample SetState3)
        $run.Error | Should -Match "parameter name 'Properties'"
        @($run.Calls).Count | Should -Be 0
    }
    It 'starts the migration with Start-ADServiceAccountMigration and a distinguished name: the model for StartDmsaMigration' {
        $b = (Get-Bound (Invoke-KrbLearnCode (Get-KrbDmsaSample StartMigration)) 'Start-ADServiceAccountMigration')[0].Bound
        @($b.Keys | Sort-Object) | Should -Be @('Identity', 'SupersededAccount')
        $b.SupersededAccount | Should -Be '<DN of service account>'
    }
    It 'restarts every running service on the host, not only the ones that run as the account' {
        $run = Invoke-KrbLearnCode (Get-KrbDmsaSample RestartServices)
        @((Get-Bound $run 'Restart-Service').Bound.Name) | Should -Be @('HRSync', 'W3SVC', 'Spooler')
    }
    It 'writes the registry on the host: a host step, outside Active Directory' {
        foreach ($n in 'RegistryNote', 'RegistryMigration') {
            $run = Invoke-KrbLearnCode (Get-KrbDmsaSample $n)
            @($run.Calls | Where-Object { $_.Cmdlet -in 'Set-ItemProperty', 'New-ItemProperty' })[0].Bound.Path | Should -Match '^HKLM:'
        }
    }
    It 'completes with the same two parameters, with no waiting step between start and complete' {
        $b = (Get-Bound (Invoke-KrbLearnCode (Get-KrbDmsaSample CompleteMigration)) 'Complete-ADServiceAccountMigration')[0].Bound
        @($b.Keys | Sort-Object) | Should -Be @('Identity', 'SupersededAccount')
        [IO.File]::ReadAllText($script:DmsaSetupPage) | Should -Not -Match 'ticket lifetime'
        [IO.File]::ReadAllText($script:DmsaOverviewPage) | Should -Match 'two ticket lifetimes \(equivalent to 14 days\)'
    }
    It 'warns never to delete the original account, and offers Undo and Reset' {
        [IO.File]::ReadAllText($script:DmsaSetupPage) | Should -Match '\*\*never\*\* delete the original service account'
        foreach ($n in 'UndoMigration', 'ResetMigration') { (Invoke-KrbLearnCode (Get-KrbDmsaSample $n)).Calls[0].Cmdlet | Should -Match '^(Undo|Reset)-ADServiceAccountMigration$' }
    }
    It 'checks the KDS root key with Get-KdsRootKey, which returns the root key value itself' {
        $inline = Get-KrbInlineCode -Page $script:DmsaSetupPage -Pattern 'KdsRootKey'
        $inline | Should -Contain 'Get-KdsRootKey'
        $run = Invoke-KrbLearnCode 'Get-KdsRootKey'
        $run.Output[0].PSObject.Properties.Name | Should -Contain 'KeyValue'
    }
    It 'offers Add-KdsRootKey backdated 10 hours, which the KDS page reserves for a test environment with one domain controller' {
        @(Get-KrbInlineCode -Page $script:DmsaSetupPage -Pattern '^Add-KdsRootKey') | Should -HaveCount 1
        [IO.File]::ReadAllText($script:KdsPage) | Should -Match 'For test environments that have only one DC'
    }
}

Describe 'Chapter 06: "Delegated Managed Service Accounts overview" (Learn)' {
    It 'states the limits the plan enforces: no MSA or gMSA to dMSA, unconstrained delegation stops, every host must support dMSA' {
        $t = [IO.File]::ReadAllText($script:DmsaOverviewPage)
        $t | Should -Match "can't migrate from a managed service account or a gMSA to a dMSA"
        $t | Should -Match 'Unconstrained delegation stops working once the migration is complete'
        $t | Should -Match 'all machines using the service account need to be updated to support dMSA'
    }
}

Describe 'Chapter 06: "Manage group Managed Service Accounts" (Learn), as published' {
    BeforeAll { $script:GmsaBlocks = Get-KrbLearnBlock -Page $script:GmsaManagePage }
    It 'creates a gMSA with its retrievers at creation: the model for CreateGmsa' {
        @($script:GmsaBlocks | Where-Object { $_ -match '^New-ADServiceAccount -Name <gMSAName> -DNSHostName <gMSAName>\.<domain> -PrincipalsAllowedToRetrieveManagedPassword <SecurityGroup>$' }) | Should -HaveCount 1
    }
    It 'gives templates with angle-bracket placeholders that don''t parse as PowerShell' {
        $create = @($script:GmsaBlocks | Where-Object { $_ -like 'New-ADServiceAccount*' })
        $create.Count | Should -Be 2
        foreach ($b in $create) { Test-KrbParses $b | Should -BeFalse }
    }
    It 'sets no Kerberos encryption type on the gMSA' {
        foreach ($b in @($script:GmsaBlocks | Where-Object { $_ -like 'New-ADServiceAccount*' })) { $b | Should -Not -Match 'KerberosEncryptionType' }
    }
    It 'leaves installing and uninstalling the gMSA to a person on each host' {
        @($script:GmsaBlocks | Where-Object { $_ -match '^(Install|Uninstall)-ADServiceAccount' }) | Should -HaveCount 2
    }
}

Describe 'Chapter 06: "Secure group managed service accounts" (Learn, pinned for Chapter 01)' {
    It 'ends its move to a gMSA by deleting the old service account identity' {
        [IO.File]::ReadAllText($script:EntraGmsaPage) | Should -Match '7\. Delete the old service account identity\.'
    }
}
