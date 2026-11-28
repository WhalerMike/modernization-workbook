#Requires -Version 7.1
<#
    The estate inventory: one unattended, read-only run of four kits against one AD forest and its
    Entra ID tenant and Azure estate, written to one dated run folder with a manifest.

      start-kit            the forest (examples/start-kit, Windows PowerShell 5.1, a child process)
      non-person-identity  service accounts, gMSAs, apps, service principals, managed identities
      privileged-access    Entra roles, PIM eligibility, Azure role assignments
      validation-kit       the read-only checks of the track implementation guides

    Each kit runs its own entry script unchanged and writes its own manifest. This module only
    reads the settings, signs in once (app-only), runs the steps in order, keeps going when one
    fails, and writes EstateInventoryManifest.json, EnvironmentProfile.json (the environment's
    names and IDs, taken only from files the kits wrote), Summary.md and SHA256SUMS over
    everything. It changes nothing in Active Directory, Entra ID or Azure.
#>
Set-StrictMode -Version Latest

$script:KitRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:Steps = 'start-kit', 'non-person-identity', 'privileged-access', 'validation-kit'

function Get-EiRequirement {
    <#
    .SYNOPSIS
        The requirement rows (controls, KSIs) of each step, from config/requirements.json.
    .EXAMPLE
        (Get-EiRequirement)['privileged-access'].ksi
    #>
    param([string]$Path = (Join-Path $script:KitRoot 'config/requirements.json'))
    $doc = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    $rows = @{}
    foreach ($s in $doc.steps) { $rows[$s.step] = $s }
    $rows
}

function Get-EiFileHash {
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Resolve-EiPath {
    <# A settings path: absolute as given, relative to the settings file's folder otherwise. #>
    param([string]$Path, [Parameter(Mandatory)][string]$Base)
    if (-not $Path) { return $null }
    if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
    [System.IO.Path]::GetFullPath((Join-Path $Base $Path))
}

function Read-EiSettings {
    <#
    .SYNOPSIS
        Reads and checks the settings file. Refuses a secret anywhere in it, a placeholder in a live
        run, an unknown cloud, and a kit folder that isn't there.

    .EXAMPLE
        $settings = Read-EiSettings -Path config/settings.fixture.json -Fixture
    #>
    param([Parameter(Mandatory)][string]$Path, [switch]$Fixture)
    $full = (Resolve-Path -LiteralPath $Path).Path
    $raw = Get-Content -LiteralPath $full -Raw
    $s = $raw | ConvertFrom-Json -AsHashtable
    $base = Split-Path -Parent $full
    $problems = [System.Collections.Generic.List[string]]::new()

    # No secret, ever: the run signs in with a certificate or a managed identity.
    $secretKeys = [regex]'(?i)"[^"]*(secret|password|passwd|apikey|api_key|clientkey|privatekey)[^"]*"\s*:'
    foreach ($m in $secretKeys.Matches($raw)) { $problems.Add("A secret-like setting isn't allowed: $($m.Value.TrimEnd(':').Trim()). Sign in with a certificate or a managed identity.") }
    if (-not $Fixture -and $raw -match '<[a-z][a-z0-9-]*>') {
        $problems.Add("The settings still hold placeholders such as $($Matches[0]); fill them in for a live run.")
    }
    if ($s['cloud'] -notin 'gcc', 'global') { $problems.Add("cloud must be gcc or global, not '$($s['cloud'])'.") }
    if ($s.ContainsKey('environmentLabel') -and $s['environmentLabel'] -notin 'test', 'production') {
        $problems.Add("environmentLabel must be test or production, not '$($s['environmentLabel'])'.")
    }
    if (-not $Fixture) {
        if ($s['tenantId'] -notmatch '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$') { $problems.Add('tenantId must be the tenant''s GUID.') }
        $auth = $s['auth']
        if (-not $auth -or $auth['method'] -notin 'certificate', 'managedIdentity') { $problems.Add('auth.method must be certificate or managedIdentity.') }
        elseif ($auth['method'] -eq 'certificate' -and (-not $auth['clientId'] -or -not ($auth['certificatePath'] -or $auth['certificateThumbprint']))) { $problems.Add('auth.certificate needs clientId, and certificatePath (a .pfx in the credential folder) or certificateThumbprint.') }
    }
    if (-not $s['outputRoot']) { $problems.Add('outputRoot is required.') }

    # Each kit's folder: from the settings, or beside this kit (the repository's examples folder and
    # the estate-inventory-code zip both lay the kits out side by side).
    $kits = @{}
    $parent = Split-Path -Parent $script:KitRoot
    foreach ($name in $script:Steps) {
        $given = if ($s['kits']) { $s['kits'][$name] } else { $null }
        $kits[$name] = if ($given) { Resolve-EiPath -Path $given -Base $base } else { Join-Path $parent $name }
    }
    foreach ($name in $script:Steps) {
        $step = $s[$name]
        if ($step -and $step['enabled'] -eq $false) { continue }
        if (-not (Test-Path -LiteralPath $kits[$name] -PathType Container)) { $problems.Add("The $name kit isn't at $($kits[$name]).") }
    }
    if ($problems.Count) { throw ("Settings refused ($full):`n - " + ($problems -join "`n - ")) }

    $s['_path'] = $full
    $s['_base'] = $base
    $s['_kits'] = $kits
    $s['outputRoot'] = Resolve-EiPath -Path $s['outputRoot'] -Base $base
    $s
}

function Test-EiStepEnabled {
    <#
    .SYNOPSIS
        Whether the settings leave a step on: a step is on unless its section says enabled: false.
    .EXAMPLE
        Test-EiStepEnabled -Settings $settings -Step 'validation-kit'
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$Step)
    $c = $Settings[$Step]
    -not ($c -and $c['enabled'] -eq $false)
}

