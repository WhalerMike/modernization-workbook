<#
.SYNOPSIS
    Step 6: retire one office distribution point in three steps: Check (read-only go/no-go), Drain
    (take it out of its boundary groups) and Remove (remove the DP role, then the site system server
    if nothing else is on it). Drain and Remove are dry runs unless -Apply.
.DESCRIPTION
    Check reads the latest inventory run and passes only when every boundary group the DP serves also
    lists at least one other DP (the hub), the DP has no PXE, no Connected Cache and no site system role
    other than the distribution point, and it has no content in progress.
    Drain plans Set-CMDistributionPoint -RemoveBoundaryGroupName for each of its groups. Then wait:
    the guide's rule is 30 days with no content served before Remove.
    Remove plans Remove-CMDistributionPoint -Force, then Remove-CMSiteSystemServer -Force when the server
    holds no other role. Removing the role removes the DP's content library shares and IIS
    configuration; sanitize and retire the hardware under the agency's media sanitization procedure.
.EXAMPLE
    ./Invoke-DpcOfficeRetirement.ps1 -InventoryPath out/inventory-pilot -Server off08-dp.lab.example -Step Check -OutputPath out/retire-off08-check
.EXAMPLE
    ./Invoke-DpcOfficeRetirement.ps1 -InventoryPath out/inventory-pilot -Server off08-dp.lab.example -Step Drain -SiteCode LAB -OutputPath out/retire-off08-drain
.EXAMPLE
    # The last hub DPs, once Test-DpcRetirementGates.ps1 reports all five gates closed.
    ./Invoke-DpcOfficeRetirement.ps1 -InventoryPath out/inventory-final -Server east-dp01.lab.example -Step Drain -GatesPath out/gates-final -SiteCode LAB -OutputPath out/retire-east-dp01-drain
.EXAMPLE
    .\Invoke-DpcOfficeRetirement.ps1 -InventoryPath .\out\inventory-day30 -Server off08-dp.lab.example -Step Remove -SiteCode LAB -ProviderMachineName cm01.lab.example -Apply -OutputPath .\out\retire-off08-remove
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$InventoryPath,
    [Parameter(Mandatory)][string]$Server,
    [Parameter(Mandatory)][ValidateSet('Check', 'Drain', 'Remove')][string]$Step,
    [string]$SiteCode,
    [string]$ProviderMachineName,
    [string]$OutputPath,
    [string]$GatesPath,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$Server = $Server.ToLowerInvariant()
$dps = Read-DpcRows -RunPath $InventoryPath -Name 'dp-inventory'
$bgs = Read-DpcRows -RunPath $InventoryPath -Name 'boundary-groups'
$roles = Read-DpcRows -RunPath $InventoryPath -Name 'site-roles'
$dp = $dps | Where-Object Server -EQ $Server | Select-Object -First 1
if (-not $dp) { throw "$Server is not a distribution point in $InventoryPath." }
if (-not $SiteCode) { $SiteCode = $dp.SiteCode }

$groups = @($bgs | Where-Object { ($_.SiteSystems -split '; ') -contains $Server })
$otherRoles = @($roles | Where-Object { $_.Server -eq $Server -and $_.RoleName -notin @('SMS Distribution Point', 'SMS Site System') } | ForEach-Object RoleName)
$checks = New-Object System.Collections.ArrayList
# The last tier: with a gates run in which all five retirement gates are closed, a DP may be the only
# content source left in its groups.
$lastTier = $false
if ($GatesPath) {
    $gateRows = @(Read-DpcRows -RunPath $GatesPath -Name 'gates')
    $lastTier = ($gateRows.Count -eq 5 -and @($gateRows | Where-Object Status -NE 'closed').Count -eq 0)
    $null = $checks.Add([pscustomobject]@{ Check = 'All five retirement gates closed'; Pass = $lastTier; Detail = $GatesPath })
}
foreach ($g in $groups) {
    if ($lastTier) { $null = $checks.Add([pscustomobject]@{ Check = "Boundary group $($g.BoundaryGroup) has another content source"; Pass = $true; Detail = 'waived: last tier, all gates closed' }); continue }
    $others = @(($g.SiteSystems -split '; ') | Where-Object { $_ -and $_ -ne $Server })
    $null = $checks.Add([pscustomobject]@{ Check = "Boundary group $($g.BoundaryGroup) has another content source"; Pass = ($others.Count -gt 0); Detail = ($others -join ', ') })
}
$null = $checks.Add([pscustomobject]@{ Check = 'PXE off'; Pass = (-not [bool]$dp.IsPXE); Detail = "IsPXE=$($dp.IsPXE)" })
$null = $checks.Add([pscustomobject]@{ Check = 'No Connected Cache on this DP'; Pass = ("$($dp.ConnectedCache)" -ne 'True'); Detail = "ConnectedCache=$($dp.ConnectedCache)" })
$null = $checks.Add([pscustomobject]@{ Check = 'No content distribution in progress'; Pass = ([int]$dp.ContentInProgress -eq 0); Detail = "InProgress=$($dp.ContentInProgress)" })
$siteSystemNote = if ($otherRoles.Count) { "keeps the site system: $($otherRoles -join ', ')" } else { 'none' }
$null = $checks.Add([pscustomobject]@{ Check = 'Other site system roles on the server'; Pass = $true; Detail = $siteSystemNote })
if ($Step -eq 'Remove') {
    $null = $checks.Add([pscustomobject]@{ Check = 'Drained: in no boundary group'; Pass = ($groups.Count -eq 0); Detail = (($groups | ForEach-Object BoundaryGroup) -join ', ') })
}
$go = @($checks | Where-Object { -not $_.Pass }).Count -eq 0
# Drain is allowed only on a go; Remove additionally needs the DP drained.

