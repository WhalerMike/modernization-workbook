#Requires -Version 7.1
<#
.SYNOPSIS
    The replication probe for the Active Directory tab. Reads repadmin /showrepl * /csv (or a saved copy with
    -InputPath), writes probe.json (one record per replication link for the custom table DcReplicationProbe_CL)
    and a hashed manifest, and with -Send posts the records to the Logs Ingestion API at the data collection rule
    the settings file names. It reads the directory and changes nothing. Exits 1 if any link is failing.
    Learn names Enterprise Admins, or equivalent, as the minimum to read forest-wide replication status: run it
    only as a Tier 0 identity on a Tier 0 host, as the guide's access request says.
.EXAMPLE
    ./Invoke-DcReplicationProbe.ps1 -SettingsPath tests/fixtures/settings.lab.json -InputPath tests/fixtures/repl/showrepl-day1.csv -OutputPath out/probe -AsOf 2026-11-16T06:00:00Z
.EXAMPLE
    ./Invoke-DcReplicationProbe.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/probe -Send
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [string]$InputPath, [string]$TimeZoneId, [switch]$Send)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DailyChecks/DailyChecks.psm1') -Force
$p = @{ SettingsPath = $SettingsPath; OutputPath = $OutputPath; AsOf = $AsOf; Send = $Send }
if ($InputPath) { $p.InputPath = $InputPath }
if ($TimeZoneId) { $p.TimeZoneId = $TimeZoneId }
$r = Invoke-DcReplicationProbe @p
$r.Records | ForEach-Object { [pscustomobject]$_ } | Format-Table DestinationDc, SourceDc, Failures, LastSuccessUtc, LastFailureStatus, Verdict -AutoSize | Out-String -Width 150 | Write-Host
Write-Host "$($r.Links) links, $($r.Failing) failing; $(if ($r.Sent) { 'sent to the workspace' } else { 'not sent (no -Send)' }). Written to $OutputPath`: probe.json, manifest.json"
if ($r.Failing) { exit 1 }
