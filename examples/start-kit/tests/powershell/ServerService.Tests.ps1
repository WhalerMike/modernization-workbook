# The server-to-service inventory: Win32_Service over CIM, WS-Management then DCOM, with the
# servers that answer neither reported, never fatal. Every CIM call is mocked from the fixture.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPServerService') -Force
    $global:FMPSvcFix = Read-KitFixture 'server-services.json'
    $m = @{ ModuleName = 'FMPServerService' }
    Mock @m Get-CimInstance -RemoveParameterType CimSession {
        if ($CimSession) {
            $name = "$($CimSession.ComputerName)"
            if ($name -eq 'sql01.contoso.example') { return @($global:FMPSvcFix.$name) }
            throw 'The RPC server is unavailable. (Exception from HRESULT: 0x800706BA)'
        }
        if ($ComputerName -eq 'app01.contoso.example') { return @($global:FMPSvcFix.$ComputerName) }
        throw 'WinRM cannot complete the operation. Verify that the specified computer name is valid.'
    }
    Mock @m New-CimSessionOption { [pscustomobject]@{ Protocol = $Protocol } }
    Mock @m New-CimSession -RemoveParameterType SessionOption { [pscustomobject]@{ ComputerName = "$ComputerName" } }
    $global:FMPCimClosed = 0
    Mock @m Remove-CimSession -RemoveParameterType CimSession { $global:FMPCimClosed++ }
    $script:Out = Join-Path $TestDrive 'svc'
    $script:Result = Get-FMPServerServiceInventory -OutputPath $Out -ComputerName 'app01.contoso.example', 'sql01.contoso.example', 'old01.contoso.example', 'APP01.contoso.example' 6>$null 3>$null
    $script:Rows = @(Import-Csv (Join-Path $Out 'ServerServices\ServerServices.csv'))
}

Describe 'Get-FMPServerServiceInventory' {
    It 'reads each server once, WS-Management first and DCOM when it fails' {
        $Result.Servers | Should -Be 3
        $Result.ReadByWSMan | Should -Be 1
        $Result.ReadByDcom | Should -Be 1
        @($Rows | Where-Object Server -eq 'sql01.contoso.example' | Select-Object -ExpandProperty Protocol -Unique) | Should -Be 'DCOM'
        # Both DCOM sessions (sql01 and old01) were closed.
        $global:FMPCimClosed | Should -Be 2
    }
    It 'reports a server that answers neither, with both errors, and carries on' {
        $e = @(Import-Csv (Join-Path $Out 'ServerServices\ServerServiceErrors.csv'))
        $e.Server | Should -Be 'old01.contoso.example'
        $e.Errors | Should -Match 'WSMan: WinRM'
        $e.Errors | Should -Match 'DCOM: The RPC server'
        $Result.ServersUnreachable | Should -Be 1
    }
    It 'writes server, service, display name, logon account, start mode, state and path' {
        $r = $Rows | Where-Object { $_.Server -eq 'app01.contoso.example' -and $_.ServiceName -eq 'PayrollSync' }
        $r.DisplayName | Should -Be 'Payroll Sync'
        $r.LogonAccount | Should -Be 'CONTOSO\svc-payroll'
        $r.StartMode | Should -Be 'Auto'
        $r.State | Should -Be 'Running'
        $r.PathName | Should -Be '"D:\Apps\Payroll\sync.exe"'
        $Rows.Count | Should -Be 8
    }
    It 'crosswalks each domain and managed service account to its servers and services' {
        $h = @(Import-Csv (Join-Path $Out 'ServerServices\ServiceAccountHosts.csv'))
        $p = $h | Where-Object SamAccountName -eq 'svc-payroll'
        $p.ServerCount | Should -Be 2
        $p.Servers | Should -Be 'app01.contoso.example; sql01.contoso.example'
        ($h | Where-Object SamAccountName -eq 'gmsa-sqlagent$').AccountType | Should -Be 'ManagedServiceAccount'
        ($h | Where-Object SamAccountName -eq 'svc-reports').AccountDomain | Should -Be 'contoso.example'
        @($h.SamAccountName) | Should -Not -Contain 'tooluser'
    }
}

Describe 'ConvertTo-FMPServiceAccount' {
    It 'classifies <StartName> as <Type>' -ForEach @(
        @{ StartName = 'LocalSystem'; Type = 'LocalSystem'; Sam = $null }
        @{ StartName = 'NT AUTHORITY\NetworkService'; Type = 'NetworkService'; Sam = $null }
        @{ StartName = 'NT AUTHORITY\LocalService'; Type = 'LocalService'; Sam = $null }
        @{ StartName = 'NT Service\MSSQL$SALES'; Type = 'Virtual'; Sam = $null }
        @{ StartName = '.\tooluser'; Type = 'Local'; Sam = $null }
        @{ StartName = 'APP01\tooluser'; Type = 'Local'; Sam = $null }
        @{ StartName = 'CONTOSO\svc-sql'; Type = 'Domain'; Sam = 'svc-sql' }
        @{ StartName = 'svc-sql@contoso.example'; Type = 'Domain'; Sam = 'svc-sql' }
        @{ StartName = 'CONTOSO\gmsa-web$'; Type = 'ManagedServiceAccount'; Sam = 'gmsa-web$' }
        @{ StartName = ''; Type = 'None'; Sam = $null }
    ) {
        $a = ConvertTo-FMPServiceAccount -StartName $StartName -Server 'app01.contoso.example'
        $a.AccountType | Should -Be $Type
        $a.SamAccountName | Should -Be $Sam
    }
}