function New-EiRunFolder {
    <#
    .SYNOPSIS
        <outputRoot>\<UTC yyyy-MM-ddTHHmmssZ>; a second run in the same second waits for the next.
    .EXAMPLE
        $run = New-EiRunFolder -OutputRoot C:\FMWLabs\results\estate-inventory
    #>
    param([Parameter(Mandatory)][string]$OutputRoot, [datetime]$Now = [datetime]::UtcNow)
    $null = New-Item -ItemType Directory -Force -Path $OutputRoot
    do {
        $id = $Now.ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ')
        $path = Join-Path $OutputRoot $id
        $Now = $Now.AddSeconds(1)
    } while (Test-Path -LiteralPath $path)
    $null = New-Item -ItemType Directory -Path $path
    $null = New-Item -ItemType Directory -Path (Join-Path $path 'logs')
    [pscustomobject]@{ Id = $id; Path = $path }
}

function Get-EiCertificate {
    <#
    .SYNOPSIS
        The sign-in certificate by thumbprint, from the run account's store, then the machine's.
    .EXAMPLE
        Get-EiCertificate -Thumbprint <thumbprint>
    #>
    param([Parameter(Mandatory)][string]$Thumbprint)
    foreach ($store in 'Cert:\CurrentUser\My', 'Cert:\LocalMachine\My') {
        $c = Get-Item -LiteralPath (Join-Path $store $Thumbprint) -ErrorAction SilentlyContinue
        if ($c) {
            if (-not $c.HasPrivateKey) { throw "The certificate $Thumbprint in $store has no private key this account can use." }
            return $c
        }
    }
    throw "No certificate with thumbprint $Thumbprint in CurrentUser\My or LocalMachine\My."
}

function Connect-EiCloud {
    <#
    .SYNOPSIS
        Signs in to Microsoft Graph and Azure once, app-only, and checks both sessions are in the
        settings' tenant. Microsoft 365 GCC (Moderate) uses the global Graph endpoint and commercial
        Azure, so both clouds sign in to Global and AzureCloud.

    .EXAMPLE
        Connect-EiCloud -Settings (Read-EiSettings -Path D:\EstateInventory\settings.json) -NeedAzure
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [switch]$NeedAzure)
    $auth = $Settings['auth']
    $tenant = $Settings['tenantId']
    if ($auth['method'] -eq 'managedIdentity') {
        $graphArgs = @{ Identity = $true; Environment = 'Global'; NoWelcome = $true }
        if ($auth['clientId']) { $graphArgs.ClientId = $auth['clientId'] }
        Connect-MgGraph @graphArgs | Out-Null
        if ($NeedAzure) {
            $azArgs = @{ Identity = $true; Environment = 'AzureCloud'; Tenant = $tenant }
            if ($auth['clientId']) { $azArgs.AccountId = $auth['clientId'] }
            Connect-AzAccount @azArgs | Out-Null
        }
    } elseif ($auth['certificatePath']) {
        # A PKCS#12 (.pfx) file in a credential folder only the run account and the server's
        # administrators can open, as WD-179's run keeps its readers' files. Learn documents
        # Connect-AzAccount -CertificatePath (pkcs#12) and Connect-MgGraph -Certificate (an X509Certificate2).
        $pfx = Resolve-EiPath -Path $auth['certificatePath'] -Base $Settings['_base']
        if (-not (Test-Path -LiteralPath $pfx -PathType Leaf)) { throw "No certificate file at $pfx." }
        $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($pfx, [string]$null,
            [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
        if (-not $cert.HasPrivateKey) { throw "The certificate file $pfx holds no private key." }
        Connect-MgGraph -Environment Global -TenantId $tenant -ClientId $auth['clientId'] -Certificate $cert -NoWelcome | Out-Null
        if ($NeedAzure) {
            Connect-AzAccount -ServicePrincipal -Environment AzureCloud -Tenant $tenant -ApplicationId $auth['clientId'] -CertificatePath $pfx | Out-Null
        }
    } else {
        $cert = Get-EiCertificate -Thumbprint $auth['certificateThumbprint']
        Connect-MgGraph -Environment Global -TenantId $tenant -ClientId $auth['clientId'] -Certificate $cert -NoWelcome | Out-Null
        if ($NeedAzure) {
            Connect-AzAccount -ServicePrincipal -Environment AzureCloud -Tenant $tenant -ApplicationId $auth['clientId'] -CertificateThumbprint $cert.Thumbprint | Out-Null
        }
    }
    $mg = Get-MgContext
    if (-not $mg -or $mg.TenantId -ne $tenant) { throw "The Graph session is in tenant '$($mg.TenantId)', not $tenant." }
    if ($NeedAzure) {
        $az = Get-AzContext
        if (-not $az -or $az.Tenant.Id -ne $tenant) { throw "The Azure session is in tenant '$($az.Tenant.Id)', not $tenant." }
    }
    [pscustomobject]@{ GraphApp = $mg.ClientId; AuthType = "$($mg.AuthType)"; Azure = [bool]$NeedAzure }
}

function Invoke-EiStep {
    <#
    .SYNOPSIS
        Runs one step, logs everything it prints to logs\<step>.log, and turns an exception into an
        Error row instead of stopping the run.

    .EXAMPLE
        Invoke-EiStep -Name 'start-kit' -RunPath $run.Path -Action { Invoke-EiStartKit -Settings $settings -RunPath $run.Path -Fixture }
    #>
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][scriptblock]$Action
    )
    $log = Join-Path (Join-Path $RunPath 'logs') "$Name.log"
    $started = [datetime]::UtcNow
    $status = 'Pass'
    $detail = $null
    $result = $null
    try {
        $out = & $Action *>&1
        $lines = foreach ($o in $out) {
            if ($o -is [System.Management.Automation.ErrorRecord]) { "ERROR: $o" }
            elseif ($o -is [hashtable] -and $o.ContainsKey('_eiResult')) { $result = $o; continue }
            else { "$o" }
        }
        Set-Content -LiteralPath $log -Value $lines -Encoding utf8
        if ($result -and $result['status']) { $status = $result['status'] }
        if ($result -and $result['detail']) { $detail = $result['detail'] }
    } catch {
        $status = 'Error'
        $detail = "$($_.Exception.Message)"
        Add-Content -LiteralPath $log -Value "ERROR: $detail" -Encoding utf8
    }
    [pscustomobject][ordered]@{
        Step       = $Name
        Status     = $status
        Detail     = $detail
        StartedUtc = $started.ToString('o')
        Seconds    = [math]::Round(([datetime]::UtcNow - $started).TotalSeconds, 1)
        Output     = if ($result) { $result['output'] } else { $null }
        KitManifest = if ($result) { $result['manifest'] } else { $null }
        Session    = if ($result -and $result.ContainsKey('session')) { $result['session'] } else { $null }
        Log        = "logs/$Name.log"
    }
}

