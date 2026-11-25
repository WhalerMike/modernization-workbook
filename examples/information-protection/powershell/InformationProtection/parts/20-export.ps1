# The baseline export (Book 20, Chapter 12): runners that connect and read, and the export itself.

$script:Workloads = @('EXO', 'ODB', 'SharePoint')   # Learn's Export-ContentExplorerData workload values, as Book 20, Chapter 01 uses them

function ConvertTo-IpFixtureName {
    <#
    .SYNOPSIS
        A file-name-safe form of a value (a role group or sensitive information type name), for fixtures.
    .EXAMPLE
        ConvertTo-IpFixtureName 'U.S. Social Security Number (SSN)'
    #>
    param([Parameter(Mandatory)][string]$Value)
    ($Value -replace '[^\w-]', '_')
}

function New-IpFixtureRunner {
    <#
    .SYNOPSIS
        A runner that reads a fixture tenant folder instead of connecting: <cmdlet>.json for a plain read,
        <cmdlet>/<identity>.json for a per-role-group read, Export-ContentExplorerData/<type>__<workload>.json
        for an inventory count, Get-ConnectionInformation.json for the session. Connects to nothing.
    .EXAMPLE
        $r = New-IpFixtureRunner -Path tests/fixtures/tenant
    #>
    param([Parameter(Mandatory)][string]$Path)
    $root = (Resolve-Path -LiteralPath $Path).Path
    $log = [Collections.Generic.List[string]]::new()
    [pscustomobject]@{
        Mode       = 'Fixture'
        Log        = $log
        Connect    = { param($Shell, $Settings) $log.Add("connect $Shell") }.GetNewClosure()
        Disconnect = { param($Shell) $log.Add("disconnect $Shell") }.GetNewClosure()
        Invoke     = {
            param([string]$Cmdlet, [hashtable]$Arguments)
            $log.Add("$Cmdlet")
            $f = if ($Cmdlet -eq 'Export-ContentExplorerData') { Join-Path $root "$Cmdlet/$(ConvertTo-IpFixtureName $Arguments.TagName)__$($Arguments.Workload).json" }
            elseif ($Arguments.Contains('Identity')) { Join-Path $root "$Cmdlet/$(ConvertTo-IpFixtureName "$($Arguments.Identity)").json" }
            else { Join-Path $root "$Cmdlet.json" }
            if (-not (Test-Path -LiteralPath $f)) { throw "The fixture tenant has no answer for $Cmdlet ($f)." }
            foreach ($x in (ConvertTo-IpList (Read-IpJson -Path $f))) { $x }
        }.GetNewClosure()
    }
}

function New-IpLiveRunner {
    <#
    .SYNOPSIS
        A runner that connects to the tenant, one shell at a time: Connect-IPPSSession, Connect-ExchangeOnline
        or Connect-AipService, delegated with the settings' adminUpn, or app-only with a certificate
        (settings.app) for Security & Compliance and Exchange Online. After each Exchange module connection it
        checks the session's tenant against settings.tenantId and stops on a mismatch.
    .EXAMPLE
        $r = New-IpLiveRunner -Settings $s
    #>
    param([Parameter(Mandatory)][hashtable]$Settings)
    [pscustomobject]@{
        Mode       = 'Live'
        Log        = [Collections.Generic.List[string]]::new()
        Connect    = {
            param($Shell, $Settings)
            $app = $Settings.Contains('app') -and -not (Test-IpPlaceholder "$($Settings.app.appId)")
            $p = if ($app) { @{ AppId = "$($Settings.app.appId)"; CertificateThumbprint = "$($Settings.app.certificateThumbprint)"; Organization = "$($Settings.app.organization)" } }
            else { @{ UserPrincipalName = "$($Settings.adminUpn)" } }
            switch ($Shell) {
                'scc' { Connect-IPPSSession @p }   # Microsoft 365 and GCC: no ConnectionUri needed (Learn)
                'exo' { Connect-ExchangeOnline @p -ShowBanner:$false }
                'aip' { if ($app) { throw 'The Rights Management read runs delegated; set reads.rightsManagement to false for an app-only run.' }; Connect-AipService }
            }
            if ($Shell -in 'scc', 'exo') {
                $eop = $Shell -eq 'scc'
                $ci = @(Get-ConnectionInformation | Where-Object { $_.State -eq 'Connected' -and [bool]$_.IsEopSession -eq $eop })
                if (-not $ci.Count) { throw "No connected $Shell session after connecting." }
                if ("$($ci[-1].TenantID)" -ne "$($Settings.tenantId)") { throw "Connected to tenant $($ci[-1].TenantID), not the settings' tenant $($Settings.tenantId). Nothing was read." }
            }
        }
        Disconnect = { param($Shell) if ($Shell -eq 'aip') { Disconnect-AipService } else { Disconnect-ExchangeOnline -Confirm:$false } }
        Invoke     = { param([string]$Cmdlet, [hashtable]$Arguments) & $Cmdlet @Arguments }
    }
}

