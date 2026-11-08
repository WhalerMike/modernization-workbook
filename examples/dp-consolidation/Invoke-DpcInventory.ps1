<#
.SYNOPSIS
    Step 0: read the existing content estate (distribution points, boundary groups, site system roles,
    distribution status, clients per boundary group, applications, packages, task sequence deployments)
    and write hashed, control-tagged evidence. Read-only.
.DESCRIPTION
    Live mode reads the hierarchy through the ConfigurationManager module cmdlets and the SMS Provider's
    WMI classes; it makes no change. Fixture mode reads the fictional estate under tests/fixtures, so
    Lab 1 runs with no hierarchy. Either way the run folder gets one CSV and one JSON per table, a
    findings table and manifest.json with the SHA-256 of every file.

    Inputs no cmdlet can read are CSV files the reader keeps: the office list with circuit data from
    the network team (config/offices.example.csv), the co-management workload states recorded from the
    console (config/workloads.example.csv), and the ISSO's evidence sources (config/evidence-sources.example.csv).
.EXAMPLE
    # Lab 1: the fictional estate, no hierarchy.
    ./Invoke-DpcInventory.ps1 -FixturePath tests/fixtures/estate -PackageSourceRoot tests/fixtures/packages -OutputPath out/inventory -AsOf 2026-11-08
.EXAMPLE
    # Live, from a machine with the Configuration Manager console, in Windows PowerShell 5.1.
    .\Invoke-DpcInventory.ps1 -SiteCode LAB -ProviderMachineName cm01.lab.example -OfficesCsv .\config\offices.csv `
        -WorkloadsCsv .\config\workloads.csv -EvidenceSourcesCsv .\config\evidence-sources.csv `
        -PackageSourceRoot \\cm01.lab.example\Sources -OutputPath .\out\inventory