function Find-EiStartKitRun {
    <#
    .SYNOPSIS
        The run folder the Start Kit wrote under its output folder (the newest with a manifest).
    .EXAMPLE
        Find-EiStartKitRun -Path (Join-Path $run.Path 'start-kit')
    #>
    param([Parameter(Mandatory)][string]$Path)
    Get-ChildItem -LiteralPath $Path -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'AssessmentManifest.json') } |
        Sort-Object Name -Descending | Select-Object -First 1
}

function Invoke-EiStartKit {
    <#
    .SYNOPSIS
        The forest: the Start Kit in Windows PowerShell 5.1 (the edition it declares), as the run
        account, in a child process. A fixture run copies the kit's recorded run instead: the Start
        Kit reads a live forest only.

    .EXAMPLE
        Invoke-EiStartKit -Settings $settings -RunPath $run.Path -Fixture
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$RunPath, [switch]$Fixture,
        [string]$WindowsPowerShell)
    $kit = $Settings['_kits']['start-kit']
    $out = Join-Path $RunPath 'start-kit'
    $null = New-Item -ItemType Directory -Force -Path $out
    $c = if ($Settings['start-kit']) { $Settings['start-kit'] } else { @{} }
    if ($Fixture) {
        $recorded = Join-Path $kit 'tests/fixtures/result-assessment/run-nov'
        Copy-Item -LiteralPath $recorded -Destination (Join-Path $out 'recorded-run-nov') -Recurse
        "Fixture run: copied the Start Kit's recorded run ($recorded); the Start Kit reads only a live forest."
        $run = Find-EiStartKitRun -Path $out
        return @{ _eiResult = $true; status = 'Recorded'; output = "start-kit/$($run.Name)"; manifest = "start-kit/$($run.Name)/AssessmentManifest.json"; runPath = $run.FullName }
    }
    if (-not $WindowsPowerShell) {
        if (-not $IsWindows) { throw 'The Start Kit needs Windows PowerShell 5.1 on Windows; run the estate inventory on a Windows Server member server.' }
        $WindowsPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    }
    $script = Join-Path $kit 'Invoke-FMPStartKit.ps1'
    # One command line for Windows PowerShell, every value single-quoted, so a list of domains
    # arrives as a list (-File would pass 'a,b' as one string).
    $q = { param($v) "'" + ("$v" -replace "'", "''") + "'" }
    $tier = if ($c['tier']) { $c['tier'] } else { 'A' }
    $cmd = "& $(& $q $script) -OutputPath $(& $q $out) -Tier $(& $q $tier) -Quiet"
    if ($c['forest']) { $cmd += " -Forest $(& $q $c['forest'])" }
    if ($c['domain']) { $cmd += ' -Domain ' + ((@($c['domain']) | ForEach-Object { & $q $_ }) -join ',') }
    if ($c['skipSql']) { $cmd += ' -SkipSql' }
    if ($c['skipNps']) { $cmd += ' -SkipNps' }
    if ($c['serverListPath']) { $cmd += " -ServerListPath $(& $q (Resolve-EiPath -Path $c['serverListPath'] -Base $Settings['_base']))" }
    "Windows PowerShell: $cmd"
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
    $argList = @('-NoProfile', '-NonInteractive', '-EncodedCommand', $encoded)
    $p = Start-Process -FilePath $WindowsPowerShell -ArgumentList $argList -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput (Join-Path $RunPath 'logs/start-kit.stdout.txt') -RedirectStandardError (Join-Path $RunPath 'logs/start-kit.stderr.txt')
    "Exit code: $($p.ExitCode)"
    $run = Find-EiStartKitRun -Path $out
    if ($p.ExitCode -ne 0 -or -not $run) {
        return @{ _eiResult = $true; status = 'Error'; detail = "The Start Kit exited $($p.ExitCode)$(if (-not $run) { ' and wrote no AssessmentManifest.json' }); see logs/start-kit.stderr.txt" }
    }
    @{ _eiResult = $true; status = 'Pass'; output = "start-kit/$($run.Name)"; manifest = "start-kit/$($run.Name)/AssessmentManifest.json"; runPath = $run.FullName }
}

function Test-EiNeedsAzure {
    <#
    .SYNOPSIS
        Whether a cloud step reads Azure as well as Microsoft Graph.
    .EXAMPLE
        Test-EiNeedsAzure -Settings $settings -Step 'privileged-access'
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$Step)
    $c = if ($Settings[$Step]) { $Settings[$Step] } else { @{} }
    switch ($Step) {
        'non-person-identity' { -not $c['skipAzure'] }
        'privileged-access' { @($c['azureScope'] | Where-Object { $_ }).Count -gt 0 }
        default { $false }
    }
}