$plan = New-Object System.Collections.ArrayList
if ($Step -eq 'Drain' -and $go) {
    $names = @($groups | ForEach-Object BoundaryGroup)
    $null = $plan.Add((New-DpcPlanItem -Step '6.2 drain' -Target $Server -Cmdlet 'Set-CMDistributionPoint' `
        -Parameters @{ SiteSystemServerName = $Server; SiteCode = $SiteCode; RemoveBoundaryGroupName = $names } `
        -Rollback ("Set-CMDistributionPoint -SiteSystemServerName '{0}' -SiteCode '{1}' -AddBoundaryGroupName {2}" -f $Server, $SiteCode, (($names | ForEach-Object { "'$_'" }) -join ','))))
}
if ($Step -eq 'Remove' -and $go) {
    $null = $plan.Add((New-DpcPlanItem -Step '6.4 remove the DP role' -Target $Server -Cmdlet 'Remove-CMDistributionPoint' `
        -Parameters @{ SiteSystemServerName = $Server; SiteCode = $SiteCode; Force = [switch]::Present } `
        -Rollback "Add-CMDistributionPoint -SiteSystemServerName '$Server' -SiteCode '$SiteCode' -CertificateExpirationTimeUtc <date>, then redistribute its content (Step 3.4)"))
    if ($otherRoles.Count -eq 0) {
        $null = $plan.Add((New-DpcPlanItem -Step '6.5 remove the site system server' -Target $Server -Cmdlet 'Remove-CMSiteSystemServer' `
            -Parameters @{ SiteSystemServerName = $Server; SiteCode = $SiteCode; Force = [switch]::Present } `
            -Rollback "New-CMSiteSystemServer -SiteSystemServerName '$Server' -SiteCode '$SiteCode'"))
    }
}

$mode = if ($Step -eq 'Check') { 'DryRun' } elseif ($Apply) { 'Apply' } else { 'DryRun' }
$run = New-DpcRun -Task "retire-$Step".ToLowerInvariant() -Mode $mode -OutputPath $OutputPath -SiteCode $SiteCode
Write-DpcEvidence -Run $run -Name 'retirement-check' -Rows @($checks | Select-Object @{ n = 'Server'; e = { $Server } }, Check, Pass, Detail)
$rows = @()
if ($plan.Count) {
    $here = Get-Location
    try {
        if ($Apply) {
            if (-not $ProviderMachineName) { throw '-Apply needs -ProviderMachineName.' }
            Connect-DpcSite -SiteCode $SiteCode -ProviderMachineName $ProviderMachineName
        }
        $rows = Invoke-DpcPlan -Plan @($plan) -Run $run -Apply:$Apply -Caller $PSCmdlet
    } finally { Set-Location $here }
}
$null = Complete-DpcRun -Run $run -Summary @{ server = $Server; step = $Step; go = $go }

foreach ($c in $checks) { Write-Output ("  [{0}] {1}{2}" -f $(if ($c.Pass) { 'pass' } else { 'FAIL' }), $c.Check, $(if ($c.Detail) { ": $($c.Detail)" } else { '' })) }
Write-Output ("{0} {1}: {2}" -f $Step, $Server, $(if ($go) { 'GO' } else { 'NO-GO' }))
foreach ($r in $rows) { Write-Output ("  {0}: {1}" -f $r.Status, $r.Command) }
Write-Output "Evidence: $($run.Output)"
if (-not $go) { exit 2 } else { exit 0 }
