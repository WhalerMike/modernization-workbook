<#
.SYNOPSIS
    Defines the TlsServerProtocols DSC configuration, which audits that the server side of TLS 1.0
    and TLS 1.1 is disabled in the SCHANNEL registry keys. Dot-source it, then run it to compile a MOF.
.EXAMPLE
    . ./configurations/TlsServerProtocols.ps1
    TlsServerProtocols -OutputPath ./out/compiled   # writes localhost.mof
#>

# Audit that the server side of TLS 1.0 and TLS 1.1 is explicitly disabled in SCHANNEL.
# Compiles with PSDesiredStateConfiguration 2.0.7 and PSDscResources (versions in
# ../RequiredModules.psd1). Audit only: the release registry (../config/releases.json) records
# the mode, and Test-McPolicy refuses a definition whose mode doesn't match it.
Configuration TlsServerProtocols {
    Import-DscResource -ModuleName 'PSDscResources' -Name 'Registry'

    foreach ($protocol in 'TLS 1.0', 'TLS 1.1') {
        Registry "Disable$($protocol -replace '\W', '')Server" {
            Key       = "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\$protocol\Server"
            ValueName = 'Enabled'
            ValueType = 'Dword'
            ValueData = '0'
            Ensure    = 'Present'
        }
    }
}