function Get-EiKitPlan {
    <#
    .SYNOPSIS
        What a cloud step runs: each kit script with its parameters, unchanged, and where it writes.

        non-person-identity  Invoke-NpiInventory.ps1 once per domain in the settings. The first
        domain's run reads Entra ID and Azure as well; the others add -SkipAzure.
        The Start Kit's server-to-service inventory, when it wrote one, fills the
        hosts and services of AD accounts.
        privileged-access    Invoke-PaInventory.ps1, Entra roles and PIM, and Azure at the scopes.
        validation-kit       Invoke-ValidationKit.ps1 on the session this step signed in with
        (-SkipConnect).

    .EXAMPLE
        (Get-EiKitPlan -Settings $settings -Step 'privileged-access' -RunPath $run.Path -Fixture).Calls
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$Step,
        [Parameter(Mandatory)][string]$RunPath, [switch]$Fixture, [string]$StartKitRun)
    $kit = $Settings['_kits'][$Step]
    $c = if ($Settings[$Step]) { $Settings[$Step] } else { @{} }
    $calls = [System.Collections.Generic.List[object]]::new()
    $outputs = [System.Collections.Generic.List[string]]::new()
    $manifests = [System.Collections.Generic.List[string]]::new()
    switch ($Step) {
        'non-person-identity' {
            $script = Join-Path $kit 'Invoke-NpiInventory.ps1'
            $common = @{ Cloud = $Settings['cloud']; Quiet = $true }
            if ($c['configPath']) { $common.ConfigPath = Resolve-EiPath -Path $c['configPath'] -Base $Settings['_base'] }
            $service = if ($StartKitRun) { Join-Path $StartKitRun 'ServerServices/ServerServices.csv' } else { $null }
            if ($service -and (Test-Path -LiteralPath $service)) { $common.ServiceInventoryPath = $service }
            if ($Fixture) {
                $calls.Add(@{ Script = $script; Arguments = $common + @{ FixturePath = (Join-Path $kit 'tests/fixtures/estate.json'); OutputPath = (Join-Path $RunPath 'non-person-identity/fixture') } })
                $outputs.Add('non-person-identity/fixture')
            } else {
                $domains = @($c['domains'] | Where-Object { $_ })
                if ($domains.Count -eq 0) { $domains = @($null) }
                $first = $true
                foreach ($d in $domains) {
                    $leaf = if ($d) { $d } else { 'no-ad' }
                    $a = $common + @{ TenantId = $Settings['tenantId']; OutputPath = (Join-Path $RunPath "non-person-identity/$leaf") }
                    if ($d) { $a.Domain = $d } else { $a.SkipAd = $true }
                    if (-not $first -or $c['skipAzure']) { $a.SkipAzure = $true }
                    $calls.Add(@{ Script = $script; Arguments = $a })
                    $outputs.Add("non-person-identity/$leaf")
                    $first = $false
                }
            }
            foreach ($o in $outputs) { $manifests.Add("$o/manifest.json") }
        }
        'privileged-access' {
            $script = Join-Path $kit 'Invoke-PaInventory.ps1'
            $out = Join-Path $RunPath 'privileged-access'
            if ($Fixture) {
                $a = @{ Cloud = $Settings['cloud']; FixturePath = (Join-Path $kit 'tests/fixtures/tenant.json'); OutputPath = $out
                    AzureScope = @('/subscriptions/11111111-1111-4111-8111-111111111111'); ExceptionsPath = (Join-Path $kit 'tests/fixtures/inputs/exceptions.csv') }
            } else {
                $a = @{ Cloud = $Settings['cloud']; TenantId = $Settings['tenantId']; OutputPath = $out; AzureScope = @($c['azureScope'] | Where-Object { $_ }) }
                if ($c['exceptionsPath']) { $a.ExceptionsPath = Resolve-EiPath -Path $c['exceptionsPath'] -Base $Settings['_base'] }
                if ($c['tierMapPath']) { $a.TierMapPath = Resolve-EiPath -Path $c['tierMapPath'] -Base $Settings['_base'] }
                if ($c['controlPlaneSubscriptionId']) { $a.ControlPlaneSubscriptionId = @($c['controlPlaneSubscriptionId']) }
            }
            $calls.Add(@{ Script = $script; Arguments = $a })
            $outputs.Add('privileged-access')
            $manifests.Add('privileged-access/manifest.json')
        }
        'validation-kit' {
            $script = Join-Path $kit 'Invoke-ValidationKit.ps1'
            $a = @{ OutputPath = (Join-Path $RunPath 'validation-kit'); Cloud = $Settings['cloud'] }
            if ($c['tracks']) { $a.Track = @($c['tracks']) }
            if ($Fixture) {
                $a.FixturePath = Join-Path $kit 'tests/fixtures/pass'
                $a.AsOf = '2026-10-29'
            } else {
                $a.TenantId = $Settings['tenantId']
                $a.SkipConnect = $true
                if ($c['skipAD'] -ne $false) { $a.SkipAD = $true }
                if ($c['inputPath']) { $a.InputPath = Resolve-EiPath -Path $c['inputPath'] -Base $Settings['_base'] }
            }
            $calls.Add(@{ Script = $script; Arguments = $a })
        }
        default { throw "Not a cloud step: $Step" }
    }
    [pscustomobject]@{ Step = $Step; Calls = @($calls); Outputs = @($outputs); Manifests = @($manifests) }
}

function Complete-EiKitStep {
    <#
    .SYNOPSIS
        The step's result from what its kit wrote and returned: the validation kit is Partial when a check ended in Error.
    .EXAMPLE
        Complete-EiKitStep -Plan $plan -RunPath $run.Path -Returned $returned
    #>
    param([Parameter(Mandatory)][pscustomobject]$Plan, [Parameter(Mandatory)][string]$RunPath, [object[]]$Returned = @())
    $outputs = @($Plan.Outputs)
    $manifests = @($Plan.Manifests)
    $status = 'Pass'
    $detail = $null
    if ($Plan.Step -eq 'validation-kit') {
        $run = Get-ChildItem -LiteralPath (Join-Path $RunPath 'validation-kit') -Directory | Sort-Object Name -Descending | Select-Object -First 1
        $outputs = @("validation-kit/$($run.Name)")
        $manifests = @("validation-kit/$($run.Name)/ValidationManifest.json")
        $errors = @($Returned | Where-Object { $_ -and $_.PSObject.Properties['CheckId'] -and $_.Status -eq 'Error' })
        if ($errors.Count) { $status = 'Partial'; $detail = "$($errors.Count) check(s) ended in Error: $(@($errors.CheckId) -join ', ')" }
    }
    foreach ($m in $manifests) {
        if (-not (Test-Path -LiteralPath (Join-Path $RunPath $m))) { $status = 'Error'; $detail = "The kit wrote no $m" }
    }
    @{ _eiResult = $true; status = $status; detail = $detail; output = ($outputs -join '; '); manifest = ($manifests -join '; ') }
}

