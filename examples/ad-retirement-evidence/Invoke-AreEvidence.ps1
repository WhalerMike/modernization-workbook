#Requires -Version 5.1
<#
.SYNOPSIS
    Writes the G5 "AD Retired" evidence packet for a domain: what still runs, what still authenticates, and whether the gate can pass.
.DESCRIPTION
    Read only. Reads Active Directory (default read), DNS, and the authentication rows from the SIEM (the CSV
    export of queries/dc-authentication.kql, or -WorkspaceId to run it as a Log Analytics Reader), compares
    them with the island register and writes the packet under -OutputPath. Exits 2 when the packet has a
    finding, 0 when it's ready for the gate owner. -NoDomain records a full retirement after the last domain
    controller is gone (DNS and authentication only).
.EXAMPLE
    ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5
.EXAMPLE
    ./Invoke-AreEvidence.ps1 -Domain corp.example.gov -AuthPath .\dc-auth.csv -RegisterPath .\island-register.json -OutputPath .\g5-packet
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Domain,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath, [string]$AuthPath, [string]$WorkspaceId,
    [string]$RegisterPath = (Join-Path $PSScriptRoot 'config/island-register.json'),
    [switch]$NoDomain,
    [datetime]$AsOf = (Get-Date).ToUniversalTime()
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/AdRetirementEvidence/AdRetirementEvidence.psm1') -Force
$r = New-AreEvidencePacket -Domain $Domain -OutputPath $OutputPath -FixturePath $FixturePath -AuthPath $AuthPath -WorkspaceId $WorkspaceId -RegisterPath $RegisterPath -NoDomain:$NoDomain -AsOf $AsOf
$r
if (-not $r.Ready) { exit 2 }
