#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 13: workload identity across AWS GovCloud (US) and OCI. Reads the files the
    implementation guide's Steps 1g and 1h write (the IAM credential report, access keys,
    service-specific credentials, roles, instance profiles, OIDC providers and IAM Roles Anywhere
    trust anchors and profiles; OCI users with their API keys, auth tokens and customer secret keys,
    dynamic groups and policies) and reports findings NPI-AWS-01 to -16 and NPI-OCI-01 to -10. Writes
    a run folder with findings.json, identities.json, credentials.csv, trust.json, evidence.json and
    manifest.json. Read only and offline: it runs neither the AWS CLI nor the OCI CLI, calls no AWS
    or OCI API and writes nothing to either cloud.
.EXAMPLE
    # Lab 1: the fixtures, no account or tenancy.
    ./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv -OutputPath out/cloud-workload -AsOf 2026-11-24
.EXAMPLE
    # Lab 2: one test account's exports only.
    ./Invoke-NpiCloudWorkload.ps1 -AwsPath exports/aws -SettingsPath exports/settings.json -OutputPath out/cloud-workload-test
#>
[CmdletBinding()]
param(
    [string]$AwsPath,
    [string]$OciPath,
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$ExceptionsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [datetime]$AsOf = [datetime]::UtcNow.Date
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiCloudWorkload/NpiCloudWorkload.psm1') -Force

$s = Import-NpiCwSetting -Path $SettingsPath
$in = Import-NpiCwInput -AwsPath $AwsPath -OciPath $OciPath -ExceptionsPath $ExceptionsPath
$r = Invoke-NpiCwRun -Inputs $in -Settings $s -AsOf $AsOf
$manifest = Export-NpiCwRun -Run $r -Inputs $in -Settings $s -OutputPath $OutputPath

$fs = @($r.Findings)
$count = { param($sev) @($fs | Where-Object Severity -EQ $sev).Count }
$idCount = { param($cloud, $type) @($r.Identities | Where-Object { $_.Cloud -eq $cloud -and $_.Type -eq $type }).Count }
$scope = @()
if ($in.Aws) { $scope += "AWS account $($s.Aws.AccountId) ($($s.Aws.Partition)): $(& $idCount aws IamUser) IAM user(s), $(& $idCount aws IamRole) role(s), $(& $idCount aws RolesAnywhereTrustAnchor) trust anchor(s)" }
if ($in.Oci) { $scope += "OCI tenancy ($($s.Oci.Realm)): $(& $idCount oci OciUser) user(s), $(& $idCount oci DynamicGroup) dynamic group(s)" }
Write-Output ("As of {0}; {1}" -f $r.AsOf.ToString('yyyy-MM-dd'), ($scope -join '; '))
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f (& $count 'Finding'), (& $count 'Warn'), (& $count 'Info'))
$cr = @($r.Credentials)
Write-Output ("Long-lived credentials: {0} AWS, {1} OCI; {2} under a current exception" -f @($cr | Where-Object Cloud -EQ 'aws').Count, @($cr | Where-Object Cloud -EQ 'oci').Count, @($cr | Where-Object { $_.Exception -and $_.ReplaceBy -and [datetime]$_.ReplaceBy -ge $r.AsOf }).Count)
Write-Output ("Not read: {0}" -f $(if (@($r.NotRead).Count) { @($r.NotRead) -join ', ' } else { 'nothing' }))
$fs | Group-Object Rule | Sort-Object Name | ForEach-Object { Write-Output ("  {0}  {1}" -f $_.Name, ((@($_.Group | ForEach-Object { ($_.Object -split ' \(')[0] } | Select-Object -Unique)) -join ', ')) }
Write-Output "Manifest SHA-256: $(Get-NpiFileHash -Path $manifest.FullName)"