function Invoke-EiKitProcess {
    <#
    .SYNOPSIS
        Runs one cloud step in its own PowerShell 7 process (Invoke-EiKitStep.ps1): it signs in,
        runs the kit's script unchanged and writes logs\<step>.result.json. A process per kit keeps
        each kit's modules and session apart from the others'.

    .EXAMPLE
        Invoke-EiKitProcess -Settings $settings -Step 'validation-kit' -RunPath $run.Path -Fixture
    #>
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$Step,
        [Parameter(Mandatory)][string]$RunPath, [switch]$Fixture, [string]$StartKitRun,
        [string]$Pwsh = (Get-Process -Id $PID).Path)
    $runner = Join-Path $PSScriptRoot '../Invoke-EiKitStep.ps1'
    $resultPath = Join-Path $RunPath "logs/$Step.result.json"
    $argList = @('-NoProfile', '-NonInteractive', '-File', $runner, '-SettingsPath', $Settings['_path'], '-Step', $Step, '-RunPath', $RunPath, '-ResultPath', $resultPath)
    if ($Fixture) { $argList += '-Fixture' }
    if ($StartKitRun) { $argList += @('-StartKitRun', $StartKitRun) }
    $p = Start-Process -FilePath $Pwsh -ArgumentList $argList -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput (Join-Path $RunPath "logs/$Step.stdout.txt") -RedirectStandardError (Join-Path $RunPath "logs/$Step.stderr.txt")
    "PowerShell 7 process for $Step exited $($p.ExitCode)"
    if (-not (Test-Path -LiteralPath $resultPath)) {
        return @{ _eiResult = $true; status = 'Error'; detail = "The $Step process exited $($p.ExitCode) without a result; see logs/$Step.stderr.txt" }
    }
    $r = Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json -AsHashtable
    $r['_eiResult'] = $true
    $r
}


function Write-EiManifest {
    <#
    .SYNOPSIS
        EstateInventoryManifest.json (the settings' hash, the host, the account, the tenant and
        forest, each step's status and requirement rows, each kit's manifest and its SHA-256),
        EnvironmentProfile.json (Write-EiEnvironmentProfile), Summary.md, and SHA256SUMS over
        every file in the run folder.

    .EXAMPLE
        Write-EiManifest -Settings $settings -Run $run -Results $results -Mode Fixture
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][pscustomobject]$Run,
        [Parameter(Mandatory)][object[]]$Results,
        [Parameter(Mandatory)][string]$Mode,
        [object]$Session
    )
    $req = Get-EiRequirement
    $steps = foreach ($r in $Results) {
        $row = $req[$r.Step]
        $kitManifests = @("$($r.KitManifest)" -split '; ' | Where-Object { $_ } | ForEach-Object {
                $p = Join-Path $Run.Path $_
                [ordered]@{ path = $_; sha256 = $(if (Test-Path -LiteralPath $p) { Get-EiFileHash -Path $p }) }
            })
        [ordered]@{
            step = $r.Step; status = $r.Status; detail = $r.Detail; startedUtc = $r.StartedUtc; seconds = $r.Seconds
            output = $r.Output; kitManifests = $kitManifests; log = $r.Log
            controls = @($row.controls); ksi = @($row.ksi)
        }
    }
    $kitHashes = [ordered]@{}
    foreach ($name in $script:Steps) {
        $dir = $Settings['_kits'][$name]
        if (-not (Test-Path -LiteralPath $dir)) { continue }
        $entry = Get-ChildItem -LiteralPath $dir -File -Filter 'Invoke-*.ps1' | Sort-Object Name | Select-Object -First 1
        $kitHashes[$name] = [ordered]@{ path = $dir; entryScript = $(if ($entry) { $entry.Name }); entrySha256 = $(if ($entry) { Get-EiFileHash -Path $entry.FullName }) }
    }
    $manifest = [ordered]@{
        schema          = 'fmw-estate-inventory/1'
        runId           = $Run.Id
        mode            = $Mode
        cloud           = $Settings['cloud']
        tenantId        = $(if ($Mode -eq 'Live') { $Settings['tenantId'] } else { 'fixture' })
        host            = [Environment]::MachineName
        account         = [Environment]::UserName
        powershell      = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"
        settingsPath    = $Settings['_path']
        settingsSha256  = Get-EiFileHash -Path $Settings['_path']
        orchestrator    = [ordered]@{ script = 'Invoke-EstateInventory.ps1'; sha256 = Get-EiFileHash -Path (Join-Path $script:KitRoot 'Invoke-EstateInventory.ps1'); moduleSha256 = Get-EiFileHash -Path (Join-Path $PSScriptRoot 'EstateInventory.psm1') }
        session         = $Session
        kits            = $kitHashes
        steps           = @($steps)
        manifest        = [ordered]@{ controls = @($req['manifest'].controls); ksi = @($req['manifest'].ksi) }
        environmentProfile = [ordered]@{ path = 'EnvironmentProfile.json'; schema = 'fmw-environment-profile/1'; controls = @($req['environment-profile'].controls); ksi = @($req['environment-profile'].ksi) }
        finishedUtc     = [datetime]::UtcNow.ToString('o')
    }
    $manifestPath = Join-Path $Run.Path 'EstateInventoryManifest.json'
    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8

    # The environment profile hashes the manifest, so it comes after it and before SHA256SUMS.
    # A profile that can't be written is logged and left out; the manifest and SHA256SUMS still are.
    try {
        $envProfile = Write-EiEnvironmentProfile -Run $Run -Results $Results -Mode $Mode -Settings $Settings -ManifestSha256 (Get-EiFileHash -Path $manifestPath)
        $counts = Get-EiProfileCount -EnvironmentProfile $envProfile
        $profileLine = "Environment profile: EnvironmentProfile.json, labelled $($envProfile.provenance.label): $($counts.Filled) fields filled, $($counts.Conflict) in conflict, $($counts.NotCollected) not collected."
    } catch {
        Remove-Item -LiteralPath (Join-Path $Run.Path 'EnvironmentProfile.json') -ErrorAction SilentlyContinue
        Set-Content -LiteralPath (Join-Path $Run.Path 'logs/environment-profile.log') -Value "ERROR: $($_.Exception.Message)" -Encoding utf8
        $profileLine = "Environment profile: not written ($($_.Exception.Message)); see logs/environment-profile.log."
    }

    $md = [System.Collections.Generic.List[string]]::new()
    $md.Add("# Estate inventory $($Run.Id)")
    $md.Add('')
    $md.Add("Mode: $Mode. Cloud: $($Settings['cloud']). Tenant: $($manifest.tenantId). Host: $($manifest.host). Account: $($manifest.account).")
    $md.Add('')
    $md.Add('| Step | Status | Seconds | Output | Controls | KSIs | Detail |')
    $md.Add('|---|---|---|---|---|---|---|')
    foreach ($s in $steps) { $md.Add("| $($s.step) | $($s.status) | $($s.seconds) | $($s.output) | $(@($s.controls) -join ', ') | $(@($s.ksi) -join ', ') | $($s.detail) |") }
    $md.Add('')
    $md.Add("$profileLine Controls: $(@($req['environment-profile'].controls) -join ', '). KSIs: $(@($req['environment-profile'].ksi) -join ', ').")
    $md.Add('')
    $md.Add('Read-only: nothing was written to Active Directory, Entra ID or Azure. Each kit''s own manifest lists every read it made; SHA256SUMS covers every file in this folder.')
    Set-Content -LiteralPath (Join-Path $Run.Path 'Summary.md') -Value $md -Encoding utf8

    $sums = Get-ChildItem -LiteralPath $Run.Path -Recurse -File | Where-Object Name -NE 'SHA256SUMS' | Sort-Object FullName | ForEach-Object {
        '{0}  {1}' -f (Get-EiFileHash -Path $_.FullName), $_.FullName.Substring($Run.Path.Length + 1).Replace('\', '/')
    }
    Set-Content -LiteralPath (Join-Path $Run.Path 'SHA256SUMS') -Value $sums -Encoding utf8
    $manifest
}

