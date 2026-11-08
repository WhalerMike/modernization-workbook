# DpConsolidation: shared functions for the distribution point consolidation kit.
# Read-only helpers, evidence writing with SHA-256 manifests, the OS standard check,
# PSAppDeployToolkit detection, and the dry-run plan runner used by the change scripts.
# Runs on Windows PowerShell 5.1 (needed for the live ConfigurationManager module) and
# PowerShell 7 (fixtures, tests). Nothing here calls a Configuration Manager cmdlet.

Set-StrictMode -Version 2.0

# Evidence tags: the controls and FedRAMP 20x KSIs each output supports. KSIs are provider-side
# indicators; the agency lines its evidence up with them and doesn't report them itself.
$script:Tags = @{
    'dp-inventory'              = @{ Controls = @('CM-8', 'SA-22'); Ksi = @('KSI-PIY-GIV', 'KSI-SCR-MIT') }
    'boundary-groups'           = @{ Controls = @('CM-8', 'CM-6'); Ksi = @('KSI-PIY-GIV', 'KSI-CMT-LMC') }
    'clients-by-boundary-group' = @{ Controls = @('CM-8'); Ksi = @('KSI-PIY-GIV') }
    'site-roles'                = @{ Controls = @('CM-8'); Ksi = @('KSI-PIY-GIV') }
    'distribution-status'       = @{ Controls = @('CM-6', 'SI-2'); Ksi = @('KSI-CMT-LMC', 'KSI-CMT-VTD') }
    'applications'              = @{ Controls = @('CM-8', 'CM-2'); Ksi = @('KSI-PIY-GIV', 'KSI-CMT-RMV') }
    'packages'                  = @{ Controls = @('CM-8', 'CM-2'); Ksi = @('KSI-PIY-GIV', 'KSI-CMT-RMV') }
    'offices'                   = @{ Controls = @('CM-8'); Ksi = @('KSI-PIY-GIV') }
    'workloads'                 = @{ Controls = @('CM-6', 'CA-7'); Ksi = @('KSI-CMT-LMC', 'KSI-MLA-EVC') }
    'findings'                  = @{ Controls = @('CM-8', 'SA-22', 'CM-6'); Ksi = @('KSI-PIY-GIV', 'KSI-SCR-MIT', 'KSI-CMT-LMC') }
    'sizing'                    = @{ Controls = @('CM-8', 'CM-3'); Ksi = @('KSI-PIY-GIV', 'KSI-CMT-LMC') }
    'waves'                     = @{ Controls = @('CM-3'); Ksi = @('KSI-CMT-LMC', 'KSI-CMT-RVP') }
    'packaging'                 = @{ Controls = @('CM-2', 'CM-3'); Ksi = @('KSI-CMT-RMV', 'KSI-CMT-LMC') }
    'gates'                     = @{ Controls = @('CM-8', 'CM-6', 'CA-7'); Ksi = @('KSI-PIY-GIV', 'KSI-CMT-LMC', 'KSI-MLA-EVC') }
    'retirement-check'          = @{ Controls = @('CM-3', 'CM-8'); Ksi = @('KSI-CMT-LMC', 'KSI-PIY-GIV') }
    'plan'                      = @{ Controls = @('CM-3', 'CM-6'); Ksi = @('KSI-CMT-LMC', 'KSI-CMT-RVP') }
}

function Get-DpcTag {
    <#
    .SYNOPSIS
        Return the controls and KSIs the kit tags an evidence file with.
    .EXAMPLE
        Get-DpcTag -Name dp-inventory
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Name)
    if ($script:Tags.ContainsKey($Name)) { return $script:Tags[$Name] }
    return @{ Controls = @(); Ksi = @() }
}

function Get-DpcOsStandard {
    <#
    .SYNOPSIS
        Judge a Windows Server build number against the workbook's Windows Server 2019 minimum.
    .DESCRIPTION
        Returns the release name and a status: meets-standard (2019 or later), exception (2016,
        allowed only as a recorded exception) or below-standard (older). Unknown when no build.
    .EXAMPLE
        Get-DpcOsStandard -Build 14393
    #>
    [CmdletBinding()]
    param([AllowNull()][object]$Build)
    $b = 0
    if ($null -eq $Build -or -not [int]::TryParse([string]$Build, [ref]$b)) {
        return [pscustomobject]@{ Release = 'unknown'; Status = 'unknown' }
    }
    $release = switch ($b) {
        { $_ -ge 26100 } { 'Windows Server 2025'; break }
        { $_ -ge 20348 } { 'Windows Server 2022'; break }
        { $_ -ge 17763 } { 'Windows Server 2019'; break }
        { $_ -ge 14393 } { 'Windows Server 2016'; break }
        { $_ -ge 9600 } { 'Windows Server 2012 R2'; break }
        default { 'older than Windows Server 2012 R2' }
    }
    $status = if ($b -ge 17763) { 'meets-standard' } elseif ($b -ge 14393) { 'exception' } else { 'below-standard' }
    [pscustomobject]@{ Release = $release; Status = $status }
}

