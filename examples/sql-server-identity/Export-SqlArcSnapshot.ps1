#Requires -Version 7.1
<#
.SYNOPSIS
    Lab 2. Reads Azure Arc-enabled servers, their Azure extension for SQL Server, and the SQL Server instances
    Arc registered, through Azure Resource Graph (Reader is enough), and writes an Arc snapshot in the shape
    Invoke-SqlArcCheck.ps1 reads. Not run by the workbook's authors.
.DESCRIPTION
    Needs Az.Accounts and Az.ResourceGraph, signed in to AzureCloud (Connect-AzAccount -Environment AzureCloud).
    Every query projects id and sorts by it, so Search-AzGraph pages past 1,000 rows (the same pattern as
    Microsoft Automation, Module 4). A named instance keeps its name as HOST\INSTANCE.
    Whether Microsoft Entra authentication is configured on an instance isn't read from Resource Graph here:
    the snapshot leaves it null, and the Arc check reports it as not configured until you confirm it in the
    portal (the instance's Microsoft Entra ID setting) and set it in the snapshot.
.PARAMETER SubscriptionId
    The subscriptions that hold the Arc resources.
.PARAMETER OutputPath
    The snapshot file to write.
.PARAMETER AsOf
    The date of the snapshot (yyyy-MM-dd).
.EXAMPLE
    ./Export-SqlArcSnapshot.ps1 -SubscriptionId <subscription-id> -OutputPath lab2/arc.json -AsOf 2026-11-20
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string[]]$SubscriptionId, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
$ErrorActionPreference = 'Stop'
$OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
Import-Module Az.Accounts, Az.ResourceGraph
$ctx = Get-AzContext
if (-not $ctx -or $ctx.Environment.Name -ne 'AzureCloud') { throw 'Sign in to AzureCloud first: Connect-AzAccount -Environment AzureCloud' }
$all = { param($kql) $out = @(); $skip = $null
    do { $r = if ($skip) { Search-AzGraph -Query $kql -Subscription $SubscriptionId -First 1000 -SkipToken $skip } else { Search-AzGraph -Query $kql -Subscription $SubscriptionId -First 1000 }
         $out += @($r); $skip = $r.SkipToken } while ($skip)
    $out }
$machines = & $all "resources | where type =~ 'microsoft.hybridcompute/machines' | project id, name = tolower(name), status = tostring(properties.status), agentVersion = tostring(properties.agentVersion) | order by id asc"
$ext = & $all "resources | where type =~ 'microsoft.hybridcompute/machines/extensions' | where tostring(properties.type) in~ ('WindowsAgent.SqlServer', 'LinuxAgent.SqlServer') | project id, machine = tolower(tostring(split(id, '/')[8])), type = tostring(properties.type), provisioningState = tostring(properties.provisioningState) | order by id asc"
$sql = & $all "resources | where type =~ 'microsoft.azurearcdata/sqlserverinstances' | project id, name = toupper(replace_string(name, '_', '\\')), machine = tolower(tostring(split(tostring(properties.containerResourceId), '/')[8])), version = tostring(properties.version) | order by id asc"
$snap = [ordered]@{
    asOf = $AsOf; environment = $ctx.Environment.Name; note = 'Azure Resource Graph results. entraAuthentication.configured is null until confirmed in the portal.'
    machines = @($machines | ForEach-Object { [ordered]@{ name = $_.name; status = $_.status; agentVersion = $_.agentVersion } })
    extensions = @($ext | ForEach-Object { [ordered]@{ machine = $_.machine; type = $_.type; provisioningState = $_.provisioningState } })
    sqlInstances = @($sql | ForEach-Object { [ordered]@{ name = $_.name; machine = $_.machine; version = $_.version; entraAuthentication = [ordered]@{ configured = $null; method = $null } } })
}
New-Item -ItemType Directory -Force -Path (Split-Path $OutputPath -Parent) | Out-Null
[IO.File]::WriteAllText($OutputPath, (ConvertTo-Json -Depth 6 -InputObject $snap) + "`n")
Write-Host "Wrote $($OutputPath): $(@($machines).Count) machines, $(@($ext).Count) SQL extensions, $(@($sql).Count) SQL Server instances."