function Get-EiProfileSource {
    <#
    .SYNOPSIS
        The files the environment profile reads, from the steps that finished: the Start Kit's
        ForestTopology.json and TrustMap.json files, and each cloud kit's own manifest (and the
        privileged access inventory's scopes). Paths are relative to the run folder, with '/'.
    .EXAMPLE
        Get-EiProfileSource -RunPath $run.Path -Results $results
    #>
    param([Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][object[]]$Results)
    $sources = [System.Collections.Generic.List[object]]::new()
    foreach ($r in $Results) {
        if ($r.Status -notin 'Pass', 'Recorded', 'Partial') { continue }
        foreach ($rel in @("$($r.KitManifest)" -split '; ' | Where-Object { $_ })) {
            if (Test-Path -LiteralPath (Join-Path $RunPath $rel)) { $sources.Add([pscustomobject]@{ Step = $r.Step; Kind = 'manifest'; Path = $rel }) }
        }
        if ($r.Step -eq 'start-kit' -and $r.Output) {
            $skRun = Join-Path $RunPath $r.Output
            foreach ($d in Get-ChildItem -LiteralPath $skRun -Directory | Sort-Object Name) {
                foreach ($pair in @(@('topology', 'Forest/ForestTopology.json'), @('trusts', 'Trusts/TrustMap.json'))) {
                    if (Test-Path -LiteralPath (Join-Path $d.FullName $pair[1])) {
                        $sources.Add([pscustomobject]@{ Step = 'start-kit'; Kind = $pair[0]; Path = "$($r.Output)/$($d.Name)/$($pair[1])" })
                    }
                }
            }
        }
        if ($r.Step -eq 'privileged-access' -and (Test-Path -LiteralPath (Join-Path $RunPath 'privileged-access/inventory.csv'))) {
            $sources.Add([pscustomobject]@{ Step = 'privileged-access'; Kind = 'scopes'; Path = 'privileged-access/inventory.csv' })
        }
    }
    @($sources)
}

function Get-EiProfileCount {
    <# How many of a profile's fields are filled, in conflict and not collected. #>
    param([Parameter(Mandatory)]$EnvironmentProfile)
    $fields = if ($EnvironmentProfile -is [System.Collections.IDictionary]) { @($EnvironmentProfile['fields'].Values) } else { @($EnvironmentProfile.fields.PSObject.Properties.Value) }
    [pscustomobject]@{
        Filled       = @($fields | Where-Object { $_.status -eq 'ok' }).Count
        Conflict     = @($fields | Where-Object { $_.status -eq 'conflict' }).Count
        NotCollected = @($fields | Where-Object { $_.status -eq 'notCollected' }).Count
    }
}

