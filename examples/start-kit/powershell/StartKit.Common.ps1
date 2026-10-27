<#
.SYNOPSIS
    Shared helpers for the Start Kit modules: the output guard, the writers and the
    provenance manifest. Dot-sourced by FMPADAssessment.psm1 and FMPSqlEstate.psm1, so each
    module gets its own copy in its own scope.

.DESCRIPTION
    Every file the kit writes goes through Write-FMPJson, Write-FMPCsv, Write-FMPText or
    Write-FMPBytes. Each one refuses a path that isn't under an output root registered with
    Resolve-FMPOutputRoot, which every public collector calls on its -OutputPath first. These
    are the only functions in the kit allowed to touch the file system; the safety tests
    (tests/powershell/Safety.Tests.ps1) fail if any other function does.

    Windows PowerShell 5.1 and PowerShell 7: no PowerShell 7-only syntax here.
#>

$script:FMPKitVersion = '1.0.0'
$script:FMPAllowedRoots = [System.Collections.Generic.List[string]]::new()
$script:FMPUtf8 = [System.Text.UTF8Encoding]::new($false)

function ConvertTo-FMPFullPath {
    # Resolves a relative path against PowerShell's current location, not the process
    # directory that [IO.Path]::GetFullPath alone would use.
    param([Parameter(Mandatory)][string]$Path)
    [System.IO.Path]::GetFullPath($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path))
}

function Resolve-FMPOutputRoot {
    # Creates the output root if needed, registers it as writable, and returns its full path.
    param([Parameter(Mandatory)][string]$OutputPath)
    $full = (ConvertTo-FMPFullPath -Path $OutputPath).TrimEnd('\', '/')
    [void][System.IO.Directory]::CreateDirectory($full)
    if (-not $script:FMPAllowedRoots.Contains($full)) { $script:FMPAllowedRoots.Add($full) }
    $full
}

function Assert-FMPWritePath {
    # Throws unless $Path is inside a registered output root.
    param([Parameter(Mandatory)][string]$Path)
    $full = ConvertTo-FMPFullPath -Path $Path
    foreach ($root in $script:FMPAllowedRoots) {
        if ($full.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or
            $full.Equals($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $full
        }
    }
    throw "Refusing to write outside -OutputPath: $full"
}

function Initialize-FMPPath {
    param([Parameter(Mandatory)][string]$Path)
    $full = Assert-FMPWritePath -Path $Path
    [void][System.IO.Directory]::CreateDirectory($full)
    $full
}

function Get-FMPDomainPath {
    # Returns <OutputPath>\<domain>\<Area>, creating it if needed.
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][string]$Area
    )
    Initialize-FMPPath -Path (Join-Path (Join-Path $OutputPath $Domain) $Area)
}

function Write-FMPJson {
    param(
        [Parameter(Mandatory)][AllowNull()][AllowEmptyCollection()]$InputObject,
        [Parameter(Mandatory)][string]$Path,
        [int]$Depth = 8
    )
    $full = Assert-FMPWritePath -Path $Path
    $json = ConvertTo-Json -InputObject $InputObject -Depth $Depth
    if ($null -eq $json) { $json = 'null' }
    [System.IO.File]::WriteAllText($full, $json, $script:FMPUtf8)
}

function Write-FMPCsv {
    param(
        [Parameter(Mandatory)][AllowNull()][AllowEmptyCollection()]$InputObject,
        [Parameter(Mandatory)][string]$Path
    )
    $full = Assert-FMPWritePath -Path $Path
    $rows = @($InputObject | Where-Object { $null -ne $_ })
    [string[]]$lines = @()
    if ($rows.Count -gt 0) { $lines = @($rows | ConvertTo-Csv -NoTypeInformation) }
    [System.IO.File]::WriteAllLines($full, $lines, $script:FMPUtf8)
}

function Write-FMPText {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][AllowEmptyCollection()]$Value,
        [Parameter(Mandatory)][string]$Path
    )
    $full = Assert-FMPWritePath -Path $Path
    [System.IO.File]::WriteAllText($full, (@($Value) -join "`n"), $script:FMPUtf8)
}

function Write-FMPBytes {
    param(
        [Parameter(Mandatory)][byte[]]$Bytes,
        [Parameter(Mandatory)][string]$Path
    )
    $full = Assert-FMPWritePath -Path $Path
    [System.IO.File]::WriteAllBytes($full, $Bytes)
}

function Test-FMPCommand {
    # True when a command is available: how collectors detect a missing RSAT module.
    param([Parameter(Mandatory)][string]$Name)
    [bool](Get-Command -Name $Name -ErrorAction SilentlyContinue)
}

function Assert-FMPCommand {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Module
    )
    if (-not (Test-FMPCommand -Name $Name)) {
        throw "$Name isn't available. Install the $Module module (RSAT) on the assessment host."
    }
}

