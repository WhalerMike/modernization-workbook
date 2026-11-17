#Requires -Version 5.1
<#
.SYNOPSIS
    Run on a Windows device with the Global Secure Access client, as an administrator: reads the guide's Step 3
    Validate values (the client's file version, the four hardening registry values, IPv4 preferred, the Edge and
    Chrome DNS-over-HTTPS policy) and prints one client record as JSON for inputs/client-records.json. Reads only;
    changes nothing. The tray's health (Advanced diagnostics > Health check) is read by a person and passed in.
.EXAMPLE
    ./tools/Get-GsaClientState.ps1 -Health Connected | Out-File ./client-PC-PILOT-01.json -Encoding utf8
#>
[CmdletBinding()]
param([Parameter(Mandatory)][ValidateSet('Connected', 'Disconnected', 'Disabled', 'Unknown')][string]$Health)
$exe = 'C:\Program Files\Global Secure Access Client\TrayApp\GlobalSecureAccessClient.exe'
$ver = if (Test-Path -LiteralPath $exe) { (Get-Item -LiteralPath $exe).VersionInfo.FileVersion } else { '' }
$h = @{}
$key = 'HKLM:\SOFTWARE\Microsoft\Global Secure Access Client'
if (Test-Path -LiteralPath $key) {
    $p = Get-ItemProperty -LiteralPath $key
    foreach ($n in 'HideSignOutButton', 'HideDisablePrivateAccessButton', 'HideDisableButton', 'RestrictNonPrivilegedUsers') { if ($p.PSObject.Properties[$n]) { $h[$n] = [int]$p.$n } }
}
$dc = (Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' -Name DisabledComponents -ErrorAction SilentlyContinue).DisabledComponents
$doh = @{}
foreach ($b in @(@('Edge', 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'), @('Chrome', 'HKLM:\SOFTWARE\Policies\Google\Chrome'))) {
    $v = (Get-ItemProperty -LiteralPath $b[1] -Name DnsOverHttpsMode -ErrorAction SilentlyContinue).DnsOverHttpsMode
    $doh[$b[0]] = if ($v) { "$v" } else { 'not set' }
}
[ordered]@{ device = $env:COMPUTERNAME; collectedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); clientVersion = $ver
    hardening = $h; ipv6DisabledComponents = [int]$dc; health = $Health; dohPolicy = $doh } | ConvertTo-Json -Depth 5