function Write-EiEnvironmentProfile {
    <#
    .SYNOPSIS
        EnvironmentProfile.json: the names and IDs the labs ask for (forest and domains, functional
        levels, domain controllers and sites, trusts, the tenant, the cloud, the subscriptions and
        management groups the kits read), taken only from files the kits wrote in this run, with
        the file each value came from. No secret, no user, group or account list. Reads files in
        the run folder only: it makes no call to Active Directory, Entra ID or Azure.

        A field the sources agree on is "ok". Two sources that disagree make it "conflict", with
        no value, so a lab can't fill a placeholder from it. A field no kit read is "notCollected".
        The profile records the run, the SHA-256 of EstateInventoryManifest.json and the time,
        which the loader (powershell/FmpEnvironment) checks before it hands a value to a lab.

    .EXAMPLE
        Write-EiEnvironmentProfile -Run $run -Results $results -Mode Fixture -Settings $settings -ManifestSha256 $hash
    #>
    param(
        [Parameter(Mandatory)][pscustomobject]$Run,
        [Parameter(Mandatory)][object[]]$Results,
        [Parameter(Mandatory)][string]$Mode,
        [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][string]$ManifestSha256
    )
    $req = Get-EiRequirement
    $sources = Get-EiProfileSource -RunPath $Run.Path -Results $Results
    $readJson = { param($rel) Get-Content -LiteralPath (Join-Path $Run.Path $rel) -Raw | ConvertFrom-Json -AsHashtable -NoEnumerate }
    $fields = [ordered]@{}
    # One value per field: every source's value is kept; sources that disagree make a conflict.
    $single = {
        param([string]$Name, [object[]]$Seen, [string]$Missing)
        $seen = @($Seen | Where-Object { $null -ne $_.value -and "$($_.value)" -ne '' })
        $distinct = @($seen | ForEach-Object { "$($_.value)" } | Sort-Object -Unique)
        $fields[$Name] = if ($distinct.Count -eq 0) { [ordered]@{ status = 'notCollected'; value = $null; sources = @(); reason = $Missing } }
        elseif ($distinct.Count -eq 1) { [ordered]@{ status = 'ok'; value = $seen[0].value; sources = @($seen) } }
        else { [ordered]@{ status = 'conflict'; value = $null; sources = @($seen); reason = "The sources disagree: $($distinct -join ', ')." } }
    }
    # A list: the union of every source's values.
    $list = {
        param([string]$Name, [object[]]$Seen, [string]$Missing)
        $seen = @($Seen | Where-Object { @($_.value | Where-Object { $null -ne $_ }).Count -gt 0 })
        $values = @($seen | ForEach-Object { @($_.value) } | Where-Object { $null -ne $_ } |
                ForEach-Object { if ($_ -is [System.Collections.IDictionary]) { [pscustomobject]$_ } else { $_ } } |
                Sort-Object -Property { if ($_ -is [string]) { $_ } else { $_ | ConvertTo-Json -Compress -Depth 4 } } -Unique)
        $fields[$Name] = if ($values.Count -eq 0) { [ordered]@{ status = 'notCollected'; value = $null; sources = @(); reason = $Missing } }
        else { [ordered]@{ status = 'ok'; value = @($values); sources = @($seen | ForEach-Object { [ordered]@{ step = $_.step; file = $_.file; key = $_.key } }) } }
    }
    $src = { param($s, [string]$Key, $Value) [ordered]@{ step = $s.Step; file = $s.Path; key = $Key; value = $Value } }

    # The forest: the Start Kit's ForestTopology.json (written under the forest root domain's folder).
    $noForest = 'The Start Kit wrote no Forest/ForestTopology.json in this run (the step was off, failed, or its run had no topology).'
    $topo = @($sources | Where-Object Kind -EQ 'topology' | ForEach-Object { [pscustomobject]@{ Source = $_; Doc = & $readJson $_.Path } })
    $forestSeen = @{ name = @(); root = @(); mode = @(); domains = @(); upn = @(); sites = @(); dcs = @(); details = @()
        netbios = @(); dn = @(); dmode = @(); pdc = @() }
    foreach ($t in $topo) {
        $f = $t.Doc['Forest']
        $s = $t.Source
        $forestSeen.name += & $src $s 'Forest.Name' $f['Name']
        $forestSeen.root += & $src $s 'Forest.RootDomain' $f['RootDomain']
        $forestSeen.mode += & $src $s 'Forest.ForestMode' $f['ForestMode']
        $forestSeen.domains += & $src $s 'Forest.Domains' @($f['Domains'] | Where-Object { $_ })
        $forestSeen.upn += & $src $s 'Forest.UPNSuffixes' @($f['UPNSuffixes'] | Where-Object { $_ })
        $forestSeen.sites += & $src $s 'Forest.Sites' @($f['Sites'] | Where-Object { $_ })
        $forestSeen.dcs += & $src $s 'DomainControllers' @(@($t.Doc['DomainControllers']) | Where-Object { $_ } | ForEach-Object {
                [ordered]@{ hostName = $_['HostName']; domain = $_['Domain']; site = $_['Site']; operatingSystem = $_['OperatingSystem']
                    isGlobalCatalog = [bool]$_['IsGlobalCatalog']; isReadOnly = [bool]$_['IsReadOnly'] } })
        $forestSeen.details += & $src $s 'Domains' @(@($t.Doc['Domains']) | Where-Object { $_ } | ForEach-Object {
                [ordered]@{ dnsRoot = $_['DNSRoot']; netBiosName = $_['NetBIOSName']; domainMode = $_['DomainMode']
                    distinguishedName = $_['DistinguishedName']; parentDomain = $_['ParentDomain']; pdcEmulator = $_['PDCEmulator'] } })
        $rootRow = @(@($t.Doc['Domains']) | Where-Object { $_ -and $_['DNSRoot'] -eq $f['RootDomain'] }) | Select-Object -First 1
        if ($rootRow) {
            $forestSeen.netbios += & $src $s "Domains[$($f['RootDomain'])].NetBIOSName" $rootRow['NetBIOSName']
            $forestSeen.dn += & $src $s "Domains[$($f['RootDomain'])].DistinguishedName" $rootRow['DistinguishedName']
            $forestSeen.dmode += & $src $s "Domains[$($f['RootDomain'])].DomainMode" $rootRow['DomainMode']
            $forestSeen.pdc += & $src $s "Domains[$($f['RootDomain'])].PDCEmulator" $rootRow['PDCEmulator']
        }
    }
    & $single 'ad.forestName' $forestSeen.name $noForest
    & $single 'ad.forestRootDomain' $forestSeen.root $noForest
    & $single 'ad.forestMode' $forestSeen.mode $noForest
    & $list 'ad.domains' $forestSeen.domains $noForest
    & $list 'ad.domainDetails' $forestSeen.details $noForest
    & $single 'ad.rootDomain.netBiosName' $forestSeen.netbios $noForest
    & $single 'ad.rootDomain.distinguishedName' $forestSeen.dn $noForest
    & $single 'ad.rootDomain.domainMode' $forestSeen.dmode $noForest
    & $single 'ad.rootDomain.pdcEmulator' $forestSeen.pdc $noForest
    & $list 'ad.domainControllers' $forestSeen.dcs $noForest
    & $list 'ad.sites' $forestSeen.sites $noForest
    & $list 'ad.upnSuffixes' $forestSeen.upn $noForest

    # Trusts: each domain's Trusts/TrustMap.json.
    $trustSeen = @(foreach ($s in @($sources | Where-Object Kind -EQ 'trusts')) {
            $doc = & $readJson $s.Path
            & $src $s 'Trusts' @(@($doc['Trusts']) | Where-Object { $_ } | ForEach-Object {
                    [ordered]@{ domain = $doc['Domain']; name = $_['Name']; direction = $_['Direction']; trustType = $_['TrustType']
                        intraForest = [bool]$_['IntraForest']; forestTransitive = [bool]$_['ForestTransitive'] } })
        })
    & $list 'ad.trusts' $trustSeen 'The Start Kit wrote no Trusts/TrustMap.json in this run.'

    # The tenant and the cloud: each cloud kit's own manifest.
    $cloudSeen = @(); $tenantSeen = @(); $subSeen = @(); $mgSeen = @()
    $subRx = [regex]'(?i)/subscriptions/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
    $mgRx = [regex]'(?i)/providers/Microsoft\.Management/managementGroups/([A-Za-z0-9._()-]+)'
    $ids = { param([regex]$Rx, [string[]]$Text) @($Text | ForEach-Object { $Rx.Matches("$_") | ForEach-Object { $_.Groups[1].Value } } | Sort-Object -Unique) }
    foreach ($s in @($sources | Where-Object Kind -EQ 'manifest')) {
        if ($s.Step -eq 'start-kit') { continue }
        $m = & $readJson $s.Path
        $cloudKey = @('cloud', 'Cloud' | Where-Object { $m.ContainsKey($_) })[0]
        $tenantKey = @('tenantId', 'TenantId' | Where-Object { $m.ContainsKey($_) })[0]
        if ($cloudKey) { $cloudSeen += & $src $s $cloudKey $m[$cloudKey] }
        if ($tenantKey) { $tenantSeen += & $src $s $tenantKey $m[$tenantKey] }
        $targets = @(@($m['requests']) | Where-Object { $_ } | ForEach-Object { if ($_['uri']) { $_['uri'] } else { $_['target'] } } | Where-Object { $_ -match 'management\.azure\.com' })
        if ($targets.Count) {
            $subSeen += & $src $s 'requests (Azure Resource Manager)' (@(& $ids $subRx $targets) | ForEach-Object ToLowerInvariant)
            $mgSeen += & $src $s 'requests (Azure Resource Manager)' (& $ids $mgRx $targets)
        }
    }
    foreach ($s in @($sources | Where-Object Kind -EQ 'scopes')) {
        $scopes = @(Import-Csv -LiteralPath (Join-Path $Run.Path $s.Path) | Where-Object { $_.Plane -eq 'Azure' } | ForEach-Object Scope)
        $subSeen += & $src $s 'Scope (Plane Azure)' (@(& $ids $subRx $scopes) | ForEach-Object ToLowerInvariant)
        $mgSeen += & $src $s 'Scope (Plane Azure)' (& $ids $mgRx $scopes)
    }
    $noCloud = 'No cloud kit finished in this run.'
    & $single 'cloud' $cloudSeen $noCloud
    & $single 'tenantId' $tenantSeen $noCloud
    & $list 'azure.subscriptionIds' $subSeen 'No kit read Azure Resource Manager in this run.'
    & $list 'azure.managementGroupIds' $mgSeen 'No kit read a management group in this run.'

    # The sign-in environments follow from the cloud: Microsoft 365 GCC (Moderate) uses the global
    # Graph endpoint and commercial Azure, as the estate inventory itself signs in.
    $c = $fields['cloud']
    foreach ($pair in @(@('graphEnvironment', 'Global'), @('azureEnvironment', 'AzureCloud'))) {
        $fields[$pair[0]] = if ($c.status -eq 'ok') {
            [ordered]@{ status = 'ok'; value = $pair[1]; sources = @([ordered]@{ step = 'estate-inventory'; derivedFrom = 'cloud'; value = $c.value; rule = 'gcc and global both sign in to Global (Microsoft Graph) and AzureCloud (Azure)' }) }
        } else { [ordered]@{ status = $c.status; value = $null; sources = @(); reason = "Follows from cloud, which is $($c.status)." } }
    }

    $label = if ($Mode -eq 'Fixture') { 'fixture' } elseif ($Settings['environmentLabel']) { $Settings['environmentLabel'] } else { 'unlabelled' }
    $doc = [ordered]@{
        schema     = 'fmw-environment-profile/1'
        provenance = [ordered]@{
            runId          = $Run.Id
            mode           = $Mode
            label          = $label
            generatedUtc   = [datetime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
            manifest       = 'EstateInventoryManifest.json'
            manifestSha256 = $ManifestSha256
            sources        = @($sources | ForEach-Object { [ordered]@{ step = $_.Step; file = $_.Path; sha256 = Get-EiFileHash -Path (Join-Path $Run.Path $_.Path) } })
            readOnly       = $true
            controls       = @($req['environment-profile'].controls)
            ksi            = @($req['environment-profile'].ksi)
        }
        fields     = $fields
    }
    $doc | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $Run.Path 'EnvironmentProfile.json') -Encoding utf8
    $doc
}