function ConvertTo-FMPRunId {
    # Book 01 Chapter 10's run identifier: YYYY-MM-DD-HHmm-<host>-<tier>, in UTC.
    param(
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$HostName,
        [Parameter(Mandatory)][ValidateSet('A', 'B')][string]$Tier
    )
    $safeHost = ($HostName -replace '[^A-Za-z0-9\-]', '').ToLowerInvariant()
    '{0}-{1}-tier{2}' -f $AsOf.ToUniversalTime().ToString('yyyy-MM-dd-HHmm'), $safeHost, $Tier
}

function Get-FMPFileManifest {
    # Relative path, size and SHA-256 of every file under $Root, sorted, excluding $Exclude.
    param(
        [Parameter(Mandatory)][string]$Root,
        [string[]]$Exclude = @()
    )
    $base = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
    @(Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
            $rel = $_.FullName.Substring($base.Length).TrimStart('\', '/') -replace '\\', '/'
            if ($Exclude -notcontains $rel) {
                [pscustomobject]@{
                    RelativePath = $rel
                    SizeBytes    = $_.Length
                    SHA256       = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
                }
            }
        } | Sort-Object RelativePath)
}

function Get-FMPModuleVersions {
    # Versions of the modules the kit relies on, as installed on this host (null when absent).
    $names = 'ActiveDirectory', 'GroupPolicy', 'DnsServer', 'DhcpServer', 'dbatools', 'FMPADAssessment', 'FMPSqlEstate'
    $o = [ordered]@{}
    foreach ($n in $names) {
        $m = Get-Module -Name $n | Select-Object -First 1
        if (-not $m) { $m = Get-Module -ListAvailable -Name $n | Sort-Object Version -Descending | Select-Object -First 1 }
        $o[$n] = if ($m) { "$($m.Version)" } else { $null }
    }
    [pscustomobject]$o
}

function Get-FMPExecutor {
    # Who ran it: the Windows identity where there is one.
    try { [System.Security.Principal.WindowsIdentity]::GetCurrent().Name }
    catch { "$env:USERDOMAIN\$env:USERNAME" }
}

function Write-FMPManifest {
    <#
    .SYNOPSIS
        Writes AssessmentManifest.json at the run root: who, when, where, with what, and a
        SHA-256 hash of every other file in the run. Book 01 Chapter 10's provenance fields.
    #>
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][string]$RunId,
        [Parameter(Mandatory)][datetime]$StartTime,
        [Parameter(Mandatory)][string]$Tier,
        [string]$Forest,
        [string[]]$Domains = @(),
        [hashtable]$ServedBy = @{},
        [object[]]$Steps = @(),
        [hashtable]$Parameters = @{}
    )
    $end = (Get-Date).ToUniversalTime()
    $files = @(Get-FMPFileManifest -Root $RunPath -Exclude 'AssessmentManifest.json')
    $manifest = [ordered]@{
        Schema         = 'fmp-start-kit/assessment-manifest/1'
        RunId          = $RunId
        KitVersion     = $script:FMPKitVersion
        ReadOnly       = $true
        Tier           = $Tier
        ExecutedBy     = Get-FMPExecutor
        ComputerName   = [Environment]::MachineName
        StartTimeUtc   = $StartTime.ToUniversalTime().ToString('o')
        EndTimeUtc     = $end.ToString('o')
        Forest         = $Forest
        Domains        = @($Domains)
        ServedBy       = $ServedBy
        PowerShell     = [ordered]@{ Version = "$($PSVersionTable.PSVersion)"; Edition = "$($PSVersionTable.PSEdition)" }
        OSVersion      = [Environment]::OSVersion.VersionString
        ModuleVersions = Get-FMPModuleVersions
        Parameters     = $Parameters
        Steps          = @($Steps)
        FileCount      = $files.Count
        Files          = $files
    }
    Write-FMPJson -InputObject $manifest -Path (Join-Path $RunPath 'AssessmentManifest.json') -Depth 6
    [pscustomobject]$manifest
}

function Invoke-FMPStep {
    # Runs one collector; a failure is recorded, not fatal, so a partial run shows as partial.
    # The step scriptblock sees this function's variables, so they carry an FMPStep prefix
    # that no caller uses.
    param(
        [Parameter(Mandatory)][string]$FMPStepName,
        [Parameter(Mandatory)][scriptblock]$FMPStepBlock
    )
    $FMPStepStarted = Get-Date
    try {
        $null = & $FMPStepBlock
        [pscustomobject]@{ Step = $FMPStepName; Status = 'Completed'; Error = $null; Seconds = [math]::Round(((Get-Date) - $FMPStepStarted).TotalSeconds, 1) }
    } catch {
        Write-Warning "$FMPStepName failed: $($_.Exception.Message)"
        [pscustomobject]@{ Step = $FMPStepName; Status = 'Failed'; Error = $_.Exception.Message; Seconds = [math]::Round(((Get-Date) - $FMPStepStarted).TotalSeconds, 1) }
    }
}
