#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the Start Kit: a read-only assessment of the forest, the SQL Server estate and the
    RADIUS and NPS estate, a one-page summary, and a provenance manifest, all under one run
    folder.

.DESCRIPTION
    Creates <OutputPath>\<run-id>, where the run identifier is Book 01 Chapter 10's
    YYYY-MM-DD-HHmm-<host>-tier<A|B> in UTC, then:
      1. Test-FMPReadAccess          what this account can read; the draft delegation request
      2. Invoke-FMPADAssessment      the twelve domains plus DHCP, the SPN map and LDAP binds
      3. Invoke-FMPSqlEstateDiscovery  the SQL Server count and inventory (unless -SkipSql)
      4. Invoke-FMPNpsInventory      NPS servers, RADIUS clients and policies (unless -SkipNps)
      5. Invoke-FMPTransactionProfile  transaction profiles and the separation gate, from
                                     -TransactionCatalog; without one, a catalog template
      6. Get-FMPAttributeSurvey      fill rate and value quality of the migration's
                                     attributes, through the Global Catalog (unless
                                     -SkipAttributeSurvey)
      7. Get-FMPWaveList             migration waves from those attributes: from -WavePlan,
                                     or one per organization code
      8. Get-FMPStartKitSummary      Summary\StartKitSummary.md and .json
      9. AssessmentManifest.json     who, when, where, module versions, SHA-256 of every file

    Nothing here writes to Active Directory, DNS, DHCP, AD CS, NPS or SQL Server. Every file
    goes under the run folder. Tier B adds the collectors that need the narrow delegations
    (DHCP, LDAP binding events); a Tier A run still records which reads were denied. The
    NPS step always lists the servers; reading their configuration needs local
    administrator rights on each one, and a denied read is recorded, not fatal.

    Illustrative: unit-tested against fixtures, not proven against a live estate.

.EXAMPLE
    .\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment

    Tier A: directory, DNS zones, PKI configuration, the SPN and directory SQL signals.

.EXAMPLE
    .\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment -Tier B -ProbeNetwork -QueryInstances

    Tier B, with the SQL Browser probe and the read-only T-SQL pass on every instance found.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OutputPath,
    [string[]]$Domain,
    # Defaults to the forest this host is joined to.
    [string]$Forest,
    [ValidateSet('A', 'B')][string]$Tier = 'A',
    [int]$StaleThresholdDays = 90,
    [switch]$SkipAD,
    [switch]$SkipSql,
    [string[]]$TargetServers = @(),
    [switch]$ProbeNetwork,
    [switch]$ProbeAllServers,
    [switch]$UseDbatools,
    [switch]$QueryInstances,
    [switch]$TrustServerCertificate,
    [int]$ZombieThresholdDays = 400,
    [switch]$SkipNps,
    # NPS servers outside the RAS and IAS Servers groups, and configuration exports on disk.
    [string[]]$NpsServers = @(),
    [string[]]$NpsConfigPath = @(),
    [switch]$SkipTransactionProfiles,
    # The team's transaction catalog, and folders of measurements taken before the run.
    [string]$TransactionCatalog,
    [string[]]$TransactionMeasurementPath = @(),
    [switch]$SkipAttributeSurvey,
    # A pattern every enterprise person key matches, the code lists, the tenant's routable UPN suffixes.
    [string]$KeyPattern,
    [string]$CodeListPath,
    [string[]]$UpnSuffix = @(),
    # wave-plan.csv (WaveId, Attribute, Value) and asset-ownership.csv for the wave lists.
    [string]$WavePlan,
    [string]$AssetOwnership
)

$ErrorActionPreference = 'Stop'
# Imported once; a session that already loaded them (the tests, or a signed copy) keeps its own.
foreach ($m in 'FMPADAssessment', 'FMPSqlEstate', 'FMPNpsInventory', 'FMPTransactionProfile', 'FMPAttributeSurvey') {
    if (-not (Get-Module -Name $m)) { Import-Module (Join-Path (Join-Path $PSScriptRoot 'powershell') $m) }
}
# The run script uses the shared helpers directly for the run folder and the manifest.
. (Join-Path (Join-Path $PSScriptRoot 'powershell') 'StartKit.Common.ps1')

$start = Get-Date
$runId = ConvertTo-FMPRunId -AsOf $start -HostName ([Environment]::MachineName) -Tier $Tier
$base = Resolve-FMPOutputRoot -OutputPath $OutputPath
$runPath = Resolve-FMPOutputRoot -OutputPath (Join-Path $base $runId)
Write-Host "Start Kit run $runId (read-only). Output: $runPath"