function Test-EiRun {
    <#
    .SYNOPSIS
        Rechecks SHA256SUMS and the manifest's kit manifest hashes. Returns the problems (none: intact).
    .EXAMPLE
        Test-EiRun -Path C:\FMWLabs\results\estate-inventory\<run>
    #>
    param([Parameter(Mandatory)][string]$Path)
    $problems = [System.Collections.Generic.List[string]]::new()
    foreach ($line in Get-Content -LiteralPath (Join-Path $Path 'SHA256SUMS')) {
        if ($line -notmatch '^([0-9a-f]{64})  (.+)$') { $problems.Add("Bad line: $line"); continue }
        $f = Join-Path $Path $Matches[2]
        if (-not (Test-Path -LiteralPath $f)) { $problems.Add("Missing: $($Matches[2])") }
        elseif ((Get-EiFileHash -Path $f) -ne $Matches[1]) { $problems.Add("Changed: $($Matches[2])") }
    }
    $m = Get-Content -LiteralPath (Join-Path $Path 'EstateInventoryManifest.json') -Raw | ConvertFrom-Json
    foreach ($s in $m.steps) {
        foreach ($k in @($s.kitManifests)) {
            if (-not $k.sha256) { continue }
            $f = Join-Path $Path $k.path
            if (-not (Test-Path -LiteralPath $f) -or (Get-EiFileHash -Path $f) -ne $k.sha256) { $problems.Add("Kit manifest changed: $($k.path)") }
        }
    }
    @($problems)
}

Export-ModuleMember -Function Read-EiSettings, Test-EiStepEnabled, New-EiRunFolder, Get-EiCertificate, Connect-EiCloud, Invoke-EiStep,
    Invoke-EiStartKit, Test-EiNeedsAzure, Get-EiKitPlan, Complete-EiKitStep, Invoke-EiKitProcess, Write-EiManifest, Test-EiRun,
    Get-EiRequirement, Find-EiStartKitRun, Get-EiProfileSource, Get-EiProfileCount, Write-EiEnvironmentProfile