function Get-DpcServerName {
    <#
    .SYNOPSIS
        Extract a server FQDN from a Configuration Manager NAL path or network OS path.
    .EXAMPLE
        Get-DpcServerName -Path '["Display=\\dp1.lab.example\"]MSWNET:["SMS_SITE=LAB"]\\dp1.lab.example\'
    #>
    [CmdletBinding()]
    param([AllowNull()][string]$Path)
    if (-not $Path) { return $null }
    $m = [regex]::Matches($Path, '\\\\([A-Za-z0-9.\-]+)')
    if ($m.Count -gt 0) { return $m[$m.Count - 1].Groups[1].Value.ToLowerInvariant() }
    return $Path.Trim('\').ToLowerInvariant()
}

function Get-DpcSha256 {
    <#
    .SYNOPSIS
        SHA-256 of a file, lower-case hex.
    .EXAMPLE
        Get-DpcSha256 -Path out/run/dp-inventory.csv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function New-DpcRun {
    <#
    .SYNOPSIS
        Start an evidence run: create the output folder and return the run record.
    .DESCRIPTION
        With no OutputPath the folder is out/<task>-<yyyyMMdd-HHmmss> under the current folder.
    .EXAMPLE
        $run = New-DpcRun -Task inventory -Mode Fixture
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Task,
        [Parameter(Mandatory)][ValidateSet('Fixture', 'Live', 'DryRun', 'Apply')][string]$Mode,
        [string]$OutputPath,
        [string]$SiteCode
    )
    $stamp = (Get-Date).ToUniversalTime()
    if (-not $OutputPath) { $OutputPath = Join-Path 'out' ("{0}-{1}" -f $Task, $stamp.ToString('yyyyMMdd-HHmmss')) }
    $null = New-Item -ItemType Directory -Force -Path $OutputPath
    [pscustomobject]@{
        Task      = $Task
        Mode      = $Mode
        SiteCode  = $SiteCode
        StartedAt = $stamp.ToString('yyyy-MM-ddTHH:mm:ssZ')
        Output    = (Resolve-Path -LiteralPath $OutputPath).Path
        Files     = New-Object System.Collections.ArrayList
    }
}

function Write-DpcEvidence {
    <#
    .SYNOPSIS
        Write one evidence table as CSV and JSON, tagged with its controls and KSIs.
    .EXAMPLE
        Write-DpcEvidence -Run $run -Name dp-inventory -Rows $rows
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Run,
        [Parameter(Mandatory)][string]$Name,
        [AllowEmptyCollection()][object[]]$Rows = @()
    )
    $tag = Get-DpcTag -Name $Name
    $csv = Join-Path $Run.Output "$Name.csv"
    $json = Join-Path $Run.Output "$Name.json"
    $rows = @($Rows)
    if ($rows.Count -gt 0) {
        $rows | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
    } else {
        Set-Content -LiteralPath $csv -Value '' -Encoding UTF8
    }
    $doc = [ordered]@{
        evidence  = $Name
        task      = $Run.Task
        mode      = $Run.Mode
        siteCode  = $Run.SiteCode
        generated = $Run.StartedAt
        controls  = @($tag.Controls)
        ksi       = @($tag.Ksi)
        count     = $rows.Count
        rows      = $rows
    }
    $doc | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $json -Encoding UTF8
    foreach ($f in @($csv, $json)) {
        $null = $Run.Files.Add([pscustomobject]@{ file = (Split-Path -Leaf $f); evidence = $Name; controls = @($tag.Controls); ksi = @($tag.Ksi) })
    }
}

function Complete-DpcRun {
    <#
    .SYNOPSIS
        Finish a run: write manifest.json with the SHA-256 of every file the run wrote.
    .EXAMPLE
        Complete-DpcRun -Run $run
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Run, [hashtable]$Summary = @{})
    $files = foreach ($f in $Run.Files) {
        [ordered]@{
            file     = $f.file
            evidence = $f.evidence
            sha256   = Get-DpcSha256 -Path (Join-Path $Run.Output $f.file)
            controls = $f.controls
            ksi      = $f.ksi
        }
    }
    $manifest = [ordered]@{
        kit       = 'dp-consolidation'
        task      = $Run.Task
        mode      = $Run.Mode
        siteCode  = $Run.SiteCode
        started   = $Run.StartedAt
        finished  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        readOnly  = ($Run.Mode -in @('Fixture', 'Live', 'DryRun'))
        summary   = $Summary
        files     = @($files)
    }
    $path = Join-Path $Run.Output 'manifest.json'
    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $path -Encoding UTF8
    return $path
}

