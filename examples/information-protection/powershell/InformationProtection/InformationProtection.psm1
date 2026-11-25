#Requires -Version 7.1
<#
    InformationProtection: a read-only kit for Book 20's information protection in Microsoft Purview, in a
    Microsoft 365 GCC tenant. It exports the Purview configuration baseline that Book 20, Chapter 12 defines
    (Security & Compliance PowerShell, Exchange Online PowerShell and the AIPService module, read cmdlets
    only), compares the export with the agency's own plan (labels and their policies, Rights Management,
    message encryption, DLP and auto-labeling stages, audit and the role register), finds drift between two
    exports, and writes each run as a folder with a manifest that Invoke-IpEvidence.ps1 records as hashed,
    chained evidence with its NIST SP 800-53 Rev 5 controls and FedRAMP Key Security Indicators.

    Every cmdlet the export runs is declared in config/calls.json with the shell it runs in, the role it
    needs and the Microsoft Learn page that documents it. Fixture mode reads files and connects to nothing.
    The kit writes nothing to a tenant. Illustrative: tested against fixtures and fakes, not run against a
    live tenant.

    The functions live in parts/*.ps1, one file per subject; this file loads them and exports every function
    whose noun starts with Ip.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:ConfigRoot = Join-Path $script:KitRoot 'config'

foreach ($part in (Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'parts') -Filter '*.ps1' | Sort-Object Name)) {
    . $part.FullName
}

Export-ModuleMember -Function '*-Ip*'
