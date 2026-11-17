#Requires -Version 7.1
<#
    DefenderXdr: a read-only kit for engineering and operating Microsoft Defender XDR on Windows clients and
    Windows Server in a GCC tenant. It reads incidents, advanced hunting results and custom detection rules
    through the Microsoft Graph security API, reads device state with the Windows Defender and NetSecurity
    cmdlets, compares what it reads with the agency's own plans (roles, rings, Attack Surface Reduction
    stages, owners, the response ladder), and writes each run as a folder with a manifest that
    Invoke-XdrEvidence.ps1 records as hashed, chained evidence with its NIST SP 800-53 Rev 5 controls and
    FedRAMP 20x KSIs.

    Every call is declared in config/calls.json with its least-privileged permission and the Microsoft
    Learn page that states it. Fixture mode reads files and sends nothing; live mode uses Microsoft Graph
    PowerShell (Invoke-MgGraphRequest). The only writes are custom detection rules, from deploy/ with
    -Apply and the plan's approved SHA-256. Illustrative: tested against fixtures and fakes, not run against
    a live tenant.

    The functions live in parts/*.ps1, one file per subject; this file loads them and exports every
    function whose noun starts with Xdr.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:ConfigRoot = Join-Path $script:KitRoot 'config'

foreach ($part in (Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'parts') -Filter '*.ps1' | Sort-Object Name)) {
    . $part.FullName
}

Export-ModuleMember -Function '*-Xdr*'