function Test-DpcManifest {
    <#
    .SYNOPSIS
        Re-hash every file a manifest lists and report any that changed. Returns $true when all match.
    .EXAMPLE
        Test-DpcManifest -Path out/inventory/manifest.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $m = Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
    $dir = Split-Path -Parent $Path
    $ok = $true
    foreach ($f in $m.files) {
        $actual = Get-DpcSha256 -Path (Join-Path $dir $f.file)
        if ($actual -ne $f.sha256) { Write-Warning "Hash mismatch: $($f.file)"; $ok = $false }
    }
    return $ok
}

function Read-DpcJson {
    <#
    .SYNOPSIS
        Read a JSON file as objects (an array stays an array).
    .EXAMPLE
        Read-DpcJson -Path tests/fixtures/estate/distribution-points.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $o = Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
    return , @($o)
}

function Read-DpcRows {
    <#
    .SYNOPSIS
        Read an evidence table the kit wrote (the rows of <name>.json in a run folder).
    .EXAMPLE
        Read-DpcRows -RunPath out/inventory -Name dp-inventory
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$Name)
    $p = Join-Path $RunPath "$Name.json"
    if (-not (Test-Path -LiteralPath $p)) { throw "Missing $Name.json in $RunPath. Run Invoke-DpcInventory.ps1 first." }
    $doc = Get-Content -Raw -LiteralPath $p | ConvertFrom-Json
    return @($doc.rows)
}

function Test-DpcSubnetMatch {
    <#
    .SYNOPSIS
        True when a client's subnet ID matches an IP subnet boundary value (with or without a /prefix).
    .EXAMPLE
        Test-DpcSubnetMatch -ClientSubnet 10.20.1.0 -BoundaryValue 10.20.1.0/24
    #>
    [CmdletBinding()]
    param([string]$ClientSubnet, [string]$BoundaryValue)
    if (-not $ClientSubnet -or -not $BoundaryValue) { return $false }
    return ($ClientSubnet.Split('/')[0] -eq $BoundaryValue.Split('/')[0])
}

function Get-DpcPsadtInfo {
    <#
    .SYNOPSIS
        Detect whether a package source folder is wrapped in PSAppDeployToolkit, and which version.
    .DESCRIPTION
        Version 4 packages carry Invoke-AppDeployToolkit.ps1 with DeployAppScriptVersion in its
        session table; version 3 packages carry AppDeployToolkit\AppDeployToolkitMain.ps1 or
        Deploy-Application.ps1. Anything else is 'none'. Reads files only.
    .EXAMPLE
        Get-DpcPsadtInfo -Path tests/fixtures/packages/LabViewer
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $v4 = Join-Path $Path 'Invoke-AppDeployToolkit.ps1'
    if (Test-Path -LiteralPath $v4) {
        $text = Get-Content -Raw -LiteralPath $v4
        $m = [regex]::Match($text, "DeployAppScriptVersion\s*=\s*'([0-9.]+)'")
        $ver = if ($m.Success) { $m.Groups[1].Value } else { '4' }
        return [pscustomobject]@{ Wrapper = 'PSAppDeployToolkit'; Major = 4; Version = $ver }
    }
    if ((Test-Path -LiteralPath (Join-Path $Path 'AppDeployToolkit/AppDeployToolkitMain.ps1')) -or
        (Test-Path -LiteralPath (Join-Path $Path 'Deploy-Application.ps1'))) {
        return [pscustomobject]@{ Wrapper = 'PSAppDeployToolkit'; Major = 3; Version = '3' }
    }
    $msi = @(Get-ChildItem -LiteralPath $Path -Filter '*.msi' -File -ErrorAction SilentlyContinue)
    $kind = if ($msi.Count -gt 0) { 'msi-only' } else { 'none' }
    return [pscustomobject]@{ Wrapper = $kind; Major = 0; Version = '' }
}