$adForest = if ($Forest) { Get-ADForest -Server $Forest } else { Get-ADForest }
if (-not $Domain) { $Domain = @($adForest.Domains) }
$servedBy = @{}
foreach ($d in $Domain) {
    try { $servedBy[$d] = (Get-ADDomainController -DomainName $d -Discover -ErrorAction Stop).HostName | Select-Object -First 1 }
    catch { $servedBy[$d] = $null }
}

$steps = @()
$steps += Invoke-FMPStep 'Read-access pre-flight' { Test-FMPReadAccess -OutputPath $runPath -Domain $adForest.RootDomain }
if (-not $SkipAD) {
    $steps += Invoke-FMPADAssessment -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -Tier $Tier -StaleThresholdDays $StaleThresholdDays -AsOf $start
}
if (-not $SkipSql) {
    $steps += Invoke-FMPStep 'SQL Server estate' {
        Invoke-FMPSqlEstateDiscovery -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -TargetServers $TargetServers `
            -ProbeNetwork:$ProbeNetwork -ProbeAllServers:$ProbeAllServers -UseDbatools:$UseDbatools `
            -QueryInstances:$QueryInstances -TrustServerCertificate:$TrustServerCertificate `
            -ZombieThresholdDays $ZombieThresholdDays -AsOf $start
    }
}
if (-not $SkipNps) {
    $steps += Invoke-FMPStep 'RADIUS and NPS' {
        Invoke-FMPNpsInventory -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -NpsServers $NpsServers -ConfigPath $NpsConfigPath -AsOf $start
    }
}
if (-not $SkipTransactionProfiles) {
    $steps += Invoke-FMPStep 'Transaction profiles' {
        Invoke-FMPTransactionProfile -OutputPath $runPath -CatalogPath $TransactionCatalog -MeasurementPath $TransactionMeasurementPath -AsOf $start
    }
}
if (-not $SkipAttributeSurvey) {
    $steps += Invoke-FMPStep 'Attribute survey' {
        Get-FMPAttributeSurvey -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -KeyPattern $KeyPattern `
            -CodeListPath $CodeListPath -UpnSuffix $UpnSuffix -AsOf $start
    }
    $steps += Invoke-FMPStep 'Wave lists' {
        Get-FMPWaveList -OutputPath $runPath -WavePlanPath $WavePlan -OwnershipPath $AssetOwnership -AsOf $start
    }
}
$steps += Invoke-FMPStep 'Summary' { Get-FMPStartKitSummary -RunPath $runPath }

$parameters = @{
    Tier = $Tier; StaleThresholdDays = $StaleThresholdDays; SkipAD = [bool]$SkipAD; SkipSql = [bool]$SkipSql
    TargetServerCount = @($TargetServers).Count; ProbeNetwork = [bool]$ProbeNetwork; ProbeAllServers = [bool]$ProbeAllServers
    UseDbatools = [bool]$UseDbatools; QueryInstances = [bool]$QueryInstances; ZombieThresholdDays = $ZombieThresholdDays
    SkipNps = [bool]$SkipNps; NpsServerCount = @($NpsServers).Count; NpsConfigFileCount = @($NpsConfigPath).Count
    SkipTransactionProfiles = [bool]$SkipTransactionProfiles; TransactionCatalog = [bool]$TransactionCatalog
    TransactionMeasurementPathCount = @($TransactionMeasurementPath).Count
    SkipAttributeSurvey = [bool]$SkipAttributeSurvey; KeyPattern = [bool]$KeyPattern; CodeList = [bool]$CodeListPath
    UpnSuffixCount = @($UpnSuffix).Count; WavePlan = [bool]$WavePlan; AssetOwnership = [bool]$AssetOwnership
}
$manifest = Write-FMPManifest -RunPath $runPath -RunId $runId -StartTime $start -Tier $Tier -Forest $adForest.Name `
    -Domains $Domain -ServedBy $servedBy -Steps $steps -Parameters $parameters

$failed = @($steps | Where-Object Status -eq 'Failed')
Write-Host ("Done: {0} files, {1} steps, {2} failed. Summary: {3}" -f $manifest.FileCount, $steps.Count, $failed.Count, (Join-Path (Join-Path $runPath 'Summary') 'StartKitSummary.md'))
foreach ($f in $failed) { Write-Warning "$($f.Step): $($f.Error)" }