#>
[CmdletBinding()]
param(
    [string]$FixturePath,
    [string]$SiteCode,
    [string]$ProviderMachineName,
    [string]$OfficesCsv,
    [string]$WorkloadsCsv,
    [string]$EvidenceSourcesCsv,
    [string]$PackageSourceRoot,
    [string]$OutputPath,
    [int]$ClientsPerDpLimit = 4000,
    [datetime]$AsOf = (Get-Date)
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

if ($FixturePath) {
    $mode = 'Fixture'
    if (-not $SiteCode) { $SiteCode = 'LAB' }
    $dpRaw = Read-DpcJson (Join-Path $FixturePath 'distribution-points.json')
    $bgRaw = Read-DpcJson (Join-Path $FixturePath 'boundary-groups.json')
    $statusRaw = Read-DpcJson (Join-Path $FixturePath 'dp-status.json')
    $rolesRaw = Read-DpcJson (Join-Path $FixturePath 'site-roles.json')
    $appsRaw = Read-DpcJson (Join-Path $FixturePath 'applications.json')
    $pkgRaw = Read-DpcJson (Join-Path $FixturePath 'packages.json')
    $tsRaw = Read-DpcJson (Join-Path $FixturePath 'task-sequence-deployments.json')
    $subnets = @(Import-Csv (Join-Path $FixturePath 'clients-by-subnet.csv'))
    if (-not $OfficesCsv) { $OfficesCsv = Join-Path $FixturePath 'offices.csv' }
    if (-not $WorkloadsCsv) { $WorkloadsCsv = Join-Path $FixturePath 'workloads.csv' }
    if (-not $EvidenceSourcesCsv) { $EvidenceSourcesCsv = Join-Path $FixturePath 'evidence-sources.csv' }
} else {
    if (-not $SiteCode -or -not $ProviderMachineName) { throw 'Live mode needs -SiteCode and -ProviderMachineName (or use -FixturePath).' }
    $mode = 'Live'
    $here = Get-Location
    Connect-DpcSite -SiteCode $SiteCode -ProviderMachineName $ProviderMachineName
    $ns = "root\SMS\site_$SiteCode"
    try {
        # Distribution points: SMS_DistributionPointInfo through Get-CMDistributionPointInfo.
        $dpRaw = foreach ($d in @(Get-CMDistributionPointInfo)) {
            $server = ([string]$d.ServerName).ToLowerInvariant()
            $build = $null
            try { $build = (Get-CimInstance -ClassName Win32_OperatingSystem -ComputerName $server -ErrorAction Stop).BuildNumber } catch { Write-Warning "OS build not read from $server ($($_.Exception.Message))" }
            [pscustomobject]@{ ServerName = $server; SiteCode = $d.SiteCode; IsPullDP = [bool]$d.IsPullDP; IsPXE = [bool]$d.IsPXE
                OperatingSystemBuild = $build; ContentLibraryGB = $null; ConnectedCache = $null; Location = ''; HardwareSupportEnds = '' }
        }
        # Boundary groups, their boundaries and their site systems.
        $bgRaw = foreach ($g in @(Get-CMBoundaryGroup)) {
            $b = @(Get-CMBoundary -BoundaryGroupName $g.Name | ForEach-Object { [pscustomobject]@{ BoundaryType = [int]$_.BoundaryType; Value = $_.Value } })
            $s = @(Get-CMBoundaryGroupSiteSystem -GroupName $g.Name | ForEach-Object { Get-DpcServerName $_.ServerNalPath })
            [pscustomobject]@{ Name = $g.Name; Boundaries = $b; SiteSystems = $s }
        }
        $statusRaw = @(Get-CimInstance -ComputerName $ProviderMachineName -Namespace $ns -ClassName SMS_DPStatusInfo |
            ForEach-Object { [pscustomobject]@{ Name = (Get-DpcServerName $_.NALPath); NumberInstalled = $_.NumberInstalled; NumberErrors = $_.NumberErrors; NumberInProgress = $_.NumberInProgress } })
        $rolesRaw = @(Get-CMSiteRole -AllSite | ForEach-Object { [pscustomobject]@{ Server = (Get-DpcServerName $_.NetworkOSPath); RoleName = $_.RoleName; SiteCode = $_.SiteCode } })
        # Clients: active Configuration Manager clients by subnet, from SMS_R_System discovery data.
        $subnets = @(Get-CimInstance -ComputerName $ProviderMachineName -Namespace $ns -ClassName SMS_R_System -Filter 'Client = 1 AND Active = 1' |
            ForEach-Object { $site = $_.ADSiteName; foreach ($sn in @($_.IPSubnets)) { [pscustomobject]@{ Subnet = $sn; ADSiteName = $site } } } |
            Group-Object Subnet, ADSiteName | ForEach-Object { [pscustomobject]@{ Subnet = $_.Group[0].Subnet; ADSiteName = $_.Group[0].ADSiteName; Clients = $_.Count } })
        $deployments = @(Get-CMDeployment -FeatureType Application)
        $appsRaw = foreach ($a in @(Get-CMApplication -Fast)) {
            $name = $a.LocalizedDisplayName
            [pscustomobject]@{ Name = $name; SourceFolder = ''; Deployments = @($deployments | Where-Object SoftwareName -EQ $name).Count
                InstallCount = $a.NumberOfDevicesWithApp; Technology = '' }
        }
        $pkgDeployments = @(Get-CMDeployment -FeatureType Package)
        $pkgRaw = foreach ($p in @(Get-CMPackage -Fast)) {
            [pscustomobject]@{ PackageID = $p.PackageID; Name = $p.Name; PkgSourcePath = $p.PkgSourcePath; Deployments = @($pkgDeployments | Where-Object SoftwareName -Like "$($p.Name)*").Count }
        }
        $tsRaw = @(Get-CMTaskSequenceDeployment -Fast | ForEach-Object { [pscustomobject]@{ Name = $_.SoftwareName; Collection = $_.CollectionName; Purpose = '' } })
    } finally {
        Set-Location $here
    }
}

$run = New-DpcRun -Task inventory -Mode $mode -OutputPath $OutputPath -SiteCode $SiteCode
$offices = if ($OfficesCsv -and (Test-Path $OfficesCsv)) { @(Import-Csv $OfficesCsv) } else { @() }
$officeByDp = @{}; foreach ($o in $offices) { if ($o.OfficeDP) { $officeByDp[$o.OfficeDP.ToLowerInvariant()] = $o } }
$statusByDp = @{}; foreach ($s in $statusRaw) { $statusByDp[([string]$s.Name).ToLowerInvariant()] = $s }

# Clients per boundary group: match each client subnet to IP subnet boundaries, then AD site boundaries.
$bgClients = @{}; $matched = @{}
foreach ($g in $bgRaw) {
    $n = 0
    foreach ($s in $subnets) {
        foreach ($b in @($g.Boundaries)) {
            $hit = ($b.BoundaryType -eq 0 -and (Test-DpcSubnetMatch -ClientSubnet $s.Subnet -BoundaryValue $b.Value)) -or
                   ($b.BoundaryType -eq 1 -and $b.Value -eq $s.ADSiteName)
            if ($hit) { $n += [int]$s.Clients; $matched["$($s.Subnet)|$($s.ADSiteName)"] = $true; break }
        }
    }
    $bgClients[$g.Name] = $n
}
$unmatched = @($subnets | Where-Object { -not $matched.ContainsKey("$($_.Subnet)|$($_.ADSiteName)") })

$bgRows = foreach ($g in $bgRaw) {
    [pscustomobject]@{
        BoundaryGroup = $g.Name
        Boundaries    = (@($g.Boundaries) | ForEach-Object { "{0}:{1}" -f (@('IPSubnet', 'ADSite', 'IPv6Prefix', 'IPRange')[[int]$_.BoundaryType]), $_.Value }) -join '; '
        SiteSystems   = (@($g.SiteSystems) -join '; ')
        Clients       = $bgClients[$g.Name]
        IpRangeBoundaries = @(@($g.Boundaries) | Where-Object { $_.BoundaryType -eq 3 }).Count
    }
}

$dpRows = foreach ($d in $dpRaw) {
    $server = ([string]$d.ServerName).ToLowerInvariant()
    $os = Get-DpcOsStandard -Build $d.OperatingSystemBuild
    $groups = @($bgRaw | Where-Object { @($_.SiteSystems) -contains $server } | ForEach-Object Name)
    $clients = 0; foreach ($gname in $groups) { $clients += [int]$bgClients[$gname] }
    $st = $statusByDp[$server]
    $office = $officeByDp[$server]
    [pscustomobject]@{
        Server              = $server
        SiteCode            = $d.SiteCode
        Location            = if ($office) { $office.Office } else { $d.Location }
        Region              = if ($office) { $office.Region } else { '' }
        Tier                = if ($office) { 'office' } else { 'datacenter-or-hub' }
        IsPullDP            = [bool]$d.IsPullDP
        IsPXE               = [bool]$d.IsPXE
        ConnectedCache      = $d.ConnectedCache
        OsBuild             = $d.OperatingSystemBuild
        OsRelease           = $os.Release
        OsStatus            = $os.Status
        HardwareSupportEnds = $d.HardwareSupportEnds
        ContentLibraryGB    = $d.ContentLibraryGB
        BoundaryGroups      = ($groups -join '; ')
        ClientsServed       = $clients
        LoadPctOfLimit      = [math]::Round(100 * $clients / $ClientsPerDpLimit, 1)
        ContentInstalled    = if ($st) { $st.NumberInstalled } else { $null }
        ContentErrors       = if ($st) { $st.NumberErrors } else { $null }
        ContentInProgress   = if ($st) { $st.NumberInProgress } else { $null }
    }
}

$appRows = foreach ($a in $appsRaw) {
    $wrap = if ($PackageSourceRoot -and $a.SourceFolder -and (Test-Path (Join-Path $PackageSourceRoot $a.SourceFolder))) {
        Get-DpcPsadtInfo -Path (Join-Path $PackageSourceRoot $a.SourceFolder)
    } else { [pscustomobject]@{ Wrapper = 'not-checked'; Major = 0; Version = '' } }
    [pscustomobject]@{ Application = $a.Name; SourceFolder = $a.SourceFolder; Deployments = [int]$a.Deployments; InstallCount = [int]$a.InstallCount
        Technology = $a.Technology; Wrapper = $wrap.Wrapper; WrapperVersion = $wrap.Version }
}
$roleRows = $rolesRaw | Select-Object Server, RoleName, SiteCode
$workloads = if ($WorkloadsCsv -and (Test-Path $WorkloadsCsv)) { @(Import-Csv $WorkloadsCsv) } else { @() }
$evidenceSources = if ($EvidenceSourcesCsv -and (Test-Path $EvidenceSourcesCsv)) { @(Import-Csv $EvidenceSourcesCsv) } else { @() }

# Findings.
$findings = New-Object System.Collections.ArrayList
function Add-Finding($id, $sev, $target, $text) { $null = $findings.Add([pscustomobject]@{ Id = $id; Severity = $sev; Target = $target; Finding = $text }) }
foreach ($d in $dpRows) {
    if ($d.OsStatus -eq 'below-standard') { Add-Finding 'DPC-INV-01' 'Finding' $d.Server "$($d.OsRelease) is below the Windows Server 2019 minimum (SA-22)" }
    elseif ($d.OsStatus -eq 'exception') { Add-Finding 'DPC-INV-02' 'Warn' $d.Server 'Windows Server 2016: allowed only as a recorded exception to the 2019 minimum' }
    elseif ($d.OsStatus -eq 'unknown') { Add-Finding 'DPC-INV-03' 'Warn' $d.Server 'OS build not read; confirm by hand' }
    if ($d.HardwareSupportEnds -and ([datetime]$d.HardwareSupportEnds) -lt $AsOf) { Add-Finding 'DPC-INV-04' 'Finding' $d.Server "Hardware support ended $($d.HardwareSupportEnds) (SA-22)" }
    if ($d.LoadPctOfLimit -gt 80) { Add-Finding 'DPC-INV-05' 'Finding' $d.Server "Serves $($d.ClientsServed) clients, over 80% of the $ClientsPerDpLimit-client limit" }
    if ($d.ContentErrors -gt 0) { Add-Finding 'DPC-INV-06' 'Warn' $d.Server "$($d.ContentErrors) content distribution errors" }
    if ($d.IsPXE) { Add-Finding 'DPC-INV-07' 'Info' $d.Server 'PXE enabled: retirement gate 3 depends on it' }
    if ("$($d.ConnectedCache)" -eq 'True') { Add-Finding 'DPC-INV-08' 'Info' $d.Server 'Connected Cache on DP hardware: retirement gate 4 depends on it' }
    if (-not $d.BoundaryGroups) { Add-Finding 'DPC-INV-09' 'Warn' $d.Server 'In no boundary group: serves no clients except as fallback' }
}
foreach ($u in $unmatched) { Add-Finding 'DPC-INV-10' 'Warn' "$($u.Subnet) ($($u.ADSiteName))" "$($u.Clients) clients on a subnet no boundary covers" }
foreach ($g in $bgRows) { if ($g.IpRangeBoundaries -gt 0) { Add-Finding 'DPC-INV-11' 'Info' $g.BoundaryGroup 'IP range boundaries are not matched to clients by this script; count by hand' } }
foreach ($o in $offices) { if (-not $o.CircuitMbps) { Add-Finding 'DPC-INV-12' 'Warn' $o.Office 'No circuit data: ask network engineering' } }

Write-DpcEvidence -Run $run -Name 'dp-inventory' -Rows $dpRows
Write-DpcEvidence -Run $run -Name 'boundary-groups' -Rows $bgRows
Write-DpcEvidence -Run $run -Name 'clients-by-boundary-group' -Rows ($bgRows | Select-Object BoundaryGroup, Clients)
Write-DpcEvidence -Run $run -Name 'site-roles' -Rows $roleRows
Write-DpcEvidence -Run $run -Name 'distribution-status' -Rows ($dpRows | Select-Object Server, ContentInstalled, ContentErrors, ContentInProgress)
Write-DpcEvidence -Run $run -Name 'applications' -Rows $appRows
Write-DpcEvidence -Run $run -Name 'packages' -Rows ($pkgRaw | Select-Object PackageID, Name, PkgSourcePath, Deployments)
Write-DpcEvidence -Run $run -Name 'offices' -Rows $offices
Write-DpcEvidence -Run $run -Name 'workloads' -Rows ($workloads + @($evidenceSources | ForEach-Object { [pscustomobject]@{ Setting = "Evidence:$($_.Control)"; State = $_.Source; RecordedFrom = $_.Evidence } }))
Write-DpcEvidence -Run $run -Name 'findings' -Rows @($findings)
$taskSeq = @($tsRaw)
$summary = @{
    distributionPoints = @($dpRows).Count
    officeDistributionPoints = @($dpRows | Where-Object Tier -EQ 'office').Count
    clients = ($subnets | Measure-Object -Property Clients -Sum).Sum
    boundaryGroups = @($bgRows).Count
    applications = @($appRows).Count
    applicationsOnPsadt = @($appRows | Where-Object Wrapper -EQ 'PSAppDeployToolkit').Count
    packages = @($pkgRaw).Count
    taskSequenceDeployments = $taskSeq.Count
    findings = $findings.Count
}
$null = Complete-DpcRun -Run $run -Summary $summary

Write-Output ("Distribution points: {0} ({1} in offices); clients: {2}; boundary groups: {3}" -f $summary.distributionPoints, $summary.officeDistributionPoints, $summary.clients, $summary.boundaryGroups)
Write-Output ("Applications: {0} ({1} on PSAppDeployToolkit); packages: {2}; task sequence deployments: {3}" -f $summary.applications, $summary.applicationsOnPsadt, $summary.packages, $summary.taskSequenceDeployments)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($findings | Where-Object Severity -EQ 'Finding').Count, @($findings | Where-Object Severity -EQ 'Warn').Count, @($findings | Where-Object Severity -EQ 'Info').Count)
Write-Output "Written to $($run.Output) (manifest.json holds the SHA-256 of every file)"