function Format-DpcCommand {
    <#
    .SYNOPSIS
        Render a planned cmdlet call as the exact command line a reader could run.
    .EXAMPLE
        Format-DpcCommand -Cmdlet Set-CMBoundaryGroup -Parameters @{ Name = 'BG-East'; AllowPeerDownload = $true }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cmdlet, [hashtable]$Parameters = @{})
    $parts = @($Cmdlet)
    foreach ($k in ($Parameters.Keys | Sort-Object)) {
        $v = $Parameters[$k]
        if ($v -is [bool]) { $parts += "-$k `$$($v.ToString().ToLowerInvariant())" }
        elseif ($v -is [switch]) { if ($v.IsPresent) { $parts += "-$k" } }
        elseif ($v -is [array]) { $parts += "-$k " + (($v | ForEach-Object { if ($_ -is [int]) { "$_" } else { "'$_'" } }) -join ',') }
        elseif ($v -is [int]) { $parts += "-$k $v" }
        else { $parts += "-$k '$v'" }
    }
    return ($parts -join ' ')
}

function New-DpcPlanItem {
    <#
    .SYNOPSIS
        One planned change: the step, the target, the cmdlet and its parameters, and the rollback.
    .EXAMPLE
        New-DpcPlanItem -Step 'pull DP' -Target 'east-dp01.lab.example' -Cmdlet Set-CMDistributionPoint -Parameters @{ SiteSystemServerName = 'east-dp01.lab.example'; EnablePullDP = $true } -Rollback 'Set-CMDistributionPoint -SiteSystemServerName east-dp01.lab.example -EnablePullDP $false'
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Step,
        [Parameter(Mandatory)][string]$Target,
        [Parameter(Mandatory)][string]$Cmdlet,
        [hashtable]$Parameters = @{},
        [string]$Rollback = ''
    )
    [pscustomobject]@{
        Step       = $Step
        Target     = $Target
        Cmdlet     = $Cmdlet
        Command    = Format-DpcCommand -Cmdlet $Cmdlet -Parameters $Parameters
        Rollback   = $Rollback
        Status     = 'planned'
        Parameters = $Parameters
    }
}

function Invoke-DpcPlan {
    <#
    .SYNOPSIS
        Run a change plan. Without -Apply it only records the plan (dry run); with -Apply it calls
        each cmdlet, honoring -WhatIf through the calling script's ShouldProcess.
    .EXAMPLE
        Invoke-DpcPlan -Plan $plan -Run $run -Cmdlet $PSCmdlet
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Plan,
        [Parameter(Mandatory)]$Run,
        [switch]$Apply,
        $Caller
    )
    foreach ($item in $Plan) {
        if (-not $Apply) { $item.Status = 'dry-run'; continue }
        if ($Caller -and -not $Caller.ShouldProcess($item.Target, $item.Command)) { $item.Status = 'skipped (WhatIf)'; continue }
        try {
            $p = $item.Parameters
            & $item.Cmdlet @p | Out-Null
            $item.Status = 'applied'
        } catch {
            $item.Status = "failed: $($_.Exception.Message)"
            Write-Warning "$($item.Command) failed: $($_.Exception.Message). Stopping; run the rollbacks of the applied rows."
            break
        }
    }
    $rows = $Plan | Select-Object Step, Target, Cmdlet, Command, Rollback, Status
    Write-DpcEvidence -Run $Run -Name 'plan' -Rows $rows
    return $rows
}

function Connect-DpcSite {
    <#
    .SYNOPSIS
        Import the ConfigurationManager module and change to the site drive, as Learn's getting-started page shows.
    .EXAMPLE
        Connect-DpcSite -SiteCode LAB -ProviderMachineName cm01.lab.example
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SiteCode, [Parameter(Mandatory)][string]$ProviderMachineName)
    if (-not (Get-Module ConfigurationManager)) {
        try { Import-Module ConfigurationManager -ErrorAction Stop }
        catch {
            if (-not $env:SMS_ADMIN_UI_PATH) { throw 'The Configuration Manager console is not installed here: ConfigurationManager module not found.' }
            Import-Module (Join-Path (Split-Path -Parent $env:SMS_ADMIN_UI_PATH) 'ConfigurationManager.psd1') -ErrorAction Stop
        }
    }
    if (-not (Get-PSDrive -Name $SiteCode -PSProvider CMSite -ErrorAction SilentlyContinue)) {
        $null = New-PSDrive -Name $SiteCode -PSProvider CMSite -Root $ProviderMachineName
    }
    Set-Location "$($SiteCode):"
}

Export-ModuleMember -Function Get-DpcTag, Get-DpcOsStandard, Get-DpcServerName, Get-DpcSha256, New-DpcRun,
    Write-DpcEvidence, Complete-DpcRun, Test-DpcManifest, Read-DpcJson, Read-DpcRows, Test-DpcSubnetMatch,
    Get-DpcPsadtInfo, Format-DpcCommand, New-DpcPlanItem, Invoke-DpcPlan, Connect-DpcSite