function Export-IpBaseline {
    <#
    .SYNOPSIS
        Runs every read in config/calls.json, one shell at a time, and writes each result as JSON in a dated
        snapshot folder with a manifest. Reads only. Optional reads (Rights Management, the inventory counts)
        run when settings.reads turns them on; a skipped read is listed in the manifest.
    .EXAMPLE
        Export-IpBaseline -Settings $s -Runner (New-IpFixtureRunner -Path tests/fixtures/tenant) -OutputPath out/snapshot -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Runner, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $roleGroups = @()
    if ($Settings.inputs.Contains('roleRegister') -and -not (Test-IpPlaceholder "$($Settings.inputs.roleRegister)")) {
        $roleGroups = @(Read-IpCsv -Path $Settings.inputs.roleRegister | ForEach-Object roleGroup | Sort-Object -Unique)
    }
    $classes = @()
    if ($Settings.reads.inventory) { $classes = @(Read-IpCsv -Path (Get-IpInput -Settings $Settings -Name classRegister)) }
    $reads = [Collections.Generic.List[object]]::new()
    $read = @{}
    $calls = @(Get-IpCall)
    foreach ($shell in 'scc', 'exo', 'aip') {
        $mine = @($calls | Where-Object { $_.shell -eq $shell -and (-not $_.Contains('optional') -or $Settings.reads[$_.optional]) })
        foreach ($c in @($calls | Where-Object { $_.shell -eq $shell -and $_.Contains('optional') -and -not $Settings.reads[$_.optional] })) {
            $reads.Add([ordered]@{ id = $c.id; cmdlet = $c.cmdlet; shell = $shell; file = $c.file; status = "skipped (reads.$($c.optional) is off)"; count = 0 })
        }
        if (-not $mine.Count) { continue }
        & $Runner.Connect $shell $Settings
        try {
            foreach ($c in $mine) {
                $data = if ($c.Contains('perRoleGroup') -and $c.perRoleGroup) {
                    @(foreach ($g in $roleGroups) { [ordered]@{ Name = $g; Members = @(& $Runner.Invoke $c.cmdlet @{ Identity = $g }) } })
                } elseif ($c.Contains('perClass') -and $c.perClass) {
                    @(foreach ($cl in $classes) {
                            # Only types the tenant has: Invoke-IpInventory reports the others. The catalog is read first.
                            $known = @($read['sitCatalog'] | ForEach-Object { "$(Get-IpV $_ 'Name')" })
                            foreach ($t in @("$($cl.sits)" -split ';\s*' | Where-Object { $_ -and $_ -in $known })) {
                                foreach ($w in $script:Workloads) {
                                    $page = @(& $Runner.Invoke $c.cmdlet @{ TagType = 'SensitiveInformationType'; TagName = $t; ConfidenceLevel = 'high'; Workload = $w; PageSize = 100 })
                                    [ordered]@{ class = "$($cl.class)"; tagType = 'SensitiveInformationType'; tagName = $t; workload = $w; totalCount = [int](Get-IpV $page[0] 'TotalCount') }
                                }
                            }
                        })
                } else {
                    $a = @{}; foreach ($k in $c.args.Keys) { $a[$k] = $c.args[$k] }
                    $r = @(& $Runner.Invoke $c.cmdlet $a)
                    if ($c.Contains('select')) { $r = @($r | ForEach-Object { $o = [ordered]@{}; foreach ($n in $c.select) { $o[$n] = Get-IpV $_ $n }; $o }) }
                    $r
                }
                $read[$c.id] = @($data)
                Write-IpJson -Path (Join-Path $out $c.file) -Value @($data)
                $reads.Add([ordered]@{ id = $c.id; cmdlet = $c.cmdlet; shell = $shell; file = $c.file; status = 'read'; count = @($data).Count })
            }
        } finally { & $Runner.Disconnect $shell }
    }
    $null = Write-IpManifest -OutputPath $out -Task 'export' -AsOf $AsOf -Settings $Settings -Mode $Runner.Mode -Extra @{ tenantId = "$($Settings.tenantId)"; reads = $reads.ToArray() }
    [pscustomobject]@{ Task = 'export'; Result = 'Pass'; OutputPath = $out; Reads = $reads.ToArray() }
}
